// NEBSOFT günlük yapısı: tek ortak olay şeması, üç kanal (uygulama, denetim, analitik) ve otomatik maskeleme.
//  • Bu dosya başka hiçbir sunucu modülüne bağlı değildir (config.js bile kullanabilir); veritabanı yazıcıları kanal() ile sonradan bağlanır.
//  • Parola, kart, TC, telefon, sağlık verisi, belirteç ve API anahtarı hem alan adından hem değer deseninden yakalanır.
//  • Ayrıntı ve saklama süreleri: docs/LOG-YAPISI.md
const crypto = require('crypto');

const KANALLAR = ['uygulama', 'denetim', 'analitik'];
const SEVIYE = { bilgi: 1, uyari: 2, hata: 3 };
const M = { gizli: '[GİZLİ]', kart: '[KART]', iban: '[IBAN]', kimlik: '[KİMLİK]', telefon: '[TELEFON]', saglik: '[SAĞLIK]' };

// ---------- Alan adından maskeleme ----------
const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
const kelimeler = (k) => String(k).replace(/([a-z0-9çğıöşü])([A-ZÇĞİÖŞÜ])/g, '$1_$2').replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR[c]).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const SET = (s) => new Set(s.split(' '));
const SINIF = [
  ['kart', SET('kart kartno card cardno pan cvv cvc cvc2 skt iban'), ['creditcard', 'kartnumarasi', 'cardnumber', 'kredikarti']],
  ['kimlik', SET('tc tckn tcno tckimlik vkn kimlik kimlikno ssn pasaport passport'), ['nationalid', 'tcno', 'vergino']],
  ['telefon', SET('telefon tel phone gsm cep mobile msisdn'), ['cepno', 'telno']],
  ['saglik', SET('tani teshis hastalik ilac recete alerji tedavi muayene sikayet kronik ameliyat saglik health diagnosis medula epikriz tahlil hamilelik gebelik psikiyatri'), ['kangrubu', 'sgkno']],
  ['gizli', SET('pass passwd pwd password parola sifre secret token tokens belirtec bearer cookie cookies session sessions oturum csrf otp pin key anahtar nsid ticket authorization'), ['apikey', 'accesskey', 'secretkey', 'privatekey', 'clientsecret']],
];
function alanSinifi(k) {
  const w = kelimeler(k); if (!w.length) return null; const c = w.join('');
  for (const [ad, set, bitisik] of SINIF) if (w.some((x) => set.has(x)) || bitisik.some((b) => c.includes(b))) return ad;
  return null;
}

