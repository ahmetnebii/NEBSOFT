// Mutlucell SMS istemcisi (yalnız XML).
// Kaynak (okundu 31.10.2026, doküman sürümsüz, © 2010-2015, hata kodları sayfası 01.07.2024): mutlucell.com.tr/toplusmsapi/ (hm_kontr_sorgulama, hm_originatr_sorgulama, hm_xmlin_formati_nasil_olmalidir_, hm_smspack_parametreleri, hm_hata_kodlari)
// Zararsız deneme: gtcrdtex (kontör) + gtorgex (başlık listesi). Yanıtlar düz metindir: "$" ile başlıyorsa başarı, değilse hata kodu. Test ortamı yok.
const { SaglayiciHata, adres, istek, durumHata, xml } = require('./ortak');
const AD = 'Mutlucell'; const base = () => adres('mutlucell', 'https://smsgw.mutlucell.com') + '/smsgw-ws';
const HATA = { 20: 'Gönderilen veri eksik veya hatalı', 21: 'Bu başlığa sahip değilsiniz', 22: 'Kontör yetersiz', 23: 'Kullanıcı adı veya parola hatalı', 24: 'Hesapta başka bir işlem sürüyor', 25: 'Mutlucell şu anda gönderemiyor, birkaç dakika sonra deneyin', 30: 'Hesap aktivasyonu yapılmamış', 34: 'Hesap API erişimine kapalı' };
const hataOf = (m) => new SaglayiciHata(HATA[m] || `Mutlucell hata kodu ${String(m).slice(0, 30)}`, { kod: ['23', '30', '34'].includes(String(m)) ? 'yetki' : 'saglayici' });
const cagir = async (uc, govde) => { const r = await istek(AD, `${base()}/${uc}`, { yontem: 'POST', baslik: { 'Content-Type': 'text/xml; charset=UTF-8' }, govde: `<?xml version="1.0" encoding="UTF-8"?>${govde}` }); if (!r.ok) throw durumHata(AD, r); return r.metin.trim(); };
const kim = (k) => `ka="${xml(k.user)}" pwd="${xml(k.pass)}"`;
async function dene(k) {
  const b = await cagir('gtcrdtex', `<smskredi ${kim(k)} />`); if (!b.startsWith('$')) throw hataOf(b);
  const o = await cagir('gtorgex', `<smsorig ${kim(k)} />`); if (/^\d{2}$/.test(o)) throw hataOf(o); const L = o.split(/\s+/).filter(Boolean);
  if (L.length && !L.includes(k.header)) throw new SaglayiciHata(`"${k.header}" başlığı hesapta yok. Hesaptaki başlıklar: ${L.join(', ')}`, { kod: 'bicim' });
  return { mesaj: `Mutlucell hesabı doğrulandı. Kalan kontör: ${b.slice(1)}.` };
}
async function gonder(k, v) {
  const y = await cagir('sndblkex', `<smspack ${kim(k)} org="${xml(k.header)}" charset="turkish"><mesaj><metin>${xml(v.text)}</metin><nums>${xml(String(v.to || '').replace(/\D/g, ''))}</nums></mesaj></smspack>`);
  if (!y.startsWith('$')) throw hataOf(y); return { ref: y.slice(1).split('#')[0] };
}
module.exports = { ad: AD, anahtarlar: ['sms:mutlucell'], kaynak: ['https://www.mutlucell.com.tr/toplusmsapi/'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Kullanıcı adı', zorunlu: true }, pass: { ad: 'Parola veya API anahtarı', zorunlu: true, gizli: true, kirp: false }, header: { ad: 'Başlık (originatör)', zorunlu: true, desen: '^.{1,11}$', bicim: 'en çok 11 karakter' } },
  dene, islemler: { gonder } };
