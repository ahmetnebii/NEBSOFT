// Kılavuz üreticisi: çizim, doğruluk denetimi, entegrasyon sınıflandırma, PDF okuma ve bağlantı kablolaması. Chrome ve MySQL gerekmez.
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const ROOT = path.join(__dirname, '..', '..'); const K = path.join(ROOT, 'scripts', 'kilavuz');
const { svg, yerlestir, okUcu, ekranBoyu } = require(path.join(K, 'cizim.js')); const D = require(path.join(K, 'denetim.js')); const O = require(path.join(K, 'ortak.js')); const { oku } = require(path.join(K, 'pdfoku.js')); const A = require(path.join(K, 'ayar.js'));
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

// Çizim
const M = [{ kutu: { x: 10, y: 10, w: 80, h: 30 }, tur: 'cerceve' }, { kutu: { x: 12, y: 12, w: 80, h: 30 }, tur: 'cerceve' }, { kutu: { x: 300, y: 200, w: 40, h: 24 }, tur: 'ok' }];
const Y = yerlestir(M, 400, 300);
Y.forEach((m) => { assert.ok(m.n.x >= 13 && m.n.x <= 387 && m.n.y >= 13 && m.n.y <= 287, 'işaret görüntüde kalır'); });
assert.ok(Math.hypot(Y[0].n.x - Y[1].n.x, Y[0].n.y - Y[1].n.y) >= 26, 'işaretler üst üste binmez'); ok('İşaretler görüntü içinde kalır, birbirinin üstüne binmez');
const u = okUcu({ x: 0, y: 212 }, M[2].kutu); assert.deepStrictEqual(u, { x: 300, y: 212 }); const s = svg(M.map((m, i) => ({ ...m, no: i + 4 })), 400, 300); assert.ok(s.includes('>4<') && s.includes('<polygon') && s.includes('viewBox="0 0 400 300"')); ok('Ok elementin kenarına iner, SVG numarayı taşır');

// Altta kalan işaret: kapalı kartlarla başlayan listede ilk Entegre et düğmesi 760 px altına düşer, üretim durmamalı
assert.strictEqual(ekranBoyu([{ y: 100, h: 40 }], 760), 760); assert.strictEqual(ekranBoyu([{ y: 100, h: 40 }, { y: 1250, h: 34 }], 760), 1332); assert.strictEqual(ekranBoyu([{ y: -200, h: 40 }, { y: 700, h: 40 }], 760), 988); assert.strictEqual(ekranBoyu([{ y: 9000, h: 40 }], 760), 2400); assert.strictEqual(ekranBoyu([], 760), 760); ok('Pencere işaretlere göre uzar, sığıyorsa değişmez, sınırı aşmaz');

// Doğruluk denetimi
const KK = { ne: 'Deneme **Yok Böyle Düğme** ile', moduller: [{ id: 'a', ne: '**Var**', alanlar: [['Olmayan alan', 'x']] }] };
assert.strictEqual(D.adlar(KK, 'Var', 'kod').length, 2); assert.strictEqual(D.adlar({ moduller: [{ id: 'a', ne: '**Var**' }] }, 'Var', '').length, 0); ok('Ekranda ve kodda olmayan ad yakalanır');
assert.strictEqual(D.vaat({ moduller: [{ ne: 'Sektörün en iyi programı' }] }).length, 1); assert.strictEqual(D.vaat({ moduller: [{ ne: 'Satışlarınız 3 kat artar' }] }).length, 1); assert.strictEqual(D.vaat({ moduller: [{ ne: '**Şartlar / garanti metni** alanı' }] }).length, 0); ok('Vaat cümlesi yakalanır, ekran adı karışmaz');
assert.deepStrictEqual(D.kapsam({ moduller: [{ id: 'a' }, { id: 'z' }] }, [['a', 'A'], ['b', 'B']]).length, 2); ok('Atlanan menü ve fazla modül yakalanır');
assert.strictEqual(D.entegrasyonKapsam({ entegrasyon: { sms: { degisir: [] } } }, ['sms', 'backup']).length, 2); ok('Etkisi yazılmayan entegrasyon yakalanır');
assert.strictEqual(D.kisiVerisi('no 10000000146 son').length, 1); ok('Kimlik numarası biçimi yakalanır');

