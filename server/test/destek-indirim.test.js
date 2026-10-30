// Destek paketi SLA'sı ve toplu indirim hesabı (saf fonksiyonlar)
//   node server/test/destek-indirim.test.js
const assert = require('assert');
const D = require('../cloud/destek');
const I = require('../cloud/indirim');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const CAL = { gunler: [1, 2, 3, 4, 5], bas: 9, bit: 18 };
const tr = (s) => new Date(s + '+03:00');
const iso = (d) => d.toISOString();

// ---------- Yapılandırma ----------
{ const c = D.load(); assert.ok(c.paketler.standart && c.paketler.orta && c.paketler.ust); assert.ok(I.load().programSayisi.length); ok('Yapılandırma dosyaları okunur ve geçerlidir'); }
assert.throws(() => D.check({ paketler: { a: { takvim: 'x', ilkYanitSaat: 1, cozumSaat: 2, aylik: 0, oncelik: 1 } }, takvimler: {}, varsayilan: 'a' }), /takvimi yok/);
assert.throws(() => D.check({ paketler: { a: { takvim: 't', ilkYanitSaat: 5, cozumSaat: 2, aylik: 0, oncelik: 1 } }, takvimler: { t: CAL }, varsayilan: 'a' }), /Paket hatalı/);
assert.throws(() => I.check({ programSayisi: [{ min: 0, yuzde: 5 }], subeSayisi: [], lisansSayisi: [] }), /kademesi hatalı/);
ok('Hatalı yapılandırma reddedilir');

// ---------- Çalışma saati ----------
assert.strictEqual(iso(D.addWork(tr('2026-11-02T10:00:00'), 4, CAL)), iso(tr('2026-11-02T14:00:00'))); ok('Aynı gün içinde süre eklenir');
assert.strictEqual(iso(D.addWork(tr('2026-11-02T16:00:00'), 4, CAL)), iso(tr('2026-11-03T11:00:00'))); ok('Mesai bitince ertesi güne taşır');
assert.strictEqual(iso(D.addWork(tr('2026-10-31T12:00:00'), 2, CAL)), iso(tr('2026-11-02T11:00:00'))); ok('Hafta sonu sayılmaz');
assert.strictEqual(iso(D.addWork(tr('2026-11-02T07:00:00'), 1, CAL)), iso(tr('2026-11-02T10:00:00'))); ok('Mesai öncesi açılan talep mesaide başlar');
assert.strictEqual(iso(D.addWork(tr('2026-11-02T20:00:00'), 1, CAL)), iso(tr('2026-11-03T10:00:00'))); ok('Mesai sonrası açılan talep ertesi gün başlar');
assert.strictEqual(iso(D.addWork(tr('2026-11-06T17:00:00'), 2, CAL)), iso(tr('2026-11-09T10:00:00'))); ok('Cuma akşamından pazartesiye taşır');
assert.strictEqual(iso(D.addWork(tr('2026-11-02T09:00:00'), 18, CAL)), iso(tr('2026-11-03T18:00:00'))); ok('Tam mesai sınırı');

// ---------- SLA ----------
{ const t = D.ticketFields('ust', tr('2026-11-02T10:00:00')); assert.strictEqual(t.plan, 'ust'); assert.strictEqual(t.priority, 1); assert.ok(t.first_due < t.resolve_due); ok('Talep paketin önceliği ve süresini alır'); }
assert.strictEqual(D.ticketFields('yok', new Date()).plan, 'standart'); ok('Bilinmeyen paket varsayılan olur');
{ const b = { first_due: tr('2026-11-02T14:00:00'), resolve_due: tr('2026-11-03T14:00:00'), status: 'acik' };
  assert.strictEqual(D.state(b, tr('2026-11-02T10:00:00')).durum, 'zamaninda'); assert.strictEqual(D.state(b, tr('2026-11-02T13:30:00')).durum, 'yaklasti'); assert.strictEqual(D.state(b, tr('2026-11-02T15:00:00')).durum, 'asildi');
  const y = D.state({ ...b, first_reply_at: tr('2026-11-02T11:00:00') }, tr('2026-11-02T15:00:00')); assert.strictEqual(y.durum, 'zamaninda'); assert.strictEqual(y.asama, 'cozum');
  assert.strictEqual(D.state({ ...b, status: 'kapali', closed_at: tr('2026-11-03T10:00:00') }).durum, 'kapandi'); assert.strictEqual(D.state({ ...b, status: 'kapali', closed_at: tr('2026-11-04T10:00:00') }).durum, 'gec-kapandi');
  assert.strictEqual(D.state({ status: 'acik' }).durum, 'yok'); ok('Sayaç durumları: zamanında, yaklaştı, aşıldı, çözüm aşaması, kapanış, eski talep'); }
{ const c = D.load(); const l = D.line('orta', 'yillik'); assert.strictEqual(l.price, c.paketler.orta.aylik * 10); assert.strictEqual(l.type, 'support'); assert.strictEqual(D.line('orta', 'aylik').price, c.paketler.orta.aylik); assert.throws(() => D.line('altin'), /Geçersiz/); ok('Destek kalemi yıllıkta 10 ay'); }
assert.strictEqual(D.paid({ support_plan: 'ust', support_until: '2020-01-01' }), 'standart'); assert.strictEqual(D.paid({ support_plan: 'ust', support_until: '2099-01-01' }), 'ust'); ok('Süresi biten paket standarda düşer');

