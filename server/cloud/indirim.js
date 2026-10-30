// Toplu alım indirimi: kademeler config/toplu-indirim.json dosyasından gelir, hesap yalnızca sunucuda yapılır.
// Tutarlar kuruş olarak hesaplanır. Ölçütlerden en yüksek tek indirim uygulanır, kuponla birleşmez (büyük olan geçerli).
// Destek paketi ve Hepsi Bir Arada indirime girmez; Hepsi Bir Arada program sayısına da eklenmez. KDV indirimden sonra hesaplanır.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'config', 'toplu-indirim.json');
const ADLAR = { programSayisi: 'program', subeSayisi: 'şube', lisansSayisi: 'lisans' };
let cache = null; let mtime = 0;

function check(c) {
  Object.keys(ADLAR).forEach((k) => { if (!Array.isArray(c[k])) throw new Error(`toplu-indirim.json: ${k} liste olmalı`); c[k].forEach((t) => { if (!Number.isInteger(t.min) || t.min < 1 || !(t.yuzde > 0) || t.yuzde >= 100) throw new Error(`toplu-indirim.json: ${k} kademesi hatalı`); }); });
  return c;
}
function load() { const m = fs.statSync(FILE).mtimeMs; if (!cache || m !== mtime) { cache = check(JSON.parse(fs.readFileSync(FILE, 'utf8'))); mtime = m; } return cache; }
const kr = (tl) => Math.round(Number(tl) * 100);
const tl = (k) => Math.round(k) / 100;
const adet = (x, min = 0) => { const n = Math.floor(Number(x)); return Number.isFinite(n) && n > min ? n : min; };
// Eşiği geçen en yüksek kademe
const kademe = (liste, n) => (liste || []).filter((t) => n >= t.min).reduce((b, t) => (!b || t.yuzde > b.yuzde ? t : b), null);
const uygunMu = (l) => l.type !== 'support' && l.pid !== 'bundle';

// sepet: { lines: catalog.price().lines, subeSayisi, lisansSayisi }
function hesapla(sepet, opt = {}) {
  const c = opt.kurallar || load(); const vatPct = opt.kdv === undefined ? 20 : opt.kdv; const kupon = Math.min(100, Math.max(0, Number(opt.kuponYuzde) || 0));
  const lines = (sepet.lines || []).map((l) => ({ ...l, kurus: kr(l.price) })); if (!lines.length) throw new Error('Sepet boş');
  if (lines.some((l) => !Number.isFinite(l.kurus) || l.kurus < 0)) throw new Error('Geçersiz tutar');
  const uygun = lines.filter(uygunMu); const taban = uygun.reduce((s, l) => s + l.kurus, 0);
  const n = { programSayisi: new Set(uygun.filter((l) => !/^eklenti-/.test(l.pid)).map((l) => l.pid)).size, subeSayisi: adet(sepet.subeSayisi, 1), lisansSayisi: Math.max(adet(sepet.lisansSayisi, 0), uygun.reduce((s, l) => s + (adet(l.qty, 1)), 0)) };
  const adaylar = Object.keys(ADLAR).map((k) => { const t = kademe(c[k], n[k]); return t ? { kural: k, ad: `${n[k]} ${ADLAR[k]}`, yuzde: t.yuzde, min: t.min } : null; }).filter(Boolean);
  const enIyi = adaylar.reduce((b, a) => (!b || a.yuzde > b.yuzde ? a : b), null);
  const secilen = kupon > 0 && (!enIyi || kupon >= enIyi.yuzde) ? { kural: 'kupon', ad: 'Kupon', yuzde: kupon } : enIyi;
  const indirimK = secilen ? Math.round((taban * secilen.yuzde) / 100) : 0;
  const ara = lines.reduce((s, l) => s + l.kurus, 0); const matrah = ara - indirimK; const kdv = Math.round((matrah * vatPct) / 100);
  return { lines: lines.map(({ kurus, ...l }) => l), subtotal: tl(ara), discount: tl(indirimK), indirim: secilen ? { ...secilen, tutar: tl(indirimK) } : null, adaylar, vat: tl(kdv), total: tl(matrah + kdv), olcut: n, kurumsal: n.lisansSayisi >= ((c.kurumsal || {}).formEsigi || Infinity) };
}

// Bir sonraki kademe: uygulanan yüzdeyi geçen en yakın eşik. Sepette "2 lisans daha ekleyin, %10 olsun" bilgisi buradan gelir.
function sonraki(sonuc, c = load()) {
  const simdi = sonuc.indirim ? sonuc.indirim.yuzde : 0; const n = sonuc.olcut;
  const adaylar = Object.keys(ADLAR).flatMap((k) => (c[k] || []).filter((t) => t.min > n[k] && t.yuzde > simdi).map((t) => ({ kural: k, ad: ADLAR[k], eksik: t.min - n[k], min: t.min, yuzde: t.yuzde })));
  return adaylar.reduce((b, a) => (!b || a.eksik < b.eksik || (a.eksik === b.eksik && a.yuzde > b.yuzde) ? a : b), null);
}

module.exports = { load, check, kademe, hesapla, sonraki };
