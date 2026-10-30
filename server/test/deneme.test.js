// Deneme e-posta dizisi: sıralama, izin, çıkış, sahte başarı yok. Veritabanı ve SMTP bellekte taklit edilir (MySQL gerekmez).
const assert = require('assert');
process.env.NEBSOFT_SECRET = process.env.NEBSOFT_SECRET || 'a'.repeat(64);
const dbPath = require.resolve('../cloud/db'); const mailPath = require.resolve('../cloud/mail');
const G = 864e5; const ST = { rows: [], prefs: {}, settings: {}, audit: [] };
const start = new Date(Date.UTC(2026, 9, 1, 7, 0));
const lic = (o = {}) => ({ id: 'L1', tenant_id: 'T1', product: 'pos', start, end: new Date(start.getTime() + 7 * G), biz: 'Deneme Market', tphone: '05321112233', uid: 'U1', email: 'a@b.tr', uname: 'Ayşe Kaya', uphone: '0532 111 22 33', trial_off: 0, marketing: 0, ...o });
const LIC = [lic()]; const SENT = []; let FAIL = false; let READY = true; let DATA = null;
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  ready: () => true,
  one: async (sql, p) => { if (/FROM settings/.test(sql)) return ST.settings[p ? p[0] : ''] ? { v: JSON.stringify(ST.settings[p[0]]) } : null; if (/FROM app_data/.test(sql)) return DATA ? { data: JSON.stringify(DATA) } : null; if (/FROM mail_prefs/.test(sql)) return ST.prefs[p[0]] || null; return null; },
  q: async (sql, p = []) => {
    if (/FROM licenses l JOIN tenants/.test(sql)) return LIC.filter((l) => l.end > new Date(Date.UTC(2026, 9, 1)));
    if (/SELECT license_id/.test(sql)) return ST.rows.filter((r) => p.includes(r.license_id));
    if (/SELECT to_addr/.test(sql)) return [];
    if (/INSERT INTO trial_mail/.test(sql)) { const ex = ST.rows.find((r) => r.license_id === p[0] && r.step === p[1]); if (ex) { ex.status = 'gönderiliyor'; ex.attempts++; } else ST.rows.push({ license_id: p[0], step: p[1], to_addr: p[2], status: 'gönderiliyor', attempts: 1, at: p[3] }); return {}; }
    if (/UPDATE trial_mail/.test(sql)) { const r = ST.rows.find((x) => x.license_id === p[2] && x.step === p[3]); r.status = p[0]; r.detail = p[1]; return {}; }
    if (/INSERT INTO mail_prefs/.test(sql)) { ST.prefs[p[0]] = { trial_off: /trial_off, marketing, updated/.test(sql) ? 1 : p[1], marketing: 0 }; return {}; }
    if (/INSERT INTO settings/.test(sql)) { ST.settings[p[0]] = JSON.parse(p[1]); return {}; }
    if (/INSERT INTO audit/.test(sql)) { ST.audit.push(p); return {}; }
    return [];
  } } };
const realMail = require('../cloud/mail');
require.cache[mailPath].exports = { ...realMail, ready: async () => READY, send: async (to, subject, tpl) => { if (FAIL) return { ok: false, error: 'SMTP kapalı' }; SENT.push({ to, subject, tpl }); return { ok: true, id: 'x' }; }, settings: async () => ({}) };
ST.settings.site = { siteUrl: 'https://nebsoft.test' };
const D = require('../cloud/deneme'); const { R } = require('../cloud/routes');
const at = (gun, saat = 12) => new Date(start.getTime() + gun * G + (saat - 10) * 36e5); // 10.00 TSİ başlangıç
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const adim = (gun, rows = [], ek = {}) => D.sonraki({ start, end: LIC[0].end, now: at(gun), rows, ...ek });
const yap = (...s) => s.map((step) => ({ step, status: 'gönderildi', attempts: 1 }));

