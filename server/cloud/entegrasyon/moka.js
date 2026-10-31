// Moka United istemcisi: Bağlantıyı dene.
// Kaynak (okundu 31.10.2026, portalda sürüm yok): developer.mokaunited.com (home.php?page=bin-sorgu, 3dli-odeme, ortak-odeme, hata-kodlari)
// CheckKey = SHA-256(DealerCode + "MK" + Username + "PD" + Password), hex. Zararsız deneme: GetBankCardInformation (BIN sorgusu).
// Ödeme yazılmadı: 3D dönüş imzasının algoritması ve testte ortak ödeme adresi dokümanda açık değil.
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Moka United'; const base = (k) => (k.sandbox ? adres('moka-test', 'https://service.refmokaunited.com') : adres('moka', 'https://service.mokaunited.com'));
const kim = (k) => ({ DealerCode: k.dealerCode, Username: k.user, Password: k.pass, CheckKey: crypto.createHash('sha256').update(`${k.dealerCode}MK${k.user}PD${k.pass}`).digest('hex') });
async function dene(k) {
  const r = await istek(AD, `${base(k)}/PaymentDealer/GetBankCardInformation`, { yontem: 'POST', baslik: { 'Content-Type': 'application/json', Accept: 'application/json' }, govde: JSON.stringify({ PaymentDealerAuthentication: kim(k), BankCardInformationRequest: { BinNumber: '526911' } }) });
  if (!r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r);
  if (j.ResultCode === 'Success') return { mesaj: 'Moka United bilgileri doğrulandı.', test: !!k.sandbox };
  if (/IpAddressNotAllowed/.test(String(j.ResultCode))) throw new SaglayiciHata('Bu sunucunun IP adresi Moka hesabında izinli değil', { kod: 'yetki' });
  if (/CheckPaymentDealerAuthentication/.test(String(j.ResultCode))) throw new SaglayiciHata('Moka bayi bilgilerini kabul etmedi', { kod: 'yetki' });
  throw new SaglayiciHata(`Moka yanıtı: ${String(j.ResultMessage || j.ResultCode || '').slice(0, 160)}`);
}
module.exports = { ad: AD, anahtarlar: ['payment:moka'], kaynak: ['https://developer.mokaunited.com'], deneme: 'zararsiz',
  alanlar: { dealerCode: { ad: 'Bayi kodu', zorunlu: true }, user: { ad: 'API kullanıcı adı', zorunlu: true }, pass: { ad: 'API şifresi', zorunlu: true, gizli: true, kirp: false }, sandbox: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: {} };
