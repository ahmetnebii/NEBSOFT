// Statik SEO sayfaları: üretici çıktısı, Markdown dönüştürücü, sitemap kapsaması, sunucu adresleri ve doğrulama kodu.
// Çalıştırma: node server/test/seo-sayfalar.test.js (veritabanı gerekmez)
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const http = require('http'); const zlib = require('zlib');
const { spawn, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'); const SITE = path.join(ROOT, 'site');
const { md, onBilgi, esc } = require('../../site/tools/markdown');
const PRODUCTS = require('../../site/src/products');
const D = 'https://www.nebsoftapp.com';
let n = 0; const ok = (ad, fn) => { fn(); n++; console.log('  ✓ ' + ad); };

// Bir klasördeki tüm üretilmiş sayfaları { yol: html } olarak döndürür
function sayfalar(site) {
  const S = {}; const oku = (rel) => { const f = path.join(site, rel, 'index.html'); if (fs.existsSync(f)) S[rel] = fs.readFileSync(f, 'utf8'); };
  for (const d of fs.readdirSync(site)) { if (['src', 'tools', 'assets'].includes(d) || !fs.statSync(path.join(site, d)).isDirectory()) continue; oku(d); }
  for (const k of ['rehber', 'paketler']) { const r = path.join(site, k); if (fs.existsSync(r)) for (const d of fs.readdirSync(r)) if (fs.statSync(path.join(r, d)).isDirectory()) oku(path.join(k, d).replace(/\\/g, '/')); }
  return S;
}
const SLASH = /^(fiyatlar|kvkk|gizlilik|mesafeli-satis|iade|cerez|kayit|rehber|paketler)(\/|$)/;
const adres = (rel) => `${D}/${rel}${SLASH.test(rel) ? '/' : ''}`;
const sema = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const turler = (h) => sema(h).map((x) => x['@type']);
const noindex = (h) => /<meta name="robots" content="noindex/.test(h);
const haritaAdresleri = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

function denetle(S, xml) {
  const baslik = new Map(); const aciklama = new Map(); const L = haritaAdresleri(xml);
  for (const [rel, h] of Object.entries(S)) {
    const t = (/<title>([^<]+)<\/title>/.exec(h) || [])[1]; const dsc = (/<meta name="description" content="([^"]+)"/.exec(h) || [])[1];
    assert(t, rel + ' title yok'); assert(dsc, rel + ' açıklama yok'); assert(!baslik.has(t), `${rel} başlığı ${baslik.get(t)} ile aynı`); assert(!aciklama.has(dsc), `${rel} açıklaması ${aciklama.get(dsc)} ile aynı`); baslik.set(t, rel); aciklama.set(dsc, rel);
    assert.strictEqual((/<link rel="canonical" href="([^"]+)"/.exec(h) || [])[1], adres(rel), rel + ' canonical');
    for (const k of ['og:title', 'og:description', 'og:url', 'og:image']) assert(h.includes(`property="${k}"`), `${rel} ${k}`);
    for (const k of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) assert(h.includes(`name="${k}"`), `${rel} ${k}`);
    assert.strictEqual((h.match(/<h1[ >]/g) || []).length, 1, rel + ' tek h1');
    const T = turler(h); assert(T.includes('Organization') && T.includes('WebSite') && T.includes('BreadcrumbList'), `${rel} şema: ${T}`);
    for (const s of sema(h)) { if (s['@type'] === 'FAQPage') assert(s.mainEntity.length > 0, rel + ' boş FAQPage'); }
    assert(!/#\/(yasal|fiyatlar"|urunler")/.test(h.replace(/href="\/#\/fiyatlar">Paketi/, '')), rel + ' eski #/ bağlantısı');
    assert(!h.includes('<!--robots-->'), rel + ' robots yer tutucusu kaldı');
    if (noindex(h)) assert(!L.includes(adres(rel)), rel + ' noindex ama sitemap içinde'); else assert(L.includes(adres(rel)), rel + ' sitemap dışında');
  }
  for (const u of L) if (u !== D + '/' && !u.includes('/araclar/') && !u.endsWith('/kurumsal-teklif')) assert(Object.keys(S).some((r) => adres(r) === u), 'sitemap adresi sayfasız: ' + u);
  assert([...xml.matchAll(/<url><loc>[^<]+<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/url>/g)].length === L.length, 'her adreste lastmod');
  assert.strictEqual(new Set(L).size, L.length, 'sitemap tekrarı');
}

console.log('Markdown dönüştürücü');
ok('başlık, liste, tablo, paragraf', () => {
  const h = md('# Bir\n\n## İki başlık\n\nMetin **kalın** ve *eğik*\ndevamı.\n\n- a\n- b\n\n1. x\n2. y\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n> not\n');
  assert(h.includes('<h2 id="bir">Bir</h2>')); assert(h.includes('<h2 id="iki-baslik">')); assert(h.includes('<p>Metin <strong>kalın</strong> ve <em>eğik</em> devamı.</p>'));
  assert(h.includes('<ul><li>a</li><li>b</li></ul>')); assert(h.includes('<ol><li>x</li><li>y</li></ol>')); assert(h.includes('<th>A</th>') && h.includes('<td>2</td>')); assert(h.includes('<blockquote><p>not</p></blockquote>'));
});
ok('zararlı içerik kaçırılır', () => {
  const h = md('<script>alert(1)</script>\n\n[tık](javascript:alert(1)) [iyi](/kvkk/) [dış](https://ornek.com)\n\n`<b>`');
  assert(!h.includes('<script')); assert(!h.includes('javascript:')); assert(h.includes('<a href="/kvkk/">iyi</a>')); assert(h.includes('rel="noopener"')); assert(h.includes('<code>&lt;b&gt;</code>'));
  assert.strictEqual(esc('"<'), '&quot;&lt;');
});
ok('bilgi bloğu ve S/C satırları', () => {
  const r = onBilgi('---\r\ntitle: "Başlık: alt"\r\ndescription: Açıklama\r\nprogram: pos\r\nkeywords: a, b\r\nupdated: 2026-10-01\r\nfaq:\r\n  S: Soru bir?\r\n  C: Cevap bir.\r\nS: Soru iki?\r\nC: Cevap iki.\r\n---\r\n\r\n## Gövde\r\n');
  assert.strictEqual(r.meta.title, 'Başlık: alt'); assert.strictEqual(r.meta.program, 'pos'); assert.strictEqual(r.faq.length, 2); assert.strictEqual(r.faq[1].c, 'Cevap iki.'); assert(r.govde.includes('## Gövde'));
  assert.deepStrictEqual(onBilgi('düz metin').faq, []);
});

console.log('Depodaki üretilmiş sayfalar');
const S = sayfalar(SITE); const XML = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
ok(`${Object.keys(S).length} sayfada başlık, canonical, JSON-LD, sosyal etiket, sitemap kapsaması`, () => denetle(S, XML));
ok('beklenen adreslerin hepsi var', () => { for (const r of ['fiyatlar', 'kvkk', 'gizlilik', 'mesafeli-satis', 'iade', 'cerez', 'kayit', 'rehber', 'programlar', 'paketler', 'paketler/oto-sanayi']) assert(S[r], r); });
ok('program sayfaları: SoftwareApplication, Offer, FAQPage, anahtar kelime grupları', () => {
  for (const p of PRODUCTS) {
    const h = S[p.slug]; const T = turler(h); assert(T.includes('SoftwareApplication') && T.includes('FAQPage'), p.slug + ' ' + T);
    const app = sema(h).find((x) => x['@type'] === 'SoftwareApplication'); assert(app.offers.lowPrice > 0 && app.offers.priceCurrency === 'TRY', p.slug);
    const k = p.keywords; assert(k.birincil && k.ikincil.length >= 3 && k.uzunKuyruk.length >= 3 && k.sss.length, p.id); assert(p.title.length <= 70, p.id + ' başlık uzun'); assert(p.desc.length <= 165, p.id + ' açıklama uzun');
    assert(h.includes(esc(k.altBaslik)), p.id + ' alt başlık'); assert(fs.existsSync(path.join(ROOT, 'assets', 'og', `og-${p.id}.png`)), p.id + ' og görseli');
  }
});
ok('ana sayfa şeması ve robots kuralları', () => {
  const i = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); assert(turler(i).includes('WebSite')); assert(i.includes('href="/fiyatlar/"'));
  const r = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8'); for (const k of ['Disallow: /admin/', 'Disallow: /api/', 'Sitemap: ']) assert(r.includes(k), k);
  assert(!/Disallow: \/(kvkk|fiyatlar|rehber|site)/.test(r), 'noindex sayfaları robots ile kapatılmamalı');
});

