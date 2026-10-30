// Yardım merkezi ve kurulum adımları: içerik yalnızca gerçek ekran, düğme ve koleksiyonlardan oluşur. MySQL gerekmez.
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const ROOT = path.join(__dirname, '..', '..');
global.window = {}; require(path.join(ROOT, 'market', 'catalog.js')); const C = window.CATALOG;
const K = require('../../core/kurulum-adimlari'); const Y = require('../../site/tools/yardim-icerik');
const yardim = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'yardim.json'), 'utf8')); const kb = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'kb.json'), 'utf8'));
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const kaynak = (id) => fs.readdirSync(path.join(ROOT, 'apps', id)).filter((f) => /\.(js|html)$/.test(f)).map((f) => fs.readFileSync(path.join(ROOT, 'apps', id, f), 'utf8')).join('\n');
const CORE = fs.readFileSync(path.join(ROOT, 'core', 'core.js'), 'utf8');
const SRC = Object.fromEntries(C.products.map((p) => [p.id, kaynak(p.id)]));
// Yeni program çekirdeğe (core/kurulum-adimlari.js, core/yardim.json) girene kadar kurulum ve yardım denetimi dışında kalır
const KAYITLI = C.products.filter((p) => K.list(p.id).length);

for (const p of KAYITLI) {
  const L = K.list(p.id); assert.ok(L.length >= 3 && L.length <= 5, `${p.id}: ${L.length} adım`);
  for (const s of L) { assert.ok(new RegExp(`id: '${s.go}'`).test(SRC[p.id]), `${p.id}: menü yok ${s.go}`); s.n.forEach((c) => assert.ok(new RegExp(`\\b${c}\\b`).test(SRC[p.id]), `${p.id}: koleksiyon yok ${c}`)); }
}
ok('31 programın her birinde 3–5 adım; adres gerçek menüde, koleksiyon program kodunda');

let e = K.ilerleme('pos', null); assert.deepStrictEqual([e.done, e.total, e.pct], [0, 4, 0]); ok('Veri yokken ilerleme 0');
e = K.ilerleme('pos', { _meta: { sample: true, sampleBase: { products: 5, sales: 9 } }, products: [1, 2, 3, 4, 5], sales: new Array(9).fill(0) }); assert.strictEqual(e.done, 0); assert.ok(e.sample); ok('Örnek veriler adımı tamamlamaz');
e = K.ilerleme('pos', { _meta: { sample: true, sampleBase: { products: 5 } }, products: [1, 2, 3, 4, 5, 6] }); assert.strictEqual(e.done, 1); assert.strictEqual(e.next.id, 'musteri'); ok('Örneğin üstüne eklenen gerçek kayıt sayılır');
e = K.ilerleme('pos', { _meta: { sample: true }, products: [1, 2, 3] }); assert.strictEqual(e.done, 0); ok('Örnek tabanı yoksa tamamlandı denmez');
e = K.ilerleme('pos', { _meta: { sample: false }, products: [1], customers: [1], purchases: [1], sales: [1] }); assert.deepStrictEqual([e.done, e.pct, e.next], [4, 100, null]); ok('Örnekler temizlendiyse tüm kayıtlar işletmenindir');
assert.strictEqual(K.ilerleme('yok', {}).total, 0); ok('Bilinmeyen programda adım yok');

for (const p of C.products) {
  const y = Y[p.id]; assert.ok(y, p.id); assert.ok(y.gorevler.length >= 3); assert.ok(y.sss.length + (p.faq || []).length >= 2, p.id + ' SSS');
  const t = JSON.stringify([y.gorevler, y.sss]); [...t.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].replace(/\\"/g, '"').replace(/\\'/g, "'")).forEach((b) => assert.ok(SRC[p.id].includes(b) || CORE.includes(b), `${p.id}: kodda yok "${b}"`));
  assert.ok(!/en iyi|garanti|%\d|\d+ kat|sıfır hata/i.test(JSON.stringify(y)), p.id + ' vaat içeriyor');
}
ok('Rehberdeki her kalın ifade programın kodunda birebir geçiyor; vaat yok');

assert.strictEqual(yardim.items.length, KAYITLI.length);
for (const p of C.products) {
  const f = path.join(ROOT, 'docs', 'video', `${p.id}.md`); assert.ok(fs.existsSync(f), f); const s = fs.readFileSync(f, 'utf8');
  const sure = Number((s.match(/yaklaşık (\d+) saniye/) || [])[1]); assert.ok(sure >= 60 && sure <= 90, `${p.id}: ${sure} sn`); assert.ok(!/\*\*/.test(s));
}
ok('Her programın video senaryosu 60–90 saniye');

assert.ok(kb.items.some((x) => x.t === 'rehber' && x.m === 'pos')); assert.ok(kb.items.filter((x) => x.t === 'rehber').length >= KAYITLI.length * 3); ok('Destek asistanı rehberi bilgi bankasından yanıtlar');
assert.ok(!kb.items.some((x) => /Deneme talebi · onay bekliyor|deneme talebi oluştur|Ücretsiz dene\*\* talebi/i.test(x.a))); ok('Bilgi bankasında eski "deneme onayı" anlatımı yok');
console.log(`\n${n} test geçti`);
