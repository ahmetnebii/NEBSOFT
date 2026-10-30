// Sipariş, destek paketi, toplu indirim ve kurumsal teklif uçtan uca testi.
//   TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS= TEST_DB_NAME=nebsoft_siparis_test node server/test/siparis-destek.test.js
// Kendi geçici veri klasörünü ve veritabanını kullanır (her çalıştırmada sıfırlanır). Veritabanı yoksa ATLANDI yazar ve hata koduyla çıkar: atlanan test geçmiş sayılmaz.
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const assert = require('assert');
const destek = require('../cloud/destek');
const indirim = require('../cloud/indirim');
const shopier = require('../cloud/shopier');

const PORT = Number(process.env.TEST_PORT) || 5113;
const DBN = process.env.TEST_DB_NAME || 'nebsoft_siparis_test';
const DB = { host: process.env.TEST_DB_HOST || '127.0.0.1', user: process.env.TEST_DB_USER || 'root', password: process.env.TEST_DB_PASS || '' };
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'nssiparis-'));
let passed = 0; const ok = (n) => { passed++; console.log('  ✓', n); };
const P = destek.load().paketler; const K = indirim.load();
const fatura = { name: 'Ali Veli', taxNo: '1234567890', address: 'Konya Merkez' };
const yuvarla = (x) => Math.round(x * 100) / 100;

