// Analitik testleri: node server/test/analitik.test.js
//  1. bölüm veritabanı gerektirmez. 2. bölüm uçtan uca: yerel MariaDB/MySQL ve kendi test veritabanı gerekir (TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASS, TEST_DB_NAME).
//  Veritabanına ulaşılamazsa 2. bölüm "ATLANDI" yazar, geçti sayılmaz. cloud.test.js'in nebsoft_test veritabanına dokunmaz.
const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const db = require('../cloud/db');
const an = require('../cloud/analitik');

let n = 0; const t = async (ad, fn) => { await fn(); n++; console.log('  ✓', ad); };
const programVar = (p) => ['pos', 'randevu'].includes(p);
const ctx = (o = {}) => ({ ip: '203.0.113.5', ua: 'Mozilla/5.0 Test', host: 'www.nebsoft.test', ...o });

// Sahte veritabanı: yalnızca analitiğin kullandığı sorgular
function sahteDb() {
  const s = { tekil: new Set(), toplam: new Map(), ayar: {}, sorgular: [] };
  db.ready = () => true;
  db.one = async (q) => (/k='analitik'/.test(q) && s.ayar.analitik ? { v: s.ayar.analitik } : /k='an_tuz'/.test(q) && s.ayar.tuz ? { v: s.ayar.tuz } : null);
  db.q = async (q, p = []) => {
    s.sorgular.push([q, p]);
    if (/an_tuz/.test(q)) { s.ayar.tuz = p[0]; return {}; }
    if (/^INSERT IGNORE INTO an_tekil/.test(q)) { const k = p.join('|'); if (s.tekil.has(k)) return { affectedRows: 0 }; s.tekil.add(k); return { affectedRows: 1 }; }
    if (/^INSERT INTO an_toplam/.test(q)) { for (let i = 0; i < p.length; i += 6) { const k = p.slice(i + 2, i + 5).join('|'); s.toplam.set(k, (s.toplam.get(k) || 0) + p[i + 5]); } return {}; }
    return { affectedRows: 0 };
  };
  return s;
}
const toplam = (s, on) => [...s.toplam.entries()].filter(([k]) => k.startsWith(on)).reduce((a, [, v]) => a + v, 0);

