// Netgsm SMS istemcisi. Kimlik: abone no + API alt kullanıcı şifresi.
// Kaynak (okundu 31.10.2026, doküman sürüm notu 2.0 / 13.03.2023, son duyuru 09.09.2026):
//   https://www.netgsm.com.tr/dokuman/  ·  resmî SDK https://github.com/netgsm/netgsm-sms-js (@netgsm/sms 1.1.11)
// Zararsız deneme: POST /balance (kredi harcamaz) + GET /sms/rest/v2/msgheader (başlık kontrolü). Test ortamı yok.
const { SaglayiciHata, adres, istek, jsonBekle, durumHata, basic } = require('./ortak');
const AD = 'Netgsm'; const base = () => adres('netgsm', 'https://api.netgsm.com.tr');
const HATA = { 20: 'Mesaj metni hatalı veya en fazla karakter aşıldı', 30: 'Kullanıcı kodu veya şifre hatalı, API izni yok ya da sunucu adresi izinli değil', 40: 'Mesaj başlığı Netgsm hesabında tanımlı değil', 50: 'Bu hesapla İYS kontrollü gönderim yapılamıyor', 51: 'Hesapta İYS marka bilgisi yok', 70: 'Netgsm isteği hatalı buldu', 80: 'Gönderim sınırı aşıldı', 85: 'Aynı numaraya bir dakikada en fazla 20 gönderim yapılabilir', 100: 'Netgsm sistem hatası', 101: 'Netgsm sistem hatası' };
const hataOf = (kod) => new SaglayiciHata(HATA[kod] || `Netgsm hata kodu ${kod}`, { kod: Number(kod) === 30 ? 'yetki' : 'saglayici' });
const yetki = (k) => ({ Authorization: basic(k.user, k.pass), 'Content-Type': 'application/json', Accept: 'application/json' });

async function bakiye(k) {
  const r = await istek(AD, `${base()}/balance`, { yontem: 'POST', baslik: { 'Content-Type': 'application/json' }, govde: JSON.stringify({ usercode: k.user, password: k.pass, stip: 3 }) });
  const j = jsonBekle(AD, r);
  if (Array.isArray(j.balance)) return j.balance.map((x) => `${x.amount} ${x.balance_name}`).join(', ');
  if (String(j.code) === '60') return 'hesapta tanımlı paket yok';
  if (j.code !== undefined) throw hataOf(j.code);
  throw new SaglayiciHata('Netgsm yanıtı okunamadı', { kod: 'bozuk' });
}
async function basliklar(k) {
  const r = await istek(AD, `${base()}/sms/rest/v2/msgheader?appname=NEBSOFT`, { baslik: yetki(k), tekrar: 1 });
  const j = jsonBekle(AD, r); if (String(j.code) !== '00') throw hataOf(j.code); return Array.isArray(j.msgheaders) ? j.msgheaders : [];
}
async function dene(k) {
  const b = await bakiye(k); const L = await basliklar(k);
  if (L.length && !L.includes(k.header)) throw new SaglayiciHata(`"${k.header}" başlığı hesapta yok. Hesaptaki başlıklar: ${L.join(', ')}`, { kod: 'bicim' });
  return { mesaj: `Netgsm hesabı doğrulandı. Bakiye: ${b}.` };
}
async function gonder(k, v) {
  const no = String(v.to || '').replace(/\D/g, '').replace(/^90(?=5\d{9}$)/, '');
  const r = await istek(AD, `${base()}/sms/rest/v2/send`, { yontem: 'POST', baslik: yetki(k), govde: JSON.stringify({ msgheader: k.header, messages: [{ msg: String(v.text || ''), no }], encoding: 'TR', iysfilter: v.iys === 'ticari-bireysel' ? '11' : v.iys === 'ticari-tacir' ? '12' : '0', appname: 'NEBSOFT' }) });
  if (!r.json && !r.ok) throw durumHata(AD, r); const j = jsonBekle(AD, r);
  if (!['00', '01', '02'].includes(String(j.code))) throw hataOf(j.code);
  if (!j.jobid) throw new SaglayiciHata('Netgsm iş numarası dönmedi', { kod: 'bozuk' });
  return { ref: String(j.jobid) };
}
module.exports = { ad: AD, anahtarlar: ['sms:netgsm'], kaynak: ['https://www.netgsm.com.tr/dokuman/'], deneme: 'zararsiz',
  alanlar: { user: { ad: 'Abone numarası', zorunlu: true, desen: '^\\d{10}$', bicim: '10 haneli, ör. 850xxxxxxx' }, pass: { ad: 'API alt kullanıcı şifresi', zorunlu: true, gizli: true, kirp: false }, header: { ad: 'Mesaj başlığı', zorunlu: true, desen: '^.{3,11}$', bicim: '3-11 karakter' } },
  dene, islemler: { gonder } };
