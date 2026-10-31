// Mailgun e-posta istemcisi.
// Kaynak (okundu 31.10.2026, sürüm adreste v3/v4): documentation.mailgun.com/docs/mailgun/api-reference/{api-overview, mg-auth, send/mailgun/messages/post-v3--domain-name--messages, send/mailgun/domains/get-v4-domains--name-}
// Kimlik: Basic api:ANAHTAR. Zararsız deneme: GET /v4/domains/{name}. Alan adına bağlı gönderim anahtarının bu ucu okuyup okuyamadığı dokümanda yok: hesap (primary) anahtarı istenir.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic } = require('./ortak');
const AD = 'Mailgun'; const base = (k) => adres('mailgun', k.eu ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net');
const yetki = (k) => ({ Authorization: basic('api', k.apiKey) });
async function dene(k) {
  const r = await istek(AD, `${base(k)}/v4/domains/${encodeURIComponent(k.domain)}`, { baslik: yetki(k), tekrar: 1 });
  if (r.durum === 404) throw new SaglayiciHata(`${k.domain} alan adı bu Mailgun hesabında yok. Bölge seçimini de kontrol edin.`, { kod: 'bulunamadi', durum: 404 });
  if (!r.ok) throw durumHata(AD, r, r.json && r.json.message); const j = jsonBekle(AD, r); if (!j.domain) throw new SaglayiciHata('Mailgun yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `Mailgun alan adı doğrulandı (durum: ${j.domain.state || '?'}).`, test: j.domain.type === 'sandbox' };
}
async function gonder(k, v) {
  const f = new FormData(); f.set('from', k.from); f.set('to', String(v.to)); f.set('subject', String(v.subject || '')); f.set('text', String(v.text || '')); if (v.html) f.set('html', String(v.html));
  const r = await istek(AD, `${base(k)}/v3/${encodeURIComponent(k.domain)}/messages`, { yontem: 'POST', baslik: yetki(k), govde: f });
  if (!r.ok) throw durumHata(AD, r, r.json && r.json.message); const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Mailgun ileti numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.id) };
}
module.exports = { ad: AD, anahtarlar: ['email:mailgun'], kaynak: ['https://documentation.mailgun.com/docs/mailgun/api-reference/mg-auth'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, domain: { ad: 'Alan adı', zorunlu: true, desen: '^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' }, from: { ad: 'Gönderen adres', zorunlu: true }, eu: { ad: 'AB bölgesi', tur: 'onay' } },
  dene, islemler: { gonder } };
