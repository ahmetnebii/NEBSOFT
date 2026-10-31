// Papara Merchant API istemcisi.
// Kaynak (okundu 31.10.2026, dokümanda sürüm yok): merchant-api.papara.com Page/Authentication, Page/LiveTestEnv, Page/Account, Page/AcceptPayments, Page/ErrorCodes
// Zararsız deneme: GET /account. Yönlendirme parametrelerine güvenilmez, sonuç GET /payments?id= ile sorgulanır. Bildirim imzasının formülü dokümanda çelişkili, kullanılmaz. Canlı kilit PAPARA_CANLI.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const { kilit } = require('./odeme-kilit');
const AD = 'Papara'; const base = (k) => (k.sandbox ? adres('papara-test', 'https://merchant-api.test.papara.com') : adres('papara', 'https://merchant-api.papara.com'));
const yetki = (k) => ({ ApiKey: k.apiKey, Accept: 'application/json', 'Content-Type': 'application/json' });
function bak(r) { if (r.durum === 401 || r.durum === 403) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (j.succeeded !== true) throw new SaglayiciHata(j.error && j.error.code === 104 ? 'Bu sunucunun IP adresi Papara hesabında izinli değil' : String((j.error && j.error.message) || 'Papara isteği reddetti').slice(0, 200), { durum: r.durum }); return j.data; }
async function dene(k) { const d = bak(await istek(AD, `${base(k)}/account`, { baslik: yetki(k), tekrar: 1 })); return { mesaj: `Papara hesabı doğrulandı: ${d.brandName || d.legalName || ''}.`, test: !!k.sandbox }; }
async function baslat(k, v) {
  kilit('PAPARA', AD, !!k.sandbox);
  const d = bak(await istek(AD, `${base(k)}/payments`, { yontem: 'POST', baslik: yetki(k), govde: JSON.stringify({ amount: Number(v.tutar), referenceId: String(v.siparis), orderDescription: String(v.aciklama || v.siparis), notificationUrl: v.bildirimUrl, redirectUrl: v.okUrl, currency: 0 }) }));
  if (!d.paymentUrl) throw new SaglayiciHata('Papara ödeme adresi dönmedi', { kod: 'bozuk' }); return { id: String(d.id), url: String(d.paymentUrl), test: !!k.sandbox };
}
const sorgu = async (k, v) => bak(await istek(AD, `${base(k)}/payments?id=${encodeURIComponent(String(v.id))}`, { baslik: yetki(k), tekrar: 1 }));
async function iade(k, v) { kilit('PAPARA', AD, !!k.sandbox); bak(await istek(AD, `${base(k)}/payments/refund`, { yontem: 'POST', baslik: yetki(k), govde: JSON.stringify({ paymentId: String(v.id), refundAmount: Number(v.tutar).toFixed(2) }) })); return { ref: String(v.id) }; }
module.exports = { ad: AD, anahtarlar: ['payment:papara'], kaynak: ['https://merchant-api.papara.com'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, sandbox: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: { 'odeme-baslat': baslat, 'odeme-sorgu': sorgu, iade } };
