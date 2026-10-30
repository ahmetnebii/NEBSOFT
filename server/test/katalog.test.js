// Ortak katalog testi. Saf kurallar veritabanısız, uçlar MariaDB ile sınanır: kendi "nebsoft_katalog_test" veritabanını kurar ve siler.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= node server/test/katalog.test.js
// Open Food Facts'e gerçek istek gitmez: yerel sahte sunucu çağrıları sayar (1 çağrı = 1 gerçek okutma kanıtı).
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path'); const http = require('http'); const zlib = require('zlib'); const { Readable } = require('stream');
const assert = require('assert');
const mysql = require('mysql2/promise');
const K = require('../cloud/katalog-kural');
const { suz } = require('../../scripts/katalog-off-al');

let n = 0; const ok = (a) => { n++; console.log('  ✓', a); };
const PORT = Number(process.env.TEST_KATALOG_PORT) || 5098; const OFFP = PORT + 100;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || '';
const VT = 'nebsoft_katalog_test'; const BASE = `http://127.0.0.1:${PORT}`; const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nskat-'));
const gtin13 = (s12) => { let t = 0; for (let i = 0; i < 12; i++) t += Number(s12[i]) * (i % 2 ? 3 : 1); return s12 + ((10 - (t % 10)) % 10); };
const G = (i) => gtin13('869' + String(1000000 + i).padStart(9, '0'));

