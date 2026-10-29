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
    const items = list.flatMap((m) => m.variants.map((v) => ({ barcode: v.barcode, stock: Math.max(0, v.stock), price: unit(m) })));
    if (NS.integ && NS.integ.isOn && NS.integ.isOn('pazaryeri')) NS.integ.call('pazaryeri', 'stok-fiyat', { items }, { silent: true });
  }
  // Stok hareketi: satış, iade, değişim, sayım, mal kabul (model kartında "Hareketler")
  const MOVE = { satis: 'Satış', iade: 'İade', degisim: 'Değişim', sayim: 'Sayım', kabul: 'Mal kabul' };
  const move = (m, v, qty, type, ref) => { if (qty) db.insert('moves', { at: new Date().toISOString(), mid: m.id, barcode: v.barcode, size: v.size, color: v.color, qty, type, ref: ref || '', user: (NS.currentUser || {}).name || '' }, true); };
  const nextNo = () => 'F' + (Math.max(5000, ...db.all('sales').map((s) => Number(String(s.no).replace(/\D/g, '')) || 0)) + 1);
  // Fiyat geçmişi ve indirim kuralı (RG 01.07.2026/33297, Yönetmelik m.14/3): indirimden önceki fiyat = son 10 gündeki en düşük fiyat
  const priceEdit = (m, fn) => {
    const before = unit(m), d0 = Number(m.disc) || 0; fn(); const now = new Date().toISOString();
    if (unit(m) !== before) { if (!Array.isArray(m.ph)) m.ph = [{ at: '2000-01-01T00:00:00.000Z', v: before }]; m.ph.push({ at: now, v: unit(m) }); if (m.ph.length > 60) m.ph = m.ph.slice(-60); m.priceAt = now; }
    if ((Number(m.disc) || 0) !== d0 && m.disc > 0) m.discAt = now;
  };
  const priceAt = (m, t) => { const h = (m.ph || []).filter((x) => x.at <= t); return h.length ? h[h.length - 1].v : m.ph && m.ph.length ? m.ph[0].v : m.price; };
  const low10 = (m) => { const st = m.discAt || new Date().toISOString(); const from = addDays(new Date(st), -10).toISOString(); const vs = [priceAt(m, from), ...(m.ph || []).filter((x) => x.at > from && x.at < st).map((x) => x.v)]; return Math.min(...vs); };
  // Gösterilecek eski fiyat: liste fiyatı ile son 10 günün en düşüğünden küçük olanı; indirim yoksa ya da indirimli fiyattan yüksek değilse 0
  const oldRef = (m) => { if (!(m.disc > 0)) return 0; const o = Math.min(m.price, low10(m)); return o > unit(m) ? o : 0; };
  const pctOff = (m) => { const o = oldRef(m); return o ? Math.round((1 - unit(m) / o) * 100) : 0; };
  // Yönetici onayı: yönetici oturumdaysa onay, değilse yönetici PIN'i
  async function adminOk(msg) {
    if ((NS.currentUser || {}).role === 'admin') return confirm(msg);
    const pin = await NS.prompt(`${msg} — yönetici PIN'i`, ''); if (pin === null) return false;
    const ok = db.all('users').some((u) => u.role === 'admin' && u.active !== false && String(u.pin) === String(pin).trim()); if (!ok) toast('PIN hatalı', 'err'); else db.log('Yönetici onayı', msg); return ok;
  }

  // ---------- Matris (beden × renk) ----------
  const matrix = (m, editable) => {
    const sizes = B.SIZES[m.sizeType];
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${sizes.map((s) => `<th class="right">${esc(s)}</th>`).join('')}<th class="right">Toplam</th></tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${sizes.map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); if (!v) return '<td></td>'; return `<td class="right">${editable ? `<input class="input" type="number" min="0" data-bc="${v.barcode}" value="${v.stock}" style="width:64px;height:32px;text-align:right">` : `<b style="color:var(--${v.stock <= 0 ? 'err' : v.stock <= (Number(S().lowStock) || 2) ? 'warn' : 'text'})">${v.stock}</b>`}</td>`; }).join('')}<td class="right"><b>${sum(m.variants.filter((v) => v.color === c.name), (v) => v.stock)}</b></td></tr>`).join('')}</tbody></table></div>`;
  };

  // ---------- Satış ----------
  let posKeep = { cart: [], customer: null, extra: 0 }; // Başka sayfaya geçince sepet kaybolmasın
  function posPage(el, p, app) {
    let { cart, customer, extra } = posKeep;
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
      posKeep = { cart, customer, extra }; const c = calc();
      $('#cart', el).innerHTML = cart.length ? table({ rows: c.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${sw(colorHex(model(l.mid), l.color))} ${esc(l.color)} · ${esc(l.size)} · <span class="mono">${esc(l.barcode)}</span></div>` }, { label: 'Adet', cls: 'right', render: (l) => `<div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm ghost icon" data-q="-1" data-i="${l.id}">${icon('minus')}</button><b>${l.qty}</b><button class="btn sm ghost icon" data-q="1" data-i="${l.id}">${icon('plus')}</button></div>` }, { label: 'Tutar', cls: 'right', render: (l) => `<b>${money(l.line - l.camp)}</b>${l.camp ? `<div class="small" style="color:var(--ok)">kampanya −${money(l.camp)}</div>` : ''}` }] }) : `<div class="empty">${icon('barcode')}<div>Sepet boş — barkod okutun</div></div>`;
      const cu = customer && cust(customer);
      $('#cu', el).innerHTML = cu ? `<div class="row"><div class="grow"><b>${esc(cu.name)}</b><div class="small muted">${esc(cu.phone)} · ${cu.points} puan (${money(cu.points)})</div></div><button class="btn sm ghost icon" id="cux">${icon('x')}</button></div>` : `<button class="btn block" id="cus">${icon('user')} Müşteri seç / ekle</button><p class="small muted mt">Müşteri seçilirse alışverişten %${S().pointPct || 3} puan kazanır.</p>`;
      $('#tot', el).innerHTML = `<div class="list-item small"><span class="grow muted">Ara toplam</span>${money(c.sub)}</div>${c.camp ? `<div class="list-item small"><span class="grow muted">Kampanya</span>−${money(c.camp)}</div>` : ''}<div class="list-item small"><span class="grow muted">Ek indirim</span><button class="btn sm ghost" id="dc">${extra ? '−' + money(extra) : 'Ekle'}</button></div><div class="list-item"><b class="grow" style="font-size:18px">Toplam</b><b style="font-size:26px">${money(c.total)}</b></div>
        <div class="grid g2 mt">${Object.entries(B.PAY).filter(([k]) => ['nakit', 'kart', 'havale'].includes(k)).map(([k, l]) => `<button class="btn ${k === 'kart' ? 'primary' : ''}" data-pay="${k}" ${cart.length ? '' : 'disabled'}>${icon(k === 'nakit' ? 'cash' : k === 'kart' ? 'card' : 'building')} ${l}</button>`).join('')}${cu && cu.points ? `<button class="btn" data-pay="puan" ${cart.length ? '' : 'disabled'}>${icon('gift')} Puanla öde</button>` : ''}<button class="btn" data-pay="parcali" ${cart.length ? '' : 'disabled'}>${icon('layers')} Parçalı</button></div>`;
    };
    const add = (m, v) => { if (v.stock <= 0) toast(`${m.name} ${v.color}/${v.size} stokta görünmüyor — yine de eklendi`, 'err'); const l = cart.find((x) => x.barcode === v.barcode); if (l) l.qty++; else cart.push({ mid: m.id, barcode: v.barcode, name: m.name, size: v.size, color: v.color, qty: 1, price: unit(m), cost: m.cost }); NS.beep(); draw(); };
    const pickVariant = (m) => modal({ title: `${m.name} — beden/renk seçin`, size: 'wide', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${B.SIZES[m.sizeType].map((s) => `<th class="center">${esc(s)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${B.SIZES[m.sizeType].map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); return `<td class="center">${v ? `<button class="btn sm ${v.stock ? '' : 'ghost'}" data-pv="${v.barcode}" style="min-width:52px">${v.stock}</button>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Rakamlar stok adedidir. Fiyat: <b>${money(unit(m))}</b>${oldRef(m) ? ` (<s>${money(oldRef(m))}</s> %${pctOff(m)})` : ''}</p>`, onOpen: (b, close) => on(b, 'click', '[data-pv]', (e, t) => { add(m, m.variants.find((v) => v.barcode === t.dataset.pv)); close(); }) });
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
    const finish = (pays) => {
      const c = calc(); const cu = customer && cust(customer); const used = sum(pays.filter((x) => x.type === 'puan'), (x) => x.amount);
      const pts = cu ? Math.round(((c.total - used) * (Number(S().pointPct) || 3)) / 100) : 0;
      const s = db.insert('sales', { no: nextNo(), at: new Date().toISOString(), customer, lines: c.lines.map((l) => ({ mid: l.mid, barcode: l.barcode, name: l.name, size: l.size, color: l.color, qty: l.qty, price: Math.round((l.line - l.camp) / l.qty), cost: l.cost })), sub: c.sub, disc: c.camp + extra, total: c.total, pay: pays.length > 1 ? 'parcali' : pays[0].type, pays, pts, ptsUsed: used, user: (NS.currentUser || {}).name, channel: 'magaza' });
      // Stok eksiye düşebilir: stokta görünmeyen ürünün satışı sayım farkı olarak izlenir
      const touched = new Set(); s.lines.forEach((l) => { const f = findV(l.barcode); if (f) { f.v.stock -= l.qty; move(f.m, f.v, -l.qty, 'satis', s.no); touched.add(f.m); } });
      if (cu) cu.points = (cu.points || 0) - used + pts;
      db.save(); syncOnline([...touched]); receipt(s); toast(`${s.no} · ${money(s.total)} satış tamamlandı`, 'ok');
      cart = []; customer = null; extra = 0; draw(); inp.focus();
    };
    const split = () => {
      const c = calc(); const cu = customer && cust(customer); const ks = ['nakit', 'kart', 'havale', ...(cu && cu.points ? ['puan'] : [])];
      modal({ title: `Parçalı ödeme · ${money(c.total)}`, body: `<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">${ks.map((k) => `<div class="field"><label>${esc(B.PAY[k])}${k === 'puan' ? ` (en çok ${cu.points})` : ''}</label><input class="input" type="number" min="0" step="0.01" data-sp="${k}" value="${k === 'kart' ? c.total : ''}"></div>`).join('')}</div><div class="lbs-sum mt" id="spr"></div>`,
        onOpen: (b) => { const upd = () => { const t = sum($$('[data-sp]', b), (i) => Number(i.value) || 0); const r = Math.round((c.total - t) * 100) / 100; $('#spr', b).innerHTML = r === 0 ? 'Tutar tamam' : r > 0 ? `Kalan: <b>${money(r)}</b>` : `Fazla: <b>${money(-r)}</b>`; }; b.addEventListener('input', upd); upd(); },
        actions: [{ label: 'Vazgeç' }, { label: 'Satışı tamamla', cls: 'primary', onClick: (close, b) => {
          const pays = $$('[data-sp]', b).map((i) => ({ type: i.dataset.sp, amount: Math.round((Number(i.value) || 0) * 100) / 100 })).filter((x) => x.amount > 0);
          if (Math.round(sum(pays, (x) => x.amount) * 100) !== Math.round(c.total * 100)) return toast('Ödemelerin toplamı satış tutarına eşit olmalı', 'err');
          const pu = pays.find((x) => x.type === 'puan'); if (pu && pu.amount > cu.points) return toast(`Puan yetersiz (${cu.points} puan)`, 'err');
          close(); finish(pays); } }] });
    };
    on(el, 'click', '[data-pay]', async (e, b) => {
      const c = calc(); const pay = b.dataset.pay; const cu = customer && cust(customer);
      if (pay === 'parcali') return split();
      if (pay === 'puan' && cu.points < c.total) return toast(`Puan yetersiz (${cu.points} puan) — “Parçalı” ile puan + başka ödeme kullanın`, 'err');
      finish([{ type: pay, amount: c.total }]);
    });
    draw(); setTimeout(() => inp.focus(), 50);
  }
  function receipt(s) {
    const cu = s.customer && cust(s.customer);
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><div style="text-align:center"><b style="font-size:16px">${esc(S().bizName)}</b><div>${esc(S().bizAddress || '')}</div><div>${esc(S().bizPhone || '')}</div></div><hr>
      <div>Fiş: ${esc(s.no)} · ${NS.dt(s.at)}</div>${cu ? `<div>Müşteri: ${esc(cu.name)}</div>` : ''}<hr>${s.lines.map((l) => `<div>${esc(l.name)}<br>${esc(l.color)} / ${esc(l.size)} <span style="float:right">${l.qty} × ${money(l.price)}</span></div>`).join('')}<hr>
      ${s.disc ? `<div>İndirim <span style="float:right">−${money(s.disc)}</span></div>` : ''}<div style="font-size:15px"><b>TOPLAM <span style="float:right">${money(s.total)}</span></b></div>${(s.pays || [{ type: s.pay, amount: s.total }]).map((x) => `<div>${esc(B.PAY[x.type] || x.type)} <span style="float:right">${money(x.amount)}</span></div>`).join('')}${cu ? `<div>${s.pts ? `Kazanılan puan: ${s.pts} · ` : ''}Puan bakiyesi: ${cu.points}</div>` : ''}<hr>
      <div style="text-align:center">${NS.barcodeSvg(s.no, { height: 36 })}<div>Etiketi sökülmemiş ürünlerde ${S().exchangeDays || 30} gün içinde bu fişle değişim yapılır.</div><div style="margin-top:6px;font-weight:700">BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</div></div></div>`, { title: s.no });
  }

  // ---------- SMS: sonuç sağlayıcıdan gelir; bağlı değilse TEST olarak kaydedilir ----------
  function smsSend(c, text) {
    if (!c.kvkk) return toast('Müşterinin SMS izni yok (KVKK)', 'err');
    if (!(NS.integ && NS.integ.isOn && NS.integ.isOn('sms'))) { NS.smsLog(db, { to: c.phone, name: c.name, text }, true); return toast('SMS sağlayıcısı bağlı değil — mesaj gönderilmedi, TEST olarak kaydedildi (Entegrasyonlar > SMS)', 'err'); }
    const r = NS.smsLog(db, { to: c.phone, name: c.name, text }); toast('SMS gönderiliyor…');
    let n = 0; const t = setInterval(() => { const st = r.status; if (st !== 'gönderiliyor' || ++n > 40) { clearInterval(t); toast(st === 'gönderildi' ? 'SMS gönderildi' : st === 'gönderiliyor' ? 'SMS sonucu alınamadı — SMS kayıtlarından kontrol edin' : st === 'simülasyon' ? 'SMS gönderilmedi (TEST)' : 'SMS gönderilemedi: ' + st, st === 'gönderildi' ? 'ok' : 'err'); } }, 300);
  }

  // ---------- Stok hareketleri ve mal kabul ----------
  function moves(m) {
    const rs = db.all('moves', (x) => x.mid === m.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
    modal({ title: `${m.name} — stok hareketleri`, size: 'wide', body: table({ rows: rs, empty: 'Henüz hareket yok (bu sürümden önceki işlemler kayıtlı değil)', emptyIcon: 'layers', columns: [{ label: 'Tarih', render: (x) => `<span class="small">${NS.dt(x.at)}</span>` }, { label: 'İşlem', render: (x) => `${esc(MOVE[x.type] || x.type)}<div class="small faint">${esc(x.ref)}${x.user ? ' · ' + esc(x.user) : ''}</div>` }, { label: 'Renk / beden', render: (x) => `${esc(x.color)} · <b>${esc(x.size)}</b>` }, { label: 'Adet', cls: 'right', render: (x) => `<b style="color:var(--${x.qty < 0 ? 'err' : 'ok'})">${x.qty > 0 ? '+' : ''}${x.qty}</b>` }] }) });
  }
  // Tedarikçiden gelen ürün: model seç → beden × renk adetleri → stok + hareket + isteğe bağlı etiket
  function receive(after) {
    const ms = db.all('models').sort((a, b) => a.name.localeCompare(b.name, 'tr')); if (!ms.length) return toast('Önce model ekleyin', 'err');
    const grid = (m) => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${B.SIZES[m.sizeType].map((x) => `<th class="center">${esc(x)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${B.SIZES[m.sizeType].map((x) => { const v = m.variants.find((y) => y.size === x && y.color === c.name); return `<td class="center">${v ? `<input class="input" type="number" min="0" data-kb="${v.barcode}" placeholder="0" title="Mevcut: ${v.stock}" style="width:60px;height:32px;text-align:right">` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    modal({ title: 'Mal kabul', size: 'wide', body: `<div class="form-grid" style="grid-template-columns:2fr 1fr 1fr 1fr;gap:10px"><div class="field"><label>Model</label><select class="input" id="kbm">${ms.map((m) => `<option value="${m.id}">${esc(m.name)} · ${esc(m.code)}</option>`).join('')}</select></div><div class="field"><label>Tedarikçi</label><input class="input" id="kbs"></div><div class="field"><label>İrsaliye / fatura no</label><input class="input" id="kbd"></div><div class="field"><label>Birim alış (₺)</label><input class="input" type="number" step="0.01" id="kbc"></div></div><div id="kbg" class="mt"></div><label class="check mt"><input type="checkbox" id="kbl" checked> Gelen adet kadar etiket hazırla</label>`,
      onOpen: (b) => { const sel = $('#kbm', b); const show = () => { const m = model(sel.value); $('#kbg', b).innerHTML = grid(m); $('#kbc', b).value = m.cost || ''; }; sel.onchange = show; show(); },
      actions: [{ label: 'Vazgeç' }, { label: 'Stoğa ekle', cls: 'primary', onClick: (close, b) => {
        const m = model($('#kbm', b).value); const ref = [$('#kbs', b).value.trim(), $('#kbd', b).value.trim()].filter(Boolean).join(' · ') || 'Mal kabul';
        const got = $$('[data-kb]', b).map((i) => ({ v: m.variants.find((x) => x.barcode === i.dataset.kb), n: Math.max(0, Math.floor(Number(i.value) || 0)) })).filter((x) => x.v && x.n);
        if (!got.length) return toast('Gelen adetleri girin', 'err');
        got.forEach(({ v, n }) => { v.stock += n; move(m, v, n, 'kabul', ref); }); const c = Number($('#kbc', b).value); if (c > 0) m.cost = c;
        db.log('Mal kabul', `${m.code} · ${sum(got, (x) => x.n)} adet · ${ref}`); db.save(); syncOnline([m]); close(); toast(`${m.name}: ${sum(got, (x) => x.n)} adet stoğa eklendi`, 'ok'); if (after) after();
        if ($('#kbl', b).checked) goLabels(got);
      } }] });
  }

  // ---------- Değişim / iade ----------
  function exchangePage(el, p, app) {
    el.innerHTML = pageHead('Değişim & İade', `Fiş barkodunu okutun · ${S().exchangeDays || 30} gün içinde değişim`) + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><input class="input" id="fs" placeholder="Fiş no (F5123) okutun" style="height:52px;font-size:18px" autocomplete="off"></div><div id="sale"></div></div><div class="card"><div class="card-h"><h3>Son işlemler</h3></div><div id="rl"></div></div></div>`;
    const list = () => { $('#rl', el).innerHTML = table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12), empty: 'İşlem yok', columns: [{ label: 'Fiş', render: (r) => `<b class="mono">${esc(r.saleNo)}</b><div class="small faint">${NS.dt(r.at)}</div>` }, { label: 'İşlem', render: (r) => (r.type === 'iade' ? badge('İade ' + money(r.refund), 'err') : badge('Değişim', 'info')) }, { label: 'Ürün', render: (r) => `<span class="small">${(r.qty || 1) > 1 ? r.qty + ' × ' : ''}${esc(r.line.name)} ${esc(r.line.size)}${r.newLine ? ` → ${esc(r.newLine.size)} ${esc(r.newLine.color)}` : ''}</span>` }] }); };
    // Satırdan daha önce iade/değişim yapılan adet (eski kayıtlarda adet yoksa 1)
    const done = (s, i, l) => sum(db.all('returns', (r) => r.saleNo === s.no && (r.li !== undefined ? r.li === i : r.line.barcode === l.barcode)), (r) => r.qty || 1);
    const show = (s) => {
      const age = (Date.now() - new Date(s.at)) / 864e5; const late = age > (Number(S().exchangeDays) || 30);
      const rows = s.lines.map((l, i) => ({ ...l, id: i, left: l.qty - done(s, i, l) }));
      $('#sale', el).innerHTML = `<div class="card"><div class="card-h"><b>${esc(s.no)}</b><span class="small muted">${NS.dt(s.at)} · ${money(s.total)}</span><span class="grow"></span>${late ? badge(`${Math.floor(age)} gün geçmiş — yönetici onayı gerekir`, 'err') : badge(`${Math.floor(age)}. gün`, 'ok')}</div>${table({ rows, columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.color)} · ${esc(l.size)}${l.qty > 1 ? ` · ${l.qty} adet` : ''}</div>` }, { label: 'Ödenen', cls: 'right', render: (l) => money(l.price) }, { label: 'Durum', render: (l) => (l.left <= 0 ? badge('İade/değişim yapıldı') : l.left < l.qty ? badge(`${l.left} adet kaldı`, 'warn') : '') }], actions: [{ icon: 'refresh', act: 'ex', title: 'Değiştir', show: (l) => l.left > 0 }, { icon: 'cash', act: 'rf', title: 'İade et', show: (l) => l.left > 0 }] })}</div>`;
      const box = $('#sale', el); box.onclick = async (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return; const i = Number(b.dataset.id); const l = s.lines[i]; const left = l.qty - done(s, i, l); if (left <= 0) return toast('Bu ürün için iade/değişim zaten yapıldı', 'err');
        if (late && !(await adminOk(`${s.no} fişinin değişim süresi geçmiş (${Math.floor(age)} gün)`))) return;
        const f = findV(l.barcode); const cu = s.customer && cust(s.customer);
        if (b.dataset.act === 'rf') {
          const how = [{ value: 'nakit', label: 'Nakit iade' }, { value: 'kart', label: 'Karta iade' }, ...(cu ? [{ value: 'puan', label: 'Puan olarak' }] : [])];
          const v = await formModal({ title: `İade — ${l.name}`, fields: [...(left > 1 ? [{ name: 'qty', label: `Adet (en çok ${left})`, type: 'number', required: true }] : []), { name: 'reason', label: 'Neden', type: 'select', options: ['Beden uymadı', 'Renk beğenilmedi', 'Kusurlu ürün', 'Vazgeçti'] }, { name: 'how', label: 'Ödeme', type: 'select', options: how }], values: { qty: left, how: (s.pays && s.pays.length === 1 && s.pays[0].type === 'puan') || s.pay === 'puan' ? 'puan' : s.pay === 'nakit' ? 'nakit' : 'kart' } }); if (!v) return;
          const qty = Math.min(left, Math.max(1, Math.floor(Number(v.qty) || 1))); const refund = l.price * qty;
          if (f) { f.v.stock += qty; move(f.m, f.v, qty, 'iade', s.no); }
          // Puan düzeltmesi: bu üründen kazanılan puan geri alınır; puanla iade seçildiyse tutar puan olarak yüklenir
          let ptsBack = 0; if (cu) { const earnedRate = s.total ? (s.pts !== undefined ? s.pts : s.pay === 'puan' ? 0 : Math.round((s.total * (Number(S().pointPct) || 3)) / 100)) / s.total : 0; ptsBack = Math.round(refund * earnedRate); cu.points = (cu.points || 0) - ptsBack + (v.how === 'puan' ? refund : 0); }
          db.insert('returns', { saleNo: s.no, li: i, qty, at: new Date().toISOString(), type: 'iade', line: l, reason: v.reason, refund, how: v.how, ptsBack });
          db.save(); syncOnline(f ? [f.m] : []); toast(`${money(refund)} iade edildi${v.how === 'puan' ? ' (puan olarak)' : ''}, ürün stoğa döndü${ptsBack ? ` · ${ptsBack} kazanılmış puan geri alındı` : ''}`, 'ok'); list(); show(s);
        } else {
          const m = model(l.mid); if (!m) return toast('Model artık kayıtlı değil', 'err');
          modal({ title: `Değişim — ${m.name} (${l.color} ${l.size})`, size: 'wide', body: `${matrix(m)}<p class="small muted mt">Yeni beden/renk barkodunu okutun ya da seçin:</p><div class="row" style="flex-wrap:wrap;gap:6px">${m.variants.filter((x) => x.stock > 0 && x.barcode !== l.barcode).map((x) => `<button class="btn sm" data-nv="${x.barcode}">${esc(x.color)} ${esc(x.size)}</button>`).join('') || '<span class="small muted">Bu modelde başka beden/renk stokta yok.</span>'}</div>`, onOpen: (bx, close) => on(bx, 'click', '[data-nv]', (ev, t) => {
            const nv = m.variants.find((x) => x.barcode === t.dataset.nv); nv.stock--; move(m, nv, -1, 'degisim', s.no); const ov = m.variants.find((x) => x.barcode === l.barcode); if (ov) { ov.stock++; move(m, ov, 1, 'degisim', s.no); }
            db.insert('returns', { saleNo: s.no, li: i, qty: 1, at: new Date().toISOString(), type: 'degisim', line: l, newLine: { ...l, size: nv.size, color: nv.color, barcode: nv.barcode }, reason: 'Beden/renk değişimi', refund: 0 });
            db.save(); syncOnline([m]); close(); toast('Değişim yapıldı, stoklar güncellendi', 'ok'); list(); show(s);
            NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><b>${esc(S().bizName)}</b><br>DEĞİŞİM FİŞİ · ${NS.dt(new Date())}<hr>Fiş: ${esc(s.no)}<br>Alınan: ${esc(l.name)} ${esc(l.color)}/${esc(l.size)}<br>Verilen: ${esc(nv.color)}/${esc(nv.size)}<hr>Fiyat farkı yok (aynı model)<hr><b>BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</b></div>`, { title: 'Değişim' });
          }) });
        }
      };
    };
    $('#fs', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const s = db.find('sales', (x) => x.no.toLowerCase() === e.target.value.trim().toLowerCase()); if (!s) return toast('Fiş bulunamadı', 'err'); e.target.value = ''; show(s); });
    list(); setTimeout(() => $('#fs', el).focus(), 50);
  }

  // ---------- Ürünler ----------
  function productsPage(el, p, app) {
    let q = '', f = p || '';
    el.innerHTML = pageHead('Ürünler & Stok', 'Model bazında beden × renk stok matrisi', `<button class="btn" id="lbl">${icon('tag')} Etiket bas</button><button class="btn" id="kb">${icon('download')} Mal kabul</button><button class="btn primary" id="add">${icon('plus')} Yeni model</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Model, kod, kategori...')}<div class="seg">${[['', 'Tümü'], ['az', 'Azalan beden'], ['indirim', 'İndirimde'], ['online', 'Online satışta'], ['olu', 'Satmayan (60 gün)']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    // Satış adetleri bir kez hesaplanır (binlerce modelde her satır için tüm satışları taramamak için)
    const soldMap = (days) => { const from = addDays(new Date(), -days).toISOString(); const r = new Map(); db.all('sales', (x) => x.at > from).forEach((x) => x.lines.forEach((l) => r.set(l.mid, (r.get(l.mid) || 0) + l.qty))); return r; };
    let S30 = soldMap(30), S60 = soldMap(60); const sold = (m, days) => (days === 30 ? S30 : S60).get(m.id) || 0;
    const rows = () => db.all('models', (m) => NS.match(q, m.name, m.code, m.cat) && (!f || (f === 'az' ? m.variants.some((v) => v.stock <= (Number(S().lowStock) || 2)) : f === 'indirim' ? m.disc > 0 : f === 'online' ? m.online : sold(m, 60) === 0)));
    const draw = () => { S30 = soldMap(30); S60 = soldMap(60); const all = rows(); const LIM = 200; $('#t', el).innerHTML = (all.length > LIM ? `<p class="small muted" style="padding:8px 16px;margin:0">${all.length} modelden ilk ${LIM} tanesi gösteriliyor — aramayı daraltın.</p>` : '') + table({ rows: all.slice(0, LIM), emptyIcon: 'tag', columns: [
      { label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint"><span class="mono">${esc(m.code)}</span> · ${esc(m.cat)} · ${esc(m.season)}</div>` },
      { label: 'Renkler', render: (m) => m.colors.map((c) => sw(c.hex)).join(' ') },
      { label: 'Bedenler', render: (m) => `<div class="row" style="gap:3px;flex-wrap:wrap">${B.SIZES[m.sizeType].map((s) => { const n = sum(m.variants.filter((v) => v.size === s), (v) => v.stock); return `<span class="badge ${n === 0 ? 'err' : n <= 2 ? 'warn' : ''}" title="${n} adet">${esc(s)}</span>`; }).join('')}</div>` },
      { label: 'Stok', cls: 'right', render: (m) => `<b>${mStock(m)}</b>` },
      { label: 'Fiyat', cls: 'right', render: (m) => (oldRef(m) ? `<s class="faint small">${money(oldRef(m))}</s> <b>${money(unit(m))}</b><div>${badge('%' + pctOff(m), 'err')}${oldRef(m) < m.price ? ` <span class="small" title="Son 10 günde daha düşük fiyat uygulandığı için eski fiyat olarak o gösterilir (Yönetmelik m.14/3)">${icon('alert')}</span>` : ''}</div>` : `<b>${money(unit(m))}</b>${m.disc ? `<div class="small faint" title="Bu fiyat son 10 günde zaten uygulandığı için indirim olarak gösterilemez">%${m.disc} uygulanıyor · eski fiyat gösterilmez</div>` : ''}`) },
      { label: '30 gün satış', cls: 'right', render: (m) => sold(m, 30) },
      { label: 'Online', render: (m) => (m.online ? badge('Satışta', 'ok') : '') },
    ], actions: [{ icon: 'grid', act: 'mx', title: 'Stok matrisi' }, { icon: 'edit', act: 'ed' }] }); };
    const edit = async (m) => {
      const v = await formModal({ title: m ? m.name : 'Yeni model', size: 'wide', fields: [{ name: 'name', label: 'Model adı', required: true, full: true }, { name: 'code', label: 'Model kodu', required: true }, { name: 'cat', label: 'Kategori', required: true }, { name: 'sizeType', label: 'Beden tipi', type: 'select', options: [{ value: 'harf', label: 'XS–XXL' }, { value: 'beden', label: '34–44' }, { value: 'numara', label: 'Ayakkabı 36–41' }, { value: 'tek', label: 'Tek beden' }] }, { name: 'season', label: 'Sezon', type: 'select', options: B.SEASONS }, { name: 'colorsStr', label: 'Renkler (virgülle)', full: true, placeholder: 'Siyah, Ekru, Bej' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış (₺)', type: 'number', step: '0.01' }, { name: 'disc', label: 'İndirim %', type: 'number' }, { name: 'online', label: 'Online / pazaryerinde sat', type: 'checkbox' }], values: m ? { ...m, colorsStr: m.colors.map((c) => c.name).join(', ') } : { sizeType: 'harf', season: B.SEASONS[0], online: true, code: 'LB' + (2600 + db.all('models').length) } });
      if (!v) return;
      const names = v.colorsStr.split(',').map((x) => x.trim()).filter(Boolean); delete v.colorsStr;
      v.price = Number(v.price) || 0; v.cost = Number(v.cost) || 0; v.disc = Math.min(90, Math.max(0, Number(v.disc) || 0));
      const rec = m || db.insert('models', { ...v, colors: [], variants: [] }); if (m) priceEdit(rec, () => Object.assign(rec, v)); else Object.assign(rec, v);
      if (m && m.disc > 0 && oldRef(m) < m.price) toast(`Son 10 günde daha düşük fiyat (${money(oldRef(m))}) uygulanmış: etikette ve kasada eski fiyat olarak o gösterilecek`, 'err');
      const PAL = ['#111827', '#f1ead9', '#d6c3a5', '#6b705c', '#1e3a5f', '#7f1d1d', '#e8b4b8', '#5b8bd0'];
      rec.colors = names.map((n, i) => rec.colors.find((c) => c.name === n) || { name: n, hex: PAL[i % PAL.length] });
      // Yeni beden/renk kombinasyonları stok 0 ile eklenir, mevcutlar korunur
      let seq = Date.now() % 1e6;
      rec.colors.forEach((c) => B.SIZES[rec.sizeType].forEach((s) => { if (!rec.variants.find((x) => x.size === s && x.color === c.name)) rec.variants.push({ size: s, color: c.name, barcode: B.ean('86955' + String(seq++).padStart(7, '0')), stock: 0 }); }));
      rec.variants = rec.variants.filter((x) => names.includes(x.color) && B.SIZES[rec.sizeType].includes(x.size));
      db.save(); syncOnline([rec]); toast('Kaydedildi', 'ok'); draw(); if (!m) mx(rec);
    };
    const mx = (m) => modal({ title: `${m.name} — stok`, size: 'wide', body: matrix(m, true) + '<p class="small muted mt">Sayım sonucunu girip kaydedin; değişiklik online kanallara da gönderilir.</p>', actions: [{ label: 'Hareketler', icon: 'layers', onClick: () => moves(m) }, { label: 'Etiket bas', icon: 'tag', onClick: (c) => { c(); goLabels(m.variants.filter((v) => v.stock > 0).map((v) => ({ v, n: v.stock }))); } }, { label: 'Kaydet', cls: 'primary', onClick: (c, b) => { $$('[data-bc]', b).forEach((i) => { const v = m.variants.find((x) => x.barcode === i.dataset.bc); const n = Math.max(0, Math.floor(Number(i.value) || 0)); move(m, v, n - v.stock, 'sayim', 'Sayım'); v.stock = n; }); db.log('Stok sayımı', m.code); db.save(); syncOnline([m]); c(); draw(); toast('Stok güncellendi', 'ok'); } }] });
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(model(b.dataset.id)));
    on(el, 'click', '[data-act=mx]', (e, b) => mx(model(b.dataset.id)));
    $('#add', el).onclick = () => edit(null);
    $('#kb', el).onclick = () => receive(draw);
    $('#lbl', el).onclick = () => { const it = rows().flatMap((m) => m.variants.filter((v) => v.stock > 0).map((v) => ({ v, n: 1 }))); if (!it.length) return toast('Listede stoklu ürün yok', 'err'); goLabels(it); };
    draw();
  }
  // ---------- Etiket: çekirdek tasarımcı (NS.labels) + butik alanları (renk, beden, indirimli fiyat, logo) ----------
  // Çekirdek alanlar butik anlamıyla adlandırılır: unit = beden, cat = renk (bağlam), biz = mağaza adı. Logo, zemini resim olan kutu öğesidir.
  if (NS.labels) { const F = NS.labels.FIELDS; Object.assign(F, { name: 'Model adı', price: 'Satış fiyatı (indirimli)', old: 'Eski fiyat (yalnız indirimde)', unit: 'Beden', cat: 'Renk', biz: 'Mağaza adı', code: 'Barkod numarası' }); delete F.unitPrice; delete F.shelf; }
  const LE = (f, x, y, w, h, o = {}) => ({ id: NS.uid(), f, x, y, w, h, size: 8, bold: false, align: 'left', color: '#000000', ...o });
  const LB_PRESETS = () => [
    { id: 'askili', name: 'Askı etiketi 40×60', w: 40, h: 60, els: [LE('box', 10, 2, 20, 8, { logo: true }), LE('biz', 2, 10.5, 36, 4, { size: 7, align: 'center' }), LE('name', 2, 15, 36, 5, { size: 8, bold: true, align: 'center' }), LE('cat', 2, 20.5, 36, 4, { size: 7.5, align: 'center' }), LE('unit', 2, 25, 36, 10, { size: 24, bold: true, align: 'center' }), LE('barcode', 3, 35.5, 34, 13), LE('old', 2, 50.5, 16, 5, { size: 8 }), LE('price', 14, 49.5, 24, 9, { size: 15, bold: true, align: 'right' })] },
    { id: 'barkod', name: 'Barkod etiketi 50×30', w: 50, h: 30, els: [LE('name', 2, 1.5, 46, 5, { size: 8, bold: true }), LE('cat', 2, 6.5, 30, 4.5, { size: 7 }), LE('unit', 32, 6, 16, 5.5, { size: 13, bold: true, align: 'right' }), LE('barcode', 2, 11.5, 46, 12), LE('old', 2, 24.3, 20, 5, { size: 8 }), LE('price', 20, 24, 28, 5.5, { size: 12, bold: true, align: 'right' })] },
    { id: 'indirim', name: 'İndirim etiketi 60×40', w: 60, h: 40, els: [LE('box', 0, 0, 60, 8, { bg: '#db2777' }), LE('text', 3, 1, 54, 6, { size: 11, bold: true, color: '#ffffff', text: 'İNDİRİM' }), LE('name', 3, 9.5, 54, 5, { size: 9, bold: true }), LE('cat', 3, 15, 36, 4.5, { size: 8 }), LE('unit', 40, 14, 17, 6, { size: 13, bold: true, align: 'right' }), LE('old', 3, 21, 30, 6, { size: 11 }), LE('price', 3, 26, 54, 12, { size: 26, bold: true, align: 'right', color: '#db2777' })] },
    { id: 'mini', name: 'Mini 30×20', w: 30, h: 20, els: [LE('unit', 1.5, 1, 12, 5.5, { size: 11, bold: true }), LE('cat', 13, 1.5, 15.5, 4.5, { size: 6, align: 'right' }), LE('barcode', 2, 6.5, 26, 7), LE('price', 1.5, 14, 27, 5, { size: 9, bold: true, align: 'center' })] },
  ];
  const lbTpls = () => { if (!Array.isArray(db.data.labelTpls) || !db.data.labelTpls.length) { db.data.labelTpls = LB_PRESETS(); db.save(); } return NS.labels.tpls(db); };
  const lbOpt = () => S().labelOpt || { tpl: '', roll: false };
  const lbProd = (m, v) => ({ name: m.name, price: unit(m), oldPrice: oldRef(m), barcode: v.barcode, unit: v.size });
  const lbCtx = (v) => ({ biz: S().bizName, cat: v.color });
  const logoBg = () => (S().logo ? `url('${S().logo}') center/contain no-repeat` : 'transparent');
  // İndirimsiz üründe "eski fiyat" basılmaz (çekirdek, eski fiyat yoksa fiyat×1,2 uydurur — gerçek olmayan indirim gösterilmemeli)
  const lbFor = (t, m) => ({ ...t, els: t.els.filter((e) => e.f !== 'old' || oldRef(m) > 0).map((e) => (e.logo ? { ...e, bg: logoBg() } : e)) });
  const lbTpl = (id) => lbTpls().find((x) => x.id === id) || lbTpls()[0];
  const lbSample = () => { const m = db.all('models').find((x) => x.disc > 0) || db.all('models')[0]; return m && m.variants[0] ? { m, v: m.variants[0] } : null; };
  const lbPreview = (tplId, it) => { const t = lbTpl(tplId); it = it || lbSample(); const k = Math.min(2.2, 300 / (t.w * 3.78), 340 / (t.h * 3.78)); const p = it ? lbProd(it.m, it.v) : { name: 'Örnek model', price: 999, barcode: '8695500000001', unit: 'M' };
    return `<div class="lbp" style="width:${t.w * 3.78 * k}px;height:${t.h * 3.78 * k}px"><div style="transform:scale(${k});transform-origin:0 0">${NS.labels.labelHtml(it ? lbFor(t, it.m) : t, p, it ? lbCtx(it.v) : { biz: S().bizName, cat: 'Siyah' })}</div></div><div class="small muted center mt">${esc(t.name)} · ${t.w}×${t.h} mm</div>`; };
  const lbOptions = (sel) => lbTpls().map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  // items: [{ m, v, n }] — A4'e dizilir ya da etiket yazıcısında (sürücüyle) her etiket bir sayfa
  function lbPrint(items, tplId, roll) {
    const t = lbTpl(tplId); const all = items.flatMap(({ m, v, n }) => Array.from({ length: Math.max(1, n | 0) }, () => NS.labels.labelHtml(lbFor(t, m), lbProd(m, v), lbCtx(v))));
    if (!all.length) return toast('Basılacak etiket yok', 'err');
    const body = roll ? all.map((h) => `<div class="pg">${h}</div>`).join('') : `<div class="sheet">${all.join('')}</div>`;
    NS.printHtml(`<style>${NS.labels.CSS}@page{${roll ? `size:${t.w}mm ${t.h}mm;margin:0` : 'size:A4;margin:8mm'}}body{margin:0;padding:0}.pg{page-break-after:always}.sheet{display:flex;flex-wrap:wrap;gap:2mm}.sheet .lb{outline:.2mm dashed #bbb}</style>${body}`, { title: `${t.name} · ${all.length} etiket` });
    const now = new Date().toISOString(); new Set(items.map((x) => x.m)).forEach((m) => { m.lblAt = now; }); db.save();
  }
  function lbDesigner(onDone) {
    const it = lbSample(); const sample = it ? lbProd(it.m, it.v) : { name: 'Örnek model', price: 999, oldPrice: 1299, barcode: '8695500000001', unit: 'M' };
    lbTpls().forEach((t) => t.els.forEach((e) => { if (e.logo) e.bg = logoBg(); }));
    modal({ title: 'Etiket şablonları', size: 'xl', body: '<p class="small muted" style="margin:0 0 10px">Renk ve mağaza adı tasarım alanında boş görünür; etiket sayfasındaki önizlemede ve baskıda dolar. Logo, “Etiket Basımı” sayfasından yüklenir ve şablona eklenir.</p><div id="ldx"></div>', onOpen: (b) => NS.labels.designer($('#ldx', b), db, sample, (id) => { S().labelOpt = { ...lbOpt(), tpl: id }; db.save(); }), onClose: () => onDone && onDone() });
  }
  let lbPending = null; // Başka sayfadan gelen seçim: Map(barkod → adet)
  const goLabels = (items) => { lbPending = new Map(items.map(({ v, n }) => [v.barcode, n])); location.hash = '#/etiket'; };
  function labelsPage(el) {
    const sel = lbPending || new Map(); lbPending = null; let q = '', f = sel.size ? 'sec' : ''; const o = lbOpt(); let tpl = lbTpls().some((t) => t.id === o.tpl) ? o.tpl : lbTpls()[0].id, roll = !!o.roll;
    const changed = (m) => m.priceAt && (!m.lblAt || m.priceAt > m.lblAt);
    const redraw = () => { lbPending = sel; labelsPage(el); };
    el.innerHTML = pageHead('Etiket Basımı', 'Askı, barkod ve indirim etiketlerini kendi tasarımınızla tek tek veya toplu basın', `<button class="btn" id="cam">${icon('camera')} Kamerayla okut</button><button class="btn" id="ed">${icon('edit')} Şablonları düzenle</button>`) +
      `<div class="lbw"><div class="card"><div class="card-h">${NS.searchBox('q', 'Model, kod, renk veya barkod...')}<div class="seg">${[['', 'Tümü'], ['fd', 'Fiyatı değişen'], ['ind', 'İndirimde'], ['sec', 'Seçilenler']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div>
        <div class="pad" style="padding-top:0"><input class="input" id="gun" autocomplete="off" placeholder="Barkod okuyucuyla okutun — her okutma 1 etiket ekler"></div><div id="tbl"></div></div>
        <aside class="card pad lbs"><h3>Önizleme</h3><div id="pv"></div>
          <div class="field mt"><label>Şablon</label><select class="input" id="tp">${lbOptions(tpl)}</select></div>
          <div class="field"><label>Çıktı</label><div class="seg" id="ro"><button data-r="0" class="${roll ? '' : 'active'}">A4 sayfa</button><button data-r="1" class="${roll ? 'active' : ''}">Etiket yazıcısı</button></div><p class="small muted" style="margin:6px 0 0">Etiket yazıcısında her etiket ayrı sayfa olarak, şablon ölçüsünde basılır. Yazdırma penceresinde etiket yazıcınızı seçin.</p></div>
          <div class="field"><label>Logo</label><div class="row nw" style="gap:6px;flex-wrap:wrap"><label class="btn sm">${icon('upload')} ${S().logo ? 'Değiştir' : 'Yükle'}<input type="file" accept="image/*" id="lg" hidden></label>${S().logo ? `<button class="btn sm" id="lga">Şablona ekle</button><button class="btn sm ghost" id="lgx">Kaldır</button>` : ''}</div></div>
          <div class="lbs-sum" id="sum"></div><button class="btn primary block" id="pr">${icon('print')} Seçilenleri yazdır</button><button class="btn ghost block" id="none">Seçimi temizle</button></aside></div>`;
    const V = () => { const r = []; db.all('models').forEach((m) => m.variants.forEach((v) => { if (sel.has(v.barcode)) r.push({ m, v, n: sel.get(v.barcode) }); })); return r; };
    const side = () => { const it = V(); $('#pv', el).innerHTML = lbPreview(tpl, it[0]); const n = sum(it, (x) => x.n); const nd = new Set(it.filter((x) => !oldRef(x.m)).map((x) => x.m)).size;
      $('#sum', el).innerHTML = it.length ? `<b>${new Set(it.map((x) => x.m)).size}</b> model · <b>${it.length}</b> beden/renk · <b>${n}</b> etiket${nd && lbTpl(tpl).els.some((e) => e.f === 'old') ? `<div class="small mt">${nd} modelde gösterilebilir indirim yok: eski fiyat basılmaz.</div>` : ''}` : 'Listeden model seçin, barkod okutun veya “Stok kadar” ile toplu ekleyin.'; };
    const rows = () => db.all('models', (m) => (!q || NS.match(q, m.name, m.code, m.cat, ...m.colors.map((c) => c.name)) || m.variants.some((v) => v.barcode === q.trim())) && (!f || (f === 'fd' ? changed(m) : f === 'ind' ? m.disc > 0 : m.variants.some((v) => sel.has(v.barcode)))));
    const draw = () => {
      const all = rows(); const rs = all.slice(0, 150);
      $('#tbl', el).innerHTML = table({ rows: rs, emptyIcon: 'tag', empty: f === 'fd' ? 'Son etiket basımından beri fiyatı değişen model yok' : f === 'sec' ? 'Henüz etiket seçilmedi' : 'Model bulunamadı', columns: [
        { label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint"><span class="mono">${esc(m.code)}</span> · ${oldRef(m) ? `<s>${money(oldRef(m))}</s> <b>${money(unit(m))}</b>` : money(unit(m))} · stok ${mStock(m)}${changed(m) ? ' · ' + badge('Fiyat değişti', 'warn') : ''}</div>` },
        { label: 'Etiket', cls: 'right', render: (m) => { const n = sum(m.variants, (v) => sel.get(v.barcode) || 0); return `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:wrap">${n ? `<b style="min-width:28px">${n}</b>` : ''}<button class="btn sm" data-act="pick" data-id="${m.id}" title="Beden/renk ve adet seç">${icon('grid')}</button><button class="btn sm" data-act="stk" data-id="${m.id}" title="Her beden/renkten stok adedi kadar">Stok kadar</button><button class="btn sm" data-act="one" data-id="${m.id}" title="Her beden/renkten 1 etiket">+1</button>${n ? `<button class="btn sm ghost" data-act="clr" data-id="${m.id}" title="Bu modeli çıkar">${icon('x')}</button>` : ''}</div>`; } },
      ] }) + (all.length > rs.length ? `<p class="small muted center">${all.length - rs.length} model daha var — aramayı daraltın.</p>` : '');
      side();
    };
    const pick = (m) => modal({ title: `${m.name} — etiket adedi`, size: 'wide', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${B.SIZES[m.sizeType].map((s) => `<th class="center">${esc(s)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${B.SIZES[m.sizeType].map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); return `<td class="center">${v ? `<input class="input" type="number" min="0" data-lb="${v.barcode}" value="${sel.get(v.barcode) || 0}" title="Stok: ${v.stock}" style="width:60px;height:32px;text-align:right">` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Her hücre o beden/renk için basılacak etiket adedidir.</p>`,
      actions: [{ label: 'Stok kadar', onClick: (c, b) => { $$('[data-lb]', b).forEach((i) => { i.value = (m.variants.find((v) => v.barcode === i.dataset.lb) || {}).stock || 0; }); return false; } }, { label: 'Tamam', cls: 'primary', onClick: (c, b) => { $$('[data-lb]', b).forEach((i) => { const n = Math.max(0, Math.floor(Number(i.value) || 0)); if (n) sel.set(i.dataset.lb, n); else sel.delete(i.dataset.lb); }); c(); draw(); } }] });
    const addCode = (code) => { const fv = findV(code); if (!fv) { NS.beep(220, 180); toast('Barkod kayıtlı değil: ' + code, 'err'); return; } sel.set(fv.v.barcode, (sel.get(fv.v.barcode) || 0) + 1); NS.beep(); toast(`${fv.m.name} ${fv.v.color}/${fv.v.size} · ${sel.get(fv.v.barcode)} etiket`, 'ok'); draw(); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#gun', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.value.trim()) return; addCode(e.target.value.trim()); e.target.value = ''; });
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act]', (e, b) => { const m = model(b.dataset.id); if (!m) return; const a = b.dataset.act;
      if (a === 'pick') return pick(m);
      if (a === 'stk') { const vs = m.variants.filter((v) => v.stock > 0); if (!vs.length) return toast('Bu modelin stoğu yok — “+1” ile her bedenden bir etiket ekleyin', 'err'); vs.forEach((v) => sel.set(v.barcode, v.stock)); }
      if (a === 'one') m.variants.forEach((v) => sel.set(v.barcode, (sel.get(v.barcode) || 0) + 1));
      if (a === 'clr') m.variants.forEach((v) => sel.delete(v.barcode));
      draw(); });
    $('#tp', el).onchange = (e) => { tpl = e.target.value; S().labelOpt = { tpl, roll }; db.save(); side(); };
    on(el, 'click', '[data-r]', (e, t) => { roll = t.dataset.r === '1'; $$('[data-r]', el).forEach((x) => x.classList.toggle('active', x === t)); S().labelOpt = { tpl, roll }; db.save(); });
    $('#none', el).onclick = () => { sel.clear(); draw(); };
    $('#ed', el).onclick = () => lbDesigner(() => { if (!lbTpls().some((t) => t.id === tpl)) tpl = lbTpls()[0].id; $('#tp', el).innerHTML = lbOptions(tpl); side(); });
    $('#cam', el).onclick = () => NS.scan({ title: 'Etiket için okut', hint: 'Okuttuğunuz her ürün 1 etiket olarak eklenir', continuous: true, onCode: addCode });
    $('#lg', el).onchange = (e) => { const file = e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 360 / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); S().logo = cv.toDataURL('image/png'); db.save(); toast('Logo kaydedildi', 'ok'); redraw(); }; im.onerror = () => toast('Resim okunamadı', 'err'); im.src = rd.result; }; rd.readAsDataURL(file); };
    on(el, 'click', '#lga', () => { const t = lbTpl(tpl); if (t.els.some((x) => x.logo)) return toast('Bu şablonda logo zaten var — yerini “Şablonları düzenle”den değiştirin'); const w = Math.min(20, t.w - 4); t.els.unshift(LE('box', (t.w - w) / 2, 1.5, w, Math.min(8, t.h / 4), { logo: true })); db.save(); toast('Logo şablonun üstüne eklendi', 'ok'); side(); });
    on(el, 'click', '#lgx', async () => { if (!(await confirm('Logo kaldırılsın mı?'))) return; delete S().logo; db.save(); redraw(); });
    $('#pr', el).onclick = () => { const it = V(); if (!it.length) return toast('Etiket seçin', 'err'); S().labelOpt = { tpl, roll }; lbPrint(it, tpl, roll); draw(); };
    draw(); setTimeout(() => $('#gun', el).focus(), 50);
  }

  // ---------- Müşteriler ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler', sub: 'Puan, beden ve alışveriş geçmişi', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'size', label: 'Beden' }, { name: 'birthday', label: 'Doğum günü', type: 'date' }, { name: 'points', label: 'Puan', type: 'number' }, { name: 'kvkk', label: 'SMS/kampanya izni', type: 'checkbox' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'dg', label: 'Bu ay doğum günü', test: (c) => c.birthday && c.birthday.slice(5, 7) === today().slice(5, 7) }, { value: 'izin', label: 'SMS izni olan', test: (c) => c.kvkk }],
      searchFields: (c) => [c.name, c.phone],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}${c.kvkk ? '' : ' · SMS izni yok'}</div>` }, { key: 'size', label: 'Beden', render: (c) => esc(c.size || '-') }, { label: 'Alışveriş', cls: 'right', render: (c) => { const ss = db.all('sales', (s) => s.customer === c.id); return `${ss.length}<div class="small faint">${money(sum(ss, (s) => s.total))}</div>`; } }, { key: 'points', label: 'Puan', cls: 'right', render: (c) => `<b>${c.points || 0}</b>` }, { label: 'Son ziyaret', render: (c) => { const s = db.all('sales', (x) => x.customer === c.id).sort((a, b) => b.at.localeCompare(a.at))[0]; return s ? NS.date(s.at) : '-'; } }],
      extraActions: [{ icon: 'message', act: 'sms', title: 'SMS gönder' }],
      onAction: async (a, c) => { const v = await NS.prompt(`${c.name} için SMS`, `Merhaba ${c.name.split(' ')[0]}, ${S().bizName}'de yeni sezon ürünleri geldi! ${c.points ? c.points + ' puanınız sizi bekliyor.' : ''}`); if (v) { if (!c.kvkk) return toast('Müşterinin SMS izni yok (KVKK)', 'err'); smsSend(c, v); } },
    });
  }

  // ---------- Kampanyalar ----------
  function campaignsPage(el, p, app) {
    el.innerHTML = pageHead('Sezon & Kampanyalar', 'Sezon/kategori indirimi tek tıkla tüm etiketlere ve online kanallara yansır', `<button class="btn primary" id="bulk">${icon('percent')} Toplu indirim uygula</button>`) + `<div class="card"><div class="card-h"><h3>Aktif kampanyalar</h3></div><div id="t"></div></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('campaigns'), columns: [{ label: 'Kampanya', render: (c) => `<b>${esc(c.name)}</b>` }, { label: 'Kapsam', render: (c) => `${c.scope === 'sezon' ? 'Sezon' : 'Kategori'}: ${esc(c.target)}` }, { label: 'Tür', render: (c) => (c.type === 'ikinci' ? `2. üründe %${c.value}` : `%${c.value} indirim`) }, { label: 'Durum', render: (c) => (c.active ? badge('Aktif', 'ok') : badge('Pasif')) }], actions: [{ icon: 'refresh', act: 'tg', title: 'Aç / kapat' }, { icon: 'trash', act: 'del' }] }); };
    on(el, 'click', '[data-act]', async (e, b) => { const c = db.get('campaigns', b.dataset.id); if (b.dataset.act === 'del') { if (!(await confirm('Kampanya silinsin mi?'))) return; if (c.type === 'yuzde') apply(c, 0); db.remove('campaigns', c.id); } else { c.active = !c.active; if (c.type === 'yuzde') apply(c, c.active ? c.value : 0); } db.save(); draw(); });
    // Kampanya açılınca modelin kendi indirimi saklanır, kapanınca geri yüklenir
    const apply = (c, pct) => {
      const ms = db.all('models', (m) => (c.scope === 'sezon' ? m.season === c.target : m.cat === c.target)); let low = 0;
      ms.forEach((m) => priceEdit(m, () => { if (pct > 0) { if (m.camp !== c.id) { m.ownDisc = Number(m.disc) || 0; m.camp = c.id; } m.disc = pct; } else if (m.camp === c.id) { m.disc = m.ownDisc || 0; delete m.camp; delete m.ownDisc; } }));
      ms.forEach((m) => { if (m.disc > 0 && oldRef(m) < m.price) low++; }); const none = ms.filter((m) => m.disc > 0 && !oldRef(m)).length;
      syncOnline(ms); toast(`${ms.length} modelde indirim ${pct ? '%' + pct : 'kaldırıldı'}${low ? ` · ${low} modelde son 10 günde daha düşük fiyat var, eski fiyat olarak o gösterilecek` : ''}${none ? ` (${none} modelde indirim gösterilemez: bu fiyat son 10 günde zaten uygulandı)` : ''}`, ms.length ? 'ok' : 'err');
    };
    $('#bulk', el).onclick = async () => {
      const cats = [...new Set(db.all('models').map((m) => m.cat))];
      const v = await formModal({ title: 'Toplu indirim / kampanya', fields: [{ name: 'name', label: 'Kampanya adı', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'yuzde', label: 'Yüzde indirim (etikete yansır)' }, { value: 'ikinci', label: '2. üründe indirim (kasada)' }] }, { name: 'target', label: 'Kapsam', type: 'select', options: [...B.SEASONS.map((x) => ({ value: 'sezon|' + x, label: 'Sezon: ' + x })), ...cats.map((x) => ({ value: 'kategori|' + x, label: 'Kategori: ' + x }))] }, { name: 'value', label: 'Oran %', type: 'number', required: true }] });
      if (!v) return; const pct = Number(v.value); if (!(pct > 0 && pct <= 90)) return toast('Oran 1 ile 90 arasında olmalı', 'err');
      const [scope, target] = v.target.split('|'); const c = db.insert('campaigns', { ...v, scope, target, value: pct, active: true }); if (c.type === 'yuzde') apply(c, c.value); db.save(); draw();
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
    const sold60 = new Set(db.all('sales', (s) => s.at > addDays(new Date(), -60).toISOString()).flatMap((s) => s.lines.map((l) => l.mid))); const dead = db.all('models').filter((m) => !sold60.has(m.id) && mStock(m) > 0);
    el.innerHTML = pageHead('Raporlar', 'Son 30 gün') + `<div class="grid g4 mb">${kpi('Ciro', money(sum(m30, (s) => s.total)), 'trend', 'ok')}${kpi('Ortalama fiş', money(m30.length ? sum(m30, (s) => s.total) / m30.length : 0), 'receipt', 'info')}${kpi('Fiş başı ürün', (m30.length ? L.length / m30.length : 0).toFixed(2), 'tag')}${kpi('Değişim / iade', rets.length, 'refresh', 'warn')}</div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => (model(l.mid) || {}).cat || '-')).map(([label, v]) => ({ label, value: sum(v, (l) => l.price * l.qty) })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Renkler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => l.color)).map(([label, v]) => ({ label, value: v.length })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Mağaza / online</h3></div><div class="card-b">${chart.donut([{ label: 'Mağaza', value: m30.filter((s) => s.channel !== 'online').length }, { label: 'Online', value: m30.filter((s) => s.channel === 'online').length }], { size: 120 })}</div></div></div>
      <div class="card"><div class="card-h"><h3>Ölü stok — 60 gündür satılmayan</h3><span class="small muted">İndirime alın veya pazaryerine açın</span></div>${table({ rows: dead.sort((a, b) => mStock(b) * b.cost - mStock(a) * a.cost).slice(0, 100), empty: 'Yok', columns: [{ label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint">${esc(m.season)}</div>` }, { label: 'Stok', cls: 'right', render: mStock }, { label: 'Bağlı para', cls: 'right', render: (m) => money(mStock(m) * m.cost) }] })}</div>`;
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
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['kasa'] }, { id: 'satis', label: 'Satış', icon: 'barcode', roles: ['kasa'] }, { id: 'degisim', label: 'Değişim & İade', icon: 'refresh', roles: ['kasa'] }, { id: 'satislar', label: 'Satışlar', icon: 'receipt', roles: ['kasa'] }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'tag', roles: ['kasa'] }, { id: 'etiket', label: 'Etiket Basımı', icon: 'print', roles: ['kasa'] }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['kasa'] }, { sec: 'Yönetim' }, { id: 'kampanyalar', label: 'Sezon & Kampanya', icon: 'percent', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, satis: posPage, degisim: exchangePage, satislar: salesPage, urunler: productsPage, etiket: labelsPage, musteriler: customersPage, kampanyalar: campaignsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza kuralları' }, { name: 'pointPct', label: 'Puan oranı %', type: 'number' }, { name: 'exchangeDays', label: 'Değişim süresi (gün)', type: 'number' }, { name: 'lowStock', label: 'Az kalan beden sınırı', type: 'number' }, { name: 'online', label: 'Stok değişince online kanallara gönder', type: 'checkbox' }] }) },
  });
})();
