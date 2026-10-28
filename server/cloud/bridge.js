// Bulut modunda servis köprüsü: pazaryeri API'leri, dış servis istekleri ve işletmeye özel webhook gelen kutusu.
// Yerel donanım (yazıcı, POS terminali) bulut sunucusundan değil, işletmedeki bilgisayarda çalışan köprüden kullanılır.
const db = require('./db');
const sec = require('./security');
const kanal = require('../connectors');
const { R, err } = require('./routes');
const secrets = require('./secrets');

const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), opt: { cloudOnly: true, ...opt }, fn });
const needTenant = (c) => { if (!c.user.tenant_id) throw err(400, 'İşletme hesabı gerekli'); };

route('GET', '/api/kanal', { auth: 'user' }, async (c) => {
  needTenant(c); const t = await db.one('SELECT webhook_token FROM tenants WHERE id=?', [c.user.tenant_id]);
  return { ok: true, ...kanal.info(), webhook: `/api/webhook/<kanal>?token=${t.webhook_token}` };
});
route('POST', '/api/kanal', { auth: 'user', limit: ['kanal', 120, 60e3] }, async (c) => {
  needTenant(c); if (!c.body.channel || !c.body.action) throw err(400, 'channel ve action gerekli');
  c.body = await secrets.resolve(db, c.user.tenant_id, c.body); // kayıtlı kimlik bilgileri sunucuda yerine konur
  return kanal.run(String(c.body.channel), String(c.body.action), c.body.creds || {}, c.body.payload || {});
});
route('POST', '/api/inbox', { auth: 'user' }, async (c) => {
  needTenant(c); const ch = String(c.body.channel || '').slice(0, 40);
  const rows = await db.q('SELECT id, payload, at FROM inbox WHERE tenant_id=? AND channel=? ORDER BY id LIMIT 500', [c.user.tenant_id, ch]);
  if (rows.length) await db.q('DELETE FROM inbox WHERE tenant_id=? AND channel=? AND id<=?', [c.user.tenant_id, ch, rows[rows.length - 1].id]);
  return { ok: true, items: rows.map((r) => ({ id: String(r.id), at: r.at, body: JSON.parse(r.payload) })) };
});
route('POST', '/api/webhook/:kanal', { auth: 'none', csrf: false, limit: ['hook', 300, 60e3], bodyMax: 2e6 }, async (c) => {
  const ch = c.params.kanal; if (!kanal.PUSH.includes(ch)) throw err(404, 'Bilinmeyen kanal');
  const tok = String(c.query.get('token') || c.req.headers['x-nebsoft-token'] || '');
  if (!/^[a-f0-9]{32}$/.test(tok)) throw err(401, 'Geçersiz belirteç');
  const t = await db.one("SELECT id FROM tenants WHERE webhook_token=? AND status='active'", [tok]); if (!t) throw err(401, 'Geçersiz belirteç');
  await db.q('INSERT INTO inbox (tenant_id, channel, payload, at) VALUES (?,?,?,?)', [t.id, ch, JSON.stringify(c.body), new Date()]);
  return { ok: true };
});
route('POST', '/api/istek', { auth: 'user', limit: ['istek', 120, 60e3], bodyMax: 2e6 }, async (c) => {
  needTenant(c); const b = await secrets.resolve(db, c.user.tenant_id, c.body); // kayıtlı kimlik bilgileri sunucuda yerine konur
  // Webhook imzası: tarayıcı anahtarı göremediği için X-Nebsoft-Sign ile gelen (çözülmüş) anahtarla gövde burada imzalanır
  if (b.headers && b.headers['X-Nebsoft-Sign']) { const k = String(b.headers['X-Nebsoft-Sign']); delete b.headers['X-Nebsoft-Sign']; if (k && !/__nsg_/.test(k)) b.headers['X-Nebsoft-Signature'] = require('crypto').createHmac('sha256', k).update(String(b.body || '')).digest('hex'); }
  if (!(await sec.publicUrl(b.url))) throw err(400, 'Yalnızca internetteki (iç ağ olmayan) http/https adreslerine istek atılabilir');
  try {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 15000);
    const method = String(b.method || 'POST').toUpperCase();
    const r = await fetch(b.url, { method, headers: b.headers || {}, body: ['GET', 'HEAD'].includes(method) ? undefined : b.body, signal: ctrl.signal, redirect: 'manual' });
    clearTimeout(tm); const text = await r.text();
    return { ok: r.ok, status: r.status, body: text.slice(0, 500000) };
  } catch (e) { throw err(502, 'Servise ulaşılamadı: ' + e.message + (e.cause && e.cause.code ? ' (' + e.cause.code + ')' : '')); }
});
route('GET', '/api/durum', { auth: 'none' }, async () => ({ ok: true, version: '2.0', cloud: true, kanal: kanal.info() }));
