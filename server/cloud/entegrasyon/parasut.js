// Paraşüt Bağlantıyı dene. Fatura gönderimi core/integrations.js'teki prsSession ile yapılır.
// Kaynak (okundu 31.10.2026, Swagger 4.0.0, change log son girdi 11.10.2021): https://apidocs.parasut.com/swagger.json
// Zararsız deneme: OAuth password grant + GET /v4/me?include=companies. Ayrı test ortamı yoktur. CLIENT_ID ve CLIENT_SECRET destek@parasut.com'dan alınır.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const AD = 'Paraşüt'; const base = () => adres('parasut', 'https://api.parasut.com');
async function dene(k) {
  const t = await istek(AD, `${base()}/oauth/token`, { yontem: 'POST', baslik: { 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ grant_type: 'password', client_id: k.clientId, client_secret: k.clientSecret, username: k.user, password: k.pass, redirect_uri: 'urn:ietf:wg:oauth:2.0:oob' }) });
  if (!t.ok) throw new SaglayiciHata('Paraşüt bilgileri kabul etmedi. Client ID, Client Secret, e-posta ve şifreyi kontrol edin.', { kod: 'yetki', durum: t.durum }); const j = jsonBekle(AD, t); if (!j.access_token) throw new SaglayiciHata('Paraşüt erişim jetonu vermedi', { kod: 'bozuk' });
  const m = await istek(AD, `${base()}/v4/me?include=companies`, { baslik: { Authorization: `Bearer ${j.access_token}`, Accept: 'application/json' }, tekrar: 1 }); if (!m.ok) throw durumHata(AD, m);
  const d = jsonBekle(AD, m); const L = (d.included || []).filter((x) => x.type === 'companies');
  if (k.companyId && L.length && !L.some((x) => String(x.id) === String(k.companyId))) throw new SaglayiciHata(`${k.companyId} numaralı firma bu hesapta yok. Hesaptaki firmalar: ${L.map((x) => x.id).join(', ')}`, { kod: 'bicim' });
  return { mesaj: `Paraşüt bağlantısı doğrulandı.${L.length ? ` Firma sayısı: ${L.length}.` : ''}` };
}
module.exports = { ad: AD, anahtarlar: ['efatura:parasut'], kaynak: ['https://apidocs.parasut.com/'], deneme: 'zararsiz',
  alanlar: { clientId: { ad: 'Client ID', zorunlu: true, gizli: true }, clientSecret: { ad: 'Client Secret', zorunlu: true, gizli: true }, user: { ad: 'E-posta', zorunlu: true }, pass: { ad: 'Şifre', zorunlu: true, gizli: true, kirp: false }, companyId: { ad: 'Firma no', desen: '^\\d{1,12}$' } }, dene, islemler: {} };
