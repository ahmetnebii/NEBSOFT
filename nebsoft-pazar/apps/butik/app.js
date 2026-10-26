/* NEBSOFT Butik & Giyim — beden/renk matrisli stok, barkodlu satış, değişim/iade, müşteri puanı,
   sezon indirimi, etiket basımı ve mağaza + pazaryeri ortak stoğu */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const B = window.BTK;
  const db = new NS.DB('butik', B.seed);
  const S = () => db.settings({});
  const model = (id) => db.get('models', id);
  const cust = (id) => db.get('customers', id);
  const findV = (code) => { const c = String(code || '').trim(); for (const m of db.all('models')) { const v = m.variants.find((x) => x.barcode === c); if (v) return { m, v }; } return null; };
  const unit = (m) => Math.round(m.price * (1 - (Number(m.disc) || 0) / 100));
  const mStock = (m) => sum(m.variants, (v) => v.stock);
  const sw = (hex) => `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};border:1px solid var(--border);vertical-align:-1px"></span>`;
  const colorHex = (m, name) => (m.colors.find((c) => c.name === name) || {}).hex || '#999';
  // Pazaryeri/online stoğa gönderim (Entegrasyonlar > Pazaryerleri açıksa gerçek çağrı)
  function syncOnline(models) {
    const list = models.filter((m) => m.online); if (!list.length || S().online === false) return;
    const items = list.flatMap((m) => m.variants.map((v) => ({ barcode: v.barcode, stock: v.stock, price: unit(m) })));
    if (NS.integ && NS.integ.isOn && NS.integ.isOn('pazaryeri')) NS.integ.call('pazaryeri', 'stok-fiyat', { items }, { silent: true });
  }

  // ---------- Matris (beden × renk) ----------
  const matrix = (m, editable) => {
    const sizes = B.SIZES[m.sizeType];
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${sizes.map((s) => `<th class="right">${esc(s)}</th>`).join('')}<th class="right">Toplam</th></tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${sizes.map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); if (!v) return '<td></td>'; return `<td class="right">${editable ? `<input class="input" type="number" min="0" data-bc="${v.barcode}" value="${v.stock}" style="width:64px;height:32px;text-align:right">` : `<b style="color:var(--${v.stock === 0 ? 'err' : v.stock <= (Number(S().lowStock) || 2) ? 'warn' : 'text'})">${v.stock}</b>`}</td>`; }).join('')}<td class="right"><b>${sum(m.variants.filter((v) => v.color === c.name), (v) => v.stock)}</b></td></tr>`).join('')}</tbody></table></div>`;
  };

  // ---------- Satış ----------
  function posPage(el, p, app) {
    let cart = []; let customer = null; let extra = 0;
    el.innerHTML = pageHead('Satış', 'Barkodu okutun veya modeli arayıp beden/renk seçin') + `
      <div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><div class="row"><input class="input grow" id="scan" autocomplete="off" placeholder="Barkod okutun / model adı veya kodu yazın" style="height:52px;font-size:18px"></div><div id="sug" class="mt"></div></div><div class="card" id="cart"></div></div>
      <div class="col" style="gap:16px"><div class="card pad" id="cu"></div><div class="card pad" id="tot"></div></div></div>`;
    // İkinci üründe indirim kampanyası (kategori bazında)
    const calc = () => {
      const lines = cart.map((l) => ({ ...l, line: l.price * l.qty, camp: 0 }));
      db.all('campaigns', (c) => c.active && c.type === 'ikinci').forEach((c) => { const ls = lines.filter((l) => (model(l.mid) || {}).cat === c.target); const units = ls.flatMap((l) => Array(l.qty).fill(l)).sort((a, b) => a.price - b.price); const n = Math.floor(units.length / 2); units.slice(0, n).forEach((l) => { l.camp += Math.round((l.price * c.value) / 100); }); });
      const sub = sum(lines, (l) => l.line); const camp = sum(lines, (l) => l.camp); const total = Math.max(0, sub - camp - extra);
      return { lines, sub, camp, total };
    };
    const draw = () => {
      const c = calc();
      $('#cart', el).innerHTML = cart.length ? table({ rows: c.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${sw(colorHex(model(l.mid), l.color))} ${esc(l.color)} · ${esc(l.size)} · <span class="mono">${esc(l.barcode)}</span></div>` }, { label: 'Adet', cls: 'right', render: (l) => `<div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm ghost icon" data-q="-1" data-i="${l.id}">${icon('minus')}</button><b>${l.qty}</b><button class="btn sm ghost icon" data-q="1" data-i="${l.id}">${icon('plus')}</button></div>` }, { label: 'Tutar', cls: 'right', render: (l) => `<b>${money(l.line - l.camp)}</b>${l.camp ? `<div class="small" style="color:var(--ok)">kampanya −${money(l.camp)}</div>` : ''}` }] }) : `<div class="empty">${icon('barcode')}<div>Sepet boş — barkod okutun</div></div>`;
      const cu = customer && cust(customer);
      $('#cu', el).innerHTML = cu ? `<div class="row"><div class="grow"><b>${esc(cu.name)}</b><div class="small muted">${esc(cu.phone)} · ${cu.points} puan (${money(cu.points)})</div></div><button class="btn sm ghost icon" id="cux">${icon('x')}</button></div>` : `<button class="btn block" id="cus">${icon('user')} Müşteri seç / ekle</button><p class="small muted mt">Müşteri seçilirse alışverişten %${S().pointPct || 3} puan kazanır.</p>`;
      $('#tot', el).innerHTML = `<div class="list-item small"><span class="grow muted">Ara toplam</span>${money(c.sub)}</div>${c.camp ? `<div class="list-item small"><span class="grow muted">Kampanya</span>−${money(c.camp)}</div>` : ''}<div class="list-item small"><span class="grow muted">Ek indirim</span><button class="btn sm ghost" id="dc">${extra ? '−' + money(extra) : 'Ekle'}</button></div><div class="list-item"><b class="grow" style="font-size:18px">Toplam</b><b style="font-size:26px">${money(c.total)}</b></div>
        <div class="grid g2 mt">${Object.entries(B.PAY).filter(([k]) => k !== 'puan').map(([k, l]) => `<button class="btn ${k === 'kart' ? 'primary' : ''}" data-pay="${k}" ${cart.length ? '' : 'disabled'}>${icon(k === 'nakit' ? 'cash' : k === 'kart' ? 'card' : 'building')} ${l}</button>`).join('')}${cu && cu.points ? `<button class="btn" data-pay="puan" ${cart.length ? '' : 'disabled'}>${icon('gift')} Puanla öde</button>` : ''}</div>`;
    };
    const add = (m, v) => { if (v.stock <= 0) toast(`${m.name} ${v.color}/${v.size} stokta görünmüyor — yine de eklendi`, 'err'); const l = cart.find((x) => x.barcode === v.barcode); if (l) l.qty++; else cart.push({ mid: m.id, barcode: v.barcode, name: m.name, size: v.size, color: v.color, qty: 1, price: unit(m), cost: m.cost }); NS.beep(); draw(); };
    const pickVariant = (m) => modal({ title: `${m.name} — beden/renk seçin`, size: 'wide', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${B.SIZES[m.sizeType].map((s) => `<th class="center">${esc(s)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${B.SIZES[m.sizeType].map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); return `<td class="center">${v ? `<button class="btn sm ${v.stock ? '' : 'ghost'}" data-pv="${v.barcode}" style="min-width:52px">${v.stock}</button>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Rakamlar stok adedidir. Fiyat: <b>${money(unit(m))}</b>${m.disc ? ` (<s>${money(m.price)}</s> %${m.disc})` : ''}</p>`, onOpen: (b, close) => on(b, 'click', '[data-pv]', (e, t) => { add(m, m.variants.find((v) => v.barcode === t.dataset.pv)); close(); }) });
    const inp = $('#scan', el);
    inp.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const f = findV(inp.value); if (f) { add(f.m, f.v); inp.value = ''; $('#sug', el).innerHTML = ''; return; } const ms = db.all('models', (m) => NS.match(inp.value, m.name, m.code)); if (ms.length === 1) { pickVariant(ms[0]); inp.value = ''; } else if (!ms.length) { NS.beep(200, 250); toast('Ürün bulunamadı', 'err'); } });
    inp.addEventListener('input', () => { const q = inp.value.trim(); $('#sug', el).innerHTML = q.length < 2 ? '' : `<div class="row" style="flex-wrap:wrap;gap:6px">${db.all('models', (m) => NS.match(q, m.name, m.code)).slice(0, 8).map((m) => `<button class="btn sm" data-m="${m.id}">${esc(m.name)} · ${money(unit(m))}</button>`).join('')}</div>`; });
    on(el, 'click', '[data-m]', (e, b) => pickVariant(model(b.dataset.m)));
    on(el, 'click', '[data-q]', (e, b) => { const l = cart[Number(b.dataset.i)]; l.qty += Number(b.dataset.q); if (l.qty <= 0) cart.splice(Number(b.dataset.i), 1); draw(); });
    on(el, 'click', '#cux', () => { customer = null; draw(); });
    on(el, 'click', '#dc', async () => { const v = await NS.prompt('Ek indirim (₺)', extra || ''); if (v !== null) { extra = Math.max(0, Number(v) || 0); draw(); } });
    on(el, 'click', '#cus', async () => {
      const q = await NS.prompt('Müşteri telefonu veya adı', ''); if (q === null) return;
      let c = db.find('customers', (x) => NS.match(q, x.name, x.phone) || String(x.phone).replace(/\D/g, '').endsWith(String(q).replace(/\D/g, '').slice(-10)));
      if (!c) { const v = await formModal({ title: 'Yeni müşteri', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'size', label: 'Beden' }, { name: 'birthday', label: 'Doğum günü', type: 'date' }, { name: 'kvkk', label: 'SMS/kampanya izni (KVKK)', type: 'checkbox' }], values: { phone: /\d/.test(q) ? q : '', name: /\d/.test(q) ? '' : q } }); if (!v) return; c = db.insert('customers', { ...v, points: 0 }); }
      customer = c.id; draw();
    });
    on(el, 'click', '[data-pay]', async (e, b) => {
      const c = calc(); const pay = b.dataset.pay; const cu = customer && cust(customer);
      if (pay === 'puan' && cu.points < c.total) return toast(`Puan yetersiz (${cu.points} puan)`, 'err');
      const s = db.insert('sales', { no: 'F' + (5000 + db.all('sales').length), at: new Date().toISOString(), customer, lines: c.lines.map((l) => ({ mid: l.mid, barcode: l.barcode, name: l.name, size: l.size, color: l.color, qty: l.qty, price: Math.round((l.line - l.camp) / l.qty), cost: l.cost })), sub: c.sub, disc: c.camp + extra, total: c.total, pay, user: (NS.currentUser || {}).name, channel: 'magaza' });
      const touched = new Set(); s.lines.forEach((l) => { const f = findV(l.barcode); if (f) { f.v.stock = Math.max(0, f.v.stock - l.qty); touched.add(f.m); } });
      if (cu) { if (pay === 'puan') cu.points -= c.total; else cu.points += Math.round((c.total * (Number(S().pointPct) || 3)) / 100); }
      db.save(); syncOnline([...touched]); receipt(s); toast(`${s.no} · ${money(s.total)} satış tamamlandı`, 'ok');
      cart = []; customer = null; extra = 0; draw(); inp.focus();
    });
    draw(); setTimeout(() => inp.focus(), 50);
  }
  function receipt(s) {
    const cu = s.customer && cust(s.customer);
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><div style="text-align:center"><b style="font-size:16px">${esc(S().bizName)}</b><div>${esc(S().bizAddress || '')}</div><div>${esc(S().bizPhone || '')}</div></div><hr>
      <div>Fiş: ${esc(s.no)} · ${NS.dt(s.at)}</div>${cu ? `<div>Müşteri: ${esc(cu.name)}</div>` : ''}<hr>${s.lines.map((l) => `<div>${esc(l.name)}<br>${esc(l.color)} / ${esc(l.size)} <span style="float:right">${l.qty} × ${money(l.price)}</span></div>`).join('')}<hr>
      ${s.disc ? `<div>İndirim <span style="float:right">−${money(s.disc)}</span></div>` : ''}<div style="font-size:15px"><b>TOPLAM <span style="float:right">${money(s.total)}</span></b></div><div>${esc(B.PAY[s.pay])}</div>${cu ? `<div>Kalan puan: ${cu.points}</div>` : ''}<hr>
      <div style="text-align:center">${NS.barcodeSvg(s.no, { height: 36 })}<div>Etiketi sökülmemiş ürünlerde ${S().exchangeDays || 30} gün içinde bu fişle değişim yapılır.</div></div></div>`, { title: s.no });
  }

  // ---------- Değişim / iade ----------
  function exchangePage(el, p, app) {
    el.innerHTML = pageHead('Değişim & İade', `Fiş barkodunu okutun · ${S().exchangeDays || 30} gün içinde değişim`) + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><input class="input" id="fs" placeholder="Fiş no (F5123) okutun" style="height:52px;font-size:18px" autocomplete="off"></div><div id="sale"></div></div><div class="card"><div class="card-h"><h3>Son işlemler</h3></div><div id="rl"></div></div></div>`;
    const list = () => { $('#rl', el).innerHTML = table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12), empty: 'İşlem yok', columns: [{ label: 'Fiş', render: (r) => `<b class="mono">${esc(r.saleNo)}</b><div class="small faint">${NS.dt(r.at)}</div>` }, { label: 'İşlem', render: (r) => (r.type === 'iade' ? badge('İade ' + money(r.refund), 'err') : badge('Değişim', 'info')) }, { label: 'Ürün', render: (r) => `<span class="small">${esc(r.line.name)} ${esc(r.line.size)}${r.newLine ? ` → ${esc(r.newLine.size)} ${esc(r.newLine.color)}` : ''}</span>` }] }); };
    const show = (s) => {
      const age = (Date.now() - new Date(s.at)) / 864e5; const late = age > (Number(S().exchangeDays) || 30);
      $('#sale', el).innerHTML = `<div class="card"><div class="card-h"><b>${esc(s.no)}</b><span class="small muted">${NS.dt(s.at)} · ${money(s.total)}</span><span class="grow"></span>${late ? badge(`${Math.floor(age)} gün geçmiş`, 'err') : badge(`${Math.floor(age)}. gün`, 'ok')}</div>${table({ rows: s.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.color)} · ${esc(l.size)}</div>` }, { label: 'Ödenen', cls: 'right', render: (l) => money(l.price) }], actions: [{ icon: 'refresh', act: 'ex', title: 'Değiştir' }, { icon: 'cash', act: 'rf', title: 'İade et' }] })}</div>`;
      on($('#sale', el), 'click', '[data-act]', async (e, b) => {
        const l = s.lines[Number(b.dataset.id)]; const f = findV(l.barcode);
        if (b.dataset.act === 'rf') {
          const v = await formModal({ title: `İade — ${l.name}`, fields: [{ name: 'reason', label: 'Neden', type: 'select', options: ['Beden uymadı', 'Renk beğenilmedi', 'Kusurlu ürün', 'Vazgeçti'] }, { name: 'how', label: 'Ödeme', type: 'select', options: [{ value: 'ayni', label: 'Aynı yöntemle iade' }, { value: 'puan', label: 'Puan / hediye çeki olarak' }] }] }); if (!v) return;
          if (f) f.v.stock += 1; db.insert('returns', { saleNo: s.no, at: new Date().toISOString(), type: 'iade', line: l, reason: v.reason, refund: l.price, how: v.how });
          if (v.how === 'puan' && s.customer) cust(s.customer).points += l.price;
          db.save(); syncOnline(f ? [f.m] : []); toast(`${money(l.price)} iade edildi, ürün stoğa döndü`, 'ok'); list();
        } else {
          const m = model(l.mid); if (!m) return;
          modal({ title: `Değişim — ${m.name} (${l.color} ${l.size})`, size: 'wide', body: `${matrix(m)}<p class="small muted mt">Yeni beden/renk barkodunu okutun ya da seçin:</p><div class="row" style="flex-wrap:wrap;gap:6px">${m.variants.filter((v) => v.stock > 0 && v.barcode !== l.barcode).map((v) => `<button class="btn sm" data-nv="${v.barcode}">${esc(v.color)} ${esc(v.size)}</button>`).join('')}</div>`, onOpen: (bx, close) => on(bx, 'click', '[data-nv]', (ev, t) => {
            const nv = m.variants.find((v) => v.barcode === t.dataset.nv); nv.stock--; const ov = m.variants.find((v) => v.barcode === l.barcode); if (ov) ov.stock++;
            db.insert('returns', { saleNo: s.no, at: new Date().toISOString(), type: 'degisim', line: l, newLine: { ...l, size: nv.size, color: nv.color, barcode: nv.barcode }, reason: 'Beden/renk değişimi', refund: 0 });
            db.save(); syncOnline([m]); close(); toast('Değişim yapıldı, stoklar güncellendi', 'ok'); list();
            NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><b>${esc(S().bizName)}</b><br>DEĞİŞİM FİŞİ · ${NS.dt(new Date())}<hr>Fiş: ${esc(s.no)}<br>Alınan: ${esc(l.name)} ${esc(l.color)}/${esc(l.size)}<br>Verilen: ${esc(nv.color)}/${esc(nv.size)}<hr>Fark: ₺0,00</div>`, { title: 'Değişim' });
          }) });
        }
      });
    };
    $('#fs', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const s = db.find('sales', (x) => x.no.toLowerCase() === e.target.value.trim().toLowerCase()); if (!s) return toast('Fiş bulunamadı', 'err'); e.target.value = ''; show(s); });
    list(); setTimeout(() => $('#fs', el).focus(), 50);
  }

  // ---------- Ürünler ----------
  function productsPage(el, p, app) {
    let q = '', f = p || '';
    el.innerHTML = pageHead('Ürünler & Stok', 'Model bazında beden × renk stok matrisi', `<button class="btn" id="lbl">${icon('tag')} Etiket bas</button><button class="btn primary" id="add">${icon('plus')} Yeni model</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Model, kod, kategori...')}<div class="seg">${[['', 'Tümü'], ['az', 'Azalan beden'], ['indirim', 'İndirimde'], ['online', 'Online satışta'], ['olu', 'Satmayan (60 gün)']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const sold = (m, days) => sum(db.all('sales', (s) => s.at > addDays(new Date(), -days).toISOString()).flatMap((s) => s.lines).filter((l) => l.mid === m.id), (l) => l.qty);
    const rows = () => db.all('models', (m) => NS.match(q, m.name, m.code, m.cat) && (!f || (f === 'az' ? m.variants.some((v) => v.stock <= (Number(S().lowStock) || 2)) : f === 'indirim' ? m.disc > 0 : f === 'online' ? m.online : sold(m, 60) === 0)));
    const draw = () => { $('#t', el).innerHTML = table({ rows: rows(), emptyIcon: 'tag', columns: [
      { label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint"><span class="mono">${esc(m.code)}</span> · ${esc(m.cat)} · ${esc(m.season)}</div>` },
      { label: 'Renkler', render: (m) => m.colors.map((c) => sw(c.hex)).join(' ') },
      { label: 'Bedenler', render: (m) => `<div class="row" style="gap:3px;flex-wrap:wrap">${B.SIZES[m.sizeType].map((s) => { const n = sum(m.variants.filter((v) => v.size === s), (v) => v.stock); return `<span class="badge ${n === 0 ? 'err' : n <= 2 ? 'warn' : ''}" title="${n} adet">${esc(s)}</span>`; }).join('')}</div>` },
      { label: 'Stok', cls: 'right', render: (m) => `<b>${mStock(m)}</b>` },
      { label: 'Fiyat', cls: 'right', render: (m) => (m.disc ? `<s class="faint small">${money(m.price)}</s> <b>${money(unit(m))}</b><div>${badge('%' + m.disc, 'err')}</div>` : `<b>${money(m.price)}</b>`) },
      { label: '30 gün satış', cls: 'right', render: (m) => sold(m, 30) },
      { label: 'Online', render: (m) => (m.online ? badge('Satışta', 'ok') : '') },
    ], actions: [{ icon: 'grid', act: 'mx', title: 'Stok matrisi' }, { icon: 'edit', act: 'ed' }] }); };
    const edit = async (m) => {
      const v = await formModal({ title: m ? m.name : 'Yeni model', size: 'wide', fields: [{ name: 'name', label: 'Model adı', required: true, full: true }, { name: 'code', label: 'Model kodu', required: true }, { name: 'cat', label: 'Kategori', required: true }, { name: 'sizeType', label: 'Beden tipi', type: 'select', options: [{ value: 'harf', label: 'XS–XXL' }, { value: 'beden', label: '34–44' }, { value: 'numara', label: 'Ayakkabı 36–41' }, { value: 'tek', label: 'Tek beden' }] }, { name: 'season', label: 'Sezon', type: 'select', options: B.SEASONS }, { name: 'colorsStr', label: 'Renkler (virgülle)', full: true, placeholder: 'Siyah, Ekru, Bej' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış (₺)', type: 'number', step: '0.01' }, { name: 'disc', label: 'İndirim %', type: 'number' }, { name: 'online', label: 'Online / pazaryerinde sat', type: 'checkbox' }], values: m ? { ...m, colorsStr: m.colors.map((c) => c.name).join(', ') } : { sizeType: 'harf', season: B.SEASONS[0], online: true, code: 'LB' + (2600 + db.all('models').length) } });
      if (!v) return;
      const names = v.colorsStr.split(',').map((x) => x.trim()).filter(Boolean); delete v.colorsStr;
      const rec = m || db.insert('models', { ...v, colors: [], variants: [] }); Object.assign(rec, v);
      const PAL = ['#111827', '#f1ead9', '#d6c3a5', '#6b705c', '#1e3a5f', '#7f1d1d', '#e8b4b8', '#5b8bd0'];
      rec.colors = names.map((n, i) => rec.colors.find((c) => c.name === n) || { name: n, hex: PAL[i % PAL.length] });
      // Yeni beden/renk kombinasyonları stok 0 ile eklenir, mevcutlar korunur
      let seq = Date.now() % 1e6;
      rec.colors.forEach((c) => B.SIZES[rec.sizeType].forEach((s) => { if (!rec.variants.find((x) => x.size === s && x.color === c.name)) rec.variants.push({ size: s, color: c.name, barcode: B.ean('86955' + String(seq++).padStart(7, '0')), stock: 0 }); }));
      rec.variants = rec.variants.filter((x) => names.includes(x.color) && B.SIZES[rec.sizeType].includes(x.size));
      db.save(); syncOnline([rec]); toast('Kaydedildi', 'ok'); draw(); if (!m) mx(rec);
    };
    const mx = (m) => modal({ title: `${m.name} — stok`, size: 'wide', body: matrix(m, true) + '<p class="small muted mt">Sayım sonucunu girip kaydedin; değişiklik online kanallara da gönderilir.</p>', actions: [{ label: 'Etiket bas', icon: 'tag', onClick: () => labels(m.variants.filter((v) => v.stock > 0).flatMap((v) => Array(v.stock).fill({ m, v }))) }, { label: 'Kaydet', cls: 'primary', onClick: (c, b) => { $$('[data-bc]', b).forEach((i) => { const v = m.variants.find((x) => x.barcode === i.dataset.bc); v.stock = Math.max(0, Number(i.value) || 0); }); db.log('Stok sayımı', m.code); db.save(); syncOnline([m]); c(); draw(); toast('Stok güncellendi', 'ok'); } }] });
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(model(b.dataset.id)));
    on(el, 'click', '[data-act=mx]', (e, b) => mx(model(b.dataset.id)));
    $('#add', el).onclick = () => edit(null);
    $('#lbl', el).onclick = () => labels(rows().flatMap((m) => m.variants.filter((v) => v.stock > 0).map((v) => ({ m, v }))));
    draw();
  }
  function labels(list) {
    if (!list.length) return toast('Basılacak etiket yok', 'err');
    NS.printHtml(`<div style="display:flex;flex-wrap:wrap;gap:6px">${list.slice(0, 400).map(({ m, v }) => `<div style="width:190px;border:1px dashed #999;padding:6px;font-family:Arial;font-size:11px"><b>${esc(S().bizName)}</b><div>${esc(m.name)}</div><div>${esc(v.color)} · <b style="font-size:14px">${esc(v.size)}</b></div>${NS.barcodeSvg(v.barcode, { height: 34 })}<div style="font-size:15px"><b>${money(unit(m))}</b>${m.disc ? ` <s>${money(m.price)}</s>` : ''}</div></div>`).join('')}</div>`, { title: 'Etiketler' });
  }

  // ---------- Müşteriler ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler', sub: 'Puan, beden ve alışveriş geçmişi', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'size', label: 'Beden' }, { name: 'birthday', label: 'Doğum günü', type: 'date' }, { name: 'points', label: 'Puan', type: 'number' }, { name: 'kvkk', label: 'SMS/kampanya izni', type: 'checkbox' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'dg', label: 'Bu ay doğum günü', test: (c) => c.birthday && c.birthday.slice(5, 7) === today().slice(5, 7) }, { value: 'izin', label: 'SMS izni olan', test: (c) => c.kvkk }],
      searchFields: (c) => [c.name, c.phone],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}${c.kvkk ? '' : ' · SMS izni yok'}</div>` }, { key: 'size', label: 'Beden', render: (c) => esc(c.size || '-') }, { label: 'Alışveriş', cls: 'right', render: (c) => { const ss = db.all('sales', (s) => s.customer === c.id); return `${ss.length}<div class="small faint">${money(sum(ss, (s) => s.total))}</div>`; } }, { key: 'points', label: 'Puan', cls: 'right', render: (c) => `<b>${c.points || 0}</b>` }, { label: 'Son ziyaret', render: (c) => { const s = db.all('sales', (x) => x.customer === c.id).sort((a, b) => b.at.localeCompare(a.at))[0]; return s ? NS.date(s.at) : '-'; } }],
      extraActions: [{ icon: 'message', act: 'sms', title: 'SMS gönder' }],
      onAction: async (a, c) => { const v = await NS.prompt(`${c.name} için SMS`, `Merhaba ${c.name.split(' ')[0]}, ${S().bizName}'de yeni sezon ürünleri geldi! ${c.points ? c.points + ' puanınız sizi bekliyor.' : ''}`); if (v) { if (!c.kvkk) return toast('Müşterinin SMS izni yok (KVKK)', 'err'); NS.smsLog(db, { to: c.phone, name: c.name, text: v }); toast('SMS gönderildi', 'ok'); } },
    });
  }

  // ---------- Kampanyalar ----------
  function campaignsPage(el, p, app) {
    el.innerHTML = pageHead('Sezon & Kampanyalar', 'Sezon/kategori indirimi tek tıkla tüm etiketlere ve online kanallara yansır', `<button class="btn primary" id="bulk">${icon('percent')} Toplu indirim uygula</button>`) + `<div class="card"><div class="card-h"><h3>Aktif kampanyalar</h3></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('campaigns'), columns: [{ label: 'Kampanya', render: (c) => `<b>${esc(c.name)}</b>` }, { label: 'Kapsam', render: (c) => `${c.scope === 'sezon' ? 'Sezon' : 'Kategori'}: ${esc(c.target)}` }, { label: 'Tür', render: (c) => (c.type === 'ikinci' ? `2. üründe %${c.value}` : `%${c.value} indirim`) }, { label: 'Durum', render: (c) => (c.active ? badge('Aktif', 'ok') : badge('Pasif')) }], actions: [{ icon: 'refresh', act: 'tg', title: 'Aç / kapat' }, { icon: 'trash', act: 'del' }] }); };
    on(el, 'click', '[data-act]', async (e, b) => { const c = db.get('campaigns', b.dataset.id); if (b.dataset.act === 'del') { if (!(await confirm('Kampanya silinsin mi?'))) return; if (c.type === 'yuzde') apply(c, 0); db.remove('campaigns', c.id); } else { c.active = !c.active; if (c.type === 'yuzde') apply(c, c.active ? c.value : 0); } db.save(); draw(); });
    const apply = (c, pct) => { const ms = db.all('models', (m) => (c.scope === 'sezon' ? m.season === c.target : m.cat === c.target)); ms.forEach((m) => { m.disc = pct; }); syncOnline(ms); toast(`${ms.length} modelde indirim %${pct}`, 'ok'); };
    $('#bulk', el).onclick = async () => {
      const cats = [...new Set(db.all('models').map((m) => m.cat))];
      const v = await formModal({ title: 'Toplu indirim / kampanya', fields: [{ name: 'name', label: 'Kampanya adı', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'yuzde', label: 'Yüzde indirim (etikete yansır)' }, { value: 'ikinci', label: '2. üründe indirim (kasada)' }] }, { name: 'scope', label: 'Kapsam', type: 'select', options: [{ value: 'sezon', label: 'Sezon' }, { value: 'kategori', label: 'Kategori' }] }, { name: 'target', label: 'Sezon / kategori', type: 'select', options: [...B.SEASONS, ...cats] }, { name: 'value', label: 'Oran %', type: 'number', required: true }] });
      if (!v) return; const c = db.insert('campaigns', { ...v, value: Number(v.value), active: true }); if (c.type === 'yuzde') apply(c, c.value); db.save(); draw();
    };
    draw();
  }

  // ---------- Özet ve raporlar ----------
  function dashboard(el, p, app) {
    const all = db.all('sales'); const t = today(); const tod = all.filter((s) => iso(s.at) === t);
    const m30 = all.filter((s) => s.at > addDays(new Date(), -30).toISOString());
    const kar = (ss) => sum(ss.flatMap((s) => s.lines), (l) => (l.price - (l.cost || 0)) * l.qty) - sum(ss, (s) => s.disc || 0);
    const low = db.all('models').flatMap((m) => m.variants.filter((v) => v.stock === 0 && sum(m.variants.filter((x) => x.color === v.color), (x) => x.stock) > 0).map((v) => ({ m, v })));
    const ser = NS.dailySeries(all, 14, 'at', (s) => s.total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/satis">${icon('barcode')} Satış</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün satış', money(sum(tod, (s) => s.total)), 'cash', '', `<div class="small faint">${tod.length} fiş · ${sum(tod.flatMap((s) => s.lines), (l) => l.qty)} ürün</div>`)}${kpi('30 gün ciro', money(sum(m30, (s) => s.total)), 'trend', 'ok', `<div class="small faint">brüt kâr ${money(kar(m30))}</div>`)}${kpi('Mağazadaki ürün', sum(db.all('models'), mStock), 'tag', 'info', `<div class="small faint">${money(sum(db.all('models'), (m) => mStock(m) * m.cost))} maliyet</div>`)}${kpi('Biten beden', low.length, 'alert', low.length ? 'warn' : 'ok', '<div class="small faint">Diğer bedenleri stokta</div>')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div>
      <div class="card"><div class="card-h"><h3>En çok satan beden (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30.flatMap((s) => s.lines), (l) => l.size)).map(([label, v]) => ({ label, value: sum(v, (l) => l.qty) })).sort((a, b) => b.value - a.value).slice(0, 7), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Biten bedenler — sipariş verin</h3></div>${table({ rows: low.slice(0, 10).map((x, i) => ({ ...x, id: i })), empty: 'Eksik beden yok', columns: [{ label: 'Model', render: (x) => `<b>${esc(x.m.name)}</b>` }, { label: 'Renk / beden', render: (x) => `${sw(colorHex(x.m, x.v.color))} ${esc(x.v.color)} · <b>${esc(x.v.size)}</b>` }] })}</div>
      <div class="card"><div class="card-h"><h3>En çok satan modeller (30 gün)</h3></div>${table({ rows: Object.entries(NS.groupBy(m30.flatMap((s) => s.lines), (l) => l.mid)).map(([id, v]) => ({ id, m: model(id), n: sum(v, (l) => l.qty), c: sum(v, (l) => l.qty * l.price) })).filter((x) => x.m).sort((a, b) => b.n - a.n).slice(0, 8), columns: [{ label: 'Model', render: (x) => `<b>${esc(x.m.name)}</b>` }, { label: 'Adet', cls: 'right', key: 'n' }, { label: 'Ciro', cls: 'right', render: (x) => money(x.c) }] })}</div></div>`;
  }
  function reportsPage(el) {
    const m30 = db.all('sales', (s) => s.at > addDays(new Date(), -30).toISOString()); const L = m30.flatMap((s) => s.lines);
    const rets = db.all('returns', (r) => r.at > addDays(new Date(), -30).toISOString());
    const dead = db.all('models').filter((m) => !db.all('sales', (s) => s.at > addDays(new Date(), -60).toISOString()).some((s) => s.lines.some((l) => l.mid === m.id)) && mStock(m) > 0);
    el.innerHTML = pageHead('Raporlar', 'Son 30 gün') + `<div class="grid g4 mb">${kpi('Ciro', money(sum(m30, (s) => s.total)), 'trend', 'ok')}${kpi('Ortalama fiş', money(m30.length ? sum(m30, (s) => s.total) / m30.length : 0), 'receipt', 'info')}${kpi('Fiş başı ürün', (m30.length ? L.length / m30.length : 0).toFixed(2), 'tag')}${kpi('Değişim / iade', rets.length, 'refresh', 'warn')}</div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => (model(l.mid) || {}).cat || '-')).map(([label, v]) => ({ label, value: sum(v, (l) => l.price * l.qty) })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Renkler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => l.color)).map(([label, v]) => ({ label, value: v.length })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Mağaza / online</h3></div><div class="card-b">${chart.donut([{ label: 'Mağaza', value: m30.filter((s) => s.channel !== 'online').length }, { label: 'Online', value: m30.filter((s) => s.channel === 'online').length }], { size: 120 })}</div></div></div>
      <div class="card"><div class="card-h"><h3>Ölü stok — 60 gündür satılmayan</h3><span class="small muted">İndirime alın veya pazaryerine açın</span></div>${table({ rows: dead, empty: 'Yok', columns: [{ label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint">${esc(m.season)}</div>` }, { label: 'Stok', cls: 'right', render: mStock }, { label: 'Bağlı para', cls: 'right', render: (m) => money(mStock(m) * m.cost) }] })}</div>`;
  }
  function salesPage(el, p, app) {
    NS.crud(el, app, { col: 'sales', title: 'Satışlar', sub: 'Fişler', readonly: true, emptyIcon: 'receipt', searchFields: (s) => [s.no, (cust(s.customer) || {}).name, ...s.lines.map((l) => l.name)], sort: (a, b) => b.at.localeCompare(a.at),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'bugun', label: 'Bugün', test: (s) => iso(s.at) === today() }, { value: 'online', label: 'Online', test: (s) => s.channel === 'online' }],
      columns: [{ key: 'no', label: 'Fiş', render: (s) => `<b class="mono">${esc(s.no)}</b><div class="small faint">${NS.dt(s.at)}</div>` }, { label: 'Müşteri', render: (s) => esc((cust(s.customer) || {}).name || '-') }, { label: 'Ürünler', render: (s) => s.lines.map((l) => `<div class="small">${esc(l.name)} ${esc(l.size)}</div>`).join('') }, { label: 'Ödeme', render: (s) => esc(B.PAY[s.pay]) + (s.channel === 'online' ? ' ' + badge('Online', 'info') : '') }, { key: 'total', label: 'Tutar', cls: 'right', render: (s) => `<b>${money(s.total)}</b>` }],
      extraActions: [{ icon: 'print', act: 'pr' }], onAction: (a, s) => receipt(s) });
  }

  const ROLES = { admin: 'Mağaza sahibi', kasa: 'Satış danışmanı' };
  NS.shell({
    id: 'butik', integrations: ['pazaryeri', 'pos', 'printer', 'label', 'barcode', 'efatura', 'sms', 'whatsapp', 'webhook', 'backup'], name: 'Butik & Giyim', tagline: 'Beden-renk stok ve mağaza satış', icon: 'tag', accent: '#db2777', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['kasa'] }, { id: 'satis', label: 'Satış', icon: 'barcode', roles: ['kasa'] }, { id: 'degisim', label: 'Değişim & İade', icon: 'refresh', roles: ['kasa'] }, { id: 'satislar', label: 'Satışlar', icon: 'receipt', roles: ['kasa'] }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'tag', roles: ['kasa'] }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['kasa'] }, { sec: 'Yönetim' }, { id: 'kampanyalar', label: 'Sezon & Kampanya', icon: 'percent', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, satis: posPage, degisim: exchangePage, satislar: salesPage, urunler: productsPage, musteriler: customersPage, kampanyalar: campaignsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza kuralları' }, { name: 'pointPct', label: 'Puan oranı %', type: 'number' }, { name: 'exchangeDays', label: 'Değişim süresi (gün)', type: 'number' }, { name: 'lowStock', label: 'Az kalan beden sınırı', type: 'number' }, { name: 'online', label: 'Stok değişince online kanallara gönder', type: 'checkbox' }] }) },
  });
})();
