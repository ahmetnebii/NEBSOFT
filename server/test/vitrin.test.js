// Güven sayfaları: spam kapıları, boş ayarda oran ve düğme görünmemesi, sistem durumunun gerçek ölçüme dayanması, hassas bilgi sızmaması, veri taşıma tablosunun kodla uyumu. MySQL gerekmez.
const fs = require('fs'); const path = require('path'); const assert = require('assert'); const { execSync } = require('child_process');
process.env.NEBSOFT_SECRET = process.env.NEBSOFT_SECRET || 'a'.repeat(64);
const ROOT = path.join(__dirname, '..', '..'); const dbPath = require.resolve('../cloud/db');
const D = { hazir: true, bozuk: false, yavas: false, ayar: {}, gecikme: 0 };
const iste = async (sql, p = []) => {
  if (D.bozuk) throw Object.assign(new Error('connect ECONNREFUSED 10.9.8.7:3306 veritabani_gizli'), { code: 'ECONNREFUSED' });
  if (D.yavas) await new Promise(() => {});
  if (/FROM settings/.test(sql)) return D.ayar[p[0]] ? [{ v: JSON.stringify(D.ayar[p[0]]) }] : [];
  if (/FROM bakim_kayit/.test(sql)) return D.bakim || [];
  return [{ 1: 1 }];
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { ready: () => D.hazir, q: iste, one: async (s, p) => (await iste(s, p))[0] || null, tx: async (f) => f({ q: iste }), gocEkle: () => {}, info: () => ({}) } };
const V = require('../cloud/vitrin'); const { R, waNumara } = require('../cloud/routes'); const seo = require('../cloud/seo'); const analitik = require('../cloud/analitik');
const { AKTARIM } = require('../../site/tools/guven-sayfalari');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const hata = (f, re) => assert.throws(f, re);
const eski = Date.now() - 60e3;

