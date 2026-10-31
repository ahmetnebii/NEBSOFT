// Sipay istemcisi: Bağlantıyı dene.
// Kaynak (okundu 31.10.2026, OpenAPI version 1.0.0): apidocs.sipay.com.tr/getting-started-1699520m0.md, /token-generation-23283730e0.md, /status-codes-2006876m0.md, /ip-restriction-2365343m0.md
// Zararsız deneme: POST /ccpayment/api/token. Sunucu IP'si Sipay satış ekibine bildirilir, izinsiz IP reddedilir. Ödeme yazılmadı: ödeme hash alanları dokümanda yok.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Sipay'; const base = (k) => (k.sandbox ? adres('sipay-test', 'https://provisioning.sipay.com.tr') : adres('sipay', 'https://app.sipay.com.tr'));
async function dene(k) {
  const r = await istek(AD, `${base(k)}/ccpayment/api/token`, { yontem: 'POST', baslik: { 'Content-Type': 'application/json', Accept: 'application/json' }, govde: JSON.stringify({ app_id: k.apiKey, app_secret: k.secret, app_lang: 'tr' }) });
  if (!r.json && !r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r);
  if (j.status_code === 100 && j.data && j.data.token) return { mesaj: 'Sipay uygulama bilgileri doğrulandı.', test: !!k.sandbox };
  throw new SaglayiciHata(j.status_code === 30 ? 'Sipay bilgileri kabul etmedi' : String(j.status_description || 'Sipay yanıtı okunamadı').slice(0, 160), { kod: j.status_code === 30 ? 'yetki' : 'saglayici' });
}
module.exports = { ad: AD, anahtarlar: ['payment:sipay'], kaynak: ['https://apidocs.sipay.com.tr/getting-started-1699520m0.md'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'App ID', zorunlu: true, gizli: true }, secret: { ad: 'App Secret', zorunlu: true, gizli: true }, sandbox: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: {} };
