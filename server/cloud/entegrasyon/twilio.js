// Twilio SMS istemcisi.
// Kaynak (okundu 31.10.2026, API 2010-04-01): twilio.com/docs/usage/requests-to-twilio, /docs/messaging/api/message-resource, /docs/usage/twilios-response  ·  OpenAPI github.com/twilio/twilio-oai (Balance.json)
// Zararsız deneme: GET Accounts/{Sid}/Balance.json. Accounts/{Sid}.json yanıtı auth_token içerdiği için kullanılmaz. Gönderim form biçimindedir, başarı 201.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic, form } = require('./ortak');
const AD = 'Twilio'; const base = (k) => `${adres('twilio', 'https://api.twilio.com')}/2010-04-01/Accounts/${k.sid}`;
const HATA = { 21408: 'Twilio hesabında bu ülkeye gönderim izni kapalı', 21610: 'Alıcı aboneliğini kaldırmış', 21612: 'Bu gönderen ve alıcı ile gönderim yapılamıyor', 21614: 'Alıcı numarası geçerli mobil numara değil' };
const hata = (r) => { const c = r.json && r.json.code; return HATA[c] ? new SaglayiciHata(HATA[c], { durum: r.durum }) : durumHata(AD, r, r.json && r.json.message); };
async function dene(k) {
  const r = await istek(AD, `${base(k)}/Balance.json`, { baslik: { Authorization: basic(k.sid, k.token), Accept: 'application/json' }, tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (j.account_sid !== k.sid) throw new SaglayiciHata('Twilio yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `Twilio hesabı doğrulandı. Bakiye: ${j.balance ?? '?'} ${j.currency || ''}.` };
}
async function gonder(k, v) {
  const r = await istek(AD, `${base(k)}/Messages.json`, { yontem: 'POST', baslik: { Authorization: basic(k.sid, k.token), 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, govde: form({ To: `+${String(v.to || '').replace(/\D/g, '')}`, From: k.from, Body: String(v.text || '') }) });
  if (r.durum !== 201) throw hata(r); const j = jsonBekle(AD, r); if (!j.sid) throw new SaglayiciHata('Twilio ileti numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.sid) };
}
module.exports = { ad: AD, anahtarlar: ['sms:twilio'], kaynak: ['https://www.twilio.com/docs/messaging/api/message-resource'], deneme: 'zararsiz',
  alanlar: { sid: { ad: 'Account SID', zorunlu: true, desen: '^AC[0-9a-fA-F]{32}$', bicim: 'AC ile başlar, 34 karakter' }, token: { ad: 'Auth token', zorunlu: true, gizli: true }, from: { ad: 'Gönderen numara', zorunlu: true } },
  dene, islemler: { gonder } };
