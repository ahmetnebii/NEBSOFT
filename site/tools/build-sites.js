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

// Ana siteyle aynı üst menü ve alt bilgi (tanıtım siteleri ve /programlar)
const SITEHEAD = (sub, extra = '') => `<header class="hd mk"><div class="w">
  <a class="logo" href="/" aria-label="${CFG.brand} ana sayfa"><img src="/assets/icons/icon-64.png" alt="" width="36" height="36"><span class="wm"><b>NEB</b><i>SOFT</i></span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</a>
  <nav class="nav" aria-label="Ana menü"><a href="/#/urunler">Programlar</a><a href="/#/fiyatlar">Fiyatlar</a><a href="/#/sektorler">Sektörler</a><a href="/#/indir">Masaüstü & Mobil</a><a href="/#/iletisim">İletişim</a></nav>
  <a class="btn g" href="/#/giris">Giriş yap</a><a class="btn p" href="/#/kayit">Ücretsiz başla ${I.arrow}</a>
</div>${extra ? `<div class="subnav"><div class="w">${extra}</div></div>` : ''}</header>`;
const SITEFOOT = () => `<footer class="ft"><div class="w">
  <div class="cols">
    <div><a class="logo" href="/"><img src="/assets/icons/icon-64.png" alt="" width="34" height="34"><span class="wm"><b>NEB</b><i>SOFT</i></span></a><p>Türkiye'deki işletmeler için bulut tabanlı yazılımlar ve pazaryeri entegrasyonları. Kurulum yok, taahhüt yok.</p><p><a href="tel:+90${tel.replace(/^0/, '')}">${esc(CFG.phone)}</a><a href="mailto:${CFG.email}">${esc(CFG.email)}</a></p></div>
    ${[0, 1, 2].map((k) => `<div><h4>${['<a href="/programlar" style="color:inherit">Programlar</a>', '&nbsp;', '&nbsp;'][k]}</h4>${PRODUCTS.filter((_, i) => i % 3 === k).map((x) => `<a href="/${x.slug}">${esc(x.kw[0].toLocaleUpperCase('tr') + x.kw.slice(1))}</a>`).join('')}</div>`).join('')}
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${CFG.brand}. Tüm hakları saklıdır. · <a href="/#/yasal/kvkk" style="display:inline">KVKK ve yasal metinler</a> · <a href="/#/indir" style="display:inline">Masaüstü sürümünü indir</a></div>
</div></footer>`;
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
<meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${D}/assets/og/og-${p.id}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.title)}"><meta name="twitter:description" content="${esc(p.desc)}"><meta name="twitter:image" content="${D}/assets/og/og-${p.id}.png">
<link rel="icon" href="/assets/icons/icon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="preload" as="image" href="${base}pc-1.jpg">
<link rel="stylesheet" href="/site/assets/site.css">
<style>:root{--c:${c.accent}}</style>
${schema.map(ld).join('\n')}
</head>
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
${SITEHEAD(c.name, `<b>${esc(c.name)}</b><nav aria-label="Sayfa içi"><a href="#ekranlar">Ekranlar</a><a href="#ozellikler">Özellikler</a><a href="#fiyat">Fiyatlar</a><a href="#sss">SSS</a></nav><a class="btn s sm" href="${demo}">Canlı demo</a>`)}
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
  <div class="prices">${CAT.plans.map((pl, i) => `<div class="price${pl.popular ? ' pop' : ''}">${pl.popular ? '<span class="tag">Önerilen</span>' : ''}<h3>${esc(pl.name)}</h3><div class="amt"><span data-p="${c.id}:${i}">${tl(c.prices[i])}</span> ₺<small> /ay</small></div><p>${esc(pl.desc)} · ${esc(pl.users)}</p><a class="btn${pl.popular ? ' p' : ''}" href="${buy}">Ücretsiz başla</a></div>`).join('')}</div>
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
${SITEFOOT()}
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
// Program merkez sayfası (/programlar): tüm tanıtım sitelerine sektörlere göre iç bağlantı + kuruluş şeması
function hub() {
  const url = `${D}/programlar`; const title = `İşletme Programları — ${CFG.brand} | ${PRODUCTS.length} Bulut Yazılım, Ücretsiz Hesap`;
  const desc = `Market, restoran, kuaför, otel, servis, eczane, emlak ve daha fazlası için ${PRODUCTS.length} bulut işletme programı. Kurulum yok; ücretsiz hesap açın, her programı ${CFG.trialDays} gün ücretsiz deneyin, havale ile ödeyin.`;
  const groups = CAT.categories.map((k) => ({ k, list: PRODUCTS.map((x) => ({ x, c: CAT.products.find((y) => y.id === x.id) })).filter(({ c }) => c && c.cat === k.id) })).filter((g) => g.list.length);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: CFG.brand, url: D + '/', logo: D + '/assets/nebsoft-logo.webp', contactPoint: { '@type': 'ContactPoint', telephone: '+90' + tel.replace(/^0/, ''), contactType: 'sales', areaServed: 'TR', availableLanguage: 'Turkish' }, email: CFG.email },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'İşletme programları', itemListElement: PRODUCTS.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${D}/${x.slug}`, name: (CAT.products.find((y) => y.id === x.id) || {}).name })) },
  ];
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${D}/assets/og/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icons/icon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/site/assets/site.css">
<style>:root{--c:#1d7bf5}.hub h2{margin:56px 0 18px}</style>
${schema.map(ld).join('\n')}
</head>
<body>
${SITEHEAD('')}
<main id="ana" class="hub">
<section class="s"><div class="w">
  <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / Programlar</nav>
  <h1>İşletmeniz için bulut programlar</h1>
  <p class="lead">${esc(desc)}</p>
  ${groups.map((g) => `<h2>${esc(g.k.name)}</h2><div class="hubgrid">${g.list.map(({ x, c }) => `<a class="hubcard" href="/${x.slug}" style="--c:${c.accent}"><span class="hubimg"><img src="/${x.slug}/img/pc-1.jpg" alt="${esc(c.name)} ekranı" width="1440" height="900" loading="lazy" decoding="async"></span><span class="hubtx"><b>${esc(x.kw[0].toLocaleUpperCase('tr') + x.kw.slice(1))}</b><span>${esc(c.tagline)}</span><em>${tl(c.prices[0])} ₺/ay'dan · İncele →</em></span></a>`).join('')}</div>`).join('\n  ')}
  <div class="final" style="margin-top:72px"><div><h2>Hangisi size uygun, emin değil misiniz?</h2><p>Bizi arayın; işletmenize uygun programı birlikte seçelim, kurulumu ve veri aktarımını ücretsiz yapalım.</p></div>
  <div class="cta" style="margin:0"><a class="btn p" href="/#/urunler">Tüm ürünler ${I.arrow}</a><a class="btn" href="tel:+90${tel.replace(/^0/, '')}">${I.phone} ${esc(CFG.phone)}</a></div></div>
</div></section>
</main>
${SITEFOOT()}
</body>
</html>
`;
}
// Pazar ana sayfası: arama motorları için sabit başlık, şema ve program bağlantıları (sayfa betiği açılınca kendi arayüzünü çizer)
{
  const f = path.join(ROOT, 'index.html'); let h = fs.readFileSync(f, 'utf8');
  const title = `${CFG.brand} — İşletme Yazılımları | Ücretsiz Hesap Açın`;
  const desc = `Market POS, restoran adisyon, randevu, otel, teknik servis, eczane, emlak ve ${PRODUCTS.length} bulut işletme programı. Kurulum yok; ücretsiz hesap açın, her programı ${CFG.trialDays} gün ücretsiz deneyin.`;
  const head = `<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${D}/"><meta property="og:image" content="${D}/assets/og/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${D}/assets/og/og.png">
${ld({ '@context': 'https://schema.org', '@type': 'Organization', name: CFG.brand, url: D + '/', logo: D + '/assets/nebsoft-logo.webp', email: CFG.email, contactPoint: { '@type': 'ContactPoint', telephone: '+90' + tel.replace(/^0/, ''), contactType: 'sales', areaServed: 'TR', availableLanguage: 'Turkish' } })}
${ld({ '@context': 'https://schema.org', '@type': 'WebSite', name: CFG.brand, url: D + '/' })}`;
  const body = `<main class="seo-static" style="max-width:900px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${esc(title)}</h1><p>${esc(desc)}</p><ul>${PRODUCTS.map((x) => `<li><a href="/${x.slug}">${esc(x.kw[0].toLocaleUpperCase('tr') + x.kw.slice(1))}</a></li>`).join('')}</ul><p><a href="/programlar">Tüm programlar</a></p></main>`;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/, `<!-- seo:head -->\n${head}\n<!-- /seo:head -->`).replace(/<!-- seo:body -->[\s\S]*?<!-- \/seo:body -->/, `<!-- seo:body -->${body}<!-- /seo:body -->`);
  fs.writeFileSync(f, h);
}
fs.mkdirSync(path.join(SITE, 'programlar'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'programlar', 'index.html'), hub());

fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${D}/</loc><lastmod>${today}</lastmod></url>
  <url><loc>${D}/programlar</loc><lastmod>${today}</lastmod></url>
${PRODUCTS.map((p) => `  <url><loc>${D}/${p.slug}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Disallow: /admin/
Disallow: /api/
Sitemap: ${D}/sitemap.xml
`);
console.log(`✓ ${PRODUCTS.length} tanıtım sitesi, sitemap.xml ve robots.txt üretildi (${D})`);
