// Toptan bulut kuralı: bayi siparişinde fiyat, stok, risk ve en az sipariş sunucuda uygulanır; taban fiyat bayiye gitmez
//   node server/test/toptan-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').toptan;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const old = (d) => new Date(Date.now() - d * 864e5).toISOString();
const mk = (over = {}) => {
  const doc = {
    _settings: { minOrder: 100, ...over.set },
    customers: [{ id: 'c1', phone: '05321112233', portalCode: 'ABC123', list: 'C', limit: 10000, balance: 0, term: 30, rep: 'r1', ...over.c }, { id: 'c2', phone: '05329998877', list: 'A', limit: 1, balance: 0 }],
    products: [{ id: 'p1', name: 'Yağ', price: 100, cost: 80, vat: 20, stock: 50 }], reps: [{ id: 'r1', name: 'Hasan', phone: '1', target: 5 }],
    orders: over.orders || [], payments: over.payments || [], returns: [],
  };
  const col = (k) => (doc[k] = doc[k] || []);
  return { doc, q: {}, ident: { k: 'c', i: 'c1' }, session: { k: 'c', i: 'c1' }, today: new Date().toISOString().slice(0, 10), col, get: (k, id) => col(k).find((r) => r.id === id), pick: (o, f) => Object.fromEntries(f.map((k) => [k, o[k]])), seq: () => 'S1' };
};
const line = (qty, pid = 'p1') => [{ pid, qty }];
const buy = (x, qty = 2) => R.write.orders.ins({ lines: line(qty) }, x);
const paid = (amount, cheque, due) => ({ id: 'y', customer: 'c1', amount, cheque, due });

{ const v = R.view(mk()); assert.strictEqual(v.products[0].price, undefined); assert.strictEqual(v.products[0].cost, undefined); assert.strictEqual(v.products[0].listPrice, 108); assert.strictEqual(v.customers.length, 1); ok('Bayiye taban fiyat ve maliyet gitmez, yalnızca kendi liste fiyatı gider'); }
{ const o = R.write.orders.ins({ lines: [{ pid: 'p1', qty: 2, price: 1, disc: 90 }] }, mk()); assert.strictEqual(o.lines[0].price, 108); assert.strictEqual(o.lines[0].disc, 0); assert.strictEqual(o.status, 'yeni'); assert.strictEqual(o.no, 'S7000'); ok('Fiyat ve iskonto istemciden alınmaz'); }
assert.throws(() => buy(mk(), 60), /yeterli stok yok/);
assert.throws(() => buy(mk({ orders: [{ id: 'o', customer: 'c2', status: 'yeni', no: 'S7000', lines: [{ pid: 'p1', qty: 45, price: 1 }] }] }), 10), /yeterli stok yok/);
ok('Stok ve başka siparişlere ayrılan miktar aşılamaz');
assert.throws(() => R.write.orders.ins({ lines: line(1) }, mk({ set: { minOrder: 500 } })), /En az sipariş/); ok('En az sipariş tutarı sunucuda da uygulanır');
assert.strictEqual(buy(mk({ c: { balance: 9900 } })).status, 'onay'); ok('Bakiye + sipariş limiti aşarsa onaya düşer');
assert.strictEqual(buy(mk({ orders: [{ id: 'o', customer: 'c1', status: 'yeni', no: 'S7000', lines: [{ pid: 'p1', qty: 1, price: 9900, vat: 0 }] }] })).status, 'onay'); ok('Açık sipariş riske eklenir');
assert.strictEqual(buy(mk({ payments: [paid(9900, 'portfoy', '2099-01-01')] })).status, 'onay'); ok('Portföydeki çek riske eklenir');
assert.strictEqual(buy(mk({ payments: [paid(9900, 'tahsil', '2020-01-01')] })).status, 'yeni'); ok('Tahsil olmuş çek riski bitirir');
assert.strictEqual(buy(mk({ orders: [{ id: 'o', customer: 'c1', status: 'teslim', at: old(45), no: 'S7000', lines: [{ pid: 'p1', qty: 1, price: 100, vat: 0 }] }] })).status, 'onay'); ok('Vadesi geçen borç siparişi onaya düşürür');
assert.strictEqual(buy(mk({ orders: [{ id: 'o', customer: 'c1', status: 'teslim', at: old(45), no: 'S7000', lines: [{ pid: 'p1', qty: 1, price: 100, vat: 0 }] }], payments: [paid(100, 'karsiliksiz')] })).status, 'onay'); ok('Karşılıksız çek ödeme sayılmaz');
assert.strictEqual(buy(mk({ orders: [{ id: 'o', customer: 'c1', status: 'teslim', at: old(45), no: 'S7050', lines: [{ pid: 'p1', qty: 1, price: 100, vat: 0 }] }], payments: [paid(100)] })).no, 'S7051'); ok('Sipariş numarası en büyük numaradan devam eder');
console.log(`\n${n} test geçti`);
