// Takvim aboneliği (iCal) uç noktaları: Randevu / Klinik / CRM — veritabanı bellekte taklit edilir (MySQL gerekmez)
const path = require('path'); const assert = require('assert');
const dbPath = require.resolve('../cloud/db');
const TID = 7; const DATA = {
  randevu: { staff: [{ id: 's1', name: 'Elif Usta' }], services: [{ id: 'v1', name: 'Saç kesimi' }], customers: [{ id: 'c1', name: 'Ayşe Demir', phone: '05321112233' }], appointments: [{ id: 'a1', date: '', start: '10:30', duration: 45, staff: 's1', service: 'v1', customer: 'c1' }] },
  klinik: { _settings: { slot: 20 }, doctors: [{ id: 'd1', name: 'Dr. Can Yıldız' }], patients: [{ id: 'p1', name: 'Mehmet Ali Kaya', phone: '05001112233' }], appts: [{ id: 'k1', date: '', time: '14:00', doctor: 'd1', patient: 'p1', reason: 'Dolgu', status: 'bekliyor' }, { id: 'k2', date: '', time: '15:00', doctor: 'd1', patient: 'p1', reason: 'İptal edilen', status: 'iptal' }] },
  crm: { deals: [{ id: 'f1', title: 'Yıllık bakım sözleşmesi' }], activities: [{ id: 't1', type: 'gorev', due: '', text: 'Teklifi ara', deal: 'f1', done: false }, { id: 't2', type: 'not', due: null, text: 'Not', deal: 'f1' }] },
};
const day = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
DATA.randevu.appointments[0].date = day; DATA.klinik.appts.forEach((a) => { a.date = day; }); DATA.crm.activities[0].due = day;
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  ready: () => true, close: async () => {},
  one: async (sql, p) => { if (/FROM tenants WHERE id=/.test(sql)) return { slug: 'demo-isletme' }; if (/FROM tenants WHERE slug=/.test(sql)) return p[0] === 'demo-isletme' ? { id: TID, name: 'Demo İşletme' } : null; if (/FROM app_data/.test(sql)) return DATA[p[1]] ? { data: JSON.stringify(DATA[p[1]]) } : null; return null; },
  q: async () => [],
} };
process.env.NEBSOFT_SECRET = process.env.NEBSOFT_SECRET || 'a'.repeat(64);
const { R } = require('../cloud/routes');
const run = async (method, url, user) => { const u = new URL(url, 'http://x'); const r = R.find((x) => x.method === method && x.re.test(u.pathname)); const m = u.pathname.match(r.re); return r.fn({ params: m.groups || {}, query: u.searchParams, user, body: {} }); };

(async () => {
  let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
  const user = { id: 1, tenant_id: TID };
  // Randevu: imza ilk sürümle aynı biçimde (mevcut abonelikler bozulmaz)
  let a = await run('GET', '/api/takvim-adres', user); assert.ok(!a.all.includes('a=')); const cfgMod = require('../cloud/config');
  assert.ok(a.all.endsWith('k=' + cfgMod.mac(`takvim:${TID}:`).slice(0, 24))); ok('Randevu adresi eski imzayla aynı (abonelikler korunur)');
  let ics = await run('GET', a.all); assert.match(ics.body, /SUMMARY:Saç kesimi — Ayşe D\./); assert.ok(!/0532/.test(ics.body)); assert.match(ics.body, /DTSTART:\d{8}T073000Z/); ok('Randevu: hizmet + kısaltılmış ad, telefon yok, 10:30 → 07:30Z');
  a = await run('GET', '/api/takvim-adres?app=klinik', user); assert.strictEqual(a.staff[0].name, 'Dr. Can Yıldız'); assert.match(a.all, /a=klinik&/);
  ics = await run('GET', a.staff[0].url); assert.match(ics.body, /SUMMARY:Dolgu — Mehmet K\./); assert.ok(!/İptal edilen/.test(ics.body)); assert.match(ics.body, /DTEND:\d{8}T112000Z/); assert.match(ics.body, /X-WR-CALNAME:Demo İşletme · Dr. Can Yıldız — Hasta randevuları/); ok('Klinik: hekime özel takvim, iptaller hariç, randevu süresi ayarlardan (20 dk)');
  a = await run('GET', '/api/takvim-adres?app=crm', user); assert.deepStrictEqual(a.staff, []);
  ics = await run('GET', a.all); assert.match(ics.body, new RegExp('DTSTART;VALUE=DATE:' + day.replace(/-/g, ''))); assert.match(ics.body, /SUMMARY:Görev: Teklifi ara/); assert.match(ics.body, /DESCRIPTION:Fırsat: Yıllık bakım sözleşmesi/); assert.strictEqual((ics.body.match(/BEGIN:VEVENT/g) || []).length, 1); ok('CRM: yalnızca son tarihli görevler, tüm gün etkinliği');
  // İmza programa bağlı: randevu imzası klinik takvimini açmaz
  const rk = (await run('GET', '/api/takvim-adres', user)).all.split('k=')[1];
  await assert.rejects(run('GET', `/api/takvim/demo-isletme.ics?a=klinik&k=${rk}`), /bulunamadı/); await assert.rejects(run('GET', '/api/takvim/demo-isletme.ics?k=yanlis'), /bulunamadı/); ok('Yanlış / başka programın imzası reddedilir');
  console.log(`\n${n} test geçti`);
})().catch((e) => { console.error('✗', e); process.exit(1); });
