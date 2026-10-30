// Mali müşavir takvimi: son gün kaydırma (VUK md. 18/4), e-Defter ve dönem kuralları
//   node server/test/musavir-kural.test.js
const assert = require('assert'); const path = require('path'); global.window = {}; require(path.join(__dirname, '../../apps/musavir/data.js')); const M = window.MSV; global.MSV = M;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
assert.strictEqual(M.shift('2026-10-31'), '2026-11-02'); ok('Cumartesi ilk iş gününe kayar');
assert.strictEqual(M.shift('2026-10-29'), '2026-10-30'); ok('Sabit resmî tatil atlanır');
assert.strictEqual(M.shift('2026-04-23'), '2026-04-24'); assert.strictEqual(M.shift('2026-01-01'), '2026-01-02'); ok('23 Nisan ve yılbaşı atlanır');
M.hol.add('2026-05-27'); assert.strictEqual(M.shift('2026-05-27'), '2026-05-28'); M.hol.clear(); ok('Ayarlardaki bayram günü atlanır');
assert.strictEqual(M.due('kdv', '2026-09', {}), '2026-10-28'); ok('KDV son günü');
assert.strictEqual(M.due('edefter', '2026-06', { type: 'ltd' }), '2026-10-14'); assert.strictEqual(M.due('edefter', '2026-06', { type: 'sahis' }), '2026-10-12'); ok('e-Defter beratı 14 / 10 ve hafta sonu kayması');
{ const c = { type: 'sahis', kdv: 'uc', staff: 0, defter: 'isletme' }; const L = M.forMonth(c, '2026-04'); assert.ok(L.some((x) => x.type === 'kdv3' && x.period === '2026-03')); assert.ok(!L.some((x) => x.type === 'kdv')); ok('3 aylık KDV yalnızca çeyrek ayında'); }
{ const L = M.forMonth({ type: 'ltd', kdv: 'yok', staff: 0, defter: 'bilanco' }, '2026-05'); assert.ok(L.some((x) => x.type === 'gecici' && x.period === '2026-04')); assert.ok(!L.some((x) => x.type === 'yillik')); ok('Geçici vergi mayısta, şirkete yıllık gelir vergisi yok'); }
console.log(`\n${n} test geçti`);
