// Paynet istemcisi: Bağlantıyı dene.
// Kaynak (okundu 31.10.2026, GitBook, sürüm yok): doc.paynet.com.tr/baslarken-1, /authentication, /uornek/servisler/oran/oran-tablosu-sunucu-tabanli
// Zararsız deneme: POST /v1/ratio/Get. Dokümandaki örnek Basic başlığa anahtarı doğrudan koyar, base64 yazmaz: örneğe uyulur, ilk gerçek hesapta bakılacak. Sabit IP gerekir.
// Ödeme yazılmadı: bildirim imzasız, iade yalnız talep; ayrı iş.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Paynet'; const base = (k) => (k.sandbox ? adres('paynet-test', 'https://pts-api.paynet.com.tr') : adres('paynet', 'https://api.paynet.com.tr'));
async function dene(k) {
  const r = await istek(AD, `${base(k)}/v1/ratio/Get`, { yontem: 'POST', baslik: { Authorization: `Basic ${k.secret}`, 'Content-Type': 'application/json', Accept: 'application/json' }, govde: JSON.stringify({ bin: '434678', amount: 100 }) });
  if (!r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r); if (!Array.isArray(j.data)) throw new SaglayiciHata(String(j.message || 'Paynet yanıtı okunamadı').slice(0, 160), { kod: 'bozuk' });
  return { mesaj: 'Paynet anahtarı doğrulandı.', test: !!k.sandbox };
}
module.exports = { ad: AD, anahtarlar: ['payment:paynet'], kaynak: ['https://doc.paynet.com.tr/authentication'], deneme: 'zararsiz',
  alanlar: { secret: { ad: 'Secret key', zorunlu: true, gizli: true, desen: '^sck_', bicim: 'sck_ ile başlar' }, sandbox: { ad: 'Test ortamı', tur: 'onay' } }, dene, islemler: {} };
