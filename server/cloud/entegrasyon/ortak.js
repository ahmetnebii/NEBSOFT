// Sağlayıcı istemcilerinin ortak parçası: sabit adrese HTTP isteği, zaman aşımı, güvenli yeniden deneme, hata çevirisi, alan denetimi, anahtar maskesi.
// Kurallar:
//  • Adres istemci dosyasında sabittir, müşteri verisinden gelmez. Yalnız webhook müşteri adresine gider, o da sec.safeFetch ile çıkar.
//  • Yönlendirme izlenmez: kimlik bilgisi başka adrese taşınamaz.
//  • Yeniden deneme yalnız GET'te ve açıkça istenirse. SMS, ödeme, gönderi gibi işlemler tekrarlanmaz, çift işlem riski taşımaz.
//  • Hata metni kullanıcıya ve log'a gitmeden önce anahtar değerleri maskelenir.
const crypto = require('crypto');
const SURE = () => Number(process.env.ENTEGRASYON_TIMEOUT_MS) || 15000;
const EN_COK = 2e6;
class SaglayiciHata extends Error {
  constructor(mesaj, { kod = 'saglayici', durum = 0 } = {}) { super(mesaj); this.name = 'SaglayiciHata'; this.kod = kod; this.durum = durum; }
}
// Test için sahte sunucu: üretimde ortam değişkeni yok sayılır, anahtar başka adrese gidemez
const ozel = () => (process.env.NODE_ENV !== 'production' && process.env.ENTEGRASYON_API_BASE) || '';
const adres = (ad, gercek) => (ozel() ? `${ozel()}/${ad}` : gercek);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const basic = (u, p) => 'Basic ' + Buffer.from(`${u}:${p}`, 'utf8').toString('base64');
const form = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)).toString();
const xml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function metinOku(r) {
  if (!r.body || !r.body.getReader) return r.text();
  const o = r.body.getReader(); const par = []; let n = 0;
  for (;;) { const { done, value } = await o.read(); if (done) break; n += value.length; if (n > EN_COK) { await o.cancel().catch(() => {}); throw new SaglayiciHata('Sağlayıcı yanıtı çok büyük', { kod: 'bozuk' }); } par.push(Buffer.from(value)); }
  return Buffer.concat(par).toString('utf8');
}
// ad: kullanıcıya görünen sağlayıcı adı. tekrar: yalnız GET ve 429/5xx/ağ hatasında kullanılır
async function istek(ad, url, { yontem = 'GET', baslik = {}, govde, sure = SURE(), tekrar = 0 } = {}) {
  const dene = yontem === 'GET' ? Math.max(0, tekrar) : 0;
  for (let i = 0; ; i++) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), sure);
    try {
      const r = await fetch(url, { method: yontem, headers: { 'User-Agent': 'NEBSOFT', ...baslik }, body: yontem === 'GET' ? undefined : govde, signal: ctrl.signal, redirect: 'manual' });
      if (r.status >= 300 && r.status < 400) throw new SaglayiciHata(`${ad} isteği başka adrese yönlendirdi, kimlik bilgisi gönderilmedi`, { kod: 'yonlendirme', durum: r.status });
      if ((r.status === 429 || r.status >= 500) && i < dene) { await bekle(800 * (i + 1)); continue; }
      const metin = await metinOku(r); let json = null; try { json = metin ? JSON.parse(metin) : null; } catch (e) { json = null; }
      return { ok: r.ok, durum: r.status, metin, json, basliklar: r.headers };
    } catch (e) {
      if (e instanceof SaglayiciHata) throw e;
      if (i < dene) { await bekle(800 * (i + 1)); continue; }
      throw new SaglayiciHata(e.name === 'AbortError' ? `${ad} zaman aşımına uğradı` : `${ad} servisine ulaşılamadı`, { kod: e.name === 'AbortError' ? 'zamanasimi' : 'ag' });
    } finally { clearTimeout(t); }
  }
}
// Yanıtın beklenen biçimde olmaması bozuk yanıttır, başarı sayılmaz
const jsonBekle = (ad, r) => { if (r.json === null || typeof r.json !== 'object') throw new SaglayiciHata(`${ad} yanıtı okunamadı`, { kod: 'bozuk', durum: r.durum }); return r.json; };
// HTTP durumundan sade Türkçe: istemci kendi kodlarını önce çevirir, kalanı buraya düşer
function durumHata(ad, r, ek) {
  const d = r.durum; const m = ek ? ` ${String(ek).slice(0, 200)}` : '';
  if (d === 401 || d === 403) return new SaglayiciHata(`${ad} bilgileri kabul etmedi.${m}`, { kod: 'yetki', durum: d });
  if (d === 404) return new SaglayiciHata(`${ad} bu kaydı bulamadı.${m}`, { kod: 'bulunamadi', durum: d });
  if (d === 429) return new SaglayiciHata(`${ad} çok fazla istek aldı, biraz sonra yeniden deneyin.`, { kod: 'sinir', durum: d });
  if (d >= 500) return new SaglayiciHata(`${ad} şu anda yanıt veremiyor (${d}).`, { kod: 'sunucu', durum: d });
  return new SaglayiciHata(`${ad} isteği reddetti (${d}).${m}`, { kod: 'saglayici', durum: d });
}

