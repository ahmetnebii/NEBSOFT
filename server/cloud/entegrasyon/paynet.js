// Paynet istemcisi: ortak ödeme sayfası (PayLink) ve ödeme kontrolü.
// Kaynak (okundu 31.10.2026, GitBook, sürüm yok): doc.paynet.com.tr/baslarken-1, /authentication, /uornek/servisler/oran/oran-tablosu-sunucu-tabanli, /uornek/oedeme-methodlari/ortak-oedeme-sayfasi/oedeme-emri-olusturma/post-methodu, /uornek/servisler/islem/oedeme-kontrol
// Zararsız deneme: POST /v1/ratio/Get. Dokümandaki örnek Basic başlığa anahtarı doğrudan koyar, base64 yazmaz: örneğe uyulur, ilk gerçek hesapta bakılacak. Sabit IP gerekir.
// Bildirim imzasızdır, sonuç /v1/transaction/check ile sorgulanır. İade yalnız talep olduğu için yazılmadı. Canlı kilit PAYNET_CANLI.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const { kilit } = require('./odeme-kilit');
const AD = 'Paynet'; const base = (k) => (k.sandbox ? adres('paynet-test', 'https://pts-api.paynet.com.tr') : adres('paynet', 'https://api.paynet.com.tr'));
const baslik = (k) => ({ Authorization: `Basic ${k.secret}`, 'Content-Type': 'application/json', Accept: 'application/json' });
async function dene(k) {
  const r = await istek(AD, `${base(k)}/v1/ratio/Get`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ bin: '434678', amount: 100 }) });
  if (!r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (!Array.isArray(j.data)) throw new SaglayiciHata(String(j.message || 'Paynet yanıtı okunamadı').slice(0, 160), { kod: 'bozuk' });
  return { mesaj: 'Paynet anahtarı doğrulandı.', test: !!k.sandbox };
}
async function baslat(k, v) {
  kilit('PAYNET', AD, !!k.sandbox);
  const r = await istek(AD, `${base(k)}/v1/mailorder/create`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ name_surname: v.adSoyad, amount: v.tutar, email: v.eposta, phone: v.telefon, reference_no: v.referans, succeed_url: v.okUrl, error_url: v.hataUrl, confirmation_url: v.bildirimUrl }) });
  if (!r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (Number(j.code) !== 0 || !j.url) throw new SaglayiciHata(String(j.message || 'Paynet ödeme sayfası açılamadı').slice(0, 200)); return { url: String(j.url) };
}
async function sorgu(k, v) { const r = await istek(AD, `${base(k)}/v1/transaction/check`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ reference_no: v.referans }) }); if (!r.ok) throw durumHata(AD, r); return jsonBekle(AD, r); }
module.exports = { ad: AD, anahtarlar: ['payment:paynet'], kaynak: ['https://doc.paynet.com.tr/authentication'], deneme: 'zararsiz',
  alanlar: { secret: { ad: 'Secret key', zorunlu: true, gizli: true, desen: '^sck_', bicim: 'sck_ ile başlar' }, sandbox: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: { 'odeme-baslat': baslat, 'odeme-sorgu': sorgu } };
