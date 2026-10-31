// Trendyol, Hepsiburada, n11: bağlayıcılar server/connectors altındadır, burada Bağlantıyı dene ve durum akışına bağlanır.
// Kaynaklar bağlayıcı dosyalarında ve docs/ENTEGRASYON-RAPORU.md §3'te (okundu 27.10.2026).
const kanal = require('../../connectors');
const { SaglayiciHata } = require('./ortak');
const FIELDS = { sellerId: { ad: 'Satıcı ID', zorunlu: true }, apiKey: { ad: 'API Key', zorunlu: true, gizli: true }, apiSecret: { ad: 'API Secret', zorunlu: true, gizli: true }, stage: { ad: 'Test ortamı', tur: 'onay' }, integrator: { ad: 'Entegratör adı', parmakDisi: true } };
function yap(kod, ad, alanlar) {
  const calistir = async (eylem, k, v) => { const r = await kanal.run(kod, eylem, k, v || {}); if (!r.ok) throw new SaglayiciHata(String(r.error || `${ad} isteği reddetti`), { kod: /Yetki|401|403/.test(String(r.error)) ? 'yetki' : /Zaman/.test(String(r.error)) ? 'zamanasimi' : 'saglayici' }); return r.data ?? r; };
  return { ad, anahtarlar: [`pazaryeri:${kod}`], kaynak: [], deneme: 'zararsiz', alanlar,
    dene: async (k) => { await calistir('baglanti-test', k); return { mesaj: `${ad} bilgileri doğrulandı.`, test: !!k.stage }; },
    islemler: Object.fromEntries((kanal.info().adapters[kod] || []).filter((e) => e !== 'baglanti-test').map((e) => [e, (k, v) => calistir(e, k, v)])) };
}
module.exports = [
  yap('trendyol', 'Trendyol', { ...FIELDS, sellerId: { ad: 'Satıcı ID', zorunlu: true, desen: '^\\d{3,12}$' } }),
  yap('hepsiburada', 'Hepsiburada', { ...FIELDS, sellerId: { ad: 'Merchant ID', zorunlu: true, desen: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', bicim: 'GUID' } }),
  yap('n11', 'n11', { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, apiSecret: { ad: 'API şifresi', zorunlu: true, gizli: true } }),
];
