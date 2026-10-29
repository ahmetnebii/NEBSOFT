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
  const ST = { opsiyon: ['Opsiyonlu', 'warn'], rezerve: ['Rezerve', 'info'], konaklama: ['Konaklıyor', 'ok'], cikis: ['Çıkış yaptı', ''], iptal: ['İptal', 'err'], noshow: ['Gelmedi (no-show)', 'err'] };
  const HK = { temiz: ['Temiz', 'ok'], kirli: ['Kirli', 'warn'], arizali: ['Arızalı', 'err'] };
  const BOARD = { RO: 'Sadece oda', BB: 'Oda + kahvaltı', HB: 'Yarım pansiyon', FB: 'Tam pansiyon', AI: 'Her şey dahil' };
  const room = (id) => db.get('rooms', id) || { no: '-' };
  const type = (id) => db.get('types', id) || { name: '-', price: 0 };
  const guest = (id) => db.get('guests', id) || { name: '-' };
  const nights = (r) => Math.max(1, daysBetween(r.checkIn, r.checkOut));
  // Bakiye = borç + iade edilen − ödenen (iade: misafire geri verilen para)
  const paid = (r) => sum(r.folio.filter((f) => f.type === 'payment'), (f) => f.amount) - sum(r.folio.filter((f) => f.type === 'refund'), (f) => f.amount);
  const charges = (r) => sum(r.folio.filter((f) => f.type === 'charge'), (f) => f.amount);
  const balance = (r) => charges(r) - paid(r);
  const active = () => db.all('reservations', (r) => r.status !== 'iptal' && r.status !== 'noshow');
  // Satılabilir oda: arızalı olmayan (doluluk her ekranda aynı tabana göre hesaplanır)
  const sellable = () => Math.max(1, db.all('rooms', (r) => r.hk !== 'arizali').length);
  // Giriş günü geçmiş ama giriş yapmamış rezervasyonlar
  const overdue = () => db.all('reservations', (r) => ['rezerve', 'opsiyon'].includes(r.status) && r.checkIn < today());
  // Folyodaki konaklama satırı, gece sayısı ve fiyatla eşitlenir (erken çıkış, uzatma, oda değişikliği)
  const stayLine = (r) => r.folio.find((f) => f.stay) || r.folio.find((f) => f.type === 'charge' && /^Konaklama/.test(f.desc));
  function syncStay(r) {
    const f = stayLine(r); if (!f) return;
    Object.assign(f, { stay: true, amount: r.price * nights(r), desc: `Konaklama ${nights(r)} gece × ${money(r.price)}`, vat: f.vat ?? vatStay() });
  }
  const vatStay = () => (S().vatStay === undefined || S().vatStay === '' ? 10 : Number(S().vatStay));
  const vatExtra = () => (S().vatExtra === undefined || S().vatExtra === '' ? 20 : Number(S().vatExtra));
  // Simülasyon sonucu kalıcı "yapıldı" kaydı bırakmaz; yalnızca TEST izi tutulur
  const testMark = (r, key) => { r.test = r.test || {}; r.test[key] = new Date().toISOString(); };
  const occupiedOn = (d) => active().filter((r) => r.checkIn <= d && d < r.checkOut);
  const seasonPct = (d) => sum(db.all('seasons', (s) => s.from <= d && d <= s.to), (s) => s.pct);
  // Cuma ve cumartesi geceleri hafta sonu farkı
  const weekend = (d) => [5, 6].includes(new Date(d + 'T12:00').getDay());
  const nightPrice = (typeId, d) => { const t = type(typeId); return t.price * (1 + seasonPct(d) / 100) * (1 + (weekend(d) ? Number(t.weekendPct) || 0 : 0) / 100); };
  // Ek kişi: oda fiyatı "baz kişi" sayısı içindir; fazlası için kişi başı gecelik ücret
  const extraFee = (typeId, adults, children) => { const t = type(typeId); return Math.max(0, (Number(adults) || 0) - (Number(t.baseOcc) || Number(t.capacity) || 2)) * (Number(t.extraAdult) || 0) + (Number(children) || 0) * (Number(t.extraChild) || 0); };
  const suggestPrice = (typeId, ci, co, adults, children) => { let t = 0; for (let d = ci; d < co; d = iso(addDays(d, 1))) t += nightPrice(typeId, d); return Math.round((t / Math.max(1, daysBetween(ci, co)) + extraFee(typeId, adults, children)) / 50) * 50; };
  // Oda değişikliğinde geçmiş geceler eski odada kalır (segs); bir gecenin odası:
  const roomOn = (r, d) => { const sg = (r.segs || []).find((x) => x.from <= d && d < x.to); return sg ? sg.room : r.room; };
  const usesRoom = (r, roomId, ci, co) => { if (!(r.checkIn < co && ci < r.checkOut)) return false; if (!(r.segs || []).length) return r.room === roomId; for (let d = r.checkIn > ci ? r.checkIn : ci; d < co && d < r.checkOut; d = iso(addDays(d, 1))) if (roomOn(r, d) === roomId) return true; return false; };
  // Satışa kapalı (bakım/tadilat) aralıkları da odayı kapatır
  const blockOf = (roomId, ci, co) => db.all('blocks', (b) => b.room === roomId && b.from < co && ci < b.to)[0];
  const clash = (roomId, ci, co, ignore) => active().find((r) => r.id !== ignore && usesRoom(r, roomId, ci, co)) || (blockOf(roomId, ci, co) ? { block: blockOf(roomId, ci, co) } : null);
  const clashText = (c) => (c.block ? `Oda satışa kapalı: ${c.block.reason || 'bakım'} (${NS.date(c.block.from)}–${NS.date(c.block.to)})` : `Oda dolu: ${guest(c.guest).name} (${NS.date(c.checkIn)}-${NS.date(c.checkOut)})`);
  const r2 = (n) => Math.round(n * 100) / 100;

  // ---------- Kanal yöneticisi (OTA) ve KBS ----------
  function channelPage(el, p, app) {
    const tab = p || 'kanal';
    const days = Array.from({ length: 14 }, (_, i) => iso(addDays(new Date(), i)));
    const types = db.all('types');
    const freeOf = (t, d) => db.all('rooms', (r) => r.type === t.id && r.hk !== 'arizali').filter((rm) => !clash(rm.id, d, iso(addDays(d, 1)))).length;
    const srcs = NS.groupBy(active().filter((r) => r.checkIn >= iso(addDays(new Date(), -90))), (r) => r.source);
    const stays = db.all('reservations', (r) => r.status === 'konaklama' || (r.status === 'cikis' && r.checkedOutAt && r.checkedOutAt.slice(0, 10) >= iso(addDays(new Date(), -7))));
    el.innerHTML = pageHead('Kanal & KBS', 'Booking, Expedia, Airbnb senkronu ve Kimlik Bildirim Sistemi', `<button class="btn" id="pull">${icon('download')} OTA rezervasyonlarını çek</button><button class="btn primary" id="push">${icon('send')} Müsaitlik & fiyat gönder</button>`) + `
      <div class="tabs">${[['kanal', 'Kanal yönetimi'], ['kbs', 'KBS bildirimleri']].map(([k, l]) => `<a href="#/kanal/${k}"><button class="${k === tab ? 'active' : ''}">${l}</button></a>`).join('')}</div><div id="t"></div>`;
    if (tab === 'kanal') $('#t', el).innerHTML = `<div class="grid g3 mb">${Object.entries(srcs).sort((a, b) => b[1].length - a[1].length).slice(0, 6).map(([s, rs]) => kpi(s, `${rs.length} rez.`, 'globe', 'info', `<div class="small faint">${money(sum(rs, (r) => r.price * nights(r)))} · ort. ${r2(sum(rs, nights) / rs.length)} gece</div>`)).join('')}</div>
      <div class="card"><div class="card-h"><h3>14 günlük müsaitlik (OTA’ya gönderilecek)</h3><span class="small muted">${S().otaSync ? 'Son gönderim: ' + NS.dt(S().otaSync) : 'Henüz gönderilmedi'}</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Oda tipi</th>${days.map((d) => `<th style="text-align:center">${NS.date(d).slice(0, 5)}</th>`).join('')}</tr></thead><tbody>${types.map((t) => `<tr><td><b>${esc(t.name)}</b><div class="small faint">${money(t.price)}</div></td>${days.map((d) => { const f = freeOf(t, d); return `<td style="text-align:center"><b style="color:${f ? 'var(--ok)' : 'var(--err)'}">${f}</b><div class="small faint">${money(Math.round(nightPrice(t.id, d) / 50) * 50)}</div></td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    else $('#t', el).innerHTML = `<div class="card">${table({ rows: stays.sort((a, b) => b.checkIn.localeCompare(a.checkIn)), empty: 'Konaklayan yok', columns: [{ label: 'Oda', render: (r) => `<b>${room(r.room).no}</b>` }, { label: 'Misafir', render: (r) => `${esc(guest(r.guest).name)}<div class="small faint">${esc(guest(r.guest).idNo || 'Kimlik no yok')} · ${esc(guest(r.guest).nat || '')}${(r.companions || []).length ? ' · +' + r.companions.length + ' kişi' : ''}</div>` }, { label: 'Giriş', render: (r) => NS.date(r.checkIn) }, { label: 'Çıkış', render: (r) => NS.date(r.checkOut) }, { label: 'KBS giriş', render: (r) => kbsBadge(r, 'giris') }, { label: 'KBS çıkış', render: (r) => (r.status !== 'cikis' ? '-' : kbsBadge(r, 'cikis')) }], actions: [{ label: 'Bildir', act: 'kb', show: (r) => !(r.kbs && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris']) || r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] === 'hata' }] })}<div class="pad row"><button class="btn" id="kball">${icon('send')} Bekleyenlerin tümünü bildir</button><button class="btn" id="kbpr">${icon('print')} Konaklayan listesi yazdır</button></div></div>`;
    $('#push', el).onclick = async () => { const payload = types.map((t) => ({ type: t.name, days: days.map((d) => ({ date: d, free: freeOf(t, d), price: Math.round(nightPrice(t.id, d) / 50) * 50, minStay: Number(t.minNights) || 1 })) })); const r = await NS.integ.call('kanal', 'musaitlik-fiyat', { rooms: payload }, { silent: true }); if (r && r.simulated) return toast('TEST: kanal yöneticisi simülasyonda — müsaitlik ve fiyat hiçbir kanala gönderilmedi', 'warn'); if (r && r.ok) { db.saveSettings({ otaSync: new Date().toISOString() }); toast('Müsaitlik ve fiyat gönderildi', 'ok'); app.refresh(); } else toast('Gönderilemedi: ' + ((r && r.error) || 'Kanal bağlantısı kapalı — Entegrasyonlar sayfasından açın'), 'err'); };
    $('#pull', el).onclick = async () => {
      const r = await NS.integ.call('kanal', 'rezervasyon-cek', { since: S().otaPull || iso(addDays(new Date(), -1)) }, { silent: true });
      if (r && r.simulated) return toast('TEST: kanal yöneticisi simülasyonda — gerçek rezervasyon çekilmedi, takvime bir şey eklenmedi', 'warn');
      if (!r || !r.ok) return toast('Rezervasyonlar çekilemedi: ' + ((r && r.error) || 'Kanal bağlantısı kapalı — Entegrasyonlar sayfasından açın'), 'err');
      const list = r.data && Array.isArray(r.data.reservations) ? r.data.reservations : [];
      const skipped = [];
      let n = 0; list.forEach((x) => { if (db.find('reservations', (y) => y.ota === x.otaNo)) return; let g = db.find('guests', (y) => y.name === x.guest); if (!g) g = db.insert('guests', { name: x.guest, phone: '', nat: '' }, true); const rmId = x.roomId || (db.all('rooms', (y) => type(y.type).name === x.roomType).find((y) => !clash(y.id, x.checkIn, x.checkOut)) || {}).id; if (!rmId) { skipped.push(`${x.ota || 'OTA'} ${x.otaNo || ''} · ${x.guest} (${NS.date(x.checkIn)})`); return; } db.insert('reservations', { no: db.nextNo('res', 'R'), room: rmId, guest: g.id, checkIn: x.checkIn, checkOut: x.checkOut, adults: x.adults || 2, children: 0, board: 'BB', source: x.ota, price: x.price, status: 'rezerve', deposit: 0, folio: [], ota: x.otaNo, created: new Date().toISOString() }, true); n++; });
      db.saveSettings({ otaPull: new Date().toISOString() }); db.save(); toast(`${n} yeni OTA rezervasyonu alındı`, n ? 'ok' : '');
      // Odası bulunamayan rezervasyon sessizce düşmez: ekranda listelenir (fazla satış)
      if (skipped.length) modal({ title: 'Yerleştirilemeyen OTA rezervasyonları', body: `<p class="small" style="color:var(--err)">Bu rezervasyonlar için boş oda bulunamadı (fazla satış). Takvimde yer açıp elle girin ve kanala müsaitliği yeniden gönderin.</p>${skipped.map((s) => `<div class="list-item small">${esc(s)}</div>`).join('')}` });
      app.refresh();
    };
    on(el, 'click', '[data-act=kb]', async (e, b) => { const r = db.get('reservations', b.dataset.id); await kbsSend(r, r.status === 'cikis' ? 'cikis' : 'giris'); app.refresh(); });
    const kp = $('#kbpr', el); if (kp) kp.onclick = () => printGuestList();
    const ka = $('#kball', el); if (ka) ka.onclick = async () => { const pend = stays.filter((r) => !(r.kbs && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] && r.kbs[r.status === 'cikis' ? 'cikis' : 'giris'] !== 'hata')); let ok = 0, test = 0; for (const r of pend) { const x = await kbsSend(r, r.status === 'cikis' ? 'cikis' : 'giris', true); if (x && x.simulated) test++; else if (x && x.ok) ok++; } toast(test ? `TEST: KBS simülasyonda — ${test} kayıt bildirilmedi` : `${ok} / ${pend.length} bildirim yapıldı`, test || ok < pend.length ? 'warn' : 'ok'); app.refresh(); };
  }

  // ---------- Rezervasyon formu ----------
  async function resForm(app, rec = {}) {
    const isNew = !rec.id;
    const v = { checkIn: today(), checkOut: iso(addDays(new Date(), 2)), adults: 2, children: 0, board: 'BB', source: 'Telefon', status: 'rezerve', ...rec };
    modal({
      title: isNew ? 'Yeni Rezervasyon' : `Rezervasyon ${rec.no}`, size: 'wide',
      body: `<div class="form-grid">
        <div class="field full"><label>Misafir *</label><input class="input mb" id="fgq" type="search" placeholder="Ad, telefon veya kimlik no ile ara..." autocomplete="off"><div class="row nw"><select class="input" id="fg"><option value="">Seçin...</option>${db.all('guests').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((g) => `<option value="${g.id}" ${g.id === v.guest ? 'selected' : ''}>${esc(g.name)} · ${esc(g.phone || '')}</option>`).join('')}</select><button class="btn" id="fgn">${icon('plus')} Yeni misafir</button></div></div>
        <div class="field"><label>Giriş *</label><input class="input" type="date" id="fci" value="${v.checkIn}"></div><div class="field"><label>Çıkış *</label><input class="input" type="date" id="fco" value="${v.checkOut}"></div>
        <div class="field"><label>Oda * <span class="faint" id="fav"></span></label><select class="input" id="fr"></select></div>
        <div class="field"><label>Gecelik fiyat (₺) <span class="faint" id="fsg"></span></label><input class="input" type="number" id="fp" value="${v.price || ''}"></div>
        <div class="field"><label>Yetişkin</label><input class="input" type="number" id="fa" value="${v.adults}"></div><div class="field"><label>Çocuk</label><input class="input" type="number" id="fch" value="${v.children}"></div>
        <div class="field"><label>Pansiyon</label><select class="input" id="fb">${Object.entries(BOARD).map(([k, x]) => `<option value="${k}" ${k === v.board ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Kaynak</label><select class="input" id="fs">${['Telefon', 'Web sitesi', 'Booking.com', 'Expedia', 'Airbnb', 'Kapıdan', 'Acente'].map((x) => `<option ${x === v.source ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Durum</label><select class="input" id="fst" ${v.status === 'konaklama' ? 'disabled' : ''}>${(v.status === 'konaklama' ? ['konaklama'] : ['opsiyon', 'rezerve']).map((k) => `<option value="${k}" ${k === v.status ? 'selected' : ''}>${ST[k][0]}</option>`).join('')}</select></div>
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
          const sg = suggestPrice(room($('#fr', b).value).type, ci, co, $('#fa', b).value, $('#fch', b).value);
          $('#fsg', b).textContent = `öneri ${money(sg)}`;
          if (!$('#fp', b).value || $('#fp', b).dataset.auto) { $('#fp', b).value = sg; $('#fp', b).dataset.auto = '1'; }
          summ();
        };
        const summ = () => { const n = Math.max(1, daysBetween($('#fci', b).value, $('#fco', b).value)); const p = Number($('#fp', b).value) || 0; $('#fsum', b).innerHTML = `<div class="row between"><span>${n} gece × ${money(p)}</span><b style="font-size:18px">${money(n * p)}</b></div>${seasonPct($('#fci', b).value) ? `<div class="small" style="color:var(--warn)">${icon('sun')} Sezon fiyatı uygulanıyor (+%${seasonPct($('#fci', b).value)})</div>` : ''}${(() => { const tp = type(room($('#fr', b).value).type); const x = []; if (Number(tp.minNights) > n) x.push(`En az ${tp.minNights} gece`); if (Number(tp.weekendPct)) x.push(`Hafta sonu +%${tp.weekendPct}`); const ef = extraFee(tp.id, $('#fa', b).value, $('#fch', b).value); if (ef) x.push(`Ek kişi ${money(ef)}/gece`); return x.length ? `<div class="small muted">${x.join(' · ')}</div>` : ''; })()}`; };
        $('#fci', b).onchange = () => { if ($('#fco', b).value <= $('#fci', b).value) $('#fco', b).value = iso(addDays($('#fci', b).value, 1)); fill(); };
        $('#fco', b).onchange = fill; $('#fa', b).onchange = fill; $('#fch', b).onchange = fill; $('#fr', b).onchange = () => { $('#fp', b).dataset.auto = '1'; fill(); };
        $('#fp', b).oninput = () => { delete $('#fp', b).dataset.auto; summ(); };
        // Yazdıkça liste daralır; tek eşleşme kalırsa seçilir
        $('#fgq', b).oninput = (e) => { const q = e.target.value; let last = null, n = 0; $$('#fg option', b).forEach((o) => { if (!o.value) return; const g = db.get('guests', o.value) || {}; const ok = !q || NS.match(q, g.name, g.phone, g.idNo, g.email); o.hidden = !ok; if (ok) { n++; last = o; } }); if (n === 1) $('#fg', b).value = last.value; };
        $('#fgn', b).onclick = async () => { const q = $('#fgq', b).value.trim(); const g = await formModal({ title: 'Yeni misafir', fields: GUEST_FIELDS, values: { nat: 'TR', ...(/\d{5,}/.test(q) ? { phone: q } : q ? { name: q } : {}) } }); if (g) { const n = db.insert('guests', g); $('#fg', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)}</option>`); $('#fg', b).value = n.id; } };
        if (v.id) $('#fp', b).value = v.price; else $('#fp', b).dataset.auto = '1';
        fill();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: isNew ? 'Rezervasyonu oluştur' : 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
          const d = { guest: $('#fg', b).value, room: $('#fr', b).value, checkIn: $('#fci', b).value, checkOut: $('#fco', b).value, price: Number($('#fp', b).value) || 0, adults: Number($('#fa', b).value) || 1, children: Number($('#fch', b).value) || 0, board: $('#fb', b).value, source: $('#fs', b).value, status: $('#fst', b).value, deposit: Number($('#fd', b).value) || 0, note: $('#fn', b).value };
          if (!d.guest) return toast('Misafir seçin', 'err');
          if (d.checkOut <= d.checkIn) return toast('Çıkış tarihi girişten sonra olmalı', 'err');
          const c = clash(d.room, d.checkIn, d.checkOut, v.id); if (c) return toast(clashText(c), 'err');
          const tp = type(room(d.room).type); const nn = daysBetween(d.checkIn, d.checkOut);
          if (Number(tp.minNights) > nn && !b.dataset.minOk) { b.dataset.minOk = '1'; return toast(`${tp.name} için en az ${tp.minNights} gece kuralı var — yine de kaydetmek için tekrar basın`, 'warn'); }
          if (d.adults + d.children > (Number(tp.capacity) || 99) && !b.dataset.capOk) { b.dataset.capOk = '1'; return toast(`${tp.name} kapasitesi ${tp.capacity} kişi — yine de kaydetmek için tekrar basın`, 'warn'); }
          if (isNew) { const r = db.insert('reservations', { ...d, no: db.nextNo('res', 'R'), folio: [] }); if (d.deposit) r.folio.push({ id: NS.uid(), date: today(), desc: 'Kapora', amount: d.deposit, type: 'payment', method: 'havale' }); db.log('Rezervasyon', `${r.no} · ${guest(d.guest).name}`); db.save(); }
          else { if (rec.status === 'konaklama') { delete d.deposit; d.status = 'konaklama'; } db.update('reservations', v.id, d); const r = db.get('reservations', v.id); if (r.status === 'konaklama') { syncStay(r); db.save(); } }
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
        </div><div><h3 class="mb">Folyo</h3>${r.folio.length ? r.folio.map((f) => `<div class="list-item small"><span class="grow">${esc(f.desc)} <span class="faint">${NS.date(f.date)}</span></span><b style="color:${f.type === 'payment' ? 'var(--ok)' : f.type === 'refund' ? 'var(--warn)' : 'inherit'}">${f.type === 'payment' ? '-' : f.type === 'refund' ? 'iade ' : ''}${money(f.amount)}</b></div>`).join('') : '<div class="faint small">Folyo boş (giriş yapılınca konaklama bedeli eklenir)</div>'}
          <div class="list-item"><b class="grow">Bakiye</b><b style="font-size:18px;color:${bal > 0 ? 'var(--err)' : 'var(--ok)'}">${money(bal)}</b></div>
          ${r.status === 'konaklama' ? `<div class="row mt"><button class="btn sm" data-x="charge">${icon('plus')} Harcama ekle</button><button class="btn sm" data-x="pay">${icon('cash')} Ödeme al</button><button class="btn sm" data-x="pbx">${icon('phone')} Santral</button><button class="btn sm" data-x="card">${icon('key')} Kart</button><button class="btn sm" data-x="move">${icon('refresh')} Oda değiştir</button></div>` : ['rezerve', 'opsiyon'].includes(r.status) ? `<div class="row mt"><button class="btn sm" data-x="move">${icon('refresh')} Oda değiştir</button>${r.checkIn < today() ? `<button class="btn sm danger" data-x="noshow">Gelmedi (no-show)</button>` : ''}</div>` : ''}
          <div class="row mt small">${['konaklama', 'cikis'].includes(r.status) ? `KBS giriş ${kbsBadge(r, 'giris')}${r.status === 'cikis' ? ` çıkış ${kbsBadge(r, 'cikis')}` : ''}` : ''} ${r.keycard ? badge('Kart ' + r.keycard, 'info') : ''} ${r.ebelge ? (NS.ebelge && NS.ebelge.statusBadge(r.ebelge.no)) || badge(r.ebelge.type + ' ' + r.ebelge.no, r.ebelge.test ? 'warn' : 'ok') : ''} ${r.ota ? badge('OTA ' + r.ota, 'acc') : ''} ${r.precheck ? badge('Online ön check-in ✓', 'ok') : ''} ${r.depositRequest && !paid(r) ? badge('Kapora bekleniyor ' + money(r.depositRequest), 'warn') : ''}${r.cancel ? `<div class="small muted mt">İptal: ${esc(r.cancel.reason || '')} · ${NS.dt(r.cancel.at)}</div>` : ''}${(r.moves || []).map((m) => `<div class="small faint">Oda değişti: ${esc(m.from)} → ${esc(m.to)} · ${NS.date(m.date)}</div>`).join('')}</div></div></div>`,
      actions: [
        ...(['rezerve', 'opsiyon'].includes(r.status) ? [{ label: 'İptal et', cls: 'danger', onClick: (c) => { c(); cancelRes(app, r, 'iptal'); } }, { label: 'Giriş yap (check-in)', cls: 'ok', icon: 'key', onClick: (c) => { c(); checkIn(app, r); } }] : []),
        ...(r.status === 'konaklama' ? [{ label: 'Çıkış yap (check-out)', cls: 'primary', icon: 'logout', onClick: (c) => { c(); checkOut(app, r); } }] : []),
        { label: 'Folyo yazdır', icon: 'print', onClick: () => printFolio(r) },
        { label: r.billTo ? 'Fatura: ' + r.billTo.name.slice(0, 18) : 'Fatura bilgisi', icon: 'file', onClick: async (c) => { c(); await billTo(r); resDetail(app, r); } },
        ...(['rezerve', 'opsiyon'].includes(r.status) ? [{ label: 'Onay gönder', icon: 'send', onClick: async (c) => { c(); await sendConfirm(r); } }] : []),
        ...(r.status !== 'cikis' ? [{ label: 'Düzenle', icon: 'edit', onClick: (c) => { c(); resForm(app, r); } }] : []),
      ],
      onOpen: (b, close) => on(b, 'click', '[data-x]', async (e, t) => {
        close();
        if (t.dataset.x === 'charge') {
          const v = await formModal({ title: 'Harcama ekle', fields: [{ name: 'item', label: 'Kalem', type: 'select', options: db.all('extras').map((x) => ({ value: x.id, label: `${x.name} (${money(x.price)})` })).concat([{ value: '', label: 'Diğer' }]) }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }, { name: 'desc', label: 'Açıklama (Diğer için)' }, { name: 'amount', label: 'Tutar (Diğer için)', type: 'number' }] });
          if (!v) return;
          const x = db.get('extras', v.item);
          r.folio.push({ id: NS.uid(), date: today(), desc: x ? `${x.name}${v.qty > 1 ? ' ×' + v.qty : ''}` : v.desc || 'Ekstra', amount: x ? x.price * (v.qty || 1) : v.amount || 0, type: 'charge', vat: x && x.vat !== undefined && x.vat !== '' ? Number(x.vat) : vatExtra() });
          db.save(); resDetail(app, r);
        } else if (t.dataset.x === 'pay') { await takePayment(r); resDetail(app, r); }
        else if (t.dataset.x === 'pbx') { const x = NS.integ && (await NS.integ.call('santral', 'cagri-listesi', { room: room(r.room).no, from: r.checkedInAt })); if (x && x.ok) { if (x.simulated) { toast('TEST: santral simülasyonda — gerçek görüşme okunmadı, folyoya bir şey eklenmedi', 'warn'); return resDetail(app, r); } const calls = x.data && Array.isArray(x.data.calls) ? x.data.calls : []; const tariff = Number((NS.integ.cfg('santral') || {}).tariff) || 4; calls.forEach((cl) => r.folio.push({ id: NS.uid(), date: today(), desc: `Telefon ${cl.to} (${cl.min} dk)`, amount: r2(cl.min * tariff), type: 'charge' })); db.save(); toast(`${calls.length} görüşme folyoya aktarıldı`, 'ok'); } resDetail(app, r); }
        else if (t.dataset.x === 'card') { const n = await NS.prompt('Kaç kart kodlansın?', '1', { title: 'Oda kartı', type: 'number' }); if (n && NS.integ) { const x = await NS.integ.call('kapikilit', 'kart-kodla', { room: room(r.room).no, to: r.checkOut, count: Number(n) }, { silent: true }); if (x && x.simulated) { testMark(r, 'kart'); toast('TEST: kapı kilidi simülasyonda — kart KODLANMADI', 'warn'); } else if (x && x.ok) { r.keycard = x.ref; toast('Kart kodlandı', 'ok'); } else toast('Kart kodlanamadı: ' + ((x && x.error) || 'Kapı kilidi bağlantısı kapalı'), 'err'); db.save(); } resDetail(app, r); }
        else if (t.dataset.x === 'move') await moveRoom(app, r);
        else if (t.dataset.x === 'noshow') cancelRes(app, r, 'noshow');
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
    const pc = r.precheck || {};
    const v = await formModal({ title: `Check-in · ${g.name}${r.precheck ? ' (online ön check-in yapıldı)' : ''}`, fields: [{ name: 'idNo', label: 'TC kimlik / pasaport no', required: true }, { name: 'nat', label: 'Uyruk' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'phone', label: 'Telefon' }, { name: 'plate', label: 'Araç plakası' }, { name: 'others', label: 'Diğer konaklayanlar (ad soyad ; kimlik no — her satıra bir kişi)', type: 'textarea', full: true }, { name: 'kbs', label: 'KBS’ye giriş bildirimi yap', type: 'checkbox', value: on2('kbs') }, { name: 'card', label: 'Oda kartı kodla', type: 'checkbox', value: on2('kapikilit') }, { name: 'cards', label: 'Kart adedi', type: 'number', value: Math.max(1, r.adults || 1) }], values: { ...g, ...(r.precheck ? { idNo: pc.idNo, nat: pc.nat, birth: pc.birth, plate: pc.plate, others: pc.others } : {}) }, submitLabel: 'Girişi tamamla' });
    if (!v) return;
    Object.assign(g, { idNo: v.idNo, nat: v.nat, phone: v.phone, birth: v.birth });
    r.status = 'konaklama'; r.checkedInAt = new Date().toISOString(); r.plate = v.plate;
    r.companions = String(v.others || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const [name, id] = x.split(';').map((y) => (y || '').trim()); return { name, id }; });
    if (!stayLine(r)) r.folio.unshift({ id: NS.uid(), date: r.checkIn, desc: '', amount: 0, type: 'charge', stay: true, vat: vatStay() });
    syncStay(r);
    db.log('Check-in', `${rm.no} · ${g.name}`); db.save(); toast(`Oda ${rm.no} — hoş geldiniz ${g.name}`, 'ok');
    if (v.kbs) kbsSend(r, 'giris');
    if (v.card && NS.integ) NS.integ.call('kapikilit', 'kart-kodla', { room: rm.no, from: r.checkIn + 'T' + (S().checkInTime || '14:00'), to: r.checkOut + 'T' + (S().checkOutTime || '12:00'), count: Number(v.cards) || 1, guest: g.name }, { silent: true }).then((x) => { if (x && x.simulated) { testMark(r, 'kart'); toast('TEST: kapı kilidi simülasyonda — kart KODLANMADI', 'warn'); } else if (x && x.ok) r.keycard = x.ref; db.save(); });
    app.refresh();
  }
  // KBS (Emniyet / Jandarma) bildirimi: giriş, çıkış ve oda değişikliği
  const kbsBadge = (r, k) => (r.kbs && r.kbs[k] ? badge(r.kbs[k] === 'hata' ? 'Hata' : r.kbs[k], r.kbs[k] === 'hata' ? 'err' : 'ok') : r.test && r.test['kbs_' + k] ? badge('TEST — bildirilmedi', 'warn') : badge('Bildirilmedi', 'warn'));
  async function kbsSend(r, kind, quiet) {
    if (!NS.integ) return;
    const g = guest(r.guest);
    const res = await NS.integ.call('kbs', { giris: 'giris-bildirimi', cikis: 'cikis-bildirimi', oda: 'oda-degisikligi' }[kind], { no: r.no, room: room(r.room).no, guests: [{ name: g.name, id: g.idNo, nat: g.nat, birth: g.birth }, ...(r.companions || [])], checkIn: r.checkIn, checkOut: r.checkOut, plate: r.plate }, { silent: true });
    if (res && res.simulated) { testMark(r, 'kbs_' + kind); if (!quiet) toast('TEST: KBS simülasyonda — Emniyet/Jandarma’ya bildirim YAPILMADI', 'warn'); }
    else { r.kbs = r.kbs || {}; r.kbs[kind] = res && res.ok ? res.ref : 'hata'; if (!quiet) toast(res && res.ok ? 'KBS bildirimi yapıldı' : 'KBS bildirimi yapılamadı: ' + ((res && res.error) || 'KBS bağlantısı kapalı'), res && res.ok ? 'ok' : 'err'); }
    db.save();
    return res;
  }
  async function checkOut(app, r) {
    // Erken çıkış: gece sayısı ve folyo birlikte güncellenir (istenirse planlanan tutar korunur)
    if (r.checkOut > today() && today() > r.checkIn) {
      const planned = nights(r), real = daysBetween(r.checkIn, today());
      const ok = await confirm(`Misafir planlanandan erken çıkıyor: ${planned} gece yerine ${real} gece. Konaklama bedeli ${real} geceye göre güncellensin mi?`, { title: 'Erken çıkış', ok: `${real} gece hesapla`, danger: false });
      if (ok) { r.checkOut = today(); syncStay(r); db.save(); } else r.earlyOut = today();
    }
    if (balance(r) > 0) { toast(`Açık bakiye: ${money(balance(r))} — önce ödeme alın`, 'err'); await takePayment(r); if (balance(r) > 0) return; }
    r.status = 'cikis'; r.checkedOutAt = new Date().toISOString();
    room(r.room).hk = 'kirli';
    db.log('Check-out', `${room(r.room).no} · ${guest(r.guest).name}`); db.save(); toast('Çıkış tamamlandı, oda temizliğe alındı', 'ok');
    if (NS.integ && (NS.integ.isOn('kbs') || (r.kbs && r.kbs.giris))) await kbsSend(r, 'cikis');
    if (r.keycard && NS.integ) NS.integ.call('kapikilit', 'kart-iptal', { room: room(r.room).no, ref: r.keycard }, { silent: true });
    if (NS.integ && (await confirm('Konaklama faturası e-Fatura / e-Arşiv olarak kesilsin mi?', { ok: 'Fatura kes', danger: false, title: 'Fatura' }))) await invoice(r);
    printFolio(r); app.refresh();
  }
  // e-Fatura / e-Arşiv: her kalem kendi KDV oranıyla (KDV dahil tutardan) gönderilir
  async function invoice(r) {
    const tax = Number(S().tax) || 0; const prov = (NS.integ.cfg('efatura') || {}).provider;
    // Çekirdek UBL üreticisi konaklama vergisini (ayrı vergi kodu) henüz desteklemiyor: eksik vergili fatura gerçek entegratöre gönderilmez
    if (tax > 0 && prov && prov !== 'sim') return toast(`Fatura kesilmedi: konaklama vergisi (%${tax}) e-Fatura’da henüz gösterilemiyor. Faturayı entegratör panelinden kesin; bu özellik çekirdek güncellemesi bekliyor.`, 'err');
    if (tax > 0 && !(await confirm(`TEST faturasında konaklama vergisi (%${tax}) yer almayacak; yalnızca KDV gösterilir. Devam edilsin mi?`, { ok: 'TEST faturası oluştur', danger: false, title: 'Konaklama vergisi' }))) return;
    const g = guest(r.guest); const lines = r.folio.filter((f) => f.type === 'charge').map((f) => ({ name: f.desc, total: f.amount, vat: f.vat !== undefined ? f.vat : f.stay || /^Konaklama/.test(f.desc) ? vatStay() : vatExtra() }));
    const b = r.billTo;
    const x = await NS.integ.sendEInvoice({ buyer: b ? b.name : g.name, buyerVkn: b ? b.vkn : g.taxNo || g.idNo, buyerTaxOffice: b ? b.taxOffice : '', address: b ? b.address : '', district: b ? b.district : '', city: b ? b.city : '', buyerEmail: b ? b.email : g.email, no: r.no, total: sum(lines, (l) => l.total), lines });
    if (x && x.ok) { r.ebelge = { type: x.type, no: x.no, test: !!x.simulated }; db.save(); }
  }
  // İptal veya no-show: alınan kapora ya misafire iade edilir ya da iptal/no-show geliri olarak kalır
  async function cancelRes(app, r, kind) {
    const got = paid(r); const ns = kind === 'noshow';
    const v = await formModal({ title: ns ? `No-show · ${r.no}` : `Rezervasyonu iptal et · ${r.no}`, submitLabel: ns ? 'Gelmedi olarak işaretle' : 'İptal et', fields: [
      ...(ns ? [] : [{ name: 'reason', label: 'İptal nedeni', type: 'select', options: ['Misafir iptal etti', 'Kanal (OTA) iptali', 'Ödeme alınamadı', 'Opsiyon süresi doldu', 'Çift kayıt', 'Diğer'] }]),
      { name: 'note', label: 'Açıklama', full: true },
      ...(got > 0 ? [{ name: 'dep', label: `Alınan kapora ${money(got)}`, type: 'select', full: true, options: [{ value: 'keep', label: ns ? 'No-show ücreti olarak tut' : 'İptal ücreti olarak tut' }, { value: 'refund', label: 'Misafire iade et' }] }] : [{ name: 'fee', label: ns ? 'No-show ücreti (₺, isteğe bağlı)' : 'İptal ücreti (₺, isteğe bağlı)', type: 'number' }]),
    ] });
    if (!v) return;
    const stay = stayLine(r); if (stay) r.folio = r.folio.filter((f) => f !== stay);
    const feeDesc = ns ? 'No-show ücreti' : 'İptal ücreti';
    if (got > 0 && v.dep === 'refund') r.folio.push({ id: NS.uid(), date: today(), desc: 'Kapora iadesi', amount: got, type: 'refund' });
    else if (got > 0) r.folio.push({ id: NS.uid(), date: today(), desc: feeDesc, amount: got, type: 'charge', vat: vatStay() });
    else if (Number(v.fee) > 0) r.folio.push({ id: NS.uid(), date: today(), desc: feeDesc, amount: Number(v.fee), type: 'charge', vat: vatStay() });
    r.status = kind; r.cancel = { reason: ns ? 'Gelmedi (no-show)' : v.reason, note: v.note, at: new Date().toISOString(), by: NS.currentUser ? NS.currentUser.name : '' };
    db.log(ns ? 'No-show' : 'İptal', `${r.no} · ${r.cancel.reason}`); db.save();
    toast(ns ? 'No-show işlendi, oda satışa açıldı' : 'Rezervasyon iptal edildi', 'ok');
    if (balance(r) > 0) toast(`Açık bakiye: ${money(balance(r))} — tahsil edilmesi gerekiyor`, 'warn');
    app.refresh();
  }
  // Oda değiştirme: kalan geceler için boş oda; konaklayan misafirin eski odası kirliye alınır
  async function moveRoom(app, r, to) {
    const from = r.status === 'konaklama' && today() > r.checkIn ? today() : r.checkIn;
    const free = db.all('rooms', (x) => x.id !== r.room && x.hk !== 'arizali' && !clash(x.id, from, r.checkOut, r.id)).sort((a, b) => a.no.localeCompare(b.no));
    if (!free.length) return toast('Bu tarihler için boş oda yok', 'err');
    if (to && !free.some((x) => x.id === to)) return toast(`Oda ${room(to).no} bu tarihlerde boş değil`, 'err');
    const v = await formModal({ title: `Oda değiştir · ${room(r.room).no}`, submitLabel: 'Odayı değiştir', values: to ? { to } : {}, fields: [{ name: 'to', label: `Yeni oda (${NS.date(from)} → ${NS.date(r.checkOut)})`, type: 'select', full: true, options: free.map((x) => ({ value: x.id, label: `${x.no} · ${type(x.type).name}${x.hk === 'kirli' ? ' (kirli)' : ''}` })) }, { name: 'price', label: 'Gecelik fiyat (₺)', type: 'number', value: r.price }, { name: 'reason', label: 'Neden', full: true }] });
    if (!v) return;
    const old = room(r.room);
    if (r.status === 'konaklama') old.hk = 'kirli';
    r.moves = r.moves || []; r.moves.push({ date: today(), from: old.no, to: room(v.to).no, reason: v.reason });
    // Konaklama ortasında: geçen geceler eski odada kayıtlı kalır (takvim ve oda geçmişi doğru görünür)
    if (from > r.checkIn) { r.segs = r.segs || []; r.segs.push({ room: r.room, from: r.segs.length ? r.segs[r.segs.length - 1].to : r.checkIn, to: from }); }
    r.room = v.to; if (Number(v.price) > 0) r.price = Number(v.price); syncStay(r);
    db.log('Oda değişikliği', `${r.no} · ${old.no} → ${room(v.to).no}`); db.save(); toast(`Misafir ${room(v.to).no} numaralı odaya alındı`, 'ok');
    if (r.status === 'konaklama' && NS.integ && (NS.integ.isOn('kbs') || (r.kbs && r.kbs.giris))) await kbsSend(r, 'oda');
    app.refresh();
  }
  // Akıllı uyarılar: ön büronun gözden kaçırmaması gerekenler
  function alerts() {
    const t = today(), t3 = iso(addDays(new Date(), 3)), out = [];
    active().filter((r) => ['rezerve', 'opsiyon'].includes(r.status) && r.checkIn === t && guest(r.guest).note).forEach((r) => out.push({ k: 'VIP / not', c: 'acc', t: `${guest(r.guest).name} bugün geliyor — ${guest(r.guest).note}`, r: r.id }));
    active().filter((r) => r.status === 'opsiyon' && r.checkIn >= t && r.checkIn <= t3).forEach((r) => out.push({ k: 'Opsiyon', c: 'warn', t: `${r.no} · ${guest(r.guest).name}: girişe ${daysBetween(t, r.checkIn)} gün var, hâlâ onaylanmadı`, r: r.id }));
    active().filter((r) => r.depositRequest && !paid(r) && ['rezerve', 'opsiyon'].includes(r.status)).forEach((r) => out.push({ k: 'Kapora', c: 'warn', t: `${r.no} · ${guest(r.guest).name}: ${money(r.depositRequest)} kapora talebi ödenmedi`, r: r.id }));
    active().filter((r) => r.status === 'konaklama' && r.checkOut <= iso(addDays(new Date(), 1)) && balance(r) > 0).forEach((r) => out.push({ k: 'Bakiye', c: 'err', t: `${guest(r.guest).name} (oda ${room(r.room).no}) ${NS.date(r.checkOut)} çıkıyor, açık bakiye ${money(balance(r))}`, r: r.id }));
    active().filter((r) => r.status === 'konaklama' && NS.integ && NS.integ.isOn('kbs') && !(r.kbs && r.kbs.giris && r.kbs.giris !== 'hata')).forEach((r) => out.push({ k: 'KBS', c: 'err', t: `${guest(r.guest).name} (oda ${room(r.room).no}) KBS'ye bildirilmedi`, r: r.id }));
    db.all('rooms', (rm) => rm.hk === 'kirli').forEach((rm) => { const arr = active().find((r) => ['rezerve', 'opsiyon'].includes(r.status) && r.checkIn === t && r.room === rm.id); if (arr) out.push({ k: 'Temizlik', c: 'warn', t: `Oda ${rm.no} kirli ama bugün ${guest(arr.guest).name} gelecek`, r: arr.id }); });
    db.all('rooms', (rm) => rm.hk === 'arizali').forEach((rm) => { const arr = active().find((r) => ['rezerve', 'opsiyon'].includes(r.status) && r.room === rm.id && r.checkIn <= t3 && r.checkIn >= t); if (arr) out.push({ k: 'Arıza', c: 'err', t: `Oda ${rm.no} arızalı, ${NS.date(arr.checkIn)} tarihinde ${guest(arr.guest).name} gelecek — odayı değiştirin`, r: arr.id }); });
    // Aynı türden çok uyarı tek satırda toplanır (ör. 6 konaklayan KBS'ye bildirilmedi)
    const by = NS.groupBy(out, (a) => a.k);
    return Object.values(by).flatMap((g) => (g.length > 3 ? [{ k: g[0].k, c: g[0].c, t: `${g.length} kayıt — ${{ KBS: 'KBS’ye bildirilmedi', Bakiye: 'açık bakiyeyle çıkıyor', Kapora: 'kapora ödenmedi', Opsiyon: 'opsiyon onaylanmadı', 'VIP / not': 'notlu misafir bugün geliyor', Temizlik: 'oda kirli, misafir bugün geliyor', Arıza: 'arızalı odaya misafir gelecek' }[g[0].k] || ''}: ${g.slice(0, 3).map((a) => a.t.split(' ')[0] + ' ' + (a.t.split(' ')[1] || '')).join(', ')}…` }] : g));
  }
  // Doluluğa göre fiyat önerisi: önümüzdeki 30 günde dolulukları yüksek/düşük günler (yalnızca öneri; uygulanırsa sezon kaydı olarak eklenir)
  function priceAdvice(box, app) {
    const hi = Number(S().advHi) || 85, lo = Number(S().advLo) || 30, step = Number(S().advStep) || 10;
    const days = Array.from({ length: 30 }, (_, i) => iso(addDays(new Date(), i))).map((d) => ({ d, o: Math.round((occupiedOn(d).length / sellable()) * 100) }));
    const runs = []; days.forEach((x) => { const k = x.o >= hi ? 'up' : x.o <= lo && daysBetween(today(), x.d) <= 10 ? 'down' : ''; const lst = runs[runs.length - 1]; if (k && lst && lst.k === k && iso(addDays(lst.to, 1)) === x.d) { lst.to = x.d; lst.o.push(x.o); } else if (k) runs.push({ k, from: x.d, to: x.d, o: [x.o] }); });
    if (!runs.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="card"><div class="card-h"><h3>${icon('sparkles')} Doluluğa göre fiyat önerisi</h3><span class="small muted">Doluluk %${hi} üstü: +%${step} · 10 gün içinde %${lo} altı: −%${step} (Ayarlar’dan değiştirilebilir)</span></div><div class="card-b">${runs.map((x, i) => `<div class="list-item"><span class="grow">${NS.date(x.from)}${x.to !== x.from ? ' – ' + NS.date(x.to) : ''} · doluluk %${Math.min(...x.o)}–%${Math.max(...x.o)}</span>${badge(x.k === 'up' ? `+%${step} öneriliyor` : `−%${step} öneriliyor`, x.k === 'up' ? 'ok' : 'warn')}<button class="btn sm" data-adv="${i}">Uygula</button></div>`).join('')}</div></div>`;
    on(box, 'click', '[data-adv]', async (e, b) => { const x = runs[b.dataset.adv]; if (!(await confirm(`${NS.date(x.from)} – ${NS.date(x.to)} için tüm oda tiplerine ${x.k === 'up' ? '+' : '−'}%${step} sezon kaydı eklensin mi? (Mevcut sezonlarla toplanır; Sezonlar listesinden silebilirsiniz.)`, { ok: 'Ekle', danger: false, title: 'Fiyat önerisi' }))) return; db.insert('seasons', { name: `Doluluk önerisi ${x.k === 'up' ? '+' : '−'}%${step}`, from: x.from, to: x.to, pct: x.k === 'up' ? step : -step }); toast('Sezon kaydı eklendi; müsaitliği kanallara yeniden gönderin', 'ok'); app.refresh(); });
  }
  function isKat() { return !!(NS.currentUser && NS.currentUser.role === 'kat'); }
  function staff() { return db.all('users', (u) => u.role === 'kat' && u.active !== false); }
  // Şirket / acente adına fatura: e-Fatura alıcısı misafir yerine bu bilgiler olur
  async function billTo(r) {
    const v = await formModal({ title: 'Fatura bilgisi (şirket / acente)', submitLabel: 'Kaydet', fields: [{ name: 'name', label: 'Ünvan', required: true, full: true }, { name: 'vkn', label: 'VKN / TCKN', required: true }, { name: 'taxOffice', label: 'Vergi dairesi' }, { name: 'address', label: 'Adres', full: true }, { name: 'district', label: 'İlçe' }, { name: 'city', label: 'İl' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'clear', label: 'Fatura bilgisini kaldır (misafir adına kesilsin)', type: 'checkbox', full: true }], values: r.billTo || {} });
    if (!v) return;
    if (v.clear) delete r.billTo;
    else { const vk = String(v.vkn).replace(/\D/g, ''); if (![10, 11].includes(vk.length)) return toast('VKN 10, TCKN 11 haneli olmalı', 'err'); const { clear, ...b } = v; r.billTo = { ...b, vkn: vk }; }
    db.save(); toast('Fatura bilgisi kaydedildi', 'ok');
  }
  // Rezervasyon onayı: WhatsApp veya e-posta; bağlantı yoksa / gönderilemezse açıkça söylenir
  async function sendConfirm(r) {
    const g = guest(r.guest), s = S();
    const text = `Sayın ${g.name}, ${s.bizName} rezervasyonunuz: ${r.no} · ${NS.date(r.checkIn)} – ${NS.date(r.checkOut)} (${nights(r)} gece) · ${type(room(r.room).type).name} · ${BOARD[r.board]} · Toplam ${money(r.price * nights(r))}${paid(r) > 0 ? ` · Alınan kapora ${money(paid(r))}` : r.depositRequest ? ` · Kapora ${money(r.depositRequest)} bekleniyor` : ''}. Giriş ${s.checkInTime || '14:00'}, çıkış ${s.checkOutTime || '12:00'}. ${s.bizPhone || ''}`;
    const v = await formModal({ title: 'Rezervasyon onayı gönder', submitLabel: 'Gönder', fields: [{ name: 'ch', label: 'Kanal', type: 'select', options: [...(g.phone ? [{ value: 'wa', label: 'WhatsApp · ' + g.phone }] : []), ...(g.email || r.email ? [{ value: 'mail', label: 'E-posta · ' + (g.email || r.email) }] : [])] }, { name: 'text', label: 'Mesaj', type: 'textarea', full: true, value: text }] });
    if (!v) return; if (!v.ch) return toast('Misafirin telefonu veya e-postası yok', 'err');
    const x = v.ch === 'wa' ? await NS.integ.whatsapp(g.phone, v.text) : await NS.integ.email(g.email || r.email, `${s.bizName} · Rezervasyon ${r.no}`, v.text);
    const mode = (NS.integ.cfg(v.ch === 'wa' ? 'whatsapp' : 'email') || {}).mode;
    if (x && x.simulated) return toast('TEST: mesaj simülasyonda — misafire gönderilmedi', 'warn');
    if (x && x.ok && ['link', 'mailto'].includes(mode)) { toast(v.ch === 'wa' ? 'WhatsApp açıldı — mesajı oradan gönderin' : 'E-posta programı açıldı — oradan gönderin', 'ok'); return; }
    if (x && x.ok) { r.confirmSent = { ch: v.ch, at: new Date().toISOString() }; db.save(); toast('Onay gönderildi', 'ok'); } else toast('Gönderilemedi: ' + ((x && x.error) || 'bağlantı ayarlı değil — Entegrasyonlar sayfasından açın'), 'err');
  }
  // KBS yedeği / elle giriş için: şu an konaklayanların kimlik listesi
  function printGuestList() {
    const s = S(); const t = today(); const list = active().filter((r) => r.status === 'konaklama').sort((a, b) => room(a.room).no.localeCompare(room(b.room).no));
    const rows = list.flatMap((r) => { const g = guest(r.guest); return [{ r, name: g.name, id: g.idNo, nat: g.nat, birth: g.birth }, ...(r.companions || []).map((c) => ({ r, name: c.name, id: c.id, nat: '', birth: '' }))]; });
    NS.printHtml(`<div class="doc"><h2>${esc(s.bizName)}</h2><h3>KONAKLAYAN LİSTESİ — ${NS.date(t)} ${new Date().toTimeString().slice(0, 5)}</h3><table><tr><th>Oda</th><th>Ad soyad</th><th>TC / pasaport</th><th>Uyruk</th><th>Doğum</th><th>Giriş</th><th>Çıkış</th><th>Plaka</th><th>KBS</th></tr>${rows.map((x) => `<tr><td>${esc(room(roomOn(x.r, t)).no)}</td><td>${esc(x.name || '')}</td><td>${esc(x.id || '—')}</td><td>${esc(x.nat || '')}</td><td>${x.birth ? NS.date(x.birth) : ''}</td><td>${NS.date(x.r.checkIn)}</td><td>${NS.date(x.r.checkOut)}</td><td>${esc(x.r.plate || '')}</td><td>${x.r.kbs && x.r.kbs.giris && x.r.kbs.giris !== 'hata' ? 'Bildirildi' : 'BİLDİRİLMEDİ'}</td></tr>`).join('')}</table><p>${list.length} oda · ${rows.length} kişi</p></div>`, { title: 'Konaklayan listesi' });
  }
  // Gün sonu: gelmeyenler, açık çıkışlar, konaklanan odaların temizliğe alınması ve gün raporu
  async function nightAudit(app) {
    const t = today(); const all = db.all('reservations');
    const late = all.filter((r) => ['rezerve', 'opsiyon'].includes(r.status) && r.checkIn <= t);
    const dueOut = all.filter((r) => r.status === 'konaklama' && r.checkOut <= t);
    const stay = active().filter((r) => r.status === 'konaklama' && r.checkOut > t);
    const pays = all.flatMap((r) => r.folio.filter((f) => f.date === t && f.type === 'payment'));
    const refunds = all.flatMap((r) => r.folio.filter((f) => f.date === t && f.type === 'refund'));
    const ins = all.filter((r) => r.checkedInAt && r.checkedInAt.slice(0, 10) === t), outs = all.filter((r) => r.checkedOutAt && r.checkedOutAt.slice(0, 10) === t);
    const ns = all.filter((r) => r.status === 'noshow' && r.cancel && r.cancel.at.slice(0, 10) === t), cx = all.filter((r) => r.status === 'iptal' && r.cancel && r.cancel.at.slice(0, 10) === t);
    const byM = NS.groupBy(pays, (f) => f.method || 'diger');
    const occ = occupiedOn(t).length;
    const report = `<h3>GÜN SONU RAPORU — ${NS.date(t)}</h3><table><tr><td>Doluluk</td><td style="text-align:right">%${Math.round((occ / sellable()) * 100)} (${occ}/${sellable()} oda)</td></tr><tr><td>Giriş yapan</td><td style="text-align:right">${ins.length}</td></tr><tr><td>Çıkış yapan</td><td style="text-align:right">${outs.length}</td></tr><tr><td>No-show / iptal</td><td style="text-align:right">${ns.length} / ${cx.length}</td></tr>${Object.entries(byM).map(([k, v]) => `<tr><td>Tahsilat · ${esc(METHOD[k] || k)}</td><td style="text-align:right">${money(sum(v, (f) => f.amount))}</td></tr>`).join('')}<tr><td>İade</td><td style="text-align:right">−${money(sum(refunds, (f) => f.amount))}</td></tr><tr><td><b>Net tahsilat</b></td><td style="text-align:right"><b>${money(sum(pays, (f) => f.amount) - sum(refunds, (f) => f.amount))}</b></td></tr><tr><td>Konaklayanların açık bakiyesi</td><td style="text-align:right">${money(sum(active().filter((r) => r.status === 'konaklama'), (r) => Math.max(0, balance(r))))}</td></tr></table>`;
    modal({
      title: 'Gün sonu', size: 'wide',
      body: `${late.length ? `<div class="card pad mb" style="border-color:var(--warn)"><b>${late.length} rezervasyon bugün/önceden gelmesi gerekirken giriş yapmadı</b><div class="small muted">İşaretlenenler no-show yapılır (kapora seçimi sorulmaz; kapora varsa no-show ücreti olarak kalır). Bugün gelecek olanları işaretlemeyin.</div>${late.map((r) => `<label class="check small mt"><input type="checkbox" data-ns="${r.id}" ${r.checkIn < t ? 'checked' : ''}> ${esc(r.no)} · ${esc(guest(r.guest).name)} · Oda ${room(r.room).no} · giriş ${NS.date(r.checkIn)}</label>`).join('')}</div>` : ''}
        ${dueOut.length ? `<div class="card pad mb" style="border-color:var(--err)"><b>${dueOut.length} misafirin çıkışı bugün ama çıkış yapılmadı</b>${dueOut.map((r) => `<div class="small">${esc(guest(r.guest).name)} · Oda ${room(r.room).no} · bakiye ${money(balance(r))}</div>`).join('')}<div class="small muted">Gün sonundan önce çıkış yapın ya da konaklamayı uzatın.</div></div>` : ''}
        <label class="check mb"><input type="checkbox" id="dirty" checked> Konaklama süren ${stay.length} odayı yarın sabah için "Kirli" yap (günlük temizlik)</label>
        <div class="card pad" style="background:var(--surface-2)">${report}</div>`,
      actions: [{ label: 'Vazgeç' }, { label: 'Raporu yazdır', icon: 'print', onClick: () => NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2>${report}</div>`, { title: 'Gün sonu ' + t }) }, {
        label: 'Gün sonunu tamamla', cls: 'primary', icon: 'check', onClick: (close, b) => {
          let n = 0; $$('[data-ns]', b).forEach((c) => { if (!c.checked) return; const r = db.get('reservations', c.dataset.ns); const st = stayLine(r); if (st) r.folio = r.folio.filter((f) => f !== st); const got = paid(r); if (got > 0) r.folio.push({ id: NS.uid(), date: t, desc: 'No-show ücreti', amount: got, type: 'charge', vat: vatStay() }); r.status = 'noshow'; r.cancel = { reason: 'Gelmedi (no-show) — gün sonu', at: new Date().toISOString(), by: NS.currentUser ? NS.currentUser.name : '' }; n++; });
          if ($('#dirty', b).checked) stay.forEach((r) => { const rm = room(roomOn(r, t)); if (rm.hk === 'temiz') rm.hk = 'kirli'; });
          db.saveSettings({ lastAudit: t }); db.log('Gün sonu', `${NS.date(t)} · ${n} no-show`); db.save(); close(); toast(`Gün sonu tamamlandı${n ? ` · ${n} no-show` : ''}`, 'ok'); app.refresh();
        },
      }],
    });
  }
  // Grup rezervasyonu: tek misafir/grup adına, oda tipine göre adetle birden çok oda
  async function groupForm(app) {
    const types = db.all('types');
    const v = await formModal({ title: 'Grup rezervasyonu', size: 'wide', submitLabel: 'Odaları ayır', fields: [
      { name: 'guest', label: 'Grup sorumlusu (misafir)', type: 'select', required: true, empty: 'Seçin...', options: db.all('guests').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((g) => ({ value: g.id, label: `${g.name} · ${g.phone || ''}` })) },
      { name: 'group', label: 'Grup adı', required: true, placeholder: 'ör. ABC Ltd. bayi toplantısı' },
      { name: 'checkIn', label: 'Giriş', type: 'date', required: true, value: today() }, { name: 'checkOut', label: 'Çıkış', type: 'date', required: true, value: iso(addDays(new Date(), 2)) },
      { name: 'board', label: 'Pansiyon', type: 'select', options: Object.entries(BOARD).map(([value, label]) => ({ value, label })) }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Telefon', 'Acente', 'Web sitesi', 'Kapıdan'] },
      { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'opsiyon', label: 'Opsiyonlu' }, { value: 'rezerve', label: 'Rezerve' }] }, { name: 'disc', label: 'Grup indirimi %', type: 'number' },
      { type: 'section', label: 'Oda adetleri' }, ...types.map((t) => ({ name: 'n_' + t.id, label: `${t.name} (${money(t.price)})`, type: 'number', min: 0 })),
    ] });
    if (!v) return;
    if (v.checkOut <= v.checkIn) return toast('Çıkış tarihi girişten sonra olmalı', 'err');
    const want = types.map((t) => ({ t, n: Number(v['n_' + t.id]) || 0 })).filter((x) => x.n > 0); if (!want.length) return toast('En az bir oda adedi girin', 'err');
    const plan = [], short = [];
    want.forEach(({ t, n }) => { const free = db.all('rooms', (r) => r.type === t.id && r.hk !== 'arizali' && !clash(r.id, v.checkIn, v.checkOut)).sort((a, b) => a.no.localeCompare(b.no)); if (free.length < n) short.push(`${t.name}: ${n} istendi, ${free.length} boş`); plan.push(...free.slice(0, n).map((r) => ({ r, t }))); });
    if (short.length && !(await confirm(`Yeterli boş oda yok — ${short.join(' · ')}. Bulunan ${plan.length} oda ayrılsın mı?`, { ok: 'Bulunanları ayır', danger: false, title: 'Grup rezervasyonu' }))) return;
    if (!plan.length) return;
    const gid = NS.uid();
    plan.forEach(({ r, t }) => { const price = Math.round(suggestPrice(t.id, v.checkIn, v.checkOut) * (1 - (Number(v.disc) || 0) / 100) / 10) * 10; db.insert('reservations', { no: db.nextNo('res', 'R'), room: r.id, guest: v.guest, checkIn: v.checkIn, checkOut: v.checkOut, adults: Math.min(2, t.capacity || 2), children: 0, board: v.board, source: v.source, status: v.status, price, deposit: 0, folio: [], group: v.group, groupId: gid, created: new Date().toISOString() }, true); });
    db.log('Grup rezervasyonu', `${v.group} · ${plan.length} oda`); db.save(); toast(`${v.group}: ${plan.length} oda ayrıldı (${plan.map((x) => x.r.no).join(', ')})`, 'ok'); app.refresh();
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
    const total = sellable();
    const occ = occupiedOn(t).length; const late = overdue();
    const next14 = Array.from({ length: 14 }, (_, i) => { const d = iso(addDays(new Date(), i)); return { label: d.slice(8) + '.' + d.slice(5, 7), value: Math.round((occupiedOn(d).length / total) * 100) }; });
    const adr = occ ? sum(occupiedOn(t), (r) => r.price) / occ : 0;
    el.innerHTML = pageHead('Ön Büro Özeti', NS.dateLong(new Date()), `<a class="btn" href="rezervasyon.html" target="_blank" rel="noopener">${icon('globe')} Rezervasyon motoru</a><button class="btn" id="audit">${icon('moon')} Gün sonu${S().lastAudit === t ? ' ✓' : ''}</button><button class="btn" id="grp">${icon('users')} Grup rezervasyonu</button><button class="btn primary" id="nr">${icon('plus')} Yeni rezervasyon</button>`) + `
      <div class="grid g4 mb">${kpi('Doluluk (bu gece)', `%${Math.round((occ / total) * 100)}`, 'bed', '', `<div class="small faint">${occ} / ${total} oda</div>`)}${kpi('Bugün giriş', arr.length, 'key', 'info')}${kpi('Bugün çıkış', dep.length, 'logout', 'warn')}${kpi('Ortalama oda fiyatı (ADR)', money(adr), 'wallet', 'ok')}</div>
      <div class="grid g3 mb">
        <div class="card"><div class="card-h"><h3>${icon('key')} Bugün gelecekler</h3></div><div class="card-b">${arr.map((r) => `<div class="list-item"><div class="grow"><b>${esc(guest(r.guest).name)}</b><div class="small muted">Oda ${room(r.room).no} · ${nights(r)} gece · ${esc(r.source)}</div></div><button class="btn sm ok" data-ci="${r.id}">Giriş</button></div>`).join('') || '<div class="faint small">Bugün giriş yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('logout')} Bugün ayrılacaklar</h3></div><div class="card-b">${dep.map((r) => `<div class="list-item"><div class="grow"><b>${esc(guest(r.guest).name)}</b><div class="small muted">Oda ${room(r.room).no} · bakiye ${money(balance(r))}</div></div><button class="btn sm primary" data-co="${r.id}">Çıkış</button></div>`).join('') || '<div class="faint small">Bugün çıkış yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('sparkles')} Kat hizmetleri</h3></div><div class="card-b">${Object.entries(HK).map(([k, v]) => `<div class="list-item"><span class="grow">${badge(v[0], v[1])}</span><b>${db.all('rooms', (r) => r.hk === k).length} oda</b></div>`).join('')}<a class="btn sm block mt" href="#/odalar">Oda durumlarını aç</a></div></div>
      </div>
      ${(() => { const al = alerts(); return al.length ? `<div class="card mb"><div class="card-h"><h3>${icon('bell')} Dikkat (${al.length})</h3></div><div class="card-b">${al.map((a) => `<div class="list-item small"${a.r ? ` data-r="${a.r}" style="cursor:pointer"` : ''}>${badge(a.k, a.c)}<span class="grow">${esc(a.t)}</span></div>`).join('')}</div></div>` : ''; })()}
      ${late.length ? `<div class="card mb" style="border-color:var(--err)"><div class="card-h"><h3>${icon('alert')} Gelmeyenler — giriş tarihi geçti (${late.length})</h3><span class="small muted">Oda bu misafir için kapalı duruyor; giriş yapın, iptal edin veya no-show işaretleyin</span></div><div class="card-b">${late.map((r) => `<div class="list-item"><div class="grow"><b>${esc(guest(r.guest).name)}</b><div class="small muted">${esc(r.no)} · Oda ${room(r.room).no} · giriş ${NS.date(r.checkIn)} · ${esc(r.source)}</div></div><button class="btn sm" data-r="${r.id}">Aç</button><button class="btn sm danger" data-ns="${r.id}">No-show</button></div>`).join('')}</div></div>` : ''}
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Önümüzdeki 14 gün doluluk (%)</h3></div><div class="card-b">${chart.bars(next14, { format: (v) => '%' + v })}</div></div>
      <div class="card"><div class="card-h"><h3>Konaklayanlar (${inh.length})</h3></div><div class="card-b" style="max-height:280px;overflow:auto">${inh.map((r) => `<div class="list-item small" data-r="${r.id}" style="cursor:pointer"><b style="min-width:36px">${room(r.room).no}</b><span class="grow">${esc(guest(r.guest).name)}</span><span class="faint">${NS.date(r.checkOut)}</span></div>`).join('')}</div></div></div>`;
    $('#nr', el).onclick = () => resForm(app);
    $('#audit', el).onclick = () => nightAudit(app);
    $('#grp', el).onclick = () => groupForm(app);
    on(el, 'click', '[data-ci]', (e, t) => checkIn(app, db.get('reservations', t.dataset.ci)));
    on(el, 'click', '[data-co]', (e, t) => checkOut(app, db.get('reservations', t.dataset.co)));
    on(el, 'click', '[data-r]', (e, t) => resDetail(app, db.get('reservations', t.dataset.r)));
    on(el, 'click', '[data-ns]', (e, t) => cancelRes(app, db.get('reservations', t.dataset.ns), 'noshow'));
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
      <p class="small muted mb">Boş bir hücreye tıklayarak o oda ve tarihten rezervasyon açın. Çubukları sürükleyerek oda veya tarih değiştirin.</p>
      <div class="card gantt-wrap"><div class="gantt" id="gt" style="grid-template-columns:${LABW}px repeat(${gDays}, ${COLW}px);grid-auto-rows:${ROWH}px">
        <div class="rl corner h" style="justify-content:flex-start">Oda</div>
        ${days.map((d) => { const dt = new Date(d + 'T12:00'); return `<div class="h ${d === today() ? 'td' : ''} ${[0, 6].includes(dt.getDay()) ? 'we' : ''}">${NS.DAYS[dt.getDay()].slice(0, 2)}<br>${dt.getDate()}</div>`; }).join('')}
        ${rooms.map((r) => `<div class="rl"><b>${r.no}</b><span class="small faint" style="overflow:hidden;text-overflow:ellipsis">${esc(type(r.type).name)}</span>${r.hk !== 'temiz' ? `<span class="dot ${r.hk === 'kirli' ? 'warn' : 'err'}" title="${HK[r.hk][0]}"></span>` : ''}</div>${days.map((d) => `<div class="c ${d === today() ? 'td' : ''}" data-cell="${r.id}|${d}"></div>`).join('')}`).join('')}
      </div></div>`;
    const gt = $('#gt', el);
    const end = iso(addDays(gStart, gDays));
    const put = (roomId, from, to, cls, html, title, data) => {
      const ri = rooms.findIndex((x) => x.id === roomId); if (ri < 0 || from >= end || to <= gStart) return;
      const s = Math.max(0, daysBetween(gStart, from)), e = Math.min(gDays, daysBetween(gStart, to));
      const bar = document.createElement('div'); bar.className = 'bar ' + cls; Object.assign(bar.dataset, data);
      bar.style.cssText = `left:${LABW + s * COLW + COLW / 2}px;top:${ROWH * (ri + 1) + 6}px;width:${Math.max(COLW, (e - s) * COLW) - 4}px`;
      bar.innerHTML = html; bar.title = title; gt.appendChild(bar);
    };
    active().filter((r) => r.checkIn < end && r.checkOut > gStart).forEach((r) => {
      const name = `${r.status === 'konaklama' ? icon('user') : ''}<span>${esc(guest(r.guest).name)}</span>`; const ttl = `${guest(r.guest).name} · ${NS.date(r.checkIn)}-${NS.date(r.checkOut)} · ${r.source}${r.group ? ' · Grup: ' + r.group : ''}`;
      (r.segs || []).forEach((sg) => put(sg.room, sg.from, sg.to, r.status + ' seg', name, ttl + ' (önceki oda)', { r: r.id }));
      const from = (r.segs || []).length ? r.segs[r.segs.length - 1].to : r.checkIn;
      put(r.room, from, r.checkOut, r.status, name, ttl + (['rezerve', 'opsiyon', 'konaklama'].includes(r.status) ? ' — sürükleyerek taşıyın' : ''), { r: r.id, drag: ['rezerve', 'opsiyon', 'konaklama'].includes(r.status) ? '1' : '' });
    });
    db.all('blocks', (b) => b.from < end && b.to > gStart).forEach((b) => put(b.room, b.from, b.to, 'blok', `${icon('x')}<span>${esc(b.reason || 'Satışa kapalı')}</span>`, `Satışa kapalı: ${b.reason || ''} (${NS.date(b.from)}–${NS.date(b.to)}) — kaldırmak için tıklayın`, { blk: b.id }));
    // Sürükle-bırak: rezervasyon yeni oda/tarihe, konaklayan misafir yalnızca yeni odaya taşınır
    let drag = null;
    gt.addEventListener('pointerdown', (e) => { const bar = e.target.closest('[data-drag="1"]'); if (!bar || e.button) return; const rb = bar.getBoundingClientRect(); drag = { bar, x: e.clientX, y: e.clientY, off: Math.max(0, Math.floor((e.clientX - rb.left + COLW / 2) / COLW)), moved: false }; bar.setPointerCapture(e.pointerId); });
    gt.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; if (drag.moved) { drag.bar.style.transform = `translate(${dx}px,${dy}px)`; drag.bar.style.opacity = '.75'; drag.bar.style.zIndex = 6; } });
    gt.addEventListener('pointerup', async (e) => {
      if (!drag) return; const d = drag; drag = null; if (!d.moved) return;
      d.bar.style.visibility = 'hidden'; const cell = document.elementFromPoint(e.clientX, e.clientY); d.bar.style.visibility = '';
      d.bar.style.transform = ''; d.bar.style.opacity = ''; d.bar.style.zIndex = ''; d.bar.dataset.justDragged = '1'; setTimeout(() => delete d.bar.dataset.justDragged, 50);
      const c = cell && cell.closest('[data-cell]'); if (!c) return;
      const r = db.get('reservations', d.bar.dataset.r); const [rid, day] = c.dataset.cell.split('|');
      if (r.status === 'konaklama') { if (rid === r.room) return; return moveRoom(app, r, rid); }
      const ci = iso(addDays(day, -d.off)), n = nights(r), co = iso(addDays(ci, n));
      if (rid === r.room && ci === r.checkIn) return;
      const k = clash(rid, ci, co, r.id); if (k) return toast(clashText(k), 'err');
      if (!(await confirm(`${r.no} · ${guest(r.guest).name}: Oda ${room(rid).no}, ${NS.date(ci)} → ${NS.date(co)} olarak taşınsın mı?`, { ok: 'Taşı', danger: false, title: 'Rezervasyonu taşı' }))) return;
      const keepPrice = type(room(rid).type).id === type(room(r.room).type).id;
      Object.assign(r, { room: rid, checkIn: ci, checkOut: co }); if (!keepPrice) r.price = suggestPrice(type(room(rid).type).id, ci, co, r.adults, r.children);
      db.log('Rezervasyon taşındı', `${r.no} → ${room(rid).no} ${ci}`); db.save(); toast(keepPrice ? 'Taşındı' : `Taşındı — oda tipi değiştiği için fiyat ${money(r.price)} olarak güncellendi`, 'ok'); app.refresh();
    });
    on(el, 'click', '[data-g]', (e, t) => { const n = Number(t.dataset.g); gStart = n === 0 ? iso(addDays(new Date(), -3)) : iso(addDays(gStart, n)); app.refresh(); });
    on(el, 'click', '[data-n]', (e, t) => { gDays = Number(t.dataset.n); app.refresh(); });
    $('#gd', el).onchange = (e) => { gStart = e.target.value; app.refresh(); };
    $('#nr', el).onclick = () => resForm(app);
    on(el, 'click', '[data-r]', (e, t) => { if (!t.dataset.justDragged) resDetail(app, db.get('reservations', t.dataset.r)); });
    on(el, 'click', '[data-blk]', async (e, t) => { const b = db.get('blocks', t.dataset.blk); if (await confirm(`Oda ${room(b.room).no} için "${b.reason || 'satışa kapalı'}" kaydı kaldırılsın mı?`, { ok: 'Kaldır' })) { db.remove('blocks', b.id); app.refresh(); } });
    on(el, 'click', '[data-cell]', (e, t) => { const [rid, d] = t.dataset.cell.split('|'); resForm(app, { room: rid, checkIn: d, checkOut: iso(addDays(d, 1)) }); });
    const w = $('.gantt-wrap', el); w.scrollLeft = 0;
  }

  // ---------- Odalar / Housekeeping ----------
  function roomsPage(el, p, app) {
    let fl = '', mine = isKat();
    const draw = () => {
      const t = today();
      const list = db.all('rooms', (r) => (!fl || String(r.floor) === fl) && (!mine || r.assignee === (NS.currentUser || {}).id)).sort((a, b) => a.no.localeCompare(b.no));
      el.innerHTML = pageHead('Odalar & Kat Hizmetleri', 'Odaya tıklayarak temizlik durumunu değiştirin', `<div class="seg"><button data-f="" class="${!fl ? 'active' : ''}">Tümü</button>${[...new Set(db.all('rooms').map((r) => r.floor))].map((f) => `<button data-f="${f}" class="${fl === String(f) ? 'active' : ''}">${f}. kat</button>`).join('')}</div>${isKat() ? `<button class="btn ${mine ? 'primary' : ''}" id="mine">${icon('user')} Bana atananlar</button>` : `<button class="btn" id="asg">${icon('users')} Görev dağıt</button><button class="btn" id="allc">${icon('check')} Boş kirli odaları temiz yap</button><button class="btn primary" id="add">${icon('plus')} Oda ekle</button>`}`) +
        `<div class="row mb">${Object.entries(HK).map(([k, v]) => badge(`${v[0]}: ${db.all('rooms', (r) => r.hk === k).length}`, v[1])).join(' ')} <span class="small muted"><span class="dot" style="background:var(--accent)"></span> Dolu oda</span></div>
        <div class="rooms">${list.map((r) => { const occ = occupiedOn(t).find((x) => roomOn(x, t) === r.id); return `<div class="room ${r.hk} ${occ ? 'dolu' : ''}" data-room="${r.id}"><span class="no">${r.no}</span><span class="small muted">${esc(type(r.type).name)}</span>${badge(HK[r.hk][0], HK[r.hk][1])}${occ ? `<span class="small"><b>${esc(guest(occ.guest).name)}</b><br><span class="faint">çıkış ${NS.date(occ.checkOut)}</span></span>` : '<span class="small faint">Boş</span>'}${r.note ? `<span class="small" style="color:var(--err)">${esc(r.note)}</span>` : ''}${r.assignee ? `<span class="small faint">${icon('user')} ${esc((db.get('users', r.assignee) || {}).name || '')}</span>` : ''}${db.all('blocks', (b) => b.from <= t && t < b.to && b.room === r.id).map((b) => badge('Satışa kapalı · ' + NS.date(b.to) + ' kadar', 'err')).join('')}</div>`; }).join('') || `<div class="empty">${mine ? 'Size atanmış oda yok' : 'Oda yok'}</div>`}</div>`;
    };
    on(el, 'click', '[data-f]', (e, t2) => { fl = t2.dataset.f; draw(); });
    on(el, 'click', '[data-room]', async (e, t) => {
      const r = db.get('rooms', t.dataset.room);
      // Kat görevlisi: tek dokunuşla "temizlendi"
      if (isKat() && r.hk === 'kirli') { if (await confirm(`Oda ${r.no} temizlendi mi?`, { ok: 'Temizlendi', danger: false, title: 'Kat hizmetleri' })) { r.hk = 'temiz'; r.cleanedAt = new Date().toISOString(); r.cleanedBy = NS.currentUser.name; db.log('Oda temizlendi', r.no); db.save(); draw(); } return; }
      const v = await formModal({ title: `Oda ${r.no}`, fields: [{ name: 'hk', label: 'Temizlik durumu', type: 'select', options: Object.entries(HK).map(([value, x]) => ({ value, label: x[0] })) }, { name: 'assignee', label: 'Kat görevlisi', type: 'select', empty: '— atanmadı —', options: staff().map((u) => ({ value: u.id, label: u.name })) }, { name: 'type', label: 'Oda tipi', type: 'select', options: db.all('types').map((x) => ({ value: x.id, label: x.name })) }, { name: 'note', label: 'Not / arıza', full: true }, { type: 'section', label: 'Satışa kapat (bakım, tadilat)' }, { name: 'bFrom', label: 'Başlangıç', type: 'date' }, { name: 'bTo', label: 'Bitiş (bu gün dahil değil)', type: 'date' }, { name: 'bWhy', label: 'Neden', full: true }], values: r });
      if (!v) return;
      const { bFrom, bTo, bWhy, ...rv } = v;
      if (bFrom || bTo) {
        if (!bFrom || !bTo || bTo <= bFrom) return toast('Satışa kapatma için başlangıç ve daha sonraki bir bitiş tarihi girin', 'err');
        const c = clash(r.id, bFrom, bTo); if (c) return toast(c.block ? 'Bu aralıkta zaten kapalı kayıt var' : `Bu aralıkta rezervasyon var: ${guest(c.guest).name} (${NS.date(c.checkIn)}) — önce taşıyın`, 'err');
        db.insert('blocks', { room: r.id, from: bFrom, to: bTo, reason: bWhy || 'Bakım' }); toast(`Oda ${r.no} ${NS.date(bFrom)}–${NS.date(bTo)} satışa kapatıldı`, 'ok');
      }
      if (rv.hk === 'temiz' && r.hk !== 'temiz') { rv.cleanedAt = new Date().toISOString(); rv.cleanedBy = NS.currentUser ? NS.currentUser.name : ''; }
      db.update('rooms', r.id, rv); db.log('Oda durumu', `${r.no} → ${HK[rv.hk][0]}`); draw();
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('#mine')) { mine = !mine; draw(); return; }
      if (e.target.closest('#asg')) { const dirty = db.all('rooms', (r) => r.hk === 'kirli').sort((a, b) => a.no.localeCompare(b.no)); if (!dirty.length) return toast('Kirli oda yok', 'ok'); if (!staff().length) return toast('Önce Ayarlar > Kullanıcılar’dan "Kat Hizmetleri" rolünde kullanıcı ekleyin', 'warn'); formModal({ title: 'Görev dağıt — kirli odalar', fields: dirty.map((r) => ({ name: r.id, label: `Oda ${r.no} · ${r.floor}. kat`, type: 'select', empty: '— atanmadı —', options: staff().map((u) => ({ value: u.id, label: u.name })) })), values: Object.fromEntries(dirty.map((r) => [r.id, r.assignee || ''])) }).then((v) => { if (!v) return; Object.entries(v).forEach(([id, u]) => { db.get('rooms', id).assignee = u; }); db.save(); toast('Görevler dağıtıldı', 'ok'); draw(); }); }
      if (e.target.closest('#allc')) { const busy = occupiedOn(today()).map((x) => x.room); db.all('rooms', (r) => r.hk === 'kirli' && !busy.includes(r.id)).forEach((r) => { r.hk = 'temiz'; }); db.save(); toast('Odalar temiz olarak işaretlendi', 'ok'); draw(); }
      if (e.target.closest('#add')) formModal({ title: 'Yeni oda', fields: [{ name: 'no', label: 'Oda no', required: true }, { name: 'floor', label: 'Kat', type: 'number', value: 1 }, { name: 'type', label: 'Tip', type: 'select', options: db.all('types').map((x) => ({ value: x.id, label: x.name })) }] }).then((v) => { if (v) { db.insert('rooms', { ...v, hk: 'temiz', note: '' }); draw(); } });
    });
    draw();
  }

  // ---------- Listeler ----------
  function listPage(el, p, app) {
    let q = '', st = '';
    el.innerHTML = pageHead('Rezervasyonlar', 'Tüm rezervasyonlar, kaynaklar ve bakiyeler', `<button class="btn" id="ex">${icon('download')} Dışa aktar</button><button class="btn primary" id="nr">${icon('plus')} Yeni</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Misafir, oda, rezervasyon no...')}<div class="seg">${[['', 'Tümü'], ['rezerve', 'Gelecek'], ['konaklama', 'Konaklayan'], ['cikis', 'Çıkış'], ['iptal', 'İptal'], ['noshow', 'No-show']].map(([k, l]) => `<button data-s="${k}" class="${k === st ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
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
    el.innerHTML = pageHead('Oda Tipleri & Fiyatlar', 'Baz fiyatlar, sezon artışları ve ekstra hizmetler') + `<div id="sug" class="mb"></div><div class="grid g2"><div id="a"></div><div id="b"></div></div><div id="c" class="mt"></div>`;
    priceAdvice($('#sug', el), app);
    NS.crud($('#a', el), app, { col: 'types', title: 'Oda tipleri', single: 'Oda tipi', addLabel: 'Yeni tip', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'capacity', label: 'Kapasite', type: 'number' }, { name: 'price', label: 'Gecelik baz fiyat', type: 'number', required: true }, { name: 'weekendPct', label: 'Hafta sonu farkı % (cuma, cumartesi)', type: 'number' }, { name: 'minNights', label: 'En az konaklama (gece)', type: 'number' }, { name: 'baseOcc', label: 'Fiyata dahil kişi', type: 'number', hint: 'Boşsa kapasite' }, { name: 'extraAdult', label: 'Ek yetişkin (₺/gece)', type: 'number' }, { name: 'extraChild', label: 'Çocuk (₺/gece)', type: 'number' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Tip', render: (t) => `<b>${esc(t.name)}</b><div class="small faint">${[t.weekendPct ? 'H.sonu +%' + t.weekendPct : '', t.minNights ? 'en az ' + t.minNights + ' gece' : '', t.extraAdult ? 'ek kişi ' + money(t.extraAdult) : ''].filter(Boolean).join(' · ')}</div>` }, { key: 'capacity', label: 'Kişi', cls: 'right' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (t) => money(t.price) }, { label: 'Oda', cls: 'right', render: (t) => db.all('rooms', (r) => r.type === t.id).length }] });
    NS.crud($('#b', el), app, { col: 'seasons', title: 'Sezonlar', single: 'Sezon', addLabel: 'Yeni sezon', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'from', label: 'Başlangıç', type: 'date', required: true }, { name: 'to', label: 'Bitiş', type: 'date', required: true }, { name: 'pct', label: 'Fiyat artışı %', type: 'number', required: true }], columns: [{ key: 'name', label: 'Sezon', render: (s) => `<b>${esc(s.name)}</b>` }, { label: 'Tarih', render: (s) => `${NS.date(s.from)} – ${NS.date(s.to)}` }, { key: 'pct', label: 'Artış', cls: 'right', render: (s) => badge('+%' + s.pct, 'warn') }] });
    NS.crud($('#c', el), app, { col: 'extras', title: 'Ekstra hizmetler', single: 'Hizmet', addLabel: 'Yeni hizmet', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'price', label: 'Fiyat (KDV dahil)', type: 'number', required: true }, { name: 'vat', label: 'KDV %', type: 'select', options: [{ value: '', label: 'Ayarlardaki varsayılan' }, 0, 1, 10, 20] }], columns: [{ key: 'name', label: 'Hizmet', render: (x) => `<b>${esc(x.name)}</b>` }, { key: 'price', label: 'Fiyat', cls: 'right', render: (x) => money(x.price) }, { label: 'KDV', cls: 'right', render: (x) => '%' + (x.vat !== undefined && x.vat !== '' ? x.vat : vatExtra()) }] });
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    let days = 30;
    const draw = () => {
      const from = iso(addDays(new Date(), -days)), to = today();
      const total = sellable();
      let roomNights = 0, revenue = 0;
      const series = [];
      for (let d = from; d < to; d = iso(addDays(d, 1))) { const o = occupiedOn(d); roomNights += o.length; revenue += sum(o, (r) => r.price); series.push({ d, occ: Math.round((o.length / total) * 100), rev: sum(o, (r) => r.price) }); }
      const avail = total * days;
      const res = active().filter((r) => r.checkIn >= from && r.checkIn < to);
      const bySrc = NS.groupBy(res, (r) => r.source);
      const byNat = NS.groupBy(res, (r) => guest(r.guest).nat || '?');
      const byType = NS.groupBy(res, (r) => type(room(r.room).type).name);
      const moves = db.all('reservations').flatMap((r) => r.folio.filter((f) => f.date >= from && f.date <= to && (f.type === 'payment' || f.type === 'refund')).map((f) => ({ ...f, no: r.no, guest: guest(r.guest).name })));
      const pays = moves.filter((f) => f.type === 'payment'), refunds = moves.filter((f) => f.type === 'refund');
      const byMethod = NS.groupBy(pays, (f) => f.method || 'diger');
      el.innerHTML = pageHead('Raporlar', 'Doluluk, ADR, RevPAR ve kanal analizi', `<div class="seg">${[30, 90].map((d) => `<button data-d="${d}" class="${d === days ? 'active' : ''}">Son ${d} gün</button>`).join('')}</div>`) + `
        <div class="grid g4 mb">${kpi('Doluluk', '%' + Math.round((roomNights / avail) * 100), 'bed')}${kpi('ADR (ort. oda fiyatı)', money(roomNights ? revenue / roomNights : 0), 'wallet', 'info')}${kpi('RevPAR', money(revenue / avail), 'trend', 'ok')}${kpi('Konaklama geliri', money(revenue), 'cash', 'warn')}</div>
        <div class="card mb"><div class="card-h"><h3>Günlük doluluk (%)</h3></div><div class="card-b">${chart.line([{ name: 'Doluluk', values: series.map((x) => x.occ) }], series.map((x) => x.d.slice(8) + '.' + x.d.slice(5, 7)), { format: (v) => '%' + v })}</div></div>
        <div class="grid g3"><div class="card"><div class="card-h"><h3>Satış kanalları</h3></div><div class="card-b">${chart.donut(Object.entries(bySrc).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div>
        <div class="card"><div class="card-h"><h3>Misafir uyrukları</h3></div><div class="card-b">${chart.donut(Object.entries(byNat).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div>
        <div class="card"><div class="card-h"><h3>Oda tipine göre gelir</h3></div><div class="card-b">${chart.donut(Object.entries(byType).map(([label, v]) => ({ label, value: sum(v, (r) => r.price * nights(r)) })), { size: 130, format: money })}</div></div></div>
        <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Kasa — tahsilat (ödeme yöntemine göre)</h3><button class="btn sm" id="cx">${icon('download')} CSV</button></div><div class="card-b">${Object.entries(byMethod).map(([k, v]) => `<div class="list-item"><span class="grow">${esc(METHOD[k] || k)}</span><span class="faint small">${v.length} işlem</span><b>${money(sum(v, (x) => x.amount))}</b></div>`).join('') || '<div class="faint small">Bu dönemde tahsilat yok</div>'}${refunds.length ? `<div class="list-item"><span class="grow">İadeler</span><b style="color:var(--warn)">−${money(sum(refunds, (x) => x.amount))}</b></div>` : ''}<div class="list-item"><b class="grow">Net</b><b>${money(sum(pays, (x) => x.amount) - sum(refunds, (x) => x.amount))}</b></div></div></div>
        <div class="card"><div class="card-h"><h3>İleriye dönük doluluk (defterdeki rezervasyonlar)</h3></div><div class="card-b">${[7, 30, 60, 90].map((n) => { let rn = 0, rv = 0; for (let i = 0; i < n; i++) { const o = occupiedOn(iso(addDays(new Date(), i))); rn += o.length; rv += sum(o, (r) => r.price); } return `<div class="list-item"><span class="grow">Önümüzdeki ${n} gün</span><span class="small faint">${money(rv)}</span><b>%${Math.round((rn / (total * n)) * 100)}</b></div>`; }).join('')}</div></div></div>`;
      $('#cx', el).onclick = () => NS.csv('kasa', [...pays, ...refunds], [{ key: 'date', label: 'Tarih' }, { key: 'no', label: 'Rezervasyon' }, { key: 'guest', label: 'Misafir' }, { key: 'desc', label: 'Açıklama' }, { label: 'Yöntem', value: (x) => (x.type === 'refund' ? 'İade' : METHOD[x.method] || x.method || '') }, { label: 'Tutar', value: (x) => (x.type === 'refund' ? -x.amount : x.amount) }]);
    };
    on(el, 'click', '[data-d]', (e, t) => { days = Number(t.dataset.d); draw(); });
    draw();
  }

  const ROLES = { admin: 'Yönetici', resepsiyon: 'Resepsiyon', kat: 'Kat Hizmetleri' };
  const METHOD = { kart: 'Kredi kartı', nakit: 'Nakit', havale: 'Havale / EFT', doviz: 'Döviz', diger: 'Diğer' };
  const app = NS.shell({
    id: 'otel', integrations: ['printer', 'pos', 'efatura', 'payment', 'sms', 'whatsapp', 'email', 'webhook', 'backup'], name: 'Otel', tagline: 'Otel & Pansiyon Yönetimi', icon: 'bed', accent: '#0891b2', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Ön Büro' }, { id: 'ozet', label: 'Ön Büro Özeti', icon: 'home', roles: ['resepsiyon'] }, { id: 'takvim', label: 'Rezervasyon Takvimi', icon: 'calendar', roles: ['resepsiyon'] }, { id: 'rezervasyonlar', label: 'Rezervasyonlar', icon: 'list', roles: ['resepsiyon'] }, { id: 'misafirler', label: 'Misafirler', icon: 'users', roles: ['resepsiyon'] }, { id: 'odalar', label: 'Odalar & Housekeeping', icon: 'sparkles' }, { id: 'kanal', label: 'Kanal & KBS', icon: 'globe', roles: ['resepsiyon'] }, { sec: 'Yönetim' }, { id: 'fiyatlar', label: 'Oda Tipleri & Fiyatlar', icon: 'tag', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { kanal: channelPage, ozet: dashboard, takvim: ganttPage, rezervasyonlar: listPage, misafirler: guestsPage, odalar: roomsPage, fiyatlar: pricingPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Otel ayarları' }, { name: 'checkInTime', label: 'Giriş saati', type: 'time' }, { name: 'checkOutTime', label: 'Çıkış saati', type: 'time' }, { name: 'tax', label: 'Konaklama vergisi % (e-Fatura’da henüz gösterilemiyor — mali müşavirinize danışın)', type: 'number' }, { name: 'vatStay', label: 'Konaklama KDV % (boşsa 10)', type: 'number' }, { name: 'vatExtra', label: 'Ekstra hizmet KDV % (boşsa 20)', type: 'number' }, { type: 'section', label: 'Web sitesi rezervasyon motoru (rezervasyon.html)' }, { name: 'directDiscount', label: 'Doğrudan rezervasyon indirimi %', type: 'number' }, { name: 'otaMarkup', label: 'OTA fiyat farkı % (karşılaştırma için)', type: 'number' }, { name: 'hbPrice', label: 'Yarım pansiyon kişi/gece (₺)', type: 'number' }, { name: 'freeCancelDays', label: 'Ücretsiz iptal (gün önce)', type: 'number' }, { type: 'section', label: 'Fiyat önerisi' }, { name: 'advHi', label: 'Yüksek doluluk eşiği % (boşsa 85)', type: 'number' }, { name: 'advLo', label: 'Düşük doluluk eşiği % (boşsa 30)', type: 'number' }, { name: 'advStep', label: 'Önerilen değişim % (boşsa 10)', type: 'number' }] }) },
  });
  if (NS.currentUser && NS.currentUser.role === 'kat' && !location.hash.includes('odalar')) app.go('odalar');
})();
