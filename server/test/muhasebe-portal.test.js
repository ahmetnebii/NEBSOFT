// Ön Muhasebe cari portalı: ekstre hesabı ve bulut kuralı (yalnızca kendi kayıtları, yalnızca mutabakat cevabı)
//   node server/test/muhasebe-portal.test.js
const assert = require('assert'); const C = require('../../apps/muhasebe/calc'); const R = require('../cloud/public-rules').muhasebe;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const doc = {
  caris: [{ id: 'c1', name: 'A', taxNo: '1234567890', portalCode: 'K7P2QX', opening: 100, riskLimit: 5000, note: 'iç not' }, { id: 'c2', name: 'B', taxNo: '9999999999', portalCode: 'ZZZZZZ' }, { id: 'c3', name: 'Kodsuz', taxNo: '5555555555' }],
  invoices: [{ id: 'f1', cari: 'c1', kind: 'satis', no: 'SF1', date: '2026-01-10', lines: [{ qty: 2, price: 500, vat: 20 }], createdBy: 'Serap' }, { id: 'f2', cari: 'c1', kind: 'alis', iade: { of: 'x' }, no: 'SIF1', date: '2026-01-12', lines: [{ qty: 1, price: 100, vat: 20 }] }, { id: 'f3', cari: 'c2', kind: 'satis', no: 'SF2', date: '2026-01-11', lines: [{ qty: 1, price: 9, vat: 20 }] }],
  txns: [{ id: 't1', cari: 'c1', type: 'tahsilat', account: 'a2', amount: 600, date: '2026-01-15', invoice: 'f1' }, { id: 't2', cari: 'c2', type: 'tahsilat', account: 'a2', amount: 5, date: '2026-01-15' }, { id: 't3', type: 'gider', account: 'a2', amount: 900, date: '2026-01-15', cat: 'Kira' }],
  recons: [{ id: 'r1', cari: 'c1', asOf: '2026-01-31', balance: 380, status: 'bekliyor' }, { id: 'r2', cari: 'c2', asOf: '2026-01-31', balance: 5.8, status: 'bekliyor' }],
};
const x = (ident, q) => { const col = (k) => doc[k] || []; return { doc, ident, q: q || {}, col, get: (k, id) => col(k).find((r) => r.id === id) }; };
// Ekstre: açılış 100 + satış 1.200 − iade 120 − tahsilat 600 = 580
const st = C.statement(doc.caris[0], doc.invoices, doc.txns, () => 'Banka');
assert.strictEqual(st.balance, 580); assert.deepStrictEqual(st.rows.map((r) => r.bal), [100, 1300, 1180, 580]); assert.ok(st.rows[3].desc.includes('Banka')); ok('Ekstre: açılış + satış − iade − tahsilat, yürüyen bakiye doğru');
assert.strictEqual(R.login(x(null), { vkn: '1234567890', code: 'k7p2qx' }).i, 'c1'); ok('Giriş: VKN + kod (büyük / küçük harf fark etmez)');
assert.strictEqual(R.login(x(null), { vkn: '1234567890', code: 'ZZZZZZ' }), null); assert.ok(!R.login(x(null), { vkn: '5555555555', code: '555555' })); assert.ok(!R.login(x(null), { vkn: '1234567890', code: '' })); ok('Giriş: başka carinin kodu, kodu üretilmemiş cari ve boş kod reddedilir');
const v = R.view(x({ k: 'c', i: 'c1' }));
assert.deepStrictEqual(v.invoices.map((i) => i.id), ['f1', 'f2']); assert.deepStrictEqual(v.txns.map((t) => t.id), ['t1']); assert.deepStrictEqual(v.recons.map((r) => r.id), ['r1']);
assert.ok(!('portalCode' in v.caris[0]) && !('note' in v.caris[0]) && !('riskLimit' in v.caris[0]) && !('createdBy' in v.invoices[0]) && !('account' in v.txns[0])); ok('Görünüm: yalnızca kendi fatura / ödeme / mutabakatı; kod, iç not, risk limiti, hesap bilgisi gitmez');
assert.deepStrictEqual(R.view(x(null)), {}); ok('Girişsiz görünüm boş');
const up = R.write.recons.upd; const me = x({ k: 'c', i: 'c1' });
const p = up(doc.recons[0], { status: 'onay', name: 'Ali Veli' }, me); assert.strictEqual(p.status, 'onay'); assert.ok(p.answered); ok('Mutabakat: kendi bekleyen isteğine onay verebilir, cevap zamanını sunucu yazar');
assert.throws(() => up(doc.recons[1], { status: 'onay' }, me)); ok('Başka carinin mutabakatı değiştirilemez');
assert.throws(() => up(doc.recons[0], { balance: 0 }, me)); assert.throws(() => up(doc.recons[0], { status: 'bekliyor' }, me)); assert.throws(() => up({ ...doc.recons[0], status: 'onay' }, { status: 'itiraz' }, me)); ok('Bakiye değiştirilemez, geçersiz durum ve cevaplanmış istek reddedilir');
assert.ok(!R.write.invoices && !R.write.txns && !R.write.caris); ok('Fatura, ödeme ve cari kaydına yazma izni yok');
console.log(`\n${n} test geçti`);