function istemci(ip) {
  let cerez = '';
  return async (m, u, body, ek = {}) => {
    const h = { 'Content-Type': 'application/json', 'x-ns-csrf': '1', 'X-Forwarded-For': ip, ...(cerez ? { Cookie: cerez } : {}) };
    if (ek.csrfYok) delete h['x-ns-csrf'];
    const r = await fetch(BASE + u, { method: m, headers: h, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cerez = sc.split(';')[0];
    let j = null; try { j = await r.json(); } catch (e) { /* html */ }
    return { status: r.status, j };
  };
}
const pos = (qty = 1, period = 'aylik') => ({ pid: 'pos', plan: 1, period, qty });

(async () => {
  let mysql; let kok;
  try { mysql = require('mysql2/promise'); kok = await mysql.createConnection({ ...DB, multipleStatements: true }); } catch (e) { console.log(`ATLANDI: veritabanına bağlanılamadı (${e.message})`); process.exit(1); }
  // Eski kurulum: yeni sütunlar yokken açılmış tablolar ve kayıtlar
  await kok.query(`DROP DATABASE IF EXISTS \`${DBN}\`; CREATE DATABASE \`${DBN}\` CHARACTER SET utf8mb4; USE \`${DBN}\`;
    CREATE TABLE tickets (id CHAR(16) PRIMARY KEY, tenant_id CHAR(16) NOT NULL, user_id CHAR(16) NOT NULL, subject VARCHAR(200) NOT NULL, product VARCHAR(40), status VARCHAR(16) NOT NULL, messages LONGTEXT NOT NULL, created DATETIME NOT NULL, updated DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    INSERT INTO tickets VALUES ('eskitalep0000001', 'x', 'y', 'Eski talep', NULL, 'acik', '[]', UTC_TIMESTAMP(), UTC_TIMESTAMP());`);
  const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..', '..'), env: { ...process.env, PORT: String(PORT), NEBSOFT_DATA: DATA, NEBSOFT_SECRET: 'siparis-test', HOST: '127.0.0.1', TRUST_PROXY: '1', NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let cikti = ''; srv.stdout.on('data', (d) => { cikti += d; }); srv.stderr.on('data', (d) => { cikti += d; });
  const olaylar = (ad) => cikti.split('\n').filter((l) => l.includes(`"olay":"${ad}"`));
  const bekle = async (ad, n = 1) => { for (let i = 0; i < 40 && olaylar(ad).length < n; i++) await new Promise((r) => setTimeout(r, 25)); return olaylar(ad); };
  try {
    for (let i = 0; i < 80 && !/çalışıyor/.test(cikti); i++) await new Promise((r) => setTimeout(r, 100));
    const A = istemci('203.0.113.1'), C = istemci('203.0.113.2'), D = istemci('203.0.113.3'), Q = istemci('203.0.113.4'), F = istemci('203.0.113.5'), L = istemci('203.0.113.6');
    const token = fs.readFileSync(path.join(DATA, 'setup-token.txt'), 'utf8').trim();
    let r = await A('POST', '/api/setup/db', { host: DB.host, database: DBN, user: DB.user, password: DB.password, token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    r = await A('POST', '/api/setup/admin', { email: 'admin@nebsoft.test', name: 'Yönetici', pass: 'GucluSifre2026!', token }); assert.equal(r.j.ok, true, JSON.stringify(r.j));
    const [[es]] = await kok.query('SELECT subject, breached, plan, first_due FROM tickets WHERE id=?', ['eskitalep0000001']); assert.deepEqual([es.subject, es.breached, es.plan, es.first_due], ['Eski talep', 0, null, null]); ok('eski kurulum: sütunlar eklendi, eski kayıt bozulmadı');
    await A('POST', '/api/admin/banks', { holder: 'NEBSOFT Yazılım A.Ş.', iban: 'TR33 0006 1005 1978 6457 8413 26', bank: 'İş Bankası' });
    await A('POST', '/api/admin/coupons', { code: 'BUYUK', pct: 30 }); await A('POST', '/api/admin/coupons', { code: 'KUCUK', pct: 3 });
    for (const [c, e] of [[C, 'musteri@firma.test'], [D, 'ikinci@firma.test']]) { r = await c('POST', '/api/auth/register', { email: e, pass: 'Sifre1234', name: 'Ali Veli', phone: '05321112233', company: e, kvkk: true, product: 'pos' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); }

    // Paket listesi yapılandırmadan gelir
    r = await Q('GET', '/api/destek/paketler'); assert.deepEqual(r.j.paketler.map((p) => [p.id, p.aylik, p.ilkYanitSaat, p.cozumSaat]).sort(), Object.entries(P).map(([k, p]) => [k, p.aylik, p.ilkYanitSaat, p.cozumSaat]).sort()); assert.ok(r.j.paketler.every((p) => p.takvim && p.kanallar.length)); ok('paket, kanal, süre ve fiyat yapılandırmadan okunuyor');

    // Tutar: katalog + destek, indirim destekten düşmez, KDV indirimden sonra
    const tek = (await Q('POST', '/api/orders/quote', { items: [pos()] })).j; assert.equal(tek.discount, 0); const fp = tek.subtotal;
    r = await Q('POST', '/api/orders/quote', { items: [pos()], support: { plan: 'orta', period: 'aylik' } }); assert.equal(r.j.subtotal, fp + P.orta.aylik); assert.equal(r.j.vat, yuvarla((fp + P.orta.aylik) * 0.2));
    const dl = r.j.lines.find((l) => l.type === 'support'); assert.deepEqual([dl.name, dl.price, dl.plan], [`${P.orta.ad} destek paketi`, P.orta.aylik, 'orta']); ok('destek ayrı kalem; KDV dahil tutar doğru');
    r = await Q('POST', '/api/orders/quote', { items: [pos()], support: { plan: 'ust', period: 'yillik' } }); assert.equal(r.j.lines.find((l) => l.type === 'support').price, P.ust.aylik * 10); ok('yıllık destek 10 ay');
    r = await Q('POST', '/api/orders/quote', { items: [pos()], support: { plan: 'standart' } }); assert.equal(r.j.lines.length, 1); ok('ücretsiz paket kalem oluşturmaz');
    const iki = [pos(), { pid: 'adisyon', plan: 1, period: 'aylik', qty: 1 }]; const y2 = K.programSayisi.find((t) => t.min === 2).yuzde;
    const t2 = (await Q('POST', '/api/orders/quote', { items: iki })).j; assert.equal(t2.indirim.kural, 'programSayisi'); assert.equal(t2.discount, yuvarla(t2.subtotal * y2 / 100)); assert.equal(t2.vat, yuvarla((t2.subtotal - t2.discount) * 0.2)); assert.equal(t2.total, yuvarla(t2.subtotal - t2.discount + t2.vat));
    r = await Q('POST', '/api/orders/quote', { items: iki, support: { plan: 'orta' } }); assert.equal(r.j.discount, t2.discount); ok('program sayısı indirimi; destek indirime girmedi, KDV indirimden sonra');
    assert.ok(t2.sonraki && t2.sonraki.yuzde > y2 && t2.sonraki.eksik >= 1); ok('bir sonraki kademe döndü');
    r = await Q('POST', '/api/orders/quote', { items: iki, coupon: 'BUYUK' }); assert.deepEqual([r.j.indirim.kural, r.j.coupon], ['kupon', 'BUYUK']); assert.equal(r.j.discount, yuvarla(t2.subtotal * 0.3));
    r = await Q('POST', '/api/orders/quote', { items: iki, coupon: 'KUCUK' }); assert.deepEqual([r.j.indirim.kural, r.j.coupon, r.j.kuponGirildi], ['programSayisi', null, 'KUCUK']); ok('kupon birleşmez, büyük olan geçerli');
    r = await Q('POST', '/api/orders/quote', { items: [pos()], subeSayisi: 5 }); assert.equal(r.j.indirim.kural, 'subeSayisi'); assert.equal(r.j.olcut.subeSayisi, 5); ok('şube kademesi uygulandı');
    r = await Q('POST', '/api/orders/quote', { items: [{ pid: 'bundle', plan: 1, period: 'aylik', qty: 1 }], coupon: 'BUYUK' }); assert.equal(r.j.discount, 0); ok('Hepsi Bir Arada indirime girmedi');

    // İstemciye güvenilmez, kötü girdi
    r = await Q('POST', '/api/orders/quote', { items: [{ ...pos(), price: 1, line: 1 }], lisansSayisi: 25, total: 1, discount: 999, support: { plan: 'orta', price: 1 } }); assert.equal(r.j.subtotal, fp + P.orta.aylik); assert.equal(r.j.discount, 0); assert.equal(r.j.olcut.lisansSayisi, 1); assert.equal(r.j.kurumsal, false); ok('istemci fiyatı ve sahte lisans sayısı yok sayıldı');
    for (const [b, n] of [[{ items: 'x' }, 'metin sepet'], [{ items: [] }, 'boş sepet'], [{}, 'sepet yok'], [{ items: [null] }, 'boş kalem'], [{ items: [{ pid: 'destek-orta', plan: 1 }] }, 'kalem olarak destek'], [{ items: [{ pid: 'yok', plan: 1 }] }, 'bilinmeyen ürün'], [{ items: [{ pid: 'pos', plan: 9 }] }, 'bilinmeyen paket'], [{ items: [pos()], support: { plan: 'constructor' } }, 'prototip adı'], [{ items: [pos()], support: { plan: '__proto__' } }, 'prototip adı 2'], [{ items: [pos()], support: { plan: 5 } }, 'sayı paket'], [{ items: [pos()], support: 'orta' }, 'metin destek'], [{ items: [pos()], coupon: 'YOKBOYLE' }, 'geçersiz kupon']]) { r = await Q('POST', '/api/orders/quote', b); assert.equal(r.status, 400, n + ' ' + JSON.stringify(r.j)); }
    ok('kötü girdiler 400 döndü (500 değil)');
    r = await Q('POST', '/api/orders/quote', { items: [pos(2.7)] }); assert.equal(r.j.olcut.lisansSayisi, 2); assert.equal(r.j.subtotal, fp * 2);
    for (const [x, b] of [['abc', 1], [-5, 1], [1e12, 1000], [null, 1]]) { r = await Q('POST', '/api/orders/quote', { items: [pos()], subeSayisi: x }); assert.equal(r.j.olcut.subeSayisi, b); }
    ok('kesirli adet ve hatalı şube sayısı temizlendi');

    // Sipariş: beyan, kurumsal yönlendirme, kayıt
    r = await C('POST', '/api/orders', { items: [pos()], subeSayisi: 5, billing: fatura }); assert.equal(r.status, 400); ok('şube beyanı onaysız reddedildi');
    r = await C('POST', '/api/orders', { items: [pos(K.kurumsal.formEsigi)], billing: fatura }); assert.equal(r.status, 409); assert.equal(r.j.code, 'kurumsal'); r = await Q('POST', '/api/orders/quote', { items: [pos(K.kurumsal.formEsigi)] }); assert.equal(r.j.kurumsal, true); ok('eşikteki adet teklif formuna yönlendi');
    r = await C('POST', '/api/orders', { items: [pos(3)], subeSayisi: 5, subeBeyan: true, support: { plan: 'orta', period: 'aylik' }, coupon: 'KUCUK', billing: fatura });
    assert.equal(r.j.ok, true, JSON.stringify(r.j)); const o1 = r.j.order; const beklenenAra = fp * 3; const y5 = K.subeSayisi.find((t) => t.min === 5).yuzde;
    assert.equal(o1.subtotal, beklenenAra + P.orta.aylik); assert.equal(o1.discount, yuvarla(beklenenAra * y5 / 100)); assert.equal(o1.coupon, null); assert.equal(o1.indirim.kural, 'subeSayisi'); assert.deepEqual([o1.indirim.beyan.subeSayisi, o1.indirim.beyan.onay], [5, true]); assert.equal(o1.indirim.olcut.lisansSayisi, 3); ok('sipariş tutarı, indirim ve şube beyanı kaydedildi');
    let [[kp]] = await kok.query(`SELECT uses FROM \`${DBN}\`.coupons WHERE code='KUCUK'`); assert.equal(kp.uses, 0); ok('uygulanmayan kupon kullanılmış sayılmadı');
    r = await A('GET', '/api/admin/orders'); const pa = r.j.orders.find((x) => x.id === o1.id); assert.equal(pa.indirim.beyan.subeSayisi, 5); assert.ok(pa.items.some((i) => i.type === 'support')); ok('panel beyanı ve destek kalemini görüyor');
    let [[te]] = await kok.query(`SELECT t.support_plan, t.support_until, t.id FROM \`${DBN}\`.tenants t JOIN \`${DBN}\`.users u ON u.tenant_id=t.id WHERE u.email='musteri@firma.test'`); assert.equal(te.support_plan, null); ok('ödenmeden paket açılmadı');
    await C('POST', '/api/tickets', { subject: 'Ödeme öncesi', text: 'Merhaba' });
    r = await C('GET', '/api/tickets'); assert.equal(r.j.tickets[0].plan, 'standart'); assert.equal(r.j.destek.id, 'standart'); const std = r.j.tickets[0];

    r = await A('POST', `/api/admin/orders/${o1.id}/approve`, {}); assert.equal(r.j.ok, true);
    [[te]] = await kok.query(`SELECT id, support_plan, support_until FROM \`${DBN}\`.tenants WHERE id=?`, [te.id]); assert.equal(te.support_plan, 'orta'); const gun = (new Date(te.support_until) - Date.now()) / 864e5; assert.ok(gun > 27 && gun < 32, String(gun)); ok('ödeme onayıyla paket ve bitiş tarihi yazıldı');
    r = await C('GET', '/api/auth/me'); assert.equal(r.j.licenses.find((l) => l.product === 'pos').branches, 3); ok('lisans adedi lisans kaydına yazıldı');
    r = await C('GET', '/api/tickets'); assert.equal(r.j.tickets.find((t) => t.id === std.id).plan, 'standart'); assert.equal(new Date(r.j.tickets.find((t) => t.id === std.id).first_due).getTime(), new Date(std.first_due).getTime()); ok('paket değişince eski talep etkilenmedi');

    // SLA alanları
    await C('POST', '/api/tickets', { subject: 'Ödeme sonrası', text: 'Merhaba' });
    r = await C('GET', '/api/tickets'); const t1 = r.j.tickets.find((t) => t.subject === 'Ödeme sonrası'); assert.deepEqual([t1.plan, t1.priority], ['orta', P.orta.oncelik]); assert.ok(t1.first_due && t1.resolve_due && new Date(t1.first_due) <= new Date(t1.resolve_due)); assert.equal(t1.breached, 0); assert.equal(t1.sla.asama, 'ilk-yanit'); assert.equal(r.j.destek.id, 'orta'); assert.ok(r.j.destek.bitis); ok('talep paket süreleriyle açıldı');
    await C('POST', `/api/tickets/${t1.id}/reply`, { text: 'Ek bilgi' }); r = await C('GET', '/api/tickets'); assert.equal(r.j.tickets.find((t) => t.id === t1.id).first_reply_at, null); ok('müşteri yanıtı ilk yanıt sayılmadı');
    await A('POST', `/api/tickets/${t1.id}/reply`, { text: 'Bakıyoruz' }); r = await C('GET', '/api/tickets'); const fr = r.j.tickets.find((t) => t.id === t1.id).first_reply_at; assert.ok(fr); assert.equal(r.j.tickets.find((t) => t.id === t1.id).sla.asama, 'cozum');
    await A('POST', `/api/tickets/${t1.id}/reply`, { text: 'İkinci' }); r = await C('GET', '/api/tickets'); assert.equal(new Date(r.j.tickets.find((t) => t.id === t1.id).first_reply_at).getTime(), new Date(fr).getTime()); ok('ilk yönetici yanıtı bir kez yazıldı');
    await A('POST', `/api/tickets/${t1.id}/reply`, { close: true }); r = await C('GET', '/api/tickets'); const kap = r.j.tickets.find((t) => t.id === t1.id); assert.ok(kap.closed_at); assert.equal(kap.sla.durum, 'kapandi'); ok('kapanış closed_at yazdı');
    await C('POST', `/api/tickets/${t1.id}/reply`, { text: 'Tekrar açıyorum' }); r = await C('GET', '/api/tickets'); assert.equal(r.j.tickets.find((t) => t.id === t1.id).closed_at, null); ok('yeniden açılan talepte kapanış silindi');

    // Aşım: bir kez işaretlenir, bir kez loglanır; panel sırası ve filtre
    await kok.query(`UPDATE \`${DBN}\`.tickets SET first_due=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR) WHERE id=?`, [std.id]);
    r = await A('GET', '/api/admin/tickets'); const as = r.j.tickets.find((t) => t.id === std.id); assert.equal(as.breached, 1); assert.equal(as.sla.durum, 'asildi'); assert.ok(as.sla.kalanDk < 0); await A('GET', '/api/admin/tickets');
    assert.equal((await bekle('destek.sla_asildi')).length, 1); ok('aşım işaretlendi, olay bir kez yazıldı');
    assert.ok(r.j.tickets.findIndex((t) => t.id === t1.id) < r.j.tickets.findIndex((t) => t.id === std.id)); assert.equal(r.j.tickets[r.j.tickets.length - 1].id, 'eskitalep0000001'); ok('panel sırası: paket önceliği önde, süresiz eski talep sonda');
    r = await A('GET', '/api/admin/tickets?filtre=asildi'); assert.deepEqual(r.j.tickets.map((t) => t.id), [std.id]); r = await A('GET', '/api/admin/tickets?filtre=kapali'); assert.equal(r.j.tickets.length, 0); ok('aşım filtresi');
    r = await C('GET', '/api/admin/tickets'); assert.equal(r.status, 403); ok('müşteri yönetici talep listesine erişemez');
    await A('POST', `/api/tickets/${std.id}/reply`, { text: 'Geç yanıt' }); await bekle('destek.sla_asildi', 2); assert.equal(olaylar('destek.sla_asildi').length, 1); ok('geç yanıt ikinci olay üretmedi');

    // Paket uzatma, değiştirme, ödenmeyen sipariş
    r = await C('POST', '/api/orders', { support: { plan: 'orta', period: 'aylik' }, billing: fatura }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); assert.equal(r.j.order.items.length, 1); ok('yalnızca destek paketi satın alınabilir');
    const eskiBitis = new Date(te.support_until); await A('POST', `/api/admin/orders/${r.j.order.id}/approve`, {});
    [[te]] = await kok.query(`SELECT id, support_plan, support_until FROM \`${DBN}\`.tenants WHERE id=?`, [te.id]); assert.ok(new Date(te.support_until) - eskiBitis > 27 * 864e5); ok('aynı paket süre üstüne uzadı');
    r = await C('POST', '/api/orders', { items: [pos()], billing: fatura }); await A('POST', `/api/admin/orders/${r.j.order.id}/approve`, {}); [[te]] = await kok.query(`SELECT id, support_plan FROM \`${DBN}\`.tenants WHERE id=?`, [te.id]); assert.equal(te.support_plan, 'orta'); ok('destek seçilmeyen sipariş ücretli paketi düşürmedi');
    r = await D('POST', '/api/orders', { items: [pos()], support: { plan: 'ust', period: 'yillik' }, billing: fatura }); const iptal = r.j.order; await D('POST', `/api/orders/${iptal.id}/cancel`); r = await A('POST', `/api/admin/orders/${iptal.id}/approve`, {}); assert.equal(r.status, 400); r = await D('GET', '/api/tickets'); assert.equal(r.j.destek.id, 'standart'); ok('iptal edilen sipariş paket açmadı');
    r = await D('POST', '/api/orders', { items: [pos()], support: { plan: 'ust', period: 'yillik' }, billing: fatura }); await A('POST', `/api/admin/orders/${r.j.order.id}/approve`, {}); r = await D('GET', '/api/tickets'); assert.equal(r.j.destek.id, 'ust'); const g2 = (new Date(r.j.destek.bitis) - Date.now()) / 864e5; assert.ok(g2 > 360, String(g2)); ok('yıllık paket 12 ay yazıldı');
    await kok.query(`UPDATE \`${DBN}\`.tenants t JOIN \`${DBN}\`.users u ON u.tenant_id=t.id SET t.support_until=DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE u.email='ikinci@firma.test'`); r = await D('GET', '/api/tickets'); assert.equal(r.j.destek.id, 'standart'); ok('süresi dolan paket varsayılana döndü');
    const b = shopier.productBody({ no: 'NS1', total: '100.00', items: JSON.stringify([{ type: 'support', name: 'Orta destek paketi', period: 'aylik', price: 490 }]) }, 'https://x.test/a.png'); assert.ok(b.description.includes('Orta destek paketi')); assert.ok(!shopier.productBody({ no: 'NS1', total: '1', items: '[]' }, 'x').description.includes('destek')); ok('Shopier açıklamasında destek kalemi ayrı');

    // Kurumsal teklif
    const form = { kurum: 'Konya Esnaf Odası', tur: 'oda', yetkili: 'Ayşe Yılmaz', eposta: 'musteri@firma.test', telefon: '0332 111 22 33', program_listesi: ['pos', 'adisyon'], lisans: 40, sube: 12, not: 'TC 10000000146 kart 4111111111111111 tanı: diyabet', kvkk: true };
    r = await F('POST', '/api/kurumsal-teklif', form, { csrfYok: true }); assert.equal(r.status, 403); ok('CSRF başlıksız form reddedildi');
    for (const [o, n] of [[{ kvkk: false }, 'KVKK'], [{ tur: 'x' }, 'tür'], [{ eposta: 'a' }, 'e-posta'], [{ telefon: '1' }, 'telefon']]) { r = await F('POST', '/api/kurumsal-teklif', { ...form, ...o }); assert.equal(r.status, 400, n); }
    r = await L('POST', '/api/kurumsal-teklif', { ...form, lisans: -1 }); assert.equal(r.status, 400); r = await L('POST', '/api/kurumsal-teklif', { ...form, program_listesi: ['yok'] }); assert.equal(r.status, 400); ok('form kötü girdiyi reddetti');
    r = await L('POST', '/api/kurumsal-teklif', form); assert.equal(r.j.ok, true, JSON.stringify(r.j)); const qno = r.j.no;
    for (let i = 0; i < 2; i++) { r = await L('POST', '/api/kurumsal-teklif', { ...form, kurum: 'Bayi ' + i, ticariIzin: true }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); }
    r = await L('POST', '/api/kurumsal-teklif', form); assert.equal(r.status, 429); ok('form hız sınırı (saatte 5)');
    r = await C('GET', '/api/admin/quotes'); assert.equal(r.status, 403); r = await Q('GET', '/api/admin/quotes'); assert.equal(r.status, 401); ok('teklif listesi yöneticiye özel');
    r = await A('GET', '/api/admin/quotes'); const qt = r.j.quotes.find((x) => x.no === qno); assert.deepEqual([qt.durum, qt.ticari_izin, qt.ticari_izin_at], ['yeni', 0, null]); assert.ok(qt.kvkk_at); assert.equal(r.j.quotes.find((x) => x.kurum === 'Bayi 0').ticari_izin, 1); ok('ticari izin ayrı ve varsayılan kapalı');
    r = await A('POST', `/api/admin/quotes/${qt.id}/siparis`, { plan: 1, period: 'aylik' }); assert.equal(r.status, 400); ok('tutarsız teklif siparişe çevrilemedi');
    r = await A('POST', `/api/admin/quotes/${qt.id}`, { durum: 'teklif-verildi', teklif_tutari: 'abc' }); assert.equal(r.status, 400);
    r = await A('POST', `/api/admin/quotes/${qt.id}`, { durum: 'teklif-verildi', teklif_tutari: 10000.01, gecerlilik: '2000-01-01' }); assert.equal(r.j.ok, true); r = await A('POST', `/api/admin/quotes/${qt.id}/siparis`, { plan: 1, period: 'aylik' }); assert.equal(r.status, 400); ok('süresi dolan teklif reddedildi');
    await A('POST', `/api/admin/quotes/${qt.id}`, { durum: 'kabul', teklif_tutari: 10000.01, gecerlilik: '2099-01-01' });
    r = await A('POST', `/api/admin/quotes/${qt.id}/siparis`, { eposta: 'yok@firma.test', plan: 1, period: 'aylik' }); assert.equal(r.status, 400); ok('hesabı olmayan e-posta reddedildi');
    r = await A('POST', `/api/admin/quotes/${qt.id}/siparis`, { plan: 1, period: 'yillik' }); assert.equal(r.j.ok, true, JSON.stringify(r.j)); const so = r.j.order;
    r = await A('POST', `/api/admin/quotes/${qt.id}/siparis`, { plan: 1, period: 'yillik' }); assert.equal(r.status, 400); ok('teklif iki kez çevrilemez');
    r = await C('GET', '/api/orders'); const qo = r.j.orders.find((x) => x.id === so.id); assert.equal(qo.subtotal, 10000.01); assert.equal(qo.vat, 2000); assert.equal(qo.total, 12000.01); assert.equal(yuvarla(qo.items.reduce((s, l) => s + l.price, 0)), 10000.01); assert.equal(qo.status, 'odeme-bekliyor'); assert.equal(qo.indirim.kural, 'teklif'); ok('siparişe çevirme: tutar kuruşu kuruşuna, ödeme bekliyor');
    await A('POST', `/api/admin/orders/${so.id}/approve`, {}); r = await C('GET', '/api/auth/me'); assert.equal(r.j.licenses.find((l) => l.product === 'adisyon').branches, 40); assert.equal(r.j.licenses.find((l) => l.product === 'adisyon').status, 'aktif'); ok('ödenince teklif lisansları açıldı');

    // Olaylar ve gizli veri
    const sc = await bekle('destek.paket_secildi'); const ia = await bekle('indirim.uygulandi'); const tk = await bekle('teklif.olusturuldu', 3);
    assert.ok(sc.length >= 3 && ia.length >= 1 && tk.length === 3, `${sc.length}/${ia.length}/${tk.length}`);
    const e1 = JSON.parse(ia[0].slice(ia[0].indexOf('{'))); assert.deepEqual(Object.keys(e1).filter((k) => ['zaman', 'kanal', 'seviye', 'olay', 'veri'].includes(k)).length, 5); ok('olaylar ortak şemayla yazıldı');
    const hepsi = [...sc, ...ia, ...tk].join('\n');
    for (const g of ['Sifre1234', 'GucluSifre2026!', '4111111111111111', '10000000146', 'diyabet', 'Ayşe Yılmaz', 'Konya Esnaf', '0332 111 22 33', '1234567890']) assert.ok(!hepsi.includes(g), g);
    for (const g of ['Sifre1234', 'GucluSifre2026!', '4111111111111111', '10000000146', 'diyabet']) assert.ok(!cikti.includes(g), 'çıktıda: ' + g);
    ok('parola, kart, TC ve sağlık verisi hiçbir sunucu çıktısına yazılmadı');
    assert.ok(!/api\.hata/.test(cikti), 'beklenmeyen 500'); ok('test boyunca sunucu hatası yok');
    console.log(`\n${passed} test geçti`);
  } finally {
    srv.kill(); await kok.query(`DROP DATABASE IF EXISTS \`${DBN}\``).catch(() => {}); await kok.end(); fs.rmSync(DATA, { recursive: true, force: true });
  }
})().catch((e) => { console.error('\nHATA:', e); process.exit(1); });
