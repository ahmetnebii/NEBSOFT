/* NEBSOFT Yönetim Paneli (gerçek) — kurulum sihirbazı (MySQL), havale onayları, banka hesapları, işletmeler ve lisanslar,
   talepler, destek, kuponlar, yöneticiler, veritabanı, site ayarları, güvenlik kayıtları. Tüm veriler sunucu API'sinden gelir. */
(function () {
  'use strict';
  const { api, esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum } = NS;
  const C = window.CATALOG;
  const pname = (id) => (id === 'bundle' ? 'Hepsi Bir Arada' : (C.products.find((p) => p.id === id) || { name: id }).name);
  const planName = (i) => (C.plans[i] || {}).name || '-';
  const OST = { 'odeme-bekliyor': ['Ödeme bekliyor', 'warn'], odendi: ['Ödendi', 'ok'], iptal: ['İptal', ''] };
  const LST = { deneme: ['Deneme', 'info'], aktif: ['Aktif', 'ok'], askida: ['Askıda', 'err'], iptal: ['İptal', ''] };
  const lstB = (l) => (new Date(l.end) < new Date() ? badge('Süresi doldu', 'err') : badge(LST[l.status][0], LST[l.status][1]));
  const dt = (d) => (d ? NS.dt(d) : '-');
  let ME = null;

  // ---------- Kurulum sihirbazı ----------
  async function setup(st) {
    let step = !st.configured ? 1 : !st.hasAdmin ? 3 : 4;
    const draw = () => {
      document.body.innerHTML = `<div class="wiz"><div class="row nw mb">${NS.logoMark('#1d7bf5', 44)}<div><b style="font-size:20px">NEBSOFT kurulum</b><div class="small muted">Canlıya geçiş: veritabanı ve ilk yönetici</div></div></div>
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

  function login() {
    document.body.innerHTML = `<div class="ns-login"><div class="card"><div class="row nw mb">${NS.logoMark('#1d7bf5', 48)}<div><b style="font-size:17px">NEBSOFT Yönetim</b><div class="small faint">Yalnızca yetkili personel</div></div></div>
      <form id="f" onsubmit="return false" class="col"><div class="field"><label>E-posta</label><input class="input lg" name="email" type="email" autocomplete="username" required></div><div class="field"><label>Şifre</label><input class="input lg" name="pass" type="password" autocomplete="current-password" required></div><button class="btn primary lg block" id="go">Giriş</button></form></div></div>`;
    const go = async () => { if (!NS.validate($('#f'))) return; try { const r = await api('POST', '/api/auth/login', NS.readForm($('#f'))); if (!['admin', 'superadmin'].includes(r.role)) { await api('POST', '/api/auth/logout'); return toast('Bu hesabın yönetim yetkisi yok', 'err'); } boot(); } catch (e) { toast(e.message, 'err'); } };
    $('#go').onclick = go;
  }

  // ---------- Düzen ----------
  const NAV = [{ sec: 'Satış' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'havale', label: 'Havale Onayları', icon: 'cash', badge: true }, { id: 'siparisler', label: 'Tüm Siparişler', icon: 'receipt' }, { id: 'bankalar', label: 'Banka Hesapları', icon: 'building' }, { id: 'kuponlar', label: 'Kuponlar', icon: 'percent' },
    { sec: 'Müşteriler' }, { id: 'isletmeler', label: 'İşletmeler & Lisanslar', icon: 'users' }, { id: 'talepler', label: 'Satış Talepleri', icon: 'phone' }, { id: 'destek', label: 'Destek', icon: 'message' },
    { sec: 'Sistem' }, { id: 'ayarlar', label: 'Site Ayarları', icon: 'settings' }, { id: 'yoneticiler', label: 'Yöneticiler', icon: 'shield' }, { id: 'veritabani', label: 'Veritabanı', icon: 'data' }, { id: 'kayitlar', label: 'Güvenlik Kayıtları', icon: 'list' }];
  function layout() {
    document.body.innerHTML = `<div class="ns-app"><aside class="ns-side" id="side"><div class="ns-brand">${NS.logoMark('#1d7bf5', 40)}<div><b>NEBSOFT</b><span>Yönetim paneli</span></div></div><nav class="ns-nav">${NAV.map((n) => (n.sec ? `<div class="sec">${n.sec}</div>` : `<a href="#/${n.id}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span>${n.badge ? '<span class="badge warn hide" style="margin-left:auto" id="nb"></span>' : ''}</a>`)).join('')}</nav><div class="ns-side-foot"><a class="btn ghost block" style="justify-content:flex-start" href="../" target="_blank">${icon('store')} Siteyi aç</a></div></aside>
      <main class="ns-main"><header class="ns-top"><button class="btn ghost icon ns-burger" id="bg">${icon('menu')}</button><div class="title" id="ttl"></div><button class="btn ghost icon" id="th">${icon(NS.getTheme() === 'dark' ? 'sun' : 'moon')}</button><div class="ns-user"><div class="avatar">${esc(NS.initials(ME.user.name))}</div><div class="name small"><b>${esc(ME.user.name)}</b><div class="faint" style="font-size:11px">${ME.user.role === 'superadmin' ? 'Süper yönetici' : 'Yönetici'}</div></div></div><button class="btn ghost" id="lo">${icon('logout')}</button></header><section class="ns-content" id="view"></section></main></div>`;
    $('#bg').onclick = () => $('#side').classList.toggle('open');
    $('#th').onclick = NS.toggleTheme;
    $('#lo').onclick = async () => { await api('POST', '/api/auth/logout').catch(() => {}); boot(); };
  }
  const ROUTES = {};
  async function render() {
    const [r, p] = (location.hash.replace(/^#\/?/, '') || 'ozet').split('/');
    const nav = NAV.find((n) => n.id === r) || NAV[1];
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav.id));
    $('#ttl').textContent = nav.label; $('#side').classList.remove('open');
    const old = $('#view'); const el = old.cloneNode(false); old.replaceWith(el);
    el.innerHTML = '<div class="empty">Yükleniyor…</div>';
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
      { label: 'Ürünler', render: (o) => o.items.map((i) => `<div class="small">${esc(pname(i.pid))} · ${planName(i.plan)} · ${i.period === 'yillik' ? 'yıllık' : 'aylık'}${i.qty > 1 ? ` · ${i.qty} şube` : ''}</div>`).join('') },
      { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>${o.discount ? `<div class="small faint">kupon ${esc(o.coupon)}</div>` : ''}` },
      { label: 'Durum', render: (o) => badge(OST[o.status][0], OST[o.status][1]) + (o.paid_at ? `<div class="small faint">${dt(o.paid_at)}</div>` : '') + (o.note ? `<div class="small faint">${esc(o.note)}</div>` : '') },
    ], actions: [{ icon: 'check', act: 'ok', title: 'Ödendi — lisansı aç', show: (o) => o.status === 'odeme-bekliyor' }, { icon: 'x', act: 'no', title: 'Reddet', show: (o) => o.status === 'odeme-bekliyor' }, { icon: 'print', act: 'pr', title: 'Bilgi fişi' }] });
  }
  function bindOrders(el, rows, redraw) {
    on(el, 'click', '[data-act]', async (e, b) => {
      const o = rows.find((x) => x.id === b.dataset.id); if (!o) return;
      if (b.dataset.act === 'ok') { const v = await formModal({ title: `${o.no} — ödeme alındı mı?`, fields: [{ name: 'note', label: 'Not (dekont no, gönderen adı)', full: true }], submitLabel: 'Ödendi, lisansı aç', extra: `<p class="small muted">${esc(o.tenant)} · <b>${money(o.total)}</b> · açıklamada <b>${esc(o.no)}</b> yazmalı. Banka hesabınızda tutarı gördükten sonra onaylayın.</p>` }); if (!v) return; try { await api('POST', `/api/admin/orders/${o.id}/approve`, v); toast('Ödendi olarak işaretlendi, lisanslar açıldı', 'ok'); redraw(); } catch (x) { toast(x.message, 'err'); } }
      if (b.dataset.act === 'no') { const v = await formModal({ title: `${o.no} reddet`, fields: [{ name: 'note', label: 'Neden', value: 'Ödeme alınmadı', full: true }], submitLabel: 'Reddet' }); if (!v) return; try { await api('POST', `/api/admin/orders/${o.id}/reject`, v); toast('Sipariş iptal edildi', 'ok'); redraw(); } catch (x) { toast(x.message, 'err'); } }
      if (b.dataset.act === 'pr') NS.printHtml(`<div class="doc"><h2>Sipariş ${esc(o.no)}</h2><p>${esc(o.tenant)} · ${esc(o.email)}</p><table><tr><th>Ürün</th><th>Paket</th><th>Dönem</th><th style="text-align:right">Tutar</th></tr>${o.items.map((i) => `<tr><td>${esc(pname(i.pid))}</td><td>${planName(i.plan)}</td><td>${i.period}</td><td style="text-align:right">${money(i.price)}</td></tr>`).join('')}<tr><td colspan="3">KDV</td><td style="text-align:right">${money(o.vat)}</td></tr><tr><td colspan="3"><b>Toplam</b></td><td style="text-align:right"><b>${money(o.total)}</b></td></tr></table><p>Fatura: ${esc(o.billing.name || '')} · ${esc(o.billing.company || '')} · VKN/TCKN ${esc(o.billing.taxNo || '')} · ${esc(o.billing.taxOffice || '')}<br>${esc(o.billing.address || '')} ${esc(o.billing.city || '')}</p></div>`, { title: o.no });
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
    $('#csv', el).onclick = () => NS.csv('siparisler', rows, [{ key: 'no', label: 'No' }, { label: 'Tarih', value: (o) => dt(o.created) }, { key: 'tenant', label: 'İşletme' }, { key: 'email', label: 'E-posta' }, { label: 'Ürünler', value: (o) => o.items.map((i) => pname(i.pid)).join(' + ') }, { key: 'subtotal', label: 'Ara toplam' }, { key: 'vat', label: 'KDV' }, { key: 'total', label: 'Toplam' }, { label: 'Durum', value: (o) => OST[o.status][0] }, { label: 'VKN', value: (o) => o.billing.taxNo }]);
    bindOrders(el, { find: (f) => rows.find(f) }, draw); await draw();
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
    el.innerHTML = pageHead('Satış Talepleri', 'İletişim ve demo formları') + `<div class="card">${table({ rows: r.leads, empty: 'Talep yok', columns: [{ label: 'Kişi', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.phone)} · ${esc(l.email || '')}</div>` }, { label: 'İşletme / ürün', render: (l) => `${esc(l.biz || '')}<div class="small faint">${esc(pname(l.product || '') || '')} · ${esc(l.type || '')}</div>` }, { label: 'Mesaj', render: (l) => `<span class="small">${esc(l.msg || '')}</span>` }, { label: 'Tarih', render: (l) => dt(l.created) }, { label: 'Durum', render: (l) => `<select class="input" data-st="${l.id}" style="height:30px">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>` }] })}</div>`;
    on(el, 'change', '[data-st]', async (e, s) => { await api('POST', `/api/admin/leads/${s.dataset.st}`, { status: s.value }); toast('Güncellendi', 'ok'); });
  };
  ROUTES.destek = async (el) => {
    on(el, 'click', '[data-rs]', async (e, b) => { const v = $(`[data-rt="${b.dataset.rs}"]`, el).value.trim(); if (!v) return; await api('POST', `/api/tickets/${b.dataset.rs}/reply`, { text: v }); draw(); });
    on(el, 'click', '[data-cl]', async (e, b) => { await api('POST', `/api/tickets/${b.dataset.cl}/reply`, { close: true }); draw(); });
    const draw = async () => {
      const r = await api('GET', '/api/admin/tickets');
      el.innerHTML = pageHead('Destek', 'Müşteri talepleri') + (r.tickets.map((t) => `<div class="card mb"><div class="card-h"><h3>${esc(t.subject)}</h3>${t.product ? badge(pname(t.product), 'acc') : ''}${badge(t.status === 'kapali' ? 'Kapandı' : t.status === 'yanitlandi' ? 'Yanıtlandı' : 'Açık', t.status === 'acik' ? 'warn' : t.status === 'kapali' ? '' : 'ok')}<span class="grow"></span><span class="small faint">${esc(t.tenant_name || '')} · ${dt(t.updated)}</span></div><div class="card-b col" style="gap:8px">${t.messages.map((m) => `<div class="small"><b>${m.from === 'destek' ? 'Destek' : 'Müşteri'}</b> <span class="faint">${dt(m.at)}</span><div>${esc(m.text)}</div></div>`).join('')}${t.status !== 'kapali' ? `<div class="row nw"><input class="input" data-rt="${t.id}" placeholder="Yanıt yazın..."><button class="btn primary" data-rs="${t.id}">${icon('send')}</button><button class="btn" data-cl="${t.id}">Kapat</button></div>` : ''}</div></div>`).join('') || '<div class="card pad empty">Destek talebi yok</div>');
    };
    await draw();
  };
  ROUTES.ayarlar = async (el) => {
    const r = await api('GET', '/api/admin/settings');
    el.innerHTML = pageHead('Site Ayarları', 'Deneme süresi, tavsiye ödülü ve iletişim bilgileri') + `<div class="card pad" style="max-width:760px" id="f"><div class="form-grid">${NS.fieldsHtml([{ name: 'siteName', label: 'Marka adı', required: true }, { name: 'siteUrl', label: 'Site adresi', placeholder: 'https://www.nebsoft.com.tr' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'address', label: 'Adres', full: true }, { type: 'section', label: 'Satış kuralları' }, { name: 'trialDays', label: 'Ücretsiz deneme (gün)', type: 'number' }, { name: 'referralDays', label: 'Tavsiye ödülü (gün, iki tarafa)', type: 'number' }], r.site)}</div><button class="btn primary mt" id="sv">${icon('check')} Kaydet</button></div>`;
    $('#sv', el).onclick = async () => { try { await api('PUT', '/api/admin/settings', NS.readForm($('#f', el))); toast('Kaydedildi', 'ok'); } catch (e) { toast(e.message, 'err'); } };
  };
  ROUTES.yoneticiler = async (el) => {
    on(el, 'click', '#add', async () => { const v = await formModal({ title: 'Yönetici ekle', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'pass', label: 'Şifre (en az 12)', type: 'password', required: true }, { name: 'role', label: 'Rol', type: 'select', options: [{ value: 'admin', label: 'Yönetici' }, { value: 'superadmin', label: 'Süper yönetici' }] }] }); if (!v) return; try { await api('POST', '/api/admin/users', v); draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '[data-act]', async (e, b) => { try { if (b.dataset.act === 'pw') { const x = await api('POST', `/api/admin/users/${b.dataset.id}/reset`); modal({ title: 'Yeni geçici şifre', body: `<p class="mono" style="font-size:20px">${esc(x.password)}</p>` }); } else await api('POST', `/api/admin/users/${b.dataset.id}/status`, { status: b.dataset.act === 'onn' ? 'active' : 'disabled' }); draw(); } catch (x) { toast(x.message, 'err'); } });
    on(el, 'click', '#cp', async () => { try { await api('POST', '/api/auth/password', NS.readForm($('#pf', el))); toast('Şifre değişti', 'ok'); } catch (x) { toast(x.message, 'err'); } });
    const draw = async () => {
      const r = await api('GET', '/api/admin/users');
      el.innerHTML = pageHead('Yöneticiler', 'Panel erişimi olan personel', ME.user.role === 'superadmin' ? `<button class="btn primary" id="add">${icon('plus')} Yönetici ekle</button>` : '') + `<div class="card">${table({ rows: r.users, columns: [{ label: 'Kişi', render: (u) => `<b>${esc(u.name)}</b><div class="small faint">${esc(u.email)}</div>` }, { label: 'Rol', render: (u) => badge(u.role === 'superadmin' ? 'Süper yönetici' : 'Yönetici', u.role === 'superadmin' ? 'acc' : 'info') }, { label: 'Durum', render: (u) => (u.status === 'active' ? badge('Aktif', 'ok') : badge('Kapalı', 'err')) }, { label: 'Son giriş', render: (u) => `${dt(u.last_login)}<div class="small faint">${esc(u.last_ip || '')}</div>` }], actions: ME.user.role === 'superadmin' ? [{ icon: 'lock', act: 'off', title: 'Kapat', show: (u) => u.status === 'active' && u.id !== ME.user.id }, { icon: 'check', act: 'onn', title: 'Aç', show: (u) => u.status !== 'active' }, { icon: 'key', act: 'pw', title: 'Şifre sıfırla', show: (u) => u.id !== ME.user.id }] : [] })}</div>
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

  async function boot() {
    let st; try { st = await api('GET', '/api/setup/status'); } catch (e) { document.body.innerHTML = `<div class="wiz"><div class="card pad"><h2>Sunucuya ulaşılamadı</h2><p class="muted">${esc(e.message)}</p></div></div>`; return; }
    if (!st.configured || !st.hasAdmin) return setup(st);
    try { ME = await api('GET', '/api/auth/me'); } catch (e) { ME = null; }
    if (!ME || !ME.user || !['admin', 'superadmin'].includes(ME.user.role)) return login();
    layout(); render();
  }
  boot();
})();
