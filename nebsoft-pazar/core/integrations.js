/* NEBSOFT Entegrasyon merkezi — SMS, WhatsApp, e-posta, fiş/etiket yazıcısı, terazi, POS cihazı, e-Fatura, ödeme, webhook, barkod, yedekleme.
   Ayarlar tüm ürünlerde ortaktır (firma bazlı). Tarayıcının yapamadığı istekler server.js içindeki /api köprüsü üzerinden gider. */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, badge, pageHead, fieldsHtml, readForm } = NS;
  const store = new NS.DB('entegrasyon', (db) => { db.data.cfg = {}; db.data.log = []; });
  const cfg = (kind) => ({ ...(DEFS[kind] ? DEFS[kind].defaults : {}), ...((store.data.cfg || {})[kind] || {}) });
  const setCfg = (kind, v) => { store.data.cfg = store.data.cfg || {}; store.data.cfg[kind] = v; store.save(); };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : 'pazar');
  const fill = (tpl, vars) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('0')) d = d.slice(1); if (d.length === 10) d = '90' + d; return d; };
  function log(kind, to, text, status, detail) {
    store.load();
    const l = store.col('log');
    l.unshift({ id: NS.uid(), at: new Date().toISOString(), kind, to, text: String(text || '').slice(0, 500), status, detail: String(detail || '').slice(0, 300), app: appId(), user: NS.currentUser ? NS.currentUser.name : '' });
    if (l.length > 500) l.length = 500;
    store.save();
    if (NS.audit) NS.audit({ action: `Entegrasyon: ${kind}`, detail: `${String(text || '').slice(0, 120)} → ${status || ''}`, type: 'entegrasyon', level: /hata|kapalı/i.test(status || '') ? 'uyari' : 'bilgi' });
  }

  // Ürünlerdeki tüm wa.me bağlantıları tek noktadan yönetilir: API modu seçiliyse otomatik gönderilir, değilse kayda geçip açılır
  const origOpen = window.open.bind(window);
  const parseWa = (url) => { const m = String(url || '').match(/wa\.me\/(\d*)\?text=([^&#]*)/); return m ? { to: m[1], text: decodeURIComponent(m[2]) } : null; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me/"]'); if (!a) return;
    const w = parseWa(a.href); if (!w) return;
    if (cfg('whatsapp').mode !== 'link' && w.to) { e.preventDefault(); whatsapp(w.to, w.text); } else log('whatsapp', w.to, w.text, 'açıldı', 'wa.me bağlantısı');
  }, true);
  window.open = function (url, ...rest) {
    const w = parseWa(url);
    if (w && w.to && cfg('whatsapp').mode !== 'link') { whatsapp(w.to, w.text); return null; }
    if (w) log('whatsapp', w.to, w.text, 'açıldı', 'wa.me bağlantısı');
    return origOpen(url, ...rest);
  };

  // ---------- Köprü (server.js /api) ----------
  let bridgeOk = null;
  async function bridge(pathname, body) {
    if (!/^https?:/.test(location.protocol)) throw new Error('Köprü için uygulamayı "node server.js" ile açın (http://localhost:5050)');
    const r = await fetch('/api' + pathname, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, error: 'Köprü yanıtı okunamadı' }));
    bridgeOk = true;
    return j;
  }
  async function bridgeStatus() { try { const j = await bridge('/durum'); bridgeOk = !!j.ok; } catch (e) { bridgeOk = false; } return bridgeOk; }
  // Harici servise istek: önce köprüden, köprü yoksa doğrudan tarayıcıdan (CORS izin veriyorsa)
  async function httpCall(req) {
    try { const j = await bridge('/istek', req); if (j.ok === undefined && j.error) throw new Error(j.error); return j; } catch (e) {
      if (!/köprü|fetch|Failed|NetworkError|Köprü/i.test(e.message)) throw e;
      const r = await fetch(req.url, { method: req.method, headers: req.headers, body: req.method === 'GET' ? undefined : req.body });
      return { ok: r.ok, status: r.status, body: await r.text() };
    }
  }

  // ---------- Sağlayıcı tanımları ----------
  const F = (name, label, extra = {}) => ({ name, label, ...extra });
  const SMS = {
    sim: { name: 'Simülasyon (gönderim yapılmaz)', fields: [], build: null },
    netgsm: { name: 'Netgsm', fields: [F('user', 'Kullanıcı kodu', { required: true }), F('pass', 'Şifre', { type: 'password', required: true }), F('header', 'Mesaj başlığı', { required: true })],
      build: (c, to, text) => ({ url: `https://api.netgsm.com.tr/sms/send/get?usercode=${encodeURIComponent(c.user)}&password=${encodeURIComponent(c.pass)}&gsmno=${to}&message=${encodeURIComponent(text)}&msgheader=${encodeURIComponent(c.header)}&dil=TR`, method: 'GET', headers: {} }),
      ok: (r) => /^(00|01|02)\b/.test(String(r.body).trim()) },
    iletimerkezi: { name: 'İleti Merkezi', fields: [F('key', 'API anahtarı', { required: true }), F('hash', 'API hash', { type: 'password', required: true }), F('header', 'Gönderici adı', { required: true })],
      build: (c, to, text) => ({ url: 'https://api.iletimerkezi.com/v1/send-sms/json', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { authentication: { key: c.key, hash: c.hash }, order: { sender: c.header, sendDateTime: [], iys: '1', iysList: 'BIREYSEL', message: { text, receipents: { number: [to] } } } } }) }),
      ok: (r) => /"code"\s*:\s*"?200/.test(r.body) },
    verimor: { name: 'Verimor', fields: [F('user', 'Kullanıcı adı (90...)', { required: true }), F('pass', 'API şifresi', { type: 'password', required: true }), F('header', 'Başlık', { required: true })],
      build: (c, to, text) => ({ url: 'https://sms.verimor.com.tr/v2/send.json', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: c.user, password: c.pass, source_addr: c.header, messages: [{ msg: text, dest: to }] }) }),
      ok: (r) => r.ok },
    mutlucell: { name: 'Mutlucell', fields: [F('user', 'Kullanıcı adı', { required: true }), F('pass', 'Şifre', { type: 'password', required: true }), F('header', 'Başlık', { required: true })],
      build: (c, to, text) => ({ url: 'https://smsgw.mutlucell.com/smsgw-ws/sndblkex', method: 'POST', headers: { 'Content-Type': 'text/xml; charset=UTF-8' }, body: `<?xml version="1.0" encoding="UTF-8"?><smspack ka="${esc(c.user)}" pwd="${esc(c.pass)}" org="${esc(c.header)}" charset="turkish"><mesaj><metin>${esc(text)}</metin><nums>${to}</nums></mesaj></smspack>` }),
      ok: (r) => /^\$/.test(String(r.body).trim()) },
    twilio: { name: 'Twilio (uluslararası)', fields: [F('sid', 'Account SID', { required: true }), F('token', 'Auth token', { type: 'password', required: true }), F('from', 'Gönderen numara (+1...)', { required: true })],
      build: (c, to, text) => ({ url: `https://api.twilio.com/2010-04-01/Accounts/${c.sid}/Messages.json`, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + btoa(`${c.sid}:${c.token}`) }, body: `To=%2B${to}&From=${encodeURIComponent(c.from)}&Body=${encodeURIComponent(text)}` }),
      ok: (r) => r.ok },
    custom: { name: 'Özel HTTP API', fields: [F('url', 'API adresi', { required: true, full: true, hint: 'Değişkenler: {to} {text} {sender} — ör. https://api.firma.com/sms?no={to}&msg={text}' }), F('method', 'Metot', { type: 'select', options: ['POST', 'GET'] }), F('headers', 'Başlıklar (JSON)', { full: true, placeholder: '{"Authorization":"Bearer ..."}' }), F('body', 'Gövde şablonu', { type: 'textarea', full: true, placeholder: '{"telefon":"{to}","mesaj":"{text}","baslik":"{sender}"}' }), F('header', 'Gönderici / başlık'), F('okText', 'Başarılı yanıtta geçen ifade', { hint: 'Boşsa HTTP 2xx yeterli' })],
      build: (c, to, text) => { const v = { to, text: c.method === 'GET' ? encodeURIComponent(text) : String(text).replace(/"/g, '\\"'), sender: c.header || '' }; let h = {}; try { h = JSON.parse(c.headers || '{}'); } catch (e) { /* geçersiz başlık */ } return { url: fill(c.url, { ...v, text: encodeURIComponent(text) }), method: c.method || 'POST', headers: { 'Content-Type': 'application/json', ...h }, body: c.method === 'GET' ? undefined : fill(c.body, v) }; },
      ok: (r, c) => r.ok && (!c.okText || String(r.body).includes(c.okText)) },
  };
  const EFAT = {
    sim: 'Simülasyon (test)', parasut: 'Paraşüt', uyumsoft: 'Uyumsoft', logo: 'Logo e-Dönüşüm', sovos: 'Sovos (Foriba)', mysoft: 'Mysoft', edm: 'EDM Bilişim', custom: 'Özel API',
  };
  const POSB = { manual: 'Manuel (çekimi cihazdan yapıp onaylayın)', bridge: 'Entegre terminal (köprü / üretici servisi)', demo: 'Demo terminal (test)' };

  // Her entegrasyonun ayar şeması ve varsayılanları
  const DEFS = {
    sms: { title: 'SMS', icon: 'message', desc: 'Randevu hatırlatma, servis durumu, veli bildirimi, kargo bilgilendirme', defaults: { provider: 'sim', enabled: true, maxLen: 612, iysNote: true },
      fields: (c) => [{ name: 'enabled', label: 'SMS gönderimi açık', type: 'checkbox', full: true }, { name: 'provider', label: 'Sağlayıcı', type: 'select', options: Object.entries(SMS).map(([value, p]) => ({ value, label: p.name })), full: true }, ...(SMS[c.provider] || SMS.sim).fields, { name: 'maxLen', label: 'En fazla karakter', type: 'number' }, { name: 'iysNote', label: 'Ticari mesajlarda İYS onayı kontrol edilsin', type: 'checkbox' }] },
    whatsapp: { title: 'WhatsApp', icon: 'message', desc: 'Hatırlatma ve bilgilendirme mesajları', defaults: { mode: 'link' },
      fields: (c) => [{ name: 'mode', label: 'Gönderim yöntemi', type: 'select', options: [{ value: 'link', label: 'WhatsApp bağlantısı (wa.me — personel gönderir)' }, { value: 'cloud', label: 'WhatsApp Business Cloud API (otomatik)' }, { value: 'custom', label: 'Özel API (çözüm ortağı)' }], full: true },
        ...(c.mode === 'cloud' ? [F('phoneId', 'Phone number ID', { required: true }), F('token', 'Erişim jetonu (token)', { type: 'password', required: true }), F('version', 'Graph API sürümü', { value: 'v19.0' }), F('template', 'Onaylı şablon adı (boşsa serbest metin)')] : []),
        ...(c.mode === 'custom' ? [F('url', 'API adresi', { full: true, required: true }), F('headers', 'Başlıklar (JSON)', { full: true }), F('body', 'Gövde şablonu ({to} {text})', { type: 'textarea', full: true })] : [])] },
    email: { title: 'E-posta', icon: 'mail', desc: 'Fatura, sipariş ve rapor gönderimi', defaults: { mode: 'mailto', from: '' },
      fields: (c) => [{ name: 'mode', label: 'Yöntem', type: 'select', options: [{ value: 'mailto', label: 'E-posta istemcisini aç (mailto)' }, { value: 'emailjs', label: 'EmailJS (tarayıcıdan doğrudan)' }, { value: 'http', label: 'Kendi e-posta API’niz (SMTP köprüsü)' }], full: true },
        ...(c.mode === 'emailjs' ? [F('service', 'Service ID', { required: true }), F('template', 'Template ID', { required: true }), F('publicKey', 'Public key', { required: true })] : []),
        ...(c.mode === 'http' ? [F('url', 'API adresi', { full: true, required: true }), F('headers', 'Başlıklar (JSON)', { full: true }), F('body', 'Gövde şablonu ({to} {subject} {text})', { type: 'textarea', full: true })] : []), F('from', 'Gönderen adı / adresi')] },
    printer: { title: 'Fiş yazıcı', icon: 'print', desc: 'Satış fişi, adisyon, mutfak fişi, makbuz', defaults: { mode: 'browser', paper: 80, cols: 48, cut: true, drawer: false, copies: 1, baud: 9600, port: 9100, codepage: 'cp857', feed: 4 },
      fields: (c) => [{ name: 'mode', label: 'Bağlantı', type: 'select', options: [{ value: 'browser', label: 'Tarayıcı yazdırma (her yazıcı)' }, { value: 'serial', label: 'USB / seri ESC/POS (Web Serial — Chrome/Edge)' }, { value: 'network', label: 'Ağ ESC/POS yazıcı (IP:9100, köprü ile)' }], full: true },
        ...(c.mode === 'network' ? [F('host', 'Yazıcı IP adresi', { required: true, placeholder: '192.168.1.50' }), F('port', 'Port', { type: 'number' })] : []), ...(c.mode === 'serial' ? [F('baud', 'Baud hızı', { type: 'select', options: ['9600', '19200', '38400', '115200'], num: true })] : []),
        F('paper', 'Kâğıt genişliği (mm)', { type: 'select', options: [{ value: 58, label: '58 mm' }, { value: 80, label: '80 mm' }], num: true }), F('cols', 'Satır başına karakter', { type: 'number', hint: '58mm ≈ 32, 80mm ≈ 48' }), F('codepage', 'Karakter seti', { type: 'select', options: [{ value: 'cp857', label: 'CP857 Türkçe (Epson, Xprinter)' }, { value: 'ascii', label: 'Türkçe karaktersiz (ç→c)' }] }), F('copies', 'Kopya', { type: 'number' }), F('feed', 'Kesmeden önce boş satır', { type: 'number' }),
        F('cut', 'Otomatik kâğıt kes', { type: 'checkbox' }), F('drawer', 'Nakit satışta kasa çekmecesini aç', { type: 'checkbox' }), F('kitchen', 'Mutfak fişini ayrıca yazdır (adisyon)', { type: 'checkbox' })] },
    label: { title: 'Etiket yazıcı', icon: 'tag', desc: 'Raf etiketi, barkod, kargo etiketi', defaults: { mode: 'browser', w: 50, h: 30, port: 9100, dpi: 203 },
      fields: (c) => [{ name: 'mode', label: 'Bağlantı', type: 'select', options: [{ value: 'browser', label: 'Tarayıcı yazdırma' }, { value: 'zpl', label: 'Zebra ZPL ağ yazıcı (köprü)' }, { value: 'tspl', label: 'TSC / Argox TSPL ağ yazıcı (köprü)' }], full: true }, ...(c.mode !== 'browser' ? [F('host', 'Yazıcı IP', { required: true }), F('port', 'Port', { type: 'number' }), F('dpi', 'Çözünürlük (dpi)', { type: 'select', options: ['203', '300'], num: true })] : []), F('w', 'Etiket genişliği (mm)', { type: 'number' }), F('h', 'Etiket yüksekliği (mm)', { type: 'number' })] },
    scale: { title: 'Terazi', icon: 'layers', desc: 'Tartılı ürün satışı', defaults: { mode: 'barcode', prefix: '27,28', pluLen: 5, valLen: 5, valType: 'weight', baud: 9600, protocol: 'auto', unit: 1000 },
      fields: (c) => [{ name: 'mode', label: 'Çalışma şekli', type: 'select', options: [{ value: 'barcode', label: 'Etiketli terazi — barkod okutulur' }, { value: 'serial', label: 'Kasaya bağlı terazi (RS232/USB — Web Serial)' }, { value: 'both', label: 'İkisi birden' }], full: true },
        F('prefix', 'Terazi barkod ön ekleri (virgülle)'), F('pluLen', 'PLU hane sayısı', { type: 'number' }), F('valLen', 'Değer hane sayısı', { type: 'number' }), F('valType', 'Barkoddaki değer', { type: 'select', options: [{ value: 'weight', label: 'Ağırlık (gram)' }, { value: 'price', label: 'Tutar (kuruş)' }] }),
        ...(c.mode !== 'barcode' ? [F('baud', 'Baud hızı', { type: 'select', options: ['2400', '4800', '9600', '19200'], num: true }), F('protocol', 'Protokol', { type: 'select', options: [{ value: 'auto', label: 'Otomatik (sayıyı bul)' }, { value: 'cas', label: 'CAS / Dibal (ST,GS,...kg)' }, { value: 'toledo', label: 'Mettler Toledo' }] }), F('request', 'Okuma komutu (boşsa sürekli akış)', { placeholder: 'W veya ENQ' })] : [])] },
    pos: { title: 'POS / ödeme terminali', icon: 'card', desc: 'Kartlı ödemeyi kasadan cihaza gönderme', defaults: { mode: 'manual', brand: 'ingenico', maxInst: 6, timeout: 60 },
      fields: (c) => [{ name: 'mode', label: 'Entegrasyon', type: 'select', options: Object.entries(POSB).map(([value, label]) => ({ value, label })), full: true }, F('brand', 'Cihaz', { type: 'select', options: [{ value: 'ingenico', label: 'Ingenico' }, { value: 'verifone', label: 'Verifone' }, { value: 'beko', label: 'Beko ÖKC' }, { value: 'hugin', label: 'Hugin' }, { value: 'pavo', label: 'Pavo' }, { value: 'paygo', label: 'PayGo / Android POS' }, { value: 'diger', label: 'Diğer' }] }),
        ...(c.mode === 'bridge' ? [F('url', 'Terminal servis adresi', { full: true, required: true, placeholder: 'http://localhost:8085/sale veya /api/pos/satis' }), F('timeout', 'Zaman aşımı (sn)', { type: 'number' })] : []), F('maxInst', 'En fazla taksit', { type: 'number' })] },
    efatura: { title: 'e-Fatura / e-Arşiv', icon: 'file', desc: 'Faturaların GİB’e iletilmesi', defaults: { provider: 'sim', test: true, efPrefix: 'NEB', eaPrefix: 'EAR' },
      fields: (c) => [{ name: 'provider', label: 'Entegratör', type: 'select', options: Object.entries(EFAT).map(([value, label]) => ({ value, label })), full: true }, ...(c.provider !== 'sim' ? [F('user', 'Kullanıcı adı / client id', { required: true }), F('pass', 'Şifre / secret', { type: 'password', required: true }), F('vkn', 'Firma VKN'), F('url', 'API adresi (özel / test ortamı)', { full: true })] : []), F('efPrefix', 'e-Fatura seri'), F('eaPrefix', 'e-Arşiv seri'), F('test', 'Test ortamı', { type: 'checkbox' })] },
    payment: { title: 'Online ödeme', icon: 'wallet', desc: 'Pazar yeri ve online satış sayfalarında kartla ödeme', defaults: { provider: 'none', sandbox: true },
      fields: (c) => [{ name: 'provider', label: 'Sanal POS', type: 'select', options: [{ value: 'none', label: 'Kapalı (demo ödeme)' }, { value: 'iyzico', label: 'iyzico' }, { value: 'paytr', label: 'PayTR' }, { value: 'param', label: 'Param' }, { value: 'stripe', label: 'Stripe' }], full: true }, ...(c.provider === 'iyzico' ? [F('apiKey', 'API key', { required: true }), F('secret', 'Secret key', { type: 'password', required: true })] : []), ...(c.provider === 'paytr' ? [F('merchantId', 'Mağaza no', { required: true }), F('merchantKey', 'Mağaza parola', { type: 'password', required: true }), F('merchantSalt', 'Mağaza gizli anahtar', { type: 'password', required: true })] : []), ...(['param', 'stripe'].includes(c.provider) ? [F('apiKey', 'API anahtarı', { required: true }), F('secret', 'Gizli anahtar', { type: 'password', required: true })] : []), F('sandbox', 'Test (sandbox) modu', { type: 'checkbox' })] },
    barcode: { title: 'Barkod okuyucu', icon: 'barcode', desc: 'El terminali, masaüstü okuyucu, kamera', defaults: { suffix: 'enter', minLen: 4, camera: true, beep: true },
      fields: () => [F('suffix', 'Okuyucu sonek tuşu', { type: 'select', options: [{ value: 'enter', label: 'Enter' }, { value: 'tab', label: 'Tab' }] }), F('minLen', 'En kısa barkod', { type: 'number' }), F('prefixStrip', 'Silinecek ön ek'), F('camera', 'Kamera ile okumaya izin ver', { type: 'checkbox' }), F('beep', 'Okutmada ses', { type: 'checkbox' })] },
    webhook: { title: 'Webhook', icon: 'send', desc: 'Satış, sipariş, randevu olaylarını başka sistemlere iletme', defaults: { url: '', events: '*', secret: '' },
      fields: () => [F('url', 'Hedef adres', { full: true, placeholder: 'https://sizin-sisteminiz.com/nebsoft' }), F('events', 'Olaylar (virgülle, * hepsi)', { full: true, hint: 'satis, siparis, randevu, odeme, stok' }), F('secret', 'İmza anahtarı', { type: 'password' })] },
    backup: { title: 'Yedekleme', icon: 'download', desc: 'Tüm ürünlerin verilerini tek dosyada yedekleme', defaults: { remindDays: 7 }, fields: () => [F('remindDays', 'Yedek hatırlatma (gün)', { type: 'number' })] },
  };
  // ---------- Sektörel / resmi bağlayıcılar ----------
  // Her bağlayıcı: sağlayıcı seçimi + kimlik bilgileri + servis adresi. "sim" test modudur; "custom" seçilince
  // istek {action, payload} JSON'u olarak verilen adrese (çözüm ortağı / kendi ara servisiniz) köprü üzerinden gönderilir.
  const CONN = {
    eirsaliye: ['e-İrsaliye', 'truck', 'Sevk ve alış irsaliyelerinin GİB’e iletilmesi', 'e-Belge', { parasut: 'Paraşüt', uyumsoft: 'Uyumsoft', logo: 'Logo e-Dönüşüm', sovos: 'Sovos', edm: 'EDM', mysoft: 'Mysoft' }, ['prefix:İrsaliye seri']],
    esmm: ['e-SMM (Serbest Meslek Makbuzu)', 'receipt', 'Hekim, veteriner, eğitmen ve danışman makbuzları', 'e-Belge', { parasut: 'Paraşüt', uyumsoft: 'Uyumsoft', edm: 'EDM', mysoft: 'Mysoft' }, ['prefix:Makbuz seri', 'stopaj:Stopaj oranı (%)']],
    emustahsil: ['e-Müstahsil Makbuzu', 'receipt', 'Çiftçiden (fındık, süt, buğday...) yapılan alımların makbuzu', 'e-Belge', { uyumsoft: 'Uyumsoft', edm: 'EDM', logo: 'Logo e-Dönüşüm' }, ['prefix:Makbuz seri', 'stopaj:Stopaj oranı (%)']],
    edefter: ['e-Defter', 'book', 'Yevmiye ve kebir beratlarının oluşturulması', 'e-Belge', { logo: 'Logo', uyumsoft: 'Uyumsoft', edm: 'EDM' }, []],
    okc: ['Yazarkasa POS (ÖKC / GMP3)', 'receipt', 'Mali fişin yeni nesil ödeme kaydedici cihazdan kesilmesi', 'Donanım', { ingenico: 'Ingenico (GMP3)', beko: 'Beko 300TR / 400TR', hugin: 'Hugin', profilo: 'Profilo', pavo: 'Pavo', vera: 'Verifone (ÖKC)', paygo: 'PayGo Android ÖKC' }, ['serial:Cihaz sicil no', 'dept:Varsayılan KDV departmanı']],
    yemekplatform: ['Online yemek platformları', 'bag', 'Platform siparişlerini adisyona düşürme, menü ve stok senkronu', 'Pazaryeri', { yemeksepeti: 'Yemeksepeti', getir: 'Getir Yemek', trendyol: 'Trendyol Go / Yemek', migros: 'Migros Yemek' }, ['restId:Restoran / şube kodu', 'auto:Siparişleri otomatik onayla:checkbox']],
    yemekkarti: ['Yemek kartları', 'card', 'Yemek kartı provizyonu ve mutabakat', 'Ödeme', { multinet: 'Multinet', pluxee: 'Pluxee (Sodexo)', edenred: 'Edenred (Ticket)', metropol: 'Metropol', setcard: 'Setcard', tokenflex: 'Token Flex' }, ['merchant:Üye işyeri no']],
    callerid: ['Arayan numara tanıma (Caller ID)', 'phone', 'Gelen çağrıda müşteri kartı / paket sipariş ekranı açılır', 'Donanım', { cidshow: 'Cidshow USB cihaz', santral: 'Sanal santral (webhook)', netgsm: 'Netgsm Bulut Santral', verimor: 'Verimor Santral' }, ['line:Hat / dahili']],
    pazaryeri: ['Pazaryerleri', 'store', 'Ürün, stok, fiyat ve sipariş senkronu', 'Pazaryeri', { trendyol: 'Trendyol', hepsiburada: 'Hepsiburada', n11: 'n11', amazon: 'Amazon TR', pazarama: 'Pazarama', ciceksepeti: 'Çiçeksepeti', idefix: 'İdefix' }, ['sellerId:Satıcı ID', 'auto:Stok değişince otomatik gönder:checkbox']],
    kargofirma: ['Kargo firmaları', 'truck', 'Gönderi oluşturma, barkod, takip ve teslim bildirimi', 'Lojistik', { yurtici: 'Yurtiçi Kargo', aras: 'Aras Kargo', mng: 'MNG / DHL eCommerce', surat: 'Sürat Kargo', ptt: 'PTT Kargo', hepsijet: 'HepsiJet', kolaygelsin: 'Kolay Gelsin', ups: 'UPS' }, ['customerNo:Müşteri / sözleşme no']],
    medula: ['MEDULA (SGK Eczane Provizyon)', 'pill', 'Reçete giriş, provizyon, fatura ve kurum mutabakatı', 'Resmi', { sgk: 'SGK MEDULA Web Servis' }, ['facility:Eczane tesis kodu', 'gln:Eczane GLN']],
    its: ['İTS (İlaç Takip Sistemi)', 'qr', 'Karekodlu satış, alış ve iade bildirimleri', 'Resmi', { titck: 'TİTCK İTS Web Servis' }, ['gln:GLN numarası']],
    uts: ['ÜTS (Ürün Takip Sistemi)', 'qr', 'Tıbbi cihaz ve kozmetik verme/alma bildirimleri', 'Resmi', { titck: 'TİTCK ÜTS' }, ['firm:Kurum no']],
    eczadeposu: ['Ecza deposu sipariş', 'truck', 'Depo stok/fiyat sorgu ve sipariş gönderimi', 'Tedarik', { selcuk: 'Selçuk Ecza', alliance: 'Alliance Healthcare', nevzat: 'Nevzat Ecza', hedef: 'Hedef Ecza', farmazon: 'Farmazon' }, ['customer:Depo müşteri kodu']],
    enabiz: ['e-Nabız / USS', 'heart', 'Muayene, tanı ve işlem kayıtlarının Sağlık Bakanlığı’na iletilmesi', 'Resmi', { saglik: 'Sağlık Bakanlığı USS', ortak: 'Yetkili çözüm ortağı' }, ['facility:Kurum / tesis kodu', 'doctor:Hekim tescil no']],
    erecete: ['e-Reçete', 'file', 'Reçetenin sisteme yazılması ve e-reçete numarası alınması', 'Resmi', { saglik: 'Sağlık Bakanlığı e-Reçete', medula: 'MEDULA Hastane' }, ['doctor:Diploma tescil no']],
    kps: ['Kimlik doğrulama (KPS / MERNİS)', 'shield', 'TC kimlik numarası doğrulaması', 'Resmi', { nvi: 'NVİ KPS', mernis: 'MERNİS kimlik doğrulama (ücretsiz)' }, []],
    vetbis: ['VETBİS / HAYBİS e-Reçete', 'paw', 'Veteriner ilaç takibi, e-reçete ve aşı bildirimi', 'Resmi', { tarim: 'Tarım ve Orman Bakanlığı' }, ['clinicNo:Klinik ruhsat no', 'vetNo:Veteriner hekim no']],
    petkayit: ['Evcil hayvan kayıt (PETVET)', 'paw', 'Mikroçip ve sahiplik kaydı', 'Resmi', { petvet: 'PETVET' }, []],
    kbs: ['KBS (Kimlik Bildirim Sistemi)', 'shield', 'Konaklayan bilgilerinin Emniyet / Jandarma’ya bildirimi', 'Resmi', { emniyet: 'Emniyet KBS', jandarma: 'Jandarma KBS', bulut: 'Bulut KBS' }, ['facility:Tesis kodu', 'auto:Check-in/out’ta otomatik bildir:checkbox']],
    kanal: ['Kanal yöneticisi (OTA)', 'globe', 'Booking, Expedia, Airbnb fiyat-müsaitlik ve rezervasyon senkronu', 'Pazaryeri', { hotelrunner: 'HotelRunner', siteminder: 'SiteMinder', booking: 'Booking.com (Connectivity)', expedia: 'Expedia', airbnb: 'Airbnb' }, ['hotelId:Otel ID', 'auto:Rezervasyonları otomatik çek:checkbox']],
    kapikilit: ['Kartlı kapı kilidi', 'key', 'Check-in’de oda kartı kodlama', 'Donanım', { salto: 'Salto', vingcard: 'Assa Abloy VingCard', onity: 'Onity', orbita: 'Orbita' }, ['encoder:Kodlayıcı adresi']],
    santral: ['Otel santrali (PBX)', 'phone', 'Oda telefon görüşmelerinin folyoya aktarılması', 'Donanım', { panasonic: 'Panasonic', alcatel: 'Alcatel', karel: 'Karel' }, ['tariff:Dakika ücreti (₺)']],
    aracbildirim: ['Kiralık araç bildirimi (Emniyet)', 'car', 'Kiralayan bilgilerinin bildirimi', 'Resmi', { emniyet: 'Emniyet Kiralık Araç Bildirim' }, ['firmCode:Firma kodu']],
    hgs: ['HGS / OGS geçiş sorgu', 'car', 'Kiralama süresindeki köprü-otoyol geçişleri', 'Ödeme', { ptt: 'PTT HGS', banka: 'Banka OGS' }, []],
    gps: ['Araç takip (GPS)', 'map', 'Konum, km ve hız bilgisi', 'Donanım', { arvento: 'Arvento', mobiliz: 'Mobiliz', trio: 'Trio Mobil', gzc: 'GZC' }, []],
    turnike: ['Turnike / kart okuyucu', 'lock', 'QR, RFID kart veya yüz tanıma ile giriş', 'Donanım', { zkteco: 'ZKTeco', perkotek: 'Perkotek', hikvision: 'Hikvision yüz tanıma', qr: 'QR turnike (HTTP)' }, ['device:Cihaz IP', 'relay:Röle süresi (sn)']],
    meb: ['MEBBİS / e-Yaygın', 'school', 'Kurs öğrenci kayıt ve devam bildirimleri', 'Resmi', { mebbis: 'MEBBİS', eyaygin: 'e-Yaygın' }, ['kurum:Kurum kodu']],
    onlineders: ['Online ders', 'play', 'Canlı ders bağlantısı oluşturma', 'Platform', { zoom: 'Zoom', meet: 'Google Meet', teams: 'Microsoft Teams' }, []],
    sgk: ['SGK e-Bildirge / işe giriş-çıkış', 'shield', 'Sigortalı işe giriş, çıkış ve APHB bildirimleri', 'Resmi', { sgk: 'SGK Web Servis' }, ['isyeri:İşyeri sicil no', 'subeKod:Şube kodu']],
    pdks: ['PDKS cihazı', 'clock', 'Parmak izi / kart / yüz ile giriş-çıkış verisi', 'Donanım', { zkteco: 'ZKTeco', perkotek: 'Perkotek', meyer: 'Meyer', hikvision: 'Hikvision' }, ['device:Cihaz IP']],
    ebordro: ['e-Bordro', 'mail', 'Bordroların personele elektronik iletilmesi', 'Platform', { edm: 'EDM e-Bordro', kep: 'KEP ile gönderim' }, []],
    bankamaas: ['Toplu maaş ödeme', 'building', 'Banka maaş ödeme dosyası / talimatı', 'Banka', { isbank: 'İş Bankası', garanti: 'Garanti BBVA', akbank: 'Akbank', ykb: 'Yapı Kredi', ziraat: 'Ziraat Bankası', vakif: 'VakıfBank' }, ['account:Firma hesap / IBAN']],
    banka: ['Banka hesap hareketleri', 'building', 'Açık bankacılık ile hareketlerin otomatik çekilmesi ve eşleştirme', 'Banka', { isbank: 'İş Bankası', garanti: 'Garanti BBVA', akbank: 'Akbank', ykb: 'Yapı Kredi', ziraat: 'Ziraat Bankası', vakif: 'VakıfBank', qnb: 'QNB' }, ['iban:IBAN', 'auto:Her gün otomatik çek:checkbox']],
    muhasebeaktar: ['Muhasebe programına aktarım', 'file', 'Fatura, tahsilat ve stok fişlerinin resmi muhasebeye aktarılması', 'Muhasebe', { logo: 'Logo', mikro: 'Mikro', netsis: 'Netsis', luca: 'Luca', zirve: 'Zirve', eta: 'ETA' }, ['firmNo:Firma / dönem no']],
    takvim: ['Takvim senkronu', 'calendar', 'Randevuların Google / Outlook takvimine yazılması', 'Platform', { google: 'Google Takvim', outlook: 'Outlook / Microsoft 365', ical: 'iCal akışı' }, ['calendarId:Takvim kimliği']],
    googleisletme: ['Google İşletme / Instagram rezervasyon', 'globe', 'Haritalar ve Instagram’dan randevu alma', 'Platform', { google: 'Google İşletme Profili', instagram: 'Instagram “Randevu al” butonu' }, []],
    ilan: ['İlan portalları', 'globe', 'Portföyün ilan sitelerine aktarılması', 'Pazaryeri', { sahibinden: 'sahibinden.com', hepsiemlak: 'Hepsiemlak', emlakjet: 'Emlakjet' }, ['office:Ofis / mağaza ID']],
    tramer: ['TRAMER / hasar sorgu', 'car', 'Araç hasar kaydı ve kilometre geçmişi sorgusu', 'Resmi', { sbm: 'SBM TRAMER', ortak: 'Çözüm ortağı' }, []],
    parca: ['Yedek parça tedarikçileri', 'wrench', 'Parça stok/fiyat sorgu ve sipariş', 'Tedarik', { martas: 'Martaş', basbug: 'Başbuğ', dinamik: 'Dinamik Oto', bosch: 'Bosch Car Service' }, ['customer:Bayi kodu']],
    anpr: ['Plaka tanıma kamerası & bariyer', 'car', 'Girişte plakanın otomatik okunması, abonede bariyerin açılması', 'Donanım', { hikvision: 'Hikvision ANPR', dahua: 'Dahua ITC', nedap: 'Nedap ANPR', ozel: 'Röle kartı (HTTP)' }, ['camera:Kamera IP', 'relay:Bariyer röle adresi']],
    kantar: ['Kantar (araç terazisi)', 'layers', 'Mal kabul ve sevkte dolu/boş araç tartımı', 'Donanım', { serial: 'Seri port (Web Serial)', tcp: 'Ağ indikatörü (TCP)', manuel: 'Elle giriş' }, ['host:İndikatör IP', 'baud:Baud hızı']],
    plc: ['Makine veri toplama (PLC / OPC-UA)', 'cog', 'Makine sayacı, duruş ve hız verisinin otomatik alınması', 'Donanım', { opcua: 'OPC-UA ağ geçidi', modbus: 'Modbus TCP', mqtt: 'MQTT', manuel: 'Operatör girişi' }, ['endpoint:Ağ geçidi adresi', 'interval:Okuma aralığı (sn)']],
  };
  const SECTOR = {
    pos: ['okc', 'pazaryeri', 'muhasebeaktar'], adisyon: ['okc', 'yemekplatform', 'yemekkarti', 'callerid', 'muhasebeaktar'], eczane: ['medula', 'its', 'uts', 'eczadeposu', 'okc'],
    randevu: ['takvim', 'googleisletme', 'esmm'], servis: ['callerid', 'takvim', 'muhasebeaktar'], klinik: ['enabiz', 'erecete', 'kps', 'esmm', 'takvim'], veteriner: ['vetbis', 'petkayit', 'esmm', 'takvim'],
    otel: ['kbs', 'kanal', 'kapikilit', 'santral', 'muhasebeaktar'], kiralama: ['aracbildirim', 'hgs', 'gps', 'kps'], spor: ['turnike', 'kps', 'takvim'], kurs: ['meb', 'onlineders', 'esmm'],
    ik: ['sgk', 'pdks', 'ebordro', 'bankamaas'], crm: ['takvim', 'callerid'], emlak: ['ilan', 'kps'], site: ['banka', 'muhasebeaktar'], eticaret: ['pazaryeri', 'kargofirma', 'eirsaliye'],
    kargo: ['kargofirma', 'gps', 'eirsaliye'], bilet: ['turnike', 'kps'], oto: ['anpr', 'okc', 'muhasebeaktar'], muhasebe: ['eirsaliye', 'esmm', 'emustahsil', 'edefter', 'banka', 'muhasebeaktar'],
    fabrika: ['eirsaliye', 'emustahsil', 'kantar', 'plc', 'muhasebeaktar', 'banka'],
  };
  Object.entries(CONN).forEach(([k, [title, ic, desc, cat, provs, extra]]) => {
    DEFS[k] = { title, icon: ic, desc, cat, conn: true, provs, defaults: { enabled: false, provider: 'sim', test: true },
      fields: (c) => [{ name: 'enabled', label: 'Bağlantı açık', type: 'checkbox', full: true }, { name: 'provider', label: 'Sağlayıcı', type: 'select', full: true, options: [{ value: 'sim', label: 'Simülasyon (test, gönderim yapılmaz)' }, ...Object.entries(provs).map(([value, label]) => ({ value, label })), { value: 'custom', label: 'Özel API / çözüm ortağı' }] },
        ...(c.provider !== 'sim' ? [F('url', 'Servis adresi (API / ara servis)', { full: true, required: c.provider === 'custom', placeholder: 'https://...', hint: 'İstekler {action, payload} JSON olarak köprü üzerinden gönderilir' }), F('user', 'Kullanıcı adı / API key'), F('pass', 'Şifre / secret', { type: 'password' })] : []),
        ...extra.map((x) => { const [name, label, type] = x.split(':'); return F(name, label, type ? { type } : {}); }), F('test', 'Test ortamı', { type: 'checkbox' })] };
  });
  // Bağlayıcı çağrısı: action ör. 'bildir', 'sorgu', 'gonder', 'iptal'
  async function call(kind, action, payload = {}, { silent } = {}) {
    const d = DEFS[kind]; const c = cfg(kind); if (!d) return { ok: false, error: 'Tanımsız bağlayıcı' };
    const label = `${d.title} · ${action}`;
    if (!c.enabled) { log(kind, payload.to || '', label, 'kapalı', 'Entegrasyonlar sayfasından açın'); if (!silent) toast(`${d.title} bağlantısı kapalı — Entegrasyonlar sayfasından açın`, 'err'); return { ok: false, disabled: true }; }
    const ref = (kind.slice(0, 3).toUpperCase()) + Date.now().toString().slice(-9);
    if (c.provider === 'sim') { log(kind, payload.to || payload.no || '', label, 'simülasyon', JSON.stringify(payload).slice(0, 200)); if (!silent) toast(`${d.title}: ${action} (simülasyon) · ${ref}`, 'ok'); return { ok: true, simulated: true, ref }; }
    if (!c.url) { log(kind, '', label, 'hata', 'Servis adresi tanımlı değil'); if (!silent) toast(`${d.title}: servis adresi tanımlı değil`, 'err'); return { ok: false, error: 'Servis adresi yok' }; }
    try {
      const r = await httpCall({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...(c.user ? { Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(`${c.user}:${c.pass || ''}`))) } : {}) }, body: JSON.stringify({ provider: c.provider, test: !!c.test, action, payload, app: appId(), at: new Date().toISOString() }) });
      let body = {}; try { body = JSON.parse(r.body); } catch (e) { /* düz metin */ }
      log(kind, payload.to || payload.no || '', label, r.ok ? 'gönderildi' : 'hata', r.error || r.body);
      if (!silent) toast(r.ok ? `${d.title}: ${action} tamam` : `${d.title} hatası: ${String(r.error || r.body).slice(0, 80)}`, r.ok ? 'ok' : 'err');
      return { ok: !!r.ok, ref: body.ref || body.id || ref, data: body };
    } catch (e) { log(kind, '', label, 'hata', e.message); if (!silent) toast(`${d.title}: ${e.message}`, 'err'); return { ok: false, error: e.message }; }
  }
  const isOn = (kind) => !!cfg(kind).enabled;
  const ALL = Object.keys(DEFS).filter((k) => !DEFS[k].conn);

  // ---------- SMS / WhatsApp / e-posta ----------
  async function sms(to, text, { silent } = {}) {
    const c = cfg('sms'); const p = SMS[c.provider] || SMS.sim; const num = normPhone(to);
    text = String(text).slice(0, c.maxLen || 612);
    if (!c.enabled) { log('sms', num, text, 'kapalı', 'SMS kapalı'); return { ok: false, error: 'SMS gönderimi kapalı' }; }
    if (!p.build) { log('sms', num, text, 'simülasyon', 'Gerçek gönderim yapılmadı'); if (!silent) toast(`SMS (simülasyon): ${to}`, 'ok'); return { ok: true, simulated: true }; }
    try {
      const r = await httpCall(p.build(c, num, text));
      const ok = p.ok ? p.ok(r, c) : r.ok;
      log('sms', num, text, ok ? 'gönderildi' : 'hata', r.error || r.body);
      if (!silent) toast(ok ? `SMS gönderildi: ${to}` : `SMS gönderilemedi: ${String(r.error || r.body).slice(0, 80)}`, ok ? 'ok' : 'err');
      return { ok, response: r };
    } catch (e) { log('sms', num, text, 'hata', e.message); if (!silent) toast('SMS gönderilemedi: ' + e.message, 'err'); return { ok: false, error: e.message }; }
  }
  async function whatsapp(to, text) {
    const c = cfg('whatsapp'); const num = normPhone(to);
    if (c.mode === 'link') { log('whatsapp', num, text, 'açıldı', 'wa.me bağlantısı'); origOpen(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); return { ok: true }; }
    try {
      const req = c.mode === 'cloud'
        ? { url: `https://graph.facebook.com/${c.version || 'v19.0'}/${c.phoneId}/messages`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.token }, body: JSON.stringify(c.template ? { messaging_product: 'whatsapp', to: num, type: 'template', template: { name: c.template, language: { code: 'tr' }, components: [{ type: 'body', parameters: [{ type: 'text', text }] }] } } : { messaging_product: 'whatsapp', to: num, type: 'text', text: { body: text } }) }
        : { url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...JSON.parse(c.headers || '{}') }, body: fill(c.body, { to: num, text: String(text).replace(/"/g, '\\"') }) };
      const r = await httpCall(req);
      log('whatsapp', num, text, r.ok ? 'gönderildi' : 'hata', r.error || r.body);
      toast(r.ok ? 'WhatsApp mesajı gönderildi' : 'WhatsApp gönderilemedi', r.ok ? 'ok' : 'err');
      return r;
    } catch (e) { log('whatsapp', num, text, 'hata', e.message); toast('WhatsApp gönderilemedi: ' + e.message, 'err'); return { ok: false, error: e.message }; }
  }
  async function email(to, subject, text) {
    const c = cfg('email');
    if (c.mode === 'mailto') { log('email', to, subject, 'açıldı', 'mailto'); location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`; return { ok: true }; }
    try {
      const req = c.mode === 'emailjs'
        ? { url: 'https://api.emailjs.com/api/v1.0/email/send', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: c.service, template_id: c.template, user_id: c.publicKey, template_params: { to_email: to, subject, message: text, from_name: c.from } }) }
        : { url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...JSON.parse(c.headers || '{}') }, body: fill(c.body, { to, subject: String(subject).replace(/"/g, '\\"'), text: String(text).replace(/"/g, '\\"').replace(/\n/g, '\\n') }) };
      const r = c.mode === 'emailjs' ? await fetch(req.url, req).then(async (x) => ({ ok: x.ok, status: x.status, body: await x.text() })) : await httpCall(req);
      log('email', to, subject, r.ok ? 'gönderildi' : 'hata', r.body); toast(r.ok ? 'E-posta gönderildi' : 'E-posta gönderilemedi', r.ok ? 'ok' : 'err'); return r;
    } catch (e) { log('email', to, subject, 'hata', e.message); toast('E-posta gönderilemedi: ' + e.message, 'err'); return { ok: false, error: e.message }; }
  }

  // ---------- ESC/POS fiş yazdırma ----------
  const CP857 = { 'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8a, 'ï': 0x8b, 'î': 0x8c, 'ı': 0x8d, 'Ä': 0x8e, 'É': 0x90, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97, 'İ': 0x98, 'Ö': 0x99, 'Ü': 0x9a, 'Ş': 0x9e, 'ş': 0x9f, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'Ğ': 0xa6, 'ğ': 0xa7 };
  const ASCII_TR = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
  function encode(str, c) {
    const out = [];
    for (const ch of String(str).replace(/₺/g, 'TL').replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/ /g, ' ')) {
      if (c.codepage === 'cp857' && CP857[ch]) out.push(CP857[ch]);
      else { const a = ASCII_TR[ch] || ch; const code = a.charCodeAt(0); out.push(code < 128 ? code : 63); }
    }
    return out;
  }
  // Fiş HTML'ini (.c ortalı, .r iki sütun, .big büyük, hr çizgi) satırlara çevirir
  function htmlToLines(html, cols) {
    const box = document.createElement('div'); box.innerHTML = html;
    const lines = [];
    // Satırı kelime sınırından böler; tek kelime satırdan uzunsa zorunlu olarak keser
    const wrap = (t, align, big) => {
      const w = big ? Math.floor(cols / 2) : cols; t = t.replace(/\s+/g, ' ').trim(); if (!t) return;
      let cur = '';
      t.split(' ').forEach((word) => {
        while (word.length > w) { if (cur) { lines.push({ text: cur, align, big }); cur = ''; } lines.push({ text: word.slice(0, w), align, big }); word = word.slice(w); }
        if ((cur ? cur.length + 1 : 0) + word.length > w) { lines.push({ text: cur, align, big }); cur = word; } else cur = cur ? cur + ' ' + word : word;
      });
      if (cur) lines.push({ text: cur, align, big });
    };
    const BLOCK = ['DIV', 'TABLE', 'P', 'H1', 'H2', 'H3', 'HR', 'TR'];
    const walk = (node, inAlign = 'left', inBig = false) => {
      for (const n of node.children) {
        if (n.tagName === 'HR') { lines.push({ text: '-'.repeat(cols), align: 'left' }); continue; }
        if (n.tagName === 'SVG' || n.tagName === 'svg' || n.tagName === 'STYLE' || n.tagName === 'SCRIPT') continue;
        const big = n.classList.contains('big') || inBig;
        const align = n.classList.contains('c') ? 'center' : inAlign;
        if (n.tagName === 'TR') { const cells = [...n.children].map((x) => x.textContent.trim()); const r = cells.pop() || ''; const l = cells.join(' '); lines.push({ text: l.length + r.length + 1 > cols ? (l + ' ' + r).slice(0, cols) : l + ' '.repeat(cols - l.length - r.length) + r, align: 'left' }); continue; }
        if (n.classList.contains('r') && n.children.length >= 2) {
          const l = n.children[0].textContent.trim(), r = n.children[n.children.length - 1].textContent.trim();
          const w = big ? Math.floor(cols / 2) : cols;
          if (l.length + r.length + 1 > w) { wrap(l, 'left', big); lines.push({ text: r.padStart(w), align: 'left', big }); } else lines.push({ text: l + ' '.repeat(w - l.length - r.length) + r, align: 'left', big });
          continue;
        }
        if (n.children.length && [...n.children].some((x) => BLOCK.includes(x.tagName) || ['TBODY', 'THEAD'].includes(x.tagName))) { walk(n, align, big); continue; }
        wrap(n.textContent, align, big || /^H[1-3]$/.test(n.tagName));
      }
    };
    walk(box);
    return lines;
  }
  function escposBytes(lines, c, { drawer } = {}) {
    const b = [0x1b, 0x40]; // başlat
    if (c.codepage === 'cp857') b.push(0x1b, 0x74, 13); // CP857
    lines.forEach((l) => {
      b.push(0x1b, 0x61, l.align === 'center' ? 1 : l.align === 'right' ? 2 : 0);
      b.push(0x1b, 0x45, l.big ? 1 : 0, 0x1d, 0x21, l.big ? 0x11 : 0x00);
      b.push(...encode(l.text, c), 0x0a);
    });
    b.push(0x1b, 0x45, 0, 0x1d, 0x21, 0);
    for (let i = 0; i < (c.feed ?? 4); i++) b.push(0x0a);
    if (c.cut) b.push(0x1d, 0x56, 0x42, 0x00);
    if (drawer) b.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return new Uint8Array(b);
  }
  async function serialPort(kind, baud, ask) {
    if (!('serial' in navigator)) throw new Error('Bu tarayıcı Web Serial desteklemiyor (Chrome veya Edge kullanın)');
    const want = (store.data.ports || {})[kind];
    let port = (await navigator.serial.getPorts()).find((p) => { const i = p.getInfo(); return want && i.usbVendorId === want.v && i.usbProductId === want.p; }) || (await navigator.serial.getPorts())[0];
    if (!port || ask) {
      port = await navigator.serial.requestPort();
      const i = port.getInfo(); store.data.ports = store.data.ports || {}; store.data.ports[kind] = { v: i.usbVendorId, p: i.usbProductId }; store.save();
    }
    if (!port.writable) await port.open({ baudRate: Number(baud) || 9600 });
    return port;
  }
  const toB64 = (u8) => { let s = ''; u8.forEach((x) => { s += String.fromCharCode(x); }); return btoa(s); };
  async function sendRaw(kind, bytes, c) {
    if (c.mode === 'serial') { const port = await serialPort(kind, c.baud); const w = port.writable.getWriter(); try { await w.write(bytes); } finally { w.releaseLock(); } return; }
    const j = await bridge('/yazdir', { host: c.host, port: c.port || 9100, data: toB64(bytes) });
    if (!j.ok) throw new Error(j.error || 'Yazıcı hatası');
  }
  async function printReceipt(html, { title = 'Fiş', drawer = false } = {}) {
    const c = cfg('printer');
    const copies = Math.max(1, Number(c.copies) || 1);
    if (c.mode === 'browser') {
      const w = Number(c.paper) === 58 ? '54mm' : '76mm';
      for (let i = 0; i < copies; i++) NS.printHtml(`<style>@page{size:${w} auto;margin:2mm} body{width:${w};font-size:${Number(c.paper) === 58 ? 10 : 12}px}</style>${html}`, { title });
      return true;
    }
    try {
      const bytes = escposBytes(htmlToLines(html, Number(c.cols) || 48), c, { drawer: drawer && c.drawer });
      for (let i = 0; i < copies; i++) await sendRaw('printer', bytes, c);
      log('yazici', c.mode === 'network' ? c.host : 'USB', title, 'yazdırıldı', `${bytes.length} bayt`);
      return true;
    } catch (e) {
      log('yazici', c.host || 'USB', title, 'hata', e.message);
      toast('Fiş yazıcı: ' + e.message + ' — tarayıcıdan yazdırılıyor', 'err');
      NS.printHtml(html, { title });
      return false;
    }
  }
  async function openDrawer() { const c = cfg('printer'); if (c.mode === 'browser' || !c.drawer) return; try { await sendRaw('printer', new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]), c); } catch (e) { toast('Kasa çekmecesi açılamadı: ' + e.message, 'err'); } }

  // ---------- Etiket (ZPL / TSPL) ----------
  async function printLabels(items, browserHtml) {
    const c = cfg('label');
    if (c.mode === 'browser') { NS.printHtml(`<style>@page{size:${c.w}mm ${c.h}mm;margin:1mm}</style>${browserHtml}`, { title: 'Etiket' }); return; }
    const dots = (mm) => Math.round((mm / 25.4) * (c.dpi || 203));
    const tr = (t) => String(t).replace(/[çğıöşüÇĞİÖŞÜ]/g, (ch) => ASCII_TR[ch]).replace(/₺/g, 'TL');
    const data = c.mode === 'zpl'
      ? items.map((i) => `^XA^CI28^PW${dots(c.w)}^LL${dots(c.h)}^FO15,10^A0N,26,26^FD${tr(i.name).slice(0, 28)}^FS^FO15,45^A0N,44,44^FD${tr(i.price)}^FS${i.barcode ? `^FO15,100^BY2^BCN,${dots(c.h) - 130},Y,N,N^FD${i.barcode}^FS` : ''}^XZ`).join('')
      : items.map((i) => `SIZE ${c.w} mm,${c.h} mm\r\nGAP 2 mm,0\r\nCLS\r\nTEXT 10,10,"3",0,1,1,"${tr(i.name).slice(0, 24)}"\r\nTEXT 10,45,"4",0,1,1,"${tr(i.price)}"\r\n${i.barcode ? `BARCODE 10,95,"128",${dots(c.h) - 130},1,0,2,2,"${i.barcode}"\r\n` : ''}PRINT 1\r\n`).join('');
    try { await sendRaw('label', new TextEncoder().encode(data), c); toast(`${items.length} etiket gönderildi`, 'ok'); log('etiket', c.host, `${items.length} etiket`, 'yazdırıldı'); } catch (e) { toast('Etiket yazıcı: ' + e.message, 'err'); log('etiket', c.host, '', 'hata', e.message); }
  }

  // ---------- Terazi ----------
  // Etiketli terazi barkodu: önek + PLU + değer (+ kontrol hanesi)
  function parseScaleBarcode(code) {
    const c = cfg('scale'); if (c.mode === 'serial') return null;
    code = String(code).trim();
    const pre = String(c.prefix || '27,28').split(',').map((x) => x.trim()).find((p) => p && code.startsWith(p));
    if (!pre || code.length < pre.length + Number(c.pluLen) + Number(c.valLen)) return null;
    const plu = code.substr(pre.length, Number(c.pluLen)); const val = Number(code.substr(pre.length + Number(c.pluLen), Number(c.valLen)));
    return c.valType === 'price' ? { plu, price: val / 100 } : { plu, kg: val / 1000 };
  }
  async function readScale({ ask } = {}) {
    const c = cfg('scale');
    if (c.mode === 'barcode') throw new Error('Terazi "barkodlu" modda; kasaya bağlı terazi için ayarlardan Web Serial seçin');
    const port = await serialPort('scale', c.baud, ask);
    if (c.request) { const w = port.writable.getWriter(); await w.write(new TextEncoder().encode(c.request === 'ENQ' ? '\x05' : c.request + '\r\n')); w.releaseLock(); }
    const reader = port.readable.getReader(); let buf = '';
    const deadline = Date.now() + 3000;
    try {
      while (Date.now() < deadline) {
        const r = await Promise.race([reader.read(), new Promise((res) => setTimeout(() => res({ timeout: true }), 800))]);
        if (r.timeout) continue; if (r.done) break;
        buf += new TextDecoder().decode(r.value);
        const lines = buf.split(/[\r\n\x03]+/);
        for (const l of lines.reverse()) {
          if (c.protocol === 'cas' && !/ST|S\s/.test(l)) continue;
          const m = l.match(/([-+]?\s*\d+[.,]\d+|\d{4,6})\s*(kg|g)?/i);
          if (m) { let v = Number(m[1].replace(/\s/g, '').replace(',', '.')); if (/^\d{4,6}$/.test(m[1])) v = v / 1000; if (/^g$/i.test(m[2] || '')) v /= 1000; if (v > 0) return Math.round(v * 1000) / 1000; }
        }
      }
      throw new Error('Teraziden geçerli ağırlık okunamadı (tartım sabit mi?)');
    } finally { reader.releaseLock(); }
  }

  // ---------- POS cihazı ----------
  function cardPayment(amount, { installmentAsk = true } = {}) {
    const c = cfg('pos');
    return new Promise((resolve) => {
      let done = false; const finish = (r, close) => { if (done) return; done = true; close && close(); log('pos', c.brand, money(amount), r.ok ? 'onaylandı' : 'iptal/red', r.ref || r.error || ''); resolve(r); };
      const { close } = modal({
        title: 'Kartla ödeme', closable: c.mode === 'manual',
        body: `<div class="center"><div class="muted">Tahsil edilecek</div><div style="font-size:40px;font-weight:800">${money(amount)}</div>
          ${installmentAsk && c.maxInst > 1 ? `<div class="row mt" style="justify-content:center"><label class="small muted">Taksit</label><select class="input" id="ins" style="max-width:140px">${Array.from({ length: Number(c.maxInst) }, (_, i) => `<option value="${i + 1}">${i ? i + 1 + ' taksit' : 'Tek çekim'}</option>`).join('')}</select></div>` : ''}
          <div class="mt" id="pst">${c.mode === 'manual' ? `<p class="muted">${esc(c.brand || '')} cihazında çekimi yapın, onaylandığında aşağıdaki düğmeye basın.</p>` : `<p class="muted">${icon('card')} Cihaza gönderiliyor, müşteriden kartı okutmasını isteyin...</p><div class="progress"><i style="width:100%;animation:fade 1s infinite alternate"></i></div>`}</div></div>`,
        actions: c.mode === 'manual' ? [{ label: 'İptal', onClick: (cl) => finish({ ok: false, error: 'Kasiyer iptal etti' }, cl) }, { label: 'Çekim onaylandı', cls: 'ok', icon: 'check', onClick: (cl) => { const ins = $('#ins'); finish({ ok: true, ref: 'MAN-' + Date.now().toString().slice(-6), installment: ins ? Number(ins.value) : 1 }, cl); } }] : [{ label: 'İptal', onClick: (cl) => finish({ ok: false, error: 'İptal edildi' }, cl) }],
        onClose: () => finish({ ok: false, error: 'Kapatıldı' }),
      });
      if (c.mode === 'manual') return;
      const ins = $('#ins'); const installment = ins ? Number(ins.value) : 1;
      const url = c.mode === 'demo' ? '/api/pos/satis' : c.url;
      (async () => {
        try {
          let j;
          if (url.startsWith('/')) j = await (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, installment }) })).json();
          else { const r = await httpCall({ url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, installment }) }); j = JSON.parse(r.body || '{}'); }
          if (j.ok) { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--ok);font-weight:700">${icon('check')} Onaylandı · ${esc(j.card || '')} · Onay ${esc(j.authCode || '')}</div>`); setTimeout(() => finish({ ok: true, ref: j.ref, authCode: j.authCode, installment }, close), 700); }
          else { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--err);font-weight:700">${icon('x')} ${esc(j.error || 'Reddedildi')}</div>`); setTimeout(() => finish({ ok: false, error: j.error }, close), 1800); }
        } catch (e) { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--err)">${esc(e.message)}</div>`); setTimeout(() => finish({ ok: false, error: e.message }, close), 2000); }
      })();
    });
  }

  // ---------- e-Fatura ----------
  async function sendEInvoice(doc) {
    const c = cfg('efatura');
    const type = doc.docType || (doc.buyerVkn && String(doc.buyerVkn).length === 10 && doc.eFaturaUser !== false ? 'e-Fatura' : 'e-Arşiv');
    const no = `${type === 'e-İrsaliye' ? 'IRS' : type === 'e-Fatura' ? c.efPrefix : c.eaPrefix}${new Date().getFullYear()}${String(Date.now()).slice(-9)}`;
    if (c.provider === 'sim') { log('efatura', doc.buyer || '', `${type} ${no}`, 'simülasyon', money(doc.total || 0)); toast(`${type} oluşturuldu (simülasyon): ${no}`, 'ok'); return { ok: true, simulated: true, type, no, uuid: crypto.randomUUID ? crypto.randomUUID() : NS.uid() }; }
    if (c.provider === 'custom' && c.url) {
      try { const r = await httpCall({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${c.user}:${c.pass}`) }, body: JSON.stringify({ type, no, ...doc }) }); log('efatura', doc.buyer, `${type} ${no}`, r.ok ? 'gönderildi' : 'hata', r.body); return { ok: r.ok, type, no }; } catch (e) { log('efatura', doc.buyer, no, 'hata', e.message); return { ok: false, error: e.message }; }
    }
    log('efatura', doc.buyer || '', `${type} ${no}`, 'kuyrukta', `${EFAT[c.provider]} entegrasyonu için sunucu tarafı yapılandırma gerekir`);
    toast(`${type} ${EFAT[c.provider]} kuyruğuna alındı`, 'ok');
    return { ok: true, queued: true, type, no };
  }

  // ---------- Webhook ----------
  async function emit(event, data) {
    const c = cfg('webhook'); if (!c.url) return;
    const evs = String(c.events || '*').split(',').map((x) => x.trim());
    if (!evs.includes('*') && !evs.includes(event)) return;
    const body = JSON.stringify({ event, app: appId(), at: new Date().toISOString(), data });
    let sig = '';
    try { if (c.secret && crypto.subtle) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(c.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); sig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(body)))).map((x) => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { /* imzasız gönder */ }
    httpCall({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Nebsoft-Signature': sig }, body }).then((r) => log('webhook', c.url, event, r.ok ? 'iletildi' : 'hata', r.status)).catch((e) => log('webhook', c.url, event, 'hata', e.message));
  }

  // ---------- Toplu yedek ----------
  function backupAll() {
    const all = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('nebsoft:')) all[k] = localStorage.getItem(k); }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ nebsoft: 1, at: new Date().toISOString(), data: all })], { type: 'application/json' })); a.download = `nebsoft-tum-veriler-${NS.today()}.json`; a.click();
    store.data.lastBackup = new Date().toISOString(); store.save(); toast('Tüm ürünlerin verisi yedeklendi', 'ok');
  }
  async function restoreAll() {
    const t = await NS.readFile('.json'); if (!t) return;
    try { const j = JSON.parse(t); if (!j.data) throw new Error(); if (!(await confirm(`${Object.keys(j.data).length} veri seti geri yüklenecek, mevcut veriler değişecek. Devam edilsin mi?`))) return; Object.entries(j.data).forEach(([k, v]) => localStorage.setItem(k, v)); toast('Geri yüklendi, sayfa yenileniyor', 'ok'); setTimeout(() => location.reload(), 800); } catch (e) { toast('Geçersiz yedek dosyası', 'err'); }
  }

  // ---------- Ayar ekranı ----------
  const STATUS = (kind) => {
    const c = cfg(kind);
    if (DEFS[kind].conn) return !c.enabled ? badge('Kapalı') : badge(c.provider === 'sim' ? 'Açık · simülasyon' : 'Açık · ' + (DEFS[kind].provs[c.provider] || 'Özel API'), c.provider === 'sim' ? 'info' : 'ok');
    const on2 = { sms: c.enabled && c.provider !== 'sim', whatsapp: c.mode !== 'link', email: c.mode !== 'mailto', printer: c.mode !== 'browser', label: c.mode !== 'browser', scale: true, pos: c.mode !== 'manual', efatura: c.provider !== 'sim', payment: c.provider !== 'none', barcode: true, webhook: !!c.url, backup: true }[kind];
    const name = { sms: (SMS[c.provider] || {}).name, whatsapp: { link: 'Bağlantı', cloud: 'Cloud API', custom: 'Özel API' }[c.mode], email: c.mode, printer: { browser: 'Tarayıcı', serial: 'USB/Seri', network: 'Ağ ' + (c.host || '') }[c.mode], label: c.mode, scale: { barcode: 'Barkodlu', serial: 'Seri port', both: 'Barkod + seri' }[c.mode], pos: POSB[c.mode] && POSB[c.mode].split(' (')[0], efatura: EFAT[c.provider], payment: c.provider, barcode: 'Klavye okuyucu', webhook: c.url ? 'Tanımlı' : 'Yok', backup: store.data.lastBackup ? 'Son: ' + NS.date(store.data.lastBackup) : 'Hiç alınmadı' }[kind];
    return `${badge(name || '-', on2 ? 'ok' : '')}`;
  };
  async function testKind(kind) {
    const c = cfg(kind);
    if (kind === 'sms') { const to = await NS.prompt('Test SMS gönderilecek numara', '05', { title: 'SMS testi', type: 'tel' }); if (to) sms(to, `NEBSOFT test mesajı · ${NS.dt(new Date())}`); }
    else if (kind === 'whatsapp') { const to = await NS.prompt('Numara', '05', { title: 'WhatsApp testi', type: 'tel' }); if (to) whatsapp(to, 'NEBSOFT WhatsApp test mesajı'); }
    else if (kind === 'email') { const to = await NS.prompt('E-posta adresi', '', { title: 'E-posta testi', type: 'email' }); if (to) email(to, 'NEBSOFT test', 'Bu bir test e-postasıdır.'); }
    else if (kind === 'printer') { if (c.mode === 'serial') { try { await serialPort('printer', c.baud, true); } catch (e) { return toast(e.message, 'err'); } } printReceipt(`<div class="c big">NEBSOFT</div><div class="c">Yazıcı test fişi</div><hr><div class="r"><span>Türkçe: çğıöşü ÇĞİÖŞÜ</span><span>OK</span></div><div class="r"><span>Kâğıt</span><span>${c.paper} mm</span></div><div class="r"><span>Satır</span><span>${c.cols} karakter</span></div><div class="r big"><span>TOPLAM</span><span>${money(123.45)}</span></div><hr><div class="c">${NS.dt(new Date())}</div>`, { title: 'Test fişi', drawer: true }); }
    else if (kind === 'label') { if (c.mode === 'browser' && false) return; printLabels([{ name: 'Test Ürünü', price: money(49.9), barcode: '8690000000017' }], `<div style="text-align:center;font-family:Arial"><b>Test Ürünü</b><div style="font-size:22px;font-weight:800">${money(49.9)}</div>${NS.barcodeSvg('8690000000017', { height: 36 })}</div>`); }
    else if (kind === 'scale') { if (c.mode === 'barcode') { const r = parseScaleBarcode('2700101015003'); toast(`Örnek barkod 2700101015003 → PLU ${r.plu}, ${r.kg !== undefined ? r.kg + ' kg' : money(r.price)}`, 'ok'); return; } try { const kg = await readScale({ ask: true }); toast(`Okunan ağırlık: ${kg} kg`, 'ok'); } catch (e) { toast(e.message, 'err'); } }
    else if (kind === 'pos') { const r = await cardPayment(1, { installmentAsk: false }); toast(r.ok ? `Test çekimi onaylandı (${r.ref})` : 'Test çekimi: ' + r.error, r.ok ? 'ok' : 'err'); }
    else if (kind === 'efatura') { const r = await sendEInvoice({ buyer: 'Test Müşteri', total: 100 }); toast(r.ok ? `${r.type} ${r.no}` : r.error, r.ok ? 'ok' : 'err'); }
    else if (kind === 'webhook') { await emit('test', { mesaj: 'NEBSOFT webhook testi' }); toast('Test olayı gönderildi, kayıtları kontrol edin'); }
    else if (kind === 'payment') toast(c.provider === 'none' ? 'Online ödeme kapalı (demo ödeme kullanılıyor)' : `${c.provider} ${c.sandbox ? 'test' : 'canlı'} anahtarları kaydedildi. Ödeme sayfası sunucu tarafında oluşturulur.`, 'ok');
    else if (kind === 'barcode') { const v = await NS.prompt('Okuyucuyla bir barkod okutun', '', { title: 'Barkod testi' }); if (v) toast(`Okunan: ${v} (${v.length} karakter)`, 'ok'); }
    else if (kind === 'backup') backupAll();
    else if (DEFS[kind].conn) { if (!c.enabled) return toast('Önce bağlantıyı açıp kaydedin', 'err'); call(kind, 'test', { mesaj: 'NEBSOFT bağlantı testi' }); }
  }
  function editKind(kind, done) {
    const d = DEFS[kind]; let c = cfg(kind);
    modal({
      title: `${d.title} ayarları`, size: 'wide',
      body: `<p class="small muted mb">${esc(d.desc)}</p><form id="ef" onsubmit="return false"></form><div id="ex" class="mt"></div>`,
      onOpen: (b) => {
        const draw = () => {
          $('#ef', b).innerHTML = fieldsHtml(d.fields(c), c);
          $('#ex', b).innerHTML = kind === 'backup' ? `<div class="row"><button class="btn" data-bk>${icon('download')} Tüm ürünleri yedekle</button><button class="btn" data-rs>${icon('upload')} Yedekten geri yükle</button></div>` :
            kind === 'printer' && c.mode !== 'browser' ? `<div class="card pad small" style="background:var(--surface-2)">${c.mode === 'serial' ? 'USB yazıcı için "Test et" dediğinizde tarayıcı bağlantı izni ister; bir kez izin verince hatırlanır.' : 'Ağ yazıcısına baskı <b>server.js</b> köprüsü üzerinden gider; uygulamayı <code>node server.js</code> ile açın.'}</div>` :
            kind === 'sms' && c.provider !== 'sim' ? `<div class="card pad small" style="background:var(--surface-2)">İstekler <b>server.js</b> köprüsü üzerinden gönderilir (tarayıcı CORS engeline takılmaz). Köprü durumu: <b id="bs">kontrol ediliyor...</b></div>` : '';
          const bs = $('#bs', b); if (bs) bridgeStatus().then((ok) => { bs.textContent = ok ? 'çalışıyor ✓' : 'kapalı — node server.js ile açın'; bs.style.color = ok ? 'var(--ok)' : 'var(--err)'; });
        };
        b.addEventListener('change', (e) => { if (['provider', 'mode'].includes(e.target.name)) { c = { ...c, ...readForm($('#ef', b), d.fields(c)) }; draw(); } });
        on(b, 'click', '[data-bk]', backupAll); on(b, 'click', '[data-rs]', restoreAll);
        draw();
      },
      actions: [{ label: 'Test et', icon: 'zap', onClick: (cl, b) => { setCfg(kind, { ...c, ...readForm($('#ef', b), d.fields(c)) }); testKind(kind); } }, { label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (cl, b) => { if (!NS.validate($('#ef', b))) return; setCfg(kind, { ...c, ...readForm($('#ef', b), d.fields(c)) }); cl(); toast(`${d.title} ayarları kaydedildi`, 'ok'); done && done(); } }],
    });
  }
  function page(el, app, kinds) {
    kinds = kinds || ALL;
    const sector = (SECTOR[appId()] || (appId() === 'pazar' ? Object.keys(CONN) : [])).filter((k) => !kinds.includes(k));
    store.load();
    let tab = 'liste';
    const card = (k) => `<div class="card pad col"><div class="row nw"><div class="kpi" style="padding:0"><div class="ic">${icon(DEFS[k].icon)}</div></div><div class="grow"><b>${esc(DEFS[k].title)}</b>${DEFS[k].cat ? ' ' + badge(DEFS[k].cat, DEFS[k].cat === 'Resmi' || DEFS[k].cat === 'e-Belge' ? 'warn' : 'acc') : ''}<div class="small muted">${esc(DEFS[k].desc)}</div></div></div><div>${STATUS(k)}</div><div class="row"><button class="btn sm grow" data-ed="${k}">${icon('settings')} Ayarla</button><button class="btn sm" data-ts="${k}">${icon('zap')} Test</button></div></div>`;
    const draw = () => {
      const logs = store.all('log');
      el.innerHTML = pageHead('Entegrasyonlar', 'SMS, yazıcı, terazi, POS cihazı, e-Belge, resmi kurum ve platform bağlantıları — tüm NEBSOFT ürünlerinde ortak çalışır', `<span class="small muted">Köprü: <b id="brs">...</b></span>`) + `
        <div class="tabs"><button data-tb="liste" class="${tab === 'liste' ? 'active' : ''}">Genel bağlantılar</button>${sector.length ? `<button data-tb="sektor" class="${tab === 'sektor' ? 'active' : ''}">Sektörel & resmi (${sector.length})</button>` : ''}<button data-tb="log" class="${tab === 'log' ? 'active' : ''}">Gönderim kayıtları (${logs.length})</button></div>
        ${tab === 'liste' ? `<div class="grid g-auto">${kinds.map(card).join('')}</div>` : tab === 'sektor' ? `<div class="card pad mb small muted">${icon('info')} Resmi kurum (GİB, SGK, Sağlık Bakanlığı, Emniyet...) ve platform bağlantıları yetkili entegratör / çözüm ortağı servisleri üzerinden çalışır. Sağlayıcıyı seçip servis adresi ve kimlik bilgilerini girin; “Simülasyon” modunda tüm akış kayıt altına alınır ama gönderim yapılmaz.</div><div class="grid g-auto">${sector.map(card).join('')}</div>`
        : `<div class="card"><div class="card-h"><select class="input" id="lk" style="max-width:200px"><option value="">Tüm türler</option>${[...new Set(logs.map((l) => l.kind))].map((k) => `<option>${k}</option>`).join('')}</select><span class="grow"></span><button class="btn sm" id="lc">${icon('trash')} Kayıtları temizle</button></div><div id="lt"></div></div>`}`;
      bridgeStatus().then((ok) => { const x = $('#brs', el); if (x) { x.textContent = ok ? 'çalışıyor' : 'kapalı'; x.style.color = ok ? 'var(--ok)' : 'var(--warn)'; } });
      if (tab === 'log') {
        const drawLog = () => { const k = $('#lk', el).value; $('#lt', el).innerHTML = table({ rows: logs.filter((l) => !k || l.kind === k), empty: 'Henüz kayıt yok', emptyIcon: 'send', columns: [{ label: 'Zaman', render: (l) => NS.dt(l.at) }, { label: 'Tür', render: (l) => badge(l.kind, 'acc') }, { label: 'Alıcı', key: 'to' }, { label: 'İçerik', render: (l) => `<span class="small">${esc(l.text)}</span>` }, { label: 'Durum', render: (l) => badge(l.status, /gönderildi|yazdırıldı|onaylandı|iletildi/.test(l.status) ? 'ok' : /hata|red/.test(l.status) ? 'err' : 'info') + (l.detail ? `<div class="small faint">${esc(l.detail.slice(0, 80))}</div>` : '') }, { label: 'Ürün', render: (l) => `<span class="small">${esc(l.app)}${l.user ? ' · ' + esc(l.user) : ''}</span>` }] }); };
        $('#lk', el).onchange = drawLog; $('#lc', el).onclick = async () => { if (await confirm('Tüm gönderim kayıtları silinsin mi?')) { store.set('log', []); draw(); } };
        drawLog();
      }
    };
    on(el, 'click', '[data-tb]', (e, b) => { tab = b.dataset.tb; draw(); });
    on(el, 'click', '[data-ed]', (e, b) => editKind(b.dataset.ed, draw));
    on(el, 'click', '[data-ts]', (e, b) => testKind(b.dataset.ts));
    draw();
  }

  NS.integ = { htmlToLines, cfg, setCfg, sms, whatsapp, email, printReceipt, openDrawer, printLabels, parseScaleBarcode, readScale, cardPayment, sendEInvoice, emit, backupAll, restoreAll, page, bridgeStatus, log, DEFS, normPhone, call, isOn, SECTOR, CONN, http: httpCall };
})();

/* ===== e-Belge merkezi: e-Fatura, e-Arşiv, e-İrsaliye giden/gelen kutusu =====
   Tüm ürünlerin kestiği belgeler ortak "nebsoft:ebelge" deposunda tutulur. Numara GİB biçiminde
   (3 harf seri + yıl + 9 hane sıra), ETTN (UUID) ve UBL-TR XML üretilir. Alıcı e-Fatura mükellefi ise
   e-Fatura, değilse e-Arşiv düzenlenir. Gelen faturalar kabul/red edilir ve ürünün alış kaydına aktarılır. */
(function () {
  'use strict';
  const NS = window.NS; const I = NS.integ; if (!I || NS.ebelge) return;
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
  const SELLERS = [['Ege Un Değirmeni A.Ş.', '3240119876'], ['Marmara Yağ Sanayi', '6110432985'], ['Akın Ambalaj Film San.', '0120558734'], ['Toptan Gıda Dağıtım Ltd.', '8790213456'], ['Kırtasiye Dünyası A.Ş.', '5430987612']];
  const store = new NS.DB('ebelge', (db) => {
    db.data.docs = []; db.data.payers = {};
    // Örnek gelen faturalar
    SELLERS.slice(0, 3).forEach(([name, vkn], i) => { const net = [18450, 9320, 26700][i]; db.data.docs.push({ id: NS.uid(), dir: 'gelen', type: 'e-Fatura', scenario: i === 1 ? 'TEMELFATURA' : 'TICARIFATURA', no: ['EGU', 'MYS', 'AKN'][i] + '2026' + String(1234 + i * 77).padStart(9, '0'), uuid: uuid(), date: iso(addDays(new Date(), -i - 1)), party: { name, vkn, taxOffice: 'Merkez', address: 'İzmir' }, currency: 'TRY', lines: [{ name: ['Buğday unu Tip 550 (50 kg çuval)', 'Bitkisel margarin 25 kg', 'Flow-pack film 120 mm'][i], qty: [40, 12, 8][i], unit: ['adet', 'adet', 'rulo'][i], price: r2(net / [40, 12, 8][i]), vat: i === 2 ? 20 : 1 }], status: i === 1 ? 'kabul' : 'yanit-bekliyor', app: '', created: new Date().toISOString(), history: [{ at: new Date().toISOString(), st: 'alındı' }] }); });
  });
  const ST = { taslak: ['Taslak', ''], kuyrukta: ['Kuyrukta', 'warn'], 'gonderildi': ['Gönderildi', 'info'], 'yanit-bekliyor': ['Yanıt bekliyor', 'warn'], kabul: ['Kabul edildi', 'ok'], red: ['Reddedildi', 'err'], raporlandi: ['GİB’e raporlandı', 'ok'], iptal: ['İptal', 'err'], hata: ['Hata', 'err'], 'iptal-talebi': ['İptal talebi', 'warn'] };
  const sellerInfo = () => { const s = NS.app && NS.app.db ? NS.app.db.settings() : {}; return { name: s.bizName || 'İşletme', vkn: s.taxNo || '', taxOffice: s.taxOffice || '', address: s.bizAddress || '', phone: s.bizPhone || '', iban: s.iban || '' }; };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : 'pazar');
  const appName = (id) => ({ muhasebe: 'Ön Muhasebe', pos: 'Market POS', eticaret: 'E-ticaret', otel: 'Otel', adisyon: 'Adisyon', fabrika: 'Fabrika ERP', eczane: 'Eczane', kiralama: 'Kiralama', klinik: 'Klinik', randevu: 'Randevu', servis: 'Teknik Servis', spor: 'Spor', kurs: 'Kurs', site: 'Site', emlak: 'Emlak', veteriner: 'Veteriner', crm: 'CRM', kargo: 'Kargo', bilet: 'Bilet', oto: 'Otopark', ik: 'İK' }[id] || id || '-');

  // Satırları tek biçime getirir; tutarı KDV dahil gelen satırlar (yalnız "total") ayrıştırılır
  function normLines(doc) {
    const ls = (doc.lines && doc.lines.length ? doc.lines : [{ name: doc.desc || 'Hizmet bedeli', total: doc.total }]).map((l) => {
      const qty = Number(l.qty) || 1; const vat = l.vat !== undefined && l.vat !== '' ? Number(l.vat) : Number(doc.vatRate !== undefined ? doc.vatRate : 20);
      const base = { name: l.name || l.desc || 'Kalem', code: l.code || l.barcode || '', qty, unit: l.unit || 'adet', vat };
      // Yalnız KDV dahil tutar verilmişse brüt korunur: KDV = brüt - matrah (kuruş kayması olmaz)
      if (l.price === undefined || l.price === null || l.price === '') { const gross = r2(l.total); const net = r2(gross / (1 + vat / 100)); return { ...base, price: Math.round((net / qty) * 10000) / 10000, disc: 0, net, vatAmt: r2(gross - net) }; }
      const price = Number(l.price); const disc = Number(l.disc) || 0; const net = r2(qty * price * (1 - disc / 100));
      return { ...base, price: r2(price), disc, net, vatAmt: r2(net * vat / 100) };
    });
    return ls;
  }
  const totals = (d) => { const net = r2(sum(d.lines, (l) => l.net !== undefined ? l.net : l.qty * l.price)); const vat = r2(sum(d.lines, (l) => l.vatAmt !== undefined ? l.vatAmt : l.qty * l.price * (l.vat || 0) / 100)); const byVat = {}; d.lines.forEach((l) => { byVat[l.vat] = r2((byVat[l.vat] || 0) + (l.vatAmt !== undefined ? l.vatAmt : l.qty * l.price * l.vat / 100)); }); return { net, vat, total: r2(net + vat), byVat }; };
  // Mükellef sorgusu: entegratör / GİB listesinden; simülasyonda VKN kontrol hanesi geçerli ve rakamlar toplamı çift olanlar mükellef sayılır
  async function isPayer(vkn) {
    vkn = String(vkn || '').replace(/\D/g, ''); if (!vkn) return { ok: true, payer: false };
    store.load(); const cached = store.data.payers[vkn];
    if (cached && cached.at > iso(addDays(new Date(), -7))) return { ok: true, payer: cached.payer, alias: cached.alias, cached: true };
    const c = I.cfg('efatura'); let payer = false, alias = '';
    if (c.provider === 'sim' || !c.url) { payer = vkn.length === 10 && vkn.split('').reduce((a, b) => a + Number(b), 0) % 2 === 0; alias = payer ? `urn:mail:defaultpk@${vkn}.efatura` : ''; }
    else { try { const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mukellef-sorgu', vkn }) }); const j = JSON.parse(r.body || '{}'); payer = !!j.payer; alias = j.alias || ''; } catch (e) { return { ok: false, error: e.message }; } }
    store.data.payers[vkn] = { payer, alias, at: today() }; store.save();
    return { ok: true, payer, alias };
  }
  function nextNo(prefix) { store.load(); const y = new Date().getFullYear(); const k = `_seq_${prefix}${y}`; store.data._meta[k] = (store.data._meta[k] || 0) + 1; store.save(); return `${prefix}${y}${String(store.data._meta[k]).padStart(9, '0')}`; }

  // Belge oluştur + gönder (tüm ürünlerin kullandığı tek giriş noktası)
  async function create(doc) {
    const c = I.cfg('efatura');
    let type = doc.docType;
    if (!type || type === 'auto') { const q = await isPayer(doc.buyerVkn); type = q.payer ? 'e-Fatura' : 'e-Arşiv'; }
    if (/irsaliye/i.test(type)) type = 'e-İrsaliye';
    const prefix = type === 'e-İrsaliye' ? (c.irsPrefix || 'IRS') : type === 'e-Fatura' ? (c.efPrefix || 'NEB') : (c.eaPrefix || 'EAR');
    const rec = { id: NS.uid(), dir: 'giden', type, scenario: type === 'e-Fatura' ? (doc.scenario || c.scenario || 'TICARIFATURA') : type === 'e-Arşiv' ? 'EARSIVFATURA' : 'TEMELIRSALIYE', kind: doc.kind || (doc.refund ? 'IADE' : 'SATIS'), no: nextNo(String(prefix).toUpperCase().slice(0, 3).padEnd(3, 'X')), uuid: uuid(), date: doc.date || today(), time: new Date().toTimeString().slice(0, 5),
      party: { name: doc.buyer || 'Nihai tüketici', vkn: String(doc.buyerVkn || '11111111111'), taxOffice: doc.buyerTaxOffice || '', address: doc.address || doc.buyerAddress || '', email: doc.buyerEmail || '' }, seller: sellerInfo(),
      currency: doc.currency || 'TRY', rate: doc.rate || 1, lines: normLines(doc), note: doc.note || '', ref: doc.no || '', app: appId(), plate: doc.plate || '', driver: doc.driver || '', status: 'taslak', created: new Date().toISOString(), history: [], test: !!c.test };
    const tt = totals(rec); Object.assign(rec, tt);
    store.load(); store.data.docs.unshift(rec); store.save();
    return send(rec);
  }
  async function send(rec) {
    const c = I.cfg('efatura'); const hist = (st, note) => { rec.history.push({ at: new Date().toISOString(), st, note, user: NS.currentUser ? NS.currentUser.name : '' }); };
    if (c.provider === 'sim') { rec.status = rec.type === 'e-Arşiv' ? 'raporlandi' : rec.scenario === 'TICARIFATURA' ? 'yanit-bekliyor' : 'gonderildi'; hist(rec.status, 'Simülasyon'); I.log('efatura', rec.party.name, `${rec.type} ${rec.no}`, 'simülasyon', money(rec.total)); toast(`${rec.type} ${rec.no} oluşturuldu`, 'ok'); }
    else if (c.url) {
      try { const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(`${c.user || ''}:${c.pass || ''}`))) }, body: JSON.stringify({ action: 'gonder', provider: c.provider, test: !!c.test, ubl: ubl(rec), belge: rec }) });
        rec.status = r.ok ? (rec.type === 'e-Arşiv' ? 'raporlandi' : 'gonderildi') : 'hata'; hist(rec.status, String(r.body || r.error || '').slice(0, 200)); I.log('efatura', rec.party.name, `${rec.type} ${rec.no}`, r.ok ? 'gönderildi' : 'hata', r.body);
        toast(r.ok ? `${rec.type} ${rec.no} gönderildi` : `${rec.type} gönderilemedi — e-Belgeler ekranından tekrar deneyin`, r.ok ? 'ok' : 'err');
      } catch (e) { rec.status = 'hata'; hist('hata', e.message); toast('e-Belge gönderilemedi: ' + e.message, 'err'); }
    } else { rec.status = 'kuyrukta'; hist('kuyrukta', 'Entegratör servis adresi tanımlı değil'); toast(`${rec.type} ${rec.no} kuyruğa alındı — Entegrasyonlar > e-Fatura’dan servis adresini girin`, ''); }
    store.save();
    if (rec.type === 'e-Arşiv' && rec.party.email && I.cfg('email').mode !== 'mailto') I.email(rec.party.email, `${rec.seller.name} e-Arşiv faturası ${rec.no}`, `Sayın ${rec.party.name},\n\n${rec.no} numaralı ${money(rec.total)} tutarlı e-Arşiv faturanız düzenlenmiştir.\nETTN: ${rec.uuid}\n\n${rec.seller.name}`);
    return { ok: rec.status !== 'hata', id: rec.id, type: rec.type, no: rec.no, uuid: rec.uuid, simulated: c.provider === 'sim', queued: rec.status === 'kuyrukta', status: rec.status };
  }
  const xe = (s) => String(s === undefined || s === null ? '' : s).replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]));
  function ubl(d) {
    const isIrs = d.type === 'e-İrsaliye'; const root = isIrs ? 'DespatchAdvice' : 'Invoice';
    const party = (p, tag) => `<cac:${tag}><cac:Party><cac:PartyIdentification><cbc:ID schemeID="${String(p.vkn).length === 11 ? 'TCKN' : 'VKN'}">${xe(p.vkn)}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${xe(p.name)}</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>${xe(p.address)}</cbc:StreetName><cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>${xe(p.taxOffice)}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme></cac:Party></cac:${tag}>`;
    const sup = d.dir === 'gelen' ? d.party : d.seller; const cus = d.dir === 'gelen' ? sellerInfo() : d.party;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n<cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:CustomizationID>TR1.2</cbc:CustomizationID><cbc:ProfileID>${xe(d.scenario)}</cbc:ProfileID><cbc:ID>${xe(d.no)}</cbc:ID><cbc:UUID>${xe(d.uuid)}</cbc:UUID><cbc:IssueDate>${xe(d.date)}</cbc:IssueDate><cbc:IssueTime>${xe(d.time || '12:00')}:00</cbc:IssueTime>${isIrs ? '<cbc:DespatchAdviceTypeCode>SEVK</cbc:DespatchAdviceTypeCode>' : `<cbc:InvoiceTypeCode>${xe(d.kind || 'SATIS')}</cbc:InvoiceTypeCode>`}<cbc:DocumentCurrencyCode>${xe(d.currency)}</cbc:DocumentCurrencyCode>${d.note ? `<cbc:Note>${xe(d.note)}</cbc:Note>` : ''}\n${party(sup, isIrs ? 'DespatchSupplierParty' : 'AccountingSupplierParty')}\n${party(cus, isIrs ? 'DeliveryCustomerParty' : 'AccountingCustomerParty')}\n${isIrs ? `<cac:Shipment><cac:ShipmentStage><cac:TransportMeans><cac:RoadTransport><cbc:LicensePlateID>${xe(d.plate)}</cbc:LicensePlateID></cac:RoadTransport></cac:TransportMeans><cac:DriverPerson><cbc:FirstName>${xe(d.driver)}</cbc:FirstName></cac:DriverPerson></cac:ShipmentStage></cac:Shipment>` : `<cac:TaxTotal><cbc:TaxAmount currencyID="${xe(d.currency)}">${r2(d.vat).toFixed(2)}</cbc:TaxAmount></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${xe(d.currency)}">${r2(d.net).toFixed(2)}</cbc:LineExtensionAmount><cbc:TaxInclusiveAmount currencyID="${xe(d.currency)}">${r2(d.total).toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${xe(d.currency)}">${r2(d.total).toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`}\n${d.lines.map((l, i) => isIrs ? `<cac:DespatchLine><cbc:ID>${i + 1}</cbc:ID><cbc:DeliveredQuantity unitCode="C62">${l.qty}</cbc:DeliveredQuantity><cac:Item><cbc:Name>${xe(l.name)}</cbc:Name></cac:Item></cac:DespatchLine>` : `<cac:InvoiceLine><cbc:ID>${i + 1}</cbc:ID><cbc:InvoicedQuantity unitCode="C62">${l.qty}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="${xe(d.currency)}">${r2(l.net !== undefined ? l.net : l.qty * l.price).toFixed(2)}</cbc:LineExtensionAmount><cac:TaxTotal><cac:TaxSubtotal><cbc:Percent>${l.vat}</cbc:Percent></cac:TaxSubtotal></cac:TaxTotal><cac:Item><cbc:Name>${xe(l.name)}</cbc:Name></cac:Item><cac:Price><cbc:PriceAmount currencyID="${xe(d.currency)}">${r2(l.price).toFixed(2)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`).join('\n')}\n</${root}>`;
  }
  function html(d) {
    const sup = d.dir === 'gelen' ? d.party : d.seller || sellerInfo(); const cus = d.dir === 'gelen' ? sellerInfo() : d.party;
    const m = (v) => (d.currency && d.currency !== 'TRY' ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: d.currency }).format(v) : money(v));
    const isIrs = d.type === 'e-İrsaliye';
    return `<div class="doc" style="font-size:12px"><table><tr><td style="width:40%"><b style="font-size:14px">${esc(sup.name)}</b><br>${esc(sup.address || '')}<br>${sup.phone ? 'Tel: ' + esc(sup.phone) + '<br>' : ''}Vergi Dairesi: ${esc(sup.taxOffice || '')}<br>${String(sup.vkn).length === 11 ? 'TCKN' : 'VKN'}: ${esc(sup.vkn || '')}</td><td style="text-align:center"><div style="font-size:20px;font-weight:800">${isIrs ? 'e-İRSALİYE' : d.type === 'e-Arşiv' ? 'e-ARŞİV FATURA' : 'e-FATURA'}</div>${NS.qrSvg(JSON.stringify({ no: d.no, ettn: d.uuid, tarih: d.date, vkn: sup.vkn, tutar: d.total }), 96)}</td><td style="text-align:right"><table style="margin-left:auto;font-size:11px"><tr><td>Senaryo</td><td><b>${esc(d.scenario)}</b></td></tr><tr><td>Tip</td><td><b>${esc(isIrs ? 'SEVK' : d.kind || 'SATIS')}</b></td></tr><tr><td>No</td><td><b>${esc(d.no)}</b></td></tr><tr><td>Tarih</td><td>${NS.date(d.date)} ${esc(d.time || '')}</td></tr>${d.ref ? `<tr><td>Belge ref.</td><td>${esc(d.ref)}</td></tr>` : ''}</table></td></tr></table>
      <hr><b>SAYIN</b><br><b>${esc(cus.name)}</b><br>${esc(cus.address || '')}<br>Vergi Dairesi: ${esc(cus.taxOffice || '')} · ${String(cus.vkn).length === 11 ? 'TCKN' : 'VKN'}: ${esc(cus.vkn || '')}${cus.email ? '<br>E-posta: ' + esc(cus.email) : ''}<div style="margin:8px 0;font-size:10px">ETTN: ${esc(d.uuid)}</div>
      <table><tr><th>#</th><th>Mal / hizmet</th><th style="text-align:right">Miktar</th>${isIrs ? '' : '<th style="text-align:right">Birim fiyat</th><th>İsk.</th><th>KDV</th><th style="text-align:right">KDV tutarı</th><th style="text-align:right">Tutar</th>'}</tr>${d.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}${l.code ? `<div style="font-size:10px;color:#666">${esc(l.code)}</div>` : ''}</td><td style="text-align:right">${NS.num(l.qty)} ${esc(l.unit || '')}</td>${isIrs ? '' : `<td style="text-align:right">${m(l.price)}</td><td>${l.disc ? '%' + l.disc : ''}</td><td>%${l.vat}</td><td style="text-align:right">${m(l.vatAmt !== undefined ? l.vatAmt : l.qty * l.price * l.vat / 100)}</td><td style="text-align:right">${m(l.net !== undefined ? l.net : l.qty * l.price)}</td>`}</tr>`).join('')}</table>
      ${isIrs ? `<p>Araç plakası: ${esc(d.plate || '-')} · Şoför: ${esc(d.driver || '-')}</p>` : `<table style="width:320px;margin-left:auto;margin-top:10px"><tr><td>Mal / hizmet toplamı</td><td style="text-align:right">${m(d.net)}</td></tr>${Object.entries(d.byVat || {}).filter(([, v]) => v).map(([k, v]) => `<tr><td>Hesaplanan KDV (%${k})</td><td style="text-align:right">${m(v)}</td></tr>`).join('')}<tr><td><b>Vergiler dahil toplam</b></td><td style="text-align:right"><b>${m(d.total)}</b></td></tr><tr><td><b>Ödenecek tutar</b></td><td style="text-align:right"><b>${m(d.total)}</b></td></tr></table>`}
      ${d.note ? `<p><b>Not:</b> ${esc(d.note)}</p>` : ''}${sup.iban ? `<p>IBAN: ${esc(sup.iban)}</p>` : ''}<p style="font-size:10px;color:#555">${d.type === 'e-Arşiv' ? 'e-Arşiv izni kapsamında elektronik ortamda iletilmiştir.' : 'Bu belge elektronik ortamda düzenlenmiştir.'}${d.test ? ' — TEST ORTAMI' : ''}</p></div>`;
  }
  const download = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); };
  function view(id) {
    store.load(); const d = store.get('docs', id); if (!d) return toast('Belge bulunamadı', 'err');
    modal({ title: `${d.type} · ${d.no}`, size: 'xl', body: `<div class="row mb">${badge(ST[d.status][0], ST[d.status][1])} ${badge(d.scenario, 'acc')} ${d.dir === 'gelen' ? badge('Gelen', 'info') : badge('Giden · ' + appName(d.app))}</div><div style="background:#fff;color:#111;border-radius:10px;padding:14px;border:1px solid var(--border)">${html(d)}</div>
      <h3 class="mt mb">Belge geçmişi</h3>${table({ rows: d.history.slice().reverse(), empty: 'Kayıt yok', columns: [{ label: 'Zaman', render: (h) => NS.dt(h.at) }, { label: 'Durum', render: (h) => esc((ST[h.st] || [h.st])[0]) }, { label: 'Not', render: (h) => `<span class="small">${esc(h.note || '')}</span>` }, { label: 'Kullanıcı', render: (h) => esc(h.user || '') }] })}`,
      actions: [{ label: 'XML (UBL-TR)', icon: 'download', onClick: () => download(`${d.no}.xml`, ubl(d), 'application/xml') }, { label: 'Yazdır / PDF', icon: 'print', onClick: () => NS.printHtml(html(d), { title: d.no }) }, ...(d.party.email || d.dir === 'giden' ? [{ label: 'E-posta', icon: 'mail', onClick: async () => { const to = d.party.email || (await NS.prompt('Alıcı e-posta adresi', '', { title: 'e-Belge gönder', type: 'email' })); if (to) I.email(to, `${d.type} ${d.no}`, `Sayın ${d.party.name},\n\n${d.no} numaralı ${d.type} belgeniz: ${money(d.total)}\nETTN: ${d.uuid}\nTarih: ${NS.date(d.date)}\n\n${(d.seller || sellerInfo()).name}`); } }] : []), { label: 'Kapat', cls: 'primary' }] });
  }
  // Ürünlerin gelen faturayı kendi alış kaydına dönüştürmesi için kayıt noktası
  let importer = null;
  const onImport = (fn, label) => { importer = { fn, label: label || 'Alış kaydı oluştur' }; };
  async function query(d) {
    const c = I.cfg('efatura');
    if (c.provider === 'sim' || !c.url) { if (d.status === 'yanit-bekliyor' && Math.random() < 0.7) d.status = 'kabul'; else if (d.status === 'gonderildi') d.status = 'kabul'; else if (d.status === 'kuyrukta' && c.url) d.status = 'gonderildi'; }
    else { try { const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'durum-sorgu', uuid: d.uuid, no: d.no }) }); const j = JSON.parse(r.body || '{}'); if (j.status && ST[j.status]) d.status = j.status; } catch (e) { return toast(e.message, 'err'); } }
    d.history.push({ at: new Date().toISOString(), st: d.status, note: 'Durum sorgulandı', user: NS.currentUser ? NS.currentUser.name : '' }); store.save();
  }
  async function cancel(d) {
    if (d.type === 'e-Arşiv' || d.type === 'e-İrsaliye' || (d.scenario === 'TICARIFATURA' && d.status === 'yanit-bekliyor')) {
      if (!(await confirm(`${d.no} iptal edilsin mi? İptal GİB’e bildirilir ve geri alınamaz.`))) return false;
      d.status = 'iptal'; d.history.push({ at: new Date().toISOString(), st: 'iptal', note: 'İptal edildi', user: NS.currentUser ? NS.currentUser.name : '' });
    } else {
      const why = await NS.prompt('e-Fatura alıcı tarafından kabul edildiği / temel senaryoda olduğu için GİB portalı üzerinden iptal talebi oluşturulur. Gerekçe:', '', { title: 'İptal talebi' }); if (why === null) return false;
      d.status = 'iptal-talebi'; d.history.push({ at: new Date().toISOString(), st: 'iptal-talebi', note: why, user: NS.currentUser ? NS.currentUser.name : '' });
    }
    store.save(); I.log('efatura', d.party.name, `${d.no} iptal`, d.status); return true;
  }
  function page(el, p, app) {
    store.load();
    const tab = p || 'giden'; let q = '', tf = '', sf = '';
    const docs = () => store.all('docs').filter((d) => (tab === 'giden' ? d.dir === 'giden' : d.dir === 'gelen'));
    const mo = today().slice(0, 7); const out = store.all('docs').filter((d) => d.dir === 'giden' && d.date.slice(0, 7) === mo && d.status !== 'iptal');
    const imp = importer;
    el.innerHTML = pageHead('e-Belgeler', 'e-Fatura, e-Arşiv ve e-İrsaliye giden / gelen kutusu — tüm NEBSOFT ürünlerinde ortak', `<button class="btn" id="eb-q">${icon('search')} Mükellef sorgula</button><button class="btn" id="eb-in">${icon('download')} Gelen belgeleri al</button><button class="btn" id="eb-bulk">${icon('refresh')} Durumları güncelle</button><button class="btn primary" id="eb-new">${icon('plus')} Manuel e-Arşiv</button>`) + `
      <div class="grid g4 mb">${kpi('Bu ay giden', out.length, 'send', 'info', `<div class="small faint">${money(sum(out, (d) => d.total * (d.rate || 1)))}</div>`)}${kpi('e-Fatura / e-Arşiv', `${out.filter((d) => d.type === 'e-Fatura').length} / ${out.filter((d) => d.type === 'e-Arşiv').length}`, 'file')}${kpi('Yanıt bekleyen gelen', store.all('docs').filter((d) => d.dir === 'gelen' && d.status === 'yanit-bekliyor').length, 'clock', 'warn')}${kpi('Hatalı / kuyrukta', store.all('docs').filter((d) => ['hata', 'kuyrukta'].includes(d.status)).length, 'alert', 'err')}</div>
      <div class="tabs">${[['giden', 'Giden kutusu'], ['gelen', 'Gelen kutusu'], ['mukellef', 'Mükellef listesi']].map(([k, l]) => `<a href="#/ebelge/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div>
      <div class="card"><div class="card-h">${NS.searchBox('ebq', 'Belge no, ünvan, VKN, ETTN...')}${tab !== 'mukellef' ? `<select class="input" id="ebt" style="max-width:160px"><option value="">Tüm türler</option><option>e-Fatura</option><option>e-Arşiv</option><option>e-İrsaliye</option></select><select class="input" id="ebs" style="max-width:170px"><option value="">Tüm durumlar</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>` : ''}<span class="grow"></span><button class="btn sm" id="ebx">${icon('download')}</button></div><div id="ebl"></div></div>`;
    const draw = () => {
      if (tab === 'mukellef') { const rows = Object.entries(store.data.payers).map(([vkn, x]) => ({ id: vkn, vkn, ...x })).filter((x) => NS.match(q, x.vkn, x.alias)); $('#ebl', el).innerHTML = table({ rows, empty: 'Henüz sorgu yok — "Mükellef sorgula" ile VKN sorgulayın', columns: [{ label: 'VKN / TCKN', render: (x) => `<b class="mono">${esc(x.vkn)}</b>` }, { label: 'Durum', render: (x) => (x.payer ? badge('e-Fatura mükellefi', 'ok') : badge('Mükellef değil → e-Arşiv', 'warn')) }, { label: 'Posta kutusu (alias)', render: (x) => `<span class="small mono">${esc(x.alias || '-')}</span>` }, { label: 'Sorgu tarihi', render: (x) => NS.date(x.at) }] }); return; }
      const rows = docs().filter((d) => (!tf || d.type === tf) && (!sf || d.status === sf) && NS.match(q, d.no, d.party.name, d.party.vkn, d.uuid, d.ref)).sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created));
      $('#ebl', el).innerHTML = table({ rows, empty: tab === 'giden' ? 'Henüz belge kesilmedi. Faturalar, satış ve sevkiyat ekranlarından e-Belge oluşturabilirsiniz.' : 'Gelen belge yok', emptyIcon: 'file', columns: [{ label: 'Tarih', render: (d) => NS.date(d.date) }, { label: 'Belge no', render: (d) => `<b class="mono">${esc(d.no)}</b><div class="small faint">${esc(d.ref ? 'Ref: ' + d.ref + ' · ' : '')}${esc(appName(d.app))}</div>` }, { label: 'Tür', render: (d) => badge(d.type, d.type === 'e-Fatura' ? 'acc' : d.type === 'e-Arşiv' ? 'info' : 'warn') + `<div class="small faint">${esc(d.scenario)}</div>` }, { label: tab === 'giden' ? 'Alıcı' : 'Gönderen', render: (d) => `${esc(d.party.name)}<div class="small faint mono">${esc(d.party.vkn)}</div>` }, { label: 'Tutar', cls: 'right', render: (d) => (d.type === 'e-İrsaliye' ? '-' : `<b>${d.currency && d.currency !== 'TRY' ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: d.currency }).format(d.total) : money(d.total)}</b><div class="small faint">KDV ${money(d.vat)}</div>`) }, { label: 'Durum', render: (d) => badge(ST[d.status][0], ST[d.status][1]) + (d.imported ? `<div>${badge('Alışa aktarıldı', 'ok')}</div>` : '') }],
        actions: [{ icon: 'eye', act: 'v', title: 'Görüntüle' }, ...(tab === 'giden' ? [{ icon: 'refresh', act: 'q', title: 'Durum sorgula', show: (d) => ['gonderildi', 'yanit-bekliyor', 'kuyrukta'].includes(d.status) }, { icon: 'send', act: 'rs', title: 'Tekrar gönder', show: (d) => ['hata', 'kuyrukta'].includes(d.status) }, { icon: 'x', act: 'cx', title: 'İptal', show: (d) => !['iptal', 'iptal-talebi', 'hata'].includes(d.status) }] : [{ label: 'Kabul', act: 'ok', show: (d) => d.status === 'yanit-bekliyor' }, { label: 'Red', act: 'red', show: (d) => d.status === 'yanit-bekliyor' }, ...(imp ? [{ label: imp.label, act: 'imp', show: (d) => !d.imported && d.status !== 'red' }] : [])])],
        foot: `${rows.length} belge · ${money(sum(rows, (d) => d.total * (d.rate || 1)))}` });
    };
    $('#ebq', el).oninput = (e) => { q = e.target.value; draw(); };
    if ($('#ebt', el)) { $('#ebt', el).onchange = (e) => { tf = e.target.value; draw(); }; $('#ebs', el).onchange = (e) => { sf = e.target.value; draw(); }; }
    $('#ebx', el).onclick = () => NS.csv('e-belgeler-' + tab, docs(), [{ key: 'date', label: 'Tarih' }, { key: 'no', label: 'Belge no' }, { key: 'type', label: 'Tür' }, { key: 'uuid', label: 'ETTN' }, { label: 'Ünvan', value: (d) => d.party.name }, { label: 'VKN', value: (d) => d.party.vkn }, { key: 'net', label: 'Matrah' }, { key: 'vat', label: 'KDV' }, { key: 'total', label: 'Toplam' }, { label: 'Durum', value: (d) => ST[d.status][0] }]);
    $('#eb-q', el).onclick = async () => { const v = await NS.prompt('VKN (10 hane) veya TCKN (11 hane)', '', { title: 'e-Fatura mükellef sorgusu' }); if (!v) return; const r = await isPayer(v); if (r.ok) toast(r.payer ? `${v}: e-Fatura mükellefi — e-Fatura kesilir` : `${v}: mükellef değil — e-Arşiv kesilir`, r.payer ? 'ok' : 'warn'); if (tab === 'mukellef') app.refresh(); };
    $('#eb-in', el).onclick = async () => {
      const c = I.cfg('efatura'); let list = [];
      if (c.provider === 'sim' || !c.url) { const [name, vkn] = SELLERS[Math.floor(Math.random() * SELLERS.length)]; const qty = 5 + Math.floor(Math.random() * 20); const price = 100 + Math.floor(Math.random() * 900); list = [{ type: Math.random() < 0.7 ? 'e-Fatura' : 'e-Arşiv', scenario: 'TICARIFATURA', no: name.slice(0, 3).toLocaleUpperCase('tr-TR').replace(/[^A-Z]/g, 'X') + new Date().getFullYear() + String(Date.now()).slice(-9), uuid: uuid(), date: today(), party: { name, vkn, taxOffice: 'Merkez', address: '' }, currency: 'TRY', lines: [{ name: 'Ticari mal', qty, unit: 'adet', price, vat: 20 }] }]; }
      else { try { const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'gelen-listele', since: store.data._meta.inSince || '' }) }); list = (JSON.parse(r.body || '{}').docs) || []; } catch (e) { return toast(e.message, 'err'); } }
      let n = 0; list.forEach((x) => { if (store.find('docs', (d) => d.uuid === x.uuid)) return; const lines = (x.lines || []).map((l) => ({ ...l, net: r2(l.qty * l.price), vatAmt: r2(l.qty * l.price * (l.vat || 0) / 100) })); store.data.docs.unshift({ id: NS.uid(), dir: 'gelen', status: x.type === 'e-Fatura' && x.scenario === 'TICARIFATURA' ? 'yanit-bekliyor' : 'kabul', app: '', created: new Date().toISOString(), history: [{ at: new Date().toISOString(), st: 'alındı' }], ...x, lines, ...totals({ lines }) }); n++; });
      store.data._meta.inSince = new Date().toISOString(); store.save(); toast(`${n} yeni gelen belge`, n ? 'ok' : ''); app.refresh();
    };
    $('#eb-bulk', el).onclick = async () => { const ds = store.all('docs').filter((d) => d.dir === 'giden' && ['gonderildi', 'yanit-bekliyor', 'kuyrukta'].includes(d.status)); for (const d of ds) await query(d); toast(`${ds.length} belgenin durumu güncellendi`, 'ok'); app.refresh(); };
    $('#eb-new', el).onclick = async () => {
      const v = await formModal({ title: 'Manuel e-Arşiv / e-Fatura', size: 'wide', fields: [{ name: 'buyer', label: 'Alıcı ünvan / ad soyad', required: true, full: true }, { name: 'buyerVkn', label: 'VKN / TCKN', value: '11111111111' }, { name: 'buyerEmail', label: 'E-posta', type: 'email' }, { name: 'address', label: 'Adres', full: true }, { name: 'desc', label: 'Mal / hizmet', required: true, full: true }, { name: 'qty', label: 'Miktar', type: 'number', value: 1 }, { name: 'price', label: 'Birim fiyat (KDV hariç ₺)', type: 'number', step: '0.01', required: true }, { name: 'vat', label: 'KDV %', type: 'select', options: ['20', '10', '1', '0'] }, { name: 'note', label: 'Not', full: true }] });
      if (!v) return; await create({ docType: 'auto', buyer: v.buyer, buyerVkn: v.buyerVkn, buyerEmail: v.buyerEmail, address: v.address, note: v.note, lines: [{ name: v.desc, qty: v.qty || 1, price: v.price, vat: Number(v.vat) }] }); app.refresh();
    };
    on(el, 'click', '[data-act]', async (e, b) => {
      store.load(); const d = store.get('docs', b.dataset.id); const a = b.dataset.act;
      if (a === 'v') return view(d.id);
      if (a === 'q') { await query(d); toast(`Durum: ${ST[d.status][0]}`, 'ok'); }
      else if (a === 'rs') await send(d);
      else if (a === 'cx') await cancel(d);
      else if (a === 'ok' || a === 'red') { const why = a === 'red' ? await NS.prompt('Red gerekçesi (gönderene iletilir)', '', { title: 'Faturayı reddet' }) : ''; if (why === null) return; d.status = a === 'ok' ? 'kabul' : 'red'; d.history.push({ at: new Date().toISOString(), st: d.status, note: why || 'Uygulama yanıtı gönderildi', user: NS.currentUser ? NS.currentUser.name : '' }); store.save(); I.log('efatura', d.party.name, `${d.no} ${a === 'ok' ? 'kabul' : 'red'}`, 'iletildi'); toast(a === 'ok' ? 'Kabul yanıtı gönderildi' : 'Red yanıtı gönderildi', 'ok'); }
      else if (a === 'imp' && imp) { const r = await imp.fn(d); if (r !== false) { d.imported = { app: appId(), at: new Date().toISOString(), ref: r || '' }; store.save(); toast('Belge alış kaydına aktarıldı', 'ok'); } }
      app.refresh();
    });
    draw();
  }
  // Uygulama içinden belge numarasına / kimliğe göre durum etiketi
  const byId = (id) => { store.load(); return store.get('docs', id) || store.find('docs', (d) => d.no === id); };
  const statusBadge = (id) => { const d = byId(id); return d ? badge(`${d.type} · ${ST[d.status][0]}`, ST[d.status][1] || 'info') : ''; };
  NS.ebelge = { create, send, isPayer, view, page, ubl, html, byId, statusBadge, onImport, store, ST };
  // Eski çağrılar da yeni merkezden geçer
  I.sendEInvoice = (doc) => create({ ...doc, docType: doc.docType || 'auto' });
})();
