// Craftgate istemcisi: Checkout Form, sonuç sorgusu, tam iade. Portal giriş ister, kaynak resmî SDK'dır.
// Kaynak (okundu 31.10.2026): github.com/craftgate/craftgate-node-client (README, src/lib/HttpClient.ts, src/lib/utils.ts, src/adapter/InstallmentAdapter.ts, PaymentAdapter.ts, request/InitCheckoutPaymentRequest.ts)
// x-signature = base64(SHA-256(url + apiKey + secretKey + rnd + gövde)). Zararsız deneme: GET /installment/v1/bins/{bin}. Canlı kilit CRAFTGATE_CANLI.
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const { kilit } = require('./odeme-kilit');
const AD = 'Craftgate'; const base = (k) => (k.sandbox ? adres('craftgate-test', 'https://sandbox-api.craftgate.io') : adres('craftgate', 'https://api.craftgate.io'));
function baslik(k, url, govde = '') { const rnd = crypto.randomBytes(3).toString('hex'); return { 'x-api-key': k.apiKey, 'x-rnd-key': rnd, 'x-auth-version': '1', 'x-signature': crypto.createHash('sha256').update(url + k.apiKey + k.secret + rnd + govde).digest('base64'), 'Content-Type': 'application/json' }; }
function veri(r) { if (r.durum === 401 || r.durum === 403) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (j.errors) throw new SaglayiciHata(String(j.errors.errorDescription || j.errors.errorCode).slice(0, 200)); if (!r.ok) throw durumHata(AD, r); return j.data || {}; }
async function dene(k) {
  const url = `${base(k)}/installment/v1/bins/535805`; const r = await istek(AD, url, { baslik: baslik(k, url) });
  if (r.durum === 401 || r.durum === 403) throw durumHata(AD, r); const j = jsonBekle(AD, r); const e = j.errors;
  if (e) { if (/auth|signature|api/i.test(String(e.errorDescription))) throw new SaglayiciHata('Craftgate anahtarları kabul etmedi', { kod: 'yetki' }); throw new SaglayiciHata(String(e.errorDescription || e.errorCode).slice(0, 160)); }
  if (!r.ok) throw durumHata(AD, r); return { mesaj: 'Craftgate anahtarları doğrulandı.', test: !!k.sandbox };
}
async function baslat(k, v) {
  kilit('CRAFTGATE', AD, !!k.sandbox); const url = `${base(k)}/payment/v1/checkout-payments/init`; const govde = JSON.stringify({ price: Number(v.tutar), paidPrice: Number(v.tutar), currency: 'TRY', paymentGroup: 'PRODUCT', conversationId: String(v.siparis), callbackUrl: v.donus });
  const d = veri(await istek(AD, url, { yontem: 'POST', baslik: baslik(k, url, govde), govde })); if (!d.pageUrl) throw new SaglayiciHata('Craftgate ödeme adresi dönmedi', { kod: 'bozuk' }); return { token: String(d.token), url: String(d.pageUrl) };
}
const sorgu = async (k, v) => { const url = `${base(k)}/payment/v1/checkout-payments/${encodeURIComponent(String(v.token))}`; return veri(await istek(AD, url, { baslik: baslik(k, url), tekrar: 1 })); };
async function iade(k, v) { kilit('CRAFTGATE', AD, !!k.sandbox); const url = `${base(k)}/payment/v1/refunds`; const govde = JSON.stringify({ paymentId: Number(v.id) }); const d = veri(await istek(AD, url, { yontem: 'POST', baslik: baslik(k, url, govde), govde })); return { ref: String(d.id || v.id) }; }
module.exports = { ad: AD, anahtarlar: ['payment:craftgate'], kaynak: ['https://github.com/craftgate/craftgate-node-client'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, secret: { ad: 'Gizli anahtar', zorunlu: true, gizli: true }, sandbox: { ad: 'Sandbox', tur: 'onay' } }, dene, islemler: { 'odeme-baslat': baslat, 'odeme-sorgu': sorgu, iade } };
