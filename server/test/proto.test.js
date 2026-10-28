// Yerel köprü protokolleri: Modbus TCP (sahte PLC) ve MQTT (sahte aracı + istenirse gerçek test aracısı)
//   node server/test/proto.test.js            → yalnızca yerel sahte sunucular
//   MQTT_LIVE=1 node server/test/proto.test.js → ek olarak herkese açık test aracısı (MQTT_HOST, varsayılan broker.emqx.io) üzerinde gerçek yayın/okuma
const net = require('net'); const assert = require('assert');
const { modbus, mqtt, topicMatch } = require('../bridge-proto');

// ---- Sahte PLC: tutma yazmaçları 0..9 = 1000+i, 100 numaralı adres yok (istisna 2) ----
const regs = Array.from({ length: 10 }, (_, i) => 1000 + i); regs[4] = 51234; let lastWrite = null;
const plc = net.createServer((s) => s.on('data', (q) => {
  const tid = q.readUInt16BE(0), unit = q[6], fn = q[7], addr = q.readUInt16BE(8), n = q.readUInt16BE(10);
  const reply = (pdu) => { const h = Buffer.alloc(7); h.writeUInt16BE(tid, 0); h.writeUInt16BE(0, 2); h.writeUInt16BE(pdu.length + 1, 4); h[6] = unit; s.write(Buffer.concat([h, pdu])); };
  if (unit === 9) return reply(Buffer.from([fn | 0x80, 11]));
  if (fn === 6) { lastWrite = [addr, n]; return reply(q.subarray(7, 12)); }
  if (fn === 5 || fn > 6) return reply(Buffer.from([fn | 0x80, 1]));
  if (addr + n > regs.length) return reply(Buffer.from([fn | 0x80, 2]));
  if (fn === 1 || fn === 2) { const by = Buffer.alloc(Math.ceil(n / 8)); for (let i = 0; i < n; i++) if ((addr + i) % 2) by[i >> 3] |= 1 << (i & 7); return reply(Buffer.concat([Buffer.from([fn, by.length]), by])); }
  const d = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) d.writeUInt16BE(regs[addr + i], i * 2); reply(Buffer.concat([Buffer.from([fn, d.length]), d]));
}));

// ---- Sahte MQTT aracısı: kullanıcı "ops" / şifre "dogru", "fabrika/hat1/sayac" konusunda tutulan (retained) mesaj ----
const brokerMsgs = [];
const broker = net.createServer((s) => { let buf = Buffer.alloc(0); s.on('data', (d) => { buf = Buffer.concat([buf, d]);
  for (;;) { if (buf.length < 2) return; let m = 1, len = 0, i = 1, b; do { b = buf[i++]; len += (b & 127) * m; m *= 128; } while (b & 128); if (buf.length < i + len) return; const t = buf[0] >> 4; const body = buf.subarray(i, i + len); buf = buf.subarray(i + len);
    if (t === 1) { const fl = body[7]; let off = 10; const rd = () => { const l = body.readUInt16BE(off); const v = body.subarray(off + 2, off + 2 + l).toString(); off += 2 + l; return v; }; rd(); const u = fl & 0x80 ? rd() : ''; const p = fl & 0x40 ? rd() : ''; s.write(Buffer.from([0x20, 2, 0, u === 'ops' && p === 'dogru' ? 0 : 4])); }
    if (t === 8) { s.write(Buffer.from([0x90, 3, body[0], body[1], 0])); const tp = 'fabrika/hat1/sayac'; const pl = Buffer.from('48213'); const tb = Buffer.alloc(2); tb.writeUInt16BE(tp.length); const bd = Buffer.concat([tb, Buffer.from(tp), pl]); s.write(Buffer.concat([Buffer.from([0x31, bd.length]), bd])); }
    if (t === 3) { const l = body.readUInt16BE(0); brokerMsgs.push([body.subarray(2, 2 + l).toString(), body.subarray(2 + l).toString()]); }
  } }); });

