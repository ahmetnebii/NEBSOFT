// Üretilmiş herkese açık sayfaların SEO denetimi: node site/tools/seo-denetim.js [--json dosya] [--benzerlik] [--uyari]
// Çıkış kodu kesin hata varsa 1. Kesin hata: resmî kurala veya proje kuralına aykırı, yayına çıkmaz. Uyarı: nedeni raporda yazılan, karar gerektiren durum.
// Kurallar ve kaynakları: docs/SEO-KURALLARI.md. Rapor: docs/SEO-DENETIM.md. Test: server/test/seo-denetim.test.js
// Bağımlılık yok. Girdi yalnız üretilmiş dosyalar: index.html, site/**/index.html, site/sitemap.xml, robots.txt, server.js (SLASHED listesi).
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');

const VARSAYILAN_KOK = path.join(__dirname, '..', '..');
const D = 'https://www.nebsoftapp.com';
const SINIR = { baslik: 70, baslikUyari: 60, baslikAlt: 15, aciklama: 165, aciklamaAlt: 70, htmlGz: 60 * 1024, lcpGorsel: 300 * 1024, cssToplam: 60 * 1024, jsToplam: 150 * 1024, kopya: 0.85, benzer: 0.5, ozgunOran: 0.25, ozgunKelime: 120, niyet: 0.6, derinlik: 3, kalipSayi: 8 };
const ATLA = new Set(['src', 'tools', 'assets', 'img', 'vendor']);
const ZORUNLU_OG = ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name', 'og:locale'];
const ZORUNLU_TW = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
const YASAK_SEMA = ['aggregateRating', 'review', 'Review', 'AggregateRating'];
const ETKISIZ = new Set('ve ile için bir bu da de en çok ne nedir nasıl neden gibi kadar olan olarak veya ya mi mı mu mü ücretsiz online nebsoft programı programi program yazılımı yazılım sistemi hesaplama hesaplanır hesaplayıcı oluşturucu oluşturma aracı araç rehber seçilir yapılır örneği'.split(' '));

