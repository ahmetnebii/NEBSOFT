// Müşteriye açık sayfalar (online randevu, takip, veli/üye/bayi portalı, QR menü...) için işletme bazlı uç noktalar.
// Adres: /t/<işletme>/apps/<uygulama>/<sayfa>.html → veri: /api/public/<işletme>/<uygulama>/(view|ops)
// Sunucu sayfaya yalnızca kurallarda izin verilen alanları verir; sayfanın yaptığı değişiklikler kayıt düzeyinde
// işlemlere (ekle / güncelle / sil) çevrilip gönderilir ve her biri server/cloud/public-rules.js beyaz listesine göre doğrulanır.
const db = require('./db');
const cfg = require('./config');
const sec = require('./security');
const { R, err, valid, J } = require('./routes');
const RULES = require('./public-rules');
require('./bridge');

const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt: { cloudOnly: true, ...opt }, fn });
const TOKEN_HOURS = 12;
const FAILS = new Map();

// Müşteri girişi belirteci: işletme + uygulama + kimlik, HMAC ile imzalı, 12 saat geçerli
const signToken = (p) => { const body = Buffer.from(JSON.stringify({ ...p, e: Date.now() + TOKEN_HOURS * 3600e3 })).toString('base64url'); return body + '.' + cfg.mac(body); };
function readToken(tok, tenant, app) {
  if (typeof tok !== 'string' || tok.length > 600 || !tok.includes('.')) return null;
  const [body, sig] = tok.split('.');
  if (cfg.mac(body) !== sig) return null;
  const p = J(Buffer.from(body, 'base64url').toString('utf8'), null);
  return p && p.t === tenant && p.a === app && p.e > Date.now() ? p : null;
}

async function context(c) {
  const { slug, app } = c.params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !sec.V.app(app)) throw err(404, 'Sayfa bulunamadı');
  const rule = RULES[app]; if (!rule) throw err(404, 'Bu uygulamanın müşteri sayfası yok');
  const t = await db.one('SELECT id, name, slug, phone, address, status, ref_code FROM tenants WHERE slug=?', [slug]);
  if (!t || t.status !== 'active') throw err(404, 'İşletme bulunamadı');
  const lic = await db.one('SELECT status, end FROM licenses WHERE tenant_id=? AND product=?', [t.id, app]);
  if (!valid(lic)) throw err(402, 'Bu hizmet şu anda kullanılamıyor. Lütfen işletmeyle iletişime geçin.');
  return { t, app, rule };
}

// Ayarlarda gizli kalması gereken anahtarlar (API anahtarları, şifreler, PIN'ler, entegrasyon bilgileri)
const SECRET = /pass|pin$|^pin|secret|token|apikey|api_key|apiKey|key$|sms|smtp|mail(user|pass)|webhook|cred|merchant|terminal|_?private/i;
function cleanSettings(s, allow) {
  if (!s || typeof s !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (allow && !allow.includes(k)) continue;
    if (SECRET.test(k)) continue;
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? cleanSettings(v) : v;
  }
  return out;
}
const pick = (o, f) => { if (!o) return o; if (f === true) return o; const r = {}; f.forEach((k) => { if (o[k] !== undefined) r[k] = o[k]; }); return r; };
const omit = (o, f) => { if (!o) return o; const r = { ...o }; f.forEach((k) => delete r[k]); return r; };

function helpers(doc, ident, q) {
  const col = (n) => (Array.isArray(doc[n]) ? doc[n] : []);
  return {
    doc, ident, q: q || {}, col, now: new Date(), today: new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10),
    get: (n, id) => col(n).find((x) => x.id === id),
    seq: (n, prefix = '') => { doc._meta = doc._meta || {}; const k = '_seq_' + n; doc._meta[k] = (doc._meta[k] || 1000) + 1; return prefix + doc._meta[k]; },
    pick, omit,
  };
}

function buildView(rule, doc, x) {
  const meta = doc._meta || {}; const seqs = Object.fromEntries(Object.entries(meta).filter(([k]) => k.startsWith('_seq_')));
  const out = { _meta: { created: meta.created, pub: true, ...seqs }, _settings: cleanSettings(doc._settings, rule.settings) };
  for (const [n, f] of Object.entries(rule.pub || {})) {
    const arr = x.col(n); const keep = typeof f === 'object' && f.where ? arr.filter((r) => f.where(r, x)) : arr;
    const fields = typeof f === 'object' && !Array.isArray(f) ? f.fields || true : f;
    out[n] = keep.map((r) => (typeof f === 'object' && f.omit ? omit(r, f.omit) : pick(r, fields)));
  }
  if (rule.view) Object.assign(out, rule.view(x) || {});
  // Kişiye özel kayıtlar: yalnızca giriş yapan kimliğin kayıtları
  return out;
}

