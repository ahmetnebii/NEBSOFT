// Geliver kargo istemcisi (tek hesapla birden çok kargo firması, kendi anlaşmanız bağlanabilir).
// Kaynak (okundu 31.10.2026, API /api/v1, dokümanda sürüm politikası ve OpenAPI yok): https://docs.geliver.io/llms-full.txt, /docs/error_codes
// Zararsız deneme: GET /addresses. Test gönderisi shipment.test=true ile verilir, ayrı adres yoktur. Hız sınırı dokümanda yazmıyor.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Geliver'; const base = () => adres('geliver', 'https://api.geliver.io') + '/api/v1';
const baslik = (k) => ({ Authorization: `Bearer ${k.token}`, 'Content-Type': 'application/json', Accept: 'application/json' });
const HATA = { E1055: 'Geliver token bu işleme yetkili değil', E1051: 'Gönderi bulunamadı', E1064: 'Teklif bulunamadı', E1066: 'Geliver bakiyesi yetersiz', E1068: 'Gönderen adresi tanımlı değil', E1072: 'Etiket oluşturulamadı' };
function bak(r) { if (r.durum === 401) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (j.result === true) return j; if (!r.ok && j.result === undefined) throw durumHata(AD, r); throw new SaglayiciHata(HATA[j.code] || String(j.additionalMessage || j.code || 'Geliver isteği reddetti').slice(0, 200), { kod: j.code === 'E1055' ? 'yetki' : 'saglayici', durum: r.durum }); }
async function dene(k) { bak(await istek(AD, `${base()}/addresses?limit=1`, { baslik: baslik(k), tekrar: 1 })); return { mesaj: 'Geliver hesabı doğrulandı.', test: !!k.test }; }
async function olustur(k, v) {
  if (!k.senderAddressID || !k.providerServiceCode) throw new SaglayiciHata('Gönderen adresi ve kargo servis kodu gerekli', { kod: 'bicim' });
  const a = v.receiver || {}; const j = bak(await istek(AD, `${base()}/transactions`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ ...(k.providerAccountID ? { providerAccountID: k.providerAccountID } : {}), providerServiceCode: k.providerServiceCode, shipment: { test: !!k.test, senderAddressID: k.senderAddressID, returnAddressID: k.senderAddressID, recipientAddress: { name: String(a.name || ''), phone: String(a.phone || ''), address1: String(a.address || ''), countryCode: 'TR', cityCode: String(a.cityCode || ''), districtName: String(a.district || '') }, length: String(v.length || 10), height: String(v.height || 10), width: String(v.width || 10), distanceUnit: 'cm', weight: String(v.weight || 1), massUnit: 'kg', items: [{ title: String(v.ref || 'Gönderi'), quantity: Number(v.pieces) || 1 }], productPaymentOnDelivery: false } }) }));
  const d = j.data || {}; const s = d.shipment || d; return { id: s.id, tracking: s.trackingNumber, barcode: s.barcode, label: s.labelURL, url: s.trackingUrl, test: !!k.test };
}
const takip = async (k, v) => { const j = bak(await istek(AD, `${base()}/shipments/${encodeURIComponent(String(v.id || v.tracking || ''))}`, { baslik: baslik(k), tekrar: 1 })); const d = j.data || {}; return { tracking: d.trackingNumber, url: d.trackingUrl, durum: d.trackingStatus }; };
const iptal = async (k, v) => { bak(await istek(AD, `${base()}/shipments/${encodeURIComponent(String(v.id || ''))}`, { yontem: 'DELETE', baslik: baslik(k) })); return { ref: String(v.id) }; };
module.exports = { ad: AD, anahtarlar: ['kargofirma:geliver'], kaynak: ['https://docs.geliver.io/llms-full.txt'], deneme: 'zararsiz',
  alanlar: { token: { ad: 'API token', zorunlu: true, gizli: true }, senderAddressID: { ad: 'Gönderen adres kimliği', parmakDisi: true }, providerServiceCode: { ad: 'Kargo servis kodu', parmakDisi: true, desen: '^[A-Z0-9_]{3,40}$' }, providerAccountID: { ad: 'Kargo anlaşması kimliği', parmakDisi: true }, test: { ad: 'Test gönderisi', tur: 'onay' } },
  dene, islemler: { 'gonderi-olustur': olustur, 'durum-sorgu': takip, iptal } };
