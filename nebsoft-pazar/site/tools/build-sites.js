// Ürün tanıtım sitelerini üretir: node site/tools/build-sites.js
// Kaynak: site/src/products.js + market/catalog.js + site/src/site.config.js → site/<slug>/index.html, site/sitemap.xml, robots.txt
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');
const CFG = require('../src/site.config');
const PRODUCTS = require('../src/products');
const win = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'market', 'catalog.js'), 'utf8'), { window: win });
const CAT = win.CATALOG;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tl = (n) => new Intl.NumberFormat('tr-TR').format(n);
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const D = CFG.domain.replace(/\/$/, '');
const tel = CFG.phone.replace(/\D/g, '');
const I = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
const img = (src, alt, w, h, eager) => `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const browser = (src, alt, url, eager) => `<div class="browser"><div class="bar"><i></i><i></i><i></i><b>${esc(url)}</b></div>${img(src, alt, 1440, 900, eager)}</div>`;
const phone = (src, alt) => `<div class="phone">${img(src, alt, 780, 1688)}</div>`;

function page(p) {
  const c = CAT.products.find((x) => x.id === p.id);
  const url = `${D}/${p.slug}`;
  const base = `/${p.slug}/img/`;
  const host = D.replace(/^https?:\/\//, '');
  const demo = `/apps/${p.id}/index.html?demo=1`;
  const buy = `/#/urun/${p.id}`;
  const rel = PRODUCTS.filter((x) => x.id !== p.id).map((x) => ({ x, c: CAT.products.find((y) => y.id === x.id) }))
    .sort((a, b) => (b.c.cat === c.cat) - (a.c.cat === c.cat)).slice(0, 4);
  const sector = (CAT.categories.find((k) => k.id === c.cat) || {}).name || '';
  const schema = [
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: `${CFG.brand} ${c.name}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Windows, macOS, Android, iOS', description: p.desc, url, image: `${D}${base}pc-1.jpg`, screenshot: p.shots.map((_, i) => `${D}${base}pc-${i + 1}.jpg`),
      offers: { '@type': 'AggregateOffer', priceCurrency: 'TRY', lowPrice: c.prices[0], highPrice: c.prices[2], offerCount: 3 }, publisher: { '@type': 'Organization', name: CFG.brand, url: D } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: CFG.brand, item: D + '/' }, { '@type': 'ListItem', position: 2, name: sector, item: D + '/#/urunler' }, { '@type': 'ListItem', position: 3, name: p.kw[0].toLocaleUpperCase('tr') + p.kw.slice(1), item: url }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: (c.faq || []).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  const kwTitle = p.kw[0].toLocaleUpperCase('tr') + p.kw.slice(1);
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${c.accent}">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}">
<meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${D}${base}pc-1.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.title)}"><meta name="twitter:description" content="${esc(p.desc)}"><meta name="twitter:image" content="${D}${base}pc-1.jpg">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" as="image" href="${base}pc-1.jpg">
<link rel="stylesheet" href="/site/assets/site.css">
<style>:root{--c:${c.accent}}</style>
${schema.map(ld).join('\n')}
</head>
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
<header class="hd"><div class="w">
  <a class="logo" href="/" aria-label="${CFG.brand} ana sayfa"><img src="/assets/favicon.svg" alt="" width="28" height="28"><b>${CFG.brand}</b><span>${esc(c.name)}</span></a>
  <nav class="nav" aria-label="Sayfa içi"><a href="#ekranlar">Ekranlar</a><a href="#ozellikler">Özellikler</a><a href="#fiyat">Fiyatlar</a><a href="#sss">SSS</a></nav>
  <a class="btn s" href="${demo}">Canlı demo</a><a class="btn p" href="${buy}">Ücretsiz dene</a>
</div></header>
<main id="ana">
<section class="hero"><div class="w">
  <div>
    <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / <a href="/#/urunler">${esc(sector)}</a> / ${esc(kwTitle)}</nav>
    <span class="eyebrow" style="margin-top:22px">${esc(kwTitle)}</span>
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <div class="cta"><a class="btn p" href="${buy}">${CFG.trialDays} gün ücretsiz deneyin ${I.arrow}</a><a class="btn" href="${demo}">${I.play} Canlı demoyu aç</a></div>
    <div class="trust"><span>${I.check}Kurulum yok</span><span>${I.check}Kredi kartı gerekmez</span><span>${I.check}Telefon, tablet, bilgisayar</span></div>
  </div>
  <div class="stage">${browser(base + 'pc-1.jpg', `${c.name} programı — ${p.shots[0][1]}`, `${host}/${p.slug}`, true)}${phone(base + 'mobil-1.jpg', `${c.name} programının telefon görünümü`)}</div>
</div></section>

<section class="s alt"><div class="w">
  <div class="sh"><span class="eyebrow">Neden ${CFG.brand} ${esc(c.name)}?</span><h2>İşletmenizi yoran üç sorun, tek çözüm</h2></div>
  <div class="pains">${p.pains.map(([t, d], i) => `<div class="pain"><div class="n">0${i + 1}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>

<section class="s" id="ekranlar"><div class="w">
  <div class="sh"><span class="eyebrow">Gerçek ekranlar</span><h2>Programın içine bakın</h2><p>Aşağıdakiler tasarım çizimi değil; ${esc(c.name)} programının demo verileriyle alınmış gerçek ekran görüntüleri. Aynısını canlı demoda kendiniz kullanabilirsiniz.</p></div>
  <div class="tabs" role="tablist" aria-label="Ekran seçimi">${p.shots.map(([, cap], i) => `<button role="tab" id="t${i}" aria-controls="g${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(cap)}</button>`).join('')}</div>
  <div class="gal">
    <div>${p.shots.map(([, cap], i) => `<figure class="slide" role="tabpanel" id="g${i}" aria-labelledby="t${i}"${i ? ' hidden' : ''}>${browser(base + `pc-${i + 1}.jpg`, `${c.name} — ${cap}`, `${host}/${p.slug}`)}<figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>
    <figure>${phone(base + 'mobil-1.jpg', `${c.name} mobil ekran`)}<figcaption>Telefonda da tam ekran çalışır</figcaption></figure>
  </div>
  ${(p.pub || []).map(([, cap], i) => `<div class="pub"><div><span class="eyebrow" style="margin-top:50px">Müşterinizin gördüğü</span><h3 style="font-size:26px;margin-bottom:16px">${esc(cap)}</h3>${browser(base + `musteri-pc-${i + 1}.jpg`, cap, host)}</div>${phone(base + `musteri-mobil-${i + 1}.jpg`, `${cap} — telefon`)}</div>`).join('')}
</div></section>

<section class="s alt" id="ozellikler"><div class="w">
  <div class="sh"><span class="eyebrow">Özellikler</span><h2>${esc(kwTitle)} için ihtiyacınız olan her şey</h2><p>${esc(c.desc)}</p></div>
  <ul class="feat">${c.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  <h3 style="margin-top:46px">Modüller</h3>
  <div class="chips">${c.modules.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
  ${c.sectors ? `<h3 style="margin-top:34px">Kimler kullanıyor?</h3><div class="chips">${c.sectors.map((m) => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
</div></section>

<section class="s" id="fiyat"><div class="w">
  <div class="sh"><span class="eyebrow">Fiyatlar</span><h2>Şeffaf fiyat, taahhüt yok</h2><p>Fiyatlar aylıktır, KDV hariçtir. Yıllık ödemede 2 ay bedava. Her pakette ${CFG.trialDays} gün ücretsiz deneme.</p></div>
  <div class="prices">${CAT.plans.map((pl, i) => `<div class="price${pl.popular ? ' pop' : ''}">${pl.popular ? '<span class="tag">En çok tercih edilen</span>' : ''}<h3>${esc(pl.name)}</h3><div class="amt">${tl(c.prices[i])} ₺<small> /ay</small></div><p>${esc(pl.desc)} · ${esc(pl.users)}</p><a class="btn${pl.popular ? ' p' : ''}" href="${buy}">Ücretsiz başla</a></div>`).join('')}</div>
  <p class="note">Kurulum ve veri aktarımı ücretsizdir. Sorunuz mu var? <a href="tel:+90${tel.replace(/^0/, '')}">${esc(CFG.phone)}</a></p>
</div></section>

${(c.faq || []).length ? `<section class="s alt" id="sss"><div class="w">
  <div class="sh"><span class="eyebrow">Sık sorulan sorular</span><h2>${esc(kwTitle)} hakkında merak edilenler</h2></div>
  <div class="faq">${c.faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div></section>` : ''}

<section class="s"><div class="w">
  <div class="final"><div><h2>${esc(c.name)} programını bugün kullanmaya başlayın</h2><p>Kayıt olmadan canlı demoyu açın ya da ${CFG.trialDays} günlük ücretsiz denemeyi başlatın. Kurulumu ve veri aktarımını birlikte yapalım.</p></div>
  <div class="cta" style="margin:0"><a class="btn p" href="${buy}">Ücretsiz dene ${I.arrow}</a><a class="btn" href="tel:+90${tel.replace(/^0/, '')}">${I.phone} ${esc(CFG.phone)}</a></div></div>
  <div class="sh" style="margin:80px 0 24px"><span class="eyebrow">Bunlar da ilginizi çekebilir</span><h2>Diğer ${CFG.brand} programları</h2></div>
  <div class="rel">${rel.map(({ x, c: y }) => `<a href="/${x.slug}"><b>${esc(y.name)}</b><span>${esc(y.tagline)}</span></a>`).join('')}</div>
</div></section>
</main>
<footer class="ft"><div class="w">
  <div class="cols">
    <div><img src="/assets/nebsoft-logo.webp" alt="${CFG.brand}" width="120" height="26"><p>Türkiye'deki işletmeler için bulut tabanlı yazılımlar ve pazaryeri entegrasyonları.</p><p><a href="tel:+90${tel.replace(/^0/, '')}">${esc(CFG.phone)}</a><a href="mailto:${CFG.email}">${esc(CFG.email)}</a></p></div>
    ${[0, 1, 2].map((k) => `<div><h4>${['Programlar', '&nbsp;', '&nbsp;'][k]}</h4>${PRODUCTS.filter((_, i) => i % 3 === k).map((x) => `<a href="/${x.slug}">${esc(x.kw[0].toLocaleUpperCase('tr') + x.kw.slice(1))}</a>`).join('')}</div>`).join('')}
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${CFG.brand}. Tüm hakları saklıdır. · <a href="/#/yasal" style="display:inline">KVKK ve yasal metinler</a></div>
</div></footer>
<div class="sticky-cta"><a class="btn" href="${demo}">Demo</a><a class="btn p" href="${buy}">Ücretsiz dene</a></div>
<script>
(function () {
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  function sel(t) { tabs.forEach(function (b) { var on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; document.getElementById(b.getAttribute('aria-controls')).hidden = !on; }); t.focus(); }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { sel(b); });
    b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length]); } });
  });
})();
</script>
</body>
</html>
`;
}

const today = new Date().toISOString().slice(0, 10);
for (const p of PRODUCTS) {
  const dir = path.join(SITE, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const missing = ['pc-1.jpg', 'mobil-1.jpg'].filter((f) => !fs.existsSync(path.join(dir, 'img', f)));
  if (missing.length) console.warn('! görsel eksik', p.slug, missing.join(', '), '→ node site/tools/screens.js', p.id);
  fs.writeFileSync(path.join(dir, 'index.html'), page(p));
}
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${D}/</loc><lastmod>${today}</lastmod></url>
${PRODUCTS.map((p) => `  <url><loc>${D}/${p.slug}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Disallow: /admin/
Disallow: /api/
Sitemap: ${D}/sitemap.xml
`);
console.log(`✓ ${PRODUCTS.length} tanıtım sitesi, sitemap.xml ve robots.txt üretildi (${D})`);
