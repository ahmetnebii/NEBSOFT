// SendGrid e-posta istemcisi (Web API v3).
// Kaynak (okundu 31.10.2026): github.com/twilio/sendgrid-oai (tsg_mail_v3, tsg_scopes_v3, info.version 1.0.0), twilio.com/docs/sendgrid/api-reference/mail-send/mail-send, .../how-to-use-the-sendgrid-v3-api/responses
// Zararsız deneme: GET /v3/scopes (ileti göndermez), mail.send izni aranır. Başarılı gönderim 202, gövde boştur. Gönderen adres Verified Sender olmalı (aksi 403).
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'SendGrid'; const base = (k) => adres('sendgrid', k.eu ? 'https://api.eu.sendgrid.com' : 'https://api.sendgrid.com');
const baslik = (k) => ({ Authorization: `Bearer ${k.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json' });
const ilk = (r) => (r.json && r.json.errors && r.json.errors[0] && r.json.errors[0].message) || '';
async function dene(k) {
  const r = await istek(AD, `${base(k)}/v3/scopes`, { baslik: baslik(k), tekrar: 1 }); if (!r.ok) throw durumHata(AD, r, ilk(r));
  const j = jsonBekle(AD, r); if (!Array.isArray(j.scopes)) throw new SaglayiciHata('SendGrid yanıtı okunamadı', { kod: 'bozuk' });
  if (!j.scopes.includes('mail.send')) throw new SaglayiciHata('Bu API anahtarında Mail Send izni yok', { kod: 'yetki' });
  return { mesaj: 'SendGrid anahtarı doğrulandı, gönderim izni var.' };
}
async function gonder(k, v) {
  const r = await istek(AD, `${base(k)}/v3/mail/send`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ personalizations: [{ to: [{ email: String(v.to) }] }], from: { email: k.from }, subject: String(v.subject || ''), content: [{ type: 'text/plain', value: String(v.text || '') }, ...(v.html ? [{ type: 'text/html', value: String(v.html) }] : [])] }) });
  if (r.durum !== 202) throw durumHata(AD, r, ilk(r)); return { ref: r.basliklar.get('x-message-id') || '' };
}
module.exports = { ad: AD, anahtarlar: ['email:sendgrid'], kaynak: ['https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true, desen: '^SG\\.', bicim: 'SG. ile başlar' }, from: { ad: 'Gönderen adres', zorunlu: true, desen: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, eu: { ad: 'AB bölgesi', tur: 'onay' } },
  dene, islemler: { gonder } };
