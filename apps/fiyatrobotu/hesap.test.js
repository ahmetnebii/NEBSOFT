/* Kâr & Fiyat Robotu — kâr hesabı, taban koruması, rakip kaynağı ve içe aktarma testi: node apps/fiyatrobotu/hesap.test.js
   Beklenen değerler elle hesaplandı. Kaynaklar: docs/urun/FIYAT-ROBOTU.md */
'use strict';
const assert = require('assert');
global.window = global; global.NS = {};
require('./data.js');
const F = window.FRB; let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); }; const eq = assert.strictEqual;
const B = { cost: 250, vat: 20, com: 17, fee: 8.49, cargo: 66, extra: 6 };
const S = { minMargin: 8, ending: 0.9, maxStep: 20 };
const Lx = (o = {}) => ({ price: 599, strategy: 'buybox', comps: [{ price: 500 }], undercut: 1, maxPrice: null, minPrice: null, targetMargin: 15, ...o });

// Kâr
{ const r = F.calc({ ...B, price: 600 }); eq(F.r2(r.netSale), 500); eq(F.r2(r.comEx), 85); eq(F.r2(r.comAmt), 102); eq(r.profit, F.r2(500 - 250 - 85 - 74.49 / 1.2 - 6)); eq(r.profit, 96.93); ok('Kâr: 600 ₺ → net 500, komisyon 85, kargo+bedel KDV hariç, paket, maliyet'); }
eq(F.calc({ ...B, price: 600, comNet: true }).profit, F.calc({ ...B, price: 600 }).profit); ok('Komisyon tabanı: %20 KDV\'de iki yöntem aynı sonucu verir');
{ const a = F.calc({ ...B, vat: 10, price: 600 }).profit; const b = F.calc({ ...B, vat: 10, price: 600, comNet: true }).profit; eq(F.r2(a), F.r2(600 / 1.1 - 250 - 600 * 0.17 / 1.2 - 74.49 / 1.2 - 6)); eq(F.r2(b), F.r2(600 / 1.1 - 250 - (600 / 1.1) * 0.17 - 74.49 / 1.2 - 6)); assert.ok(b < a); ok('Komisyon tabanı: %10 KDV\'de iki yöntem ayrışır (sözleşmeyle seçilir)'); }
{ const r = F.calc({ ...B, price: 600, ad: 5 }); eq(F.r2(r.adEx), 25); eq(r.profit, F.r2(96.93 - 25)); ok('Reklam gideri kârdan düşer'); }
for (const m of [0, 8, 15, 30]) for (const o of [{}, { ad: 5 }, { vat: 10, comNet: true }]) { const p = F.priceFor({ ...B, ...o, margin: m }); const r = F.calc({ ...B, ...o, price: p }); assert.ok(Math.abs(r.margin - m) <= 0.1, `marj ${m} → ${r.margin}`); } ok('priceFor ile calc tutarlı: hesaplanan fiyat hedef marjı verir');
eq(F.priceFor({ ...B, com: 95, margin: 8 }), null); ok('Mümkün olmayan marj null döner');
eq(F.cargoOf('trendyol', 2), 66); eq(F.cargoOf('trendyol', 22), 175 + 14); eq(F.cargoOf('trendyol', 2, [[5, 10]]), 10); ok('Kargo: desi basamağı, üstü desi başı, satıcı tablosu');

// Taban koruması
{ const fl = F.floor(B, null, 8); const r = F.propose(Lx(), B, S); assert.ok(r.to >= fl, `${r.to} < ${fl}`); assert.match(r.why, /taban fiyatta durdu/); assert.ok(F.calc({ ...B, price: r.to }).margin >= 8); ok('Rakip tabanın altında: fiyat tabanda durur, marj korunur'); }
{ const r = F.propose(Lx({ maxPrice: 300 }), B, S); assert.ok(r.skip && /Tavan/.test(r.skip)); ok('Tavan < taban: tabanın altına inmek yerine öneri yapılmaz'); }
assert.match(F.propose(Lx(), { ...B, cost: 0 }, S).skip, /Maliyet/); ok('Maliyet girilmemişse öneri yok');
assert.match(F.propose(Lx(), { ...B, com: 95 }, S).skip, /mümkün değil/); ok('Taban hesaplanamıyorsa koruma sessizce kapanmaz');
eq(F.propose(Lx({ strategy: 'sabit' }), B, S), null); eq(F.propose(Lx({ comps: [] }), B, S), null); ok('Sabit strateji ve rakipsiz buybox öneri üretmez');
{ const r = F.propose(Lx({ comps: [{ price: 900 }], price: 700 }), B, S); eq(r.to, 898.9); ok('Rakip pahalıysa fiyat yukarı çıkar, sonu ,90'); }
{ const r = F.propose(Lx({ comps: [{ price: 900 }], price: 700, maxPrice: 800 }), B, S); assert.ok(r.to <= 800); ok('Tavan aşılmaz'); }
{ const r = F.propose(Lx({ comps: [{ price: 900 }], price: 500 }), B, S); eq(r.big, true); eq(F.propose(Lx({ comps: [{ price: 700 }], price: 650 }), B, S).big, false); ok('Büyük değişiklik işaretlenir (toplu hatalı fiyat koruması)'); }
eq(F.ending(123.4, 0.9), 122.9); eq(F.ending(123.95, 0.9), 123.9); eq(F.ending(100.5, 0.9, 100.5), 100.9); eq(F.ending(99.95, 0.9, 99.95, 100), 99.95); eq(F.ending(10.123, 'x'), 10.12); ok('Fiyat sonu: aşağı yuvarlar, taban altına ve tavan üstüne çıkmaz');