// Entegrasyon sınıfları: doğrulanmamış olan canlıda "kullanılabilir" yazılamaz
const e = { kilit: false }; const d = (x, p) => O.durum(x, p)[0];
assert.strictEqual(d({ kilit: true }, { value: 'ingenico', g: { status: 'dogrulandi' } }), 'no'); assert.strictEqual(d(e, { value: 'amazon' }), 'no'); assert.strictEqual(d(e, { value: 'x', g: { status: 'yakinda' } }), 'no'); assert.strictEqual(d(e, { value: 'x', g: { status: 'dogrulandi' } }), 'ok'); assert.strictEqual(d(e, { value: 'x', g: { status: 'erisim' } }), 'no'); assert.strictEqual(d(e, { value: 'x', g: { status: 'erisim', testVar: true } }), 'ok'); assert.strictEqual(d(e, { value: 'sim' }), 'ki');
assert.strictEqual(O.durum(e, { value: 'x', g: { status: 'dogrulandi' } }, { kapali: { x: 'neden' } })[0], 'no'); assert.ok(O.durum({ kilit: true }, { value: 'y' })[1].includes('NEBSOFT ile iletişime geçerek'));
assert.strictEqual(D.vaat({ moduller: [{ ne: 'Bu bağlantı henüz kullanılamıyor' }] }).length, 1); assert.strictEqual(D.vaat({ moduller: [{ ne: 'Bu entegrasyon kesin çalışır' }] }).length, 1);
ok('Kapalı sağlayıcı "NEBSOFT ile iletişime geçerek açtırılır" yazılır, eski ifade ve kesinlik iddiası yakalanır');

// PDF okuma: içindekiler sayfa numarası buradan gelir
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R/Dests 5 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R>>\nendobj\n4 0 obj\n<</Type/Page/Parent 2 0 R>>\nendobj\n5 0 obj\n<</Names[(m-a)[3 0 R/XYZ 0 0 0](m-b)[4 0 R/XYZ 0 0 0]]>>\nendobj\n');
const p = oku(pdf); assert.strictEqual(p.sayfa, 2); assert.deepStrictEqual([p.hedef['m-a'], p.hedef['m-b']], [1, 2]); ok('PDF sayfa sayısı ve hedefleri okunur');

// İçerik dosyaları
const dosya = fs.readdirSync(A.KAYNAK).filter((f) => /^[a-z]+\.js$/.test(f)); assert.ok(dosya.length >= 3);
global.window = {}; require(path.join(ROOT, 'market', 'catalog.js')); const C = window.CATALOG;
for (const f of dosya) { const id = f.slice(0, -3); const I = require(path.join(A.KAYNAK, f))(O); assert.ok(C.products.some((x) => x.id === id), id); assert.ok(I.ne && I.kimler && I.yazdirma && I.entegrasyon, id); assert.strictEqual(D.vaat(I).length, 0, id); I.moduller.forEach((m) => assert.ok(m.ne, `${id}/${m.id}`)); }
ok(`${dosya.length} kılavuz içeriği eksiksiz ve vaatsiz`);

// Kablolama: PDF herkese açık, noindex, kaydı olmayan programda bağlantı yok
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8'); const DENY = eval(server.match(/const DENY = (\/.+\/i);/)[1]); // eslint-disable-line no-eval
assert.ok(!DENY.test('/indir/kilavuz/pos.pdf')); assert.ok(DENY.test('/docs/kilavuz/pos.js') && DENY.test('/scripts/kilavuz/uret.js')); assert.ok(server.includes("'X-Robots-Tag': 'noindex'") && server.includes("'.pdf': 'application/pdf'")); assert.ok(!/Disallow:\s*\/indir/.test(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8'))); ok('PDF adresi açık, kaynak kapalı, noindex robots ile engellenmiyor');
assert.ok(fs.readFileSync(path.join(ROOT, 'scripts', 'hosting-paketi.js'), 'utf8').includes("'indir/kilavuz'")); assert.ok(/^indir\//m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8'))); assert.ok(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes("startsWith('/indir/')")); ok('PDF depoya girmez, hosting paketine girer, service worker dokunmaz');
const L = JSON.parse(fs.readFileSync(A.LISTE, 'utf8')); const PR = require(path.join(ROOT, 'site', 'src', 'products.js'));
for (const q of PR) { const h = path.join(ROOT, 'site', q.slug, 'index.html'); if (!fs.existsSync(h)) continue; assert.strictEqual(fs.readFileSync(h, 'utf8').includes(`/indir/kilavuz/${q.id}.pdf`), !!L[q.id], `${q.id}: bağlantı listeyle uyuşmuyor`); }
ok('Tanıtım sayfasındaki bağlantı core/kilavuz.json ile uyuşuyor');
console.log(`\nKılavuz testi tamam: ${n} kontrol`);