async function birim() {
  await t('olay doğrulama: beyaz liste dışı her şey reddedilir', () => {
    for (const b of [null, 'x', 5, [], {}, { tur: 'yok' }, { tur: 5 }, { tur: 'demo' }, { tur: 'demo', program: 'olmayan' }, { tur: 'demo', program: '<script>' }, { tur: 'sayfa', program: { a: 1 } }, { tur: 'gecis', arac: 'a b', program: 'pos' }, { tur: 'gecis', arac: 'kdv' }, { tur: 'modul', program: 'pos', modul: '../x' }, { tur: 'modul', modul: 'satis' }]) assert.equal(an.olayDogrula(b, programVar), null, JSON.stringify(b));
    assert.deepEqual(an.olayDogrula({ tur: 'sayfa', program: 'pos', fazla: 'x', __proto__: { y: 1 } }, programVar), { tur: 'sayfa', program: 'pos' });
  });
  await t('kaynak: yalnızca alan adı alınır, kötü adres ve kendi site atılır', () => {
    assert.equal(an.kaynakAlan('https://www.google.com.tr/search?q=gizli', 'x.test'), 'google.com.tr');
    for (const r of ['', 'javascript:alert(1)', 'android-app://com.x', 'not url', 'https://x', `https://${'a'.repeat(90)}.com/`, 5, 'https://www.nebsoft.test/a']) assert.equal(an.kaynakAlan(r, 'www.nebsoft.test:443'), null, String(r));
  });
  await t('UTM temizlenir, kaynaksız UTM atılır', () => { assert.deepEqual(an.utmTemizle({ source: ' Google Ads<b> ', medium: 'CPC', campaign: 'yaz 2026!' }), { source: 'google-adsb', medium: 'cpc', campaign: 'yaz-2026' }); assert.equal(an.utmTemizle({ source: 'Instagram' }).source, 'instagram'); assert.equal(an.utmTemizle({ source: 'İŞ' }).source, 'i'); assert.equal(an.utmTemizle({ medium: 'cpc' }), null); assert.equal(an.utmTemizle('x'), null); });
  await t('ayar sınırları: taşan değer kısılır, kötü değer varsayılana döner', () => { const a = an.ayarTemizle({ analitikGun: 1, denetimGun: 99999, uygulamaGun: 'x', pencereDk: 99, acik: false }); assert.equal(a.analitikGun, 7); assert.equal(a.denetimGun, 3650); assert.equal(a.uygulamaGun, an.VARSAYILAN.uygulamaGun); assert.equal(a.pencereDk, 15); assert.equal(a.acik, false); });
  await t('alarm: az istekte alarm yok, eşikte hata ve yavaşlık alarmı', () => { const a = an.VARSAYILAN; assert.deepEqual(an.alarmHesapla({ n: 5, h5: 5, yavas: 5 }, a), []); assert.deepEqual(an.alarmHesapla({ n: 100, h5: 1, yavas: 1 }, a), []); const r = an.alarmHesapla({ n: 100, h5: 10, yavas: 30 }, a); assert.deepEqual(r.map((x) => x.tur), ['hata', 'yavas']); assert.equal(r[0].deger, 10); });

  const s = sahteDb();
  await t('alarm geçişi: açılır, tek kez bildirilir, düzelince kapanır', async () => {
    const bild = []; an.hook.alarm = (k) => bild.push(k); s.ayar.analitik = JSON.stringify({ alarmEposta: true }); await an.ayar(true);
    const eski = console.warn; console.warn = () => {}; const b0 = Date.now(); const R = Date.now; let r = [];
    try { for (let i = 0; i < 40; i++) an.istek('/api/x', 500, 5); r = await an.alarmKontrol(); assert.deepEqual(r.map((x) => x.tur), ['hata']); assert.ok(r[0].mesaj.includes('%100')); await an.alarmKontrol(); assert.equal(bild.length, 1); }
    finally { console.warn = eski; }
    const lg = console.log; console.log = () => {}; try { Date.now = () => b0 + 16 * 60e3; assert.deepEqual(await an.alarmKontrol(), []); } finally { Date.now = R; console.log = lg; }
    an.hook.alarm = null; s.ayar.analitik = null; await an.ayar(true);
  });
  await t('rıza yoksa hiçbir sayaç ve özet oluşmaz', async () => {
    for (const b of [{ tur: 'ziyaret' }, { tur: 'ziyaret', riza: false }, { tur: 'ziyaret', riza: 'true' }, { tur: 'sayfa', riza: 1 }, { tur: 'demo', program: 'pos' }]) assert.equal((await an.kaydet(b, ctx(), programVar)).neden, 'riza');
    assert.equal((await an.kaydet({ tur: 'ziyaret', riza: true }, ctx({ gpc: true }), programVar)).neden, 'riza'); await an.bosalt();
    assert.equal(s.tekil.size, 0); assert.equal(s.toplam.size, 0);
  });
  await t('bot ve tarayıcı kimliği olmayan istek sayılmaz', async () => { for (const ua of ['Googlebot/2.1', 'curl/8.0', '']) assert.equal((await an.kaydet({ tur: 'ziyaret', riza: true }, ctx({ ua }), programVar)).neden, 'bot'); });
  await t('tekil: aynı ziyaretçi günde bir sayılır, sayfa her seferinde', async () => {
    for (let i = 0; i < 3; i++) await an.kaydet({ tur: 'ziyaret', riza: true, program: 'pos', ref: 'https://google.com/x' }, ctx(), programVar);
    await an.kaydet({ tur: 'ziyaret', riza: true }, ctx({ ip: '203.0.113.6' }), programVar); await an.bosalt();
    assert.equal(toplam(s, 'ziyaret|'), 2); assert.equal(toplam(s, 'sayfa|'), 4); assert.equal(toplam(s, 'program|pos'), 3); assert.equal(toplam(s, 'kaynak|google.com'), 1); assert.equal(toplam(s, 'kaynak|(doğrudan)'), 1);
  });
  await t('IP hiçbir sorguya ham girmez', () => assert.ok(!JSON.stringify(s.sorgular).includes('203.0.113')));
  await t('demo tekil sayılır', async () => { for (let i = 0; i < 2; i++) await an.kaydet({ tur: 'demo', riza: true, program: 'randevu' }, ctx(), programVar); await an.kaydet({ tur: 'demo', riza: true, program: 'pos' }, ctx(), programVar); await an.bosalt(); assert.equal(toplam(s, 'demo|randevu'), 1); assert.equal(toplam(s, 'demo|pos'), 1); assert.equal(toplam(s, 'demo_tekil|'), 1); });
  await t('kaynak çeşidi sınırlıdır: tablo şişirilemez', async () => {
    for (let i = 0; i < 340; i++) await an.kaydet({ tur: 'ziyaret', riza: true, ref: `https://site${i}.example.com/` }, ctx({ ip: `198.51.100.${i % 250}`, ua: `Mozilla/${i}` }), programVar); await an.bosalt();
    assert.ok([...s.toplam.keys()].filter((k) => k.startsWith('kaynak|')).length <= 303); assert.ok(toplam(s, 'kaynak|(diğer)') > 0);
  });
  await t('modül: doğrulanmış işletme olmadan sayılmaz; olursa açılış ve tekil sayılır', async () => {
    assert.equal((await an.kaydet({ tur: 'modul', program: 'pos', modul: 'satis' }, ctx(), programVar)).neden, 'yetki');
    for (let i = 0; i < 2; i++) await an.kaydet({ tur: 'modul', program: 'pos', modul: 'satis' }, ctx({ isletme: 't1' }), programVar); await an.bosalt();
    assert.equal(toplam(s, 'modul|pos|satis'), 2); assert.equal(toplam(s, 'modul_isletme|pos|satis'), 1);
  });
  await t('analitik kapalıyken kayıt yok', async () => { s.ayar.analitik = JSON.stringify({ acik: false }); await an.ayar(true); assert.equal((await an.kaydet({ tur: 'ziyaret', riza: true }, ctx({ ip: '192.0.2.1' }), programVar)).neden, 'kapali'); s.ayar.analitik = null; await an.ayar(true); });
  await t('saklama: süreler ayardan okunur, ham özetler gün dönünce silinir', async () => {
    s.ayar.analitik = JSON.stringify({ denetimGun: 100, uygulamaGun: 30, analitikGun: 60 }); s.sorgular.length = 0; const r = await an.temizle(); const q = s.sorgular.map(([x]) => x).join(' ');
    assert.ok(r && /DELETE FROM an_toplam/.test(q) && /DELETE FROM an_sistem/.test(q) && /DELETE FROM an_tekil/.test(q) && /DELETE FROM log_kayit/.test(q) && /DELETE FROM audit/.test(q));
    const a = s.sorgular.find(([x]) => /FROM audit/.test(x))[1][0]; assert.ok(Math.abs(Date.now() - a.getTime() - 100 * 864e5) < 5000);
  });
}

