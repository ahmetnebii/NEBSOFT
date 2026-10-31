// Bilet bulut kuralı: online rezervasyonda indirim kodu sınırları, satış penceresi, hizmet bedeli ve ödeme süresi sunucuda uygulanır
//   node server/test/bilet-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').bilet;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const day = (k) => iso(Date.now() + 3 * 3600e3 + k * 864e5); // sunucunun x.today'i gibi Türkiye tarihi
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
// Yarın 23:59 günün her saatinde 2 saat sınırını 48 saatten önceye ve 15 dakikalık tabandan sonraya düşürür: sonuç saatten bağımsız, tam bu andır
{ const g = day(1); const x = mk({ event: { date: g, time: '23:59' } })(); const t = buy(x); assert.strictEqual(t.holdUntil, Date.parse(`${g}T23:59:00+03:00`) - 2 * 3600e3); ok('Ödeme son anı en geç etkinlikten 2 saat önce'); }
{ const x = mk()(); const t = ins({ event: 'e1', cat: 'gen', buyer: { name: 'Ali', phone: '05321112233' }, fee: 0, holdUntil: 9e15, paid: 0 }, x); assert.strictEqual(t.fee, 15); assert.strictEqual(t.paid, 200); assert.ok(t.holdUntil < 9e15); ok('İstemcinin gönderdiği ücret / ödeme alanları yok sayılır'); }
// Koltuk, tür ve erken kuş
const mkSeat = (ev = {}, vn = {}) => { const doc = { _settings: { serviceFee: 15 }, venues: [{ id: 'v1', type: 'seated', seatsPerRow: 4, rows: [{ r: 'A', cat: 'vip' }, { r: 'B', cat: 'gen' }], cats: { vip: 'VIP', gen: 'Genel' }, ...vn }], events: [{ id: 'e1', venue: 'v1', date: day(10), time: '20:00', status: 'satista', prices: { vip: 1000, gen: 400 }, ...ev }], tickets: [], codes: [], waitlist: [] }; const col = (k) => (doc[k] = doc[k] || []); return { doc, q: {}, today: day(0), col, get: (k, id) => col(k).find((r) => r.id === id), seq: () => 'B1' }; };
const seat = (x, s, extra = {}) => ins({ event: 'e1', seat: s, cat: 'gen', buyer: { name: 'Ali', phone: '05321112233' }, ...extra }, x);
{ const t = seat(mkSeat(), 'A1'); assert.strictEqual(t.cat, 'vip'); assert.strictEqual(t.paid, 1000); ok('Koltuğun kategorisi salondan gelir: VIP koltuk ucuz kategoriden alınamaz'); }
assert.throws(() => seat(mkSeat(), 'Z9'), /satışta değil/); assert.throws(() => seat(mkSeat(), 'A5'), /satışta değil/);
assert.throws(() => seat(mkSeat({}, { closed: ['A1'] }), 'A1'), /satışta değil/); assert.throws(() => seat(mkSeat({ blocks: { A1: 'Protokol' } }), 'A1'), /satışta değil/);
assert.throws(() => R.write.holds.ins({ event: 'e1', seat: 'A1', owner: 'o', until: Date.now() }, mkSeat({ blocks: { A1: 'Basın' } })), /satışta değil/);
ok('Var olmayan, kapalı ve kontenjanlı koltuk satılmaz, kilitlenemez');
{ const t = seat(mkSeat({ ttypes: 'Öğrenci:30, Çocuk:50' }), 'B1', { ttype: 'Öğrenci' }); assert.strictEqual(t.paid, 280); assert.strictEqual(t.ttype, 'Öğrenci'); assert.throws(() => seat(mkSeat({ ttypes: 'Öğrenci:30' }), 'B2', { ttype: 'Bedava' }), /bilet türü/); ok('Bilet türü fiyatı sunucuda hesaplanır, uydurma tür reddedilir'); }
{ const e = { tier1Until: day(5), tier1Pct: 20, tier2Until: day(9), tier2Pct: 10 }; assert.strictEqual(seat(mkSeat(e), 'B1').paid, 320); assert.strictEqual(seat(mkSeat({ tier1Until: day(-1), tier1Pct: 20, tier2Until: day(5), tier2Pct: 10 }), 'B1').paid, 360); assert.strictEqual(seat(mkSeat({ tier1Until: day(-1), tier1Pct: 20 }), 'B1').paid, 400); ok('Erken kuş: tarihi gelen ilk basamak uygulanır, geçince tam fiyat'); }
{ const x = mkSeat(); const w = R.write.waitlist.ins({ event: 'e1', name: 'Ali', phone: '05321112233', qty: 2 }, x); assert.strictEqual(w.status, 'bekliyor'); x.doc.waitlist.push(w); assert.throws(() => R.write.waitlist.ins({ event: 'e1', name: 'Ali', phone: '05321112233', qty: 1 }, x), /zaten/); assert.ok(!R.pub.waitlist); ok('Bekleme listesi: aynı telefon iki kez yazılmaz, liste herkese açık değil'); }
assert.ok(R.pub.events.omit.includes('share')); ok('Organizatör payı herkese açık sayfaya gitmez');
console.log(`\n${n} test geçti`);
