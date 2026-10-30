/* NEBSOFT Market POS — Hızlı Ticaret Kanalları: Getir Çarşı, Yemeksepeti Market, Trendyol Go.
   Kanal ayarları (açık/kapalı, min. sepet, hazırlık, fiyat farkı, stok tamponu), sipariş panosu (kabul → toplama → hazır → teslim),
   barkodla toplama kontrolü, eksik ürün çıkarma/ikame, tamamlanınca satış ve stok hareketi. app.js sayfa olarak kullanır. */
window.QCHUB = (function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, table, badge, kpi, pageHead, sum, iso, today } = NS;
  const QC = {
    getir: { name: 'Getir Çarşı', color: '#5d3ebc', commission: 18 },
    ys: { name: 'Yemeksepeti Market', color: '#ea004b', commission: 20 },
    tygo: { name: 'Trendyol Go', color: '#f27a1a', commission: 17 },
    web: { name: 'Web siteniz', color: '#0ea5e9', commission: 0, own: true },
  };
  const ST = { yeni: ['Yeni', 'warn'], toplaniyor: ['Toplanıyor', 'info'], hazir: ['Kuryeye hazır', 'acc'], teslim: ['Teslim edildi', 'ok'], iptal: ['İptal', 'err'] };
  let db;
  const r2 = (n) => Math.round(n * 100) / 100;
  // Bulut belgesinde qcChannels kullanıcı kanal bağlayana kadar yoktur: okuma boş döner, yazma yalnızca kullanıcı işleminde olur
  const cfg = (k) => ({ ...QC[k], ...((db.data.qcChannels || {})[k] || {}) });
  const setCh = (k, v) => { db.data.qcChannels = { ...(db.data.qcChannels || {}), [k]: v }; };
  const tag = (k) => `<span class="badge" style="background:${QC[k].color};color:#fff;border:0">${esc(QC[k].name)}</span>`;
  const P = (id) => db.get('products', id) || { name: '-', stock: 0 };
  const chPrice = (p, k) => Math.ceil(p.price * (1 + (Number(cfg(k).markup) || 0) / 100) * 4) / 4;
  const avail = (p, k) => Math.max(0, Math.floor(p.stock - (Number(cfg(k).buffer) || 0)));
  const sendI = (k, action, payload) => { if (NS.integ && NS.integ.isOn('pazaryeri')) NS.integ.call('pazaryeri', action, { channel: k, ...payload }, { silent: true }); };

  function mkOrder(k, minutesAgo, status) {
    const ps = db.all('products', (p) => p.barcode && p.stock > 3); const items = [];
    for (let i = 0; i < NS.rand(2, 6); i++) { const p = NS.pick(ps); if (items.some((x) => x.pid === p.id)) continue; items.push({ pid: p.id, name: p.name, qty: NS.rand(1, 3), price: chPrice(p, k), picked: status !== 'yeni' && status !== 'toplaniyor' }); }
    const at = new Date(Date.now() - minutesAgo * 60000).toISOString();
    return { id: NS.uid(), no: (k === 'getir' ? 'G' : k === 'ys' ? 'Y' : 'T') + NS.rand(100000, 999999), ch: k, at, status, items, customer: NS.pick(['Elif K.', 'Murat A.', 'Zeynep T.', 'Can Ö.', 'Deniz Y.']), address: NS.pick(['Moda Cad. No:12 D:4', 'Bahariye Cad. No:40 D:9', 'Kuşdili Sok. No:7 D:2']), note: NS.pick(['', '', 'Zili çalmayın, bebek uyuyor', 'Poşet istemiyorum']) };
  }
  // Demo verisi (bir kez). Yalnızca tarayıcıdaki demo/yerel veri içindir: bulut belgesi gerçek işletme verisidir, açılışta hiçbir şey yazılmaz
  function ensure(d) {
    db = d;
    if (db.cloud) return;
    if (db.data.qcChannels) return;
    db.data.qcChannels = { getir: { connected: true, storeId: 'GC-11872', open: true, minBasket: 150, radius: 2, prep: 10, markup: 8, buffer: 2 }, ys: { connected: true, storeId: 'YSM-5521', open: true, minBasket: 200, radius: 3, prep: 15, markup: 10, buffer: 2 } };
    db.data.qcOrders = [mkOrder('getir', 2, 'yeni'), mkOrder('ys', 6, 'toplaniyor'), mkOrder('getir', 14, 'hazir')];
    db.save();
  }
  const total = (o) => r2(sum(o.items.filter((i) => !i.removed), (i) => i.qty * i.price));

  // Sipariş tamamlanınca: satış kaydı (kanal ödemeli), stok düşümü, hareket
  function complete(o) {
    const lines = o.items.filter((i) => !i.removed);
    const t = total(o);
    const sale = db.insert('sales', { no: db.nextNo('sales', 'F'), at: new Date().toISOString(), type: 'sale', items: lines.map((l) => { const p = P(l.pid); return { pid: l.pid, name: l.name, qty: l.qty, price: l.price, disc: 0, vat: p.vat, buy: p.buy, unit: p.unit }; }), subtotal: t, discount: 0, total: t, vat: r2(sum(lines, (l) => (l.qty * l.price * (P(l.pid).vat || 0)) / (100 + (P(l.pid).vat || 0)))), campDiscs: [], payments: [{ type: 'online', amount: t, channel: QC[o.ch].name }], channel: o.ch, channelNo: o.no, user: NS.currentUser && NS.currentUser.id }, true);
    lines.filter((l) => l.pid).forEach((l) => { const p = P(l.pid); p.stock = r2(p.stock - l.qty); db.insert('moves', { at: sale.at, pid: p.id, qty: -l.qty, type: 'Satış (' + QC[o.ch].name + ')', ref: sale.no }, true); });
    o.saleNo = sale.no; o.doneAt = sale.at;
    sendI(o.ch, 'stok-guncelle', { items: lines.map((l) => ({ barcode: P(l.pid).barcode, stock: avail(P(l.pid), o.ch) })) });
  }

  function page(el, p, app) {
    let tab = 'pano';
    const draw = () => {
      if (!db.cloud) db.load(); // bulutta load sunucudan okur, henüz gönderilmemiş kaydı siler
      const os =db.all('qcOrders').sort((a, b) => b.at.localeCompare(a.at));
      const td = os.filter((o) => o.at.slice(0, 10) === today() && o.status !== 'iptal');
      const lanes = ['yeni', 'toplaniyor', 'hazir'];
      const age = (o) => Math.floor((Date.now() - new Date(o.at)) / 60000);
      const card = (o) => { const late = o.status === 'yeni' && age(o) >= 3; return `<div class="card pad mb" style="${late ? 'border-color:var(--err)' : ''}"><div class="row between">${tag(o.ch)}<span class="small ${late ? '' : 'muted'}" style="${late ? 'color:var(--err);font-weight:700' : ''}">${age(o)} dk</span></div><div class="mt"><b class="mono">${esc(o.no)}</b> · ${esc(o.customer)}</div><div class="small muted">${esc(o.address)}${o.note ? ` · <b>${esc(o.note)}</b>` : ''}</div>
        <div class="small mt">${o.items.map((i) => `<div class="row nw" style="gap:6px;${i.removed ? 'text-decoration:line-through;color:var(--text-3)' : ''}">${o.status === 'toplaniyor' ? `<input type="checkbox" data-pk="${o.id}|${i.pid}" ${i.picked ? 'checked' : ''} ${i.removed ? 'disabled' : ''} aria-label="Toplandı">` : ''}<span class="grow">${i.qty} × ${esc(i.name)}</span><span>${money(i.qty * i.price)}</span>${o.status === 'toplaniyor' && !i.picked && !i.removed ? `<button class="btn sm ghost" data-rm="${o.id}|${i.pid}" title="Stokta yok — çıkar">${icon('x')}</button>` : ''}</div>`).join('')}</div>
        <div class="row between mt"><b>${money(total(o))}</b>${o.status === 'yeni' ? `<span class="row nw" style="gap:6px"><button class="btn sm" data-rej="${o.id}">Reddet</button><button class="btn sm primary" data-acc="${o.id}">Kabul et</button></span>` : o.status === 'toplaniyor' ? `<span class="row nw" style="gap:6px"><button class="btn sm" data-scan="${o.id}">${icon('barcode')} Okut</button><button class="btn sm primary" data-ready="${o.id}">Hazır</button></span>` : `<button class="btn sm ok" data-done="${o.id}">${icon('check')} Kuryeye teslim</button>`}</div></div>`; };
      const ks = Object.keys(QC).filter((k) => !QC[k].own);
      el.innerHTML = pageHead('Hızlı Ticaret Kanalları', 'Getir Çarşı, Yemeksepeti Market ve Trendyol Go siparişleri — kabul, toplama, kuryeye teslim', `<div class="seg"><button data-tab="pano" class="${tab === 'pano' ? 'active' : ''}">Sipariş panosu</button><button data-tab="kanal" class="${tab === 'kanal' ? 'active' : ''}">Kanallar</button><button data-tab="gecmis" class="${tab === 'gecmis' ? 'active' : ''}">Geçmiş</button></div><button class="btn" id="pull">${icon('download')} Sipariş çek</button>`) + `
        ${!ks.some((k) => cfg(k).connected) ? `<div class="card pad mb row">${icon('info')}<span class="grow small"><b>Bağlı kanal yok.</b> Kanallar sekmesinde kanalın ayar düğmesinden mağaza numaranızı girerek bağlayın.</span></div>` : NS.integ && NS.integ.isOn('pazaryeri') ? '' : `<div class="card pad mb row" style="border-color:var(--warn)">${icon('info')}<span class="grow small">Demo / simülasyon modu. Canlı için <a href="#/entegrasyonlar">Entegrasyonlar &gt; Pazaryerleri</a> bağlantısını açın.</span></div>`}
        <div class="grid g4 mb">${kpi('Bugün sipariş', td.length, 'bag', 'info')}${kpi('Bugün ciro', money(sum(td, total)), 'wallet', 'ok')}${kpi('Bekleyen', os.filter((o) => lanes.includes(o.status)).length, 'clock', 'warn')}${kpi('Ort. hazırlık', (() => { const d = os.filter((o) => o.doneAt); return d.length ? Math.round(sum(d, (o) => (new Date(o.doneAt) - new Date(o.at)) / 60000) / d.length) + ' dk' : '—'; })(), 'gauge')}</div>
        ${tab === 'pano' ? `<div class="grid g3">${lanes.map((l) => `<div><h3 class="mb">${ST[l][0]} <span class="small muted">${os.filter((o) => o.status === l).length}</span></h3>${os.filter((o) => o.status === l).map(card).join('') || '<div class="card pad small faint">Sipariş yok</div>'}</div>`).join('')}</div>`
        : tab === 'kanal' ? `<div class="card">${table({ rows: ks.map((k) => ({ id: k, k, c: cfg(k) })), columns: [{ label: 'Kanal', render: (r) => `${tag(r.k)}<div class="small faint mt">${r.c.connected ? 'Mağaza no ' + esc(r.c.storeId || '-') : 'Bağlı değil'}</div>` }, { label: 'Durum', render: (r) => (r.c.connected ? `<button class="btn sm ${r.c.open ? 'ok' : 'danger'}" data-tg="${r.k}">${r.c.open ? 'Açık' : 'Kapalı'}</button>` : badge('Pasif')) }, { label: 'Min. sepet', render: (r) => (r.c.connected ? money(r.c.minBasket) : '-') }, { label: 'Yarıçap', render: (r) => (r.c.connected ? r.c.radius + ' km' : '-') }, { label: 'Hazırlık', render: (r) => (r.c.connected ? r.c.prep + ' dk' : '-') }, { label: 'Fiyat farkı / tampon', render: (r) => (r.c.connected ? `+%${r.c.markup} · ${r.c.buffer} adet` : '-') }, { label: 'Yayında ürün', cls: 'right', render: (r) => (r.c.connected ? db.all('products', (p) => p.barcode && avail(p, r.k) > 0).length : '-') }], actions: [{ icon: 'settings', act: 'qcfg', title: 'Ayarlar' }] })}</div>`
        : `<div class="card">${table({ rows: os.filter((o) => ['teslim', 'iptal'].includes(o.status)), empty: 'Geçmiş sipariş yok', columns: [{ label: 'Sipariş', render: (o) => `<b class="mono">${esc(o.no)}</b> ${tag(o.ch)}` }, { label: 'Tarih', render: (o) => NS.dt(o.at) }, { label: 'Ürün', cls: 'right', render: (o) => o.items.filter((i) => !i.removed).length }, { label: 'Tutar', cls: 'right', render: (o) => money(total(o)) }, { label: 'Komisyon', cls: 'right', render: (o) => (o.status === 'teslim' ? money(r2(total(o) * cfg(o.ch).commission / 100)) : '-') }, { label: 'Fiş', render: (o) => esc(o.saleNo || '-') }, { label: 'Durum', render: (o) => badge(ST[o.status][0], ST[o.status][1]) }] })}</div>`}`;
    };
    const get = (id) => db.get('qcOrders', id);
    const save = () => { db.save(); draw(); };
    on(el, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; draw(); });
    on(el, 'click', '#pull', async () => {
      if (!db.cloud) db.load();
      // Canlı: webhook gelen kutusu (server.js /api/webhook/getircarsi, ysmarket, trendyolgo)
      const canli = !!(NS.inbox && (await NS.inbox.online()));
      if (canli) {
        const KEYS = { getir: 'getircarsi', ys: 'ysmarket', tygo: 'trendyolgo', web: 'websitesi' }; let n = 0;
        for (const [k, hook] of Object.entries(KEYS)) {
          const got = (await NS.inbox.drain(hook)) || [];
          got.forEach((x) => { if (db.find('qcOrders', (o) => o.no === x.orderNo)) return; const items = x.items.map((it) => { const p = db.find('products', (q) => q.barcode && q.barcode === it.code) || db.find('products', (q) => q.name.toLocaleLowerCase('tr') === it.name.toLocaleLowerCase('tr')); return { pid: p ? p.id : '', name: p ? p.name : it.name || it.code, qty: it.qty, price: it.price || (p ? chPrice(p, k) : 0), picked: false, removed: false }; }); db.col('qcOrders').push({ id: NS.uid(), no: x.orderNo, ch: k, at: x.receivedAt || new Date().toISOString(), status: 'yeni', items, customer: x.customer.name, address: x.customer.address, note: x.note }); n++; });
        }
        if (n) { NS.beep(1200, 200); toast(`${n} yeni sipariş alındı`, 'ok'); return save(); }
      }
      const open = Object.keys(QC).filter((k) => !QC[k].own && cfg(k).connected && cfg(k).open); if (!open.length) return toast('Açık kanal yok', 'err');
      // Bulutta simülasyon siparişi yazılmaz: kayıt kalsa teslimde gerçek satış ve stok düşümü oluşurdu
      if (db.cloud) return toast(canli ? 'Yeni sipariş yok' : 'TEST: kanal bağlantısı simülasyonda, sipariş alınmadı', canli ? '' : 'warn');
      const o = mkOrder(NS.pick(open), 0, 'yeni'); db.data.qcOrders.push(o); NS.beep(1200, 200); toast(`${QC[o.ch].name}: yeni sipariş ${o.no} (simülasyon)`, 'ok'); save();
    });
    on(el, 'click', '[data-acc]', (e, b) => { const o = get(b.dataset.acc); o.status = 'toplaniyor'; o.acceptedAt = new Date().toISOString(); sendI(o.ch, 'siparis-kabul', { orderNo: o.no }); save(); });
    on(el, 'click', '[data-rej]', async (e, b) => { const o = get(b.dataset.rej); const r = await NS.prompt('Red nedeni', 'Ürün stokta yok', { title: 'Siparişi reddet' }); if (r === null) return; o.status = 'iptal'; o.reason = r; sendI(o.ch, 'siparis-red', { orderNo: o.no, reason: r }); save(); });
    on(el, 'change', '[data-pk]', (e, c) => { const [id, pid] = c.dataset.pk.split('|'); const i = get(id).items.find((x) => x.pid === pid); i.picked = c.checked; db.save(); });
    on(el, 'click', '[data-rm]', async (e, b) => { const [id, pid] = b.dataset.rm.split('|'); const o = get(id); const i = o.items.find((x) => x.pid === pid); if (!(await confirm(`${i.name} stokta yok olarak çıkarılsın mı? Müşteriye ${money(i.qty * i.price)} iade edilir.`, { ok: 'Çıkar' }))) return; i.removed = true; sendI(o.ch, 'urun-cikar', { orderNo: o.no, barcode: P(pid).barcode }); save(); });
    on(el, 'click', '[data-scan]', async (e, b) => {
      const o = get(b.dataset.scan); const code = await NS.prompt('Ürün barkodunu okutun', '', { title: `Toplama kontrolü · ${o.no}` }); if (!code) return;
      const p = db.find('products', (x) => x.barcode === code.trim()); const it = p && o.items.find((x) => x.pid === p.id && !x.removed);
      if (!it) { NS.beep(300, 300); return toast('Bu ürün siparişte yok!', 'err'); }
      it.picked = true; NS.beep(1500, 80); toast(`${it.name} doğrulandı`, 'ok'); save();
    });
    on(el, 'click', '[data-ready]', (e, b) => { const o = get(b.dataset.ready); const left = o.items.filter((i) => !i.removed && !i.picked); if (left.length) return toast(`${left.length} ürün henüz toplanmadı`, 'err'); o.status = 'hazir'; o.readyAt = new Date().toISOString(); sendI(o.ch, 'siparis-hazir', { orderNo: o.no }); save(); });
    on(el, 'click', '[data-done]', (e, b) => { const o = get(b.dataset.done); o.status = 'teslim'; complete(o); toast(`Teslim edildi · satış ${o.saleNo}`, 'ok'); save(); });
    on(el, 'click', '[data-tg]', (e, b) => { const c = db.data.qcChannels[b.dataset.tg]; c.open = !c.open; sendI(b.dataset.tg, 'magaza-durum', { open: c.open }); save(); });
    on(el, 'click', '[data-act="qcfg"]', (e, b) => {
      const k = b.dataset.id; const c = cfg(k);
      modal({ title: `${QC[k].name} ayarları`, body: `<div class="form-grid">${NS.fieldsHtml([{ name: 'storeId', label: 'Mağaza no', value: c.storeId || '' }, { name: 'apiKey', label: 'API anahtarı', value: c.apiKey || '' }, { name: 'minBasket', label: 'Minimum sepet (₺)', type: 'number', value: c.minBasket ?? 150 }, { name: 'radius', label: 'Teslimat yarıçapı (km)', type: 'number', step: '0.5', value: c.radius ?? 2 }, { name: 'prep', label: 'Hazırlık süresi (dk)', type: 'number', value: c.prep ?? 10 }, { name: 'markup', label: 'Fiyat farkı %', type: 'number', value: c.markup ?? 0 }, { name: 'buffer', label: 'Stok tamponu (adet)', type: 'number', value: c.buffer ?? 2 }, { name: 'commission', label: 'Komisyon %', type: 'number', step: '0.01', value: c.commission }])}</div>`,
        actions: [{ label: 'Vazgeç' }, { label: c.connected ? 'Kaydet' : 'Bağlan', cls: 'primary', onClick: (close, bd) => { const v = NS.readForm(bd); if (!c.connected && !v.storeId) return toast('Mağaza no gerekli', 'err'); setCh(k, { ...((db.data.qcChannels || {})[k] || {}), ...v, connected: true, open: c.connected ? c.open : true }); sendI(k, 'ayar', v); close(); save(); } }] });
    });
    draw();
  }
  return { QC, ensure, nav: { id: 'hizli', label: 'Online Siparişler', icon: 'bag', roles: ['admin', 'kasiyer'] }, routes: { hizli: page } };
})();
