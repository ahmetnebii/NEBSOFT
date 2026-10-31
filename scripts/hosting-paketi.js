// Hostinge yüklenecek temiz paketi üretir: yalnızca çalışma anında gereken dosyalar `yayin/` klasörüne kopyalanır.
// Geliştirme dosyaları, testler, belgeler, gizli veriler ve kurulum çıktıları pakete girmez.
//   node scripts/hosting-paketi.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'yayin');
// Çalışma anında gereken her şey burada: yeni bir üst klasör eklenirse bu listeye de yazılmalı
const DOSYALAR = ['server.js', 'package.json', 'package-lock.json', 'index.html', 'sw.js', 'robots.txt', 'sunucu.json', 'scripts/totp-sifirla.js'];
const KLASORLER = ['admin', 'apps', 'assets', 'config', 'content', 'core', 'market', 'server', 'site', 'indir/kilavuz']; // kılavuz PDF'leri depoda yok, üretilir: node scripts/kilavuz/uret.js
// Klasörlerin içinden atılanlar (kök klasöre göre)
// site/src/site.config.js sunucu tarafından çalışma anında okunur, pakette kalır. Yasal metin şablonları ve markdown.js panelde kullanılır (server/cloud/kurulum.js, seo.js)
const HARIC = [/^server\/test(\/|$)/, /^site\/src\/(?!site\.config\.js$|yasal(\/|$))/, /^site\/tools\/(?!markdown\.js$)/, /\.test\.js$/, /(^|\/)\.DS_Store$/, /^(?!site\/src\/yasal\/).*\.md$/];
// Pakette bulunursa işlem durur: gizli dosya kaçmasın
const YASAK = [/^data(\/|$)/, /^dosyalar(\/|$)/, /^\.git(\/|$)/, /^\.claude(\/|$)/, /^ic-araclar(\/|$)/, /^server\/test(\/|$)/, /\.jks$/, /\.pem$/, /secret\.key$/, /config\.enc$/, /^CLAUDE\.md$/i, /\.env/];

// core/kilavuz.json'daki her kılavuzun PDF'i bulunmalı: yoksa sitedeki bağlantı kırık çıkar
const klv = path.join(ROOT, 'core', 'kilavuz.json');
const eksikPdf = fs.existsSync(klv) ? Object.keys(JSON.parse(fs.readFileSync(klv, 'utf8'))).filter((id) => !fs.existsSync(path.join(ROOT, 'indir', 'kilavuz', `${id}.pdf`))) : [];
if (eksikPdf.length) { console.error(`DURDURULDU: kılavuz PDF'i yok: ${eksikPdf.join(', ')}. Önce: node scripts/kilavuz/uret.js ${eksikPdf.join(' ')}`); process.exit(1); }
const yol = (x) => x.split(path.sep).join('/');
const haric = (rel) => HARIC.some((r) => r.test(yol(rel)));
function kopya(rel) {
  const src = path.join(ROOT, rel); const st = fs.statSync(src);
  if (st.isDirectory()) { fs.readdirSync(src).forEach((n) => { const r = path.join(rel, n); if (!haric(r)) kopya(r); }); return; }
  const dst = path.join(OUT, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); adet++; boyut += st.size;
}
let adet = 0; let boyut = 0;
function tara(dir, out = []) { fs.readdirSync(dir).forEach((n) => { const f = path.join(dir, n); if (fs.statSync(f).isDirectory()) tara(f, out); else out.push(yol(path.relative(OUT, f))); }); return out; }

if (!OUT.startsWith(ROOT + path.sep)) throw new Error('Çıktı klasörü hatalı');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
DOSYALAR.forEach(kopya); KLASORLER.filter((k) => fs.existsSync(path.join(ROOT, k))).forEach(kopya);
const kacak = tara(OUT).filter((f) => YASAK.some((r) => r.test(f)));
if (kacak.length) { fs.rmSync(OUT, { recursive: true, force: true }); console.error('DURDURULDU: pakette gizli dosya var:\n' + kacak.join('\n')); process.exit(1); }
fs.writeFileSync(path.join(OUT, 'YUKLEME-NOTU.txt'), `NEBSOFT hosting paketi\nÜretim: ${new Date().toISOString()}\n\nBu klasörün içeriğini sunucuya yükleyin, sonra: npm ci --omit=dev && node server.js\ndata/ klasörü ve yüklenen fotoğraflar (NEBSOFT_DATA/dosyalar) sunucuda kalır, üzerine yazılmaz. Ayrıntı: depodaki DEPLOY.md\n`);
console.log(`yayin/ hazır: ${adet} dosya, ${(boyut / 1048576).toFixed(1)} MB`);
