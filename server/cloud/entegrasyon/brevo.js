// Brevo e-posta istemcisi.
// Kaynak (okundu 31.10.2026, adreste /v3): developers.brevo.com/reference/sendtransacemail, /reference/getaccount, /docs/api-key-authentication, /docs/api-limits
// Kimlik: api-key başlığı. Zararsız deneme: GET /v3/account (saatte 100 istek sınırı). Başarılı gönderim 201 + messageId.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Brevo'; const base = () => adres('brevo', 'https://api.brevo.com');
const baslik = (k) => ({ 'api-key': k.apiKey, accept: 'application/json', 'Content-Type': 'application/json' });
const HATA = { not_enough_credits: 'Brevo kredisi yetersiz', account_under_validation: 'Brevo hesabı henüz onaylanmamış', permission_denied: 'Bu işlem için izin yok', invalid_parameter: 'Gönderim bilgileri geçersiz' };
const hata = (r) => { const c = r.json && r.json.code; return c && HATA[c] ? new SaglayiciHata(HATA[c], { durum: r.durum }) : durumHata(AD, r, r.json && r.json.message); };
async function dene(k) {
  const r = await istek(AD, `${base()}/v3/account`, { baslik: baslik(k), tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (!j.email) throw new SaglayiciHata('Brevo yanıtı okunamadı', { kod: 'bozuk' });
  return { mesaj: `Brevo hesabı doğrulandı: ${j.companyName || j.email}.` };
}
async function gonder(k, v) {
  const r = await istek(AD, `${base()}/v3/smtp/email`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ sender: { email: k.from, ...(k.fromName ? { name: k.fromName } : {}) }, to: [{ email: String(v.to) }], subject: String(v.subject || ''), textContent: String(v.text || ''), ...(v.html ? { htmlContent: String(v.html) } : {}) }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (!j.messageId) throw new SaglayiciHata('Brevo ileti numarası dönmedi', { kod: 'bozuk' }); return { ref: String(j.messageId) };
}
module.exports = { ad: AD, anahtarlar: ['email:brevo'], kaynak: ['https://developers.brevo.com/reference/sendtransacemail'], deneme: 'zararsiz',
  alanlar: { apiKey: { ad: 'API anahtarı', zorunlu: true, gizli: true }, from: { ad: 'Gönderen adres', zorunlu: true, desen: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }, fromName: { ad: 'Gönderen adı', parmakDisi: true } },
  dene, islemler: { gonder } };
