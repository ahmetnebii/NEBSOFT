/* NEBSOFT Otel & Pansiyon — rezervasyon takvimi, ön büro, housekeeping, folyo, fiyat ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;

  function seed(db) {
    db.data._settings = { bizName: 'Mavi Koy Butik Otel', bizPhone: '0252 555 77 88', bizAddress: 'Gümüşlük Mah. Sahil Yolu No:14 Bodrum/Muğla', checkInTime: '14:00', checkOutTime: '12:00', tax: 2 };
    db.data.users = [{ id: 'u1', name: 'Kerem Müdür', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Elif Resepsiyon', role: 'resepsiyon', pin: '1234', active: true }, { id: 'u3', name: 'Hatice Kat Hizmetleri', role: 'kat', pin: '1234', active: true }];
    db.data.types = [{ id: 't1', name: 'Standart Oda', capacity: 2, price: 2200, color: '#0891b2' }, { id: 't2', name: 'Deniz Manzaralı Deluxe', capacity: 2, price: 3400, color: '#2563eb' }, { id: 't3', name: 'Aile Odası', capacity: 4, price: 4200, color: '#16a34a' }, { id: 't4', name: 'Kral Dairesi', capacity: 3, price: 7500, color: '#9333ea' }];
    const rooms = [];
    [[1, ['t1', 't1', 't1', 't1', 't3', 't3']], [2, ['t1', 't2', 't2', 't2', 't2', 't3']], [3, ['t2', 't2', 't2', 't3', 't4', 't4']]].forEach(([fl, ts]) => ts.forEach((t, i) => rooms.push({ id: 'r' + fl + (i + 1), no: `${fl}0${i + 1}`, floor: fl, type: t, hk: pick(['temiz', 'temiz', 'temiz', 'kirli']), note: '' })));
    rooms[7].hk = 'arizali'; rooms[7].note = 'Klima arızalı — teknik servis çağrıldı';
    db.data.rooms = rooms;
    db.data.seasons = [{ id: 'sz1', name: 'Yüksek sezon', from: `${new Date().getFullYear()}-06-15`, to: `${new Date().getFullYear()}-09-15`, pct: 40 }, { id: 'sz2', name: 'Yılbaşı', from: `${new Date().getFullYear()}-12-28`, to: `${new Date().getFullYear() + 1}-01-02`, pct: 60 }];
    const nats = ['TR', 'TR', 'TR', 'TR', 'DE', 'GB', 'RU', 'NL', 'FR'];
    db.data.guests = NS.NAMES.map((n, i) => ({ id: 'g' + i, name: n, phone: NS.phone(), email: NS.slug(n).replace('-', '.') + '@mail.com', idNo: String(rand(10000000000, 99999999999)), nat: pick(nats), note: i % 9 === 0 ? 'VIP — hoş geldin ikramı' : '' }));
    const res = [];
    const free = (room, a, b) => !res.some((r) => r.room === room && r.status !== 'iptal' && r.checkIn < b && a < r.checkOut);
    for (let k = 0; k < 140; k++) {
      const room = pick(rooms); const start = rand(-25, 35); const n = rand(1, 6);
      const ci = iso(addDays(new Date(), start)), co = iso(addDays(new Date(), start + n));
      if (!free(room.id, ci, co) || room.hk === 'arizali') continue;
      const t = db.data.types.find((x) => x.id === room.type);
      const status = co <= today() ? 'cikis' : ci <= today() ? 'konaklama' : Math.random() < 0.12 ? 'opsiyon' : 'rezerve';
      const price = Math.round(t.price * (0.9 + Math.random() * 0.2) / 50) * 50;
      const r = { id: 'rs' + k, no: 'R' + (3000 + k), room: room.id, guest: pick(db.data.guests).id, checkIn: ci, checkOut: co, adults: rand(1, t.capacity), children: rand(0, 1), board: pick(['BB', 'BB', 'HB', 'RO']), source: pick(['Booking.com', 'Booking.com', 'Telefon', 'Web sitesi', 'Expedia', 'Kapıdan', 'Airbnb']), price, status, deposit: 0, folio: [], created: addDays(new Date(), start - rand(3, 30)).toISOString() };
      if (status !== 'rezerve' && status !== 'opsiyon') {
        r.folio.push({ id: NS.uid(), date: ci, desc: `Konaklama ${n} gece`, amount: price * n, type: 'charge' });
        if (Math.random() < 0.5) r.folio.push({ id: NS.uid(), date: ci, desc: 'Minibar', amount: rand(2, 12) * 60, type: 'charge' });
        if (status === 'cikis') r.folio.push({ id: NS.uid(), date: co, desc: 'Ödeme (kart)', amount: sum(r.folio, (f) => f.amount), type: 'payment', method: 'kart' });
        else if (Math.random() < 0.6) r.folio.push({ id: NS.uid(), date: ci, desc: 'Kapora', amount: price, type: 'payment', method: 'havale' });
      } else if (Math.random() < 0.5) { r.deposit = price; }
      res.push(r);
    }
    // Ön büro demosu için bugün giriş ve çıkış yapacak misafirler
    const td = today();
    rooms.filter((rm) => rm.hk !== 'arizali').forEach((rm, i) => {
      if (i % 5 === 0 && free(rm.id, td, iso(addDays(new Date(), 3)))) res.push({ id: 'ra' + i, no: 'R' + (2900 + i), room: rm.id, guest: pick(db.data.guests).id, checkIn: td, checkOut: iso(addDays(new Date(), 3)), adults: 2, children: 0, board: 'BB', source: pick(['Booking.com', 'Telefon']), price: db.data.types.find((x) => x.id === rm.type).price, status: 'rezerve', deposit: 0, folio: [], created: addDays(new Date(), -10).toISOString() });
      else if (i % 5 === 2 && free(rm.id, iso(addDays(new Date(), -2)), td)) { const p = db.data.types.find((x) => x.id === rm.type).price; res.push({ id: 'rd' + i, no: 'R' + (2950 + i), room: rm.id, guest: pick(db.data.guests).id, checkIn: iso(addDays(new Date(), -2)), checkOut: td, adults: 2, children: 0, board: 'HB', source: 'Web sitesi', price: p, status: 'konaklama', deposit: 0, folio: [{ id: NS.uid(), date: iso(addDays(new Date(), -2)), desc: 'Konaklama 2 gece', amount: p * 2, type: 'charge' }, { id: NS.uid(), date: td, desc: 'Restoran', amount: 900, type: 'charge' }], created: addDays(new Date(), -20).toISOString() }); }
    });
    db.data.reservations = res;
    db.data._meta._seq_res = 3200;
    db.data.extras = [{ id: 'e1', name: 'Minibar', price: 60 }, { id: 'e2', name: 'Restoran', price: 450 }, { id: 'e3', name: 'Havalimanı transferi', price: 1200 }, { id: 'e4', name: 'Spa & masaj', price: 1500 }, { id: 'e5', name: 'Çamaşırhane', price: 250 }, { id: 'e6', name: 'Geç çıkış', price: 800 }];
  }
  const db = new NS.DB('otel', seed);
  const S = () => db.settings({});
  const ST = { opsiyon: ['Opsiyonlu', 'warn'], rezerve: ['Rezerve', 'info'], konaklama: ['Konaklıyor', 'ok'], cikis: ['Çıkış yaptı', ''], iptal: ['İptal', 'err'] };
  const HK = { temiz: ['Temiz', 'ok'], kirli: ['Kirli', 'warn'], arizali: ['Arızalı', 'err'] };
  const BOARD = { RO: 'Sadece oda', BB: 'Oda + kahvaltı', HB: 'Yarım pansiyon', FB: 'Tam pansiyon', AI: 'Her şey dahil' };
  const room = (id) => db.get('rooms', id) || { no: '-' };
  const type = (id) => db.get('types', id) || { name: '-', price: 0 };
  const guest = (id) => db.get('guests', id) || { name: '-' };
  const nights = (r) => Math.max(1, daysBetween(r.checkIn, r.checkOut));
  const balance = (r) => sum(r.folio.filter((f) => f.type === 'charge'), (f) => f.amount) - sum(r.folio.filter((f) => f.type === 'payment'), (f) => f.amount);
  const active = () => db.all('reservations', (r) => r.status !== 'iptal');
  const occupiedOn = (d) => active().filter((r) => r.checkIn <= d && d < r.checkOut);
  const seasonPct = (d) => sum(db.all('seasons', (s) => s.from <= d && d <= s.to), (s) => s.pct);
  const suggestPrice = (typeId, ci, co) => { let t = 0; for (let d = ci; d < co; d = iso(addDays(d, 1))) t += type(typeId).price * (1 + seasonPct(d) / 100); return Math.round(t / Math.max(1, daysBetween(ci, co)) / 50) * 50; };
  const clash = (roomId, ci, co, ignore) => active().find((r) => r.id !== ignore && r.room === roomId && r.checkIn < co && ci < r.checkOut);
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- Kanal yöneticisi (OTA) ve KBS ----------
  function channelPage(el, p, app) {
    const tab = p || 'kanal';
    const days = Array.from({ length: 14 }, (_, i) => iso(addDays(new Date(), i)));
    const types = db.all('types');
    const freeOf = (t, d) => db.all('rooms', (r) => r.type === t.id).filter((rm) => !occupiedOn(d).some((x) => x.room === rm.id)).length;
    const srcs = NS.groupBy(active().filter((r) => r.checkIn >= iso(addDays(new Date(), -90))), (r) => r.source);
    const stays = db.all('reservations', (r) => r.status === 'konaklama' || (r.status === 'cikis' && r.checkedOutAt && r.checkedOutAt.slice(0, 10) >= iso(addDays(new Date(), -7))));
    el.innerHTML = pageHead('Kanal & KBS', 'Booking, Expedia, Airbnb senkronu ve Kimlik Bildirim Sistemi', `<button class="btn" id="pull">${icon('download')} OTA rezervasyonlarını çek</button><button class="btn primary" id="push">${icon('send')} Müsaitlik & fiyat gönder</button>`) + `
      <div class="tabs">${[['kanal', 'Kanal yönetimi'], ['kbs', 'KBS bildirimleri']].map(([k, l]) => `<a href="#/kanal/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div><div id="t"></div>`;
    if (tab === 'kanal') $('#t', el).innerHTML = `<div class="grid g3 mb">${Object.entries(srcs).sort((a, b) => b[1].length - a[1].length).slice(0, 6).map(([s, rs]) => kpi(s, `${rs.length} rez.`, 'globe', 'info', `<div class="small faint">${money(sum(rs, (r) => r.price * nights(r)))} · ort. ${r2(sum(rs, nights) / rs.length)} gece</div>`)).join('')}</div>
      <div class="card"><div class="card-h"><h3>14 günlük müsaitlik (OTA’ya gönderilecek)</h3><span class="small muted">${S().otaSync ? 'Son gönderim: ' + NS.dt(S().otaSync) : 'Henüz gönderilmedi'}</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Oda tipi</th>${days.map((d) => `<th style="text-align:center">${NS.date(d).slice(0, 5)}</th>`).join('')}</tr></thead><tbody>${types.map((t) => `<tr><td><b>${esc(t.name)}</b><div class="small faint">${money(t.price)}</div></td>${days.map((d) => { const f = freeOf(t, d); return `<td style="text-align:center"><b style="color:${f ? 'var(--ok)' : 'var(--err)'}">${f}</b><div class="small faint">${money(Math.round(t.price * (1 + seasonPct(d) / 100) / 50) * 50)}</div></td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    else $('#t', el).innerHTML = `<div class="card">${table({ rows: stays.sort((a, b) => b.checkIn.localeCompare(a.checkIn)), empty: 'Konaklayan yok', columns: [{ label: 'Oda', render: (r) => `<b>${room(r.room).no}</b>` }, { label: 'Misafir', render: (r) => `${esc(guest(r.guest).name)}<div class="small faint">${esc(guest(r.guest).idNo || 'Kimlik no yok')} · ${esc(guest(r.guest).nat || '')}${(r.companions || []).length ? ' · +' + r.companions.length + ' kişi' : ''}</div>` }, { label: 'Giriş', render: (r) => NS.date(r.checkIn) }, { label: 'Çıkış', render: (r) => NS.date(r.checkOut) }, { label: 'KBS giriş', render: (r) => (r.kbs && r.kbs.giris ? badge(r.kbs.giris, r.kbs.giris === 'hata' ? 'err' : 'ok') : badge('Bildirilmedi', 'warn')) }, { label: 'KBS çıkış', render: (r) => (r.status !== 'cikis' ? '-' : r.kbs && r.kbs.cikis ? badge(r.kbs.cikis, r.kbs.cikis === 'hata' ? 'err' : 'ok') : badge('Bildirilmedi', 'warn')) }], actions: [{ label: 'Bildir', act: 'kb', show: (r) => !(r.kbs && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris']) || r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] === 'hata' }] })}<div class="pad"><button class="btn" id="kball">${icon('send')} Bekleyenlerin tümünü bildir</button></div></div>`;
    $('#push', el).onclick = async () => { const payload = types.map((t) => ({ type: t.name, days: days.map((d) => ({ date: d, free: freeOf(t, d), price: Math.round(t.price * (1 + seasonPct(d) / 100) / 50) * 50 })) })); const r = await NS.integ.call('kanal', 'musaitlik-fiyat', { rooms: payload }); if (r && r.ok) { db.saveSettings({ otaSync: new Date().toISOString() }); app.refresh(); } };
    $('#pull', el).onclick = async () => {
      const r = await NS.integ.call('kanal', 'rezervasyon-cek', { since: S().otaPull || iso(addDays(new Date(), -1)) }); if (!r || !r.ok) return;
      let list = r.data && Array.isArray(r.data.reservations) ? r.data.reservations : [];
      if (r.simulated) { const t = pick(types); const ci = iso(addDays(new Date(), rand(3, 20))); const co = iso(addDays(ci, rand(1, 4))); const rm = db.all('rooms', (x) => x.type === t.id).find((x) => !clash(x.id, ci, co)); list = rm ? [{ ota: pick(['Booking.com', 'Expedia', 'Airbnb']), otaNo: String(rand(1e9, 9e9)), guest: pick(['Anna Müller', 'John Smith', 'Elif Kara', 'Marco Rossi']), roomType: t.name, checkIn: ci, checkOut: co, adults: 2, price: Math.round(t.price * 1.1), roomId: rm.id }] : []; }
      let n = 0; list.forEach((x) => { if (db.find('reservations', (y) => y.ota === x.otaNo)) return; let g = db.find('guests', (y) => y.name === x.guest); if (!g) g = db.insert('guests', { name: x.guest, phone: '', nat: '' }, true); const rmId = x.roomId || (db.all('rooms', (y) => type(y.type).name === x.roomType).find((y) => !clash(y.id, x.checkIn, x.checkOut)) || {}).id; if (!rmId) return; db.insert('reservations', { no: 'R' + db.nextNo('res'), room: rmId, guest: g.id, checkIn: x.checkIn, checkOut: x.checkOut, adults: x.adults || 2, children: 0, board: 'BB', source: x.ota, price: x.price, status: 'rezerve', deposit: 0, folio: [], ota: x.otaNo, created: new Date().toISOString() }, true); n++; });
      db.saveSettings({ otaPull: new Date().toISOString() }); db.save(); toast(`${n} yeni OTA rezervasyonu alındı`, n ? 'ok' : ''); app.refresh();
    };
    on(el, 'click', '[data-act=kb]', async (e, b) => { const r = db.get('reservations', b.dataset.id); await kbsSend(r, r.status === 'cikis' ? 'cikis' : 'giris'); app.refresh(); });
    const ka = $('#kball', el); if (ka) ka.onclick = async () => { const pend = stays.filter((r) => !(r.kbs && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] !== 'hata')); for (const r of pend) await kbsSend(r, r.status === 'cikis' ? 'cikis' : 'giris'); toast(`${pend.length} bildirim gönderildi`, 'ok'); app.refresh(); };
  }

  // ---------- Rezervasyon formu ----------
  async function resForm(app, rec = {}) {
    const isNew = !rec.id;
    const v = { checkIn: today(), checkOut: iso(addDays(new Date(), 2)), adults: 2, children: 0, board: 'BB', source: 'Telefon', status: 'rezerve', ...rec };
    modal({
      title: isNew ? 'Yeni Rezervasyon' : `Rezervasyon ${rec.no}`, size: 'wide',
      body: `<div class="form-grid">
        <div class="field full"><label>Misafir *</label><div class="row nw"><select class="input" id="fg"><option value="">Seçin...</option>${db.all('guests').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((g) => `<option value="${g.id}" ${g.id === v.guest ? 'selected' : ''}>${esc(g.name)} · ${esc(g.phone)}</option>`).join('')}</select><button class="btn" id="fgn">${icon('plus')} Yeni misafir</button></div></div>
        <div class="field"><label>Giriş *</label><input class="input" type="date" id="fci" value="${v.checkIn}"></div><div class="field"><label>Çıkış *</label><input class="input" type="date" id="fco" value="${v.checkOut}"></div>
        <div class="field"><label>Oda * <span class="faint" id="fav"></span></label><select class="input" id="fr"></select></div>
        <div class="field"><label>Gecelik fiyat (₺) <span class="faint" id="fsg"></span></label><input class="input" type="number" id="fp" value="${v.price || ''}"></div>
        <div class="field"><label>Yetişkin</label><input class="input" type="number" id="fa" value="${v.adults}"></div><div class="field"><label>Çocuk</label><input class="input" type="number" id="fch" value="${v.children}"></div>
        <div class="field"><label>Pansiyon</label><select class="input" id="fb">${Object.entries(BOARD).map(([k, x]) => `<option value="${k}" ${k === v.board ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Kaynak</label><select class="input" id="fs">${['Telefon', 'Web sitesi', 'Booking.com', 'Expedia', 'Airbnb', 'Kapıdan', 'Acente'].map((x) => `<option ${x === v.source ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Durum</label><select class="input" id="fst">${['opsiyon', 'rezerve', 'konaklama'].map((k) => `<option value="${k}" ${k === v.status ? 'selected' : ''}>${ST[k][0]}</option>`).join('')}</select></div>
        <div class="field"><label>Kapora (₺)</label><input class="input" type="number" id="fd" value="${v.deposit || 0}"></div>
        <div class="field full"><label>Not</label><input class="input" id="fn" value="${esc(v.note || '')}"></div>
        <div class="full card pad" id="fsum" style="background:var(--surface-2)"></div></div>`,
      onOpen: (b) => {
        const fill = () => {
          const ci = $('#fci', b).value, co = $('#fco', b).value;
          const cur = $('#fr', b).value || v.room;
          const rooms = db.all('rooms').map((r) => ({ r, busy: !!clash(r.id, ci, co, v.id) }));
          $('#fr', b).innerHTML = rooms.map(({ r, busy }) => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''} ${busy && r.id !== cur ? 'disabled' : ''}>${r.no} · ${esc(type(r.type).name)}${busy ? ' (dolu)' : ''}${r.hk === 'arizali' ? ' (arızalı)' : ''}</option>`).join('');
          if (!$('#fr', b).value || clash($('#fr', b).value, ci, co, v.id)) {
            const pref = rooms.find((x) => !x.busy && x.r.type === room(cur).type && x.r.hk !== 'arizali') || rooms.find((x) => !x.busy && x.r.hk !== 'arizali');
            if (pref) { $('#fr', b).value = pref.r.id; toast(`Seçilen oda dolu, ${pref.r.no} önerildi`); }
          }
          $('#fav', b).textContent = `(${rooms.filter((x) => !x.busy).length} boş)`;
          const sg = suggestPrice(room($('#fr', b).value).type, ci, co);
          $('#fsg', b).textContent = `öneri ${money(sg)}`;
          if (!$('#fp', b).value || $('#fp', b).dataset.auto) { $('#fp', b).value = sg; $('#fp', b).dataset.auto = '1'; }
          summ();
        };
        const summ = () => { const n = Math.max(1, daysBetween($('#fci', b).value, $('#fco', b).value)); const p = Number($('#fp', b).value) || 0; $('#fsum', b).innerHTML = `<div class="row between"><span>${n} gece × ${money(p)}</span><b style="font-size:18px">${money(n * p)}</b></div>${seasonPct($('#fci', b).value) ? `<div class="small" style="color:var(--warn)">${icon('sun')} Sezon fiyatı uygulanıyor (+%${seasonPct($('#fci', b).value)})</div>` : ''}`; };
        $('#fci', b).onchange = () => { if ($('#fco', b).value <= $('#fci', b).value) $('#fco', b).value = iso(addDays($('#fci', b).value, 1)); fill(); };
        $('#fco', b).onchange = fill; $('#fr', b).onchange = () => { $('#fp', b).dataset.auto = '1'; fill(); };
        $('#fp', b).oninput = () => { delete $('#fp', b).dataset.auto; summ(); };
        $('#fgn', b).onclick = async () => { const g = await formModal({ title: 'Yeni misafir', fields: GUEST_FIELDS, values: { nat: 'TR' } }); if (g) { const n = db.insert('guests', g); $('#fg', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)}</option>`); $('#fg', b).value = n.id; } };
        if (v.id) $('#fp', b).value = v.price; else $('#fp', b).dataset.auto = '1';
        fill();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: isNew ? 'Rezervasyonu oluştur' : 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
          const d = { guest: $('#fg', b).value, room: $('#fr', b).value, checkIn: $('#fci', b).value, checkOut: $('#fco', b).value, price: Number($('#fp', b).value) || 0, adults: Number($('#fa', b).value) || 1, children: Number($('#fch', b).value) || 0, board: $('#fb', b).value, source: $('#fs', b).value, status: $('#fst', b).value, deposit: Number($('#fd', b).value) || 0, note: $('#fn', b).value };
          if (!d.guest) return toast('Misafir seçin', 'err');
          if (d.checkOut <= d.checkIn) return toast('Çıkış tarihi girişten sonra olmalı', 'err');
          const c = clash(d.room, d.checkIn, d.checkOut, v.id); if (c) return toast(`Oda dolu: ${guest(c.guest).name} (${NS.date(c.checkIn)}-${NS.date(c.checkOut)})`, 'err');
          if (isNew) { const r = db.insert('reservations', { ...d, no: db.nextNo('res', 'R'), folio: [] }); if (d.deposit) r.folio.push({ id: NS.uid(), date: today(), desc: 'Kapora', amount: d.deposit, type: 'payment', method: 'havale' }); db.log('Rezervasyon', `${r.no} · ${guest(d.guest).name}`); db.save(); }
          else db.update('reservations', v.id, d);
          close(); toast('Kaydedildi', 'ok'); app.refresh();
        },
      }],
    });
  }
  function resDetail(app, r) {
    const g = guest(r.guest), rm = room(r.room), bal = balance(r);
    modal({
      title: `${r.no} · ${g.name}`, size: 'wide',
      body: `<div class="grid g2"><div class="col">
          <div class="row">${badge(ST[r.status][0], ST[r.status][1])} ${badge(r.source, 'acc')} ${g.note ? badge(g.note, 'warn') : ''}</div>
          <div class="list-item"><span class="grow muted">Oda</span><b>${rm.no} · ${esc(type(rm.type).name)}</b></div>
          <div class="list-item"><span class="grow muted">Tarih</span><b>${NS.date(r.checkIn)} → ${NS.date(r.checkOut)} (${nights(r)} gece)</b></div>
          <div class="list-item"><span class="grow muted">Kişi</span><b>${r.adults} yetişkin${r.children ? `, ${r.children} çocuk` : ''}</b></div>
          <div class="list-item"><span class="grow muted">Pansiyon</span><b>${BOARD[r.board]}</b></div>
          <div class="list-item"><span class="grow muted">Konaklama bedeli</span><b>${money(r.price * nights(r))}</b></div>
          <div class="list-item"><span class="grow muted">Misafir</span><span>${esc(g.phone)} · ${esc(g.nat || '')}</span></div>
          ${r.note ? `<div class="list-item"><span class="grow muted">Not</span><span>${esc(r.note)}</span></div>` : ''}
        </div><div><h3 class="mb">Folyo</h3>${r.folio.length ? r.folio.map((f) => `<div class="list-item small"><span class="grow">${esc(f.desc)} <span class="faint">${NS.date(f.date)}</span></span><b style="color:${f.type === 'payment' ? 'var(--ok)' : 'inherit'}">${f.type === 'payment' ? '-' : ''}${money(f.amount)}</b></div>`).join('') : '<div class="faint small">Folyo boş (giriş yapılınca konaklama bedeli eklenir)</div>'}
          <div class="list-item"><b class="grow">Bakiye</b><b style="font-size:18px;color:${bal > 0 ? 'var(--err)' : 'var(--ok)'}">${money(bal)}</b></div>
          ${r.status === 'konaklama' ? `<div class="row mt"><button class="btn sm" data-x="charge">${icon('plus')} Harcama ekle</button><button class="btn sm" data-x="pay">${icon('cash')} Ödeme al</button><button class="btn sm" data-x="pbx">${icon('phone')} Santral</button><button class="btn sm" data-x="card">${icon('key')} Kart</button></div>` : ''}
          <div class="row mt small">${r.kbs ? Object.entries(r.kbs).map(([k, v]) => badge(`KBS ${k}: ${v}`, v === 'hata' ? 'err' : 'ok')).join(' ') : r.status === 'konaklama' ? badge('KBS bildirimi yok', 'warn') : ''} ${r.keycard ? badge('Kart ' + r.keycard, 'info') : ''} ${r.ebelge ? badge(r.ebelge.type + ' ' + r.ebelge.no, 'ok') : ''} ${r.ota ? badge('OTA ' + r.ota, 'acc') : ''}</div></div></div>`,
      actions: [
        ...(['rezerve', 'opsiyon'].includes(r.status) ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { c(); if (await confirm('Rezervasyon iptal edilsin mi?')) { r.status = 'iptal'; db.log('İptal', r.no); db.save(); app.refresh(); } } }, { label: 'Giriş yap (check-in)', cls: 'ok', icon: 'key', onClick: (c) => { c(); checkIn(app, r); } }] : []),
        ...(r.status === 'konaklama' ? [{ label: 'Çıkış yap (check-out)', cls: 'primary', icon: 'logout', onClick: (c) => { c(); checkOut(app, r); } }] : []),
        { label: 'Folyo yazdır', icon: 'print', onClick: () => printFolio(r) },
        ...(r.status !== 'cikis' ? [{ label: 'Düzenle', icon: 'edit', onClick: (c) => { c(); resForm(app, r); } }] : []),
      ],
      onOpen: (b, close) => on(b, 'click', '[data-x]', async (e, t) => {
        close();
        if (t.dataset.x === 'charge') {
          const v = await formModal({ title: 'Harcama ekle', fields: [{ name: 'item', label: 'Kalem', type: 'select', options: db.all('extras').map((x) => ({ value: x.id, label: `${x.name} (${money(x.price)})` })).concat([{ value: '', label: 'Diğer' }]) }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }, { name: 'desc', label: 'Açıklama (Diğer için)' }, { name: 'amount', label: 'Tutar (Diğer için)', type: 'number' }] });
          if (!v) return;
          const x = db.get('extras', v.item);
          r.folio.push({ id: NS.uid(), date: today(), desc: x ? `${x.name}${v.qty > 1 ? ' ×' + v.qty : ''}` : v.desc || 'Ekstra', amount: x ? x.price * (v.qty || 1) : v.amount || 0, type: 'charge' });
          db.save(); resDetail(app, r);
        } else if (t.dataset.x === 'pay') { await takePayment(r); resDetail(app, r); }
        else if (t.dataset.x === 'pbx') { const x = NS.integ && (await NS.integ.call('santral', 'cagri-listesi', { room: room(r.room).no, from: r.checkedInAt })); if (x && x.ok) { const calls = x.data && Array.isArray(x.data.calls) ? x.data.calls : x.simulated ? [{ to: '0532 ••• 41 18', min: rand(2, 9) }] : []; const tariff = Number((NS.integ.cfg('santral') || {}).tariff) || 4; calls.forEach((cl) => r.folio.push({ id: NS.uid(), date: today(), desc: `Telefon ${cl.to} (${cl.min} dk)`, amount: r2(cl.min * tariff), type: 'charge' })); db.save(); toast(`${calls.length} görüşme folyoya aktarıldı`, 'ok'); } resDetail(app, r); }
        else if (t.dataset.x === 'card') { const n = await NS.prompt('Kaç kart kodlansın?', '1', { title: 'Oda kartı', type: 'number' }); if (n && NS.integ) { const x = await NS.integ.call('kapikilit', 'kart-kodla', { room: room(r.room).no, to: r.checkOut, count: Number(n) }); if (x && x.ok) { r.keycard = x.ref; db.save(); } } resDetail(app, r); }
      }),
    });
  }
  async function takePayment(r) {
    const v = await formModal({ title: 'Ödeme al', fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: Math.max(0, balance(r)), required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: [{ value: 'kart', label: 'Kredi kartı' }, { value: 'nakit', label: 'Nakit' }, { value: 'havale', label: 'Havale' }, { value: 'doviz', label: 'Döviz' }] }] });
    if (v && v.amount > 0 && v.method === 'kart' && NS.integ) { const c = await NS.integ.cardPayment(v.amount); if (!c.ok) return toast('Kart ödemesi alınamadı: ' + (c.error || ''), 'err'); }
    if (v && v.amount > 0) { r.folio.push({ id: NS.uid(), date: today(), desc: `Ödeme (${v.method})`, amount: v.amount, type: 'payment', method: v.method }); db.save(); toast('Ödeme alındı', 'ok'); }
  }
  async function checkIn(app, r) {
    const rm = room(r.room);
    if (rm.hk !== 'temiz' && !(await confirm(`Oda ${rm.no} şu an "${HK[rm.hk][0]}". Yine de giriş yapılsın mı?`, { ok: 'Giriş yap', danger: false }))) return;
    const g = guest(r.guest);
    const on2 = (k) => NS.integ && NS.integ.isOn(k);
    const v = await formModal({ title: `Check-in · ${g.name}`, fields: [{ name: 'idNo', label: 'TC kimlik / pasaport no', required: true }, { name: 'nat', label: 'Uyruk' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'phone', label: 'Telefon' }, { name: 'plate', label: 'Araç plakası' }, { name: 'others', label: 'Diğer konaklayanlar (ad soyad ; kimlik no — her satıra bir kişi)', type: 'textarea', full: true }, { name: 'kbs', label: 'KBS’ye giriş bildirimi yap', type: 'checkbox', value: on2('kbs') }, { name: 'card', label: 'Oda kartı kodla', type: 'checkbox', value: on2('kapikilit') }, { name: 'cards', label: 'Kart adedi', type: 'number', value: Math.max(1, r.adults || 1) }], values: g, submitLabel: 'Girişi tamamla' });
    if (!v) return;
    Object.assign(g, { idNo: v.idNo, nat: v.nat, phone: v.phone, birth: v.birth });
    r.status = 'konaklama'; r.checkedInAt = new Date().toISOString(); r.plate = v.plate;
    r.companions = String(v.others || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const [name, id] = x.split(';').map((y) => (y || '').trim()); return { name, id }; });
    if (!r.folio.some((f) => f.desc.startsWith('Konaklama'))) r.folio.unshift({ id: NS.uid(), date: r.checkIn, desc: `Konaklama ${nights(r)} gece × ${money(r.price)}`, amount: r.price * nights(r), type: 'charge' });
    db.log('Check-in', `${rm.no} · ${g.name}`); db.save(); toast(`Oda ${rm.no} — hoş geldiniz ${g.name}`, 'ok');
    if (v.kbs) kbsSend(r, 'giris');
    if (v.card && NS.integ) NS.integ.call('kapikilit', 'kart-kodla', { room: rm.no, from: r.checkIn + 'T' + (S().checkInTime || '14:00'), to: r.checkOut + 'T' + (S().checkOutTime || '12:00'), count: Number(v.cards) || 1, guest: g.name }).then((x) => { if (x && x.ok) { r.keycard = x.ref; db.save(); } });
    app.refresh();
  }
  // KBS (Emniyet / Jandarma) bildirimi: giriş, çıkış ve oda değişikliği
  async function kbsSend(r, kind) {
    if (!NS.integ) return;
    const g = guest(r.guest);
    const res = await NS.integ.call('kbs', kind === 'giris' ? 'giris-bildirimi' : 'cikis-bildirimi', { no: r.no, room: room(r.room).no, guests: [{ name: g.name, id: g.idNo, nat: g.nat, birth: g.birth }, ...(r.companions || [])], checkIn: r.checkIn, checkOut: r.checkOut, plate: r.plate });
    r.kbs = r.kbs || {}; r.kbs[kind] = res && res.ok ? res.ref : 'hata'; db.save();
    return res;
  }
  async function checkOut(app, r) {
    if (balance(r) > 0) { toast(`Açık bakiye: ${money(balance(r))} — önce ödeme alın`, 'err'); await takePayment(r); if (balance(r) > 0) return; }
    r.status = 'cikis'; r.checkedOutAt = new Date().toISOString();
    if (r.checkOut > today()) r.checkOut = today() > r.checkIn ? today() : r.checkOut;
    room(r.room).hk = 'kirli';
    db.log('Check-out', `${room(r.room).no} · ${guest(r.guest).name}`); db.save(); toast('Çıkış tamamlandı, oda temizliğe alındı', 'ok');
    if (NS.integ && (NS.integ.isOn('kbs') || (r.kbs && r.kbs.giris))) kbsSend(r, 'cikis');
    if (r.keycard && NS.integ) NS.integ.call('kapikilit', 'kart-iptal', { room: room(r.room).no, ref: r.keycard }, { silent: true });
    if (NS.integ && (await confirm('Konaklama faturası e-Fatura / e-Arşiv olarak kesilsin mi?', { ok: 'Fatura kes', danger: false, title: 'Fatura' }))) { const g = guest(r.guest); const tot = sum(r.folio.filter((f) => f.type === 'charge'), (f) => f.amount); const x = await NS.integ.sendEInvoice({ buyer: g.name, buyerVkn: g.taxNo || g.idNo, no: r.no, total: tot, vat: r2(tot - tot / 1.1), lines: r.folio.filter((f) => f.type === 'charge').map((f) => ({ name: f.desc, total: f.amount })) }); if (x.ok) { r.ebelge = { type: x.type, no: x.no }; db.save(); } }
    printFolio(r); app.refresh();
  }
  function printFolio(r) {
    const s = S(), g = guest(r.guest);
    NS.printHtml(`<div class="doc"><h2>${esc(s.bizName)}</h2><div>${esc(s.bizAddress)} · ${esc(s.bizPhone)}</div><hr><h3>MİSAFİR FOLYOSU — ${esc(r.no)}</h3><div>Misafir: <b>${esc(g.name)}</b> · ${esc(g.idNo || '')}</div><div>Oda ${esc(room(r.room).no)} · ${NS.date(r.checkIn)} – ${NS.date(r.checkOut)} (${nights(r)} gece) · ${BOARD[r.board]}</div><br>
      <table><tr><th>Tarih</th><th>Açıklama</th><th style="text-align:right">Borç</th><th style="text-align:right">Alacak</th></tr>${r.folio.map((f) => `<tr><td>${NS.date(f.date)}</td><td>${esc(f.desc)}</td><td style="text-align:right">${f.type === 'charge' ? money(f.amount) : ''}</td><td style="text-align:right">${f.type === 'payment' ? money(f.amount) : ''}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right"><b>Bakiye</b></td><td style="text-align:right"><b>${money(balance(r))}</b></td></tr></table><p style="margin-top:30px">Misafir imza: ____________________</p></div>`, { title: r.no });
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const t = today();
    const arr = active().filter((r) => r.checkIn === t && ['rezerve', 'opsiyon'].includes(r.status));
    const dep = active().filter((r) => r.status === 'konaklama' && r.checkOut <= t);
    const inh = active().filter((r) => r.status === 'konaklama');
    const total = db.all('rooms', (r) => r.hk !== 'arizali').length;
    const occ = occupiedOn(t).length;
    const next14 = Array.from({ length: 14 }, (_, i) => { const d = iso(addDays(new Date(), i)); return { label: d.slice(8) + '.' + d.slice(5, 7), value: Math.round((occupiedOn(d).length / total) * 100) }; });
    const adr = occ ? sum(occupiedOn(t), (r) => r.price) / occ : 0;
    el.innerHTML = pageHead('Ön Büro Özeti', NS.dateLong(new Date()), `<a class="btn" href="rezervasyon.html" target="_blank" rel="noopener">${icon('globe')} Rezervasyon motoru</a><button class="btn primary" id="nr">${icon('plus')} Yeni rezervasyon</button>`) + `
      <div class="grid g4 mb">${kpi('Doluluk (bu gece)', `%${Math.round((occ / total) * 100)}`, 'bed', '', `<div class="small faint">${occ} / ${total} oda</div>`)}${kpi('Bugün giriş', arr.length, 'key', 'info')}${kpi('Bugün çıkış', dep.length, 'logout', 'warn')}${kpi('Ortalama oda fiyatı (ADR)', money(adr), 'wallet', 'ok')}</div>
      <div class="grid g3 mb">
        <div class="card"><div class="card-h"><h3>${icon('key')} Bugün gelecekler</h3></div><div class="card-b">${arr.map((r) => `<div class="list-item"><div class="grow"><b>${esc(guest(r.guest).name)}</b><div class="small muted">Oda ${room(r.room).no} · ${nights(r)} gece · ${esc(r.source)}</div></div><button class="btn sm ok" data-ci="${r.id}">Giriş</button></div>`).join('') || '<div class="faint small">Bugün giriş yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('logout')} Bugün ayrılacaklar</h3></div><div class="card-b">${dep.map((r) => `<div class="list-item"><div class="grow"><b>${esc(guest(r.guest).name)}</b><div class="small muted">Oda ${room(r.room).no} · bakiye ${money(balance(r))}</div></div><button class="btn sm primary" data-co="${r.id}">Çıkış</button></div>`).join('') || '<div class="faint small">Bugün çıkış yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('sparkles')} Kat hizmetleri</h3></div><div class="card-b">${Object.entries(HK).map(([k, v]) => `<div class="list-item"><span class="grow">${badge(v[0], v[1])}</span><b>${db.all('rooms', (r) => r.hk === k).length} oda</b></div>`).join('')}<a class="btn sm block mt" href="#/odalar">Oda durumlarını aç</a></div></div>
      </div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Önümüzdeki 14 gün doluluk (%)</h3></div><div class="card-b">${chart.bars(next14, { format: (v) => '%' + v })}</div></div>
      <div class="card"><div class="card-h"><h3>Konaklayanlar (${inh.length})</h3></div><div class="card-b" style="max-height:280px;overflow:auto">${inh.map((r) => `<div class="list-item small" data-r="${r.id}" style="cursor:pointer"><b style="min-width:36px">${room(r.room).no}</b><span class="grow">${esc(guest(r.guest).name)}</span><span class="faint">${NS.date(r.checkOut)}</span></div>`).join('')}</div></div></div>`;
    $('#nr', el).onclick = () => resForm(app);
    on(el, 'click', '[data-ci]', (e, t) => checkIn(app, db.get('reservations', t.dataset.ci)));
    on(el, 'click', '[data-co]', (e, t) => checkOut(app, db.get('reservations', t.dataset.co)));
    on(el, 'click', '[data-r]', (e, t) => resDetail(app, db.get('reservations', t.dataset.r)));
  }

  // ---------- Rezervasyon takvimi (oda × gün) ----------
  let gStart = iso(addDays(new Date(), -3)), gDays = 21;
  function ganttPage(el, p, app) {
    const days = Array.from({ length: gDays }, (_, i) => iso(addDays(gStart, i)));
    const rooms = db.all('rooms').sort((a, b) => a.no.localeCompare(b.no));
    const COLW = 46, ROWH = 42, LABW = 150;
    el.innerHTML = `<div class="row mb"><button class="btn icon" data-g="-7">${icon('left')}</button><button class="btn" data-g="0">Bugün</button><button class="btn icon" data-g="7">${icon('right')}</button><input type="date" class="input" id="gd" value="${gStart}" style="max-width:170px">
        <div class="seg"><button data-n="14" class="${gDays === 14 ? 'active' : ''}">2 hafta</button><button data-n="21" class="${gDays === 21 ? 'active' : ''}">3 hafta</button><button data-n="31" class="${gDays === 31 ? 'active' : ''}">1 ay</button></div>
        <span class="grow"></span>${Object.entries(ST).slice(0, 4).map(([k, v]) => `<span class="small row nw"><i class="dot" style="background:${{ opsiyon: '#d97706', rezerve: '#0891b2', konaklama: '#16a34a', cikis: '#64748b' }[k]}"></i>${v[0]}</span>`).join('')}<button class="btn primary" id="nr">${icon('plus')} Rezervasyon</button></div>
      <p class="small muted mb">Boş bir hücreye tıklayarak o oda ve tarihten rezervasyon açın.</p>
      <div class="card gantt-wrap"><div class="gantt" id="gt" style="grid-template-columns:${LABW}px repeat(${gDays}, ${COLW}px);grid-auto-rows:${ROWH}px">
        <div class="rl corner h" style="justify-content:flex-start">Oda</div>
        ${days.map((d) => { const dt = new Date(d + 'T12:00'); return `<div class="h ${d === today() ? 'td' : ''} ${[0, 6].includes(dt.getDay()) ? 'we' : ''}">${NS.DAYS[dt.getDay()].slice(0, 2)}<br>${dt.getDate()}</div>`; }).join('')}
        ${rooms.map((r) => `<div class="rl"><b>${r.no}</b><span class="small faint" style="overflow:hidden;text-overflow:ellipsis">${esc(type(r.type).name)}</span>${r.hk !== 'temiz' ? `<span class="dot ${r.hk === 'kirli' ? 'warn' : 'err'}" title="${HK[r.hk][0]}"></span>` : ''}</div>${days.map((d) => `<div class="c ${d === today() ? 'td' : ''}" data-cell="${r.id}|${d}"></div>`).join('')}`).join('')}
      </div></div>`;
    const gt = $('#gt', el);
    const end = iso(addDays(gStart, gDays));
    active().filter((r) => r.checkIn < end && r.checkOut > gStart).forEach((r) => {
      const ri = rooms.findIndex((x) => x.id === r.room); if (ri < 0) return;
      const s = Math.max(0, daysBetween(gStart, r.checkIn)), e = Math.min(gDays, daysBetween(gStart, r.checkOut));
      const bar = document.createElement('div');
      bar.className = 'bar ' + r.status; bar.dataset.r = r.id;
      bar.style.cssText = `left:${LABW + s * COLW + COLW / 2}px;top:${ROWH * (ri + 1) + 6}px;width:${Math.max(COLW, (e - s) * COLW) - 4}px`;
      bar.innerHTML = `${r.status === 'konaklama' ? icon('user') : ''}<span>${esc(guest(r.guest).name)}</span>`;
      bar.title = `${guest(r.guest).name} · ${NS.date(r.checkIn)}-${NS.date(r.checkOut)} · ${r.source}`;
      gt.appendChild(bar);
    });
    on(el, 'click', '[data-g]', (e, t) => { const n = Number(t.dataset.g); gStart = n === 0 ? iso(addDays(new Date(), -3)) : iso(addDays(gStart, n)); app.refresh(); });
    on(el, 'click', '[data-n]', (e, t) => { gDays = Number(t.dataset.n); app.refresh(); });
    $('#gd', el).onchange = (e) => { gStart = e.target.value; app.refresh(); };
    $('#nr', el).onclick = () => resForm(app);
    on(el, 'click', '[data-r]', (e, t) => resDetail(app, db.get('reservations', t.dataset.r)));
    on(el, 'click', '[data-cell]', (e, t) => { const [rid, d] = t.dataset.cell.split('|'); resForm(app, { room: rid, checkIn: d, checkOut: iso(addDays(d, 1)) }); });
    const w = $('.gantt-wrap', el); w.scrollLeft = 0;
  }

  // ---------- Odalar / Housekeeping ----------
  function roomsPage(el, p, app) {
    let fl = '';
    const draw = () => {
      const t = today();
      const list = db.all('rooms', (r) => !fl || String(r.floor) === fl).sort((a, b) => a.no.localeCompare(b.no));
      el.innerHTML = pageHead('Odalar & Kat Hizmetleri', 'Odaya tıklayarak temizlik durumunu değiştirin', `<div class="seg"><button data-f="" class="${!fl ? 'active' : ''}">Tümü</button>${[...new Set(db.all('rooms').map((r) => r.floor))].map((f) => `<button data-f="${f}" class="${fl === String(f) ? 'active' : ''}">${f}. kat</button>`).join('')}</div><button class="btn" id="allc">${icon('check')} Boş kirli odaları temiz yap</button><button class="btn primary" id="add">${icon('plus')} Oda ekle</button>`) +
        `<div class="row mb">${Object.entries(HK).map(([k, v]) => badge(`${v[0]}: ${db.all('rooms', (r) => r.hk === k).length}`, v[1])).join(' ')} <span class="small muted"><span class="dot" style="background:var(--accent)"></span> Dolu oda</span></div>
        <div class="rooms">${list.map((r) => { const occ = occupiedOn(t).find((x) => x.room === r.id); return `<div class="room ${r.hk} ${occ ? 'dolu' : ''}" data-room="${r.id}"><span class="no">${r.no}</span><span class="small muted">${esc(type(r.type).name)}</span>${badge(HK[r.hk][0], HK[r.hk][1])}${occ ? `<span class="small"><b>${esc(guest(occ.guest).name)}</b><br><span class="faint">çıkış ${NS.date(occ.checkOut)}</span></span>` : '<span class="small faint">Boş</span>'}${r.note ? `<span class="small" style="color:var(--err)">${esc(r.note)}</span>` : ''}</div>`; }).join('')}</div>`;
    };
    on(el, 'click', '[data-f]', (e, t2) => { fl = t2.dataset.f; draw(); });
    on(el, 'click', '[data-room]', async (e, t) => {
      const r = db.get('rooms', t.dataset.room);
      const v = await formModal({ title: `Oda ${r.no}`, fields: [{ name: 'hk', label: 'Temizlik durumu', type: 'select', options: Object.entries(HK).map(([value, x]) => ({ value, label: x[0] })) }, { name: 'type', label: 'Oda tipi', type: 'select', options: db.all('types').map((x) => ({ value: x.id, label: x.name })) }, { name: 'note', label: 'Not / arıza', full: true }], values: r });
      if (v) { db.update('rooms', r.id, v); db.log('Oda durumu', `${r.no} → ${HK[v.hk][0]}`); draw(); }
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('#allc')) { const busy = occupiedOn(today()).map((x) => x.room); db.all('rooms', (r) => r.hk === 'kirli' && !busy.includes(r.id)).forEach((r) => { r.hk = 'temiz'; }); db.save(); toast('Odalar temiz olarak işaretlendi', 'ok'); draw(); }
      if (e.target.closest('#add')) formModal({ title: 'Yeni oda', fields: [{ name: 'no', label: 'Oda no', required: true }, { name: 'floor', label: 'Kat', type: 'number', value: 1 }, { name: 'type', label: 'Tip', type: 'select', options: db.all('types').map((x) => ({ value: x.id, label: x.name })) }] }).then((v) => { if (v) { db.insert('rooms', { ...v, hk: 'temiz', note: '' }); draw(); } });
    });
    draw();
  }

  // ---------- Listeler ----------
  function listPage(el, p, app) {
    let q = '', st = '';
    el.innerHTML = pageHead('Rezervasyonlar', 'Tüm rezervasyonlar, kaynaklar ve bakiyeler', `<button class="btn" id="ex">${icon('download')} Dışa aktar</button><button class="btn primary" id="nr">${icon('plus')} Yeni</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Misafir, oda, rezervasyon no...')}<div class="seg">${[['', 'Tümü'], ['rezerve', 'Gelecek'], ['konaklama', 'Konaklayan'], ['cikis', 'Çıkış'], ['iptal', 'İptal']].map(([k, l]) => `<button data-s="${k}" class="${k === st ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('reservations', (r) => (!st || r.status === st || (st === 'rezerve' && r.status === 'opsiyon')) && NS.match(q, r.no, guest(r.guest).name, room(r.room).no, r.source)).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    const draw = () => { const rs = rows(); $('#t', el).innerHTML = table({ rows: rs.slice(0, 300), columns: [{ label: 'No', render: (r) => `<b>${esc(r.no)}</b>` }, { label: 'Misafir', render: (r) => esc(guest(r.guest).name) }, { label: 'Oda', render: (r) => room(r.room).no }, { label: 'Giriş', render: (r) => NS.date(r.checkIn) }, { label: 'Çıkış', render: (r) => NS.date(r.checkOut) }, { label: 'Gece', cls: 'right', render: (r) => nights(r) }, { label: 'Kaynak', render: (r) => esc(r.source) }, { label: 'Durum', render: (r) => badge(ST[r.status][0], ST[r.status][1]) }, { label: 'Tutar', cls: 'right', render: (r) => money(r.price * nights(r)) }, { label: 'Bakiye', cls: 'right', render: (r) => (r.folio.length ? (balance(r) > 0 ? `<b style="color:var(--err)">${money(balance(r))}</b>` : badge('Kapalı', 'ok')) : '-') }], actions: [{ icon: 'eye', act: 'v' }], foot: `${rs.length} rezervasyon · ${num(sum(rs, nights))} gece · ${money(sum(rs.filter((r) => r.status !== 'iptal'), (r) => r.price * nights(r)))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-s]', (e, t) => { st = t.dataset.s; $$('[data-s]', el).forEach((b) => b.classList.toggle('active', b === t)); draw(); });
    on(el, 'click', '[data-act=v]', (e, t) => resDetail(app, db.get('reservations', t.dataset.id)));
    $('#nr', el).onclick = () => resForm(app);
    $('#ex', el).onclick = () => NS.csv('rezervasyonlar', rows(), [{ key: 'no', label: 'No' }, { label: 'Misafir', value: (r) => guest(r.guest).name }, { label: 'Oda', value: (r) => room(r.room).no }, { key: 'checkIn', label: 'Giriş' }, { key: 'checkOut', label: 'Çıkış' }, { key: 'source', label: 'Kaynak' }, { label: 'Tutar', value: (r) => r.price * nights(r) }]);
    draw();
  }
  const GUEST_FIELDS = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'idNo', label: 'TC / pasaport no' }, { name: 'nat', label: 'Uyruk' }, { name: 'note', label: 'Not (VIP, tercih...)', full: true }];
  function guestsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'guests', title: 'Misafirler', sub: 'Misafir kartları ve konaklama geçmişi', single: 'Misafir', addLabel: 'Yeni misafir', emptyIcon: 'users', fields: GUEST_FIELDS, sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (g) => [g.name, g.phone, g.idNo, g.email],
      columns: [{ key: 'name', label: 'Misafir', render: (g) => `<b>${esc(g.name)}</b> ${g.note ? badge(g.note, 'warn') : ''}<div class="small faint">${esc(g.phone)}</div>` }, { key: 'nat', label: 'Uyruk' }, { label: 'Konaklama', cls: 'right', render: (g) => db.all('reservations', (r) => r.guest === g.id && r.status !== 'iptal').length }, { label: 'Toplam gece', cls: 'right', render: (g) => sum(db.all('reservations', (r) => r.guest === g.id && r.status !== 'iptal'), nights) }, { label: 'Harcama', cls: 'right', render: (g) => money(sum(db.all('reservations', (r) => r.guest === g.id && r.status === 'cikis'), (r) => sum(r.folio.filter((f) => f.type === 'charge'), (f) => f.amount))) }],
    });
  }

  // ---------- Fiyatlar ----------
  function pricingPage(el, p, app) {
    el.innerHTML = pageHead('Oda Tipleri & Fiyatlar', 'Baz fiyatlar, sezon artışları ve ekstra hizmetler') + `<div class="grid g2"><div id="a"></div><div id="b"></div></div><div id="c" class="mt"></div>`;
    NS.crud($('#a', el), app, { col: 'types', title: 'Oda tipleri', single: 'Oda tipi', addLabel: 'Yeni tip', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'capacity', label: 'Kapasite', type: 'number' }, { name: 'price', label: 'Gecelik baz fiyat', type: 'number', required: true }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Tip', render: (t) => `<b>${esc(t.name)}</b>` }, { key: 'capacity', label: 'Kişi', cls: 'right' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (t) => money(t.price) }, { label: 'Oda', cls: 'right', render: (t) => db.all('rooms', (r) => r.type === t.id).length }] });
    NS.crud($('#b', el), app, { col: 'seasons', title: 'Sezonlar', single: 'Sezon', addLabel: 'Yeni sezon', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'from', label: 'Başlangıç', type: 'date', required: true }, { name: 'to', label: 'Bitiş', type: 'date', required: true }, { name: 'pct', label: 'Fiyat artışı %', type: 'number', required: true }], columns: [{ key: 'name', label: 'Sezon', render: (s) => `<b>${esc(s.name)}</b>` }, { label: 'Tarih', render: (s) => `${NS.date(s.from)} – ${NS.date(s.to)}` }, { key: 'pct', label: 'Artış', cls: 'right', render: (s) => badge('+%' + s.pct, 'warn') }] });
    NS.crud($('#c', el), app, { col: 'extras', title: 'Ekstra hizmetler', single: 'Hizmet', addLabel: 'Yeni hizmet', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'price', label: 'Fiyat', type: 'number', required: true }], columns: [{ key: 'name', label: 'Hizmet', render: (x) => `<b>${esc(x.name)}</b>` }, { key: 'price', label: 'Fiyat', cls: 'right', render: (x) => money(x.price) }] });
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    let days = 30;
    const draw = () => {
      const from = iso(addDays(new Date(), -days)), to = today();
      const total = db.all('rooms').length;
      let roomNights = 0, revenue = 0;
      const series = [];
      for (let d = from; d < to; d = iso(addDays(d, 1))) { const o = occupiedOn(d); roomNights += o.length; revenue += sum(o, (r) => r.price); series.push({ d, occ: Math.round((o.length / total) * 100), rev: sum(o, (r) => r.price) }); }
      const avail = total * days;
      const res = active().filter((r) => r.checkIn >= from && r.checkIn < to);
      const bySrc = NS.groupBy(res, (r) => r.source);
      const byNat = NS.groupBy(res, (r) => guest(r.guest).nat || '?');
      const byType = NS.groupBy(res, (r) => type(room(r.room).type).name);
      el.innerHTML = pageHead('Raporlar', 'Doluluk, ADR, RevPAR ve kanal analizi', `<div class="seg">${[30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'active' : ''}">Son ${d} gün</button>`).join('')}</div>`) + `
        <div class="grid g4 mb">${kpi('Doluluk', '%' + Math.round((roomNights / avail) * 100), 'bed')}${kpi('ADR (ort. oda fiyatı)', money(roomNights ? revenue / roomNights : 0), 'wallet', 'info')}${kpi('RevPAR', money(revenue / avail), 'trend', 'ok')}${kpi('Konaklama geliri', money(revenue), 'cash', 'warn')}</div>
        <div class="card mb"><div class="card-h"><h3>Günlük doluluk (%)</h3></div><div class="card-b">${chart.line([{ name: 'Doluluk', values: series.map((x) => x.occ) }], series.map((x) => x.d.slice(8) + '.' + x.d.slice(5, 7)), { format: (v) => '%' + v })}</div></div>
        <div class="grid g3"><div class="card"><div class="card-h"><h3>Satış kanalları</h3></div><div class="card-b">${chart.donut(Object.entries(bySrc).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div>
        <div class="card"><div class="card-h"><h3>Misafir uyrukları</h3></div><div class="card-b">${chart.donut(Object.entries(byNat).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div>
        <div class="card"><div class="card-h"><h3>Oda tipine göre gelir</h3></div><div class="card-b">${chart.donut(Object.entries(byType).map(([label, v]) => ({ label, value: sum(v, (r) => r.price * nights(r)) })), { size: 130, format: money })}</div></div></div>`;
    };
    on(el, 'click', '[data-d]', (e, t) => { days = Number(t.dataset.d); draw(); });
    draw();
  }

  const ROLES = { admin: 'Yönetici', resepsiyon: 'Resepsiyon', kat: 'Kat Hizmetleri' };
  const app = NS.shell({
    id: 'otel', integrations: ['printer', 'pos', 'efatura', 'payment', 'sms', 'whatsapp', 'email', 'webhook', 'backup'], name: 'Otel', tagline: 'Otel & Pansiyon Yönetimi', icon: 'bed', accent: '#0891b2', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Ön Büro' }, { id: 'ozet', label: 'Ön Büro Özeti', icon: 'home', roles: ['resepsiyon'] }, { id: 'takvim', label: 'Rezervasyon Takvimi', icon: 'calendar', roles: ['resepsiyon'] }, { id: 'rezervasyonlar', label: 'Rezervasyonlar', icon: 'list', roles: ['resepsiyon'] }, { id: 'misafirler', label: 'Misafirler', icon: 'users', roles: ['resepsiyon'] }, { id: 'odalar', label: 'Odalar & Housekeeping', icon: 'sparkles' }, { id: 'kanal', label: 'Kanal & KBS', icon: 'globe', roles: ['resepsiyon'] }, { sec: 'Yönetim' }, { id: 'fiyatlar', label: 'Oda Tipleri & Fiyatlar', icon: 'tag', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { kanal: channelPage, ozet: dashboard, takvim: ganttPage, rezervasyonlar: listPage, misafirler: guestsPage, odalar: roomsPage, fiyatlar: pricingPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Otel ayarları' }, { name: 'checkInTime', label: 'Giriş saati', type: 'time' }, { name: 'checkOutTime', label: 'Çıkış saati', type: 'time' }, { name: 'tax', label: 'Konaklama vergisi %', type: 'number' }, { type: 'section', label: 'Web sitesi rezervasyon motoru (rezervasyon.html)' }, { name: 'directDiscount', label: 'Doğrudan rezervasyon indirimi %', type: 'number' }, { name: 'otaMarkup', label: 'OTA fiyat farkı % (karşılaştırma için)', type: 'number' }, { name: 'hbPrice', label: 'Yarım pansiyon kişi/gece (₺)', type: 'number' }, { name: 'freeCancelDays', label: 'Ücretsiz iptal (gün önce)', type: 'number' }] }) },
  });
  if (NS.currentUser && NS.currentUser.role === 'kat' && !location.hash.includes('odalar')) app.go('odalar');
})();
