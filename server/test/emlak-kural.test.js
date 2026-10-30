// Emlak: hizmet bedeli (Taşınmaz Ticareti Hakkında Yönetmelik md. 14, 20), kira (TBK md. 342, 344, 347) ve herkese açık veri kuralı
//   node server/test/emlak-kural.test.js
const assert = require('assert'); const path = require('path'); global.window = {}; global.NS = {};
require(path.join(__dirname, '../../apps/emlak/data.js')); const E = window.EMLAK; const R = require('../cloud/public-rules').emlak;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

// ---------- Hizmet bedeli ----------
assert.strictEqual(E.fee({ kind: 'satis', price: 1000000, pct: 2 }), 40000); assert.strictEqual(E.fee({ kind: 'satis', price: 1000000, pct: 2, sides: 1 }), 20000); assert.strictEqual(E.fee({ kind: 'kira', price: 20000, pct: 100 }), 20000); assert.strictEqual(E.fee({ kind: 'satis', price: 333333.33, pct: 1.5 }), 10000); assert.strictEqual(E.fee({ fee: 123.45, kind: 'satis', price: 9, pct: 9 }), 123.45);
ok('Hizmet bedeli kuruşa yuvarlanır; eski kayıtta iki taraf sayılır; kayıtlı tutar korunur');
assert.strictEqual(E.feeCheck('satis', 2, 2), ''); assert.ok(/md\. 20\/1/.test(E.feeCheck('satis', 2.01, 2))); assert.strictEqual(E.feeCheck('satis', 4, 1), ''); assert.ok(E.feeCheck('satis', 4.5, 1)); assert.strictEqual(E.feeCheck('kira', 100), ''); assert.ok(/md\. 20\/2/.test(E.feeCheck('kira', 100.5))); assert.ok(E.feeCheck('kira', -1)); assert.ok(E.feeCheck('satis', 'x'));
ok('Satışta toplam %4, kirada bir aylık tavan aşılamaz (md. 20/1-2)');
{ const full = { authNo: 'S1', authEnd: '2026-12-01', eidsEnd: '2026-12-01', city: 'İzmir', district: 'Konak', nb: 'Alsancak', ada: '1', parsel: '2' }; const s = { yetkiNo: '3500123' };
  assert.deepStrictEqual(E.compliance(full, s, '2026-10-30'), []); assert.ok(E.compliance(full, {}, '2026-10-30').some((x) => /yetki belgesi/.test(x))); assert.ok(E.compliance({ ...full, authEnd: '2026-01-01' }, s, '2026-10-30').some((x) => /süresi dolmuş/.test(x))); assert.ok(E.compliance({ ...full, eidsEnd: '' }, s, '2026-10-30').some((x) => /EİDS/.test(x))); assert.ok(E.compliance({ ...full, parsel: '' }, s, '2026-10-30').some((x) => /parsel/.test(x)));
  ok('İlan uygunluğu: yetki belgesi işletmenin, sözleşme ve EİDS ilanın; ada-parsel zorunlu (md. 14/2-i)'); }
assert.deepStrictEqual(E.photos({ id: 'x', cat: 'Daire' }), [E.NOPHOTO]); assert.notStrictEqual(E.photos({ id: 'x', cat: 'Daire', sample: true })[0], E.NOPHOTO); assert.deepStrictEqual(E.photos({ id: 'x', sample: true, photoList: 'https://a.b/c.jpg' }), ['https://a.b/c.jpg']); assert.ok(/^data:/.test(E.imgUrl(E.NOPHOTO)));
assert.deepStrictEqual(E.near({ id: 'x' }), []); assert.deepStrictEqual(E.near({ nearText: 'Metro: 400 m\nYanlış satır\nOkul:1 km' }), [['Metro', '400 m'], ['Okul', '1 km']]);
ok('Gerçek ilanda temsilî fotoğraf ve uydurma yakınlık gösterilmez');

