// Giden webhook: NEBSOFT olayını müşterinin adresine imzalı gönderir. Sağlayıcı dokümanı yoktur, biçim NEBSOFT'undur.
// Adres müşteri verisidir: bulutta sec.publicUrl + sec.safeFetch ile çıkar, iç ağa gidemez, yönlendirme izlenmez. İmza X-Nebsoft-Signature: gövdenin HMAC-SHA256'sı (hex).
// Bağlantıyı dene gerçek bir "test" olayı gönderir. Başarı yalnız müşteri sunucusu 2xx dönerse yazılır.
const crypto = require('crypto');
const sec = require('../security');
const { SaglayiciHata, ozel, istek } = require('./ortak');
const AD = 'Webhook adresi';
async function gonderim(k, olay, veri) {
  const govde = JSON.stringify({ event: olay, data: veri, at: new Date().toISOString() }); const baslik = { 'Content-Type': 'application/json', ...(k.secret ? { 'X-Nebsoft-Signature': crypto.createHmac('sha256', k.secret).update(govde).digest('hex') } : {}) };
  if (ozel()) return istek(AD, k.url, { yontem: 'POST', baslik, govde });
  if (!(await sec.publicUrl(k.url))) throw new SaglayiciHata('Adres internette erişilebilir olmalı', { kod: 'bicim' });
  try { const r = await sec.safeFetch(k.url, { method: 'POST', headers: baslik, body: govde }); return { ok: r.ok, durum: r.status }; } catch (e) { throw new SaglayiciHata('Webhook adresine ulaşılamadı', { kod: 'ag' }); }
}
async function dene(k) { const r = await gonderim(k, 'test', { mesaj: 'NEBSOFT bağlantı denemesi' }); if (!r.ok) throw new SaglayiciHata(`Webhook adresi ${r.durum} döndürdü`, { durum: r.durum }); return { mesaj: `Webhook adresi yanıt verdi (${r.durum}).` }; }
async function gonder(k, v) { const r = await gonderim(k, String(v.event || 'olay'), v.data); if (!r.ok) throw new SaglayiciHata(`Webhook adresi ${r.durum} döndürdü`, { durum: r.durum }); return { durum: r.durum }; }
module.exports = { ad: AD, anahtarlar: ['webhook:http'], kaynak: [], deneme: 'zararsiz',
  alanlar: { url: { ad: 'Hedef adres', zorunlu: true, desen: '^https?://', bicim: 'https:// ile başlar', enCok: 500 }, secret: { ad: 'İmza anahtarı', gizli: true } }, dene, islemler: { gonder } };
