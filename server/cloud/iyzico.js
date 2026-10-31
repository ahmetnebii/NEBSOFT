// iyzico Checkout Form istemcisi. Her işletme kendi anahtarıyla çalışır, para doğrudan işletmenin iyzico hesabına geçer.
// Kaynak (okundu 30.10.2026, sayfalarda sürüm tarihi yok):
//   Kimlik doğrulama  docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth.md
//   Checkout Form     docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-initialize.md, cf-retrieve.md
//   Yanıt imzası      docs.iyzico.com/en/advanced/response-signature-validation.md
//   İade ve iptal     docs.iyzico.com/en/advanced/refund-and-cancel.md
// Dokümanda açık yazmayan: paymentStatus başarı değeri (SUCCESS webhook listesinden alındı), identityNumber bilinmiyorsa ne gönderileceği. Test hesabıyla doğrulanacak.
const crypto = require('crypto');
const CANLI = 'https://api.iyzipay.com'; const TEST = 'https://sandbox-api.iyzipay.com';
const YOL = { baslat: '/payment/iyzipos/checkoutform/initialize/auth/ecom', sonuc: '/payment/iyzipos/checkoutform/auth/ecom/detail', iade: '/payment/refund', iptal: '/payment/cancel' };
// Test için sahte sunucu adresi: üretimde ortam değişkeni yok sayılır, anahtar başka adrese gidemez
const ozel = () => (process.env.NODE_ENV !== 'production' && process.env.IYZICO_API_BASE) || '';
const adres = (test) => ozel() || (test ? TEST : CANLI);
const SURE = () => Number(process.env.IYZICO_TIMEOUT_MS) || 15000;
class IyzicoHata extends Error {}

const hmac = (metin, gizli) => crypto.createHmac('sha256', gizli).update(metin, 'utf8').digest('hex');
// IYZWSv2: rastgele anahtar + yol + gövde imzalanır, apiKey ve imza base64 ile başlığa konur
function baslik(a, yol, govde, rnd = crypto.randomBytes(12).toString('hex')) {
  const imza = hmac(rnd + yol + govde, a.secret);
  return { Authorization: `IYZWSv2 ${Buffer.from(`apiKey:${a.apiKey}&randomKey:${rnd}&signature:${imza}`).toString('base64')}`, 'x-iyzi-rnd': rnd, 'Content-Type': 'application/json', Accept: 'application/json' };
}
const fiyat = (n) => Number(n).toFixed(2);
const kurus = (n) => Math.round(Number(n) * 100);
// İmzadan önce sondaki sıfırlar atılır: "50.00" → "50", "50.10" → "50.1"
const sifirsiz = (v) => { const s = String(v ?? ''); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; };
const yanitImzasi = (alanlar, gizli) => hmac(alanlar.join(':'), gizli);
const esit = (a, b) => { const x = Buffer.from(String(a || '')); const y = Buffer.from(String(b || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); };

async function cagir(a, yol, veri) {
  const govde = JSON.stringify(veri); const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), SURE());
  try {
    const r = await fetch(adres(a.test) + yol, { method: 'POST', headers: baslik(a, yol, govde), body: govde, signal: ctrl.signal });
    let j; try { j = await r.json(); } catch (e) { throw new IyzicoHata('iyzico yanıtı okunamadı'); }
    return j || {};
  } catch (e) { if (e instanceof IyzicoHata) throw e; throw new IyzicoHata(e.name === 'AbortError' ? 'iyzico zaman aşımına uğradı' : 'iyzico\'ya ulaşılamadı'); } finally { clearTimeout(t); }
}

