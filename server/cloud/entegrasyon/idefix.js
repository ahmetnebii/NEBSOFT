// İdefix satıcı API istemcisi.
// Kaynak (okundu 31.10.2026, sayfalarda sürüm yok): developer.idefix.com/authorization, /canli-test-ortam-bilgileri, /api/siparis-entegrasyonu/siparislerin-alinmasi, /api/urun-entegrasyonu/stok-ve-fiyat-gonderim
// Kimlik: X-API-KEY = base64(ApiKey:ApiSecret). Zararsız deneme: canlıda sipariş listesi (1 kayıt), testte iade listesi. Canlı ve test bilgileri ayrıdır.
// Dokümanda hata gövdesi biçimi yok, yalnız 401 VENDOR_TOKEN_NOT_EXIST yazıyor. "vendor" sorgu alanı zorunlu denmiş, değeri yazmıyor: vendorId gönderilir, ilk gerçek hesapta bakılacak.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'İdefix';
const CANLI = () => adres('idefix', 'https://merchantapi.idefix.com'); const TEST_OMS = () => adres('idefix-test', 'https://ide-omsapi.idefiks.net');
const baslik = (k) => ({ 'X-API-KEY': Buffer.from(`${k.apiKey}:${k.apiSecret}`).toString('base64'), Accept: 'application/json', 'Content-Type': 'application/json' });
const bak = (r) => { if (!r.ok) throw durumHata(AD, r, r.metin.includes('VENDOR_TOKEN_NOT_EXIST') ? 'API anahtarı bulunamadı.' : ''); return jsonBekle(AD, r); };
async function dene(k) {
  const v = encodeURIComponent(k.sellerId);
  if (k.stage) { bak(await istek(AD, `${TEST_OMS()}/api/shipment/connect/${v}/claim-list`, { baslik: baslik(k), tekrar: 1 })); return { mesaj: 'İdefix test ortamı bilgileri doğrulandı.', test: true }; }
  const j = bak(await istek(AD, `${CANLI()}/oms/${v}/list?page=1&limit=1&vendor=${v}`, { baslik: baslik(k), tekrar: 1 }));
  if (!Array.isArray(j.items)) throw new SaglayiciHata('İdefix yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `İdefix mağazası doğrulandı. Sipariş kaydı: ${j.totalCount ?? j.items.length}.` };
}
const siparisler = async (k, v) => bak(await istek(AD, `${CANLI()}/oms/${encodeURIComponent(k.sellerId)}/list?page=${Number(v.page) || 1}&limit=${Math.min(Number(v.limit) || 50, 100)}&vendor=${encodeURIComponent(k.sellerId)}`, { baslik: baslik(k), tekrar: 1 }));
async function stokFiyat(k, v) {
  const items = (v.items || []).map((x) => ({ barcode: String(x.barcode), price: Number(x.price), comparePrice: Number(x.comparePrice) || 0, inventoryQuantity: Number(x.stock ?? x.inventoryQuantity) })); if (!items.length) throw new SaglayiciHata('Gönderilecek ürün yok', { kod: 'bicim' });
  const j = bak(await istek(AD, `${CANLI()}/pim/catalog/${encodeURIComponent(k.sellerId)}/inventory-upload`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ items }) }));
  return { ref: String(j.batchRequestId || ''), durum: j.status };
}
module.exports = { ad: AD, anahtarlar: ['pazaryeri:idefix'], kaynak: ['https://developer.idefix.com/authorization'], deneme: 'zararsiz',
  alanlar: { sellerId: { ad: 'Satıcı numarası (vendorId)', zorunlu: true, desen: '^[A-Za-z0-9-]{1,40}$' }, apiKey: { ad: 'API Key', zorunlu: true, gizli: true }, apiSecret: { ad: 'API Secret', zorunlu: true, gizli: true }, stage: { ad: 'Test ortamı', tur: 'onay' } },
  dene, islemler: { 'siparis-cek': siparisler, 'stok-fiyat': stokFiyat, 'stok-guncelle': stokFiyat } };