function saf() {
  for (const g of ['4006381333931', '96385074', '036000291452', '10012345678902']) assert.ok(K.gtinDogru(g), g);
  for (const g of ['4006381333932', '1234567', '123456789012345', '', '00000000', 'abc']) assert.ok(!K.gtinDogru(g), g);
  ok('GTIN-8/12/13/14 kontrol hanesi doğrulanır, hatalı olan reddedilir');
  assert.equal(K.gtinKanon('036000291452'), K.gtinKanon('0036000291452')); assert.equal(K.gtinGoster(K.gtinKanon('96385074')), '96385074'); assert.equal(K.gtinGoster(K.gtinKanon('4006381333931')), '4006381333931'); ok('aynı ürünün 12 ve 13 haneli yazımı tek kayda iner');
  assert.equal(K.oneriTemizle({ gtin: gtin13('200000000001'), ad: 'Peynir' }).neden, 'iç kullanım barkodu'); ok('mağazanın kendi ürettiği barkod ortak kataloğa girmez');
  assert.equal(K.adNorm('ÇİKOLATALI Süt  1 LT'), K.adNorm('çikolatalı süt 1lt')); assert.ok(K.benzerlik('Ülker Çikolatalı Gofret 36 gr', 'Ulker Cikolatali Gofret 36gr') > 0.95); assert.ok(K.benzerlik('Beyaz peynir', 'Domates salçası') < 0.3); ok('normalize Türkçe karşılaştırma');
  const kotu = ['Peynir 0532 111 22 33', 'Süt 05321112233', '+90 532 111 22 33 yağ', 'ali@ornek.com tost', 'Kaşar 10000000146', 'Ahmet Yılmaz', 'Fatma Kaya', 'Ayşe Hanım', 'Mehmet Bey zeytin', 'Müşteri notu', 'veresiye defteri', 'Tel: 2125551212', 'TR33 0006 1005 1978 6457 8413 26', 'https://kisisel.site', 'Kart 4111 1111 1111 1111'];
  for (const s of kotu) assert.ok(K.kisiselVeri(s), 'yakalanmadı: ' + s); ok(`kişisel veri süzgeci ${kotu.length} örüntüyü yakalar`);
  const iyi = ['Ülker Çikolatalı Gofret 36 gr', 'Coca-Cola 330 ml', 'Sütaş Ayran 1 lt', 'Kurukahveci Mehmet Efendi Türk Kahvesi 100 gr', 'Eti Burçak Bisküvi 131 g', 'Domates Salçası 830 g', 'Ali Baba Kuruyemiş Karışımı 250 gr', 'Zeytinyağı 1 L'];
  for (const s of iyi) assert.equal(K.kisiselVeri(s), null, 'yanlış alarm: ' + s); ok('gerçek ürün adları süzgeçten geçer');
  const t = K.oneriTemizle({ gtin: G(1), ad: 'Ürün A', marka: 'M', kategori: 'K', price: 99, fiyat: 99, stock: 5, tenant_id: 'x', isletme: 'y', phone: '0532', musteri: 'z', image: 'u', buy: 1 });
  assert.deepEqual(Object.keys(t.kayit).sort(), ['ad', 'ad_norm', 'gtin', 'kategori', 'marka']); ok('öneri süzgeci yalnız dört alanı alır');
  const c = K.csvOku('Barkod;Ürün Adı;Marka;Kategori;Fiyat;Stok\n' + `${G(2)};"Çay; siyah 1 kg";Doğuş;İçecek;199,90;12\n`); assert.deepEqual(c.satirlar[0], { gtin: G(2), ad: 'Çay; siyah 1 kg', marka: 'Doğuş', kategori: 'İçecek' }); ok('CSV okuyucu tırnaklı alanı okur, fiyat ve stok sütununu almaz');
}
async function akis() {
  const bas = 'code\turl\tproduct_name\tbrands\tcategories_tags\tcountries_tags\timage_small_url\n';
  const sat = [`${G(10)}\thttps://world.openfoodfacts.org/product/${G(10)}\tTürk Ürünü\tMarka\ten:snacks\ten:france,en:turkey\thttps://images.openfoodfacts.org/a.jpg`, `${G(11)}\t\tFransız\tB\t\ten:france\t`, `123\t\tHatalı\t\t\ten:turkey\t`, `${G(12)}\t\t\t\t\ten:turkey\t`];
  const gz = zlib.gzipSync(bas + sat.join('\n') + '\n'); const say = {}; const L = [];
  for await (const r of suz(Readable.from(gz).pipe(zlib.createGunzip()), K, { say })) L.push(r);
  assert.equal(L.length, 1); assert.equal(L[0].ad, 'Türk Ürünü'); assert.equal(L[0].kategori, 'en:snacks'); assert.equal(say.atlanan, 2); ok('OFF dışa aktarımı akışla okunur: yalnız Türkiye ve geçerli GTIN alınır');
  await assert.rejects(async () => { for await (const r of suz(Readable.from('a\tb\n1\t2\n'), K)) void r; }, /beklenen sütun/); ok('dosya biçimi değişmişse aktarım durur');
  const mem = process.memoryUsage().heapUsed; let g = 0; const buyuk = Readable.from((function* () { yield bas; for (let i = 0; i < 300000; i++) yield `${G(i)}\t\tÜrün ${i}\tM\t\ten:turkey\t\n`; })());
  for await (const r of suz(buyuk, K)) { g += r.ad.length ? 1 : 0; } assert.equal(g, 300000); assert.ok(process.memoryUsage().heapUsed - mem < 150e6, 'bellek büyüdü'); ok('300.000 satırda bellek şişmez');
}

