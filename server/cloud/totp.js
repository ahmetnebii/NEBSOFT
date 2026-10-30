// Platform yöneticisi için uygulama tabanlı iki adımlı giriş (RFC 6238, HMAC-SHA1, 30 sn, 6 hane). Bağımlılıksız.
// Gizli anahtar veritabanında cfg.encrypt ile şifrelidir ve kayda kullanıcı kimliğiyle bağlıdır. Kurtarma kodları sunucu anahtarıyla özetlenir.
// Zaman penceresi ±1 adım; aynı kod ikinci kez geçmez (last_step), doğrulama satır kilidiyle yapılır, eşzamanlı iki istekten biri düşer. 5 hatada 15 dakika kilit.
const crypto = require('crypto');
const cfg = require('./config');
const db = require('./db');
const sec = require('./security');

const ADIM = 30, HANE = 6, PENCERE = 1, ESIK = 5, KILIT = 15 * 60e3, KOD_ADET = 8, BILET = 5 * 60e3, ISSUER = 'NEBSOFT';
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const KOD_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan harf ve rakam yok

function b32yaz(buf) { let bit = 0, deger = 0, out = ''; for (const b of buf) { deger = (deger << 8) | b; bit += 8; while (bit >= 5) { out += B32[(deger >>> (bit - 5)) & 31]; bit -= 5; } deger &= (1 << bit) - 1; } if (bit) out += B32[(deger << (5 - bit)) & 31]; return out; }
function b32oku(s) { const out = []; let bit = 0, deger = 0; for (const c of String(s).toUpperCase().replace(/[\s=-]/g, '')) { const i = B32.indexOf(c); if (i < 0) throw new Error('Geçersiz base32'); deger = (deger << 5) | i; bit += 5; if (bit >= 8) { out.push((deger >>> (bit - 8)) & 255); bit -= 8; } deger &= (1 << bit) - 1; } return Buffer.from(out); }

function hotp(anahtar, sayac, hane = HANE) {
  const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(sayac)); const h = crypto.createHmac('sha1', anahtar).update(b).digest();
  return String((h.readUInt32BE(h[h.length - 1] & 15) & 0x7fffffff) % 10 ** hane).padStart(hane, '0');
}
const adimNo = (ms = Date.now()) => Math.floor(ms / 1000 / ADIM);
// Eşleşen adım numarası; yoksa null. Üç adım da hesaplanır, yanıt süresi kodun hangi adıma denk geldiğini vermez.
function eslesen(anahtar, kod, sonAdim, ms = Date.now()) {
  let bulunan = null; const k = adimNo(ms);
  for (let d = -PENCERE; d <= PENCERE; d++) if (sec.safeEq(hotp(anahtar, k + d), kod) && k + d > sonAdim && bulunan === null) bulunan = k + d;
  return bulunan;
}
const otpauth = (eposta, gizli) => `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(eposta)}?secret=${gizli}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=${HANE}&period=${ADIM}`;

// Şifreli saklama. Kayıttaki kullanıcı kimliği, başka satıra taşınan şifreli metnin açılmasını engeller. Anahtar değişiminde NEBSOFT_SECRET_ESKI ile okunur.
const muhurle = (uid, gizli) => cfg.encrypt({ u: uid, s: gizli });
function muhurAc(uid, metin) {
  for (const ana of [cfg.anahtar(), cfg.anahtarEski()].filter(Boolean)) { try { const o = cfg.decrypt(metin, ana); return o && o.u === uid ? b32oku(o.s) : null; } catch (e) { /* sıradaki anahtar */ } }
  return null;
}

// Kurtarma kodları: 10 karakter (50 bit), veritabanında yalnızca sunucu anahtarıyla alınmış özet durur
const kodNorm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const kodTuret = (ana) => Buffer.from(crypto.hkdfSync('sha256', ana, 'nebsoft-totp', 'kurtarma', 32));
const kodOzet = (ana, uid, kod) => crypto.createHmac('sha256', kodTuret(ana)).update(`${uid}\n${kod}`).digest('hex');
function kodUret() { const kod = () => { let s = ''; for (let i = 0; i < 10; i++) s += KOD_ABC[crypto.randomInt(KOD_ABC.length)]; return `${s.slice(0, 5)}-${s.slice(5)}`; }; const set = new Set(); while (set.size < KOD_ADET) set.add(kod()); return [...set]; }
const kodlarOzet = (uid, kodlar) => JSON.stringify(kodlar.map((k) => kodOzet(cfg.anahtar(), uid, kodNorm(k))));
function kodSira(uid, ozetler, kod) { const n = kodNorm(kod); const adaylar = [cfg.anahtar(), cfg.anahtarEski()].filter(Boolean).map((ana) => kodOzet(ana, uid, n)); let sira = -1; ozetler.forEach((o, i) => { adaylar.forEach((a) => { if (sec.safeEq(o, a) && sira < 0) sira = i; }); }); return sira; }

