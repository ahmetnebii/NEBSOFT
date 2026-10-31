// E-ticaret vitrininde online ödeme: iyzico, PayTR, Papara, Paynet, Craftgate (farklar odeme-saglayici.js'te). Kart bilgisi sağlayıcının sayfasına girilir, bu sunucudan geçmez.
// Kurallar:
//  • Anahtar işletmenin kendi entegrasyon kaydından okunur, para işletmenin kendi hesabına geçer. Anahtar hiçbir yanıta konmaz.
//  • Bağlantıyı dene geçmeden ve kayıtlı bilgi değişince ödeme açılmaz.
//  • Tutarı sunucu sipariş kaydından alır; müşteri yalnız kimlik numarasını gönderir, o da saklanmaz.
//  • Dönüş ve webhook yalnızca tetikleyicidir: sonuç sağlayıcıdan sorgulanır, imza + sipariş + tutar tutmadan "ödendi" yazılmaz. PayTR bildirimi imzalıdır, imza tutarsa sonuç bildirimin kendisidir.
//  • Test (sandbox) ödemesi payTest ile işaretlenir, her yerde TEST görünür, ciroya girmez.
//  • Canlı mod sağlayıcı kilidi (IYZICO_CANLI=1, PAYTR_CANLI=1 ...) olmadan kapalıdır: test hesabıyla denenene kadar gerçek kart çekilmez.
//  • Ödenmeyen siparişin stoğu TTL sonunda geri eklenir, önce sağlayıcıya son kez sorulur.
const db = require('./db');
const sec = require('./security');
const belge = require('./belge');
const secrets = require('./secrets');
const log = require('./log');
const iyz = require('./iyzico');
const ent = require('./entegrasyon');
const { canliAcik } = require('./entegrasyon/odeme-kilit');
const { TUM, paytr } = require('./odeme-saglayici');
const { route, err, site, hesapRolu, valid } = require('./routes');
const { readToken } = require('./public');
const APP = 'eticaret'; const J = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
const TTL = () => Number(process.env.ETICARET_ODEME_TTL_MS) || 30 * 60e3;
const tah = () => require('./tahsilat-odeme'); // borç tahsilatı aynı geri çağrı uçlarını kullanır, kayıt kimliği hangi tarafa ait olduğunu söyler
const isle = async (tid, id, hazir) => ((await tah().kayit(tid, id)) ? tah().tamamla(tid, id, hazir) : tamamla(tid, id, hazir));
const sgOf = (o) => TUM[(o.payment && o.payment.provider) || 'iyzico'];
const hataKapat = (e, on) => { if (e instanceof iyz.IyzicoHata || e.name === 'SaglayiciHata') throw err(502, `${on}${e.message}`); throw e; };
const trGun = (d) => new Date(new Date(d).getTime() + 3 * 3600e3).toISOString().slice(0, 10);

async function ayar(tid) {
  const r = await db.one("SELECT data, version FROM app_data WHERE tenant_id=? AND app='entegrasyon'", [tid]); if (!r) return null;
  const d = await belge.oku(tid, 'entegrasyon', r); if (!d) return null;
  const c = ((secrets.open('entegrasyon', d) || {}).cfg || {}).payment || {};
  const sg = TUM[c.provider]; if (!sg) return null; const anahtar = `payment:${c.provider}`;
  const test = c.sandbox !== false; if (!test && !canliAcik(c.provider.toUpperCase())) return null;
  const durum = await db.one("SELECT durum, parmak FROM entegrasyon_durum WHERE tenant_id=? AND tur='payment' AND saglayici=?", [tid, c.provider]);
  if (!durum || durum.durum !== 'bagli' || durum.parmak !== ent.parmakIzi(anahtar, { ...c, sandbox: test })) return null;
  return { ...c, sandbox: test, test, saglayici: c.provider };
}
// Vitrinin görmesi gereken tek bilgi: kart açık mı, test mi. Anahtar gitmez
const gorunum = async (t) => { const a = await ayar(t.id); return a ? { kartOdeme: { test: a.test, ad: TUM[a.saglayici].ad, tc: TUM[a.saglayici].tc } } : {}; };

