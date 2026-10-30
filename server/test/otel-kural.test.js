// Otel bulut kuralı: online rezervasyonda hafta sonu farkı, en az gece, satışa kapalı aralık, oda değişikliği (segs),
// no-show, kapora talebi ve misafirin online ön check-in'i sunucuda uygulanır
//   node server/test/otel-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').otel;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const addDay = (d, k) => new Date(new Date(d + 'T12:00:00Z').getTime() + k * 864e5).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
// Önümüzdeki ilk pazartesi (hafta içi geceler) ve cuma
const next = (dow) => { let d = addDay(today, 7); while (new Date(d + 'T12:00:00Z').getUTCDay() !== dow) d = addDay(d, 1); return d; };
const mon = next(1), fri = next(5);
const mk = (extra = {}) => {
  const doc = { _settings: { directDiscount: 0, hbPrice: 650, freeCancelDays: 3 }, types: [{ id: 't1', price: 1000, capacity: 2, weekendPct: 20, minNights: 1 }, { id: 't2', price: 1000, capacity: 2, minNights: 3 }], rooms: [{ id: 'r1', type: 't1' }, { id: 'r2', type: 't2' }, { id: 'r3', type: 't1' }], guests: [{ id: 'g1', name: 'Ali', phone: '05321112233' }], seasons: [], reservations: [], blocks: [], ...extra };
  const col = (k) => (doc[k] = doc[k] || []);
  return (ident) => ({ doc, ident: ident || null, q: {}, today, col, get: (k, id) => col(k).find((r) => r.id === id), seq: () => 'W1' });
};
const ins = R.write.reservations.ins; const res = (o) => ({ room: 'r1', guest: 'g1', checkIn: mon, checkOut: addDay(mon, 1), adults: 2, children: 0, board: 'BB', ...o });

{ const a = ins(res(), mk()()); const b = ins(res({ checkIn: fri, checkOut: addDay(fri, 1) }), mk()()); assert.strictEqual(a.price, 1000); assert.strictEqual(b.price, 1200); ok('Hafta sonu farkı: cuma gecesi +%20, pazartesi gecesi farksız'); }
assert.throws(() => ins(res({ room: 'r2' }), mk()()), /en az 3 gece/); ok('En az gece kuralı');
assert.throws(() => ins(res(), mk({ blocks: [{ id: 'b1', room: 'r1', from: mon, to: addDay(mon, 2) }] })()), /satışa kapalı/); ok('Satışa kapalı aralıkta rezervasyon yok');
{ const segRes = { id: 'x1', room: 'r3', checkIn: addDay(mon, -2), checkOut: addDay(mon, 2), status: 'konaklama', segs: [{ room: 'r1', from: addDay(mon, -2), to: addDay(mon, 1) }] };
  assert.throws(() => ins(res(), mk({ reservations: [segRes] })()), /doldu/); ok('Oda değişikliği (segs): eski odanın geceleri dolu sayılır');
  assert.ok(ins(res({ checkIn: addDay(mon, 1), checkOut: addDay(mon, 2) }), mk({ reservations: [segRes] })())); ok('Oda değişikliğinden sonraki geceler eski odada boş'); }
assert.ok(ins(res(), mk({ reservations: [{ id: 'x2', room: 'r1', checkIn: mon, checkOut: addDay(mon, 1), status: 'noshow' }] })())); ok('No-show rezervasyonu odayı kapatmaz');
{ const r = ins(res({ depositRequest: 1 }), mk()()); assert.strictEqual(r.depositRequest, 300); const r2 = ins(res(), mk()()); assert.ok(!('depositRequest' in r2)); ok('Kapora talebi: tutar sunucuda %30 (istemcinin tutarı yok sayılır)'); }
{ const up = R.write.reservations.upd; const cur = { id: 'w1', status: 'opsiyon', checkIn: addDay(today, 10) }; const x = mk()({ k: 'r', i: 'w1' });
  const p = up(cur, { precheck: { idNo: '12345678901', nat: 'TC', birth: '1990-01-01', plate: '34 AB 1', eta: '18:00', others: '' } }, x); assert.strictEqual(p.precheck.idNo, '12345678901'); assert.ok(p.precheck.at);
  assert.throws(() => up(cur, { precheck: { idNo: '1' }, price: 1 }, x)); assert.throws(() => up({ ...cur, id: 'baska' }, { precheck: { idNo: '1' } }, x)); assert.throws(() => up({ ...cur, status: 'konaklama' }, { precheck: { idNo: '1' } }, x));
  assert.strictEqual(up(cur, { status: 'iptal' }, x).status, 'iptal'); assert.throws(() => up({ ...cur, checkIn: addDay(today, 1) }, { status: 'iptal' }, x));
  ok('Ön check-in yalnızca kendi açık rezervasyonunda; iptal kuralı korunur'); }
console.log(`\n${n} test geçti`);