console.log('Üretici: rehber ve yasal Markdown dosyalarıyla');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-')); const tmpMd = path.join(tmp, 'md'); const uzun = 'Bu cümle sayfanın yeterince uzun olması için tekrar edilen örnek bir test metnidir. '.repeat(30);
fs.mkdirSync(path.join(tmpMd, 'rehber'), { recursive: true }); fs.mkdirSync(path.join(tmpMd, 'yasal'), { recursive: true });
fs.writeFileSync(path.join(tmpMd, 'rehber', 'market-programi-secimi.md'), `---\ntitle: Market programı nasıl seçilir\ndescription: Market programı seçerken bakılacak noktalar ve sık yapılan hatalar.\nprogram: pos\nkeywords: market programı, barkod\nupdated: 2026-09-15\nfaq:\nS: Barkod okuyucu şart mı?\nC: Hayır, telefon kamerası da kullanılabilir.\n---\n\n## Giriş\n\n${uzun}\n`);
fs.writeFileSync(path.join(tmpMd, 'rehber', 'kisa-yazi.md'), '---\ntitle: Kısa yazı\ndescription: Çok kısa bir taslak yazı örneği, indekslenmemeli.\nprogram: yok\n---\n\nKısa.\n');
fs.writeFileSync(path.join(tmpMd, 'yasal', 'kvkk.md'), `---\ntitle: KVKK Aydınlatma Metni\nupdated: 2026-10-01\n---\n\n## Veri sorumlusu\n\n${uzun}\n`);
const derle = (out, mdDir) => { const r = spawnSync(process.execPath, [path.join(SITE, 'tools', 'build-sites.js')], { env: { ...process.env, SITE_OUT: out, SITE_MD: mdDir }, encoding: 'utf8' }); assert.strictEqual(r.status, 0, r.stderr); return r; };
const o1 = path.join(tmp, 'o1'); const r1 = derle(o1, tmpMd);
ok('rehber sayfası, şemalar ve karşılıklı iç bağlantı', () => {
  const X = sayfalar(path.join(o1, 'site')); const h = X['rehber/market-programi-secimi']; assert(h, 'rehber sayfası');
  const T = turler(h); for (const k of ['BlogPosting', 'FAQPage', 'BreadcrumbList']) assert(T.includes(k), k);
  const b = sema(h).find((x) => x['@type'] === 'BlogPosting'); assert.strictEqual(b.dateModified, '2026-09-15');
  assert(h.includes('href="/marketprogrami"'), 'rehberden programa'); assert(X.marketprogrami.includes('href="/rehber/market-programi-secimi/"'), 'programdan rehbere'); assert(X.rehber.includes('href="/rehber/market-programi-secimi/"'), 'dizin');
  const xml = fs.readFileSync(path.join(o1, 'site', 'sitemap.xml'), 'utf8'); assert(xml.includes('/rehber/market-programi-secimi/</loc><lastmod>2026-09-15<')); denetle(X, xml);
});
ok('zayıf içerik noindex olur ve sitemap dışında kalır', () => {
  const X = sayfalar(path.join(o1, 'site')); assert(noindex(X['rehber/kisa-yazi'])); assert(!noindex(X.kvkk), 'kvkk md uzun'); assert(noindex(X.gizlilik), 'geçici kısa metin');
  assert(r1.stderr.includes('rehber program kimliği bulunamadı'));
});
ok('Markdown klasörü yokken derleme çalışır', () => {
  const o2 = path.join(tmp, 'o2'); derle(o2, path.join(tmp, 'olmayan')); const X = sayfalar(path.join(o2, 'site')); assert(noindex(X.rehber)); assert(X.kvkk.includes('örnek şablondur')); denetle(X, fs.readFileSync(path.join(o2, 'site', 'sitemap.xml'), 'utf8'));
});
fs.rmSync(tmp, { recursive: true, force: true });

