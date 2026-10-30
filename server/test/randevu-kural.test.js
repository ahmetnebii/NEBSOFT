// Randevu bulut kuralı: online randevu, "hatırlatma istemiyorum" ve müşterinin kendi randevusunu taşıması / iptali
//   node server/test/randevu-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').randevu;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const addDay = (d, k) => new Date(new Date(d + 'T12:00:00Z').getTime() + k * 864e5).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10); const d1 = addDay(today, 5), d2 = addDay(today, 6);
const hours = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => [k, { start: '09:00', end: '18:00' }]));
const mk = (appts = []) => { const doc = { _settings: { cancelHours: 2 }, staff: [{ id: 's1', hours }], services: [{ id: 'v1', online: true, duration: 60, price: 300 }], customers: [{ id: 'c1', phone: '05321112233' }], appointments: appts, blocks: [] };
  const col = (k) => (doc[k] = doc[k] || []); return (ident) => ({ doc, ident: ident || null, q: {}, today, col, get: (k, id) => col(k).find((r) => r.id === id) }); };
const A = (o) => ({ id: 'a1', date: d1, start: '10:00', duration: 60, staff: 's1', service: 'v1', customer: 'c1', status: 'onay', ...o });

{ const r = R.write.appointments.ins({ date: d1, start: '11:00', staff: 's1', service: 'v1', customer: 'c1', noReminder: true }, mk()()); assert.strictEqual(r.noReminder, true); assert.strictEqual(r.price, 300); ok('Online randevu: "hatırlatma istemiyorum" kaydedilir, ücret sunucudan'); }
{ const up = R.write.appointments.upd; const me = mk([A(), A({ id: 'a2', customer: 'c9', start: '14:00' })])({ k: 'c', i: 'c1' });
  const p = up(A(), { date: d2, start: '15:00', note: 'taşındı', status: 'bekliyor', reminded: null, remindTried: null, remindTest: null }, me); assert.strictEqual(p.date, d2); assert.strictEqual(p.status, 'bekliyor'); assert.strictEqual(p.reminded, null);
  assert.throws(() => up(A(), { date: d1, start: '14:30' }, me), /doldu/); assert.throws(() => up(A(), { date: d1, start: '17:30' }, me), /çalışmıyor/);
  assert.throws(() => up(A(), { date: d2, start: '15:00', price: 0 }, me)); assert.throws(() => up(A({ customer: 'c9' }), { date: d2, start: '15:00' }, me));
  assert.ok(up(A(), { date: d1, start: '10:30' }, me)); ok('Taşıma: yeni saat denetlenir (çakışma, çalışma saati), başka alan ve başkasının randevusu reddedilir, kendi eski saati çakışma sayılmaz');
  assert.strictEqual(up(A(), { status: 'iptal' }, me).status, 'iptal'); assert.throws(() => up(A({ date: today, start: '00:00' }), { status: 'iptal' }, me)); ok('İptal: iptal süresi kuralı korunur'); }
console.log(`\n${n} test geçti`);
