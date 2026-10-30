// Ücretsiz araç sayfalarını üretir: node site/tools/build-araclar.js
// Kaynak: site/src/araclar/<slug>.js → site/araclar/<slug>/index.html, site/araclar/index.html, site/araclar/liste.json, site/assets/araclar-hesap.js
// build-sites.js'ten bağımsızdır (onu çağırmaz, sitemap'e dokunmaz). Sitemap'e ekleme liste.json üzerinden yapılır: yalnız index:true olanlar.
// Sunucu: /araclar dizini SITES ile çalışır; araç sayfaları sonda / ile açılır, bu yüzden canonical da /araclar/<slug>/ biçimindedir.
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..'); const SITE = path.join(ROOT, 'site'); const CIKTI = path.join(SITE, 'araclar'); const KAYNAK = path.join(SITE, 'src', 'araclar');
const CFG = require('../src/site.config'); const PRODUCTS = require('../src/products');

const D = CFG.domain.replace(/\/$/, ''); const tel = CFG.phone.replace(/\D/g, '');
const ASG_KELIME = 200;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const KATEGORI = [['kod', 'QR kod ve barkod', 'Kasada, rafta ve masada işe yarayan, hemen yazdırılabilen kodlar'], ['belge', 'Belge şablonları', 'Doldurun, yazdırın veya PDF olarak saklayın'], ['ticaret', 'Ticaret ve kârlılık', 'Satış fiyatınızı ve kârınızı girdiğiniz gerçek rakamlarla görün'], ['vergi', 'KDV ve tevkifat', 'Fatura tutarlarını GİB oranlarıyla ayrıştırın'], ['calisma', 'Personel ve ücret', 'İş Kanunu dayanaklı tazminat, izin ve mesai hesapları'], ['emlak', 'Kira, aidat ve kuyum', 'Kiracı, ev sahibi, site yönetimi ve kuyumcu için hesaplar']];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const trTarih = (s) => { const [y, m, g] = String(s).split('-').map(Number); return `${g} ${AYLAR[m - 1]} ${y}`; };
const I = {
  kilit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

// Ana siteyle aynı üst menü ve alt bilgi
const USTBAR = () => `<header class="hd mk"><div class="w">
  <a class="logo" href="/" aria-label="${CFG.brand} ana sayfa"><img src="/assets/icons/icon-64.png" alt="" width="36" height="36"><span class="wm"><b>NEB</b><i>SOFT</i></span><span class="sub">Ücretsiz Araçlar</span></a>
  <nav class="nav" aria-label="Ana menü"><a href="/#/urunler">Programlar</a><a href="/araclar">Araçlar</a><a href="/#/fiyatlar">Fiyatlar</a><a href="/#/sektorler">Sektörler</a><a href="/#/iletisim">İletişim</a></nav>
  <a class="btn g" href="/#/giris">Giriş yap</a><a class="btn p" href="/#/kayit">Ücretsiz başla ${I.arrow}</a>
</div></header>`;
const ALTBAR = () => `<footer class="ft"><div class="w">
  <div class="cols">
    <div><a class="logo" href="/"><img src="/assets/icons/icon-64.png" alt="" width="34" height="34"><span class="wm"><b>NEB</b><i>SOFT</i></span></a><p>Türkiye'deki işletmeler için bulut tabanlı yazılımlar ve ücretsiz iş araçları.</p><p><a href="tel:+90${tel.replace(/^0/, '')}">${esc(CFG.phone)}</a><a href="mailto:${CFG.email}">${esc(CFG.email)}</a></p></div>
    ${[0, 1, 2].map((k) => `<div><h4>${['<a href="/programlar" style="color:inherit">Programlar</a>', '&nbsp;', '&nbsp;'][k]}</h4>${PRODUCTS.filter((_, i) => i % 9 === k).map((x) => `<a href="/${x.slug}">${esc(x.kw[0].toLocaleUpperCase('tr') + x.kw.slice(1))}</a>`).join('')}</div>`).join('')}
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${CFG.brand}. Tüm hakları saklıdır. · <a href="/araclar" style="display:inline">Ücretsiz araçlar</a> · <a href="/#/yasal/kvkk" style="display:inline">KVKK ve yasal metinler</a></div>
</div></footer>`;

// ---------- Özgün metin ölçümü ----------
const cumleler = (m) => String(m).toLocaleLowerCase('tr').split(/(?<=[.!?:])\s+/).map((x) => x.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
const metinOf = (a) => [...(a.aciklama || []), ...((a.ornek || {}).metin || []), ...(a.sss || []).map((x) => x[1])].join(' ');
// Başka bir araçta da geçen cümleler özgün sayılmaz
function ozgunKelime(a, hepsi = []) {
  const diger = new Set(); hepsi.filter((x) => x.slug !== a.slug).forEach((x) => cumleler(metinOf(x)).forEach((c) => diger.add(c)));
  return cumleler(metinOf(a)).filter((c) => !diger.has(c)).reduce((t, c) => t + c.split(' ').length, 0);
}
// Zayıf açıklama veya kaynaksız mevzuat aracı arama motoruna açılmaz
function indekslenir(a, hepsi = []) {
  if (ozgunKelime(a, hepsi) < ASG_KELIME) return false;
  if (a.mevzuat && !(a.kaynaklar || []).length) return false;
  return true;
}

// ---------- Form ----------
const alanId = (ad) => `a-${ad}`;
function girdi(f, sinif = '') {
  const ort = `data-alan="${esc(f.ad)}" data-tip="${esc(f.tip || 'metin')}"`; const id = sinif ? '' : ` id="${alanId(f.ad)}"`; const yer = f.yer ? ` placeholder="${esc(f.yer)}"` : ''; const deg = f.deger != null ? ` value="${esc(f.deger)}"` : '';
  if (f.tip === 'secim') return `<select${id} ${ort}>${f.secenekler.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(f.deger) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  if (f.tip === 'cokmetin') return `<textarea${id} ${ort}${yer}>${esc(f.deger ?? '')}</textarea>`;
  if (f.tip === 'tarih') return `<input${id} type="date" ${ort}${deg}${f.bugun ? ' data-bugun' : ''}>`;
  if (f.tip === 'onay') return `<input${id} type="checkbox" ${ort}${f.deger ? ' checked' : ''}>`;
  const sayisal = ['para', 'sayi', 'yuzde'].includes(f.tip);
  return `<input${id} type="text" autocomplete="off" ${sayisal ? 'inputmode="decimal" ' : ''}${ort}${deg}${yer}>`;
}
function satirHtml(s, r = {}) {
  const hucre = s.sutunlar.map((c, i) => `<div${i === 0 ? ' class="bir"' : ''}><label>${esc(c.etiket)}${girdi({ ...c, deger: r[c.ad] ?? c.deger }, 'satir')}</label></div>`).join('');
  return `<div class="ar-satir">${hucre}<button type="button" class="ar-sil" data-sil aria-label="Satırı sil">×</button></div>`;
}
function formHtml(a) {
  return (a.alanlar || []).map((f) => {
    const gst = f.goster ? ` data-goster="${esc(f.goster)}"` : ''; const gizli = f.goster ? ' hidden' : '';
    if (f.tip === 'ara') return `<div class="ar-ara"${gst}${gizli}>${esc(f.etiket)}</div>`;
    if (f.tip === 'satirlar') return `<div class="ar-satirlar" data-alan="${esc(f.ad)}" style="--kolon:${f.kolon || `repeat(${f.sutunlar.length}, minmax(0, 1fr))`}"><span class="ar-liste-b">${esc(f.etiket)}</span>${f.ipucu ? `<small style="display:block;color:var(--ink3);font-size:12.5px">${esc(f.ipucu)}</small>` : ''}<div class="ar-liste">${(f.satir || [{}]).map((r) => satirHtml(f, r)).join('')}</div><template>${satirHtml(f)}</template><button type="button" class="ar-ekle" data-ekle>+ ${esc(f.ekle || 'Satır ekle')}</button></div>`;
    if (f.tip === 'onay') return `<div class="ar-alan ar-onay genis"${gst}${gizli}>${girdi(f)}<label for="${alanId(f.ad)}">${esc(f.etiket)}</label></div>`;
    return `<div class="ar-alan${f.genis || f.tip === 'cokmetin' ? ' genis' : ''}"${gst}${gizli}><label for="${alanId(f.ad)}">${esc(f.etiket)}</label>${girdi(f)}${f.ipucu ? `<small>${esc(f.ipucu)}</small>` : ''}</div>`;
  }).join('\n');
}

// ---------- Sayfa ----------
function sayfa(a, hepsi = []) {
  const url = `${D}/araclar/${a.slug}/`; const index = indekslenir(a, hepsi); const p = PRODUCTS.find((x) => x.slug === a.program.slug);
  const rel = (a.ilgili || []).map((s) => hepsi.find((x) => x.slug === s)).filter(Boolean).concat(hepsi.filter((x) => x.kategori === a.kategori && x.slug !== a.slug && !(a.ilgili || []).includes(x.slug))).slice(0, 4);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: a.ad, url, description: a.ozet, inLanguage: 'tr-TR', applicationCategory: a.kategori === 'vergi' || a.kategori === 'calisma' ? 'FinanceApplication' : 'BusinessApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript gerekir', isAccessibleForFree: true, dateModified: a.guncelleme, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' }, publisher: { '@type': 'Organization', name: CFG.brand, url: D + '/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: CFG.brand, item: D + '/' }, { '@type': 'ListItem', position: 2, name: 'Ücretsiz Araçlar', item: D + '/araclar' }, { '@type': 'ListItem', position: 3, name: a.ad, item: url }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.sss.map(([q, c]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: c } })) },
  ];
  const gerekli = (a.alanlar || []).filter((f) => f.gerekli).map((f) => [f.ad, f.etiket]);
  const cfg = `{dosyaAdi:${JSON.stringify(a.slug)},gerekli:${JSON.stringify(gerekli).replace(/</g, '\\u003c')},hesap:${String(a.hesap)}}`;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.baslik)}</title>
<meta name="description" content="${esc(a.ozet)}">
<meta name="robots" content="${index ? 'index,follow' : 'noindex,follow'}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#1d7bf5">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}">
<meta property="og:title" content="${esc(a.baslik)}"><meta property="og:description" content="${esc(a.ozet)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${D}/assets/og/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(a.baslik)}"><meta name="twitter:description" content="${esc(a.ozet)}"><meta name="twitter:image" content="${D}/assets/og/og.png">
<link rel="icon" href="/assets/icons/icon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/site/assets/site.css"><link rel="stylesheet" href="/site/assets/araclar.css">
<style>:root{--c:${a.renk || '#1d7bf5'}}</style>
${schema.map(ld).join('\n')}
</head>
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
${USTBAR()}
<main id="ana">
<div class="w ar-hero">
  <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / <a href="/araclar">Ücretsiz Araçlar</a> / ${esc(a.ad)}</nav>
  <h1>${esc(a.ad)}</h1>
  <p class="lead">${esc(a.ozet)}</p>
  <p class="ar-gizli">${I.kilit}<span>İşlem tarayıcınızda yapılır. Girdiğiniz bilgiler sunucuya gönderilmez ve kaydedilmez.</span></p>
</div>
<div class="w ar-is${a.tek ? ' tek' : ''}">
  <form class="ar-kart ar-form-k" id="ar-form" novalidate><h2>Bilgileri girin</h2><div class="ar-alanlar">
${formHtml(a)}
  </div></form>
  <section class="ar-kart ar-sonuc" aria-live="polite"><h2>${esc(a.sonucBaslik || 'Sonuç')}</h2><div id="sonuc"><p class="ar-bos">Aracın çalışması için tarayıcınızda JavaScript açık olmalı.</p></div></section>
</div>
<section class="ar-metin"><div class="w"><div class="ar-yazi">
  <h2>${esc(a.aciklamaBaslik || `${a.ad} nedir, ne işe yarar?`)}</h2>
  ${a.aciklama.map((x) => `<p>${esc(x)}</p>`).join('\n  ')}
  <h2>${esc(a.ornek.baslik)}</h2>
  ${a.ornek.metin.map((x) => `<p>${esc(x)}</p>`).join('\n  ')}
  <h2>Kaynaklar ve son güncelleme</h2>
  <p><b>Son güncelleme:</b> <time datetime="${a.guncelleme}">${trTarih(a.guncelleme)}</time>. ${a.kaynaklar && a.kaynaklar.length ? 'Oranlar ve kurallar aşağıdaki kaynaklardan okunmuştur.' : 'Bu araç mevzuat oranı kullanmaz; hesap girdiğiniz değerlerle yapılır.'}</p>
  ${a.kaynaklar && a.kaynaklar.length ? `<ul class="ar-kaynak">${a.kaynaklar.map((k) => `<li><b>${esc(k.ad)}</b>${k.not ? ` — ${esc(k.not)}` : ''}<br><a href="${esc(k.url)}" rel="noopener nofollow" target="_blank">${esc(k.url)}</a><br><small>Okunma tarihi: ${esc(trTarih(k.tarih))}</small></li>`).join('')}</ul>` : ''}
  ${a.uyari ? `<p class="ar-not">${esc(a.uyari)}</p>` : ''}
  <div class="ar-prog"><p>${esc(a.program.metin)}</p><a class="btn p" href="/${a.program.slug}">${esc((p ? p.kw[0].toLocaleUpperCase('tr') + p.kw.slice(1) : a.program.slug))} ${I.arrow}</a></div>
  <h2>Sık sorulan sorular</h2>
  <div class="faq">${a.sss.map(([q, c], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(c)}</p></details>`).join('')}</div>
</div>
${rel.length ? `<h2 class="ar-grup">İlgili araçlar</h2><div class="ar-kartlar">${rel.map((x) => `<a href="/araclar/${x.slug}/"><b>${esc(x.ad)}</b><span>${esc(x.kisa)}</span></a>`).join('')}</div>` : ''}
</div></section>
</main>
${ALTBAR()}
${a.qr ? '<script src="/site/assets/vendor/qrcode-generator-1.4.4/qrcode.js"></script>\n' : ''}<script src="/site/assets/araclar-hesap.js"></script>
<script src="/site/assets/araclar.js"></script>
<script>AR.baslat(${cfg});</script>
</body>
</html>
`;
}

function dizin(hepsi) {
  const url = `${D}/araclar`; const title = `Ücretsiz İşletme Araçları — QR Menü, Barkod, Teklif, KDV ve Kıdem Hesaplama | ${CFG.brand}`;
  const desc = `QR menü, barkod, etiket ve belge şablonları ile KDV, tevkifat, kıdem, fazla mesai, kira artışı, aidat ve komisyon hesapları: ${hepsi.length} ücretsiz araç. Üyelik yok, veriler tarayıcıdan çıkmaz.`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: CFG.brand, item: D + '/' }, { '@type': 'ListItem', position: 2, name: 'Ücretsiz Araçlar', item: url }] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Ücretsiz işletme araçları', itemListElement: hepsi.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `${D}/araclar/${x.slug}/`, name: x.ad })) },
  ];
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${CFG.brand}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${D}/assets/og/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${D}/assets/og/og.png">
<link rel="icon" href="/assets/icons/icon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/site/assets/site.css"><link rel="stylesheet" href="/site/assets/araclar.css">
<style>:root{--c:#1d7bf5}</style>
${schema.map(ld).join('\n')}
</head>
<body>
<a class="skip" href="#ana">İçeriğe geç</a>
${USTBAR()}
<main id="ana"><div class="w ar-hero">
  <nav class="crumb" aria-label="Konum"><a href="/">${CFG.brand}</a> / Ücretsiz Araçlar</nav>
  <h1>İşletmeler için ücretsiz araçlar</h1>
  <p class="lead">${esc(desc)}</p>
  <p class="ar-gizli">${I.kilit}<span>Tüm hesaplar tarayıcınızda çalışır. Oran gerektiren araçlarda resmî kaynak, adres ve son güncelleme tarihi sayfanın içinde yazılıdır.</span></p>
  ${KATEGORI.map(([k, ad, alt]) => { const l = hepsi.filter((x) => x.kategori === k); return l.length ? `<h2 class="ar-grup">${esc(ad)}</h2><p style="color:var(--ink2);margin:-8px 0 14px">${esc(alt)}</p><div class="ar-kartlar">${l.map((x) => `<a href="/araclar/${x.slug}/"><b>${esc(x.ad)}</b><span>${esc(x.kisa)}</span></a>`).join('')}</div>` : ''; }).join('\n  ')}
</div></main>
${ALTBAR()}
</body>
</html>
`;
}

