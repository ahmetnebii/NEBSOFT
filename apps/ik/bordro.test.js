// İK hesapları: yıllık izin (4857 md. 53), izin bakiyesi, kıdem ve ihbar (1475 md. 14, 4857 md. 17), TC ve IBAN denetimi
//   node apps/ik/bordro.test.js
const assert = require('assert'); const B = require('./bordro.js');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const P = { ...B.DEFAULTS };

{ assert.strictEqual(B.fullYears('2025-03-10', '2026-03-09'), 0); assert.strictEqual(B.fullYears('2025-03-10', '2026-03-10'), 1); assert.strictEqual(B.fullYears('2020-02-29', '2024-02-28'), 3); assert.strictEqual(B.fullYears('2020-02-29', '2024-02-29'), 4); ok('Tam yıl takvimle sayılır; yıldönümü günü dolmuş sayılır'); }
{ const e = (start, o = {}) => ({ start, ...o }); const at = '2026-06-01';
  assert.strictEqual(B.entitlementAt(e('2025-06-02'), at), 0); assert.strictEqual(B.entitlementAt(e('2025-06-01'), at), 14);
  assert.strictEqual(B.entitlementAt(e('2021-06-01'), at), 14); assert.strictEqual(B.entitlementAt(e('2020-06-01'), at), 20); assert.strictEqual(B.entitlementAt(e('2011-06-02'), at), 20); assert.strictEqual(B.entitlementAt(e('2011-06-01'), at), 26);
  assert.strictEqual(B.entitlementAt(e('2024-06-01', { birth: '1970-01-01' }), at), 20); assert.strictEqual(B.entitlementAt(e('2024-06-01', { birth: '2008-01-01' }), at), 20); assert.strictEqual(B.entitlementAt(e('2020-06-01', { underground: true }), at), 24); assert.strictEqual(B.entitlementAt(e('2024-06-01', { leaveExtra: 3 }), at), 17); ok('md. 53: 14/20/26 gün, yaş alt sınırı, yer altı, sözleşme eki'); }
{ const e = { start: '2020-01-10', leaveCarry: 2 };
  const a = B.leaveBalance(e, { asOf: '2026-02-01', used: 5, trackFrom: '2025-06-01' }); assert.strictEqual(a.earned, 20); assert.strictEqual(a.left, 17); ok('Takipten önceki yıllar sayılmaz: son yıldönümü + devir − kullanılan');
  const b = B.leaveBalance(e, { asOf: '2027-02-01', used: 5, trackFrom: '2025-06-01' }); assert.strictEqual(b.earned, 40); assert.strictEqual(b.left, 37); ok('Kullanılmayan izin yanmaz: yeni hak üstüne eklenir');
  assert.strictEqual(B.leaveBalance({ ...e, end: '2026-02-01' }, { asOf: '2030-01-01', used: 0, trackFrom: '2025-06-01' }).earned, 20); ok('Ayrılan çalışanda hak çıkış tarihinde durur'); }
{ const s = (start, end, o = {}) => B.severance(P, { start, end, gross: 40000, notice: true, cum: 0, ...o });
  assert.strictEqual(s('2025-03-10', '2026-03-09').kidem, 0); assert.strictEqual(s('2025-03-10', '2026-03-10').kidem, 40000); ok('Tam 1. yıl gününde kıdem doğar (eski hesap 0 veriyordu)');
  assert.ok(Math.abs(s('2024-03-10', '2026-09-08').kidem - 40000 * (2 + 182 / 365)) < 0.01); ok('Artan süre orantılı');
  assert.strictEqual(s('2026-01-01', '2026-06-30').weeks, 2); assert.strictEqual(s('2026-01-01', '2026-07-01').weeks, 4); assert.strictEqual(s('2025-01-01', '2026-07-01').weeks, 6); assert.strictEqual(s('2023-01-02', '2026-01-01').weeks, 6); assert.strictEqual(s('2023-01-01', '2026-01-01').weeks, 8); ok('md. 17 ihbar süreleri sınır günlerinde doğru');
  assert.strictEqual(s('2020-01-01', '2026-01-01', { gross: 100000 }).kidemBase, B.DEFAULTS.severanceCap); ok('Kıdem tavanı uygulanır'); }
{ const pm = { ...P }; const a = B.month(pm, { gross: 33030, days: 30, month: 1 }); assert.strictEqual(a.incomeTax, 0); assert.strictEqual(a.stamp, 0); assert.strictEqual(a.sgk, 4624.2); assert.strictEqual(a.unemp, 330.3); assert.strictEqual(a.net, 28075.5); ok('Asgari ücret neti 28.075,50 ₺ (vergi istisnalı)');
  const g = B.grossFromNet(pm, 30000, { cum: 0, month: 1 }); assert.ok(Math.abs(B.month(pm, { gross: g, days: 30, month: 1 }).net - 30000) < 0.02); ok('Netten brüt: hedef nete döner'); }
{ assert.ok(B.tcOk('10000000146')); assert.ok(!B.tcOk('10000000147')); assert.ok(!B.tcOk('01234567890')); assert.ok(!B.tcOk('123')); ok('TC kimlik kontrol haneleri');
  assert.ok(B.ibanOk('TR33 0006 1005 1978 6457 8413 26')); assert.ok(!B.ibanOk('TR34 0006 1005 1978 6457 8413 26')); assert.ok(!B.ibanOk('DE89370400440532013000')); ok('IBAN mod 97'); }
console.log(`\n${n} test geçti`);