const siparisOku = async (tid, id) => { const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [tid, APP]); const d = r && await belge.oku(tid, APP, r); return d ? { doc: d, o: (d.orders || []).find((x) => x.id === id) } : { doc: null, o: null }; };
// Tek sipariş üzerinde işlem: belge kilitlenir, panelden gelen yazma sürüm numarasıyla çakışmayı yakalar
async function siparisYaz(tid, id, fn) {
  return db.tx(async (tx) => {
    const row = (await tx.q('SELECT data, version FROM app_data WHERE tenant_id=? AND app=? FOR UPDATE', [tid, APP]))[0]; if (!row) return null;
    const doc = await belge.oku(tid, APP, row); const o = doc && (doc.orders || []).find((x) => x.id === id); if (!o) return null;
    const son = fn(o, doc); if (son === false) return o;
    await tx.q('UPDATE app_data SET data=?, version=version+1, updated=? WHERE tenant_id=? AND app=?', [await belge.kapat(tid, APP, JSON.stringify(doc)), new Date(), tid, APP]); return o;
  });
}
const satirYaz = (tid, oid, durum) => db.q('UPDATE eticaret_odeme SET durum=?, updated=? WHERE tenant_id=? AND order_id=?', [durum, new Date(), tid, oid]);

// Ödeme sonucunu iyzico'dan alıp siparişe işler. Aynı sonuç iki kez gelse de iş bir kez yapılır
// hazir: imzası doğrulanmış bildirimden gelen sonuç (PayTR). Yoksa sonuç sağlayıcıdan sorgulanır
async function tamamla(tid, oid, hazir) {
  const { o } = await siparisOku(tid, oid); if (!o || !o.payment || !o.payment.token) return null;
  if (o.payStatus === 'alindi') return 'odendi';
  const a = await ayar(tid); if (!a) return null;
  const k = hazir || await sgOf(o).sonuc(a, o);
  if (k.durum === 'bekliyor' || k.durum === 'basarisiz') { if (k.durum === 'basarisiz') await siparisYaz(tid, oid, (x) => { if (x.payStatus !== 'bekliyor') return false; x.payment = { ...x.payment, hata: k.neden || 'Ödeme tamamlanamadı' }; }); return k.durum; }
  await siparisYaz(tid, oid, (x) => {
    if (x.payStatus === 'alindi') return false; const at = new Date().toISOString();
    x.payment = { ...x.payment, ...(k.bilgi || {}), at, hata: k.neden || undefined };
    x.payStatus = { odendi: 'alindi', inceleme: 'inceleme' }[k.durum] || 'kontrol';
    if (k.durum === 'odendi' && k.bilgi) x.installment = k.bilgi.installment;
    (x.history = x.history || []).push({ at, status: x.status, note: { odendi: 'Kart ödemesi alındı', inceleme: `${sgOf(x).ad} ödemeyi inceliyor`, reddedildi: `${sgOf(x).ad} ödemeyi reddetti`, uyusmazlik: `Ödeme kontrol edilmeli: ${k.neden}` }[k.durum] });
  });
  await satirYaz(tid, oid, { odendi: 'odendi', inceleme: 'inceleme' }[k.durum] || 'kontrol');
  if (k.durum === 'uyusmazlik') log.uygulama.hata('odeme.uyusmazlik', `${o.no}: ${k.neden}`);
  return k.durum;
}
// Süresi dolan sipariş: stok ve kupon geri alınır, kayıt silinmez
async function dusur(tid, oid) {
  await siparisYaz(tid, oid, (x, doc) => {
    if (x.payStatus !== 'bekliyor' || x.status !== 'yeni') return false;
    (x.items || []).forEach((i) => { const p = (doc.products || []).find((y) => y.id === i.pid); const v = p && (p.variants || []).find((y) => y.id === i.vid); if (v) v.stock = Number(v.stock) + Number(i.qty); });
    const k = x.coupon && (doc.coupons || []).find((y) => y.code === x.coupon); if (k && k.uses > 0) k.uses -= 1;
    x.status = 'iptal'; x.payStatus = 'odenmedi'; (x.history = x.history || []).push({ at: new Date().toISOString(), status: 'iptal', note: 'Kart ödemesi tamamlanmadı, stok geri eklendi' });
  });
  await satirYaz(tid, oid, 'iptal');
}
async function tara() {
  if (!db.ready()) return; const sinir = new Date(Date.now() - TTL());
  const L = await db.q("SELECT tenant_id, order_id, durum FROM eticaret_odeme WHERE durum='inceleme' OR (durum='bekliyor' AND created < ?) LIMIT 200", [sinir]);
  for (const r of L) { try { const s = await tamamla(r.tenant_id, r.order_id); if (r.durum === 'bekliyor' && s !== 'odendi' && s !== 'inceleme' && s !== 'reddedildi' && s !== 'uyusmazlik') await dusur(r.tenant_id, r.order_id); } catch (e) { log.uygulama.hata('odeme.tarama', e.message); } }
}
setInterval(() => tara().catch(() => {}), Number(process.env.ETICARET_ODEME_TARA_MS) || 300e3).unref();

