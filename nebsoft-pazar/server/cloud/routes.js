// NEBSOFT bulut API'si. Her uç nokta: kimlik (yok / müşteri / admin / süper admin), CSRF ve istek sınırı kurallarıyla tanımlanır.
const crypto = require('crypto');
const db = require('./db');
const cfg = require('./config');
const sec = require('./security');
const auth = require('./auth');
const cat = require('./catalog');

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
const DEFAULTS = { trialDays: 7, siteName: 'NEBSOFT', phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', address: '', referralDays: 30, siteUrl: '' };
async function site() { return { ...DEFAULTS, ...(await setting('site', {})) }; }
async function audit(c, action, detail, tenant) { await db.q('INSERT INTO audit (at, user_id, tenant_id, ip, action, detail) VALUES (?,?,?,?,?,?)', [now(), c.user ? c.user.id : null, tenant || (c.user ? c.user.tenant_id : null), c.ip, action, String(detail || '').slice(0, 500)]).catch(() => {}); }

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
  if (ten && ten.referred_by && !ten.referral_rewarded) {
    const days = (await site()).referralDays || 30;
    for (const tid of [ten.referred_by, ten.id]) await t.q("UPDATE licenses SET end = DATE_ADD(GREATEST(end, UTC_TIMESTAMP()), INTERVAL ? DAY) WHERE tenant_id=? AND status IN ('aktif','deneme')", [days, tid]);
    await t.q('UPDATE tenants SET referral_rewarded=1 WHERE id=?', [ten.id]);
  }
}

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
const banks = () => db.q('SELECT id, holder, iban, bank FROM bank_accounts WHERE active=1 ORDER BY created');
const pubOrder = (o) => ({ id: o.id, no: o.no, items: J(o.items, []), subtotal: Number(o.subtotal), discount: Number(o.discount), vat: Number(o.vat), total: Number(o.total), coupon: o.coupon, status: o.status, created: o.created, paid_at: o.paid_at, billing: J(o.billing, {}) });

// ---------- Uç noktalar ----------
const R = [];
const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt, fn });

