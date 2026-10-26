/* NEBSOFT E-ticaret — mağaza yönetimi: sipariş, ürün/varyant, müşteri, kupon, terk edilen sepet, iade ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const SH = window.SHOP;
  const db = new NS.DB('eticaret', SH.seed);
  const MP = window.MPHUB; MP.ensure(db);
  const chTag = (o) => (MP.CH[o.channel] ? MP.chBadge(o.channel) : '');
  const S = () => db.settings({});
  const prod = (id) => db.get('products', id) || { name: '-', variants: [], colors: [] };
  const cust = (id) => db.get('customers', id) || { name: '-' };
  const catName = (id) => (db.get('cats', id) || {}).name || '-';
  const img = (p) => `<div class="pimg" style="background:#f4f1ec;overflow:hidden;padding:0"><img src="${SH.imgUrl(SH.photos(p)[0], 120, 120)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;this.src='${SH.fallback(p)}'"></div>`;
  const PAY = { kart: 'Kredi kartı', kapida: 'Kapıda ödeme', havale: 'Havale/EFT' };
  const FLOW = ['yeni', 'hazirlaniyor', 'kargoda', 'teslim'];
  const shopUrl = () => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'magaza.html';

  // ---------- Sipariş ----------
  function orderModal(app, o) {
    const idx = FLOW.indexOf(o.status);
    modal({
      title: `Sipariş ${o.no}`, size: 'wide',
      body: `${['iptal', 'iade'].includes(o.status) ? `<div class="mb">${badge(SH.ST[o.status][0], SH.ST[o.status][1])}</div>` : `<div class="steps-o mb">${FLOW.map((s, i) => `<div class="${i <= idx ? 'on' : ''}"><i></i>${SH.ST[s][0]}</div>`).join('')}</div>`}
        <div class="grid g2"><div>${o.items.map((i) => { const p = prod(i.pid); return `<div class="list-item">${img(p)}<div class="grow"><b>${esc(i.name)}</b><div class="small muted">${esc(i.variant)} · ${i.qty} adet</div><div class="small faint mono">${esc((p.variants.find((v) => v.id === i.vid) || {}).sku || '')}</div></div><b>${money(i.price * i.qty)}</b></div>`; }).join('')}
          <div class="row between mt small"><span>Ara toplam</span><span>${money(o.subtotal)}</span></div>${o.discount ? `<div class="row between small" style="color:var(--ok)"><span>İndirim ${esc(o.coupon || '')}</span><span>-${money(o.discount)}</span></div>` : ''}<div class="row between small"><span>Kargo</span><span>${o.shipping ? money(o.shipping) : 'Ücretsiz'}</span></div>${o.cod ? `<div class="row between small"><span>Kapıda ödeme bedeli</span><span>${money(o.cod)}</span></div>` : ''}<div class="row between"><b>Toplam</b><b style="font-size:20px">${money(o.total)}</b></div></div>
        <div class="col"><div class="card pad"><b>${esc(o.ship.name)}</b><div class="small">${esc(o.ship.phone)}</div><div class="small muted">${esc(o.ship.address)}, ${esc(o.ship.city)}</div></div>
          <div class="list-item small"><span class="grow muted">Ödeme</span>${PAY[o.pay]}</div><div class="list-item small"><span class="grow muted">Kanal</span>${MP.CH[o.channel] ? `${chTag(o)} <span class="small mono">${esc(o.channelNo || '')}</span>` : `Kendi mağaza${o.channel ? ' · ' + esc(o.channel) : ''}`}</div><div class="list-item small"><span class="grow muted">Tarih</span>${NS.dt(o.at)}</div>
          ${o.tracking ? `<div class="list-item small"><span class="grow muted">Kargo</span><b>${esc(o.carrier)}</b> <span class="mono">${esc(o.tracking)}</span></div>` : ''}${o.note ? `<div class="card pad small" style="background:var(--warn-soft);border:0">${icon('message')} ${esc(o.note)}</div>` : ''}</div></div>`,
      actions: [
        ...(!['iptal', 'iade', 'teslim'].includes(o.status) ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { c(); if (await confirm('Sipariş iptal edilsin mi? Stoklar geri eklenir.')) { restock(o); o.status = 'iptal'; db.log('Sipariş iptal', o.no); db.save(); app.refresh(); } } }] : []),
        { label: 'Paket fişi', icon: 'print', onClick: () => printSlip(o) },
        ...(o.status === 'yeni' ? [{ label: 'Hazırlanıyor', cls: 'primary', onClick: (c) => { o.status = 'hazirlaniyor'; db.save(); c(); app.refresh(); } }] : []),
        ...(o.status === 'hazirlaniyor' ? [{ label: 'Kargoya ver', cls: 'primary', icon: 'truck', onClick: (c) => { c(); ship(app, o); } }] : []),
        ...(o.status === 'kargoda' ? [{ label: 'Teslim edildi', cls: 'ok', onClick: (c) => { o.status = 'teslim'; db.save(); c(); app.refresh(); } }] : []),
      ],
    });
  }
  function restock(o) { o.items.forEach((i) => { const v = prod(i.pid).variants.find((x) => x.id === i.vid); if (v) v.stock += i.qty; }); }
  async function ship(app, o) {
    const api = NS.integ && NS.integ.isOn('kargofirma');
    const v = await formModal({ title: `Kargoya ver — ${o.no}`, fields: [{ name: 'carrier', label: 'Kargo firması', type: 'select', options: String(S().carriers || '').split(',').map((x) => x.trim()).filter(Boolean) }, { name: 'desi', label: 'Desi', type: 'number', value: Math.max(1, sum(o.items, (i) => i.qty)) }, { name: 'tracking', label: api ? 'Takip numarası (boşsa kargo firmasından alınır)' : 'Takip numarası', required: !api, value: api ? '' : String(NS.rand(100000000, 999999999)) }, { name: 'eirs', label: 'e-İrsaliye / e-Arşiv fatura gönder', type: 'checkbox', value: NS.integ && (NS.integ.isOn('eirsaliye') || NS.integ.cfg('efatura').provider !== 'sim') }] });
    if (!v) return;
    // Kargo firması API: gönderi oluşturulur, takip no ve barkod geri döner
    if (api && !v.tracking) { const r = await NS.integ.call('kargofirma', 'gonderi-olustur', { carrier: v.carrier, ref: o.no, desi: v.desi, cod: o.pay === 'kapida' ? o.total : 0, receiver: o.ship, sender: { name: S().bizName, phone: S().bizPhone, address: S().bizAddress } }); if (!r || !r.ok) return; v.tracking = (r.data && r.data.tracking) || r.ref; }
    const eirs = v.eirs; delete v.eirs;
    Object.assign(o, v, { status: 'kargoda', shippedAt: new Date().toISOString() }); db.log('Kargoya verildi', o.no); db.save();
    if (eirs && NS.integ) { const r = await NS.integ.sendEInvoice({ buyer: o.ship.name, no: o.no, total: o.total, buyerEmail: (db.get('customers', o.customer) || {}).email, address: `${o.ship.address || ''} ${o.ship.city || ''}`, lines: [...o.items.map((i) => ({ name: `${i.name} ${i.variant || ''}`.trim(), qty: i.qty, vat: 20, total: i.qty * i.price })), ...(o.shipping ? [{ name: 'Kargo bedeli', qty: 1, vat: 20, total: o.shipping }] : [])] }); if (r.ok) { o.ebelge = { type: r.type, no: r.no }; db.save(); } }
    if (o.channelNo && MP.CH[o.channel]) MP.shipNotify(o);
    if (NS.integ) NS.integ.sms(o.ship.phone, `${S().bizName}: ${o.no} nolu siparişiniz ${o.carrier} ile kargoya verildi. Takip no: ${o.tracking}`, { silent: true }); toast('Kargoya verildi, müşteriye SMS gönderildi', 'ok'); printLabel(o); app.refresh();
  }
  function printSlip(o) { NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>PAKET FİŞİ — ${esc(o.no)}</h3><p><b>${esc(o.ship.name)}</b> · ${esc(o.ship.phone)}<br>${esc(o.ship.address)}, ${esc(o.ship.city)}</p><table><tr><th>Ürün</th><th>Varyant</th><th>SKU</th><th>Adet</th><th>✓</th></tr>${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.variant)}</td><td>${esc((prod(i.pid).variants.find((v) => v.id === i.vid) || {}).sku || '')}</td><td>${i.qty}</td><td>☐</td></tr>`).join('')}</table><p>Ödeme: ${PAY[o.pay]} ${o.pay === 'kapida' ? `— <b>Kapıda tahsil: ${money(o.total)}</b>` : ''}</p><p style="margin-top:30px">Bizi tercih ettiğiniz için teşekkürler 💜</p></div>`, { title: o.no }); }
  function printLabel(o) { NS.printHtml(`<div style="border:2px solid #000;padding:12px;width:360px;font-family:Arial"><div style="display:flex;justify-content:space-between"><b>${esc(o.carrier)}</b><b>${esc(o.no)}</b></div><hr><div style="font-size:11px">GÖNDERİCİ: ${esc(S().bizName)} · ${esc(S().bizPhone)}</div><div style="font-size:16px;margin-top:8px"><b>ALICI: ${esc(o.ship.name)}</b></div><div>${esc(o.ship.address)}</div><div><b>${esc(o.ship.city)}</b> · ${esc(o.ship.phone)}</div>${o.pay === 'kapida' ? `<div style="background:#000;color:#fff;padding:4px;margin-top:6px;text-align:center"><b>KAPIDA ÖDEME ${money(o.total)}</b></div>` : ''}<div style="margin-top:8px">${NS.barcodeSvg(o.tracking, { height: 50 })}</div></div>`, { title: 'Kargo etiketi' }); }

  function ordersPage(el, p, app) {
    let q = '', f = p || 'aktif';
    el.innerHTML = pageHead('Siparişler', 'Mağaza ve pazaryeri siparişleri', `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><button class="btn" id="mp">${icon('download')} Pazaryeri siparişlerini çek</button><button class="btn" id="ex">${icon('download')}</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Sipariş no, müşteri, takip no...')}<div class="seg">${[['aktif', 'Aktif'], ['yeni', 'Yeni'], ['hazirlaniyor', 'Hazırlanan'], ['kargoda', 'Kargoda'], ['teslim', 'Teslim'], ['iptal', 'İptal/İade'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}${v === 'yeni' ? ` (${db.all('orders', (o) => o.status === 'yeni').length})` : ''}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('orders', (o) => (f === 'all' || (f === 'aktif' ? ['yeni', 'hazirlaniyor', 'kargoda'].includes(o.status) : f === 'iptal' ? ['iptal', 'iade'].includes(o.status) : o.status === f)) && NS.match(q, o.no, o.ship.name, o.ship.phone, o.tracking)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'bag', columns: [{ label: 'Sipariş', render: (o) => `<b>${esc(o.no)}</b> ${chTag(o)}<div class="small faint">${NS.dt(o.at)}</div>` }, { label: 'Müşteri', render: (o) => `${esc(o.ship.name)}<div class="small faint">${esc(o.ship.city)}</div>` }, { label: 'Ürün', render: (o) => `<span class="small">${esc(o.items.map((i) => i.name).join(', ')).slice(0, 60)}</span>` }, { label: 'Ödeme', render: (o) => badge(PAY[o.pay], o.pay === 'kapida' ? 'warn' : 'info') }, { label: 'Durum', render: (o) => badge(SH.ST[o.status][0], SH.ST[o.status][1]) }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>` }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} sipariş · ${money(sum(r, (o) => o.total))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    // Trendyol / Hepsiburada / n11... siparişleri mağaza siparişi gibi düşer, stok varyanttan düşülür
    $('#mp', el).onclick = async () => {
      // Canlı kanal varsa doğrudan pazaryeri API'sinden çekilir
      if (Object.keys(MP.CH).some((k) => MP.isLive(k))) { const n = await MP.pullOrders(); toast(n.err || `${n.count} pazaryeri siparişi alındı`, n.err ? 'err' : n.count ? 'ok' : ''); return app.refresh(); }
      if (!NS.integ) return; const r = await NS.integ.call('pazaryeri', 'siparis-cek', { since: S().mpSince || '' }); if (!r || !r.ok) return;
      let list = r.data && Array.isArray(r.data.orders) ? r.data.orders : [];
      if (r.simulated) { const ps = db.all('products', (x) => x.active && x.variants.some((v) => v.stock > 0)); const pr = NS.pick(ps); const vr = pr ? pr.variants.find((v) => v.stock > 0) : null; const conn = Object.keys(MP.CH).filter((k) => (db.data.mpChannels[k] || {}).connected); list = vr && conn.length ? [{ channel: NS.pick(conn), orderNo: String(NS.rand(1e8, 9e8)), customer: { name: NS.pick(['Selin Yurt', 'Burak Er', 'Ece Kaya']), phone: NS.phone(), address: 'Atatürk Mah. 12. Sok. No:4', city: NS.pick(['İstanbul', 'Ankara', 'İzmir']) }, items: [{ pid: pr.id, vid: vr.id, qty: 1, price: pr.sale || pr.price }] }] : []; }
      let n = 0;
      list.forEach((x) => { if (db.find('orders', (o) => o.channelNo === x.orderNo)) return; const items = x.items.map((i) => { const pr = prod(i.pid); const vr = pr.variants.find((v) => v.id === i.vid) || {}; vr.stock = Math.max(0, (vr.stock || 0) - i.qty); return { pid: i.pid, vid: i.vid, name: pr.name, variant: `${vr.color || ''} ${vr.size || ''}`.trim(), qty: i.qty, price: i.price }; }); const total = sum(items, (i) => i.qty * i.price); db.insert('orders', { no: 'PY' + db.nextNo('mp'), at: new Date().toISOString(), channel: x.channel, channelNo: x.orderNo, channelShip: 60, ship: x.customer, items, subtotal: total, shipping: 0, discount: 0, total, pay: 'kart', status: 'yeni', note: `${(MP.CH[x.channel] || {}).name || x.channel} sipariş no ${x.orderNo}` }, true); MP.stockChanged(items.map((i) => ({ vid: i.vid, qty: i.qty }))); n++; });
      db.saveSettings({ mpSince: new Date().toISOString() }); db.save(); toast(`${n} pazaryeri siparişi alındı`, n ? 'ok' : ''); app.refresh();
    };
    $('#ex', el).onclick = () => NS.csv('siparisler', rows(), [{ key: 'no', label: 'No' }, { label: 'Tarih', value: (o) => NS.dt(o.at) }, { label: 'Müşteri', value: (o) => o.ship.name }, { label: 'Şehir', value: (o) => o.ship.city }, { label: 'Durum', value: (o) => SH.ST[o.status][0] }, { key: 'total', label: 'Tutar' }, { key: 'tracking', label: 'Takip' }]);
    draw();
  }

  // ---------- Ürünler ----------
  async function productEditor(app, rec) {
    const p = rec ? JSON.parse(JSON.stringify(rec)) : { name: '', cat: 'elbise', price: 0, sale: null, desc: '', colors: ['Siyah'], variants: [], tags: [], active: true };
    const sizesOf = (cat) => (cat === 'ayakkabi' ? ['36', '37', '38', '39', '40'] : cat === 'aksesuar' ? ['Standart'] : ['XS', 'S', 'M', 'L', 'XL']);
    modal({
      title: rec ? p.name : 'Yeni ürün', size: 'xl',
      body: `<div class="grid g2"><div id="pf">${NS.fieldsHtml([{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'cat', label: 'Kategori', type: 'select', options: db.all('cats').map((c) => ({ value: c.id, label: c.name })) }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'sale', label: 'İndirimli fiyat (₺)', type: 'number' }, { name: 'tagsStr', label: 'Etiketler (virgülle)', hint: 'Yeni, Çok satan, Son ürünler' }, { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }, { name: 'active', label: 'Mağazada yayında', type: 'checkbox' }], { ...p, tagsStr: (p.tags || []).join(', ') })}</div>
        <div><h3 class="mb">Renkler</h3><div class="row mb">${Object.keys(SH.COLORS).map((c) => `<label class="check small"><input type="checkbox" data-col="${c}" ${p.colors.includes(c) ? 'checked' : ''}><span class="sw" style="background:${SH.COLORS[c]}"></span>${c}</label>`).join('')}</div>
        <h3 class="mb">Varyant stokları</h3><div id="vg" style="overflow:auto"></div></div></div>`,
      onOpen: (b) => {
        const draw = () => {
          const cat = $('[name=cat]', b).value; const sizes = sizesOf(cat);
          $('#vg', b).innerHTML = p.colors.length ? `<table class="vgrid"><tr><th></th>${sizes.map((s) => `<th>${s}</th>`).join('')}</tr>${p.colors.map((c) => `<tr><th><span class="sw" style="background:${SH.COLORS[c]}"></span> ${c}</th>${sizes.map((s) => { const v = p.variants.find((x) => x.color === c && x.size === s); return `<td><input class="input" type="number" min="0" data-v="${c}|${s}" value="${v ? v.stock : 0}"></td>`; }).join('')}</tr>`).join('')}</table>` : '<div class="faint small">Renk seçin</div>';
        };
        on(b, 'change', '[data-col]', (e, x) => { const c = x.dataset.col; p.colors = x.checked ? [...p.colors, c] : p.colors.filter((y) => y !== c); draw(); });
        on(b, 'input', '[data-v]', (e, x) => { const [c, s] = x.dataset.v.split('|'); let v = p.variants.find((y) => y.color === c && y.size === s); if (!v) { v = { id: NS.uid(), color: c, size: s, stock: 0, sku: '' }; p.variants.push(v); } v.stock = Math.max(0, Number(x.value) || 0); });
        $('[name=cat]', b).onchange = draw;
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => {
        if (!NS.validate($('#pf', b))) return;
        const v = NS.readForm($('#pf', b)); if (!p.colors.length) return toast('En az bir renk seçin', 'err');
        const sizes = sizesOf(v.cat);
        p.variants = p.variants.filter((x) => p.colors.includes(x.color) && sizes.includes(x.size));
        p.colors.forEach((col) => sizes.forEach((s) => { if (!p.variants.find((x) => x.color === col && x.size === s)) p.variants.push({ id: NS.uid(), color: col, size: s, stock: 0 }); }));
        p.variants.forEach((x) => { x.sku = x.sku || `LB${Date.now().toString().slice(-3)}-${x.color.slice(0, 3).toUpperCase()}-${x.size}`; });
        Object.assign(p, { name: v.name, cat: v.cat, price: Number(v.price) || 0, sale: Number(v.sale) || null, desc: v.desc, active: v.active, tags: v.tagsStr.split(',').map((t) => t.trim()).filter(Boolean), slug: NS.slug(v.name) });
        delete p.tagsStr;
        if (rec) db.update('products', rec.id, p); else db.insert('products', { ...p, views: 0 });
        c(); toast('Ürün kaydedildi', 'ok'); app.refresh();
      } }],
    });
  }
  function productsPage(el, p, app) {
    let q = '', c = '', low = false;
    el.innerHTML = pageHead('Ürünler', 'Varyant (renk/beden) bazlı stok', `<button class="btn" id="ex">${icon('download')}</button><button class="btn" id="mps">${icon('store')} Pazaryerine gönder</button><button class="btn primary" id="np">${icon('plus')} Yeni ürün</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ürün adı, SKU...')}<select class="input" id="c" style="max-width:190px"><option value="">Tüm kategoriler</option>${db.all('cats').map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><label class="check small"><input type="checkbox" id="low"> Tükenen varyantı olanlar</label></div><div id="t"></div></div>`;
    const draw = () => { const rows = db.all('products', (x) => (!c || x.cat === c) && (!low || x.variants.some((v) => v.stock === 0)) && NS.match(q, x.name, ...x.variants.map((v) => v.sku))); $('#t', el).innerHTML = table({ rows, columns: [{ label: 'Ürün', render: (x) => `<div class="row nw">${img(x)}<div><b>${esc(x.name)}</b> ${x.tags.map((t) => badge(t, 'acc')).join(' ')}${x.active ? '' : ' ' + badge('Yayında değil', 'err')}<div class="small faint">${esc(catName(x.cat))} · ${x.colors.map((col) => `<span class="sw" style="background:${SH.COLORS[col]}" title="${col}"></span>`).join(' ')}</div></div></div>` }, { label: 'Fiyat', cls: 'right', render: (x) => (x.sale ? `<s class="faint">${money(x.price)}</s><br><b style="color:var(--err)">${money(x.sale)}</b>` : `<b>${money(x.price)}</b>`) }, { label: 'Stok', cls: 'right', render: (x) => { const s = SH.stock(x); const z = x.variants.filter((v) => v.stock === 0).length; return `${s}${z ? `<div>${badge(z + ' varyant tükendi', 'warn')}</div>` : ''}`; } }, { label: 'Satış (45 gün)', cls: 'right', render: (x) => sum(db.all('orders', (o) => !['iptal', 'iade'].includes(o.status)).flatMap((o) => o.items).filter((i) => i.pid === x.id), (i) => i.qty) }, { label: 'Görüntülenme', cls: 'right', render: (x) => num(x.views) }], actions: [{ icon: 'eye', act: 'view', title: 'Mağazada gör' }, { icon: 'edit', act: 'ed' }, { icon: 'trash', act: 'del' }], foot: `${rows.length} ürün · ${num(sum(rows, SH.stock))} adet stok` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#c', el).onchange = (e) => { c = e.target.value; draw(); };
    $('#low', el).onchange = (e) => { low = e.target.checked; draw(); };
    $('#mps', el).onclick = async () => { if (!NS.integ) return; const items = db.all('products', (x) => x.active).flatMap((x) => x.variants.map((v) => ({ sku: v.sku, name: `${x.name} ${v.color} ${v.size}`, category: catName(x.cat), price: x.sale || x.price, listPrice: x.price, stock: v.stock, color: v.color, size: v.size }))); const r = await NS.integ.call('pazaryeri', 'urun-gonder', { items }); if (r && r.ok) toast(`${items.length} varyant pazaryerine iletildi`, 'ok'); };
    $('#np', el).onclick = () => productEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => { const x = db.get('products', b.dataset.id); if (b.dataset.act === 'ed') productEditor(app, x); else if (b.dataset.act === 'view') window.open(`magaza.html#/urun/${x.slug}`, '_blank'); else if (await confirm(`${x.name} silinsin mi?`)) { db.remove('products', x.id); draw(); } });
    $('#ex', el).onclick = () => NS.csv('urunler', db.all('products').flatMap((x) => x.variants.map((v) => ({ x, v }))), [{ label: 'Ürün', value: (r) => r.x.name }, { label: 'SKU', value: (r) => r.v.sku }, { label: 'Renk', value: (r) => r.v.color }, { label: 'Beden', value: (r) => r.v.size }, { label: 'Stok', value: (r) => r.v.stock }, { label: 'Fiyat', value: (r) => SH.price(r.x) }]);
    draw();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const ok = db.all('orders', (o) => !['iptal', 'iade'].includes(o.status));
    const t = today(); const d30 = addDays(new Date(), -30).toISOString();
    const todayO = ok.filter((o) => iso(o.at) === t), m30 = ok.filter((o) => o.at > d30);
    const ser = NS.dailySeries(ok, 30, 'at', (o) => o.total);
    const topMap = {}; m30.forEach((o) => o.items.forEach((i) => { topMap[i.pid] = (topMap[i.pid] || 0) + i.qty; }));
    const top = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const zeroV = db.all('products').flatMap((x) => x.variants.filter((v) => v.stock === 0).map((v) => ({ x, v })));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><a class="btn primary" href="#/siparisler/yeni">${icon('bag')} Yeni siparişler (${db.all('orders', (o) => o.status === 'yeni').length})</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün sipariş', todayO.length, 'bag', '', `<div class="small faint">${money(sum(todayO, (o) => o.total))}</div>`)}${kpi('30 gün ciro', money(sum(m30, (o) => o.total)), 'trend', 'ok')}${kpi('Ortalama sepet', money(m30.length ? sum(m30, (o) => o.total) / m30.length : 0), 'cart', 'info')}${kpi('Kargolanacak', db.all('orders', (o) => ['yeni', 'hazirlaniyor'].includes(o.status)).length, 'truck', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük ciro (30 gün)</h3></div><div class="card-b">${chart.line([{ name: 'Ciro', values: ser.values }], ser.labels, { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Trafik kaynakları</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => (o.channel ? (MP.CH[o.channel] || {}).name || o.channel : 'Kendi mağaza'))).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Çok satanlar</h3></div><div class="card-b">${top.map(([id, n]) => `<div class="list-item">${img(prod(id))}<span class="grow"><b>${esc(prod(id).name)}</b></span><b>${n} adet</b></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('cart')} Terk edilen sepetler</h3><a class="btn sm" href="#/sepetler">Tümü</a></div><div class="card-b">${db.all('carts', (c) => !c.reminded).slice(0, 5).map((c) => `<div class="list-item small"><span class="grow"><b>${esc(c.name)}</b><div class="faint">${NS.ago(c.at)}</div></span><b>${money(c.total)}</b></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Tükenen varyantlar (${zeroV.length})</h3></div><div class="card-b" style="max-height:300px;overflow:auto">${zeroV.slice(0, 12).map((r) => `<div class="list-item small"><span class="grow">${esc(r.x.name)}</span>${badge(`${r.v.color} / ${r.v.size}`, 'err')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>`;
  }
  function cartsPage(el, p, app) {
    const rows = db.all('carts').sort((a, b) => b.at.localeCompare(a.at));
    el.innerHTML = pageHead('Terk Edilen Sepetler', 'Ödeme adımına gelip tamamlamayan ziyaretçiler — hatırlatma ile geri kazanın') + `<div class="grid g3 mb">${kpi('Bekleyen sepet', rows.filter((c) => !c.reminded).length, 'cart', 'warn')}${kpi('Potansiyel ciro', money(sum(rows, (c) => c.total)), 'wallet', 'info')}${kpi('Hatırlatılan', rows.filter((c) => c.reminded).length, 'send', 'ok')}</div>
      <div class="card">${table({ rows, empty: 'Terk edilen sepet yok', columns: [{ label: 'Ziyaretçi', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}</div>` }, { label: 'Ürünler', render: (c) => esc(c.items.map((i) => i.name).join(', ')) }, { label: 'Zaman', render: (c) => NS.ago(c.at) }, { label: 'Tutar', cls: 'right', render: (c) => `<b>${money(c.total)}</b>` }, { label: 'Durum', render: (c) => (c.reminded ? badge('Hatırlatıldı', 'ok') : badge('Bekliyor', 'warn')) }], actions: [{ icon: 'message', act: 'wa', title: 'WhatsApp ile hatırlat' }] })}</div>`;
    on(el, 'click', '[data-act=wa]', (e, b) => { const c = db.get('carts', b.dataset.id); c.reminded = true; db.save(); window.open(`https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${c.name}, sepetinizde ${c.items.map((i) => i.name).join(', ')} sizi bekliyor 💜 HOSGELDIN koduyla %10 indirim: ${shopUrl()}`)}`, '_blank', 'noopener'); app.refresh(); });
  }
  function returnsPage(el, p, app) {
    const RS = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi', 'err'] };
    el.innerHTML = pageHead('İade Talepleri', 'Müşterilerin mağazadan oluşturduğu iade talepleri') + `<div class="card">${table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)), empty: 'İade talebi yok', columns: [{ label: 'Sipariş', render: (r) => `<b>${esc((db.get('orders', r.order) || {}).no || '-')}</b>` }, { label: 'Müşteri', render: (r) => esc(((db.get('orders', r.order) || {}).ship || {}).name || '-') }, { label: 'Neden', key: 'reason' }, { label: 'Tarih', render: (r) => NS.ago(r.at) }, { label: 'Tutar', cls: 'right', render: (r) => money((db.get('orders', r.order) || {}).total || 0) }, { label: 'Durum', render: (r) => badge(RS[r.status][0], RS[r.status][1]) }], actions: [{ label: 'Onayla', act: 'ok', show: (r) => r.status === 'bekliyor' }, { label: 'Reddet', act: 'no', show: (r) => r.status === 'bekliyor' }] })}</div>`;
    on(el, 'click', '[data-act]', (e, b) => { const r = db.get('returns', b.dataset.id); const o = db.get('orders', r.order); r.status = b.dataset.act === 'ok' ? 'onay' : 'red'; if (r.status === 'onay' && o) { o.status = 'iade'; restock(o); } db.save(); toast(r.status === 'onay' ? 'İade onaylandı, stok güncellendi' : 'İade reddedildi', 'ok'); app.refresh(); });
  }
  function customersPage(el, p, app) {
    const ords = db.all('orders', (o) => !['iptal'].includes(o.status));
    NS.crud(el, app, {
      col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'city', label: 'Şehir' }, { name: 'address', label: 'Adres', full: true }],
      sort: (a, b) => sum(ords.filter((o) => o.customer === b.id), (o) => o.total) - sum(ords.filter((o) => o.customer === a.id), (o) => o.total), searchFields: (c) => [c.name, c.phone, c.email, c.city],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.email || '')}</div>` }, { key: 'city', label: 'Şehir' }, { label: 'Sipariş', cls: 'right', render: (c) => ords.filter((o) => o.customer === c.id).length }, { label: 'Toplam harcama', cls: 'right', render: (c) => `<b>${money(sum(ords.filter((o) => o.customer === c.id), (o) => o.total))}</b>` }, { label: 'Son sipariş', render: (c) => { const o = ords.filter((x) => x.customer === c.id).sort((a, b) => b.at.localeCompare(a.at))[0]; return o ? NS.ago(o.at) : '-'; } }],
    });
  }
  function reportsPage(el) {
    const ok = db.all('orders', (o) => !['iptal', 'iade'].includes(o.status));
    const byCat = {}; ok.forEach((o) => o.items.forEach((i) => { const c = catName(prod(i.pid).cat); byCat[c] = (byCat[c] || 0) + i.price * i.qty; }));
    const byCity = NS.groupBy(ok, (o) => o.ship.city);
    const all = db.all('orders'); const retRate = all.length ? Math.round((all.filter((o) => o.status === 'iade').length / all.length) * 1000) / 10 : 0;
    const views = sum(db.all('products'), (x) => x.views);
    el.innerHTML = pageHead('Raporlar', 'Kategori, şehir, ödeme ve dönüşüm analizleri') + `
      <div class="grid g4 mb">${kpi('Toplam ciro', money(sum(ok, (o) => o.total)), 'trend', 'ok')}${kpi('Sipariş', ok.length, 'bag')}${kpi('Dönüşüm oranı', '%' + (views ? ((ok.length / views) * 100).toFixed(2) : 0), 'percent', 'info')}${kpi('İade oranı', '%' + retRate, 'refresh', 'warn')}</div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), { format: money, size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Şehirler</h3></div><div class="card-b">${chart.bars(Object.entries(byCity).map(([label, v]) => ({ label: label.slice(0, 6), value: sum(v, (o) => o.total) })).sort((a, b) => b.value - a.value), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Ödeme yöntemleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(ok, (o) => PAY[o.pay])).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>`;
  }

  const ROLES = { admin: 'Mağaza sahibi', depo: 'Depo / sevkiyat' };
  NS.shell({
    id: 'eticaret', integrations: ['payment','sms','email','whatsapp','label','efatura','webhook','backup'], name: 'E-ticaret', tagline: 'Online Mağaza Yönetimi', icon: 'bag', accent: '#7c3aed', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['admin'] }, { id: 'siparisler', label: 'Siparişler', icon: 'bag', badge: true }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box' }, { id: 'kategoriler', label: 'Kategoriler', icon: 'grid', roles: ['admin'] }, ...MP.nav, { sec: 'Pazarlama' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['admin'] }, { id: 'kuponlar', label: 'Kuponlar', icon: 'ticket', roles: ['admin'] }, { id: 'sepetler', label: 'Terk Edilen Sepetler', icon: 'cart', roles: ['admin'] }, { id: 'iadeler', label: 'İadeler', icon: 'refresh' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Mağaza Ayarları', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'yeni').length || '' }),
    routes: {
      ...MP.routes, ozet: dashboard, siparisler: ordersPage, urunler: productsPage, musteriler: customersPage, sepetler: cartsPage, iadeler: returnsPage, raporlar: reportsPage,
      kategoriler: (el, p, a) => NS.crud(el, a, { col: 'cats', title: 'Kategoriler', single: 'Kategori', addLabel: 'Yeni kategori', fields: [{ name: 'name', label: 'Ad', required: true }], beforeSave: (v, rec) => { if (!rec) v.id = NS.slug(v.name); }, columns: [{ key: 'name', label: 'Kategori', render: (c) => `${SH.CAT_EMOJI[c.id] || '🛍️'} <b>${esc(c.name)}</b>` }, { label: 'Ürün', cls: 'right', render: (c) => db.all('products', (x) => x.cat === c.id).length }] }),
      kuponlar: (el, p, a) => NS.crud(el, a, { col: 'coupons', title: 'Kuponlar', single: 'Kupon', addLabel: 'Yeni kupon', emptyIcon: 'ticket', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'pct', label: 'Yüzde indirim' }, { value: 'tl', label: 'Tutar indirimi' }, { value: 'ship', label: 'Ücretsiz kargo' }] }, { name: 'value', label: 'Değer', type: 'number' }, { name: 'min', label: 'Alt limit (₺)', type: 'number' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { active: true, type: 'pct' }, beforeSave: (v) => { v.code = v.code.toUpperCase(); }, columns: [{ key: 'code', label: 'Kod', render: (k) => `<b class="mono">${esc(k.code)}</b>` }, { label: 'İndirim', render: (k) => (k.type === 'pct' ? '%' + k.value : k.type === 'tl' ? money(k.value) : 'Ücretsiz kargo') }, { key: 'min', label: 'Alt limit', render: (k) => money(k.min || 0) }, { key: 'uses', label: 'Kullanım', cls: 'right', render: (k) => k.uses || 0 }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza' }, { name: 'banner', label: 'Duyuru bandı', full: true }, { name: 'freeShip', label: 'Ücretsiz kargo eşiği (₺)', type: 'number' }, { name: 'shipFee', label: 'Kargo ücreti (₺)', type: 'number' }, { name: 'codFee', label: 'Kapıda ödeme bedeli (₺)', type: 'number' }, { name: 'bankHolder', label: 'Havale alıcı adı' }, { name: 'iban', label: 'Havale IBAN', full: true }, { name: 'carriers', label: 'Kargo firmaları (virgülle)', full: true }] }),
    },
  });
  window.addEventListener('storage', (e) => { if (e.key === db.key) db.load(); });
})();
