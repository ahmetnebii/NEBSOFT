// Amazon Selling Partner API istemcisi (Türkiye, Avrupa uç noktası).
// Kaynak (okundu 31.10.2026, sayfalar "Updated about 2 months ago"): https://developer-docs.amazon/sp-api/docs/connecting-to-the-selling-partner-api, /docs/sp-api-endpoints, /docs/marketplace-ids, /docs/sp-api-sandbox, /reference/getmarketplaceparticipations, /reference/searchorders
// Kimlik: LWA refresh token ile access token, istekte x-amz-access-token. Zararsız deneme: GET /sellers/v1/marketplaceParticipations.
// Yanıt alan adları sayfada okunmadığı için pazaryeri kimliği metinde aranır. Alıcı bilgisi için Restricted Data Token gerekir, bu sürümde istenmez.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const AD = 'Amazon'; const TR = 'A33AVAJ2PDY3EV'; const UA = 'NEBSOFT/2.0 (Language=Node.js)';
const lwa = () => adres('amazon-lwa', 'https://api.amazon.com');
const base = (k) => (k.sandbox ? adres('amazon-test', 'https://sandbox.sellingpartnerapi-eu.amazon.com') : adres('amazon', 'https://sellingpartnerapi-eu.amazon.com'));
async function jeton(k) {
  const r = await istek(AD, `${lwa()}/auth/o2/token`, { yontem: 'POST', baslik: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, govde: form({ grant_type: 'refresh_token', refresh_token: k.refreshToken, client_id: k.clientId, client_secret: k.clientSecret }) });
  if (!r.ok) throw durumHata(AD, r.durum === 400 ? { ...r, durum: 401 } : r); const j = jsonBekle(AD, r); if (!j.access_token) throw new SaglayiciHata('Amazon erişim jetonu vermedi', { kod: 'bozuk' }); return j.access_token;
}
const baslik = (t) => ({ 'x-amz-access-token': t, 'User-Agent': UA, Accept: 'application/json' });
async function dene(k) {
  const t = await jeton(k); const r = await istek(AD, `${base(k)}/sellers/v1/marketplaceParticipations`, { baslik: baslik(t) });
  if (!r.ok) throw durumHata(AD, r); jsonBekle(AD, r);
  if (!r.metin.includes(TR) && !k.sandbox) throw new SaglayiciHata('Bu satıcı hesabı Amazon Türkiye pazaryerinde görünmüyor', { kod: 'saglayici' });
  return { mesaj: 'Amazon satıcı hesabı doğrulandı.', test: !!k.sandbox };
}
async function siparisler(k, v) {
  const t = await jeton(k); const q = new URLSearchParams({ marketplaceIds: TR, createdAfter: String(v.createdAfter || new Date(Date.now() - 7 * 864e5).toISOString()) });
  const r = await istek(AD, `${base(k)}/orders/2026-01-01/orders?${q}`, { baslik: baslik(t) }); if (!r.ok) throw durumHata(AD, r); return jsonBekle(AD, r);
}
module.exports = { ad: AD, anahtarlar: ['pazaryeri:amazon'], kaynak: ['https://developer-docs.amazon/sp-api/docs/connecting-to-the-selling-partner-api'], deneme: 'zararsiz',
  alanlar: { clientId: { ad: 'LWA Client ID', zorunlu: true, gizli: true }, clientSecret: { ad: 'LWA Client Secret', zorunlu: true, gizli: true }, refreshToken: { ad: 'Refresh Token', zorunlu: true, gizli: true, desen: '^Atzr\\|', bicim: 'Atzr| ile başlar' }, sandbox: { ad: 'Sandbox', tur: 'onay' } },
  dene, islemler: { 'siparis-cek': siparisler } };
