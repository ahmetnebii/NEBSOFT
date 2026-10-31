// iyzico Bağlantıyı dene: ödeme işlemleri ../iyzico.js ve ../eticaret-odeme.js içindedir, canlı kilidi IYZICO_CANLI orada kalır.
// Kaynak (okundu 30.10.2026): docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth; BIN sorgusu ENTEGRASYON-RAPORU §3 (sahte anahtarla 1001 alındı, 27.10.2026).
// Zararsız deneme: POST /payment/bin/check (para çekmez).
const iyz = require('../iyzico');
const { SaglayiciHata, istek, jsonBekle, durumHata, ozel } = require('./ortak');
const AD = 'iyzico'; const YOL = '/payment/bin/check';
async function dene(k) {
  const a = { apiKey: k.apiKey, secret: k.secret, test: !!k.sandbox }; const govde = JSON.stringify({ locale: 'tr', conversationId: 'nebsoft-deneme', binNumber: '535805' });
  const r = await istek(AD, (ozel() && !process.env.IYZICO_API_BASE ? `${ozel()}/iyzico` : iyz.adres(a.test)) + YOL, { yontem: 'POST', baslik: iyz.baslik(a, YOL, govde), govde });
  if (!r.json && !r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r);
  if (j.status !== 'success') throw new SaglayiciHata(String(j.errorCode) === '1001' ? 'iyzico API anahtarlarını kabul etmedi. Test ve canlı anahtarları ayrıdır.' : String(j.errorMessage || 'iyzico isteği reddetti').slice(0, 200), { kod: String(j.errorCode) === '1001' ? 'yetki' : 'saglayici' });
  return { mesaj: `iyzico anahtarları doğrulandı (${a.test ? 'sandbox' : 'canlı'}).${!a.test && process.env.IYZICO_CANLI !== '1' ? ' Canlı ödeme bu sunucuda kapalı.' : ''}`, test: a.test };
}
module.exports = { ad: AD, anahtarlar: ['payment:iyzico'], kaynak: ['https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, secret: { ad: 'Güvenlik anahtarı', zorunlu: true, gizli: true }, sandbox: { ad: 'Sandbox', tur: 'onay' } }, dene, islemler: {} };
