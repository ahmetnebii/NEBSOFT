// Eczane bulut kuralı: reçete gönderme, takip kodu, sağlık verisi yalnızca telefon + kodla
//   node server/test/eczane-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').eczane;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const today = '2026-10-30';
const mk = (orders = []) => { const doc = { rxOrders: orders, drugs: [], lots: [] }; const col = (k) => (doc[k] = doc[k] || []); return (ident) => ({ doc, ident: ident || null, q: {}, today, col, get: (k, id) => col(k).find((r) => r.id === id) }); };
const O = (o) => ({ id: 'r1', code: 'RABC123', rxNo: 'AB12CD', name: 'Ayşe', phone: '0532 111 22 33', status: 'yeni', ...o });
const ins = R.write.rxOrders.ins; const V = { rxNo: 'ab 12 cd', name: 'Ayşe', phone: '05321112233', pickup: 'Bugün' };

{ const r = ins(V, mk()()); assert.strictEqual(r.rxNo, 'AB12CD'); assert.strictEqual(r.status, 'yeni'); ok('Reçete alınır, durum sunucuda belirlenir'); assert.strictEqual(ins({ ...V, status: 'teslim', code: 'X' }, mk()()).status, 'yeni'); ok('Durum ve kod gönderilemez');
  const a = new Set(Array.from({ length: 300 }, () => ins(V, mk()()).code)); assert.strictEqual(a.size, 300); [...a].forEach((c) => assert.ok(/^R[A-HJ-NP-Z2-9]{6}$/.test(c))); ok('Takip kodu rxCode: 6 rastgele karakter, tahmin edilemez'); }
{ assert.throws(() => ins({ ...V, rxNo: '12' }, mk()()), /6-10/); assert.throws(() => ins({ ...V, rxNo: 'ABCD*12' }, mk()()), /6-10/); assert.throws(() => ins({ ...V, phone: '123' }, mk()())); ok('Geçersiz reçete no ve telefon reddedilir');
  assert.throws(() => ins(V, mk(Array.from({ length: 5 }, (_, i) => O({ id: 'x' + i })))()), /fazla/); ok('Aynı numaradan yığma engellenir'); }
{ const x = mk([O(), O({ id: 'r2', code: 'RZZZ999', phone: '0533 999 88 77' })])(); assert.deepStrictEqual(R.login(x, { phone: '05321112233', code: 'rabc123' }), { k: 'p', i: '5321112233' }); assert.strictEqual(R.login(x, { phone: '05321112233', code: 'RZZZ999' }), null); assert.strictEqual(R.login(x, { phone: '05321112233' }), null); ok('Takip: telefon + kod birlikte; başkasının kodu geçmez'); }
{ const f = mk([O(), O({ id: 'r2', phone: '0533 999 88 77' })]); assert.deepStrictEqual(R.view(f()), { rxOrders: [] }); const v = R.view(f({ k: 'p', i: '5321112233' })); assert.strictEqual(v.rxOrders.length, 1); assert.strictEqual(v.rxOrders[0].id, 'r1'); ok('Girişsiz kimse reçete görmez; yalnızca kendi reçetesi'); }
{ const x = mk([O({ id: 'r1' }), O({ id: 'r2', code: 'RZZZ999' })]); const g = R.grant(x(), [['rxOrders', O({ id: 'r1' })]]); assert.deepStrictEqual(g, { k: 'r', i: 'r1' }); const v = R.view(x(g)); assert.deepStrictEqual(v.rxOrders.map((o) => o.id), ['r1']); ok('Gönderen tarayıcı yalnızca kendi kaydını görür: aynı telefonun öteki reçetesi gelmez'); }
{ assert.strictEqual(R.pub.patients, undefined); assert.strictEqual(R.pub.sales, undefined); assert.strictEqual(R.pub.ctrl, undefined); assert.ok(!R.pub.lots.fields.includes('cost')); assert.ok(!R.pub.drugs.fields.includes('diff')); assert.deepStrictEqual(Object.keys(R.write), ['rxOrders']); ok('Hasta, satış, defter ve maliyet dışarı çıkmaz; yazma yalnızca reçete talebi'); }
console.log(`\n${n} test geçti`);