function dogrula(a) {
  const eksik = ['slug', 'kategori', 'ad', 'kisa', 'baslik', 'ozet', 'guncelleme', 'program', 'aciklama', 'ornek', 'sss', 'hesap'].filter((k) => !a[k]);
  if (eksik.length) throw new Error(`${a.slug || '?'}: eksik alan ${eksik.join(', ')}`);
  if (!KATEGORI.some(([k]) => k === a.kategori)) throw new Error(`${a.slug}: bilinmeyen kategori ${a.kategori}`);
  if (!PRODUCTS.some((p) => p.slug === a.program.slug)) throw new Error(`${a.slug}: bilinmeyen program ${a.program.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.guncelleme)) throw new Error(`${a.slug}: guncelleme YYYY-AA-GG olmalı`);
  (a.kaynaklar || []).forEach((k) => { if (!k.ad || !/^https:\/\//.test(k.url) || !/^\d{4}-\d{2}-\d{2}$/.test(k.tarih)) throw new Error(`${a.slug}: kaynak eksik (ad, url, tarih)`); });
  new Function(`return (${String(a.hesap)})`); // sayfaya gömülecek hesap kodu sözdizimi
}
function yukle() { return fs.readdirSync(KAYNAK).filter((f) => f.endsWith('.js') && !f.startsWith('_')).sort().map((f) => { const a = require(path.join(KAYNAK, f)); if (a.slug !== f.replace(/\.js$/, '')) throw new Error(`${f}: slug dosya adıyla aynı olmalı`); dogrula(a); return a; }); }

function uret() {
  const hepsi = yukle(); const SIRA = KATEGORI.map(([k]) => k); hepsi.sort((a, b) => SIRA.indexOf(a.kategori) - SIRA.indexOf(b.kategori) || (a.sira || 50) - (b.sira || 50));
  fs.mkdirSync(CIKTI, { recursive: true });
  // Tanımı silinen aracın eski sayfası kalmasın
  fs.readdirSync(CIKTI, { withFileTypes: true }).filter((d) => d.isDirectory() && !hepsi.some((a) => a.slug === d.name)).forEach((d) => fs.rmSync(path.join(CIKTI, d.name), { recursive: true }));
  const liste = hepsi.map((a) => {
    const dir = path.join(CIKTI, a.slug); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), sayfa(a, hepsi));
    const kelime = ozgunKelime(a, hepsi); const index = indekslenir(a, hepsi); if (!index) console.warn(`! noindex: ${a.slug} (${kelime} özgün kelime)`);
    return { slug: a.slug, yol: `/araclar/${a.slug}/`, ad: a.ad, baslik: a.baslik, ozet: a.ozet, kategori: a.kategori, program: a.program.slug, guncelleme: a.guncelleme, kelime, index };
  });
  fs.writeFileSync(path.join(CIKTI, 'index.html'), dizin(hepsi));
  fs.writeFileSync(path.join(CIKTI, 'liste.json'), JSON.stringify({ guncelleme: hepsi.map((a) => a.guncelleme).sort().pop(), dizin: '/araclar', araclar: liste }, null, 2) + '\n');
  fs.copyFileSync(path.join(__dirname, 'araclar', 'hesap.js'), path.join(SITE, 'assets', 'araclar-hesap.js'));
  console.log(`✓ ${liste.length} araç, /araclar dizini ve liste.json üretildi (index: ${liste.filter((x) => x.index).length}, noindex: ${liste.filter((x) => !x.index).length})`);
}
if (require.main === module) uret();
module.exports = { ozgunKelime, indekslenir, sayfa, dizin, dogrula, yukle, ASG_KELIME };
