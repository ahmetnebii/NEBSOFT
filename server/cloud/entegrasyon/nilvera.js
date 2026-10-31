// Nilvera Bağlantıyı dene. Fatura gönderimi NS.ebelge üzerinden core/integrations.js'teki nvCall ile yapılır (/api/istek, anahtar sunucuda çözülür).
// Kaynak (okundu 31.10.2026, API v1): developer.nilvera.com (genel-bakis, api-anahtari-uretimi, hata-kodlari, OpenAPI 3.0.1)
// Zararsız deneme: GET /general/Company. Test ve canlı anahtarları ayrıdır.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Nilvera'; const base = (k) => (k.test ? adres('nilvera-test', 'https://apitest.nilvera.com') : adres('nilvera', 'https://api.nilvera.com'));
async function dene(k) {
  const r = await istek(AD, `${base(k)}/general/Company`, { baslik: { Authorization: `Bearer ${k.pass}`, Accept: 'application/json' }, tekrar: 1 }); if (!r.ok) throw durumHata(AD, r, r.json && r.json.Message);
  const j = jsonBekle(AD, r); if (!j.TaxNumber) throw new SaglayiciHata('Nilvera yanıtı okunamadı', { kod: 'bozuk' });
  if (k.vkn && j.TaxNumber !== k.vkn) throw new SaglayiciHata(`Bu anahtar ${j.TaxNumber} vergi numaralı firmaya ait`, { kod: 'bicim' });
  return { mesaj: `Nilvera firması doğrulandı: ${j.Name || j.TaxNumber}.`, test: !!k.test };
}
module.exports = { ad: AD, anahtarlar: ['efatura:nilvera'], kaynak: ['https://developer.nilvera.com/'], deneme: 'zararsiz',
  alanlar: { pass: { ad: 'API anahtarı', zorunlu: true, gizli: true }, vkn: { ad: 'Firma VKN', desen: '^\\d{10,11}$' }, test: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: {} };
