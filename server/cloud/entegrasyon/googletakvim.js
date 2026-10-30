// Google Takvim istemcisi: müşterinin servis hesabıyla, takvim servis hesabıyla paylaşılır.
// Kaynak (okundu 31.10.2026): developers.google.com/identity/protocols/oauth2/service-account (23.03.2026), developers.google.com/workspace/calendar/api/v3/reference/calendars/get (12.05.2026), .../events/insert (07.07.2026), .../guides/errors (11.09.2026)
// Zararsız deneme: GET calendars/{id}. Katılımcı eklenmez: servis hesabı alan genişliği yetkisi olmadan attendees dolduramaz (events.insert sayfası).
const crypto = require('crypto');
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, form } = require('./ortak');
const AD = 'Google Takvim'; const KAPSAM = 'https://www.googleapis.com/auth/calendar';
const jetonAdres = () => adres('google-token', 'https://oauth2.googleapis.com') + '/token'; const base = () => adres('google', 'https://www.googleapis.com') + '/calendar/v3';
const b64 = (x) => Buffer.from(x).toString('base64url');
function hesap(k) { let j; try { j = JSON.parse(k.serviceAccount); } catch (e) { throw new SaglayiciHata('Servis hesabı anahtarı JSON değil', { kod: 'bicim' }); } if (!j.client_email || !j.private_key) throw new SaglayiciHata('Servis hesabı anahtarında client_email veya private_key yok', { kod: 'bicim' }); return j; }
async function jeton(k) {
  const h = hesap(k); const t = Math.floor(Date.now() / 1000); const govde = `${b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64(JSON.stringify({ iss: h.client_email, scope: KAPSAM, aud: 'https://oauth2.googleapis.com/token', iat: t, exp: t + 3600 }))}`;
  let imza; try { imza = crypto.createSign('RSA-SHA256').update(govde).sign(h.private_key, 'base64url'); } catch (e) { throw new SaglayiciHata('Servis hesabının özel anahtarı okunamadı', { kod: 'bicim' }); }
  const r = await istek(AD, jetonAdres(), { yontem: 'POST', baslik: { 'Content-Type': 'application/x-www-form-urlencoded' }, govde: form({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${govde}.${imza}` }) });
  if (!r.ok) throw new SaglayiciHata('Google servis hesabı anahtarını kabul etmedi', { kod: 'yetki', durum: r.durum }); const j = jsonBekle(AD, r); if (!j.access_token) throw new SaglayiciHata('Google erişim jetonu vermedi', { kod: 'bozuk' }); return j.access_token;
}
const hata = (r) => { const m = r.json && r.json.error && r.json.error.message; if (r.durum === 404) return new SaglayiciHata('Takvim bulunamadı. Takvimi servis hesabının e-postasıyla paylaştığınızdan emin olun.', { kod: 'bulunamadi', durum: 404 }); return durumHata(AD, r, m); };
async function dene(k) {
  const t = await jeton(k); const r = await istek(AD, `${base()}/calendars/${encodeURIComponent(k.calendarId)}`, { baslik: { Authorization: `Bearer ${t}` }, tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Google Takvim yanıtı okunamadı', { kod: 'bozuk' }); return { mesaj: `Takvim doğrulandı: ${j.summary || j.id}.` };
}
async function etkinlik(k, v) {
  if (!v.start || !v.end) throw new SaglayiciHata('Başlangıç ve bitiş zamanı gerekli', { kod: 'bicim' });
  const t = await jeton(k); const z = { timeZone: 'Europe/Istanbul' };
  const r = await istek(AD, `${base()}/calendars/${encodeURIComponent(k.calendarId)}/events`, { yontem: 'POST', baslik: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, govde: JSON.stringify({ summary: String(v.title || v.summary || ''), description: String(v.description || ''), start: { dateTime: String(v.start), ...z }, end: { dateTime: String(v.end), ...z } }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Google Takvim etkinlik numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.id) };
}
module.exports = { ad: AD, anahtarlar: ['takvim:google'], kaynak: ['https://developers.google.com/identity/protocols/oauth2/service-account'], deneme: 'zararsiz',
  alanlar: { serviceAccount: { ad: 'Servis hesabı anahtarı (JSON)', zorunlu: true, gizli: true, enCok: 8000 }, calendarId: { ad: 'Takvim kimliği', zorunlu: true } },
  dene, islemler: { etkinlik, 'etkinlik-ekle': etkinlik } };