async function load(t, app) {
  const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [t.id, app]);
  const doc = r ? J(r.data, null) : null;
  if (!doc) throw err(404, 'İşletme bu hizmeti henüz yayına almadı');
  return { doc, version: r.version };
}

// Görünüm: sayfanın ilk açılışı, giriş/sorgulama (q) ve yenileme
route('POST', '/api/public/:slug/:app/view', { auth: 'none', limit: ['pubv', 240, 60e3], bodyMax: 20e3 }, async (c) => {
  const { t, app, rule } = await context(c);
  const { doc, version } = await load(t, app);
  const q = c.body.q && typeof c.body.q === 'object' ? c.body.q : null;
  let ident = readToken(c.body.token, t.id, app); let token;
  if (q && Object.keys(q).length) {
    if (!rule.login) throw err(400, 'Bu sayfada sorgulama yok');
    // Kaba kuvvet koruması: yalnızca başarısız denemeler sayılır (IP + işletme başına 10 dakikada 20)
    const fk = `${c.ip}:${t.id}`; const f = FAILS.get(fk);
    if (f && f.n >= 20 && Date.now() - f.at < 600e3) throw err(429, 'Çok fazla hatalı deneme. 10 dakika sonra tekrar deneyin.');
    const id = rule.login(helpers(doc, null, q), q);
    if (!id) { FAILS.set(fk, { n: f && Date.now() - f.at < 600e3 ? f.n + 1 : 1, at: f && Date.now() - f.at < 600e3 ? f.at : Date.now() }); if (FAILS.size > 50000) FAILS.clear(); throw err(401, rule.loginError || 'Bilgiler eşleşmedi', { code: 'login' }); }
    ident = { t: t.id, a: app, k: id.k || 'id', i: String(id.i) }; token = signToken(ident);
  }
  const view = buildView(rule, doc, helpers(doc, ident, q));
  // Ek sorgu (ör. indirim kodu): kimlik değiştirmez, her yüklemede istemci tekrar gönderir
  if (c.body.x && typeof c.body.x === 'object' && rule.query) { const ex = rule.query(helpers(doc, ident, c.body.x), c.body.x); if (ex) Object.assign(view, ex); }
  return { ok: true, version, data: view, token, ident: ident ? { k: ident.k, i: ident.i } : null, tenant: { name: t.name, slug: t.slug, phone: t.phone, ref: t.ref_code } };
});

