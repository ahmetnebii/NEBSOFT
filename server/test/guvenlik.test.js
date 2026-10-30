// Güvenlik gerileme testleri (docs/GUVENLIK-RAPORU.md bulguları). Dış sisteme istek atmaz, MySQL gerektirmez: node server/test/guvenlik.test.js
//  1. Gerçek server.js ayrı süreçte açılır: dosya yolu aşımı, kod sızıntısı, yerel köprü kapısı
//  2. Saf işlevler: yol, iç ağ adresi, çerez, e-posta kaydı, işletme sitesi XSS, müşteri sayfası kuralları
//  3. Bulut API'si bellek içi sahte veritabanıyla: ekip yetkisi, alan adı, kurulum bilgisi, ürün havuzu
const assert = require('assert'); const http = require('http'); const fs = require('fs'); const os = require('os'); const path = require('path'); const crypto = require('crypto'); const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
let passed = 0; const ok = (m) => { passed++; console.log('  ✓ ' + m); };
const raw = (port, p, { method = 'GET', headers = {}, body } = {}) => new Promise((res, rej) => { const r = http.request({ host: '127.0.0.1', port, path: p, method, headers }, (x) => { let b = ''; x.setEncoding('utf8'); x.on('data', (d) => { b += d; }); x.on('end', () => res({ s: x.statusCode, b, h: x.headers })); }); r.on('error', rej); if (body) r.write(body); r.end(); });
const POST = (extra, body = '{"host":"127.0.0.1","port":1}') => ({ method: 'POST', headers: { 'Content-Type': 'text/plain', ...extra }, body });

async function start(port, env, dataDir) {
  const p = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, TRUST_PROXY: '', NODE_ENV: '', HOST: '127.0.0.1', PORT: String(port), NEBSOFT_DATA: dataDir, ...env }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { await raw(port, '/robots.txt'); return p; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }
  p.kill(); throw new Error('sunucu açılmadı');
}

async function sunucu() {
  const base = 15100 + (process.pid % 3000); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-guv-'));
  const dataDir = path.join(ROOT, 'data'); fs.mkdirSync(dataDir, { recursive: true }); const canary = path.join(dataDir, 'guvenlik-canary.txt'); const SECRET = 'GIZLI-' + crypto.randomBytes(6).toString('hex'); fs.writeFileSync(canary, SECRET);
  const procs = [];
  try {
    const port = base; procs.push(await start(port, {}, path.join(tmp, 'a')));
    for (const p of ['/apps/../data/guvenlik-canary.txt', '/apps/%2e%2e/data/guvenlik-canary.txt', '/data%5Cguvenlik-canary.txt', '/t/x/apps/../../data/guvenlik-canary.txt', '/core/..%2Fdata/guvenlik-canary.txt', '/apps/../package.json', '/apps/../server/cloud/config.js', '/apps/../DEPLOY.md', '/./data/guvenlik-canary.txt', '/data./guvenlik-canary.txt', '/data/guvenlik-canary.txt::$DATA']) {
      const r = await raw(port, p); assert.strictEqual(r.s, 404, p + ' → ' + r.s); assert.ok(!r.b.includes(SECRET) && !r.b.includes('mysql2'), p);
    }
    ok('dosya yolu aşımı: "..", kodlanmış, ters bölü ve Windows biçimleri 404');
    for (const p of ['/server.js', '/sunucu.json', '/package.json', '/CLAUDE.md', '/README.md', '/apps/hukuk/sure.test.js', '/.gitignore']) assert.strictEqual((await raw(port, p)).s, 404, p);
    ok('sunucu kodu, ayar ve belge dosyaları sunulmuyor');
    for (const p of ['/', '/index.html', '/core/core.js', '/apps/klinik/', '/apps/klinik/index.html', '/assets/favicon.svg', '/t/ornek/apps/klinik/index.html', '/manifest.webmanifest']) assert.strictEqual((await raw(port, p)).s, 200, p);
    ok('normal sayfalar açılıyor');

    assert.strictEqual((await raw(port, '/api/durum')).s, 200);
    assert.strictEqual((await raw(port, '/api/tcp-test', POST({ Origin: `http://127.0.0.1:${port}` }))).s, 200);
    ok('köprü: aynı bilgisayardan, aynı kaynaktan açık');
    const denied = [['başka site Origin', { Origin: 'https://evil.example' }], ['Origin null', { Origin: 'null' }], ['DNS rebinding Host', { Host: `evil.example:${port}` }], ['vekil X-Forwarded-For', { 'X-Forwarded-For': '8.8.8.8' }], ['vekil X-Real-IP', { 'X-Real-IP': '8.8.8.8' }]];
    for (const [n, h] of denied) { const r = await raw(port, '/api/tcp-test', POST(h)); assert.strictEqual(r.s, 403, n); }
    assert.strictEqual((await raw(port, '/api/kanal', { headers: { Host: 'evil.example' } })).s, 403);
    ok('köprü: başka site, DNS rebinding ve vekil istekleri 403');

    const port2 = base + 1; procs.push(await start(port2, { TRUST_PROXY: '1' }, path.join(tmp, 'b')));
    for (const a of ['/api/tcp-test', '/api/yazdir', '/api/modbus', '/api/mqtt', '/api/pos/satis', '/api/istek']) assert.strictEqual((await raw(port2, a, POST({}))).s, 403, a);
    ok('köprü: TRUST_PROXY=1 (nginx arkası) sunucuda hiçbir köprü ucu açılmıyor');

    const d3 = path.join(tmp, 'c'); fs.mkdirSync(d3, { recursive: true }); fs.writeFileSync(path.join(d3, 'config.enc'), 'x');
    const port3 = base + 2; procs.push(await start(port3, {}, d3));
    assert.strictEqual((await raw(port3, '/api/tcp-test', POST({}))).s, 403);
    ok('köprü: bulut kurulumunda veritabanı kopukken de kapalı');
  } finally { procs.forEach((p) => p.kill()); fs.rmSync(canary, { force: true }); fs.rmSync(tmp, { recursive: true, force: true }); }
}

