// Herkese açık statik sayfaları üretir: node site/tools/build-sites.js
// Kaynak: site/src/products.js + market/catalog.js + site/src/site.config.js + site/src/yasal/*.md + site/src/rehber/*.md
// Çıktı: site/<slug>/index.html, site/{programlar,fiyatlar,kvkk,gizlilik,mesafeli-satis,iade,cerez,kayit,rehber}/, site/sitemap.xml, robots.txt, index.html (SEO blokları)
// Testler için: SITE_OUT (çıktı klasörü) ve SITE_MD (yasal/ ve rehber/ klasörlerinin üstü). Kural özeti: docs/SEO-KURALLARI.md
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const crypto = require('crypto');
const { md, onBilgi } = require('./markdown');
const ROOT = path.join(__dirname, '..', '..');
const OUT = process.env.SITE_OUT ? path.resolve(process.env.SITE_OUT) : ROOT;
const SITE = path.join(OUT, 'site'); const SITE_SRC = path.join(ROOT, 'site');
const MD_DIR = process.env.SITE_MD ? path.resolve(process.env.SITE_MD) : path.join(SITE_SRC, 'src');
const LASTMOD = path.join(SITE_SRC, 'src', 'lastmod.json');
const CFG = require('../src/site.config');
const PRODUCTS = require('../src/products');
const win = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'market', 'catalog.js'), 'utf8'), { window: win });
const CAT = win.CATALOG;
const BUNDLE_FIYAT = JSON.parse((/const BUNDLE = \{[^\n]*?prices: (\[[\d, ]+\])/.exec(fs.readFileSync(path.join(ROOT, 'market', 'market.js'), 'utf8')) || [])[1] || '[]'); // tek kaynak: market.js

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tl = (n) => new Intl.NumberFormat('tr-TR').format(n);
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const D = CFG.domain.replace(/\/$/, '');
const tel = CFG.phone.replace(/\D/g, '');
const telHref = `tel:+90${tel.replace(/^0/, '')}`;
const bas = (s) => s.slice(0, 1).toLocaleUpperCase('tr') + s.slice(1); // ilk harf büyük (Türkçe i/İ doğru)
const cssV = crypto.createHash('sha1').update(fs.readFileSync(path.join(SITE_SRC, 'assets', 'site.css'))).digest('hex').slice(0, 10);
const FONT = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Michroma&amp;display=swap';
const I = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
// Küçük kopya varsa (site/tools/kucult.js üretir) telefonda ve kartlarda o kullanılır
const kucuk = (src) => src.replace(/\.jpg$/, '-640.jpg');
const kucukVar = (src) => fs.existsSync(path.join(SITE_SRC, kucuk(src)));
const SIZES = '(max-width: 960px) 46vw, 620px'; // telefonda bilerek düşük: 2x ekran da 640 px kopyayı seçsin (ilk ekranda tam boyut 4 kat veri taşır)
const srcset = (src) => (kucukVar(src) ? ` srcset="${kucuk(src)} 640w, ${src} 1440w" sizes="${SIZES}"` : '');
const img = (src, alt, w, h, eager) => `<img src="${src}"${w === 1440 ? srcset(src) : ''} alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const browser = (src, alt, url, eager) => `<div class="browser"><div class="bar"><i></i><i></i><i></i><b>${esc(url)}</b></div>${img(src, alt, 1440, 900, eager)}</div>`;
const phone = (src, alt) => `<div class="phone">${img(src, alt, 780, 1688)}</div>`;

// Ana siteyle aynı üst menü ve alt bilgi (tüm statik sayfalar)
const SITEHEAD = (sub, extra = '') => `<header class="hd mk"><div class="w">
  <a class="logo" href="/" aria-label="${CFG.brand} ana sayfa"><img src="/assets/icons/icon-64.png" alt="" width="36" height="36"><span class="wm"><b>NEB</b><i>SOFT</i></span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</a>
  <nav class="nav" aria-label="Ana menü"><a href="/programlar">Programlar</a><a href="/fiyatlar/">Fiyatlar</a><a href="/rehber/">Rehber</a><a href="/#/sektorler">Sektörler</a><a href="/#/indir">Masaüstü &amp; Mobil</a><a href="/#/iletisim">İletişim</a></nav>
  <a class="btn g" href="/#/giris">Giriş yap</a><a class="btn p" href="/#/kayit">Ücretsiz başla ${I.arrow}</a>
</div>${extra ? `<div class="subnav"><div class="w">${extra}</div></div>` : ''}</header>`;
const SITEFOOT = () => `<footer class="ft"><div class="w">
  <div class="cols">
    <div><a class="logo" href="/"><img src="/assets/icons/icon-64.png" alt="" width="34" height="34"><span class="wm"><b>NEB</b><i>SOFT</i></span></a><p>Türkiye'deki işletmeler için bulut tabanlı yazılımlar ve pazaryeri entegrasyonları. Kurulum yok, taahhüt yok.</p><p><a href="${telHref}">${esc(CFG.phone)}</a><a href="mailto:${CFG.email}">${esc(CFG.email)}</a></p></div>
    ${[0, 1, 2].map((k) => `<div><h4>${['<a href="/programlar" style="color:inherit">Programlar</a>', '&nbsp;', '&nbsp;'][k]}</h4>${PRODUCTS.filter((_, i) => i % 3 === k).map((x) => `<a href="/${x.slug}">${esc(bas(x.kw))}</a>`).join('')}</div>`).join('')}
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${CFG.brand}. Tüm hakları saklıdır. ${[['/fiyatlar/', 'Fiyatlar'], ['/rehber/', 'Rehber'], ['/kvkk/', 'KVKK'], ['/gizlilik/', 'Gizlilik'], ['/mesafeli-satis/', 'Mesafeli satış'], ['/iade/', 'İptal ve iade'], ['/cerez/', 'Çerez politikası'], ['/#/indir', 'Masaüstü sürümünü indir']].map(([u, t]) => `· <a href="${u}" style="display:inline">${t}</a>`).join(' ')}</div>
</div></footer>`;

// ---------- Ortak sayfa başı ve şemalar ----------
const ORG = { '@context': 'https://schema.org', '@type': 'Organization', '@id': D + '/#kurulus', name: CFG.brand, url: D + '/', logo: D + '/assets/nebsoft-logo.webp', email: CFG.email, contactPoint: { '@type': 'ContactPoint', telephone: '+90' + tel.replace(/^0/, ''), contactType: 'sales', areaServed: 'TR', availableLanguage: 'Turkish' } };
const WEBSITE = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': D + '/#site', name: CFG.brand, url: D + '/', inLanguage: 'tr-TR', publisher: { '@id': D + '/#kurulus' } };
const KIRINTI = (L) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: L.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item ? { item } : {}) })) });
const SSS = (L) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: L.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const HEAD = ({ title, desc, url, image = `${D}/assets/og/og.png`, ogType = 'website', theme = '#1d7bf5', schema = [], preload = '', style = '', ek = '' }) => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<!--robots-->${ek}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${theme}">
<meta property="og:type" content="${ogType}"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}">
<link rel="icon" href="/assets/icons/icon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${preload}<link rel="stylesheet" href="/site/assets/site.css?v=${cssV}">
<link rel="stylesheet" href="${FONT}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${FONT}"></noscript>
<style>:root{--c:${theme}}${style}</style>
${[ORG, WEBSITE, ...schema].map(ld).join('\n')}
</head>`;
const faqHtml = (L, baslik, alt = true) => (L.length ? `<section class="s${alt ? ' alt' : ''}" id="sss"><div class="w">
  <div class="sh"><span class="eyebrow">Sık sorulan sorular</span><h2>${esc(baslik)}</h2></div>
  <div class="faq">${L.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div></section>` : '');

// ---------- Markdown kaynakları (dosya yoksa da derleme çalışır) ----------
const mdOku = (f) => { try { return onBilgi(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const TARIH = /^\d{4}-\d{2}-\d{2}$/;
// Yeni satışa kapalı program liste ve bağlantılarda görünmez, sayfası noindex kalır
const AKTIF = PRODUCTS.filter((x) => !x.satisDisi);
function rehberleriOku() {
  const dir = path.join(MD_DIR, 'rehber'); if (!fs.existsSync(dir)) return [];
  const L = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const slug = f.slice(0, -3); if (!/^[a-z0-9-]+$/.test(slug)) { console.warn('! rehber dosya adı geçersiz, atlandı:', f); continue; }
    const r = mdOku(path.join(dir, f)); if (!r) continue;
    const prog = PRODUCTS.find((x) => x.id === r.meta.program); if (r.meta.program && !prog) console.warn('! rehber program kimliği bulunamadı:', f, r.meta.program);
    L.push({ slug, title: r.meta.title || slug, desc: r.meta.description || '', prog, keywords: String(r.meta.keywords || '').replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean), updated: TARIH.test(r.meta.updated || '') ? r.meta.updated : '', faq: r.faq.map((x) => [x.s, x.c]), html: md(r.govde) });
  }
  return L.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title, 'tr'));
}
const REHBER = rehberleriOku();
const tarihTr = (s) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(s + 'T00:00:00Z'));

