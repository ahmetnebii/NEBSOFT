/* NEBSOFT Kuyumcu — has altın kuru, sikke ve ayar fiyatları, gramlı takı satışı (işçilik), hurda/sikke alışı,
   altın + TL kasa, müşteri altın hesabı (emanet), özel sipariş, vitrin TV kur ekranı */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const K = window.KYM;
  const db = new NS.DB('kuyumcu', K.seed);
  const S = () => db.settings({});
  const R = () => K.rates(S());
  const cus = (id) => db.get('customers', id);
  const gr = (n) => `${NS.num(Math.round(n * 1000) / 1000)} gr`;
  const coin = (id) => K.COINS.find((c) => c.id === id);
  const itemPrice = (it) => Math.round(K.has(it.g, it.ayar) * Number(S().hasSell) + (Number(it.labor) || 0) * it.g);
  const stale = () => (Date.now() - new Date(S().rateAt)) / 6e4 > 60;
  const rateBar = () => `<div class="card pad mb row" style="gap:18px;flex-wrap:wrap"><span>${icon('trend')} Has alış <b>${money(S().hasBuy)}</b> · satış <b>${money(S().hasSell)}</b></span><span class="small muted">USD ${NS.num(S().usd)} · EUR ${NS.num(S().eur)}</span><span class="grow"></span>${stale() ? badge(`Kur ${Math.round((Date.now() - new Date(S().rateAt)) / 6e4)} dk önce güncellendi`, 'warn') : badge('Kur güncel', 'ok')}<a class="btn sm" href="#/kur">Kuru güncelle</a></div>`;

  // ---------- Kur ----------
  function ratePage(el, p, app) {
    const draw = () => {
      const r = R();
      el.innerHTML = pageHead('Kur & Fiyatlar', `Son güncelleme ${NS.dt(S().rateAt)}`, `<a class="btn" target="_blank" href="ekran.html">${icon('globe')} Vitrin ekranını aç</a><button class="btn" id="fetch">${icon('refresh')} Kur servisinden çek</button>`) + `
        <div class="grid g-21"><div class="card pad" id="rf"><div class="form-grid">${NS.fieldsHtml([{ type: 'section', label: 'Has altın (24 ayar 1 gr)' }, { name: 'hasBuy', label: 'Alış (₺)', type: 'number', step: '0.01', required: true }, { name: 'hasSell', label: 'Satış (₺)', type: 'number', step: '0.01', required: true }, { name: 'usd', label: 'USD', type: 'number', step: '0.01' }, { name: 'eur', label: 'EUR', type: 'number', step: '0.01' }, { type: 'section', label: 'Makas' }, { name: 'coinSellAdd', label: 'Sikke satış farkı %', type: 'number', step: '0.1' }, { name: 'coinBuyCut', label: 'Sikke alış farkı %', type: 'number', step: '0.1' }, { name: 'scrapCut', label: 'Hurda alış kesintisi %', type: 'number', step: '0.1' }, { name: 'laborDefault', label: 'Varsayılan işçilik (₺/gr)', type: 'number' }], S())}</div><button class="btn primary lg mt" id="sv">${icon('check')} Kuru kaydet</button></div>
        <div class="col" style="gap:16px"><div class="card">${table({ rows: r.coin, columns: [{ label: 'Sikke', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${c.g} gr · ${c.m * 1000} milyem</div>` }, { label: 'Alış', cls: 'right', render: (c) => money(c.buy) }, { label: 'Satış', cls: 'right', render: (c) => `<b>${money(c.sell)}</b>` }] })}</div>
        <div class="card">${table({ rows: r.ayar.map((a) => ({ ...a, id: a.ayar })), columns: [{ label: 'Ayar (gram)', render: (a) => `<b>${a.ayar} ayar</b> <span class="small faint">${K.AYAR[a.ayar] * 1000}</span>` }, { label: 'Hurda alış', cls: 'right', render: (a) => money(a.buy) }, { label: 'Satış (işçiliksiz)', cls: 'right', render: (a) => money(a.sell) }] })}</div></div></div>`;
      $('#sv', el).onclick = () => { const box = $('#rf', el); if (!NS.validate(box)) return; const v = NS.readForm(box); if (Number(v.hasSell) < Number(v.hasBuy)) return toast('Satış kuru alıştan düşük olamaz', 'err'); db.saveSettings({ ...S(), ...v, rateAt: new Date().toISOString() }); db.insert('rateLog', { at: new Date().toISOString(), buy: Number(v.hasBuy), sell: Number(v.hasSell) }); toast('Kur güncellendi — tüm fiyatlar ve vitrin ekranı yenilendi', 'ok'); draw(); };
      $('#fetch', el).onclick = async () => {
        const url = S().rateUrl; if (!url) return toast('Ayarlar > Kur servisi adresi tanımlı değil (ör. bağlı olduğunuz toptancının JSON kur servisi)', 'err');
        try { const j = await (await fetch(url)).json(); const hb = Number(j.hasBuy || j.alis || (j.HAS && j.HAS.alis)); const hs = Number(j.hasSell || j.satis || (j.HAS && j.HAS.satis)); if (!(hb > 0 && hs > 0)) throw new Error('Kur alanları bulunamadı'); db.saveSettings({ ...S(), hasBuy: hb, hasSell: hs, rateAt: new Date().toISOString() }); toast('Kur servisten alındı', 'ok'); draw(); } catch (e) { toast('Kur alınamadı: ' + e.message, 'err'); }
      };
    };
    draw();
  }

  // ---------- Satış ----------
  function salePage(el, p, app) {
    let cart = [], customer = null;
    el.innerHTML = pageHead('Satış', 'Sikke, gram altın ve takı satışı — fiyat güncel kurdan hesaplanır') + rateBar() + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><div class="row" style="flex-wrap:wrap;gap:8px">${K.COINS.map((c) => `<button class="btn" data-c="${c.id}">${esc(c.name)}<span class="small faint" style="margin-left:6px">${money(R().coin.find((x) => x.id === c.id).sell)}</span></button>`).join('')}</div><div class="row mt"><input class="input grow" id="sc" placeholder="Ürün kodu okutun (K5001)" autocomplete="off"><button class="btn" id="free">${icon('plus')} Tartılı takı</button></div></div><div class="card" id="cart"></div></div><div class="col" style="gap:16px"><div class="card pad" id="cu"></div><div class="card pad" id="tot"></div></div></div>`;
    const draw = () => {
      $('#cart', el).innerHTML = cart.length ? table({ rows: cart.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${l.kind === 'coin' ? `${l.qty} adet` : `${l.ayar} ayar · ${gr(l.g)} · işçilik ${money(l.labor)}/gr`} · has ${gr(l.has)}</div>` }, { label: 'Tutar', cls: 'right', render: (l) => `<b>${money(l.price)}</b>` }], actions: [{ icon: 'trash', act: 'rm' }] }) : `<div class="empty">${icon('star')}<div>Sikke seçin veya ürün kodu okutun</div></div>`;
      const c = customer && cus(customer);
      $('#cu', el).innerHTML = c ? `<b>${esc(c.name)}</b><div class="small muted">${esc(c.phone)}${c.hasBalance ? ` · altın hesabı ${gr(c.hasBalance)} has` : ''}</div><button class="btn sm ghost mt" id="cx">Müşteriyi kaldır</button>` : `<button class="btn block" id="cs">${icon('user')} Müşteri seç</button>`;
      const total = sum(cart, (l) => l.price);
      $('#tot', el).innerHTML = `<div class="list-item small"><span class="grow muted">Toplam has</span>${gr(sum(cart, (l) => l.has))}</div><div class="list-item"><b class="grow" style="font-size:18px">Toplam</b><b style="font-size:26px">${money(total)}</b></div><div class="grid g2 mt">${['Nakit', 'Kredi kartı', 'Havale'].map((m) => `<button class="btn ${m === 'Nakit' ? 'primary' : ''}" data-pay="${m}" ${cart.length ? '' : 'disabled'}>${esc(m)}</button>`).join('')}${c && c.hasBalance > 0 ? `<button class="btn" data-pay="Altın hesabından" ${cart.length ? '' : 'disabled'}>${icon('star')} Altın hesabından</button>` : ''}</div>`;
    };
    const addCoin = (id) => { const c = coin(id); const r = R().coin.find((x) => x.id === id); const l = cart.find((x) => x.kind === 'coin' && x.ref === id); if ((db.data.coins[id] || 0) <= (l ? l.qty : 0)) toast(`${c.name} stokta yok`, 'err'); if (l) { l.qty++; l.has = Math.round(c.g * c.m * l.qty * 1000) / 1000; l.price = r.sell * l.qty; } else cart.push({ kind: 'coin', ref: id, name: c.name, qty: 1, has: Math.round(c.g * c.m * 1000) / 1000, price: r.sell }); draw(); };
    on(el, 'click', '[data-c]', (e, b) => addCoin(b.dataset.c));
    on(el, 'click', '[data-act=rm]', (e, b) => { cart.splice(Number(b.dataset.id), 1); draw(); });
    $('#sc', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const it = db.find('items', (x) => x.code.toLowerCase() === e.target.value.trim().toLowerCase()); e.target.value = ''; if (!it) return toast('Ürün bulunamadı', 'err'); if (it.status !== 'stok') return toast('Bu ürün satılmış', 'err'); if (cart.some((l) => l.itemId === it.id)) return; cart.push({ kind: 'item', itemId: it.id, name: `${it.name} (${it.code})`, ayar: it.ayar, g: it.g, labor: it.labor, has: K.has(it.g, it.ayar), price: itemPrice(it) }); NS.beep(); draw(); });
    $('#free', el).onclick = async () => { const v = await formModal({ title: 'Tartılı takı satışı', fields: [{ name: 'name', label: 'Ürün', required: true, value: 'Bilezik' }, { name: 'ayar', label: 'Ayar', type: 'select', options: ['22', '18', '14', '8'] }, { name: 'g', label: 'Gram', type: 'number', step: '0.01', required: true }, { name: 'labor', label: 'İşçilik (₺/gr)', type: 'number' }], values: { ayar: '22', labor: S().laborDefault } }); if (!v) return; const g = Number(v.g), ayar = Number(v.ayar), labor = Number(v.labor) || 0; cart.push({ kind: 'item', name: `${v.name} ${ayar} ayar`, ayar, g, labor, has: K.has(g, ayar), price: Math.round(K.has(g, ayar) * Number(S().hasSell) + labor * g) }); draw(); };
    on(el, 'click', '#cs', async () => { const q = await NS.prompt('Müşteri adı veya telefonu', ''); if (q === null) return; let c = db.find('customers', (x) => NS.match(q, x.name, x.phone)); if (!c) { if (!(await confirm(`"${q}" yeni müşteri olarak kaydedilsin mi?`, { danger: false }))) return; c = db.insert('customers', { name: q, phone: '', hasBalance: 0 }); } customer = c.id; draw(); });
    on(el, 'click', '#cx', () => { customer = null; draw(); });
    on(el, 'click', '[data-pay]', async (e, b) => {
      const pay = b.dataset.pay; const total = sum(cart, (l) => l.price); const c = customer && cus(customer);
      if (pay === 'Altın hesabından') { const need = sum(cart, (l) => l.has); if (c.hasBalance < need) return toast(`Altın hesabında ${gr(c.hasBalance)} has var, ${gr(need)} gerekli`, 'err'); c.hasBalance = Math.round((c.hasBalance - need) * 1000) / 1000; }
      cart.forEach((l) => { if (l.kind === 'coin') db.data.coins[l.ref] = Math.max(0, (db.data.coins[l.ref] || 0) - l.qty); if (l.itemId) db.update('items', l.itemId, { status: 'satildi', soldAt: new Date().toISOString() }); });
      if (pay === 'Nakit') db.data.cash.tl += total;
      const t = db.insert('tx', { no: 'S' + (10000 + db.all('tx').length), type: 'satis', at: new Date().toISOString(), customer, lines: cart, total: pay === 'Altın hesabından' ? 0 : total, hasRate: Number(S().hasSell), pay, user: (NS.currentUser || {}).name });
      receipt(t); toast(`Satış tamamlandı · ${money(total)}`, 'ok'); cart = []; customer = null; draw();
    });
    draw();
  }
  function receipt(t) {
    const c = t.customer && cus(t.customer);
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><div style="text-align:center"><b style="font-size:15px">${esc(S().bizName)}</b><div>${esc(S().bizAddress || '')}</div></div><hr>${t.type === 'satis' ? 'SATIŞ' : 'ALIŞ'} ${esc(t.no)} · ${NS.dt(t.at)}${c ? `<br>${esc(c.name)}` : ''}<br>Has kuru: ${money(t.hasRate)}<hr>${t.lines.map((l) => `<div>${esc(l.name)}${l.kind === 'coin' ? ` × ${l.qty}` : ` · ${l.ayar} ayar ${gr(l.g)}`}<span style="float:right">${money(l.price)}</span></div>`).join('')}<hr><b style="font-size:15px">TOPLAM <span style="float:right">${money(t.total)}</span></b><div>${esc(t.pay)}</div><hr><div style="font-size:10px">Has: ${gr(sum(t.lines, (l) => l.has))}. ${t.type === 'satis' ? 'Ürün iadesi ve değişimi gramaj ve günün kuru üzerinden yapılır.' : 'Alınan altın test edilmiştir.'}</div></div>`, { title: t.no });
  }

  // ---------- Alış (hurda / sikke) ----------
  function buyPage(el, p, app) {
    let cart = [];
    el.innerHTML = pageHead('Alış & Hurda', 'Müşteriden sikke veya hurda altın alımı — has üzerinden, kesinti dahil') + rateBar() + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><div class="row" style="flex-wrap:wrap;gap:8px">${K.COINS.map((c) => `<button class="btn" data-c="${c.id}">${esc(c.name)}<span class="small faint" style="margin-left:6px">${money(R().coin.find((x) => x.id === c.id).buy)}</span></button>`).join('')}</div><div class="form-grid mt" id="hf">${NS.fieldsHtml([{ name: 'ayar', label: 'Hurda ayarı', type: 'select', options: ['22', '21', '18', '14', '8'] }, { name: 'g', label: 'Brüt gram', type: 'number', step: '0.01' }, { name: 'fire', label: 'Taş / fire düşümü (gr)', type: 'number', step: '0.01' }], { ayar: '22', fire: 0 })}</div><button class="btn mt" id="ah">${icon('plus')} Hurdayı ekle</button></div><div class="card" id="cart"></div></div><div class="card pad" id="tot"></div></div>`;
    const draw = () => {
      $('#cart', el).innerHTML = cart.length ? table({ rows: cart.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Alınan', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${l.kind === 'coin' ? l.qty + ' adet' : `${gr(l.g)} net`} · has ${gr(l.has)}</div>` }, { label: 'Ödenecek', cls: 'right', render: (l) => `<b>${money(l.price)}</b>` }], actions: [{ icon: 'trash', act: 'rm' }] }) : `<div class="empty">${icon('star')}<div>Alınacak altını ekleyin</div></div>`;
      $('#tot', el).innerHTML = `<div class="list-item small"><span class="grow muted">Toplam has</span>${gr(sum(cart, (l) => l.has))}</div><div class="list-item"><b class="grow" style="font-size:18px">Müşteriye ödenecek</b><b style="font-size:26px">${money(sum(cart, (l) => l.price))}</b></div><div class="col mt" style="gap:8px"><button class="btn primary" data-pay="Nakit" ${cart.length ? '' : 'disabled'}>${icon('cash')} Nakit öde</button><button class="btn" data-pay="Havale" ${cart.length ? '' : 'disabled'}>Havale</button><button class="btn" data-pay="Altın hesabına" ${cart.length ? '' : 'disabled'}>${icon('star')} Müşterinin altın hesabına ekle</button></div><p class="small muted mt">Hurda alışlarda %${S().scrapCut} eritme/rafine kesintisi uygulanır.</p>`;
    };
    on(el, 'click', '[data-c]', (e, b) => { const c = coin(b.dataset.c); const r = R().coin.find((x) => x.id === c.id); const l = cart.find((x) => x.ref === c.id); if (l) { l.qty++; l.has = Math.round(c.g * c.m * l.qty * 1000) / 1000; l.price = r.buy * l.qty; } else cart.push({ kind: 'coin', ref: c.id, name: c.name, qty: 1, has: Math.round(c.g * c.m * 1000) / 1000, price: r.buy }); draw(); });
    $('#ah', el).onclick = () => { const v = NS.readForm($('#hf', el)); const g = (Number(v.g) || 0) - (Number(v.fire) || 0); if (g <= 0) return toast('Gram girin', 'err'); const ayar = Number(v.ayar); const has = K.has(g, ayar); cart.push({ kind: 'hurda', name: `Hurda ${ayar} ayar`, ayar, g, has, price: Math.round(has * Number(S().hasBuy) * (1 - (Number(S().scrapCut) || 0) / 100)) }); draw(); };
    on(el, 'click', '[data-act=rm]', (e, b) => { cart.splice(Number(b.dataset.id), 1); draw(); });
    on(el, 'click', '[data-pay]', async (e, b) => {
      const pay = b.dataset.pay; const total = sum(cart, (l) => l.price); let customer = null;
      if (pay === 'Altın hesabına' || total > 50000) { const q = await NS.prompt(total > 50000 && pay !== 'Altın hesabına' ? 'Yüksek tutarlı alış — müşteri adı / TC (kayıt zorunlu)' : 'Müşteri adı veya telefonu', ''); if (!q) return; let c = db.find('customers', (x) => NS.match(q, x.name, x.phone)); if (!c) c = db.insert('customers', { name: q, phone: '', hasBalance: 0 }); customer = c.id; if (pay === 'Altın hesabına') c.hasBalance = Math.round(((c.hasBalance || 0) + sum(cart, (l) => l.has)) * 1000) / 1000; }
      cart.forEach((l) => { if (l.kind === 'coin') db.data.coins[l.ref] = (db.data.coins[l.ref] || 0) + l.qty; });
      if (pay === 'Nakit') { if (db.data.cash.tl < total) return toast('Kasada yeterli nakit yok', 'err'); db.data.cash.tl -= total; }
      const t = db.insert('tx', { no: 'A' + (10000 + db.all('tx').length), type: 'alis', at: new Date().toISOString(), customer, lines: cart, total: pay === 'Altın hesabına' ? 0 : total, hasRate: Number(S().hasBuy), pay, user: (NS.currentUser || {}).name });
      receipt(t); toast('Alış kaydedildi', 'ok'); cart = []; draw();
    });
    draw();
  }

  // ---------- Stok ----------
  function stockPage(el, p, app) {
    let f = 'stok', q = '';
    const C = db.data.coins;
    el.innerHTML = pageHead('Stok', 'Takı (kodlu) ve sikke stoğu, toplam has', `<button class="btn" id="lbl">${icon('tag')} Etiket bas</button><button class="btn primary" id="add">${icon('plus')} Takı girişi</button>`) + `<div class="grid g4 mb" id="k"></div><div class="card mb"><div class="card-h"><h3>Sikke stoğu</h3><button class="btn sm" id="cnt">Sayım</button></div><div class="card-b row" style="flex-wrap:wrap;gap:10px">${K.COINS.map((c) => `<div class="card pad" style="min-width:140px"><div class="small muted">${esc(c.name)}</div><b style="font-size:22px">${C[c.id] || 0}</b> <span class="small faint">adet</span></div>`).join('')}</div></div><div class="card"><div class="card-h">${NS.searchBox('q', 'Kod, ürün...')}<div class="seg">${[['stok', 'Stokta'], ['satildi', 'Satılan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => {
      const st = db.all('items', (x) => x.status === 'stok'); const coinHas = sum(K.COINS, (c) => (C[c.id] || 0) * c.g * c.m);
      $('#k', el).innerHTML = `${kpi('Takı', st.length + ' adet', 'star', '', `<div class="small faint">${gr(sum(st, (x) => x.g))} brüt</div>`)}${kpi('Takı has', gr(sum(st, (x) => K.has(x.g, x.ayar))), 'layers', 'info')}${kpi('Sikke has', gr(coinHas), 'award', 'warn')}${kpi('Stok değeri', money((sum(st, (x) => K.has(x.g, x.ayar)) + coinHas) * Number(S().hasBuy)), 'wallet', 'ok', '<div class="small faint">has alış kuruyla</div>')}`;
      $('#t', el).innerHTML = table({ rows: db.all('items', (x) => (f === 'all' || x.status === f) && NS.match(q, x.code, x.name, x.cat)), emptyIcon: 'star', columns: [{ label: 'Kod', render: (x) => `<b class="mono">${esc(x.code)}</b>` }, { label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.cat)} · ${esc(x.supplier || '')}</div>` }, { label: 'Ayar', render: (x) => badge(x.ayar + ' ayar', x.ayar >= 22 ? 'warn' : 'info') }, { label: 'Gram', cls: 'right', render: (x) => gr(x.g) }, { label: 'İşçilik', cls: 'right', render: (x) => money(x.labor) + '/gr' }, { label: 'Güncel fiyat', cls: 'right', render: (x) => `<b>${money(itemPrice(x))}</b>` }, { label: 'Durum', render: (x) => (x.status === 'stok' ? badge('Stokta', 'ok') : badge('Satıldı')) }], actions: [{ icon: 'edit', act: 'ed', show: (x) => x.status === 'stok' }] });
    };
    const edit = async (x) => { const v = await formModal({ title: x ? x.code : 'Takı girişi', fields: [{ name: 'name', label: 'Ürün', required: true }, { name: 'cat', label: 'Kategori', type: 'select', options: K.CAT }, { name: 'ayar', label: 'Ayar', type: 'select', options: ['22', '18', '14', '8'] }, { name: 'g', label: 'Gram', type: 'number', step: '0.01', required: true }, { name: 'labor', label: 'İşçilik (₺/gr)', type: 'number' }, { name: 'supplier', label: 'İmalatçı / tedarikçi' }], values: x || { cat: 'Bilezik', ayar: '22', labor: S().laborDefault } }); if (!v) return; v.ayar = Number(v.ayar); v.g = Number(v.g); v.labor = Number(v.labor) || 0; if (x) db.update('items', x.id, v); else db.insert('items', { ...v, code: 'K' + (5000 + db.all('items').length), status: 'stok', at: new Date().toISOString() }); draw(); toast('Kaydedildi', 'ok'); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(db.get('items', b.dataset.id)));
    $('#add', el).onclick = () => edit(null);
    $('#cnt', el).onclick = async () => { const v = await formModal({ title: 'Sikke sayımı', fields: K.COINS.map((c) => ({ name: c.id, label: c.name, type: 'number' })), values: C }); if (!v) return; K.COINS.forEach((c) => { C[c.id] = Number(v[c.id]) || 0; }); db.save(); app.refresh(); };
    $('#lbl', el).onclick = () => NS.printHtml(`<div style="display:flex;flex-wrap:wrap;gap:4px">${db.all('items', (x) => x.status === 'stok').map((x) => `<div style="width:150px;border:1px dashed #999;padding:4px;font:10px Arial">${NS.barcodeSvg(x.code, { height: 26 })}<div>${esc(x.name)}</div><div><b>${x.ayar}K · ${x.g} gr</b></div></div>`).join('')}</div>`, { title: 'Etiketler' });
    draw();
  }

  // ---------- Müşteri & altın hesabı ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler & Altın Hesabı', sub: 'Emanet altın has gram olarak tutulur — kur değişse de gram değişmez', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'tc', label: 'TC kimlik (yüksek tutarlı işlem)' }, { name: 'note', label: 'Not', full: true }],
      searchFields: (c) => [c.name, c.phone],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'has', label: 'Altın hesabı olan', test: (c) => (c.hasBalance || 0) > 0 }],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone || '')}</div>` }, { label: 'Altın hesabı', cls: 'right', render: (c) => (c.hasBalance ? `<b>${gr(c.hasBalance)}</b> has<div class="small faint">≈ ${money(c.hasBalance * Number(S().hasBuy))}</div>` : '<span class="faint">—</span>') }, { label: 'İşlem', cls: 'right', render: (c) => db.all('tx', (t) => t.customer === c.id).length }, { label: 'Toplam alışveriş', cls: 'right', render: (c) => money(sum(db.all('tx', (t) => t.customer === c.id && t.type === 'satis'), (t) => t.total)) }],
      extraActions: [{ icon: 'star', act: 'em', title: 'Emanet yatır / çek' }],
      onAction: async (a, c, draw) => { const v = await formModal({ title: `Altın hesabı — ${c.name} (${gr(c.hasBalance || 0)} has)`, fields: [{ name: 'dir', label: 'İşlem', type: 'select', options: [{ value: 'in', label: 'Emanet yatır' }, { value: 'out', label: 'Emanet teslim et' }] }, { name: 'ayar', label: 'Ayar', type: 'select', options: ['24', '22', '18', '14'] }, { name: 'g', label: 'Gram', type: 'number', step: '0.01', required: true }] }); if (!v) return; const h = K.has(Number(v.g), Number(v.ayar)); if (v.dir === 'out' && h > (c.hasBalance || 0)) return toast('Bakiye yetersiz', 'err'); c.hasBalance = Math.round(((c.hasBalance || 0) + (v.dir === 'in' ? h : -h)) * 1000) / 1000; db.insert('tx', { no: 'E' + (10000 + db.all('tx').length), type: 'emanet', at: new Date().toISOString(), customer: c.id, lines: [{ kind: 'emanet', name: `Emanet ${v.dir === 'in' ? 'giriş' : 'çıkış'} ${v.ayar} ayar`, ayar: Number(v.ayar), g: Number(v.g), has: h, price: 0 }], total: 0, hasRate: Number(S().hasBuy), pay: '-', user: (NS.currentUser || {}).name }); db.save(); draw(); NS.printHtml(`<div style="width:280px;font:12px Arial"><b>${esc(S().bizName)}</b><br>EMANET ${v.dir === 'in' ? 'ALINDI' : 'TESLİM EDİLDİ'} · ${NS.dt(new Date())}<hr>${esc(c.name)}<br>${v.ayar} ayar ${gr(Number(v.g))} = has ${gr(h)}<hr>Güncel bakiye: <b>${gr(c.hasBalance)} has</b><br><br>İmza:</div>`, { title: 'Emanet' }); } });
  }

  // ---------- Özel sipariş ----------
  function ordersPage(el, p, app) {
    const ST = { siparis: ['Sipariş alındı', 'info'], atolyede: ['Atölyede', 'warn'], hazir: ['Hazır', 'ok'], teslim: ['Teslim edildi', ''] };
    NS.crud(el, app, { col: 'orders', title: 'Özel Sipariş', sub: 'Yüzük ölçüsü, isim kolye, tamir — kaporalı sipariş takibi', single: 'Sipariş', addLabel: 'Yeni sipariş', emptyIcon: 'clock',
      fields: [{ name: 'customer', label: 'Müşteri', type: 'select', options: db.all('customers').map((c) => ({ value: c.id, label: c.name })) }, { name: 'desc', label: 'Sipariş detayı', required: true, full: true }, { name: 'due', label: 'Teslim tarihi', type: 'date' }, { name: 'est', label: 'Tahmini tutar (₺)', type: 'number' }, { name: 'deposit', label: 'Alınan kapora (₺)', type: 'number' }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(ST).map(([value, v]) => ({ value, label: v[0] })) }],
      defaults: () => ({ status: 'siparis', due: iso(addDays(new Date(), 7)) }), sort: (a, b) => String(a.due).localeCompare(String(b.due)),
      filters: [{ value: 'acik', label: 'Açık', test: (o) => o.status !== 'teslim' }, { value: 'all', label: 'Tümü' }],
      columns: [{ label: 'Müşteri', render: (o) => `<b>${esc((cus(o.customer) || {}).name || '-')}</b>` }, { key: 'desc', label: 'Sipariş', render: (o) => esc(o.desc) }, { key: 'due', label: 'Teslim', render: (o) => (o.status !== 'teslim' && o.due < today() ? badge(NS.date(o.due), 'err') : NS.date(o.due)) }, { label: 'Kapora / tutar', cls: 'right', render: (o) => `${money(o.deposit || 0)}<div class="small faint">${money(o.est || 0)}</div>` }, { key: 'status', label: 'Durum', render: (o) => badge(ST[o.status][0], ST[o.status][1]) }],
      extraActions: [{ icon: 'message', act: 'sms', title: '"Hazır" SMS' }], onAction: (a, o) => { const c = cus(o.customer); if (!c || !c.phone) return toast('Müşteri telefonu yok', 'err'); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName}: ${o.desc} siparişiniz hazır. Kalan: ${money((o.est || 0) - (o.deposit || 0))}` }, true); toast('SMS gönderildi', 'ok'); } });
  }

  // ---------- Kasa & özet ----------
  function dashboard(el, p, app) {
    const all = db.all('tx'); const t = today(); const tod = all.filter((x) => iso(x.at) === t);
    const sales = tod.filter((x) => x.type === 'satis'), buys = tod.filter((x) => x.type === 'alis');
    const m30 = all.filter((x) => x.at > addDays(new Date(), -30).toISOString());
    // Makas kârı: satışta (satış kuru - alış kuru) × has + işçilik; alışta kesinti
    const margin = (x) => (x.type === 'satis' ? sum(x.lines, (l) => l.price - l.has * Number(S().hasBuy)) : sum(x.lines, (l) => l.has * Number(S().hasBuy) - l.price));
    const ser = NS.dailySeries(all.filter((x) => x.type === 'satis'), 14, 'at', (x) => x.total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/alis">${icon('download')} Alış</a><a class="btn primary" href="#/satis">${icon('star')} Satış</a>`) + rateBar() + `
      <div class="grid g4 mb">${kpi('Bugün satış', money(sum(sales, (x) => x.total)), 'trend', 'ok', `<div class="small faint">${sales.length} işlem · ${gr(sum(sales.flatMap((x) => x.lines), (l) => l.has))} has</div>`)}${kpi('Bugün alış', money(sum(buys, (x) => x.total)), 'download', 'info', `<div class="small faint">${gr(sum(buys.flatMap((x) => x.lines), (l) => l.has))} has</div>`)}${kpi('Kasa (TL)', money(db.data.cash.tl), 'cash', '')}${kpi('30 gün brüt kâr', money(sum(m30, margin)), 'percent', 'ok', '<div class="small faint">makas + işçilik</div>')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün satış</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div><div class="card"><div class="card-h"><h3>Satılan (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30.filter((x) => x.type === 'satis').flatMap((x) => x.lines), (l) => (l.kind === 'coin' ? l.name : 'Takı'))).map(([label, v]) => ({ label, value: sum(v, (l) => l.price) })), { size: 130, format: (v) => NS.compact(v) })}</div></div></div>
      <div class="card"><div class="card-h"><h3>Bugünkü işlemler</h3><button class="btn sm" id="z">${icon('print')} Gün sonu</button></div>${table({ rows: tod.slice().reverse(), empty: 'Bugün işlem yok', columns: [{ label: 'No', render: (x) => `<b class="mono">${esc(x.no)}</b><div class="small faint">${NS.time ? NS.time(x.at) : NS.dt(x.at)}</div>` }, { label: 'Tür', render: (x) => badge(x.type === 'satis' ? 'Satış' : x.type === 'alis' ? 'Alış' : 'Emanet', x.type === 'satis' ? 'ok' : x.type === 'alis' ? 'info' : 'warn') }, { label: 'İçerik', render: (x) => `<span class="small">${x.lines.map((l) => esc(l.name) + (l.qty ? ' ×' + l.qty : '')).join(', ')}</span>` }, { label: 'Has', cls: 'right', render: (x) => gr(sum(x.lines, (l) => l.has)) }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.total)}</b><div class="small faint">${esc(x.pay)}</div>` }], actions: [{ icon: 'print', act: 'pr' }] })}</div>`;
    on(el, 'click', '[data-act=pr]', (e, b) => receipt(db.get('tx', b.dataset.id)));
    $('#z', el).onclick = () => { const by = (arr, m) => sum(arr.filter((x) => x.pay === m), (x) => x.total); NS.printHtml(`<div style="width:300px;font:12px Arial"><b>${esc(S().bizName)}</b><br>GÜN SONU · ${NS.dateLong(new Date())}<hr>Satış: ${sales.length} işlem · ${money(sum(sales, (x) => x.total))}<br>&nbsp; Nakit ${money(by(sales, 'Nakit'))} · Kart ${money(by(sales, 'Kredi kartı'))} · Havale ${money(by(sales, 'Havale'))}<br>Alış: ${buys.length} işlem · ${money(sum(buys, (x) => x.total))}<hr>Has çıkışı: ${gr(sum(sales.flatMap((x) => x.lines), (l) => l.has))}<br>Has girişi: ${gr(sum(buys.flatMap((x) => x.lines), (l) => l.has))}<hr>Kasa: <b>${money(db.data.cash.tl)}</b><br>Kur: ${money(S().hasBuy)} / ${money(S().hasSell)}</div>`, { title: 'Gün sonu' }); };
  }

  const ROLES = { admin: 'Dükkân sahibi', tezgah: 'Tezgâhtar' };
  NS.shell({
    id: 'kuyumcu', integrations: ['printer', 'label', 'barcode', 'pos', 'efatura', 'sms', 'kps', 'webhook', 'backup'], name: 'Kuyumcu', tagline: 'Altın, kur ve emanet yönetimi', icon: 'star', accent: '#b45309', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Tezgâh' }, { id: 'ozet', label: 'Özet & Kasa', icon: 'home', roles: ['tezgah'] }, { id: 'satis', label: 'Satış', icon: 'star', roles: ['tezgah'] }, { id: 'alis', label: 'Alış & Hurda', icon: 'download', roles: ['tezgah'] }, { id: 'kur', label: 'Kur & Fiyatlar', icon: 'trend', roles: ['tezgah'] }, { sec: 'Dükkân' }, { id: 'stok', label: 'Stok', icon: 'layers', roles: ['tezgah'] }, { id: 'musteriler', label: 'Müşteri & Emanet', icon: 'users', roles: ['tezgah'] }, { id: 'siparis', label: 'Özel Sipariş', icon: 'clock', roles: ['tezgah'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, satis: salePage, alis: buyPage, kur: ratePage, stok: stockPage, musteriler: customersPage, siparis: ordersPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Kur servisi' }, { name: 'rateUrl', label: 'Kur servisi adresi (JSON)', full: true, hint: 'Yanıtta hasBuy/hasSell (veya HAS.alis/satis) alanları beklenir' }] }) },
  });
})();
