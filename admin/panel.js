/* NEBSOFT Yönetim Paneli (gerçek) — kurulum sihirbazı (MySQL), havale onayları, banka hesapları, işletmeler ve lisanslar,
   talepler, destek, kuponlar, yöneticiler, veritabanı, site ayarları, güvenlik kayıtları. Tüm veriler sunucu API'sinden gelir. */
(function () {
  'use strict';
  const { api, esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum } = NS;
  const C = window.CATALOG;
  const pname = (id) => (id === 'bundle' ? 'Hepsi Bir Arada' : (C.products.find((p) => p.id === id) || { name: id }).name);
  const planName = (i) => (C.plans[i] || {}).name || '-';
  // Sipariş kalemi: destek paketi lisans değildir, kendi adıyla yazılır
  const kalemAd = (i) => (i.type === 'support' ? i.name : pname(i.pid));
  const indirimYazi = (o) => { const d = o.indirim; if (!d || !d.kural) return o.discount ? `kupon ${o.coupon}` : ''; return d.kural === 'kupon' ? `Kupon ${o.coupon || ''} %${d.yuzde}` : d.kural === 'teklif' ? d.ad : `${d.ad} %${d.yuzde}`; };
  const OST = { 'odeme-bekliyor': ['Ödeme bekliyor', 'warn'], odendi: ['Ödendi', 'ok'], iptal: ['İptal', ''] };
  const LST = { talep: ['Deneme talebi', 'warn'], deneme: ['Deneme', 'info'], aktif: ['Aktif', 'ok'], askida: ['Askıda', 'err'], iptal: ['İptal', ''] };
  const lstB = (l) => (new Date(l.end) < new Date() ? badge('Süresi doldu', 'err') : badge(LST[l.status][0], LST[l.status][1]));
  const dt = (d) => (d ? NS.dt(d) : '-');
  let ME = null;

  // ---------- Kurulum sihirbazı ----------
  async function setup(st) {
    let step = !st.configured ? 1 : !st.hasAdmin ? 3 : 4;
    const draw = () => {
      document.body.innerHTML = `<div class="wiz"><div class="row nw mb">${NS.logoMark('#4f46e5', 44)}<div><b style="font-size:20px">NEBSOFT kurulum</b><div class="small muted">Canlıya geçiş: veritabanı ve ilk yönetici · <a href="index.html?demo=1">Kurulum yapmadan demo yönetim merkezini aç</a></div></div></div>
        <div class="steps">${['1. Veritabanı SQL', '2. Bağlantı', '3. Yönetici'].map((s, i) => `<span class="${i + 1 === Math.min(step, 3) ? 'on' : ''}">${s}</span>`).join('')}</div><div class="card pad" id="body"></div></div>`;
      const b = $('#body');
      if (step === 1) {
        b.innerHTML = `<h2 class="mb">MySQL veritabanı ve kullanıcı oluşturma</h2><p class="muted mb">Aşağıdaki bilgileri girin; size MySQL sunucunuzda çalıştıracağınız SQL'i ve güçlü bir şifre üretelim. Uygulama kullanıcısı yalnızca kendi veritabanına yetkili olur.</p>
          <div class="form-grid" id="f">${NS.fieldsHtml([{ name: 'database', label: 'Veritabanı adı', value: 'nebsoft' }, { name: 'user', label: 'Uygulama kullanıcısı', value: 'nebsoft_app' }, { name: 'host', label: 'Bağlanacak sunucunun IP adresi', value: '%', hint: 'Uygulama sunucusunun IP adresi (ör. 10.0.0.5). % her yerden izin verir — önerilmez.' }])}</div>
          <button class="btn primary mt" id="gen">${icon('zap')} SQL üret</button><div id="out" class="mt"></div>
          <div class="row mt"><span class="grow"></span><button class="btn" id="skip">SQL'i çalıştırdım, devam →</button></div>`;
        $('#gen').onclick = async () => { try { const r = await api('POST', '/api/setup/sql', NS.readForm($('#f'))); window.__pw = r.password; $('#out').innerHTML = `<pre class="sql" id="sq">${esc(r.sql)}</pre><div class="row"><button class="btn sm" id="cp">${icon('copy')} Kopyala</button><span class="small muted">Şifreyi güvenli bir yere kaydedin; bir sonraki adımda gerekecek.</span></div>`; $('#cp').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(r.sql); toast('SQL kopyalandı', 'ok'); }; } catch (e) { toast(e.message, 'err'); } };
        $('#skip').onclick = () => { step = 2; draw(); };
      } else if (step === 2) {
        b.innerHTML = `<h2 class="mb">MySQL bağlantı bilgileri</h2><p class="muted mb">Bilgiler sunucuda şifrelenerek saklanır; tarayıcıya geri gönderilmez.</p>
          <div class="form-grid" id="f">${NS.fieldsHtml([{ name: 'host', label: 'MySQL sunucu IP / adres', required: true, placeholder: '10.0.0.10' }, { name: 'port', label: 'Port', value: '3306' }, { name: 'database', label: 'Veritabanı adı', value: 'nebsoft', required: true }, { name: 'user', label: 'Kullanıcı adı', value: 'nebsoft_app', required: true }, { name: 'password', label: 'Şifre', type: 'password', value: window.__pw || '', required: true }, { name: 'ssl', label: 'SSL ile bağlan (uzak sunucuda önerilir)', type: 'checkbox' }, { name: 'token', label: 'Kurulum anahtarı', required: true, hint: 'Sunucuyu ilk başlattığınızda ekrana yazılan anahtar (data/setup-token.txt)' }])}</div>
          <div class="row mt"><button class="btn" id="bk">← Geri</button><span class="grow"></span><button class="btn primary" id="go">${icon('check')} Bağlan ve tabloları oluştur</button></div>`;
        $('#bk').onclick = () => { step = 1; draw(); };
        $('#go').onclick = async () => { if (!NS.validate($('#f'))) return; const v = NS.readForm($('#f')); window.__tok = v.token; try { const r = await api('POST', '/api/setup/db', v); toast(`Bağlandı: ${r.server}`, 'ok'); step = 3; draw(); } catch (e) { toast(e.message, 'err'); } };
      } else {
        b.innerHTML = `<h2 class="mb">İlk yönetici hesabı</h2><p class="muted mb">Bu hesap tüm sistemi yönetir. Şifre en az 12 karakter, harf ve rakam içermeli.</p>
          <div class="form-grid" id="f">${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'pass', label: 'Şifre', type: 'password', required: true }, { name: 'token', label: 'Kurulum anahtarı', required: true, value: window.__tok || '' }])}</div>
          <div class="row mt"><span class="grow"></span><button class="btn primary" id="go">${icon('check')} Yöneticiyi oluştur</button></div>`;
        $('#go').onclick = async () => { if (!NS.validate($('#f'))) return; try { await api('POST', '/api/setup/admin', NS.readForm($('#f'))); toast('Kurulum tamamlandı', 'ok'); boot(); } catch (e) { toast(e.message, 'err'); } };
      }
    };
    draw();
  }

  // Yönetim girişi: aynı sahne, koyu lacivert tonlar, "yalnızca yetkili" rozeti
  function adminLogin() {
    const A = NS.auth;
    document.body.innerHTML = `<div class="ax admin">${A.scene('admin')}<header class="ax-top"><span class="ax-brand">${NS.logoMark('#818cf8', 34)}<span class="wm"><b>NEB</b><i>SOFT</i></span></span><span class="grow"></span><a class="ax-link" href="../">${icon('back')} Siteye dön</a></header>
      <main class="ax-main solo"><section><div class="ax-card">${A.halo(`<span style="position:relative;color:#c7d2fe">${icon('shield', 'ico-lg')}</span>`)}<span class="ax-badge">${icon('lock')} Yalnızca yetkili personel</span><h2>Yönetim paneli</h2><p class="ax-sub">Siparişler, lisanslar, ürünler ve site ayarları. Tüm girişler güvenlik kaydına yazılır.</p>
        <form class="ax-form" id="f" novalidate><div class="ax-err" hidden></div>${A.field('email', 'Yönetici e-postası', { type: 'email', ac: 'username', extra: 'autofocus' })}${A.field('pass', 'Şifre', { type: 'password', ac: 'current-password' })}${A.button('go', 'Panele giriş yap', 'shield')}</form>
        <p class="ax-legal mt">5 hatalı denemede hesap 15 dakika kilitlenir.</p></div></section></main></div>`;
    A.bind(document.body);
    $('#f').onsubmit = async (e) => {
      e.preventDefault(); const v = NS.readForm($('#f')); const b = $('#go');
      if (!v.email || !v.pass) return A.err(document.body, 'E-posta ve şifre gerekli');
      A.busy(b, true);
      try { let r = await api('POST', '/api/auth/login', v);
        if (r.needCode) { A.busy(b, false); const t = r.ticket; const card = $('.ax-card'); card.innerHTML = `${A.halo(`<span style="position:relative;color:#c7d2fe">${icon('mail', 'ico-lg')}</span>`)}<h2>Giriş kodu</h2><p class="ax-sub">${esc(r.to)} adresine gönderilen 6 haneli kodu girin.</p><form class="ax-form" id="cf" novalidate><div class="ax-err" hidden></div>${A.otp()}${A.button('cgo', 'Panele giriş yap', 'shield')}</form>`; const val = A.bindOtp(card, () => $('#cf').requestSubmit()); $('#cf').onsubmit = async (ev) => { ev.preventDefault(); const bb = $('#cgo'); A.busy(bb, true); try { const x = await api('POST', '/api/auth/login', { ...v, ticket: t, code: val() }); if (!['admin', 'superadmin'].includes(x.role)) { await api('POST', '/api/auth/logout'); throw new Error('Bu hesabın yönetim yetkisi yok'); } await A.done(bb); boot(); } catch (y) { A.busy(bb, false); A.err(document.body, y.message); } }; return; }
        if (r.needTotp) {
          A.busy(b, false); const card = $('.ax-card');
          const ciz = (kurtarma) => {
            card.innerHTML = `${A.halo(`<span style="position:relative;color:#c7d2fe">${icon('shield', 'ico-lg')}</span>`)}<h2>${kurtarma ? 'Kurtarma kodu' : 'Uygulama kodu'}</h2><p class="ax-sub">${kurtarma ? 'Kurulumda sakladığınız kodlardan birini yazın. Her kod bir kez kullanılır.' : 'Doğrulama uygulamanızdaki 6 haneli kodu girin.'}</p><form class="ax-form" id="cf" novalidate><div class="ax-err" hidden></div>${kurtarma ? A.field('rc', 'Kurtarma kodu', { ac: 'off', extra: 'autofocus' }) : A.otp()}${A.button('cgo', 'Panele giriş yap', 'shield')}<div class="ax-row"><a href="#" id="alt">${kurtarma ? 'Uygulama kodu gir' : 'Kurtarma kodu kullan'}</a></div></form>`;
            A.bind(card); const val = kurtarma ? () => $('#cf [name=rc]').value : A.bindOtp(card, () => $('#cf').requestSubmit());
            $('#alt').onclick = (ev) => { ev.preventDefault(); ciz(!kurtarma); };
            $('#cf').onsubmit = async (ev) => { ev.preventDefault(); const bb = $('#cgo'); A.busy(bb, true); try { const x = await api('POST', '/api/auth/login', { totpTicket: r.totpTicket, code: val() }); if (!['admin', 'superadmin'].includes(x.role)) { await api('POST', '/api/auth/logout'); throw new Error('Bu hesabın yönetim yetkisi yok'); } if (x.kurtarmaKalan !== undefined) toast(`Kurtarma kodu kullanıldı. Kalan kod: ${x.kurtarmaKalan}`, x.kurtarmaKalan <= 2 ? 'warn' : 'ok'); await A.done(bb); boot(); } catch (y) { A.busy(bb, false); A.err(document.body, y.message); } };
          };
          ciz(false); return;
        }
        if (!['admin', 'superadmin'].includes(r.role)) { await api('POST', '/api/auth/logout'); throw new Error('Bu hesabın yönetim yetkisi yok'); } await A.done(b); boot(); }
      catch (x) { A.busy(b, false); A.err(document.body, x.message); }
    };
  }
  function login() {
    if (NS.auth) return adminLogin();
    document.body.innerHTML = `<div class="ns-login"><div class="card"><div class="row nw mb">${NS.logoMark('#4f46e5', 48)}<div><b style="font-size:17px">NEBSOFT Yönetim</b><div class="small faint">Yalnızca yetkili personel</div></div></div>
      <form id="f" onsubmit="return false" class="col"><div class="field"><label>E-posta</label><input class="input lg" name="email" type="email" autocomplete="username" required></div><div class="field"><label>Şifre</label><input class="input lg" name="pass" type="password" autocomplete="current-password" required></div><button class="btn primary lg block" id="go">Giriş</button></form></div></div>`;
    const go = async () => { if (!NS.validate($('#f'))) return; try { const r = await api('POST', '/api/auth/login', NS.readForm($('#f'))); if (!['admin', 'superadmin'].includes(r.role)) { await api('POST', '/api/auth/logout'); return toast('Bu hesabın yönetim yetkisi yok', 'err'); } boot(); } catch (e) { toast(e.message, 'err'); } };
    $('#go').onclick = go;
  }

  // ---------- Düzen ----------
  const NAV = [{ sec: 'Satış' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'havale', label: 'Havale Onayları', icon: 'cash', badge: true }, { id: 'siparisler', label: 'Tüm Siparişler', icon: 'receipt' }, { id: 'urunler', label: 'Ürünler & Fiyatlar', icon: 'box' }, { id: 'bankalar', label: 'Banka Hesapları', icon: 'building' }, { id: 'shopier', label: 'Kartla Ödeme (Shopier)', icon: 'card' }, { id: 'kuponlar', label: 'Kuponlar', icon: 'percent' },
    { sec: 'Müşteriler' }, { id: 'denemeler', label: 'Deneme talepleri', icon: 'key' }, { id: 'asistan', label: 'Destek asistanı', icon: 'message' }, { id: 'isletmeler', label: 'İşletmeler & Lisanslar', icon: 'users' }, { id: 'talepler', label: 'Satış Talepleri', icon: 'phone' }, { id: 'teklifler', label: 'Kurumsal Teklifler', icon: 'building' }, { id: 'destek', label: 'Destek', icon: 'message' },
    { id: 'katalog', label: 'Ortak katalog', icon: 'box' }, { sec: 'Analitik' }, { id: 'analitik', label: 'Ziyaret & Dönüşüm', icon: 'trend' }, { id: 'sistem', label: 'Hata & Yavaşlık', icon: 'alert' },
    { sec: 'İletişim' }, { id: 'eposta', label: 'E-posta ayarları', icon: 'mail' }, { id: 'kampanya', label: 'E-posta gönder', icon: 'send' },
    { sec: 'Sistem' }, { id: 'duyuru', label: 'Duyurular & Bakım', icon: 'bell' }, { id: 'ayarlar', label: 'Site Ayarları', icon: 'settings' }, { id: 'yoneticiler', label: 'Yöneticiler', icon: 'shield' }, { id: 'veritabani', label: 'Veritabanı', icon: 'data' }, { id: 'kayitlar', label: 'Güvenlik Kayıtları', icon: 'list' }];
  (window.PANEL_EK ? window.PANEL_EK.nav : []).forEach((n) => NAV.splice(NAV.findIndex((x) => x.id === n.after) + 1, 0, n)); // admin/panel-ek.js
  function layout() {
    document.body.innerHTML = `<div class="ns-app"><aside class="ns-side" id="side"><div class="ns-brand">${NS.logoMark('#4f46e5', 40)}<div><b>NEBSOFT</b><span>Yönetim paneli</span></div></div><nav class="ns-nav">${NAV.map((n) => (n.sec ? `<div class="sec">${n.sec}</div>` : `<a href="#/${n.id}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span>${n.badge ? '<span class="badge warn hide" style="margin-left:auto" id="nb"></span>' : ''}</a>`)).join('')}</nav><div class="ns-side-foot"><a class="btn ghost block" style="justify-content:flex-start" href="../" target="_blank">${icon('store')} Siteyi aç</a></div></aside>
      <main class="ns-main"><header class="ns-top"><button class="btn ghost icon ns-burger" id="bg">${icon('menu')}</button><div class="title" id="ttl"></div><button class="btn ghost icon" id="th">${icon(NS.getTheme() === 'dark' ? 'sun' : 'moon')}</button><div class="ns-user"><div class="avatar">${esc(NS.initials(ME.user.name))}</div><div class="name small"><b>${esc(ME.user.name)}</b><div class="faint" style="font-size:11px">${ME.user.role === 'superadmin' ? 'Süper yönetici' : 'Yönetici'}</div></div></div><button class="btn ghost" id="lo">${icon('logout')}</button></header><section class="ns-content" id="view"></section></main></div>`;
    $('#bg').onclick = () => $('#side').classList.toggle('open');
    $('#th').onclick = NS.toggleTheme;
    $('#lo').onclick = async () => { await api('POST', '/api/auth/logout').catch(() => {}); boot(); };
  }
  const ROUTES = { ...(window.PANEL_EK ? window.PANEL_EK.routes : {}) };
  async function render() {
    const [r, p] = (location.hash.replace(/^#\/?/, '') || 'ozet').split('/');
    const nav = NAV.find((n) => n.id === r) || NAV[1];
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav.id));
    $('#ttl').textContent = nav.label; $('#side').classList.remove('open');
    const old = $('#view'); const el = old.cloneNode(false); old.replaceWith(el);
    el.innerHTML = NS.skeleton ? NS.skeleton(5) : '<div class="empty">Yükleniyor…</div>'; // veri gelene kadar iskelet
    try { await ROUTES[nav.id](el, p); } catch (e) { if (e.status === 401) return boot(); el.innerHTML = `<div class="card pad"><b>Hata:</b> ${esc(e.message)}</div>`; }
    api('GET', '/api/admin/orders?status=odeme-bekliyor').then((x) => { const b = $('#nb'); if (b) { b.textContent = x.orders.length; b.classList.toggle('hide', !x.orders.length); } }).catch(() => {});
  }
  window.addEventListener('hashchange', () => { if ($('#view')) render(); });

  // ---------- Sayfalar ----------
  ROUTES.ozet = async (el) => {
    const s = await api('GET', '/api/admin/summary');
    el.innerHTML = pageHead('Özet', `Veritabanı: ${esc(s.db ? `${s.db.host}/${s.db.database} · ${s.db.version}` : '-')}`) + `
      <div class="grid g4 mb">${kpi('Havale bekleyen', `${s.pending.n}`, 'cash', s.pending.n ? 'warn' : 'ok', `<div class="small faint">${money(s.pending.t)}</div>`)}${kpi('30 gün tahsilat', money(s.paid30.t), 'trend', 'ok', `<div class="small faint">${s.paid30.n} sipariş</div>`)}${kpi('İşletme', s.tenants, 'users', 'info', `<div class="small faint">${s.lic.aktif || 0} aktif · ${s.lic.deneme || 0} deneme lisansı</div>`)}${kpi('Yeni talep / açık destek', `${s.leads} / ${s.tickets}`, 'message', 'acc')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Son 30 gün tahsilat</h3></div><div class="card-b">${s.daily.length ? chart.bars(s.daily.map((d) => ({ label: NS.date(d.d).slice(0, 5), value: Number(d.t) }))) : '<span class="small faint">Henüz tahsilat yok</span>'}</div></div>
      <div class="card"><div class="card-h"><h3>Yeni kayıtlar (30 gün)</h3></div><div class="card-b">${s.signups.length ? chart.bars(s.signups.map((d) => ({ label: NS.date(d.d).slice(0, 5), value: Number(d.n) }))) : '<span class="small faint">Henüz kayıt yok</span>'}</div></div></div>
      <div class="card"><div class="card-h"><h3>${icon('clock')} 7 gün içinde bitecek lisanslar — arayın, yenilesin</h3></div>${table({ rows: s.ending.map((x, i) => ({ ...x, id: i })), empty: 'Bitecek lisans yok', columns: [{ label: 'İşletme', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.phone || '')}</div>` }, { label: 'Ürün', render: (x) => esc(pname(x.product)) }, { label: 'Durum', render: (x) => badge(LST[x.status][0], LST[x.status][1]) }, { label: 'Bitiş', render: (x) => dt(x.end) }] })}</div>`;
  };
  function ordersTable(el, rows, opts = {}) {
    return table({ rows, emptyIcon: 'receipt', empty: opts.empty || 'Sipariş yok', columns: [
      { label: 'Sipariş', render: (o) => `<b class="mono">${esc(o.no)}</b><div class="small faint">${dt(o.created)}</div>` },
      { label: 'İşletme', render: (o) => `<b>${esc(o.tenant)}</b><div class="small faint">${esc(o.email)} · ${esc(o.phone || '')}</div>` },
      { label: 'Ürünler', render: (o) => o.items.map((i) => (i.type === 'support' ? `<div class="small">${badge('Destek', 'info')} ${esc(i.name)} · ${i.period === 'yillik' ? 'yıllık' : 'aylık'} · ${money(i.price)}</div>` : `<div class="small">${esc(pname(i.pid))} · ${planName(i.plan)} · ${i.period === 'yillik' ? 'yıllık' : 'aylık'}${i.qty > 1 ? ` · ${i.qty} lisans` : ''}</div>`)).join('') },
      { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>${o.discount ? `<div class="small faint">${esc(indirimYazi(o))} · -${money(o.discount)}</div>` : ''}${o.indirim && o.indirim.beyan ? `<div class="small" title="Müşteri beyanı, doğrulanmadı">${icon('alert')} Şube beyanı: <b>${o.indirim.beyan.subeSayisi}</b></div>` : ''}` },
      { label: 'Durum', render: (o) => badge(OST[o.status][0], OST[o.status][1]) + (o.paid_at ? `<div class="small faint">${dt(o.paid_at)}</div>` : '') + (o.note ? `<div class="small faint">${esc(o.note)}</div>` : '') + (o.shopier ? `<div class="mt">${badge('Shopier', 'info')}</div>${o.shopier.alert ? `<div class="small" style="color:var(--err)">${icon('alert')} ${esc(o.shopier.alert)}</div>` : ''}` : '') },
    ], actions: [{ icon: 'check', act: 'ok', title: 'Ödendi — lisansı aç', show: (o) => o.status === 'odeme-bekliyor' }, { icon: 'x', act: 'no', title: 'Reddet', show: (o) => o.status === 'odeme-bekliyor' }, { icon: 'print', act: 'pr', title: 'Bilgi fişi' }] });
  }
  function bindOrders(el, rows, redraw) {
    on(el, 'click', '[data-act]', async (e, b) => {
      const o = rows.find((x) => x.id === b.dataset.id); if (!o) return;
      if (b.dataset.act === 'ok') { const v = await formModal({ title: `${o.no} — ödeme alındı mı?`, fields: [{ name: 'note', label: 'Not (dekont no, gönderen adı)', full: true }], submitLabel: 'Ödendi, lisansı aç', extra: `<p class="small muted">${esc(o.tenant)} · <b>${money(o.total)}</b> · açıklamada <b>${esc(o.no)}</b> yazmalı. Banka hesabınızda tutarı gördükten sonra onaylayın.</p>` }); if (!v) return; try { await api('POST', `/api/admin/orders/${o.id}/approve`, v); toast('Ödendi olarak işaretlendi, lisanslar açıldı', 'ok'); redraw(); } catch (x) { toast(x.message, 'err'); } }
      if (b.dataset.act === 'no') { const v = await formModal({ title: `${o.no} reddet`, fields: [{ name: 'note', label: 'Neden', value: 'Ödeme alınmadı', full: true }], submitLabel: 'Reddet' }); if (!v) return; try { await api('POST', `/api/admin/orders/${o.id}/reject`, v); toast('Sipariş iptal edildi', 'ok'); redraw(); } catch (x) { toast(x.message, 'err'); } }
      if (b.dataset.act === 'pr') NS.printHtml(`<div class="doc"><h2>Sipariş ${esc(o.no)}</h2><p>${esc(o.tenant)} · ${esc(o.email)}</p><table><tr><th>Ürün</th><th>Paket</th><th>Dönem</th><th style="text-align:right">Tutar</th></tr>${o.items.map((i) => `<tr><td>${esc(kalemAd(i))}</td><td>${i.type === 'support' ? 'Destek' : planName(i.plan)}</td><td>${i.period}</td><td style="text-align:right">${money(i.price)}</td></tr>`).join('')}${o.discount ? `<tr><td colspan="3">İndirim (${esc(indirimYazi(o))})</td><td style="text-align:right">-${money(o.discount)}</td></tr>` : ''}<tr><td colspan="3">KDV</td><td style="text-align:right">${money(o.vat)}</td></tr><tr><td colspan="3"><b>Toplam</b></td><td style="text-align:right"><b>${money(o.total)}</b></td></tr></table><p>Fatura: ${esc(o.billing.name || '')} · ${esc(o.billing.company || '')} · VKN/TCKN ${esc(o.billing.taxNo || '')} · ${esc(o.billing.taxOffice || '')}<br>${esc(o.billing.address || '')} ${esc(o.billing.city || '')}</p></div>`, { title: o.no });
    });
  }
  ROUTES.havale = async (el) => {
    const draw = async () => { const r = await api('GET', '/api/admin/orders?status=odeme-bekliyor'); el.innerHTML = pageHead('Havale Onayları', 'Banka hesabınıza ödeme gelince "Ödendi" ile onaylayın — lisans anında açılır') + `<div class="card pad mb small">${icon('info')} Müşteri havale açıklamasına sipariş numarasını yazar. Hesap hareketinizde numarayı ve tutarı görünce onaylayın. Ödeme gelmezse reddedin; müşterinin deneme süresi devam eder.</div><div class="card">${ordersTable(el, r.orders, { empty: 'Onay bekleyen havale yok' })}</div>`; bindOrders(el, r.orders, () => render()); };
    await draw();
  };
  ROUTES.siparisler = async (el) => {
    let st = ''; const draw = async () => { const r = await api('GET', '/api/admin/orders' + (st ? `?status=${st}` : '')); $('#t', el).innerHTML = ordersTable(el, r.orders); rows = r.orders; };
    let rows = [];
    el.innerHTML = pageHead('Tüm Siparişler', '') + `<div class="card"><div class="card-h"><div class="seg">${[['', 'Tümü'], ['odeme-bekliyor', 'Ödeme bekleyen'], ['odendi', 'Ödendi'], ['iptal', 'İptal']].map(([v, l]) => `<button data-f="${v}" class="${v === st ? 'active' : ''}">${l}</button>`).join('')}</div><button class="btn sm" id="csv">${icon('download')} CSV</button></div><div id="t"></div></div>`;
    on(el, 'click', '[data-f]', async (e, b) => { st = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); await draw(); });
    $('#csv', el).onclick = () => NS.csv('siparisler', rows, [{ key: 'no', label: 'No' }, { label: 'Tarih', value: (o) => dt(o.created) }, { key: 'tenant', label: 'İşletme' }, { key: 'email', label: 'E-posta' }, { label: 'Ürünler', value: (o) => o.items.map(kalemAd).join(' + ') }, { key: 'subtotal', label: 'Ara toplam' }, { key: 'discount', label: 'İndirim' }, { label: 'İndirim türü', value: (o) => indirimYazi(o) }, { label: 'Şube beyanı', value: (o) => (o.indirim && o.indirim.beyan ? o.indirim.beyan.subeSayisi : '') }, { key: 'vat', label: 'KDV' }, { key: 'total', label: 'Toplam' }, { label: 'Durum', value: (o) => OST[o.status][0] }, { label: 'VKN', value: (o) => o.billing.taxNo }]);
    bindOrders(el, { find: (f) => rows.find(f) }, draw); await draw();
  };
  // Shopier: anahtar yalnızca yazılır, geri okunmaz. Gerçek hesapla denenene kadar seçenek yalnızca deneme müşterisine görünür.
  ROUTES.shopier = async (el) => {
    const SHST = { uyusmazlik: ['Uyuşmazlık', 'err'], 'cift-odeme': ['Çift ödeme', 'err'] };
    const call = async (fn, msg) => { try { const r = await fn(); if (msg) toast(msg, 'ok'); await draw(); return r; } catch (x) { toast(x.message, 'err'); return null; } };
    const draw = async () => {
      const r = await api('GET', '/api/admin/shopier');
      el.innerHTML = pageHead('Kartla Ödeme (Shopier)', 'Müşteri Shopier güvenli ödeme sayfasında öder; kart bilgisi bu sisteme hiç gelmez.', !r.hasPat ? badge('Anahtar yok', 'warn') : r.live ? badge('Müşterilere açık', 'ok') : badge('Müşterilere kapalı', 'warn')) + `
        ${r.verifiedAt ? `<div class="card pad mb small">${icon('check')} Gerçek hesapla denendi olarak işaretlendi: ${dt(r.verifiedAt)} · ${esc(r.verifiedBy)}</div>` : `<div class="card pad mb" style="background:var(--err-soft,var(--warn-soft));border:0"><b style="color:var(--err)">${icon('alert')} Gerçek hesapla denenmedi</b><div class="small mt">Bu bağlantı Shopier'in resmî dokümanına göre yazıldı ve sahte sunucuyla sınandı; Shopier'in deneme ortamı olmadığı için gerçek mağazada hiç denenmedi. Müşteriler bu seçeneği görmez. Aşağıdaki deneme müşterisiyle düşük tutarlı gerçek bir ödeme yapın; lisans açıldığını, ürünün silindiğini ve tutarın doğru geldiğini gördükten sonra müşterilere açın.</div></div>`}
        ${r.alerts.length ? `<div class="card mb"><div class="card-h"><h3 style="color:var(--err)">${icon('alert')} Elle kontrol gereken ödemeler</h3></div>${table({ rows: r.alerts.map((a) => ({ ...a, id: a.order_id })), empty: '', columns: [{ label: 'Sipariş', render: (a) => `<b class="mono">${esc(a.no)}</b><div class="small faint">${dt(a.updated)}</div>` }, { label: 'Tutar', cls: 'right', render: (a) => money(a.total) }, { label: 'Sorun', render: (a) => `${badge((SHST[a.status] || [a.status, 'err'])[0], 'err')}<div class="small">${esc(a.alert || '')}</div>` }], actions: [{ icon: 'refresh', act: 'recheck', title: 'Shopier’den yeniden sorgula' }] })}<div class="card-b small muted">Lisans otomatik açılmadı. Shopier panelinden ödemeyi kontrol edin; doğruysa Havale Onayları'ndan "Ödendi" ile onaylayın, yanlışsa reddedip Shopier'den iade edin.</div></div>` : ''}
        <div class="grid g-21"><div class="card pad" id="sf"><div class="form-grid">${NS.fieldsHtml([
          { name: 'pat', label: r.hasPat ? 'Kişisel erişim anahtarı (PAT) — kayıtlı, değiştirmek için yazın' : 'Kişisel erişim anahtarı (PAT)', type: 'password', full: true, placeholder: r.hasPat ? '••••••••' : 'Shopier > Hesap > Personal Access Token', hint: 'Şifreli saklanır, bu ekrana ve tarayıcıya geri dönmez.' },
          { name: 'testEmail', label: 'Deneme müşterisi e-postası', type: 'email', full: true, hint: 'Müşterilere açılmadan önce seçeneği yalnızca bu hesap görür.' },
          { name: 'imageUrl', label: 'Ürün görseli adresi (isteğe bağlı)', full: true, placeholder: esc(r.image || 'https://…/gorsel.png'), hint: 'Shopier ürün için görsel ister (jpg, png, bmp; https). Boşsa site adresindeki NEBSOFT simgesi kullanılır.' }], { testEmail: r.testEmail, imageUrl: r.imageUrl })}</div>
          <div class="row mt"><button class="btn primary" id="sv">${icon('check')} Kaydet</button><button class="btn" id="ts" ${r.hasPat ? '' : 'disabled'}>${icon('zap')} Bağlantıyı dene</button><button class="btn" id="wh" ${r.hasPat ? '' : 'disabled'}>${icon('link')} Webhook'u kaydet</button></div>
          <div class="row mt">${r.verifiedAt ? `<button class="btn" id="off">${icon('x')} Müşterilere kapat</button>` : `<button class="btn" id="on" ${r.hasPat ? '' : 'disabled'}>${icon('check')} Gerçek hesapla denedim, müşterilere aç</button>`}${r.hasPat ? `<button class="btn ghost" id="del">${icon('trash')} Anahtarı sil</button>` : ''}</div></div>
        <div class="card pad small"><h3 class="mb">${icon('info')} Durum</h3><div class="list-item"><span class="grow muted">Bekleyen ödeme bağlantısı</span><b>${r.pending}</b></div><div class="list-item"><span class="grow muted">Webhook</span>${r.webhook.registered ? badge('Kayıtlı', 'ok') : badge('Kayıtlı değil', 'warn')}</div><div class="list-item"><span class="grow muted">Son geçerli webhook</span><span>${r.webhook.lastAt ? dt(r.webhook.lastAt) : 'Henüz yok'}</span></div><p class="muted mt">Webhook yoksa veya imza tutmazsa ödemeler yine de Shopier'den sorgulanarak yakalanır, yalnızca biraz daha geç görünür. Lisans her durumda Shopier'den okunan siparişte ürün, adet, para birimi ve tutar tuttuktan sonra açılır.</p><p class="mono" style="word-break:break-all">${esc(r.webhook.url)}</p></div></div>`;
      $('#sv', el).onclick = () => { const v = NS.readForm($('#sf', el)); if (!v.pat) delete v.pat; call(() => api('PUT', '/api/admin/shopier', v), 'Kaydedildi'); };
      $('#ts', el).onclick = () => call(() => api('POST', '/api/admin/shopier/test'), 'Shopier bağlantısı çalışıyor');
      $('#wh', el).onclick = () => call(() => api('POST', '/api/admin/shopier/webhook'), 'Webhook kaydedildi');
      if ($('#on', el)) $('#on', el).onclick = async () => { if (await confirm('Gerçek hesapla ödeme denemesi yaptınız mı? Bu işlemden sonra tüm müşteriler kartla ödeme seçeneğini görür.')) call(() => api('PUT', '/api/admin/shopier', { verified: true }), 'Müşterilere açıldı'); };
      if ($('#off', el)) $('#off', el).onclick = () => call(() => api('PUT', '/api/admin/shopier', { verified: false }), 'Müşterilere kapatıldı');
      if ($('#del', el)) $('#del', el).onclick = async () => { if (await confirm('Anahtar silinsin mi? Bekleyen ödemeler sorgulanamaz.')) call(() => api('PUT', '/api/admin/shopier', { clear: true }), 'Anahtar silindi'); };
    };
    on(el, 'click', '[data-act="recheck"]', (e, x) => call(() => api('POST', `/api/admin/shopier/kontrol/${x.dataset.id}`), 'Sorgulandı'));
    await draw();
  };
  ROUTES.bankalar = async (el) => {
    let r = { banks: [] };
    const edit = async (b) => { const v = await formModal({ title: b ? 'Hesabı düzenle' : 'Banka hesabı ekle', fields: [{ name: 'holder', label: 'Hesap sahibinin adı soyadı / ünvanı', required: true, full: true }, { name: 'bank', label: 'Banka', required: true }, { name: 'iban', label: 'IBAN', required: true, placeholder: 'TR00 0000 0000 0000 0000 0000 00' }, { name: 'active', label: 'Ödeme sayfasında göster', type: 'checkbox' }], values: b ? { ...b, active: !!b.active } : { active: true } }); if (!v) return; try { await api('POST', '/api/admin/banks', { ...v, id: b && b.id }); toast('Kaydedildi', 'ok'); draw(); } catch (e) { toast(e.message, 'err'); } };
    on(el, 'click', '#add', () => edit(null));
    on(el, 'click', '[data-act]', async (e, x) => { const b = r.banks.find((y) => y.id === x.dataset.id); if (x.dataset.act === 'ed') return edit(b); if (await confirm('Hesap silinsin mi?')) { await api('DELETE', `/api/admin/banks/${b.id}`); draw(); } });
    const draw = async () => {
      r = await api('GET', '/api/admin/banks');
      el.innerHTML = pageHead('Banka Hesapları', 'Ödeme sayfasında müşteriye gösterilen havale/EFT hesapları', `<button class="btn primary" id="add">${icon('plus')} Hesap ekle</button>`) + `<div class="card">${table({ rows: r.banks, empty: 'Henüz hesap yok — müşteriler sipariş veremez', emptyIcon: 'building', columns: [{ label: 'Hesap sahibi (ad soyad / ünvan)', render: (b) => `<b>${esc(b.holder)}</b>` }, { label: 'Banka', render: (b) => esc(b.bank) }, { label: 'IBAN', render: (b) => `<span class="mono">${esc(b.iban.replace(/(.{4})/g, '$1 ').trim())}</span>` }, { label: 'Durum', render: (b) => (b.active ? badge('Gösteriliyor', 'ok') : badge('Gizli')) }], actions: [{ icon: 'edit', act: 'ed' }, { icon: 'trash', act: 'del' }] })}</div>`;
    };
    await draw();
  };
  ROUTES.kuponlar = async (el) => {
    on(el, 'click', '#add', async () => { const v = await formModal({ title: 'Kupon', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'pct', label: 'İndirim %', type: 'number', required: true }, { name: 'max_uses', label: 'En fazla kullanım', type: 'number' }, { name: 'expires', label: 'Son tarih', type: 'date' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], values: { active: true } }); if (!v) return; try { await api('POST', '/api/admin/coupons', v); draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '[data-act=del]', async (e, b) => { if (await confirm('Kupon silinsin mi?')) { await api('DELETE', `/api/admin/coupons/${encodeURIComponent(b.dataset.id)}`); draw(); } });
    const draw = async () => {
      const r = await api('GET', '/api/admin/coupons');
      el.innerHTML = pageHead('Kuponlar', 'Kampanya ve bayi indirim kodları', `<button class="btn primary" id="add">${icon('plus')} Kupon</button>`) + `<div class="card">${table({ rows: r.coupons.map((k) => ({ ...k, id: k.code })), empty: 'Kupon yok', columns: [{ label: 'Kod', render: (k) => `<b class="mono">${esc(k.code)}</b>` }, { label: 'İndirim', render: (k) => '%' + k.pct }, { label: 'Kullanım', render: (k) => `${k.uses}${k.max_uses ? ' / ' + k.max_uses : ''}` }, { label: 'Son tarih', render: (k) => (k.expires ? NS.date(k.expires) : '-') }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) }], actions: [{ icon: 'trash', act: 'del' }] })}</div>`;
    };
    await draw();
  };
  ROUTES.isletmeler = async (el) => {
    let q = '';
    el.innerHTML = pageHead('İşletmeler & Lisanslar', 'Kayıtlı müşteriler, deneme ve ücretli lisanslar') + `<div class="card"><div class="card-h">${NS.searchBox('q', 'İşletme adı veya telefon...')}</div><div id="t"></div></div>`;
    const draw = async () => { const r = await api('GET', '/api/admin/tenants?q=' + encodeURIComponent(q)); $('#t', el).innerHTML = table({ rows: r.tenants, emptyIcon: 'users', empty: 'Henüz kayıtlı işletme yok', columns: [{ label: 'İşletme', render: (t) => `<b>${esc(t.name)}</b>${t.status !== 'active' ? ' ' + badge('Askıda', 'err') : ''}<div class="small faint">${esc(t.owner_email || '')} · ${esc(t.phone || '')}</div>` }, { label: 'Kayıt', render: (t) => dt(t.created) }, { label: 'Lisans', render: (t) => `${t.active_lic ? badge(t.active_lic + ' aktif', 'ok') : ''} ${t.trial_lic ? badge(t.trial_lic + ' deneme', 'info') : ''}` }, { label: 'Toplam ödeme', cls: 'right', render: (t) => money(t.revenue) }], actions: [{ icon: 'eye', act: 'v' }] }); };
    let tm; $('#q', el).oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { q = e.target.value; draw(); }, 300); };
    on(el, 'click', '[data-act=v]', (e, b) => tenantModal(b.dataset.id, draw));
    await draw();
  };
  async function tenantModal(id, after) {
    const r = await api('GET', `/api/admin/tenants/${id}`); const t = r.tenant;
    const m = modal({ title: t.name, size: 'wide', body: `<div class="grid g2"><div class="col"><div class="card pad kv"><b>Telefon</b><span>${esc(t.phone || '-')}</span><b>Vergi</b><span>${esc(t.tax_no || '-')} ${esc(t.tax_office || '')}</span><b>Adres</b><span>${esc(t.address || '-')} ${esc(t.city || '')}</span><b>Kayıt</b><span>${dt(t.created)}</span><b>Davet kodu</b><span class="mono">${esc(t.ref_code)}</span><b>Durum</b><span>${t.status === 'active' ? badge('Aktif', 'ok') : badge('Askıda', 'err')}</span></div>
        <div class="card"><div class="card-h"><h3>Kullanıcılar</h3></div>${table({ rows: r.users, columns: [{ label: 'Kullanıcı', render: (u) => `<b>${esc(u.name)}</b><div class="small faint">${esc(u.email)}</div>` }, { label: 'Son giriş', render: (u) => `${dt(u.last_login)}<div class="small faint">${esc(u.last_ip || '')}</div>` }], actions: [{ icon: 'key', act: 'pw', title: 'Şifre sıfırla' }] })}</div>
        <div class="card"><div class="card-h"><h3>Veriler</h3></div>${table({ rows: r.apps.map((a) => ({ ...a, id: a.app })), empty: 'Henüz veri yok', columns: [{ label: 'Uygulama', render: (a) => esc(pname(a.app)) }, { label: 'Sürüm', key: 'version' }, { label: 'Boyut', render: (a) => (a.size / 1024).toFixed(0) + ' KB' }, { label: 'Son kayıt', render: (a) => dt(a.updated) }] })}</div></div>
      <div class="col"><div class="card"><div class="card-h"><h3>Lisanslar</h3><button class="btn sm" id="al">${icon('plus')} Lisans / deneme ver</button></div>${table({ rows: r.licenses, empty: 'Lisans yok', columns: [{ label: 'Ürün', render: (l) => `<b>${esc(pname(l.product))}</b><div class="small faint mono">${esc(l.lic_key)}</div>` }, { label: 'Durum', render: lstB }, { label: 'Bitiş', render: (l) => dt(l.end) }], actions: [{ icon: 'plus', act: 'ext', title: 'Süre uzat' }, { icon: 'lock', act: 'sus', title: 'Askıya al', show: (l) => l.status !== 'askida' }, { icon: 'check', act: 'act', title: 'Aktif et', show: (l) => l.status === 'askida' }] })}</div>
        <div class="card"><div class="card-h"><h3>Siparişler</h3></div>${table({ rows: r.orders, empty: 'Sipariş yok', columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b><div class="small faint">${dt(o.created)}</div>` }, { label: 'Tutar', cls: 'right', render: (o) => money(o.total) }, { label: 'Durum', render: (o) => badge(OST[o.status][0], OST[o.status][1]) }] })}</div></div></div>`,
      actions: [{ label: t.status === 'active' ? 'İşletmeyi askıya al' : 'Askıyı kaldır', cls: t.status === 'active' ? 'danger' : 'primary', onClick: async (c) => { const v = await formModal({ title: t.status === 'active' ? 'Askıya alma nedeni' : 'Not', fields: [{ name: 'note', label: 'Not', full: true }] }); if (!v) return; await api('POST', `/api/admin/tenants/${t.id}`, { status: t.status === 'active' ? 'suspended' : 'active', note: v.note }); c(); after && after(); toast('Güncellendi', 'ok'); } }] });
    const R2 = m.root;
    on(R2, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act; const id2 = b.dataset.id;
      try {
        if (a === 'pw') { if (!(await confirm('Bu kullanıcının şifresi sıfırlansın mı? Yeni şifreyi müşteriye güvenli yoldan iletin.', { danger: false }))) return; const x = await api('POST', `/api/admin/users/${id2}/reset`); modal({ title: 'Yeni geçici şifre', body: `<p>Müşteriye iletin ve ilk girişte değiştirmesini isteyin:</p><p class="mono" style="font-size:20px">${esc(x.password)}</p>` }); return; }
        if (a === 'ext') { const v = await formModal({ title: 'Süre uzat', fields: [{ name: 'days', label: 'Gün', type: 'number', value: 30 }] }); if (!v) return; await api('POST', `/api/admin/licenses/${id2}`, { action: 'extend', days: v.days }); }
        if (a === 'sus') await api('POST', `/api/admin/licenses/${id2}`, { action: 'suspend' });
        if (a === 'act') await api('POST', `/api/admin/licenses/${id2}`, { action: 'activate' });
        m.close(); tenantModal(id, after); toast('Güncellendi', 'ok');
      } catch (x) { toast(x.message, 'err'); }
    });
    $('#al', R2).onclick = async () => { const v = await formModal({ title: 'Lisans / deneme ver', fields: [{ name: 'product', label: 'Ürün', type: 'select', options: C.products.filter((p) => p.ready).map((p) => ({ value: p.id, label: p.name })) }, { name: 'days', label: 'Gün', type: 'number', value: 7 }, { name: 'trial', label: 'Deneme olarak', type: 'checkbox' }], values: { trial: true } }); if (!v) return; try { await api('POST', `/api/admin/tenants/${t.id}/license`, v); m.close(); tenantModal(id, after); } catch (x) { toast(x.message, 'err'); } };
  }
  ROUTES.talepler = async (el) => {
    const r = await api('GET', '/api/admin/leads'); const ST = { yeni: ['Yeni', 'info'], arandi: ['Arandı', 'warn'], kazanildi: ['Kazanıldı', 'ok'], kayip: ['Kayıp', ''] };
    el.innerHTML = pageHead('Satış Talepleri', 'İletişim, demo ve şifre sıfırlama talepleri') + `<div class="card">${table({ rows: r.leads, empty: 'Talep yok', columns: [{ label: 'Kişi', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.phone)} · ${esc(l.email || '')}</div>` }, { label: 'İşletme / ürün', render: (l) => `${esc(l.biz || '')}<div class="small faint">${l.type === 'sifre' ? badge('Şifre sıfırlama', 'warn') : `${esc(pname(l.product || '') || '')} · ${esc(l.type || '')}`}</div>` }, { label: 'Mesaj', render: (l) => `<span class="small">${esc(l.msg || '')}</span>` }, { label: 'Tarih', render: (l) => dt(l.created) }, { label: 'Durum', render: (l) => `<select class="input" data-st="${l.id}" style="height:30px">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>` }] })}</div>`;
    on(el, 'change', '[data-st]', async (e, s) => { await api('POST', `/api/admin/leads/${s.dataset.st}`, { status: s.value }); toast('Güncellendi', 'ok'); });
  };
  const QST = { yeni: ['Yeni', 'warn'], inceleniyor: ['İnceleniyor', 'info'], 'teklif-verildi': ['Teklif verildi', 'acc'], kabul: ['Kabul edildi', 'ok'], siparis: ['Siparişe çevrildi', 'ok'], kayip: ['Kaybedildi', ''] };
  ROUTES.teklifler = async (el) => {
    const draw = async () => {
      const r = await api('GET', '/api/admin/quotes'); const tr = r.turler || {};
      el.innerHTML = pageHead('Kurumsal Teklifler', 'Oda, dernek, bayi ve toplu alım talepleri. Tutar KDV hariçtir.') + `<div class="card">${table({ rows: r.quotes, emptyIcon: 'building', empty: 'Teklif talebi yok', columns: [
        { label: 'Talep', render: (q) => `<b class="mono">${esc(q.no)}</b><div class="small faint">${dt(q.created)}</div>` },
        { label: 'Kurum', render: (q) => `<b>${esc(q.kurum)}</b><div class="small faint">${esc(tr[q.tur] || q.tur)} · ${esc(q.yetkili)}</div><div class="small faint">${esc(q.eposta)} · ${esc(q.telefon)}</div>` },
        { label: 'Kapsam', render: (q) => `<div class="small">${q.lisans} lisans · ${q.sube} şube</div><div class="small faint">${esc(q.program_listesi.map(pname).join(', ') || 'Program seçilmedi')}</div>${q.not ? `<div class="small faint">${esc(q.not)}</div>` : ''}` },
        { label: 'Tutar', cls: 'right', render: (q) => `<b>${q.teklif_tutari === null ? '-' : money(q.teklif_tutari)}</b>${q.gecerlilik ? `<div class="small faint">${NS.date(q.gecerlilik)} tarihine kadar</div>` : ''}` },
        { label: 'Durum', render: (q) => `${badge((QST[q.durum] || [q.durum])[0], (QST[q.durum] || [])[1] || '')}<div class="small faint">Ticari ileti izni: ${q.ticari_izin ? 'var' : 'yok'}</div>` },
      ], actions: [{ icon: 'edit', act: 'ed', title: 'Durum ve tutar', show: (q) => !q.order_id }, { icon: 'receipt', act: 'or', title: 'Siparişe çevir', show: (q) => !q.order_id }] })}</div>`;
      on(el, 'click', '[data-act]', async (e, b) => {
        const q = r.quotes.find((x) => x.id === b.dataset.id); if (!q) return;
        try {
          if (b.dataset.act === 'ed') {
            const v = await formModal({ title: `${q.no} düzenle`, values: { durum: q.durum, teklif_tutari: q.teklif_tutari === null ? '' : q.teklif_tutari, gecerlilik: q.gecerlilik ? new Date(q.gecerlilik).toISOString().slice(0, 10) : '' }, fields: [{ name: 'durum', label: 'Durum', type: 'select', options: r.durumlar.filter((d) => d !== 'siparis').map((d) => ({ value: d, label: QST[d][0] })) }, { name: 'teklif_tutari', label: 'Teklif tutarı (TL, KDV hariç)', type: 'number' }, { name: 'gecerlilik', label: 'Geçerlilik tarihi', type: 'date' }] });
            if (!v) return; await api('POST', `/api/admin/quotes/${q.id}`, v); toast('Kaydedildi', 'ok'); render();
          } else {
            const v = await formModal({ title: `${q.no} siparişe çevir`, values: { eposta: q.eposta, plan: 1, period: 'aylik' }, fields: [{ name: 'eposta', label: 'Müşteri hesabının e-postası', type: 'email', required: true, full: true }, { name: 'plan', label: 'Paket', type: 'select', options: C.plans.map((p, i) => ({ value: i, label: p.name })) }, { name: 'period', label: 'Dönem', type: 'select', options: [{ value: 'aylik', label: 'Aylık' }, { value: 'yillik', label: 'Yıllık' }] }], submitLabel: 'Sipariş oluştur', extra: `<p class="small muted">Sipariş ${q.teklif_tutari === null ? 'tutar girilmeden oluşturulamaz' : `${money(q.teklif_tutari)} + KDV`} ile "ödeme bekliyor" olarak açılır. Lisans ödeme onaylanınca açılır.</p>` });
            if (!v) return; const x = await api('POST', `/api/admin/quotes/${q.id}/siparis`, v); toast(`Sipariş oluşturuldu: ${x.order.no}`, 'ok'); render();
          }
        } catch (x) { toast(x.message, 'err'); }
      });
    };
    await draw();
  };
  ROUTES.destek = async (el) => {
    on(el, 'click', '[data-rs]', async (e, b) => { const v = $(`[data-rt="${b.dataset.rs}"]`, el).value.trim(); if (!v) return; await api('POST', `/api/tickets/${b.dataset.rs}/reply`, { text: v }); draw(); });
    on(el, 'click', '[data-cl]', async (e, b) => { await api('POST', `/api/tickets/${b.dataset.cl}/reply`, { close: true }); draw(); });
    let filtre = ''; on(el, 'click', '[data-tf]', (e, b) => { filtre = b.dataset.tf; draw(); });
    const kalan = (dk) => { const m = Math.abs(dk); const g = Math.floor(m / 1440), s = Math.floor((m % 1440) / 60); return g ? `${g} gün ${s} sa` : s ? `${s} sa ${m % 60} dk` : `${m} dk`; };
    const SLA = { zamaninda: ['Zamanında', 'ok'], yaklasti: ['Süre yaklaşıyor', 'warn'], asildi: ['Aşıldı', 'err'], kapandi: ['Süresinde kapandı', 'ok'], 'gec-kapandi': ['Geç kapandı', 'err'] };
    // Eski taleplerde süre alanı yoktur: yalnızca "Süre yok" yazılır, tahmini süre gösterilmez
    const sla = (t, P) => { const s = t.sla || {}; const p = P.find((x) => x.id === t.plan); if (!SLA[s.durum]) return badge('Süre yok', ''); const son = t.first_reply_at ? t.resolve_due : t.first_due; const ac = !['kapandi', 'gec-kapandi'].includes(s.durum); return `${p ? badge(p.ad, 'acc') : ''}${badge(SLA[s.durum][0], SLA[s.durum][1])}${t.breached && s.durum !== 'asildi' ? badge('Süre aşılmıştı', 'err') : ''}${ac ? `<span class="small">${s.asama === 'cozum' ? 'Çözüm' : 'İlk yanıt'}: ${s.kalanDk < 0 ? `${kalan(s.kalanDk)} geçti` : `${kalan(s.kalanDk)} kaldı`} <span class="faint">(${dt(son)})</span></span>` : ''}`; };
    const draw = async () => {
      const r = await api('GET', '/api/admin/tickets' + (filtre ? `?filtre=${filtre}` : ''));
      el.innerHTML = pageHead('Destek', 'Müşteri talepleri: önce paket önceliği, sonra en yakın son süre') + `<div class="seg mb">${[['', 'Tümü'], ['acik', 'Açık'], ['asildi', 'Süresi aşılan'], ['kapali', 'Kapalı']].map(([v, l]) => `<button data-tf="${v}" class="${v === filtre ? 'active' : ''}">${l}</button>`).join('')}</div>` + (r.tickets.map((t) => `<div class="card mb"><div class="card-h" style="flex-wrap:wrap"><h3>${esc(t.subject)}</h3>${t.product ? badge(pname(t.product), 'acc') : ''}${badge(t.status === 'kapali' ? 'Kapandı' : t.status === 'yanitlandi' ? 'Yanıtlandı' : 'Açık', t.status === 'acik' ? 'warn' : t.status === 'kapali' ? '' : 'ok')}${sla(t, r.paketler)}<span class="grow"></span><span class="small faint">${esc(t.tenant_name || '')} · ${dt(t.updated)}</span></div><div class="card-b col" style="gap:8px">${t.messages.map((m) => `<div class="small"><b>${m.from === 'destek' ? 'Destek' : 'Müşteri'}</b> <span class="faint">${dt(m.at)}</span><div>${esc(m.text)}</div></div>`).join('')}${t.status !== 'kapali' ? `<div class="row nw"><input class="input" data-rt="${t.id}" placeholder="Yanıt yazın..."><button class="btn primary" data-rs="${t.id}">${icon('send')}</button><button class="btn" data-cl="${t.id}">Kapat</button></div>` : ''}</div></div>`).join('') || `<div class="card pad empty">${filtre === 'asildi' ? 'Süresi aşılan talep yok' : 'Destek talebi yok'}</div>`);
    };
    await draw();
  };
  // Ürünler ve fiyatlar: ad, kısa açıklama, 3 paket fiyatı, satışta / gizli, rozet. Değişiklik pazar yerine, sepete, ödemeye ve tanıtım sitelerine anında yansır.
  // Duyurular ve bakım modu: programların üstünde bant gösterilir; bakımda "erişimi kapat" seçilirse program kilitlenir ve kayıt alınmaz
  ROUTES.duyuru = async (el) => {
    let P = (await api('GET', '/api/admin/platform')).platform; P.announcements = P.announcements || []; P.maintenance = P.maintenance || {};
    const save = async () => { try { await api('PUT', '/api/admin/platform', P); toast('Kaydedildi — programlar bir sonraki açılışta / yenilemede gösterir', 'ok'); P = (await api('GET', '/api/admin/platform')).platform; draw(); } catch (x) { toast(x.message, 'err'); } };
    const LV = { info: ['Bilgi', 'info'], warn: ['Uyarı', 'warn'], err: ['Kritik', 'err'] };
    const draw = () => {
      el.innerHTML = pageHead('Duyurular & Bakım', 'Programların üstünde görünen duyuru bantları ve planlı bakım modu', `<button class="btn primary" id="na">${icon('plus')} Duyuru</button>`) + `
        <div class="card mb"><div class="card-h"><h3>Duyurular</h3></div>${table({ rows: P.announcements, empty: 'Duyuru yok', columns: [{ label: 'Başlık', render: (a) => `<b>${esc(a.title)}</b><div class="small faint">${esc(a.body || '')}</div>` }, { label: 'Hedef', render: (a) => (a.products && a.products.length ? a.products.map(pname).join(', ') : 'Tüm programlar') }, { label: 'Seviye', render: (a) => badge(LV[a.level][0], LV[a.level][1]) }, { label: 'Bitiş', render: (a) => a.until || '—' }, { label: 'Durum', render: (a) => (a.active ? badge('Yayında', 'ok') : badge('Kapalı', '')) }], actions: [{ icon: 'edit', act: 'ae' }, { icon: 'trash', act: 'ad' }] })}</div>
        <div class="card"><div class="card-h"><h3>${icon('wrench')} Bakım modu</h3><span class="small muted">Açıkken programın üstünde bakım bandı görünür; "erişimi kapat" seçilirse program kilitlenir.</span></div>${table({ rows: C.products.map((p) => ({ id: p.id, name: p.name, ...(P.maintenance[p.id] || {}) })), columns: [{ label: 'Program', render: (r) => `<b>${esc(r.name)}</b>${r.on ? `<div class="small faint">${esc(r.msg || '')}</div>` : ''}` }, { label: 'Durum', render: (r) => (r.on ? badge(r.block ? 'Bakımda — kapalı' : 'Bakım bandı', r.block ? 'err' : 'warn') : badge('Normal', 'ok')) }], actions: [{ icon: 'wrench', act: 'mt', title: 'Bakım modu' }] })}</div>`;
      $('#na', el).onclick = () => edit(null);
    };
    const edit = async (a) => {
      const v = await formModal({ title: a ? 'Duyuruyu düzenle' : 'Yeni duyuru', fields: [{ name: 'title', label: 'Başlık', required: true, full: true }, { name: 'body', label: 'Metin', type: 'textarea', full: true }, { name: 'level', label: 'Seviye', type: 'select', options: Object.entries(LV).map(([value, [label]]) => ({ value, label })) }, { name: 'until', label: 'Son gösterim tarihi', type: 'date' }, { name: 'products', label: 'Hedef programlar (boş = tümü; virgülle kimlik: pos, adisyon…)', full: true }, { name: 'active', label: 'Yayında', type: 'checkbox' }],
        values: a ? { ...a, products: (a.products || []).join(', ') } : { level: 'info', active: true } });
      if (!v) return; const rec = { ...(a || {}), ...v, products: String(v.products || '').split(',').map((x) => x.trim()).filter(Boolean), active: !!v.active };
      P.announcements = a ? P.announcements.map((x) => (x.id === a.id ? rec : x)) : [{ ...rec, id: Math.random().toString(36).slice(2, 10) }, ...P.announcements]; await save();
    };
    on(el, 'click', '[data-act=ae]', (e, b) => edit(P.announcements.find((x) => x.id === b.dataset.id)));
    on(el, 'click', '[data-act=ad]', async (e, b) => { if (!(await confirm('Duyuru silinsin mi?'))) return; P.announcements = P.announcements.filter((x) => x.id !== b.dataset.id); await save(); });
    on(el, 'click', '[data-act=mt]', async (e, b) => {
      const cur = P.maintenance[b.dataset.id] || {};
      const v = await formModal({ title: `${pname(b.dataset.id)} — bakım modu`, fields: [{ name: 'on', label: 'Bakım modu açık', type: 'checkbox', full: true }, { name: 'msg', label: 'Kullanıcılara gösterilecek mesaj', full: true }, { name: 'block', label: 'Bakım süresince erişimi kapat', type: 'checkbox', full: true }], values: { on: !!cur.on, msg: cur.msg || 'Bu gece 02:00–04:00 arasında planlı bakım yapılacaktır.', block: !!cur.block } });
      if (!v) return; if (v.on) P.maintenance[b.dataset.id] = { on: true, msg: v.msg, block: !!v.block }; else delete P.maintenance[b.dataset.id]; await save();
    });
    draw();
  };
  // E-posta: gönderen adres + uygulama şifresi; doğrulama kodları ve bildirimler bu hesaptan gider
  ROUTES.eposta = async (el) => {
    const draw = async () => {
      const r = await api('GET', '/api/admin/mail'); const m = r.mail || {}; const L = (await api('GET', '/api/admin/mail/log')).rows;
      el.innerHTML = pageHead('E-posta ayarları', 'Kayıt ve giriş doğrulama kodları, sipariş, ödeme ve lisans bildirimleri bu adresten gönderilir.', r.ready ? badge('Etkin', 'ok') : badge('Ayarlanmadı', 'warn')) + `
        <div class="grid g-21"><div class="card pad" id="mf"><div class="form-grid">${NS.fieldsHtml([
          { name: 'provider', label: 'E-posta sağlayıcısı', type: 'select', options: [{ value: 'gmail', label: 'Gmail / Google Workspace' }, { value: 'outlook', label: 'Outlook / Microsoft 365' }, { value: 'yandex', label: 'Yandex / Yandex 360' }, { value: 'yaani', label: 'Yaani Mail' }, { value: 'custom', label: 'Diğer (SMTP sunucusu)' }] },
          { name: 'user', label: 'Ana e-posta adresi', type: 'email', required: true, placeholder: 'destek@firmaniz.com' },
          { name: 'pass', label: m.pass ? 'Uygulama şifresi (kayıtlı — değiştirmek için yazın)' : 'Uygulama şifresi', type: 'password', placeholder: 'abcd efgh ijkl mnop', hint: 'Hesap şifreniz değil; sağlayıcının verdiği 16 haneli uygulama şifresi' },
          { name: 'fromName', label: 'Gönderen adı', placeholder: 'NEBSOFT' }, { name: 'replyTo', label: 'Yanıt adresi (isteğe bağlı)', type: 'email' },
          { name: 'host', label: 'SMTP sunucusu (Diğer seçiliyse)', placeholder: 'smtp.firmaniz.com' }, { name: 'port', label: 'Port', type: 'number', placeholder: '465' },
          { type: 'section', label: 'Kullanım' }, { name: 'enabled', label: 'E-posta gönderimi açık', type: 'checkbox', full: true }, { name: 'verifySignup', label: 'Kayıtta e-posta doğrulama kodu iste', type: 'checkbox', full: true }, { name: 'twoFactorLogin', label: 'Her girişte e-postaya doğrulama kodu gönder (iki adımlı giriş)', type: 'checkbox', full: true }],
          { provider: m.provider || 'gmail', user: m.user || '', fromName: m.fromName || 'NEBSOFT', replyTo: m.replyTo || '', host: m.provider === 'custom' ? m.host : '', port: m.provider === 'custom' ? m.port : '', enabled: m.enabled !== false, verifySignup: m.verifySignup !== false, twoFactorLogin: !!m.twoFactorLogin })}</div>
          <div class="row mt"><button class="btn primary" id="sv">${icon('check')} Kaydet</button><input class="input" id="tt" type="email" placeholder="Test alıcısı (boşsa sizin adresiniz)" style="max-width:280px"><button class="btn" id="ts">${icon('send')} Test e-postası gönder</button></div></div>
        <div class="card pad small"><h3 class="mb">${icon('info')} Gmail uygulama şifresi nasıl alınır?</h3><ol style="padding-left:18px;line-height:1.7;margin:0"><li>Google Hesabı → <b>Güvenlik</b> → <b>2 Adımlı Doğrulama</b>'yı açın.</li><li>Aynı sayfada <b>Uygulama şifreleri</b>'ne girin (myaccount.google.com/apppasswords).</li><li>Uygulama adı olarak <b>NEBSOFT</b> yazıp <b>Oluştur</b>'a basın.</li><li>Çıkan 16 haneli şifreyi buradaki <b>Uygulama şifresi</b> alanına yapıştırın.</li></ol><p class="muted mt">Outlook ve Yandex'te de "Uygulama şifresi" bölümünden aynı şekilde alınır. Şifre sunucuda şifrelenmiş olarak saklanır.</p></div></div>
        <div class="card mt"><div class="card-h"><h3>Gönderim geçmişi</h3><span class="small faint">son 300</span></div>${table({ rows: L.map((x) => ({ ...x, id: String(x.id) })), empty: 'Henüz e-posta gönderilmedi', emptyIcon: 'mail', columns: [{ label: 'Zaman', render: (x) => dt(x.at) }, { label: 'Alıcı', render: (x) => esc(x.to_addr) }, { label: 'Konu', render: (x) => esc(x.subject) }, { label: 'Durum', render: (x) => (x.status === 'hata' ? `${badge('Hata', 'err')}<div class="small faint">${esc(x.detail || '')}</div>` : badge('Gönderildi', 'ok')) }] })}</div>`;
      $('#sv', el).onclick = async () => { const v = NS.readForm($('#mf', el)); if (!v.pass) delete v.pass; try { await api('PUT', '/api/admin/mail', v); toast('E-posta ayarları kaydedildi', 'ok'); draw(); } catch (x) { toast(x.message, 'err'); } };
      $('#ts', el).onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await api('POST', '/api/admin/mail/test', { to: $('#tt', el).value }); toast('Test e-postası gönderildi — gelen kutunuzu kontrol edin', 'ok'); draw(); } catch (x) { toast(x.message, 'err'); b.disabled = false; } };
    };
    await draw();
  };
  // Toplu / tekil e-posta: hazır şablonla, canlı önizlemeli
  ROUTES.kampanya = async (el) => {
    const T = { all: 'Tüm müşteriler', trial: 'Denemesi süren işletmeler', active: 'Lisansı aktif müşteriler', expired: 'Lisansı biten / programı olmayanlar', emails: 'Yalnızca yazdığım adresler' };
    el.innerHTML = pageHead('E-posta gönder', 'Duyuru, kampanya veya bilgilendirme e-postasını NEBSOFT şablonuyla gönderin. Sağda alıcının göreceği hali anında görünür.') + `
      <div class="grid g2" style="align-items:start"><div class="card pad" id="cf"><div class="form-grid">${NS.fieldsHtml([
        { name: 'target', label: 'Alıcılar', type: 'select', full: true, options: Object.entries(T).map(([value, label]) => ({ value, label })) },
        { name: 'emails', label: 'E-posta adresleri (virgül veya satırla)', type: 'textarea', full: true },
        { name: 'subject', label: 'Konu', required: true, full: true, placeholder: 'Yeni: Oto Servis için dijital imza' },
        { name: 'title', label: 'Başlık', full: true, placeholder: 'Teslim formları artık ekranda imzalanıyor' },
        { name: 'intro', label: 'Giriş cümlesi ({ad} alıcının adıyla değişir)', full: true, placeholder: 'Merhaba {ad}, sizin için yeni bir özellik ekledik.' },
        { name: 'body', label: 'Metin (paragrafları boş satırla ayırın)', type: 'textarea', required: true, full: true },
        { name: 'btnLabel', label: 'Düğme yazısı (isteğe bağlı)', placeholder: 'Hemen deneyin' }, { name: 'btnUrl', label: 'Düğme bağlantısı', placeholder: 'https://...' }])}</div>
        <p class="small muted mt">${icon('info')} Tanıtım ve kampanya içerikli ticari e-postalar için alıcının onayı (İYS kaydı) gerekir. Onayı olmayan alıcılara yalnızca hesap ve hizmet bilgilendirmesi gönderin.</p>
        <div class="row mt"><button class="btn" id="pv">${icon('eye')} Önizlemeyi yenile</button><button class="btn primary" id="go">${icon('send')} Gönder</button></div></div>
      <div class="card" style="overflow:hidden"><div class="card-h"><h3>Önizleme</h3><span class="small faint">alıcının gelen kutusundaki görünüm</span></div><iframe id="pf" title="E-posta önizleme" style="width:100%;height:720px;border:0;background:#f1f1f7"></iframe></div></div>`;
    const f = $('#cf', el); const em = () => { const box = f.querySelector('[name=emails]').closest('.field'); box.style.display = f.querySelector('[name=target]').value === 'emails' ? '' : 'none'; };
    const prev = async () => { const v = NS.readForm(f); try { const r = await api('POST', '/api/admin/mail/preview', { ...v, intro: (v.intro || '').replace(/\{ad\}/g, 'Ayşe'), body: v.body || 'Metin burada görünecek.', subject: v.subject || 'Konu' }); $('#pf', el).srcdoc = r.html; } catch (x) { /* yok */ } };
    let t = null; f.addEventListener('input', () => { clearTimeout(t); t = setTimeout(prev, 500); }); f.addEventListener('change', em);
    $('#pv', el).onclick = prev; em(); prev();
    $('#go', el).onclick = async (e) => { const v = NS.readForm(f); if (!NS.validate(f)) return; if (!(await confirm(`"${v.subject}" konulu e-posta ${T[v.target].toLowerCase()} grubuna gönderilsin mi?`))) return; const b = e.currentTarget; b.disabled = true; b.innerHTML = `${icon('clock')} Gönderiliyor…`; try { const r = await api('POST', '/api/admin/mail/campaign', v); toast(`${r.skipped ? `İzinsiz ${r.skipped} kişi atlandı. ` : ''}${r.sent} / ${r.total} alıcıya gönderildi${r.failed ? `, ${r.failed} hata` : ''}`, r.failed ? 'err' : 'ok'); } catch (x) { toast(x.message, 'err'); } b.disabled = false; b.innerHTML = `${icon('send')} Gönder`; };
  };
  // Deneme talepleri: kayıt olan veya programı deneme isteyen işletmeler — onaylayınca N gün aktif olur, müşteriye e-posta gider
  // Destek asistanı: yanıtlanamayan sorular, olumsuz geri bildirimler, eğitim verisi dışa aktarımı
  ROUTES.asistan = async (el) => {
    const KIND = { cevapsiz: ['Yanıtlanamadı', 'err'], belirsiz: ['Emin olunamadı', 'warn'], olumsuz: ['İşe yaramadı', 'warn'], olumlu: ['İşe yaradı', 'ok'] };
    let f = 'acik';
    const draw = async () => {
      const [r, kb] = await Promise.all([api('GET', '/api/admin/destek-sorular'), fetch('../core/kb.json').then((x) => x.json()).catch(() => ({ items: [] }))]);
      const byId = Object.fromEntries(kb.items.map((x) => [x.id, x]));
      const rows = r.rows.filter((x) => (f === 'acik' ? x.kind !== 'olumlu' : x.kind === 'olumlu')).map((x, i) => ({ ...x, id: i }));
      el.innerHTML = pageHead('Destek asistanı', `Bilgi bankasında ${kb.items.length.toLocaleString('tr-TR')} soru var. Müşterilerin yanıt bulamadığı sorular burada toplanır; cevabı site/tools/kb-genel.js dosyasına ekleyip "node site/tools/build-kb.js" ile yeniden üretin.`, `<button class="btn" id="jl">${icon('download')} Eğitim verisi (JSONL)</button>`) +
        `<div class="grid g4 mb">${['cevapsiz', 'belirsiz', 'olumsuz', 'olumlu'].map((k) => kpi(KIND[k][0], r.rows.filter((x) => x.kind === k).reduce((s, x) => s + Number(x.n), 0), 'message', KIND[k][1])).join('')}</div>
        <div class="seg mb" id="sf"><button data-f="acik" class="${f === 'acik' ? 'active' : ''}">İlgilenilmesi gereken</button><button data-f="olumlu" class="${f === 'olumlu' ? 'active' : ''}">Beğenilen yanıtlar</button></div>
        <div class="card">${table({ rows, empty: 'Bekleyen soru yok — asistan şimdilik her şeye yanıt veriyor', emptyIcon: 'message', columns: [
          { label: 'Soru', render: (x) => `<b>${esc(x.q)}</b>${x.entry && byId[x.entry] ? `<div class="small faint">Verilen yanıt: ${esc(byId[x.entry].q)}</div>` : ''}` },
          { label: 'Durum', render: (x) => badge(KIND[x.kind][0], KIND[x.kind][1]) }, { label: 'Nerede', render: (x) => esc(x.app || 'site') },
          { label: 'Kez', cls: 'right', render: (x) => `<b>${x.n}</b>` }, { label: 'Son', render: (x) => dt(x.last) }],
          actions: [{ label: 'Çözüldü', act: 'done' }] })}</div>`;
      on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; draw(); });
      on(el, 'click', '[data-act=done]', async (e, b) => { const x = rows[Number(b.dataset.id)]; await api('POST', '/api/admin/destek-sorular/kapat', { kind: x.kind, q: x.q, app: x.app }); toast('Kapatıldı', 'ok'); draw(); });
      $('#jl', el).onclick = () => { const lines = kb.items.flatMap((x) => [x.q, ...x.alt].map((q) => JSON.stringify({ messages: [{ role: 'user', content: q }, { role: 'assistant', content: x.a }], module: x.m, topic: x.t }))); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'application/jsonl' })); a.download = 'nebsoft-destek-egitim.jsonl'; a.click(); toast(`${lines.length.toLocaleString('tr-TR')} soru-cevap çifti indirildi`, 'ok'); };
    };
    el.innerHTML = NS.skeleton(5); draw().catch((e) => { el.innerHTML = `<div class="card pad">${esc(e.message)}</div>`; });
  };
  ROUTES.denemeler = async (el) => {
    const draw = async () => {
      const r = await api('GET', '/api/admin/trial-requests');
      el.innerHTML = pageHead('Deneme talepleri', 'Hesaplar ücretsiz açılır ama lisanssızdır. Deneme isteyen işletmeyi arayıp onaylayın; seçtiğiniz süre kadar aktif olur.') + `<div class="card">${table({ rows: r.rows, empty: 'Bekleyen deneme talebi yok', emptyIcon: 'key', columns: [
        { label: 'İşletme', render: (x) => `<b>${esc(x.biz || '-')}</b><div class="small faint">${esc(x.uname || '')} · ${esc(x.phone || '')}</div><div class="small faint">${esc(x.email || '')}</div>` },
        { label: 'Program', render: (x) => badge(pname(x.product), 'acc') }, { label: 'Sektör', render: (x) => esc(x.sector || '-') }, { label: 'Talep', render: (x) => dt(x.requested) }],
        actions: [{ label: '7 gün aktifleştir', act: 'ok7', cls: 'primary' }, { label: 'Süre seç', act: 'okn' }, { icon: 'x', act: 'no', title: 'Reddet' }] })}</div>`;
    };
    on(el, 'click', '[data-act]', async (e, b) => {
      const id = b.dataset.id; const a = b.dataset.act;
      try {
        if (a === 'ok7') await api('POST', `/api/admin/licenses/${id}/trial`, { days: 7 });
        else if (a === 'okn') { const v = await formModal({ title: 'Deneme süresi', fields: [{ name: 'days', label: 'Gün', type: 'number', value: 14, required: true }] }); if (!v) return; await api('POST', `/api/admin/licenses/${id}/trial`, { days: v.days }); }
        else if (a === 'no') { if (!(await confirm('Deneme talebi reddedilsin mi?'))) return; await api('POST', `/api/admin/licenses/${id}/trial`, { reject: true }); }
        toast(a === 'no' ? 'Talep reddedildi' : 'Deneme aktifleştirildi — müşteriye e-posta gönderildi', 'ok'); draw();
      } catch (x) { toast(x.message, 'err'); }
    });
    await draw();
  };
  ROUTES.urunler = async (el) => {
    let q = '';
    const draw = async () => {
      const r = await api('GET', '/api/admin/catalog'); const ov = r.overrides || {};
      const rows = r.products.filter((p) => !q || NS.match(q, p.name, p.id)).map((p) => ({ ...p, id: p.id }));
      el.innerHTML = pageHead('Ürünler & Fiyatlar', 'Tüm ürünleri buradan yönetin: fiyat (aylık, KDV hariç; yıllıkta 10 ay ödenir), ad, açıklama ve satış durumu. Değişiklik pazar yerine, ödeme hesabına ve tanıtım sitelerine yansır.') + `<div class="card pad mb">${NS.searchBox('pq', 'Ürün ara...')}</div><div class="card">${table({ rows, columns: [
        { label: 'Ürün', render: (p) => `<b>${esc(p.name)}</b> ${ov[p.id] ? badge('Düzenlendi', 'acc') : ''}${p.hidden ? ' ' + badge('Gizli', 'err') : p.ready === false ? ' ' + badge('Satışta değil', 'warn') : ''}<div class="small faint">${esc(p.tagline || '')}</div>` },
        { label: 'Başlangıç', cls: 'right', render: (p) => money(p.prices[0]) }, { label: 'Profesyonel', cls: 'right', render: (p) => `<b>${money(p.prices[1])}</b>` }, { label: 'Kurumsal', cls: 'right', render: (p) => money(p.prices[2]) },
        { label: 'Yıllık (Pro)', cls: 'right', render: (p) => `<span class="small muted">${money(p.prices[1] * 10)}</span>` }],
        actions: [{ icon: 'edit', act: 'ed', title: 'Düzenle' }, { icon: 'refresh', act: 'rs', title: 'Varsayılana döndür', show: (p) => !!ov[p.id] }] })}</div>`;
      const s = $('#pq', el); if (s) { s.value = q; s.oninput = (e) => { q = e.target.value; clearTimeout(s._t); s._t = setTimeout(draw, 250); }; }
    };
    on(el, 'click', '[data-act=ed]', async (e, b) => {
      const r = await api('GET', '/api/admin/catalog'); const p = r.products.find((x) => x.id === b.dataset.id); if (!p) return;
      const v = await formModal({ title: `${p.name} — düzenle`, fields: [{ name: 'name', label: 'Ürün adı', required: true }, { name: 'badge', label: 'Rozet (ör. Yeni, Kampanya)' }, { name: 'tagline', label: 'Kısa açıklama', full: true },
        { type: 'section', label: 'Aylık fiyat (₺, KDV hariç)' }, { name: 'p0', label: 'Başlangıç', type: 'number', required: true }, { name: 'p1', label: 'Profesyonel', type: 'number', required: true }, { name: 'p2', label: 'Kurumsal', type: 'number', required: true },
        { type: 'section', label: 'Durum' }, { name: 'ready', label: 'Satışta (sepete eklenebilir, deneme başlatılabilir)', type: 'checkbox', full: true }, { name: 'hidden', label: 'Sitede tamamen gizle', type: 'checkbox', full: true }],
        values: { name: p.name, badge: p.badge || '', tagline: p.tagline || '', p0: p.prices[0], p1: p.prices[1], p2: p.prices[2], ready: p.ready !== false, hidden: !!p.hidden } });
      if (!v) return;
      try { await api('PUT', `/api/admin/catalog/${p.id}`, { name: v.name, badge: v.badge, tagline: v.tagline, prices: [v.p0, v.p1, v.p2], ready: !!v.ready, hidden: !!v.hidden }); toast('Ürün güncellendi', 'ok'); draw(); } catch (x) { toast(x.message, 'err'); }
    });
    on(el, 'click', '[data-act=rs]', async (e, b) => { if (!(await confirm('Bu ürün varsayılan ad ve fiyatına dönsün mü?'))) return; await api('DELETE', `/api/admin/catalog/${b.dataset.id}`); toast('Varsayılana döndü', 'ok'); draw(); });
    await draw();
  };
  ROUTES.ayarlar = async (el) => {
    const r = await api('GET', '/api/admin/settings');
    el.innerHTML = pageHead('Site Ayarları', 'Marka adı ve satış kuralları. Şirket, iletişim, site adresi ve Search Console Kurulum ve ayarlar ekranındadır.', `<a class="btn" href="#/kurulum">${icon('check')} Kurulum ve ayarlar</a>`) + `<div class="card pad" style="max-width:760px" id="f"><div class="form-grid">${NS.fieldsHtml([{ name: 'siteName', label: 'Marka adı', required: true }, { type: 'section', label: 'Satış kuralları' }, { name: 'trialDays', label: 'Ücretsiz deneme (gün)', type: 'number' }, { name: 'referralDays', label: 'Tavsiye ödülü (gün, iki tarafa)', type: 'number' }], r.site)}</div><button class="btn primary mt" id="sv">${icon('check')} Kaydet</button></div>`;
    $('#sv', el).onclick = async () => { try { await api('PUT', '/api/admin/settings', NS.readForm($('#f', el))); toast('Kaydedildi', 'ok'); } catch (e) { toast(e.message, 'err'); } };
    // Arama motorları: site haritası, işletme sayfaları ve IndexNow bildirimi
    const seo = await api('GET', '/api/admin/seo').catch(() => null);
    if (seo) {
      const box = document.createElement('div'); box.className = 'card pad mt'; box.style.maxWidth = '760px';
      box.innerHTML = `<h3 class="mb">Arama motorları (SEO)</h3><div class="kv"><b>Site adresi</b><span>${esc(seo.base)}</span><b>Site haritası</b><span><a href="/sitemap.xml" target="_blank">${esc(seo.base)}/sitemap.xml</a></span><b>İşletme sayfaları</b><span>${seo.tenants} işletmenin herkese açık sayfası site haritasında</span><b>IndexNow anahtarı</b><span class="mono">${esc(seo.key || '-')}</span></div>
        <p class="small muted mt">Site adresini kaydettikten sonra Google Search Console'a <b>${esc(seo.base)}/sitemap.xml</b> adresini bir kez ekleyin. Bing, Yandex ve diğerlerine aşağıdaki düğmeyle anında bildirim gönderilir; yeni işletmeler eklendikçe tekrar basabilirsiniz.</p>
        <button class="btn primary mt" id="ping">${icon('send')} Arama motorlarına bildir</button>`;
      el.appendChild(box);
      $('#ping', box).onclick = async () => { try { const r = await api('POST', '/api/admin/seo/ping'); if (r.ok) toast(`${r.count} adres bildirildi`, 'ok'); else toast(r.error || `IndexNow yanıtı: ${r.status}`, 'err'); } catch (e) { toast(e.message, 'err'); } };
    }
  };
  // İki adımlı giriş: anahtar yalnızca bu ekranda metin olarak görünür, dış QR servisine gönderilmez
  const kurtarmaKodlari = (kodlar) => modal({ title: 'Kurtarma kodları', closable: false, body: `<p class="small muted mb">Bu kodlar bir daha gösterilmez. Telefonunuza erişemezseniz her kod bir girişte kullanılır. Parola kasası gibi güvenli bir yerde saklayın.</p><div class="mono" id="kk" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 18px;font-size:15px">${kodlar.map((k) => `<span>${esc(k)}</span>`).join('')}</div>`, actions: [{ label: 'Kopyala', onClick: () => { try { navigator.clipboard.writeText(kodlar.join('\n')).then(() => toast('Kopyalandı', 'ok'), () => toast('Kopyalanamadı', 'err')); } catch (e) { toast('Kopyalanamadı', 'err'); } } }, { label: 'Sakladım', cls: 'primary' }] });
  const ikiAdimKur = async (yenile) => {
    const p = await formModal({ title: 'İki adımlı girişi aç', fields: [{ type: 'section', label: 'Kimliğinizi doğrulamak için hesap şifrenizi yazın.' }, { name: 'pass', label: 'Hesap şifreniz', type: 'password', required: true, full: true }], submitLabel: 'Devam' }); if (!p) return;
    let k; try { k = await api('POST', '/api/auth/totp/kur', { pass: p.pass }); } catch (e) { return toast(e.message, 'err'); }
    const adim = `<p class="small muted">Google Authenticator, Microsoft Authenticator veya benzeri bir uygulamada <b>hesap ekle → anahtarı elle gir</b> seçin.</p><div class="small faint mt">Anahtar</div><div class="mono" style="word-break:break-all;font-size:15px">${esc(k.gizli.replace(/(.{4})/g, '$1 ').trim())}</div><div class="small faint mt">otpauth bağlantısı (QR üreten kendi aracınız için)</div><div class="mono small" style="word-break:break-all">${esc(k.otpauth)}</div><p class="small muted mt">Bu ekranda QR gösterilmez: anahtar dış bir servise gönderilmez. Tür: zamana bağlı, 30 saniye, 6 hane.</p>`;
    for (;;) {
      const v = await formModal({ title: 'Doğrulama uygulamasına ekleyin', extra: adim, fields: [{ name: 'code', label: 'Uygulamadaki 6 haneli kod', required: true, full: true }], submitLabel: 'Doğrula ve aç' }); if (!v) return toast('İki adımlı giriş açılmadı', 'warn');
      try { const r = await api('POST', '/api/auth/totp/etkinlestir', { code: v.code }); kurtarmaKodlari(r.kodlar); return yenile(); } catch (e) { toast(e.message, 'err'); if (e.status === 429) return; }
    }
  };
  const ikiAdimOnay = (title, submitLabel) => formModal({ title, fields: [{ name: 'pass', label: 'Hesap şifreniz', type: 'password', required: true, full: true }, { name: 'code', label: 'Uygulama kodu veya kurtarma kodu', required: true, full: true }], submitLabel });
  ROUTES.yoneticiler = async (el) => {
    on(el, 'click', '#tfa', () => ikiAdimKur(draw));
    on(el, 'click', '#tfk', async () => { const v = await ikiAdimOnay('Kurtarma kodlarını yenile', 'Yeni kodlar üret'); if (!v) return; try { kurtarmaKodlari((await api('POST', '/api/auth/totp/kodlar', v)).kodlar); draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '#tfo', async () => { const v = await ikiAdimOnay('İki adımlı girişi kapat', 'Kapat'); if (!v) return; try { await api('POST', '/api/auth/totp/kapat', v); toast('İki adımlı giriş kapatıldı', 'ok'); draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '#add', async () => { const v = await formModal({ title: 'Yönetici ekle', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'pass', label: 'Şifre (en az 12)', type: 'password', required: true }, { name: 'role', label: 'Rol', type: 'select', options: [{ value: 'admin', label: 'Yönetici' }, { value: 'superadmin', label: 'Süper yönetici' }] }] }); if (!v) return; try { await api('POST', '/api/admin/users', v); draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '[data-act]', async (e, b) => { try { if (b.dataset.act === 'pw') { const x = await api('POST', `/api/admin/users/${b.dataset.id}/reset`); modal({ title: 'Yeni geçici şifre', body: `<p class="mono" style="font-size:20px">${esc(x.password)}</p>` }); } else await api('POST', `/api/admin/users/${b.dataset.id}/status`, { status: b.dataset.act === 'onn' ? 'active' : 'disabled' }); draw(); } catch (x) { toast(x.message, 'err'); } });
    on(el, 'click', '#cp', async () => { try { await api('POST', '/api/auth/password', NS.readForm($('#pf', el))); toast('Şifre değişti', 'ok'); } catch (x) { toast(x.message, 'err'); } });
    const draw = async () => {
      const r = await api('GET', '/api/admin/users'); const tf = await api('GET', '/api/auth/totp');
      el.innerHTML = pageHead('Yöneticiler', 'Panel erişimi olan personel', ME.user.role === 'superadmin' ? `<button class="btn primary" id="add">${icon('plus')} Yönetici ekle</button>` : '') + `<div class="card">${table({ rows: r.users, columns: [{ label: 'Kişi', render: (u) => `<b>${esc(u.name)}</b><div class="small faint">${esc(u.email)}</div>` }, { label: 'Rol', render: (u) => badge(u.role === 'superadmin' ? 'Süper yönetici' : 'Yönetici', u.role === 'superadmin' ? 'acc' : 'info') }, { label: 'Durum', render: (u) => (u.status === 'active' ? badge('Aktif', 'ok') : badge('Kapalı', 'err')) }, { label: 'İki adımlı', render: (u) => (u.totp ? badge('Uygulama', 'ok') : badge('Kapalı', 'warn')) }, { label: 'Son giriş', render: (u) => `${dt(u.last_login)}<div class="small faint">${esc(u.last_ip || '')}</div>` }], actions: ME.user.role === 'superadmin' ? [{ icon: 'lock', act: 'off', title: 'Kapat', show: (u) => u.status === 'active' && u.id !== ME.user.id }, { icon: 'check', act: 'onn', title: 'Aç', show: (u) => u.status !== 'active' }, { icon: 'key', act: 'pw', title: 'Şifre sıfırla', show: (u) => u.id !== ME.user.id }] : [] })}</div>
        <div class="card pad mt" style="max-width:560px"><h3 class="mb">İki adımlı giriş</h3>${tf.etkin ? `<p class="small muted">${badge('Açık', 'ok')} Girişte doğrulama uygulamasındaki kod istenir, e-posta kodu istenmez. Kalan kurtarma kodu: <b>${tf.kalan}</b>${tf.kalan <= 2 ? ' · yenilemeniz önerilir' : ''}</p><div class="row mt"><button class="btn" id="tfk">Kurtarma kodlarını yenile</button><button class="btn danger" id="tfo">Kapat</button></div>` : `<p class="small muted">${badge('Kapalı', 'warn')} Açtığınızda girişte şifreye ek olarak telefonunuzdaki doğrulama uygulamasının kodu istenir. Uygulama kuruluysa e-posta altyapısına bağlı kalmaz.</p><button class="btn primary mt" id="tfa">Etkinleştir</button>`}</div>
        <div class="card pad mt" style="max-width:560px" id="pf"><h3 class="mb">Şifremi değiştir</h3>${NS.fieldsHtml([{ name: 'old', label: 'Mevcut şifre', type: 'password' }, { name: 'pass', label: 'Yeni şifre', type: 'password' }])}<button class="btn mt" id="cp">Değiştir</button></div>`;
    };
    await draw();
  };
  ROUTES.veritabani = async (el) => {
    const r = await api('GET', '/api/admin/db');
    el.innerHTML = pageHead('Veritabanı', 'MySQL bağlantısı, tablolar ve kurulum SQL’i') + `<div class="grid g2"><div class="col"><div class="card pad kv"><b>Sunucu</b><span>${esc(r.info.host)}</span><b>Veritabanı</b><span>${esc(r.info.database)}</span><b>Sürüm</b><span>${esc(r.info.version)}</span></div>
      <div class="card">${table({ rows: r.tables.map((t) => ({ ...t, id: t.name })), columns: [{ label: 'Tablo', render: (t) => `<span class="mono">${esc(t.name)}</span>` }, { label: 'Satır (yaklaşık)', cls: 'right', render: (t) => NS.num(t.rows_est || 0) }, { label: 'MB', cls: 'right', render: (t) => t.mb }] })}</div></div>
      <div class="col"><div class="card pad"><h3 class="mb">Yeni sunucu için SQL üret</h3><div class="form-grid" id="g">${NS.fieldsHtml([{ name: 'database', label: 'Veritabanı', value: 'nebsoft' }, { name: 'user', label: 'Kullanıcı', value: 'nebsoft_app' }, { name: 'host', label: 'Uygulama sunucusu IP', value: '%' }])}</div><button class="btn mt" id="gen">SQL üret</button><div id="out" class="mt"></div></div>
      ${ME.user.role === 'superadmin' ? `<div class="card pad"><h3 class="mb">Bağlantıyı değiştir</h3><p class="small muted mb">Yeni sunucuya geçmeden önce verileri mysqldump ile taşıyın. Bilgiler sunucuda şifreli saklanır.</p><div class="form-grid" id="c">${NS.fieldsHtml([{ name: 'host', label: 'MySQL IP / adres', required: true }, { name: 'port', label: 'Port', value: '3306' }, { name: 'database', label: 'Veritabanı', required: true }, { name: 'user', label: 'Kullanıcı', required: true }, { name: 'password', label: 'Şifre', type: 'password', required: true }, { name: 'ssl', label: 'SSL', type: 'checkbox' }])}</div><button class="btn primary mt" id="sw">Test et ve geç</button></div>` : ''}</div></div>`;
    $('#gen', el).onclick = async () => { const x = await api('POST', '/api/setup/sql', NS.readForm($('#g', el))); $('#out', el).innerHTML = `<pre class="sql">${esc(x.sql)}</pre>`; };
    if ($('#sw', el)) $('#sw', el).onclick = async () => { if (!NS.validate($('#c', el))) return; if (!(await confirm('Bağlantı değişecek. Emin misiniz?'))) return; try { await api('POST', '/api/setup/db', NS.readForm($('#c', el))); toast('Bağlantı değişti', 'ok'); render(); } catch (e) { toast(e.message, 'err'); } };
  };
  ROUTES.kayitlar = async (el) => {
    const r = await api('GET', '/api/admin/audit');
    el.innerHTML = pageHead('Güvenlik Kayıtları', 'Girişler, hatalı denemeler, onaylar ve ayar değişiklikleri (son 500)') + `<div class="card">${table({ rows: r.rows, columns: [{ label: 'Zaman', render: (a) => dt(a.at) }, { label: 'Kullanıcı', render: (a) => esc(a.email || '-') }, { label: 'İşlem', render: (a) => (/Hatalı|reddedildi|askıya/i.test(a.action) ? badge(a.action, 'err') : esc(a.action)) }, { label: 'Detay', render: (a) => `<span class="small">${esc(a.detail || '')}</span>` }, { label: 'IP', render: (a) => `<span class="mono small">${esc(a.ip || '')}</span>` }] })}</div>`;
  };

  // ---------- Analitik: yalnızca gerçek sayaçlar; veri yoksa boş durum gösterilir, tahmin yapılmaz ----------
  const adet = (n) => NS.num(Number(n) || 0);
  const bosDurum = (t) => `<div class="empty">${icon('chart')}<div>${esc(t)}</div></div>`;
  const araliklar = [[1, 'Bugün'], [7, '7 gün'], [30, '30 gün'], [90, '90 gün'], [365, '1 yıl']];
  const aralikSec = (g) => `<div class="seg">${araliklar.map(([v, l]) => `<button data-g="${v}" class="${v === g ? 'active' : ''}">${l}</button>`).join('')}</div>`;
  const gunDoldur = (rows, g) => { const m = Object.fromEntries(rows.map((x) => [x.gun, x.ziyaret])); const b = Date.now() + 3 * 3600e3; return Array.from({ length: g }, (_, i) => { const d = new Date(b - (g - 1 - i) * 864e5).toISOString().slice(0, 10); return { label: `${d.slice(8)}.${d.slice(5, 7)}`, value: m[d] || 0 }; }); };
  const huniSatir = (x, prev) => `<div style="display:grid;grid-template-columns:minmax(70px,92px) minmax(40px,1fr) 58px 52px;gap:10px;align-items:center;padding:7px 0" title="${esc(x.kaynak)}"><b class="small">${esc(x.ad)}</b><div style="background:var(--bg-2);border-radius:4px;height:12px;overflow:hidden"><div style="height:100%;width:${x.oran}%;background:var(--accent);border-radius:4px"></div></div><b class="right">${adet(x.n)}</b><span class="small faint right">${prev && prev.n >= x.n && prev.n > 0 ? `%${Math.round((x.n / prev.n) * 100)}` : '—'}</span></div>`;
  ROUTES.analitik = async (el) => {
    let g = 30;
    const draw = async () => {
      const r = await api('GET', `/api/admin/analitik?gun=${g}`);
      const mx = Math.max(1, ...r.huni.map((x) => x.n)); const h = r.huni.map((x) => ({ ...x, oran: Math.round((x.n / mx) * 100) }));
      const kaynakBos = !r.ayar.acik ? 'Analitik kapalı. Hata & Yavaşlık sayfasındaki ayarlardan açabilirsiniz.' : 'Bu aralıkta rıza veren ziyaretçi yok.';
      const sat = (rows, i) => rows.map((x, k) => ({ ...x, id: `${i}${k}` }));
      el.innerHTML = pageHead('Ziyaret & Dönüşüm', 'Birinci taraf, çerezsiz, toplu sayaçlar. Ziyaret ve demo yalnızca izin veren ziyaretçileri içerir.') + `<div class="mb">${aralikSec(g)}</div>
        <div class="grid g4 mb">${kpi('Tekil ziyaretçi', adet(r.ziyaret), 'users', 'info')}${kpi('Sayfa görüntüleme', adet(r.sayfa), 'eye', 'acc')}${kpi('Kayıt', adet(r.huni[2].n), 'key', 'ok')}${kpi('Ödeme yapan işletme', adet(r.huni[4].n), 'cash', 'ok')}</div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Saate göre ziyaret</h3><span class="small faint">Türkiye saati</span></div><div class="card-b">${r.ziyaret ? chart.bars(r.saatler.map((x) => ({ label: String(x.saat).padStart(2, '0'), value: x.ziyaret })), { labelEvery: 3 }) : bosDurum(kaynakBos)}</div></div>
        <div class="card"><div class="card-h"><h3>Dönüşüm hunisi</h3></div><div class="card-b">${h.some((x) => x.n) ? h.map((x, i) => huniSatir(x, h[i - 1])).join('') : bosDurum('Bu aralıkta ziyaret, kayıt veya ödeme yok.')}<p class="small faint mt">Son sütun önceki adıma oranıdır. Ziyaret ve demo izinli ziyaretçilerden, kayıt, deneme ve ödeme işletme kayıtlarından gelir. Bu yüzden kayıt sayısı demodan yüksek olabilir; o durumda oran gösterilmez.</p></div></div></div>
        ${g > 1 ? `<div class="card mb"><div class="card-h"><h3>Günlere göre tekil ziyaretçi</h3></div><div class="card-b">${r.ziyaret ? chart.bars(gunDoldur(r.gunler, g), { labelEvery: Math.max(1, Math.ceil(g / 8)) }) : bosDurum(kaynakBos)}</div></div>` : ''}
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Programlar</h3></div>${table({ rows: sat(r.programlar, 'p'), empty: 'Program sayfası görüntülenmedi', emptyIcon: 'box', columns: [{ label: 'Program', render: (x) => `<b>${esc(pname(x.program))}</b>` }, { label: 'Görüntüleme', cls: 'right', render: (x) => adet(x.n) }, { label: 'Demo', cls: 'right', render: (x) => adet(x.demo) }] })}</div>
        <div class="card"><div class="card-h"><h3>Trafik kaynakları</h3></div>${table({ rows: sat(r.kaynaklar, 'k'), empty: 'Kaynak verisi yok', emptyIcon: 'globe', columns: [{ label: 'Alan adı', render: (x) => esc(x.kaynak) }, { label: 'Tekil ziyaretçi', cls: 'right', render: (x) => adet(x.n) }] })}</div></div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>UTM kampanyaları</h3></div>${table({ rows: sat(r.utm, 'u'), empty: 'UTM etiketli ziyaret yok', emptyIcon: 'percent', columns: [{ label: 'Kaynak', render: (x) => esc(x.source) }, { label: 'Ortam', render: (x) => esc(x.medium || '-') }, { label: 'Kampanya', render: (x) => esc(x.campaign || '-') }, { label: 'Ziyaretçi', cls: 'right', render: (x) => adet(x.n) }] })}</div>
        <div class="card"><div class="card-h"><h3>Araçlardan programlara geçiş</h3></div>${table({ rows: sat(r.gecisler, 'g'), empty: 'Araçlardan geçiş kaydı yok', emptyIcon: 'wrench', columns: [{ label: 'Araç', render: (x) => esc(x.arac) }, { label: 'Program', render: (x) => esc(pname(x.program)) }, { label: 'Tıklama', cls: 'right', render: (x) => adet(x.n) }] })}</div></div>
        <div class="card"><div class="card-h"><h3>Deneme kullanıcılarının kullandığı bölümler</h3><span class="small faint">İşletme-gün: bir işletmenin bölümü açtığı gün sayısı</span></div>${table({ rows: sat(r.moduller.slice(0, 100), 'm'), empty: 'Deneme kullanıcılarından bölüm verisi yok', emptyIcon: 'grid', columns: [{ label: 'Program', render: (x) => esc(pname(x.program)) }, { label: 'Bölüm', render: (x) => `<span class="mono small">${esc(x.modul)}</span>` }, { label: 'Açılış', cls: 'right', render: (x) => adet(x.n) }, { label: 'İşletme-gün', cls: 'right', render: (x) => adet(x.isletme) }] })}</div>`;
    };
    on(el, 'click', '[data-g]', async (e, b) => { g = Number(b.dataset.g); try { await draw(); } catch (x) { toast(x.message, 'err'); } });
    await draw();
  };
  const ALARM_ROZET = { 'alarm.hata': ['Hata', 'err'], 'alarm.yavas': ['Yavaşlık', 'warn'] };
  // Ortak katalog moderasyonu ayrı dosyada: ihtiyaç olunca yüklenir
  ROUTES.katalog = async (el) => { if (!window.NS_KATALOG_PANEL) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'katalog-panel.js'; s.onload = ok; s.onerror = () => no(new Error('Katalog ekranı yüklenemedi')); document.head.appendChild(s); }); return window.NS_KATALOG_PANEL(el, { api }); };
  ROUTES.sistem = async (el) => {
    let g = 1; let sv = '';
    const draw = async () => {
      const [r, l] = await Promise.all([api('GET', `/api/admin/sistem?gun=${g}`), api('GET', `/api/admin/loglar${sv ? `?seviye=${sv}` : ''}`)]); const a = r.ayar; const yetki = ME.user.role === 'superadmin';
      el.innerHTML = pageHead('Hata & Yavaşlık', 'Sunucu yanıtlarından gelen gerçek sayaçlar ve uygulama günlüğünün uyarıları') + `<div class="mb">${aralikSec(g)}</div>
        <div class="mb">${r.aktif.length ? r.aktif.map((x) => `<div class="card pad mb">${badge('Alarm', x.tur === 'hata' ? 'err' : 'warn')} <b>${esc(x.ad)}</b><div class="small muted">${esc(x.mesaj)}</div></div>`).join('') : `<div class="card pad small">${badge('Normal', 'ok')} Etkin alarm yok. Son ${a.pencereDk} dakikada ${adet(r.pencere.n)} istek${r.pencere.n < a.minIstek ? `; alarm için en az ${adet(a.minIstek)} istek gerekir` : ''}.</div>`}</div>
        <div class="card mb"><div class="card-h"><h3>Uç noktalar</h3><span class="small faint">önce hatalı, sonra yavaş olanlar</span></div>${table({ rows: r.yollar.map((x, i) => ({ ...x, id: i })), empty: 'Bu aralıkta istek kaydı yok', emptyIcon: 'data', columns: [{ label: 'Uç nokta', render: (x) => `<span class="mono small">${esc(x.yol)}</span>` }, { label: 'İstek', cls: 'right', render: (x) => adet(x.n) }, { label: '5xx', cls: 'right', render: (x) => (x.h5 ? badge(adet(x.h5), 'err') : '0') }, { label: '4xx', cls: 'right', render: (x) => adet(x.h4) }, { label: 'Yavaş', cls: 'right', render: (x) => (x.yavas ? badge(adet(x.yavas), 'warn') : '0') }, { label: 'Ort. ms', cls: 'right', render: (x) => adet(x.ort) }, { label: 'En uzun ms', cls: 'right', render: (x) => adet(x.enCok) }] })}</div>
        <div class="card mb"><div class="card-h"><h3>Alarm geçmişi</h3></div>${table({ rows: r.gecmis.map((x, i) => ({ ...x, id: i })), empty: 'Alarm oluşmadı', emptyIcon: 'bell', columns: [{ label: 'Zaman', render: (x) => dt(x.at) }, { label: 'Tür', render: (x) => badge(...(ALARM_ROZET[x.olay] || [x.olay, ''])) }, { label: 'Ayrıntı', render: (x) => `<span class="small">${esc(x.mesaj || '')}</span>` }] })}</div>
        <div class="card mb"><div class="card-h"><h3>Uygulama günlüğü</h3><div class="seg">${[['', 'Tümü'], ['hata', 'Hata'], ['uyari', 'Uyarı']].map(([v, t]) => `<button data-s="${v}" class="${v === sv ? 'active' : ''}">${t}</button>`).join('')}</div></div>${table({ rows: l.rows.map((x) => ({ ...x, id: String(x.id) })), empty: 'Uyarı veya hata kaydı yok', emptyIcon: 'list', columns: [{ label: 'Zaman', render: (x) => dt(x.at) }, { label: 'Seviye', render: (x) => (x.seviye === 'hata' ? badge('Hata', 'err') : badge('Uyarı', 'warn')) }, { label: 'Olay', render: (x) => `<span class="mono small">${esc(x.olay)}</span>` }, { label: 'İleti', render: (x) => `<span class="small">${esc(x.mesaj || '')}</span>` }, { label: 'İstek kodu', render: (x) => `<span class="mono small">${esc(x.istek || '')}</span>` }] })}</div>
        <div class="card pad" id="af" style="max-width:760px"><h3 class="mb">Analitik, saklama ve alarm ayarları</h3><p class="small muted mb">Saklama süreleri varsayılandır ve avukatla netleştirilecektir. Süresi dolan kayıtlar 6 saatte bir silinir; denetim süresi kısaltılırsa eski güvenlik kayıtları da silinir.</p><div class="form-grid">${NS.fieldsHtml([
          { name: 'acik', label: 'Ziyaret analitiği açık (rıza bandı ve sayaçlar)', type: 'checkbox', full: true }, { type: 'section', label: 'Saklama (gün)' }, { name: 'analitikGun', label: 'Toplu analitik', type: 'number' }, { name: 'uygulamaGun', label: 'Uygulama günlüğü', type: 'number' }, { name: 'denetimGun', label: 'Denetim kaydı', type: 'number' },
          { type: 'section', label: 'Alarm eşikleri' }, { name: 'hataOrani', label: 'Hata oranı (%)', type: 'number' }, { name: 'yavasMs', label: 'Yavaş yanıt (ms)', type: 'number' }, { name: 'yavasOrani', label: 'Yavaş oranı (%)', type: 'number' }, { name: 'minIstek', label: 'En az istek', type: 'number' }, { name: 'pencereDk', label: 'Pencere (dakika)', type: 'number' }, { name: 'alarmEposta', label: 'Alarmı e-postayla bildir (saatte en fazla bir)', type: 'checkbox', full: true }], a)}</div>${yetki ? `<button class="btn primary mt" id="as">${icon('check')} Kaydet</button>` : '<p class="small faint mt">Ayarları yalnız süper yönetici değiştirebilir.</p>'}</div>`;
      if ($('#as', el)) $('#as', el).onclick = async () => { try { await api('PUT', '/api/admin/analitik/ayar', NS.readForm($('#af', el))); toast('Kaydedildi', 'ok'); draw(); } catch (x) { toast(x.message, 'err'); } };
    };
    on(el, 'click', '[data-g]', async (e, b) => { g = Number(b.dataset.g); try { await draw(); } catch (x) { toast(x.message, 'err'); } });
    on(el, 'click', '[data-s]', async (e, b) => { sv = b.dataset.s; try { await draw(); } catch (x) { toast(x.message, 'err'); } });
    await draw();
  };

  async function boot() {
    let st; try { st = await api('GET', '/api/setup/status'); } catch (e) { document.body.innerHTML = `<div class="wiz"><div class="card pad"><h2>Sunucuya ulaşılamadı</h2><p class="muted">${esc(e.message)}</p></div></div>`; return; }
    if (!st.configured || !st.hasAdmin) return setup(st);
    try { ME = await api('GET', '/api/auth/me'); } catch (e) { ME = null; }
    if (!ME || !ME.user || !['admin', 'superadmin'].includes(ME.user.role)) return login();
    layout(); render();
  }
  boot();
})();