// Alan şeması: { ad, zorunlu, gizli, desen, kirp:false }. Sunucu tarafı biçim denetimi: tarayıcıdaki denetim atlatılsa da geçersiz bilgi sağlayıcıya gitmez
function alanDenetle(alanlar, ham) {
  const k = {};
  for (const [n, s] of Object.entries(alanlar || {})) {
    let v = ham && ham[n]; if (typeof v === 'string' && s.kirp !== false) v = v.trim();
    if (v === undefined || v === null || v === '') { if (s.zorunlu) throw new SaglayiciHata(`${s.ad} zorunlu`, { kod: 'bicim' }); continue; }
    if (s.tur === 'onay') { k[n] = v === true || v === 'true' || v === 1 || v === '1'; continue; }
    v = String(v); if (s.desen && !new RegExp(s.desen).test(v)) throw new SaglayiciHata(`${s.ad} biçimi hatalı${s.bicim ? `: ${s.bicim}` : ''}`, { kod: 'bicim' });
    if (v.length > (s.enCok || 4000)) throw new SaglayiciHata(`${s.ad} çok uzun`, { kod: 'bicim' });
    k[n] = v;
  }
  return k;
}
// Metindeki gizli değerler *** olur. Sağlayıcı anahtarı hata yanıtında geri yazabilir, ayrıca Basic ve Bearer değerleri de silinir
function temizle(metin, alanlar, k) {
  let s = String(metin ?? '');
  for (const [n, a] of Object.entries(alanlar || {})) { if (!a.gizli) continue; const v = k && k[n]; if (typeof v === 'string' && v.length >= 3) s = s.split(v).join('***'); }
  return s.replace(/(Basic|Bearer)\s+[A-Za-z0-9._~+/=-]+/g, '$1 ***').slice(0, 300);
}
// Kimlik bilgilerinin parmak izi: deneme hangi bilgilerle geçtiyse iş akışı yalnız o bilgilerle çalışır. Değer değil, HMAC saklanır
function parmak(anahtar, alanlar, k, gizliAnahtar) {
  const v = Object.keys(alanlar || {}).filter((n) => !alanlar[n].parmakDisi).sort().map((n) => [n, k[n] === undefined ? '' : String(k[n])]);
  return crypto.createHmac('sha256', gizliAnahtar).update(JSON.stringify([anahtar, v])).digest('hex');
}
// SOAP 1.1 yardımcıları: zarf, tek etiket okuma, Fault metni
const soapZarf = (ic) => `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${ic}</soap:Body></soap:Envelope>`;
const etiket = (m, ad) => { const x = new RegExp(`<(?:[\\w-]+:)?${ad}(?:\\s[^>]*)?>([^<]*)</`).exec(String(m)); return x ? x[1].trim() : ''; };
const hataMetni = (m) => (/<(?:[\w-]+:)?Fault[\s>]/.test(String(m)) ? etiket(m, 'errText') || etiket(m, 'faultstring') || 'Servis hata döndürdü' : '');
module.exports = { soapZarf, etiket, hataMetni, SaglayiciHata, adres, istek, jsonBekle, durumHata, alanDenetle, temizle, parmak, basic, form, xml, ozel };