// ---------- Uçtan uca ----------
const PORT = Number(process.env.TEST_PORT) || 5075; const BASE = `http://127.0.0.1:${PORT}`;
const DBN = process.env.TEST_DB_NAME || 'nebsoft_analitik_test';
const DB = { host: process.env.TEST_DB_HOST || '127.0.0.1', user: process.env.TEST_DB_USER || 'root', password: process.env.TEST_DB_PASS || '' };
function istemci() {
  let cerez = '';
  return async (m, u, body, ek = {}) => {
    const h = { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Test', 'x-ns-csrf': '1', ...(cerez ? { Cookie: cerez } : {}), ...(ek.h || {}) };
    if (ek.csrfYok) delete h['x-ns-csrf'];
    const r = await fetch(BASE + u, { method: m, headers: h, body: ek.ham !== undefined ? ek.ham : body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cerez = sc.split(';')[0];
    const yazi = await r.text(); let j = null; try { j = JSON.parse(yazi); } catch (e) { /* html */ }
    return { status: r.status, j, yazi };
  };
}
async function uctan() {
  let mysql; let kok;
  try { mysql = require('mysql2/promise'); kok = await mysql.createConnection({ ...DB, multipleStatements: true }); } catch (e) { console.log(`\n  ATLANDI: uçtan uca bölüm çalışmadı (${e.message})`); return false; }
  const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nsanalitik-'));
  await kok.query(`DROP DATABASE IF EXISTS \`${DBN}\`; CREATE DATABASE \`${DBN}\` CHARACTER SET utf8mb4;`);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'analitik-test', HOST: '127.0.0.1', TRUST_PROXY: '1', NODE_ENV: 'test' } });
  let cikti = ''; srv.stdout.on('data', (d) => { cikti += d; }); srv.stderr.on('data', (d) => { cikti += d; });
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(cikti); i++) await new Promise((r) => setTimeout(r, 100));
    const A = istemci(); const M = istemci(); const X = istemci();
    const v = (ip) => ({ h: { 'X-Forwarded-For': ip } });
    let r = await A('POST', '/api/olay', { tur: 'ziyaret', riza: true }); assert.equal(r.j.kayit, false); ok1('kurulum öncesi: uç çalışır, kayıt almaz');
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    r = await A('POST', '/api/setup/db', { host: DB.host, database: DBN, user: DB.user, password: DB.password, token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));

    r = await X('GET', '/'); assert.ok(r.yazi.includes('/core/olay.js')); ok1('site sayfasına olay betiği eklenir');
    r = await X('GET', '/randevusistemi'); assert.ok(r.yazi.includes('data-program="randevu"')); assert.ok(r.yazi.includes('data-olay-tercih')); ok1('tanıtım sitesinde program kimliği ve tercih bağlantısı var');
    r = await X('GET', '/api/admin/analitik'); assert.equal(r.status, 401); r = await X('GET', '/api/admin/sistem'); assert.equal(r.status, 401); ok1('rapor uçları oturumsuz kapalı');
    r = await X('GET', '/api/olay/durum'); assert.deepEqual([r.j.acik, r.j.kayitli], [true, false]); r = await A('GET', '/api/olay/durum'); assert.equal(r.j.kayitli, true); ok1('bant durumu: anonimde göster, oturumda gösterme');
    r = await A('GET', '/api/admin/analitik?gun=30'); assert.equal(r.j.ziyaret, 0); assert.equal(r.j.sayfa, 0); assert.deepEqual(r.j.huni.map((x) => x.n), [0, 0, 0, 0, 0]); assert.deepEqual(r.j.programlar, []); ok1('boş durum: veri yoksa hepsi sıfır, uydurma satır yok');

    // Rıza
    await X('POST', '/api/olay', { tur: 'ziyaret' }, v('198.51.100.1')); await X('POST', '/api/olay', { tur: 'ziyaret', riza: false }, v('198.51.100.1')); await X('POST', '/api/olay', { tur: 'demo', program: 'pos' }, v('198.51.100.1'));
    r = await X('POST', '/api/olay', { tur: 'ziyaret', riza: true }, { h: { 'X-Forwarded-For': '198.51.100.1', 'Sec-GPC': '1' } }); assert.equal(r.j.kayit, false); r = await X('POST', '/api/olay', { tur: 'ziyaret', riza: true }, { h: { 'X-Forwarded-For': '198.51.100.1', DNT: '1' } }); assert.equal(r.j.kayit, false);
    r = await A('GET', '/api/admin/analitik'); assert.equal(r.j.ziyaret, 0); assert.equal(r.j.sayfa, 0); assert.equal(r.j.huni[1].n, 0); ok1('rıza yoksa (ve GPC / DNT açıkken) kayıt yok');
    r = await X('POST', '/api/olay', { tur: 'ziyaret', riza: true }, { csrfYok: true }); assert.equal(r.status, 403); r = await X('POST', '/api/olay', { tur: 'ziyaret', riza: true }, { h: { Origin: 'https://kotu.example' } }); assert.equal(r.status, 403); ok1('CSRF başlığı olmadan veya başka kaynaktan reddedilir');

    // Kötü girdi
    for (const ham of ['{bozuk', '[]', '"x"', '123', '{"tur":"yok"}', '{"tur":"demo"}', '{"tur":"demo","program":"olmayan"}', '{"tur":"demo","program":"pos\' OR 1=1"}', '{"tur":"gecis","arac":"<script>","program":"pos"}', '{"tur":{"a":1}}']) { r = await X('POST', '/api/olay', null, { ham }); assert.equal(r.status, 400, ham); }
    ok1('kötü girdi 400 döner, kayıt oluşmaz');
    let boyut; try { boyut = (await X('POST', '/api/olay', null, { ham: JSON.stringify({ tur: 'sayfa', riza: true, dolgu: 'x'.repeat(3000) }) })).status; } catch (e) { boyut = 'kesildi'; } assert.ok([413, 'kesildi'].includes(boyut), String(boyut)); ok1('2 KB üstü gövde reddedilir');

    // Rızalı ziyaret
    await X('POST', '/api/olay', { tur: 'ziyaret', riza: true, program: 'randevu', ref: 'https://www.google.com.tr/search?q=gizli-sorgu', utm: { source: 'Google', medium: 'cpc', campaign: 'yaz<2026>' } }, v('198.51.100.2'));
    await X('POST', '/api/olay', { tur: 'ziyaret', riza: true, ref: 'https://www.google.com.tr/' }, v('198.51.100.2'));
    await X('POST', '/api/olay', { tur: 'sayfa', riza: true, program: 'pos' }, v('198.51.100.2'));
    await X('POST', '/api/olay', { tur: 'ziyaret', riza: true }, v('198.51.100.3'));
    await X('POST', '/api/olay', { tur: 'demo', riza: true, program: 'pos' }, v('198.51.100.2')); await X('POST', '/api/olay', { tur: 'demo', riza: true, program: 'pos' }, v('198.51.100.2'));
    await X('POST', '/api/olay', { tur: 'gecis', riza: true, arac: 'kdv-hesap', program: 'pos' }, v('198.51.100.2'));
    r = await A('GET', '/api/admin/analitik'); const a = r.j;
    assert.equal(a.ziyaret, 2); assert.equal(a.sayfa, 4); assert.deepEqual(a.kaynaklar.map((x) => [x.kaynak, x.n]).sort(), [['(doğrudan)', 1], ['google.com.tr', 1]]); assert.deepEqual(a.utm, [{ source: 'google', medium: 'cpc', campaign: 'yaz2026', n: 1 }]);
    assert.equal(a.programlar.find((x) => x.program === 'randevu').n, 1); assert.equal(a.programlar.find((x) => x.program === 'pos').demo, 1); assert.deepEqual(a.gecisler, [{ arac: 'kdv-hesap', program: 'pos', n: 1 }]); assert.equal(a.saatler.reduce((s, x) => s + x.ziyaret, 0), 2); ok1('saat, program, kaynak, UTM ve araç geçişi doğru sayılır');
    const [dok] = await kok.query(`SELECT CONCAT_WS('|', anahtar, ek) AS d FROM \`${DBN}\`.an_toplam`); const metin = JSON.stringify(dok); assert.ok(!metin.includes('198.51.100') && !metin.includes('gizli-sorgu')); const [tek] = await kok.query(`SELECT ozet FROM \`${DBN}\`.an_tekil`); assert.ok(tek.length && tek.every((x) => /^[0-9a-f]{32}$/.test(x.ozet))); ok1('tablolarda IP ve arama sorgusu yok, yalnızca özet');

    // Huni
    r = await M('POST', '/api/auth/register', { email: 'musteri@firma.test', pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: 'Veli Market', kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await A('POST', '/api/admin/banks', { holder: 'NEBSOFT', iban: 'TR33 0006 1005 1978 6457 8413 26', bank: 'İş Bankası' }); assert.equal(r.j.ok, true);
    r = await M('POST', '/api/olay', { tur: 'modul', program: 'pos', modul: 'satis' }); assert.equal(r.j.kayit, true); await M('POST', '/api/olay', { tur: 'modul', program: 'pos', modul: 'satis' }); r = await M('POST', '/api/olay', { tur: 'modul', program: 'randevu', modul: 'takvim' }); assert.equal(r.j.kayit, false);
    r = await X('POST', '/api/olay', { tur: 'modul', program: 'pos', modul: 'gizli' }); assert.equal(r.j.kayit, false); r = await A('GET', '/api/admin/analitik'); assert.deepEqual(r.j.moduller, [{ program: 'pos', modul: 'satis', n: 2, isletme: 1 }]); ok1('modül sayacı yalnızca geçerli denemedeki işletmeyi sayar');
    assert.deepEqual(r.j.huni.map((x) => [x.id, x.n]), [['ziyaret', 2], ['demo', 1], ['kayit', 1], ['deneme', 1], ['odeme', 0]]); ok1('huni: kayıt ve deneme işletme kayıtlarından sayılır');
    await new Promise((z) => setTimeout(z, 1100)); // DATETIME saniye çözünürlüklü: gerçekte deneme ile sipariş aynı saniyede olmaz
    r = await M('POST', '/api/orders', { items: [{ pid: 'pos', plan: 1, period: 'aylik', qty: 1 }], billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Kadıköy İstanbul' } }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await A('POST', `/api/admin/orders/${r.j.order.id}/approve`, { note: 'x' }); assert.equal(r.j.ok, true);
    r = await M('POST', '/api/orders', { items: [{ pid: 'randevu', plan: 1, period: 'aylik', qty: 1 }], billing: { name: 'Ali Veli', taxNo: '1234567890', address: 'Kadıköy İstanbul' } }); r = await A('POST', `/api/admin/orders/${r.j.order.id}/approve`, {}); assert.equal(r.j.ok, true);
    r = await A('GET', '/api/admin/analitik'); assert.deepEqual(r.j.huni.map((x) => x.n), [2, 1, 1, 1, 1]); ok1('huni: ödemeye dönen deneme korunur, doğrudan satın alma deneme sayılmaz, işletme tek sayılır');
    r = await M('POST', '/api/olay', { tur: 'modul', program: 'pos', modul: 'kasa' }); r = await M('POST', '/api/olay', { tur: 'modul', program: 'randevu', modul: 'yeni' }); assert.equal(r.j.kayit, false); ok1('ücretli lisansta modül sayılmaz');

    // Denetim uyumu ve sistem sayaçları
    r = await A('GET', '/api/admin/audit'); const g = r.j.rows.find((x) => x.action === 'Kayıt'); assert.ok(g && g.ip && g.user_id && g.tenant_id && g.at && g.detail.includes('musteri@firma.test')); ok1('audit kaydı eski alanlarıyla yazılıyor, e-posta ve IP açık');
    r = await M('PUT', '/api/admin/analitik/ayar', { acik: false }); assert.equal(r.status, 403); r = await A('PUT', '/api/admin/analitik/ayar', { analitikGun: 200, acik: true, alarmEposta: true }); assert.equal(r.j.ayar.analitikGun, 200); assert.equal(r.j.ayar.alarmEposta, true); ok1('ayar yalnız yöneticide, değer kaydedilir');
    r = await A('GET', '/api/admin/sistem?gun=1'); assert.ok(r.j.yollar.some((x) => x.yol === '/api/admin/analitik' && x.n >= 1)); assert.ok(!r.j.yollar.some((x) => x.yol === '/api/olay')); assert.ok(r.j.yollar.every((x) => !/[0-9a-f]{16}/.test(x.yol))); assert.deepEqual(r.j.aktif, []); ok1('sistem sayacı kalıp yazar, olay ucunu saymaz, boşta alarm yok');
    r = await X('POST', '/api/orders/quote', { items: [null] }); assert.equal(r.status, 400, 'kötü sepet 500 olup alarmı şişirmemeli');
    r = await A('GET', '/api/admin/loglar'); assert.ok(Array.isArray(r.j.rows)); assert.deepEqual(r.j.rows.filter((x) => x.olay === 'api.hata'), []); ok1('kötü sepet 400 döner, günlük ve alarm şişmez');
    await kok.query(`INSERT INTO \`${DBN}\`.log_kayit (at, kanal, seviye, olay, mesaj) VALUES (UTC_TIMESTAMP(), 'uygulama', 'hata', 'deneme', 'x')`); r = await A('GET', '/api/admin/loglar?seviye=hata'); assert.equal(r.j.rows.length, 1); r = await A('GET', '/api/admin/loglar?seviye=uyari'); assert.equal(r.j.rows.length, 0); ok1('günlük ekranı seviyeye göre süzer');

    // Hız sınırı en sonda (aynı IP için bütçeyi tüketir)
    let son = 0; for (let i = 0; i < 125; i++) { r = await X('POST', '/api/olay', { tur: 'sayfa', riza: true }, v('198.51.100.9')); son = r.status; } assert.equal(son, 429); r = await X('POST', '/api/olay', { tur: 'sayfa', riza: true }, v('198.51.100.10')); assert.equal(r.status, 200); ok1('IP başına oran sınırı 429 döner, diğer ziyaretçi etkilenmez');
    return true;
  } catch (e) { console.error(cikti.slice(-3000)); throw e; } finally {
    srv.kill(); await new Promise((r) => setTimeout(r, 300)); await kok.query(`DROP DATABASE IF EXISTS \`${DBN}\``); await kok.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
}
function ok1(ad) { n++; console.log('  ✓', ad); }

(async () => {
  await birim();
  // Birim bölümü db nesnesini sahtesiyle değiştirdi; uçtan uca bölüm ayrı süreçte gerçek sunucuyu kullanır
  const tam = await uctan();
  console.log(`\nAnalitik: ${n} test geçti${tam ? '' : ' (uçtan uca bölüm ATLANDI)'}`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
