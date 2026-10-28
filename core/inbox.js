/* Webhook gelen kutusu istemcisi: server.js /api/webhook/<kanal> ile gelen sipariş bildirimlerini okur ve
   farklı platform biçimlerini tek bir sipariş yapısına çevirir. Platformun gönderdiği alan adları değişebildiği için
   yaygın adların tümü denenir; eşleşmeyen kalemler adıyla korunur. */
(function () {
  'use strict';
  const pickv = (o, keys) => { for (const k of keys) { const v = k.split('.').reduce((a, x) => (a == null ? a : a[x]), o); if (v !== undefined && v !== null && v !== '') return v; } return undefined; };
  const num = (v) => { const n = Number(typeof v === 'object' && v ? v.amount ?? v.value : v); return Number.isFinite(n) ? n : 0; };
  function normalize(body) {
    const b = body && (body.order || body.data || body.payload) ? body.order || body.data || body.payload : body || {};
    const lines = pickv(b, ['items', 'lines', 'products', 'orderItems', 'lineItems', 'basket.items']) || [];
    const c = pickv(b, ['customer', 'client', 'shippingAddress', 'deliveryAddress', 'address']) || {};
    return {
      orderNo: String(pickv(b, ['orderNumber', 'orderNo', 'orderId', 'order_id', 'code', 'id']) || ''),
      customer: { name: String(pickv(c, ['name', 'fullName', 'firstName']) || pickv(b, ['customerName']) || ''), phone: String(pickv(c, ['phone', 'phoneNumber', 'gsm']) || ''), address: String(pickv(c, ['address', 'fullAddress', 'addressText', 'description']) || pickv(b, ['deliveryAddress.address', 'address.text']) || '') },
      items: (Array.isArray(lines) ? lines : []).map((l) => ({ name: String(pickv(l, ['name', 'productName', 'title', 'product.name']) || ''), code: String(pickv(l, ['barcode', 'sku', 'merchantSku', 'productId', 'externalId', 'id', 'product.id']) || ''), qty: Number(pickv(l, ['quantity', 'qty', 'count', 'amount']) || 1), price: num(pickv(l, ['price', 'unitPrice', 'salePrice', 'priceWithDiscount'])), note: String(pickv(l, ['note', 'comment']) || '') })),
      total: num(pickv(b, ['totalPrice', 'total', 'totalAmount', 'price'])),
      paid: !/kap[ıi]da|cash|nakit|door/i.test(String(pickv(b, ['paymentMethod', 'payment.type', 'paymentType']) || 'online')),
      note: String(pickv(b, ['note', 'clientNote', 'customerNote', 'comment']) || ''),
    };
  }
  async function drain(channel) {
    try { const r = await fetch('/api/inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel }) }); const j = await r.json(); return j.ok ? j.items.map((x) => ({ ...normalize(x.body), raw: x.body, receivedAt: x.at })) : []; } catch (e) { return null; }
  }
  // Köprü çalışıyor mu (dosyadan açıldıysa canlı özellikler kapalı kalır)
  let up = null;
  async function online() { if (up !== null) return up; try { const r = await fetch('/api/durum'); up = r.ok; } catch (e) { up = false; } return up; }
  window.NS = window.NS || {};
  window.NS.inbox = { drain, normalize, online };
})();
