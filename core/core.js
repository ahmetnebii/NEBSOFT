/* NEBSOFT ortak çekirdek — veri, arayüz bileşenleri, grafik, giriş ve uygulama iskeleti */

// ---------- Açılış ekranı ve ek modüller (Nova v3) ----------
// Ek modüller (bildirim/ses, belge şablonu + imza, PWA) core.js'in hemen ardından yüklenir; böylece 31 ürünün
// HTML dosyasına dokunmadan hepsine gelir. Açılış ekranı oturumda bir kez, programın ve sitenin ilk açılışında görünür.
(function () {
  const me = document.currentScript; if (!me) return;
  const base = me.src.replace(/core\.js(\?.*)?$/, '');
  window.__NB_ASSETS = base.replace(/core\/$/, 'assets/');
  try { const p = localStorage.getItem('nebsoft:palette') || (!localStorage.getItem('nebsoft:theme') && !/\/apps\/adisyon\//.test(location.pathname) ? 'kurumsal' : ''); if (p) document.documentElement.setAttribute('data-palette', p); if (localStorage.getItem('nebsoft:navmini') === '1') document.documentElement.classList.add('nv-mini'); } catch (e) { /* yok */ }
  if (document.readyState === 'loading') ['auth.js', 'notify.js', 'docs.js', 'forms.js', 'sablon.js', 'katalog.js', 'pwa.js', 'scan.js', 'labels.js', 'support.js', 'integ-guides.js', 'integ-guides-ek.js', 'integ-wizard.js'].forEach((f) => document.write(`<script src="${base}${f}"><\/script>`));
  const page = /\/apps\/[a-z0-9]+\/(?!index\.html)[^/]+\.html$/.test(location.pathname) ? null : (location.pathname.match(/\/apps\/([a-z0-9]+)\//) || [])[1] || 'site';
  let seen = true; try { seen = sessionStorage.getItem('nv:splash:' + page) === '1'; sessionStorage.setItem('nv:splash:' + page, '1'); } catch (e) { /* yok */ }
  if (!page || seen || window.top !== window || /[?&](print|nosplash|embed)=1/.test(location.search) || matchMedia('print').matches) return;
  try { const t = localStorage.getItem('nebsoft:theme'); if (t) document.documentElement.setAttribute('data-theme', t); const p = localStorage.getItem('nebsoft:palette') || (!localStorage.getItem('nebsoft:theme') && !/\/apps\/adisyon\//.test(location.pathname) ? 'kurumsal' : ''); if (p) document.documentElement.setAttribute('data-palette', p); } catch (e) { /* yok */ }
  const name = String(document.title || '').replace(/^NEBSOFT\s*[—-]?\s*/, '').split(/[|·—]/)[0].trim();
  const el = document.createElement('div'); el.className = 'nv-splash'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'Yükleniyor');
  el.innerHTML = `<div class="nv-splash-in"><div class="nv-logo"><span class="nv-logo-ring"></span><img src="${base.replace(/core\/$/, 'assets/')}icons/icon-192.png" alt="NEBSOFT" width="112" height="112"><span class="nv-logo-shine"></span></div>${name && page !== 'site' ? `<div class="nv-sub">${name.replace(/[<>&]/g, '')} hazırlanıyor</div>` : '<div class="nv-sub">İşletme programlarınız</div>'}<div class="nv-bar"><i></i></div></div>`;
  document.documentElement.appendChild(el); // body yeniden çizilse de silinmez
  const t0 = Date.now();
  const hide = () => { setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 600); }, Math.max(0, 900 - (Date.now() - t0))); };
  addEventListener('load', hide, { once: true }); setTimeout(hide, 3000);
})();

(function () {
  'use strict';

  // ---------- Temel yardımcılar ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // Sayaç: aynı milisaniyede binlerce kayıt üretilse de (örnek veri, içe aktarma) kimlik çakışmaz
  let uidN = 0; const uid = () => Date.now().toString(36) + (uidN = (uidN + 1) % 46656).toString(36).padStart(3, '0') + Math.random().toString(36).slice(2, 7);
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const groupBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const on = (root, ev, sel, fn) => root.addEventListener(ev, (e) => { const t = e.target.closest(sel); if (t && root.contains(t)) fn(e, t); });

  const fmtMoney = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
  const fmtNum = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
  const money = (n) => fmtMoney.format(Number(n) || 0);
  const num = (n) => fmtNum.format(Number(n) || 0);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d = new Date()) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const today = () => iso(new Date());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((new Date(iso(b)) - new Date(iso(a))) / 86400000);
  const date = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '-';
  const dateLong = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : '-';
  const time = (d) => d ? new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
  const dt = (d) => d ? `${date(d)} ${time(d)}` : '-';
  const ago = (d) => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'az önce';
    if (s < 3600) return Math.floor(s / 60) + ' dk önce';
    if (s < 86400) return Math.floor(s / 3600) + ' sa önce';
    return Math.floor(s / 86400) + ' gün önce';
  };
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toLocaleUpperCase('tr-TR')).join('');
  const slug = (s) => String(s).toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const trLower = (s) => String(s ?? '').toLocaleLowerCase('tr-TR');
  const match = (q, ...fields) => { q = trLower(q).trim(); return !q || fields.some((f) => trLower(f).includes(q)); };

  // Örnek veri üretimi için isimler
  const NAMES = ['Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Şahin', 'Mustafa Çelik', 'Zeynep Arslan', 'Ali Koç', 'Elif Aydın', 'Hasan Öztürk', 'Merve Yıldız', 'Hüseyin Kurt', 'Esra Polat', 'İbrahim Doğan', 'Büşra Kılıç', 'Emre Aslan', 'Selin Erdem', 'Burak Güneş', 'Derya Aksoy', 'Can Özdemir', 'Gizem Tekin', 'Onur Karaca', 'Seda Bulut', 'Kemal Yavuz', 'Ebru Şen', 'Tolga Uçar', 'Nazlı Çetin', 'Serkan Avcı', 'Pınar Ateş', 'Volkan Kara', 'Dilek Özkan'];
  // Yalnızca örnek veri üretimi için: NAMES listesindeki kadın isimleri
  const FEMALE = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Esra', 'Büşra', 'Selin', 'Derya', 'Gizem', 'Seda', 'Ebru', 'Nazlı', 'Pınar', 'Dilek'];
  const sampleGender = (name) => (FEMALE.includes(String(name).split(' ')[0]) ? 'K' : 'E');
  const phone = () => `05${rand(30, 55)} ${rand(100, 999)} ${pad(rand(10, 99))} ${pad(rand(10, 99))}`;

  // ---------- İkonlar (24x24 çizgi ikonlar) ----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 7H6"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    download: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/>',
    upload: '<path d="M12 15V3m0 0L8 7m4-4 4 4M4 17v3h16v-3"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    barcode: '<path d="M3 5v14M6 5v14M10 5v14M13 5v14M17 5v14M21 5v14M8 5v14M19 5v14"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    truck: '<path d="M1 4h13v12H1zM14 8h4l4 4v4h-8"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    table: '<path d="M3 9h18M5 9v11M19 9v11M3 9l2-5h14l2 5"/>',
    chef: '<path d="M6 13.9A4 4 0 0 1 7.3 6a5 5 0 0 1 9.4 0A4 4 0 0 1 18 13.9V20H6z"/><path d="M6 17h12"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
    store: '<path d="M3 9 4.5 3h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5.4 5L21 12l-9 9a2.1 2.1 0 0 1-3-3l9-9 .7.9a4 4 0 0 0-5-5.4z" transform="rotate(0)"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
    car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/>',
    map: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v13H5a2 2 0 0 1-2-2V5"/><circle cx="16" cy="14" r="1.2"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="M19 12H5m0 0 6 6m-6-6 6-6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v3M10 2v3M14 2v3"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17v.5"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    building: '<path d="M4 21V3h11v18M15 9h5v12M2 21h20M8 7h3M8 11h3M8 15h3M18 13h0M18 17h0"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5M22 10v6"/>',
    paw: '<circle cx="5.5" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 12c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3.5 2.2c1.7-.7 3.3-.7 5 0A2.5 2.5 0 0 0 18 19c0-2.5-3-7-6-7z"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
    ticket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M13 5v14" stroke-dasharray="2 2"/>',
    sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    tooth: '<path d="M12 5.5C10.5 4 8.5 3 6.5 3.5 3.5 4.3 3 8 4 11c.8 2.4 1 4.5 1.5 7 .4 2 1.2 3 2 3 1.5 0 1.5-5 4.5-5s3 5 4.5 5c.8 0 1.6-1 2-3 .5-2.5.7-4.6 1.5-7 1-3 .5-6.7-2.5-7.5-2-.5-4 .5-5.5 2z"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 1 3-3M15 12a3 3 0 1 1 3 3M12 15a3 3 0 1 1-3 3M9 12a3 3 0 1 1-3-3"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.2 7 22l5-3 5 3-1.2-8.8"/>',
    pkg: '<path d="m7.5 4.3 9 5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    car2: '<path d="M14 16H9m10 0h3v-3.2a2 2 0 0 0-.6-1.4L18 8H5L2 11.4a2 2 0 0 0-.5 1.3V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    drop: '<path d="M12 2.7 5.6 9.1a9 9 0 1 0 12.8 0z"/>',
    fork: '<path d="M7 2v20M4 2v6a3 3 0 0 0 6 0V2M17 2c-2 0-3 3-3 7s1.5 4 3 4v9"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    factory: '<path d="M2 20V9l6 4V9l6 4V4h6v16zM2 20h20M17 8h0M6 16h2M11 16h2M16 16h2"/>',
    gauge: '<path d="M12 14l4-4M3.3 19a10 10 0 1 1 17.4 0z"/>',
    flask: '<path d="M9 2h6M10 2v7L4 20a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 20L14 9V2M7 15h10"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  };
  // ---------- NEBSOFT logosu: kurdele "N" işareti (her ürün kendi rengiyle) ----------
  const shade = (hex, amt) => {
    const h = String(hex || '#2563eb').replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    const ch = (s) => { const v = (n >> s) & 255; return Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)); };
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  let logoSeq = 0;
  const logoMark = (color = '#4f46e5', size = 28) => {
    const id = 'nl' + ++logoSeq;
    return `<svg class="ns-mark" width="${size}" height="${size}" viewBox="-3 -6 106 90" aria-hidden="true">
      <defs><linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.35)}"/><stop offset="1" stop-color="${shade(color, -0.05)}"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 0.55)}"/><stop offset=".55" stop-color="${shade(color, 0.1)}"/><stop offset="1" stop-color="${shade(color, -0.25)}"/></linearGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(color, 0.15)}"/><stop offset=".75" stop-color="${shade(color, -0.2)}"/><stop offset="1" stop-color="${shade(color, -0.55)}"/></linearGradient></defs>
      <path d="M0 15 L29.5 35 L29.5 62 L0 77 Z" fill="url(#${id}a)"/>
      <path d="M68.5 15 L100 0 L100 57.5 L68.5 34.5 Z" fill="url(#${id}c)"/>
      <path d="M0 15 C0 11 2 9 5 7 L14 1.8 C17 0 21 0 24 2 L98 56 C101 58.5 100.5 61.5 98 63.5 L86.5 71 C83 73 79.5 73 76.5 71 L0 15 Z" fill="url(#${id}b)"/></svg>`;
  };

  const setFavicon = (color) => {
    let l = document.querySelector('link[rel=icon]');
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    l.href = 'data:image/svg+xml,' + encodeURIComponent(logoMark(color, 64).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  };

  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.info}</svg>`;

  // ---------- Bulut bağlamı ----------
  // Sunucuda MySQL yapılandırılmışsa (canlı mod) ve sayfa bir uygulama ise veriler işletmenin bulut hesabından gelir.
  // ?demo=1 ile açılan sayfalar her zaman tarayıcıdaki demo verisiyle çalışır.
  const APP_ID = (location.pathname.match(/\/apps\/([a-z0-9]+)\//) || [])[1] || null;
  const IS_APP_PAGE = !!APP_ID && /\/apps\/[a-z0-9]+\/(index\.html)?$/.test(location.pathname);
  const CLOUD = (() => {
    if (!APP_ID || !/^https?:$/.test(location.protocol) || /[?&]demo=1/.test(location.search) || window.NS_NO_CLOUD) return null;
    try {
      const x = new XMLHttpRequest(); x.open('GET', '/api/auth/me', false); x.setRequestHeader('x-ns-csrf', '1'); x.send();
      if (x.status !== 200) return null; const me = JSON.parse(x.responseText);
      return me.mode === 'cloud' ? me : null;
    } catch (e) { return null; }
  })();
  const stopPage = (msg, to) => { try { sessionStorage.setItem('nebsoft:notice', msg); } catch (e) { /* yok */ } if (to) location.replace(to); throw new Error(msg); };
  // İşletme adresi: /t/<işletme>/apps/... — müşteriye verilen linkler ve QR kodlar hangi işletmeye ait olduğunu taşır
  const TENANT = (location.pathname.match(/^\/t\/([a-z0-9-]+)\//) || [])[1] || null;
  // Girişten sonra kullanıcı açmak istediği uygulamaya geri döner
  if (CLOUD && IS_APP_PAGE && !CLOUD.user) { try { sessionStorage.setItem('nebsoft:next', location.pathname + location.search); } catch (e) { /* yok */ } stopPage('Uygulamayı kullanmak için giriş yapın', '/#/giris'); }
  if (CLOUD && IS_APP_PAGE && CLOUD.tenant && TENANT !== CLOUD.tenant.slug) {
    location.replace(`/t/${CLOUD.tenant.slug}${location.pathname.replace(/^\/t\/[a-z0-9-]+/, '')}${location.search}${location.hash}`);
    throw new Error('yönlendiriliyor');
  }
  // Müşteri sayfası (randevu, takip, portal...): işletmenin verisi herkese açık API'den, yalnızca izin verilen kısmıyla gelir
  const PUB = CLOUD && TENANT && APP_ID && !IS_APP_PAGE ? { slug: TENANT, api: `/api/public/${TENANT}/${APP_ID}`, tk: `nebsoft:pub:${TENANT}:${APP_ID}` } : null;
  const pubToken = (v) => { try { if (v === undefined) return sessionStorage.getItem(PUB.tk) || ''; if (v) sessionStorage.setItem(PUB.tk, v); else sessionStorage.removeItem(PUB.tk); } catch (e) { /* yok */ } return v; };
  // Müşteri sayfalarının altında küçük "NEBSOFT ile hazırlandı" bağlantısı: işletmenin tavsiye koduyla ürün sayfasına gider
  let badged = false;
  function pubBadge(t, app) {
    if (badged || !t || !t.ref) return; badged = true;
    const add = () => {
      const a = document.createElement('a'); a.className = 'ns-made'; a.target = '_blank'; a.rel = 'noopener';
      a.href = `/?ref=${encodeURIComponent(t.ref)}#/urun/${app}`;
      a.innerHTML = `<b>${esc((CLOUD.site && CLOUD.site.name) || 'NEBSOFT')}</b> ile hazırlandı · İşletmeniz için ücretsiz hesap açın`;
      const home = document.createElement('a'); home.className = 'ns-made'; home.href = `/t/${t.slug}/`; home.textContent = `${t.name} · tüm online hizmetler`;
      const w = document.createElement('div'); w.className = 'ns-made-w noprint'; w.append(home, a); document.body.appendChild(w);
    };
    if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  }
  function pubStop(msg) {
    const show = () => { document.body.innerHTML = `<div style="max-width:440px;margin:18vh auto;padding:28px;text-align:center;font-family:system-ui,sans-serif"><h2 style="margin:0 0 10px">Sayfa açılamadı</h2><p style="color:#64748b;line-height:1.6">${String(msg).replace(/[<>&]/g, '')}</p></div>`; };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
    throw new Error(msg);
  }
  const pendKey = (k) => `nebsoft:pending:${CLOUD && CLOUD.tenant ? CLOUD.tenant.id : '-'}:${k}`;
  const syncJ = (method, url, body) => { const x = new XMLHttpRequest(); x.open(method, url, false); x.setRequestHeader('x-ns-csrf', '1'); if (body) x.setRequestHeader('Content-Type', 'application/json'); try { x.send(body ? JSON.stringify(body) : null); } catch (e) { return { status: 0, j: {} }; } let j = {}; try { j = JSON.parse(x.responseText); } catch (e) { /* yok */ } return { status: x.status, j }; };
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // 3 yönlü birleştirme: base = son eşitlenen, local = bu cihaz, remote = sunucudaki. Kayıt (id) düzeyinde; çakışmada bu cihaz kazanır.
  function merge3(base, local, remote) {
    if (same(local, base)) return remote;
    if (same(remote, base)) return local;
    if (Array.isArray(local) && Array.isArray(remote) && [...local, ...remote].every((x) => isObj(x) && x.id != null)) {
      const B = new Map((Array.isArray(base) ? base : []).map((x) => [x.id, x])); const Lm = new Map(local.map((x) => [x.id, x])); const Rm = new Map(remote.map((x) => [x.id, x]));
      const out = []; const seen = new Set();
      const pick = (id) => { if (seen.has(id)) return; seen.add(id); const b = B.get(id), l = Lm.get(id), r = Rm.get(id);
        if (l && r) out.push(same(l, b) ? r : same(r, b) ? l : merge3(b, l, r));
        else if (l && !r) { if (!b || !same(l, b)) out.push(l); } // sunucuda silinmişse ve burada değişmediyse sil
        else if (!l && r) { if (!b || !same(r, b)) out.push(r); } };
      remote.forEach((x) => pick(x.id)); local.forEach((x) => pick(x.id));
      return out;
    }
    if (isObj(local) && isObj(remote)) {
      const out = {}; const b = isObj(base) ? base : {};
      new Set([...Object.keys(local), ...Object.keys(remote)]).forEach((k) => {
        if (/^_seq_/.test(k) && typeof local[k] === 'number' && typeof remote[k] === 'number') { out[k] = Math.max(local[k], remote[k]); return; }
        const v = merge3(b[k], local[k], remote[k]); if (v !== undefined) out[k] = v;
      });
      return out;
    }
    return local;
  }
  // Senkron durumu göstergesi
  let syncEl = null;
  function syncState(t, kind) {
    if (!document.body) return;
    if (!syncEl) { syncEl = document.createElement('div'); syncEl.className = 'ns-sync'; syncEl.setAttribute('role', 'status'); document.body.appendChild(syncEl); }
    syncEl.textContent = t; syncEl.dataset.k = kind || ''; clearTimeout(syncEl._t);
    if (kind === 'ok') syncEl._t = setTimeout(() => { syncEl.dataset.k = 'hide'; }, 1500);
  }
  // Bulutta yeni açılan uygulama: örnek verilerle başlar, işletme bilgileri ve tek yönetici kullanıcı yazılır
  function cloudInit(db, info) {
    const s = db.data._settings || (db.data._settings = {});
    if (info.tenant) { s.bizName = info.tenant.name; if (info.tenant.phone) s.bizPhone = info.tenant.phone; if (info.tenant.address) s.bizAddress = info.tenant.address; }
    if (Array.isArray(db.data.users)) {
      const pin = String(Math.floor(100000 + Math.random() * 899999)).slice(0, 4);
      db.data.users = [{ id: 'u1', name: (info.owner && info.owner.name) || 'Yönetici', role: 'admin', pin, active: true }];
      db.ilkPin = pin; // yalnızca bu oturumda gösterilir; sunucu özetini saklar
    }
    db.data._meta.sample = true;
    // Kurulum ilerlemesi yalnızca işletmenin eklediği kayıtları saysın diye açılıştaki örnek sayıları saklanır
    db.data._meta.sampleBase = Object.fromEntries(Object.entries(db.data).filter(([k, v]) => Array.isArray(v) && !k.startsWith('_')).map(([k, v]) => [k, v.length]));
  }
  // İlk kurulum kartı: yalnızca bulutta ve deneme lisansında yüklenir (demo ve ücretli hesaplar etkilenmez)
  function kurulumYukle(app) {
    if (!CLOUD || !app.db || !app.db.cloud || app.db.serverRole) return; // kurulum hesap sahibinindir
    const L = (CLOUD.licenses || []).find((l) => l.product === app.db.name); if (!L || L.status !== 'deneme' || !L.valid) return;
    const go = () => { if (NS.kurulum) NS.kurulum.mount(app, { pid: app.db.name }); };
    if (NS.kurulum) return go();
    const add = (src, cb) => { const s = document.createElement('script'); s.src = src; s.onload = cb; document.head.appendChild(s); };
    add('/core/kurulum-adimlari.js', () => add('/core/kurulum.js', go));
  }

  // ---------- Veri katmanı (localStorage / bulut) ----------
  class DB {
    constructor(key, seed) {
      this.name = key;
      this.key = 'nebsoft:' + key;
      this.seed = seed;
      this.listeners = [];
      this.undoStack = [];
      this.pub = !!(PUB && key === APP_ID);
      this.cloud = !this.pub && !!(CLOUD && CLOUD.user && (CLOUD.apps || []).includes(key));
      if (CLOUD && CLOUD.user && key === APP_ID && !this.cloud && !this.pub) stopPage('Bu uygulama için geçerli lisans veya deneme yok', `/#/urun/${key}`);
      this.load();
      if (this.cloud) this._watch();
    }
    load() {
      if (this.pub) return this._pubLoad();
      if (this.cloud) return this._cloudLoad();
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(this.key)); } catch (e) { raw = null; }
      if (!raw) {
        this.data = { _meta: { created: new Date().toISOString() } };
        if (this.seed) this.seed(this);
        this._snap = undefined; this.save();
      } else { this.data = raw; this._snap = JSON.stringify(raw); }
    }
    _cloudLoad() {
      const r = syncJ('GET', '/api/data/' + this.name);
      if (r.status === 401) stopPage('Oturumunuz kapandı, tekrar giriş yapın', '/#/giris');
      if (r.status === 402) stopPage(r.j.error || 'Lisans gerekli', `/#/urun/${this.name}`);
      if (r.status !== 200) { syncState('Sunucuya ulaşılamadı', 'err'); throw new Error('Veri yüklenemedi: ' + (r.j.error || r.status)); }
      this._v = r.j.version; let data = r.j.data; this.serverRole = r.j.rol || null; this.serverDept = r.j.rolDept || ''; this.serverKisi = r.j.rolKisi || null; this.hesapSahibi = !!r.j.hesapSahibi; // sunucudaki hesap rolü: veri süzülmüş gelir, PIN ekranı yok
      // Çevrimdışıyken bekleyen değişiklik varsa birleştir
      let pend = null; try { pend = JSON.parse(localStorage.getItem(pendKey(this.name))); } catch (e) { pend = null; }
      if (pend && pend.data) { data = data ? merge3(pend.base ? JSON.parse(pend.base) : null, pend.data, data) : pend.data; this._dirty = true; }
      if (!data && this.serverRole) stopPage('Bu programı önce hesap sahibi açmalıdır', '/#/programlarim'); // rolü olan hesap örnek veriyle işletme verisi oluşturamaz
      if (!data) {
        this.data = { _meta: { created: new Date().toISOString() } };
        this._noPush = true; if (this.seed) this.seed(this); this._noPush = false;
        cloudInit(this, r.j); this._base = 'null'; this._dirty = true;
      } else { this.data = data; this._base = JSON.stringify(r.j.data); }
      this._snap = JSON.stringify(this.data);
      if (this._dirty) this._queue(10);
    }
    // ----- Müşteri sayfası modu -----
    // Sunucudan gelen görünümü uygular; sayfanın elindeki kayıt nesneleri (id ile) korunur, böylece bekleyen değişkenler güncel kalır
    _pubApply(j) {
      const old = this.data || {}; const data = j.data || {};
      Object.keys(data).forEach((k) => {
        if (!Array.isArray(data[k]) || !Array.isArray(old[k])) return;
        const m = new Map(old[k].filter((x) => x && x.id != null).map((x) => [x.id, x]));
        data[k] = data[k].map((x) => { const o = x && m.get(x.id); return o ? Object.assign(o, x) : x; });
      });
      data._meta = data._meta || {}; data._settings = data._settings || {};
      this.data = data; this._v = j.version; this._base = JSON.stringify(data); this._snap = this._base;
      if (j.tenant) { this.pubTenant = j.tenant; pubBadge(j.tenant, this.name); }
      this.pubIdent = j.ident || null;
    }
    _pubLoad(q) {
      const r = syncJ('POST', PUB.api + '/view', { q: q || null, token: pubToken(), x: this._pubX || null });
      if (q && r.status === 401) return false;
      if (r.status === 429) { toast(r.j.error, 'err'); return false; }
      if (r.status !== 200) { if (q) { toast(r.j.error || 'Sunucuya ulaşılamadı', 'err'); return false; } pubStop(r.j.error || 'Sunucuya ulaşılamadı. Lütfen biraz sonra tekrar deneyin.'); }
      if (r.j.token) pubToken(r.j.token);
      else if (!r.j.ident && pubToken()) pubToken(null);
      this._pubApply(r.j);
      return true;
    }
    // Sorgulama / müşteri girişi (takip kodu, telefon + şifre...). Müşteri sayfası değilse null döner, sayfa kendi kontrolünü yapar.
    lookup(q) { if (!this.pub) return null; return this._pubLoad(q); }
    // Kimlik gerektirmeyen ek sorgu (ör. indirim kodu); sonraki tüm yüklemelerde de gönderilir
    pubQuery(x) { if (!this.pub) return; this._pubX = x; this._pubLoad(); }
    pubLogout() { if (!this.pub) return; pubToken(null); this._pubLoad(); }
    // Değişiklikleri kayıt düzeyinde işlemlere çevir: ekle / alan güncelle / sil
    _pubDiff() {
      const base = JSON.parse(this._base || '{}'); const cur = this.data; const ops = [];
      new Set([...Object.keys(base), ...Object.keys(cur)]).forEach((k) => {
        if (k.startsWith('_')) return;
        const a = base[k], b = cur[k];
        if (same(a, b)) return;
        if (isObj(b) && (a === undefined || isObj(a))) { // nesne biçimli koleksiyon: anahtar bazında
          const A0 = a || {}; new Set([...Object.keys(A0), ...Object.keys(b)]).forEach((key) => { if (!same(A0[key], b[key])) ops.push({ c: k, op: 'key', key, val: b[key] === undefined ? null : b[key] }); });
          return;
        }
        if (!Array.isArray(b)) { ops.push({ c: k, op: 'bad' }); return; }
        const A = new Map((Array.isArray(a) ? a : []).map((x) => [x && x.id, x])); const Bm = new Map(b.map((x) => [x && x.id, x]));
        b.forEach((x) => {
          const o = A.get(x && x.id);
          if (!o) { ops.push({ c: k, op: 'ins', rec: x }); return; }
          if (same(o, x)) return;
          const set = {}; const unset = [];
          Object.keys(x).forEach((f) => { if (!same(o[f], x[f])) set[f] = x[f]; });
          Object.keys(o).forEach((f) => { if (!(f in x)) unset.push(f); });
          ops.push({ c: k, op: 'upd', id: x.id, set, unset });
        });
        A.forEach((x, id) => { if (!Bm.has(id)) ops.push({ c: k, op: 'del', id }); });
      });
      return ops;
    }
    _pubPush() {
      const ops = this._pubDiff();
      if (!ops.length) return;
      const r = syncJ('POST', PUB.api + '/ops', { ops, token: pubToken(), x: this._pubX || null });
      if (r.status === 200) { if (r.j.token) pubToken(r.j.token); this._pubApply(r.j); return; }
      const msg = r.j.error || 'İşlem kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
      try { this._pubLoad(); } catch (e) { /* yok */ }
      this.listeners.forEach((f) => f());
      toast(msg, 'err');
      throw new Error(msg); // sayfadaki "başarılı" adımları durdur
    }
    // Her kayıtta önceki durum geri al geçmişine eklenir (oturum boyunca, en fazla 30 adım)
    save() {
      const cur = JSON.stringify(this.data);
      if (this._snap !== undefined && this._snap !== cur && !this._noUndo) {
        this.undoStack.push({ json: this._snap, label: this._label || 'Son değişiklik', at: new Date().toISOString() });
        if (this.undoStack.length > 30) this.undoStack.shift();
      }
      this._label = null;
      if (this.pub) { this._pubPush(); this.listeners.forEach((f) => f()); return; }
      this._snap = cur;
      if (this.cloud) { if (!this._noPush) { this._dirty = true; this._queue(); } }
      else { try { localStorage.setItem(this.key, cur); } catch (e) { console.warn('Kayıt yapılamadı', e); } }
      this.listeners.forEach((f) => f());
    }
    // Sunucu PIN'i özetledi: düz değer bu cihazda kalmasın
    _pinTemizle(sent) { const t = (d) => (d.users || []).forEach((u) => { if (u && u.pin != null) { delete u.pin; u.pinVar = true; } }); const b = JSON.parse(sent); t(b); t(this.data); this._base = JSON.stringify(b); this._snap = JSON.stringify(this.data); }
    _queue(ms = 350) { clearTimeout(this._qt); this._qt = setTimeout(() => this._push(), ms); }
    _backup() { try { localStorage.setItem(pendKey(this.name), JSON.stringify({ base: this._base, data: this.data, at: Date.now() })); } catch (e) { /* kota */ } }
    async _push() {
      if (this._flight) { this._again = true; return; }
      clearTimeout(this._rt); this._rt = null;
      if (!this._dirty) return;
      this._flight = true; this._dirty = false; const sent = JSON.stringify(this.data); const onay = this._onay;
      syncState('Kaydediliyor…', 'run');
      try {
        const res = await fetch('/api/data/' + this.name, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: `{"base":${this._v}${this.serverRole ? `,"rol":${JSON.stringify(this.serverRole)}` : ''}${onay ? `,"onay":${JSON.stringify(onay)}` : ''},"data":${sent}}` });
        const j = await res.json().catch(() => ({}));
        if (res.ok) { this._v = j.version; this._base = sent; this._fails = 0; if (/"users":\[.*?"pin":/s.test(sent)) this._pinTemizle(sent); try { localStorage.removeItem(pendKey(this.name)); } catch (e) { /* yok */ } syncState('Kaydedildi', 'ok');
          if (j.onayKullanildi && this._onay === onay) this._onay = null;
          if (j.onayRed) { this._v = j.version - 1; this._dirty = true; syncState('Yetkili onayı olmayan değişiklik geri alındı', 'err'); toast('Yetkili onayı doğrulanamadı, bu değişiklik kaydedilmedi. İşlemi yeniden yapın.', 'err'); } } // eski sürümle gönderim çakışır, sunucudaki değer ekrana döner
        else if (res.status === 409 && j.code === 'rol') { this._backup(); this._dirty = false; this._flight = false; syncState(j.error || 'Hesap yetkiniz değişti', 'err'); location.reload(); return; } // rol değişti: bekleyen veri yeni görünümle birleşir
        else if (res.status === 409 && j.code === 'conflict') {
          // Başka cihaz kaydetmiş: birleştir ve yeniden gönder
          const merged = merge3(JSON.parse(this._base), JSON.parse(sent), j.data);
          const cur = JSON.stringify(this.data); const localNow = cur === sent ? merged : merge3(JSON.parse(sent), JSON.parse(cur), merged);
          this.data = localNow; this._v = j.version; this._base = JSON.stringify(j.data); this._snap = JSON.stringify(this.data); this._dirty = true;
          this.listeners.forEach((f) => f()); this._refreshUi();
        } else if (res.status === 402) { this._dirty = false; syncState('Lisans süresi doldu — değişiklikler kaydedilemiyor', 'err'); this._backup(); }
        else if (res.status === 401) { this._backup(); syncState('Oturum kapandı — tekrar giriş yapın', 'err'); }
        else throw new Error(j.error || res.status);
      } catch (e) {
        this._dirty = true; this._fails = (this._fails || 0) + 1; this._backup();
        syncState('Çevrimdışı — değişiklikler bu cihazda bekliyor', 'err');
        clearTimeout(this._rt); this._rt = setTimeout(() => this._push(), Math.min(30000, 2000 * this._fails));
      } finally {
        this._flight = false;
        if ((this._again || this._dirty) && !this._rt) { this._again = false; this._queue(50); } else this._again = false;
        if (this._rt && !this._dirty) { clearTimeout(this._rt); this._rt = null; }
      }
    }
    // Diğer cihazların değişikliklerini izle (15 sn)
    _watch() {
      window.addEventListener('beforeunload', (e) => { if (this._dirty || this._flight) { this._backup(); e.preventDefault(); e.returnValue = ''; } });
      window.addEventListener('online', () => { if (this._dirty) this._push(); });
      setInterval(async () => {
        if ((document.hidden && !NS.bgPoll) || this._dirty || this._flight) return; // bildirim izlenen ürünlerde arka planda da yoklanır
        try {
          const v = (await (await fetch(`/api/data/${this.name}/v`)).json()).version;
          if (v > this._v) {
            const j = await (await fetch('/api/data/' + this.name)).json();
            if (!j.ok || this._dirty || this._flight) return;
            if ((j.rol || null) !== (this.serverRole || null)) { location.reload(); return; }
            this.data = j.data; this._v = j.version; this._base = JSON.stringify(j.data); this._snap = this._base;
            this.listeners.forEach((f) => f()); this._refreshUi();
          }
        } catch (e) { /* çevrimdışı */ }
      }, 15000);
    }
    _refreshUi() {
      const app = NS.app; if (!app || !app.refresh) return;
      const busy = () => document.querySelector('.ns-overlay') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
      const tryIt = () => { if (busy()) { setTimeout(tryIt, 1500); return; } app.refresh(); };
      tryIt();
    }
    undo() {
      const u = this.undoStack.pop(); if (!u) return null;
      this.data = JSON.parse(u.json); this._noUndo = true; this.save(); this._noUndo = false;
      return u;
    }
    onChange(f) { this.listeners.push(f); }
    reset() {
      if (this.cloud) { Object.keys(this.data).forEach((k) => { if (Array.isArray(this.data[k]) && k !== 'users' && !k.startsWith('_')) this.data[k] = []; }); this.data._meta.sample = false; this.save(); return; }
      try { localStorage.removeItem(this.key); } catch (e) { /* yok */ } this.load();
    }
    col(name) { return (this.data[name] = this.data[name] || []); }
    all(name, filter) { const c = this.col(name); return filter ? c.filter(filter) : c.slice(); }
    get(name, id) { return this.col(name).find((x) => x.id === id); }
    find(name, f) { return this.col(name).find(f); }
    insert(name, obj, silent) {
      const rec = { id: uid(), created: new Date().toISOString(), ...obj };
      this.col(name).push(rec);
      if (!silent) this.save();
      return rec;
    }
    insertMany(name, arr) { arr.forEach((o) => this.insert(name, o, true)); this.save(); }
    update(name, id, patch) {
      const r = this.get(name, id);
      if (r) { Object.assign(r, typeof patch === 'function' ? patch(r) : patch, { updated: new Date().toISOString() }); this.save(); }
      return r;
    }
    remove(name, id) { this.data[name] = this.col(name).filter((x) => x.id !== id); this.save(); }
    set(name, arr) { this.data[name] = arr; this.save(); }
    meta(k, v) {
      if (v === undefined) return this.data._meta[k];
      this.data._meta[k] = v; this.save(); return v;
    }
    settings(defaults = {}) { return (this.data._settings = { ...defaults, ...(this.data._settings || {}) }); }
    saveSettings(s) { this.data._settings = { ...(this.data._settings || {}), ...s }; this.save(); }
    nextNo(name, prefix = '') {
      const k = '_seq_' + name;
      this.data._meta[k] = (this.data._meta[k] || 1000) + 1;
      return prefix + this.data._meta[k];
    }
    log(action, detail) {
      this._label = detail ? `${action} · ${detail}` : action;
      const c = this.col('_log');
      c.unshift({ id: uid(), at: new Date().toISOString(), action, detail, user: NS.currentUser ? NS.currentUser.name : 'Sistem' });
      if (c.length > 5000) c.length = 5000;
    }
  }

  // ---------- Tema ----------
  const THEME_KEY = 'nebsoft:theme';
  const getTheme = () => {
    let t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) { /* yok */ }
    return t || (!/\/apps\/adisyon\//.test(location.pathname) ? 'light' : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  };
  // Hazır temalar: mod (açık/koyu) + renk paleti. Seçim kaydedilir, her açılışta otomatik yüklenir.
  const THEMES = [
    { id: 'kurumsal', label: 'Kurumsal', mode: 'light', c: ['#f4f7fc', '#0b1f45', '#1f5fd6'], main: 1 }, { id: 'light', label: 'Açık', mode: 'light', c: ['#f7f7f9', '#ffffff', '#4f46e5'] }, { id: 'beyaz', label: 'Klasik beyaz', mode: 'light', c: ['#f7f7f9', '#ffffff', '#4f46e5'], white: 1 }, { id: 'dark', label: 'Koyu', mode: 'dark', c: ['#09090b', '#131316', '#6366f1'] },
    { id: 'ocean', label: 'Okyanus', mode: 'light', c: ['#f2f8f9', '#ffffff', '#0e7490'] }, { id: 'forest', label: 'Orman', mode: 'light', c: ['#f4f8f3', '#ffffff', '#15803d'] },
    { id: 'sunset', label: 'Gün batımı', mode: 'light', c: ['#fbf6f2', '#ffffff', '#e8590c'] }, { id: 'midnight', label: 'Gece mavisi', mode: 'dark', c: ['#070b16', '#0d1424', '#3b82f6'] },
    { id: 'grape', label: 'Mor', mode: 'dark', c: ['#0d0814', '#150e20', '#a855f7'] }, { id: 'graphite', label: 'Grafit', mode: 'dark', c: ['#0e0f11', '#16181b', '#f59e0b'] },
  ];
  const PAL_KEY = 'nebsoft:palette';
  // Varsayılan: kullanıcı hiç tema seçmediyse Kurumsal (kayıtlı seçimler korunur). Kafe / QR menü kapsam dışı.
  const KAFE = /\/apps\/adisyon\//.test(location.pathname);
  const DEFAULT_PAL = KAFE ? '' : 'kurumsal';
  const getPalette = () => { try { const v = localStorage.getItem(PAL_KEY); if (v) return v; return localStorage.getItem(THEME_KEY) ? '' : DEFAULT_PAL; } catch (e) { return DEFAULT_PAL; } };
  const themeId = () => getPalette() || getTheme();
  const applyTheme = (t, pal = getPalette()) => { document.documentElement.dataset.theme = t; if (pal) document.documentElement.dataset.palette = pal; else delete document.documentElement.dataset.palette; };
  // Animasyonlu geçiş: destekleyen tarayıcıda View Transitions, diğerlerinde renk geçişi
  function setTheme(id) {
    const th = THEMES.find((x) => x.id === id) || THEMES[0]; const pal = ['light', 'dark'].includes(th.id) ? '' : th.id;
    const go = () => { try { localStorage.setItem('nebsoft:palette:' + th.mode, th.id); } catch (e) { /* yok */ } $$('.nv-theme-box').forEach((bx) => { bx.outerHTML = themeCards(th.mode); }); try { localStorage.setItem(THEME_KEY, th.mode); if (pal) localStorage.setItem(PAL_KEY, pal); else localStorage.removeItem(PAL_KEY); } catch (e) { /* yok */ } applyTheme(th.mode, pal); $$('[data-theme-ico]').forEach((el) => { el.innerHTML = icon(th.mode === 'dark' ? 'sun' : 'moon'); }); $$('[data-th]').forEach((b) => b.classList.toggle('on', b.dataset.th === th.id)); };
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !rm) document.startViewTransition(go);
    else { document.documentElement.classList.add('nv-theming'); go(); setTimeout(() => document.documentElement.classList.remove('nv-theming'), 450); }
  }
  const themeCards = (mode) => { const cur = THEMES.find((t) => t.id === themeId()) || THEMES[0]; const m = mode || cur.mode;
    return `<div class="nv-theme-box"><div class="nv-tmode" role="tablist" aria-label="Açık veya koyu tema">${[['light', 'sun', 'Açık'], ['dark', 'moon', 'Koyu']].map(([k, ic, l]) => `<button type="button" role="tab" class="${m === k ? 'on' : ''}" aria-selected="${m === k}" data-tmode="${k}">${icon(ic)} ${l}</button>`).join('')}</div><div class="nv-themes">${THEMES.filter((t) => t.mode === m).map((t) => `<button class="nv-theme${themeId() === t.id ? ' on' : ''}" data-th="${t.id}" type="button" aria-label="${t.label} tema"><span class="nv-theme-sw${t.white ? ' white' : ''}" style="background:${t.c[0]}"><i style="background:${t.c[1]}"></i><b style="background:${t.c[2]}"></b></span><span>${t.label}</span></button>`).join('')}</div></div>`; };
  // Tema düğmesi: tema seçim menüsü açar
  const toggleTheme = (e) => {
    const btn = e && e.target && e.target.closest ? e.target.closest('[data-theme]:not(html)') : null; // <html> da data-theme taşır, düğme sayılmamalı
    if (!btn) return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    const old = document.querySelector('.nv-theme-pop'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.className = 'ns-menu nv-theme-pop'; m.innerHTML = `<div class="ns-menu-h">Tema</div>${themeCards()}`;
    document.body.appendChild(m); const r = btn.getBoundingClientRect(); m.style.top = r.bottom + 6 + 'px'; m.style.left = Math.max(8, Math.min(r.right - 300, innerWidth - 308)) + 'px'; m.style.width = '300px';
    const close = () => { m.remove(); document.removeEventListener('pointerdown', off, true); document.removeEventListener('keydown', esc, true); };
    const off = (ev) => { if (!m.isConnected) return close(); if (!m.contains(ev.target) && !(ev.target.closest && ev.target.closest('[data-theme]:not(html)'))) close(); };
    const esc = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } };
    document.addEventListener('pointerdown', off, true); document.addEventListener('keydown', esc, true);
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-th]'); if (b) setTheme(b.dataset.th); const md = e.target.closest('[data-tmode]'); if (md) { const k = md.dataset.tmode; let last = ''; try { last = localStorage.getItem('nebsoft:palette:' + k) || ''; } catch (x) { /* yok */ } const t = THEMES.find((x) => x.id === last && x.mode === k) || THEMES.find((x) => x.id === (k === 'light' && !KAFE ? 'kurumsal' : k)); setTheme(t.id); } });
  applyTheme(getTheme());

  // ---------- Bildirim / Modal ----------
  function toast(msg, type = '') {
    let box = $('.ns-toasts');
    if (!box) { box = document.createElement('div'); box.className = 'ns-toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'ns-toast ' + type;
    t.innerHTML = icon(type === 'err' ? 'alert' : type === 'ok' ? 'check' : 'info') + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.style.transition = '.3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2600);
  }

  // Müşteri portalı giriş kodu: tahmin edilemeyen 6 karakter, kayda bir kez yazılır
  function portalCode(db, rec) {
    if (!rec.portalCode) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = new Uint8Array(6); crypto.getRandomValues(b); rec.portalCode = [...b].map((x) => A[x % A.length]).join(''); db.save(); }
    return rec.portalCode;
  }
  // Yetkili onayı: kullanıcının rolü yetmiyorsa yetkili kişi PIN'ini girer (kasada iade, büyük indirim, fiyat değiştirme gibi).
  //   const by = await NS.approve(app, 'İade', ['admin']); if (!by) return;  → onaylayan kullanıcı (işlem geçmişine yazılır) ya da null
  // PIN doğrulama. Bulutta sunucu karşılaştırır, özet tarayıcıya inmez; çevrimdışı giriş için son başarılı giriş bu cihazda özetli tutulur.
  // Sunucusuz kurulumda özet kullanıcı kaydındadır. o: { uid } personel girişi, { roles } yetkili onayı.
  const pinHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  async function pinOzu(pin, tuz) {
    if (!window.crypto || !crypto.subtle) return null; const enc = new TextEncoder();
    const k = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
    return pinHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(tuz), iterations: 100000 }, k, 256));
  }
  async function pinYap(pin) { const tuz = pinHex(crypto.getRandomValues(new Uint8Array(12))); const h = await pinOzu(pin, tuz); return h ? `p1$${tuz}$${h}` : null; }
  async function pinEs(kayit, pin) { const [, tuz, h] = String(kayit).split('$'); return !!h && (await pinOzu(pin, tuz)) === h; }
  const pinCihaz = (db, id) => `nebsoft:pinv:${db.name}:${id}`;
  async function pinKontrol(db, deger, o = {}) {
    const pin = String(deger == null ? '' : deger).trim();
    const aday = db.all('users', (u) => u.active !== false && (o.uid ? u.id === o.uid : u.role === 'admin' || (o.roles || []).includes(u.role)));
    if (db.cloud) {
      try {
        const r = await api('POST', `/api/data/${db.name}/pin`, { pin, uid: o.uid, roles: o.roles }); const u = r.user; if (r.onay) db._onay = r.onay; // yetkili onayı belirteci: sonraki kayıtla sunucuya gider
        if (u && o.uid) { const h = await pinYap(pin); try { if (h) localStorage.setItem(pinCihaz(db, u.id), h); } catch (e) { /* yok */ } }
        return u || null;
      } catch (x) { if (x.status === 403) return null; if (x.status) throw x; }
      for (const u of aday) { let k = null; try { k = localStorage.getItem(pinCihaz(db, u.id)); } catch (e) { /* yok */ } if (k && await pinEs(k, pin)) return u; }
      throw new Error('İnternet yok. Çevrimdışı giriş yalnızca bu cihazda daha önce giriş yapan kullanıcıya açıktır.');
    }
    for (const u of aday) {
      if (u.pinH ? !(await pinEs(u.pinH, pin)) : u.pin == null || String(u.pin) !== pin) continue;
      if (!u.pinH && !/[?&]demo=1/.test(location.search)) { const h = await pinYap(pin); if (h) db.update('users', u.id, { pinH: h, pin: undefined }); }
      return u;
    }
    return null;
  }
  async function approve(app, reason, roles = ['admin']) {
    const me = NS.currentUser; if (!app.opts.auth || !me || me.role === 'admin' || roles.includes(me.role)) return me || {};
    const v = await formModal({ title: 'Yetkili onayı', fields: [{ name: 'pin', label: `${reason} — yetkili PIN`, type: 'password', required: true }], submitLabel: 'Onayla' }); if (!v) return null;
    let u = null; try { u = await pinKontrol(app.db, v.pin, { roles }); } catch (x) { toast(x.message, 'err'); return null; }
    if (!u) { toast('PIN hatalı — işlem yapılmadı', 'err'); app.db.log('Yetkili onayı reddedildi', reason); return null; }
    app.db.log('Yetkili onayı', `${reason} · onaylayan ${u.name} · isteyen ${me.name}`); return u;
  }
  // Portal giriş bilgisi penceresi: bağlantı + giriş bilgisi + rastgele kod; kopyala, SMS (gerçek sonuçla), WhatsApp, yeni kod.
  //   NS.portalShare(db, rec, { title, url, phone, name, login: 'Telefon numaranız', loginValue: '05..' })
  function portalShare(db, rec, o = {}) {
    const code = portalCode(db, rec); const biz = (db.settings ? db.settings({}).bizName : '') || '';
    const text = `${biz ? biz + ' — ' : ''}${o.title || 'portal'}: ${o.url} · ${o.login || 'Telefon numaranız'}${o.loginValue ? ' (' + o.loginValue + ')' : ''} ve giriş kodu: ${code}`;
    const wa = o.phone ? 'https://wa.me/' + ('90' + String(o.phone).replace(/\D/g, '').slice(-10)) + '?text=' + encodeURIComponent(text) : '';
    modal({ title: o.title || 'Portal giriş bilgisi', body: `<p class="muted small">Giriş için ${esc((o.login || 'telefon numarası').replace(/^./, (ch) => ch.toLocaleLowerCase('tr-TR')))} ve aşağıdaki kod birlikte gerekir. Kodu yalnızca kişinin kendisine verin; şüphe varsa yeni kod üretin (eski kod geçersiz olur).</p><div class="card pad mt"><div class="small faint">Bağlantı</div><div class="mono" style="word-break:break-all">${esc(o.url)}</div><div class="small faint mt">Giriş kodu</div><div class="mono" style="font-size:26px;font-weight:800;letter-spacing:.15em">${esc(code)}</div></div>`,
      actions: [{ label: 'Yeni kod', onClick: (c) => { delete rec.portalCode; db.save(); c(); portalShare(db, rec, o); } }, { label: 'Kopyala', onClick: () => { try { navigator.clipboard.writeText(text).then(() => toast('Kopyalandı', 'ok'), () => toast('Kopyalanamadı', 'err')); } catch (e) { toast('Kopyalanamadı', 'err'); } } },
        ...(wa ? [{ label: 'WhatsApp', onClick: () => window.open(wa, '_blank', 'noopener') }] : []),
        ...(o.phone ? [{ label: 'SMS gönder', cls: 'primary', onClick: (c) => { smsLog(db, { to: o.phone, name: o.name || '', text, kind: 'portal' }, true).result.then((res) => toast(smsText(res, 'Portal bilgisi SMS'), smsTone(res))); c(); } }] : [{ label: 'Kapat', cls: 'primary' }])] });
  }
  // Bulutta müşteri sayfaları kart çekmez: ödeme işletmeye yapılır (elden / havale). Ayarlarda IBAN varsa gösterilir.
  function payInfo({ amount, title, s = {}, note } = {}) {
    const tel = String(s.bizPhone || '').replace(/[^\d+]/g, '');
    const iban = s.iban || s.IBAN || s.bankIban;
    return modal({ title: title || 'Ödeme bilgisi', body: `${amount ? `<div class="center mb"><div style="font-size:30px;font-weight:800">${money(amount)}</div></div>` : ''}
      <p class="small" style="line-height:1.6;margin-top:0">${esc(note || 'Ödemenizi işletmemize elden veya banka havalesiyle yapabilirsiniz. Ödemeniz işlendiğinde bu sayfada görünür.')}</p>
      ${iban ? `<div class="card pad small" style="line-height:1.7"><div><span class="muted">Alıcı</span> <b>${esc(s.bankHolder || s.accountName || s.bizName || '')}</b></div>${s.bankName || s.bank ? `<div><span class="muted">Banka</span> ${esc(s.bankName || s.bank)}</div>` : ''}<div><span class="muted">IBAN</span> <b class="mono">${esc(iban)}</b></div><div class="muted">Açıklamaya adınızı yazın.</div></div>` : ''}`,
      actions: [{ label: 'Kapat' }, ...(tel ? [{ label: 'İşletmeyi ara', cls: 'primary', icon: 'phone', onClick: () => { location.href = 'tel:' + tel; } }] : [])] });
  }
  function modal({ title = '', body = '', size = '', actions = [], onOpen, onClose, closable = true } = {}) {
    const ov = document.createElement('div');
    ov.className = 'ns-overlay';
    ov.innerHTML = `<div class="ns-modal ${size}" role="dialog" aria-modal="true">
      <div class="ns-modal-h"><h2>${esc(title)}</h2>${closable ? `<button class="btn ghost icon sm" data-x>${icon('x')}</button>` : ''}</div>
      <div class="ns-modal-b"></div>
      ${actions.length ? '<div class="ns-modal-f"></div>' : ''}
    </div>`;
    const b = $('.ns-modal-b', ov);
    if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
    const close = () => { ov.remove(); document.removeEventListener('keydown', key); onClose && onClose(); };
    const key = (e) => { if (e.key === 'Escape' && closable) close(); };
    document.addEventListener('keydown', key);
    if (closable) {
      ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
      $('[data-x]', ov).onclick = close;
    }
    const f = $('.ns-modal-f', ov);
    actions.forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.cls || '');
      btn.innerHTML = (a.icon ? icon(a.icon) : '') + esc(a.label);
      btn.onclick = () => (a.onClick ? a.onClick(close, b) : close());
      f.appendChild(btn);
    });
    document.body.appendChild(ov);
    const first = $('input:not([type=hidden]),select,textarea', b);
    if (first) setTimeout(() => first.focus(), 30);
    onOpen && onOpen(b, close);
    return { root: b, close };
  }

  const confirm = (msg, { title = 'Onay', ok = 'Evet', danger = true } = {}) => new Promise((res) => {
    let done = false;
    // Toplu işlemler onay penceresini bu işaretten tanır
    setTimeout(() => { const ovs = document.querySelectorAll('.ns-overlay'); if (ovs.length) ovs[ovs.length - 1].dataset.confirm = '1'; }, 0);
    modal({
      title, body: `<p>${esc(msg)}</p>`,
      onClose: () => { if (!done) res(false); },
      actions: [
        { label: 'Vazgeç', onClick: (c) => { done = true; c(); res(false); } },
        { label: ok, cls: danger ? 'danger' : 'primary', onClick: (c) => { done = true; c(); res(true); } },
      ],
    });
  });

  const prompt = (label, value = '', { title = 'Bilgi', type = 'text' } = {}) =>
    formModal({ title, fields: [{ name: 'v', label, type, value, full: true }] }).then((r) => (r ? r.v : null));

  // Form alanları: {name,label,type:text|number|select|textarea|date|time|checkbox|color|email|tel|password, options:[..]|[{value,label}], required, full, placeholder, step, min, max, hint}
  function fieldsHtml(fields, values = {}) {
    return `<div class="form-grid">${fields.map((f) => {
      if (f.type === 'section') return `<div class="full" style="margin-top:6px"><h3>${esc(f.label)}</h3></div>`;
      const v = values[f.name] ?? f.value ?? '';
      const req = f.required ? 'required' : '';
      const attrs = `name="${f.name}" ${req} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.readonly ? 'readonly' : ''}`;
      let input;
      if (f.type === 'select') {
        const opts = (typeof f.options === 'function' ? f.options() : f.options || []).map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
        input = `<select class="input" ${attrs}>${f.empty !== undefined ? `<option value="">${esc(f.empty)}</option>` : ''}${opts.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      } else if (f.type === 'textarea') input = `<textarea class="input" ${attrs}>${esc(v)}</textarea>`;
      else if (f.type === 'checkbox') return `<div class="field ${f.full ? 'full' : ''}"><label class="check"><input type="checkbox" name="${f.name}" ${v ? 'checked' : ''}> ${esc(f.label)}</label></div>`;
      else if (Array.isArray(f.list) && f.list.length) { const lid = 'dl-' + f.name + '-' + Math.random().toString(36).slice(2, 7); input = `<input class="input" type="${f.type || 'text'}" value="${esc(v)}" list="${lid}" autocomplete="off" ${attrs}><datalist id="${lid}">${f.list.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`; } // serbest yazılır, öneri listesi
      else input = `<input class="input" type="${f.type || 'text'}" value="${esc(v)}" ${attrs}>`;
      return `<div class="field ${f.full ? 'full' : ''}"><label>${esc(f.label)}${f.required ? ' *' : ''}</label>${input}${f.hint ? `<span class="small faint">${esc(f.hint)}</span>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function readForm(root, fields) {
    const out = {};
    $$('[name]', root).forEach((el) => {
      const f = fields && fields.find((x) => x.name === el.name);
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'number' || (f && f.num)) out[el.name] = el.value === '' ? '' : Number(el.value);
      else out[el.name] = el.value.trim();
    });
    return out;
  }
  function validate(root) {
    const bad = $$('[required]', root).find((el) => !String(el.value).trim());
    if (bad) { bad.focus(); bad.style.borderColor = 'var(--err)'; toast('Lütfen zorunlu alanları doldurun', 'err'); return false; }
    return true;
  }
  const formModal = ({ title, fields, values = {}, submitLabel = 'Kaydet', size = '', extra = '', onOpen }) => new Promise((res) => {
    let done = false;
    modal({
      title, size,
      body: `<form onsubmit="return false">${fieldsHtml(fields, values)}${extra}</form>`,
      onOpen,
      onClose: () => { if (!done) res(null); },
      actions: [
        { label: 'Vazgeç', onClick: (c) => { done = true; c(); res(null); } },
        { label: submitLabel, cls: 'primary', icon: 'check', onClick: (c, b) => { if (!validate(b)) return; done = true; const v = readForm(b, fields); c(); res(v); } },
      ],
    });
  });

  // ---------- Tablo ----------
  // columns: [{key,label,render(row),cls,sort}], actions: [{icon,label,act,cls,show(row)}]
  // Boş durum: ikon türüne göre çizim (assets/empty), yoksa ikon
  const EMPTY_ART = { bell: 'bildirim', file: 'dosya', receipt: 'dosya', download: 'dosya', upload: 'dosya', rocket: 'baslayalim', sparkles: 'baslayalim' };
  function emptyArt(ic) { const base = window.__NB_ASSETS; const k = EMPTY_ART[ic] || 'kayit'; return base ? `<img class="empty-art" src="${base}empty/${k}.png" alt="" width="92" height="72" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment(this.dataset.ic))" data-ic='${icon(ic).replace(/'/g, '&#39;')}'>` : icon(ic); }
  // mobileCard: (row) => html — verilirse dar ekranda (≤ 700 px) tablo yerine kart listesi gösterilir; işlem düğmeleri aynı (data-act)
  function table({ columns, rows, actions = [], empty = 'Kayıt bulunamadı', emptyIcon = 'box', foot = '', rowAttr, mobileCard }) {
    if (!rows.length) return `<div class="empty">${emptyArt(emptyIcon)}<div>${esc(empty)}</div></div>`;
    const acts = (r) => actions.filter((a) => !a.show || a.show(r)).map((a) => `<button class="btn sm ${a.label && !a.icon ? '' : 'icon'} ghost ${a.cls || ''}" title="${esc(a.title || a.label || '')}" data-act="${a.act}" data-id="${esc(r.id)}">${a.icon ? icon(a.icon) : esc(a.label)}</button>`).join('');
    const cards = mobileCard ? `<div class="mc-list">${rows.map((r) => `<div class="mc" data-id="${esc(r.id)}"><div class="mc-b">${mobileCard(r)}</div>${actions.length ? `<div class="mc-a">${acts(r)}</div>` : ''}</div>`).join('')}</div>` : '';
    return cards + `<div class="tbl-wrap${mobileCard ? ' has-mc' : ''}"><table class="tbl"><thead><tr>${columns.map((c) => `<th class="${c.cls || ''}">${esc(c.label)}</th>`).join('')}${actions.length ? '<th></th>' : ''}</tr></thead>
      <tbody>${rows.map((r) => `<tr data-id="${esc(r.id)}" ${rowAttr ? rowAttr(r) : ''}>${columns.map((c) => `<td class="${c.cls || ''}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}${actions.length ? `<td class="act">${actions.filter((a) => !a.show || a.show(r)).map((a) => `<button class="btn sm ${a.label && !a.icon ? '' : 'icon'} ghost ${a.cls || ''}" title="${esc(a.title || a.label || '')}" data-act="${a.act}" data-id="${esc(r.id)}">${a.icon ? icon(a.icon) : esc(a.label)}</button>`).join('')}</td>` : ''}</tr>`).join('')}</tbody></table></div>${foot ? `<div class="tbl-foot">${foot}</div>` : ''}`;
  }

  // ---------- Grafikler (SVG) ----------
  // Grafiklerin ilk rengi aktif temanın ana rengidir (Kurumsal temada kurumsal mavi); diğerleri sabit ayırt edici renkler
  const PALETTE_REST = ['#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#ec4899', '#64748b', '#84cc16'];
  const PALETTE = new Proxy([], { get: (t, k) => { const all = [(getComputedStyle(document.documentElement).getPropertyValue('--accent') || '').trim() || '#4f46e5', ...PALETTE_REST]; const v = all[k]; return typeof v === 'function' ? v.bind(all) : v; } });
  const chart = {
    bars(data, { height = 220, color, format = num, labelEvery = 1 } = {}) {
      const W = 600, H = height, P = { l: 44, r: 8, t: 12, b: 26 };
      const max = Math.max(1, ...data.map((d) => d.value)) * 1.1;
      const bw = (W - P.l - P.r) / Math.max(1, data.length);
      const y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
      const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => max * t);
      return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">
        ${ticks.map((t) => `<line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}" stroke-dasharray="3 4"/><text x="${P.l - 6}" y="${y(t) + 4}" text-anchor="end">${esc(compact(t))}</text>`).join('')}
        ${data.map((d, i) => { const x = P.l + i * bw + bw * 0.18, w = bw * 0.64, yy = y(d.value); return `<g><rect x="${x}" y="${yy}" width="${w}" height="${Math.max(0, H - P.b - yy)}" rx="4" fill="${d.color || color || 'var(--accent)'}"><title>${esc(d.label)}: ${esc(format(d.value))}</title></rect>${i % labelEvery === 0 ? `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>` : ''}</g>`; }).join('')}
      </svg></div>`;
    },
    line(series, labels, { height = 220, format = num } = {}) {
      const W = 600, H = height, P = { l: 44, r: 10, t: 12, b: 26 };
      const all = series.flatMap((s) => s.values);
      const max = Math.max(1, ...all) * 1.1;
      const n = labels.length;
      const x = (i) => P.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - P.l - P.r));
      const y = (v) => H - P.b - (v / max) * (H - P.t - P.b);
      const every = Math.ceil(n / 10);
      return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">
        ${[0, 0.25, 0.5, 0.75, 1].map((t) => `<line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${y(max * t)}" y2="${y(max * t)}" stroke-dasharray="3 4"/><text x="${P.l - 6}" y="${y(max * t) + 4}" text-anchor="end">${esc(compact(max * t))}</text>`).join('')}
        ${labels.map((l, i) => (i % every === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>` : '')).join('')}
        ${series.map((s, si) => { const c = s.color || PALETTE[si]; const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          return `<polygon points="${x(0)},${H - P.b} ${pts} ${x(n - 1)},${H - P.b}" fill="${c}" opacity=".08"/><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>${s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="var(--surface)" stroke="${c}" stroke-width="2"><title>${esc(labels[i])}: ${esc(format(v))}</title></circle>`).join('')}`; }).join('')}
      </svg>${series.length > 1 ? `<div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || PALETTE[i]}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}</div>`;
    },
    donut(data, { size = 180, format = num, center = '' } = {}) {
      const total = sum(data, (d) => d.value) || 1;
      const R = 70, C = 2 * Math.PI * R;
      let off = 0;
      return `<div class="chart row nw" style="gap:18px"><svg viewBox="0 0 180 180" style="width:${size}px;flex:none">
        <circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--bg-2)" stroke-width="22"/>
        ${data.map((d, i) => { const len = (d.value / total) * C; const s = `<circle cx="90" cy="90" r="${R}" fill="none" stroke="${d.color || PALETTE[i % PALETTE.length]}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"><title>${esc(d.label)}: ${esc(format(d.value))}</title></circle>`; off += len; return s; }).join('')}
        <text x="90" y="86" text-anchor="middle" style="font-size:12px">Toplam</text><text x="90" y="106" text-anchor="middle" style="font-size:16px;font-weight:800;fill:var(--text)">${esc(center || compact(total))}</text>
      </svg><div class="col gap-s grow">${data.map((d, i) => `<div class="row nw small"><i style="width:10px;height:10px;border-radius:3px;background:${d.color || PALETTE[i % PALETTE.length]};flex:none"></i><span class="grow">${esc(d.label)}</span><b>${esc(format(d.value))}</b><span class="faint">%${Math.round((d.value / total) * 100)}</span></div>`).join('')}</div></div>`;
    },
    spark(values, color = 'var(--accent)') {
      const max = Math.max(1, ...values), W = 100, H = 30;
      const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * W},${H - (v / max) * H}`).join(' ');
      return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:30px"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
    },
  };
  function compact(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + 'B';
    return String(Math.round(n));
  }

  // Son N günün etiketleri ve günlük toplamları
  function dailySeries(records, days, dateKey, valueFn) {
    const labels = [], values = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = iso(addDays(new Date(), -i));
      labels.push(d.slice(8, 10) + '.' + d.slice(5, 7));
      values.push(sum(records.filter((r) => iso(r[dateKey]) === d), valueFn));
    }
    return { labels, values };
  }

  // ---------- Dışa aktarma / yazdırma / ses ----------
  function csv(filename, rows, columns) {
    const cols = columns || Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k }));
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const text = '﻿' + [cols.map((c) => q(c.label)).join(';'), ...rows.map((r) => cols.map((c) => q(c.value ? c.value(r) : r[c.key])).join(';'))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function readFile(accept = '.csv,.txt') {
    return new Promise((res) => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept;
      i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const r = new FileReader(); r.onload = () => res(r.result); r.readAsText(f, 'utf-8'); };
      i.click();
    });
  }
  function parseCsv(text) {
    const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
    const split = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()); };
    const head = split(lines[0]);
    return lines.slice(1).map((l) => { const v = split(l); return Object.fromEntries(head.map((h, i) => [h, v[i] ?? ''])); });
  }
  function printHtml(html, { title = 'Yazdır' } = {}) {
    // Masaüstü sürümü: yazıcı seçim penceresiyle (ayarda sessiz yazdırma seçiliyse doğrudan varsayılan yazıcıya)
    if (window.nebsoftDesktop && window.nebsoftDesktop.print) { let silent = false; try { silent = localStorage.getItem('nebsoft:silentPrint') === '1'; } catch (e) { /* yok */ } window.nebsoftDesktop.print(`<title>${esc(title)}</title><style>body{font-family:ui-monospace,Consolas,monospace;font-size:12px;padding:12px;color:#000}</style>${html}`, { silent }).then((r) => { if (r && !r.ok && r.error && r.error !== 'cancelled') toast('Yazdırılamadı: ' + r.error, 'err'); }); return; }
    const w = window.open('', '_blank', 'width=420,height=640');
    if (!w) { toast('Yazdırma penceresi açılamadı (açılır pencere engelli olabilir)', 'err'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
      body{font-family:ui-monospace,Consolas,monospace;font-size:12px;margin:0;padding:12px;color:#000}
      .c{text-align:center}.r{display:flex;justify-content:space-between;gap:8px}hr{border:0;border-top:1px dashed #000;margin:8px 0}
      h1,h2,h3{margin:4px 0} table{width:100%;border-collapse:collapse} td,th{padding:3px 2px;text-align:left} .big{font-size:16px;font-weight:700}
      .doc{font-family:Inter,Arial,sans-serif;font-size:13px;max-width:760px;margin:0 auto} .doc td,.doc th{border-bottom:1px solid #ddd;padding:6px}
    </style></head><body>${html}<script>setTimeout(()=>{print();},250)<\/script></body></html>`);
    w.document.close();
  }
  let audio;
  function beep(freq = 880, ms = 80) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.08, audio.currentTime);
      o.start(); o.stop(audio.currentTime + ms / 1000);
    } catch (e) { /* ses yok */ }
  }

  // ---------- Barkod (Code128-B) SVG ----------
  const C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  function barcodeSvg(text, { height = 50, showText = true } = {}) {
    text = String(text);
    const codes = [104];
    for (const ch of text) codes.push(clamp(ch.charCodeAt(0) - 32, 0, 94));
    let chk = 104; codes.slice(1).forEach((c, i) => { chk += c * (i + 1); });
    codes.push(chk % 103, 106);
    let x = 10, bars = '';
    codes.forEach((c) => { const p = C128[c]; for (let i = 0; i < p.length; i++) { const w = +p[i]; if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="${height}"/>`; x += w; } });
    const W = x + 10;
    return `<svg viewBox="0 0 ${W} ${height + (showText ? 16 : 0)}" style="width:100%;max-width:${W * 1.6}px;background:#fff"><g fill="#000">${bars}</g>${showText ? `<text x="${W / 2}" y="${height + 13}" text-anchor="middle" style="font:11px monospace;fill:#000">${esc(text)}</text>` : ''}</svg>`;
  }

  // ---------- QR benzeri desen (dekoratif, sayfa linkini metinle de gösterir) ----------
  function qrSvg(text, size = 140) {
    let h = 2166136261;
    for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const N = 25, cell = size / N; let rects = '';
    const finder = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let on;
      if (finder(x, y)) { const fx = x >= N - 7 ? x - (N - 7) : x, fy = y >= N - 7 ? y - (N - 7) : y; on = fx === 0 || fy === 0 || fx === 6 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
      else { h ^= x * 31 + y * 17; h = Math.imul(h, 16777619); on = ((h >>> 13) & 1) === 1; }
      if (on) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell + .3}" height="${cell + .3}"/>`;
    }
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#fff;padding:6px;border-radius:8px"><g fill="#000">${rects}</g></svg>`;
  }

  // ---------- Uygulama iskeleti ----------
  // opts: {id, name, tagline, icon, accent, nav:[{id,label,icon,sec,roles}], routes:{id:(el,param,app)=>{}}, db, auth:{roles:{rol:'Etiket'}}, topActions:(app)=>html, home:'dashboard', productId}
  // Analitik: yalnızca geçerli denemedeki işletmenin hangi bölümü açtığı sayılır (sunucu kimliği ve lisansı yeniden doğrular). Veri değil, bölüm adı gider. Ayrıntı: docs/LOG-YAPISI.md
  const modulSon = {};
  const modulSay = (m) => {
    if (!CLOUD || !CLOUD.user || !IS_APP_PAGE || !CLOUD.analitik || !(CLOUD.licenses || []).some((l) => l.product === APP_ID && l.status === 'deneme' && l.valid)) return;
    try { if (/"k":"red"/.test(localStorage.getItem('nebsoft:riza') || '')) return; } catch (e) { /* yok */ }
    if (Date.now() - (modulSon[m] || 0) < 60e3) return; modulSon[m] = Date.now();
    fetch('/api/olay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ tur: 'modul', program: APP_ID, modul: String(m).toLowerCase().slice(0, 40) }) }).catch(() => {});
  };
  function shell(opts) {
    const app = { opts, db: opts.db, route: null, param: null };
    NS.app = app;
    // Entegrasyon merkezi yüklüyse her ürüne yönetici menüsü olarak eklenir
    if (NS.integ && !opts.routes.entegrasyonlar) {
      opts.nav = [...opts.nav, { id: 'entegrasyonlar', label: 'Entegrasyonlar', icon: 'zap', roles: ['admin'] }];
      opts.routes.entegrasyonlar = (el, p, a) => NS.integ.page(el, a, opts.integrations);
    }
    // e-Fatura kullanan ürünlere ortak e-Belgeler (giden / gelen kutusu) sayfası
    if (NS.ebelge && (opts.integrations || []).includes('efatura') && !opts.routes.ebelge) {
      const k = opts.nav.findIndex((n) => n.id === 'entegrasyonlar');
      opts.nav.splice(k, 0, { id: 'ebelge', label: 'e-Belgeler', icon: 'file', roles: opts.ebelgeRoles || ['admin'] });
      opts.routes.ebelge = (el, p, a) => NS.ebelge.page(el, p, a);
    }
    if (opts.accent) {
      document.documentElement.style.setProperty('--app-accent', opts.accent);
      document.documentElement.style.setProperty('--app-accent-soft', `color-mix(in srgb, ${opts.accent} 11%, #fff)`);
      document.documentElement.style.setProperty('--app-accent-soft-dark', `color-mix(in srgb, ${opts.accent} 22%, #171a27)`);
    }
    document.title = `${opts.name} · NEBSOFT`;
    setFavicon(opts.accent);
    const SESSION = 'nebsoft:session:' + opts.id;
    // Bulutta tek kullanıcılı işletme doğrudan açılır. Birden çok kullanıcı varsa veya çıkış yapıldıysa PIN sorulur: paylaşılan cihazda sekmeyi yeniden açmak yönetici yetkisi vermez.
    const KILIT = 'nebsoft:kilit:' + opts.id;
    const kilitli = () => { try { return !!localStorage.getItem(KILIT); } catch (e) { return false; } };
    const pinGerekli = () => kilitli() || app.db.all('users', (u) => u.active !== false).length > 1;

    const currentUser = () => {
      if (!opts.auth) return null;
      // Sunucu rolü: kimlik hesaptan gelir, PIN ekranı ve rol değiştirme yok
      if (app.db && app.db.serverRole) { const k = app.db.serverKisi || {}; return { id: (!k.alan && k.id) || CLOUD.user.id, name: k.ad || CLOUD.user.name, role: app.db.serverRole, dept: app.db.serverDept || '', ...(k.alan ? { [k.alan]: k.id } : {}) }; } // k: hesabın programdaki kişisi (temsilci, plasiyer, öğretmen)
      let id = null;
      try { id = sessionStorage.getItem(SESSION); } catch (e) { /* yok */ }
      // Pazar yerindeki "canlı demo" linkleri ?demo=1 ile yönetici olarak açılır
      if (!id && (/[?&]demo=1/.test(location.search) || (CLOUD && app.db.cloud && !pinGerekli()))) {
        const admin = app.db.find('users', (u) => u.role === 'admin' && u.active !== false);
        if (admin) { id = admin.id; try { sessionStorage.setItem(SESSION, id); } catch (e) { /* yok */ } }
      }
      const u = id ? app.db.get('users', id) : null;
      if (u && u.active === false) { try { sessionStorage.removeItem(SESSION); } catch (e) { /* yok */ } return null; }
      return u || null;
    };
    app.user = () => NS.currentUser;
    app.navLocked = (id) => id === 'ayarlar' || id === (opts.home || (opts.nav.find((n) => n.id) || {}).id);
    app.navVisible = (n) => !n.id || app.navLocked(n.id) || !((app.db.settings().hiddenNav || []).includes(n.id));
    app.relayout = () => { layout(); render(); };
    app.can = (...roles) => !opts.auth || !NS.currentUser || roles.includes(NS.currentUser.role) || NS.currentUser.role === 'admin';

    // Aynı adrese yönlendirmede hashchange tetiklenmez; sayfa yine de yenilenir
    app.go = (route, param) => { const h = '#/' + route + (param ? '/' + encodeURIComponent(param) : ''); if (location.hash === h) render(); else location.hash = h; };
    app.refresh = () => render();
    app.logout = () => { try { sessionStorage.removeItem(SESSION); if (app.db.cloud) localStorage.setItem(KILIT, '1'); } catch (e) { /* yok */ } NS.currentUser = null; boot(); };

    function loginScreen() {
      const users = app.db.all('users', (u) => u.active !== false);
      const A = NS.auth; const role = (u) => (opts.auth.roles || {})[u.role] || u.role;
      let last = null; try { last = localStorage.getItem('nebsoft:lastUser:' + opts.id); } catch (e) { /* yok */ }
      let sel = (users.find((u) => u.id === last) || users[0] || {}).id;
      const back = /[?&]demo=1/.test(location.search) ? `<a href="${opts.backUrl || '../../index.html'}">${icon('back')} Pazar yerine dön</a>` : `<a href="${CLOUD ? '/' : opts.backUrl || '../../index.html'}#/programlarim">${icon('grid')} Programlarım</a>`;
      document.body.innerHTML = `<div class="ax pin" style="--ax-acc:${esc(opts.accent || '#6366f1')}">${A ? A.scene('pin', opts.accent) : ''}<div class="ax-lock">
        <div class="ax-lock-top">${logoMark(opts.accent, 42)}<div class="grow"><b>${esc(opts.name)}</b><small><span class="wm" style="font-size:10px"><b style="color:#fff">NEB</b><i style="color:var(--ax-acc)">SOFT</i></span> · Personel girişi</small></div><div class="ax-clock"><b id="axc"></b><small id="axd"></small></div></div>
        <div class="ax-lock-mid"><div class="ax-users" role="listbox" aria-label="Kullanıcı seçin">${users.map((u) => `<button class="ax-user${u.id === sel ? ' on' : ''}" role="option" aria-selected="${u.id === sel}" data-u="${u.id}"><span class="av">${esc(initials(u.name))}</span><span>${esc(u.name)}</span><small>${esc(role(u))}</small></button>`).join('')}</div>
          <div class="ax-pinbox"><div class="who" id="axw"></div><div class="ax-dots" id="pd">${'<i></i>'.repeat(4)}</div>
            <div class="ax-pad">${[[1, ''], [2, 'ABC'], [3, 'DEF'], [4, 'GHI'], [5, 'JKL'], [6, 'MNO'], [7, 'PRS'], [8, 'TUV'], [9, 'YZ'], ['C', ''], [0, ''], ['⌫', '']].map(([k, sub]) => `<button data-k="${k}" class="${['C', '⌫'].includes(k) ? 'fn' : ''}" aria-label="${k === 'C' ? 'Temizle' : k === '⌫' ? 'Sil' : k}">${k === '⌫' ? icon('back') : k === 'C' ? 'Temizle' : `${k}${sub ? `<small>${sub}</small>` : ''}`}</button>`).join('')}</div></div></div>
        <div class="ax-lock-foot">${back}<span>${/[?&]demo=1/.test(location.search) || !CLOUD ? 'Demo PIN: <b style="color:#fff">1234</b> · ' : ''}Klavyeden de yazabilirsiniz${app.db.cloud && app.db.hesapSahibi ? ' · <a href="#" id="axf">PIN\'imi unuttum</a>' : ''}</span></div></div></div>`;
      if (A) A.bind(document.body);
      const tick = () => { const c = document.getElementById('axc'); if (!c) return clearInterval(clk); const d = new Date(); c.textContent = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); document.getElementById('axd').textContent = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }); };
      const clk = setInterval(tick, 1000); tick();
      const who = () => { const u = app.db.get('users', sel); $('#axw').innerHTML = u ? `${esc(u.name)} <small>· ${esc(role(u))}</small>` : ''; };
      who();
      let pin = ''; let lock = false;
      const dots = () => $$('#pd i').forEach((d, i) => d.classList.toggle('on', i < pin.length));
      const press = async (k) => {
        if (lock) return;
        const btn = document.querySelector(`[data-k="${k}"]`); if (btn) { btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 120); }
        if (k === 'C') pin = ''; else if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
        dots();
        if (pin.length === 4) {
          const u = app.db.get('users', sel); lock = true;
          let oldu = null; let hata = ''; try { oldu = u ? await pinKontrol(app.db, pin, { uid: u.id }) : null; } catch (x) { hata = x.message; }
          if (oldu) {
            $('#pd').classList.add('ok');
            try { sessionStorage.setItem(SESSION, u.id); localStorage.setItem('nebsoft:lastUser:' + opts.id, u.id); localStorage.removeItem(KILIT); } catch (e) { /* yok */ }
            setTimeout(() => { clearInterval(clk); document.onkeydown = null; boot(); if (NS.pwa && NS.pwa.offer) setTimeout(() => NS.pwa.offer(), 1800); }, 420);
          } else {
            $('#pd').classList.add('bad'); if (A) A.shake($('.ax-pinbox')); if (hata) toast(hata, 'err');
            if (NS.audit && !hata) NS.audit({ action: 'Hatalı PIN denemesi', detail: u ? u.name : '', user: u ? u.name : '', type: 'oturum', level: 'uyari' });
            setTimeout(() => { pin = ''; lock = false; $('#pd').classList.remove('bad'); dots(); }, 520);
          }
        }
      };
      $$('[data-k]').forEach((b) => { b.onclick = () => press(b.dataset.k); });
      $$('[data-u]').forEach((b) => { b.onclick = () => { sel = b.dataset.u; pin = ''; dots(); $$('[data-u]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); who(); }; });
      const unuttum = $('#axf'); if (unuttum) unuttum.onclick = async (e) => {
        e.preventDefault();
        const v = await formModal({ title: 'Yönetici PIN\'ini sıfırla', fields: [{ type: 'section', label: 'Hesabınıza giriş yaptığınız şifreyi yazın, yeni PIN belirleyin.' }, { name: 'pass', label: 'Hesap şifreniz', type: 'password', required: true, full: true }, { name: 'pin', label: 'Yeni PIN (4 hane)', type: 'password', required: true, full: true }], submitLabel: 'PIN\'i değiştir' }); if (!v) return;
        if (!/^\d{4}$/.test(String(v.pin).trim())) return toast('PIN 4 haneli rakam olmalı', 'err');
        try {
          const r = await api('POST', `/api/data/${app.db.name}/pin-sifirla`, { pass: v.pass, pin: String(v.pin).trim(), uid: sel });
          try { sessionStorage.setItem(SESSION, r.user.id); localStorage.setItem('nebsoft:lastUser:' + opts.id, r.user.id); localStorage.removeItem(KILIT); } catch (x) { /* yok */ }
          location.reload();
        } catch (x) { toast(x.message, 'err'); }
      };
      document.onkeydown = (e) => { if (document.querySelector('.ns-modal')) return; if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Escape') press('C'); };
    }

    function layout() {
      const u = NS.currentUser;
      // Menü: başlık → tıklayınca açılan alt menü; aktif sayfanın grubu her zaman açık, diğerlerinin durumu hatırlanır
      const items = opts.nav.filter((n) => (!n.roles || app.can(...n.roles)) && app.navVisible(n));
      const groups = []; let cur = { sec: null, items: [] }; items.forEach((n) => { if (n.sec) { if (cur.items.length || cur.sec) groups.push(cur); cur = { sec: n.sec, items: [] }; } else cur.items.push(n); }); groups.push(cur);
      const navKey = 'nebsoft:navclosed:' + opts.id; let closed = []; try { closed = JSON.parse(localStorage.getItem(navKey)) || []; } catch (e) { closed = []; }
      const link = (n) => `<a href="#/${n.id}" data-nav="${n.id}" title="${esc(n.label)}">${icon(n.icon || 'grid')}<span>${esc(n.label)}</span>${n.badge ? `<span class="badge acc" style="margin-left:auto" data-badge="${n.id}"></span>` : ''}</a>`;
      const navHtml = groups.filter((g) => g.items.length).map((g, gi) => (!g.sec ? `<div class="nv-grp-b open">${g.items.map(link).join('')}</div>`
        : `<div class="nv-grp${closed.includes(g.sec) ? '' : ' open'}" data-grp="${esc(g.sec)}"><button class="nv-grp-h" type="button" data-grp-t aria-expanded="${!closed.includes(g.sec)}"><span>${esc(g.sec)}</span><svg class="ico nv-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="nv-grp-b">${g.items.map(link).join('')}</div></div>`)).join('');
      document.body.innerHTML = `
        ${app.db && app.db.cloud ? (app.db.data._meta.sample && !app.db.serverRole ? `<div class="ns-demo-bar">${icon('info')} <span>Örnek verilerle başladınız — ürünü tanıyınca örnekleri temizleyip kendi verilerinizi girin.${app.db.ilkPin ? ` Yönetici PIN'iniz: <b>${esc(app.db.ilkPin)}</b>. Bu bilgi bir kez gösterilir, Ayarlar › Kullanıcılar'dan değiştirebilirsiniz.` : ''}</span> <a href="#" data-clear>Örnek verileri temizle</a> · <a href="/#/hesabim" target="_top">Hesabım</a></div>` : '') : opts.demo !== false ? `<div class="ns-demo-bar">${icon('sparkles')} <span>Canlı demo: veriler yalnızca bu tarayıcıda saklanır.</span> <a href="#" data-reset>Demoyu sıfırla</a> · <a href="${opts.backUrl || '../../index.html'}#/urun/${opts.id}" target="_top">Satın al</a></div>` : ''}
        <div class="ns-app">
          <aside class="ns-side" id="side">
            <div class="ns-brand"><a class="nv-brand-mark" href="#/" title="${esc(opts.name)}">${logoMark(opts.accent, 30)}</a><div class="nv-brand-t"><b>${esc(opts.name)}</b><small><span class="wm"><b>NEB</b><i>SOFT</i></span>${opts.tagline ? ` · ${esc(opts.tagline)}` : ''}</small></div><button class="nv-mini-btn" type="button" data-mini title="Menüyü daralt / genişlet" aria-label="Menüyü daralt"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg></button></div>
            <nav class="ns-nav">${navHtml}</nav>
            <div class="ns-side-foot">
              ${/[?&]demo=1/.test(location.search) ? `<a class="btn ghost block" style="justify-content:flex-start" href="${opts.backUrl || '../../index.html'}" target="_top">${icon('store')} NEBSOFT Pazar</a>`
                : `<a class="btn ghost block" style="justify-content:flex-start" href="${CLOUD ? '/' : opts.backUrl || '../../index.html'}#/programlarim" target="_top">${icon('grid')} Programlarım</a><a class="btn ghost block" style="justify-content:flex-start" href="${CLOUD ? '/' : opts.backUrl || '../../index.html'}#/hesabim" target="_top">${icon('user')} Hesabım</a>`}
            </div>
          </aside>
          <main class="ns-main">
            <header class="ns-top">
              <button class="btn ghost icon ns-burger" data-burger title="Menüyü daralt / genişlet" aria-label="Menüyü daralt / genişlet">${icon('menu')}</button>
              <div class="title" id="ttl"></div><button class="btn ghost icon sm" id="nshelp" title="Bu ekran ne işe yarar?" hidden>?</button>
              <div class="row nw" id="topact"></div>
              <button class="btn ghost icon" data-undo title="Geri al (Ctrl+Z)" hidden>${icon('back')}</button>
              <button class="btn ghost ns-cmdk-btn" data-cmdk title="Hızlı menü (Ctrl+K)">${icon('search')}<span class="small faint">Ara · Ctrl K</span></button>
              <button class="btn ghost icon nv-bell" data-bell title="Bildirimler" aria-label="Bildirimler">${icon('bell')}<span class="cnt hide" id="nvb"></span></button>
              <button class="btn ghost icon" data-theme title="Tema" data-theme-ico>${icon(getTheme() === 'dark' ? 'sun' : 'moon')}</button>
              ${u ? `<div class="ns-user" data-user><div class="avatar">${esc(initials(u.name))}</div><div class="name small"><b>${esc(u.name)}</b><div class="faint" style="font-size:11px">${esc((opts.auth.roles || {})[u.role] || u.role)}</div></div></div>` : ''}
            </header>
            <section class="ns-content" id="view"></section>
          </main>
          <nav class="nv-tabbar" id="nvtab" aria-label="Hızlı menü"></nav>
        </div>`;
      if (app._bound) return;
      app._bound = true;
      on(document.body, 'click', '[data-theme]', toggleTheme);
      // Menü düğmesi: telefonda menüyü açar/kapatır; masaüstünde kenar çubuğunu simgelere küçültür / büyütür (tercih hatırlanır)
      const toggleMini = () => { const on2 = !document.documentElement.classList.contains('nv-mini'); document.documentElement.classList.toggle('nv-mini', on2); try { localStorage.setItem('nebsoft:navmini', on2 ? '1' : ''); } catch (x) { /* yok */ } $$('[data-burger]').forEach((b) => { b.setAttribute('aria-expanded', String(!on2)); b.title = on2 ? 'Menüyü genişlet' : 'Menüyü daralt'; }); };
      on(document.body, 'click', '[data-burger]', () => (matchMedia('(min-width: 901px)').matches ? toggleMini() : $('#side').classList.toggle('open')));
      on(document.body, 'click', '[data-grp-t]', (e, b) => { const g = b.closest('.nv-grp'); const open = !g.classList.contains('open'); g.classList.toggle('open', open); b.setAttribute('aria-expanded', open); const k = 'nebsoft:navclosed:' + opts.id; let c = []; try { c = JSON.parse(localStorage.getItem(k)) || []; } catch (x) { c = []; } c = open ? c.filter((s) => s !== g.dataset.grp) : [...new Set([...c, g.dataset.grp])]; try { localStorage.setItem(k, JSON.stringify(c)); } catch (x) { /* yok */ } });
      on(document.body, 'click', '[data-mini]', toggleMini);
      on(document.body, 'click', '.ns-nav a', () => $('#side').classList.remove('open'));
      on(document.body, 'click', '[data-clear]', async (e) => {
        e.preventDefault();
        if (await confirm('Örnek kayıtlar (satışlar, müşteriler, ürünler vb.) silinecek; ayarlarınız ve kullanıcılarınız kalacak. Bu işlem geri alınamaz. Devam edilsin mi?')) { app.db.reset(); toast('Örnek veriler temizlendi — kendi kayıtlarınızı girebilirsiniz', 'ok'); layout(); render(); }
      });
      on(document.body, 'click', '[data-reset]', async (e) => {
        e.preventDefault();
        if (await confirm('Tüm demo verileri silinip başlangıç verileri yeniden yüklenecek. Devam edilsin mi?')) { app.db.reset(); toast('Demo sıfırlandı', 'ok'); app.go(opts.home || opts.nav.find((n) => n.id).id); render(); }
      });
      on(document.body, 'click', '[data-user]', () => {
        modal({
          title: 'Oturum', body: `<div class="row nw"><div class="avatar lg">${esc(initials(u.name))}</div><div><b>${esc(u.name)}</b><div class="muted small">${esc((opts.auth.roles || {})[u.role] || u.role)}</div></div></div>`,
          actions: [{ label: 'Kapat' }, ...(app.db && app.db.serverRole ? [] : [{ label: 'Çıkış yap', cls: 'danger', icon: 'logout', onClick: (c) => { c(); app.logout(); } }])],
        });
      });
      kurulumYukle(app);
    }

    function render() {
      const [, r, p] = (location.hash.match(/^#\/([^/]+)\/?(.*)$/) || []);
      const home = opts.home || opts.nav.find((n) => n.id).id;
      const route = opts.routes[r] ? r : home;
      app.route = route; app.param = p ? decodeURIComponent(p) : null; modulSay(route);
      const nav = opts.nav.find((n) => n.id === route);
      if (nav && !app.navVisible(nav)) { $('#view').innerHTML = `<div class="empty">${icon('eye')}<div>Bu bölüm menüden gizlendi. Açmak için Ayarlar &gt; Menü ve modüller.</div></div>`; return; }
      if (nav && nav.roles && !app.can(...nav.roles) && route === home) { const alt = opts.nav.find((n) => n.id && (!n.roles || app.can(...n.roles)) && app.navVisible(n)); if (alt) return app.go(alt.id); }
      if (nav && nav.roles && !app.can(...nav.roles)) { $('#view').innerHTML = `<div class="empty">${icon('lock')}<div>Bu bölüme erişim yetkiniz yok.</div></div>`; return; }
      $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route));
      { const act = document.querySelector(`[data-nav="${route}"]`); const g = act && act.closest('.nv-grp'); if (g && !g.classList.contains('open')) { g.classList.add('open'); const t = g.querySelector('[data-grp-t]'); if (t) t.setAttribute('aria-expanded', 'true'); } }
      // Telefonda alt çubuk: yetkili ilk 4 bölüm + menü
      const tb = $('#nvtab'); if (tb) { const items = opts.nav.filter((n) => n.id && (!n.roles || app.can(...n.roles)) && app.navVisible(n)).slice(0, 4); tb.innerHTML = items.map((n) => `<a href="#/${n.id}" class="${n.id === route ? 'active' : ''}">${icon(n.icon || 'grid')}<span>${esc(n.label)}</span></a>`).join('') + `<a href="#" data-burger onclick="return false">${icon('menu')}<span>Menü</span></a>`; }
      $('#ttl').textContent = nav ? nav.label : (opts.titles && opts.titles[route]) || opts.name;
      { const hb = $('#nshelp'); const h = opts.help && opts.help[route]; if (hb) { hb.hidden = !h; hb.onclick = () => h && modal({ title: h.title || (nav ? nav.label : opts.name), body: `<div class="col" style="gap:10px">${(Array.isArray(h.text) ? h.text : [h.text]).map((x) => `<p>${x}</p>`).join('')}</div>`, actions: [{ label: 'Tamam', cls: 'primary' }] }); } }
      $('#topact').innerHTML = opts.topActions ? opts.topActions(app) : '';
      const view = $('#view');
      const fresh = view.cloneNode(false);
      view.replaceWith(fresh);
      opts.routes[route](fresh, app.param, app);
      if (opts.badges) Object.entries(opts.badges(app)).forEach(([k, v]) => { const b = $(`[data-badge="${k}"]`); if (b) { b.textContent = v; b.classList.toggle('hide', !v); } });
      window.scrollTo(0, 0);
    }

    function boot() {
      document.onkeydown = null;
      NS.currentUser = currentUser();
      if (opts.auth && !NS.currentUser) return loginScreen();
      layout();
      if (opts.onKey && !app._keyBound) { app._keyBound = true; document.addEventListener('keydown', (e) => { if ($('#view')) opts.onKey(e, app); }); }
      render();
    }
    window.addEventListener('hashchange', () => { if ($('#view')) render(); });
    app.boot = boot;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
    return app;
  }

  // Ürün içi SMS kaydı + entegrasyon merkezinden gerçek gönderim (sağlayıcı Entegrasyonlar > SMS'ten seçilir)
  // SMS kaydı + gönderim. Kaydı hemen döndürür (eski kullanım); gerçek sonuç r.result sözündedir:
  //   const r = NS.smsLog(db, {...}); const res = await r.result; toast(NS.smsText(res), NS.smsTone(res));
  // Simülasyon kaydı "TEST — gönderilmedi" yazar (sahte başarı yok). result kayda yazılmaz (enumerable değil).
  const SMS_TEST = 'TEST — gönderilmedi';
  function smsLog(db, rec, silent) {
    const r = db.insert('sms', { ...rec, status: 'gönderiliyor' }, silent);
    const go = NS.integ && NS.integ.sms ? Promise.resolve().then(() => NS.integ.sms(rec.to, rec.text, { silent: true })).catch((e) => ({ ok: false, error: e.message })) : Promise.resolve({ ok: false, simulated: true });
    const result = go.then((res) => { r.status = res.simulated ? SMS_TEST : res.ok ? 'gönderildi' : 'hata: ' + String(res.error || '').slice(0, 60); db.save(); return { ...res, ok: !!res.ok && !res.simulated, rec: r }; });
    Object.defineProperty(r, 'result', { value: result, enumerable: false, configurable: true });
    return r;
  }
  // Sonuç metni / tonu: gönderildi (ok) · TEST (uyarı) · hata
  const smsText = (res, what = 'SMS') => (!res ? `${what} sonucu alınamadı` : res.simulated ? `${what} TEST — gönderilmedi (Entegrasyonlar > SMS’ten sağlayıcı bağlayın)` : res.ok ? `${what} gönderildi` : `${what} gönderilemedi${res.error ? ': ' + String(res.error).slice(0, 80) : ''}`);
  const smsTone = (res) => (res && res.ok && !res.simulated ? 'ok' : res && res.simulated ? 'warn' : 'err');
  // Toplu SMS: hepsi gönderilir, sonuçlar beklenip tek özet bildirim gösterilir ("3 gönderildi · 2 TEST — gönderilmedi · 1 hata")
  function smsBatch(db, recs, what = 'mesaj') {
    const rs = recs.filter((r) => r && r.to).map((r) => smsLog(db, r, true));
    return Promise.all(rs.map((r) => r.result)).then((list) => { const n = { ok: 0, test: 0, err: 0 }; list.forEach((x) => { if (x.simulated) n.test++; else if (x.ok) n.ok++; else n.err++; });
      toast([n.ok && `${n.ok} ${what} gönderildi`, n.test && `${n.test} ${what} TEST — gönderilmedi (SMS sağlayıcısı bağlı değil)`, n.err && `${n.err} ${what} gönderilemedi`].filter(Boolean).join(' · ') || 'Gönderilecek mesaj yok (telefon yok)', n.err ? 'err' : n.test ? 'warn' : n.ok ? 'ok' : ''); return n; });
  }

  // Sayfa başlığı yardımcısı
  const pageHead = (title, sub = '', actions = '') => `<div class="page-h"><div class="grow"><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
  const kpi = (label, value, ic = 'chart', tone = '', extra = '') => `<div class="card kpi"><div class="ic ${tone}">${icon(ic)}</div><div class="grow"><div class="v">${value}</div><div class="l">${esc(label)}</div>${extra}</div></div>`;
  const badge = (text, tone = '') => `<span class="badge ${tone}">${esc(text)}</span>`;
  const searchBox = (id, ph = 'Ara...', value = '') => `<div class="search grow" style="max-width:340px">${icon('search')}<input class="input" id="${id}" placeholder="${esc(ph)}" value="${esc(value)}"></div>`;

  // Standart CRUD sayfası: liste + arama + ekle/düzenle/sil
  function crud(el, app, cfg) {
    // cfg: {col, title, sub, fields, columns, searchFields:(r)=>[..], defaults, extraActions, onSave, filters, emptyIcon, canAdd, rowsFilter, sort, mobileCard, exportRoles}
    const canExport = !cfg.exportRoles || !app.can || app.can(...cfg.exportRoles); // toplu dışa aktarma rol ile sınırlanabilir (sağlık verisi)
    // Kancalar: beforeSave(v, rec) → false ya da metin dönerse kaydedilmez (metin uyarı olarak gösterilir; async olabilir)
    //          canDelete(rec) / beforeDelete(rec) → false ya da metin dönerse silinmez (bağlı kaydı olan ana kayıt silinmesin); null → sessizce durur
    let q = '';
    let filter = cfg.filters ? cfg.filters[0].value : null;
    const draw = () => {
      let rows = app.db.all(cfg.col);
      if (cfg.rowsFilter) rows = rows.filter(cfg.rowsFilter);
      if (filter !== null && cfg.filters) { const f = cfg.filters.find((x) => x.value === filter); if (f && f.test) rows = rows.filter(f.test); }
      if (q) rows = rows.filter((r) => match(q, ...(cfg.searchFields ? cfg.searchFields(r) : Object.values(r))));
      rows.sort(cfg.sort || ((a, b) => String(b.created).localeCompare(String(a.created))));
      $('#tbl', el).innerHTML = table({
        columns: cfg.columns, rows, emptyIcon: cfg.emptyIcon,
        actions: [...(cfg.extraActions || []), ...(cfg.readonly ? [] : [{ icon: 'edit', act: 'edit', title: 'Düzenle' }, { icon: 'trash', act: 'del', title: 'Sil', cls: '' }])],
        foot: `${rows.length} kayıt`, mobileCard: cfg.mobileCard,
      });
    };
    el.innerHTML = pageHead(cfg.title, cfg.sub || '', `
      ${canExport ? `<button class="btn" data-export>${icon('download')} Excel (CSV)</button>` : ''}
      ${cfg.readonly || cfg.canAdd === false ? '' : `<button class="btn primary" data-add>${icon('plus')} ${esc(cfg.addLabel || 'Yeni Kayıt')}</button>`}`) +
      `<div class="card"><div class="card-h">${searchBox('q', 'Ara...')}${cfg.filters ? `<div class="seg" id="flt">${cfg.filters.map((f) => `<button data-f="${f.value}" class="${f.value === filter ? 'active' : ''}">${esc(f.label)}</button>`).join('')}</div>` : ''}</div><div id="tbl"></div></div>`;
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, t) => { filter = t.dataset.f; $$('[data-f]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    const edit = async (rec) => {
      const fields = typeof cfg.fields === 'function' ? cfg.fields(rec) : cfg.fields;
      const v = await formModal({ title: rec ? `${cfg.single || 'Kayıt'} Düzenle` : `Yeni ${cfg.single || 'Kayıt'}`, fields, values: rec ? (cfg.toForm ? cfg.toForm(rec) : rec) : (typeof cfg.defaults === 'function' ? cfg.defaults() : cfg.defaults) || {}, size: fields.length > 8 ? 'wide' : '', onOpen: cfg.formOpen });
      if (!v) return;
      if (cfg.beforeSave) { const ok = await cfg.beforeSave(v, rec); if (ok === false || typeof ok === 'string') { if (typeof ok === 'string') toast(ok, 'err'); return; } }
      if (rec) app.db.update(cfg.col, rec.id, v); else app.db.insert(cfg.col, v);
      cfg.onSave && cfg.onSave(v, rec);
      toast('Kaydedildi', 'ok');
      draw();
    };
    $('[data-add]', el) && ($('[data-add]', el).onclick = () => edit(null));
    $('[data-export]', el) && ($('[data-export]', el).onclick = () => { csv(cfg.col, app.db.all(cfg.col), cfg.columns.filter((c) => c.key).map((c) => ({ key: c.key, label: c.label, value: c.csv }))); app.db.log('Dışa aktarıldı', `${cfg.title} · ${app.db.all(cfg.col).length} kayıt`); app.db.save(); });
    on(el, 'click', '[data-act]', async (e, t) => {
      const rec = app.db.get(cfg.col, t.dataset.id);
      if (t.dataset.act === 'edit') edit(rec);
      else if (t.dataset.act === 'del') {
        for (const hook of [cfg.canDelete, cfg.beforeDelete]) { if (!hook) continue; const ok = await hook(rec); if (ok === null) return; if (ok === false || typeof ok === 'string') return toast(typeof ok === 'string' ? ok : 'Bu kayıt silinemez — bağlı kayıtları var', 'err'); }
        if (await confirm('Bu kayıt silinsin mi?')) { app.db.remove(cfg.col, rec.id); app.db.log('Kayıt silindi', `${cfg.single || cfg.title} · ${rec.no || rec.id}`); app.db.save(); toast('Silindi'); draw(); }
      }
      else if (cfg.onAction) cfg.onAction(t.dataset.act, rec, draw);
    });
    draw();
    return { draw };
  }

  // Ortak ayarlar sayfası (işletme bilgileri + kullanıcılar + yedekleme)
  function settingsPage(el, app, { fields = [], defaults = {}, roles, extra = '' } = {}) {
    const s = app.db.settings(defaults);
    const sunucuRolu = !!app.db.serverRole; if (sunucuRolu) roles = null; // rolü olan hesap kullanıcı yönetmez, veri yüklemez; sunucu bu yazmaları zaten yok sayar
    const base = [
      { name: 'bizName', label: 'İşletme adı', required: true },
      { name: 'bizPhone', label: 'Telefon' },
      { name: 'bizAddress', label: 'Adres (cadde, sokak, no)', full: true },
      { name: 'bizDistrict', label: 'İlçe' },
      { name: 'bizCity', label: 'İl' },
      { name: 'taxNo', label: 'Vergi no' },
      { name: 'taxOffice', label: 'Vergi dairesi' },
      ...fields,
    ];
    el.innerHTML = pageHead('Ayarlar', 'İşletme bilgileri, kullanıcılar ve veri yönetimi') + `
      <div class="grid g-21">
        <div class="col" style="gap:16px">
          <div class="card"><div class="card-h"><h3>İşletme Bilgileri</h3></div><div class="card-b" id="sf">${fieldsHtml(base, s)}<div class="row mt"><button class="btn primary" id="ss">${icon('check')} Kaydet</button></div></div></div>
          ${roles ? `<div class="card"><div class="card-h"><h3>Kullanıcılar ve Yetkiler</h3><button class="btn sm primary" id="ua">${icon('plus')} Kullanıcı</button></div><div id="ul"></div></div>` : ''}
          ${extra}
        </div>
        <div class="col" style="gap:16px">
          ${app.can('admin') && app.navVisible ? `<div class="card"><div class="card-h"><h3>${icon('grid')} Menü ve modüller</h3></div><div class="card-b"><p class="small muted mb">Kullanmadığınız bölümleri menüden gizleyin; veriler silinmez, istediğiniz zaman geri açabilirsiniz. Tüm kullanıcılar için geçerlidir.</p><div class="col" id="navh" style="gap:6px">${app.opts.nav.filter((n) => n.id && !app.navLocked(n.id)).map((n) => `<label class="row"><input type="checkbox" data-nv="${esc(n.id)}" ${app.navVisible(n) ? 'checked' : ''}> ${icon(n.icon || 'grid')} <span>${esc(n.label)}</span></label>`).join('')}</div></div></div>` : ''}
          ${app.can('admin') && NS.sablon ? `<div class="card"><div class="card-h"><h3>${icon('file')} Hazır şablonlar</h3></div><div class="card-b"><p class="small muted mb">Sektörünüze özel menü, hizmet, form ve temaları önizleyip tek tıkla ekleyin. Eski kayıtlarınız değişmez.</p><a class="btn" href="#/sablonlar">${icon('eye')} Şablonları aç</a></div></div>` : ''}
          <div class="card"><div class="card-h"><h3>${icon('sparkles')} Görünüm ve tema</h3></div><div class="card-b"><p class="small muted mb">Seçtiğiniz tema bu cihazda kaydedilir ve program her açıldığında otomatik yüklenir.</p>${themeCards()}</div></div>
          <div class="card"><div class="card-h"><h3>Veri Yönetimi</h3></div><div class="card-b col">
            <p class="small muted">Tüm verilerinizi JSON olarak yedekleyin veya yedekten geri yükleyin.</p>
            <button class="btn" id="bk">${icon('download')} Yedek al</button>
            ${sunucuRolu ? '' : `<button class="btn" id="rs">${icon('upload')} Yedekten yükle</button>
            <button class="btn danger" id="rz">${icon('refresh')} Demoyu sıfırla</button>`}
          </div></div>
          <div class="card"><div class="card-h"><h3>İşlem Geçmişi</h3></div><div class="card-b" style="max-height:360px;overflow:auto">${(app.db.all('_log').slice(0, 40).map((l) => `<div class="list-item small"><div class="grow"><b>${esc(l.action)}</b> <span class="muted">${esc(l.detail || '')}</span><div class="faint">${esc(l.user)} · ${ago(l.at)}</div></div></div>`).join('')) || '<div class="faint small">Henüz kayıt yok</div>'}</div></div>
        </div>
      </div>`;
    $('#ss', el).onclick = () => { if (!validate($('#sf', el))) return; app.db.saveSettings(readForm($('#sf', el), base)); toast('Ayarlar kaydedildi', 'ok'); };
    $$('[data-nv]', el).forEach((x) => { x.onchange = () => { const h = $$('[data-nv]', el).filter((y) => !y.checked).map((y) => y.dataset.nv); app.db.saveSettings({ hiddenNav: h }); toast(x.checked ? 'Bölüm menüye eklendi' : 'Bölüm menüden gizlendi', 'ok'); if (app.relayout) app.relayout(); }; });
    $('#bk', el).onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(app.db.data, null, 1)], { type: 'application/json' }));
      a.download = `${app.opts.id}-yedek-${today()}.json`; a.click();
    };
    if (!sunucuRolu) $('#rs', el).onclick = async () => {
      const t = await readFile('.json'); if (!t) return;
      try { app.db.data = JSON.parse(t); app.db.save(); toast('Yedek yüklendi', 'ok'); app.refresh(); } catch (e) { toast('Geçersiz yedek dosyası', 'err'); }
    };
    if (!sunucuRolu) $('#rz', el).onclick = async () => { if (await confirm('Tüm veriler silinip demo verileri yüklenecek.')) { app.db.reset(); app.refresh(); } };
    if (roles) {
      const drawU = () => {
        $('#ul', el).innerHTML = table({
          columns: [{ label: 'Ad', render: (u) => `<div class="row nw"><div class="avatar">${esc(initials(u.name))}</div><b>${esc(u.name)}</b></div>` }, { label: 'Rol', render: (u) => badge(roles[u.role] || u.role, 'acc') }, { label: 'PIN', render: () => '••••' }, { label: 'Durum', render: (u) => (u.active === false ? badge('Pasif', 'err') : badge('Aktif', 'ok')) }],
          rows: app.db.all('users'), actions: [{ icon: 'edit', act: 'ue' }, { icon: 'trash', act: 'ud' }],
        });
      };
      const uf = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'role', label: 'Rol', type: 'select', options: Object.entries(roles).map(([value, label]) => ({ value, label })) }, { name: 'pin', label: 'PIN (4 hane)', required: true, type: 'password' }, { name: 'active', label: 'Aktif', type: 'checkbox', value: true }];
      // Bulutta düz PIN'i sunucu özetler; sunucusuz kurulumda özet burada alınır
      const pinHazirla = async (v) => {
        if (!v.pin) { delete v.pin; return true; } if (!/^\d{4}$/.test(String(v.pin).trim())) { toast('PIN 4 haneli rakam olmalı', 'err'); return false; }
        if (!app.db.cloud) { const h = await pinYap(String(v.pin).trim()); if (h) { v.pinH = h; v.pin = undefined; } } return true;
      };
      const ufDuzenle = uf.map((f) => (f.name === 'pin' ? { ...f, required: false, label: 'Yeni PIN (değişmeyecekse boş bırakın)' } : f));
      $('#ua', el).onclick = async () => { const v = await formModal({ title: 'Yeni Kullanıcı', fields: uf, values: { active: true } }); if (v && await pinHazirla(v)) { app.db.insert('users', v); drawU(); } };
      on(el, 'click', '[data-act=ue]', async (e, t) => { const u = app.db.get('users', t.dataset.id); const v = await formModal({ title: 'Kullanıcı', fields: ufDuzenle, values: { ...u, pin: '' } }); if (v && await pinHazirla(v)) { app.db.update('users', u.id, v); drawU(); } });
      on(el, 'click', '[data-act=ud]', async (e, t) => { if (app.db.all('users').length < 2) return toast('Son kullanıcı silinemez', 'err'); if (await confirm('Kullanıcı silinsin mi?')) { app.db.remove('users', t.dataset.id); drawU(); } });
      drawU();
    }
  }

  // ---------- Bulut API ----------
  // Aynı kaynaktaki /api isteklerine CSRF başlığı eklenir; sunucu başka sitelerden gelen istekleri reddeder.
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch && !window.__nsFetch) {
    window.__nsFetch = true;
    window.fetch = (input, init = {}) => {
      try {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href);
        if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
          const h = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
          h.set('x-ns-csrf', '1'); init = { ...init, headers: h, credentials: 'same-origin' };
        }
      } catch (e) { /* göreli olmayan adres */ }
      return nativeFetch(input, init);
    };
  }
  async function api(method, url, body) {
    let r;
    try { r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); } catch (e) { throw Object.assign(new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'), { status: 0 }); }
    let j = {}; try { j = await r.json(); } catch (e) { j = { ok: false, error: 'Sunucu yanıtı okunamadı' }; }
    if (!r.ok || j.ok === false) throw Object.assign(new Error(j.error || 'İşlem başarısız'), { status: r.status, data: j });
    return j;
  }

  window.NS = {
    api, esc, $, $$, on, uid, rand, pick, sum, groupBy, clamp, money, num, iso, today, addDays, daysBetween, date, dateLong, time, dt, ago, pad,
    MONTHS, DAYS, NAMES, phone, sampleGender, initials, logoMark, shade, setFavicon, slug, trLower, match, icon, ICONS, DB, toast, modal, confirm, prompt, formModal, fieldsHtml, readForm, validate,
    table, chart, compact, dailySeries, PALETTE, csv, readFile, parseCsv, printHtml, beep, barcodeSvg, qrSvg, shell, pageHead, kpi, badge, searchBox, crud,
    settingsPage, smsLog, smsText, smsTone, smsBatch, portalShare, approve, pinKontrol, toggleTheme, getTheme, setTheme, themeCards, THEMES, skeleton: (n = 4) => `<div class="nv-skel">${'<div class="skel" style="height:18px;width:38%"></div><div class="grid g4">' + '<div class="skel" style="height:84px"></div>'.repeat(4) + '</div>' + '<div class="skel" style="height:44px"></div>'.repeat(n)}</div>`, currentUser: null, cloud: CLOUD, merge3, pub: PUB, tenant: TENANT, payInfo, portalCode,
  };
})();

/* ===== Kullanım kolaylıkları: tüm ürünlerde otomatik çalışır =====
   - Sayı/tutar alanları: 100000 → 100.000, ondalık virgül, ₺ işareti, ok tuşlarıyla artırma
   - Uzun açılır listeler: tıklayınca / harf yazınca aramalı seçim penceresi
   - Telefon, IBAN, plaka biçimleme; TC kimlik / VKN / e-posta doğrulama
   - Formlarda Enter ile sonraki alan, Ctrl+S kaydet; tarih alanında B (bugün), + / - gün
   - Tablolarda başlığa tıklayarak sıralama; Ctrl+K hızlı menü; / ile sayfa araması; ? kısayollar */
(function () {
  'use strict';
  const NS = window.NS; if (!NS || window.__nsUx) return; window.__nsUx = true;
  const { esc, icon } = NS;
  const NATIVE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const nget = (el) => NATIVE.get.call(el);
  const nset = (el, v) => NATIVE.set.call(el, v);

  // ---------- Sayı alanları ----------
  const SKIP = /year|yil|port|baud|dpi|pin|plu|serial|imei|kod|code|gln|len$|^no$|relay|interval|^cols$|copies|feed/i;
  const MONEY = /₺|tutar|fiyat|ücret|ucret|maliyet|bedel|maaş|maas|kira\b|aidat|tahsil|ödeme|avans|bakiye|ciro|depozito|price|amount|cost|fee|salary|deposit|bütçe/i;
  const groupInt = (s) => s.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // Kullanıcı metnini sayıya çevirir: biçimli "1.234,5", yapıştırılan "1234.5" veya "1.500"
  function parseTR(t) {
    t = String(t === null || t === undefined ? '' : t).trim().replace(/₺|\s|TL$/gi, '');
    if (!t) return '';
    const neg = /^-/.test(t);
    t = t.replace(/[^0-9.,]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, '');
    if (t === '' || t === '.') return '';
    const n = Number(t);
    return isNaN(n) ? '' : String(neg ? -n : n);
  }
  const decOf = (el) => { if (el._money) return 2; const s = el.getAttribute('step'); if (!s || s === '1') return 3; if (s === 'any') return 4; const m = s.split('.')[1]; return m ? m.length : 0; };
  function fmt(el, n, final) {
    if (n === '' || n === null || n === undefined || isNaN(Number(n))) return '';
    n = Number(n);
    const d = decOf(el);
    const fixed = final && el._money ? Math.abs(n).toFixed(2) : String(Math.round(Math.abs(n) * 10 ** d) / 10 ** d);
    const [i, f] = fixed.split('.');
    return (n < 0 ? '-' : '') + groupInt(i) + (f && (Number(f) || el._money) ? ',' + f : '');
  }
  function liveFormat(el) {
    const t = nget(el);
    const pos = el.selectionStart === null ? t.length : el.selectionStart;
    const before = t.slice(0, pos).replace(/[^0-9,]/g, '').length;
    const neg = /^\s*-/.test(t);
    let c = t.replace(/[^0-9,]/g, '');
    const k = c.indexOf(',');
    if (k >= 0) c = c.slice(0, k + 1) + c.slice(k + 1).replace(/,/g, '').slice(0, decOf(el) || 4);
    const [i, f] = c.split(',');
    const out = (neg ? '-' : '') + (i === '' && f !== undefined ? '0' : groupInt(i || '')) + (f !== undefined ? ',' + f : '');
    if (out === t) return;
    nset(el, out);
    let cnt = 0, p = 0;
    while (p < out.length && cnt < before) { if (/[0-9,]/.test(out[p])) cnt++; p++; }
    try { el.setSelectionRange(p, p); } catch (e) { /* desteklenmiyor */ }
  }
  function enhanceNumber(el) {
    if (el._nsNum || el.dataset.plain !== undefined || SKIP.test(el.name || el.id || el.dataset.gk || '')) return;
    el._nsNum = true;
    const fld = el.closest('.field');
    const lbl = (fld && fld.querySelector('label') ? fld.querySelector('label').textContent : '') || el.placeholder || el.name || '';
    el._money = MONEY.test(lbl) && !/%|adet|miktar|\bkg\b|gün|saat|\bdk\b|\bkur\b|puan/i.test(lbl);
    const start = nget(el);
    el.setAttribute('type', 'text');
    el.setAttribute('inputmode', 'decimal');
    el.autocomplete = 'off';
    el.classList.add('ns-num');
    if (el._money) el.classList.add('ns-tl');
    Object.defineProperty(el, 'type', { configurable: true, get: () => 'number' });
    Object.defineProperty(el, 'value', { configurable: true, get() { return parseTR(nget(this)); }, set(v) { nset(this, v === '' || v === null || v === undefined ? '' : fmt(this, Number(String(v).replace(',', '.')), true)); } });
    Object.defineProperty(el, 'valueAsNumber', { configurable: true, get() { const v = this.value; return v === '' ? NaN : Number(v); } });
    nset(el, start === '' ? '' : fmt(el, Number(start), true));
  }
  document.addEventListener('keydown', (e) => {
    const el = e.target;
    if (!el._nsNum) return;
    if ((e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') && !e.ctrlKey) {
      e.preventDefault();
      if (!nget(el).includes(',') && decOf(el)) { el.setRangeText(',', el.selectionStart, el.selectionEnd, 'end'); liveFormat(el); el.dispatchEvent(new Event('input', { bubbles: true })); }
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const st = Number(el.getAttribute('step')) || 1;
      const v = (Number(el.value) || 0) + (e.key === 'ArrowUp' ? st : -st);
      const mn = el.getAttribute('min');
      el.value = mn !== null && v < Number(mn) ? Number(mn) : Math.round(v * 1e4) / 1e4;
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !/[0-9-]/.test(e.key)) e.preventDefault();
  }, true);
  document.addEventListener('input', (e) => { if (e.target._nsNum) liveFormat(e.target); }, true);
  document.addEventListener('paste', (e) => {
    const el = e.target; if (!el._nsNum) return;
    e.preventDefault();
    el.value = parseTR((e.clipboardData || window.clipboardData).getData('text'));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
  document.addEventListener('focusin', (e) => { const el = e.target; if (el._nsNum) setTimeout(() => { try { el.select(); } catch (x) { /* yok */ } }, 0); });

  // ---------- Metin alanı biçimleri ve doğrulama ----------
  const tcOk = (t) => { if (!/^[1-9]\d{10}$/.test(t)) return false; const d = t.split('').map(Number); const a = (d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7]); return ((a % 10) + 10) % 10 === d[9] && d.slice(0, 10).reduce((x, y) => x + y, 0) % 10 === d[10]; };
  const vknOk = (v) => { if (!/^\d{10}$/.test(v)) return false; const d = v.split('').map(Number); let s = 0; for (let i = 0; i < 9; i++) { const t = (d[i] + 9 - i) % 10; let r = (t * 2 ** (9 - i)) % 9; if (t !== 0 && r === 0) r = 9; s += r; } return (10 - (s % 10)) % 10 === d[9]; };
  const hint = (el, msg) => {
    let h = el.nextElementSibling && el.nextElementSibling.classList.contains('ns-hint') ? el.nextElementSibling : null;
    if (!msg) { if (h) h.remove(); el.classList.remove('ns-bad'); return; }
    if (!h) { h = document.createElement('span'); h.className = 'ns-hint small'; el.insertAdjacentElement('afterend', h); }
    h.textContent = msg; el.classList.add('ns-bad');
  };
  const kind = (el) => {
    const n = (el.name || el.id || '').toLowerCase();
    if (el.type === 'tel' || /phone|telefon|gsm/.test(n)) return 'tel';
    if (/iban/.test(n)) return 'iban';
    if (/^(tc|tckn|idno)$/.test(n)) return 'tc';
    if (/^(taxno|vkn|buyervkn)$/.test(n)) return 'vkn';
    if (/plate|plaka/.test(n)) return 'plate';
    if (el.type === 'email' || /email|eposta/.test(n)) return 'mail';
    return '';
  };
  document.addEventListener('input', (e) => {
    const el = e.target; if (!(el instanceof HTMLInputElement) || el._nsNum) return;
    const k = kind(el);
    if (k === 'plate' || k === 'iban') { const p = el.selectionStart; const v = nget(el); const u = v.toLocaleUpperCase('tr-TR'); if (u !== v) { nset(el, u); try { el.setSelectionRange(p, p); } catch (x) { /* yok */ } } }
  }, true);
  document.addEventListener('focusout', (e) => {
    const el = e.target; if (!(el instanceof HTMLInputElement)) return;
    if (el._nsNum) { const v = el.value; nset(el, v === '' ? '' : fmt(el, Number(v), true)); return; }
    const k = kind(el); if (!k) return;
    const v = nget(el).trim();
    if (!v) return hint(el, '');
    if (k === 'tel') { const d = v.replace(/\D/g, '').replace(/^90(?=\d{10}$)/, ''); const x = d.length === 10 ? '0' + d : d; if (/^0\d{10}$/.test(x)) { nset(el, `${x.slice(0, 4)} ${x.slice(4, 7)} ${x.slice(7, 9)} ${x.slice(9)}`); hint(el, ''); } else if (/^\+/.test(v)) hint(el, ''); else hint(el, 'Telefon 10-11 haneli olmalı'); }
    else if (k === 'iban') { const c = v.replace(/\s/g, '').toUpperCase(); nset(el, c.replace(/(.{4})/g, '$1 ').trim()); hint(el, !/^TR/.test(c) || /^TR\d{24}$/.test(c) ? '' : 'TR IBAN 26 karakter olmalı'); }
    else if (k === 'tc') hint(el, /^\d{11}$/.test(v) ? (tcOk(v) ? '' : 'TC kimlik numarası geçersiz') : /^[A-Z0-9]{6,12}$/i.test(v) ? '' : 'TC kimlik 11 hane olmalı (yabancılar pasaport no)');
    else if (k === 'vkn') hint(el, /^\d{11}$/.test(v) ? (tcOk(v) ? '' : 'TC kimlik numarası geçersiz') : /^\d{10}$/.test(v) ? (vknOk(v) ? '' : 'VKN kontrol hanesi hatalı') : 'VKN 10, TCKN 11 hane olmalı');
    else if (k === 'mail') { nset(el, v.toLowerCase()); hint(el, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'E-posta adresi geçersiz'); }
  });

  // ---------- Tarih alanı kısayolları ----------
  document.addEventListener('keydown', (e) => {
    const el = e.target; if (!(el instanceof HTMLInputElement) || el.type !== 'date') return;
    const cur = el.value ? new Date(el.value + 'T12:00') : new Date();
    let d = null;
    if (/^[btBT]$/.test(e.key)) d = new Date(); else if (e.key === '+' || e.key === '=') d = NS.addDays(cur, 1); else if (e.key === '-') d = NS.addDays(cur, -1); else return;
    e.preventDefault(); el.value = NS.iso(d);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }, true);

  // ---------- Aramalı açılır liste ----------
  let pk = null;
  const closePicker = () => { if (pk) { pk.remove(); pk = null; } };
  function openPicker(sel, q) {
    q = q || ''; closePicker();
    const items = [];
    [...sel.children].forEach((c) => { if (c.tagName === 'OPTGROUP') [...c.children].forEach((o) => items.push({ o, g: c.label })); else items.push({ o: c, g: '' }); });
    const r = sel.getBoundingClientRect(); const mob = innerWidth < 640;
    pk = document.createElement('div'); pk.className = 'ns-picker' + (mob ? ' mob' : '');
    pk.innerHTML = `<div class="ns-picker-s">${icon('search')}<input placeholder="Ara... (${items.length} kayıt)" value="${esc(q)}"></div><div class="ns-picker-l"></div><div class="ns-picker-f small faint">↑↓ seç · Enter onayla · Esc kapat</div>`;
    document.body.appendChild(pk);
    if (!mob) { const w = Math.max(r.width, 300); const below = innerHeight - r.bottom > 340 || r.top < 340; pk.style.cssText = `left:${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px;width:${w}px;${below ? `top:${r.bottom + 4}px` : `bottom:${innerHeight - r.top + 4}px`}`; }
    const inp = pk.querySelector('input'), list = pk.querySelector('.ns-picker-l');
    let act = 0, shown = [];
    const draw = () => {
      shown = items.filter((x) => !x.o.disabled && NS.match(inp.value, x.o.textContent, x.g));
      if (act >= shown.length) act = 0;
      let lastG = null;
      list.innerHTML = shown.map((x, i) => { const gh = x.g && x.g !== lastG ? `<div class="ns-picker-g">${esc(x.g)}</div>` : ''; lastG = x.g; return `${gh}<div class="ns-picker-i ${i === act ? 'act' : ''} ${x.o.value === sel.value ? 'sel' : ''}" data-i="${i}"><span class="grow">${esc(x.o.textContent) || '<span class="faint">(boş)</span>'}</span>${x.o.value === sel.value ? icon('check') : ''}</div>`; }).join('') || '<div class="ns-picker-e">Sonuç yok</div>';
      const a = list.querySelector('.act'); if (a) a.scrollIntoView({ block: 'nearest' });
    };
    const pick = (i) => { const x = shown[i]; if (!x) return; sel.value = x.o.value; closePicker(); sel.focus(); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); };
    act = q ? 0 : Math.max(0, items.filter((x) => !x.o.disabled).findIndex((x) => x.o.value === sel.value));
    draw();
    inp.addEventListener('input', () => { act = 0; draw(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { act = Math.min(shown.length - 1, act + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); pick(act); }
      else if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closePicker(); sel.focus(); }
      else if (e.key === 'Tab') closePicker();
    });
    list.addEventListener('mousedown', (e) => { const it = e.target.closest('[data-i]'); if (it) { e.preventDefault(); pick(Number(it.dataset.i)); } });
    setTimeout(() => { inp.focus(); if (q) inp.setSelectionRange(q.length, q.length); }, 0);
  }
  const wantsPicker = (s) => s instanceof HTMLSelectElement && !s.multiple && !s.disabled && (s.options.length >= 6 || s.dataset.search !== undefined) && s.dataset.nosearch === undefined;
  document.addEventListener('mousedown', (e) => {
    if (pk && !pk.contains(e.target)) closePicker();
    const s = e.target;
    if (e.button === 0 && wantsPicker(s)) { e.preventDefault(); s.focus(); openPicker(s); }
  }, true);
  document.addEventListener('keydown', (e) => {
    const s = e.target; if (!wantsPicker(s) || e.ctrlKey || e.metaKey || pk) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'F4' || (e.altKey && e.key === 'ArrowDown') || (e.key.length === 1 && /\S/.test(e.key))) { e.preventDefault(); e.stopPropagation(); openPicker(s, e.key.length === 1 && e.key !== ' ' ? e.key : ''); }
  }, true);
  addEventListener('resize', closePicker);
  document.addEventListener('scroll', (e) => { if (pk && !pk.contains(e.target)) closePicker(); }, true);

  // ---------- Formlarda Enter → sonraki alan, Ctrl+S → kaydet ----------
  document.addEventListener('keydown', (e) => {
    const ovs = document.querySelectorAll('.ns-overlay'); const modalEl = ovs.length ? ovs[ovs.length - 1].querySelector('.ns-modal') : null;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { const b = modalEl && modalEl.querySelector('.ns-modal-f .btn.primary'); if (b) { e.preventDefault(); b.click(); } else if (modalEl) e.preventDefault(); return; }
    const el = e.target;
    if (e.key !== 'Enter' || e.shiftKey || pk || !(el instanceof HTMLInputElement) || el.id || !el.name || !el.closest('.form-grid') || el.getAttribute('type') === 'checkbox') return;
    const scope = el.closest('.ns-modal') || el.closest('.card') || document.body;
    const fs = [...scope.querySelectorAll('.form-grid input[name], .form-grid select[name], .form-grid textarea[name]')].filter((x) => !x.disabled && !x.readOnly && x.offsetParent && x.getAttribute('type') !== 'checkbox');
    const i = fs.indexOf(el);
    e.preventDefault(); e.stopPropagation();
    if (i >= 0 && i < fs.length - 1) fs[i + 1].focus();
    else { const b = scope.querySelector('.ns-modal-f .btn.primary'); if (b) b.click(); }
  }, true);

  // ---------- Tablo sıralama ----------
  const cellVal = (td) => {
    const t = (td ? td.innerText || td.textContent : '').trim().split('\n')[0];
    const dm = t.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s(\d{2}):(\d{2}))?/);
    if (dm) return { n: Number(dm[3] + dm[2] + dm[1] + (dm[4] || '00') + (dm[5] || '00')) };
    const m = t.replace(/^[+−-]?\s*/, (x) => (x.includes('-') || x.includes('−') ? '-' : '')).match(/^-?₺?\s?[\d.]+(,\d+)?/);
    if (m && /\d/.test(m[0]) && /^[-₺\s\d.,]+(₺|TL|%|\s?[a-zçğıöşüA-Z²]{0,6})?$/.test(t.split(' (')[0])) return { n: Number(m[0].replace(/[₺\s]/g, '').replace(/\./g, '').replace(',', '.')) };
    return { s: t };
  };
  document.addEventListener('click', (e) => {
    const th = e.target.closest('table.tbl thead th');
    if (!th || !th.textContent.trim() || e.target.closest('input,button,a,select')) return;
    const tb = th.closest('table').tBodies[0]; if (!tb) return;
    const idx = [...th.parentElement.children].indexOf(th);
    const dir = th.dataset.sort === 'asc' ? 'desc' : 'asc';
    [...th.parentElement.children].forEach((x) => { delete x.dataset.sort; }); th.dataset.sort = dir;
    const rows = [...tb.rows].filter((r) => r.cells.length > idx);
    rows.sort((a, b) => { const x = cellVal(a.cells[idx]), y = cellVal(b.cells[idx]); const c = x.n !== undefined && y.n !== undefined ? x.n - y.n : String(x.s !== undefined ? x.s : x.n).localeCompare(String(y.s !== undefined ? y.s : y.n), 'tr', { numeric: true }); return dir === 'asc' ? c : -c; });
    rows.forEach((r) => tb.appendChild(r));
  });

  // ---------- Ctrl+K hızlı menü, "/" arama, "?" kısayollar ----------
  function help() {
    NS.modal({ title: 'Klavye kısayolları', body: [['Ctrl + K', 'Hızlı menü (sayfalar ve işlemler)'], ['/', 'Sayfadaki arama kutusuna git'], ['Enter', 'Formda sonraki alana geç (son alanda kaydet)'], ['Ctrl + S', 'Açık penceredeki formu kaydet'], ['Esc', 'Pencereyi kapat'], ['Tarih alanında B', 'Bugünün tarihi'], ['Tarih alanında + / -', 'Bir gün ileri / geri'], ['Sayı alanında ↑ / ↓', 'Artır / azalt'], ['Uzun listede harf yazın', 'Aramalı seçim penceresi açılır'], ['Tablo başlığına tıklayın', 'Sütuna göre sırala']].map(([k, v]) => `<div class="list-item small"><kbd class="ns-kbd">${k}</kbd><span class="grow">${v}</span></div>`).join(''), actions: [{ label: 'Tamam', cls: 'primary' }] });
  }
  function palette() {
    const app = NS.app; if (!app || !app.opts) return;
    const can = (n) => !n.roles || (app.can ? app.can(...n.roles) : true);
    const all = [...app.opts.nav.filter((n) => n.id && can(n) && (!app.navVisible || app.navVisible(n))).map((n) => ({ label: n.label, ic: n.icon, g: 'Sayfa', run: () => app.go(n.id) })),
      { label: 'Tema değiştir (açık / koyu)', ic: 'moon', g: 'İşlem', run: () => NS.toggleTheme() }, { label: 'Klavye kısayolları', ic: 'info', g: 'İşlem', run: help },
      ...(app.logout ? [{ label: 'Oturumu kapat', ic: 'logout', g: 'İşlem', run: () => app.logout() }] : [])];
    NS.modal({ title: 'Hızlı menü', body: `<div class="search">${icon('search')}<input class="input" id="cq" placeholder="Sayfa veya işlem yazın..." autocomplete="off"></div><div id="cl" class="mt" style="max-height:52vh;overflow:auto"></div>`,
      onOpen: (b, close) => {
        const q = b.querySelector('#cq'), l = b.querySelector('#cl'); let act = 0, shown = [];
        const draw = () => { shown = all.filter((x) => NS.match(q.value, x.label, x.g)); act = Math.min(act, Math.max(0, shown.length - 1)); l.innerHTML = shown.map((x, i) => `<div class="ns-picker-i ${i === act ? 'act' : ''}" data-i="${i}">${icon(x.ic || 'right')}<span class="grow">${esc(x.label)}</span><span class="small faint">${x.g}</span></div>`).join('') || '<div class="ns-picker-e">Sonuç yok</div>'; };
        const run = (i) => { const x = shown[i]; if (x) { close(); x.run(); } };
        q.addEventListener('input', () => { act = 0; draw(); });
        q.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { act = Math.min(shown.length - 1, act + 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); draw(); e.preventDefault(); } else if (e.key === 'Enter') { e.preventDefault(); run(act); } });
        l.addEventListener('click', (e) => { const it = e.target.closest('[data-i]'); if (it) run(Number(it.dataset.i)); });
        draw(); setTimeout(() => q.focus(), 30);
      } });
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!document.querySelector('.ns-overlay')) palette(); return; }
    const t = e.target;
    const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable;
    if (typing || document.querySelector('.ns-overlay')) return;
    if (e.key === '/') { const s = document.querySelector('.ns-content .search input'); if (s) { e.preventDefault(); s.focus(); } }
    else if (e.key === '?') help();
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cmdk]')) palette(); });

  // ---------- Yeni eklenen alanları otomatik geliştir ----------
  const scan = (root) => { if (root.matches && root.matches('input[type=number]')) enhanceNumber(root); if (root.querySelectorAll) root.querySelectorAll('input[type=number]').forEach(enhanceNumber); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); }))).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scan(document));
  scan(document);
  Object.assign(NS, { parseTR, tcOk, vknOk, openPicker, palette, shortcutHelp: help });
})();

/* ===== Kullanım kolaylıkları (2): tüm listelerde otomatik =====
   - Excel (.xlsx) dışa aktarım: görünen (filtrelenmiş, sıralanmış) liste veya seçili satırlar
   - Tablo menüsü: sütun göster/gizle (kullanıcı başına hatırlanır), Excel, yazdır
   - Çoklu seçim ve toplu işlem çubuğu (satır işlemleri tüm seçili kayıtlara uygulanır)
   - Kayıtlı filtreler (arama + filtre düğmeleri + seçimler), varsayılan filtre
   - Form taslaklarının otomatik kaydı ve geri yükleme
   - Geri al: Ctrl+Z, üst çubuk düğmesi, silme ve toplu işlem sonrası "Geri al" bildirimi */
(function () {
  'use strict';
  const NS = window.NS; if (!NS || window.__nsUx2) return; window.__nsUx2 = true;
  const { esc, icon, toast } = NS;
  const LS = { get(k, d) { try { const v = localStorage.getItem('nebsoft:ui:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('nebsoft:ui:' + k, JSON.stringify(v)); } catch (e) { /* kota */ } } };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : 'pazar');
  const routeKey = () => `${appId()}:${(NS.app && NS.app.route) || location.hash.split('/')[1] || ''}`;
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  // ---------- XLSX yazıcı (sıkıştırmasız zip) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  // Genel ZIP (sıkıştırmasız, UTF-8 adlar): NS.zip([{ name, data }]) → Blob — e-Belge arşivi, toplu dışa aktarım
  NS.zip = (files) => new Blob([zip(files)], { type: 'application/zip' });
  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let off = 0;
    const u16 = (v) => [v & 255, (v >> 8) & 255]; const u32 = (v) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
    files.forEach(({ name, data }) => {
      const nb = enc.encode(name); const db = typeof data === 'string' ? enc.encode(data) : data; const c = crc32(db);
      const head = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(c), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0)];
      parts.push(new Uint8Array(head), nb, db);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(c), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += head.length + nb.length + db.length;
    });
    const cSize = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cSize), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const xe = (s) => String(s === null || s === undefined ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const colName = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  // Hücre: sayı ise sayı (₺/% ve TR biçimi çözülür), tarih "gg.aa.yyyy" metin kalır
  const toCell = (v) => { if (typeof v === 'number' && isFinite(v)) return { n: v }; const s = String(v === null || v === undefined ? '' : v).trim(); if (/^-?₺?\s?\d{1,3}(\.\d{3})*(,\d+)?\s?(₺|TL|%)?$/.test(s) || /^-?₺?\s?\d+(,\d+)?\s?(₺|TL|%)?$/.test(s)) { const n = Number(s.replace(/[₺%\sTL]/g, '').replace(/\./g, '').replace(',', '.')); if (isFinite(n)) return { n }; } if (/^-?\d+(\.\d+)?$/.test(s) && s.length < 15) return { n: Number(s) }; return { s }; };
  function xlsx(filename, header, rows, sheet = 'Liste') {
    const all = [header, ...rows];
    const widths = header.map((_, ci) => Math.min(60, Math.max(8, ...all.map((r) => String(r[ci] === undefined ? '' : r[ci]).length + 2))));
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${all.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => { const ref = colName(ci) + (ri + 1); if (ri === 0) return `<c r="${ref}" t="inlineStr" s="1"><is><t>${xe(v)}</t></is></c>`; const c = toCell(v); return c.n !== undefined ? `<c r="${ref}" s="2"><v>${c.n}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xe(c.s)}</t></is></c>`; }).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${colName(Math.max(0, header.length - 1))}${all.length}"/></worksheet>`;
    const blob = zip([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xe(sheet.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xe(sheet.slice(0, 31))}'!$A$1:$${colName(Math.max(0, header.length - 1))}$${all.length}</definedName></definedNames></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0D9488"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
      { name: 'xl/worksheets/sheet1.xml', data: sheetXml },
    ]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = String(filename).replace(/\.(csv|xlsx)$/i, '') + '.xlsx'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`${rows.length} satır Excel’e aktarıldı`, 'ok');
  }
  // Sayfalardaki tüm "dışa aktar" düğmeleri artık gerçek Excel dosyası üretir
  NS.csv = (filename, rows, columns) => { const cols = columns || Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k })); xlsx(filename, cols.map((c) => c.label), rows.map((r) => cols.map((c) => { const v = c.value ? c.value(r) : r[c.key]; return v === null || v === undefined ? '' : v; }))); };
  NS.xlsx = xlsx;

  // ---------- Excel (.xlsx) / CSV okuma: NS.readSheet() → { name, rows: [{ başlık: değer }] } ----------
  // .xlsx bir ZIP'tir: merkezi dizin okunur, sayfa ve ortak metinler DecompressionStream('deflate-raw') ile açılır (bağımlılık yok)
  async function unzipEntries(buf) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let e = buf.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('Geçerli bir Excel (.xlsx) dosyası değil');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const ent = {}; const td = new TextDecoder();
    for (let k = 0; k < n; k++) { const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true); ent[td.decode(buf.subarray(p + 46, p + 46 + nl))] = { method: dv.getUint16(p + 10, true), size: dv.getUint32(p + 20, true), off: dv.getUint32(p + 42, true) }; p += 46 + nl + xl + cl; }
    const read = async (name) => {
      const z = ent[name]; if (!z) return null; const s = z.off + 30 + dv.getUint16(z.off + 26, true) + dv.getUint16(z.off + 28, true); const data = buf.subarray(s, s + z.size);
      if (z.method === 0) return td.decode(data);
      if (z.method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('Bu Excel dosyası bu tarayıcıda açılamıyor; dosyayı CSV olarak kaydedip deneyin');
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
    return { names: Object.keys(ent), read };
  }
  async function xlsxRows(buf) {
    const z = await unzipEntries(buf); const P = new DOMParser(); const X = (t) => (t ? P.parseFromString(t, 'application/xml') : null);
    const strs = [...((X(await z.read('xl/sharedStrings.xml')) || { getElementsByTagName: () => [] }).getElementsByTagName('si'))].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join(''));
    // İlk sayfa: workbook.xml + ilişki dosyasından (yoksa sheet1.xml)
    let sheet = 'xl/worksheets/sheet1.xml';
    try { const wb = X(await z.read('xl/workbook.xml')); const rid = wb.getElementsByTagName('sheet')[0].getAttribute('r:id'); const rel = [...X(await z.read('xl/_rels/workbook.xml.rels')).getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid); if (rel) { const t = rel.getAttribute('Target').replace(/^\//, ''); sheet = t.startsWith('xl/') ? t : 'xl/' + t; } } catch (e) { /* varsayılan sayfa */ }
    const doc = X(await z.read(sheet)); if (!doc) throw new Error('Excel dosyasında sayfa bulunamadı');
    const col = (ref) => [...ref.replace(/\d+/g, '')].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    const arr = [...doc.getElementsByTagName('row')].map((r) => { const o = []; [...r.getElementsByTagName('c')].forEach((c) => { const t = c.getAttribute('t'); const v = c.getElementsByTagName('v')[0]; o[col(c.getAttribute('r'))] = t === 's' ? strs[Number(v && v.textContent)] || '' : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map((x) => x.textContent).join('') : v ? v.textContent : ''; }); return Array.from(o, (x) => (x == null ? '' : String(x))); });
    const head = (arr.shift() || []).map((h) => String(h).trim());
    return arr.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] == null ? '' : r[i]])));
  }
  NS.readSheet = (accept = '.xlsx,.csv,.txt') => new Promise((res, rej) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.onchange = async () => { const f = i.files[0]; if (!f) return res(null); try { res({ name: f.name, rows: /\.(csv|txt)$/i.test(f.name) ? NS.parseCsv(await f.text()) : await xlsxRows(new Uint8Array(await f.arrayBuffer())) }); } catch (e) { rej(e); } };
    i.click();
  });
  NS.xlsxRows = xlsxRows;

  // ---------- Tablo yardımcıları ----------
  const cellText = (td) => (td ? (td.innerText || td.textContent || '').replace(/\s*\n\s*/g, ' · ').trim() : '');
  const tableInfo = (t) => {
    const ths = [...t.tHead.rows[0].cells]; const sel = t.dataset.nsSel === '1' ? 1 : 0;
    const cols = ths.map((th, i) => ({ i, label: th.textContent.trim(), act: i === ths.length - 1 && !th.textContent.trim() && t.querySelector('td.act') })).filter((c) => c.i >= sel && !c.act && c.label);
    return { ths, cols, sel };
  };
  function exportTable(t, onlySelected) {
    const { cols } = tableInfo(t); const hid = new Set(hiddenOf(t));
    const vis = cols.filter((c) => !hid.has(c.label));
    const rows = [...t.tBodies[0].rows].filter((r) => r.style.display !== 'none' && (!onlySelected || (r.querySelector('.ns-rsel') || {}).checked));
    const title = (document.querySelector('.ns-content h1') || {}).textContent || 'liste';
    xlsx(`${NS.slug(title)}-${NS.today()}`, vis.map((c) => c.label), rows.map((r) => vis.map((c) => cellText(r.cells[c.i]))), title);
  }
  function printTable(t) {
    const { cols } = tableInfo(t); const hid = new Set(hiddenOf(t)); const vis = cols.filter((c) => !hid.has(c.label));
    const sel = [...t.querySelectorAll('.ns-rsel:checked')].map((x) => x.closest('tr'));
    const rows = sel.length ? sel : [...t.tBodies[0].rows];
    const title = (document.querySelector('.ns-content h1') || {}).textContent || 'Liste';
    NS.printHtml(`<h2>${esc(title)}</h2><div style="font-size:11px;color:#666">${NS.dt(new Date())} · ${rows.length} kayıt</div><table><tr>${vis.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${vis.map((c) => `<td>${esc(cellText(r.cells[c.i]))}</td>`).join('')}</tr>`).join('')}</table>`, { title });
  }

  // ---------- Sütun göster / gizle ----------
  const tKey = (t) => routeKey() + ':' + hash([...t.tHead.rows[0].cells].map((c) => c.textContent.trim()).join('|'));
  const hiddenOf = (t) => LS.get('cols:' + tKey(t), []);
  let styleEl = null;
  function applyCols(t) {
    const hid = hiddenOf(t); const k = 't' + hash(tKey(t)); t.dataset.tk = k;
    const { cols } = tableInfo(t);
    const rules = cols.filter((c) => hid.includes(c.label)).map((c) => `table[data-tk="${k}"] tr > :nth-child(${c.i + 1}){display:none}`);
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'ns-colstyle'; document.head.appendChild(styleEl); }
    const all = (styleEl.textContent || '').split('\n').filter((l) => l && !l.includes(`"${k}"`));
    styleEl.textContent = [...all, ...rules].join('\n');
  }
  function tableMenu(t, btn) {
    closeMenu();
    const { cols } = tableInfo(t); const hid = new Set(hiddenOf(t)); const nSel = t.querySelectorAll('.ns-rsel:checked').length;
    const m = document.createElement('div'); m.className = 'ns-menu';
    m.innerHTML = `<div class="ns-menu-h">Sütunlar</div>${cols.map((c) => `<label class="ns-menu-i"><input type="checkbox" data-col="${esc(c.label)}" ${hid.has(c.label) ? '' : 'checked'}> ${esc(c.label)}</label>`).join('')}<div class="ns-menu-sep"></div>
      <button class="ns-menu-i" data-m="xls">${icon('download')} Excel’e aktar (görünen liste)</button>${nSel ? `<button class="ns-menu-i" data-m="xlss">${icon('download')} Seçilen ${nSel} satırı Excel’e aktar</button>` : ''}<button class="ns-menu-i" data-m="print">${icon('print')} Yazdır</button><button class="ns-menu-i" data-m="reset">${icon('refresh')} Sütunları sıfırla</button>`;
    document.body.appendChild(m); placeMenu(m, btn);
    m.addEventListener('change', (e) => { const c = e.target.dataset.col; if (!c) return; const h = new Set(hiddenOf(t)); if (e.target.checked) h.delete(c); else h.add(c); if (h.size >= cols.length) { e.target.checked = true; return toast('En az bir sütun görünmeli', 'err'); } LS.set('cols:' + tKey(t), [...h]); applyCols(t); });
    m.addEventListener('click', (e) => { const a = e.target.closest('[data-m]'); if (!a) return; closeMenu(); if (a.dataset.m === 'xls') exportTable(t); else if (a.dataset.m === 'xlss') exportTable(t, true); else if (a.dataset.m === 'print') printTable(t); else { LS.set('cols:' + tKey(t), []); applyCols(t); } });
  }
  let menu = null;
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; } };
  const placeMenu = (m, btn) => { menu = m; const r = btn.getBoundingClientRect(); const w = 260; m.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px'; m.style.width = w + 'px'; const below = innerHeight - r.bottom > 300; if (below) m.style.top = r.bottom + 4 + 'px'; else m.style.bottom = innerHeight - r.top + 4 + 'px'; };
  document.addEventListener('mousedown', (e) => { if (menu && !menu.contains(e.target) && !e.target.closest('[data-tmenu],[data-fmenu]')) closeMenu(); });

  // ---------- Çoklu seçim ----------
  const selectable = (t) => t.tBodies[0] && t.tBodies[0].querySelector('tr[data-id] button[data-act]') && !t.tBodies[0].querySelector('input[type=checkbox]') && t.closest('.ns-content') && !t.closest('.ns-modal');
  function enhanceTable(t) {
    if (t._nsT || !t.tHead || !t.tHead.rows[0]) return; t._nsT = true;
    if (selectable(t)) {
      t.dataset.nsSel = '1';
      const th = document.createElement('th'); th.className = 'ns-selc'; th.innerHTML = '<input type="checkbox" class="ns-asel" title="Tümünü seç">'; t.tHead.rows[0].prepend(th);
      [...t.tBodies[0].rows].forEach((r) => { const td = document.createElement('td'); td.className = 'ns-selc'; td.innerHTML = r.dataset.id ? `<input type="checkbox" class="ns-rsel" value="${esc(r.dataset.id)}">` : ''; r.prepend(td); });
    }
    const wrap = t.closest('.tbl-wrap');
    if (wrap && !wrap.querySelector(':scope > [data-tmenu]')) { const b = document.createElement('button'); b.className = 'btn sm ghost icon ns-tmenu'; b.dataset.tmenu = '1'; b.title = 'Sütunlar, Excel, yazdır'; b.innerHTML = icon('settings'); wrap.style.position = 'relative'; wrap.appendChild(b); b.onclick = (e) => { e.stopPropagation(); tableMenu(t, b); }; }
    applyCols(t);
  }
  document.addEventListener('change', (e) => {
    const t = e.target.closest('table'); if (!t) return;
    if (e.target.classList.contains('ns-asel')) t.querySelectorAll('.ns-rsel').forEach((x) => { if (x.closest('tr').offsetParent !== null) x.checked = e.target.checked; });
    if (e.target.classList.contains('ns-asel') || e.target.classList.contains('ns-rsel')) { t.querySelectorAll('.ns-rsel').forEach((x) => x.closest('tr').classList.toggle('ns-row-sel', x.checked)); bulkBar(t); }
  });
  // Satıra tıklayınca (boş alana) seçim değişsin değil; Shift ile aralık seçimi
  let lastIdx = null;
  document.addEventListener('click', (e) => { const cb = e.target.closest('.ns-rsel'); if (!cb) return; const t = cb.closest('table'); const all = [...t.querySelectorAll('.ns-rsel')]; const i = all.indexOf(cb); if (e.shiftKey && lastIdx !== null) { const [a, b] = [Math.min(lastIdx, i), Math.max(lastIdx, i)]; all.slice(a, b + 1).forEach((x) => { x.checked = cb.checked; x.closest('tr').classList.toggle('ns-row-sel', x.checked); }); bulkBar(t); } lastIdx = i; });

  // ---------- Toplu işlem çubuğu ----------
  const SAFE = /sil|iptal|gönder|sorgula|onayla|kabul|red|tamam|yapıldı|geldi|teslim|faturala|hatırlat|bildir|kapat|serbest|bloke|tahsil|aktif|pasif|askı|uzat|yenile|sıfırla|kilidi|e-fatura|e-arşiv|durum/i;
  const UNSAFE = /^(edit|ed|pe|view|v|dt|open|eye|md|go|mk|kk|we|ship|sv|is|rp|in|imp|coa|lb|lt|iz|wo|pay|col|out|recv|mail|wa|tr|tl|tree|cp|print|pr|p|label)$/;
  const ACTN = { del: 'Sil', trash: 'Sil', cx: 'İptal', print: 'Yazdır', pr: 'Yazdır', p: 'Yazdır', q: 'Durum sorgula', rs: 'Tekrar gönder', ok: 'Onayla', done: 'Tamamlandı', came: 'Geldi', pd: 'Yapıldı', ub: 'Serbest bırak', bk: 'Bloke / serbest' };
  let bar = null;
  function bulkBar(t) {
    const ids = [...t.querySelectorAll('.ns-rsel:checked')].map((x) => x.value);
    if (!ids.length) { if (bar) { bar.remove(); bar = null; } return; }
    const acts = new Map();
    ids.forEach((id) => t.querySelectorAll(`tr[data-id="${CSS.escape(id)}"] button[data-act]`).forEach((b) => { const a = b.dataset.act; const label = (b.title || b.textContent || ACTN[a] || a).trim(); if (UNSAFE.test(a) || !SAFE.test(label + ' ' + a)) return; const x = acts.get(a) || { label, n: 0 }; x.n++; acts.set(a, x); }));
    if (!bar) { bar = document.createElement('div'); bar.className = 'ns-bulk'; document.body.appendChild(bar); }
    bar.innerHTML = `<b>${ids.length} kayıt seçili</b><button class="btn sm" data-b="xls">${icon('download')} Excel</button><button class="btn sm" data-b="print">${icon('print')} Yazdır</button>${[...acts].map(([a, x]) => `<button class="btn sm ${/sil|iptal/i.test(x.label) ? 'danger' : 'primary'}" data-b="act" data-a="${esc(a)}">${esc(x.label)} (${x.n})</button>`).join('')}<span class="grow"></span><button class="btn sm ghost" data-b="clr">${icon('x')} Seçimi kaldır</button>`;
    bar.onclick = async (e) => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      if (b.dataset.b === 'clr') { t.querySelectorAll('.ns-rsel,.ns-asel').forEach((x) => { x.checked = false; }); t.querySelectorAll('.ns-row-sel').forEach((r) => r.classList.remove('ns-row-sel')); bar.remove(); bar = null; return; }
      if (b.dataset.b === 'xls') return exportTable(t, true);
      if (b.dataset.b === 'print') return printTable(t);
      runBulk(b.dataset.a, acts.get(b.dataset.a).label, ids);
    };
  }
  const W = (ms) => new Promise((r) => setTimeout(r, ms));
  let bulkRunning = false;
  async function runBulk(act, label, ids) {
    if (!(await NS.confirm(`Seçilen ${ids.length} kayda "${label}" uygulansın mı?`, { ok: 'Uygula', danger: /sil|iptal/i.test(label), title: 'Toplu işlem' }))) return;
    if (bar) { bar.remove(); bar = null; }
    bulkRunning = true;
    const db = NS.app && NS.app.db; const before = db ? db.undoStack.length : 0; let ok = 0, skip = 0, stop = '';
    for (const id of ids) {
      const btn = document.querySelector(`.ns-content [data-act="${CSS.escape(act)}"][data-id="${CSS.escape(id)}"]`);
      if (!btn) { skip++; continue; }
      const n0 = document.querySelectorAll('.ns-overlay').length;
      btn.click(); await W(140);
      for (let k = 0; k < 4; k++) {
        const ovs = [...document.querySelectorAll('.ns-overlay')]; if (ovs.length <= n0) break;
        const ov = ovs[ovs.length - 1];
        if (ov.dataset.confirm) { const bs = ov.querySelectorAll('.ns-modal-f .btn'); bs[bs.length - 1].click(); await W(160); }
        else { ov.remove(); stop = 'Bu işlem bilgi girişi istediği için toplu yapılamaz; kayıtları tek tek işleyin.'; break; }
      }
      if (stop) break; ok++;
    }
    // Toplu işlemin tüm adımları tek "geri al" adımında birleşir
    if (db && db.undoStack.length - before > 1) { const first = db.undoStack[before]; db.undoStack.splice(before); db.undoStack.push({ ...first, label: `Toplu ${label} (${ok} kayıt)` }); }
    bulkRunning = false;
    if (stop) toast(stop, 'err');
    undoToast(`${ok} kayda "${label}" uygulandı${skip ? `, ${skip} kayıt uygun değildi` : ''}`);
  }

  // ---------- Geri al ----------
  function undo() {
    const db = NS.app && NS.app.db; if (!db) return;
    const u = db.undo(); if (!u) return toast('Geri alınacak işlem yok', '');
    toast(`Geri alındı: ${u.label}`, 'ok'); if (NS.app.refresh) NS.app.refresh(); refreshUndoBtn();
  }
  function undoToast(msg) {
    let box = document.querySelector('.ns-toasts'); if (!box) { box = document.createElement('div'); box.className = 'ns-toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'ns-toast ok'; t.innerHTML = `${icon('check')}<span>${esc(msg)}</span><button class="btn sm" style="margin-left:8px">${icon('back')} Geri al</button>`;
    t.querySelector('button').onclick = () => { t.remove(); undo(); };
    box.appendChild(t); setTimeout(() => { t.style.transition = '.3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 7000);
  }
  function refreshUndoBtn() { const b = document.querySelector('[data-undo]'); const db = NS.app && NS.app.db; if (!b || !db) return; const u = db.undoStack[db.undoStack.length - 1]; b.hidden = !u; b.title = u ? `Geri al: ${u.label} (Ctrl+Z)` : 'Geri al'; }
  // Silme işlemlerinden sonra "Geri al" teklif edilir
  const origRemove = NS.DB.prototype.remove;
  NS.DB.prototype.remove = function (name, id) { const r = origRemove.call(this, name, id); if (NS.app && this === NS.app.db && !bulkRunning) setTimeout(() => undoToast('Kayıt silindi'), 0); return r; };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-undo]')) undo(); });
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
    const t = e.target; if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable || document.querySelector('.ns-overlay')) return;
    e.preventDefault(); undo();
  });

  // ---------- Kayıtlı filtreler ----------
  const fKey = () => 'filters:' + routeKey();
  function captureFilter(h) {
    const st = { q: '', sel: {}, seg: {} };
    const qi = h.querySelector('.search input'); if (qi) st.q = qi.value;
    h.querySelectorAll('select[id]').forEach((s) => { st.sel[s.id] = s.value; });
    h.querySelectorAll('.seg').forEach((seg, i) => { const a = seg.querySelector('button.active'); if (a) { const at = [...a.attributes].find((x) => x.name.startsWith('data-')); if (at) st.seg[i] = [at.name, at.value]; } });
    h.querySelectorAll('input[type=checkbox][id]').forEach((c) => { st.sel['#' + c.id] = c.checked; });
    return st;
  }
  async function applyFilter(h, st) {
    for (const [i, [n, v]] of Object.entries(st.seg || {})) { const seg = h.querySelectorAll('.seg')[i]; const b = seg && seg.querySelector(`button[${n}="${CSS.escape(v)}"]`); if (b && !b.classList.contains('active')) { b.click(); await W(30); } }
    const host = document.querySelector('.ns-content .card-h') || h;
    for (const [id, v] of Object.entries(st.sel || {})) { if (id.startsWith('#')) { const c = host.querySelector(id); if (c && c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); } continue; } const s = host.querySelector('#' + CSS.escape(id)); if (s && s.value !== v) { s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); await W(30); } }
    const qi = (document.querySelector('.ns-content .card-h') || h).querySelector('.search input'); if (qi && qi.value !== st.q) { qi.value = st.q; qi.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  function filterMenu(h, btn) {
    closeMenu();
    const list = LS.get(fKey(), []);
    const m = document.createElement('div'); m.className = 'ns-menu';
    m.innerHTML = `<div class="ns-menu-h">Kayıtlı filtreler</div>${list.map((f, i) => `<div class="ns-menu-i row nw"><button class="grow ns-menu-a" data-fa="${i}">${f.def ? '★ ' : ''}${esc(f.name)}</button><button class="btn sm ghost icon" data-fd="${i}" title="Varsayılan yap">${icon('star')}</button><button class="btn sm ghost icon" data-fx="${i}" title="Sil">${icon('trash')}</button></div>`).join('') || '<div class="ns-menu-e small faint">Henüz kayıtlı filtre yok</div>'}<div class="ns-menu-sep"></div><button class="ns-menu-i" data-fs="1">${icon('plus')} Mevcut filtreyi kaydet</button>`;
    document.body.appendChild(m); placeMenu(m, btn);
    m.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-fa],[data-fd],[data-fx],[data-fs]'); if (!a) return;
      const L = LS.get(fKey(), []);
      if (a.dataset.fa !== undefined) { closeMenu(); await applyFilter(h, L[a.dataset.fa].st); toast(`Filtre uygulandı: ${L[a.dataset.fa].name}`, 'ok'); }
      else if (a.dataset.fd !== undefined) { L.forEach((f, i) => { f.def = i === Number(a.dataset.fd) ? !f.def : false; }); LS.set(fKey(), L); closeMenu(); toast(L[a.dataset.fd].def ? 'Sayfa açılınca bu filtre uygulanacak' : 'Varsayılan filtre kaldırıldı', 'ok'); }
      else if (a.dataset.fx !== undefined) { L.splice(Number(a.dataset.fx), 1); LS.set(fKey(), L); closeMenu(); }
      else { closeMenu(); const name = await NS.prompt('Filtre adı', '', { title: 'Filtreyi kaydet' }); if (name) { L.push({ name, st: captureFilter(h) }); LS.set(fKey(), L); toast('Filtre kaydedildi', 'ok'); } }
    });
  }
  function enhanceFilterBar(h) {
    if (h._nsF || !h.querySelector('.search input') || h.closest('.ns-modal')) return; h._nsF = true;
    const b = document.createElement('button'); b.className = 'btn sm ns-fbtn'; b.dataset.fmenu = '1'; b.title = 'Kayıtlı filtreler'; b.innerHTML = `${icon('filter')}<span>Filtreler</span>`;
    h.appendChild(b); b.onclick = (e) => { e.stopPropagation(); filterMenu(h, b); };
    const def = LS.get(fKey(), []).find((f) => f.def);
    const k = routeKey(); if (def && enhanceFilterBar.applied !== k) { enhanceFilterBar.applied = k; setTimeout(() => applyFilter(h, def.st), 60); }
  }
  addEventListener('hashchange', () => { enhanceFilterBar.applied = null; });

  // ---------- Form taslakları ----------
  const SKIPF = /^(q|bc|pb|sc|ebq|cq|iq|ai|ln|tc|gi|pl|db)$/;
  const fieldsOf = (m) => [...m.querySelectorAll('input,select,textarea')].filter((x) => (x.name || x.id || (x.dataset.gi !== undefined && x.dataset.gk)) && !SKIPF.test(x.id || '') && x.type !== 'file' && x.type !== 'hidden' && !x.closest('.ns-draft'));
  const fId = (x) => x.name ? 'n:' + x.name : x.id ? 'i:' + x.id : `g:${x.dataset.gi}:${x.dataset.gk}`;
  const dKey = (m) => { const t = (m.querySelector('.ns-modal-h h2') || {}).textContent || ''; return 'draft:' + routeKey() + ':' + t; };
  const val = (x) => (x.type === 'checkbox' ? x.checked : x.value);
  function snapshot(m) { const o = {}; fieldsOf(m).forEach((x) => { o[fId(x)] = val(x); }); return o; }
  const draftable = (ov) => !ov.dataset.confirm && ov.querySelector('.ns-modal-f .btn.primary') && fieldsOf(ov).length >= 2;
  function watchModal(ov) {
    if (ov._nsD) return; ov._nsD = true;
    setTimeout(() => {
      if (!draftable(ov) || !document.body.contains(ov)) return;
      const m = ov.querySelector('.ns-modal'); const key = dKey(m); const initial = JSON.stringify(snapshot(m));
      const d = LS.get(key, null);
      if (d && Date.now() - d.at < 3 * 86400000 && JSON.stringify(d.f) !== initial) {
        const bn = document.createElement('div'); bn.className = 'ns-draft';
        bn.innerHTML = `${icon('clock')}<span class="grow">Kaydedilmemiş taslak bulundu (${NS.dt(new Date(d.at))})</span><button class="btn sm primary" data-dr="1">Geri yükle</button><button class="btn sm ghost" data-dx="1">Sil</button>`;
        m.querySelector('.ns-modal-b').prepend(bn);
        bn.onclick = (e) => {
          if (e.target.closest('[data-dx]')) { LS.set(key, null); bn.remove(); return; }
          if (!e.target.closest('[data-dr]')) return;
          fieldsOf(m).forEach((x) => { const k = fId(x); if (!(k in d.f)) return; if (x.type === 'checkbox') x.checked = d.f[k]; else x.value = d.f[k]; x.dispatchEvent(new Event('input', { bubbles: true })); x.dispatchEvent(new Event('change', { bubbles: true })); });
          bn.remove(); toast('Taslak geri yüklendi', 'ok');
        };
      }
      let tm = null; const save = () => { clearTimeout(tm); tm = setTimeout(() => { if (!document.body.contains(ov)) return; const s = snapshot(m); if (JSON.stringify(s) !== initial) LS.set(key, { at: Date.now(), f: s }); }, 400); };
      ov.addEventListener('input', save); ov.addEventListener('change', save);
      // Kaydet'e basıp pencere kapanırsa taslak silinir
      ov.querySelector('.ns-modal-f').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (!b) return; const primary = b.classList.contains('primary'); setTimeout(() => { if (!document.body.contains(ov) && primary) { clearTimeout(tm); LS.set(key, null); } }, 500); }, true);
    }, 80);
  }

  // ---------- Gözlemci ----------
  const scan = (n) => {
    if (n.matches && n.matches('table.tbl')) enhanceTable(n); if (n.querySelectorAll) n.querySelectorAll('table.tbl').forEach(enhanceTable);
    if (n.matches && n.matches('.ns-content .card-h')) enhanceFilterBar(n); if (n.querySelectorAll) n.querySelectorAll('.ns-content .card-h').forEach(enhanceFilterBar);
    if (n.classList && n.classList.contains('ns-overlay')) watchModal(n);
  };
  new MutationObserver((ms) => { ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n); })); if (bar && !document.querySelector('.ns-rsel:checked')) { bar.remove(); bar = null; } refreshUndoBtn(); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scan(document.body));
  addEventListener('hashchange', () => { if (bar) { bar.remove(); bar = null; } closeMenu(); });
  Object.assign(NS, { undo, undoToast, exportTable });
})();

/* ===== Platform: merkezi denetim kaydı, lisans denetimi, duyuru ve bakım modu =====
   Yönetim Merkezi (admin/) ile tüm ürünler aynı tarayıcı deposunu paylaşır:
   - nebsoft:audit   → tüm ürünlerden olay kaydı (giriş, işlem, silme, entegrasyon) işletme ve kullanıcı bazlı
   - nebsoft:yonetim → işletmeler, lisanslar, duyurular, bakım modu (Yönetim Merkezi yazar)
   - nebsoft:install → bu kurulumun bağlı olduğu işletme (lisans denetimi bu bağ varsa yapılır) */
(function () {
  'use strict';
  const NS = window.NS; if (!NS || window.__nsPlat) return; window.__nsPlat = true;
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : (location.pathname.match(/apps\/([^/]+)/) || [])[1] || 'pazar');
  const install = () => read('nebsoft:install', null);
  const sid = (() => { try { let s = sessionStorage.getItem('nebsoft:sid'); if (!s) { s = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('nebsoft:sid', s); } return s; } catch (e) { return 'x'; } })();
  const device = (() => { const u = navigator.userAgent; const os = /Windows/.test(u) ? 'Windows' : /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Mac/.test(u) ? 'macOS' : /Linux/.test(u) ? 'Linux' : 'Diğer'; const br = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Tarayıcı'; return `${br} · ${os}`; })();
  const TYPE = (a) => (/giriş|oturum/i.test(a) ? 'oturum' : /sil|iptal|imha|red/i.test(a) ? 'silme' : /ayar|yetki|kullanıcı|pin/i.test(a) ? 'ayar' : /e-fatura|e-arşiv|e-irsaliye|e-belge/i.test(a) ? 'ebelge' : /lisans/i.test(a) ? 'lisans' : 'islem');
  let queue = []; let tm = null;
  function audit(e) {
    const ins = install(); const app = NS.app && NS.app.db ? NS.app.db.settings() : {};
    queue.push({ id: NS.uid(), at: new Date().toISOString(), app: appId(), tenant: ins ? ins.tenant : '', tenantName: ins ? ins.name : app.bizName || '', user: NS.currentUser ? NS.currentUser.name : e.user || 'Sistem', role: NS.currentUser ? NS.currentUser.role : '', type: e.type || TYPE(e.action || ''), action: e.action || '', detail: String(e.detail || '').slice(0, 300), level: e.level || (/hata|başarısız|hatalı/i.test(e.action || '') ? 'uyari' : 'bilgi'), device, sid });
    clearTimeout(tm); tm = setTimeout(flush, 300);
  }
  function flush() { if (!queue.length) return; const all = read('nebsoft:audit', []); all.unshift(...queue.reverse()); queue = []; if (all.length > 6000) all.length = 6000; try { localStorage.setItem('nebsoft:audit', JSON.stringify(all)); } catch (e) { /* kota */ } }
  addEventListener('beforeunload', flush);
  // Ürünlerin kendi işlem günlüğü merkezi kayda da yazılır
  const origLog = NS.DB.prototype.log;
  NS.DB.prototype.log = function (action, detail) { origLog.call(this, action, detail); if (NS.app && this === NS.app.db) audit({ action, detail }); };
  // PIN girişleri: başarılı / hatalı deneme ve çıkış
  let lastUser = null;
  setInterval(() => { const u = NS.currentUser; if (u && (!lastUser || lastUser.id !== u.id)) audit({ action: 'Oturum açıldı', detail: `${u.name} (${u.role})`, type: 'oturum' }); else if (!u && lastUser) audit({ action: 'Oturum kapatıldı', detail: lastUser.name, type: 'oturum', user: lastUser.name }); lastUser = u ? { id: u.id, name: u.name } : null; }, 1500);

  // ---------- Lisans denetimi, bakım modu, duyurular ----------
  function platformState() {
    const cl = NS.cloud && NS.cloud.platform ? NS.cloud : null;
    const y = read('nebsoft:yonetim', null) || (cl ? { announcements: cl.platform.announcements || [], maintenance: cl.platform.maintenance || {}, _settings: { supportPhone: cl.site && cl.site.phone } } : null);
    if (!y || appId() === 'yonetim') return null;
    const ins = install(); const pid = appId();
    if (cl && !read('nebsoft:yonetim', null)) { const L = (cl.licenses || []).filter((l) => l.product === pid).sort((a, b) => String(b.end).localeCompare(String(a.end)))[0]; const now = new Date().toISOString().slice(0, 10); const m = (y.maintenance || {})[pid]; return { y, ins, lic: L && L.valid ? { end: L.end, status: L.status } : null, lock: '', maint: m, ann: (y.announcements || []).filter((a) => a.active && (!a.until || a.until >= now) && (!a.products || !a.products.length || a.products.includes(pid))), support: y._settings.supportPhone || '0850 555 00 34' }; }
    const maint = (y.maintenance || {})[pid];
    let lic = null, lock = '';
    if (ins && ins.tenant) {
      const t = (y.tenants || []).find((x) => x.id === ins.tenant);
      lic = (y.licenses || []).filter((l) => l.tenant === ins.tenant && (l.pid === pid || l.pid === 'bundle')).sort((a, b) => b.end.localeCompare(a.end))[0];
      if (t && t.status === 'askida') lock = `${t.name} hesabı askıya alınmıştır.`;
      else if (!lic) lock = 'Bu ürün için işletmenize tanımlı lisans bulunamadı.';
      else if (lic.status === 'askida') lock = 'Lisansınız askıya alınmıştır.';
      else if (lic.status === 'iptal') lock = 'Lisansınız iptal edilmiştir.';
      else if (lic.end < new Date().toISOString() && !(lic.grace && new Date(lic.end).getTime() + lic.grace * 864e5 > Date.now())) lock = `Lisansınızın süresi ${NS.date(lic.end)} tarihinde dolmuştur.`;
    }
    const now = new Date().toISOString();
    const ann = (y.announcements || []).filter((a) => a.active && (!a.until || a.until >= now.slice(0, 10)) && (!a.products || !a.products.length || a.products.includes(pid)) && (!a.tenants || !a.tenants.length || (ins && a.tenants.includes(ins.tenant))));
    return { y, ins, lic, lock, maint, ann, support: (y._settings || {}).supportPhone || (NS.cloud && NS.cloud.site && NS.cloud.site.phone) || '0850 555 00 34' };
  }
  function bandHtml(st) {
    const out = [];
    if (st.maint && st.maint.on) out.push(`<div class="ns-band warn">${NS.icon('wrench')}<span class="grow"><b>Planlı bakım:</b> ${NS.esc(st.maint.msg || 'Sistem bakımda, bazı işlemler kısıtlı olabilir.')}</span></div>`);
    if (st.lic && !st.lock) { const d = NS.daysBetween(new Date(), st.lic.end); if (d <= 14) out.push(`<div class="ns-band ${d <= 3 ? 'err' : 'warn'}">${NS.icon('key')}<span class="grow">Lisansınızın bitmesine <b>${Math.max(0, d)} gün</b> kaldı (${NS.date(st.lic.end)}).</span><a class="btn sm" href="../../index.html#/hesabim" target="_top">Yenile</a></div>`); }
    const seen = read('nebsoft:ui:annSeen', []);
    st.ann.filter((a) => !seen.includes(a.id)).forEach((a) => out.push(`<div class="ns-band ${a.level || 'info'}">${NS.icon('bell')}<span class="grow"><b>${NS.esc(a.title)}</b> ${NS.esc(a.body || '')}</span><button class="btn sm ghost icon" data-ann="${a.id}" title="Kapat">${NS.icon('x')}</button></div>`));
    return out.join('');
  }
  function applyPlatform() {
    if (!NS.app || !NS.app.opts) return;
    const st = platformState(); const view = document.querySelector('.ns-content'); if (!st || !view) return;
    if (st.lock || (st.maint && st.maint.on && st.maint.block)) {
      if (!view.querySelector('.ns-lock')) view.innerHTML = `<div class="ns-lock card pad center">${NS.icon('lock', 'ico-lg')}<h2 class="mt">${st.lock ? 'Lisans gerekli' : 'Sistem bakımda'}</h2><p class="muted mt">${NS.esc(st.lock || st.maint.msg || '')}</p><p class="small mt">Destek: <b>${NS.esc(st.support)}</b></p><div class="row mt" style="justify-content:center"><a class="btn primary" href="../../index.html#/hesabim" target="_top">${NS.icon('key')} Lisansı yenile</a></div></div>`;
      return;
    }
    let host = document.querySelector('#ns-bands'); const html = bandHtml(st);
    if (!host) { host = document.createElement('div'); host.id = 'ns-bands'; view.parentElement.insertBefore(host, view); }
    if (host.innerHTML !== html) host.innerHTML = html;
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-ann]'); if (!b) return; const seen = read('nebsoft:ui:annSeen', []); seen.push(b.dataset.ann); try { localStorage.setItem('nebsoft:ui:annSeen', JSON.stringify(seen)); } catch (x) { /* yok */ } b.closest('.ns-band').remove(); });
  addEventListener('hashchange', () => setTimeout(applyPlatform, 30));
  addEventListener('storage', (e) => { if (e.key === 'nebsoft:yonetim' || e.key === 'nebsoft:install') applyPlatform(); });
  document.addEventListener('DOMContentLoaded', () => setTimeout(applyPlatform, 50));
  setTimeout(applyPlatform, 300); setInterval(applyPlatform, 20000);
  Object.assign(NS, { audit, platformState, applyPlatform, auditFlush: flush });
})();
