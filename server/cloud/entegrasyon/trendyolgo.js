// Uber Eats Trendyol Go (Yemek) satıcı API istemcisi.
// Kaynak (okundu 31.10.2026, portal sürüm yazmıyor): developers.tgoapps.com/docs/canli-test-ortam-bilgileri, /docs/authorization, Yemek > mağaza, sipariş ve fiyat sayfaları
// Kimlik: Basic (API KEY + API SECRET KEY); User-Agent "{SatıcıId} - SelfIntegration" zorunlu, yoksa 403. Base64 yazımı dokümanda örneklenmemiş, Trendyol ile aynı Basic biçimi kullanılır.
// Zararsız deneme: mağaza listesi. Test ortamı IP yetkisi ister (503 = IP yok), satıcı 0850 210 7555 ile bildirir. Sipariş kabulünde x-agentname ve x-executor-user zorunlu.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic } = require('./ortak');
const AD = 'Trendyol Go'; const base = (k) => (k.stage ? adres('tgo-test', 'https://stageapi.tgoapis.com') : adres('tgo', 'https://api.tgoapis.com')) + '/integrator';
const baslik = (k, ek) => ({ Authorization: basic(k.apiKey, k.apiSecret), 'User-Agent': `${k.sellerId} - SelfIntegration`, Accept: 'application/json', 'Content-Type': 'application/json', ...ek });
const yapan = (k, v) => ({ 'x-agentname': 'SelfIntegration', 'x-executor-user': String(v.eposta || k.eposta || '') });
const bak = (k, r) => { if (r.durum === 503 && k.stage) throw new SaglayiciHata('Test ortamı bu sunucu adresine kapalı. Trendyol Go çağrı merkezinden IP yetkisi isteyin.', { kod: 'yetki', durum: 503 }); if (r.durum === 401) throw new SaglayiciHata('Trendyol Go API bilgileri kabul edilmedi. Canlı ve test bilgileri ayrıdır.', { kod: 'yetki', durum: 401 }); if (!r.ok) throw durumHata(AD, r, r.json && (r.json.message || r.json.errors)); return r; };
async function dene(k) {
  const j = jsonBekle(AD, bak(k, await istek(AD, `${base(k)}/store/meal/suppliers/${encodeURIComponent(k.sellerId)}/stores?page=0&size=50`, { baslik: baslik(k), tekrar: 1 })));
  if (!Array.isArray(j.restaurants)) throw new SaglayiciHata('Trendyol Go yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `Trendyol Go hesabı doğrulandı. Restoran sayısı: ${j.totalElements ?? j.restaurants.length}.`, test: !!k.stage };
}
async function siparisler(k, v) {
  const q = new URLSearchParams({ supplierId: k.sellerId, page: String(Number(v.page) || 0), size: String(Math.min(Number(v.size) || 50, 50)), ...(v.storeId ? { storeId: String(v.storeId) } : {}), ...(v.durum ? { packageStatuses: String(v.durum) } : {}) });
  return jsonBekle(AD, bak(k, await istek(AD, `${base(k)}/order/meal/suppliers/${encodeURIComponent(k.sellerId)}/packages?${q}`, { baslik: baslik(k, yapan(k, v)), tekrar: 1 })));
}
async function kabul(k, v) {
  if (!v.packageId) throw new SaglayiciHata('Paket numarası yok', { kod: 'bicim' }); if (!(v.eposta || k.eposta)) throw new SaglayiciHata('İşlemi yapanın e-postası gerekli', { kod: 'bicim' });
  bak(k, await istek(AD, `${base(k)}/order/meal/suppliers/${encodeURIComponent(k.sellerId)}/packages/picked`, { yontem: 'PUT', baslik: baslik(k, yapan(k, v)), govde: JSON.stringify({ packageId: String(v.packageId), preparationTime: Number(v.preparationTime) || 30 }) }));
  return { ref: String(v.packageId) };
}
async function fiyat(k, v) {
  const items = (v.items || []).map((x) => ({ ...(x.restaurantId ? { restaurantId: x.restaurantId } : {}), productId: x.productId, sellingPrice: Number(x.sellingPrice) })); if (!items.length || items.length > 1000) throw new SaglayiciHata('Bir istekte 1-1000 ürün gönderilir', { kod: 'bicim' });
  const j = jsonBekle(AD, bak(k, await istek(AD, `${base(k)}/product/meal/suppliers/${encodeURIComponent(k.sellerId)}/products/price`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ items }) })));
  return { ref: String(j.batchRequestId || '') };
}
module.exports = { ad: AD, anahtarlar: ['yemekplatform:trendyol'], kaynak: ['https://developers.tgoapps.com/docs/authorization'], deneme: 'zararsiz',
  alanlar: { sellerId: { ad: 'Satıcı ID', zorunlu: true, desen: '^\\d{1,12}$' }, apiKey: { ad: 'API Key', zorunlu: true, gizli: true }, apiSecret: { ad: 'API Secret Key', zorunlu: true, gizli: true }, eposta: { ad: 'İşlemi yapan e-posta', desen: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', parmakDisi: true }, stage: { ad: 'Test ortamı', tur: 'onay' } },
  dene, islemler: { 'siparis-cek': siparisler, kabul, fiyat } };
