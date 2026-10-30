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
  // Ürün sorgusu kâr hesabında sipariş kalemi başına çalışır: dizi taranmaz, dizi veya boyu değişince dizin yeniden kurulur
  const pIdx = { c: null, n: -1, m: new Map() };
  const prod = (id) => { const c = db.col('products'); if (pIdx.c !== c || pIdx.n !== c.length) { pIdx.c = c; pIdx.n = c.length; pIdx.m = new Map(c.map((x) => [x.id, x])); } return pIdx.m.get(id); };
  const isAdm = () => !NS.currentUser || NS.currentUser.role === 'admin'; // Maliyet, kâr ve kanal bilgisi yalnızca yöneticide
  const canOps = () => !NS.currentUser || ['admin', 'depo'].includes(NS.currentUser.role); // Müşteri hizmetleri stok ve iptal işlemi yapmaz
  // Barkod, stok kodu veya daha önce elle eşleştirilmiş pazaryeri kodu (aliases)
  const byCode = (code) => { const c = String(code || '').trim(); if (!c) return null; return db.find('products', (p) => p.barcode === c || p.sku === c || (p.aliases || []).includes(c)); };
  const sale = (o) => !['iptal', 'iade'].includes(o.status); // İptal ve iade edilen sipariş ciro ve kâra girmez
  const lowOf = (x) => x.stock <= (Number(x.low) || Number(S().lowStock) || 5);
  // Son 30 günün satış hızı: ürün başına günlük adet (iptal/iade hariç, tek geçiş)
  const salesRate = () => { const since = addDays(new Date(), -30).toISOString(); const m = {}; db.all('orders', (o) => o.at > since && sale(o)).forEach((o) => o.items.forEach((i) => { if (i.pid) m[i.pid] = (m[i.pid] || 0) + i.qty; })); return m; };
  // Kanal başı fiyat tabanı: maliyet + hedef kâr, komisyon ve sabit bedelin üstünde kalacak en düşük KDV dahil fiyat
  const floorOf = (p, k) => { const c = chCfg(k); const m = Number(S().minMargin); const pct = (Number(c.commission) || 0) + (Number(m) || 0); if (!(pct < 100) || !p.cost) return 0; return Math.ceil(((Number(p.cost) + (Number(c.fixedFee) || 0) + (Number(S().avgShip) || 0)) / (1 - pct / 100)) * 100) / 100; };
  const vatOf = (p) => { const v = (p || {}).vat; return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : Number(S().vat ?? 20); };
  const unB = (o) => (o.items.some((i) => !i.pid) ? ' ' + badge('Eşleşmeyen ürün', 'err') : '');
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
    // Aynı sipariş birden çok pakete bölünebilir: paket no varsa tekrar denetimi pakete göre
    if (db.find('orders', (o) => o.ch === k && (x.packageId ? o.pkgNo === String(x.packageId) || (!o.pkgNo && o.chNo === no) : o.chNo === no))) return null;
    const items = (x.items || []).map((i) => { const p = byCode(i.barcode) || byCode(i.sku); const q = i.qty || 1; const taken = p ? Math.min(q, Math.max(0, p.stock)) : 0; return { pid: p ? p.id : null, code: i.barcode || i.sku || '', sku: p ? p.sku : i.sku, barcode: i.barcode || (p && p.barcode), name: i.name || (p && p.name) || i.sku, qty: q, price: i.price || 0, lineId: i.lineId, taken, ...(p && taken < q ? { short: q - taken } : {}) }; });
    const at = new Date(x.at || Date.now()); const shipBy = addDays(at, chCfg(k).shipDays || 1); shipBy.setHours(23, 59, 0, 0);
    const o = db.insert('orders', { ch: k, chNo: no, pkgNo: String(x.packageId || ''), at: at.toISOString(), shipBy: shipBy.toISOString(), customer: x.customer || {}, items, total: x.total || sum(items, (i) => i.qty * i.price), shipCost: 0, carrier: x.cargo || S().carrier, tracking: x.tracking || '', status: 'yeni', history: [{ at: new Date().toISOString(), st: 'yeni', note: `${CH[k].name} siparişi alındı` }] });
    items.forEach((i) => { const p = i.pid && prod(i.pid); if (p) p.stock -= i.taken; });
    return o;
  }
  // Stoğa yalnızca siparişte düşülmüş adet döner
  const giveBack = (o) => { o.items.forEach((i) => { const p = prod(i.pid); if (p) p.stock += i.taken ?? i.qty; }); return o.items.map((i) => i.pid).filter(Boolean); };
  // Müşteri iptali ve teslim (Trendyol paket durum filtresi). Durum geri kaymaz: kargodaki sipariş iptale, teslim edilen kargoya dönmez.
  async function pullStatus() {
    const r0 = { cancelled: 0, delivered: 0, late: [] }; if (!isLive('trendyol')) return r0;
    const since = chCfg('trendyol').lastStatusPull || addDays(new Date(), -7).toISOString(); const touched = []; let okAll = true;
    const find = (x) => db.find('orders', (o) => o.ch === 'trendyol' && (x.packageId ? o.pkgNo === String(x.packageId) : o.chNo === String(x.orderNo)));
    for (const status of ['Cancelled', 'Delivered']) {
      const r = await live('trendyol', 'siparis-cek', { since, status }); if (!r.ok) { okAll = false; r0.err = `Trendyol: ${r.error}`; continue; }
      ((r.data && r.data.orders) || []).forEach((x) => { const o = find(x); if (!o) return;
        if (status === 'Cancelled' && OPEN.includes(o.status)) { setSt(o, 'iptal', 'Pazaryerinde iptal edildi'); touched.push(...giveBack(o)); r0.cancelled++; if (o.status !== 'yeni' && o.history.some((h) => h.st === 'paketlendi')) r0.late.push(o.chNo); }
        if (status === 'Delivered' && o.status === 'kargoda') { o.deliveredAt = new Date().toISOString(); setSt(o, 'teslim', 'Alıcıya teslim edildi'); r0.delivered++; } });
    }
    if (okAll) { db.data.channels.trendyol = { ...db.data.channels.trendyol, lastStatusPull: new Date().toISOString() }; } db.save(); if (touched.length) await pushStock(touched, true); return r0;
  }
  // İade talepleri (Trendyol claims): "talep" olarak düşer, ürün gelince İadeler ekranında kontrol edilir
  async function pullClaims() {
    if (!isLive('trendyol')) return { count: 0, err: 'Trendyol canlı bağlı değil' };
    const r = await live('trendyol', 'iade-cek', {}); if (!r.ok) return { count: 0, err: `Trendyol: ${r.error}` };
    let count = 0, miss = 0;
    ((r.data && r.data.claims) || []).forEach((c) => {
      if (db.find('returns', (x) => x.extId === c.id)) return; const open = c.items.filter((i) => ['Created', 'WaitingInAction'].includes(i.status)); if (!open.length) return;
      const o = db.find('orders', (x) => x.ch === 'trendyol' && (c.packageId ? x.pkgNo === c.packageId : x.chNo === c.orderNo)) || db.find('orders', (x) => x.ch === 'trendyol' && x.chNo === c.orderNo); if (!o) { miss++; return; }
      db.insert('returns', { no: 'IA' + (10240 + db.all('returns').length), extId: c.id, oid: o.id, ch: 'trendyol', at: c.at, reason: c.reason || 'Trendyol iade talebi', items: open.map((i) => { const p = byCode(i.barcode) || byCode(i.sku); return { pid: p ? p.id : null, sku: i.sku, barcode: i.barcode, name: i.name, qty: i.qty, price: i.price }; }), status: 'talep', condition: '', note: '', cargo: c.tracking }, true);
      if (sale(o)) setSt(o, 'iade', 'Trendyol iade talebi'); count++;
    });
    db.save(); return { count, miss, err: '' };
  }
  // Canlı kanallardan API ile çeker; demo (simülasyon) kanalda sipariş uydurulmaz (CLAUDE.md §1)
  async function pullOrders() {
    let count = 0, sim = 0; const errs = []; const touched = new Set();
    for (const k of connected()) {
      if (isLive(k)) {
        const r = await live(k, 'siparis-cek', { since: addDays(new Date(), -3).toISOString() });
        if (!r.ok) { errs.push(`${CH[k].name}: ${r.error}`); continue; }
        ((r.data && r.data.orders) || []).forEach((x) => { const o = addOrder(k, x); if (o) { count++; o.items.forEach((i) => i.pid && touched.add(i.pid)); } });
      } else { sim++; log(k, 'TEST: sipariş çekilmedi (TEST bağlantı)', 'Canlı moda alınca siparişler gelir', false); }
    }
    db.save();
    if (touched.size && S().autoStock !== false) await pushStock([...touched], true);
    const st = await pullStatus(); if (st.err) errs.push(st.err);
    return { count, sim, err: errs.join(' · '), cancelled: st.cancelled, delivered: st.delivered, late: st.late };
  }
  const pullMsg = (r) => r.err || [`${r.count} yeni sipariş alındı`, r.cancelled ? `${r.cancelled} sipariş pazaryerinde iptal edildi` : '', r.delivered ? `${r.delivered} sipariş teslim edildi` : '', (r.late || []).length ? `Paketlenmiş iptal: ${r.late.join(', ')} — kargoya vermeyin` : '', r.sim ? `${r.sim} kanal demo (TEST): sipariş alınmadı` : ''].filter(Boolean).join(' · ');
  // Tek stoktan tüm kanallara: tampon düşülerek gönderilir
  async function pushStock(pids, silent) {
    const list = (pids ? pids.map(prod).filter(Boolean) : db.all('products'));
    let ok = 0, sim = 0; const errs = [];
    for (const k of connected()) {
      const items = list.filter((p) => p.listings && p.listings[k]).map((p) => ({ barcode: p.barcode, sku: p.sku, stock: Math.max(0, p.stock - (Number(chCfg(k).buffer) || 0)), price: p.chPrice && p.chPrice[k] }));
      if (!items.length) continue;
      // Demo kanalda stok gönderilmez ve listeleme durumu değiştirilmez
      if (!isLive(k)) { sim++; log(k, 'TEST: stok gönderilmedi (TEST bağlantı)', `${items.length} ürün`, false); continue; }
      const r = await live(k, 'stok-fiyat', { items }); if (!r.ok) { errs.push(`${CH[k].name}: ${r.error}`); continue; }
      list.forEach((p) => { if (p.listings && p.listings[k] && p.listings[k] !== 'hata') p.listings[k] = p.stock - (Number(chCfg(k).buffer) || 0) > 0 ? 'yayinda' : 'stoksuz'; });
      ok++;
    }
    db.save();
    const msg = [ok ? `${list.length} ürünün stoğu ${ok} kanala gönderildi` : '', errs.join(' · '), sim ? `${sim} kanal demo (TEST): gönderilmedi` : ''].filter(Boolean).join(' · ') || 'Gönderilecek listeleme yok';
    if (!silent) toast(msg, errs.length ? 'err' : sim ? 'warn' : 'ok');
    return { ok, sim, errs, msg };
  }

  // ---------- Belgeler: kargo etiketi, fatura, toplama listesi ----------
  const labelHtml = (o) => `<div style="border:2px solid #000;width:380px;font-family:Arial;padding:10px;page-break-after:always;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(o.carrier)}</b><span style="background:${CH[o.ch].color};color:#fff;padding:2px 8px;font-weight:700">${esc(CH[o.ch].name)}</span></div>
    <div style="margin:8px 0">${NS.barcodeSvg(o.tracking || o.pkgNo || o.chNo, { height: 60 })}</div><div style="font-size:11px">GÖNDERİCİ: ${esc(S().bizName)} · ${esc(S().bizAddress || '')}</div><hr>
    <div style="font-size:18px"><b>${esc(o.customer.name)}</b></div><div>${esc(o.customer.address || '')}</div><div style="font-size:16px"><b>${esc(o.customer.district || '')} / ${esc(o.customer.city || '')}</b></div><div>${esc(o.customer.phone || '')}</div><hr>
    <div style="font-size:11px">Sipariş: ${esc(o.chNo)} · ${o.items.map((i) => `${i.qty}× ${esc(i.sku)}`).join(', ')}</div></div>`;
  const printLabels = (list) => NS.printHtml(list.map(labelHtml).join(''), { title: 'Kargo etiketleri' });
  // Takip numarası uydurulmaz: pazaryeri anlaşmalı kargoda siparişle gelir; yoksa kargo firmasının verdiği numara girilir
  async function ensureTracking(list) {
    const miss = list.filter((o) => !o.tracking); if (!miss.length) return true;
    const v = await formModal({ title: 'Takip numarası gerekli', fields: [{ type: 'section', label: 'Kargo firmasının verdiği takip numaralarını girin (etiket bu numarayla basılır)' }, ...miss.slice(0, 30).map((o) => ({ name: 't_' + o.id, label: `${CH[o.ch].short} ${o.chNo} · ${o.customer.name || ''}`, required: true }))] });
    if (!v) return false; miss.slice(0, 30).forEach((o) => { o.tracking = String(v['t_' + o.id] || '').trim(); }); db.save();
    return miss.length <= 30;
  }
  // e-Arşiv: NS.ebelge üzerinden; simülasyon sonucu "TEST" işaretlenir ve pazaryerine fatura no olarak bildirilmez
  async function invoice(o) {
    if (o.invoice && !o.invoiceTest) return true;
    if (!NS.ebelge) { toast('e-Belge modülü yüklü değil; fatura kesilmedi', 'err'); return false; }
    const lines = o.items.map((i) => ({ name: i.name, code: i.barcode, qty: i.qty, total: i.qty * i.price, vat: vatOf(prod(i.pid)) }));
    const r = await NS.ebelge.create({ docType: 'e-Arşiv', buyer: o.customer.name, address: o.customer.address || '', district: o.customer.district || '', city: o.customer.city || '', no: o.chNo, lines, note: `${CH[o.ch].name} sipariş ${o.chNo}` });
    if (r && r.ok) { o.invoice = r.no; o.invoiceId = r.id; o.invoiceTest = !!r.simulated; o.invoiceDate = today(); return true; }
    return false;
  }
  // İade faturası: yalnızca gerçek satış faturası olan siparişte (TEST faturaya iade kesilmez)
  async function refundInvoice(r, o) {
    const vatLine = (i) => ({ name: i.name, code: i.barcode, qty: i.qty, total: i.qty * i.price, vat: vatOf(prod(i.pid)) });
    const x = await NS.ebelge.create({ docType: 'auto', refund: true, refundOf: o.invoice, refundDate: o.invoiceDate || iso(o.at), no: r.no, buyer: o.customer.name, address: o.customer.address || '', district: o.customer.district || '', city: o.customer.city || '', lines: r.items.map(vatLine), note: `${CH[o.ch].name} iade ${r.no}` });
    if (x && x.ok) { r.invoice = x.no; r.invoiceTest = !!x.simulated; db.save(); return true; } return false;
  }
  // Belgeler NS.docs üzerinden (kargo etiketi kendi barkod düzeniyle kalır)
  const pickDoc = (pl, orders, lines) => ({ title: 'Toplama listesi', no: pl.no, date: pl.at, info: [['Sipariş', String(orders.length)], ['Ürün', String(sum(lines, (l) => l.qty))], ['Hazırlayan', pl.user || '']], lines: lines.map((l) => ({ name: l.name, note: `Raf ${l.loc} · ${l.barcode || l.sku}`, qty: l.qty, price: 0, total: 0 })), note: `Siparişler: ${orders.map((o) => `${CH[o.ch].short} ${o.chNo}`).join(' · ')}` });
  if (NS.docs) NS.docs.define('pazaryeri', 'toplama', { label: 'Toplama listesi', sample: () => ({ title: 'Toplama listesi', no: 'TL1001', lines: db.all('products').slice(0, 5).map((p) => ({ name: p.name, note: `Raf ${p.loc || '-'}`, qty: 1, price: 0, total: 0 })) }) });
  const invB = (o) => (o.invoice ? badge(o.invoiceTest ? `TEST fatura ${o.invoice}` : 'Fatura ' + o.invoice, o.invoiceTest ? 'warn' : 'ok') : '');
  function printPick(pl) {
    const orders = pl.orders.map((id) => db.get('orders', id)).filter(Boolean);
    const lines = Object.values(orders.flatMap((o) => o.items).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { ...i, qty: 0, loc: (prod(i.pid) || {}).loc || '-' }; m[k].qty += i.qty; return m; }, {})).sort((a, b) => a.loc.localeCompare(b.loc));
    NS.docs.print('toplama', pickDoc(pl, orders, lines));
  }

  // ---------- Sipariş detay ----------
  function orderModal(app, o) {
    const pr = profit(o);
    modal({
      title: `${CH[o.ch].name} · ${o.chNo}`, size: 'wide',
      body: `<div class="grid g2"><div class="col">
          <div class="row">${chB(o.ch)} ${stB(o.status)} ${sla(o)} ${invB(o)}</div>
          ${o.items.some((i) => !i.pid) ? `<div class="card pad small" style="border-color:var(--err)">${icon('alert')} Stoğunuzla eşleşmeyen ürün var; stok düşülmedi ve paketlenemez. Aşağıdan ürünü seçin, kod bir daha sorulmaz.</div>` : ''}
          <div class="card pad"><div class="small muted">Alıcı</div><b>${esc(o.customer.name)}</b><div class="small">${esc(o.customer.phone || '')}</div><div class="small muted">${esc(o.customer.address || '')} ${esc(o.customer.district || '')} / ${esc(o.customer.city || '')}</div></div>
          <div class="card">${table({ rows: o.items.map((i, n) => ({ ...i, id: n })), columns: [{ label: 'Ürün', render: (i) => `<b>${esc(i.name)}</b><div class="small faint mono">${esc(i.barcode || i.sku)} · raf ${esc((prod(i.pid) || {}).loc || '-')}</div>${i.pid ? '' : `<div class="row nw mt" style="gap:6px"><select class="input" data-mp="${i.id}"><option value="">Ürün seçin…</option>${db.all('products').map((p2) => `<option value="${p2.id}">${esc(p2.name)} · ${esc(p2.barcode || '')}</option>`).join('')}</select><button class="btn sm primary" data-mbtn="${i.id}">Eşleştir</button></div>`}` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Tutar', cls: 'right', render: (i) => money(i.qty * i.price) }] })}</div>
          <div class="list-item small"><span class="grow muted">Kargo</span>${esc(o.carrier || '-')} ${o.tracking ? `<span class="mono">${esc(o.tracking)}</span>` : ''}</div>
          <div class="list-item small"><span class="grow muted">Paket no</span><span class="mono">${esc(o.pkgNo || '-')}</span></div></div>
        <div class="col">${isAdm() ? `<div class="card pad"><h3 class="mb">Kâr hesabı</h3>
          ${[['Satış tutarı', pr.gross], [`Komisyon (%${chCfg(o.ch).commission})`, -pr.com], ['Hizmet bedeli', -pr.fee], ['Kargo', -pr.ship], ['Ürün maliyeti', -pr.cost]].map(([l, v]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(v)}</div>`).join('')}
          <div class="list-item"><b class="grow">Net kâr</b><b style="color:var(--${pr.kar >= 0 ? 'ok' : 'err'})">${money(pr.kar)} · %${pr.marj}</b></div></div>` : ''}
          ${o.items.some((i) => i.short) ? `<div class="card pad small" style="border-color:var(--err)">${icon('alert')} Stok yetmedi: ${o.items.filter((i) => i.short).map((i) => `${esc(i.name)} ${i.short} adet eksik`).join(', ')}. Tedarik edin ya da pazaryeri panelinden iptal edin.</div>` : ''}
          <h3 class="mb mt">Hareketler</h3><div class="col" style="gap:6px">${o.history.slice().reverse().map((h) => `<div class="small"><b>${esc((Z.ST[h.st] || [h.st])[0])}</b> — ${esc(h.note || '')}<div class="faint">${NS.dt(h.at)}${h.user ? ' · ' + esc(h.user) : ''}</div></div>`).join('')}</div></div></div>`,
      onOpen: (b) => on(b, 'click', '[data-mbtn]', (e, btn) => {
        const i = o.items[Number(btn.dataset.mbtn)]; const p2 = prod($(`[data-mp="${btn.dataset.mbtn}"]`, b).value); if (!p2) return toast('Ürün seçin', 'err');
        if (i.code && i.code !== p2.barcode && i.code !== p2.sku) { const other = byCode(i.code); if (other && other.id !== p2.id) return toast(`${i.code} kodu "${other.name}" ürününe bağlı`, 'err'); p2.aliases = [...new Set([...(p2.aliases || []), i.code])]; }
        const got = Math.min(i.qty, Math.max(0, p2.stock)); Object.assign(i, { pid: p2.id, sku: p2.sku, barcode: p2.barcode, name: p2.name, taken: got, ...(got < i.qty ? { short: i.qty - got } : {}) }); p2.stock -= got;
        o.history.push({ at: new Date().toISOString(), st: o.status, note: `Eşleştirildi: ${i.code || ''} → ${p2.name}`, user: me() }); db.save(); pushStock([p2.id], true); toast('Eşleştirildi, stok düşüldü', 'ok'); btn.parentElement.outerHTML = `<div class="mt">${badge('Eşleştirildi: ' + p2.name, 'ok')}</div>`; app.refresh();
      }),
      actions: [
        { label: 'Etiket', icon: 'print', onClick: async () => { if (await ensureTracking([o])) printLabels([o]); } },
        ...((!o.invoice || o.invoiceTest) && o.status !== 'iptal' ? [{ label: o.invoiceTest ? 'Faturayı yeniden kes' : 'Fatura kes', icon: 'file', onClick: async (c) => { const ok = await invoice(o); db.save(); c(); app.refresh(); if (ok && !o.invoiceTest) toast('Fatura kesildi', 'ok'); } }] : []),
        ...(['yeni', 'toplaniyor'].includes(o.status) && canOps() ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { if (!(await confirm(`Sipariş iptal edilsin ve stok geri alınsın mı?${isLive(o.ch) ? ` ${CH[o.ch].name} panelinden de iptal etmeniz gerekir; buradan bildirilmez.` : ''}`))) return; setSt(o, 'iptal', 'Satıcı iptal etti (stok yok / tedarik sorunu)'); const ids = giveBack(o); db.save(); await pushStock(ids, true); c(); app.refresh(); } }] : []),
        ...(['yeni', 'toplaniyor'].includes(o.status) && !o.items.some((i) => !i.pid) ? [{ label: 'Paketlemeye git', cls: 'primary', icon: 'barcode', onClick: (c) => { c(); app.go('paketleme', o.chNo); } }] : []),
        ...(o.status === 'paketlendi' ? [{ label: 'Kargoya verildi', cls: 'primary', icon: 'truck', onClick: async (c) => { await ship([o]); c(); app.refresh(); } }] : []),
      ],
    });
  }
  // Kargoya teslim: canlı kanallara kargo bildirimi gider
  async function ship(list) {
    if (!(await ensureTracking(list))) return toast('Takip numarası girilmeyen sipariş kargoya verilmedi', 'err');
    let n = 0;
    for (const o of list) {
      if (!o.tracking) continue;
      if (isLive(o.ch) && o.ch === 'trendyol' && o.pkgNo) { const r = await live(o.ch, 'kargo-bildir', { packageId: o.pkgNo, status: 'Invoiced', invoiceNo: o.invoiceTest ? '' : o.invoice, lines: o.items.map((i) => ({ lineId: i.lineId, qty: i.qty })) }); if (!r.ok) { toast(`${o.chNo}: ${r.error}`, 'err'); continue; } }
      setSt(o, 'kargoda', `${o.carrier} · ${o.tracking}`); n++;
    }
    // Bildirim gitmeyen kanal açıkça yazılır: yalnızca canlı Trendyol paket durumu bildirilir
    const noMsg = [...new Set(list.filter((o) => !(isLive(o.ch) && o.ch === 'trendyol' && o.pkgNo)).map((o) => CH[o.ch].name))];
    db.save(); toast(`${n} sipariş kargoya verildi olarak işaretlendi${noMsg.length ? ` · ${noMsg.join(', ')}: pazaryerine bildirilmedi, panelden girin` : ''}`, noMsg.length ? 'warn' : 'ok');
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const all = db.all('orders'); const t = today();
    const tod = all.filter((o) => iso(o.at) === t && sale(o));
    const open = all.filter((o) => OPEN.includes(o.status));
    const late = open.filter((o) => new Date(o.shipBy) < new Date(Date.now() + 6 * 3600e3));
    const qs = db.all('questions', (q) => !q.answer); const rets = db.all('returns', (r) => ['talep', 'yolda', 'geldi'].includes(r.status));
    const low = db.all('products', lowOf);
    const m30 = all.filter((o) => o.at > addDays(new Date(), -30).toISOString() && sale(o));
    const ser = NS.dailySeries(all.filter(sale), 14, 'at', (o) => o.total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()) + ` · ${connected().length} pazaryeri bağlı`, `<button class="btn" id="pull">${icon('refresh')} Siparişleri çek</button><a class="btn primary" href="#/paketleme">${icon('barcode')} Paketleme</a>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü sipariş', tod.length, 'cart', '', `<div class="small faint">${money(sum(tod, (o) => o.total))}</div>`)}${kpi('Kargoya verilecek', open.length, 'box', 'info', `<div class="small faint">${open.filter((o) => o.status === 'paketlendi').length} paket hazır</div>`)}${kpi('Gecikme riski', late.length, 'alert', late.length ? 'err' : 'ok', '<div class="small faint">6 saatten az kalan</div>')}${isAdm() ? kpi('30 gün net kâr', money(sum(m30, (o) => profit(o).kar)), 'trend', 'ok', `<div class="small faint">${money(sum(m30, (o) => o.total))} ciro</div>`) : kpi('30 gün sipariş', m30.length, 'trend', 'ok')}</div>
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
    $('#pull', el).onclick = async (e) => { e.target.disabled = true; const r = await pullOrders(); toast(pullMsg(r), r.err ? 'err' : r.sim && !r.count ? 'warn' : 'ok'); app.refresh(); };
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
    const narrow = () => window.matchMedia('(max-width: 700px)').matches;
    const draw = () => {
      const r = rows();
      if (narrow()) {
        F.forEach(([v]) => { const s = $(`[data-n="${v}"]`, el); if (s) s.textContent = ''; });
        $('#t', el).innerHTML = r.length ? `<div class="card-b">${r.slice(0, 300).map((o) => `<div class="list-item" style="align-items:flex-start"><input type="checkbox" data-sel="${o.id}" ${sel.has(o.id) ? 'checked' : ''} aria-label="Seç" style="margin-top:4px"><div class="grow" data-act="v" data-id="${o.id}" style="cursor:pointer">${chB(o.ch)} <span class="mono small">${esc(o.chNo)}</span>${unB(o)}<div class="small">${esc(o.customer.name)} · ${esc(o.customer.city || '')}</div><div class="small faint">${o.items.map((i) => `${i.qty}× ${esc(i.name.slice(0, 30))}`).join(', ')}</div><div class="mt">${stB(o.status)} ${sla(o)} ${invB(o)}</div></div><b>${money(o.total)}</b></div>`).join('')}</div><div class="card-b small faint">${r.length} sipariş · ${money(sum(r, (o) => o.total))}</div>` : `<div class="empty">${icon('cart')}<div>Sipariş yok</div></div>`;
        if (!sel.size) $('#sa', el).checked = false; $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} sipariş seçildi`; return;
      }
      F.forEach(([v]) => { const n = db.all('orders', (o) => (v === 'all' || (v === 'acik' ? OPEN.includes(o.status) : o.status === v)) && (!chf || o.ch === chf)).length; const s = $(`[data-n="${v}"]`, el); if (s) s.textContent = ['acik', 'yeni', 'toplaniyor', 'paketlendi'].includes(v) && n ? n : ''; });
      $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'cart', columns: [
        { label: '', render: (o) => `<input type="checkbox" data-sel="${o.id}" ${sel.has(o.id) ? 'checked' : ''} aria-label="Seç">` },
        { label: 'Sipariş', render: (o) => `${chB(o.ch)}${unB(o)}<div class="mono small mt">${esc(o.chNo)}</div><div class="small faint">${NS.dt(o.at)}</div>` },
        { label: 'Alıcı', render: (o) => `${esc(o.customer.name)}<div class="small faint">${esc(o.customer.city || '')}</div>` },
        { label: 'Ürünler', render: (o) => o.items.map((i) => `<div class="small">${i.qty}× ${esc(i.name.slice(0, 40))}</div>`).join('') },
        { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>${isAdm() ? `<div class="small" style="color:var(--${profit(o).kar >= 0 ? 'ok' : 'err'})">kâr ${money(profit(o).kar)}</div>` : ''}` },
        { label: 'Durum', render: (o) => `${stB(o.status)}<div class="mt">${sla(o)}</div>` },
        { label: 'Fatura', render: (o) => (o.invoice ? (o.invoiceTest ? badge('TEST', 'warn') : badge('Kesildi', 'ok')) : o.status === 'iptal' ? '' : badge('Yok', '')) },
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
      if (a === 'pick') { const ok = list.filter((o) => ['yeni', 'toplaniyor'].includes(o.status) && !o.items.some((i) => !i.pid)); if (!ok.length) return toast('Seçilenlerde toplanacak sipariş yok (eşleşmeyen ürünlü sipariş alınmaz)', 'err'); const pl = makePick(ok); printPick(pl); }
      if (a === 'label') { const go = list.filter((o) => !['iptal', 'iade'].includes(o.status)); if (!(await ensureTracking(go))) return; printLabels(go.filter((o) => o.tracking)); }
      if (a === 'inv') { let n = 0, t = 0; for (const o of list) if ((!o.invoice || o.invoiceTest) && o.status !== 'iptal') { if (await invoice(o)) { o.invoiceTest ? t++ : n++; } } db.save(); toast([n ? `${n} fatura kesildi` : '', t ? `${t} fatura TEST (gönderilmedi)` : ''].filter(Boolean).join(' · ') || 'Fatura kesilmedi', n ? 'ok' : 'warn'); }
      if (a === 'ship') { const ok = list.filter((o) => o.status === 'paketlendi'); if (!ok.length) return toast('Yalnız paketlenmiş siparişler kargoya verilebilir', 'err'); await ship(ok); }
      sel.clear(); draw();
    });
    $('#pull', el).onclick = async () => { const r = await pullOrders(); toast(pullMsg(r), r.err ? 'err' : r.sim && !r.count ? 'warn' : 'ok'); draw(); };
    $('#ex', el).onclick = () => NS.csv('siparisler', rows(), [{ label: 'Kanal', value: (o) => CH[o.ch].name }, { key: 'chNo', label: 'Sipariş no' }, { label: 'Tarih', value: (o) => NS.dt(o.at) }, { label: 'Alıcı', value: (o) => o.customer.name }, { label: 'Şehir', value: (o) => o.customer.city }, { label: 'Ürünler', value: (o) => o.items.map((i) => `${i.qty}x ${i.sku}`).join(' ') }, { key: 'total', label: 'Tutar' }, ...(isAdm() ? [{ label: 'Net kâr', value: (o) => profit(o).kar }] : []), { label: 'Durum', value: (o) => Z.ST[o.status][0] }, { key: 'tracking', label: 'Kargo takip' }, { key: 'invoice', label: 'Fatura' }]);
    draw();
  }

  // ---------- Toplama listesi ----------
  function makePick(list) {
    const pl = db.insert('picklists', { no: 'TL' + String(db.all('picklists').length + 1001), at: new Date().toISOString(), orders: list.map((o) => o.id), user: me() });
    list.forEach((o) => { if (o.status === 'yeni') setSt(o, 'toplaniyor', `Toplama listesi ${pl.no}`); });
    db.save(); toast(`${pl.no}: ${list.length} sipariş toplama listesine alındı`, 'ok'); return pl;
  }
  function pickPage(el, p, app) {
    const waiting = db.all('orders', (o) => o.status === 'yeni' && !o.items.some((i) => !i.pid)).sort((a, b) => a.shipBy.localeCompare(b.shipBy));
    const lines = Object.values(waiting.flatMap((o) => o.items).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { id: k, ...i, qty: 0, n: 0, p: prod(i.pid) }; m[k].qty += i.qty; m[k].n++; return m; }, {})).sort((a, b) => ((a.p || {}).loc || '').localeCompare((b.p || {}).loc || ''));
    el.innerHTML = pageHead('Toplama Listesi', 'Bekleyen siparişlerin ürünleri raf sırasına göre — depoda tek turda toplayın', `<button class="btn primary" id="mk" ${waiting.length ? '' : 'disabled'}>${icon('print')} ${waiting.length} siparişten liste oluştur</button>`) + `
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Toplanacak ürünler</h3><span class="small muted">${sum(lines, (l) => l.qty)} adet · ${lines.length} çeşit</span></div>${table({ rows: lines, empty: 'Toplanacak sipariş yok', emptyIcon: 'check', columns: [{ label: 'Raf', render: (l) => `<b class="mono">${esc((l.p || {}).loc || '-')}</b>` }, { label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint mono">${esc(l.barcode || l.sku)}</div>` }, { label: 'Adet', cls: 'right', render: (l) => `<b style="font-size:18px">${l.qty}</b>` }, { label: 'Sipariş', cls: 'right', key: 'n' }, { label: 'Stok', cls: 'right', render: (l) => (l.p && l.p.stock < 0 ? badge('Eksik', 'err') : (l.p || {}).stock ?? '-') }] })}</div>
      <div class="card"><div class="card-h"><h3>Önceki listeler</h3></div>${table({ rows: db.all('picklists').slice().reverse().slice(0, 12), empty: 'Henüz liste yok', columns: [{ label: 'Liste', render: (l) => `<b>${esc(l.no)}</b><div class="small faint">${NS.dt(l.at)} · ${esc(l.user || '')}</div>` }, { label: 'Sipariş', cls: 'right', render: (l) => l.orders.length }, { label: 'Kalan', cls: 'right', render: (l) => { const n = l.orders.filter((id) => ['yeni', 'toplaniyor'].includes((db.get('orders', id) || {}).status)).length; return n ? badge(n, 'warn') : badge('Bitti', 'ok'); } }], actions: [{ icon: 'print', act: 'pr' }] })}</div></div>`;
    on(el, 'click', '[data-act=pr]', (e, b) => printPick(db.get('picklists', b.dataset.id)));
    $('#mk', el).onclick = () => { const pl = makePick(waiting); printPick(pl); app.refresh(); };
  }

  // ---------- Paketleme istasyonu (barkodla doğrulama) ----------
  function packPage(el, p, app) {
    let cur = null; let cnt = {}; let manual = false;
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
      $('#man', el).onclick = async () => { if (cur.items.some((i) => !i.pid)) return toast('Eşleşmeyen ürün var; önce sipariş detayından eşleştirin', 'err'); if (await confirm('Barkod okutmadan tüm ürünler doğrulanmış sayılsın mı?')) { cnt = need(); manual = true; draw(); } };
      $('#fin', el).onclick = finish;
    };
    async function finish() {
      const o = cur; if (S().autoInvoice !== false) await invoice(o);
      setSt(o, 'paketlendi', `${manual ? 'Elle onaylandı (barkod okutulmadı)' : 'Barkodla doğrulandı'}${o.invoice ? ', fatura ' + o.invoice + (o.invoiceTest ? ' (TEST)' : '') : ''}`); db.save(); if (await ensureTracking([o])) printLabels([o]);
      NS.beep(1200, 90); toast(`${o.chNo} paketlendi`, 'ok'); cur = null; manual = false; draw(); side(); inp.focus();
    }
    const open = (o) => { if (!['yeni', 'toplaniyor', 'paketlendi'].includes(o.status)) { NS.beep(220, 200); return toast(`${o.chNo} durumu: ${Z.ST[o.status][0]}`, 'err'); } if (o.items.some((i) => !i.pid)) { NS.beep(220, 200); return toast(`${o.chNo}: eşleşmeyen ürün var, önce sipariş detayından eşleştirin`, 'err'); } cur = o; cnt = {}; manual = false; draw(); };
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
    const adm = isAdm(); const rate = salesRate();
    // Kaç günde biter: son 30 günün satış hızı ile mevcut stok
    const daysLeft = (x) => { const r = (rate[x.id] || 0) / 30; return r > 0 ? Math.round(Math.max(0, x.stock) / r) : null; };
    const dayB = (x) => { const d = daysLeft(x); return d === null ? '<span class="faint">-</span>' : d <= 14 ? badge(`${d} gün`, d <= 7 ? 'err' : 'warn') : `${d} gün`; };
    el.innerHTML = pageHead('Ürünler & Stok', 'Stok tek yerde tutulur; her değişiklik bağlı tüm pazaryerlerine gönderilir', `<button class="btn" id="sync">${icon('refresh')} Tüm kanallara stok gönder</button>${adm ? `<button class="btn" id="imp">${icon('upload')} Excel'den al</button>` : ''}<button class="btn primary" id="add">${icon('plus')} Ürün</button>`) + `
      <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Ürün, barkod, stok kodu, raf...')}<div class="seg">${[['', 'Tümü'], ['kritik', 'Kritik stok'], ['hata', 'Hatalı listeleme'], ['eksik', 'Eksik kanal'], ['grup', 'Model grupları']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const LS = { yayinda: ['ok', 'Yayında'], stoksuz: ['warn', 'Stok yok'], hata: ['err', 'Hatalı'] };
    const dot = (p2, k) => { const s = (p2.listings || {})[k]; return s ? `<span title="${CH[k].name}: ${LS[s][1]}" class="badge ${LS[s][0]}" style="min-width:34px;justify-content:center">${CH[k].short}</span>` : `<span title="${CH[k].name}: listelenmedi" class="badge" style="opacity:.35;min-width:34px;justify-content:center">${CH[k].short}</span>`; };
    const rows = () => db.all('products', (x) => NS.match(q, x.name, x.barcode, x.sku, x.loc, x.group) && (!f || f === 'grup' || (f === 'kritik' ? lowOf(x) : f === 'hata' ? Object.values(x.listings || {}).includes('hata') : ks.some((k) => !(x.listings || {})[k]))));
    // Model grubu: aynı modelin renk/beden kayıtları (ürün = tek barkod kalır, stok her varyantta ayrı tutulur)
    const groups = () => Object.entries(NS.groupBy(rows().filter((x) => x.group), (x) => x.group)).filter(([, v]) => v.length > 1).map(([g, v]) => ({ id: g, g, v })).sort((a, b) => a.g.localeCompare(b.g, 'tr'));
    const drawG = () => { const r = groups(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'box', empty: 'Birden çok varyantlı model yok. Ürün kartında "Model grubu" alanını doldurun.', columns: [{ label: 'Model', render: (x) => `<b>${esc(x.g)}</b><div class="small faint">${x.v.map((p2) => esc(p2.color || p2.sku)).join(' · ')}</div>` }, { label: 'Varyant', cls: 'right', render: (x) => x.v.length }, { label: 'Stok', cls: 'right', render: (x) => sum(x.v, (p2) => p2.stock) }, { label: 'Kritik', cls: 'right', render: (x) => { const n = x.v.filter(lowOf).length; return n ? badge(n, 'warn') : '-'; } }, { label: 'Fiyat', cls: 'right', render: (x) => { const a = x.v.map((p2) => Number(p2.price) || 0); const mn = Math.min(...a), mx = Math.max(...a); return mn === mx ? money(mn) : `${money(mn)} – ${money(mx)}`; } }], actions: adm ? [{ label: 'Fiyat', act: 'gp' }] : [] }); };
    const draw = () => { if (f === 'grup') return drawG(); const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'box', columns: [
      { label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint mono">${esc(x.barcode)} · ${esc(x.sku)}</div>` },
      { label: 'Raf', render: (x) => `<span class="mono">${esc(x.loc || '-')}</span>` },
      { label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= 0 ? 'err' : lowOf(x) ? 'warn' : 'text'})">${x.stock}</b>` },
      { label: 'Kaç günde biter', cls: 'right', render: dayB },
      { label: adm ? 'Maliyet / Fiyat' : 'Fiyat', cls: 'right', render: (x) => (adm ? `${money(x.cost)}<div class="small faint">${money(x.price)}</div>` : money(x.price)) },
      { label: 'Kanallar', render: (x) => `<div class="row" style="gap:4px;flex-wrap:wrap">${ks.map((k) => dot(x, k)).join('')}</div>` },
    ], actions: [{ icon: 'plus', act: 'st', title: 'Stok gir / düş' }, { icon: 'edit', act: 'ed' }, ...(adm ? [{ icon: 'trash', act: 'del' }] : [])], foot: `${r.length} ürün · ${sum(r, (x) => x.stock)} adet${adm ? ` · stok değeri ${money(sum(r, (x) => x.stock * x.cost))}` : ''}${r.length > 300 ? ' · ilk 300 gösteriliyor, aramayı daraltın' : ''}` }); };
    const edit = async (x) => {
      const v = await formModal({ title: x ? x.name : 'Yeni ürün', size: 'wide', fields: [{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'barcode', label: 'Barkod', required: true }, { name: 'sku', label: 'Stok kodu', required: true }, { name: 'cat', label: 'Kategori' }, { name: 'loc', label: 'Raf / lokasyon', placeholder: 'A-01-1' }, { name: 'group', label: 'Model grubu', hint: 'Aynı modelin renk/bedenlerini birleştirir' }, { name: 'color', label: 'Renk / beden' }, ...(adm ? [{ name: 'cost', label: 'Maliyet (₺)', type: 'number', step: '0.01' }] : []), { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'low', label: 'Kritik stok', type: 'number', hint: 'Boşsa genel ayar' }, { name: 'desi', label: 'Desi', type: 'number' }, { name: 'vat', label: 'KDV %', type: 'number' }, { type: 'section', label: 'Listelendiği kanallar' }, ...ks.map((k) => ({ name: 'ls_' + k, label: CH[k].name, type: 'checkbox' }))], values: { vat: 20, desi: 1, ...(x || {}), ...Object.fromEntries(ks.map((k) => ['ls_' + k, !!((x || {}).listings || {})[k]])) } });
      if (!v) return;
      // Barkod ve stok kodu benzersiz olmalı (sipariş yanlış ürüne düşmesin)
      for (const k of ['barcode', 'sku']) { const c = String(v[k] || '').trim(); const other = c && db.find('products', (y) => (!x || y.id !== x.id) && (y.barcode === c || y.sku === c || (y.aliases || []).includes(c))); if (other) return toast(`${c} kodu "${other.name}" ürününde kullanılıyor`, 'err'); }
      const ls = { ...((x || {}).listings || {}) }; ks.forEach((k) => { if (v['ls_' + k] && !ls[k]) ls[k] = 'yayinda'; if (!v['ls_' + k]) delete ls[k]; delete v['ls_' + k]; });
      v.listings = ls; const rec = x ? db.update('products', x.id, v) : db.insert('products', { ...v, chPrice: {} });
      db.save(); const r = await pushStock([rec.id || x.id], true); toast(`Kaydedildi · ${r.msg}`, r.errs.length ? 'err' : r.sim ? 'warn' : 'ok'); draw();
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(db.get('products', b.dataset.id)));
    on(el, 'click', '[data-act=st]', async (e, b) => {
      const x = db.get('products', b.dataset.id);
      const v = await formModal({ title: `Stok hareketi — ${x.name}`, fields: [{ name: 'type', label: 'İşlem', type: 'select', options: [{ value: 'in', label: 'Giriş (mal kabul)' }, { value: 'out', label: 'Çıkış (fire / hasar)' }, { value: 'set', label: 'Sayım (stoğu eşitle)' }] }, { name: 'qty', label: 'Adet', type: 'number', required: true }, { name: 'note', label: 'Açıklama' }], values: { type: 'in' } });
      if (!v) return; const n = Number(v.qty); if (!Number.isInteger(n) || n < 0 || (v.type !== 'set' && n === 0)) return toast('Geçerli bir adet girin', 'err'); if (v.type === 'out' && n > x.stock) return toast(`Stok ${x.stock}; bundan fazla düşülemez`, 'err'); x.stock = v.type === 'in' ? x.stock + n : v.type === 'out' ? x.stock - n : n;
      db.log('Stok', `${x.sku} → ${x.stock} (${v.note || v.type})`); db.save(); const r = await pushStock([x.id], true); toast(`Yeni stok ${x.stock} · ${r.msg}`, r.errs.length ? 'err' : r.sim ? 'warn' : 'ok'); draw();
    });
    on(el, 'click', '[data-act=del]', async (e, b) => { const x = db.get('products', b.dataset.id); if (db.find('orders', (o) => o.items.some((i) => i.pid === x.id))) return toast('Bu ürünün siparişi var, silinemez', 'err'); if (await confirm(`${x.name} silinsin mi?`)) { db.remove('products', x.id); draw(); } });
    on(el, 'click', '[data-act=gp]', async (e, b) => { const g = groups().find((x) => x.id === b.dataset.id); if (!g) return; const v = await formModal({ title: `${g.g} — tüm varyantlara fiyat`, fields: [{ name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01', required: true }], values: { price: g.v[0].price } }); if (!v) return; const pr = Number(v.price); if (!(pr > 0)) return toast('Geçerli fiyat girin', 'err'); g.v.forEach((p2) => { p2.price = pr; }); db.log('Fiyat', `${g.g}: ${g.v.length} varyant ${money(pr)}`); db.save(); toast(`${g.v.length} varyantın fiyatı güncellendi`, 'ok'); draw(); });
    if ($('#imp', el)) $('#imp', el).onclick = () => importProducts(app);
    $('#add', el).onclick = () => edit(null);
    $('#sync', el).onclick = async (e) => { e.target.disabled = true; await pushStock(null); e.target.disabled = false; draw(); };
    draw();
  }

  // ---------- İadeler ----------
  function returnsPage(el, p, app) {
    let f = 'acik';
    el.innerHTML = pageHead('İadeler', 'Pazaryeri iade talepleri — depoya gelince kontrol edin; sağlam ürün stoğa döner', isLive('trendyol') ? `<button class="btn" id="cl">${icon('download')} Trendyol iadelerini çek</button>` : '') + `
      <div class="card"><div class="card-h"><div class="seg">${[['acik', 'İşlem bekleyen'], ['onay', 'Onaylanan'], ['red', 'Reddedilen'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div><span class="grow"></span><input class="input" id="sc" placeholder="İade kargo barkodu / sipariş no okutun" style="max-width:300px"></div><div id="t"></div></div>`;
    const rows = () => db.all('returns', (r) => f === 'all' || (f === 'acik' ? ['talep', 'yolda', 'geldi'].includes(r.status) : r.status === f)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { $('#t', el).innerHTML = table({ rows: rows(), emptyIcon: 'refresh', empty: 'İade yok', columns: [
      { label: 'İade', render: (r) => `${chB(r.ch)}<div class="mono small mt">${esc(r.no)}</div><div class="small faint">${NS.dt(r.at)}</div>` },
      { label: 'Sipariş', render: (r) => { const o = db.get('orders', r.oid) || { customer: {} }; return `<span class="mono small">${esc(o.chNo || '-')}</span><div class="small">${esc(o.customer.name || '')}</div>`; } },
      { label: 'Ürün', render: (r) => r.items.map((i) => `<div class="small">${i.qty}× ${esc(i.name)}</div>`).join('') },
      { label: 'Neden', render: (r) => esc(r.reason) },
      { label: 'Durum', render: (r) => badge(Z.RST[r.status][0], Z.RST[r.status][1]) + (r.condition ? `<div class="small mt">${r.condition === 'saglam' ? 'Sağlam → stoğa' : 'Hasarlı → fire'}</div>` : '') },
    ], actions: [{ icon: 'check', act: 'ok', title: 'Kontrol et / sonuçlandır', show: (r) => canOps() && ['talep', 'yolda', 'geldi'].includes(r.status) }, { label: 'İade faturası', act: 'rinv', show: (r) => { const o = isAdm() && r.status === 'onay' && db.get('orders', r.oid); return !!(o && o.invoice && !o.invoiceTest && (!r.invoice || r.invoiceTest)); } }], foot: `Son 30 gün iade oranı: %${rate()}` }); };
    const rate = () => { const os = db.all('orders', (o) => o.at > addDays(new Date(), -30).toISOString()); return os.length ? ((db.all('returns', (r) => r.at > addDays(new Date(), -30).toISOString()).length / os.length) * 100).toFixed(1) : 0; };
    const decide = async (r) => {
      const v = await formModal({ title: `İade kontrolü — ${r.no}`, fields: [{ name: 'condition', label: 'Ürün durumu', type: 'select', options: [{ value: 'saglam', label: 'Sağlam — stoğa geri al ve onayla' }, { value: 'hasarli', label: 'Hasarlı / kullanılmış — reddet (itirazı pazaryeri panelinden açın)' }] }, { name: 'note', label: 'Not (itirazda kullanmak için)', type: 'textarea', full: true }], values: { condition: 'saglam' } });
      if (!v) return; r.condition = v.condition; r.note = v.note;
      if (v.condition === 'saglam') { r.status = 'onay'; r.items.forEach((i) => { const x = prod(i.pid); if (x) x.stock += i.qty; }); await pushStock(r.items.map((i) => i.pid).filter(Boolean), true); toast('İade onaylandı, ürün stoğa eklendi', 'ok'); }
      else { r.status = 'red'; toast(`İade reddedildi olarak kaydedildi. İtirazı ${CH[r.ch].name} satıcı panelinden açın; buradan pazaryerine gönderilmedi.`, 'warn'); }
      // Sipariş iade durumundan ancak ret kararıyla çıkar: reddedilen iade ciro ve kârda satış olarak kalır
      const o = db.get('orders', r.oid); if (o) { if (r.status === 'red' && o.status === 'iade') setSt(o, 'teslim', `İade ${r.no} reddedildi`); else if (r.status === 'onay' && o.status !== 'iade') setSt(o, 'iade', `İade ${r.no} onaylandı`); }
      log(r.ch, 'İade', `${r.no} ${r.status === 'onay' ? 'onaylandı' : 'reddedildi'}`); db.save(); draw();
    };
    on(el, 'click', '[data-act=rinv]', async (e, b) => { const r = db.get('returns', b.dataset.id); if (await refundInvoice(r, db.get('orders', r.oid))) draw(); });
    if ($('#cl', el)) $('#cl', el).onclick = async () => { const n = await pullClaims(); toast(n.err || `${n.count} yeni iade talebi${n.miss ? ` · ${n.miss} talebin siparişi burada yok` : ''}`, n.err ? 'err' : n.count ? 'ok' : ''); draw(); };
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
      if (v.answer.trim().length < 10 || v.answer.length > 2000) return toast('Yanıt 10–2000 karakter olmalı', 'err');
      if (!(isLive(q.ch) && q.extId)) return toast(`TEST: ${CH[q.ch].name} canlı bağlı değil, yanıt pazaryerine gönderilmedi`, 'warn');
      const r = await live(q.ch, 'soru-yanitla', { question: q.extId, answer: v.answer }); if (!r.ok) return toast(r.error, 'err');
      q.answer = v.answer; q.answeredAt = new Date().toISOString(); log(q.ch, 'Soru yanıtı', q.text.slice(0, 40)); db.save(); toast('Yanıt pazaryerine gönderildi', 'ok'); draw();
    });
    $('#pull', el).onclick = async () => {
      let n = 0;
      for (const k of connected().filter(isLive)) { const r = await live(k, 'soru-cek'); if (!r.ok) { toast(`${CH[k].name}: ${r.error}`, 'err'); continue; } ((r.data && r.data.questions) || []).forEach((x) => { if (db.find('questions', (y) => y.extId === x.id)) return; const pr2 = byCode(x.barcode); db.insert('questions', { ch: k, extId: x.id, pid: pr2 && pr2.id, text: x.text, customer: x.customer || 'Müşteri', at: x.at || new Date().toISOString(), answer: '' }); n++; }); }
      db.save(); toast(n ? `${n} yeni soru` : 'Yeni soru yok (TEST kanallar simülasyondur)', n ? 'ok' : ''); draw();
    };
    draw();
  }

  // ---------- Hakediş & kâr ----------
  function payoutPage(el) {
    const ds = db.all('orders', (o) => o.at > addDays(new Date(), -45).toISOString() && !['iptal'].includes(o.status));
    const due = (o) => { const base = o.deliveredAt || (o.status === 'kargoda' ? addDays(new Date(), 2).toISOString() : null); return base ? iso(addDays(new Date(base), Number(chCfg(o.ch).payoutDays) || 7)) : null; };
    const rows = connected().map((k) => { const os = ds.filter((o) => o.ch === k && o.status !== 'iade'); const pr = os.map(profit); const paid = os.filter((o) => due(o) && due(o) <= today()); const wait = os.filter((o) => !due(o) || due(o) > today()); return { id: k, k, n: os.length, gross: sum(pr, (x) => x.gross), com: sum(pr, (x) => x.com + x.fee), ship: sum(pr, (x) => x.ship), net: sum(pr, (x) => x.net), kar: sum(pr, (x) => x.kar), paid: sum(paid, (o) => profit(o).net), wait: sum(wait, (o) => profit(o).net) }; });
    const cal = Object.entries(NS.groupBy(ds.filter((o) => due(o) && due(o) > today()), due)).sort(([a], [b]) => a.localeCompare(b)).slice(0, 10);
    el.innerHTML = pageHead('Hakediş & Kâr', 'Son 45 gün · komisyon, hizmet bedeli, kargo ve ürün maliyeti düşülmüş kâr (kanal ayarındaki oranlarla tahmin)') + `
      <div class="grid g4 mb">${kpi('Satış', money(sum(rows, (r) => r.gross)), 'cart')}${kpi('Pazaryeri kesintisi (tahmini)', money(sum(rows, (r) => r.com + r.ship)), 'percent', 'warn')}${kpi('Beklenen ödeme (tahmini)', money(sum(rows, (r) => r.wait)), 'clock', 'info', '<div class="small faint">Kesin tutar pazaryerinin hakediş ekranındadır</div>')}${kpi('Net kâr', money(sum(rows, (r) => r.kar)), 'trend', 'ok')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Kanal bazında</h3></div>${table({ rows, columns: [{ label: 'Kanal', render: (r) => chB(r.k) }, { label: 'Sipariş', cls: 'right', key: 'n' }, { label: 'Satış', cls: 'right', render: (r) => money(r.gross) }, { label: 'Komisyon+bedel', cls: 'right', render: (r) => money(r.com) }, { label: 'Kargo', cls: 'right', render: (r) => money(r.ship) }, { label: 'Hakediş', cls: 'right', render: (r) => `<b>${money(r.net)}</b>` }, { label: 'Net kâr', cls: 'right', render: (r) => `<b style="color:var(--${r.kar >= 0 ? 'ok' : 'err'})">${money(r.kar)}</b><div class="small faint">%${r.gross ? ((r.kar / r.gross) * 100).toFixed(1) : 0}</div>` }] })}</div>
      <div class="card"><div class="card-h"><h3>Tahmini ödeme takvimi</h3></div>${table({ rows: cal.map(([d, os]) => ({ id: d, d, os })), empty: 'Bekleyen ödeme yok', columns: [{ label: 'Tarih', render: (r) => `<b>${NS.date(r.d)}</b>` }, { label: 'Kanallar', render: (r) => `<div class="row" style="gap:4px;flex-wrap:wrap">${[...new Set(r.os.map((o) => o.ch))].map((k) => `<span class="badge" title="${CH[k].name}" style="background:${CH[k].color};color:#fff;border:0">${CH[k].short}</span>`).join('')}</div>` }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(sum(r.os, (o) => profit(o).net))}</b>` }] })}</div></div>
      <div class="card mt"><div class="card-h"><h3>${icon('alert')} Zarar eden siparişler</h3><span class="small muted">Komisyon ve kargo sonrası eksiye düşenler — fiyatı gözden geçirin</span></div>${table({ rows: ds.filter((o) => sale(o) && profit(o).kar < 0).slice(-10).reverse(), empty: 'Zarar eden sipariş yok', columns: [{ label: 'Sipariş', render: (o) => `${chB(o.ch)} <span class="mono small">${esc(o.chNo)}</span>` }, { label: 'Ürün', render: (o) => esc(o.items[0].name) }, { label: 'Satış', cls: 'right', render: (o) => money(o.total) }, { label: 'Kâr', cls: 'right', render: (o) => `<b style="color:var(--err)">${money(profit(o).kar)}</b>` }] })}</div>`;
  }

  // ---------- Kanallar ----------
  function channelsPage(el, p, app) {
    el.innerHTML = pageHead('Pazaryeri Bağlantıları', 'API bilgilerinizi satıcı panelinizin "Entegrasyon" bölümünden alın') + `<div class="grid g3" id="g"></div><div class="card mt"><div class="card-h"><h3>Senkron günlüğü</h3></div><div id="lg"></div></div>`;
    const draw = () => {
      $('#g', el).innerHTML = Object.keys(CH).map((k) => { const c = chCfg(k); const os = db.all('orders', (o) => o.ch === k && o.at > addDays(new Date(), -30).toISOString()); return `<div class="card pad" style="border-top:4px solid ${CH[k].color}"><div class="row"><b style="font-size:18px" class="grow">${esc(CH[k].name)}</b>${c.connected ? badge(isLive(k) ? 'Canlı' : 'Demo (TEST)', isLive(k) ? 'ok' : 'warn') : badge('Bağlı değil')}${Z.UNVERIFIED[k] ? ' ' + badge('API doğrulanamadı', 'err') : ''}</div>
        <div class="small muted mt">${c.connected ? `Satıcı no: ${esc(c.sellerId || '-')} · komisyon %${c.commission} · ödeme ${c.payoutDays} gün` : 'Bağlanınca siparişler, stok ve sorular otomatik akar.'}</div>${c.connected ? `<div class="mt"><b>${os.length}</b> <span class="small muted">sipariş / 30 gün · ${money(sum(os, (o) => o.total))}</span></div>` : ''}
        <div class="row mt"><button class="btn sm ${c.connected ? '' : 'primary'}" data-cfg="${k}">${icon(c.connected ? 'settings' : 'link')} ${c.connected ? 'Ayarlar' : 'Bağlan'}</button>${Z.UNVERIFIED[k] ? `<span class="small faint">${esc(Z.UNVERIFIED[k])}</span>` : !Z.LIVE.includes(k) ? '<span class="small faint">Doğrudan API yok; yalnızca demo</span>' : ''}</div></div>`; }).join('');
      $('#lg', el).innerHTML = table({ rows: (db.data.synclog || []).slice(0, 30), empty: 'Kayıt yok', columns: [{ label: 'Zaman', render: (l) => NS.dt(l.at) }, { label: 'Kanal', render: (l) => chB(l.ch) }, { label: 'İşlem', render: (l) => esc(l.action) }, { label: 'Sonuç', render: (l) => `${l.ok ? '' : badge('Hata', 'err')} ${esc(l.detail)}` }] });
    };
    on(el, 'click', '[data-cfg]', (e, b) => {
      const k = b.dataset.cfg; const c = chCfg(k);
      modal({ title: `${CH[k].name} bağlantısı`, size: 'wide', body: `<div class="form-grid">${NS.fieldsHtml([...(Z.LIVE.includes(k) ? [{ name: 'mode', label: 'Çalışma modu', type: 'select', options: [{ value: 'demo', label: 'Demo (pazaryerine gitmez)' }, { value: 'live', label: 'Canlı (gerçek API)' }], full: true }] : []), ...(k === 'n11' ? [] : [{ name: 'sellerId', label: k === 'hepsiburada' ? 'Merchant ID' : 'Satıcı ID', required: true }]), { name: 'apiKey', label: k === 'hepsiburada' ? 'Servis kullanıcı adı' : k === 'n11' ? 'API anahtarı (appKey)' : 'API key' }, { name: 'apiSecret', label: k === 'hepsiburada' ? 'Servis anahtarı' : k === 'n11' ? 'API şifresi (appSecret)' : 'API secret', type: 'password' }, ...(Z.LIVE.includes(k) && k !== 'n11' ? [{ name: 'stage', label: 'Test ortamı (stage)', type: 'checkbox' }] : []), { type: 'section', label: 'Sözleşme ve kurallar' }, { name: 'commission', label: 'Komisyon %', type: 'number', step: '0.01' }, { name: 'fixedFee', label: 'Sipariş başı hizmet bedeli (₺)', type: 'number', step: '0.01' }, { name: 'payoutDays', label: 'Teslimden sonra ödeme (gün)', type: 'number' }, { name: 'shipDays', label: 'Kargoya verme süresi (gün)', type: 'number' }, { name: 'buffer', label: 'Stok tamponu (adet)', type: 'number', hint: 'Aynı ürün iki kanalda birden satılmasın diye düşülür' }], { mode: 'demo', ...c })}</div>`,
        actions: [...(c.connected ? [{ label: 'Bağlantıyı kes', cls: 'danger', onClick: async (close) => { if (!(await confirm(`${CH[k].name} bağlantısı kesilsin mi?`))) return; db.data.channels[k] = { ...db.data.channels[k], connected: false }; log(k, 'Bağlantı', 'Kesildi'); db.save(); close(); draw(); } }] : []),
          { label: 'Kaydet ve test et', cls: 'primary', onClick: async (close, b2) => {
            if (!NS.validate(b2)) return; const v = NS.readForm(b2);
            if (v.mode === 'live') { if (!v.apiKey || !v.apiSecret) return toast('Canlı mod için API bilgileri gerekli', 'err'); toast('Bağlantı test ediliyor…'); const r = await live(k, 'baglanti-test', {}, v); if (!r.ok) { db.save(); return toast(`Bağlantı kurulamadı: ${r.error}`, 'err'); } }
            db.data.channels[k] = { ...(db.data.channels[k] || {}), ...v, connected: true }; log(k, 'Bağlantı', v.mode === 'live' ? 'Canlı bağlantı başarılı' : 'Kaydedildi (TEST)'); db.save(); close(); toast(`${CH[k].name} kaydedildi`, 'ok'); draw();
          } }] });
    });
    draw();
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    const os = db.all('orders', (o) => o.at > addDays(new Date(), -30).toISOString() && sale(o));
    const byP = Object.values(os.flatMap((o) => o.items.map((i) => ({ ...i, o }))).reduce((m, i) => { const k = i.pid || i.sku; m[k] = m[k] || { id: k, name: i.name, qty: 0, ciro: 0, kar: 0 }; m[k].qty += i.qty; m[k].ciro += i.qty * i.price; const pr = profit(i.o); m[k].kar += pr.kar * ((i.qty * i.price) / (i.o.total || 1)); return m; }, {})).sort((a, b) => b.ciro - a.ciro);
    const rets = db.all('returns', (r) => r.at > addDays(new Date(), -30).toISOString());
    el.innerHTML = pageHead('Raporlar', 'Son 30 gün') + `<div class="grid g4 mb">${kpi('Sipariş', os.length, 'cart')}${kpi('Ciro', money(sum(os, (o) => o.total)), 'trend', 'ok')}${kpi('Ortalama sepet', money(os.length ? sum(os, (o) => o.total) / os.length : 0), 'bag', 'info')}${kpi('İade oranı', '%' + (os.length ? ((rets.length / os.length) * 100).toFixed(1) : 0), 'refresh', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kanala göre sipariş</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(os, (o) => o.ch)).map(([k, v]) => ({ label: CH[k].short, value: v.length })))}</div></div>
      <div class="card"><div class="card-h"><h3>İade nedenleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(rets, (r) => r.reason)).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="card"><div class="card-h"><h3>En çok satan ürünler</h3></div>${table({ rows: byP.slice(0, 15), columns: [{ label: 'Ürün', render: (r) => `<b>${esc(r.name)}</b>` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.ciro) }, { label: 'Kâr', cls: 'right', render: (r) => `<b style="color:var(--${r.kar >= 0 ? 'ok' : 'err'})">${money(r.kar)}</b>` }] })}</div>`;
  }

  // ---------- Fiyat kuralı: kanal fiyatı en düşük marjın altına düşmesin ----------
  function pricePage(el, p, app) {
    const ks = connected(); const m = Number(S().minMargin) || 0;
    const cur = (x, k) => Number((x.chPrice || {})[k]) || Number(x.price) || 0;
    const rows = () => db.all('products', (x) => x.cost > 0).flatMap((x) => ks.filter((k) => (x.listings || {})[k]).map((k) => ({ id: `${x.id}|${k}`, x, k, now: cur(x, k), floor: floorOf(x, k) }))).filter((r) => r.floor && r.now < r.floor).sort((a, b) => (a.now - a.floor) - (b.now - b.floor));
    const noCost = db.all('products', (x) => !x.cost).length;
    el.innerHTML = pageHead('Fiyat Kuralı', `Hedef marj %${m}: kanal fiyatı, komisyon, hizmet bedeli, ortalama kargo ve maliyetten sonra bu marjı bırakmalı`, `<button class="btn" id="all">${icon('zap')} Tümünü tabana çek</button>`) + `${m ? '' : `<div class="card pad mb small" style="border-color:var(--warn)">${icon('info')} Hedef marj girilmemiş; tablo yalnızca zarar eşiğini gösterir. <a href="#/ayarlar">Ayarlar</a></div>`}<div class="card" id="t"></div><p class="small faint mt">Taban fiyat tahminidir ve kanal ayarındaki komisyonla hesaplanır. Fiyat yalnızca canlı kanala gönderilir; demo kanalda gönderilmez. Kampanya ve kategori bazlı komisyon farkları hesaba girmez.${noCost ? ` ${noCost} ürünün maliyeti girilmediği için hesaplanmadı.` : ''}</p>`;
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'check', empty: 'Tüm kanal fiyatları tabanın üstünde', columns: [{ label: 'Ürün', render: (x) => `<b>${esc(x.x.name)}</b><div class="small faint mono">${esc(x.x.barcode)}</div>` }, { label: 'Kanal', render: (x) => chB(x.k) }, { label: 'Fiyat', cls: 'right', render: (x) => money(x.now) }, { label: 'Taban', cls: 'right', render: (x) => `<b>${money(x.floor)}</b>` }, { label: 'Fark', cls: 'right', render: (x) => `<b style="color:var(--err)">${money(x.now - x.floor)}</b>` }], actions: [{ label: 'Tabana çek', act: 'fx' }], foot: `${r.length} kanal fiyatı tabanın altında` }); };
    const apply = async (list) => { list.forEach((r) => { r.x.chPrice = { ...(r.x.chPrice || {}), [r.k]: r.floor }; }); db.log('Fiyat kuralı', `${list.length} kanal fiyatı tabana çekildi`); db.save(); const res = await pushStock([...new Set(list.map((r) => r.x.id))], true); toast(`${list.length} kanal fiyatı güncellendi · ${res.msg}`, res.errs.length ? 'err' : res.sim ? 'warn' : 'ok'); draw(); };
    on(el, 'click', '[data-act=fx]', (e, b) => { const r = rows().find((x) => x.id === b.dataset.id); if (r) apply([r]); });
    $('#all', el).onclick = async () => { const r = rows(); if (!r.length) return toast('Tabanın altında fiyat yok'); if (await confirm(`${r.length} kanal fiyatı tabana çekilsin mi?`)) apply(r); };
    draw();
  }
  // Excel/CSV: barkod veya stok koduyla var olan ürün güncellenir; yeni kod için ad ve fiyat gerekir. Önce özet gösterilir.
  async function importProducts(app) {
    let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada satır yok', 'err');
    const nrm = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, ''); const numOf = (v) => { if (typeof v === 'number') return v; const t = String(v == null ? '' : v).trim(); return t === '' ? NaN : Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); };
    const AL = { barcode: ['barkod'], sku: ['stokkodu', 'sku', 'kod', 'ürünkodu'], name: ['ürün', 'ürünadı', 'ad'], cat: ['kategori'], loc: ['raf', 'lokasyon'], group: ['modelgrubu', 'model'], color: ['renk', 'varyant'], price: ['fiyat', 'satışfiyatı'], cost: ['maliyet', 'alışfiyatı', 'alış'], stock: ['stok', 'adet', 'miktar'], vat: ['kdv'], desi: ['desi'] };
    const keys = [...new Set(f.rows.flatMap((r) => Object.keys(r)))]; const col = {}; Object.entries(AL).forEach(([k, al]) => { const h = keys.find((x) => al.includes(nrm(x))); if (h) col[k] = h; });
    if (!col.barcode && !col.sku) return toast('Gerekli sütun bulunamadı: Barkod veya Stok kodu', 'err');
    const errs = [], ups = [], adds = []; const seen = new Set();
    f.rows.forEach((r, n) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : ''); const num = (k) => (g(k) === '' ? null : numOf(g(k))); const bc = g('barcode'), sk = g('sku'); const code = bc || sk; if (!code) return errs.push(`Satır ${n + 2}: kod boş`); if (seen.has(code)) return errs.push(`Satır ${n + 2}: ${code} dosyada iki kez`); seen.add(code); const v = {}; for (const k of ['price', 'cost', 'stock', 'vat', 'desi']) { const x = num(k); if (x === null) continue; if (!(x >= 0) || (k === 'price' && !x)) return errs.push(`Satır ${n + 2}: ${k} geçersiz`); v[k] = x; } ['loc', 'group', 'color', 'cat'].forEach((k) => { if (g(k)) v[k] = g(k); }); const ex = byCode(bc) || byCode(sk); if (ex) { if (g('name')) v.name = g('name'); return ups.push({ ex, v }); } if (!g('name') || !v.price || !bc || !sk) return errs.push(`Satır ${n + 2}: ${code} bulunamadı; yeni ürün için barkod, stok kodu, ad ve fiyat gerekli`); adds.push({ barcode: bc, sku: sk, name: g('name'), cost: 0, stock: 0, vat: 20, desi: 1, listings: {}, chPrice: {}, ...v }); });
    if (!ups.length && !adds.length) return toast(errs[0] || 'Aktarılacak satır yok', 'err');
    if (!(await confirm(`${ups.length} güncelleme, ${adds.length} yeni ürün${errs.length ? `, ${errs.length} hatalı satır atlanacak (ilki: ${errs[0]})` : ''}. Aktarılsın mı?`))) return;
    ups.forEach((u) => Object.assign(u.ex, u.v)); adds.forEach((a) => db.insert('products', a, true));
    db.log('Excel aktarımı', `${ups.length + adds.length} ürün`); db.save(); const r = await pushStock(ups.map((u) => u.ex.id), true); toast(`${ups.length + adds.length} ürün aktarıldı · ${r.msg}`, r.errs.length ? 'err' : r.sim ? 'warn' : 'ok'); app.refresh();
  }

  const ROLES = { admin: 'Yönetici', depo: 'Depo / paketleme', destek: 'Müşteri hizmetleri' };
  const app = NS.shell({
    id: 'pazaryeri', integrations: ['pazaryeri', 'kargofirma', 'efatura', 'label', 'barcode', 'printer', 'sms', 'webhook', 'backup'], name: 'Pazaryeri Satıcı Paneli', tagline: 'Tüm pazaryerleri tek ekranda', icon: 'store', accent: '#f97316', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Operasyon' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['depo', 'destek'] }, { id: 'siparisler', badge: true, label: 'Siparişler', icon: 'cart', roles: ['depo', 'destek'] }, { id: 'toplama', label: 'Toplama Listesi', icon: 'list', roles: ['depo'] }, { id: 'paketleme', label: 'Paketleme', icon: 'barcode', roles: ['depo'] }, { id: 'iadeler', badge: true, label: 'İadeler', icon: 'refresh', roles: ['depo', 'destek'] }, { id: 'sorular', badge: true, label: 'Müşteri Soruları', icon: 'message', roles: ['destek'] }, { sec: 'Mağaza' }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box', roles: ['depo'] }, { id: 'kanallar', label: 'Pazaryerleri', icon: 'store', roles: ['admin'] }, { sec: 'Finans' }, { id: 'fiyat', label: 'Fiyat Kuralı', icon: 'percent', roles: ['admin'] }, { id: 'hakedis', label: 'Hakediş & Kâr', icon: 'wallet', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'yeni' || (OPEN.includes(o.status) && o.items.some((i) => !i.pid))).length, sorular: db.all('questions', (q) => !q.answer).length, iadeler: db.all('returns', (r) => ['talep', 'yolda', 'geldi'].includes(r.status)).length }),
    routes: { ozet: dashboard, siparisler: ordersPage, toplama: pickPage, paketleme: packPage, urunler: productsPage, iadeler: returnsPage, sorular: questionsPage, fiyat: pricePage, hakedis: payoutPage, kanallar: channelsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Operasyon' }, { name: 'cutoff', label: 'Günlük kargo kesim saati', type: 'time' }, { name: 'carrier', label: 'Varsayılan kargo firması', type: 'select', options: Z.CARRIERS }, { name: 'lowStock', label: 'Kritik stok sınırı', type: 'number' }, { name: 'minMargin', label: 'Hedef marj (satış fiyatının %)', type: 'number', step: '0.1', hint: 'Fiyat kuralı ekranı bu marjı korur' }, { name: 'avgShip', label: 'Ortalama sipariş kargo gideri (₺)', type: 'number', step: '0.01' }, { name: 'autoInvoice', label: 'Paketlemede e-Arşiv faturayı otomatik kes', type: 'checkbox' }, { name: 'autoStock', label: 'Sipariş gelince stoğu tüm kanallara otomatik gönder', type: 'checkbox' }, { name: 'autoFinish', label: 'Tüm ürünler okutulunca paketi otomatik kapat', type: 'checkbox' }, { name: 'templates', label: 'Hazır soru yanıtları (her satır bir yanıt)', type: 'textarea', full: true }] }) },
  });
  // Arka planda: canlı kanallardan 5 dakikada bir sipariş çek
  setInterval(() => { if (connected().some(isLive)) pullOrders().then((r) => { if (r.count) { toast(`${r.count} yeni pazaryeri siparişi`, 'ok'); NS.beep(); } if (r.err) toast(r.err, 'err'); }); }, 5 * 60e3);
  if (NS.currentUser && NS.currentUser.role === 'depo' && !location.hash) app.go('paketleme');
})();
