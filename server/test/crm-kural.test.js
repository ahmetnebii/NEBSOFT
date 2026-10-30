// CRM bulut kuralı: teklif yalnızca bir kez yanıtlanır, kabul edilince diğer sürümler kapanır, iç alanlar müşteriye gitmez
//   node server/test/crm-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').crm;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const day = (k) => new Date(Date.now() + k * 864e5).toISOString().slice(0, 10);
const mk = (over = {}) => {
  const doc = { quotes: [{ id: 'q1', no: 'T1', deal: 'd1', token: 'a'.repeat(32), total: 100, valid: day(5), cost: 40, lines: [{ name: 'X', qty: 1, price: 100, cost: 40 }], ...over.q }, { id: 'q2', no: 'T1/R2', deal: 'd1', token: 'b'.repeat(32), total: 90, valid: day(5) }, { id: 'q3', no: 'T9', deal: 'd9', token: 'c'.repeat(32), total: 9, valid: day(5) }], deals: [{ id: 'd1', title: 'F', stage: 'teklif', company: 'f1', contact: 'k1', owner: 'u1', value: 1 }], companies: [{ id: 'f1', name: 'Firma', phone: '1', revenue: 5 }], contacts: [{ id: 'k1', name: 'Ali', title: 'Md', phone: '1' }], users: [{ id: 'u1', name: 'Satış', pin: '1234', role: 'admin' }], activities: [] };
  const col = (k) => (doc[k] = doc[k] || []);
  return { doc, q: {}, ident: { k: 'q', i: 'q1' }, today: day(0), col, get: (k, id) => col(k).find((r) => r.id === id), pick: (o, f) => Object.fromEntries(f.map((k) => [k, o[k]])) };
};
const upd = (x, set) => R.write.quotes.upd(x.get('quotes', 'q1'), set, x);

{ const v = R.view(mk()); assert.strictEqual(v.quotes.length, 1); assert.strictEqual(v.quotes[0].cost, undefined); assert.strictEqual(v.quotes[0].lines[0].cost, undefined); assert.strictEqual(v.users[0].pin, undefined); assert.strictEqual(v.companies[0].revenue, undefined); ok('Müşteri yalnızca kendi teklifini görür; maliyet ve PIN gitmez'); }
assert.strictEqual(R.login(mk(), { t: 'yok' }), null); assert.ok(R.login({ ...mk(), q: {} }, { t: 'a'.repeat(32) })); ok('Geçersiz bağlantı girişi reddedilir');
{ const x = mk(); const r = upd(x, { status: 'kabul', signer: 'Ali Veli' }); assert.strictEqual(r.status, 'kabul'); assert.strictEqual(x.get('deals', 'd1').stage, 'kazanildi'); assert.strictEqual(x.get('deals', 'd1').value, 100); assert.strictEqual(x.get('quotes', 'q2').status, 'revize'); assert.strictEqual(x.get('quotes', 'q3').status, undefined); ok('Kabul fırsatı kazandırır, aynı fırsatın diğer teklifi kapanır, başkası etkilenmez'); }
assert.throws(() => upd(mk({ q: { status: 'kabul' } }), { status: 'red', rejectReason: 'x' })); ok('Yanıtlanmış teklif değiştirilemez');
assert.throws(() => upd(mk({ q: { valid: day(-1) } }), { status: 'kabul', signer: 'Ali Veli' })); ok('Süresi dolan teklif kabul edilemez');
assert.throws(() => upd(mk(), { status: 'kabul', signer: 'Al' }), /Adınızı/); ok('Kısa imza reddedilir');
assert.throws(() => upd(mk(), { status: 'kabul', signer: 'Ali Veli', total: 1 })); ok('Müşteri tutarı değiştiremez');
{ const x = mk(); const r = upd(x, { status: 'red', rejectReason: 'Fiyat' }); assert.strictEqual(r.status, 'red'); assert.strictEqual(x.get('deals', 'd1').stage, 'pazarlik'); ok('Red fırsatı pazarlığa alır'); }
console.log(`\n${n} test geçti`);
