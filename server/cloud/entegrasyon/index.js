// Sağlayıcı kaydı. Her istemci dosyası şu biçimi uygular:
//   { ad, anahtarlar: ['sms:netgsm'], kaynak: [url], alanlar: { alan: { ad, zorunlu, gizli, desen } },
//     deneme: 'zararsiz' | 'ilk-islem', dene(k) → { mesaj, test }, islemler: { gonder(k, veri) → sonuç } }
// deneme 'ilk-islem': sağlayıcıda zararsız uç yoktur, başarı ilk gerçek işlemin yanıtından yazılır.
const cfg = require('../config');
const { SaglayiciHata, alanDenetle, temizle, parmak } = require('./ortak');
const LISTE = [];
const TABLO = {};
function kaydet(s) { if (Array.isArray(s)) return s.forEach(kaydet); LISTE.push(s); s.anahtarlar.forEach((a) => { TABLO[a] = s; }); }
['netgsm', 'iletimerkezi', 'verimor', 'twilio', 'mutlucell', 'whatsapp', 'sendgrid', 'mailgun', 'brevo', 'resend', 'postmark', 'iyzico', 'paytr', 'stripe', 'papara', 'moka', 'sipay', 'paynet', 'craftgate', 'nilvera', 'parasut', 'geliver', 'ups', 'dhlexpress', 'yurtici', 'aras', 'ptt', 'pazaryeri', 'idefix', 'amazon', 'trendyolgo', 'hotelrunner', 'googletakvim', 'microsoft', 'zoom', 'webhook'].forEach((f) => kaydet(require('./' + f)));

const bul = (anahtar) => TABLO[anahtar] || null;
const hataYaz = (e, s, k) => ({ ok: false, kod: e.kod || 'ic', durum: e.durum || 0, hata: temizle(e instanceof SaglayiciHata ? e.message : 'İşlem tamamlanamadı', s && s.alanlar, k) });
// Bağlantıyı dene: yalnız sağlayıcının gerçek yanıtına göre sonuç döner
async function dene(anahtar, ham) {
  const s = bul(anahtar); if (!s) return { ok: false, kod: 'yok', hata: 'Bu sağlayıcının sunucu istemcisi yok' };
  let k; try { k = alanDenetle(s.alanlar, ham); } catch (e) { return hataYaz(e, s, ham); }
  if (s.deneme === 'ilk-islem' && !s.dene) return { ok: false, kod: 'ilk-islem', hata: `${s.ad} için zararsız deneme ucu yok, bağlantı ilk gerçek işlemde sınanır`, ilkIslem: true, parmak: parmak(anahtar, s.alanlar, k, cfg.anahtar()) };
  try { const r = await s.dene(k); return { ok: true, mesaj: temizle(r.mesaj, s.alanlar, k), test: !!r.test, parmak: parmak(anahtar, s.alanlar, k, cfg.anahtar()) }; } catch (e) { return hataYaz(e, s, k); }
}
// Gerçek işlem. Sonuç sağlayıcının yanıtından gelir; başarısızlık başarı gibi dönmez
async function islem(anahtar, ad, ham, veri) {
  const s = bul(anahtar); if (!s) return { ok: false, kod: 'yok', hata: 'Bu sağlayıcının sunucu istemcisi yok' };
  const fn = s.islemler && s.islemler[ad]; if (!fn) return { ok: false, kod: 'islem-yok', hata: `${s.ad} bu işlemi desteklemiyor` };
  let k; try { k = alanDenetle(s.alanlar, ham); return { ok: true, sonuc: await fn(k, veri || {}) }; } catch (e) { return hataYaz(e, s, k || ham); }
}
const parmakIzi = (anahtar, ham) => { const s = bul(anahtar); if (!s) return ''; try { return parmak(anahtar, s.alanlar, alanDenetle(s.alanlar, ham), cfg.anahtar()); } catch (e) { return ''; } };
// Tarayıcıya giden özet: alan adı ve gizli bilgi değeri içermez
const ozet = () => LISTE.flatMap((s) => s.anahtarlar.map((a) => ({ anahtar: a, ad: s.ad, deneme: s.deneme || 'zararsiz', islemler: Object.keys(s.islemler || {}) })));
module.exports = { bul, dene, islem, parmakIzi, ozet, kaydet, LISTE };
