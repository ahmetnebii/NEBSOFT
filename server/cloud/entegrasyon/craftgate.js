// Craftgate istemcisi: Bağlantıyı dene. Portal giriş ister, kaynak resmî SDK'dır.
// Kaynak (okundu 31.10.2026): github.com/craftgate/craftgate-node-client (README, src/lib/HttpClient.ts, src/lib/utils.ts, src/adapter/InstallmentAdapter.ts)
// x-signature = base64(SHA-256(url + apiKey + secretKey + rnd + gövde)). Zararsız deneme: GET /installment/v1/bins/{bin}. Ödeme yazılmadı: sandbox hesabıyla ayrı iş.
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Craftgate'; const base = (k) => (k.sandbox ? adres('craftgate-test', 'https://sandbox-api.craftgate.io') : adres('craftgate', 'https://api.craftgate.io'));
function baslik(k, url) { const rnd = crypto.randomBytes(3).toString('hex'); return { 'x-api-key': k.apiKey, 'x-rnd-key': rnd, 'x-auth-version': '1', 'x-signature': crypto.createHash('sha256').update(url + k.apiKey + k.secret + rnd).digest('base64'), 'Content-Type': 'application/json' }; }
async function dene(k) {
  const url = `${base(k)}/installment/v1/bins/535805`; const r = await istek(AD, url, { baslik: baslik(k, url) });
  if (r.durum === 401 || r.durum === 403) throw durumHata(AD, r); const j = jsonBekle(AD, r); const e = j.errors;
  if (e) { if (/auth|signature|api/i.test(String(e.errorDescription))) throw new SaglayiciHata('Craftgate anahtarları kabul etmedi', { kod: 'yetki' }); throw new SaglayiciHata(String(e.errorDescription || e.errorCode).slice(0, 160)); }
  if (!r.ok) throw durumHata(AD, r); return { mesaj: 'Craftgate anahtarları doğrulandı.', test: !!k.sandbox };
}
module.exports = { ad: AD, anahtarlar: ['payment:craftgate'], kaynak: ['https://github.com/craftgate/craftgate-node-client'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, secret: { ad: 'Gizli anahtar', zorunlu: true, gizli: true }, sandbox: { ad: 'Sandbox', tur: 'onay' } }, dene, islemler: {} };
