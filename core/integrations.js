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
  const CORE_BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  let ublP = null;
  const ubl = () => window.NB_UBLTR ? Promise.resolve(window.NB_UBLTR) : (ublP = ublP || new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = CORE_BASE + 'ubltr.js'; sc.onload = () => (window.NB_UBLTR ? ok(window.NB_UBLTR) : no(new Error('UBL-TR modülü yüklenemedi'))); sc.onerror = () => { ublP = null; no(new Error('UBL-TR modülü yüklenemedi')); }; document.head.appendChild(sc); }));
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
    if (window.nebsoftDesktop && window.nebsoftDesktop.bridge) { const j = await window.nebsoftDesktop.bridge(pathname, body); bridgeOk = true; return j; } // masaüstü: bilgisayardaki yerel köprü
    if (!/^https?:/.test(location.protocol)) throw new Error('Köprü için uygulamayı "node server.js" ile açın (http://localhost:5050)');
    const r = await fetch('/api' + pathname, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, error: 'Köprü yanıtı okunamadı' }));
    bridgeOk = true;
    return j;
  }
  async function bridgeStatus() { try { const j = await bridge('/durum'); bridgeOk = !!j.ok; } catch (e) { bridgeOk = false; } return bridgeOk; }
  // Harici servise istek: önce köprüden, köprü yoksa doğrudan tarayıcıdan (CORS izin veriyorsa)
  // Bulutta kayıtlı kimlik bilgileri tarayıcıya gelmez; istekte yer tutucu (__nsg_…__) varsa istek, değeri yerine koyabilen
  // bulut sunucusuna gider (masaüstündeki yerel köprünün veritabanı yoktur)
  const viaCloud = async (p, body) => { const r = await fetch('/api' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json().catch(() => ({ ok: false, error: 'Sunucu yanıtı okunamadı' })); };
  const hasBasicToken = (req) => Object.values(req.headers || {}).some((v) => { const m = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(String(v)); try { return !!m && /__nsg_/.test(atob(m[1])); } catch (e) { return false; } }); // base64 içindeki yer tutucu
  async function httpCall(req) {
    if ((/__nsg_/.test(JSON.stringify(req)) || hasBasicToken(req)) && /^https?:/.test(location.protocol)) return viaCloud('/istek', req);
    try { const j = await bridge('/istek', req); if (j.ok === undefined && j.error) throw new Error(j.error); return j; } catch (e) {
      if (!/köprü|fetch|Failed|NetworkError|Köprü/i.test(e.message)) throw e;
      const r = await fetch(req.url, { method: req.method, headers: req.headers, body: req.method === 'GET' ? undefined : req.body });
      return { ok: r.ok, status: r.status, body: await r.text() };
    }
  }

  // ---------- Sunucu istemcileri (server/cloud/entegrasyon): anahtar tarayıcıya gelmez, istek sunucudan çıkar ----------
  // Bulutta durum sunucuda tutulur. Yerelde kimlik bilgisi bu cihazdadır, deneme sonucunun parmak izi kurulum kaydında durur
  const kurulum = new NS.DB('entegrasyon-kurulum', (db) => { db.data.state = {}; db.data.drafts = {}; });
  const entVar = (tur, prov) => { const g = window.NB_GUIDES && window.NB_GUIDES.get(tur, prov); return !!(g && g.test && g.test.type === 'sunucu'); };
  const ent = {
    async dene(tur, saglayici, alanlar) { const g = { tur, saglayici, alanlar }; const r = await (store.cloud ? viaCloud('/entegrasyon/dene', g) : bridge('/entegrasyon/dene', g)); return r.ok ? r : { ...r, ok: false, hata: r.hata || r.error || 'Bağlantı denenemedi' }; },
    async durum() { if (!store.cloud) return null; const r = await fetch('/api/entegrasyon/durum'); const j = await r.json().catch(() => ({})); return j.ok ? j.liste : null; },
    async islem(tur, islem, veri) {
      const c = cfg(tur); kurulum.load(); const r = await (store.cloud ? viaCloud('/entegrasyon/islem', { tur, islem, veri }) : bridge('/entegrasyon/islem', { tur, saglayici: tur === 'webhook' ? 'http' : c.provider || c.mode, islem, veri, alanlar: c, parmak: ((kurulum.data.state || {})[tur] || {}).parmak || '' }));
      return r.ok ? r : { ...r, ok: false, hata: r.hata || r.error || 'İşlem yapılamadı' };
    },
    // Fatura gibi tarayıcıda hazırlanan akışlar için: deneme geçti mi
    async hazir(tur, prov) { if (store.cloud) { const L = await ent.durum().catch(() => null); return !!(L && L.some((x) => x.tur === tur && x.saglayici === prov && x.durum === 'bagli')); } kurulum.load(); const s = (kurulum.data.state || {})[tur]; return !!(s && s.prov === prov && s.status === 'ok'); },
  };

  // ---------- Sağlayıcı tanımları ----------
  const F = (name, label, extra = {}) => ({ name, label, ...extra });
  const isToken = (v) => /^__nsg_/.test(String(v || '')); // sunucuda şifreli alanın yer tutucusu: düz metin kutusunda gösterilmez
  const SMS = {
    sim: { name: 'Simülasyon (gönderim yapılmaz)', fields: [], build: null },
    // Netgsm, İleti Merkezi, Verimor, Mutlucell, Twilio: istek server/cloud/entegrasyon içinde oluşur
    netgsm: { name: 'Netgsm', fields: [F('user', 'Abone numarası', { required: true }), F('pass', 'API alt kullanıcı şifresi', { type: 'password', required: true }), F('header', 'Mesaj başlığı', { required: true })],
      build: (c, to, text) => ({ url: 'https://api.netgsm.com.tr/sms/rest/v2/send', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(`${c.user}:${c.pass}`))) }, body: JSON.stringify({ msgheader: c.header, messages: [{ msg: text, no: to.replace(/^90(?=5\d{9}$)/, '') }], encoding: 'TR', iysfilter: c.iys === 'ticari-bireysel' ? '11' : c.iys === 'ticari-tacir' ? '12' : '0', appname: 'NEBSOFT' }) }),
      ok: (r) => { try { return JSON.parse(r.body).code === '00'; } catch (e) { return false; } } },
    iletimerkezi: { name: 'İleti Merkezi', fields: [F('key', 'API anahtarı', { required: true }), F('hash', 'API hash', { type: 'password', required: true }), F('header', 'Gönderici adı', { required: true })],
      // Resmî doküman (toplusmsapi.com/sms/gonder/json): numara 505xxxxxxx; iys 1 = İYS'den sorgula (ticari ileti), 0 = bilgilendirme
      build: (c, to, text) => ({ url: 'https://api.iletimerkezi.com/v1/send-sms/json', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request: { authentication: { key: c.key, hash: c.hash }, order: { sender: c.header, sendDateTime: [], iys: String(c.iys || '').startsWith('ticari') ? '1' : '0', iysList: c.iys === 'ticari-tacir' ? 'TACIR' : 'BIREYSEL', message: { text, receipents: { number: [to.replace(/^90(?=5\d{9}$)/, '')] } } } } }) }),
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
  const EFAT = { nilvera: 'Nilvera',
    sim: 'Simülasyon (test)', parasut: 'Paraşüt', uyumsoft: 'Uyumsoft', logo: 'Logo e-Dönüşüm', sovos: 'Sovos (Foriba)', mysoft: 'Mysoft', edm: 'EDM Bilişim', custom: 'Özel API',
  };
  // Doğrudan bağlantısı olan entegratörler. Diğerleri sözleşme gerektirir, iletişim talebiyle gösterilir.
  const EFAT_OK = ['sim', 'uyumsoft', 'parasut', 'nilvera', 'custom'];
  // Ödeme, e-posta, kargo sağlayıcı adları için liste aşağıda DEFS içinde
  const POSB = { manual: 'Manuel (çekimi cihazdan yapıp onaylayın)', bridge: 'Entegre terminal (köprü / üretici servisi)', demo: 'Demo terminal (test)' };

  // Her entegrasyonun ayar şeması ve varsayılanları
  const DEFS = {
    sms: { title: 'SMS', icon: 'message', desc: 'Randevu hatırlatma, servis durumu, veli bildirimi, kargo bilgilendirme', defaults: { provider: 'sim', enabled: true, maxLen: 612, iysNote: true },
      fields: (c) => [{ name: 'enabled', label: 'SMS gönderimi açık', type: 'checkbox', full: true }, { name: 'provider', label: 'Sağlayıcı', type: 'select', options: Object.entries(SMS).map(([value, p]) => ({ value, label: p.name })), full: true }, ...(SMS[c.provider] || SMS.sim).fields, { name: 'maxLen', label: 'En fazla karakter', type: 'number' }, ...(['netgsm', 'iletimerkezi'].includes(c.provider) ? [{ name: 'iys', label: 'Mesaj türü (İYS)', type: 'select', full: true, hint: 'Kampanya / tanıtım içeren mesajlar yasal olarak ticari ileti sayılır ve İYS’den kontrol edilmelidir. Fatura, hatırlatma gibi mesajlar bilgilendirmedir.', options: [{ value: 'bilgi', label: 'Bilgilendirme (İYS kontrolü yok)' }, { value: 'ticari-bireysel', label: 'Ticari ileti — bireysel alıcılar (İYS kontrollü)' }, { value: 'ticari-tacir', label: 'Ticari ileti — tacir alıcılar (İYS kontrollü)' }] }] : []), { name: 'iysNote', label: 'Ticari mesajlarda İYS onayı kontrol edilsin', type: 'checkbox' }] },
    whatsapp: { title: 'WhatsApp', icon: 'message', desc: 'Hatırlatma ve bilgilendirme mesajları', defaults: { mode: 'link' },
      fields: (c) => [{ name: 'mode', label: 'Gönderim yöntemi', type: 'select', options: [{ value: 'link', label: 'WhatsApp bağlantısı (wa.me — personel gönderir)' }, { value: 'cloud', label: 'WhatsApp Business Cloud API (otomatik)' }, { value: 'custom', label: 'Özel API (çözüm ortağı)' }], full: true },
        ...(c.mode === 'cloud' ? [F('phoneId', 'Phone number ID', { required: true }), F('token', 'Erişim jetonu (token)', { type: 'password', required: true }), F('version', 'Graph API sürümü', { value: 'v26.0' }), F('template', 'Onaylı şablon adı (boşsa serbest metin)'), F('lang', 'Şablon dil kodu', { value: 'tr', hint: 'Şablonu Meta’da hangi dilde onaylattıysanız o kod' })] : []),
        ...(c.mode === 'custom' ? [F('url', 'API adresi', { full: true, required: true }), F('headers', 'Başlıklar (JSON)', { full: true }), F('body', 'Gövde şablonu ({to} {text})', { type: 'textarea', full: true })] : [])] },
    email: { title: 'E-posta', icon: 'mail', desc: 'Fatura, sipariş ve rapor gönderimi', defaults: { mode: 'mailto', from: '' },
      fields: (c) => [{ name: 'mode', label: 'Yöntem', type: 'select', options: [{ value: 'mailto', label: 'E-posta istemcisini aç (mailto)' }, { value: 'sendgrid', label: 'SendGrid' }, { value: 'mailgun', label: 'Mailgun' }, { value: 'brevo', label: 'Brevo' }, { value: 'resend', label: 'Resend' }, { value: 'postmark', label: 'Postmark' }, { value: 'emailjs', label: 'EmailJS (tarayıcıdan doğrudan)' }, { value: 'http', label: 'Kendi e-posta API’niz (SMTP köprüsü)' }], full: true },
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
      fields: (c) => [{ name: 'provider', label: 'Entegratör', type: 'select', options: Object.entries(EFAT).map(([value, label]) => ({ value, label })), full: true }, ...(c.provider === 'nilvera' ? [F('pass', 'API anahtarı (Nilvera Portal > API Tanımları; test ve canlı anahtarları ayrıdır)', { type: 'password', required: true, full: true }), F('vkn', 'Firma VKN')] : c.provider !== 'sim' ? [F('user', 'Kullanıcı adı / client id', { required: true, ...(c.provider === 'custom' || isToken(c.user) ? { type: 'password' } : {}) }), F('pass', 'Şifre / secret', { type: 'password', required: true }), F('vkn', 'Firma VKN'), F('url', 'API adresi (özel / test ortamı)', { full: true })] : []), F('efPrefix', 'e-Fatura seri'), F('eaPrefix', 'e-Arşiv seri'), F('test', 'Test ortamı', { type: 'checkbox' })] },
    payment: { title: 'Online ödeme', icon: 'wallet', desc: 'Vitrinde, veli, üye ve sakin portalında kartla ödeme', defaults: { provider: 'none', sandbox: true },
      fields: (c) => [{ name: 'provider', label: 'Sanal POS', type: 'select', options: [{ value: 'none', label: 'Kapalı (demo ödeme)' }, { value: 'iyzico', label: 'iyzico' }, { value: 'paytr', label: 'PayTR' }, { value: 'param', label: 'Param' }, { value: 'papara', label: 'Papara' }, { value: 'moka', label: 'Moka United' }, { value: 'sipay', label: 'Sipay' }, { value: 'paynet', label: 'Paynet' }, { value: 'craftgate', label: 'Craftgate' }, { value: 'stripe', label: 'Stripe (yurt dışı şirketi)' }], full: true }, ...(c.provider === 'iyzico' ? [F('apiKey', 'API key', { required: true }), F('secret', 'Secret key', { type: 'password', required: true })] : []), ...(c.provider === 'paytr' ? [F('merchantId', 'Mağaza no', { required: true }), F('merchantKey', 'Mağaza parola', { type: 'password', required: true }), F('merchantSalt', 'Mağaza gizli anahtar', { type: 'password', required: true })] : []), ...(['param', 'stripe'].includes(c.provider) ? [F('apiKey', 'API anahtarı', { required: true }), F('secret', 'Gizli anahtar', { type: 'password', required: true })] : []), F('sandbox', 'Test (sandbox) modu', { type: 'checkbox', hint: 'Test modunda kart çekilmez, siparişler TEST görünür. Canlı ödeme sunucu kilidi açılınca çalışır.' })] },
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
    kargofirma: ['Kargo firmaları', 'truck', 'Gönderi oluşturma, barkod, takip ve teslim bildirimi', 'Lojistik', { yurtici: 'Yurtiçi Kargo', aras: 'Aras Kargo', mng: 'MNG / DHL eCommerce', surat: 'Sürat Kargo', ptt: 'PTT Kargo', hepsijet: 'HepsiJet', kolaygelsin: 'Kolay Gelsin', ups: 'UPS', dhl: 'DHL Express', geliver: 'Geliver' }, ['customerNo:Müşteri / sözleşme no']],
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
    kantar: ['Kantar (araç terazisi)', 'layers', 'Mal kabul ve sevkte dolu/boş araç tartımı', 'Donanım', { serial: 'Seri port (Web Serial)', tcp: 'Ağ indikatörü (TCP)', manuel: 'Elle giriş' }, ['host:İndikatör IP', 'port:İndikatör portu', 'baud:Baud hızı', 'dataBits:Veri biti (7 / 8)', 'parity:Parite (none / even / odd)', 'request:Okuma komutu (boşsa sürekli akış)']],
    plc: ['Makine veri toplama (PLC / OPC-UA)', 'cog', 'Makine sayacı, duruş ve hız verisinin otomatik alınması', 'Donanım', { opcua: 'OPC-UA ağ geçidi', modbus: 'Modbus TCP', mqtt: 'MQTT', manuel: 'Operatör girişi' }, ['endpoint:Ağ geçidi adresi', 'interval:Okuma aralığı (sn)']],
  };
  const SECTOR = {
    pos: ['okc', 'pazaryeri', 'muhasebeaktar'], adisyon: ['okc', 'yemekplatform', 'yemekkarti', 'callerid', 'muhasebeaktar'], eczane: ['medula', 'its', 'uts', 'eczadeposu', 'okc'],
    randevu: ['takvim', 'googleisletme', 'esmm'], servis: ['callerid', 'takvim', 'muhasebeaktar'], klinik: ['enabiz', 'erecete', 'kps', 'esmm', 'takvim'], veteriner: ['vetbis', 'petkayit', 'esmm', 'takvim'],
    otel: ['kbs', 'kanal', 'kapikilit', 'santral', 'muhasebeaktar'], kiralama: ['aracbildirim', 'hgs', 'gps', 'kps'], spor: ['turnike', 'kps', 'takvim'], kurs: ['meb', 'onlineders', 'esmm'],
    ik: ['sgk', 'pdks', 'ebordro', 'bankamaas'], crm: ['takvim', 'callerid'], emlak: ['ilan', 'kps'], site: ['banka', 'muhasebeaktar'], eticaret: ['pazaryeri', 'kargofirma', 'eirsaliye'],
    kargo: ['kargofirma', 'gps', 'eirsaliye'], bilet: ['turnike', 'kps'], oto: ['anpr', 'okc', 'muhasebeaktar'], muhasebe: [],
    fabrika: ['eirsaliye', 'emustahsil', 'kantar', 'plc', 'muhasebeaktar', 'banka'],
  };
  // API dokümanı herkese açık olmayan, sözleşme veya kurum yetkisi gerektiren bağlayıcılar: gerçek çağrı yapılmaz, ekranda iletişim talebi gösterilir.
  // Liste: docs/ENTEGRASYON-ENVANTERI.md. '*' = tüm sağlayıcılar (özel API dahil).
  // okc (yazarkasa POS / GMP3): protokol GİB'de açık (GMP-3 s.5.0) ama §3.3 gereği yazılım ÖKC üreticisinin derlenmiş GMP-3 kütüphanesiyle konuşur ve eşleştirmeyi yetkili servis yapar; üretici anlaşması + kütüphane + test cihazı gerekir.
  const UNVERIFIED = { eczadeposu: '*', okc: '*', sgk: '*', bankamaas: '*', ebordro: '*', pdks: '*', medula: '*', its: '*', uts: '*', aracbildirim: '*', hgs: '*', ilan: '*', parca: '*', tramer: '*', kbs: '*', kanal: ['siteminder', 'booking', 'expedia', 'airbnb'], enabiz: '*', erecete: '*', kps: '*', vetbis: '*', petkayit: '*', meb: '*', googleisletme: '*' };
  const unverified = (k, prov) => prov !== 'sim' && !!UNVERIFIED[k] && (UNVERIFIED[k] === '*' || UNVERIFIED[k].includes(prov));
  Object.entries(CONN).forEach(([k, [title, ic, desc, cat, provs, extra]]) => {
    DEFS[k] = { title, icon: ic, desc, cat, conn: true, provs, defaults: { enabled: false, provider: 'sim', test: true },
      fields: (c) => [{ name: 'enabled', label: 'Bağlantı açık', type: 'checkbox', full: true }, { name: 'provider', label: 'Sağlayıcı', type: 'select', full: true, options: [{ value: 'sim', label: 'Simülasyon (gönderim yapılmaz)' }, ...[...Object.entries(provs), ['custom', 'Özel API / çözüm ortağı']].filter(([value]) => value !== 'custom' || !unverified(k, value) || value === c.provider).map(([value, label]) => ({ value, label }))], hint: UNVERIFIED[k] ? 'Bu bağlantı sözleşme gerektirir. Entegrasyon Merkezi’nden iletişim talebi bırakabilirsiniz.' : undefined },
        ...(c.provider !== 'sim' ? [F('url', 'Servis adresi (API / ara servis)', { full: true, required: c.provider === 'custom', placeholder: 'https://...', hint: 'İstekler {action, payload} JSON olarak köprü üzerinden gönderilir' }), F('user', 'Kullanıcı adı / API key', c.provider === 'mqtt' && !isToken(c.user) ? {} : { type: 'password' }), F('pass', 'Şifre / secret', { type: 'password' })] : []),
        ...extra.map((x) => { const [name, label, type] = x.split(':'); return F(name, label, type ? { type } : {}); }), F('test', 'Test ortamı', { type: 'checkbox' })] };
  });
  // Bağlayıcı çağrısı: action ör. 'bildir', 'sorgu', 'gonder', 'iptal'
  async function call(kind, action, payload = {}, { silent } = {}) {
    const d = DEFS[kind]; const c = cfg(kind); if (!d) return { ok: false, error: 'Tanımsız bağlayıcı' };
    const label = `${d.title} · ${action}`;
    if (!c.enabled) { log(kind, payload.to || '', label, 'kapalı', 'Entegrasyonlar sayfasından açın'); if (!silent) toast(`${d.title} bağlantısı kapalı — Entegrasyonlar sayfasından açın`, 'err'); return { ok: false, disabled: true }; }
    if (kind === 'kantar' && action === 'oku' && ['serial', 'tcp'].includes(c.provider)) {
      try { const kg = await readKantar({ ask: !!payload.ask }); log(kind, '', label, 'okundu', kg + ' kg'); return { ok: true, data: { kg } }; } catch (e) { log(kind, '', label, 'hata', e.message); if (!silent) toast('Kantar: ' + e.message, 'err'); return { ok: false, error: e.message }; }
    }
    if (unverified(kind, c.provider)) { const msg = `${d.title}: bu sağlayıcı için bağlantı kurulmadı, gönderim yapılmadı`; log(kind, payload.to || payload.no || '', label, 'hata', msg); if (!silent) toast(msg, 'err'); return { ok: false, unverified: true, error: msg }; }
    // Sunucu istemcisi olan sağlayıcı: anahtar sunucuda çözülür, sonuç sağlayıcının yanıtıdır. Denenmemiş bağlantı işlem yapmaz
    if (entVar(kind, c.provider)) {
      const r = await ent.islem(kind, action, payload).catch((e) => ({ ok: false, hata: e.message }));
      if (r.ok) { const s = r.sonuc || {}; log(kind, payload.to || payload.no || '', label, s.test ? 'test' : 'gönderildi', s.ref || s.tracking || ''); if (!silent) toast(`${d.title}: ${action} ${s.test ? 'TEST' : 'tamam'}`, s.test ? 'warn' : 'ok'); return { ok: true, ref: s.ref || s.tracking, data: s, test: !!s.test }; }
      // Takip sayfası ve iCal aboneliği bağlantı gerektirmez, denenmemiş hesapta eski yol sürer
      if (!(r.kod === 'baglanmadi' && ((kind === 'kargofirma' && action === 'durum-sorgu') || kind === 'takvim'))) { log(kind, payload.to || payload.no || '', label, 'hata', r.hata); if (!silent) toast(`${d.title}: ${r.hata}`, 'err'); return { ok: false, error: r.hata, kod: r.kod }; }
    }
    const direct = await directCall(kind, action, payload, c, silent, label); if (direct) return direct;
    const ref = (kind.slice(0, 3).toUpperCase()) + Date.now().toString().slice(-9);
    // Simülasyon: hiçbir yere gönderilmez; referans "TEST-" ile başlar (kayda yazılırsa da gerçek numara sanılmaz)
    if (c.provider === 'sim') { const tref = 'TEST-' + ref; log(kind, payload.to || payload.no || '', label, 'simülasyon', JSON.stringify(payload).slice(0, 200)); if (!silent) toast(`${d.title}: ${action} TEST — gönderilmedi (simülasyon; Entegrasyonlar’dan gerçek bağlantı kurun)`, 'warn'); return { ok: true, simulated: true, ref: tref }; }
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

  // ---------- Makine verisi (PLC): Modbus TCP ve MQTT, yerel köprü üzerinden ----------
  // Okuma noktaları satır satır: Modbus "İSTASYON KODU; tablo; adres; 32"  ·  MQTT "İSTASYON KODU; konu; json-alanı"
  const plcPoints = (c) => String(c.points || '').split(/\r?\n/).map((l) => l.split(';').map((x) => x.trim())).filter((p) => p[0] && p[1]);
  const numOf = (x) => { const n = Number(String(x).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  async function readPlc(over) {
    const c = { ...cfg('plc'), ...(over || {}) }; const pts = plcPoints(c); const at = new Date().toISOString();
    if (!pts.length) throw new Error('Okuma noktası tanımlı değil');
    if (c.provider === 'modbus') {
      const out = [];
      for (const [code, table, addr, bits] of pts) {
        const wide = bits === '32'; const j = await bridge('/modbus', { host: c.host, port: Number(c.port) || 502, unit: Number(c.unit) || 1, table: (table || 'holding').toLowerCase(), address: Number(addr) || 0, count: wide ? 2 : 1 });
        if (!j.ok) throw new Error(`${code}: ${j.error || 'okunamadı'}`);
        out.push({ code, value: wide ? j.values[0] * 65536 + j.values[1] : j.values[0], at });
      }
      return out;
    }
    if (c.provider === 'mqtt') {
      const j = await bridge('/mqtt', { host: c.host, port: Number(c.port) || (c.tls ? 8883 : 1883), tls: !!c.tls, user: c.user || '', pass: c.pass || '', action: 'read', topics: [...new Set(pts.map((p) => p[1]))], wait: Number(c.wait) || 4 });
      if (!j.ok) throw new Error(j.error || 'MQTT aracısına bağlanılamadı');
      return pts.map(([code, topic, key]) => {
        const m = (j.messages || []).find((x) => x.topic === topic) || (j.messages || []).find((x) => topicOk(topic, x.topic));
        if (!m) return { code, value: null, missing: true, at };
        let v = m.payload; if (key) { try { v = String(key).split('.').reduce((o, k) => (o == null ? o : o[k]), JSON.parse(m.payload)); } catch (e) { v = null; } }
        return { code, value: numOf(v), raw: String(m.payload).slice(0, 120), at };
      });
    }
    throw new Error('Makine verisi için Modbus TCP veya MQTT seçin');
  }
  const topicOk = (f, t) => { const a = f.split('/'), b = t.split('/'); for (let i = 0; i < a.length; i++) { if (a[i] === '#') return true; if (a[i] !== '+' && a[i] !== b[i]) return false; } return a.length === b.length; };

  // ---------- Kargo takip: firmaların herkese açık takip sayfaları (27.10.2026'da tek tek denendi) ----------
  // url: takip numarasıyla doğrudan açılan adres · page: numarayı adresle almayan firmalarda numara panoya kopyalanıp açılan sayfa
  const TRACK = {
    yurtici: { name: 'Yurtiçi Kargo', url: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={no}' },
    aras: { name: 'Aras Kargo', url: 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code={no}' },
    surat: { name: 'Sürat Kargo', url: 'https://suratkargo.com.tr/KargoTakip/?kargotakipno={no}' },
    hepsijet: { name: 'HepsiJet', url: 'https://www.hepsijet.com/gonderi-takibi/{no}' },
    ups: { name: 'UPS', url: 'https://www.ups.com/track?loc=tr_TR&tracknum={no}' },
    mng: { name: 'MNG / DHL eCommerce', page: 'https://www.dhlecommerce.com.tr/gonderitakip' },
    ptt: { name: 'PTT Kargo', page: 'https://www.ptt.gov.tr/' },
    kolaygelsin: { name: 'Kolay Gelsin', page: 'https://www.kolaygelsin.com/tracking' },
  };
  const trackOf = (carrier) => { const k = String(carrier || '').trim().toLocaleLowerCase('tr'); if (!k) return null; return TRACK[k] ? { id: k, ...TRACK[k] } : Object.entries(TRACK).map(([id, t]) => ({ id, ...t })).find((t) => t.name.toLocaleLowerCase('tr') === k || t.name.toLocaleLowerCase('tr').startsWith(k.split(' ')[0])) || null; };
  const trackUrl = (carrier, no) => { const t = trackOf(carrier); if (!t || !no) return null; return t.url ? t.url.replace('{no}', encodeURIComponent(String(no).trim())) : t.page; };
  async function trackShipment(carrier, no) {
    const t = trackOf(carrier); if (!t) return { ok: false, error: 'Bu kargo firmasının takip sayfası tanımlı değil' };
    if (!no) return { ok: false, error: 'Takip numarası yok' };
    if (!t.url) { try { await navigator.clipboard.writeText(String(no)); } catch (e) { /* pano izni yok */ } toast(`${t.name} takip numarayı adresle almıyor: numara panoya kopyalandı, sayfada yapıştırın`, 'ok'); }
    origOpen(trackUrl(carrier, no), '_blank', 'noopener'); return { ok: true, opened: true, url: trackUrl(carrier, no) };
  }

  // ---------- Online ders: sabit toplantı bağlantısı veya Zoom API (Server-to-Server OAuth) ----------
  const MEET = { zoom: /^https:\/\/([a-z0-9-]+\.)?zoom\.us\/(j|my|w)\/[A-Za-z0-9.?=&_-]+/i, meet: /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i, teams: /^https:\/\/teams\.(microsoft|live)\.com\/(l\/meetup-join|meet)\/\S+/i };
  const meetingLinkOk = (prov, link) => !!(MEET[prov] && MEET[prov].test(String(link || '').trim()));
  async function zoomToken(c) {
    const r = await httpCall({ url: 'https://zoom.us/oauth/token?grant_type=account_credentials&account_id=' + encodeURIComponent(String(c.accountId).trim()), method: 'POST', headers: { Authorization: 'Basic ' + btoa(String(c.clientId).trim() + ':' + String(c.clientSecret).trim()) }, body: '' });
    let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } if (!j.access_token) throw new Error(`Zoom kimlik doğrulaması başarısız: ${r.status || ''} ${j.reason || j.error || r.error || ''}`); return j.access_token;
  }
  async function createMeeting(c, { title, start, minutes }) {
    if (c.provider === 'zoom' && c.accountId && c.clientId && c.clientSecret && c.hostEmail) {
      const r = await ent.islem('onlineders', 'toplanti-olustur', { title, start, minutes }); if (!r.ok) throw new Error(r.hata); return r.sonuc;
    }
    if (c.provider === 'zoom' && c.accountId && c.clientId && c.clientSecret) {
      const tk = await zoomToken(c);
      const r = await httpCall({ url: 'https://api.zoom.us/v2/users/me/meetings', method: 'POST', headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: String(title || 'Ders').slice(0, 200), type: 2, start_time: String(start || '').length === 16 ? start + ':00' : start, timezone: 'Europe/Istanbul', duration: Number(minutes) || 40, settings: { waiting_room: true, join_before_host: false } }) });
      let j = {}; try { j = JSON.parse(r.body); } catch (e) { /* yok */ } if (!j.join_url) throw new Error(`Zoom toplantısı oluşturulamadı: ${r.status || ''} ${j.message || r.error || ''}`);
      return { url: j.join_url, id: j.id, created: true };
    }
    if (!meetingLinkOk(c.provider, c.link)) throw new Error('Toplantı bağlantısı tanımlı değil veya biçimi geçersiz');
    return { url: String(c.link).trim(), created: false };
  }

  async function directCall(kind, action, payload, c, silent, label) {
    const fail = (msg) => { log(kind, '', label, 'hata', msg); if (!silent) toast(msg, 'err'); return { ok: false, error: msg }; };
    if (kind === 'esmm' && c.provider === 'parasut') {
      try { const r = await sendEsmmParasut(payload, c); log(kind, payload.name || '', label, 'gönderildi', r.ref); if (!silent) toast('e-SMM Paraşüt’te oluşturuldu', 'ok'); return r; } catch (e) { return fail('e-SMM: ' + e.message); }
    }
    if (kind === 'plc' && ['modbus', 'mqtt'].includes(c.provider)) {
      try { const pts = await readPlc(); const want = new Set(payload.stations || []); const stations = pts.filter((p) => !want.size || want.has(p.code)); log(kind, '', label, 'okundu', stations.map((p) => `${p.code}=${p.value}`).join(' ')); return { ok: true, data: { stations } }; } catch (e) { return fail('Makine verisi: ' + e.message); }
    }
    if (kind === 'kargofirma' && TRACK[c.provider]) {
      if (action === 'durum-sorgu') { const r = await trackShipment(payload.carrier || c.provider, payload.tracking); log(kind, payload.tracking || '', label, r.ok ? 'açıldı' : 'hata', r.url || r.error); return r; }
      return { ok: false, unsupported: true, error: `${(trackOf(payload.carrier || c.provider) || TRACK[c.provider]).name} için gönderi oluşturma servisi bağlı değil; gönderiyi firmanın panelinde açıp takip numarasını girin` };
    }
    if (kind === 'onlineders' && ['zoom', 'meet', 'teams'].includes(c.provider)) {
      try { const m = await createMeeting(c, payload); log(kind, '', label, m.created ? 'oluşturuldu' : 'bağlantı', m.url); return { ok: true, data: m }; } catch (e) { return fail('Online ders: ' + e.message); }
    }
    // Takvim: randevular imzalı iCal adresinden yayınlanır; Google / Outlook bu adrese abonedir, ayrıca gönderilecek bir şey yoktur
    if (kind === 'takvim' && ['ical', 'google', 'outlook'].includes(c.provider)) return { ok: true, feed: true };
    return null;
  }
  const ALL = Object.keys(DEFS).filter((k) => !DEFS[k].conn);

  // ---------- SMS / WhatsApp / e-posta ----------
  async function sms(to, text, { silent } = {}) {
    const c = cfg('sms'); const p = SMS[c.provider] || SMS.sim; const num = normPhone(to);
    text = String(text).slice(0, c.maxLen || 612);
    if (!c.enabled) { log('sms', num, text, 'kapalı', 'SMS kapalı'); return { ok: false, error: 'SMS gönderimi kapalı' }; }
    if (entVar('sms', c.provider)) {
      const r = await ent.islem('sms', 'gonder', { to: num, text, iys: c.iys }).catch((e) => ({ ok: false, hata: e.message }));
      log('sms', num, text, r.ok ? 'gönderildi' : 'hata', r.ok ? (r.sonuc || {}).ref : r.hata);
      if (!silent) toast(r.ok ? `SMS gönderildi: ${to}` : `SMS gönderilemedi: ${String(r.hata).slice(0, 120)}`, r.ok ? 'ok' : 'err');
      return { ok: !!r.ok, response: r, error: r.hata };
    }
    if (!p.build) { log('sms', num, text, 'simülasyon', 'Gerçek gönderim yapılmadı'); if (!silent) toast(`SMS TEST — gönderilmedi (simülasyon): ${to}`, 'warn'); return { ok: true, simulated: true }; }
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
    if (entVar('whatsapp', c.mode)) {
      const r = await ent.islem('whatsapp', 'gonder', { to: num, text }).catch((e) => ({ ok: false, hata: e.message }));
      log('whatsapp', num, text, r.ok ? 'gönderildi' : 'hata', r.ok ? (r.sonuc || {}).ref : r.hata); toast(r.ok ? 'WhatsApp mesajı gönderildi' : `WhatsApp gönderilemedi: ${String(r.hata).slice(0, 120)}`, r.ok ? 'ok' : 'err'); return { ok: !!r.ok, error: r.hata };
    }
    try {
      const req = c.mode === 'cloud'
        ? { url: `https://graph.facebook.com/${c.version || 'v23.0'}/${c.phoneId}/messages`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.token }, body: JSON.stringify(c.template ? { messaging_product: 'whatsapp', to: num, type: 'template', template: { name: c.template, language: { code: c.lang || 'tr' }, components: [{ type: 'body', parameters: [{ type: 'text', text }] }] } } : { messaging_product: 'whatsapp', to: num, type: 'text', text: { body: text } }) }
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
    if (entVar('email', c.mode)) {
      const r = await ent.islem('email', 'gonder', { to, subject, text }).catch((e) => ({ ok: false, hata: e.message }));
      log('email', to, subject, r.ok ? 'gönderildi' : 'hata', r.ok ? (r.sonuc || {}).ref : r.hata); toast(r.ok ? 'E-posta gönderildi' : `E-posta gönderilemedi: ${String(r.hata).slice(0, 120)}`, r.ok ? 'ok' : 'err'); return { ok: !!r.ok, error: r.hata };
    }
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
    if (!port.writable) { const sc = cfg(kind); await port.open({ baudRate: Number(baud) || 9600, dataBits: Number(sc.dataBits) === 7 ? 7 : 8, parity: ['even', 'odd'].includes(sc.parity) ? sc.parity : 'none', stopBits: Number(sc.stopBits) === 2 ? 2 : 1 }); }
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
  function parseScaleBarcode(code, over) {
    const c = over ? { ...cfg('scale'), ...over } : cfg('scale'); if (c.mode === 'serial') return null;
    code = String(code).trim();
    const pre = String(c.prefix || '27,28').split(',').map((x) => x.trim()).find((p) => p && code.startsWith(p));
    if (!pre || code.length < pre.length + Number(c.pluLen) + Number(c.valLen)) return null;
    const plu = code.substr(pre.length, Number(c.pluLen)); const val = Number(code.substr(pre.length + Number(c.pluLen), Number(c.valLen)));
    return c.valType === 'price' ? { plu, price: val / 100 } : { plu, kg: val / 1000 };
  }
  // Seri porttan / ağdan gelen metinden ağırlığı bulur. intKg: tam sayıyı kilogram say (araç kantarları); değilse 4-6 haneli tam sayı gram kabul edilir
  function parseWeight(text, { protocol, intKg } = {}) {
    for (const l of String(text).split(/[\r\n\x03]+/).reverse()) {
      if (protocol === 'cas' && !/ST|S\s/.test(l)) continue;
      const m = l.match(/([-+]?\s*\d+[.,]\d+|\d{3,7})\s*(kg|g|t)?/i);
      if (!m) continue; let v = Number(m[1].replace(/\s/g, '').replace(',', '.'));
      if (/^\d+$/.test(m[1]) && !intKg && /^\d{4,6}$/.test(m[1])) v = v / 1000;
      if (/^g$/i.test(m[2] || '')) v /= 1000; if (/^t$/i.test(m[2] || '')) v *= 1000;
      if (v > 0) return Math.round(v * 1000) / 1000;
    }
    return null;
  }
  // Araç kantarı: seri port (Web Serial) veya ağ indikatörü (yerel köprü /api/tcp-oku)
  async function readKantar({ ask } = {}) {
    const c = cfg('kantar');
    if (c.provider === 'tcp') {
      if (!c.host) throw new Error('İndikatör IP adresi girilmemiş');
      const j = await bridge('/tcp-oku', { host: c.host, port: Number(c.port) || 0, request: c.request || '' });
      if (!j.ok) throw new Error(j.error || 'İndikatöre bağlanılamadı');
      const kg = parseWeight(j.text, { intKg: true }); if (!kg) throw new Error('İndikatörden geçerli ağırlık okunamadı (gelen veri: ' + String(j.text).slice(0, 60) + ')');
      return kg;
    }
    if (c.provider !== 'serial') throw new Error('Kantar elle giriş modunda');
    const port = await serialPort('kantar', c.baud, ask);
    if (c.request) { const w = port.writable.getWriter(); await w.write(new TextEncoder().encode(c.request === 'ENQ' ? '\x05' : c.request + '\r\n')); w.releaseLock(); }
    const reader = port.readable.getReader(); let buf = ''; const deadline = Date.now() + 3000;
    try {
      while (Date.now() < deadline) {
        const r = await Promise.race([reader.read(), new Promise((res) => setTimeout(() => res({ timeout: true }), 800))]);
        if (r.timeout) continue; if (r.done) break;
        buf += new TextDecoder().decode(r.value); const kg = parseWeight(buf, { intKg: true }); if (kg) return kg;
      }
      throw new Error('Kantardan geçerli ağırlık okunamadı (tartım sabit mi, port ayarları doğru mu?)');
    } finally { reader.releaseLock(); }
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
      let done = false; const finish = (r, close) => { if (done) return; done = true; close && close(); log('pos', c.brand, money(amount), r.test ? 'TEST — çekim yapılmadı' : r.ok ? 'onaylandı' : 'iptal/red', r.ref || r.error || ''); resolve(r); };
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
          if (j.ok) { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--ok);font-weight:700">${icon('check')} ${j.test ? 'TEST — gerçek çekim yapılmadı' : `Onaylandı · ${esc(j.card || '')} · Onay ${esc(j.authCode || '')}`}</div>`); setTimeout(() => finish({ ok: true, ref: j.ref, authCode: j.authCode, installment, test: !!j.test }, close), 700); }
          else { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--err);font-weight:700">${icon('x')} ${esc(j.error || 'Reddedildi')}</div>`); setTimeout(() => finish({ ok: false, error: j.error }, close), 1800); }
        } catch (e) { $('#pst') && ($('#pst').innerHTML = `<div style="color:var(--err)">${esc(e.message)}</div>`); setTimeout(() => finish({ ok: false, error: e.message }, close), 2000); }
      })();
    });
  }

  // ---------- e-Fatura ----------
  // ---------- Uyumsoft (özel entegratör) — resmî WSDL: efatura.uyumsoft.com.tr/Services/Integration ----------
  async function uyCall(c, op, inner) {
    const U = await ubl();
    const r = await httpCall({ url: U.UY.url(!!c.test), method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `"${U.UY.action(op)}"` }, body: U.UY.envelope(c.user, c.pass, inner) });
    if (r.error && !r.body) return { ok: false, error: r.error };
    return U.UY.parse(r.body);
  }
  // Nilvera REST API v1 (developer.nilvera.com, okundu 30.10.2026 — dokümana uygun; canlı/test hesabıyla DENENMEDİ):
  // api.nilvera.com (test: apitest.nilvera.com), Authorization: Bearer <API anahtarı>; UBL-TR XML'in zip'i base64 olarak /einvoice|earchive/Send/Base64String
  async function nvCall(c, path, opt = {}) {
    const r = await httpCall({ url: (c.test ? 'https://apitest.nilvera.com' : 'https://api.nilvera.com') + path, method: opt.method || 'GET', headers: { Authorization: 'Bearer ' + (c.pass || ''), Accept: 'application/json', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined });
    let j = null; try { j = JSON.parse(r.body || 'null'); } catch (e) { j = null; }
    return { ok: !!r.ok, status: r.status, j, error: r.ok ? '' : `Nilvera HTTP ${r.status || ''} ${(j && (j.Message || j.message || (j.Errors && JSON.stringify(j.Errors)))) || String(r.error || r.body || '').slice(0, 160)}`.trim() };
  }
  // Mükellef mi + gönderici etiketi: Check/TaxNumber ve GetGlobalCustomerInfo (Aliases: silinmemiş, tercihen pk)
  async function nvPayer(c, vkn) {
    const q = await nvCall(c, `/general/GlobalCompany/Check/TaxNumber/${vkn}?globalUserType=Invoice`); if (!q.ok) return { ok: false, error: q.error };
    if (!(Array.isArray(q.j) && q.j.length)) return { ok: true, payer: false, alias: '' };
    const inf = await nvCall(c, `/general/GlobalCompany/GetGlobalCustomerInfo/${vkn}?globalUserType=Invoice`); if (!inf.ok) return { ok: false, error: inf.error };
    const al = ((inf.j && inf.j.Aliases) || []).filter((a) => !a.DeletionTime).map((a) => a.Name); return { ok: true, payer: true, alias: al.find((a) => /pk/i.test(a)) || al[0] || '' };
  }
  const b64zip = async (name, xml) => { const u = new Uint8Array(await NS.zip([{ name, data: xml }]).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
  async function sendUyumsoft(doc, c) {
    const nv = c.provider === 'nilvera'; const NM = nv ? 'Nilvera' : 'Uyumsoft';
    const fail = (msg) => { log('efatura', doc.buyer || '', NM, 'hata', msg); toast('e-Fatura gönderilemedi: ' + msg, 'err'); return { ok: false, error: msg }; };
    try {
      const U = await ubl(); if (doc.docType === 'e-İrsaliye') return fail(`e-İrsaliye ${NM} için bu sürümde yok; yalnızca e-Fatura / e-Arşiv gönderilir`);
      const buyerId = String(doc.buyerVkn || '').replace(/\D/g, '');
      if (!buyerId) return fail('Alıcının VKN (10 hane) veya TCKN (11 hane) bilgisi gerekli');
      // Alıcı e-Fatura mükellefi mi? (GİB kayıtlı kullanıcı listesi, Uyumsoft üzerinden)
      let scenario = 'eArchive', alias = '';
      if (buyerId !== '11111111111') {
        if (nv) { const q = await nvPayer(c, buyerId); if (!q.ok) return fail(q.error); if (q.payer) { scenario = 'eInvoice'; alias = q.alias; if (!alias) return fail('Alıcının e-Fatura etiketi (alias) bulunamadı'); } }
        const q = nv ? {} : await uyCall(c, 'IsEInvoiceUser', U.UY.isEInvoiceUser(buyerId)); if (q.fault || (!q.ok && q.error)) return fail(q.error);
        if (q.flag === 'true') { scenario = 'eInvoice'; const al = await uyCall(c, 'GetUserAliasses', U.UY.getUserAliasses(buyerId)); alias = ((al.aliases || []).find((a) => a.enabled) || {}).alias || ''; if (!alias) return fail('Alıcı e-Fatura mükellefi ama etkin posta kutusu etiketi bulunamadı'); }
      }
      const ef = scenario === 'eInvoice'; const prefix = String((ef ? c.efPrefix : c.eaPrefix) || '').toUpperCase();
      if (!/^[A-Z0-9]{3}$/.test(prefix)) return fail(`${ef ? 'e-Fatura' : 'e-Arşiv'} serisi 3 harf / rakam olmalı (Entegrasyonlar > e-Fatura)`);
      const year = new Date().getFullYear(); const key = prefix + year; const seq = { ...(c.seq || {}) };
      // Sıra: bu programda gönderilen son numara ile kurulumda girilen 'son kullanılan numara'nın büyüğü (tam numara veya yalnızca sıra)
      const lastIn = String((ef ? c.efLast : c.eaLast) || '').trim().toUpperCase(); const fromCfg = lastIn.startsWith(key) ? Number(lastIn.slice(7)) || 0 : /^\d+$/.test(lastIn) ? Number(lastIn) : 0;
      const last = Math.max(Number(seq[key]) || 0, fromCfg);
      const id = U.makeId(prefix, year, last + 1);
      let internet = null;
      if (!ef && doc.internet) {
        const it = doc.internet; const cv = String(it.carrierVkn || c.carrierVkn || '').replace(/\D/g, ''); const cn = it.carrierName || c.carrierName;
        if (!it.web && !c.webAddress) return fail('İnternet satışı e-Arşiv faturasında web adresi zorunludur (GİB e-Arşiv Teknik Kılavuzu)');
        if (cv.length < 10 || !cn) return fail('İnternet satışı e-Arşiv faturasında kargo firmasının VKN’si ve unvanı zorunludur (Entegrasyonlar > e-Fatura > kargo firması)');
        internet = { web: it.web || c.webAddress, payType: it.payType || 'DIGER', payDate: it.payDate, payBroker: it.payBroker, sendDate: it.sendDate || new Date().toISOString().slice(0, 10), carrierVkn: cv, carrierName: cn };
      }
      const seller = { id: c.vkn, name: c.title, taxOffice: c.taxOffice, street: c.street, district: c.district, city: c.city, phone: c.phone, email: c.email };
      const buyer = { id: buyerId, name: doc.buyer, taxOffice: doc.buyerTaxOffice, street: doc.address, district: doc.district, city: doc.city, email: doc.buyerEmail };
      const b = U.build({ profile: ef ? (c.profile === 'TICARIFATURA' && !doc.refund ? 'TICARIFATURA' : 'TEMELFATURA') : 'EARSIVFATURA', type: doc.refund ? 'IADE' : 'SATIS', refundOf: doc.refundOf, refundDate: doc.refundDate, id, date: doc.date, currency: doc.currency, rate: doc.rate, notes: [doc.note, doc.no ? 'Belge no: ' + doc.no : ''], seller, buyer, lines: doc.lines, total: doc.total, vat: doc.vat, xslt: doc.xslt });
      // Nilvera numaralama kuralı dokümanda yazmıyor: UBL kendi numaramızla gider, geçerli numara yanıttaki InvoiceNumber'dır
      let r; if (nv) { const ZIPFileBase64 = await b64zip(`${b.uuid}.xml`, U.wrap(b.body)); const q = await nvCall(c, ef ? '/einvoice/Send/Base64String' : '/earchive/Send/Base64String', { method: 'POST', body: ef ? { ZIPFileBase64, Alias: alias } : { ZIPFileBase64 } }); r = { ok: q.ok, error: q.error, values: q.j ? [{ Id: q.j.UUID, Number: q.j.InvoiceNumber }] : [] }; }
      else r = await uyCall(c, 'SendInvoice', U.UY.sendInvoice([{ body: b.body, scenario, target: { vkn: buyerId, alias, title: doc.buyer }, delivery: 'Electronic', internet, localId: doc.no ? String(doc.no) : undefined }]));
      if (!r.ok) return fail(r.error);
      seq[key] = last + 1; setCfg('efatura', { ...cfg('efatura'), seq });
      const v = (r.values || [])[0] || {}; const type = ef ? 'e-Fatura' : 'e-Arşiv'; const no = v.Number || id;
      log('efatura', doc.buyer || '', `${type} ${no}`, 'gönderildi', `${NM} · ${U.r2(b.totals.gross)} ${b.totals.currency}`); toast(`${type} ${NM} entegratörüne iletildi: ${no}`, 'ok');
      return { ok: true, type, no, uuid: b.uuid, providerId: v.Id || '', provider: nv ? 'nilvera' : 'uyumsoft', xml: U.wrap(b.body) };
    } catch (e) { return fail(e.message); }
  }
  // ---------- Paraşüt API v4 (resmî belge: apidocs.parasut.com) — satış faturası + e-Fatura / e-Arşiv / e-SMM resmileştirme ----------
  // Akış (belgedeki "Satış Faturası Resmileştirme"): müşteri → satış faturası → alıcının e-Fatura gelen kutusu var mı → e_invoices / e_archives / e_smms → trackable_jobs ile sonuç
  const PRS = 'https://api.parasut.com';
  const prsWait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  async function prsSession(c) {
    const tk = await httpCall({ url: PRS + '/oauth/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'password', client_id: String(c.clientId || '').trim(), client_secret: String(c.clientSecret || '').trim(), username: String(c.user || '').trim(), password: c.pass || '', redirect_uri: 'urn:ietf:wg:oauth:2.0:oob' }).toString() });
    let j = {}; try { j = JSON.parse(tk.body); } catch (e) { /* yok */ }
    if (!j.access_token) throw new Error(`Paraşüt girişi başarısız: ${tk.status || ''} ${j.error_description || j.error || tk.error || ''}`.trim());
    const api = async (method, path, body) => {
      const r = await httpCall({ url: `${PRS}/v4/${cid}${path}`, method, headers: { Authorization: 'Bearer ' + j.access_token, 'Content-Type': 'application/json', Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      let d = {}; try { d = JSON.parse(r.body || '{}'); } catch (e) { /* yok */ }
      if (!r.ok) { const er = (d.errors || []).map((x) => x.detail || x.title).filter(Boolean).join('; '); throw new Error(`Paraşüt ${r.status || ''}: ${er || r.error || String(r.body || '').slice(0, 160)}`); }
      return d;
    };
    let cid = String(c.companyId || '').trim();
    if (!cid) { const me = await httpCall({ url: PRS + '/v4/me?include=companies', method: 'GET', headers: { Authorization: 'Bearer ' + j.access_token, Accept: 'application/json' } }); let m = {}; try { m = JSON.parse(me.body); } catch (e) { /* yok */ } cid = ((m.included || []).find((x) => x.type === 'companies') || {}).id || ''; if (!cid) throw new Error('Paraşüt hesabında firma bulunamadı'); }
    return { api, cid };
  }
  // Belge satırlarını Paraşüt kalemlerine çevirir (KDV hariç birim fiyat + KDV oranı; oran bilinmiyorsa hata)
  async function prsInvoice(P, doc, { itemType = 'invoice', withholding } = {}) {
    const U = await ubl(); const L = U.lines(doc);
    const tax = String(doc.buyerVkn || '').replace(/\D/g, ''); if (tax.length !== 10 && tax.length !== 11) throw new Error('Alıcının VKN (10 hane) veya TCKN (11 hane) bilgisi gerekli');
    const found = await P.api('GET', `/contacts?filter[tax_number]=${tax}&page[size]=1`);
    let contactId = ((found.data || [])[0] || {}).id;
    if (!contactId) {
      const cr = await P.api('POST', '/contacts', { data: { type: 'contacts', attributes: { name: doc.buyer || 'Müşteri', contact_type: tax.length === 11 ? 'person' : 'company', tax_number: tax, tax_office: doc.buyerTaxOffice || '', address: doc.address || '', city: doc.city || '', email: doc.buyerEmail || undefined, account_type: 'customer' } } });
      contactId = cr.data.id;
    }
    const cur = { TRY: 'TRL', TRL: 'TRL', USD: 'USD', EUR: 'EUR', GBP: 'GBP' }[String(doc.currency || 'TRY').toUpperCase()]; if (!cur) throw new Error('Paraşüt yalnızca TRY, USD, EUR, GBP destekler');
    const inv = await P.api('POST', '/sales_invoices', { data: { type: 'sales_invoices', attributes: { item_type: itemType, issue_date: doc.date || new Date().toISOString().slice(0, 10), currency: cur, exchange_rate: cur === 'TRL' ? undefined : Number(doc.rate) || undefined, description: doc.no ? `NEBSOFT ${doc.no}` : 'NEBSOFT', invoice_note: doc.note || undefined, tax_number: tax, tax_office: doc.buyerTaxOffice || undefined, billing_address: doc.address || undefined, city: doc.city || undefined, withholding_rate: withholding || undefined },
      relationships: { contact: { data: { id: contactId, type: 'contacts' } }, details: { data: L.map((l) => ({ type: 'sales_invoice_details', attributes: { quantity: l.qty, unit_price: Math.round((l.net / l.qty) * 1e6) / 1e6, vat_rate: l.rate, description: l.name } })) } } } });
    return { id: inv.data.id, tax, lines: L };
  }
  async function prsJob(P, res) {
    const jobId = res && res.data && res.data.id; if (!jobId) throw new Error('Paraşüt işlem numarası dönmedi');
    for (let i = 0; i < 12; i++) { await prsWait(i < 3 ? 1500 : 2500); const j = await P.api('GET', `/trackable_jobs/${jobId}`); const st = j.data && j.data.attributes && j.data.attributes.status; if (st === 'done') return true; if (st === 'error') throw new Error('Paraşüt resmileştirme hatası: ' + ((j.data.attributes.errors || []).join('; ') || 'bilinmeyen hata')); }
    throw new Error('Paraşüt işlemi 30 saniyede tamamlanmadı; sonucu Paraşüt panelinden kontrol edin (iş no ' + jobId + ')');
  }
  async function sendParasut(doc, c) {
    const fail = (msg) => { log('efatura', doc.buyer || '', 'Paraşüt', 'hata', msg); toast('e-Fatura gönderilemedi: ' + msg, 'err'); return { ok: false, error: msg }; };
    try {
      if (doc.docType === 'e-İrsaliye') return fail('Paraşüt API’sinde e-İrsaliye resmileştirme uç noktası yok');
      const dl = doc.lines || [];
      if (dl.some((l) => l.whtCode)) return fail('Tevkifatlı fatura bu sürümde Paraşüt’e gönderilmiyor: Paraşüt API dokümanında tevkifat oranının birimi belirtilmemiş. Uyumsoft ile gönderin veya Paraşüt panelinden kesin.');
      const exc = [...new Set(dl.filter((l) => l.exemptionCode).map((l) => String(l.exemptionCode)))];
      if (exc.length > 1) return fail('Paraşüt’te bir faturada tek istisna kodu kullanılabilir; farklı istisna kodlu kalemleri ayrı faturada kesin');
      const ex = exc.length ? { vat_exemption_reason_code: exc[0], vat_exemption_reason: ['250', '350'].includes(exc[0]) ? (dl.find((l) => l.exemptionCode) || {}).exemptionReason || undefined : undefined } : {};
      const P = await prsSession(c); const inv = await prsInvoice(P, doc, { itemType: doc.refund ? 'refund' : 'invoice' });
      const ib = await P.api('GET', `/e_invoice_inboxes?filter[vkn]=${inv.tax}`); const box = ((ib.data || [])[0] || {}).attributes;
      let type, res;
      if (box && box.e_invoice_address) { type = 'e-Fatura'; res = await P.api('POST', '/e_invoices', { data: { type: 'e_invoices', attributes: { ...ex, scenario: c.scenario === 'commercial' ? 'commercial' : 'basic', to: box.e_invoice_address }, relationships: { invoice: { data: { id: inv.id, type: 'sales_invoices' } } } } }); }
      else {
        type = 'e-Arşiv'; const it = doc.internet;
        const attrs = it ? { internet_sale: { url: it.web || c.webAddress, payment_type: it.payType, payment_platform: it.payBroker || undefined, payment_date: it.payDate || undefined }, shipment: { title: it.carrierName || c.carrierName, vkn: it.carrierVkn || c.carrierVkn, date: it.sendDate || new Date().toISOString().slice(0, 10) } } : {};
        if (it && (!attrs.internet_sale.url || !attrs.shipment.vkn || !attrs.shipment.title)) return fail('İnternet satışı e-Arşiv faturasında web adresi ve kargo firmasının VKN / unvanı zorunludur');
        res = await P.api('POST', '/e_archives', { data: { type: 'e_archives', attributes: { ...ex, ...attrs }, relationships: { sales_invoice: { data: { id: inv.id, type: 'sales_invoices' } } } } });
      }
      await prsJob(P, res);
      log('efatura', doc.buyer || '', `${type} (Paraşüt fatura ${inv.id})`, 'gönderildi', 'Paraşüt'); toast(`${type} Paraşüt’te resmileştirildi`, 'ok');
      return { ok: true, type, no: 'P' + inv.id, provider: 'parasut', parasutId: inv.id };
    } catch (e) { return fail(e.message); }
  }
  // e-SMM (serbest meslek makbuzu): tahsil edilen tutar KDV dahil; KDV ve stopaj oranı kurulumda girilir (meslekten mesleğe değiştiği için tahmin edilmez)
  async function sendEsmmParasut(p, c) {
    if (c.vat === '' || c.vat === undefined || !Number.isFinite(Number(c.vat))) throw new Error('e-SMM KDV oranı kurulumda girilmemiş');
    const P = await prsSession(c); const amount = Number(p.amount || p.total) || 0; if (!(amount > 0)) throw new Error('Makbuz tutarı yok');
    const inv = await prsInvoice(P, { buyer: p.name, buyerVkn: p.tc || p.vkn, address: p.address, lines: [{ name: p.desc || 'Serbest meslek hizmeti', total: amount, vat: Number(c.vat) }] }, { withholding: p.withholding === false ? 0 : Number(c.stopaj) || 0 }); // GVK 94: stopajı yalnızca vergi kesintisi yapmakla yükümlü alıcı yapar; programlar withholding:false gönderir (ör. bireysel hasta)
    const res = await P.api('POST', '/e_smms', { data: { type: 'e_smms', attributes: { note: p.desc || undefined }, relationships: { sales_invoice: { data: { id: inv.id, type: 'sales_invoices' } } } } });
    await prsJob(P, res); return { ok: true, ref: 'P' + inv.id };
  }
  async function sendEInvoice(doc) {
    const c = cfg('efatura');
    const type = doc.docType || (doc.buyerVkn && String(doc.buyerVkn).length === 10 && doc.eFaturaUser !== false ? 'e-Fatura' : 'e-Arşiv');
    const no = `${type === 'e-İrsaliye' ? 'IRS' : type === 'e-Fatura' ? c.efPrefix : c.eaPrefix}${new Date().getFullYear()}${String(Date.now()).slice(-9)}`;
    // Eski doğrudan yol (yalnızca I.sendDirect); programlar NS.ebelge.create() kullanır. Simülasyonda numara TEST olarak döner.
    if (c.provider === 'sim') { log('efatura', doc.buyer || '', `${type} ${no}`, 'simülasyon', money(doc.total || 0)); toast(`${type} TEST — gönderilmedi (simülasyon)`, 'warn'); return { ok: true, simulated: true, type, no: 'TEST-' + no, uuid: crypto.randomUUID ? crypto.randomUUID() : NS.uid() }; }
    if (entVar('efatura', c.provider) && !(await ent.hazir('efatura', c.provider))) { const m = `${(EFAT[c.provider] || c.provider)} bağlantısı denenmedi. Entegrasyonlar sayfasından Bağlantıyı dene adımını tamamlayın.`; log('efatura', doc.buyer || '', `${type} ${no}`, 'hata', m); toast(m, 'err'); return { ok: false, error: m }; }
    if (c.provider === 'uyumsoft' || c.provider === 'nilvera') return sendUyumsoft(doc, c);
    if (c.provider === 'parasut') return sendParasut(doc, c);
    if (c.provider === 'custom' && c.url) {
      try { const r = await httpCall({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${c.user}:${c.pass}`) }, body: JSON.stringify({ type, no, ...doc }) }); log('efatura', doc.buyer, `${type} ${no}`, r.ok ? 'gönderildi' : 'hata', r.body); return { ok: r.ok, type, no }; } catch (e) { log('efatura', doc.buyer, no, 'hata', e.message); return { ok: false, error: e.message }; }
    }
    // Bu entegratörler için doğrudan bağlantı kodu yok: fatura gönderilmez, başarılı gibi gösterilmez (Entegrasyon Merkezi'nde 'Henüz desteklenmiyor')
    log('efatura', doc.buyer || '', `${type} ${no}`, 'gönderilmedi', `${EFAT[c.provider]} için doğrudan bağlantı henüz yok`);
    toast(`${type} gönderilmedi: ${EFAT[c.provider]} için doğrudan bağlantı henüz yok. Entegrasyonlar > e-Fatura’da “Özel API” (entegratörünüzün ara servisi) veya simülasyonu seçin.`, 'err');
    return { ok: false, unsupported: true, error: `${EFAT[c.provider]} için doğrudan bağlantı henüz yok` };
  }

  // ---------- Webhook ----------
  async function emit(event, data) {
    const c = cfg('webhook'); if (!c.url) return;
    const evs = String(c.events || '*').split(',').map((x) => x.trim());
    if (!evs.includes('*') && !evs.includes(event)) return;
    if (!(await ent.hazir('webhook', 'http'))) { log('webhook', c.url, event, 'hata', 'Bağlantı denenmedi'); return; }
    if (entVar('webhook', 'http')) { const r = await ent.islem('webhook', 'gonder', { event, data: { app: appId(), ...data } }).catch((e) => ({ ok: false, hata: e.message })); log('webhook', c.url, event, r.ok ? 'iletildi' : 'hata', r.ok ? '' : r.hata); return; }
    const body = JSON.stringify({ event, app: appId(), at: new Date().toISOString(), data });
    let sig = '';
    // Kayıtlı imza anahtarı bulutta tarayıcıya gelmez (yer tutucu): imzayı sunucu hesaplar
    const srvSign = /__nsg_/.test(String(c.secret || ''));
    try { if (c.secret && !srvSign && crypto.subtle) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(c.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); sig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(body)))).map((x) => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { /* imzasız gönder */ }
    httpCall({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...(srvSign ? { 'X-Nebsoft-Sign': c.secret } : { 'X-Nebsoft-Signature': sig }) }, body }).then((r) => log('webhook', c.url, event, r.ok ? 'iletildi' : 'hata', r.status)).catch((e) => log('webhook', c.url, event, 'hata', e.message));
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
  // ---------- Program bazında kullanım: yalnızca o programda gerçekten çalışan bağlantılar listelenir ----------
  // Kaynak: ürün kodunda çağrılan entegrasyonlar. Burada olmayan bağlantı o programda işe yaramadığı için gösterilmez.
  const USED = {
    cicekci: ['sms', 'whatsapp', 'printer', 'efatura', 'backup'], kurutemizleme: ['sms', 'whatsapp', 'printer', 'efatura', 'backup'], matbaa: ['sms', 'whatsapp', 'printer', 'efatura', 'backup'], pastane: ['sms', 'whatsapp', 'printer', 'efatura', 'backup'], terzi: ['sms', 'whatsapp', 'printer', 'pos', 'efatura', 'backup'],
    dernek: ['sms', 'whatsapp', 'email', 'printer', 'backup'], egitim: ['sms', 'whatsapp', 'email', 'payment', 'printer', 'backup'], danisan: ['sms', 'email', 'printer', 'backup'],
    nakliyat: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], temizlik: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], usta: ['callerid', 'sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], peyzaj: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'],
    terzi: ['sms', 'whatsapp', 'email', 'printer', 'efatura', 'backup'], cicekci: ['sms', 'whatsapp', 'email', 'printer', 'efatura', 'backup'], pastane: ['sms', 'whatsapp', 'email', 'printer', 'efatura', 'backup'], matbaa: ['sms', 'whatsapp', 'email', 'printer', 'efatura', 'backup'], kurutemizleme: ['sms', 'whatsapp', 'email', 'printer', 'label', 'efatura', 'backup'],
    dugun: ['sms', 'backup'], yurt: ['sms', 'backup'], fotograf: ['sms', 'backup'], oyun: ['sms', 'backup'],
    mobilya: ['sms', 'whatsapp', 'efatura', 'printer', 'backup'], okulservisi: ['sms', 'whatsapp', 'efatura', 'backup'], ciftci: ['sms', 'whatsapp', 'efatura', 'emustahsil', 'printer', 'backup'], lastik: ['sms', 'whatsapp', 'efatura', 'printer', 'backup'],
    adisyon: ['printer', 'pos', 'okc', 'yemekplatform', 'yemekkarti', 'callerid', 'webhook', 'backup'], anaokulu: ['sms', 'backup'], bilet: ['sms', 'turnike', 'backup'],
    butik: ['sms', 'pazaryeri', 'printer', 'label', 'barcode', 'pos', 'backup'], crm: ['email', 'whatsapp', 'callerid', 'takvim', 'backup'], eczane: ['printer', 'pos', 'medula', 'its', 'sms', 'whatsapp', 'webhook', 'backup'],
    emlak: ['ilan', 'whatsapp', 'backup'], eticaret: ['payment', 'efatura', 'eirsaliye', 'kargofirma', 'pazaryeri', 'sms', 'whatsapp', 'backup'],
    fabrika: ['printer', 'label', 'scale', 'efatura', 'eirsaliye', 'emustahsil', 'kantar', 'plc', 'sms', 'email', 'whatsapp', 'webhook', 'backup'], fiyatrobotu: ['backup'],
    galeri: ['ilan', 'sms', 'whatsapp', 'backup'], hukuk: ['sms', 'efatura', 'backup'], ik: ['sgk', 'pdks', 'ebordro', 'bankamaas', 'backup'], kargo: ['kargofirma', 'gps', 'sms', 'whatsapp', 'backup'],
    kiralama: ['aracbildirim', 'hgs', 'gps', 'backup'], klinik: ['enabiz', 'erecete', 'kps', 'esmm', 'takvim', 'pos', 'efatura', 'sms', 'backup'], kurs: ['meb', 'onlineders', 'payment', 'sms', 'whatsapp', 'backup'],
    kuyumcu: ['sms', 'backup'], muhasebe: ['efatura', 'email', 'sms', 'whatsapp', 'webhook', 'backup'], musavir: ['efatura', 'sms', 'backup'],
    otel: ['kbs', 'kanal', 'kapikilit', 'santral', 'pos', 'efatura', 'backup'], oto: ['anpr', 'okc', 'printer', 'pos', 'backup'], otoservis: ['sms', 'whatsapp', 'efatura', 'parca', 'backup'],
    pazaryeri: ['efatura', 'label', 'backup'], pos: ['printer', 'label', 'scale', 'pos', 'okc', 'barcode', 'efatura', 'pazaryeri', 'webhook', 'backup'],
    randevu: ['takvim', 'googleisletme', 'sms', 'whatsapp', 'pos', 'efatura', 'webhook', 'backup'], servis: ['callerid', 'sms', 'whatsapp', 'backup'], site: ['banka', 'payment', 'printer', 'sms', 'whatsapp', 'backup'],
    spor: ['turnike', 'payment', 'whatsapp', 'backup'], toptan: ['sms', 'backup'], veteriner: ['vetbis', 'petkayit', 'esmm', 'sms', 'whatsapp', 'backup'],
  };
  const WHERE_DEF = {
    sms: 'Müşteriye giden bilgilendirme ve hatırlatma mesajları bu sağlayıcıdan gönderilir.', whatsapp: 'Müşteri kartlarındaki WhatsApp düğmeleri bu ayarla çalışır: bağlantı modunda personel gönderir, API modunda mesaj otomatik gider.',
    email: 'Fatura, teklif ve raporların e-postayla gönderiminde kullanılır.', printer: 'Fiş yazdırmada kullanılır; ESC/POS yazıcı seçilirse yazdır penceresi açılmadan doğrudan basılır.',
    label: 'Ürün, raf ve kargo etiketleri bu yazıcıdan basılır.', scale: 'Tartılı ürünlerde terazi barkodu veya bilgisayara bağlı terazi okunur.', pos: 'Kartlı tahsilatta tutar POS cihazına gönderilir, sonuç ekrana döner.',
    efatura: 'Satış ve tahsilatlarda e-Fatura / e-Arşiv bu entegratörden kesilir; e-Belgeler sayfasından izlenir.', payment: 'E-ticaret vitrini, kurs, spor ve site portalı ile eğitim ödeme bağlantısında kartla ödeme bu sanal POS üzerinden alınır.',
    webhook: 'Satış ve sipariş gibi olaylar kendi sistemlerinize anlık iletilir.', backup: 'Bu programın tüm verilerini tek dosyada yedekler, gerektiğinde geri yüklersiniz.', barcode: 'Kasada barkod okuyucu ile ürün okutma; okuyucunun sonek tuşu ve kamerayla okuma ayarları.',
  };
  const WHERE = {
    adisyon: { printer: 'Adisyon, hesap fişi ve mutfak fişleri (Masalar > Hesap, Mutfak ekranı). Nakit tahsilatta para çekmecesi açılır.', pos: 'Hesap kapatırken "Kredi kartı" seçilince tutar POS cihazına gider.', okc: 'Hesap kapatıldığında mali fiş yazarkasa POS’tan kesilir.', yemekplatform: 'Paket Servis > Platformlar: Yemeksepeti, Getir ve Trendyol siparişleri adisyona düşer; menü ve stok eşitlenir.', yemekkarti: 'Ödeme al > Yemek kartı: provizyon ve gün sonu mutabakatı.', callerid: 'Telefon çaldığında arayan müşterinin kartı ve paket sipariş ekranı açılır.', webhook: 'Kapanan her hesap "satis" olayı olarak iletilir.' },
    pos: { printer: 'Satış fişi ve Z raporu; nakit satışta para çekmecesi açılır.', label: 'Stok > Etiket bas: raf ve ürün barkod etiketleri.', scale: 'Kasada tartılı ürün satışı: etiketli terazi barkodu veya kasaya bağlı terazi.', pos: 'Kart ile ödemede tutar POS cihazına gider.', okc: 'Satış tamamlanınca mali fiş yazarkasa POS’tan kesilir.', pazaryeri: 'Hızlı Ticaret sayfası: Getir Çarşı, Yemeksepeti Market ve Trendyol Go siparişleri.', efatura: 'Kurumsal müşteriye satışta e-Fatura / e-Arşiv kesilir.' },
    otoservis: { sms: 'Araç kabulünde takip linki, müşteri onay linki, "aracınız hazır" mesajı ve bakım/muayene hatırlatmaları.', whatsapp: 'İş emrindeki WhatsApp düğmesiyle müşteriye durum linki gönderilir.', efatura: 'Teslim ekranında "e-Arşiv fatura kes" işaretlenince fatura kesilir.', parca: 'Parça stoğu: tedarikçiden fiyat/stok sorgusu ve sipariş.' },
    randevu: { takvim: 'Her randevu Google / Outlook takviminize yazılır.', googleisletme: 'Google Haritalar ve Instagram’daki "Randevu al" düğmesi online randevu sayfanıza bağlanır.', sms: 'Randevu onayı ve hatırlatma SMS’leri.', pos: 'Kasada kartlı tahsilat.', efatura: 'Tahsilatta e-Arşiv fatura.' },
    klinik: { enabiz: 'Muayene ve işlemler e-Nabız’a toplu bildirilir.', erecete: 'Reçete yazılınca e-reçete numarası alınır.', kps: 'Hasta kaydında TC kimlik doğrulaması.', esmm: 'Hekim tahsilatlarında serbest meslek makbuzu.', takvim: 'Hekim takvimi Google / Outlook ile eşitlenir.' },
    eczane: { medula: 'Reçeteli satışta SGK provizyonu ve kurum faturası.', its: 'Karekodlu ilaç satış, alış ve iade bildirimleri.', printer: 'Satış fişi ve reçete özeti.', pos: 'Kartla tahsilat.' },
    otel: { kbs: 'Check-in / check-out sırasında konaklayan bilgileri bildirilir.', kanal: 'Booking, Expedia, Airbnb fiyat-müsaitlik ve rezervasyon eşitlemesi.', kapikilit: 'Check-in’de oda kartı kodlanır.', santral: 'Oda telefon görüşmeleri folyoya eklenir.', pos: 'Folyo kapatırken kartla tahsilat.', efatura: 'Çıkışta folyo faturası.' },
    muhasebe: { efatura: 'Satış faturaları e-Fatura / e-Arşiv olarak gönderilir; gelen faturalar alınır.', eirsaliye: 'Sevk irsaliyeleri GİB’e iletilir.', edefter: 'Dönem sonu e-Defter beratları.', banka: 'Banka hareketleri otomatik çekilip cari ile eşleştirilir.', muhasebeaktar: 'Fiş ve faturalar Logo / Mikro / Luca’ya aktarılır.' },
    fabrika: { kantar: 'Mal kabul ve sevkiyatta dolu/boş araç tartımı.', plc: 'Makine sayaç, duruş ve hız verisi otomatik alınır.', eirsaliye: 'Sevkiyatta e-İrsaliye.', emustahsil: 'Çiftçiden alımda e-Müstahsil makbuzu.', label: 'Lot / palet etiketleri.', scale: 'Üretimde tartım.' },
    eticaret: { kargofirma: 'Siparişte kargo gönderisi ve barkod otomatik oluşturulur.', pazaryeri: 'Ürün ve stoklar pazaryerlerine gönderilir.', eirsaliye: 'Sevkte e-İrsaliye.', efatura: 'Siparişte e-Arşiv fatura.' },
    ik: { sgk: 'İşe giriş / çıkış bildirgeleri.', pdks: 'Parmak izi / kart cihazından giriş-çıkış verisi puantaja işlenir.', ebordro: 'Bordrolar personele elektronik gönderilir.', bankamaas: 'Toplu maaş ödeme dosyası.' },
    kiralama: { aracbildirim: 'Kiralama başlarken kiracı bilgisi Emniyet’e bildirilir.', hgs: 'Kiralama süresindeki köprü-otoyol geçişleri sorgulanır.', gps: 'Araç konum ve km bilgisi.' },
    oto: { anpr: 'Girişte plaka okunur; abonede bariyer açılır.', okc: 'Tahsilatta mali fiş.', printer: 'Giriş fişi ve makbuz.', pos: 'Kartla tahsilat.' },
  };
  const HOW = (k) => (DEFS[k] && DEFS[k].conn ? (DEFS[k].cat === 'Resmi' || DEFS[k].cat === 'e-Belge' ? 'Kurumdan veya yetkili entegratörden aldığınız kullanıcı bilgilerini "Ayarla" bölümüne girin, önce "Test ortamı" ile deneyin. Sağlayıcı seçmezseniz bağlantı simülasyonda çalışır, hiçbir şey gönderilmez.' : 'Sağlayıcıyı seçin, size verilen API bilgilerini girin ve "Test" ile deneyin. Simülasyon modunda gerçek gönderim yapılmaz.') : k === 'backup' ? '"Ayarla" ile yedek hatırlatma süresini seçin; yedek dosyasını güvenli bir yerde saklayın.' : '"Ayarla" ile yöntemi seçin, bilgileri girin ve "Test" ile deneyin.');
  const whereOf = (app, k) => ((WHERE[app] || {})[k]) || WHERE_DEF[k] || (DEFS[k] && DEFS[k].desc) || '';
  function page(el, app, kinds) {
    const used = USED[appId()];
    kinds = used ? used.filter((k) => DEFS[k] && !DEFS[k].conn) : kinds || ALL;
    const sector = used ? used.filter((k) => DEFS[k] && DEFS[k].conn) : (SECTOR[appId()] || (appId() === 'pazar' ? Object.keys(CONN) : [])).filter((k) => !kinds.includes(k));
    store.load();
    let tab = kinds.length ? 'liste' : 'sektor';
    const card = (k) => `<div class="card pad col"><div class="row nw"><div class="kpi" style="padding:0"><div class="ic">${icon(DEFS[k].icon)}</div></div><div class="grow"><b>${esc(DEFS[k].title)}</b>${DEFS[k].cat ? ' ' + badge(DEFS[k].cat, DEFS[k].cat === 'Resmi' || DEFS[k].cat === 'e-Belge' ? 'warn' : 'acc') : ''}<div class="small muted">${esc(DEFS[k].desc)}</div></div></div>${used ? `<div class="nv-how"><div class="nv-how-w">${icon('info')}<span><b>Bu programda:</b> ${esc(whereOf(appId(), k))}</span></div><details><summary>Nasıl bağlanır?</summary><p>${esc(HOW(k))}</p></details></div>` : ''}<div>${STATUS(k)}</div><div class="row"><button class="btn sm grow" data-ed="${k}">${icon('settings')} Ayarla</button><button class="btn sm" data-ts="${k}">${icon('zap')} Test</button></div></div>`;
    const draw = () => {
      const logs = store.all('log');
      el.innerHTML = pageHead('Entegrasyonlar', used ? 'Yalnızca bu programda kullanılan bağlantılar listelenir — her kartta nerede ve nasıl kullanıldığı yazar' : 'SMS, yazıcı, terazi, POS cihazı, e-Belge, resmi kurum ve platform bağlantıları — tüm NEBSOFT ürünlerinde ortak çalışır', `<span class="small muted">Köprü: <b id="brs">...</b></span>`) + `
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

  NS.integ = { ent, entVar, nvCall, nvPayer, prsSession, ubl, uyCall, readPlc, trackUrl, trackShipment, trackOf, TRACK, meetingLinkOk, createMeeting, zoomToken, htmlToLines, cfg, setCfg, sms, whatsapp, email, printReceipt, openDrawer, printLabels, parseScaleBarcode, readScale, readKantar, parseWeight, cardPayment, sendEInvoice, emit, backupAll, restoreAll, page, bridgeStatus, log, DEFS, normPhone, call, isOn, SECTOR, CONN, USED, UNVERIFIED, http: httpCall };
})();

/* ===== e-Belge merkezi: e-Fatura, e-Arşiv, e-İrsaliye giden/gelen kutusu =====
   Tüm ürünlerin kestiği belgeler ortak "nebsoft:ebelge" deposunda tutulur. Numara GİB biçiminde
   (3 harf seri + yıl + 9 hane sıra), ETTN (UUID) ve UBL-TR XML üretilir. Alıcı e-Fatura mükellefi ise
   e-Fatura, değilse e-Arşiv düzenlenir. Gelen faturalar kabul/red edilir ve ürünün alış kaydına aktarılır. */
(function () {
  'use strict';
  const NS = window.NS; const I = NS.integ; if (!I || NS.ebelge) return;
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, iso, today, addDays } = NS;
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
  const SELLERS = [['Ege Un Değirmeni A.Ş.', '3240119876'], ['Marmara Yağ Sanayi', '6110432985'], ['Akın Ambalaj Film San.', '0120558734'], ['Toptan Gıda Dağıtım Ltd.', '8790213456'], ['Kırtasiye Dünyası A.Ş.', '5430987612']];
  const store = new NS.DB('ebelge', (db) => {
    db.data.docs = []; db.data.payers = {};
    // Örnek gelen faturalar
    SELLERS.slice(0, 3).forEach(([name, vkn], i) => { const net = [18450, 9320, 26700][i]; db.data.docs.push({ id: NS.uid(), dir: 'gelen', type: 'e-Fatura', scenario: i === 1 ? 'TEMELFATURA' : 'TICARIFATURA', no: ['EGU', 'MYS', 'AKN'][i] + '2026' + String(1234 + i * 77).padStart(9, '0'), uuid: uuid(), date: iso(addDays(new Date(), -i - 1)), party: { name, vkn, taxOffice: 'Merkez', address: 'İzmir' }, currency: 'TRY', lines: [{ name: ['Buğday unu Tip 550 (50 kg çuval)', 'Bitkisel margarin 25 kg', 'Flow-pack film 120 mm'][i], qty: [40, 12, 8][i], unit: ['adet', 'adet', 'rulo'][i], price: r2(net / [40, 12, 8][i]), vat: i === 2 ? 20 : 1 }], status: i === 1 ? 'kabul' : 'yanit-bekliyor', app: '', created: new Date().toISOString(), history: [{ at: new Date().toISOString(), st: 'alındı' }] }); });
  });
  const ST = { taslak: ['Taslak', ''], kuyrukta: ['Kuyrukta', 'warn'], 'gonderildi': ['Gönderildi', 'info'], 'yanit-bekliyor': ['Yanıt bekliyor', 'warn'], kabul: ['Kabul edildi', 'ok'], red: ['Reddedildi', 'err'], raporlandi: ['GİB’e raporlandı', 'ok'], test: ['Test — gönderilmedi', 'warn'], iptal: ['İptal', 'err'], hata: ['Hata', 'err'], 'iptal-talebi': ['İptal talebi', 'warn'] };
  const sellerInfo = () => { const s = NS.app && NS.app.db ? NS.app.db.settings() : {}; return { name: s.bizName || 'İşletme', vkn: s.taxNo || '', taxOffice: s.taxOffice || '', address: s.bizAddress || '', district: s.bizDistrict || '', city: s.bizCity || '', phone: s.bizPhone || '', iban: s.iban || '' }; };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : 'pazar');
  const appAd = { dernek: 'Dernek', egitim: 'Eğitim', danisan: 'Danışan', kurutemizleme: 'Kuru Temizleme', matbaa: 'Matbaa', pastane: 'Fırın & Pastane', cicekci: 'Çiçekçi', terzi: 'Terzi', nakliyat: 'Evden Eve Nakliyat', temizlik: 'Temizlik & Tesis', usta: 'Mobil Usta & Tesisat', peyzaj: 'Peyzaj & İlaçlama', dugun: 'Düğün Salonu', yurt: 'Öğrenci Yurdu', fotograf: 'Fotoğrafçı', oyun: 'Oyun Salonu', mobilya: 'Mobilya', okulservisi: 'Okul Servisi', ciftci: 'Çiftçi & Kooperatif', lastik: 'Lastikçi' }; // yeni programlar
  const appName = (id) => ({ muhasebe: 'Ön Muhasebe', pos: 'Market POS', eticaret: 'E-ticaret', otel: 'Otel', adisyon: 'Adisyon', fabrika: 'Fabrika ERP', eczane: 'Eczane', kiralama: 'Kiralama', klinik: 'Klinik', randevu: 'Randevu', servis: 'Teknik Servis', spor: 'Spor', kurs: 'Kurs', site: 'Site', emlak: 'Emlak', veteriner: 'Veteriner', crm: 'CRM', kargo: 'Kargo', bilet: 'Bilet', oto: 'Otopark', ik: 'İK' }[id] || appAd[id] || id || '-');

  // Satırları tek biçime getirir; tutarı KDV dahil gelen satırlar (yalnız "total") ayrıştırılır
  function normLines(doc) {
    const ls = (doc.lines && doc.lines.length ? doc.lines : [{ name: doc.desc || 'Hizmet bedeli', total: doc.total }]).map((l) => {
      const qty = Number(l.qty) || 1; const vat = l.vat !== undefined && l.vat !== '' ? Number(l.vat) : Number(doc.vatRate !== undefined ? doc.vatRate : 20);
      const base = { name: l.name || l.desc || 'Kalem', code: l.code || l.barcode || '', qty, unit: l.unit || 'adet', vat, exemptionCode: l.exemptionCode || '', exemptionReason: l.exemptionReason || '', whtCode: l.whtCode || '', wht: l.whtCode ? Number(l.wht) || 0 : 0, whtName: l.whtName || '' };
      const W = (o) => ({ ...o, whtAmt: o.whtCode && o.wht ? r2(o.vatAmt * o.wht / 10) : 0 });
      // Yalnız KDV dahil tutar verilmişse brüt korunur: KDV = brüt - matrah (kuruş kayması olmaz)
      if (l.price === undefined || l.price === null || l.price === '') { const gross = r2(l.total); const net = r2(gross / (1 + vat / 100)); return W({ ...base, price: Math.round((net / qty) * 10000) / 10000, disc: 0, net, vatAmt: r2(gross - net) }); }
      const price = Number(l.price); const disc = Number(l.disc) || 0; const net = r2(qty * price * (1 - disc / 100));
      return W({ ...base, price: r2(price), disc, net, vatAmt: r2(net * vat / 100) });
    });
    return ls;
  }
  const totals = (d) => { const net = r2(sum(d.lines, (l) => l.net !== undefined ? l.net : l.qty * l.price)); const vat = r2(sum(d.lines, (l) => l.vatAmt !== undefined ? l.vatAmt : l.qty * l.price * (l.vat || 0) / 100)); const byVat = {}; d.lines.forEach((l) => { byVat[l.vat] = r2((byVat[l.vat] || 0) + (l.vatAmt !== undefined ? l.vatAmt : l.qty * l.price * l.vat / 100)); }); const wht = r2(sum(d.lines, (l) => l.whtAmt || 0)); return { net, vat, wht, total: r2(net + vat), payable: r2(net + vat - wht), byVat }; };
  // Mükellef sorgusu: entegratör / GİB listesinden; simülasyonda VKN kontrol hanesi geçerli ve rakamlar toplamı çift olanlar mükellef sayılır
  // Mükellef sorgusu: simülasyonda (yalnızca test) VKN rakamları toplamı çift olanlar mükellef sayılır;
  // Uyumsoft'ta IsEInvoiceUser + GetUserAliasses, Paraşüt'te e_invoice_inboxes (resmî WSDL / swagger), özel API'de {action:'mukellef-sorgu'}
  async function isPayer(vkn) {
    vkn = String(vkn || '').replace(/\D/g, ''); if (!vkn) return { ok: true, payer: false };
    const c = I.cfg('efatura');
    store.load(); const cached = store.data.payers[vkn];
    if (cached && cached.provider === c.provider && cached.at > iso(addDays(new Date(), -7))) return { ok: true, payer: cached.payer, alias: cached.alias, cached: true };
    let payer = false, alias = '';
    try {
      if (c.provider === 'sim') { payer = vkn.length === 10 && vkn.split('').reduce((a, b) => a + Number(b), 0) % 2 === 0; alias = payer ? `urn:mail:defaultpk@${vkn}.efatura` : ''; }
      else if (c.provider === 'nilvera') { const q = await I.nvPayer(c, vkn); if (!q.ok) return q; payer = q.payer; alias = q.alias; }
      else if (c.provider === 'uyumsoft') {
        const U = await I.ubl(); const q = await I.uyCall(c, 'IsEInvoiceUser', U.UY.isEInvoiceUser(vkn)); if (!q.ok) return { ok: false, error: q.error || 'Uyumsoft mükellef sorgusu başarısız' };
        payer = q.flag === 'true';
        if (payer) { const al = await I.uyCall(c, 'GetUserAliasses', U.UY.getUserAliasses(vkn)); alias = ((al.aliases || []).find((a) => a.enabled) || {}).alias || ''; }
      } else if (c.provider === 'parasut') {
        const P = await I.prsSession(c); const ib = await P.api('GET', `/e_invoice_inboxes?filter[vkn]=${vkn}`); const box = ((ib.data || [])[0] || {}).attributes;
        payer = !!(box && box.e_invoice_address); alias = payer ? box.e_invoice_address : '';
      } else if (c.provider === 'custom' && c.url) {
        const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(c) }, body: JSON.stringify({ action: 'mukellef-sorgu', vkn }) }); if (!r.ok) return { ok: false, error: `Mükellef sorgusu başarısız (${r.status || r.error || ''})` };
        const j = JSON.parse(r.body || '{}'); payer = !!j.payer; alias = j.alias || '';
      } else return { ok: false, error: 'Mükellef sorgusu için e-Fatura entegratörü bağlı değil (Entegrasyonlar > e-Fatura)' };
    } catch (e) { return { ok: false, error: e.message }; }
    store.data.payers[vkn] = { payer, alias, at: today(), provider: c.provider }; store.save();
    return { ok: true, payer, alias };
  }
  const auth = (c) => (c.user ? { Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(`${c.user}:${c.pass || ''}`))) } : {});
  function nextNo(prefix) { store.load(); const y = new Date().getFullYear(); const k = `_seq_${prefix}${y}`; store.data._meta[k] = (store.data._meta[k] || 0) + 1; store.save(); return `${prefix}${y}${String(store.data._meta[k]).padStart(9, '0')}`; }

  // Belge oluştur + gönder (tüm ürünlerin kullandığı tek giriş noktası)
  async function create(doc) {
    const c = I.cfg('efatura');
    // Belge geneli indirim UBL'ye yazılmıyor; yok sayılırsa fatura programdakinden yüksek çıkar → açıkça reddedilir (servis-arac Ç3)
    if (Number(doc.disc) > 0 || Number(doc.discount) > 0) { const e = 'Belge geneli indirim e-Belgede desteklenmiyor — indirimi satırlara (satır iskontosu) dağıtın'; toast('e-Belge oluşturulmadı: ' + e, 'err'); return { ok: false, error: e }; }
    let type = doc.docType;
    if (!type || type === 'auto') {
      const q = await isPayer(doc.buyerVkn);
      // Uyumsoft / Paraşüt gönderimde alıcıyı kendisi sorgular; diğerlerinde sorgu başarısızsa belge türü tahmin edilmez
      if (!q.ok && !['uyumsoft', 'parasut', 'nilvera'].includes(c.provider)) { toast('e-Belge oluşturulmadı: ' + q.error, 'err'); return { ok: false, error: q.error }; }
      type = q.payer ? 'e-Fatura' : 'e-Arşiv';
    }
    if (/irsaliye/i.test(type)) type = 'e-İrsaliye';
    const prefix = type === 'e-İrsaliye' ? (c.irsPrefix || 'IRS') : type === 'e-Fatura' ? (c.efPrefix || 'NEB') : (c.eaPrefix || 'EAR');
    const rec = { id: NS.uid(), dir: 'giden', type, scenario: type === 'e-Fatura' ? (doc.refund ? 'TEMELFATURA' : doc.scenario || c.profile || 'TICARIFATURA') : type === 'e-Arşiv' ? 'EARSIVFATURA' : 'TEMELIRSALIYE', kind: doc.kind || (doc.refund ? 'IADE' : 'SATIS'), no: nextNo(String(prefix).toUpperCase().slice(0, 3).padEnd(3, 'X')), uuid: uuid(), date: doc.date || today(), time: new Date().toTimeString().slice(0, 5),
      party: { name: doc.buyer || 'Nihai tüketici', vkn: String(doc.buyerVkn || '11111111111'), taxOffice: doc.buyerTaxOffice || '', address: doc.address || doc.buyerAddress || '', district: doc.district || '', city: doc.city || '', email: doc.buyerEmail || '' }, seller: sellerInfo(),
      currency: doc.currency || 'TRY', rate: doc.rate || 1, lines: normLines(doc), note: doc.note || '', ref: doc.no || '', refundOf: doc.refundOf || '', refundDate: doc.refundDate || '', app: appId(), plate: doc.plate || '', driver: doc.driver || '', status: 'taslak', created: new Date().toISOString(), history: [], test: c.provider === 'sim' || !!c.test };
    const tt = totals(rec); Object.assign(rec, tt);
    store.load(); store.data.docs.unshift(rec); store.save();
    return send(rec, doc);
  }
  // Kayıttan entegratör belgesi (yeniden gönderimde kaynak belge yoksa)
  const docOf = (rec) => ({ docType: rec.type, buyer: rec.party.name, buyerVkn: rec.party.vkn, buyerTaxOffice: rec.party.taxOffice, address: rec.party.address, district: rec.party.district, city: rec.party.city, buyerEmail: rec.party.email, no: rec.ref, date: rec.date, currency: rec.currency, rate: rec.rate, note: rec.note, refund: rec.kind === 'IADE', refundOf: rec.refundOf, refundDate: rec.refundDate,
    lines: rec.lines.map((l) => ({ name: l.name, code: l.code, qty: l.qty, unit: l.unit, price: l.price, disc: l.disc, vat: l.vat, exemptionCode: l.exemptionCode, exemptionReason: l.exemptionReason, whtCode: l.whtCode, wht: l.wht, whtName: l.whtName })), total: rec.total, vat: rec.vat });
  const EFATN = { uyumsoft: 'Uyumsoft', parasut: 'Paraşüt', custom: 'Özel API', logo: 'Logo e-Dönüşüm', sovos: 'Sovos', mysoft: 'Mysoft', edm: 'EDM' };
  async function send(rec, src) {
    const c = I.cfg('efatura'); const hist = (st, note) => { rec.history.push({ at: new Date().toISOString(), st, note, user: NS.currentUser ? NS.currentUser.name : '' }); };
    const pname = EFATN[c.provider] || c.provider;
    const fail = (msg) => { rec.status = 'hata'; hist('hata', msg); I.log('efatura', rec.party.name, `${rec.type} ${rec.no}`, 'hata', msg); toast(`${rec.type} gönderilmedi: ${msg}`, 'err'); };
    if (c.provider === 'sim') {
      // Simülasyon: belge yalnızca bu programda oluşur; hiçbir yere gönderilmez ve "gönderildi / raporlandı" sayılmaz
      rec.status = 'test'; hist('test', 'Simülasyon — GİB’e / entegratöre gönderilmedi'); I.log('efatura', rec.party.name, `${rec.type} ${rec.no}`, 'simülasyon', money(rec.total));
      toast(`${rec.type} ${rec.no} TEST olarak oluşturuldu — gönderilmedi (Entegrasyonlar > e-Fatura’dan entegratörünüzü bağlayın)`, 'warn');
    } else if (c.provider === 'uyumsoft' || c.provider === 'parasut' || c.provider === 'nilvera') {
      if (rec.type === 'e-İrsaliye') fail(`${pname} entegrasyon servisinde e-İrsaliye yok`);
      else {
        // Uyumsoft'a gömülü görünüm şablonu gider; Paraşüt faturayı kendi şablonuyla oluşturur
        const xslt = c.provider === 'uyumsoft' || c.provider === 'nilvera' ? await designXslt({ forEmbed: true }).catch(() => '') : '';
        const r = await I.sendDirect({ ...(src || docOf(rec)), docType: rec.type, xslt: xslt || undefined });
        if (!r.ok) { rec.status = 'hata'; hist('hata', r.error || 'Gönderilemedi'); }
        else {
          Object.assign(rec, { type: r.type || rec.type, no: r.no || rec.no, uuid: r.uuid || rec.uuid, provider: c.provider, providerId: r.providerId || r.parasutId || '', xml: r.xml || rec.xml });
          rec.scenario = rec.type === 'e-Arşiv' ? 'EARSIVFATURA' : ((c.profile === 'TICARIFATURA' || c.scenario === 'commercial') && rec.kind !== 'IADE' ? 'TICARIFATURA' : 'TEMELFATURA');
          rec.status = 'gonderildi'; hist('gonderildi', `${pname} kabul etti${rec.providerId ? ' · ' + rec.providerId : ''}`);
        }
      }
    } else if (c.provider === 'custom') {
      if (!c.url) fail('Özel API servis adresi tanımlı değil (Entegrasyonlar > e-Fatura)');
      else {
        let xml = ''; try { xml = await ublXml(rec, { xslt: await designXslt({ forEmbed: true }).catch(() => '') }); } catch (e) { /* irsaliye: UBL burada üretilmez, ara servis üretir */ }
        try {
          const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(c) }, body: JSON.stringify({ action: 'gonder', provider: c.provider, test: !!c.test, ubl: xml, belge: rec }) });
          if (r.ok) { rec.status = 'gonderildi'; hist('gonderildi', String(r.body || '').slice(0, 200)); I.log('efatura', rec.party.name, `${rec.type} ${rec.no}`, 'gönderildi', r.body); toast(`${rec.type} ${rec.no} özel API’ye iletildi`, 'ok'); }
          else fail(`Özel API ${r.status || ''} ${String(r.body || r.error || '').slice(0, 120)}`);
        } catch (e) { fail(e.message); }
      }
    } else fail(`${pname} için doğrudan bağlantı yok — Entegrasyonlar > e-Fatura’da Uyumsoft, Paraşüt veya Özel API seçin`);
    store.save();
    if (rec.status === 'gonderildi' && rec.type === 'e-Arşiv' && rec.party.email && I.cfg('email').mode !== 'mailto') I.email(rec.party.email, `${rec.seller.name} e-Arşiv faturası ${rec.no}`, `Sayın ${rec.party.name},\n\n${rec.no} numaralı ${money(rec.total)} tutarlı e-Arşiv faturanız düzenlenmiştir.\nETTN: ${rec.uuid}\n\n${rec.seller.name}`);
    return { ok: rec.status !== 'hata', id: rec.id, type: rec.type, no: rec.no, uuid: rec.uuid, simulated: rec.status === 'test', status: rec.status, error: rec.status === 'hata' ? (rec.history[rec.history.length - 1] || {}).note : undefined };
  }

  // UBL-TR XML: entegratörün döndürdüğü belge varsa o; yoksa core/ubltr.js (GİB UBL-TR 1.2.1 XSD ile doğrulanan üretici)
  async function ublXml(d, { xslt } = {}) {
    if (d.xml) return d.xml;
    if (d.type === 'e-İrsaliye') throw new Error('e-İrsaliye için UBL-TR üretimi bu sürümde yok');
    const U = await I.ubl(); const me = { ...sellerInfo(), ...(d.dir === 'giden' ? d.seller || {} : {}) };
    const sup = d.dir === 'gelen' ? d.party : me; const cus = d.dir === 'gelen' ? me : d.party;
    const P = (p) => ({ id: p.vkn, name: p.name, taxOffice: p.taxOffice, street: p.address, district: p.district, city: p.city, email: p.email, phone: p.phone });
    return U.xml({ profile: d.scenario, type: d.kind === 'IADE' ? 'IADE' : 'SATIS', refundOf: d.refundOf, refundDate: d.refundDate, id: d.no, uuid: d.uuid, date: d.date, time: d.time ? d.time + ':00' : undefined, currency: d.currency, rate: d.rate, notes: [d.note, d.ref ? 'Belge no: ' + d.ref : ''], seller: P(sup), buyer: P(cus), xslt: xslt || undefined,
      lines: d.lines.map((l) => ({ name: l.name, code: l.code, qty: l.qty, unit: l.unit, price: l.price, disc: l.disc, vat: l.vat, exemptionCode: l.exemptionCode, exemptionReason: l.exemptionReason, whtCode: l.whtCode, wht: l.wht, whtName: l.whtName })) }).xml;
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
  // ---------- Resmî görünüm: GİB UBL-TR 1.2.1 paketindeki general.xslt (core/ebelge/general.xslt) ----------
  // Belgede gömülü XSLT varsa (gelen faturalar) o kullanılır; yoksa işletmenin seçtiği tasarım (GİB şablonu + logo veya kendi XSLT'si).
  // Dönüştürülen sayfa yalıtılmış iframe'de (sandbox, ayrı köken) açılır: gelen belgelerin şablonu programa erişemez.
  let gibXsl = null;
  const loadGib = () => gibXsl || (gibXsl = fetch(BASE + 'ebelge/general.xslt').then((r) => { if (!r.ok) throw new Error('GİB görünüm şablonu yüklenemedi'); return r.text(); }).catch((e) => { gibXsl = null; throw e; }));
  const designCfg = () => ({ mode: 'gib', logo: '', custom: '', customName: '', embed: true, ...(I.cfg('efatura').design || {}) });
  const withLogo = (x, logo) => { const i = x.indexOf('<body id="mainbody"'); const j = i < 0 ? -1 : x.indexOf('>', i); return j < 0 ? x : `${x.slice(0, j + 1)}<div style="margin:0 0 8px 0"><img src="${logo}" alt="Logo" style="max-height:80px;max-width:240px"/></div>${x.slice(j + 1)}`; };
  // forEmbed: faturaya gömülecek şablon. Değiştirilmemiş GİB şablonu gömülmez (alıcının görüntüleyicisi zaten bunu kullanır).
  async function designXslt({ forEmbed } = {}) {
    const d = designCfg();
    if (d.mode === 'custom' && d.custom) return forEmbed && !d.embed ? '' : d.custom;
    if (forEmbed && (!d.logo || !d.embed)) return '';
    const x = await loadGib(); return d.logo ? withLogo(x, d.logo) : x;
  }
  const embeddedXslt = (xml) => { const m = String(xml).match(/<cbc:DocumentType>XSLT<\/cbc:DocumentType>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)</); if (!m) return ''; try { return decodeURIComponent(escape(atob(m[1].replace(/\s/g, '')))); } catch (e) { return ''; } };
  // Tarayıcıların yerleşik XSLT'si kaldırılıyor (chromestatus.com/feature/4709671889534976: Chrome 158'den itibaren çalışmaz).
  // Bu yüzden dönüşüm her zaman Chrome ekibinin libxslt/WASM polyfill'iyle yapılır (core/vendor, BSD-3, sürüm 1.0.31).
  let xpP = null;
  const xsltReady = () => xpP || (xpP = new Promise((ok, no) => { if (window.xsltPolyfillReady) return ok(); const sc = document.createElement('script'); sc.src = BASE + 'vendor/xslt-polyfill-1.0.31/xslt-polyfill.min.js'; sc.charset = 'utf-8'; sc.onload = ok; sc.onerror = () => { xpP = null; no(new Error('XSLT motoru yüklenemedi')); }; window.xsltDontAutoloadXmlDocs = true; document.head.appendChild(sc); }).then(() => (window.xsltPolyfillReady ? window.xsltPolyfillReady() : null)));
  // Not: GİB general.xslt version="2.0" yazar; libxslt bunu ileri uyumlu modda çalıştırıp konsola "only 1.1 features" bilgisini basar.
  // 1.0'a çevrilirse şablondaki xsl:character-map hata verir; bu yüzden sürüm değiştirilmez.
  async function transform(xml, xsl) {
    await xsltReady();
    if (typeof XSLTProcessor === 'undefined') throw new Error('XSLT motoru kullanılamıyor');
    const P = new DOMParser(); const xd = P.parseFromString(xml, 'application/xml'); const sd = P.parseFromString(xsl, 'application/xml');
    if (xd.getElementsByTagName('parsererror').length) throw new Error('Belge XML’i okunamadı');
    if (sd.getElementsByTagName('parsererror').length) throw new Error('Görünüm şablonu (XSLT) geçersiz');
    const pr = new XSLTProcessor(); pr.importStylesheet(sd); const out = pr.transformToDocument(xd);
    if (!out || !out.documentElement || !out.documentElement.textContent.trim()) throw new Error('Şablon bu belgeden görünüm üretemedi');
    // Yazdırma isteği üst pencereden mesajla gelir (iframe ayrı kökende olduğu için doğrudan çağrılamaz)
    return '<!doctype html>' + out.documentElement.outerHTML.replace('</body>', '<script>addEventListener("message",function(e){if(e.data==="nb-print")print()})<\/script></body>');
  }
  async function visualHtml(d, xslOverride) {
    const xml = await ublXml(d, { xslt: d.dir === 'giden' && !d.xml ? await designXslt({ forEmbed: true }).catch(() => '') : undefined });
    return await transform(xml, xslOverride || embeddedXslt(xml) || (await designXslt()));
  }
  const frame = (h) => `<iframe class="nb-ef" sandbox="allow-scripts allow-modals" style="width:100%;height:70vh;border:1px solid var(--border);border-radius:10px;background:#fff" srcdoc="${esc(h)}"></iframe>`;

  function view(id) {
    store.load(); const d = store.get('docs', id); if (!d) return toast('Belge bulunamadı', 'err');
    const m = modal({ title: `${d.type} · ${d.no}`, size: 'xl', body: `<div class="row mb">${badge(ST[d.status][0], ST[d.status][1])} ${badge(d.scenario, 'acc')} ${d.dir === 'gelen' ? badge('Gelen', 'info') : badge('Giden · ' + appName(d.app))}${d.status === 'test' ? ' ' + badge('TEST — resmî belge değildir', 'warn') : ''}</div><div id="ebv-doc"><div class="muted small">Resmî görünüm hazırlanıyor…</div></div>
      <h3 class="mt mb">Belge geçmişi</h3>${table({ rows: d.history.slice().reverse(), empty: 'Kayıt yok', columns: [{ label: 'Zaman', render: (h) => NS.dt(h.at) }, { label: 'Durum', render: (h) => esc((ST[h.st] || [h.st])[0]) }, { label: 'Not', render: (h) => `<span class="small">${esc(h.note || '')}</span>` }, { label: 'Kullanıcı', render: (h) => esc(h.user || '') }] })}`,
      actions: [{ label: 'XML (UBL-TR)', icon: 'download', onClick: async () => { try { download(`${d.no}.xml`, await ublXml(d), 'application/xml'); } catch (e) { toast('XML üretilemedi: ' + e.message, 'err'); } } },
        { label: 'Yazdır / PDF', icon: 'print', onClick: () => { const f = m.root.querySelector('.nb-ef'); if (f) f.contentWindow.postMessage('nb-print', '*'); else NS.printHtml(html(d), { title: d.no }); } },
        ...(d.party.email || d.dir === 'giden' ? [{ label: 'E-posta', icon: 'mail', onClick: async () => { const to = d.party.email || (await NS.prompt('Alıcı e-posta adresi', '', { title: 'e-Belge gönder', type: 'email' })); if (to) I.email(to, `${d.type} ${d.no}`, `Sayın ${d.party.name},\n\n${d.no} numaralı ${d.type} belgeniz: ${money(d.total)}\nETTN: ${d.uuid}\nTarih: ${NS.date(d.date)}\n\n${(d.seller || sellerInfo()).name}`); } }] : []), { label: 'Kapat', cls: 'primary' }] });
    const box = m.root.querySelector('#ebv-doc');
    visualHtml(d).then((h) => { box.innerHTML = frame(h); }).catch((e) => {
      box.innerHTML = `<div class="card pad mb" style="border-color:var(--warn)"><b>GİB görünümü oluşturulamadı:</b> ${esc(e.message)}<div class="small muted">Aşağıdaki yalnızca basit önizlemedir, resmî e-Belge görünümü değildir.</div></div><div style="background:#fff;color:#111;border-radius:10px;padding:14px;border:1px solid var(--border)">${html(d)}</div>`;
    });
  }

  // ---------- Fatura görünümü tasarımı (e-Belgeler > Fatura görünümü) ----------
  function sampleDoc() {
    const s = sellerInfo();
    return { dir: 'giden', type: 'e-Arşiv', scenario: 'EARSIVFATURA', kind: 'SATIS', no: 'EAR' + new Date().getFullYear() + '000000001', uuid: '00000000-0000-4000-8000-000000000001', date: today(), time: '12:00', currency: 'TRY', note: 'Örnek belge — tasarım önizlemesi',
      seller: { ...s, vkn: s.vkn || '1234567801', district: s.district || 'İlçe', city: s.city || 'İl' }, party: { name: 'Örnek Müşteri', vkn: '11111111111', address: 'Örnek Mah. 1. Sok. No:1', district: 'Çankaya', city: 'Ankara' },
      lines: [{ name: 'Örnek ürün', qty: 2, unit: 'adet', price: 100, disc: 0, vat: 20 }, { name: 'Örnek hizmet', qty: 1, unit: 'saat', price: 250, disc: 10, vat: 20 }] };
  }
  function designPage(host) {
    const d = designCfg(); const save = (patch) => { I.setCfg('efatura', { ...I.cfg('efatura'), design: { ...designCfg(), ...patch } }); draw(); };
    const draw = () => {
      const x = designCfg();
      host.innerHTML = `<div class="grid g-21"><div class="card"><div class="card-h"><h3>Önizleme</h3><span class="grow"></span><button class="btn sm" id="dz-pr">${icon('print')} Deneme yazdır</button></div><div class="card-b" id="dz-pv"><div class="muted small">Hazırlanıyor…</div></div></div>
        <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Görünüm şablonu</h3></div><div class="card-b col">
          <label class="row"><input type="radio" name="dzm" value="gib" ${x.mode !== 'custom' ? 'checked' : ''}> <span><b>GİB standart şablonu</b><div class="small muted">GİB UBL-TR 1.2.1 paketindeki general.xslt. İsterseniz logonuz eklenir.</div></span></label>
          <label class="row"><input type="radio" name="dzm" value="custom" ${x.mode === 'custom' ? 'checked' : ''}> <span><b>Kendi XSLT dosyam</b><div class="small muted">Entegratörünüzden veya tasarımcınızdan aldığınız .xslt dosyası.</div></span></label>
          ${x.mode === 'custom' ? `<div class="row"><button class="btn" id="dz-up">${icon('upload')} XSLT yükle</button><span class="small">${x.custom ? esc(x.customName || 'yüklü şablon') : 'Henüz yüklenmedi'}</span></div>` : `<div class="row"><button class="btn" id="dz-logo">${icon('upload')} Logo yükle</button>${x.logo ? `<img src="${x.logo}" alt="" style="max-height:40px"><button class="btn sm ghost" id="dz-nologo">Kaldır</button>` : '<span class="small muted">Logo yok</span>'}</div><div class="small muted">PNG / JPG, en fazla 150 KB. Logo faturaya gömülür; küçük tutun.</div>`}
          <label class="row mt"><input type="checkbox" id="dz-emb" ${x.embed ? 'checked' : ''}> <span>Bu tasarımı gönderilen faturaya göm<div class="small muted">Alıcı faturayı bu tasarımla görür. Kapalıysa entegratörün varsayılan görünümü kullanılır. Değiştirilmemiş GİB şablonu hiç gömülmez.</div></span></label>
        </div></div>
        <div class="card"><div class="card-b small muted">Not: Tasarım faturadaki <b>bilgileri</b> değiştirmez; yalnızca görünümünü belirler. Tasarımı, entegratörünüzün test ortamında bir belge göndererek alıcı tarafında da kontrol edin.</div></div></div></div>`;
      const pv = host.querySelector('#dz-pv');
      visualHtml(sampleDoc(), x.mode === 'custom' && x.custom ? x.custom : null).then((h) => { pv.innerHTML = frame(h); }).catch((e) => { pv.innerHTML = `<div class="small" style="color:var(--err)">${esc(e.message)}</div>`; });
      host.querySelectorAll('[name=dzm]').forEach((r) => { r.onchange = () => save({ mode: r.value }); });
      const emb = host.querySelector('#dz-emb'); emb.onchange = () => save({ embed: emb.checked });
      const pick = (accept, max, cb) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => { const f = i.files[0]; if (!f) return; if (f.size > max) return toast(`Dosya çok büyük (en fazla ${Math.round(max / 1024)} KB)`, 'err'); const rd = new FileReader(); rd.onload = () => cb(rd.result, f.name); if (accept.startsWith('image')) rd.readAsDataURL(f); else rd.readAsText(f, 'utf-8'); }; i.click(); };
      const up = host.querySelector('#dz-up'); if (up) up.onclick = () => pick('.xslt,.xsl,application/xml,text/xml', 2e6, (t, name) => { const r = new DOMParser().parseFromString(t, 'application/xml').documentElement; if (!r || r.getElementsByTagName('parsererror').length || r.namespaceURI !== 'http://www.w3.org/1999/XSL/Transform') return toast('Bu dosya geçerli bir XSLT şablonu değil', 'err'); save({ custom: t, customName: name }); toast('Şablon yüklendi', 'ok'); });
      const lg = host.querySelector('#dz-logo'); if (lg) lg.onclick = () => pick('image/png,image/jpeg', 150 * 1024, (u) => { save({ logo: u }); toast('Logo eklendi', 'ok'); });
      const nl = host.querySelector('#dz-nologo'); if (nl) nl.onclick = () => save({ logo: '' });
      host.querySelector('#dz-pr').onclick = () => { const f = pv.querySelector('.nb-ef'); if (f) f.contentWindow.postMessage('nb-print', '*'); };
    };
    draw(); return d;
  }
  // Ürünlerin gelen faturayı kendi alış kaydına dönüştürmesi için kayıt noktası
  let importer = null;
  const onImport = (fn, label) => { importer = { fn, label: label || 'Alış kaydı oluştur' }; };
  // Durum sorgusu: Uyumsoft QueryOutboxInvoiceStatus (WSDL), özel API {action:'durum-sorgu'}; simülasyonda durum değişmez
  async function query(d, { silent } = {}) {
    const c = I.cfg('efatura'); const say = (m, t) => { if (!silent) toast(m, t); return { ok: t !== 'err', error: t === 'err' ? m : '' }; };
    if (d.status === 'test') return say('Test belgesi — entegratöre gönderilmediği için durumu yoktur', 'warn');
    const prov = d.provider || c.provider;
    try {
      if (prov === 'uyumsoft') {
        if (!d.providerId) return say('Bu belgenin Uyumsoft kimliği yok; durumu Uyumsoft panelinden kontrol edin', 'warn');
        const U = await I.ubl(); const r = await I.uyCall(c, 'QueryOutboxInvoiceStatus', U.UY.queryStatus([d.providerId])); if (!r.ok) return say('Uyumsoft: ' + r.error, 'err');
        const v = (r.values || []).find((x) => x.InvoiceId === d.providerId) || (r.values || [])[0]; const st = v && U.UY.status(v.Status, d.type === 'e-Arşiv');
        if (!st) return say('Uyumsoft yanıtında durum bilgisi yok', 'err');
        d.status = st; d.history.push({ at: new Date().toISOString(), st, note: `Uyumsoft: ${v.Status}${v.Message ? ' · ' + v.Message : ''}`, user: NS.currentUser ? NS.currentUser.name : '' });
      } else if (prov === 'nilvera') {
        if (!d.providerId) return say('Bu belgenin Nilvera kimliği yok; durumu Nilvera portalından kontrol edin', 'warn');
        const ea = d.type === 'e-Arşiv'; const r = await I.nvCall(c, ea ? `/earchive/Invoices/${d.providerId}/Status` : `/einvoice/Sale/${d.providerId}/Status`); if (!r.ok) return say(r.error, 'err'); const j = r.j || {};
        const code = ea ? j.StatusCode : (j.InvoiceStatus || {}).Code, ans = (j.Answer || {}).AnswerCode;
        const st = code === 'error' ? 'hata' : code === 'waiting' ? 'kuyrukta' : ea ? (j.CancelStatus ? 'iptal' : code === 'succeed' && j.ReportStatus === 'Reported' ? 'raporlandi' : 'gonderildi') : ans === 'approved' ? 'kabul' : ans === 'rejected' ? 'red' : ans === 'waitingForApproval' ? 'yanit-bekliyor' : 'gonderildi';
        d.status = st; d.history.push({ at: new Date().toISOString(), st, note: `Nilvera: ${(ea ? j.StatusDetail : (j.InvoiceStatus || {}).Description) || code || ''}`, user: NS.currentUser ? NS.currentUser.name : '' });
      } else if (prov === 'custom' && c.url) {
        const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(c) }, body: JSON.stringify({ action: 'durum-sorgu', uuid: d.uuid, no: d.no }) });
        const j = JSON.parse(r.body || '{}'); if (!r.ok || !(j.status && ST[j.status])) return say('Özel API geçerli bir durum döndürmedi', 'err');
        d.status = j.status; d.history.push({ at: new Date().toISOString(), st: d.status, note: 'Durum sorgulandı (özel API)', user: NS.currentUser ? NS.currentUser.name : '' });
      } else return say(`${EFATN[prov] || prov} için durum sorgusu bu sürümde yok; durumu entegratör panelinden kontrol edin`, 'warn');
    } catch (e) { return say(e.message, 'err'); }
    store.save(); return { ok: true };
  }
  // İptal: Uyumsoft e-Arşiv → CancelEArchiveInvoice (WSDL). e-Fatura iptali alıcı/GİB süreciyle (GİB e-Fatura İptal-İtiraz bildirimi,
  // entegratör paneli) yapılır; program bu durumda yalnızca kendi kaydına "iptal talebi" notu düşer ve bunu açıkça söyler.
  async function cancel(d) {
    const c = I.cfg('efatura'); const H = (st, note) => d.history.push({ at: new Date().toISOString(), st, note, user: NS.currentUser ? NS.currentUser.name : '' });
    if (d.status === 'test') {
      if (!(await confirm(`${d.no} test belgesi iptal edilsin mi?`))) return false;
      d.status = 'iptal'; H('iptal', 'Test belgesi iptal edildi');
    } else if (d.type === 'e-Arşiv' && (d.provider || c.provider) === 'nilvera' && d.providerId) {
      if (!(await confirm(`${d.no} e-Arşiv faturası Nilvera üzerinden iptal edilsin mi? Bu işlem geri alınamaz.`))) return false;
      const r = await I.nvCall(c, `/earchive/Invoices/${d.providerId}/Cancel`, { method: 'PUT' }); if (!r.ok) { toast('İptal edilemedi: ' + r.error, 'err'); return false; }
      d.status = 'iptal'; H('iptal', 'Nilvera iptal başarılı');
    } else if (d.type === 'e-Arşiv' && (d.provider || c.provider) === 'uyumsoft' && d.providerId) {
      if (!(await confirm(`${d.no} e-Arşiv faturası Uyumsoft üzerinden iptal edilsin mi? Bu işlem geri alınamaz.`))) return false;
      const U = await I.ubl(); const r = await I.uyCall(c, 'CancelEArchiveInvoice', U.UY.cancelEArchive(d.providerId));
      if (!r.ok) { toast('İptal edilemedi: ' + r.error, 'err'); return false; }
      d.status = 'iptal'; H('iptal', 'Uyumsoft CancelEArchiveInvoice başarılı');
    } else {
      const why = await NS.prompt(`${d.type} bu programdan iptal edilemez: iptali entegratörünüzün panelinden (e-Fatura için GİB iptal / itiraz süreciyle) yapın. Programdaki kayda not olarak düşülecek gerekçe:`, '', { title: 'İptal talebi notu' }); if (why === null) return false;
      d.status = 'iptal-talebi'; H('iptal-talebi', 'Yalnızca not — entegratörde iptal edilmedi: ' + why);
    }
    store.save(); I.log('efatura', d.party.name, `${d.no} iptal`, d.status); return true;
  }
  function page(el, p, app) {
    store.load();
    const tab = p || 'giden'; let q = '', tf = '', sf = '';
    const docs = () => store.all('docs').filter((d) => (tab === 'giden' ? d.dir === 'giden' : d.dir === 'gelen'));
    const mo = today().slice(0, 7); const out = store.all('docs').filter((d) => d.dir === 'giden' && d.date.slice(0, 7) === mo && d.status !== 'iptal');
    const imp = importer;
    el.innerHTML = pageHead('e-Belgeler', 'e-Fatura, e-Arşiv ve e-İrsaliye giden / gelen kutusu — tüm NEBSOFT ürünlerinde ortak', `<button class="btn" id="eb-q">${icon('search')} Mükellef sorgula</button><button class="btn" id="eb-in">${icon('download')} Gelen belgeleri al</button><button class="btn" id="eb-bulk">${icon('refresh')} Durumları güncelle</button><button class="btn" id="eb-zip">${icon('download')} Arşivi indir</button><button class="btn primary" id="eb-new">${icon('plus')} Manuel e-Arşiv</button>`) + `
      <div class="grid g4 mb">${kpi('Bu ay giden', out.length, 'send', 'info', `<div class="small faint">${money(sum(out, (d) => d.total * (d.rate || 1)))}</div>`)}${kpi('e-Fatura / e-Arşiv', `${out.filter((d) => d.type === 'e-Fatura').length} / ${out.filter((d) => d.type === 'e-Arşiv').length}`, 'file')}${kpi('Yanıt bekleyen gelen', store.all('docs').filter((d) => d.dir === 'gelen' && d.status === 'yanit-bekliyor').length, 'clock', 'warn')}${kpi('Hatalı / kuyrukta', store.all('docs').filter((d) => ['hata', 'kuyrukta'].includes(d.status)).length, 'alert', 'err')}</div>
      <div class="tabs">${[['giden', 'Giden kutusu'], ['gelen', 'Gelen kutusu'], ['mukellef', 'Mükellef listesi'], ['tasarim', 'Fatura görünümü']].map(([k, l]) => `<a href="#/ebelge/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div>
      <div class="card"><div class="card-h">${NS.searchBox('ebq', 'Belge no, ünvan, VKN, ETTN...')}${tab !== 'mukellef' ? `<select class="input" id="ebt" style="max-width:160px"><option value="">Tüm türler</option><option>e-Fatura</option><option>e-Arşiv</option><option>e-İrsaliye</option></select><select class="input" id="ebs" style="max-width:170px"><option value="">Tüm durumlar</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>` : ''}<span class="grow"></span><button class="btn sm" id="ebx">${icon('download')}</button></div><div id="ebl"></div></div>`;
    if (tab === 'tasarim') { const tb = el.querySelector('.tabs'); el.querySelector('.tabs').nextElementSibling.outerHTML = '<div id="ebz"></div>'; designPage(el.querySelector('#ebz')); return void tb; }
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
      if (c.provider !== 'sim' && !(c.provider === 'custom' && c.url)) return toast(`${EFATN[c.provider] || c.provider} gelen kutusu bu sürümde otomatik alınmıyor; gelen faturaları entegratör panelinden takip edin`, 'warn');
      // Simülasyonda gelen belge uydurulmaz (CLAUDE.md §1: simülasyon kalıcı kayıt bırakmaz)
      if (c.provider === 'sim') return toast('e-Fatura TEST — entegratör bağlı değil, gelen kutusu çekilmedi (simülasyon)', 'warn');
      else { try { const r = await I.http({ url: c.url, method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(c) }, body: JSON.stringify({ action: 'gelen-listele', since: store.data._meta.inSince || '' }) }); list = (JSON.parse(r.body || '{}').docs) || []; } catch (e) { return toast(e.message, 'err'); } }
      let n = 0; list.forEach((x) => { if (store.find('docs', (d) => d.uuid === x.uuid)) return; const lines = (x.lines || []).map((l) => ({ ...l, net: r2(l.qty * l.price), vatAmt: r2(l.qty * l.price * (l.vat || 0) / 100) })); store.data.docs.unshift({ id: NS.uid(), dir: 'gelen', status: x.type === 'e-Fatura' && x.scenario === 'TICARIFATURA' ? 'yanit-bekliyor' : 'kabul', app: '', created: new Date().toISOString(), history: [{ at: new Date().toISOString(), st: 'alındı' }], ...x, lines, ...totals({ lines }) }); n++; });
      store.data._meta.inSince = new Date().toISOString(); store.save(); toast(`${n} yeni gelen belge`, n ? 'ok' : ''); app.refresh();
    };
    $('#eb-bulk', el).onclick = async () => { const ds = store.all('docs').filter((d) => d.dir === 'giden' && ['gonderildi', 'yanit-bekliyor', 'kuyrukta'].includes(d.status)); let n = 0, bad = ''; for (const d of ds) { const r = await query(d, { silent: true }); if (r.ok) n++; else bad = r.error; } toast(`${n} / ${ds.length} belgenin durumu güncellendi${bad ? ' · ' + bad : ''}`, n === ds.length ? 'ok' : 'warn'); app.refresh(); };
    // Toplu arşiv: seçilen dönemdeki belgelerin UBL-TR XML'leri (+ isteğe bağlı resmî görünüm HTML) ve dizin tablosu tek ZIP'te
    $('#eb-zip', el).onclick = async () => {
      const v = await formModal({ title: 'e-Belge arşivini indir', fields: [{ name: 'from', label: 'Başlangıç', type: 'date', value: today().slice(0, 4) + '-01-01' }, { name: 'to', label: 'Bitiş', type: 'date', value: today() }, { name: 'dir', label: 'Belgeler', type: 'select', options: [{ value: '', label: 'Giden + gelen' }, { value: 'giden', label: 'Yalnızca giden' }, { value: 'gelen', label: 'Yalnızca gelen' }] }, { name: 'html', label: 'Resmî görünümü (HTML) de ekle', type: 'checkbox' }, { name: 'test', label: 'Test (simülasyon) belgelerini de ekle', type: 'checkbox' }] });
      if (!v) return; store.load();
      const list = store.all('docs').filter((d) => d.date >= v.from && d.date <= v.to && (!v.dir || d.dir === v.dir) && (v.test || d.status !== 'test'));
      if (!list.length) return toast('Bu aralıkta belge yok', 'warn');
      toast(`${list.length} belge hazırlanıyor…`); const files = []; const skip = [];
      for (const d of list) {
        const base = `${d.dir}/${d.date.slice(0, 7)}/${d.no}`;
        try { files.push({ name: base + '.xml', data: await ublXml(d) }); if (v.html) files.push({ name: base + '.html', data: await visualHtml(d) }); } catch (e) { skip.push(`${d.no}: ${e.message}`); }
      }
      const csv = ['Yön;Tarih;Belge no;Tür;Senaryo;ETTN;Ünvan;VKN/TCKN;Matrah;KDV;Toplam;Durum', ...list.map((d) => [d.dir, d.date, d.no, d.type, d.scenario, d.uuid, d.party.name, d.party.vkn, d.net, d.vat, d.total, ST[d.status][0]].map((x) => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
      files.push({ name: 'dizin.csv', data: '\ufeff' + csv }); if (skip.length) files.push({ name: 'atlananlar.txt', data: skip.join('\r\n') });
      const a = document.createElement('a'); a.href = URL.createObjectURL(NS.zip(files)); a.download = `e-belge-arsivi-${v.from}-${v.to}.zip`; a.click();
      I.log('efatura', '', `Arşiv indirildi: ${list.length} belge`, 'tamam', `${v.from} – ${v.to}`);
      toast(`${list.length - skip.length} belge indirildi${skip.length ? ` · ${skip.length} belge atlandı (dosyada nedeni yazıyor)` : ''}`, skip.length ? 'warn' : 'ok');
    };
    $('#eb-new', el).onclick = async () => {
      const v = await formModal({ title: 'Manuel e-Arşiv / e-Fatura', size: 'wide', fields: [{ name: 'buyer', label: 'Alıcı ünvan / ad soyad', required: true, full: true }, { name: 'buyerVkn', label: 'VKN / TCKN', value: '11111111111' }, { name: 'buyerEmail', label: 'E-posta', type: 'email' }, { name: 'address', label: 'Adres', full: true }, { name: 'desc', label: 'Mal / hizmet', required: true, full: true }, { name: 'qty', label: 'Miktar', type: 'number', value: 1 }, { name: 'price', label: 'Birim fiyat (KDV hariç ₺)', type: 'number', step: '0.01', required: true }, { name: 'vat', label: 'KDV %', type: 'select', options: ['20', '10', '1', '0'] }, { name: 'note', label: 'Not', full: true }] });
      if (!v) return; await create({ docType: 'auto', buyer: v.buyer, buyerVkn: v.buyerVkn, buyerEmail: v.buyerEmail, address: v.address, note: v.note, lines: [{ name: v.desc, qty: v.qty || 1, price: v.price, vat: Number(v.vat) }] }); app.refresh();
    };
    on(el, 'click', '[data-act]', async (e, b) => {
      store.load(); const d = store.get('docs', b.dataset.id); const a = b.dataset.act;
      if (a === 'v') return view(d.id);
      if (a === 'q') { const r = await query(d); if (r.ok) toast(`Durum: ${ST[d.status][0]}`, 'ok'); }
      else if (a === 'rs') await send(d);
      else if (a === 'cx') await cancel(d);
      else if ((a === 'ok' || a === 'red') && !d.test && I.cfg('efatura').provider !== 'custom') { toast('Uygulama yanıtı (kabul / red) bu sürümde entegratöre gönderilmiyor; yanıtı entegratör panelinden verin', 'warn'); return; }
      else if (a === 'ok' || a === 'red') { const why = a === 'red' ? await NS.prompt('Red gerekçesi (gönderene iletilir)', '', { title: 'Faturayı reddet' }) : ''; if (why === null) return; d.status = a === 'ok' ? 'kabul' : 'red'; d.history.push({ at: new Date().toISOString(), st: d.status, note: why || 'Uygulama yanıtı gönderildi', user: NS.currentUser ? NS.currentUser.name : '' }); store.save(); I.log('efatura', d.party.name, `${d.no} ${a === 'ok' ? 'kabul' : 'red'}`, 'iletildi'); toast(a === 'ok' ? 'Kabul yanıtı gönderildi' : 'Red yanıtı gönderildi', 'ok'); }
      else if (a === 'imp' && imp) { const r = await imp.fn(d); if (r !== false) { d.imported = { app: appId(), at: new Date().toISOString(), ref: r || '' }; store.save(); toast('Belge alış kaydına aktarıldı', 'ok'); } }
      app.refresh();
    });
    draw();
  }
  // Uygulama içinden belge numarasına / kimliğe göre durum etiketi
  const byId = (id) => { store.load(); return store.get('docs', id) || store.find('docs', (d) => d.no === id); };
  const statusBadge = (id) => { const d = byId(id); return d ? badge(`${d.type} · ${ST[d.status][0]}`, ST[d.status][1] || 'info') : ''; };
  NS.ebelge = { create, send, isPayer, view, page, ubl: ublXml, html, visualHtml, designXslt, transform, byId, statusBadge, onImport, store, ST };
  // Eski çağrılar da yeni merkezden geçer
  // Entegratör adaptörleri (Uyumsoft, Paraşüt) e-Belge merkezinin send() fonksiyonundan çağrılır
  I.sendDirect = I.sendEInvoice;
  I.sendEInvoice = (doc) => create({ ...doc, docType: doc.docType || 'auto' });
})();
