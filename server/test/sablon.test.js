// Şablon kütüphanesi testi (veritabanı gerekmez): her program için şema doğrulaması, fiyat yasağı, avukat uyarısı, idempotent içe aktarma, sample kuralı.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const S = require('../cloud/sablon');
const M = require('../../core/sablon');
const B = require('../../core/bizsite');
let n = 0; const ok = (a) => { n++; console.log('  ✓', a); };

// ---------- Şablonlu programlar: her dosya şemadan geçer ----------
const tum = [];
for (const p of S.PROGRAMLAR) {
  const d = path.join(S.KOK, p); assert.ok(fs.existsSync(d), p + ': şablon klasörü yok');
  const f = fs.readdirSync(d).filter((x) => x.endsWith('.json')); assert.ok(f.length, p + ': şablon yok');
  for (const x of f) { const s = JSON.parse(fs.readFileSync(path.join(d, x), 'utf8')); assert.deepEqual(S.dogrula(s, { program: p, ad: x.replace('.json', '') }), [], `${p}/${x}`); tum.push(s); }
  assert.equal(S.liste(p).length, f.length, p + ': sunucu listesi eksik');
  ok(`${p}: ${f.length} şablon şemadan geçti`);
}
assert.equal(S.PROGRAMLAR.length, 40); ok('şablon listesindeki 40 programın hepsinde şablon var');
for (const s of tum) assert.deepEqual(S.fiyatBul({ v: s.varsayilan, k: s.kayitlar }), [], s.sablon);
ok('hiçbir şablonda fiyat yok (boş gelir)');
for (const s of tum.filter((x) => x.tur === 'form')) { assert.match(s.uyari, /örnek/i); assert.match(s.uyari, /avukat/i); } ok('her form şablonunda "örnek metin, avukata gösterin" uyarısı var');
assert.ok(S.liste('eczane').every((s) => s.tur === 'form')); ok('eczane ürün şablonu almaz');
assert.ok(!JSON.stringify(tum.filter((s) => s.tur !== 'form')).match(/"barcode":"\d/)); ok('şablonlarda uydurma barkod yok');

// ---------- Doğrulayıcı kötü şablonu yakalar ----------
const iyi = () => JSON.parse(JSON.stringify(S.bul('oto/yikama-paketleri')));
let k = iyi(); k.kayitlar[0].price = 150; assert.ok(S.dogrula(k).some((x) => /fiyat/.test(x))); ok('fiyat içeren şablon reddedilir');
k = iyi(); k.kayitlar[1].anahtar = k.kayitlar[0].anahtar; assert.ok(S.dogrula(k).length); ok('tekrarlı anahtar reddedilir');
k = JSON.parse(JSON.stringify(S.bul('klinik/hasta-onam'))); k.uyari = 'Örnektir'; assert.ok(S.dogrula(k).some((x) => /avukat/.test(x))); ok('avukat uyarısı olmayan form reddedilir');
k = JSON.parse(JSON.stringify(S.bul('klinik/hasta-onam'))); k.kayitlar[0].body += ' {{bilinmeyen}}'; assert.ok(S.dogrula(k).some((x) => /bilinmeyen/.test(x))); ok('metinde tanımsız alan reddedilir');
k = iyi(); k.program = 'eczane'; k.sablon = 'eczane/x'; assert.ok(S.dogrula(k).some((x) => /eczane/.test(x))); ok('eczaneye ürün şablonu reddedilir');

// ---------- İçe aktarma ----------
const say = (() => { let i = 0; return () => 'u' + (++i); })();
const menu = S.bul('adisyon/restoran-menu');
const d = { _meta: {}, _settings: {}, mcats: [{ id: 'k1', name: 'Tatlılar', color: '#000' }], menu: [{ id: 'm1', cat: 'k1', name: 'Künefe', price: 250, active: true }] };
const once = JSON.stringify(d.menu[0]);
const on = M.onizle(d, menu); assert.equal(on.find((x) => x.ad === 'Künefe').durum, 'ayni_ad'); assert.equal(on.find((x) => x.ad === 'Baklava').durum, 'yeni'); ok('önizleme eski kaydı "aynı ad" gösterir');
const r1 = M.uygula(d, menu, null, { uid: say }); assert.ok(r1.eklenen > 20); assert.equal(r1.atlanan, 1);
assert.equal(JSON.stringify(d.menu[0]), once); ok('eski kayıt değişmez (fiyatı ve durumu korunur)');
assert.equal(d.menu.filter((x) => x.name === 'Künefe').length, 1); ok('aynı adlı kayıt mükerrer açılmaz');
assert.equal(d.mcats.filter((x) => x.name === 'Tatlılar').length, 1); const bak = d.menu.find((x) => x.name === 'Baklava'); assert.equal(bak.cat, 'k1'); ok('kategori adı mevcut kaydın kimliğine bağlanır');
assert.ok(d.menu.slice(1).every((x) => x.kaynak === 'sablon' && x.onay === false && x.sablon_anahtar && x.price === 0 && x.active === false)); ok("kayıtlar kaynak:'sablon', onaysız, fiyatsız ve kapalı gelir");
const adet = d.menu.length; const kat = d.mcats.length; const r2 = M.uygula(d, menu, null, { uid: say }); assert.equal(r2.eklenen, 0); assert.equal(d.menu.length, adet); assert.equal(d.mcats.length, kat); ok('ikinci basış mükerrer açmaz (idempotent)');
d.menu.find((x) => x.name === 'Baklava').name = 'Fıstıklı baklava'; const r3 = M.uygula(d, menu, null, { uid: say }); assert.equal(r3.eklenen, 0); ok('adı değiştirilen şablon kaydı yeniden açılmaz');
const e = { _meta: {}, menu: [], mcats: [] }; const r4 = M.uygula(e, menu, ['baklava', 'ayran'], { uid: say }); assert.equal(r4.eklenen, 2); assert.equal(e.menu.length, 2); assert.equal(e.mcats.length, 2); assert.equal(e.menu.find((x) => x.name === 'Ayran').station, 'bar'); ok('yalnız seçilen kayıtlar aktarılır');
assert.equal(e._meta.sablonlar['adisyon/restoran-menu'].surum, 1); ok('aktarılan şablon sürümü kaydedilir');
const f = { _meta: {} }; const fo = S.bul('klinik/hasta-onam'); M.uygula(f, fo, null, { uid: say }); assert.equal(f.sablonFormlar.length, 2); assert.equal(f.sablonFormlar[0].id, 'sb-tedavi-onam'); assert.match(f.sablonFormlar[0].uyari, /avukat/); assert.equal(M.uygula(f, fo, null, { uid: say }).eklenen, 0); ok('form şablonu uyarısıyla eklenir, tekrar açılmaz');
const t = { _settings: { bizName: 'X' } }; const te = S.bul('randevu/sayfa-temalari'); M.uygula(t, te, ['gul']); assert.equal(t._settings.bookTema, 'gul'); assert.equal(t._settings.bizName, 'X'); assert.equal(M.uygula(t, te, ['gul']).eklenen, 0); assert.equal(M.uygula(t, te, null).eklenen, 0); assert.equal(t._settings.bookTema, 'gul'); assert.equal(M.uygula(t, te, ['mor']).eklenen, 1); assert.equal(t._settings.bookAccent, '#9333ea'); ok('tema yalnız kendi ayarlarını değiştirir, seçilmeden değişmez');

// ---------- Onay ve site kuralı ----------
const o = { _meta: {}, products: [] }; const sb = { sablon: 'pos/test', surum: 1, program: 'pos', tur: 'urun', ad: 'x', aciklama: 'y', kaynak: 'sablon', hedef: 'products', fiyatAlan: 'price', varsayilan: { price: 0 }, kayitlar: [{ anahtar: 'aa', name: 'Çay' }, { anahtar: 'bb', name: 'Kahve' }] };
M.uygula(o, sb, null, { uid: say }); o.products[0].price = 50; const on2 = M.onayla(o, sb); assert.deepEqual(on2, { onaylanan: 1, fiyatsiz: 1 }); assert.equal(o.products[0].onay, true); assert.equal(o.products[1].onay, false); ok('fiyatsız şablon kaydı onaylanamaz');
const site = B.clean({ name: 'Örnek İşletme', sections: { products: true }, products: [{ id: 'a', name: 'Kendi ürünüm', price: 10 }, { id: 'b', name: 'Şablon onaysız', price: 0, kaynak: 'sablon', onay: false }, { id: 'c', name: 'Şablon onaylı', price: 10, kaynak: 'sablon', onay: true }] });
assert.equal(site.products.length, 3); const html = B.render(site, { url: 'https://x.test/' }); assert.ok(html.includes('Kendi ürünüm')); assert.ok(html.includes('Şablon onaylı')); assert.ok(!html.includes('Şablon onaysız')); ok('onaysız şablon kaydı müşteri sitesinde yayınlanmaz, onaylı yayınlanır');
assert.ok(!B.sitemapUrls(B.clean({ name: 'Örnek İşletme', products: [{ name: 'Şablon onaysız', desc: 'x'.repeat(40), kaynak: 'sablon' }] }), { url: 'https://x.test/' }).some((u) => u.includes('sablon-onaysiz'))); ok('onaysız şablon site haritasına girmez');
assert.ok(fs.readFileSync(path.join(__dirname, '..', 'cloud', 'seo.js'), 'utf8').includes("p.kaynak === 'sablon' && !p.onay")); ok('sunucu yayınında da onaysız şablon süzülür');

console.log(`\nŞablon testi: ${n} denetim geçti`);
