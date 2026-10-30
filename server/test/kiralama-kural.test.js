// Araç kiralama: ortak hesap (apps/kiralama/hesap.js) ve online kiralama sunucu kuralı. Fiyat, müsaitlik ve depozito kuralları sunucuda da geçerlidir.
//   node server/test/kiralama-kural.test.js
const assert = require('assert'); const H = require('../../apps/kiralama/hesap.js'); const R = require('../cloud/public-rules').kiralama;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const iso = (ms) => new Date(ms).toISOString().slice(0, 10); const day = (k) => iso(Date.now() + k * 864e5);

// ---------- Hesap ----------
{ const b = H.bill({ from: '2026-01-01', to: '2026-01-04', daily: 1000.1, extras: ['navi'], outKm: 0, inKm: 1000, outFuel: 4, inFuel: 3, damages: [{ cost: 0.1 }, { cost: 0.2 }], payments: [{ amount: 100.1 }, { amount: 200.2 }] }, { kmLimit: 300, extraKm: 6.33, fuelFee: 400 });
  assert.strictEqual(b.base, 3000.3); assert.strictEqual(b.ext, 300); assert.strictEqual(b.overKm, 100); assert.strictEqual(b.kmFee, 633); assert.strictEqual(b.fuelFee, 400); assert.strictEqual(b.dmg, 0.3); assert.strictEqual(b.total, 4333.6); assert.strictEqual(b.paid, 300.3); assert.strictEqual(b.due, 4033.3); ok('Hesap kuruşa yuvarlanır; sıfır km ile teslim edilen araçta km aşımı hesaplanır'); }
{ const b = H.bill({ from: '2026-01-01', to: '2026-01-02', daily: 1000, payments: [] }, {}); assert.strictEqual(b.d, 1); assert.strictEqual(b.fuelFee, 0); assert.strictEqual(b.kmFee, 0); ok('Eski kayıtta km, yakıt, indirim alanları yoksa hesap bozulmaz'); }
{ const q = H.quote(1333, '2026-03-01', '2026-03-08', 'Ekonomi', {}); assert.strictEqual(q.d, 7); assert.strictEqual(q.rent, 8397.9); assert.strictEqual(H.r2(q.rate * q.d - q.disc), q.rent); ok('Uzun kiralamada "günlük × gün − indirim" gösterilen tutara kuruşu kuruşuna eşit'); }
{ const seasons = [{ from: '2026-07-01', to: '2026-07-02', pct: 50 }, { from: '2026-07-02', to: '2026-07-02', pct: 20 }, { from: '2026-07-03', to: '2026-07-03', pct: -10, cls: 'SUV' }];
  assert.strictEqual(H.seasonPct(seasons, '2026-07-02', 'Orta'), 50); assert.strictEqual(H.seasonPct(seasons, '2026-07-03', 'Orta'), 0); assert.strictEqual(H.seasonPct(seasons, '2026-07-03', 'SUV'), -10);
  const q = H.quote(1000, '2026-06-30', '2026-07-03', 'Orta', { seasons, longDays: 0 }); assert.strictEqual(q.rent, 4000); assert.strictEqual(q.d, 3);
  assert.strictEqual(H.seasonPct([{ from: '2026-07-01', to: '2026-07-02', pct: 50, active: false }], '2026-07-01', 'Orta'), 0); ok('Sezon: gün gün hesaplanır, çakışmada yüksek oran, sınıfa özel, kapalı sezon uygulanmaz'); }
{ const seasons = [{ from: '2026-07-01', to: '2026-07-31', pct: 33.3 }]; for (const d of [1, 3, 7, 11, 29]) { const q = H.quote(1999.99, '2026-07-01', H.addDay('2026-07-01', d), 'Orta', { seasons, longDays: 7, longPct: 12.5 }); assert.strictEqual(H.r2(q.rate * d - q.disc), q.rent); } ok('Sezon + indirimde kuruş farkı kalmaz'); }
assert.strictEqual(H.endOf({ status: 'kirada', to: '2026-01-10' }, '2026-01-15'), '2026-01-16'); assert.strictEqual(H.endOf({ status: 'kirada', to: '2026-01-20' }, '2026-01-15'), '2026-01-20'); assert.strictEqual(H.endOf({ status: 'tamamlandi', to: '2026-01-10' }, '2026-01-15'), '2026-01-10');
assert.strictEqual(H.endOf({ status: 'tamamlandi', to: '2026-01-13', inAt: '2026-01-11T15:00' }, '2026-01-12'), '2026-01-11'); assert.ok(!H.overlaps({ status: 'tamamlandi', from: '2026-01-05', to: '2026-01-13', inAt: '2026-01-11T15:00' }, '2026-01-12', '2026-01-13', '2026-01-12'));
assert.ok(H.overlaps({ status: 'kirada', from: '2026-01-01', to: '2026-01-10' }, '2026-01-15', '2026-01-17', '2026-01-15')); assert.ok(!H.overlaps({ status: 'tamamlandi', from: '2026-01-01', to: '2026-01-10' }, '2026-01-15', '2026-01-17', '2026-01-15')); assert.ok(!H.overlaps({ status: 'iptal', from: '2026-01-14', to: '2026-01-20' }, '2026-01-15', '2026-01-17', '2026-01-15')); assert.ok(!H.overlaps({ status: 'rezervasyon', from: '2026-01-10', to: '2026-01-15' }, '2026-01-15', '2026-01-17', '2026-01-12'));
ok('Süresi geçip iade edilmeyen araç boş görünmez; iptal bloklamaz; aynı gün dönüş serbest');
{ const r = { to: '2026-01-10', toTime: '10:00' }; assert.strictEqual(H.lateDays(r, '2026-01-10T12:00', 2), 0); assert.strictEqual(H.lateDays(r, '2026-01-10T12:01', 2), 1); assert.strictEqual(H.lateDays(r, '2026-01-11T10:00', 2), 1); assert.strictEqual(H.lateDays(r, '2026-01-11T10:01', 2), 2); assert.strictEqual(H.lateDays(r, '2026-01-09T10:00', 2), 0); ok('Geç iade: tolerans içinde ek gün yok, başlayan her 24 saat bir gün'); }
assert.deepStrictEqual(H.depositClose(5000, 1200.5, 'Hasar'), { cut: 1200.5, refund: 3799.5 }); assert.deepStrictEqual(H.depositClose(5000, 0, ''), { cut: 0, refund: 5000 }); assert.ok(H.depositClose(5000, 100, ' ').error); assert.ok(H.depositClose(5000, 5001, 'x').error); assert.ok(H.depositClose(5000, -1, 'x').error); assert.ok(H.depositClose(0, 0, '').error);
ok('Depozito: kesinti + iade = alınan; gerekçesiz, fazla veya negatif kesinti reddedilir');
assert.ok(!H.rentable({ status: 'pasif' })); assert.ok(!H.rentable({ status: 'bakim' })); assert.ok(H.rentable({ status: 'aktif' })); assert.ok(H.rentable({})); ok('Satılan/pasif ve bakımdaki araç kiralanamaz');

