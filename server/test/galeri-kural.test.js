// Galeri vitrin kuralı: ekspertiz bilgisi vitrine gider, alış ve kâr bilgisi gitmez
//   node server/test/galeri-kural.test.js
const assert = require('assert'); const R = require('../cloud/public-rules').galeri;
let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };
const f = R.pub.vehicles.fields;

assert.ok(f.includes('expertise')); ok('expertise alanı vitrine gider: girilmeyen ekspertiz "orijinal" görünmez');
assert.ok(f.includes('photos')); ok('Fotoğraflar vitrine gider');
for (const k of ['buy', 'minPrice', 'expenses', 'owner', 'option', 'optLog', 'sale', 'commission', 'ownerPays', 'plate']) assert.ok(!f.includes(k), k);
ok('Alış, en düşük fiyat, masraf, araç sahibi, opsiyon sahibi ve plaka vitrine gitmez');
assert.ok(R.pub.vehicles.where({ status: 'satista' }) && R.pub.vehicles.where({ status: 'opsiyon' }));
assert.ok(!R.pub.vehicles.where({ status: 'hazirlik' }) && !R.pub.vehicles.where({ status: 'satildi' }));
ok('Vitrinde yalnızca satışta ve opsiyonlu araçlar görünür');
console.log(`\n${n} test geçti`);