// public.js kancaları
const kayitSonrasi = async (t, eklenen) => { for (const [n, r] of eklenen) if (n === 'orders' && r.pay === 'kart') await db.q("INSERT IGNORE INTO eticaret_odeme (tenant_id, order_id, durum, created, updated) VALUES (?,?,'bekliyor',?,?)", [t.id, r.id, new Date(), new Date()]); };
const islemOncesi = async (t, ops) => { if (ops.some((o) => o && o.c === 'orders' && o.op === 'ins' && o.rec && o.rec.pay === 'kart') && !(await ayar(t.id))) throw err(409, 'Kartla ödeme bu mağazada kapalı. Başka bir ödeme yöntemi seçin.'); };

const kisi = (ad) => { const p = String(ad || '').trim().split(/\s+/); const s = p.length > 1 ? p.pop() : p[0]; return { name: p.join(' ') || s, surname: s }; };
const gsm = (t) => { const d = String(t || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? `+90${d}` : ''; };
async function geriAdres(c) { const u = String((await site()).siteUrl || '').replace(/\/$/, ''); if (/^https?:\/\//.test(u)) return u; const h = String(c.req.headers.host || ''); return `https://${/^[a-z0-9.:-]+$/i.test(h) ? h : 'localhost'}`; }
async function isletme(slug) { if (!/^[a-z0-9-]{1,80}$/.test(String(slug))) return null; const t = await db.one("SELECT id, slug, status FROM tenants WHERE slug=?", [slug]); return t && t.status === 'active' ? t : null; }

// Ödemeyi başlatır, müşteri dönen adrese yönlendirilir
route('POST', '/api/public/:slug/eticaret/odeme/baslat', { auth: 'none', limit: ['iyzbaslat', 20, 60e3], bodyMax: 4e3 }, async (c) => {
  const t = await isletme(c.params.slug); if (!t) throw err(404, 'İşletme bulunamadı');
  const lic = await db.one('SELECT status, end FROM licenses WHERE tenant_id=? AND product=?', [t.id, APP]); if (!valid(lic)) throw err(402, 'Bu hizmet şu anda kullanılamıyor');
  const ident = readToken(c.body.token, t.id, APP); if (!ident || ident.k !== 'o') throw err(401, 'Sipariş oturumu bulunamadı. Sipariş takibinden devam edin.');
  const a = await ayar(t.id); if (!a) throw err(409, 'Kartla ödeme bu mağazada kapalı'); const sg = TUM[a.saglayici];
  const tc = String(c.body.tc || '').replace(/\D/g, ''); if (sg.tc && !/^[1-9]\d{10}$/.test(tc)) throw err(400, 'T.C. kimlik numarasını 11 hane olarak girin');
  const { doc, o } = await siparisOku(t.id, ident.i); if (!o || o.pay !== 'kart') throw err(404, 'Sipariş bulunamadı');
  if (o.payment && o.payment.token) { const s = await tamamla(t.id, o.id); if (s === 'odendi') return { ok: true, odendi: true }; if (s === 'inceleme' || s === 'uyusmazlik' || s === 'reddedildi') throw err(409, 'Bu siparişin ödemesi inceleniyor, yeniden ödeme yapmayın'); }
  if (o.status !== 'yeni' || o.payStatus !== 'bekliyor') throw err(409, 'Bu sipariş için ödeme alınamaz');
  if (!(o.total > 0)) throw err(400, 'Sipariş tutarı geçersiz');
  const m = (doc.customers || []).find((x) => x.id === o.customer) || {}; const k = kisi(o.ship.name); const tel = gsm(o.ship.phone); const eposta = String(m.email || c.body.email || '').trim().slice(0, 120); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) throw err(400, 'Kartla ödeme için e-posta adresi gerekir'); if (!tel) throw err(400, 'Telefon numarası geçersiz');
  const geri = await geriAdres(c); const donus = `${geri}/t/${t.slug}/apps/${APP}/magaza.html#/tesekkurler/${encodeURIComponent(o.no)}`;
  const f = await sg.baslat(a, o, { geri, slug: t.slug, donus, donusSunucu: `${geri}/api/odeme/donus/${t.slug}/${o.id}`, ip: String(c.ip || ''), adSoyad: String(o.ship.name), ad: k.name, soyad: k.surname, tc, eposta, gsm: tel }).catch((e) => hataKapat(e, 'Ödeme başlatılamadı: '));
  await siparisYaz(t.id, o.id, (x) => { x.payTest = a.test; x.payment = { provider: a.saglayici, token: f.token, ...(f.oid ? { oid: f.oid } : {}), test: a.test, startedAt: new Date().toISOString() }; });
  return { ok: true, ...(f.iframe ? { iframe: f.iframe } : { url: f.url }) };
});

const yonlen = (t, no) => htmlYon(`/t/${t.slug}/apps/${APP}/magaza.html#/tesekkurler/${encodeURIComponent(no || '')}`);
const htmlYon = (u) => { return { __raw: true, type: 'text/html; charset=utf-8', body: `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${u}"><title>Ödeme sonucu</title></head><body><p><a href="${u}">Sayfaya dönün</a></p></body></html>` }; };
// Sağlayıcı müşteriyi buraya döndürür. Gövdeye ve adres parametrelerine güvenilmez, sonuç kayıtlı belirteçle sorgulanır
const donus = async (c) => {
  const t = await isletme(c.params.slug); if (!t) throw err(404, 'İşletme bulunamadı');
  try { await isle(t.id, c.params.id); } catch (e) { log.uygulama.hata('odeme.donus', e.message); }
  const h = await tah().kayit(t.id, c.params.id); if (h) return htmlYon(tah().sayfa(t, h));
  const { o } = await siparisOku(t.id, c.params.id); return yonlen(t, o && o.no);
};
const DONUS = { auth: 'none', csrf: false, raw: true, bodyMax: 8e3, limit: ['iyzdonus', 120, 60e3] };
route('POST', '/api/odeme/iyzico/donus/:slug/:id', DONUS, donus);
route('POST', '/api/odeme/donus/:slug/:id', DONUS, donus); route('GET', '/api/odeme/donus/:slug/:id', DONUS, donus);
// Papara ve Paynet bildirimi yalnız tetikler, 200 dönülmezse sağlayıcı yeniden dener
route('POST', '/api/odeme/bildirim/:saglayici/:slug/:id', { auth: 'none', csrf: false, raw: true, bodyMax: 16e3, limit: ['iyzwh', 600, 60e3] }, async (c) => {
  const t = await isletme(c.params.slug); if (t) { try { await isle(t.id, c.params.id); } catch (e) { log.uygulama.hata('odeme.bildirim', e.message); } } return { ok: true };
});
// PayTR bildirimi panelde tanımlanan tek adrese gelir. İmza doğrulanır, yanıt yalnız OK olur: OK alınmazsa PayTR yeniden dener
const duz = (m) => ({ __raw: true, type: 'text/plain; charset=utf-8', body: m });
route('POST', '/api/odeme/paytr/bildirim/:slug', { auth: 'none', csrf: false, raw: true, bodyMax: 8e3, limit: ['iyzwh', 600, 60e3] }, async (c) => {
  const t = await isletme(c.params.slug); if (!t) return duz('HATA'); const b = Object.fromEntries(new URLSearchParams(c.raw.toString('utf8')));
  const a = await ayar(t.id); if (!a || a.saglayici !== 'paytr' || !ent.bul('payment:paytr').bildirimGecerli(a, b)) { log.uygulama.hata('paytr.bildirim', 'imza veya ayar tutmadı'); return duz('HATA'); }
  const id = paytr.siparisOf(b.merchant_oid); const h = await tah().kayit(t.id, id); const o = h ? tah().nesne(h) : (await siparisOku(t.id, id)).o; if (!o || !o.payment || o.payment.oid !== b.merchant_oid) return duz('OK'); // eski deneme: işlenmez, tekrar gönderilmesin
  if (b.status === 'success') await isle(t.id, id, paytr.karar(o, { payment_amount: Number(b.payment_amount) / 100, payment_total: Number(b.total_amount) / 100, test_mode: b.test_mode })); else await isle(t.id, id, { durum: 'basarisiz', neden: String(b.failed_reason_msg || 'Ödeme tamamlanamadı').slice(0, 200) }); // bildirimde tutar kuruştur
  return duz('OK');
});
// Webhook yalnız tetikler: müşteri dönmeden sekmeyi kapatsa da ödeme yakalanır
route('POST', '/api/odeme/iyzico/webhook/:slug', { auth: 'none', csrf: false, raw: true, bodyMax: 16e3, limit: ['iyzwh', 600, 60e3] }, async (c) => {
  const t = await isletme(c.params.slug); if (!t) return { ok: true }; const b = J(c.raw.toString('utf8')); const id = b && String(b.paymentConversationId || '').slice(0, 40);
  if (id) { try { await isle(t.id, id); } catch (e) { log.uygulama.hata('iyzico.webhook', e.message); } } return { ok: true };
});

// Yönetici iadesi: aynı gün ve tam tutarsa iptal, diğerinde iade. Çift tıklama iki iade açmasın diye satır kilitlenir
route('POST', '/api/eticaret/siparis/:id/iade', { auth: 'user', limit: ['iyziade', 30, 60e3], bodyMax: 2e3 }, async (c) => {
  const tid = c.user.tenant_id; if (!tid) throw err(403, 'İşletme hesabı gerekir');
  if (await hesapRolu(c.user, APP)) throw err(403, 'İade yetkiniz yok');
  const tutar = Math.round(Number(c.body.tutar) * 100) / 100; if (!(tutar > 0)) throw err(400, 'İade tutarı geçersiz');
  const k = await db.q('UPDATE eticaret_odeme SET kilit=? WHERE tenant_id=? AND order_id=? AND (kilit IS NULL OR kilit < ?)', [new Date(), tid, c.params.id, new Date(Date.now() - 60e3)]); if (!k.affectedRows) throw err(409, 'Bu sipariş için iade işleniyor');
  try {
    const { o } = await siparisOku(tid, c.params.id); if (!o || !o.payment || !o.payment.paymentId) throw err(404, 'Bu siparişte kart ödemesi yok');
    if (o.payStatus !== 'alindi') throw err(409, 'Ödeme alınmadan iade yapılamaz');
    const once = (o.onlineIade || []).reduce((n, x) => n + Number(x.tutar), 0); const kalan = Math.round((o.total - once) * 100) / 100; if (tutar > kalan) throw err(400, `En çok ${kalan} TL iade edilebilir`);
    const a = await ayar(tid); if (!a) throw err(409, 'Ödeme bağlantısı kapalı'); const sg = sgOf(o); if (sg.iadeYok) throw err(409, sg.iadeYok);
    const tam = !once && iyz.kurus(tutar) === iyz.kurus(o.total) && trGun(o.payment.at) === trGun(Date.now());
    const r = await sg.iade(a, o, tutar, tam).catch((e) => hataKapat(e, ''));
    await siparisYaz(tid, o.id, (x) => { (x.onlineIade = x.onlineIade || []).push({ at: new Date().toISOString(), tutar, ref: r.ref, tur: r.tur, by: c.user.name || c.user.email || '' }); });
    return { ok: true, tutar, tur: r.tur };
  } finally { await db.q('UPDATE eticaret_odeme SET kilit=NULL WHERE tenant_id=? AND order_id=?', [tid, c.params.id]).catch(() => {}); }
});
// Panelde gösterilecek bağlantı durumu
route('GET', '/api/eticaret/odeme/durum', { auth: 'user' }, async (c) => { const t = await db.one('SELECT slug FROM tenants WHERE id=?', [c.user.tenant_id]); const a = await ayar(c.user.tenant_id); return { ok: true, bagli: !!a, test: a ? a.test : null, canli: !!a && canliAcik(a.saglayici.toUpperCase()), saglayici: a ? a.saglayici : '', webhook: t ? `${await geriAdres(c)}/api/odeme/iyzico/webhook/${t.slug}` : '', paytrBildirim: t ? `${await geriAdres(c)}/api/odeme/paytr/bildirim/${t.slug}` : '' }; });

module.exports = { gorunum, kayitSonrasi, islemOncesi, tara, tamamla, ayar, geriAdres, isletme, hataKapat };
