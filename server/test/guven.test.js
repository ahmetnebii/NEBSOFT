// Güven kanıtı: yalnızca izinli gerçek kayıt, eşik üstü sayaç, Review şeması yok, kanıtsız iddia yok. MySQL gerekmez.
const fs = require('fs'); const path = require('path'); const assert = require('assert');
process.env.NEBSOFT_SECRET = process.env.NEBSOFT_SECRET || 'a'.repeat(64);
const ROOT = path.join(__dirname, '..', '..'); const dbPath = require.resolve('../cloud/db');
const REV = []; const CAS = []; let COUNT = 0; const SET = {}; let SQL = '';
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  ready: () => true,
  one: async (sql, p) => { if (/FROM settings/.test(sql)) return SET[p[0]] ? { v: JSON.stringify(SET[p[0]]) } : null; if (/COUNT\(DISTINCT/.test(sql)) { SQL = sql; return { n: COUNT }; } return null; },
  q: async (sql, p = []) => { if (/FROM reviews WHERE published=1/.test(sql)) return REV.filter((r) => r.published && r.consent); if (/FROM case_studies WHERE published=1/.test(sql)) return CAS.filter((r) => r.published && r.consent); if (/INSERT INTO settings/.test(sql)) { SET[p[0]] = JSON.parse(p[1]); return {}; } return []; },
} };
const G = require('../cloud/guven'); const { R } = require('../cloud/routes');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const yorum = { author: 'Ali Veli', text: 'Kasa işlemlerimizi bu programla yürütüyoruz.', consent: true, consent_at: '2026-01-05', review_at: '2026-01-04', published: true };
const vaka = { biz: 'Örnek Ltd', title: 'Gelmeyen randevu takibi', problem: 'Randevular defterdeydi ve izlenemiyordu.', solution: 'Randevu programına geçildi ve hatırlatma açıldı.', result: 'Gelmeyen randevu ayda 40’tan 28’e indi', period: 'Mart–Mayıs 2026', consent: true, consent_at: '2026-06-01', case_at: '2026-06-01', published: true };

