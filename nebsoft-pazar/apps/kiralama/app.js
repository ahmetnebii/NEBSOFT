/* NEBSOFT Araç Kiralama — filo, müsaitlik takvimi, sözleşme, teslim/iade kontrolü, bakım ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const EXTRAS = [{ id: 'bebek', name: 'Bebek koltuğu', daily: 150 }, { id: 'surucu', name: 'Ek sürücü', daily: 200 }, { id: 'sigorta', name: 'Mini hasar sigortası', daily: 350 }, { id: 'navi', name: 'Navigasyon', daily: 100 }, { id: 'zincir', name: 'Kar zinciri', daily: 80 }];

  function seed(db) {
    db.data._settings = { bizName: 'Yol Arkadaşı Rent a Car', bizPhone: '0242 555 11 22', bizAddress: 'Antalya Havalimanı Dış Hatlar karşısı', kmLimit: 300, extraKm: 6, fuelFee: 400, minAge: 21, minLicense: 2 };
    db.data.users = [{ id: 'u1', name: 'Erkan Patron', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tuğba Ofis', role: 'ofis', pin: '1234', active: true }];
    const M = [['Fiat', 'Egea', 'Ekonomi', 'Dizel', 'Manuel', 1300, '#64748b'], ['Renault', 'Clio', 'Ekonomi', 'Benzin', 'Otomatik', 1450, '#dc2626'], ['Toyota', 'Corolla', 'Orta', 'Hibrit', 'Otomatik', 1900, '#2563eb'], ['Hyundai', 'i20', 'Ekonomi', 'Benzin', 'Otomatik', 1400, '#0891b2'], ['VW', 'Passat', 'Üst', 'Dizel', 'Otomatik', 2900, '#111827'], ['Peugeot', '3008', 'SUV', 'Dizel', 'Otomatik', 3200, '#16a34a'], ['Dacia', 'Duster', 'SUV', 'Dizel', 'Manuel', 2200, '#ca8a04'], ['Mercedes', 'Vito', 'Minibüs', 'Dizel', 'Otomatik', 4200, '#475569'], ['BMW', '320i', 'Lüks', 'Benzin', 'Otomatik', 5200, '#1d4ed8'], ['Renault', 'Megane', 'Orta', 'Dizel', 'Otomatik', 1800, '#9333ea']];
    const cars = [];
    M.forEach((m, i) => { for (let k = 0; k < (i < 4 ? 2 : 1); k++) cars.push({ id: 'c' + cars.length, plate: `07 ${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))} ${rand(100, 999)}`, brand: m[0], model: m[1], cls: m[2], fuel: m[3], gear: m[4], daily: m[5], color: m[6], year: rand(2021, 2025), km: rand(12000, 95000), insuranceEnd: iso(addDays(new Date(), rand(5, 300))), inspectionEnd: iso(addDays(new Date(), rand(10, 600))), nextService: 0, status: 'aktif' }); });
    cars.forEach((c) => { c.nextService = Math.ceil(c.km / 15000) * 15000 + (Math.random() < 0.2 ? -14000 : 0); });
    cars[3].status = 'bakim';
    db.data.cars = cars;
    db.data.customers = NS.NAMES.map((n, i) => ({ id: 'm' + i, name: n, phone: NS.phone(), tc: String(rand(10000000000, 99999999999)), license: 'B-' + rand(100000, 999999), licenseDate: `${rand(1995, 2021)}-${NS.pad(rand(1, 12))}-01`, birth: `${rand(1965, 2002)}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, blacklist: i === 7 }));
    const rents = [];
    const free = (car, a, b) => !rents.some((r) => r.car === car && r.status !== 'iptal' && r.from < b && a < r.to);
    let no = 4000;
    for (let k = 0; k < 120; k++) {
      const car = pick(cars); if (car.status === 'bakim') continue;
      const s = rand(-40, 25), n = rand(1, 9); const from = iso(addDays(new Date(), s)), to = iso(addDays(new Date(), s + n));
      if (!free(car.id, from, to)) continue;
      const status = to <= today() ? 'tamamlandi' : from <= today() ? 'kirada' : 'rezervasyon';
      const extras = EXTRAS.filter(() => Math.random() < 0.2).map((x) => x.id);
      const outKm = car.km - rand(500, 5000);
      rents.push({ id: 'r' + k, no: 'K' + ++no, car: car.id, customer: pick(db.data.customers.filter((c) => !c.blacklist)).id, from, to, fromTime: '10:00', toTime: '10:00', daily: car.daily, extras, deposit: car.daily * 3, status, outKm: status !== 'rezervasyon' ? outKm : null, outFuel: status !== 'rezervasyon' ? 4 : null, inKm: status === 'tamamlandi' ? outKm + rand(80, 300) * n : null, inFuel: status === 'tamamlandi' ? rand(2, 4) : null, damages: status === 'tamamlandi' && Math.random() < 0.08 ? [{ desc: 'Sağ arka çamurlukta çizik', cost: 2500 }] : [], channel: pick(['Web', 'Telefon', 'Acente', 'Havalimanı', 'Web']), payments: status === 'rezervasyon' ? [] : [{ amount: car.daily * n, type: pick(['kart', 'kart', 'nakit']), at: new Date(from + 'T10:00').toISOString() }], created: addDays(new Date(from), -rand(1, 15)).toISOString() });
    }
    db.data.rents = rents; db.data._meta._seq_rents = no;
    db.data.maint = cars.slice(0, 8).map((c) => ({ id: NS.uid(), car: c.id, date: iso(addDays(new Date(), -rand(10, 200))), km: c.km - rand(2000, 12000), type: pick(['Periyodik bakım', 'Lastik değişimi', 'Fren balatası', 'Klima gazı']), cost: rand(15, 90) * 100, note: '' }));
    db.data.maint.push({ id: NS.uid(), car: cars[3].id, date: today(), km: cars[3].km, type: 'Kaporta onarımı', cost: 0, note: 'Serviste — 2 gün sonra teslim', open: true });
  }
  const db = new NS.DB('kiralama', seed);
  const S = () => db.settings({ kmLimit: 300, extraKm: 6, fuelFee: 400 });
  const car = (id) => db.get('cars', id) || { plate: '-', brand: '', model: '' };
  const cust = (id) => db.get('customers', id) || { name: '-' };
  const ST = { rezervasyon: ['Rezervasyon', 'info'], kirada: ['Kirada', 'err'], tamamlandi: ['Tamamlandı', ''], iptal: ['İptal', ''] };
  const days = (r) => Math.max(1, daysBetween(r.from, r.to));
  const extraDaily = (r) => sum(EXTRAS.filter((x) => (r.extras || []).includes(x.id)), (x) => x.daily);
  function bill(r) {
    const s = S(); const d = days(r);
    const base = r.daily * d, ext = extraDaily(r) * d;
    const driven = r.inKm && r.outKm ? r.inKm - r.outKm : 0; const overKm = Math.max(0, driven - s.kmLimit * d);
    const kmFee = overKm * s.extraKm; const fuelFee = r.inFuel !== null && r.inFuel !== undefined && r.outFuel && r.inFuel < r.outFuel ? (r.outFuel - r.inFuel) * s.fuelFee : 0;
    const dmg = sum(r.damages || [], (x) => x.cost);
    const total = base + ext + kmFee + fuelFee + dmg; const paid = sum(r.payments || [], (p) => p.amount);
    return { d, base, ext, driven, overKm, kmFee, fuelFee, dmg, total, paid, due: total - paid };
  }
  const clash = (carId, from, to, ignore) => db.find('rents', (r) => r.id !== ignore && r.car === carId && r.status !== 'iptal' && r.from < to && from < r.to);
  const carName = (c) => `${c.brand} ${c.model}`;
  const fuelHtml = (n) => `<span class="fuel">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const alerts = () => db.all('cars').flatMap((c) => [
    ...(c.insuranceEnd <= iso(addDays(new Date(), 30)) ? [{ c, t: 'Sigorta', d: c.insuranceEnd }] : []),
    ...(c.inspectionEnd <= iso(addDays(new Date(), 30)) ? [{ c, t: 'Muayene', d: c.inspectionEnd }] : []),
    ...(c.km >= c.nextService - 1000 ? [{ c, t: 'Periyodik bakım', d: `${num(c.nextService)} km` }] : []),
  ]);

  // ---------- Kiralama formu ----------
  async function rentForm(app, rec = {}) {
    const isNew = !rec.id;
    const v = { from: today(), to: iso(addDays(new Date(), 3)), fromTime: '10:00', toTime: '10:00', extras: [], channel: 'Telefon', ...rec };
    modal({
      title: isNew ? 'Yeni kiralama / rezervasyon' : `Kiralama ${rec.no}`, size: 'wide',
      body: `<div class="form-grid"><div class="field full"><label>Müşteri *</label><div class="row nw"><select class="input" id="fc"><option value="">Seçin...</option>${db.all('customers').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => `<option value="${c.id}" ${c.id === v.customer ? 'selected' : ''}>${esc(c.name)}${c.blacklist ? ' ⛔ KARA LİSTE' : ''}</option>`).join('')}</select><button class="btn" id="fcn">${icon('plus')} Yeni</button></div><div class="small" id="fci"></div></div>
        <div class="field"><label>Alış tarihi</label><input class="input" type="date" id="ff" value="${v.from}"></div><div class="field"><label>İade tarihi</label><input class="input" type="date" id="ft" value="${v.to}"></div>
        <div class="field"><label>Araç * <span class="faint" id="fav"></span></label><select class="input" id="fa"></select></div><div class="field"><label>Günlük fiyat</label><input class="input" type="number" id="fp" value="${v.daily || ''}"></div>
        <div class="field full"><label>Ek hizmetler</label><div class="row">${EXTRAS.map((x) => `<label class="check"><input type="checkbox" data-ex="${x.id}" ${(v.extras || []).includes(x.id) ? 'checked' : ''}> ${x.name} (${money(x.daily)}/gün)</label>`).join('')}</div></div>
        <div class="field"><label>Kanal</label><select class="input" id="fch">${['Web', 'Telefon', 'Acente', 'Havalimanı', 'Ofis'].map((x) => `<option ${x === v.channel ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Depozito</label><input class="input" type="number" id="fd" value="${v.deposit || ''}"></div>
        <div class="full card pad" id="fs" style="background:var(--surface-2)"></div></div>`,
      onOpen: (b) => {
        const fill = () => {
          const f = $('#ff', b).value, t = $('#ft', b).value; const cur = $('#fa', b).value || v.car;
          const list = db.all('cars').map((c) => ({ c, busy: c.status === 'bakim' || !!clash(c.id, f, t, v.id) }));
          $('#fa', b).innerHTML = list.map(({ c, busy }) => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''} ${busy && c.id !== cur ? 'disabled' : ''}>${esc(c.plate)} · ${esc(carName(c))} · ${esc(c.cls)}${busy ? ' (dolu)' : ''}</option>`).join('');
          if (!$('#fa', b).value || list.find((x) => x.c.id === $('#fa', b).value).busy) { const fr = list.find((x) => !x.busy); if (fr) $('#fa', b).value = fr.c.id; }
          $('#fav', b).textContent = `(${list.filter((x) => !x.busy).length} müsait)`;
          if (!v.id || $('#fp', b).dataset.auto) { $('#fp', b).value = car($('#fa', b).value).daily; $('#fp', b).dataset.auto = '1'; }
          summ();
        };
        const summ = () => { const r = { from: $('#ff', b).value, to: $('#ft', b).value, daily: Number($('#fp', b).value) || 0, extras: $$('[data-ex]:checked', b).map((x) => x.dataset.ex) }; const x = bill(r); $('#fs', b).innerHTML = `<div class="row between"><span>${x.d} gün × ${money(r.daily)}</span><span>${money(x.base)}</span></div>${x.ext ? `<div class="row between small"><span>Ek hizmetler</span><span>${money(x.ext)}</span></div>` : ''}<div class="row between"><b>Toplam</b><b style="font-size:18px">${money(x.base + x.ext)}</b></div><div class="small muted">Günlük ${S().kmLimit} km dahil · aşım km başı ${money(S().extraKm)}</div>`; if (!$('#fd', b).value) $('#fd', b).value = r.daily * 3; };
        const ci = () => { const c = db.get('customers', $('#fc', b).value); if (!c) return ($('#fci', b).innerHTML = ''); const age = new Date().getFullYear() - Number(String(c.birth).slice(0, 4)); const lic = new Date().getFullYear() - Number(String(c.licenseDate).slice(0, 4)); const warn = []; if (c.blacklist) warn.push(badge('KARA LİSTEDE', 'err')); if (age < S().minAge) warn.push(badge(`Yaş ${age} < ${S().minAge}`, 'err')); if (lic < S().minLicense) warn.push(badge(`Ehliyet ${lic} yıllık`, 'warn')); $('#fci', b).innerHTML = `<span class="muted">Ehliyet ${esc(c.license)} · ${lic} yıl · ${age} yaş · ${db.all('rents', (r) => r.customer === c.id && r.status === 'tamamlandi').length} kiralama</span> ${warn.join(' ')}`; };
        $('#ff', b).onchange = () => { if ($('#ft', b).value <= $('#ff', b).value) $('#ft', b).value = iso(addDays($('#ff', b).value, 1)); fill(); };
        $('#ft', b).onchange = fill; $('#fa', b).onchange = () => { $('#fp', b).dataset.auto = '1'; fill(); }; $('#fp', b).oninput = () => { delete $('#fp', b).dataset.auto; summ(); };
        on(b, 'change', '[data-ex]', summ); $('#fc', b).onchange = ci;
        $('#fcn', b).onclick = async () => { const c = await formModal({ title: 'Yeni müşteri', fields: CF }); if (c) { const n = db.insert('customers', c); $('#fc', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)}</option>`); $('#fc', b).value = n.id; ci(); } };
        fill(); ci();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: isNew ? 'Kaydet' : 'Güncelle', cls: 'primary', icon: 'check', onClick: (close, b) => {
          const d = { customer: $('#fc', b).value, car: $('#fa', b).value, from: $('#ff', b).value, to: $('#ft', b).value, daily: Number($('#fp', b).value) || 0, extras: $$('[data-ex]:checked', b).map((x) => x.dataset.ex), channel: $('#fch', b).value, deposit: Number($('#fd', b).value) || 0 };
          if (!d.customer) return toast('Müşteri seçin', 'err');
          if (cust(d.customer).blacklist) return toast('Kara listedeki müşteriye kiralama yapılamaz', 'err');
          const c = clash(d.car, d.from, d.to, v.id); if (c) return toast(`Araç dolu: ${c.no}`, 'err');
          if (isNew) { const r = db.insert('rents', { ...d, no: db.nextNo('rents', 'K'), status: 'rezervasyon', fromTime: '10:00', toTime: '10:00', payments: [], damages: [] }); db.log('Rezervasyon', `${r.no} · ${car(d.car).plate}`); } else db.update('rents', v.id, d);
          close(); toast('Kaydedildi', 'ok'); app.refresh();
        },
      }],
    });
  }
  const CF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'tc', label: 'TC / pasaport' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'license', label: 'Ehliyet no' }, { name: 'licenseDate', label: 'Ehliyet tarihi', type: 'date' }, { name: 'blacklist', label: 'Kara liste', type: 'checkbox' }];

  function rentDetail(app, r) {
    const c = car(r.car), m = cust(r.customer), x = bill(r);
    modal({
      title: `${r.no} · ${carName(c)} (${c.plate})`, size: 'wide',
      body: `<div class="grid g2"><div class="col"><div class="row">${badge(ST[r.status][0], ST[r.status][1])} ${badge(r.channel, 'acc')}</div>
          <div class="list-item"><span class="grow muted">Müşteri</span><b>${esc(m.name)}</b></div><div class="list-item"><span class="grow muted">Telefon</span>${esc(m.phone)}</div><div class="list-item"><span class="grow muted">Tarih</span><b>${NS.date(r.from)} → ${NS.date(r.to)} (${x.d} gün)</b></div>
          <div class="list-item"><span class="grow muted">Ek hizmet</span>${EXTRAS.filter((e) => (r.extras || []).includes(e.id)).map((e) => badge(e.name)).join(' ') || '-'}</div>
          ${r.outKm ? `<div class="list-item"><span class="grow muted">Teslim</span>${num(r.outKm)} km · ${fuelHtml(r.outFuel)}</div>` : ''}${r.inKm ? `<div class="list-item"><span class="grow muted">İade</span>${num(r.inKm)} km · ${fuelHtml(r.inFuel)} · ${num(x.driven)} km yapıldı</div>` : ''}
          ${(r.damages || []).map((d) => `<div class="list-item" style="color:var(--err)"><span class="grow">${icon('alert')} ${esc(d.desc)}</span><b>${money(d.cost)}</b></div>`).join('')}</div>
        <div class="card pad" style="background:var(--surface-2)"><h3 class="mb">Hesap</h3><div class="row between"><span>Kira (${x.d} gün)</span><span>${money(x.base)}</span></div>${x.ext ? `<div class="row between"><span>Ek hizmetler</span><span>${money(x.ext)}</span></div>` : ''}${x.kmFee ? `<div class="row between"><span>Km aşımı (${num(x.overKm)} km)</span><span>${money(x.kmFee)}</span></div>` : ''}${x.fuelFee ? `<div class="row between"><span>Eksik yakıt</span><span>${money(x.fuelFee)}</span></div>` : ''}${x.dmg ? `<div class="row between"><span>Hasar</span><span>${money(x.dmg)}</span></div>` : ''}<hr><div class="row between"><b>Toplam</b><b>${money(x.total)}</b></div><div class="row between small"><span>Ödenen</span><span>${money(x.paid)}</span></div><div class="row between"><b>Kalan</b><b style="font-size:20px;color:${x.due > 0 ? 'var(--err)' : 'var(--ok)'}">${money(x.due)}</b></div><div class="small muted mt">Depozito: ${money(r.deposit || 0)}</div></div></div>`,
      actions: [
        ...(r.status === 'rezervasyon' ? [{ label: 'İptal', cls: 'danger', onClick: (cl) => { r.status = 'iptal'; db.save(); cl(); app.refresh(); } }, { label: 'Düzenle', icon: 'edit', onClick: (cl) => { cl(); rentForm(app, r); } }, { label: 'Aracı teslim et', cls: 'primary', icon: 'key', onClick: (cl) => { cl(); handOut(app, r); } }] : []),
        ...(r.status === 'kirada' ? [{ label: 'İade al', cls: 'primary', icon: 'check', onClick: (cl) => { cl(); takeBack(app, r); } }] : []),
        ...(x.due > 0 && r.status !== 'rezervasyon' ? [{ label: 'Ödeme al', icon: 'cash', onClick: async (cl) => { cl(); const v = await formModal({ title: 'Ödeme', fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: x.due }, { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit', 'havale'] }] }); if (v) { r.payments.push({ ...v, at: new Date().toISOString() }); db.save(); app.refresh(); } } }] : []),
        { label: 'Sözleşme', icon: 'print', onClick: () => printContract(r) },
      ],
    });
  }
  async function handOut(app, r) {
    const c = car(r.car);
    const v = await formModal({ title: `Teslim — ${c.plate}`, fields: [{ name: 'km', label: 'Çıkış km', type: 'number', value: c.km, required: true }, { name: 'fuel', label: 'Yakıt seviyesi', type: 'select', options: [{ value: 4, label: 'Dolu' }, { value: 3, label: '3/4' }, { value: 2, label: '1/2' }, { value: 1, label: '1/4' }] }, { name: 'pay', label: 'Peşin tahsilat (₺)', type: 'number', value: bill(r).base + bill(r).ext }, { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit', 'havale'] }, { name: 'note', label: 'Mevcut hasar notu', full: true }], submitLabel: 'Teslim et' });
    if (!v) return;
    Object.assign(r, { status: 'kirada', outKm: v.km, outFuel: Number(v.fuel), outNote: v.note });
    if (v.pay > 0) r.payments.push({ amount: v.pay, type: v.type, at: new Date().toISOString() });
    db.log('Araç teslim', `${r.no} · ${c.plate}`); db.save(); toast('Araç teslim edildi', 'ok');
    // Emniyet kiralık araç bildirimi ve GPS takibinde kiralama başlangıcı
    if (NS.integ) { const m = cust(r.customer); if (NS.integ.isOn('aracbildirim')) NS.integ.call('aracbildirim', 'kiralama-bildir', { plate: c.plate, contract: r.no, from: r.from, to: r.to, renter: { name: m.name, tc: m.tc || m.idNo, license: m.license, phone: m.phone } }, { silent: true }).then((x) => { if (x) { r.emniyet = x.ok ? x.ref : 'hata'; db.save(); } }); if (NS.integ.isOn('gps')) NS.integ.call('gps', 'kiralama-basla', { plate: c.plate, contract: r.no }, { silent: true }); }
    printContract(r); app.refresh();
  }
  // İade sırasında HGS/OGS geçişleri ve GPS km bilgisi
  async function tollsAndGps(r, c) {
    if (!NS.integ) return { tolls: [], km: null };
    let tolls = [], km = null;
    if (NS.integ.isOn('hgs')) { const x = await NS.integ.call('hgs', 'gecis-sorgu', { plate: c.plate, from: r.from, to: today() }, { silent: true }); tolls = x && x.data && Array.isArray(x.data.passes) ? x.data.passes : x && x.simulated ? [{ place: 'Osmangazi Köprüsü', date: r.from, amount: 995 }, { place: 'Kuzey Marmara Otoyolu', date: today(), amount: 182.5 }].slice(0, rand(0, 2)) : []; }
    if (NS.integ.isOn('gps')) { const x = await NS.integ.call('gps', 'km-sorgu', { plate: c.plate }, { silent: true }); km = x && x.data && x.data.km ? Number(x.data.km) : null; }
    return { tolls, km };
  }
  async function takeBack(app, r) {
    const c = car(r.car);
    const v = await formModal({ title: `İade — ${c.plate}`, fields: [{ name: 'km', label: `Dönüş km (çıkış ${num(r.outKm)})`, type: 'number', required: true, value: r.outKm + 300 * days(r) }, { name: 'fuel', label: 'Yakıt', type: 'select', options: [{ value: 4, label: 'Dolu' }, { value: 3, label: '3/4' }, { value: 2, label: '1/2' }, { value: 1, label: '1/4' }] }, { name: 'dmg', label: 'Yeni hasar açıklaması (yoksa boş)' }, { name: 'dmgCost', label: 'Hasar bedeli (₺)', type: 'number', value: 0 }] });
    if (!v) return;
    if (v.km < r.outKm) return toast('Dönüş km çıkış km\'den küçük olamaz', 'err');
    Object.assign(r, { inKm: v.km, inFuel: Number(v.fuel) });
    if (v.dmg) r.damages = [...(r.damages || []), { desc: v.dmg, cost: v.dmgCost || 0 }];
    c.km = v.km;
    const tg = await tollsAndGps(r, c);
    if (tg.tolls.length) { r.damages = [...(r.damages || []), ...tg.tolls.map((t) => ({ desc: `HGS/OGS: ${t.place} (${NS.date(t.date)})`, cost: t.amount }))]; toast(`${tg.tolls.length} köprü/otoyol geçişi sözleşmeye eklendi`, 'ok'); }
    if (tg.km && Math.abs(tg.km - v.km) > 50) toast(`Uyarı: GPS km (${num(tg.km)}) ile girilen km (${num(v.km)}) farklı`, 'err');
    if (NS.integ && NS.integ.isOn('aracbildirim')) NS.integ.call('aracbildirim', 'iade-bildir', { plate: c.plate, contract: r.no, at: new Date().toISOString() }, { silent: true });
    const x = bill(r);
    if (x.due > 0) { const p = await formModal({ title: `Kalan tahsilat ${money(x.due)}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: x.due }, { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit', 'havale'] }], submitLabel: 'Tahsil et ve kapat' }); if (!p) { db.save(); return app.refresh(); } r.payments.push({ ...p, at: new Date().toISOString() }); }
    r.status = 'tamamlandi'; if (r.to > today()) r.to = today() > r.from ? today() : r.to;
    db.log('Araç iade', `${r.no} · ${num(x.driven)} km`); db.save(); toast('İade tamamlandı', 'ok'); app.refresh();
  }
  function printContract(r) {
    const s = S(), c = car(r.car), m = cust(r.customer), x = bill(r);
    NS.printHtml(`<div class="doc"><h2>${esc(s.bizName)}</h2><div>${esc(s.bizAddress)} · ${esc(s.bizPhone)}</div><hr><h3>ARAÇ KİRALAMA SÖZLEŞMESİ — ${esc(r.no)}</h3>
      <table><tr><td><b>Kiracı:</b> ${esc(m.name)}<br>TC: ${esc(m.tc || '')}<br>Ehliyet: ${esc(m.license || '')}<br>Tel: ${esc(m.phone)}</td><td><b>Araç:</b> ${esc(carName(c))} (${esc(c.year)})<br>Plaka: ${esc(c.plate)}<br>${esc(c.fuel)} · ${esc(c.gear)}</td></tr>
      <tr><td><b>Alış:</b> ${NS.date(r.from)} ${r.fromTime || ''}<br>Çıkış km: ${r.outKm ? num(r.outKm) : '____'} · Yakıt: ${r.outFuel ? r.outFuel + '/4' : '____'}</td><td><b>İade:</b> ${NS.date(r.to)} ${r.toTime || ''}<br>Dönüş km: ${r.inKm ? num(r.inKm) : '____'} · Yakıt: ${r.inFuel ? r.inFuel + '/4' : '____'}</td></tr></table>
      <p>Kira: ${x.d} gün × ${money(r.daily)} = ${money(x.base)} ${x.ext ? `· Ek hizmetler ${money(x.ext)}` : ''} · Depozito ${money(r.deposit || 0)}</p><p style="font-size:11px">Günlük ${s.kmLimit} km dahildir; aşan her km için ${money(s.extraKm)} alınır. Araç aynı yakıt seviyesinde iade edilmelidir; eksik her çeyrek depo için ${money(s.fuelFee)} alınır. Trafik cezaları ve kiracı kusurlu hasarlar kiracıya aittir.</p>
      <p>Hasar kontrol:</p><div style="height:90px;border:1px dashed #999;border-radius:8px;padding:6px;font-size:11px">${esc(r.outNote || '')}</div><table style="margin-top:40px"><tr><td>Kiracı imza: __________</td><td style="text-align:right">Kiralayan: __________</td></tr></table></div>`, { title: r.no });
  }

  // ---------- Sayfalar ----------
  let gStart = iso(addDays(new Date(), -2));
  function calendarPage(el, p, app) {
    const N = 21, COLW = 44, ROWH = 46, LABW = 190;
    const ds = Array.from({ length: N }, (_, i) => iso(addDays(gStart, i)));
    const cars = db.all('cars').sort((a, b) => a.cls.localeCompare(b.cls, 'tr'));
    el.innerHTML = `<div class="row mb"><button class="btn icon" data-g="-7">${icon('left')}</button><button class="btn" data-g="0">Bugün</button><button class="btn icon" data-g="7">${icon('right')}</button><span class="grow"></span>${Object.entries(ST).slice(0, 3).map(([k, v]) => badge(v[0], v[1])).join(' ')} <span class="badge warn">Bakımda</span><button class="btn primary" id="nr">${icon('plus')} Kiralama</button></div>
      <div class="card gantt-wrap"><div class="gantt" id="gt" style="grid-template-columns:${LABW}px repeat(${N}, ${COLW}px);grid-auto-rows:${ROWH}px"><div class="rl corner h">Araç</div>${ds.map((d) => `<div class="h ${d === today() ? 'td' : ''}">${NS.DAYS[new Date(d + 'T12:00').getDay()].slice(0, 2)}<br>${Number(d.slice(8))}</div>`).join('')}
      ${cars.map((c) => `<div class="rl"><b>${esc(c.plate)}</b><span class="small faint">${esc(carName(c))} · ${esc(c.cls)}</span></div>${ds.map((d) => `<div class="c" data-cell="${c.id}|${d}"></div>`).join('')}`).join('')}</div></div>`;
    const gt = $('#gt', el); const end = iso(addDays(gStart, N));
    const put = (ri, s, e, cls, label, id) => { const b = document.createElement('div'); b.className = 'bar ' + cls; if (id) b.dataset.r = id; b.style.cssText = `left:${LABW + s * COLW + 2}px;top:${ROWH * (ri + 1) + 8}px;width:${Math.max(COLW, (e - s) * COLW) - 4}px`; b.textContent = label; gt.appendChild(b); };
    cars.forEach((c, ri) => {
      if (c.status === 'bakim') put(ri, 0, N, 'bakim', 'Bakımda');
      db.all('rents', (r) => r.car === c.id && r.status !== 'iptal' && r.from < end && r.to > gStart).forEach((r) => put(ri, Math.max(0, daysBetween(gStart, r.from)), Math.min(N, daysBetween(gStart, r.to)), r.status, cust(r.customer).name, r.id));
    });
    on(el, 'click', '[data-g]', (e, b) => { const n = Number(b.dataset.g); gStart = n === 0 ? iso(addDays(new Date(), -2)) : iso(addDays(gStart, n)); app.refresh(); });
    $('#nr', el).onclick = () => rentForm(app);
    on(el, 'click', '[data-r]', (e, b) => rentDetail(app, db.get('rents', b.dataset.r)));
    on(el, 'click', '[data-cell]', (e, b) => { const [cid, d] = b.dataset.cell.split('|'); rentForm(app, { car: cid, from: d, to: iso(addDays(d, 3)) }); });
  }
  function dashboard(el, p, app) {
    const t = today(); const cars = db.all('cars');
    const out = db.all('rents', (r) => r.status === 'rezervasyon' && r.from <= t), back = db.all('rents', (r) => r.status === 'kirada' && r.to <= t);
    const onRent = db.all('rents', (r) => r.status === 'kirada').length;
    const d30 = iso(addDays(new Date(), -30));
    const util = Math.round((sum(db.all('rents', (r) => r.status !== 'iptal' && r.to > d30 && r.from <= t), (r) => Math.max(0, daysBetween(r.from > d30 ? r.from : d30, r.to < t ? r.to : t))) / (cars.length * 30)) * 100);
    const al = alerts();
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/takvim">${icon('calendar')} Takvim</a><button class="btn primary" id="nr">${icon('plus')} Kiralama</button>`) + `
      <div class="grid g4 mb">${kpi('Kirada', `${onRent} / ${cars.length}`, 'car', 'err')}${kpi('Müsait', cars.filter((c) => c.status !== 'bakim').length - onRent, 'check', 'ok')}${kpi('30 gün kullanım', '%' + util, 'percent', 'info')}${kpi('30 gün ciro', money(sum(db.all('rents', (r) => r.status === 'tamamlandi' && r.to > d30), (r) => bill(r).total)), 'wallet', 'warn')}</div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>${icon('key')} Bugün teslim edilecek</h3></div><div class="card-b">${out.map((r) => `<div class="list-item"><div class="grow"><b>${esc(car(r.car).plate)}</b> ${esc(carName(car(r.car)))}<div class="small muted">${esc(cust(r.customer).name)} · ${r.channel}</div></div><button class="btn sm primary" data-o="${r.id}">Teslim</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('check')} Bugün iade alınacak</h3></div><div class="card-b">${back.map((r) => `<div class="list-item"><div class="grow"><b>${esc(car(r.car).plate)}</b><div class="small muted">${esc(cust(r.customer).name)} · ${NS.date(r.to)}</div></div><button class="btn sm" data-b="${r.id}">İade</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('alert')} Hatırlatmalar (${al.length})</h3></div><div class="card-b">${al.map((a) => `<div class="list-item small"><b style="min-width:84px">${esc(a.c.plate)}</b><span class="grow">${a.t}</span>${badge(String(a.d).includes('-') ? NS.date(a.d) : a.d, 'warn')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>
      <div class="card"><div class="card-h"><h3>Sınıflara göre ciro (90 gün)</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(db.all('rents', (r) => r.status === 'tamamlandi' && r.to > iso(addDays(new Date(), -90))), (r) => car(r.car).cls)).map(([k, v]) => ({ label: k, value: sum(v, (r) => bill(r).total) })), { format: money })}</div></div>`;
    $('#nr', el).onclick = () => rentForm(app);
    on(el, 'click', '[data-o]', (e, b) => handOut(app, db.get('rents', b.dataset.o)));
    on(el, 'click', '[data-b]', (e, b) => takeBack(app, db.get('rents', b.dataset.b)));
  }
  function rentsPage(el, p, app) {
    let q = '', f = '';
    el.innerHTML = pageHead('Kiralamalar', 'Rezervasyon, aktif ve tamamlanan kiralamalar', `<button class="btn primary" id="nr">${icon('plus')} Kiralama</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'No, plaka, müşteri...')}<div class="seg">${[['', 'Tümü'], ['rezervasyon', 'Rezervasyon'], ['kirada', 'Kirada'], ['tamamlandi', 'Tamamlanan']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const draw = () => { const rows = db.all('rents', (r) => (!f || r.status === f) && NS.match(q, r.no, car(r.car).plate, cust(r.customer).name)).sort((a, b) => b.from.localeCompare(a.from)); $('#t', el).innerHTML = table({ rows, columns: [{ label: 'No', render: (r) => `<b>${esc(r.no)}</b>` }, { label: 'Araç', render: (r) => `${esc(car(r.car).plate)}<div class="small faint">${esc(carName(car(r.car)))}</div>` }, { label: 'Müşteri', render: (r) => esc(cust(r.customer).name) }, { label: 'Tarih', render: (r) => `${NS.date(r.from)} → ${NS.date(r.to)}` }, { label: 'Gün', cls: 'right', render: days }, { label: 'Durum', render: (r) => badge(ST[r.status][0], ST[r.status][1]) }, { label: 'Tutar', cls: 'right', render: (r) => money(bill(r).total) }, { label: 'Kalan', cls: 'right', render: (r) => (bill(r).due > 0 && r.status !== 'rezervasyon' ? `<b style="color:var(--err)">${money(bill(r).due)}</b>` : '-') }], actions: [{ icon: 'eye', act: 'v' }], foot: `${rows.length} kiralama · ${money(sum(rows.filter((r) => r.status !== 'iptal'), (r) => bill(r).total))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => rentDetail(app, db.get('rents', b.dataset.id)));
    $('#nr', el).onclick = () => rentForm(app);
    draw();
  }
  function fleetPage(el, p, app) {
    NS.crud(el, app, {
      col: 'cars', title: 'Filo', sub: 'Araçlar, fiyatlar, km ve evrak tarihleri', single: 'Araç', addLabel: 'Yeni araç', emptyIcon: 'car',
      fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', required: true }, { name: 'model', label: 'Model', required: true }, { name: 'year', label: 'Yıl', type: 'number' }, { name: 'cls', label: 'Sınıf', type: 'select', options: ['Ekonomi', 'Orta', 'Üst', 'SUV', 'Lüks', 'Minibüs'] }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'Hibrit', 'Elektrik'] }, { name: 'gear', label: 'Vites', type: 'select', options: ['Manuel', 'Otomatik'] }, { name: 'daily', label: 'Günlük fiyat', type: 'number', required: true }, { name: 'km', label: 'Güncel km', type: 'number' }, { name: 'nextService', label: 'Sonraki bakım km', type: 'number' }, { name: 'insuranceEnd', label: 'Sigorta bitiş', type: 'date' }, { name: 'inspectionEnd', label: 'Muayene bitiş', type: 'date' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'aktif', label: 'Aktif' }, { value: 'bakim', label: 'Bakımda' }, { value: 'pasif', label: 'Satıldı / pasif' }] }, { name: 'color', label: 'Renk', type: 'color' }],
      sort: (a, b) => a.cls.localeCompare(b.cls, 'tr'), searchFields: (c) => [c.plate, c.brand, c.model],
      columns: [{ key: 'plate', label: 'Araç', render: (c) => `<div class="carcard"><div class="cc" style="background:${c.color}">${icon('car')}</div><div><b>${esc(c.plate)}</b><div class="small">${esc(carName(c))} · ${c.year}</div></div></div>` }, { key: 'cls', label: 'Sınıf', render: (c) => `${esc(c.cls)}<div class="small faint">${esc(c.fuel)} · ${esc(c.gear)}</div>` }, { key: 'daily', label: 'Günlük', cls: 'right', render: (c) => money(c.daily) }, { key: 'km', label: 'Km', cls: 'right', render: (c) => `${num(c.km)}${c.km >= c.nextService - 1000 ? `<div>${badge('Bakım zamanı', 'warn')}</div>` : ''}` }, { label: 'Evrak', render: (c) => `<div class="small">Sigorta ${c.insuranceEnd <= iso(addDays(new Date(), 30)) ? badge(NS.date(c.insuranceEnd), 'err') : NS.date(c.insuranceEnd)}</div><div class="small">Muayene ${c.inspectionEnd <= iso(addDays(new Date(), 30)) ? badge(NS.date(c.inspectionEnd), 'err') : NS.date(c.inspectionEnd)}</div>` }, { key: 'status', label: 'Durum', render: (c) => (c.status === 'bakim' ? badge('Bakımda', 'warn') : db.find('rents', (r) => r.car === c.id && r.status === 'kirada') ? badge('Kirada', 'err') : c.status === 'pasif' ? badge('Pasif') : badge('Müsait', 'ok')) }, { label: '90 gün ciro', cls: 'right', render: (c) => money(sum(db.all('rents', (r) => r.car === c.id && r.status === 'tamamlandi' && r.to > iso(addDays(new Date(), -90))), (r) => bill(r).total)) }],
    });
  }
  function maintPage(el, p, app) {
    NS.crud(el, app, {
      col: 'maint', title: 'Bakım & Masraf', sub: 'Servis, lastik, onarım kayıtları', single: 'Bakım', addLabel: 'Yeni kayıt', emptyIcon: 'wrench',
      fields: () => [{ name: 'car', label: 'Araç', type: 'select', options: db.all('cars').map((c) => ({ value: c.id, label: `${c.plate} · ${carName(c)}` })) }, { name: 'date', label: 'Tarih', type: 'date' }, { name: 'km', label: 'Km', type: 'number' }, { name: 'type', label: 'İşlem', type: 'select', options: ['Periyodik bakım', 'Lastik değişimi', 'Fren balatası', 'Kaporta onarımı', 'Cam değişimi', 'Klima gazı', 'Yıkama', 'Diğer'] }, { name: 'cost', label: 'Tutar', type: 'number' }, { name: 'note', label: 'Not', full: true }, { name: 'open', label: 'Araç hâlâ serviste', type: 'checkbox' }],
      defaults: { date: today() }, sort: (a, b) => b.date.localeCompare(a.date),
      onSave: (v) => { const c = car(v.car); if (v.open) c.status = 'bakim'; else if (c.status === 'bakim') c.status = 'aktif'; if (v.type === 'Periyodik bakım' && v.km) c.nextService = v.km + 15000; db.save(); },
      columns: [{ key: 'date', label: 'Tarih', render: (m) => NS.date(m.date) }, { label: 'Araç', render: (m) => `<b>${esc(car(m.car).plate)}</b> ${esc(carName(car(m.car)))}` }, { key: 'type', label: 'İşlem', render: (m) => `${esc(m.type)}${m.open ? ' ' + badge('Serviste', 'warn') : ''}` }, { key: 'km', label: 'Km', cls: 'right', render: (m) => num(m.km) }, { key: 'cost', label: 'Tutar', cls: 'right', render: (m) => money(m.cost) }],
    });
  }
  function reportsPage(el) {
    const cars = db.all('cars'); const d90 = iso(addDays(new Date(), -90));
    const rows = cars.map((c) => { const rs = db.all('rents', (r) => r.car === c.id && r.status === 'tamamlandi' && r.to > d90); const rev = sum(rs, (r) => bill(r).total), cost = sum(db.all('maint', (m) => m.car === c.id && m.date > d90), (m) => m.cost), dd = sum(rs, days); return { id: c.id, c, rev, cost, dd, util: Math.round((dd / 90) * 100) }; }).sort((a, b) => b.rev - a.rev);
    el.innerHTML = pageHead('Raporlar', 'Son 90 gün araç bazlı kârlılık ve kullanım') + `
      <div class="grid g4 mb">${kpi('Ciro', money(sum(rows, (r) => r.rev)), 'trend', 'ok')}${kpi('Bakım masrafı', money(sum(rows, (r) => r.cost)), 'wrench', 'err')}${kpi('Kiralanan gün', num(sum(rows, (r) => r.dd)), 'calendar', 'info')}${kpi('Ort. kullanım', '%' + Math.round(sum(rows, (r) => r.util) / rows.length), 'percent', 'warn')}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kanal dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(db.all('rents', (r) => r.status !== 'iptal' && r.from > d90), (r) => r.channel)).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div><div class="card"><div class="card-h"><h3>Araç kullanım oranı</h3></div><div class="card-b">${chart.bars(rows.slice(0, 12).map((r) => ({ label: r.c.model.slice(0, 7), value: r.util, color: r.c.color })), { format: (v) => '%' + v })}</div></div></div>
      <div class="card">${table({ rows, columns: [{ label: 'Araç', render: (r) => `<b>${esc(r.c.plate)}</b> ${esc(carName(r.c))}` }, { label: 'Gün', cls: 'right', render: (r) => r.dd }, { label: 'Kullanım', cls: 'right', render: (r) => badge('%' + r.util, r.util > 60 ? 'ok' : r.util > 30 ? 'warn' : 'err') }, { label: 'Ciro', cls: 'right', render: (r) => money(r.rev) }, { label: 'Masraf', cls: 'right', render: (r) => money(r.cost) }, { label: 'Net', cls: 'right', render: (r) => `<b>${money(r.rev - r.cost)}</b>` }] })}</div>`;
  }

  const ROLES = { admin: 'Yönetici', ofis: 'Ofis personeli' };
  NS.shell({
    id: 'kiralama', integrations: ['sms', 'whatsapp', 'email', 'pos', 'payment', 'efatura', 'printer', 'webhook', 'backup'], name: 'Araç Kiralama', tagline: 'Rent a Car Yönetimi', icon: 'car', accent: '#dc2626', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Kiralama' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'takvim', label: 'Müsaitlik Takvimi', icon: 'calendar' }, { id: 'kiralamalar', label: 'Kiralamalar', icon: 'list' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users' }, { sec: 'Filo' }, { id: 'filo', label: 'Araçlar', icon: 'car' }, { id: 'bakim', label: 'Bakım & Masraf', icon: 'wrench' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, takvim: calendarPage, kiralamalar: rentsPage, filo: fleetPage, bakim: maintPage, raporlar: reportsPage,
      musteriler: (el, p, a) => NS.crud(el, a, { col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: CF, sort: (x, y) => x.name.localeCompare(y.name, 'tr'), searchFields: (c) => [c.name, c.phone, c.tc, c.license], filters: [{ value: 'all', label: 'Tümü' }, { value: 'b', label: 'Kara liste', test: (c) => c.blacklist }], columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b>${c.blacklist ? ' ' + badge('Kara liste', 'err') : ''}<div class="small faint">${esc(c.phone)}</div>` }, { key: 'license', label: 'Ehliyet', render: (c) => `${esc(c.license || '')}<div class="small faint">${c.licenseDate ? new Date().getFullYear() - Number(c.licenseDate.slice(0, 4)) + ' yıllık' : ''}</div>` }, { label: 'Kiralama', cls: 'right', render: (c) => db.all('rents', (r) => r.customer === c.id && r.status !== 'iptal').length }, { label: 'Ciro', cls: 'right', render: (c) => money(sum(db.all('rents', (r) => r.customer === c.id && r.status === 'tamamlandi'), (r) => bill(r).total)) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Kiralama kuralları' }, { name: 'kmLimit', label: 'Günlük km limiti', type: 'number' }, { name: 'extraKm', label: 'Aşım km ücreti (₺)', type: 'number' }, { name: 'fuelFee', label: 'Çeyrek depo yakıt ücreti (₺)', type: 'number' }, { name: 'minAge', label: 'Minimum yaş', type: 'number' }, { name: 'minLicense', label: 'Minimum ehliyet yılı', type: 'number' }] }),
    },
  });
})();
