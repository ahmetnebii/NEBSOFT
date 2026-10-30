/* Kuyumcu — ayar, milyem, işçilik ve kasa hesabı testi: node apps/kuyumcu/hesap.test.js
   Beklenen değerler elle hesaplandı (1 gr has kuru 4.000 ₺). Mevzuat dayanakları: docs/urun/KUYUMCU.md §1 */
'use strict';
const assert = require('assert');
global.window = global; global.NS = {};
require('./data.js');
const K = window.KYM; let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const eq = assert.strictEqual;
const S = { hasBuy: 3900, hasSell: 4000, coinBuyCut: 1, coinSellAdd: 2, scrapCut: 2 };

// Ayar → milyem → has
eq(K.milyem(22), 0.916); eq(K.milyem('14'), 0.585); eq(K.milyem(24), 0.995); eq(K.milyem(9), 0.375); eq(K.milyem(0.75), 0.75); eq(K.milyem(0), 0); ok('Milyem: ayar tablosu, tablodışı ayar n/24, milyem girişi');
eq(K.has(10, 22), 9.16); eq(K.has(3.33, 14), 1.948); eq(K.has(1, 24), 0.995); eq(K.has(0, 22), 0); ok('Has = gram × milyem (3 hane)');

// Takı: altın + işçilik + taş = fiyat
{ const p = K.itemPrice({ g: 10, ayar: 22, labor: 100 }, 4000); eq(p.has, 9.16); eq(p.labor, 1000); eq(p.price, 37640); eq(p.gold, 36640); ok('22 ayar 10 gr, 100 ₺/gr işçilik: 9,16 × 4000 + 1000 = 37.640 ₺'); }
{ const p = K.itemPrice({ g: 10, ayar: 22, labor: 25, laborType: 'mil' }, 4000); eq(p.labor, 1000); eq(p.price, 37640); ok('Milyem işçilik: 10 gr × 25 milyem = 0,25 gr has = 1.000 ₺'); }
{ const p = K.itemPrice({ g: 5, ayar: 18, labor: 200, stoneG: 1, stoneVal: 2500 }, 4000); eq(p.has, 3); eq(p.labor, 1000); eq(p.stone, 2500); eq(p.price, 15500); eq(K.r2(p.gold + p.labor + p.stone), p.price); ok('Taş ağırlığı hastan düşer, taş bedeli eklenir; kalemler toplamı fiyatı tutar'); }
{ const p = K.itemPrice({ g: 3.37, ayar: 14, labor: 137 }, 4187.35); eq(p.price, Math.round(1.971 * 4187.35 + 461.69)); eq(K.r2(p.gold + p.labor + p.stone), p.price); ok('Yuvarlama: fiyat tam TL, kuruş farkı altın kalemine yazılır'); }

// Sikke
{ const c = K.COINS.find((x) => x.id === 'ceyrek'); eq(K.coinUnit(c, S, 'sell'), Math.round(1.75 * 0.916 * 4000 * 1.02)); eq(K.coinUnit(c, S, 'buy'), Math.round(1.75 * 0.916 * 3900 * 0.99)); const l = K.coinLine(c, 3, S, 'sell'); eq(l.price, l.unit * 3); eq(l.has, 4.809); ok('Sikke: makaslı birim fiyat, adet × birim, has'); }
{ const r = K.rates(S); const c = r.coin.find((x) => x.id === 'tam'); assert.ok(c.sell > c.buy); eq(r.ayar.find((a) => a.ayar === 14).sell, 2340); ok('Kur tablosu ayar ve sikke fiyatı'); }

// Hurda
{ const l = K.scrapLine(12.5, 0.5, 22, S); eq(l.g, 12); eq(l.has, 10.992); eq(l.price, Math.round(10.992 * 3900 * 0.98)); ok('Hurda: brüt - fire = net, has × alış × (1 - kesinti)'); }
eq(K.scrapLine(1, 1, 22, S), null); eq(K.scrapLine('', '', 22, S), null); ok('Hurda: net gram sıfırsa satır oluşmaz');