(async () => {
  assert.throws(() => G.yorum({ ...yorum, consent: false }), /izni/i); assert.throws(() => G.yorum({ ...yorum, consent: 'true' }), /izni/i); ok('İzin kutusu işaretsiz yorum reddedilir');
  assert.throws(() => G.yorum({ ...yorum, consent_at: '' }), /İzin tarihi/); assert.throws(() => G.yorum({ ...yorum, review_at: '2026-13-40' }), /Yorum tarihi/); assert.throws(() => G.yorum({ ...yorum, review_at: '2999-01-01' }), /gelecek/); ok('İzin ve yorum tarihi zorunlu, gelecek tarih olamaz');
  assert.ok(G.yorum(yorum).consent === 1); assert.throws(() => G.yorum({ ...yorum, product: 'yok' }), /Geçersiz program/); ok('Geçerli yorum kabul edilir; program denetlenir');
  assert.throws(() => G.vaka({ ...vaka, result: 'Çok memnun kaldık' }), /ölçülebilir/); assert.throws(() => G.vaka({ ...vaka, period: '' }), /dönem/); assert.throws(() => G.vaka({ ...vaka, consent: false }), /izni/i); assert.ok(G.vaka(vaka)); ok('Vaka: izin, rakamlı sonuç ve ölçüm dönemi zorunlu');

  const api = R.find((x) => x.method === 'GET' && x.re.test('/api/guven')); const q = (s = '') => api.fn({ query: new URLSearchParams(s) });
  let r = await q(); assert.deepStrictEqual([r.reviews.length, r.cases.length, r.count, r.html], [0, 0, null, '']); ok('Kayıt yoksa bölüm hiç üretilmez');
  COUNT = 50; G.temizle(); r = await q(); assert.strictEqual(r.count, null); assert.strictEqual(r.html, ''); ok('Sayaç eşikte gizli (varsayılan 50)');
  assert.match(SQL, /status='aktif'/); assert.match(SQL, /order_id IS NOT NULL/); assert.match(SQL, /end>UTC_TIMESTAMP/); ok('Sayaç yalnız ödenmiş ve süresi geçmemiş lisansı sayar');
  COUNT = 51; G.temizle(); r = await q(); assert.strictEqual(r.count, 51); assert.match(r.html, /<b>51<\/b> işletme/); ok('Eşik üstünde gerçek sayı görünür');
  COUNT = 3; SET.guven = { esik: 2 }; G.temizle(); r = await q('p=pos'); assert.strictEqual(r.count, 3); assert.match(r.html, /Market POS/); assert.match(SQL, /l\.product=\?/); ok('Eşik yönetimden değişir, sayaç programa göre hesaplanır');
  COUNT = 0; REV.push({ id: '1', ...yorum, text: '<script>alert(1)</script> iyi program', proof: 'GIZLI-BELGE', published: 0, consent: 1 }); G.temizle(); assert.strictEqual((await q()).reviews.length, 0); ok('Yayınlanmamış yorum görünmez');
  REV[0].published = 1; REV[0].consent = 0; G.temizle(); assert.strictEqual((await q()).reviews.length, 0); REV[0].consent = 1; G.temizle(); r = await q();
  assert.strictEqual(r.reviews.length, 1); assert.ok(!r.html.includes('<script>')); assert.match(r.html, /04\.01\.2026/); ok('İzinsiz görünmez; metin kaçışlı, tarihli');
  assert.ok(!/AggregateRating|"@type":\s*"Review"|ld\+json|itemprop/.test(r.html)); ok('Yorum HTML\'inde şema yok');
  REV.length = 0; CAS.push({ ...vaka, proof: 'x' }); G.temizle(); r = await q(); assert.match(r.html, /Ölçüm dönemi: Mart–Mayıs 2026/); assert.match(r.html, /her işletmede aynı olmayabilir/); ok('Vaka ölçüm dönemi ve genelleme uyarısıyla görünür');

  const page = '<html><main>x</main><footer class="ft"></footer></html>'; let t = await G.inject(page, '/site/marketprogrami/index.html'); assert.ok(t.indexOf('id="guven"') > 0 && t.indexOf('id="guven"') < t.indexOf('<footer')); ok('Tanıtım sayfasına alt bilgiden önce eklenir');
  CAS.length = 0; G.temizle(); t = await G.inject(page, '/site/marketprogrami/index.html'); assert.strictEqual(t, page); assert.strictEqual(await G.inject(page, '/index.html'), page); ok('Kayıt yoksa tanıtım sayfası değişmez');

  const adminRoutes = R.filter((x) => x.re.test('/api/admin/guven') || x.re.test('/api/admin/guven/ayar') || x.re.test('/api/admin/guven/yorum') || x.re.test('/api/admin/guven/vaka') || x.re.test('/api/admin/guven/yorum/1') || x.re.test('/api/admin/guven/vaka/1')); assert.ok(adminRoutes.length >= 5 && adminRoutes.every((x) => x.opt.auth === 'admin')); ok('Yazma uçları yalnız yönetici');

  // Depo geneli: kaynaklarda doğrulanmamış şema, sahte puan veya kaldırılan iddia kalmadı
  const tara = (d, out = []) => { for (const f of fs.readdirSync(path.join(ROOT, d))) { const p = path.join(d, f); if (fs.statSync(path.join(ROOT, p)).isDirectory()) { if (!/^(node_modules|vendor)$/.test(f)) tara(p, out); } else if (/\.(js|html)$/.test(f) && !/\.test\.js$/.test(f)) out.push(p); } return out; };
  const K = ['index.html', ...tara('market'), ...tara('site'), ...tara('server/cloud')].filter((f) => !/guven\.js$/.test(f)); const metin = K.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
  metin.forEach(([f, s]) => assert.ok(!/AggregateRating|aggregateRating|"@type":\s*"Review"|@type':\s*'Review'/.test(s), f + ' şema içeriyor')); ok('Site kaynaklarında Review/AggregateRating yok');
  const cat = fs.readFileSync(path.join(ROOT, 'market/catalog.js'), 'utf8'); assert.ok(!/\brating:|\breviews:|\busers: \d|testimonials/.test(cat)); ok('Katalogda elle yazılmış puan, kullanıcı sayısı ve yorum yok');
  const Y = /belirgin şekilde düşer|sıfır overbooking|Veri kaybı yok|hiçbir sipariş unutulmaz|En çok tercih edilen|256-bit SSL|Türkiye.de barındırılır/;
  metin.forEach(([f, s]) => assert.ok(!Y.test(s), f + ' kaldırılan iddiayı içeriyor')); ok('Kaldırılan kanıtsız iddialar sitede yok');
  console.log(`\n${n} test geçti`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
