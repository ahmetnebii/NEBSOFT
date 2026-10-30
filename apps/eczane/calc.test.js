// Eczane hesapları: katılım payı (RG 33124), toplam tutarlılığı, muadil, karekod, FEFO
//   node apps/eczane/calc.test.js
const assert = require('assert'); const E = require('./calc.js');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const S = { patientPct: 20, retiredPct: 10, rxFee: 3.76, rxFeeExtra: 1.25 };
const I = (o) => ({ price: 100, qty: 1, sgk: true, diff: 0, form: 'Tablet', ...o });
const rec = (items, o = {}) => E.calc({ mode: 'recete', inst: 'sgk', items, ...o }, S);

{ const c = rec([I({ qty: 3 })]); assert.strictEqual(c.rxFee, 3.76); assert.strictEqual(rec([I({ qty: 4 })]).rxFee, 5.01); assert.strictEqual(rec([I({ qty: 6 })]).rxFee, 7.51); ok('Reçete katılımı: 3 kutuya kadar 3,76 ₺, ilave kutu 1,25 ₺'); }
{ assert.strictEqual(rec([I({ qty: 5, form: 'Enjeksiyon' })]).rxFee, 3.76); assert.strictEqual(E.boxes([I({ qty: 5, form: 'Enjeksiyon' }), I({ qty: 2 })]), 3); ok('Enjektabl kalem başına 1 kutu'); }
{ const c = rec([I({ exempt: true, qty: 2 })]); assert.strictEqual(c.rxFee, 0); assert.strictEqual(c.patientPay, 0); assert.strictEqual(c.instPay, 200); const d = rec([I({ exempt: true, qty: 9 }), I()]); assert.strictEqual(d.rxFee, 3.76); ok('EK-4/D muaf ilaç: katılım yok, kutu hesabına girmez'); }
{ const c = rec([I()]); assert.strictEqual(c.patientPay, 23.76); assert.strictEqual(c.instPay, 80); assert.strictEqual(c.total, 103.76); const r = rec([I()], { retired: true }); assert.strictEqual(r.patientPay, 13.76); ok('Katılım payı %20, gelir/aylık alan %10'); }
{ const c = rec([I({ diff: 15, qty: 2 })]); assert.strictEqual(c.diffPay, 30); assert.strictEqual(c.total, 233.76); assert.strictEqual(c.patientPay, 73.76); assert.strictEqual(c.instPay, 160); assert.strictEqual(r2sum(c), c.total); ok('Eşdeğer fark toplama girer: hasta + kurum = toplam'); }
function r2sum(c) { return Math.round((c.patientPay + c.instPay) * 100) / 100; }
{ for (let k = 0; k < 500; k++) { const items = Array.from({ length: 1 + k % 4 }, (_, i) => I({ price: 33.33 + k * 0.17 + i, qty: 1 + (k + i) % 3, diff: (k % 5) * 1.11, sgk: (k + i) % 3 > 0 })); const c = rec(items, { retired: k % 2 === 0 }); assert.strictEqual(r2sum(c), c.total); } ok('500 karışık reçetede kuruş kaymaz'); }
{ const c = E.calc({ mode: 'elden', inst: 'sgk', items: [I({ rx: 'yok', diff: 9 })] }, S); assert.deepStrictEqual([c.total, c.patientPay, c.instPay, c.rxFee], [100, 100, 0, 0]); const z = E.calc({ mode: 'recete', inst: 'ozel', items: [I()] }, S); assert.deepStrictEqual([z.patientPay, z.instPay], [10, 90]); const y = E.calc({ mode: 'recete', inst: 'ozel', items: [I()] }, { ...S, privatePct: 25 }); assert.strictEqual(y.patientPay, 25); const u = E.calc({ mode: 'recete', inst: 'ucretli', items: [I()] }, S); assert.deepStrictEqual([u.patientPay, u.instPay], [100, 0]); ok('Elden, özel sigorta (ayarlı oran), ücretli'); }
{ const d = (id, name, active = 'Atorvastatin', form = 'Tablet') => ({ id, name, active, form }); const a = d('1', 'Kolestat 20 mg 28 tablet');
  assert.ok(E.sameDrug(a, d('2', 'Lipitor 20 mg 28 tablet'))); assert.ok(!E.sameDrug(a, d('3', 'Atorlip 40 mg 28 tablet'))); assert.ok(!E.sameDrug(a, d('4', 'Atorvastatin şurup 20 mg', 'Atorvastatin', 'Şurup'))); assert.ok(!E.sameDrug(d('5', 'Maske', '-'), d('6', 'Maske 2', '-'))); assert.ok(!E.sameDrug(d('7', 'Ürün'), d('8', 'Ürün 2'))); assert.strictEqual(E.strengthOf({ name: 'Alprax 0,5 mg 50 tablet' }), '0.5mg'); ok('Muadil: farklı doz, form ve doz bilgisi olmayan önerilmez'); }
{ const G = '\u001d'; const a = E.parseCode(`0108699500000013211234567890ABCDE${G}17281231${'10'}L123`.replace('17281231', '17281231')); assert.strictEqual(a.gtin, '08699500000013'); assert.strictEqual(a.sn, '1234567890ABCDE'); assert.strictEqual(a.exp, '2028-12-31'); assert.strictEqual(a.lot, 'L123');
  const b = E.parseCode('(01)08699500000013(21)SN1(17)280200(10)L9'); assert.strictEqual(b.exp, '2028-02-29'); assert.strictEqual(b.sn, 'SN1'); assert.strictEqual(b.lot, 'L9');
  const c = E.parseCode('010869950000001321ABC1728123110L77'); assert.strictEqual(c.sn, 'ABC'); assert.strictEqual(c.exp, '2028-12-31'); assert.strictEqual(c.lot, 'L77');
  assert.strictEqual(E.parseCode('8699500000013'), null); assert.strictEqual(E.parseCode(''), null); assert.ok(E.gtinMatch('8699500000013', '08699500000013')); assert.ok(!E.gtinMatch('', '08699500000013')); ok('Karekod: GS ile, parantezli, GS\'siz; ay sonu; düz barkod karekod sayılmaz'); }
{ const L = [{ id: 'a', lot: 'A', skt: '2027-06-01', qty: 2 }, { id: 'b', lot: 'B', skt: '2027-01-01', qty: 1 }, { id: 'c', lot: 'C', skt: '2026-01-01', qty: 9 }, { id: 'd', lot: 'D', skt: '2028-01-01', qty: 5 }];
  assert.deepStrictEqual(E.takeLots(L, 2, '2026-10-30').taken, [{ id: 'b', qty: 1 }, { id: 'a', qty: 1 }]); assert.deepStrictEqual(E.takeLots(L, 1, '2026-10-30', 'D').taken, [{ id: 'd', qty: 1 }]); assert.strictEqual(E.takeLots(L, 20, '2026-10-30').short, 12); ok('FEFO, okutulan parti önceliği; SKT geçmiş parti satılmaz; eksik görünür'); }
{ assert.ok(E.tcOk('10000000146')); assert.ok(!E.tcOk('10000000145')); ok('TC denetimi'); }
console.log(`\n${n} test geçti`);
