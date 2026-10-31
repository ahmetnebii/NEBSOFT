// Stripe istemcisi. stripe.com/global listesinde Türkiye yoktur: Türkiye'de kurulu işletme doğrudan hesap açamaz, yurt dışı şirketi olan müşteri içindir. TRY desteği doğrulanamadı.
// Kaynak (okundu 31.10.2026, API sürümü 2026-10-28.endive): docs.stripe.com/api/authentication, /keys, /api/balance/balance_retrieve, /api/checkout/sessions/create, /api/refunds/create, /api/errors, stripe.com/global
// Zararsız deneme: GET /v1/balance. Test ve canlı aynı adrestir, ayrımı anahtar öneki ve yanıttaki livemode verir. Canlı kilit STRIPE_CANLI.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const { kilit } = require('./odeme-kilit');
const AD = 'Stripe'; const base = () => adres('stripe', 'https://api.stripe.com') + '/v1';
const yetki = (k) => ({ Authorization: `Bearer ${k.secret}`, 'Stripe-Version': '2026-10-28.endive', Accept: 'application/json' });
const hata = (r) => durumHata(AD, r, r.json && r.json.error && r.json.error.message);
const test = (k) => /^(sk|rk)_test_/.test(k.secret);
async function dene(k) {
  const r = await istek(AD, `${base()}/balance`, { baslik: yetki(k), tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (j.object !== 'balance') throw new SaglayiciHata('Stripe yanıtı okunamadı', { kod: 'bozuk' }); return { mesaj: `Stripe anahtarı doğrulandı (${j.livemode ? 'canlı' : 'test'}).`, test: !j.livemode };
}
async function baslat(k, v) {
  kilit('STRIPE', AD, test(k));
  const r = await istek(AD, `${base()}/checkout/sessions`, { yontem: 'POST', baslik: { ...yetki(k), 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ mode: 'payment', success_url: v.okUrl, cancel_url: v.hataUrl, client_reference_id: v.siparis, 'line_items[0][price]': v.priceId, 'line_items[0][quantity]': v.adet || 1 }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (!j.url) throw new SaglayiciHata('Stripe ödeme adresi dönmedi', { kod: 'bozuk' }); return { id: String(j.id), url: String(j.url), test: !j.livemode };
}
async function iade(k, v) {
  kilit('STRIPE', AD, test(k));
  const r = await istek(AD, `${base()}/refunds`, { yontem: 'POST', baslik: { ...yetki(k), 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ payment_intent: v.paymentIntent, amount: v.tutarKurus }) }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); return { ref: String(j.id), durum: j.status };
}
module.exports = { ad: AD, anahtarlar: ['payment:stripe'], kaynak: ['https://docs.stripe.com/api/balance/balance_retrieve'], deneme: 'zararsiz',
  alanlar: { secret: { ad: 'Gizli veya kısıtlı anahtar', zorunlu: true, gizli: true, desen: '^(sk|rk)_(test|live)_', bicim: 'sk_ veya rk_ ile başlar' } }, dene, islemler: { 'odeme-baslat': baslat, iade } };