(async () => {
  assert.strictEqual(adim(0), null); assert.strictEqual(adim(1), 'g1'); assert.strictEqual(adim(3, yap('g1')), 'g3'); assert.strictEqual(adim(6, yap('g1', 'g3')), 'g6'); ok('1., 3. ve 6. gün sırayla');
  assert.strictEqual(D.sonraki({ start, end: LIC[0].end, now: new Date(LIC[0].end.getTime() - 6 * 36e5), rows: yap('g1', 'g3', 'g6') }), 'son'); ok('Süre bitmeden hatırlatma');
  assert.strictEqual(adim(3), 'g3'); assert.strictEqual(adim(3, yap('g3')), null); ok('Kaçırılan eski adım sonradan gönderilmez, aynı adım iki kez gitmez');
  assert.strictEqual(adim(8), null); ok('Süre dolunca gönderim yok');
  assert.strictEqual(adim(3, [], { trialOff: true }), null); ok('Çıkış yapana gönderilmez');
  assert.strictEqual(adim(3, [{ step: 'g3', status: 'hata', attempts: 1 }]), 'g3'); assert.strictEqual(adim(3, [{ step: 'g3', status: 'hata', attempts: 3 }]), null); ok('Hatada en çok 3 deneme');
  assert.strictEqual(adim(3, [], { lastAt: at(3).getTime() - 36e5 }), null); ok('Aynı kişiye sık e-posta gitmez');
  for (let h = 0; h < 24; h++) { const open = Array.from({ length: 24 }, (_, i) => D.uygunSaat(new Date(Date.UTC(2026, 0, 1, (h + i) % 24)))).filter(Boolean).length; assert.ok(open === 13); } assert.ok(!D.uygunSaat(new Date(Date.UTC(2026, 0, 1, 20)))); ok('Gönderim yalnızca TSİ 08–21');

  const p = { steps: [{ t: 'Ürün', d: 'x', ok: false }], done: 0, total: 1, sample: true };
  const ctx = { pname: 'Market POS', ad: 'Ayşe', biz: 'B', end: LIC[0].end, now: at(6), ilerleme: p, siteUrl: 'https://x.tr', pid: 'pos' };
  for (const s of D.ADIMLAR) { const t = D.sablon(s, ctx); const j = JSON.stringify(t); assert.ok(!/Tanıtım|ücretsiz|indirim|kampanya/i.test(j), s + ' tanıtım içeriyor'); assert.ok(t.subject.length > 5); }
  ok('İzin yokken dizide tanıtım içeriği yok');
  assert.match(JSON.stringify(D.sablon('son', { ...ctx, promo: true, unvan: 'NEB AŞ', mersis: '1' })), /Tanıtım: yıllık/); ok('Tanıtım satırı yalnız izinle eklenir');
  assert.ok(!D.pazarlamaHazir({ iys: true })); assert.ok(D.pazarlamaHazir({ iys: true, unvan: 'x', mersis: '1' })); ok('Tanıtım için İYS, unvan ve MERSİS birlikte gerekir');

  // Gönderim: başarısızsa "gönderildi" kaydı yok
  const now = at(1); FAIL = true; let r = await D.tick(now); assert.deepStrictEqual([r.sent, r.failed], [0, 1]); assert.strictEqual(ST.rows[0].status, 'hata'); assert.match(ST.rows[0].detail, /SMTP/); ok('Gönderilemeyen e-posta "hata" kalır');
  FAIL = false; r = await D.tick(now); assert.strictEqual(r.sent, 1); assert.strictEqual(ST.rows[0].status, 'gönderildi'); assert.strictEqual(ST.rows[0].attempts, 2); assert.strictEqual(SENT[0].to, 'a@b.tr');
  assert.match(SENT[0].tpl.unsub, /^https:\/\/nebsoft\.test\/api\/abonelik\/cik\?u=U1&k=/); ok('Yeniden denemede gönderildi; çıkış bağlantısı var');
  r = await D.tick(now); assert.strictEqual(r.sent, 0); ok('Aynı e-posta tekrar gitmez');
  READY = false; r = await D.tick(at(3)); assert.ok(!r.ok); assert.strictEqual(ST.rows.length, 1); READY = true; ok('E-posta ayarı yoksa kayıt açılmaz');
  const su = ST.settings.site; ST.settings.site = {}; r = await D.tick(at(3)); assert.ok(!r.ok); ST.settings.site = su; ok('Site adresi yoksa çıkış bağlantısız e-posta gitmez');
  r = await D.tick(new Date(Date.UTC(2026, 9, 4, 22))); assert.strictEqual(r.sent, 0); ok('Sessiz saatte gönderim yok');

  // Çıkış
  const find = (m, u) => R.find((x) => x.method === m && x.re.test(u)); const url = D.cikisUrl('U1', 'https://x.tr'); const k = new URL(url).searchParams.get('k');
  await assert.rejects(find('POST', '/api/abonelik/cik').fn({ body: { u: 'U1', k: 'yanlis' }, ip: '1', req: {} }), /geçersiz/i);
  const page = await find('GET', '/api/abonelik/cik').fn({ query: new URL(url).searchParams }); assert.ok(page.__raw && /E-postaları durdur/.test(page.body)); ok('Çıkış sayfası imza ister, açılınca işlem yapmaz (e-posta tarayıcıları tetikleyemez)');
  assert.deepStrictEqual(await find('POST', '/api/abonelik/cik').fn({ body: { u: 'U1', k }, ip: '1', req: {} }), { ok: true }); assert.strictEqual(ST.prefs.U1.trial_off, 1); ok('Tek tıkla çıkış kaydedilir');

  assert.strictEqual(D.waNo('0532 111 22 33'), '905321112233'); assert.strictEqual(D.waNo('+90 532 111 22 33'), '905321112233'); assert.strictEqual(D.waNo('5321112233'), '905321112233'); assert.strictEqual(D.waNo('0212 111 22 33'), null);
  assert.match(D.waLink('05321112233', 'Merhaba Ayşe'), /^https:\/\/wa\.me\/905321112233\?text=Merhaba%20Ay/); assert.strictEqual(D.waLink('', 'x'), null); ok('WhatsApp yalnızca wa.me bağlantısı; cep numarası değilse yok');
  const ad = await find('GET', '/api/admin/deneme-takip').fn({}); assert.strictEqual(ad.rows[0].mails[0].status, 'gönderildi'); assert.ok(ad.rows[0].wa.includes('wa.me')); assert.ok(!('whatsappSent' in ad.rows[0])); ok('Yönetici gerçek e-posta durumunu ve WhatsApp taslağını görür');
  console.log(`\n${n} test geçti`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
