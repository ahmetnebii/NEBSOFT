// Bilet bulut kuralı: online rezervasyonda indirim kodu sınırları, satış penceresi, hizmet bedeli ve ödeme süresi sunucuda uygulanır
//   node server/test/bilet-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').bilet;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const day = (k) => iso(Date.now() + k * 864e5);
const mk = (over = {}) => {
  const doc = {
    _settings: { serviceFee: 15, resHours: 48 },
    venues: [{ id: 'v1', type: 'standing', cats: { gen: 'Genel' }, capacity: { gen: 100 } }],
    events: [{ id: 'e1', venue: 'v1', date: day(10), time: '20:00', status: 'satista', prices: { gen: 200 }, ...over.event }],
    tickets: [],
    codes: [{ id: 'k1', code: 'YUZDE20', pct: 20, active: true }, { id: 'k2', code: 'SPONSOR', pct: 100, active: true }, { id: 'k3', code: 'GISE', pct: 10, active: true, online: false }, { id: 'k4', code: 'BITTI', pct: 10, active: true, maxUses: 2, uses: 2 }, { id: 'k5', code: 'ESKI', pct: 10, active: true, to: day(-1) }, { id: 'k6', code: 'BASKA', pct: 10, active: true, events: 'e9' }],
  };
  const col = (k) => (doc[k] = doc[k] || []);
  return (code) => ({ doc, q: { code }, today: day(0), col, get: (k, id) => col(k).find((r) => r.id === id), seq: () => 'B1' });
};
const ins = R.write.tickets.ins; const buy = (x) => ins({ event: 'e1', cat: 'gen', buyer: { name: 'Ali', phone: '05321112233' } }, x);

{ const x = mk()('YUZDE20'); const t = buy(x); assert.strictEqual(t.paid, 160); assert.strictEqual(t.fee, 15); assert.ok(t.holdUntil > Date.now() && t.holdUntil <= Date.now() + 48 * 3600e3 + 1000); assert.strictEqual(x.get('codes', 'k1').uses, 1); ok('Geçerli kod: %20 indirim, hizmet bedeli ve ödeme son anı sunucuda yazılır'); }
for (const [code, why] of [['SPONSOR', /online/], ['GISE', /online/], ['BITTI', /hakkı doldu/], ['ESKI', /süresi doldu/], ['BASKA', /bu etkinlikte/], ['YOKBOYLE', /Geçersiz/]]) assert.throws(() => buy(mk()(code)), why);
ok('%100 / gişe / kullanım hakkı dolmuş / süresi geçmiş / başka etkinlik / geçersiz kod online reddedilir');
assert.throws(() => buy(mk({ event: { salesStart: new Date(Date.now() + 864e5).toISOString().slice(0, 16) } })()), /henüz başlamadı/);
assert.throws(() => buy(mk({ event: { salesEnd: new Date(Date.now() - 3600e3).toISOString() } })()), /kapandı/);
ok('Satış penceresi: başlamadan ve bittikten sonra online rezervasyon yok');
{ const x = mk({ event: { date: day(0), time: '23:59' } })(); const t = buy(x); assert.ok(t.holdUntil <= Date.parse(`${day(0)}T23:59:00+03:00`) - 2 * 3600e3 + 15 * 60e3 + 1000); ok('Ödeme son anı en geç etkinlikten 2 saat önce'); }
{ const x = mk()(); const t = ins({ event: 'e1', cat: 'gen', buyer: { name: 'Ali', phone: '05321112233' }, fee: 0, holdUntil: 9e15, paid: 0 }, x); assert.strictEqual(t.fee, 15); assert.strictEqual(t.paid, 200); assert.ok(t.holdUntil < 9e15); ok('İstemcinin gönderdiği ücret / ödeme alanları yok sayılır'); }
console.log(`\n${n} test geçti`);
