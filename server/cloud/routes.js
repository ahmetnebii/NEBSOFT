// NEBSOFT bulut API'si. Her uç nokta: kimlik (yok / müşteri / admin / süper admin), CSRF ve istek sınırı kurallarıyla tanımlanır.
const crypto = require('crypto');
const db = require('./db');
const cfg = require('./config');
const sec = require('./security');
const auth = require('./auth');
const cat = require('./catalog');
const mail = require('./mail');
const secrets = require('./secrets');
const belge = require('./belge');
const pinler = require('./pin');
const cfgMod = require('./config');
const bizsite = require('../../core/bizsite');
const odeme = () => require('./odeme'); // döngüsel bağımlılık olmasın diye çağrı anında yüklenir
const log = require('./log');
const analitik = require('./analitik');
const destek = require('./destek');
const indirim = require('./indirim');
const kural = require('./rol-kural');
const totp = require('./totp');

const uid = auth.uid;
const now = () => new Date();
const iso = (d) => new Date(d).toISOString();
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 864e5);
const addMonths = (d, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const err = (code, msg, extra) => Object.assign(new Error(msg), { status: code, extra });
const J = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const licKey = (pid) => `NEB-${pid.toUpperCase().slice(0, 4).padEnd(4, 'X')}-${crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{4}/g).join('-')}`;
const slugify = (s) => String(s).toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'isletme';

async function setting(k, d) { const r = await db.one('SELECT v FROM settings WHERE k=?', [k]); return r ? J(r.v, r.v) : d; }
async function setSetting(k, v) { await db.q('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [k, JSON.stringify(v)]); }
const DEFAULTS = { trialDays: 7, siteName: 'NEBSOFT', phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', address: '', referralDays: 30, siteUrl: '', googleVerify: '' };
async function site() { return { ...DEFAULTS, ...(await setting('site', {})) }; }
// Denetim kaydı log.js üzerinden aynı audit tablosuna yazılır; ayrıntı alanı maskelenir (e-posta ve IP güvenlik kaydı için açık kalır)
async function audit(c, action, detail, tenant) { await log.denetim(action, { kullanici: c.user ? c.user.id : null, isletme: tenant || (c.user ? c.user.tenant_id : null), ip: c.ip, mesaj: String(detail || '').slice(0, 500) }); }

// Lisans geçerli mi (deneme veya aktif ve süresi dolmamış)
const valid = (l) => l && ['deneme', 'aktif'].includes(l.status) && new Date(l.end) > now();
async function licenses(tenantId) { return db.q('SELECT id, product, plan, period, branches, status, start, end, lic_key FROM licenses WHERE tenant_id=? ORDER BY product', [tenantId]); }
async function canUseApp(user, app) {
  if (!user || !user.tenant_id) return false;
  const L = await licenses(user.tenant_id);
  if (cat.SHARED.includes(app)) return L.some(valid);
  return valid(L.find((l) => l.product === app));
}
async function tenantOf(user) { return user && user.tenant_id ? db.one('SELECT * FROM tenants WHERE id=?', [user.tenant_id]) : null; }

// Lisansları sipariş kalemlerine göre aç / uzat
async function applyOrder(t, order) {
  const items = J(order.items, []);
  for (const it of items) {
    if (it.type === 'support') continue; // destek kalemi lisans açmaz, aşağıda işletmenin paketine yazılır
    const pids = it.pid === 'bundle' ? cat.products().map((p) => p.id) : [it.pid];
    const months = it.period === 'yillik' ? 12 : 1;
    for (const pid of pids) {
      const ex = (await t.q('SELECT * FROM licenses WHERE tenant_id=? AND product=? FOR UPDATE', [order.tenant_id, pid]))[0];
      if (ex) {
        const base = new Date(ex.end) > now() && ex.status !== 'deneme' ? new Date(ex.end) : now();
        await t.q('UPDATE licenses SET plan=?, period=?, branches=?, status=?, end=?, order_id=? WHERE id=?', [it.plan, it.period, it.qty || 1, 'aktif', addMonths(base, months), order.id, ex.id]);
      } else await t.q('INSERT INTO licenses (id, tenant_id, product, plan, period, branches, status, start, end, lic_key, order_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [uid(), order.tenant_id, pid, it.plan, it.period, it.qty || 1, 'aktif', now(), addMonths(now(), months), licKey(pid), order.id]);
    }
  }
  // Tavsiye ödülü: davet edilen işletmenin ilk ödemesinde davet edene ve davet edilene +N gün
  const ten = (await t.q('SELECT * FROM tenants WHERE id=? FOR UPDATE', [order.tenant_id]))[0];
  // Destek paketi yalnızca burada, yani ödeme onaylanınca açılır. Aynı paket uzar; farklı paket bugün başlar (kalan süre aktarılmaz, sepette yazar).
  const sup = items.find((i) => i.type === 'support');
  if (ten && sup) { const devam = ten.support_plan === sup.plan && ten.support_until && new Date(ten.support_until) > now(); await t.q('UPDATE tenants SET support_plan=?, support_until=? WHERE id=?', [sup.plan, addMonths(devam ? ten.support_until : now(), sup.period === 'yillik' ? 12 : 1), ten.id]); }
  if (ten && ten.referred_by && !ten.referral_rewarded) {
    const days = (await site()).referralDays || 30;
    for (const tid of [ten.referred_by, ten.id]) await t.q("UPDATE licenses SET end = DATE_ADD(GREATEST(end, UTC_TIMESTAMP()), INTERVAL ? DAY) WHERE tenant_id=? AND status IN ('aktif','deneme')", [days, tid]);
    await t.q('UPDATE tenants SET referral_rewarded=1 WHERE id=?', [ten.id]);
  }
}

// Ödeme onayı e-postası (havale elle onayı ve Shopier otomatik onayı aynı metni kullanır)
async function paidMail(id) { const o = await db.one('SELECT o.*, u.email, u.name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?', [id]); const s = await site(); if (o) mailTo(o.email, `Ödemeniz onaylandı — ${o.no}`, { title: 'Ödemeniz onaylandı, lisansınız aktif', intro: `Teşekkürler ${String(o.name).split(' ')[0]}! ${fmtTL(o.total)} tutarındaki ödemeniz alındı.`, blocks: [{ type: 'kv', rows: J(o.items, []).map((l) => [l.name || pnameOf(l.pid), `${l.period === 'yillik' ? '12' : '1'} ay`]) }, { type: 'button', label: 'Programlarıma git', url: `${s.siteUrl || ''}/#/programlarim` }, { type: 'p', text: 'Faturanız yasal süre içinde e-Arşiv / e-Fatura olarak iletilecektir.' }] }); }

async function nextOrderNo(t) {
  const r = (await t.q("SELECT v FROM settings WHERE k='order_seq' FOR UPDATE"))[0];
  const n = (r ? Number(J(r.v, 24000)) : 24000) + 1;
  await t.q("INSERT INTO settings (k, v) VALUES ('order_seq', ?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [JSON.stringify(n)]);
  return 'NS' + n;
}
async function couponPct(code) {
  if (!code) return { pct: 0, code: null };
  const k = await db.one('SELECT * FROM coupons WHERE code=? AND active=1', [String(code).toUpperCase().slice(0, 40)]);
  if (!k || (k.max_uses && k.uses >= k.max_uses) || (k.expires && new Date(k.expires) < now())) throw err(400, 'Geçersiz veya süresi dolmuş kupon');
  return { pct: k.pct, code: k.code };
}
// Sepet hesabı: katalog fiyatı + destek kalemi + toplu indirim veya kupon. Quote ve sipariş aynı yoldan geçer, istemciden gelen tutar kullanılmaz.
const SUBE_UST = 1000;
async function fiyatla(b, izinli = []) {
  const k = await couponPct(b.coupon);
  if (b.items && !Array.isArray(b.items)) throw err(400, 'Geçersiz ürün veya paket');
  const lines = b.items && b.items.length ? cat.price(b.items, 0, izinli).lines : [];
  let dl = null;
  if (b.support) {
    if (!destek.has(b.support.plan)) throw err(400, 'Geçersiz destek paketi');
    const l = destek.line(b.support.plan, b.support.period); if (l.price > 0) dl = l; // ücretsiz paket sipariş kalemi olmaz: var olan ücretli paketi düşürmesin
  }
  const hepsi = dl ? [...lines, dl] : lines; if (!hepsi.length) throw err(400, 'Sepet boş');
  // Lisans sayısı istemciden alınmaz: ödenen adetlerin toplamıdır. Şube sayısı beyandır, sipariş kaydında ve panelde görünür.
  const sube = Math.min(SUBE_UST, Math.max(1, Math.floor(Number(b.subeSayisi)) || 1));
  const p = indirim.hesapla({ lines: hepsi, subeSayisi: sube }, { kuponYuzde: k.pct, kdv: cat.VAT });
  return { ...p, sube, destek: dl, coupon: p.indirim && p.indirim.kural === 'kupon' ? k.code : null, kuponGirildi: k.code, sonraki: indirim.sonraki(p) };
}
const indirimKaydi = (p, beyan) => (p.indirim || p.sube > 1 ? { ...(p.indirim || { kural: null, ad: null, yuzde: 0, tutar: 0 }), olcut: p.olcut, beyan: p.sube > 1 ? { subeSayisi: p.sube, onay: !!beyan, at: iso(now()) } : null } : null);
const banks = () => db.q('SELECT id, holder, iban, bank FROM bank_accounts WHERE active=1 ORDER BY created');
const pubOrder = (o) => ({ id: o.id, no: o.no, items: J(o.items, []), subtotal: Number(o.subtotal), discount: Number(o.discount), vat: Number(o.vat), total: Number(o.total), coupon: o.coupon, status: o.status, created: o.created, paid_at: o.paid_at, billing: J(o.billing, {}), indirim: J(o.indirim, null) });

// ---------- E-posta ----------
const mailSite = async () => { const s = await site(); return { siteName: s.siteName, phone: s.phone, email: s.email, siteUrl: s.siteUrl }; };
const mailTo = (to, subject, tpl) => { if (!to) return; mailSite().then((s) => mail.send(to, subject, tpl, s)).catch(() => {}); }; // işlem e-postaları akışı bekletmez
const maskEmail = (e) => String(e).replace(/^(.)(.*)(.@.*)$/, (m, a, b, c) => a + '•'.repeat(Math.min(6, b.length)) + c);
const fmtTL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(n) || 0);
const pnameOf = (id) => (cat.kayitli(id) || {}).name || id;
async function sendCode(email, purpose, name, title, intro) {
  const { code, ticket } = await mail.issueCode(email, purpose, {});
  const r = await mail.send(email, `${code} — ${title}`, { title, intro: `Merhaba${name ? ' ' + name : ''}, ${intro}`, preheader: `Kodunuz: ${code}`, blocks: [{ type: 'code', code }, { type: 'p', text: 'Bu işlemi siz başlatmadıysanız e-postayı dikkate almayın; şifreniz değiştirilmedikçe hesabınız güvende.' }] }, await mailSite());
  if (!r.ok) throw err(503, 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.');
  return ticket;
}
// Lisans bitiş hatırlatmaları: 7, 3 ve 1 gün kala (6 saatte bir kontrol). Deneme lisansları server/cloud/deneme.js dizisindedir.
async function licenseReminders() {
  if (!db.ready() || !(await mail.ready())) return;
  const sent = await setting('lic_mail', {}); const rows = await db.q("SELECT l.id, l.product, l.status, l.end, t.name AS biz, (SELECT email FROM users u WHERE u.tenant_id=t.id AND u.role='customer' ORDER BY created LIMIT 1) AS email, (SELECT name FROM users u WHERE u.tenant_id=t.id AND u.role='customer' ORDER BY created LIMIT 1) AS uname FROM licenses l JOIN tenants t ON t.id=l.tenant_id WHERE l.status='aktif' AND l.end BETWEEN UTC_TIMESTAMP() AND DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 DAY)");
  const s = await site(); let ch = false;
  for (const l of rows) {
    const d = Math.ceil((new Date(l.end) - Date.now()) / 864e5); const step = d <= 1 ? 1 : d <= 3 ? 3 : d <= 7 ? 7 : 0; const k = `${l.id}:${step}`;
    if (!step || sent[k] || !l.email) continue; sent[k] = new Date().toISOString().slice(0, 10); ch = true;
    mailTo(l.email, `${pnameOf(l.product)} ${l.status === 'deneme' ? 'denemeniz' : 'lisansınız'} ${d} gün içinde bitiyor`, { title: `${d} gün kaldı`, intro: `Merhaba ${l.uname || ''}, ${l.biz} için ${pnameOf(l.product)} ${l.status === 'deneme' ? 'ücretsiz deneme süreniz' : 'lisansınız'} ${new Date(l.end).toLocaleDateString('tr-TR')} tarihinde sona eriyor.`,
      blocks: [{ type: 'p', text: 'Süre dolduğunda verileriniz silinmez; yalnızca yeni kayıt girişi durur. Kesintisiz devam etmek için paketinizi şimdi seçebilirsiniz.' }, { type: 'button', label: l.status === 'deneme' ? 'Paketimi seç' : 'Lisansı uzat', url: `${s.siteUrl || ''}/#/hesabim` }] });
  }
  if (ch) { Object.keys(sent).forEach((k) => { if (sent[k] < new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10)) delete sent[k]; }); await setSetting('lic_mail', sent); }
}
setInterval(() => licenseReminders().catch(() => {}), 6 * 3600e3).unref();
setTimeout(() => licenseReminders().catch(() => {}), 60e3).unref();

// Yeni deneme talebi → yöneticiye e-posta (e-posta ayarındaki ana adres)
const trialLen = (s) => Math.min(90, Math.max(1, Number(s.trialDays) || 7));
async function notifyTrialRequest(biz, u, pid) {
  try { const m = await mail.settings(); const s = await site(); if (!m.user) return;
    mailTo(m.replyTo || m.user, `Yeni deneme başladı: ${biz || u.name} · ${pnameOf(pid)}`, { title: 'Yeni deneme başladı', intro: `${biz || u.name} ${pnameOf(pid)} için ${trialLen(s)} günlük denemeye başladı.`, blocks: [{ type: 'kv', rows: [['İşletme', biz || '-'], ['Yetkili', u.name || '-'], ['E-posta', u.email || '-'], ['Telefon', u.phone || '-'], ['Program', pnameOf(pid)]] }, { type: 'button', label: 'Talebi onayla', url: `${s.siteUrl || ''}/admin/#/denemeler` }] });
  } catch (e) { /* yok */ }
}

// Destek paketi: geçerli paket ve bitiş. Süresi dolan ücretli paket varsayılana döner, kayıt silinmez.
function destekDurumu(t) {
  const id = destek.paid(t); const c = destek.load(); const p = destek.pub(c).find((x) => x.id === id); const ucretli = !!t && t.support_plan === id && p.aylik > 0;
  return { ...p, bitis: ucretli ? t.support_until : null, ucretli };
}
// SLA aşımı: her talep bir kez işaretlenir, olay da bir kez yazılır. Arka plan taraması, panel ve yanıt aynı yoldan geçer.
async function slaTara(id) {
  if (!db.ready()) return 0; const an = now();
  const rows = await db.q(`SELECT id, tenant_id, plan, first_reply_at FROM tickets WHERE breached=0 AND status<>'kapali' AND first_due IS NOT NULL AND ((first_reply_at IS NULL AND first_due < ?) OR resolve_due < ?)${id ? ' AND id=?' : ''} LIMIT 500`, id ? [an, an, id] : [an, an]);
  let n = 0;
  for (const t of rows) { const r = await db.q('UPDATE tickets SET breached=1 WHERE id=? AND breached=0', [t.id]); if (r.affectedRows) { n++; log.uygulama.uyari('destek.sla_asildi', { isletme: t.tenant_id, veri: { talep: t.id, paket: t.plan, asama: t.first_reply_at ? 'cozum' : 'ilk-yanit' } }); } }
  return n;
}
setInterval(() => slaTara().catch(() => {}), 5 * 60e3).unref();

// ---------- Uç noktalar ----------
const R = [];
let catAt = 0;
async function syncCatalog(force) { if (!db.ready() || (!force && Date.now() - catAt < 30e3)) return; catAt = Date.now(); try { cat.setOverrides(await setting('catalog', {})); } catch (e) { /* tablo yok */ } }
const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt, fn: async (c) => { await syncCatalog(); return fn(c); } });

// Kurulum
route('GET', '/api/setup/status', { auth: 'none' }, async () => {
  const conf = cfg.load(); let hasAdmin = false;
  if (db.ready()) hasAdmin = !!(await db.one("SELECT id FROM users WHERE role='superadmin' LIMIT 1"));
  // Veritabanı adresi ve adı yalnızca kurulum sırasında (yönetici yokken) gösterilir; kurulumdan sonra herkese açık bu uçtan çıkmaz
  return { ok: true, configured: !!conf, db: db.ready() && !hasAdmin ? db.info() : null, hasAdmin, needsToken: !hasAdmin };
});
route('POST', '/api/setup/sql', { auth: 'none', limit: ['setup', 30, 600e3] }, async (c) => {
  const pw = crypto.randomBytes(18).toString('base64url');
  return { ok: true, password: pw, sql: db.setupSql({ database: c.body.database || 'nebsoft', user: c.body.user || 'nebsoft_app', host: c.body.host || '%', password: pw }) };
});
async function setupGuard(c) {
  const hasAdmin = db.ready() && !!(await db.one("SELECT id FROM users WHERE role='superadmin' LIMIT 1").catch(() => null));
  if (hasAdmin) { const u = await auth.current(c.req); if (!u || u.role !== 'superadmin') throw err(403, 'Bu işlem için süper yönetici girişi gerekli'); return; }
  const tok = cfg.setupToken(true);
  if (!c.body.token || !crypto.timingSafeEqual(Buffer.from(String(c.body.token).padEnd(64).slice(0, 64)), Buffer.from(tok.padEnd(64).slice(0, 64)))) throw err(403, 'Kurulum anahtarı hatalı (sunucudaki data/setup-token.txt dosyasında veya ilk çalıştırma çıktısında yazar)');
}
route('POST', '/api/setup/db', { auth: 'none', limit: ['setupdb', 20, 600e3] }, async (c) => {
  await setupGuard(c);
  const b = c.body; const conn = { host: sec.clean(b.host, 255), port: Number(b.port) || 3306, database: sec.clean(b.database, 64), user: sec.clean(b.user, 64), password: String(b.password || ''), ssl: !!b.ssl, sslVerify: b.sslVerify !== false };
  if (!conn.host || !conn.database || !conn.user) throw err(400, 'Sunucu, veritabanı ve kullanıcı adı gerekli');
  let t; try { t = await db.test(conn); } catch (e) { throw err(400, 'Bağlanılamadı: ' + e.message); }
  cfg.save({ ...(cfg.load() || {}), db: conn });
  const info = await db.connect(conn);
  await audit(c, 'Veritabanı bağlandı', `${conn.host}/${conn.database}`);
  return { ok: true, info, server: t.version };
});
route('POST', '/api/setup/admin', { auth: 'none', limit: ['setupadm', 10, 600e3] }, async (c) => {
  if (!db.ready()) throw err(400, 'Önce veritabanını bağlayın');
  if (await db.one("SELECT id FROM users WHERE role='superadmin' LIMIT 1")) throw err(400, 'Yönetici zaten oluşturulmuş');
  await setupGuard(c);
  const { email, name, pass } = c.body;
  if (!sec.V.email(email) || !sec.V.str(name, 120, 2)) throw err(400, 'Ad ve geçerli e-posta gerekli');
  if (!sec.V.password(pass) || pass.length < 12) throw err(400, 'Yönetici şifresi en az 12 karakter, harf ve rakam içermeli');
  const u = { id: uid(), email: email.toLowerCase().trim(), name: sec.clean(name, 120) };
  await db.q('INSERT INTO users (id, email, pass, name, role, created) VALUES (?,?,?,?,?,?)', [u.id, u.email, await auth.hash(pass), u.name, 'superadmin', now()]);
  cfg.clearSetupToken();
  await auth.createSession(c.req, c.res, u, false);
  await audit({ ...c, user: u }, 'Süper yönetici oluşturuldu', u.email);
  return { ok: true };
});

// Oturum
route('GET', '/api/auth/me', { auth: 'none', db: false }, async (c) => {
  if (!db.ready()) return { ok: true, mode: cfg.load() ? 'offline' : 'setup' };
  const u = await auth.current(c.req); const s = await site();
  const base = { ok: true, mode: 'cloud', trialDays: s.trialDays, site: { name: s.siteName, phone: s.phone, email: s.email, address: s.address }, catalog: cat.overrides(), platform: await setting('platform', { announcements: [], maintenance: {} }), analitik: await analitik.acik() };
  if (!u) return base;
  const t = await tenantOf(u);
  return { ...base, user: { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role }, tenant: t ? { id: t.id, name: t.name, slug: t.slug, ref: t.ref_code, phone: t.phone, address: t.address, city: t.city } : null, licenses: t ? (await licenses(t.id)).map((l) => ({ ...l, valid: valid(l) })) : [], apps: t ? [...(await licenses(t.id)).filter(valid).map((l) => l.product), ...cat.SHARED] : [] };
});
route('POST', '/api/auth/register', { auth: 'none', limit: ['reg', 5, 3600e3] }, async (c) => {
  const b = c.body;
  if (b.website) throw err(400, 'Geçersiz istek'); // bot tuzağı
  if (!sec.V.email(b.email)) throw err(400, 'Geçerli bir e-posta girin');
  if (!sec.V.password(b.pass)) throw err(400, 'Şifre en az 8 karakter olmalı, harf ve rakam içermeli');
  if (!sec.V.str(b.name, 120, 3) || !sec.V.str(b.company, 160, 2)) throw err(400, 'Ad soyad ve işletme adı gerekli');
  if (!sec.V.phone(b.phone || '')) throw err(400, 'Geçerli bir telefon girin');
  if (!b.kvkk) throw err(400, 'KVKK aydınlatma metnini onaylamanız gerekli');
  const email = b.email.toLowerCase().trim();
  if (await db.one('SELECT id FROM users WHERE email=?', [email])) throw err(400, 'Bu e-posta ile kayıtlı bir hesap var. Giriş yapın.');
  // E-posta ayarlıysa önce adrese 6 haneli kod gönderilir; kod doğrulanınca hesap açılır
  const mc = (await mail.ready()) ? await mail.getConfig() : null;
  if (mc && mc.verifySignup !== false) {
    if (!b.ticket) return { ok: true, needCode: true, ticket: await sendCode(email, 'signup', sec.clean(b.name, 120).split(' ')[0], 'e-posta doğrulama kodunuz', 'hesabınızı oluşturmak için bu kodu kayıt ekranına girin.'), to: maskEmail(email) };
    const v = await mail.checkCode(b.ticket, b.code, 'signup'); if (!v.ok) throw err(400, v.error); if (v.email !== email) throw err(400, 'Kod bu e-posta adresi için üretilmedi');
  }
  const ref = b.ref ? await db.one('SELECT id FROM tenants WHERE ref_code=?', [String(b.ref).toUpperCase().slice(0, 16)]) : null;
  const tid = uid(); const u = { id: uid(), email, name: sec.clean(b.name, 120), phone: sec.clean(b.phone, 40), role: 'customer', tenant_id: tid };
  let slug = slugify(b.company); if (await db.one('SELECT id FROM tenants WHERE slug=?', [slug])) slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  const pass = await auth.hash(b.pass); const s = await site();
  await db.tx(async (t) => {
    await t.q('INSERT INTO tenants (id, name, slug, phone, sector, ref_code, referred_by, webhook_token, created) VALUES (?,?,?,?,?,?,?,?,?)', [tid, sec.clean(b.company, 160), slug, u.phone, sec.clean(b.sector, 60), crypto.randomBytes(4).toString('hex').toUpperCase(), ref ? ref.id : null, crypto.randomBytes(16).toString('hex'), now()]);
    await t.q('INSERT INTO users (id, email, pass, name, phone, role, tenant_id, kvkk_at, created) VALUES (?,?,?,?,?,?,?,?,?)', [u.id, email, pass, u.name, u.phone, 'customer', tid, now(), now()]);
    // Hesap ücretsiz açılır; seçilen programın deneme lisansı hemen başlar (yönetici onayı yok)
    if (b.product && cat.satista(b.product) && b.product !== 'bundle') await t.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?)', [uid(), tid, b.product, 1, 'aylik', 'deneme', now(), addDays(now(), trialLen(s)), licKey(b.product)]);
  });
  await auth.createSession(c.req, c.res, u, true);
  await audit({ ...c, user: u }, 'Kayıt', `${u.email} · ${b.company}${ref ? ' · davet' : ''}`, tid);
  if (b.pazarlama === true) await db.q('INSERT INTO mail_prefs (user_id, marketing, marketing_at, marketing_src, marketing_ip, updated) VALUES (?,1,?,?,?,?)', [u.id, now(), 'kayit', c.ip, now()]).catch(() => {});
  if (b.product && cat.satista(b.product)) notifyTrialRequest(sec.clean(b.company, 160), u, b.product);
  mailTo(email, `${s.siteName} hesabınız hazır`, { title: 'Hoş geldiniz! Hesabınız hazır', intro: `Merhaba ${u.name.split(' ')[0]}, ${sec.clean(b.company, 160)} için hesabınız oluşturuldu.`, blocks: [...(b.product && cat.product(b.product) ? [{ type: 'kv', rows: [['Program', pnameOf(b.product)], ['Deneme', `${trialLen(s)} gün ücretsiz, hemen başladı`], ['Hesap', 'Süresiz ve ücretsiz']] }] : []), { type: 'list', items: ['Ürün ve müşterilerinizi Excel ile aktarın', 'Ekibinizi davet edin, her birine yetki verin', 'Telefonunuza uygulama olarak ekleyin'] }, { type: 'button', label: 'Programımı aç', url: `${s.siteUrl || ''}/#/programlarim` }, { type: 'p', text: 'Kurulum veya veri aktarımında takılırsanız bu e-postayı yanıtlayabilirsiniz.' }] });
  return { ok: true };
});
route('POST', '/api/auth/login', { auth: 'none', limit: ['login', 10, 600e3] }, async (c) => {
  // Uygulama kodu adımı: şifre önceki adımda doğrulandı, bilet şifreye bağlıdır
  if (c.body.totpTicket) {
    const b = await totp.biletOku(c.body.totpTicket); if (!b) throw err(400, 'Girişin süresi doldu. Yeniden giriş yapın.');
    const s = await totp.dogrula(b.user.id, c.body.code, { kurtarma: true });
    if (!s.ok) { await audit({ ...c, user: b.user }, 'Hatalı iki adımlı kod', b.user.email); throw err(s.kilit ? 429 : 401, s.hata); }
    await db.q('UPDATE users SET failed=0, locked_until=NULL, last_login=?, last_ip=? WHERE id=?', [now(), c.ip, b.user.id]); await auth.createSession(c.req, c.res, b.user, b.remember);
    await audit({ ...c, user: b.user }, s.tur === 'kurtarma' ? 'Giriş (kurtarma kodu)' : 'Giriş (uygulama kodu)', b.user.email);
    return { ok: true, role: b.user.role, ...(s.tur === 'kurtarma' ? { kurtarmaKalan: s.kalan } : {}) };
  }
  if (!sec.V.email(c.body.email) || typeof c.body.pass !== 'string') throw err(400, 'E-posta ve şifre gerekli');
  // Uygulama kodu etkinse e-posta kodu istenmez; e-posta altyapısına da bağlı değildir
  if (!c.body.ticket && await totp.epostaEtkin(c.body.email.toLowerCase().trim())) {
    const r = await auth.check(c.body.email, c.body.pass); await audit({ ...c, user: r.user }, r.ok ? 'Giriş (uygulama kodu bekleniyor)' : 'Hatalı giriş', c.body.email); if (!r.ok) throw err(401, r.error);
    if (totp.kilitli(await totp.kayit(r.user.id))) throw err(429, totp.KILIT_HATA);
    return { ok: true, needTotp: true, totpTicket: totp.bilet(r.user, !!c.body.remember) };
  }
  const mc = (await mail.ready()) ? await mail.getConfig() : null;
  // Platform yöneticisi her işletmenin verisine erişir: müşteri ayarından bağımsız, e-posta kurulu ise kod zorunlu
  const yonetici = mc && !mc.twoFactorLogin && !!(await db.one("SELECT id FROM users WHERE email=? AND role IN ('admin','superadmin')", [c.body.email.toLowerCase().trim()]));
  if (mc && (mc.twoFactorLogin || yonetici)) {
    if (!c.body.ticket) {
      const r = await auth.check(c.body.email, c.body.pass); await audit({ ...c, user: r.user }, r.ok ? 'Giriş (kod gönderildi)' : 'Hatalı giriş', c.body.email); if (!r.ok) throw err(401, r.error);
      const { code, ticket } = await mail.issueCode(r.user.email, 'login', { uid: r.user.id, remember: !!c.body.remember });
      const sres = await mail.send(r.user.email, `${code} — giriş kodunuz`, { title: 'Giriş doğrulama kodu', intro: `Merhaba ${String(r.user.name).split(' ')[0]}, hesabınıza giriş için kodunuz:`, preheader: `Kodunuz: ${code}`, blocks: [{ type: 'code', code, label: 'Giriş kodu' }, { type: 'kv', rows: [['Zaman', new Date().toLocaleString('tr-TR')], ['IP', c.ip], ['Cihaz', String(c.req.headers['user-agent'] || '').slice(0, 60)]] }, { type: 'note', tone: 'warn', text: 'Bu girişi siz yapmadıysanız şifrenizi hemen değiştirin.' }] }, await mailSite());
      if (!sres.ok) throw err(503, 'Giriş kodu e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.');
      return { ok: true, needCode: true, ticket, to: maskEmail(r.user.email) };
    }
    const v = await mail.checkCode(c.body.ticket, c.body.code, 'login'); if (!v.ok) throw err(400, v.error);
    const u = await db.one("SELECT * FROM users WHERE id=? AND status='active'", [v.meta.uid]); if (!u) throw err(400, 'Hesap bulunamadı');
    if (await totp.etkin(u.id)) throw err(400, 'Bu hesapta uygulama kodu gerekli. Yeniden giriş yapın.'); // kod, koruma açılmadan önce alınmış olabilir
    await db.q('UPDATE users SET failed=0, locked_until=NULL, last_login=?, last_ip=? WHERE id=?', [now(), c.ip, u.id]); await auth.createSession(c.req, c.res, u, !!v.meta.remember);
    await audit({ ...c, user: u }, 'Giriş (kodla)', u.email); return { ok: true, role: u.role };
  }
  const r = await auth.login(c.req, c.res, c.body.email, c.body.pass, !!c.body.remember);
  await audit({ ...c, user: r.user }, r.ok ? 'Giriş' : 'Hatalı giriş', c.body.email);
  if (!r.ok) throw err(401, r.error);
  return { ok: true, role: r.user.role };
});
route('POST', '/api/auth/logout', { auth: 'none' }, async (c) => { await auth.destroySession(c.req, c.res); return { ok: true }; });
route('POST', '/api/auth/password', { auth: 'user', limit: ['pw', 10, 600e3] }, async (c) => {
  const u = await db.one('SELECT * FROM users WHERE id=?', [c.user.id]);
  if (!(await auth.verify(String(c.body.old || ''), u.pass))) throw err(400, 'Mevcut şifre hatalı');
  if (!sec.V.password(c.body.pass)) throw err(400, 'Yeni şifre en az 8 karakter, harf ve rakam içermeli');
  await db.q('UPDATE users SET pass=? WHERE id=?', [await auth.hash(c.body.pass), u.id]);
  await db.q('DELETE FROM sessions WHERE user_id=?', [u.id]); await auth.createSession(c.req, c.res, u, true);
  await audit(c, 'Şifre değişti'); return { ok: true };
});

// Şifremi unuttum: e-posta altyapısı olmadığından talep yönetim panelindeki "Satış Talepleri"ne düşer; yönetici
// işletmenin kullanıcı listesinden geçici şifre üretip müşteriye iletir. Hesabın var olup olmadığı yanıttan anlaşılmaz.
route('POST', '/api/auth/forgot', { auth: 'none', limit: ['forgot', 5, 3600e3] }, async (c) => {
  const b = c.body; if (b.website) return { ok: true };
  if (!sec.V.email(b.email)) throw err(400, 'Geçerli bir e-posta girin');
  if (await mail.ready()) { // e-postayla kod: hesabın varlığı yanıttan anlaşılmaz
    const x = await db.one("SELECT id, name, email FROM users WHERE email=? AND status='active'", [b.email.toLowerCase().trim()]);
    if (x) return { ok: true, mailed: true, ticket: await sendCode(x.email, 'reset', String(x.name).split(' ')[0], 'şifre sıfırlama kodunuz', 'şifrenizi yenilemek için bu kodu girin.'), to: maskEmail(x.email) };
    return { ok: true, mailed: true, ticket: crypto.randomBytes(18).toString('base64url'), to: maskEmail(b.email) };
  }
  const u = await db.one("SELECT u.id, u.name, u.phone, u.email, t.name AS biz FROM users u LEFT JOIN tenants t ON t.id=u.tenant_id WHERE u.email=? AND u.role='customer'", [b.email.toLowerCase().trim()]);
  if (u) {
    const phone = sec.V.phone(b.phone || '') ? sec.clean(b.phone, 40) : u.phone;
    await db.q('INSERT INTO leads (id, name, phone, email, biz, type, product, msg, ip, created) VALUES (?,?,?,?,?,?,?,?,?,?)', [uid(), u.name, phone, u.email, u.biz, 'sifre', null, 'Şifre sıfırlama talebi — işletmenin kullanıcı listesinden geçici şifre üretip müşteriye iletin.', c.ip, now()]);
    await audit({ ...c, user: { id: u.id } }, 'Şifre sıfırlama talebi', u.email);
  }
  return { ok: true };
});

// Telefona / başka cihaza giriş linki: oturumu açık kullanıcı üretir (10 dk, tek kullanımlık); link açılınca o cihazda oturum açılır
route('POST', '/api/auth/link/new', { auth: 'user', limit: ['link', 10, 600e3] }, async (c) => {
  const token = crypto.randomBytes(24).toString('base64url');
  await db.q('DELETE FROM login_links WHERE user_id=? AND (expires < UTC_TIMESTAMP() OR used IS NOT NULL)', [c.user.id]);
  await db.q('INSERT INTO login_links (id, user_id, created, expires, ip) VALUES (?,?,?,?,?)', [auth.sha(token), c.user.id, now(), new Date(Date.now() + 10 * 60e3), c.ip]);
  await audit(c, 'Cihaz giriş linki üretildi'); return { ok: true, path: '/#/baglan/' + token, minutes: 10 };
});
route('POST', '/api/auth/link', { auth: 'none', limit: ['linkuse', 10, 600e3] }, async (c) => {
  const t = String(c.body.token || ''); if (!/^[A-Za-z0-9_-]{20,64}$/.test(t)) throw err(400, 'Geçersiz bağlantı');
  const l = await db.one('SELECT * FROM login_links WHERE id=?', [auth.sha(t)]);
  if (!l || l.used || new Date(l.expires) < now()) throw err(400, 'Bağlantının süresi dolmuş veya daha önce kullanılmış. Bilgisayarınızdan yeni bağlantı üretin.');
  const u = await db.one("SELECT * FROM users WHERE id=? AND status='active'", [l.user_id]); if (!u) throw err(400, 'Hesap bulunamadı');
  await db.q('UPDATE login_links SET used=? WHERE id=?', [now(), l.id]);
  await auth.createSession(c.req, c.res, u, true); await audit({ ...c, user: u }, 'Giriş linkiyle giriş', String(c.req.headers['user-agent'] || '').slice(0, 120)); return { ok: true };
});

route('POST', '/api/auth/reset', { auth: 'none', limit: ['reset', 10, 600e3] }, async (c) => {
  if (!sec.V.password(c.body.pass)) throw err(400, 'Yeni şifre en az 8 karakter olmalı, harf ve rakam içermeli');
  const v = await mail.checkCode(c.body.ticket, c.body.code, 'reset'); if (!v.ok) throw err(400, v.error);
  const u = await db.one("SELECT * FROM users WHERE email=? AND status='active'", [v.email]); if (!u) throw err(400, 'Hesap bulunamadı');
  await db.q('UPDATE users SET pass=?, failed=0, locked_until=NULL WHERE id=?', [await auth.hash(c.body.pass), u.id]); await db.q('DELETE FROM sessions WHERE user_id=?', [u.id]);
  // E-postayı ele geçiren kişi uygulama kodunu atlatamasın: iki adımlı hesapta sıfırlama oturum açmaz, normal giriş gerekir
  const ikiAdim = await totp.etkin(u.id); if (!ikiAdim) await auth.createSession(c.req, c.res, u, true);
  await audit({ ...c, user: u }, 'Şifre e-postayla sıfırlandı', u.email);
  mailTo(u.email, 'Şifreniz değiştirildi', { title: 'Şifreniz değiştirildi', intro: 'Hesabınızın şifresi az önce yenilendi ve diğer cihazlardaki oturumlar kapatıldı.', blocks: [{ type: 'note', tone: 'warn', text: 'Bu işlemi siz yapmadıysanız hemen bizimle iletişime geçin.' }] });
  return { ok: true, role: u.role, ...(ikiAdim ? { girisGerekli: true } : {}) };
});

// Hazır ürün kataloğu (havuz + Open Food Facts); yerel demo modunda da çalışır

// İşletme web sitesi eklentisi: düzenleme, yayınlama, özel alan adı ve siparişler
const addonOn = async (tid, pid) => !!(await db.one("SELECT id FROM licenses WHERE tenant_id=? AND product=? AND status IN ('aktif','deneme') AND end>UTC_TIMESTAMP()", [tid, pid]));
const DOMAIN = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})*\.[a-z][a-z0-9-]{1,62}$/; // son etiket harfle başlar: IP adresi alan adı sayılmaz
// Platformun kendi adresi veya alt alan adı işletmeye verilemez: aksi halde bir işletme ana sayfayı kendi sitesiyle değiştirebilirdi
const bare = (h) => String(h || '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
const urlHost = (u) => { try { return new URL(u).hostname; } catch (e) { return ''; } };
const platformDomain = (domain, ...hosts) => { const d = bare(domain); return hosts.map(bare).filter(Boolean).some((h) => d === h || d.endsWith('.' + h)); };
route('GET', '/api/websitem', { auth: 'user' }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli');
  const t = await db.one('SELECT slug, name, phone, address, city FROM tenants WHERE id=?', [c.user.tenant_id]);
  const s = await db.one('SELECT data, published, domain, domain_tok, domain_ok, orders, updated FROM biz_sites WHERE tenant_id=?', [c.user.tenant_id]);
  return { ok: true, tenant: t, site: s ? { data: J(s.data, {}), published: !!s.published, domain: s.domain || '', alanAdi: alanAdiDurumu(s.domain, s.domain_tok, s.domain_ok), orders: s.orders, updated: s.updated } : null, web: await addonOn(c.user.tenant_id, 'eklenti-web'), siparis: await addonOn(c.user.tenant_id, 'eklenti-siparis') };
});
route('PUT', '/api/websitem', { auth: 'user', bodyMax: 4e6, limit: ['ws', 120, 3600e3] }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli');
  const data = bizsite.clean(c.body.data); const pub = !!c.body.published;
  if (pub && !(await addonOn(c.user.tenant_id, 'eklenti-web'))) throw err(402, 'Sitenizi yayınlamak için Eklenti Mağazası’ndan “İşletme Web Sitesi” eklentisini etkinleştirin. Taslağınız kaydedildi.');
  let domain = String(c.body.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
  if (domain && !DOMAIN.test(domain)) throw err(400, 'Alan adı geçersiz. Örnek: www.isletmeniz.com');
  if (domain && platformDomain(domain, c.req.headers.host, urlHost((await site()).siteUrl))) throw err(400, 'Bu alan adı kullanılamaz');
  // Doğrulanmamış kayıt alan adını tutamaz: gerçek sahibi önce yazılmış olsa da kendi adını alabilir
  if (domain) { const ex = await db.one('SELECT tenant_id, domain_ok FROM biz_sites WHERE domain=? AND tenant_id<>?', [domain, c.user.tenant_id]); if (ex && ex.domain_ok !== 0) throw err(409, 'Bu alan adı başka bir işletmede kayıtlı'); if (ex) await db.q('UPDATE biz_sites SET domain=NULL, domain_tok=NULL, domain_ok=NULL WHERE tenant_id=?', [ex.tenant_id]); }
  const eski = await db.one('SELECT domain, domain_tok, domain_ok FROM biz_sites WHERE tenant_id=?', [c.user.tenant_id]); const ayni = eski && eski.domain === domain;
  const tok = !domain ? null : ayni ? eski.domain_tok : uid() + uid(); const dok = !domain ? null : ayni ? eski.domain_ok : 0; // eski kayıtlar (NULL) doğrulanmış sayılır, davranışı değişmez
  await db.q('INSERT INTO biz_sites (tenant_id, data, published, domain, domain_tok, domain_ok, updated) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE data=VALUES(data), published=VALUES(published), domain=VALUES(domain), domain_tok=VALUES(domain_tok), domain_ok=VALUES(domain_ok), updated=VALUES(updated)', [c.user.tenant_id, JSON.stringify(data), pub ? 1 : 0, domain, tok, dok, now()]);
  await audit(c, 'Web sitesi kaydedildi', pub ? 'yayında' : 'taslak');
  return { ok: true, published: pub, alanAdi: alanAdiDurumu(domain, tok, dok) };
});
// Sahiplik: işletme alan adına TXT kaydı ekler, sunucu DNS'ten okur
const alanAdiDurumu = (domain, tok, dok) => (domain ? { domain, dogrulandi: dok !== 0, kayit: `_nebsoft.${bare(domain)}`, deger: dok === 0 ? `nebsoft-dogrulama=${tok}` : '' } : null);
route('POST', '/api/websitem/alan-adi-dogrula', { auth: 'user', limit: ['wsdns', 30, 3600e3] }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli');
  const s = await db.one('SELECT domain, domain_tok, domain_ok FROM biz_sites WHERE tenant_id=?', [c.user.tenant_id]); if (!s || !s.domain) throw err(400, 'Önce alan adını kaydedin');
  if (s.domain_ok === 0) {
    let txt = []; try { txt = (await require('dns').promises.resolveTxt(`_nebsoft.${bare(s.domain)}`)).map((x) => x.join('')); } catch (e) { txt = []; }
    if (!txt.includes(`nebsoft-dogrulama=${s.domain_tok}`)) return { ok: false, error: 'TXT kaydı bulunamadı. DNS değişikliğinin yayılması birkaç saat sürebilir.', alanAdi: alanAdiDurumu(s.domain, s.domain_tok, 0) };
    await db.q('UPDATE biz_sites SET domain_ok=1 WHERE tenant_id=?', [c.user.tenant_id]); await audit(c, 'Alan adı doğrulandı', s.domain);
  }
  return { ok: true, alanAdi: alanAdiDurumu(s.domain, s.domain_tok, 1) };
});
// Ziyaretçi siparişi → işletmenin gelen kutusu (POS > Online Siparişler, "Web siteniz" kanalı)
// Ziyaretçinin oturumu yoktur (çerez yetkisi kullanılmaz); site sayfası özel başlık göndermez, yalnızca kaynak denetlenir
route('POST', '/api/w/:slug/siparis', { auth: 'none', csrf: false, limit: ['wsip', 8, 600e3] }, async (c) => {
  if (!sec.originOk(c.req)) throw err(403, 'İstek reddedildi (kaynak doğrulanamadı)');
  const t = await db.one("SELECT t.id, t.name FROM tenants t WHERE t.slug=? AND t.status='active'", [String(c.params.slug)]); if (!t) throw err(404, 'İşletme bulunamadı');
  const s = await db.one('SELECT data, published FROM biz_sites WHERE tenant_id=?', [t.id]); const d = s && bizsite.clean(J(s.data, {}));
  if (!s || !s.published || d.mode !== 'siparis' || !(await addonOn(t.id, 'eklenti-web')) || !(await addonOn(t.id, 'eklenti-siparis'))) throw err(403, 'Bu işletme şu an online sipariş almıyor');
  const b = c.body || {}; const name = sec.clean(b.name, 80); const phone = sec.clean(b.phone, 20); const address = sec.clean(b.address, 300);
  if (name.length < 3 || !/^[0-9+ ()-]{10,20}$/.test(phone) || address.length < 8) throw err(400, 'Ad, telefon ve adres bilgilerini eksiksiz girin');
  const P = Object.fromEntries(d.products.map((p) => [p.id, p]));
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 100).map((i) => ({ p: P[String(i.id)], qty: Math.min(99, Math.max(1, Math.floor(Number(i.qty) || 0))) })).filter((i) => i.p && i.p.price > 0);
  if (!items.length) throw err(400, 'Sepet boş');
  const sub = items.reduce((x, i) => x + i.p.price * i.qty, 0); if (d.delivery.min && sub < d.delivery.min) throw err(400, 'En az sipariş tutarının altında');
  const no = 'W' + Date.now().toString(36).toUpperCase().slice(-6);
  const payload = { orderNumber: no, customer: { name, phone, address }, items: items.map((i) => ({ name: i.p.name, sku: i.p.id, quantity: i.qty, price: i.p.price })), totalPrice: Math.round((sub + d.delivery.fee) * 100) / 100, paymentMethod: 'kapıda', note: sec.clean(b.note, 200), source: 'web-sitesi' };
  await db.q('INSERT INTO inbox (tenant_id, channel, payload, at) VALUES (?,?,?,?)', [t.id, 'websitesi', JSON.stringify(payload), now()]);
  await db.q('UPDATE biz_sites SET orders=orders+1 WHERE tenant_id=?', [t.id]);
  const owner = await db.one("SELECT email FROM users WHERE tenant_id=? AND role='customer' ORDER BY created LIMIT 1", [t.id]);
  if (owner) mailTo(owner.email, `Web sitenizden yeni sipariş — ${no}`, { title: 'Yeni web siparişi', intro: `${name} (${phone}) ${payload.totalPrice.toLocaleString('tr-TR')} ₺ tutarında sipariş verdi. Market POS > Online Siparişler ekranında "Siparişleri çek" ile görüntüleyin.` });
  return { ok: true, no };
});

