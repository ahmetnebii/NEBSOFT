// Shopier ile kart ödemesi: sipariş → tek adetlik Shopier ürünü → müşteri Shopier'de öder → sunucu siparişi API'den okuyup eşleştirir → lisans.
// Kurallar:
//  • Webhook yalnızca tetikleyicidir. İmzası tutsa bile lisans, gövdeye bakılarak değil, PAT ile API'den okunan siparişe göre açılır.
//  • Ürün kimliği, adet, para birimi ve tutar tutmadan lisans açılmaz; tutarsızlıkta sipariş "ödeme bekliyor" kalır, yönetici uyarılır, onay elle verilir.
//  • Webhook gelmese de ödeme yakalanır: bekleyen siparişler arka planda ve dönüş sayfasından sorgulanır.
//  • Aynı Shopier siparişi iki kez işlenmez (shopier_orders birincil anahtarı); aynı ürüne ikinci ödeme "çift ödeme" uyarısı üretir.
//  • Gerçek hesapla denenene kadar (ayarlar: verifiedAt) seçenek yalnızca yöneticinin yazdığı deneme müşterisine görünür.
const db = require('./db');
const sec = require('./security');
const secrets = require('./secrets');
const mail = require('./mail');
const shopier = require('./shopier');
const { route, A, err, site, audit, setting, setSetting, applyOrder, paidMail, mailTo, fmtTL } = require('./routes');