// Google doğrulama kodu: veritabanı taklit edilerek rewrite ve ayar kaydı denenir
async function dogrulama() {
  console.log('Search Console doğrulama kodu');
  const db = require('../cloud/db'); const yazilan = []; db.ready = () => true;
  db.one = async (q, a) => (/settings/.test(q) && a && a[0] === 'site' ? { v: JSON.stringify({ googleVerify: 'abcDEF_123-xyz' }) } : null); db.q = async (q, a) => { yazilan.push(JSON.stringify(a || []).replace(/\\"/g, '"')); return []; };
  const { R } = require('../cloud/routes'); const seo = require('../cloud/seo');
  const t = await seo.rewrite('<head>\n</head>', { headers: { host: 'x.test' }, socket: {} }); assert(t.includes('<meta name="google-site-verification" content="abcDEF_123-xyz">'), t); n++; console.log('  ✓ tüm sayfalara meta etiketi eklenir');
  const r = R.find((x) => x.method === 'PUT' && x.re.test('/api/admin/settings')); assert(r, 'ayar ucu');
  const c = (googleVerify) => ({ body: { siteName: 'N', googleVerify }, user: { id: 1 }, req: { headers: {}, socket: {} }, params: {} });
  await r.fn(c('<meta name="google-site-verification" content="KOD_kod-12345" />')); assert(yazilan.some((x) => x.includes('"googleVerify":"KOD_kod-12345"')), 'kod ayıklanıp kaydedilmeli');
  await assert.rejects(() => r.fn(c('"><script>alert(1)</script>')), /geçersiz/); n++; console.log('  ✓ geçersiz kod reddedilir, meta etiketi kabul edilir');
}

// Sunucu adresleri: yönlendirme, sıkıştırma, önbellek başlıkları
const iste = (port, yol, h = {}) => new Promise((ok2, no) => { http.get({ host: '127.0.0.1', port, path: yol, headers: h }, (r) => { const b = []; r.on('data', (d) => b.push(d)); r.on('end', () => ok2({ s: r.statusCode, h: r.headers, b: Buffer.concat(b) })); }).on('error', no); });
async function sunucu() {
  console.log('Sunucu adresleri');
  const port = 20000 + (process.pid % 20000); const data = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-data-'));
  const ch = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NEBSOFT_DATA: data }, stdio: 'ignore' });
  try {
    for (let i = 0; i < 50; i++) { try { await iste(port, '/robots.txt'); break; } catch (e) { await new Promise((r) => setTimeout(r, 100)); } }
    for (const y of ['/kvkk/', '/gizlilik/', '/mesafeli-satis/', '/iade/', '/cerez/', '/fiyatlar/', '/rehber/', '/kayit/', '/programlar', '/randevusistemi']) { const r = await iste(port, y); assert.strictEqual(r.s, 200, y); assert(/text\/html/.test(r.h['content-type']), y); assert(r.b.includes('<h1'), y); }
    assert.strictEqual((await iste(port, '/kvkk')).h.location, '/kvkk/'); assert.strictEqual((await iste(port, '/randevusistemi/')).h.location, '/randevusistemi'); assert.strictEqual((await iste(port, '/site/kvkk/')).h.location, '/kvkk/'); assert.strictEqual((await iste(port, '/site/randevusistemi/index.html')).h.location, '/randevusistemi');
    n++; console.log('  ✓ sayfalar açılır, kanonik olmayan adresler 301 ile yönlenir');
    const g = await iste(port, '/fiyatlar/', { 'accept-encoding': 'gzip' }); assert.strictEqual(g.h['content-encoding'], 'gzip'); assert(zlib.gunzipSync(g.b).includes('<h1')); assert(/no-cache/.test(g.h['cache-control'])); assert.strictEqual(g.h.vary, 'Accept-Encoding');
    const c = await iste(port, '/site/assets/site.css?v=abcdef1234', { 'accept-encoding': 'gzip' }); assert.strictEqual(c.h['content-encoding'], 'gzip'); assert(/immutable/.test(c.h['cache-control'])); assert(zlib.gunzipSync(c.b).includes('.doc-w'));
    const d = await iste(port, '/site/assets/site.css'); assert(!d.h['content-encoding']); assert(!/immutable/.test(d.h['cache-control']));
    const j = await iste(port, '/randevusistemi/img/pc-1.jpg', { 'accept-encoding': 'gzip' }); assert(!j.h['content-encoding'], 'görsel sıkıştırılmaz'); assert(/max-age=604800/.test(j.h['cache-control']));
    const e = await iste(port, '/fiyatlar/', { 'accept-encoding': 'gzip', 'if-none-match': g.h.etag }); assert.strictEqual(e.s, 304);
    n++; console.log('  ✓ gzip, önbellek başlıkları ve ETag');
  } finally { ch.kill(); await new Promise((r) => setTimeout(r, 200)); try { fs.rmSync(data, { recursive: true, force: true }); } catch (e) { /* Windows dosya kilidi */ } }
}
(async () => { await sunucu(); await dogrulama(); console.log(`\nseo-sayfalar: ${n} kontrol geçti`); process.exit(0); })().catch((e) => { console.error(e); process.exit(1); });
