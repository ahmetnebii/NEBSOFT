/* NEBSOFT Randevu — takvim, personel, hizmet, müşteri, paket, hatırlatma, kasa ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const R = window.RANDEVU;
  const db = new NS.DB('randevu', R.seed);
  const S = () => db.settings({ open: '09:00', close: '20:00', slot: 15 });
  const ST = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylı', 'info'], geldi: ['Geldi', 'acc'], tamam: ['Tamamlandı', 'ok'], gelmedi: ['Gelmedi', 'err'], iptal: ['İptal', ''] };
  const SRC = { online: 'Online', telefon: 'Telefon', salon: 'Salonda', whatsapp: 'WhatsApp' };
  const PAY = { nakit: 'Nakit', kart: 'Kart', havale: 'Havale', paket: 'Paketten' };
  const staff = (id) => db.get('staff', id) || { name: '-', color: '#64748b' };
  const svc = (id) => db.get('services', id) || { name: '-', duration: 30, price: 0 };
  const cust = (id) => db.get('customers', id) || { name: '-', phone: '' };
  const PPM = 1.5; // takvimde dakika başına piksel
  const myStaff = () => (NS.currentUser && NS.currentUser.role === 'personel' ? NS.currentUser.staff : null);
  const visibleStaff = () => db.all('staff', (s) => s.active !== false && (!myStaff() || s.id === myStaff()));
  // Paket ancak hakkı kalmışsa ve süresi dolmamışsa kullanılır
  const pkValid = (p) => p.used < p.total && (!p.expires || p.expires >= today());
  const pkFor = (customer, service) => db.all('packages', (p) => p.customer === customer && (!service || p.service === service) && pkValid(p)).sort((a, b) => String(a.expires || '9').localeCompare(String(b.expires || '9')));
  // Seans düşümü kim / ne zaman / hangi randevu olarak kaydedilir (geri alınabilsin diye)
  const pkUse = (p, appt, note) => { p.used++; p.log = [...(p.log || []), { at: new Date().toISOString(), appt: appt || null, by: (NS.currentUser || {}).name || '', note: note || '' }]; };
  // SMS kaydının durumu: yalnızca sağlayıcı kabul ettiyse "gönderildi"
  const smsTone = (st) => (/^gönderildi/.test(st) ? 'ok' : /^TEST|simülasyon/.test(st) ? 'warn' : /^hata|kapalı|gönderilmedi/.test(st) ? 'err' : '');
  const smsLabel = (st) => (st === 'simülasyon' ? 'TEST — gönderilmedi' : st);

  // ---------- Randevu formu ----------
  async function apptForm(app, rec = {}, done) {
    const isNew = !rec.id;
    const given = Object.fromEntries(Object.entries(rec).filter(([, x]) => x !== undefined && x !== null && x !== ''));
    const v = { date: today(), staff: (visibleStaff()[0] || db.all('staff')[0] || {}).id, status: 'onay', source: 'telefon', ...given };
    if (!v.service) v.service = (db.all('services', (s) => (s.staff || []).includes(v.staff))[0] || db.all('services')[0] || {}).id;
    if (!v.staff || !v.service) return toast('Önce personel ve hizmet tanımlayın', 'err');
    modal({
      title: isNew ? 'Yeni Randevu' : 'Randevuyu Düzenle', size: 'wide',
      body: `<div class="form-grid">
        <div class="field full"><label>Müşteri *</label><div class="row nw"><select class="input" id="fc"><option value="">Müşteri seçin...</option>${db.all('customers').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => `<option value="${c.id}" ${c.id === v.customer ? 'selected' : ''}>${esc(c.name)} · ${esc(c.phone)}</option>`).join('')}</select><button class="btn" id="fcn">${icon('plus')} Yeni</button></div><div class="small" id="fci"></div></div>
        <div class="field"><label>Hizmet *</label><select class="input" id="fs">${db.all('services').map((s) => `<option value="${s.id}" ${s.id === v.service ? 'selected' : ''}>${esc(s.name)} · ${s.duration} dk · ${money(s.price)}</option>`).join('')}</select></div>
        <div class="field"><label>Personel *</label><select class="input" id="fp"></select></div>
        <div class="field"><label>Tarih *</label><input class="input" type="date" id="fd" value="${v.date}"></div>
        <div class="field"><label>Süre (dk)</label><input class="input" type="number" id="fdu" step="5" value="${v.duration || svc(v.service).duration}"></div>
        <div class="field full"><label>Saat * <span class="faint" id="fsl"></span></label><div class="slots" id="slots"></div><input class="input mt" id="ft" placeholder="veya elle: 14:30" value="${v.start || ''}" style="max-width:160px"></div>
        <div class="field"><label>Ücret (₺)</label><input class="input" type="number" id="fpr" value="${v.price ?? svc(v.service).price}"></div>
        <div class="field"><label>Durum</label><select class="input" id="fst">${Object.entries(ST).map(([k, x]) => `<option value="${k}" ${k === v.status ? 'selected' : ''}>${x[0]}</option>`).join('')}</select></div>
        <div class="field"><label>Kaynak</label><select class="input" id="fsrc">${Object.entries(SRC).map(([k, x]) => `<option value="${k}" ${k === v.source ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Not</label><input class="input" id="fn" value="${esc(v.note || '')}"></div>
        ${isNew ? `<div class="field"><label>Tekrar</label><select class="input" id="frp"><option value="0">Tekrar yok</option>${[1, 2, 3, 4].map((n) => `<option value="${n}">${n === 1 ? 'Her hafta' : `${n} haftada bir`}</option>`).join('')}</select></div><div class="field"><label>Toplam randevu sayısı</label><input class="input" type="number" id="frn" min="2" max="26" value="4"></div>` : ''}
      </div>`,
      onOpen: (b) => {
        const fill = () => {
          const sid = $('#fs', b).value;
          const allowed = db.all('staff', (s) => svc(sid).staff.includes(s.id));
          const cur = $('#fp', b).value || v.staff;
          $('#fp', b).innerHTML = allowed.map((s) => `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>${esc(s.name)} — ${esc(s.title)}</option>`).join('');
          slots();
        };
        const slots = () => {
          const list = R.freeSlots(db, $('#fp', b).value, $('#fd', b).value, Number($('#fdu', b).value) || 30, v.id);
          const cur = $('#ft', b).value;
          $('#fsl', b).textContent = list.length ? `(${list.length} boş saat)` : '(bu gün müsait saat yok)';
          $('#slots', b).innerHTML = list.map((t) => `<button class="btn sm ${t === cur ? 'active' : ''}" data-sl="${t}">${t}</button>`).join('') || '<div class="faint small">Personel bu gün çalışmıyor ya da dolu. Saati elle girebilirsiniz.</div>';
        };
        const custInfo = () => {
          const c = db.get('customers', $('#fc', b).value);
          if (!c) { $('#fci', b).innerHTML = ''; return; }
          const pk = pkFor(c.id);
          const past = db.all('appointments', (a) => a.customer === c.id && a.status === 'tamam').length;
          const nos = db.all('appointments', (a) => a.customer === c.id && a.status === 'gelmedi').length;
          $('#fci', b).innerHTML = `<span class="muted">${past} tamamlanan randevu</span>${nos ? ' · ' + badge(nos + ' kez gelmedi', 'err') : ''}${c.notes ? ' · ' + badge(c.notes, 'warn') : ''}${pk.map((p) => ' · ' + badge(`Paket: ${svc(p.service).name} ${p.total - p.used} seans`, 'ok')).join('')}`;
        };
        $('#fs', b).onchange = () => { $('#fdu', b).value = svc($('#fs', b).value).duration; $('#fpr', b).value = svc($('#fs', b).value).price; fill(); };
        $('#fp', b).onchange = slots; $('#fd', b).onchange = slots; $('#fdu', b).onchange = slots;
        $('#fc', b).onchange = custInfo;
        on(b, 'click', '[data-sl]', (e, t) => { $('#ft', b).value = t.dataset.sl; $$('[data-sl]', b).forEach((x) => x.classList.toggle('active', x === t)); });
        $('#fcn', b).onclick = async () => {
          const c = await formModal({ title: 'Yeni müşteri', fields: CUST_FIELDS });
          if (c) { const n = db.insert('customers', { ...c, tags: [] }); $('#fc', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)} · ${esc(n.phone)}</option>`); $('#fc', b).value = n.id; custInfo(); }
        };
        fill(); custInfo();
      },
      actions: [{ label: 'Vazgeç' }, {
        label: isNew ? 'Randevu oluştur' : 'Kaydet', cls: 'primary', icon: 'check', onClick: (close, b) => {
          const data = { customer: $('#fc', b).value, service: $('#fs', b).value, staff: $('#fp', b).value, date: $('#fd', b).value, start: $('#ft', b).value.trim(), duration: Number($('#fdu', b).value) || 30, price: Number($('#fpr', b).value) || 0, status: $('#fst', b).value, source: $('#fsrc', b).value, note: $('#fn', b).value.trim() };
          if (!data.customer) return toast('Müşteri seçin', 'err');
          if (!/^\d{1,2}:\d{2}$/.test(data.start)) return toast('Saat seçin', 'err');
          data.start = R.toHM(R.toMin(data.start));
          const clash = db.find('appointments', (a) => a.id !== v.id && a.staff === data.staff && a.date === data.date && a.status !== 'iptal' && R.toMin(a.start) < R.toMin(data.start) + data.duration && R.toMin(data.start) < R.toMin(a.start) + a.duration);
          if (clash && !window.confirm(`${staff(data.staff).name} bu saatte dolu (${clash.start} ${cust(clash.customer).name}). Yine de kaydedilsin mi?`)) return;
          let extra = '';
          if (isNew) {
            const rep = Number(($('#frp', b) || {}).value) || 0, cnt = NS.clamp(Number(($('#frn', b) || {}).value) || 1, 1, 26);
            const first = db.insert('appointments', { ...data, ...(rep ? { series: NS.uid() } : {}) }); db.log('Randevu oluşturuldu', `${cust(data.customer).name} · ${NS.date(data.date)} ${data.start}`);
            // Tekrarlayan randevu: personelin o gün o saati boşsa eklenir, değilse atlanıp listelenir
            if (rep) {
              const skip = []; let made = 1;
              for (let k = 1; k < cnt; k++) { const d = iso(addDays(data.date, 7 * rep * k)); if (R.freeSlots(db, data.staff, d, data.duration).includes(data.start)) { db.insert('appointments', { ...data, date: d, series: first.series }); made++; } else skip.push(NS.date(d)); }
              extra = ` · ${made} randevu${skip.length ? ` · dolu olduğu için eklenmedi: ${skip.join(', ')}` : ''}`;
            }
            if (rec.waitId) db.update('waitlist', rec.waitId, { status: 'randevu', appt: first.id });
          } else db.update('appointments', v.id, data);
          // Google / Outlook takvimine personel takvimi olarak yazılır
          if (NS.integ && NS.integ.isOn('takvim')) NS.integ.call('takvim', isNew ? 'etkinlik-ekle' : 'etkinlik-guncelle', { ref: v.id || '', calendar: staff(data.staff).name, title: `${cust(data.customer).name} — ${svc(data.service).name}`, start: `${data.date}T${data.start}`, minutes: data.duration, phone: cust(data.customer).phone }, { silent: true });
          close(); toast((isNew ? 'Randevu oluşturuldu' : 'Randevu güncellendi') + extra, 'ok');
          done ? done() : app.refresh();
        },
      }],
    });
  }

  function apptDetail(app, a) {
    const c = cust(a.customer), s = svc(a.service), st = staff(a.staff);
    const pk = pkFor(c.id, a.service);
    const wa = `https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(smsText(a))}`;
    modal({
      title: 'Randevu', size: 'wide',
      body: `<div class="grid g2"><div class="col">
          <div class="row nw"><div class="avatar lg" style="background:${st.color}22;color:${st.color}">${esc(NS.initials(c.name))}</div><div><b style="font-size:16px">${esc(c.name)}</b><div class="muted small">${esc(c.phone)} ${c.email ? '· ' + esc(c.email) : ''}</div></div></div>
          ${c.notes ? `<div class="card pad small" style="background:var(--warn-soft);border:0">${icon('alert')} ${esc(c.notes)}</div>` : ''}
          <div class="list-item"><span class="grow muted">Hizmet</span><b>${esc(s.name)}</b></div>
          <div class="list-item"><span class="grow muted">Personel</span><b style="color:${st.color}">${esc(st.name)}</b></div>
          <div class="list-item"><span class="grow muted">Tarih</span><b>${NS.dateLong(a.date)}</b></div>
          <div class="list-item"><span class="grow muted">Saat</span><b>${a.start} – ${R.toHM(R.toMin(a.start) + a.duration)} (${a.duration} dk)</b></div>
          <div class="list-item"><span class="grow muted">Ücret</span><b>${money(a.price)}</b></div>
          <div class="list-item"><span class="grow muted">Durum</span>${badge(ST[a.status][0], ST[a.status][1])}${a.paid ? badge('Ödendi · ' + (PAY[a.payType] || ''), 'ok') : ''}</div>
          <div class="list-item"><span class="grow muted">Kaynak</span><span>${SRC[a.source] || '-'}</span></div>
          ${a.note ? `<div class="list-item"><span class="grow muted">Not</span><span>${esc(a.note)}</span></div>` : ''}
        </div><div class="col">
          ${a.status === 'bekliyor' ? `<button class="btn lg primary" data-x="onay">${icon('check')} Randevuyu onayla</button>` : ''}
          ${['onay', 'bekliyor'].includes(a.status) ? `<button class="btn lg" data-x="geldi">${icon('user')} Müşteri geldi</button>` : ''}
          ${!['tamam', 'iptal'].includes(a.status) ? `<button class="btn lg ok" data-x="tamam">${icon('wallet')} Tamamla ve ödeme al</button>` : ''}
          ${pk.length && !a.paid ? `<div class="small muted">Müşterinin bu hizmet için paketi var: ${pk[0].total - pk[0].used} seans kaldı</div>` : ''}
          <a class="btn lg" href="${wa}" target="_blank" rel="noopener">${icon('message')} WhatsApp ile hatırlat</a>
          <button class="btn lg" data-x="sms">${icon('send')} SMS hatırlatma gönder</button>
          <button class="btn lg" data-x="edit">${icon('edit')} Düzenle / Taşı</button>
          <button class="btn lg" data-x="again">${icon('refresh')} Aynı randevuyu tekrar oluştur</button>
          ${!['tamam', 'iptal'].includes(a.status) ? `<div class="row"><button class="btn grow" data-x="gelmedi">${icon('x')} Gelmedi</button><button class="btn danger grow" data-x="iptal">${icon('trash')} İptal</button></div>` : ''}
        </div></div>`,
      onOpen: (b, close) => on(b, 'click', '[data-x]', async (e, t) => {
        const x = t.dataset.x;
        close();
        if (x === 'onay' || x === 'geldi' || x === 'gelmedi') { a.status = x; db.log('Randevu ' + ST[x][0], c.name); db.save(); app.refresh(); }
        else if (x === 'iptal') { if (await confirm('Randevu iptal edilsin mi?')) { a.status = 'iptal'; db.log('Randevu iptal', c.name); db.save(); app.refresh(); const w = waitFor(a.date, a.staff); if (w.length) toast(`Bu gün için bekleme listesinde ${w.length} kişi var — Takvim > Bekleme listesi`, 'info'); } }
        else if (x === 'edit') apptForm(app, a);
        else if (x === 'again') apptForm(app, { customer: a.customer, service: a.service, staff: a.staff, date: iso(addDays(a.date, 28)), duration: a.duration, price: a.price });
        else if (x === 'sms') { if (a.noReminder && !(await confirm('Müşteri online randevuda hatırlatma istemediğini belirtti. Yine de gönderilsin mi?', { ok: 'Gönder', danger: false }))) return; await remindOne(a); app.refresh(); }
        else if (x === 'tamam') completeModal(app, a);
      }),
    });
  }
  function completeModal(app, a) {
    const pk = pkFor(a.customer, a.service);
    formModal({
      title: 'Ödeme al', submitLabel: 'Tamamla',
      fields: [{ name: 'payType', label: 'Ödeme şekli', type: 'select', options: Object.entries(PAY).filter(([k]) => k !== 'paket' || pk.length).map(([value, label]) => ({ value, label })), value: pk.length ? 'paket' : 'kart' }, { name: 'price', label: 'Hizmet ücreti (₺)', type: 'number', value: a.price }, { name: 'discount', label: 'İndirim (₺)', type: 'number', value: 0 }, { name: 'tip', label: 'Bahşiş (₺)', type: 'number', value: 0, hint: 'Personele aktarılır' }, { name: 'product', label: 'Ürün satışı (₺)', type: 'number', value: 0, hint: 'Şampuan, bakım ürünü vb.' }, { name: 'doc', label: 'Belge', type: 'select', options: [{ value: '', label: 'Belge kesme' }, { value: 'okc', label: 'Yazarkasa fişi (ÖKC)' }, { value: 'efatura', label: 'e-Arşiv fatura' }, { value: 'esmm', label: 'e-SMM (serbest meslek)' }] }],
    }).then(async (v) => {
      if (!v) return;
      if (v.payType === 'kart' && NS.integ) { const amt = Math.max(0, (v.price || 0) - (v.discount || 0)) + (v.product || 0) + (v.tip || 0); if (amt > 0) { const r = await NS.integ.cardPayment(amt); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); } }
      const amt2 = Math.max(0, (v.price || 0) - (v.discount || 0)) + (v.product || 0);
      if (v.doc && amt2 > 0 && NS.integ) { const c = cust(a.customer); const r = v.doc === 'efatura' ? await NS.integ.sendEInvoice({ buyer: c.name, no: a.id.slice(-8), total: amt2, lines: [{ name: svc(a.service).name, total: amt2, vat: 20 }] }) : await NS.integ.call(v.doc === 'okc' ? 'okc' : 'esmm', v.doc === 'okc' ? 'mali-fis' : 'makbuz', { name: c.name, total: amt2, amount: amt2, items: [{ name: svc(a.service).name, price: amt2, qty: 1 }] }); if (r && r.ok) a.ebelge = r.no || r.ref; }
      if (v.payType === 'paket') { pkUse(pk[0], a.id); a.price = 0; a.package = pk[0].id; } else a.price = Math.max(0, (v.price || 0) - (v.discount || 0));
      Object.assign(a, { status: 'tamam', paid: true, payType: v.payType, tip: v.tip || 0, productSale: v.product || 0, paidAt: new Date().toISOString() });
      db.log('Randevu tamamlandı', `${cust(a.customer).name} · ${money(a.price + (a.productSale || 0))}`);
      db.save(); toast('Randevu tamamlandı', 'ok'); app.refresh();
    });
  }
  const smsText = (a) => (S().smsTemplate || '').replace('{musteri}', cust(a.customer).name).replace('{tarih}', NS.date(a.date)).replace('{saat}', a.start).replace('{hizmet}', svc(a.service).name).replace('{isletme}', S().bizName || '').replace('{personel}', staff(a.staff).name);
  // Sağlayıcının cevabı beklenir: yalnızca gerçekten kabul edilen mesaj randevuyu "hatırlatıldı" yapar; simülasyon TEST olarak kalır
  async function sendSms(a) {
    const c = cust(a.customer), text = smsText(a);
    const rec = db.insert('sms', { appt: a.id, to: c.phone, name: c.name, text, at: new Date().toISOString(), status: 'gönderiliyor' }, true);
    const res = NS.integ && NS.integ.sms ? await NS.integ.sms(c.phone, text, { silent: true }) : { ok: false, error: 'SMS bağlantısı yok' };
    rec.status = res.simulated ? 'TEST — gönderilmedi' : res.ok ? 'gönderildi' : 'hata: ' + String(res.error || 'gönderilemedi').slice(0, 60);
    if (res.ok && !res.simulated) { a.reminded = new Date().toISOString(); delete a.remindTest; if (NS.integ) NS.integ.emit('randevu_hatirlatma', { appt: a.id, date: a.date, start: a.start }); }
    else if (res.simulated) a.remindTest = true;
    db.save();
    return res.simulated ? 'test' : res.ok ? 'ok' : 'err';
  }
  async function remindOne(a) {
    const r = await sendSms(a);
    if (r === 'ok') toast(`SMS gönderildi: ${cust(a.customer).name}`, 'ok');
    else if (r === 'test') toast('TEST: SMS gönderilmedi — Entegrasyonlar > SMS’ten sağlayıcı bağlayın', '');
    else toast('SMS gönderilemedi: ' + (db.all('sms').slice(-1)[0] || {}).status, 'err');
  }

  // ---------- Takvim ----------
  // Telefonda varsayılan görünüm gündem listesi (sütunlu takvim dar ekranda okunmuyor)
  let calDate = today(), calView = window.innerWidth < 700 ? 'list' : 'day', weekStaff = null, showCancel = false;
  function calendarPage(el, param, app) {
    const s = S();
    const openMin = R.toMin(s.open), closeMin = R.toMin(s.close);
    const H = (closeMin - openMin) * PPM;
    const staffs = visibleStaff();
    weekStaff = weekStaff && staffs.some((x) => x.id === weekStaff) ? weekStaff : (staffs[0] || {}).id;
    const weekStart = addDays(calDate, -((new Date(calDate + 'T12:00').getDay() + 6) % 7));
    const columns = calView !== 'week' ? staffs.map((st) => ({ key: st.id, staff: st, date: calDate, label: st.name, sub: st.title, color: st.color }))
      : Array.from({ length: 7 }, (_, i) => { const d = iso(addDays(weekStart, i)); return { key: d, staff: staff(weekStaff), date: d, label: NS.DAYS[new Date(d + 'T12:00').getDay()], sub: NS.date(d), color: d === today() ? 'var(--accent)' : '' }; });
    const dayApps = (col) => db.all('appointments', (a) => a.date === col.date && a.staff === col.staff.id && (showCancel || a.status !== 'iptal'));
    const allShown = columns.flatMap(dayApps);
    el.innerHTML = `<div class="row mb">
        <button class="btn icon" data-nav="-1">${icon('left')}</button><button class="btn" data-nav="0">Bugün</button><button class="btn icon" data-nav="1">${icon('right')}</button>
        <input type="date" class="input" id="cd" value="${calDate}" style="max-width:170px">
        <h2 class="grow">${calView !== 'week' ? NS.dateLong(calDate) : `${NS.date(weekStart)} – ${NS.date(addDays(weekStart, 6))}`}</h2>
        ${calView === 'week' ? `<select class="input" id="ws" style="max-width:200px">${staffs.map((x) => `<option value="${x.id}" ${x.id === weekStaff ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}
        <div class="seg"><button data-v="list" class="${calView === 'list' ? 'active' : ''}">Liste</button><button data-v="day" class="${calView === 'day' ? 'active' : ''}">Gün</button><button data-v="week" class="${calView === 'week' ? 'active' : ''}">Hafta</button></div>
        <label class="check small"><input type="checkbox" id="sc" ${showCancel ? 'checked' : ''}> İptaller</label>
        <button class="btn" id="blk">${icon('lock')} Saat kapat</button>
        <button class="btn" id="wl">${icon('users')} Bekleme listesi${waitFor(calDate).length ? ` (${waitFor(calDate).length})` : ''}</button>
        <button class="btn primary" id="na">${icon('plus')} Randevu</button></div>
      <div class="row mb small muted">${allShown.filter((a) => a.status !== 'iptal').length} randevu · ${money(sum(allShown.filter((a) => a.status !== 'iptal'), (a) => a.price))} · Doluluk %${occupancy(columns)} <span class="grow"></span>${Object.entries(ST).slice(0, 5).map(([k, v]) => badge(v[0], v[1])).join(' ')}</div>
      <div class="card"><div class="cal-wrap"><div class="cal-head" style="grid-template-columns:60px repeat(${columns.length}, minmax(150px,1fr))"><div></div>${columns.map((c) => `<div>${calView === 'day' ? `<div class="avatar" style="background:${c.color}22;color:${c.color}">${esc(NS.initials(c.label))}</div>` : ''}<div style="min-width:0"><div class="nm" style="${c.color && calView === 'week' ? `color:${c.color}` : ''}">${esc(c.label)}</div><div class="small faint">${esc(c.sub)} · ${dayApps(c).filter((a) => a.status !== 'iptal').length} randevu</div></div></div>`).join('')}</div>
        <div class="cal" style="grid-template-columns:60px repeat(${columns.length}, minmax(150px,1fr));--hour:${60 * PPM}px">
          <div class="gutter" style="height:${H}px">${Array.from({ length: Math.floor((closeMin - openMin) / 60) + 1 }, (_, i) => `<span style="top:${i * 60 * PPM}px">${R.toHM(openMin + i * 60)}</span>`).join('')}</div>
          ${columns.map((c, ci) => {
            const h = c.staff.hours[new Date(c.date + 'T12:00').getDay()];
            const offs = !h ? [[openMin, closeMin]] : [[openMin, R.toMin(h.start)], [R.toMin(h.end), closeMin]];
            return `<div class="ccol" data-col="${ci}" style="height:${H}px">
              ${offs.filter(([a, b]) => b > a).map(([a, b]) => `<div class="off" style="top:${(a - openMin) * PPM}px;height:${(b - a) * PPM}px"></div>`).join('')}
              ${db.all('blocks', (x) => x.staff === c.staff.id && x.date === c.date).map((x) => `<div class="blk" data-blk="${x.id}" style="top:${(R.toMin(x.start) - openMin) * PPM}px;height:${(R.toMin(x.end) - R.toMin(x.start)) * PPM}px">${icon('lock')} ${esc(x.reason || 'Kapalı')}</div>`).join('')}
              ${dayApps(c).map((a) => `<div class="appt ${a.status}" data-ap="${a.id}" style="top:${(R.toMin(a.start) - openMin) * PPM}px;height:${Math.max(22, a.duration * PPM - 2)}px;background:${c.staff.color}"><b>${esc(cust(a.customer).name)}</b><span class="t">${a.start} · ${esc(svc(a.service).name)}</span>${a.duration >= 45 ? `<div class="t">${ST[a.status][0]}${a.paid ? ' · ödendi' : ''}</div>` : ''}</div>`).join('')}
              ${c.date === today() ? `<div class="now" style="top:${(new Date().getHours() * 60 + new Date().getMinutes() - openMin) * PPM}px"></div>` : ''}
            </div>`;
          }).join('')}
        </div></div></div>`;
    const go = (d) => { calDate = d; app.refresh(); };
    on(el, 'click', '[data-nav]', (e, t) => { const n = Number(t.dataset.nav); go(n === 0 ? today() : iso(addDays(calDate, n * (calView === 'week' ? 7 : 1)))); });
    $('#cd', el).onchange = (e) => go(e.target.value);
    on(el, 'click', '[data-v]', (e, t) => { calView = t.dataset.v; app.refresh(); });
    if (calView === 'list') {
      const L = allShown.slice().sort((a, b) => a.start.localeCompare(b.start));
      $('.cal-wrap', el).closest('.card').outerHTML = `<div class="card">${L.map((a) => `<div class="list-item" data-ap="${a.id}" style="cursor:pointer;border-left:4px solid ${staff(a.staff).color};padding-left:10px;touch-action:auto"><b style="min-width:52px">${a.start}</b><div class="grow" style="min-width:0"><b>${esc(cust(a.customer).name)}</b><div class="small muted">${esc(svc(a.service).name)} · ${esc(staff(a.staff).name)} · ${a.duration} dk</div></div>${badge(ST[a.status][0], ST[a.status][1])}</div>`).join('') || '<div class="empty">Bu gün randevu yok</div>'}</div>`;
    }
    if ($('#ws', el)) $('#ws', el).onchange = (e) => { weekStaff = e.target.value; app.refresh(); };
    $('#sc', el).onchange = (e) => { showCancel = e.target.checked; app.refresh(); };
    $('#na', el).onclick = () => apptForm(app, { date: calDate, staff: calView === 'week' ? weekStaff : undefined });
    $('#wl', el).onclick = () => waitModal(app, calDate);
    $('#blk', el).onclick = async () => {
      const v = await formModal({ title: 'Saat kapat (izin, mola, toplantı)', fields: [{ name: 'staff', label: 'Personel', type: 'select', options: staffs.map((x) => ({ value: x.id, label: x.name })) }, { name: 'date', label: 'Tarih', type: 'date', value: calDate }, { name: 'start', label: 'Başlangıç', type: 'time', value: '12:00' }, { name: 'end', label: 'Bitiş', type: 'time', value: '13:00' }, { name: 'reason', label: 'Açıklama', value: 'Öğle arası' }] });
      if (v) { db.insert('blocks', v); app.refresh(); }
    };
    on(el, 'click', '[data-blk]', async (e, t) => { e.stopPropagation(); if (await confirm('Bu kapalı saat kaldırılsın mı?')) { db.remove('blocks', t.dataset.blk); app.refresh(); } });

    // Boş alana tıklama: yeni randevu, randevuya tıklama: detay, sürükleme: taşıma
    let drag = null;
    on(el, 'pointerdown', '[data-ap]', (e, node) => {
      if (e.button !== 0) return;
      const r = node.getBoundingClientRect();
      drag = { node, id: node.dataset.ap, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, moved: false, col: node.parentElement };
      node.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true; drag.node.classList.add('dragging');
      const colEl = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList && x.classList.contains('ccol'));
      if (colEl && colEl !== drag.node.parentElement) colEl.appendChild(drag.node);
      const parent = drag.node.parentElement.getBoundingClientRect();
      let min = Math.round(((e.clientY - parent.top - drag.dy) / PPM) / (s.slot || 15)) * (s.slot || 15);
      min = NS.clamp(min, 0, closeMin - openMin - 15);
      drag.node.style.top = min * PPM + 'px';
      drag.min = min;
    });
    el.addEventListener('pointerup', () => {
      if (!drag) return;
      const d = drag; drag = null;
      const a = db.get('appointments', d.id);
      if (!d.moved) return apptDetail(app, a);
      const col = columns[Number(d.node.parentElement.dataset.col)];
      const start = R.toHM(openMin + (d.min ?? (R.toMin(a.start) - openMin)));
      const clash = db.find('appointments', (x) => x.id !== a.id && x.staff === col.staff.id && x.date === col.date && x.status !== 'iptal' && R.toMin(x.start) < R.toMin(start) + a.duration && R.toMin(start) < R.toMin(x.start) + x.duration);
      if (clash) { toast(`Çakışma: ${clash.start} ${cust(clash.customer).name}`, 'err'); return app.refresh(); }
      if (!svc(a.service).staff.includes(col.staff.id)) toast(`${col.staff.name} normalde bu hizmeti vermiyor`, '');
      Object.assign(a, { staff: col.staff.id, date: col.date, start });
      db.log('Randevu taşındı', `${cust(a.customer).name} → ${NS.date(col.date)} ${start}`);
      db.save(); toast(`Taşındı: ${NS.date(col.date)} ${start} · ${col.staff.name}`, 'ok'); app.refresh();
    });
    on(el, 'click', '.ccol', (e, colEl) => {
      if (e.target.closest('[data-ap],[data-blk]')) return;
      const r = colEl.getBoundingClientRect();
      const min = Math.floor(((e.clientY - r.top) / PPM) / (s.slot || 15)) * (s.slot || 15);
      const col = columns[Number(colEl.dataset.col)];
      apptForm(app, { date: col.date, staff: col.staff.id, start: R.toHM(openMin + min), service: (db.all('services', (x) => x.staff.includes(col.staff.id))[0] || {}).id });
    });
    const sc = $('.cal-wrap', el);
    if (sc && calDate === today()) sc.scrollTop = Math.max(0, (new Date().getHours() * 60 - openMin - 60) * PPM);
  }
  function occupancy(columns) {
    let cap = 0, used = 0;
    columns.forEach((c) => {
      const h = c.staff.hours[new Date(c.date + 'T12:00').getDay()]; if (!h) return;
      cap += R.toMin(h.end) - R.toMin(h.start);
      used += sum(db.all('appointments', (a) => a.date === c.date && a.staff === c.staff.id && !['iptal', 'gelmedi'].includes(a.status)), (a) => a.duration);
    });
    return cap ? Math.round((used / cap) * 100) : 0;
  }

  // ---------- Özet ----------
  function dashboard(el, param, app) {
    const t = today();
    const todays = db.all('appointments', (a) => a.date === t && a.status !== 'iptal' && (!myStaff() || a.staff === myStaff())).sort((a, b) => a.start.localeCompare(b.start));
    const pending = db.all('appointments', (a) => a.status === 'bekliyor' && a.date >= t).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const done30 = db.all('appointments', (a) => a.status === 'tamam' && a.date > iso(addDays(new Date(), -30)));
    const ser = NS.dailySeries(done30.map((a) => ({ ...a, at: a.date + 'T12:00' })), 30, 'at', (a) => a.price + (a.productSale || 0));
    const md = (d) => d.slice(5);
    const bdays = db.all('customers', (c) => c.birthday && [0, 1, 2, 3, 4, 5, 6].some((k) => md(iso(addDays(new Date(), k))) === md(c.birthday)));
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const next = todays.find((a) => R.toMin(a.start) >= nowMin && ['onay', 'bekliyor'].includes(a.status));
    el.innerHTML = pageHead(`Günaydın${NS.currentUser ? ', ' + esc(NS.currentUser.name.split(' ')[0]) : ''}`, NS.dateLong(new Date()), `<a class="btn" href="book.html" target="_blank">${icon('globe')} Online randevu sayfası</a><button class="btn primary" id="na">${icon('plus')} Yeni randevu</button>`) + `
      <div class="grid g4 mb">${kpi('Bugünkü randevu', num(todays.length), 'calendar', '', `<div class="small faint">${todays.filter((a) => a.status === 'tamam').length} tamamlandı</div>`)}${kpi('Bugünkü gelir', money(sum(todays.filter((a) => a.status === 'tamam'), (a) => a.price + (a.productSale || 0))), 'wallet', 'ok', `<div class="small faint">Beklenen ${money(sum(todays, (a) => a.price))}</div>`)}${kpi('Onay bekleyen', num(pending.length), 'bell', 'warn')}${kpi('Bugün doluluk', '%' + occupancy(visibleStaff().map((s) => ({ staff: s, date: t }))), 'percent', 'info')}</div>
      <div class="grid g-21 mb">
        <div class="card"><div class="card-h"><h3>Bugünün akışı</h3>${next ? `<span class="badge acc">Sıradaki: ${next.start} ${esc(cust(next.customer).name)}</span>` : ''}</div><div class="card-b" style="max-height:440px;overflow:auto">${todays.length ? `<div class="tl">${todays.map((a) => `<div class="tl-i" style="--c:${staff(a.staff).color};cursor:pointer" data-ap="${a.id}"><div class="row nw"><b style="min-width:48px">${a.start}</b><div class="grow"><b>${esc(cust(a.customer).name)}</b> <span class="muted small">· ${esc(svc(a.service).name)} · ${esc(staff(a.staff).name)}</span></div>${badge(ST[a.status][0], ST[a.status][1])}</div></div>`).join('')}</div>` : '<div class="empty">Bugün randevu yok</div>'}</div></div>
        <div class="col" style="gap:16px">
          <div class="card"><div class="card-h"><h3>${icon('bell')} Onay bekleyenler</h3></div><div class="card-b">${pending.slice(0, 6).map((a) => `<div class="list-item"><div class="grow"><b>${esc(cust(a.customer).name)}</b><div class="small muted">${NS.date(a.date)} ${a.start} · ${esc(svc(a.service).name)} · ${SRC[a.source]}</div></div><button class="btn sm primary" data-ok="${a.id}">Onayla</button></div>`).join('') || '<div class="faint small">Bekleyen yok</div>'}</div></div>
          <div class="card"><div class="card-h"><h3>${icon('gift')} Yaklaşan doğum günleri</h3></div><div class="card-b">${bdays.map((c) => `<div class="list-item"><div class="avatar">${esc(NS.initials(c.name))}</div><div class="grow"><b>${esc(c.name)}</b><div class="small faint">${c.birthday.slice(8)}.${c.birthday.slice(5, 7)}</div></div><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`İyi ki doğdunuz ${c.name}! ${S().bizName} olarak doğum gününüze özel %15 indirim sizi bekliyor.`)}">${icon('message')}</a></div>`).join('') || '<div class="faint small">Bu hafta doğum günü yok</div>'}</div></div>
        </div></div>
      <div class="card"><div class="card-h"><h3>Son 30 gün gelir</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: 3 })}</div></div>`;
    $('#na', el).onclick = () => apptForm(app, {});
    on(el, 'click', '[data-ap]', (e, t) => apptDetail(app, db.get('appointments', t.dataset.ap)));
    on(el, 'click', '[data-ok]', (e, t) => { db.update('appointments', t.dataset.ok, { status: 'onay' }); toast('Onaylandı', 'ok'); app.refresh(); });
  }

  // ---------- Randevu listesi ----------
  function listPage(el, param, app) {
    let q = '', from = today(), to = iso(addDays(new Date(), 7)), stf = '', sts = '';
    el.innerHTML = pageHead('Randevu Listesi', 'Filtreleyin, dışa aktarın, toplu işlem yapın', `<button class="btn" id="exp">${icon('download')} Dışa aktar</button><button class="btn primary" id="na">${icon('plus')} Yeni randevu</button>`) + `
      <div class="card"><div class="card-h" style="flex-wrap:wrap">${NS.searchBox('q', 'Müşteri, telefon, hizmet...')}<input type="date" class="input" id="f1" value="${from}" style="max-width:160px"><input type="date" class="input" id="f2" value="${to}" style="max-width:160px">
        <select class="input" id="fs" style="max-width:170px"><option value="">Tüm personel</option>${visibleStaff().map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
        <select class="input" id="ft" style="max-width:170px"><option value="">Tüm durumlar</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div><div id="tbl"></div></div>`;
    const rows = () => db.all('appointments', (a) => a.date >= from && a.date <= to && (!stf || a.staff === stf) && (!sts || a.status === sts) && (!myStaff() || a.staff === myStaff()) && NS.match(q, cust(a.customer).name, cust(a.customer).phone, svc(a.service).name)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const draw = () => {
      const r = rows();
      $('#tbl', el).innerHTML = table({ rows: r, emptyIcon: 'calendar', columns: [{ label: 'Tarih', render: (a) => `<b>${NS.date(a.date)}</b> ${a.start}` }, { label: 'Müşteri', render: (a) => `<b>${esc(cust(a.customer).name)}</b><div class="small faint">${esc(cust(a.customer).phone)}</div>` }, { label: 'Hizmet', render: (a) => esc(svc(a.service).name) }, { label: 'Personel', render: (a) => `<span style="color:${staff(a.staff).color};font-weight:600">${esc(staff(a.staff).name)}</span>` }, { label: 'Kaynak', render: (a) => SRC[a.source] || '-' }, { label: 'Durum', render: (a) => badge(ST[a.status][0], ST[a.status][1]) + (a.reminded ? ' ' + badge('SMS', 'info') : '') }, { label: 'Ücret', cls: 'right', render: (a) => money(a.price) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} randevu · ${money(sum(r.filter((a) => a.status !== 'iptal'), (a) => a.price))}` });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#f1', el).onchange = (e) => { from = e.target.value; draw(); };
    $('#f2', el).onchange = (e) => { to = e.target.value; draw(); };
    $('#fs', el).onchange = (e) => { stf = e.target.value; draw(); };
    $('#ft', el).onchange = (e) => { sts = e.target.value; draw(); };
    $('#na', el).onclick = () => apptForm(app, {}, draw);
    on(el, 'click', '[data-act=v]', (e, t) => apptDetail(app, db.get('appointments', t.dataset.id)));
    $('#exp', el).onclick = () => NS.csv('randevular', rows(), [{ key: 'date', label: 'Tarih' }, { key: 'start', label: 'Saat' }, { label: 'Müşteri', value: (a) => cust(a.customer).name }, { label: 'Telefon', value: (a) => cust(a.customer).phone }, { label: 'Hizmet', value: (a) => svc(a.service).name }, { label: 'Personel', value: (a) => staff(a.staff).name }, { label: 'Durum', value: (a) => ST[a.status][0] }, { key: 'price', label: 'Ücret' }]);
    draw();
  }

  // ---------- Müşteriler ----------
  const CUST_FIELDS = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true, type: 'tel' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'birthday', label: 'Doğum tarihi', type: 'date' }, { name: 'notes', label: 'Önemli not (alerji vb.)', full: true }, { name: 'iys', label: 'Kampanya / tanıtım mesajı almayı kabul etti (ticari ileti izni)', type: 'checkbox', full: true }];
  function customersPage(el, param, app) {
    if (param) return customerDetail(el, param, app);
    NS.crud(el, app, {
      col: 'customers', title: 'Müşteriler', sub: 'Müşteri kartları, geçmiş ve notlar', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: CUST_FIELDS,
      searchFields: (c) => [c.name, c.phone, c.email], sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'vip', label: 'VIP', test: (c) => (c.tags || []).includes('VIP') }, { value: 'lost', label: 'Kayıp (60+ gün)', test: (c) => { const l = lastVisit(c.id); return l && l < iso(addDays(new Date(), -60)); } }],
      columns: [
        { key: 'name', label: 'Müşteri', render: (c) => `<a href="#/musteriler/${c.id}" class="row nw" style="color:inherit"><div class="avatar">${esc(NS.initials(c.name))}</div><div><b>${esc(c.name)}</b> ${(c.tags || []).map((t) => badge(t, 'warn')).join('')}<div class="small faint">${esc(c.phone)}</div></div></a>` },
        { label: 'Son ziyaret', render: (c) => { const l = lastVisit(c.id); return l ? NS.date(l) : '<span class="faint">-</span>'; } },
        { label: 'Ziyaret', cls: 'right', render: (c) => db.all('appointments', (a) => a.customer === c.id && a.status === 'tamam').length },
        { label: 'Toplam harcama', cls: 'right', render: (c) => `<b>${money(sum(db.all('appointments', (a) => a.customer === c.id && a.status === 'tamam'), (a) => a.price + (a.productSale || 0)))}</b>` },
      ],
      extraActions: [{ icon: 'eye', act: 'detail', title: 'Detay' }],
      onAction: (act, c) => app.go('musteriler', c.id),
    });
    const hr = $('.page-h .row', el);
    if (hr) { hr.insertAdjacentHTML('afterbegin', `<button class="btn" id="wb">${icon('heart')} Geri kazanma</button>`); $('#wb', el).onclick = () => winBack(app); }
  }
  // Kayıp müşteri: son ziyareti 60+ gün önce, ileri tarihli randevusu yok. Toplu SMS yalnızca ticari ileti izni olanlara gider.
  function winBack(app) {
    const lim = iso(addDays(new Date(), -60));
    const L = db.all('customers', (c) => { const l = lastVisit(c.id); return l && l < lim && !db.find('appointments', (a) => a.customer === c.id && a.date >= today() && a.status !== 'iptal'); }).sort((a, b) => String(lastVisit(b.id)).localeCompare(String(lastVisit(a.id))));
    const link = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'book.html';
    const txt = (c, t) => t.replace('{musteri}', c.name.split(' ')[0]).replace('{isletme}', S().bizName || '').replace('{link}', link);
    const ok = L.filter((c) => c.iys);
    modal({
      title: `Geri kazanma — ${L.length} müşteri`, size: 'wide',
      body: `<div class="field"><label>Mesaj</label><textarea class="input" id="wt" rows="3">${esc(S().winbackText || 'Merhaba {musteri}, sizi özledik! {isletme} olarak yeniden görmek isteriz. Online randevu: {link}')}</textarea><div class="small faint">Değişkenler: {musteri} {isletme} {link}. Kampanya içeren mesaj ticari iletidir; yalnızca izin vermiş müşterilere SMS gönderilir (İYS).</div></div>
        <div class="mt">${L.map((c) => `<div class="list-item small"><div class="grow"><b>${esc(c.name)}</b> ${c.iys ? badge('İzinli', 'ok') : badge('İzin yok', '')}${c.winback ? ' ' + badge('Son mesaj ' + NS.date(c.winback), 'info') : ''}<div class="faint">Son ziyaret ${NS.date(lastVisit(c.id))} · ${esc(c.phone)}</div></div><a class="btn sm" data-wbw="${c.id}" target="_blank" rel="noopener" href="#">${icon('message')} WhatsApp</a></div>`).join('') || '<div class="empty">Kayıp müşteri yok</div>'}</div>`,
      onOpen: (b) => on(b, 'click', '[data-wbw]', (e, t) => { const c = db.get('customers', t.dataset.wbw); t.href = `https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(txt(c, $('#wt', b).value))}`; c.winback = today(); db.save(); }),
      actions: [{ label: 'Kapat' }, { label: `İzinli ${ok.length} müşteriye SMS`, cls: 'primary', icon: 'send', onClick: async (close, b) => {
        if (!ok.length) return toast('Ticari ileti izni olan kayıp müşteri yok', 'err');
        const t = $('#wt', b).value; db.saveSettings({ winbackText: t }); const n = { ok: 0, test: 0, err: 0 };
        for (const c of ok) { const r = NS.integ && NS.integ.sms ? await NS.integ.sms(c.phone, txt(c, t), { silent: true }) : { ok: false }; const k = r.simulated ? 'test' : r.ok ? 'ok' : 'err'; n[k]++; db.insert('sms', { to: c.phone, name: c.name, text: txt(c, t), at: new Date().toISOString(), status: k === 'ok' ? 'gönderildi' : k === 'test' ? 'TEST — gönderilmedi' : 'hata: ' + String(r.error || '').slice(0, 60) }, true); if (k === 'ok') c.winback = today(); }
        db.save(); close(); toast([n.ok && `${n.ok} gönderildi`, n.test && `${n.test} TEST (gönderilmedi)`, n.err && `${n.err} hata`].filter(Boolean).join(' · '), n.err ? 'err' : n.ok ? 'ok' : ''); app.refresh();
      } }],
    });
  }
  const lastVisit = (id) => db.all('appointments', (a) => a.customer === id && a.status === 'tamam').map((a) => a.date).sort().pop();
  function customerDetail(el, id, app) {
    const c = db.get('customers', id);
    if (!c) return app.go('musteriler');
    const apps = db.all('appointments', (a) => a.customer === id).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
    const done = apps.filter((a) => a.status === 'tamam');
    const fav = Object.entries(NS.groupBy(done, (a) => a.service)).sort((a, b) => b[1].length - a[1].length)[0];
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/musteriler">${icon('back')} Müşteriler</a></div>
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card pad row nw"><div class="avatar lg">${esc(NS.initials(c.name))}</div><div class="grow"><h1>${esc(c.name)}</h1><div class="muted">${esc(c.phone)} · ${esc(c.email || '')} ${c.birthday ? '· 🎂 ' + NS.date(c.birthday) : ''}</div></div>
          <button class="btn" id="vip">${icon('star')} ${(c.tags || []).includes('VIP') ? 'VIP kaldır' : 'VIP yap'}</button><button class="btn primary" id="na">${icon('plus')} Randevu ver</button></div>
        <div class="grid g4">${kpi('Ziyaret', done.length, 'calendar')}${kpi('Harcama', money(sum(done, (a) => a.price + (a.productSale || 0))), 'wallet', 'ok')}${kpi('Gelmedi', apps.filter((a) => a.status === 'gelmedi').length, 'x', 'err')}${kpi('Favori', fav ? esc(svc(fav[0]).name) : '-', 'heart', 'warn')}</div>
        <div class="card"><div class="card-h"><h3>Randevu geçmişi</h3></div>${table({ rows: apps, columns: [{ label: 'Tarih', render: (a) => `${NS.date(a.date)} ${a.start}` }, { label: 'Hizmet', render: (a) => esc(svc(a.service).name) }, { label: 'Personel', render: (a) => esc(staff(a.staff).name) }, { label: 'Durum', render: (a) => badge(ST[a.status][0], ST[a.status][1]) }, { label: 'Ücret', cls: 'right', render: (a) => money(a.price) }], actions: [{ icon: 'eye', act: 'v' }] })}</div>
      </div><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Notlar</h3></div><div class="card-b"><textarea class="input" id="nt" rows="4">${esc(c.notes || '')}</textarea><button class="btn sm mt" id="sn">Kaydet</button></div></div>
        <div class="card"><div class="card-h"><h3>Paketler</h3><button class="btn sm" id="sp">${icon('plus')} Paket sat</button></div><div class="card-b">${db.all('packages', (p) => p.customer === id).map((p) => `<div class="list-item"><div class="grow"><b>${esc(svc(p.service).name)}</b><div class="small muted">${p.used}/${p.total} seans · ${NS.date(p.expires)} son</div><div class="progress mt"><i style="width:${(p.used / p.total) * 100}%"></i></div></div></div>`).join('') || '<div class="faint small">Paket yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Gönderilen mesajlar</h3></div><div class="card-b">${db.all('sms', (s) => s.to === c.phone).slice(-5).reverse().map((s) => `<div class="list-item small"><div class="grow">${esc(s.text)}<div class="faint">${NS.dt(s.at)}</div></div></div>`).join('') || '<div class="faint small">Mesaj yok</div>'}</div></div>
      </div></div>`;
    $('#na', el).onclick = () => apptForm(app, { customer: id });
    $('#sn', el).onclick = () => { c.notes = $('#nt', el).value; db.save(); toast('Not kaydedildi', 'ok'); };
    $('#vip', el).onclick = () => { c.tags = (c.tags || []).includes('VIP') ? c.tags.filter((t) => t !== 'VIP') : [...(c.tags || []), 'VIP']; db.save(); app.refresh(); };
    $('#sp', el).onclick = () => sellPackage(app, id);
    on(el, 'click', '[data-act=v]', (e, t) => apptDetail(app, db.get('appointments', t.dataset.id)));
  }

  // ---------- Paketler ----------
  async function sellPackage(app, customer) {
    const v = await formModal({ title: 'Paket / seans satışı', fields: [{ name: 'customer', label: 'Müşteri', type: 'select', options: db.all('customers').map((c) => ({ value: c.id, label: c.name })), value: customer }, { name: 'service', label: 'Hizmet', type: 'select', options: db.all('services').map((s) => ({ value: s.id, label: s.name })) }, { name: 'total', label: 'Seans sayısı', type: 'number', value: 6 }, { name: 'price', label: 'Paket fiyatı (₺)', type: 'number', required: true }, { name: 'expires', label: 'Son kullanım', type: 'date', value: iso(addDays(new Date(), 180)) }, { name: 'payType', label: 'Ödeme', type: 'select', options: [{ value: 'kart', label: 'Kart' }, { value: 'nakit', label: 'Nakit' }, { value: 'havale', label: 'Havale' }] }] });
    if (!v) return;
    db.insert('packages', { ...v, used: 0 });
    db.log('Paket satıldı', `${cust(v.customer).name} · ${svc(v.service).name} · ${money(v.price)}`);
    toast('Paket satıldı', 'ok'); app.refresh();
  }
  function packagesPage(el, param, app) {
    el.innerHTML = pageHead('Paketler & Seanslar', 'Çoklu seans satışı ve kullanım takibi', `<button class="btn primary" id="sp">${icon('plus')} Paket sat</button>`) + `<div class="card" id="tbl"></div>`;
    const rows = db.all('packages').sort((a, b) => (a.total - a.used) - (b.total - b.used));
    $('#tbl', el).innerHTML = table({ rows, emptyIcon: 'gift', columns: [{ label: 'Müşteri', render: (p) => `<b>${esc(cust(p.customer).name)}</b>` }, { label: 'Hizmet', render: (p) => esc(svc(p.service).name) }, { label: 'Kullanım', render: (p) => `<div style="min-width:140px"><div class="small">${p.used} / ${p.total} seans</div><div class="progress"><i style="width:${(p.used / p.total) * 100}%"></i></div></div>` }, { label: 'Kalan', cls: 'right', render: (p) => badge(p.total - p.used + ' seans', p.total - p.used <= 1 ? 'warn' : 'ok') }, { label: 'Son kullanım', render: (p) => (p.expires < today() ? badge('Süresi doldu', 'err') : NS.date(p.expires)) }, { label: 'Tutar', cls: 'right', render: (p) => money(p.price) }], actions: [{ label: '+1 seans kullan', act: 'use', show: pkValid }, { icon: 'list', act: 'hist', title: 'Seans geçmişi' }, { icon: 'trash', act: 'del' }] });
    $('#sp', el).onclick = () => sellPackage(app);
    on(el, 'click', '[data-act]', async (e, t) => { const p = db.get('packages', t.dataset.id); if (t.dataset.act === 'hist') return pkHistory(app, p); if (t.dataset.act === 'use') { if (!pkValid(p)) return toast('Paketin süresi dolmuş ya da hakkı bitmiş', 'err'); pkUse(p, null, 'Elle düşüldü'); db.log('Paket seansı düşüldü', `${cust(p.customer).name} · ${svc(p.service).name} · ${p.used}/${p.total}`); db.save(); toast('Seans düşüldü', 'ok'); app.refresh(); } else if (await confirm('Paket silinsin mi?')) { db.remove('packages', p.id); app.refresh(); } });
  }

  // Paket seans geçmişi: her düşüm kim / ne zaman / hangi randevu; son düşüm geri alınabilir
  function pkHistory(app, p) {
    const log = (p.log || []).slice().reverse();
    modal({
      title: `${cust(p.customer).name} — ${svc(p.service).name}`,
      body: `<div class="small muted mb">${p.used}/${p.total} seans kullanıldı · Son kullanım ${p.expires ? NS.date(p.expires) : '-'}${p.used > (p.log || []).length ? ` · ${p.used - (p.log || []).length} seansın kaydı bu özellikten önce düşülmüş` : ''}</div>
        ${log.map((x, i) => { const a = x.appt && db.get('appointments', x.appt); return `<div class="list-item small"><div class="grow"><b>${NS.dt(x.at)}</b>${x.by ? ' · ' + esc(x.by) : ''}<div class="faint">${a ? `Randevu: ${NS.date(a.date)} ${a.start} · ${esc(staff(a.staff).name)}` : esc(x.note || 'Elle düşüldü')}</div></div>${i === 0 ? '<button class="btn sm" data-undo>Geri al</button>' : ''}</div>`; }).join('') || '<div class="faint small">Kayıtlı seans düşümü yok</div>'}`,
      onOpen: (b, close) => on(b, 'click', '[data-undo]', async () => {
        if (!(await confirm('Son seans düşümü geri alınsın mı? Randevuya bağlıysa randevu "ödenmedi" olur.', { ok: 'Geri al' }))) return;
        const x = p.log.pop(); p.used = Math.max(0, p.used - 1);
        const a = x.appt && db.get('appointments', x.appt); if (a) Object.assign(a, { paid: false, payType: null, package: null, price: svc(a.service).price });
        db.log('Paket seansı geri alındı', `${cust(p.customer).name} · ${svc(p.service).name}`); db.save(); close(); toast('Seans geri alındı', 'ok'); app.refresh();
      }),
    });
  }

  // ---------- Bekleme listesi ----------
  // Dolu güne randevu isteyen müşteri listeye yazılır; iptal olunca haber verilir
  const waitFor = (date, stf) => db.all('waitlist', (w) => w.status === 'bekliyor' && w.date === date && (!stf || !w.staff || w.staff === stf));
  function waitModal(app, date) {
    const draw = (b) => {
      const list = db.all('waitlist', (w) => w.date === date && w.status !== 'randevu');
      b.innerHTML = `<div class="row mb"><span class="grow small muted">${NS.dateLong(date)} için randevu bekleyenler</span><button class="btn sm primary" data-add>${icon('plus')} Ekle</button></div>
        ${list.map((w) => { const c = cust(w.customer); return `<div class="list-item"><div class="grow"><b>${esc(c.name)}</b> ${w.status === 'haber' ? badge('Haber verildi', 'info') : ''}<div class="small muted">${esc(svc(w.service).name)}${w.staff ? ' · ' + esc(staff(w.staff).name) : ''}${w.from ? ` · ${w.from}–${w.to || ''}` : ''}${w.note ? ' · ' + esc(w.note) : ''}</div></div><a class="btn sm" target="_blank" rel="noopener" data-wa="${w.id}" href="https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${c.name}, ${NS.date(date)} için yer açıldı. Randevu almak ister misiniz? ${S().bizName || ''}`)}">${icon('message')}</a><button class="btn sm" data-give="${w.id}">Randevu ver</button><button class="btn sm icon" data-wdel="${w.id}">${icon('trash')}</button></div>`; }).join('') || '<div class="empty small">Bekleyen yok</div>'}`;
    };
    modal({
      title: 'Bekleme listesi', size: 'wide', body: '<div id="wlb"></div>',
      onOpen: (b, close) => {
        const box = $('#wlb', b); draw(box);
        on(box, 'click', '[data-add]', async () => {
          const v = await formModal({ title: 'Bekleme listesine ekle', fields: [{ name: 'customer', label: 'Müşteri', type: 'select', required: true, options: db.all('customers').sort((x, y) => x.name.localeCompare(y.name, 'tr')).map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` })) }, { name: 'service', label: 'Hizmet', type: 'select', options: db.all('services').map((s) => ({ value: s.id, label: s.name })) }, { name: 'staff', label: 'Personel', type: 'select', options: [{ value: '', label: 'Fark etmez' }, ...visibleStaff().map((s) => ({ value: s.id, label: s.name }))] }, { name: 'date', label: 'Tarih', type: 'date', value: date }, { name: 'from', label: 'En erken saat', type: 'time' }, { name: 'to', label: 'En geç saat', type: 'time' }, { name: 'note', label: 'Not', full: true }] });
          if (v) { db.insert('waitlist', { ...v, status: 'bekliyor' }); draw(box); app.refresh(); }
        });
        on(box, 'click', '[data-wa]', (e, t) => { db.update('waitlist', t.dataset.wa, { status: 'haber', notified: new Date().toISOString() }); setTimeout(() => draw(box), 50); });
        on(box, 'click', '[data-wdel]', (e, t) => { db.remove('waitlist', t.dataset.wdel); draw(box); app.refresh(); });
        on(box, 'click', '[data-give]', (e, t) => { const w = db.get('waitlist', t.dataset.give); close(); apptForm(app, { customer: w.customer, service: w.service, staff: w.staff || undefined, date: w.date, start: w.from || undefined, waitId: w.id }); });
      },
    });
  }

  // ---------- Hizmetler / Personel ----------
  function servicesPage(el, param, app) {
    NS.crud(el, app, {
      col: 'services', title: 'Hizmetler', sub: 'Süre, fiyat ve hizmeti veren personel', single: 'Hizmet', addLabel: 'Yeni hizmet', emptyIcon: 'sparkles',
      fields: () => [{ name: 'name', label: 'Hizmet adı', required: true, full: true }, { name: 'cat', label: 'Kategori' }, { name: 'duration', label: 'Süre (dk)', type: 'number', required: true }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'online', label: 'Online randevuda göster', type: 'checkbox' }, { name: 'desc', label: 'Açıklama', full: true }, { type: 'section', label: 'Bu hizmeti veren personel' }, ...db.all('staff').map((s) => ({ name: 'st_' + s.id, label: s.name, type: 'checkbox' }))],
      defaults: () => ({ duration: 30, online: true, ...Object.fromEntries(db.all('staff').map((s) => ['st_' + s.id, true])) }),
      beforeSave: (v) => { v.staff = db.all('staff').filter((s) => v['st_' + s.id]).map((s) => s.id); Object.keys(v).filter((k) => k.startsWith('st_')).forEach((k) => delete v[k]); },
      columns: [{ key: 'name', label: 'Hizmet', render: (s) => `<b>${esc(s.name)}</b><div class="small faint">${esc(s.cat || '')}</div>` }, { key: 'duration', label: 'Süre', render: (s) => s.duration + ' dk' }, { key: 'price', label: 'Fiyat', cls: 'right', render: (s) => `<b>${money(s.price)}</b>` }, { label: 'Personel', render: (s) => s.staff.map((id) => `<span class="badge" style="color:${staff(id).color}">${esc(staff(id).name.split(' ')[0])}</span>`).join(' ') }, { label: 'Online', render: (s) => (s.online ? badge('Açık', 'ok') : badge('Kapalı')) }],
      sort: (a, b) => String(a.cat).localeCompare(String(b.cat), 'tr'),
      toForm: (r) => ({ ...r, ...Object.fromEntries(db.all('staff').map((s) => ['st_' + s.id, r.staff.includes(s.id)])) }),
    });
  }
  function staffPage(el, param, app) {
    el.innerHTML = pageHead('Personel', 'Çalışma saatleri, hizmetler ve prim oranları', `<button class="btn primary" id="add">${icon('plus')} Yeni personel</button>`) + `<div class="grid g-auto" id="g"></div>`;
    const month = iso(new Date()).slice(0, 7);
    $('#g', el).innerHTML = db.all('staff').map((s) => {
      const ap = db.all('appointments', (a) => a.staff === s.id && a.status === 'tamam' && a.date.startsWith(month));
      const rev = sum(ap, (a) => a.price);
      return `<div class="card pad"><div class="row nw mb"><div class="avatar lg" style="background:${s.color}22;color:${s.color}">${esc(NS.initials(s.name))}</div><div class="grow"><b>${esc(s.name)}</b><div class="small muted">${esc(s.title)}</div></div>${s.active === false ? badge('Pasif', 'err') : ''}</div>
        <div class="small muted mb">${[1, 2, 3, 4, 5, 6, 0].map((d) => `${NS.DAYS[d].slice(0, 3)}: ${s.hours[d] ? s.hours[d].start + '-' + s.hours[d].end : '<span style="color:var(--err)">kapalı</span>'}`).join(' · ')}</div>
        <div class="list-item small"><span class="grow">Bu ay randevu</span><b>${ap.length}</b></div><div class="list-item small"><span class="grow">Bu ay ciro</span><b>${money(rev)}</b></div><div class="list-item small"><span class="grow">Prim (%${s.commission})</span><b style="color:var(--ok)">${money(rev * s.commission / 100 + sum(ap, (a) => a.tip || 0))}</b></div>
        <div class="row mt"><button class="btn sm grow" data-e="${s.id}">${icon('edit')} Düzenle</button><button class="btn sm grow" data-h="${s.id}">${icon('clock')} Saatler</button></div></div>`;
    }).join('');
    const fields = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'title', label: 'Ünvan' }, { name: 'phone', label: 'Telefon' }, { name: 'color', label: 'Takvim rengi', type: 'color' }, { name: 'commission', label: 'Prim oranı (%)', type: 'number' }, { name: 'active', label: 'Aktif', type: 'checkbox' }];
    $('#add', el).onclick = async () => { const v = await formModal({ title: 'Yeni personel', fields, values: { color: NS.pick(NS.PALETTE), commission: 25, active: true } }); if (v) { const h = { start: '09:00', end: '19:00' }; db.insert('staff', { ...v, hours: { 0: null, 1: h, 2: h, 3: h, 4: h, 5: h, 6: h } }); app.refresh(); } };
    on(el, 'click', '[data-e]', async (e, t) => { const s = db.get('staff', t.dataset.e); const v = await formModal({ title: s.name, fields, values: { active: true, ...s } }); if (v) { db.update('staff', s.id, v); app.refresh(); } });
    on(el, 'click', '[data-h]', (e, t) => {
      const s = db.get('staff', t.dataset.h);
      modal({
        title: `Çalışma saatleri — ${s.name}`,
        body: [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="hours-row"><b>${NS.DAYS[d]}</b><input class="input" type="time" data-hs="${d}" value="${s.hours[d] ? s.hours[d].start : '09:00'}"><input class="input" type="time" data-he="${d}" value="${s.hours[d] ? s.hours[d].end : '19:00'}"><label class="check small"><input type="checkbox" data-ho="${d}" ${s.hours[d] ? 'checked' : ''}> Açık</label></div>`).join(''),
        actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', onClick: (c, b) => { [0, 1, 2, 3, 4, 5, 6].forEach((d) => { s.hours[d] = $(`[data-ho="${d}"]`, b).checked ? { start: $(`[data-hs="${d}"]`, b).value, end: $(`[data-he="${d}"]`, b).value } : null; }); db.save(); c(); app.refresh(); toast('Saatler kaydedildi', 'ok'); } }],
      });
    });
  }

  // ---------- Hatırlatmalar ----------
  function remindersPage(el, param, app) {
    const tomorrow = iso(addDays(new Date(), 1));
    const list = db.all('appointments', (a) => (a.date === tomorrow || a.date === today()) && ['onay', 'bekliyor'].includes(a.status) && apptAt(a) > Date.now()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    el.innerHTML = pageHead('SMS & WhatsApp Hatırlatmaları', 'Randevu hatırlatmaları ile gelmeme oranını düşürün', `<button class="btn primary" id="all">${icon('send')} Bekleyenlerin hepsine gönder (${list.filter((a) => !a.reminded && !a.noReminder).length})</button>`) + `
      ${smsReady() ? '' : `<div class="card pad mb small" style="background:var(--warn-soft);border:0">${icon('alert')} SMS sağlayıcısı bağlı değil: gönderimler <b>TEST</b> olarak kaydedilir, müşteriye mesaj gitmez. <a href="#/entegrasyonlar">Entegrasyonlar &gt; SMS</a></div>`}
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Bugün ve yarın</h3></div>${table({ rows: list, empty: 'Hatırlatılacak randevu yok', columns: [{ label: 'Randevu', render: (a) => `<b>${NS.date(a.date)} ${a.start}</b>` }, { label: 'Müşteri', render: (a) => `${esc(cust(a.customer).name)}<div class="small faint">${esc(cust(a.customer).phone)}</div>` }, { label: 'Hizmet', render: (a) => esc(svc(a.service).name) }, { label: 'Durum', render: (a) => remindBadge(a) + (remindDue(a) && !a.reminded && !a.noReminder ? ' ' + badge('Zamanı geldi', 'err') : '') }], actions: [{ icon: 'send', act: 'sms', title: 'SMS gönder' }] })}</div>
      <div class="card"><div class="card-h"><h3>Mesaj şablonu</h3></div><div class="card-b"><textarea class="input" id="tp" rows="5">${esc(S().smsTemplate)}</textarea><div class="small faint mt">Değişkenler: {musteri} {tarih} {saat} {hizmet} {personel} {isletme}</div><button class="btn sm mt" id="st">Kaydet</button>
        <div class="mt" id="ar">${NS.fieldsHtml([{ name: 'reminderHours', label: 'Hatırlatma zamanı (randevudan kaç saat önce)', type: 'number' }, { name: 'autoRemind', label: 'Zamanı gelen hatırlatmaları otomatik gönder', type: 'checkbox', full: true, hint: 'Yalnızca bu panel bir cihazda açıkken çalışır ve yalnızca gerçek SMS sağlayıcısı bağlıyken gönderir. Panel kapalıyken gönderim yapılmaz.' }], { reminderHours: 24, ...S() })}<button class="btn sm" id="ars">Kaydet</button></div>
        ${list[0] ? `<div class="card pad mt small" style="background:var(--surface-2)"><b>Önizleme:</b><br>${esc(smsText(list[0]))}</div>` : ''}</div></div></div>
      <div class="card"><div class="card-h"><h3>Gönderim geçmişi</h3><span class="small muted">${db.all('sms').length} mesaj</span></div>${table({ rows: db.all('sms').slice().reverse().slice(0, 100), empty: 'Henüz mesaj gönderilmedi', columns: [{ label: 'Zaman', render: (s) => NS.dt(s.at) }, { label: 'Alıcı', render: (s) => `${esc(s.name)}<div class="small faint">${esc(s.to)}</div>` }, { label: 'Mesaj', render: (s) => `<span class="small">${esc(s.text)}</span>` }, { label: 'Durum', render: (s) => badge(smsLabel(s.status), smsTone(s.status)) }] })}</div>`;
    $('#all', el).onclick = async (e) => {
      const n = list.filter((a) => !a.reminded && !a.noReminder), skip = list.filter((a) => !a.reminded && a.noReminder).length;
      if (!n.length) return toast(skip ? `${skip} müşteri hatırlatma istemiyor; gönderilecek başka randevu yok` : 'Gönderilecek hatırlatma yok', '');
      e.target.disabled = true; const c = { ok: 0, test: 0, err: 0 };
      for (const a of n) c[await sendSms(a)]++;
      toast([c.ok && `${c.ok} gönderildi`, c.test && `${c.test} TEST (gönderilmedi)`, c.err && `${c.err} hata`, skip && `${skip} müşteri istemediği için atlandı`].filter(Boolean).join(' · '), c.err ? 'err' : c.ok ? 'ok' : '');
      app.refresh();
    };
    $('#st', el).onclick = () => { db.saveSettings({ smsTemplate: $('#tp', el).value }); toast('Şablon kaydedildi', 'ok'); app.refresh(); };
    $('#ars', el).onclick = () => { const v = NS.readForm($('#ar', el)); db.saveSettings({ reminderHours: NS.clamp(Number(v.reminderHours) || 24, 1, 72), autoRemind: !!v.autoRemind }); toast('Kaydedildi', 'ok'); app.refresh(); autoRemindTick(); };
    on(el, 'click', '[data-act=sms]', async (e, t) => { const a = db.get('appointments', t.dataset.id); if (a.noReminder && !(await confirm('Müşteri hatırlatma istemediğini belirtti. Yine de gönderilsin mi?', { ok: 'Gönder', danger: false }))) return; await remindOne(a); app.refresh(); });
  }
  const apptAt = (a) => new Date(`${a.date}T${a.start}`).getTime();
  const remindDue = (a) => apptAt(a) - Date.now() <= (Number(S().reminderHours) || 24) * 3600000;
  // Panel açıkken: zamanı gelen, istemeyeni ve daha önce denenmişi atlayarak gerçek sağlayıcıyla gönderir (simülasyonda hiç göndermez)
  let autoBusy = false;
  async function autoRemindTick() {
    if (autoBusy || !S().autoRemind || !smsReady() || (NS.currentUser && NS.currentUser.role === 'personel')) return;
    autoBusy = true;
    try {
      db.load();
      const due = db.all('appointments', (a) => ['onay', 'bekliyor'].includes(a.status) && !a.reminded && !a.noReminder && !a.remindTried && apptAt(a) > Date.now() && remindDue(a));
      let n = 0;
      for (const a of due) { a.remindTried = new Date().toISOString(); db.save(); if ((await sendSms(a)) === 'ok') n++; }
      if (n) toast(`${n} randevu hatırlatması otomatik gönderildi`, 'ok');
    } finally { autoBusy = false; }
  }
  setInterval(autoRemindTick, 5 * 60000); setTimeout(autoRemindTick, 20000);
  const smsReady = () => !!(NS.integ && NS.integ.isOn('sms') && (NS.integ.cfg('sms').provider || 'sim') !== 'sim');
  const remindBadge = (a) => (a.reminded ? badge('Gönderildi', 'ok') : a.noReminder ? badge('Müşteri istemiyor', '') : a.remindTest ? badge('TEST — gönderilmedi', 'warn') : badge('Bekliyor', 'warn'));

  // ---------- Online randevu ----------
  function onlinePage(el, param, app) {
    const s = S();
    const url = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'book.html';
    const online = db.all('appointments', (a) => a.source === 'online');
    el.innerHTML = pageHead('Online Randevu', 'Müşterileriniz 7/24 kendi randevusunu alsın', `<a class="btn primary" href="book.html" target="_blank">${icon('eye')} Sayfayı aç</a>`) + `
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card pad"><h3 class="mb">Randevu linkiniz</h3><div class="row nw"><input class="input mono" readonly value="${esc(url)}" id="u"><button class="btn" id="cp">${icon('copy')} Kopyala</button></div>
          <p class="small muted mt">Bu linki kopyalayıp Google İşletme Profilinizdeki randevu bağlantısı alanına, Instagram profilinize ve WhatsApp durumunuza kendiniz ekleyin. NEBSOFT bu platformlara otomatik bağlanmaz.</p>
          <div class="row mt">${NS.qrSvg(url, 130)}<div class="small muted grow">Vitrin camınıza ve kasaya bu QR kodu yapıştırarak müşterilerin anında randevu almasını sağlayın.</div></div></div>
        <div class="card"><div class="card-h"><h3>Ayarlar</h3></div><div class="card-b" id="os">${NS.fieldsHtml([{ name: 'autoConfirm', label: 'Online randevuları otomatik onayla', type: 'checkbox', full: true }, { name: 'noShowLimit', label: 'Bu kadar kez gelmeyen müşterinin online randevusu onaya düşsün (0 = kapalı)', type: 'number', full: true }, { name: 'cancelHours', label: 'İptal için son saat (randevudan önce)', type: 'number' }, { name: 'open', label: 'Takvim açılış', type: 'time' }, { name: 'close', label: 'Takvim kapanış', type: 'time' }, { name: 'slot', label: 'Zaman aralığı (dk)', type: 'select', options: ['10', '15', '20', '30'], num: true }, { name: 'bookingNote', label: 'Randevu sayfası notu', full: true }, { name: 'kvkkText', label: 'KVKK aydınlatma metni (online randevu formunda gösterilir)', type: 'textarea', full: true, hint: 'Metni işletmeniz hazırlar (veri sorumlusu, amaç, haklar). Boş bırakılırsa formda “metin henüz eklenmedi” yazar.' }], s)}${s.kvkkText ? '' : `<div class="small mt" style="color:var(--warn)">${icon('alert')} Aydınlatma metni girilmedi.</div>`}<button class="btn primary mt" id="sv">Kaydet</button></div></div>
      </div><div class="col" style="gap:16px">
        ${kpi('Online randevu (toplam)', num(online.length), 'globe', 'info')}${kpi('Online oranı', '%' + Math.round((online.length / Math.max(1, db.all('appointments').length)) * 100), 'percent', 'ok')}
        <div class="card"><div class="card-h"><h3>Son online randevular</h3></div><div class="card-b">${online.sort((a, b) => b.created.localeCompare(a.created)).slice(0, 8).map((a) => `<div class="list-item small"><div class="grow"><b>${esc(cust(a.customer).name)}</b><div class="faint">${NS.date(a.date)} ${a.start} · ${esc(svc(a.service).name)}</div></div>${badge(ST[a.status][0], ST[a.status][1])}</div>`).join('')}</div></div>
      </div></div>`;
    $('#cp', el).onclick = () => { navigator.clipboard && navigator.clipboard.writeText(url); toast('Link kopyalandı', 'ok'); };
    $('#sv', el).onclick = () => { const v = NS.readForm($('#os', el)); v.slot = Number(v.slot); v.cancelHours = Number(v.cancelHours); v.noShowLimit = Math.max(0, Number(v.noShowLimit) || 0); db.saveSettings(v); toast('Kaydedildi', 'ok'); };
  }

  // ---------- Kasa ----------
  function cashPage(el, param, app) {
    let day = today();
    const draw = () => {
      const done = db.all('appointments', (a) => a.status === 'tamam' && a.paid && a.date === day);
      const pk = db.all('packages', (p) => iso(p.created) === day);
      const ex = db.all('expenses', (x) => x.date === day);
      const byPay = {};
      done.forEach((a) => { byPay[a.payType] = (byPay[a.payType] || 0) + a.price + (a.productSale || 0) + (a.tip || 0); });
      pk.forEach((p) => { byPay[p.payType || 'kart'] = (byPay[p.payType || 'kart'] || 0) + p.price; });
      const income = sum(Object.values(byPay));
      el.innerHTML = pageHead('Kasa', NS.dateLong(day), `<input type="date" class="input" id="dd" value="${day}" style="max-width:170px"><button class="btn" id="ex">${icon('minus')} Gider ekle</button>`) + `
        <div class="grid g4 mb">${kpi('Gelir', money(income), 'trend', 'ok')}${kpi('Gider', money(sum(ex, (x) => x.amount)), 'minus', 'err')}${kpi('Net', money(income - sum(ex, (x) => x.amount)), 'wallet')}${kpi('Bahşiş', money(sum(done, (a) => a.tip || 0)), 'heart', 'warn')}</div>
        <div class="grid g-21"><div class="card"><div class="card-h"><h3>Tahsilatlar</h3></div>${table({ rows: [...done.map((a) => ({ id: a.id, t: a.start, d: `${cust(a.customer).name} · ${svc(a.service).name}`, p: PAY[a.payType], v: a.price + (a.productSale || 0) + (a.tip || 0) })), ...pk.map((p) => ({ id: p.id, t: NS.time(p.created), d: `Paket: ${cust(p.customer).name} · ${svc(p.service).name}`, p: PAY[p.payType] || 'Kart', v: p.price }))], empty: 'Bu gün tahsilat yok', columns: [{ label: 'Saat', key: 't' }, { label: 'Açıklama', key: 'd' }, { label: 'Ödeme', render: (r) => badge(r.p || '-', 'info') }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.v)}</b>` }] })}</div>
        <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Ödeme türleri</h3></div><div class="card-b">${chart.donut(Object.entries(byPay).map(([k, v]) => ({ label: PAY[k] || k, value: v })), { format: money, size: 130 })}</div></div>
        <div class="card"><div class="card-h"><h3>Giderler</h3></div><div class="card-b">${ex.map((x) => `<div class="list-item small"><span class="grow">${esc(x.note)}</span><b style="color:var(--err)">-${money(x.amount)}</b></div>`).join('') || '<div class="faint small">Gider yok</div>'}</div></div></div></div>`;
      $('#dd', el).onchange = (e) => { day = e.target.value; draw(); };
      $('#ex', el).onclick = async () => { const v = await formModal({ title: 'Gider', fields: [{ name: 'note', label: 'Açıklama', required: true }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'cat', label: 'Kategori', type: 'select', options: ['Malzeme', 'Kira', 'Fatura', 'Maaş', 'Diğer'] }] }); if (v) { db.insert('expenses', { ...v, date: day }); draw(); } };
    };
    draw();
  }

  // ---------- Raporlar ----------
  function reportsPage(el) {
    let from = iso(new Date()).slice(0, 8) + '01', to = today();
    const draw = () => {
      const all = db.all('appointments', (a) => a.date >= from && a.date <= to);
      const done = all.filter((a) => a.status === 'tamam');
      const rev = sum(done, (a) => a.price + (a.productSale || 0));
      const noShow = all.filter((a) => a.status === 'gelmedi').length;
      const byStaff = db.all('staff').map((s) => { const d = done.filter((a) => a.staff === s.id); const r = sum(d, (a) => a.price); return { id: s.id, s, n: d.length, r, prim: r * s.commission / 100, tip: sum(d, (a) => a.tip || 0), product: sum(d, (a) => a.productSale || 0) }; });
      const bySvc = Object.entries(NS.groupBy(done, (a) => a.service)).map(([k, v]) => ({ label: svc(k).name, value: sum(v, (a) => a.price) })).sort((a, b) => b.value - a.value);
      const newC = db.all('customers', (c) => iso(c.created) >= from && iso(c.created) <= to).length;
      el.innerHTML = pageHead('Raporlar', 'Gelir, personel primleri, hizmet ve müşteri analizleri', `<input type="date" class="input" id="f1" value="${from}" style="max-width:160px"><input type="date" class="input" id="f2" value="${to}" style="max-width:160px"><button class="btn" id="pexp">${icon('download')} Prim listesi</button>`) + `
        <div class="grid g4 mb">${kpi('Gelir', money(rev), 'trend', 'ok')}${kpi('Tamamlanan', num(done.length), 'check', 'info')}${kpi('Gelmeme oranı', '%' + (all.length ? ((noShow / all.length) * 100).toFixed(1) : 0), 'x', 'err')}${kpi('Yeni müşteri', num(newC), 'user', 'warn')}</div>
        <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Hizmet bazlı gelir</h3></div><div class="card-b">${chart.donut(bySvc.slice(0, 8), { format: money, size: 150 })}</div></div><div class="card"><div class="card-h"><h3>Personel bazlı gelir</h3></div><div class="card-b">${chart.bars(byStaff.map((x) => ({ label: x.s.name.split(' ')[0], value: x.r, color: x.s.color })), { format: money })}</div></div></div>
        <div class="card"><div class="card-h"><h3>Personel prim hesabı</h3></div>${table({ rows: byStaff, columns: [{ label: 'Personel', render: (x) => `<b style="color:${x.s.color}">${esc(x.s.name)}</b>` }, { label: 'Randevu', cls: 'right', render: (x) => x.n }, { label: 'Hizmet geliri', cls: 'right', render: (x) => money(x.r) }, { label: 'Prim oranı', cls: 'right', render: (x) => '%' + x.s.commission }, { label: 'Prim', cls: 'right', render: (x) => money(x.prim) }, { label: 'Bahşiş', cls: 'right', render: (x) => money(x.tip) }, { label: 'Toplam hakediş', cls: 'right', render: (x) => `<b style="color:var(--ok)">${money(x.prim + x.tip)}</b>` }] })}</div>`;
      $('#f1', el).onchange = (e) => { from = e.target.value; draw(); };
      $('#f2', el).onchange = (e) => { to = e.target.value; draw(); };
      $('#pexp', el).onclick = () => NS.csv('prim-listesi', byStaff, [{ label: 'Personel', value: (x) => x.s.name }, { key: 'n', label: 'Randevu' }, { key: 'r', label: 'Gelir' }, { key: 'prim', label: 'Prim' }, { key: 'tip', label: 'Bahşiş' }]);
    };
    draw();
  }

  // ---------- Uygulama ----------
  const ROLES = { admin: 'Yönetici', resepsiyon: 'Resepsiyon', personel: 'Personel' };
  NS.shell({
    id: 'randevu', integrations: ['sms','whatsapp','email','pos','webhook','backup'], name: 'Randevu', tagline: 'Salon & Klinik Randevu Sistemi', icon: 'calendar', accent: '#9333ea', db, home: 'ozet',
    auth: { roles: ROLES },
    nav: [
      { sec: 'Randevular' },
      { id: 'ozet', label: 'Özet', icon: 'home' },
      { id: 'takvim', label: 'Takvim', icon: 'calendar' },
      { id: 'liste', label: 'Randevu Listesi', icon: 'list' },
      { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['resepsiyon'] },
      { id: 'paketler', label: 'Paketler & Seanslar', icon: 'gift', roles: ['resepsiyon'] },
      { id: 'hatirlatma', label: 'SMS Hatırlatma', icon: 'message', roles: ['resepsiyon'] },
      { sec: 'İşletme' },
      { id: 'kasa', label: 'Kasa', icon: 'cash', roles: ['resepsiyon'] },
      { id: 'hizmetler', label: 'Hizmetler', icon: 'sparkles', roles: ['admin'] },
      { id: 'personel', label: 'Personel & Prim', icon: 'user', roles: ['admin'] },
      { id: 'online', label: 'Online Randevu', icon: 'globe', roles: ['admin'] },
      { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] },
      { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] },
    ],
    routes: { ozet: dashboard, takvim: calendarPage, liste: listPage, musteriler: customersPage, paketler: packagesPage, hatirlatma: remindersPage, kasa: cashPage, hizmetler: servicesPage, personel: staffPage, online: onlinePage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES }) },
  });
  window.addEventListener('storage', (e) => { if (e.key === db.key) db.load(); });
})();