async function saf() {
  const sec = require('../cloud/security');
  for (const p of ['/a/../b', '/..', '/./a', '/a\\b', '/a:b', '/a./b', '/a /b', '/a\u0001']) assert.strictEqual(sec.safePath(p), null, p);
  for (const p of ['/', '/index.html', '/apps/klinik/', '/assets/a-b_c.1.png']) assert.strictEqual(sec.safePath(p), p, p);
  ok('safePath');
  for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '192.0.0.1', '198.18.0.1', '224.0.0.1', '::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', 'fec0::1', 'ff02::1', '::ffff:127.0.0.1', '64:ff9b::7f00:1', '2002:7f00:1::']) assert.ok(sec.privateIp(a), a);
  for (const a of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111']) assert.ok(!sec.privateIp(a), a);
  ok('iç ağ adresi listesi (IPv6 geçiş önekleri dahil)');
  assert.deepStrictEqual(sec.cookies({ headers: { cookie: 'a=%E0%A4%A; nsid=abc' } }), { nsid: 'abc' }); ok('bozuk çerez isteği düşürmüyor');
  assert.ok(sec.safeEq('abc', 'abc') && !sec.safeEq('abc', 'abd') && !sec.safeEq('abc', 'abcd')); ok('sabit süreli karşılaştırma');
  await assert.rejects(sec.safeFetch('http://localhost:9/'), (e) => e.code === 'ENOTPUBLIC'); ok('safeFetch: ada çözülen iç adrese bağlanmıyor (DNS rebinding)');

  // Yerel sahte sunucu: dış servise istek atılmaz; denetimli çözümleyici yerine testte 127.0.0.1 verilir
  const seen = []; const srv = http.createServer((q, s) => { let b = ''; q.on('data', (d) => { b += d; }); q.on('end', () => { seen.push({ m: q.method, h: q.headers, b }); if (q.url === '/yon') { s.writeHead(302, { Location: 'http://127.0.0.1:1/ic' }); return s.end(); } if (q.url === '/buyuk') { s.writeHead(200); return s.end(Buffer.alloc(5000, 'x')); } s.writeHead(201, { 'Content-Type': 'text/plain' }); s.end('tamam'); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port; const lookup = (h, o, cb) => (o.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4));
  let r = await sec.safeFetch(`http://servis.test:${port}/x`, { method: 'POST', headers: { 'X-A': '1', Host: 'kotu', 'Content-Length': '999' }, body: 'şğ', lookup });
  assert.strictEqual(r.status, 201); assert.strictEqual(r.text, 'tamam'); assert.ok(r.ok); assert.strictEqual(seen[0].b, 'şğ'); assert.strictEqual(seen[0].h['x-a'], '1'); assert.strictEqual(seen[0].h['content-length'], '4'); assert.ok(seen[0].h.host.startsWith('servis.test'));
  r = await sec.safeFetch(`http://servis.test:${port}/x`, { method: 'GET', body: 'yok', lookup }); assert.strictEqual(seen[1].b, '');
  r = await sec.safeFetch(`http://servis.test:${port}/yon`, { method: 'GET', lookup }); assert.strictEqual(r.status, 302); assert.strictEqual(seen.length, 3);
  r = await sec.safeFetch(`http://servis.test:${port}/buyuk`, { method: 'GET', lookup, maxBytes: 100 }); assert.ok(r.text.length <= 5000);
  srv.close(); ok('safeFetch: gövde, başlık, yönlendirme izlememe, boyut sınırı');

  const mail = require('../cloud/mail'); assert.strictEqual(mail.logSubject('123456 — giriş kodunuz'), '•••••• — giriş kodunuz'); assert.strictEqual(mail.logSubject('Siparişiniz alındı'), 'Siparişiniz alındı'); ok('doğrulama kodu e-posta kaydına yazılmıyor');

  const biz = require('../../core/bizsite');
  const x = '</script><img src=x onerror=alert(1)>';
  const html = biz.render({ mode: 'siparis', name: 'A', products: [{ id: 'p1"onclick=a()', name: x, price: 10 }] }, { orderable: true, slug: 's' });
  assert.ok(!html.includes(x), 'ürün adı betikten kaçmamalı'); assert.ok(!/"onclick=/.test(html)); assert.ok(html.includes('\\u003c/script>')); ok('işletme sitesi: ürün adı ve kimliğinden betik enjeksiyonu yok');

  const RULES = require('../cloud/public-rules');
  const hx = (doc, ident, q) => ({ doc, ident, q: q || {}, col: (n) => doc[n] || [], get: (n, id) => (doc[n] || []).find((r) => r.id === id), today: '2026-10-30', now: new Date(), pick: (o, f) => Object.fromEntries(f.map((k) => [k, o[k]])) });
  const doc = { rxOrders: [{ id: 'kurban', phone: '05321112233', name: 'Ayşe Yılmaz', rxNo: 'ABC123', note: 'şeker ilacı', code: 'RZZZZZZ', status: 'yeni' }] };
  const rec = RULES.eczane.write.rxOrders.ins({ rxNo: 'XYZ1234', name: 'Saldırgan', phone: '0532 111 22 33', pickup: 'Eczaneden' }, hx(doc, null)); rec.id = 'yeni'; doc.rxOrders.push(rec);
  const g = RULES.eczane.grant(hx(doc, null), [['rxOrders', rec]]); assert.deepStrictEqual(g, { k: 'r', i: 'yeni' });
  let v = RULES.eczane.view(hx(doc, { k: g.k, i: g.i })); assert.deepStrictEqual(v.rxOrders.map((o) => o.id), ['yeni']); ok('eczane: başkasının telefonuyla reçete açmak o kişinin reçetelerini göstermiyor');
  assert.strictEqual(RULES.eczane.login(hx(doc, null), { phone: '05321112233', code: 'YANLIS' }), null); assert.deepStrictEqual(RULES.eczane.login(hx(doc, null), { phone: '05321112233', code: 'RZZZZZZ' }), { k: 'p', i: '5321112233' });
  v = RULES.eczane.view(hx(doc, { k: 'p', i: '5321112233' })); assert.strictEqual(v.rxOrders.length, 2); assert.ok(/^R[A-Z2-9]{6}$/.test(rec.code)); ok('eczane: telefon + takip koduyla giriş çalışıyor, kod kripto rastgele');
  const sdoc = { tickets: [{ id: 't1', no: 'SRV1001', code: '7KX2QA' }, { id: 't2', no: 'SRV1002' }] };
  assert.strictEqual(RULES.servis.login(hx(sdoc), { kod: 'SRV1001' }), null); assert.strictEqual(RULES.servis.login(hx(sdoc), { kod: 'SRV1002' }), null); assert.deepStrictEqual(RULES.servis.login(hx(sdoc), { kod: '7kx2qa' }), { k: 't', i: 't1' }); ok('servis: sıralı kayıt noyla giriş yok, takip kodu büyük/küçük harf duyarsız');
}

async function bulut() {
  const tok = (n) => n.repeat(40); const sha = (s) => crypto.createHash('sha256').update(s).digest('hex'); const later = new Date(Date.now() + 864e5);
  const U = { owner: { id: 'u1', email: 'o@x.tr', name: 'Sahip', role: 'customer', tenant_id: 't1', status: 'active', expires: later }, ekip: { id: 'u2', email: 'e@x.tr', name: 'Ekip', role: 'customer', tenant_id: 't1', status: 'active', expires: later } };
  const S = { [sha(tok('a'))]: U.owner, [sha(tok('b'))]: U.ekip }; const log = []; let hasAdmin = true;
  const q = async (sql, p = []) => {
    if (/FROM sessions s JOIN users/.test(sql)) return S[p[0]] ? [S[p[0]]] : [];
    if (/SELECT status FROM tenants/.test(sql)) return [{ status: 'active' }];
    if (/role='superadmin'/.test(sql)) return hasAdmin ? [{ id: 'adm' }] : [];
    if (/ORDER BY created, id LIMIT 1/.test(sql)) return [{ id: 'u1' }];
    if (/SELECT v FROM settings/.test(sql)) return p[0] === 'site' || /site/.test(sql) ? [{ v: JSON.stringify({ siteUrl: 'https://www.nebsoftapp.test' }) }] : [];
    if (/^DELETE FROM users/.test(sql)) { log.push(['sil', p[0]]); return { affectedRows: 1 }; }
    if (/^INSERT INTO users/.test(sql)) { log.push(['ekle', p[1]]); return {}; }
    if (/SELECT tenant_id, domain_ok FROM biz_sites/.test(sql)) return p[0] === 'www.dogrulanmis.com.tr' ? [{ tenant_id: 'b', domain_ok: 1 }] : p[0] === 'www.onalinmis.com.tr' ? [{ tenant_id: 'b', domain_ok: 0 }] : [];
    if (/^UPDATE biz_sites SET domain=NULL/.test(sql)) { log.push(['alan-birakildi', p[0]]); return {}; }
    if (/^INSERT INTO biz_sites/.test(sql)) { log.push(['site', p[3]]); return {}; }
    if (/^INSERT INTO catalog_suggest/.test(sql)) { log.push(['havuz', p[0]]); return {}; }
    if (/^UPDATE tenants SET name/.test(sql)) { log.push(['sirket', p[0]]); return {}; }
    if (/COUNT\(\*\) AS n FROM users/.test(sql)) return [{ n: 1 }];
    return [];
  };
  const fake = { ready: () => true, gocEkle: () => {}, q, one: async (s, p) => (await q(s, p))[0] || null, tx: async (f) => f({ q }), info: () => ({ host: '10.0.0.10', database: 'nebsoft', version: '8' }), close: async () => {} };
  const id = require.resolve('../cloud/db'); require.cache[id] = { id, filename: id, loaded: true, exports: fake };
  const cloud = require('../cloud'); const seo = require('../cloud/seo');
  const srv = http.createServer((a, b) => { let p; try { p = decodeURIComponent(a.url.split('?')[0]); } catch (e) { b.writeHead(400); return b.end(); } cloud.handle(a, b, p).then((d) => { if (!d) { b.writeHead(404); b.end('{}'); } }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const api = (m, p, who, body, h = {}) => raw(port, p, { method: m, headers: { 'x-ns-csrf': '1', 'Content-Type': 'application/json', ...(who ? { Cookie: `nsid=${tok(who)}` } : {}), ...h }, body: body ? JSON.stringify(body) : undefined }).then((r) => ({ s: r.s, j: JSON.parse(r.b || '{}') }));
  try {
    let r = await api('GET', '/api/setup/status'); assert.strictEqual(r.j.db, null); assert.ok(!JSON.stringify(r.j).includes('10.0.0.10')); ok('kurulum sonrası /api/setup/status veritabanı adresini vermiyor');
    r = await api('GET', '/api/auth/me', null, null, { Cookie: 'nsid=%E0%A4%A' }); assert.strictEqual(r.s, 200); ok('bozuk çerez 500 üretmiyor');

    r = await api('DELETE', '/api/team/u1', 'b'); assert.strictEqual(r.s, 403); assert.ok(!log.some((x) => x[0] === 'sil')); ok('ekip üyesi hesap sahibini silemiyor');
    r = await api('POST', '/api/team', 'b', { email: 'y@x.tr', name: 'Yeni', pass: 'Parola12345' }); assert.strictEqual(r.s, 403); ok('ekip üyesi yeni kullanıcı ekleyemiyor');
    r = await api('PUT', '/api/account', 'b', { name: 'Ekip Kisi', company: 'Ele Gecti' }); assert.strictEqual(r.s, 403); assert.ok(!log.some((x) => x[0] === 'sirket')); r = await api('PUT', '/api/account', 'b', { name: 'Ekip Kisi' }); assert.strictEqual(r.s, 200); ok('ekip üyesi yalnızca kendi adını değiştirir, işletme bilgisini değil');
    r = await api('DELETE', '/api/team/u2', 'a'); assert.strictEqual(r.s, 200); assert.ok(log.some((x) => x[0] === 'sil' && x[1] === 'u2')); ok('hesap sahibi ekip üyesini silebilir');

    for (const d of ['www.nebsoftapp.test', 'nebsoftapp.test', 'magaza.nebsoftapp.test', '45.133.36.99']) { r = await api('PUT', '/api/websitem', 'a', { data: {}, domain: d }); assert.strictEqual(r.s, 400, d); }
    r = await api('PUT', '/api/websitem', 'a', { data: {}, domain: `127.0.0.1` }); assert.strictEqual(r.s, 400);
    assert.ok(!log.some((x) => x[0] === 'site')); r = await api('PUT', '/api/websitem', 'a', { data: {}, domain: 'www.isletmem.com.tr' }); assert.strictEqual(r.s, 200); assert.ok(log.some((x) => x[0] === 'site' && x[1] === 'www.isletmem.com.tr')); ok('işletme platformun alan adını ve IP adresini sahiplenemiyor');
    assert.strictEqual(await seo.domainSite({ headers: { host: 'www.nebsoftapp.test' }, socket: {} }, '/'), null); ok('eski kayıt olsa da platform adresi işletme sitesine dönmüyor');

    r = await api('PUT', '/api/websitem', 'a', { data: {}, domain: 'www.dogrulanmis.com.tr' }); assert.strictEqual(r.s, 409); r = await api('PUT', '/api/websitem', 'a', { data: {}, domain: 'www.onalinmis.com.tr' }); assert.strictEqual(r.s, 200); assert.ok(log.some((x) => x[0] === 'alan-birakildi' && x[1] === 'b')); assert.strictEqual(r.j.alanAdi.dogrulandi, false); assert.ok(/^nebsoft-dogrulama=/.test(r.j.alanAdi.deger)); ok('doğrulanmamış kayıt alan adını tutamıyor, yeni kayıt TXT doğrulaması bekliyor');
    r = await api('POST', '/api/katalog/katki', null, { items: [{ barcode: '8690000000012', name: 'Sahte' }] }); assert.strictEqual(r.s, 401); assert.ok(!log.some((x) => x[0] === 'havuz')); r = await api('POST', '/api/katalog/katki', 'a', { items: [{ barcode: '8690000000012', name: 'Gerçek' }] }); assert.strictEqual(r.j.eklenen, 1); ok('ortak kataloğa yalnızca oturumlu işletme öneri gönderiyor');

    r = await raw(port, '/api/w/yok/siparis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); assert.strictEqual(r.s, 404); r = await raw(port, '/api/w/yok/siparis', { method: 'POST', headers: { Origin: 'https://evil.example', Host: '127.0.0.1' }, body: '{}' }); assert.strictEqual(r.s, 403); ok('site siparişi: sayfanın isteği geçiyor, başka siteden reddediliyor');
  } finally { srv.close(); }
}

// Kayıtlı gizli bilgi, yer tutucuyla ekip üyesinin kendi sunucusuna gönderilemez
async function gizliAdres() {
  const s = require('../cloud/secrets'); const tk = s.token('entegrasyon', 'sms', 'apiKey'); const dbx = { one: async () => ({ data: JSON.stringify({ cfg: { sms: { apiKey: 'düz-anahtar', url: 'https://ozel.firmam.com/api' } } }) }) };
  const gonder = (url) => s.resolve(dbx, 't', { url, headers: { A: tk } });
  assert.strictEqual((await gonder('https://api.netgsm.com.tr/sms')).headers.A, 'düz-anahtar'); assert.strictEqual((await gonder('https://efatura.uyumsoft.com.tr/x')).headers.A, 'düz-anahtar'); assert.strictEqual((await gonder('https://ozel.firmam.com/v2')).headers.A, 'düz-anahtar');
  await assert.rejects(gonder('https://kotu.example.com/topla'), (e) => e.status === 400); await assert.rejects(gonder('https://ozel.firmam.com.kotu.example/x'), (e) => e.status === 400);
  assert.strictEqual((await s.resolve(dbx, 't', { url: 'https://kotu.example.com/', body: 'yer tutucu yok' })).body, 'yer tutucu yok'); ok('gizli bilgi yalnızca sağlayıcıya veya kayıtlı adrese çözülüyor');
}
// Randevu: telefon tek başına giriş açmaz; başkasının numarasıyla alınan randevunun kodu müşteri kimliği vermez
function randevuKodu() {
  const R = require('../cloud/public-rules').randevu; const doc = { customers: [{ id: 'c1', name: 'Ayşe', phone: '05321112233', portalCode: 'ABC234' }], appointments: [{ id: 'a1', customer: 'c1', tCode: 'XYZ789', date: '2099-01-01', start: '10:00', note: 'özel' }, { id: 'a2', customer: 'c1', tCode: 'KLM456', date: '2099-01-02', start: '11:00', note: 'gizli-not' }] };
  const x = (ident) => ({ ident, today: '2026-01-01', col: (n) => doc[n] || [], get: (n, id) => (doc[n] || []).find((r) => r.id === id), pick: (r, f) => Object.fromEntries(f.filter((k) => k in r).map((k) => [k, r[k]])), doc });
  assert.strictEqual(R.login(x(), { phone: '05321112233' }), null); assert.strictEqual(R.login(x(), { phone: '05321112233', code: 'YANLIS' }), null); assert.strictEqual(R.login(x(), { phone: '05329998877', code: 'XYZ789' }), null);
  assert.deepStrictEqual(R.login(x(), { phone: '0532 111 22 33', code: 'abc234' }), { k: 'c', i: 'c1' }); assert.deepStrictEqual(R.login(x(), { phone: '05321112233', code: 'xyz789' }), { k: 'a', i: 'a1' });
  const v = JSON.stringify(R.view(x({ k: 'a', i: 'a1' }))); assert.ok(!v.includes('Ayşe') && !v.includes('05321112233') && !v.includes('KLM456') && !v.includes('gizli-not')); assert.ok(v.includes('XYZ789')); ok('randevu kodu yalnızca kendi randevusunu açıyor, telefonla giriş yok');
}

(async () => {
  console.log('Güvenlik testleri'); await sunucu(); await saf(); await gizliAdres(); randevuKodu(); await bulut();
  console.log(`\n${passed} denetim geçti`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