async function formBaslat(a, veri) {
  const j = await cagir(a, YOL.baslat, veri);
  if (j.status !== 'success' || !j.token || !j.paymentPageUrl) throw new IyzicoHata(String(j.errorMessage || 'Ödeme sayfası açılamadı').slice(0, 200));
  if (!esit(j.signature, yanitImzasi([j.conversationId, j.token], a.secret))) throw new IyzicoHata('iyzico yanıtının imzası doğrulanamadı');
  if (!guvenliAdres(j.paymentPageUrl)) throw new IyzicoHata('iyzico ödeme adresi doğrulanamadı');
  return { token: String(j.token), url: String(j.paymentPageUrl) };
}
const guvenliAdres = (u) => { try { const x = new URL(u); return (x.protocol === 'https:' && /(^|\.)(iyzipay|iyzico)\.com$/.test(x.hostname)) || (!!ozel() && u.startsWith(ozel())); } catch (e) { return false; } };
const formSonuc = (a, token, konusma) => cagir(a, YOL.sonuc, { locale: 'tr', conversationId: konusma, token });

// Sonucun karşılaştırması. Tutar, sepet ve imza tutmadan sipariş ödenmiş sayılmaz. Taksit farkı paidPrice'ta olur, sipariş tutarı price ile karşılaştırılır.
function karar(o, r, gizli, token) {
  if (!r || r.status !== 'success') return { durum: 'bekliyor', neden: String((r && r.errorMessage) || '').slice(0, 200) };
  const imza = yanitImzasi([r.paymentStatus, r.paymentId, r.currency, r.basketId, r.conversationId, sifirsiz(r.paidPrice), sifirsiz(r.price), r.token], gizli);
  if (!esit(r.signature, imza)) return { durum: 'uyusmazlik', neden: 'iyzico yanıtının imzası doğrulanamadı' };
  if (r.token !== token || r.basketId !== o.id || r.conversationId !== o.id) return { durum: 'uyusmazlik', neden: 'Ödeme bu siparişe ait değil' };
  if (r.paymentStatus !== 'SUCCESS') return { durum: r.paymentStatus === 'FAILURE' ? 'basarisiz' : 'bekliyor', neden: String(r.errorMessage || '').slice(0, 200) };
  if (r.currency !== 'TRY' || kurus(r.price) !== kurus(o.total) || kurus(r.paidPrice) < kurus(o.total)) return { durum: 'uyusmazlik', neden: 'Ödenen tutar sipariş tutarıyla uyuşmuyor' };
  const f = Number(r.fraudStatus); const k = (r.itemTransactions || [])[0] || {};
  const bilgi = { paymentId: String(r.paymentId), txId: String(k.paymentTransactionId || ''), paid: Number(r.paidPrice), installment: Number(r.installment) || 1, last4: String(r.lastFourDigits || '').slice(-4), card: String(r.cardAssociation || '').slice(0, 30), fraud: f };
  if (f === 1) return { durum: 'odendi', bilgi }; if (f === 0) return { durum: 'inceleme', bilgi };
  return { durum: 'reddedildi', bilgi, neden: 'Ödeme iyzico dolandırıcılık incelemesinden geçmedi' };
}

// İade: sepet tek kalem gönderildiği için tek paymentTransactionId vardır, kısmi tutar buradan düşer
async function iade(a, p, konusma) {
  const j = await cagir(a, YOL.iade, { locale: 'tr', conversationId: konusma, paymentTransactionId: p.txId, price: fiyat(p.tutar), currency: 'TRY' });
  if (j.status !== 'success') throw new IyzicoHata(String(j.errorMessage || 'İade yapılamadı').slice(0, 200));
  if (!esit(j.signature, yanitImzasi([j.paymentId, sifirsiz(j.price), j.currency, j.conversationId], a.secret))) throw new IyzicoHata('iyzico iade yanıtının imzası doğrulanamadı');
  return { ref: String(j.hostReference || j.paymentTransactionId || '') };
}
// İptal: yalnız ödeme günü ve tutarın tamamı. Dokümanda bu yanıtın imzası yok
async function iptal(a, p, konusma) {
  const j = await cagir(a, YOL.iptal, { locale: 'tr', conversationId: konusma, paymentId: p.paymentId });
  if (j.status !== 'success') throw new IyzicoHata(String(j.errorMessage || 'İptal yapılamadı').slice(0, 200));
  return { ref: String(j.hostReference || j.paymentId || '') };
}
module.exports = { IyzicoHata, adres, baslik, fiyat, kurus, sifirsiz, yanitImzasi, karar, formBaslat, formSonuc, iade, iptal, guvenliAdres, hmac, YOL };
