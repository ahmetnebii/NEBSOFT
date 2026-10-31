// Telefon denetiminde bulunan ortak hataların geri gelmemesi için. Akışlar tarayıcıda öykünmeyle denendi (docs/test/telefon.md); burası kaynak ve saf mantık denetimidir.
//   node server/test/telefon.test.js
const assert = require('assert'); const fs = require('fs'); const path = require('path'); const vm = require('vm');
const oku = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8').replace(/\r\n/g, '\n');
let passed = 0; const ok = (n) => { passed++; console.log('  ✓', n); };
const css = oku('core/core.css'); const js = oku('core/core.js');
const tel = css.slice(css.indexOf('TELEFON — kontrast')); assert.ok(tel.length > 500, 'telefon bölümü dosya sonunda olmalı');

// Dokunma hedefi ve odak yakınlaşması
assert.match(tel, /\.btn, \.btn\.sm, \.btn\.icon, \.input, \.list-item \{ min-height: 44px; \}/); assert.match(tel, /\.btn\.icon, \.btn\.sm\.icon, \.btn\.sm \{ min-width: 44px; \}/); assert.match(tel, /\.seg button \{ min-height: 44px; min-width: 44px; \}/); assert.match(tel, /\.ns-nav a, \.nv-grp-h \{ min-height: 44px;/); ok('düğme, alan, sekme ve menü bağlantısı telefonda en az 44 px');
assert.match(tel, /select, textarea, \.input \{ font-size: 16px !important; \}/); ok('form alanları 16 px: iOS odakta sayfayı büyütmez');

// Kontrast: yazı renkleri AA (4,5:1) altına düşmez
const lum = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const oran = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const deger = (blok, ad) => { const m = new RegExp(`--${ad}: (#[0-9a-f]{6})`).exec(blok); assert.ok(m, ad); return m[1]; };
const acik = tel.match(/^:root \{[^}]+\}/m)[0]; const kur = tel.match(/^:root\[data-palette="kurumsal"\] \{[^}]+\}/m)[0]; const koyu = tel.match(/^:root\[data-theme="dark"\] \{[^}]+\}/m)[0];
assert.ok(oran(deger(kur, 'text-3'), '#ffffff') >= 4.5); assert.ok(oran(deger(kur, 'text-3'), '#f7f9fd') >= 4.5); assert.ok(oran(deger(acik, 'text-3'), '#ffffff') >= 4.5); assert.ok(oran(deger(koyu, 'text-3'), '#131316') >= 4.5);
[['ok', '#e8f7ee'], ['warn', '#fdf3e2'], ['err', '#fdeaea']].forEach(([k, soft]) => { assert.ok(oran(deger(acik, k), '#ffffff') >= 4.5, k); assert.ok(oran(deger(acik, k), soft) >= 4.5, k + ' zemin'); });
[['ok', '#12301f'], ['warn', '#33260f'], ['err', '#3a1717'], ['info', '#0f2a3a']].forEach(([k, soft]) => assert.ok(oran(deger(koyu, k), soft) >= 4.5, k + ' koyu zemin'));
assert.match(tel, /\.btn\.ok, \.ns-toast\.ok \{ background: #15803d;/); assert.match(tel, /\.btn\.danger, \.ns-toast\.err \{ background: #c81e1e;/); assert.ok(oran('#15803d', '#ffffff') >= 4.5); assert.ok(oran('#c81e1e', '#ffffff') >= 4.5); ok('soluk yazı, durum rengi ve dolu düğme iki temada 4,5:1 üstünde');

// Yerleşim kökleri
assert.match(tel, /\.row:not\(\.nw\) > \.grow \{ flex-basis: 130px;/); ok('dar satırda başlık sıkışıp sayfayı açmaz (klinik ve randevu takvimi 412 px)');
assert.match(oku('apps/adisyon/index.html'), /\.order \{ grid-template-columns: minmax\(0, 1fr\); height: auto; \}/); ok('adisyon sipariş ekranı telefon genişliğini açmaz');
assert.match(css, /\.search \.ico \{ pointer-events: none; \}/); ok('arama simgesi dokunmayı yutmaz');
assert.match(tel, /\.ns-modal \{ max-height: calc\(var\(--vvh, 100dvh\) - 12px\);/); assert.match(js, /setProperty\('--vvh', vv\.height \+ 'px'\)/); ok('modal klavye açıkken görünen alana sığar');
assert.match(tel, /\.nsd:not\(\.open\) \{ z-index: 50; \}/); assert.ok(!tel.includes(':has('), 'telefon bölümünde :has yok: binlerce satırda yerleşimi yavaşlatır'); assert.match(tel, /content-visibility: auto/); ok('destek balonu modalın altında, büyük listede yavaşlatan seçici yok');
assert.match(js, /matchMedia\('\(pointer: coarse\)'\)\.matches\) setTimeout\(\(\) => first\.focus\(\), 30\)/); ok('dokunmatik ekranda modal klavyeyi kendiliğinden açmaz');

// Tek sütunlu ızgara içeriğe göre genişlemesin: randevu sayfası 1183 px, adisyon 459 px taşıyordu
{ const yuru = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? yuru(path.join(d, e.name)) : /\.(html|css|js)$/.test(e.name) ? [path.join(d, e.name)] : [])); const kok = path.join(__dirname, '..', '..'); const kotu = yuru(path.join(kok, 'apps')).filter((d) => /grid-template-columns: ?1fr ?(;|\}|!important|"|')/.test(fs.readFileSync(d, 'utf8'))); assert.deepEqual(kotu, []); assert.match(oku('apps/pos/app.js'), /if \(!NS\.cloud\) throw new Error\('Ürün kataloğu/); ok('programlarda sıkışmayan tek sütunlu ızgara kalmadı, demoda katalog isteği atılmaz'); }

// Geri tuşu: gerçek kod küçük bir geçmiş öykünmesiyle çalıştırılır
const bas = js.indexOf('  const geriYigin = []'); const son = js.indexOf('  function modal({'); assert.ok(bas > 0 && son > bas); const parca = js.slice(bas, son).split('\n').filter((l) => !/visualViewport|focusin/.test(l)).join('\n');
function ortam() {
  const yigin = [{ state: null, url: '#/a' }]; let i = 0; const dinle = {}; const kuyruk = [];
  const history = { get state() { return yigin[i].state; }, pushState(s) { yigin.splice(i + 1); yigin.push({ state: s, url: yigin[i].url }); i++; }, back() { kuyruk.push(() => { if (i > 0) { i--; dinle.popstate(); } }); } };
  const ctx = { history, Date, window: { addEventListener: (k, f) => { dinle[k] = f; } }, setTimeout: (f) => kuyruk.push(f) }; vm.createContext(ctx); vm.runInContext(`${parca}\nthis.geriKayit = geriKayit;`, ctx);
  return { kayit: ctx.geriKayit, git: (url) => { yigin.splice(i + 1); yigin.push({ state: null, url }); i++; }, geri: () => history.back(), bosalt: () => { while (kuyruk.length) kuyruk.shift()(); }, get url() { return yigin[i].url; }, get derinlik() { return i; } };
}
{ const o = ortam(); let k = 0; o.kayit(() => { k++; }); assert.equal(o.derinlik, 1); o.geri(); o.bosalt(); assert.equal(k, 1); assert.equal(o.derinlik, 0); assert.equal(o.url, '#/a'); ok('geri tuşu modalı kapatır, sayfa değişmez'); }
{ const o = ortam(); let k = 0; const birak = o.kayit(() => { k++; }); birak(); o.bosalt(); assert.equal(k, 0); assert.equal(o.derinlik, 0); ok('düğmeyle kapanınca geçmişte kalıntı kalmaz'); }
{ const o = ortam(); const a = []; o.kayit(() => a.push('alt')); o.kayit(() => a.push('üst')); o.geri(); o.bosalt(); assert.deepEqual(a, ['üst']); o.geri(); o.bosalt(); assert.deepEqual(a, ['üst', 'alt']); assert.equal(o.derinlik, 0); ok('iç içe modal birer birer kapanır'); }
{ const o = ortam(); const birak = o.kayit(() => {}); birak(); o.git('#/b'); o.bosalt(); assert.equal(o.url, '#/b'); ok('kapanışla aynı anda yönlendirme yapılırsa yeni sayfa geri alınmaz'); }
{ const o = ortam(); let k = 0; o.kayit(() => { k++; }, true); o.geri(); o.bosalt(); assert.equal(k, 0); assert.equal(o.derinlik, 1); ok('kapatılamayan modal geri tuşuyla kapanmaz'); }

// Çift dokunma
assert.match(js, /let mesgul = false;\n\s+btn\.onclick = \(\) => \{ if \(mesgul\) return undefined; mesgul = true;/); ok('modal düğmesi işlem bitmeden ikinci basışı almaz');
assert.ok(js.includes("ov.classList.add('nv-kilit')")); assert.ok(css.includes('.nv-kilit .ns-modal { pointer-events: none; }')); assert.ok(js.includes('e.target === ov && !kilit')); ok('hızlı ikinci dokunuş yeni açılan pencereye geçmez, pencereyi de kapatmaz');

// Tablo: telefonda satır kartı
assert.match(js, /function yiginHazirla\(t\)/); assert.match(js, /if \(ths\.length > 10 \|\| ths\.some/); assert.match(tel, /@media screen and \(max-width: 700px\) \{[\s\S]*\.ns-yigin thead \{ display: none; \}/); ok('on sütuna kadar tablo telefonda satır kartı, yazdırmada tablo kalır');
assert.match(js, /<label class="ns-selh"><input type="checkbox" class="ns-rsel"/); ok('satır seçimi 44 px dokunma alanında');

// Şablonu olmayan program ayarlar sayfasında konsola 404 düşürmez
const cat = require('../cloud/catalog'); const sablon = require('../cloud/sablon');
assert.match(oku('server/cloud/katalog-api.js'), /!sablon\.programVar\(p\) && !cat\.kayitli\(p\)/); ['dugun', 'dernek', 'egitim', 'fotograf', 'danisan'].forEach((p) => { assert.ok(cat.kayitli(p), p); assert.ok(!sablon.programVar(p), p); assert.ok(Array.isArray(sablon.liste(p))); }); assert.ok(!cat.kayitli('yok')); ok('yeni programlar boş şablon listesi alır, olmayan program 404');
assert.match(oku('core/katalog.js'), /if \(L\.length && NS\.cloud\) NS\.api\('POST', '\/api\/katalog\/oneri'/); ok('demoda ürün önerisi istek atmaz');

console.log(`\n${passed} denetim geçti`);