// Takvim aboneliği (iCal): Google / Outlook / Apple takvimine "URL ile abone ol" denerek eklenir, takvim uygulaması
// adresi düzenli aralıklarla yeniden okur. Adres işletmeye (ve isteğe bağlı personele / hekime) özel imzalıdır; imza sunucu anahtarından türetilir.
// Kaynaklar: Randevu (randevular), Klinik (hasta randevuları), CRM (son tarihli görevler, tüm gün etkinliği).
// Gizlilik: kişi adı yalnızca ad + soyadın baş harfiyle yazılır; telefon / not eklenmez. Klinikte randevu nedeni (sağlık verisi) dış takvim servisine gitmez.
const icsEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsTime = (date, hm, plusMin = 0) => { const [y, mo, d] = String(date).split('-').map(Number); const [h, mi] = String(hm || '00:00').split(':').map(Number); const t = new Date(Date.UTC(y, mo - 1, d, h, mi) - 3 * 3600e3 + plusMin * 60e3); return t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }; // Türkiye UTC+3
const icsDay = (date, plusDays = 0) => new Date(Date.parse(String(date).slice(0, 10) + 'T00:00:00Z') + plusDays * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
const shortName = (n) => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] || 'Müşteri'; };
const CAL_APPS = { randevu: 'Randevular', klinik: 'Hasta randevuları', crm: 'CRM görevleri' };
// Randevu adresleri ilk sürümden beri bu imzayla yayınlanıyor (abonelikler bozulmasın); diğer programların imzasına program adı da girer
const calSig = (tid, staff, app = 'randevu') => cfgMod.mac(app === 'randevu' ? `takvim:${tid}:${staff || ''}` : `takvim:${tid}:${app}:${staff || ''}`).slice(0, 24);
const calPeople = (app, d) => (app === 'randevu' ? (d.staff || []).filter((s) => s.active !== false) : app === 'klinik' ? d.doctors || [] : []);
route('GET', '/api/takvim-adres', { auth: 'user' }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli');
  const app = CAL_APPS[c.query.get('app')] ? c.query.get('app') : 'randevu';
  const t = await db.one('SELECT slug FROM tenants WHERE id=?', [c.user.tenant_id]); const r = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]);
  const d = await belge.oku(c.user.tenant_id, app, r, {}); const base = `/api/takvim/${t.slug}.ics`; const a = app === 'randevu' ? '' : `a=${app}&`;
  return { ok: true, app, title: CAL_APPS[app], all: `${base}?${a}k=${calSig(c.user.tenant_id, '', app)}`, staff: calPeople(app, d).map((s) => ({ id: s.id, name: s.name, url: `${base}?${a}p=${encodeURIComponent(s.id)}&k=${calSig(c.user.tenant_id, s.id, app)}` })) };
});
route('GET', '/api/takvim/:file', { auth: 'none', limit: ['ics', 120, 60e3] }, async (c) => {
  const slug = String(c.params.file).replace(/\.ics$/, ''); const staffId = String(c.query.get('p') || ''); const k = String(c.query.get('k') || '');
  const app = CAL_APPS[c.query.get('a')] ? c.query.get('a') : 'randevu';
  const t = await db.one("SELECT id, name FROM tenants WHERE slug=? AND status='active'", [slug]); if (!t || !sec.safeEq(k, calSig(t.id, staffId, app))) throw err(404, 'Takvim bulunamadı');
  const r = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [t.id, app]); const d = await belge.oku(t.id, app, r, {});
  const by = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]));
  const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10); const to = new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); const inRange = (x) => x >= from && x <= to;
  let ev = []; let who = '';
  if (app === 'randevu') {
    const svc = by(d.services); const cus = by(d.customers); const stf = by(d.staff); who = staffId && stf[staffId] ? stf[staffId].name : '';
    ev = (d.appointments || []).filter((a) => inRange(a.date) && a.status !== 'iptal' && (!staffId || a.staff === staffId)).slice(0, 5000).map((a) => ['BEGIN:VEVENT', `UID:${a.id}@nebsoft-${slug}`, `DTSTAMP:${stamp}`, `DTSTART:${icsTime(a.date, a.start)}`, `DTEND:${icsTime(a.date, a.start, Number(a.duration) || 30)}`,
      `SUMMARY:${icsEsc(`${(svc[a.service] || {}).name || 'Randevu'} — ${shortName((cus[a.customer] || {}).name)}`)}`, `DESCRIPTION:${icsEsc(`Personel: ${(stf[a.staff] || {}).name || '-'}${a.status ? ' · Durum: ' + a.status : ''}`)}`, `STATUS:${a.status === 'beklemede' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT']);
  } else if (app === 'klinik') {
    const pat = by(d.patients); const doc = by(d.doctors); const slot = Number((d._settings || {}).slot) || 30; who = staffId && doc[staffId] ? doc[staffId].name : '';
    ev = (d.appts || []).filter((a) => inRange(a.date) && a.status !== 'iptal' && (!staffId || a.doctor === staffId)).slice(0, 5000).map((a) => ['BEGIN:VEVENT', `UID:${a.id}@nebsoft-${slug}-klinik`, `DTSTAMP:${stamp}`, `DTSTART:${icsTime(a.date, a.time)}`, `DTEND:${icsTime(a.date, a.time, slot)}`,
      `SUMMARY:${icsEsc(`Hasta randevusu — ${shortName((pat[a.patient] || {}).name)}`)}`, `DESCRIPTION:${icsEsc(`Hekim: ${(doc[a.doctor] || {}).name || '-'}${a.status ? ' · Durum: ' + a.status : ''}`)}`, 'STATUS:CONFIRMED', 'END:VEVENT']);
  } else {
    const deals = by(d.deals);
    ev = (d.activities || []).filter((a) => a.type === 'gorev' && a.due && inRange(String(a.due).slice(0, 10))).slice(0, 5000).map((a) => ['BEGIN:VEVENT', `UID:${a.id}@nebsoft-${slug}-crm`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDay(a.due)}`, `DTEND;VALUE=DATE:${icsDay(a.due, 1)}`,
      `SUMMARY:${icsEsc(`${a.done ? '✓ ' : ''}Görev: ${String(a.text || '').slice(0, 80)}`)}`, `DESCRIPTION:${icsEsc(`Fırsat: ${(deals[a.deal] || {}).title || (deals[a.deal] || {}).name || '-'}`)}`, `STATUS:${a.done ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT']);
  }
  const name = `${t.name}${who ? ' · ' + who : ''} — ${CAL_APPS[app]}`;
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//NEBSOFT//${app}//TR`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsEsc(name)}`, 'X-WR-TIMEZONE:Europe/Istanbul', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', ...ev.flat(), 'END:VCALENDAR'].join('\r\n') + '\r\n';
  return { __raw: true, type: 'text/calendar; charset=utf-8', body };
});

// Destek asistanı: yanıtlanamayan sorular ve geri bildirimler (veritabanı yoksa bellekte tutulur)
const kbMem = [];
route('POST', '/api/destek/kayit', { auth: 'none', db: false, limit: ['kb', 40, 60e3] }, async (c) => {
  const b = c.body || {}; const kind = ['cevapsiz', 'belirsiz', 'olumlu', 'olumsuz'].includes(b.kind) ? b.kind : null; const q = String(b.q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!kind || q.length < 2) return { ok: true };
  const row = { at: new Date(), kind, q, app: String(b.app || '').slice(0, 40), entry: String(b.entry || '').slice(0, 16), page: String(b.page || '').slice(0, 60) };
  if (db.ready()) await db.q('INSERT INTO kb_log (at, kind, q, app, entry, page) VALUES (?,?,?,?,?,?)', [row.at, row.kind, row.q, row.app, row.entry, row.page]);
  else { kbMem.push({ id: kbMem.length + 1, done: 0, ...row }); if (kbMem.length > 1000) kbMem.shift(); }
  return { ok: true };
});

// Herkese açık
route('GET', '/api/banks', { auth: 'none' }, async () => ({ ok: true, banks: await banks() }));
route('POST', '/api/leads', { auth: 'none', limit: ['lead', 5, 3600e3] }, async (c) => {
  const b = c.body; if (b.website) return { ok: true };
  if (!sec.V.str(b.name, 120, 2) || !sec.V.phone(b.phone || '')) throw err(400, 'Ad ve telefon gerekli');
  await db.q('INSERT INTO leads (id, name, phone, email, biz, type, product, msg, ip, created) VALUES (?,?,?,?,?,?,?,?,?,?)', [uid(), sec.clean(b.name, 120), sec.clean(b.phone, 40), sec.clean(b.email, 190), sec.clean(b.biz, 160), sec.clean(b.type, 30), sec.clean(b.product, 40), sec.clean(b.msg, 2000), c.ip, now()]);
  return { ok: true };
});

// Müşteri: deneme, sipariş, lisans, hesap, ekip, destek, tavsiye
route('POST', '/api/trial', { auth: 'user', limit: ['trial', 20, 3600e3] }, async (c) => {
  const pid = String(c.body.product || ''); if (!cat.kayitli(pid) || pid === 'bundle') throw err(400, 'Geçersiz ürün');
  if (!c.user.tenant_id) throw err(400, 'Yönetici hesabıyla deneme başlatılamaz');
  const ex = await db.one('SELECT * FROM licenses WHERE tenant_id=? AND product=?', [c.user.tenant_id, pid]);
  if (!ex && !cat.satista(pid)) throw err(409, 'Bu program şu an yeni satışa kapalı', { code: 'satis-kapali' });
  const s = await site();
  // Eski düzenden kalan onay bekleyen talep: deneme şimdi başlar
  if (ex && ex.status === 'talep') { await db.q("UPDATE licenses SET status='deneme', start=?, end=? WHERE id=?", [now(), addDays(now(), trialLen(s)), ex.id]); await audit(c, 'Deneme başladı', pid); return { ok: true, license: await db.one('SELECT * FROM licenses WHERE id=?', [ex.id]) }; }
  if (ex) return { ok: true, license: ex, existing: true };
  // Deneme hemen başlar (yönetici onayı yok); ürün başına bir kez
  await db.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?)', [uid(), c.user.tenant_id, pid, 1, 'aylik', 'deneme', now(), addDays(now(), trialLen(s)), licKey(pid)]);
  await audit(c, 'Deneme başladı', pid);
  { const t = await tenantOf(c.user); notifyTrialRequest(t ? t.name : '', c.user, pid); }
  mailTo(c.user.email, `${pnameOf(pid)} denemeniz başladı`, { title: `${pnameOf(pid)} hazır`, intro: `${s.trialDays} günlük ücretsiz denemeniz başladı. Tüm özellikleri sınırsız kullanabilirsiniz.`, blocks: [{ type: 'kv', rows: [['Program', pnameOf(pid)], ['Deneme bitişi', addDays(now(), s.trialDays).toLocaleDateString('tr-TR')]] }, { type: 'button', label: 'Programı aç', url: `${s.siteUrl || ''}/#/programlarim` }] });
  return { ok: true, license: await db.one('SELECT * FROM licenses WHERE tenant_id=? AND product=?', [c.user.tenant_id, pid]) };
});
route('POST', '/api/orders/quote', { auth: 'none', limit: ['quote', 120, 60e3] }, async (c) => { const p = await fiyatla(c.body); return { ok: true, coupon: p.coupon, kuponGirildi: p.kuponGirildi, lines: p.lines, subtotal: p.subtotal, discount: p.discount, indirim: p.indirim, vat: p.vat, total: p.total, olcut: p.olcut, kurumsal: p.kurumsal, sonraki: p.sonraki }; });
// Sepetteki paket seçimi: rakamlar yapılandırmadan gelir. Oturum varsa işletmenin geçerli paketi de döner.
route('GET', '/api/destek/paketler', { auth: 'none', db: false }, async (c) => {
  const out = { ok: true, paketler: destek.pub(), varsayilan: destek.load().varsayilan, turler: (indirim.load().kurumsal || {}).turler || {} };
  if (db.ready()) { const u = await auth.current(c.req); const t = await tenantOf(u); if (t) out.aktif = destekDurumu(t); }
  return out;
});
route('POST', '/api/orders', { auth: 'user', limit: ['order', 20, 3600e3] }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'Yönetici hesabıyla sipariş verilemez');
  // Yeni satışa kapalı program: yalnızca lisansı olan işletme yenileyebilir
  const izinli = []; for (const pid of new Set((Array.isArray(c.body.items) ? c.body.items : []).map((i) => String(i && i.pid)))) if (cat.kayitli(pid) && !cat.satista(pid)) { if (!(await db.one('SELECT id FROM licenses WHERE tenant_id=? AND product=?', [c.user.tenant_id, pid]))) throw err(409, 'Bu program şu an yeni satışa kapalı', { code: 'satis-kapali' }); izinli.push(pid); }
  const p = await fiyatla(c.body, izinli);
  if (p.kurumsal) throw err(409, 'Bu adette sipariş kurumsal teklif ile verilir', { code: 'kurumsal' });
  if (p.sube > 1 && c.body.subeBeyan !== true) throw err(400, 'Şube sayısı beyanını onaylayın');
  const b = c.body.billing || {};
  if (!sec.V.str(b.name, 120, 3) || !sec.V.str(b.taxNo, 20, 10) || !sec.V.str(b.address, 300, 5)) throw err(400, 'Fatura bilgileri (ad, VKN/TCKN, adres) eksik');
  const shop = c.body.method === 'shopier'; if (shop && !(await odeme().usable(c.user))) throw err(400, 'Bu ödeme yöntemi şu anda kullanılamıyor');
  if (!shop && !(await banks()).length) throw err(503, 'Ödeme hesabı tanımlı değil. Lütfen destek ile iletişime geçin.');
  const billing = { name: sec.clean(b.name, 120), company: sec.clean(b.company, 160), taxNo: sec.clean(b.taxNo, 20), taxOffice: sec.clean(b.taxOffice, 80), address: sec.clean(b.address, 300), city: sec.clean(b.city, 60), email: c.user.email, phone: sec.clean(b.phone, 40) };
  const ind = indirimKaydi(p, c.body.subeBeyan === true);
  const o = await db.tx(async (t) => {
    const no = await nextOrderNo(t); const id = uid();
    await t.q('INSERT INTO orders (id, no, tenant_id, user_id, items, subtotal, discount, vat, total, coupon, status, billing, indirim, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, no, c.user.tenant_id, c.user.id, JSON.stringify(p.lines), p.subtotal, p.discount, p.vat, p.total, p.coupon, 'odeme-bekliyor', JSON.stringify(billing), ind ? JSON.stringify(ind) : null, now()]);
    if (p.coupon) await t.q('UPDATE coupons SET uses=uses+1 WHERE code=?', [p.coupon]); // toplu indirim daha büyükse kupon kullanılmış sayılmaz
    await t.q('UPDATE tenants SET tax_no=?, tax_office=?, address=?, city=? WHERE id=?', [billing.taxNo, billing.taxOffice, billing.address, billing.city, c.user.tenant_id]);
    return (await t.q('SELECT * FROM orders WHERE id=?', [id]))[0];
  });
  await audit(c, shop ? 'Sipariş (Shopier)' : 'Sipariş (havale bekliyor)', `${o.no} · ${o.total} TL`);
  if (p.destek) log.uygulama.bilgi('destek.paket_secildi', { istek: c.istek, kullanici: c.user.id, isletme: c.user.tenant_id, veri: { siparis: o.no, paket: p.destek.plan, donem: p.destek.period, tutar: p.destek.price } });
  if (p.indirim) log.uygulama.bilgi('indirim.uygulandi', { istek: c.istek, kullanici: c.user.id, isletme: c.user.tenant_id, veri: { siparis: o.no, kural: p.indirim.kural, yuzde: p.indirim.yuzde, tutar: p.indirim.tutar, olcut: p.olcut } });
  if (shop) {
    mailTo(c.user.email, `Siparişiniz alındı — ${o.no}`, { title: 'Siparişiniz alındı', intro: `${o.no} numaralı siparişiniz oluşturuldu. Ödemenizi Shopier güvenli ödeme sayfasında tamamladığınızda ödeme kontrol edilir, onaylanınca lisansınız aktifleşir.`, blocks: [{ type: 'kv', rows: [...p.lines.map((l) => [`${l.name} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'}`, fmtTL(l.price)]), ...(p.discount ? [[`İndirim (${p.indirim.ad} %${p.indirim.yuzde})`, '-' + fmtTL(p.discount)]] : []), ['KDV', fmtTL(p.vat)], ['Ödenecek', fmtTL(p.total)]] }] });
    return { ok: true, order: pubOrder(o), banks: await banks(), shopier: await odeme().start(o) };
  }
  { const B = await banks(); mailTo(c.user.email, `Siparişiniz alındı — ${o.no}`, { title: 'Siparişiniz alındı', intro: `${o.no} numaralı siparişiniz oluşturuldu. Havale / EFT ödemeniz hesabımıza geçtiğinde lisansınız otomatik aktifleşir.`, blocks: [{ type: 'kv', rows: [...p.lines.map((l) => [`${l.name} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'}`, fmtTL(l.price)]), ...(p.discount ? [[`İndirim (${p.indirim.ad} %${p.indirim.yuzde})`, '-' + fmtTL(p.discount)]] : []), ['KDV', fmtTL(p.vat)], ['Ödenecek', fmtTL(p.total)]] }, ...B.map((x) => ({ type: 'kv', rows: [['Banka', x.bank], ['Alıcı', x.holder], ['IBAN', String(x.iban).replace(/(.{4})/g, '$1 ').trim()]] })), { type: 'note', tone: 'warn', text: `Açıklamaya mutlaka ${o.no} yazın. Ödeme onaylanana kadar deneme süreniz devam eder.` }] }); }
  return { ok: true, order: pubOrder(o), banks: await banks() };
});
route('GET', '/api/orders', { auth: 'user' }, async (c) => ({ ok: true, orders: (await db.q('SELECT * FROM orders WHERE tenant_id=? ORDER BY created DESC LIMIT 100', [c.user.tenant_id || '-'])).map(pubOrder), banks: await banks() }));
route('POST', '/api/orders/:id/cancel', { auth: 'user' }, async (c) => {
  const r = await db.q("UPDATE orders SET status='iptal' WHERE id=? AND tenant_id=? AND status='odeme-bekliyor'", [c.params.id, c.user.tenant_id || '-']);
  if (!r.affectedRows) throw err(400, 'Yalnızca ödeme bekleyen sipariş iptal edilebilir');
  odeme().closeLater(c.params.id); await audit(c, 'Sipariş iptal (müşteri)', c.params.id); return { ok: true };
});
// Hesabın sahibi işletmenin ilk kullanıcısıdır; ekip üyeleri işletme bilgilerini ve ekibi değiştiremez
const isOwner = async (u) => { if (!u.tenant_id) return false; const o = await db.one('SELECT id FROM users WHERE tenant_id=? ORDER BY created, id LIMIT 1', [u.tenant_id]); return !!o && o.id === u.id; };
const ownerOnly = async (c) => { if (!(await isOwner(c.user))) throw err(403, 'Bu işlemi yalnızca hesap sahibi yapabilir'); };
route('PUT', '/api/account', { auth: 'user' }, async (c) => {
  const b = c.body; if (!sec.V.str(b.name, 120, 3)) throw err(400, 'Ad soyad gerekli');
  if (b.company) await ownerOnly(c);
  await db.q('UPDATE users SET name=?, phone=? WHERE id=?', [sec.clean(b.name, 120), sec.clean(b.phone, 40), c.user.id]);
  if (c.user.tenant_id && b.company) await db.q('UPDATE tenants SET name=?, address=?, city=?, tax_no=?, tax_office=? WHERE id=?', [sec.clean(b.company, 160), sec.clean(b.address, 300), sec.clean(b.city, 60), sec.clean(b.taxNo, 20), sec.clean(b.taxOffice, 80), c.user.tenant_id]);
  return { ok: true };
});
// Ekip listesi. Roller yalnızca hesap sahibine döner; programlar: işletmenin lisansı olan ve sunucu rolü tanımlı programlar.
route('GET', '/api/team', { auth: 'user' }, async (c) => {
  const users = await db.q('SELECT id, email, name, phone, status, last_login, team_roles FROM users WHERE tenant_id=? ORDER BY created, id', [c.user.tenant_id || '-']);
  const sahip = await isOwner(c.user); const temel = ({ team_roles, ...u }) => u;
  if (!sahip) return { ok: true, users: users.map(temel) };
  const L = await licenses(c.user.tenant_id); const programlar = kural.programlar().filter((p) => L.some((l) => l.product === p.app && valid(l))).map((p) => ({ ...p, ad: pnameOf(p.app) }));
  const ik = programlar.find((p) => p.app === 'ik'); if (ik) { const r = await db.one("SELECT data FROM app_data WHERE tenant_id=? AND app='ik'", [c.user.tenant_id]); const d = await belge.oku(c.user.tenant_id, 'ik', r, {}); ik.departmanlar = [...new Set([...String((d._settings || {}).depts || '').split(',').map((x) => x.trim()), ...(Array.isArray(d.employees) ? d.employees.map((e) => e && e.dept) : [])].filter(Boolean))]; }
  for (const p of programlar) if (p.roller.some((x) => x.kisi)) { const r = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, p.app]); p.kisiler = kural.kisiler(p.app, await belge.oku(c.user.tenant_id, p.app, r, {})); }
  return { ok: true, programlar, users: users.map((u, i) => ({ ...temel(u), sahip: i === 0, roller: J(u.team_roles, null) })) };
});
route('POST', '/api/team', { auth: 'user', limit: ['team', 20, 3600e3] }, async (c) => {
  const b = c.body; if (!c.user.tenant_id) throw err(400, 'İşletme hesabı yok'); await ownerOnly(c);
  if (!sec.V.email(b.email) || !sec.V.str(b.name, 120, 2) || !sec.V.password(b.pass)) throw err(400, 'Ad, e-posta ve en az 8 karakterli (harf+rakam) şifre gerekli');
  if (await db.one('SELECT id FROM users WHERE email=?', [b.email.toLowerCase()])) throw err(400, 'Bu e-posta başka bir hesapta kayıtlı');
  const n = await db.one('SELECT COUNT(*) AS n FROM users WHERE tenant_id=?', [c.user.tenant_id]); if (n.n >= 50) throw err(400, 'Kullanıcı sınırına ulaşıldı');
  let roller; try { roller = kural.rollerTemizle(b.roller); } catch (e) { throw err(400, e.message); }
  await db.q('INSERT INTO users (id, email, pass, name, role, tenant_id, created, team_roles) VALUES (?,?,?,?,?,?,?,?)', [uid(), b.email.toLowerCase().trim(), await auth.hash(b.pass), sec.clean(b.name, 120), 'customer', c.user.tenant_id, now(), roller]);
  await audit(c, 'Ekip üyesi eklendi', `${b.email}${roller ? ' · rollü' : ' · tam yetki'}`); return { ok: true };
});
// Program rolü: yalnızca rol-kural.js'teki rol veya boş (tam yetki). Rol her istekte veritabanından okunduğu için oturum kapatmadan sonraki istekte geçerli olur.
route('PUT', '/api/team/:id/rol', { auth: 'user', limit: ['teamrol', 120, 3600e3] }, async (c) => {
  await ownerOnly(c);
  const app = String(c.body.app || ''); const rol = c.body.rol == null ? '' : c.body.rol;
  if (!Object.hasOwn(kural.RULES, app)) throw err(400, 'Bu programda rol tanımı yok');
  if (rol !== '' && !kural.rolVar(app, rol)) throw err(400, 'Geçersiz rol');
  const h = await db.one('SELECT id, tenant_id, team_roles FROM users WHERE id=? AND tenant_id=?', [c.params.id, c.user.tenant_id]); if (!h) throw err(404, 'Kullanıcı bulunamadı');
  if (await isOwner(h)) throw err(400, 'Hesap sahibinin yetkisi kısıtlanamaz');
  await db.q('UPDATE users SET team_roles=? WHERE id=? AND tenant_id=?', [kural.rolYaz(h.team_roles, app, rol, sec.clean(c.body.dept, 80)), h.id, c.user.tenant_id]);
  await audit(c, 'Ekip rolü değişti', `${h.id} · ${app} · ${rol || 'tam yetki'}`); return { ok: true };
});
route('DELETE', '/api/team/:id', { auth: 'user' }, async (c) => {
  if (c.params.id === c.user.id) throw err(400, 'Kendinizi silemezsiniz');
  await ownerOnly(c);
  const r = await db.q('DELETE FROM users WHERE id=? AND tenant_id=?', [c.params.id, c.user.tenant_id || '-']); if (r.affectedRows) { await db.q('DELETE FROM sessions WHERE user_id=?', [c.params.id]); await db.q('DELETE FROM user_totp WHERE user_id=?', [c.params.id]); }
  await audit(c, 'Ekip üyesi silindi', c.params.id); return { ok: true };
});
route('GET', '/api/tickets', { auth: 'user' }, async (c) => ({ ok: true, destek: destekDurumu(await tenantOf(c.user)), paketler: destek.pub(), tickets: (await db.q('SELECT * FROM tickets WHERE tenant_id=? ORDER BY updated DESC LIMIT 100', [c.user.tenant_id || '-'])).map((t) => ({ ...t, messages: J(t.messages, []), sla: destek.state(t) })) }));
route('POST', '/api/tickets', { auth: 'user', limit: ['ticket', 20, 3600e3] }, async (c) => {
  if (!sec.V.str(c.body.subject, 200, 3) || !sec.V.str(c.body.text, 5000, 3)) throw err(400, 'Konu ve mesaj gerekli');
  // Süreler talep açılırken sabitlenir: paket sonradan değişse de bu talep etkilenmez
  const an = now(); const f = destek.ticketFields(destek.paid(await tenantOf(c.user), an), an);
  await db.q('INSERT INTO tickets (id, tenant_id, user_id, subject, product, status, messages, created, updated, plan, priority, first_due, resolve_due) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [uid(), c.user.tenant_id || '-', c.user.id, sec.clean(c.body.subject, 200), sec.clean(c.body.product, 40), 'acik', JSON.stringify([{ from: 'musteri', text: sec.clean(c.body.text, 5000), at: iso(an) }]), an, an, f.plan, f.priority, f.first_due, f.resolve_due]);
  return { ok: true };
});
route('POST', '/api/tickets/:id/reply', { auth: 'user' }, async (c) => {
  const admin = ['admin', 'superadmin'].includes(c.user.role);
  const t = await db.one(admin ? 'SELECT * FROM tickets WHERE id=?' : 'SELECT * FROM tickets WHERE id=? AND tenant_id=?', admin ? [c.params.id] : [c.params.id, c.user.tenant_id || '-']);
  if (!t) throw err(404, 'Talep bulunamadı');
  await slaTara(t.id); // yanıt veya kapanış geç geldiyse aşım, durum değişmeden önce işlenir
  const m = J(t.messages, []);
  if (c.body.close && admin) await db.q("UPDATE tickets SET status='kapali', closed_at=COALESCE(closed_at, ?), updated=? WHERE id=?", [now(), now(), t.id]);
  else {
    if (!sec.V.str(c.body.text, 5000, 1)) throw err(400, 'Mesaj boş'); m.push({ from: admin ? 'destek' : 'musteri', text: sec.clean(c.body.text, 5000), at: iso(now()), by: c.user.name });
    if (admin) await db.q("UPDATE tickets SET messages=?, status='yanitlandi', first_reply_at=COALESCE(first_reply_at, ?), closed_at=NULL, updated=? WHERE id=?", [JSON.stringify(m), now(), now(), t.id]);
    else await db.q("UPDATE tickets SET messages=?, status='acik', closed_at=NULL, updated=? WHERE id=?", [JSON.stringify(m), now(), t.id]);
  }
  return { ok: true };
});
route('GET', '/api/referral', { auth: 'user' }, async (c) => {
  const t = await tenantOf(c.user); if (!t) throw err(400, 'İşletme hesabı yok'); const s = await site();
  const list = await db.q('SELECT name, created, referral_rewarded FROM tenants WHERE referred_by=? ORDER BY created DESC', [t.id]);
  return { ok: true, code: t.ref_code, days: s.referralDays, invited: list.length, rewarded: list.filter((x) => x.referral_rewarded).length, list: list.map((x) => ({ name: x.name.slice(0, 2) + '***', created: x.created, paid: !!x.referral_rewarded })) };
});

// Uygulama verisi (işletme bazlı; lisans kontrollü; iyimser sürüm kontrolüyle çakışma önleme)
const HEALTH = ['klinik', 'eczane', 'veteriner', 'danisan']; const readLog = new Map();
// Hesabın bu programdaki rolü her istekte veritabanından gelir (auth.current). Hesap sahibi ve yönetici kısıtlanamaz. Bozuk kayıt tam yetki sayılmaz.
async function hesapRolu(u, app) {
  if (!u || u.role !== 'customer' || !u.tenant_id || !u.team_roles) return null;
  const k = kural.rolCoz(app, u.team_roles); if (!k) return null;
  if (await isOwner(u)) return null;
  if (k.hata) throw err(403, 'Hesap rolü geçersiz. Hesap sahibine başvurun.');
  return k;
}
const gorunum = (app, k, d) => { const m = pinler.gorunum(secrets.mask(app, d)); return k ? kural.filtrele(app, k.rol, m, { dept: k.dept }) : m; };
const rolAlani = (k) => (k && !k.ortak ? { rol: k.rol, ...(k.dept ? { rolDept: k.dept } : {}) } : {});
route('GET', '/api/data/:app', { auth: 'user' }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Bu uygulama için geçerli lisans veya deneme yok', { code: 'license', app });
  const k = await hesapRolu(c.user, app);
  const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]);
  if (HEALTH.includes(app)) { const k = `${c.user.id}:${app}`; if (Date.now() - (readLog.get(k) || 0) > 3600e3) { if (readLog.size > 50000) readLog.clear(); readLog.set(k, Date.now()); await audit(c, 'Sağlık verisi okundu', app); } }
  const t = await tenantOf(c.user); const ham = r ? await belge.oku(c.user.tenant_id, app, r) : null; const kb = k && !k.ortak ? kural.kisiBilgi(app, k.rol, k.dept, ham) : null;
  return { ok: true, data: r ? gorunum(app, k, ham) : null, version: r ? r.version : 0, tenant: { name: t.name, phone: t.phone, address: t.address, slug: t.slug }, owner: { name: c.user.name }, ...(await isOwner(c.user) ? { hesapSahibi: true } : {}), ...rolAlani(k), ...(kb ? { rolKisi: kb } : {}) };
});
route('GET', '/api/data/:app/v', { auth: 'user' }, async (c) => {
  const r = await db.one('SELECT version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id || '-', String(c.params.app)]);
  return { ok: true, version: r ? r.version : 0 };
});
route('PUT', '/api/data/:app', { auth: 'user', bodyMax: 20e6, limit: ['data', 600, 60e3] }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Lisans süresi doldu — veriler okunabilir ama kaydedilemez', { code: 'license', app });
  const mt = ((await setting('platform', {})).maintenance || {})[app]; if (mt && mt.on && mt.block) throw err(503, 'Program planlı bakımda — kısa süre sonra tekrar deneyin', { code: 'maintenance', app });
  const data = c.body.data; const base = Number(c.body.base) || 0;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw err(400, 'Geçersiz veri');
  const k = await hesapRolu(c.user, app); const prog = k && !k.ortak ? k : null;
  // Rolü değişen hesabın sekmesi eski görünümle yazmasın: süzülmüş belge tam yetkiyle kaydedilirse gizli veri silinirdi
  if (!(k && k.ortak) && (c.body.rol || null) !== (prog ? prog.rol : null)) throw err(409, 'Hesap yetkiniz değişti, sayfa yenileniyor', { code: 'rol', ...rolAlani(prog) });
  const srv = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]);
  const srvDoc = await belge.oku(c.user.tenant_id, app, srv);
  if (k) {
    if (srv && srv.version !== base) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k));
    if (!srv && base !== 0) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k));
    if (!srv && prog) throw err(403, 'Programı önce hesap sahibi açmalıdır');
  }
  // Rolün yazamadığı alanlar, sürümü base'e eşit olan satırdan geri konur; UPDATE aynı sürüme koşulludur. Gizli bilgi mührü bundan sonra uygulanır (şifreli değerler aynen kalır).
  const onaylar = prog && c.body.onay ? await pinler.onayAyikla(db, c.body.onay, c.user.tenant_id, app, c.user.id) : []; const ek = { dept: k && k.dept, onay: new Map() }; onaylar.forEach((o) => ek.onay.set(o.i, (ek.onay.get(o.i) || 0) + 1));
  const yaz = k ? kural.geriKoy(app, k.rol, data, srvDoc, ek) : data;
  // Kimlik bilgileri şifreli saklanır; programın geri gönderdiği yer tutucular mevcut şifreli değeri korur
  const text = await belge.kapat(c.user.tenant_id, app, JSON.stringify(secrets.seal(app, pinler.yazimda(c.user.tenant_id, app, yaz, srvDoc), srvDoc)));
  if (!srv) {
    if (base !== 0) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k));
    try { await db.q('INSERT INTO app_data (tenant_id, app, data, version, updated, updated_by) VALUES (?,?,?,?,?,?)', [c.user.tenant_id, app, text, 1, now(), c.user.id]); } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k)); throw e; }
    return { ok: true, version: 1 };
  }
  // Belirteç yazmadan önce harcanır: aynı belirteçle gelen ikinci istek ya burada ya sürüm denetiminde düşer. Kayıt yazılamazsa geri verilir.
  const secilen = pinler.onaySec(onaylar, ek.harcanan); if (secilen.length && !(await pinler.onayHarca(db, secilen))) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k));
  const r = await db.q('UPDATE app_data SET data=?, version=version+1, updated=?, updated_by=? WHERE tenant_id=? AND app=? AND version=?', [text, now(), c.user.id, c.user.tenant_id, app, base]);
  if (!r.affectedRows) { await pinler.onayGeriVer(db, secilen); throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app, k)); }
  if (ek.reddedilen) await audit(c, 'Yetkili onayı olmadan değişiklik reddedildi', `${app} · ${(ek.redIslem || []).join(', ')} · ${ek.reddedilen.join(', ')}`);
  if (secilen.length) await audit(c, 'Yetkili onayı kullanıldı', `${app} · ${secilen.map((o) => o.i).join(', ')}`);
  // Saatlik anlık görüntü (geri dönüş için son 48 saat)
  const last = await db.one('SELECT at FROM app_data_history WHERE tenant_id=? AND app=? ORDER BY id DESC LIMIT 1', [c.user.tenant_id, app]);
  if (!last || now() - new Date(last.at) > 3600e3) {
    await db.q('INSERT INTO app_data_history (tenant_id, app, version, data, at) VALUES (?,?,?,?,?)', [c.user.tenant_id, app, base + 1, text, now()]);
    await db.q('DELETE FROM app_data_history WHERE tenant_id=? AND app=? AND at < ?', [c.user.tenant_id, app, addDays(now(), -2)]);
  }
  return { ok: true, version: base + 1, ...(ek.onayKullanildi ? { onayKullanildi: true, onayHarcanan: secilen.map((o) => o.sira) } : {}), ...(ek.reddedilen ? { onayRed: ek.reddedilen } : {}) };
});
async function conflict(tid, app, k) { const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [tid, app]); return { code: 'conflict', data: r ? gorunum(app, k, await belge.oku(tid, app, r)) : null, version: r ? r.version : 0, ...rolAlani(k) }; }
// Yetkili onayı: PIN'ler rolü olan hesaba inmediği için karşılaştırma burada yapılır. Hesap + program başına 5 hatada 15 dakika kilit; PIN hiçbir kayda yazılmaz.
const pinHata = new Map(); const PIN_KILIT = 15 * 60e3;
route('POST', '/api/data/:app/pin', { auth: 'user', limit: ['pin', 30, 60e3] }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Bu uygulama için geçerli lisans veya deneme yok', { code: 'license', app });
  const uidIn = typeof c.body.uid === 'string' ? c.body.uid.slice(0, 40) : ''; // personel girişi: seçilen kullanıcı; boşsa yetkili onayı
  const key = `${c.user.id}:${app}:${uidIn}`; const d = pinHata.get(key);
  if (d && d.until > Date.now()) throw err(429, 'Çok fazla hatalı PIN. 15 dakika sonra tekrar deneyin.');
  const pin = String(c.body.pin == null ? '' : c.body.pin).trim().slice(0, 32); const roles = Array.isArray(c.body.roles) ? c.body.roles.filter((x) => typeof x === 'string').slice(0, 10) : [];
  const r = await db.one('SELECT data FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]); const users = (await belge.oku(c.user.tenant_id, app, r, {})).users;
  let hit = null; // sabit süre: tüm kullanıcılar taranır
  for (const u of Array.isArray(users) ? users : []) { const es = pinler.dogrula(c.user.tenant_id, app, u, pin); if (es && !hit && u.active !== false && (uidIn ? u.id === uidIn : u.role === 'admin' || roles.includes(u.role))) hit = u; }
  if (!hit) {
    const n = (d && d.until === 0 ? d.n : 0) + 1; if (pinHata.size > 50000) pinHata.clear();
    pinHata.set(key, { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + PIN_KILIT : 0 });
    await audit(c, 'Yetkili PIN hatalı', `${app} · ${n >= 5 ? 'kilitlendi' : `${n}. deneme`}`);
    throw err(403, 'PIN hatalı');
  }
  pinHata.delete(key); if (!uidIn) await audit(c, 'Yetkili PIN onaylandı', `${app} · ${hit.id}`);
  // Rolü olan hesapta korunan alan yalnızca bu belirteçle değişir. PIN sahibinin rolüne sunucu kuralı karar verir, istemcinin gönderdiği roller değil.
  const hr = !uidIn ? await hesapRolu(c.user, app) : null; const izin = hr && !hr.ortak && !hr.hata ? kural.onayRolleri(app, hr.rol) : null; const islem = typeof c.body.islem === 'string' ? c.body.islem.slice(0, 30) : ''; const tur = izin && kural.onayIslemleri(app, hr.rol).includes(islem);
  return { ok: true, user: { id: hit.id, name: hit.name, role: hit.role }, ...(tur && izin.includes(hit.role) ? { onay: pinler.onayUret(c.user.tenant_id, app, c.user.id, hit.id, islem) } : {}) };
});