// Rakip kaynağı
{ const now = Date.parse('2026-10-30T12:00:00Z'); eq(F.compsReal({ comps: [{ price: 1 }] }, now), false); eq(F.compsReal({ comps: [] }, now), true); eq(F.compsReal({ comps: [{ price: 1, source: 'x' }], compAt: '2026-10-30T01:00:00Z' }, now), true); eq(F.compsReal({ comps: [{ price: 1, source: 'x' }], compAt: '2026-10-28T01:00:00Z' }, now), false); eq(F.compsReal({ comps: [{ price: 1, source: 'x' }] }, now), false); ok('Rakip fiyatı: kaynak ve tazelik yoksa gerçek sayılmaz'); }
{ const L = {}; F.applyBuybox(L, { buyboxOrder: 2, buyboxPrice: 100, secondBuyboxPrice: 110, thirdBuyboxPrice: 120, hasMultipleSeller: true }, 'src', 'at'); eq(L.buybox, false); eq(L.buyboxOrder, 2); assert.deepStrictEqual(L.comps.map((c) => c.price), [100, 120]); eq(L.comps[0].source, 'src'); F.applyBuybox(L, { buyboxOrder: 1, buyboxPrice: 100, hasMultipleSeller: false }, 'src', 'at'); eq(L.buybox, true); eq(L.comps.length, 0); ok('Buybox yanıtı: kendi sıramız rakip sayılmaz, tek satıcıda rakip yok'); }
{ const q = F.buyboxReq({ sellerId: '12', apiKey: 'a', apiSecret: 'b' }, ['1', '2']); assert.match(q.url, /^https:\/\/apigw\.trendyol\.com\/integration\/product\/sellers\/12\/products\/buybox-information$/); eq(q.method, 'POST'); eq(q.headers.Authorization, 'Basic ' + Buffer.from('a:b').toString('base64')); assert.deepStrictEqual(JSON.parse(q.body), { barcodes: ['1', '2'] }); ok('Buybox isteği resmî dokümana uygun'); }

// Sayı ve içe aktarma
eq(F.parseNum('1.234,56'), 1234.56); eq(F.parseNum('249,90'), 249.9); eq(F.parseNum('249.90'), 249.9); eq(F.parseNum('1,234.56'), 1234.56); eq(F.parseNum('₺ 99'), 99); eq(F.parseNum(12.5), 12.5); eq(F.parseNum('1.234'), null); eq(F.parseNum('1,234'), null); eq(F.parseNum('abc'), null); eq(F.parseNum(''), null); ok('Türkçe sayı: nokta-virgül belirsizse tahmin edilmez');
eq(F.chKey('Trendyol'), 'trendyol'); eq(F.chKey('HB'), 'hepsiburada'); eq(F.chKey('Amazon TR'), 'amazon'); eq(F.chKey('Getir'), null); ok('Kanal adı eşleme');
{ const P = [{ id: 'p', barcode: '86', sku: 'S' }]; const L = [{ id: 'l', pid: 'p', ch: 'trendyol', comps: [{ price: 1 }], buybox: true }]; const I = F.importComps([{ Barkod: '86', Kanal: 'Trendyol', 'Rakip fiyat': '1.234,50', Satıcı: 'A' }, { 'Stok kodu': 'S', Kanal: 'TY', 'Rakip fiyat': '1.300,00' }, { Barkod: 'yok', Kanal: 'Trendyol', 'Rakip fiyat': '5' }, { Barkod: '86', Kanal: 'n11', 'Rakip fiyat': '5' }, { Barkod: '86', Kanal: 'Trendyol', 'Rakip fiyat': '1.234' }], P, L, 'Dosya: x', 'AT'); eq(I.errs.length, 3); assert.match(I.errs[2], /6\. satır/); eq(L[0].comps.length, 1); eq(I.apply(), 1); eq(L[0].comps.length, 2); eq(L[0].comps[0].price, 1234.5); eq(L[0].comps[0].source, 'Dosya: x'); eq(L[0].buybox, false); ok('Rakip dosyası: hatalı satır uygulanmaz, numarasıyla bildirilir, onaya kadar veri değişmez'); }
assert.deepStrictEqual(F.batchFails([{ barcode: 'a', status: 'SUCCESS', reasons: [] }, { barcode: 'b', status: 'FAILED', reasons: ['Fiyat hatalı'] }, { barcode: 'c', status: 'X', errors: ['e'] }]).map((x) => x.barcode), ['b', 'c']); ok('Toplu gönderim sonucu: hatalı kalemler ayrılır');
{ const x = F.scenario([{ id: 'a', price: 600, params: B }, { id: 'b', price: 480, params: B }], { costPct: 20 }); eq(x.lossB, 0); assert.ok(x.lossA >= 1); assert.ok(x.sumA < x.sumB); eq(x.list[0].id, 'b'); assert.ok(F.calc({ ...B, cost: 300, price: x.list[0].need }).profit >= 0); ok('Senaryo: zarara geçenler ve başa baş fiyat'); }
eq(F.LIVE.includes('hepsiburada'), false); eq(F.LIVE.includes('amazon'), false); assert.ok(F.UNVERIFIED.hepsiburada); ok('Doğrulanmayan kanal canlı listesinde yok');
console.log(`\n${n} test geçti`);