function istemci() {
  let cookie = ''; return async (method, url, body) => { const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', 'x-ns-csrf': '1', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; let j = null; try { j = await r.json(); } catch (e) { /* yok */ } return { status: r.status, j }; };
}

async function uclar() {
  let cagri = 0; const off = http.createServer((q, s) => { cagri++; const code = q.url.split('/').pop().split('.')[0]; assert.ok(/NEBSOFT/.test(q.headers['user-agent'])); if (code === G(30)) { s.writeHead(200, { 'Content-Type': 'application/json' }); return s.end(JSON.stringify({ status: 1, product: { product_name: 'Canlı Ürün', brands: 'CanlıMarka', categories_tags: ['en:snacks'], image_front_small_url: 'https://images.openfoodfacts.org/x.jpg' } })); } s.writeHead(404); s.end('{}'); });
  await new Promise((r) => off.listen(OFFP, '127.0.0.1', r));
  const root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true });
  await root.query(`DROP DATABASE IF EXISTS ${VT}; CREATE DATABASE ${VT} CHARACTER SET utf8mb4; USE ${VT};
    CREATE TABLE product_pool (barcode VARCHAR(32) PRIMARY KEY, name VARCHAR(200) NOT NULL, brand VARCHAR(120), image VARCHAR(400), category VARCHAR(80), uses INT NOT NULL DEFAULT 1, source VARCHAR(16), updated DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  await root.query('INSERT INTO product_pool (barcode,name,brand,image,category,source,updated) VALUES ?', [[[G(20), 'OFF Bisküvi', 'Marka', 'https://images.openfoodfacts.org/b.jpg', 'en:snacks', 'off', new Date()], [G(21), 'Havuz Çayı', 'Doğuş', null, 'İçecek', 'isletme', new Date()], [G(22), 'Ayşe Hanım 05321112233', null, null, null, 'isletme', new Date()], ['8691234567891', 'Hatalı Barkodlu Ürün', null, null, null, 'isletme', new Date()], ['12345', 'Hatalı OFF', null, null, null, 'off', new Date()]]]);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'katalog-test', HOST: '127.0.0.1', OFF_API_TABAN: `http://127.0.0.1:${OFFP}/product/` }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  const X = async (t, ...a) => { const [rows] = await root.query(`SELECT * FROM ${VT}.${t}`, ...a); return rows; };
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(log); i++) await new Promise((r) => setTimeout(r, 100));
    const Y = istemci(), M = istemci(), Z = istemci(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await Y('POST', '/api/setup/db', { host: DBH, database: VT, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await Y('POST', '/api/setup/admin', { email: 'admin@kat.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await M('POST', '/api/auth/register', { email: 'm@kat.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Market', kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));

    // Göç
    const ext0 = await X('catalog_ext'); assert.equal(ext0.length, 1); assert.equal(ext0[0].ad, 'OFF Bisküvi'); assert.equal(ext0[0].lisans, 'ODbL-1.0'); assert.ok(ext0[0].kaynak_url.includes('openfoodfacts.org/product/')); assert.ok(ext0[0].alindi); ok('göç: kaynağı off olan catalog_ext\'e, lisans ve kaynak bilgisiyle gitti');
    const su0 = await X('catalog_suggest'); assert.deepEqual(su0.map((x) => x.ad).sort(), ['Hatalı Barkodlu Ürün', 'Havuz Çayı']); assert.equal(su0.find((x) => x.ad === 'Hatalı Barkodlu Ürün').bayrak, 'hatali_gtin'); ok('göç: işletme kayıtları öneri kuyruğunda, hatalı GTIN işaretli');
    assert.ok(!JSON.stringify(su0).includes('05321112233')); ok('göç: kişisel veri içeren satır taşınmadı');
    assert.equal((await X('catalog_own')).length, 0); assert.equal((await X('product_pool')).length, 5); assert.ok((await X('settings')).some((x) => x.k === 'katalog_goc_1')); ok('göç: kendi kataloğa kimse doğrudan girmedi, product_pool silinmedi, bir kez çalışır');

    // Oturum
    for (const u of [`/api/katalog/barkod/${G(20)}`, '/api/katalog/ara?q=b']) assert.equal((await Z('GET', u)).status, 401); assert.equal((await Z('POST', '/api/katalog/oneri', { items: [] })).status, 401); ok('katalog oturumsuz kullanıcıya kapalı (herkese açık barkod listesi yok)');

    // Barkod sırası
    await root.query(`INSERT INTO ${VT}.catalog_own (gtin,ad,ad_norm,kaynak,lisans,kaynak_url,alindi,guncel) VALUES (?,?,?,?,?,?,NOW(),NOW())`, [K.gtinKanon(G(20)), 'Bizim Bisküvi', 'bizim biskuvi', 'nebsoft', 'NEBSOFT-katalog', 'nebsoft:test']);
    r = await M('GET', `/api/katalog/barkod/${G(20)}?okutma=1`); assert.equal(r.j.item.name, 'Bizim Bisküvi'); assert.equal(r.j.item.source, 'own'); assert.equal(r.j.item.atif, null); assert.equal(cagri, 0); ok('sıra: önce catalog_own, OFF\'a gidilmez');
    await root.query(`INSERT INTO ${VT}.catalog_ext (gtin,kaynak,ad,lisans,kaynak_url,alindi) VALUES (?,?,?,?,?,NOW())`, [K.gtinKanon(G(25)), 'off', 'Dış Ürün', 'ODbL-1.0', 'https://world.openfoodfacts.org/product/' + G(25)]);
    r = await M('GET', `/api/katalog/barkod/${G(25)}?okutma=1`); assert.equal(r.j.item.source, 'off'); assert.equal(cagri, 0); ok('sıra: sonra catalog_ext');
    const at = r.j.item.atif; assert.equal(at.kaynak, 'Open Food Facts'); assert.ok(at.kaynak_url.includes(G(25))); assert.match(at.lisans_url, /odbl/); ok('OFF kaydı atıf ve lisans bağlantısıyla döner');
    r = await M('GET', `/api/katalog/barkod/${G(30)}`); assert.equal(r.j.item, null); assert.equal(cagri, 0); ok('okutma olmadan OFF\'a çağrı gitmez');
    r = await M('GET', `/api/katalog/barkod/${G(30)}?okutma=1`); assert.equal(r.j.item.name, 'Canlı Ürün'); assert.equal(r.j.item.atif.gorsel_lisans, 'CC BY-SA 3.0'); assert.equal(cagri, 1); ok('gerçek okutmada OFF canlı, görsel CC BY-SA atfıyla');
    r = await M('GET', `/api/katalog/barkod/${G(30)}?okutma=1`); assert.equal(cagri, 1); assert.ok((await X('catalog_ext')).some((x) => x.ad === 'Canlı Ürün' && x.lisans === 'ODbL-1.0')); ok('ikinci okutma önbellekten: catalog_ext\'e yazıldı, yeni API çağrısı yok');
    for (let i = 0; i < 2; i++) await M('GET', `/api/katalog/barkod/${G(31)}?okutma=1`); assert.equal(cagri, 2); ok('bulunamayan barkod tekrar sorulmaz');
    assert.equal((await M('GET', '/api/katalog/barkod/8691234567891')).status, 400); assert.equal(cagri, 2); ok('kontrol hanesi hatalı barkod 400 döner, dışarı sorulmaz');
    r = await M('GET', '/api/katalog/ara?q=Canlı'); assert.equal(r.j.items.length, 1); assert.ok(r.j.items[0].atif); assert.equal(cagri, 2); ok('arama OFF API\'sini çağırmaz (1 çağrı = 1 okutma)');
    r = await M('GET', `/api/katalog/ara?q=Bisküvi`); assert.deepEqual(r.j.items.map((x) => x.name), ['Bizim Bisküvi']); ok('üstüne yazma kaydı varsa dış kayıt aramada gizlenir');

    // Öneri: fazladan alanlar yok sayılır
    const once = (await X('catalog_suggest')).length;
    r = await M('POST', '/api/katalog/oneri', { items: [{ gtin: G(40), ad: 'Yeni Ürün', marka: 'Marka', kategori: 'Gıda', price: 123.45, stok: 77, tenant_id: 'GIZLI-ISLETME', isletme: 'Veli Market', musteri: 'Gizli Müşteri', telefon: '05329998877', image: 'https://x.test/a.jpg' }, { gtin: G(41), ad: 'Ayşe Yılmaz' }, { gtin: G(42), ad: 'Peynir 05321112233' }, { gtin: G(43), ad: 'Süt', marka: 'ali@ornek.com' }, { gtin: '8691234567891', ad: 'Hatalı' }, { gtin: G(44), ad: 'OFF Kaydı', source: 'off' }, { gtin: G(25), ad: 'Dış Ürün' }] });
    assert.equal(r.j.eklenen, 1); assert.equal(r.j.reddedilen, 4); assert.equal(r.j.atlanan, 2); const sg = await X('catalog_suggest'); assert.equal(sg.length, once + 1); const y = sg.find((x) => x.ad === 'Yeni Ürün');
    assert.ok(!/123\.45|77|GIZLI|Veli|Gizli|0532999|x\.test/.test(JSON.stringify(y))); ok('sunucu fazladan alanları yok sayar: fiyat, stok, işletme, müşteri tabloya girmez');
    const [sut] = await root.query(`SHOW COLUMNS FROM ${VT}.catalog_suggest`); assert.ok(!sut.some((c) => /tenant|isletme|user|kullanici|fiyat|price|stok/i.test(c.Field))); ok('öneri tablosunda işletme, fiyat, stok sütunu yok');
    assert.ok(!sg.some((x) => /Ayşe Yılmaz|05321112233|ali@/.test(x.ad + x.marka))); ok('telefon, e-posta ve kişi adı içeren öneri reddedildi');
    assert.ok(!sg.some((x) => x.ad === 'OFF Kaydı' || x.ad === 'Dış Ürün')); ok('OFF kaydı öneri yoluyla bizim tabloya sızmaz');
    await M('POST', '/api/katalog/oneri', { items: [{ gtin: G(40), ad: 'Yeni Ürün' }] }); assert.equal((await X('catalog_suggest')).find((x) => x.ad === 'Yeni Ürün').sayac, 2); ok('aynı öneri çoğaltılmaz, sayaç artar');
    assert.equal((await M('POST', '/api/katalog/oneri', { items: [{ barcode: G(45), name: 'Eski İstemci Ürünü' }] })).j.eklenen, 1); ok('eski alan adlarıyla gelen öneri de süzgeçten geçer');
    assert.match(log, /katalog\.oneri/); assert.ok(!log.split('\n').filter((l) => l.includes('katalog.oneri')).some((l) => /Yeni Ürün|Veli|m@kat/.test(l))); ok('katalog.oneri olayı ortak şemada, yalnız sayılar');

    // Moderasyon
    assert.equal((await M('GET', '/api/admin/katalog/oneriler')).status, 403); ok('moderasyon yalnız yöneticiye açık');
    r = await Y('POST', '/api/auth/login', { email: 'admin@kat.test', pass: 'GucluSifre2026!' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    await M('POST', '/api/katalog/oneri', { items: [{ gtin: G(40), ad: 'Yeni Urun Farkli Isim' }, { gtin: G(25), ad: 'Başka Ad' }, { gtin: G(50), ad: 'Bizim Biskuvi Kakaolu' }] });
    r = await Y('GET', '/api/admin/katalog/oneriler'); const Q = r.j.rows; const bul = (a) => Q.find((x) => x.ad === a);
    assert.ok(bul('Hatalı Barkodlu Ürün').bayraklar.includes('hatali_gtin')); ok('kuyruk: hatalı GTIN işaretlenir');
    assert.ok(bul('Yeni Ürün').bayraklar.includes('ayni_gtin_farkli_ad')); assert.ok(bul('Başka Ad').bayraklar.includes('ayni_gtin_farkli_ad')); ok('kuyruk: aynı GTIN farklı ad işaretlenir (öneri ve OFF kaydına karşı)');
    await root.query(`INSERT INTO ${VT}.catalog_own (gtin,ad,ad_norm,kaynak,lisans,kaynak_url,alindi,guncel) VALUES (?,?,?,?,?,?,NOW(),NOW())`, [K.gtinKanon(G(51)), 'Çikolatalı Gofret 36 gr', K.adNorm('Çikolatalı Gofret 36 gr'), 'nebsoft', 'NEBSOFT-katalog', 'nebsoft:test']);
    await M('POST', '/api/katalog/oneri', { items: [{ gtin: G(52), ad: 'Cikolatali Gofret 36gr' }] }); r = await Y('GET', '/api/admin/katalog/oneriler?filtre=benzer_ad'); assert.ok(r.j.rows.some((x) => x.ad === 'Cikolatali Gofret 36gr' && x.benzer[0].oran > 0.8)); ok('kuyruk: benzer ad, normalize Türkçe karşılaştırmayla bulunur');
    const hatali = bul('Hatalı Barkodlu Ürün'); assert.equal((await Y('POST', `/api/admin/katalog/oneri/${hatali.id}/onay`, {})).status, 400); ok('hatalı GTIN onaylanamaz');
    const kisi = bul('Havuz Çayı'); assert.equal((await Y('POST', `/api/admin/katalog/oneri/${kisi.id}/onay`, { ad: 'Ahmet Yılmaz' })).status, 400); ok('yönetici düzeltmesi de kişisel veri süzgecinden geçer');
    r = await Y('POST', `/api/admin/katalog/oneri/${kisi.id}/onay`, { ad: 'Çay 1 kg' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); const ow = (await X('catalog_own')).find((x) => x.ad === 'Çay 1 kg'); assert.equal(ow.kaynak, 'havuz-goc'); assert.ok(ow.lisans && ow.kaynak_url && ow.alindi); ok('onay: kayıt catalog_own\'a kaynak, lisans, adres ve tarihle girer');
    assert.equal((await Y('POST', `/api/admin/katalog/oneri/${kisi.id}/onay`, {})).status, 409); ok('karara bağlanmış öneri yeniden işlenmez');
    r = await M('GET', `/api/katalog/barkod/${G(21)}`); assert.equal(r.j.item.name, 'Çay 1 kg'); ok('onaylı kayıt barkodla bulunur');
    const ba = bul('Başka Ad'); const extOnce = JSON.stringify((await X('catalog_ext')).find((x) => x.ad === 'Dış Ürün'));
    r = await Y('POST', `/api/admin/katalog/oneri/${ba.id}/onay`, {}); assert.equal(r.j.ok, true); assert.equal((await X('catalog_own')).find((x) => x.ad === 'Başka Ad').ust_kaynak, 'off'); assert.equal(JSON.stringify((await X('catalog_ext')).find((x) => x.ad === 'Dış Ürün')), extOnce); ok('OFF kaydı değişmez, düzeltme catalog_own\'da üstüne yazma kaydı olur');
    r = await M('GET', `/api/katalog/barkod/${G(25)}`); assert.equal(r.j.item.name, 'Başka Ad'); assert.equal(r.j.item.source, 'own'); ok('üstüne yazma kaydı barkod sorgusunda önce gelir');
    const [cift] = await root.query(`SELECT o.gtin FROM ${VT}.catalog_own o JOIN ${VT}.catalog_ext e ON e.gtin=o.gtin AND e.ad=o.ad`); assert.equal(cift.length, 0); ok('iki veri aynı tabloda birleşmez: catalog_own\'da OFF verisi kopyası yok');
    const bi = bul('Yeni Urun Farkli Isim'); await Y('POST', `/api/admin/katalog/oneri/${bul('Yeni Ürün').id}/onay`, {});
    r = await Y('POST', `/api/admin/katalog/oneri/${bi.id}/birlestir`, { hedef_gtin: G(40), ad: 'Yeni Ürün 500 g' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); const mid = r.j.id;
    assert.equal((await M('GET', `/api/katalog/barkod/${G(40)}`)).j.item.name, 'Yeni Ürün 500 g'); const mr = (await X('catalog_merge'))[0]; assert.equal(JSON.parse(mr.onceki).ad, 'Yeni Ürün'); assert.equal((await X('catalog_suggest')).find((x) => x.id === bi.id).durum, 'birlesti'); ok('birleştirme: catalog_merge kaydı önceki hâli tutar');
    assert.match(log + (await X('audit')).map((a) => a.action).join(' '), /katalog\.birlestirme/); ok('katalog.birlestirme olayı kaydedildi');
    r = await Y('POST', `/api/admin/katalog/birlestirme/${mid}/geri-al`); assert.equal(r.j.ok, true, JSON.stringify(r.j)); assert.equal((await M('GET', `/api/katalog/barkod/${G(40)}`)).j.item.name, 'Yeni Ürün'); assert.equal((await X('catalog_suggest')).find((x) => x.id === bi.id).durum, 'bekliyor'); ok('birleştirme geri alınır: eski hâl döner, öneri kuyruğa geçer');
    assert.equal((await Y('POST', `/api/admin/katalog/birlestirme/${mid}/geri-al`)).status, 409); ok('aynı birleştirme iki kez geri alınamaz');
    r = await Y('POST', `/api/admin/katalog/oneri/${bul('Bizim Biskuvi Kakaolu').id}/ret`, { neden: 'mükerrer' }); assert.equal(r.j.ok, true); assert.equal((await X('catalog_suggest')).find((x) => x.ad === 'Bizim Biskuvi Kakaolu').durum, 'reddedildi'); ok('ret: öneri kataloğa girmez');

    // Tedarikçi
    const csv = `Barkod;Ürün Adı;Marka;Kategori;Fiyat\n${G(60)};Bulgur 1 kg;Duru;Bakliyat;45,50\n8691234567891;Hatalı Satır;;;10\n${G(61)};Ayşe Yılmaz;;;10\n`;
    assert.equal((await Y('POST', '/api/admin/katalog/tedarikci', { csv, kaynak: 'Toptancı A' })).status, 400); assert.equal((await Y('POST', '/api/admin/katalog/tedarikci', { csv, lisans: 'izin' })).status, 400); ok('tedarikçi listesinde kaynak ve lisans/izin zorunlu');
    const a0 = (await X('catalog_suggest')).length; r = await Y('POST', '/api/admin/katalog/tedarikci', { csv, kaynak: 'Toptancı A', lisans: 'Yazılı izin 01.10.2026', onizleme: true }); assert.equal(r.j.gecerli, 1); assert.equal((await X('catalog_suggest')).length, a0); ok('tedarikçi önizlemesi hiçbir şey yazmaz');
    r = await Y('POST', '/api/admin/katalog/tedarikci', { csv, kaynak: 'Toptancı A', lisans: 'Yazılı izin 01.10.2026' }); assert.deepEqual([r.j.gecerli, r.j.hataliGtin, r.j.reddedilen], [1, 1, 1]); const ts = (await X('catalog_suggest')).find((x) => x.ad === 'Bulgur 1 kg'); assert.equal(ts.kaynak, 'tedarikci:Toptancı A'); assert.equal(ts.izin, 'Yazılı izin 01.10.2026'); assert.ok(!/45,50/.test(JSON.stringify(ts))); assert.equal((await X('catalog_own')).filter((x) => x.ad === 'Bulgur 1 kg').length, 0); ok('tedarikçi listesi moderasyona düşer, fiyat alınmaz, doğrudan yayınlanmaz');

    // Şablon uçları
    r = await Z('GET', '/api/sablon/randevu'); assert.ok(r.j.sablonlar.some((s) => s.sablon === 'randevu/sayfa-temalari')); assert.equal((await Z('GET', '/api/sablon/yok')).status, 404); ok('şablon listesi programa göre döner');
    r = await M('POST', '/api/sablon/olay', { sablon: 'randevu/berber-hizmetleri', surum: 1, eklenen: 11, atlanan: 0, gizli: 'x' }); assert.equal(r.j.ok, true); await new Promise((s) => setTimeout(s, 100)); assert.match(log, /sablon\.iceri_aktarildi/); ok('sablon.iceri_aktarildi olayı kaydedildi');
    assert.equal((await M('POST', '/api/sablon/olay', { sablon: 'yok/yok' })).status, 400); ok('olmayan şablon için olay yazılmaz');
    for (const f of ['/content/../server/cloud/db.js', '/docs/KATALOG-LISANS.md', '/scripts/katalog-off-al.js']) assert.equal((await fetch(BASE + f)).status, 404, f); ok('betik ve belgeler dışarı sunulmuyor');
  } catch (e) { console.error(log.slice(-3000)); throw e; } finally { srv.kill(); off.close(); await root.query(`DROP DATABASE IF EXISTS ${VT}`).catch(() => {}); await root.end(); }
}

(async () => { saf(); await akis(); await uclar(); console.log(`\nKatalog testi: ${n} denetim geçti`); process.exit(0); })().catch((e) => { console.error(e); process.exit(1); });
