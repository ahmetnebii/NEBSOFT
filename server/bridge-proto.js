// Yerel köprü: makine verisi protokolleri (bağımlılıksız)
//  • Modbus TCP (Modbus Application Protocol v1.1b3): 1 bobin, 2 ayrık giriş, 3 tutma yazmacı, 4 giriş yazmacı okuma; 6 tek yazmaç yazma
//  • MQTT 3.1.1 (OASIS): bağlan, konuya abone ol ve gelen mesajları topla, QoS 0 yayınla; TLS (8883) destekli
// Modbus yalnızca yerel ağ adreslerine bağlanır; MQTT aracıları (broker) bulutta da olabileceği için her adrese izin verilir (köprü zaten yalnızca bu bilgisayardan kullanılabilir).
const net = require('net'); const tls = require('tls');

const PRIVATE = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)(\d{1,3}\.){1,2}\d{1,3}$/;
const MB_EXC = { 1: 'Cihaz bu fonksiyonu desteklemiyor (geçersiz fonksiyon)', 2: 'Bu adres cihazda yok (geçersiz veri adresi)', 3: 'Geçersiz değer veya adet', 4: 'Cihaz işlemi yapamadı (cihaz hatası)', 5: 'Cihaz isteği aldı, işliyor', 6: 'Cihaz meşgul, sonra tekrar deneyin', 10: 'Ağ geçidi yolu bulunamadı (unit ID yanlış olabilir)', 11: 'Ağ geçidi arkasındaki cihaz yanıt vermedi (unit ID yanlış olabilir)' };
const MB_FN = { coil: 1, discrete: 2, holding: 3, input: 4 };

// Tek istek, tek yanıt; bağlantı her istekte açılıp kapanır (PLC'lerde eşzamanlı bağlantı sınırı düşüktür)
function modbus({ host, port = 502, unit = 1, table = 'holding', address = 0, count = 1, write }) {
  return new Promise((resolve) => {
    host = String(host || ''); port = Number(port) || 502; unit = Number(unit); address = Number(address); count = Number(count) || 1;
    if (!PRIVATE.test(host) || port < 1 || port > 65535) return resolve({ ok: false, error: 'Yalnızca yerel ağ IP adresi ve geçerli port kabul edilir' });
    if (!(unit >= 0 && unit <= 255) || !(address >= 0 && address <= 65535)) return resolve({ ok: false, error: 'Unit ID 0–255, adres 0–65535 olmalı' });
    const fn = write !== undefined ? 6 : MB_FN[table]; if (!fn) return resolve({ ok: false, error: 'Tablo: holding, input, coil veya discrete' });
    const max = fn <= 2 ? 2000 : 125; if (write === undefined && (count < 1 || count > max)) return resolve({ ok: false, error: `Adet 1–${max} olmalı` });
    const tid = Math.floor(Math.random() * 65535);
    const pdu = Buffer.alloc(5); pdu[0] = fn; pdu.writeUInt16BE(address, 1); pdu.writeUInt16BE(write !== undefined ? (Number(write) & 0xffff) : count, 3);
    const mbap = Buffer.alloc(7); mbap.writeUInt16BE(tid, 0); mbap.writeUInt16BE(0, 2); mbap.writeUInt16BE(pdu.length + 1, 4); mbap[6] = unit;
    const t0 = Date.now(); const sock = net.createConnection({ host, port }); let buf = Buffer.alloc(0); let done = false;
    const fin = (o) => { if (done) return; done = true; sock.destroy(); resolve({ ...o, ms: Date.now() - t0 }); };
    sock.setTimeout(4000, () => fin({ ok: false, error: 'Cihaz 4 saniye içinde yanıt vermedi (zaman aşımı)' }));
    sock.on('error', (e) => fin({ ok: false, error: e.code === 'ECONNREFUSED' ? 'Cihaz bağlantıyı reddetti (Modbus TCP portu kapalı)' : 'Cihaza bağlanılamadı: ' + (e.code || e.message) }));
    sock.on('connect', () => sock.write(Buffer.concat([mbap, pdu])));
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]); if (buf.length < 9) return;
      const len = buf.readUInt16BE(4); if (buf.length < 6 + len) return;
      if (buf.readUInt16BE(0) !== tid) return fin({ ok: false, error: 'Beklenmeyen yanıt (işlem kimliği uyuşmuyor)' });
      const rf = buf[7];
      if (rf & 0x80) return fin({ ok: false, exception: buf[8], error: MB_EXC[buf[8]] || 'Cihaz hata kodu ' + buf[8] });
      if (rf === 6) return fin({ ok: true, written: buf.readUInt16BE(10) });
      const n = buf[8]; const data = buf.subarray(9, 9 + n); let values;
      if (rf <= 2) { values = []; for (let i = 0; i < count; i++) values.push((data[i >> 3] >> (i & 7)) & 1); }
      else { values = []; for (let i = 0; i + 1 < data.length; i += 2) values.push(data.readUInt16BE(i)); }
      fin({ ok: true, values });
    });
  });
}

