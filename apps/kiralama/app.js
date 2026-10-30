/* NEBSOFT Araç Kiralama — filo, müsaitlik takvimi, sözleşme, teslim/iade kontrolü, bakım ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const H = window.KIRA_HESAP; const { EXTRAS, r2 } = H;

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
    rents.forEach((r) => { if (r.status === 'rezervasyon') return; const at = new Date(r.from + 'T10:00').toISOString(); r.depositIn = { amount: r.deposit, type: pick(['nakit', 'kart provizyonu']), at }; r.kabis = { no: 'ÖRNEK', at: r.from }; if (r.status === 'tamamlandi') r.depositOut = { cut: 0, refund: r.deposit, type: 'kart', at: new Date(r.to + 'T10:00').toISOString(), note: '' }; });
    db.data.rents = rents; db.data._meta._seq_rents = no; db.data.seasons = [];
    db.data.maint = cars.slice(0, 8).map((c) => ({ id: NS.uid(), car: c.id, date: iso(addDays(new Date(), -rand(10, 200))), km: c.km - rand(2000, 12000), type: pick(['Periyodik bakım', 'Lastik değişimi', 'Fren balatası', 'Klima gazı']), cost: rand(15, 90) * 100, note: '' }));
    db.data.maint.push({ id: NS.uid(), car: cars[3].id, date: today(), km: cars[3].km, type: 'Kaporta onarımı', cost: 0, note: 'Serviste — 2 gün sonra teslim', open: true });
  }
  const db = new NS.DB('kiralama', seed);
  const S = () => db.settings(H.DEF);
  // Sayfa çizimi boyunca bir kez hesaplanan dizinler: binlerce kayıtta satır başına tüm liste taranmaz
  const memo = (f) => { let v = null; return () => { if (!v) { v = f(); setTimeout(() => { v = null; }, 0); } return v; }; };
  const carIdx = memo(() => new Map(db.all('cars').map((c) => [c.id, c]))); const custIdx = memo(() => new Map(db.all('customers').map((c) => [c.id, c])));
  const car = (id) => carIdx().get(id) || db.get('cars', id) || { plate: '-', brand: '', model: '' };
  const cust = (id) => custIdx().get(id) || db.get('customers', id) || { name: '-' };
  const ST = { rezervasyon: ['Rezervasyon', 'info'], kirada: ['Kirada', 'err'], tamamlandi: ['Tamamlandı', ''], iptal: ['İptal', ''] };
  const days = (r) => H.nights(r.from, r.to);
  const bill = (r) => H.bill(r, S());
  const clash = (carId, from, to, ignore) => db.find('rents', (r) => r.id !== ignore && r.car === carId && H.overlaps(r, from, to, today()));
  const fin = () => !NS.currentUser || NS.currentUser.role === 'admin'; // ciro ve kârlılık yalnızca yönetici
  const me = () => (NS.currentUser ? NS.currentUser.name : '');
  const nowIso = () => new Date().toISOString();
  const carName = (c) => `${c.brand} ${c.model}`;
  const rentsByCar = memo(() => NS.groupBy(db.all('rents', (r) => r.status !== 'iptal'), (r) => r.car));
  const rentsByCust = memo(() => NS.groupBy(db.all('rents', (r) => r.status !== 'iptal'), (r) => r.customer));
  const quoteOf = (c, from, to) => H.quote(c.daily, from, to, c.cls, { seasons: db.all('seasons'), longDays: S().longDays, longPct: S().longPct });
  const docIssue = (c, until) => [c.insuranceEnd && c.insuranceEnd < until ? `sigorta ${NS.date(c.insuranceEnd)}` : '', c.inspectionEnd && c.inspectionEnd < until ? `muayene ${NS.date(c.inspectionEnd)}` : ''].filter(Boolean);
  const overdue = (r) => r.status === 'kirada' && r.to < today();
  const noShow = (r) => r.status === 'rezervasyon' && r.from < today();
  const reported = (r) => !!r.kabis || (!!r.emniyet && !['TEST', 'hata'].includes(r.emniyet));
  const depPending = (r) => r.status === 'tamamlandi' && r.depositIn && !(r.depositOut && r.depositOut.at);
  const fuelHtml = (n) => `<span class="fuel">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const alerts = () => db.all('cars', H.rentable).flatMap((c) => [
    ...(c.insuranceEnd && c.insuranceEnd <= iso(addDays(new Date(), 30)) ? [{ c, t: 'Sigorta', d: c.insuranceEnd }] : []),
    ...(c.inspectionEnd && c.inspectionEnd <= iso(addDays(new Date(), 30)) ? [{ c, t: 'Muayene', d: c.inspectionEnd }] : []),
    ...(c.nextService && c.km >= c.nextService - 1000 ? [{ c, t: 'Periyodik bakım', d: `${num(c.nextService)} km` }] : []),
  ]);

  // ---------- Kiralama formu ----------
  async function rentForm(app, rec = {}) {
    const isNew = !rec.id;
    const v = { from: today(), to: iso(addDays(new Date(), 3)), fromTime: '10:00', toTime: '10:00', extras: [], channel: 'Telefon', ...rec };
    let disc = v.disc || 0, list = 0;
    modal({
      title: isNew ? 'Yeni kiralama / rezervasyon' : `Kiralama ${rec.no}`, size: 'wide',
      body: `<div class="form-grid"><div class="field full"><label>Müşteri *</label><div class="row nw"><select class="input" id="fc"><option value="">Seçin...</option>${db.all('customers').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => `<option value="${c.id}" ${c.id === v.customer ? 'selected' : ''}>${esc(c.name)}${c.blacklist ? ' ⛔ KARA LİSTE' : ''}</option>`).join('')}</select><button class="btn" id="fcn">${icon('plus')} Yeni</button></div><div class="small" id="fci"></div></div>
        <div class="field"><label>Alış tarihi</label><input class="input" type="date" id="ff" value="${v.from}"></div><div class="field"><label>Alış saati</label><input class="input" type="time" id="fh" value="${esc(v.fromTime)}"></div><div class="field"><label>İade tarihi</label><input class="input" type="date" id="ft" value="${v.to}"></div><div class="field"><label>İade saati</label><input class="input" type="time" id="th" value="${esc(v.toTime)}"></div>
        <div class="field"><label>Araç * <span class="faint" id="fav"></span></label><select class="input" id="fa"></select></div><div class="field"><label>Günlük fiyat</label><input class="input" type="number" min="0" step="0.01" id="fp" value="${v.daily || ''}"></div>
        <div class="field full"><label>Ek hizmetler</label><div class="row">${EXTRAS.map((x) => `<label class="check"><input type="checkbox" data-ex="${x.id}" ${(v.extras || []).includes(x.id) ? 'checked' : ''}> ${x.name} (${money(x.daily)}/gün)</label>`).join('')}</div></div>
        <div class="field full" id="f2" hidden><label>Ek sürücü (ad soyad · ehliyet no)</label><input class="input" id="fd2" value="${esc(v.driver2 || '')}"></div>
        <div class="field"><label>Kanal</label><select class="input" id="fch">${['Web', 'Telefon', 'Acente', 'Havalimanı', 'Ofis'].map((x) => `<option ${x === v.channel ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Depozito</label><input class="input" type="number" min="0" id="fd" value="${v.deposit || ''}"></div>
        <div class="full card pad" id="fs" style="background:var(--surface-2)"></div></div>`,
      onOpen: (b) => {
        const fill = () => {
          const f = $('#ff', b).value, t = $('#ft', b).value; const cur = $('#fa', b).value || v.car;
          const lst = db.all('cars', (c) => c.status !== 'pasif' || c.id === cur).map((c) => ({ c, busy: !H.rentable(c) || !!clash(c.id, f, t, v.id) }));
          $('#fa', b).innerHTML = lst.map(({ c, busy }) => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''} ${busy && c.id !== cur ? 'disabled' : ''}>${esc(c.plate)} · ${esc(carName(c))} · ${esc(c.cls)}${busy ? ' (dolu)' : ''}</option>`).join('');
          const sel = lst.find((x) => x.c.id === $('#fa', b).value); if (!sel || sel.busy) { const fr = lst.find((x) => !x.busy); if (fr) $('#fa', b).value = fr.c.id; }
          $('#fav', b).textContent = `(${lst.filter((x) => !x.busy).length} müsait)`;
          const c = car($('#fa', b).value); if (c.daily) { const q = quoteOf(c, f, t); list = q.rate; if (isNew || $('#fp', b).dataset.auto) { $('#fp', b).value = q.rate; $('#fp', b).dataset.auto = '1'; disc = q.disc; } }
          summ();
        };
        const summ = () => { const r = { from: $('#ff', b).value, to: $('#ft', b).value, daily: Number($('#fp', b).value) || 0, disc, extras: $$('[data-ex]:checked', b).map((x) => x.dataset.ex) }; const x = bill(r); $('#f2', b).hidden = !r.extras.includes('surucu'); $('#fs', b).innerHTML = `<div class="row between"><span>${x.d} gün × ${money(r.daily)}</span><span>${money(x.base)}</span></div>${x.disc ? `<div class="row between small"><span>Uzun kiralama indirimi</span><span>−${money(x.disc)}</span></div>` : ''}${x.ext ? `<div class="row between small"><span>Ek hizmetler</span><span>${money(x.ext)}</span></div>` : ''}<div class="row between"><b>Toplam</b><b style="font-size:18px">${money(x.base - x.disc + x.ext)}</b></div><div class="small muted">Günlük ${S().kmLimit} km dahil · aşım km başı ${money(S().extraKm)}</div>`; if (!$('#fd', b).value) $('#fd', b).value = r2(r.daily * 3); };
        const ci = () => { const c = db.get('customers', $('#fc', b).value); if (!c) return ($('#fci', b).innerHTML = ''); const from = $('#ff', b).value; const age = c.birth ? Math.floor(H.yearsBetween(c.birth, from)) : null, lic = c.licenseDate ? Math.floor(H.yearsBetween(c.licenseDate, from)) : null; const warn = []; if (c.blacklist) warn.push(badge('KARA LİSTEDE', 'err')); if (age !== null && age < S().minAge) warn.push(badge(`Yaş ${age} < ${S().minAge}`, 'err')); if (lic !== null && lic < S().minLicense) warn.push(badge(`Ehliyet ${lic} yıllık`, 'warn')); if (age === null || lic === null) warn.push(badge('Yaş / ehliyet bilgisi eksik', 'warn')); $('#fci', b).innerHTML = `<span class="muted">Ehliyet ${esc(c.license || '-')} · ${lic === null ? '-' : lic + ' yıl'} · ${age === null ? '-' : age + ' yaş'} · ${(rentsByCust()[c.id] || []).filter((r) => r.status === 'tamamlandi').length} kiralama</span> ${warn.join(' ')}`; };
        $('#ff', b).onchange = () => { if ($('#ft', b).value <= $('#ff', b).value) $('#ft', b).value = iso(addDays($('#ff', b).value, 1)); fill(); ci(); };
        $('#ft', b).onchange = fill; $('#fa', b).onchange = () => { $('#fp', b).dataset.auto = '1'; fill(); }; $('#fp', b).oninput = () => { delete $('#fp', b).dataset.auto; disc = 0; summ(); };
        on(b, 'change', '[data-ex]', summ); $('#fc', b).onchange = ci;
        $('#fcn', b).onclick = async () => { const c = await formModal({ title: 'Yeni müşteri', fields: CF }); if (c) { const n = db.insert('customers', c); $('#fc', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)}</option>`); $('#fc', b).value = n.id; ci(); } };
        fill(); ci();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: isNew ? 'Kaydet' : 'Güncelle', cls: 'primary', icon: 'check', onClick: async (close, b) => {
          const d = { customer: $('#fc', b).value, car: $('#fa', b).value, from: $('#ff', b).value, to: $('#ft', b).value, fromTime: $('#fh', b).value || '10:00', toTime: $('#th', b).value || '10:00', daily: r2($('#fp', b).value), disc, extras: $$('[data-ex]:checked', b).map((x) => x.dataset.ex), channel: $('#fch', b).value, deposit: r2($('#fd', b).value) };
          d.driver2 = d.extras.includes('surucu') ? $('#fd2', b).value.trim() : '';
          if (!d.customer) return toast('Müşteri seçin', 'err'); if (!d.car) return toast('Bu tarihlerde müsait araç yok', 'err');
          if (!d.from || !d.to || d.to <= d.from) return toast('İade tarihi alıştan sonra olmalı', 'err'); if (!(d.daily > 0)) return toast('Günlük fiyat girin', 'err');
          const m = cust(d.customer); if (m.blacklist) return toast('Kara listedeki müşteriye kiralama yapılamaz', 'err');
          const cr = car(d.car); if (!H.rentable(cr) && d.car !== v.car) return toast('Bu araç kiralamaya kapalı (bakımda veya pasif)', 'err');
          const c = clash(d.car, d.from, d.to, v.id); if (c) return toast(`Araç dolu: ${c.no}`, 'err');
          if (m.birth && H.yearsBetween(m.birth, d.from) < S().minAge && !(await NS.approve(app, `${m.name} yaş sınırı altında`, ['admin']))) return;
          if (m.licenseDate && H.yearsBetween(m.licenseDate, d.from) < S().minLicense && !(await NS.approve(app, `${m.name} ehliyet süresi yetersiz`, ['admin']))) return;
          if (list && d.daily < list && !(await NS.approve(app, `${cr.plate} liste fiyatı ${money(list)} altında kiralama`, ['admin']))) return;
          if (isNew) { const r = db.insert('rents', { ...d, no: db.nextNo('rents', 'K'), status: 'rezervasyon', payments: [], damages: [] }); db.log('Rezervasyon', `${r.no} · ${cr.plate}`); } else db.update('rents', v.id, d);
          close(); toast('Kaydedildi', 'ok'); app.refresh();
        },
      }],
    });
  }
  const CF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'tc', label: 'TC / pasaport' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'birth', label: 'Doğum tarihi', type: 'date' }, { name: 'license', label: 'Ehliyet no' }, { name: 'licenseDate', label: 'Ehliyet tarihi', type: 'date' }, { name: 'blacklist', label: 'Kara liste', type: 'checkbox' }, { name: 'blackNote', label: 'Kara liste nedeni' }];

  const paySel = { name: 'type', label: 'Ödeme', type: 'select', options: ['kart', 'nakit', 'havale'] };
  const receiptDoc = (r, p) => ({ title: p.amount < 0 ? 'Ödeme iade belgesi' : 'Tahsilat makbuzu', no: r.no, date: p.at, party: { title: 'Kiracı', name: cust(r.customer).name, lines: [cust(r.customer).phone] }, info: [['Sözleşme', r.no], ['Araç', car(r.car).plate], ['Ödeme', p.type]], totals: [[p.amount < 0 ? 'İade edilen' : 'Tahsil edilen', Math.abs(p.amount), true], ['Sözleşme toplamı', bill(r).total], ['Kalan', Math.max(0, bill(r).due)]] });
  async function takePay(app, r) {
    const x = bill(r); if (x.due <= 0) return false;
    const v = await formModal({ title: `Ödeme · ${r.no} (kalan ${money(x.due)})`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: x.due, required: true }, paySel], submitLabel: 'Tahsil et' }); if (!v) return false;
    const a = r2(v.amount); if (!(a > 0) || a > x.due) { toast(`Tutar 0 ile ${money(x.due)} arasında olmalı`, 'err'); return false; }
    const p = { amount: a, type: v.type, at: nowIso(), by: me() }; r.payments = r.payments || []; r.payments.push(p); db.log('Tahsilat', `${r.no} · ${money(a)}`); db.save(); toast('Tahsil edildi', 'ok'); NS.docs.print('makbuz', receiptDoc(r, p)); return true;
  }
  // Fazla ödeme: tutar müşteriye geri verilir, negatif ödeme olarak kalır (silinmez)
  async function refundOver(app, r) {
    const over = -bill(r).due; if (over <= 0) return;
    const v = await formModal({ title: `Fazla ödeme iadesi · ${r.no}`, fields: [{ name: 'amount', label: 'İade tutarı', type: 'number', value: over, required: true }, paySel], submitLabel: 'İade et' }); if (!v) return;
    const a = r2(v.amount); if (!(a > 0) || a > over) return toast(`Tutar 0 ile ${money(over)} arasında olmalı`, 'err');
    if (!(await NS.approve(app, `${r.no} ${money(a)} ödeme iadesi`, ['admin']))) return;
    const p = { amount: -a, type: v.type, at: nowIso(), by: me(), note: 'Fazla ödeme iadesi' }; r.payments.push(p); db.log('Ödeme iadesi', `${r.no} · ${money(a)}`); db.save(); toast('İade kaydedildi', 'ok'); NS.docs.print('makbuz', receiptDoc(r, p)); app.refresh();
  }
  async function cancelRent(app, r) {
    const paid = bill(r).paid;
    const v = await formModal({ title: `Rezervasyon iptali · ${r.no}`, fields: [{ name: 'reason', label: 'Neden', type: 'select', options: ['Müşteri vazgeçti', 'Müşteri gelmedi', 'Araç arızası', 'Diğer'] }, { name: 'note', label: 'Not', full: true }, ...(paid > 0 ? [{ name: 'refund', label: `Müşteriye iade (ödenen ${money(paid)})`, type: 'number', value: paid }, paySel] : [])], submitLabel: 'İptal et' }); if (!v) return false;
    const refund = paid > 0 ? r2(v.refund) : 0; if (refund < 0 || refund > paid) { toast(`İade 0 ile ${money(paid)} arasında olmalı`, 'err'); return false; }
    if (paid > 0 && !(await NS.approve(app, `${r.no} ödemeli rezervasyon iptali`, ['admin']))) return false;
    if (refund > 0) r.payments.push({ amount: -refund, type: v.type, at: nowIso(), by: me(), note: 'İptal iadesi' });
    Object.assign(r, { status: 'iptal', cancel: { reason: v.reason, note: v.note || '', refund, at: nowIso(), by: me() } }); db.log('Kiralama iptal', `${r.no} · ${v.reason}${refund ? ' · iade ' + money(refund) : ''}`); db.save(); toast('Rezervasyon iptal edildi', 'ok'); app.refresh(); return true;
  }
  // Teslim veya iade sonrası gelen masraf (ceza, HGS, hasar, temizlik): sözleşmeye gerekçesiyle yazılır
  async function addCharge(app, r) {
    const v = await formModal({ title: `Masraf ekle · ${r.no}`, fields: [{ name: 'kind', label: 'Tür', type: 'select', options: ['Hasar', 'HGS/OGS', 'Trafik cezası', 'Temizlik', 'Diğer'] }, { name: 'desc', label: 'Açıklama', required: true, full: true }, { name: 'cost', label: 'Tutar (₺)', type: 'number', required: true }], submitLabel: 'Ekle' }); if (!v) return;
    const c = r2(v.cost); if (!(c > 0)) return toast('Tutar girin', 'err');
    r.damages = [...(r.damages || []), { desc: `${v.kind}: ${v.desc}`, kind: v.kind, cost: c, at: nowIso(), by: me() }]; db.log('Masraf eklendi', `${r.no} · ${v.kind} · ${money(c)}`); db.save(); toast('Masraf sözleşmeye eklendi', 'ok'); app.refresh();
  }
  // Depozito kapatma: kesinti yalnızca sözleşmedeki kalan borç kadar olur, gerekçesi yazılır; kalanı iade edilir
  async function closeDeposit(app, r) {
    const held = r.depositIn.amount; const x = bill(r); const open = Math.max(0, x.due);
    const v = await formModal({ title: `Depozito kapatma · ${r.no}`, fields: [{ name: 'cut', label: `Kesinti (alınan ${money(held)} · kalan borç ${money(open)})`, type: 'number', value: Math.min(held, open) }, { name: 'note', label: 'Kesinti gerekçesi (kiracıya verilen belgede yazar)', full: true, value: open > 0 ? 'Sözleşmeden kalan borç' : '' }, { name: 'now', label: 'Kalan depozito şimdi iade edildi', type: 'checkbox', value: true }, { name: 'type', label: 'İade yöntemi', type: 'select', options: ['kart', 'nakit', 'havale', 'provizyon çözüldü'] }], submitLabel: 'Kapat' }); if (!v) return false;
    const c = H.depositClose(held, v.cut, v.note); if (c.error) { toast(c.error, 'err'); return false; }
    if (c.cut > open) { toast('Kesinti kalan borçtan büyük olamaz; önce masrafı sözleşmeye ekleyin', 'err'); return false; }
    if (c.cut > 0 && !(await NS.approve(app, `${r.no} depozitodan ${money(c.cut)} kesinti`, ['admin']))) return false;
    if (c.cut > 0) r.payments.push({ amount: c.cut, type: 'depozito kesintisi', at: nowIso(), by: me() });
    r.depositOut = { ...c, note: v.note || '', type: v.type, at: v.now ? nowIso() : null, by: me() }; db.log('Depozito', `${r.no} · kesinti ${money(c.cut)} · iade ${money(c.refund)}${v.now ? '' : ' (bekliyor)'}`); db.save(); toast(v.now ? `Depozito kapatıldı: ${money(c.refund)} iade` : `${money(c.refund)} iade bekliyor`, v.now ? 'ok' : 'warn'); if (v.now) NS.docs.print('depozito', depositDoc(r)); return true;
  }
  const depositDone = (app, r) => { r.depositOut.at = nowIso(); r.depositOut.by = me(); db.log('Depozito iade', `${r.no} · ${money(r.depositOut.refund)}`); db.save(); toast('Depozito iadesi kaydedildi', 'ok'); NS.docs.print('depozito', depositDoc(r)); app.refresh(); };
  const depositAct = async (app, r) => { if (!r.depositOut) { if (await closeDeposit(app, r)) app.refresh(); } else depositDone(app, r); };
  const depositDoc = (r) => { const o = r.depositOut || {}; return { title: 'Depozito kapatma belgesi', no: r.no, date: o.at || nowIso(), party: { title: 'Kiracı', name: cust(r.customer).name, lines: [cust(r.customer).phone] }, info: [['Araç', car(r.car).plate], ['Alınış', `${NS.date(r.depositIn.at)} · ${r.depositIn.type}`], ['İade yöntemi', o.type || '-']], lines: o.cut ? [{ name: `Kesinti: ${o.note}`, qty: 1, price: o.cut, total: o.cut }] : [], totals: [['Alınan depozito', r.depositIn.amount], ['Kesinti', o.cut || 0], ['İade edilen', o.refund || 0, true]] }; };
  const handoverDoc = (r) => { const c = car(r.car), m = cust(r.customer); return { title: 'Teslim ve iade tutanağı', no: r.no, date: r.inAt || r.from, info: [['Araç', `${carName(c)} · ${c.plate}`], ['Teslim', `${NS.date(r.from)} ${r.fromTime || ''} · ${num(r.outKm)} km · yakıt ${r.outFuel}/4`], ['İade', r.inKm != null ? `${r.inAt ? NS.dt(r.inAt) : NS.date(r.to)} · ${num(r.inKm)} km · yakıt ${r.inFuel}/4` : 'Henüz iade edilmedi'], ['Teslim notu', r.outNote || '-']], party: { title: 'Kiracı', name: m.name, lines: [m.phone] }, damage: { svg: NS.docs.carSvg(r.inDamage || r.outDamage || []), marks: [...NS.docs.damageText(r.outDamage || []).map((t) => 'Teslimde: ' + t), ...NS.docs.damageText(r.inDamage || []).map((t) => 'İadede: ' + t)] }, lines: (r.damages || []).map((d) => ({ name: d.desc, qty: 1, price: d.cost, total: d.cost })), signatures: [{ label: 'Kiracı — teslim', ...(r.signOut || {}) }, { label: 'Kiracı — iade', ...(r.signIn || {}) }] }; };
  async function kabisForm(app, r) {
    const v = await formModal({ title: `Kiralık araç bildirimi · ${r.no}`, fields: [{ name: 'no', label: 'Bildirim numarası (yetkili sistemden)', value: (r.kabis || {}).no || '', required: true }, { name: 'at', label: 'Bildirim tarihi', type: 'date', value: (r.kabis || {}).at || today(), required: true }], submitLabel: 'Kaydet' }); if (!v) return;
    r.kabis = { ...v, by: me() }; db.log('Kiralık araç bildirimi', `${r.no} · ${v.no}`); db.save(); toast('Bildirim kaydı eklendi', 'ok'); app.refresh();
  }
  // e-Belge: fiyatlar KDV dahil tutulur; trafik cezası müşteri adına ödenen tutardır, faturaya girmez
  async function invoice(app, r) {
    if (r.invoice && !r.invoice.test && !(await confirm(`${r.no} için ${r.invoice.no} kesilmiş. Yeniden kesilsin mi?`))) return;
    const m = cust(r.customer), x = bill(r), vat = Number(S().vatPct) || 0; const net = (a) => r2(a / (1 + vat / 100)); const L = (name, qty, gross, unit = 'adet') => ({ name, qty, unit, price: net(gross / qty), disc: 0, vat });
    const lines = [L(`Araç kiralama ${car(r.car).plate} (${NS.date(r.from)} - ${NS.date(r.to)})`, x.d, x.base - x.disc, 'gün'), ...(x.ext ? [L('Ek hizmetler', 1, x.ext)] : []), ...(x.kmFee ? [L(`Km aşımı (${x.overKm} km)`, 1, x.kmFee)] : []), ...(x.fuelFee ? [L('Eksik yakıt', 1, x.fuelFee)] : []), ...(r.damages || []).filter((d) => d.kind !== 'Trafik cezası').map((d) => L(d.desc, 1, d.cost))];
    const res = await NS.ebelge.create({ docType: 'auto', no: r.no.replace(/\W/g, ''), buyer: m.name, buyerVkn: m.tc, buyerEmail: m.email, address: m.address, note: `Kiralama sözleşmesi ${r.no}`, lines });
    if (res && res.ok) { r.invoice = { id: res.id, no: res.no, type: res.type, date: today(), ...(res.simulated ? { test: true } : {}) }; db.log('Fatura', `${r.no} · ${res.no}${res.simulated ? ' · TEST' : ''}`); db.save(); app.refresh(); }
  }

  function rentDetail(app, r) {
    const c = car(r.car), m = cust(r.customer), x = bill(r); const live = ['kirada', 'tamamlandi'].includes(r.status);
    const dep = r.depositIn ? `<div class="small mt">Depozito: <b>${money(r.depositIn.amount)}</b> · ${esc(r.depositIn.type)}${r.depositOut ? ` · kesinti ${money(r.depositOut.cut)} · iade ${money(r.depositOut.refund)} ${r.depositOut.at ? badge('İade edildi', 'ok') : badge('İade bekliyor', 'warn')}${r.depositOut.note ? `<div class="faint">${esc(r.depositOut.note)}</div>` : ''}` : r.status === 'tamamlandi' ? ' ' + badge('Kapatılmadı', 'warn') : ''}</div>` : `<div class="small muted mt">Depozito: ${money(r.deposit || 0)} (alınmadı)</div>`;
    modal({
      title: `${r.no} · ${carName(c)} (${c.plate})`, size: 'wide',
      body: `<div class="grid g2"><div class="col"><div class="row">${badge(ST[r.status][0], ST[r.status][1])} ${badge(r.channel || 'Online', 'acc')}${overdue(r) ? ' ' + badge(`${daysBetween(r.to, today())} gün gecikti`, 'err') : ''}${r.invoice ? ' ' + badge(`${r.invoice.test ? 'TEST ' : ''}Fatura ${r.invoice.no}`, r.invoice.test ? 'warn' : 'ok') : ''}</div>
          <div class="list-item"><span class="grow muted">Müşteri</span><b>${esc(m.name)}</b></div><div class="list-item"><span class="grow muted">Telefon</span>${esc(m.phone)}</div><div class="list-item"><span class="grow muted">Tarih</span><b>${NS.date(r.from)} ${esc(r.fromTime || '')} → ${NS.date(r.to)} ${esc(r.toTime || '')} (${x.d} gün)</b></div>
          <div class="list-item"><span class="grow muted">Ek hizmet</span>${EXTRAS.filter((e) => (r.extras || []).includes(e.id)).map((e) => badge(e.name)).join(' ') || '-'}</div>${r.driver2 ? `<div class="list-item"><span class="grow muted">Ek sürücü</span>${esc(r.driver2)}</div>` : ''}
          ${live ? `<div class="list-item"><span class="grow muted">Kiralık araç bildirimi</span>${r.kabis ? `${badge('Yapıldı · ' + r.kabis.no, 'ok')}` : r.emniyet === 'TEST' ? badge('TEST — bildirilmedi', 'warn') : r.emniyet === 'hata' ? badge('Hata — bildirilmedi', 'err') : r.emniyet ? badge('Bildirildi · ' + r.emniyet, 'ok') : badge('Kayıt yok', 'err')}</div>` : ''}
          ${r.outKm != null ? `<div class="list-item"><span class="grow muted">Teslim</span>${num(r.outKm)} km · ${fuelHtml(r.outFuel)}</div>` : ''}${r.inKm != null ? `<div class="list-item"><span class="grow muted">İade</span>${num(r.inKm)} km · ${fuelHtml(r.inFuel)} · ${num(x.driven)} km yapıldı</div>` : ''}
          ${[['Teslim fotoğrafları', r.outPhotos], ['İade fotoğrafları', r.inPhotos]].filter(([, L]) => (L || []).length).map(([l, L]) => `<div class="list-item" style="display:block"><div class="muted small mb">${l}</div><div class="row" style="gap:6px;flex-wrap:wrap">${L.map((u, i) => `<a href="${esc(u)}" download="${esc(r.no)}-${i + 1}.jpg" title="Fotoğrafı indir"><img src="${esc(u)}" alt="${l} ${i + 1}" style="width:84px;height:63px;object-fit:cover;border-radius:6px"></a>`).join('')}</div></div>`).join('')}
          ${(r.damages || []).map((d) => `<div class="list-item" style="color:var(--err)"><span class="grow">${icon('alert')} ${esc(d.desc)}</span><b>${money(d.cost)}</b></div>`).join('')}${r.cancel ? `<div class="list-item"><span class="grow muted">İptal</span>${esc(r.cancel.reason)}${r.cancel.refund ? ' · iade ' + money(r.cancel.refund) : ''}</div>` : r.cancelNote ? `<div class="list-item"><span class="grow muted">İptal</span>${esc(r.cancelNote)}</div>` : ''}</div>
        <div class="card pad" style="background:var(--surface-2)"><h3 class="mb">Hesap</h3><div class="row between"><span>Kira (${x.d} gün)</span><span>${money(x.base)}</span></div>${x.disc ? `<div class="row between"><span>İndirim</span><span>−${money(x.disc)}</span></div>` : ''}${x.ext ? `<div class="row between"><span>Ek hizmetler</span><span>${money(x.ext)}</span></div>` : ''}${x.kmFee ? `<div class="row between"><span>Km aşımı (${num(x.overKm)} km)</span><span>${money(x.kmFee)}</span></div>` : ''}${x.fuelFee ? `<div class="row between"><span>Eksik yakıt</span><span>${money(x.fuelFee)}</span></div>` : ''}${x.dmg ? `<div class="row between"><span>Hasar ve masraf</span><span>${money(x.dmg)}</span></div>` : ''}<hr><div class="row between"><b>Toplam</b><b>${money(x.total)}</b></div><div class="row between small"><span>Ödenen</span><span>${money(x.paid)}</span></div><div class="row between"><b>${x.due < 0 ? 'Fazla ödeme' : 'Kalan'}</b><b style="font-size:20px;color:${x.due !== 0 ? 'var(--err)' : 'var(--ok)'}">${money(Math.abs(x.due))}</b></div>${dep}</div></div>`,
      actions: [
        ...(r.status === 'rezervasyon' ? [{ label: 'İptal', cls: 'danger', onClick: async (cl) => { if (await cancelRent(app, r)) cl(); } }, { label: 'Düzenle', icon: 'edit', onClick: (cl) => { cl(); rentForm(app, r); } }, { label: 'Aracı teslim et', cls: 'primary', icon: 'key', onClick: (cl) => { cl(); handOut(app, r); } }] : []),
        ...(r.status === 'kirada' ? [{ label: 'İade al', cls: 'primary', icon: 'check', onClick: (cl) => { cl(); takeBack(app, r); } }] : []),
        ...(live ? [{ label: 'Fotoğraflar', icon: 'plus', onClick: (cl) => { cl(); photosModal(app, r); } }, { label: 'Masraf ekle', icon: 'plus', onClick: (cl) => { cl(); addCharge(app, r); } }, { label: 'Bildirim kaydı', onClick: (cl) => { cl(); kabisForm(app, r); } }, { label: 'Tutanak', icon: 'print', onClick: () => NS.docs.print('tutanak', handoverDoc(r)) }] : []),
        ...(x.due > 0 && live ? [{ label: 'Ödeme al', icon: 'cash', onClick: async (cl) => { cl(); if (await takePay(app, r)) app.refresh(); } }] : []),
        ...(x.due < 0 ? [{ label: 'Fazla ödemeyi iade et', icon: 'cash', onClick: (cl) => { cl(); refundOver(app, r); } }] : []),
        ...(depPending(r) ? [{ label: r.depositOut ? 'Depozito iadesini kaydet' : 'Depozitoyu kapat', onClick: (cl) => { cl(); depositAct(app, r); } }] : []),
        ...(r.status === 'tamamlandi' && NS.ebelge ? [{ label: r.invoice && !r.invoice.test ? 'Faturayı yeniden kes' : 'Fatura kes', icon: 'file', onClick: (cl) => { cl(); invoice(app, r); } }] : []),
        ...(r.depositOut && r.depositOut.at ? [{ label: 'Depozito belgesi', icon: 'print', onClick: () => NS.docs.print('depozito', depositDoc(r)) }] : []),
        ...(r.status !== 'iptal' ? [{ label: 'Sözleşme', icon: 'print', onClick: () => printContract(r) }] : []),
      ],
    });
  }
  // Teslim/iade fotoğrafı: tarayıcıda küçültülür (en uzun kenar 1280 px, JPEG), üst sınırı aşarsa kalite düşürülür; sözleşmeye gömülür
  const shrink = (file) => new Promise((res, rej) => { if (!/^image\//.test(file.type || '')) return rej(new Error('Yalnızca görsel dosyası seçin')); const fr = new FileReader(); fr.onerror = () => rej(new Error('Dosya okunamadı')); fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('Görsel okunamadı')); im.onload = () => { const k = Math.min(1, 1280 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = 0.72, u = c.toDataURL('image/jpeg', q); while (u.length > H.PHOTO.perPhoto && q > 0.3) { q -= 0.12; u = c.toDataURL('image/jpeg', q); } if (u.length > H.PHOTO.perPhoto) return rej(new Error('Görsel küçültülemedi')); res(u); }; im.src = fr.result; }; fr.readAsDataURL(file); });
  // Yerel kayıt tarayıcı deposuna sığmazsa core yalnızca konsola yazar: kaydın gerçekten yazıldığı burada doğrulanır
  const stored = () => { if (db.cloud || db.pub) return true; try { return localStorage.getItem(db.key) === JSON.stringify(db.data); } catch (e) { return false; } };
  // Forma eklenen fotoğraf alanı: taslak listesi; form onaylanınca sözleşmeye yazılır (photoSave)
  function photoField(r, side) {
    const key = side === 'out' ? 'outPhotos' : 'inPhotos'; const otherKey = side === 'out' ? 'inPhotos' : 'outPhotos'; const list = [...(r[key] || [])]; const box = 'ph' + side; const old = r[key];
    const draw = (b) => { $('#' + box, b).innerHTML = list.length ? `<div class="row" style="gap:8px;flex-wrap:wrap">${list.map((u, i) => `<div style="position:relative;width:104px"><img src="${esc(u)}" alt="Fotoğraf ${i + 1}" style="width:100%;height:78px;object-fit:cover;border-radius:8px"><button type="button" class="btn sm ghost icon" data-phrm="${side}|${i}" title="Fotoğrafı sil" aria-label="Fotoğrafı sil" style="position:absolute;top:2px;right:2px;background:var(--surface)">${icon('x')}</button></div>`).join('')}</div>` : '<div class="faint small">Fotoğraf eklenmedi</div>'; };
    return {
      list, extra: `<div class="mt"><h3 class="mb">${side === 'out' ? 'Teslim' : 'İade'} fotoğrafları</h3><div class="small faint mb">İsteğe bağlı, en fazla ${H.PHOTO.perSide} fotoğraf. Aracın dört yönünü ve hasarları çekin. Yüklenirken küçültülür.</div><div id="${box}"></div><input class="input mt" type="file" data-phf="${side}" accept="image/*" multiple aria-label="${side === 'out' ? 'Teslim' : 'İade'} fotoğrafı seç"></div>`,
      onOpen: (b) => {
        draw(b);
        on(b, 'click', `[data-phrm^="${side}|"]`, (e, x) => { list.splice(Number(x.dataset.phrm.split('|')[1]), 1); draw(b); });
        $(`[data-phf=${side}]`, b).onchange = async (e) => {
          const inp = e.target; const fs = [...inp.files]; inp.disabled = true;
          try { for (const f of fs) { const u = await shrink(f); const msg = H.photoCheck(db.all('rents'), r, list, u.length, { other: r[otherKey] || [], docChars: JSON.stringify(db.data).length, local: !db.cloud }); if (msg) { toast(msg, 'err'); break; } list.push(u); draw(b); } } catch (x) { toast('Fotoğraf eklenemedi: ' + (x.message || ''), 'err'); }
          inp.value = ''; inp.disabled = false;
        };
      },
      save: () => { if (list.length) r[key] = list; else delete r[key]; },
      undo: () => { if (old) r[key] = old; else delete r[key]; },
    };
  }
  // Depoya sığmayan fotoğraf geri alınır: kaydedildi denip yenilemede kaybolmasın
  function photoStored(fields) { if (stored()) return true; fields.forEach((f) => f.undo()); db.save(); toast('Tarayıcı deposu dolu: fotoğraflar kaydedilemedi, diğer bilgiler kaydedildi.', 'err'); return false; }
  async function photosModal(app, r) {
    const a = photoField(r, 'out'), b2 = photoField(r, 'in');
    const v = await formModal({ title: `Fotoğraflar · ${r.no}`, size: 'wide', fields: [], extra: a.extra + b2.extra, onOpen: (b) => { a.onOpen(b); b2.onOpen(b); } }); if (!v) return;
    a.save(); b2.save(); db.log('Sözleşme fotoğrafı', r.no); db.save(); if (photoStored([a, b2])) toast('Fotoğraflar kaydedildi', 'ok'); app.refresh();
  }
  async function handOut(app, r) {
    const c = car(r.car), m = cust(r.customer); const x0 = bill(r);
    if (r.status !== 'rezervasyon') return toast('Bu kiralama teslime uygun değil', 'err');
    if (m.blacklist) return toast('Kara listedeki müşteriye araç teslim edilemez', 'err'); if (!H.rentable(c)) return toast('Araç bakımda veya pasif; teslim edilemez', 'err');
    if (r.from > today()) return toast(`Alış tarihi ${NS.date(r.from)}; daha erken teslim için tarihi düzenleyin`, 'err');
    const out = db.find('rents', (o) => o.id !== r.id && o.car === r.car && o.status === 'kirada'); if (out) return toast(`Araç hâlâ ${out.no} kiralamasında; önce iade alın`, 'err');
    const issue = docIssue(c, r.to); if (issue.length && !(await NS.approve(app, `${c.plate} kiralama bitmeden süresi doluyor: ${issue.join(', ')}`, ['admin']))) return;
    const phOut = photoField(r, 'out');
    const v = await formModal({ title: `Teslim — ${c.plate}`, fields: [{ name: 'km', label: `Çıkış km (kayıtlı ${num(c.km)})`, type: 'number', value: c.km, required: true }, { name: 'fuel', label: 'Yakıt seviyesi', type: 'select', options: [{ value: 4, label: 'Dolu' }, { value: 3, label: '3/4' }, { value: 2, label: '1/2' }, { value: 1, label: '1/4' }] }, { name: 'tc', label: 'TC / pasaport no', value: m.tc || '', required: true }, { name: 'license', label: 'Ehliyet no', value: m.license || '', required: true }, { name: 'licenseDate', label: 'Ehliyet tarihi', type: 'date', value: m.licenseDate || '', required: true }, { name: 'dep', label: 'Depozito (₺)', type: 'number', value: r.deposit || 0 }, { name: 'depType', label: 'Depozito alınışı', type: 'select', options: ['kart provizyonu', 'nakit', 'kart', 'havale', 'alınmadı'] }, { name: 'pay', label: `Peşin tahsilat (kalan ${money(Math.max(0, x0.due))})`, type: 'number', value: Math.max(0, x0.due) }, paySel, { name: 'note', label: 'Mevcut hasar notu', full: true }], submitLabel: 'Teslim et', extra: phOut.extra, onOpen: phOut.onOpen });
    if (!v) return;
    if (Number(v.km) < Number(c.km)) return toast(`Çıkış km kayıtlı km'den (${num(c.km)}) küçük olamaz`, 'err');
    const pay = r2(v.pay); if (pay < 0 || pay > Math.max(0, x0.due)) return toast(`Peşin tahsilat 0 ile ${money(Math.max(0, x0.due))} arasında olmalı`, 'err');
    if (H.yearsBetween(v.licenseDate, r.from) < S().minLicense && !(await NS.approve(app, `${m.name} ehliyet süresi yetersiz`, ['admin']))) return;
    Object.assign(m, { tc: v.tc, license: v.license, licenseDate: v.licenseDate });
    // Teslim kontrolü: hasar krokisi ve kiracı imzası
    if (NS.docs) { const mk = await NS.docs.damageModal(r.outDamage || [], `Teslim kontrolü — ${c.plate}`); if (mk) r.outDamage = mk; const sg = await NS.sign({ title: 'Teslim — kiracı imzası', label: 'Kiracı adı soyadı', name: m.name, text: 'Aracı belirtilen km, yakıt ve hasar durumuyla teslim aldım; sözleşme şartlarını okudum ve kabul ediyorum.' }); if (sg) r.signOut = sg; }
    Object.assign(r, { status: 'kirada', outKm: Number(v.km), outFuel: Number(v.fuel), outNote: v.note, outAt: nowIso(), outBy: me() }); phOut.save();
    const dep = r2(v.dep); if (dep > 0 && v.depType !== 'alınmadı') { r.deposit = dep; r.depositIn = { amount: dep, type: v.depType, at: nowIso(), by: me() }; }
    if (pay > 0) { r.payments = r.payments || []; r.payments.push({ amount: pay, type: v.type, at: nowIso(), by: me() }); }
    db.log('Araç teslim', `${r.no} · ${c.plate}`); db.save(); photoStored([phOut]); toast('Araç teslim edildi', 'ok');
    // Emniyet kiralık araç bildirimi ve GPS takibinde kiralama başlangıcı
    if (NS.integ) { if (NS.integ.isOn('aracbildirim')) NS.integ.call('aracbildirim', 'kiralama-bildir', { plate: c.plate, contract: r.no, from: r.from, to: r.to, renter: { name: m.name, tc: m.tc || m.idNo, license: m.license, phone: m.phone } }, { silent: true }).then((x) => { if (x) { r.emniyet = x.simulated ? 'TEST' : x.ok ? x.ref : 'hata'; db.save(); if (x.simulated) toast('Kiralık araç bildirimi TEST — Emniyet’e bildirim YAPILMADI (simülasyon)', 'warn'); } }); if (NS.integ.isOn('gps')) NS.integ.call('gps', 'kiralama-basla', { plate: c.plate, contract: r.no }, { silent: true }); }
    printContract(r); app.refresh();
  }
  // İade sırasında HGS/OGS geçişleri ve GPS km bilgisi
  async function tollsAndGps(r, c) {
    if (!NS.integ) return { tolls: [], km: null };
    let tolls = [], km = null;
    if (NS.integ.isOn('hgs')) { const x = await NS.integ.call('hgs', 'gecis-sorgu', { plate: c.plate, from: r.from, to: today() }, { silent: true }); // Simülasyonda geçiş uydurulmaz (müşteriye yansıyordu)
      tolls = x && !x.simulated && x.data && Array.isArray(x.data.passes) ? x.data.passes : []; if (x && x.simulated) toast('HGS TEST — geçişler sorgulanmadı (simülasyon); geçiş ücretlerini elle ekleyin', 'warn'); }
    if (NS.integ.isOn('gps')) { const x = await NS.integ.call('gps', 'km-sorgu', { plate: c.plate }, { silent: true }); km = x && x.data && x.data.km ? Number(x.data.km) : null; }
    return { tolls, km };
  }
  async function takeBack(app, r) {
    const c = car(r.car); const now = new Date(); const phIn = photoField(r, 'in');
    const v = await formModal({ title: `İade — ${c.plate}`, fields: [{ name: 'date', label: 'İade tarihi', type: 'date', value: today(), required: true }, { name: 'time', label: 'İade saati', type: 'time', value: `${NS.pad(now.getHours())}:${NS.pad(now.getMinutes())}`, required: true }, { name: 'km', label: `Dönüş km (çıkış ${num(r.outKm)})`, type: 'number', required: true, value: Number(r.outKm) + 300 * days(r) }, { name: 'fuel', label: 'Yakıt', type: 'select', options: [{ value: 4, label: 'Dolu' }, { value: 3, label: '3/4' }, { value: 2, label: '1/2' }, { value: 1, label: '1/4' }] }, { name: 'dmg', label: 'Yeni hasar açıklaması (yoksa boş)' }, { name: 'dmgCost', label: 'Hasar bedeli (₺)', type: 'number', value: 0 }, ...(today() < r.to ? [{ name: 'early', label: 'Erken iade: kullanılmayan günler ücretlendirilmesin', type: 'checkbox', value: true }] : [])], submitLabel: 'İade al', extra: phIn.extra, onOpen: phIn.onOpen });
    if (!v) return;
    if (Number(v.km) < Number(r.outKm)) return toast('Dönüş km çıkış km\'den küçük olamaz', 'err');
    if (v.date < r.from) return toast('İade tarihi alış tarihinden önce olamaz', 'err');
    if (Number(v.dmgCost) > 0 && !String(v.dmg || '').trim()) return toast('Hasar bedeli için açıklama yazın', 'err');
    Object.assign(r, { inKm: Number(v.km), inFuel: Number(v.fuel), inAt: `${v.date}T${v.time}`, inBy: me() }); phIn.save();
    // Geç iade ek gün olarak, erken iade kullanılan gün olarak faturalanır; plan tarihi saklanır
    const late = H.lateDays(r, r.inAt, S().graceHours); const plan = r.to;
    if (late > 0) r.to = H.addDay(r.to, late); else if (v.early && v.date < r.to) r.to = v.date > r.from ? v.date : H.addDay(r.from);
    if (r.to !== plan) r.plannedTo = plan;
    if (NS.docs) { const mk = await NS.docs.damageModal(r.inDamage || r.outDamage || [], `İade kontrolü — ${c.plate}`); if (mk) r.inDamage = mk; const sg = await NS.sign({ title: 'İade — kiracı imzası', label: 'Kiracı adı soyadı', name: cust(r.customer).name, text: 'Aracı belirtilen km, yakıt ve hasar durumuyla iade ettim.' }); if (sg) r.signIn = sg; }
    if (v.dmg) r.damages = [...(r.damages || []), { desc: v.dmg, kind: 'Hasar', cost: r2(v.dmgCost), at: nowIso(), by: me() }];
    c.km = Math.max(Number(c.km) || 0, Number(v.km));
    const tg = await tollsAndGps(r, c);
    if (tg.tolls.length) { r.damages = [...(r.damages || []), ...tg.tolls.map((t) => ({ desc: `HGS/OGS: ${t.place} (${NS.date(t.date)})`, kind: 'HGS/OGS', cost: t.amount }))]; toast(`${tg.tolls.length} köprü/otoyol geçişi sözleşmeye eklendi`, 'ok'); }
    if (tg.km && Math.abs(tg.km - v.km) > 50) toast(`Uyarı: GPS km (${num(tg.km)}) ile girilen km (${num(v.km)}) farklı`, 'err');
    if (NS.integ && NS.integ.isOn('aracbildirim')) NS.integ.call('aracbildirim', 'iade-bildir', { plate: c.plate, contract: r.no, at: nowIso() }, { silent: true });
    // Araç geri geldi: kiralama kapanır; ödenmeyen tutar "Kalan" olarak açık kalır, tekrar iade alınamaz
    r.status = 'tamamlandi'; const x = bill(r); db.log('Araç iade', `${r.no} · ${num(x.driven)} km${late ? ` · ${late} gün gecikme` : ''}`); db.save(); photoStored([phIn]); toast(late ? `İade alındı: ${late} gün gecikme sözleşmeye eklendi` : 'İade tamamlandı', late ? 'warn' : 'ok');
    if (x.due > 0) await takePay(app, r);
    if (r.depositIn && !r.depositOut) await closeDeposit(app, r);
    if (bill(r).due < 0) toast(`Müşteriye ${money(-bill(r).due)} fazla ödeme iadesi gerekiyor`, 'warn');
    app.refresh();
  }
  const contractDoc = (r) => { const s = S(), c = car(r.car), m = cust(r.customer), x = bill(r); const marks = r.inDamage || r.outDamage || [];
    return { title: 'Araç kiralama sözleşmesi', no: r.no, date: r.from,
      info: [['Araç', `${carName(c)} (${c.year})`], ['Plaka', c.plate], ['Alış', `${NS.date(r.from)} ${r.fromTime || ''}`], ['İade', `${NS.date(r.to)} ${r.toTime || ''}`], ['Çıkış km / yakıt', r.outKm ? `${num(r.outKm)} · ${r.outFuel}/4` : '-'], ['Dönüş km / yakıt', r.inKm ? `${num(r.inKm)} · ${r.inFuel}/4` : '-']],
      party: { title: 'Kiracı', name: m.name, lines: [m.tc ? 'TC: ' + m.tc : '', m.license ? 'Ehliyet: ' + m.license : '', m.phone] },
      lines: [{ name: `Kira bedeli (${x.d} gün × ${money(r.daily)})`, qty: x.d, unit: 'gün', price: r.daily, total: x.base }, ...(x.disc ? [{ name: 'İndirim', qty: 1, price: -x.disc, total: -x.disc }] : []), ...EXTRAS.filter((e) => (r.extras || []).includes(e.id)).map((e) => ({ name: e.name, qty: x.d, unit: 'gün', price: e.daily, total: e.daily * x.d })), ...(x.kmFee ? [{ name: `Km aşımı (${num(x.overKm)} km)`, qty: x.overKm, price: s.extraKm, total: x.kmFee }] : []), ...(x.fuelFee ? [{ name: 'Eksik yakıt', qty: 1, price: x.fuelFee, total: x.fuelFee }] : []), ...(r.damages || []).map((d) => ({ name: d.desc, qty: 1, price: d.cost, total: d.cost }))],
      totals: [['Toplam', x.total, true], ['Ödenen', x.paid], ['Kalan', Math.max(0, x.due)], ['Depozito', r.depositIn ? r.depositIn.amount : r.deposit || 0]],
      note: `Günlük ${s.kmLimit} km dahildir; aşan her km için ${money(s.extraKm)} alınır. Araç aynı yakıt seviyesinde iade edilmelidir; eksik her çeyrek depo için ${money(s.fuelFee)} alınır. Trafik cezaları ve kiracı kusurlu hasarlar kiracıya aittir.${r.outNote ? '\nTeslim notu: ' + r.outNote : ''}`,
      damage: { svg: NS.docs.carSvg(marks), marks: NS.docs.damageText(marks) },
      signatures: [{ label: 'Kiracı — teslim', ...(r.signOut || {}) }, { label: r.signIn ? 'Kiracı — iade' : 'Kiralayan', ...(r.signIn || {}) }] }; };
  if (NS.docs) { NS.docs.define('kiralama', 'sozlesme', { label: 'Kiralama sözleşmesi', sample: () => { const r = db.all('rents')[0]; return r ? contractDoc(r) : {}; } }); [['makbuz', 'Tahsilat makbuzu'], ['depozito', 'Depozito kapatma belgesi'], ['tutanak', 'Teslim ve iade tutanağı']].forEach(([k, label]) => NS.docs.define('kiralama', k, { label })); }
  function printContract(r) {
    if (NS.docs) return NS.docs.print('sozlesme', contractDoc(r));
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
    const cars = db.all('cars', (c) => c.status !== 'pasif').sort((a, b) => a.cls.localeCompare(b.cls, 'tr'));
    el.innerHTML = `<div class="row mb"><button class="btn icon" data-g="-7">${icon('left')}</button><button class="btn" data-g="0">Bugün</button><button class="btn icon" data-g="7">${icon('right')}</button><span class="grow"></span>${Object.entries(ST).slice(0, 3).map(([k, v]) => badge(v[0], v[1])).join(' ')} <span class="badge warn">Bakımda</span><button class="btn primary" id="nr">${icon('plus')} Kiralama</button></div>
      <div class="card gantt-wrap"><div class="gantt" id="gt" style="grid-template-columns:${LABW}px repeat(${N}, ${COLW}px);grid-auto-rows:${ROWH}px"><div class="rl corner h">Araç</div>${ds.map((d) => `<div class="h ${d === today() ? 'td' : ''}">${NS.DAYS[new Date(d + 'T12:00').getDay()].slice(0, 2)}<br>${Number(d.slice(8))}</div>`).join('')}
      ${cars.map((c) => `<div class="rl"><b>${esc(c.plate)}</b><span class="small faint">${esc(carName(c))} · ${esc(c.cls)}</span></div>${ds.map((d) => `<div class="c" data-cell="${c.id}|${d}"></div>`).join('')}`).join('')}</div></div>`;
    const gt = $('#gt', el); const end = iso(addDays(gStart, N));
    const put = (ri, s, e, cls, label, id) => { const b = document.createElement('div'); b.className = 'bar ' + cls; if (id) b.dataset.r = id; b.style.cssText = `left:${LABW + s * COLW + 2}px;top:${ROWH * (ri + 1) + 8}px;width:${Math.max(COLW, (e - s) * COLW) - 4}px`; b.textContent = label; gt.appendChild(b); };
    cars.forEach((c, ri) => {
      if (c.status === 'bakim') put(ri, 0, N, 'bakim', 'Bakımda');
      (rentsByCar()[c.id] || []).filter((r) => r.from < end && H.endOf(r, today()) > gStart).forEach((r) => put(ri, Math.max(0, daysBetween(gStart, r.from)), Math.min(N, daysBetween(gStart, H.endOf(r, today()))), r.status, cust(r.customer).name, r.id));
    });
    on(el, 'click', '[data-g]', (e, b) => { const n = Number(b.dataset.g); gStart = n === 0 ? iso(addDays(new Date(), -2)) : iso(addDays(gStart, n)); app.refresh(); });
    $('#nr', el).onclick = () => rentForm(app);
    on(el, 'click', '[data-r]', (e, b) => rentDetail(app, db.get('rents', b.dataset.r)));
    on(el, 'click', '[data-cell]', (e, b) => { const [cid, d] = b.dataset.cell.split('|'); rentForm(app, { car: cid, from: d, to: iso(addDays(d, 3)) }); });
  }
  function dashboard(el, p, app) {
    const t = today(); const cars = db.all('cars'); const fleet = cars.filter((c) => c.status !== 'pasif'); const rents = db.all('rents');
    const out = rents.filter((r) => r.status === 'rezervasyon' && r.from <= t), back = rents.filter((r) => r.status === 'kirada' && r.to <= t);
    const onRent = rents.filter((r) => r.status === 'kirada').length;
    const d30 = iso(addDays(new Date(), -30));
    const util = Math.round((sum(rents.filter((r) => r.status !== 'iptal' && r.to > d30 && r.from <= t), (r) => Math.max(0, daysBetween(r.from > d30 ? r.from : d30, r.to < t ? r.to : t))) / (Math.max(1, fleet.length) * 30)) * 100);
    const al = alerts(); const deps = rents.filter(depPending); const nok = rents.filter((r) => ['kirada', 'tamamlandi'].includes(r.status) && r.from > d30 && !reported(r)); const tom = iso(addDays(new Date(), 1));
    const remind = rents.filter((r) => (r.status === 'rezervasyon' && r.from === tom) || (r.status === 'kirada' && r.to === tom));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="kirala.html" target="_blank" rel="noopener">${icon('globe')} Online kiralama</a><a class="btn" href="#/takvim">${icon('calendar')} Takvim</a><button class="btn primary" id="nr">${icon('plus')} Kiralama</button>`) + `
      <div class="grid g4 mb">${kpi('Kirada', `${onRent} / ${fleet.length}`, 'car', 'err')}${kpi('Müsait', Math.max(0, fleet.filter((c) => c.status !== 'bakim').length - onRent), 'check', 'ok')}${kpi('30 gün kullanım', '%' + util, 'percent', 'info')}${fin() ? kpi('30 gün ciro', money(sum(rents.filter((r) => r.status === 'tamamlandi' && r.to > d30), (r) => bill(r).total)), 'wallet', 'warn') : kpi('Bekleyen depozito', deps.length, 'wallet', 'warn')}</div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>${icon('key')} Teslim edilecek</h3></div><div class="card-b">${out.map((r) => `<div class="list-item"><div class="grow"><b>${esc(car(r.car).plate)}</b> ${esc(carName(car(r.car)))}${noShow(r) ? ' ' + badge('Gelmedi mi?', 'warn') : ''}<div class="small muted">${esc(cust(r.customer).name)} · ${NS.date(r.from)} · ${esc(r.channel || 'Online')}</div></div><button class="btn sm primary" data-o="${r.id}">Teslim</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('check')} İade alınacak</h3></div><div class="card-b">${back.map((r) => `<div class="list-item"><div class="grow"><b>${esc(car(r.car).plate)}</b>${overdue(r) ? ' ' + badge(`${daysBetween(r.to, t)} gün gecikti`, 'err') : ''}<div class="small muted">${esc(cust(r.customer).name)} · ${NS.date(r.to)}</div></div><button class="btn sm" data-b="${r.id}">İade</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('alert')} Hatırlatmalar (${al.length})</h3></div><div class="card-b">${al.map((a) => `<div class="list-item small"><b style="min-width:84px">${esc(a.c.plate)}</b><span class="grow">${a.t}</span>${badge(String(a.d).includes('-') ? NS.date(a.d) : a.d, 'warn')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>${icon('wallet')} Depozito iadesi bekleyen (${deps.length})</h3></div><div class="card-b">${deps.slice(0, 8).map((r) => `<div class="list-item"><div class="grow"><b>${esc(r.no)}</b> ${money(r.depositOut ? r.depositOut.refund : r.depositIn.amount)}${daysBetween(r.to, t) > 7 ? ' ' + badge(`${daysBetween(r.to, t)} gündür`, 'err') : ''}<div class="small muted">${esc(cust(r.customer).name)}</div></div><button class="btn sm" data-d="${r.id}">${r.depositOut ? 'İade edildi' : 'Kapat'}</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('shield')} Bildirim kaydı olmayan (${nok.length})</h3></div><div class="card-b"><p class="small muted">Kiralık araç bildirimi yetkili sistemden elle yapılır; numarasını buraya yazın.</p>${nok.slice(0, 6).map((r) => `<div class="list-item"><div class="grow"><b>${esc(r.no)}</b> ${esc(car(r.car).plate)}<div class="small muted">${esc(cust(r.customer).name)} · ${NS.date(r.from)}</div></div><button class="btn sm" data-k="${r.id}">Kaydet</button></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>${icon('message')} Yarınki kiralamalar (${remind.length})</h3></div><div class="card-b"><p class="small muted">Alış ve iade hatırlatması SMS ile gönderilir.</p><button class="btn block" id="sm" ${remind.length ? '' : 'disabled'}>${icon('send')} ${remind.length} müşteriye hatırlat</button></div></div></div>
      ${fin() ? `<div class="card"><div class="card-h"><h3>Sınıflara göre ciro (90 gün)</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(rents.filter((r) => r.status === 'tamamlandi' && r.to > iso(addDays(new Date(), -90))), (r) => car(r.car).cls)).map(([k, v]) => ({ label: k, value: sum(v, (r) => bill(r).total) })), { format: money })}</div></div>` : ''}`;
    $('#nr', el).onclick = () => rentForm(app);
    on(el, 'click', '[data-o]', (e, b) => rentDetail(app, db.get('rents', b.dataset.o)));
    on(el, 'click', '[data-b]', (e, b) => takeBack(app, db.get('rents', b.dataset.b)));
    on(el, 'click', '[data-d]', (e, b) => depositAct(app, db.get('rents', b.dataset.d)));
    on(el, 'click', '[data-k]', (e, b) => kabisForm(app, db.get('rents', b.dataset.k)));
    $('#sm', el).onclick = () => NS.smsBatch(db, remind.map((r) => { const m = cust(r.customer), rez = r.status === 'rezervasyon'; return { to: m.phone, name: m.name, text: `${S().bizName}: ${car(r.car).plate} ${rez ? `aracınız yarın ${r.fromTime || ''} alışa hazır` : `iade tarihiniz yarın ${r.toTime || ''}`}. Sözleşme ${r.no}.` }; }), 'hatırlatma');
  }
  function rentsPage(el, p, app) {
    let q = '', f = ''; const LIM = 300;
    el.innerHTML = pageHead('Kiralamalar', 'Rezervasyon, aktif ve tamamlanan kiralamalar', `<button class="btn" id="xl">${icon('download')} Excel</button><button class="btn primary" id="nr">${icon('plus')} Kiralama</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'No, plaka, müşteri, telefon...')}<div class="seg">${[['', 'Tümü'], ['rezervasyon', 'Rezervasyon'], ['kirada', 'Kirada'], ['gecikti', 'Geciken'], ['tamamlandi', 'Tamamlanan'], ['iptal', 'İptal']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const list = () => db.all('rents', (r) => (!f || (f === 'gecikti' ? overdue(r) : r.status === f)) && NS.match(q, r.no, car(r.car).plate, cust(r.customer).name, cust(r.customer).phone)).sort((a, b) => b.from.localeCompare(a.from));
    const draw = () => { const rows = list(); const live = rows.filter((r) => r.status !== 'iptal'); $('#t', el).innerHTML = table({ rows: rows.slice(0, LIM), empty: 'Bu ölçütte kiralama yok', columns: [{ label: 'No', render: (r) => `<b>${esc(r.no)}</b>${r.source === 'online' ? `<div>${badge('Online' + (r.prepaid ? ' · ödendi' : ''), 'acc')}</div>` : ''}${r.flight ? `<div class="small faint">${esc(r.flight)}</div>` : ''}` }, { label: 'Araç', render: (r) => `${esc(car(r.car).plate)}<div class="small faint">${esc(carName(car(r.car)))}</div>` }, { label: 'Müşteri', render: (r) => esc(cust(r.customer).name) }, { label: 'Tarih', render: (r) => `${NS.date(r.from)} → ${NS.date(r.to)}` }, { label: 'Gün', cls: 'right', render: days }, { label: 'Durum', render: (r) => (overdue(r) ? badge(`${daysBetween(r.to, today())} gün gecikti`, 'err') : badge(ST[r.status][0], ST[r.status][1])) }, { label: 'Tutar', cls: 'right', render: (r) => money(bill(r).total) }, { label: 'Kalan', cls: 'right', render: (r) => { const d = bill(r).due; return d > 0 && r.status !== 'rezervasyon' && r.status !== 'iptal' ? `<b style="color:var(--err)">${money(d)}</b>` : d < 0 ? `<span style="color:var(--err)">İade ${money(-d)}</span>` : '-'; } }], actions: [{ icon: 'eye', act: 'v' }], foot: `${rows.length} kiralama · ${money(sum(live, (r) => bill(r).total))}${rows.length > LIM ? ` · ilk ${LIM} satır gösteriliyor, aramayla daraltın` : ''}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => rentDetail(app, db.get('rents', b.dataset.id)));
    $('#nr', el).onclick = () => rentForm(app);
    $('#xl', el).onclick = () => NS.csv('kiralamalar', list(), [{ key: 'no', label: 'No' }, { label: 'Plaka', value: (r) => car(r.car).plate }, { label: 'Müşteri', value: (r) => cust(r.customer).name }, { key: 'from', label: 'Alış' }, { key: 'to', label: 'İade' }, { label: 'Durum', value: (r) => ST[r.status][0] }, { label: 'Toplam', value: (r) => bill(r).total }, { label: 'Ödenen', value: (r) => bill(r).paid }, { label: 'Kalan', value: (r) => bill(r).due }]);
    draw();
  }
  function fleetPage(el, p, app) {
    NS.crud(el, app, {
      col: 'cars', title: 'Filo', sub: 'Araçlar, fiyatlar, km ve evrak tarihleri', single: 'Araç', addLabel: 'Yeni araç', emptyIcon: 'car',
      canDelete: (c) => ((rentsByCar()[c.id] || []).length || db.all('rents', (r) => r.car === c.id).length ? 'Bu aracın kiralama kaydı var; silinemez. Durumunu "Satıldı / pasif" yapın.' : db.find('maint', (m) => m.car === c.id) ? 'Bu aracın bakım kaydı var; silinemez. Durumunu "Satıldı / pasif" yapın.' : true),
      beforeSave: (v, rec) => { if (db.find('cars', (c) => c.id !== (rec || {}).id && NS.trLower(String(c.plate).replace(/\s/g, '')) === NS.trLower(String(v.plate).replace(/\s/g, '')))) return 'Bu plaka zaten kayıtlı'; if (rec && v.status !== 'aktif' && rec.status === 'aktif' && db.find('rents', (r) => r.car === rec.id && r.status === 'kirada')) return 'Araç şu an kirada; durumu iade alındıktan sonra değiştirin'; return true; },
      fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', required: true }, { name: 'model', label: 'Model', required: true }, { name: 'year', label: 'Yıl', type: 'number' }, { name: 'cls', label: 'Sınıf', type: 'select', options: ['Ekonomi', 'Orta', 'Üst', 'SUV', 'Lüks', 'Minibüs'] }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'Hibrit', 'Elektrik'] }, { name: 'gear', label: 'Vites', type: 'select', options: ['Manuel', 'Otomatik'] }, { name: 'daily', label: 'Günlük fiyat', type: 'number', required: true }, { name: 'km', label: 'Güncel km', type: 'number' }, { name: 'nextService', label: 'Sonraki bakım km', type: 'number' }, { name: 'insuranceEnd', label: 'Sigorta bitiş', type: 'date' }, { name: 'inspectionEnd', label: 'Muayene bitiş', type: 'date' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'aktif', label: 'Aktif' }, { value: 'bakim', label: 'Bakımda' }, { value: 'pasif', label: 'Satıldı / pasif' }] }, { name: 'color', label: 'Renk', type: 'color' }],
      sort: (a, b) => String(a.cls).localeCompare(String(b.cls), 'tr'), searchFields: (c) => [c.plate, c.brand, c.model], defaults: { status: 'aktif', cls: 'Ekonomi', km: 0 },
      columns: [{ key: 'plate', label: 'Araç', render: (c) => `<div class="carcard"><div class="cc" style="background:${esc(c.color || '#64748b')}">${icon('car')}</div><div><b>${esc(c.plate)}</b><div class="small">${esc(carName(c))} · ${esc(c.year || '')}</div></div></div>` }, { key: 'cls', label: 'Sınıf', render: (c) => `${esc(c.cls)}<div class="small faint">${esc(c.fuel)} · ${esc(c.gear)}</div>` }, { key: 'daily', label: 'Günlük', cls: 'right', render: (c) => money(c.daily) }, { key: 'km', label: 'Km', cls: 'right', render: (c) => `${num(c.km)}${c.nextService && c.km >= c.nextService - 1000 ? `<div>${badge('Bakım zamanı', 'warn')}</div>` : ''}` }, { label: 'Evrak', render: (c) => `<div class="small">Sigorta ${!c.insuranceEnd ? '-' : c.insuranceEnd <= iso(addDays(new Date(), 30)) ? badge(NS.date(c.insuranceEnd), 'err') : NS.date(c.insuranceEnd)}</div><div class="small">Muayene ${!c.inspectionEnd ? '-' : c.inspectionEnd <= iso(addDays(new Date(), 30)) ? badge(NS.date(c.inspectionEnd), 'err') : NS.date(c.inspectionEnd)}</div>` }, { key: 'status', label: 'Durum', render: (c) => (c.status === 'pasif' ? badge('Pasif') : c.status === 'bakim' ? badge('Bakımda', 'warn') : (rentsByCar()[c.id] || []).some((r) => r.status === 'kirada') ? badge('Kirada', 'err') : badge('Müsait', 'ok')) }, ...(fin() ? [{ label: '90 gün ciro', cls: 'right', render: (c) => money(sum((rentsByCar()[c.id] || []).filter((r) => r.status === 'tamamlandi' && r.to > iso(addDays(new Date(), -90))), (r) => bill(r).total)) }] : [])],
    });
  }
  function maintPage(el, p, app) {
    NS.crud(el, app, {
      col: 'maint', title: 'Bakım & Masraf', sub: 'Servis, lastik, onarım kayıtları', single: 'Bakım', addLabel: 'Yeni kayıt', emptyIcon: 'wrench',
      fields: () => [{ name: 'car', label: 'Araç', type: 'select', options: db.all('cars').map((c) => ({ value: c.id, label: `${c.plate} · ${carName(c)}` })) }, { name: 'date', label: 'Tarih', type: 'date' }, { name: 'km', label: 'Km', type: 'number' }, { name: 'type', label: 'İşlem', type: 'select', options: ['Periyodik bakım', 'Lastik değişimi', 'Fren balatası', 'Kaporta onarımı', 'Cam değişimi', 'Klima gazı', 'Yıkama', 'Diğer'] }, { name: 'cost', label: 'Tutar', type: 'number' }, { name: 'note', label: 'Not', full: true }, { name: 'open', label: 'Araç hâlâ serviste', type: 'checkbox' }],
      defaults: { date: today() }, sort: (a, b) => b.date.localeCompare(a.date),
      beforeSave: (v) => (v.open && db.find('rents', (r) => r.car === v.car && r.status === 'kirada') ? 'Araç kirada; servise alınmadan önce iade alın' : true),
      canDelete: (m) => (m.open ? 'Araç hâlâ serviste; önce kaydı kapatın' : true),
      onSave: (v) => { const c = car(v.car); const still = db.find('maint', (m) => m.car === v.car && m.open); if (still) c.status = 'bakim'; else if (c.status === 'bakim') c.status = 'aktif'; if (v.type === 'Periyodik bakım' && v.km) c.nextService = Number(v.km) + 15000; if (Number(v.km) > (Number(c.km) || 0)) c.km = Number(v.km); db.save(); },
      columns: [{ key: 'date', label: 'Tarih', render: (m) => NS.date(m.date) }, { label: 'Araç', render: (m) => `<b>${esc(car(m.car).plate)}</b> ${esc(carName(car(m.car)))}` }, { key: 'type', label: 'İşlem', render: (m) => `${esc(m.type)}${m.open ? ' ' + badge('Serviste', 'warn') : ''}` }, { key: 'km', label: 'Km', cls: 'right', render: (m) => num(m.km) }, { key: 'cost', label: 'Tutar', cls: 'right', render: (m) => money(m.cost) }],
    });
  }
  function reportsPage(el) {
    const cars = db.all('cars'); const d90 = iso(addDays(new Date(), -90)); const mt = NS.groupBy(db.all('maint', (m) => m.date > d90), (m) => m.car);
    const rows = cars.map((c) => { const rs = (rentsByCar()[c.id] || []).filter((r) => r.status === 'tamamlandi' && r.to > d90); const rev = sum(rs, (r) => bill(r).total), cost = sum(mt[c.id] || [], (m) => m.cost), dd = sum(rs, days); return { id: c.id, c, rev, cost, dd, util: Math.round((dd / 90) * 100) }; }).sort((a, b) => b.rev - a.rev);
    const open = db.all('rents', (r) => r.status === 'tamamlandi' && bill(r).due > 0); const dep = db.all('rents', depPending);
    el.innerHTML = pageHead('Raporlar', 'Son 90 gün araç bazlı kârlılık ve kullanım', `<button class="btn" id="xl">${icon('download')} Excel</button>`) + `
      <div class="grid g4 mb">${kpi('Ciro', money(sum(rows, (r) => r.rev)), 'trend', 'ok')}${kpi('Bakım masrafı', money(sum(rows, (r) => r.cost)), 'wrench', 'err')}${kpi('Kiralanan gün', num(sum(rows, (r) => r.dd)), 'calendar', 'info')}${kpi('Ort. kullanım', '%' + Math.round(sum(rows, (r) => r.util) / Math.max(1, rows.length)), 'percent', 'warn')}</div>
      <div class="grid g2 mb">${kpi('Açık alacak', money(sum(open, (r) => bill(r).due)), 'wallet', 'err', `<div class="small faint">${open.length} kiralama</div>`)}${kpi('Bekleyen depozito', money(sum(dep, (r) => (r.depositOut ? r.depositOut.refund : r.depositIn.amount))), 'wallet', 'warn', `<div class="small faint">${dep.length} kiralama</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kanal dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(db.all('rents', (r) => r.status !== 'iptal' && r.from > d90), (r) => r.channel || 'Online')).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div><div class="card"><div class="card-h"><h3>Araç kullanım oranı</h3></div><div class="card-b">${chart.bars(rows.slice(0, 12).map((r) => ({ label: String(r.c.model).slice(0, 7), value: r.util, color: r.c.color })), { format: (v) => '%' + v })}</div></div></div>
      <div class="card">${table({ rows, columns: [{ label: 'Araç', render: (r) => `<b>${esc(r.c.plate)}</b> ${esc(carName(r.c))}` }, { label: 'Gün', cls: 'right', render: (r) => r.dd }, { label: 'Kullanım', cls: 'right', render: (r) => badge('%' + r.util, r.util > 60 ? 'ok' : r.util > 30 ? 'warn' : 'err') }, { label: 'Ciro', cls: 'right', render: (r) => money(r.rev) }, { label: 'Masraf', cls: 'right', render: (r) => money(r.cost) }, { label: 'Net', cls: 'right', render: (r) => `<b>${money(r.rev - r.cost)}</b>` }] })}</div>`;
    $('#xl', el).onclick = () => NS.csv('arac-karlilik', rows, [{ label: 'Plaka', value: (r) => r.c.plate }, { label: 'Araç', value: (r) => carName(r.c) }, { key: 'dd', label: 'Gün' }, { key: 'util', label: 'Kullanım %' }, { key: 'rev', label: 'Ciro' }, { key: 'cost', label: 'Masraf' }, { label: 'Net', value: (r) => r.rev - r.cost }]);
  }

  const ROLES = { admin: 'Yönetici', ofis: 'Ofis personeli' };
  NS.shell({
    id: 'kiralama', integrations: ['sms', 'whatsapp', 'email', 'pos', 'payment', 'efatura', 'printer', 'webhook', 'backup'], name: 'Araç Kiralama', tagline: 'Rent a Car Yönetimi', icon: 'car', accent: '#dc2626', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Kiralama' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'takvim', label: 'Müsaitlik Takvimi', icon: 'calendar' }, { id: 'kiralamalar', label: 'Kiralamalar', icon: 'list' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users' }, { sec: 'Filo' }, { id: 'filo', label: 'Araçlar', icon: 'car' }, { id: 'bakim', label: 'Bakım & Masraf', icon: 'wrench' }, { id: 'sezon', label: 'Sezon Fiyatları', icon: 'tag', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ozet: dashboard, takvim: calendarPage, kiralamalar: rentsPage, filo: fleetPage, bakim: maintPage, raporlar: reportsPage,
      sezon: (el, p, a) => NS.crud(el, a, { col: 'seasons', title: 'Sezon Fiyatları', sub: 'Tarih aralığında günlük fiyatı artırır veya azaltır; panelde ve online kiralamada aynı hesap kullanılır', single: 'Sezon', addLabel: 'Yeni sezon', emptyIcon: 'tag', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'from', label: 'Başlangıç', type: 'date', required: true }, { name: 'to', label: 'Bitiş', type: 'date', required: true }, { name: 'pct', label: 'Oran % (indirim için eksi)', type: 'number', required: true }, { name: 'cls', label: 'Sınıf (boş = tümü)', type: 'select', options: ['', 'Ekonomi', 'Orta', 'Üst', 'SUV', 'Lüks', 'Minibüs'] }], sort: (x, y) => String(x.from).localeCompare(String(y.from)), beforeSave: (v) => (v.to < v.from ? 'Bitiş tarihi başlangıçtan önce olamaz' : Number(v.pct) <= -100 ? 'Oran -100 veya altında olamaz' : true), columns: [{ key: 'name', label: 'Sezon' }, { label: 'Tarih', render: (x) => `${NS.date(x.from)} – ${NS.date(x.to)}` }, { key: 'pct', label: 'Oran', cls: 'right', render: (x) => `${Number(x.pct) > 0 ? '+' : ''}%${esc(x.pct)}` }, { key: 'cls', label: 'Sınıf', render: (x) => esc(x.cls || 'Tümü') }] }),
      musteriler: (el, p, a) => NS.crud(el, a, { col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: CF, sort: (x, y) => x.name.localeCompare(y.name, 'tr'), searchFields: (c) => [c.name, c.phone, c.tc, c.license], filters: [{ value: 'all', label: 'Tümü' }, { value: 'b', label: 'Kara liste', test: (c) => c.blacklist }], canDelete: (c) => (db.find('rents', (r) => r.customer === c.id) ? 'Bu müşterinin kiralama kaydı var; silinemez.' : true), beforeSave: async (v, rec) => { const d = (x) => String(x || '').replace(/\D/g, '').slice(-10); if (db.find('customers', (c) => c.id !== (rec || {}).id && d(c.phone) === d(v.phone) && d(v.phone).length === 10)) return 'Bu telefonla kayıtlı müşteri var'; if (rec && rec.blacklist && !v.blacklist && !(await NS.approve(a, `${rec.name} kara listeden çıkarma`, ['admin']))) return false; return true; }, columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b>${c.blacklist ? ' ' + badge('Kara liste', 'err') : ''}<div class="small faint">${esc(c.phone)}</div>` }, { key: 'license', label: 'Ehliyet', render: (c) => `${esc(c.license || '')}<div class="small faint">${c.licenseDate ? new Date().getFullYear() - Number(c.licenseDate.slice(0, 4)) + ' yıllık' : ''}</div>` }, { label: 'Kiralama', cls: 'right', render: (c) => (rentsByCust()[c.id] || []).length }, ...(fin() ? [{ label: 'Ciro', cls: 'right', render: (c) => money(sum((rentsByCust()[c.id] || []).filter((r) => r.status === 'tamamlandi'), (r) => bill(r).total)) }] : [])] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, defaults: H.DEF, fields: [{ type: 'section', label: 'Kiralama kuralları' }, { name: 'kmLimit', label: 'Günlük km limiti', type: 'number' }, { name: 'extraKm', label: 'Aşım km ücreti (₺)', type: 'number' }, { name: 'fuelFee', label: 'Çeyrek depo yakıt ücreti (₺)', type: 'number' }, { name: 'minAge', label: 'Minimum yaş', type: 'number' }, { name: 'minLicense', label: 'Minimum ehliyet yılı', type: 'number' }, { name: 'graceHours', label: 'Geç iade toleransı (saat)', type: 'number' }, { type: 'section', label: 'Fiyat ve iptal' }, { name: 'longDays', label: 'Uzun kiralama günü', type: 'number' }, { name: 'longPct', label: 'Uzun kiralama indirimi %', type: 'number' }, { name: 'freeCancelHours', label: 'Ücretsiz iptal (saat önce)', type: 'number' }, { name: 'vatPct', label: 'KDV oranı % (fiyatlar KDV dahil)', type: 'number' }] }),
    },
  });
})();
