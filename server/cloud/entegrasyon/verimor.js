// Verimor SMS istemcisi. Kimlik her istekte kullanıcı adı + API şifresi olarak gider, yanıtlar düz metindir.
// Kaynak (okundu 31.10.2026, depo son commit c2e03b06 / 18.03.2026): https://github.com/verimor/SMS-API/blob/master/user_guide.md
// Zararsız deneme: GET /v2/balance + GET /v2/headers (kredi harcamaz). Test ortamı yok. Sunucunun IP'si OİM SMS Ayarlarım sayfasında kayıtlı olmalı (BTK).
const { SaglayiciHata, adres, istek, durumHata, form } = require('./ortak');
const AD = 'Verimor'; const base = () => adres('verimor', 'https://sms.verimor.com.tr');
const HATA = { INVALID_SOURCE_ADDRESS: 'Mesaj başlığı kabul edilmedi', NUMERIC_SOURCE_ADDRESS_NOT_ALLOWED: 'API üzerinden alfanümerik olmayan başlık kullanılamaz', MISSING_MESSAGE: 'Mesaj metni boş', MESSAGE_TOO_LONG: 'Mesaj çok uzun', MISSING_DESTINATION_ADDRESS: 'Alıcı numarası yok', INVALID_DESTINATION_ADDRESS: 'Alıcı numarası geçersiz', INSUFFICIENT_CREDITS: 'Verimor kredisi yetersiz', FORBIDDEN_MESSAGE: 'Mesaj içeriği yasaklı bulundu', MUKERRER_RAPORLAMA: 'Aynı mesaj 24 saat içinde aynı numaraya gönderilmiş', MISSING_IYS_BRAND_CODE: 'İYS marka kodu eksik', INVALID_IYS_RECIPIENT_TYPE: 'İYS alıcı türü geçersiz', COMMERCIAL_SENDING_ERROR_UNDER_150K: 'Ticari gönderim bu hesapta yapılamıyor', AHS_AUTHORIZATION_ERROR: 'Başlık yetkisi yok', NO_AHS_BRAND_ERROR: 'Başlığa bağlı marka yok', MESSAGE_COUNT_LIMIT_EXCEEDED: 'Mesaj sayısı sınırı aşıldı', INVALID_JSON: 'İstek biçimi hatalı' };
const yanit = (r) => { if (r.ok) return r.metin.trim(); const m = r.metin.trim(); if (r.durum === 400) throw new SaglayiciHata(HATA[m] || `Verimor hata kodu ${m.slice(0, 60)}`); throw durumHata(AD, r, m); };

async function dene(k) {
  const q = form({ username: k.user, password: k.pass });
  const b = await yanit(await istek(AD, `${base()}/v2/balance?${q}`, { tekrar: 1 }));
  if (!/^-?\d+([.,]\d+)?$/.test(b)) throw new SaglayiciHata('Verimor yanıtı okunamadı', { kod: 'bozuk' });
  const h = await istek(AD, `${base()}/v2/headers?${q}`, { tekrar: 1 }); let L = null; try { L = JSON.parse(await yanit(h)); } catch (e) { if (e instanceof SaglayiciHata) throw e; }
  if (!Array.isArray(L)) throw new SaglayiciHata('Verimor başlık listesi okunamadı', { kod: 'bozuk' });
  if (k.header && L.length && !L.includes(k.header)) throw new SaglayiciHata(`"${k.header}" başlığı hesapta yok. Hesaptaki başlıklar: ${L.join(', ')}`, { kod: 'bicim' });
  return { mesaj: `Verimor hesabı doğrulandı. Kalan kredi: ${b}.` };
}
async function gonder(k, v) {
  const ticari = /^ticari/.test(String(v.iys || ''));
  const r = await istek(AD, `${base()}/v2/send.json`, { yontem: 'POST', baslik: { 'Content-Type': 'application/json' }, govde: JSON.stringify({ username: k.user, password: k.pass, source_addr: k.header, datacoding: '1', ...(ticari ? { is_commercial: true, iys_recipient_type: v.iys === 'ticari-tacir' ? 'TACIR' : 'BIREYSEL' } : {}), messages: [{ msg: String(v.text || ''), dest: String(v.to || '').replace(/\D/g, '') }] }) });
  const id = await yanit(r); if (!/^\d+$/.test(id)) throw new SaglayiciHata('Verimor kampanya numarası dönmedi', { kod: 'bozuk' });
  return { ref: id };
}
module.exports = { ad: AD, anahtarlar: ['sms:verimor'], kaynak: ['https://github.com/verimor/SMS-API/blob/master/user_guide.md'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Kullanıcı adı', zorunlu: true, desen: '^90\\d{10}$', bicim: '12 haneli, ör. 908501234567' }, pass: { ad: 'API şifresi', zorunlu: true, gizli: true, kirp: false }, header: { ad: 'Başlık', zorunlu: true } },
  dene, islemler: { gonder } };
