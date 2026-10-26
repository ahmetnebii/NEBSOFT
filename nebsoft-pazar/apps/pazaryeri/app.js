/* NEBSOFT Pazaryeri Satıcı Paneli — tüm pazaryeri siparişleri tek listede, toplama listesi, barkodlu paketleme,
   toplu etiket ve fatura, tek stoktan tüm kanallara senkron, iade kabul, müşteri soruları ve hakediş/kâr takibi */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const Z = window.PZR;
  const db = new NS.DB('pazaryeri', Z.seed);
  const S = () => db.settings({});
  const CH = Z.CH;
  const chCfg = (k) => ({ ...CH[k], ...((db.data.channels || {})[k] || {}) });
  const connected = () => Object.keys(CH).filter((k) => chCfg(k).connected);
  const prod = (id) => db.get('products', id);
  const byCode = (code) => { const c = String(code || '').trim(); return db.find('products', (p) => p.barcode === c || p.sku === c); };
  const costOf = (i) => (prod(i.pid) || {}).cost || 0;
  const profit = (o) => Z.profit(o, chCfg(o.ch), costOf);
  const chB = (k) => `<span class="badge" style="background:${CH[k].color};color:#fff;border:0">${esc(CH[k].name)}</span>`;
  const stB = (s) => badge(Z.ST[s][0], Z.ST[s][1]);
  const OPEN = ['yeni', 'toplaniyor', 'paketlendi'];
  const me = () => (NS.currentUser || {}).name || '';
  const log = (k, action, detail, ok = true) => { db.data.synclog = db.data.synclog || []; db.data.synclog.unshift({ id: NS.uid(), at: new Date().toISOString(), ch: k, action, detail, ok }); db.data.synclog.length = Math.min(db.data.synclog.length, 400); };
  const setSt = (o, st, note) => { o.status = st; o.history.push({ at: new Date().toISOString(), st, note: note || Z.ST[st][0], user: me() }); };
  // Kargoya kalan süre: geçtiyse kırmızı, 6 saatten azsa turuncu
  function sla(o) {
    if (!OPEN.includes(o.status)) return '';
    const h = (new Date(o.shipBy) - Date.now()) / 3600e3;
    if (h < 0) return badge('Gecikti', 'err');
    if (h < 6) return badge(`${Math.max(1, Math.round(h))} sa kaldı`, 'warn');
    return `<span class="small faint">${h < 24 ? 'Bugün' : NS.date(o.shipBy)}</span>`;
  }

  // ---- Canlı bağlantı: server.js köprüsündeki adaptörler (server/connectors) ----
  const isLive = (k) => Z.LIVE.includes(k) && chCfg(k).connected && chCfg(k).mode === 'live';
  async function live(k, action, payload = {}, override) {
    const c = { ...chCfg(k), ...(override || {}) };
    try {
      const r = await fetch('/api/kanal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: k, action, creds: { sellerId: c.sellerId, apiKey: c.apiKey, apiSecret: c.apiSecret, stage: !!c.stage }, payload }) });
      const j = await r.json(); log(k, action + ' (canlı)', j.ok ? 'başarılı' : j.error || 'hata', !!j.ok); return j;
    } catch (e) { const j = { ok: false, error: 'Sunucu köprüsüne ulaşılamadı — uygulamayı "node server.js" ile açın' }; log(k, action + ' (canlı)', j.error, false); return j; }
  }
  // Kanal siparişini panele ekler; aynı paket ikinci kez gelmez
  function addOrder(k, x) {
    const no = String(x.orderNo || x.chNo);
    if (db.find('orders', (o) => o.ch === k && (o.chNo === no || (x.packageId && o.pkgNo === String(x.packageId))))) return null;
    const items = (x.items || []).map((i) => { const p = byCode(i.barcode) || byCode(i.sku); return { pid: p ? p.id : null, sku: p ? p.sku : i.sku, barcode: i.barcode || (p && p.barcode), name: i.name || (p && p.name) || i.sku, qty: i.qty || 1, price: i.price || 0, lineId: i.lineId }; });
    const at = new Date(x.at || Date.now()); const shipBy = addDays(at, chCfg(k).shipDays || 1); shipBy.setHours(23, 59, 0, 0);
    const o = db.insert('orders', { ch: k, chNo: no, pkgNo: String(x.packageId || ''), at: at.toISOString(), shipBy: shipBy.toISOString(), customer: x.customer || {}, items, total: x.total || sum(items, (i) => i.qty * i.price), shipCost: 0, carrier: x.cargo || S().carrier, tracking: x.tracking || '', status: 'yeni', history: [{ at: new Date().toISOString(), st: 'yeni', note: `${CH[k].name} siparişi alındı` }] });
    items.forEach((i) => { const p = i.pid && prod(i.pid); if (p) p.stock = Math.max(0, p.stock - i.qty); });
    return o;
  }
  // Demo modda kanal başına birkaç örnek sipariş üretir; canlı kanallarda API'den çeker
  async function pullOrders() {
    let count = 0; const errs = []; const touched = new Set();
    for (const k of connected()) {
      if (isLive(k)) {
        const r = await live(k, 'siparis-cek', { since: addDays(new Date(), -3).toISOString() });
        if (!r.ok) { errs.push(`${CH[k].name}: ${r.error}`); continue; }
        ((r.data && r.data.orders) || []).forEach((x) => { const o = addOrder(k, x); if (o) { count++; o.items.forEach((i) => i.pid && touched.add(i.pid)); } });
      } else {
        const n = NS.rand(0, k === 'trendyol' ? 3 : 1);
        for (let i = 0; i < n; i++) {
          const p = NS.pick(db.all('products', (y) => y.stock > 0)); if (!p) break;
          const o = addOrder(k, { orderNo: (CH[k].short === 'TY' ? '10' : CH[k].short) + NS.rand(10000000, 99999999), at: new Date().toISOString(), customer: { name: NS.pick(NS.NAMES), phone: NS.phone(), city: NS.pick(['İstanbul', 'Ankara', 'İzmir', 'Bursa']), district: 'Merkez', address: `Atatürk Cad. No:${NS.rand(1, 90)}` }, items: [{ barcode: p.barcode, name: p.name, qty: 1, price: Math.ceil(p.price * 1.08) - 0.1 }] });
          if (o) { o.shipCost = NS.rand(42, 70); count++; touched.add(p.id); }
        }
        log(k, 'Sipariş çekme', `${n} yeni sipariş`);
      }
    }
    db.save();
    if (touched.size && S().autoStock !== false) await pushStock([...touched], true);
    return { count, err: errs.join(' · ') };
  }
  // Tek stoktan tüm kanallara: tampon düşülerek gönderilir
  async function pushStock(pids, silent) {
    const list = (pids ? pids.map(prod).filter(Boolean) : db.all('products'));
    let ok = 0; const errs = [];
    for (const k of connected()) {
      const items = list.filter((p) => p.listings && p.listings[k]).map((p) => ({ barcode: p.barcode, sku: p.sku, stock: Math.max(0, p.stock - (Number(chCfg(k).buffer) || 0)), price: p.chPrice && p.chPrice[k] }));
      if (!items.length) continue;
      if (isLive(k)) { const r = await live(k, 'stok-fiyat', { items }); if (!r.ok) { errs.push(`${CH[k].name}: ${r.error}`); continue; } }
      else log(k, 'Stok senkronu', `${items.length} ürün güncellendi`);
      list.forEach((p) => { if (p.listings && p.listings[k] && p.listings[k] !== 'hata') p.listings[k] = p.stock - (Number(chCfg(k).buffer) || 0) > 0 ? 'yayinda' : 'stoksuz'; });
      ok++;
    }
    db.save();
    if (!silent) toast(errs.length ? errs.join(' · ') : `${list.length} ürünün stoğu ${ok} kanala gönderildi`, errs.length ? 'err' : 'ok');
  }

  // ---------- Belgeler: kargo etiketi, fatura, toplama listesi ----------
  const labelHtml = (o) => `<div style="border:2px solid #000;width:380px;font-family:Arial;padding:10px;page-break-after:always;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(o.carrier)}</b><span style="background:${CH[o.ch].color};color:#fff;padding:2px 8px;font-weight:700">${esc(CH[o.ch].name)}</span></div>
    <div style="margin:8px 0">${NS.barcodeSvg(o.tracking || o.pkgNo || o.chNo, { height: 60 })}</div><div style="font-size:11px">GÖNDERİCİ: ${esc(S().bizName)} · ${esc(S().bizAddress || '')}</div><hr>
    <div style="font-size:18px"><b>${esc(o.customer.name)}</b></div><div>${esc(o.customer.address || '')}</div><div style="font-size:16px"><b>${esc(o.customer.district || '')} / ${esc(o.customer.city || '')}</b></div><div>${esc(o.customer.phone || '')}</div><hr>
    <div style="font-size:11px">Sipariş: ${esc(o.chNo)} · ${o.items.map((i) => `${i.qty}× ${esc(i.sku)}`).join(', ')}</div></div>`;
  const printLabels = (list) => NS.printHtml(list.map(labelHtml).join(''), { title: 'Kargo etiketleri' });
  function ensureTracking(o) { if (!o.tracking) o.tracking = String(NS.rand(700000000000, 799999999999)); }
  async function invoice(o) {
    if (o.invoice) return true;
    const lines = o.items.map((i) => ({ name: i.name, code: i.barcode, qty: i.qty, total: i.qty * i.price, vat: (prod(i.pid) || {}).vat ?? 20 }));
    if (NS.ebelge) { const r = await NS.ebelge.create({ docType: 'e-Arşiv', buyer: o.customer.name, address: [o.customer.address, o.customer.district, o.customer.city].filter(Boolean).join(' '), no: o.chNo, lines, note: `${CH[o.ch].name} sipariş ${o.chNo}` }); if (r && r.no) { o.invoice = r.no; o.invoiceId = r.id; return true; } }
    o.invoice = 'EAR' + Date.now().toString().slice(-9); return true;
  }
  function printPick(pl) {
    const orders = pl.orders.map((id) => db.get('orders', id)).filter(Boolean);
    const lines = Object.values(orders.flatMap((o) => o.items).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { ...i, qty: 0, loc: (prod(i.pid) || {}).loc || '-' }; m[k].qty += i.qty; return m; }, {})).sort((a, b) => a.loc.localeCompare(b.loc));
    NS.printHtml(`<div class="doc"><h2>TOPLAMA LİSTESİ ${esc(pl.no)}</h2><div>${NS.dt(pl.at)} · ${orders.length} sipariş · ${sum(lines, (l) => l.qty)} ürün · ${esc(pl.user || '')}</div>
      <table><tr><th>Raf</th><th>Barkod</th><th>Ürün</th><th style="text-align:right">Adet</th><th>✓</th></tr>${lines.map((l) => `<tr><td><b>${esc(l.loc)}</b></td><td>${esc(l.barcode || l.sku)}</td><td>${esc(l.name)}</td><td style="text-align:right;font-size:16px"><b>${l.qty}</b></td><td>☐</td></tr>`).join('')}</table>
      <p style="margin-top:14px">Siparişler: ${orders.map((o) => `${CH[o.ch].short} ${esc(o.chNo)}`).join(' · ')}</p></div>`, { title: pl.no });
  }

  // ---------- Sipariş detay ----------
  function orderModal(app, o) {
    const pr = profit(o);
    modal({
      title: `${CH[o.ch].name} · ${o.chNo}`, size: 'wide',
      body: `<div class="grid g2"><div class="col">
          <div class="row">${chB(o.ch)} ${stB(o.status)} ${sla(o)} ${o.invoice ? badge('Fatura ' + o.invoice, 'ok') : ''}</div>
          <div class="card pad"><div class="small muted">Alıcı</div><b>${esc(o.customer.name)}</b><div class="small">${esc(o.customer.phone || '')}</div><div class="small muted">${esc(o.customer.address || '')} ${esc(o.customer.district || '')} / ${esc(o.customer.city || '')}</div></div>
          <div class="card">${table({ rows: o.items.map((i, n) => ({ ...i, id: n })), columns: [{ label: 'Ürün', render: (i) => `<b>${esc(i.name)}</b><div class="small faint mono">${esc(i.barcode || i.sku)} · raf ${esc((prod(i.pid) || {}).loc || '-')}</div>` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Tutar', cls: 'right', render: (i) => money(i.qty * i.price) }] })}</div>
          <div class="list-item small"><span class="grow muted">Kargo</span>${esc(o.carrier || '-')} ${o.tracking ? `<span class="mono">${esc(o.tracking)}</span>` : ''}</div>
          <div class="list-item small"><span class="grow muted">Paket no</span><span class="mono">${esc(o.pkgNo || '-')}</span></div></div>
        <div class="col"><div class="card pad"><h3 class="mb">Kâr hesabı</h3>
          ${[['Satış tutarı', pr.gross], [`Komisyon (%${chCfg(o.ch).commission})`, -pr.com], ['Hizmet bedeli', -pr.fee], ['Kargo', -pr.ship], ['Ürün maliyeti', -pr.cost]].map(([l, v]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(v)}</div>`).join('')}
          <div class="list-item"><b class="grow">Net kâr</b><b style="color:var(--${pr.kar >= 0 ? 'ok' : 'err'})">${money(pr.kar)} · %${pr.marj}</b></div></div>
          <h3 class="mb mt">Hareketler</h3><div class="col" style="gap:6px">${o.history.slice().reverse().map((h) => `<div class="small"><b>${esc((Z.ST[h.st] || [h.st])[0])}</b> — ${esc(h.note || '')}<div class="faint">${NS.dt(h.at)}${h.user ? ' · ' + esc(h.user) : ''}</div></div>`).join('')}</div></div></div>`,
      actions: [
        { label: 'Etiket', icon: 'print', onClick: () => { ensureTracking(o); db.save(); printLabels([o]); } },
        ...(!o.invoice && o.status !== 'iptal' ? [{ label: 'Fatura kes', icon: 'file', onClick: async (c) => { await invoice(o); db.save(); c(); app.refresh(); toast('Fatura kesildi', 'ok'); } }] : []),
        ...(o.status === 'yeni' ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { if (!(await confirm('Sipariş iptal edilsin ve stok geri alınsın mı?'))) return; setSt(o, 'iptal', 'Satıcı iptal etti (stok yok / tedarik sorunu)'); o.items.forEach((i) => { const p = prod(i.pid); if (p) p.stock += i.qty; }); db.save(); c(); app.refresh(); } }] : []),
        ...(['yeni', 'toplaniyor'].includes(o.status) ? [{ label: 'Paketlemeye git', cls: 'primary', icon: 'barcode', onClick: (c) => { c(); app.go('paketleme', o.chNo); } }] : []),
        ...(o.status === 'paketlendi' ? [{ label: 'Kargoya verildi', cls: 'primary', icon: 'truck', onClick: async (c) => { await ship([o]); c(); app.refresh(); } }] : []),
      ],
    });
  }
  // Kargoya teslim: canlı kanallara kargo bildirimi gider
  async function ship(list) {
    for (const o of list) {
      ensureTracking(o);
      if (isLive(o.ch) && o.ch === 'trendyol' && o.pkgNo) { const r = await live(o.ch, 'kargo-bildir', { packageId: o.pkgNo, status: 'Invoiced', invoiceNo: o.invoice, lines: o.items.map((i) => ({ lineId: i.lineId, qty: i.qty })) }); if (!r.ok) { toast(`${o.chNo}: ${r.error}`, 'err'); continue; } }
      setSt(o, 'kargoda', `${o.carrier} · ${o.tracking}`);
    }
    db.save(); toast(`${list.length} sipariş kargoya verildi olarak işaretlendi`, 'ok');
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const all = db.all('orders'); const t = today();
    const tod = all.filter((o) => iso(o.at) === t && o.status !== 'iptal');
    const open = all.filter((o) => OPEN.includes(o.status));
    const late = open.filter((o) => new Date(o.shipBy) < new Date(Date.now() + 6 * 3600e3));
    const qs = db.all('questions', (q) => !q.answer); const rets = db.all('returns', (r) => ['talep', 'yolda', 'geldi'].includes(r.status));
    const low = db.all('products', (x) => x.stock <= (Number(S().lowStock) || 5));
    const m30 = all.filter((o) => o.at > addDays(new Date(), -30).toISOString() && !['iptal'].includes(o.status));
    const ser = NS.dailySeries(all.filter((o) => o.status !== 'iptal'), 14, 'at', (o) => o.total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()) + ` · ${connected().length} pazaryeri bağlı`, `<button class="btn" id="pull">${icon('refresh')} Siparişleri çek</button><a class="btn primary" href="#/paketleme">${icon('barcode')} Paketleme</a>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü sipariş', tod.length, 'cart', '', `<div class="small faint">${money(sum(tod, (o) => o.total))}</div>`)}${kpi('Kargoya verilecek', open.length, 'box', 'info', `<div class="small faint">${open.filter((o) => o.status === 'paketlendi').length} paket hazır</div>`)}${kpi('Gecikme riski', late.length, 'alert', late.length ? 'err' : 'ok', '<div class="small faint">6 saatten az kalan</div>')}${kpi('30 gün net kâr', money(sum(m30, (o) => profit(o).kar)), 'trend', 'ok', `<div class="small faint">${money(sum(m30, (o) => o.total))} ciro</div>`)}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün ciro</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: (v) => NS.compact(v) })}</div></div>
      <div class="card"><div class="card-h"><h3>Pazaryeri payı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => o.ch)).map(([k, v]) => ({ label: CH[k].name, value: sum(v, (o) => o.total), color: CH[k].color })), { size: 140, format: (v) => NS.compact(v) })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('clock')} Önce bunları kargolayın</h3><a class="btn sm" href="#/siparisler">Tümü</a></div>${table({ rows: open.slice().sort((a, b) => a.shipBy.localeCompare(b.shipBy)).slice(0, 8), empty: 'Bekleyen sipariş yok', columns: [{ label: 'Sipariş', render: (o) => `${chB(o.ch)} <span class="mono small">${esc(o.chNo)}</span>` }, { label: 'Ürün', render: (o) => `<span class="small">${esc(o.items[0].name.slice(0, 34))}${o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span>` }, { label: 'Durum', render: (o) => stB(o.status) }, { label: 'Süre', render: sla }], actions: [{ icon: 'eye', act: 'v' }] })}</div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Yapılacaklar</h3></div><div class="card-b col" style="gap:8px">
        <a class="list-item" href="#/sorular">${icon('message')}<span class="grow">Cevap bekleyen müşteri sorusu</span>${badge(qs.length, qs.length ? 'warn' : 'ok')}</a>
        <a class="list-item" href="#/iadeler">${icon('refresh')}<span class="grow">İşlem bekleyen iade</span>${badge(rets.length, rets.length ? 'warn' : 'ok')}</a>
        <a class="list-item" href="#/urunler/kritik">${icon('box')}<span class="grow">Kritik stoktaki ürün</span>${badge(low.length, low.length ? 'err' : 'ok')}</a>
        <a class="list-item" href="#/urunler/hata">${icon('alert')}<span class="grow">Hatalı listeleme</span>${badge(db.all('products', (x) => Object.values(x.listings || {}).includes('hata')).length, 'err')}</a></div></div>
      <div class="card"><div class="card-h"><h3>Son senkron</h3><a class="btn sm" href="#/kanallar">Kanallar</a></div><div class="card-b col" style="gap:6px">${(db.data.synclog || []).slice(0, 5).map((l) => `<div class="small row">${chB(l.ch)}<span class="grow">${esc(l.action)} — ${esc(l.detail)}</span><span class="faint">${NS.ago ? NS.ago(l.at) : NS.dt(l.at)}</span></div>`).join('')}</div></div></div></div>`;
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    $('#pull', el).onclick = async (e) => { e.target.disabled = true; const r = await pullOrders(); toast(r.err || `${r.count} yeni sipariş alındı`, r.err ? 'err' : 'ok'); app.refresh(); };
  }

  // ---------- Siparişler ----------
  function ordersPage(el, p, app) {
    let f = p || 'acik', chf = '', q = ''; const sel = new Set();
    const F = [['acik', 'Kargolanacak'], ['yeni', 'Yeni'], ['toplaniyor', 'Toplanıyor'], ['paketlendi', 'Paketlendi'], ['kargoda', 'Kargoda'], ['teslim', 'Teslim'], ['iade', 'İade'], ['iptal', 'İptal'], ['all', 'Tümü']];
    el.innerHTML = pageHead('Siparişler', 'Tüm pazaryerlerinin siparişleri tek listede', `<button class="btn" id="pull">${icon('refresh')} Siparişleri çek</button><button class="btn" id="ex">${icon('download')}</button>`) + `
      <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Sipariş no, alıcı, ürün, barkod...')}<div class="seg">${F.map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l} <span class="faint" data-n="${v}"></span></button>`).join('')}</div></div>
      <div class="card-h" style="gap:6px;flex-wrap:wrap"><label class="row small" style="gap:6px;margin-right:6px"><input type="checkbox" id="sa"> Tümünü seç</label><button class="btn sm ${!chf ? 'primary' : ''}" data-ch="">Tüm kanallar</button>${connected().map((k) => `<button class="btn sm" data-ch="${k}" style="${chf === k ? `background:${CH[k].color};color:#fff;border-color:${CH[k].color}` : ''}">${esc(CH[k].name)}</button>`).join('')}</div>
      <div class="card-h hide" id="bulk" style="background:var(--app-accent-soft)"><b id="bn"></b><span class="grow"></span><button class="btn sm" data-b="pick">${icon('list')} Toplama listesi</button><button class="btn sm" data-b="label">${icon('print')} Etiket</button><button class="btn sm" data-b="inv">${icon('file')} Fatura kes</button><button class="btn sm primary" data-b="ship">${icon('truck')} Kargoya verildi</button></div><div id="t"></div></div>`;
    const match = (o) => (f === 'all' || (f === 'acik' ? OPEN.includes(o.status) : o.status === f)) && (!chf || o.ch === chf) && NS.match(q, o.chNo, o.pkgNo, o.tracking, o.customer.name, ...o.items.map((i) => i.name + ' ' + i.barcode));
    const rows = () => db.all('orders', match).sort((a, b) => (f === 'acik' ? a.shipBy.localeCompare(b.shipBy) : b.at.localeCompare(a.at)));
    const draw = () => {
      const r = rows();
      F.forEach(([v]) => { const n = db.all('orders', (o) => (v === 'all' || (v === 'acik' ? OPEN.includes(o.status) : o.status === v)) && (!chf || o.ch === chf)).length; const s = $(`[data-n="${v}"]`, el); if (s) s.textContent = ['acik', 'yeni', 'toplaniyor', 'paketlendi'].includes(v) && n ? n : ''; });
      $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'cart', columns: [
        { label: '', render: (o) => `<input type="checkbox" data-sel="${o.id}" ${sel.has(o.id) ? 'checked' : ''} aria-label="Seç">` },
        { label: 'Sipariş', render: (o) => `${chB(o.ch)}<div class="mono small mt">${esc(o.chNo)}</div><div class="small faint">${NS.dt(o.at)}</div>` },
        { label: 'Alıcı', render: (o) => `${esc(o.customer.name)}<div class="small faint">${esc(o.customer.city || '')}</div>` },
        { label: 'Ürünler', render: (o) => o.items.map((i) => `<div class="small">${i.qty}× ${esc(i.name.slice(0, 40))}</div>`).join('') },
        { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b><div class="small" style="color:var(--${profit(o).kar >= 0 ? 'ok' : 'err'})">kâr ${money(profit(o).kar)}</div>` },
        { label: 'Durum', render: (o) => `${stB(o.status)}<div class="mt">${sla(o)}</div>` },
        { label: 'Fatura', render: (o) => (o.invoice ? badge('Kesildi', 'ok') : o.status === 'iptal' ? '' : badge('Yok', '')) },
      ], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} sipariş · ${money(sum(r, (o) => o.total))}` });
      if (!sel.size) $('#sa', el).checked = false;
      $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} sipariş seçildi`;
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; sel.clear(); $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-ch]', (e, b) => { chf = b.dataset.ch; sel.clear(); $$('[data-ch]', el).forEach((x) => { const k = x.dataset.ch; const a = k === chf; x.classList.toggle('primary', a && !k); x.style.cssText = a && k ? `background:${CH[k].color};color:#fff;border-color:${CH[k].color}` : ''; }); draw(); });
    on(el, 'change', '[data-sel]', (e, b) => { b.checked ? sel.add(b.dataset.sel) : sel.delete(b.dataset.sel); $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} sipariş seçildi`; });
    on(el, 'change', '#sa', (e, b) => { rows().slice(0, 300).forEach((o) => (b.checked ? sel.add(o.id) : sel.delete(o.id))); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    on(el, 'click', '[data-b]', async (e, b) => {
      const list = [...sel].map((id) => db.get('orders', id)).filter(Boolean); const a = b.dataset.b;
      if (a === 'pick') { const ok = list.filter((o) => ['yeni', 'toplaniyor'].includes(o.status)); if (!ok.length) return toast('Seçilenlerde toplanacak sipariş yok', 'err'); const pl = makePick(ok); printPick(pl); }
      if (a === 'label') { list.forEach(ensureTracking); db.save(); printLabels(list); }
      if (a === 'inv') { let n = 0; for (const o of list) if (!o.invoice && o.status !== 'iptal') { await invoice(o); n++; } db.save(); toast(`${n} fatura kesildi`, 'ok'); }
      if (a === 'ship') { const ok = list.filter((o) => o.status === 'paketlendi'); if (!ok.length) return toast('Yalnız paketlenmiş siparişler kargoya verilebilir', 'err'); await ship(ok); }
      sel.clear(); draw();
    });
    $('#pull', el).onclick = async () => { const r = await pullOrders(); toast(r.err || `${r.count} yeni sipariş alındı`, r.err ? 'err' : 'ok'); draw(); };
    $('#ex', el).onclick = () => NS.csv('siparisler', rows(), [{ label: 'Kanal', value: (o) => CH[o.ch].name }, { key: 'chNo', label: 'Sipariş no' }, { label: 'Tarih', value: (o) => NS.dt(o.at) }, { label: 'Alıcı', value: (o) => o.customer.name }, { label: 'Şehir', value: (o) => o.customer.city }, { label: 'Ürünler', value: (o) => o.items.map((i) => `${i.qty}x ${i.sku}`).join(' ') }, { key: 'total', label: 'Tutar' }, { label: 'Net kâr', value: (o) => profit(o).kar }, { label: 'Durum', value: (o) => Z.ST[o.status][0] }, { key: 'tracking', label: 'Kargo takip' }, { key: 'invoice', label: 'Fatura' }]);
    draw();
  }

  // ---------- Toplama listesi ----------
  function makePick(list) {
    const pl = db.insert('picklists', { no: 'TL' + String(db.all('picklists').length + 1001), at: new Date().toISOString(), orders: list.map((o) => o.id), user: me() });
    list.forEach((o) => { if (o.status === 'yeni') setSt(o, 'toplaniyor', `Toplama listesi ${pl.no}`); });
    db.save(); toast(`${pl.no}: ${list.length} sipariş toplama listesine alındı`, 'ok'); return pl;
  }
  function pickPage(el, p, app) {
    const waiting = db.all('orders', (o) => o.status === 'yeni').sort((a, b) => a.shipBy.localeCompare(b.shipBy));
    const lines = Object.values(waiting.flatMap((o) => o.items).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { id: k, ...i, qty: 0, n: 0, p: prod(i.pid) }; m[k].qty += i.qty; m[k].n++; return m; }, {})).sort((a, b) => ((a.p || {}).loc || '').localeCompare((b.p || {}).loc || ''));
    el.innerHTML = pageHead('Toplama Listesi', 'Bekleyen siparişlerin ürünleri raf sırasına göre — depoda tek turda toplayın', `<button class="btn primary" id="mk" ${waiting.length ? '' : 'disabled'}>${icon('print')} ${waiting.length} siparişten liste oluştur</button>`) + `
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Toplanacak ürünler</h3><span class="small muted">${sum(lines, (l) => l.qty)} adet · ${lines.length} çeşit</span></div>${table({ rows: lines, empty: 'Toplanacak sipariş yok', emptyIcon: 'check', columns: [{ label: 'Raf', render: (l) => `<b class="mono">${esc((l.p || {}).loc || '-')}</b>` }, { label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint mono">${esc(l.barcode || l.sku)}</div>` }, { label: 'Adet', cls: 'right', render: (l) => `<b style="font-size:18px">${l.qty}</b>` }, { label: 'Sipariş', cls: 'right', key: 'n' }, { label: 'Stok', cls: 'right', render: (l) => (l.p && l.p.stock < 0 ? badge('Eksik', 'err') : (l.p || {}).stock ?? '-') }] })}</div>
      <div class="card"><div class="card-h"><h3>Önceki listeler</h3></div>${table({ rows: db.all('picklists').slice().reverse().slice(0, 12), empty: 'Henüz liste yok', columns: [{ label: 'Liste', render: (l) => `<b>${esc(l.no)}</b><div class="small faint">${NS.dt(l.at)} · ${esc(l.user || '')}</div>` }, { label: 'Sipariş', cls: 'right', render: (l) => l.orders.length }, { label: 'Kalan', cls: 'right', render: (l) => { const n = l.orders.filter((id) => ['yeni', 'toplaniyor'].includes((db.get('orders', id) || {}).status)).length; return n ? badge(n, 'warn') : badge('Bitti', 'ok'); } }], actions: [{ icon: 'print', act: 'pr' }] })}</div></div>`;
    on(el, 'click', '[data-act=pr]', (e, b) => printPick(db.get('picklists', b.dataset.id)));
    $('#mk', el).onclick = () => { const pl = makePick(waiting); printPick(pl); app.refresh(); };
  }

  // ---------- Paketleme istasyonu (barkodla doğrulama) ----------
  function packPage(el, p, app) {
    let cur = null; let cnt = {};
    el.innerHTML = pageHead('Paketleme', 'Sipariş/paket numarasını veya ürün barkodunu okutun; ürünler doğrulanınca etiket ve fatura otomatik çıkar') + `
      <div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><label class="small muted" for="scan">Barkod okutun</label><input class="input" id="scan" autocomplete="off" placeholder="Sipariş no, paket no veya ürün barkodu" style="height:56px;font-size:20px;margin-top:6px"></div><div id="box"></div></div>
      <div class="col" style="gap:16px"><div class="card pad" id="stat"></div><div class="card"><div class="card-h"><h3>Son paketlenenler</h3></div><div id="last"></div></div></div></div>`;
    const inp = $('#scan', el);
    const need = () => cur.items.reduce((m, i) => { const k = i.barcode || i.sku; m[k] = (m[k] || 0) + i.qty; return m; }, {});
    const side = () => {
      const t = today(); const packed = db.all('orders', (o) => o.history.some((h) => h.st === 'paketlendi' && iso(h.at) === t));
      $('#stat', el).innerHTML = `<div class="row"><div class="grow"><div class="small muted">Bugün paketlenen</div><div style="font-size:34px;font-weight:800">${packed.length}</div></div><div class="right"><div class="small muted">Bekleyen</div><div style="font-size:34px;font-weight:800">${db.all('orders', (o) => ['yeni', 'toplaniyor'].includes(o.status)).length}</div></div></div><p class="small muted mt">İpucu: Tek ürünlü siparişlerde doğrudan ürün barkodunu okutun; en eski sipariş otomatik açılır.</p>`;
      $('#last', el).innerHTML = table({ rows: packed.slice(-6).reverse(), empty: 'Bugün paket yok', columns: [{ label: 'Sipariş', render: (o) => `${chB(o.ch)} <span class="mono small">${esc(o.chNo)}</span>` }, { label: 'Durum', render: (o) => stB(o.status) }] });
    };
    const draw = () => {
      if (!cur) { $('#box', el).innerHTML = `<div class="card pad center"><div style="font-size:46px;opacity:.35">${icon('barcode')}</div><p class="muted">Okutma bekleniyor</p></div>`; return; }
      const nd = need(); const done = Object.keys(nd).every((k) => (cnt[k] || 0) >= nd[k]);
      $('#box', el).innerHTML = `<div class="card"><div class="card-h">${chB(cur.ch)}<b class="mono">${esc(cur.chNo)}</b>${stB(cur.status)}<span class="grow"></span>${sla(cur)}<button class="btn sm ghost" id="cx">${icon('x')}</button></div>
        <div class="card-b"><div class="small muted mb">${esc(cur.customer.name)} · ${esc(cur.customer.city || '')} · ${esc(cur.carrier)}</div>${cur.items.map((i) => { const k = i.barcode || i.sku; const c = Math.min(cnt[k] || 0, nd[k]); const ok = c >= nd[k]; return `<div class="list-item" style="${ok ? 'background:color-mix(in srgb,var(--ok) 12%,transparent)' : ''}"><span style="color:var(--${ok ? 'ok' : 'muted'})">${icon(ok ? 'check' : 'box')}</span><span class="grow"><b>${esc(i.name)}</b><div class="small faint mono">${esc(k)} · raf ${esc((prod(i.pid) || {}).loc || '-')}</div></span><b style="font-size:20px">${c}/${nd[k]}</b></div>`; }).join('')}</div>
        <div class="card-h">${done ? `<b style="color:var(--ok)">${icon('check')} Tüm ürünler doğrulandı</b>` : '<span class="small muted">Ürün barkodlarını okutun</span>'}<span class="grow"></span><button class="btn" id="man">Elle onayla</button><button class="btn primary" id="fin" ${done ? '' : 'disabled'}>${icon('print')} Paketle + etiket</button></div></div>`;
      $('#cx', el).onclick = () => { cur = null; draw(); inp.focus(); };
      $('#man', el).onclick = async () => { if (await confirm('Barkod okutmadan tüm ürünler doğrulanmış sayılsın mı?')) { cnt = need(); draw(); } };
      $('#fin', el).onclick = finish;
    };
    async function finish() {
      const o = cur; if (S().autoInvoice !== false) await invoice(o); ensureTracking(o);
      setSt(o, 'paketlendi', `Barkodla doğrulandı${o.invoice ? ', fatura ' + o.invoice : ''}`); db.save(); printLabels([o]);
      NS.beep(1200, 90); toast(`${o.chNo} paketlendi`, 'ok'); cur = null; draw(); side(); inp.focus();
    }
    const open = (o) => { if (!['yeni', 'toplaniyor', 'paketlendi'].includes(o.status)) { NS.beep(220, 200); return toast(`${o.chNo} durumu: ${Z.ST[o.status][0]}`, 'err'); } cur = o; cnt = {}; draw(); };
    function scan(code) {
      code = code.trim(); if (!code) return;
      const o = db.find('orders', (x) => x.chNo === code || x.pkgNo === code || x.tracking === code);
      if (o) return open(o);
      if (cur) {
        const nd = need(); const p2 = byCode(code); const k = Object.keys(nd).find((x) => x === code || (p2 && (x === p2.barcode || x === p2.sku)));
        if (!k) { NS.beep(200, 300); return toast('Bu ürün bu siparişte yok!', 'err'); }
        if ((cnt[k] || 0) >= nd[k]) { NS.beep(200, 300); return toast('Bu üründen fazla okuttunuz', 'err'); }
        cnt[k] = (cnt[k] || 0) + 1; NS.beep(); draw();
        if (Object.keys(nd).every((x) => (cnt[x] || 0) >= nd[x]) && S().autoFinish) finish();
        return;
      }
      // Hızlı mod: ürün barkodu → bu ürünü içeren en eski tek ürünlü sipariş
      const p2 = byCode(code); if (!p2) { NS.beep(200, 300); return toast('Barkod bulunamadı', 'err'); }
      const single = db.all('orders', (x) => ['yeni', 'toplaniyor'].includes(x.status) && x.items.length === 1 && x.items[0].qty === 1 && x.items[0].pid === p2.id).sort((a, b) => a.shipBy.localeCompare(b.shipBy))[0];
      if (!single) { NS.beep(200, 300); return toast('Bu ürün için bekleyen tek ürünlü sipariş yok', 'err'); }
      cur = single; cnt = { [single.items[0].barcode || single.items[0].sku]: 1 }; NS.beep(); draw();
    }
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { scan(inp.value); inp.value = ''; } });
    if (p) { const o = db.find('orders', (x) => x.chNo === p); if (o) open(o); }
    draw(); side(); setTimeout(() => inp.focus(), 50);
  }

  // ---------- Ürünler & stok ----------
  function productsPage(el, p, app) {
    let q = '', f = p || '';
    const ks = connected();
    el.innerHTML = pageHead('Ürünler & Stok', 'Stok tek yerde tutulur; her değişiklik bağlı tüm pazaryerlerine gönderilir', `<button class="btn" id="sync">${icon('refresh')} Tüm kanallara stok gönder</button><button class="btn primary" id="add">${icon('plus')} Ürün</button>`) + `
      <div class="card"><div class="card-h">${NS.searchBox('q', 'Ürün, barkod, stok kodu, raf...')}<div class="seg">${[['', 'Tümü'], ['kritik', 'Kritik stok'], ['hata', 'Hatalı listeleme'], ['eksik', 'Eksik kanal']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const LS = { yayinda: ['ok', 'Yayında'], stoksuz: ['warn', 'Stok yok'], hata: ['err', 'Hatalı'] };
    const dot = (p2, k) => { const s = (p2.listings || {})[k]; return s ? `<span title="${CH[k].name}: ${LS[s][1]}" class="badge ${LS[s][0]}" style="min-width:34px;justify-content:center">${CH[k].short}</span>` : `<span title="${CH[k].name}: listelenmedi" class="badge" style="opacity:.35;min-width:34px;justify-content:center">${CH[k].short}</span>`; };
    const rows = () => db.all('products', (x) => NS.match(q, x.name, x.barcode, x.sku, x.loc) && (!f || (f === 'kritik' ? x.stock <= (Number(S().lowStock) || 5) : f === 'hata' ? Object.values(x.listings || {}).includes('hata') : ks.some((k) => !(x.listings || {})[k]))));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'box', columns: [
      { label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint mono">${esc(x.barcode)} · ${esc(x.sku)}</div>` },
      { label: 'Raf', render: (x) => `<span class="mono">${esc(x.loc || '-')}</span>` },
      { label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= 0 ? 'err' : x.stock <= (Number(S().lowStock) || 5) ? 'warn' : 'text'})">${x.stock}</b>` },
      { label: 'Maliyet / Fiyat', cls: 'right', render: (x) => `${money(x.cost)}<div class="small faint">${money(x.price)}</div>` },
      { label: 'Kanallar', render: (x) => `<div class="row" style="gap:4px;flex-wrap:wrap">${ks.map((k) => dot(x, k)).join('')}</div>` },
    ], actions: [{ icon: 'plus', act: 'st', title: 'Stok gir / düş' }, { icon: 'edit', act: 'ed' }], foot: `${r.length} ürün · ${sum(r, (x) => x.stock)} adet · stok değeri ${money(sum(r, (x) => x.stock * x.cost))}` }); };
    const edit = async (x) => {
      const v = await formModal({ title: x ? x.name : 'Yeni ürün', size: 'wide', fields: [{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'barcode', label: 'Barkod', required: true }, { name: 'sku', label: 'Stok kodu', required: true }, { name: 'cat', label: 'Kategori' }, { name: 'loc', label: 'Raf / lokasyon', placeholder: 'A-01-1' }, { name: 'cost', label: 'Maliyet (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'desi', label: 'Desi', type: 'number' }, { name: 'vat', label: 'KDV %', type: 'number' }, { type: 'section', label: 'Listelendiği kanallar' }, ...ks.map((k) => ({ name: 'ls_' + k, label: CH[k].name, type: 'checkbox' }))], values: { vat: 20, desi: 1, ...(x || {}), ...Object.fromEntries(ks.map((k) => ['ls_' + k, !!((x || {}).listings || {})[k]])) } });
      if (!v) return;
      const ls = { ...((x || {}).listings || {}) }; ks.forEach((k) => { if (v['ls_' + k] && !ls[k]) ls[k] = 'yayinda'; if (!v['ls_' + k]) delete ls[k]; delete v['ls_' + k]; });
      v.listings = ls; const rec = x ? db.update('products', x.id, v) : db.insert('products', { ...v, chPrice: {} });
      db.save(); await pushStock([rec.id || x.id], true); toast('Kaydedildi, kanallara gönderildi', 'ok'); draw();
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(db.get('products', b.dataset.id)));
    on(el, 'click', '[data-act=st]', async (e, b) => {
      const x = db.get('products', b.dataset.id);
      const v = await formModal({ title: `Stok hareketi — ${x.name}`, fields: [{ name: 'type', label: 'İşlem', type: 'select', options: [{ value: 'in', label: 'Giriş (mal kabul)' }, { value: 'out', label: 'Çıkış (fire / hasar)' }, { value: 'set', label: 'Sayım (stoğu eşitle)' }] }, { name: 'qty', label: 'Adet', type: 'number', required: true }, { name: 'note', label: 'Açıklama' }], values: { type: 'in' } });
      if (!v) return; const n = Number(v.qty) || 0; x.stock = v.type === 'in' ? x.stock + n : v.type === 'out' ? Math.max(0, x.stock - n) : n;
      db.log('Stok', `${x.sku} → ${x.stock} (${v.note || v.type})`); db.save(); await pushStock([x.id], true); toast(`Yeni stok ${x.stock} — tüm kanallara gönderildi`, 'ok'); draw();
    });
    $('#add', el).onclick = () => edit(null);
    $('#sync', el).onclick = async (e) => { e.target.disabled = true; await pushStock(null); e.target.disabled = false; draw(); };
    draw();
  }

  // ---------- İadeler ----------
  function returnsPage(el, p, app) {
    let f = 'acik';
    el.innerHTML = pageHead('İadeler', 'Pazaryeri iade talepleri — depoya gelince kontrol edin; sağlam ürün stoğa döner') + `
      <div class="card"><div class="card-h"><div class="seg">${[['acik', 'İşlem bekleyen'], ['onay', 'Onaylanan'], ['red', 'Reddedilen'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div><span class="grow"></span><input class="input" id="sc" placeholder="İade kargo barkodu / sipariş no okutun" style="max-width:300px"></div><div id="t"></div></div>`;
    const rows = () => db.all('returns', (r) => f === 'all' || (f === 'acik' ? ['talep', 'yolda', 'geldi'].includes(r.status) : r.status === f)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { $('#t', el).innerHTML = table({ rows: rows(), emptyIcon: 'refresh', empty: 'İade yok', columns: [
      { label: 'İade', render: (r) => `${chB(r.ch)}<div class="mono small mt">${esc(r.no)}</div><div class="small faint">${NS.dt(r.at)}</div>` },
      { label: 'Sipariş', render: (r) => { const o = db.get('orders', r.oid) || { customer: {} }; return `<span class="mono small">${esc(o.chNo || '-')}</span><div class="small">${esc(o.customer.name || '')}</div>`; } },
      { label: 'Ürün', render: (r) => r.items.map((i) => `<div class="small">${i.qty}× ${esc(i.name)}</div>`).join('') },
      { label: 'Neden', render: (r) => esc(r.reason) },
      { label: 'Durum', render: (r) => badge(Z.RST[r.status][0], Z.RST[r.status][1]) + (r.condition ? `<div class="small mt">${r.condition === 'saglam' ? 'Sağlam → stoğa' : 'Hasarlı → fire'}</div>` : '') },
    ], actions: [{ icon: 'check', act: 'ok', title: 'Kontrol et / sonuçlandır', show: (r) => ['talep', 'yolda', 'geldi'].includes(r.status) }], foot: `Son 30 gün iade oranı: %${rate()}` }); };
    const rate = () => { const os = db.all('orders', (o) => o.at > addDays(new Date(), -30).toISOString()); return os.length ? ((db.all('returns', (r) => r.at > addDays(new Date(), -30).toISOString()).length / os.length) * 100).toFixed(1) : 0; };
    const decide = async (r) => {
      const v = await formModal({ title: `İade kontrolü — ${r.no}`, fields: [{ name: 'condition', label: 'Ürün durumu', type: 'select', options: [{ value: 'saglam', label: 'Sağlam — stoğa geri al ve onayla' }, { value: 'hasarli', label: 'Hasarlı / kullanılmış — reddet, itiraz aç' }] }, { name: 'note', label: 'Not (itirazda pazaryerine iletilir)', type: 'textarea', full: true }], values: { condition: 'saglam' } });
      if (!v) return; r.condition = v.condition; r.note = v.note;
      if (v.condition === 'saglam') { r.status = 'onay'; r.items.forEach((i) => { const x = prod(i.pid); if (x) x.stock += i.qty; }); await pushStock(r.items.map((i) => i.pid).filter(Boolean), true); toast('İade onaylandı, ürün stoğa eklendi', 'ok'); }
      else { r.status = 'red'; toast('İade reddedildi, itiraz kaydı oluşturuldu', 'ok'); }
      log(r.ch, 'İade', `${r.no} ${r.status === 'onay' ? 'onaylandı' : 'reddedildi'}`); db.save(); draw();
    };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ok]', (e, b) => decide(db.get('returns', b.dataset.id)));
    $('#sc', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const c = e.target.value.trim(); e.target.value = ''; const o = db.find('orders', (x) => x.chNo === c || x.tracking === c || x.pkgNo === c); const r = o && db.find('returns', (x) => x.oid === o.id && ['talep', 'yolda', 'geldi'].includes(x.status)); if (!r) return toast('Bu barkoda ait açık iade yok', 'err'); r.status = 'geldi'; db.save(); draw(); decide(r); });
    draw();
  }

  // ---------- Müşteri soruları ----------
  function questionsPage(el, p, app) {
    let f = 'bekleyen';
    el.innerHTML = pageHead('Müşteri Soruları', 'Tüm pazaryerlerinden gelen ürün soruları — hızlı yanıt mağaza puanınızı yükseltir', `<button class="btn" id="pull">${icon('refresh')} Soruları çek</button>`) + `<div class="card"><div class="card-h"><div class="seg"><button data-f="bekleyen" class="active">Cevap bekleyen</button><button data-f="all">Tümü</button></div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('questions', (q) => f === 'all' || !q.answer).sort((a, b) => b.at.localeCompare(a.at)), emptyIcon: 'message', empty: 'Cevap bekleyen soru yok', columns: [
      { label: 'Kanal', render: (q) => chB(q.ch) },
      { label: 'Soru', render: (q) => `<b>${esc(q.text)}</b><div class="small faint">${esc((prod(q.pid) || {}).name || '')} · ${esc(q.customer)} · ${NS.dt(q.at)}</div>${q.answer ? `<div class="small mt" style="color:var(--ok)">↳ ${esc(q.answer)}</div>` : ''}` },
      { label: 'Süre', render: (q) => (q.answer ? badge('Yanıtlandı', 'ok') : badge(`${Math.round((Date.now() - new Date(q.at)) / 3600e3)} sa`, (Date.now() - new Date(q.at)) / 3600e3 > 24 ? 'err' : 'warn')) },
    ], actions: [{ icon: 'send', act: 'an', title: 'Yanıtla', show: (q) => !q.answer }] }); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=an]', async (e, b) => {
      const q = db.get('questions', b.dataset.id); const T = String(S().templates || '').split('\n').filter(Boolean);
      const v = await formModal({ title: q.text, fields: [{ name: 'tpl', label: 'Hazır yanıt', type: 'select', empty: 'Seçin…', options: T.map((t, i) => ({ value: String(i), label: t.slice(0, 70) + (t.length > 70 ? '…' : '') })) }, { name: 'answer', label: 'Yanıtınız', type: 'textarea', full: true, required: true }], onOpen: (m) => { $('[name=tpl]', m).onchange = (ev) => { if (ev.target.value !== '') $('[name=answer]', m).value = T[Number(ev.target.value)]; }; } });
      if (!v) return;
      if (isLive(q.ch) && q.extId) { const r = await live(q.ch, 'soru-yanitla', { question: q.extId, answer: v.answer }); if (!r.ok) return toast(r.error, 'err'); }
      q.answer = v.answer; q.answeredAt = new Date().toISOString(); log(q.ch, 'Soru yanıtı', q.text.slice(0, 40)); db.save(); toast('Yanıt gönderildi', 'ok'); draw();
    });
    $('#pull', el).onclick = async () => {
      let n = 0;
      for (const k of connected().filter(isLive)) { const r = await live(k, 'soru-cek'); if (!r.ok) { toast(`${CH[k].name}: ${r.error}`, 'err'); continue; } ((r.data && r.data.questions) || []).forEach((x) => { if (db.find('questions', (y) => y.extId === x.id)) return; const pr2 = byCode(x.barcode); db.insert('questions', { ch: k, extId: x.id, pid: pr2 && pr2.id, text: x.text, customer: x.customer || 'Müşteri', at: x.at || new Date().toISOString(), answer: '' }); n++; }); }
      db.save(); toast(n ? `${n} yeni soru` : 'Yeni soru yok (demo kanallar simülasyondur)', n ? 'ok' : ''); draw();
    };
    draw();
  }

  // ---------- Hakediş & kâr ----------
  function payoutPage(el) {
    const ds = db.all('orders', (o) => o.at > addDays(new Date(), -45).toISOString() && !['iptal'].includes(o.status));
    const due = (o) => { const base = o.deliveredAt || (o.status === 'kargoda' ? addDays(new Date(), 2).toISOString() : null); return base ? iso(addDays(new Date(base), Number(chCfg(o.ch).payoutDays) || 7)) : null; };
    const rows = connected().map((k) => { const os = ds.filter((o) => o.ch === k && o.status !== 'iade'); const pr = os.map(profit); const paid = os.filter((o) => due(o) && due(o) <= today()); const wait = os.filter((o) => !due(o) || due(o) > today()); return { id: k, k, n: os.length, gross: sum(pr, (x) => x.gross), com: sum(pr, (x) => x.com + x.fee), ship: sum(pr, (x) => x.ship), net: sum(pr, (x) => x.net), kar: sum(pr, (x) => x.kar), paid: sum(paid, (o) => profit(o).net), wait: sum(wait, (o) => profit(o).net) }; });
    const cal = Object.entries(NS.groupBy(ds.filter((o) => due(o) && due(o) > today()), due)).sort(([a], [b]) => a.localeCompare(b)).slice(0, 10);
    el.innerHTML = pageHead('Hakediş & Kâr', 'Son 45 gün · komisyon, hizmet bedeli, kargo ve ürün maliyeti düşülmüş gerçek kâr') + `
      <div class="grid g4 mb">${kpi('Satış', money(sum(rows, (r) => r.gross)), 'cart')}${kpi('Pazaryeri kesintisi', money(sum(rows, (r) => r.com + r.ship)), 'percent', 'warn')}${kpi('Beklenen ödeme', money(sum(rows, (r) => r.wait)), 'clock', 'info')}${kpi('Net kâr', money(sum(rows, (r) => r.kar)), 'trend', 'ok')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Kanal bazında</h3></div>${table({ rows, columns: [{ label: 'Kanal', render: (r) => chB(r.k) }, { label: 'Sipariş', cls: 'right', key: 'n' }, { label: 'Satış', cls: 'right', render: (r) => money(r.gross) }, { label: 'Komisyon+bedel', cls: 'right', render: (r) => money(r.com) }, { label: 'Kargo', cls: 'right', render: (r) => money(r.ship) }, { label: 'Hakediş', cls: 'right', render: (r) => `<b>${money(r.net)}</b>` }, { label: 'Net kâr', cls: 'right', render: (r) => `<b style="color:var(--${r.kar >= 0 ? 'ok' : 'err'})">${money(r.kar)}</b><div class="small faint">%${r.gross ? ((r.kar / r.gross) * 100).toFixed(1) : 0}</div>` }] })}</div>
      <div class="card"><div class="card-h"><h3>Ödeme takvimi</h3></div>${table({ rows: cal.map(([d, os]) => ({ id: d, d, os })), empty: 'Bekleyen ödeme yok', columns: [{ label: 'Tarih', render: (r) => `<b>${NS.date(r.d)}</b>` }, { label: 'Kanallar', render: (r) => `<div class="row" style="gap:4px;flex-wrap:wrap">${[...new Set(r.os.map((o) => o.ch))].map((k) => `<span class="badge" title="${CH[k].name}" style="background:${CH[k].color};color:#fff;border:0">${CH[k].short}</span>`).join('')}</div>` }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(sum(r.os, (o) => profit(o).net))}</b>` }] })}</div></div>
      <div class="card mt"><div class="card-h"><h3>${icon('alert')} Zarar eden siparişler</h3><span class="small muted">Komisyon ve kargo sonrası eksiye düşenler — fiyatı gözden geçirin</span></div>${table({ rows: ds.filter((o) => profit(o).kar < 0).slice(-10).reverse(), empty: 'Zarar eden sipariş yok', columns: [{ label: 'Sipariş', render: (o) => `${chB(o.ch)} <span class="mono small">${esc(o.chNo)}</span>` }, { label: 'Ürün', render: (o) => esc(o.items[0].name) }, { label: 'Satış', cls: 'right', render: (o) => money(o.total) }, { label: 'Kâr', cls: 'right', render: (o) => `<b style="color:var(--err)">${money(profit(o).kar)}</b>` }] })}</div>`;
  }

  // ---------- Kanallar ----------
  function channelsPage(el, p, app) {
    el.innerHTML = pageHead('Pazaryeri Bağlantıları', 'API bilgilerinizi satıcı panelinizin "Entegrasyon" bölümünden alın') + `<div class="grid g3" id="g"></div><div class="card mt"><div class="card-h"><h3>Senkron günlüğü</h3></div><div id="lg"></div></div>`;
    const draw = () => {
      $('#g', el).innerHTML = Object.keys(CH).map((k) => { const c = chCfg(k); const os = db.all('orders', (o) => o.ch === k && o.at > addDays(new Date(), -30).toISOString()); return `<div class="card pad" style="border-top:4px solid ${CH[k].color}"><div class="row"><b style="font-size:18px" class="grow">${esc(CH[k].name)}</b>${c.connected ? badge(isLive(k) ? 'Canlı' : 'Bağlı (demo)', isLive(k) ? 'ok' : 'info') : badge('Bağlı değil')}</div>
        <div class="small muted mt">${c.connected ? `Satıcı no: ${esc(c.sellerId || '-')} · komisyon %${c.commission} · ödeme ${c.payoutDays} gün` : 'Bağlanınca siparişler, stok ve sorular otomatik akar.'}</div>${c.connected ? `<div class="mt"><b>${os.length}</b> <span class="small muted">sipariş / 30 gün · ${money(sum(os, (o) => o.total))}</span></div>` : ''}
        <div class="row mt"><button class="btn sm ${c.connected ? '' : 'primary'}" data-cfg="${k}">${icon(c.connected ? 'settings' : 'link')} ${c.connected ? 'Ayarlar' : 'Bağlan'}</button>${!Z.LIVE.includes(k) ? '<span class="small faint">Canlı API yakında</span>' : ''}</div></div>`; }).join('');
      $('#lg', el).innerHTML = table({ rows: (db.data.synclog || []).slice(0, 30), empty: 'Kayıt yok', columns: [{ label: 'Zaman', render: (l) => NS.dt(l.at) }, { label: 'Kanal', render: (l) => chB(l.ch) }, { label: 'İşlem', render: (l) => esc(l.action) }, { label: 'Sonuç', render: (l) => `${l.ok ? '' : badge('Hata', 'err')} ${esc(l.detail)}` }] });
    };
    on(el, 'click', '[data-cfg]', (e, b) => {
      const k = b.dataset.cfg; const c = chCfg(k);
      modal({ title: `${CH[k].name} bağlantısı`, size: 'wide', body: `<div class="form-grid">${NS.fieldsHtml([...(Z.LIVE.includes(k) ? [{ name: 'mode', label: 'Çalışma modu', type: 'select', options: [{ value: 'demo', label: 'Demo (pazaryerine gitmez)' }, { value: 'live', label: 'Canlı (gerçek API)' }], full: true }] : []), { name: 'sellerId', label: k === 'hepsiburada' ? 'Merchant ID' : 'Satıcı ID', required: true }, { name: 'apiKey', label: k === 'hepsiburada' ? 'Servis kullanıcı adı' : 'API key' }, { name: 'apiSecret', label: k === 'hepsiburada' ? 'Servis anahtarı' : 'API secret', type: 'password' }, ...(Z.LIVE.includes(k) ? [{ name: 'stage', label: 'Test ortamı (stage)', type: 'checkbox' }] : []), { type: 'section', label: 'Sözleşme ve kurallar' }, { name: 'commission', label: 'Komisyon %', type: 'number', step: '0.01' }, { name: 'fixedFee', label: 'Sipariş başı hizmet bedeli (₺)', type: 'number', step: '0.01' }, { name: 'payoutDays', label: 'Teslimden sonra ödeme (gün)', type: 'number' }, { name: 'shipDays', label: 'Kargoya verme süresi (gün)', type: 'number' }, { name: 'buffer', label: 'Stok tamponu (adet)', type: 'number', hint: 'Aynı ürün iki kanalda birden satılmasın diye düşülür' }], { mode: 'demo', ...c })}</div>`,
        actions: [...(c.connected ? [{ label: 'Bağlantıyı kes', cls: 'danger', onClick: async (close) => { if (!(await confirm(`${CH[k].name} bağlantısı kesilsin mi?`))) return; db.data.channels[k] = { ...db.data.channels[k], connected: false }; log(k, 'Bağlantı', 'Kesildi'); db.save(); close(); draw(); } }] : []),
          { label: 'Kaydet ve test et', cls: 'primary', onClick: async (close, b2) => {
            if (!NS.validate(b2)) return; const v = NS.readForm(b2);
            if (v.mode === 'live') { if (!v.apiKey || !v.apiSecret) return toast('Canlı mod için API bilgileri gerekli', 'err'); toast('Bağlantı test ediliyor…'); const r = await live(k, 'baglanti-test', {}, v); if (!r.ok) { db.save(); return toast(`Bağlantı kurulamadı: ${r.error}`, 'err'); } }
            db.data.channels[k] = { ...(db.data.channels[k] || {}), ...v, connected: true }; log(k, 'Bağlantı', v.mode === 'live' ? 'Canlı bağlantı başarılı' : 'Kaydedildi (demo)'); db.save(); close(); toast(`${CH[k].name} kaydedildi`, 'ok'); draw();
          } }] });
    });
    draw();
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    const os = db.all('orders', (o) => o.at > addDays(new Date(), -30).toISOString() && o.status !== 'iptal');
    const byP = Object.values(os.flatMap((o) => o.items.map((i) => ({ ...i, o }))).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { id: k, name: i.name, qty: 0, ciro: 0, kar: 0 }; m[k].qty += i.qty; m[k].ciro += i.qty * i.price; const pr = profit(i.o); m[k].kar += pr.kar * ((i.qty * i.price) / (i.o.total || 1)); return m; }, {})).sort((a, b) => b.ciro - a.ciro);
    const rets = db.all('returns', (r) => r.at > addDays(new Date(), -30).toISOString());
    el.innerHTML = pageHead('Raporlar', 'Son 30 gün') + `<div class="grid g4 mb">${kpi('Sipariş', os.length, 'cart')}${kpi('Ciro', money(sum(os, (o) => o.total)), 'trend', 'ok')}${kpi('Ortalama sepet', money(os.length ? sum(os, (o) => o.total) / os.length : 0), 'bag', 'info')}${kpi('İade oranı', '%' + (os.length ? ((rets.length / os.length) * 100).toFixed(1) : 0), 'refresh', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kanala göre sipariş</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(os, (o) => o.ch)).map(([k, v]) => ({ label: CH[k].short, value: v.length })))}</div></div>
      <div class="card"><div class="card-h"><h3>İade nedenleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(rets, (r) => r.reason)).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="card"><div class="card-h"><h3>En çok satan ürünler</h3></div>${table({ rows: byP.slice(0, 15), columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.name)}</b>` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.ciro) }, { label: 'Kâr', cls: 'right', render: (r) => `<b style="color:var(--${r.kar >= 0 ? 'ok' : 'err'})">${money(r.kar)}</b>` }] })}</div>`;
  }

  const ROLES = { admin: 'Yönetici', depo: 'Depo / paketleme', destek: 'Müşteri hizmetleri' };
  const app = NS.shell({
    id: 'pazaryeri', integrations: ['pazaryeri', 'kargofirma', 'efatura', 'label', 'barcode', 'printer', 'sms', 'webhook', 'backup'], name: 'Pazaryeri Satıcı Paneli', tagline: 'Tüm pazaryerleri tek ekranda', icon: 'store', accent: '#f97316', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Operasyon' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['depo', 'destek'] }, { id: 'siparisler', badge: true, label: 'Siparişler', icon: 'cart', roles: ['depo', 'destek'] }, { id: 'toplama', label: 'Toplama Listesi', icon: 'list', roles: ['depo'] }, { id: 'paketleme', label: 'Paketleme', icon: 'barcode', roles: ['depo'] }, { id: 'iadeler', badge: true, label: 'İadeler', icon: 'refresh', roles: ['depo', 'destek'] }, { id: 'sorular', badge: true, label: 'Müşteri Soruları', icon: 'message', roles: ['destek'] }, { sec: 'Mağaza' }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box', roles: ['depo'] }, { id: 'kanallar', label: 'Pazaryerleri', icon: 'store', roles: ['admin'] }, { sec: 'Finans' }, { id: 'hakedis', label: 'Hakediş & Kâr', icon: 'wallet', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'yeni').length, sorular: db.all('questions', (q) => !q.answer).length, iadeler: db.all('returns', (r) => ['talep', 'yolda', 'geldi'].includes(r.status)).length }),
    routes: { ozet: dashboard, siparisler: ordersPage, toplama: pickPage, paketleme: packPage, urunler: productsPage, iadeler: returnsPage, sorular: questionsPage, hakedis: payoutPage, kanallar: channelsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Operasyon' }, { name: 'cutoff', label: 'Günlük kargo kesim saati', type: 'time' }, { name: 'carrier', label: 'Varsayılan kargo firması', type: 'select', options: Z.CARRIERS }, { name: 'lowStock', label: 'Kritik stok sınırı', type: 'number' }, { name: 'autoInvoice', label: 'Paketlemede e-Arşiv faturayı otomatik kes', type: 'checkbox' }, { name: 'autoStock', label: 'Sipariş gelince stoğu tüm kanallara otomatik gönder', type: 'checkbox' }, { name: 'autoFinish', label: 'Tüm ürünler okutulunca paketi otomatik kapat', type: 'checkbox' }, { name: 'templates', label: 'Hazır soru yanıtları (her satır bir yanıt)', type: 'textarea', full: true }] }) },
  });
  // Arka planda: canlı kanallardan 5 dakikada bir sipariş çek
  setInterval(() => { if (connected().some(isLive)) pullOrders().then((r) => { if (r.count) { toast(`${r.count} yeni pazaryeri siparişi`, 'ok'); NS.beep(); } }); }, 5 * 60e3);
  if (NS.currentUser && NS.currentUser.role === 'depo' && !location.hash) app.go('paketleme');
})();
