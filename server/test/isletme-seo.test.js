// İşletme sayfaları arama motoru testi: şema, noindex, veri sızıntısı, site haritası, kendi alan adı.
// Veritabanı gerekmez: db modülü bellekteki sahte tablolarla değiştirilir, tenantPage/domainSite gerçek kodla çalışır.
//   node server/test/isletme-seo.test.js
const assert = require('assert'); const path = require('path');
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

// ---------- Sahte veritabanı ----------
const T = {}; const Sites = {}; const Lic = {}; const Apps = {};
const lic = (tid) => (Lic[tid] || []).map((product) => ({ product, status: 'aktif', end: new Date(Date.now() + 864e5) }));
const fake = {
  ready: () => true, close: async () => {},
  one: async (s, p = []) => {
    if (/FROM tenants WHERE slug=\?/.test(s)) return Object.values(T).find((t) => t.slug === p[0]) || null;
    if (/FROM tenants WHERE id=\?/.test(s)) return T[p[0]] || null;
    if (/FROM biz_sites WHERE tenant_id=\?/.test(s)) return Sites[p[0]] || null;
    if (/FROM licenses WHERE tenant_id=\? AND product=\?/.test(s)) return (Lic[p[0]] || []).includes(p[1]) ? { id: 'l' } : null;
    if (/FROM biz_sites b JOIN tenants/.test(s)) { const id = Object.keys(Sites).find((k) => [p[0], p[1]].includes(Sites[k].domain)); return id ? T[id] : null; }
    if (/FROM settings/.test(s)) return null;
    return null;
  },
  q: async (s, p = []) => {
    if (/SELECT product FROM licenses/.test(s)) return lic(p[0]);
    if (/FROM app_data WHERE tenant_id=\?/.test(s)) return (Apps[p[0]] || []).filter((a) => a.data.includes('"sample":true'));
    if (/JOIN app_data/.test(s)) return Object.values(T).flatMap((t) => (Apps[t.id] || []).map((a) => ({ slug: t.slug, id: t.id, product: a.app, status: 'aktif', end: new Date(Date.now() + 864e5), updated: new Date() })));
    return [];
  },
};
const dbPath = require.resolve('../cloud/db'); require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fake };
const seo = require('../cloud/seo'); const B = require('../../core/bizsite');
const req = (host = 'nebsoft.example') => ({ headers: { host }, socket: {} });

// ---------- Veri ----------
const GIZLI = ['Ayşe Yılmaz', '05329998877', '12345678901', 'TR330006100519786457841326', 'gizli-musteri-notu', 'hasta-tanisi', 'sakin-borcu', 'sahip-kisisel@posta.com'];
const hizmet = (name, desc, price = 0, id = name) => ({ id, name, desc, price, cat: 'Saç', img: '' });
const gercek = () => ({
  name: 'Mavi Kuaför', slogan: 'Kadıköy’ün saç uzmanı', about: 'Mavi Kuaför 2009 yılından beri Moda’da kadın ve erkek saç kesimi, boya ve bakım hizmeti veriyor. Randevulu çalışıyoruz.',
  phone: '0216 345 67 89', email: 'merhaba@mavikuafor.com', address: 'Caferağa Mah. Moda Cad. No: 12', city: 'İstanbul', district: 'Kadıköy',
  hours: B.defaults().hours.map((h, i) => ({ open: '10:00', close: '20:00', closed: i === 6 })), hoursOk: true,
  products: [hizmet('Saç Kesimi', 'Yüz şeklinize uygun kesim, yıkama ve fön dahildir.', 450), hizmet('Saç Boyama', 'Amonyaksız boya ile tek renk uygulama, bakım maskesi dahil.', 1200), hizmet('Çay Ocağı', '', 0)],
  seo: { type: 'kuafor', gbp: 'https://maps.app.goo.gl/abc123', gsc: '<meta name="google-site-verification" content="AbCdEf_1234567890-xyz" />' },
  // Bilerek eklenmiş sızıntı denemeleri: clean() bu alanları asla geçirmemeli
  customers: [{ name: GIZLI[0], phone: GIZLI[1], tc: GIZLI[2], iban: GIZLI[3], note: GIZLI[4] }], patients: [{ dx: GIZLI[5] }], residents: [{ debt: GIZLI[6] }],
});
const koy = (id, slug, data, o = {}) => {
  T[id] = { id, name: o.name || data.name || 'İşletme', slug, phone: GIZLI[1], address: 'Sahibin ev adresi Sok. 7', city: 'Ankara', tax_no: GIZLI[2], sector: o.sector || '', ref_code: 'REF1' };
  if (o.site !== false) Sites[id] = { data: JSON.stringify(data), published: o.published === false ? 0 : 1, domain: o.domain || null, updated: new Date('2026-10-01T00:00:00Z') };
  Lic[id] = o.lic || ['eklenti-web', 'randevu']; Apps[id] = o.apps || [];
};
const jsonld = (h) => [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const metin = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
const robots = (h) => (/<meta name="robots" content="([^"]+)"/.exec(h) || [])[1];
const html = async (slug, r = req()) => { const x = await seo.tenantPage(r, slug); return x && typeof x === 'object' ? x.html : x; };