// ---------- Değer deseninden maskeleme ----------
const luhn = (d) => { let s = 0; for (let i = 0; i < d.length; i++) { let x = Number(d[d.length - 1 - i]); if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return s % 10 === 0; };
const tcGecerli = (d) => { const n = [...d].map(Number); if (n[0] === 0) return false; const t = n[0] + n[2] + n[4] + n[6] + n[8]; const c = n[1] + n[3] + n[5] + n[7]; return ((t * 7 - c) % 10 + 10) % 10 === n[9] && (t + c + n[9]) % 10 === n[10]; };
const L = '(?<![\\p{L}\\p{N}_])';
const RX = {
  saglik: new RegExp(`${L}(tan[ıi]|te[şs]his|hastal[ıi]k|ila[çc]|re[çc]ete|alerji|tedavi|muayene\\s*notu|[şs]ik[aâ]yet)\\s*[:=]\\s*[^,;&\\n]+`, 'giu'),
  cerez: new RegExp(`${L}(set-cookie|cookie)\\s*[:=]\\s*[^\\n]+`, 'giu'),
  anahtar: new RegExp(`${L}(parola|[şs]ifre|password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|authorization|cvv|cvc|kart(?:\\s*no)?|tc(?:\\s*kimlik)?(?:\\s*no)?|tckn?)\\s*[:=]\\s*("[^"]*"|'[^']*'|[^\\s,;&]+)`, 'giu'),
  urlKimlik: /(\/\/[^/\s:@]+):[^/\s@]+@/g,
  yetki: /\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  jwt: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*/g,
  onek: /\b(?:sk|pk|rk)[-_](?:live|test|ant|proj)[-_][A-Za-z0-9_-]{8,}|\bsk-[A-Za-z0-9_-]{16,}|\bAKIA[0-9A-Z]{12,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bxox[abprs]-[A-Za-z0-9-]{10,}|\bAIza[A-Za-z0-9_-]{20,}/g,
  kart: /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g,
  iban: /\bTR\d{2}(?:[ ]?\d{4}){5}[ ]?\d{2}\b/gi,
  tc: /(?<!\d)[1-9]\d{10}(?!\d)/g,
  telefon: /(?<![\d+])(?:(?:(?:\+|00)?90[ .-]?|0[ .-]?)\(?[2-5]\d{2}\)?|\(?5\d{2}\)?)[ .-]?\d{3}[ .-]?\d{2}[ .-]?\d{2}(?!\d)/g,
  uzunHex: /(?<![A-Za-z0-9_-])[A-Fa-f0-9]{32,}(?![A-Za-z0-9_-])/g,
  uzunB64: /(?<![\w/-])[A-Za-z0-9_-]{40,}(?![\w-])/g,
  eposta: /([^\s@"'<>(),;:]{1,2})[^\s@"'<>(),;:]*@([^\s@"'<>(),;:]+\.[^\s@"'<>(),;:]{2,})/g,
};
// { eposta: false } denetim kanalında kullanılır: güvenlik kaydı hangi hesabın işlem yaptığını göstermek zorundadır
function maskeMetin(s, o = {}) {
  let t = String(s == null ? '' : s);
  t = t.replace(RX.saglik, (m, k) => `${k}: ${M.saglik}`).replace(RX.cerez, (m, k) => `${k}: ${M.gizli}`).replace(RX.anahtar, (m, k) => `${k}=${M.gizli}`).replace(RX.urlKimlik, `$1:${M.gizli}@`);
  t = t.replace(RX.yetki, (m, k) => `${k} ${M.gizli}`).replace(RX.jwt, M.gizli).replace(RX.onek, M.gizli);
  t = t.replace(RX.iban, M.iban).replace(RX.kart, (m) => { const d = m.replace(/\D/g, ''); return d.length >= 13 && d.length <= 19 && luhn(d) ? M.kart : m; });
  t = t.replace(RX.tc, (m) => (tcGecerli(m) ? M.kimlik : m)).replace(RX.telefon, M.telefon);
  t = t.replace(RX.uzunHex, M.gizli).replace(RX.uzunB64, (m) => (/\d/.test(m) && /[A-Za-z]/.test(m) ? M.gizli : m));
  if (o.eposta !== false) t = t.replace(RX.eposta, (m, a, b) => `${a}***@${b}`);
  return t;
}
function maskele(v, o = {}, derin = 0, gorulen = new WeakSet()) {
  if (v === null || v === undefined || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') return maskeMetin(v.length > 4000 ? v.slice(0, 4000) + '…' : v, o);
  if (typeof v === 'bigint') return maskeMetin(String(v), o);
  if (typeof v === 'function' || typeof v === 'symbol') return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  if (Buffer.isBuffer(v) || ArrayBuffer.isView(v)) return '[İKİLİ VERİ]';
  if (v instanceof Error) return hataAlani(v);
  if (gorulen.has(v)) return '[DÖNGÜ]'; gorulen.add(v);
  if (derin >= 6) return '[DERİN]';
  if (Array.isArray(v)) return v.slice(0, 100).map((x) => maskele(x, o, derin + 1, gorulen));
  const out = {};
  for (const k of Object.keys(v).slice(0, 100)) {
    const s = alanSinifi(k);
    if (s && v[k] !== null && v[k] !== undefined && v[k] !== '' && typeof v[k] !== 'boolean') out[k] = M[s];
    else out[k] = maskele(v[k], o, derin + 1, gorulen);
  }
  return out;
}
// Hata nesnesi: yalnızca ad, kod, ileti ve yığın alınır. SQL metni ve parametreleri (mysql2 e.sql) bilerek alınmaz.
const hataAlani = (e) => (e && typeof e === 'object' ? { ad: e.name, kod: e.code, ileti: maskeMetin(e.message), yigin: e.stack ? maskeMetin(String(e.stack).split('\n').slice(1, 8).join('\n')) : undefined } : { ileti: maskeMetin(e) });

// IP adresi uygulama günlüklerine girmez; günlük değişen tuzla kısa özet yazılır (aynı gün aynı kaynağı izlemeye yeter, geri çözülemez)
let tuz = { gun: '', v: null };
function ipOzet(ip) {
  if (!ip) return null; const g = new Date().toISOString().slice(0, 10);
  if (tuz.gun !== g) tuz = { gun: g, v: crypto.randomBytes(16) };
  return crypto.createHmac('sha256', tuz.v).update(String(ip)).digest('hex').slice(0, 12);
}

// ---------- Ortak olay şeması ----------
// { zaman, kanal, seviye, olay, mesaj, istek, kullanici, isletme, ip, sure, veri, hata }
const yazicilar = { uygulama: [], denetim: [], analitik: [] };
const kanal = (ad, fn) => { if (!yazicilar[ad]) throw new Error('Bilinmeyen günlük kanalı: ' + ad); yazicilar[ad].push(fn); };
function kayitOlustur(ad, seviye, olay, a = {}, o = {}) {
  const k = { zaman: new Date().toISOString(), kanal: ad, seviye: SEVIYE[seviye] ? seviye : 'bilgi', olay: String(olay).slice(0, 80) };
  if (a.mesaj !== undefined) k.mesaj = maskeMetin(a.mesaj, o).slice(0, 500);
  for (const f of ['istek', 'kullanici', 'isletme']) if (a[f]) k[f] = String(a[f]).slice(0, 40);
  if (a.ip) k.ip = a.ipHam ? String(a.ip).slice(0, 64) : ipOzet(a.ip); // ham IP yalnızca denetim kanalında (mevcut audit tablosu ve güvenlik ekranı onu gösterir)
  if (Number.isFinite(a.sure)) k.sure = Math.round(a.sure);
  if (a.veri !== undefined) k.veri = maskele(a.veri, o);
  if (a.hata !== undefined) k.hata = hataAlani(a.hata);
  return k;
}
const cikti = (k) => { const s = JSON.stringify(k); if (k.seviye === 'hata') console.error(s); else if (k.seviye === 'uyari') console.warn(s); else console.log(s); };
function yaz(ad, seviye, olay, a, o) {
  const k = kayitOlustur(ad, seviye, olay, a, o);
  const isler = yazicilar[ad].map((fn) => { try { return Promise.resolve(fn(k)).catch((e) => dustu(ad, k, e)); } catch (e) { return dustu(ad, k, e); } });
  if (ad === 'uygulama') cikti(k);
  return Promise.all(isler).then(() => k);
}
// Yazıcı düşerse kayıt kaybolmasın: maskelenmiş hali standart çıktıya yazılır
function dustu(ad, k, e) { if (e && e.code === 'NO_DB') return; try { cikti({ ...k, seviye: 'uyari', yazici: ad, yaziciHatasi: maskeMetin(e && e.message) }); } catch (x) { /* yok */ } }

const uygulama = { bilgi: (olay, a) => yaz('uygulama', 'bilgi', olay, a), uyari: (olay, a) => yaz('uygulama', 'uyari', olay, a), hata: (olay, a) => yaz('uygulama', 'hata', olay, a) };
// Denetim kaydı: audit tablosuyla uyumlu. E-posta açık kalır, IP ham kalır; diğer maskeler geçerlidir.
const denetim = (olay, a = {}) => yaz('denetim', 'bilgi', olay, { ...a, ipHam: true }, { eposta: false });
const analitik = (olay, veri) => yaz('analitik', 'bilgi', olay, { veri });

module.exports = { KANALLAR, SEVIYE, kanal, yaz, uygulama, denetim, analitik, maskele, maskeMetin, alanSinifi, ipOzet, hataAlani, kayitOlustur };
