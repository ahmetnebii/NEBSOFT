// DHL Express MyDHL API istemcisi: takip.
// Kaynak (okundu 31.10.2026): developer.dhl.com/api-reference/dhl-express-mydhl-api, OpenAPI dpdhl-express-api-3.4.0_9.yaml (sürüm 3.4.0, 25.10.2026)
// Kimlik: Basic, bilgileri DHL Express danışmanı verir. Test ortamında günlük 500 çağrı. Zararsız deneme: GET /tracking; testte dokümandaki yüklü numara kullanılır.
// Canlıda bilinmeyen numara için 404 beklenir: 401/403 değilse kimlik geçti sayılır (ilk gerçek hesapta bakılacak). Gönderi oluşturma yazılmadı, gönderi iptal ucu API'de yok.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic } = require('./ortak');
const AD = 'DHL Express'; const base = (k) => (k.test ? adres('dhl-test', 'https://express.api.dhl.com/mydhlapi/test') : adres('dhl', 'https://express.api.dhl.com/mydhlapi'));
const TEST_NO = '9356579890';
const yetki = (k) => ({ Authorization: basic(k.user, k.pass), Accept: 'application/json' });
async function dene(k) {
  const r = await istek(AD, `${base(k)}/tracking?shipmentTrackingNumber=${k.test ? TEST_NO : '0000000000'}`, { baslik: yetki(k), tekrar: 1 });
  if (r.durum === 401 || r.durum === 403) throw durumHata(AD, r); if (!r.ok && r.durum !== 404) throw durumHata(AD, r); if (r.ok) jsonBekle(AD, r);
  return { mesaj: 'DHL Express bilgileri doğrulandı.', test: !!k.test };
}
async function takip(k, v) {
  const no = String(v.tracking || ''); if (!/^[A-Za-z0-9]{8,39}$/.test(no)) throw new SaglayiciHata('Takip numarası geçersiz', { kod: 'bicim' });
  const r = await istek(AD, `${base(k)}/tracking?shipmentTrackingNumber=${no}`, { baslik: yetki(k), tekrar: 1 }); if (!r.ok) throw durumHata(AD, r); return jsonBekle(AD, r);
}
module.exports = { ad: AD, anahtarlar: ['kargofirma:dhl'], kaynak: ['https://developer.dhl.com/api-reference/dhl-express-mydhl-api'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'API kullanıcı adı', zorunlu: true }, pass: { ad: 'API şifresi', zorunlu: true, gizli: true, kirp: false }, test: { ad: 'Test ortamı', tur: 'onay' } },
  dene, islemler: { 'durum-sorgu': takip } };
