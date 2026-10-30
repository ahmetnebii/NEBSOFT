// WhatsApp Business Cloud API istemcisi (Meta).
// Kaynak (okundu 31.10.2026, "latest Graph API version is v26.0"): developers.facebook.com/documentation/business-messaging/whatsapp/{reference/whatsapp-business-phone-number/message-api, messages/text-messages, templates/overview, access-tokens, support/error-codes}, developers.facebook.com/docs/graph-api/guides/versioning
// Zararsız deneme: GET /{sürüm}/{phone-number-id}. Serbest metin yalnız 24 saatlik pencerede gider, dışında onaylı şablon gerekir. 200 yalnız kabul demektir, teslim webhook ile gelir.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata } = require('./ortak');
const AD = 'WhatsApp'; const base = (k) => `${adres('whatsapp', 'https://graph.facebook.com')}/${k.version || 'v26.0'}/${k.phoneId}`;
const yetki = (k) => ({ Authorization: `Bearer ${k.token}`, Accept: 'application/json' });
const HATA = { 0: 'Erişim jetonu doğrulanamadı', 190: 'Erişim jetonunun süresi dolmuş', 10: 'Bu işlem için izin yok', 131047: 'Son yanıttan 24 saat geçti, onaylı şablon kullanın', 131026: 'Mesaj teslim edilemedi', 131042: 'WhatsApp ödeme yöntemi hatası', 132001: 'Şablon bu dilde yok veya onaylı değil', 132000: 'Şablon parametre sayısı uyuşmuyor', 133010: 'Numara WhatsApp hesabına kayıtlı değil', 130429: 'Mesaj hızı aşıldı', 131056: 'Aynı alıcıya kısa sürede çok mesaj gönderildi' };
const hata = (r) => { const e = r.json && r.json.error; if (e && HATA[e.code]) return new SaglayiciHata(HATA[e.code], { kod: [0, 190, 10].includes(e.code) ? 'yetki' : 'saglayici', durum: r.durum }); return durumHata(AD, r, e && e.message); };
async function dene(k) {
  const r = await istek(AD, `${base(k)}?fields=verified_name,display_phone_number,quality_rating`, { baslik: yetki(k), tekrar: 1 }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); if (!j.id) throw new SaglayiciHata('WhatsApp yanıtı okunamadı', { kod: 'bozuk' }); return { mesaj: `WhatsApp numarası doğrulandı: ${j.verified_name || ''} ${j.display_phone_number || ''}`.trim() };
}
async function gonder(k, v) {
  const to = String(v.to || '').replace(/\D/g, ''); const t = String(v.text || '');
  const govde = k.template ? { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'template', template: { name: k.template, language: { code: k.lang || 'tr' }, components: [{ type: 'body', parameters: [{ type: 'text', text: t }] }] } } : { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: t } };
  const r = await istek(AD, `${base(k)}/messages`, { yontem: 'POST', baslik: { ...yetki(k), 'Content-Type': 'application/json' }, govde: JSON.stringify(govde) }); if (!r.ok) throw hata(r);
  const j = jsonBekle(AD, r); const id = j.messages && j.messages[0] && j.messages[0].id; if (!id) throw new SaglayiciHata('WhatsApp ileti numarası dönmedi', { kod: 'bozuk' }); return { ref: String(id) };
}
module.exports = { ad: AD, anahtarlar: ['whatsapp:cloud'], kaynak: ['https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api'], deneme: 'zararsiz',
  alanlar: { phoneId: { ad: 'Phone number ID', zorunlu: true, desen: '^\\d{5,30}$' }, token: { ad: 'Erişim jetonu', zorunlu: true, gizli: true }, version: { ad: 'Graph API sürümü', desen: '^v\\d{1,3}\\.\\d$' }, template: { ad: 'Şablon adı', parmakDisi: true }, lang: { ad: 'Şablon dil kodu', parmakDisi: true } },
  dene, islemler: { gonder } };
