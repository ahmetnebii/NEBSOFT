/* NEBSOFT Bilet — etkinlik, gişe (koltuk planı), kapı kontrol, bilet/iade, salon, indirim kodu ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const B = window.BILET;
  const st = document.createElement('style'); st.textContent = B.CSS; document.head.appendChild(st);
  const db = new NS.DB('bilet', B.seed);
  const S = () => db.settings({ serviceFee: 15 });
  const ev = (id) => db.get('events', id) || { name: '-', prices: {} };
  const ven = (id) => db.get('venues', id) || { cats: {}, rows: [] };
  const live = (e) => db.all('tickets', (t) => t.event === e.id && t.status !== 'refunded');
  const tst = (t) => (t.status === 'refunded' ? [B.voidLabel(t), t.void ? '' : 'err'] : TST[t.status]);
  const fee = (t) => Number(t.fee) || 0;
  const occ = (e) => Math.round((live(e).length / Math.max(1, B.capacity(ven(e.venue)))) * 100);
  const TST = { reserved: ['Ödeme bekliyor', 'warn'], valid: ['Geçerli', 'ok'], used: ['Kullanıldı', 'info'], refunded: ['İade edildi', 'err'] };
  const onlineUrl = () => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'bilet.html';
  const upcoming = () => db.all('events', (e) => e.date >= iso(addDays(new Date(), -1)) && B.salesOpen(e, 'gise').ok).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function printTickets(list) {
    NS.printHtml(list.map((t) => { const e = ev(t.event), v = ven(e.venue); return `<div style="display:flex;border:2px solid #000;border-radius:12px;overflow:hidden;margin-bottom:14px;font-family:Arial;max-width:640px"><div style="flex:1;padding:14px;background:${e.color};color:#fff"><div style="font-size:11px;opacity:.85">${esc(S().bizName)} · ${esc(e.cat)}</div><div style="font-size:22px;font-weight:800">${esc(e.name)}</div><div>${esc(e.artist)}</div><div style="margin-top:8px">${NS.dateLong(e.date)} · ${esc(e.time)}</div><div>${esc(v.name)}, ${esc(v.city)}</div><div style="margin-top:8px;font-size:18px"><b>${t.seat ? 'Koltuk ' + esc(t.seat) : esc(v.cats[t.cat])}</b> · ${esc(v.cats[t.cat])}</div><div style="font-size:11px;margin-top:6px">${esc(t.buyer.name)} · ${money(t.paid)}</div></div><div style="padding:12px;text-align:center;background:#fff">${NS.qrSvg('TICKET:' + t.code, 120)}<div style="font-family:monospace;font-weight:700;letter-spacing:.15em">${esc(t.code)}</div></div></div>`; }).join(''), { title: 'Biletler' });
  }

  // ---------- Gişe ----------
  let gEvent = null;
  function boxPage(el, p, app) {
    const evs = upcoming();
    gEvent = p || gEvent || (evs[0] || {}).id;
    const e = ev(gEvent), v = ven(e.venue);
    let sel = [], ga = {};
    const draw = () => {
      const items = v.type === 'seated' ? sel.map((id) => { const s = B.seats(v).find((x) => x.id === id); return { seat: id, cat: s.cat, price: e.prices[s.cat] }; }) : Object.entries(ga).flatMap(([cat, n]) => Array.from({ length: n }, () => ({ seat: null, cat, price: e.prices[cat] })));
      el.innerHTML = pageHead('Gişe', 'Koltuğa tıklayarak seçin, müşteri bilgisini girip satın', `<select class="input" id="ev" style="max-width:340px">${evs.map((x) => `<option value="${x.id}" ${x.id === gEvent ? 'selected' : ''}>${NS.date(x.date)} · ${esc(x.name)}</option>`).join('')}</select>`) + `
        <div class="grid g-21"><div class="card pad"><div class="row mb"><b class="grow">${esc(e.name)} · ${esc(v.name)}</b>${badge('%' + occ(e) + ' dolu', occ(e) > 85 ? 'err' : 'acc')}</div>
          ${v.type === 'seated' ? B.seatMap(db, e, v, { selected: sel }) : Object.entries(v.cats).map(([c, n]) => `<div class="ga-cat"><div class="grow"><b>${esc(n)}</b><div class="small muted">${money(e.prices[c])} · ${B.catLeft(db, e, v, c)} kaldı</div></div><button class="btn icon" data-ga="${c}|-1">${icon('minus')}</button><b style="min-width:24px;text-align:center">${ga[c] || 0}</b><button class="btn icon" data-ga="${c}|1">${icon('plus')}</button></div>`).join('')}</div>
        <div class="card"><div class="card-h"><h3>${icon('ticket')} Seçilen biletler (${items.length})</h3></div><div class="card-b">${items.map((i) => `<div class="list-item small"><span class="grow">${i.seat ? '<b>' + esc(i.seat) + '</b> · ' : ''}${esc(v.cats[i.cat])}</span><b>${money(i.price)}</b></div>`).join('') || '<div class="faint small">Koltuk seçin</div>'}
          <div class="form-grid mt" id="bf">${NS.fieldsHtml([{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'code', label: 'İndirim kodu' }])}</div>
          <div class="row between mt"><b>Toplam</b><b style="font-size:24px">${money(sum(items, (i) => i.price))}</b></div>
          <div class="row mt"><button class="btn ok lg grow" data-pay="nakit" ${items.length ? '' : 'disabled'}>${icon('cash')} Nakit</button><button class="btn primary lg grow" data-pay="kart" ${items.length ? '' : 'disabled'}>${icon('card')} Kart</button></div></div>
          ${(() => { const rs = db.all('tickets', (t) => t.event === e.id && t.status === 'reserved'); const by = NS.groupBy(rs, (t) => t.order || t.id); return rs.length ? `<div class="card mt"><div class="card-h"><h3>${icon('clock')} Ödeme bekleyen rezervasyonlar (${rs.length})</h3></div><div class="card-b">${Object.entries(by).map(([o, ts]) => `<div class="list-item small"><span class="grow"><b>${esc(ts[0].buyer.name)}</b> · ${esc(o)} · ${ts.length} bilet<div class="faint">${ts.map((t) => esc(t.seat || v.cats[t.cat])).join(', ')}${ts[0].holdUntil ? ' · son ' + NS.dt(new Date(ts[0].holdUntil).toISOString()) : ''}</div></span><b>${money(sum(ts, (t) => t.paid + fee(t)))}</b><button class="btn sm ok" data-rp="${esc(o)}|nakit">Nakit</button><button class="btn sm primary" data-rp="${esc(o)}|kart">Kart</button></div>`).join('')}</div></div>` : ''; })()}</div></div>`;
      $('#ev', el).onchange = (x) => { app.go('gise', x.target.value); };
      el._items = items;
    };
    on(el, 'click', '[data-seat]', (x, b) => { const id = b.dataset.seat; sel = sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id]; draw(); });
    on(el, 'click', '[data-ga]', (x, b) => { const [c, d] = b.dataset.ga.split('|'); ga[c] = NS.clamp((ga[c] || 0) + Number(d), 0, B.catLeft(db, e, v, c)); draw(); });
    // Kart: POS bağlantısı açıksa çekim önce yapılır; onaylanmazsa satış olmaz
    const takeCard = async (amount) => { if (!(NS.integ && NS.integ.isOn('pos'))) return { ok: true }; const c = await NS.integ.cardPayment(amount); if (!c.ok) toast('Kart ödemesi alınamadı: ' + (c.error || ''), 'err'); return c; };
    on(el, 'click', '[data-pay]', async (x, b) => {
      const f = $('#bf', el); if (!NS.validate(f)) return; const bf = NS.readForm(f);
      const items = el._items; const sold = B.sold(db, e.id);
      const so = B.salesOpen(e, 'gise'); if (!so.ok) return toast(so.why, 'err');
      if (items.some((i) => i.seat && sold.has(i.seat))) { toast('Seçilen koltuklardan biri az önce satıldı', 'err'); sel = []; return draw(); }
      const cc = B.codeCheck(db, bf.code, e, items.length, 'gise'); if (cc.err) return toast(cc.err, 'err'); const k = cc.k;
      const lines = items.map((i) => ({ ...i, paid: k ? Math.round(i.price * (1 - k.pct / 100)) : i.price }));
      if (b.dataset.pay === 'kart') { const c = await takeCard(sum(lines, (i) => i.paid)); if (!c.ok) return; }
      if (k) k.uses = (k.uses || 0) + items.length;
      const order = db.nextNo('orders', 'B');
      const made = lines.map((i) => db.insert('tickets', { code: B.code(), event: e.id, seat: i.seat, cat: i.cat, price: i.price, paid: i.paid, fee: 0, discount: k ? k.code : null, buyer: { name: bf.name, phone: bf.phone }, channel: 'gise', pay: b.dataset.pay, cashier: NS.currentUser ? NS.currentUser.name : '', at: new Date().toISOString(), status: 'valid', order }, true));
      db.log('Gişe satış', `${e.name} · ${made.length} bilet`); db.save();
      toast(`${made.length} bilet satıldı`, 'ok'); printTickets(made); sel = []; ga = {}; draw();
    });
    // Ödeme bekleyen online rezervasyonun gişede tahsili
    on(el, 'click', '[data-rp]', async (x, b) => {
      const [o, pay] = b.dataset.rp.split('|'); const ts = db.all('tickets', (t) => t.status === 'reserved' && (t.order === o || t.id === o)); if (!ts.length) return draw();
      const amt = sum(ts, (t) => t.paid + fee(t));
      if (!(await confirm(`${ts[0].buyer.name} · ${ts.length} bilet için ${money(amt)} ${pay === 'kart' ? 'kartla' : 'nakit'} tahsil edilsin mi?`, { ok: 'Tahsil et', danger: false }))) return;
      if (pay === 'kart') { const c = await takeCard(amt); if (!c.ok) return; }
      ts.forEach((t) => Object.assign(t, { status: 'valid', pay, paidAt: new Date().toISOString(), cashier: NS.currentUser ? NS.currentUser.name : '' }));
      db.log('Rezervasyon ödendi', o); db.save(); toast('Biletler geçerli', 'ok'); printTickets(ts); draw();
    });
    if (!e.id) { el.innerHTML = '<div class="empty">Yaklaşan etkinlik yok</div>'; return; }
    draw();
  }

  // ---------- Kapı kontrol ----------
  let gateEv = null, lastRes = null;
  function gatePage(el, p, app) {
    const evs = db.all('events', (e) => e.date >= iso(addDays(new Date(), -1))).sort((a, b) => a.date.localeCompare(b.date));
    gateEv = gateEv || (evs[0] || {}).id;
    const e = ev(gateEv); const all = live(e); const used = all.filter((t) => t.status === 'used');
    const r = lastRes;
    el.innerHTML = pageHead('Kapı Kontrol', 'Bilet QR kodunu okutun veya kodu yazın', `<select class="input" id="ev" style="max-width:340px">${evs.map((x) => `<option value="${x.id}" ${x.id === gateEv ? 'selected' : ''}>${NS.date(x.date)} ${x.time} · ${esc(x.name)}</option>`).join('')}</select>`) + `
      <div class="grid g4 mb">${kpi('İçeride', used.length, 'users', 'ok')}${kpi('Beklenen', all.length - used.length, 'clock', 'info')}${kpi('Toplam bilet', all.length, 'ticket')}${kpi('Giriş oranı', '%' + (all.length ? Math.round((used.length / all.length) * 100) : 0), 'percent', 'warn')}</div>
      <div class="grid g2"><div class="col"><input class="input lg mono" id="tc" placeholder="Bilet kodu (8 karakter) + Enter" style="height:64px;font-size:24px;text-align:center;text-transform:uppercase;letter-spacing:.2em" autocomplete="off">
        <div class="gate-res ${r ? r.cls : 'idle'}">${r ? `<div style="font-size:48px">${r.cls === 'ok' ? '✓' : r.cls === 'warn' ? '!' : '✕'}</div><h1 style="color:inherit">${esc(r.title)}</h1><div>${esc(r.msg)}</div>` : `${icon('qr', 'ico-lg')}<h2>Bilet bekleniyor</h2>`}</div>
        ${NS.scan ? `<button class="btn lg block" id="cam">${icon('camera')} Kamerayla okut</button>` : ''}
        ${/demo=1/.test(location.search) ? `<div class="small muted">Demo deneme kodları: ${all.filter((t) => t.status === 'valid').slice(0, 4).map((t) => `<a href="#" data-try="${t.code}" class="mono">${t.code}</a>`).join(' · ')}</div>` : ''}</div>
        <div class="card"><div class="card-h"><h3>Son girişler</h3></div><div class="card-b" style="max-height:440px;overflow:auto">${used.sort((a, b) => String(b.usedAt).localeCompare(String(a.usedAt))).slice(0, 25).map((t) => `<div class="list-item small"><span class="dot ok"></span><span class="grow"><b>${esc(t.buyer.name)}</b> · ${esc(t.seat || ven(e.venue).cats[t.cat])}</span><span class="faint">${NS.time(t.usedAt)}</span></div>`).join('') || '<div class="faint small">Henüz giriş yok</div>'}</div></div></div>`;
    $('#ev', el).onchange = (x) => { gateEv = x.target.value; lastRes = null; app.refresh(); };
    const check = (code) => {
      code = String(code || '').trim().toUpperCase().replace(/^TICKET:/, ''); if (!code) return;
      const t = db.find('tickets', (x) => x.code === code);
      if (!t) lastRes = { cls: 'err', title: 'Geçersiz bilet', msg: `${code} sistemde yok` };
      else if (t.event !== e.id) lastRes = { cls: 'err', title: 'Farklı etkinlik', msg: `${ev(t.event).name} · ${NS.date(ev(t.event).date)}` };
      else if (t.status === 'reserved') lastRes = { cls: 'err', title: 'Ödenmemiş rezervasyon', msg: `${t.buyer.name} · önce gişede ödeme alın (Biletler → Ödendi)` };
      else if (t.status === 'refunded') lastRes = { cls: 'err', title: t.void ? 'Geçersiz rezervasyon' : 'İade edilmiş bilet', msg: B.voidLabel(t) };
      else if (t.status === 'used') lastRes = { cls: 'warn', title: 'Daha önce kullanıldı', msg: `Giriş saati ${NS.time(t.usedAt)} — ${t.buyer.name}` };
      else { t.status = 'used'; t.usedAt = new Date().toISOString(); db.save(); lastRes = { cls: 'ok', title: 'Giriş onaylandı', msg: `${t.buyer.name} · ${t.seat ? 'Koltuk ' + t.seat : ven(e.venue).cats[t.cat]}${t.discount === 'OGRENCI' ? ' · Öğrenci kimliği kontrol edin!' : ''}` }; }
      NS.beep(lastRes.cls === 'ok' ? 1300 : 220, lastRes.cls === 'ok' ? 120 : 400);
      // Turnike / QR kapı okuyucu: geçerli bilette kapı açılır
      if (lastRes.cls === 'ok' && NS.integ && NS.integ.isOn('turnike')) NS.integ.call('turnike', 'kapi-ac', { ticket: code, event: e.name, gate: S().gateName || 'Ana kapı' }, { silent: true });
      app.refresh();
    };
    // Kapı cihazlarında okutulan biletler periyodik çekilir
    if (NS.integ && NS.integ.isOn('turnike')) { clearInterval(window.__gatePoll); window.__gatePoll = setInterval(async () => { if (app.route !== 'kapi' || document.querySelector('.ns-overlay')) return; const r = await NS.integ.call('turnike', 'okumalar', { since: new Date(Date.now() - 6000).toISOString() }, { silent: true }); (r && r.data && Array.isArray(r.data.reads) ? r.data.reads : []).forEach((x) => check(x.code)); }, 5000); }
    const tc = $('#tc', el); setTimeout(() => tc.focus(), 50);
    tc.onkeydown = (x) => { if (x.key === 'Enter') check(tc.value); };
    // Telefon kamerasıyla ardışık okutma: her okumada sonuç ekranda, kamera açık kalır
    const cam = $('#cam', el); if (cam) cam.onclick = () => { const sc = NS.scan({ title: `Kapı · ${e.name}`, hint: 'Bilet QR kodunu çerçeveye getirin', continuous: true, onCode: (c) => { check(c); const r = lastRes; NS.toast(`${r.title} — ${r.msg}`, r.cls === 'ok' ? 'ok' : 'err'); return false; } }); window.__gateScan = sc; };
    on(el, 'click', '[data-try]', (x, a) => { x.preventDefault(); check(a.dataset.try); });
  }

  // ---------- Etkinlikler ----------
  const evCard = (e) => { const v = ven(e.venue); const o = occ(e); return `<div class="card evc" data-ev="${e.id}"><div class="hd" style="background:linear-gradient(transparent 20%,rgba(0,0,0,.75)),${e.color} url(${B.poster(e, 600, 300)}) center/cover"><span class="badge" style="background:rgba(255,255,255,.2);color:#fff;border:0;align-self:flex-start">${esc(e.cat)}</span><h2 style="color:#fff;margin-top:8px">${esc(e.name)}</h2><div class="small">${esc(e.artist)}</div></div><div class="card-b"><div class="small muted">${icon('calendar')} ${NS.dateLong(e.date)} · ${esc(e.time)}<br>${icon('map')} ${esc(v.name)}</div><div class="progress mt"><i style="width:${o}%;${o > 85 ? 'background:var(--err)' : ''}"></i></div><div class="row between small mt"><span>%${o} dolu · ${live(e).length}/${B.capacity(v)}</span><b>${money(sum(live(e), (t) => t.paid))}</b></div></div></div>`; };
  function eventsPage(el, p, app) {
    if (p) return eventDetail(el, p, app);
    let f = 'up';
    const draw = () => {
      const list = db.all('events', (e) => (f === 'up' ? e.date >= today() : e.date < today())).sort((a, b) => (f === 'up' ? 1 : -1) * a.date.localeCompare(b.date));
      el.innerHTML = pageHead('Etkinlikler', 'Takvim, satış ve doluluk', `<div class="seg"><button data-f="up" class="${f === 'up' ? 'active' : ''}">Yaklaşan</button><button data-f="past" class="${f === 'past' ? 'active' : ''}">Geçmiş</button></div><a class="btn" href="bilet.html" target="_blank">${icon('globe')} Online satış sayfası</a><button class="btn primary" id="ne">${icon('plus')} Yeni etkinlik</button>`) + `<div class="grid g-auto">${list.map(evCard).join('') || '<div class="empty">Etkinlik yok</div>'}</div>`;
      $('#ne', el).onclick = () => eventForm(app);
    };
    on(el, 'click', '[data-f]', (x, b) => { f = b.dataset.f; draw(); });
    on(el, 'click', '[data-ev]', (x, c) => app.go('etkinlikler', c.dataset.ev));
    draw();
  }
  async function eventForm(app, rec) {
    const venues = db.all('venues');
    const vid = rec ? rec.venue : venues[0].id;
    const priceFields = (v) => Object.entries(v.cats).map(([c, n]) => ({ name: 'p_' + c, label: `${n} fiyatı (₺)`, type: 'number', required: true }));
    const step1 = rec ? { venue: vid } : await formModal({ title: 'Yeni etkinlik — salon seçimi', fields: [{ name: 'venue', label: 'Salon', type: 'select', options: venues.map((v) => ({ value: v.id, label: `${v.name} (${B.capacity(v)} kişilik)` })) }], submitLabel: 'Devam' });
    if (!step1) return;
    const v = ven(step1.venue);
    const vals = rec ? { ...rec, ...Object.fromEntries(Object.entries(rec.prices).map(([c, pr]) => ['p_' + c, pr])) } : { date: iso(addDays(new Date(), 14)), time: '20:30', cat: 'Konser', color: NS.pick(B.COLORS), age: 'Genel izleyici' };
    const x = await formModal({ title: rec ? rec.name : `Yeni etkinlik — ${v.name}`, size: 'wide', fields: [{ name: 'name', label: 'Etkinlik adı', required: true, full: true }, { name: 'artist', label: 'Sanatçı / topluluk' }, { name: 'cat', label: 'Tür', type: 'select', options: B.CATS }, { name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'time', label: 'Saat', type: 'time', required: true }, { name: 'age', label: 'Yaş sınırı' }, { name: 'color', label: 'Afiş rengi', type: 'color' }, { name: 'photo', label: 'Afiş görseli (URL — boşsa türüne uygun görsel)', full: true }, { name: 'salesStart', label: 'Online satış başlangıcı (boşsa hemen)', type: 'datetime-local' }, { name: 'salesEnd', label: 'Online satış bitişi (boşsa etkinlik saati)', type: 'datetime-local' }, ...priceFields(v), { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }], values: vals });
    if (!x) return;
    const prices = Object.fromEntries(Object.keys(v.cats).map((c) => [c, Number(x['p_' + c]) || 0]));
    const data = { name: x.name, artist: x.artist, cat: x.cat, date: x.date, time: x.time, age: x.age, color: x.color, photo: x.photo, desc: x.desc, prices, venue: v.id, salesStart: x.salesStart, salesEnd: x.salesEnd };
    if (rec) db.update('events', rec.id, data); else { const n = db.insert('events', { ...data, status: 'satista' }); db.log('Yeni etkinlik', n.name); app.go('etkinlikler', n.id); return; }
    toast('Kaydedildi', 'ok'); app.refresh();
  }
  function eventDetail(el, id, app) {
    const e = db.get('events', id); if (!e) return app.go('etkinlikler');
    const v = ven(e.venue); const ts = live(e);
    const byCat = Object.entries(v.cats).map(([c, n]) => ({ id: c, n, sold: ts.filter((t) => t.cat === c).length, rev: sum(ts.filter((t) => t.cat === c), (t) => t.paid), left: B.catLeft(db, e, v, c) }));
    const ser = NS.dailySeries(ts, 21, 'at', () => 1);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/etkinlikler">${icon('back')} Etkinlikler</a><h1 class="grow">${esc(e.name)}</h1><a class="btn" href="#/gise/${e.id}">${icon('ticket')} Gişeden sat</a><a class="btn" href="bilet.html#/etkinlik/${e.id}" target="_blank">${icon('globe')} Online sayfa</a><button class="btn" id="ed">${icon('edit')} Düzenle</button>${e.status !== 'iptal' ? `<button class="btn danger" id="cx">İptal et</button>` : badge('İPTAL EDİLDİ', 'err')}</div>
      <div class="grid g4 mb">${kpi('Satılan bilet', `${ts.length} / ${B.capacity(v)}`, 'ticket', '', `<div class="progress mt"><i style="width:${occ(e)}%"></i></div>`)}${kpi('Hasılat', money(sum(ts, (t) => t.paid)), 'wallet', 'ok')}${kpi('Online oranı', '%' + (ts.length ? Math.round((ts.filter((t) => t.channel === 'online').length / ts.length) * 100) : 0), 'globe', 'info')}${kpi('Etkinliğe kalan', e.date >= today() ? NS.daysBetween(new Date(), e.date) + ' gün' : 'Geçti', 'calendar', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card pad">${v.type === 'seated' ? B.seatMap(db, e, v, { interactive: false }) : '<div class="empty">Ayakta / genel giriş etkinliği</div>'}</div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div>${table({ rows: byCat, columns: [{ label: 'Kategori', render: (r) => `<b>${esc(r.n)}</b><div class="small faint">${money(e.prices[r.id])}</div>` }, { label: 'Satılan', cls: 'right', key: 'sold' }, { label: 'Kalan', cls: 'right', render: (r) => (r.left ? r.left : badge('Tükendi', 'err')) }, { label: 'Hasılat', cls: 'right', render: (r) => money(r.rev) }] })}</div>
      <div class="card"><div class="card-h"><h3>Günlük satış (21 gün)</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { labelEvery: 3 })}</div></div></div></div>
      <div class="card"><div class="card-h"><h3>Katılımcı listesi</h3><button class="btn sm" id="dl">${icon('download')} İndir</button></div>${table({ rows: ts.slice().sort((a, b) => String(a.seat).localeCompare(String(b.seat), 'tr', { numeric: true })), columns: [{ label: 'Koltuk', render: (t) => `<b>${esc(t.seat || '-')}</b>` }, { label: 'Kategori', render: (t) => esc(v.cats[t.cat]) }, { label: 'Ad', render: (t) => esc(t.buyer.name) }, { label: 'Kanal', render: (t) => badge(t.channel === 'online' ? 'Online' : 'Gişe', t.channel === 'online' ? 'info' : '') }, { label: 'Kod', render: (t) => `<span class="mono">${esc(t.code)}</span>` }, { label: 'Durum', render: (t) => badge(TST[t.status][0], TST[t.status][1]) }] })}</div>`;
    $('#ed', el).onclick = () => eventForm(app, e);
    if ($('#cx', el)) $('#cx', el).onclick = async () => {
      const paidT = ts.filter((t) => t.status !== 'reserved'), resT = ts.filter((t) => t.status === 'reserved');
      const v2 = await formModal({ title: `${e.name} — etkinliği iptal et`, submitLabel: 'Etkinliği iptal et', fields: [
        { name: 'reason', label: 'İptal nedeni (alıcılara iletilir)', required: true, full: true },
        { name: 'method', label: `Ödenmiş ${paidT.length} biletin iadesi`, type: 'select', full: true, options: [{ value: 'odeme-yontemi', label: 'Ödendiği yöntemle (kart → karta, nakit → gişeden)' }, { value: 'havale', label: 'Havale / EFT ile' }] },
        { name: 'sms', label: `Alıcılara SMS gönder (${[...new Set(ts.map((t) => t.buyer.phone).filter(Boolean))].length} telefon)`, type: 'checkbox', value: true, full: true },
      ] });
      if (!v2) return;
      const at = new Date().toISOString(); const back = (t) => t.paid + (S().feeRefund ? fee(t) : 0);
      e.status = 'iptal'; e.cancel = { reason: v2.reason, at, by: NS.currentUser ? NS.currentUser.name : '' };
      paidT.forEach((t) => { t.status = 'refunded'; t.refundedAt = at; t.refund = { amount: back(t), method: v2.method === 'havale' ? 'havale' : t.pay, reason: 'Etkinlik iptali: ' + v2.reason, at, done: false }; });
      resT.forEach((t) => { t.status = 'refunded'; t.void = 'cancelled'; t.refundedAt = at; });
      db.log('Etkinlik iptal', `${e.name} · ${paidT.length} iade, ${resT.length} rezervasyon iptal`); db.save();
      let sent = 0, fail = 0, test = 0;
      if (v2.sms && NS.integ) { const phones = [...new Set(ts.map((t) => t.buyer.phone).filter(Boolean))]; for (const ph of phones) { const r = await NS.integ.sms(ph, `${S().bizName}: ${NS.date(e.date)} tarihli "${e.name}" etkinliği iptal edildi (${v2.reason}). Ödediğiniz tutar iade edilecektir. Bilgi: ${S().bizPhone || ''}`, { silent: true }); if (r && r.simulated) test++; else if (r && r.ok) sent++; else fail++; } }
      toast(`${paidT.length} bilet iadeye alındı, ${resT.length} rezervasyon iptal edildi${v2.sms ? ` · SMS: ${sent} gönderildi${test ? `, ${test} TEST (gönderilmedi)` : ''}${fail ? `, ${fail} gönderilemedi (SMS bağlantısını kontrol edin)` : ''}` : ''}`, fail || test ? 'warn' : 'ok');
      app.refresh();
    };
    $('#dl', el).onclick = () => NS.csv(`katilimci-${NS.slug(e.name)}`, ts, [{ key: 'seat', label: 'Koltuk' }, { label: 'Kategori', value: (t) => v.cats[t.cat] }, { label: 'Ad', value: (t) => t.buyer.name }, { label: 'Telefon', value: (t) => t.buyer.phone }, { key: 'code', label: 'Kod' }, { label: 'Durum', value: (t) => TST[t.status][0] }]);
  }

  // ---------- Biletler ----------
  function ticketsPage(el, p, app) {
    let q = '', f = '';
    el.innerHTML = pageHead('Biletler', 'Bilet sorgulama, yeniden yazdırma ve iade') + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Bilet kodu, ad, telefon, sipariş no...')}<div class="seg">${[['', 'Tümü'], ['reserved', 'Ödeme bekleyen'], ['iade', 'İadesi yapılacak'], ['refunded', 'İade / iptal']].map(([k, l]) => `<button data-f="${k}" class="${k === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const pick = (t) => (!f || (f === 'iade' ? t.refund && !t.refund.done : t.status === f)) && (q.length < 2 || NS.match(q, t.code, t.buyer.name, t.buyer.phone, t.order));
    const draw = () => {
      const rows = db.all('tickets', pick).sort((a, b) => String(b.refundedAt || b.at).localeCompare(String(a.refundedAt || a.at))).slice(0, q.length < 2 && !f ? 40 : 300);
      $('#t', el).innerHTML = table({ rows, empty: 'Bilet yok', columns: [{ label: 'Kod', render: (t) => `<b class="mono">${esc(t.code)}</b><div class="small faint">${esc(t.order || '')} · ${t.channel === 'online' ? 'Online' : 'Gişe'}</div>` }, { label: 'Etkinlik', render: (t) => `${esc(ev(t.event).name)}<div class="small faint">${NS.date(ev(t.event).date)}</div>` }, { label: 'Koltuk', render: (t) => esc(t.seat || ven(ev(t.event).venue).cats[t.cat]) }, { label: 'Alıcı', render: (t) => `${esc(t.buyer.name)}<div class="small faint">${esc(t.buyer.phone || '')}</div>` }, { label: 'Ödenen', cls: 'right', render: (t) => `${money(t.paid + fee(t))}${fee(t) ? `<div class="small faint">hizmet ${money(fee(t))}</div>` : ''}${t.discount ? `<div class="small faint">${esc(t.discount)}</div>` : ''}` },
        { label: 'Durum', render: (t) => `${badge(tst(t)[0], tst(t)[1])}${t.status === 'reserved' && t.holdUntil ? `<div class="small faint">son ödeme ${NS.dt(new Date(t.holdUntil).toISOString())}</div>` : ''}${t.refund ? `<div class="small ${t.refund.done ? 'faint' : ''}" style="${t.refund.done ? '' : 'color:var(--warn)'}">${money(t.refund.amount)} · ${esc(t.refund.method || '')} · ${t.refund.done ? 'ödendi ' + NS.date(t.refund.done) : 'iade ödemesi bekliyor'}</div>` : ''}` }],
        actions: [{ icon: 'print', act: 'p', show: (t) => t.status !== 'refunded' }, { label: 'Ödendi', act: 'o', show: (t) => t.status === 'reserved' }, { label: 'İptal', act: 'c', show: (t) => t.status === 'reserved' }, { label: 'İade', act: 'r', show: (t) => t.status === 'valid' }, { label: 'İade ödendi', act: 'd', show: (t) => t.refund && !t.refund.done }] });
    };
    $('#q', el).oninput = (x) => { q = x.target.value; draw(); };
    on(el, 'click', '[data-f]', (x, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((y) => y.classList.toggle('active', y === b)); draw(); });
    on(el, 'click', '[data-act]', async (x, b) => {
      const t = db.get('tickets', b.dataset.id); const a = b.dataset.act; const at = new Date().toISOString();
      if (a === 'p') return printTickets([t]);
      if (a === 'o') {
        const ts = db.all('tickets', (y) => y.status === 'reserved' && (t.order ? y.order === t.order : y.id === t.id));
        const v = await formModal({ title: `${t.order || t.code} — ödeme al`, submitLabel: 'Ödendi', fields: [{ name: 'pay', label: `${ts.length} bilet · ${money(sum(ts, (y) => y.paid + fee(y)))}`, type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }, { value: 'havale', label: 'Havale / EFT' }] }] });
        if (!v) return;
        if (v.pay === 'kart' && NS.integ && NS.integ.isOn('pos')) { const c = await NS.integ.cardPayment(sum(ts, (y) => y.paid + fee(y))); if (!c.ok) return toast('Kart ödemesi alınamadı: ' + (c.error || ''), 'err'); }
        ts.forEach((y) => Object.assign(y, { status: 'valid', pay: v.pay, paidAt: at, cashier: NS.currentUser ? NS.currentUser.name : '' })); db.log('Rezervasyon ödendi', t.order || t.code); db.save(); toast('Biletler geçerli', 'ok'); return draw();
      }
      if (a === 'c') { if (!(await confirm(`${t.code} rezervasyonu iptal edilsin mi? Ödeme alınmamıştı; koltuk satışa açılır.`, { ok: 'İptal et' }))) return; Object.assign(t, { status: 'refunded', void: 'cancelled', refundedAt: at }); if (t.discount) { const k = db.find('codes', (c) => c.code === t.discount); if (k) k.uses = Math.max(0, (k.uses || 0) - 1); } db.log('Rezervasyon iptal', t.code); db.save(); toast('Rezervasyon iptal edildi, koltuk serbest', 'ok'); return draw(); }
      if (a === 'd') { if (!(await confirm(`${t.code}: ${money(t.refund.amount)} iade ödemesi alıcıya yapıldı mı?`, { ok: 'Yapıldı', danger: false }))) return; t.refund.done = today(); db.log('İade ödendi', t.code); db.save(); return draw(); }
      if (a === 'r') {
        const days = NS.daysBetween(new Date(), ev(t.event).date); const late = days < (S().refundDays || 0);
        const v = await formModal({ title: `İade · ${t.code}`, submitLabel: 'İade et', fields: [
          ...(late ? [{ type: 'section', label: `Uyarı: etkinliğe ${days} gün kaldı, iade süresi (${S().refundDays} gün) geçti` }] : []),
          { name: 'amount', label: `İade tutarı (ödenen ${money(t.paid)}${fee(t) ? ' + hizmet bedeli ' + money(fee(t)) : ''})`, type: 'number', required: true, value: t.paid + (S().feeRefund ? fee(t) : 0) },
          { name: 'method', label: 'İade yöntemi', type: 'select', options: [{ value: t.pay, label: `Ödendiği yöntemle (${t.pay})` }, { value: 'nakit', label: 'Nakit (gişeden)' }, { value: 'havale', label: 'Havale / EFT' }] },
          { name: 'reason', label: 'Gerekçe', type: 'select', options: ['Alıcı talebi', 'Etkinlik değişikliği', 'Çift satış', 'Hatalı satış', 'Diğer'] },
          { name: 'done', label: 'İade ödemesi şimdi yapıldı', type: 'checkbox', value: v0done(t) },
        ] });
        if (!v) return;
        if (Number(v.amount) < 0 || Number(v.amount) > t.paid + fee(t)) return toast('İade tutarı ödenenden fazla olamaz', 'err');
        Object.assign(t, { status: 'refunded', refundedAt: at, refund: { amount: Number(v.amount), method: v.method, reason: v.reason, at, by: NS.currentUser ? NS.currentUser.name : '', done: v.done ? today() : false } });
        if (t.discount) { const k = db.find('codes', (c) => c.code === t.discount); if (k) k.uses = Math.max(0, (k.uses || 0) - 1); }
        db.log('Bilet iade', `${t.code} · ${money(v.amount)}`); db.save(); toast(`İade kaydedildi, koltuk serbest${v.done ? '' : ' — iade ödemesi "İadesi yapılacak" listesinde'}`, 'ok'); draw();
      }
    });
    draw();
  }
  // Nakit iade gişede hemen yapılır; kart/havale iadesi sonradan teyit edilir
  const v0done = (t) => t.pay === 'nakit';
  function venuesPage(el, p, app) {
    el.innerHTML = pageHead('Salonlar', 'Koltuk planları ve kapasiteler', `<button class="btn primary" id="nv">${icon('plus')} Yeni salon</button>`) + `<div class="grid g2">${db.all('venues').map((v) => `<div class="card"><div class="card-h"><h3>${esc(v.name)}</h3>${badge(v.type === 'seated' ? 'Numaralı koltuk' : 'Genel giriş', 'acc')}${badge(B.capacity(v) + ' kişi')}</div><div class="card-b">${v.type === 'seated' ? B.seatMap(db, { id: '-', prices: Object.fromEntries(Object.keys(v.cats).map((c) => [c, 0])) }, v, { interactive: false }) : Object.entries(v.capacity).map(([c, n]) => `<div class="list-item"><span class="grow">${esc(v.cats[c])}</span><b>${n} kişi</b></div>`).join('')}</div></div>`).join('')}</div>`;
    $('#nv', el).onclick = async () => {
      const x = await formModal({ title: 'Yeni salon (numaralı koltuk)', fields: [{ name: 'name', label: 'Salon adı', required: true }, { name: 'city', label: 'Şehir', value: 'İstanbul' }, { name: 'rows', label: 'Sıra sayısı', type: 'number', value: 10 }, { name: 'seats', label: 'Sıra başına koltuk', type: 'number', value: 14 }, { name: 'vip', label: 'VIP sıra sayısı (öndeki)', type: 'number', value: 2 }] });
      if (!x) return; const rows = Array.from({ length: NS.clamp(x.rows, 1, 26) }, (_, i) => ({ r: String.fromCharCode(65 + i), cat: i < x.vip ? 'vip' : 'gen' }));
      db.insert('venues', { name: x.name, city: x.city, type: 'seated', seatsPerRow: NS.clamp(x.seats, 1, 40), rows, cats: { vip: 'VIP', gen: 'Genel' } }); toast('Salon oluşturuldu', 'ok'); app.refresh();
    };
  }
  function dashboard(el, p, app) {
    const all = db.all('tickets', (t) => t.status !== 'refunded'); const t0 = today();
    const todayT = all.filter((t) => iso(t.at) === t0); const d30 = all.filter((t) => t.at > addDays(new Date(), -30).toISOString());
    const ser = NS.dailySeries(all, 30, 'at', (t) => t.paid);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/kapi">${icon('qr')} Kapı kontrol</a><a class="btn primary" href="#/gise">${icon('ticket')} Gişe</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün satılan', todayT.length + ' bilet', 'ticket', '', `<div class="small faint">${money(sum(todayT, (t) => t.paid))}</div>`)}${kpi('30 gün hasılat', money(sum(d30, (t) => t.paid)), 'trend', 'ok')}${kpi('Yaklaşan etkinlik', upcoming().length, 'calendar', 'info')}${kpi('Online satış oranı', '%' + (d30.length ? Math.round((d30.filter((t) => t.channel === 'online').length / d30.length) * 100) : 0), 'globe', 'warn')}</div>
      <div class="card mb"><div class="card-h"><h3>Günlük hasılat</h3></div><div class="card-b">${chart.line([{ name: 'Hasılat', values: ser.values }], ser.labels, { format: money })}</div></div>
      <h2 class="mb">Yaklaşan etkinlikler</h2><div class="grid g-auto">${upcoming().slice(0, 6).map(evCard).join('')}</div>`;
    on(el, 'click', '[data-ev]', (x, c) => app.go('etkinlikler', c.dataset.ev));
  }
  function reportsPage(el) {
    const evs = db.all('events'); const all = db.all('tickets');
    const rows = evs.map((e) => ({ id: e.id, e, n: live(e).length, rev: sum(live(e), (t) => t.paid), fee: sum(live(e), fee), refAmt: sum(all.filter((t) => t.event === e.id && t.refund), (t) => t.refund.amount), o: occ(e), ref: all.filter((t) => t.event === e.id && t.status === 'refunded').length, show: e.date < today() ? Math.round((live(e).filter((t) => t.status === 'used').length / Math.max(1, live(e).length)) * 100) : null })).sort((a, b) => b.e.date.localeCompare(a.e.date));
    el.innerHTML = pageHead('Raporlar', 'Etkinlik bazlı hasılat, doluluk ve katılım') + `<div class="grid g4 mb">${kpi('Toplam hasılat', money(sum(rows, (r) => r.rev)), 'wallet', 'ok')}${kpi('Satılan bilet', num(sum(rows, (r) => r.n)), 'ticket')}${kpi('Ort. doluluk', '%' + Math.round(sum(rows, (r) => r.o) / rows.length), 'percent', 'info')}${kpi('İndirim kodlu', num(all.filter((t) => t.discount).length), 'tag', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Türe göre hasılat</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(rows, (r) => r.e.cat)).map(([label, v]) => ({ label, value: sum(v, (r) => r.rev) })), { format: money, size: 130 })}</div></div><div class="card"><div class="card-h"><h3>Satış kanalı</h3></div><div class="card-b">${chart.donut([{ label: 'Online', value: all.filter((t) => t.channel === 'online').length }, { label: 'Gişe', value: all.filter((t) => t.channel === 'gise').length }], { size: 130 })}</div></div></div>
      <div class="card">${table({ rows, columns: [{ label: 'Etkinlik', render: (r) => `<b>${esc(r.e.name)}</b><div class="small faint">${NS.date(r.e.date)} · ${esc(ven(r.e.venue).name)}</div>` }, { label: 'Bilet', cls: 'right', key: 'n' }, { label: 'Doluluk', cls: 'right', render: (r) => badge('%' + r.o, r.o > 80 ? 'ok' : r.o > 50 ? 'warn' : 'err') }, { label: 'Katılım', cls: 'right', render: (r) => (r.show === null ? '-' : '%' + r.show) }, { label: 'İade', cls: 'right', render: (r) => `${r.ref}${r.refAmt ? `<div class="small faint">${money(r.refAmt)}</div>` : ''}` }, { label: 'Hizmet bedeli', cls: 'right', render: (r) => money(r.fee) }, { label: 'Bilet hasılatı', cls: 'right', render: (r) => `<b>${money(r.rev)}</b>` }] })}</div>`;
  }

  const ROLES = { admin: 'Organizatör', gise: 'Gişe', kapi: 'Kapı görevlisi' };
  const app = NS.shell({
    id: 'bilet', integrations: ['payment','sms','email','printer','barcode','pos','webhook','backup'], name: 'Bilet', tagline: 'Etkinlik & Biletleme', icon: 'ticket', accent: '#db2777', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Satış' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['gise'] }, { id: 'etkinlikler', label: 'Etkinlikler', icon: 'calendar', roles: ['gise'] }, { id: 'gise', label: 'Gişe', icon: 'ticket', roles: ['gise'] }, { id: 'kapi', label: 'Kapı Kontrol', icon: 'qr' }, { id: 'biletler', label: 'Biletler & İade', icon: 'search', roles: ['gise'] }, { sec: 'Yönetim' }, { id: 'salonlar', label: 'Salonlar', icon: 'building', roles: ['admin'] }, { id: 'kodlar', label: 'İndirim Kodları', icon: 'tag', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    titles: {},
    routes: {
      ozet: dashboard, etkinlikler: eventsPage, gise: boxPage, kapi: gatePage, biletler: ticketsPage, salonlar: venuesPage, raporlar: reportsPage,
      kodlar: (el, p, a) => NS.crud(el, a, { col: 'codes', title: 'İndirim Kodları', single: 'Kod', addLabel: 'Yeni kod', emptyIcon: 'tag', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'pct', label: 'İndirim %', type: 'number', required: true }, { name: 'note', label: 'Not (kapıda gösterilir)', full: true }, { name: 'maxUses', label: 'En fazla kullanım (boşsa sınırsız)', type: 'number' }, { name: 'from', label: 'Geçerlilik başlangıcı', type: 'date' }, { name: 'to', label: 'Geçerlilik bitişi', type: 'date' }, { name: 'events', label: 'Yalnızca bu etkinlikler', type: 'select', empty: 'Tüm etkinlikler', options: () => db.all('events', (e) => e.date >= today()).map((e) => ({ value: e.id, label: `${NS.date(e.date)} · ${e.name}` })) }, { name: 'online', label: 'Online satışta kullanılabilir (%100 kodlar hiçbir zaman)', type: 'checkbox' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { active: true, online: true }, beforeSave: (v) => { v.code = v.code.toUpperCase(); }, columns: [{ key: 'code', label: 'Kod', render: (k) => `<b class="mono">${esc(k.code)}</b>` }, { key: 'pct', label: 'İndirim', render: (k) => '%' + k.pct }, { key: 'note', label: 'Not' }, { key: 'uses', label: 'Kullanım', cls: 'right', render: (k) => `${k.uses || 0}${k.maxUses ? ' / ' + k.maxUses : ''}` }, { label: 'Geçerlilik', render: (k) => `<span class="small">${k.from || k.to ? `${k.from ? NS.date(k.from) : '…'} – ${k.to ? NS.date(k.to) : '…'}` : 'Süresiz'}${k.events ? '<br>' + esc(ev(k.events).name) : ''}${k.online === false || k.pct >= 100 ? '<br>Yalnızca gişe' : ''}</span>` }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Satış' }, { name: 'serviceFee', label: 'Online hizmet bedeli (bilet başı ₺)', type: 'number' }, { name: 'refundDays', label: 'İade için son gün (etkinlikten önce)', type: 'number' }, { name: 'resHours', label: 'Online rezervasyon ödeme süresi (saat, boşsa 48 — en geç etkinlikten 2 saat önce)', type: 'number' }, { name: 'feeRefund', label: 'İadede hizmet bedeli de iade edilir', type: 'checkbox' }] }),
    },
  });
  if (NS.currentUser && NS.currentUser.role === 'kapi' && !location.hash.includes('kapi')) app.go('kapi');
  // Ödeme süresi dolan rezervasyonlar koltuğu bırakır (açılışta ve dakikada bir)
  const ex = () => { if (B.expire(db) && ['gise', 'etkinlikler', 'biletler'].includes(app.route) && !document.querySelector('.ns-overlay')) app.refresh(); };
  ex(); setInterval(ex, 60000);
  window.addEventListener('storage', (x) => { if (x.key === db.key) { db.load(); if (['kapi', 'gise'].includes(app.route) && !document.querySelector('.ns-overlay')) app.refresh(); } });
})();
