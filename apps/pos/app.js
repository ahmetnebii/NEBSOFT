/* NEBSOFT Market POS — barkodlu satış, stok, alış, cari, kasa ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, iso, today, addDays } = NS;

  // ---------- Örnek veri ----------
  const CATS = [
    { name: 'Süt & Kahvaltılık', color: '#0ea5e9' }, { name: 'Fırın', color: '#f59e0b' }, { name: 'Meyve & Sebze', color: '#16a34a' },
    { name: 'İçecek', color: '#6366f1' }, { name: 'Atıştırmalık', color: '#ec4899' }, { name: 'Temel Gıda', color: '#a16207' },
    { name: 'Et & Tavuk', color: '#dc2626' }, { name: 'Temizlik', color: '#14b8a6' }, { name: 'Kişisel Bakım', color: '#a855f7' }, { name: 'Sigara & Diğer', color: '#64748b' },
  ];
  const PRODUCTS = [
    ['Süt & Kahvaltılık', 'Tam Yağlı Süt 1L', 32, 44.9], ['Süt & Kahvaltılık', 'Yoğurt 1kg', 48, 64.9], ['Süt & Kahvaltılık', 'Beyaz Peynir 500g', 115, 159.9], ['Süt & Kahvaltılık', 'Kaşar Peyniri 400g', 135, 189.9],
    ['Süt & Kahvaltılık', 'Yumurta 15li', 72, 99.9], ['Süt & Kahvaltılık', 'Tereyağı 250g', 98, 134.9], ['Süt & Kahvaltılık', 'Siyah Zeytin 500g', 88, 124.9], ['Süt & Kahvaltılık', 'Ayran 1L', 22, 32.5],
    ['Fırın', 'Ekmek 250g', 9, 15, 'fav'], ['Fırın', 'Simit', 8, 15], ['Fırın', 'Tam Buğday Ekmek', 18, 27.5], ['Fırın', 'Poğaça', 9, 17.5],
    ['Meyve & Sebze', 'Domates', 22, 34.9, 'kg', '00101'], ['Meyve & Sebze', 'Salatalık', 18, 29.9, 'kg', '00102'], ['Meyve & Sebze', 'Elma Starking', 24, 39.9, 'kg', '00103'], ['Meyve & Sebze', 'Muz İthal', 52, 79.9, 'kg', '00104'],
    ['Meyve & Sebze', 'Patates', 12, 21.9, 'kg', '00105'], ['Meyve & Sebze', 'Soğan', 10, 17.9, 'kg', '00106'], ['Meyve & Sebze', 'Limon', 30, 49.9, 'kg', '00107'],
    ['İçecek', 'Kola 1L', 26, 39.9], ['İçecek', 'Maden Suyu 6lı', 28, 42.5], ['İçecek', 'Su 5L', 18, 29.9], ['İçecek', 'Meyve Suyu 1L', 34, 52.9], ['İçecek', 'Çay 1kg', 210, 289.9], ['İçecek', 'Türk Kahvesi 100g', 58, 84.9], ['İçecek', 'Enerji İçeceği', 34, 54.9],
    ['Atıştırmalık', 'Çikolata Sütlü 80g', 22, 34.9], ['Atıştırmalık', 'Cips Büyük Boy', 36, 54.9], ['Atıştırmalık', 'Bisküvi', 12, 19.9], ['Atıştırmalık', 'Kuruyemiş Karışık 200g', 78, 114.9], ['Atıştırmalık', 'Gofret', 7, 12.5], ['Atıştırmalık', 'Sakız', 9, 15],
    ['Temel Gıda', 'Ayçiçek Yağı 5L', 290, 389.9], ['Temel Gıda', 'Pirinç Baldo 1kg', 62, 89.9], ['Temel Gıda', 'Makarna 500g', 14, 22.5], ['Temel Gıda', 'Un 5kg', 110, 154.9], ['Temel Gıda', 'Toz Şeker 1kg', 34, 47.9],
    ['Temel Gıda', 'Kırmızı Mercimek 1kg', 52, 74.9], ['Temel Gıda', 'Domates Salçası 830g', 62, 89.9], ['Temel Gıda', 'Bulgur 1kg', 32, 46.9],
    ['Et & Tavuk', 'Tavuk Göğüs', 160, 229.9, 'kg', '00201'], ['Et & Tavuk', 'Dana Kıyma', 520, 699.9, 'kg', '00202'], ['Et & Tavuk', 'Sucuk 250g', 145, 199.9], ['Et & Tavuk', 'Tavuk Baget', 110, 159.9, 'kg', '00203'],
    ['Temizlik', 'Bulaşık Deterjanı 1L', 48, 72.9], ['Temizlik', 'Çamaşır Deterjanı 4kg', 240, 339.9], ['Temizlik', 'Tuvalet Kağıdı 16lı', 160, 229.9], ['Temizlik', 'Kağıt Havlu 6lı', 98, 139.9], ['Temizlik', 'Çamaşır Suyu 3L', 46, 69.9],
    ['Kişisel Bakım', 'Şampuan 500ml', 82, 119.9], ['Kişisel Bakım', 'Diş Macunu', 44, 64.9], ['Kişisel Bakım', 'Duş Jeli', 64, 94.9], ['Kişisel Bakım', 'Islak Mendil', 22, 34.9], ['Kişisel Bakım', 'Deodorant', 78, 114.9],
    ['Sigara & Diğer', 'Çakmak', 8, 15], ['Sigara & Diğer', 'Pil AA 4lü', 48, 74.9], ['Sigara & Diğer', 'Poşet', 0.2, 0.5],
  ];

  function seed(db) {
    db.data._settings = { bizName: 'Yıldız Market', bizPhone: '0212 555 10 20', bizAddress: 'Atatürk Cad. No:12 Kadıköy/İstanbul', taxNo: '1234567890', taxOffice: 'Kadıköy', receiptFooter: 'Bizi tercih ettiğiniz için teşekkürler!', weighPrefix: '27', pointsRate: 1, autoPrint: false, allowNegative: true };
    db.data.users = [
      { id: 'u1', name: 'Ahmet Yönetici', role: 'admin', pin: '1234', active: true },
      { id: 'u2', name: 'Zeynep Kasiyer', role: 'kasiyer', pin: '1234', active: true },
      { id: 'u3', name: 'Murat Depo', role: 'depo', pin: '1234', active: true },
    ];
    db.data.cats = CATS.map((c, i) => ({ id: 'c' + i, ...c }));
    const catId = (n) => db.data.cats.find((c) => c.name === n).id;
    let bc = 8690000100000;
    db.data.products = PRODUCTS.map((p, i) => {
      const [cat, name, buy, price, x, plu] = p;
      const kg = x === 'kg';
      return { id: 'p' + i, barcode: kg ? '' : String(bc + i * 7 + 3), plu: plu || '', name, cat: catId(cat), buy, price, vat: cat === 'Temizlik' || cat === 'Kişisel Bakım' || cat === 'Sigara & Diğer' ? 20 : 1, stock: kg ? rand(20, 80) : rand(4, 120), min: kg ? 10 : 10, unit: kg ? 'kg' : 'adet', fav: x === 'fav' || i % 5 === 0, created: new Date().toISOString() };
    });
    db.data.products.find((p) => p.name === 'Kaşar Peyniri 400g').stock = 3;
    db.data.products.find((p) => p.name === 'Tereyağı 250g').stock = 6;
    db.data.customers = NS.NAMES.slice(0, 14).map((n, i) => ({ id: 'm' + i, name: n, phone: NS.phone(), balance: i < 5 ? rand(80, 1600) : 0, limit: 3000, points: rand(0, 900), card: String(5000 + i), created: new Date().toISOString() }));
    db.data.suppliers = [
      { id: 's1', name: 'Anadolu Gıda Dağıtım', phone: '0216 444 12 12', contact: 'Kemal Bey', balance: 18450 },
      { id: 's2', name: 'Marmara Süt Ürünleri', phone: '0262 333 45 67', contact: 'Selin Hanım', balance: 6200 },
      { id: 's3', name: 'Temiz Kimya Ltd.', phone: '0232 222 11 00', contact: 'Burak Bey', balance: 0 },
      { id: 's4', name: 'Hal Meyve Sebze', phone: '0533 111 22 33', contact: 'Hasan Usta', balance: 2350 },
    ];
    db.data.campaigns = [
      { id: 'k1', name: 'Simit 3 Al 2 Öde', type: 'xy', pid: db.data.products.find((p) => p.name === 'Simit').id, x: 3, y: 2, active: true },
      { id: 'k2', name: 'Temizlikte %10 İndirim', type: 'pct', cat: catId('Temizlik'), pct: 10, active: true },
      { id: 'k3', name: 'HOSGELDIN Kuponu', type: 'coupon', code: 'HOSGELDIN', pct: 5, active: true },
    ];
    // Son 30 günün satışları
    const sales = [], moves = [];
    let no = 1000;
    for (let d = 29; d >= 0; d--) {
      const n = rand(14, 34) + (d % 7 === 1 || d % 7 === 2 ? 10 : 0);
      for (let k = 0; k < n; k++) {
        const at = addDays(new Date(), -d); at.setHours(rand(8, 21), rand(0, 59), rand(0, 59));
        if (at > new Date()) continue;
        const items = [];
        const cnt = rand(1, 6);
        for (let j = 0; j < cnt; j++) {
          const p = pick(db.data.products);
          const qty = p.unit === 'kg' ? Math.round(rand(3, 25)) / 10 : rand(1, 3);
          items.push({ pid: p.id, name: p.name, qty, price: p.price, disc: 0, vat: p.vat, buy: p.buy, unit: p.unit });
        }
        const total = Math.round(sum(items, (i) => i.qty * i.price) * 100) / 100;
        const type = Math.random() < 0.55 ? 'kart' : Math.random() < 0.9 ? 'nakit' : 'veresiye';
        const cust = type === 'veresiye' || Math.random() < 0.2 ? pick(db.data.customers).id : null;
        sales.push({ id: 'x' + no, no: 'F' + ++no, at: at.toISOString(), type: 'sale', items, subtotal: total, discount: 0, total, payments: [{ type: type === 'veresiye' && !cust ? 'nakit' : type, amount: total }], customer: cust, user: pick(['u1', 'u2', 'u2']), campDiscs: [] });
      }
    }
    sales.sort((a, b) => a.at.localeCompare(b.at));
    db.data.sales = sales;
    db.data._meta._seq_sales = no;
    db.data.moves = moves;
    db.data.purchases = [
      { id: 'a1', no: 'AF1001', at: addDays(new Date(), -6).toISOString(), supplier: 's1', invoiceNo: 'ANG2026-4412', items: [{ pid: 'p32', name: 'Ayçiçek Yağı 5L', qty: 20, cost: 290 }, { pid: 'p33', name: 'Pirinç Baldo 1kg', qty: 40, cost: 62 }], total: 8280, paid: 0 },
      { id: 'a2', no: 'AF1002', at: addDays(new Date(), -3).toISOString(), supplier: 's2', invoiceNo: 'MS-88120', items: [{ pid: 'p0', name: 'Tam Yağlı Süt 1L', qty: 120, cost: 32 }, { pid: 'p1', name: 'Yoğurt 1kg', qty: 40, cost: 48 }], total: 5760, paid: 3000 },
    ];
    db.data._meta._seq_purchases = 1002;
    db.data.cash = [];
    db.data.shifts = [{ id: 'sh1', open: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(), openCash: 1500, user: 'u2', close: null }];
    db.data.held = [];
    db.data.counts = [];
  }

  const db = new NS.DB('pos', seed);
  const QH = window.QCHUB; QH.ensure(db);
  const S = () => db.settings({ weighPrefix: '27', pointsRate: 1, autoPrint: false, allowNegative: true, receiptFooter: '' });
  const P = (id) => db.get('products', id);
  const cat = (id) => db.get('cats', id) || { name: '-', color: '#64748b' };
  const custName = (id) => (db.get('customers', id) || {}).name || '-';
  const userName = (id) => (db.get('users', id) || {}).name || '-';
  const PAY = { nakit: 'Nakit', kart: 'Kredi Kartı', veresiye: 'Veresiye', havale: 'Havale/EFT', yemek: 'Yemek Kartı', online: 'Online kanal' };
  const qtyFmt = (q, u) => (u === 'kg' ? num(q) + ' kg' : num(q));
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- Sepet ----------
  let cart = db.data._cart || newCart();
  function newCart() { return { lines: [], customer: null, coupon: null, manual: 0, mode: 'sale', note: '' }; }
  function saveCart() { db.data._cart = cart; db.save(); }
  let selLine = -1;
  let catFilter = 'fav';

  function calc(c = cart) {
    const lines = c.lines.map((l) => { const gross = l.price * l.qty; const ld = gross * (l.disc || 0) / 100; return { ...l, gross, lineDisc: ld, net: gross - ld }; });
    const campDiscs = [];
    db.all('campaigns', (k) => k.active).forEach((k) => {
      if (k.type === 'xy') {
        const qty = sum(lines.filter((l) => l.pid === k.pid), (l) => l.qty);
        const free = Math.floor(qty / k.x) * (k.x - k.y);
        const p = P(k.pid);
        if (free > 0 && p) campDiscs.push({ label: k.name, amount: r2(free * p.price) });
      } else if (k.type === 'pct') {
        const base = sum(lines.filter((l) => (P(l.pid) || {}).cat === k.cat), (l) => l.net);
        if (base > 0) campDiscs.push({ label: k.name, amount: r2(base * k.pct / 100) });
      }
    });
    const subtotal = sum(lines, (l) => l.net);
    let after = subtotal - sum(campDiscs, (d) => d.amount);
    if (c.coupon) {
      const k = db.find('campaigns', (x) => x.type === 'coupon' && x.active && x.code === c.coupon);
      if (k) { const a = r2(after * k.pct / 100); campDiscs.push({ label: `Kupon ${k.code} (%${k.pct})`, amount: a }); after -= a; }
    }
    if (c.manual) { campDiscs.push({ label: 'Ek indirim', amount: r2(Math.min(after, c.manual)) }); after -= Math.min(after, c.manual); }
    const total = r2(Math.max(0, after));
    const ratio = subtotal ? total / subtotal : 1;
    const vat = r2(sum(lines, (l) => (l.net * ratio) * l.vat / (100 + l.vat)));
    const lineDiscTotal = sum(lines, (l) => l.lineDisc);
    return { lines, campDiscs, subtotal: r2(sum(lines, (l) => l.gross)), discount: r2(lineDiscTotal + sum(campDiscs, (d) => d.amount)), total, vat, count: sum(lines, (l) => (l.unit === 'kg' ? 1 : l.qty)) };
  }

  function addToCart(p, qty = 1) {
    if (!p) return;
    const s = S();
    if (!s.allowNegative && cart.mode === 'sale' && p.stock - qty < 0) { toast(`${p.name}: stok yetersiz (${qtyFmt(p.stock, p.unit)})`, 'err'); NS.beep(220, 200); return; }
    const ex = p.unit !== 'kg' ? cart.lines.findIndex((l) => l.pid === p.id && !l.disc) : -1;
    if (ex >= 0) { cart.lines[ex].qty = r2(cart.lines[ex].qty + qty); selLine = ex; }
    else { cart.lines.push({ pid: p.id, name: p.name, price: p.price, qty: r2(qty), disc: 0, vat: p.vat, buy: p.buy, unit: p.unit }); selLine = cart.lines.length - 1; }
    NS.beep(1200, 50);
    saveCart();
    drawCart();
  }

  // Barkod, terazi barkodu, "3*barkod" çarpanı veya isimle arama
  function handleScan(raw) {
    raw = String(raw || '').trim();
    if (!raw) return;
    let qty = 1;
    const m = raw.match(/^(\d+(?:[.,]\d+)?)\s*[*xX]\s*(.+)$/);
    if (m) { qty = Number(m[1].replace(',', '.')); raw = m[2].trim(); }
    const prods = db.all('products');
    let p = prods.find((x) => x.barcode && x.barcode === raw);
    const s = S();
    // Terazi barkodu: önek/PLU/değer yapısı Entegrasyonlar > Terazi ayarından gelir
    const sb = !p && /^\d{12,13}$/.test(raw) && (NS.integ ? NS.integ.parseScaleBarcode(raw) : raw.startsWith(s.weighPrefix) && { plu: raw.substr(2, 5), kg: Number(raw.substr(7, 5)) / 1000 });
    if (sb) {
      p = prods.find((x) => x.plu === sb.plu);
      if (p) qty = sb.kg !== undefined ? sb.kg : r2(sb.price / p.price);
    }
    if (!p) p = prods.find((x) => x.plu && x.plu === raw.padStart(5, '0') && /^\d{1,5}$/.test(raw));
    if (p) {
      if (p.unit === 'kg' && qty === 1 && !m && !/^\d{13}$/.test(raw)) return askWeight(p);
      return addToCart(p, qty);
    }
    const found = prods.filter((x) => NS.match(raw, x.name, x.barcode));
    if (found.length === 1) return found[0].unit === 'kg' ? askWeight(found[0]) : addToCart(found[0], qty);
    if (!found.length) { NS.beep(220, 250); toast(`"${raw}" bulunamadı`, 'err'); return quickCreate(raw); }
    pickProduct(found, qty);
  }
  // Tartılı ürün: kasaya bağlı terazi varsa ağırlığı otomatik okur, yoksa elle girilir
  function askWeight(p) {
    const sc = NS.integ ? NS.integ.cfg('scale') : { mode: 'barcode' };
    const live = sc.mode !== 'barcode';
    modal({
      title: `${p.name} — tartım`,
      body: `<div class="center"><div class="muted">${money(p.price)} / kg</div><input class="input lg center" id="kg" type="number" step="0.001" placeholder="kg" style="font-size:28px;height:64px;margin-top:10px"><div class="small muted mt" id="kgs">${live ? 'Teraziden okunuyor...' : 'Ağırlığı girin (kasaya bağlı terazi için Entegrasyonlar > Terazi)'}</div><div class="big mt" id="kgt"></div></div>`,
      onOpen: (b) => {
        const inp = $('#kg', b);
        const upd = () => { const q = Number(String(inp.value).replace(',', '.')) || 0; $('#kgt', b).textContent = q ? money(q * p.price) : ''; };
        inp.oninput = upd;
        const read = () => NS.integ.readScale().then((kg) => { inp.value = kg; $('#kgs', b).textContent = 'Teraziden okundu ✓'; upd(); }).catch((e) => { $('#kgs', b).textContent = e.message; inp.focus(); });
        if (live) read();
        b.dataset.read = live ? '1' : '';
        b._read = read;
      },
      actions: [...(live ? [{ label: 'Tekrar oku', icon: 'refresh', onClick: (c, b) => b._read() }] : []), { label: 'Vazgeç', onClick: (c) => { c(); focusScan(); } }, { label: 'Sepete ekle', cls: 'primary', onClick: (c, b) => { const q = Number(String($('#kg', b).value).replace(',', '.')); if (!(q > 0)) return toast('Ağırlık girin', 'err'); c(); addToCart(p, q); focusScan(); } }],
    });
  }
  function pickProduct(list, qty) {
    const { close } = modal({
      title: `${list.length} ürün bulundu`, size: 'wide',
      body: `<div class="col">${list.slice(0, 40).map((p) => `<button class="btn" style="justify-content:space-between;height:46px" data-pp="${p.id}"><span>${esc(p.name)} <span class="faint small">${esc(p.barcode || 'PLU ' + p.plu)}</span></span><b>${money(p.price)}</b></button>`).join('')}</div>`,
      onOpen: (b, c) => on(b, 'click', '[data-pp]', (e, t) => { c(); const p = P(t.dataset.pp); p.unit === 'kg' ? askWeight(p) : addToCart(p, qty); focusScan(); }),
    });
    return close;
  }
  async function quickCreate(barcode) {
    if (!/^\d{6,14}$/.test(barcode)) return;
    if (!(await confirm(`${barcode} barkodlu ürün kayıtlı değil. Hızlıca tanımlamak ister misiniz?`, { title: 'Yeni ürün', ok: 'Tanımla', danger: false }))) return focusScan();
    const p = await productForm({ barcode });
    if (p) addToCart(p);
    focusScan();
  }
  const focusScan = () => setTimeout(() => { const i = $('#scan'); if (i) { i.value = ''; i.focus(); } }, 20);

  // ---------- Satış ekranı ----------
  function salePage(el, param, app) {
    if (param === 'iade') { cart.mode = 'return'; saveCart(); }
    el.innerHTML = `<div class="pos">
      <div class="pos-left">
        <div class="scan">
          <div class="search">${icon('barcode')}<input class="input" id="scan" placeholder="Barkod okutun, ürün adı yazın veya 3*barkod..." autocomplete="off"></div>
          <button class="btn lg icon" id="cam" title="Kamera ile barkod oku">${icon('eye')}</button>
          <button class="btn lg" id="manual" title="Fiyatı elle gir (barkodsuz ürün)">${icon('plus')} Serbest</button>
        </div>
        <div class="cat-tabs" id="cats"></div>
        <div class="quick" id="quick"></div>
      </div>
      <div class="pos-right card cart" id="cart"></div>
    </div>`;
    drawCats(); drawQuick(); drawCart();
    const scan = $('#scan', el);
    scan.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleScan(scan.value); scan.value = ''; } });
    focusScan();
    $('#manual', el).onclick = async () => {
      const v = await formModal({ title: 'Serbest Ürün', fields: [{ name: 'name', label: 'Açıklama', value: 'Çeşitli', required: true }, { name: 'price', label: 'Fiyat (₺)', type: 'number', step: '0.01', required: true }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }, { name: 'vat', label: 'KDV %', type: 'select', options: ['1', '10', '20'], value: '20' }] });
      if (v && v.price > 0) { cart.lines.push({ pid: null, name: v.name, price: v.price, qty: v.qty || 1, disc: 0, vat: Number(v.vat), buy: 0, unit: 'adet' }); saveCart(); drawCart(); }
      focusScan();
    };
    $('#cam', el).onclick = cameraScan;
    on(el, 'click', '[data-cat]', (e, t) => { catFilter = t.dataset.cat; drawCats(); drawQuick(); });
    on(el, 'click', '[data-qp]', (e, t) => { const p = P(t.dataset.qp); p.unit === 'kg' ? askWeight(p) : addToCart(p); focusScan(); });
    el.addEventListener('click', (e) => { if (!e.target.closest('input,select,textarea,.ns-modal')) setTimeout(() => { if (!document.querySelector('.ns-overlay') && document.activeElement.tagName !== 'INPUT') focusScan(); }, 0); });
  }
  function drawCats() {
    const box = $('#cats'); if (!box) return;
    box.innerHTML = [{ id: 'fav', name: '★ Sık Kullanılan' }, { id: 'all', name: 'Tümü' }, ...db.all('cats')].map((c) => `<button data-cat="${c.id}" class="${catFilter === c.id ? 'active' : ''}">${esc(c.name)}</button>`).join('');
  }
  function drawQuick() {
    const box = $('#quick'); if (!box) return;
    let ps = db.all('products');
    if (catFilter === 'fav') ps = ps.filter((p) => p.fav); else if (catFilter !== 'all') ps = ps.filter((p) => p.cat === catFilter);
    box.innerHTML = ps.map((p) => `<button class="qp${p.image ? ' has-img' : ''}" data-qp="${p.id}"><span class="sw" style="background:${cat(p.cat).color}"></span>${p.image ? `<img class="qp-img" src="${esc(p.image)}" alt="" loading="lazy" onerror="this.parentNode.classList.remove('has-img');this.remove()">` : ''}<span class="nm">${esc(p.name)}</span>
      <span class="row between nw"><span class="pr">${money(p.price)}${p.unit === 'kg' ? '<span class="small faint">/kg</span>' : ''}</span></span>
      <span class="st">${p.stock <= p.min ? badge(qtyFmt(p.stock, p.unit), 'err') : `<span class="faint">${qtyFmt(p.stock, p.unit)}</span>`}</span></button>`).join('') || '<div class="empty">Bu kategoride ürün yok</div>';
  }
  function drawCart() {
    const box = $('#cart'); if (!box) return;
    const c = calc();
    const cust = cart.customer ? db.get('customers', cart.customer) : null;
    const ret = cart.mode === 'return';
    box.innerHTML = `
      ${ret ? `<div class="cart-mode">${icon('refresh')} İADE MODU — ürünler stoğa geri girer</div>` : ''}
      <div class="card-h"><h3>${icon('cart')} Sepet <span class="faint small">(${num(c.count)} ürün)</span></h3>
        ${db.all('held').length ? `<button class="btn sm soft" data-t="held">${icon('clock')} Bekleyen ${db.all('held').length}</button>` : ''}
        <button class="btn sm ghost" data-t="clear" title="Sepeti temizle (Del)">${icon('trash')}</button></div>
      <div class="cust-chip">${icon('user')} ${cust ? `<b class="grow">${esc(cust.name)}</b><span class="small ${cust.balance > 0 ? 'faint' : ''}">Borç: ${money(cust.balance)} · ${num(cust.points)} puan</span><button class="btn sm ghost icon" data-t="uncust">${icon('x')}</button>` : `<span class="grow faint">Müşteri seçilmedi</span><button class="btn sm soft" data-t="cust">Seç (F6)</button>`}</div>
      <div class="lines">${c.lines.length ? c.lines.map((l, i) => `<div class="line ${i === selLine ? 'sel' : ''}" data-line="${i}">
          <div class="n">${esc(l.name)}</div><div class="t">${money(l.net)}</div>
          <div class="meta"><span class="qty"><button data-q="-" data-i="${i}">${icon('minus')}</button><span>${qtyFmt(l.qty, l.unit)}</span><button data-q="+" data-i="${i}">${icon('plus')}</button></span>
          <span>× ${money(l.price)}</span>${l.disc ? badge('-%' + l.disc, 'warn') : ''}<span class="grow"></span>
          <button class="btn sm ghost icon" data-ld="${i}" title="Satır indirimi / fiyat">${icon('percent')}</button><button class="btn sm ghost icon" data-lx="${i}">${icon('x')}</button></div></div>`).join('')
        : `<div class="empty">${icon('barcode')}<div>Barkod okutarak satışa başlayın</div><div class="small mt">F2 Nakit · F3 Kart · F4 Ödeme · F6 Müşteri · F7 İndirim · F8 Beklet · F10 İade</div></div>`}</div>
      <div class="totals">
        <div class="r"><span>Ara toplam</span><span>${money(c.subtotal)}</span></div>
        ${c.campDiscs.map((d) => `<div class="r" style="color:var(--ok)"><span>${icon('tag')} ${esc(d.label)}</span><span>-${money(d.amount)}</span></div>`).join('')}
        ${c.lines.some((l) => l.disc) ? `<div class="r" style="color:var(--ok)"><span>Satır indirimleri</span><span>-${money(sum(c.lines, (l) => l.lineDisc))}</span></div>` : ''}
        <div class="r"><span>KDV (dahil)</span><span>${money(c.vat)}</span></div>
        <div class="row between nw" style="margin-top:6px"><span class="muted">${ret ? 'İADE TUTARI' : 'TOPLAM'}</span><span class="grand" style="${ret ? 'color:var(--err)' : ''}">${money(c.total)}</span></div>
      </div>
      <div class="paybtns">
        <button class="btn ok" data-t="cash" ${c.lines.length ? '' : 'disabled'}>${icon('cash')} Nakit<small>F2</small></button>
        <button class="btn primary" data-t="card" ${c.lines.length ? '' : 'disabled'}>${icon('card')} Kart<small>F3</small></button>
        <button class="btn" data-t="pay" ${c.lines.length ? '' : 'disabled'}>${icon('wallet')} Diğer / Parçalı<small>F4</small></button>
      </div>
      <div class="tools">
        <button class="btn" data-t="disc">${icon('percent')} İndirim</button>
        <button class="btn" data-t="coupon">${icon('ticket')} Kupon</button>
        <button class="btn" data-t="hold">${icon('clock')} Beklet</button>
        <button class="btn ${ret ? 'danger' : ''}" data-t="ret">${icon('refresh')} İade</button>
      </div>`;
    const sel = $(`.line[data-line="${selLine}"]`, box); if (sel) sel.scrollIntoView({ block: 'nearest' });
    if (!box._bound) {
      box._bound = true;
      on(box, 'click', '[data-q]', (e, t) => { e.stopPropagation(); const l = cart.lines[t.dataset.i]; const step = l.unit === 'kg' ? 0.1 : 1; l.qty = r2(l.qty + (t.dataset.q === '+' ? step : -step)); if (l.qty <= 0) cart.lines.splice(t.dataset.i, 1); saveCart(); drawCart(); });
      on(box, 'click', '[data-lx]', (e, t) => { e.stopPropagation(); cart.lines.splice(t.dataset.lx, 1); selLine = -1; saveCart(); drawCart(); });
      on(box, 'click', '[data-ld]', (e, t) => { e.stopPropagation(); lineEdit(Number(t.dataset.ld)); });
      on(box, 'click', '[data-line]', (e, t) => { selLine = Number(t.dataset.line); drawCart(); });
      on(box, 'click', '[data-t]', (e, t) => tool(t.dataset.t));
    }
  }
  async function lineEdit(i) {
    const l = cart.lines[i];
    const v = await formModal({ title: l.name, fields: [{ name: 'qty', label: 'Miktar', type: 'number', step: '0.001' }, { name: 'price', label: 'Birim fiyat (₺)', type: 'number', step: '0.01' }, { name: 'disc', label: 'Satır indirimi (%)', type: 'number', min: 0, max: 100 }], values: l });
    if (v) { if (v.qty <= 0) cart.lines.splice(i, 1); else Object.assign(l, { qty: v.qty, price: v.price, disc: NS.clamp(v.disc || 0, 0, 100) }); saveCart(); drawCart(); }
    focusScan();
  }
  async function tool(t) {
    const c = calc();
    if (t === 'clear') { if (cart.lines.length && (await confirm('Sepet temizlensin mi?'))) { cart = newCart(); saveCart(); drawCart(); } }
    else if (t === 'cust') return chooseCustomer();
    else if (t === 'uncust') { cart.customer = null; saveCart(); drawCart(); }
    else if (t === 'cash') { if (c.lines.length) finish([{ type: 'nakit', amount: c.total }], { given: c.total }); }
    else if (t === 'card') { if (c.lines.length) { const r = cart.mode === 'sale' && NS.integ ? await NS.integ.cardPayment(c.total) : { ok: true }; if (r.ok) finish([{ type: 'kart', amount: c.total, ref: r.ref, installment: r.installment }]); else toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); } }
    else if (t === 'pay') { if (c.lines.length) return payModal(); }
    else if (t === 'disc') {
      const v = await formModal({ title: 'Genel İndirim', fields: [{ name: 'type', label: 'Tür', type: 'select', options: [{ value: 'tl', label: 'Tutar (₺)' }, { value: 'pct', label: 'Yüzde (%)' }] }, { name: 'val', label: 'Değer', type: 'number', step: '0.01' }], values: { type: 'tl', val: cart.manual || '' } });
      if (v) { cart.manual = v.type === 'pct' ? r2((c.total + (cart.manual || 0)) * (v.val || 0) / 100) : (v.val || 0); saveCart(); drawCart(); }
    } else if (t === 'coupon') {
      const code = await NS.prompt('Kupon kodu', cart.coupon || '', { title: 'Kupon' });
      if (code !== null) {
        const k = db.find('campaigns', (x) => x.type === 'coupon' && x.active && x.code === code.toUpperCase());
        if (code && !k) toast('Geçersiz kupon', 'err'); else { cart.coupon = code ? code.toUpperCase() : null; saveCart(); drawCart(); if (k) toast('Kupon uygulandı', 'ok'); }
      }
    } else if (t === 'hold') {
      if (!cart.lines.length) return toast('Sepet boş');
      db.insert('held', { cart: JSON.parse(JSON.stringify(cart)), total: c.total, user: NS.currentUser && NS.currentUser.id });
      cart = newCart(); saveCart(); drawCart(); toast('Fiş bekletmeye alındı', 'ok');
    } else if (t === 'held') return heldModal();
    else if (t === 'ret') { cart.mode = cart.mode === 'return' ? 'sale' : 'return'; saveCart(); drawCart(); }
    focusScan();
  }
  function chooseCustomer() {
    const drawList = (q) => db.all('customers').filter((m) => NS.match(q, m.name, m.phone, m.card)).slice(0, 30).map((m) => `<button class="btn" style="justify-content:space-between;height:48px" data-cu="${m.id}"><span class="row nw"><span class="avatar">${esc(NS.initials(m.name))}</span><span style="text-align:left">${esc(m.name)}<div class="small faint">${esc(m.phone)}</div></span></span><span class="small">${m.balance > 0 ? badge('Borç ' + money(m.balance), 'warn') : ''}</span></button>`).join('');
    modal({
      title: 'Müşteri Seç', size: 'wide',
      body: `<div class="row mb">${NS.searchBox('cq', 'Ad, telefon veya kart no...')}<button class="btn primary" id="cnew">${icon('plus')} Yeni müşteri</button></div><div class="col" id="cl">${drawList('')}</div>`,
      onOpen: (b, close) => {
        $('#cq', b).oninput = (e) => { $('#cl', b).innerHTML = drawList(e.target.value); };
        on(b, 'click', '[data-cu]', (e, t) => { cart.customer = t.dataset.cu; saveCart(); close(); drawCart(); focusScan(); });
        $('#cnew', b).onclick = async () => { close(); const v = await formModal({ title: 'Yeni Müşteri', fields: CUST_FIELDS }); if (v) { const m = db.insert('customers', { ...v, balance: 0, points: 0 }); cart.customer = m.id; saveCart(); drawCart(); } focusScan(); };
      },
    });
  }
  function heldModal() {
    const list = db.all('held');
    modal({
      title: 'Bekleyen Fişler', size: 'wide',
      body: list.length ? `<div class="col">${list.map((h) => `<div class="card pad row"><div class="grow"><b>${money(h.total)}</b> <span class="muted small">· ${h.cart.lines.length} kalem · ${NS.time(h.created)}${h.cart.customer ? ' · ' + esc(custName(h.cart.customer)) : ''}</span><div class="small faint">${esc(h.cart.lines.map((l) => l.name).slice(0, 4).join(', '))}</div></div><button class="btn primary sm" data-hl="${h.id}">Geri çağır</button><button class="btn sm ghost icon" data-hd="${h.id}">${icon('trash')}</button></div>`).join('')}</div>` : '<div class="empty">Bekleyen fiş yok</div>',
      onOpen: (b, close) => {
        on(b, 'click', '[data-hl]', (e, t) => {
          const h = db.get('held', t.dataset.hl);
          if (cart.lines.length) db.insert('held', { cart: JSON.parse(JSON.stringify(cart)), total: calc().total }, true);
          cart = h.cart; db.remove('held', h.id); saveCart(); close(); drawCart(); focusScan();
        });
        on(b, 'click', '[data-hd]', (e, t) => { db.remove('held', t.dataset.hd); close(); heldModal(); drawCart(); });
      },
    });
  }

  function payModal() {
    const c = calc();
    const pays = [];
    const cust = cart.customer ? db.get('customers', cart.customer) : null;
    const { close } = modal({
      title: cart.mode === 'return' ? 'İade Ödemesi' : 'Ödeme', size: 'wide',
      body: `<div class="grid g2">
        <div class="col">
          <div class="card pad center"><div class="muted">Ödenecek</div><div class="pay-big" id="rem">${money(c.total)}</div><div class="small faint" id="paid"></div></div>
          <div class="field"><label>Tutar</label><input class="input lg" id="amt" type="number" step="0.01" value="${c.total}"></div>
          <div class="bills">${[c.total, 50, 100, 200, 500, 1000].map((b, i) => `<button class="btn" data-bill="${b}">${i === 0 ? 'Tam' : money(b).replace(',00', '')}</button>`).join('')}</div>
        </div>
        <div class="col">
          ${Object.entries(PAY).map(([k, v]) => `<button class="btn lg ${k === 'nakit' ? 'ok' : k === 'kart' ? 'primary' : ''}" data-pt="${k}" ${k === 'veresiye' && !cust ? 'disabled title="Önce müşteri seçin"' : ''}>${icon(k === 'nakit' ? 'cash' : k === 'kart' ? 'card' : k === 'veresiye' ? 'book' : 'wallet')} ${v}</button>`).join('')}
          ${!cust ? '<div class="small faint">Veresiye için müşteri seçmelisiniz.</div>' : `<div class="small muted">Müşteri: <b>${esc(cust.name)}</b> · Limit ${money(cust.limit || 0)} · Borç ${money(cust.balance)}</div>`}
          <div id="plist" class="col gap-s"></div>
        </div>
      </div>`,
      onOpen: (b, close) => {
        const remaining = () => r2(c.total - sum(pays, (p) => p.amount));
        const upd = () => {
          const rem = remaining();
          $('#rem', b).textContent = money(Math.max(0, rem));
          $('#amt', b).value = Math.max(0, rem);
          $('#plist', b).innerHTML = pays.map((p) => `<div class="row small"><span class="grow">${PAY[p.type]}</span><b>${money(p.amount)}</b></div>`).join('');
        };
        on(b, 'click', '[data-bill]', (e, t) => { $('#amt', b).value = t.dataset.bill; });
        on(b, 'click', '[data-pt]', async (e, t) => {
          const type = t.dataset.pt;
          let amount = Number($('#amt', b).value) || 0;
          const rem = remaining();
          if (amount <= 0) return toast('Tutar girin', 'err');
          if (type === 'veresiye' && cust && (cust.balance + Math.min(amount, rem)) > (cust.limit || Infinity) && cart.mode === 'sale') return toast('Müşterinin veresiye limiti aşılıyor', 'err');
          let given = null;
          if (type === 'nakit' && amount > rem) { given = amount; amount = rem; }
          else if (amount > rem) amount = rem;
          let ref = null;
          if (type === 'kart' && cart.mode === 'sale' && NS.integ) { const r = await NS.integ.cardPayment(r2(amount)); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); ref = r.ref; }
          pays.push({ type, amount: r2(amount), ref });
          if (remaining() <= 0.001) { close(); finish(mergePays(pays), { given: given ?? (pays.length === 1 && type === 'nakit' ? amount : null) }); }
          else upd();
        });
      },
    });
    return close;
  }
  const mergePays = (pays) => Object.values(pays.reduce((m, p) => { (m[p.type] = m[p.type] || { type: p.type, amount: 0 }).amount = r2(m[p.type].amount + p.amount); return m; }, {}));

  // Satış fişini faturaya çevirir: alıcı mükellefse e-Fatura, değilse e-Arşiv. Fiyatlar KDV dahildir; kampanya indirimi satırlara dağıtılır
  async function invoiceSale(sale) {
    if (sale.ebelge) return NS.ebelge.view(sale.ebelge.id);
    const m = sale.customer ? db.get('customers', sale.customer) || {} : {};
    const v = await formModal({ title: `${sale.no} — fatura bilgileri`, fields: [{ name: 'buyer', label: 'Ad soyad / ünvan', required: true, value: m.name || '' }, { name: 'vkn', label: 'TCKN / VKN', value: m.taxNo || m.tc || '', hint: 'Boş bırakılırsa nihai tüketici (11111111111)' }, { name: 'taxOffice', label: 'Vergi dairesi', value: m.taxOffice || '' }, { name: 'email', label: 'E-posta (fatura gönderilir)', type: 'email', value: m.email || '' }, { name: 'address', label: 'Adres', full: true, value: m.address || '' }], submitLabel: 'Faturayı kes' });
    if (!v) return;
    const gross = sum(sale.items, (i) => i.qty * i.price * (1 - (i.disc || 0) / 100)); const f = gross ? Math.abs(sale.total) / gross : 1;
    const r = await NS.integ.sendEInvoice({ buyer: v.buyer, buyerVkn: v.vkn || '11111111111', buyerTaxOffice: v.taxOffice, buyerEmail: v.email, address: v.address, no: sale.no, refund: sale.type === 'return', lines: sale.items.map((i) => { const p = P(i.pid) || {}; return { name: i.name, code: p.barcode || '', qty: i.qty, unit: i.unit, vat: i.vat, total: r2(i.qty * i.price * (1 - (i.disc || 0) / 100) * f) }; }) });
    if (r && r.ok) { sale.ebelge = { id: r.id, no: r.no, type: r.type }; if (m.id && !m.taxNo && v.vkn) { m.taxNo = v.vkn; m.taxOffice = v.taxOffice; m.email = v.email || m.email; } db.save(); }
  }
  // Gelen e-Fatura → alış faturası: tedarikçi VKN/ünvanla, ürün barkod/adla eşleşir; bulunmayan ürün yeni kart olarak açılır
  if (NS.ebelge) NS.ebelge.onImport((d) => {
    let s = db.find('suppliers', (x) => (x.taxNo && x.taxNo === d.party.vkn) || NS.trLower(x.name) === NS.trLower(d.party.name));
    if (!s) s = db.insert('suppliers', { name: d.party.name, taxNo: d.party.vkn, phone: '', balance: 0 }, true);
    const items = d.lines.map((l) => { let p = db.find('products', (x) => (l.code && x.barcode === l.code) || NS.trLower(x.name) === NS.trLower(l.name)); if (!p) p = db.insert('products', { name: l.name, barcode: genBarcode(), cat: (db.all('cats')[0] || {}).id, buy: l.price, price: r2(l.price * (1 + (l.vat || 0) / 100) * 1.3), vat: l.vat || 20, stock: 0, unit: l.unit === 'kg' ? 'kg' : 'adet', min: 5 }, true); return { pid: p.id, name: p.name, qty: l.qty, cost: l.price }; });
    const total = r2(d.total); const a = db.insert('purchases', { no: db.nextNo('purchases', 'AF'), at: new Date().toISOString(), supplier: s.id, invoiceNo: d.no, items, total, paid: 0, ebelge: d.id }, true);
    items.forEach((i) => { const p = P(i.pid); p.stock = r2(p.stock + i.qty); p.buy = i.cost; db.insert('moves', { at: a.at, pid: p.id, qty: i.qty, type: 'Alış', ref: a.no }, true); });
    s.balance = r2((s.balance || 0) + total); db.log('Gelen e-Fatura aktarıldı', `${d.no} · ${s.name}`); db.save();
    return a.no;
  }, 'Alış faturası + stok girişi');
  function finish(payments, { given } = {}) {
    const c = calc();
    const ret = cart.mode === 'return';
    const sign = ret ? -1 : 1;
    const s = S();
    const sale = db.insert('sales', {
      no: db.nextNo('sales', ret ? 'I' : 'F'), at: new Date().toISOString(), type: ret ? 'return' : 'sale',
      items: c.lines.map((l) => ({ pid: l.pid, name: l.name, qty: l.qty, price: l.price, disc: l.disc, vat: l.vat, buy: l.buy, unit: l.unit })),
      subtotal: sign * c.subtotal, discount: sign * c.discount, total: sign * c.total, vat: sign * c.vat, campDiscs: c.campDiscs,
      payments: payments.map((p) => ({ ...p, amount: sign * p.amount })), customer: cart.customer, user: NS.currentUser && NS.currentUser.id, given, change: given ? r2(given - c.total) : 0, coupon: cart.coupon,
    }, true);
    c.lines.forEach((l) => {
      const p = P(l.pid); if (!p) return;
      p.stock = r2(p.stock - sign * l.qty);
      db.insert('moves', { at: sale.at, pid: p.id, qty: -sign * l.qty, type: ret ? 'İade' : 'Satış', ref: sale.no }, true);
    });
    if (cart.customer) {
      const m = db.get('customers', cart.customer);
      const ver = sum(payments.filter((p) => p.type === 'veresiye'), (p) => p.amount);
      m.balance = r2((m.balance || 0) + sign * ver);
      m.points = Math.max(0, Math.round((m.points || 0) + sign * c.total * (s.pointsRate || 0) / 10));
      m.lastVisit = sale.at;
    }
    db.log(ret ? 'İade' : 'Satış', `${sale.no} · ${money(c.total)}`);
    cart = newCart(); selLine = -1;
    saveCart();
    drawCart(); drawQuick();
    const change = sale.change;
    modal({
      title: ret ? 'İade tamamlandı' : 'Satış tamamlandı',
      body: `<div class="center"><div class="kpi" style="justify-content:center"><div class="ic ok">${icon('check', 'ico-lg')}</div></div>
        <div class="pay-big">${money(c.total)}</div><div class="muted">${esc(sale.no)} · ${payments.map((p) => PAY[p.type]).join(' + ')}</div>
        ${change > 0 ? `<div class="card pad mt" style="background:var(--ok-soft);border:0"><div class="muted">Para üstü</div><div class="pay-big" style="color:var(--ok)">${money(change)}</div></div>` : ''}</div>`,
      actions: [{ label: 'Fiş yazdır', icon: 'print', onClick: (cl) => { printReceipt(sale); cl(); focusScan(); } }, ...(NS.ebelge ? [{ label: ret ? 'İade faturası' : 'Fatura kes (e-Arşiv/e-Fatura)', icon: 'file', onClick: (cl) => { cl(); invoiceSale(sale); } }] : []), { label: 'Yeni satış (Enter)', cls: 'primary', onClick: (cl) => { cl(); focusScan(); } }],
      onOpen: (b, cl) => { const k = (e) => { if (e.key === 'Enter') { e.preventDefault(); document.removeEventListener('keydown', k); cl(); focusScan(); } }; setTimeout(() => document.addEventListener('keydown', k), 200); },
    });
    if (s.autoPrint) printReceipt(sale);
    else if (NS.integ && payments.some((p) => p.type === 'nakit')) NS.integ.openDrawer();
    if (NS.integ) NS.integ.emit(ret ? 'iade' : 'satis', { no: sale.no, total: sale.total, items: sale.items.length, payments: sale.payments });
    // Yazarkasa POS (ÖKC / GMP3): mali fiş cihazdan kesilir; pazaryeri bağlıysa stok değişimi gönderilir
    if (NS.integ && NS.integ.isOn('okc')) NS.integ.call('okc', ret ? 'iade-fis' : 'mali-fis', { no: sale.no, total: Math.abs(sale.total), items: sale.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, vat: i.vat })), payments: sale.payments.map((p) => ({ type: p.type, amount: Math.abs(p.amount) })) }, { silent: true }).then((r) => { if (r) { sale.okc = r.ok ? r.ref : 'hata'; db.save(); if (!r.ok) toast('ÖKC mali fiş kesilemedi — Satışlar ekranından tekrar deneyin', 'err'); } });
    if (NS.integ && NS.integ.isOn('pazaryeri') && NS.integ.cfg('pazaryeri').auto) NS.integ.call('pazaryeri', 'stok-guncelle', { items: sale.items.map((i) => { const p = P(i.pid) || {}; return { barcode: p.barcode, stock: p.stock }; }) }, { silent: true });
  }

  function receiptHtml(sale) {
    const s = S();
    return `<div class="c"><div class="big">${esc(s.bizName)}</div><div>${esc(s.bizAddress || '')}</div><div>${esc(s.bizPhone || '')}</div><div>VD: ${esc(s.taxOffice || '')} ${esc(s.taxNo || '')}</div></div><hr>
      <div class="r"><span>${NS.dt(sale.at)}</span><span>${esc(sale.no)}</span></div><div>Kasiyer: ${esc(userName(sale.user))}</div>${sale.customer ? `<div>Müşteri: ${esc(custName(sale.customer))}</div>` : ''}<hr>
      ${sale.items.map((i) => `<div>${esc(i.name)}</div><div class="r"><span>${qtyFmt(i.qty, i.unit)} x ${money(i.price)}${i.disc ? ' -%' + i.disc : ''}</span><span>${money(i.qty * i.price * (1 - (i.disc || 0) / 100))}</span></div>`).join('')}<hr>
      ${(sale.campDiscs || []).map((d) => `<div class="r"><span>${esc(d.label)}</span><span>-${money(d.amount)}</span></div>`).join('')}
      <div class="r"><span>KDV</span><span>${money(Math.abs(sale.vat || 0))}</span></div>
      <div class="r big"><span>${sale.type === 'return' ? 'İADE' : 'TOPLAM'}</span><span>${money(Math.abs(sale.total))}</span></div>
      ${sale.payments.map((p) => `<div class="r"><span>${PAY[p.type]}</span><span>${money(Math.abs(p.amount))}</span></div>`).join('')}
      ${sale.given ? `<div class="r"><span>Verilen</span><span>${money(sale.given)}</span></div><div class="r"><span>Para üstü</span><span>${money(sale.change)}</span></div>` : ''}
      <hr><div class="c">${esc(s.receiptFooter || '')}</div><div class="c">Mali değeri yoktur · NEBSOFT POS</div>`;
  }
  const printReceipt = (sale) => (NS.integ ? NS.integ.printReceipt(receiptHtml(sale), { title: sale.no, drawer: sale.payments.some((p) => p.type === 'nakit') }) : NS.printHtml(receiptHtml(sale), { title: sale.no }));

  // Kamera ile barkod okuma (BarcodeDetector destekleyen tarayıcılarda)
  async function cameraScan() {
    if (!('BarcodeDetector' in window)) return toast('Bu tarayıcı kamera ile barkod okumayı desteklemiyor. Chrome/Edge (Android) deneyin veya USB okuyucu kullanın.', 'err');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); } catch (e) { return toast('Kameraya erişilemedi', 'err'); }
    const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'qr_code'] });
    let alive = true;
    const { close } = modal({
      title: 'Kamera ile Oku', body: '<video id="vid" autoplay playsinline style="width:100%;border-radius:12px;background:#000"></video><p class="small muted center mt">Barkodu kameraya gösterin</p>',
      onClose: () => { alive = false; stream.getTracks().forEach((t) => t.stop()); focusScan(); },
      onOpen: (b) => {
        const v = $('#vid', b); v.srcObject = stream;
        const loop = async () => { if (!alive) return; try { const r = await det.detect(v); if (r.length) { handleScan(r[0].rawValue); close(); return; } } catch (e) { /* bekle */ } requestAnimationFrame(loop); };
        v.onloadeddata = loop;
      },
    });
  }

  // ---------- Ürünler ----------
  const productFields = () => [
    { name: 'name', label: 'Ürün adı', required: true, full: true },
    { name: 'barcode', label: 'Barkod', hint: 'Boş bırakırsanız otomatik üretilir' },
    { name: 'cat', label: 'Kategori', type: 'select', options: () => db.all('cats').map((c) => ({ value: c.id, label: c.name })) },
    { name: 'buy', label: 'Alış fiyatı (₺)', type: 'number', step: '0.01' },
    { name: 'price', label: 'Satış fiyatı (₺, KDV dahil)', type: 'number', step: '0.01', required: true },
    { name: 'vat', label: 'KDV %', type: 'select', options: ['0', '1', '10', '20'], num: true },
    { name: 'unit', label: 'Birim', type: 'select', options: [{ value: 'adet', label: 'Adet' }, { value: 'kg', label: 'Kilogram (tartılı)' }] },
    { name: 'stock', label: 'Stok', type: 'number', step: '0.001' },
    { name: 'min', label: 'Kritik stok seviyesi', type: 'number' },
    { name: 'plu', label: 'Terazi PLU kodu (5 hane)', hint: 'Terazi barkodu 27PPPPPGGGGGK formatında okunur' },
    { name: 'shelf', label: 'Raf / Reyon' },
    { name: 'fav', label: 'Hızlı satış ekranında göster', type: 'checkbox' },
  ];
  async function productForm(rec) {
    const isNew = !rec || !rec.id;
    let image = (rec && rec.image) || '';
    const v = await formModal({ title: isNew ? 'Yeni Ürün' : 'Ürünü Düzenle', fields: productFields(), values: { vat: 20, unit: 'adet', min: 5, stock: 0, cat: (db.all('cats')[0] || {}).id, ...rec }, size: 'wide',
      extra: `<div class="pf-img" id="pfi" ${image ? '' : 'hidden'}><img src="${esc(image)}" alt=""><span class="small muted">Görsel hazır katalogdan alındı</span><button type="button" class="btn sm ghost" id="pfix">${icon('x')} Kaldır</button></div>`,
      onOpen: (b) => {
        const bc = $('[name=barcode]', b); const nm = $('[name=name]', b); if (!bc) return;
        const w = document.createElement('div'); w.className = 'pf-row'; bc.before(w); w.append(bc); w.insertAdjacentHTML('beforeend', `<button type="button" class="btn pf-cam" id="pfc" title="Kamerayla okut">${icon('camera')}</button>`);
        const setImg = (u) => { image = u || ''; const w = $('#pfi', b); w.hidden = !image; if (image) $('img', w).src = image; };
        const look = async () => { const code = bc.value.trim(); if (!/^\d{8,14}$/.test(code) || nm.value.trim()) return; const hit = await katalogBarkod(code); if (hit && !nm.value.trim()) { nm.value = hit.name; setImg(hit.image); toast('Ürün bilgisi katalogdan dolduruldu', 'ok'); } };
        bc.addEventListener('change', look);
        $('#pfc', b).onclick = () => NS.scan({ title: 'Barkodu okut', onCode: (code) => { bc.value = code; look(); } });
        $('#pfix', b).onclick = () => setImg('');
      } });
    if (!v) return null;
    if (image) v.image = image; else delete v.image;
    v.vat = Number(v.vat);
    if (!v.barcode && v.unit !== 'kg') v.barcode = genBarcode();
    const dup = db.find('products', (p) => p.barcode && p.barcode === v.barcode && p.id !== (rec && rec.id));
    if (dup) { toast(`Bu barkod "${dup.name}" ürününde kayıtlı`, 'err'); return null; }
    if (isNew) { const p = db.insert('products', v); db.log('Ürün eklendi', v.name); toast('Ürün eklendi', 'ok'); katalogKatki([{ barcode: v.barcode, name: v.name, image: v.image }]); return p; }
    if (rec.price !== v.price) db.insert('priceLog', { pid: rec.id, old: rec.price, new: v.price, user: NS.currentUser && NS.currentUser.name }, true);
    db.update('products', rec.id, v); toast('Kaydedildi', 'ok');
    return P(rec.id);
  }
  // ---------- Hazır ürün kataloğu (merkezi havuz + Open Food Facts) ----------
  const katalogBarkod = async (code) => { try { return (await NS.api('GET', '/api/katalog/barkod/' + encodeURIComponent(code))).item; } catch (e) { return null; } };
  const katalogKatki = (items) => { NS.api('POST', '/api/katalog/katki', { items }).catch(() => {}); };
  const KAT = [['', 'Tümü'], ['icecek', 'İçecek'], ['atistirmalik', 'Atıştırmalık'], ['sut', 'Süt ürünleri'], ['kahvalti', 'Kahvaltılık'], ['tatli', 'Çikolata & tatlı'], ['temel', 'Temel gıda'], ['konserve', 'Konserve'], ['dondurulmus', 'Dondurulmuş'], ['et', 'Et & şarküteri'], ['meyve', 'Bitkisel & meyve']];
  function catalogWizard(done) {
    const chosen = new Map(); let q = '', kat = '', page = 1, items = [], more = false, step = 1, busy = false, tmr;
    const have = new Set(db.all('products').map((p) => p.barcode).filter(Boolean));
    const m = modal({ title: 'Hazır katalogdan ürün ekle', size: 'xl', body: '<div id="kw"></div>', actions: [{ label: 'Vazgeç' }, { label: 'Geri', icon: 'left', onClick: () => { step = 1; draw(); } }, { label: 'İleri', cls: 'primary', icon: 'right', onClick: () => next() }] });
    const B = m.root; const foot = B.parentElement.querySelector('.ns-modal-f'); const [, backBtn, nextBtn] = foot.children;
    const card = (it) => { const on = chosen.has(it.barcode), ex = have.has(it.barcode); return `<button type="button" class="kc${on ? ' on' : ''}${ex ? ' ex' : ''}" data-k="${esc(it.barcode)}" ${ex ? 'disabled' : ''}><span class="kc-img">${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('i'),{textContent:'${esc((it.name || '?')[0])}'}))">` : `<i>${esc((it.name || '?')[0])}</i>`}</span><span class="kc-t"><b>${esc(it.name)}</b><small>${esc(it.brand || '')}</small><small class="mono">${esc(it.barcode)}</small></span><span class="kc-ck">${icon('check')}</span>${ex ? '<em>Zaten kayıtlı</em>' : it.source === 'havuz' ? '<em class="pop">Sık kullanılan</em>' : ''}</button>`; };
    const load = async (reset) => {
      if (busy) return; busy = true; if (reset) { page = 1; items = []; }
      const g = $('#kg', B); if (reset && g) g.innerHTML = '<div class="kgrid">' + '<div class="skel" style="height:96px;border-radius:14px"></div>'.repeat(9) + '</div>';
      try { const r = await NS.api('GET', `/api/katalog/ara?${new URLSearchParams({ q, kat, sayfa: page })}`); items = items.concat(r.items.filter((x) => !items.some((y) => y.barcode === x.barcode))); more = r.more; }
      catch (e) { busy = false; if (g) g.innerHTML = `<div class="empty">${icon('alert')}<div>${esc(e.message)}</div><button class="btn mt" id="kre">Tekrar dene</button></div>`; const re = $('#kre', B); if (re) re.onclick = () => load(true); return; }
      busy = false; grid();
    };
    const grid = () => { const g = $('#kg', B); if (!g) return; g.innerHTML = items.length ? `<div class="kgrid">${items.map(card).join('')}</div>${more ? '<div class="center mt"><button class="btn" id="kmore">Daha fazla göster</button></div>' : ''}` : `<div class="empty">${icon('search')}<div>"${esc(q)}" için ürün bulunamadı. Farklı bir kelime deneyin ya da ürünü elle ekleyin.</div></div>`; const mb = $('#kmore', B); if (mb) mb.onclick = () => { page++; load(false); }; cnt(); };
    const cnt = () => { const c = $('#kn', B); if (c) c.innerHTML = chosen.size ? `<b>${chosen.size}</b> ürün seçildi` : 'Eklemek istediğiniz ürünleri seçin'; nextBtn.disabled = !chosen.size; };
    const catOpts = (sel) => db.all('cats').map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    const draw = () => {
      backBtn.hidden = step === 1; nextBtn.innerHTML = step === 1 ? `İleri ${icon('right')}` : `${icon('check')} Tümünü kaydet`;
      if (step === 1) {
        $('#kw', B).innerHTML = `<div class="kbar"><div class="search grow">${icon('search')}<input class="input" id="kq" placeholder="Ürün, marka veya barkod ara: ülker, süt, 8690…" value="${esc(q)}"></div><button class="btn" id="kcam">${icon('camera')} Barkod okut</button></div>
          <div class="chips mb" id="kc">${KAT.map(([k, l]) => `<button class="chip${k === kat ? ' active' : ''}" data-kat="${k}">${esc(l)}</button>`).join('')}</div>
          <div class="ksum"><span id="kn"></span><span class="small faint">Kaynak: NEBSOFT ürün havuzu ve Open Food Facts (açık veri)</span></div><div id="kg"></div>`;
        $('#kq', B).oninput = (e) => { q = e.target.value.trim(); clearTimeout(tmr); tmr = setTimeout(() => load(true), 380); };
        on($('#kw', B), 'click', '[data-kat]', (e, t) => { kat = t.dataset.kat; $$('[data-kat]', B).forEach((x) => x.classList.toggle('active', x === t)); load(true); });
        $('#kcam', B).onclick = () => NS.scan({ title: 'Katalogda barkod ara', continuous: true, hint: 'Okuttuğunuz ürünler seçime eklenir', onCode: async (code) => { if (have.has(code)) return toast('Bu ürün zaten kayıtlı', 'err'); const it = await katalogBarkod(code); if (!it) { NS.beep(220, 180); return toast('Katalogda bulunamadı: ' + code + ' — elle ekleyebilirsiniz', 'err'); } chosen.set(it.barcode, it); if (!items.some((x) => x.barcode === it.barcode)) items.unshift(it); grid(); toast(it.name + ' seçildi', 'ok'); } });
        on($('#kw', B), 'click', '[data-k]', (e, t) => { const it = items.find((x) => x.barcode === t.dataset.k); if (!it) return; chosen.has(it.barcode) ? chosen.delete(it.barcode) : chosen.set(it.barcode, it); t.classList.toggle('on'); cnt(); });
        if (items.length) grid(); else load(true); cnt();
      } else {
        const c0 = (db.all('cats')[0] || {}).id;
        [...chosen.values()].forEach((it) => { it.buy = it.buy ?? ''; it.price = it.price ?? ''; it.qty = it.qty ?? ''; it.cat = it.cat || c0; it.vat = it.vat ?? 10; });
        $('#kw', B).innerHTML = `<p class="muted small mb">Barkod, ad ve görsel katalogdan geldi. Yalnızca <b>alış</b>, <b>satış</b> ve <b>miktar</b> girin; ad ve kategoriyi isterseniz değiştirin.</p>
          <div class="kbar"><span class="small">Toplu doldur:</span><label class="small">Kâr % <input class="input" type="number" id="kmk" value="30" style="width:74px"></label><button class="btn sm" id="kmka">Alıştan satış hesapla</button><label class="small">Kategori <select class="input" id="kcat" style="width:170px"><option value="">—</option>${catOpts('')}</select></label><label class="small">KDV <select class="input" id="kvat" style="width:80px"><option value="">—</option>${[0, 1, 10, 20].map((x) => `<option>${x}</option>`).join('')}</select></label></div>
          <div class="ktable"><table class="tbl"><thead><tr><th></th><th>Ürün</th><th>Kategori</th><th>KDV</th><th class="right">Alış ₺</th><th class="right">Satış ₺</th><th class="right">Miktar</th><th></th></tr></thead><tbody>${[...chosen.values()].map((it) => `<tr data-r="${esc(it.barcode)}">
            <td>${it.image ? `<img class="pthumb" src="${esc(it.image)}" alt="">` : ''}</td><td><input class="input" data-f="name" value="${esc(it.name)}" style="min-width:200px"><div class="small faint mono">${esc(it.barcode)}</div></td>
            <td><select class="input" data-f="cat">${catOpts(it.cat)}</select></td><td><select class="input" data-f="vat" style="width:72px">${[0, 1, 10, 20].map((x) => `<option ${Number(it.vat) === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
            <td><input class="input right" type="number" step="0.01" min="0" data-f="buy" value="${it.buy}" style="width:96px" placeholder="0,00"></td><td><input class="input right" type="number" step="0.01" min="0" data-f="price" value="${it.price}" style="width:96px" placeholder="0,00"></td><td><input class="input right" type="number" step="1" min="0" data-f="qty" value="${it.qty}" style="width:84px" placeholder="0"></td>
            <td><button class="btn ghost icon sm" data-rm="${esc(it.barcode)}" title="Çıkar">${icon('x')}</button></td></tr>`).join('')}</tbody></table></div>`;
        const W = $('#kw', B);
        on(W, 'input', '[data-f]', (e, t) => { const it = chosen.get(t.closest('[data-r]').dataset.r); it[t.dataset.f] = t.value; t.classList.remove('bad'); });
        on(W, 'change', 'select[data-f]', (e, t) => { chosen.get(t.closest('[data-r]').dataset.r)[t.dataset.f] = t.value; });
        on(W, 'click', '[data-rm]', (e, t) => { chosen.delete(t.dataset.rm); if (!chosen.size) { step = 1; } draw(); });
        // Enter ile bir sonraki hücreye: hızlı veri girişi
        on(W, 'keydown', 'input[data-f]', (e, t) => { if (e.key !== 'Enter') return; e.preventDefault(); const all = $$('input[data-f=buy],input[data-f=price],input[data-f=qty]', W); const i = all.indexOf(t); if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); } });
        $('#kmka', W).onclick = () => { const k = Number($('#kmk', W).value) || 0; chosen.forEach((it) => { if (Number(it.buy) > 0) it.price = r2(Number(it.buy) * (1 + k / 100)); }); draw(); };
        $('#kcat', W).onchange = (e) => { if (e.target.value) { chosen.forEach((it) => { it.cat = e.target.value; }); draw(); } };
        $('#kvat', W).onchange = (e) => { if (e.target.value !== '') { chosen.forEach((it) => { it.vat = e.target.value; }); draw(); } };
        const f = $('input[data-f=buy]', W); if (f) f.focus();
      }
      cnt();
    };
    const next = () => {
      if (step === 1) { if (!chosen.size) return; step = 2; return draw(); }
      const bad = [...chosen.values()].filter((it) => !(Number(it.price) > 0) || !String(it.name || '').trim());
      if (bad.length) { bad.forEach((it) => { const r = $(`[data-r="${CSS.escape(it.barcode)}"] [data-f=price]`, B); if (r) r.classList.add('bad'); }); return toast(`${bad.length} üründe satış fiyatı eksik`, 'err'); }
      const at = new Date().toISOString(); let n = 0;
      chosen.forEach((it) => { if (db.find('products', (p) => p.barcode === it.barcode)) return; const stock = Math.max(0, Number(it.qty) || 0); const p = db.insert('products', { barcode: it.barcode, name: it.name.trim(), brand: it.brand || '', image: it.image || '', cat: it.cat, buy: r2(Number(it.buy) || 0), price: r2(Number(it.price)), vat: Number(it.vat) || 0, unit: 'adet', stock, min: 5 }, true); if (stock) db.insert('moves', { at, pid: p.id, qty: stock, type: 'Giriş', ref: 'Hazır katalog' }, true); n++; });
      db.log('Katalogdan ürün eklendi', n + ' ürün'); db.save(); katalogKatki([...chosen.values()]);
      m.close(); toast(`${n} ürün eklendi`, 'ok'); done && done();
    };
    draw();
  }
  function genBarcode() {
    const base = '2' + String(Date.now()).slice(-11);
    const d = base.split('').map(Number);
    const chk = (10 - (d.reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0) % 10)) % 10;
    return base + chk;
  }

  function productsPage(el) {
    let q = '', cf = '', sf = '';
    el.innerHTML = pageHead('Ürünler', 'Ürün kartları, fiyatlar ve stok seviyeleri', `
      <button class="btn" id="imp">${icon('upload')} İçe aktar</button><button class="btn" id="exp">${icon('download')} Dışa aktar</button>
      <button class="btn" id="bulk">${icon('percent')} Toplu fiyat</button><button class="btn" id="mkt">${icon('store')} Pazaryerine gönder</button><button class="btn" id="camadd">${icon('camera')} Okutarak ekle</button><button class="btn" id="kat">${icon('grid')} Hazır katalogdan ekle</button><button class="btn primary" id="add">${icon('plus')} Yeni ürün</button>`) +
      `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ürün adı veya barkod...')}
        <select class="input" id="cf" style="max-width:200px"><option value="">Tüm kategoriler</option>${db.all('cats').map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
        <div class="seg" id="sf"><button data-s="" class="active">Tümü</button><button data-s="low">Kritik</button><button data-s="neg">Eksi</button></div></div><div id="tbl"></div></div>`;
    const draw = () => {
      let rows = db.all('products').filter((p) => NS.match(q, p.name, p.barcode, p.plu) && (!cf || p.cat === cf));
      if (sf === 'low') rows = rows.filter((p) => p.stock <= p.min); if (sf === 'neg') rows = rows.filter((p) => p.stock < 0);
      rows.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      $('#tbl', el).innerHTML = table({
        rows, emptyIcon: 'box',
        columns: [
          { label: 'Ürün', render: (p) => `<div class="row nw">${p.image ? `<img class="pthumb" src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="dot" style="background:${cat(p.cat).color}"></span>`}<div><b>${esc(p.name)}</b>${p.fav ? ' <span style="color:var(--warn)">★</span>' : ''}<div class="small faint mono">${esc(p.barcode || (p.plu ? 'PLU ' + p.plu : '-'))}</div></div></div>` },
          { label: 'Kategori', render: (p) => esc(cat(p.cat).name) },
          { label: 'Alış', cls: 'right', render: (p) => money(p.buy) },
          { label: 'Satış', cls: 'right', render: (p) => `<b>${money(p.price)}</b>` },
          { label: 'Kâr', cls: 'right', render: (p) => { const m = p.buy ? ((p.price - p.buy) / p.buy) * 100 : 0; return badge('%' + Math.round(m), m < 15 ? 'warn' : 'ok'); } },
          { label: 'KDV', cls: 'right', render: (p) => '%' + p.vat },
          { label: 'Stok', cls: 'right', render: (p) => (p.stock <= p.min ? badge(qtyFmt(p.stock, p.unit), 'err') : qtyFmt(p.stock, p.unit)) },
        ],
        actions: [{ icon: 'tag', act: 'label', title: 'Etiket' }, { icon: 'layers', act: 'moves', title: 'Hareketler' }, { icon: 'edit', act: 'edit' }, { icon: 'trash', act: 'del' }],
        foot: `${rows.length} ürün · Stok değeri (alış): <b>${money(sum(rows, (p) => Math.max(0, p.stock) * p.buy))}</b> · (satış): <b>${money(sum(rows, (p) => Math.max(0, p.stock) * p.price))}</b>`,
      });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#cf', el).onchange = (e) => { cf = e.target.value; draw(); };
    on(el, 'click', '[data-s]', (e, t) => { sf = t.dataset.s; $$('[data-s]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    $('#add', el).onclick = async () => { if (await productForm()) draw(); };
    $('#kat', el).onclick = () => catalogWizard(draw);
    $('#camadd', el).onclick = () => NS.scan({ title: 'Ürün barkodunu okut', onCode: (code) => { setTimeout(async () => { const ex = findByCode(code); if (ex) { toast(`"${ex.name}" zaten kayıtlı, düzenleme açıldı`); if (await productForm(ex)) draw(); return; } const hit = await katalogBarkod(code); if (await productForm({ barcode: code, ...(hit ? { name: hit.name, image: hit.image, brand: hit.brand } : {}) })) draw(); }, 280); } });
    $('#mkt', el).onclick = async () => {
      if (!NS.integ) return;
      const v = await formModal({ title: 'Pazaryeri senkronu', fields: [{ name: 'scope', label: 'Gönderilecek ürünler', type: 'select', options: [{ value: 'all', label: 'Tüm barkodlu ürünler' }, { value: 'fav', label: 'Sadece favoriler' }, { value: 'stock', label: 'Stokta olanlar' }] }, { name: 'markup', label: 'Pazaryeri fiyat farkı (%)', type: 'number', value: 12 }, { name: 'what', label: 'Gönderim', type: 'select', options: [{ value: 'urun', label: 'Ürün + fiyat + stok' }, { value: 'stok', label: 'Sadece stok ve fiyat' }] }] });
      if (!v) return;
      const items = db.all('products', (p) => p.barcode && (v.scope === 'all' || (v.scope === 'fav' ? p.fav : p.stock > 0))).map((p) => ({ barcode: p.barcode, name: p.name, category: cat(p.cat).name, price: r2(p.price * (1 + (Number(v.markup) || 0) / 100)), vat: p.vat, stock: Math.max(0, Math.floor(p.stock)) }));
      const r = await NS.integ.call('pazaryeri', v.what === 'urun' ? 'urun-gonder' : 'stok-fiyat', { items });
      if (r && r.ok) toast(`${items.length} ürün pazaryerine iletildi`, 'ok');
    };
    on(el, 'click', '[data-act]', async (e, t) => {
      const p = P(t.dataset.id);
      if (t.dataset.act === 'edit') { if (await productForm(p)) draw(); }
      else if (t.dataset.act === 'del') { if (await confirm(`"${p.name}" silinsin mi?`)) { db.remove('products', p.id); draw(); } }
      else if (t.dataset.act === 'label') labelsModal([p.id]);
      else if (t.dataset.act === 'moves') movesModal(p);
    });
    $('#exp', el).onclick = () => NS.csv('urunler', db.all('products'), [{ key: 'barcode', label: 'Barkod' }, { key: 'name', label: 'Ürün' }, { label: 'Kategori', value: (p) => cat(p.cat).name }, { key: 'buy', label: 'Alış' }, { key: 'price', label: 'Satış' }, { key: 'vat', label: 'KDV' }, { key: 'stock', label: 'Stok' }, { key: 'unit', label: 'Birim' }]);
    $('#imp', el).onclick = async () => {
      const ok = await confirm('CSV sütunları: Barkod;Ürün;Kategori;Alış;Satış;KDV;Stok;Birim. Mevcut barkodlar güncellenir, yeniler eklenir. Dosya seçilsin mi?', { title: 'İçe Aktar', ok: 'Dosya seç', danger: false });
      if (!ok) return;
      const t = await NS.readFile(); if (!t) return;
      let add = 0, upd = 0;
      NS.parseCsv(t).forEach((r) => {
        const name = r['Ürün'] || r.name; if (!name) return;
        let c = db.find('cats', (x) => x.name === (r['Kategori'] || 'Genel'));
        if (!c) c = db.insert('cats', { name: r['Kategori'] || 'Genel', color: pick(NS.PALETTE) }, true);
        const rec = { barcode: r['Barkod'] || genBarcode(), name, cat: c.id, buy: Number(String(r['Alış'] || 0).replace(',', '.')), price: Number(String(r['Satış'] || 0).replace(',', '.')), vat: Number(r['KDV'] || 20), stock: Number(String(r['Stok'] || 0).replace(',', '.')), unit: r['Birim'] === 'kg' ? 'kg' : 'adet', min: 5 };
        const ex = db.find('products', (p) => p.barcode === rec.barcode);
        if (ex) { Object.assign(ex, rec); upd++; } else { db.insert('products', rec, true); add++; }
      });
      db.save(); toast(`${add} ürün eklendi, ${upd} ürün güncellendi`, 'ok'); draw();
    };
    $('#bulk', el).onclick = async () => {
      const v = await formModal({ title: 'Toplu Fiyat Güncelleme', fields: [{ name: 'cat', label: 'Kategori', type: 'select', empty: 'Tüm ürünler', options: db.all('cats').map((c) => ({ value: c.id, label: c.name })) }, { name: 'pct', label: 'Değişim (%)', type: 'number', hint: 'Zam için pozitif, indirim için negatif', required: true }, { name: 'round', label: 'Fiyatları ,90 / ,50 olarak yuvarla', type: 'checkbox', value: true }] });
      if (!v || !v.pct) return;
      let n = 0;
      db.all('products').filter((p) => !v.cat || p.cat === v.cat).forEach((p) => {
        let np = p.price * (1 + v.pct / 100);
        if (v.round) np = np < 20 ? Math.round(np * 2) / 2 : Math.floor(np) + 0.9;
        db.insert('priceLog', { pid: p.id, old: p.price, new: r2(np), user: NS.currentUser && NS.currentUser.name }, true);
        p.price = r2(np); n++;
      });
      db.log('Toplu fiyat', `%${v.pct} · ${n} ürün`); db.save(); toast(`${n} ürünün fiyatı güncellendi`, 'ok'); draw();
    };
    draw();
  }
  function movesModal(p) {
    const mv = db.all('moves', (m) => m.pid === p.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
    const sales = db.all('sales').filter((s) => s.items.some((i) => i.pid === p.id));
    const sold = sum(sales.filter((s) => s.type === 'sale'), (s) => sum(s.items.filter((i) => i.pid === p.id), (i) => i.qty));
    const prices = db.all('priceLog', (x) => x.pid === p.id).slice(-10).reverse();
    modal({
      title: p.name, size: 'wide',
      body: `<div class="grid g3 mb">${kpi('Mevcut stok', qtyFmt(p.stock, p.unit), 'box')}${kpi('Toplam satılan', qtyFmt(sold, p.unit), 'cart', 'ok')}${kpi('Satış adedi (fiş)', num(sales.length), 'receipt', 'info')}</div>
        <div class="tabs"><button class="active">Stok hareketleri</button></div>
        ${table({ rows: mv, empty: 'Hareket yok', columns: [{ label: 'Tarih', render: (m) => NS.dt(m.at) }, { label: 'Tür', render: (m) => badge(m.type, m.qty > 0 ? 'ok' : 'info') }, { label: 'Belge', key: 'ref' }, { label: 'Miktar', cls: 'right', render: (m) => `<b style="color:${m.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${m.qty > 0 ? '+' : ''}${num(m.qty)}</b>` }] })}
        ${prices.length ? `<h3 class="mt mb">Fiyat geçmişi</h3>${table({ rows: prices, columns: [{ label: 'Tarih', render: (x) => NS.dt(x.created) }, { label: 'Eski', render: (x) => money(x.old) }, { label: 'Yeni', render: (x) => `<b>${money(x.new)}</b>` }, { label: 'Kullanıcı', key: 'user' }] })}` : ''}`,
      actions: [{ label: 'Stok düzelt', icon: 'edit', onClick: async (c) => { c(); const v = await NS.prompt('Yeni stok miktarı', p.stock, { title: 'Stok düzeltme', type: 'number' }); if (v !== null && v !== '') { const n = Number(v); db.insert('moves', { at: new Date().toISOString(), pid: p.id, qty: r2(n - p.stock), type: 'Düzeltme', ref: NS.currentUser ? NS.currentUser.name : '' }, true); p.stock = n; db.save(); toast('Stok güncellendi', 'ok'); } } }, { label: 'Kapat' }],
    });
  }

  // ---------- Etiket basımı: şablon seçimi, canlı önizleme, tasarımcı ----------
  const lbOpt = () => db.settings().labelOpt || { tpl: '', roll: false };
  const lbPreview = (tplId, p) => { const t = NS.labels.tpls(db).find((x) => x.id === tplId) || NS.labels.tpls(db)[0]; const k = Math.min(2.2, 300 / (t.w * 3.78)); return `<div class="lbp" style="width:${t.w * 3.78 * k}px;height:${t.h * 3.78 * k}px"><div style="transform:scale(${k});transform-origin:0 0">${NS.labels.labelHtml(t, p || { name: 'Örnek Ürün 1 L', price: 49.9, barcode: '8690000000001' }, { biz: S().bizName, cat: p ? cat(p.cat).name : 'Genel' })}</div></div><div class="small muted center mt">${esc(t.name)} · ${t.w}×${t.h} mm</div>`; };
  const tplOptions = (sel) => NS.labels.tpls(db).map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  function labelDesigner(onDone) {
    const sample = db.all('products').find((p) => p.barcode) || { name: 'Örnek Ürün', price: 49.9, barcode: '8690000000001' };
    modal({ title: 'Etiket şablonları', size: 'xl', body: '<div id="ldx"></div>', onOpen: (b) => NS.labels.designer($('#ldx', b), db, sample, (id) => { db.settings().labelOpt = { ...lbOpt(), tpl: id }; db.save(); }), onClose: () => onDone && onDone() });
  }
  function labelsModal(ids) {
    const ps = ids.map(P).filter(Boolean); if (!ps.length) return; const o = lbOpt();
    modal({ title: ps.length === 1 ? `Etiket: ${ps[0].name}` : `${ps.length} ürün için etiket`, size: 'wide',
      body: `<div class="lbm"><div class="lbm-p" id="lpv">${lbPreview(o.tpl, ps[0])}</div><div class="lbm-o">
        <div class="field"><label>Şablon</label><select class="input" id="ltp">${tplOptions(o.tpl)}</select></div>
        <div class="field"><label>Çıktı</label><div class="seg" id="lro"><button data-r="0" class="${o.roll ? '' : 'active'}">A4 sayfa</button><button data-r="1" class="${o.roll ? 'active' : ''}">Etiket yazıcısı</button></div></div>
        <div class="field"><label>Her üründen adet</label><input class="input" type="number" min="1" id="lcp" value="1"></div>
        <button class="btn ghost sm" id="led">${icon('edit')} Şablonları düzenle</button></div></div>`,
      onOpen: (b) => {
        let roll = !!o.roll;
        $('#ltp', b).onchange = (e) => { $('#lpv', b).innerHTML = lbPreview(e.target.value, ps[0]); };
        on(b, 'click', '[data-r]', (e, t) => { roll = t.dataset.r === '1'; $$('[data-r]', b).forEach((x) => x.classList.toggle('active', x === t)); });
        $('#led', b).onclick = () => labelDesigner(() => { $('#ltp', b).innerHTML = tplOptions($('#ltp', b).value); $('#lpv', b).innerHTML = lbPreview($('#ltp', b).value, ps[0]); });
        b._get = () => ({ tpl: $('#ltp', b).value, roll, copies: Math.max(1, Number($('#lcp', b).value) || 1) });
      },
      actions: [{ label: 'Kapat' }, { label: 'Yazdır', cls: 'primary', icon: 'print', onClick: (c, b) => { const g = b._get(); db.settings().labelOpt = { tpl: g.tpl, roll: g.roll }; db.save(); NS.labels.print(db, ps.map((p) => ({ ...p, copies: g.copies })), g.tpl, { roll: g.roll }); c(); } }] });
  }

  function labelsPage(el) {
    const sel = new Map(); let q = ''; const o = lbOpt(); let tpl = o.tpl || NS.labels.tpls(db)[0].id, roll = !!o.roll;
    el.innerHTML = pageHead('Etiket & Barkod Basımı', 'Raf, barkod ve fiyat etiketlerini kendi şablonunuzla basın', `<button class="btn" id="cam">${icon('camera')} Okutarak seç</button><button class="btn" id="chg">${icon('refresh')} Fiyatı değişenler</button><button class="btn" id="ed">${icon('edit')} Şablonları düzenle</button>`) +
      `<div class="lbw"><div class="card"><div class="card-h">${NS.searchBox('q', 'Ürün adı veya barkod...')}<button class="btn sm ghost" id="all">Görünenleri seç</button><button class="btn sm ghost" id="none">Temizle</button></div><div id="tbl"></div></div>
        <aside class="card pad lbs"><h3>Önizleme</h3><div id="pv"></div>
          <div class="field mt"><label>Şablon</label><select class="input" id="tp">${tplOptions(tpl)}</select></div>
          <div class="field"><label>Çıktı</label><div class="seg" id="ro"><button data-r="0" class="${roll ? '' : 'active'}">A4 sayfa</button><button data-r="1" class="${roll ? 'active' : ''}">Etiket yazıcısı</button></div></div>
          <div class="lbs-sum" id="sum"></div><button class="btn primary block" id="pr">${icon('print')} Seçilenleri yazdır</button></aside></div>`;
    const first = () => P([...sel.keys()][0]) || db.all('products').find((p) => p.barcode);
    const side = () => { $('#pv', el).innerHTML = lbPreview(tpl, first()); const n = [...sel.values()].reduce((a, b) => a + b, 0); $('#sum', el).innerHTML = sel.size ? `<b>${sel.size}</b> ürün · <b>${n}</b> etiket` : 'Listeden ürün seçin veya kamerayla okutun'; };
    const draw = () => {
      const rows = db.all('products').filter((p) => NS.match(q, p.name, p.barcode, p.plu)).sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || a.name.localeCompare(b.name, 'tr'));
      $('#tbl', el).innerHTML = table({ rows, emptyIcon: 'tag', columns: [{ label: '', render: (p) => `<input type="checkbox" data-c="${p.id}" ${sel.has(p.id) ? 'checked' : ''}>` }, { label: 'Ürün', render: (p) => `<b>${esc(p.name)}</b>` }, { label: 'Barkod', render: (p) => `<span class="mono">${esc(p.barcode || 'PLU ' + (p.plu || '-'))}</span>` }, { label: 'Fiyat', cls: 'right', render: (p) => money(p.price) }, { label: 'Adet', cls: 'right', render: (p) => `<input class="input" type="number" min="1" style="width:72px;text-align:right" data-n="${p.id}" value="${sel.get(p.id) || 1}" ${sel.has(p.id) ? '' : 'disabled'}>` }] });
      side();
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'change', '[data-c]', (e, t) => { t.checked ? sel.set(t.dataset.c, 1) : sel.delete(t.dataset.c); const n = $(`[data-n="${t.dataset.c}"]`, el); if (n) n.disabled = !t.checked; side(); });
    on(el, 'input', '[data-n]', (e, t) => { if (sel.has(t.dataset.n)) sel.set(t.dataset.n, Math.max(1, Number(t.value) || 1)); side(); });
    $('#tp', el).onchange = (e) => { tpl = e.target.value; db.settings().labelOpt = { tpl, roll }; db.save(); side(); };
    on(el, 'click', '[data-r]', (e, t) => { roll = t.dataset.r === '1'; $$('[data-r]', el).forEach((x) => x.classList.toggle('active', x === t)); db.settings().labelOpt = { tpl, roll }; db.save(); });
    $('#all', el).onclick = () => { db.all('products').filter((p) => NS.match(q, p.name, p.barcode, p.plu)).forEach((p) => sel.has(p.id) || sel.set(p.id, 1)); draw(); };
    $('#none', el).onclick = () => { sel.clear(); draw(); };
    $('#ed', el).onclick = () => labelDesigner(() => { $('#tp', el).innerHTML = tplOptions(tpl); if (!NS.labels.tpls(db).some((t) => t.id === tpl)) tpl = NS.labels.tpls(db)[0].id; side(); });
    $('#cam', el).onclick = () => NS.scan({ title: 'Etiket için okut', hint: 'Okuttuğunuz her ürün listeye eklenir', continuous: true, onCode: (code) => { const p = findByCode(code); if (!p) { NS.beep(220, 180); toast('Barkod kayıtlı değil: ' + code, 'err'); return; } sel.set(p.id, (sel.get(p.id) || 0) + 1); toast(`${p.name} · ${sel.get(p.id)} etiket`, 'ok'); draw(); } });
    $('#pr', el).onclick = () => { if (!sel.size) return toast('Ürün seçin', 'err'); NS.labels.print(db, [...sel].map(([id, n]) => ({ ...P(id), copies: n })).filter((p) => p.id), tpl, { roll }); };
    $('#chg', el).onclick = () => { const since = addDays(new Date(), -7).toISOString(); db.all('priceLog', (x) => x.created > since).forEach((x) => sel.has(x.pid) || sel.set(x.pid, 1)); draw(); toast(`${sel.size} ürün seçildi`); };
    draw();
  }
  const findByCode = (code) => { code = String(code || '').trim(); return db.find('products', (x) => x.barcode === code) || (code.length <= 6 ? db.find('products', (x) => String(x.plu || '') === code) : null) || (code.startsWith(S().weighPrefix) && code.length === 13 ? db.find('products', (x) => String(x.plu || '') === code.slice(2, 7)) : null); };

  // ---------- Stok / Sayım ----------
  function stockPage(el) {
    el.innerHTML = pageHead('Stok Yönetimi', 'Kritik stoklar, hareketler ve stok sayımı', `<button class="btn primary" id="count">${icon('camera')} ${db.data.countDraft && Object.keys(db.data.countDraft.counted || {}).length ? 'Sayıma devam et' : 'Yeni sayım başlat'}</button>`) +
      `<div class="grid g4 mb" id="k"></div><div class="tabs" id="tabs"><button data-tab="crit" class="active">Kritik stok</button><button data-tab="moves">Hareketler</button><button data-tab="counts">Sayımlar</button><button data-tab="order">Sipariş önerisi</button></div><div class="card" id="body"></div>`;
    const ps = db.all('products');
    $('#k', el).innerHTML = kpi('Toplam ürün', num(ps.length), 'box') + kpi('Kritik stok', num(ps.filter((p) => p.stock <= p.min).length), 'alert', 'err') + kpi('Stok değeri (alış)', money(sum(ps, (p) => Math.max(0, p.stock) * p.buy)), 'wallet', 'info') + kpi('Potansiyel ciro', money(sum(ps, (p) => Math.max(0, p.stock) * p.price)), 'trend', 'ok');
    const show = (t) => {
      $$('[data-tab]', el).forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
      const body = $('#body', el);
      if (t === 'crit') body.innerHTML = table({ rows: db.all('products', (p) => p.stock <= p.min).sort((a, b) => a.stock - b.stock), empty: 'Kritik stokta ürün yok', columns: [{ label: 'Ürün', render: (p) => `<b>${esc(p.name)}</b>` }, { label: 'Kategori', render: (p) => esc(cat(p.cat).name) }, { label: 'Stok', cls: 'right', render: (p) => badge(qtyFmt(p.stock, p.unit), 'err') }, { label: 'Kritik', cls: 'right', render: (p) => num(p.min) }] });
      else if (t === 'moves') body.innerHTML = table({ rows: db.all('moves').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 300), empty: 'Henüz stok hareketi yok', columns: [{ label: 'Tarih', render: (m) => NS.dt(m.at) }, { label: 'Ürün', render: (m) => esc((P(m.pid) || {}).name || '-') }, { label: 'Tür', render: (m) => badge(m.type, m.qty > 0 ? 'ok' : 'info') }, { label: 'Belge', key: 'ref' }, { label: 'Miktar', cls: 'right', render: (m) => `<b style="color:${m.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${m.qty > 0 ? '+' : ''}${num(m.qty)}</b>` }] });
      else if (t === 'counts') body.innerHTML = table({ rows: db.all('counts').slice().reverse(), empty: 'Henüz sayım yapılmadı', columns: [{ label: 'Tarih', render: (c) => NS.dt(c.created) }, { label: 'Kapsam', key: 'scope' }, { label: 'Sayılan', cls: 'right', render: (c) => num(c.items.length) }, { label: 'Fark (adet)', cls: 'right', render: (c) => num(sum(c.items, (i) => i.diff)) }, { label: 'Fark (₺)', cls: 'right', render: (c) => `<b>${money(sum(c.items, (i) => i.diff * i.buy))}</b>` }] });
      else if (t === 'order') {
        const since = addDays(new Date(), -14).toISOString();
        const sold = {};
        db.all('sales', (s) => s.at > since && s.type === 'sale').forEach((s) => s.items.forEach((i) => { sold[i.pid] = (sold[i.pid] || 0) + i.qty; }));
        const rows = db.all('products').map((p) => { const daily = (sold[p.id] || 0) / 14; const need = Math.ceil(daily * 10 + p.min - p.stock); return { ...p, daily, need }; }).filter((p) => p.need > 0).sort((a, b) => b.need - a.need);
        body.innerHTML = `<div class="card-h"><span class="muted small grow">Son 14 günlük satış hızına göre 10 günlük ihtiyaç hesaplanır.</span><button class="btn sm" id="oexp">${icon('download')} Listeyi indir</button></div>` + table({ rows, empty: 'Sipariş önerisi yok', columns: [{ label: 'Ürün', render: (p) => `<b>${esc(p.name)}</b>` }, { label: 'Günlük satış', cls: 'right', render: (p) => num(p.daily) }, { label: 'Stok', cls: 'right', render: (p) => num(p.stock) }, { label: 'Önerilen sipariş', cls: 'right', render: (p) => badge(num(p.need) + ' ' + p.unit, 'acc') }, { label: 'Tahmini maliyet', cls: 'right', render: (p) => money(p.need * p.buy) }] });
        const b = $('#oexp', el); if (b) b.onclick = () => NS.csv('siparis-onerisi', rows, [{ key: 'name', label: 'Ürün' }, { key: 'stock', label: 'Stok' }, { key: 'need', label: 'Sipariş' }, { label: 'Maliyet', value: (p) => p.need * p.buy }]);
      }
    };
    on(el, 'click', '[data-tab]', (e, t) => show(t.dataset.tab));
    $('#count', el).onclick = countModal;
    show('crit');
  }
  // Sayım: okut → miktarı gir → sıradaki. Taslak saklanır; bitirirken eksik/fazla özeti gösterilir ve onay istenir.
  function countModal() {
    const D = db.data.countDraft;
    const start = (resume) => { if (!resume) { db.data.countDraft = { started: new Date().toISOString(), counted: {} }; db.save(); } countUI(); };
    if (D && Object.keys(D.counted || {}).length) {
      modal({ title: 'Yarım kalan sayım var', body: `<p>${NS.dt(D.started)} tarihinde başlatılan sayımda <b>${Object.keys(D.counted).length} ürün</b> sayılmış. Kaldığınız yerden devam edebilir veya baştan başlayabilirsiniz.</p>`,
        actions: [{ label: 'Baştan başla', onClick: async (c) => { c(); if (await confirm('Yarım kalan sayım silinecek. Emin misiniz?', { ok: 'Sil ve baştan başla' })) start(false); } }, { label: 'Kaldığım yerden devam et', cls: 'primary', icon: 'play', onClick: (c) => { c(); start(true); } }] });
    } else start(false);
  }
  function countUI() {
    const D = db.data.countDraft; const C = D.counted; let cf = '', only = false, q = '';
    const save = () => { D.updated = new Date().toISOString(); db.save(); };
    const put = (p, n, mode) => { const v = r2(mode === 'set' ? n : (C[p.id] || 0) + n); if (v < 0) return; C[p.id] = v; save(); };
    modal({ title: 'Stok Sayımı', size: 'xl', closable: true,
      body: `<div class="cnt-top">
          <button class="cnt-cam" id="ccam">${icon('camera')}<span><b>Kamerayla okut</b><small>Okut → miktarı gir → sıradaki</small></span></button>
          <div class="cnt-in"><div class="search">${icon('barcode')}<input class="input" id="cb" placeholder="Barkod okuyucu ile okutun veya barkod yazıp Enter" autocomplete="off" inputmode="numeric"></div><div class="cnt-q" id="cq" hidden></div></div>
          <div class="cnt-k" id="ck"></div></div>
        <div class="row mt mb" style="gap:8px;flex-wrap:wrap"><div class="seg" id="cs"><button class="active" data-o="0">Tüm ürünler</button><button data-o="1">Sayılanlar</button></div><select class="input" id="cc" style="max-width:220px"><option value="">Tüm kategoriler</option>${db.all('cats').map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><input class="input" id="cfq" placeholder="Listede ara…" style="max-width:240px"></div>
        <div id="cl" class="cnt-l"></div>`,
      onOpen: (b) => {
        const kp = () => { const ks = Object.keys(C); const sys = db.all('products').length; $('#ck', b).innerHTML = `<div><b>${num(ks.length)}</b><span>sayılan ürün</span></div><div><b>${num(sum(ks, (k) => C[k]))}</b><span>toplam miktar</span></div><div><b>%${sys ? Math.round((ks.length / sys) * 100) : 0}</b><span>tamamlandı</span></div>`; };
        const draw = () => {
          const rows = db.all('products').filter((p) => (!cf || p.cat === cf) && (!only || C[p.id] !== undefined) && NS.match(q, p.name, p.barcode));
          $('#cl', b).innerHTML = table({ rows, empty: only ? 'Henüz sayılan ürün yok — okutmaya başlayın' : 'Ürün yok', columns: [{ label: 'Ürün', render: (p) => `<b>${esc(p.name)}</b><div class="small faint mono">${esc(p.barcode || '')}</div>` }, { label: 'Sistem', cls: 'right', render: (p) => qtyFmt(p.stock, p.unit) }, { label: 'Sayılan', cls: 'right', render: (p) => `<input class="input" style="width:100px;text-align:right" type="number" step="0.001" min="0" data-cn="${p.id}" value="${C[p.id] ?? ''}">` }, { label: 'Fark', cls: 'right', render: (p) => (C[p.id] === undefined ? '<span class="faint">—</span>' : diffBadge(r2(C[p.id] - p.stock))) }] });
          kp();
        };
        // El okuyucusu / klavye: barkod → miktar → Enter → sıradaki
        const ask = (p) => {
          const box = $('#cq', b); box.hidden = false;
          box.innerHTML = `<div class="cnt-qi"><b>${esc(p.name)}</b><span>Sistem: ${qtyFmt(p.stock, p.unit)}${C[p.id] !== undefined ? ` · Sayılan: <b>${num(C[p.id])}</b>` : ''}</span></div><input class="input" type="number" step="${p.unit === 'kg' ? '0.001' : '1'}" min="0" id="cqn" value="1" inputmode="decimal"><button class="btn primary" data-q="add">${icon('plus')} Ekle</button><button class="btn" data-q="set">Yerine yaz</button><button class="btn ghost icon" data-q="x" title="Vazgeç">${icon('x')}</button>`;
          const n = $('#cqn', box); n.focus(); n.select();
          const done = (mode) => { if (mode !== 'x') { const v = Number(n.value); if (!(v >= 0)) return toast('Geçerli bir miktar girin', 'err'); put(p, v, mode); NS.beep(); } box.hidden = true; draw(); $('#cb', b).focus(); };
          n.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); done(e.shiftKey ? 'set' : 'add'); } if (e.key === 'Escape') { e.stopPropagation(); done('x'); } };
          box.onclick = (e) => { const t = e.target.closest('[data-q]'); if (t) done(t.dataset.q); };
        };
        $('#cb', b).onkeydown = (e) => { if (e.key !== 'Enter') return; const v = e.target.value.trim(); e.target.value = ''; if (!v) return; const p = findByCode(v) || (v.length > 2 ? db.find('products', (x) => NS.match(v, x.name)) : null); if (!p) { NS.beep(200, 200); return toast('Barkod bulunamadı: ' + v, 'err'); } ask(p); };
        // Kamera: sürekli okuma; her okutmada miktar penceresi açılır, onaylanınca bir sonrakine geçer
        $('#ccam', b).onclick = () => NS.scan({ title: 'Stok sayımı', hint: 'Ürünün barkodunu okutun', continuous: true, onCode: (code, ov) => new Promise((res) => {
          const p = findByCode(code); const sh = document.createElement('div'); sh.className = 'nv-scan-sheet';
          sh.innerHTML = p ? `<div class="ss-h"><b>${esc(p.name)}</b><span>Sistem: ${qtyFmt(p.stock, p.unit)}${C[p.id] !== undefined ? ` · Şu ana kadar sayılan: <b>${num(C[p.id])}</b>` : ''}</span></div>
              <div class="ss-q"><button data-s="-">−</button><input type="number" inputmode="decimal" step="${p.unit === 'kg' ? '0.001' : '1'}" min="0" value="1"><button data-s="+">+</button></div>
              <div class="ss-a"><button class="btn ghost" data-s="x">Atla</button><button class="btn" data-s="set">Yerine yaz</button><button class="btn primary" data-s="add">${icon('check')} Ekle · sıradaki</button></div>`
            : `<div class="ss-h"><b>Bu barkod ürünlerinizde yok</b><span class="mono">${esc(code)}</span></div><div class="ss-a"><button class="btn primary" data-s="x">Tamam, sıradaki</button></div>`;
          if (!p) NS.beep(220, 220); ov.appendChild(sh); requestAnimationFrame(() => sh.classList.add('on'));
          const inp = $('input', sh); if (inp) { inp.focus(); inp.select(); }
          const fin = (mode) => { if (p && mode !== 'x') { const v = Number(inp.value); if (!(v >= 0)) return; put(p, v, mode); const l = $('.nv-scan-last', ov); if (l) { l.hidden = false; l.textContent = `✓ ${p.name}: ${num(C[p.id])}`; } } sh.classList.remove('on'); setTimeout(() => sh.remove(), 200); res(); };
          sh.onclick = (e) => { const t = e.target.closest('[data-s]'); if (!t) return; const s = t.dataset.s; if (s === '+' || s === '-') { inp.value = Math.max(0, r2((Number(inp.value) || 0) + (s === '+' ? 1 : -1))); return; } fin(s); };
          if (inp) inp.onkeydown = (e) => { if (e.key === 'Enter') fin('add'); };
        }) }) && (() => { const iv = setInterval(() => { if (!document.querySelector('.nv-scan')) { clearInterval(iv); draw(); $('#cb', b) && $('#cb', b).focus(); } }, 400); })();
        on(b, 'click', '[data-o]', (e, t) => { only = t.dataset.o === '1'; $$('[data-o]', b).forEach((x) => x.classList.toggle('active', x === t)); draw(); });
        $('#cc', b).onchange = (e) => { cf = e.target.value; draw(); };
        $('#cfq', b).oninput = (e) => { q = e.target.value; draw(); };
        on(b, 'change', '[data-cn]', (e, t) => { if (t.value === '') delete C[t.dataset.cn]; else C[t.dataset.cn] = Math.max(0, Number(t.value)); save(); draw(); });
        draw(); setTimeout(() => $('#cb', b).focus(), 60);
      },
      actions: [
        { label: 'Sayımı iptal et', cls: 'ghost', onClick: async (c) => { if (!(await confirm('Bu sayımdaki tüm girişler silinecek. Stoklar değişmez.', { ok: 'Sayımı iptal et' }))) return; delete db.data.countDraft; db.save(); c(); toast('Sayım iptal edildi'); } },
        { label: 'Taslak olarak kapat', onClick: (c) => { save(); c(); toast('Sayım saklandı; "Yeni sayım başlat" ile kaldığınız yerden devam edebilirsiniz'); } },
        { label: 'Sayımı bitir', cls: 'primary', icon: 'check', onClick: (c) => { if (!Object.keys(C).length) return toast('Henüz sayılan ürün yok', 'err'); save(); c(); countSummary(); } },
      ] });
  }
  const diffBadge = (d) => (d === 0 ? badge('Eşit', 'info') : d < 0 ? badge(num(d) + ' eksik', 'err') : badge('+' + num(d) + ' fazla', 'ok'));
  function countSummary() {
    const D = db.data.countDraft; const C = D.counted;
    const rows = Object.entries(C).map(([pid, q]) => { const p = P(pid); return p ? { id: pid, name: p.name, unit: p.unit, system: p.stock, counted: q, diff: r2(q - p.stock), buy: p.buy || 0 } : null; }).filter(Boolean);
    const eksik = rows.filter((r) => r.diff < 0).sort((a, b) => a.diff * a.buy - b.diff * b.buy), fazla = rows.filter((r) => r.diff > 0).sort((a, b) => b.diff * b.buy - a.diff * a.buy);
    const uncounted = db.all('products').filter((p) => C[p.id] === undefined && p.stock);
    const val = (L) => r2(sum(L, (r) => r.diff * r.buy));
    const list = (L, e) => (L.length ? table({ rows: L.slice(0, 50), columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.name)}</b>` }, { label: 'Sistem → Sayılan', cls: 'right', render: (r) => `${num(r.system)} → <b>${num(r.counted)}</b>` }, { label: 'Fark', cls: 'right', render: (r) => diffBadge(r.diff) }, { label: 'Tutar', cls: 'right', render: (r) => money(r.diff * r.buy) }] }) : `<div class="empty small">${e}</div>`);
    modal({ title: 'Sayım özeti', size: 'xl',
      body: `<div class="grid g4 mb">${kpi('Sayılan ürün', num(rows.length), 'list')}${kpi('Eksik çıkan', `${num(eksik.length)} ürün · ${money(val(eksik))}`, 'alert', 'err')}${kpi('Fazla çıkan', `${num(fazla.length)} ürün · ${money(val(fazla))}`, 'trend', 'ok')}${kpi('Net fark (alış fiyatıyla)', money(val(rows)), 'wallet', val(rows) < 0 ? 'err' : 'ok')}</div>
        <div class="grid g2"><div class="card"><div class="card-h"><b>Eksik çıkanlar</b></div>${list(eksik, 'Eksik çıkan ürün yok')}</div><div class="card"><div class="card-h"><b>Fazla çıkanlar</b></div>${list(fazla, 'Fazla çıkan ürün yok')}</div></div>
        ${uncounted.length ? `<label class="check mt"><input type="checkbox" id="zero"> Sayılmayan ${num(uncounted.length)} ürünün stoğunu sıfırla <span class="muted small">(yalnızca tam sayımda işaretleyin)</span></label>` : ''}
        <div class="cnt-ask">${icon('alert')}<div><b>Sayım sonuçları mevcut stokların üzerine yazılsın mı?</b><p>Sayılan ürünlerin stoğu sayılan miktarla değiştirilir, farklar stok hareketlerine "Sayım" olarak işlenir ve sayım raporu kaydedilir. Bu işlem geri alınamaz.</p></div></div>`,
      actions: [{ label: 'Sayıma geri dön', icon: 'left', onClick: (c) => { c(); countUI(); } }, { label: 'Evet, stokların üzerine yaz', cls: 'primary', icon: 'check', onClick: (c, b) => {
        const zero = $('#zero', b) && $('#zero', b).checked; const at = new Date().toISOString();
        const items = [...rows, ...(zero ? uncounted.map((p) => ({ id: p.id, name: p.name, system: p.stock, counted: 0, diff: r2(-p.stock), buy: p.buy || 0 })) : [])].map((r) => { const p = P(r.id); if (r.diff) db.insert('moves', { at, pid: r.id, qty: r.diff, type: 'Sayım', ref: 'Sayım' }, true); p.stock = r.counted; return { pid: r.id, name: r.name, system: r.system, counted: r.counted, diff: r.diff, buy: r.buy }; });
        db.insert('counts', { items, scope: zero ? 'Tam sayım' : 'Kısmi sayım', user: NS.currentUser && NS.currentUser.name, started: D.started });
        delete db.data.countDraft; db.log('Stok sayımı', `${items.length} ürün · net ${money(val(items))}`); db.save();
        c(); toast(`Sayım kaydedildi: ${items.length} ürünün stoğu güncellendi`, 'ok'); app.refresh();
      } }] });
  }

  // ---------- Alış faturaları ----------
  function purchasesPage(el) {
    el.innerHTML = pageHead('Alış Faturaları', 'Tedarikçiden mal girişi — stok ve maliyet otomatik güncellenir', `<button class="btn primary" id="add">${icon('plus')} Yeni alış faturası</button>`) + '<div class="card" id="tbl"></div>';
    const draw = () => {
      $('#tbl', el).innerHTML = table({
        rows: db.all('purchases').sort((a, b) => b.at.localeCompare(a.at)), emptyIcon: 'truck', empty: 'Alış faturası yok',
        columns: [{ label: 'No', render: (a) => `<b>${esc(a.no)}</b><div class="small faint">${esc(a.invoiceNo || '')}</div>` }, { label: 'Tarih', render: (a) => NS.date(a.at) }, { label: 'Tedarikçi', render: (a) => esc((db.get('suppliers', a.supplier) || {}).name || '-') }, { label: 'Kalem', cls: 'right', render: (a) => a.items.length }, { label: 'Tutar', cls: 'right', render: (a) => `<b>${money(a.total)}</b>` }, { label: 'Ödeme', render: (a) => (a.paid >= a.total ? badge('Ödendi', 'ok') : a.paid > 0 ? badge('Kısmi ' + money(a.paid), 'warn') : badge('Ödenmedi', 'err')) }],
        actions: [{ icon: 'eye', act: 'view' }],
      });
    };
    on(el, 'click', '[data-act=view]', (e, t) => {
      const a = db.get('purchases', t.dataset.id);
      modal({ title: `Alış ${a.no}`, size: 'wide', body: table({ rows: a.items.map((i, k) => ({ ...i, id: k })), columns: [{ label: 'Ürün', key: 'name' }, { label: 'Miktar', cls: 'right', render: (i) => num(i.qty) }, { label: 'Birim maliyet', cls: 'right', render: (i) => money(i.cost) }, { label: 'Tutar', cls: 'right', render: (i) => `<b>${money(i.qty * i.cost)}</b>` }] }) + `<div class="right mt big">Toplam: ${money(a.total)}</div>` });
    });
    $('#add', el).onclick = () => purchaseModal(draw);
    draw();
  }
  function purchaseModal(done) {
    const items = [];
    modal({
      title: 'Yeni Alış Faturası', size: 'xl',
      body: `<div class="form-grid mb"><div class="field"><label>Tedarikçi *</label><select class="input" id="sup">${db.all('suppliers').map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Fatura no</label><input class="input" id="ino"></div>
        <div class="field"><label>Ödenen tutar (₺)</label><input class="input" type="number" id="paid" value="0"></div><div class="field"><label class="check" style="margin-top:24px"><input type="checkbox" id="upd" checked> Alış fiyatlarını güncelle</label></div></div>
        <div class="row mb"><div class="search grow">${icon('barcode')}<input class="input" id="pb" placeholder="Barkod okut veya ürün adı yaz + Enter"></div></div>
        <div id="pl"></div><div class="right big mt" id="pt"></div>`,
      onOpen: (b) => {
        const draw = () => {
          $('#pl', b).innerHTML = table({ rows: items.map((i, k) => ({ ...i, id: k })), empty: 'Ürün ekleyin', columns: [{ label: 'Ürün', render: (i) => `<b>${esc(i.name)}</b>` }, { label: 'Miktar', render: (i) => `<input class="input" style="width:90px" type="number" step="0.001" data-f="qty" data-k="${i.id}" value="${i.qty}">` }, { label: 'Birim maliyet', render: (i) => `<input class="input" style="width:110px" type="number" step="0.01" data-f="cost" data-k="${i.id}" value="${i.cost}">` }, { label: 'Tutar', cls: 'right', render: (i) => `<b>${money(i.qty * i.cost)}</b>` }, { label: '', render: (i) => `<button class="btn sm ghost icon" data-rm="${i.id}">${icon('x')}</button>` }] });
          $('#pt', b).textContent = 'Toplam: ' + money(sum(items, (i) => i.qty * i.cost));
        };
        on(b, 'change', '[data-f]', (e, t) => { items[t.dataset.k][t.dataset.f] = Number(t.value); draw(); });
        on(b, 'click', '[data-rm]', (e, t) => { items.splice(t.dataset.rm, 1); draw(); });
        $('#pb', b).onkeydown = (e) => {
          if (e.key !== 'Enter') return;
          const v = e.target.value.trim(); e.target.value = '';
          const p = db.find('products', (x) => x.barcode === v) || db.all('products').find((x) => NS.match(v, x.name));
          if (!p) return toast('Ürün bulunamadı', 'err');
          const ex = items.find((i) => i.pid === p.id);
          if (ex) ex.qty++; else items.push({ pid: p.id, name: p.name, qty: 1, cost: p.buy });
          draw();
        };
        draw();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: 'Faturayı kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => {
          if (!items.length) return toast('Ürün ekleyin', 'err');
          const total = r2(sum(items, (i) => i.qty * i.cost));
          const paid = Number($('#paid', b).value) || 0;
          const a = db.insert('purchases', { no: db.nextNo('purchases', 'AF'), at: new Date().toISOString(), supplier: $('#sup', b).value, invoiceNo: $('#ino', b).value, items: items.slice(), total, paid }, true);
          items.forEach((i) => { const p = P(i.pid); p.stock = r2(p.stock + i.qty); if ($('#upd', b).checked) p.buy = i.cost; db.insert('moves', { at: a.at, pid: p.id, qty: i.qty, type: 'Alış', ref: a.no }, true); });
          const s = db.get('suppliers', a.supplier); s.balance = r2((s.balance || 0) + total - paid);
          if (paid) db.insert('cash', { at: a.at, type: 'out', amount: paid, note: `Alış ödemesi ${a.no} - ${s.name}` }, true);
          db.log('Alış faturası', `${a.no} · ${money(total)}`);
          db.save(); c(); toast('Alış faturası kaydedildi, stoklar güncellendi', 'ok'); done();
        },
      }],
    });
  }

  // ---------- Cari: müşteri / tedarikçi ----------
  const CUST_FIELDS = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'card', label: 'Müşteri kart no' }, { name: 'limit', label: 'Veresiye limiti (₺)', type: 'number', value: 2000 }, { name: 'address', label: 'Adres', full: true }, { name: 'note', label: 'Not', type: 'textarea', full: true }];
  function customersPage(el, param, app) {
    NS.crud(el, app, {
      col: 'customers', title: 'Müşteriler & Veresiye', sub: 'Müşteri kartları, veresiye borçları ve sadakat puanları', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users',
      fields: CUST_FIELDS, defaults: { limit: 2000 }, beforeSave: (v, rec) => { if (!rec) { v.balance = 0; v.points = 0; } },
      searchFields: (m) => [m.name, m.phone, m.card],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'debt', label: 'Borçlu', test: (m) => m.balance > 0 }],
      columns: [
        { key: 'name', label: 'Müşteri', render: (m) => `<div class="row nw"><div class="avatar">${esc(NS.initials(m.name))}</div><div><b>${esc(m.name)}</b><div class="small faint">${esc(m.phone || '')}</div></div></div>` },
        { key: 'card', label: 'Kart' },
        { key: 'points', label: 'Puan', cls: 'right', render: (m) => num(m.points) },
        { key: 'balance', label: 'Borç', cls: 'right', render: (m) => (m.balance > 0 ? `<b style="color:var(--err)">${money(m.balance)}</b>` : `<span class="faint">${money(0)}</span>`) },
      ],
      extraActions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat', show: (m) => m.balance > 0 }, { icon: 'file', act: 'ext', title: 'Ekstre' }],
      onAction: async (act, m, draw) => {
        if (act === 'pay') {
          const v = await formModal({ title: `Tahsilat — ${m.name}`, fields: [{ name: 'amount', label: 'Tutar (₺)', type: 'number', step: '0.01', value: m.balance, required: true }, { name: 'type', label: 'Ödeme şekli', type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }, { value: 'havale', label: 'Havale' }] }] });
          if (!v) return;
          m.balance = r2(m.balance - v.amount);
          db.insert('collections', { cid: m.id, amount: v.amount, type: v.type, at: new Date().toISOString(), user: NS.currentUser && NS.currentUser.id }, true);
          if (v.type === 'nakit') db.insert('cash', { at: new Date().toISOString(), type: 'in', amount: v.amount, note: `Tahsilat - ${m.name}` }, true);
          db.log('Tahsilat', `${m.name} · ${money(v.amount)}`); db.save(); toast('Tahsilat kaydedildi', 'ok'); draw();
        } else if (act === 'ext') {
          const rows = [
            ...db.all('sales', (s) => s.customer === m.id).map((s) => ({ id: s.id, at: s.at, desc: `${s.type === 'return' ? 'İade' : 'Satış'} ${s.no}`, debt: sum(s.payments.filter((p) => p.type === 'veresiye'), (p) => p.amount), total: s.total })),
            ...db.all('collections', (c) => c.cid === m.id).map((c) => ({ id: c.id, at: c.at, desc: `Tahsilat (${PAY[c.type] || c.type})`, debt: -c.amount, total: c.amount })),
          ].sort((a, b) => b.at.localeCompare(a.at));
          modal({ title: `Ekstre — ${m.name}`, size: 'wide', body: `<div class="grid g3 mb">${kpi('Güncel borç', money(m.balance), 'wallet', 'err')}${kpi('Toplam alışveriş', money(sum(rows.filter((r) => r.desc.startsWith('Satış')), (r) => r.total)), 'cart', 'ok')}${kpi('Puan', num(m.points), 'gift', 'warn')}</div>` + table({ rows, columns: [{ label: 'Tarih', render: (r) => NS.dt(r.at) }, { label: 'Açıklama', key: 'desc' }, { label: 'Tutar', cls: 'right', render: (r) => money(r.total) }, { label: 'Borç etkisi', cls: 'right', render: (r) => (r.debt ? `<b style="color:${r.debt > 0 ? 'var(--err)' : 'var(--ok)'}">${r.debt > 0 ? '+' : ''}${money(r.debt)}</b>` : '-') }] }) });
        }
      },
    });
  }
  function suppliersPage(el, param, app) {
    NS.crud(el, app, {
      col: 'suppliers', title: 'Tedarikçiler', sub: 'Tedarikçi cari hesapları ve ödemeler', single: 'Tedarikçi', addLabel: 'Yeni tedarikçi', emptyIcon: 'truck',
      fields: [{ name: 'name', label: 'Firma adı', required: true, full: true }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon' }, { name: 'taxNo', label: 'Vergi no' }, { name: 'iban', label: 'IBAN' }, { name: 'address', label: 'Adres', full: true }],
      beforeSave: (v, rec) => { if (!rec) v.balance = 0; },
      columns: [{ key: 'name', label: 'Firma', render: (s) => `<b>${esc(s.name)}</b><div class="small faint">${esc(s.contact || '')}</div>` }, { key: 'phone', label: 'Telefon' }, { label: 'Fatura', cls: 'right', render: (s) => db.all('purchases', (a) => a.supplier === s.id).length }, { key: 'balance', label: 'Borcumuz', cls: 'right', render: (s) => (s.balance > 0 ? `<b style="color:var(--err)">${money(s.balance)}</b>` : money(0)) }],
      extraActions: [{ icon: 'cash', act: 'pay', title: 'Ödeme yap', show: (s) => s.balance > 0 }],
      onAction: async (act, s, draw) => {
        const v = await formModal({ title: `Ödeme — ${s.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: s.balance, required: true }, { name: 'type', label: 'Şekil', type: 'select', options: [{ value: 'nakit', label: 'Kasadan nakit' }, { value: 'havale', label: 'Havale/EFT' }] }] });
        if (!v) return;
        s.balance = r2(s.balance - v.amount);
        if (v.type === 'nakit') db.insert('cash', { at: new Date().toISOString(), type: 'out', amount: v.amount, note: `Tedarikçi ödemesi - ${s.name}` }, true);
        db.log('Tedarikçi ödemesi', `${s.name} · ${money(v.amount)}`); db.save(); toast('Ödeme kaydedildi', 'ok'); draw();
      },
    });
  }

  // ---------- Kampanyalar ----------
  function campaignsPage(el, param, app) {
    NS.crud(el, app, {
      col: 'campaigns', title: 'Kampanyalar', sub: 'X al Y öde, kategori indirimi ve kupon kodları — satış ekranında otomatik uygulanır', single: 'Kampanya', addLabel: 'Yeni kampanya', emptyIcon: 'tag',
      fields: [
        { name: 'name', label: 'Kampanya adı', required: true, full: true },
        { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'xy', label: 'X Al Y Öde (ürün)' }, { value: 'pct', label: 'Kategori % indirim' }, { value: 'coupon', label: 'Kupon kodu (% sepet)' }] },
        { name: 'active', label: 'Aktif', type: 'checkbox', value: true },
        { name: 'pid', label: 'Ürün (X al Y öde için)', type: 'select', empty: '-', options: () => db.all('products').map((p) => ({ value: p.id, label: p.name })) },
        { name: 'cat', label: 'Kategori (% indirim için)', type: 'select', empty: '-', options: () => db.all('cats').map((c) => ({ value: c.id, label: c.name })) },
        { name: 'x', label: 'X (al)', type: 'number' }, { name: 'y', label: 'Y (öde)', type: 'number' },
        { name: 'pct', label: 'İndirim %', type: 'number' }, { name: 'code', label: 'Kupon kodu' },
      ],
      beforeSave: (v) => { if (v.code) v.code = v.code.toUpperCase(); },
      columns: [
        { key: 'name', label: 'Kampanya', render: (k) => `<b>${esc(k.name)}</b>` },
        { label: 'Tür', render: (k) => badge({ xy: 'X Al Y Öde', pct: 'Kategori %', coupon: 'Kupon' }[k.type], 'acc') },
        { label: 'Detay', render: (k) => (k.type === 'xy' ? `${esc((P(k.pid) || {}).name || '-')}: ${k.x} al ${k.y} öde` : k.type === 'pct' ? `${esc(cat(k.cat).name)}: %${k.pct}` : `<span class="mono">${esc(k.code)}</span> · %${k.pct}`) },
        { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) },
      ],
    });
  }

  // ---------- Satışlar ----------
  function salesPage(el) {
    let q = '', range = '7';
    el.innerHTML = pageHead('Satış Geçmişi', 'Tüm fişler, iadeler ve tekrar yazdırma', `<button class="btn" id="exp">${icon('download')} Dışa aktar</button>`) +
      `<div class="card"><div class="card-h">${NS.searchBox('q', 'Fiş no, ürün veya müşteri...')}<div class="seg">${[['1', 'Bugün'], ['7', '7 gün'], ['30', '30 gün'], ['all', 'Tümü']].map(([v, l]) => `<button data-r="${v}" class="${v === range ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="tbl"></div></div>`;
    const rows = () => {
      const since = range === 'all' ? '' : NS.iso(addDays(new Date(), -(Number(range) - 1)));
      return db.all('sales').filter((s) => NS.iso(s.at) >= since && NS.match(q, s.no, custName(s.customer), ...s.items.map((i) => i.name))).sort((a, b) => b.at.localeCompare(a.at));
    };
    const draw = () => {
      const r = rows();
      $('#tbl', el).innerHTML = table({
        rows: r.slice(0, 400), emptyIcon: 'receipt',
        columns: [{ label: 'Fiş', render: (s) => `<b>${esc(s.no)}</b>${s.type === 'return' ? ' ' + badge('İade', 'err') : ''}${s.refunded ? ' ' + badge('İade edildi', 'warn') : ''}` }, { label: 'Tarih', render: (s) => NS.dt(s.at) }, { label: 'Kasiyer', render: (s) => esc(userName(s.user)) }, { label: 'Müşteri', render: (s) => esc(s.customer ? custName(s.customer) : '-') }, { label: 'Ödeme', render: (s) => s.payments.map((p) => badge(PAY[p.type], p.type === 'nakit' ? 'ok' : p.type === 'kart' ? 'info' : 'warn')).join(' ') }, { label: 'Kalem', cls: 'right', render: (s) => s.items.length }, { label: 'Tutar', cls: 'right', render: (s) => `<b style="${s.total < 0 ? 'color:var(--err)' : ''}">${money(s.total)}</b>` }],
        actions: [{ icon: 'eye', act: 'view' }, { icon: 'print', act: 'print' }],
        foot: `${r.length} fiş · Net: <b>${money(sum(r, (s) => s.total))}</b>`,
      });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-r]', (e, t) => { range = t.dataset.r; $$('[data-r]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    on(el, 'click', '[data-act]', (e, t) => {
      const s = db.get('sales', t.dataset.id);
      if (t.dataset.act === 'print') return printReceipt(s);
      modal({
        title: `Fiş ${s.no}`, body: `<div class="receipt" style="border:1px solid var(--border);border-radius:8px">${receiptHtml(s)}</div>`,
        actions: [...(s.type === 'sale' && !s.refunded ? [{ label: 'İade al', icon: 'refresh', cls: 'danger', onClick: (c) => { c(); refundSale(s); } }] : []), ...(NS.ebelge ? [{ label: s.ebelge ? `${s.ebelge.type} ${s.ebelge.no}` : 'Fatura kes', icon: 'file', onClick: (c) => { c(); invoiceSale(s); } }] : []), { label: 'Yazdır', icon: 'print', onClick: () => printReceipt(s) }, { label: 'Kapat', cls: 'primary' }],
      });
    });
    $('#exp', el).onclick = () => NS.csv('satislar', rows(), [{ key: 'no', label: 'Fiş' }, { label: 'Tarih', value: (s) => NS.dt(s.at) }, { label: 'Kasiyer', value: (s) => userName(s.user) }, { label: 'Ödeme', value: (s) => s.payments.map((p) => PAY[p.type]).join('+') }, { key: 'total', label: 'Tutar' }]);
    draw();
  }
  function refundSale(s) {
    cart = newCart(); cart.mode = 'return'; cart.customer = s.customer;
    cart.lines = s.items.map((i) => ({ ...i }));
    s.refunded = true; saveCart();
    toast('Fiş iade moduna aktarıldı — iade edilmeyecek ürünleri çıkarıp ödemeyi tamamlayın');
    app.go('satis');
  }

  // ---------- Kasa ----------
  function cashPage(el) {
    const shift = db.all('shifts').find((s) => !s.close);
    const from = shift ? shift.open : NS.iso(new Date());
    const sales = db.all('sales', (s) => s.at >= from);
    const byPay = {};
    sales.forEach((s) => s.payments.forEach((p) => { byPay[p.type] = (byPay[p.type] || 0) + p.amount; }));
    const cash = db.all('cash', (c) => c.at >= from);
    const cin = sum(cash.filter((c) => c.type === 'in'), (c) => c.amount), cout = sum(cash.filter((c) => c.type === 'out'), (c) => c.amount);
    const expected = (shift ? shift.openCash : 0) + (byPay.nakit || 0) + cin - cout;
    el.innerHTML = pageHead('Kasa', shift ? `Vardiya açık: ${NS.dt(shift.open)} · ${esc(userName(shift.user))}` : 'Açık vardiya yok', `
      <button class="btn" id="cin">${icon('plus')} Kasaya para gir</button><button class="btn" id="cout">${icon('minus')} Kasadan para çık</button>
      ${shift ? `<button class="btn danger" id="close">${icon('lock')} Gün sonu (Z raporu)</button>` : `<button class="btn primary" id="open">${icon('key')} Vardiya aç</button>`}`) + `
      <div class="grid g4 mb">${kpi('Açılış', money(shift ? shift.openCash : 0), 'key')}${kpi('Nakit satış', money(byPay.nakit || 0), 'cash', 'ok')}${kpi('Kart satış', money(byPay.kart || 0), 'card', 'info')}${kpi('Kasada olması gereken', money(expected), 'wallet', 'warn')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Ödeme türlerine göre</h3></div><div class="card-b">${chart.donut(Object.entries(byPay).filter(([, v]) => v > 0).map(([k, v]) => ({ label: PAY[k], value: v })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Kasa hareketleri</h3></div>${table({ rows: cash.slice().reverse(), empty: 'Bu vardiyada hareket yok', columns: [{ label: 'Saat', render: (c) => NS.time(c.at) }, { label: 'Açıklama', key: 'note' }, { label: 'Tutar', cls: 'right', render: (c) => `<b style="color:${c.type === 'in' ? 'var(--ok)' : 'var(--err)'}">${c.type === 'in' ? '+' : '-'}${money(c.amount)}</b>` }] })}</div></div>
      <div class="card mt"><div class="card-h"><h3>Geçmiş Z raporları</h3></div>${table({ rows: db.all('shifts', (s) => s.close).reverse(), empty: 'Henüz gün sonu yapılmadı', columns: [{ label: 'Açılış', render: (s) => NS.dt(s.open) }, { label: 'Kapanış', render: (s) => NS.dt(s.close) }, { label: 'Ciro', cls: 'right', render: (s) => money(s.z.total) }, { label: 'Beklenen nakit', cls: 'right', render: (s) => money(s.z.expected) }, { label: 'Sayılan', cls: 'right', render: (s) => money(s.z.counted) }, { label: 'Fark', cls: 'right', render: (s) => badge(money(s.z.counted - s.z.expected), Math.abs(s.z.counted - s.z.expected) < 1 ? 'ok' : 'err') }], actions: [{ icon: 'print', act: 'zp' }] })}</div>`;
    const move = async (type) => { const v = await formModal({ title: type === 'in' ? 'Kasaya para girişi' : 'Kasadan para çıkışı', fields: [{ name: 'amount', label: 'Tutar', type: 'number', step: '0.01', required: true }, { name: 'note', label: 'Açıklama', required: true, placeholder: type === 'in' ? 'Bozuk para, avans iadesi...' : 'Fatura ödemesi, gider...' }] }); if (v) { db.insert('cash', { ...v, type, at: new Date().toISOString() }); db.log(type === 'in' ? 'Kasa girişi' : 'Kasa çıkışı', money(v.amount)); app.refresh(); } };
    $('#cin', el).onclick = () => move('in');
    $('#cout', el).onclick = () => move('out');
    if ($('#open', el)) $('#open', el).onclick = async () => { const v = await NS.prompt('Açılış nakdi (₺)', 500, { title: 'Vardiya aç', type: 'number' }); if (v !== null) { db.insert('shifts', { open: new Date().toISOString(), openCash: Number(v) || 0, user: NS.currentUser && NS.currentUser.id, close: null }); app.refresh(); } };
    if ($('#close', el)) $('#close', el).onclick = async () => {
      const v = await NS.prompt(`Kasadaki sayılan nakit (beklenen ${money(expected)})`, expected.toFixed(2), { title: 'Gün Sonu', type: 'number' });
      if (v === null) return;
      const z = { total: sum(sales, (s) => s.total), count: sales.filter((s) => s.type === 'sale').length, returns: sum(sales.filter((s) => s.type === 'return'), (s) => s.total), byPay, cin, cout, expected, counted: Number(v), vat: sum(sales, (s) => s.vat || 0) };
      db.update('shifts', shift.id, { close: new Date().toISOString(), z });
      db.log('Gün sonu', money(z.total));
      printZ(db.get('shifts', shift.id));
      app.refresh();
    };
    on(el, 'click', '[data-act=zp]', (e, t) => printZ(db.get('shifts', t.dataset.id)));
  }
  function printZ(sh) {
    const z = sh.z, s = S();
    (NS.integ ? NS.integ.printReceipt : NS.printHtml)(`<div class="c"><div class="big">${esc(s.bizName)}</div><div>Z RAPORU</div></div><hr><div class="r"><span>Açılış</span><span>${NS.dt(sh.open)}</span></div><div class="r"><span>Kapanış</span><span>${NS.dt(sh.close)}</span></div><hr>
      <div class="r"><span>Fiş sayısı</span><span>${z.count}</span></div><div class="r"><span>İadeler</span><span>${money(z.returns)}</span></div>${Object.entries(z.byPay).map(([k, v]) => `<div class="r"><span>${PAY[k]}</span><span>${money(v)}</span></div>`).join('')}
      <div class="r"><span>KDV toplam</span><span>${money(z.vat)}</span></div><div class="r big"><span>CİRO</span><span>${money(z.total)}</span></div><hr>
      <div class="r"><span>Açılış nakdi</span><span>${money(sh.openCash)}</span></div><div class="r"><span>Kasa giriş</span><span>${money(z.cin)}</span></div><div class="r"><span>Kasa çıkış</span><span>${money(z.cout)}</span></div>
      <div class="r"><span>Beklenen nakit</span><span>${money(z.expected)}</span></div><div class="r"><span>Sayılan nakit</span><span>${money(z.counted)}</span></div><div class="r big"><span>FARK</span><span>${money(z.counted - z.expected)}</span></div>`, { title: 'Z Raporu' });
  }

  // ---------- Özet ve raporlar ----------
  function dashboard(el) {
    const sales = db.all('sales', (s) => s.type === 'sale');
    const t = today();
    const todayS = db.all('sales', (s) => NS.iso(s.at) === t);
    const yest = NS.iso(addDays(new Date(), -1));
    const yS = db.all('sales', (s) => NS.iso(s.at) === yest);
    const todayTotal = sum(todayS, (s) => s.total), yTotal = sum(yS, (s) => s.total);
    const profit = (list) => sum(list, (s) => sum(s.items, (i) => (i.price * (1 - (i.disc || 0) / 100) - (i.buy || 0)) * i.qty) * (s.total < 0 ? -1 : 1));
    const ser = NS.dailySeries(db.all('sales'), 14, 'at', (s) => s.total);
    const topMap = {};
    sales.filter((s) => s.at > addDays(new Date(), -30).toISOString()).forEach((s) => s.items.forEach((i) => { topMap[i.name] = (topMap[i.name] || 0) + i.qty * i.price; }));
    const top = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const hours = Array.from({ length: 15 }, (_, i) => i + 8).map((h) => ({ label: h + ':00', value: sum(sales.filter((s) => new Date(s.at).getHours() === h), (s) => s.total) / 30 }));
    const diff = yTotal ? ((todayTotal - yTotal) / yTotal) * 100 : 0;
    el.innerHTML = pageHead(`Hoş geldiniz${NS.currentUser ? ', ' + esc(NS.currentUser.name.split(' ')[0]) : ''}`, NS.dateLong(new Date()), `<a class="btn primary lg" href="#/satis">${icon('barcode')} Satış ekranı</a>`) + `
      <div class="grid g4 mb">
        ${kpi('Bugünkü ciro', money(todayTotal), 'trend', 'ok', `<div class="small ${diff >= 0 ? '' : ''}" style="color:${diff >= 0 ? 'var(--ok)' : 'var(--err)'}">${diff >= 0 ? '▲' : '▼'} %${Math.abs(diff).toFixed(0)} düne göre</div>`)}
        ${kpi('Bugünkü fiş', num(todayS.filter((s) => s.type === 'sale').length), 'receipt', 'info', `<div class="small faint">Ort. sepet ${money(todayS.length ? todayTotal / todayS.length : 0)}</div>`)}
        ${kpi('Bugünkü brüt kâr', money(profit(todayS)), 'wallet')}
        ${kpi('Kritik stok', num(db.all('products', (p) => p.stock <= p.min).length), 'alert', 'err', '<a class="small" href="#/stok">Görüntüle →</a>')}
      </div>
      <div class="grid g-21 mb">
        <div class="card"><div class="card-h"><h3>Son 14 gün ciro</h3></div><div class="card-b">${chart.line([{ name: 'Ciro', values: ser.values }], ser.labels, { format: money })}</div></div>
        <div class="card"><div class="card-h"><h3>En çok satanlar (30 gün)</h3></div><div class="card-b">${top.map(([n, v], i) => `<div class="list-item"><span class="badge acc">${i + 1}</span><span class="grow">${esc(n)}</span><b>${money(v)}</b></div>`).join('')}</div></div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><h3>Saatlik ortalama satış</h3></div><div class="card-b">${chart.bars(hours, { format: money, labelEvery: 2 })}</div></div>
        <div class="card"><div class="card-h"><h3>Veresiye ve cari durumu</h3></div><div class="card-b">
          <div class="list-item"><span class="grow">Müşteri alacakları</span><b style="color:var(--ok)">${money(sum(db.all('customers'), (m) => m.balance))}</b></div>
          <div class="list-item"><span class="grow">Tedarikçi borçları</span><b style="color:var(--err)">${money(sum(db.all('suppliers'), (s) => s.balance))}</b></div>
          <div class="list-item"><span class="grow">Bekleyen fiş</span><b>${db.all('held').length}</b></div>
          <div class="list-item"><span class="grow">Aktif kampanya</span><b>${db.all('campaigns', (k) => k.active).length}</b></div>
          <h3 class="mt mb">Son satışlar</h3>${db.all('sales').slice(-5).reverse().map((s) => `<div class="list-item small"><b>${esc(s.no)}</b><span class="grow faint">${NS.ago(s.at)}</span><span>${money(s.total)}</span></div>`).join('')}
        </div></div>
      </div>`;
  }

  function reportsPage(el) {
    let days = 30;
    el.innerHTML = pageHead('Raporlar', 'Satış, kâr, kategori ve personel analizleri', `<div class="seg">${[7, 30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'active' : ''}">${d} gün</button>`).join('')}</div>`) + '<div id="rb"></div>';
    const draw = () => {
      const since = addDays(new Date(), -days).toISOString();
      const sales = db.all('sales', (s) => s.at > since);
      const items = sales.flatMap((s) => s.items.map((i) => ({ ...i, sign: s.total < 0 ? -1 : 1, user: s.user, at: s.at })));
      const revenue = sum(sales, (s) => s.total);
      const cost = sum(items, (i) => i.sign * i.qty * (i.buy || 0));
      const byCat = {}, byProd = {}, byUser = {};
      items.forEach((i) => {
        const p = P(i.pid); const c = p ? cat(p.cat).name : 'Diğer';
        const v = i.sign * i.qty * i.price * (1 - (i.disc || 0) / 100);
        byCat[c] = (byCat[c] || 0) + v;
        const bp = (byProd[i.name] = byProd[i.name] || { name: i.name, qty: 0, rev: 0, profit: 0 });
        bp.qty += i.sign * i.qty; bp.rev += v; bp.profit += v - i.sign * i.qty * (i.buy || 0);
      });
      sales.forEach((s) => { const u = userName(s.user); byUser[u] = byUser[u] || { n: 0, t: 0 }; byUser[u].n++; byUser[u].t += s.total; });
      const ser = NS.dailySeries(sales, Math.min(days, 31), 'at', (s) => s.total);
      const weekday = NS.DAYS.map((d, i) => ({ label: d.slice(0, 3), value: sum(sales.filter((s) => new Date(s.at).getDay() === i), (s) => s.total) }));
      $('#rb', el).innerHTML = `<div class="grid g4 mb">${kpi('Ciro', money(revenue), 'trend', 'ok')}${kpi('Brüt kâr', money(revenue - cost), 'wallet')}${kpi('Kâr marjı', '%' + (revenue ? (((revenue - cost) / revenue) * 100).toFixed(1) : 0), 'percent', 'info')}${kpi('Fiş sayısı', num(sales.length), 'receipt', 'warn')}</div>
        <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük ciro</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: Math.ceil(ser.labels.length / 10) })}</div></div>
        <div class="card"><div class="card-h"><h3>Kategori dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })), { format: money, size: 150 })}</div></div></div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Haftanın günleri</h3></div><div class="card-b">${chart.bars(weekday, { format: money })}</div></div>
        <div class="card"><div class="card-h"><h3>Personel performansı</h3></div>${table({ rows: Object.entries(byUser).map(([n, v]) => ({ id: n, n, ...v })).sort((a, b) => b.t - a.t), columns: [{ label: 'Personel', render: (r) => `<b>${esc(r.n)}</b>` }, { label: 'Fiş', cls: 'right', render: (r) => r.n }, { label: 'Ciro', cls: 'right', render: (r) => money(r.t) }, { label: 'Ort. fiş', cls: 'right', render: (r) => money(r.t / r.n) }] })}</div></div>
        <div class="card"><div class="card-h"><h3>Ürün bazlı kârlılık</h3><button class="btn sm" id="pexp">${icon('download')} İndir</button></div>${table({ rows: Object.values(byProd).sort((a, b) => b.profit - a.profit).map((r) => ({ ...r, id: r.name })), columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.name)}</b>` }, { label: 'Miktar', cls: 'right', render: (r) => num(r.qty) }, { label: 'Ciro', cls: 'right', render: (r) => money(r.rev) }, { label: 'Kâr', cls: 'right', render: (r) => `<b style="color:${r.profit >= 0 ? 'var(--ok)' : 'var(--err)'}">${money(r.profit)}</b>` }, { label: 'Marj', cls: 'right', render: (r) => '%' + (r.rev ? ((r.profit / r.rev) * 100).toFixed(1) : 0) }] })}</div>`;
      $('#pexp', el).onclick = () => NS.csv('urun-karlilik', Object.values(byProd), [{ key: 'name', label: 'Ürün' }, { key: 'qty', label: 'Miktar' }, { key: 'rev', label: 'Ciro' }, { key: 'profit', label: 'Kâr' }]);
    };
    on(el, 'click', '[data-d]', (e, t) => { days = Number(t.dataset.d); $$('[data-d]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    draw();
  }

  // ---------- Uygulama ----------
  const ROLES = { admin: 'Yönetici', kasiyer: 'Kasiyer', depo: 'Depo Sorumlusu' };
  const app = NS.shell({
    id: 'pos', integrations: ['printer','label','scale','pos','barcode','efatura','sms','whatsapp','webhook','backup'], name: 'Market POS', tagline: 'Barkodlu Satış Sistemi', icon: 'barcode', accent: '#4f46e5', db, home: 'satis',
    auth: { roles: ROLES },
    nav: [
      { sec: 'Satış' },
      { id: 'satis', label: 'Satış Ekranı', icon: 'barcode' },
      { id: 'ozet', label: 'Özet', icon: 'home', roles: ['admin'] },
      { id: 'satislar', label: 'Satış Geçmişi', icon: 'receipt' },
      { id: 'kasa', label: 'Kasa & Gün Sonu', icon: 'cash' },
      QH.nav,
      { sec: 'Stok' },
      { id: 'urunler', label: 'Ürünler', icon: 'box', roles: ['admin', 'depo'] },
      { id: 'kategoriler', label: 'Kategoriler', icon: 'grid', roles: ['admin', 'depo'] },
      { id: 'stok', label: 'Stok & Sayım', icon: 'layers', roles: ['admin', 'depo'] },
      { id: 'alis', label: 'Alış Faturaları', icon: 'truck', roles: ['admin', 'depo'] },
      { id: 'etiket', label: 'Etiket Basımı', icon: 'tag', roles: ['admin', 'depo'] },
      { sec: 'Cari & Pazarlama' },
      { id: 'musteriler', label: 'Müşteriler & Veresiye', icon: 'users' },
      { id: 'tedarikciler', label: 'Tedarikçiler', icon: 'building', roles: ['admin', 'depo'] },
      { id: 'kampanyalar', label: 'Kampanyalar', icon: 'gift', roles: ['admin'] },
      { sec: 'Yönetim' },
      { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] },
      { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] },
    ],
    routes: {
      ...QH.routes, satis: salePage, ozet: dashboard, satislar: salesPage, kasa: cashPage, urunler: productsPage, stok: stockPage, alis: purchasesPage, etiket: labelsPage,
      musteriler: customersPage, tedarikciler: suppliersPage, kampanyalar: campaignsPage, raporlar: reportsPage,
      kategoriler: (el, p, a) => NS.crud(el, a, { col: 'cats', title: 'Kategoriler', single: 'Kategori', addLabel: 'Yeni kategori', fields: [{ name: 'name', label: 'Kategori adı', required: true }, { name: 'color', label: 'Renk', type: 'color', value: '#4f46e5' }], columns: [{ key: 'name', label: 'Kategori', render: (c) => `<div class="row nw"><span class="dot" style="background:${c.color};width:12px;height:12px"></span><b>${esc(c.name)}</b></div>` }, { label: 'Ürün sayısı', cls: 'right', render: (c) => db.all('products', (p) => p.cat === c.id).length }], sort: (a, b) => a.name.localeCompare(b.name, 'tr') }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, {
        roles: ROLES,
        fields: [{ type: 'section', label: 'Satış ayarları' }, { name: 'receiptFooter', label: 'Fiş alt yazısı', full: true },  { name: 'pointsRate', label: 'Puan oranı (her 10₺ için puan)', type: 'number' }, { name: 'autoPrint', label: 'Satış sonrası otomatik fiş yazdır', type: 'checkbox' }, { name: 'allowNegative', label: 'Eksi stokla satışa izin ver', type: 'checkbox' }],
      }),
    },
    onKey: (e, a) => {
      if (a.route !== 'satis' || document.querySelector('.ns-overlay')) return;
      const map = { F2: 'cash', F3: 'card', F4: 'pay', F6: 'cust', F7: 'disc', F8: 'hold', F9: 'held', F10: 'ret' };
      if (map[e.key]) { e.preventDefault(); tool(map[e.key]); }
      else if (e.key === 'Delete' && document.activeElement.id === 'scan' && !document.activeElement.value) { e.preventDefault(); if (selLine >= 0 && cart.lines[selLine]) { cart.lines.splice(selLine, 1); selLine = -1; saveCart(); drawCart(); } else tool('clear'); }
      else if (e.key === 'ArrowUp' && cart.lines.length) { e.preventDefault(); selLine = Math.max(0, (selLine < 0 ? cart.lines.length : selLine) - 1); drawCart(); }
      else if (e.key === 'ArrowDown' && cart.lines.length) { e.preventDefault(); selLine = Math.min(cart.lines.length - 1, selLine + 1); drawCart(); }
      else if ((e.key === '+' || e.key === '-') && selLine >= 0 && document.activeElement.id === 'scan' && !document.activeElement.value) { e.preventDefault(); const l = cart.lines[selLine]; l.qty = r2(l.qty + (e.key === '+' ? 1 : -1) * (l.unit === 'kg' ? 0.1 : 1)); if (l.qty <= 0) { cart.lines.splice(selLine, 1); selLine = -1; } saveCart(); drawCart(); }
    },
  });
})();
