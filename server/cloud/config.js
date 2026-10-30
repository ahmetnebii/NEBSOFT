// Sunucu ayarları: veritabanı bağlantı bilgileri diskte AES-256-GCM ile şifreli tutulur (data/config.enc).
// Anahtar: NEBSOFT_SECRET ortam değişkeni (önerilen) ya da ilk çalıştırmada üretilen data/secret.key (yalnız sahibi okuyabilir).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const log = require('./log');

const DATA = process.env.NEBSOFT_DATA || path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA, 'config.enc');
const KEYFILE = path.join(DATA, 'secret.key');
const TOKENFILE = path.join(DATA, 'setup-token.txt');

function ensureDir() { fs.mkdirSync(DATA, { recursive: true, mode: 0o700 }); }
function key() {
  if (process.env.NEBSOFT_SECRET) return crypto.createHash('sha256').update(process.env.NEBSOFT_SECRET).digest();
  ensureDir();
  if (!fs.existsSync(KEYFILE)) fs.writeFileSync(KEYFILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  return Buffer.from(fs.readFileSync(KEYFILE, 'utf8').trim(), 'hex');
}
// Anahtar değişiminde eski değer NEBSOFT_SECRET_ESKI ile verilir (belge.js, pin.js)
const anahtarEski = () => (process.env.NEBSOFT_SECRET_ESKI ? crypto.createHash('sha256').update(process.env.NEBSOFT_SECRET_ESKI).digest() : null);
function encrypt(obj) {
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}
function decrypt(b64, anahtar = key()) {
  const buf = Buffer.from(b64, 'base64'); const d = crypto.createDecipheriv('aes-256-gcm', anahtar, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8'));
}
function load() {
  try { return fs.existsSync(FILE) ? decrypt(fs.readFileSync(FILE, 'utf8')) : null; } catch (e) { log.uygulama.hata('ayar.cozulemedi', { mesaj: 'Ayar dosyası çözülemedi (NEBSOFT_SECRET değişmiş olabilir)', hata: e }); return null; }
}
const configured = () => fs.existsSync(FILE);
function save(cfg) { ensureDir(); fs.writeFileSync(FILE, encrypt(cfg), { mode: 0o600 }); }
// İlk kurulum belirteci: kurulum ekranını yalnızca sunucuya erişimi olan kişi kullanabilsin
function setupToken(create) {
  ensureDir();
  if (fs.existsSync(TOKENFILE)) return fs.readFileSync(TOKENFILE, 'utf8').trim();
  if (!create) return null;
  const t = crypto.randomBytes(12).toString('base64url'); fs.writeFileSync(TOKENFILE, t, { mode: 0o600 }); return t;
}
function clearSetupToken() { try { fs.unlinkSync(TOKENFILE); } catch (e) { /* yok */ } }
// İmza (müşteri sayfası belirteçleri için): ana anahtardan türetilen ayrı HMAC anahtarı
const mac = (text) => crypto.createHmac('sha256', crypto.createHash('sha256').update(Buffer.concat([key(), Buffer.from('public-token')])).digest()).update(text).digest('base64url');
module.exports = { mac, load, save, configured, setupToken, clearSetupToken, DATA, encrypt, decrypt, anahtar: key, anahtarEski };
