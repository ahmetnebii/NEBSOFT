// SEO denetleyicisi: temiz örnek sitede hata yok, her kural kendi bozuk örneğinde yakalar, depodaki üretilmiş sayfalarda kesin hata yok.
// Çalıştırma: node server/test/seo-denetim.test.js (veritabanı gerekmez)
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { denetle, adresYap, jaccard, parcalar, metin, SINIR, D } = require('../../site/tools/seo-denetim');
const ROOT = path.join(__dirname, '..', '..');
let n = 0; const ok = (ad, fn) => { fn(); n++; console.log('  ✓ ' + ad); };

const dolgu = (t) => Array.from({ length: 60 }, (_, i) => `${t}${i}`).join(' ');
const ORG = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"NEBSOFT"}</script>';
const kirinti = (a) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'NEBSOFT', item: D + '/' }, { '@type': 'ListItem', position: 2, name: 'Sayfa', item: D + a }] })}</script>`;
function html(a, o = {}) {
  const baslik = o.baslik ?? `Örnek sayfa başlığı ${a}`; const acik = o.aciklama ?? `Bu sayfanın ${a} adresi için yazılmış, yeterince uzun ve kendine özgü bir açıklama metnidir, başka yerde yoktur.`;
  const c = o.canonical ?? D + a; const og = o.og ?? `<meta property="og:title" content="x"><meta property="og:description" content="x"><meta property="og:url" content="${c}"><meta property="og:image" content="${D}/assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:type" content="website"><meta property="og:site_name" content="NEBSOFT"><meta property="og:locale" content="tr_TR">`;
  return `<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width"><title>${baslik}</title><meta name="description" content="${acik}">${o.robots ? `<meta name="robots" content="${o.robots}">` : ''}<link rel="canonical" href="${c}">${og}<meta name="twitter:card" content="s"><meta name="twitter:title" content="x"><meta name="twitter:description" content="x"><meta name="twitter:image" content="x">${ORG}${o.kirinti === false ? '' : a === '/' ? '' : kirinti(a)}${o.bas || ''}</head><body><main>${o.h1 ?? `<h1>Başlık ${a}</h1>`}${o.govde ?? `<p>${dolgu(a.replace(/\W/g, 'x'))}</p>`}${o.linkler || ''}</main></body></html>`;
}
const ANA = (ek = '') => html('/', { linkler: `<a href="/urun">a</a><a href="/kvkk/">b</a><a href="/araclar/ornek/">c</a>${ek}` });
function kur(degis = {}) {
  const k = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-denetim-')); const yaz = (f, s) => { const p = path.join(k, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
  yaz('server.js', "const SLASHED = new Set(['kvkk']);\n"); yaz('assets/og.png', 'x');
  const S = { 'index.html': ANA(), 'site/urun/index.html': html('/urun'), 'site/kvkk/index.html': html('/kvkk/'), 'site/araclar/ornek/index.html': html('/araclar/ornek/'), ...degis.sayfa };
  Object.entries(S).forEach(([f, s]) => { if (s != null) yaz(f, s); });
  const L = degis.harita || ['/', '/urun', '/kvkk/', '/araclar/ornek/'];
  yaz('site/sitemap.xml', `<?xml version="1.0"?><urlset>${L.map((a) => `<url><loc>${D}${a}</loc><lastmod>${degis.lastmod || '2026-10-01'}</lastmod></url>`).join('')}</urlset>`);
  yaz('robots.txt', degis.robots || `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${D}/sitemap.xml\n`);
  const R = denetle(k); fs.rmSync(k, { recursive: true, force: true }); return R;
}
const var_ = (R, kural) => R.hata.some((x) => x.kural === kural);
const uyari = (R, kural) => R.uyari.some((x) => x.kural === kural);
const U = 'site/urun/index.html';

console.log('Temiz site');
ok('kesin hata yok', () => { const R = kur(); assert.deepStrictEqual(R.hata, []); assert.strictEqual(R.sayfaSayisi, 4); });
ok('adres kuralı: sonda / listesi ve araçlar', () => { const s = new Set(['kvkk']); assert.strictEqual(adresYap('', s), '/'); assert.strictEqual(adresYap('kvkk', s), '/kvkk/'); assert.strictEqual(adresYap('urun', s), '/urun'); assert.strictEqual(adresYap('araclar', s), '/araclar'); assert.strictEqual(adresYap('araclar/x', s), '/araclar/x/'); });

