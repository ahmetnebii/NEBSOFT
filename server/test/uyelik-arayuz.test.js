// Dernek, Eğitim, Danışan ve iki modül: denetimde bulunan arayüz hatalarının geri gelmemesi için. Saf hesap + kaynak denetimi; akışlar tarayıcıda denendi (docs/test/uyelik-egitim-saglik.md).
//   node server/test/uyelik-arayuz.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path');
const H = require('../../apps/egitim/hesap.js');
const oku = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

// Eğitim saf hesapları
assert.deepEqual(H.gunler('2,4'), [2, 4]); assert.deepEqual(H.gunler(' 1, 7 '), [1, 0]); assert.deepEqual(H.gunler('0'), [0]); assert.deepEqual(H.gunler('2,2'), [2]); ok('gün listesi: 7 pazara döner, yineleme atılır');
['', null, undefined, '8,9', '1,x', '1.5', '-1'].forEach((x) => assert.equal(H.gunler(x), null, String(x))); ok('gün listesi: boş ve aralık dışı giriş reddedilir, sessizce başka güne kaymaz');
assert.equal(H.bitis('2027-06-01', 1), '2028-06-01'); assert.equal(H.bitis('2026-03-01', 2), '2028-03-01'); assert.equal(H.bitis('2026-03-01', 0), null); ok('belge geçerliliği takvim yılıyla ilerler');
{ const T = [{ due: '2026-01-01', amount: 100, paid: false }, { due: '2026-02-01', amount: 200, paid: true }, { due: '2026-02-01', amount: 40, paid: false, canceled: true }, { due: '2026-03-01', amount: 50, paid: false }]; assert.equal(H.gecikmis(T, '2026-03-01'), 100); assert.equal(H.gecikmis(T, '2026-03-02'), 150); assert.equal(H.gecikmis(undefined, '2026-03-02'), 0); ok('geciken taksit: bugünün vadesi, ödenen ve iptal edilen sayılmaz'); }

// Kaynak denetimi: yapılan düzeltme kod olarak yerinde
const dernek = oku('apps/dernek/app.js'), uye = oku('apps/dernek/uye.html'), egitim = oku('apps/egitim/app.js'), danisan = oku('apps/danisan/app.js'), kuafor = oku('apps/oto/kuafor.js'), randevu = oku('apps/randevu/app.js');
assert.ok(/NS\.pub \? d\.length === 10 && db\.lookup\(\{ phone: d, code \}\) && db\.all\('members'\)\[0\]/.test(uye)); assert.ok(uye.includes('db.pubLogout()')); ok('üye portalı: bulutta telefon alanı gelmez, giriş sunucu yanıtına dayanır; çıkış belirteci siler');
{ const R = require('../cloud/public-rules').dernek; const doc = { members: [{ id: 'm1', status: 'aktif', phone: '05321112233', name: 'A' }], dues: [], receipts: [] }; const x = { col: (k) => doc[k] || [], get: (k, id) => (doc[k] || []).find((r) => r.id === id), ident: { k: 'o', i: 'm1' }, pick: (o, f) => Object.fromEntries(f.map((k) => [k, o[k]])) }; assert.ok(!('phone' in R.view(x).members[0])); ok('portal görünümünde telefon yok: arayüz telefonla aramamalı'); }
assert.ok(dernek.includes("readonly: !yaz(), fields: [{ name: 'dir'") && dernek.includes("readonly: !yaz(), fields: [{ name: 'title'")); assert.ok(/wr \? `<button class="btn sm primary" id="ad">/.test(dernek)); ok('sayman: yazamadığı toplantı, evrak ve duyuruda düğme yok');
assert.ok(dernek.includes('Borç kuralı açık: hazirun listesini sayman veya başkan yazdırır')); ok('sekreter: borç kuralı açıkken eksik süzülmüş hazirun basılmaz');
assert.ok(egitim.includes("delete en.cert")); ok('sertifika iptali kursiyeri kilitlemez, yeni belge üretilir');
assert.ok(egitim.includes("db.nextNo('certs', 'SRT-')") && !egitim.includes('`SRT-${1001')); ok('örnek sertifika numarası sayaçtan alınır, mükerrer no oluşmaz');
assert.ok(egitim.includes("e.status !== 'ayrildi' && late(e) > 0")); ok('özet: belgesi verilen kursiyerin gecikmiş borcu da sayılır');
assert.ok(egitim.includes('not kaydedilmedi: not 0-100')); ok('geçersiz not "kaydedildi" görünmez');
assert.ok(egitim.includes('.filter((s) => s.group !== rec.id || s.taken)')); ok('grup düzenlenince yoklaması alınmamış oturumlar yenilenir');
assert.ok(egitim.includes("show: (c) => c.status === 'hazir' && fin()")); ok('eğitmen sunucunun geri alacağı teslim işaretini göremez');
assert.ok(/integrations: \['sms', 'whatsapp', 'email', 'payment', 'printer', 'backup'\]/.test(egitim) && !/integrations: \[[^\]]*efatura[^\]]*\], name: 'Eğitim/.test(egitim)); assert.ok(!/integrations: \[[^\]]*webhook[^\]]*\], name: 'Dernek/.test(dernek)); ok('programda çalışmayan e-Belge, POS ve webhook menüye girmez');
assert.ok(danisan.includes('let BM = null') && danisan.includes('rows: L.slice(0, 300)')); ok('danışan: bakiye tek geçişte hesaplanır, kasa binlerce danışanda akıcı');
assert.ok(danisan.includes('Ölçüm eksi olamaz') && danisan.includes('Paket bedeli eksi olamaz')); ok('danışan: eksi ölçüm ve paket bedeli reddedilir');
assert.ok(/med && yon && NS\.kvkk/.test(danisan)); assert.ok(danisan.includes("c.anonAt ? badge('Anonimleştirildi'")); ok('danışan: dışa aktarma yalnız yöneticide; anonim kart yeniden açılmaz');
assert.ok(kuafor.includes('if (fissiz) t.noTicket = fissiz;') && kuafor.includes('küçük olamaz')); ok('vale: ödeme vazgeçilince fişsiz iade kaydı kalmaz, teslim km denetlenir');

// Yazdırılan belge: genel şablonun garanti metni bu programlarda basılmaz
[['dernek', dernek], ['egitim', egitim], ['danisan', danisan], ['oto', kuafor], ['randevu', randevu]].forEach(([ad, s]) => assert.ok(/NS\.docs[^\n]*define\([^\n]*terms: ''/.test(s) || /define\('[a-z]+', k, \{ label, defaults: \{ terms: ''/.test(s), ad)); ok('belge türleri garanti metnini kapatır');
// Tek satırlı kod: satır içi // yorumu satırın kalanını yutmasın (denetimde bir kez oldu)
{ const s = danisan.split(/\r?\n/).find((l) => l.includes('function clientPage') || l.includes('const yon =')); assert.ok(s && !/const yon = [^;]*;\s*\/\//.test(s)); assert.ok(danisan.includes("const fz = st(c.owner).branch")); ok('danışan kartı satırı bütün'); }
console.log(`\n${n} test geçti`);
