// Kimlik doğrulama: scrypt ile şifre özeti, rastgele oturum belirteci (veritabanında yalnızca SHA-256 özeti tutulur),
// HttpOnly + SameSite çerez, hatalı girişte hesap kilitleme.
const crypto = require('crypto');
const db = require('./db');
const sec = require('./security');

const COOKIE = 'nsid';
const uid = () => crypto.randomBytes(8).toString('hex');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const now = () => new Date();

function hash(pass) {
  return new Promise((res, rej) => { const salt = crypto.randomBytes(16); crypto.scrypt(pass, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(`scrypt$16384$8$1$${salt.toString('base64')}$${k.toString('base64')}`))); });
}
function verify(pass, stored) {
  return new Promise((res) => {
    const [alg, N, r, p, salt, h] = String(stored || '').split('$'); if (alg !== 'scrypt') return res(false);
    crypto.scrypt(pass, Buffer.from(salt, 'base64'), 64, { N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 }, (e, k) => res(!e && crypto.timingSafeEqual(k, Buffer.from(h, 'base64'))));
  });
}
// Kullanıcı yoksa da aynı süre harcanır (e-posta tahminini zorlaştırır)
const DUMMY = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

async function createSession(req, res, user, remember) {
  const token = crypto.randomBytes(32).toString('base64url');
  const days = remember ? 30 : 1;
  await db.q('INSERT INTO sessions (id, user_id, created, expires, ip, ua) VALUES (?,?,?,?,?,?)', [sha(token), user.id, now(), new Date(Date.now() + days * 864e5), sec.ip(req), String(req.headers['user-agent'] || '').slice(0, 250)]);
  setCookie(req, res, token, remember ? days * 86400 : null);
}
function setCookie(req, res, token, maxAge) {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (sec.isHttps(req) || process.env.NODE_ENV === 'production') parts.push('Secure');
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}
async function destroySession(req, res) {
  const t = sec.cookies(req)[COOKIE]; if (t) await db.q('DELETE FROM sessions WHERE id=?', [sha(t)]).catch(() => {});
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
async function current(req) {
  if (req._user !== undefined) return req._user;
  req._user = null;
  const t = sec.cookies(req)[COOKIE]; if (!t || !db.ready() || t.length > 100) return null;
  const u = await db.one('SELECT u.id, u.email, u.name, u.phone, u.role, u.tenant_id, u.status, s.expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?', [sha(t)]);
  if (!u || new Date(u.expires) < now() || u.status !== 'active') return null;
  req._user = u; return u;
}
// Şifreyi doğrular (kilitleme kurallarıyla) ama oturum açmaz
async function check(email, pass) {
  const u = await db.one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  if (!u) { await verify(pass, DUMMY); return { ok: false, error: 'E-posta veya şifre hatalı' }; }
  if (u.locked_until && new Date(u.locked_until) > now()) return { ok: false, error: 'Çok fazla hatalı deneme. Hesap 15 dakika kilitlendi.' };
  if (u.status !== 'active') return { ok: false, error: 'Hesap devre dışı. Destekle iletişime geçin.' };
  if (!(await verify(pass, u.pass))) { const f = u.failed + 1; await db.q('UPDATE users SET failed=?, locked_until=? WHERE id=?', [f >= 5 ? 0 : f, f >= 5 ? new Date(Date.now() + 15 * 60e3) : null, u.id]); return { ok: false, error: f >= 5 ? 'Çok fazla hatalı deneme. Hesap 15 dakika kilitlendi.' : 'E-posta veya şifre hatalı' }; }
  return { ok: true, user: u };
}
async function login(req, res, email, pass, remember) {
  const u = await db.one('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  if (!u) { await verify(pass, DUMMY); return { ok: false, error: 'E-posta veya şifre hatalı' }; }
  if (u.locked_until && new Date(u.locked_until) > now()) return { ok: false, error: 'Çok fazla hatalı deneme. Hesap 15 dakika kilitlendi.' };
  if (u.status !== 'active') return { ok: false, error: 'Hesap devre dışı. Destekle iletişime geçin.' };
  if (!(await verify(pass, u.pass))) {
    const f = u.failed + 1;
    await db.q('UPDATE users SET failed=?, locked_until=? WHERE id=?', [f >= 5 ? 0 : f, f >= 5 ? new Date(Date.now() + 15 * 60e3) : null, u.id]);
    return { ok: false, error: f >= 5 ? 'Çok fazla hatalı deneme. Hesap 15 dakika kilitlendi.' : 'E-posta veya şifre hatalı' };
  }
  await db.q('UPDATE users SET failed=0, locked_until=NULL, last_login=?, last_ip=? WHERE id=?', [now(), sec.ip(req), u.id]);
  await createSession(req, res, u, remember);
  return { ok: true, user: u };
}
setInterval(() => { if (db.ready()) db.q('DELETE FROM sessions WHERE expires < ?', [now()]).catch(() => {}); }, 3600e3).unref();
module.exports = { uid, sha, hash, verify, createSession, destroySession, current, login, check, COOKIE };
