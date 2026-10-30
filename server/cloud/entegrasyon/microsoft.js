// Microsoft Graph takvim istemcisi (uygulama izni, istemci kimlik bilgisi akışı).
// Kaynak (okundu 31.10.2026): learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow (30.01.2026), .../graph/api/calendar-get (23.07.2025), .../graph/api/user-post-events (03.08.2026), .../graph/errors (06.08.2025)
// Zararsız deneme: GET /users/{upn}/calendar. Gerekli uygulama izni: Calendars.ReadWrite, yönetici onayıyla. Saat UTC gönderilir (UTC değeri hafızadan, doğrulanmadı; dokümandaki örnek Windows saat dilimi adıdır).
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const AD = 'Microsoft 365'; const giris = () => adres('ms-login', 'https://login.microsoftonline.com'); const base = () => adres('ms-graph', 'https://graph.microsoft.com') + '/v1.0';
async function jeton(k) {
  const r = await istek(AD, `${giris()}/${encodeURIComponent(k.tenant)}/oauth2/v2.0/token`, { yontem: 'POST', baslik: { 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ client_id: k.clientId, scope: 'https://graph.microsoft.com/.default', client_secret: k.clientSecret, grant_type: 'client_credentials' }) });
  if (!r.ok) throw new SaglayiciHata('Microsoft bilgileri kabul etmedi. Kiracı, uygulama kimliği ve gizli değeri kontrol edin.', { kod: 'yetki', durum: r.durum }); const j = jsonBekle(AD, r); if (!j.access_token) throw new SaglayiciHata('Microsoft erişim jetonu vermedi', { kod: 'bozuk' }); return j.access_token;
}
const hata = (r) => { const c = r.json && r.json.error && r.json.error.code; if (r.durum === 403) return new SaglayiciHata('Uygulamada Calendars.ReadWrite izni veya yönetici onayı yok', { kod: 'yetki', durum: 403 }); return durumHata(AD, r, c); };
async function dene(k) {
  const t = await jeton(k); const r = await istek(AD, `${base()}/users/${encodeURIComponent(k.userId)}/calendar`, { baslik: { Authorization: `Bearer ${t}` }, tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Microsoft yanıtı okunamadı', { kod: 'bozuk' }); return { mesaj: `Microsoft 365 takvimi doğrulandı: ${k.userId}.` };
}
const utc = (x) => { const d = new Date(x); if (Number.isNaN(d.getTime())) throw new SaglayiciHata('Tarih geçersiz', { kod: 'bicim' }); return { dateTime: d.toISOString().slice(0, 19), timeZone: 'UTC' }; };
async function etkinlik(k, v) {
  const t = await jeton(k); const r = await istek(AD, `${base()}/users/${encodeURIComponent(k.userId)}/calendar/events`, { yontem: 'POST', baslik: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, govde: JSON.stringify({ subject: String(v.title || v.summary || ''), body: { contentType: 'text', content: String(v.description || '') }, start: utc(v.start), end: utc(v.end) }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Microsoft etkinlik numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.id) };
}
module.exports = { ad: AD, anahtarlar: ['takvim:outlook'], kaynak: ['https://learn.microsoft.com/en-us/graph/api/user-post-events'], deneme: 'zararsiz',
  alanlar: { tenant: { ad: 'Kiracı (tenant)', zorunlu: true, desen: '^[a-zA-Z0-9.-]{3,80}$' }, clientId: { ad: 'Uygulama (client) ID', zorunlu: true, gizli: true }, clientSecret: { ad: 'İstemci gizli değeri', zorunlu: true, gizli: true, kirp: false }, userId: { ad: 'Takvim sahibi e-posta', zorunlu: true, desen: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } },
  dene, islemler: { etkinlik, 'etkinlik-ekle': etkinlik } };
