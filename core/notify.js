/* NEBSOFT Bildirim ve ses merkezi
   • Her ürünün olay kataloğu (garson çağrısı, yeni online randevu, müşteri onayı…) aşağıda tanımlıdır.
   • Olaylar veri değişiminden algılanır: başka cihazdan/sekmeden (bulut eşitleme, QR menü, müşteri sayfası) gelen yeni
     kayıtlar bildirilir; bu cihazda kullanıcının kendi eklediği kayıtlar bildirilmez.
   • Sesler WebAudio ile üretilir (dosya yok). Ayarlar cihaza özeldir: mutfak tableti ile kasa farklı ses kullanabilir.
   • Uygulamalar kendi olaylarını da tetikleyebilir: NS.notify('anahtar', { title, body, href }) */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { esc, icon } = NS;
  const appId = () => (NS.app && NS.app.opts ? NS.app.opts.id : null);

  // ---------- Sesler ----------
  let ctx = null;
  const ac = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { ctx = null; } return ctx; };
  ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, () => ac(), { once: true, passive: true }));
  function tone(c, at, freq, dur, { type = 'sine', vol = 0.3, attack = 0.005, glide } = {}) {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at); if (glide) o.frequency.exponentialRampToValueAtTime(glide, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + 0.05);
  }
  const SOUNDS = {
    zil: { label: 'Zil', play: (c, t, v) => { tone(c, t, 880, 0.5, { vol: v }); tone(c, t + 0.16, 1320, 0.7, { vol: v * 0.8 }); } },
    ding: { label: 'Ding', play: (c, t, v) => { tone(c, t, 1568, 0.6, { type: 'triangle', vol: v }); } },
    cift: { label: 'Çift bip', play: (c, t, v) => { tone(c, t, 1046, 0.12, { type: 'square', vol: v * 0.35 }); tone(c, t + 0.18, 1046, 0.12, { type: 'square', vol: v * 0.35 }); } },
    marimba: { label: 'Marimba', play: (c, t, v) => { [1046, 1318, 1568].forEach((f, i) => tone(c, t + i * 0.11, f, 0.35, { vol: v * 0.9, attack: 0.002 })); } },
    gong: { label: 'Gong', play: (c, t, v) => { tone(c, t, 196, 1.8, { vol: v, attack: 0.01 }); tone(c, t, 294, 1.4, { vol: v * 0.5, attack: 0.01 }); } },
    kasa: { label: 'Kasa', play: (c, t, v) => { tone(c, t, 2093, 0.18, { type: 'triangle', vol: v * 0.7 }); tone(c, t + 0.09, 2637, 0.4, { type: 'triangle', vol: v * 0.7 }); } },
    acil: { label: 'Acil (yüksek)', play: (c, t, v) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.22, i % 2 ? 1200 : 900, 0.18, { type: 'square', vol: v * 0.4 }); } },
    yumusak: { label: 'Yumuşak', play: (c, t, v) => { tone(c, t, 660, 0.4, { vol: v * 0.6, glide: 990 }); } },
  };
  function play(name, volume) {
    const c = ac(); const s = SOUNDS[name]; if (!c || !s) return;
    try { s.play(c, c.currentTime + 0.02, Math.max(0.02, Math.min(1, volume == null ? 0.8 : volume)) * 0.6); } catch (e) { /* ses yok */ }
  }

  // ---------- Olay katalogları ----------
  // coll: yeni kayıt izlenecek koleksiyon · when: hangi kayıtlar · count: sayısı artınca bildir · roles: kimlerin cihazında açık gelsin
  const nm = (db, coll, id, f = 'name') => ((db.get(coll, id) || {})[f]) || '';
  const when = (r) => [r.date, r.time || r.start].filter(Boolean).join(' ');
  const CATALOG = {
    adisyon: [
      { key: 'garson', label: 'Garson çağrıldı', desc: 'Müşteri QR menüden garson çağırdığında', sound: 'acil', urgent: true, repeat: true, coll: 'calls', when: (c) => !c.done && c.type !== 'hesap' && !c.order, title: (c, db) => `${nm(db, 'tables', c.table) || 'Masa'} garson çağırıyor`, href: '#/masalar' },
      { key: 'hesap', label: 'Hesap istendi', desc: 'Müşteri QR menüden hesap istediğinde', sound: 'cift', urgent: true, coll: 'calls', when: (c) => !c.done && c.type === 'hesap', title: (c, db) => `${nm(db, 'tables', c.table) || 'Masa'} hesap istiyor`, href: '#/masalar' },
      { key: 'qrsiparis', label: 'QR menüden sipariş', desc: 'Masadan QR menüyle sipariş verildiğinde', sound: 'marimba', coll: 'calls', when: (c) => c.order, title: (c, db) => `${nm(db, 'tables', c.table) || 'Masa'} QR menüden sipariş verdi`, href: '#/mutfak' },
      { key: 'paket', label: 'Yeni paket / platform siparişi', desc: 'Yemeksepeti, Getir, Trendyol veya telefon paket siparişi', sound: 'kasa', urgent: true, coll: 'checks', when: (c) => c.type === 'paket', title: (c) => `Yeni paket sipariş${c.source ? ' · ' + c.source : ''}`, body: (c) => (c.customer && c.customer.name) || '', href: '#/paket' },
      { key: 'hazir', label: 'Mutfakta ürün hazır', desc: 'Mutfak bir ürünü "hazır" işaretlediğinde (garson cihazları)', sound: 'ding', roles: ['garson', 'admin'], count: (db) => db.all('checks', (c) => c.status === 'open').reduce((n, c) => n + (c.items || []).filter((i) => i.status === 'ready').length, 0), title: (x) => `Mutfakta ${x.n} ürün servise hazır`, href: '#/masalar' },
    ],
    pos: [{ key: 'hizli', label: 'Hızlı ticaret siparişi', desc: 'Getir Çarşı, Yemeksepeti Market, Trendyol Go', sound: 'kasa', urgent: true, coll: 'qorders', title: (o) => `Yeni ${o.platform || 'online'} siparişi`, href: '#/hizli' }],
    randevu: [{ key: 'online', label: 'Yeni online randevu', desc: 'Müşteri randevu sayfanızdan randevu aldığında', sound: 'marimba', coll: 'appointments', title: () => 'Yeni online randevu', body: (a, db) => `${nm(db, 'customers', a.customer)} · ${when(a)}`, href: '#/takvim' }],
    klinik: [{ key: 'online', label: 'Yeni randevu talebi', desc: 'Hasta online randevu istediğinde', sound: 'marimba', coll: 'appointments', title: () => 'Yeni randevu talebi', body: (a) => when(a), href: '#/' }],
    veteriner: [{ key: 'online', label: 'Yeni randevu isteği', desc: 'Pati karnesinden randevu istendiğinde', sound: 'marimba', coll: 'appts', title: () => 'Yeni randevu isteği', body: (a) => when(a) }],
    otoservis: [
      { key: 'onay', label: 'Müşteri teklifi onayladı', desc: 'Müşteri onay linkinden kalemleri onayladığında', sound: 'zil', urgent: true, count: (db) => db.all('jobs').reduce((n, j) => n + (j.items || []).filter((i) => i.approved === true).length, 0), title: () => 'Müşteri teklifi onayladı', href: '#/isemirleri' },
      { key: 'red', label: 'Müşteri kalem reddetti', desc: 'Müşteri bir kalemi reddettiğinde', sound: 'cift', count: (db) => db.all('jobs').reduce((n, j) => n + (j.items || []).filter((i) => i.approved === false).length, 0), title: () => 'Müşteri bir kalemi reddetti', href: '#/isemirleri' },
      { key: 'odeme', label: 'Online ödeme alındı', desc: 'Müşteri linkten kartla ödediğinde', sound: 'kasa', coll: 'payments', when: (p) => /online|kart/i.test(p.method || ''), title: (p) => `Online ödeme: ${NS.money(p.amount || 0)}` },
    ],
    servis: [{ key: 'onay', label: 'Müşteri teklife yanıt verdi', desc: 'Servis takip sayfasından onay/ret', sound: 'zil', urgent: true, count: (db) => db.all('tickets').filter((t) => t.approvedAt || t.customerReply).length, title: () => 'Müşteri teklife yanıt verdi' }],
    otel: [{ key: 'rezervasyon', label: 'Yeni rezervasyon', desc: 'Rezervasyon motoru veya kanal yöneticisinden', sound: 'marimba', urgent: true, coll: 'reservations', title: (r) => `Yeni rezervasyon ${r.no || ''}`, body: (r) => [r.checkin || r.in, r.checkout || r.out].filter(Boolean).join(' → ') }],
    eticaret: [{ key: 'siparis', label: 'Yeni sipariş', desc: 'Mağazanızdan sipariş geldiğinde', sound: 'kasa', urgent: true, coll: 'orders', title: (o) => `Yeni sipariş ${o.no || ''}`, body: (o) => (o.total ? NS.money(o.total) : '') }, { key: 'iade', label: 'İade talebi', desc: 'Müşteri iade istediğinde', sound: 'cift', coll: 'returns', title: () => 'Yeni iade talebi' }],
    pazaryeri: [{ key: 'siparis', label: 'Yeni pazaryeri siparişi', desc: 'Trendyol, Hepsiburada, n11…', sound: 'kasa', urgent: true, coll: 'orders', title: (o) => `Yeni ${o.channel || 'pazaryeri'} siparişi` }],
    kargo: [{ key: 'tercih', label: 'Alıcı teslimat tercihi', desc: 'Alıcı takip sayfasından tercih bildirdiğinde', sound: 'ding', count: (db) => db.all('ships').filter((s) => s.pref).length, title: () => 'Alıcı teslimat tercihi bildirdi' }],
    eczane: [{ key: 'recete', label: 'Reçete hazırlama talebi', desc: '"Reçetemi hazırla" sayfasından', sound: 'marimba', urgent: true, coll: 'rxOrders', title: (r) => `Reçete talebi${r.name ? ' · ' + r.name : ''}` }],
    kiralama: [{ key: 'online', label: 'Online kiralama', desc: 'Online kiralama sayfasından', sound: 'marimba', coll: 'rents', title: (r) => `Yeni online kiralama ${r.no || ''}` }],
    spor: [{ key: 'ders', label: 'Ders rezervasyonu', desc: 'Üye portalından ders rezervasyonu', sound: 'ding', coll: 'bookings', title: () => 'Yeni ders rezervasyonu' }],
    kurs: [{ key: 'veli', label: 'Veli mesajı', desc: 'Veli portalından mesaj/mazeret', sound: 'ding', coll: 'parentMsgs', title: () => 'Yeni veli mesajı' }],
    anaokulu: [{ key: 'veli', label: 'Veli mesajı', desc: 'Veli portalından mesaj', sound: 'ding', coll: 'messages', title: () => 'Yeni veli mesajı' }],
    site: [{ key: 'talep', label: 'Sakin talebi', desc: 'Sakin portalından arıza/talep', sound: 'ding', coll: 'requests', title: (r) => `Yeni sakin talebi${r.subject ? ': ' + r.subject : ''}` }],
    musavir: [{ key: 'mesaj', label: 'Mükellef mesajı', desc: 'Mükellef portalından', sound: 'ding', coll: 'messages', title: () => 'Yeni mükellef mesajı' }],
    hukuk: [{ key: 'mesaj', label: 'Müvekkil mesajı', desc: 'Müvekkil portalından', sound: 'ding', coll: 'messages', title: () => 'Yeni müvekkil mesajı' }],
    toptan: [{ key: 'bayi', label: 'Bayi siparişi', desc: 'B2B bayi sayfasından', sound: 'kasa', urgent: true, coll: 'so', title: (o) => `Yeni bayi siparişi ${o.no || ''}` }],
    crm: [{ key: 'teklif', label: 'Teklife müşteri yanıtı', desc: 'Müşteri teklifi kabul/red ettiğinde', sound: 'zil', urgent: true, count: (db) => db.all('quotes').filter((q) => ['kabul', 'red', 'accepted', 'rejected'].includes(q.status)).length, title: () => 'Müşteri teklife yanıt verdi' }],
    galeri: [{ key: 'talep', label: 'Araç talebi', desc: 'Araç vitrininden talep', sound: 'ding', coll: 'leads', title: (l) => `Yeni talep${l.name ? ' · ' + l.name : ''}` }],
    emlak: [{ key: 'talep', label: 'İlan talebi', desc: 'İlan sayfanızdan gelen talep', sound: 'ding', coll: 'requests', title: (l) => `Yeni talep${l.name ? ' · ' + l.name : ''}` }],
    bilet: [{ key: 'satis', label: 'Online bilet satışı', desc: 'Online bilet sayfasından', sound: 'kasa', coll: 'holds', title: () => 'Online bilet satışı' }],
  };
  const COMMON = [{ key: 'sistem', label: 'Sistem uyarıları', desc: 'Eşitleme hatası, lisans süresi ve duyurular', sound: 'yumusak' }];
  const extra = {};
  const defsOf = (id) => [...(CATALOG[id] || []), ...(extra[id] || []), ...COMMON];

  // ---------- Ayarlar (cihaza özel) ----------
  const KEY = (id) => `nebsoft:notify:${id}`;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* kota */ } };
  function cfg(id = appId()) {
    const c = read(KEY(id), {}); const ev = c.events || {};
    defsOf(id).forEach((d) => { ev[d.key] = { on: !(d.roles && NS.currentUser && !d.roles.includes(NS.currentUser.role)), sound: d.sound, repeat: !!d.repeat, ...(ev[d.key] || {}) }; });
    return { master: true, volume: 0.8, desktop: false, quiet: { on: false, from: '23:00', to: '08:00' }, ...c, events: ev };
  }
  const setCfg = (c, id = appId()) => write(KEY(id), c);
  const inQuiet = (q) => { if (!q || !q.on) return false; const m = new Date().toTimeString().slice(0, 5); return q.from <= q.to ? m >= q.from && m < q.to : m >= q.from || m < q.to; };

  // ---------- Akış (zil listesi) ----------
  const FEED = (id) => `nebsoft:notify:feed:${id}`;
  const feed = () => read(FEED(appId() || 'site'), []);
  function drawBell(ring) {
    const n = feed().filter((x) => !x.read).length; const b = document.getElementById('nvb');
    if (b) { b.textContent = n > 99 ? '99+' : n; b.classList.toggle('hide', !n); }
    const btn = document.querySelector('[data-bell]'); if (btn && ring) { btn.classList.remove('ring'); void btn.offsetWidth; btn.classList.add('ring'); }
    const base = document.title.replace(/^\(\d+\+?\)\s*/, ''); document.title = n ? `(${n}) ${base}` : base;
  }

  // ---------- Bildirim ----------
  let repeatT = null; let alertEl = null;
  function stopRepeat() { clearInterval(repeatT); repeatT = null; if (alertEl) { alertEl.remove(); alertEl = null; } }
  function notify(key, data = {}) {
    const id = appId() || 'site'; const c = cfg(id); const d = defsOf(id).find((x) => x.key === key) || { key, label: key, sound: 'ding' };
    const ec = c.events[key] || { on: true, sound: d.sound };
    const item = { id: NS.uid(), key, at: new Date().toISOString(), title: data.title || d.label, body: data.body || '', href: data.href || d.href || '', read: false };
    const list = [item, ...feed()].slice(0, 60); write(FEED(id), list); drawBell(true);
    if (!c.master || !ec.on) return item;
    const quiet = inQuiet(c.quiet);
    if (!quiet) play(ec.sound || d.sound, c.volume);
    if (navigator.vibrate && !quiet) try { navigator.vibrate(d.urgent ? [200, 100, 200] : 120); } catch (e) { /* yok */ }
    if (c.desktop && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try { const n = new Notification(item.title, { body: item.body, tag: key, renotify: true, icon: document.querySelector('link[rel=icon]') ? document.querySelector('link[rel=icon]').href : undefined }); n.onclick = () => { focus(); if (item.href) location.hash = item.href.replace(/^#/, ''); n.close(); }; } catch (e) { /* yok */ }
    }
    if (d.urgent || data.urgent) {
      stopRepeat();
      alertEl = document.createElement('div'); alertEl.className = 'nv-alert' + (ec.repeat ? ' urgent' : ''); alertEl.setAttribute('role', 'alert');
      alertEl.innerHTML = `<div class="ic">${icon('bell')}</div><div class="grow"><b>${esc(item.title)}</b>${item.body ? `<div class="small muted">${esc(item.body)}</div>` : ''}</div>${item.href ? `<a class="btn sm" href="${esc(item.href)}" data-nv-ack>Git</a>` : ''}<button class="btn sm primary" data-nv-ack>Tamam</button>`;
      document.body.appendChild(alertEl);
      if (ec.repeat && !quiet) repeatT = setInterval(() => play(ec.sound || d.sound, c.volume), 6000);
      else setTimeout(() => { if (alertEl && !repeatT) stopRepeat(); }, 12000);
    } else NS.toast(item.title + (item.body ? ' · ' + item.body : ''), 'ok');
    return item;
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-nv-ack]')) stopRepeat(); });

  // ---------- Zil menüsü ----------
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bell]'); const open = document.querySelector('.nv-feed');
    if (!b) { if (open && !e.target.closest('.nv-feed')) open.remove(); return; }
    if (open) { open.remove(); return; }
    const L = feed(); const m = document.createElement('div'); m.className = 'ns-menu nv-feed';
    const r = b.getBoundingClientRect(); Object.assign(m.style, { top: r.bottom + 6 + 'px', right: Math.max(8, innerWidth - r.right) + 'px', width: 'min(360px, calc(100vw - 16px))', position: 'fixed' });
    m.innerHTML = `<div class="row" style="padding:8px 10px"><b class="grow">Bildirimler</b>${L.length ? '<button class="btn sm ghost" data-nv-read>Tümünü okundu say</button>' : ''}</div><div class="ns-menu-sep"></div>
      ${L.length ? L.slice(0, 20).map((x) => `<a class="ns-menu-i" style="align-items:flex-start;text-decoration:none" href="${esc(x.href || '#')}" data-nv-item="${x.id}">${x.read ? '<span class="dot"></span>' : '<span class="dot ok" style="background:var(--accent)"></span>'}<span class="grow"><b style="font-weight:${x.read ? 500 : 700}">${esc(x.title)}</b>${x.body ? `<div class="small muted">${esc(x.body)}</div>` : ''}<div class="small faint">${NS.dt(x.at)}</div></span></a>`).join('') : `<div class="ns-menu-e small muted center">${window.__NB_ASSETS ? `<img src="${window.__NB_ASSETS}empty/bildirim.png" alt="" width="92" height="66" style="display:block;margin:0 auto">` : icon('bell')}<div class="mt">Henüz bildirim yok</div></div>`}
      ${appId() ? `<div class="ns-menu-sep"></div><a class="ns-menu-i" href="#/bildirimler">${icon('settings')} Bildirim ve ses ayarları</a>` : ''}`;
    document.body.appendChild(m);
    m.addEventListener('click', (ev) => {
      const id = appId() || 'site';
      if (ev.target.closest('[data-nv-read]')) { write(FEED(id), feed().map((x) => ({ ...x, read: true }))); drawBell(); m.remove(); }
      const it = ev.target.closest('[data-nv-item]'); if (it) { write(FEED(id), feed().map((x) => (x.id === it.dataset.nvItem ? { ...x, read: true } : x))); drawBell(); m.remove(); }
      if (ev.target.closest('a[href="#/bildirimler"]')) m.remove();
    });
  });

  // ---------- Veri izleme ----------
  const own = new Set();
  const origInsert = NS.DB.prototype.insert;
  NS.DB.prototype.insert = function (name, obj, silent) { const r = origInsert.call(this, name, obj, silent); if (r && r.id) own.add(r.id); return r; };
  let base = null; let watched = null;
  const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
  function snap(db, defs) {
    const s = { ids: {}, counts: {} };
    defs.forEach((d) => { if (d.coll) s.ids[d.key] = new Set(safe(() => db.all(d.coll).filter((r) => !d.when || safe(() => d.when(r), false)).map((r) => r.id), [])); if (d.count) s.counts[d.key] = safe(() => d.count(db), 0); });
    return s;
  }
  function check(silentCounts) {
    if (!watched) return; const db = watched; const defs = defsOf(appId()).filter((d) => d.coll || d.count);
    if (!defs.length) return;
    const now = snap(db, defs);
    if (!base) { base = now; return; }
    defs.forEach((d) => {
      if (d.coll) {
        const prev = base.ids[d.key] || new Set();
        [...now.ids[d.key]].filter((id) => !prev.has(id) && !own.has(id)).slice(0, 5).forEach((id) => { const r = db.get(d.coll, id) || {}; notify(d.key, { title: safe(() => d.title(r, db), d.label), body: d.body ? safe(() => d.body(r, db), '') : '', href: d.href }); });
      } else if (d.count && !silentCounts) {
        const a = now.counts[d.key], b = base.counts[d.key] || 0;
        if (a > b) notify(d.key, { title: safe(() => d.title({ n: a - b, total: a }, db), d.label), href: d.href });
      }
    });
    base = now;
  }
  function watch(app) {
    if (!app || !app.db || watched === app.db) return;
    watched = app.db; base = null; check();
    const origSave = app.db.save.bind(app.db);
    app.db.save = function () { const r = origSave.apply(null, arguments); check(true); return r; }; // kendi değişikliklerimiz: sayaç tabanı güncellenir, bildirim yok
    setInterval(() => check(), 2500);
    // Aynı tarayıcıdaki başka sekme/sayfa (QR menü, müşteri sayfası) yazınca
    addEventListener('storage', (e) => { if (e.key === app.db.key && !app.db.cloud && !app.db._dirty) { try { app.db.load(); } catch (x) { /* yok */ } check(); } });
    if (defsOf(app.opts.id).some((d) => d.coll || d.count) && cfg(app.opts.id).master) NS.bgPoll = true; // bulutta arka planda da yokla
    drawBell();
  }

  // ---------- Ayarlar sayfası ----------
  function page(el) {
    const id = appId(); const defs = defsOf(id);
    const draw = () => {
      const c = cfg(id);
      const opt = (sel) => Object.entries(SOUNDS).map(([k, s]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(s.label)}</option>`).join('');
      el.innerHTML = NS.pageHead('Bildirimler ve sesler', 'Hangi olayda hangi sesin çalacağını seçin. Ayarlar bu cihaza özeldir (ör. mutfak tableti ile kasa farklı olabilir).', `<button class="btn" data-nv-test>${icon('bell')} Deneme bildirimi</button>`) + `
        <div class="grid g-21"><div class="card"><div class="card-h"><h3>Olaylar</h3><span class="small faint">${defs.length} olay</span></div>
          ${defs.map((d) => { const e = c.events[d.key]; return `<div class="list-item" style="padding:12px 18px;gap:14px;flex-wrap:wrap">
            <label class="check grow" style="min-width:220px;align-items:flex-start"><input type="checkbox" data-ev="${d.key}" data-f="on" ${e.on ? 'checked' : ''} style="margin-top:3px"><span><b>${esc(d.label)}</b>${d.urgent ? ' ' + NS.badge('Önemli', 'warn') : ''}<div class="small muted">${esc(d.desc || '')}</div></span></label>
            <div class="row nw"><select class="input" style="width:150px;height:34px" data-ev="${d.key}" data-f="sound">${opt(e.sound)}</select><button class="btn sm icon" data-play="${e.sound}" title="Dinle">${icon('play')}</button></div>
            <label class="check small" title="Biri 'Tamam' diyene kadar 6 saniyede bir tekrar çalar"><input type="checkbox" data-ev="${d.key}" data-f="repeat" ${e.repeat ? 'checked' : ''}> Onaylanana kadar tekrarla</label></div>`; }).join('')}</div>
          <div class="col" style="gap:16px"><div class="card pad col"><h3>Genel</h3>
            <label class="check"><input type="checkbox" data-g="master" ${c.master ? 'checked' : ''}> Bildirimler açık</label>
            <div class="field"><label>Ses düzeyi</label><input type="range" min="0" max="1" step="0.05" value="${c.volume}" data-g="volume"></div>
            <label class="check"><input type="checkbox" data-g="desktop" ${c.desktop ? 'checked' : ''}> Program arka plandayken masaüstü bildirimi göster</label>
            ${'Notification' in window && Notification.permission !== 'granted' ? `<button class="btn sm" data-nv-perm>${icon('shield')} Tarayıcı izni ver</button>` : ''}</div>
          <div class="card pad col"><h3>Sessiz saatler</h3><label class="check"><input type="checkbox" data-q="on" ${c.quiet.on ? 'checked' : ''}> Bu saatlerde ses çalma (bildirim listesine yine düşer)</label>
            <div class="row nw"><input class="input" type="time" data-q="from" value="${c.quiet.from}"><span>–</span><input class="input" type="time" data-q="to" value="${c.quiet.to}"></div></div>
          <div class="card pad small muted">${icon('info')} Sesin çalması için sayfada en az bir kez tıklamış olmanız gerekir (tarayıcı kuralı). Kasada ve mutfakta ekranın açık kalması önerilir; masaüstü sürümünde program arka planda da ses çalar.</div></div></div>`;
    };
    const save = (f) => { const c = cfg(id); f(c); setCfg(c, id); };
    el.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.ev) save((c) => { c.events[t.dataset.ev][t.dataset.f] = t.type === 'checkbox' ? t.checked : t.value; });
      else if (t.dataset.g) save((c) => { c[t.dataset.g] = t.type === 'checkbox' ? t.checked : Number(t.value); });
      else if (t.dataset.q) save((c) => { c.quiet[t.dataset.q] = t.type === 'checkbox' ? t.checked : t.value; });
      if (t.dataset.f === 'sound') { play(t.value, cfg(id).volume); draw(); }
      if (t.dataset.g === 'desktop' && t.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(draw);
    });
    el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-play]'); if (p) play(p.dataset.play, cfg(id).volume);
      if (e.target.closest('[data-nv-test]')) notify(defs[0].key, { title: 'Deneme: ' + defs[0].label, body: 'Ses ve bildirim ayarlarınız çalışıyor' });
      if (e.target.closest('[data-nv-perm]')) Notification.requestPermission().then(draw);
    });
    draw();
  }

  // Her ürüne "Bildirimler" sayfası (iskelet kurulurken eklenir) ve veri izleme
  const origShell = NS.shell;
  NS.shell = function (opts) {
    if (opts && opts.routes && !opts.routes.bildirimler) {
      opts.routes.bildirimler = (el) => page(el);
      const k = opts.nav.findIndex((n) => n.id === 'entegrasyonlar');
      const item = { id: 'bildirimler', label: 'Bildirimler', icon: 'bell' };
      if (k >= 0) opts.nav.splice(k, 0, item); else opts.nav.push(item);
    }
    const app = origShell.call(this, opts);
    setTimeout(() => watch(NS.app), 0);
    return app;
  };

  const api = (key, data) => notify(key, data);
  Object.assign(api, { play, SOUNDS, CATALOG, define: (id, defs) => { extra[id] = [...(extra[id] || []), ...defs]; }, cfg, stop: stopRepeat, page, check: () => check() });
  NS.notify = api;
})();