// Şifre doğrulandıktan sonra verilen, 5 dakikalık imzalı adım. Şifre değişince geçersiz olur; kod doğrulanmadan oturum açılmaz.
const biletMac = (govde, pass) => cfg.mac(`totp-bilet:${govde}:${crypto.createHash('sha256').update(String(pass)).digest('hex')}`);
function bilet(u, remember) { const g = Buffer.from(JSON.stringify({ u: u.id, r: !!remember, e: Date.now() + BILET })).toString('base64url'); return `${g}.${biletMac(g, u.pass)}`; }
async function biletOku(t) {
  if (typeof t !== 'string' || t.length > 400 || !t.includes('.')) return null;
  const [g, imza] = t.split('.'); let o; try { o = JSON.parse(Buffer.from(g, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!o || typeof o.u !== 'string' || !(o.e > Date.now())) return null;
  const u = await db.one("SELECT * FROM users WHERE id=? AND status='active'", [o.u]); if (!u || !sec.safeEq(biletMac(g, u.pass), imza)) return null;
  return { user: u, remember: !!o.r };
}

const kayit = (uid) => db.one('SELECT * FROM user_totp WHERE user_id=?', [uid]);
const etkin = async (uid) => !!(await db.one('SELECT user_id FROM user_totp WHERE user_id=? AND enabled=1', [uid]));
const epostaEtkin = async (eposta) => !!(await db.one('SELECT u.id FROM users u JOIN user_totp t ON t.user_id=u.id WHERE u.email=? AND t.enabled=1', [eposta]));
const kilitli = (r) => !!(r && r.locked_until && new Date(r.locked_until) > new Date());
const KILIT_HATA = 'Çok fazla hatalı kod. 15 dakika sonra tekrar deneyin.';

// Kurulumu başlatır: bekleyen anahtar yazılır, kod doğrulanana kadar etkin değildir. Etkin kayıt ezilemez.
async function kur(uid, eposta) {
  const gizli = b32yaz(crypto.randomBytes(20));
  await db.q('INSERT INTO user_totp (user_id, secret, enabled, created) VALUES (?,?,0,?) ON DUPLICATE KEY UPDATE secret=IF(enabled=0, VALUES(secret), secret), failed=IF(enabled=0, 0, failed), locked_until=IF(enabled=0, NULL, locked_until), created=IF(enabled=0, VALUES(created), created)', [uid, muhurle(uid, gizli), new Date()]);
  if (await etkin(uid)) return null;
  return { gizli, otpauth: otpauth(eposta, gizli) };
}
// Kodu doğrular ve sonucu kaydeder. Hata fırlatmaz: sayaç işleminin kalıcı olması için sonuç olarak döner.
//   kurtarma: true ise 6 hane dışındaki giriş kurtarma kodu sayılır. etkinlestir: kurulumdaki anahtarı açar ve kurtarma kodlarını üretir.
function dogrula(uid, girdi, { kurtarma = false, etkinlestir = false, ms = Date.now() } = {}) {
  return db.tx(async (t) => {
    const r = (await t.q('SELECT * FROM user_totp WHERE user_id=? FOR UPDATE', [uid]))[0];
    if (!r || (!r.enabled && !etkinlestir)) return { ok: false, hata: 'İki adımlı giriş etkin değil' };
    if (etkinlestir && r.enabled) return { ok: false, hata: 'İki adımlı giriş zaten etkin' };
    if (kilitli(r)) return { ok: false, kilit: true, hata: KILIT_HATA };
    const anahtar = muhurAc(uid, r.secret); if (!anahtar) return { ok: false, hata: 'Doğrulama anahtarı okunamadı. Sunucuda sıfırlama betiğini çalıştırın.' };
    const kod = String(girdi == null ? '' : girdi).replace(/\s/g, '');
    if (/^\d{6}$/.test(kod)) {
      const a = eslesen(anahtar, kod, Number(r.last_step), ms);
      if (a !== null) {
        const kodlar = etkinlestir ? kodUret() : null;
        await t.q(`UPDATE user_totp SET last_step=?, failed=0, locked_until=NULL${etkinlestir ? ', enabled=1, enabled_at=?, recovery=?' : ''} WHERE user_id=?`, etkinlestir ? [a, new Date(), kodlarOzet(uid, kodlar), uid] : [a, uid]);
        return { ok: true, tur: 'uygulama', kodlar };
      }
    } else if (kurtarma && r.enabled) {
      const ozetler = JSON.parse(r.recovery || '[]'); const i = kodSira(uid, ozetler, kod);
      if (i >= 0) { ozetler.splice(i, 1); await t.q('UPDATE user_totp SET recovery=?, failed=0, locked_until=NULL WHERE user_id=?', [JSON.stringify(ozetler), uid]); return { ok: true, tur: 'kurtarma', kalan: ozetler.length }; }
    }
    const f = Number(r.failed) + 1; const dur = f >= ESIK;
    await t.q('UPDATE user_totp SET failed=?, locked_until=? WHERE user_id=?', [dur ? 0 : f, dur ? new Date(Date.now() + KILIT) : null, uid]);
    return { ok: false, kilit: dur, hata: dur ? KILIT_HATA : 'Kod hatalı veya daha önce kullanıldı' };
  });
}
const durum = async (uid) => { const r = await kayit(uid); return { etkin: !!(r && r.enabled), kalan: r && r.enabled ? JSON.parse(r.recovery || '[]').length : 0, etkinTarih: r && r.enabled ? r.enabled_at : null, kilitli: kilitli(r) }; };
async function kodlariYenile(uid) { const kodlar = kodUret(); await db.q('UPDATE user_totp SET recovery=? WHERE user_id=? AND enabled=1', [kodlarOzet(uid, kodlar), uid]); return kodlar; }
const kapat = (uid) => db.q('DELETE FROM user_totp WHERE user_id=?', [uid]);

module.exports = { b32yaz, b32oku, hotp, adimNo, eslesen, otpauth, muhurle, muhurAc, kodUret, kodNorm, bilet, biletOku, etkin, epostaEtkin, kilitli, kayit, kur, dogrula, durum, kodlariYenile, kapat, KILIT_HATA, KOD_ADET };
