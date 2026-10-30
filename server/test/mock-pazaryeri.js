// Test için Trendyol + Hepsiburada uç noktalarını taklit eden sahte sunucu. Gelen istekleri kaydeder.
const http = require('http');
const AUTH = { ty: 'Basic ' + Buffer.from('tykey:tysecret').toString('base64'), hb: 'Basic ' + Buffer.from('hbuser:hbkey').toString('base64') };
function start(port = 5099) {
  const log = []; let batch = 0;
  const pkgs = Array.from({ length: 3 }, (_, i) => ({ id: 9000 + i, orderNumber: 'TY' + (100 + i), orderDate: Date.now() - i * 3600e3, status: 'Created', customerFirstName: 'Ayşe', customerLastName: 'Kaya', totalPrice: 499.9, shipmentAddress: { fullAddress: 'Moda Cad. 1', city: 'İstanbul', district: 'Kadıköy', phone: '05320000000' }, lines: [{ id: 1 + i, barcode: 'LB100-SIY-S', merchantSku: 'LB100-SIY-S', productName: 'Saten Midi Elbise', quantity: 1, price: 499.9 }] }));
  const srv = http.createServer((req, res) => {
    let body = ''; req.on('data', (c) => { body += c; }); req.on('end', () => {
      const u = new URL(req.url, 'http://x'); const p = u.pathname; const j = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      const entry = { method: req.method, path: p, query: Object.fromEntries(u.searchParams), auth: req.headers.authorization, ua: req.headers['user-agent'], body: body ? JSON.parse(body) : null }; log.push(entry);
      if (p.startsWith('/integration/')) {
        if (req.headers.authorization !== AUTH.ty) return j(401, { errors: [{ message: 'Unauthorized' }] });
        if (!/^\d+ - /.test(req.headers['user-agent'] || '')) return j(403, { errors: [{ message: 'User-Agent zorunlu' }] });
        if (/\/integration\/order\/sellers\/\d+\/orders$/.test(p)) { const page = Number(u.searchParams.get('page') || 0); const size = Number(u.searchParams.get('size') || 50); return j(200, { totalPages: Math.ceil(pkgs.length / size), page, content: pkgs.slice(page * size, page * size + size) }); }
        if (/\/inventory\/sellers\/\d+\/products\/price-and-inventory$/.test(p) && req.method === 'POST') return j(200, { batchRequestId: 'b-' + ++batch });
        if (/\/products\/batch-requests\/.+$/.test(p)) return j(200, { status: 'COMPLETED', items: [{ requestItem: { barcode: 'LB100-SIY-S' }, status: 'SUCCESS', failureReasons: [] }] });
        if (/\/order\/sellers\/\d+\/claims$/.test(p)) return j(200, { totalPages: 1, content: [{ id: 'c1', orderNumber: 'TY100', claimDate: 1760000000000, cargoTrackingNumber: 7330, orderShipmentPackageId: 9000, items: [{ orderLine: { barcode: 'LB100-SIY-S', merchantSku: 'LB100-SIY-S', productName: 'Saten Midi Elbise', price: 499.9 }, claimItems: [{ id: 'i1', claimItemStatus: { name: 'WaitingInAction' }, customerClaimItemReason: { name: 'Beden uymadı' } }, { id: 'i2', claimItemStatus: { name: 'WaitingInAction' } }] }] }] });
        if (/\/shipment-packages\/\d+$/.test(p) && req.method === 'PUT') return j(200, {});
        if (/\/shipment-packages\/\d+\/items\/unsupplied$/.test(p) && req.method === 'PUT') return j(200, {});
        if (/\/product\/sellers\/\d+\/v2\/products$/.test(p) && req.method === 'POST') return j(200, { batchRequestId: 'p-' + ++batch });
        if (/\/qna\/sellers\/\d+\/questions\/filter$/.test(p)) return j(200, { content: [{ id: 77, text: 'Kalıbı dar mı?', productName: 'Saten Midi Elbise', userName: 'A*** K***', creationDate: Date.now() }] });
        if (/\/questions\/\d+\/answers$/.test(p) && req.method === 'POST') return j(200, {});
        return j(404, { errors: [{ message: 'not found ' + p }] });
      }
      if (p.startsWith('/listings/') || p.startsWith('/orders/')) {
        if (req.headers.authorization !== AUTH.hb) return j(401, { message: 'Unauthorized' });
        if (/^\/listings\/merchantid\/[^/]+$/.test(p)) return j(200, { totalCount: 1, listings: [] });
        if (/\/inventory-uploads$/.test(p) && req.method === 'POST') return j(200, { id: 'up-' + ++batch });
        if (/\/inventory-uploads\/id\//.test(p)) return j(200, { status: 'Done', errors: [] });
        if (/^\/orders\/merchantid\//.test(p)) return j(200, { totalCount: 1, items: [{ orderNumber: 'HB555', orderDate: new Date().toISOString(), customerName: 'Mehmet Er', shippingAddress: { address: 'Çankaya', city: 'Ankara' }, items: [{ id: 'li1', merchantSku: 'LB101-BEJ-M', quantity: 2, unitPrice: { amount: 575 }, productName: 'Keten Gömlek Elbise' }] }] });
        return j(404, { message: 'not found' });
      }
      j(404, { message: 'unknown' });
    });
  });
  return new Promise((r) => srv.listen(port, () => r({ srv, log, close: () => new Promise((x) => srv.close(x)) })));
}
module.exports = { start };
if (require.main === module) start().then(() => console.log('Sahte pazaryeri: http://127.0.0.1:5099'));
