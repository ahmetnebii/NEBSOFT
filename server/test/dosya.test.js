// Dosya deposu: içerik doğrulama, gizli sınıf, kota, silme ve eski kayıt geçişi. Saf işlevler + gerçek MariaDB ile uçtan uca.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/dosya.test.js
// Kendi geçici veri klasörünü ve "ns_dosya_test" veritabanını kullanır, sonunda siler.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const http = require('http'); const crypto = require('crypto');
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
const ROOT = path.join(__dirname, '..', '..');
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsdosya-'));
process.env.NEBSOFT_SECRET = 'test-secret-dosya'; delete process.env.NEBSOFT_SECRET_ESKI; process.env.NEBSOFT_DATA = DATA; delete process.env.NEBSOFT_DOSYALAR;
const belge = require('../cloud/belge'); const db = require('../cloud/db'); const dosya = require('../cloud/dosya'); const K = require('../cloud/rol-kural'); const sec = require('../cloud/security'); const seo = require('../cloud/seo');

const PORT = Number(process.env.TEST_PORT || 5199) + 8, DBN = 'ns_dosya_test', KOTA_MB = 0.1;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const B = `http://127.0.0.1:${PORT}`;
let n = 0; const ok = (m) => { n++; console.log('  ✓ ' + m); };

// Çok küçük ama yapısı geçerli görseller. pad: içeriği büyütür ve her dosyayı farklı yapar
const yorum = (pad) => { const g = Buffer.concat([Buffer.from(`NSGIZLIMETIN${crypto.randomBytes(8).toString('hex')}`), Buffer.alloc(pad)]); const h = Buffer.alloc(4); h.writeUInt16BE(0xfffe, 0); h.writeUInt16BE(g.length + 2, 2); return Buffer.concat([h, g]); };
const jpg = (pad = 0) => Buffer.concat([Buffer.from([0xff, 0xd8]), yorum(pad), Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x10, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9])]);
const png = () => { const b = Buffer.alloc(40); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b); b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1'); b.writeUInt32BE(16, 16); b.writeUInt32BE(16, 20); return b; };
const webp = () => { const b = Buffer.alloc(40); b.write('RIFF', 0, 'latin1'); b.writeUInt32LE(32, 4); b.write('WEBPVP8L', 8, 'latin1'); b.writeUInt32LE(20, 16); b[20] = 0x2f; b.writeUInt32LE(15 | (15 << 14), 21); return b; };
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML = Buffer.from('<!doctype html><html><script>alert(document.cookie)</script></html>');
const dataUri = (b, t = 'image/jpeg') => `data:${t};base64,${b.toString('base64')}`;