// Kurulum
route('GET', '/api/setup/status', { auth: 'none' }, async () => {
  const conf = cfg.load(); let hasAdmin = false;
  if (db.ready()) hasAdmin = !!(await db.one("SELECT id FROM users WHERE role='superadmin' LIMIT 1"));
  return { ok: true, configured: !!conf, db: db.ready() ? db.info() : null, hasAdmin, needsToken: !hasAdmin };
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
  const base = { ok: true, mode: 'cloud', trialDays: s.trialDays, site: { name: s.siteName, phone: s.phone, email: s.email } };
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
  const ref = b.ref ? await db.one('SELECT id FROM tenants WHERE ref_code=?', [String(b.ref).toUpperCase().slice(0, 16)]) : null;
  const tid = uid(); const u = { id: uid(), email, name: sec.clean(b.name, 120), phone: sec.clean(b.phone, 40), role: 'customer', tenant_id: tid };
  let slug = slugify(b.company); if (await db.one('SELECT id FROM tenants WHERE slug=?', [slug])) slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  const pass = await auth.hash(b.pass); const s = await site();
  await db.tx(async (t) => {
    await t.q('INSERT INTO tenants (id, name, slug, phone, sector, ref_code, referred_by, webhook_token, created) VALUES (?,?,?,?,?,?,?,?,?)', [tid, sec.clean(b.company, 160), slug, u.phone, sec.clean(b.sector, 60), crypto.randomBytes(4).toString('hex').toUpperCase(), ref ? ref.id : null, crypto.randomBytes(16).toString('hex'), now()]);
    await t.q('INSERT INTO users (id, email, pass, name, phone, role, tenant_id, kvkk_at, created) VALUES (?,?,?,?,?,?,?,?,?)', [u.id, email, pass, u.name, u.phone, 'customer', tid, now(), now()]);
    if (b.product && cat.product(b.product) && b.product !== 'bundle') await t.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?)', [uid(), tid, b.product, 1, 'aylik', 'deneme', now(), addDays(now(), s.trialDays), licKey(b.product)]);
  });
  await auth.createSession(c.req, c.res, u, true);
  await audit({ ...c, user: u }, 'Kayıt', `${u.email} · ${b.company}${ref ? ' · davet' : ''}`, tid);
  return { ok: true };
});
route('POST', '/api/auth/login', { auth: 'none', limit: ['login', 10, 600e3] }, async (c) => {
  if (!sec.V.email(c.body.email) || typeof c.body.pass !== 'string') throw err(400, 'E-posta ve şifre gerekli');
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
  const pid = String(c.body.product || ''); if (!cat.product(pid) || pid === 'bundle') throw err(400, 'Geçersiz ürün');
  if (!c.user.tenant_id) throw err(400, 'Yönetici hesabıyla deneme başlatılamaz');
  const ex = await db.one('SELECT * FROM licenses WHERE tenant_id=? AND product=?', [c.user.tenant_id, pid]);
  if (ex) return { ok: true, license: ex, existing: true };
  const s = await site();
  await db.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?)', [uid(), c.user.tenant_id, pid, 1, 'aylik', 'deneme', now(), addDays(now(), s.trialDays), licKey(pid)]);
  await audit(c, 'Deneme başladı', pid);
  return { ok: true, license: await db.one('SELECT * FROM licenses WHERE tenant_id=? AND product=?', [c.user.tenant_id, pid]) };
});
route('POST', '/api/orders/quote', { auth: 'none' }, async (c) => { const k = await couponPct(c.body.coupon); return { ok: true, coupon: k.code, ...cat.price(c.body.items, k.pct) }; });
route('POST', '/api/orders', { auth: 'user', limit: ['order', 20, 3600e3] }, async (c) => {
  if (!c.user.tenant_id) throw err(400, 'Yönetici hesabıyla sipariş verilemez');
  const k = await couponPct(c.body.coupon); const p = cat.price(c.body.items, k.pct);
  const b = c.body.billing || {};
  if (!sec.V.str(b.name, 120, 3) || !sec.V.str(b.taxNo, 20, 10) || !sec.V.str(b.address, 300, 5)) throw err(400, 'Fatura bilgileri (ad, VKN/TCKN, adres) eksik');
  if (!(await banks()).length) throw err(503, 'Ödeme hesabı tanımlı değil. Lütfen destek ile iletişime geçin.');
  const billing = { name: sec.clean(b.name, 120), company: sec.clean(b.company, 160), taxNo: sec.clean(b.taxNo, 20), taxOffice: sec.clean(b.taxOffice, 80), address: sec.clean(b.address, 300), city: sec.clean(b.city, 60), email: c.user.email, phone: sec.clean(b.phone, 40) };
  const o = await db.tx(async (t) => {
    const no = await nextOrderNo(t); const id = uid();
    await t.q('INSERT INTO orders (id, no, tenant_id, user_id, items, subtotal, discount, vat, total, coupon, status, billing, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, no, c.user.tenant_id, c.user.id, JSON.stringify(p.lines), p.subtotal, p.discount, p.vat, p.total, k.code, 'odeme-bekliyor', JSON.stringify(billing), now()]);
    if (k.code) await t.q('UPDATE coupons SET uses=uses+1 WHERE code=?', [k.code]);
    await t.q('UPDATE tenants SET tax_no=?, tax_office=?, address=?, city=? WHERE id=?', [billing.taxNo, billing.taxOffice, billing.address, billing.city, c.user.tenant_id]);
    return (await t.q('SELECT * FROM orders WHERE id=?', [id]))[0];
  });
  await audit(c, 'Sipariş (havale bekliyor)', `${o.no} · ${o.total} TL`);
  return { ok: true, order: pubOrder(o), banks: await banks() };
});
route('GET', '/api/orders', { auth: 'user' }, async (c) => ({ ok: true, orders: (await db.q('SELECT * FROM orders WHERE tenant_id=? ORDER BY created DESC LIMIT 100', [c.user.tenant_id || '-'])).map(pubOrder), banks: await banks() }));
route('POST', '/api/orders/:id/cancel', { auth: 'user' }, async (c) => {
  const r = await db.q("UPDATE orders SET status='iptal' WHERE id=? AND tenant_id=? AND status='odeme-bekliyor'", [c.params.id, c.user.tenant_id || '-']);
  if (!r.affectedRows) throw err(400, 'Yalnızca ödeme bekleyen sipariş iptal edilebilir');
  await audit(c, 'Sipariş iptal (müşteri)', c.params.id); return { ok: true };
});
route('PUT', '/api/account', { auth: 'user' }, async (c) => {
  const b = c.body; if (!sec.V.str(b.name, 120, 3)) throw err(400, 'Ad soyad gerekli');
  await db.q('UPDATE users SET name=?, phone=? WHERE id=?', [sec.clean(b.name, 120), sec.clean(b.phone, 40), c.user.id]);
  if (c.user.tenant_id && b.company) await db.q('UPDATE tenants SET name=?, address=?, city=?, tax_no=?, tax_office=? WHERE id=?', [sec.clean(b.company, 160), sec.clean(b.address, 300), sec.clean(b.city, 60), sec.clean(b.taxNo, 20), sec.clean(b.taxOffice, 80), c.user.tenant_id]);
  return { ok: true };
});
route('GET', '/api/team', { auth: 'user' }, async (c) => ({ ok: true, users: await db.q('SELECT id, email, name, phone, status, last_login FROM users WHERE tenant_id=? ORDER BY created', [c.user.tenant_id || '-']) }));
route('POST', '/api/team', { auth: 'user', limit: ['team', 20, 3600e3] }, async (c) => {
  const b = c.body; if (!c.user.tenant_id) throw err(400, 'İşletme hesabı yok');
  if (!sec.V.email(b.email) || !sec.V.str(b.name, 120, 2) || !sec.V.password(b.pass)) throw err(400, 'Ad, e-posta ve en az 8 karakterli (harf+rakam) şifre gerekli');
  if (await db.one('SELECT id FROM users WHERE email=?', [b.email.toLowerCase()])) throw err(400, 'Bu e-posta başka bir hesapta kayıtlı');
  const n = await db.one('SELECT COUNT(*) AS n FROM users WHERE tenant_id=?', [c.user.tenant_id]); if (n.n >= 50) throw err(400, 'Kullanıcı sınırına ulaşıldı');
  await db.q('INSERT INTO users (id, email, pass, name, role, tenant_id, created) VALUES (?,?,?,?,?,?,?)', [uid(), b.email.toLowerCase().trim(), await auth.hash(b.pass), sec.clean(b.name, 120), 'customer', c.user.tenant_id, now()]);
  await audit(c, 'Ekip üyesi eklendi', b.email); return { ok: true };
});
route('DELETE', '/api/team/:id', { auth: 'user' }, async (c) => {
  if (c.params.id === c.user.id) throw err(400, 'Kendinizi silemezsiniz');
  const r = await db.q('DELETE FROM users WHERE id=? AND tenant_id=?', [c.params.id, c.user.tenant_id || '-']); if (r.affectedRows) await db.q('DELETE FROM sessions WHERE user_id=?', [c.params.id]);
  await audit(c, 'Ekip üyesi silindi', c.params.id); return { ok: true };
});
route('GET', '/api/tickets', { auth: 'user' }, async (c) => ({ ok: true, tickets: (await db.q('SELECT * FROM tickets WHERE tenant_id=? ORDER BY updated DESC LIMIT 100', [c.user.tenant_id || '-'])).map((t) => ({ ...t, messages: J(t.messages, []) })) }));
route('POST', '/api/tickets', { auth: 'user', limit: ['ticket', 20, 3600e3] }, async (c) => {
  if (!sec.V.str(c.body.subject, 200, 3) || !sec.V.str(c.body.text, 5000, 3)) throw err(400, 'Konu ve mesaj gerekli');
  await db.q('INSERT INTO tickets (id, tenant_id, user_id, subject, product, status, messages, created, updated) VALUES (?,?,?,?,?,?,?,?,?)', [uid(), c.user.tenant_id || '-', c.user.id, sec.clean(c.body.subject, 200), sec.clean(c.body.product, 40), 'acik', JSON.stringify([{ from: 'musteri', text: sec.clean(c.body.text, 5000), at: iso(now()) }]), now(), now()]);
  return { ok: true };
});
route('POST', '/api/tickets/:id/reply', { auth: 'user' }, async (c) => {
  const admin = ['admin', 'superadmin'].includes(c.user.role);
  const t = await db.one(admin ? 'SELECT * FROM tickets WHERE id=?' : 'SELECT * FROM tickets WHERE id=? AND tenant_id=?', admin ? [c.params.id] : [c.params.id, c.user.tenant_id || '-']);
  if (!t) throw err(404, 'Talep bulunamadı');
  const m = J(t.messages, []);
  if (c.body.close && admin) await db.q("UPDATE tickets SET status='kapali', updated=? WHERE id=?", [now(), t.id]);
  else { if (!sec.V.str(c.body.text, 5000, 1)) throw err(400, 'Mesaj boş'); m.push({ from: admin ? 'destek' : 'musteri', text: sec.clean(c.body.text, 5000), at: iso(now()), by: c.user.name }); await db.q('UPDATE tickets SET messages=?, status=?, updated=? WHERE id=?', [JSON.stringify(m), admin ? 'yanitlandi' : 'acik', now(), t.id]); }
  return { ok: true };
});
route('GET', '/api/referral', { auth: 'user' }, async (c) => {
  const t = await tenantOf(c.user); if (!t) throw err(400, 'İşletme hesabı yok'); const s = await site();
  const list = await db.q('SELECT name, created, referral_rewarded FROM tenants WHERE referred_by=? ORDER BY created DESC', [t.id]);
  return { ok: true, code: t.ref_code, days: s.referralDays, invited: list.length, rewarded: list.filter((x) => x.referral_rewarded).length, list: list.map((x) => ({ name: x.name.slice(0, 2) + '***', created: x.created, paid: !!x.referral_rewarded })) };
});

// Uygulama verisi (işletme bazlı; lisans kontrollü; iyimser sürüm kontrolüyle çakışma önleme)
route('GET', '/api/data/:app', { auth: 'user' }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Bu uygulama için geçerli lisans veya deneme yok', { code: 'license', app });
  const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]);
  const t = await tenantOf(c.user);
  return { ok: true, data: r ? J(r.data, null) : null, version: r ? r.version : 0, tenant: { name: t.name, phone: t.phone, address: t.address, slug: t.slug }, owner: { name: c.user.name } };
});
route('GET', '/api/data/:app/v', { auth: 'user' }, async (c) => {
  const r = await db.one('SELECT version FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id || '-', String(c.params.app)]);
  return { ok: true, version: r ? r.version : 0 };
});
route('PUT', '/api/data/:app', { auth: 'user', bodyMax: 20e6, limit: ['data', 600, 60e3] }, async (c) => {
  const app = c.params.app; if (!sec.V.app(app)) throw err(400, 'Geçersiz uygulama');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Lisans süresi doldu — veriler okunabilir ama kaydedilemez', { code: 'license', app });
  const data = c.body.data; const base = Number(c.body.base) || 0;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw err(400, 'Geçersiz veri');
  const text = JSON.stringify(data);
  const cur = await db.one('SELECT version, updated FROM app_data WHERE tenant_id=? AND app=?', [c.user.tenant_id, app]);
  if (!cur) {
    if (base !== 0) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app));
    try { await db.q('INSERT INTO app_data (tenant_id, app, data, version, updated, updated_by) VALUES (?,?,?,?,?,?)', [c.user.tenant_id, app, text, 1, now(), c.user.id]); } catch (e) { if (e.code === 'ER_DUP_ENTRY') throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app)); throw e; }
    return { ok: true, version: 1 };
  }
  const r = await db.q('UPDATE app_data SET data=?, version=version+1, updated=?, updated_by=? WHERE tenant_id=? AND app=? AND version=?', [text, now(), c.user.id, c.user.tenant_id, app, base]);
  if (!r.affectedRows) throw err(409, 'Sürüm çakışması', await conflict(c.user.tenant_id, app));
  // Saatlik anlık görüntü (geri dönüş için son 48 saat)
  const last = await db.one('SELECT at FROM app_data_history WHERE tenant_id=? AND app=? ORDER BY id DESC LIMIT 1', [c.user.tenant_id, app]);
  if (!last || now() - new Date(last.at) > 3600e3) {
    await db.q('INSERT INTO app_data_history (tenant_id, app, version, data, at) VALUES (?,?,?,?,?)', [c.user.tenant_id, app, base + 1, text, now()]);
    await db.q('DELETE FROM app_data_history WHERE tenant_id=? AND app=? AND at < ?', [c.user.tenant_id, app, addDays(now(), -2)]);
  }
  return { ok: true, version: base + 1 };
});
async function conflict(tid, app) { const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [tid, app]); return { code: 'conflict', data: r ? J(r.data, null) : null, version: r ? r.version : 0 }; }

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
  const st = c.query.get('status'); const rows = await db.q(`SELECT o.*, t.name AS tenant_name, t.phone AS tenant_phone, u.email AS user_email FROM orders o JOIN tenants t ON t.id=o.tenant_id JOIN users u ON u.id=o.user_id ${st ? 'WHERE o.status=?' : ''} ORDER BY o.created DESC LIMIT 300`, st ? [st] : []);
  return { ok: true, orders: rows.map((o) => ({ ...pubOrder(o), tenant: o.tenant_name, phone: o.tenant_phone, email: o.user_email, note: o.note })) };
});
A('POST', '/orders/:id/approve', async (c) => {
  await db.tx(async (t) => {
    const o = (await t.q('SELECT * FROM orders WHERE id=? FOR UPDATE', [c.params.id]))[0];
    if (!o) throw err(404, 'Sipariş yok'); if (o.status !== 'odeme-bekliyor') throw err(400, 'Sipariş ödeme beklemiyor');
    await t.q("UPDATE orders SET status='odendi', paid_at=?, approved_by=?, note=? WHERE id=?", [now(), c.user.id, sec.clean(c.body.note, 255) || null, o.id]);
    await applyOrder(t, o);
  });
  await audit(c, 'Havale onaylandı', c.params.id); return { ok: true };
});
A('POST', '/orders/:id/reject', async (c) => {
  const r = await db.q("UPDATE orders SET status='iptal', note=? WHERE id=? AND status='odeme-bekliyor'", [sec.clean(c.body.note, 255) || 'Ödeme alınmadı', c.params.id]);
  if (!r.affectedRows) throw err(400, 'Sipariş ödeme beklemiyor'); await audit(c, 'Sipariş reddedildi', c.params.id); return { ok: true };
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
A('POST', '/tenants/:id/license', async (c) => {
  const pid = String(c.body.product || ''); if (!cat.product(pid) || pid === 'bundle') throw err(400, 'Geçersiz ürün');
  const days = Math.min(3660, Math.max(1, Number(c.body.days) || 7));
  await db.q('INSERT INTO licenses (id, tenant_id, product, plan, period, status, start, end, lic_key) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), end=VALUES(end)', [uid(), c.params.id, pid, Number(c.body.plan) || 1, 'aylik', c.body.trial ? 'deneme' : 'aktif', now(), addDays(now(), days), licKey(pid)]);
  await audit(c, 'Lisans tanımlandı', `${pid} ${days} gün`, c.params.id); return { ok: true };
});
A('GET', '/users', async () => ({ ok: true, users: await db.q("SELECT id, email, name, role, status, last_login, last_ip, created FROM users WHERE role IN ('admin','superadmin') ORDER BY created") }));
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
A('GET', '/tickets', async () => ({ ok: true, tickets: (await db.q('SELECT k.*, t.name AS tenant_name FROM tickets k LEFT JOIN tenants t ON t.id=k.tenant_id ORDER BY k.updated DESC LIMIT 300')).map((t) => ({ ...t, messages: J(t.messages, []) })) }));
A('GET', '/coupons', async () => ({ ok: true, coupons: await db.q('SELECT * FROM coupons ORDER BY code') }));
A('POST', '/coupons', async (c) => {
  const code = String(c.body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40); const pct = Math.round(Number(c.body.pct));
  if (!code || !(pct > 0 && pct <= 90)) throw err(400, 'Kod ve %1–90 indirim gerekli');
  await db.q('INSERT INTO coupons (code, pct, active, max_uses, expires) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE pct=VALUES(pct), active=VALUES(active), max_uses=VALUES(max_uses), expires=VALUES(expires)', [code, pct, c.body.active === false ? 0 : 1, Number(c.body.max_uses) || null, c.body.expires || null]);
  await audit(c, 'Kupon kaydedildi', code); return { ok: true };
});
A('DELETE', '/coupons/:code', async (c) => { await db.q('DELETE FROM coupons WHERE code=?', [c.params.code]); return { ok: true }; });
A('GET', '/settings', async () => ({ ok: true, site: await site() }));
A('PUT', '/settings', async (c) => {
  const b = c.body; const s = { trialDays: Math.min(60, Math.max(1, Number(b.trialDays) || 7)), siteName: sec.clean(b.siteName, 60) || 'NEBSOFT', phone: sec.clean(b.phone, 40), email: sec.clean(b.email, 190), address: sec.clean(b.address, 300), referralDays: Math.min(365, Math.max(0, Number(b.referralDays) || 0)), siteUrl: sec.clean(b.siteUrl, 200) };
  await setSetting('site', s); await audit(c, 'Site ayarları', JSON.stringify(s).slice(0, 300)); return { ok: true };
});
A('GET', '/audit', async () => ({ ok: true, rows: await db.q('SELECT a.*, u.email FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500') }));
A('GET', '/db', async () => ({ ok: true, info: db.info(), tables: await db.q('SELECT table_name AS name, table_rows AS rows_est, ROUND((data_length+index_length)/1024/1024, 2) AS mb FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY name') }));

module.exports = { R, valid, canUseApp, err, site, audit, J };
