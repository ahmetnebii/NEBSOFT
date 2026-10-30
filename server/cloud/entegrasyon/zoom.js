// Zoom Server-to-Server OAuth istemcisi.
// Kaynak (okundu 31.10.2026, sayfalarda sürüm yok, API /v2): developers.zoom.us/docs/internal-apps/s2s-oauth, /docs/api/using-zoom-apis, /docs/api/meetings (Create a meeting), /docs/api/users (Get a user), /docs/api/errors
// Dokümana göre bu uygulama türünde "me" kullanılmaz, userId veya e-posta gerekir: ev sahibi e-postası alan olarak istenir. Zararsız deneme: jeton + GET /v2/users/{email}.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic, form } = require('./ortak');
const AD = 'Zoom'; const giris = () => adres('zoom-oauth', 'https://zoom.us'); const base = () => adres('zoom', 'https://api.zoom.us') + '/v2';
async function jeton(k) {
  const r = await istek(AD, `${giris()}/oauth/token`, { yontem: 'POST', baslik: { Authorization: basic(k.clientId, k.clientSecret), 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ grant_type: 'account_credentials', account_id: k.accountId }) });
  if (!r.ok) throw new SaglayiciHata('Zoom bilgileri kabul etmedi. Uygulamanın etkinleştirildiğini ve Account ID, Client ID, Client Secret değerlerini kontrol edin.', { kod: 'yetki', durum: r.durum }); const j = jsonBekle(AD, r); if (!j.access_token) throw new SaglayiciHata('Zoom erişim jetonu vermedi', { kod: 'bozuk' }); return j.access_token;
}
const hata = (r) => { const c = r.json && r.json.code; if (c === 1001) return new SaglayiciHata('Bu e-posta Zoom hesabında yok', { kod: 'bulunamadi', durum: r.durum }); if (c === 4700) return new SaglayiciHata('Zoom jetonu kabul etmedi, uygulama kapsamlarını kontrol edin', { kod: 'yetki', durum: r.durum }); return durumHata(AD, r, r.json && r.json.message); };
async function dene(k) {
  const t = await jeton(k); const r = await istek(AD, `${base()}/users/${encodeURIComponent(k.hostEmail)}`, { baslik: { Authorization: `Bearer ${t}` }, tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Zoom yanıtı okunamadı', { kod: 'bozuk' }); return { mesaj: `Zoom hesabı doğrulandı: ${k.hostEmail}.` };
}
async function toplanti(k, v) {
  const t = await jeton(k); const r = await istek(AD, `${base()}/users/${encodeURIComponent(k.hostEmail)}/meetings`, { yontem: 'POST', baslik: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, govde: JSON.stringify({ topic: String(v.title || 'Ders').slice(0, 200), type: 2, start_time: String(v.start || '').length === 16 ? `${v.start}:00` : String(v.start || ''), timezone: 'Europe/Istanbul', duration: Number(v.minutes) || 40, settings: { waiting_room: true, join_before_host: false } }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (!j.join_url) throw new SaglayiciHata('Zoom toplantı bağlantısı dönmedi', { kod: 'bozuk' }); return { url: String(j.join_url), id: j.id, created: true }; // start_url yalnız ev sahibinindir, dönmez
}
module.exports = { ad: AD, anahtarlar: ['onlineders:zoom'], kaynak: ['https://developers.zoom.us/docs/internal-apps/s2s-oauth/'], deneme: 'zararsiz',
  alanlar: { accountId: { ad: 'Account ID', zorunlu: true }, clientId: { ad: 'Client ID', zorunlu: true, gizli: true }, clientSecret: { ad: 'Client Secret', zorunlu: true, gizli: true }, hostEmail: { ad: 'Toplantı sahibi e-posta', zorunlu: true, desen: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } },
  dene, islemler: { 'toplanti-olustur': toplanti } };
