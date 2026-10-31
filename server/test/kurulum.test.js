// Kurulum ve ayarlar: yetki, sunucu doğrulaması, siteye ve sipariş hesabına yansıma, geçmiş siparişin korunması, canlı kilit, gizli bilginin dönmemesi.
//   1. bölüm veritabanı istemez: ölçüm, yer tutucu, geçersiz ayarın yok sayılması, ortam önceliği.
//   2. bölüm uçtan uca çalışır, MySQL ister; kendi veritabanını açar (KURULUM_TEST_DB_NAME ile değişir). MySQL yoksa "ATLANDI" yazar; bu geçti sayılmaz.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawn } = require('child_process');
process.env.NEBSOFT_SECRET = process.env.NEBSOFT_SECRET || 'a'.repeat(64);
const PORT = Number(process.env.KURULUM_TEST_PORT) || 5147; const BASE = `http://127.0.0.1:${PORT}`;
const DBH = process.env.TEST_DB_HOST || '127.0.0.1', DBU = process.env.TEST_DB_USER || 'root', DBP = process.env.TEST_DB_PASS || ''; const DBN = process.env.KURULUM_TEST_DB_NAME || 'nebsoft_kurulum_test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let passed = 0; const ok = (n) => { passed++; console.log('  ✓', n); };

async function birim() {
  console.log('Veritabanısız kurallar');
  const isl = require('../cloud/isletim'); const K0 = process.env.NEBSOFT_DOSYA_KOTA_MB; delete process.env.NEBSOFT_DOSYA_KOTA_MB; delete process.env.IYZICO_CANLI; delete process.env.ETICARET_ODEME_TTL_MS;
  assert.equal(isl.iyzicoCanli(), false); assert.equal(isl.kotaMb(), 2048); assert.equal(isl.odemeMs(), 30 * 60e3);
  isl.ata({ dosyaKotaMb: 500, odemeDk: 10 }, { iyzico: { acik: true } }); assert.equal(isl.iyzicoCanli(), true); assert.equal(isl.kotaMb(), 500); assert.equal(isl.odemeMs(), 10 * 60e3); ok('panel değeri çalışma ayarına geçer');
  isl.ata({ dosyaKotaMb: 500 }, {}); process.env.IYZICO_CANLI = '1'; process.env.NEBSOFT_DOSYA_KOTA_MB = '900'; assert.equal(isl.iyzicoCanli(), true); assert.equal(isl.iyzicoPanel(), false); assert.equal(isl.kotaMb(), 900); ok('ortam değişkeni çalışmaya devam eder ve önceliklidir');
  delete process.env.IYZICO_CANLI; delete process.env.NEBSOFT_DOSYA_KOTA_MB; if (K0) process.env.NEBSOFT_DOSYA_KOTA_MB = K0; isl.ata({}, {});
  const destek = require('../cloud/destek'); const indirim = require('../cloud/indirim'); const taban = destek.load().paketler.orta.aylik;
  destek.panelAta({ bozuk: true }); assert.equal(destek.load().paketler.orta.aylik, taban); indirim.panelAta({ programSayisi: 'x' }); assert.ok(Array.isArray(indirim.load().programSayisi)); ok('bozuk panel kaydı satışı durdurmaz, dosya kullanılır');
  const k = require('../cloud/kurulum'); const s = { address: 'Konya', email: '', phone: '0212 000 00 00', siteUrl: '' }; const f = { unvan: 'Örnek Ltd', mersis: '', kep: '', kvkkEposta: '', hukukEposta: '', vergiDairesi: '', vergiNo: '', destekSaat: '', destekKanal: '' };
  const m = k.doldur('[TİCARET UNVANI] [ADRES] [E-POSTA] [MERSİS NO] [bağlantı](https://a.b)', s, f); assert.equal(m, 'Örnek Ltd Konya [E-POSTA] [MERSİS NO] [bağlantı](https://a.b)'); assert.deepEqual(k.kalanlar(m), ['E-POSTA', 'MERSİS NO']); ok('bilinen değer yazılır, boş değer yer tutucu kalır, bağlantı yer tutucu sayılmaz');
  const adres = 'https://www.ornek.test'; k.dis.publicUrl = async () => true;
  k.dis.fetch = async (u) => (u.startsWith('https:') ? { status: 200, text: async () => `User-agent: *\nSitemap: ${adres}/sitemap.xml\n` } : { status: 301, headers: { get: () => `${adres}/robots.txt` } });
  let o = await k.olc(adres, true); assert.deepEqual([o.dns, o.https, o.yonlendirme], [true, true, true]); ok('HTTPS ve yönlendirme gerçek yanıttan ölçülür');
  k.dis.fetch = async () => { throw new Error('sertifika'); }; o = await k.olc(adres, true); assert.deepEqual([o.dns, o.https, o.yonlendirme], [true, false, false]); assert.ok(/bağlanılamadı/.test(o.not)); ok('sertifika hatası tamam yazmaz');
  k.dis.fetch = async () => ({ status: 200, text: async () => 'park sayfası', headers: { get: () => '' } }); o = await k.olc(adres, true); assert.equal(o.https, false); ok('başka siteye yönlenen alan adı bağlı sayılmaz');
  o = await k.olc('', true); assert.equal(o.https, null); ok('site adresi yoksa sonuç ölçülemedi kalır');
}

