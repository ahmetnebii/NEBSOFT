/* NEBSOFT Fabrika ERP (1/2) — stok & lot motoru, malzeme kartları, depo, satınalma, mal kabul, kalite kontrol, tedarikçi iadeleri */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, addDays, iso, today, daysBetween } = NS;
  const F = window.FAB; const { TYPES, WHT, MOVE, USABLE, r3 } = F;
  const r2 = (n) => Math.round(n * 100) / 100;
  const db = new NS.DB('fabrika', F.seed);
  const S = () => db.settings({ lotPrefix: 'L', sktWarn: 30, shiftHours: 8, shifts: 2 });
  const me = () => (NS.currentUser || {}).name || 'Sistem';
  const mat = (id) => db.get('materials', id) || { name: '-', unit: '', type: 'hammadde', code: '' };
  const whs = () => db.all('warehouses');
  const wh = (id) => db.get('warehouses', id) || { name: '-', type: '', locs: [] };
  const sup = (id) => db.get('suppliers', id) || { name: '-' };
  const cus = (id) => db.get('customers', id) || { name: '-' };
  const stn = (id) => db.get('stations', id) || { name: '-', cap: 1, cph: 0 };
  const lotRec = (no) => db.get('lots', no) || {};
  const qu = (q, m) => `${num(q)} ${esc((m || {}).unit || '')}`;
  const matOpts = (filter) => db.all('materials', filter).sort((a, b) => a.code.localeCompare(b.code)).map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` }));
  const whType = (id) => wh(id).type;
  const isUsable = (id) => USABLE.includes(whType(id));
  const sktBadge = (skt) => { if (!skt) return '<span class="faint">-</span>'; const d = daysBetween(new Date(), skt); return d < 0 ? badge(`${NS.date(skt)} · geçti`, 'err') : d <= (S().sktWarn || 30) ? badge(`${NS.date(skt)} · ${d} gün`, 'warn') : NS.date(skt); };
  const typeBadge = (t) => badge((TYPES[t] || ['-'])[0], (TYPES[t] || [])[1]);

  // ---------- Stok endeksi: malzeme → [{wh, loc, lot, qty}] ----------
  let IX = null;
  function ix() {
    if (IX) return IX;
    const k = {}; const m = {};
    db.col('moves').forEach((x) => { const key = [x.mat, x.wh, x.loc || '', x.lot || ''].join('|'); k[key] = r3((k[key] || 0) + x.qty); });
    Object.entries(k).forEach(([key, q]) => { if (Math.abs(q) < 1e-9) return; const [mt, w, loc, lot] = key.split('|'); (m[mt] = m[mt] || []).push({ mat: mt, wh: w, loc, lot, qty: q }); });
    return (IX = m);
  }
  const dirty = () => { IX = null; };
  const rowsOf = (matId) => ix()[matId] || [];
  const stock = (matId, whId) => r3(sum(rowsOf(matId).filter((r) => (whId ? r.wh === whId : isUsable(r.wh))), (r) => r.qty));
  const stockByType = (matId, type) => r3(sum(rowsOf(matId).filter((r) => whType(r.wh) === type), (r) => r.qty));
  const fefo = (matId, whFilter) => rowsOf(matId).filter((r) => r.qty > 0 && (whFilter ? whFilter(r.wh) : isUsable(r.wh)) && lotRec(r.lot).status !== 'bloke')
    .sort((a, b) => (lotRec(a.lot).skt || '9999').localeCompare(lotRec(b.lot).skt || '9999') || String(a.lot).localeCompare(String(b.lot)));
  function move(o) { db.col('moves').push({ id: NS.uid(), at: new Date().toISOString(), date: today(), user: me(), ...o, qty: r3(o.qty) }); dirty(); }
  // FEFO toplama planı
  function pickPlan(matId, qty, whFilter) {
    let need = r3(qty); const lines = [];
    for (const r of fefo(matId, whFilter)) { if (need <= 0) break; const t = r3(Math.min(need, r.qty)); lines.push({ ...r, qty: t }); need = r3(need - t); }
    return { lines, short: need > 0 ? need : 0 };
  }
  const newLotNo = () => `${S().lotPrefix || 'L'}${today().replace(/-/g, '').slice(2)}-${db.nextNo('lot')}`;
  function createLot(m, extra = {}) { const no = newLotNo(); db.col('lots').push({ id: no, no, mat: m.id, prod: today(), skt: m.shelf ? iso(addDays(new Date(), m.shelf)) : '', ...extra }); return no; }
  const openPO = () => db.all('po', (p) => ['acik', 'kismi'].includes(p.status));
  const onOrder = (matId) => r3(sum(openPO().flatMap((p) => p.lines.filter((l) => l.mat === matId)), (l) => Math.max(0, l.qty - (l.received || 0))));
  const inProd = (matId) => r3(sum(db.all('wo', (w) => w.mat === matId && !['tamam', 'iptal'].includes(w.status)), (w) => Math.max(0, w.qty - (w.produced || 0))));
  const bomOf = (matId) => db.find('boms', (b) => b.mat === matId && b.active);
  function unitCost(matId, depth = 0) {
    const m = mat(matId); const b = bomOf(matId);
    if (!b || depth > 6) return m.cost || 0;
    const mc = sum(b.lines, (l) => l.qty * (1 + (l.scrap || 0) / 100) * unitCost(l.mat, depth + 1)) / b.base;
    const oc = sum(b.ops || [], (o) => ((o.run || 0) / b.base) * (stn(o.station).cph / 60));
    return r2(mc + oc);
  }
  const needOf = (b, qty) => b.lines.map((l) => ({ mat: l.mat, qty: r3((l.qty * qty) / b.base * (1 + (l.scrap || 0) / 100)) }));
  const poTotal = (p) => r2(sum(p.lines, (l) => l.qty * l.price * (1 + (l.vat || 0) / 100)));
  const curFmt = (v, cur) => (cur && cur !== 'TRY' ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(v) : money(v));
  const qcParams = (m) => String(m.qcp || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const [name, min, max] = x.split(';').map((y) => (y || '').trim()); return { name, min: min === '' || min === undefined ? null : Number(min), max: max === '' || max === undefined ? null : Number(max) }; });

  // Etiket: lot barkodu + QR
  function lotLabelHtml(i) {
    const m = mat(i.mat), l = lotRec(i.lot);
    return `<div style="font-family:Arial;padding:2mm;font-size:10px"><b style="font-size:12px">${esc(m.name)}</b><div>${esc(m.code)} · ${esc(i.lot)}</div><div style="display:flex;gap:6px;align-items:center"><div>${NS.barcodeSvg(i.lot, { height: 30 })}</div><div>${NS.qrSvg(i.lot, 56)}</div></div><div>Miktar: <b>${num(i.qty)} ${esc(m.unit)}</b> ${l.skt ? '· SKT: <b>' + NS.date(l.skt) + '</b>' : ''}</div>${l.supLot ? `<div>Tedarikçi lot: ${esc(l.supLot)}</div>` : ''}</div>`;
  }
  function printLotLabels(items) {
    if (!items.length) return;
    const html = items.map(lotLabelHtml).join('<div style="page-break-after:always"></div>');
    if (NS.integ) NS.integ.printLabels(items.map((i) => ({ name: mat(i.mat).name, price: `${i.lot} ${num(i.qty)} ${mat(i.mat).unit}`, barcode: i.lot })), html);
    else NS.printHtml(html, { title: 'Etiket' });
  }
  async function readWeight(label) {
    // Araç kantarı bağlıysa (ağ indikatörü / seri port) kantar okuması, değilse kasa terazisi
    if (label === 'Kantar' && NS.integ && NS.integ.isOn('kantar')) { const r = await NS.integ.call('kantar', 'oku', {}, { silent: true }); if (r && r.ok) { const kg = r.data && r.data.kg && !r.simulated ? Number(r.data.kg) : null; if (kg) return kg; if (r.simulated) toast('TEST: kantar bağlantısı simülasyonda, ağırlık okunmadı — tartımı elle girin', 'warn'); } }
    try {
      if (NS.integ && NS.integ.cfg('scale').mode !== 'barcode') return await NS.integ.readScale({ ask: true });
    } catch (e) { toast(e.message, 'err'); }
    const v = await NS.prompt(`${label || 'Ağırlık'} (kg) — teraziden okunamadı, elle girin`, '', { title: 'Tartım', type: 'number' });
    return v === null || v === '' ? null : Number(v);
  }

  // Basit satır düzenleyici (talep, sipariş, reçete satırları için)
  function gridEditor(host, lines, cols, blank, onChange) {
    const cell = (c, l, i) => {
      if (c.render) return c.render(l, i);
      const v = l[c.k] ?? '';
      if (c.type === 'select') return `<select class="input" data-gi="${i}" data-gk="${c.k}" style="min-width:${c.w || 120}px"><option value="">Seçin...</option>${(typeof c.opts === 'function' ? c.opts(l) : c.opts).map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      return `<input class="input" data-gi="${i}" data-gk="${c.k}" type="${c.type || 'text'}" ${c.type === 'number' ? 'step="any"' : ''} value="${esc(v)}" style="width:${c.w || 100}px">`;
    };
    const draw = () => { host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead><tbody>${lines.map((l, i) => `<tr>${cols.map((c) => `<td class="${c.cls || ''}">${cell(c, l, i)}</td>`).join('')}<td><button type="button" class="btn sm ghost icon" data-gx="${i}">${icon('x')}</button></td></tr>`).join('')}</tbody></table></div><button type="button" class="btn sm mt" data-ga>${icon('plus')} Satır ekle</button>`; onChange && onChange(); };
    host.addEventListener('change', (e) => { const x = e.target.closest('[data-gi]'); if (!x) return; const c = cols.find((y) => y.k === x.dataset.gk); lines[x.dataset.gi][x.dataset.gk] = c.type === 'number' ? Number(x.value) || 0 : x.value; if (c.onSet) c.onSet(lines[x.dataset.gi]); draw(); });
    host.addEventListener('click', (e) => { if (e.target.closest('[data-ga]')) { lines.push(blank()); draw(); } const x = e.target.closest('[data-gx]'); if (x) { lines.splice(Number(x.dataset.gx), 1); draw(); } });
    draw();
    return { draw };
  }

  // ---------- Malzeme kartları ----------
  function matDetail(app, m) {
    const rows = rowsOf(m.id).filter((r) => r.qty > 0).sort((a, b) => (lotRec(a.lot).skt || '9').localeCompare(lotRec(b.lot).skt || '9'));
    const mv = db.all('moves', (x) => x.mat === m.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
    const used = db.all('boms', (b) => b.lines.some((l) => l.mat === m.id));
    modal({
      title: `${m.code} · ${m.name}`, size: 'xl',
      body: `<div class="grid g4 mb">${kpi('Kullanılabilir', qu(stock(m.id), m), 'box', 'ok')}${kpi('Karantina', qu(stockByType(m.id, 'karantina'), m), 'shield', 'warn')}${kpi(m.type === 'mamul' || m.type === 'yarimamul' ? 'Üretimde' : 'Siparişte', qu(m.type === 'mamul' || m.type === 'yarimamul' ? inProd(m.id) : onOrder(m.id), m), 'truck', 'info')}${kpi('Birim maliyet', money(unitCost(m.id)), 'wallet')}</div>
        <div class="row mb">${typeBadge(m.type)} ${badge('Min ' + num(m.min) + ' / Max ' + num(m.max))} ${m.qc ? badge('Kalite kontrollü', 'warn') : ''} ${m.shelf ? badge('Raf ömrü ' + m.shelf + ' gün') : ''} ${m.supplier ? badge('Tedarikçi: ' + sup(m.supplier).name, 'acc') : ''}</div>
        <h3 class="mb">Lot / parti bazlı stok</h3>${table({ rows, empty: 'Stok yok', columns: [{ label: 'Lot', render: (r) => `<b class="mono">${esc(r.lot)}</b>${lotRec(r.lot).status === 'bloke' ? ' ' + badge('Bloke', 'err') : ''}` }, { label: 'Depo / lokasyon', render: (r) => `${esc(wh(r.wh).name)} <span class="faint">${esc(r.loc)}</span>` }, { label: 'SKT', render: (r) => sktBadge(lotRec(r.lot).skt) }, { label: 'Tedarikçi lot', render: (r) => esc(lotRec(r.lot).supLot || '-') }, { label: 'Miktar', cls: 'right', render: (r) => `<b>${qu(r.qty, m)}</b>` }] })}
        ${used.length ? `<h3 class="mb mt">Kullanıldığı reçeteler</h3><div class="row">${used.map((b) => badge(`${mat(b.mat).name} (${b.version}) — ${num(b.lines.find((l) => l.mat === m.id).qty)} ${m.unit} / ${num(b.base)} ${mat(b.mat).unit}`, 'acc')).join(' ')}</div>` : ''}
        <h3 class="mb mt">Son hareketler</h3>${table({ rows: mv, empty: 'Hareket yok', columns: [{ label: 'Zaman', render: (x) => NS.dt(x.at) }, { label: 'Tür', render: (x) => badge((MOVE[x.type] || [x.type])[0], (MOVE[x.type] || [])[1]) }, { label: 'Belge', render: (x) => esc(x.refNo || x.note || '-') }, { label: 'Depo', render: (x) => `${esc(wh(x.wh).name)} <span class="faint">${esc(x.loc || '')}</span>` }, { label: 'Lot', render: (x) => `<span class="mono small">${esc(x.lot || '')}</span>` }, { label: 'Miktar', cls: 'right', render: (x) => `<b style="color:${x.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${x.qty > 0 ? '+' : ''}${num(x.qty)}</b>` }, { label: 'Kullanıcı', render: (x) => `<span class="small">${esc(x.user || '')}</span>` }] })}`,
      actions: [{ label: 'Lot etiketleri', icon: 'tag', onClick: () => printLotLabels(rows.map((r) => ({ mat: m.id, lot: r.lot, qty: r.qty }))) }, { label: 'Kapat', cls: 'primary' }],
    });
  }
  function materialsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'materials', title: 'Malzeme Kartları', sub: 'Hammadde, ambalaj, yarı mamul, mamul ve sarf malzemeleri', single: 'Malzeme', addLabel: 'Yeni malzeme', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Malzeme kodu', required: true }, { name: 'name', label: 'Ad', required: true }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(TYPES).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'unit', label: 'Stok birimi', type: 'select', options: ['kg', 'g', 'lt', 'm', 'm²', 'adet', 'koli', 'paket', 'rulo', 'palet', 'ton'] },
        { name: 'group', label: 'Grup' }, { name: 'barcode', label: 'Barkod' }, { name: 'min', label: 'Minimum (emniyet) stok', type: 'number' }, { name: 'max', label: 'Maksimum stok', type: 'number' }, { name: 'moq', label: 'Min. sipariş miktarı', type: 'number' }, { name: 'lead', label: 'Tedarik süresi (gün)', type: 'number' },
        { name: 'cost', label: 'Birim maliyet (₺)', type: 'number', step: '0.0001', hint: 'Mal kabulde ağırlıklı ortalama ile güncellenir' }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', step: '0.01' }, { name: 'shelf', label: 'Raf ömrü (gün, 0 = yok)', type: 'number' }, { name: 'supplier', label: 'Tercihli tedarikçi', type: 'select', empty: '-', options: () => db.all('suppliers').map((s) => ({ value: s.id, label: s.name })) },
        { name: 'loc', label: 'Varsayılan lokasyon' }, { name: 'qc', label: 'Girişte kalite kontrol zorunlu', type: 'checkbox' }, { name: 'qcp', label: 'Kalite parametreleri (her satır: Ad;min;max)', type: 'textarea', full: true, placeholder: 'Nem (%);0;14.5\nGörsel kontrol' }],
      defaults: { type: 'hammadde', unit: 'kg', min: 0, max: 0, moq: 1, lead: 5, cost: 0, shelf: 0, qc: !!S().qcDefault },
      searchFields: (m) => [m.code, m.name, m.group, m.barcode], sort: (a, b) => a.code.localeCompare(b.code),
      filters: [{ value: 'all', label: 'Tümü' }, ...Object.entries(TYPES).map(([value, v]) => ({ value, label: v[0], test: (m) => m.type === value })), { value: 'kritik', label: 'Kritik', test: (m) => m.min > 0 && stock(m.id) < m.min }],
      columns: [{ key: 'code', label: 'Kod', render: (m) => `<b class="mono">${esc(m.code)}</b>` }, { key: 'name', label: 'Malzeme', render: (m) => `<b>${esc(m.name)}</b><div class="small faint">${esc(m.group || '')}${m.qc ? ' · KK' : ''}${m.shelf ? ' · ' + m.shelf + ' gün' : ''}</div>` }, { label: 'Tür', render: (m) => typeBadge(m.type) },
        { label: 'Kullanılabilir', cls: 'right', render: (m) => { const s = stock(m.id); return m.min > 0 && s < m.min ? badge(qu(s, m), 'err') : `<b>${qu(s, m)}</b>`; } }, { label: 'Karantina', cls: 'right', render: (m) => { const q = stockByType(m.id, 'karantina'); return q ? badge(qu(q, m), 'warn') : '<span class="faint">-</span>'; } },
        { label: 'Siparişte / üretimde', cls: 'right', render: (m) => { const v = m.type === 'mamul' || m.type === 'yarimamul' ? inProd(m.id) : onOrder(m.id); return v ? qu(v, m) : '<span class="faint">-</span>'; } }, { label: 'Birim maliyet', cls: 'right', render: (m) => money(unitCost(m.id)) }, { label: 'Stok değeri', cls: 'right', render: (m) => money(Math.max(0, stock(m.id)) * unitCost(m.id)) }],
      extraActions: [{ icon: 'eye', act: 'dt', title: 'Detay & lotlar' }], onAction: (a, m) => matDetail(app, m),
    });
  }

  // ---------- Stok & depo ----------
  async function transferModal(app, preset = {}) {
    const mats = db.all('materials', (m) => rowsOf(m.id).some((r) => r.qty > 0));
    let matId = preset.mat || (mats[0] || {}).id;
    modal({
      title: 'Lokasyon / depo transferi', size: 'wide',
      body: `<div class="form-grid"><div class="field full"><label>Malzeme</label><select class="input" id="tm">${mats.map((m) => `<option value="${m.id}" ${m.id === matId ? 'selected' : ''}>${esc(m.code)} · ${esc(m.name)}</option>`).join('')}</select></div></div><h3 class="mt mb">Kaynak lot</h3><div id="tl"></div>
        <div class="form-grid mt"><div class="field"><label>Miktar</label><input class="input" type="number" step="any" id="tq"></div><div class="field"><label>Hedef depo</label><select class="input" id="tw">${whs().map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div><div class="field"><label>Hedef lokasyon</label><select class="input" id="tc"></select></div><div class="field"><label>Açıklama</label><input class="input" id="tn"></div></div>`,
      onOpen: (b) => {
        const drawLots = () => { matId = $('#tm', b).value; const rows = rowsOf(matId).filter((r) => r.qty > 0); $('#tl', b).innerHTML = table({ rows: rows.map((r, i) => ({ ...r, id: i })), empty: 'Stok yok', columns: [{ label: '', render: (r) => `<input type="radio" name="src" value="${r.id}" ${(preset.lot ? r.lot === preset.lot && r.wh === preset.wh : r.id === 0) ? 'checked' : ''}>` }, { label: 'Lot', render: (r) => `<span class="mono">${esc(r.lot)}</span>` }, { label: 'Depo', render: (r) => `${esc(wh(r.wh).name)} <span class="faint">${esc(r.loc)}</span>` }, { label: 'SKT', render: (r) => sktBadge(lotRec(r.lot).skt) }, { label: 'Miktar', cls: 'right', render: (r) => qu(r.qty, mat(matId)) }] }); b._rows = rows; };
        const drawLocs = () => { $('#tc', b).innerHTML = (wh($('#tw', b).value).locs || []).map((l) => `<option>${esc(l)}</option>`).join(''); };
        $('#tm', b).onchange = drawLots; $('#tw', b).onchange = drawLocs; drawLots(); drawLocs();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Transfer et', cls: 'primary', icon: 'check', onClick: (close, b) => {
        const sel = $('[name=src]:checked', b); if (!sel) return toast('Kaynak lot seçin', 'err');
        const r = b._rows[Number(sel.value)]; const q = Number($('#tq', b).value); const tw = $('#tw', b).value, tc = $('#tc', b).value;
        if (!(q > 0) || q > r.qty) return toast(`Miktar 0 ile ${num(r.qty)} arasında olmalı`, 'err');
        if (tw === r.wh && tc === r.loc) return toast('Hedef, kaynakla aynı', 'err');
        const no = 'TR' + db.nextNo('tr'); const note = $('#tn', b).value; const c = unitCost(matId);
        move({ mat: matId, wh: r.wh, loc: r.loc, lot: r.lot, qty: -q, cost: c, type: 'transfer', refNo: no, note }); move({ mat: matId, wh: tw, loc: tc, lot: r.lot, qty: q, cost: c, type: 'transfer', refNo: no, note });
        db.log('Transfer', `${mat(matId).name} ${num(q)} → ${wh(tw).name} ${tc}`); db.save(); close(); toast('Transfer yapıldı', 'ok'); app.refresh();
      } }],
    });
  }
  function scrapModal(app) {
    const mats = db.all('materials', (m) => rowsOf(m.id).some((r) => r.qty > 0));
    modal({
      title: 'Fire / sarf çıkışı', size: 'wide',
      body: `<div class="form-grid"><div class="field full"><label>Malzeme</label><select class="input" id="sm">${mats.map((m) => `<option value="${m.id}">${esc(m.code)} · ${esc(m.name)}</option>`).join('')}</select></div><div class="field full"><label>Lot / lokasyon</label><select class="input" id="sl"></select></div><div class="field"><label>Miktar</label><input class="input" type="number" step="any" id="sq"></div><div class="field"><label>Neden</label><select class="input" id="sr">${['Bozulma / küf', 'Hasarlı ambalaj', 'SKT geçti', 'Laboratuvar numunesi', 'Bakım / temizlik sarfı', 'Hat başlangıç firesi', 'Diğer'].map((x) => `<option>${x}</option>`).join('')}</select></div><div class="field full"><label>Açıklama</label><input class="input" id="sn"></div></div>`,
      onOpen: (b) => { const d = () => { const rows = rowsOf($('#sm', b).value).filter((r) => r.qty > 0); b._rows = rows; $('#sl', b).innerHTML = rows.map((r, i) => `<option value="${i}">${esc(r.lot)} · ${esc(wh(r.wh).name)} ${esc(r.loc)} · ${num(r.qty)}</option>`).join(''); }; $('#sm', b).onchange = d; d(); },
      actions: [{ label: 'Vazgeç' }, { label: 'Çıkış yap', cls: 'danger', onClick: (close, b) => { const r = b._rows[Number($('#sl', b).value)]; const q = Number($('#sq', b).value); if (!r || !(q > 0) || q > r.qty) return toast('Geçerli miktar girin', 'err'); move({ mat: r.mat, wh: r.wh, loc: r.loc, lot: r.lot, qty: -q, cost: unitCost(r.mat), type: 'fire', refNo: 'FR' + db.nextNo('fr'), note: `${$('#sr', b).value}${$('#sn', b).value ? ' — ' + $('#sn', b).value : ''}` }); db.log('Fire çıkışı', `${mat(r.mat).name} ${num(q)}`); db.save(); close(); toast('Fire kaydedildi', 'ok'); app.refresh(); } }],
    });
  }
  async function manualIn(app) {
    const v = await formModal({ title: 'Stok girişi (açılış / manuel)', fields: [{ name: 'mat', label: 'Malzeme', type: 'select', options: matOpts(), full: true }, { name: 'wh', label: 'Depo', type: 'select', options: whs().filter((w) => USABLE.includes(w.type)).map((w) => ({ value: w.id, label: w.name })) }, { name: 'loc', label: 'Lokasyon' }, { name: 'qty', label: 'Miktar', type: 'number', required: true, step: 'any' }, { name: 'cost', label: 'Birim maliyet (boşsa kart maliyeti)', type: 'number', step: 'any' }, { name: 'skt', label: 'SKT (boşsa raf ömrüne göre)', type: 'date' }, { name: 'supLot', label: 'Tedarikçi lot no' }, { name: 'note', label: 'Açıklama', full: true }] });
    if (!v) return; const m = mat(v.mat); const lot = createLot(m, { supLot: v.supLot, ...(v.skt ? { skt: v.skt } : {}) });
    move({ mat: m.id, wh: v.wh, loc: v.loc || m.loc || (wh(v.wh).locs || [])[0] || '', lot, qty: v.qty, cost: v.cost || m.cost, type: 'acilis', refNo: 'Manuel giriş', note: v.note });
    db.save(); toast(`${lot} lotu ile giriş yapıldı`, 'ok'); if (await confirm('Lot etiketi yazdırılsın mı?', { ok: 'Yazdır', danger: false })) printLotLabels([{ mat: m.id, lot, qty: v.qty }]); app.refresh();
  }
  async function countModal(app) {
    const w = (await formModal({ title: 'Sayım deposu', fields: [{ name: 'w', label: 'Depo', type: 'select', options: whs().map((x) => ({ value: x.id, label: x.name })) }, { name: 'blind', label: 'Kör sayım (sistem miktarlarını gizle)', type: 'checkbox' }] })); if (!w) return;
    const rows = db.all('materials').flatMap((m) => rowsOf(m.id).filter((r) => r.wh === w.w && r.qty > 0)).sort((a, b) => (a.loc + a.mat).localeCompare(b.loc + b.mat));
    modal({
      title: `Sayım — ${wh(w.w).name}`, size: 'xl',
      body: `<p class="small muted mb">Sayılan miktarları girin. Boş bırakılan satırlar değişmez; farklar “Sayım farkı” hareketi olarak işlenir.</p>` + table({ rows: rows.map((r, i) => ({ ...r, id: i })), empty: 'Bu depoda stok yok', columns: [{ label: 'Lokasyon', render: (r) => esc(r.loc) }, { label: 'Malzeme', render: (r) => `<b>${esc(mat(r.mat).name)}</b><div class="small faint">${esc(mat(r.mat).code)}</div>` }, { label: 'Lot', render: (r) => `<span class="mono small">${esc(r.lot)}</span>` }, { label: 'Sistem', cls: 'right', render: (r) => (w.blind ? '***' : qu(r.qty, mat(r.mat))) }, { label: 'Sayılan', cls: 'right', render: (r) => `<input class="input" type="number" step="any" style="width:110px;text-align:right" data-c="${r.id}">` }] }),
      actions: [{ label: 'Sayım listesi yazdır', icon: 'print', onClick: () => NS.printHtml(`<h2>Sayım listesi — ${esc(wh(w.w).name)}</h2><div>${NS.dt(new Date())} · Sayan: __________</div><table><tr><th>Lokasyon</th><th>Kod</th><th>Malzeme</th><th>Lot</th>${w.blind ? '' : '<th>Sistem</th>'}<th>Sayılan</th></tr>${rows.map((r) => `<tr><td>${esc(r.loc)}</td><td>${esc(mat(r.mat).code)}</td><td>${esc(mat(r.mat).name)}</td><td>${esc(r.lot)}</td>${w.blind ? '' : `<td>${num(r.qty)} ${esc(mat(r.mat).unit)}</td>`}<td>__________</td></tr>`).join('')}</table>`, { title: 'Sayım' }) }, { label: 'Vazgeç' },
        { label: 'Sayımı işle', cls: 'primary', onClick: (close, b) => { const no = 'SY' + db.nextNo('sy'); let n = 0; $$('[data-c]', b).forEach((x) => { if (x.value === '') return; const r = rows[Number(x.dataset.c)]; const diff = r3(Number(x.value) - r.qty); if (!diff) return; n++; move({ mat: r.mat, wh: r.wh, loc: r.loc, lot: r.lot, qty: diff, cost: unitCost(r.mat), type: 'sayim', refNo: no }); }); db.log('Sayım', `${wh(w.w).name} · ${n} fark`); db.save(); close(); toast(`${n} satırda fark işlendi`, 'ok'); app.refresh(); } }],
    });
  }
  function stockPage(el, p, app) {
    const tab = p || 'durum'; let q = '', tf = '';
    const mats = db.all('materials');
    const val = sum(mats, (m) => Math.max(0, stock(m.id)) * unitCost(m.id));
    const lots = mats.flatMap((m) => rowsOf(m.id).filter((r) => r.qty > 0));
    el.innerHTML = pageHead('Stok & Depo', 'Lot bazlı stok, SKT takibi, transfer, fire ve sayım', `<button class="btn" id="b-tr">${icon('refresh')} Transfer</button><button class="btn" id="b-fr">${icon('minus')} Fire / sarf</button><button class="btn" id="b-sy">${icon('list')} Sayım</button><button class="btn primary" id="b-in">${icon('plus')} Stok girişi</button>`) + `
      <div class="grid g4 mb">${kpi('Stok değeri', money(val), 'wallet', 'info')}${kpi('Aktif lot', lots.length, 'layers')}${kpi('Kritik malzeme', mats.filter((m) => m.min > 0 && stock(m.id) < m.min).length, 'alert', 'err')}${kpi('SKT yaklaşan lot', lots.filter((r) => { const s = lotRec(r.lot).skt; return s && daysBetween(new Date(), s) <= (S().sktWarn || 30); }).length, 'clock', 'warn')}</div>
      <div class="tabs">${[['durum', 'Stok durumu'], ['lot', 'Lot & SKT'], ['hareket', 'Hareketler'], ['depo', 'Depolar & lokasyonlar']].map(([k, l]) => `<a href="#/stok/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div>
      <div class="card"><div class="card-h">${NS.searchBox('q', 'Malzeme, lot, lokasyon...')}${tab !== 'depo' ? `<select class="input" id="tf" style="max-width:200px"><option value="">Tüm türler</option>${(tab === 'hareket' ? Object.entries(MOVE) : Object.entries(TYPES)).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>` : ''}<span class="grow"></span><button class="btn sm" id="ex">${icon('download')}</button></div><div id="t"></div></div>`;
    let lastRows = [], lastCols = [];
    const draw = () => {
      if (tab === 'durum') {
        lastRows = mats.filter((m) => (!tf || m.type === tf) && NS.match(q, m.code, m.name, m.group)).sort((a, b) => a.code.localeCompare(b.code));
        lastCols = [{ label: 'Malzeme', render: (m) => `<b>${esc(m.name)}</b><div class="small faint mono">${esc(m.code)}</div>`, value: (m) => m.name }, { label: 'Tür', render: (m) => typeBadge(m.type), value: (m) => TYPES[m.type][0] }, ...['hammadde', 'uretim', 'mamul', 'karantina', 'red'].map((t) => ({ label: WHT[t].split(' (')[0], cls: 'right', render: (m) => { const v = stockByType(m.id, t); return v ? num(v) : '<span class="faint">-</span>'; }, value: (m) => stockByType(m.id, t) })), { label: 'Min', cls: 'right', render: (m) => num(m.min), value: (m) => m.min }, { label: 'Durum', render: (m) => (m.min > 0 && stock(m.id) < m.min ? badge('Kritik', 'err') : m.max && stock(m.id) > m.max ? badge('Fazla', 'warn') : badge('Normal', 'ok')), value: (m) => (m.min > 0 && stock(m.id) < m.min ? 'Kritik' : 'Normal') }, { label: 'Değer', cls: 'right', render: (m) => money(Math.max(0, stock(m.id)) * unitCost(m.id)), value: (m) => r2(Math.max(0, stock(m.id)) * unitCost(m.id)) }];
        $('#t', el).innerHTML = table({ rows: lastRows, columns: lastCols, actions: [{ icon: 'eye', act: 'md' }] });
      } else if (tab === 'lot') {
        lastRows = lots.filter((r) => (!tf || mat(r.mat).type === tf) && NS.match(q, r.lot, mat(r.mat).name, r.loc, mat(r.mat).code)).sort((a, b) => (lotRec(a.lot).skt || '9').localeCompare(lotRec(b.lot).skt || '9')).map((r, i) => ({ ...r, id: r.lot + '|' + r.wh + '|' + r.loc }));
        lastCols = [{ label: 'Lot', render: (r) => `<b class="mono">${esc(r.lot)}</b>${lotRec(r.lot).status === 'bloke' ? ' ' + badge('Bloke', 'err') : ''}`, value: (r) => r.lot }, { label: 'Malzeme', render: (r) => esc(mat(r.mat).name), value: (r) => mat(r.mat).name }, { label: 'Depo / lokasyon', render: (r) => `${esc(wh(r.wh).name)} <span class="faint">${esc(r.loc)}</span>`, value: (r) => wh(r.wh).name + ' ' + r.loc }, { label: 'Üretim / giriş', render: (r) => NS.date(lotRec(r.lot).prod), value: (r) => lotRec(r.lot).prod }, { label: 'SKT', render: (r) => sktBadge(lotRec(r.lot).skt), value: (r) => lotRec(r.lot).skt }, { label: 'Miktar', cls: 'right', render: (r) => `<b>${qu(r.qty, mat(r.mat))}</b>`, value: (r) => r.qty }];
        $('#t', el).innerHTML = table({ rows: lastRows.slice(0, 400), columns: lastCols, actions: [{ icon: 'tag', act: 'lb', title: 'Etiket' }, { icon: 'refresh', act: 'lt', title: 'Transfer' }, { icon: 'lock', act: 'bk', title: 'Bloke / serbest' }, { icon: 'search', act: 'iz', title: 'İzlenebilirlik' }] });
      } else if (tab === 'hareket') {
        lastRows = db.all('moves', (x) => (!tf || x.type === tf) && NS.match(q, mat(x.mat).name, x.lot, x.refNo, x.loc, x.note)).sort((a, b) => b.at.localeCompare(a.at));
        lastCols = [{ label: 'Zaman', render: (x) => NS.dt(x.at), value: (x) => x.at }, { label: 'Tür', render: (x) => badge((MOVE[x.type] || [x.type])[0], (MOVE[x.type] || [])[1]), value: (x) => (MOVE[x.type] || [x.type])[0] }, { label: 'Malzeme', render: (x) => esc(mat(x.mat).name), value: (x) => mat(x.mat).name }, { label: 'Lot', render: (x) => `<span class="mono small">${esc(x.lot || '')}</span>`, value: (x) => x.lot }, { label: 'Depo', render: (x) => `${esc(wh(x.wh).name)} <span class="faint">${esc(x.loc || '')}</span>`, value: (x) => wh(x.wh).name }, { label: 'Belge / not', render: (x) => `${esc(x.refNo || '')}<div class="small faint">${esc(x.note || '')}</div>`, value: (x) => x.refNo }, { label: 'Miktar', cls: 'right', render: (x) => `<b style="color:${x.qty > 0 ? 'var(--ok)' : 'var(--err)'}">${x.qty > 0 ? '+' : ''}${num(x.qty)}</b> ${esc(mat(x.mat).unit)}`, value: (x) => x.qty }, { label: 'Kullanıcı', render: (x) => `<span class="small">${esc(x.user || '')}</span>`, value: (x) => x.user }];
        $('#t', el).innerHTML = table({ rows: lastRows.slice(0, 400), columns: lastCols, foot: `${lastRows.length} hareket${lastRows.length > 400 ? ' (ilk 400 gösteriliyor)' : ''}` });
      } else {
        lastRows = whs().filter((w) => NS.match(q, w.name, (w.locs || []).join(' ')));
        lastCols = [{ label: 'Depo', render: (w) => `<b>${esc(w.name)}</b>`, value: (w) => w.name }, { label: 'Tür', render: (w) => badge(WHT[w.type] || w.type, w.type === 'karantina' ? 'warn' : w.type === 'red' ? 'err' : 'acc'), value: (w) => WHT[w.type] }, { label: 'Lokasyonlar', render: (w) => `<div class="row" style="gap:4px">${(w.locs || []).map((l) => { const n = lots.filter((r) => r.wh === w.id && r.loc === l).length; return `<span class="badge ${n ? 'info' : ''}">${esc(l)}${n ? ' · ' + n : ''}</span>`; }).join('')}</div>`, value: (w) => (w.locs || []).join(' ') }, { label: 'Lot', cls: 'right', render: (w) => lots.filter((r) => r.wh === w.id).length, value: (w) => lots.filter((r) => r.wh === w.id).length }, { label: 'Değer', cls: 'right', render: (w) => money(sum(lots.filter((r) => r.wh === w.id), (r) => r.qty * unitCost(r.mat))), value: (w) => r2(sum(lots.filter((r) => r.wh === w.id), (r) => r.qty * unitCost(r.mat))) }];
        $('#t', el).innerHTML = table({ rows: lastRows, columns: lastCols, actions: [{ icon: 'edit', act: 'we' }] }) + `<div class="pad"><button class="btn sm" id="nw">${icon('plus')} Depo ekle</button></div>`;
        $('#nw', el).onclick = () => whEdit(app);
      }
    };
    const whEdit = async (app, w) => { const v = await formModal({ title: w ? 'Depo düzenle' : 'Yeni depo', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'type', label: 'Tür', type: 'select', options: Object.entries(WHT).map(([value, label]) => ({ value, label })) }, { name: 'locs', label: 'Lokasyonlar (virgülle: A-01, A-02...)', full: true }], values: w ? { ...w, locs: (w.locs || []).join(', ') } : { type: 'hammadde' } }); if (!v) return; v.locs = v.locs.split(',').map((x) => x.trim()).filter(Boolean); if (w) db.update('warehouses', w.id, v); else db.insert('warehouses', v); dirty(); app.refresh(); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    if ($('#tf', el)) $('#tf', el).onchange = (e) => { tf = e.target.value; draw(); };
    $('#ex', el).onclick = () => NS.csv('stok-' + tab, lastRows, lastCols.map((c) => ({ label: c.label, value: c.value })));
    $('#b-tr', el).onclick = () => transferModal(app); $('#b-fr', el).onclick = () => scrapModal(app); $('#b-sy', el).onclick = () => countModal(app); $('#b-in', el).onclick = () => manualIn(app);
    on(el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (a === 'md') return matDetail(app, mat(b.dataset.id));
      if (a === 'we') return whEdit(app, wh(b.dataset.id));
      const [lot, w, loc] = b.dataset.id.split('|'); const r = lots.find((x) => x.lot === lot && x.wh === w && x.loc === loc);
      if (a === 'lb') printLotLabels([{ mat: r.mat, lot, qty: r.qty }]);
      else if (a === 'lt') transferModal(app, { mat: r.mat, lot, wh: w });
      else if (a === 'iz') app.go('izlenebilirlik', lot);
      else if (a === 'bk') { const l = db.get('lots', lot); if (!l) return; const blk = l.status !== 'bloke'; const reason = blk ? await NS.prompt('Bloke nedeni', 'Kalite şüphesi', { title: 'Lot bloke' }) : ''; if (blk && reason === null) return; l.status = blk ? 'bloke' : ''; l.blockReason = reason; db.log(blk ? 'Lot bloke' : 'Lot serbest', lot); db.save(); draw(); toast(blk ? 'Lot bloke edildi — üretim ve sevkiyatta kullanılmaz' : 'Lot serbest bırakıldı', 'ok'); }
    });
    draw();
  }

  // ---------- İzlenebilirlik (geri / ileri) ----------
  function tracePage(el, lotNo, app) {
    el.innerHTML = pageHead('İzlenebilirlik', 'Lot numarasından geriye (hangi hammaddeler, hangi tedarikçi) ve ileriye (hangi ürünler, hangi müşteriler) izleme') + `<div class="card pad mb"><div class="row"><input class="input grow" id="ln" placeholder="Lot numarası okutun veya yazın" value="${esc(lotNo || '')}"><button class="btn primary" id="go">${icon('search')} İzle</button></div></div><div id="tr"></div>`;
    const node = (lot, depth, dir, seen) => {
      if (!lot || seen.has(lot + dir) || depth > 6) return ''; seen.add(lot + dir);
      const l = lotRec(lot); const m = mat(l.mat);
      const mv = db.all('moves', (x) => x.lot === lot);
      const head = `<div class="list-item" style="margin-left:${depth * 22}px;border-left:3px solid ${dir === 'geri' ? 'var(--warn)' : 'var(--ok)'}"><div class="grow"><b class="mono">${esc(lot)}</b> · ${esc(m.name)} ${typeBadge(m.type)}<div class="small muted">${l.supplier ? 'Tedarikçi: ' + esc(sup(l.supplier).name) + (l.supLot ? ' (lot ' + esc(l.supLot) + ')' : '') + ' · ' : ''}${l.wo ? 'İş emri: ' + esc((db.get('wo', l.wo) || {}).no || '') + ' · ' : ''}Giriş ${NS.date(l.prod)} ${l.skt ? '· SKT ' + NS.date(l.skt) : ''} · Kalan ${num(r3(sum(mv, (x) => x.qty)) || 0)} ${esc(m.unit)}</div></div></div>`;
      let kids = '';
      if (dir === 'geri' && l.wo) { const w = db.get('wo', l.wo); if (w) kids = (w.issued || []).map((i) => node(i.lot, depth + 1, 'geri', seen)).join(''); }
      if (dir === 'ileri') {
        const cons = mv.filter((x) => x.type === 'tuketim' && x.ref); kids += [...new Set(cons.map((x) => x.ref))].map((wid) => { const w = db.get('wo', wid); return w ? (w.outLots || []).map((o) => node(o, depth + 1, 'ileri', seen)).join('') || `<div class="small muted" style="margin-left:${(depth + 1) * 22}px">${esc(w.no)} (${esc(mat(w.mat).name)}) — henüz çıktı yok</div>` : ''; }).join('');
        kids += mv.filter((x) => x.type === 'sevk').map((x) => { const sh = db.get('shipments', x.ref) || {}; return `<div class="list-item" style="margin-left:${(depth + 1) * 22}px;border-left:3px solid var(--accent)"><div class="grow">${icon('truck')} <b>${esc(cus(sh.cust).name)}</b> · ${esc(x.refNo)} · ${NS.date(x.date)} · ${num(-x.qty)} ${esc(m.unit)}</div></div>`; }).join('');
      }
      return head + kids;
    };
    const go = () => {
      const lot = $('#ln', el).value.trim(); if (!lot) return;
      if (!db.get('lots', lot)) { $('#tr', el).innerHTML = NS.table({ rows: [], empty: 'Lot bulunamadı' }); return; }
      const fwd = node(lot, 0, 'ileri', new Set());
      const custs = new Set(); db.all('moves', (x) => x.type === 'sevk').forEach((x) => { if (fwd.includes(esc(x.refNo))) custs.add((db.get('shipments', x.ref) || {}).cust); });
      $('#tr', el).innerHTML = `<div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('back')} Geriye izleme (kaynaklar)</h3></div><div class="pad">${node(lot, 0, 'geri', new Set())}</div></div><div class="card"><div class="card-h"><h3>İleriye izleme (kullanım & sevkiyat)</h3><button class="btn sm" id="rc">${icon('alert')} Geri çağırma listesi</button></div><div class="pad">${fwd}</div></div></div>`;
      $('#rc', el).onclick = () => NS.printHtml(`<h2>Geri çağırma (recall) listesi</h2><p>Kaynak lot: <b>${esc(lot)}</b> — ${esc(mat(lotRec(lot).mat).name)} · ${NS.dt(new Date())}</p><table><tr><th>Müşteri</th><th>Telefon</th><th>E-posta</th></tr>${[...custs].map((c) => `<tr><td>${esc(cus(c).name)}</td><td>${esc(cus(c).phone || '')}</td><td>${esc(cus(c).email || '')}</td></tr>`).join('') || '<tr><td colspan="3">Sevk edilmiş ürün yok</td></tr>'}</table><h3>Akış</h3>${fwd}`, { title: 'Geri çağırma' });
    };
    $('#go', el).onclick = go; $('#ln', el).onkeydown = (e) => { if (e.key === 'Enter') go(); };
    if (lotNo) go();
  }

  // ---------- Satınalma: talepler, teklifler, siparişler ----------
  const PRS = { bekliyor: ['Onay bekliyor', 'warn'], onaylandi: ['Onaylandı', 'info'], red: ['Reddedildi', 'err'], siparis: ['Siparişe dönüştü', 'ok'] };
  const POS = { acik: ['Açık', 'warn'], kismi: ['Kısmi teslim', 'info'], tamam: ['Teslim alındı', 'ok'], iptal: ['İptal', 'err'] };
  function prqEditor(app, rec, preset) {
    const d = rec ? JSON.parse(JSON.stringify(rec)) : { date: today(), dept: 'Üretim', by: me(), lines: preset || [{ mat: '', qty: 1, need: iso(addDays(new Date(), 7)) }], note: '' };
    modal({
      title: rec ? `${rec.no} düzenle` : 'Yeni satınalma talebi', size: 'xl',
      body: `<div class="form-grid mb" id="hf">${NS.fieldsHtml([{ name: 'dept', label: 'Talep eden birim', type: 'select', options: ['Üretim', 'Depo', 'Kalite', 'Bakım', 'Satınalma', 'İdari'] }, { name: 'by', label: 'Talep eden' }, { name: 'note', label: 'Açıklama / gerekçe', full: true }], d)}</div><div id="gl"></div>`,
      onOpen: (b) => gridEditor($('#gl', b), d.lines, [{ k: 'mat', label: 'Malzeme', type: 'select', opts: () => matOpts((m) => m.type !== 'mamul' && m.type !== 'yarimamul'), w: 260 }, { k: 'qty', label: 'Miktar', type: 'number' }, { label: 'Birim', render: (l) => esc(mat(l.mat).unit) }, { label: 'Stok', cls: 'right', render: (l) => (l.mat ? num(stock(l.mat)) : '') }, { k: 'need', label: 'İhtiyaç tarihi', type: 'date', w: 140 }], () => ({ mat: '', qty: 1, need: iso(addDays(new Date(), 7)) })),
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => { Object.assign(d, NS.readForm($('#hf', b))); d.lines = d.lines.filter((l) => l.mat && l.qty > 0); if (!d.lines.length) return toast('En az bir malzeme girin', 'err'); if (rec) db.update('prq', rec.id, d); else { d.no = 'ST' + db.nextNo('prq'); d.status = 'bekliyor'; db.insert('prq', d); db.log('Satınalma talebi', d.no); } close(); toast('Talep kaydedildi', 'ok'); app.go('satinalma', 'talepler'); } }],
    });
  }
  function poEditor(app, rec, preset) {
    const d = rec ? JSON.parse(JSON.stringify(rec)) : { date: today(), due: iso(addDays(new Date(), 5)), currency: 'TRY', rate: 1, lines: [{ mat: '', qty: 1, price: 0, vat: 1 }], note: S().poNote || '', ...(preset || {}) };
    modal({
      title: rec ? `${rec.no} düzenle` : 'Yeni satınalma siparişi', size: 'xl',
      body: `<div class="form-grid mb" id="hf">${NS.fieldsHtml([{ name: 'sup', label: 'Tedarikçi', type: 'select', required: true, options: db.all('suppliers', (s) => s.approved || s.id === d.sup).map((s) => ({ value: s.id, label: s.name })) }, { name: 'date', label: 'Sipariş tarihi', type: 'date' }, { name: 'due', label: 'Teslim tarihi', type: 'date' }, { name: 'currency', label: 'Para birimi', type: 'select', options: ['TRY', 'USD', 'EUR'] }, { name: 'rate', label: 'Kur', type: 'number', step: 'any' }, { name: 'note', label: 'Sipariş notu', full: true }], d)}</div><div id="gl"></div><div class="right mt" id="tt"></div>`,
      onOpen: (b) => { const g = gridEditor($('#gl', b), d.lines, [{ k: 'mat', label: 'Malzeme', type: 'select', opts: () => matOpts((m) => m.type !== 'mamul' && m.type !== 'yarimamul'), w: 260, onSet: (l) => { if (!l.price) l.price = mat(l.mat).cost; l.vat = mat(l.mat).type === 'hammadde' ? 1 : 20; } }, { k: 'qty', label: 'Miktar', type: 'number' }, { label: 'Birim', render: (l) => esc(mat(l.mat).unit) }, { k: 'price', label: 'Birim fiyat', type: 'number' }, { k: 'vat', label: 'KDV %', type: 'number', w: 60 }, { label: 'Tutar', cls: 'right', render: (l) => curFmt(l.qty * l.price, $('[name=currency]', b) ? $('[name=currency]', b).value : d.currency) }], () => ({ mat: '', qty: 1, price: 0, vat: 1 }), () => { const t = $('#tt', b); if (t) t.innerHTML = `<b style="font-size:18px">KDV dahil: ${curFmt(poTotal(d), $('[name=currency]', b) ? $('[name=currency]', b).value : d.currency)}</b>`; }); $('[name=currency]', b).onchange = g.draw; },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => { if (!NS.validate($('#hf', b))) return; Object.assign(d, NS.readForm($('#hf', b))); d.rate = d.currency === 'TRY' ? 1 : Number(d.rate) || 1; d.lines = d.lines.filter((l) => l.mat && l.qty > 0).map((l) => ({ received: 0, ...l })); if (!d.lines.length) return toast('En az bir satır girin', 'err'); let saved; if (rec) { db.update('po', rec.id, d); saved = db.get('po', rec.id); } else { d.no = 'SA' + db.nextNo('po'); d.status = 'acik'; saved = db.insert('po', d); db.log('Satınalma siparişi', `${d.no} · ${sup(d.sup).name}`); if (NS.integ) NS.integ.emit('satinalma', { no: d.no, supplier: sup(d.sup).name, total: poTotal(d) }); } close(); toast(`${saved.no} kaydedildi`, 'ok'); app.go('satinalma', 'siparisler'); } }],
    });
  }
  function printPO(p) {
    const s = S(), su = sup(p.sup);
    NS.printHtml(`<div class="doc"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div><div>VD: ${esc(s.taxOffice)} ${esc(s.taxNo)}</div></td><td style="text-align:right"><h2 style="margin:0">SATINALMA SİPARİŞİ</h2><div>No: <b>${esc(p.no)}</b></div><div>Tarih: ${NS.date(p.date)}</div><div>Teslim: <b>${NS.date(p.due)}</b></div></td></tr></table><hr><div><b>${esc(su.name)}</b><br>${esc(su.contact || '')} · ${esc(su.phone || '')} · ${esc(su.email || '')}</div><br>
      <table><tr><th>#</th><th>Kod</th><th>Malzeme</th><th style="text-align:right">Miktar</th><th style="text-align:right">Birim fiyat</th><th>KDV</th><th style="text-align:right">Tutar</th></tr>${p.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(mat(l.mat).code)}</td><td>${esc(mat(l.mat).name)}</td><td style="text-align:right">${num(l.qty)} ${esc(mat(l.mat).unit)}</td><td style="text-align:right">${curFmt(l.price, p.currency)}</td><td>%${l.vat}</td><td style="text-align:right">${curFmt(l.qty * l.price, p.currency)}</td></tr>`).join('')}</table>
      <p style="text-align:right"><b>KDV dahil toplam: ${curFmt(poTotal(p), p.currency)}</b></p>${p.note ? `<p><i>${esc(p.note)}</i></p>` : ''}<p style="font-size:11px">Ödeme vadesi: ${su.term || 30} gün · Teslim adresi: ${esc(s.bizAddress)}</p><table style="margin-top:40px"><tr><td>Hazırlayan<br><br>__________</td><td style="text-align:right">Onaylayan<br><br>__________</td></tr></table></div>`, { title: p.no });
  }
  function offerModal(app, pr) {
    const d = { sup: '', lead: 5, term: 30, currency: 'TRY', lines: pr.lines.map((l) => ({ mat: l.mat, price: mat(l.mat).cost })) };
    modal({
      title: `${pr.no} için tedarikçi teklifi`, size: 'wide',
      body: `<div class="form-grid mb" id="hf">${NS.fieldsHtml([{ name: 'sup', label: 'Tedarikçi', type: 'select', required: true, options: db.all('suppliers').map((s) => ({ value: s.id, label: s.name + (s.approved ? '' : ' (onaysız)') })) }, { name: 'lead', label: 'Teslim süresi (gün)', type: 'number' }, { name: 'term', label: 'Ödeme vadesi (gün)', type: 'number' }, { name: 'currency', label: 'Para birimi', type: 'select', options: ['TRY', 'USD', 'EUR'] }], d)}</div>${table({ rows: d.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Malzeme', render: (l) => esc(mat(l.mat).name) }, { label: 'Miktar', render: (l) => qu(pr.lines[l.id].qty, mat(l.mat)) }, { label: 'Birim fiyat', render: (l) => `<input class="input" type="number" step="any" data-op="${l.id}" value="${l.price}" style="width:120px">` }] })}`,
      actions: [{ label: 'Vazgeç' }, { label: 'Teklifi kaydet', cls: 'primary', onClick: (close, b) => { if (!NS.validate($('#hf', b))) return; Object.assign(d, NS.readForm($('#hf', b))); $$('[data-op]', b).forEach((x) => { d.lines[x.dataset.op].price = Number(x.value) || 0; }); db.insert('offers', { ...d, prq: pr.id, date: today() }); close(); toast('Teklif kaydedildi', 'ok'); app.refresh(); } }],
    });
  }
  function purchasingPage(el, p, app) {
    const tab = p || 'siparisler';
    const pos = db.all('po'); const late = openPO().filter((x) => x.due < today());
    el.innerHTML = pageHead('Satınalma', 'Talep → teklif karşılaştırma → sipariş → mal kabul', `<button class="btn" id="np">${icon('plus')} Talep</button><button class="btn primary" id="no">${icon('plus')} Sipariş</button>`) + `
      <div class="grid g4 mb">${kpi('Onay bekleyen talep', db.all('prq', (x) => x.status === 'bekliyor').length, 'clock', 'warn')}${kpi('Açık sipariş', openPO().length, 'truck', 'info')}${kpi('Geciken teslimat', late.length, 'alert', 'err')}${kpi('Açık sipariş tutarı', money(sum(openPO(), (x) => poTotal(x) * (x.rate || 1))), 'wallet')}</div>
      <div class="tabs">${[['talepler', 'Talepler'], ['teklifler', 'Teklif karşılaştırma'], ['siparisler', 'Siparişler']].map(([k, l]) => `<a href="#/satinalma/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div><div class="card" id="t"></div>`;
    $('#np', el).onclick = () => prqEditor(app); $('#no', el).onclick = () => poEditor(app);
    const t = $('#t', el);
    if (tab === 'talepler') {
      t.innerHTML = table({ rows: db.all('prq').sort((a, b) => b.date.localeCompare(a.date)), empty: 'Talep yok', emptyIcon: 'list', columns: [{ label: 'No', render: (r) => `<b>${esc(r.no)}</b><div class="small faint">${NS.date(r.date)}</div>` }, { label: 'Birim / talep eden', render: (r) => `${esc(r.dept)}<div class="small faint">${esc(r.by)}</div>` }, { label: 'Malzemeler', render: (r) => r.lines.map((l) => `<div class="small">${esc(mat(l.mat).name)} — <b>${qu(l.qty, mat(l.mat))}</b> <span class="faint">(${NS.date(l.need)})</span></div>`).join('') }, { label: 'Not', render: (r) => `<span class="small">${esc(r.note || '')}</span>` }, { label: 'Teklif', cls: 'right', render: (r) => db.all('offers', (o) => o.prq === r.id).length }, { label: 'Durum', render: (r) => badge(PRS[r.status][0], PRS[r.status][1]) }],
        actions: [{ label: 'Onayla', act: 'ok', show: (r) => r.status === 'bekliyor' }, { label: 'Reddet', act: 'rd', show: (r) => r.status === 'bekliyor' }, { label: 'Teklif gir', act: 'of', show: (r) => r.status === 'onaylandi' }, { label: 'Siparişe çevir', act: 'po', show: (r) => r.status === 'onaylandi' }, { icon: 'edit', act: 'ed', show: (r) => r.status === 'bekliyor' }, { icon: 'trash', act: 'del', show: (r) => r.status !== 'siparis' }] });
    } else if (tab === 'teklifler') {
      const prs = db.all('prq', (r) => db.all('offers', (o) => o.prq === r.id).length);
      t.innerHTML = prs.length ? prs.map((r) => { const ofs = db.all('offers', (o) => o.prq === r.id); const tot = (o) => sum(r.lines, (l) => l.qty * ((o.lines.find((x) => x.mat === l.mat) || {}).price || 0)); const best = ofs.reduce((a, o) => (tot(o) < tot(a) ? o : a), ofs[0]);
        return `<div class="card-h"><h3>${esc(r.no)} · ${esc(r.dept)}</h3>${badge(PRS[r.status][0], PRS[r.status][1])}</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Malzeme</th><th>Miktar</th>${ofs.map((o) => `<th class="right">${esc(sup(o.sup).name)}<div class="small faint">${o.lead} gün · ${o.term} gün vade</div></th>`).join('')}</tr></thead><tbody>${r.lines.map((l) => { const ps = ofs.map((o) => (o.lines.find((x) => x.mat === l.mat) || {}).price || 0); const mn = Math.min(...ps.filter((x) => x > 0)); return `<tr><td>${esc(mat(l.mat).name)}</td><td>${qu(l.qty, mat(l.mat))}</td>${ps.map((x) => `<td class="right" style="${x === mn ? 'color:var(--ok);font-weight:800' : ''}">${money(x)}</td>`).join('')}</tr>`; }).join('')}<tr><td colspan="2"><b>Toplam</b></td>${ofs.map((o) => `<td class="right"><b style="${o === best ? 'color:var(--ok)' : ''}">${money(tot(o))}</b>${r.status === 'onaylandi' ? `<div><button class="btn sm ${o === best ? 'primary' : ''}" data-win="${o.id}">Seç → sipariş</button></div>` : ''}</td>`).join('')}</tr></tbody></table></div>`; }).join('<hr>') : '<div class="pad muted">Teklif girilmiş talep yok. Talepler sekmesinde onaylı bir talep için “Teklif gir” deyin.</div>';
    } else {
      t.innerHTML = table({ rows: pos.sort((a, b) => b.date.localeCompare(a.date)), emptyIcon: 'truck', columns: [{ label: 'No', render: (x) => `<b>${esc(x.no)}</b><div class="small faint">${NS.date(x.date)}</div>` }, { label: 'Tedarikçi', render: (x) => esc(sup(x.sup).name) }, { label: 'Kalemler', render: (x) => x.lines.map((l) => `<div class="small">${esc(mat(l.mat).name)}: ${num(l.received || 0)} / <b>${qu(l.qty, mat(l.mat))}</b></div>`).join('') }, { label: 'Teslim', render: (x) => (['acik', 'kismi'].includes(x.status) && x.due < today() ? badge(`${NS.date(x.due)} · ${daysBetween(x.due, new Date())} gün gecikti`, 'err') : NS.date(x.due)) }, { label: 'Tutar', cls: 'right', render: (x) => `<b>${curFmt(poTotal(x), x.currency)}</b>` }, { label: 'Durum', render: (x) => badge(POS[x.status][0], POS[x.status][1]) }],
        actions: [{ label: 'Mal kabul', act: 'mk', show: (x) => ['acik', 'kismi'].includes(x.status) }, { icon: 'print', act: 'pr' }, { icon: 'mail', act: 'em', title: 'E-posta' }, { icon: 'phone', act: 'wa', title: 'WhatsApp' }, { icon: 'edit', act: 'pe', show: (x) => x.status === 'acik' }, { icon: 'x', act: 'cx', title: 'İptal', show: (x) => x.status === 'acik' }] });
    }
    on(el, 'click', '[data-win]', (e, b) => { const o = db.get('offers', b.dataset.win); const r = db.get('prq', o.prq); poEditor(app, null, { sup: o.sup, currency: o.currency, due: iso(addDays(new Date(), o.lead || 5)), prq: r.id, lines: r.lines.map((l) => ({ mat: l.mat, qty: l.qty, price: (o.lines.find((x) => x.mat === l.mat) || {}).price || 0, vat: mat(l.mat).type === 'hammadde' ? 1 : 20 })) }); r.status = 'siparis'; db.save(); });
    on(el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (tab === 'talepler') {
        const r = db.get('prq', b.dataset.id);
        if (a === 'ok') { r.status = 'onaylandi'; r.approvedBy = me(); db.save(); app.refresh(); }
        else if (a === 'rd') { const why = await NS.prompt('Red nedeni', '', { title: 'Talebi reddet' }); if (why === null) return; r.status = 'red'; r.reason = why; db.save(); app.refresh(); }
        else if (a === 'of') offerModal(app, r);
        else if (a === 'ed') prqEditor(app, r);
        else if (a === 'po') { const groups = {}; r.lines.forEach((l) => { const s = mat(l.mat).supplier || ''; (groups[s] = groups[s] || []).push(l); }); const keys = Object.keys(groups); if (keys.length > 1 && !(await confirm(`Malzemeler ${keys.length} farklı tedarikçiye ait; her biri için ayrı sipariş açılsın mı?`, { ok: 'Aç', danger: false }))) return; keys.forEach((s) => db.insert('po', { no: 'SA' + db.nextNo('po'), sup: s || db.all('suppliers')[0].id, date: today(), due: iso(addDays(new Date(), sup(s).lead || 5)), currency: 'TRY', rate: 1, status: 'acik', prq: r.id, note: S().poNote || '', lines: groups[s].map((l) => ({ mat: l.mat, qty: l.qty, price: mat(l.mat).cost, vat: mat(l.mat).type === 'hammadde' ? 1 : 20, received: 0 })) })); r.status = 'siparis'; db.save(); toast(`${keys.length} sipariş oluşturuldu`, 'ok'); app.go('satinalma', 'siparisler'); }
        else if (await confirm('Talep silinsin mi?')) { db.remove('prq', r.id); app.refresh(); }
        return;
      }
      const x = db.get('po', b.dataset.id); const su = sup(x.sup);
      if (a === 'mk') receiptEditor(app, x);
      else if (a === 'pr') printPO(x);
      else if (a === 'pe') poEditor(app, x);
      else if (a === 'em') { if (!su.email) return toast('Tedarikçinin e-postası yok', 'err'); NS.integ.email(su.email, `${S().bizName} — Satınalma siparişi ${x.no}`, `Sayın ${su.contact || su.name},\n\n${x.no} numaralı siparişimiz:\n${x.lines.map((l) => `- ${mat(l.mat).name}: ${num(l.qty)} ${mat(l.mat).unit} × ${curFmt(l.price, x.currency)}`).join('\n')}\n\nTeslim tarihi: ${NS.date(x.due)}\n${x.note || ''}\n\nSaygılarımızla,\n${S().bizName}`); }
      else if (a === 'wa') NS.integ.whatsapp(su.phone, `Merhaba, ${S().bizName} olarak ${x.no} numaralı siparişimizi ilettik. Teslim: ${NS.date(x.due)}. ${x.lines.map((l) => `${mat(l.mat).name} ${num(l.qty)} ${mat(l.mat).unit}`).join(', ')}`);
      else if (a === 'cx' && (await confirm(`${x.no} iptal edilsin mi?`))) { x.status = 'iptal'; db.save(); app.refresh(); }
    });
  }
  function suppliersPage(el, p, app) {
    const perf = (s) => { const rc = db.all('receipts', (r) => r.sup === s.id); const ontime = rc.filter((r) => { const po = db.get('po', r.po); return !po || r.date <= po.due; }).length; const q = sum(rc.flatMap((r) => r.lines), (l) => l.qty); const rej = sum(rc.flatMap((r) => r.lines), (l) => l.rejected || 0); return { n: rc.length, ontime: rc.length ? Math.round((ontime / rc.length) * 100) : null, rej: q ? r2((rej / q) * 100) : 0, total: sum(db.all('po', (x) => x.sup === s.id && x.status !== 'iptal'), (x) => poTotal(x) * (x.rate || 1)) }; };
    NS.crud(el, app, {
      col: 'suppliers', title: 'Tedarikçiler', sub: 'Onaylı tedarikçi listesi, sertifikalar ve performans', single: 'Tedarikçi', addLabel: 'Yeni tedarikçi', emptyIcon: 'building',
      fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'city', label: 'Şehir' }, { name: 'taxNo', label: 'VKN' }, { name: 'lead', label: 'Ortalama teslim süresi (gün)', type: 'number' }, { name: 'term', label: 'Ödeme vadesi (gün)', type: 'number' }, { name: 'cert', label: 'Sertifikalar (ISO, Helal, BRC...)', full: true }, { name: 'rating', label: 'Değerlendirme (1-5)', type: 'number' }, { name: 'approved', label: 'Onaylı tedarikçi listesinde', type: 'checkbox' }, { name: 'farmer', label: 'Çiftçi / üretici (e-Müstahsil makbuzu kesilir)', type: 'checkbox' }],
      defaults: { lead: 5, term: 30, rating: 4, approved: true }, sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (s) => [s.name, s.contact, s.city, s.cert],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'ok', label: 'Onaylı', test: (s) => s.approved }, { value: 'no', label: 'Onaysız', test: (s) => !s.approved }],
      columns: [{ key: 'name', label: 'Tedarikçi', render: (s) => `<b>${esc(s.name)}</b><div class="small faint">${esc(s.contact || '')} · ${esc(s.city || '')}</div>` }, { label: 'Sertifika', render: (s) => `<span class="small">${esc(s.cert || '-')}</span>` }, { label: 'Durum', render: (s) => (s.approved ? badge('Onaylı', 'ok') : badge('Onaysız', 'err')) }, { label: 'Puan', render: (s) => '★'.repeat(s.rating || 0) }, { label: 'Zamanında teslim', cls: 'right', render: (s) => { const x = perf(s); return x.ontime === null ? '-' : badge('%' + x.ontime, x.ontime >= 90 ? 'ok' : x.ontime >= 75 ? 'warn' : 'err'); } }, { label: 'Red oranı', cls: 'right', render: (s) => { const x = perf(s); return x.rej ? badge('%' + x.rej, x.rej > 2 ? 'err' : 'warn') : '%0'; } }, { label: 'Toplam alım', cls: 'right', render: (s) => money(perf(s).total) }],
    });
  }

  // ---------- Mal kabul ----------
  const RST = { kalite: ['Kalite bekliyor', 'warn'], tamam: ['Tamamlandı', 'ok'], kismi: ['Kısmi red', 'err'] };
  function receiptEditor(app, po) {
    const lines = po ? po.lines.filter((l) => l.qty - (l.received || 0) > 0).map((l) => { const m = mat(l.mat); return { mat: l.mat, ordered: r3(l.qty - (l.received || 0)), qty: r3(l.qty - (l.received || 0)), price: r2(l.price * (po.rate || 1)), supLot: '', skt: m.shelf ? iso(addDays(new Date(), m.shelf)) : '', loc: m.loc || '' }; }) : [{ mat: '', ordered: 0, qty: 0, price: 0, supLot: '', skt: '', loc: '' }];
    const h = { sup: po ? po.sup : '', waybill: '', waybillDate: today(), plate: '', driver: '', wh: po && po.lines.every((l) => mat(l.mat).type === 'ambalaj') ? 'w6' : 'w1', gross: '', tare: '', temp: '', checks: { arac: true, isi: true, ambalaj: true, belge: true } };
    modal({
      title: po ? `Mal kabul — ${po.no} · ${sup(po.sup).name}` : 'Siparişsiz mal kabul', size: 'xl',
      body: `<div class="form-grid mb" id="hf">${NS.fieldsHtml([...(po ? [] : [{ name: 'sup', label: 'Tedarikçi', type: 'select', required: true, options: db.all('suppliers').map((s) => ({ value: s.id, label: s.name })) }]), { name: 'waybill', label: 'Tedarikçi irsaliye no', required: true }, { name: 'waybillDate', label: 'İrsaliye tarihi', type: 'date' }, { name: 'plate', label: 'Araç plakası' }, { name: 'driver', label: 'Şoför' }, { name: 'wh', label: 'Kabul deposu', type: 'select', options: whs().filter((w) => w.type === 'hammadde' || w.type === 'uretim').map((w) => ({ value: w.id, label: w.name })) }, { name: 'temp', label: 'Araç / ürün sıcaklığı (°C)', type: 'number', step: 'any' }], h)}</div>
        <div class="card pad mb" style="background:var(--surface-2)"><div class="row"><b>Kantar</b><span class="small muted">Dolu (giriş) ve boş (çıkış) araç tartımı</span></div><div class="row mt"><input class="input" type="number" id="kg1" placeholder="Brüt (dolu) kg" style="max-width:160px"><button type="button" class="btn sm" data-tart="kg1">${icon('layers')} Oku</button><input class="input" type="number" id="kg2" placeholder="Dara (boş) kg" style="max-width:160px"><button type="button" class="btn sm" data-tart="kg2">${icon('layers')} Oku</button><span id="net" class="small"></span></div>
        <div class="row mt">${[['arac', 'Araç temiz, koku yok'], ['isi', 'Sıcaklık / soğuk zincir uygun'], ['ambalaj', 'Ambalaj sağlam, etiketli'], ['belge', 'İrsaliye + analiz sertifikası (CoA) tam']].map(([k, l]) => `<label class="check"><input type="checkbox" data-ck="${k}" checked> ${l}</label>`).join('')}</div></div>
        <div class="row mb"><input class="input" id="bc" placeholder="Malzeme barkodu okut + Enter" style="max-width:260px"><span class="small muted">Lot numaraları kayıtta otomatik verilir; SKT raf ömrüne göre önerilir.</span></div><div id="gl"></div>`,
      onOpen: (b) => {
        const locOpts = () => (wh($('[name=wh]', b).value).locs || []).map((x) => ({ value: x, label: x }));
        const g = gridEditor($('#gl', b), lines, [
          ...(po ? [{ label: 'Malzeme', render: (l) => `<b>${esc(mat(l.mat).name)}</b><div class="small faint">${esc(mat(l.mat).code)}${mat(l.mat).qc ? ' · ' + badge('KK', 'warn') : ''}</div>` }, { label: 'Kalan sipariş', cls: 'right', render: (l) => qu(l.ordered, mat(l.mat)) }] : [{ k: 'mat', label: 'Malzeme', type: 'select', opts: () => matOpts((m) => !['mamul', 'yarimamul'].includes(m.type)), w: 220, onSet: (l) => { const m = mat(l.mat); l.price = m.cost; l.loc = m.loc || ''; l.skt = m.shelf ? iso(addDays(new Date(), m.shelf)) : ''; } }]),
          { k: 'qty', label: 'Gelen miktar', type: 'number' }, { label: '', render: (l, i) => `<button type="button" class="btn sm ghost" data-tl="${i}" title="Teraziden oku">${icon('layers')}</button>` }, { k: 'supLot', label: 'Tedarikçi lot', w: 110 }, { k: 'skt', label: 'SKT', type: 'date', w: 140 }, { k: 'loc', label: 'Lokasyon', type: 'select', opts: locOpts, w: 100 }, { k: 'price', label: 'Birim fiyat ₺', type: 'number', w: 100 }], () => ({ mat: '', ordered: 0, qty: 0, price: 0, supLot: '', skt: '', loc: '' }));
        $('[name=wh]', b).onchange = g.draw;
        const net = () => { const a = Number($('#kg1', b).value), c = Number($('#kg2', b).value); if (!a || !c) { $('#net', b).textContent = ''; return; } const n = a - c; const kgLines = sum(lines.filter((l) => mat(l.mat).unit === 'kg'), (l) => l.qty); const diff = kgLines ? r2(((n - kgLines) / kgLines) * 100) : 0; $('#net', b).innerHTML = `Net: <b>${num(n)} kg</b>${kgLines ? ` · irsaliye ${num(kgLines)} kg · fark ${badge('%' + diff, Math.abs(diff) > 1 ? 'err' : 'ok')}` : ''}`; };
        $('#kg1', b).oninput = net; $('#kg2', b).oninput = net;
        on(b, 'click', '[data-tart]', async (e, x) => { const v = await readWeight('Kantar'); if (v !== null) { $('#' + x.dataset.tart, b).value = v; net(); } });
        on(b, 'click', '[data-tl]', async (e, x) => { const v = await readWeight('Tartım'); if (v !== null) { lines[x.dataset.tl].qty = v; g.draw(); } });
        $('#bc', b).onkeydown = (e) => { if (e.key !== 'Enter') return; const code = e.target.value.trim(); e.target.value = ''; const m = db.find('materials', (x) => x.barcode === code || x.code === code); if (!m) return toast('Barkod bulunamadı', 'err'); NS.beep(); const ex = lines.find((l) => l.mat === m.id); if (ex) { $$(`[data-gi="${lines.indexOf(ex)}"][data-gk="qty"]`, b)[0].focus(); return; } if (po) return toast('Bu malzeme siparişte yok', 'err'); lines.push({ mat: m.id, ordered: 0, qty: 0, price: m.cost, supLot: '', skt: m.shelf ? iso(addDays(new Date(), m.shelf)) : '', loc: m.loc || '' }); g.draw(); };
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kabul et', cls: 'primary', icon: 'check', onClick: async (close, b) => {
        if (!NS.validate($('#hf', b))) return;
        Object.assign(h, NS.readForm($('#hf', b))); if (po) h.sup = po.sup;
        $$('[data-ck]', b).forEach((x) => { h.checks[x.dataset.ck] = x.checked; });
        h.gross = Number($('#kg1', b).value) || 0; h.tare = Number($('#kg2', b).value) || 0;
        const ls = lines.filter((l) => l.mat && l.qty > 0); if (!ls.length) return toast('Gelen miktar girin', 'err');
        const over = ls.find((l) => po && l.qty > l.ordered * 1.1); if (over && !(await confirm(`${mat(over.mat).name}: gelen miktar siparişin %10'undan fazla. Yine de kabul edilsin mi?`, { ok: 'Kabul et', danger: false }))) return;
        const id = NS.uid(); const no = 'MK' + db.nextNo('rc');
        const recLines = ls.map((l) => {
          const m = mat(l.mat); const lot = createLot(m, { supplier: h.sup, supLot: l.supLot, receipt: id, ...(l.skt ? { skt: l.skt } : {}) });
          const old = stock(m.id) + stockByType(m.id, 'karantina');
          if (l.price > 0) { m.cost = r3((old * (m.cost || 0) + l.qty * l.price) / Math.max(old + l.qty, 1e-9)); }
          if (m.qc) move({ mat: m.id, wh: 'w2', loc: 'K-01', lot, qty: l.qty, cost: l.price, type: 'kabul', ref: id, refNo: no });
          else move({ mat: m.id, wh: h.wh, loc: l.loc || m.loc || '', lot, qty: l.qty, cost: l.price, type: 'kabul', ref: id, refNo: no });
          return { mat: m.id, ordered: l.ordered, qty: l.qty, lot, supLot: l.supLot, skt: lotRec(lot).skt, loc: l.loc || m.loc || '', price: l.price, qc: m.qc ? 'bekliyor' : 'yok', accepted: m.qc ? 0 : l.qty, rejected: 0 };
        });
        const rec = { id, no, po: po ? po.id : null, sup: h.sup, date: today(), waybill: h.waybill, waybillDate: h.waybillDate, plate: h.plate, driver: h.driver, wh: h.wh, temp: h.temp, gross: h.gross, tare: h.tare, checks: h.checks, lines: recLines, status: recLines.some((l) => l.qc === 'bekliyor') ? 'kalite' : 'tamam', by: me() };
        db.col('receipts').push(rec);
        if (po) { recLines.forEach((l) => { const pl = po.lines.find((x) => x.mat === l.mat); if (pl) pl.received = r3((pl.received || 0) + l.qty); }); po.status = po.lines.every((l) => (l.received || 0) >= l.qty * 0.98) ? 'tamam' : 'kismi'; }
        db.log('Mal kabul', `${no} · ${sup(h.sup).name} · ${recLines.length} kalem`); db.save();
        // Üreticiden (çiftçi) alımda e-Müstahsil makbuzu: tedarikçi kartında "çiftçi / üretici" işaretliyse
        if (sup(h.sup).farmer && NS.integ && NS.integ.isOn('emustahsil')) NS.integ.call('emustahsil', 'makbuz', { producer: sup(h.sup).name, tc: sup(h.sup).taxNo, lines: recLines.map((l) => ({ name: mat(l.mat).name, qty: l.qty, unit: mat(l.mat).unit, price: l.price })), stopaj: Number(NS.integ.cfg('emustahsil').stopaj) || 2 }).then((r) => { if (r && r.ok && !r.simulated) { rec.emustahsil = r.ref; db.save(); } else if (r && r.simulated) { rec.emustahsilTest = true; db.save(); toast('e-Müstahsil makbuzu TEST: simülasyonda, gönderilmedi', 'warn'); } });
        if (NS.integ) NS.integ.emit('malkabul', { no, supplier: sup(h.sup).name, lines: recLines.map((l) => ({ code: mat(l.mat).code, qty: l.qty, lot: l.lot })) });
        close();
        toast(`${no} kaydedildi${rec.status === 'kalite' ? ' — kalite kontrole düştü (karantina)' : ''}`, 'ok');
        if (Object.values(h.checks).some((x) => !x)) toast('Giriş kontrolünde uygunsuzluk işaretlendi; kalite birimine bildirildi', 'err');
        if (await confirm('Lot etiketleri yazdırılsın mı?', { ok: 'Yazdır', danger: false, title: 'Etiket' })) printLotLabels(recLines.map((l) => ({ mat: l.mat, lot: l.lot, qty: l.qty })));
        app.go('malkabul');
      } }],
    });
  }
  function printReceipt(r) {
    const s = S();
    NS.printHtml(`<div class="doc"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div></td><td style="text-align:right"><h2 style="margin:0">MAL KABUL FİŞİ</h2><div>No: <b>${esc(r.no)}</b></div><div>${NS.date(r.date)}</div></td></tr></table><hr>
      <table><tr><td>Tedarikçi: <b>${esc(sup(r.sup).name)}</b><br>Sipariş: ${esc((db.get('po', r.po) || {}).no || 'Siparişsiz')}<br>İrsaliye: ${esc(r.waybill)} (${NS.date(r.waybillDate || r.date)})</td><td>Plaka: ${esc(r.plate || '-')}<br>Şoför: ${esc(r.driver || '-')}<br>Sıcaklık: ${r.temp !== '' && r.temp !== undefined ? esc(r.temp) + ' °C' : '-'}${r.gross ? `<br>Kantar net: ${num(r.gross - r.tare)} kg` : ''}</td></tr></table>
      <p>Giriş kontrolü: ${Object.entries({ arac: 'Araç', isi: 'Sıcaklık', ambalaj: 'Ambalaj', belge: 'Belgeler' }).map(([k, l]) => `${l}: <b>${(r.checks || {})[k] ? 'Uygun' : 'UYGUNSUZ'}</b>`).join(' · ')}</p>
      <table><tr><th>Kod</th><th>Malzeme</th><th>Lot</th><th>Ted. lot</th><th>SKT</th><th>Lokasyon</th><th style="text-align:right">Miktar</th><th>Kalite</th></tr>${r.lines.map((l) => `<tr><td>${esc(mat(l.mat).code)}</td><td>${esc(mat(l.mat).name)}</td><td>${esc(l.lot)}</td><td>${esc(l.supLot || '')}</td><td>${l.skt ? NS.date(l.skt) : ''}</td><td>${esc(l.loc || '')}</td><td style="text-align:right">${num(l.qty)} ${esc(mat(l.mat).unit)}</td><td>${{ bekliyor: 'Bekliyor', kabul: 'Kabul', sartli: 'Şartlı kabul', red: 'Red', kismi: 'Kısmi red', yok: 'Gerekmiyor' }[l.qc] || l.qc}</td></tr>`).join('')}</table>
      <table style="margin-top:40px"><tr><td>Teslim eden<br><br>__________</td><td>Depo (${esc(r.by || '')})<br><br>__________</td><td style="text-align:right">Kalite<br><br>__________</td></tr></table></div>`, { title: r.no });
  }
  function receivingPage(el, p, app) {
    let f = 'all', q = '';
    const pending = db.all('receipts', (r) => r.status === 'kalite');
    const dueToday = openPO().filter((x) => x.due <= today());
    el.innerHTML = pageHead('Mal Kabul', 'Siparişe bağlı ya da siparişsiz giriş, kantar, lot, SKT ve karantina', `<button class="btn" id="nf">${icon('plus')} Siparişsiz kabul</button><button class="btn primary" id="np">${icon('truck')} Siparişten kabul</button>`) + `
      <div class="grid g4 mb">${kpi('Bugün beklenen / geciken', dueToday.length, 'truck', 'warn')}${kpi('Kalite bekleyen kabul', pending.length, 'shield', 'err')}${kpi('Bu ay kabul', db.all('receipts', (r) => r.date.slice(0, 7) === today().slice(0, 7)).length, 'check', 'ok')}${kpi('Karantinadaki değer', money(sum(db.all('materials'), (m) => stockByType(m.id, 'karantina') * (m.cost || 0))), 'wallet', 'info')}</div>
      ${dueToday.length ? `<div class="card mb"><div class="card-h"><h3>${icon('clock')} Bugün gelmesi beklenen siparişler</h3></div>${table({ rows: dueToday, columns: [{ label: 'Sipariş', render: (x) => `<b>${esc(x.no)}</b>` }, { label: 'Tedarikçi', render: (x) => esc(sup(x.sup).name) }, { label: 'Kalemler', render: (x) => x.lines.map((l) => `${esc(mat(l.mat).name)} ${num(l.qty - (l.received || 0))} ${esc(mat(l.mat).unit)}`).join(', ') }, { label: 'Teslim', render: (x) => (x.due < today() ? badge('Gecikti ' + NS.date(x.due), 'err') : badge('Bugün', 'warn')) }], actions: [{ label: 'Kabul et', act: 'mk' }] })}</div>` : ''}
      <div class="card"><div class="card-h">${NS.searchBox('q', 'Fiş no, tedarikçi, irsaliye, plaka...')}<div class="seg">${[['all', 'Tümü'], ['kalite', 'Kalite bekleyen'], ['tamam', 'Tamamlanan'], ['kismi', 'Red içeren']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('receipts', (r) => (f === 'all' || r.status === f) && NS.match(q, r.no, sup(r.sup).name, r.waybill, r.plate)).sort((a, b) => (b.date + b.no).localeCompare(a.date + a.no)), emptyIcon: 'truck', columns: [{ label: 'Fiş', render: (r) => `<b>${esc(r.no)}</b><div class="small faint">${NS.date(r.date)}</div>` }, { label: 'Tedarikçi', render: (r) => `${esc(sup(r.sup).name)}<div class="small faint">${esc((db.get('po', r.po) || {}).no || 'Siparişsiz')}</div>` }, { label: 'İrsaliye / araç', render: (r) => `${esc(r.waybill)}<div class="small faint">${esc(r.plate || '')}</div>` }, { label: 'Kalemler', render: (r) => r.lines.map((l) => `<div class="small">${esc(mat(l.mat).name)} — <b>${qu(l.qty, mat(l.mat))}</b> <span class="mono faint">${esc(l.lot)}</span></div>`).join('') }, { label: 'Kontrol', render: (r) => (Object.values(r.checks || {}).every(Boolean) ? badge('Uygun', 'ok') : badge('Uygunsuzluk', 'err')) }, { label: 'Durum', render: (r) => badge(RST[r.status][0], RST[r.status][1]) }], actions: [{ label: 'Kaliteye git', act: 'kk', show: (r) => r.status === 'kalite' }, { icon: 'tag', act: 'lb', title: 'Etiket' }, { icon: 'print', act: 'pr' }] }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    $('#nf', el).onclick = () => receiptEditor(app);
    $('#np', el).onclick = async () => { if (!openPO().length) return toast('Açık satınalma siparişi yok', 'err'); const v = await formModal({ title: 'Sipariş seçin', fields: [{ name: 'po', label: 'Açık sipariş', type: 'select', full: true, options: openPO().map((x) => ({ value: x.id, label: `${x.no} · ${sup(x.sup).name} · teslim ${NS.date(x.due)}` })) }] }); if (v) receiptEditor(app, db.get('po', v.po)); };
    on(el, 'click', '[data-act]', (e, b) => {
      const a = b.dataset.act;
      if (a === 'mk') return receiptEditor(app, db.get('po', b.dataset.id));
      const r = db.get('receipts', b.dataset.id);
      if (a === 'kk') app.go('kalite'); else if (a === 'lb') printLotLabels(r.lines.map((l) => ({ mat: l.mat, lot: l.lot, qty: l.accepted || l.qty }))); else printReceipt(r);
    });
    draw();
  }

  // ---------- Kalite kontrol ----------
  const QCD = { kabul: ['Kabul', 'ok'], sartli: ['Şartlı kabul', 'warn'], red: ['Red', 'err'], kismi: ['Kısmi red', 'err'], bekliyor: ['Bekliyor', 'info'] };
  function inspect(app, rec, idx) {
    const l = rec.lines[idx]; const m = mat(l.mat); const ps = qcParams(m);
    const tw = wh(rec.wh);
    modal({
      title: `Giriş kalite kontrol — ${m.name}`, size: 'wide',
      body: `<div class="row mb">${badge(rec.no, 'acc')} ${badge('Lot ' + l.lot)} ${badge(sup(rec.sup).name)} ${badge(qu(l.qty, m), 'info')} ${l.supLot ? badge('Ted. lot ' + l.supLot) : ''}</div>
        ${table({ rows: ps.map((x, i) => ({ ...x, id: i })), empty: 'Bu malzeme için parametre tanımlı değil — görsel kontrol yapın', columns: [{ label: 'Parametre', render: (x) => `<b>${esc(x.name)}</b>` }, { label: 'Spesifikasyon', render: (x) => (x.min === null && x.max === null ? 'Uygun / uygun değil' : `${x.min !== null ? 'min ' + x.min : ''} ${x.max !== null ? 'max ' + x.max : ''}`) }, { label: 'Ölçülen', render: (x) => (x.min === null && x.max === null ? `<select class="input" data-pv="${x.id}" style="width:130px"><option value="1">Uygun</option><option value="0">Uygun değil</option></select>` : `<input class="input" type="number" step="any" data-pv="${x.id}" style="width:110px">`) }, { label: 'Sonuç', render: (x) => `<span data-pr="${x.id}" class="faint">-</span>` }] })}
        <div class="form-grid mt" id="qf">${NS.fieldsHtml([{ name: 'sample', label: 'Numune miktarı', type: 'number', step: 'any', value: 0 }, { name: 'decision', label: 'Karar', type: 'select', options: [{ value: 'kabul', label: 'Kabul' }, { value: 'sartli', label: 'Şartlı kabul (sapma onayı)' }, { value: 'kismi', label: 'Kısmi red' }, { value: 'red', label: 'Tamamen red' }] }, { name: 'accepted', label: 'Kabul edilen miktar', type: 'number', step: 'any', value: l.qty }, { name: 'loc', label: `Yerleşim (${tw.name})`, type: 'select', options: tw.locs || [], value: l.loc }, { name: 'reason', label: 'Red / sapma nedeni', full: true }, { name: 'note', label: 'Not', full: true }], {})}</div>`,
      onOpen: (b) => {
        const evalP = () => { let bad = 0; ps.forEach((x, i) => { const inp = $(`[data-pv="${i}"]`, b); const out = $(`[data-pr="${i}"]`, b); let ok; if (x.min === null && x.max === null) ok = inp.value === '1'; else { if (inp.value === '') { out.innerHTML = '-'; return; } const v = Number(inp.value); ok = (x.min === null || v >= x.min) && (x.max === null || v <= x.max); } out.innerHTML = ok ? badge('Uygun', 'ok') : badge('Uygun değil', 'err'); if (!ok) bad++; }); if (bad && $('[name=decision]', b).value === 'kabul') { $('[name=decision]', b).value = 'red'; $('[name=decision]', b).dispatchEvent(new Event('change')); } };
        on(b, 'input', '[data-pv]', evalP); on(b, 'change', '[data-pv]', evalP);
        $('[name=decision]', b).onchange = (e) => { const d = e.target.value; $('[name=accepted]', b).value = d === 'red' ? 0 : d === 'kismi' ? r3(l.qty / 2) : l.qty; $('[name=accepted]', b).readOnly = d !== 'kismi'; };
        $('[name=accepted]', b).readOnly = true;
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kararı kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
        const v = NS.readForm($('#qf', b)); const acc = r3(Math.min(l.qty, Math.max(0, Number(v.accepted) || 0))); const smp = r3(Number(v.sample) || 0); const rej = r3(l.qty - acc);
        if ((v.decision === 'red' || v.decision === 'kismi' || v.decision === 'sartli') && !v.reason) return toast('Red / sapma nedeni girin', 'err');
        const results = ps.map((x, i) => { const val = $(`[data-pv="${i}"]`, b).value; const ok = x.min === null && x.max === null ? val === '1' : val !== '' && (x.min === null || Number(val) >= x.min) && (x.max === null || Number(val) <= x.max); return { name: x.name, value: val, ok }; });
        if (v.decision === 'kabul' && results.some((x) => !x.ok && x.value !== '')) return toast('Uygun olmayan parametre var — şartlı kabul veya red seçin', 'err');
        const c = l.price || m.cost;
        if (smp > 0) move({ mat: m.id, wh: 'w2', loc: 'K-01', lot: l.lot, qty: -smp, cost: c, type: 'fire', ref: rec.id, refNo: rec.no, note: 'Laboratuvar numunesi' });
        const accNet = r3(Math.max(0, acc - smp));
        if (accNet > 0) { move({ mat: m.id, wh: 'w2', loc: 'K-01', lot: l.lot, qty: -accNet, cost: c, type: 'kk-kabul', ref: rec.id, refNo: rec.no }); move({ mat: m.id, wh: rec.wh, loc: v.loc || l.loc, lot: l.lot, qty: accNet, cost: c, type: 'kk-kabul', ref: rec.id, refNo: rec.no }); }
        if (rej > 0) {
          move({ mat: m.id, wh: 'w2', loc: 'K-01', lot: l.lot, qty: -rej, cost: c, type: 'kk-red', ref: rec.id, refNo: rec.no, note: v.reason }); move({ mat: m.id, wh: 'w5', loc: 'R-01', lot: l.lot, qty: rej, cost: c, type: 'kk-red', ref: rec.id, refNo: rec.no, note: v.reason });
          db.col('returns').push({ id: NS.uid(), no: 'TI' + db.nextNo('ret'), date: today(), sup: rec.sup, receipt: rec.id, status: 'taslak', lines: [{ mat: m.id, lot: l.lot, qty: rej, reason: v.reason, price: c }] });
        }
        Object.assign(l, { qc: v.decision, accepted: accNet, rejected: rej, sample: smp, qcBy: me(), qcAt: new Date().toISOString(), qcReason: v.reason, qcNote: v.note, results, loc: v.loc || l.loc });
        if (rec.lines.every((x) => x.qc !== 'bekliyor')) rec.status = rec.lines.some((x) => x.rejected > 0) ? 'kismi' : 'tamam';
        db.log('Kalite kararı', `${rec.no} · ${m.name} · ${QCD[v.decision][0]}`); db.save(); dirty();
        close(); toast(`Karar kaydedildi: ${QCD[v.decision][0]}${rej > 0 ? ' — red miktarı iade alanına alındı, iade taslağı oluşturuldu' : ''}`, rej > 0 ? 'err' : 'ok'); app.refresh();
      } }],
    });
  }
  function printCoA(rec, l) {
    const m = mat(l.mat);
    NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>GİRİŞ KALİTE KONTROL RAPORU</h3><table><tr><td>Malzeme: <b>${esc(m.code)} · ${esc(m.name)}</b><br>Lot: <b>${esc(l.lot)}</b> · Tedarikçi lot: ${esc(l.supLot || '-')}<br>Tedarikçi: ${esc(sup(rec.sup).name)}</td><td>Kabul fişi: ${esc(rec.no)} (${NS.date(rec.date)})<br>Miktar: ${num(l.qty)} ${esc(m.unit)} · Numune: ${num(l.sample || 0)}<br>Kontrol eden: ${esc(l.qcBy || '')} · ${l.qcAt ? NS.dt(l.qcAt) : ''}</td></tr></table><br><table><tr><th>Parametre</th><th>Sonuç</th><th>Değerlendirme</th></tr>${(l.results || []).map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.value === '1' ? 'Uygun' : x.value === '0' ? 'Uygun değil' : x.value)}</td><td>${x.ok ? 'UYGUN' : 'UYGUN DEĞİL'}</td></tr>`).join('') || '<tr><td colspan="3">Görsel kontrol</td></tr>'}</table><p><b>KARAR: ${QCD[l.qc] ? QCD[l.qc][0].toUpperCase() : '-'}</b> · Kabul: ${num(l.accepted)} · Red: ${num(l.rejected)}</p>${l.qcReason ? `<p>Neden: ${esc(l.qcReason)}</p>` : ''}${l.qcNote ? `<p>Not: ${esc(l.qcNote)}</p>` : ''}<table style="margin-top:40px"><tr><td>Kalite Kontrol<br><br>__________</td><td style="text-align:right">Kalite Müdürü<br><br>__________</td></tr></table></div>`, { title: 'KK ' + l.lot });
  }
  function qualityPage(el, p, app) {
    const tab = p || 'bekleyen';
    const items = db.all('receipts').flatMap((r) => r.lines.map((l, i) => ({ id: r.id + ':' + i, r, l, i })));
    const pend = items.filter((x) => x.l.qc === 'bekliyor'); const done = items.filter((x) => !['bekliyor', 'yok'].includes(x.l.qc));
    const m30 = done.filter((x) => daysBetween(x.l.qcAt || x.r.date, new Date()) <= 30);
    el.innerHTML = pageHead('Kalite Kontrol', 'Giriş kalite kontrolü, parametre ölçümü, kabul / şartlı kabul / red kararı') + `
      <div class="grid g4 mb">${kpi('Karar bekleyen', pend.length, 'clock', 'warn')}${kpi('Son 30 gün kontrol', m30.length, 'shield', 'info')}${kpi('Red / kısmi red', m30.filter((x) => x.l.rejected > 0).length, 'x', 'err')}${kpi('Bloke lot', db.all('lots', (l) => l.status === 'bloke').length, 'lock')}</div>
      <div class="tabs">${[['bekleyen', `Karar bekleyen (${pend.length})`], ['sonuc', 'Kontrol geçmişi'], ['bloke', 'Bloke lotlar']].map(([k, l]) => `<a href="#/kalite/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div><div class="card" id="t"></div>`;
    if (tab === 'bekleyen') $('#t', el).innerHTML = table({ rows: pend, empty: 'Kontrol bekleyen giriş yok', emptyIcon: 'shield', columns: [{ label: 'Kabul', render: (x) => `<b>${esc(x.r.no)}</b><div class="small faint">${NS.date(x.r.date)}</div>` }, { label: 'Malzeme', render: (x) => `<b>${esc(mat(x.l.mat).name)}</b><div class="small faint">${esc(sup(x.r.sup).name)}</div>` }, { label: 'Lot', render: (x) => `<span class="mono">${esc(x.l.lot)}</span><div class="small faint">${esc(x.l.supLot || '')}</div>` }, { label: 'Miktar', cls: 'right', render: (x) => qu(x.l.qty, mat(x.l.mat)) }, { label: 'Giriş kontrolü', render: (x) => (Object.values(x.r.checks || {}).every(Boolean) ? badge('Uygun', 'ok') : badge('Uygunsuzluk var', 'err')) }, { label: 'Bekleme', render: (x) => `${daysBetween(x.r.date, new Date())} gün` }], actions: [{ label: 'Kontrol et', act: 'in' }] });
    else if (tab === 'sonuc') $('#t', el).innerHTML = table({ rows: done.sort((a, b) => String(b.l.qcAt || b.r.date).localeCompare(String(a.l.qcAt || a.r.date))), empty: 'Kayıt yok', columns: [{ label: 'Tarih', render: (x) => NS.date(x.l.qcAt || x.r.date) }, { label: 'Malzeme', render: (x) => `<b>${esc(mat(x.l.mat).name)}</b><div class="small faint">${esc(sup(x.r.sup).name)}</div>` }, { label: 'Lot', render: (x) => `<span class="mono">${esc(x.l.lot)}</span>` }, { label: 'Kabul / red', cls: 'right', render: (x) => `${num(x.l.accepted)} / <b style="color:${x.l.rejected ? 'var(--err)' : 'inherit'}">${num(x.l.rejected)}</b>` }, { label: 'Karar', render: (x) => badge(QCD[x.l.qc][0], QCD[x.l.qc][1]) + (x.l.qcReason ? `<div class="small faint">${esc(x.l.qcReason)}</div>` : '') }, { label: 'Kontrol eden', render: (x) => esc(x.l.qcBy || '') }], actions: [{ icon: 'print', act: 'coa', title: 'Rapor' }] });
    else $('#t', el).innerHTML = table({ rows: db.all('lots', (l) => l.status === 'bloke'), empty: 'Bloke lot yok', columns: [{ label: 'Lot', render: (l) => `<b class="mono">${esc(l.no)}</b>` }, { label: 'Malzeme', render: (l) => esc(mat(l.mat).name) }, { label: 'Neden', render: (l) => esc(l.blockReason || '') }, { label: 'Stok', cls: 'right', render: (l) => num(sum(rowsOf(l.mat).filter((r) => r.lot === l.no), (r) => r.qty)) }], actions: [{ label: 'Serbest bırak', act: 'ub' }, { icon: 'search', act: 'iz' }] });
    on(el, 'click', '[data-act]', (e, b) => {
      const a = b.dataset.act;
      if (a === 'ub') { const l = db.get('lots', b.dataset.id); l.status = ''; db.log('Lot serbest', l.no); db.save(); return app.refresh(); }
      if (a === 'iz') return app.go('izlenebilirlik', b.dataset.id);
      const [rid, i] = b.dataset.id.split(':'); const r = db.get('receipts', rid);
      if (a === 'in') inspect(app, r, Number(i)); else printCoA(r, r.lines[Number(i)]);
    });
  }

  // ---------- Tedarikçi iadeleri ----------
  const RTS = { taslak: ['Taslak', 'warn'], gonderildi: ['Gönderildi', 'info'], kapandi: ['Kapandı', 'ok'] };
  function printReturn(t) {
    const s = S(), su = sup(t.sup);
    NS.printHtml(`<div class="doc"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)}</div></td><td style="text-align:right"><h2 style="margin:0">İADE İRSALİYESİ</h2><div>No: <b>${esc(t.no)}</b></div><div>${NS.date(t.shipDate || t.date)}</div></td></tr></table><hr><b>${esc(su.name)}</b><br>Kabul fişi: ${esc((db.get('receipts', t.receipt) || {}).no || '-')} · Plaka: ${esc(t.plate || '-')}<br><br><table><tr><th>Kod</th><th>Malzeme</th><th>Lot</th><th style="text-align:right">Miktar</th><th>İade nedeni</th></tr>${t.lines.map((l) => `<tr><td>${esc(mat(l.mat).code)}</td><td>${esc(mat(l.mat).name)}</td><td>${esc(l.lot)}</td><td style="text-align:right">${num(l.qty)} ${esc(mat(l.mat).unit)}</td><td>${esc(l.reason || '')}</td></tr>`).join('')}</table>${t.ebelge ? `<p style="font-size:11px">e-İrsaliye: ${esc(t.ebelge)}</p>` : ''}<table style="margin-top:40px"><tr><td>Teslim eden<br><br>__________</td><td style="text-align:right">Teslim alan<br><br>__________</td></tr></table></div>`, { title: t.no });
  }
  function returnsPage(el, p, app) {
    el.innerHTML = pageHead('Tedarikçi İadeleri', 'Kalite reddi sonrası iade, iade irsaliyesi ve alacak takibi') + `<div class="card" id="t"></div>`;
    $('#t', el).innerHTML = table({ rows: db.all('returns').sort((a, b) => b.date.localeCompare(a.date)), empty: 'İade kaydı yok', emptyIcon: 'truck', columns: [{ label: 'No', render: (t) => `<b>${esc(t.no)}</b><div class="small faint">${NS.date(t.date)}</div>` }, { label: 'Tedarikçi', render: (t) => esc(sup(t.sup).name) }, { label: 'Kalemler', render: (t) => t.lines.map((l) => `<div class="small">${esc(mat(l.mat).name)} — <b>${qu(l.qty, mat(l.mat))}</b> <span class="faint">${esc(l.reason || '')}</span></div>`).join('') }, { label: 'Tutar', cls: 'right', render: (t) => money(sum(t.lines, (l) => l.qty * (l.price || 0))) }, { label: 'Durum', render: (t) => badge(RTS[t.status][0], RTS[t.status][1]) + (t.credit ? `<div class="small faint">Dekont ${esc(t.credit)}</div>` : '') }], actions: [{ label: 'Sevk et', act: 'go', show: (t) => t.status === 'taslak' }, { label: 'Kapat', act: 'cl', show: (t) => t.status === 'gonderildi' }, { icon: 'print', act: 'pr' }, { icon: 'trash', act: 'del', show: (t) => t.status === 'taslak' }] });
    on(el, 'click', '[data-act]', async (e, b) => {
      const t = db.get('returns', b.dataset.id); const a = b.dataset.act;
      if (a === 'pr') return printReturn(t);
      if (a === 'go') { const v = await formModal({ title: `${t.no} sevk`, fields: [{ name: 'plate', label: 'Araç plakası' }, { name: 'eirs', label: 'e-İrsaliye gönder', type: 'checkbox', value: NS.integ && NS.integ.isOn('eirsaliye') }] }); if (!v) return; t.lines.forEach((l) => { const r = rowsOf(l.mat).find((x) => x.lot === l.lot && x.wh === 'w5'); move({ mat: l.mat, wh: 'w5', loc: r ? r.loc : 'R-01', lot: l.lot, qty: -Math.min(l.qty, r ? r.qty : l.qty), cost: l.price, type: 'iade', ref: t.id, refNo: t.no }); }); t.status = 'gonderildi'; t.plate = v.plate; t.shipDate = today(); if (v.eirs && NS.ebelge) { const su = sup(t.sup); const r = await NS.ebelge.create({ docType: 'e-İrsaliye', no: t.no, buyer: su.name, buyerVkn: su.taxNo, buyerTaxOffice: su.taxOffice, address: su.address || su.city || '', plate: v.plate, date: today(), note: 'Tedarikçiye iade', lines: t.lines.map((l) => ({ code: mat(l.mat).code, name: `${mat(l.mat).name} (lot ${l.lot})`, qty: l.qty, unit: mat(l.mat).unit, price: l.price || 0 })) }); if (r && r.ok) { t.ebelge = r.no; t.ebelgeId = r.id; t.ebelgeTest = !!r.simulated; } } db.save(); toast('İade sevk edildi, stoktan düşüldü', 'ok'); printReturn(t); app.refresh(); }
      else if (a === 'cl') { const c = await NS.prompt('Tedarikçinin iade faturası / alacak dekont no', '', { title: 'İadeyi kapat' }); if (c === null) return; t.credit = c; t.status = 'kapandi'; db.save(); app.refresh(); }
      else if (await confirm('İade taslağı silinsin mi? (Malzeme red alanında kalır)')) { db.remove('returns', t.id); app.refresh(); }
    });
  }

  Object.assign(F, { db, S, me, mat, whs, wh, sup, cus, stn, lotRec, qu, matOpts, typeBadge, sktBadge, curFmt, r2, ix, dirty, rowsOf, stock, stockByType, fefo, move, pickPlan, createLot, openPO, onOrder, inProd, bomOf, unitCost, needOf, poTotal, printLotLabels, readWeight, gridEditor, matDetail, prqEditor, poEditor, isUsable,
    pages: { malzemeler: materialsPage, stok: stockPage, izlenebilirlik: tracePage, satinalma: purchasingPage, tedarikciler: suppliersPage, malkabul: receivingPage, kalite: qualityPage, iadeler: returnsPage } });
})();