(async () => {
  koy('t1', 'mavi-kuafor', gercek(), { sector: 'Kuaför' });
  // ---------- 1. Tam HTML, başlık, şema ----------
  const h = await html('mavi-kuafor');
  assert.strictEqual(robots(h), 'index,follow');
  assert.match(h, /<title>Mavi Kuaför · Kuaför ve berber · Kadıköy, İstanbul<\/title>/);
  assert.match(h, /<link rel="canonical" href="https:\/\/nebsoft\.example\/t\/mavi-kuafor\/"|<link rel="canonical" href="http:\/\/nebsoft\.example\/t\/mavi-kuafor\/"/);
  assert.match(h, /property="og:title"/); assert.match(h, /property="og:description"/); assert.match(h, /property="og:url"/);
  const body = metin(h); for (const w of ['Saç Kesimi', '450 ₺', 'Moda Cad.', '0216 345 67 89', '10:00 – 20:00', 'Hakkımızda']) assert.ok(body.includes(w), 'betiksiz HTML içinde yok: ' + w);
  ok('ana sayfa betiksiz tam HTML: başlık (ad + hizmet + il/ilçe), canonical, Open Graph, içerik');
  const s = jsonld(h)[0];
  assert.strictEqual(s['@type'], 'HairSalon'); assert.strictEqual(s.telephone, '+902163456789'); assert.strictEqual(s.address.addressLocality, 'Kadıköy'); assert.strictEqual(s.address.addressRegion, 'İstanbul'); assert.strictEqual(s.address.addressCountry, 'TR');
  assert.strictEqual(s.openingHoursSpecification.length, 6); assert.deepStrictEqual(s.openingHoursSpecification[0], { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '10:00', closes: '20:00' });
  assert.ok(s.sameAs.includes('https://maps.app.goo.gl/abc123'));
  const of = s.hasOfferCatalog.itemListElement; assert.strictEqual(of.length, 2, 'fiyatı olmayan hizmet teklif olarak yazılmaz'); assert.strictEqual(of[0].price, 450); assert.strictEqual(of[0].priceCurrency, 'TRY');
  ok('schema.org: alt tür, E.164 telefon, adres, saatler, gerçek fiyat, Google profili');

  const tip = (o, ctx) => { const d = B.clean({ name: 'A', ...o }); return B.BIZ_TYPES[B.bizType(d, ctx)][0]; };
  assert.strictEqual(tip({ seo: { type: 'dis' } }), 'Dentist'); assert.strictEqual(tip({}, { sector: 'Diş kliniği' }), 'Dentist'); assert.strictEqual(tip({}, { apps: ['adisyon'] }), 'Restaurant'); assert.strictEqual(tip({}, { apps: ['emlak'] }), 'RealEstateAgent'); assert.strictEqual(tip({}, { sector: 'Oto tamirci' }), 'AutoRepair'); assert.strictEqual(tip({}, { sector: 'Güzellik merkezi' }), 'BeautySalon');
  assert.deepStrictEqual(tip({}, { apps: ['veteriner'] }), ['VeterinaryCare', 'LocalBusiness']); assert.strictEqual(tip({}, { sector: 'Psikolog', apps: ['randevu'] }), 'LocalBusiness'); assert.strictEqual(tip({ seo: { type: 'yok' } }), 'LocalBusiness');
  ok('sektöre göre tür: seçim > sektör > program; belirsizse LocalBusiness (tahmin yok)');

  // ---------- 2. Hizmet sayfaları ----------
  const sv = await seo.tenantService(req(), 'mavi-kuafor', 'sac-kesimi'); assert.ok(sv);
  assert.strictEqual(robots(sv.html), 'index,follow'); assert.match(sv.html, /<h1[^>]*>Saç Kesimi<\/h1>/); assert.match(sv.html, /canonical" href="[^"]+\/t\/mavi-kuafor\/hizmet\/sac-kesimi\/"/); assert.ok(!/<script>/.test(sv.html), 'betiksiz');
  const j = jsonld(sv.html); assert.strictEqual(j[1]['@type'], 'Service'); assert.strictEqual(j[1].offers.price, 450); assert.strictEqual(j[2]['@type'], 'BreadcrumbList');
  assert.notStrictEqual(/<title>(.*?)<\/title>/.exec(sv.html)[1], /<title>(.*?)<\/title>/.exec(h)[1]); assert.match(h, /href="hizmet\/sac-kesimi\/"/);
  ok('hizmet sayfası: kendi adresi, başlığı, canonical, Service + Offer, içerik haritası bağlantısı');
  const zayif = await seo.tenantService(req(), 'mavi-kuafor', 'cay-ocagi'); assert.strictEqual(robots(zayif.html), 'noindex,follow'); assert.strictEqual(await seo.tenantService(req(), 'mavi-kuafor', 'olmayan'), null); assert.strictEqual(await seo.tenantService(req(), 'mavi-kuafor', '../x'), null);
  ok('açıklamasız hizmet noindex, olmayan hizmet 404');
  const d2 = B.clean({ products: [hizmet('Şık Ürün', 'x'), hizmet('Şık Ürün', 'y'), hizmet('!!!', 'z')] }); assert.deepStrictEqual(B.services(d2).map((p) => p.slug), ['sik-urun', 'sik-urun-2', 'hizmet-3']);
  ok('slug: Türkçe karakter, çakışma, boş ad');

  const sm = await seo.tenantSitemap(req(), 'mavi-kuafor'); const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.strictEqual(locs.length, 3); assert.ok(locs[1].endsWith('/t/mavi-kuafor/hizmet/sac-kesimi/')); assert.ok(!locs.some((u) => u.includes('cay-ocagi')), 'noindex sayfa haritada olmaz'); assert.match(sm.body, /<lastmod>2026-10-01<\/lastmod>/);
  ok('işletme sitemap: yalnızca dizine açık adresler, gerçek lastmod');

  // ---------- 3. Noindex: zayıf, boş, demo ----------
  const hazir = B.defaults({ name: 'Yeni Berber', phone: '0216 345 67 89', city: 'İzmir' }); koy('t2', 'yeni-berber', hazir);
  const h2 = await html('yeni-berber'); assert.strictEqual(robots(h2), 'noindex,follow'); assert.ok(!h2.includes('en iyi hizmeti sunmak') && !h2.includes('Kaliteli hizmet, güler yüz') && !h2.includes('Size özel kampanyalar'), 'dolgu metin yayınlanmaz');
  assert.ok(!metin(h2).includes('Çalışma saatleri'), 'onaysız hazır saat gösterilmez'); assert.strictEqual(jsonld(h2)[0].openingHoursSpecification, undefined);
  assert.deepStrictEqual((await seo.tenantUrls(req(), 'yeni-berber')).urls, []);
  ok('hazır dolgu içerik: noindex, metinler ve onaysız saatler yayında değil, haritada yok');
  for (const [ad, o] of [['işletme adı', { name: 'İşletmem' }], ['test adı', { name: 'Test Kuaför' }], ['sahte telefon', { phone: '0212 000 00 00', email: '' }], ['adres yok', { address: '', city: '', district: '' }], ['iletişim kapalı', { sections: { contact: false } }]]) assert.strictEqual(B.seoCheck({ ...gercek(), ...o }).index, false, ad);
  assert.ok(!metin(B.render({ ...gercek(), phone: '0212 000 00 00' })).includes('000 00 00'));
  assert.strictEqual(B.seoCheck({ ...gercek(), about: 'kısa', products: [] }).index, false); assert.strictEqual(robots(B.render(gercek(), { preview: true })), 'noindex,follow');
  ok('demo/test adı, sahte telefon, adres veya içerik yoksa noindex; önizleme asla dizine açık değil');

  koy('t3', 'yalin', {}, { site: false, name: 'Yalın Oto', lic: ['randevu'], apps: [{ app: 'randevu', data: '{}' }] });
  const h3 = await html('yalin'); assert.strictEqual(robots(h3), 'noindex,follow'); assert.ok(h3.includes('Online randevu al'));
  koy('t4', 'taslak', gercek(), { published: false }); assert.strictEqual(robots(await html('taslak')), 'noindex,follow'); assert.strictEqual(await seo.tenantService(req(), 'taslak', 'sac-kesimi'), null); assert.deepStrictEqual((await seo.tenantUrls(req(), 'taslak')).urls, []);
  koy('t5', 'suresi-bitti', gercek(), { lic: ['randevu'] }); assert.strictEqual(await seo.tenantService(req(), 'suresi-bitti', 'sac-kesimi'), null); assert.strictEqual(robots(await html('suresi-bitti')), 'noindex,follow');
  ok('sitesiz, taslak ve eklentisi bitmiş işletme: noindex, hizmet sayfası yok');

  // Programın örnek verisi (yeni hesapta otomatik gelir) siteye aktarılmış olsa bile yayınlanmaz
  const orn = gercek(); orn.products.push(hizmet('Örnek Süt 1L', 'Programın başlangıç örnek verisinden gelen ürün açıklaması.', 30));
  koy('t6', 'ornekli', orn, { apps: [{ app: 'pos', data: JSON.stringify({ _meta: { sample: true }, products: [{ name: 'Örnek Süt 1L' }] }) }] });
  const h6 = await html('ornekli'); assert.ok(!h6.includes('Örnek Süt')); assert.strictEqual(await seo.tenantService(req(), 'ornekli', 'ornek-sut-1l'), null);
  ok('örnek veriden aktarılan ürün yayında ve haritada yok');

  // ---------- 4. Veri güvenliği ----------
  const tum = [h, sv.html, zayif.html, h3, await html('taslak'), sm.body].join('\n');
  for (const g of GIZLI) assert.ok(!tum.includes(g), 'sızıntı: ' + g);
  assert.ok(!tum.includes('Sahibin ev adresi') && !h3.includes('Ankara'), 'kayıt adresi yayınlanmaz');
  assert.ok(!h.includes('tax_no') && !tum.includes('customers'));
  ok('müşteri/hasta/sakin verisi, kayıt telefonu, vergi no ve kayıt adresi hiçbir sayfada yok');
  const c = B.clean(gercek()); assert.deepStrictEqual(Object.keys(c).filter((k) => /customer|patient|resident/.test(k)), []);
  const kapali = B.render({ ...gercek(), sections: { contact: false, hours: false, products: false } }); const ks = jsonld(kapali)[0];
  assert.strictEqual(ks.telephone, undefined); assert.strictEqual(ks.email, undefined); assert.strictEqual(ks.openingHoursSpecification, undefined); assert.strictEqual(ks.hasOfferCatalog, undefined); assert.ok(!kapali.includes('Saç Boyama')); assert.ok(!kapali.includes('merhaba@mavikuafor.com'));
  assert.strictEqual(B.renderService({ ...gercek(), sections: { products: false } }, 'sac-kesimi', {}), null);
  ok('kapatılan bölümün alanı şemaya, başlığa ve hizmet sayfasına çıkmaz');
  const x = B.render({ ...gercek(), mode: 'siparis', name: '</script><script>alert(1)</script>', products: [hizmet('</script><img src=x>', 'a'.repeat(40), 5, 'p1')] }, { orderable: true, url: 'https://a.example/' });
  assert.ok(!/<\/script><script>alert/.test(x) && !/<\/script><img/.test(x)); assert.doesNotThrow(() => jsonld(x));
  ok('ad ve ürün metni sayfaya betik enjekte edemez (JSON-LD ve sepet verisi dahil)');
  assert.strictEqual(B.clean({ seo: { gbp: 'https://kotu.example/google.com' } }).seo.gbp, ''); assert.strictEqual(B.clean({ seo: { gbp: 'https://google.ev.il/x' } }).seo.gbp, ''); assert.strictEqual(B.clean({ seo: { gsc: '"><script>' } }).seo.gsc, ''); assert.strictEqual(c.seo.gsc, 'AbCdEf_1234567890-xyz');
  assert.ok(h.includes('<meta name="google-site-verification" content="AbCdEf_1234567890-xyz">') && !sv.html.includes('google-site-verification'));
  ok('Google profil adresi ve doğrulama kodu süzülür; kod yalnızca ana sayfada');

  // ---------- 5. Kendi alan adı ----------
  koy('t7', 'kendi', gercek(), { domain: 'www.mavikuafor.com', sector: 'Kuaför' });
  const dg = (p, host = 'www.mavikuafor.com') => seo.domainSite(req(host), p);
  const dh = await dg('/'); assert.match(dh.body, /canonical" href="https:\/\/www\.mavikuafor\.com\/"/); assert.ok(dh.csp);
  const dm = await dg('/sitemap.xml'); assert.match(dm.body, /<loc>https:\/\/www\.mavikuafor\.com\/hizmet\/sac-kesimi\/<\/loc>/); assert.ok(!dm.body.includes('/t/'));
  const dr = await dg('/robots.txt'); assert.match(dr.body, /Sitemap: https:\/\/www\.mavikuafor\.com\/sitemap\.xml/); assert.match(dr.body, /Disallow: \/api\//); assert.ok(!/Disallow: \/\n/.test(dr.body));
  const dsv = await dg('/hizmet/sac-kesimi/'); assert.match(dsv.body, /canonical" href="https:\/\/www\.mavikuafor\.com\/hizmet\/sac-kesimi\/"/); assert.ok((await dg('/hizmet/sac-kesimi')).redirect);
  assert.strictEqual((await dg('/', 'mavikuafor.com')), null, 'www olmayan adres eşleşmezse ana akışa düşer');
  assert.strictEqual(await dg('/hizmet/yok/'), null);
  assert.match(await html('kendi'), /canonical" href="https:\/\/www\.mavikuafor\.com\/"/); assert.strictEqual((await seo.tenantSitemap(req(), 'kendi')).redirect, 'https://www.mavikuafor.com/sitemap.xml');
  ok('kendi alan adı: canonical, /sitemap.xml, /robots.txt, hizmet sayfaları; /t/ adresi alan adını gösterir');
  koy('t8', 'kendi-zayif', hazir, { domain: 'zayif.example.com' }); const zm = await seo.domainSite(req('zayif.example.com'), '/sitemap.xml'); assert.ok(!zm.body.includes('<loc>')); assert.ok(!/Disallow: \/\n/.test((await seo.domainSite(req('zayif.example.com'), '/robots.txt')).body));
  ok('zayıf site: harita boş, robots engellemez (noindex okunabilsin)');

  // ---------- 6. Hazırlık listesi uydurma başarı üretmez ----------
  const r0 = B.readiness(B.defaults({ name: 'Yeni' }), {}, {}); const by = (r, k) => r.items.find((i) => i.k === k);
  assert.strictEqual(r0.items.filter((i) => i.ok === true).length, r0.done); ['addon', 'published', 'live', 'hours', 'about', 'gbp', 'gsc'].forEach((k) => assert.strictEqual(by(r0, k).ok, false, k));
  const r1 = B.readiness(gercek(), {}, { published: true, addon: true }); assert.strictEqual(by(r1, 'live').ok, null, 'sunucudan okunmadan başarı sayılmaz'); assert.strictEqual(by(r1, 'hours').ok, true); assert.strictEqual(by(r1, 'gsc').ok, true);
  const r2 = B.readiness(gercek(), {}, { published: true, addon: true, live: { index: true }, domain: 'a.com' }); assert.strictEqual(by(r2, 'live').ok, true); assert.strictEqual(by(r2, 'domain').ok, null, 'sınanmamış alan adı başarı sayılmaz');
  const r3 = B.readiness(gercek(), {}, { published: true, addon: true, live: { index: false, reasons: ['X'], domain: { ok: false, error: 'yok' } }, domain: 'a.com' }); assert.strictEqual(by(r3, 'live').ok, false); assert.strictEqual(by(r3, 'domain').ok, false); assert.strictEqual(by(r3, 'domain').hint, 'yok');
  ok('hazırlık listesi gerçek durumdan: sınanmayan madde başarılı görünmez');

  // Sunucu uç noktası: yayındaki sayfayı üretip okur; sınanamayan alan adı başarılı dönmez
  const { R } = require('../cloud/routes'); const hr = R.find((x) => x.re.test('/api/websitem/hazirlik')); const hz = (id) => hr.fn({ user: { tenant_id: id }, req: req() });
  const a1 = await hz('t1'); assert.strictEqual(a1.live.index, true); assert.strictEqual(a1.live.urls, 3); assert.strictEqual(a1.sector, 'Kuaför');
  const a2 = await hz('t2'); assert.strictEqual(a2.live.index, false); assert.ok(a2.live.reasons.length > 0);
  assert.strictEqual((await hz('t4')).live, null, 'taslak sitede yayın sonucu yok');
  koy('t9', 'alanadi', gercek(), { domain: 'www.ornek-alan.invalid' }); const a3 = await hz('t9'); assert.strictEqual(a3.live.domain.ok, false); assert.ok(a3.live.domain.error);
  ok('hazırlık uç noktası: sonuç üretilen sayfadan okunur, bağlanamayan alan adı başarısız');

  // ---------- 7. Eski kayıt ve demo adresi ----------
  const eski = gercek(); delete eski.district; delete eski.hoursOk; eski.city = 'Kadıköy, İstanbul'; const ek = B.clean(eski); assert.strictEqual(ek.district, ''); assert.ok(B.hoursReal(ek), 'değiştirilmiş saat onaylı sayılır'); assert.strictEqual(B.clean({}).hoursOk, false); assert.strictEqual(B.hoursReal(B.clean({})), false); assert.match(B.render(eski), /Kadıköy, İstanbul/);
  ok('eski kayıtlar bozulmaz');
  const srv = require('fs').readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf8'); assert.match(srv, /demo=1[^\n]*X-Robots-Tag/);
  ok('?demo=1 adresleri X-Robots-Tag ile dizin dışı');
  console.log(`\n${n} test geçti`); process.exit(0);
})().catch((e) => { console.error('HATA:', e); process.exit(1); });
