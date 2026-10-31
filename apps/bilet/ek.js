/* NEBSOFT Bilet (ek) — davetiye ve kontenjan, salon düzenleyici, gün sonu, organizatör hesap kesimi, bekleme listesi, canlı giriş ekranı.
   app.js açılışta B.ctx'i doldurur: { db, S, ev, ven, live, paidOf, fee, TST } */
(function () {
  'use strict';
  const { esc, $, on, icon, money, num, toast, modal, confirm, formModal, table, badge, kpi, pageHead, sum, today } = NS;
  const B = window.BILET;
  const X = () => B.ctx;
  const who = () => (NS.currentUser ? NS.currentUser.name : '');
  const ORG = ['Protokol', 'Sponsor', 'Basın', 'Sanatçı', 'Personel'];
  const rev = (ts) => sum(ts, (t) => t.paid);

  // ---------- Kontenjan: koltuklar gruba ayrılır, satışa kapanır; davetiye bu koltuklardan verilir ----------
  function blocksModal(app, e) {
    const { db, ven } = X(); const v = ven(e.venue); const bl = { ...(e.blocks || {}) };
    if (v.type !== 'seated') return toast('Genel giriş salonunda koltuk kontenjanı yok; davetiye doğrudan kategoriden verilir', 'warn');
    let grp = ORG[0];
    modal({
      title: `${e.name} — kontenjan`, size: 'xl', body: '<div id="bk"></div>',
      onOpen: (b) => {
        const draw = () => { $('#bk', b).innerHTML = `<div class="row mb"><select class="input" id="gr" style="max-width:220px">${ORG.map((g) => `<option ${g === grp ? 'selected' : ''}>${g}</option>`).join('')}</select><span class="small muted grow">Koltuğa tıklayın: seçili gruba ayrılır, tekrar tıklayınca satışa döner. Satılmış koltuk ayrılamaz.</span></div>${B.seatMap(db, { ...e, blocks: bl }, v, { editor: true })}<div class="row mt">${ORG.map((g) => { const n = Object.values(bl).filter((x) => x === g).length; return n ? badge(`${g}: ${n}`, 'acc') : ''; }).join('')}</div>`; $('#gr', b).onchange = (x) => { grp = x.target.value; }; };
        on(b, 'click', '[data-seat]', (x, s) => { const id = s.dataset.seat; if (bl[id]) delete bl[id]; else bl[id] = grp; draw(); }); draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close) => { e.blocks = bl; db.log('Kontenjan', `${e.name} · ${Object.keys(bl).length} koltuk`); db.save(); close(); toast('Kontenjan kaydedildi', 'ok'); app.refresh(); } }],
    });
  }
  // Toplu davetiye: her satır "Ad Soyad; Telefon". Koltuk önce grubun kontenjanından, yoksa boş koltuktan seçilir
  async function inviteModal(app, e) {
    const { db, ven } = X(); const v = ven(e.venue); const cats = Object.entries(v.cats).map(([value, label]) => ({ value, label }));
    const f = await formModal({ title: `${e.name} — davetiye`, size: 'wide', submitLabel: 'Davetiyeleri oluştur', fields: [{ name: 'group', label: 'Grup', type: 'select', options: ORG }, { name: 'cat', label: 'Kategori', type: 'select', options: cats }, { name: 'list', label: 'Davetliler (her satır: Ad Soyad; Telefon)', type: 'textarea', full: true, required: true }, { name: 'sms', label: 'Davetlilere SMS gönder', type: 'checkbox', full: true }] });
    if (!f) return; const rows = String(f.list).split('\n').map((l) => l.split(/[;,\t]/).map((x) => x.trim())).filter((r) => r[0]); if (!rows.length) return toast('Davetli yazın', 'err');
    let pool = []; if (v.type === 'seated') { const sold = B.sold(db, e.id); const bl = B.blocked(e); const free = B.seats(v).filter((s) => !sold.has(s.id)); pool = [...free.filter((s) => bl[s.id] === f.group), ...free.filter((s) => !bl[s.id] && s.cat === f.cat)]; } else if (B.catLeft(db, e, v, f.cat) < rows.length) return toast(`${v.cats[f.cat]} kategorisinde ${B.catLeft(db, e, v, f.cat)} yer kaldı`, 'err');
    if (v.type === 'seated' && pool.length < rows.length) return toast(`Yeterli boş koltuk yok (${pool.length} koltuk, ${rows.length} davetli)`, 'err');
    const order = db.nextNo('orders', 'D'); const made = rows.map(([name, phone], i) => db.insert('tickets', { code: B.code(), event: e.id, seat: pool[i] ? pool[i].id : null, cat: pool[i] ? pool[i].cat : f.cat, price: 0, paid: 0, fee: 0, discount: null, ttype: 'Davetiye', invite: f.group, buyer: { name, phone: phone || '' }, channel: 'davet', pay: 'davet', cashier: who(), at: new Date().toISOString(), status: 'valid', order }, true));
    if (e.blocks) { made.forEach((t) => { if (t.seat) delete e.blocks[t.seat]; }); }
    db.log('Davetiye', `${e.name} · ${made.length} ${f.group}`); db.save(); toast(`${made.length} davetiye oluşturuldu`, 'ok');
    if (f.sms) NS.smsBatch(db, made.filter((t) => t.buyer.phone).map((t) => ({ to: t.buyer.phone, name: t.buyer.name, text: `${X().S().bizName}: "${e.name}" davetiyeniz. ${NS.date(e.date)} ${e.time}${t.seat ? ', koltuk ' + t.seat : ''}. Giriş kodu: ${t.code}` })), 'davetiye');
    X().printTickets(made); app.refresh();
  }

  // ---------- Salon düzenleyici ----------
  const usedSeats = (v) => { const { db } = X(); const evs = new Set(db.all('events', (e) => e.venue === v.id && e.date >= today() && e.status !== 'iptal').map((e) => e.id)); return new Set(db.all('tickets', (t) => evs.has(t.event) && t.status !== 'refunded' && t.seat).map((t) => t.seat)); };
  function venueEdit(app, v) {
    const { db } = X(); const closed = new Set(v.closed || []); const used = usedSeats(v);
    modal({
      title: `${v.name} — düzenle`, size: 'xl', body: `<div class="form-grid mb" id="vf">${NS.fieldsHtml([{ name: 'name', label: 'Salon adı', required: true, value: v.name }, { name: 'city', label: 'Şehir', value: v.city }, { name: 'aisles', label: 'Koridor: bu koltuktan sonra (ör. 4, 12)', value: (v.aisles || []).join(', ') }], {})}</div><p class="small muted mb">Koltuğa tıklayın: kapatılır (satışa çıkmaz) veya yeniden açılır. Yaklaşan etkinlikte satılmış koltuk kapatılamaz.</p><div id="sm"></div>`,
      onOpen: (b) => { const draw = () => { const a = String($('[name=aisles]', b).value).split(',').map((x) => Number(x)).filter((x) => x > 0 && x < v.seatsPerRow); $('#sm', b).innerHTML = B.seatMap(db, { id: '-', prices: {} }, { ...v, closed: [...closed], aisles: a }, { editor: true }) + `<div class="small muted mt">${v.rows.length * v.seatsPerRow - closed.size} koltuk açık · ${closed.size} kapalı</div>`; }; on(b, 'click', '[data-seat]', (x, s) => { const id = s.dataset.seat; if (closed.has(id)) closed.delete(id); else { if (used.has(id)) return toast(`${id} yaklaşan bir etkinlikte satılmış`, 'err'); closed.add(id); } draw(); }); $('[name=aisles]', b).oninput = draw; draw(); },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => { if (!NS.validate($('#vf', b))) return; const x = NS.readForm($('#vf', b)); db.update('venues', v.id, { name: x.name, city: x.city, aisles: String(x.aisles).split(',').map((n) => Number(n)).filter((n) => n > 0 && n < v.seatsPerRow), closed: [...closed] }); close(); toast('Salon kaydedildi', 'ok'); app.refresh(); } }],
    });
  }
  async function gaVenue(app) {
    const { db } = X(); const x = await formModal({ title: 'Yeni genel giriş salonu', fields: [{ name: 'name', label: 'Salon adı', required: true }, { name: 'city', label: 'Şehir', value: 'İstanbul' }, { name: 'cats', label: 'Bölümler (Ad:kapasite, virgülle)', full: true, required: true, value: 'Genel alan:500, Loca:40' }] }); if (!x) return;
    const cats = {}; const capacity = {}; String(x.cats).split(',').forEach((p, i) => { const [n, c] = p.split(':').map((s) => s.trim()); if (n && Number(c) > 0) { const k = 'c' + (i + 1); cats[k] = n; capacity[k] = Number(c); } });
    if (!Object.keys(cats).length) return toast('En az bir bölüm ve kapasite yazın', 'err'); db.insert('venues', { name: x.name, city: x.city, type: 'ga', cats, capacity }); toast('Salon oluşturuldu', 'ok'); app.refresh();
  }

  // ---------- Bekleme listesi ----------
  const waitOf = (e) => X().db.all('waitlist', (w) => w.event === e.id && w.status !== 'iptal');
  function waitCard(e) { const l = waitOf(e); return `<div class="card mt"><div class="card-h"><h3>${icon('clock')} Bekleme listesi (${l.filter((w) => w.status === 'bekliyor').length})</h3><span class="grow"></span>${l.some((w) => w.status === 'bekliyor') ? '<button class="btn sm primary" id="wn">Yer açıldı, sıradakilere haber ver</button>' : ''}</div>${table({ rows: l.slice().sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(0, 100), empty: 'Bekleyen yok', emptyIcon: 'clock', columns: [{ label: 'Ad', render: (w) => `<b>${esc(w.name)}</b>` }, { label: 'Telefon', render: (w) => esc(w.phone) }, { label: 'Adet', cls: 'right', render: (w) => w.qty || 1 }, { label: 'Kayıt', render: (w) => NS.dt(w.at) }, { label: 'Durum', render: (w) => (w.status === 'haber' ? badge(`Haber verildi ${NS.dt(w.notifiedAt)}`, 'ok') : w.lastTry ? badge(w.lastTry, 'warn') : badge('Bekliyor')) }], actions: [{ icon: 'x', act: 'wx', title: 'Listeden çıkar' }] })}</div>`; }
  function waitBind(el, app, e) {
    const { db, ven, S } = X();
    const wn = $('#wn', el); if (wn) wn.onclick = async () => {
      const v = ven(e.venue); const free = Object.keys(v.cats).reduce((t, c) => t + B.catLeft(db, e, v, c), 0); if (free <= 0) return toast('Şu anda boş yer yok, haber verilemez', 'err');
      const pend = waitOf(e).filter((w) => w.status === 'bekliyor').sort((a, b) => String(a.at).localeCompare(String(b.at))); const take = []; let n = 0; for (const w of pend) { if (n + (w.qty || 1) > free) break; n += w.qty || 1; take.push(w); } if (!take.length) return toast('Sıradaki talep için yeterli yer yok', 'warn');
      if (!(await confirm(`${free} yer boş. Sıradaki ${take.length} kişiye SMS gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return;
      const res = await Promise.all(take.map((w) => NS.smsLog(db, { to: w.phone, name: w.name, text: `${S().bizName}: "${e.name}" (${NS.date(e.date)}) için yer açıldı. Bilet almak için: ${X().onlineUrl()}#/etkinlik/${e.id}` }, true).result.then((r) => ({ w, r }))));
      let ok = 0, test = 0, err = 0; res.forEach(({ w, r }) => { if (r.simulated) { test++; w.lastTry = 'TEST — gönderilmedi'; } else if (r.ok) { ok++; w.status = 'haber'; w.notifiedAt = new Date().toISOString(); delete w.lastTry; } else { err++; w.lastTry = 'Gönderilemedi'; } });
      db.save(); toast([ok && `${ok} kişiye gönderildi`, test && `${test} TEST — gönderilmedi (SMS sağlayıcısı bağlı değil)`, err && `${err} gönderilemedi`].filter(Boolean).join(' · '), err ? 'err' : test ? 'warn' : 'ok'); app.refresh();
    };
    on(el, 'click', '[data-act="wx"]', async (x, b) => { const w = db.get('waitlist', b.dataset.id); if (w && (await confirm(`${w.name} listeden çıkarılsın mı?`))) { w.status = 'iptal'; db.save(); app.refresh(); } });
  }

  // ---------- Raporlar: gün sonu ----------
  function daySales(ymd) {
    const { db, fee } = X(); const inDay = (s) => String(s || '').slice(0, 10) === ymd;
    const sales = db.all('tickets', (t) => t.pay && t.pay !== 'davet' && !t.void && inDay(t.paidAt || t.at)); const refunds = db.all('tickets', (t) => t.refund && inDay(t.refund.at));
    const total = (ts) => sum(ts, (t) => t.paid + fee(t)); const grp = (fn, label) => Object.entries(NS.groupBy(sales, fn)).map(([k, ts]) => ({ id: k, k: label ? label(k) : k, n: ts.length, sum: total(ts) })).sort((a, b) => b.sum - a.sum);
    const refCash = sum(refunds.filter((t) => t.refund.done && t.refund.method === 'nakit'), (t) => t.refund.amount);
    return { sales, refunds, total: total(sales), fee: sum(sales, fee), refTotal: sum(refunds, (t) => t.refund.amount), cash: total(sales.filter((t) => t.pay === 'nakit')), refCash, byCh: grp((t) => t.channel, (k) => ({ online: 'Online', gise: 'Gişe' }[k] || k)), byPay: grp((t) => t.pay, (k) => ({ nakit: 'Nakit', kart: 'Kart', havale: 'Havale / EFT', gise: 'Gişe (online rezervasyon)' }[k] || k)), byCas: grp((t) => t.cashier || 'Kayıt yok'), byType: grp((t) => t.ttype || 'Tam'), byCode: grp((t) => t.discount || 'Kodsuz') };
  }
  function dayTab(host) {
    let ymd = today();
    const box = (title, rows) => `<div class="card"><div class="card-h"><h3>${esc(title)}</h3></div>${table({ rows, empty: 'Satış yok', columns: [{ label: title, render: (r) => esc(r.k) }, { label: 'Bilet', cls: 'right', key: 'n' }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.sum)}</b>` }] })}</div>`;
    const draw = () => { const d = daySales(ymd); host.innerHTML = `<div class="row mb"><input class="input" type="date" id="dy" value="${ymd}" style="max-width:190px"><span class="small muted grow">Satış, ödemenin alındığı güne yazılır. Ödenmemiş rezervasyon ve davetiye dahil değildir.</span><button class="btn" id="ex">${icon('download')} Excel</button></div><div class="grid g4 mb">${kpi('Tahsilat', money(d.total), 'wallet', 'ok', `<div class="small faint">${d.sales.length} bilet</div>`)}${kpi('Hizmet bedeli', money(d.fee), 'tag')}${kpi('İade', money(d.refTotal), 'back', 'err', `<div class="small faint">${d.refunds.length} bilet</div>`)}${kpi('Kasadaki nakit', money(d.cash - d.refCash), 'cash', 'info', `<div class="small faint">nakit ${money(d.cash)} − iade ${money(d.refCash)}</div>`)}</div><div class="grid g2">${box('Kanal', d.byCh)}${box('Ödeme', d.byPay)}${box('Kasiyer', d.byCas)}${box('Bilet türü', d.byType)}${box('İndirim kodu', d.byCode)}</div>`;
      $('#dy', host).onchange = (x) => { ymd = x.target.value || ymd; draw(); }; $('#ex', host).onclick = () => NS.csv('gun-sonu-' + ymd, [...d.byCh.map((r) => ({ ...r, g: 'Kanal' })), ...d.byPay.map((r) => ({ ...r, g: 'Ödeme' })), ...d.byCas.map((r) => ({ ...r, g: 'Kasiyer' })), ...d.byType.map((r) => ({ ...r, g: 'Tür' })), ...d.byCode.map((r) => ({ ...r, g: 'Kod' }))], [{ label: 'Grup', value: (r) => r.g }, { label: 'Değer', value: (r) => r.k }, { label: 'Bilet', value: (r) => r.n }, { label: 'Tutar', value: (r) => r.sum }]); };
    draw();
  }

  // ---------- Organizatör hesap kesimi ----------
  function settleCalc(e) { const { db, paidOf, fee } = X(); const ts = paidOf(e); const all = db.all('tickets', (t) => t.event === e.id && t.refund); const gross = rev(ts); const share = Number(e.share) || 0; const pending = sum(all.filter((t) => !t.refund.done), (t) => t.refund.amount); return { n: ts.filter((t) => t.pay !== 'davet').length, invites: ts.filter((t) => t.pay === 'davet').length, gross, fee: sum(ts, fee), refunded: sum(all, (t) => t.refund.amount), pending, share, org: Math.round(gross * share) / 100, house: Math.round(gross * (100 - share)) / 100 }; }
  const settleDoc = (e, c, s) => ({ title: 'Organizatör hesap kesimi', no: s ? s.no : 'TASLAK', date: s ? s.at : new Date().toISOString(), party: { title: 'Organizatör', name: e.orgName || e.artist || '-' }, info: [['Etkinlik', e.name], ['Tarih', `${NS.date(e.date)} ${e.time}`], ['Salon', X().ven(e.venue).name], ['Satılan bilet', num(c.n)], ['Davetiye', num(c.invites)], ['Organizatör payı', '%' + c.share]], totals: [['Bilet hasılatı', c.gross], ['Hizmet bedeli (ayrı)', c.fee], ['Yapılan iadeler (hasılata dahil değil)', c.refunded], ['İşletmede kalan', c.house], ['Organizatöre ödenecek', c.org, true]], note: [c.pending ? `Ödemesi bekleyen iade: ${money(c.pending)}` : '', 'Vergi, stopaj ve fatura kesintileri bu hesaba dahil değildir.'].filter(Boolean).join('\n') });
  function settleTab(host, app) {
    const { db, S } = X(); const canAct = app.can();
    const draw = () => { const evs = db.all('events', (e) => e.date <= today() || e.status === 'iptal' || db.find('settlements', (s) => s.event === e.id)).sort((a, b) => b.date.localeCompare(a.date)); host.innerHTML = `<div class="card pad mb small">Etkinlik bitince hesap kesilir, tutarlar o anki haliyle saklanır. Pay oranı etkinlik kartından girilir. Vergi ve stopaj hesaplanmaz.</div><div class="card">${table({ rows: evs.slice(0, 200), empty: 'Hesabı kesilecek etkinlik yok', emptyIcon: 'wallet', columns: [{ label: 'Etkinlik', render: (e) => `<b>${esc(e.name)}</b><div class="small faint">${NS.date(e.date)} · ${esc(e.orgName || e.artist || '')}</div>` }, { label: 'Hasılat', cls: 'right', render: (e) => money(settleCalc(e).gross) }, { label: 'Pay', cls: 'right', render: (e) => (e.share ? '%' + e.share : badge('Girilmedi', 'warn')) }, { label: 'Ödenecek', cls: 'right', render: (e) => `<b>${money(settleCalc(e).org)}</b>` }, { label: 'İade bekleyen', cls: 'right', render: (e) => { const p = settleCalc(e).pending; return p ? badge(money(p), 'warn') : '-'; } }, { label: 'Durum', render: (e) => { const s = db.find('settlements', (x) => x.event === e.id); return s ? badge(`${s.no} · ${NS.date(s.at)}`, 'ok') + (s.gross !== settleCalc(e).gross ? `<div>${badge('Sonradan değişti', 'err')}</div>` : '') : badge('Kesilmedi'); } }], actions: [{ icon: 'print', act: 'sp', title: 'Yazdır' }, { label: 'Hesap kes', act: 'sc', show: (e) => canAct && !db.find('settlements', (x) => x.event === e.id) }] })}</div>`; };
    on(host, 'click', '[data-act]', async (x, b) => { const e = db.get('events', b.dataset.id); if (!e) return; const s = db.find('settlements', (y) => y.event === e.id); const c = settleCalc(e);
      if (b.dataset.act === 'sp') return NS.docs.print('hesap-kesimi', settleDoc(e, s ? s.calc : c, s));
      if (!e.share) return toast('Önce etkinlik kartından organizatör payını girin', 'err');
      if (c.pending && !(await confirm(`${money(c.pending)} iade ödemesi bekliyor. Yine de hesap kesilsin mi?`, { ok: 'Hesap kes', danger: false }))) return;
      const rec = db.insert('settlements', { no: 'HK' + db.nextNo('settle'), event: e.id, at: new Date().toISOString(), by: who(), gross: c.gross, calc: c }); db.log('Hesap kesimi', `${e.name} · ${money(c.org)}`); toast(`${rec.no} kesildi`, 'ok'); NS.docs.print('hesap-kesimi', settleDoc(e, c, rec)); draw(); });
    draw(); return S;
  }

  // ---------- Canlı giriş ekranı (TV) ----------
  function livePage(el, p, app) {
    const { db, ev, ven, live } = X();
    const evs = db.all('events', (e) => e.date >= today() && e.status !== 'iptal').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); let id = p || (evs[0] || {}).id;
    const draw = () => {
      if (!id) { el.innerHTML = pageHead('Canlı Giriş') + `<div class="empty">${icon('calendar')}<div>Yaklaşan etkinlik yok</div></div>`; return; }
      const e = ev(id); const v = ven(e.venue); const all = live(e).filter((t) => t.status !== 'reserved'); const inn = all.filter((t) => t.status === 'used' && !t.out); const entered = all.filter((t) => t.status === 'used'); const cap = B.capacity(v); const gates = NS.groupBy(entered, (t) => t.gate || 'Kapı adı yok');
      el.innerHTML = `<div class="tv"><div class="row"><div class="grow"><h1>${esc(e.name)}</h1><div class="muted">${NS.date(e.date)} ${esc(e.time)} · ${esc(v.name)}</div></div><select class="input" id="ev" style="max-width:300px">${evs.map((x) => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${NS.date(x.date)} · ${esc(x.name)}</option>`).join('')}</select><button class="btn" id="fs">${icon('monitor')} Tam ekran</button></div>
        <div class="card pad center"><div class="big">${num(inn.length)}</div><div class="muted">içeride · ${num(all.length)} biletin %${all.length ? Math.round((entered.length / all.length) * 100) : 0} girişi yapıldı · kapasite ${num(cap)}</div><div class="progress mt"><i style="width:${all.length ? Math.min(100, (entered.length / all.length) * 100) : 0}%"></i></div></div>
        <div class="tvg">${Object.entries(gates).map(([g, ts]) => `<div class="card pad center"><div style="font-size:42px;font-weight:800">${num(ts.length)}</div><div class="muted">${esc(g)}</div></div>`).join('') || '<div class="card pad center muted">Henüz giriş yok</div>'}</div>
        <div class="tvg">${Object.entries(v.cats).map(([c, n]) => { const ts = all.filter((t) => t.cat === c); const u = ts.filter((t) => t.status === 'used').length; return `<div class="card pad"><b>${esc(n)}</b><div class="progress mt"><i style="width:${ts.length ? (u / ts.length) * 100 : 0}%"></i></div><div class="small muted mt">${num(u)} / ${num(ts.length)}</div></div>`; }).join('')}</div></div>`;
      if ($('#ev', el)) $('#ev', el).onchange = (x) => { id = x.target.value; draw(); };
      if ($('#fs', el)) $('#fs', el).onclick = () => { const r = el.requestFullscreen && el.requestFullscreen(); if (r && r.catch) r.catch(() => toast('Tam ekran açılamadı', 'warn')); };
    };
    draw(); clearInterval(window.__tvPoll); window.__tvPoll = setInterval(() => { if (app.route !== 'canli') return clearInterval(window.__tvPoll); if (!document.querySelector('.ns-overlay')) { if (!db._dirty && !db._flight) db.load(); draw(); } }, 4000);
  }
  B.ek = { blocksModal, inviteModal, venueEdit, gaVenue, waitCard, waitBind, dayTab, settleTab, livePage, daySales };
})();