// ---------- HTML okuma ----------
const cozVarlik = (s) => String(s || '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const ozellik = (etiket, ad) => { const m = new RegExp(`\\s${ad}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(etiket); return m ? cozVarlik(m[1] ?? m[2]) : null; };
const etiketler = (h, ad) => [...h.matchAll(new RegExp(`<${ad}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const yorumsuz = (h) => h.replace(/<!--[\s\S]*?-->/g, ' ');
const scriptIcsiz = (h) => yorumsuz(h).replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, '<script$1></script>'); // betik içindeki HTML metni etiket sayılmasın
const kodsuz = (h) => yorumsuz(h).replace(/<(script|style|template|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ');
const metin = (h) => cozVarlik(kodsuz(h).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const anaBolum = (h) => (/<main\b[\s\S]*<\/main>/i.exec(h) || [h])[0];
const meta = (h, anahtar, ad) => { const t = etiketler(h, 'meta').find((x) => (ozellik(x, anahtar) || '').toLowerCase() === ad); return t ? ozellik(t, 'content') : null; };
const sema = (h) => [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const dolas = (o, f) => { if (Array.isArray(o)) o.forEach((x) => dolas(x, f)); else if (o && typeof o === 'object') { f(o); Object.values(o).forEach((x) => dolas(x, f)); } };
const kucuk = (s) => String(s).toLocaleLowerCase('tr');
const kelimeler = (s) => kucuk(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

// ---------- Sayfa bulma ----------
function slashListesi(kok) { const m = /const SLASHED = new Set\(\[([^\]]+)\]/.exec(fs.readFileSync(path.join(kok, 'server.js'), 'utf8')); return new Set(m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []); }
const adresYap = (rel, slash) => { if (!rel) return '/'; const ust = rel.split('/')[0]; return slash.has(ust) || (ust === 'araclar' && rel.includes('/')) ? `/${rel}/` : `/${rel}`; };
function sayfalariBul(kok) {
  const site = path.join(kok, 'site'); const L = []; const slash = slashListesi(kok);
  const gez = (d, rel) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (!e.isDirectory() || (!rel && ATLA.has(e.name)) || e.name === 'img') continue; const r = rel ? `${rel}/${e.name}` : e.name; const f = path.join(d, e.name, 'index.html'); if (fs.existsSync(f)) L.push({ rel: r, adres: adresYap(r, slash), dosya: f, html: fs.readFileSync(f, 'utf8') }); gez(path.join(d, e.name), r); } };
  if (fs.existsSync(site)) gez(site, '');
  const ana = path.join(kok, 'index.html'); if (fs.existsSync(ana)) L.unshift({ rel: '', adres: '/', dosya: ana, html: fs.readFileSync(ana, 'utf8') });
  return L.map((p) => { const t = etiketler(scriptIcsiz(p.html), 'title'); const g = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(p.html) || [])[1]; const rb = meta(p.html, 'name', 'robots'); return { ...p, baslik: g == null ? null : cozVarlik(g).trim(), baslikSayi: t.length, aciklama: meta(p.html, 'name', 'description'), robots: rb, kapali: /noindex/i.test(rb || ''), grup: grupOf(p.rel) }; });
}
const grupOf = (rel) => { if (!rel) return 'ana'; const [a, b] = rel.split('/'); if (a === 'araclar') return b ? 'arac' : 'dizin'; if (a === 'paketler') return b && b !== 'hangi-program' ? 'paket' : 'dizin'; if (a === 'rehber') return b ? 'rehber' : 'dizin'; if (/program|sistemi|erp|paketi|hesaplama$/.test(a) && !['programlar'].includes(a)) return 'program'; return 'diger'; };

// ---------- Bağlantı çözme ----------
function coz(kok, sayfaAdres, u, D2) {
  if (!u || /^(mailto:|tel:|data:|javascript:|#)/i.test(u)) return { tur: 'atla' };
  let yol = u; if (/^https?:\/\//i.test(u)) { if (!u.startsWith(D2)) return { tur: 'dis' }; yol = u.slice(D2.length) || '/'; }
  if (yol.startsWith('/#')) return { tur: 'atla' };
  yol = yol.split('#')[0].split('?')[0]; if (!yol) return { tur: 'atla' };
  if (!yol.startsWith('/')) yol = path.posix.join(sayfaAdres.endsWith('/') ? sayfaAdres : path.posix.dirname(sayfaAdres), yol);
  try { yol = decodeURI(yol); } catch (e) { /* kaçışlı değil */ }
  return { tur: 'ic', yol, dosyaVar: [path.join(kok, yol), path.join(kok, 'site', yol)].some((f) => { try { return fs.statSync(f).isFile(); } catch (e) { return false; } }) };
}

// ---------- Denetim ----------
function denetle(kok = VARSAYILAN_KOK, ayar = {}) {
  const alan = ayar.alan || D; const S = sayfalariBul(kok); const hata = []; const uyari = [];
  const H = (a, kural, m) => hata.push({ adres: a, kural, mesaj: m }); const U = (a, kural, m) => uyari.push({ adres: a, kural, mesaj: m });
  const adresler = new Map(S.map((p) => [p.adres, p]));
  const haritaYol = path.join(kok, 'site', 'sitemap.xml'); const xml = fs.existsSync(haritaYol) ? fs.readFileSync(haritaYol, 'utf8') : '';
  const harita = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
  const haritaSet = new Set(harita.map((x) => x.loc));
  const robotsYol = path.join(kok, 'robots.txt'); const robots = fs.existsSync(robotsYol) ? fs.readFileSync(robotsYol, 'utf8') : '';
  const yasak = [...robots.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]);
  const gelen = new Map(S.map((p) => [p.adres, new Set()])); const cikis = new Map();
  const bas = new Map(); const acik = new Map(); const bugun = new Date().toISOString().slice(0, 10);

  for (const p of S) {
    const a = p.adres; const h = p.html; const dizinde = !p.kapali; const govde = kodsuz(h); const dis = scriptIcsiz(h);
    if (!/<html[^>]*\slang="tr"/i.test(h)) H(a, 'dil', 'html lang="tr" yok');
    if (!meta(h, 'name', 'viewport')) H(a, 'viewport', 'viewport yok');
    // Başlık ve açıklama. Google'da sayı sınırı yok; 70/165 proje kuralıdır, sonuçta kesilmeyi önler
    if (!p.baslik) H(a, 'baslik-yok', 'title yok');
    else {
      if (p.baslikSayi > 1) H(a, 'baslik-coklu', `${p.baslikSayi} title`);
      if (p.baslik.length > SINIR.baslik) H(a, 'baslik-uzun', `${p.baslik.length} karakter: ${p.baslik}`);
      else if (p.baslik.length > SINIR.baslikUyari) U(a, 'baslik-60', `${p.baslik.length} karakter`);
      if (p.baslik.length < SINIR.baslikAlt) U(a, 'baslik-kisa', `${p.baslik.length} karakter`);
      if (dizinde) { if (bas.has(p.baslik)) H(a, 'baslik-tekrar', `${bas.get(p.baslik)} ile aynı`); else bas.set(p.baslik, a); }
    }
    if (!p.aciklama) H(a, 'aciklama-yok', 'meta description yok');
    else {
      if (p.aciklama.length > SINIR.aciklama) H(a, 'aciklama-uzun', `${p.aciklama.length} karakter`);
      if (p.aciklama.length < SINIR.aciklamaAlt) U(a, 'aciklama-kisa', `${p.aciklama.length} karakter`);
      if (dizinde) { if (acik.has(p.aciklama)) H(a, 'aciklama-tekrar', `${acik.get(p.aciklama)} ile aynı`); else acik.set(p.aciklama, a); }
    }
    const h1 = (govde.match(/<h1[\s>]/gi) || []).length; if (h1 !== 1) H(a, 'h1', `${h1} adet H1`);
    // Canonical
    const can = etiketler(dis, 'link').filter((x) => (ozellik(x, 'rel') || '').toLowerCase() === 'canonical').map((x) => ozellik(x, 'href'));
    if (can.length !== 1) H(a, 'canonical', `${can.length} canonical`); else if (can[0] !== alan + a) H(a, 'canonical', `${can[0]} beklenen ${alan + a}`);
    // Robots
    if (p.robots && !/^(no)?index,\s*(no)?follow$/i.test(p.robots)) H(a, 'robots', `beklenmeyen değer: ${p.robots}`);
    if (p.robots && /nofollow/i.test(p.robots)) U(a, 'robots-nofollow', 'nofollow bağlantı akışını keser');
    if (dizinde && yasak.some((y) => a.startsWith(y))) H(a, 'robots-txt', 'dizine açık sayfa robots.txt ile kapalı');
    if (p.kapali && yasak.some((y) => a.startsWith(y))) H(a, 'robots-txt', 'noindex sayfa robots.txt ile kapalı: Google etiketi göremez');
    // Sitemap
    if (dizinde && !haritaSet.has(alan + a)) H(a, 'sitemap-eksik', 'dizine açık ama sitemap dışında');
    if (p.kapali && haritaSet.has(alan + a)) H(a, 'sitemap-noindex', 'noindex ama sitemap içinde');
    // Sosyal
    for (const k of ZORUNLU_OG) if (!meta(h, 'property', k)) H(a, 'og', `${k} yok`);
    for (const k of ZORUNLU_TW) if (!meta(h, 'name', k)) H(a, 'twitter', `${k} yok`);
    const ogu = meta(h, 'property', 'og:url'); if (ogu && ogu !== alan + a) H(a, 'og', `og:url ${ogu}`);
    const ogi = meta(h, 'property', 'og:image');
    if (ogi) { if (!ogi.startsWith('https://')) H(a, 'og', 'og:image mutlak değil'); const r = coz(kok, a, ogi, alan); if (r.tur === 'ic' && !r.dosyaVar) H(a, 'og', `og:image dosyası yok: ${r.yol}`); }
    if (ogi && !meta(h, 'property', 'og:image:width')) U(a, 'og-olcu', 'og:image:width yok');
    // JSON-LD
    const bloklar = []; for (const b of sema(h)) { try { bloklar.push(JSON.parse(b)); } catch (e) { H(a, 'jsonld', `ayrıştırılamadı: ${e.message}`); } }
    const gorunen = kucuk(metin(h));
    for (const b of bloklar) {
      if (!b['@context'] || !b['@type']) H(a, 'jsonld', '@context veya @type yok');
      dolas(b, (o) => { for (const k of YASAK_SEMA) if (k in o || o['@type'] === k) H(a, 'sema-yasak', `${k} kullanılmaz: gerçek yorum yok`); });
      if (b['@type'] === 'FAQPage') { if (!(b.mainEntity || []).length) H(a, 'sema-sss', 'boş FAQPage'); (b.mainEntity || []).forEach((q) => { if (!q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) H(a, 'sema-sss', 'soru veya cevap boş'); else { if (!gorunen.includes(kucuk(q.name).replace(/\s+/g, ' ').trim())) H(a, 'sema-gorunmez', `şemadaki soru sayfada görünmüyor: ${q.name}`); if (!gorunen.includes(kucuk(q.acceptedAnswer.text).replace(/\s+/g, ' ').trim())) H(a, 'sema-gorunmez', `şemadaki cevap sayfada görünmüyor: ${q.name}`); } }); }
      if (b['@type'] === 'BreadcrumbList') { const L = b.itemListElement || []; L.forEach((x, i) => { if (x.position !== i + 1) H(a, 'sema-kirinti', 'sıra numarası bozuk'); }); const son = L[L.length - 1]; if (son && son.item && son.item !== alan + a) H(a, 'sema-kirinti', `son öğe ${son.item}`); }
      if (b['@type'] === 'ItemList') (b.itemListElement || []).forEach((x) => { const r = x.url && coz(kok, a, x.url, alan); if (r && r.tur === 'ic' && !adresler.has(r.yol)) H(a, 'sema-liste', `listede olmayan sayfa: ${x.url}`); });
    }
    if (!bloklar.some((b) => b['@type'] === 'Organization')) H(a, 'jsonld', 'Organization yok');
    if (p.rel && !bloklar.some((b) => b['@type'] === 'BreadcrumbList')) H(a, 'jsonld', 'BreadcrumbList yok');
    // Görseller
    const ana = anaBolum(govde); const gorseller = etiketler(govde, 'img'); const anaGorsel = etiketler(ana, 'img');
    for (const g of gorseller) {
      const src = ozellik(g, 'src'); if (ozellik(g, 'alt') == null) H(a, 'gorsel-alt', `alt yok: ${src}`);
      if (!ozellik(g, 'width') || !ozellik(g, 'height')) H(a, 'gorsel-olcu', `width/height yok: ${src}`);
      const r = coz(kok, a, src, alan); if (r.tur === 'ic' && !r.dosyaVar) H(a, 'kirik-gorsel', src);
    }
    anaGorsel.slice(1).forEach((g) => { if (!/loading="lazy"/.test(g) && !/fetchpriority/.test(g)) U(a, 'gorsel-lazy', `tembel yükleme yok: ${ozellik(g, 'src')}`); });
    if (anaGorsel[0] && /loading="lazy"/.test(anaGorsel[0]) && !p.kapali && p.grup !== 'dizin') U(a, 'lcp-lazy', `ilk görsel tembel yükleniyor: ${ozellik(anaGorsel[0], 'src')}`);
    // Bağlantılar ve varlıklar
    const hedefler = new Set();
    for (const e of etiketler(govde, 'a')) {
      const u = ozellik(e, 'href'); const r = coz(kok, a, u, alan); if (r.tur !== 'ic') continue;
      if (adresler.has(r.yol)) { if (r.yol !== a) { gelen.get(r.yol).add(a); hedefler.add(r.yol); } continue; }
      const es = r.yol.endsWith('/') ? r.yol.slice(0, -1) : r.yol + '/';
      if (adresler.has(es)) { U(a, 'yonlenen-baglanti', `${u} yönlendirir, doğrusu ${es}`); gelen.get(es).add(a); hedefler.add(es); continue; }
      if (!r.dosyaVar) H(a, 'kirik-baglanti', u);
    }
    cikis.set(a, hedefler);
    for (const e of [...etiketler(dis, 'link').filter((x) => /stylesheet|preload|icon/i.test(ozellik(x, 'rel') || '')).map((x) => ozellik(x, 'href')), ...etiketler(dis, 'script').map((x) => ozellik(x, 'src'))]) { const r = coz(kok, a, e, alan); if (r.tur === 'ic' && !r.dosyaVar) H(a, 'kirik-varlik', e); }
    const kapsam = yorumsuz(h).replace(/<script[^>]*src=[^>]*>/gi, ' ');
    if (/(?<![a-z0-9-])domain\.com/i.test(kapsam)) H(a, 'yer-tutucu', 'domain.com kalıntısı');
    if (/\b(localhost|127\.0\.0\.1)\b/.test(kapsam.replace(/<script\b[\s\S]*?<\/script>/gi, ' '))) H(a, 'yer-tutucu', 'yerel adres kalıntısı');
  }

  // Sitemap ters yönde
  const gorulen = new Set();
  for (const { loc, lastmod } of harita) {
    if (gorulen.has(loc)) H(loc, 'sitemap-tekrar', 'iki kez'); gorulen.add(loc);
    if (!loc.startsWith(alan)) { H(loc, 'sitemap-adres', 'alan adı farklı'); continue; }
    if (!adresler.has(loc.slice(alan.length))) H(loc, 'sitemap-sayfasiz', 'dosyası yok');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod || '')) H(loc, 'sitemap-lastmod', `lastmod geçersiz: ${lastmod}`); else if (lastmod > bugun) H(loc, 'sitemap-lastmod', `gelecek tarih: ${lastmod}`);
  }
  if (!/^Sitemap:\s*https:\/\/\S+/im.test(robots)) H('/robots.txt', 'robots-txt', 'Sitemap satırı yok');
  else if (!robots.includes(`Sitemap: ${alan}/sitemap.xml`)) H('/robots.txt', 'robots-txt', 'Sitemap alanı farklı');

  // Yetim ve derinlik: ana sayfadan tıklama sayısı (noindex sayfaların bağlantısı da izlenir, follow açık)
  const derinlik = new Map([['/', 0]]); let kuyruk = ['/'];
  while (kuyruk.length) { const yeni = []; for (const a of kuyruk) for (const b of cikis.get(a) || []) if (!derinlik.has(b)) { derinlik.set(b, derinlik.get(a) + 1); yeni.push(b); } kuyruk = yeni; }
  for (const p of S) { if (!p.rel) continue; const g = gelen.get(p.adres).size; if (!g) (p.kapali ? U : H)(p.adres, 'yetim', 'hiçbir sayfadan bağlantı yok'); else if (!derinlik.has(p.adres)) (p.kapali ? U : H)(p.adres, 'ulasilamaz', 'ana sayfadan yol yok'); else if (derinlik.get(p.adres) > SINIR.derinlik) U(p.adres, 'derin', `${derinlik.get(p.adres)} tıklama`); }

  // Başlık kalıbı: aynı kelime dizisi birçok başlıkta (Google: kalıp başlıklardan kaçının)
  const say = new Map(); for (const p of S.filter((x) => !x.kapali && x.baslik)) { const T = kelimeler(p.baslik).filter((x) => x !== 'nebsoft'); const k = new Set(); for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= T.length; i++) k.add(T.slice(i, i + n).join(' ')); k.forEach((x) => say.set(x, [...(say.get(x) || []), p.adres])); }
  const kalip = [...say.entries()].filter(([, L]) => L.length >= SINIR.kalipSayi).map(([k, L]) => ({ kalip: k, sayi: L.length })).filter((x, _, T) => !T.some((y) => y !== x && y.sayi === x.sayi && y.kalip.includes(x.kalip))).sort((x, y) => y.sayi - x.sayi);
  kalip.forEach((k) => U('(site geneli)', 'baslik-kalip', `"${k.kalip}" ${k.sayi} başlıkta`));

  const benzerlik = benzerlikOlc(S, { H, U }); const hiz = hizOlc(kok, S, { U }, alan);
  return { sayfaSayisi: S.length, dizinde: S.filter((p) => !p.kapali).length, kapali: S.filter((p) => p.kapali).map((p) => p.adres), hata, uyari, benzerlik, hiz, derinlik: Object.fromEntries(derinlik), sayfalar: S.map(({ adres, baslik, aciklama, grup, kapali }) => ({ adres, baslik, aciklama, grup, kapali })) };
}

// ---------- Metin benzerliği ----------
// 5 kelimelik parçalar. Grubun en az %30'unda geçen parça şablondur: "özgün oran" şablon dışı parçaların payı.
const parcalar = (L, k = 5) => { const s = new Set(); for (let i = 0; i + k <= L.length; i++) s.add(L.slice(i, i + k).join(' ')); return s; };
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; const [x, y] = a.size < b.size ? [a, b] : [b, a]; let o = 0; for (const e of x) if (y.has(e)) o++; return o / (a.size + b.size - o); };
const niyetKoku = (s) => new Set(kelimeler(s).filter((x) => x.length > 2 && !ETKISIZ.has(x)).map((x) => x.slice(0, 6)));
function benzerlikOlc(S, { H, U }) {
  const L = S.filter((p) => p.rel && !p.kapali).map((p) => { const T = kelimeler(metin(anaBolum(p.html))); return { p, T, s: parcalar(T), niyet: niyetKoku((p.baslik || '').split(/\s[|—]\s|:\s/)[0]), basliklar: new Set(((p.html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi)) || []).map((x) => kucuk(metin(x)))) }; });
  const gruplar = {}; L.forEach((x) => { (gruplar[x.p.grup] = gruplar[x.p.grup] || []).push(x); });
  const ozet = {}; const gecen = []; const enUst = [];
  for (const [g, G] of Object.entries(gruplar)) {
    const df = new Map(); G.forEach((x) => x.s.forEach((c) => df.set(c, (df.get(c) || 0) + 1))); const esik = Math.max(3, Math.ceil(G.length * 0.3));
    G.forEach((x) => { x.oz = new Set([...x.s].filter((c) => df.get(c) < esik)); x.oran = x.s.size ? x.oz.size / x.s.size : 0; });
    const O = G.map((x) => x.oran).sort((a, b) => a - b);
    ozet[g] = { sayfa: G.length, ozgunOranEnDusuk: +(O[0] || 0).toFixed(2), ozgunOranOrta: +(O[O.length >> 1] || 0).toFixed(2), kelimeOrta: G.map((x) => x.T.length).sort((a, b) => a - b)[G.length >> 1] };
    if (g === 'dizin' || g === 'diger') continue;
    G.forEach((x) => { if (x.oran < SINIR.ozgunOran) U(x.p.adres, 'ozgun-oran', `özgün oran %${Math.round(x.oran * 100)}`); if (x.oz.size < SINIR.ozgunKelime) U(x.p.adres, 'ozgun-kelime', `şablon dışı ${x.oz.size} parça`); });
  }
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i]; const b = L[j]; if (a.p.grup === 'dizin' || b.p.grup === 'dizin' || a.p.grup === 'diger' || b.p.grup === 'diger') continue;
    const ham = jaccard(a.s, b.s); const oz = jaccard(a.oz || a.s, b.oz || b.s); const n = jaccard(a.niyet, b.niyet);
    if (ham >= SINIR.benzer || oz >= SINIR.benzer) gecen.push({ a: a.p.adres, b: b.p.adres, tur: 'metin', ham: +ham.toFixed(2), ozgun: +oz.toFixed(2) });
    if (ham >= SINIR.kopya) H(a.p.adres, 'kopya', `${b.p.adres} ile %${Math.round(ham * 100)} aynı`); else if (ham >= SINIR.benzer) U(a.p.adres, 'benzer', `${b.p.adres} ile %${Math.round(ham * 100)} aynı`);
    const bilgi = (a.p.grup === 'rehber') !== (b.p.grup === 'rehber') && [a.p.grup, b.p.grup].some((g) => g === 'program' || g === 'paket'); // "nasıl seçilir" yazısı ile satış sayfası farklı niyettir
    if (a.p.grup === 'rehber' && b.p.grup === 'rehber') { const bh = jaccard(a.basliklar, b.basliklar); if (bh >= SINIR.benzer) { gecen.push({ a: a.p.adres, b: b.p.adres, tur: 'alt-baslik', oran: +bh.toFixed(2) }); U(a.p.adres, 'ayni-iskelet', `${b.p.adres} ile alt başlıklar %${Math.round(bh * 100)} aynı`); } }
    enUst.push({ a: a.p.adres, b: b.p.adres, grup: a.p.grup === b.p.grup ? a.p.grup : 'karma', ham: +ham.toFixed(3) });
    if (!bilgi && n >= SINIR.niyet && a.niyet.size) { gecen.push({ a: a.p.adres, b: b.p.adres, tur: 'niyet', niyet: +n.toFixed(2), ortak: [...a.niyet].filter((x) => b.niyet.has(x)).join(' ') }); U(a.p.adres, 'ayni-niyet', `${b.p.adres} ile aynı aramayı hedefliyor olabilir (${[...a.niyet].filter((x) => b.niyet.has(x)).join(', ')})`); }
  }
  const ust = {}; enUst.sort((x, y) => y.ham - x.ham).forEach((c) => { const L = (ust[c.grup] = ust[c.grup] || []); if (L.length < 5) L.push(c); });
  return { gruplar: ozet, ciftler: gecen, ust };
}

// ---------- Hız: üretim çıktısından ölçüm ----------
function hizOlc(kok, S, { U }, alan) {
  const boyut = new Map(); const dosyaBoyut = (a, u) => { const r = coz(kok, a, u, alan); if (r.tur !== 'ic') return 0; if (boyut.has(r.yol)) return boyut.get(r.yol); let n = 0; for (const f of [path.join(kok, r.yol), path.join(kok, 'site', r.yol)]) { try { n = zlib.gzipSync(fs.readFileSync(f)).length; break; } catch (e) { /* diğer yol */ } } boyut.set(r.yol, n); return n; };
  const hamBoyut = (a, u) => { const r = coz(kok, a, u, alan); if (r.tur !== 'ic') return 0; for (const f of [path.join(kok, r.yol), path.join(kok, 'site', r.yol)]) { try { return fs.statSync(f).size; } catch (e) { /* diğer yol */ } } return 0; };
  const satir = S.map((p) => {
    const a = p.adres; const h = scriptIcsiz(p.html); const gz = zlib.gzipSync(p.html).length;
    const css = etiketler(h, 'link').filter((x) => /stylesheet/i.test(ozellik(x, 'rel') || '') && !/print/.test(ozellik(x, 'media') || '')).map((x) => ozellik(x, 'href'));
    const js = etiketler(h, 'script').map((x) => ozellik(x, 'src')).filter(Boolean); const eng = js.filter((_, i) => !/\s(defer|async)\b/.test(etiketler(h, 'script').filter((x) => ozellik(x, 'src'))[i]));
    const cssT = css.reduce((t, u) => t + dosyaBoyut(a, u), 0); const jsT = js.reduce((t, u) => t + dosyaBoyut(a, u), 0);
    const lcp = etiketler(anaBolum(kodsuz(p.html)), 'img')[0]; const lcpU = lcp && ozellik(lcp, 'src'); const lcpB = lcpU ? hamBoyut(a, lcpU) : 0;
    const srcset = lcp && ozellik(lcp, 'srcset'); const kucukB = srcset ? hamBoyut(a, srcset.split(',')[0].trim().split(/\s+/)[0]) : 0; const mobilLcp = kucukB || lcpB;
    if (gz > SINIR.htmlGz) U(a, 'hiz-html', `HTML sıkıştırılmış ${Math.round(gz / 1024)} KB`);
    if (mobilLcp > SINIR.lcpGorsel) U(a, 'hiz-lcp', `LCP görseli ${Math.round(mobilLcp / 1024)} KB: ${lcpU}`);
    if (cssT > SINIR.cssToplam) U(a, 'hiz-css', `CSS sıkıştırılmış ${Math.round(cssT / 1024)} KB`);
    if (jsT > SINIR.jsToplam) U(a, 'hiz-js', `JS sıkıştırılmış ${Math.round(jsT / 1024)} KB`);
    return { adres: a, grup: p.grup, htmlGz: gz, cssGz: cssT, jsGz: jsT, engelleyenJs: eng.length, lcp: lcpU || null, lcpBayt: lcpB, mobilLcpBayt: mobilLcp };
  });
  const ort = {}; for (const g of [...new Set(satir.map((x) => x.grup))]) { const G = satir.filter((x) => x.grup === g); const en = (k) => Math.max(...G.map((x) => x[k])); ort[g] = { sayfa: G.length, htmlGzEnCok: en('htmlGz'), cssGzEnCok: en('cssGz'), jsGzEnCok: en('jsGz'), mobilLcpEnCok: en('mobilLcpBayt'), engelleyenJsEnCok: en('engelleyenJs') }; }
  return { satir, gruplar: ort };
}

// ---------- Komut satırı ----------
function ozetYaz(R, secenek = {}) {
  const say = (L) => { const m = {}; L.forEach((x) => { m[x.kural] = (m[x.kural] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${n}`).join(', '); };
  console.log(`${R.sayfaSayisi} sayfa, ${R.dizinde} dizine açık, ${R.kapali.length} noindex`);
  console.log(`Kesin hata: ${R.hata.length}${R.hata.length ? ' (' + say(R.hata) + ')' : ''}`); console.log(`Uyarı: ${R.uyari.length}${R.uyari.length ? ' (' + say(R.uyari) + ')' : ''}`);
  R.hata.slice(0, secenek.hepsi ? 1e6 : 60).forEach((x) => console.log(`  ✗ ${x.adres} [${x.kural}] ${x.mesaj}`));
  if (secenek.uyari) R.uyari.forEach((x) => console.log(`  ! ${x.adres} [${x.kural}] ${x.mesaj}`));
  if (secenek.benzerlik) { console.log('Gruplar:', JSON.stringify(R.benzerlik.gruplar)); R.benzerlik.ciftler.forEach((c) => console.log(' ', JSON.stringify(c))); console.log('En benzer:', JSON.stringify(R.benzerlik.ust)); console.log('Hız:', JSON.stringify(R.hiz.gruplar)); }
}
if (require.main === module) {
  const A = process.argv.slice(2); const R = denetle(VARSAYILAN_KOK); const j = A.indexOf('--json');
  if (j >= 0) fs.writeFileSync(A[j + 1], JSON.stringify(R, null, 1));
  ozetYaz(R, { uyari: A.includes('--uyari'), benzerlik: A.includes('--benzerlik'), hepsi: A.includes('--hepsi') });
  process.exit(R.hata.length ? 1 : 0);
}
module.exports = { denetle, sayfalariBul, adresYap, jaccard, parcalar, metin, SINIR, D };