(async () => {
  await new Promise((r) => plc.listen(0, '127.0.0.1', r)); await new Promise((r) => broker.listen(0, '127.0.0.1', r));
  const P = plc.address().port, M = broker.address().port; let n = 0; const ok = (m) => { n++; console.log('✓ ' + m); };

  let r = await modbus({ host: '127.0.0.1', port: P, unit: 1, table: 'holding', address: 3, count: 2 }); assert.deepStrictEqual(r.values, [1003, 51234]); ok('Modbus tutma yazmacı okuma (fn 3)');
  r = await modbus({ host: '127.0.0.1', port: P, unit: 1, table: 'input', address: 0, count: 1 }); assert.deepStrictEqual(r.values, [1000]); ok('Modbus giriş yazmacı okuma (fn 4)');
  r = await modbus({ host: '127.0.0.1', port: P, unit: 1, table: 'coil', address: 0, count: 4 }); assert.deepStrictEqual(r.values, [0, 1, 0, 1]); ok('Modbus bobin okuma (fn 1)');
  r = await modbus({ host: '127.0.0.1', port: P, unit: 1, address: 2, write: 777 }); assert.ok(r.ok); assert.deepStrictEqual(lastWrite, [2, 777]); ok('Modbus tek yazmaç yazma (fn 6)');
  r = await modbus({ host: '127.0.0.1', port: P, unit: 1, table: 'holding', address: 100, count: 1 }); assert.strictEqual(r.exception, 2); assert.match(r.error, /adres/); ok('Modbus istisna 2 → "adres cihazda yok"');
  r = await modbus({ host: '127.0.0.1', port: P, unit: 9, table: 'holding', address: 0, count: 1 }); assert.strictEqual(r.exception, 11); ok('Modbus istisna 11 → unit ID uyarısı');
  r = await modbus({ host: '8.8.8.8', port: 502 }); assert.ok(!r.ok && /yerel ağ/.test(r.error)); ok('Modbus internet adresine bağlanmaz');
  r = await modbus({ host: '127.0.0.1', port: 1, table: 'holding' }); assert.ok(!r.ok && /reddetti|bağlanılamadı/.test(r.error)); ok('Modbus kapalı port → anlaşılır hata');

  r = await mqtt({ host: '127.0.0.1', port: M, user: 'ops', pass: 'yanlis' }); assert.strictEqual(r.code, 4); assert.match(r.error, /şifre/); ok('MQTT yanlış şifre → CONNACK 4');
  r = await mqtt({ host: '127.0.0.1', port: M, user: 'ops', pass: 'dogru', action: 'read', topics: ['fabrika/+/sayac'], wait: 1 }); assert.strictEqual(r.messages[0].payload, '48213'); assert.ok(r.messages[0].retained); ok('MQTT abone ol, joker konu (+), tutulan mesaj');
  r = await mqtt({ host: '127.0.0.1', port: M, user: 'ops', pass: 'dogru', action: 'publish', topic: 'nebsoft/test', payload: 'merhaba' }); assert.ok(r.ok); await new Promise((x) => setTimeout(x, 100)); assert.deepStrictEqual(brokerMsgs.pop(), ['nebsoft/test', 'merhaba']); ok('MQTT QoS 0 yayın');
  assert.ok(topicMatch('a/#', 'a/b/c') && topicMatch('a/+/c', 'a/b/c') && !topicMatch('a/+', 'a/b/c')); ok('MQTT konu eşleme (+, #)');

  if (process.env.MQTT_LIVE) { const LIVE = process.env.MQTT_HOST || 'broker.emqx.io';
    const tp = 'nebsoft/test/' + Math.random().toString(36).slice(2, 10); const val = String(Date.now());
    r = await mqtt({ host: LIVE, port: 1883, action: 'publish', topic: tp, payload: val, retain: true }); assert.ok(r.ok, r.error);
    r = await mqtt({ host: LIVE, port: 1883, action: 'read', topics: [tp], wait: 3 }); assert.strictEqual((r.messages[0] || {}).payload, val, JSON.stringify(r));
    await mqtt({ host: LIVE, port: 1883, action: 'publish', topic: tp, payload: '', retain: true }); // tutulan mesajı temizle
    ok(`Gerçek aracı (${LIVE}): yayın → abonelikle geri okuma`);
    r = await mqtt({ host: LIVE, port: 8883, tls: true }); assert.ok(r.ok, r.error); ok('Gerçek aracı TLS (8883) bağlantısı');
  }
  console.log(`\n${n} test geçti`); plc.close(); broker.close();
})().catch((e) => { console.error('✗', e); process.exit(1); });
