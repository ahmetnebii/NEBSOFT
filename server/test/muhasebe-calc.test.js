// Ön Muhasebe tutar kuralı ile e-Fatura (UBL-TR) toplamları kuruşu kuruşuna aynı olmalı
//   node server/test/muhasebe-calc.test.js
const assert = require('assert'); const C = require('../../apps/muhasebe/calc'); const U = require('../../core/ubltr');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const A = { district: 'Çankaya', city: 'Ankara' };
const seller = { id: '1234567801', name: 'S', ...A }, buyer = { id: '9876543210', name: 'B', ...A };
// Önceki sürümde kuruş farkı çıkan gerçek örnekler (program 893,55 · e-Fatura 893,54 vb.)
const known = [[[5, 38.74, 7.5, 20], [7, 98.25, 12, 1], [1, 56.06, 0, 20]], [[5, 26.88, 12, 20], [6, 43.49, 0, 10], [3, 26.53, 5, 1]], [[3, 83.74, 7.5, 20], [6, 1.95, 12, 10], [5, 40.43, 5, 20]]];
const toLines = (a) => a.map(([qty, price, disc, vat]) => ({ name: 'x', qty, price, disc, vat }));
const same = (lines) => { const a = C.totals({ lines }); const u = U.build({ id: 'NEB2026000000001', seller, buyer, lines }).totals; return [a.net === u.net && a.vat === u.vat && a.total === u.gross, a, u]; };
known.forEach((k) => { const [eq, a, u] = same(toLines(k)); assert.ok(eq, `program ${a.total} · e-Fatura ${u.gross}`); });
ok('Daha önce kuruş farkı çıkan 3 fatura artık e-Fatura ile aynı');
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 20000; i++) {
  const lines = Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => ({ name: 'x', qty: [1, 2, 3, 0.5, 1.25, 7, 12][Math.floor(rnd() * 7)], price: Math.round(rnd() * 999999) / 100, disc: [0, 0, 5, 7.5, 12, 33.33][Math.floor(rnd() * 6)], vat: [1, 10, 20][Math.floor(rnd() * 3)] }));
  const [eq, a, u] = same(lines); assert.ok(eq, `fark: ${JSON.stringify(lines)} program ${a.total} e-Fatura ${u.gross}`);
}
ok('20.000 rastgele faturada program toplamı = e-Fatura toplamı (matrah, KDV, genel toplam)');
const t = C.totals({ rate: 2, lines: [{ qty: 1, price: 1000, vat: 20, wht: 5 }] });
assert.deepStrictEqual([t.net, t.vat, t.wht, t.total, t.payable, t.tl], [1000, 200, 100, 1200, 1100, 2200]); ok('Tevkifat 5/10: KDV 200 → alıcı 100 öder; cariye 1.100 (×kur) işlenir');
console.log(`\n${n} test geçti`);
