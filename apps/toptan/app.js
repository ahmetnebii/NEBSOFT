/* NEBSOFT Toptancı & Plasiyer — saha siparişi, bayi B2B portalı, risk limiti, rota/araç yükleme,
   tahsilat ve çek portföyü, cari ekstre ve yaşlandırma, plasiyer performansı */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const T = window.TPT;
  const db = new NS.DB('toptan', T.seed);
  const S = () => db.settings({});
  let CM = null; const cus = (id) => { if (!CM) { CM = new Map(db.all('customers').map((c) => [c.id, c])); setTimeout(() => { CM = null; }, 0); } return CM.get(id) || { name: '-', limit: 0, balance: 0 }; };
  const rep = (id) => db.get('reps', id) || { name: '-' };
  const prod = (id) => db.get('products', id);
  const stB = (s) => badge(T.ST[s][0], T.ST[s][1]);
  // Plasiyer kullanıcısı Plasiyerler ekranında bağlanır; bağlı değilse hiçbir kaydı görmez
  const myRep = () => { const u = NS.currentUser; if (!u || u.role !== 'plasiyer') return null; const r = db.find('reps', (x) => x.user === u.id); return r ? r.id : u.rep || '__yok'; };
  // Aynı çizimde binlerce cari için tek hesap yapılır
  let LG = null; const ledger = () => { if (!LG) { LG = T.ledger(db.all('orders'), db.all('payments'), db.all('returns')); setTimeout(() => { LG = null; }, 0); } return LG; };
  const fresh = () => { LG = null; };
  const r2 = (x) => Math.round(x * 100) / 100;
  const discLimit = (rid) => { const v = (rep(rid) || {}).discMax; return v !== undefined && v !== '' ? Number(v) : Number(S().discMax) || 0; };
  const risk = (c, extra = 0) => T.exposure(c, ledger(), extra) > (c.limit || 0);
  const overdue = (c) => T.overdue(c, ledger());

  // ---------- Sipariş formu (ofis / plasiyer) ----------
  async function orderForm(app, customerId, src, onSaved) {
    const c = customerId ? cus(customerId) : null;
    let cid = c ? c.id : ''; const qty = {}; const dsc = {};
    const m = modal({ title: 'Yeni sipariş', size: 'wide', body: `<div class="row mb" style="gap:8px;flex-wrap:wrap"><select class="input" id="oc" style="max-width:320px">${db.all('customers', (x) => !myRep() || x.rep === myRep()).map((x) => `<option value="${x.id}" ${x.id === cid ? 'selected' : ''}>${esc(x.name)} · ${esc(x.district)}</option>`).join('')}</select><input class="input" id="oq" placeholder="Ürün ara..." style="max-width:220px"><button class="btn" id="sg">${icon('sparkles')} Öneri</button><span class="grow"></span><div id="ri"></div></div><div id="pl" style="max-height:52vh;overflow:auto"></div><div class="row mt" style="justify-content:flex-end;gap:16px" id="ot"></div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Siparişi kaydet', cls: 'primary', icon: 'check', onClick: (close) => save(close) }] });
    const R = m.root; cid = cid || $('#oc', R).value;
    const lines = () => Object.entries(qty).filter(([, q]) => q > 0).map(([pid, q]) => { const p = prod(pid); return { pid, name: p.name, qty: q, price: T.price(p, cus(cid).list), vat: p.vat, disc: dsc[pid] || 0 }; });
    const draw = () => {
      const c2 = cus(cid); const q = ($('#oq', R).value || '').trim();
      $('#ri', R).innerHTML = `${badge(T.listOf(c2.list)[0].split(' — ')[0] + ' listesi', 'info')} ${risk(c2) ? badge('Limit aşıldı', 'err') : badge(`Limit kalan ${money(c2.limit - T.exposure(c2, ledger()))}`, 'ok')} ${overdue(c2) ? badge('Vadesi geçen ' + money(overdue(c2)), 'err') : ''}`;
      $('#pl', R).innerHTML = `<table class="tbl"><thead><tr><th>Ürün</th><th class="right">Koli içi</th><th class="right">Kullanılabilir</th><th class="right">Fiyat</th><th class="right" style="width:70px">İsk. %</th><th class="right" style="width:150px">Adet</th></tr></thead><tbody>${db.all('products', (p) => NS.match(q, p.name, p.code, p.cat)).slice(0, 150).map((p) => `<tr><td><b>${esc(p.name)}</b><div class="small faint">${esc(p.code)} · ${esc(p.cat)}</div></td><td class="right">${p.pack}</td><td class="right" style="color:var(--${T.avail(p, ledger()) < p.pack ? 'err' : 'text'})">${T.avail(p, ledger())}</td><td class="right">${money(T.price(p, c2.list))}${(() => { const k = T.promoOf(db.all('promos'), p.id, today()); return k ? `<div class="small" style="color:var(--ok)">${k.buy} alana ${k.free} bedava</div>` : ''; })()}</td><td class="right"><input class="input" data-d="${p.id}" value="${dsc[p.id] || ''}" inputmode="decimal" aria-label="İskonto yüzdesi" style="width:56px;height:32px;text-align:right"></td><td class="right"><div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm ghost icon" data-k="-1" data-p="${p.id}">${icon('minus')}</button><input class="input" data-q="${p.id}" value="${qty[p.id] || ''}" inputmode="numeric" style="width:56px;height:32px;text-align:right"><button class="btn sm ghost icon" data-k="1" data-p="${p.id}" title="1 koli">${icon('plus')}</button></div></td></tr>`).join('')}</tbody></table>`;
      tot();
    };
    const withP = () => T.withPromo(lines(), db.all('promos'), db.all('products'), today());
    const tot = () => { const t = T.orderTotal({ lines: lines() }); const c2 = cus(cid); const fr = withP().filter((l) => l.free); $('#ot', R).innerHTML = `${fr.length ? badge(`${sum(fr, (l) => l.qty)} adet mal fazlası`, 'ok') : ''}<span class="muted">${lines().length} kalem</span><span>KDV ${money(t.vat)}</span><b style="font-size:20px">${money(t.total)}</b>${risk(c2, t.total) ? badge('Risk limiti aşılacak — onaya düşer', 'err') : ''}`; };
    async function save(close) {
      const L = withP(); if (!L.length) return toast('Ürün ekleyin', 'err'); const c2 = cus(cid); const t = T.orderTotal({ lines: L });
      if (t.total < (Number(S().minOrder) || 0)) return toast(`En az sipariş tutarı ${money(S().minOrder)}`, 'err');
      const short = L.filter((l) => l.qty > T.avail(prod(l.pid), ledger())); if (short.length && !(await confirm(`${short.map((l) => l.name).join(', ')} için kullanılabilir stok yetmiyor. Sipariş yine de kaydedilsin mi? Sevkte eksik çıkar.`))) return;
      // Plasiyerin iskonto sınırı aşılırsa sipariş onaya düşer (ofis ve yönetici sınırsız)
      const lim = discLimit(c2.rep); const over = myRep() ? L.filter((l) => l.disc > lim) : []; const hold = over.length ? `İskonto sınırı %${lim} aşıldı: ${over.map((l) => `${l.name} %${l.disc}`).join(', ')}` : '';
      const o = db.insert('orders', { no: T.nextNo(db.all('orders')), customer: cid, rep: c2.rep, src: src || (myRep() ? 'saha' : 'ofis'), at: new Date().toISOString(), lines: L, status: hold || risk(c2, t.total) || overdue(c2) ? 'onay' : 'yeni', note: '', ...(hold ? { hold } : {}) });
      toast(o.status === 'onay' ? `${o.no} onaya düştü` : `${o.no} kaydedildi · ${money(t.total)}`, o.status === 'onay' ? 'err' : 'ok'); fresh(); if (onSaved) onSaved(o); close(); app.refresh();
    }
    $('#oc', R).onchange = (e) => { cid = e.target.value; draw(); };
    // Öneri: son 6 siparişin en az ikisinde geçen ürünler, olağan miktarıyla (ortanca) gelir; miktar elle değiştirilebilir
    $('#sg', R).onclick = () => { const O = db.all('orders', (o) => o.customer === cid && o.status !== 'iptal').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6); const by = {}; O.forEach((o) => o.lines.filter((l) => !l.free).forEach((l) => { (by[l.pid] = by[l.pid] || []).push(l.qty); })); const pick = Object.entries(by).filter(([id, q]) => q.length >= 2 && prod(id)); if (!pick.length) return toast('Öneri için bu carinin en az iki siparişi olmalı', 'warn'); pick.forEach(([id, q]) => { const s2 = [...q].sort((a, b) => a - b); qty[id] = s2[Math.floor(s2.length / 2)]; }); draw(); toast(`${pick.length} ürün önerildi`, 'ok'); };
    $('#oq', R).oninput = draw;
    on(R, 'click', '[data-k]', (e, b) => { const p = prod(b.dataset.p); qty[p.id] = Math.max(0, (qty[p.id] || 0) + Number(b.dataset.k) * p.pack); $(`[data-q="${p.id}"]`, R).value = qty[p.id] || ''; tot(); });
    on(R, 'input', '[data-q]', (e, b) => { qty[b.dataset.q] = Math.max(0, Number(b.value) || 0); tot(); });
    on(R, 'input', '[data-d]', (e, b) => { dsc[b.dataset.d] = NS.clamp(Number(String(b.value).replace(',', '.')) || 0, 0, 100); tot(); });
    draw();
  }

  // ---------- Sipariş detay ----------
  function orderModal(app, o) {
    const c = cus(o.customer); const t = T.orderTotal(o);
    modal({ title: `${o.no} · ${c.name}`, size: 'wide', body: `<div class="row mb">${stB(o.status)} ${badge(T.SRC[o.src], 'info')} ${o.invoice ? badge(`${o.invoice.test ? 'TEST ' : ''}${o.invoice.type} ${o.invoice.no}`, o.invoice.test ? 'warn' : 'ok') : ''} <span class="small muted">${NS.dt(o.at)} · ${esc(rep(o.rep).name)}</span></div>
      ${o.status === 'onay' ? `<div class="card pad mb" style="border-color:var(--err)"><b>Onay gerekçesi</b>${o.hold ? `<div class="small">${esc(o.hold)}</div>` : ''}<div class="small">Toplam risk ${money(T.exposure(c, ledger()))} (bakiye ${money(c.balance)}, açık sipariş, tahsil olmamış çek; bu sipariş dahil) · limit ${money(c.limit)}${overdue(c) ? ` · vadesi geçen ${money(overdue(c))}` : ''}</div></div>` : ''}
      ${table({ rows: o.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => esc(l.name) }, { label: 'Adet', cls: 'right', render: (l) => (l.ordered && l.ordered !== l.qty ? `${l.qty} <span class="small faint">/ ${l.ordered}</span>` : l.qty) }, { label: 'Fiyat', cls: 'right', render: (l) => money(l.price) }, { label: 'İsk.', cls: 'right', render: (l) => (l.disc ? '%' + l.disc : '') }, { label: 'Tutar', cls: 'right', render: (l) => money(l.qty * l.price * (1 - (l.disc || 0) / 100)) }] })}
      <div class="row mt" style="justify-content:flex-end;gap:16px"><span>Ara toplam ${money(t.net)}</span><span>KDV ${money(t.vat)}</span><b style="font-size:20px">${money(t.total)}</b></div>${o.note ? `<div class="small muted mt">${esc(o.note)}</div>` : ''}`,
      actions: [{ label: 'Yazdır', icon: 'print', onClick: () => printDoc(o) },
        ...(o.status === 'yeni' ? [{ label: 'Hazırlamaya al', onClick: (cl) => { o.status = 'hazir'; db.save(); cl(); app.refresh(); } }] : []),
        ...(o.status === 'teslim' ? [{ label: 'İade al', icon: 'refresh', onClick: (cl) => { cl(); takeReturn(app, o); } }] : []),
        ...(unbilled(o) ? [{ label: o.invoice ? 'Faturayı yeniden kes' : 'Fatura kes', icon: 'file', onClick: async (cl) => { if (o.invoice && !(await confirm(`${o.no} için TEST faturası var (gönderilmedi). Yeniden kesilsin mi?`))) return; cl(); await invoice(o); app.refresh(); } }] : o.invoice ? [{ label: 'Faturayı gör', icon: 'file', onClick: () => NS.ebelge.view(o.invoice.id) }] : []),
        ...(o.status === 'onay' && (NS.app.can('admin')) ? [{ label: 'Onayla', cls: 'primary', onClick: (cl) => { o.status = 'yeni'; o.note = `Onaylayan: ${(NS.currentUser || {}).name}`; db.log('Sipariş onayı', `${o.no} · ${c.name} · ${money(t.total)}`); db.save(); cl(); app.refresh(); } }] : []),
        ...(['yeni', 'onay'].includes(o.status) ? [{ label: 'İptal', cls: 'danger', onClick: async (cl) => { if (await confirm('Sipariş iptal edilsin mi?')) { o.status = 'iptal'; db.log('Sipariş iptal', o.no); db.save(); cl(); app.refresh(); } } }] : []),
        ...(o.status === 'sevk' ? [{ label: 'Teslimatı kaydet', cls: 'primary', icon: 'check', onClick: (cl) => { cl(); deliver(app, o); } }] : [])] });
  }
  // Teslimat: araçtan inen gerçek miktar yazılır; fark stoğa döner, cari borcundan düşer. Hiçbiri teslim edilmediyse sipariş iptal olur.
  async function deliver(app, o, init) {
    const v = await formModal({ title: `${o.no} teslimat — ${cus(o.customer).name}`, fields: [...o.lines.map((l, i) => ({ name: 'q' + i, label: `${l.name} (sevk ${l.qty})`, type: 'number' })), { name: 'reason', label: 'Eksik veya alınmadıysa nedeni', full: true }], values: init || Object.fromEntries(o.lines.map((l, i) => ['q' + i, l.qty])), submitLabel: 'Teslimatı kaydet' });
    if (!v) return; const qs = o.lines.map((l, i) => Number(v['q' + i])); if (qs.some((q, i) => !Number.isFinite(q) || q < 0 || q > o.lines[i].qty)) return toast('Teslim miktarı 0 ile sevk miktarı arasında olmalı', 'err');
    const diff = qs.some((q, i) => q !== o.lines[i].qty); if (diff && !String(v.reason || '').trim()) { toast('Farkın nedenini yazın', 'err'); return deliver(app, o, v); }
    const c = cus(o.customer); const before = T.orderTotal(o).total;
    o.lines.forEach((l, i) => { const back = l.qty - qs[i]; if (!back) return; const p = prod(l.pid); if (p) p.stock += back; l.ordered = l.ordered || l.qty; l.qty = qs[i]; });
    const drop = r2(before - T.orderTotal(o).total); c.balance = r2((c.balance || 0) - drop);
    if (qs.every((q) => !q)) { o.status = 'iptal'; o.note = `Teslim alınmadı: ${v.reason}`; } else { o.status = 'teslim'; o.deliveredAt = new Date().toISOString(); if (diff) o.note = `Eksik teslim: ${v.reason}`; }
    db.log('Teslimat', `${o.no} · ${c.name}${diff ? ` · fark ${money(drop)} · ${v.reason}` : ''}`); fresh(); db.save(); toast(diff ? `Kaydedildi; ${money(drop)} cari borcundan düşüldü` : 'Teslim edildi', 'ok'); app.refresh();
  }
  // İade: teslim edilen siparişten; satılabilir ürün stoğa döner, hasarlı dönmez. Daha önce iade edilen miktar aşılamaz.
  async function takeReturn(app, o) {
    const done = {}; db.all('returns', (r) => r.order === o.id).forEach((r) => r.lines.forEach((l) => { done[l.pid] = (done[l.pid] || 0) + l.qty; }));
    const L = o.lines.map((l) => ({ l, left: l.qty - (done[l.pid] || 0) })).filter((x) => x.left > 0 && x.l.qty > 0); if (!L.length) return toast('Bu siparişin tüm ürünleri iade edilmiş', 'err');
    const v = await formModal({ title: `${o.no} iade — ${cus(o.customer).name}`, fields: [...L.map((x, i) => ({ name: 'q' + i, label: `${x.l.name} (en çok ${x.left})`, type: 'number', value: 0 })), { name: 'reason', label: 'İade nedeni', type: 'select', options: T.RET, required: true }, { name: 'restock', label: 'Ürün satılabilir, stoğa dönsün', type: 'checkbox', full: true }], submitLabel: 'İadeyi kaydet' });
    if (!v) return; const qs = L.map((x, i) => Number(v['q' + i]) || 0); if (qs.some((q, i) => q < 0 || q > L[i].left)) return toast('İade miktarı satılan miktarı aşamaz', 'err'); if (!qs.some((q) => q > 0)) return toast('İade miktarı girin', 'err');
    const lines = L.map((x, i) => ({ ...x.l, qty: qs[i] })).filter((l) => l.qty > 0); const total = T.orderTotal({ lines }).total; const c = cus(o.customer);
    if (v.restock) lines.forEach((l) => { const p = prod(l.pid); if (p) p.stock += l.qty; });
    const r = db.insert('returns', { no: 'I' + (1000 + db.all('returns').length), order: o.id, orderNo: o.no, customer: o.customer, rep: o.rep, at: new Date().toISOString(), lines, total, reason: v.reason, restock: !!v.restock });
    c.balance = r2((c.balance || 0) - total); db.log('İade', `${r.no} · ${c.name} · ${money(total)} · ${v.reason}`); fresh(); db.save(); toast(`${r.no} kaydedildi; ${money(total)} cari borcundan düşüldü`, 'ok'); app.refresh();
  }
  // Fatura teslimden sonra kesilir: kısmi teslim ve iade tutarı faturayı bozmasın. TEST sonucu "kesildi" sayılmaz.
  const unbilled = (o) => o.status === 'teslim' && o.lines.some((l) => l.qty > 0) && (!o.invoice || o.invoice.test);
  const billDoc = (o, lines, extra) => { const c = cus(o.customer); return { docType: 'auto', no: o.no, buyer: c.name, buyerVkn: c.taxNo, buyerTaxOffice: c.taxOffice, buyerEmail: c.email, address: c.address, district: c.district, city: c.city, note: `Sipariş ${o.no}`, lines: lines.filter((l) => l.qty > 0).map((l) => ({ code: (prod(l.pid) || {}).code, name: l.name, qty: l.qty, unit: 'adet', price: l.price, disc: l.disc || 0, vat: l.vat })), ...extra }; };
  async function invoice(o) {
    const r = await NS.ebelge.create(billDoc(o, o.lines)); if (r && r.ok) { o.invoice = { id: r.id, no: r.no, type: r.type, date: today(), ...(r.simulated ? { test: true } : {}) }; db.log('Fatura', `${o.no} · ${r.no}${r.simulated ? ' · TEST' : ''}`); db.save(); } return r;
  }
  async function refundInvoice(app, x) {
    const o = db.get('orders', x.order) || {}; if (!o.invoice || o.invoice.test) return toast('Satış faturası kesilmemiş; iade faturası kesilemez', 'err');
    const r = await NS.ebelge.create(billDoc(o, x.lines, { no: x.no, refund: true, refundOf: o.invoice.no, refundDate: o.invoice.date, note: `İade ${x.no} · ${x.reason}` })); if (r && r.ok) { x.invoice = { id: r.id, no: r.no, type: r.type, ...(r.simulated ? { test: true } : {}) }; db.log('İade faturası', `${x.no} · ${r.no}${r.simulated ? ' · TEST' : ''}`); db.save(); app.refresh(); }
  }
  const orderDoc = (o) => { const c = cus(o.customer), t = T.orderTotal(o); const ship = ['sevk', 'teslim'].includes(o.status); return { title: ship ? 'Sevk fişi' : 'Sipariş fişi', no: o.no, date: o.at, party: { title: 'Müşteri', name: c.name, lines: [c.district, c.taxNo ? 'VKN ' + c.taxNo : '', c.phone] }, info: [['Plasiyer', rep(o.rep).name], ['Vade', (c.term || 30) + ' gün']], lines: o.lines.filter((l) => l.qty > 0).map((l) => ({ name: l.name, note: (prod(l.pid) || {}).pack ? `${(l.qty / prod(l.pid).pack).toFixed(1)} koli` : '', qty: l.qty, price: l.price, disc: l.disc, total: r2(l.qty * l.price * (1 - (l.disc || 0) / 100)) })), totals: [['Ara toplam', t.net], ['KDV', t.vat], ['Toplam', t.total, true], ['Güncel bakiye', c.balance || 0]], note: ship ? 'Bu belge bilgi amaçlıdır; irsaliye yerine geçmez.' : '' }; };
  const printDoc = (o) => NS.docs.print('siparis', orderDoc(o));
  const statementDoc = (c) => { const m = T.moves(c, db.all('orders'), db.all('payments'), db.all('returns')); return { title: 'Cari hesap ekstresi', no: c.name, party: { title: 'Cari', name: c.name, lines: [c.district, c.taxNo ? 'VKN ' + c.taxNo : ''] }, lines: m.rows.map((x) => ({ name: `${NS.date(x.at)} · ${x.d}`, note: `bakiye ${money(x.bal)}`, qty: 1, price: x.v, total: x.v })), totals: [['Devir', m.open], ['Güncel bakiye', c.balance || 0, true]] }; };
  if (NS.docs) { NS.docs.define('toptan', 'siparis', { label: 'Sipariş / sevk fişi', sample: () => { const o = db.all('orders')[0]; return o ? orderDoc(o) : {}; } }); NS.docs.define('toptan', 'ekstre', { label: 'Cari hesap ekstresi', sample: () => { const c = db.all('customers')[0]; return c ? statementDoc(c) : {}; } }); NS.docs.define('toptan', 'makbuz', { label: 'Tahsilat makbuzu', defaults: { paper: '80mm' } }); }

  // ---------- Siparişler ----------
  function ordersPage(el, p, app) {
    let f = p || 'acik', q = ''; const mine = myRep();
    el.innerHTML = pageHead('Siparişler', 'Saha, bayi portalı ve ofis siparişleri', `${mine ? '' : `<button class="btn" id="bulk">${icon('file')} Faturasızları faturala</button>`}<button class="btn primary" id="new">${icon('plus')} Yeni sipariş</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Sipariş no, müşteri...')}<div class="seg">${[['acik', 'Açık'], ['onay', 'Onay'], ['sevk', 'Sevkte'], ['teslim', 'Teslim'], ['fatura', 'Faturasız'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('orders', (o) => (!mine || o.rep === mine) && (f === 'all' || (f === 'acik' ? ['yeni', 'hazir', 'onay'].includes(o.status) : f === 'fatura' ? unbilled(o) : o.status === f)) && NS.match(q, o.no, cus(o.customer).name)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'cart', columns: [{ label: 'Sipariş', render: (o) => `<b class="mono">${esc(o.no)}</b><div class="small faint">${NS.dt(o.at)}</div>` }, { label: 'Müşteri', render: (o) => `<b>${esc(cus(o.customer).name)}</b><div class="small faint">${esc(cus(o.customer).district)}</div>` }, { label: 'Kaynak', render: (o) => `${badge(T.SRC[o.src], o.src === 'b2b' ? 'acc' : '')}<div class="small faint">${esc(rep(o.rep).name)}</div>` }, { label: 'Kalem', cls: 'right', render: (o) => o.lines.length }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(T.orderTotal(o).total)}</b>` }, { label: 'Durum', render: (o) => stB(o.status) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} sipariş · ${money(sum(r, (o) => T.orderTotal(o).total))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    $('#new', el).onclick = () => orderForm(app);
    if ($('#bulk', el)) $('#bulk', el).onclick = async () => { const L = db.all('orders', unbilled).sort((a, b) => a.at.localeCompare(b.at)); if (!L.length) return toast('Faturasız teslimat yok', 'warn'); if (!(await confirm(`${L.length} teslimat için fatura kesilsin mi? Hata olursa işlem durur.`))) return; let n = 0; for (const o of L) { const r = await invoice(o); if (!r || !r.ok) break; n++; } toast(`${n} / ${L.length} fatura kesildi`, n === L.length ? 'ok' : 'warn'); app.refresh(); };
    draw();
  }

  // ---------- Sevkiyat / araç yükleme ----------
  function shipPage(el, p, app) {
    const ready = db.all('orders', (o) => ['yeni', 'hazir'].includes(o.status));
    const byRep = NS.groupBy(ready, (o) => o.rep);
    el.innerHTML = pageHead('Sevkiyat', 'Onaylı siparişler araç/rota bazında — yükleme listesi ve irsaliye') + `<div class="grid g3">${db.all('reps').map((r) => { const L = byRep[r.id] || []; const items = Object.values(L.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { ...l, qty: 0 }; m[l.pid].qty += l.qty; return m; }, {})); return `<div class="card"><div class="card-h"><div class="grow"><b>${esc(r.name)}</b><div class="small faint">${esc(r.plate)}</div></div>${badge(L.length + ' sipariş', L.length ? 'info' : '')}</div><div class="card-b col" style="gap:6px">${L.map((o) => `<div class="small row"><span class="grow">${esc(cus(o.customer).name)}</span><b>${money(T.orderTotal(o).total)}</b></div>`).join('') || '<span class="small faint">Bekleyen yok</span>'}
      ${L.length ? `<div class="small muted mt">${sum(items, (i) => i.qty / ((prod(i.pid) || {}).pack || 1)).toFixed(0)} koli · ${money(sum(L, (o) => T.orderTotal(o).total))}</div><div class="row mt"><button class="btn sm" data-ld="${r.id}">${icon('print')} Yükleme listesi</button><button class="btn sm primary" data-go="${r.id}">${icon('truck')} Yola çıkar</button></div>` : ''}</div></div>`; }).join('')}</div>`;
    on(el, 'click', '[data-ld]', (e, b) => { const L = byRep[b.dataset.ld]; const items = Object.values(L.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { ...l, qty: 0 }; m[l.pid].qty += l.qty; return m; }, {})); NS.printHtml(`<div class="doc"><h2>ARAÇ YÜKLEME LİSTESİ — ${esc(rep(b.dataset.ld).name)} · ${esc(rep(b.dataset.ld).plate)}</h2><div>${NS.dateLong(new Date())} · ${L.length} müşteri</div><table><tr><th>Ürün</th><th style="text-align:right">Adet</th><th style="text-align:right">Koli</th><th>✓</th></tr>${items.map((i) => `<tr><td>${esc(i.name)}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right"><b>${(i.qty / ((prod(i.pid) || {}).pack || 1)).toFixed(1)}</b></td><td>☐</td></tr>`).join('')}</table><h3>Teslimat sırası</h3><ol>${L.map((o) => `<li>${esc(cus(o.customer).name)} — ${esc(cus(o.customer).district)} — ${esc(o.no)}</li>`).join('')}</ol></div>`, { title: 'Yükleme' }); });
    on(el, 'click', '[data-go]', async (e, b) => {
      // Stok sırayla ayrılır: yetmeyen kalem eksik sevk edilir, hiç kalemi kalmayan sipariş bekler
      const L = [...byRep[b.dataset.go]].sort((x, y) => x.at.localeCompare(y.at)); const left = {}; const stk = (id) => (left[id] !== undefined ? left[id] : (left[id] = Math.max(0, (prod(id) || {}).stock || 0)));
      const plan = L.map((o) => ({ o, q: o.lines.map((l) => { const n = Math.min(l.qty, stk(l.pid)); left[l.pid] -= n; return n; }) })); const short = plan.flatMap((x) => x.o.lines.filter((l, i) => x.q[i] < l.qty).map((l) => l.name)); const go = plan.filter((x) => x.q.some((n) => n > 0));
      if (!go.length) return toast('Stok olmadığı için sevk edilecek ürün yok', 'err');
      if (!(await confirm(short.length ? `Stok yetmeyen kalemler eksik sevk edilecek: ${[...new Set(short)].join(', ')}. ${go.length} sipariş sevke çıksın mı?` : `${go.length} sipariş sevke çıksın ve stok düşsün mü?`))) return;
      go.forEach(({ o, q }) => { o.lines.forEach((l, i) => { if (q[i] < l.qty) { l.ordered = l.ordered || l.qty; l.qty = q[i]; } const p2 = prod(l.pid); if (p2) p2.stock -= q[i]; }); o.lines = o.lines.filter((l) => l.qty > 0); o.status = 'sevk'; o.shippedAt = new Date().toISOString(); const c = cus(o.customer); c.balance = r2((c.balance || 0) + T.orderTotal(o).total); }); db.log('Sevkiyat', `${rep(b.dataset.go).name} · ${go.length} sipariş`); fresh(); db.save();
      NS.printHtml(go.map(({ o }) => `<div style="page-break-after:always">${NS.docs.render('siparis', orderDoc(o))}</div>`).join(''), { title: 'Sevk fişleri' }); toast(`${go.length} sipariş sevkte${go.length < L.length ? ` · ${L.length - go.length} sipariş stok bekliyor` : ''}`, 'ok'); app.refresh();
    });
  }

  // ---------- Plasiyer ekranı ----------
  function repPage(el, p, app) {
    const rid = myRep() || p || (db.all('reps')[0] || {}).id; if (!rid || rid === '__yok') { el.innerHTML = pageHead('Plasiyer Ekranı') + `<div class="card pad muted">${myRep() ? 'Hesabınız bir plasiyere bağlı değil. Yöneticiniz Plasiyerler ekranından bağlamalı.' : 'Önce Plasiyerler ekranından plasiyer ekleyin.'}</div>`; return; }
    const r = rep(rid); const dow = new Date().getDay();
    const route = db.all('customers', (c) => c.rep === rid && c.day === dow);
    const visited = (c) => db.find('visits', (v) => v.customer === c.id && iso(v.at) === today());
    const todays = db.all('orders', (o) => o.rep === rid && iso(o.at) === today()); const col = db.all('payments', (x) => x.rep === rid && iso(x.at) === today());
    el.innerHTML = pageHead(`${r.name} — bugünkü rota`, `${T.DAYS[dow]} · ${route.length} müşteri`, `<button class="btn" id="ge">${icon('wallet')} Gün sonu</button>${myRep() ? '' : `<select class="input" id="rs">${db.all('reps').map((x) => `<option value="${x.id}" ${x.id === rid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`}`) + `
      <div class="grid g3 mb">${kpi('Sipariş', money(sum(todays, (o) => T.orderTotal(o).total)), 'cart', 'info', `<div class="small faint">${todays.length} adet</div>`)}${kpi('Tahsilat', money(sum(col, (x) => x.amount)), 'cash', 'ok')}${kpi('Ziyaret', `${route.filter(visited).length}/${route.length}`, 'map', 'warn')}</div>
      <div class="col" style="gap:10px">${route.map((c) => { const v = visited(c); const od = overdue(c); return `<div class="card pad"><div class="row"><div class="grow"><b>${esc(c.name)}</b> ${v ? badge(v.result, v.result === 'Sipariş alındı' ? 'ok' : '') : ''}<div class="small muted">${esc(c.contact || '')} · ${esc(c.district || '')} · <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div><div class="small mt">Bakiye <b>${money(c.balance)}</b>${od ? ` · ${badge('Vadesi geçen ' + money(od), 'err')}` : ''}</div></div><a class="btn sm ghost icon" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.lat != null ? `${c.lat},${c.lng}` : `${c.name} ${c.district || ''}`)}" title="Yol tarifi">${icon('map')}</a></div>
        <div class="row mt" style="flex-wrap:wrap;gap:6px"><button class="btn sm primary" data-o="${c.id}">${icon('cart')} Sipariş</button><button class="btn sm" data-p="${c.id}">${icon('cash')} Tahsilat</button><button class="btn sm" data-n="${c.id}">Sipariş yok</button></div></div>`; }).join('') || '<div class="card pad muted">Bugün rotada müşteri yok.</div>'}</div>`;
    const visit = (cid, result) => { db.insert('visits', { customer: cid, rep: rid, at: new Date().toISOString(), result }); };
    on(el, 'click', '[data-o]', (e, b) => orderForm(app, b.dataset.o, 'saha', () => visit(b.dataset.o, 'Sipariş alındı')));
    on(el, 'click', '[data-p]', (e, b) => collect(app, b.dataset.p, rid));
    on(el, 'click', '[data-n]', async (e, b) => { const why = await NS.prompt('Neden sipariş alınamadı?', 'Stoğu var'); if (why === null) return; visit(b.dataset.n, why || 'Sipariş yok'); app.refresh(); });
    if ($('#rs', el)) $('#rs', el).onchange = (e) => app.go('plasiyer', e.target.value);
    $('#ge', el).onclick = () => dayEnd(app, rid);
  }
  // Gün sonu: son kapanıştan bu yana alınan nakit sayılır, kasaya teslim edilir; fark kayda geçer. Çek ve senet elden, havale ve kart bilgi amaçlı listelenir.
  async function dayEnd(app, rid) {
    const last = db.all('dayends', (d) => d.rep === rid).sort((a, b) => b.at.localeCompare(a.at))[0]; const P = db.all('payments', (x) => x.rep === rid && (last ? x.at > last.at : iso(x.at) === today())); if (!P.length) return toast('Son kapanıştan beri tahsilat yok', 'warn');
    const by = NS.groupBy(P, (x) => x.method); const cash = r2(sum(by.Nakit || [], (x) => x.amount)); const paper = [...(by['Çek'] || []), ...(by.Senet || [])];
    const v = await formModal({ title: `Gün sonu — ${rep(rid).name}`, extra: `<div class="card pad mt small">${Object.entries(by).map(([k, L]) => `<div class="row between"><span>${esc(k)} (${L.length})</span><b>${money(sum(L, (x) => x.amount))}</b></div>`).join('')}</div>`, fields: [{ name: 'counted', label: 'Teslim edilen nakit (₺)', type: 'number', step: '0.01', value: cash, required: true }, { name: 'note', label: 'Not (fark varsa açıklayın)', full: true }], submitLabel: 'Gün sonunu kaydet' });
    if (!v) return; const counted = r2(Number(v.counted) || 0); const diff = r2(counted - cash); if (diff && !String(v.note || '').trim()) return toast('Kasa farkını açıklayın', 'err');
    db.insert('dayends', { rep: rid, at: new Date().toISOString(), cash, counted, diff, paper: paper.length, paperTotal: r2(sum(paper, (x) => x.amount)), total: r2(sum(P, (x) => x.amount)), note: v.note || '', by: (NS.currentUser || {}).name || '' }); db.log('Plasiyer gün sonu', `${rep(rid).name} · nakit ${money(counted)}${diff ? ` · fark ${money(diff)}` : ''}`); toast(diff ? `Kaydedildi · kasa farkı ${money(diff)}` : 'Gün sonu kaydedildi', diff ? 'warn' : 'ok'); app.refresh();
  }
  async function collect(app, cid, rid) {
    const c = cus(cid);
    const v = await formModal({ title: `Tahsilat — ${c.name} · bakiye ${money(c.balance)}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true, step: '0.01' }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Nakit', 'Havale', 'Kredi kartı', 'Çek', 'Senet'] }, { name: 'due', label: 'Çek/senet vadesi', type: 'date' }, { name: 'bank', label: 'Banka (çek)' }, { name: 'serial', label: 'Çek/senet no' }], values: { amount: Math.max(0, overdue(c) || c.balance), method: 'Nakit' } });
    if (!v) return; const amt = r2(Number(v.amount) || 0); if (amt <= 0) return toast('Tutar sıfırdan büyük olmalı', 'err'); const paper = ['Çek', 'Senet'].includes(v.method); if (paper && (!v.due || !v.serial)) return toast('Çek/senet için vade ve numara zorunlu', 'err');
    db.insert('payments', { customer: cid, rep: rid || c.rep, amount: amt, method: v.method, at: new Date().toISOString(), ...(paper ? { due: v.due, bank: v.bank, serial: v.serial, cheque: 'portfoy' } : {}) });
    c.balance = r2((c.balance || 0) - amt); fresh(); db.save();
    NS.docs.print('makbuz', { title: 'Tahsilat makbuzu', date: new Date().toISOString(), party: { title: 'Ödeyen', name: c.name }, info: [['Yöntem', v.method], ['Belge no', v.serial || ''], ['Vade', v.due ? NS.date(v.due) : ''], ['Tahsil eden', (NS.currentUser || {}).name || '']], totals: [['Tahsilat', amt, true], ['Kalan bakiye', c.balance]] });
    toast('Tahsilat kaydedildi', 'ok'); app.refresh();
  }

  // ---------- Tahsilat & çek portföyü ----------
  const CH = { portfoy: ['Portföyde', 'info'], bankada: ['Bankada', 'warn'] };
  function payPage(el, p, app) {
    el.innerHTML = pageHead('Tahsilat & Çek Portföyü', 'Plasiyer tahsilatları ve vadesi gelen çek/senetler') + `<div class="grid g-21"><div class="card"><div class="card-h"><h3>Son tahsilatlar</h3></div><div id="pt"></div></div><div class="card"><div class="card-h"><h3>Tahsil olmamış çek / senet</h3></div><div id="ct"></div></div></div><div class="card mt"><div class="card-h"><h3>Plasiyer gün sonları</h3></div><div id="de"></div></div>`;
    const draw = () => {
      const C = db.all('payments', (x) => CH[x.cheque]).sort((a, b) => String(a.due || '').localeCompare(String(b.due || '')));
      $('#pt', el).innerHTML = table({ rows: db.all('payments').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40), columns: [{ label: 'Tarih', render: (x) => NS.dt(x.at) }, { label: 'Müşteri', render: (x) => esc(cus(x.customer).name) }, { label: 'Plasiyer', render: (x) => esc(rep(x.rep).name.split(' ')[0]) }, { label: 'Yöntem', render: (x) => `${esc(x.method)}${x.cheque === 'karsiliksiz' ? ' ' + badge('Karşılıksız', 'err') : ''}` }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b>` }] });
      $('#de', el).innerHTML = table({ rows: db.all('dayends').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30), empty: 'Henüz gün sonu yok', columns: [{ label: 'Tarih', render: (x) => NS.dt(x.at) }, { label: 'Plasiyer', render: (x) => esc(rep(x.rep).name) }, { label: 'Nakit', cls: 'right', render: (x) => money(x.counted) }, { label: 'Çek/senet', cls: 'right', render: (x) => money(x.paperTotal) }, { label: 'Fark', cls: 'right', render: (x) => (x.diff ? badge(money(x.diff), 'err') : '<span class="faint">—</span>') }, { label: 'Not', render: (x) => esc(x.note) }] });
      $('#ct', el).innerHTML = table({ rows: C, empty: 'Bekleyen çek yok', columns: [{ label: 'Vade', render: (x) => (!x.due ? badge('Vade yok', 'err') : x.due < today() ? badge(NS.date(x.due), 'err') : x.due <= iso(addDays(new Date(), 7)) ? badge(NS.date(x.due), 'warn') : NS.date(x.due)) }, { label: 'Keşideci', render: (x) => `${esc(cus(x.customer).name)}<div class="small faint">${esc(x.bank || '')} · ${esc(x.serial || '')}</div>` }, { label: 'Durum', render: (x) => badge(...CH[x.cheque]) }, { label: 'Tutar', cls: 'right', render: (x) => money(x.amount) }], actions: [{ icon: 'building', act: 'bank', title: 'Bankaya tahsile ver' }, { icon: 'check', act: 'okc', title: 'Tahsil edildi' }, { icon: 'alert', act: 'kw', title: 'Karşılıksız' }], foot: `Toplam ${money(sum(C, (x) => x.amount))}` });
    };
    on(el, 'click', '[data-act=bank]', (e, b) => { const x = db.get('payments', b.dataset.id); if (x.cheque !== 'portfoy') return toast('Bu çek zaten bankada', 'err'); x.cheque = 'bankada'; db.save(); draw(); toast('Çek bankaya tahsile verildi', 'ok'); });
    on(el, 'click', '[data-act=okc]', async (e, b) => { const x = db.get('payments', b.dataset.id); if (!(await confirm(`${x.serial || 'Belge'} tahsil edildi olarak işaretlensin mi?`))) return; x.cheque = 'tahsil'; x.clearedAt = new Date().toISOString(); db.log('Çek tahsil', `${x.serial || ''} · ${money(x.amount)}`); db.save(); draw(); });
    on(el, 'click', '[data-act=kw]', async (e, b) => { if (!(await confirm('Çek karşılıksız olarak işaretlensin ve tutar müşterinin borcuna eklensin mi?'))) return; const x = db.get('payments', b.dataset.id); x.cheque = 'karsiliksiz'; x.bouncedAt = new Date().toISOString(); const c = cus(x.customer); c.balance = r2((c.balance || 0) + x.amount); db.log('Karşılıksız çek', `${c.name} · ${x.serial || ''} · ${money(x.amount)}`); fresh(); db.save(); draw(); });
    draw();
  }
  function returnsPage(el, p, app) {
    const R = db.all('returns', (r) => !myRep() || r.rep === myRep()).sort((a, b) => b.at.localeCompare(a.at));
    el.innerHTML = pageHead('İadeler', 'Teslim edilen siparişlerden alınan iadeler. Yeni iade için siparişi açın.') + `<div class="card">${table({ rows: R.slice(0, 300), emptyIcon: 'refresh', empty: 'Henüz iade yok', columns: [{ label: 'İade', render: (r) => `<b class="mono">${esc(r.no)}</b><div class="small faint">${NS.dt(r.at)} · ${esc(r.orderNo)}</div>` }, { label: 'Cari', render: (r) => esc(cus(r.customer).name) }, { label: 'Neden', render: (r) => `${esc(r.reason)}<div class="small faint">${r.restock ? 'Stoğa döndü' : 'Stoğa girmedi'}</div>` }, { label: 'Kalem', cls: 'right', render: (r) => r.lines.length }, { label: 'Fatura', render: (r) => (r.invoice ? badge(`${r.invoice.test ? 'TEST ' : ''}${r.invoice.no}`, r.invoice.test ? 'warn' : 'ok') : (db.get('orders', r.order) || {}).invoice && !db.get('orders', r.order).invoice.test ? `<button class="btn sm" data-rf="${r.id}">İade faturası</button>` : '<span class="small faint">Satış faturası yok</span>') }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.total)}</b>` }], foot: `${R.length} iade · ${money(sum(R, (r) => r.total))}` })}</div>`;
    on(el, 'click', '[data-rf]', (e, b) => refundInvoice(app, db.get('returns', b.dataset.rf)));
  }
  function repsPage(el, p, app) {
    const users = () => db.all('users', (u) => u.role === 'plasiyer');
    NS.crud(el, app, { col: 'reps', title: 'Plasiyerler', sub: 'Plasiyer, araç, aylık hedef ve kullanıcı bağlantısı', single: 'Plasiyer', addLabel: 'Plasiyer ekle', emptyIcon: 'map', sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      fields: () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel' }, { name: 'plate', label: 'Araç plakası' }, { name: 'target', label: 'Aylık hedef (₺)', type: 'number' }, { name: 'discMax', label: 'İskonto sınırı % (boşsa genel ayar)', type: 'number' }, { name: 'user', label: 'Kullanıcı hesabı', type: 'select', options: [{ value: '', label: 'Bağlı değil' }, ...users().map((u) => ({ value: u.id, label: u.name }))] }],
      beforeSave: (v, rec) => { v.target = Number(v.target) || 0; if (v.user && db.find('reps', (r) => r.user === v.user && (!rec || r.id !== rec.id))) return 'Bu kullanıcı başka bir plasiyere bağlı'; },
      canDelete: (r) => (db.find('customers', (c) => c.rep === r.id) ? 'Bu plasiyere bağlı cari var. Önce carileri başka plasiyere aktarın.' : true),
      searchFields: (r) => [r.name, r.plate], columns: [{ key: 'name', label: 'Plasiyer', render: (r) => `<b>${esc(r.name)}</b><div class="small faint">${esc(r.phone || '')}</div>` }, { key: 'plate', label: 'Araç' }, { key: 'target', label: 'Aylık hedef', cls: 'right', render: (r) => money(r.target || 0) }, { label: 'Cari', cls: 'right', render: (r) => db.all('customers', (c) => c.rep === r.id).length }, { label: 'Kullanıcı', render: (r) => { const u = db.get('users', r.user); return u ? esc(u.name) : '<span class="faint">Bağlı değil</span>'; } }] });
  }

  // ---------- Cariler ----------
  function customersPage(el, p, app) {
    const mine = myRep();
    NS.crud(el, app, { col: 'customers', title: 'Cariler', sub: 'Risk limiti, fiyat listesi, rota günü ve ekstre', single: 'Cari', addLabel: 'Yeni cari', emptyIcon: 'building', rowsFilter: (c) => !mine || c.rep === mine,
      // Plasiyer limit, vade, liste ve plasiyer alanını değiştiremez; yeni carisi limitsiz açılır, siparişleri risk onayına düşer
      fields: (rec) => [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'email', label: 'e-Posta', type: 'email' }, { name: 'district', label: 'İlçe / bölge' }, { name: 'city', label: 'İl' }, { name: 'address', label: 'Adres', full: true }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'day', label: 'Rota günü', type: 'select', options: [1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: T.DAYS[d] })) }, ...(mine ? [] : [{ name: 'rep', label: 'Plasiyer', type: 'select', options: db.all('reps').map((r) => ({ value: r.id, label: r.name })) }, { name: 'list', label: 'Fiyat listesi', type: 'select', options: Object.entries(T.LISTS).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'limit', label: 'Risk limiti (₺)', type: 'number' }, { name: 'term', label: 'Vade (gün)', type: 'number' }, ...(rec ? [] : [{ name: 'balance', label: 'Açılış bakiyesi (₺)', type: 'number', step: '0.01' }])])],
      beforeSave: (v, rec) => { v.day = Number(v.day); if (mine) { v.rep = mine; if (!rec) Object.assign(v, { list: 'C', limit: 0, term: Number(S().defaultTerm) || 30 }); } else { v.limit = Number(v.limit) || 0; v.term = Number(v.term) || 0; } if (!rec) { v.balance = Number(v.balance) || 0; v.opening = v.balance; } },
      canDelete: (c) => (mine ? 'Cari silme yetkiniz yok' : db.find('orders', (o) => o.customer === c.id) || db.find('payments', (x) => x.customer === c.id) ? 'Bu carinin hareketi var; silinemez.' : (c.balance || 0) ? 'Bakiyesi olan cari silinemez.' : true),
      defaults: () => ({ list: 'C', limit: 25000, term: Number(S().defaultTerm) || 30, day: 1, balance: 0 }),
      searchFields: (c) => [c.name, c.contact, c.district],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'risk', label: 'Limit aşan', test: (c) => risk(c) }, { value: 'vade', label: 'Vadesi geçen', test: (c) => overdue(c) > 0 }],
      columns: [{ key: 'name', label: 'Cari', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.contact || '')} · ${esc(c.district || '')} · ${T.DAYS[c.day] || ''}</div>` }, { label: 'Plasiyer', render: (c) => esc(rep(c.rep).name) }, { key: 'list', label: 'Liste', render: (c) => badge(c.list, 'info') }, { key: 'balance', label: 'Bakiye', cls: 'right', render: (c) => `<b>${money(c.balance || 0)}</b><div class="small faint">limit ${money(c.limit)}</div>` }, { label: 'Vadesi geçen', cls: 'right', render: (c) => { const o = overdue(c); return o ? badge(money(o), 'err') : '<span class="faint">—</span>'; } }],
      extraActions: [{ icon: 'file', act: 'ext', title: 'Ekstre' }, { icon: 'cash', act: 'pay', title: 'Tahsilat' }, { icon: 'globe', act: 'b2b', title: 'Bayi portalı bilgisini gönder' }],
      onAction: (a, c) => {
        if (a === 'pay') return collect(app, c.id);
        if (a === 'b2b') { NS.portalCode(db, c); NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName} bayi sipariş sayfası: ${location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '')}bayi.html — Telefon: ${c.phone} Kod: ${T.code(c)}` }, true).result.then((res) => toast(NS.smsText(res, 'Bayi portalı SMS'), NS.smsTone(res))); return; }
        NS.docs.print('ekstre', statementDoc(c));
      } });
    if (!mine) importBtn(el, () => importCustomers(app));
  }
  // Excel/CSV aktarımı: başlıklar eşleştirilir, kod (ürün) veya VKN/ünvan (cari) ile var olan güncellenir; önce özet gösterilir
  const nrm = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
  const numOf = (v) => { if (typeof v === 'number') return v; const t = String(v == null ? '' : v).trim(); return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t) || 0; };
  async function importSheet(app, cfg) {
    let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada satır yok', 'err');
    const keys = Object.keys(f.rows[0]); const col = {}; Object.entries(cfg.cols).forEach(([k, al]) => { const h = keys.find((x) => al.includes(nrm(x))); if (h) col[k] = h; });
    const miss = cfg.req.filter((k) => !col[k]); if (miss.length) return toast(`Gerekli sütun bulunamadı: ${miss.map((k) => cfg.cols[k][0]).join(', ')}`, 'err');
    const errs = []; const plan = []; f.rows.forEach((r, i) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : undefined); const x = cfg.row(g, r, col); if (typeof x === 'string') return errs.push(`Satır ${i + 2}: ${x}`); plan.push(x); });
    const upd = plan.filter((x) => x.ex).length; if (!(await confirm(`${plan.length - upd} yeni, ${upd} güncelleme${errs.length ? `, ${errs.length} hatalı satır atlanacak (ilki: ${errs[0]})` : ''}. Aktarılsın mı?`))) return;
    plan.forEach((x) => { if (x.ex) Object.assign(x.ex, x.v); else db.data[cfg.col].push({ id: NS.uid(), created: new Date().toISOString(), ...cfg.defaults(), ...x.v }); }); db.log('Excel aktarımı', `${cfg.col}: ${plan.length} kayıt`); db.save(); toast(`${plan.length} kayıt aktarıldı`, 'ok'); app.refresh();
  }
  const importBtn = (el, fn) => { const b = $('[data-export]', el); if (b) { b.insertAdjacentHTML('beforebegin', `<button class="btn" id="imp">${icon('upload')} Excel'den al</button>`); $('#imp', el).onclick = fn; } };
  const importCustomers = (app) => importSheet(app, { col: 'customers', req: ['name'], cols: { name: ['ünvan', 'unvan', 'cari', 'cariadı', 'firma', 'müşteri', 'ad'], phone: ['telefon', 'tel', 'gsm', 'cep'], taxNo: ['vkn', 'vergino', 'tckn', 'vergikimlikno'], taxOffice: ['vergidairesi'], contact: ['yetkili'], email: ['eposta', 'email', 'mail'], district: ['ilçe', 'bölge'], city: ['il', 'şehir'], address: ['adres'], limit: ['limit', 'risklimiti'], term: ['vade'], list: ['liste', 'fiyatlistesi'], balance: ['bakiye', 'açılışbakiyesi'] },
    defaults: () => ({ list: 'C', limit: 0, term: Number(S().defaultTerm) || 30, day: 1, balance: 0, rep: (db.all('reps')[0] || {}).id }),
    row: (g) => { const name = g('name'); if (!name) return 'ünvan boş'; const list = (g('list') || '').toUpperCase(); if (list && !T.LISTS[list]) return `fiyat listesi "${list}" tanımsız`; const tax = (g('taxNo') || '').replace(/\D/g, ''); const ex = db.find('customers', (c) => (tax && c.taxNo === tax) || nrm(c.name) === nrm(name)); const v = { name }; ['phone', 'taxOffice', 'contact', 'email', 'district', 'city', 'address'].forEach((k) => { if (g(k)) v[k] = g(k); }); if (tax) v.taxNo = tax; if (list) v.list = list; if (g('limit')) v.limit = numOf(g('limit')); if (g('term')) v.term = numOf(g('term')); if (!ex && g('balance')) { v.balance = numOf(g('balance')); v.opening = v.balance; } return { ex, v }; } });
  const importProducts = (app) => importSheet(app, { col: 'products', req: ['code', 'name', 'price'], cols: { code: ['kod', 'ürünkodu', 'stokkodu'], name: ['ürün', 'ürünadı', 'ad', 'stokadı'], price: ['fiyat', 'satış', 'satışfiyatı', 'alistefiyatı'], barcode: ['barkod'], cat: ['kategori', 'grup'], pack: ['koliiçi', 'koli', 'koliiçiadet'], cost: ['alış', 'maliyet', 'alışfiyatı'], vat: ['kdv'], stock: ['stok', 'miktar', 'adet'], min: ['kritikstok', 'kritik'] },
    defaults: () => ({ pack: 1, vat: 20, stock: 0, min: 0, cost: 0, cat: 'Genel' }),
    row: (g) => { const code = g('code'); const name = g('name'); if (!code || !name) return 'kod veya ad boş'; const price = numOf(g('price')); if (price <= 0) return 'fiyat geçersiz'; const ex = db.find('products', (p) => String(p.code) === code); const v = { code, name, price }; if (g('barcode')) v.barcode = g('barcode'); if (g('cat')) v.cat = g('cat'); ['cost', 'stock', 'min'].forEach((k) => { if (g(k)) v[k] = numOf(g(k)); }); if (g('pack')) v.pack = Math.max(1, numOf(g('pack'))); if (g('vat')) v.vat = numOf(g('vat')); return { ex, v }; } });
  function promosPage(el, p, app) {
    const name = (id) => (prod(id) || {}).name || '-';
    NS.crud(el, app, { col: 'promos', title: 'Kampanyalar', sub: 'Mal fazlası: belirli adede bedelsiz ürün. Sipariş ve bayi portalına kendiliğinden yansır.', single: 'Kampanya', addLabel: 'Kampanya ekle', emptyIcon: 'sparkles',
      fields: () => [{ name: 'name', label: 'Kampanya adı', required: true, full: true }, { name: 'pid', label: 'Ürün', type: 'select', required: true, options: db.all('products').slice(0, 500).map((x) => ({ value: x.id, label: x.name })) }, { name: 'buy', label: 'Alınan adet', type: 'number', required: true }, { name: 'free', label: 'Bedelsiz adet', type: 'number', required: true }, { name: 'start', label: 'Başlangıç', type: 'date' }, { name: 'end', label: 'Bitiş', type: 'date' }, { name: 'active', label: 'Etkin', type: 'checkbox' }],
      defaults: () => ({ active: true, start: today() }), beforeSave: (v) => { v.buy = Number(v.buy) || 0; v.free = Number(v.free) || 0; if (v.buy < 1 || v.free < 1) return 'Alınan ve bedelsiz adet en az 1 olmalı'; if (v.start && v.end && v.end < v.start) return 'Bitiş başlangıçtan önce olamaz'; },
      searchFields: (x) => [x.name, name(x.pid)], columns: [{ key: 'name', label: 'Kampanya', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(name(x.pid))}</div>` }, { label: 'Koşul', render: (x) => `${x.buy} alana ${x.free} bedava` }, { label: 'Tarih', render: (x) => `${x.start ? NS.date(x.start) : '—'} – ${x.end ? NS.date(x.end) : '—'}` }, { label: 'Durum', render: (x) => (T.promoOf([x], x.pid, today()) ? badge('Geçerli', 'ok') : badge('Geçersiz', '')) }] });
  }
  function productsPage(el, p, app) {
    let kat = null;
    NS.crud(el, app, { col: 'products', title: 'Ürünler & Stok', sub: 'Koli içi adet ve fiyat listeleri (A taban, B +%4, C +%8)', single: 'Ürün', addLabel: 'Ürün ekle', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'barcode', label: 'Barkod' }, { name: 'name', label: 'Ürün', required: true, full: true }, { name: 'cat', label: 'Kategori' }, { name: 'pack', label: 'Koli içi adet', type: 'number' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'A liste fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'vat', label: 'KDV %', type: 'select', options: ['1', '10', '20'] }, { name: 'stock', label: 'Stok (adet)', type: 'number' }, { name: 'min', label: 'Kritik stok', type: 'number' }],
      formOpen: (b) => { kat = NS.katalog.formaBagla(b, { barkod: 'barcode', ad: 'name', kategori: 'cat' }); },
      beforeSave: (v, rec) => { v.vat = Number(v.vat); ['pack', 'cost', 'price', 'stock', 'min'].forEach((k) => { v[k] = Number(v[k]) || 0; }); if (v.pack < 1) v.pack = 1; if (!rec && v.barcode && !(kat && kat.hit)) NS.katalog.oner([{ gtin: v.barcode, ad: v.name, kategori: v.cat }]); },
      canDelete: (x) => (db.find('orders', (o) => T.OPEN.concat('sevk').includes(o.status) && o.lines.some((l) => l.pid === x.id)) ? 'Bu ürün açık siparişte; silinemez.' : true),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'az', label: 'Kritik stok', test: (x) => x.stock <= (x.min || 0) }],
      searchFields: (x) => [x.code, x.name, x.cat, x.barcode],
      columns: [{ key: 'name', label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.code)} · ${esc(x.cat)}</div>` }, { key: 'pack', label: 'Koli içi', cls: 'right' }, { key: 'stock', label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= (x.min || 0) ? 'err' : 'text'})">${x.stock}</b><div class="small faint">${Math.floor(x.stock / (x.pack || 1))} koli</div>` }, { label: 'A / B / C', cls: 'right', render: (x) => `${money(T.price(x, 'A'))}<div class="small faint">${money(T.price(x, 'B'))} · ${money(T.price(x, 'C'))}</div>` }, { label: 'Marj', cls: 'right', render: (x) => '%' + Math.round(((x.price - x.cost) / (x.price || 1)) * 100) }] });
    importBtn(el, () => importProducts(app));
  }

  // ---------- Özet & raporlar ----------
  function dashboard(el, p, app) {
    const all = db.all('orders', (o) => o.status !== 'iptal'); const t = today();
    const tod = all.filter((o) => iso(o.at) === t); const m30 = all.filter((o) => o.at > addDays(new Date(), -30).toISOString());
    const C = db.all('customers'); const od = sum(C, overdue);
    const ser = NS.dailySeries(all, 14, 'at', (o) => T.orderTotal(o).total); const moR = NS.groupBy(all.filter((o) => o.at.slice(0, 7) === t.slice(0, 7)), (o) => o.rep);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/sevkiyat">${icon('truck')} Sevkiyat</a><button class="btn primary" id="new">${icon('plus')} Sipariş</button>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü sipariş', money(sum(tod, (o) => T.orderTotal(o).total)), 'cart', '', `<div class="small faint">${tod.length} sipariş · ${tod.filter((o) => o.src === 'b2b').length} portaldan</div>`)}${kpi('Risk onayı bekleyen', all.filter((o) => o.status === 'onay').length, 'alert', 'err')}${kpi('Toplam alacak', money(sum(C, (c) => Math.max(0, c.balance))), 'wallet', 'info', `<div class="small faint">vadesi geçen ${money(od)}</div>`)}${kpi('30 gün satış', money(sum(m30, (o) => T.orderTotal(o).total)), 'trend', 'ok')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün satış</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div><div class="card"><div class="card-h"><h3>Sipariş kaynağı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => o.src)).map(([k, v]) => ({ label: T.SRC[k], value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Plasiyer performansı (bu ay)</h3></div>${table({ rows: db.all('reps').map((r) => { const mo = moR[r.id] || []; const s = sum(mo, (o) => T.orderTotal(o).total); return { id: r.id, r, s, c: sum(db.all('payments', (x) => x.rep === r.id && x.cheque !== 'karsiliksiz' && x.at.slice(0, 7) === t.slice(0, 7)), (x) => x.amount), pct: Math.round((s / (r.target || 1)) * 100) }; }), columns: [{ label: 'Plasiyer', render: (x) => `<b>${esc(x.r.name)}</b>` }, { label: 'Satış', cls: 'right', render: (x) => money(x.s) }, { label: 'Hedef', cls: 'right', render: (x) => badge('%' + x.pct, x.pct >= 80 ? 'ok' : x.pct >= 50 ? 'warn' : 'err') }, { label: 'Tahsilat', cls: 'right', render: (x) => money(x.c) }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Vadesi geçenler</h3><a class="btn sm" href="#/cariler">Cariler</a></div>${table({ rows: C.map((c) => ({ id: c.id, c, o: overdue(c) })).filter((x) => x.o > 0).sort((a, b) => b.o - a.o).slice(0, 8), empty: 'Vadesi geçen alacak yok', columns: [{ label: 'Cari', render: (x) => `<b>${esc(x.c.name)}</b><div class="small faint">${esc(rep(x.c.rep).name)}</div>` }, { label: 'Vadesi geçen', cls: 'right', render: (x) => `<b style="color:var(--err)">${money(x.o)}</b>` }] })}</div></div>`;
    $('#new', el).onclick = () => orderForm(app);
  }
  function reportsPage(el) {
    const C = db.all('customers'); const now = Date.now();
    const age = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const byC = NS.groupBy(db.all('orders', (o) => ['sevk', 'teslim'].includes(o.status)), (o) => o.customer);
    C.forEach((c) => { const L = (byC[c.id] || []).sort((a, b) => b.at.localeCompare(a.at)); let rem = Math.max(0, c.balance); L.forEach((o) => { if (rem <= 0) return; const t = Math.min(rem, T.orderTotal(o).total); rem -= t; const d = (now - new Date(o.at)) / 864e5; age[d <= 30 ? '0-30' : d <= 60 ? '31-60' : d <= 90 ? '61-90' : '90+'] += t; }); });
    const m30 = db.all('orders', (o) => o.status !== 'iptal' && o.at > addDays(new Date(), -30).toISOString());
    // Kayıp müşteri: daha önce alıp 45 gündür sipariş vermeyen. Ziyaret uyumu: son 30 günün rota günlerinde beklenen ziyarete karşı yapılan ziyaret.
    const lastAt = {}; db.all('orders', (o) => o.status !== 'iptal').forEach((o) => { if (!lastAt[o.customer] || o.at > lastAt[o.customer]) lastAt[o.customer] = o.at; });
    const lost = C.filter((c) => lastAt[c.id] && lastAt[c.id] < addDays(new Date(), -45).toISOString()).sort((a, b) => lastAt[a.id].localeCompare(lastAt[b.id]));
    const dayN = {}; for (let i = 0; i < 30; i++) { const d = addDays(new Date(), -i).getDay(); dayN[d] = (dayN[d] || 0) + 1; } const since = addDays(new Date(), -30).toISOString(); const vis = {}; db.all('visits', (v) => v.at > since).forEach((v) => { (vis[v.rep] = vis[v.rep] || new Set()).add(`${v.customer}|${iso(v.at)}`); });
    const comp = db.all('reps').map((r) => { const exp = sum(C.filter((c) => c.rep === r.id), (c) => dayN[c.day] || 0); const got = (vis[r.id] || new Set()).size; return { id: r.id, r, exp, got, pct: exp ? Math.round((got / exp) * 100) : 0, net: sum(db.all('returns', (x) => x.rep === r.id && x.at > since), (x) => x.total) }; });
    const top = Object.values(m30.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { id: l.pid, name: l.name, qty: 0, t: 0 }; m[l.pid].qty += l.qty; m[l.pid].t += l.qty * l.price * (1 - (l.disc || 0) / 100); return m; }, {})).sort((a, b) => b.t - a.t);
    el.innerHTML = pageHead('Raporlar', 'Alacak yaşlandırma, ürün ve müşteri analizi') + `<div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Alacak yaşlandırma</h3></div><div class="card-b">${chart.bars(Object.entries(age).map(([label, value]) => ({ label: label + ' gün', value })))}</div></div><div class="card"><div class="card-h"><h3>Kategori satışı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30.flatMap((o) => o.lines), (l) => (prod(l.pid) || {}).cat || '-')).map(([label, v]) => ({ label, value: sum(v, (l) => l.qty * l.price * (1 - (l.disc || 0) / 100)) })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>En çok satan ürünler</h3></div>${table({ rows: top.slice(0, 10), columns: [{ label: 'Ürün', render: (x) => esc(x.name) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Tutar', cls: 'right', render: (x) => money(x.t) }] })}</div><div class="card"><div class="card-h"><h3>En büyük müşteriler</h3></div>${table({ rows: Object.entries(NS.groupBy(m30, (o) => o.customer)).map(([id, L]) => ({ id, c: cus(id), t: sum(L, (o) => T.orderTotal(o).total) })).sort((a, b) => b.t - a.t).slice(0, 10), columns: [{ label: 'Cari', render: (x) => esc(x.c.name) }, { label: '30 gün', cls: 'right', render: (x) => money(x.t) }] })}</div></div>
      <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Kayıp müşteri riski (45+ gün)</h3></div>${table({ rows: lost.slice(0, 15), empty: 'Kayıp riski olan müşteri yok', columns: [{ label: 'Cari', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(rep(c.rep).name)}</div>` }, { label: 'Son sipariş', cls: 'right', render: (c) => NS.date(lastAt[c.id]) }] })}</div><div class="card"><div class="card-h"><h3>Ziyaret uyumu ve iade (30 gün)</h3></div>${table({ rows: comp, columns: [{ label: 'Plasiyer', render: (x) => `<b>${esc(x.r.name)}</b>` }, { label: 'Ziyaret', cls: 'right', render: (x) => `${x.got} / ${x.exp}` }, { label: 'Uyum', cls: 'right', render: (x) => badge('%' + x.pct, x.pct >= 80 ? 'ok' : x.pct >= 50 ? 'warn' : 'err') }, { label: 'İade', cls: 'right', render: (x) => money(x.net) }] })}</div></div>`;
  }

  const ROLES = { admin: 'Patron / yönetici', ofis: 'Ofis / muhasebe', plasiyer: 'Plasiyer (saha)', depo: 'Depo / sevkiyat' };
  const app = NS.shell({
    id: 'toptan', integrations: ['sms', 'whatsapp', 'efatura', 'eirsaliye', 'banka', 'muhasebeaktar', 'printer', 'gps', 'webhook', 'backup'], name: 'Toptancı & Plasiyer', tagline: 'Saha satış ve dağıtım', icon: 'truck', accent: '#15803d', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Satış' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['ofis'] }, { id: 'siparisler', label: 'Siparişler', icon: 'cart', badge: true, roles: ['ofis', 'plasiyer', 'depo'] }, { id: 'plasiyer', label: 'Plasiyer Ekranı', icon: 'map', roles: ['ofis', 'plasiyer'] }, { id: 'sevkiyat', label: 'Sevkiyat', icon: 'truck', roles: ['ofis', 'depo'] }, { id: 'iadeler', label: 'İadeler', icon: 'refresh', roles: ['ofis', 'plasiyer', 'depo'] }, { id: 'plasiyerler', label: 'Plasiyerler', icon: 'users', roles: ['admin'] }, { sec: 'Finans' }, { id: 'tahsilat', label: 'Tahsilat & Çek', icon: 'cash', roles: ['ofis'] }, { id: 'cariler', label: 'Cariler', icon: 'building', roles: ['ofis', 'plasiyer'] }, { sec: 'Depo' }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box', roles: ['ofis', 'depo'] }, { id: 'kampanyalar', label: 'Kampanyalar', icon: 'sparkles', roles: ['ofis'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'onay').length }),
    routes: { ozet: dashboard, siparisler: ordersPage, plasiyer: repPage, sevkiyat: shipPage, iadeler: returnsPage, plasiyerler: repsPage, tahsilat: payPage, cariler: customersPage, urunler: productsPage, kampanyalar: promosPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Satış kuralları' }, { name: 'minOrder', label: 'En az sipariş tutarı (₺)', type: 'number' }, { name: 'defaultTerm', label: 'Varsayılan vade (gün)', type: 'number' }, { name: 'discMax', label: 'Plasiyer iskonto sınırı (%)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }] }) },
  });
  if (myRep() && !location.hash) app.go('plasiyer');
})();
