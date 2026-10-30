// Kargo bulut kuralı: takip sayfası teslim alan adı, konum, personel adı ve imzayı vermez; alıcı yalnızca hareket ekleyebilir
//   node server/test/kargo-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').kargo;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const later = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const mk = (over = {}, ident = { k: 'v', i: 's1' }) => {
  const doc = { couriers: [{ id: 'k1', name: 'Ramazan Yıldız', vehicle: 'Motor', phone: '0555' }], ships: [{ id: 's1', no: 'HK1', at: '2026-01-01T00:00:00Z', status: 'edilemedi', courier: 'k1', receiver: { name: 'Ayşe Kaya', phone: '05321112233', address: 'Gizli Sok. 5', district: 'Kadıköy', city: 'İstanbul' }, sender: { name: 'Lina', phone: '0533' }, price: 100, signature: 'data:x', geo: { lat: 41, lng: 29 }, photo: 'data:y', history: [{ at: '2026-01-01T00:00:00Z', status: 'dagitimda', note: 'Kurye Ramazan Yıldız dağıtıma çıkardı', user: 'Seda Kabul' }, { at: '2026-01-02T00:00:00Z', status: 'edilemedi', note: 'Alıcı adreste yok — apartman görevlisi yok · konum 41.1, 29.1', user: 'Ramazan' }], ...over }] };
  const col = (k) => (doc[k] = doc[k] || []);
  return { doc, q: {}, ident, today: new Date().toISOString().slice(0, 10), col, get: (k, id) => col(k).find((r) => r.id === id), pick: (o, f) => Object.fromEntries(f.filter((k) => o[k] !== undefined).map((k) => [k, o[k]])) };
};
{ const v = R.view(mk()); const s = v.ships[0]; const txt = JSON.stringify(s); assert.ok(!/41\.1|Seda|Ramazan Yıldız|apartman|data:|Gizli/.test(txt), txt); assert.strictEqual(s.history[1].note, 'Alıcı adreste yok'); assert.strictEqual(s.proof, true); ok('Takip görünümü konum, personel, imza ve açık adres vermez; kanıt yalnızca var/yok'); }
{ const v = R.view(mk({ status: 'teslim', deliveredTo: 'Ayşe Kaya (Kendisi)', history: [{ at: 'x', status: 'teslim', note: 'Teslim alan: Ayşe Kaya (Kendisi) · konum 41, 29' }] })); assert.strictEqual(v.ships[0].history[0].note, 'Teslim edildi'); assert.ok(!v.ships[0].deliveredTo.includes('Ayşe')); ok('Teslim notu ve teslim alan maskelenir'); }
{ const x = mk(); const cur = x.doc.ships[0]; const view = R.view(x).ships[0]; const set = { retryDate: later(2), history: [...view.history, { at: new Date().toISOString(), status: 'edilemedi', note: 'Yeniden teslimat istedi' }] }; const p = R.write.ships.upd(cur, set, x); assert.strictEqual(p.history.length, 3); assert.strictEqual(p.history[0].user, 'Seda Kabul'); assert.strictEqual(p.history[2].by, 'Alıcı (online)'); assert.strictEqual(p.retryDate, set.retryDate); ok('Süzülmüş geçmişle yeniden teslimat isteği kabul edilir, asıl kayıt bozulmaz'); }
{ const x = mk(); assert.throws(() => R.write.ships.upd(x.doc.ships[0], { history: [{ at: new Date().toISOString(), status: 'edilemedi', note: 'a' }] }, x)); ok('Geçmiş kısaltılamaz'); }
{ const x = mk({}, { k: 's', i: 's1' }); assert.throws(() => R.write.ships.upd(x.doc.ships[0], { retryDate: later(2) }, x)); ok('Telefon doğrulaması olmadan yeniden teslimat istenemez'); }
{ const x = mk(); assert.throws(() => R.write.ships.upd(x.doc.ships[0], { retryDate: later(30) }, x), /Geçersiz tarih/); ok('Yeniden teslimat tarihi 10 günle sınırlı'); }
console.log(`\n${n} test geçti`);