console.log('Kesin hatalar');
const D1 = [
  ['baslik-yok', { baslik: '' }], ['baslik-uzun', { baslik: 'x'.repeat(SINIR.baslik + 1) }], ['aciklama-yok', { aciklama: '' }], ['aciklama-uzun', { aciklama: 'x'.repeat(SINIR.aciklama + 1) }],
  ['h1', { h1: '' }], ['h1', { h1: '<h1>a</h1><h1>b</h1>' }], ['canonical', { canonical: `${D}/baska` }], ['canonical', { canonical: 'http://www.nebsoftapp.com/urun' }], ['robots', { robots: 'none' }],
  ['og', { og: '' }], ['og', { og: `<meta property="og:title" content="x"><meta property="og:description" content="x"><meta property="og:url" content="${D}/yanlis"><meta property="og:image" content="${D}/assets/yok.png"><meta property="og:type" content="website"><meta property="og:site_name" content="N"><meta property="og:locale" content="tr_TR">` }],
  ['jsonld', { bas: '<script type="application/ld+json">{bozuk</script>' }], ['jsonld', { kirinti: false }], ['sema-yasak', { bas: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","aggregateRating":{"ratingValue":5}}</script>' }],
  ['sema-sss', { bas: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}</script>' }],
  ['sema-gorunmez', { bas: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Sayfada olmayan soru?","acceptedAnswer":{"@type":"Answer","text":"Cevap"}}]}</script>' }],
  ['kirik-baglanti', { linkler: '<a href="/yok-boyle-sayfa">x</a>' }], ['kirik-gorsel', { linkler: '<img src="/yok.jpg" alt="x" width="1" height="1">' }], ['gorsel-alt', { linkler: '<img src="/assets/og.png" width="1" height="1">' }], ['gorsel-olcu', { linkler: '<img src="/assets/og.png" alt="x">' }],
  ['kirik-varlik', { bas: '<link rel="stylesheet" href="/yok.css">' }], ['yer-tutucu', { govde: `<p>https://domain.com/urun ${dolgu('a')}</p>` }], ['yer-tutucu', { govde: `<p>http://localhost:5050 ${dolgu('b')}</p>` }],
];
for (const [kural, o] of D1) ok(`${kural}: ${Object.keys(o).join(',')}`, () => assert(var_(kur({ sayfa: { [U]: html('/urun', o) } }), kural), kural));
ok('başlık ve açıklama tekrarı', () => { const R = kur({ sayfa: { [U]: html('/urun', { baslik: 'Aynı başlık burada yazıyor', aciklama: 'Aynı açıklama metni, yeterince uzun ama iki sayfada da birebir aynı yazılmış bir cümle.' }), 'site/kvkk/index.html': html('/kvkk/', { baslik: 'Aynı başlık burada yazıyor', aciklama: 'Aynı açıklama metni, yeterince uzun ama iki sayfada da birebir aynı yazılmış bir cümle.' }) } }); assert(var_(R, 'baslik-tekrar')); assert(var_(R, 'aciklama-tekrar')); });
ok('betik içindeki HTML metni etiket sayılmaz', () => { const R = kur({ sayfa: { [U]: html('/urun', { linkler: '<script>var x = "<title>ikinci</title><link rel=canonical href=/yok><link rel=icon href=/yok.ico>";</script>' }) } }); assert(!var_(R, 'baslik-coklu')); assert(!var_(R, 'kirik-varlik')); assert(!var_(R, 'canonical')); });
ok('sitemap ve robots tutarlılığı', () => {
  assert(var_(kur({ harita: ['/', '/urun', '/kvkk/'] }), 'sitemap-eksik'));
  assert(var_(kur({ sayfa: { [U]: html('/urun', { robots: 'noindex,follow' }) } }), 'sitemap-noindex'));
  assert(var_(kur({ harita: ['/', '/urun', '/kvkk/', '/araclar/ornek/', '/hayalet'] }), 'sitemap-sayfasiz'));
  assert(var_(kur({ harita: ['/', '/urun', '/urun', '/kvkk/', '/araclar/ornek/'] }), 'sitemap-tekrar'));
  assert(var_(kur({ lastmod: '2099-01-01' }), 'sitemap-lastmod'));
  assert(var_(kur({ lastmod: 'dün' }), 'sitemap-lastmod'));
  assert(var_(kur({ robots: `User-agent: *\nDisallow: /urun\nSitemap: ${D}/sitemap.xml\n` }), 'robots-txt'), 'dizine açık sayfa kapalı');
  const R = kur({ sayfa: { [U]: html('/urun', { robots: 'noindex,follow' }) }, harita: ['/', '/kvkk/', '/araclar/ornek/'], robots: `User-agent: *\nDisallow: /urun\nSitemap: ${D}/sitemap.xml\n` }); assert(R.hata.some((x) => x.kural === 'robots-txt' && /etiketi göremez/.test(x.mesaj)));
  assert(var_(kur({ robots: 'User-agent: *\nAllow: /\n' }), 'robots-txt'), 'Sitemap satırı');
  assert.deepStrictEqual(kur({ sayfa: { [U]: html('/urun', { robots: 'noindex,follow' }) }, harita: ['/', '/kvkk/', '/araclar/ornek/'] }).hata, [], 'noindex + sitemap dışı temiz');
});
ok('yetim ve ulaşılamaz sayfa', () => {
  assert(var_(kur({ sayfa: { 'site/yetim/index.html': html('/yetim') }, harita: ['/', '/urun', '/kvkk/', '/araclar/ornek/', '/yetim'] }), 'yetim'));
  const R = kur({ sayfa: { 'site/ada/index.html': html('/ada', { linkler: '<a href="/ada2">x</a>' }), 'site/ada2/index.html': html('/ada2', { linkler: '<a href="/ada">x</a>' }) }, harita: ['/', '/urun', '/kvkk/', '/araclar/ornek/', '/ada', '/ada2'] }); assert(var_(R, 'ulasilamaz'), 'kendi aralarında bağlı ada');
  assert(uyari(kur({ sayfa: { 'site/gizli/index.html': html('/gizli', { robots: 'noindex,follow' }) } }), 'yetim'), 'noindex yetim yalnız uyarı');
});
ok('kopya içerik kesin hata, benzer içerik uyarı', () => {
  const ort = `<p>${dolgu('ortak')}</p>`; const a = 'site/rehber/a/index.html'; const b = 'site/rehber/b/index.html'; const L = ['/', '/urun', '/kvkk/', '/araclar/ornek/', '/rehber/a', '/rehber/b'];
  const ana = { 'index.html': ANA('<a href="/rehber/a">a</a><a href="/rehber/b">b</a>') };
  assert(var_(kur({ sayfa: { ...ana, [a]: html('/rehber/a', { govde: ort, h1: '<h1>Bir</h1>' }), [b]: html('/rehber/b', { govde: ort, h1: '<h1>İki</h1>' }) }, harita: L }), 'kopya'));
  const yari = `<p>${dolgu('ortak').split(' ').slice(0, 45).join(' ')}`; const R = kur({ sayfa: { ...ana, [a]: html('/rehber/a', { govde: `${yari} ${dolgu('bir').split(' ').slice(0, 15).join(' ')}</p>`, h1: '<h1>Bir</h1>' }), [b]: html('/rehber/b', { govde: `${yari} ${dolgu('iki').split(' ').slice(0, 15).join(' ')}</p>`, h1: '<h1>İki</h1>' }) }, harita: L }); assert(uyari(R, 'benzer') && !var_(R, 'kopya'), JSON.stringify(R.benzerlik.ciftler));
});

console.log('Uyarılar');
ok('uzunluk, kalıp, aynı niyet, yönlenen bağlantı, tembel görsel', () => {
  assert(uyari(kur({ sayfa: { [U]: html('/urun', { baslik: 'x'.repeat(SINIR.baslikUyari + 1) }) } }), 'baslik-60'));
  assert(uyari(kur({ sayfa: { [U]: html('/urun', { aciklama: 'kısa ama var' }) } }), 'aciklama-kisa'));
  assert(uyari(kur({ sayfa: { [U]: html('/urun', { linkler: '<a href="/kvkk">x</a>' }) } }), 'yonlenen-baglanti'));
  assert(uyari(kur({ sayfa: { [U]: html('/urun', { linkler: '<img src="/assets/og.png" alt="x" width="1" height="1" loading="lazy">' }) } }), 'lcp-lazy'));
  assert(uyari(kur({ sayfa: { 'site/kuyumcuprogrami/index.html': html('/kuyumcuprogrami', { baslik: 'Kuyumcu Programı — Altın Satışı' }), 'site/paketler/a/index.html': html('/paketler/a/', { baslik: 'Kuyumcu Yazılımı — Bambaşka Bir Alt Başlık' }), 'index.html': ANA('<a href="/paketler/a/">p</a><a href="/kuyumcuprogrami">k</a>') }, harita: ['/', '/urun', '/kvkk/', '/araclar/ornek/', '/paketler/a/', '/kuyumcuprogrami'] }), 'ayni-niyet'));
  const k = {}; const L = ['/', '/urun', '/kvkk/', '/araclar/ornek/']; let e = ''; for (let i = 0; i < SINIR.kalipSayi; i++) { const a = `/araclar/k${i}/`; k[`site/araclar/k${i}/index.html`] = html(a, { baslik: `Konu ${i * 13} nasıl seçilir` }); L.push(a); e += `<a href="${a}">x</a>`; } k['index.html'] = ANA(e); assert(uyari(kur({ sayfa: k, harita: L }), 'baslik-kalip'));
});
ok('yardımcılar', () => { const a = parcalar('bir iki üç dört beş altı'.split(' ')); assert.strictEqual(a.size, 2); assert.strictEqual(jaccard(a, a), 1); assert.strictEqual(jaccard(a, new Set()), 0); assert.strictEqual(metin('<p>A<script>x</script> &amp; <b>B</b></p>'), 'A & B'); });

console.log('Depodaki üretilmiş sayfalar');
const R = denetle(ROOT);
ok(`${R.sayfaSayisi} sayfa: kesin hata yok`, () => assert.deepStrictEqual(R.hata.slice(0, 20), []));
ok('uyarılar kabul edilen türlerden', () => { const KABUL = new Set(['baslik-60', 'baslik-kalip', 'gorsel-lazy', 'yetim', 'hiz-js', 'ayni-niyet']); const yeni = R.uyari.filter((x) => !KABUL.has(x.kural)); assert.deepStrictEqual(yeni.slice(0, 10), [], 'yeni uyarı türü: docs/SEO-DENETIM.md güncellenmeli'); });
console.log(`\nseo-denetim: ${n} kontrol geçti`);
