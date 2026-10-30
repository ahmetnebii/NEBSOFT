/* NEBSOFT Pazaryeri Kâr & Fiyat Robotu — KDV'li gerçek kâr, komisyon/kargo hesaplayıcı,
   buybox ve marj stratejileri, zarar koruması (taban fiyat), fiyat değişikliklerini kanallara gönderme */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const F = window.FRB;
  const db = new NS.DB('fiyatrobotu', F.seed);
  const S = () => db.settings({});
  const prod = (id) => db.get('products', id) || {};
  const CH = F.CH;
  const chB = (k) => `<span class="badge" style="background:${CH[k].color};color:#fff;border:0">${CH[k].short}</span>`;
  const comOf = (p, ch) => { const o = (db.data.comOverride || {})[p.cat]; return (o && o[ch] != null ? o[ch] : (F.COM[p.cat] || {})[ch]) ?? 18; };
  const cargoOf = (p, ch) => F.cargoOf(ch, p.desi || 1, (db.data.cargoOverride || {})[ch]);
  const params = (L) => { const p = prod(L.pid); return { cost: p.cost, vat: p.vat, com: comOf(p, L.ch), fee: CH[L.ch].fee, cargo: cargoOf(p, L.ch), extra: Number(S().packCost) || 0 }; };
  const res = (L, price) => F.calc({ ...params(L), price: price ?? L.price });
  const minComp = (L) => (L.comps.length ? Math.min(...L.comps.map((c) => c.price)) : null);
  const floorOf = (L) => Math.max(Number(L.minPrice) || 0, F.priceFor({ ...params(L), margin: Number(S().minMargin) || 0 }) || 0);
  const ending = (x, lo) => { const e = Number(S().ending); if (isNaN(e) || e < 0) return Math.round(x * 100) / 100; let v = Math.floor(x) + e; if (v > x + 1e-9) v -= 1; if (lo && v < lo) v += 1; return Math.round(v * 100) / 100; };
  const mB = (m) => badge('%' + m, m < 0 ? 'err' : m < (Number(S().minMargin) || 8) ? 'warn' : 'ok');

  // Strateji → önerilen fiyat ve gerekçe
  function propose(L) {
    if (L.strategy === 'sabit' || !L.active) return null;
    const mc = minComp(L); const fl = floorOf(L); const ce = Number(L.maxPrice) || Infinity;
    let target, why;
    if (L.strategy === 'buybox') { if (mc == null) return null; target = mc - (Number(L.undercut) || 1); why = `En ucuz rakip ${money(mc)} → ${L.undercut || 1} ₺ altı`; }
    else if (L.strategy === 'esitle') { if (mc == null) return null; target = mc; why = `En ucuz rakiple eşitle (${money(mc)})`; }
    else { target = F.priceFor({ ...params(L), margin: Number(L.targetMargin) || 15 }); why = `%${L.targetMargin} hedef marj`; }
    let np = Math.min(Math.max(target, fl), ce);
    if (np === fl && target < fl) why += ` · taban fiyatta durdu (zarar koruması %${S().minMargin})`;
    if (np === ce && target > ce) why += ' · tavan fiyatta durdu';
    np = ending(np, fl);
    return Math.abs(np - L.price) < 0.01 ? null : { L, from: L.price, to: np, why, before: res(L).profit, after: res(L, np).profit };
  }
  // Fiyatları kanala gönder (canlı Trendyol/Hepsiburada server.js köprüsüyle, diğerleri demo)
  // Rakip fiyatı gerçek bir kaynaktan mı (pazaryeri rakip/buybox servisi ya da fiyat dosyası: comps[].source)? Demo verisi kaynaksızdır.
  const realComps = (L) => !L.comps.length || L.comps.every((c) => c.source);
  async function push(changes) {
    const by = NS.groupBy(changes, (c) => c.L.ch); const errs = []; const local = [];
    for (const [ch, L] of Object.entries(by)) {
      const cfg = (db.data.channels || {})[ch] || {};
      const live = cfg.mode === 'live' && ['trendyol', 'hepsiburada'].includes(ch);
      // Uydurma (demo) rakip fiyatına göre hesaplanmış fiyat canlı kanala gönderilmez
      if (live && L.some((c) => !realComps(c.L) && ['buybox', 'esitle'].includes(c.L.strategy))) { errs.push(`${CH[ch].name}: rakip fiyatları gerçek bir kaynaktan alınmadı (TEST) — rakibe göre hesaplanan fiyatlar gönderilmedi`); continue; }
      if (!live) local.push(CH[ch].name);
      if (live) {
        try { const r = await (await fetch('/api/kanal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: ch, action: 'stok-fiyat', creds: { sellerId: cfg.sellerId, apiKey: cfg.apiKey, apiSecret: cfg.apiSecret }, payload: { items: L.map((c) => ({ barcode: prod(c.L.pid).barcode, sku: prod(c.L.pid).sku, stock: prod(c.L.pid).stock, price: c.to, listPrice: Math.max(c.to, Number(c.L.maxPrice) || c.to) })) } }) })).json(); if (!r.ok) { errs.push(`${CH[ch].name}: ${r.error}`); continue; } } catch (e) { errs.push(`${CH[ch].name}: sunucu köprüsü yok`); continue; }
      }
      // Canlı olmayan kanalda fiyat yalnızca programda değişir (kanala gönderilmedi, buybox bilinmez)
      L.forEach((c) => { c.L.price = c.to; c.L.updated = new Date().toISOString(); c.L.notSynced = !live; c.L.buybox = live ? minComp(c.L) == null || c.to <= minComp(c.L) : false; db.insert('history', { lid: c.L.id, at: today(), own: c.to, min: minComp(c.L) || c.to }, true); });
    }
    db.insert('runs', { at: new Date().toISOString(), n: changes.length, gain: sum(changes, (c) => c.after - c.before), errs, local }, true); db.save();
    errs.local = local; return errs;
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const L = db.all('listings', (x) => x.active); const R = L.map((x) => ({ x, r: res(x) }));
    const loss = R.filter((y) => y.r.profit < 0); const bb = L.filter((x) => x.buybox).length; const pend = L.map(propose).filter(Boolean);
    el.innerHTML = pageHead(S().bizName, `${L.length} aktif listeleme · ${Object.keys(CH).length} pazaryeri`, `<a class="btn" href="#/hesap">${icon('percent')} Hesaplayıcı</a><a class="btn primary" href="#/robot">${icon('zap')} Robotu çalıştır</a>`) + `
      <div class="grid g4 mb">${kpi('Ortalama net marj', '%' + (R.length ? (sum(R, (y) => y.r.margin) / R.length).toFixed(1) : 0), 'percent', 'info')}${kpi('Zarar eden listeleme', loss.length, 'alert', loss.length ? 'err' : 'ok', '<div class="small faint">Komisyon + kargo sonrası eksi</div>')}${kpi('Buybox sizde', `${bb}/${L.length}`, 'award', 'ok')}${kpi('Robot önerisi', pend.length, 'zap', 'warn', `<div class="small faint">${money(sum(pend, (c) => c.after - c.before))} kâr etkisi / satış</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kanal bazında ortalama marj</h3></div><div class="card-b">${chart.bars(Object.keys(CH).map((k) => { const y = R.filter((z) => z.x.ch === k); return { label: CH[k].short, value: y.length ? Math.max(0, sum(y, (z) => z.r.margin) / y.length) : 0 }; }), { format: (v) => '%' + v.toFixed(1) })}</div></div>
      <div class="card"><div class="card-h"><h3>Bir satışın parası nereye gidiyor? (ortalama)</h3></div><div class="card-b">${(() => { const n = R.length || 1; const a = { 'Ürün maliyeti': sum(R, (y) => prod(y.x.pid).cost) / n, 'Komisyon': sum(R, (y) => y.r.comAmt) / n, 'Kargo': sum(R, (y) => y.r.cargo) / n, 'Hizmet bedeli': sum(R, (y) => y.r.fee) / n, 'KDV': sum(R, (y) => y.x.price - y.r.netSale) / n, 'Net kâr': Math.max(0, sum(R, (y) => y.r.profit) / n) }; return chart.donut(Object.entries(a).map(([label, value]) => ({ label, value: Math.round(value) })), { size: 140, format: (v) => money(v) }); })()}</div></div></div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Zarar eden listelemeler</h3><a class="btn sm" href="#/karlilik/zarar">Tümü</a></div>${table({ rows: loss.slice(0, 8).map((y) => ({ id: y.x.id, ...y })), empty: 'Zarar eden listeleme yok', columns: [{ label: 'Ürün', render: (y) => `${chB(y.x.ch)} <b>${esc(prod(y.x.pid).name)}</b>` }, { label: 'Fiyat', cls: 'right', render: (y) => money(y.x.price) }, { label: 'Kâr', cls: 'right', render: (y) => `<b style="color:var(--err)">${money(y.r.profit)}</b>` }, { label: 'Başa baş fiyat', cls: 'right', render: (y) => money(F.priceFor({ ...params(y.x), margin: 0 })) }] })}</div>`;
  }

  // ---------- Kârlılık ----------
  function profitPage(el, p, app) {
    let f = p || '', q = '', chf = '';
    el.innerHTML = pageHead('Kârlılık', 'Her listelemenin KDV, komisyon, hizmet bedeli, kargo ve paketleme sonrası net kârı') + `<div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Ürün ara...')}<select class="input" id="ch" style="max-width:170px"><option value="">Tüm kanallar</option>${Object.keys(CH).map((k) => `<option value="${k}">${CH[k].name}</option>`).join('')}</select><div class="seg">${[['', 'Tümü'], ['zarar', 'Zarar'], ['dusuk', 'Düşük marj'], ['bbyok', 'Buybox kaybı']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => {
      const rows = db.all('listings', (x) => (!chf || x.ch === chf) && NS.match(q, prod(x.pid).name, prod(x.pid).sku)).map((x) => ({ id: x.id, x, r: res(x) })).filter((y) => !f || (f === 'zarar' ? y.r.profit < 0 : f === 'dusuk' ? y.r.margin < (Number(S().minMargin) || 8) : !y.x.buybox)).sort((a, b) => a.r.margin - b.r.margin);
      $('#t', el).innerHTML = table({ rows, emptyIcon: 'percent', columns: [
        { label: 'Ürün', render: (y) => `${chB(y.x.ch)} <b>${esc(prod(y.x.pid).name)}</b><div class="small faint">${esc(prod(y.x.pid).sku)} · ${esc(prod(y.x.pid).cat)} · ${prod(y.x.pid).desi} desi</div>` },
        { label: 'Satış', cls: 'right', render: (y) => `<b>${money(y.x.price)}</b>${y.x.notSynced ? '<div>' + badge('Kanala gönderilmedi', 'warn') + '</div>' : y.x.buybox ? '<div>' + badge('Buybox', 'ok') + '</div>' : `<div class="small faint">rakip ${money(minComp(y.x))}${realComps(y.x) ? '' : ' (TEST)'}</div>`}` },
        { label: 'Maliyet', cls: 'right', render: (y) => money(prod(y.x.pid).cost) },
        { label: 'Komisyon', cls: 'right', render: (y) => `${money(y.r.comAmt)}<div class="small faint">%${comOf(prod(y.x.pid), y.x.ch)}</div>` },
        { label: 'Kargo + bedel', cls: 'right', render: (y) => money(y.r.cargo + y.r.fee) },
        { label: 'Net kâr', cls: 'right', render: (y) => `<b style="color:var(--${y.r.profit < 0 ? 'err' : 'ok'})">${money(y.r.profit)}</b>` },
        { label: 'Marj', render: (y) => mB(y.r.margin) },
      ], actions: [{ icon: 'eye', act: 'v', title: 'Detay / rakipler' }], foot: `${rows.length} listeleme` });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#ch', el).onchange = (e) => { chf = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => listingModal(app, db.get('listings', b.dataset.id), draw));
    draw();
  }
  function listingModal(app, L, after) {
    const p = prod(L.pid); const r = res(L); const H = db.all('history', (h) => h.lid === L.id).sort((a, b) => a.at.localeCompare(b.at));
    const W = 520, Hh = 120, P = 8; const vals = H.flatMap((h) => [h.own, h.min]); const mx = Math.max(...vals, 1), mn = Math.min(...vals, mx - 1);
    const pt = (i, v) => `${P + (H.length > 1 ? (i * (W - 2 * P)) / (H.length - 1) : 0)},${Hh - P - ((v - mn) / (mx - mn || 1)) * (Hh - 2 * P)}`;
    modal({ title: `${CH[L.ch].name} · ${p.name}`, size: 'wide', body: `<div class="grid g2"><div class="col">
        <div class="card pad">${[['Satış fiyatı (KDV dahil)', L.price], [`KDV %${p.vat}`, -(L.price - r.netSale)], [`Komisyon %${comOf(p, L.ch)}`, -r.comAmt / 1.2], ['Hizmet bedeli', -r.fee / 1.2], [`Kargo (${p.desi} desi)`, -r.cargo / 1.2], ['Paketleme', -(Number(S().packCost) || 0)], ['Ürün maliyeti', -p.cost]].map(([l, v]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(v)}</div>`).join('')}<div class="list-item"><b class="grow">Net kâr</b><b style="color:var(--${r.profit < 0 ? 'err' : 'ok'})">${money(r.profit)} · %${r.margin}</b></div><p class="small muted mt">Komisyon, kargo ve hizmet bedelinin KDV'si indirilir (KDV hariç gösterilir). Başa baş fiyat: <b>${money(F.priceFor({ ...params(L), margin: 0 }))}</b> · taban (zarar koruması): <b>${money(floorOf(L))}</b></p></div>
        <div class="card pad"><h3 class="mb">Fiyat geçmişi (14 gün)</h3><svg viewBox="0 0 ${W} ${Hh}" style="width:100%;height:120px" role="img" aria-label="Fiyat geçmişi"><polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${H.map((h, i) => pt(i, h.own)).join(' ')}"/><polyline fill="none" stroke="var(--err)" stroke-width="2" stroke-dasharray="5 4" points="${H.map((h, i) => pt(i, h.min)).join(' ')}"/></svg><div class="small"><span style="color:var(--accent)">━</span> Sizin fiyatınız · <span style="color:var(--err)">┅</span> En ucuz rakip</div></div></div>
      <div class="col"><div class="card">${table({ rows: L.comps.map((c, i) => ({ ...c, id: i })).sort((a, b) => a.price - b.price), empty: 'Rakip yok', columns: [{ label: 'Rakip satıcı', render: (c) => `<b>${esc(c.seller)}</b><div class="small faint">puan ${c.rating}${c.fast ? ' · hızlı teslimat' : ''}</div>` }, { label: 'Fiyat', cls: 'right', render: (c) => `<b>${money(c.price)}</b><div class="small" style="color:var(--${c.price < L.price ? 'err' : 'ok'})">${c.price < L.price ? 'sizden ucuz' : 'sizden pahalı'}</div>` }] })}</div>
        <div class="card pad"><div class="form-grid" id="rf">${NS.fieldsHtml([{ name: 'strategy', label: 'Strateji', type: 'select', options: Object.entries(F.STRAT).map(([value, label]) => ({ value, label })), full: true }, { name: 'undercut', label: 'Rakibin kaç ₺ altı', type: 'number', step: '0.1' }, { name: 'targetMargin', label: 'Hedef marj %', type: 'number' }, { name: 'minPrice', label: 'En düşük fiyat (₺)', type: 'number', hint: 'Boşsa zarar korumasına göre hesaplanır' }, { name: 'maxPrice', label: 'En yüksek fiyat (₺)', type: 'number' }], L)}</div><p class="small muted">Rakip fiyatları demo verisidir; canlıda pazaryerinin rakip/buybox servisi veya fiyat dosyası ile güncellenir.</p></div></div></div>`,
      actions: [{ label: 'Fiyatı elle değiştir', onClick: async (c) => { const v = await NS.prompt('Yeni fiyat (KDV dahil)', L.price); if (v === null) return; const to = Number(String(v).replace(',', '.')); if (!(to > 0)) return; if (to < floorOf(L) && !(await confirm(`${money(to)} taban fiyatın (${money(floorOf(L))}) altında; bu fiyatta kâr %${res(L, to).margin}. Yine de uygulansın mı?`))) return; const errs = await push([{ L, from: L.price, to, before: res(L).profit, after: res(L, to).profit }]); toast(errs.length ? errs.join(' · ') : 'Fiyat güncellendi', errs.length ? 'err' : 'ok'); c(); after && after(); } },
        { label: 'Kuralı kaydet', cls: 'primary', onClick: (c, b) => { const v = NS.readForm($('#rf', b)); Object.assign(L, { strategy: v.strategy, undercut: Number(v.undercut) || 1, targetMargin: Number(v.targetMargin) || 15, minPrice: v.minPrice ? Number(v.minPrice) : null, maxPrice: v.maxPrice ? Number(v.maxPrice) : null }); db.save(); toast('Kural kaydedildi', 'ok'); c(); after && after(); } }] });
  }

  // ---------- Robot ----------
  function robotPage(el, p, app) {
    const ch = propose; let list = db.all('listings').map(ch).filter(Boolean); const sel = new Set(list.map((c) => c.L.id));
    el.innerHTML = pageHead('Fiyat Robotu', 'Kurallarınıza göre önerilen fiyatlar — taban fiyatın altına asla inmez', `<button class="btn" id="re">${icon('refresh')} Yeniden hesapla</button><button class="btn primary" id="ap">${icon('send')} Seçilenleri uygula</button>`) + `
      <div class="card pad mb row" style="gap:18px;flex-wrap:wrap"><span>${icon('shield')} Zarar koruması: <b>en az %${S().minMargin} net marj</b></span><span>Fiyat sonu: <b>,${String(Number(S().ending).toFixed(2)).split('.')[1]}</b></span><a class="btn sm" href="#/ayarlar">Değiştir</a><span class="grow"></span><span class="small muted">Son çalışma: ${db.all('runs').length ? NS.dt(db.all('runs').slice(-1)[0].at) : 'hiç'}</span></div>
      <div class="card" id="t"></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: list.map((c) => ({ ...c, id: c.L.id })), empty: 'Tüm fiyatlar kurallarınıza uygun — değişiklik önerisi yok', emptyIcon: 'check', columns: [
      { label: '', render: (c) => `<input type="checkbox" data-s="${c.L.id}" ${sel.has(c.L.id) ? 'checked' : ''} aria-label="Seç">` },
      { label: 'Ürün', render: (c) => `${chB(c.L.ch)} <b>${esc(prod(c.L.pid).name)}</b><div class="small faint">${esc(F.STRAT[c.L.strategy])}</div>` },
      { label: 'Fiyat', cls: 'right', render: (c) => `<s class="faint">${money(c.from)}</s> → <b>${money(c.to)}</b><div class="small" style="color:var(--${c.to < c.from ? 'warn' : 'ok'})">${c.to < c.from ? '▼' : '▲'} ${money(Math.abs(c.to - c.from))}</div>` },
      { label: 'Satış başı kâr', cls: 'right', render: (c) => `${money(c.before)} → <b style="color:var(--${c.after < 0 ? 'err' : 'ok'})">${money(c.after)}</b>` },
      { label: 'Neden', render: (c) => `<span class="small">${esc(c.why)}</span>` },
    ], foot: `${list.length} öneri` }); };
    on(el, 'change', '[data-s]', (e, b) => (b.checked ? sel.add(b.dataset.s) : sel.delete(b.dataset.s)));
    $('#re', el).onclick = () => { list = db.all('listings').map(ch).filter(Boolean); sel.clear(); list.forEach((c) => sel.add(c.L.id)); draw(); };
    $('#ap', el).onclick = async () => { const L = list.filter((c) => sel.has(c.L.id)); if (!L.length) return toast('Seçili öneri yok', 'err'); if (!(await confirm(`${L.length} fiyat değişikliği pazaryerlerine gönderilsin mi?`))) return; const errs = await push(L); toast(errs.length ? `Bazı kanallar gönderilmedi: ${errs.join(' · ')}` : errs.local.length ? `TEST — ${errs.local.join(', ')} canlı bağlı değil: fiyatlar yalnızca programda güncellendi, kanala gönderilmedi` : `${L.length} fiyat kanala gönderildi`, errs.length ? 'err' : errs.local.length ? 'warn' : 'ok'); list = db.all('listings').map(ch).filter(Boolean); sel.clear(); list.forEach((c) => sel.add(c.L.id)); draw(); };
    draw();
  }

  // ---------- Hesaplayıcı ----------
  function calcPage(el) {
    el.innerHTML = pageHead('Kâr Hesaplayıcı', 'Ürünü listelemeden önce: bu fiyattan satarsam ne kazanırım, şu marj için kaça satmalıyım?') + `<div class="grid g-21"><div class="card pad" id="f"><div class="form-grid">${NS.fieldsHtml([{ name: 'ch', label: 'Pazaryeri', type: 'select', options: Object.keys(CH).map((k) => ({ value: k, label: CH[k].name })) }, { name: 'cat', label: 'Kategori', type: 'select', options: Object.keys(F.COM) }, { name: 'cost', label: 'Ürün maliyeti (KDV hariç ₺)', type: 'number', step: '0.01' }, { name: 'vat', label: 'Ürün KDV %', type: 'select', options: ['1', '10', '20'] }, { name: 'desi', label: 'Desi', type: 'number' }, { name: 'price', label: 'Satış fiyatı (KDV dahil ₺)', type: 'number', step: '0.01' }, { name: 'com', label: 'Komisyon % (boşsa kategoriden)', type: 'number', step: '0.1' }, { name: 'margin', label: 'Hedef net marj %', type: 'number' }], { ch: 'trendyol', cat: 'Elektronik aksesuar', cost: 250, vat: '20', desi: 2, price: 599, margin: 15 })}</div></div><div class="col" style="gap:16px"><div class="card pad" id="r"></div><div class="card pad" id="r2"></div></div></div>`;
    const draw = () => {
      const v = NS.readForm($('#f', el)); const com = v.com !== '' && v.com != null ? Number(v.com) : (F.COM[v.cat] || {})[v.ch] ?? 18; const cargo = F.cargoOf(v.ch, Number(v.desi) || 1, (db.data.cargoOverride || {})[v.ch]);
      const base = { cost: Number(v.cost) || 0, vat: Number(v.vat) || 20, com, fee: CH[v.ch].fee, cargo, extra: Number(S().packCost) || 0 };
      const r = F.calc({ ...base, price: Number(v.price) || 0 });
      $('#r', el).innerHTML = `<h3 class="mb">${money(Number(v.price) || 0)} fiyatla bir satış</h3>${[['KDV', -((Number(v.price) || 0) - r.netSale)], [`Komisyon %${com} (KDV hariç)`, -r.comAmt / 1.2], ['Hizmet bedeli', -r.fee / 1.2], [`Kargo ${v.desi} desi`, -cargo / 1.2], ['Paketleme', -base.extra], ['Ürün maliyeti', -base.cost]].map(([l, x]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(x)}</div>`).join('')}<div class="list-item"><b class="grow" style="font-size:18px">Net kâr</b><b style="font-size:24px;color:var(--${r.profit < 0 ? 'err' : 'ok'})">${money(r.profit)}</b></div><div class="row mt">${mB(r.margin)} <span class="small muted">maliyete göre getiri %${r.roi}</span></div>`;
      const pm = F.priceFor({ ...base, margin: Number(v.margin) || 0 }); const be = F.priceFor({ ...base, margin: 0 });
      $('#r2', el).innerHTML = `<div class="list-item"><span class="grow">Başa baş fiyat</span><b>${be ? money(be) : '—'}</b></div><div class="list-item"><span class="grow">%${v.margin} net marj için fiyat</span><b style="font-size:20px">${pm ? money(pm) : 'Bu marj bu komisyonla mümkün değil'}</b></div><div class="small muted mt">Aynı ürün diğer kanallarda (%${v.margin} marj için): ${Object.keys(CH).filter((k) => k !== v.ch).map((k) => { const x = F.priceFor({ ...base, com: (F.COM[v.cat] || {})[k] ?? 18, fee: CH[k].fee, cargo: F.cargoOf(k, Number(v.desi) || 1), margin: Number(v.margin) || 0 }); return `${CH[k].name} <b>${x ? money(x) : '—'}</b>`; }).join(' · ')}</div>`;
    };
    $('#f', el).addEventListener('input', draw); $('#f', el).addEventListener('change', draw); draw();
  }

  // ---------- Ürünler ----------
  function productsPage(el, p, app) {
    NS.crud(el, app, { col: 'products', title: 'Ürünler & Maliyet', sub: 'Doğru kâr için maliyet (KDV hariç) ve desi girin', single: 'Ürün', addLabel: 'Ürün ekle', emptyIcon: 'box',
      fields: [{ name: 'name', label: 'Ürün', required: true, full: true }, { name: 'sku', label: 'Stok kodu', required: true }, { name: 'barcode', label: 'Barkod' }, { name: 'cat', label: 'Kategori', type: 'select', options: Object.keys(F.COM) }, { name: 'cost', label: 'Maliyet (KDV hariç)', type: 'number', step: '0.01' }, { name: 'vat', label: 'KDV %', type: 'select', options: ['1', '10', '20'] }, { name: 'desi', label: 'Desi', type: 'number' }, { name: 'stock', label: 'Stok', type: 'number' }],
      beforeSave: (v) => { v.vat = Number(v.vat); v.cost = Number(v.cost); v.desi = Number(v.desi) || 1; }, defaults: { vat: 20, desi: 1 },
      searchFields: (x) => [x.name, x.sku, x.barcode],
      columns: [{ key: 'name', label: 'Ürün', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.sku)} · ${esc(x.cat)}</div>` }, { key: 'cost', label: 'Maliyet', cls: 'right', render: (x) => money(x.cost) }, { key: 'desi', label: 'Desi', cls: 'right' }, { key: 'stock', label: 'Stok', cls: 'right' }, { label: 'Kanallar', render: (x) => db.all('listings', (l) => l.pid === x.id).map((l) => chB(l.ch)).join(' ') }, { label: 'En iyi kanal', render: (x) => { const L = db.all('listings', (l) => l.pid === x.id).map((l) => ({ l, r: res(l) })).sort((a, b) => b.r.profit - a.r.profit)[0]; return L ? `${chB(L.l.ch)} ${money(L.r.profit)}` : '-'; } }] });
  }

  // ---------- Kanal oranları ----------
  function channelsPage(el, p, app) {
    db.data.comOverride = db.data.comOverride || {};
    el.innerHTML = pageHead('Komisyon & Kargo Oranları', 'Sözleşmenizdeki oranları girin; tüm kâr hesapları buna göre yapılır') + `<div class="card mb"><div class="card-h"><h3>Kategori komisyonları (%)</h3><button class="btn sm primary" id="sv">${icon('check')} Kaydet</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kategori</th>${Object.keys(CH).map((k) => `<th class="right">${CH[k].name}</th>`).join('')}</tr></thead><tbody>${Object.keys(F.COM).map((cat) => `<tr><td><b>${esc(cat)}</b></td>${Object.keys(CH).map((k) => `<td class="right"><input class="input" data-c="${esc(cat)}" data-k="${k}" type="number" step="0.1" value="${comOf({ cat }, k)}" style="width:76px;height:32px;text-align:right"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <div class="grid g2">${Object.keys(CH).map((k) => `<div class="card"><div class="card-h">${chB(k)} <b>${CH[k].name}</b><span class="grow"></span><span class="small muted">hizmet bedeli ${money(CH[k].fee)}</span></div>${table({ rows: ((db.data.cargoOverride || {})[k] || CH[k].cargo).map(([d, pr], i) => ({ id: i, d, pr })), columns: [{ label: 'Desi (en çok)', render: (r) => r.d }, { label: 'Kargo (KDV dahil)', cls: 'right', render: (r) => money(r.pr) }] })}</div>`).join('')}</div>
      <div class="card pad mt"><h3 class="mb">Canlı fiyat gönderimi</h3><p class="small muted">Trendyol ve Hepsiburada fiyatları <b>server.js</b> köprüsü üzerinden canlı gönderilebilir. API bilgileri Pazaryeri Satıcı Paneli ile aynıdır.</p><div class="form-grid" id="lv">${NS.fieldsHtml(['trendyol', 'hepsiburada'].flatMap((k) => [{ type: 'section', label: CH[k].name }, { name: k + '_mode', label: 'Mod', type: 'select', options: [{ value: 'demo', label: 'Demo' }, { value: 'live', label: 'Canlı' }] }, { name: k + '_sellerId', label: 'Satıcı ID' }, { name: k + '_apiKey', label: 'API key' }, { name: k + '_apiSecret', label: 'API secret', type: 'password' }]), Object.fromEntries(['trendyol', 'hepsiburada'].flatMap((k) => ['mode', 'sellerId', 'apiKey', 'apiSecret'].map((f) => [k + '_' + f, ((db.data.channels || {})[k] || {})[f] || (f === 'mode' ? 'demo' : '')]))))}</div><button class="btn primary mt" id="lsv">Kaydet</button></div>`;
    $('#sv', el).onclick = () => { $$('[data-c]', el).forEach((i) => { const o = db.data.comOverride[i.dataset.c] = db.data.comOverride[i.dataset.c] || {}; o[i.dataset.k] = Number(i.value); }); db.save(); toast('Komisyonlar kaydedildi — kârlar yeniden hesaplandı', 'ok'); };
    $('#lsv', el).onclick = () => { const v = NS.readForm($('#lv', el)); ['trendyol', 'hepsiburada'].forEach((k) => { db.data.channels[k] = { ...(db.data.channels[k] || {}), mode: v[k + '_mode'], sellerId: v[k + '_sellerId'], apiKey: v[k + '_apiKey'], apiSecret: v[k + '_apiSecret'] }; }); db.save(); toast('Kaydedildi', 'ok'); };
  }

  NS.shell({
    id: 'fiyatrobotu', integrations: ['pazaryeri', 'webhook', 'backup'], name: 'Kâr & Fiyat Robotu', tagline: 'Pazaryeri kârlılık ve fiyatlama', icon: 'percent', accent: '#7c3aed', db, home: 'ozet', auth: { roles: { admin: 'Yönetici' } },
    nav: [{ sec: 'Kârlılık' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'karlilik', label: 'Kârlılık', icon: 'percent' }, { id: 'robot', label: 'Fiyat Robotu', icon: 'zap' }, { id: 'hesap', label: 'Hesaplayıcı', icon: 'hash' }, { sec: 'Tanımlar' }, { id: 'urunler', label: 'Ürünler & Maliyet', icon: 'box' }, { id: 'kanallar', label: 'Komisyon & Kargo', icon: 'store' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings' }],
    routes: { ozet: dashboard, karlilik: profitPage, robot: robotPage, hesap: calcPage, urunler: productsPage, kanallar: channelsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: { admin: 'Yönetici' }, fields: [{ type: 'section', label: 'Robot kuralları' }, { name: 'minMargin', label: 'Zarar koruması: en az net marj %', type: 'number' }, { name: 'ending', label: 'Fiyat sonu (ör. 0.90)', type: 'number', step: '0.01' }, { name: 'packCost', label: 'Sipariş başı paketleme maliyeti (₺)', type: 'number' }] }) },
  });
})();