function client() { let cookie = ''; return async (m, p, body) => { const r = await fetch(BASE + p, { method: m, redirect: 'manual', headers: { 'x-ns-csrf': '1', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0]; const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (e) { /* html */ } return { status: r.status, j, text }; }; }
const SIFRE = 'GucluSifre2026!'; const hata = (r, n, re) => { assert.equal(r.status, n, r.text); if (re) assert.ok(re.test(r.j.error), r.text); };
const ayarYol = '/api/admin/kurulum';

async function e2e() {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { return console.log('Uçtan uca: ATLANDI (mysql2 yok), geçti sayılmaz'); }
  let root; try { root = await mysql.createConnection({ host: DBH, user: DBU, password: DBP, multipleStatements: true }); } catch (e) { return console.log(`Uçtan uca: ATLANDI (MySQL: ${e.code || e.message}), geçti sayılmaz`); }
  console.log('Uçtan uca (MySQL)');
  await root.query(`DROP DATABASE IF EXISTS ${DBN}; CREATE DATABASE ${DBN} CHARACTER SET utf8mb4;`); const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nskur-'));
  let log = ''; const env = { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'kurulum-test-secret' }; delete env.IYZICO_CANLI; delete env.NEBSOFT_DOSYA_KOTA_MB;
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env }); srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${BASE}/api/setup/status`)).ok) break; } catch (e) { /* açılıyor */ } await sleep(100); }
  const stop = () => new Promise((r) => { srv.once('exit', r); srv.kill(); });
  try {
    const A = client(), M = client(), Y = client(), H = client(); const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DBH, database: DBN, user: DBU, password: DBP, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/setup/admin', { email: 'kok@nebsoft.test', name: 'Süper', pass: SIFRE, token }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/admin/users', { name: 'Yönetici', email: 'yon@nebsoft.test', pass: SIFRE, role: 'admin' }); assert.equal(r.j.ok, true, r.text); r = await Y('POST', '/api/auth/login', { email: 'yon@nebsoft.test', pass: SIFRE }); assert.equal(r.j.ok, true, r.text);
    r = await M('POST', '/api/auth/register', { email: 'musteri@nebsoft.test', pass: 'Sifre12345', name: 'Ali Veli', company: 'Deneme Market', phone: '05321112233', kvkk: true }); assert.equal(r.j.ok, true, r.text);
    r = await A('POST', '/api/admin/banks', { holder: 'Örnek Ltd', bank: 'Banka', iban: 'TR330006100519786457841326' }); assert.equal(r.j.ok, true, r.text); r = await A('POST', '/api/admin/banks', { holder: 'Örnek Ltd', bank: 'Banka', iban: 'TR000006100519786457841326' }); hata(r, 400, /IBAN/); ok('IBAN kontrol hanesi sunucuda denetlenir');

    // Yetki
    hata(await H('GET', ayarYol), 401); hata(await M('GET', ayarYol), 403); hata(await M('PUT', `${ayarYol}/iletisim`, { phone: '02120000000' }), 403); ok('müşteri ve anonim Kurulum uçlarına giremez');
    r = await A('GET', ayarYol); assert.equal(r.status, 200, r.text); assert.ok(r.j.ozet.toplam > 40); assert.equal(r.j.ozet.tamam + r.j.ozet.eksik + r.j.ozet.olculemedi, r.j.ozet.toplam); assert.equal(r.j.site.phone, ''); assert.equal(r.j.sirket.unvan, ''); ok('özet sayaç satırlarla tutarlı, şirket bilgisi boş başlar');
    const grup = (x, id, ad) => x.j.gruplar.find((g) => g.id === id).satirlar.find((s) => s.ad.startsWith(ad));
    assert.equal(grup(r, 'alan', 'HTTPS aktif').durum, 'olculemedi'); assert.equal(grup(r, 'dis', 'Avukat').durum, 'eksik'); assert.equal(grup(r, 'sunucu', 'Gece yedeği').kaynak, 'beyan'); ok('ölçülemeyen ve dış iş otomatik tamam yazılmaz');

    // Örnek iletişim bilgisi sitede görünmez
    let p = (await H('GET', '/randevusistemi')).text; assert.ok(!p.includes('0850 555 00 34') && !p.includes('908505550034') && !p.includes('destek@nebsoft.com.tr'), 'örnek iletişim kaldı'); assert.ok(p.includes('</html>')); JSON.parse((p.match(/<script type="application\/ld\+json">(.*?)<\/script>/) || [])[1] || '{}');
    p = (await H('GET', '/')).text; assert.ok(!p.includes('908505550034')); JSON.parse(p.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]); assert.ok(!(await H('GET', '/kvkk/')).text.includes('destek@nebsoft.com.tr')); r = await H('GET', '/api/auth/me'); assert.equal(r.j.site.phone, ''); ok('girilmemiş telefon ve e-posta sitede ve API\'de örnek değer göstermez, şema bozulmaz');
    await root.query(`UPDATE ${DBN}.settings SET v=? WHERE k='site'`, [JSON.stringify({ phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', trialDays: 7, siteName: 'NEBSOFT' })]).catch(() => {}); await root.query(`INSERT INTO ${DBN}.settings (k,v) VALUES ('site',?) ON DUPLICATE KEY UPDATE v=VALUES(v)`, [JSON.stringify({ phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', trialDays: 7, siteName: 'NEBSOFT' })]);
    assert.equal((await H('GET', '/api/auth/me')).j.site.phone, ''); ok('eski kurulumda kayıtlı örnek değer de gerçek sayılmaz');

    // Doğrulama
    for (const [y, b, re] of [['sirket', { mersis: '123' }, /MERSİS/], ['sirket', { vergiNo: '12a' }, /Vergi/], ['sirket', { kep: 'kep' }, /e-posta/], ['iletisim', { phone: '123' }, /Telefon/], ['iletisim', { email: 'x@' }, /e-posta/], ['iletisim', { whatsapp: '12' }, /WhatsApp/], ['site', { siteUrl: 'ftp://x' }, /Site adresi/], ['site', { siteUrl: 'https://a.b/yol' }, /Site adresi/], ['site', { googleVerify: '"><script>' }, /Google/], ['satis', { trialDays: 0, referralDays: 1, odemeDk: 30, dosyaKotaMb: 2048 }, /Deneme/], ['indirim', { programSayisi: [{ min: 2, yuzde: 100 }], formEsigi: 50 }, /kademesi/], ['bayi', { yuzde: 120 }, /Komisyon/]]) hata(await A('PUT', `${ayarYol}/${y}`, b), 400, re);
    ok('telefon, MERSİS, vergi no, e-posta, adres, oran ve kademe biçimi sunucuda denetlenir');

    // Şirket ve iletişim: yeniden başlatmadan siteye yansır
    const MERSIS = '0123456789012345';
    r = await A('PUT', `${ayarYol}/sirket`, { unvan: 'Örnek Yazılım Ltd', tur: 'Limited', mersis: MERSIS, vergiDairesi: 'Meram', vergiNo: '1234567890', ticaretSicil: '123', address: 'Meram Konya', kep: 'ornek@hs01.kep.tr', kvkkEposta: 'kvkk@ornek.test', hukukEposta: 'hukuk@ornek.test' }); assert.equal(r.j.ok, true, r.text);
    r = await A('PUT', `${ayarYol}/iletisim`, { phone: '0332 000 00 00', email: 'Destek@Ornek.test', destekSaat: 'Hafta içi 09.00-18.00', destekKanal: 'Destek talebi', whatsapp: '05321112233' }); assert.equal(r.j.ok, true, r.text);
    p = (await H('GET', '/randevusistemi')).text; assert.ok(p.includes('0332 000 00 00') && p.includes('tel:+903320000000') && p.includes('destek@ornek.test') && p.includes('Örnek Yazılım Ltd') && p.includes(`MERSİS ${MERSIS}`) && p.includes('Hafta içi 09.00-18.00') && p.includes('wa.me/905321112233') && p.includes('name="ns-iletisim" data-tel="0332 000 00 00"')); ok('şirket ve iletişim bilgisi yeniden başlatmadan sayfaya yansır');
    r = await H('GET', '/api/auth/me'); assert.equal(r.j.site.unvan, 'Örnek Yazılım Ltd'); assert.equal(r.j.site.email, 'destek@ornek.test'); r = await A('GET', '/api/admin/deneme-takip'); assert.equal(r.j.pazarlama.mersis, MERSIS); ok('pazar yeri ve tanıtım e-postası aynı kimliği okur');
    r = await A('PUT', `${ayarYol}/iletisim`, { phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr' }); assert.equal((await H('GET', '/api/auth/me')).j.site.phone, '0850 555 00 34'); await A('PUT', `${ayarYol}/iletisim`, { phone: '0332 000 00 00', email: 'destek@ornek.test', destekSaat: 'Hafta içi 09.00-18.00', destekKanal: 'Destek talebi' }); ok('örnek değerle aynı numarayı yönetici bilerek girerse gerçek sayılır');
    r = await A('PUT', '/api/admin/settings', { trialDays: 7, siteName: 'NEBSOFT', referralDays: 30 }); assert.equal(r.j.ok, true, r.text); assert.equal((await H('GET', '/api/auth/me')).j.site.phone, '0332 000 00 00'); ok('Site Ayarları kaydı iletişim alanlarını silmez');

    // Site adresi ve Search Console
    r = await A('PUT', `${ayarYol}/site`, { siteUrl: 'https://www.ornek.test/', googleVerify: 'abcDEF_123-xyz' }); assert.equal(r.j.ok, true, r.text);
    p = (await H('GET', '/randevusistemi')).text; assert.ok(p.includes('<link rel="canonical" href="https://www.ornek.test/randevusistemi"') || p.includes('href="https://www.ornek.test/randevusistemi'), 'kanonik'); assert.ok(!p.includes('www.nebsoftapp.com')); assert.ok(p.includes('google-site-verification" content="abcDEF_123-xyz"')); assert.ok((await H('GET', '/sitemap.xml')).text.includes('https://www.ornek.test/randevusistemi')); ok('site adresi kanonik adrese ve site haritasına, doğrulama kodu sayfalara yansır');
    r = await A('GET', ayarYol); assert.equal(grup(r, 'arama', 'Doğrulama etiketi').durum, 'tamam'); assert.notEqual(grup(r, 'alan', 'HTTPS aktif').durum, 'tamam'); assert.equal(grup(r, 'alan', 'Alan adı').durum, 'eksik'); ok('etiket ölçülür; ulaşılamayan adres için HTTPS tamam yazılmaz');

    // Satış kuralları
    r = await A('PUT', `${ayarYol}/satis`, { trialDays: 10, referralDays: 15, odemeDk: 45, dosyaKotaMb: 512 }); assert.equal(r.j.ok, true, r.text); assert.equal((await H('GET', '/api/auth/me')).j.trialDays, 10); assert.ok((await H('GET', '/randevusistemi')).text.includes('10 gün ücretsiz')); r = await A('GET', ayarYol); assert.equal(r.j.isletim.odemeDk, 45); assert.equal(r.j.isletim.dosyaKotaMb, 512); ok('deneme süresi sayfaya, ödeme süresi ve alan ayarı çalışma ayarına geçer');

    // Fiyat: sipariş sunucu hesabına yansır, geçmiş sipariş değişmez
    const sepet = { items: [{ pid: 'pos', plan: 1, period: 'aylik', qty: 1 }, { pid: 'randevu', plan: 1, period: 'aylik', qty: 1 }], support: { plan: 'orta', period: 'aylik' } };
    const q0 = (await H('POST', '/api/orders/quote', sepet)).j; assert.equal(q0.ok, true, JSON.stringify(q0)); assert.equal(q0.indirim.yuzde, 5);
    r = await M('POST', '/api/orders', { ...sepet, billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' } }); assert.equal(r.j.ok, true, r.text); const eskiNo = r.j.order.no; const eskiTop = r.j.order.total;
    r = await A('PUT', `${ayarYol}/indirim`, { programSayisi: [{ min: 2, yuzde: 25 }], subeSayisi: [], lisansSayisi: [], formEsigi: 40 }); assert.equal(r.j.ok, true, r.text);
    let dv = (await A('GET', ayarYol)).j.destek; const yeniDestek = { paketler: { ...dv.paketler, orta: { ...dv.paketler.orta, aylik: 999 } }, takvimler: dv.takvimler, kurulumHizmeti: { ad: 'Yerinde kurulum', fiyat: 1500 } };
    r = await A('PUT', `${ayarYol}/destek`, yeniDestek); assert.equal(r.j.ok, true, r.text); hata(await A('PUT', `${ayarYol}/destek`, { paketler: { orta: { ...dv.paketler.orta, cozumSaat: 1 } } }), 400, /Destek paketi/);
    r = await A('PUT', '/api/admin/catalog/pos', { name: 'POS', prices: [700, 2000, 3000], ready: true }); assert.equal(r.j.ok, true, r.text);
    const q1 = (await H('POST', '/api/orders/quote', sepet)).j; assert.equal(q1.indirim.yuzde, 25); assert.equal(q1.lines.find((l) => l.pid === 'pos').price, 2000); assert.equal(q1.lines.find((l) => l.type === 'support').price, 999); ok('program fiyatı, indirim kademesi ve destek paketi sunucu hesabına yeniden başlatmadan yansır');
    r = await M('POST', '/api/orders', { ...sepet, billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' } }); assert.equal(r.j.ok, true, r.text); assert.equal(r.j.order.total, q1.total); const eski = (await M('GET', '/api/orders')).j.orders.find((o) => o.no === eskiNo); assert.equal(eski.total, eskiTop); assert.notEqual(eski.total, q1.total); ok('yeni sipariş yeni fiyatla açılır, geçmiş sipariş değişmez');
    assert.ok((await H('GET', '/fiyatlar/')).text.includes('data-p="pos:1">2.000<')); r = await H('GET', '/api/vitrin'); assert.deepEqual(r.j.kurulum, { ad: 'Yerinde kurulum', fiyat: 1500 }); r = await M('GET', '/api/tickets'); assert.equal(r.j.paketler.find((x) => x.id === 'orta').aylik, 999); ok('fiyat sayfası ve müşteri ekranı yeni değeri gösterir');
    assert.equal((await H('GET', '/api/vitrin')).j.komisyon, null); r = await A('PUT', `${ayarYol}/bayi`, { yuzde: 15, aciklama: 'İlk yıl' }); assert.equal(r.j.ok, true, r.text); r = await H('GET', '/api/vitrin'); assert.deepEqual(r.j.komisyon, { yuzde: 15, aciklama: 'İlk yıl' }); await A('PUT', `${ayarYol}/bayi`, { yuzde: '' }); assert.equal((await H('GET', '/api/vitrin')).j.komisyon, null); ok('bayi komisyonu panelden gelir, boşsa dışarı çıkmaz');
    await A('DELETE', `${ayarYol}/indirim`); assert.equal((await H('POST', '/api/orders/quote', sepet)).j.indirim.yuzde, 5); ok('panel kaydı silinince dosyadaki değere dönülür');

    // Yasal metin
    r = await A('GET', `${ayarYol}/yasal/kvkk`); assert.ok(r.j.metin.includes('Örnek Yazılım Ltd') && !r.j.metin.includes('[TİCARET UNVANI]')); assert.equal(r.j.taslak, true); assert.ok(r.j.kalan.length > 0); const asil = r.j.metin; hata(await A('PUT', `${ayarYol}/yasal/kvkk`, { metin: asil, onay: true }), 400, /TASLAK/);
    hata(await A('PUT', `${ayarYol}/yasal/kvkk`, { metin: 'Metin [YEDEK ÜLKESİ]', onay: true }), 400, /YEDEK ÜLKESİ/); hata(await A('PUT', `${ayarYol}/yasal/yok`, { metin: 'x' }), 404); ok('taslak notu veya boş alan varken onay verilemez');
    p = (await H('GET', '/kvkk/')).text; assert.ok(p.includes('örnek şablondur')); r = await A('PUT', `${ayarYol}/yasal/kvkk`, { metin: '## Veri sorumlusu\n\n[TİCARET UNVANI] kişisel verileri işler. <script>alert(1)</script>', onay: true }); assert.equal(r.j.ok, true, r.text);
    p = (await H('GET', '/kvkk/')).text; assert.ok(p.includes('Örnek Yazılım Ltd kişisel verileri işler') && !p.includes('örnek şablondur') && !p.includes('<script>alert') && /content="index,follow"/.test(p)); ok('onaylanan metin sayfada örnek metnin yerine geçer, ham HTML kaçırılır');
    await A('PUT', `${ayarYol}/yasal/kvkk`, { metin: 'geri', onay: false }); assert.ok((await H('GET', '/kvkk/')).text.includes('örnek şablondur')); ok('onay kaldırılınca örnek metne dönülür');

    // İşler
    hata(await A('POST', `${ayarYol}/is/uydurma`, { tamam: true }), 404); r = await Y('POST', `${ayarYol}/is/avukat`, { tamam: true, not: 'Görüşüldü' }); assert.equal(r.j.ok, true, r.text); r = await A('GET', ayarYol); const a = grup(r, 'dis', 'Avukat'); assert.equal(a.durum, 'tamam'); assert.equal(a.by, 'yon@nebsoft.test'); assert.equal(a.kaynak, 'beyan'); ok('dış iş işaretlenince yapan ve tarih kaydedilir');

    // iyzico kilidi
    r = await Y('GET', ayarYol); assert.equal(r.j.iyzico, undefined); hata(await Y('PUT', `${ayarYol}/iyzico`, { acik: true, testOnay: true }), 403); r = await A('GET', ayarYol); assert.equal(r.j.iyzico.acik, false); ok('canlı kilidi yönetici görmez ve değiştiremez');
    hata(await A('PUT', `${ayarYol}/iyzico`, { acik: true }), 400, /test/); r = await A('PUT', `${ayarYol}/iyzico`, { acik: true, testOnay: true }); assert.equal(r.j.ok, true, r.text); r = await A('GET', ayarYol); assert.equal(r.j.iyzico.acik, true); assert.equal(r.j.iyzico.kayit.by, 'kok@nebsoft.test');
    await A('PUT', `${ayarYol}/iyzico`, { acik: false }); r = await A('GET', ayarYol); assert.equal(r.j.iyzico.acik, false); ok('süper yönetici test onayıyla açar, kapatabilir');

    // Denetim kaydı ve gizli bilgi
    const PAT = 'pat_gizli_kurulum_123456'; const SIF = 'mailsifre987654'; await A('PUT', '/api/admin/shopier', { pat: PAT }); await A('PUT', '/api/admin/mail', { provider: 'gmail', user: 'x@ornek.test', pass: SIF, enabled: true });
    r = await A('GET', ayarYol); assert.ok(!r.text.includes(PAT) && !r.text.includes(SIF) && !r.text.includes('kurulum-test-secret')); assert.equal(grup(r, 'eposta', 'SMTP').durum, 'tamam'); assert.equal(grup(r, 'eposta', 'Başarılı').durum, 'eksik'); await A('PUT', '/api/admin/mail', { enabled: false }); ok('gizli değer yanıta çıkmaz, gönderim kaydı yoksa e-posta tamam sayılmaz');
    r = await A('GET', '/api/admin/audit'); const iz = r.j.rows.map((x) => x.action).join('|'); for (const a2 of ['Kurulum: şirket kimliği', 'Kurulum: iletişim', 'Kurulum: site adresi', 'Kurulum: satış kuralları', 'Kurulum: toplu indirim', 'Kurulum: destek paketleri', 'Kurulum: bayi komisyonu', 'Kurulum: yasal metin onaylandı', 'Kurulum: iş tamamlandı', 'Kurulum: iyzico canlı mod açıldı', 'Kurulum: iyzico canlı mod kapatıldı']) assert.ok(iz.includes(a2), a2); ok('her değişiklik denetim kaydına yazılır');

    // Yeniden başlatınca ayar korunur
    assert.ok(!/Unhandled|TypeError|ReferenceError/.test(log), log.slice(-800));
  } finally { await stop(); await root.query(`DROP DATABASE IF EXISTS ${DBN}`); await root.end(); fs.rmSync(DATA, { recursive: true, force: true }); }
}

birim().then(e2e).then(() => { console.log(`\nKurulum: ${passed} kontrol geçti`); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
