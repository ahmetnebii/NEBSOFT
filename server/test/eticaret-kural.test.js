// E-ticaret bulut kuralı: kupon tarihi ve kullanım sınırı sunucuda uygulanır; iç bilgiler müşteriye gitmez
//   node server/test/eticaret-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').eticaret;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const today = new Date().toISOString().slice(0, 10);
const mk = (coupon, q) => {
  const doc = { _settings: { freeShip: 750, shipFee: 79, codFee: 30 }, customers: [{ id: 'c1', phone: '05321112233' }], coupons: coupon ? [{ id: 'k', code: 'KOD', type: 'pct', value: 10, min: 0, active: true, ...coupon }] : [], products: [{ id: 'p1', name: 'Elbise', price: 1000, active: true, variants: [{ id: 'v1', color: 'Siyah', size: 'M', stock: 5 }] }], orders: [], returns: [] };
  const col = (k) => (doc[k] = doc[k] || []);
  return { doc, q: q || { coupon: 'KOD' }, ident: { k: 'o', i: 'o1' }, today, col, get: (k, id) => col(k).find((r) => r.id === id), pick: (o, f) => Object.fromEntries(f.map((k) => [k, o[k]])), seq: () => 'LB1' };
};
const buy = (x) => R.write.orders.ins({ customer: 'c1', ship: { name: 'A', phone: '05321112233', city: 'İstanbul', address: 'Adres' }, items: [{ pid: 'p1', vid: 'v1', qty: 1 }], pay: 'havale' }, x);

{ const o = buy(mk({})); assert.strictEqual(o.discount, 100); assert.strictEqual(o.coupon, 'KOD'); ok('Geçerli kupon uygulanır'); }
{ const x = mk({ uses: 2 }); buy(x); assert.strictEqual(x.doc.coupons[0].uses, 3); ok('Kullanım sayısı sunucuda artar'); }
{ const o = buy(mk({ end: '2020-01-01' })); assert.strictEqual(o.discount, 0); assert.strictEqual(o.coupon, null); ok('Süresi geçen kupon uygulanmaz'); }
{ const o = buy(mk({ start: '2999-01-01' })); assert.strictEqual(o.discount, 0); ok('Başlamamış kupon uygulanmaz'); }
{ const x = mk({ maxUses: 3, uses: 3 }); const o = buy(x); assert.strictEqual(o.discount, 0); assert.strictEqual(x.doc.coupons[0].uses, 3); ok('Kullanım sınırı dolan kupon uygulanmaz, sayaç artmaz'); }
{ const o = buy(mk({ type: 'tl', value: 5000 })); assert.strictEqual(o.discount, 1000); assert.ok(o.total >= 0); ok('Tutar indirimi ara toplamı aşamaz'); }
{ assert.strictEqual(R.query(mk({ end: '2020-01-01' }), { coupon: 'KOD' }), null); assert.strictEqual(R.query(mk({ maxUses: 1, uses: 1 }), { coupon: 'KOD' }), null); assert.strictEqual(R.query(mk({ end: '2999-01-01', maxUses: 9 }), { coupon: 'KOD' }).coupons[0].maxUses, 9); ok('Geçersiz kupon vitrine bildirilmez'); }
{ const x = mk(); x.doc.orders.push({ id: 'o1', no: 'LB1', ship: { phone: '05321112233' }, memo: 'Zor müşteri', tags: ['VIP'], history: [{ user: 'Ece' }], channelShip: 50 }); x.doc.returns.push({ id: 'r', order: 'o1', by: 'Ece', restocked: true }); const v = R.view(x); ['memo', 'tags', 'history', 'channelShip'].forEach((f) => assert.strictEqual(v.orders[0][f], undefined)); assert.strictEqual(v.returns[0].by, undefined); ok('İç not, etiket, geçmiş ve kesinti müşteriye gitmez'); }
console.log(`\n${n} test geçti`);
