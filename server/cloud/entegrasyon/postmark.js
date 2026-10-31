// Postmark e-posta istemcisi.
// Kaynak (okundu 31.10.2026, sayfalarda sürüm yok): postmarkapp.com/developer/api/overview, /developer/api/email-api, /developer/api/server-api
// Zararsız deneme: GET /server. Yanıt ApiTokens listesi içerir: bu alan hiçbir yere yazılmaz, yalnız Name ve DeliveryType okunur.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'Postmark'; const base = () => adres('postmark', 'https://api.postmarkapp.com');
const baslik = (k) => ({ 'X-Postmark-Server-Token': k.token, Accept: 'application/json', 'Content-Type': 'application/json' });
const HATA = { 10: 'Postmark sunucu belirteci geçersiz', 300: 'Gönderen adres veya alıcı doğrulanamadı', 406: 'Alıcı pasif listede', 412: 'Hesap onay bekliyor, alıcı gönderenle aynı alan adında olmalı', 413: 'Hesap gönderim için onaylı değil' };
const hata = (r) => { const c = r.json && r.json.ErrorCode; return HATA[c] ? new SaglayiciHata(HATA[c], { kod: c === 10 ? 'yetki' : 'saglayici', durum: r.durum }) : durumHata(AD, r, r.json && r.json.Message); };
async function dene(k) {
  const r = await istek(AD, `${base()}/server`, { baslik: baslik(k), tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (j.ID === undefined) throw new SaglayiciHata('Postmark yanıtı okunamadı', { kod: 'bozuk' });
  const test = j.DeliveryType === 'Sandbox'; return { mesaj: `Postmark sunucusu doğrulandı: ${String(j.Name || '')}${test ? ' (sandbox, ileti teslim edilmez)' : ''}.`, test };
}
async function gonder(k, v) {
  const r = await istek(AD, `${base()}/email`, { yontem: 'POST', baslik: baslik(k), govde: JSON.stringify({ From: k.from, To: String(v.to), Subject: String(v.subject || ''), TextBody: String(v.text || ''), ...(v.html ? { HtmlBody: String(v.html) } : {}), MessageStream: 'outbound' }) });
  if (!r.ok) throw hata(r); const j = jsonBekle(AD, r); if (j.ErrorCode !== 0 || !j.MessageID) throw hata({ ...r, durum: 422 }); return { ref: String(j.MessageID) };
}
module.exports = { ad: AD, anahtarlar: ['email:postmark'], kaynak: ['https://postmarkapp.com/developer/api/email-api'], deneme: 'zararsiz',
  alanlar: { token: { ad: 'Sunucu belirteci', zorunlu: true, gizli: true }, from: { ad: 'Gönderen adres', zorunlu: true } },
  dene, islemler: { gonder } };