// ---- MQTT 3.1.1 ----
const vlen = (n) => { const out = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; out.push(b); } while (n > 0); return Buffer.from(out); };
const str = (s) => { const b = Buffer.from(String(s), 'utf8'); const l = Buffer.alloc(2); l.writeUInt16BE(b.length); return Buffer.concat([l, b]); };
const packet = (type, body) => Buffer.concat([Buffer.from([type]), vlen(body.length), body]);
const CONNACK = { 1: 'Aracı bu MQTT sürümünü kabul etmiyor', 2: 'İstemci kimliği reddedildi', 3: 'MQTT aracısı şu an hizmet vermiyor', 4: 'Kullanıcı adı veya şifre hatalı', 5: 'Bu işlem için yetkiniz yok' };
const topicMatch = (filter, topic) => { const f = filter.split('/'); const t = topic.split('/'); for (let i = 0; i < f.length; i++) { if (f[i] === '#') return true; if (f[i] !== '+' && f[i] !== t[i]) return false; } return f.length === t.length; };

// action: 'test' (yalnızca bağlan), 'read' (abone ol, wait sn boyunca mesaj topla), 'publish' (QoS 0 gönder)
function mqtt({ host, port, tls: useTls, user, pass, clientId, action = 'test', topics = [], topic, payload = '', retain = false, wait = 4 }) {
  return new Promise((resolve) => {
    host = String(host || '').trim(); port = Number(port) || (useTls ? 8883 : 1883); wait = Math.min(15, Math.max(1, Number(wait) || 4));
    if (!/^[a-z0-9.-]+$/i.test(host) || port < 1 || port > 65535) return resolve({ ok: false, error: 'Geçerli bir aracı (broker) adresi ve port girin' });
    const subs = (Array.isArray(topics) ? topics : [topics]).map(String).filter(Boolean).slice(0, 50);
    if (action === 'read' && !subs.length) return resolve({ ok: false, error: 'Okunacak konu (topic) yok' });
    if (action === 'publish' && !topic) return resolve({ ok: false, error: 'Yayın konusu (topic) gerekli' });
    const t0 = Date.now(); let done = false; let buf = Buffer.alloc(0); let connected = false; const msgs = {};
    const sock = useTls ? tls.connect({ host, port, servername: host }) : net.createConnection({ host, port });
    const fin = (o) => { if (done) return; done = true; try { if (connected) sock.write(Buffer.from([0xe0, 0])); } catch (e) { /* yok */ } sock.destroy(); resolve({ ...o, ms: Date.now() - t0 }); };
    sock.setTimeout(6000, () => { if (!connected) fin({ ok: false, error: 'Aracı 6 saniye içinde yanıt vermedi (zaman aşımı)' }); });
    sock.on('error', (e) => fin({ ok: false, error: e.code === 'ECONNREFUSED' ? 'Aracı bağlantıyı reddetti (port kapalı)' : /certificate|CERT|SSL|TLS/i.test(e.message + e.code) ? 'TLS sertifikası doğrulanamadı: ' + (e.code || e.message) : 'Aracıya bağlanılamadı: ' + (e.code || e.message) }));
    sock.on(useTls ? 'secureConnect' : 'connect', () => {
      let flags = 0x02; const parts = [str(clientId || 'nebsoft-' + Math.random().toString(36).slice(2, 10))];
      if (user) { flags |= 0x80; parts.push(str(user)); } if (user && pass) { flags |= 0x40; parts.push(str(pass)); }
      sock.write(packet(0x10, Buffer.concat([str('MQTT'), Buffer.from([4, flags, 0, 30]), ...parts])));
    });
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      for (;;) {
        if (buf.length < 2) return; let mult = 1, len = 0, i = 1, b;
        do { if (i >= buf.length) return; b = buf[i++]; len += (b & 127) * mult; mult *= 128; } while (b & 128);
        if (buf.length < i + len) return; const type = buf[0] >> 4; const fl = buf[0] & 15; const body = buf.subarray(i, i + len); buf = buf.subarray(i + len);
        if (type === 2) { // CONNACK
          if (body[1] !== 0) return fin({ ok: false, code: body[1], error: CONNACK[body[1]] || 'Bağlantı reddedildi (kod ' + body[1] + ')' });
          connected = true;
          if (action === 'test') return fin({ ok: true });
          if (action === 'publish') { sock.write(packet(0x30 | (retain ? 1 : 0), Buffer.concat([str(topic), Buffer.from(String(payload), 'utf8')]))); return setTimeout(() => fin({ ok: true, published: true }), 150); }
          const pid = Buffer.from([0, 1]); sock.write(packet(0x82, Buffer.concat([pid, ...subs.map((s) => Buffer.concat([str(s), Buffer.from([0])]))])));
          setTimeout(() => fin({ ok: true, messages: Object.values(msgs) }), wait * 1000);
        } else if (type === 9) { // SUBACK
          const bad = [...body.subarray(2)].map((x, k) => (x === 0x80 ? subs[k] : null)).filter(Boolean);
          if (bad.length) return fin({ ok: false, error: 'Aracı şu konulara aboneliği reddetti: ' + bad.join(', ') });
        } else if (type === 3) { // PUBLISH (gelen)
          const tl = body.readUInt16BE(0); const tp = body.subarray(2, 2 + tl).toString('utf8'); const qos = (fl >> 1) & 3; const off = 2 + tl + (qos ? 2 : 0);
          if (qos === 1) sock.write(Buffer.from([0x40, 2, body[2 + tl], body[3 + tl]])); // PUBACK
          if (subs.some((s) => topicMatch(s, tp))) msgs[tp] = { topic: tp, payload: body.subarray(off).toString('utf8').slice(0, 2000), retained: !!(fl & 1), at: new Date().toISOString() };
        }
      }
    });
  });
}

module.exports = { modbus, mqtt, topicMatch };
