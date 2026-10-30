// İki adımlı giriş yönetimi (yalnızca platform yöneticisi). Giriş adımı routes.js içindeki /api/auth/login'dedir.
// Açma, kapatma ve kurtarma kodu yenileme hesap şifresi ister: açık kalmış oturumu ele geçiren kişi korumayı kaldıramaz.
const db = require('./db');
const auth = require('./auth');
const totp = require('./totp');
const { R, err, audit } = require('./routes');

const route = (method, path, opt, fn) => R.push({ method, re: new RegExp('^' + path + '$'), opt: { auth: 'admin', cloudOnly: true, limit: ['totp', 30, 600e3], ...opt }, fn });
const sifre = async (c) => { const u = await db.one('SELECT pass FROM users WHERE id=?', [c.user.id]); if (!u || !(await auth.verify(String(c.body.pass || ''), u.pass))) { await audit(c, 'İki adımlı giriş: şifre hatalı'); throw err(403, 'Hesap şifresi hatalı'); } };
const kodGerek = async (c) => { const s = await totp.dogrula(c.user.id, c.body.code, { kurtarma: true }); if (!s.ok) { await audit(c, 'Hatalı iki adımlı kod'); throw err(s.kilit ? 429 : 400, s.hata); } };

route('GET', '/api/auth/totp', { limit: undefined }, async (c) => ({ ok: true, ...(await totp.durum(c.user.id)) }));
route('POST', '/api/auth/totp/kur', {}, async (c) => {
  await sifre(c); const k = await totp.kur(c.user.id, c.user.email); if (!k) throw err(400, 'İki adımlı giriş zaten etkin');
  await audit(c, 'İki adımlı giriş kurulumu başladı'); return { ok: true, gizli: k.gizli, otpauth: k.otpauth };
});
// Kod doğrulanmadan etkinleşmez. Etkinleşince bu oturum dışındakiler ve bekleyen e-posta giriş kodları düşer: eski yol ikinci adımı atlatamaz.
route('POST', '/api/auth/totp/etkinlestir', {}, async (c) => {
  const s = await totp.dogrula(c.user.id, c.body.code, { etkinlestir: true }); if (!s.ok) throw err(s.kilit ? 429 : 400, s.hata);
  const t = require('./security').cookies(c.req)[auth.COOKIE]; await db.q('DELETE FROM sessions WHERE user_id=? AND id<>?', [c.user.id, auth.sha(t)]);
  await db.q("DELETE FROM email_codes WHERE email=? AND purpose='login'", [c.user.email]); await db.q('DELETE FROM login_links WHERE user_id=?', [c.user.id]);
  await audit(c, 'İki adımlı giriş etkinleştirildi'); return { ok: true, kodlar: s.kodlar };
});
route('POST', '/api/auth/totp/kodlar', {}, async (c) => { await sifre(c); await kodGerek(c); const kodlar = await totp.kodlariYenile(c.user.id); await audit(c, 'Kurtarma kodları yenilendi'); return { ok: true, kodlar }; });
route('POST', '/api/auth/totp/kapat', {}, async (c) => { await sifre(c); await kodGerek(c); await totp.kapat(c.user.id); await audit(c, 'İki adımlı giriş kapatıldı'); return { ok: true }; });
