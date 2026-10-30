// Site hesapları: gider paylaşımı (KMK md. 20), işletme projesi (md. 37), kurul yeter sayısı (md. 30, 31), toplantı tarihleri (md. 29, 30)
//   node server/test/site-kural.test.js
const assert = require('assert'); const path = require('path'); global.window = {}; global.NS = { pad: (n) => String(n).padStart(2, '0') };
require(path.join(__dirname, '../../apps/site/data.js')); const S = window.SITE; global.SITE = S;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const F = Array.from({ length: 10 }, (_, i) => ({ id: 'A' + (i + 1), share: i + 1, m2: 100, owner: 'M' + (i + 1) }));
const tot = (m) => Math.round(Object.values(m).reduce((a, b) => a + b, 0) * 100) / 100;

{ const m = S.split(F, 1000.01, 'arsa'); assert.strictEqual(tot(m), 1000.01); assert.ok(m.A10 > m.A1); const e = S.split(F, 100, 'esit'); assert.strictEqual(tot(e), 100); assert.strictEqual(e.A1, 10); ok('Paylaşım kuruş kaybetmez: arsa payı ve eşit'); }
assert.strictEqual(S.split([{ id: 'x', share: 0 }], 10, 'arsa'), null); ok('Arsa payı yoksa hesaplanmaz');
{ const p = S.planShares(F, { lines: [{ amount: 1200, mode: 'esit' }, { amount: 5500, mode: 'arsa' }] }); assert.strictEqual(p.A1.year, 220); assert.strictEqual(p.A1.month, 18.33); assert.strictEqual(Math.round(Object.values(p).reduce((t, x) => t + x.year, 0) * 100) / 100, 6700); ok('İşletme projesi yıllık pay ve aylık avans'); }
{ const a = {}; F.slice(5).forEach((f) => { a[f.id] = { mode: 'asil' }; }); const q = S.quorum(F, a); assert.strictEqual(q.ok, false); assert.strictEqual(q.ownersHere, 5); a.A1 = { mode: 'asil' }; assert.strictEqual(S.quorum(F, a).ok, true); ok('Yeter sayı: sayıca ve arsa payınca yarıdan fazla'); }
{ const a = {}; F.slice(0, 6).forEach((f) => { a[f.id] = { mode: 'asil' }; }); const q = S.quorum(F, a); assert.ok(q.share * 2 < q.shareT); assert.strictEqual(q.ok, false); ok('Sayıca çoğunluk yetmez, arsa payı da gerekir'); }
{ const G = F.map((f, i) => ({ ...f, owner: i < 5 ? 'Tek Malik' : f.owner })); const a = {}; G.forEach((f) => { a[f.id] = { mode: 'asil' }; }); const q = S.quorum(G, a); assert.deepStrictEqual(q.capped, ['Tek Malik']); assert.strictEqual(q.votes, 3 + 5); ok('Çok daireli malik üçte bir oyla sınırlı'); }
{ const a = {}; ['A1', 'A2', 'A3'].forEach((id) => { a[id] = { mode: 'vekil', proxy: 'Ali' }; }); const q = S.quorum(F, a); assert.deepStrictEqual(q.overProxy, ['Ali']); assert.strictEqual(q.pLimit, 2); a.A4 = { mode: 'vekil' }; assert.strictEqual(S.quorum(F, a).noProxy, true); ok('40 ve daha az bölümde vekil en çok 2 kişi'); }
{ const B = Array.from({ length: 100 }, (_, i) => ({ id: 'B' + i, share: 1, owner: 'M' + i })); assert.strictEqual(S.quorum(B, {}).pLimit, 5); ok('40 üzerinde vekâlet sınırı oyların %5i'); }
assert.ok(S.meetCheck({ type: 'olaganustu', noticeAt: '2026-01-01', date: '2026-01-10' }).length); assert.strictEqual(S.meetCheck({ type: 'olaganustu', noticeAt: '2026-01-01', date: '2026-01-16' }).length, 0); ok('Olağanüstü çağrı en az 15 gün önce');
assert.ok(S.meetCheck({ date: '2026-01-10', second: '2026-01-14' }).length); assert.ok(S.meetCheck({ date: '2026-01-10', second: '2026-01-27' }).length); assert.strictEqual(S.meetCheck({ date: '2026-01-10', second: '2026-01-20' }).length, 0); ok('İkinci toplantı 7–15 gün sonra');
{ const d = S.dueDate('2026-02', 31); assert.strictEqual(d.getDate(), 28); assert.strictEqual(d.getMonth(), 1); ok('Son ödeme günü kısa ayda ayın sonuna çekilir'); }
console.log(`\n${n} test geçti`);
