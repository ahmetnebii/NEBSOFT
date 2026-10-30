// Bulut API yönlendiricisi: kimlik, CSRF, istek sınırı, gövde boyutu ve hata yönetimini tek yerde uygular.
const db = require('./db');
const cfg = require('./config');
const sec = require('./security');
const auth = require('./auth');
const crypto = require('crypto');
const log = require('./log');
const analitik = require('./analitik');
const { R, err } = require('./routes');
require('./public'); require('./seo'); require('./odeme'); require('./analitik-api'); require('./deneme'); require('./guven'); require('./teklif'); require('./katalog-api'); // müşteriye açık sayfaların, ödemenin, denemenin, güven bölümünün ve analitiğin uç noktaları (R listesine eklenir)

// Günlük ve sayaçlara gerçek adres değil kalıp yazılır: /api/public/:slug/... (adresteki belirteçler kayda girmez)
const kalip = (re) => re.source.replace(/\(\?<(\w+)>\[\^\/\]\+\)/g, ':$1').replace(/\\/g, '').replace(/^\^|\$$/g, '');

const send = (res, code, obj) => { if (res.headersSent) return; res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
// raw: gövde bayt olarak döner (webhook imzası ham gövde üzerinden hesaplanır, JSON'a çevrilirse imza bozulabilir)
const readBody = (req, max, raw) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', (c) => { size += c.length; if (size > max) { reject(err(413, 'İstek çok büyük')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { if (raw) return resolve(Buffer.concat(chunks)); if (!size) return resolve({}); try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' ? v : {}); } catch (e) { reject(err(400, 'Geçersiz JSON')); } });
  req.on('error', reject);
});

async function handle(req, res, path) {
  const m = req.method === 'HEAD' ? 'GET' : req.method;
  let hit = null; let params = {};
  for (const r of R) { if (r.method !== m) continue; const x = r.re.exec(path); if (x) { hit = r; params = x.groups || {}; break; } }
  if (!hit) return false;
  if (hit.opt.cloudOnly && !db.ready()) return false; // yerel (bulutsuz) modda eski köprü uç noktaları kullanılır
  const c = { req, res, params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, decodeURIComponent(v)])), query: new URL(req.url, 'http://x').searchParams, ip: sec.ip(req), body: {}, istek: crypto.randomBytes(4).toString('hex') };
  const yol = kalip(hit.re); const t0 = Date.now();
  if (hit.opt.metrik !== false && !hit.opt.uzun) res.once('finish', () => analitik.istek(yol, res.statusCode, Date.now() - t0));
  try {
    if (!sec.limit('api:' + c.ip, 1500, 60e3)) throw err(429, 'Çok fazla istek. Biraz sonra tekrar deneyin.');
    if (hit.opt.limit && !sec.limit(`${hit.opt.limit[0]}:${c.ip}`, hit.opt.limit[1], hit.opt.limit[2])) throw err(429, 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.');
    if (m !== 'GET') {
      if (hit.opt.csrf !== false && !sec.sameOrigin(req)) throw err(403, 'İstek reddedildi (kaynak doğrulanamadı)');
      if (hit.opt.raw) c.raw = await readBody(req, hit.opt.bodyMax || 1e6, true); else c.body = await readBody(req, hit.opt.bodyMax || 1e6);
    }
    if (hit.opt.db !== false && !db.ready() && !path.startsWith('/api/setup/')) throw err(503, 'Sistem bakımda (veritabanı bağlı değil)');
    if (hit.opt.auth && hit.opt.auth !== 'none') {
      c.user = await auth.current(req);
      if (!c.user) throw err(401, 'Oturum açmanız gerekiyor', { code: 'auth' });
      if (hit.opt.auth === 'admin' && !['admin', 'superadmin'].includes(c.user.role)) throw err(403, 'Yetkiniz yok');
      if (c.user.tenant_id) { const t = await db.one('SELECT status FROM tenants WHERE id=?', [c.user.tenant_id]); if (!t || t.status !== 'active') throw err(403, 'İşletme hesabı askıda. Destek ile iletişime geçin.'); }
    }
    const out = await hit.fn(c);
    if (out && out.__raw) { res.writeHead(200, { 'Content-Type': out.type, 'Cache-Control': 'no-cache' }); res.end(out.body); return true; } // takvim (.ics) gibi JSON olmayan yanıtlar
    send(res, 200, out || { ok: true });
  } catch (e) {
    const code = e.status || (e.code === 'NO_DB' ? 503 : 500);
    if (code >= 500 && !e.status) log.uygulama.hata('api.hata', { istek: c.istek, kullanici: c.user && c.user.id, isletme: c.user && c.user.tenant_id, ip: c.ip, veri: { yontem: req.method, yol }, hata: e });
    send(res, code, { ok: false, error: code === 500 ? 'Beklenmeyen bir hata oluştu' : e.message, ...(code === 500 ? { istek: c.istek } : {}), ...(e.extra || {}) });
  }
  return true;
}

async function init() {
  const conf = cfg.load();
  if (conf && conf.db) {
    try { const i = await db.connect(conf.db); log.uygulama.bilgi('db.baglandi', { mesaj: `Veritabanı bağlı: ${i.host}/${i.database} (${i.version})` }); } catch (e) { log.uygulama.hata('db.baglanamadi', { mesaj: 'Veritabanına bağlanılamadı', hata: e }); setTimeout(init, 15000); return; }
  }
  if (db.ready()) { try { const n = await require('./secrets').migrate(db); if (n) log.uygulama.bilgi('sifreleme.gecis', { mesaj: `Entegrasyon kimlik bilgileri şifrelendi: ${n} kayıt` }); } catch (e) { log.uygulama.hata('sifreleme.gecis', { mesaj: 'Kimlik bilgisi şifreleme geçişi', hata: e }); } }
  let hasAdmin = false; if (db.ready()) hasAdmin = !!(await db.one("SELECT id FROM users WHERE role='superadmin' LIMIT 1"));
  // Kurulum anahtarı bilerek düz yazılır: DEPLOY.md yöneticiyi bu satıra yönlendirir ve bir kez kullanılır (maskelenirse kurulum yapılamaz)
  if (!hasAdmin) { const t = cfg.setupToken(true); console.log(`\n  Kurulum gerekli → /admin/  ·  Kurulum anahtarı: ${t}\n  (anahtar ayrıca ${cfg.DATA}/setup-token.txt dosyasında)\n`); }
}
// Oturumdaki işletme sahibinin işletme adresi (uygulama sayfası yönlendirmesi için)
async function tenantSlug(req) {
  const u = await auth.current(req); if (!u || !u.tenant_id) return null;
  const t = await db.one('SELECT slug FROM tenants WHERE id=?', [u.tenant_id]); return t ? t.slug : null;
}
module.exports = { handle, init, send, tenantSlug, db, log, analitik, seo: require('./seo'), guven: require('./guven') };
