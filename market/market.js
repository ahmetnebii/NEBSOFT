/* NEBSOFT Pazar yeri — vitrin, ürün sayfası, sepet, ödeme, lisans, müşteri hesabı ve yönetim paneli */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, sum, rand, pick, addDays, iso, today } = NS;
  const C = window.CATALOG;
  const VAT = 20;
  const BUNDLE = { id: 'bundle', name: 'Hepsi Bir Arada', tagline: 'Tüm NEBSOFT ürünleri tek abonelikte', icon: 'layers', accent: '#4f46e5', prices: [4990, 8990, 16990], ready: true };

  // ---------- Veri ----------
  function seed(db) {
    db.data._settings = { siteName: 'NEBSOFT', phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', address: 'Maslak, Büyükdere Cad. No:255, Sarıyer/İstanbul', iban: 'TR12 0006 4000 0011 2345 6789 01', bank: 'İş Bankası', adminPin: '1234', trialDays: 7 };
    db.data.coupons = [{ id: 'k1', code: 'NEBSOFT20', pct: 20, active: true, uses: 37 }, { id: 'k2', code: 'YILLIK10', pct: 10, active: true, uses: 12 }, { id: 'k3', code: 'BAYI30', pct: 30, active: false, uses: 4 }];
    const custs = NS.NAMES.slice(0, 22).map((n, i) => ({ id: 'mc' + i, name: n, email: NS.slug(n).replace('-', '.') + '@firma.com', phone: NS.phone(), company: pick(['Market', 'Kafe', 'Kuaför', 'Restoran', 'Güzellik', 'Teknik', 'Ofis']) + ' ' + n.split(' ')[1], pass: null, created: addDays(new Date(), -rand(5, 120)).toISOString() }));
    db.data.customers = custs;
    const ready = C.products.filter((p) => p.ready);
    const orders = [], licenses = [];
    let no = 24000;
    for (let i = 0; i < 70; i++) {
      const c = pick(custs); const p = pick(ready); const plan = rand(0, 10) < 6 ? 1 : rand(0, 1) ? 0 : 2; const period = rand(0, 3) ? 'aylik' : 'yillik';
      const at = addDays(new Date(), -rand(0, 89)); at.setHours(rand(8, 23), rand(0, 59));
      const price = p.prices[plan] * (period === 'yillik' ? 10 : 1);
      const o = { id: 'o' + i, no: 'NS' + ++no, at: at.toISOString(), customer: c.id, items: [{ pid: p.id, plan, period, qty: 1, price }], subtotal: price, discount: 0, vat: price * VAT / 100, total: price * (1 + VAT / 100), status: rand(0, 12) ? 'odendi' : 'bekliyor', pay: rand(0, 4) ? 'kart' : 'havale', coupon: null };
      orders.push(o);
      if (o.status === 'odendi') licenses.push(mkLicense(o, o.items[0], c.id, at));
    }
    db.data.orders = orders.sort((a, b) => a.at.localeCompare(b.at));
    db.data._meta._seq_orders = no;
    db.data.licenses = licenses;
    db.data.leads = [
      { id: 'l1', name: 'Kadir Er', phone: '0532 222 11 00', email: 'kadir@erbakkal.com', biz: 'Er Bakkal', product: 'pos', msg: 'Terazi entegrasyonu hakkında bilgi almak istiyorum.', status: 'yeni', type: 'demo' },
      { id: 'l2', name: 'Sinem Kar', phone: '0533 444 55 66', email: 'sinem@karcafe.com', biz: 'Kar Cafe', product: 'adisyon', msg: '3 şubemiz var, kurumsal fiyat alabilir miyiz?', status: 'arandi', type: 'teklif' },
      { id: 'l3', name: 'Oğuz Tan', phone: '0505 999 88 77', email: 'oguz@tanservis.com', biz: 'Tan Teknik Servis', product: 'servis', msg: 'Teknik servis ürünü ne zaman çıkacak?', status: 'yeni', type: 'iletisim' },
    ];
    db.data.leads.forEach((l, i) => { l.created = addDays(new Date(), -i).toISOString(); });
    db.data.tickets = [{ id: 't1', customer: 'mc1', subject: 'Fiş yazıcı ayarı', status: 'acik', product: 'pos', created: addDays(new Date(), -1).toISOString(), messages: [{ from: 'musteri', text: '80mm fiş yazıcıda kenar boşluğu fazla çıkıyor, nasıl düzeltirim?', at: addDays(new Date(), -1).toISOString() }] }];
  }
  function mkLicense(o, it, customer, start = new Date()) {
    const code = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
    const months = it.period === 'yillik' ? 12 : 1;
    const s = new Date(start); const end = new Date(s); end.setMonth(end.getMonth() + months);
    return { id: NS.uid(), key: `NEB-${it.pid.toUpperCase().slice(0, 4)}-${code()}-${code()}-${code()}`, pid: it.pid, plan: it.plan, period: it.period, start: s.toISOString(), end: end.toISOString(), status: 'aktif', order: o.id, customer, branches: it.qty || 1, autoRenew: true };
  }
  const db = new NS.DB('market', seed);
  // Bulut modunda marka ve iletişim bilgisi yönetim panelindeki site ayarından gelir (yerel demo ayarı yalnızca yedek)
  const S = () => {
    const s = db.settings({ siteName: 'NEBSOFT', adminPin: '1234' });
    const c = CL && CL.site; if (!c) return s;
    return { ...s, ...(c.name && { siteName: c.name }), ...(c.phone && { phone: c.phone }), ...(c.email && { email: c.email }), ...(c.address && { address: c.address }) };
  };
  const ov = (pid) => ((CL && CL.catalog) || db.data.overrides || {})[pid] || {};
  const products = () => C.products.map((p) => ({ ...p, ...ov(p.id) })).filter((p) => !p.hidden);
  const prod = (id) => (id === 'bundle' ? { ...BUNDLE, ...ov('bundle') } : products().find((p) => p.id === id));
  // Sepet ve siparişlerde ürün ya da aylık eklenti (eklentiler tek fiyatlıdır)
  const item = (id) => prod(id) || (() => { const a = (C.addons || []).find((x) => x.id === id); return a ? { ...a, addon: true, prices: [a.price, a.price, a.price] } : { id, name: id, prices: [0, 0, 0], icon: 'box', accent: '#64748b' }; })();
  const price = (p, plan, period) => p.prices[plan] * (period === 'yillik' ? 10 : 1);
  const custOf = (id) => db.get('customers', id) || { name: '-', email: '' };
  const planName = (i) => (C.plans[i] || {}).name || '';
  const stars = (r) => `<span class="stars">${'★'.repeat(Math.round(r))}${'☆'.repeat(5 - Math.round(r))}</span>`;

  // Oturumlar
  const SKEY = 'nebsoft:market:user', AKEY = 'nebsoft:market:admin';
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v, persist) => { try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* yok */ } }, del: (k) => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch (e) { /* yok */ } } };
  const me = () => (CL ? (CL.user ? { ...CL.user, company: CL.tenant ? CL.tenant.name : '' } : null) : db.get('customers', ss.get(SKEY)));
  const isAdmin = () => { try { return sessionStorage.getItem(AKEY) === '1'; } catch (e) { return false; } };
  async function hash(s) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nebsoft:' + s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return 'p:' + btoa(unescape(encodeURIComponent(s))); }
  }

  // ---------- Sepet ----------
  const cart = () => (db.data.cart = db.data.cart || { items: [], coupon: null });
  function addCart(pid, plan = 1, period = 'aylik') {
    const c = cart();
    const ex = c.items.find((i) => i.pid === pid);
    if (ex) Object.assign(ex, { plan, period }); else c.items.push({ id: NS.uid(), pid, plan, period, qty: 1 });
    db.save(); drawNav(); toast(`${item(pid).name} sepete eklendi`, 'ok');
  }
  // Hazır paket: içindeki programlar tek işlemle sepete girer. Tutar her zaman sunucudan, sepet kalemlerine göre gelir
  function addPaket(pk, plan = 1, period = 'aylik') {
    const c = cart();
    if (c.items.some((i) => i.pid === 'bundle')) { toast('Sepetinizdeki Hepsi Bir Arada bu programları zaten kapsıyor', ''); return false; }
    pk.programlar.forEach((pid) => { const ex = c.items.find((i) => i.pid === pid); if (ex) Object.assign(ex, { plan, period, paket: pk.id }); else c.items.push({ id: NS.uid(), pid, plan, period, qty: 1, paket: pk.id }); });
    db.save(); drawNav(); toast(`${pk.ad} paketi sepete eklendi (${pk.programlar.length} program)`, 'ok'); return true;
  }
  function cartTotals() {
    const c = cart();
    const lines = c.items.map((i) => { const p = item(i.pid); return { ...i, p, unit: price(p, i.plan, i.period), line: price(p, i.plan, i.period) * (i.qty || 1) }; });
    const subtotal = sum(lines, (l) => l.line);
    const cp = c.coupon && (CL ? { code: c.coupon, pct: c.couponPct || 0 } : db.find('coupons', (k) => k.code === c.coupon && k.active));
    const discount = cp ? Math.round(subtotal * cp.pct) / 100 : 0;
    const vat = Math.round((subtotal - discount) * VAT) / 100;
    return { lines, subtotal, discount, vat, total: subtotal - discount + vat, coupon: cp };
  }

  // Logo yazısı: NEB koyu/beyaz, SOFT mavi (site adı değişmişse düz yazar)
  const brandName = () => (/^nebsoft$/i.test(S().siteName) ? '<span class="wm"><b>NEB</b><i>SOFT</i></span>' : `<span>${esc(S().siteName)}</span>`);

  // ---------- İskelet ----------
  const EMBED = /[?&]embed=1/.test(location.search) && window.top !== window; // yönetim merkezine gömülü
  function frame() {
    document.body.className = 'mk';
    if (EMBED) { document.body.innerHTML = '<main id="page"></main>'; document.body.classList.add('mk-embed'); return; }
    document.body.innerHTML = `<header class="mk-nav"><div class="mk-wrap">
        <a class="mk-logo" href="#/">${NS.logoMark(LOGO(), 36)}${brandName()}</a>
        <nav class="mk-links" id="links"><a href="/programlar" data-l="urunler">Ürünler</a><a href="/paketler/" data-l="paketler">Paketler</a><a href="/fiyatlar/" data-l="fiyatlar">Fiyatlar</a><a href="/rehber/">Rehber</a><a href="/araclar">Araçlar</a><a href="#/sektorler" data-l="sektorler">Sektörler</a><a href="#/indir" data-l="indir">Masaüstü & Mobil</a><a href="#/iletisim" data-l="iletisim">İletişim</a><div class="mk-only-m" id="accm"></div></nav>
        <span class="grow mk-hide-m"></span>
        <button class="btn ghost icon" data-theme title="Tema" data-theme-ico>${icon(NS.getTheme() === 'dark' ? 'sun' : 'moon')}</button>
        <a class="btn ghost icon cart-btn" href="#/sepet" title="Sepet">${icon('cart')}<span class="cnt hide" id="cc"></span></a>
        <div class="mk-acc" id="acc"></div>
        <button class="btn ghost icon mk-burger" id="burger" aria-label="Menü">${icon('menu')}</button>
      </div></header>
      <main id="page"></main>
      <footer class="mk-foot"><div class="mk-wrap"><div class="cols">
        <div><a class="mk-logo" href="#/">${NS.logoMark(LOGO(), 36)}${brandName()}</a><p class="muted small mt">Türkiye'deki işletmeler için bulut tabanlı işletme yazılımları. Kurulum yok, taahhüt yok.</p><p class="small mt">${icon('phone')} ${esc(S().phone)}<br>${icon('mail')} ${esc(S().email)}<br>${icon('map')} ${esc(S().address)}</p></div>
        <div><h4>Ürünler</h4>${products().filter((p) => p.ready).map((p) => `<a href="${urunHref(p)}">${esc(p.name)}</a>`).join('')}<a href="/programlar">Tüm ürünler →</a></div>
        <div><h4>Kurumsal</h4><a href="#/indir">Masaüstü sürümünü indir</a><a href="/paketler/">Hazır paketler</a><a href="/fiyatlar/">Fiyatlandırma</a><a href="/rehber/">Rehber</a><a href="#/sektorler">Sektörler</a><a href="#/yardim">Yardım merkezi</a><a href="#/iletisim">İletişim</a><a href="#/hesabim">Müşteri paneli</a><a href="admin/">Yönetim paneli</a></div>
        <div><h4>Yasal</h4><a href="/kvkk/">KVKK Aydınlatma</a><a href="/mesafeli-satis/">Mesafeli Satış Sözleşmesi</a><a href="/iade/">İptal ve İade</a><a href="/gizlilik/">Gizlilik Politikası</a><a href="/cerez/">Çerez Politikası</a>${CL && CL.analitik ? '<a href="#" data-olay-tercih>Analitik tercihleri</a>' : ''}</div>
      </div><hr><div class="row between small faint"><span>© ${new Date().getFullYear()} ${esc(S().siteName)} Yazılım. Tüm hakları saklıdır.</span></div></div></footer>`;
    on(document.body, 'click', '[data-theme]', NS.toggleTheme);
    $('#burger').onclick = () => $('#links').classList.toggle('open');
    on(document.body, 'click', '#links a', () => $('#links').classList.remove('open'));
    // Hesap menüsü
    on(document.body, 'click', '[data-um]', (e, b) => { const w = b.closest('.mk-user'); const o = !w.classList.contains('open'); w.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
    on(document.body, 'click', '.mk-user-m a', () => $$('.mk-user').forEach((w) => w.classList.remove('open')));
    document.addEventListener('mousedown', (e) => { if (!e.target.closest('.mk-user')) $$('.mk-user.open').forEach((w) => w.classList.remove('open')); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.mk-user.open').forEach((w) => w.classList.remove('open')); });
    on(document.body, 'click', '[data-logout]', logout);
    on(document.body, 'click', '[data-phone]', () => { $$('.mk-user').forEach((w) => w.classList.remove('open')); phoneLink(); });
    on(document.body, 'click', '[data-install]', () => { $$('.mk-user').forEach((w) => w.classList.remove('open')); if (NS.pwa) NS.pwa.prompt(); });
    drawNav();
    const nav = $('.mk-nav'); const sc = () => nav && nav.classList.toggle('scrolled', scrollY > 8); addEventListener('scroll', sc, { passive: true }); sc();
  }
  // Sağ üst: giriş yapmamışsa "Giriş yap" + "Ücretsiz başla", yaptıysa "Programlarım" + hesap menüsü (mobil menüde de aynısı)
  function drawNav() {
    const n = cart().items.length;
    const cc = $('#cc'); if (cc) { cc.textContent = n; cc.classList.toggle('hide', !n); }
    const u = me(); const signup = '#/kayit';
    const acc = $('#acc');
    if (acc) acc.innerHTML = u ? `<a class="btn primary mk-hide-m" href="#/programlarim">${icon('grid')} Programlarım</a>
      <div class="mk-user"><button class="btn ghost mk-user-b" data-um aria-haspopup="menu" aria-expanded="false" title="Hesabım"><span class="avatar">${esc(NS.initials(u.name))}</span><span class="mk-hide-m">${esc(u.name.split(' ')[0])}</span></button>
        <div class="ns-menu mk-user-m" role="menu"><div class="mk-user-h"><b>${esc(u.name)}</b><span>${esc(u.company || u.email || '')}</span></div><div class="ns-menu-sep"></div>
          <a class="ns-menu-i" role="menuitem" href="#/programlarim">${icon('grid')} Programlarım</a><a class="ns-menu-i" role="menuitem" href="#/hesabim">${icon('key')} Lisans ve abonelik</a><a class="ns-menu-i" role="menuitem" href="#/websitem">${icon('globe')} Web sitem</a><a class="ns-menu-i" role="menuitem" href="#/eklentiler">${icon('plus')} Eklenti Mağazası</a><a class="ns-menu-i" role="menuitem" href="#/hesabim/siparisler">${icon('receipt')} Siparişlerim</a><a class="ns-menu-i" role="menuitem" href="#/hesabim/destek">${icon('message')} Destek</a><a class="ns-menu-i" role="menuitem" href="#/hesabim/profil">${icon('settings')} Profil ve güvenlik</a><div class="ns-menu-sep"></div><button class="ns-menu-i" role="menuitem" data-phone>${icon('phone')} Telefonumda aç</button><button class="ns-menu-i" role="menuitem" data-install>${icon('download')} Uygulamayı yükle</button><a class="ns-menu-i" role="menuitem" href="#/indir">${icon('download')} Masaüstü sürümü</a>
          <div class="ns-menu-sep"></div><button class="ns-menu-i" role="menuitem" data-logout>${icon('logout')} Çıkış yap</button></div></div>`
      : `<a class="btn mk-login" href="#/giris">${icon('user')} Giriş yap</a><a class="btn primary mk-hide-s" href="${signup}">Ücretsiz başla ${icon('right')}</a>`;
    const accm = $('#accm');
    if (accm) accm.innerHTML = u ? `<a href="#/programlarim">${icon('grid')} Programlarım</a><a href="#/hesabim">${icon('user')} Hesabım</a><a href="#" data-logout>${icon('logout')} Çıkış yap</a>`
      : `<a href="#/giris">${icon('user')} Giriş yap</a><a class="btn primary block" href="${signup}">Ücretsiz hesap oluştur</a>`;
    if (accm) accm.insertAdjacentHTML('beforeend', `<a href="#" data-theme onclick="return false">${icon(NS.getTheme() === 'dark' ? 'sun' : 'moon')} Açık / koyu tema</a>`);
  }
  async function logout(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (CL) { await NS.api('POST', '/api/auth/logout').catch(() => {}); CL.user = null; CL.licenses = []; } else ss.del(SKEY);
    drawNav(); location.hash = '#/'; toast('Çıkış yapıldı', 'ok');
  }

  // ---------- Telefona giriş linki: bilgisayarda açık oturumdan tek kullanımlık link (10 dk) ----------
  async function phoneLink() {
    if (!CL || !CL.user) return toast('Bu özellik bulut hesabında çalışır', 'err');
    let r; try { r = await NS.api('POST', '/api/auth/link/new'); } catch (e) { return toast(e.message, 'err'); }
    if (NS.qrReady) await NS.qrReady();
    const url = location.origin + r.path; const msg = `${S().siteName} giriş bağlantım (${r.minutes} dk geçerli, tek kullanımlık): ${url}`;
    NS.modal({ title: 'Telefonumda aç', body: `<p class="muted mb">Bu bağlantıyı telefonunuzda açın; şifre yazmadan giriş yaparsınız. Bağlantı <b>${r.minutes} dakika</b> geçerlidir ve <b>bir kez</b> kullanılabilir — başkasıyla paylaşmayın.</p>
      <div class="center mb">${NS.qrSvg(url, 200)}<div class="small muted">Telefonunuzun kamerasıyla okutun ya da bağlantıyı kendinize gönderin</div></div><div class="row nw mb"><input class="input" value="${esc(url)}" readonly><button class="btn" data-copy="${esc(url)}">${icon('copy')}</button></div>
      <div class="grid g2"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${icon('message')} WhatsApp ile kendime gönder</a><a class="btn" href="sms:?&body=${encodeURIComponent(msg)}">${icon('send')} SMS ile gönder</a></div>
      <p class="small faint mt">Telefonda açtıktan sonra tarayıcı menüsünden <b>Ana ekrana ekle</b> ile uygulama gibi kullanabilirsiniz.</p>`, actions: [{ label: 'Kapat' }] });
  }
  async function linkLogin(el, token) {
    el = fresh(el);
    el.innerHTML = `<section class="sec"><div class="mk-wrap center" style="max-width:420px"><div class="card pad"><div class="skel" style="height:14px;width:60%;margin:0 auto 12px"></div><p class="muted">Giriş yapılıyor…</p></div></div></section>`;
    if (!CL) { location.hash = '#/giris'; return; }
    try { await NS.api('POST', '/api/auth/link', { token }); await refreshMe(); toast('Giriş yapıldı', 'ok'); history.replaceState(null, '', location.pathname + location.search); landing(); }
    catch (e) { el.innerHTML = `<section class="sec"><div class="mk-wrap" style="max-width:460px"><div class="card pad center">${icon('alert', 'ico-lg')}<h2 class="mt">Bağlantı kullanılamadı</h2><p class="muted mt">${esc(e.message)}</p><a class="btn primary mt" href="#/giris">Giriş yap</a></div></div></section>`; }
  }

  // ---------- Programlarım: giriş sonrası tek kapı ----------
  // Lisanslar tek biçimde: { pid, status, end, valid } (bulutta sunucudan, demoda tarayıcıdaki siparişlerden)
  const DKEY = 'nebsoft:defaultApp', LKEY = 'nebsoft:lastApp';
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok */ } };
  function myApps() {
    const u = me(); if (!u) return [];
    const nowIso = new Date().toISOString();
    const raw = CL ? (CL.licenses || []).filter((l) => l.status !== 'iptal' || l.valid).map((l) => ({ pid: l.product, status: l.status, end: l.end, valid: !!l.valid }))
      : db.all('licenses', (l) => l.customer === u.id).map((l) => ({ pid: l.pid, status: l.status, end: l.end, valid: l.status === 'aktif' && l.end > nowIso }));
    const out = new Map();
    raw.flatMap((l) => (l.pid === 'bundle' ? products().filter((p) => p.ready).map((p) => ({ ...l, pid: p.id })) : [l]))
      .filter((l) => prod(l.pid)).forEach((l) => { const ex = out.get(l.pid); if (!ex || (l.valid && !ex.valid) || (l.valid === ex.valid && l.end > ex.end)) out.set(l.pid, l); });
    return [...out.values()].sort((a, b) => b.valid - a.valid || (lsGet(LKEY, {})[b.pid] || '').localeCompare(lsGet(LKEY, {})[a.pid] || '') || prod(a.pid).name.localeCompare(prod(b.pid).name, 'tr'));
  }
  function openApp(pid) {
    try { if (NS.pwa && NS.pwa.mobile && NS.pwa.mobile()) localStorage.removeItem('nebsoft:installAsk:app'); } catch (e) { /* yok */ } const L = lsGet(LKEY, {}); L[pid] = new Date().toISOString(); lsSet(LKEY, L); location.href = appUrl(pid); }
  // Girişten sonra: yönetici → panel · geri dönülecek uygulama → oraya · 1 program → doğrudan · varsayılan seçilmişse → o · diğer → seçici
  function landing() {
    if (!me()) { location.hash = '#/giris'; return; }
    if (CL && ['admin', 'superadmin'].includes(CL.user.role)) { location.href = 'admin/'; return; }
    const ok = myApps().filter((a) => a.valid);
    let next = null; try { next = sessionStorage.getItem('nebsoft:next'); sessionStorage.removeItem('nebsoft:next'); } catch (e) { /* yok */ }
    const nm = next && /^\/(t\/[a-z0-9-]+\/)?apps\/([a-z0-9]+)\/[\w.-]*(\?[^#]*)?$/.exec(next);
    if (nm && ok.some((a) => a.pid === nm[2])) { location.href = next; return; }
    if (ok.length === 1) return openApp(ok[0].pid);
    const def = lsGet(DKEY, null);
    if (def && ok.some((a) => a.pid === def)) return openApp(def);
    location.hash = '#/programlarim';
  }
  // Hesabım sayfasından girişe düşen kullanıcı oraya döner; diğer girişler tek kapıdan geçer
  function afterLogin() { if (/^#\/hesabim/.test(location.hash)) route(); else landing(); }
  let pickKeys = null; // seçici açıkken 1-9 tuşları programı açar
  addEventListener('keydown', (e) => { if (!pickKeys || e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return; const pid = pickKeys[Number(e.key) - 1]; if (pid) openApp(pid); });
  function appsPage(el) {
    el = fresh(el);
    const u = me();
    if (!u) { location.hash = '#/giris'; return; }
    const L = myApps(); const ok = L.filter((a) => a.valid); const def = lsGet(DKEY, null); const last = lsGet(LKEY, {});
    const days = (a) => Math.ceil((new Date(a.end) - Date.now()) / 864e5);
    const card = (a, i) => { const p = prod(a.pid); const d = days(a);
      return `<div class="appcard${a.valid ? '' : ' off'}" style="--pc:${p.accent}">
        <button class="appcard-main" ${a.status === 'talep' ? `data-wait="${a.pid}"` : a.valid ? `data-open="${a.pid}"` : `data-buy="${a.pid}"`} aria-label="${esc(p.name)} ${a.valid ? 'aç' : 'süre uzat'}">
          <span class="appcard-ic">${icon(p.icon, 'ico-lg')}</span>
          <span class="appcard-t"><b>${esc(p.name)}</b><span>${esc(p.tagline || '')}</span></span>
          <span class="appcard-m">${a.status === 'talep' ? badge('Denemeyi başlatmak için dokunun', 'warn') : a.valid ? (a.status === 'deneme' ? badge(`Deneme · ${d} gün`, d <= 2 ? 'warn' : 'info') : badge(d <= 14 ? `${d} gün kaldı` : 'Aktif', d <= 14 ? 'warn' : 'ok')) : badge('Süresi doldu', 'err')}
            ${last[a.pid] ? `<span class="small faint">Son kullanım ${NS.dt(last[a.pid])}</span>` : ''}</span>
          <span class="appcard-go">${a.status === 'talep' ? `${icon('clock')} Onaylanınca açılır` : a.valid ? `${i < 9 ? `<kbd>${i + 1}</kbd>` : ''} Aç ${icon('right')}` : `${icon('cart')} Satın al`}</span>
        </button>
        ${a.valid && ok.length > 1 ? `<button class="appcard-star${def === a.pid ? ' on' : ''}" data-def="${a.pid}" title="${def === a.pid ? 'Varsayılan program (girişte doğrudan açılır)' : 'Girişte doğrudan bu program açılsın'}" aria-pressed="${def === a.pid}">${icon('star')}</button>` : ''}
      </div>`; };
    const pop = products().filter((p) => p.ready).slice(0, 8);
    el.innerHTML = `<section class="sec apps-sec"><div class="mk-wrap">
      <div class="apps-h"><div><p class="eyebrow">${esc(u.company || S().siteName)}</p><h1>Merhaba ${esc(u.name.split(' ')[0])}, ${L.length ? 'hangi programla çalışmak istersiniz?' : 'hoş geldiniz!'}</h1>
        <p class="muted">${L.length ? (ok.length > 1 ? 'Bir program seçin. Yıldızladığınız program bir dahaki girişte doğrudan açılır. Klavyeden 1–9 tuşlarıyla da açabilirsiniz.' : 'Programınızı açın veya yeni bir program deneyin.') : `Hesabınız hazır ve süresiz ücretsiz. Denemek istediğiniz programı seçin; ${TRIAL()} günlük denemeniz hemen başlar.`}</p></div>
        <div class="row">${NS.pwa && !NS.pwa.installed() ? `<button class="btn" data-install>${icon('download')} Uygulamayı yükle</button>` : ''}${CL ? `<button class="btn" data-phone>${icon('phone')} Telefonumda aç</button>` : ''}<a class="btn" href="#/hesabim">${icon('key')} Lisans ve abonelik</a></div></div>
      ${L.length ? `<div class="apps-grid">${L.map(card).join('')}<a class="appcard add" href="#/urunler"><span class="appcard-ic">${icon('plus', 'ico-lg')}</span><span class="appcard-t"><b>Yeni program ekle</b><span>${TRIAL()} gün ücretsiz deneyin</span></span></a></div>`
        : `<div class="center mb"><img src="assets/empty/baslayalim.png" alt="" width="120" height="86" class="empty-art" style="width:120px;height:auto"></div><div class="apps-grid">${pop.map((p) => `<div class="appcard" style="--pc:${p.accent}"><button class="appcard-main" data-trial="${p.id}"><span class="appcard-ic">${icon(p.icon, 'ico-lg')}</span><span class="appcard-t"><b>${esc(p.name)}</b><span>${esc(p.tagline || '')}</span></span><span class="appcard-go">Deneme talep et ${icon('right')}</span></button></div>`).join('')}</div><p class="center mt"><a href="#/urunler">Tüm programları görün →</a></p>`}
    </div></section>`;
    pickKeys = ok.slice(0, 9).map((a) => a.pid);
    if (NS.pwa && NS.pwa.offer) setTimeout(() => NS.pwa.offer(), 1500); // telefonda ilk girişte ana ekrana ekleme önerisi
    on(el, 'click', '[data-open]', (e, b) => openApp(b.dataset.open));
    on(el, 'click', '[data-buy]', (e, b) => { addCart(b.dataset.buy, 1, 'aylik'); location.hash = '#/sepet'; });
    on(el, 'click', '[data-trial]', (e, b) => startTrial(b.dataset.trial));
    on(el, 'click', '[data-wait]', async (e, b) => { try { await NS.api('POST', '/api/trial', { product: b.dataset.wait }); await refreshMe(); toast(`${TRIAL()} günlük denemeniz başladı`, 'ok'); drawNav(); route(); } catch (x) { toast(x.message, 'err'); } });
    on(el, 'click', '[data-def]', (e, b) => { const v = b.dataset.def; lsSet(DKEY, lsGet(DKEY, null) === v ? null : v); toast(lsGet(DKEY, null) ? `${prod(v).name} girişte doğrudan açılacak` : 'Varsayılan program kaldırıldı', 'ok'); appsPage(el); });
  }
  function reveal(root) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    $$('.reveal', root).forEach((x) => io.observe(x));
    // Gözlemci hiç tetiklenmezse (arka plan sekmesi, yazdırma vb.) içerik görünmez kalmasın
    setTimeout(() => $$('.reveal', root).forEach((x) => x.classList.add('in')), 1200);
  }
  // Programların gerçek ekran görüntüleri (site/<tanıtım>/img)
  const SLUG = { randevu: 'randevusistemi', adisyon: 'adisyonprogrami', pos: 'marketprogrami', eticaret: 'eticaretpaketi', pazaryeri: 'pazaryeriprogrami', otel: 'otelprogrami', servis: 'teknikservisprogrami', spor: 'sporsalonuprogrami', muhasebe: 'onmuhasebeprogrami', klinik: 'klinikprogrami', emlak: 'emlakprogrami', kurs: 'kursprogrami', oto: 'otoyikamaprogrami', kiralama: 'arackiralamaprogrami', site: 'siteyonetimprogrami', crm: 'crmprogrami', ik: 'personeltakipprogrami', veteriner: 'veterinerprogrami', eczane: 'eczaneprogrami', kargo: 'kargotakipprogrami', bilet: 'biletsatisprogrami', fabrika: 'fabrikaerp', butik: 'butikprogrami', otoservis: 'otoservisprogrami', musavir: 'malimusavirprogrami', toptan: 'toptanciprogrami', fiyatrobotu: 'pazaryerikarhesaplama', kuyumcu: 'kuyumcuprogrami', galeri: 'otogaleriprogrami', hukuk: 'hukukburosuprogrami', anaokulu: 'anaokuluprogrami' };
  // Ürün bağlantısı: tanıtım sayfası varsa gerçek adres (arama motoru izler), yoksa uygulama içi sayfa
  const urunHref = (p) => (SLUG[p.id] ? '/' + SLUG[p.id] : '#/urun/' + p.id);
  const shot = (id, n = 1, kind = 'pc') => (SLUG[id] ? `site/${SLUG[id]}/img/${kind}-${n}.jpg` : '');
  const pcard = (p) => `<a class="pcard reveal" href="${urunHref(p)}" style="--pc:${p.accent}">${p.ready ? '' : `<span class="badge warn soon">Yakında</span>`}
      ${shot(p.id) ? `<div class="shot"><img src="${shot(p.id)}" alt="${esc(p.name)} ekranı" loading="lazy" decoding="async" width="1440" height="900"><span class="pic-badge">${icon(p.icon)}</span></div>` : `<div class="pic">${icon(p.icon, 'ico-lg')}</div>`}<h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p>
      
      <div class="row between"><div class="price">Başlangıç <b>${money(p.prices[0]).replace(',00', '')}</b>/ay</div><span class="btn sm ${p.ready ? 'primary' : ''}">${p.ready ? 'İncele' : 'Haber ver'} ${icon('right')}</span></div></a>`;

  // ---------- Ana sayfa ----------
  function home(el) {
    const ps = products();
    const ready = ps.filter((p) => p.ready);
    const u = me();
    const serie = Array.from({ length: 12 }, (_, i) => 30 + i * 6 + rand(-8, 12));
    const popular = ready.slice(0, 6);
    el.innerHTML = `
      ${u ? `<div class="hm-back"><div class="mk-wrap row"><span class="avatar">${esc(NS.initials(u.name))}</span><span class="grow">Tekrar hoş geldiniz, <b>${esc(u.name.split(' ')[0])}</b>. Programlarınız sizi bekliyor.</span><a class="btn primary sm" href="#/programlarim">${icon('grid')} Programlarıma git</a></div></div>` : ''}
      <section class="hm-hero"><div class="hm-aurora" aria-hidden="true"></div><div class="hm-grid" aria-hidden="true"></div><div class="mk-wrap hm-hero-in">
        <div class="hm-copy">
          <span class="hm-pill">${icon('sparkles')} ${ready.length} sektörel program · Web, masaüstü ve mobil</span>
          <h1>İşletmenizi <span class="grad">tek hesaptan</span> yönetin.</h1>
          <p class="lead">Market, restoran, kuaför, otel, oto servis… Sektörünüze özel bulut yazılımlarıyla satış, stok ve müşteri takibi tek yerde.</p>
          <form class="hm-find" id="hf" onsubmit="return false" role="search"><span>${icon('search')}</span><input id="hq" placeholder="İşletmeniz ne iş yapıyor? (ör. kafe, kuaför, oto sanayi)" autocomplete="off" aria-label="Sektör veya program ara"><button class="btn primary">Program bul</button></form>
          <div class="hm-quick">${popular.map((p) => `<a href="${urunHref(p)}" style="--pc:${p.accent}">${icon(p.icon)} ${esc(p.name)}</a>`).join('')}</div>
          <div class="row hm-cta"><a class="btn primary lg" href="#/kayit">${icon('rocket')} Ücretsiz hesap oluştur</a><a class="btn lg ghost-w" href="apps/pos/index.html?demo=1" target="_blank" rel="noopener">${icon('play')} Kayıt olmadan demoyu dene</a></div>
          <ul class="hm-facts"><li>${icon('check')} Hesap süresiz ve ücretsiz</li><li>${icon('check')} Her program ${TRIAL()} gün ücretsiz deneme</li><li>${icon('check')} Kredi kartı gerekmez</li></ul>
        </div>
        <div class="hm-visual">
          <div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>nebsoftapp.com/pos</span></div>
            <div class="mock-body"><div class="mock-side">${[['home', 'Özet', 1], ['barcode', 'Satış'], ['box', 'Ürünler'], ['users', 'Müşteriler'], ['chart', 'Raporlar']].map(([i, l, x]) => `<div class="${x ? 'on' : ''}">${icon(i)} ${l}</div>`).join('')}</div>
            <div class="mock-main"><div class="mock-kpis"><div><b>₺48.250</b><span>Bugünkü ciro</span></div><div><b>312</b><span>Fiş</span></div><div><b>%24</b><span>Kâr marjı</span></div></div>
            <div class="card" style="padding:10px">${chart.line([{ name: 'Ciro', values: serie, color: LOGO() }], ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'], { height: 170 })}</div></div></div></div>
          <div class="float-card" style="left:-26px;bottom:40px"><div class="ic" style="background:#9333ea">${icon('calendar')}</div><div><b>Yeni online randevu</b><div class="faint">Bugün 14:30</div></div></div>
          <div class="float-card" style="right:-14px;top:-18px;animation-delay:1.5s"><div class="ic" style="background:#e11d48">${icon('bell')}</div><div><b>Masa 5 garson çağırıyor</b><div class="faint">QR menü · az önce</div></div></div>
          <div class="float-card" style="right:30px;bottom:-22px;animation-delay:.8s"><div class="ic" style="background:#16a34a">${icon('check')}</div><div><b>Müşteri teklifi onayladı</b><div class="faint">Oto servis · 34 ABC 123</div></div></div>
        </div>
      </div></section>

      <section class="sec" id="urunler"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Programlar</span><h2>Hangi işi yapıyorsunuz?</h2><p>Sektörünüzü seçin; size özel programı inceleyin, kayıt olmadan demosunu açın.</p></div>
        <div class="chips" id="hc"><button class="chip active" data-c="">Tümü</button>${C.categories.map((c) => `<button class="chip" data-c="${c.id}">${icon(c.icon)} ${esc(c.name)}</button>`).join('')}</div>
        <div class="pgrid" id="hp">${ps.map(pcard).join('')}</div>
      </div></section>

      <section class="sec hm-bento-sec"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Neden ${esc(S().siteName)}?</span><h2>Sadece program değil, işinizi yürüten bir sistem</h2><p>Tüm programlar aynı güçlü altyapıyı, aynı hesabı ve aynı entegrasyon merkezini paylaşır.</p></div>
        <div class="hm-bento">
          <div class="hm-b big reveal"><div class="hm-b-ic">${icon('bell')}</div><h3>Bildirimler tek yerde</h3><p>Garson çağrısı, yeni paket sipariş, online randevu, müşteri onayı… Her olay için ayrı ses, onaylanana kadar tekrar, sessiz saatler. Telefonda titreşim, bilgisayarda masaüstü bildirimi.</p>
            <div class="hm-notes"><span>${icon('bell')} Masa 7 garson çağırıyor</span><span>${icon('bag')} Yeni paket sipariş</span><span>${icon('check')} Müşteri teklifi onayladı</span></div></div>
          <div class="hm-b reveal"><div class="hm-b-ic">${icon('edit')}</div><h3>Kendi belgeniz, dijital imza</h3><p>Fiş, iş emri, teslim formu: logonuz, renginiz, metinleriniz. Müşteriye ekranda imzalatın.</p></div>
          <div class="hm-b reveal"><div class="hm-b-ic">${icon('zap')}</div><h3>Entegrasyon merkezi</h3><p>Her programda işinize yarayan bağlantılar tek sayfada. Kullanım için ilgili sağlayıcıdaki hesabınız gerekir.</p></div>
          <div class="hm-b reveal"><div class="hm-b-ic">${icon('globe')}</div><h3>İnternet gitse de çalışır</h3><p>Kayıtlar cihazda tutulur, bağlantı gelince buluta eşitlenir.</p></div>
          <div class="hm-b reveal"><div class="hm-b-ic">${icon('shield')}</div><h3>Yetki ve kayıt</h3><p>Rol ve yetki, işlem günlüğü, son 48 saatin değişiklik geçmişi.</p></div>
        </div>
      </div></section>

      <section class="sec"><div class="mk-wrap"><div class="hm-devices reveal">
        <div><span class="eyebrow">Her cihazda</span><h2>Tek hesap: web, masaüstü ve mobil</h2><p class="muted">Aynı e-posta ve şifreyle giriş yapın. Tek programınız varsa doğrudan açılır; birden fazlaysa seçmeniz yeter.</p>
          <div class="row mt"><a class="btn primary" href="#/indir">${icon('download')} Masaüstü sürümünü indir</a><button class="btn" data-install>${icon('phone')} Telefona ekle</button></div></div>
        <div class="hm-dev-cards">${[['store', 'Web', 'Her tarayıcıda, kurulumsuz'], ['download', 'Masaüstü', 'Sessiz yazdırma, kasa modu'], ['phone', 'Mobil', 'Ana ekrana ekle, tek dokunuşla giriş']].map(([i, t, d]) => `<div><span>${icon(i, 'ico-lg')}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>
      </div></div></section>

      <section class="sec" style="padding-top:0"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Nasıl çalışır?</span><h2>Üç adımda hazırsınız</h2></div>
        <div class="steps3">${[['Ücretsiz hesap açın', `Kısa bir formla kayıt olun. Hesabınız süresizdir; seçtiğiniz programın ${TRIAL()} günlük deneme lisansı hemen başlar.`], ['Verilerinizi aktarın', 'Ürün, müşteri ve stoklarınızı Excel ile yükleyin; takıldığınız yerde destek ekibimize yazın.'], ['Paketinizi seçin', 'Deneme bitince aylık ya da yıllık (2 ay bedava) paketinizi seçin; verileriniz olduğu gibi kalır.']].map(([h, p], i) => `<div class="card reveal hm-step"><span class="hm-step-n">${i + 1}</span><h3 class="mb">${h}</h3><p class="muted">${p}</p></div>`).join('')}</div>
      </div></section>

      ${window.NB_PAKET.vitrin()}

      <section class="sec" style="padding-top:0"><div class="mk-wrap"><div class="bundle reveal">
        <div><span class="badge" style="background:rgba(255,255,255,.18);color:#fff;border:0">BİRDEN FAZLA İŞİNİZ Mİ VAR?</span><h2 class="mt">Hepsi Bir Arada</h2><p style="opacity:.9;margin-top:10px">Tüm ${esc(S().siteName)} programlarını tek abonelikle kullanın. Yeni çıkan programlar da otomatik olarak dahil.</p></div>
        <div class="center"><div class="old">${money(sum(ready, (p) => p.prices[1]))}/ay</div><div style="font-size:44px;font-weight:800;letter-spacing:-.03em">${money(prod('bundle').prices[1]).replace(',00', '')}<span style="font-size:16px;opacity:.8">/ay</span></div><button class="btn lg mt" data-bundle>${icon('cart')} Paketi sepete ekle</button></div>
      </div></div></section>

      <section class="sec" style="padding-top:0"><div class="mk-wrap" style="max-width:820px">
        <div class="sec-h reveal"><span class="eyebrow">SSS</span><h2>Sık sorulan sorular</h2></div>
        <div class="faq">${C.faq.map(([q, x]) => `<details class="reveal"><summary>${esc(q)}</summary><p>${esc(x)}</p></details>`).join('')}</div>
        <div class="card pad center mt reveal"><h2>Hâlâ karar veremediniz mi?</h2><p class="muted mt">Uzmanımız sizi arasın, işletmenize en uygun programı birlikte seçelim.</p><div class="row mt" style="justify-content:center"><a class="btn primary lg" href="#/iletisim">${icon('phone')} Beni arayın</a><a class="btn lg" href="tel:${esc(String(S().phone || '').replace(/[^\d+]/g, ''))}">${esc(S().phone || '')}</a></div></div>
      </div></section>`;
    const filter = (cat) => { $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x.dataset.c === cat)); $('#hp', el).innerHTML = ps.filter((p) => !cat || p.cat === cat).map(pcard).join(''); $$('#hp .reveal', el).forEach((x) => x.classList.add('in')); };
    on(el, 'click', '[data-c]', (e, t) => filter(t.dataset.c));
    // Arama: sektör, program adı veya açıklamada eşleşenler listelenir
    $('#hf', el).onsubmit = () => {
      const q = $('#hq', el).value.trim(); if (!q) return false;
      const L = ps.filter((p) => NS.match(q, p.name, p.tagline, ...(p.sectors || [])));
      $$('[data-c]', el).forEach((x) => x.classList.remove('active'));
      $('#hp', el).innerHTML = L.length ? L.map(pcard).join('') : `<div class="card pad empty" style="grid-column:1/-1">${icon('search')}<div>“${esc(q)}” için program bulunamadı</div><a class="btn mt" href="#/iletisim">Bize sorun, size uygun çözümü bulalım</a></div>`;
      $$('#hp .reveal', el).forEach((x) => x.classList.add('in')); $('#urunler', el).scrollIntoView({ behavior: 'smooth' }); return false;
    };
    on(el, 'click', '[data-bundle]', () => { addCart('bundle', 1, 'aylik'); location.hash = '#/sepet'; });
    el.insertAdjacentHTML('beforeend', '<div id="guven-slot" hidden></div>'); window.NB_GUVEN.mount($('#guven-slot', el));
    reveal(el);
  }

  // ---------- Ürün listesi ----------
  function catalogPage(el, cat) {
    let q = '', c = cat || '', sort = 'pop';
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap">
      <div class="page-h"><div class="grow"><h1>Tüm ürünler</h1><p>${products().length} sektörel yazılım · her biri için ücretsiz canlı demo</p></div>
        ${NS.searchBox('q', 'Ürün veya sektör ara... (ör. kuaför)')}<select class="input" id="so" style="max-width:180px"><option value="pop">Önerilen sıra</option><option value="price">En uygun fiyat</option><option value="new">Önce canlı olanlar</option></select></div>
      <div class="chips" style="justify-content:flex-start"><button class="chip ${!c ? 'active' : ''}" data-c="">Tümü</button>${C.categories.map((x) => `<button class="chip ${c === x.id ? 'active' : ''}" data-c="${x.id}">${icon(x.icon)} ${esc(x.name)}</button>`).join('')}</div>
      <div class="pgrid" id="pg"></div></div></section>`;
    const draw = () => {
      let list = products().filter((p) => (!c || p.cat === c) && NS.match(q, p.name, p.tagline, p.desc, ...(p.sectors || [])));
      list.sort(sort === 'price' ? (a, b) => a.prices[0] - b.prices[0] : sort === 'new' ? (a, b) => b.ready - a.ready : () => 0);
      $('#pg', el).innerHTML = list.map(pcard).join('') || `<div class="empty">${icon('search')}<div>Sonuç bulunamadı. <a href="#/iletisim">Bize yazın</a>, ihtiyacınız olan yazılımı birlikte planlayalım.</div></div>`;
      $$('.reveal', el).forEach((x) => x.classList.add('in'));
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#so', el).onchange = (e) => { sort = e.target.value; draw(); };
    on(el, 'click', '[data-c]', (e, t) => { c = t.dataset.c; $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x === t)); draw(); });
    draw();
  }
  // Sektörler: her sektör kendi programının gerçek ekran görüntüsüyle; arama ve kategori filtresi
  function sectorsPage(el) {
    const all = {};
    products().forEach((p) => (p.sectors || []).forEach((x) => { (all[x] = all[x] || []).push(p); }));
    const list = Object.entries(all).sort((x, y) => x[0].localeCompare(y[0], 'tr')).map(([name, ps]) => ({ name, ps, cat: ps[0].cat }));
    let q = '', cat = '';
    el.innerHTML = `<section class="sec sx" style="padding-top:44px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Sektörler</span><h2>${list.length}+ sektör için hazır çözüm</h2><p>İşletmenizi bulun; size özel programı inceleyin, kayıt olmadan demosunu açın.</p></div>
      <div class="sx-bar"><div class="sx-search">${icon('search')}<input id="sq" placeholder="Sektör ara: kafe, kuaför, oto sanayi, eczane…" aria-label="Sektör ara"></div>
        <div class="chips" id="sc"><button class="chip active" data-sc="">Tümü</button>${C.categories.map((k) => `<button class="chip" data-sc="${k.id}">${icon(k.icon)} ${esc(k.name)}</button>`).join('')}</div></div>
      <div class="sx-grid" id="sg"></div></div></section>`;
    const draw = () => {
      const L = list.filter((x) => (!cat || x.ps.some((p) => p.cat === cat)) && (!q || NS.match(q, x.name, ...x.ps.map((p) => p.name))));
      $('#sg', el).innerHTML = L.length ? L.map((x) => { const p = x.ps[0]; return `<a class="sx-card" href="${urunHref(p)}" style="--pc:${p.accent}"><div class="sx-img">${shot(p.id) ? `<img src="${shot(p.id, 1, (x.name.length % 3 === 0 && SLUG[p.id]) ? 'mobil' : 'pc')}" alt="${esc(p.name)} ekranı" loading="lazy" decoding="async" onerror="this.src='${shot(p.id)}'">` : ''}<span class="sx-ic">${icon(p.icon)}</span></div>
          <div class="sx-body"><b>${esc(x.name)}</b><div class="sx-ps">${x.ps.slice(0, 3).map((pp) => `<span style="--pc:${pp.accent}">${esc(pp.name)}</span>`).join('')}${x.ps.length > 3 ? `<span>+${x.ps.length - 3}</span>` : ''}</div><span class="sx-go">İncele ${icon('right')}</span></div></a>`; }).join('')
        : `<div class="card pad empty" style="grid-column:1/-1">${icon('search')}<div>"${esc(q)}" için sektör bulunamadı</div><a class="btn mt" href="#/iletisim">Bize sorun, uygun çözümü bulalım</a></div>`;
    };
    $('#sq', el).oninput = (e) => { q = e.target.value.trim(); draw(); };
    on(el, 'click', '[data-sc]', (e, b) => { cat = b.dataset.sc; $$('[data-sc]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    draw();
  }

  // ---------- Ürün detayı ----------
  function productPage(el, id) {
    const p = prod(id);
    if (!p || id === 'bundle') { location.hash = '#/urunler'; return; }
    let period = 'aylik';
    const demo = `apps/${p.id}/index.html?demo=1`;
    const related = products().filter((x) => x.id !== p.id && (x.cat === p.cat || x.ready)).slice(0, 3);
    el.style.setProperty('--pc', p.accent);
    el.innerHTML = `<section class="phero"><div class="mk-wrap">
        <div class="row small muted mb"><a href="#/urunler">Ürünler</a> / <span>${esc((C.categories.find((c) => c.id === p.cat) || {}).name)}</span></div>
        <div class="grid g-21" style="align-items:center"><div>
          <div class="row nw mb"><div class="pcard" style="--pc:${p.accent};padding:0;border:0;background:none;box-shadow:none"><div class="pic" style="width:64px;height:64px">${icon(p.icon, 'ico-lg')}</div></div>
            <div><h1 style="font-size:36px">${esc(p.name)}</h1><div class="muted">${esc(p.tagline)}</div></div></div>
          <p style="font-size:16px" class="mb">${esc(p.desc)}</p>
          <div class="row">${p.ready ? `<button class="btn primary lg" data-trial>${icon('rocket')} ${TRIAL()} gün ücretsiz dene</button><a class="btn lg" href="${demo}" target="_blank">${icon('play')} Canlı demo</a><button class="btn lg" data-buy="1">${icon('cart')} Satın al</button>` : `<button class="btn primary lg" data-notify>${icon('bell')} Çıkınca haber ver</button><span class="badge warn">Geliştirme aşamasında</span>`}</div>
          ${(p.extraDemos || []).map((d) => `<a class="btn ghost mt" href="${d.url}" target="_blank">${icon('eye')} ${esc(d.label)}</a>`).join('')}
        </div>
        <div class="card pad"><h3 class="mb">Bu ürün kimler için?</h3><div class="row gap-s">${(p.sectors || []).map((s) => badge(s, 'acc')).join('')}</div><hr><h3 class="mb">Modüller</h3><div class="row gap-s">${p.modules.map((m) => `<span class="badge">${icon('check')} ${esc(m)}</span>`).join('')}</div></div></div>
      </div></section>
      ${p.ready ? `<section class="sec" style="padding-top:10px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Canlı önizleme</span><h2>Hemen burada deneyin</h2><p>Aşağıdaki pencere gerçek uygulamadır — tıklayın, satış yapın, rapor alın. Veriler yalnızca sizin tarayıcınızda tutulur.</p></div>
        <div class="browser"><div class="mock-bar"><i></i><i></i><i></i><span>nebsoftapp.com/${p.id}</span><a class="btn sm ghost" href="${demo}" target="_blank">${icon('right')} Tam ekran</a></div><iframe src="${demo}" loading="lazy" title="${esc(p.name)} demo"></iframe></div></div></section>` : ''}
      <section class="sec" style="padding-top:10px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Özellikler</span><h2>${esc(p.name)} ile neler yapabilirsiniz?</h2></div>
        <div class="card pad"><div class="fl">${p.features.map((f) => `<div>${icon('check')}<span>${esc(f)}</span></div>`).join('')}</div></div></div></section>
      <section class="sec" style="padding-top:10px" id="fiyat"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Fiyatlandırma</span><h2>Size uygun paketi seçin</h2><p>Fiyatlara KDV dahil değildir. Yıllık ödemede 2 ay bedava.</p><div class="seg mt"><button data-per="aylik" class="active">Aylık</button><button data-per="yillik">Yıllık (2 ay bedava)</button></div></div>
        <div class="plans" id="plans"></div></div></section>
      <section class="sec" style="padding-top:10px"><div class="mk-wrap" style="max-width:820px"><div class="sec-h"><h2>Sık sorulanlar</h2></div><div class="faq">${[...(p.faq || []), ...C.faq.slice(0, 3)].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
      <section class="sec" style="padding-top:10px"><div class="mk-wrap"><h2 class="mb">Bunlar da ilginizi çekebilir</h2><div class="pgrid">${related.map(pcard).join('')}</div></div></section>`;
    const drawPlans = () => {
      $('#plans', el).innerHTML = C.plans.map((pl, i) => {
        const feats = i === 0 ? p.features.slice(0, 5) : i === 1 ? p.features.slice(0, 9) : p.features;
        return `<div class="plan ${pl.popular ? 'pop' : ''}">${pl.popular ? '<span class="badge acc" style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--brand);color:#fff">Önerilen</span>' : ''}
          <div><h3>${esc(pl.name)}</h3><div class="small muted">${esc(pl.desc)}</div></div>
          <div><span class="pp">${money(price(p, i, period)).replace(',00', '')}</span><span class="muted">/${period === 'yillik' ? 'yıl' : 'ay'}</span>${period === 'yillik' ? `<div class="small" style="color:var(--ok)">${money(p.prices[i] * 2)} tasarruf</div>` : ''}</div>
          <ul><li>${icon('users')} ${esc(pl.users)}</li>${i === 2 ? `<li>${icon('check')} Çoklu şube yönetimi</li><li>${icon('check')} API erişimi ve entegrasyonlar</li><li>${icon('check')} Öncelikli destek & kurulum</li>` : ''}${feats.map((f) => `<li>${icon('check')} ${esc(f)}</li>`).join('')}</ul>
          ${p.ready ? `<button class="btn ${pl.popular ? 'primary' : ''} lg block" data-plan="${i}">${icon('cart')} Sepete ekle</button>` : `<button class="btn lg block" data-notify>Haber ver</button>`}</div>`;
      }).join('');
    };
    on(el, 'click', '[data-per]', (e, t) => { period = t.dataset.per; $$('[data-per]', el).forEach((x) => x.classList.toggle('active', x === t)); drawPlans(); });
    on(el, 'click', '[data-plan]', (e, t) => { addCart(p.id, Number(t.dataset.plan), period); location.hash = '#/sepet'; });
    on(el, 'click', '[data-buy]', () => $('#fiyat', el).scrollIntoView({ behavior: 'smooth' }));
    on(el, 'click', '[data-trial]', () => startTrial(p.id));
    on(el, 'click', '[data-notify]', async () => {
      const v = await formModal({ title: `${p.name} çıkınca haber verelim`, fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'biz', label: 'İşletme adı' }], submitLabel: 'Kaydet' });
      if (v) { if (CL) { try { await NS.api('POST', '/api/leads', { ...v, product: p.id, type: 'bekleme', msg: 'Ürün çıkınca haber verilsin' }); } catch (x) { return toast(x.message, 'err'); } } else db.insert('leads', { ...v, product: p.id, type: 'bekleme', status: 'yeni', msg: 'Ürün çıkınca haber verilsin' }); toast('Kaydınız alındı, ürün çıkınca sizi arayacağız', 'ok'); }
    });
    drawPlans();
    el.insertAdjacentHTML('beforeend', '<div id="guven-slot" hidden></div>'); window.NB_GUVEN.mount($('#guven-slot', el), p.id);
    // Gerçek ekran görüntüleri: masaüstü ve telefon
    if (SLUG[p.id]) { const first = el.querySelector('section'); if (first) first.insertAdjacentHTML('afterend', `<section class="sec pg-sec"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Ekranlar</span><h2>${esc(p.name)} nasıl görünüyor?</h2><p>Programın gerçek ekranları; kayıt olmadan demoda kendiniz deneyebilirsiniz.</p></div><div class="pg-grid">${[1, 2, 3].map((n) => `<figure class="pg-shot"><img src="${shot(p.id, n)}" alt="${esc(p.name)} ekran ${n}" loading="lazy" decoding="async" onerror="this.closest('figure').remove()"></figure>`).join('')}<figure class="pg-shot pg-phone"><img src="${shot(p.id, 1, 'mobil')}" alt="${esc(p.name)} telefon ekranı" loading="lazy" decoding="async" onerror="this.closest('figure').remove()"></figure></div></div></section>`); }
    $$('.reveal', el).forEach((x) => x.classList.add('in'));
  }

  // ---------- Hazır paketler (ekran: market/paket-ek.js) ----------
  const paketCtx = () => ({ addPaket, prod, urunHref, plans: C.plans, bulut: () => !!CL, trial: TRIAL });

  // ---------- Fiyatlar ----------
  function pricingPage(el) {
    const ps = products();
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Fiyatlandırma</span><h2>Şeffaf fiyatlar, gizli ücret yok</h2><p>Tüm fiyatlar aylık ve KDV hariçtir. Yıllık ödemede 2 ay bedava.</p></div>
      <div class="bundle mb"><div><h2>Hepsi Bir Arada</h2><p style="opacity:.9;margin-top:8px">Tüm ürünler + gelecekte çıkacak ürünler, tek abonelik.</p></div><div class="row" style="justify-content:center">${C.plans.map((pl, i) => `<div class="center" style="padding:0 12px"><div class="small" style="opacity:.85">${pl.name}</div><div style="font-size:26px;font-weight:800">${money(BUNDLE.prices[i]).replace(',00', '')}</div><button class="btn sm mt" data-bp="${i}">Seç</button></div>`).join('')}</div></div>
      <div class="card">${table({ rows: ps, columns: [{ label: 'Ürün', render: (p) => `<a href="${urunHref(p)}" class="row nw" style="color:inherit"><span class="avatar" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div><b>${esc(p.name)}</b> ${p.ready ? '' : badge('Yakında', 'warn')}<div class="small faint">${esc(p.tagline)}</div></div></a>` }, ...C.plans.map((pl, i) => ({ label: pl.name, cls: 'right', render: (p) => `<b>${money(p.prices[i]).replace(',00', '')}</b><span class="faint small">/ay</span>` }))], actions: [{ label: 'İncele', act: 'go' }] })}</div>
      <div class="grid g3 mt">${[['shield', `${TRIAL()} gün ücretsiz deneme`, 'Kredi kartı gerekmez.'], ['refresh', 'İstediğiniz zaman iptal', 'Aylık planlarda taahhüt yok.'], ['users', 'Ücretsiz kurulum desteği', 'Uzmanlarımız verilerinizi aktarır.']].map(([i, h, p]) => `<div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic">${icon(i)}</div></div><div><b>${h}</b><div class="small muted">${p}</div></div></div>`).join('')}</div></div></section>`;
    on(el, 'click', '[data-act=go]', (e, t) => { location.hash = '#/urun/' + t.dataset.id; });
    on(el, 'click', '[data-bp]', (e, t) => { addCart('bundle', Number(t.dataset.bp), 'aylik'); location.hash = '#/sepet'; });
  }

  // Aynı sayfa yeniden çizilirken eski olay dinleyicilerinin birikmemesi için kapsayıcıyı yeniler
  const fresh = (el) => { if (!el.isConnected) return el; const n = el.cloneNode(false); el.replaceWith(n); return n; };

  // ---------- Sepet & Ödeme ----------
  function cartPage(el) {
    el = fresh(el);
    const t = cartTotals(); const ek = !!CL && !!window.NB_SEPET; // bulutta tutarlar sunucudan gelir, destek paketi ve toplu indirim de orada hesaplanır
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><h1 class="mb">Sepetim</h1>${!t.lines.length && !(ek && cart().support) ? `<div class="card pad empty">${icon('cart')}<div>Sepetiniz boş</div><a class="btn primary mt" href="#/urunler">Ürünlere göz atın</a></div>` : `
      <div class="grid g-21"><div class="col" style="gap:16px;min-width:0">${t.lines.length ? `<div class="card">${t.lines.map((l) => `<div class="list-item" style="padding:16px 18px"><span class="avatar lg" style="background:${l.p.accent}22;color:${l.p.accent}">${icon(l.p.icon)}</span>
          <div class="grow"><b>${esc(l.p.name)}</b>${window.NB_PAKET.etiket(l.paket)}<div class="row mt gap-s">${l.p.addon ? '<span class="badge acc">Aylık eklenti</span>' : `<select class="input" style="max-width:150px;height:32px" data-pl="${l.id}">${C.plans.map((pl, i) => `<option value="${i}" ${i === l.plan ? 'selected' : ''}>${pl.name}</option>`).join('')}</select>`}
          <select class="input" style="max-width:170px;height:32px" data-pe="${l.id}"><option value="aylik" ${l.period === 'aylik' ? 'selected' : ''}>Aylık</option><option value="yillik" ${l.period === 'yillik' ? 'selected' : ''}>Yıllık (2 ay bedava)</option></select>
          <label class="small muted row nw">${ek ? 'Lisans' : 'Şube'} <input class="input" type="number" min="1" value="${l.qty || 1}" data-qt="${l.id}" style="width:64px;height:32px"></label></div></div>
          <div class="right"><b style="font-size:17px">${money(l.line)}</b><div class="small faint">${l.period === 'yillik' ? 'yıllık' : 'aylık'}</div></div><button class="btn ghost icon" data-rm="${l.id}">${icon('trash')}</button></div>`).join('')}</div>` : ''}${ek ? '<div id="sp-ek" class="col" style="gap:16px"></div>' : ''}</div>
        <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">Özet</h3><div id="sp-oz">
          <div class="list-item"><span class="grow muted">Ara toplam</span><b>${money(t.subtotal)}</b></div>
          ${t.discount ? `<div class="list-item" style="color:var(--ok)"><span class="grow">Kupon ${esc(t.coupon.code)} (%${t.coupon.pct})</span><b>-${money(t.discount)}</b></div>` : ''}
          <div class="list-item"><span class="grow muted">KDV (%${VAT})</span><b>${money(t.vat)}</b></div>
          <div class="list-item"><span class="grow"><b>Toplam</b></span><b style="font-size:22px">${money(t.total)}</b></div></div>
          <div class="row nw mt"><input class="input" id="cp" placeholder="Kupon kodu" value="${esc(cart().coupon || '')}"><button class="btn" id="cpb">Uygula</button></div>
          <a class="btn primary lg block mt" id="sp-git" href="#/odeme">${icon('lock')} Ödemeye geç</a>
          <p class="small faint center mt">${icon('shield')} Havale / EFT ile güvenli ödeme · taahhüt yok</p></div>
          ${CL ? '' : `<div class="card pad small muted">${icon('info')} Demo kuponu: <b>NEBSOFT20</b></div>`}</div></div>`}</div></section>`;
    const upd = (id, f) => { const it = cart().items.find((i) => i.id === id); f(it); db.save(); drawNav(); cartPage(el); };
    on(el, 'change', '[data-pl]', (e, x) => upd(x.dataset.pl, (i) => { i.plan = Number(x.value); }));
    on(el, 'change', '[data-pe]', (e, x) => upd(x.dataset.pe, (i) => { i.period = x.value; }));
    on(el, 'change', '[data-qt]', (e, x) => upd(x.dataset.qt, (i) => { i.qty = Math.max(1, Number(x.value) || 1); }));
    on(el, 'click', '[data-rm]', (e, x) => { cart().items = cart().items.filter((i) => i.id !== x.dataset.rm); db.save(); drawNav(); cartPage(el); });
    if ($('#cpb', el) && CL) $('#cpb', el).onclick = async () => { const code = $('#cp', el).value.trim().toUpperCase(); if (!code) { cart().coupon = null; cart().couponPct = 0; db.save(); return cartPage(el); } try { const r = await NS.api('POST', '/api/orders/quote', { ...window.NB_SEPET.istek(sepetCtx()), coupon: code }); cart().coupon = r.kuponGirildi; db.save(); toast(r.coupon ? 'Kupon uygulandı' : 'Toplu indirim daha yüksek olduğu için kupon uygulanmadı', r.coupon ? 'ok' : ''); cartPage(el); } catch (x) { toast(x.message, 'err'); } };
    else if ($('#cpb', el)) $('#cpb', el).onclick = () => { const code = $('#cp', el).value.trim().toUpperCase(); const k = db.find('coupons', (x) => x.code === code && x.active); if (code && !k) return toast('Geçersiz kupon', 'err'); cart().coupon = k ? code : null; db.save(); toast(k ? 'Kupon uygulandı' : 'Kupon kaldırıldı', 'ok'); cartPage(el); };
    if (ek && $('#sp-ek', el)) window.NB_SEPET.sepet(el, sepetCtx(() => cartPage(el)));
  }
  const sepetCtx = (yenile) => ({ cart, save: () => { db.save(); drawNav(); }, yenile, planName, me });
  function checkoutPage(el) {
    const t = cartTotals();
    if (!t.lines.length) { location.hash = '#/sepet'; return; }
    const u = me();
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><h1 class="mb">Ödeme</h1><div class="grid g-21">
      <div class="col" style="gap:16px"><div class="card pad" id="bf"><h3 class="mb">Fatura ve hesap bilgileri</h3>${NS.fieldsHtml([
        { name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'company', label: 'Firma / İşletme adı', required: true },
        { name: 'taxType', label: 'Fatura tipi', type: 'select', options: [{ value: 'kurumsal', label: 'Kurumsal (Vergi no)' }, { value: 'bireysel', label: 'Bireysel (TCKN)' }] }, { name: 'taxNo', label: 'Vergi no / TCKN', required: true }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'city', label: 'İl', type: 'select', options: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep', 'Kocaeli', 'Diğer'] }, { name: 'address', label: 'Fatura adresi', full: true, required: true },
        ...(u ? [] : [{ type: 'section', label: 'Hesap şifreniz (lisanslarınızı yönetmek için)' }, { name: 'pass', label: 'Şifre', type: 'password', required: true, hint: 'En az 6 karakter' }]),
      ], u || {})}</div>
      <div class="card pad"><h3 class="mb">Ödeme yöntemi</h3>
        
        <label class="opt card pad row nw" style="cursor:pointer"><input type="radio" name="pay" value="havale" checked> <div class="grow"><b>${icon('building')} Havale / EFT</b><div class="small muted">${esc(S().bank)} · ${esc(S().iban)} — ödemeniz onaylanınca lisansınız aktifleşir.</div></div></label>
        <label class="check small mt"><input type="checkbox" id="agree"> <span><a href="/mesafeli-satis/" target="_blank">Mesafeli satış sözleşmesini</a> ve <a href="/kvkk/" target="_blank">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label></div></div>
      <div><div class="card pad" style="position:sticky;top:86px"><h3 class="mb">Sipariş özeti</h3>${t.lines.map((l) => `<div class="list-item small"><span class="grow"><b>${esc(l.p.name)}</b><div class="faint">${planName(l.plan)} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'}${l.qty > 1 ? ` · ${l.qty} şube` : ''}</div></span><b>${money(l.line)}</b></div>`).join('')}
        ${t.discount ? `<div class="list-item small" style="color:var(--ok)"><span class="grow">İndirim</span><b>-${money(t.discount)}</b></div>` : ''}<div class="list-item small"><span class="grow muted">KDV</span><b>${money(t.vat)}</b></div><div class="list-item"><span class="grow"><b>Ödenecek</b></span><b style="font-size:22px">${money(t.total)}</b></div>
        <button class="btn primary lg block mt" id="pay">${icon('lock')} Siparişi tamamla</button><p class="small faint center mt">Demo modu: gerçek ödeme alınmaz.</p></div></div>
    </div></div></section>`;
    $('#pay', el).onclick = async () => {
      const f = $('#bf', el);
      if (!NS.validate(f)) return;
      if (!$('#agree', el).checked) return toast('Sözleşmeyi onaylayın', 'err');
      const v = NS.readForm(f);
      let c = me();
      if (!c) {
        if ((v.pass || '').length < 6) return toast('Şifre en az 6 karakter olmalı', 'err');
        const ex = db.find('customers', (x) => x.email.toLowerCase() === v.email.toLowerCase());
        if (ex && ex.pass) return toast('Bu e-posta ile kayıtlı hesap var, önce giriş yapın', 'err');
        const pass = await hash(v.pass); delete v.pass;
        c = ex ? Object.assign(ex, v, { pass }) : db.insert('customers', { ...v, pass }, true);
        ss.set(SKEY, c.id, true);
      } else Object.assign(c, v);
      const pay = $('[name=pay]:checked', el).value;
      const o = db.insert('orders', { no: db.nextNo('orders', 'NS'), at: new Date().toISOString(), customer: c.id, items: t.lines.map((l) => ({ pid: l.pid, plan: l.plan, period: l.period, qty: l.qty || 1, price: l.line })), subtotal: t.subtotal, discount: t.discount, vat: t.vat, total: t.total, coupon: t.coupon ? t.coupon.code : null, status: pay === 'kart' ? 'odendi' : 'bekliyor', pay, billing: v }, true);
      if (t.coupon) t.coupon.uses = (t.coupon.uses || 0) + 1;
      if (o.status === 'odendi') activate(o);
      db.data.cart = { items: [], coupon: null };
      db.save(); drawNav();
      location.hash = '#/basarili/' + o.id;
    };
  }
  function activate(o) {
    o.items.forEach((it) => {
      const pids = it.pid === 'bundle' ? C.products.filter((p) => p.ready).map((p) => p.id) : [it.pid];
      pids.forEach((pid) => db.col('licenses').push(mkLicense(o, { ...it, pid }, o.customer)));
    });
  }
  function successPage(el, id) {
    const o = db.get('orders', id);
    if (!o) { location.hash = '#/'; return; }
    const lic = db.all('licenses', (l) => l.order === o.id);
    el.innerHTML = `<section class="sec"><div class="mk-wrap" style="max-width:760px"><div class="card pad center"><div class="kpi" style="justify-content:center"><div class="ic ok" style="width:70px;height:70px">${icon('check', 'ico-lg')}</div></div>
      <h1 class="mt">${o.status === 'odendi' ? 'Siparişiniz tamamlandı!' : 'Siparişiniz alındı'}</h1><p class="muted mt">Sipariş no: <b>${esc(o.no)}</b> · ${money(o.total)}</p>
      ${o.status === 'odendi' ? `<p class="mt">Lisanslarınız aktif.</p>` : `<div class="card pad mt" style="background:var(--warn-soft);border:0;text-align:left"><b>Havale bilgileri</b><div class="small mt">${esc(S().bank)} · IBAN: <span class="mono">${esc(S().iban)}</span><br>Açıklama: <b>${esc(o.no)}</b><br>Ödemeniz onaylandığında lisansınız otomatik aktifleşir.</div></div>`}</div>
      ${lic.length ? `<h2 class="mt mb">Lisanslarınız</h2>${lic.map((l) => { const p = prod(l.pid); return `<div class="card pad row mb"><span class="avatar lg" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div class="grow"><b>${esc(p.name)}</b> ${badge(planName(l.plan), 'acc')}<div class="lic mt">${esc(l.key)}</div></div><a class="btn primary" href="apps/${l.pid}/index.html" target="_blank">${icon('play')} Uygulamayı aç</a></div>`; }).join('')}` : ''}
      <div class="row mt" style="justify-content:center"><a class="btn" href="#/hesabim">${icon('user')} Hesabıma git</a><button class="btn" id="inv">${icon('print')} Faturayı yazdır</button></div></div></section>`;
    $('#inv', el).onclick = () => printInvoice(o);
  }
  function printInvoice(o) {
    const c = custOf(o.customer), b = o.billing || c, s = S();
    NS.printHtml(`<div class="doc"><table><tr><td><h2>${esc(s.siteName)} Yazılım A.Ş.</h2><div>${esc(s.address)}</div><div>${esc(s.phone)} · ${esc(s.email)}</div></td><td style="text-align:right"><h2>FATURA</h2><div>No: ${esc(o.no)}</div><div>Tarih: ${NS.date(o.at)}</div></td></tr></table><hr>
      <b>Sayın</b><div>${esc(b.company || '')}</div><div>${esc(b.name || c.name)}</div><div>${esc(b.address || '')}</div><div>VKN/TCKN: ${esc(b.taxNo || '-')} ${b.taxOffice ? '· ' + esc(b.taxOffice) : ''}</div><br>
      <table><tr><th>Ürün</th><th>Paket</th><th>Dönem</th><th style="text-align:right">Tutar</th></tr>${o.items.map((i) => `<tr><td>${esc(item(i.pid).name)}${i.qty > 1 ? ` (${i.qty} şube)` : ''}</td><td>${planName(i.plan)}</td><td>${i.period === 'yillik' ? 'Yıllık' : 'Aylık'}</td><td style="text-align:right">${money(i.price)}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right">Ara toplam</td><td style="text-align:right">${money(o.subtotal)}</td></tr>${o.discount ? `<tr><td colspan="3" style="text-align:right">İndirim</td><td style="text-align:right">-${money(o.discount)}</td></tr>` : ''}<tr><td colspan="3" style="text-align:right">KDV %${VAT}</td><td style="text-align:right">${money(o.vat)}</td></tr><tr><td colspan="3" style="text-align:right"><b>GENEL TOPLAM</b></td><td style="text-align:right"><b>${money(o.total)}</b></td></tr></table>
      <p style="font-size:11px;color:#666;margin-top:30px">Bu belge bilgilendirme amaçlıdır. Yasal e-Arşiv faturanız e-posta adresinize ayrıca gönderilir.</p></div>`, { title: o.no });
  }

  // ---------- Müşteri hesabı ----------
  function accountPage(el, tab) {
    el = fresh(el);
    const u = me();
    if (!u) return loginPage(el);
    tab = tab || 'lisanslar';
    const lic = db.all('licenses', (l) => l.customer === u.id).sort((a, b) => b.start.localeCompare(a.start));
    const orders = db.all('orders', (o) => o.customer === u.id).sort((a, b) => b.at.localeCompare(a.at));
    const tickets = db.all('tickets', (t) => t.customer === u.id);
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap">
      <div class="page-h"><div class="avatar lg">${esc(NS.initials(u.name))}</div><div class="grow"><h1>${esc(u.name)}</h1><p>${esc(u.company || '')} · ${esc(u.email)}</p></div><button class="btn" id="lo">${icon('logout')} Çıkış</button></div>
      <div class="grid g4 mb">${kpi('Aktif lisans', lic.filter((l) => l.status === 'aktif').length, 'key', 'ok')}${kpi('Sipariş', orders.length, 'receipt', 'info')}${kpi('Toplam ödeme', money(sum(orders.filter((o) => o.status === 'odendi'), (o) => o.total)), 'wallet')}${kpi('Açık destek', tickets.filter((t) => t.status !== 'kapali').length, 'message', 'warn')}</div>
      <div class="tabs">${[['lisanslar', 'Lisanslarım'], ['siparisler', 'Siparişlerim'], ['destek', 'Destek'], ['profil', 'Profil']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tb"></div></div></section>`;
    const tb = $('#tb', el);
    if (tab === 'lisanslar') tb.innerHTML = lic.length ? `<div class="grid g2">${lic.map((l) => { const p = prod(l.pid); const left = NS.daysBetween(new Date(), l.end); return `<div class="card pad"><div class="row nw mb"><span class="avatar lg" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div class="grow"><b>${esc(p.name)}</b><div class="small muted">${planName(l.plan)} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'} · ${l.branches} şube</div></div>${l.status === 'aktif' ? (left < 7 ? badge(left + ' gün kaldı', 'warn') : badge('Aktif', 'ok')) : badge(l.status === 'askida' ? 'Askıda' : 'Sona erdi', 'err')}</div>
        <div class="row nw"><span class="lic grow">${esc(l.key)}</span><button class="btn sm icon" data-copy="${esc(l.key)}">${icon('copy')}</button></div>
        <div class="small muted mt">${NS.date(l.start)} – ${NS.date(l.end)} · Otomatik yenileme: ${l.autoRenew ? 'açık' : 'kapalı'}</div>
        <div class="progress mt"><i style="width:${NS.clamp(100 - (left / (l.period === 'yillik' ? 365 : 30)) * 100, 0, 100)}%"></i></div>
        <div class="row mt"><a class="btn primary sm" href="apps/${l.pid}/index.html" target="_blank">${icon('play')} Uygulamayı aç</a><button class="btn sm" data-renew="${l.id}">${icon('refresh')} Uzat</button><button class="btn sm ghost" data-ar="${l.id}">Otomatik yenileme ${l.autoRenew ? 'kapat' : 'aç'}</button></div></div>`; }).join('')}</div>` : `<div class="card pad empty">${icon('key')}<div>Henüz lisansınız yok</div><a class="btn primary mt" href="#/urunler">Ürünleri incele</a></div>`;
    else if (tab === 'siparisler') tb.innerHTML = `<div class="card">${table({ rows: orders, empty: 'Sipariş yok', columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b>` }, { label: 'Tarih', render: (o) => NS.dt(o.at) }, { label: 'Ürünler', render: (o) => o.items.map((i) => esc(prod(i.pid).name)).join(', ') }, { label: 'Ödeme', render: (o) => (o.pay === 'kart' ? 'Kart' : 'Havale') }, { label: 'Durum', render: (o) => badge(o.status === 'odendi' ? 'Ödendi' : o.status === 'iptal' ? 'İptal' : 'Ödeme bekleniyor', o.status === 'odendi' ? 'ok' : o.status === 'iptal' ? 'err' : 'warn') }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>` }], actions: [{ icon: 'print', act: 'inv', title: 'Fatura' }] })}</div>`;
    else if (tab === 'destek') tb.innerHTML = `<div class="row mb"><span class="grow muted">Talepleriniz destek ekibine iletilir ve buradan yanıtlanır.</span><button class="btn primary" id="nt">${icon('plus')} Yeni destek talebi</button></div>${tickets.map((t) => ticketCard(t, 'musteri')).join('') || '<div class="card pad empty">Destek talebiniz yok</div>'}`;
    else tb.innerHTML = `<div class="card pad" style="max-width:640px" id="pf">${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'company', label: 'Firma' }, { name: 'taxNo', label: 'Vergi no' }, { name: 'address', label: 'Adres', full: true }], u)}<div class="row mt"><button class="btn primary" id="sp">Kaydet</button><button class="btn" id="cpw">Şifre değiştir</button></div></div>`;
    on(el, 'click', '[data-tab]', (e, t) => accountPage(el, t.dataset.tab));
    $('#lo', el).onclick = () => { ss.del(SKEY); drawNav(); location.hash = '#/'; };
    on(el, 'click', '[data-copy]', (e, t) => { navigator.clipboard && navigator.clipboard.writeText(t.dataset.copy); toast('Lisans anahtarı kopyalandı', 'ok'); });
    on(el, 'click', '[data-ar]', (e, t) => { const l = db.get('licenses', t.dataset.ar); l.autoRenew = !l.autoRenew; db.save(); accountPage(el, tab); });
    on(el, 'click', '[data-renew]', (e, t) => { const l = db.get('licenses', t.dataset.renew); addCart(l.pid, l.plan, l.period); location.hash = '#/sepet'; });
    on(el, 'click', '[data-act=inv]', (e, t) => printInvoice(db.get('orders', t.dataset.id)));
    if ($('#sp', el)) $('#sp', el).onclick = () => { Object.assign(u, NS.readForm($('#pf', el))); db.save(); toast('Profil güncellendi', 'ok'); drawNav(); };
    if ($('#cpw', el)) $('#cpw', el).onclick = async () => { const v = await formModal({ title: 'Şifre değiştir', fields: [{ name: 'p', label: 'Yeni şifre', type: 'password', required: true }] }); if (v && v.p.length >= 6) { u.pass = await hash(v.p); db.save(); toast('Şifre değişti', 'ok'); } else if (v) toast('En az 6 karakter', 'err'); };
    if ($('#nt', el)) $('#nt', el).onclick = async () => {
      const v = await formModal({ title: 'Destek talebi', fields: [{ name: 'product', label: 'Ürün', type: 'select', options: [...new Set(lic.map((l) => l.pid))].map((id) => ({ value: id, label: prod(id).name })).concat([{ value: '', label: 'Genel / Fatura' }]) }, { name: 'subject', label: 'Konu', required: true, full: true }, { name: 'text', label: 'Mesajınız', type: 'textarea', required: true, full: true }] });
      if (v) { db.insert('tickets', { customer: u.id, product: v.product, subject: v.subject, status: 'acik', messages: [{ from: 'musteri', text: v.text, at: new Date().toISOString() }] }); toast('Talebiniz alındı', 'ok'); accountPage(el, 'destek'); }
    };
    bindTickets(el, 'musteri', () => accountPage(el, 'destek'));
  }
  const ticketCard = (t, who) => `<div class="card mb"><div class="card-h"><h3>${esc(t.subject)}</h3>${t.product ? badge(prod(t.product).name, 'acc') : ''}${badge(t.status === 'kapali' ? 'Kapandı' : t.status === 'yanitlandi' ? 'Yanıtlandı' : 'Açık', t.status === 'kapali' ? '' : t.status === 'yanitlandi' ? 'ok' : 'warn')}${who === 'admin' ? `<span class="small faint">${esc(custOf(t.customer).name)}</span>` : ''}</div><div class="card-b">${t.messages.map((m) => `<div class="card pad mb" style="${m.from === 'destek' ? 'background:var(--brand-soft);border:0;margin-left:40px' : 'margin-right:40px'}"><div class="small faint mb">${m.from === 'destek' ? `${icon('shield')} ${esc(S().siteName)} Destek` : icon('user') + ' ' + esc(custOf(t.customer).name)} · ${NS.dt(m.at)}</div>${esc(m.text)}</div>`).join('')}
    ${t.status !== 'kapali' ? `<div class="row nw"><input class="input" placeholder="Yanıt yazın..." data-rt="${t.id}"><button class="btn primary" data-rs="${t.id}">${icon('send')}</button>${who === 'admin' ? `<button class="btn" data-tc="${t.id}">Kapat</button>` : ''}</div>` : ''}</div></div>`;
  function bindTickets(el, who, redraw) {
    on(el, 'click', '[data-rs]', (e, b) => { const inp = $(`[data-rt="${b.dataset.rs}"]`, el); if (!inp.value.trim()) return; const t = db.get('tickets', b.dataset.rs); t.messages.push({ from: who === 'admin' ? 'destek' : 'musteri', text: inp.value.trim(), at: new Date().toISOString() }); t.status = who === 'admin' ? 'yanitlandi' : 'acik'; db.save(); redraw(); });
    on(el, 'click', '[data-tc]', (e, b) => { db.update('tickets', b.dataset.tc, { status: 'kapali' }); redraw(); });
  }
  function loginPage(el) { authView(el, 'giris'); }

  // ---------- Kimlik ekranları: tam ekran sahne (ışık hüzmeleri, spotlight), cam kart, iki adımlı kayıt ----------
  const spark = (pts) => `<svg class="sp" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pts.map((v, i) => `${(i * 100) / (pts.length - 1)},${30 - v}`).join(' ')}"/></svg>`;
  const ROT = ['Adisyonunuz', 'Kasanız', 'Servisiniz', 'Randevularınız', 'Oteliniz', 'Kliniğiniz', 'Mağazanız'];
  function authStory(kind) {
    const n = products().filter((p) => p.ready).length; const rot = `<span class="ax-rot" data-ax-rotate='${JSON.stringify(ROT)}'>${ROT[0]}</span>`;
    const h = kind === 'kayit' ? `Ücretsiz hesap açın,<br>${rot} dakikalar içinde hazır.` : kind === 'sifre' ? 'Endişelenmeyin,<br>hesabınız güvende.' : `${rot}<br>tek girişte.`;
    return `<section class="ax-story"><span class="ax-chip"><b>v3</b> ${n} sektörel program · web, masaüstü ve mobil</span><h1>${h}</h1>
      <p>${kind === 'kayit' ? `Hesabınız süresiz ve ücretsizdir. Seçtiğiniz programın ${TRIAL()} günlük denemesi hemen başlar; kredi kartı istemiyoruz.` : 'Giriş yapın; tek programınız varsa doğrudan açılır, birden fazlaysa seçmeniz yeter.'}</p>
      <div class="ax-stack" data-ax-tilt>
        <div class="ax-tile t1"><div class="row1"><span class="i" style="--c:#34d399">${icon('trend')}</span><div><small>Bugünkü ciro</small><div class="num">₺48.320</div></div><span class="badge ok" style="margin-left:auto">+%12</span></div>${spark([6, 9, 7, 13, 12, 17, 15, 21, 19, 26])}</div>
        <div class="ax-tile t2"><span class="i" style="--c:#f87171">${icon('bell')}</span><div><b>Masa 7 garson çağırıyor</b><small>Adisyon · şimdi</small></div></div>
        <div class="ax-tile t3"><span class="i" style="--c:#a5b4fc">${icon('edit')}</span><div><b>Müşteri teslim formunu imzaladı</b><small>Oto Servis · 34 ABC 123</small></div></div></div>
      </section>`;
  }
  function authShell(el, kind, card) {
    document.body.classList.add('mk-auth');
    el.innerHTML = `<div class="ax">${NS.auth.scene('site')}<header class="ax-top"><a class="ax-brand" href="#/">${NS.logoMark(LOGO_L(), 34)}${brandName()}</a><span class="grow"></span><a class="ax-link mk-hide-m" href="#/urunler">Programlar</a><a class="ax-link mk-hide-m" href="#/iletisim">${icon('phone')} Destek</a><a class="ax-link" href="#/">${icon('back')} Siteye dön</a></header>
      <main class="ax-main">${authStory(kind)}<section><div class="ax-card">${card}</div></section></main></div>`;
    NS.auth.bind(el);
  }
  const axTabs = (reg) => `<div class="ax-tabs${reg ? ' reg' : ''}"><i></i><a href="#/giris" class="${reg ? '' : 'on'}">Giriş yap</a><a href="#/kayit" class="${reg ? 'on' : ''}">Ücretsiz hesap</a></div>`;
  const okEmail = (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(x || '').trim());
  // E-postaya gönderilen 6 haneli kodun girildiği adım (kayıt, giriş, şifre sıfırlama)
  function codeStep(el, { title, to, sub, extra = '', btn = 'Doğrula', onSubmit, onResend }) {
    const A = NS.auth; const card = $('.ax-card', el);
    card.innerHTML = `${A.halo(`<span style="position:relative;color:#c7d2fe">${icon('mail', 'ico-lg')}</span>`)}<h2>${esc(title)}</h2><p class="ax-sub">${esc(sub || 'E-postanıza 6 haneli bir kod gönderdik. Kod 10 dakika geçerlidir.')}</p>
      <form class="ax-form" id="cf" novalidate><div class="ax-mail">${icon('mail')} <span><b>${esc(to || '')}</b> adresine gönderildi</span></div><div class="ax-err" hidden></div>${A.otp()}${extra}${A.button('cgo', btn, 'check')}
        <div class="ax-row"><span>Kod gelmedi mi? Spam klasörünü kontrol edin.</span><a href="#" id="crs">Yeniden gönder</a></div></form>`;
    const val = A.bindOtp(card, () => { if (!extra) $('#cf', el).requestSubmit(); });
    $('#cf', el).onsubmit = async (e) => { e.preventDefault(); const code = val(); if (code.length !== 6) return A.err(el, '6 haneli kodu girin'); const b = $('#cgo', el); A.busy(b, true); try { await onSubmit(code, NS.readForm($('#cf', el))); await A.done(b); } catch (x) { A.busy(b, false); A.err(el, x.message); } };
    let wait = 0; const rs = $('#crs', el);
    rs.onclick = async (e) => { e.preventDefault(); if (wait) return; try { await onResend(); toast('Yeni kod gönderildi', 'ok'); wait = 30; const t = setInterval(() => { wait--; rs.textContent = wait ? `Yeniden gönder (${wait})` : 'Yeniden gönder'; if (!wait) clearInterval(t); }, 1000); } catch (x) { A.err(el, x.message); } };
  }
  function authView(el, kind, pid) {
    el = fresh(el);
    const A = NS.auth;
    if (kind === 'kayit' && CL) return registerView(el, pid);
    if (kind === 'sifre') {
      const tel = S().phone || '';
      authShell(el, 'sifre', `${A.halo(NS.logoMark(LOGO_L(), 44))}<h2>Şifremi unuttum</h2><p class="ax-sub">Hesabınızın e-posta adresini yazın. Destek ekibimiz kayıtlı telefonunuzdan sizi arayıp kimliğinizi doğruladıktan sonra geçici şifrenizi iletir.</p>
        <form class="ax-form" id="af" novalidate><div class="ax-err" hidden></div>${A.field('email', 'E-posta adresiniz', { type: 'email', ac: 'username' })}${A.field('phone', 'Size ulaşabileceğimiz telefon (isteğe bağlı)', { type: 'tel', ac: 'tel', req: false })}
          <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">${A.button('go', 'Sıfırlama talebi gönder', 'send')}
          <div class="ax-row"><a href="#/giris">${icon('back')} Girişe dön</a><span>Acil mi? <a href="tel:${esc(tel.replace(/[^\d+]/g, ''))}">${esc(tel)}</a></span></div></form>`);
      $('#af', el).onsubmit = async (e) => {
        e.preventDefault(); const v = NS.readForm($('#af', el)); const b = $('#go', el);
        if (!okEmail(v.email)) return A.err(el, 'Geçerli bir e-posta adresi yazın');
        A.busy(b, true);
        if (CL) {
          let r; try { r = await NS.api('POST', '/api/auth/forgot', v); } catch (x) { A.busy(b, false); return A.err(el, x.message); }
          if (r.mailed) { A.busy(b, false); let ticket = r.ticket; return codeStep(el, { title: 'Yeni şifrenizi belirleyin', to: r.to, sub: 'E-postanıza gelen 6 haneli kodu ve yeni şifrenizi girin.', btn: 'Şifremi yenile ve giriş yap', extra: A.field('pass', 'Yeni şifre', { type: 'password', ac: 'new-password', hint: 'En az 8 karakter; harf ve rakam içersin' }), onSubmit: async (code, f) => { const rs = await NS.api('POST', '/api/auth/reset', { ticket, code, pass: f.pass }); if (rs.girisGerekli) { toast('Şifreniz yenilendi. Uygulama kodunuzla giriş yapın.', 'ok'); location.href = '/admin/'; return; } await refreshMe(); drawNav(); toast('Şifreniz yenilendi', 'ok'); setTimeout(afterLogin, 500); }, onResend: async () => { ticket = (await NS.api('POST', '/api/auth/forgot', v)).ticket; } }); }
        }
        await A.done(b);
        $('.ax-card', el).innerHTML = `${A.halo(`<span style="position:relative;color:#34d399">${icon('check', 'ico-lg')}</span>`)}<h2>Talebiniz alındı</h2><p class="ax-sub">Bu e-posta ile kayıtlı bir hesap varsa destek ekibimiz mesai saatlerinde sizi arayacak. Beklemek istemezseniz <b style="color:#fff">${esc(tel)}</b> numarasından bize ulaşabilirsiniz.</p><a class="ax-a" href="#/giris">${icon('back')} Girişe dön</a>`;
      };
      return;
    }
    authShell(el, 'giris', `${A.halo(NS.logoMark(LOGO_L(), 44))}${axTabs(false)}<h2>Tekrar hoş geldiniz</h2><p class="ax-sub">Programlarınıza kaldığınız yerden devam edin.</p>
      <form class="ax-form" id="af" novalidate><div class="ax-err" hidden></div>${A.field('email', 'E-posta adresiniz', { type: 'email', ac: 'username', extra: 'autofocus' })}${A.field('pass', 'Şifreniz', { type: 'password', ac: 'current-password' })}
        <div class="ax-row"><label class="ax-check"><input type="checkbox" name="remember" checked> Beni hatırla</label><a href="#/sifre">Şifremi unuttum</a></div>
        ${A.button('go', 'Giriş yap')}<div class="ax-or">ya da</div>
        <div class="ax-alt"><a href="apps/pos/index.html?demo=1" target="_blank" rel="noopener">${icon('play')} Demoyu dene</a>${/NEBSOFT-(Android|Desktop)/.test(navigator.userAgent) ? '' : `<a href="#/indir">${icon('download')} Masaüstü uygulaması</a>`}</div></form>
      <p class="ax-legal mt">Hesabınız yok mu? <a class="ax-a" href="#/kayit">Ücretsiz hesap oluşturun</a></p>`);
    $('#af', el).onsubmit = async (e) => {
      e.preventDefault(); const v = NS.readForm($('#af', el)); const b = $('#go', el);
      if (!okEmail(v.email)) return A.err(el, 'Geçerli bir e-posta adresi yazın');
      if (!v.pass) return A.err(el, 'Şifrenizi yazın');
      A.busy(b, true);
      try {
        if (CL) {
          const r = await NS.api('POST', '/api/auth/login', v);
          if (r.needTotp) { location.href = '/admin/'; return; } // uygulama kodu yönetim panelinde girilir
          if (r.needCode) { A.busy(b, false); let ticket = r.ticket; return codeStep(el, { title: 'Giriş kodunu girin', to: r.to, btn: 'Giriş yap', onSubmit: async (code) => { await NS.api('POST', '/api/auth/login', { ...v, ticket, code }); await refreshMe(); drawNav(); setTimeout(() => { if (pid) startTrial(pid); else afterLogin(); }, 500); }, onResend: async () => { ticket = (await NS.api('POST', '/api/auth/login', v)).ticket; } }); }
          await refreshMe();
        }
        else { const c = db.find('customers', (x) => x.email.toLowerCase() === v.email.toLowerCase()); if (!c || !c.pass || c.pass !== (await hash(v.pass))) throw new Error('E-posta veya şifre hatalı'); ss.set(SKEY, c.id, v.remember); }
        await A.done(b); drawNav(); if (pid) startTrial(pid); else afterLogin();
      } catch (x) { A.busy(b, false); A.err(el, x.message); }
    };
  }
  // Kayıt: 1) işletme ve program 2) hesap bilgileri
  function registerView(el, pid) {
    const A = NS.auth; const ps = products().filter((x) => x.ready);
    const secs = [...new Set(ps.flatMap((x) => x.sectors || []))].sort((a, b) => a.localeCompare(b, 'tr'));
    const st = { step: 1, v: { product: pid && prod(pid) ? pid : '' } };
    const draw = () => {
      const v = st.v;
      const card = st.step === 1
        ? `${axTabs(true)}<div class="ax-steps"><i class="on"></i><i></i></div><h2>İşletmenizi tanıyalım</h2><p class="ax-sub">Hesabınız süresiz ve ücretsizdir. Seçtiğiniz programın ${TRIAL()} günlük denemesi hemen başlar; kredi kartı istemiyoruz.</p>
          <form class="ax-form" id="af" novalidate><div class="ax-err" hidden></div>${A.field('company', 'İşletme adı', { value: v.company || '', ac: 'organization', extra: 'autofocus' })}${A.select('sector', 'Sektör', ['', ...secs].map((x) => ({ value: x, label: x || 'Seçin (isteğe bağlı)' })), v.sector || '')}
            <div><div class="ax-row" style="margin-bottom:8px"><span>Hangi programı denemek istersiniz? (deneme talebi)</span></div><div class="ax-pick">${ps.map((p) => `<button type="button" data-pp="${p.id}" class="${v.product === p.id ? 'on' : ''}" style="--pc:${p.accent}">${icon(p.icon)} ${esc(p.name)}</button>`).join('')}</div></div>
            ${A.button('go', 'Devam et')}</form>`
        : `${axTabs(true)}<div class="ax-steps"><i class="on"></i><i class="on"></i></div><h2>Hesap bilgileriniz</h2><p class="ax-sub"><b style="color:#fff">${esc(v.company)}</b> · ${esc((prod(v.product) || {}).name || '')} — son adım.</p>
          <form class="ax-form" id="af" novalidate><div class="ax-err" hidden></div><div class="ax-grid2">${A.field('name', 'Ad soyad', { value: v.name || '', ac: 'name', extra: 'autofocus' })}${A.field('phone', 'Cep telefonu', { type: 'tel', value: v.phone || '', ac: 'tel' })}</div>
            ${A.field('email', 'E-posta adresiniz', { type: 'email', value: v.email || '', ac: 'email' })}${A.field('pass', 'Şifre belirleyin', { type: 'password', ac: 'new-password', hint: 'En az 8 karakter; harf ve rakam içersin' })}
            <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
            <label class="ax-check" style="font-size:13px;color:#a3a5c0"><input type="checkbox" id="kv"> <span><a class="ax-a" href="/kvkk/" target="_blank">KVKK aydınlatma metnini</a> ve <a class="ax-a" href="/mesafeli-satis/" target="_blank">kullanım koşullarını</a> okudum, kabul ediyorum.</span></label>
            <label class="ax-check" style="font-size:13px;color:#a3a5c0"><input type="checkbox" id="pz"> <span>Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı)</span></label>
            ${A.button('go', 'Hesabımı oluştur', 'rocket')}<div class="ax-row"><a href="#" data-back>${icon('back')} İşletme bilgileri</a><a href="#/giris">Zaten hesabım var</a></div></form>`;
      authShell(el, 'kayit', `${A.halo(NS.logoMark(LOGO_L(), 44))}${card}`);
      $('#af', el).onsubmit = submit;
    };
    on(el, 'click', '[data-pp]', (e, b) => { st.v.product = b.dataset.pp; $$('[data-pp]', el).forEach((x) => x.classList.toggle('on', x === b)); });
    on(el, 'click', '[data-back]', (e) => { e.preventDefault(); Object.assign(st.v, NS.readForm($('#af', el))); st.step = 1; draw(); });
    async function submit(e) {
      e.preventDefault(); Object.assign(st.v, NS.readForm($('#af', el))); const v = st.v; const b = $('#go', el);
      if (st.step === 1) {
        if (String(v.company || '').trim().length < 2) return A.err(el, 'İşletme adını yazın');
        if (!v.product) return A.err(el, 'Denemek istediğiniz programı seçin');
        st.step = 2; return draw();
      }
      if (String(v.name || '').trim().length < 3) return A.err(el, 'Adınızı ve soyadınızı yazın');
      if (String(v.phone || '').replace(/\D/g, '').length < 10) return A.err(el, 'Geçerli bir cep telefonu yazın');
      if (!okEmail(v.email)) return A.err(el, 'Geçerli bir e-posta adresi yazın');
      if (!/^(?=.*[A-Za-zÇĞİÖŞÜçğıöşü])(?=.*\d).{8,}$/.test(v.pass || '')) return A.err(el, 'Şifre en az 8 karakter olmalı, harf ve rakam içermeli');
      if (!$('#kv', el).checked) return A.err(el, 'Devam etmek için KVKK metnini onaylayın');
      v.pazarlama = !!$('#pz', el).checked;
      A.busy(b, true);
      let ref = null; try { ref = sessionStorage.getItem('nebsoft:ref'); } catch (x) { /* yok */ }
      try {
        const r = await NS.api('POST', '/api/auth/register', { ...v, kvkk: true, ref });
        if (r.needCode) { A.busy(b, false); let ticket = r.ticket; return codeStep(el, { title: 'E-postanızı doğrulayın', to: r.to, btn: 'Hesabımı oluştur', onSubmit: async (code) => { await NS.api('POST', '/api/auth/register', { ...v, kvkk: true, ref, ticket, code }); await refreshMe(); drawNav(); toast(`Hesabınız oluşturuldu. ${TRIAL()} günlük denemeniz başladı.`, 'ok'); setTimeout(() => { location.hash = '#/programlarim'; }, 500); }, onResend: async () => { ticket = (await NS.api('POST', '/api/auth/register', { ...v, kvkk: true, ref })).ticket; } }); }
        await refreshMe(); await A.done(b); drawNav(); toast(`Hesabınız oluşturuldu. ${TRIAL()} günlük denemeniz başladı.`, 'ok'); location.hash = '#/programlarim';
      }
      catch (x) { A.busy(b, false); A.err(el, x.message); }
    }
    draw();
  }

  // ---------- Masaüstü & Mobil ----------
  const DL = { win: 'indir/NEBSOFT-Kurulum.exe', mac: 'indir/NEBSOFT-Kurulum.dmg', apk: 'indir/NEBSOFT.apk' };
  function downloadPage(el) {
    el = fresh(el);
    const os = /Android/i.test(navigator.userAgent) ? 'android' : /iPhone|iPad/i.test(navigator.userAgent) ? 'ios' : /Windows/i.test(navigator.userAgent) ? 'win' : /Mac OS X/i.test(navigator.userAgent) ? 'mac' : 'win';
    const card = (k, ic, t, sub, btn) => `<div class="dl-card${os === k ? ' on' : ''}"><div class="dl-ic">${icon(ic, 'ico-lg')}</div><h3>${t}</h3><p class="muted">${sub}</p>${btn}${os === k ? '<span class="badge acc dl-you">Cihazınız</span>' : ''}</div>`;
    el.innerHTML = `<section class="sec dl"><div class="mk-wrap">
      <div class="sec-h center"><span class="eyebrow">Masaüstü & Mobil</span><h2>Programlarınız her cihazda, tek hesapla</h2><p class="muted">Aynı e-posta ve şifreyle giriş yapın; lisansınızdaki programlar listelenir, tek programınız varsa doğrudan açılır.</p></div>
      <div class="dl-grid">
        ${card('win', 'store', 'Windows', 'Windows 10 ve 11 · Kasa, mutfak ve ofis bilgisayarları için', `<a class="btn primary lg block" href="${DL.win}" data-dl="win">${icon('download')} Windows için indir</a>`)}
        ${card('mac', 'store', 'macOS', 'Apple Silicon ve Intel Mac', `<a class="btn lg block" href="${DL.mac}" data-dl="mac">${icon('download')} macOS için indir</a>`)}
        ${card('android', 'phone', 'Android', 'Telefon ve tablet · Android 8 ve üzeri', `<a class="btn primary lg block" href="${DL.apk}" data-dl="apk" download>${icon('download')} APK dosyasını indir</a><button class="btn block mt" data-install>${icon('phone')} veya Chrome ile uygulama olarak yükle</button><details class="dl-how"><summary>APK nasıl kurulur?</summary><ol><li>APK dosyasını indirin ve bildirimden açın.</li><li>“Bilinmeyen uygulamalar” uyarısında <b>Ayarlar</b>’a dokunup bu kaynağa (ör. Chrome) <b>izin verin</b>.</li><li><b>Yükle</b>’ye dokunun; NEBSOFT simgesi uygulama listenize gelir.</li><li>İlk açılışta NEBSOFT sunucu adresi sorulur ve bağlantı test edilir; ardından hesabınızla giriş yapın.</li></ol></details>`)}
        ${card('ios', 'phone', 'iPhone & iPad', 'Safari ile ana ekrana ekleyin — App Store gerekmez', `<button class="btn lg block" data-install>${icon('download')} Ana ekrana ekle</button><p class="small muted mt">Safari’de alttaki <b>Paylaş</b> simgesine, ardından <b>Ana Ekrana Ekle</b>’ye dokunun.</p>`)}
      </div>
      <div class="grid g3 mt">${[['print', 'Sessiz yazdırma', 'Fiş ve belgeler yazıcı penceresi açılmadan doğrudan basılır.'], ['bell', 'Arka planda bildirim', 'Pencere kapalıyken bile garson çağrısı ve yeni sipariş sesleri çalar.'], ['layers', 'Yazıcı, terazi, POS', 'Ağ yazıcısı, terazi ve seri port cihazlar ek kurulum olmadan çalışır.'], ['grid', 'Birden fazla pencere', 'Mutfak ekranını ikinci monitörde, kasayı ana ekranda açın.'], ['lock', 'Kasa (kiosk) modu', 'F10 ile tam ekran kasa modu; personel başka uygulamaya geçemez.'], ['refresh', 'Otomatik güncelleme', 'Yeni sürümler arka planda iner, bir sonraki açılışta hazırdır.']].map(([i, t, d]) => `<div class="card pad"><div class="kpi" style="padding:0"><div class="ic">${icon(i)}</div><div><b>${t}</b><div class="small muted">${d}</div></div></div></div>`).join('')}</div>
      <p class="small faint center mt">Kurulum dosyası ${esc(S().siteName)} tarafından imzalanır. Kurulumdan sonra programı açıp hesabınızla giriş yapmanız yeterli.</p></div></section>`;
    // Kurulum dosyası henüz sunucuya yüklenmediyse düğme "yakında" olur
    $$('[data-dl]', el).forEach((a) => fetch(a.getAttribute('href'), { method: 'HEAD' }).then((r) => { if (!r.ok) throw 0; }).catch(() => { a.classList.add('disabled'); a.removeAttribute('href'); a.innerHTML = `${icon('clock')} Çok yakında`; a.title = 'Kurulum dosyası hazırlanıyor'; }));
    if (window.nebsoftDesktop) $('.dl-grid', el).insertAdjacentHTML('beforebegin', `<div class="card pad mb center">${icon('check')} Şu an NEBSOFT masaüstü sürümünü kullanıyorsunuz.</div>`);
  }

  // Bulut veritabanı kurulmadan hesap açılamaz (hesaplar sunucuda tutulur): kayıt sayfası sessizce başka sayfaya atmak yerine durumu anlatır
  function noAccountSystem(el) {
    el = fresh(el); const A = NS.auth; const off = SRV_MODE === 'offline'; const file = !location.protocol.startsWith('http');
    const why = file ? 'Site dosyadan açıldı. Hesap sistemi için siteyi sunucuyla (<b>baslat.bat</b> veya <code>node server.js</code>) çalıştırın.'
      : off ? 'Sunucu ayarları kayıtlı ama veritabanına şu an bağlanılamıyor. MySQL sunucusunun çalıştığını ve bağlantı bilgilerini kontrol edin.'
        : 'Bu sunucuda hesap veritabanı (MySQL) henüz kurulmamış. Site sahibi kurulumu <b>/admin/</b> sayfasından birkaç dakikada tamamlar; ardından kayıt, giriş, e-posta doğrulama ve lisanslar çalışır.';
    authShell(el, 'kayit', `${A.halo(NS.logoMark(LOGO_L(), 44))}<h2>Hesap sistemi henüz hazır değil</h2><p class="ax-sub">${why}</p>
      <div class="col" style="gap:10px;margin-top:18px">${file ? '' : `<a class="btn primary lg block" href="admin/">${icon(off ? 'settings' : 'rocket')} ${off ? 'Sunucu ayarlarını aç' : 'Kurulumu tamamla (site sahibi)'}</a>`}<a class="btn lg block" href="#/urunler">${icon('grid')} Programları kayıt olmadan dene</a></div>
      <p class="ax-legal mt">Demo modunda programlar bu tarayıcıda çalışır; veriler yalnızca bu cihazda saklanır.</p>`);
  }

  // ---------- Şifremi unuttum ----------
  // Talep yönetim paneline düşer; destek ekibi kayıtlı telefondan arayıp geçici şifre iletir
  function forgotPage(el) { authView(el, 'sifre'); }

  // ---------- İletişim ----------
  function contactPage(el) {
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><div class="grid g2" style="align-items:start">
      <div><span class="eyebrow small" style="color:var(--brand);font-weight:700;letter-spacing:.08em">İLETİŞİM</span><h1 class="mt" style="font-size:38px">Size nasıl yardımcı olabiliriz?</h1><p class="muted mt" style="font-size:16px">Ücretsiz demo, kurumsal teklif veya özel yazılım ihtiyacınız için formu doldurun; uzmanımız aynı gün içinde sizi arasın.</p>
        <div class="col mt"><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic">${icon('phone')}</div></div><div><b>${esc(S().phone)}</b><div class="small muted">Destek talebi açarak da ulaşabilirsiniz</div></div></div><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic info">${icon('mail')}</div></div><div><b>${esc(S().email)}</b><div class="small muted">Ortalama yanıt: 15 dk</div></div></div><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic ok">${icon('map')}</div></div><div><b>Merkez ofis</b><div class="small muted">${esc(S().address)}</div></div></div></div></div>
      <div class="card pad" id="cf"><h2 class="mb">Bize yazın</h2>${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true, type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'biz', label: 'İşletme adı' }, { name: 'type', label: 'Konu', type: 'select', options: [{ value: 'demo', label: 'Ücretsiz demo / kurulum' }, { value: 'teklif', label: 'Kurumsal teklif' }, { value: 'ozel', label: 'Özel yazılım talebi' }, { value: 'bayi', label: 'Bayilik başvurusu' }, { value: 'iletisim', label: 'Diğer' }] }, { name: 'product', label: 'İlgilendiğiniz ürün', type: 'select', empty: 'Seçiniz', options: products().map((p) => ({ value: p.id, label: p.name })) }, { name: 'msg', label: 'Mesajınız', type: 'textarea', full: true }])}
        <label class="check small mt"><input type="checkbox" id="kv"> KVKK aydınlatma metnini okudum, iletişim izni veriyorum.</label><button class="btn primary lg block mt" id="send">${icon('send')} Gönder</button></div></div></div></section>`;
    $('#send', el).onclick = async () => {
      if (!NS.validate($('#cf', el))) return;
      if (!$('#kv', el).checked) return toast('KVKK onayı gerekli', 'err');
      if (CL) { try { await NS.api('POST', '/api/leads', NS.readForm($('#cf', el))); } catch (x) { return toast(x.message, 'err'); } } else db.insert('leads', { ...NS.readForm($('#cf', el)), status: 'yeni' });
      $('#cf', el).innerHTML = `<div class="center" style="padding:40px 0"><div class="kpi" style="justify-content:center"><div class="ic ok">${icon('check', 'ico-lg')}</div></div><h2 class="mt">Mesajınız alındı</h2><p class="muted mt">En kısa sürede sizinle iletişime geçeceğiz.</p></div>`;
    };
  }
  // Yasal metinler kendi adreslerinde (site/tools/build-sites.js üretir); eski #/yasal/... bağlantıları oraya gider
  function legalPage(el, which) { location.replace({ kvkk: '/kvkk/', sozlesme: '/mesafeli-satis/', iade: '/iade/', gizlilik: '/gizlilik/', cerez: '/cerez/' }[which] || '/kvkk/'); }

  // ---------- Yönetim paneli ----------
  function adminPage(el, sub) {
    if (!EMBED) { location.href = 'admin/' + (CL ? '' : '?demo=1#/satis' + (sub ? '/' + sub : '')); return; }
    el = fresh(el);
    if (!isAdmin()) {
      el.innerHTML = `<section class="sec"><div class="mk-wrap" style="max-width:420px"><div class="card pad center"><div class="kpi" style="justify-content:center"><div class="ic">${icon('lock', 'ico-lg')}</div></div><h1 class="mt">Yönetim paneli</h1><p class="muted mt mb">Demo PIN: <b>1234</b></p><input class="input lg center" id="pin" type="password" placeholder="PIN" maxlength="8"><button class="btn primary lg block mt" id="pb">Giriş</button></div></div></section>`;
      const go = () => { if ($('#pin', el).value === String(S().adminPin)) { try { sessionStorage.setItem(AKEY, '1'); } catch (e) { /* yok */ } adminPage(el, sub); } else toast('PIN hatalı', 'err'); };
      $('#pb', el).onclick = go; $('#pin', el).onkeydown = (e) => { if (e.key === 'Enter') go(); };
      return;
    }
    sub = sub || 'ozet';
    const nav = [['ozet', 'Özet', 'home'], ['siparisler', 'Siparişler', 'receipt'], ['lisanslar', 'Lisanslar', 'key'], ['musteriler', 'Müşteriler', 'users'], ['talepler', 'Talepler', 'phone'], ['destek', 'Destek', 'message'], ['urunler', 'Ürünler', 'box'], ['kuponlar', 'Kuponlar', 'ticket'], ['entegrasyon', 'Entegrasyonlar', 'zap'], ['ayarlar', 'Ayarlar', 'settings']];
    const cnt = { siparisler: db.all('orders', (o) => o.status === 'bekliyor').length, talepler: db.all('leads', (l) => l.status === 'yeni').length, destek: db.all('tickets', (t) => t.status === 'acik').length };
    el.innerHTML = `<section style="padding:24px 0 40px"><div class="mk-wrap" style="max-width:1320px"><div class="row mb"><h1 class="grow">${icon('shield')} Yönetim Paneli</h1></div>
      <div class="grid" style="grid-template-columns:220px minmax(0,1fr);align-items:start"><nav class="card ns-nav" style="padding:8px;position:sticky;top:86px">${nav.map(([k, l, i]) => `<a href="#/yonetim/${k}" class="${k === sub ? 'active' : ''}">${icon(i)}<span>${l}</span>${cnt[k] ? `<span class="badge warn" style="margin-left:auto">${cnt[k]}</span>` : ''}</a>`).join('')}</nav><div id="ab"></div></div></div></section>`;
    const ab = $('#ab', el);
    const redraw = () => adminPage(el, sub);
    const A = ADMIN[sub] || ADMIN.ozet;
    A(ab, redraw);
  }
  const monthly = (l) => { const p = prod(l.pid); const base = p ? p.prices[l.plan] : 0; return l.pid === 'bundle' ? 0 : base * (l.branches || 1); };
  const ADMIN = {
    entegrasyon(el) { NS.integ.page(el, null, ['payment', 'sms', 'email', 'whatsapp', 'efatura', 'webhook', 'backup']); },
    ozet(el) {
      const orders = db.all('orders', (o) => o.status === 'odendi');
      const d30 = addDays(new Date(), -30).toISOString();
      const rev30 = sum(orders.filter((o) => o.at > d30), (o) => o.total);
      const prev = sum(orders.filter((o) => o.at <= d30 && o.at > addDays(new Date(), -60).toISOString()), (o) => o.total);
      const active = db.all('licenses', (l) => l.status === 'aktif' && l.end > new Date().toISOString());
      const mrr = sum(active, monthly);
      const ser = NS.dailySeries(orders, 30, 'at', (o) => o.total);
      const byProd = {}; orders.forEach((o) => o.items.forEach((i) => { const n = item(i.pid).name; byProd[n] = (byProd[n] || 0) + i.price; }));
      const expiring = active.filter((l) => NS.daysBetween(new Date(), l.end) <= 7).sort((a, b) => a.end.localeCompare(b.end));
      el.innerHTML = `<div class="grid g4 mb">${kpi('Son 30 gün ciro', money(rev30), 'trend', 'ok', `<div class="small" style="color:${rev30 >= prev ? 'var(--ok)' : 'var(--err)'}">${rev30 >= prev ? '▲' : '▼'} %${prev ? Math.abs(((rev30 - prev) / prev) * 100).toFixed(0) : 0} önceki döneme göre</div>`)}${kpi('Aylık tekrarlayan gelir (MRR)', money(mrr), 'refresh', 'info')}${kpi('Aktif lisans', num(active.length), 'key')}${kpi('Müşteri', num(db.all('customers').length), 'users', 'warn')}</div>
        <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük satış (30 gün)</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: 3 })}</div></div><div class="card"><div class="card-h"><h3>Ürün bazlı gelir</h3></div><div class="card-b">${chart.donut(Object.entries(byProd).map(([label, value]) => ({ label, value })), { format: money, size: 140 })}</div></div></div>
        <div class="grid g2"><div class="card"><div class="card-h"><h3>Son siparişler</h3></div>${table({ rows: db.all('orders').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b>` }, { label: 'Müşteri', render: (o) => esc(custOf(o.customer).name) }, { label: 'Durum', render: (o) => badge(o.status === 'odendi' ? 'Ödendi' : o.status === 'iptal' ? 'İptal' : 'Bekliyor', o.status === 'odendi' ? 'ok' : o.status === 'iptal' ? 'err' : 'warn') }, { label: 'Tutar', cls: 'right', render: (o) => money(o.total) }] })}</div>
        <div class="card"><div class="card-h"><h3>7 gün içinde bitecek lisanslar</h3></div>${table({ rows: expiring, empty: 'Yakında bitecek lisans yok', columns: [{ label: 'Müşteri', render: (l) => esc(custOf(l.customer).name) }, { label: 'Ürün', render: (l) => esc(prod(l.pid).name) }, { label: 'Bitiş', render: (l) => NS.date(l.end) }, { label: 'Yenileme', render: (l) => (l.autoRenew ? badge('Otomatik', 'ok') : badge('Manuel', 'warn')) }] })}</div></div>`;
    },
    siparisler(el, redraw) {
      let f = 'all';
      const draw = () => {
        const rows = db.all('orders', (o) => f === 'all' || o.status === f).sort((a, b) => b.at.localeCompare(a.at));
        el.innerHTML = `<div class="card"><div class="card-h"><h3>Siparişler</h3><div class="seg">${[['all', 'Tümü'], ['bekliyor', 'Ödeme bekleyen'], ['odendi', 'Ödendi'], ['iptal', 'İptal']].map(([v, l]) => `<button data-f="${v}" class="${f === v ? 'active' : ''}">${l}</button>`).join('')}</div><button class="btn sm" id="ex">${icon('download')}</button></div>${table({ rows, columns: [{ label: 'No', render: (o) => `<b>${esc(o.no)}</b>` }, { label: 'Tarih', render: (o) => NS.dt(o.at) }, { label: 'Müşteri', render: (o) => `${esc(custOf(o.customer).name)}<div class="small faint">${esc(custOf(o.customer).company || '')}</div>` }, { label: 'Ürünler', render: (o) => o.items.map((i) => `${esc(prod(i.pid).name)} <span class="faint small">${planName(i.plan)}/${i.period === 'yillik' ? 'yıl' : 'ay'}</span>`).join('<br>') }, { label: 'Ödeme', render: (o) => (o.pay === 'kart' ? 'Kart' : 'Havale') }, { label: 'Durum', render: (o) => badge(o.status === 'odendi' ? 'Ödendi' : o.status === 'iptal' ? 'İptal' : 'Bekliyor', o.status === 'odendi' ? 'ok' : o.status === 'iptal' ? 'err' : 'warn') }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>` }], actions: [{ label: 'Ödendi işaretle', act: 'paid', show: (o) => o.status === 'bekliyor' }, { icon: 'print', act: 'inv' }, { icon: 'x', act: 'cancel', title: 'İptal / iade', show: (o) => o.status !== 'iptal' }], foot: `${rows.length} sipariş · ${money(sum(rows, (o) => o.total))}` })}</div>`;
        $('#ex', el).onclick = () => NS.csv('siparisler', rows, [{ key: 'no', label: 'No' }, { label: 'Tarih', value: (o) => NS.dt(o.at) }, { label: 'Müşteri', value: (o) => custOf(o.customer).name }, { key: 'status', label: 'Durum' }, { key: 'total', label: 'Tutar' }]);
      };
      on(el, 'click', '[data-f]', (e, t) => { f = t.dataset.f; draw(); });
      on(el, 'click', '[data-act]', async (e, t) => {
        const o = db.get('orders', t.dataset.id);
        if (t.dataset.act === 'paid') { o.status = 'odendi'; activate(o); db.save(); toast('Ödeme onaylandı, lisanslar aktifleşti', 'ok'); draw(); }
        else if (t.dataset.act === 'inv') printInvoice(o);
        else if (await confirm(`${o.no} iptal edilsin mi? İlgili lisanslar askıya alınır.`)) { o.status = 'iptal'; db.all('licenses', (l) => l.order === o.id).forEach((l) => { l.status = 'askida'; }); db.save(); draw(); }
      });
      draw();
    },
    lisanslar(el) {
      let q = '';
      el.innerHTML = `<div class="card"><div class="card-h"><h3>Lisanslar</h3>${NS.searchBox('q', 'Anahtar, müşteri, ürün...')}</div><div id="t"></div></div>`;
      const draw = () => { const rows = db.all('licenses', (l) => NS.match(q, l.key, custOf(l.customer).name, prod(l.pid).name)).sort((a, b) => b.start.localeCompare(a.start)); $('#t', el).innerHTML = table({ rows, columns: [{ label: 'Anahtar', render: (l) => `<span class="mono small">${esc(l.key)}</span>` }, { label: 'Müşteri', render: (l) => esc(custOf(l.customer).name) }, { label: 'Ürün', render: (l) => `${esc(prod(l.pid).name)} <span class="faint small">${planName(l.plan)}</span>` }, { label: 'Bitiş', render: (l) => NS.date(l.end) }, { label: 'Durum', render: (l) => (l.status !== 'aktif' ? badge('Askıda', 'err') : l.end < new Date().toISOString() ? badge('Süresi doldu', 'warn') : badge('Aktif', 'ok')) }], actions: [{ label: '+1 ay', act: 'ext' }, { label: 'Askıya al', act: 'sus', show: (l) => l.status === 'aktif' }, { label: 'Aktifleştir', act: 'act', show: (l) => l.status !== 'aktif' }], foot: `${rows.length} lisans` }); };
      $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
      on(el, 'click', '[data-act]', (e, t) => { const l = db.get('licenses', t.dataset.id); if (t.dataset.act === 'ext') { const d = new Date(l.end); d.setMonth(d.getMonth() + 1); l.end = d.toISOString(); } else l.status = t.dataset.act === 'sus' ? 'askida' : 'aktif'; db.save(); draw(); });
      draw();
    },
    musteriler(el) {
      el.innerHTML = `<div class="card"><div class="card-h"><h3>Müşteriler</h3></div>${table({ rows: db.all('customers').sort((a, b) => b.created.localeCompare(a.created)), columns: [{ label: 'Müşteri', render: (c) => `<div class="row nw"><div class="avatar">${esc(NS.initials(c.name))}</div><div><b>${esc(c.name)}</b><div class="small faint">${esc(c.email)}</div></div></div>` }, { label: 'Firma', render: (c) => esc(c.company || '-') }, { label: 'Telefon', render: (c) => esc(c.phone || '-') }, { label: 'Lisans', cls: 'right', render: (c) => db.all('licenses', (l) => l.customer === c.id && l.status === 'aktif').length }, { label: 'Toplam ödeme', cls: 'right', render: (c) => `<b>${money(sum(db.all('orders', (o) => o.customer === c.id && o.status === 'odendi'), (o) => o.total))}</b>` }, { label: 'Kayıt', render: (c) => NS.date(c.created) }] })}</div>`;
    },
    talepler(el) {
      const ST = { yeni: ['Yeni', 'warn'], arandi: ['Arandı', 'info'], kazanildi: ['Kazanıldı', 'ok'], kaybedildi: ['Kaybedildi', 'err'] };
      const TY = { demo: 'Demo', teklif: 'Teklif', ozel: 'Özel yazılım', bayi: 'Bayilik', iletisim: 'İletişim', bekleme: 'Bekleme listesi' };
      const draw = () => { el.innerHTML = `<div class="card"><div class="card-h"><h3>Talepler (lead)</h3><span class="small muted">İletişim formu, demo ve "haber ver" kayıtları</span></div>${table({ rows: db.all('leads').sort((a, b) => String(b.created || '').localeCompare(String(a.created || ''))), empty: 'Talep yok', columns: [{ label: 'Kişi', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.phone)} ${l.email ? '· ' + esc(l.email) : ''}</div>` }, { label: 'İşletme', render: (l) => esc(l.biz || '-') }, { label: 'Tür', render: (l) => badge(TY[l.type] || l.type || '-', 'acc') }, { label: 'Ürün', render: (l) => esc(l.product ? prod(l.product).name : '-') }, { label: 'Mesaj', render: (l) => `<span class="small">${esc(l.msg || '')}</span>` }, { label: 'Durum', render: (l) => `<select class="input" style="height:30px" data-ls="${l.id}">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>` }, { label: 'Tarih', render: (l) => NS.ago(l.created) }] })}</div>`; };
      on(el, 'change', '[data-ls]', (e, t) => { db.update('leads', t.dataset.ls, { status: t.value }); toast('Güncellendi', 'ok'); });
      draw();
    },
    destek(el, redraw) {
      const list = db.all('tickets').sort((a, b) => (a.status === 'acik' ? -1 : 1) - (b.status === 'acik' ? -1 : 1));
      el.innerHTML = list.map((t) => ticketCard(t, 'admin')).join('') || '<div class="card pad empty">Destek talebi yok</div>';
      bindTickets(el, 'admin', redraw);
    },
    urunler(el, redraw) {
      el.innerHTML = `<div class="card"><div class="card-h"><h3>Ürünler & fiyatlar</h3><span class="small muted">Değişiklikler vitrine anında yansır</span></div>${table({ rows: products(), columns: [{ label: 'Ürün', render: (p) => `<div class="row nw"><span class="avatar" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><b>${esc(p.name)}</b></div>` }, ...C.plans.map((pl, i) => ({ label: pl.name, cls: 'right', render: (p) => money(p.prices[i]) })), { label: 'Satış', cls: 'right', render: (p) => db.all('licenses', (l) => l.pid === p.id).length }, { label: 'Durum', render: (p) => (p.ready ? badge('Yayında', 'ok') : badge('Yakında', 'warn')) }], actions: [{ icon: 'edit', act: 'ed' }, { icon: 'eye', act: 'vw' }] })}</div>`;
      on(el, 'click', '[data-act]', async (e, t) => {
        const p = prod(t.dataset.id);
        if (t.dataset.act === 'vw') { location.hash = '#/urun/' + p.id; return; }
        const v = await formModal({ title: p.name, fields: [{ name: 'p0', label: 'Başlangıç (₺/ay)', type: 'number' }, { name: 'p1', label: 'Profesyonel (₺/ay)', type: 'number' }, { name: 'p2', label: 'Kurumsal (₺/ay)', type: 'number' }, { name: 'tagline', label: 'Kısa açıklama', full: true }], values: { p0: p.prices[0], p1: p.prices[1], p2: p.prices[2], tagline: p.tagline } });
        if (!v) return;
        db.data.overrides = db.data.overrides || {};
        db.data.overrides[p.id] = { ...(db.data.overrides[p.id] || {}), prices: [v.p0, v.p1, v.p2], tagline: v.tagline };
        db.save(); toast('Ürün güncellendi', 'ok'); redraw();
      });
    },
    kuponlar(el) {
      NS.crud(el, { db, opts: {}, refresh: () => ADMIN.kuponlar(el) }, { col: 'coupons', title: 'Kuponlar', single: 'Kupon', addLabel: 'Yeni kupon', emptyIcon: 'ticket', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'pct', label: 'İndirim %', type: 'number', required: true }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { active: true }, beforeSave: (v) => { v.code = v.code.toUpperCase(); }, columns: [{ key: 'code', label: 'Kod', render: (k) => `<span class="mono"><b>${esc(k.code)}</b></span>` }, { key: 'pct', label: 'İndirim', render: (k) => '%' + k.pct }, { key: 'uses', label: 'Kullanım', cls: 'right', render: (k) => k.uses || 0 }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) }] });
    },
    ayarlar(el) {
      const f = [{ name: 'siteName', label: 'Site adı', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta' }, { name: 'address', label: 'Adres', full: true }, { name: 'bank', label: 'Banka' }, { name: 'iban', label: 'IBAN' }, { name: 'adminPin', label: 'Yönetim PIN', type: 'password' }];
      el.innerHTML = `<div class="card pad" id="sf"><h3 class="mb">Site ayarları</h3>${NS.fieldsHtml(f, S())}<div class="row mt"><button class="btn primary" id="sv">Kaydet</button><button class="btn danger" id="rs">Tüm pazar yeri verisini sıfırla</button></div></div>
        <div class="card pad mt"><h3 class="mb">Canlıya alma kontrol listesi</h3><div class="col small">${['Alan adı ve SSL sertifikası', 'iyzico / PayTR üye işyeri başvurusu ve API anahtarları', 'e-Arşiv / e-Fatura entegratörü (ör. Paraşüt, Logo, Uyumsoft)', 'SMS sağlayıcı (Netgsm / İleti Merkezi) hesabı', 'Sunucu tarafı veritabanı (PostgreSQL) ve kullanıcı kimlik doğrulama', 'KVKK metinlerinin hukukçu tarafından onaylanması', 'Mesafeli satış sözleşmesi ve ETBİS kaydı'].map((x) => `<label class="check"><input type="checkbox"> ${x}</label>`).join('')}</div></div>`;
      $('#sv', el).onclick = () => { if (!NS.validate($('#sf', el))) return; db.saveSettings(NS.readForm($('#sf', el))); toast('Kaydedildi', 'ok'); };
      $('#rs', el).onclick = async () => { if (await confirm('Pazar yeri demo verisi sıfırlansın mı?')) { db.reset(); location.reload(); } };
    },
  };

  // ---------- Canlı (bulut) mod: sunucuda MySQL yapılandırılmışsa tüm hesap, deneme, sipariş ve lisans işlemleri API'den ----------
  // Logo rengi temaya göre (Kurumsal: kurumsal mavi; diğer temalarda NEBSOFT moru)
  const KUR = () => document.documentElement.dataset.palette === 'kurumsal';
  const LOGO = () => (KUR() ? '#1f5fd6' : '#4f46e5'); const LOGO_L = () => (KUR() ? '#60a5fa' : '#818cf8');
  let CL = null;
  const TRIAL = () => (CL && CL.trialDays) || 7;
  const appUrl = (pid) => `apps/${pid}/index.html`;
  const OST = { 'odeme-bekliyor': ['Ödeme bekleniyor', 'warn'], odendi: ['Ödendi', 'ok'], iptal: ['İptal', ''] };
  const LST2 = { talep: ['Başlatılmadı', 'warn'], deneme: ['Deneme', 'info'], aktif: ['Aktif', 'ok'], askida: ['Askıda', 'err'], iptal: ['İptal', ''] };
  let SRV_MODE = ''; // setup: veritabanı kurulmadı · offline: bağlanılamıyor · cloud: hazır
  async function refreshMe() { try { const r = await NS.api('GET', '/api/auth/me'); SRV_MODE = r.mode || ''; if (r.mode === 'cloud') CL = r; } catch (e) { /* çevrimdışı */ } drawNav(); }
  try { const ref = new URLSearchParams(location.search).get('ref'); if (ref) sessionStorage.setItem('nebsoft:ref', ref.slice(0, 16)); } catch (e) { /* yok */ }
  const ibanFmt = (s) => String(s).replace(/(.{4})/g, '$1 ').trim();
  const bankBox = (banks, no, total) => `<div class="card pad" style="background:var(--warn-soft);border:0;text-align:left"><b>${icon('building')} Havale / EFT bilgileri</b>${banks.map((b) => `<div class="mt"><div><b>${esc(b.holder)}</b> · ${esc(b.bank)}</div><div class="row nw"><span class="mono" style="font-size:16px">${esc(ibanFmt(b.iban))}</span><button class="btn sm ghost icon" data-copy="${esc(b.iban)}" title="IBAN kopyala">${icon('copy')}</button></div></div>`).join('')}
    <div class="mt">Tutar: <b>${money(total)}</b> · Açıklamaya mutlaka <b class="mono">${esc(no)}</b> yazın.</div><div class="small muted mt">Ödemeniz hesabımıza geçip onaylandığında lisansınız otomatik aktifleşir ve size bildirilir. Bu sürede deneme hakkınız devam eder.</div></div>`;
  on(document, 'click', '[data-copy]', (e, t) => { navigator.clipboard && navigator.clipboard.writeText(t.dataset.copy); toast('Kopyalandı', 'ok'); });

  async function startTrial(pid) {
    if (!CL) { window.open(`apps/${pid}/index.html?demo=1`, '_blank'); return; }
    if (!CL.user) { location.hash = '#/kayit/' + pid; return; }
    try { const r = await NS.api('POST', '/api/trial', { product: pid }); await refreshMe(); toast(r.existing ? 'Bu ürün hesabınızda zaten tanımlı' : 'Program hazır', 'ok'); location.href = appUrl(pid); } catch (e) { toast(e.message, 'err'); }
  }
  function authPage(el, mode, pid) {
    if (CL && CL.user) { if (pid) startTrial(pid); else location.hash = '#/programlarim'; return; }
    authView(el, mode === 'kayit' ? 'kayit' : 'giris', pid);
  }
  async function cloudCheckout(el) {
    const t = cartTotals();
    if (!t.lines.length && !cart().support) { location.hash = '#/sepet'; return; }
    if (!CL.user) { toast('Sipariş için önce giriş yapın veya ücretsiz hesap açın', ''); location.hash = '#/giris'; return; }
    let banks = []; try { banks = (await NS.api('GET', '/api/banks')).banks; } catch (e) { /* yok */ }
    let cardOn = false; try { cardOn = !!(await NS.api('GET', '/api/odeme/yontemler')).shopier; } catch (e) { /* kart seçeneği görünmez */ }
    const ten = CL.tenant || {};
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><h1 class="mb">Ödeme</h1><div class="grid g-21">
      <div class="col" style="gap:16px"><div class="card pad" id="bf"><h3 class="mb">Fatura bilgileri</h3><div class="form-grid">${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'company', label: 'Firma / işletme', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'taxType', label: 'Fatura tipi', type: 'select', options: [{ value: 'kurumsal', label: 'Kurumsal (Vergi no)' }, { value: 'bireysel', label: 'Bireysel (TCKN)' }] }, { name: 'taxNo', label: 'Vergi no / TCKN', required: true }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'city', label: 'İl', required: true }, { name: 'address', label: 'Fatura adresi', full: true, required: true }], { name: CL.user.name, phone: CL.user.phone, company: ten.name, city: ten.city, address: ten.address })}</div></div>
        <div class="card pad"><h3 class="mb">Ödeme yöntemi</h3>${cardOn ? `<label class="card pad row nw mb" style="cursor:pointer"><input type="radio" name="paym" value="shopier" ${banks.length ? '' : 'checked'}><div class="grow"><b>${icon('card')} Banka / kredi kartı (Shopier)</b><div class="small muted">Shopier güvenli ödeme sayfasına yönlendirileceksiniz. Kart bilgileriniz bu sitede alınmaz ve saklanmaz.</div></div></label>${banks.length ? `<label class="card pad row nw" style="cursor:pointer"><input type="radio" name="paym" value="havale" checked><div class="grow"><b>${icon('building')} Havale / EFT</b><div class="small muted">Siparişten sonra IBAN ve açıklama bilgisi gösterilir. Ödemeniz onaylanınca lisansınız aktifleşir.</div></div></label>` : ''}` : `<div class="card pad row nw" style="border-color:var(--brand)"><span style="color:var(--brand)">${icon('building')}</span><div class="grow"><b>Havale / EFT</b><div class="small muted">Siparişten sonra IBAN ve açıklama bilgisi gösterilir. Ödemeniz onaylanınca lisansınız aktifleşir.</div></div></div>`}
        ${banks.length || cardOn ? '' : `<p class="small mt" style="color:var(--err)">${icon('alert')} Şu an tanımlı ödeme hesabı yok; lütfen bizimle iletişime geçin.</p>`}
        <label class="check small mt"><input type="checkbox" id="agree"> <span><a href="/mesafeli-satis/" target="_blank">Mesafeli satış sözleşmesini</a> ve <a href="/kvkk/" target="_blank">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label><div id="od-beyan"></div></div></div>
      <div><div class="card pad" style="position:sticky;top:86px"><h3 class="mb">Sipariş özeti</h3><div id="od-oz">${NS.skeleton ? NS.skeleton(3) : ''}</div>
        <button class="btn primary lg block mt" id="pay" disabled data-acik="${banks.length || cardOn ? '1' : ''}">${icon('check')} Siparişi oluştur</button><p class="small faint center mt">Tutar sunucuda yeniden hesaplanır.</p></div></div></div></div></section>`;
    const ctx = sepetCtx(); if (!(await window.NB_SEPET.odeme(el, ctx))) return;
    $('#pay', el).onclick = async () => {
      const f = $('#bf', el); if (!NS.validate(f)) return; if (!$('#agree', el).checked) return toast('Sözleşmeyi onaylayın', 'err');
      const by = $('#od-sube', el); if (by && !by.checked) return toast('Şube sayısı beyanını onaylayın', 'err');
      const pm = $('input[name="paym"]:checked', el); const card = !!pm && pm.value === 'shopier'; const btn = $('#pay', el); btn.disabled = true;
      try {
        const r = await NS.api('POST', '/api/orders', { ...window.NB_SEPET.istek(ctx), subeBeyan: !!by, billing: NS.readForm(f), ...(card ? { method: 'shopier' } : {}) });
        db.data.cart = { items: [], coupon: null }; db.save(); drawNav(); if (r.shopier && !r.shopier.ok) toast(r.shopier.error, 'err'); location.hash = '#/basarili/' + r.order.id;
      } catch (e) { btn.disabled = false; toast(e.message, 'err'); }
    };
  }
  async function cloudSuccess(el, id) {
    let r; try { r = await NS.api('GET', '/api/orders'); } catch (e) { location.hash = '#/giris'; return; }
    const o = r.orders.find((x) => x.id === id); if (!o) { location.hash = '#/hesabim/siparisler'; return; }
    let p = null; try { p = await NS.api('GET', `/api/orders/${id}/odeme`); } catch (e) { /* durum alınamazsa havale görünümü */ }
    const sp = p && p.shopier; const paid = (p ? p.status : o.status) === 'odendi'; const pending = (p ? p.status : o.status) === 'odeme-bekliyor';
    const live = sp && pending && sp.state !== 'kapandi'; // Shopier'de açık ödeme: ödeme doğrulanana kadar "kontrol ediliyor" görünür, başarı gösterilmez
    el.innerHTML = `<section class="sec"><div class="mk-wrap" style="max-width:760px"><div class="card pad center"><div class="kpi" style="justify-content:center"><div class="ic ${paid ? 'ok' : 'warn'}" style="width:70px;height:70px">${icon(paid ? 'check' : 'clock', 'ico-lg')}</div></div>
      <h1 class="mt">${paid ? 'Ödemeniz onaylandı' : live ? (sp.state === 'inceleme' ? 'Ödemeniz inceleniyor' : 'Ödeme kontrol ediliyor') : 'Siparişiniz alındı'}</h1><p class="muted mt">Sipariş no: <b class="mono">${esc(o.no)}</b> · ${money(o.total)}</p>
      ${live && sp.state === 'inceleme' ? `<div class="card pad mt" style="background:var(--warn-soft);border:0;text-align:left">Ödemeniz otomatik olarak eşleştirilemedi. Ekibimiz kontrol ediyor; sonuç size bildirilecek. Lütfen yeniden ödeme yapmayın.</div>` : ''}
      ${live && sp.state !== 'inceleme' ? `<div class="card pad mt" style="text-align:left"><b>${icon('card')} Banka / kredi kartı (Shopier)</b><p class="small muted mt">Shopier güvenli ödeme sayfasına yönlendirileceksiniz. Kart bilgileriniz bu sitede alınmaz ve saklanmaz.</p>${sp.url ? `<a class="btn primary lg block mt" href="${esc(sp.url)}" target="_blank" rel="noopener noreferrer">${icon('card')} Shopier'de ödemeye geç</a>` : ''}<div class="small mt row nw">${icon('clock')}<span>Ödemeyi tamamladıysanız bu sayfayı açık bırakın. Ödeme doğrulanana kadar burada <b>kontrol ediliyor</b> yazar; lisansınız ancak doğrulamadan sonra açılır.</span></div></div>` : ''}
      ${pending && !live ? `<div class="mt">${bankBox(r.banks, o.no, o.total)}</div>${sp ? `<button class="btn mt" id="repay">${icon('card')} Yeni kart ödemesi bağlantısı al</button>` : ''}` : ''}
      <div class="row mt" style="justify-content:center"><a class="btn ${live ? '' : 'primary'}" href="#/hesabim">${icon('user')} Hesabıma git</a></div></div></div></section>`;
    if ($('#repay', el)) $('#repay', el).onclick = async () => { try { await NS.api('POST', `/api/orders/${id}/shopier`); cloudSuccess(el, id); } catch (x) { toast(x.message, 'err'); } };
    if (live) setTimeout(() => { if (location.hash === '#/basarili/' + id && el.isConnected) cloudSuccess(el, id); }, 6000);
    if (paid && sp) refreshMe();
  }
  async function cloudAccount(el, tab) {
    if (!CL.user) return authPage(el, 'giris');
    if (['admin', 'superadmin'].includes(CL.user.role)) { location.href = 'admin/'; return; }
    tab = tab || 'lisanslar';
    const L = (CL.licenses || []).filter((l) => !/^eklenti-/.test(l.product));
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap">
      <div class="page-h"><div class="avatar lg">${esc(NS.initials(CL.user.name))}</div><div class="grow"><h1>${esc(CL.tenant ? CL.tenant.name : CL.user.name)}</h1><p>${esc(CL.user.name)} · ${esc(CL.user.email)}</p></div><button class="btn" id="lo">${icon('logout')} Çıkış</button></div>
      <div class="grid g4 mb">${kpi('Aktif lisans', L.filter((l) => l.valid && l.status === 'aktif').length, 'key', 'ok')}${kpi('Deneme', L.filter((l) => l.valid && l.status === 'deneme').length, 'clock', 'info')}${kpi('Biten', L.filter((l) => !l.valid).length, 'alert', 'warn')}${kpi('Uygulama', (CL.apps || []).filter((a) => !['entegrasyon', 'ebelge'].includes(a)).length, 'grid', 'acc')}</div>
      <div class="tabs">${[['lisanslar', 'Uygulamalarım'], ['eklentiler', 'Eklentiler'], ['websitem', 'Web sitem'], ['siparisler', 'Siparişlerim'], ['ekip', 'Ekip'], ['destek', 'Destek'], ['tavsiye', 'Tavsiye et, kazan'], ['profil', 'Profil']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tb" class="mt"></div></div></section>`;
    $('#lo', el).onclick = async () => { await NS.api('POST', '/api/auth/logout').catch(() => {}); CL.user = null; drawNav(); location.hash = '#/'; };
    on(el, 'click', '[data-tab]', (e, t) => { location.hash = ['eklentiler', 'websitem'].includes(t.dataset.tab) ? '#/' + t.dataset.tab : '#/hesabim/' + t.dataset.tab; });
    const tb = $('#tb', el); if (NS.skeleton) tb.innerHTML = NS.skeleton(3);
    if (CL.analitik) tb.insertAdjacentHTML('afterend', `<p class="small faint mt">${icon('info')} Deneme süresince programların hangi bölümlerinin açıldığı toplu olarak sayılır; girdiğiniz veriler bu sayıma dahil değildir. Ayrıntı: <a href="#/yasal/kvkk">Aydınlatma metni</a></p>`);
    if (tab === 'lisanslar') {
      const pageUrl = CL.tenant ? `${location.origin}/t/${CL.tenant.slug}/` : '';
      tb.innerHTML = (pageUrl ? `<div class="card pad mb row" style="gap:12px;flex-wrap:wrap"><div class="grow"><b>${icon('globe')} İşletme sayfanız</b><div class="small muted">Müşterileriniz online randevu, takip ve portal sayfalarınıza buradan ulaşır. Sosyal medya ve Google İşletme profilinize ekleyin.</div><a class="mono small" href="${esc(pageUrl)}" target="_blank" rel="noopener">${esc(pageUrl)}</a></div><button class="btn" id="cpu">${icon('copy')} Kopyala</button></div>` : '') + (L.length ? `<div class="grid g2">${L.map((l) => { const p = prod(l.product) || { name: l.product, icon: 'box', accent: '#64748b' }; const left = Math.ceil((new Date(l.end) - Date.now()) / 864e5); return `<div class="card pad"><div class="row nw mb"><span class="avatar lg" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div class="grow"><b>${esc(p.name)}</b><div class="small muted">${l.status === 'deneme' ? 'Ücretsiz deneme' : planName(l.plan) + ' · ' + (l.period === 'yillik' ? 'Yıllık' : 'Aylık')}</div></div>${l.valid ? badge(LST2[l.status][0], LST2[l.status][1]) : badge('Süresi doldu', 'err')}</div>
        <div class="small muted">${l.valid ? `${NS.date(l.end)} tarihine kadar · <b>${left} gün</b> kaldı` : `${NS.date(l.end)} tarihinde bitti — verileriniz saklanıyor`}</div>
        <div class="row mt">${l.valid ? `<a class="btn primary sm" href="${appUrl(l.product)}">${icon('play')} Uygulamayı aç</a>` : ''}<button class="btn sm ${l.valid ? '' : 'primary'}" data-buy="${l.product}">${icon('cart')} ${l.status === 'deneme' ? 'Satın al' : 'Süre uzat'}</button></div></div>`; }).join('')}</div>` : `<div class="card pad empty">${icon('key')}<div>Henüz programınız yok</div><a class="btn primary mt" href="#/programlarim">Bir program seçip ücretsiz deneyin</a></div>`);
      if ($('#cpu', tb)) $('#cpu', tb).onclick = async () => { try { await navigator.clipboard.writeText(pageUrl); toast('Kopyalandı', 'ok'); } catch (x) { NS.prompt('İşletme sayfanız', pageUrl); } };
      on(tb, 'click', '[data-buy]', (e, t) => { addCart(t.dataset.buy, 1, 'aylik'); location.hash = '#/sepet'; });
    } else if (tab === 'siparisler') {
      const r = await NS.api('GET', '/api/orders'); let cardOn = false; try { cardOn = !!(await NS.api('GET', '/api/odeme/yontemler')).shopier; } catch (e) { /* kart seçeneği görünmez */ }
      tb.innerHTML = r.orders.length ? r.orders.map((o) => `<div class="card pad mb"><div class="row"><b class="mono">${esc(o.no)}</b>${badge(OST[o.status][0], OST[o.status][1])}<span class="grow small muted">${NS.dt(o.created)}</span><b>${money(o.total)}</b></div><div class="small muted mt">${o.items.map((i) => (i.type === 'support' ? `${esc(i.name)} · ${i.period === 'yillik' ? 'yıllık' : 'aylık'}` : `${esc(prod(i.pid) ? prod(i.pid).name : i.name || i.pid)} · ${planName(i.plan)} · ${i.period === 'yillik' ? 'yıllık' : 'aylık'}${i.qty > 1 ? ` · ${i.qty} lisans` : ''}`)).join(' · ')}${o.indirim && o.indirim.kural ? ` · ${esc(window.NB_SEPET.indirimYazi(o.indirim))}` : ''}</div>${o.status === 'odeme-bekliyor' ? `<div class="mt">${bankBox(r.banks, o.no, o.total)}</div><div class="row mt">${cardOn ? `<button class="btn sm primary" data-card="${o.id}">${icon('card')} Kartla öde (Shopier)</button>` : ''}<button class="btn sm ghost" data-cancel="${o.id}">Siparişi iptal et</button></div>` : ''}</div>`).join('') : '<div class="card pad empty">Sipariş yok</div>';
      on(tb, 'click', '[data-card]', async (e, t) => { t.disabled = true; try { await NS.api('POST', `/api/orders/${t.dataset.card}/shopier`); location.hash = '#/basarili/' + t.dataset.card; } catch (x) { t.disabled = false; toast(x.message, 'err'); } });
      on(tb, 'click', '[data-cancel]', async (e, t) => { if (!(await confirm('Sipariş iptal edilsin mi?'))) return; try { await NS.api('POST', `/api/orders/${t.dataset.cancel}/cancel`); cloudAccount(fresh(el), 'siparisler'); } catch (x) { toast(x.message, 'err'); } });
    } else if (tab === 'ekip') {
      const r = await NS.api('GET', '/api/team');
      // Program yetkisi: rol seçilen üye o programda yalnızca rolünün gördüğü veriyi alır (sunucu süzer). Seçim yoksa tam yetki.
      const prg = r.programlar || []; const saglik = prg.some((p) => ['klinik', 'eczane', 'veteriner'].includes(p.app));
      const secenek = (p, dep) => (p.kisiler ? [...p.kisiler, ...(dep && !p.kisiler.some((x) => x.value === dep) ? [{ value: dep, label: 'Silinmiş kişi' }] : [])] : [...new Set([...(p.departmanlar || []), ...(dep ? [dep] : [])])].map((d) => ({ value: d, label: d })));
      const rolSec = (u, p) => { const cur = (u.roller || {})[p.app] || ''; const kap = p.roller.find((x) => x.id === cur && x.departman); const dep = (u.roller || {})[`${p.app}_dept`] || ''; return `<div class="field"><label>${esc(p.ad)}</label><select class="input" data-rol="${esc(u.id)}|${esc(p.app)}" aria-label="${esc(u.name)} — ${esc(p.ad)} yetkisi"><option value="">Tam yetki</option>${p.roller.map((x) => `<option value="${esc(x.id)}" ${x.id === cur ? 'selected' : ''}>${esc(x.ad)}</option>`).join('')}</select>${kap ? `<select class="input mt" data-dept="${esc(u.id)}|${esc(p.app)}" data-r="${esc(cur)}" aria-label="${esc(u.name)} — ${esc(kap.baslik || 'departman')}"><option value="">${esc(kap.yok || 'Departman seçin (seçilmezse personel görünmez)')}</option>${secenek(p, dep).map((d) => `<option value="${esc(d.value)}" ${d.value === dep ? 'selected' : ''}>${esc(d.label)}</option>`).join('')}</select>` : ''}</div>`; };
      const yetki = (u) => (u.sahip ? '<span class="small muted">Hesap sahibi, her zaman tam yetkili</span>' : `<div class="form-grid">${prg.map((p) => rolSec(u, p)).join('')}</div>`);
      tb.innerHTML = `<div class="row mb"><span class="grow muted">Ekip üyeleri kendi e-posta ve şifreleriyle aynı işletmenin uygulamalarına erişir (her cihazda ayrı giriş).</span><button class="btn primary" id="add">${icon('plus')} Kullanıcı ekle</button></div>${prg.length ? `<p class="small muted mb">Rol seçilen üye o programda yalnızca rolünün görebildiği veriyi alır; hasta tanısı, maaş, maliyet ve PIN gibi bilgiler sunucudan hiç gönderilmez. Değişiklik üyenin bir sonraki işleminde geçerli olur.</p>` : ''}<div class="card">${table({ rows: r.users, columns: [{ label: 'Kullanıcı', render: (u) => `<b>${esc(u.name)}</b><div class="small faint">${esc(u.email)}</div><div class="small faint">Son giriş: ${u.last_login ? NS.dt(u.last_login) : '-'}</div>` }, ...(prg.length ? [{ label: 'Program yetkisi', render: yetki }] : [])], actions: [{ icon: 'trash', act: 'rm', show: (u) => u.id !== CL.user.id }] })}</div>`;
      const rolKaydet = async (id, app, rol, dept) => { try { await NS.api('PUT', `/api/team/${id}/rol`, { app, rol, dept }); toast('Yetki güncellendi', 'ok'); } catch (x) { toast(x.message, 'err'); } cloudAccount(fresh(el), 'ekip'); };
      on(tb, 'change', '[data-rol]', (e, s) => { const [id, app] = s.dataset.rol.split('|'); rolKaydet(id, app, s.value, ''); });
      on(tb, 'change', '[data-dept]', (e, s) => { const [id, app] = s.dataset.dept.split('|'); rolKaydet(id, app, s.dataset.r, s.value); });
      const rolAlan = prg.flatMap((p) => [{ name: 'rol_' + p.app, label: `${p.ad} yetkisi`, type: 'select', options: [{ value: '', label: 'Tam yetki' }, ...p.roller.map((x) => ({ value: x.id, label: x.ad }))] }, ...(p.roller.some((x) => x.departman) ? [(() => { const r = p.roller.find((x) => x.departman); return { name: 'dept_' + p.app, label: r.kisi ? `${p.ad}: ${r.baslik}` : 'Şefin departmanı', type: 'select', options: [{ value: '', label: '-' }, ...secenek(p, '')], hint: r.kisi ? r.yok : 'Seçilmezse şef hiç personel görmez' }; })()] : [])]);
      $('#add', tb).onclick = async () => { const v = await formModal({ title: 'Ekip üyesi ekle', extra: saglik ? `<div class="card pad mt small" style="border-color:var(--warn)">${icon('alert')} Sağlık programı kullanıyorsunuz. Rol seçmezseniz bu kişi hasta kayıtlarının tamamını ve PIN'leri görür.</div>` : '', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'email', label: 'E-posta', type: 'email', required: true }, { name: 'pass', label: 'Geçici şifre', type: 'password', required: true, hint: 'En az 8 karakter, harf ve rakam' }, ...rolAlan] }); if (!v) return; const roller = {}; prg.forEach((p) => { if (v['rol_' + p.app]) { roller[p.app] = v['rol_' + p.app]; if (v['dept_' + p.app]) roller[`${p.app}_dept`] = v['dept_' + p.app]; } delete v['rol_' + p.app]; delete v['dept_' + p.app]; }); const tam = prg.filter((p) => ['klinik', 'eczane', 'veteriner'].includes(p.app) && !roller[p.app]); if (tam.length && !(await confirm(`${tam.map((p) => p.ad).join(', ')} için rol seçilmedi. Bu kişiye tam yetki verilecek: tüm hasta kayıtlarını ve PIN'leri görür. Devam edilsin mi?`, { ok: 'Tam yetki ver', danger: false, title: 'Tam yetki verilecek' }))) return; try { await NS.api('POST', '/api/team', { ...v, roller }); toast('Eklendi', 'ok'); cloudAccount(fresh(el), 'ekip'); } catch (x) { toast(x.message, 'err'); } };
      on(tb, 'click', '[data-act=rm]', async (e, t) => { if (!(await confirm('Kullanıcı silinsin mi?'))) return; await NS.api('DELETE', `/api/team/${t.dataset.id}`); cloudAccount(fresh(el), 'ekip'); });
    } else if (tab === 'destek') {
      const r = await NS.api('GET', '/api/tickets');
      tb.innerHTML = `${window.NB_SEPET.paketKarti(r.destek, r.paketler)}<div class="row mb"><span class="grow muted">Talepleriniz paketinizdeki sürelerle izlenir.</span><button class="btn primary" id="nt">${icon('plus')} Yeni talep</button></div>${r.tickets.map((t) => `<div class="card mb"><div class="card-h"><h3>${esc(t.subject)}</h3>${badge(t.status === 'kapali' ? 'Kapandı' : t.status === 'yanitlandi' ? 'Yanıtlandı' : 'Açık', t.status === 'yanitlandi' ? 'ok' : t.status === 'acik' ? 'warn' : '')}${window.NB_SEPET.slaRozet(t)}</div><div class="card-b col" style="gap:8px">${t.messages.map((m) => `<div class="small"><b>${m.from === 'destek' ? 'Destek' : 'Siz'}</b> <span class="faint">${NS.dt(m.at)}</span><div>${esc(m.text)}</div></div>`).join('')}${t.status !== 'kapali' ? `<div class="row nw"><input class="input" data-rt="${t.id}" placeholder="Yanıt yazın..."><button class="btn primary" data-rs="${t.id}">${icon('send')}</button></div>` : ''}</div></div>`).join('') || '<div class="card pad empty">Destek talebiniz yok</div>'}`;
      $('#nt', tb).onclick = async () => { const v = await formModal({ title: 'Destek talebi', fields: [{ name: 'product', label: 'Ürün', type: 'select', options: [{ value: '', label: 'Genel / fatura' }, ...L.map((l) => ({ value: l.product, label: (prod(l.product) || {}).name || l.product }))] }, { name: 'subject', label: 'Konu', required: true, full: true }, { name: 'text', label: 'Mesajınız', type: 'textarea', required: true, full: true }] }); if (!v) return; try { await NS.api('POST', '/api/tickets', v); cloudAccount(fresh(el), 'destek'); } catch (x) { toast(x.message, 'err'); } };
      on(tb, 'click', '[data-rs]', async (e, b) => { const v = $(`[data-rt="${b.dataset.rs}"]`, tb).value.trim(); if (!v) return; await NS.api('POST', `/api/tickets/${b.dataset.rs}/reply`, { text: v }); cloudAccount(fresh(el), 'destek'); });
      on(tb, 'click', '[data-dp]', (e, b) => { const c = cart(); c.support = b.dataset.dp; c.supportPeriod = c.supportPeriod || 'aylik'; db.save(); location.hash = '#/sepet'; });
    } else if (tab === 'tavsiye') {
      const r = await NS.api('GET', '/api/referral'); const link = `${location.origin}/?ref=${r.code}#/kayit`;
      const msg = `${S().siteName} işletme yazılımlarını kullanıyorum, ${TRIAL()} gün ücretsiz deneyebilirsin: ${link}`;
      tb.innerHTML = `<div class="grid g2"><div class="card pad"><h2 class="mb">Arkadaşını getir, ikiniz de ${r.days} gün kazanın</h2><p class="muted">Davet ettiğiniz işletme ilk ödemesini yaptığında hem sizin hem onun lisanslarına <b>${r.days} gün</b> eklenir.</p><div class="row nw mt"><input class="input" value="${esc(link)}" readonly><button class="btn" data-copy="${esc(link)}">${icon('copy')}</button></div><div class="row mt"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${icon('message')} WhatsApp ile paylaş</a><span class="small muted">Davet kodunuz: <b class="mono">${esc(r.code)}</b></span></div></div>
        <div class="card pad"><div class="grid g2">${kpi('Davet edilen', r.invited, 'users', 'info')}${kpi('Ödül kazanılan', r.rewarded, 'gift', 'ok')}</div>${r.list.length ? `<div class="mt">${r.list.map((x) => `<div class="list-item small"><span class="grow">${esc(x.name)} · ${NS.date(x.created)}</span>${x.paid ? badge('Ödül verildi', 'ok') : badge('Ödeme bekleniyor', '')}</div>`).join('')}</div>` : ''}</div></div>`;
    } else {
      const t = CL.tenant || {};
      tb.innerHTML = `<div class="grid g2"><div class="card pad" id="pf"><h3 class="mb">Profil ve işletme</h3><div class="form-grid">${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'company', label: 'İşletme adı' }, { name: 'city', label: 'İl' }, { name: 'address', label: 'Adres', full: true }], { name: CL.user.name, phone: CL.user.phone, company: t.name, city: t.city, address: t.address })}</div><button class="btn primary mt" id="sp">Kaydet</button></div>
        <div class="card pad" id="pw"><h3 class="mb">Şifre değiştir</h3>${NS.fieldsHtml([{ name: 'old', label: 'Mevcut şifre', type: 'password' }, { name: 'pass', label: 'Yeni şifre', type: 'password', hint: 'En az 8 karakter, harf ve rakam' }])}<button class="btn mt" id="cp">Değiştir</button><p class="small muted mt">Şifre değişince diğer cihazlardaki oturumlar kapanır.</p></div></div>`;
      $('#sp', tb).onclick = async () => { try { await NS.api('PUT', '/api/account', NS.readForm($('#pf', tb))); await refreshMe(); toast('Kaydedildi', 'ok'); } catch (x) { toast(x.message, 'err'); } };
      $('#cp', tb).onclick = async () => { try { await NS.api('POST', '/api/auth/password', NS.readForm($('#pw', tb))); toast('Şifre değişti', 'ok'); } catch (x) { toast(x.message, 'err'); } };
      window.NB_TERCIH($('#pf', tb));
    }
  }
  function enableCloud() {
    Object.assign(ROUTES, { baglan: linkLogin, hesabim: cloudAccount, giris: (el) => authPage(el, 'giris'), kayit: (el, p) => authPage(el, 'kayit', p), odeme: cloudCheckout, basarili: cloudSuccess, dene: (el, p) => { startTrial(p); location.hash = '#/urun/' + p; }, yonetim: () => { location.href = 'admin/'; } });
    Object.assign(TITLES, { giris: 'Giriş yap', kayit: 'Ücretsiz hesap oluştur' });
  }

  // ---------- Yönlendirme ----------
  const ROUTES = { kayit: (el) => noAccountSystem(el), '': home, programlarim: appsPage, sifre: forgotPage, indir: downloadPage, giris: (el) => (me() ? (location.hash = '#/programlarim') : loginPage(el)), urunler: catalogPage, urun: productPage, paketler: (el) => window.NB_PAKET.liste(el, paketCtx()), paket: (el, p) => window.NB_PAKET.detay(el, p, paketCtx()), fiyatlar: pricingPage, sektorler: sectorsPage, eklentiler: (el) => window.NB_EK.store(el, ekCtx()), websitem: (el) => (!CL || me() ? window.NB_EK.builder(el, ekCtx()) : (location.hash = '#/giris')), yardim: (el, p) => window.NB_YARDIM.sayfa(el, p), sepet: cartPage, odeme: checkoutPage, basarili: successPage, hesabim: accountPage, iletisim: contactPage, yasal: legalPage, yonetim: adminPage };
  const ekCtx = () => ({ cloud: () => CL, addCart: (pid) => addCart(pid, 0, 'aylik'), me });
  const TITLES = { yardim: 'Yardım merkezi', eklentiler: 'Eklenti Mağazası', websitem: 'Web sitem', programlarim: 'Programlarım', sifre: 'Şifremi unuttum', indir: 'Masaüstü & Mobil', giris: 'Giriş yap', urunler: 'Ürünler', paketler: 'Hazır Paketler', paket: 'Hazır paket', fiyatlar: 'Fiyatlar', sektorler: 'Sektörler', sepet: 'Sepet', odeme: 'Ödeme', hesabim: 'Hesabım', iletisim: 'İletişim', yonetim: 'Yönetim' };
  function route() {
    const [, r = '', p] = location.hash.match(/^#\/?([^/]*)\/?(.*)$/) || [];
    const fn = ROUTES[r] || home;
    pickKeys = null;
    document.body.classList.remove('mk-auth');
    const page = $('#page');
    const fresh = page.cloneNode(false); page.replaceWith(fresh);
    fn(fresh, p ? decodeURIComponent(p) : null);
    $$('[data-l]').forEach((a) => a.classList.toggle('active', a.dataset.l === r));
    const pr = r === 'urun' && prod(p);
    document.title = pr ? `${pr.name} · ${S().siteName}` : `${TITLES[r] ? TITLES[r] + ' · ' : ''}${S().siteName} — İşletme Yazılımları Pazarı`;
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('storage', (e) => { if (e.key === db.key) { db.load(); drawNav(); } });
  // Sunucu bulut modundaysa (MySQL bağlı) hesap/sipariş işlemleri API'den yürür; değilse yerel demo
  const start = () => { frame(); route(); };
  if (location.protocol.startsWith('http')) NS.api('GET', '/api/auth/me').then((r) => { SRV_MODE = r.mode || ''; if (r.mode === 'cloud') { CL = r; enableCloud(); } }).catch(() => {}).finally(start); else start();
})();