// Hesap sahibi yönetici PIN'ini unutursa: hesap şifresiyle yeni PIN belirler. Şifre yalnızca doğrulanır, hiçbir kayda yazılmaz.
route('POST', '/api/data/:app/pin-sifirla', { auth: 'user', limit: ['pinrst', 10, 600e3] }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Lisans süresi doldu — PIN kaydedilemez', { code: 'license', app });
  await ownerOnly(c);
  const key = `rst:${c.user.id}`; const d = pinHata.get(key); if (d && d.until > Date.now()) throw err(429, 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.');
  const yeni = String(c.body.pin == null ? '' : c.body.pin).trim(); if (!/^\d{4}$/.test(yeni)) throw err(400, 'PIN 4 haneli rakam olmalı');
  const u = await db.one('SELECT pass FROM users WHERE id=?', [c.user.id]);
  if (!u || !(await auth.verify(String(c.body.pass || ''), u.pass))) {
    const n = (d && d.until === 0 ? d.n : 0) + 1; if (pinHata.size > 50000) pinHata.clear();
    pinHata.set(key, { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + PIN_KILIT : 0 });
    await audit(c, 'PIN sıfırlama şifresi hatalı', `${app} · ${n >= 5 ? 'kilitlendi' : `${n}. deneme`}`);
    throw err(403, 'Hesap şifresi hatalı');
  }
  const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]); const belgeV = await belge.oku(c.user.tenant_id, app, r);
  const users = belgeV && Array.isArray(belgeV.users) ? belgeV.users : []; const admins = users.filter((x) => x && x.role === 'admin' && x.active !== false);
  const hedef = admins.find((x) => x.id === c.body.uid) || admins[0]; if (!hedef) throw err(400, 'Bu programda yönetici kullanıcı bulunamadı');
  belgeV.users = users.map((x) => { if (x !== hedef) return x; const { pin, ...y } = x; return { ...y, pinH: pinler.ozet(c.user.tenant_id, app, x.id, yeni) }; });
  const q = await db.q('UPDATE app_data SET data=?, version=version+1, updated=?, updated_by=? WHERE tenant_id=? AND app=? AND version=?', [await belge.kapat(c.user.tenant_id, app, JSON.stringify(belgeV)), now(), c.user.id, c.user.tenant_id, app, r.version]);
  if (!q.affectedRows) throw err(409, 'Kayıt o sırada değişti, lütfen tekrar deneyin');
  pinHata.delete(key); pinHata.delete(`${c.user.id}:${app}:${hedef.id}`); pinHata.delete(`${c.user.id}:${app}:`);
  await audit(c, 'Yönetici PIN\'i sıfırlandı', `${app} · ${hedef.id}`);
  return { ok: true, user: { id: hedef.id, name: hedef.name, role: hedef.role } };
});

