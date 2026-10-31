// HotelRunner kanal yöneticisi istemcisi (REST v2).
// Kaynak (okundu 31.10.2026, örnekler 2026-02 tarihli): https://developers.hotelrunner.com  (rooms, reservations, update room, transaction details)
// Kimlik: sorgu parametreleri token ve hr_id. Sınır: mülk başına 250 istek/gün, 5 istek/dk. Zararsız deneme: oda listesi.
// Rezervasyon okuma undelivered=false ile yapılır: teslim onayı sayfası okunmadı, varsayılan akış teslim kaydı değiştirebilir. Test için ayrı adres yazmıyor, sandbox mülk aynı adresi kullanır.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const AD = 'HotelRunner'; const base = () => adres('hotelrunner', 'https://app.hotelrunner.com') + '/api/v2/apps';
const kim = (k) => ({ token: k.token, hr_id: k.hrId });
const bak = (r) => { if (!r.ok) throw durumHata(AD, r); return jsonBekle(AD, r); };
async function dene(k) {
  const j = bak(await istek(AD, `${base()}/rooms?${form(kim(k))}`, { tekrar: 1 }));
  if (!Array.isArray(j.rooms)) throw new SaglayiciHata('HotelRunner yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `HotelRunner mülkü doğrulandı. Oda tipi: ${j.rooms.length}.` };
}
const rezervasyonlar = async (k, v) => bak(await istek(AD, `${base()}/reservations?${form({ ...kim(k), undelivered: false, from_date: v.from_date, per_page: Math.min(Number(v.per_page) || 50, 100), page: Number(v.page) || 1 })}`, { tekrar: 1 }));
async function musaitlik(k, v) {
  if (!(v.inv_code || v.rate_code) || !v.start_date || !v.end_date) throw new SaglayiciHata('Oda kodu ve tarih aralığı gerekli', { kod: 'bicim' });
  const j = bak(await istek(AD, `${base()}/rooms/~?${form({ ...kim(k), inv_code: v.inv_code, rate_code: v.rate_code, start_date: v.start_date, end_date: v.end_date, availability: v.availability, price: v.price, stop_sale: v.stop_sale })}`, { yontem: 'PUT', govde: '' }));
  if (j.status !== 'ok') throw new SaglayiciHata(j.status === 'try_again' ? 'HotelRunner yeniden denemenizi istedi' : 'HotelRunner güncellemeyi kabul etmedi');
  return { ref: String(j.transaction_id || '') };
}
module.exports = { ad: AD, anahtarlar: ['kanal:hotelrunner'], kaynak: ['https://developers.hotelrunner.com'], deneme: 'zararsiz',
  alanlar: { hrId: { ad: 'HR ID', zorunlu: true, desen: '^[A-Za-z0-9_-]{1,40}$' }, token: { ad: 'Token', zorunlu: true, gizli: true } },
  dene, islemler: { 'rezervasyon-cek': rezervasyonlar, 'musaitlik-fiyat': musaitlik } };
