// Site kabuğu ve kart görselleri: her üretilmiş sayfa aynı üst menü, alt bilgi ve tema betiğini kullanır, her kart kendi görselini gösterir.
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const ROOT = path.join(__dirname, '..', '..'); const SITE = path.join(ROOT, 'site');
const ok = (ad, f) => { f(); console.log('  ✓', ad); };
const sayfalar = []; const dolas = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { if (['src', 'tools', 'assets', 'img', 'vendor'].includes(x.name)) continue; const y = path.join(d, x.name); if (x.isDirectory()) dolas(y); else if (x.name === 'index.html') sayfalar.push(y); } }; dolas(SITE);
const oku = (f) => fs.readFileSync(f, 'utf8');
const ad = (f) => path.relative(SITE, f).replace(/\\/g, '/');
const ustBlok = (h) => (/<header class="mk-nav">[\s\S]*?<\/header>/.exec(h) || [''])[0].replace(/ class="active" aria-current="page"/g, '');
const altBlok = (h) => (/<footer class="mk-foot">[\s\S]*?<\/footer>/.exec(h) || [''])[0];

console.log('Site kabuğu');
ok(`${sayfalar.length} sayfada üst menü ve alt bilgi tek parça`, () => {
  assert(sayfalar.length > 200); const U = new Set(); const A = new Set();
  for (const f of sayfalar) { const h = oku(f); const u = ustBlok(h); const a = altBlok(h); assert(u, ad(f) + ' üst menü yok'); assert(a, ad(f) + ' alt bilgi yok'); U.add(u); A.add(a); assert(!/class="hd\b|class="ft"/.test(h), ad(f) + ' eski kabuk kaldı'); }
  assert.strictEqual(U.size, 1, 'üst menü sayfadan sayfaya değişiyor'); assert.strictEqual(A.size, 1, 'alt bilgi sayfadan sayfaya değişiyor');
});
ok('her sayfada tema, boyanmadan önce uygulanır ve ana sayfayla aynı anahtarı okur', () => {
  for (const f of sayfalar) { const h = oku(f); const b = h.indexOf("localStorage.getItem('nebsoft:theme')"); const c = h.indexOf('/site/assets/site.css?v='); assert(b > 0 && c > b, ad(f) + ' tema betiği stilden önce olmalı'); assert(/<html lang="tr" data-theme="light" data-palette="kurumsal">/.test(h), ad(f)); assert(!/prefers-color-scheme/.test(h), ad(f)); assert(h.includes('/site/assets/kabuk.js?v='), ad(f)); }
  assert(!/prefers-color-scheme: dark\) \{ :root/.test(oku(path.join(SITE, 'assets', 'site.css'))), 'tema işletim sisteminden okunmaz');
});
ok('ana sayfa aynı parçayı çalışırken çağırır', () => {
  const K = require('../../market/kabuk'); const m = oku(path.join(ROOT, 'market', 'market.js')); assert(m.includes('NB_KABUK.ust(') && m.includes('NB_KABUK.alt(')); assert(!m.includes('<header class="mk-nav">')); assert(oku(path.join(ROOT, 'index.html')).includes('market/kabuk.js'));
  const u = ustBlok(oku(path.join(SITE, 'fiyatlar', 'index.html'))); K.MENU.forEach(([, y]) => assert(u.includes(`>${y}</a>`), y));
  const sw = oku(path.join(ROOT, 'sw.js')); ['/market/kabuk.js', '/market/kabuk.css'].forEach((x) => assert(sw.includes(`'${x}'`), x));
});
ok('aktif menü sayfaya göre işaretlenir', () => {
  const aktif = (y) => (/<a href="([^"]*)" data-l="([a-z]+)" class="active"/.exec(oku(path.join(SITE, y, 'index.html'))) || [])[2];
  assert.strictEqual(aktif('fiyatlar'), 'fiyatlar'); assert.strictEqual(aktif('programlar'), 'urunler'); assert.strictEqual(aktif('marketprogrami'), 'urunler'); assert.strictEqual(aktif('paketler/oto-sanayi'), 'paketler'); assert.strictEqual(aktif('araclar/kdv-hesaplama'), 'araclar'); assert.strictEqual(aktif('rehber'), 'rehber');
});

console.log('Kart görselleri');
const G = require('../../site/tools/gorsel');
const liste = JSON.parse(oku(path.join(SITE, 'araclar', 'liste.json'))).araclar;
const svgVar = (t, a) => fs.existsSync(path.join(SITE, 'assets', 'gorsel', t, a + '.svg'));
ok(`${liste.length} aracın her birine ayrı sahne yazılmış`, () => { for (const x of liste) { assert(G.AR[x.slug], x.slug + ' sahnesi yok'); assert(svgVar('arac', x.slug), x.slug); } const D = oku(path.join(SITE, 'araclar', 'index.html')); for (const x of liste) assert(D.includes(`/site/assets/gorsel/arac/${x.slug}.svg`), x.slug + ' kartta görsel yok'); });
ok('programların, paketlerin, planların ve rehber yazılarının görseli var', () => {
  const P = require('../../site/src/products'); const paket = require('../cloud/paket'); P.forEach((x) => assert(svgVar('program', x.id), x.id)); paket.liste().forEach((x) => assert(svgVar('paket', x.id), x.id)); ['baslangic', 'pro', 'kurumsal', 'hepsi'].forEach((x) => assert(svgVar('plan', x), x));
  fs.readdirSync(path.join(SITE, 'src', 'rehber')).filter((f) => f.endsWith('.md')).forEach((f) => assert(svgVar('rehber', f.slice(0, -3)), f));
});
ok('görseller birbirinin aynı değil, üçüncü taraf bağlantısı ve betik yok', () => {
  for (const t of ['arac', 'program', 'paket', 'rehber']) { const d = path.join(SITE, 'assets', 'gorsel', t); const L = fs.readdirSync(d).map((f) => oku(path.join(d, f))); assert.strictEqual(new Set(L).size, L.length, t + ' içinde aynı görsel var'); L.forEach((s) => { assert(!/<script|<image|href=/.test(s)); assert(s.length < 12000, 'görsel büyük'); }); }
});
ok('her kart görselinde alt, width, height var; ilk ekran dışı tembel yüklenir', () => {
  for (const f of sayfalar) for (const m of oku(f).matchAll(/<img\b[^>]*gorsel\/[^>]*>/g)) { assert(/ alt="[^"]{6,}"/.test(m[0]), ad(f) + ' alt: ' + m[0]); assert(/ width="\d+" height="\d+"/.test(m[0]), ad(f)); assert(/loading="lazy"|fetchpriority=/.test(m[0]), ad(f)); }
});
