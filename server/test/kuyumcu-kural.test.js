// Kuyumcu bulut kuralı: vitrin ekranına yalnızca kur bilgisi gider, dışarıdan yazma yoktur
//   node server/test/kuyumcu-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').kuyumcu;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

assert.ok(Array.isArray(R.settings), 'beyaz liste olmalı (yoksa gizli anahtarlar hariç tüm ayarlar gider)');
['hasBuy', 'hasSell', 'rateAt', 'rateSource', 'rateMaxAge', 'coinBuyCut', 'coinSellAdd', 'scrapCut', 'bizName'].forEach((k) => assert.ok(R.settings.includes(k), k));
ok('Vitrin hesabı ve kaynak gösterimi için gereken alanlar gider');
['rateUrl', 'idLimit', 'discMax', 'saleNote', 'buyNote', 'laborDefault', 'docTemplates', 'hiddenNav', 'bizAddress'].forEach((k) => assert.ok(!R.settings.includes(k), k));
ok('Kur servisi adresi, kurallar, işçilik ve belge şablonu vitrine gitmez');
assert.deepStrictEqual(R.pub, {}); assert.deepStrictEqual(R.write, {}); assert.strictEqual(R.login, undefined); assert.strictEqual(R.view, undefined);
ok('Müşteri, stok, işlem ve kasa verisi açılmaz; dışarıdan yazma yok');
console.log(`\n${n} test geçti`);
