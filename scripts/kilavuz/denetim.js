// Kılavuz doğruluk denetimi: **kalın** yazılan her düğme ve menü adı kodda veya ekranda bulunmalı, her menü modülü anlatılmalı, vaat cümlesi olmamalı.
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const nor = (s) => String(s).replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const kalinlar = (t) => [...String(t).matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1]);

// Programın sayfasının yüklediği tüm betikler + çekirdek: kodda var sayılan metin buradan aranır
function kodMetni(id) {
  const dir = path.join(ROOT, 'apps', id); const oku = (f) => fs.readFileSync(f, 'utf8');
  const ortak = [...oku(path.join(dir, 'index.html')).matchAll(/src="\.\.\/([a-z-]+\/[\w-]+\.js)"/g)].map((m) => path.join(ROOT, 'apps', m[1]));
  const core = fs.readdirSync(path.join(ROOT, 'core')).filter((f) => /\.js$/.test(f)).map((f) => path.join(ROOT, 'core', f));
  return nor([...fs.readdirSync(dir).filter((f) => /\.(js|html)$/.test(f)).map((f) => path.join(dir, f)), ...ortak, ...core].map(oku).join('\n'));
}
// Kılavuzdaki tüm yazılar (içindekiler hariç) düz dizi olarak
function yazilar(o, cik = []) { if (typeof o === 'string') cik.push(o); else if (Array.isArray(o)) o.forEach((x) => yazilar(x, cik)); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (!['git', 'once', 'kirp', 'bulanik', 'sec', 'id', 'kaynak', 'url', 'boy'].includes(k)) yazilar(v, cik); }); return cik; }

function adlar(K, ekran, kod) {
  const hata = []; const E = nor(ekran); const bak = (t, nerede) => { const x = nor(t); if (!E.includes(x) && !kod.includes(x)) hata.push(`${nerede}: "${t}" ne ekranda ne kodda var`); };
  yazilar(K).forEach((t) => kalinlar(t).forEach((b) => bak(b, 'Kalın ad')));
  K.moduller.forEach((m) => (m.alanlar || []).forEach(([a]) => { if (!/^[~]/.test(a)) bak(a.replace(/\*\*/g, ''), `${m.id} alanı`); }));
  return hata;
}
function vaat(K) {
  const Y = /en iyi|garantili|garanti ediyor|garanti eder|sıfır hata|bir numara|1 numara|lider|kesintisiz|%\s?\d+\s?(?:artış|kazanç|tasarruf)|\d+\s?kat\b|binlerce (?:müşteri|işletme)|mutlu müşteri/i; const hata = [];
  yazilar(K).forEach((t) => { const d = String(t).replace(/\*\*.+?\*\*/g, ''); const m = d.match(Y); if (m) hata.push(`Vaat ifadesi "${m[0]}": ${d.slice(0, 90)}`); });
  return hata;
}
function kapsam(K, nav) { const var_ = new Set(K.moduller.map((m) => m.id)); const hata = nav.filter(([i]) => !var_.has(i)).map(([i, ad]) => `Menü modülü anlatılmadı: ${i} (${ad})`); K.moduller.forEach((m) => { if (!nav.some(([i]) => i === m.id)) hata.push(`Kılavuzda var, menüde yok: ${m.id}`); }); return hata; }
function entegrasyonKapsam(K, liste) { const E = K.entegrasyon || {}; const hata = liste.filter((k) => !E[k] || !(E[k].degisir || []).length).map((k) => `Entegrasyon anlatılmadı: ${k} (Bu programda ne değişir yazılmalı)`); Object.keys(E).forEach((k) => { if (!liste.includes(k)) hata.push(`Kılavuzda var, Entegrasyon Merkezi'nde yok: ${k}`); }); return hata; }
// Ekranda görünmemesi gereken gerçek kişi verisi kalıpları: yalnız kurgu olduğu bilinenler geçer
function kisiVerisi(metin) { const m = String(metin).match(/\b[1-9]\d{9}[02468]\b/g) || []; return [...new Set(m)]; }
module.exports = { nor, kalinlar, kodMetni, yazilar, adlar, vaat, kapsam, entegrasyonKapsam, kisiVerisi };
