// Adaptör testleri: node server/test/kanal.test.js
process.env.NEBSOFT_MOCK = 'http://127.0.0.1:5099';
const assert = require('assert');
const mock = require('./mock-pazaryeri');
const kanal = require('../connectors');
const TY = { sellerId: '482913', apiKey: 'tykey', apiSecret: 'tysecret' };
const HB = { sellerId: 'LINA-HB', apiKey: 'hbuser', apiSecret: 'hbkey' };
(async () => {
  const m = await mock.start(5099); let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('✓', name); };
  try {
    await t('Trendyol bağlantı testi + Basic auth + User-Agent', async () => { const r = await kanal.run('trendyol', 'baglanti-test', TY); assert.ok(r.ok, r.error); const e = m.log.at(-1); assert.equal(e.path, '/integration/order/sellers/482913/orders'); assert.equal(e.ua, '482913 - SelfIntegration'); });
    await t('Trendyol yanlış anahtar → anlaşılır yetki hatası', async () => { const r = await kanal.run('trendyol', 'baglanti-test', { ...TY, apiSecret: 'x' }); assert.equal(r.ok, false); assert.match(r.error, /Yetki hatası/); });
    await t('Trendyol sipariş çekme ve eşleme', async () => { const r = await kanal.run('trendyol', 'siparis-cek', TY, {}); assert.ok(r.ok); assert.equal(r.data.orders.length, 3); const o = r.data.orders[0]; assert.equal(o.orderNo, 'TY100'); assert.equal(o.items[0].sku, 'LB100-SIY-S'); assert.equal(o.customer.city, 'İstanbul'); const q = m.log.at(-1).query; assert.equal(q.status, 'Created'); assert.ok(Number(q.endDate) - Number(q.startDate) <= 14 * 864e5); });
    await t('Trendyol stok-fiyat 1000\'lik parti + batch kimliği', async () => { const items = Array.from({ length: 2300 }, (_, i) => ({ barcode: 'B' + i, stock: 5, price: 100 })); const before = m.log.length; const r = await kanal.run('trendyol', 'stok-fiyat', TY, { items }); assert.ok(r.ok); assert.equal(r.data.batches.length, 3); const calls = m.log.slice(before); assert.equal(calls[0].body.items.length, 1000); assert.equal(calls[2].body.items.length, 300); assert.deepEqual(Object.keys(calls[0].body.items[0]).sort(), ['barcode', 'listPrice', 'quantity', 'salePrice']); });
    await t('Trendyol batch durumu', async () => { const r = await kanal.run('trendyol', 'batch-durum', TY, { batchId: 'b-1' }); assert.ok(r.ok); assert.equal(r.data.status, 'COMPLETED'); });
    await t('Trendyol paket durum bildirimi', async () => { const r = await kanal.run('trendyol', 'kargo-bildir', TY, { packageId: 9000, lines: [{ lineId: 1, qty: 1 }], status: 'Picking' }); assert.ok(r.ok, r.error); const e = m.log.at(-1); assert.equal(e.method, 'PUT'); assert.equal(e.body.status, 'Picking'); });
    await t('Trendyol soru çek / yanıtla', async () => { const r = await kanal.run('trendyol', 'soru-cek', TY); assert.equal(r.data.questions[0].id, '77'); const a = await kanal.run('trendyol', 'soru-yanitla', TY, { question: '77', answer: 'Normal kalıp' }); assert.ok(a.ok); assert.equal(m.log.at(-1).body.text, 'Normal kalıp'); });
    await t('Trendyol ürün gönderimi marka/kategori olmadan engellenir', async () => { const r = await kanal.run('trendyol', 'urun-gonder', TY, { items: [{ barcode: 'X', title: 'Ürün', price: 10 }] }); assert.equal(r.ok, false); assert.match(r.error, /marka/); });
    await t('Eksik kimlik bilgisi', async () => { const r = await kanal.run('trendyol', 'siparis-cek', { sellerId: '1' }); assert.equal(r.ok, false); assert.match(r.error, /gerekli/); });
    await t('Hepsiburada bağlantı + stok + sipariş', async () => { assert.ok((await kanal.run('hepsiburada', 'baglanti-test', HB)).ok); const s = await kanal.run('hepsiburada', 'stok-fiyat', HB, { items: [{ sku: 'LB101-BEJ-M', stock: 4, price: 575 }] }); assert.ok(s.ok); assert.equal(m.log.at(-1).path, '/listings/merchantid/LINA-HB/inventory-uploads'); assert.equal(m.log.at(-1).body[0].availableStock, 4); const o = await kanal.run('hepsiburada', 'siparis-cek', HB); assert.equal(o.data.orders[0].orderNo, 'HB555'); assert.equal(o.data.orders[0].total, 1150); });
    await t('Desteklenmeyen kanal açıklayıcı yanıt', async () => { const r = await kanal.run('getir', 'stok-fiyat', {}); assert.equal(r.unsupported, true); assert.match(r.error, /webhook/); });
    await t('Webhook: belirteç doğrulama ve gelen kutusu', async () => { assert.equal(kanal.pushIn('getir', 'yanlis', {}).code, 401); assert.equal(kanal.pushIn('getir', kanal.token(), { orderId: 'G1' }).code, 200); const items = kanal.drain('getir'); assert.equal(items.at(-1).body.orderId, 'G1'); assert.equal(kanal.drain('getir').length, 0); });
    console.log(`\n${n} test geçti`);
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await m.close(); }
})();