const EVENT = 'order.created';
const HOOK = '/api/odeme/shopier/webhook';
const TTL_H = 48; // ödenmeyen bağlantı bu süreden sonra kapatılır
const J = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const raw = () => setting('shopier', {});
// Gizli alanlar düz metin olarak yalnızca bu dosyanın içinde açılır, hiçbir yanıta konmaz
async function conf() { const s = (await raw()) || {}; return { ...s, pat: secrets.dec(s.pat) || '', webhookToken: secrets.dec(s.webhookToken) || '' }; }
const isLocalUrl = (u) => { try { return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(u).hostname); } catch (e) { return true; } };
const imageOf = async (s) => { if (s.imageUrl) return s.imageUrl; const u = String((await site()).siteUrl || '').replace(/\/$/, ''); return /^https?:\/\//.test(u) ? `${u}/assets/icons/icon-512.png` : ''; };
const showTo = (s, user) => !!(s.pat && user && (s.verifiedAt || (s.testEmail && String(user.email).toLowerCase() === s.testEmail)));
async function usable(user) { return showTo(await conf(), user); }

// ---------- Ödeme başlatma ----------
async function start(o) {
  const s = await conf(); if (!s.pat) return { ok: false, error: 'Kart ile ödeme şu anda kullanılamıyor' };
  const image = await imageOf(s); if (!image) return { ok: false, error: 'Kart ile ödeme henüz yapılandırılmadı' };
  // Çift tıklama iki ürün açmasın: satırı önce tutan kazanır
  const ins = await db.q("INSERT IGNORE INTO shopier_payments (order_id, amount, status, closed, created, updated) VALUES (?,?,'aciliyor',0,?,?)", [o.id, o.total, new Date(), new Date()]);
  if (!ins.affectedRows) {
    const p = await db.one('SELECT * FROM shopier_payments WHERE order_id=?', [o.id]);
    if (['uyusmazlik', 'cift-odeme', 'onaylandi'].includes(p.status)) return { ok: false, error: 'Bu sipariş için alınan ödeme inceleniyor; yeniden ödeme yapmayın' }; // uyarı kaydı yeni bağlantıyla silinmesin
    if (p.product_url && !p.closed) return { ok: true, url: p.product_url };
    if (p.status === 'aciliyor' && Date.now() - new Date(p.updated).getTime() < 30e3) return { ok: false, error: 'Ödeme bağlantısı hazırlanıyor, lütfen birkaç saniye sonra tekrar deneyin' };
    await db.q("UPDATE shopier_payments SET status='aciliyor', product_id=NULL, product_url=NULL, closed=0, updated=? WHERE order_id=?", [new Date(), o.id]);
  }
  try {
    const p = await shopier.call(s.pat, 'POST', '/products', shopier.productBody(o, image));
    const id = p && p.id != null ? String(p.id) : '';
    const priceOk = p && p.priceData && shopier.kurus(p.priceData.price) === shopier.kurus(o.total);
    if (!id || !shopier.safeUrl(p.url) || !priceOk) { if (id) await shopier.call(s.pat, 'DELETE', `/products/${encodeURIComponent(id)}`).catch(() => {}); throw new shopier.ShopierError('Shopier yanıtı doğrulanamadı'); }
    await db.q("UPDATE shopier_payments SET product_id=?, product_url=?, status='bekliyor', updated=? WHERE order_id=?", [id, String(p.url), new Date(), o.id]);
    return { ok: true, url: String(p.url) };
  } catch (e) {
    await db.q('DELETE FROM shopier_payments WHERE order_id=? AND product_id IS NULL', [o.id]).catch(() => {});
    console.error('[shopier] ödeme başlatılamadı:', o.no, e.message);
    return { ok: false, error: e instanceof shopier.ShopierError ? 'Kart ödemesi şu anda başlatılamadı. Havale ile ödeyebilir veya biraz sonra tekrar deneyebilirsiniz.' : 'Beklenmeyen bir hata oluştu' };
  }
}

// ---------- Eşleştirme ----------
async function warnAdmin(o, detail) {
  const c = { ip: 'shopier', user: null }; await audit(c, 'Shopier uyarısı', `${o.no}: ${detail}`, o.tenant_id);
  try { const m = await mail.settings(); const s = await site(); if (m.user) mailTo(m.replyTo || m.user, `Shopier ödemesi kontrol gerekiyor — ${o.no}`, { title: 'Shopier ödemesi elle kontrol edilmeli', intro: `${o.no} (${fmtTL(o.total)}) için otomatik onay yapılmadı.`, blocks: [{ type: 'note', tone: 'warn', text: detail }, { type: 'button', label: 'Yönetim paneline git', url: `${s.siteUrl || ''}/admin/#/shopier` }] }); } catch (e) { /* e-posta olmasa da panel uyarısı kalır */ }
}
// Tek Shopier siparişini işler. Tamamı işlemde: aynı anda gelen webhook ve sorgulama lisansı iki kez uzatamaz.
async function processOne(pay, so) {
  if (!so || so.id == null) return null;
  const shopId = String(so.id).slice(0, 64);
  if (shopier.evaluate({ total: pay.amount }, pay.product_id, so).state === 'ignore') return null;
  if (so.paymentStatus !== 'paid') return null;
  const out = await db.tx(async (t) => {
    const o = (await t.q('SELECT * FROM orders WHERE id=? FOR UPDATE', [pay.order_id]))[0]; if (!o) return null;
    const v = shopier.evaluate(o, pay.product_id, so); if (v.state === 'ignore' || v.state === 'wait') return null;
    const ins = await t.q("INSERT IGNORE INTO shopier_orders (shop_id, order_id, product_id, total, currency, result, at) VALUES (?,?,?,?,?,'isleniyor',?)", [shopId, o.id, pay.product_id, String((so.totals && so.totals.total) || '').slice(0, 20), String(so.currency || '').slice(0, 8), new Date()]);
    if (!ins.affectedRows) return null; // aynı Shopier siparişi daha önce işlendi
    let result = 'eslesti'; let detail = '';
    if (v.state === 'mismatch') { result = 'uyusmazlik'; detail = v.reasons.join('; '); }
    else if (o.status === 'odendi') { result = 'cift-odeme'; detail = `Sipariş zaten ödenmişken yeni Shopier ödemesi geldi (#${shopId}). İade gerekebilir.`; }
    else if (o.status !== 'odeme-bekliyor') { result = 'uyusmazlik'; detail = `İptal edilmiş siparişe Shopier ödemesi geldi (#${shopId}). İade gerekebilir.`; }
    if (result === 'eslesti') {
      await t.q("UPDATE orders SET status='odendi', paid_at=?, approved_by=NULL, note=? WHERE id=?", [new Date(), `Shopier sipariş #${shopId}`.slice(0, 255), o.id]);
      await applyOrder(t, o);
      await t.q("UPDATE shopier_payments SET status='onaylandi', shop_order_id=?, updated=? WHERE order_id=?", [shopId, new Date(), o.id]);
    } else await t.q('UPDATE shopier_payments SET status=?, alert=?, updated=? WHERE order_id=?', [result, detail.slice(0, 255), new Date(), o.id]);
    await t.q('UPDATE shopier_orders SET result=?, detail=? WHERE shop_id=?', [result, detail.slice(0, 255), shopId]);
    return { result, detail, o };
  });
  if (!out) return null;
  if (out.result === 'eslesti') { await audit({ ip: 'shopier', user: null }, 'Shopier ödemesi onaylandı', `${out.o.no} · #${shopId}`, out.o.tenant_id); paidMail(out.o.id).catch(() => {}); } else await warnAdmin(out.o, out.detail);
  closeLater(out.o.id); // sonuç ne olursa olsun bağlantı kapanır: uyuşmazlıkta müşteri ikinci kez ödeyemesin
  return out;
}
// Sipariş için Shopier'i sorgular. Webhook, dönüş sayfası ve arka plan taraması aynı yoldan geçer.
async function check(orderId) {
  const pay = await db.one('SELECT * FROM shopier_payments WHERE order_id=?', [orderId]); if (!pay || !pay.product_id) return null;
  const s = await conf(); if (!s.pat) return null;
  await db.q('UPDATE shopier_payments SET last_check=? WHERE order_id=?', [new Date(), orderId]);
  const list = await shopier.call(s.pat, 'GET', `/orders?productId=${encodeURIComponent(pay.product_id)}&limit=50&sort=dateAsc`);
  if (!Array.isArray(list)) throw new shopier.ShopierError('Shopier sipariş listesi okunamadı');
  for (const so of list) await processOne(pay, so);
  return true;
}
// Sipariş ödendi/iptal edildi: önce son bir sorgu (geç gelen ödeme kaçmasın), sonra ürün kaldırılır. Silinemezse tarama yeniden dener.
async function close(orderId) {
  const pay = await db.one('SELECT * FROM shopier_payments WHERE order_id=?', [orderId]); if (!pay || !pay.product_id || pay.closed) return false;
  const s = await conf(); if (!s.pat) return false;
  await check(orderId);
  try { await shopier.call(s.pat, 'DELETE', `/products/${encodeURIComponent(pay.product_id)}`); } catch (e) { if (e.status !== 404) throw e; }
  await db.q('UPDATE shopier_payments SET closed=1, updated=? WHERE order_id=?', [new Date(), orderId]);
  return true;
}
const closeLater = (id) => { setImmediate(() => close(id).catch((e) => console.error('[shopier] ürün kapatılamadı:', id, e.message))); };

// Arka plan taraması: ilk 2 saat her turda, sonra 30 dakikada bir. 429 gelirse tur biter.
let scanning = false;
async function scan() {
  if (scanning || !db.ready()) return; scanning = true;
  try {
    const s = await conf(); if (!s.pat) return;
    const rows = await db.q("SELECT p.order_id, p.created, p.last_check, o.status FROM shopier_payments p JOIN orders o ON o.id=p.order_id WHERE p.closed=0 AND p.product_id IS NOT NULL ORDER BY p.last_check IS NOT NULL, p.last_check LIMIT 40");
    for (const r of rows) {
      const age = Date.now() - new Date(r.created).getTime(); const since = r.last_check ? Date.now() - new Date(r.last_check).getTime() : Infinity;
      try {
        if (r.status !== 'odeme-bekliyor' || age > TTL_H * 3600e3) await close(r.order_id);
        else if (age < 2 * 3600e3 || since > 30 * 60e3) await check(r.order_id);
        const cur = await db.one('SELECT o.status, p.closed FROM orders o JOIN shopier_payments p ON p.order_id=o.id WHERE o.id=?', [r.order_id]);
        if (cur && cur.status === 'odendi' && !cur.closed) await close(r.order_id);
      } catch (e) { if (e.status === 429) break; console.error('[shopier] tarama:', r.order_id, e.message); }
    }
    await db.q('DELETE FROM shopier_events WHERE at < ?', [new Date(Date.now() - 30 * 864e5)]);
  } finally { scanning = false; }
}
setInterval(() => scan().catch((e) => console.error('[shopier] tarama:', e.message)), Number(process.env.SHOPIER_SCAN_MS) || 60e3).unref();

// ---------- Uç noktalar ----------
// Shopier 5 saniye içinde 200 bekler: yanıt hemen döner, sorgulama arkada yapılır. İmza tutmazsa hiçbir işlem yapılmaz.
route('POST', HOOK, { auth: 'none', csrf: false, raw: true, bodyMax: 512e3, limit: ['shopierwh', 600, 60e3] }, async (c) => {
  const s = await conf(); const h = c.req.headers;
  if (!shopier.verifySignature(c.raw, h['shopier-signature'], s.webhookToken)) { await audit(c, 'Shopier webhook reddedildi', 'imza geçersiz'); throw err(401, 'İmza geçersiz'); }
  await setSetting('shopier_hook', { at: new Date().toISOString() }); // ayrı anahtar: eşzamanlı PAT kaydını ezmez
  if (String(h['shopier-event'] || '') !== EVENT) return { ok: true };
  const hookId = String(h['shopier-webhook-id'] || '').slice(0, 80);
  if (hookId) { const r = await db.q('INSERT IGNORE INTO shopier_events (id, event, at) VALUES (?,?,?)', [hookId, EVENT, new Date()]); if (!r.affectedRows) return { ok: true, duplicate: true }; }
  const body = J(c.raw.toString('utf8'), {}); const pids = (Array.isArray(body.lineItems) ? body.lineItems : []).map((l) => String((l && l.productId) || '')).filter(Boolean).slice(0, 20);
  for (const pid of pids) { const p = await db.one('SELECT order_id FROM shopier_payments WHERE product_id=?', [pid]); if (p) setImmediate(() => check(p.order_id).catch((e) => console.error('[shopier] webhook sorgusu:', e.message))); }
  return { ok: true };
});
route('GET', '/api/odeme/yontemler', { auth: 'user' }, async (c) => ({ ok: true, shopier: await usable(c.user) }));
const myOrder = async (c) => { const o = await db.one('SELECT * FROM orders WHERE id=? AND tenant_id=?', [c.params.id, c.user.tenant_id || '-']); if (!o) throw err(404, 'Sipariş bulunamadı'); return o; };
route('POST', '/api/orders/:id/shopier', { auth: 'user', limit: ['shopierstart', 20, 3600e3] }, async (c) => {
  const o = await myOrder(c); if (o.status !== 'odeme-bekliyor') throw err(400, 'Sipariş ödeme beklemiyor');
  if (!(await usable(c.user))) throw err(400, 'Bu ödeme yöntemi şu anda kullanılamıyor');
  const r = await start(o); if (!r.ok) throw err(503, r.error); await audit(c, 'Shopier ödemesi başlatıldı', o.no); return { ok: true, url: r.url };
});
// Dönüş sayfası: "paid" yalnızca sipariş veritabanında gerçekten ödendiyse döner, gerisi "kontrol ediliyor"
route('GET', '/api/orders/:id/odeme', { auth: 'user' }, async (c) => {
  let o = await myOrder(c); let p = await db.one('SELECT status, product_url, closed, last_check FROM shopier_payments WHERE order_id=?', [o.id]);
  if (p && o.status === 'odeme-bekliyor' && !p.closed && sec.limit(`shopierpoll:${o.id}`, 1, 10e3)) { await check(o.id).catch((e) => console.error('[shopier] sorgu:', e.message)); o = await db.one('SELECT * FROM orders WHERE id=?', [o.id]); p = await db.one('SELECT status, product_url, closed, last_check FROM shopier_payments WHERE order_id=?', [o.id]); }
  return { ok: true, status: o.status, shopier: p ? { state: ['uyusmazlik', 'cift-odeme'].includes(p.status) ? 'inceleme' : o.status === 'odendi' ? 'odendi' : p.closed ? 'kapandi' : 'kontrol', url: !p.closed && o.status === 'odeme-bekliyor' ? p.product_url : null } : null };
});

// Yönetim paneli
const superOnly = (c) => { if (c.user.role !== 'superadmin') throw err(403, 'Bu ayarı yalnız süper yönetici değiştirebilir'); };
const hookUrl = async () => `${String((await site()).siteUrl || '').replace(/\/$/, '')}${HOOK}`;
async function adminView() {
  const s = await conf(); const url = await hookUrl();
  const alerts = await db.q("SELECT p.order_id, p.status, p.alert, p.updated, o.no, o.total, o.status AS order_status FROM shopier_payments p JOIN orders o ON o.id=p.order_id WHERE p.status IN ('uyusmazlik','cift-odeme') ORDER BY p.updated DESC LIMIT 100");
  const [cnt] = await db.q("SELECT COUNT(*) AS n FROM shopier_payments p JOIN orders o ON o.id=p.order_id WHERE p.closed=0 AND p.product_id IS NOT NULL AND o.status='odeme-bekliyor'");
  return { ok: true, hasPat: !!s.pat, imageUrl: s.imageUrl || '', image: await imageOf(s), testEmail: s.testEmail || '', verifiedAt: s.verifiedAt || null, verifiedBy: s.verifiedBy || '', webhook: { registered: !!s.webhookToken, url, lastAt: ((await setting('shopier_hook', {})) || {}).at || null }, pending: cnt.n, alerts, live: !!(s.pat && s.verifiedAt) };
}
A('GET', '/shopier', adminView);
A('PUT', '/shopier', async (c) => {
  superOnly(c); const b = c.body || {}; const cur = (await raw()) || {}; const next = { ...cur };
  if (b.clear) { delete next.pat; delete next.webhookToken; delete next.webhookId; delete next.verifiedAt; delete next.verifiedBy; }
  else if (b.pat) { const pat = String(b.pat).trim(); if (!/^[\x21-\x7e]{16,4096}$/.test(pat)) throw err(400, 'Anahtar biçimi geçersiz'); next.pat = secrets.enc(pat); }
  if (b.imageUrl !== undefined) { const u = sec.clean(b.imageUrl, 300); if (u && !/^https:\/\/.+\.(jpe?g|png|bmp)$/i.test(u)) throw err(400, 'Görsel adresi https ile başlayıp jpg, png veya bmp ile bitmeli'); next.imageUrl = u; }
  if (b.testEmail !== undefined) { const e = String(b.testEmail || '').trim().toLowerCase(); if (e && !sec.V.email(e)) throw err(400, 'Geçerli bir e-posta girin'); next.testEmail = e; }
  if (b.verified === true && !next.verifiedAt) { if (!next.pat) throw err(400, 'Önce anahtarı kaydedin'); next.verifiedAt = new Date().toISOString(); next.verifiedBy = c.user.email; }
  if (b.verified === false) { delete next.verifiedAt; delete next.verifiedBy; }
  await setSetting('shopier', next);
  await audit(c, 'Shopier ayarları', `${b.clear ? 'anahtar silindi' : b.pat ? 'anahtar güncellendi' : 'ayar'}${b.verified === true ? ' · müşterilere açıldı' : b.verified === false ? ' · müşterilere kapatıldı' : ''}`);
  return adminView();
});
A('POST', '/shopier/test', async () => { const s = await conf(); try { await shopier.call(s.pat, 'GET', '/products?limit=1'); return { ok: true }; } catch (e) { throw err(400, e instanceof shopier.ShopierError ? e.message : 'Bağlantı denenemedi'); } }, { limit: ['shopiertest', 20, 600e3] });
// Token yalnızca oluşturma yanıtında döner: aynı adrese eski abonelik varsa silinir, yenisi açılır, token şifreli saklanır
A('POST', '/shopier/webhook', async (c) => {
  superOnly(c); const s = await conf(); const url = await hookUrl();
  if (!/^https:\/\//.test(url) || isLocalUrl(url)) throw err(400, 'Webhook için Site Ayarları\'nda https ile başlayan gerçek site adresi gerekli. Webhook olmadan da ödemeler sorgulanarak yakalanır.');
  try {
    const list = await shopier.call(s.pat, 'GET', '/webhooks?limit=50');
    for (const w of Array.isArray(list) ? list : []) if (w && w.url === url && w.event === EVENT && w.id != null) await shopier.call(s.pat, 'DELETE', `/webhooks/${encodeURIComponent(w.id)}`);
    const w = await shopier.call(s.pat, 'POST', '/webhooks', { event: EVENT, url });
    if (!w || !w.token) throw new shopier.ShopierError('Shopier webhook anahtarı döndürmedi');
    await setSetting('shopier', { ...(await raw()), webhookToken: secrets.enc(String(w.token)), webhookId: String(w.id || '') });
  } catch (e) { throw err(400, e instanceof shopier.ShopierError ? e.message : 'Webhook kaydedilemedi'); }
  await audit(c, 'Shopier webhook kaydedildi', url); return adminView();
});
A('POST', '/shopier/kontrol/:id', async (c) => { try { await check(c.params.id); } catch (e) { throw err(400, e instanceof shopier.ShopierError ? e.message : 'Sorgulanamadı'); } const o = await db.one('SELECT status FROM orders WHERE id=?', [c.params.id]); return { ok: true, status: o ? o.status : null }; });

module.exports = { usable, start, closeLater, scan, check, close };