// ---------- Sunucu kuralı ----------
const mk = (o = {}) => {
  const doc = { _settings: { longDays: 7, longPct: 10, ...o.set }, cars: [{ id: 'c1', cls: 'Orta', daily: 1000, status: 'aktif' }, { id: 'c2', cls: 'Orta', daily: 1000, status: 'pasif' }, { id: 'c3', cls: 'Orta', daily: 1000, status: 'bakim' }], customers: [{ id: 'm1', phone: '05321112233', tc: '11111111111', birth: '1990-01-01', licenseDate: '2010-01-01' }, { id: 'm2', phone: '05329998877', tc: '22222222222', birth: '1990-01-01', licenseDate: '2010-01-01', blacklist: true }], rents: o.rents || [], seasons: o.seasons || [] };
  const col = (k) => (doc[k] = doc[k] || []);
  return { doc, today: day(0), col, get: (k, id) => col(k).find((r) => r.id === id), seq: () => 'K9000' };
};
const ins = R.write.rents.ins; const mkR = (o = {}) => ({ car: 'c1', customer: 'm1', from: day(2), to: day(5), fromTime: '10:00', toTime: '10:00', extras: [], ...o });
{ const r = ins(mkR({ daily: 1, disc: 99999, status: 'kirada', payments: [{ amount: 1e6 }], prepaid: 1e6 }), mk()); assert.strictEqual(r.daily, 1000); assert.strictEqual(r.disc, 0); assert.strictEqual(r.status, 'rezervasyon'); assert.strictEqual(r.prepaid, 0); assert.deepStrictEqual(r.payments, []); assert.strictEqual(r.deposit, 3000); ok('İstemcinin gönderdiği fiyat, indirim, durum ve ödeme yok sayılır'); }
{ const r = ins(mkR({ to: day(10) }), mk()); assert.strictEqual(r.daily, 1000); assert.strictEqual(r.disc, 800); ok('Uzun kiralama indirimi toplam üzerinden tutulur (günlük yuvarlanmaz)'); }
{ const f = day(2), t = day(5); const r = ins(mkR(), mk({ seasons: [{ from: f, to: t, pct: 50 }] })); assert.strictEqual(r.daily, 1500); ok('Sezon fiyatı sunucuda da uygulanır'); }
assert.throws(() => ins(mkR({ car: 'c2' }), mk()), /Araç bulunamadı/); assert.throws(() => ins(mkR({ car: 'c3' }), mk()), /Araç bulunamadı/); ok('Pasif ve bakımdaki araç online kiralanamaz');
assert.throws(() => ins(mkR({ customer: 'm2' }), mk()), /online alınamıyor/); ok('Kara listedeki müşteri online kiralayamaz');
assert.throws(() => ins(mkR(), mk({ rents: [{ id: 'x', car: 'c1', status: 'rezervasyon', from: day(3), to: day(4) }] })), /doldu/);
assert.throws(() => ins(mkR({ from: day(0), to: day(2) }), mk({ rents: [{ id: 'x', car: 'c1', status: 'kirada', from: day(-9), to: day(-2) }] })), /doldu/); ok('Dolu tarih ve iade edilmemiş gecikmiş araç online satılamaz');
{ const p = R.pub.cars.where; assert.ok(p({ status: 'aktif' })); assert.ok(!p({ status: 'pasif' })); assert.ok(!p({ status: 'bakim' })); const q = R.pub.rents.where; assert.ok(q({ status: 'kirada', to: day(-5) }, { today: day(0) })); assert.ok(!q({ status: 'tamamlandi', to: day(-5) }, { today: day(0) })); assert.ok(!R.pub.seasons.fields.includes('name')); ok('Herkese açık liste pasif aracı göstermez, gecikmiş kiradaki aracı dolu sayar'); }
{ const c = R.write.customers.ins({ name: 'A', phone: '05321112233', tc: 'U12345678901234', birth: '1990-01-01', licenseDate: '2010-01-01' }, mk()); assert.strictEqual(c.tc, 'U12345678901234'); ok('Pasaport numarası kesilmez'); }
console.log(`\n${n} test geçti`);
