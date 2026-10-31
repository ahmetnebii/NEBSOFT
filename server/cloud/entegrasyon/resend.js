// Resend e-posta istemcisi.
// Kaynak (okundu 31.10.2026, API sürümsüz): resend.com/docs/api-reference/{introduction, emails/send-email, errors, domains/list-domains}
// Zararsız deneme: GET /domains. Yalnız gönderim yetkili anahtar bu uçta 401 restricted_api_key alır: anahtar geçerlidir ama alan adı okunamaz, kullanıcıya söylenir. User-Agent zorunludur (ortak istek gönderir).
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Resend'; const base = () => adres('resend', 'https://api.resend.com');
const baslik = (k) => ({ Authorization: `Bearer ${k.apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' });
async function dene(k) {
  const r = await istek(AD, `${base()}/domains`, { baslik: baslik(k), tekrar: 1 });
  if (r.durum === 401 && /restricted_api_key|only send emails/.test(r.metin)) return { mesaj: 'Resend anahtarı geçerli. Yalnız gönderim yetkili olduğu için alan adı denetlenemedi.' };
  if (!r.ok) throw durumHata(AD, r.durum === 400 ? { ...r, durum: 401 } : r); const j = jsonBekle(AD, r); if (!Array.isArray(j.data)) throw new SaglayiciHata('Resend yanıtı okunamadı', { kod: 'bozuk' });
  const alan = String(k.from).split('@').pop().replace(/>$/, ''); const d = j.data.find((x) => x.name === alan); if (!d) throw new SaglayiciHata(`${alan} alan adı Resend hesabında yok`, { kod: 'bulunamadi' });
  return { mesaj: `Resend alan adı doğrulandı: ${d.name} (${d.status}).` };
}
async function gonder(k, v) {
  const r = await istek(AD, `${base()}/emails`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ from: k.from, to: [String(v.to)], subject: String(v.subject || ''), text: String(v.text || ''), ...(v.html ? { html: String(v.html) } : {}) }) });
  if (!r.ok) throw durumHata(AD, r, r.json && r.json.message); const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('Resend ileti numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.id) };
}
module.exports = { ad: AD, anahtarlar: ['email:resend'], kaynak: ['https://resend.com/docs/api-reference/introduction'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true, desen: '^re_', bicim: 're_ ile başlar' }, from: { ad: 'Gönderen adres', zorunlu: true } },
  dene, islemler: { gonder } };