// İşlemler: [{ c: 'koleksiyon', op: 'ins'|'upd'|'del', rec | id+set+unset }]
const MAX_OPS = 60, MAX_REC = 40e3;
route('POST', '/api/public/:slug/:app/ops', { auth: 'none', limit: ['pubo', 40, 60e3], bodyMax: 400e3 }, async (c) => {
  const { t, app, rule } = await context(c);
  const ops = Array.isArray(c.body.ops) ? c.body.ops : null;
  if (!ops || !ops.length || ops.length > MAX_OPS) throw err(400, 'Geçersiz işlem');
  const ident = readToken(c.body.token, t.id, app);
  const res = await db.tx(async (tx) => {
    const row = (await tx.q('SELECT data, version FROM app_data WHERE tenant_id=? AND app=? FOR UPDATE', [t.id, app]))[0];
    const doc = row ? J(row.data, null) : null; if (!doc) throw err(404, 'İşletme bu hizmeti henüz yayına almadı');
    const x = helpers(doc, ident, c.body.x && typeof c.body.x === 'object' ? c.body.x : null); const after = [];
    // Önce eklemeler (kurallardaki koleksiyon sırasıyla: önce müşteri, sonra ona bağlı kayıt), sonra güncelleme ve silmeler
    const order = Object.keys(rule.write || {}); const rank = (o) => ({ ins: 0, upd: 1, key: 1, del: 2 }[o && o.op] ?? 3) * 100 + Math.max(0, order.indexOf(o && o.c));
    ops.sort((a, b) => rank(a) - rank(b));
    for (const o of ops) {
      if (!o || typeof o !== 'object' || typeof o.c !== 'string') throw err(400, 'Geçersiz işlem');
      const w = (rule.write || {})[o.c]; const name = o.c;
      if (w === 'ignore') continue; // sayfanın yan etkisi; sunucu kendisi hesaplar
      if (!w || !Object.prototype.hasOwnProperty.call(rule.write, name)) throw err(403, 'Bu değişikliğe izin verilmiyor');
      if (o.op !== 'key' && !Array.isArray(doc[name])) doc[name] = [];
      if (o.op === 'ins') {
        if (!w.ins || !o.rec || typeof o.rec !== 'object' || JSON.stringify(o.rec).length > MAX_REC) throw err(403, 'Kayıt eklenemez');
        const id = String(o.rec.id || '').slice(0, 40); if (!/^[A-Za-z0-9_-]{4,40}$/.test(id) || doc[name].some((r) => r.id === id)) throw err(400, 'Geçersiz kayıt');
        const rec = w.ins(o.rec, x); if (!rec) throw err(403, 'Kayıt eklenemez');
        rec.id = id; doc[name].push(rec); after.push([name, rec]);
      } else if (o.op === 'upd') {
        const cur = doc[name].find((r) => r.id === o.id); if (!cur) throw err(409, 'Kayıt bulunamadı veya değişmiş. Sayfayı yenileyin.');
        if (!w.upd) throw err(403, 'Bu kayıt değiştirilemez');
        const set = o.set && typeof o.set === 'object' ? o.set : {}; const unset = Array.isArray(o.unset) ? o.unset.map(String) : [];
        if (JSON.stringify(set).length > MAX_REC) throw err(400, 'Kayıt çok büyük');
        const patch = w.upd(cur, set, x, unset); if (!patch) throw err(403, 'Bu kayıt değiştirilemez');
        Object.assign(cur, patch); after.push([name, cur]);
      } else if (o.op === 'key') { // nesne biçimli koleksiyon (ör. docs["müşteri|dönem"])
        if (!w.key || typeof o.key !== 'string' || o.key.length > 120) throw err(403, 'Bu değişikliğe izin verilmiyor');
        if (!doc[name] || typeof doc[name] !== 'object' || Array.isArray(doc[name])) doc[name] = {};
        if (JSON.stringify(o.val === undefined ? null : o.val).length > MAX_REC) throw err(400, 'Kayıt çok büyük');
        doc[name][o.key] = w.key(o.key, o.val, doc[name][o.key], x); after.push([name, doc[name][o.key]]);
      } else if (o.op === 'del') {
        const cur = doc[name].find((r) => r.id === o.id); if (!cur) continue;
        if (!w.del || !w.del(cur, x)) throw err(403, 'Bu kayıt silinemez');
        doc[name] = doc[name].filter((r) => r !== cur);
      } else throw err(400, 'Geçersiz işlem');
    }
    if (rule.after) rule.after(x, after);
    // Ziyaretçinin az önce oluşturduğu kayıt (ör. rezervasyon) için kimlik: onay sayfasında kendi kaydını görebilsin
    const g = rule.grant && rule.grant(x, after); if (g) x.ident = { t: t.id, a: app, k: g.k, i: String(g.i) };
    // İşletmenin işlem kaydına not düş
    if (Array.isArray(doc._log) && after.length) { doc._log.unshift({ id: 'p' + Date.now().toString(36), at: new Date().toISOString(), action: 'Müşteri sayfası', detail: after.map(([n]) => n).filter((v, i, a) => a.indexOf(v) === i).join(', '), user: 'Online' }); if (doc._log.length > 300) doc._log.length = 300; }
    await tx.q('UPDATE app_data SET data=?, version=version+1, updated=? WHERE tenant_id=? AND app=?', [JSON.stringify(doc), new Date(), t.id, app]);
    return { doc, version: row.version + 1, ident: x.ident };
  });
  const fresh = res.ident && res.ident !== ident ? res.ident : null;
  const view = buildView(rule, res.doc, helpers(res.doc, res.ident, null));
  if (c.body.x && typeof c.body.x === 'object' && rule.query) { const ex = rule.query(helpers(res.doc, res.ident, c.body.x), c.body.x); if (ex) Object.assign(view, ex); }
  return { ok: true, version: res.version, data: view, token: fresh ? signToken(fresh) : undefined, ident: res.ident ? { k: res.ident.k, i: res.ident.i } : null };
});

module.exports = { signToken, readToken, cleanSettings };