// ---------- Yönetim (admin) ----------
const A = (m, p, fn, opt = {}) => route(m, '/api/admin' + p, { auth: 'admin', ...opt }, fn);
A('GET', '/summary', async () => {
  const [[t], [l], [o], [p], [lead], [tk]] = await Promise.all([
    db.q('SELECT COUNT(*) AS n FROM tenants'), db.q("SELECT SUM(status='aktif' AND end>UTC_TIMESTAMP()) AS aktif, SUM(status='deneme' AND end>UTC_TIMESTAMP()) AS deneme, SUM(end<=UTC_TIMESTAMP()) AS bitti FROM licenses"),
    db.q("SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS t FROM orders WHERE status='odeme-bekliyor'"), db.q("SELECT COALESCE(SUM(total),0) AS t, COUNT(*) AS n FROM orders WHERE status='odendi' AND paid_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)"),
    db.q("SELECT COUNT(*) AS n FROM leads WHERE status='yeni'"), db.q("SELECT COUNT(*) AS n FROM tickets WHERE status='acik'"),
  ]);
  const daily = await db.q("SELECT DATE(paid_at) AS d, SUM(total) AS t FROM orders WHERE status='odendi' AND paid_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) GROUP BY DATE(paid_at) ORDER BY d");
  const signups = await db.q('SELECT DATE(created) AS d, COUNT(*) AS n FROM tenants WHERE created > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) GROUP BY DATE(created) ORDER BY d');
  const ending = await db.q("SELECT l.product, l.status, l.end, t.name, t.phone FROM licenses l JOIN tenants t ON t.id=l.tenant_id WHERE l.end BETWEEN UTC_TIMESTAMP() AND DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY) ORDER BY l.end LIMIT 30");
  return { ok: true, tenants: t.n, lic: l, pending: o, paid30: p, leads: lead.n, tickets: tk.n, daily, signups, ending, db: db.info() };
});
A('GET', '/orders', async (c) => {
  const st = c.query.get('status'); const rows = await db.q(`SELECT o.*, t.name AS tenant_name, t.phone AS tenant_phone, u.email AS user_email, sp.status AS pay_status, sp.alert AS pay_alert FROM orders o JOIN tenants t ON t.id=o.tenant_id JOIN users u ON u.id=o.user_id LEFT JOIN shopier_payments sp ON sp.order_id=o.id ${st ? 'WHERE o.status=?' : ''} ORDER BY o.created DESC LIMIT 300`, st ? [st] : []);
  return { ok: true, orders: rows.map((o) => ({ ...pubOrder(o), tenant: o.tenant_name, phone: o.tenant_phone, email: o.user_email, note: o.note, shopier: o.pay_status ? { status: o.pay_status, alert: o.pay_alert } : null })) };
});
A('POST', '/orders/:id/approve', async (c) => {
  await db.tx(async (t) => {
    const o = (await t.q('SELECT * FROM orders WHERE id=? FOR UPDATE', [c.params.id]))[0];
    if (!o) throw err(404, 'Sipariş yok'); if (o.status !== 'odeme-bekliyor') throw err(400, 'Sipariş ödeme beklemiyor');
    await t.q("UPDATE orders SET status='odendi', paid_at=?, approved_by=?, note=? WHERE id=?", [now(), c.user.id, sec.clean(c.body.note, 255) || null, o.id]);
    await applyOrder(t, o);
  });
  await audit(c, 'Havale onaylandı', c.params.id);
  await paidMail(c.params.id); odeme().closeLater(c.params.id);
  return { ok: true };
});
A('POST', '/orders/:id/reject', async (c) => {
  const r = await db.q("UPDATE orders SET status='iptal', note=? WHERE id=? AND status='odeme-bekliyor'", [sec.clean(c.body.note, 255) || 'Ödeme alınmadı', c.params.id]);
  if (!r.affectedRows) throw err(400, 'Sipariş ödeme beklemiyor'); odeme().closeLater(c.params.id); await audit(c, 'Sipariş reddedildi', c.params.id); return { ok: true };
});
A('GET', '/banks', async () => ({ ok: true, banks: await db.q('SELECT * FROM bank_accounts ORDER BY created') }));
A('POST', '/banks', async (c) => {
  const b = c.body; const iban = String(b.iban || '').replace(/\s/g, '').toUpperCase();
  if (!sec.V.str(b.holder, 160, 3)) throw err(400, 'Hesap sahibinin adı soyadı / ünvanı gerekli');
  if (!sec.V.iban(iban)) throw err(400, 'Geçersiz IBAN (TR ile başlayan 26 karakter, kontrol hanesi doğru olmalı)');
  if (!sec.V.str(b.bank, 80, 2)) throw err(400, 'Banka adı gerekli');
  if (b.id) await db.q('UPDATE bank_accounts SET holder=?, iban=?, bank=?, active=? WHERE id=?', [sec.clean(b.holder, 160), iban, sec.clean(b.bank, 80), b.active === false ? 0 : 1, b.id]);
  else await db.q('INSERT INTO bank_accounts (id, holder, iban, bank, active, created) VALUES (?,?,?,?,?,?)', [uid(), sec.clean(b.holder, 160), iban, sec.clean(b.bank, 80), 1, now()]);
  await audit(c, 'Banka hesabı kaydedildi', `${b.bank} ${iban.slice(-4)}`); return { ok: true };
});
A('DELETE', '/banks/:id', async (c) => { await db.q('DELETE FROM bank_accounts WHERE id=?', [c.params.id]); await audit(c, 'Banka hesabı silindi', c.params.id); return { ok: true }; });
A('GET', '/tenants', async (c) => {
  const q = `%${sec.clean(c.query.get('q') || '', 80)}%`;
  const rows = await db.q("SELECT t.*, (SELECT email FROM users u WHERE u.tenant_id=t.id ORDER BY created LIMIT 1) AS owner_email, (SELECT COUNT(*) FROM licenses l WHERE l.tenant_id=t.id AND l.status='aktif' AND l.end>UTC_TIMESTAMP()) AS active_lic, (SELECT COUNT(*) FROM licenses l WHERE l.tenant_id=t.id AND l.status='deneme' AND l.end>UTC_TIMESTAMP()) AS trial_lic, (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.tenant_id=t.id AND o.status='odendi') AS revenue FROM tenants t WHERE t.name LIKE ? OR t.phone LIKE ? ORDER BY t.created DESC LIMIT 500", [q, q]);
  return { ok: true, tenants: rows.map(({ webhook_token, ...x }) => x) };
});
A('GET', '/tenants/:id', async (c) => {
  const t = await db.one('SELECT * FROM tenants WHERE id=?', [c.params.id]); if (!t) throw err(404, 'İşletme yok');
  delete t.webhook_token;
  return { ok: true, tenant: t, users: await db.q('SELECT id, email, name, phone, status, last_login, last_ip FROM users WHERE tenant_id=?', [t.id]), licenses: await licenses(t.id), orders: (await db.q('SELECT * FROM orders WHERE tenant_id=? ORDER BY created DESC', [t.id])).map(pubOrder), apps: await db.q('SELECT app, version, updated, LENGTH(data) AS size FROM app_data WHERE tenant_id=?', [t.id]) };
});
A('POST', '/tenants/:id', async (c) => {
  const st = c.body.status; if (!['active', 'suspended'].includes(st)) throw err(400, 'Geçersiz durum');
  await db.q('UPDATE tenants SET status=?, note=? WHERE id=?', [st, sec.clean(c.body.note, 1000), c.params.id]);
  if (st === 'suspended') { await db.q("UPDATE users SET status='disabled' WHERE tenant_id=?", [c.params.id]); await db.q('DELETE s FROM sessions s JOIN users u ON u.id=s.user_id WHERE u.tenant_id=?', [c.params.id]); }
  else await db.q("UPDATE users SET status='active' WHERE tenant_id=?", [c.params.id]);
  await audit(c, st === 'suspended' ? 'İşletme askıya alındı' : 'İşletme aktif', c.params.id, c.params.id); return { ok: true };
});
A('POST', '/licenses/:id', async (c) => {
  const l = await db.one('SELECT * FROM licenses WHERE id=?', [c.params.id]); if (!l) throw err(404, 'Lisans yok');
  const a = c.body.action;
  if (a === 'extend') { const d = Math.min(3660, Math.max(1, Number(c.body.days) || 30)); await db.q('UPDATE licenses SET end=? WHERE id=?', [addDays(new Date(l.end) > now() ? l.end : now(), d), l.id]); }
  else if (a === 'suspend') await db.q("UPDATE licenses SET status='askida' WHERE id=?", [l.id]);
  else if (a === 'activate') await db.q("UPDATE licenses SET status='aktif' WHERE id=?", [l.id]);
  else throw err(400, 'Geçersiz işlem');
  await audit(c, 'Lisans: ' + a, `${l.product} ${c.body.days || ''}`, l.tenant_id); return { ok: true };
});
// Deneme talepleri: listele, onayla (N gün), reddet
A('GET', '/destek-sorular', async () => {
  const rows = db.ready() ? await db.q('SELECT MIN(id) AS id, kind, q, app, entry, COUNT(*) AS n, MAX(at) AS last FROM kb_log WHERE done=0 GROUP BY kind, q, app, entry ORDER BY n DESC, last DESC LIMIT 500')
    : Object.values(kbMem.filter((x) => !x.done).reduce((m, x) => { const k = x.kind + x.q + x.app + x.entry; (m[k] = m[k] || { ...x, n: 0 }).n++; m[k].last = x.at; return m; }, {})).sort((a, b) => b.n - a.n);
  return { ok: true, rows };
}, { db: false });
A('POST', '/destek-sorular/kapat', async (c) => { const { kind, q, app } = c.body || {}; if (db.ready()) await db.q('UPDATE kb_log SET done=1 WHERE kind=? AND q=? AND app=?', [kind, q, app]); else kbMem.forEach((x) => { if (x.kind === kind && x.q === q && x.app === app) x.done = 1; }); return { ok: true }; }, { db: false });
A('GET', '/trial-requests', async () => ({ ok: true, rows: await db.q("SELECT l.id, l.product, l.start AS requested, t.id AS tenant_id, t.name AS biz, t.phone, t.sector, (SELECT email FROM users u WHERE u.tenant_id=t.id ORDER BY created LIMIT 1) AS email, (SELECT name FROM users u WHERE u.tenant_id=t.id ORDER BY created LIMIT 1) AS uname FROM licenses l JOIN tenants t ON t.id=l.tenant_id WHERE l.status='talep' ORDER BY l.start") }));
A('POST', '/licenses/:id/trial', async (c) => {
  const l = await db.one('SELECT * FROM licenses WHERE id=?', [c.params.id]); if (!l) throw err(404, 'Lisans yok');
  if (c.body.reject) { await db.q("UPDATE licenses SET status='iptal' WHERE id=?", [l.id]); await audit(c, 'Deneme talebi reddedildi', l.product, l.tenant_id); return { ok: true }; }
  const days = Math.min(90, Math.max(1, Number(c.body.days) || 7));
  await db.q("UPDATE licenses SET status='deneme', start=?, end=? WHERE id=?", [now(), addDays(now(), days), l.id]);
  await audit(c, 'Deneme onaylandı', `${l.product} ${days} gün`, l.tenant_id);
  const u = await db.one("SELECT email, name FROM users WHERE tenant_id=? AND role='customer' ORDER BY created LIMIT 1", [l.tenant_id]); const s = await site();
  if (u) mailTo(u.email, `${pnameOf(l.product)} denemeniz aktif`, { title: `${pnameOf(l.product)} hazır`, intro: `Merhaba ${String(u.name).split(' ')[0]}, ${days} günlük ücretsiz deneme lisansınız aktifleştirildi.`, blocks: [{ type: 'kv', rows: [['Program', pnameOf(l.product)], ['Deneme bitişi', addDays(now(), days).toLocaleDateString('tr-TR')]] }, { type: 'button', label: 'Programı aç', url: `${s.siteUrl || ''}/#/programlarim` }] });
  return { ok: true };
});
A('POST', '/tenants/:id/license', async (c) => {
  const pid = String(c.body.product || ''); if (!cat.kayitli(pid) || pid === 'bundle') throw err(400, 'Geçersiz ürün');
  const days = Math.min(3660, Math.max(1, Number(c.body.days) || 7));
  await db.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), end=VALUES(end)', [uid(), c.params.id, pid, Number(c.body.plan) || 1, 'aylik', c.body.trial ? 'deneme' : 'aktif', now(), addDays(now(), days), licKey(pid)]);
  await audit(c, 'Lisans tanımlandı', `${pid} ${days} gün`, c.params.id); return { ok: true };
});
A('GET', '/users', async () => ({ ok: true, users: await db.q("SELECT u.id, u.email, u.name, u.role, u.status, u.last_login, u.last_ip, u.created, COALESCE(t.enabled, 0) AS totp FROM users u LEFT JOIN user_totp t ON t.user_id=u.id WHERE u.role IN ('admin','superadmin') ORDER BY u.created") }));
A('POST', '/users', async (c) => {
  if (c.user.role !== 'superadmin') throw err(403, 'Yalnız süper yönetici yönetici ekleyebilir');
  const b = c.body; if (!sec.V.email(b.email) || !sec.V.str(b.name, 120, 2)) throw err(400, 'Ad ve e-posta gerekli');
  if (!sec.V.password(b.pass) || b.pass.length < 12) throw err(400, 'Yönetici şifresi en az 12 karakter, harf ve rakam içermeli');
  if (await db.one('SELECT id FROM users WHERE email=?', [b.email.toLowerCase()])) throw err(400, 'E-posta kayıtlı');
  await db.q('INSERT INTO users (id, email, pass, name, role, created) VALUES (?,?,?,?,?,?)', [uid(), b.email.toLowerCase().trim(), await auth.hash(b.pass), sec.clean(b.name, 120), b.role === 'superadmin' ? 'superadmin' : 'admin', now()]);
  await audit(c, 'Yönetici eklendi', b.email); return { ok: true };
});
A('POST', '/users/:id/status', async (c) => {
  if (c.user.role !== 'superadmin') throw err(403, 'Yalnız süper yönetici'); if (c.params.id === c.user.id) throw err(400, 'Kendinizi devre dışı bırakamazsınız');
  const st = c.body.status === 'active' ? 'active' : 'disabled'; await db.q('UPDATE users SET status=? WHERE id=?', [st, c.params.id]); if (st !== 'active') await db.q('DELETE FROM sessions WHERE user_id=?', [c.params.id]);
  await audit(c, 'Kullanıcı ' + st, c.params.id); return { ok: true };
});
A('POST', '/users/:id/reset', async (c) => {
  const u = await db.one('SELECT id, role, email FROM users WHERE id=?', [c.params.id]); if (!u) throw err(404, 'Kullanıcı yok');
  if (u.role !== 'customer' && c.user.role !== 'superadmin') throw err(403, 'Yalnız süper yönetici');
  const pw = crypto.randomBytes(9).toString('base64url') + '7';
  await db.q('UPDATE users SET pass=?, failed=0, locked_until=NULL WHERE id=?', [await auth.hash(pw), u.id]); await db.q('DELETE FROM sessions WHERE user_id=?', [u.id]);
  await audit(c, 'Şifre sıfırlandı', u.email); return { ok: true, password: pw };
});
A('GET', '/leads', async () => ({ ok: true, leads: await db.q('SELECT * FROM leads ORDER BY created DESC LIMIT 500') }));
A('POST', '/leads/:id', async (c) => { await db.q('UPDATE leads SET status=? WHERE id=?', [['yeni', 'arandi', 'kazanildi', 'kayip'].includes(c.body.status) ? c.body.status : 'arandi', c.params.id]); return { ok: true }; });
A('GET', '/tickets', async (c) => {
  await slaTara();
  const f = c.query.get('filtre'); const w = f === 'asildi' ? "WHERE k.breached=1 AND k.status<>'kapali'" : f === 'acik' ? "WHERE k.status<>'kapali'" : f === 'kapali' ? "WHERE k.status='kapali'" : '';
  // Öncelik sırası: açıklar önde, sonra paket önceliği, sonra en yakın son süre. Eski taleplerin önceliği yoktur, sona düşer.
  const rows = await db.q(`SELECT k.*, t.name AS tenant_name FROM tickets k LEFT JOIN tenants t ON t.id=k.tenant_id ${w} ORDER BY k.status='kapali', k.priority IS NULL, k.priority, IF(k.first_reply_at IS NULL, k.first_due, k.resolve_due), k.updated DESC LIMIT 300`);
  return { ok: true, paketler: destek.pub(), tickets: rows.map((t) => ({ ...t, messages: J(t.messages, []), sla: destek.state(t) })) };
});
A('GET', '/coupons', async () => ({ ok: true, coupons: await db.q('SELECT * FROM coupons ORDER BY code') }));
A('POST', '/coupons', async (c) => {
  const code = String(c.body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40); const pct = Math.round(Number(c.body.pct));
  if (!code || !(pct > 0 && pct <= 90)) throw err(400, 'Kod ve %1–90 indirim gerekli');
  await db.q('INSERT INTO coupons (code, pct, active, max_uses, expires) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE pct=VALUES(pct), active=VALUES(active), max_uses=VALUES(max_uses), expires=VALUES(expires)', [code, pct, c.body.active === false ? 0 : 1, Number(c.body.max_uses) || null, c.body.expires || null]);
  await audit(c, 'Kupon kaydedildi', code); return { ok: true };
});
A('DELETE', '/coupons/:code', async (c) => { await db.q('DELETE FROM coupons WHERE code=?', [c.params.code]); return { ok: true }; });
A('GET', '/settings', async () => ({ ok: true, site: await site() }));
A('GET', '/mail', async () => { const s = await mail.settings(); return { ok: true, mail: { ...s, pass: !!s.pass }, presets: mail.PRESETS, ready: await mail.ready() }; });
A('PUT', '/mail', async (c) => { const b = c.body || {}; if (b.user && !sec.V.email(b.user)) throw err(400, 'Geçerli bir gönderen e-posta adresi girin'); const r = await mail.saveConfig(b); await audit(c, 'E-posta ayarları', `${r.host} · ${r.user}`); return { ok: true, mail: r }; });
A('POST', '/mail/test', async (c) => { const to = String(c.body.to || c.user.email); if (!sec.V.email(to)) throw err(400, 'Geçerli bir alıcı girin'); const r = await mail.send(to, 'NEBSOFT e-posta testi', { title: 'E-posta ayarlarınız çalışıyor', intro: 'Bu bir deneme e-postasıdır. Doğrulama kodları, sipariş ve lisans bildirimleri bu adresten gönderilecek.', blocks: [{ type: 'kv', rows: [['Gönderim', new Date().toLocaleString('tr-TR')], ['Alıcı', to]] }, { type: 'note', text: 'Her şey yolunda görünüyor.' }] }, await mailSite()); if (!r.ok) throw err(400, r.error || 'Gönderilemedi'); return { ok: true }; });
A('GET', '/mail/log', async () => ({ ok: true, rows: await db.q('SELECT * FROM mail_log ORDER BY id DESC LIMIT 300') }));
const campaignTpl = (b) => ({ title: sec.clean(b.title || b.subject, 140), intro: sec.clean(b.intro, 300), preheader: sec.clean(b.intro || b.subject, 140), footer: 'Tanıtım: bu e-postayı izin verdiğiniz için aldınız.', blocks: [...String(b.body || '').split(/\n{2,}/).filter(Boolean).map((t) => ({ type: 'p', text: sec.clean(t, 4000) })), ...(b.btnLabel && /^https?:\/\//.test(b.btnUrl || '') ? [{ type: 'button', label: sec.clean(b.btnLabel, 40), url: String(b.btnUrl).slice(0, 300) }] : [])] });
A('POST', '/mail/preview', async (c) => ({ ok: true, html: mail.render({ ...campaignTpl(c.body || {}), site: await mailSite() }).html }));
A('POST', '/mail/campaign', async (c) => {
  const b = c.body || {}; if (!sec.V.str(b.subject, 160, 3) || !sec.V.str(b.body, 8000, 5)) throw err(400, 'Konu ve metin gerekli');
  if (!(await mail.ready())) throw err(400, 'Önce e-posta ayarlarını yapın');
  const pz = await setting('pazarlama', {}); if (!(await site()).siteUrl) throw err(400, 'Çıkış bağlantısı için önce Site Ayarları\'nda site adresini girin'); if (!(pz.iys && pz.unvan && pz.mersis)) throw err(400, 'Toplu e-posta ticari iletidir. Önce Deneme Takibi sayfasından İYS kaydını, ticaret unvanını ve MERSİS numarasını girin.');
  const Q = { all: "SELECT DISTINCT u.email, u.name FROM users u WHERE u.role='customer' AND u.status='active'", trial: "SELECT DISTINCT u.email, u.name FROM users u JOIN licenses l ON l.tenant_id=u.tenant_id WHERE u.role='customer' AND l.status='deneme' AND l.end>UTC_TIMESTAMP()", active: "SELECT DISTINCT u.email, u.name FROM users u JOIN licenses l ON l.tenant_id=u.tenant_id WHERE u.role='customer' AND l.status='aktif' AND l.end>UTC_TIMESTAMP()", expired: "SELECT DISTINCT u.email, u.name FROM users u WHERE u.role='customer' AND NOT EXISTS (SELECT 1 FROM licenses l WHERE l.tenant_id=u.tenant_id AND l.status IN ('deneme','aktif') AND l.end>UTC_TIMESTAMP())" };
  let list = b.target === 'emails' ? String(b.emails || '').split(/[\s,;]+/).filter((e) => sec.V.email(e)).map((email) => ({ email: email.toLowerCase() })) : Q[b.target] ? await db.q(Q[b.target]) : [];
  // Yalnızca kayıtlı ve izin vermiş müşteriye gider
  const izinli = new Map((await db.q("SELECT u.email, u.id, u.name FROM users u JOIN mail_prefs p ON p.user_id=u.id WHERE u.role='customer' AND u.status='active' AND p.marketing=1")).map((x) => [String(x.email).toLowerCase(), x]));
  const toplam = list.length; list = list.filter((r) => izinli.has(String(r.email).toLowerCase())).map((r) => izinli.get(String(r.email).toLowerCase())).slice(0, 1000);
  if (!list.length) throw err(400, `Seçilen kitlede pazarlama izni olan alıcı yok (${toplam} kişi izinsiz, gönderilmedi)`);
  const tpl = campaignTpl(b); const s = await mailSite(); let ok = 0, fail = 0;
  for (const r of list) { const x = await mail.send(r.email, sec.clean(b.subject, 160), { ...tpl, footer: `${tpl.footer} ${pz.unvan} · MERSİS ${pz.mersis}`, unsub: require('./deneme').cikisUrl(r.id, (await site()).siteUrl), intro: tpl.intro.replace(/\{ad\}/g, String(r.name || '').split(' ')[0] || '') }, s); if (x.ok) ok++; else fail++; await new Promise((z) => setTimeout(z, 250)); }
  await audit(c, 'Toplu e-posta', `${b.subject} · ${ok}/${list.length}`); return { ok: true, sent: ok, failed: fail, total: list.length, skipped: toplam - list.length };
}, { uzun: true });
// Duyurular ve bakım modu: programların üstünde bant; bakımda "erişimi kapat" seçilirse veri kaydı da durdurulur
A('GET', '/platform', async () => ({ ok: true, platform: await setting('platform', { announcements: [], maintenance: {} }) }));
A('PUT', '/platform', async (c) => {
  const b = c.body || {}; const ids = new Set(cat.load().products.map((p) => p.id));
  const ann = (Array.isArray(b.announcements) ? b.announcements : []).slice(0, 50).map((a) => ({ id: sec.clean(a.id, 20) || uid(), title: sec.clean(a.title, 120), body: sec.clean(a.body, 600), level: ['info', 'warn', 'err'].includes(a.level) ? a.level : 'info', active: a.active !== false, until: /^\d{4}-\d{2}-\d{2}$/.test(a.until || '') ? a.until : '', products: (a.products || []).filter((x) => ids.has(x)), created: a.created || new Date().toISOString() })).filter((a) => a.title);
  const maint = {}; Object.entries(b.maintenance || {}).forEach(([k, v]) => { if (ids.has(k) && v && v.on) maint[k] = { on: true, msg: sec.clean(v.msg, 300), block: !!v.block }; });
  await setSetting('platform', { announcements: ann, maintenance: maint }); await audit(c, 'Duyuru / bakım güncellendi', `${ann.length} duyuru, ${Object.keys(maint).length} bakım`); return { ok: true };
});
// Ürünler ve fiyatlar (yönetim paneli)
A('GET', '/catalog', async () => { await syncCatalog(true); return { ok: true, products: [...cat.all(), cat.product('bundle')], overrides: cat.overrides() }; });
A('PUT', '/catalog/:id', async (c) => {
  const id = String(c.params.id); if (id !== 'bundle' && !cat.load().products.some((p) => p.id === id)) throw err(404, 'Ürün yok');
  const b = c.body; const pr = (b.prices || []).map(Number);
  if (pr.length !== 3 || pr.some((x) => !(x > 0 && x < 1e6))) throw err(400, 'Üç paket için geçerli fiyat girin');
  const ov = { ...(await setting('catalog', {})) };
  ov[id] = { prices: pr, ...(b.name ? { name: sec.clean(b.name, 60) } : {}), ...(b.tagline ? { tagline: sec.clean(b.tagline, 160) } : {}), ...(b.badge ? { badge: sec.clean(b.badge, 30) } : {}), ready: b.ready !== false, hidden: !!b.hidden };
  await setSetting('catalog', ov); await syncCatalog(true); await audit(c, 'Ürün güncellendi', `${id} ${pr.join('/')}`); return { ok: true };
});
A('DELETE', '/catalog/:id', async (c) => { const ov = { ...(await setting('catalog', {})) }; delete ov[String(c.params.id)]; await setSetting('catalog', ov); await syncCatalog(true); await audit(c, 'Ürün varsayılana döndü', c.params.id); return { ok: true }; });
// Search Console kodu: yalnız kod ya da panelin verdiği meta etiketinin tamamı yapıştırılabilir
const googleCode = (v) => { const raw = String(v || '').trim(); const code = (/content=["']([^"']+)["']/.exec(raw) || [])[1] || raw; if (code && !/^[A-Za-z0-9_-]{10,100}$/.test(code)) throw err(400, 'Google doğrulama kodu geçersiz. Search Console\'un verdiği kodu veya meta etiketini yapıştırın'); return code; };
A('PUT', '/settings', async (c) => {
  const b = c.body; const s = { trialDays: Math.min(60, Math.max(1, Number(b.trialDays) || 7)), siteName: sec.clean(b.siteName, 60) || 'NEBSOFT', phone: sec.clean(b.phone, 40), email: sec.clean(b.email, 190), address: sec.clean(b.address, 300), referralDays: Math.min(365, Math.max(0, Number(b.referralDays) || 0)), siteUrl: sec.clean(b.siteUrl, 200), googleVerify: googleCode(b.googleVerify) };
  await setSetting('site', s); await audit(c, 'Site ayarları', JSON.stringify(s).slice(0, 300)); return { ok: true };
});
A('GET', '/audit', async () => ({ ok: true, rows: await db.q('SELECT a.*, u.email FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500') }));
A('GET', '/db', async () => ({ ok: true, info: db.info(), tables: await db.q('SELECT table_name AS name, table_rows AS rows_est, ROUND((data_length+index_length)/1024/1024, 2) AS mb FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY name') }));

module.exports = { R, valid, canUseApp, hesapRolu, err, site, audit, J, syncCatalog, route, A, setting, setSetting, applyOrder, paidMail, mailTo, fmtTL, mailSite, pnameOf, uid, slaTara };
