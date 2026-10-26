/* NEBSOFT Toptancı & Plasiyer — saha siparişi, bayi B2B portalı, risk limiti, rota/araç yükleme,
   tahsilat ve çek portföyü, cari ekstre ve yaşlandırma, plasiyer performansı */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const T = window.TPT;
  const db = new NS.DB('toptan', T.seed);
  const S = () => db.settings({});
  const cus = (id) => db.get('customers', id) || { name: '-', limit: 0, balance: 0 };
  const rep = (id) => db.get('reps', id) || { name: '-' };
  const prod = (id) => db.get('products', id);
  const stB = (s) => badge(T.ST[s][0], T.ST[s][1]);
  const myRep = () => (NS.currentUser && NS.currentUser.role === 'plasiyer' ? NS.currentUser.rep : null);
  const risk = (c, extra = 0) => (c.balance || 0) + extra > (c.limit || 0);
  const overdue = (c) => { const L = db.all('orders', (o) => o.customer === c.id && o.status === 'teslim').sort((a, b) => a.at.localeCompare(b.at)); let paid = sum(db.all('payments', (p) => p.customer === c.id), (p) => p.amount); let od = 0; L.forEach((o) => { const t = T.orderTotal(o).total; const use = Math.min(paid, t); paid -= use; if (t - use > 0.01 && addDays(new Date(o.at), c.term || 30) < new Date()) od += t - use; }); return Math.round(od * 100) / 100; };

  // ---------- Sipariş formu (ofis / plasiyer) ----------
  async function orderForm(app, customerId, src) {
    const c = customerId ? cus(customerId) : null;
    let cid = c ? c.id : ''; const qty = {};
    const m = modal({ title: 'Yeni sipariş', size: 'wide', body: `<div class="row mb" style="gap:8px;flex-wrap:wrap"><select class="input" id="oc" style="max-width:320px">${db.all('customers', (x) => !myRep() || x.rep === myRep()).map((x) => `<option value="${x.id}" ${x.id === cid ? 'selected' : ''}>${esc(x.name)} · ${esc(x.district)}</option>`).join('')}</select><input class="input" id="oq" placeholder="Ürün ara..." style="max-width:220px"><span class="grow"></span><div id="ri"></div></div><div id="pl" style="max-height:52vh;overflow:auto"></div><div class="row mt" style="justify-content:flex-end;gap:16px" id="ot"></div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Siparişi kaydet', cls: 'primary', icon: 'check', onClick: (close) => save(close) }] });
    const R = m.root; cid = cid || $('#oc', R).value;
    const lines = () => Object.entries(qty).filter(([, q]) => q > 0).map(([pid, q]) => { const p = prod(pid); return { pid, name: p.name, qty: q, price: T.price(p, cus(cid).list), vat: p.vat, disc: 0 }; });
    const draw = () => {
      const c2 = cus(cid); const q = ($('#oq', R).value || '').trim();
      $('#ri', R).innerHTML = `${badge(T.LISTS[c2.list][0].split(' — ')[0] + ' listesi', 'info')} ${risk(c2) ? badge('Limit aşıldı', 'err') : badge(`Limit kalan ${money(c2.limit - c2.balance)}`, 'ok')} ${overdue(c2) ? badge('Vadesi geçen ' + money(overdue(c2)), 'err') : ''}`;
      $('#pl', R).innerHTML = `<table class="tbl"><thead><tr><th>Ürün</th><th class="right">Koli içi</th><th class="right">Stok</th><th class="right">Fiyat</th><th class="right" style="width:150px">Adet</th></tr></thead><tbody>${db.all('products', (p) => NS.match(q, p.name, p.code, p.cat)).map((p) => `<tr><td><b>${esc(p.name)}</b><div class="small faint">${esc(p.code)} · ${esc(p.cat)}</div></td><td class="right">${p.pack}</td><td class="right" style="color:var(--${p.stock < p.pack ? 'err' : 'text'})">${p.stock}</td><td class="right">${money(T.price(p, c2.list))}</td><td class="right"><div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm ghost icon" data-k="-1" data-p="${p.id}">${icon('minus')}</button><input class="input" data-q="${p.id}" value="${qty[p.id] || ''}" inputmode="numeric" style="width:56px;height:32px;text-align:right"><button class="btn sm ghost icon" data-k="1" data-p="${p.id}" title="1 koli">${icon('plus')}</button></div></td></tr>`).join('')}</tbody></table>`;
      tot();
    };
    const tot = () => { const t = T.orderTotal({ lines: lines() }); const c2 = cus(cid); $('#ot', R).innerHTML = `<span class="muted">${lines().length} kalem</span><span>KDV ${money(t.vat)}</span><b style="font-size:20px">${money(t.total)}</b>${risk(c2, t.total) ? badge('Risk limiti aşılacak — onaya düşer', 'err') : ''}`; };
    function save(close) {
      const L = lines(); if (!L.length) return toast('Ürün ekleyin', 'err'); const c2 = cus(cid); const t = T.orderTotal({ lines: L });
      if (t.total < (Number(S().minOrder) || 0)) return toast(`En az sipariş tutarı ${money(S().minOrder)}`, 'err');
      const o = db.insert('orders', { no: 'S' + (7000 + db.all('orders').length), customer: cid, rep: c2.rep, src: src || (myRep() ? 'saha' : 'ofis'), at: new Date().toISOString(), lines: L, status: risk(c2, t.total) || overdue(c2) ? 'onay' : 'yeni', note: '' });
      toast(o.status === 'onay' ? `${o.no} risk onayına düştü` : `${o.no} kaydedildi · ${money(t.total)}`, o.status === 'onay' ? 'err' : 'ok'); close(); app.refresh();
    }
    $('#oc', R).onchange = (e) => { cid = e.target.value; draw(); };
    $('#oq', R).oninput = draw;
    on(R, 'click', '[data-k]', (e, b) => { const p = prod(b.dataset.p); qty[p.id] = Math.max(0, (qty[p.id] || 0) + Number(b.dataset.k) * p.pack); $(`[data-q="${p.id}"]`, R).value = qty[p.id] || ''; tot(); });
    on(R, 'input', '[data-q]', (e, b) => { qty[b.dataset.q] = Math.max(0, Number(b.value) || 0); tot(); });
    draw();
  }

  // ---------- Sipariş detay ----------
  function orderModal(app, o) {
    const c = cus(o.customer); const t = T.orderTotal(o);
    modal({ title: `${o.no} · ${c.name}`, size: 'wide', body: `<div class="row mb">${stB(o.status)} ${badge(T.SRC[o.src], 'info')} <span class="small muted">${NS.dt(o.at)} · ${esc(rep(o.rep).name)}</span></div>
      ${o.status === 'onay' ? `<div class="card pad mb" style="border-color:var(--err)"><b>Risk kontrolü</b><div class="small">Bakiye ${money(c.balance)} + sipariş ${money(t.total)} · limit ${money(c.limit)}${overdue(c) ? ` · vadesi geçen ${money(overdue(c))}` : ''}</div></div>` : ''}
      ${table({ rows: o.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => esc(l.name) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Fiyat', cls: 'right', render: (l) => money(l.price) }, { label: 'İsk.', cls: 'right', render: (l) => (l.disc ? '%' + l.disc : '') }, { label: 'Tutar', cls: 'right', render: (l) => money(l.qty * l.price * (1 - (l.disc || 0) / 100)) }] })}
      <div class="row mt" style="justify-content:flex-end;gap:16px"><span>Ara toplam ${money(t.net)}</span><span>KDV ${money(t.vat)}</span><b style="font-size:20px">${money(t.total)}</b></div>`,
      actions: [{ label: 'Yazdır', icon: 'print', onClick: () => printDoc(o) },
        ...(o.status === 'onay' && (NS.app.can('admin')) ? [{ label: 'Riske rağmen onayla', cls: 'primary', onClick: (cl) => { o.status = 'yeni'; o.note = `Risk onayı: ${(NS.currentUser || {}).name}`; db.save(); cl(); app.refresh(); } }] : []),
        ...(['yeni', 'onay'].includes(o.status) ? [{ label: 'İptal', cls: 'danger', onClick: async (cl) => { if (await confirm('Sipariş iptal edilsin mi?')) { o.status = 'iptal'; db.save(); cl(); app.refresh(); } } }] : []),
        ...(o.status === 'sevk' ? [{ label: 'Teslim edildi', cls: 'primary', icon: 'check', onClick: (cl) => { o.status = 'teslim'; o.deliveredAt = new Date().toISOString(); db.save(); cl(); app.refresh(); } }] : [])] });
  }
  function printDoc(o) {
    const c = cus(o.customer), t = T.orderTotal(o);
    NS.printHtml(`<div class="doc"><table><tr><td><h2>${esc(S().bizName)}</h2><div>${esc(S().bizAddress || '')}</div><div>${esc(S().bizPhone || '')}</div></td><td style="text-align:right"><h2>${o.status === 'sevk' || o.status === 'teslim' ? 'SEVK İRSALİYESİ' : 'SİPARİŞ FİŞİ'}</h2><div>${esc(o.no)} · ${NS.date(o.at)}</div></td></tr></table><hr><b>${esc(c.name)}</b> · ${esc(c.district || '')} · VKN ${esc(c.taxNo || '')}
      <table><tr><th>Ürün</th><th style="text-align:right">Adet</th><th style="text-align:right">Koli</th><th style="text-align:right">Fiyat</th><th style="text-align:right">Tutar</th></tr>${o.lines.map((l) => `<tr><td>${esc(l.name)}</td><td style="text-align:right">${l.qty}</td><td style="text-align:right">${(prod(l.pid) || {}).pack ? (l.qty / prod(l.pid).pack).toFixed(1) : ''}</td><td style="text-align:right">${money(l.price)}</td><td style="text-align:right">${money(l.qty * l.price * (1 - (l.disc || 0) / 100))}</td></tr>`).join('')}
      <tr><td colspan="4">KDV</td><td style="text-align:right">${money(t.vat)}</td></tr><tr><td colspan="4"><b>TOPLAM</b></td><td style="text-align:right"><b>${money(t.total)}</b></td></tr></table><p>Önceki bakiye: ${money(c.balance)}</p><table><tr><td>Teslim eden</td><td>Teslim alan (kaşe/imza)</td></tr><tr><td style="height:50px"></td><td></td></tr></table></div>`, { title: o.no });
  }

  // ---------- Siparişler ----------
  function ordersPage(el, p, app) {
    let f = p || 'acik', q = ''; const mine = myRep();
    el.innerHTML = pageHead('Siparişler', 'Saha, bayi portalı ve ofis siparişleri', `<button class="btn primary" id="new">${icon('plus')} Yeni sipariş</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Sipariş no, müşteri...')}<div class="seg">${[['acik', 'Açık'], ['onay', 'Risk onayı'], ['sevk', 'Sevkte'], ['teslim', 'Teslim'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('orders', (o) => (!mine || o.rep === mine) && (f === 'all' || (f === 'acik' ? ['yeni', 'hazir', 'onay'].includes(o.status) : o.status === f)) && NS.match(q, o.no, cus(o.customer).name)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'cart', columns: [{ label: 'Sipariş', render: (o) => `<b class="mono">${esc(o.no)}</b><div class="small faint">${NS.dt(o.at)}</div>` }, { label: 'Müşteri', render: (o) => `<b>${esc(cus(o.customer).name)}</b><div class="small faint">${esc(cus(o.customer).district)}</div>` }, { label: 'Kaynak', render: (o) => `${badge(T.SRC[o.src], o.src === 'b2b' ? 'acc' : '')}<div class="small faint">${esc(rep(o.rep).name)}</div>` }, { label: 'Kalem', cls: 'right', render: (o) => o.lines.length }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(T.orderTotal(o).total)}</b>` }, { label: 'Durum', render: (o) => stB(o.status) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} sipariş · ${money(sum(r, (o) => T.orderTotal(o).total))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    $('#new', el).onclick = () => orderForm(app);
    draw();
  }

  // ---------- Sevkiyat / araç yükleme ----------
  function shipPage(el, p, app) {
    const ready = db.all('orders', (o) => ['yeni', 'hazir'].includes(o.status));
    const byRep = NS.groupBy(ready, (o) => o.rep);
    el.innerHTML = pageHead('Sevkiyat', 'Onaylı siparişler araç/rota bazında — yükleme listesi ve irsaliye') + `<div class="grid g3">${db.all('reps').map((r) => { const L = byRep[r.id] || []; const items = Object.values(L.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { ...l, qty: 0 }; m[l.pid].qty += l.qty; return m; }, {})); return `<div class="card"><div class="card-h"><div class="grow"><b>${esc(r.name)}</b><div class="small faint">${esc(r.plate)}</div></div>${badge(L.length + ' sipariş', L.length ? 'info' : '')}</div><div class="card-b col" style="gap:6px">${L.map((o) => `<div class="small row"><span class="grow">${esc(cus(o.customer).name)}</span><b>${money(T.orderTotal(o).total)}</b></div>`).join('') || '<span class="small faint">Bekleyen yok</span>'}
      ${L.length ? `<div class="small muted mt">${sum(items, (i) => i.qty / ((prod(i.pid) || {}).pack || 1)).toFixed(0)} koli · ${money(sum(L, (o) => T.orderTotal(o).total))}</div><div class="row mt"><button class="btn sm" data-ld="${r.id}">${icon('print')} Yükleme listesi</button><button class="btn sm primary" data-go="${r.id}">${icon('truck')} Yola çıkar</button></div>` : ''}</div></div>`; }).join('')}</div>`;
    on(el, 'click', '[data-ld]', (e, b) => { const L = byRep[b.dataset.ld]; const items = Object.values(L.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { ...l, qty: 0 }; m[l.pid].qty += l.qty; return m; }, {})); NS.printHtml(`<div class="doc"><h2>ARAÇ YÜKLEME LİSTESİ — ${esc(rep(b.dataset.ld).name)} · ${esc(rep(b.dataset.ld).plate)}</h2><div>${NS.dateLong(new Date())} · ${L.length} müşteri</div><table><tr><th>Ürün</th><th style="text-align:right">Adet</th><th style="text-align:right">Koli</th><th>✓</th></tr>${items.map((i) => `<tr><td>${esc(i.name)}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right"><b>${(i.qty / ((prod(i.pid) || {}).pack || 1)).toFixed(1)}</b></td><td>☐</td></tr>`).join('')}</table><h3>Teslimat sırası</h3><ol>${L.map((o) => `<li>${esc(cus(o.customer).name)} — ${esc(cus(o.customer).district)} — ${esc(o.no)}</li>`).join('')}</ol></div>`, { title: 'Yükleme' }); });
    on(el, 'click', '[data-go]', async (e, b) => { const L = byRep[b.dataset.go]; if (!(await confirm(`${L.length} sipariş sevke çıksın, stok düşsün ve irsaliyeler yazdırılsın mı?`))) return; L.forEach((o) => { o.status = 'sevk'; o.lines.forEach((l) => { const p2 = prod(l.pid); if (p2) p2.stock -= l.qty; }); const c = cus(o.customer); c.balance = Math.round((c.balance + T.orderTotal(o).total) * 100) / 100; }); db.save(); L.forEach(printDoc); toast(`${L.length} sipariş sevkte`, 'ok'); app.refresh(); });
  }

  // ---------- Plasiyer ekranı ----------
  function repPage(el, p, app) {
    const rid = myRep() || p || 'r1'; const r = rep(rid); const dow = new Date().getDay();
    const route = db.all('customers', (c) => c.rep === rid && c.day === dow);
    const visited = (c) => db.find('visits', (v) => v.customer === c.id && iso(v.at) === today());
    const todays = db.all('orders', (o) => o.rep === rid && iso(o.at) === today()); const col = db.all('payments', (x) => x.rep === rid && iso(x.at) === today());
    el.innerHTML = pageHead(`${r.name} — bugünkü rota`, `${T.DAYS[dow]} · ${route.length} müşteri`, myRep() ? '' : `<select class="input" id="rs">${db.all('reps').map((x) => `<option value="${x.id}" ${x.id === rid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`) + `
      <div class="grid g3 mb">${kpi('Sipariş', money(sum(todays, (o) => T.orderTotal(o).total)), 'cart', 'info', `<div class="small faint">${todays.length} adet</div>`)}${kpi('Tahsilat', money(sum(col, (x) => x.amount)), 'cash', 'ok')}${kpi('Ziyaret', `${route.filter(visited).length}/${route.length}`, 'map', 'warn')}</div>
      <div class="col" style="gap:10px">${route.map((c) => { const v = visited(c); const od = overdue(c); return `<div class="card pad"><div class="row"><div class="grow"><b>${esc(c.name)}</b> ${v ? badge(v.result, v.result === 'Sipariş alındı' ? 'ok' : '') : ''}<div class="small muted">${esc(c.contact)} · ${esc(c.district)} · <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div><div class="small mt">Bakiye <b>${money(c.balance)}</b>${od ? ` · ${badge('Vadesi geçen ' + money(od), 'err')}` : ''}</div></div><a class="btn sm ghost icon" target="_blank" href="https://maps.google.com/?q=${c.lat},${c.lng}" title="Yol tarifi">${icon('map')}</a></div>
        <div class="row mt" style="flex-wrap:wrap;gap:6px"><button class="btn sm primary" data-o="${c.id}">${icon('cart')} Sipariş</button><button class="btn sm" data-p="${c.id}">${icon('cash')} Tahsilat</button><button class="btn sm" data-n="${c.id}">Sipariş yok</button></div></div>`; }).join('') || '<div class="card pad muted">Bugün rotada müşteri yok.</div>'}</div>`;
    const visit = (cid, result) => { db.insert('visits', { customer: cid, rep: rid, at: new Date().toISOString(), result }); };
    on(el, 'click', '[data-o]', async (e, b) => { visit(b.dataset.o, 'Sipariş alındı'); orderForm(app, b.dataset.o, 'saha'); });
    on(el, 'click', '[data-p]', (e, b) => collect(app, b.dataset.p, rid));
    on(el, 'click', '[data-n]', async (e, b) => { const why = await NS.prompt('Neden sipariş alınamadı?', 'Stoğu var'); if (why === null) return; visit(b.dataset.n, why || 'Sipariş yok'); app.refresh(); });
    if ($('#rs', el)) $('#rs', el).onchange = (e) => app.go('plasiyer', e.target.value);
  }
  async function collect(app, cid, rid) {
    const c = cus(cid);
    const v = await formModal({ title: `Tahsilat — ${c.name} · bakiye ${money(c.balance)}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true, step: '0.01' }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Nakit', 'Havale', 'Kredi kartı', 'Çek', 'Senet'] }, { name: 'due', label: 'Çek/senet vadesi', type: 'date' }, { name: 'bank', label: 'Banka (çek)' }, { name: 'serial', label: 'Çek/senet no' }], values: { amount: Math.max(0, overdue(c) || c.balance), method: 'Nakit' } });
    if (!v) return; const amt = Number(v.amount) || 0;
    db.insert('payments', { customer: cid, rep: rid || c.rep, amount: amt, method: v.method, at: new Date().toISOString(), ...(['Çek', 'Senet'].includes(v.method) ? { due: v.due, bank: v.bank, serial: v.serial, cheque: 'portfoy' } : {}) });
    c.balance = Math.round((c.balance - amt) * 100) / 100; db.save();
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><b>${esc(S().bizName)}</b><br>TAHSİLAT MAKBUZU · ${NS.dt(new Date())}<hr>${esc(c.name)}<br>${esc(v.method)}${v.serial ? ' · No ' + esc(v.serial) : ''}${v.due ? ' · Vade ' + NS.date(v.due) : ''}<br><b style="font-size:16px">${money(amt)}</b><hr>Kalan bakiye: ${money(c.balance)}<br><br>Tahsil eden: ${esc((NS.currentUser || {}).name || '')}</div>`, { title: 'Makbuz' });
    toast('Tahsilat kaydedildi', 'ok'); app.refresh();
  }

  // ---------- Tahsilat & çek portföyü ----------
  function payPage(el, p, app) {
    el.innerHTML = pageHead('Tahsilat & Çek Portföyü', 'Plasiyer tahsilatları ve vadesi gelen çek/senetler') + `<div class="grid g-21"><div class="card"><div class="card-h"><h3>Son tahsilatlar</h3></div><div id="pt"></div></div><div class="card"><div class="card-h"><h3>Portföydeki çek / senet</h3></div><div id="ct"></div></div></div>`;
    const draw = () => {
      $('#pt', el).innerHTML = table({ rows: db.all('payments').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40), columns: [{ label: 'Tarih', render: (x) => NS.dt(x.at) }, { label: 'Müşteri', render: (x) => esc(cus(x.customer).name) }, { label: 'Plasiyer', render: (x) => esc(rep(x.rep).name.split(' ')[0]) }, { label: 'Yöntem', render: (x) => esc(x.method) }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(x.amount)}</b>` }] });
      $('#ct', el).innerHTML = table({ rows: db.all('payments', (x) => x.cheque === 'portfoy').sort((a, b) => a.due.localeCompare(b.due)), empty: 'Portföyde çek yok', columns: [{ label: 'Vade', render: (x) => (x.due < today() ? badge(NS.date(x.due), 'err') : x.due <= iso(addDays(new Date(), 7)) ? badge(NS.date(x.due), 'warn') : NS.date(x.due)) }, { label: 'Keşideci', render: (x) => `${esc(cus(x.customer).name)}<div class="small faint">${esc(x.bank || '')} · ${esc(x.serial || '')}</div>` }, { label: 'Tutar', cls: 'right', render: (x) => money(x.amount) }], actions: [{ icon: 'building', act: 'bank', title: 'Bankaya tahsile ver' }, { icon: 'alert', act: 'kw', title: 'Karşılıksız' }], foot: `Toplam ${money(sum(db.all('payments', (x) => x.cheque === 'portfoy'), (x) => x.amount))}` });
    };
    on(el, 'click', '[data-act=bank]', (e, b) => { db.update('payments', b.dataset.id, { cheque: 'bankada' }); draw(); toast('Çek bankaya tahsile verildi', 'ok'); });
    on(el, 'click', '[data-act=kw]', async (e, b) => { if (!(await confirm('Çek karşılıksız olarak işaretlensin ve tutar müşterinin borcuna eklensin mi?'))) return; const x = db.get('payments', b.dataset.id); x.cheque = 'karsiliksiz'; const c = cus(x.customer); c.balance += x.amount; db.save(); draw(); });
    draw();
  }

  // ---------- Cariler ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Cariler', sub: 'Risk limiti, fiyat listesi, rota günü ve ekstre', single: 'Cari', addLabel: 'Yeni cari', emptyIcon: 'building',
      fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'district', label: 'Bölge' }, { name: 'taxNo', label: 'VKN' }, { name: 'rep', label: 'Plasiyer', type: 'select', options: db.all('reps').map((r) => ({ value: r.id, label: r.name })) }, { name: 'day', label: 'Rota günü', type: 'select', options: [1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: T.DAYS[d] })) }, { name: 'list', label: 'Fiyat listesi', type: 'select', options: Object.entries(T.LISTS).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'limit', label: 'Risk limiti (₺)', type: 'number' }, { name: 'term', label: 'Vade (gün)', type: 'number' }],
      beforeSave: (v) => { v.day = Number(v.day); if (v.balance === undefined) v.balance = v.balance || 0; },
      defaults: { list: 'C', limit: 25000, term: 30, day: 1, balance: 0 },
      searchFields: (c) => [c.name, c.contact, c.district],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'risk', label: 'Limit aşan', test: (c) => risk(c) }, { value: 'vade', label: 'Vadesi geçen', test: (c) => overdue(c) > 0 }],
      columns: [{ key: 'name', label: 'Cari', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.contact || '')} · ${esc(c.district || '')} · ${T.DAYS[c.day] || ''}</div>` }, { label: 'Plasiyer', render: (c) => esc(rep(c.rep).name) }, { key: 'list', label: 'Liste', render: (c) => badge(c.list, 'info') }, { key: 'balance', label: 'Bakiye', cls: 'right', render: (c) => `<b>${money(c.balance || 0)}</b><div class="small faint">limit ${money(c.limit)}</div>` }, { label: 'Vadesi geçen', cls: 'right', render: (c) => { const o = overdue(c); return o ? badge(money(o), 'err') : '<span class="faint">—</span>'; } }],
      extraActions: [{ icon: 'file', act: 'ext', title: 'Ekstre' }, { icon: 'cash', act: 'pay', title: 'Tahsilat' }, { icon: 'globe', act: 'b2b', title: 'Bayi portalı bilgisini gönder' }],
      onAction: (a, c) => {
        if (a === 'pay') return collect(app, c.id);
        if (a === 'b2b') { NS.smsLog(db, { to: c.phone, name: c.name, text: `${S().bizName} bayi sipariş sayfası: ${location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '')}bayi.html — Telefon: ${c.phone} Kod: ${T.code(c)}` }, true); return toast('Bayi portalı bilgisi gönderildi', 'ok'); }
        const mv = [...db.all('orders', (o) => o.customer === c.id && ['sevk', 'teslim'].includes(o.status)).map((o) => ({ at: o.at, d: `Satış ${o.no}`, b: T.orderTotal(o).total, a: 0 })), ...db.all('payments', (x) => x.customer === c.id).map((x) => ({ at: x.at, d: `Tahsilat (${x.method})`, b: 0, a: x.amount }))].sort((x, y) => x.at.localeCompare(y.at));
        let bal = (c.balance || 0) - sum(mv, (m) => m.b - m.a);
        NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>CARİ HESAP EKSTRESİ — ${esc(c.name)}</h3><table><tr><th>Tarih</th><th>Açıklama</th><th style="text-align:right">Borç</th><th style="text-align:right">Alacak</th><th style="text-align:right">Bakiye</th></tr><tr><td></td><td>Devir</td><td></td><td></td><td style="text-align:right">${money(bal)}</td></tr>${mv.map((m) => { bal += m.b - m.a; return `<tr><td>${NS.date(m.at)}</td><td>${esc(m.d)}</td><td style="text-align:right">${m.b ? money(m.b) : ''}</td><td style="text-align:right">${m.a ? money(m.a) : ''}</td><td style="text-align:right">${money(bal)}</td></tr>`; }).join('')}</table></div>`, { title: 'Ekstre' });
      } });
  }
  function productsPage(el, p, app) {
    NS.crud(el, app, { col: 'products', title: 'Ürünler & Stok', sub: 'Koli içi adet ve fiyat listeleri (A taban, B +%4, C +%8)', single: 'Ürün', addLabel: 'Ürün ekle', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'barcode', label: 'Barkod' }, { name: 'name', label: 'Ürün', required: true, full: true }, { name: 'cat', label: 'Kategori' }, { name: 'pack', label: 'Koli içi adet', type: 'number' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'A liste fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'vat', label: 'KDV %', type: 'select', options: ['1', '10', '20'] }, { name: 'stock', label: 'Stok (adet)', type: 'number' }, { name: 'min', label: 'Kritik stok', type: 'number' }],
      beforeSave: (v) => { v.vat = Number(v.vat); },
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'az', label: 'Kritik stok', test: (x) => x.stock <= (x.min || 0) }],
      searchFields: (x) => [x.code, x.name, x.cat, x.barcode],
      columns: [{ key: 'name', label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.code)} · ${esc(x.cat)}</div>` }, { key: 'pack', label: 'Koli içi', cls: 'right' }, { key: 'stock', label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= (x.min || 0) ? 'err' : 'text'})">${x.stock}</b><div class="small faint">${Math.floor(x.stock / (x.pack || 1))} koli</div>` }, { label: 'A / B / C', cls: 'right', render: (x) => `${money(T.price(x, 'A'))}<div class="small faint">${money(T.price(x, 'B'))} · ${money(T.price(x, 'C'))}</div>` }, { label: 'Marj', cls: 'right', render: (x) => '%' + Math.round(((x.price - x.cost) / (x.price || 1)) * 100) }] });
  }

  // ---------- Özet & raporlar ----------
  function dashboard(el, p, app) {
    const all = db.all('orders', (o) => o.status !== 'iptal'); const t = today();
    const tod = all.filter((o) => iso(o.at) === t); const m30 = all.filter((o) => o.at > addDays(new Date(), -30).toISOString());
    const C = db.all('customers'); const od = sum(C, overdue);
    const ser = NS.dailySeries(all, 14, 'at', (o) => T.orderTotal(o).total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/sevkiyat">${icon('truck')} Sevkiyat</a><button class="btn primary" id="new">${icon('plus')} Sipariş</button>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü sipariş', money(sum(tod, (o) => T.orderTotal(o).total)), 'cart', '', `<div class="small faint">${tod.length} sipariş · ${tod.filter((o) => o.src === 'b2b').length} portaldan</div>`)}${kpi('Risk onayı bekleyen', all.filter((o) => o.status === 'onay').length, 'alert', 'err')}${kpi('Toplam alacak', money(sum(C, (c) => Math.max(0, c.balance))), 'wallet', 'info', `<div class="small faint">vadesi geçen ${money(od)}</div>`)}${kpi('30 gün satış', money(sum(m30, (o) => T.orderTotal(o).total)), 'trend', 'ok')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün satış</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div><div class="card"><div class="card-h"><h3>Sipariş kaynağı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => o.src)).map(([k, v]) => ({ label: T.SRC[k], value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Plasiyer performansı (bu ay)</h3></div>${table({ rows: db.all('reps').map((r) => { const mo = all.filter((o) => o.rep === r.id && o.at.slice(0, 7) === t.slice(0, 7)); const s = sum(mo, (o) => T.orderTotal(o).total); return { id: r.id, r, s, c: sum(db.all('payments', (x) => x.rep === r.id && x.at.slice(0, 7) === t.slice(0, 7)), (x) => x.amount), pct: Math.round((s / (r.target || 1)) * 100) }; }), columns: [{ label: 'Plasiyer', render: (x) => `<b>${esc(x.r.name)}</b>` }, { label: 'Satış', cls: 'right', render: (x) => money(x.s) }, { label: 'Hedef', cls: 'right', render: (x) => badge('%' + x.pct, x.pct >= 80 ? 'ok' : x.pct >= 50 ? 'warn' : 'err') }, { label: 'Tahsilat', cls: 'right', render: (x) => money(x.c) }] })}</div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Vadesi geçenler</h3><a class="btn sm" href="#/cariler">Cariler</a></div>${table({ rows: C.map((c) => ({ id: c.id, c, o: overdue(c) })).filter((x) => x.o > 0).sort((a, b) => b.o - a.o).slice(0, 8), empty: 'Vadesi geçen alacak yok', columns: [{ label: 'Cari', render: (x) => `<b>${esc(x.c.name)}</b><div class="small faint">${esc(rep(x.c.rep).name)}</div>` }, { label: 'Vadesi geçen', cls: 'right', render: (x) => `<b style="color:var(--err)">${money(x.o)}</b>` }] })}</div></div>`;
    $('#new', el).onclick = () => orderForm(app);
  }
  function reportsPage(el) {
    const C = db.all('customers'); const now = Date.now();
    const age = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    C.forEach((c) => { const L = db.all('orders', (o) => o.customer === c.id && ['sevk', 'teslim'].includes(o.status)).sort((a, b) => b.at.localeCompare(a.at)); let rem = Math.max(0, c.balance); L.forEach((o) => { if (rem <= 0) return; const t = Math.min(rem, T.orderTotal(o).total); rem -= t; const d = (now - new Date(o.at)) / 864e5; age[d <= 30 ? '0-30' : d <= 60 ? '31-60' : d <= 90 ? '61-90' : '90+'] += t; }); });
    const m30 = db.all('orders', (o) => o.status !== 'iptal' && o.at > addDays(new Date(), -30).toISOString());
    const top = Object.values(m30.flatMap((o) => o.lines).reduce((m, l) => { m[l.pid] = m[l.pid] || { id: l.pid, name: l.name, qty: 0, t: 0 }; m[l.pid].qty += l.qty; m[l.pid].t += l.qty * l.price; return m; }, {})).sort((a, b) => b.t - a.t);
    el.innerHTML = pageHead('Raporlar', 'Alacak yaşlandırma, ürün ve müşteri analizi') + `<div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Alacak yaşlandırma</h3></div><div class="card-b">${chart.bars(Object.entries(age).map(([label, value]) => ({ label: label + ' gün', value })))}</div></div><div class="card"><div class="card-h"><h3>Kategori satışı (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30.flatMap((o) => o.lines), (l) => (prod(l.pid) || {}).cat || '-')).map(([label, v]) => ({ label, value: sum(v, (l) => l.qty * l.price) })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>En çok satan ürünler</h3></div>${table({ rows: top.slice(0, 10), columns: [{ label: 'Ürün', render: (x) => esc(x.name) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Tutar', cls: 'right', render: (x) => money(x.t) }] })}</div><div class="card"><div class="card-h"><h3>En büyük müşteriler</h3></div>${table({ rows: C.map((c) => ({ id: c.id, c, t: sum(m30.filter((o) => o.customer === c.id), (o) => T.orderTotal(o).total) })).sort((a, b) => b.t - a.t).slice(0, 10), columns: [{ label: 'Cari', render: (x) => esc(x.c.name) }, { label: '30 gün', cls: 'right', render: (x) => money(x.t) }] })}</div></div>`;
  }

  const ROLES = { admin: 'Patron / yönetici', ofis: 'Ofis / muhasebe', plasiyer: 'Plasiyer (saha)', depo: 'Depo / sevkiyat' };
  const app = NS.shell({
    id: 'toptan', integrations: ['sms', 'whatsapp', 'efatura', 'eirsaliye', 'banka', 'muhasebeaktar', 'printer', 'gps', 'webhook', 'backup'], name: 'Toptancı & Plasiyer', tagline: 'Saha satış ve dağıtım', icon: 'truck', accent: '#15803d', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Satış' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['ofis'] }, { id: 'siparisler', label: 'Siparişler', icon: 'cart', badge: true, roles: ['ofis', 'plasiyer', 'depo'] }, { id: 'plasiyer', label: 'Plasiyer Ekranı', icon: 'map', roles: ['ofis', 'plasiyer'] }, { id: 'sevkiyat', label: 'Sevkiyat', icon: 'truck', roles: ['ofis', 'depo'] }, { sec: 'Finans' }, { id: 'tahsilat', label: 'Tahsilat & Çek', icon: 'cash', roles: ['ofis'] }, { id: 'cariler', label: 'Cariler', icon: 'building', roles: ['ofis', 'plasiyer'] }, { sec: 'Depo' }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box', roles: ['ofis', 'depo'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'onay').length }),
    routes: { ozet: dashboard, siparisler: ordersPage, plasiyer: repPage, sevkiyat: shipPage, tahsilat: payPage, cariler: customersPage, urunler: productsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Satış kuralları' }, { name: 'minOrder', label: 'En az sipariş tutarı (₺)', type: 'number' }, { name: 'defaultTerm', label: 'Varsayılan vade (gün)', type: 'number' }, { name: 'iban', label: 'IBAN', full: true }] }) },
  });
  if (myRep() && !location.hash) app.go('plasiyer');
})();
