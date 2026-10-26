/* NEBSOFT Pazar yeri — vitrin, ürün sayfası, sepet, ödeme, lisans, müşteri hesabı ve yönetim paneli */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, sum, rand, pick, addDays, iso, today } = NS;
  const C = window.CATALOG;
  const VAT = 20;
  const BUNDLE = { id: 'bundle', name: 'Hepsi Bir Arada', tagline: 'Tüm NEBSOFT ürünleri tek abonelikte', icon: 'layers', accent: '#4f46e5', prices: [1999, 3999, 7999], ready: true };

  // ---------- Veri ----------
  function seed(db) {
    db.data._settings = { siteName: 'NEBSOFT', phone: '0850 555 00 34', email: 'destek@nebsoft.com.tr', address: 'Maslak, Büyükdere Cad. No:255, Sarıyer/İstanbul', iban: 'TR12 0006 4000 0011 2345 6789 01', bank: 'İş Bankası', adminPin: '1234', trialDays: 14 };
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
  const S = () => db.settings({ siteName: 'NEBSOFT', adminPin: '1234' });
  const ov = (pid) => (db.data.overrides || {})[pid] || {};
  const products = () => C.products.map((p) => ({ ...p, ...ov(p.id) }));
  const prod = (id) => (id === 'bundle' ? BUNDLE : products().find((p) => p.id === id));
  const price = (p, plan, period) => p.prices[plan] * (period === 'yillik' ? 10 : 1);
  const custOf = (id) => db.get('customers', id) || { name: '-', email: '' };
  const planName = (i) => C.plans[i].name;
  const stars = (r) => `<span class="stars">${'★'.repeat(Math.round(r))}${'☆'.repeat(5 - Math.round(r))}</span>`;

  // Oturumlar
  const SKEY = 'nebsoft:market:user', AKEY = 'nebsoft:market:admin';
  const ss = { get: (k) => { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v, persist) => { try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* yok */ } }, del: (k) => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch (e) { /* yok */ } } };
  const me = () => db.get('customers', ss.get(SKEY));
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
    db.save(); drawNav(); toast(`${prod(pid).name} sepete eklendi`, 'ok');
  }
  function cartTotals() {
    const c = cart();
    const lines = c.items.map((i) => { const p = prod(i.pid); return { ...i, p, unit: price(p, i.plan, i.period), line: price(p, i.plan, i.period) * (i.qty || 1) }; });
    const subtotal = sum(lines, (l) => l.line);
    const cp = c.coupon && db.find('coupons', (k) => k.code === c.coupon && k.active);
    const discount = cp ? Math.round(subtotal * cp.pct) / 100 : 0;
    const vat = Math.round((subtotal - discount) * VAT) / 100;
    return { lines, subtotal, discount, vat, total: subtotal - discount + vat, coupon: cp };
  }

  // Logo yazısı: NEB koyu/beyaz, SOFT mavi (site adı değişmişse düz yazar)
  const brandName = () => (/^nebsoft$/i.test(S().siteName) ? '<span class="wm"><b>NEB</b><i>SOFT</i></span>' : `<span>${esc(S().siteName)}</span>`);

  // ---------- İskelet ----------
  function frame() {
    document.body.className = 'mk';
    document.body.innerHTML = `<header class="mk-nav"><div class="mk-wrap">
        <a class="mk-logo" href="#/">${NS.logoMark('#1d7bf5', 36)}${brandName()}</a>
        <nav class="mk-links" id="links"><a href="#/urunler" data-l="urunler">Ürünler</a><a href="#/fiyatlar" data-l="fiyatlar">Fiyatlar</a><a href="#/sektorler" data-l="sektorler">Sektörler</a><a href="#/iletisim" data-l="iletisim">İletişim</a></nav>
        <span class="grow mk-hide-m"></span>
        <button class="btn ghost icon" data-theme title="Tema" data-theme-ico>${icon(NS.getTheme() === 'dark' ? 'sun' : 'moon')}</button>
        <a class="btn ghost icon cart-btn" href="#/sepet" title="Sepet">${icon('cart')}<span class="cnt hide" id="cc"></span></a>
        <a class="btn ghost mk-hide-m" href="#/hesabim" id="acc">${icon('user')} Hesabım</a>
        <a class="btn primary mk-hide-m" href="#/urunler">Ücretsiz dene</a>
        <button class="btn ghost icon mk-burger" id="burger">${icon('menu')}</button>
      </div></header>
      <main id="page"></main>
      <footer class="mk-foot"><div class="mk-wrap"><div class="cols">
        <div><a class="mk-logo" href="#/">${NS.logoMark('#1d7bf5', 36)}${brandName()}</a><p class="muted small mt">Türkiye'deki işletmeler için bulut tabanlı işletme yazılımları. Kurulum yok, taahhüt yok.</p><p class="small mt">${icon('phone')} ${esc(S().phone)}<br>${icon('mail')} ${esc(S().email)}<br>${icon('map')} ${esc(S().address)}</p></div>
        <div><h4>Ürünler</h4>${products().filter((p) => p.ready).map((p) => `<a href="#/urun/${p.id}">${esc(p.name)}</a>`).join('')}<a href="#/urunler">Tüm ürünler →</a></div>
        <div><h4>Kurumsal</h4><a href="#/fiyatlar">Fiyatlandırma</a><a href="#/sektorler">Sektörler</a><a href="#/iletisim">İletişim</a><a href="#/hesabim">Müşteri paneli</a><a href="#/yonetim">Yönetim paneli</a></div>
        <div><h4>Yasal</h4><a href="#/yasal/kvkk">KVKK Aydınlatma</a><a href="#/yasal/sozlesme">Mesafeli Satış Sözleşmesi</a><a href="#/yasal/iade">İptal ve İade</a><a href="#/yasal/gizlilik">Gizlilik Politikası</a></div>
      </div><hr><div class="row between small faint"><span>© ${new Date().getFullYear()} ${esc(S().siteName)} Yazılım. Tüm hakları saklıdır.</span><span>${icon('shield')} 256-bit SSL · KVKK uyumlu · Türkiye'de barındırılır</span></div></div></footer>`;
    on(document.body, 'click', '[data-theme]', NS.toggleTheme);
    $('#burger').onclick = () => $('#links').classList.toggle('open');
    on(document.body, 'click', '#links a', () => $('#links').classList.remove('open'));
    drawNav();
  }
  function drawNav() {
    const n = cart().items.length;
    const cc = $('#cc'); if (cc) { cc.textContent = n; cc.classList.toggle('hide', !n); }
    const acc = $('#acc'); if (acc) acc.innerHTML = me() ? `${icon('user')} ${esc(me().name.split(' ')[0])}` : `${icon('user')} Giriş`;
  }
  function reveal(root) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    $$('.reveal', root).forEach((x) => io.observe(x));
    // Gözlemci hiç tetiklenmezse (arka plan sekmesi, yazdırma vb.) içerik görünmez kalmasın
    setTimeout(() => $$('.reveal', root).forEach((x) => x.classList.add('in')), 1200);
  }
  const pcard = (p) => `<a class="pcard reveal" href="#/urun/${p.id}" style="--pc:${p.accent}">${p.ready ? '' : `<span class="badge warn soon">Yakında</span>`}
      <div class="pic">${icon(p.icon, 'ico-lg')}</div><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p>
      <div class="meta">${stars(p.rating)} <b>${p.rating}</b> <span>(${num(p.reviews)})</span><span class="grow"></span>${icon('users')} ${num(p.users)}+</div>
      <div class="row between"><div class="price">Başlangıç <b>${money(p.prices[0]).replace(',00', '')}</b>/ay</div><span class="btn sm ${p.ready ? 'primary' : ''}">${p.ready ? 'İncele' : 'Haber ver'} ${icon('right')}</span></div></a>`;

  // ---------- Ana sayfa ----------
  function home(el) {
    const ps = products();
    const ready = ps.filter((p) => p.ready);
    const serie = Array.from({ length: 12 }, (_, i) => 30 + i * 6 + rand(-8, 12));
    el.innerHTML = `
      <section class="hero"><div class="mk-wrap">
        <div>
          <div class="pill-top"><b>YENİ</b> ${ready.length} ürün canlı demoda — kayıt olmadan deneyin</div>
          <h1>İşletmenizi <span class="grad">tek platformdan</span> yönetin.</h1>
          <p class="lead">Market, restoran, kuaför, otel, servis… Sektörünüze özel hazırlanmış bulut yazılımlarıyla satışı hızlandırın, stoğu kontrol edin, müşterinizi kaybetmeyin.</p>
          <div class="row"><a class="btn primary lg" href="#/urunler">${icon('grid')} Ürünleri keşfet</a><a class="btn lg" href="apps/pos/index.html?demo=1" target="_blank">${icon('play')} Canlı demoyu dene</a></div>
          <div class="trust"><div><b>12.400+</b><span>aktif işletme</span></div><div><b>4,8 / 5</b><span>${stars(5)} müşteri puanı</span></div><div><b>81 il</b><span>Türkiye geneli</span></div><div><b>%99,9</b><span>çalışma süresi</span></div></div>
        </div>
        <div style="position:relative">
          <div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>app.nebsoft.com.tr/pos</span></div>
            <div class="mock-body"><div class="mock-side">${[['home', 'Özet', 1], ['barcode', 'Satış'], ['box', 'Ürünler'], ['users', 'Müşteriler'], ['chart', 'Raporlar']].map(([i, l, a]) => `<div class="${a ? 'on' : ''}">${icon(i)} ${l}</div>`).join('')}</div>
            <div class="mock-main"><div class="mock-kpis"><div><b>₺48.250</b><span>Bugünkü ciro</span></div><div><b>312</b><span>Fiş</span></div><div><b>%24</b><span>Kâr marjı</span></div></div>
            <div class="card" style="padding:10px">${chart.line([{ name: 'Ciro', values: serie, color: '#4f46e5' }], ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'], { height: 170 })}</div></div></div></div>
          <div class="float-card" style="left:-26px;bottom:40px"><div class="ic" style="background:#9333ea">${icon('calendar')}</div><div><b>Yeni online randevu</b><div class="faint">Ayşe K. · Bugün 14:30</div></div></div>
          <div class="float-card" style="right:-14px;top:-18px;animation-delay:1.5s"><div class="ic" style="background:#e11d48">${icon('bell')}</div><div><b>Masa 5 hesap istedi</b><div class="faint">QR menü · az önce</div></div></div>
          <div class="float-card" style="right:30px;bottom:-22px;animation-delay:.8s"><div class="ic" style="background:#16a34a">${icon('check')}</div><div><b>Satış tamamlandı</b><div class="faint">₺1.240,50 · Kart</div></div></div>
        </div>
      </div></section>

      <section class="sec" style="padding-bottom:0"><div class="mk-wrap"><div class="brand-band reveal">
        <img src="assets/nebsoft-logo.webp" alt="NEBSOFT logosu">
        <div><h2 style="color:#fff;font-size:30px;letter-spacing:-.02em">Tek marka. ${ps.length} ürün. Tek hesap.</h2><p style="color:#cbd5e1;margin:10px 0 22px">Her NEBSOFT ürünü kendi rengini taşır; hepsi aynı altyapı, aynı kullanıcı hesabı ve aynı entegrasyon merkeziyle (SMS, yazıcı, terazi, POS, e-Fatura) çalışır.</p>
        <div class="marks">${ps.map((p) => `<a class="mk" href="#/urun/${p.id}">${NS.logoMark(p.accent, 46)}<span>${esc(p.name)}</span></a>`).join('')}</div></div></div></div></section>

      <section class="sec" id="urunler"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Ürünler</span><h2>Hangi işi yapıyorsunuz?</h2><p>Sektörünüzü seçin, size özel yazılımı hemen deneyin.</p></div>
        <div class="chips" id="hc"><button class="chip active" data-c="">Tümü</button>${C.categories.map((c) => `<button class="chip" data-c="${c.id}">${icon(c.icon)} ${esc(c.name)}</button>`).join('')}</div>
        <div class="pgrid" id="hp">${ps.map(pcard).join('')}</div>
      </div></section>

      <section class="sec" style="background:var(--surface);border-block:1px solid var(--border)"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Neden ${esc(S().siteName)}?</span><h2>Kurulum yok. Taahhüt yok. Sınır yok.</h2><p>Tüm ürünler aynı güçlü altyapı üzerinde çalışır.</p></div>
        <div class="feat">${[['globe', 'Her cihazdan erişim', 'Bilgisayar, tablet ve telefondan tarayıcıyla çalışır. Uygulama kurmanıza gerek yok.'], ['zap', '5 dakikada başlayın', 'Hesabınızı açın, ürünlerinizi Excel ile aktarın, ilk satışınızı yapın.'], ['shield', 'KVKK uyumlu güvenlik', 'Verileriniz Türkiye\'de, şifreli ve günlük yedeklenerek saklanır.'], ['users', 'Rol ve yetki yönetimi', 'Kasiyer, garson, personel… Herkes yalnızca görmesi gerekeni görür.'], ['chart', 'Anlık raporlar', 'Ciro, kâr, stok ve personel performansını gerçek zamanlı izleyin.'], ['message', 'Gerçek insan desteği', 'Hafta içi 09:00–22:00 canlı destek, uzaktan bağlantı ve eğitim videoları.']].map(([i, h, p]) => `<div class="card reveal"><div class="fi">${icon(i)}</div><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
      </div></section>

      <section class="sec"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Nasıl çalışır?</span><h2>Üç adımda hazırsınız</h2></div>
        <div class="steps3">${[['Canlı demoyu deneyin', 'Kayıt olmadan, gerçek verilerle dolu demo üzerinde tüm özellikleri keşfedin.'], ['Paketinizi seçin', 'Aylık veya yıllık (2 ay bedava) planınızı seçin, lisans anahtarınız anında oluşsun.'], ['Kullanmaya başlayın', 'Ekibinizi davet edin, verilerinizi aktarın. Kurulum desteği bizden.']].map(([h, p]) => `<div class="card reveal"><h3 class="mb">${h}</h3><p class="muted">${p}</p></div>`).join('')}</div>
      </div></section>

      <section class="sec" style="padding-top:0"><div class="mk-wrap"><div class="bundle reveal">
        <div><span class="badge" style="background:rgba(255,255,255,.18);color:#fff;border:0">%40 TASARRUF</span><h2 class="mt">Hepsi Bir Arada</h2><p style="opacity:.9;margin-top:10px">Birden fazla işiniz mi var? Tüm ${esc(S().siteName)} ürünlerini tek abonelikle kullanın. Yeni çıkan ürünler de otomatik olarak dahil.</p></div>
        <div class="center"><div class="old">${money(sum(ready, (p) => p.prices[1]))}/ay</div><div style="font-size:44px;font-weight:800;letter-spacing:-.03em">${money(BUNDLE.prices[1]).replace(',00', '')}<span style="font-size:16px;opacity:.8">/ay</span></div><button class="btn lg mt" data-bundle>${icon('cart')} Paketi sepete ekle</button></div>
      </div></div></section>

      <section class="sec" style="padding-top:0"><div class="mk-wrap">
        <div class="sec-h reveal"><span class="eyebrow">Referanslar</span><h2>İşletmeler ne diyor?</h2></div>
        <div class="tgrid">${C.testimonials.map((t) => `<div class="card tcard reveal">${stars(5)}<p>“${esc(t.text)}”</p><div class="row nw"><div class="avatar">${esc(NS.initials(t.name))}</div><div><b>${esc(t.name)}</b><div class="small faint">${esc(t.biz)} · ${esc((prod(t.product) || {}).name || '')}</div></div></div></div>`).join('')}</div>
      </div></section>

      <section class="sec" style="padding-top:0"><div class="mk-wrap" style="max-width:820px">
        <div class="sec-h reveal"><span class="eyebrow">SSS</span><h2>Sık sorulan sorular</h2></div>
        <div class="faq">${C.faq.map(([q, a]) => `<details class="reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
        <div class="card pad center mt reveal"><h2>Hâlâ karar veremediniz mi?</h2><p class="muted mt">Uzmanımız sizi arasın, işletmenize en uygun çözümü birlikte seçelim.</p><a class="btn primary lg mt" href="#/iletisim">${icon('phone')} Beni arayın</a></div>
      </div></section>`;
    on(el, 'click', '[data-c]', (e, t) => { $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x === t)); $('#hp', el).innerHTML = ps.filter((p) => !t.dataset.c || p.cat === t.dataset.c).map(pcard).join(''); $$('#hp .reveal', el).forEach((x) => x.classList.add('in')); });
    on(el, 'click', '[data-bundle]', () => { addCart('bundle', 1, 'aylik'); location.hash = '#/sepet'; });
    reveal(el);
  }

  // ---------- Ürün listesi ----------
  function catalogPage(el, cat) {
    let q = '', c = cat || '', sort = 'pop';
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap">
      <div class="page-h"><div class="grow"><h1>Tüm ürünler</h1><p>${products().length} sektörel yazılım · her biri için ücretsiz canlı demo</p></div>
        ${NS.searchBox('q', 'Ürün veya sektör ara... (ör. kuaför)')}<select class="input" id="so" style="max-width:180px"><option value="pop">En popüler</option><option value="rate">En yüksek puan</option><option value="price">En uygun fiyat</option><option value="new">Önce canlı olanlar</option></select></div>
      <div class="chips" style="justify-content:flex-start"><button class="chip ${!c ? 'active' : ''}" data-c="">Tümü</button>${C.categories.map((x) => `<button class="chip ${c === x.id ? 'active' : ''}" data-c="${x.id}">${icon(x.icon)} ${esc(x.name)}</button>`).join('')}</div>
      <div class="pgrid" id="pg"></div></div></section>`;
    const draw = () => {
      let list = products().filter((p) => (!c || p.cat === c) && NS.match(q, p.name, p.tagline, p.desc, ...(p.sectors || [])));
      list.sort(sort === 'rate' ? (a, b) => b.rating - a.rating : sort === 'price' ? (a, b) => a.prices[0] - b.prices[0] : sort === 'new' ? (a, b) => b.ready - a.ready : (a, b) => b.users - a.users);
      $('#pg', el).innerHTML = list.map(pcard).join('') || `<div class="empty">${icon('search')}<div>Sonuç bulunamadı. <a href="#/iletisim">Bize yazın</a>, ihtiyacınız olan yazılımı birlikte planlayalım.</div></div>`;
      $$('.reveal', el).forEach((x) => x.classList.add('in'));
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#so', el).onchange = (e) => { sort = e.target.value; draw(); };
    on(el, 'click', '[data-c]', (e, t) => { c = t.dataset.c; $$('[data-c]', el).forEach((x) => x.classList.toggle('active', x === t)); draw(); });
    draw();
  }
  function sectorsPage(el) {
    const all = {};
    products().forEach((p) => (p.sectors || []).forEach((s) => { (all[s] = all[s] || []).push(p); }));
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Sektörler</span><h2>${Object.keys(all).length}+ sektör için hazır çözüm</h2><p>İşletmenizi bulun, size uygun ürünleri görün.</p></div>
      <div class="grid g-auto">${Object.entries(all).sort((a, b) => a[0].localeCompare(b[0], 'tr')).map(([s, ps]) => `<div class="card pad"><b>${esc(s)}</b><div class="row mt gap-s">${ps.map((p) => `<a class="badge" style="color:${p.accent}" href="#/urun/${p.id}">${icon(p.icon)} ${esc(p.name)}</a>`).join('')}</div></div>`).join('')}</div></div></section>`;
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
          <div class="row mb">${stars(p.rating)} <b>${p.rating}</b> <span class="muted">${num(p.reviews)} değerlendirme</span> · <span class="muted">${icon('users')} ${num(p.users)}+ işletme</span></div>
          <div class="row">${p.ready ? `<a class="btn primary lg" href="${demo}" target="_blank">${icon('play')} Canlı demoyu aç</a><button class="btn lg" data-buy="1">${icon('cart')} Satın al</button>` : `<button class="btn primary lg" data-notify>${icon('bell')} Çıkınca haber ver</button><span class="badge warn">Geliştirme aşamasında</span>`}</div>
          ${(p.extraDemos || []).map((d) => `<a class="btn ghost mt" href="${d.url}" target="_blank">${icon('eye')} ${esc(d.label)}</a>`).join('')}
        </div>
        <div class="card pad"><h3 class="mb">Bu ürün kimler için?</h3><div class="row gap-s">${(p.sectors || []).map((s) => badge(s, 'acc')).join('')}</div><hr><h3 class="mb">Modüller</h3><div class="row gap-s">${p.modules.map((m) => `<span class="badge">${icon('check')} ${esc(m)}</span>`).join('')}</div></div></div>
      </div></section>
      ${p.ready ? `<section class="sec" style="padding-top:10px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Canlı önizleme</span><h2>Hemen burada deneyin</h2><p>Aşağıdaki pencere gerçek uygulamadır — tıklayın, satış yapın, rapor alın. Veriler yalnızca sizin tarayıcınızda tutulur.</p></div>
        <div class="browser"><div class="mock-bar"><i></i><i></i><i></i><span>app.nebsoft.com.tr/${p.id}</span><a class="btn sm ghost" href="${demo}" target="_blank">${icon('right')} Tam ekran</a></div><iframe src="${demo}" loading="lazy" title="${esc(p.name)} demo"></iframe></div></div></section>` : ''}
      <section class="sec" style="padding-top:10px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Özellikler</span><h2>${esc(p.name)} ile neler yapabilirsiniz?</h2></div>
        <div class="card pad"><div class="fl">${p.features.map((f) => `<div>${icon('check')}<span>${esc(f)}</span></div>`).join('')}</div></div></div></section>
      <section class="sec" style="padding-top:10px" id="fiyat"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Fiyatlandırma</span><h2>Size uygun paketi seçin</h2><p>Fiyatlara KDV dahil değildir. Yıllık ödemede 2 ay bedava.</p><div class="seg mt"><button data-per="aylik" class="active">Aylık</button><button data-per="yillik">Yıllık (2 ay bedava)</button></div></div>
        <div class="plans" id="plans"></div></div></section>
      <section class="sec" style="padding-top:10px"><div class="mk-wrap" style="max-width:820px"><div class="sec-h"><h2>Sık sorulanlar</h2></div><div class="faq">${[...(p.faq || []), ...C.faq.slice(0, 3)].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
      <section class="sec" style="padding-top:10px"><div class="mk-wrap"><h2 class="mb">Bunlar da ilginizi çekebilir</h2><div class="pgrid">${related.map(pcard).join('')}</div></div></section>`;
    const drawPlans = () => {
      $('#plans', el).innerHTML = C.plans.map((pl, i) => {
        const feats = i === 0 ? p.features.slice(0, 5) : i === 1 ? p.features.slice(0, 9) : p.features;
        return `<div class="plan ${pl.popular ? 'pop' : ''}">${pl.popular ? '<span class="badge acc" style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--brand);color:#fff">En çok tercih edilen</span>' : ''}
          <div><h3>${esc(pl.name)}</h3><div class="small muted">${esc(pl.desc)}</div></div>
          <div><span class="pp">${money(price(p, i, period)).replace(',00', '')}</span><span class="muted">/${period === 'yillik' ? 'yıl' : 'ay'}</span>${period === 'yillik' ? `<div class="small" style="color:var(--ok)">${money(p.prices[i] * 2)} tasarruf</div>` : ''}</div>
          <ul><li>${icon('users')} ${esc(pl.users)}</li>${i === 2 ? `<li>${icon('check')} Çoklu şube yönetimi</li><li>${icon('check')} API erişimi ve entegrasyonlar</li><li>${icon('check')} Öncelikli destek & kurulum</li>` : ''}${feats.map((f) => `<li>${icon('check')} ${esc(f)}</li>`).join('')}</ul>
          ${p.ready ? `<button class="btn ${pl.popular ? 'primary' : ''} lg block" data-plan="${i}">${icon('cart')} Sepete ekle</button>` : `<button class="btn lg block" data-notify>Haber ver</button>`}</div>`;
      }).join('');
    };
    on(el, 'click', '[data-per]', (e, t) => { period = t.dataset.per; $$('[data-per]', el).forEach((x) => x.classList.toggle('active', x === t)); drawPlans(); });
    on(el, 'click', '[data-plan]', (e, t) => { addCart(p.id, Number(t.dataset.plan), period); location.hash = '#/sepet'; });
    on(el, 'click', '[data-buy]', () => $('#fiyat', el).scrollIntoView({ behavior: 'smooth' }));
    on(el, 'click', '[data-notify]', async () => {
      const v = await formModal({ title: `${p.name} çıkınca haber verelim`, fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'biz', label: 'İşletme adı' }], submitLabel: 'Kaydet' });
      if (v) { db.insert('leads', { ...v, product: p.id, type: 'bekleme', status: 'yeni', msg: 'Ürün çıkınca haber verilsin' }); toast('Kaydınız alındı, ürün çıkınca sizi arayacağız', 'ok'); }
    });
    drawPlans();
    $$('.reveal', el).forEach((x) => x.classList.add('in'));
  }

  // ---------- Fiyatlar ----------
  function pricingPage(el) {
    const ps = products();
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><div class="sec-h"><span class="eyebrow">Fiyatlandırma</span><h2>Şeffaf fiyatlar, gizli ücret yok</h2><p>Tüm fiyatlar aylık ve KDV hariçtir. Yıllık ödemede 2 ay bedava.</p></div>
      <div class="bundle mb"><div><h2>Hepsi Bir Arada</h2><p style="opacity:.9;margin-top:8px">Tüm ürünler + gelecekte çıkacak ürünler, tek abonelik.</p></div><div class="row" style="justify-content:center">${C.plans.map((pl, i) => `<div class="center" style="padding:0 12px"><div class="small" style="opacity:.85">${pl.name}</div><div style="font-size:26px;font-weight:800">${money(BUNDLE.prices[i]).replace(',00', '')}</div><button class="btn sm mt" data-bp="${i}">Seç</button></div>`).join('')}</div></div>
      <div class="card">${table({ rows: ps, columns: [{ label: 'Ürün', render: (p) => `<a href="#/urun/${p.id}" class="row nw" style="color:inherit"><span class="avatar" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div><b>${esc(p.name)}</b> ${p.ready ? '' : badge('Yakında', 'warn')}<div class="small faint">${esc(p.tagline)}</div></div></a>` }, ...C.plans.map((pl, i) => ({ label: pl.name, cls: 'right', render: (p) => `<b>${money(p.prices[i]).replace(',00', '')}</b><span class="faint small">/ay</span>` }))], actions: [{ label: 'İncele', act: 'go' }] })}</div>
      <div class="grid g3 mt">${[['shield', '14 gün ücretsiz deneme', 'Kredi kartı gerekmez.'], ['refresh', 'İstediğiniz zaman iptal', 'Aylık planlarda taahhüt yok.'], ['users', 'Ücretsiz kurulum desteği', 'Uzmanlarımız verilerinizi aktarır.']].map(([i, h, p]) => `<div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic">${icon(i)}</div></div><div><b>${h}</b><div class="small muted">${p}</div></div></div>`).join('')}</div></div></section>`;
    on(el, 'click', '[data-act=go]', (e, t) => { location.hash = '#/urun/' + t.dataset.id; });
    on(el, 'click', '[data-bp]', (e, t) => { addCart('bundle', Number(t.dataset.bp), 'aylik'); location.hash = '#/sepet'; });
  }

  // Aynı sayfa yeniden çizilirken eski olay dinleyicilerinin birikmemesi için kapsayıcıyı yeniler
  const fresh = (el) => { if (!el.isConnected) return el; const n = el.cloneNode(false); el.replaceWith(n); return n; };

  // ---------- Sepet & Ödeme ----------
  function cartPage(el) {
    el = fresh(el);
    const t = cartTotals();
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><h1 class="mb">Sepetim</h1>${!t.lines.length ? `<div class="card pad empty">${icon('cart')}<div>Sepetiniz boş</div><a class="btn primary mt" href="#/urunler">Ürünlere göz atın</a></div>` : `
      <div class="grid g-21"><div class="card">${t.lines.map((l) => `<div class="list-item" style="padding:16px 18px"><span class="avatar lg" style="background:${l.p.accent}22;color:${l.p.accent}">${icon(l.p.icon)}</span>
          <div class="grow"><b>${esc(l.p.name)}</b><div class="row mt gap-s"><select class="input" style="max-width:150px;height:32px" data-pl="${l.id}">${C.plans.map((pl, i) => `<option value="${i}" ${i === l.plan ? 'selected' : ''}>${pl.name}</option>`).join('')}</select>
          <select class="input" style="max-width:170px;height:32px" data-pe="${l.id}"><option value="aylik" ${l.period === 'aylik' ? 'selected' : ''}>Aylık</option><option value="yillik" ${l.period === 'yillik' ? 'selected' : ''}>Yıllık (2 ay bedava)</option></select>
          <label class="small muted row nw">Şube <input class="input" type="number" min="1" value="${l.qty || 1}" data-qt="${l.id}" style="width:64px;height:32px"></label></div></div>
          <div class="right"><b style="font-size:17px">${money(l.line)}</b><div class="small faint">${l.period === 'yillik' ? 'yıllık' : 'aylık'}</div></div><button class="btn ghost icon" data-rm="${l.id}">${icon('trash')}</button></div>`).join('')}</div>
        <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">Özet</h3>
          <div class="list-item"><span class="grow muted">Ara toplam</span><b>${money(t.subtotal)}</b></div>
          ${t.discount ? `<div class="list-item" style="color:var(--ok)"><span class="grow">Kupon ${esc(t.coupon.code)} (%${t.coupon.pct})</span><b>-${money(t.discount)}</b></div>` : ''}
          <div class="list-item"><span class="grow muted">KDV (%${VAT})</span><b>${money(t.vat)}</b></div>
          <div class="list-item"><span class="grow"><b>Toplam</b></span><b style="font-size:22px">${money(t.total)}</b></div>
          <div class="row nw mt"><input class="input" id="cp" placeholder="Kupon kodu" value="${esc(cart().coupon || '')}"><button class="btn" id="cpb">Uygula</button></div>
          <a class="btn primary lg block mt" href="#/odeme">${icon('lock')} Ödemeye geç</a>
          <p class="small faint center mt">${icon('shield')} 14 gün koşulsuz iade garantisi</p></div>
          <div class="card pad small muted">${icon('info')} Demo kuponu: <b>NEBSOFT20</b></div></div></div>`}</div></section>`;
    const upd = (id, f) => { const it = cart().items.find((i) => i.id === id); f(it); db.save(); drawNav(); cartPage(el); };
    on(el, 'change', '[data-pl]', (e, x) => upd(x.dataset.pl, (i) => { i.plan = Number(x.value); }));
    on(el, 'change', '[data-pe]', (e, x) => upd(x.dataset.pe, (i) => { i.period = x.value; }));
    on(el, 'change', '[data-qt]', (e, x) => upd(x.dataset.qt, (i) => { i.qty = Math.max(1, Number(x.value) || 1); }));
    on(el, 'click', '[data-rm]', (e, x) => { cart().items = cart().items.filter((i) => i.id !== x.dataset.rm); db.save(); drawNav(); cartPage(el); });
    if ($('#cpb', el)) $('#cpb', el).onclick = () => { const code = $('#cp', el).value.trim().toUpperCase(); const k = db.find('coupons', (x) => x.code === code && x.active); if (code && !k) return toast('Geçersiz kupon', 'err'); cart().coupon = k ? code : null; db.save(); toast(k ? 'Kupon uygulandı' : 'Kupon kaldırıldı', 'ok'); cartPage(el); };
  }
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
        <label class="opt card pad row nw mb" style="cursor:pointer"><input type="radio" name="pay" value="kart" checked> <div class="grow"><b>${icon('card')} Kredi / banka kartı</b><div class="small muted">iyzico / PayTR güvenli ödeme sayfasına yönlendirilirsiniz. Kart bilgileriniz bizde saklanmaz. Taksit seçenekleri mevcuttur.</div></div></label>
        <label class="opt card pad row nw" style="cursor:pointer"><input type="radio" name="pay" value="havale"> <div class="grow"><b>${icon('building')} Havale / EFT</b><div class="small muted">${esc(S().bank)} · ${esc(S().iban)} — ödemeniz onaylanınca lisansınız aktifleşir.</div></div></label>
        <label class="check small mt"><input type="checkbox" id="agree"> <span><a href="#/yasal/sozlesme" target="_blank">Mesafeli satış sözleşmesini</a> ve <a href="#/yasal/kvkk" target="_blank">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label></div></div>
      <div><div class="card pad" style="position:sticky;top:86px"><h3 class="mb">Sipariş özeti</h3>${t.lines.map((l) => `<div class="list-item small"><span class="grow"><b>${esc(l.p.name)}</b><div class="faint">${planName(l.plan)} · ${l.period === 'yillik' ? 'Yıllık' : 'Aylık'}${l.qty > 1 ? ` · ${l.qty} şube` : ''}</div></span><b>${money(l.line)}</b></div>`).join('')}
        ${t.discount ? `<div class="list-item small" style="color:var(--ok)"><span class="grow">İndirim</span><b>-${money(t.discount)}</b></div>` : ''}<div class="list-item small"><span class="grow muted">KDV</span><b>${money(t.vat)}</b></div><div class="list-item"><span class="grow"><b>Ödenecek</b></span><b style="font-size:22px">${money(t.total)}</b></div>
        <button class="btn primary lg block mt" id="pay">${icon('lock')} Siparişi tamamla</button><p class="small faint center mt">Demo modunda gerçek tahsilat yapılmaz.</p></div></div>
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
      ${o.status === 'odendi' ? `<p class="mt">Lisanslarınız aktif. Bilgiler <b>${esc(custOf(o.customer).email)}</b> adresine gönderildi.</p>` : `<div class="card pad mt" style="background:var(--warn-soft);border:0;text-align:left"><b>Havale bilgileri</b><div class="small mt">${esc(S().bank)} · IBAN: <span class="mono">${esc(S().iban)}</span><br>Açıklama: <b>${esc(o.no)}</b><br>Ödemeniz onaylandığında lisansınız otomatik aktifleşir.</div></div>`}</div>
      ${lic.length ? `<h2 class="mt mb">Lisanslarınız</h2>${lic.map((l) => { const p = prod(l.pid); return `<div class="card pad row mb"><span class="avatar lg" style="background:${p.accent}22;color:${p.accent}">${icon(p.icon)}</span><div class="grow"><b>${esc(p.name)}</b> ${badge(planName(l.plan), 'acc')}<div class="lic mt">${esc(l.key)}</div></div><a class="btn primary" href="apps/${l.pid}/index.html" target="_blank">${icon('play')} Uygulamayı aç</a></div>`; }).join('')}` : ''}
      <div class="row mt" style="justify-content:center"><a class="btn" href="#/hesabim">${icon('user')} Hesabıma git</a><button class="btn" id="inv">${icon('print')} Faturayı yazdır</button></div></div></section>`;
    $('#inv', el).onclick = () => printInvoice(o);
  }
  function printInvoice(o) {
    const c = custOf(o.customer), b = o.billing || c, s = S();
    NS.printHtml(`<div class="doc"><table><tr><td><h2>${esc(s.siteName)} Yazılım A.Ş.</h2><div>${esc(s.address)}</div><div>${esc(s.phone)} · ${esc(s.email)}</div></td><td style="text-align:right"><h2>FATURA</h2><div>No: ${esc(o.no)}</div><div>Tarih: ${NS.date(o.at)}</div></td></tr></table><hr>
      <b>Sayın</b><div>${esc(b.company || '')}</div><div>${esc(b.name || c.name)}</div><div>${esc(b.address || '')}</div><div>VKN/TCKN: ${esc(b.taxNo || '-')} ${b.taxOffice ? '· ' + esc(b.taxOffice) : ''}</div><br>
      <table><tr><th>Ürün</th><th>Paket</th><th>Dönem</th><th style="text-align:right">Tutar</th></tr>${o.items.map((i) => `<tr><td>${esc(prod(i.pid).name)}${i.qty > 1 ? ` (${i.qty} şube)` : ''}</td><td>${planName(i.plan)}</td><td>${i.period === 'yillik' ? 'Yıllık' : 'Aylık'}</td><td style="text-align:right">${money(i.price)}</td></tr>`).join('')}
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
    else if (tab === 'destek') tb.innerHTML = `<div class="row mb"><span class="grow muted">Destek ekibimiz ortalama 15 dakikada yanıt verir.</span><button class="btn primary" id="nt">${icon('plus')} Yeni destek talebi</button></div>${tickets.map((t) => ticketCard(t, 'musteri')).join('') || '<div class="card pad empty">Destek talebiniz yok</div>'}`;
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
  function loginPage(el) {
    el = fresh(el);
    el.innerHTML = `<section class="sec"><div class="mk-wrap" style="max-width:440px"><div class="card pad"><h1 class="mb">Giriş yap</h1><p class="muted mb">Lisanslarınızı, faturalarınızı ve destek taleplerinizi yönetin.</p>
      <form class="col" id="lf" onsubmit="return false"><div class="field"><label>E-posta</label><input class="input lg" name="email" type="email" required></div><div class="field"><label>Şifre</label><input class="input lg" name="pass" type="password" required></div>
      <label class="check small"><input type="checkbox" name="remember" checked> Beni hatırla</label><button class="btn primary lg block" id="lb">Giriş yap</button></form>
      <hr><p class="small muted center">Hesabınız yok mu? İlk siparişinizde otomatik oluşturulur. <a href="#/urunler">Ürünlere göz atın</a></p></div></div></section>`;
    const go = async () => {
      if (!NS.validate($('#lf', el))) return;
      const v = NS.readForm($('#lf', el));
      const c = db.find('customers', (x) => x.email.toLowerCase() === v.email.toLowerCase());
      if (!c || !c.pass || c.pass !== (await hash(v.pass))) return toast('E-posta veya şifre hatalı', 'err');
      ss.set(SKEY, c.id, v.remember); drawNav(); accountPage(el);
    };
    $('#lb', el).onclick = go;
  }

  // ---------- İletişim ----------
  function contactPage(el) {
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap"><div class="grid g2" style="align-items:start">
      <div><span class="eyebrow small" style="color:var(--brand);font-weight:700;letter-spacing:.08em">İLETİŞİM</span><h1 class="mt" style="font-size:38px">Size nasıl yardımcı olabiliriz?</h1><p class="muted mt" style="font-size:16px">Ücretsiz demo, kurumsal teklif veya özel yazılım ihtiyacınız için formu doldurun; uzmanımız aynı gün içinde sizi arasın.</p>
        <div class="col mt"><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic">${icon('phone')}</div></div><div><b>${esc(S().phone)}</b><div class="small muted">Hafta içi 09:00–22:00</div></div></div><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic info">${icon('mail')}</div></div><div><b>${esc(S().email)}</b><div class="small muted">Ortalama yanıt: 15 dk</div></div></div><div class="card pad row nw"><div class="kpi" style="padding:0"><div class="ic ok">${icon('map')}</div></div><div><b>Merkez ofis</b><div class="small muted">${esc(S().address)}</div></div></div></div></div>
      <div class="card pad" id="cf"><h2 class="mb">Bize yazın</h2>${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true, type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'biz', label: 'İşletme adı' }, { name: 'type', label: 'Konu', type: 'select', options: [{ value: 'demo', label: 'Ücretsiz demo / kurulum' }, { value: 'teklif', label: 'Kurumsal teklif' }, { value: 'ozel', label: 'Özel yazılım talebi' }, { value: 'bayi', label: 'Bayilik başvurusu' }, { value: 'iletisim', label: 'Diğer' }] }, { name: 'product', label: 'İlgilendiğiniz ürün', type: 'select', empty: 'Seçiniz', options: products().map((p) => ({ value: p.id, label: p.name })) }, { name: 'msg', label: 'Mesajınız', type: 'textarea', full: true }])}
        <label class="check small mt"><input type="checkbox" id="kv"> KVKK aydınlatma metnini okudum, iletişim izni veriyorum.</label><button class="btn primary lg block mt" id="send">${icon('send')} Gönder</button></div></div></div></section>`;
    $('#send', el).onclick = () => {
      if (!NS.validate($('#cf', el))) return;
      if (!$('#kv', el).checked) return toast('KVKK onayı gerekli', 'err');
      db.insert('leads', { ...NS.readForm($('#cf', el)), status: 'yeni' });
      $('#cf', el).innerHTML = `<div class="center" style="padding:40px 0"><div class="kpi" style="justify-content:center"><div class="ic ok">${icon('check', 'ico-lg')}</div></div><h2 class="mt">Mesajınız alındı</h2><p class="muted mt">En kısa sürede sizinle iletişime geçeceğiz.</p></div>`;
    };
  }
  function legalPage(el, which) {
    const T = { kvkk: 'KVKK Aydınlatma Metni', sozlesme: 'Mesafeli Satış Sözleşmesi', iade: 'İptal ve İade Koşulları', gizlilik: 'Gizlilik Politikası' };
    const s = S();
    const body = {
      kvkk: `<p>${esc(s.siteName)} Yazılım ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlarla işlemekteyiz.</p><h3 class="mt">İşlenen veriler</h3><p>Kimlik, iletişim, fatura ve işlem güvenliği verileri.</p><h3 class="mt">Amaçlar</h3><p>Sözleşmenin kurulması ve ifası, faturalandırma, destek hizmetleri, yasal yükümlülüklerin yerine getirilmesi.</p><h3 class="mt">Haklarınız</h3><p>KVKK m.11 kapsamındaki taleplerinizi ${esc(s.email)} adresine iletebilirsiniz.</p>`,
      sozlesme: `<p>İşbu sözleşme, ${esc(s.siteName)} Yazılım ile web sitesi üzerinden abonelik satın alan alıcı arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca düzenlenmiştir.</p><h3 class="mt">Konu</h3><p>Alıcının elektronik ortamda siparişini verdiği yazılım aboneliğinin satışı ve ifasıdır.</p><h3 class="mt">İfa</h3><p>Lisans anahtarı ödeme onayının ardından elektronik ortamda derhal teslim edilir.</p>`,
      iade: `<p>Yeni aboneliklerde ilk 14 gün içinde koşulsuz iade hakkınız vardır. Aylık aboneliklerinizi dilediğiniz zaman iptal edebilirsiniz; iptal, mevcut dönemin sonunda geçerli olur. Yıllık aboneliklerde kalan aylar için kısmi iade yapılır.</p>`,
      gizlilik: `<p>Uygulamalara girdiğiniz işletme verileri yalnızca size aittir; üçüncü kişilerle paylaşılmaz, reklam amacıyla kullanılmaz. Veriler Türkiye'deki veri merkezlerinde şifreli saklanır ve günlük yedeklenir.</p>`,
    };
    el.innerHTML = `<section class="sec" style="padding-top:40px"><div class="mk-wrap" style="max-width:820px"><div class="card pad"><h1 class="mb">${T[which] || 'Yasal'}</h1>${body[which] || ''}<p class="small faint mt">Son güncelleme: ${NS.date(new Date())} — Bu metin örnek şablondur; yayına almadan önce hukuk danışmanınıza kontrol ettiriniz.</p></div></div></section>`;
  }

  // ---------- Yönetim paneli ----------
  function adminPage(el, sub) {
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
    el.innerHTML = `<section style="padding:24px 0 40px"><div class="mk-wrap" style="max-width:1320px"><div class="row mb"><h1 class="grow">${icon('shield')} Yönetim Paneli</h1><a class="btn primary" href="admin/index.html" target="_blank">${icon('shield')} Yönetim Merkezi (lisans · işletme · log)</a><button class="btn" id="alo">${icon('logout')} Çıkış</button></div>
      <div class="grid" style="grid-template-columns:220px minmax(0,1fr);align-items:start"><nav class="card ns-nav" style="padding:8px;position:sticky;top:86px">${nav.map(([k, l, i]) => `<a href="#/yonetim/${k}" class="${k === sub ? 'active' : ''}">${icon(i)}<span>${l}</span>${cnt[k] ? `<span class="badge warn" style="margin-left:auto">${cnt[k]}</span>` : ''}</a>`).join('')}</nav><div id="ab"></div></div></div></section>`;
    $('#alo', el).onclick = () => { try { sessionStorage.removeItem(AKEY); } catch (e) { /* yok */ } location.hash = '#/'; };
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
      const byProd = {}; orders.forEach((o) => o.items.forEach((i) => { const n = prod(i.pid).name; byProd[n] = (byProd[n] || 0) + i.price; }));
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

  // ---------- Yönlendirme ----------
  const ROUTES = { '': home, urunler: catalogPage, urun: productPage, fiyatlar: pricingPage, sektorler: sectorsPage, sepet: cartPage, odeme: checkoutPage, basarili: successPage, hesabim: accountPage, iletisim: contactPage, yasal: legalPage, yonetim: adminPage };
  const TITLES = { urunler: 'Ürünler', fiyatlar: 'Fiyatlar', sektorler: 'Sektörler', sepet: 'Sepet', odeme: 'Ödeme', hesabim: 'Hesabım', iletisim: 'İletişim', yonetim: 'Yönetim' };
  function route() {
    const [, r = '', p] = location.hash.match(/^#\/?([^/]*)\/?(.*)$/) || [];
    const fn = ROUTES[r] || home;
    const page = $('#page');
    const fresh = page.cloneNode(false); page.replaceWith(fresh);
    fn(fresh, p ? decodeURIComponent(p) : null);
    $$('[data-l]').forEach((a) => a.classList.toggle('active', a.dataset.l === r));
    const pr = r === 'urun' && prod(p);
    document.title = pr ? `${pr.name} · ${S().siteName}` : `${TITLES[r] ? TITLES[r] + ' · ' : ''}${S().siteName} — İşletme Yazılımları Pazarı`;
    window.scrollTo(0, 0);
  }
  frame();
  window.addEventListener('hashchange', route);
  window.addEventListener('storage', (e) => { if (e.key === db.key) { db.load(); drawNav(); } });
  route();
})();