// ---------- Program tanıtım sayfası ----------
function page(p) {
  const c = CAT.products.find((x) => x.id === p.id); const k = p.keywords;
  const url = `${D}/${p.slug}`;
  const base = `/${p.slug}/img/`;
  const host = D.replace(/^https?:\/\//, '');
  const demo = `/apps/${p.id}/index.html?demo=1`;
  const buy = `/#/urun/${p.id}`;
  const rel = AKTIF.filter((x) => x.id !== p.id).map((x) => ({ x, c: CAT.products.find((y) => y.id === x.id) }))
    .sort((a, b) => (b.c.cat === c.cat) - (a.c.cat === c.cat)).slice(0, 4);
  const sector = (CAT.categories.find((y) => y.id === c.cat) || {}).name || '';
  const faq = [...(c.faq || []), ...k.sss]; const rehber = REHBER.filter((r) => r.prog && r.prog.id === p.id);
  const pc1 = base + 'pc-1.jpg';
  const kwTitle = bas(p.kw);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: `${CFG.brand} ${c.name}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Windows, Android', description: p.desc, url, image: `${D}${base}pc-1.jpg`, screenshot: p.shots.map((_, i) => `${D}${base}pc-${i + 1}.jpg`),
      offers: { '@type': 'AggregateOffer', priceCurrency: 'TRY', lowPrice: c.prices[0], highPrice: c.prices[2], offerCount: 3, url: `${url}#fiyat` }, publisher: { '@id': D + '/#kurulus' } },
    KIRINTI([[CFG.brand, D + '/'], ['Programlar', D + '/programlar'], [kwTitle, url]]),
    ...(faq.length ? [SSS(faq)] : []),
  ];
  const preload = `<link rel="preload" as="image" href="${pc1}"${kucukVar(pc1) ? ` imagesrcset="${kucuk(pc1)} 640w, ${pc1} 1440w" imagesizes="${SIZES}"` : ''} fetchpriority="high">\n`;
  return `${HEAD({ title: p.title, desc: p.desc, url, image: `${D}/assets/og/og-${p.id}.png`, theme: c.accent, schema, preload })}
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
${SITEHEAD(c.name, `<b>${esc(c.name)}</b><nav aria-label="Sayfa içi"><a href="#ekranlar">Ekranlar</a><a href="#ozellikler">Özellikler</a><a href="#fiyat">Fiyatlar</a><a href="#sss">SSS</a></nav><a class="btn s sm" href="${demo}">Canlı demo</a>`)}
<main id="ana">
<section class="hero"><div class="w">
  <div>
    <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / <a href="/programlar">${esc(sector)}</a> / ${esc(kwTitle)}</nav>
    <span class="eyebrow" style="margin-top:22px">${esc(kwTitle)}</span>
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <div class="cta"><a class="btn p" href="${buy}">${CFG.trialDays} gün ücretsiz deneyin ${I.arrow}</a><a class="btn" href="${demo}">${I.play} Canlı demoyu aç</a></div>
    <div class="trust"><span>${I.check}Kurulum yok</span><span>${I.check}Kredi kartı gerekmez</span><span>${I.check}Telefon, tablet, bilgisayar</span></div>
  </div>
  <div class="stage">${browser(pc1, `${c.name} programı — ${p.shots[0][1]}`, `${host}/${p.slug}`, true)}${phone(base + 'mobil-1.jpg', `${c.name} programının telefon görünümü`)}</div>
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
  <div class="sh"><span class="eyebrow">Özellikler</span><h2>${esc(k.altBaslik)}</h2><p>${esc(c.desc)} ${esc(k.paragraf)}</p></div>
  <ul class="feat">${c.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  <h3 style="margin-top:46px">Modüller</h3>
  <div class="chips">${c.modules.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
  ${c.sectors ? `<h3 style="margin-top:34px">Kimler için uygun?</h3><div class="chips">${c.sectors.map((m) => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
</div></section>

<section class="s" id="fiyat"><div class="w">
  <div class="sh"><span class="eyebrow">Fiyatlar</span><h2>Şeffaf fiyat, taahhüt yok</h2><p>Fiyatlar aylıktır, KDV hariçtir. Yıllık ödemede 2 ay bedava. Her pakette ${CFG.trialDays} gün ücretsiz deneme.</p></div>
  <div class="prices">${CAT.plans.map((pl, i) => `<div class="price${pl.popular ? ' pop' : ''}">${pl.popular ? '<span class="tag">Önerilen</span>' : ''}<h3>${esc(pl.name)}</h3><div class="amt"><span data-p="${c.id}:${i}">${tl(c.prices[i])}</span> ₺<small> /ay</small></div><p>${esc(pl.desc)} · ${esc(pl.users)}</p><a class="btn${pl.popular ? ' p' : ''}" href="${buy}">Ücretsiz başla</a></div>`).join('')}</div>
  <p class="note">Kurulum ve veri aktarımı ücretsizdir. <a href="/fiyatlar/">Tüm programların fiyatlarını</a> karşılaştırın. Sorunuz mu var? <a href="${telHref}">${esc(CFG.phone)}</a></p>
</div></section>

${faqHtml(faq, `${kwTitle} hakkında merak edilenler`)}

${rehber.length ? `<section class="s"><div class="w"><div class="sh"><span class="eyebrow">Rehber</span><h2>${esc(kwTitle)} seçerken okuyun</h2></div><div class="rel">${rehber.map((r) => `<a href="/rehber/${r.slug}/"><b>${esc(r.title)}</b><span>${esc(r.desc)}</span></a>`).join('')}</div></div></section>` : ''}

<section class="s"><div class="w">
  <div class="final"><div><h2>${esc(c.name)} programını bugün kullanmaya başlayın</h2><p>Kayıt olmadan canlı demoyu açın ya da ${CFG.trialDays} günlük ücretsiz denemeyi başlatın. Kurulumu ve veri aktarımını birlikte yapalım.</p></div>
  <div class="cta" style="margin:0"><a class="btn p" href="${buy}">Ücretsiz dene ${I.arrow}</a><a class="btn" href="${telHref}">${I.phone} ${esc(CFG.phone)}</a></div></div>
  <div class="sh" style="margin:80px 0 24px"><span class="eyebrow">Bunlar da ilginizi çekebilir</span><h2>Diğer ${CFG.brand} programları</h2></div>
  <div class="rel">${rel.map(({ x, c: y }) => `<a href="/${x.slug}"><b>${esc(bas(x.kw))}</b><span>${esc(y.tagline)}</span></a>`).join('')}</div>
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

// ---------- Program merkez sayfası (/programlar) ----------
function hub() {
  const url = `${D}/programlar`; const title = `İşletme Programları — ${CFG.brand} | ${PRODUCTS.length} Bulut Yazılım, Ücretsiz Hesap`;
  const desc = `Market, restoran, kuaför, otel, servis, eczane, emlak ve daha fazlası için ${PRODUCTS.length} bulut işletme programı. Kurulum yok; ücretsiz hesap açın, her programı ${CFG.trialDays} gün ücretsiz deneyin, havale ile ödeyin.`;
  const groups = CAT.categories.map((k) => ({ k, list: AKTIF.map((x) => ({ x, c: CAT.products.find((y) => y.id === x.id) })).filter(({ c }) => c && c.cat === k.id) })).filter((g) => g.list.length);
  const schema = [
    KIRINTI([[CFG.brand, D + '/'], ['Programlar', url]]),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'İşletme programları', itemListElement: AKTIF.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${D}/${x.slug}`, name: (CAT.products.find((y) => y.id === x.id) || {}).name })) },
  ];
  let n = 0; // ilk sıra görünür alanda: tembel yükleme LCP'yi geciktirmesin
  const kart = ({ x, c }) => { const s = `/${x.slug}/img/pc-1.jpg`; const on = n++ < 3; return `<a class="hubcard" href="/${x.slug}" style="--c:${c.accent}"><span class="hubimg"><img src="${kucukVar(s) ? kucuk(s) : s}" alt="${esc(c.name)} ekranı" width="${kucukVar(s) ? 640 : 1440}" height="${kucukVar(s) ? 400 : 900}" ${on ? (n === 1 ? 'fetchpriority="high"' : '') : 'loading="lazy"'} decoding="async"></span><span class="hubtx"><b>${esc(bas(x.kw))}</b><span>${esc(c.tagline)}</span><em><span data-p="${c.id}:0">${tl(c.prices[0])}</span> ₺/ay'dan · İncele →</em></span></a>`; };
  return `${HEAD({ title, desc, url, schema, style: '.hub h2{margin:56px 0 18px}' })}
<body>
${SITEHEAD('')}
<main id="ana" class="hub">
<section class="s"><div class="w">
  <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / Programlar</nav>
  <h1>İşletmeniz için bulut programlar</h1>
  <p class="lead">${esc(desc)}</p>
  ${groups.map((g) => `<h2>${esc(g.k.name)}</h2><div class="hubgrid">${g.list.map(kart).join('')}</div>`).join('\n  ')}
  <div class="final" style="margin-top:72px"><div><h2>Hangisi size uygun, emin değil misiniz?</h2><p>Bizi arayın; işletmenize uygun programı birlikte seçelim, kurulumu ve veri aktarımını ücretsiz yapalım.</p></div>
  <div class="cta" style="margin:0"><a class="btn p" href="/fiyatlar/">Fiyatları karşılaştır ${I.arrow}</a><a class="btn" href="${telHref}">${I.phone} ${esc(CFG.phone)}</a></div></div>
</div></section>
</main>
${SITEFOOT()}
</body>
</html>
`;
}

// ---------- Metin sayfası iskeleti (yasal metinler, fiyatlar, rehber) ----------
const DOC = ({ title, desc, url, h1, lead = '', kirinti, govde, schema = [], image, ogType, ek = '', sonra = '', genis = false }) => `${HEAD({ title, desc, url, image, ogType, ek, schema: [KIRINTI(kirinti), ...schema] })}
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
${SITEHEAD('')}
<main id="ana">
<section class="s"><div class="w${genis ? '' : ' doc-w'}">
  <nav class="crumb" aria-label="Konum">${kirinti.map(([ad, u], i) => (u && i < kirinti.length - 1 ? `<a href="${u.replace(D, '') || '/'}">${esc(ad)}</a>` : esc(ad))).join(' / ')}</nav>
  <h1 class="doc-h1">${esc(h1)}</h1>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
  <div class="doc">${govde}</div>
</div></section>
${sonra}
</main>
${SITEFOOT()}
</body>
</html>
`;

// ---------- Yasal metinler ----------
// Kaynak site/src/yasal/<ad>.md. Dosya yoksa aşağıdaki geçici metin kullanılır (pazar yerinden taşındı); kısa olduğu için kalite kontrolü sayfayı noindex yapar.
const SIRKET = `${CFG.brand} Yazılım`;
const SABLON_NOTU = '<p class="note">Bu metin örnek şablondur; yayına almadan önce hukuk danışmanınıza kontrol ettiriniz.</p>';
const YASAL = [
  { ad: 'kvkk', dosya: ['kvkk'], baslik: 'KVKK Aydınlatma Metni', desc: `${CFG.brand} kişisel verilerin işlenmesine ilişkin aydınlatma metni: işlenen veriler, işleme amaçları ve 6698 sayılı Kanun kapsamındaki haklarınız.`,
    yedek: `<p>${SIRKET} ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlarla işlemekteyiz.</p><h2>İşlenen veriler</h2><p>Kimlik, iletişim, fatura ve işlem güvenliği verileri.</p><h2>Amaçlar</h2><p>Sözleşmenin kurulması ve ifası, faturalandırma, destek hizmetleri, yasal yükümlülüklerin yerine getirilmesi.</p><h2>Haklarınız</h2><p>KVKK m.11 kapsamındaki taleplerinizi ${esc(CFG.email)} adresine iletebilirsiniz.</p>` },
  { ad: 'gizlilik', dosya: ['gizlilik'], baslik: 'Gizlilik Politikası', desc: `${CFG.brand} gizlilik politikası: programlara girdiğiniz işletme verilerinin nasıl saklandığı ve kimlerle paylaşılmadığı.`,
    yedek: '<p>Uygulamalara girdiğiniz işletme verileri yalnızca size aittir; üçüncü kişilerle paylaşılmaz, reklam amacıyla kullanılmaz. </p>' },
  { ad: 'mesafeli-satis', dosya: ['mesafeli-satis', 'sozlesme'], baslik: 'Mesafeli Satış Sözleşmesi', desc: `${CFG.brand} yazılım aboneliği mesafeli satış sözleşmesi: sözleşmenin konusu, taraflar ve hizmetin elektronik ortamda ifası.`,
    yedek: `<p>İşbu sözleşme, ${SIRKET} ile web sitesi üzerinden abonelik satın alan alıcı arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca düzenlenmiştir.</p><h2>Konu</h2><p>Alıcının elektronik ortamda siparişini verdiği yazılım aboneliğinin satışı ve ifasıdır.</p><h2>İfa</h2><p>Lisans anahtarı ödeme onayının ardından elektronik ortamda derhal teslim edilir.</p>` },
  { ad: 'iade', dosya: ['iade'], baslik: 'İptal ve İade Koşulları', desc: `${CFG.brand} abonelik iptal ve iade koşulları: aylık ve yıllık aboneliklerde iptal ve iade nasıl yapılır.`,
    yedek: '<p>Yeni aboneliklerde ilk 14 gün içinde koşulsuz iade hakkınız vardır. Aylık aboneliklerinizi dilediğiniz zaman iptal edebilirsiniz; iptal, mevcut dönemin sonunda geçerli olur. Yıllık aboneliklerde kalan aylar için kısmi iade yapılır.</p>' },
  { ad: 'cerez', dosya: ['cerez'], baslik: 'Çerez Politikası', desc: `${CFG.brand} çerez politikası: sitede hangi çerezlerin ve tarayıcı depolamasının kullanıldığı, ne işe yaradığı.`,
    yedek: '<p>Bu sitede reklam veya ziyaretçi analizi çerezi kullanılmaz. Hesabınıza giriş yaptığınızda oturumunuzu sürdürmek için zorunlu bir oturum çerezi kullanılır. Sepetiniz ve tercihleriniz tarayıcınızda yerel olarak tutulur. Sayfalardaki yazı tipleri Google Fonts üzerinden yüklenir; bu sırada tarayıcınızın IP adresi Google\'a iletilir.</p>' },
];
function yasalSayfa(y) {
  // Avukat onayı ve şirket bilgisi gelmeden taslak yayına çıkmaz: TASLAK notu veya [...] yer tutucusu olan dosya kullanılmaz
  const r = y.dosya.map((f) => mdOku(path.join(MD_DIR, 'yasal', f + '.md'))).find((x) => x && !/\*\*TASLAK|\[\.\.\.\]/.test(x.govde));
  const url = `${D}/${y.ad}/`; const title = (r && r.meta.title) || y.baslik; const desc = (r && r.meta.description) || y.desc;
  const updated = r && TARIH.test(r.meta.updated || '') ? r.meta.updated : '';
  const govde = r ? `${md(r.govde)}${updated ? `<p class="note">Son güncelleme: ${tarihTr(updated)}</p>` : ''}` : y.yedek + SABLON_NOTU;
  return { updated, html: DOC({ title: `${title} — ${CFG.brand}`, desc, url, h1: title, kirinti: [[CFG.brand, D + '/'], [title, url]], govde, schema: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, url, inLanguage: 'tr-TR', isPartOf: { '@id': D + '/#site' } }] }) };
}

// ---------- Fiyatlar ----------
function fiyatlar() {
  const url = `${D}/fiyatlar/`; const title = `Fiyatlar — ${CFG.brand} İşletme Programları Aylık Ücretleri`;
  const desc = `${PRODUCTS.length} NEBSOFT programının Başlangıç, Profesyonel ve Kurumsal aylık fiyatları. KDV hariç, taahhüt yok, her programda ${CFG.trialDays} gün ücretsiz deneme.`;
  const sor = ['Kurulum gerekiyor mu?', 'Ücretsiz deneme var mı?', 'Birden fazla ürünü birlikte kullanabilir miyim?', 'İptal edebilir miyim?'];
  const faq = [...CAT.faq.filter(([q]) => sor.includes(q)), ['Ödemeyi nasıl yaparım?', 'Sipariş verdikten sonra havale veya EFT ile ödersiniz. Ödemeniz onaylanınca lisansınız açılır veya uzar.']];
  const gr = CAT.categories.map((k) => ({ k, L: AKTIF.map((x) => ({ x, c: CAT.products.find((y) => y.id === x.id) })).filter(({ c }) => c && c.cat === k.id) })).filter((g) => g.L.length);
  const hucre = (id, i, n) => `<td class="r"><span data-p="${id}:${i}">${tl(n)}</span> ₺</td>`;
  const govde = `
  <div class="prices">${CAT.plans.map((pl) => `<div class="price${pl.popular ? ' pop' : ''}">${pl.popular ? '<span class="tag">Önerilen paket</span>' : ''}<h3>${esc(pl.name)}</h3><p>${esc(pl.desc)}</p><p><b>${esc(pl.users)}</b></p></div>`).join('')}</div>
  ${BUNDLE_FIYAT.length === 3 ? `<h2>Hepsi Bir Arada</h2><p>Tüm NEBSOFT programları ve sonradan eklenenler tek abonelikte: ${CAT.plans.map((pl, i) => `${esc(pl.name)} <b><span data-p="bundle:${i}">${tl(BUNDLE_FIYAT[i])}</span> ₺/ay</b>`).join(', ')}. <a href="/#/fiyatlar">Paketi sepete ekleyin</a>.</p>` : ''}
  <h2>Programlara göre aylık fiyatlar</h2>
  <div class="tablo"><table><thead><tr><th>Program</th>${CAT.plans.map((pl) => `<th class="r">${esc(pl.name)}</th>`).join('')}</tr></thead>
  ${gr.map((g) => `<tbody><tr class="grup"><th colspan="${CAT.plans.length + 1}">${esc(g.k.name)}</th></tr>${g.L.map(({ x, c }) => `<tr><td><a href="/${x.slug}">${esc(bas(x.kw))}</a></td>${c.prices.map((n, i) => hucre(c.id, i, n)).join('')}</tr>`).join('')}</tbody>`).join('\n  ')}</table></div>
  <p class="note">Fiyatlar aylıktır, KDV hariçtir. Yıllık ödemede 2 ay bedava. Hesap açmak ücretsizdir; her programı ${CFG.trialDays} gün ücretsiz deneyebilirsiniz. <a href="/#/kayit">Ücretsiz hesap açın</a>.</p>`;
  return DOC({ title, desc, url, h1: 'Fiyatlar: şeffaf aylık ücretler', lead: desc, genis: true, kirinti: [[CFG.brand, D + '/'], ['Fiyatlar', url]], govde, schema: [SSS(faq)], sonra: faqHtml(faq, 'Fiyatlar hakkında merak edilenler') });
}

// ---------- Rehber ----------
function rehberDizin() {
  const url = `${D}/rehber/`; const title = `Rehber — İşletmeler İçin Program Seçme Yazıları | ${CFG.brand}`;
  const desc = `İşletmenize uygun programı seçmek, süreçleri düzene koymak ve yasal yükümlülükleri takip etmek için ${CFG.brand} rehber yazıları.`;
  const govde = REHBER.length ? `<div class="rel rehber-l">${REHBER.map((r) => `<a href="/rehber/${r.slug}/"><b>${esc(r.title)}</b><span>${esc(r.desc)}</span>${r.updated ? `<small>${tarihTr(r.updated)}</small>` : ''}</a>`).join('')}</div>` : `<p>Rehber yazıları hazırlanıyor. Bu sırada <a href="/programlar">programları inceleyebilirsiniz</a>.</p>`;
  return DOC({ title, desc, url, h1: 'İşletmeler için rehber', lead: desc, genis: true, kirinti: [[CFG.brand, D + '/'], ['Rehber', url]], govde, schema: REHBER.length ? [{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Rehber yazıları', itemListElement: REHBER.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: `${D}/rehber/${r.slug}/`, name: r.title })) }] : [] });
}
function rehberSayfa(r) {
  const url = `${D}/rehber/${r.slug}/`; const p = r.prog; const c = p && CAT.products.find((x) => x.id === p.id);
  const image = p ? `${D}/assets/og/og-${p.id}.png` : `${D}/assets/og/og.png`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: r.title, description: r.desc, url, mainEntityOfPage: url, image, inLanguage: 'tr-TR', ...(r.updated ? { datePublished: r.updated, dateModified: r.updated } : {}), ...(r.keywords.length ? { keywords: r.keywords.join(', ') } : {}), author: { '@id': D + '/#kurulus' }, publisher: { '@id': D + '/#kurulus' } },
    ...(r.faq.length ? [SSS(r.faq)] : []),
  ];
  const diger = REHBER.filter((x) => x !== r && p && x.prog === p).slice(0, 4);
  const sonra = `${faqHtml(r.faq, 'Sık sorulan sorular', false)}
${p ? `<section class="s alt"><div class="w"><div class="final"><div><h2>${esc(bas(p.kw))} arıyorsanız</h2><p>${esc(c.tagline)}. Kayıt olmadan canlı demoyu açın ya da ${CFG.trialDays} gün ücretsiz deneyin.</p></div><div class="cta" style="margin:0"><a class="btn p" href="/${p.slug}">${esc(bas(p.kw))} ${I.arrow}</a></div></div>${diger.length ? `<div class="sh" style="margin:60px 0 20px"><h2>İlgili yazılar</h2></div><div class="rel">${diger.map((x) => `<a href="/rehber/${x.slug}/"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></a>`).join('')}</div>` : ''}</div></section>` : ''}`;
  return DOC({ title: `${r.title} | ${CFG.brand}`, desc: r.desc, url, image, ogType: 'article', h1: r.title, kirinti: [[CFG.brand, D + '/'], ['Rehber', `${D}/rehber/`], [r.title, url]], govde: `${r.updated ? `<p class="note">Güncelleme: <time datetime="${r.updated}">${tarihTr(r.updated)}</time></p>` : ''}${r.html}`, schema, sonra });
}

// ---------- Kayıt yönlendirmesi (/kayit/) ----------
const kayitSayfa = () => DOC({ title: `Ücretsiz Hesap Açın — ${CFG.brand}`, desc: `${CFG.brand} ücretsiz hesap açma sayfası. Hesap açmak ücretsizdir, her programı ${CFG.trialDays} gün ücretsiz deneyebilirsiniz.`, url: `${D}/kayit/`, h1: 'Ücretsiz hesap açın', ek: '\n<meta http-equiv="refresh" content="0;url=/#/kayit">', kirinti: [[CFG.brand, D + '/'], ['Ücretsiz hesap', `${D}/kayit/`]], govde: `<p>Kayıt ekranına yönlendiriliyorsunuz. Sayfa açılmazsa <a href="/#/kayit">buraya tıklayın</a>.</p>` });

// ---------- Yazım, kalite kontrolü ve son değişiklik tarihi ----------
const MIN_KELIME = { rehber: 200, diger: 120 };
const today = new Date().toISOString().slice(0, 10);
let LM = {}; try { LM = JSON.parse(fs.readFileSync(LASTMOD, 'utf8')); } catch (e) { /* ilk derleme */ }
const anaMetin = (html) => ((/<main[\s\S]*?<\/main>/.exec(html) || [''])[0]).replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
function kalite(html, tur) {
  const sorun = []; const kelime = anaMetin(html).split(/\s+/).filter(Boolean).length; const min = MIN_KELIME[tur] || MIN_KELIME.diger;
  if (kelime < min) sorun.push(`içerik zayıf (${kelime}/${min} kelime)`);
  if (!/<title>[^<]{5,}<\/title>/.test(html)) sorun.push('başlık yok');
  if (!/<meta name="description" content="[^"]{20,}">/.test(html)) sorun.push('açıklama yok');
  if (!/<h1[ >]/.test(html)) sorun.push('h1 yok');
  return sorun;
}
// lastmod yalnızca sayfanın anlamlı içeriği değişince güncellenir (Google, tutarlı doğru lastmod ister; alt bilgi ve yıl değişikliği sayılmaz)
function sonDegisim(yol, html, ozel) {
  const ozet = crypto.createHash('sha1').update(((/<title>[\s\S]*?<\/title>/.exec(html) || [''])[0]) + ((/<meta name="description"[^>]*>/.exec(html) || [''])[0]) + ((/<main[\s\S]*?<\/main>/.exec(html) || [''])[0])).digest('hex').slice(0, 16);
  const k = LM[yol]; const d = ozel || (k && k.h === ozet ? k.d : today); LM[yol] = { h: ozet, d }; return d;
}
const HARITA = []; const uyari = [];
function yaz(yol, rel, html, { tur, noindex, updated } = {}) {
  const sorun = noindex ? [] : kalite(html, tur);
  const kapali = noindex || sorun.length > 0;
  if (sorun.length) uyari.push(`${yol}: ${sorun.join(', ')} → noindex`);
  const son = html.replace('<!--robots-->', kapali ? '<meta name="robots" content="noindex,follow">' : '').replace(/\n\n<link rel="canonical"/, '\n<link rel="canonical"');
  fs.mkdirSync(path.join(SITE, rel), { recursive: true }); fs.writeFileSync(path.join(SITE, rel, 'index.html'), son);
  if (!kapali) HARITA.push({ yol, lastmod: sonDegisim(yol, son, updated) }); else delete LM[yol];
}

for (const p of PRODUCTS) {
  const missing = ['pc-1.jpg', 'mobil-1.jpg'].filter((f) => !fs.existsSync(path.join(SITE_SRC, p.slug, 'img', f)));
  if (missing.length) console.warn('! görsel eksik', p.slug, missing.join(', '), '→ node site/tools/screens.js', p.id);
  yaz(`/${p.slug}`, p.slug, p.satisDisi ? page(p).replace('<main id="ana">', '<main id="ana"><p class="note" style="max-width:900px;margin:16px auto;padding:12px 16px"><b>Bu program şu an yeni satışa kapalı.</b> Mevcut kullanıcılar kullanmaya devam eder. Resmî sistem bağlantıları olmadığı için ana eczane yazılımı yerine geçmez.</p>') : page(p), { noindex: !!p.satisDisi });
}
yaz('/programlar', 'programlar', hub());
yaz('/fiyatlar/', 'fiyatlar', fiyatlar());
for (const y of YASAL) { const r = yasalSayfa(y); yaz(`/${y.ad}/`, y.ad, r.html, { updated: r.updated }); }
yaz('/kayit/', 'kayit', kayitSayfa(), { noindex: true });
// Silinen rehber dosyalarının eski çıktısı kalmasın
const rehberCikti = path.join(SITE, 'rehber');
if (fs.existsSync(rehberCikti)) for (const d of fs.readdirSync(rehberCikti)) if (fs.statSync(path.join(rehberCikti, d)).isDirectory() && !REHBER.some((r) => r.slug === d)) { fs.rmSync(path.join(rehberCikti, d), { recursive: true }); delete LM[`/rehber/${d}/`]; }
yaz('/rehber/', 'rehber', rehberDizin());
for (const r of REHBER) yaz(`/rehber/${r.slug}/`, path.join('rehber', r.slug), rehberSayfa(r), { tur: 'rehber', updated: r.updated });

// Pazar ana sayfası: arama motorları için sabit başlık, şema ve program bağlantıları (sayfa betiği açılınca kendi arayüzünü çizer)
{
  const f = path.join(ROOT, 'index.html'); let h = fs.readFileSync(f, 'utf8');
  const title = `${CFG.brand} — İşletme Yazılımları | Ücretsiz Hesap Açın`;
  const desc = `Market POS, restoran adisyon, randevu, otel, teknik servis, eczane, emlak ve ${PRODUCTS.length} bulut işletme programı. Kurulum yok; ücretsiz hesap açın, her programı ${CFG.trialDays} gün ücretsiz deneyin.`;
  const head = `<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${D}/"><meta property="og:image" content="${D}/assets/og/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${D}/assets/og/og.png">
${ld(ORG)}
${ld(WEBSITE)}`;
  const body = `<main class="seo-static" style="max-width:900px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif"><h1>${esc(title)}</h1><p>${esc(desc)}</p><ul>${PRODUCTS.map((x) => `<li><a href="/${x.slug}">${esc(bas(x.kw))}</a></li>`).join('')}</ul><p><a href="/programlar">Tüm programlar</a> · <a href="/fiyatlar/">Fiyatlar</a> · <a href="/rehber/">Rehber</a> · <a href="/kvkk/">KVKK</a> · <a href="/gizlilik/">Gizlilik</a> · <a href="/mesafeli-satis/">Mesafeli satış</a> · <a href="/iade/">İptal ve iade</a> · <a href="/cerez/">Çerez politikası</a></p></main>`;
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/, () => `<!-- seo:head -->\n${head}\n<!-- /seo:head -->`).replace(/<!-- seo:body -->[\s\S]*?<!-- \/seo:body -->/, () => `<!-- seo:body -->${body}<!-- /seo:body -->`);
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'index.html'), h);
  HARITA.unshift({ yol: '/', lastmod: sonDegisim('/', `<title>${title}</title><meta name="description" content="${desc}"><main>${body}</main>`) });
}

HARITA.push({ yol: '/kurumsal-teklif', lastmod: '2026-10-30' });
// Ücretsiz araçlar ayrı üretilir (build-araclar.js): yalnızca dizine alınabilir olanlar haritaya yazılır
{ const f = path.join(SITE, 'araclar', 'liste.json'); if (fs.existsSync(f)) { const L = JSON.parse(fs.readFileSync(f, 'utf8')); HARITA.push({ yol: L.dizin, lastmod: L.guncelleme }); L.araclar.filter((x) => x.index).forEach((x) => HARITA.push({ yol: x.yol, lastmod: x.guncelleme })); } }

fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${HARITA.map((x) => `  <url><loc>${D}${x.yol}</loc><lastmod>${x.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);
// Yerinde kopya: asıl robots.txt sunucuda server/cloud/seo.js robots() ile üretilir, ikisi aynı kurallarda tutulur
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /apps/
Allow: /t/
Sitemap: ${D}/sitemap.xml
`);
if (OUT === ROOT) fs.writeFileSync(LASTMOD, JSON.stringify(Object.fromEntries(Object.entries(LM).sort(([a], [b]) => a.localeCompare(b))), null, 0).replace(/\},/g, '},\n') + '\n');
uyari.forEach((x) => console.warn('! ' + x));
console.log(`✓ ${PRODUCTS.length} tanıtım sitesi, ${REHBER.length} rehber, ${HARITA.length} adresli sitemap.xml ve robots.txt üretildi (${D})`);
