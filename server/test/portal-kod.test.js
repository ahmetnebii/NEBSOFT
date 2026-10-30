// Müşteri portalı girişleri: yalnızca telefon / kimlik no ile giriş yok; işletmenin verdiği rastgele portalCode birlikte eşleşmeli.
// Formülle türetilen yedek kodlar (son 4 hane + kayıt kimliği) kabul edilmez.
//   node server/test/portal-kod.test.js
const assert = require('assert'); const R = require('../cloud/public-rules');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const mk = (doc) => (q) => { const col = (k) => doc[k] || []; return { doc, ident: null, q: q || {}, col, get: (k, id) => col(k).find((r) => r.id === id) }; };

// Veteriner ve Spor: telefon + kod
for (const [prog, col] of [['veteriner', 'owners'], ['spor', 'members']]) {
  const x = mk({ [col]: [{ id: 'a1', phone: '0532 111 22 33', portalCode: 'K7P2QX' }, { id: 'a2', phone: '05440000000' }] });
  const L = R[prog].login;
  assert.strictEqual(L(x(), { phone: '05321112233', code: 'k7p2qx' }).i, 'a1');
  assert.strictEqual(L(x(), { phone: '05321112233' }), null);
  assert.strictEqual(L(x(), { phone: '05321112233', code: 'YANLIS' }), null);
  assert.strictEqual(L(x(), { phone: '05440000000', code: '' }), null);
  assert.strictEqual(L(x(), { phone: '05440000000', code: 'undefined' }), null);
  ok(`${prog}: telefon + kod gerekir; kodsuz ve kodu üretilmemiş kayıt giremez`);
}

// Kurs: veli telefonu + öğrenci kodu
{ const x = mk({ students: [{ id: 's1', parentPhone: '05321112233', portalCode: 'ABC234' }, { id: 's2', parentPhone: '05321112233' }] });
  assert.strictEqual(R.kurs.login(x(), { phone: '05321112233', code: 'abc234' }).i, '5321112233');
  assert.strictEqual(R.kurs.login(x(), { phone: '05321112233' }), null);
  assert.strictEqual(R.kurs.login(x(), { phone: '05321112233', code: 'XXXXXX' }), null);
  ok('kurs: veli telefonu + kod gerekir'); }

// Toptan, Müşavir, Hukuk, Anaokulu: formül yedek kodu artık geçmez
{ const c = { id: 'mvx12ab', phone: '05321112233', vkn: '1234567890', idNo: '12345678901' };
  const f4 = (s) => String(s).replace(/\D/g, '').slice(-4) + c.id.replace(/\W/g, '').slice(-2).toUpperCase();
  assert.strictEqual(R.toptan.login(mk({ customers: [c] })(), { phone: c.phone, code: f4(c.phone) }), null);
  assert.strictEqual(R.musavir.login(mk({ clients: [c] })(), { vkn: c.vkn, code: f4(c.vkn) }), null);
  assert.strictEqual(R.hukuk.login(mk({ clients: [c] })(), { idNo: c.idNo, code: f4(c.idNo) }), null);
  const st = { id: c.id, parents: [{ phone: c.phone }] };
  assert.strictEqual(R.anaokulu.login(mk({ students: [st] })(), { phone: c.phone, code: f4(c.phone) }), null);
  ok('toptan / müşavir / hukuk / anaokulu: formülle türetilen kod reddedilir');
  const cc = { ...c, portalCode: 'Q9W8E7' };
  assert.ok(R.toptan.login(mk({ customers: [cc] })(), { phone: c.phone, code: 'q9w8e7' }));
  assert.ok(R.musavir.login(mk({ clients: [cc] })(), { vkn: c.vkn, code: 'Q9W8E7' }));
  assert.ok(R.hukuk.login(mk({ clients: [cc] })(), { idNo: c.idNo, code: 'Q9W8E7' }));
  assert.ok(R.anaokulu.login(mk({ students: [{ ...st, portalCode: 'Q9W8E7' }] })(), { phone: c.phone, code: 'Q9W8E7' }));
  ok('toptan / müşavir / hukuk / anaokulu: rastgele portalCode ile giriş çalışır'); }

// Otopark / oto yıkama: plaka + fişteki takip kodu (abonede abone kodu)
{ const today = new Date().toISOString().slice(0, 10); const x = mk({ parks: [{ id: 'p1', plate: '34 ABC 123', out: null, code: 'KX7P2' }], jobs: [{ id: 'j1', plate: '06XYZ99', status: 'bekliyor', code: 'J9W8E' }], subs: [{ id: 's1', plate: '35 AA 1', end: '2999-01-01', portalCode: 'ABONE7' }] });
  const L = (q) => R.oto.login({ ...x(), today }, q);
  assert.ok(L({ plate: '34abc123', code: 'kx7p2' })); assert.ok(L({ plate: '06 XYZ 99', code: 'J9W8E' })); assert.ok(L({ plate: '35AA1', code: 'abone7' }));
  assert.strictEqual(L({ plate: '34ABC123' }), null); assert.strictEqual(L({ plate: '34ABC123', code: 'J9W8E' }), null); assert.strictEqual(L({ plate: '35AA1', code: 'XXXX' }), null);
  ok('oto: plaka + takip kodu gerekir; yalnızca plaka veya başka aracın kodu reddedilir'); }

console.log(`\n${n} test geçti`);