// Kur durumu ve kaynak
{ const now = Date.parse('2026-10-30T12:00:00Z'); const base = { hasBuy: 1, hasSell: 2, rateSource: 'Elle: Toptancı', rateAt: '2026-10-30T11:30:00Z', rateMaxAge: 60 }; eq(K.rateState({ ...base, hasBuy: 0 }, now).level, 'yok'); eq(K.rateState({ ...base, rateSource: 'ornek' }, now).level, 'ornek'); eq(K.rateState(base, now).level, 'ok'); eq(K.rateState({ ...base, rateAt: '2026-10-30T10:00:00Z' }, now).level, 'eski'); eq(K.rateState({ ...base, rateAt: '' }, now).level, 'eski'); eq(K.sourceText({}), 'Kaynak belirtilmemiş'); eq(K.sourceText({ rateSource: 'ornek' }), 'Örnek veri'); ok('Kur: yok / örnek / süresi dolmuş / güncel; kaynak yoksa "belirtilmemiş" yazar'); }
{ eq(K.parseRate({ hasBuy: 10, hasSell: 11 }).hasSell, 11); eq(K.parseRate({ alis: '4.120,50', satis: '4.185,75' }).hasBuy, 4120.5); eq(K.parseRate({ HAS: { alis: 1, satis: 2 } }).hasBuy, 1); assert.throws(() => K.parseRate({ price: 5 }), /bulunamadı/); assert.throws(() => K.parseRate({ alis: 5, satis: 4 }), /alıştan düşük/); ok('Kur servisi: bilinen alanlar okunur, bilinmeyen tahmin edilmez, ters kur reddedilir'); }
{ const x = K.parseTcmb('<Tarih_Date Tarih="27.10.2026" Date="10/27/2026" Bulten_No="2026/203"><Currency Kod="USD"><ForexSelling>49.7892</ForexSelling></Currency><Currency Kod="AUD"><ForexSelling>1</ForexSelling></Currency><Currency Kod="EUR"><ForexSelling>57.1</ForexSelling></Currency></Tarih_Date>'); eq(x.usd, 49.7892); eq(x.eur, 57.1); eq(x.date, '27.10.2026'); assert.throws(() => K.parseTcmb('<a/>'), /bulunamadı/); ok('TCMB XML: USD/EUR satış ve tarih'); }

// Numara, kâr, kapatma
eq(K.nextNo([{ no: 'S10009' }, { no: 'A10050' }, { no: 'S10003' }], 'S', 10000), 'S10010'); eq(K.nextNo([], 'K', 5000), 'K5000'); ok('Numara silme sonrası çakışmaz, tür önekine göre artar');
{ const sat = { type: 'satis', hasBuy: 3900, lines: [{ has: 1, price: 4500 }] }; eq(K.margin(sat, 9999), 600); eq(K.margin({ ...sat, disc: 100 }, 9999), 500); eq(K.margin({ ...sat, canceled: { at: 'x' } }, 9999), 0); eq(K.margin({ type: 'alis', hasBuy: 3900, lines: [{ has: 1, price: 3800 }] }, 9999), 100); eq(K.margin({ type: 'emanet', lines: [{ has: 50, price: 0 }] }, 3900), 0); eq(K.margin({ type: 'siparis', lines: [{ has: 0, price: 500 }] }, 3900), 0); eq(K.margin({ type: 'satis', hasRate: 4000, lines: [{ has: 1, price: 4500 }] }, 3900), 600); ok('Brüt kâr işlem anı kuruyla; indirim düşer; iptal, emanet ve sipariş kâr sayılmaz'); }
{ const g = K.goldPay([{ kind: 'item', has: 9.16, labor: 1000, stone: 0, price: 37640 }, { kind: 'coin', has: 1.603, price: 7000 }]); eq(g.has, 10.763); eq(g.tl, 1000); ok('Altın hesabından ödeme işçiliği bedava bırakmaz'); }
{ const b = K.specialBase({ type: 'satis', hasRate: 4000, lines: [{ has: 9.16, price: 37640 }] }); eq(b.gold, 36640); eq(b.base, 1000); eq(K.specialBase({ type: 'alis', lines: [] }), null); eq(K.specialBase({ type: 'satis', canceled: {}, lines: [] }), null); ok('KDV md. 23/e dökümü: matrah = satış - külçe bedeli'); }
{ const d = '2026-10-30'; const tx = [{ customer: 'c', type: 'satis', at: d + 'T10:00:00Z', total: 100000 }, { customer: 'c', type: 'alis', at: d + 'T11:00:00Z', total: 60000 }, { customer: 'c', type: 'satis', at: d + 'T11:00:00Z', total: 90000, canceled: {} }, { customer: 'c', type: 'satis', at: '2026-10-29T11:00:00Z', total: 90000 }, { customer: 'x', type: 'satis', at: d + 'T11:00:00Z', total: 90000 }]; eq(K.linkedTotal(tx, 'c', d), 160000); eq(K.linkedTotal(tx, null, d), 0); eq(K.needsId(30000, 160000, 185000), true); eq(K.needsId(20000, 160000, 185000), false); eq(K.needsId(185000, 0), true); ok('Kimlik sınırı: tek işlem veya aynı gün bağlantılı işlemler toplamı'); }
{ const data = { items: [{ status: 'stok', g: 10, ayar: 22 }, { status: 'satildi', g: 10, ayar: 22 }], coins: { gram: 2 }, tx: [{ type: 'alis', lines: [{ kind: 'hurda', has: 5 }, { kind: 'coin', has: 1 }] }, { type: 'alis', canceled: {}, lines: [{ kind: 'hurda', has: 9 }] }], supMoves: [{ kind: 'hurda', has: 2 }, { kind: 'tl', tl: 5 }], suppliers: [{ hasDebt: 4 }], customers: [{ hasBalance: 1.5 }] }; eq(K.scrapHas(data), 3); const P = K.position(data); eq(P.items, 9.16); eq(P.coins, 1.99); eq(P.net, K.r3(9.16 + 1.99 + 3 - 4 - 1.5)); ok('Has pozisyonu: stok + sikke + hurda - toptancı - eski hesap'); }
console.log(`\n${n} test geçti`);