// ---------- İndirim ----------
const K = { programSayisi: [{ min: 3, yuzde: 10 }, { min: 5, yuzde: 15 }], subeSayisi: [{ min: 2, yuzde: 5 }, { min: 10, yuzde: 20 }], lisansSayisi: [{ min: 25, yuzde: 25 }], kurumsal: { formEsigi: 25 } };
const P = (pid, price, qty = 1) => ({ pid, price, qty });
const H = (lines, o = {}) => I.hesapla({ lines, subeSayisi: o.sube, lisansSayisi: o.lisans }, { kurallar: K, kdv: 20, kuponYuzde: o.kupon });
{ const r = H([P('a', 1000), P('b', 1000)]); assert.strictEqual(r.discount, 0); assert.strictEqual(r.indirim, null); assert.strictEqual(r.vat, 400); assert.strictEqual(r.total, 2400); ok('Eşik altında indirim yok, KDV doğru'); }
{ const r = H([P('a', 1000), P('b', 1000), P('c', 1000)]); assert.strictEqual(r.discount, 300); assert.strictEqual(r.indirim.kural, 'programSayisi'); assert.strictEqual(r.vat, 540); assert.strictEqual(r.total, 3240); ok('Program kademesi; KDV indirimden sonra'); }
{ const r = H([P('a', 1000), P('b', 1000), P('c', 1000), P('d', 1000), P('e', 1000)]); assert.strictEqual(r.indirim.yuzde, 15); ok('En yüksek kademe alınır'); }
{ const r = H([P('a', 100), P('a', 100), P('a', 100)]); assert.strictEqual(r.olcut.programSayisi, 1); assert.strictEqual(r.discount, 0); ok('Aynı program iki kez sayılmaz'); }
{ const r = H([P('a', 1000), P('b', 1000), P('c', 1000)], { sube: 10 }); assert.strictEqual(r.indirim.kural, 'subeSayisi'); assert.strictEqual(r.indirim.yuzde, 20); assert.strictEqual(r.adaylar.length, 2); ok('Ölçütlerden en yüksek tek indirim, toplanmaz'); }
{ const r = H([P('a', 100, 25)]); assert.strictEqual(r.indirim.kural, 'lisansSayisi'); assert.strictEqual(r.kurumsal, true); ok('Lisans sayısı adetten gelir, kurumsal eşik işaretlenir'); }
{ const r = H([P('a', 1000), P('b', 1000), P('c', 1000)], { kupon: 25 }); assert.strictEqual(r.indirim.kural, 'kupon'); assert.strictEqual(r.discount, 750); const r2 = H([P('a', 1000), P('b', 1000), P('c', 1000)], { kupon: 5 }); assert.strictEqual(r2.indirim.kural, 'programSayisi'); ok('Kupon birleşmez, büyük olan geçerli'); }
{ const r = H([P('a', 1000), P('b', 1000), P('c', 1000), { type: 'support', pid: 'destek-ust', price: 500, qty: 1 }]); assert.strictEqual(r.subtotal, 3500); assert.strictEqual(r.discount, 300); assert.strictEqual(r.total, 3840); ok('Destek paketi indirime girmez ve program sayılmaz'); }
{ const r = H([P('bundle', 5000), P('a', 1000), P('b', 1000)]); assert.strictEqual(r.olcut.programSayisi, 2); assert.strictEqual(r.discount, 0); ok('Hepsi Bir Arada indirime ve sayıma girmez'); }
{ const r = H([P('a', 33.33), P('b', 33.33), P('c', 33.34)]); assert.strictEqual(r.subtotal, 100); assert.strictEqual(r.discount, 10); assert.strictEqual(r.vat, 18); assert.strictEqual(r.total, 108); ok('Kuruş hesabı kayma yapmaz'); }
assert.throws(() => H([]), /boş/); assert.throws(() => H([P('a', -5)]), /Geçersiz/); assert.throws(() => H([P('a', 'x')]), /Geçersiz/); ok('Geçersiz sepet reddedilir');
{ const r = H([P('a', 1000)], { sube: -3, lisans: 'x' }); assert.strictEqual(r.olcut.subeSayisi, 1); assert.strictEqual(r.olcut.lisansSayisi, 1); ok('Kötü sayı girişleri zararsız'); }
console.log(`\n${n} test geçti`);