function saf() {
  console.log('Saf işlevler');
  const T = dosya.turBul;
  assert.equal(T(jpg()), 'image/jpeg'); assert.equal(T(png()), 'image/png'); assert.equal(T(webp()), 'image/webp'); ok('JPEG, PNG, WebP baytlardan tanınıyor');
  for (const b of [SVG, HTML, Buffer.alloc(0), Buffer.from([0xff, 0xd8, 0xff]), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), HTML]), Buffer.concat([png().subarray(0, 12), HTML]), Buffer.from('RIFF....WEBP')]) assert.equal(T(b), null);
  assert.equal(T('metin'), null); ok('SVG, HTML ve görsel başlığı taklit eden içerik reddediliyor');
  const p0 = png(); p0.writeUInt32BE(0, 16); assert.equal(T(p0), null); ok('boyutu sıfır görsel reddediliyor');

  const d = jpg(50); const e = belge.dosyaKapat('t1', 'a'.repeat(32), d); assert.ok(!e.includes('NSGIZLIMETIN')); assert.ok(belge.dosyaAc('t1', 'a'.repeat(32), e).equals(d)); ok('gizli dosya şifreli, açılınca aynı bayt');
  assert.throws(() => belge.dosyaAc('t2', 'a'.repeat(32), e)); assert.throws(() => belge.dosyaAc('t1', 'b'.repeat(32), e)); assert.throws(() => belge.dosyaAc('t1', 'a'.repeat(32), d)); const boz = Buffer.from(e); boz[boz.length - 1] ^= 1; assert.throws(() => belge.dosyaAc('t1', 'a'.repeat(32), boz)); ok('başka işletmede, başka adla, düz veya değiştirilmiş dosya açılmıyor');
  const es = process.env.NEBSOFT_SECRET; process.env.NEBSOFT_SECRET = 'yeni'; assert.throws(() => belge.dosyaAc('t1', 'a'.repeat(32), e)); process.env.NEBSOFT_SECRET_ESKI = es; assert.ok(belge.dosyaAc('t1', 'a'.repeat(32), e).equals(d)); process.env.NEBSOFT_SECRET = es; delete process.env.NEBSOFT_SECRET_ESKI; ok('anahtar değişiminde eski anahtarla açılıyor');

  K.RULES.galeri.izleyici = { saltOkunur: ['vehicles'] }; K.RULES.galeri.kapali = { kapat: ['vehicles'] }; assert.equal(K.yazabilir('galeri', 'izleyici', 'vehicles'), false); assert.equal(K.yazabilir('galeri', 'kapali', 'vehicles'), false); assert.equal(K.yazabilir('galeri', 'satis', 'vehicles'), true); delete K.RULES.galeri.izleyici; delete K.RULES.galeri.kapali; ok('koleksiyona yazamayan rol kuralı');

  const h = {}; sec.headers({ headers: {}, socket: {} }, { setHeader: (k, v) => { h[k] = v; } });
  for (const c of [h['Content-Security-Policy'], seo.SITE_CSP]) { const d2 = c.split('; ').find((x) => x.startsWith('img-src ')); assert.ok(d2.includes("'self'") && d2.includes('data:')); } ok('CSP img-src sunucu adresine ve eski gömülü görsele izin veriyor');
  const core = fs.readFileSync(path.join(ROOT, 'core', 'core.js'), 'utf8'); assert.ok(/window\.NS = \{\s+api, dosya,/.test(core)); for (const p of ['eticaret', 'galeri', 'kiralama']) assert.ok(!/\bshrink\b/.test(fs.readFileSync(path.join(ROOT, 'apps', p, 'app.js'), 'utf8'))); ok('NS.dosya dışa açık, üç program ortak yardımcıya geçti');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'); assert.ok(!/SHELL = \[[^\]]*\/f\//.test(sw)); assert.ok(sw.includes("startsWith('/f/')")); ok('service worker dosyaları önbelleğe almıyor');
  const pk = fs.readFileSync(path.join(ROOT, 'scripts', 'hosting-paketi.js'), 'utf8'); assert.ok(pk.includes('/^dosyalar(\\/|$)/')); assert.ok(/^dosyalar\//m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8'))); ok('dosya klasörü pakete ve depoya girmiyor');
}

async function uctanUca() {
  console.log('Uçtan uca (MariaDB)');
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4; DROP USER IF EXISTS 'ns_dosya'@'127.0.0.1'; CREATE USER 'ns_dosya'@'127.0.0.1' IDENTIFIED BY 'DosyaTest123'; GRANT ALL ON ${DBN}.* TO 'ns_dosya'@'127.0.0.1'; FLUSH PRIVILEGES;`);
  await root.query(`USE ${DBN}`);
  const baslat = () => { const s = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DOSYA_KOTA_MB: String(KOTA_MB) }, stdio: ['ignore', 'pipe', 'pipe'] }); s.log = ''; s.stdout.on('data', (d) => { s.log += d; }); s.stderr.on('data', (d) => { s.log += d; }); return s; };
  const bekle = async (s) => { for (let i = 0; i < 80 && !/çalışıyor/.test(s.log); i++) await new Promise((r) => setTimeout(r, 100)); };
  const client = () => { let ck = ''; const f = async (m, p, body, ek = {}) => { const ham = Buffer.isBuffer(body); const r = await fetch(B + p, { method: m, redirect: 'manual', headers: { 'Content-Type': ham ? ek.tur || 'application/octet-stream' : 'application/json', ...(ek.csrfYok ? {} : { 'x-ns-csrf': '1' }), Origin: B, Cookie: ck, ...(ek.basliklar || {}) }, body: body === undefined ? undefined : ham ? body : JSON.stringify(body) }); const c = r.headers.getSetCookie(); if (c.length) ck = c.map((x) => x.split(';')[0]).join('; '); const buf = Buffer.from(await r.arrayBuffer()); let j = {}; try { j = JSON.parse(buf.toString('utf8')); } catch (e) { /* ikili */ } return { status: r.status, j, buf, h: r.headers }; }; return f; };
  // fetch "../" dizilerini düzeltir; yol aşımı ham istekle gönderilir
  const ham = (yol) => new Promise((res, rej) => { const r = http.request({ host: '127.0.0.1', port: PORT, path: yol, method: 'GET' }, (x) => { const c = []; x.on('data', (d) => c.push(d)); x.on('end', () => res({ status: x.statusCode, body: Buffer.concat(c).toString('utf8') })); }); r.on('error', rej); r.end(); });
  const satir = async (id) => (await root.query('SELECT * FROM dosyalar WHERE id=?', [id]))[0][0];
  const disk = (tid, ad) => path.join(DATA, 'dosyalar', tid, ad);
  const idOf = (u) => u.split('/').pop();
  let srv = baslat();
  try {
    await bekle(srv); const O = client(), Y = client(), D = client(), A = client(), U = client();
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: '127.0.0.1', database: DBN, user: 'ns_dosya', password: 'DosyaTest123', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: 'admin@dosya.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true);
    r = await O('POST', '/api/auth/register', { email: 'sahip@dosya.test', pass: 'Sifre1234', name: 'Aylin', phone: '05321112233', company: 'Oto Aylin', kvkk: true, product: 'galeri' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    await O('POST', '/api/trial', { product: 'kiralama' }); await O('POST', '/api/trial', { product: 'eticaret' }); await O('POST', '/api/trial', { product: 'klinik' });
    r = await D('POST', '/api/auth/register', { email: 'diger@dosya.test', pass: 'Sifre1234', name: 'Burak', phone: '05321112244', company: 'Burak Rent', kvkk: true, product: 'kiralama' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    const [[me]] = await root.query("SELECT t.id, t.slug FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE u.email='sahip@dosya.test'"); const [[ot]] = await root.query("SELECT t.id FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE u.email='diger@dosya.test'");

    // Yükleme kapıları
    const j1 = jpg(100); r = await A('POST', '/api/dosya?app=galeri', j1); assert.equal(r.status, 401); r = await O('POST', '/api/dosya?app=galeri', j1, { csrfYok: true }); assert.equal(r.status, 403); ok('oturumsuz ve CSRF başlıksız yükleme reddedildi');
    r = await O('POST', '/api/dosya?app=klinik', j1); assert.equal(r.status, 400); r = await O('POST', '/api/dosya?app=..%2F..%2Fdata', j1); assert.equal(r.status, 400); r = await D('POST', '/api/dosya?app=galeri', j1); assert.equal(r.status, 402); ok('desteklenmeyen program ve lisanssız program yükleyemiyor');

    // Açık dosya
    r = await O('POST', '/api/dosya?app=galeri', j1, { tur: 'application/json' }); assert.equal(r.status, 200, JSON.stringify(r.j)); const u1 = r.j.url; const id1 = r.j.id; assert.equal(u1, `/f/${me.id}/${id1}`); assert.ok(/^[0-9a-f]{32}$/.test(id1)); assert.ok(fs.existsSync(disk(me.id, `${id1}.jpg`))); assert.ok(fs.readFileSync(disk(me.id, `${id1}.jpg`)).equals(j1)); ok('gönderilen tür başlığı yok sayıldı, rastgele adla diske yazıldı');
    r = await A('GET', u1); assert.equal(r.status, 200); assert.ok(r.buf.equals(j1)); assert.equal(r.h.get('content-type'), 'image/jpeg'); assert.equal(r.h.get('x-content-type-options'), 'nosniff'); assert.ok(/max-age=31536000/.test(r.h.get('cache-control')) && /immutable/.test(r.h.get('cache-control')) && /public/.test(r.h.get('cache-control'))); assert.ok(/sandbox/.test(r.h.get('content-security-policy'))); ok('açık dosya oturumsuz okunuyor: doğru tür, nosniff, uzun önbellek');
    r = await A('GET', u1, undefined, { basliklar: { 'If-None-Match': `"${id1}"` } }); assert.equal(r.status, 304); r = await A('HEAD', u1); assert.equal(r.status, 200); assert.equal(r.buf.length, 0); ok('304 ve HEAD çalışıyor');
    r = await O('POST', '/api/dosya?app=eticaret', png()); assert.equal(r.status, 200); assert.ok(fs.existsSync(disk(me.id, `${r.j.id}.png`))); assert.equal((await A('GET', r.j.url)).h.get('content-type'), 'image/png'); r = await O('POST', '/api/dosya?app=eticaret', webp()); assert.equal(r.status, 200); assert.equal((await A('GET', r.j.url)).h.get('content-type'), 'image/webp'); ok('PNG ve WebP kendi türüyle sunuluyor');

    // Sahte içerik
    const dosyaSay = async () => (await root.query('SELECT COUNT(*) AS n FROM dosyalar'))[0][0].n; const once = await dosyaSay(); const liste = () => fs.readdirSync(path.join(DATA, 'dosyalar', me.id)).length; const l0 = liste();
    for (const [b, tur] of [[HTML, 'image/jpeg'], [SVG, 'image/svg+xml'], [SVG, 'image/jpeg'], [Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), HTML]), 'image/jpeg'], [Buffer.alloc(0), 'image/png']]) { r = await O('POST', '/api/dosya?app=galeri&ad=foto.jpg', b, { tur }); assert.equal(r.status, 415, r.buf.toString()); assert.ok(/JPEG, PNG veya WebP/.test(r.j.error)); }
    assert.equal(await dosyaSay(), once); assert.equal(liste(), l0); ok('HTML (uzantı jpg), SVG ve sahte başlıklı içerik reddedildi, diske ve tabloya bir şey yazılmadı');
    r = await O('POST', '/api/dosya?app=galeri', Buffer.alloc(1.2e6, 0xff), { tur: 'image/jpeg' }); assert.equal(r.status, 413); assert.ok(/1 MB/.test(r.j.error)); ok('boyut sınırı Türkçe iletiyle duruyor');

    // Yol aşımı
    const sirYol = path.join(DATA, 'gizli-deneme.txt'); fs.writeFileSync(sirYol, 'SIR-ICERIK');
    for (const y of [`/f/${me.id}/..%2F..%2Fgizli-deneme.txt`, `/f/${me.id}/../../gizli-deneme.txt`, `/f/${me.id}/%2e%2e%2f%2e%2e%2fgizli-deneme.txt`, `/f/..%2F${me.id}/${id1}`, `/f/${me.id}/${id1}.jpg`, `/f/${me.id}/${id1}/`, `/f/${me.id}/${id1.toUpperCase()}`, `/f/${me.id}/..%5C..%5Cgizli-deneme.txt`, `/f/${me.id}/${id1}%00.jpg`, `/data/dosyalar/${me.id}/${id1}.jpg`, `/dosyalar/${me.id}/${id1}.jpg`]) { const x = await ham(y); assert.ok([400, 404].includes(x.status), `${y} → ${x.status}`); assert.ok(!x.body.includes('SIR-ICERIK')); }
    r = await O('DELETE', '/api/dosya/..%2F..%2Fgizli-deneme'); assert.ok([400, 403, 404].includes(r.status)); assert.ok(fs.existsSync(sirYol)); ok('yol aşımı ve dosyaya doğrudan erişim denemeleri 400/404, klasör dışına çıkılmadı');

    // Gizli dosya
    const j2 = jpg(200); r = await O('POST', '/api/dosya?app=kiralama&sinif=acik', j2); assert.equal(r.status, 200, JSON.stringify(r.j)); const u2 = r.j.url; const id2 = r.j.id;
    assert.equal((await satir(id2)).sinif, 'gizli'); const enc = fs.readFileSync(disk(me.id, `${id2}.enc`)); assert.ok(!enc.includes('NSGIZLIMETIN') && !enc.includes(Buffer.from([0xff, 0xd8, 0xff]))); assert.ok(!fs.existsSync(disk(me.id, `${id2}.jpg`))); ok('kiralama fotoğrafı istemci isteğine rağmen gizli sınıfta, diskte şifreli');
    r = await A('GET', u2); assert.equal(r.status, 404); assert.ok(!r.buf.includes('NSGIZLIMETIN')); ok('oturumsuz gizli okuma 404');
    r = await D('GET', u2); assert.equal(r.status, 404); r = await D('GET', `/f/${ot.id}/${id2}`); assert.equal(r.status, 404); r = await Y('GET', u2); assert.equal(r.status, 404); ok('başka işletmenin oturumu ve yönetici gizli dosyayı okuyamıyor');
    r = await O('GET', u2); assert.equal(r.status, 200); assert.ok(r.buf.equals(j2)); assert.equal(r.h.get('cache-control'), 'private, no-store'); assert.equal(r.h.get('etag'), null); ok('aynı işletmenin oturumu okuyor, önbelleğe alınmıyor');
    await new Promise((res) => setTimeout(res, 1100));
    r = await O('POST', '/api/team', { name: 'Üye', email: 'uye@dosya.test', pass: 'Sifre1234' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); await U('POST', '/api/auth/login', { email: 'uye@dosya.test', pass: 'Sifre1234' });
    r = await U('GET', u2); assert.equal(r.status, 200); ok('aynı işletmenin ekip hesabı okuyor');

    // Roller
    await root.query("UPDATE users SET team_roles=? WHERE email='uye@dosya.test'", [JSON.stringify({ galeri: 'satis' })]); r = await U('POST', '/api/dosya?app=galeri', jpg()); assert.equal(r.status, 200, JSON.stringify(r.j));
    await root.query("UPDATE users SET team_roles=? WHERE email='uye@dosya.test'", [JSON.stringify({ galeri: 'olmayan-rol' })]); r = await U('POST', '/api/dosya?app=galeri', jpg()); assert.equal(r.status, 403); r = await U('DELETE', `/api/dosya/${id1}`); assert.equal(r.status, 403); ok('rolü olan yazabiliyor, geçersiz rol yükleyemiyor ve silemiyor');
    await root.query("UPDATE users SET team_roles=NULL WHERE email='uye@dosya.test'"); await root.query("UPDATE licenses SET end=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE tenant_id=? AND product='eticaret'", [me.id]); r = await O('POST', '/api/dosya?app=eticaret', jpg()); assert.equal(r.status, 402); await root.query("UPDATE licenses SET end=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 DAY) WHERE tenant_id=? AND product='eticaret'", [me.id]); ok('lisansı biten program yükleyemiyor');

    // Müşteri sayfası
    const galeriDoc = { users: [{ id: 'u1', name: 'A', role: 'admin', active: true }], vehicles: [{ id: 'v1', brand: 'Fiat', model: 'Egea', status: 'satista', listPrice: 1, photos: [u1] }, { id: 'v2', brand: 'Renault', status: 'hazirlik', photos: [] }], _settings: {}, _meta: {} };
    r = await O('PUT', '/api/data/galeri', { data: galeriDoc, base: 0 }); assert.equal(r.status, 200, JSON.stringify(r.j)); let gs = r.j.version;
    r = await A('POST', `/api/public/${me.slug}/galeri/view`, {}); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.deepEqual(r.j.data.vehicles[0].photos, [u1]); ok('vitrin görünümü yalnız adres taşıyor');
    const kirDoc = { users: [{ id: 'u1', name: 'A', role: 'admin', active: true }], cars: [{ id: 'c1', brand: 'Fiat', status: 'musait' }], customers: [{ id: 'k1', name: 'Müşteri', phone: '05321112200' }], rents: [{ id: 'r1', no: 'K1', car: 'c1', customer: 'k1', from: '2026-01-01', to: '2026-01-02', status: 'kirada', outPhotos: [u2], inPhotos: [] }], _settings: {}, _meta: {} };
    r = await O('PUT', '/api/data/kiralama', { data: kirDoc, base: 0 }); assert.equal(r.status, 200, JSON.stringify(r.j)); const kirV = r.j.version;
    r = await A('POST', `/api/public/${me.slug}/kiralama/view`, {}); assert.ok(!JSON.stringify(r.j).includes(id2)); ok('kiralama müşteri sayfasına gizli adres gitmiyor');

    // Silme ve temizlik
    await db.connect({ host: '127.0.0.1', database: DBN, user: 'ns_dosya', password: 'DosyaTest123' });
    r = await O('DELETE', `/api/dosya/${id1}`); assert.equal(r.status, 409); r = await D('DELETE', `/api/dosya/${id1}`); assert.equal(r.status, 404); r = await A('DELETE', `/api/dosya/${id1}`); assert.equal(r.status, 401); ok('kayıtta duran dosya silinemiyor, başka işletme ve oturumsuz silemiyor');
    galeriDoc.vehicles[0].photos = []; r = await O('PUT', '/api/data/galeri', { data: galeriDoc, base: gs }); gs = r.j.version;
    r = await O('DELETE', `/api/dosya/${id1}`); assert.equal(r.status, 200); assert.ok(r.j.silinecek); assert.ok((await satir(id1)).yetim); r = await A('GET', u1); assert.equal(r.status, 200); ok('referansı kalkan dosya silinince hemen gitmiyor, bekleme başlıyor');
    let t = await dosya.temizle(new Date(Date.now() + 3 * 864e5)); assert.equal(t.silinen, 0); assert.ok(await satir(id1)); ok('7 gün dolmadan temizlik dosyayı silmiyor');
    galeriDoc.vehicles[0].photos = [u1]; r = await O('PUT', '/api/data/galeri', { data: galeriDoc, base: gs }); gs = r.j.version; t = await dosya.temizle(new Date(Date.now() + 8 * 864e5)); assert.equal((await satir(id1)).yetim, null); assert.ok(fs.existsSync(disk(me.id, `${id1}.jpg`))); ok('kayda geri dönen dosya bekleme süresinden çıkıyor');
    galeriDoc.vehicles[0].photos = []; r = await O('PUT', '/api/data/galeri', { data: galeriDoc, base: gs }); gs = r.j.version; await dosya.temizle(); assert.ok((await satir(id1)).yetim); ok('temizlik referansı kalkan dosyayı kendisi işaretliyor');
    // Şifreli programın belgesindeki referans da sayılır
    await root.query('UPDATE dosyalar SET yetim=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY) WHERE id=?', [id1]);
    r = await O('PUT', '/api/data/klinik', { data: { users: [{ id: 'u1', name: 'D', role: 'admin', active: true }], notlar: [u1] }, base: 0 }); assert.equal(r.status, 200, JSON.stringify(r.j));
    await dosya.temizle(); assert.ok(await satir(id1)); assert.equal((await satir(id1)).yetim, null); ok('şifreli belgedeki referans görülüyor, dosya silinmiyor');
    // Açılamayan belge: hiçbir şey silinmez
    await root.query('UPDATE dosyalar SET yetim=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY) WHERE id=?', [id1]);
    const [[kl]] = await root.query("SELECT data FROM app_data WHERE app='klinik' AND tenant_id=?", [me.id]); await root.query("UPDATE app_data SET data=? WHERE app='klinik' AND tenant_id=?", [`${kl.data.slice(0, 40)}AAAA${kl.data.slice(44)}`, me.id]);
    t = await dosya.temizle(); assert.equal(t.silinen, 0); assert.ok(await satir(id1)); assert.ok(fs.existsSync(disk(me.id, `${id1}.jpg`))); await root.query("UPDATE app_data SET data=? WHERE app='klinik' AND tenant_id=?", [JSON.stringify({ users: [] }), me.id]); ok('belgesi açılamayan işletmede temizlik hiçbir şey silmiyor');
    await root.query('UPDATE dosyalar SET yetim=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 8 DAY) WHERE id=?', [id1]); t = await dosya.temizle(); assert.ok(t.silinen >= 1); assert.equal(await satir(id1), undefined); assert.ok(!fs.existsSync(disk(me.id, `${id1}.jpg`))); r = await A('GET', u1); assert.equal(r.status, 404); ok('7 gün sonra dosya hem diskten hem tablodan gidiyor');
    assert.ok(await satir(id2)); ok('kayıtta duran gizli dosya temizlikten etkilenmedi');

    // Kota: işletme başına; diğer işletme etkilenmez
    const P = 45e3; r = await D('POST', '/api/dosya?app=kiralama', jpg(P)); assert.equal(r.status, 200); const k1 = r.j.id; r = await D('POST', '/api/dosya?app=kiralama', jpg(P)); assert.equal(r.status, 200, JSON.stringify(r.j)); const k2 = r.j.id;
    r = await D('POST', '/api/dosya?app=kiralama', jpg(P)); assert.equal(r.status, 507); assert.ok(/Fotoğraf alanınız doldu/.test(r.j.error)); assert.equal(fs.readdirSync(path.join(DATA, 'dosyalar', ot.id)).length, 2); r = await O('POST', '/api/dosya?app=kiralama', jpg()); assert.equal(r.status, 200); ok('kota dolunca Türkçe iletiyle duruyor, reddedilen dosya diskte kalmıyor, diğer işletme etkilenmiyor');
    r = await D('DELETE', `/api/dosya/${k1}`); assert.equal(r.status, 200); r = await D('POST', '/api/dosya?app=kiralama', jpg(P)); assert.equal(r.status, 200, JSON.stringify(r.j)); ok('silinen dosya kullanımdan düşüyor');
    const yarislar = await Promise.all([1, 2, 3, 4, 5].map(() => D('POST', '/api/dosya?app=kiralama', jpg(P)))); assert.equal(yarislar.filter((x) => x.status === 200).length, 0); assert.ok(yarislar.every((x) => x.status === 507)); await root.query('DELETE FROM dosyalar WHERE id=?', [k2]); const ayn = await Promise.all([1, 2, 3, 4, 5].map(() => D('POST', '/api/dosya?app=kiralama', jpg(P)))); assert.equal(ayn.filter((x) => x.status === 200).length, 1, 'kota kilidi'); ok('aynı anda gelen yüklemeler kotayı birlikte aşamıyor');

    // Eski kayıt geçişi
    const eG = jpg(300), eK = jpg(300), eP = png(), bozuk = 'data:image/jpeg;base64,AAAA', svg = dataUri(SVG, 'image/svg+xml');
    await root.query('UPDATE app_data SET data=?, version=40 WHERE app=? AND tenant_id=?', [JSON.stringify({ ...galeriDoc, vehicles: [{ id: 'v1', brand: 'Fiat', status: 'satista', photos: [dataUri(eG), bozuk, svg, dataUri(eG)] }], _settings: { logo: dataUri(eP, 'image/png') } }), 'galeri', me.id]);
    await root.query('UPDATE app_data SET data=?, version=50 WHERE app=? AND tenant_id=?', [JSON.stringify({ ...kirDoc, rents: [{ ...kirDoc.rents[0], outPhotos: [u2, dataUri(eK)], inPhotos: [dataUri(eP, 'image/png')] }] }), 'kiralama', me.id]);
    const gerceqQ = db.q; let bir = true; // sürüm çakışması: geçiş okuduktan sonra işletme kayıt yapmış olsun
    db.q = async (s, p) => { if (bir && /^UPDATE app_data SET data=\?, version=version\+1/.test(s) && p[3] === 'galeri') { bir = false; await root.query("UPDATE app_data SET version=version+1 WHERE app='galeri' AND tenant_id=?", [me.id]); } return gerceqQ(s, p); };
    let g1 = await dosya.gecis(); db.q = gerceqQ; assert.equal(g1.surum, 1, JSON.stringify(g1)); assert.equal(g1.hata, 0); let [[rg]] = await root.query("SELECT data, version FROM app_data WHERE app='galeri' AND tenant_id=?", [me.id]); assert.equal(rg.version, 41); assert.ok(rg.data.includes(eG.toString('base64'))); const dosyaAdet = await dosyaSay(); ok('sürüm değişince belgeye yazılmadı, eski görsel yerinde');
    g1 = await dosya.gecis(); assert.equal(g1.belge, 1); assert.equal(g1.hata, 0); [[rg]] = await root.query("SELECT data, version FROM app_data WHERE app='galeri' AND tenant_id=?", [me.id]); assert.equal(rg.version, 42); assert.equal(await dosyaSay(), dosyaAdet); ok('tekrar çalışınca kaldığı yerden tamamlandı, aynı içerik dosya çoğaltmadı');
    const dg = JSON.parse(rg.data); const ph = dg.vehicles[0].photos; assert.equal(ph.length, 4); assert.equal(ph[0], ph[3]); assert.ok(/^\/f\//.test(ph[0])); assert.equal(ph[1], bozuk); assert.equal(ph[2], svg); assert.equal(dg._settings.logo, dataUri(eP, 'image/png')); assert.equal(dg.vehicles[0].brand, 'Fiat'); ok('bozuk ve SVG görsel olduğu gibi kaldı, fotoğraf alanı dışındaki veri değişmedi');
    r = await A('GET', ph[0]); assert.equal(r.status, 200); assert.ok(r.buf.equals(eG)); ok('taşınan açık dosya aynı baytla sunuluyor');
    const [[rk]] = await root.query("SELECT data, version FROM app_data WHERE app='kiralama' AND tenant_id=?", [me.id]); assert.equal(rk.version, 51); const dk = JSON.parse(rk.data).rents[0]; assert.equal(dk.outPhotos[0], u2); assert.ok(/^\/f\//.test(dk.outPhotos[1]) && /^\/f\//.test(dk.inPhotos[0])); assert.ok(!rk.data.includes('data:image')); r = await A('GET', dk.outPhotos[1]); assert.equal(r.status, 404); r = await O('GET', dk.outPhotos[1]); assert.ok(r.buf.equals(eK)); assert.ok(fs.existsSync(disk(me.id, `${idOf(dk.outPhotos[1])}.enc`))); r = await O('GET', dk.inPhotos[0]); assert.equal(r.h.get('content-type'), 'image/png'); ok('kiralama fotoğrafı gizli sınıfa taşındı, adresi olan da oturumsuz okuyamıyor');
    r = await O('PUT', '/api/data/kiralama', { data: kirDoc, base: kirV }); assert.equal(r.status, 409); assert.equal(r.j.code, 'conflict'); ok('geçişten önce açık kalan sekme eski sürümle üzerine yazamıyor');
    g1 = await dosya.gecis(); assert.equal(g1.belge, 0); const [[rg2]] = await root.query("SELECT version FROM app_data WHERE app='galeri' AND tenant_id=?", [me.id]); assert.equal(rg2.version, 42); ok('yapılacak iş kalmayınca belge ve sürüm değişmiyor');
    // Disk kaybı: kayıt var, dosya yok; eski görsel yeniden yazılabilir
    const kay = jpg(10); await root.query("INSERT INTO app_data (tenant_id, app, data, version, updated) VALUES (?, 'eticaret', '{}', 1, NOW())", [me.id]); await root.query('UPDATE app_data SET data=?, version=60 WHERE app=? AND tenant_id=?', [JSON.stringify({ products: [{ id: 'p1', name: 'Gömlek', photos: [dataUri(kay)] }] }), 'eticaret', me.id]); await dosya.gecis(); let [[re]] = await root.query("SELECT data FROM app_data WHERE app='eticaret' AND tenant_id=?", [me.id]); const iE = idOf(JSON.parse(re.data).products[0].photos[0]); assert.ok(fs.existsSync(disk(me.id, `${iE}.jpg`)));
    fs.unlinkSync(disk(me.id, `${iE}.jpg`)); await root.query('UPDATE app_data SET data=?, version=70 WHERE app=? AND tenant_id=?', [JSON.stringify({ products: [{ id: 'p1', name: 'Gömlek', photos: [dataUri(kay)] }] }), 'eticaret', me.id]); await dosya.gecis(); [[re]] = await root.query("SELECT data FROM app_data WHERE app='eticaret' AND tenant_id=?", [me.id]); r = await A('GET', JSON.parse(re.data).products[0].photos[0]); assert.equal(r.status, 200); assert.ok(r.buf.equals(kay)); ok('diskte kaybolan dosya geçişte yeniden yazıldı');

    // Gerçek açılış: gocEkle ile
    await db.close(); const yeniG = jpg(50); await root.query('UPDATE app_data SET data=?, version=80 WHERE app=? AND tenant_id=?', [JSON.stringify({ products: [{ id: 'p2', name: 'Kaban', photos: [dataUri(yeniG)] }] }), 'eticaret', me.id]);
    srv.kill(); await new Promise((res) => srv.once('exit', res)); srv = baslat(); await bekle(srv); let [[ra]] = [[null]]; for (let i = 0; i < 50; i++) { [[ra]] = await root.query("SELECT data, version FROM app_data WHERE app='eticaret' AND tenant_id=?", [me.id]); if (ra.version === 81) break; await new Promise((res) => setTimeout(res, 100)); } assert.equal(ra.version, 81); r = await A('GET', JSON.parse(ra.data).products[0].photos[0]); assert.ok(r.buf.equals(yeniG)); ok('sunucu açılışında geçiş kendiliğinden çalıştı');

    // Anahtar değişimi
    await db.connect({ host: '127.0.0.1', database: DBN, user: 'ns_dosya', password: 'DosyaTest123' });
    const es = process.env.NEBSOFT_SECRET; process.env.NEBSOFT_SECRET = 'yeni-anahtar'; process.env.NEBSOFT_SECRET_ESKI = es; const m = await dosya.anahtarGecis(); assert.ok(m >= 1); delete process.env.NEBSOFT_SECRET_ESKI; assert.ok(belge.dosyaAc(me.id, id2, fs.readFileSync(disk(me.id, `${id2}.enc`))).equals(j2)); process.env.NEBSOFT_SECRET = es; assert.throws(() => belge.dosyaAc(me.id, id2, fs.readFileSync(disk(me.id, `${id2}.enc`)))); ok('anahtar değişiminde gizli dosyalar yeni anahtara taşınıyor');

    assert.ok(!/nsgizlimetin/i.test(srv.log)); ok('sunucu günlüğünde dosya içeriği yok');
  } finally { srv.kill(); await db.close().catch(() => {}); await root.query(`DROP DATABASE IF EXISTS ${DBN}; DROP USER IF EXISTS 'ns_dosya'@'127.0.0.1';`).catch(() => {}); await root.end(); fs.rmSync(DATA, { recursive: true, force: true }); }
}

(async () => { saf(); await uctanUca(); console.log(`\ndosya: ${n} kontrol geçti`); process.exit(0); })().catch((e) => { console.error(e); process.exit(1); });