// ---------- Kira ----------
assert.strictEqual(E.depositCheck(60000, 20000), ''); assert.ok(/md\. 342/.test(E.depositCheck(60001, 20000))); ok('Güvence üç aylık kirayı aşamaz (TBK md. 342)');
{ const l = { start: '2026-01-15', payDay: 31, rent: 1000, rentHist: [{ from: '2026-01', amount: 1000 }, { from: '2026-03', amount: 1300.5 }], payments: [{ period: '2026-01', paid: true }, { period: '2026-02', paid: true, amount: 400 }, { period: '2026-02', paid: true, amount: 100.5 }, { period: '2026-03', paid: false }] };
  assert.strictEqual(E.rentAt(l, '2026-02'), 1000); assert.strictEqual(E.rentAt(l, '2026-03'), 1300.5); const g = E.ledger(l, '2026-03-30');
  assert.deepStrictEqual(g.map((x) => x.left), [0, 499.5, 1300.5]); assert.strictEqual(g[1].dueOn, '2026-02-28'); assert.strictEqual(g[1].late, true); assert.strictEqual(g[2].dueOn, '2026-03-31'); assert.strictEqual(g[2].late, false); assert.strictEqual(E.arrears(l, '2026-04-01').length, 2); ok('Dönem borcu: eski "ödendi" kaydı, kısmi ödeme, kira değişimi, kısa ay'); }
{ const g = E.ledger({ start: '2026-08-26', payDay: 5, rent: 10, rentHist: [], payments: [] }, '2026-08-28'); assert.strictEqual(g[0].dueOn, '2026-08-26'); assert.strictEqual(E.ledger({ start: '2026-08-26', payDay: 5, rent: 10, rentHist: [], payments: [] }, '2026-08-26')[0].late, false); ok('İlk dönemin vadesi sözleşme başlangıcından önce olamaz'); }
assert.strictEqual(E.ledger({ start: '2026-01-01', payDay: 1, rent: 10, rentHist: [], payments: [], endedAt: '2026-02-10' }, '2026-06-01').length, 2); ok('Biten sözleşmede borç işlemez');
{ const old = { start: '2024-01-01', payDay: 5, rent: 10, payments: [{ period: '2026-09', paid: true }] }; const g = E.ledger(old, '2026-10-20'); assert.deepStrictEqual(g.map((x) => x.period), ['2026-09', '2026-10']); assert.deepStrictEqual(E.ledger({ start: '2024-01-01', payDay: 5, rent: 10, payments: [] }, '2026-10-20').map((x) => x.period), ['2026-10']); ok('Eski kayıtta ödeme izi olmayan geçmiş aylar hayalî borç olmaz'); }
assert.strictEqual(E.ledger({ start: '2025-11-05', payDay: 5, rent: 10, rentHist: [], payments: [] }, '2026-02-01').length, 4); ok('Yıl geçişinde dönem atlanmaz');
assert.strictEqual(E.leaseEnd({ end: '2026-01-10' }, '2026-06-01'), '2027-01-10'); assert.strictEqual(E.leaseEnd({ end: '2026-12-01' }, '2026-06-01'), '2026-12-01'); ok('Süresi biten sözleşme kendiliğinden bir yıl uzar (TBK md. 347)');
assert.strictEqual(E.addYear('2024-02-29'), '2025-03-01'); assert.strictEqual(E.nextRaise({ start: '2024-05-01' }, '2026-04-30'), '2026-05-01'); assert.strictEqual(E.nextRaise({ start: '2024-05-01' }, '2026-05-01'), '2027-05-01');
{ const l = { start: '2025-01-01', rent: 10000, rentHist: [{ from: '2025-01', amount: 10000 }] }; const p = { cat: 'Daire' };
  const c = E.raiseCheck(l, 13000, 30, '2026-01-01', p); assert.strictEqual(c.cap, 13000); assert.strictEqual(c.error, undefined); assert.ok(/md\. 344/.test(E.raiseCheck(l, 13000.01, 30, '2026-01-01', p).error));
  assert.ok(E.raiseCheck(l, 12000, '', '2026-01-01', p).error); assert.ok(E.raiseCheck(l, 0, 30, '2026-01-01', p).error);
  assert.strictEqual(E.raiseCheck(l, 50000, 30, '2026-01-01', { cat: 'Arsa' }).error, undefined); assert.strictEqual(E.raiseCheck(l, 13000, 30, '2031-01-01', p).warn.length, 1);
  ok('Kira artışı TÜFE on iki aylık ortalamayı geçemez, oran girilmeden hesaplanmaz; çatısız arsada sınır yok; beş yılda uyarı (TBK md. 344)'); }

// ---------- Herkese açık veri ----------
{ const o = R.pub.props.omit; for (const k of ['owner', 'ownerPhone', 'ownerTc', 'authNo', 'authEnd', 'eidsEnd', 'offers', 'priceHist', 'portals']) assert.ok(o.includes(k), k); ok('Mal sahibi kimliği, teklifler ve fiyat geçmişi ilan sitesine gitmez');
  assert.ok(!R.settings.includes('mgmtPct')); assert.ok(R.settings.includes('yetkiNo')); assert.ok(!R.pub.agents.fields.includes('share')); assert.ok(!R.pub.agents.fields.includes('user')); ok('Yönetim bedeli ve danışman hakediş payı açığa çıkmaz; yetki belgesi no ilanda görünür');
  assert.ok(R.pub.deals.where({})); assert.ok(!R.pub.deals.where({ cancelled: '2026-01-01' })); ok('İptal edilen işlem "tamamlanan işlem" sayılmaz'); }
console.log(`\n${n} test geçti`);
