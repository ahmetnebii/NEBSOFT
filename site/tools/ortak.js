// Statik sayfaların ortak parçaları: üst menü, alt bilgi, tema, stil, kart görselleri. build-sites.js ve build-araclar.js bunu çağırır.
// Üst menü ve alt bilgi market/kabuk.js'ten, logo ve simge core/core.js'ten, renk değişkenleri core/core.css'ten gelir; burada kopya yok.
// Üretilenler: site/assets/site.css (core değişkenleri + market/kabuk.css + site/src/tasarim.css), site/assets/kabuk.js, site/assets/gorsel/**. Elle düzenlenmezler.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..'); const SITE = path.join(ROOT, 'site'); const ASSETS = path.join(SITE, 'assets');
const CFG = require('../src/site.config'); const PRODUCTS = require('../src/products');
const KABUK = require('../../market/kabuk'); const GORSEL = require('./gorsel');
const paket = require('../../server/cloud/paket');
const CORE = fs.readFileSync(path.join(ROOT, 'core', 'core.js'), 'utf8');
const coreCss = fs.readFileSync(path.join(ROOT, 'core', 'core.css'), 'utf8');
const win = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'market', 'catalog.js'), 'utf8'), { window: win });
const CAT = win.CATALOG;

const al = (re, ne) => { const m = re.exec(CORE); if (!m) throw new Error(`core/core.js içinde ${ne} bulunamadı`); return m[1]; };
const ICONS = vm.runInNewContext(`(${al(/const ICONS = (\{[\s\S]*?\n  \});/, 'ICONS')})`);
const TEMALAR = vm.runInNewContext(`(${al(/const THEMES = (\[[\s\S]*?\n  \]);/, 'THEMES')})`);
const logoMark = vm.runInNewContext(`let logoSeq = 0; const shade = ${al(/const shade = (\(hex, amt\) => \{[\s\S]*?\n  \});/, 'shade')}; (${al(/const logoMark = (\(color = [\s\S]*?\n  \});/, 'logoMark')})`);
const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`.replace('class="ico "', 'class="ico"');

// Tema değişkenleri ve tema menüsü core.css'ten seçilir: @media içindekiler alınmaz (dış katman kuralları değişmeden gelsin)
function coreParca() {
  const duz = coreCss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;/g, '').replace(/@(media|supports)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '').replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const L = [];
  for (const m of duz.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sec = m[1].trim(); const ic = m[2].trim().replace(/\s*\n\s*/g, ' ');
    if (/^:root(\[[^\]]+\])?$/.test(sec) && /--|color-scheme/.test(ic)) L.push(`${sec} { ${ic} }`);
    else if (/^(\.nv-theme|\.nv-tmode|\.ns-menu|\.wm\b|::-webkit-scrollbar)/.test(sec) && !sec.includes('.nv-theming')) L.push(`${sec} { ${ic} }`);
  }
  return L.join('\n');
}
const ozet = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const yazDegisirse = (f, s) => { if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s) fs.writeFileSync(f, s); };
function varliklar() {
  const css = `/* Bu dosya üretilir: node site/tools/build-sites.js. Kaynak: core/core.css (değişkenler), market/kabuk.css (üst menü, alt bilgi), site/src/tasarim.css */\n${coreParca()}\n${fs.readFileSync(path.join(ROOT, 'market', 'kabuk.css'), 'utf8')}\n${fs.readFileSync(path.join(SITE, 'src', 'tasarim.css'), 'utf8')}`;
  yazDegisirse(path.join(ASSETS, 'site.css'), css.replace(/\r\n/g, '\n'));
  const js = fs.readFileSync(path.join(__dirname, 'kabuk-istemci.js'), 'utf8').replace('/*TEMALAR*/[]', JSON.stringify(TEMALAR.map(({ id, label, mode, c, white }) => ({ id, label, mode, c, ...(white ? { white } : {}) })))).replace('/*SIMGE*/{}', JSON.stringify(Object.fromEntries(['sun', 'moon', 'user', 'grid'].map((k) => [k, ICONS[k]]))));
  yazDegisirse(path.join(ASSETS, 'kabuk.js'), js.replace(/\r\n/g, '\n'));
  return { cssV: ozet(css.replace(/\r\n/g, '\n')), jsV: ozet(js.replace(/\r\n/g, '\n')) };
}
const V = varliklar();

// ---------- Görseller ----------
const urun = (id) => CAT.products.find((x) => x.id === id);
const RENK = Object.fromEntries(PRODUCTS.map((x) => [x.id, (urun(x.id) || {}).accent || '#2563eb']));
function rehberListesi() { const d = path.join(SITE, 'src', 'rehber'); if (!fs.existsSync(d)) return []; return fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => { const s = fs.readFileSync(path.join(d, f), 'utf8'); return { slug: f.slice(0, -3), program: (/^program:\s*(\S+)/m.exec(s) || [])[1], title: ((/^title:\s*(.+)$/m.exec(s) || [])[1] || f).trim() }; }).filter((x) => x.program && RENK[x.program]); }
function aracListesi() { const d = path.join(SITE, 'src', 'araclar'); return fs.readdirSync(d).filter((f) => f.endsWith('.js') && !f.startsWith('_')).map((f) => { const a = require(path.join(d, f)); return { slug: a.slug, kategori: a.kategori }; }); }
const ALT = GORSEL.uret({ programlar: PRODUCTS.map((x) => ({ id: x.id, renk: RENK[x.id] })), araclar: aracListesi(), paketler: paket.liste(), rehber: rehberListesi(), renkler: RENK });
// Her görsel <img>: tembel yüklenir, CSS arka planı değildir. onde: ilk ekranda, hemen yüklenir
const svgImg = (tur, ad, altMetin, onde, cls = '') => `<img${cls ? ` class="${cls}"` : ''} src="/site/assets/gorsel/${tur}/${ad}.svg" alt="${String(altMetin || ALT[tur][ad] || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" width="480" height="300" ${onde ? (onde === 'lcp' ? 'fetchpriority="high"' : 'fetchpriority="low"') : 'loading="lazy"'} decoding="async">`.replace('  ', ' ');

// ---------- Üst menü ve alt bilgi ----------
const wm = '<span class="wm"><b>NEB</b><i>SOFT</i></span>';
const logo = () => logoMark('#1f5fd6', 36).replace('class="ns-mark"', 'class="ns-mark lg-k"') + logoMark('#4f46e5', 36).replace('class="ns-mark"', 'class="ns-mark lg-d"') + wm;
const LOGO_UST = logo(); const LOGO_ALT = logo();
const bas = (s) => s.slice(0, 1).toLocaleUpperCase('tr') + s.slice(1);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tel = CFG.phone.replace(/\D/g, '');
const ortak = { h: '/', ana: '/', icon };
const ust = (aktif) => KABUK.ust({ ...ortak, logo: LOGO_UST, aktif, temaIkon: icon('moon'), hesap: KABUK.misafir('/', icon), hesapMobil: KABUK.misafirMobil('/', icon) });
const ALT_HTML = KABUK.alt({ ...ortak, logo: LOGO_ALT, urunler: PRODUCTS.filter((x) => !x.satisDisi).map((x) => [`/${x.slug}`, esc(bas(x.kw))]), tel: esc(CFG.phone), telHref: `tel:+90${tel.replace(/^0/, '')}`, eposta: esc(CFG.email), unvan: esc(CFG.brand) }).replace('<a href="/admin/">Yönetim paneli</a>', ''); // yönetim paneli arama motoruna kapalı, statik sayfadan bağlantı verilmez
const alt = () => ALT_HTML;

// ---------- Sayfa başı ----------
const HTML = '<html lang="tr" data-theme="light" data-palette="kurumsal">';
// Boyanmadan önce: seçilen tema uygulanır, sayfa değişince parlama olmaz (core/core.js ile aynı kural, ana sayfa aynı anahtarları okur)
const TEMA = `<script>(function(){try{var d=document.documentElement,t=localStorage.getItem('nebsoft:theme'),p=localStorage.getItem('nebsoft:palette')||(t?'':'kurumsal');if(t)d.setAttribute('data-theme',t);if(p)d.setAttribute('data-palette',p);else d.removeAttribute('data-palette')}catch(e){}})()</script>`;
const FONT = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Michroma&amp;display=swap';
const kafa = (ekCss = '') => `${TEMA}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/site/assets/site.css?v=${V.cssV}">${ekCss}
<link rel="stylesheet" href="${FONT}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${FONT}"></noscript>
<script src="/site/assets/kabuk.js?v=${V.jsV}" defer></script>`;

// ---------- Kahraman bölüm: ana sayfayla aynı koyu bant ----------
// o: { kirinti (html), rozet, h1, lead, ic (html), gorsel (html), tek }
const kahraman = (o) => `<section class="hero${o.tek ? ' tek' : ''}"><div class="w">
  <div class="hero-m">
    ${o.kirinti ? `<nav class="crumb" aria-label="Konum">${o.kirinti}</nav>` : ''}
    ${o.rozet ? `<span class="hm-pill">${o.rozet}</span>` : ''}
    <h1>${o.h1}</h1>
    ${o.lead ? `<p class="lead">${o.lead}</p>` : ''}
    ${o.ic || ''}
  </div>
  ${o.gorsel ? `<div class="hero-g">${o.gorsel}</div>` : ''}
</div></section>`;
const suzgec = (yer, cipler) => `<div class="sx-bar" data-suz role="search"><label class="sx-search"><span class="gizli">${esc(yer)}</span>${icon('search')}<input type="search" placeholder="${esc(yer)}" autocomplete="off"></label><div class="chips"><button class="chip active" type="button" data-k="hepsi" aria-pressed="true">Tümü</button>${cipler.map(([k, ad]) => `<button class="chip" type="button" data-k="${k}" aria-pressed="false">${esc(ad)}</button>`).join('')}</div></div>`;

module.exports = { ust, alt, HTML, kafa, kahraman, suzgec, svgImg, icon, V, ALT, CAT, esc, bas, RENK };