(async () => {
  // Spam kapıları
  hata(() => V.spamDenetle({ web: 'x', acilis: eski }, 't1', ''), /gönderilemedi/); hata(() => V.spamDenetle({ acilis: Date.now() }, 't1', ''), /hızlı/); hata(() => V.spamDenetle({}, 't1', ''), /hızlı/); ok('Tuzak alan ve çok hızlı gönderim hata döner, başarı gibi görünmez');
  hata(() => V.spamDenetle({ acilis: eski }, 't1', 'http://a.co http://b.co www.c.co'), /bağlantı/); V.spamDenetle({ acilis: eski }, 't1', 'http://a.co www.b.co'); ok('İkiden çok bağlantılı metin reddedilir');
  for (let i = 0; i < 60; i++) V.spamDenetle({ acilis: eski }, 't2', ''); hata(() => V.spamDenetle({ acilis: eski }, 't2', ''), /çok fazla/); ok('Saatlik genel sınır IP değişse de çalışır');
  assert.strictEqual(V.oneriOzet('pos', '', 'Barkod  Tartı'), V.oneriOzet('pos', null, 'barkod tartı')); assert.notStrictEqual(V.oneriOzet('pos', '', 'a'), V.oneriOzet('crm', '', 'a')); ok('Aynı öneri büyük harf ve boşluk farkıyla tekrar edilemez');
  const yazma = ['/api/bayi-basvuru', '/api/veri-tasima', '/api/oneri'].map((u) => R.find((x) => x.method === 'POST' && x.re.test(u)));
  yazma.forEach((x) => { assert.ok(x.opt.limit && x.opt.limit[1] <= 5 && x.opt.limit[2] >= 3600e3, 'IP sınırı'); assert.notStrictEqual(x.opt.csrf, false); assert.ok(x.opt.bodyMax <= 20e3); }); ok('Yazma uçlarında IP sınırı, CSRF ve gövde sınırı var');
  ['/api/admin/bayiler', '/api/admin/oneriler', '/api/admin/bakim'].forEach((u) => { const L = R.filter((x) => x.re.test(u)); assert.ok(L.length); L.forEach((x) => assert.strictEqual(x.opt.auth, 'admin')); }); assert.strictEqual(R.find((x) => x.method === 'POST' && x.re.test('/api/admin/bayiler/1')).opt.auth, 'admin'); ok('Yönetim uçları yalnız yöneticiye açık');

  // Komisyon ve hizmet fiyatı
  assert.strictEqual(V.komisyon({ komisyon: { yuzde: null } }), null); assert.strictEqual(V.komisyon({}), null); assert.strictEqual(V.komisyon({ komisyon: { yuzde: 0 } }), null); assert.strictEqual(V.komisyon({ komisyon: { yuzde: '20' } }), null); assert.strictEqual(V.komisyon({ komisyon: { yuzde: 150 } }), null); assert.strictEqual(V.komisyon({ komisyon: { yuzde: 12.5, aciklama: 'İlk yıl' } }).yuzde, 12.5); ok('Oran boş veya geçersizse dışarı verilmez');
  assert.strictEqual(V.komisyon(), null, 'depodaki config/bayi.json oranı boş kalmalı: oran kullanıcının kararı'); assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, 'config/bayi.json'), 'utf8'))._ornek); ok('Depodaki ayarda oran boş, örnek okunmuyor');
  assert.strictEqual(V.kurulum({}), null); assert.strictEqual(V.kurulum(), null, 'destek-paketleri.json içinde kurulum fiyatı yok'); assert.deepStrictEqual(V.kurulum({ kurulumHizmeti: { ad: 'Kurulum', fiyat: 1000 } }), { ad: 'Kurulum', fiyat: 1000 }); ok('Kurulum fiyatı yalnız ayarda varsa verilir');
  const sayfalar = ['bayilik', 'veri-tasima', 'sistem-durumu', 'yenilikler', 'yol-haritasi'].map((p) => [p, fs.readFileSync(path.join(ROOT, 'site', p, 'index.html'), 'utf8')]);
  const bayi = sayfalar[0][1]; const metin = (h) => ((/<main[\s\S]*?<\/main>/.exec(h) || [''])[0]).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(!/%\s*\d|\d\s*%|yüzde \d/i.test(metin(bayi)), 'bayilik sayfasında sabit oran'); assert.ok(!/\d[\d.]*\s*(₺|TL)/.test(metin(bayi) + metin(sayfalar[1][1])), 'sabit fiyat'); assert.match(bayi, /data-komisyon hidden/); ok('Bayilik ve veri taşıma sayfasında sabit oran ve fiyat yok');

  // Sistem durumu
  D.gecikme = 0; V.durumTemizle(); let s = await V.durum(); assert.strictEqual(s.veritabani.durum, 'calisiyor'); assert.strictEqual(typeof s.veritabani.ms, 'number'); assert.strictEqual(s.genel, 'calisiyor'); assert.ok(new Date(s.olcum).getTime() > Date.now() - 5000); ok('Sağlam durumda sonuç ölçümden gelir');
  assert.strictEqual(s.istekler.durum, 'bilinmiyor'); ok('Yeterli istek yoksa istek durumu "bilinmiyor"');
  D.bozuk = true; assert.strictEqual((await V.durum()).veritabani.durum, 'calisiyor'); V.durumTemizle(); s = await V.durum(); assert.strictEqual(s.veritabani.durum, 'sorun'); assert.strictEqual(s.genel, 'sorun'); assert.strictEqual(s.bakim, null); assert.strictEqual(s.bakimda, null); ok('Veritabanı düşünce "sorun" döner; 15 saniyelik önbellek kısa süreli');
  const dis = JSON.stringify(s); assert.ok(!/10\.9\.8\.7|ECONNREFUSED|veritabani_gizli|version|host|database|memory|uptime|hostname/i.test(dis), dis); ok('Durum yanıtında adres, hata metni, sürüm yok');
  assert.deepStrictEqual(Object.keys(s).sort(), ['bakim', 'bakimda', 'genel', 'istekler', 'ok', 'olcum', 'uygulama', 'veritabani']); ok('Durum yanıtının alanları sabit liste');
  D.bozuk = false; D.yavas = true; const t0 = Date.now(); assert.strictEqual((await V.vtOlc()).durum, 'sorun'); assert.ok(Date.now() - t0 < 4000); D.yavas = false; ok('Yanıt vermeyen veritabanı 3 saniyede sonuçlanır, sayfa asılı kalmaz');
  D.hazir = false; assert.strictEqual((await V.vtOlc()).durum, 'bilinmiyor'); assert.strictEqual(V.genelDurum({ durum: 'calisiyor' }, { durum: 'bilinmiyor' }, { durum: 'bilinmiyor' }), 'bilinmiyor'); D.hazir = true; ok('Veritabanı yapılandırılmamışsa "bilinmiyor", "çalışıyor" değil');
  const a = analitik.VARSAYILAN; assert.deepStrictEqual(analitik.alarmHesapla({ n: 100, h5: 50, yavas: 0 }, a).map((x) => x.tur), ['hata']); assert.strictEqual(V.genelDurum({ durum: 'calisiyor' }, { durum: 'calisiyor' }, { durum: 'sorun' }), 'sorun'); assert.strictEqual(V.genelDurum({ durum: 'calisiyor' }, { durum: 'calisiyor' }, { durum: 'yavas' }), 'yavas'); assert.strictEqual(V.genelDurum({ durum: 'calisiyor' }, { durum: 'calisiyor' }, { durum: 'bilinmiyor' }), 'calisiyor'); ok('Genel sonuç bileşenlerden hesaplanır');
  const dSayfa = sayfalar[2][1]; assert.ok(!/her şey yolunda|tüm sistemler|kesintisiz çalış[ıi]yor|%\s*99/i.test(metin(dSayfa)), 'sabit iyi haber'); assert.match(dSayfa, /<noscript>[\s\S]*Durum bilinmiyor/); assert.match(fs.readFileSync(path.join(ROOT, 'site/assets/guven.js'), 'utf8'), /\.catch\(bilinmiyor\)/); ok('Durum sayfasında sabit iyi haber yok, ölçüm hatası "Bilinmiyor" yazar');
  D.bakim = [{ tur: 'planli', baslik: 'x', aciklama: null, bas: new Date(), bit: null, yazan: 'gizli' }]; hata(() => V.bakimOku({ tur: 'yok', baslik: 'abc', bas: '2026-01-01' }), /türünü/); hata(() => V.bakimOku({ tur: 'olay', baslik: 'abc', bas: '2999-01-01' }), /planlı/); hata(() => V.bakimOku({ tur: 'planli', baslik: 'abc', bas: '2026-02-02', bit: '2026-02-01' }), /Bitiş/); assert.strictEqual(V.bakimOku({ tur: 'planli', baslik: 'abcd', bas: '2999-01-01', yayinda: true }).yayinda, 1); ok('Bakım kaydı denetlenir, olay kaydı gelecek tarihli olamaz');

  // WhatsApp
  const sayfa = '<html><head></head><body><main>x</main></body></html>'; const ayar = (w) => { D.ayar.site = { whatsapp: w }; }; const sifirla = () => { delete require.cache[require.resolve('../cloud/seo')]; return require('../cloud/seo'); };
  ayar(''); let t = await sifirla().rewrite(sayfa, { headers: {}, socket: {} }); assert.ok(!/ns-wa|wa\.me/.test(t)); ok('Numara boşsa WhatsApp düğmesi hiç basılmaz');
  ayar('905551112233'); t = await sifirla().rewrite(sayfa, { headers: {}, socket: {} }); assert.match(t, /href="https:\/\/wa\.me\/905551112233"/); assert.match(t, /WhatsApp ile yazın/); assert.ok(t.indexOf('ns-wa') < t.indexOf('</body>')); ok('Numara varsa düğme erişilebilir adla basılır');
  ayar('"><script>'); t = await sifirla().rewrite(sayfa, { headers: {}, socket: {} }); assert.ok(!/wa\.me|<script>/.test(t)); ok('Bozuk ayar değeri sayfaya yazılmaz');
  assert.strictEqual(waNumara(''), ''); assert.strictEqual(waNumara('0555 111 22 33'), '905551112233'); assert.strictEqual(waNumara('+90 555 111 22 33'), '905551112233'); assert.strictEqual(waNumara('5551112233'), '905551112233'); hata(() => waNumara('123'), /geçersiz/); ok('Numara biçimi kayıtta düzeltilir, yanlışsa kaydedilmez');
  assert.ok(!/whatsapp|wa\.me/i.test(JSON.stringify(require('../../site/src/site.config'))), 'numara üretilmiş sayfalara gömülmez'); ok('Üretilen sayfalarda sabit WhatsApp numarası yok');

  // Veri taşıma tablosu kodla uyumlu
  for (const [id] of AKTARIM) { const k = fs.readFileSync(path.join(ROOT, 'apps', id, 'app.js'), 'utf8'); assert.ok(/NS\.readSheet\(|NS\.parseCsv\(|MUHAKTAR\.open/.test(k), id + ' içe aktarma yok'); }
  const hepsi = fs.readdirSync(path.join(ROOT, 'apps')).filter((d) => fs.existsSync(path.join(ROOT, 'apps', d, 'app.js')) && /NS\.readSheet\(|NS\.parseCsv\(/.test(fs.readFileSync(path.join(ROOT, 'apps', d, 'app.js'), 'utf8'))); hepsi.filter((d) => d !== 'eczane').forEach((d) => assert.ok(AKTARIM.some(([id]) => id === d), d + ' tabloda yok')); ok('Tablodaki her programda gerçek içe aktarma var, satıştaki hiçbiri eksik değil');
  assert.match(fs.readFileSync(path.join(ROOT, 'core/core.js'), 'utf8'), /NS\.readSheet = \(accept = '\.xlsx,\.csv,\.txt'\)/); assert.match(sayfalar[1][1], /\.xls biçimi okunmaz/); assert.match(fs.readFileSync(path.join(ROOT, 'apps/pos/app.js'), 'utf8'), /CSV sütunları: Barkod;Ürün;Kategori;Alış;Satış;KDV;Stok;Birim/); ok('Dosya biçimi ve Market POS sütunları sayfadakiyle aynı');

  // Yenilikler ve yol haritası
  const Y = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/src/yenilikler.json'), 'utf8')).kayitlar; assert.ok(Y.length); Y.forEach((x) => { assert.match(x.tarih, /^\d{4}-\d{2}-\d{2}$/); assert.match(x.commit, /^[0-9a-f]{7,}$/); assert.ok(x.baslik.length > 5 && x.metin.length > 10); });
  if (fs.existsSync(path.join(ROOT, '.git'))) { Y.forEach((x) => { const t2 = execSync(`git log -1 --format=%ad --date=short ${x.commit}`, { cwd: ROOT, encoding: 'utf8' }).trim(); assert.strictEqual(t2, x.tarih, x.commit); }); ok('Her yenilik depodaki bir commit\'e ve onun tarihine dayanıyor'); }
  JSON.parse(fs.readFileSync(path.join(ROOT, 'site/src/yol-haritasi.json'), 'utf8')).maddeler.forEach((x) => { assert.ok(['calisiliyor', 'planlandi', 'bekliyor'].includes(x.durum)); assert.ok(x.kaynak); assert.ok(!/\b20\d\d\b|çeyrek|ay içinde|yakında/i.test(x.baslik + x.metin), 'yol haritasında tarih vaadi'); }); ok('Yol haritasında kaynak var, tarih vaadi yok');

  // Sayfa kuralları
  const baslik = new Set(); for (const [p, h] of sayfalar) { const t3 = /<title>([^<]+)/.exec(h)[1]; assert.ok(t3.length <= 70, p + ' başlık'); assert.ok(/<meta name="description" content="([^"]+)"/.exec(h)[1].length <= 165, p + ' açıklama'); assert.strictEqual((h.match(/<h1[ >]/g) || []).length, 1, p + ' h1'); assert.match(h, new RegExp(`rel="canonical" href="[^"]*/${p}/"`)); assert.ok(!/name="robots"/.test(h), p + ' noindex'); assert.ok(!baslik.has(t3)); baslik.add(t3); }
  const xml = fs.readFileSync(path.join(ROOT, 'site/sitemap.xml'), 'utf8'); sayfalar.forEach(([p]) => assert.ok(xml.includes(`/${p}/</loc>`), p + ' sitemap')); const sv = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8'); sayfalar.forEach(([p]) => assert.ok(new RegExp(`SLASHED = new Set\\([^)]*'${p}'`).test(sv), p + ' SLASHED')); ok('Eşsiz başlık, açıklama, tek H1, canonical, sitemap ve SLASHED');
  ['bayilik', 'veri-tasima', 'yol-haritasi'].forEach((p) => { const h = sayfalar.find((x) => x[0] === p)[1]; assert.match(h, /href="\/kvkk\/"[^>]*>KVKK aydınlatma metnini/); assert.match(h, /name="kvkk" required/); assert.match(h, /name="web"/); }); ok('Formlarda KVKK bağlantısı, zorunlu onay ve tuzak alan var');
  console.log(`\n${n} test geçti`); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
