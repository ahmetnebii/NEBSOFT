/* NEBSOFT Teknik Servis — cihaz kabul, kanban, teklif/onay, parça stoku, teslim ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const SV = window.SERVIS;
  const db = new NS.DB('servis', SV.seed);
  const S = () => db.settings({ warrantyDays: 90 });
  const ST = Object.fromEntries(SV.STATUS.map((s) => [s.id, s]));
  const cust = (id) => db.get('customers', id) || { name: '-', phone: '' };
  const tech = (id) => db.get('techs', id) || { name: 'Atanmadı' };
  const total = (t) => sum(t.parts, (p) => p.price * p.qty) + (t.labor || 0);
  const paid = (t) => sum(t.payments, (p) => p.amount) + (t.deposit || 0);
  const openT = () => db.all('tickets', (t) => !['teslim', 'iade'].includes(t.status) || (t.status === 'iade' && !t.delivered));
  const late = (t) => !['teslim', 'iade', 'hazir'].includes(t.status) && t.promised && t.promised < new Date().toISOString();
  const trackUrl = (t) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'takip.html?kod=' + t.code;

  function setStatus(t, status, note) {
    t.status = status;
    t.log.push({ at: new Date().toISOString(), status, note: note || ST[status].name, user: NS.currentUser && NS.currentUser.name });
    if (status === 'teslim') t.delivered = new Date().toISOString();
    // Müşteriye otomatik bildirim (demo: simüle edilir)
    if (['onay', 'hazir', 'parca'].includes(status)) NS.smsLog(db, { to: cust(t.customer).phone, name: cust(t.customer).name, text: `${S().bizName}: ${t.no} nolu ${t.brand} ${t.model} cihazınızın durumu: ${ST[status].name}. Takip: ${trackUrl(t)}`, at: new Date().toISOString() }, true);
    db.log('Durum', `${t.no} → ${ST[status].name}`);
    db.save();
  }

  // ---------- Cihaz kabul ----------
  const CUST_FIELDS = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'email', label: 'E-posta', type: 'email' }];
  async function intake(app) {
    modal({
      title: 'Cihaz Kabul', size: 'wide',
      body: `<div class="form-grid">
        <div class="field full"><label>Müşteri *</label><div class="row nw"><select class="input" id="ic"><option value="">Seçin...</option>${db.all('customers').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => `<option value="${c.id}">${esc(c.name)} · ${esc(c.phone)}</option>`).join('')}</select><button class="btn" id="icn">${icon('plus')} Yeni</button></div></div>
        ${NS.fieldsHtml([
          { name: 'type', label: 'Cihaz türü', type: 'select', options: ['Telefon', 'Tablet', 'Laptop', 'Bilgisayar', 'Konsol', 'Televizyon', 'Çamaşır makinesi', 'Bulaşık makinesi', 'Buzdolabı', 'Klima', 'Diğer'] },
          { name: 'brand', label: 'Marka', required: true }, { name: 'model', label: 'Model', required: true }, { name: 'serial', label: 'Seri no / IMEI' },
          { name: 'issue', label: 'Müşteri şikâyeti / arıza', type: 'textarea', full: true, required: true },
          { name: 'condition', label: 'Fiziksel durum', placeholder: 'Çizik, ezik, kırık...' }, { name: 'accessories', label: 'Teslim alınan aksesuar', placeholder: 'Şarj aleti, kılıf...' },
          { name: 'lockCode', label: 'Ekran kilidi / şifre', hint: 'Test için gerekliyse' }, { name: 'tech', label: 'Teknisyen', type: 'select', options: db.all('techs').map((x) => ({ value: x.id, label: `${x.name} (${x.skill})` })) },
          { name: 'promised', label: 'Söz verilen teslim', type: 'date', value: iso(addDays(new Date(), 3)) }, { name: 'priority', label: 'Öncelik', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'acil', label: 'Acil' }] },
          { name: 'deposit', label: 'Alınan ön ödeme (₺)', type: 'number', value: 0 }, { name: 'estimate', label: 'Tahmini ücret (₺)', type: 'number', hint: 'Bilinmiyorsa boş bırakın' },
        ]).replace(/^<div class="form-grid">|<\/div>$/g, '')}</div>`,
      onOpen: (b) => { $('#icn', b).onclick = async () => { const c = await formModal({ title: 'Yeni müşteri', fields: CUST_FIELDS }); if (c) { const n = db.insert('customers', c); $('#ic', b).insertAdjacentHTML('beforeend', `<option value="${n.id}">${esc(n.name)}</option>`); $('#ic', b).value = n.id; } }; },
      actions: [{ label: 'Vazgeç' }, {
        label: 'Kaydet ve fiş yazdır', cls: 'primary', icon: 'print', onClick: (close, b) => {
          if (!$('#ic', b).value) return toast('Müşteri seçin', 'err');
          if (!NS.validate(b)) return;
          const v = NS.readForm(b);
          const t = db.insert('tickets', { ...v, customer: $('#ic', b).value, no: db.nextNo('tickets', 'SRV'), code: Math.random().toString(36).slice(2, 8).toUpperCase(), status: 'kabul', received: new Date().toISOString(), promised: new Date(v.promised + 'T18:00').toISOString(), parts: [], labor: 0, payments: [], estimate: Number(v.estimate) || 0, deposit: Number(v.deposit) || 0, approved: false, log: [{ at: new Date().toISOString(), status: 'kabul', note: 'Cihaz teslim alındı', user: NS.currentUser && NS.currentUser.name }] });
          db.log('Cihaz kabul', `${t.no} · ${t.brand} ${t.model}`);
          close(); toast(`${t.no} kaydedildi`, 'ok'); printIntake(t); app.go('kayit', t.id);
        },
      }],
    });
  }
  function printIntake(t) {
    const s = S(), c = cust(t.customer);
    const half = (copy) => `<div class="doc" style="border:1px solid #999;padding:14px;margin-bottom:18px"><table><tr><td><h2 style="margin:0">${esc(s.bizName)}</h2><div>${esc(s.bizAddress)} · ${esc(s.bizPhone)}</div></td><td style="text-align:right;width:240px">${NS.barcodeSvg(t.no, { height: 36 })}</td></tr></table>
      <h3>SERVİS KABUL FORMU <small>(${copy})</small></h3><table><tr><td><b>Müşteri:</b> ${esc(c.name)}<br><b>Telefon:</b> ${esc(c.phone)}</td><td><b>Tarih:</b> ${NS.dt(t.received)}<br><b>Tahmini teslim:</b> ${NS.date(t.promised)}</td></tr>
      <tr><td><b>Cihaz:</b> ${esc(t.type)} — ${esc(t.brand)} ${esc(t.model)}<br><b>Seri/IMEI:</b> ${esc(t.serial || '-')}</td><td><b>Aksesuar:</b> ${esc(t.accessories || '-')}<br><b>Fiziksel durum:</b> ${esc(t.condition || '-')}</td></tr>
      <tr><td colspan="2"><b>Arıza:</b> ${esc(t.issue)}</td></tr>${t.estimate ? `<tr><td colspan="2"><b>Tahmini ücret:</b> ${money(t.estimate)} ${t.deposit ? ` · <b>Ön ödeme:</b> ${money(t.deposit)}` : ''}</td></tr>` : ''}</table>
      <p style="font-size:11px">Takip kodu: <b>${esc(t.code)}</b> — Cihazınızın durumunu ${esc(trackUrl(t))} adresinden sorgulayabilirsiniz.</p><p style="font-size:10px;color:#555">${esc(s.terms || '')}</p>
      <table><tr><td>Teslim eden (müşteri) imza:<br><br>__________________</td><td style="text-align:right">Teslim alan:<br><br>__________________</td></tr></table></div>`;
    NS.printHtml(half('Müşteri nüshası') + half('Servis nüshası'), { title: t.no });
  }

  // ---------- Kayıt detayı ----------
  function detailPage(el, id, app) {
    const t = db.get('tickets', id);
    if (!t) return app.go('kayitlar');
    const c = cust(t.customer), st = ST[t.status];
    const bal = total(t) - paid(t);
    const idx = SV.STATUS.findIndex((s) => s.id === t.status);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/pano">${icon('back')} Pano</a><h1 class="grow">${esc(t.no)} · ${esc(t.brand)} ${esc(t.model)}</h1>${t.priority === 'acil' ? badge('ACİL', 'err') : ''}${late(t) ? badge('Gecikti', 'err') : ''}<span class="badge" style="background:${st.color};color:#fff;border:0">${esc(st.name)}</span></div>
      <div class="card pad mb"><div class="row">${SV.STATUS.filter((s) => s.id !== 'iade').map((s, i) => `<div class="grow center small" style="min-width:90px"><div style="height:6px;border-radius:6px;background:${i <= idx && t.status !== 'iade' ? s.color : 'var(--border)'}"></div><div class="mt ${s.id === t.status ? '' : 'faint'}" style="${s.id === t.status ? 'font-weight:700' : ''}">${esc(s.name)}</div></div>`).join('')}</div>
        <div class="row mt">${statusButtons(t)}<span class="grow"></span><button class="btn" data-x="print">${icon('print')} Kabul fişi</button><button class="btn" data-x="track">${icon('globe')} Takip linki</button><button class="btn" data-x="edit">${icon('edit')} Düzenle</button></div></div>
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Cihaz ve arıza</h3></div><div class="card-b grid g2">
          <div><div class="small muted">Cihaz</div><b>${esc(t.type)} — ${esc(t.brand)} ${esc(t.model)}</b><div class="small mono">${esc(t.serial || '')}</div></div>
          <div><div class="small muted">Müşteri</div><b>${esc(c.name)}</b><div class="small">${esc(c.phone)}</div></div>
          <div><div class="small muted">Şikâyet</div>${esc(t.issue)}</div><div><div class="small muted">Fiziksel durum / aksesuar</div>${esc(t.condition || '-')} · ${esc(t.accessories || '-')}</div>
          <div><div class="small muted">Teknisyen</div><b>${esc(tech(t.tech).name)}</b></div><div><div class="small muted">Kabul / söz verilen</div>${NS.dt(t.received)} → <b>${NS.date(t.promised)}</b></div>
          ${t.lockCode ? `<div><div class="small muted">Kilit kodu</div><span class="mono">${esc(t.lockCode)}</span></div>` : ''}
          <div class="full" style="grid-column:1/-1"><div class="small muted">Teknisyen tespiti</div><textarea class="input" id="dg" rows="2" placeholder="Arıza tespiti ve yapılan işlemler...">${esc(t.diagnosis || '')}</textarea><button class="btn sm mt" id="dgs">Tespiti kaydet</button></div>
        </div></div>
        <div class="card"><div class="card-h"><h3>Parça ve işçilik</h3><button class="btn sm" id="ap">${icon('plus')} Parça ekle</button></div>
          ${table({ rows: t.parts.map((p, i) => ({ ...p, id: i })), empty: 'Henüz parça eklenmedi', columns: [{ label: 'Parça', key: 'name' }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Fiyat', cls: 'right', render: (p) => money(p.price) }, { label: 'Tutar', cls: 'right', render: (p) => `<b>${money(p.price * p.qty)}</b>` }], actions: [{ icon: 'x', act: 'rp' }] })}
          <div class="card-b"><div class="row"><span class="grow">İşçilik</span><input class="input" type="number" id="lb" value="${t.labor || 0}" style="max-width:140px"><button class="btn sm" id="lbs">Kaydet</button></div>
          <hr><div class="row between"><span>Toplam</span><b style="font-size:20px">${money(total(t))}</b></div><div class="row between small muted"><span>Ödenen (ön ödeme dahil)</span><span>${money(paid(t))}</span></div><div class="row between"><span>Kalan</span><b style="color:${bal > 0 ? 'var(--err)' : 'var(--ok)'}">${money(bal)}</b></div>
          ${t.estimate ? `<div class="small mt">${icon('file')} Müşteriye verilen teklif: <b>${money(t.estimate)}</b> ${t.approved ? badge('Onaylandı', 'ok') : badge('Onay bekliyor', 'warn')}</div>` : ''}</div></div>
      </div><div class="col" style="gap:16px">
        <div class="card"><div class="card-h"><h3>Geçmiş</h3></div><div class="card-b"><div class="timeline">${t.log.slice().reverse().map((l) => `<div class="tl" style="--c:${(ST[l.status] || {}).color}"><b>${esc((ST[l.status] || {}).name || l.status)}</b><div class="small">${esc(l.note || '')}</div><div class="small faint">${NS.dt(l.at)}${l.user ? ' · ' + esc(l.user) : ''}</div></div>`).join('')}</div>
          <div class="row nw mt"><input class="input" id="nt" placeholder="Not ekle..."><button class="btn" id="nts">${icon('plus')}</button></div></div></div>
        ${t.review ? `<div class="card pad"><div class="small muted">Müşteri değerlendirmesi</div><div style="font-size:20px;color:#f59e0b">${'★'.repeat(t.review.stars)}<span style="color:var(--border)">${'★'.repeat(5 - t.review.stars)}</span></div>${t.review.text ? `<div class="small mt">“${esc(t.review.text)}”</div>` : ''}<div class="small faint">${NS.dt(t.review.at)}</div></div>` : ''}
        <div class="card pad center"><div class="small muted mb">Müşteri takip kodu</div><div style="font-size:24px;font-weight:800;letter-spacing:.1em" class="mono">${esc(t.code)}</div><div class="mt">${NS.qrSvg(trackUrl(t), 110)}</div></div>
      </div></div>`;
    const re = () => app.refresh();
    on(el, 'click', '[data-st]', async (e, b) => {
      const s = b.dataset.st;
      if (s === 'onay') {
        const v = await formModal({ title: 'Fiyat teklifi gönder', fields: [{ name: 'estimate', label: 'Teklif tutarı (₺)', type: 'number', value: t.estimate || total(t), required: true }, { name: 'diagnosis', label: 'Tespit (müşteriye iletilir)', type: 'textarea', value: t.diagnosis, full: true }] });
        if (!v) return; t.estimate = v.estimate; t.diagnosis = v.diagnosis; setStatus(t, 'onay', `Fiyat teklifi: ${money(v.estimate)}`); toast('Teklif SMS ile müşteriye iletildi', 'ok');
      } else if (s === 'approve') { t.approved = true; setStatus(t, 'tamirde', 'Müşteri fiyatı onayladı'); }
      else if (s === 'teslim') {
        const due = total(t) - paid(t);
        if (due > 0) { const v = await formModal({ title: `Teslim — tahsilat ${money(due)}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', value: due }, { name: 'type', label: 'Ödeme', type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart' }, { value: 'havale', label: 'Havale' }] }], submitLabel: 'Teslim et' }); if (!v) return; t.payments.push({ ...v, at: new Date().toISOString() }); }
        t.warrantyUntil = iso(addDays(new Date(), S().warrantyDays || 90));
        setStatus(t, 'teslim', `Teslim edildi · ${S().warrantyDays} gün garanti`); printDelivery(t);
      } else if (s === 'iade') { const n = await NS.prompt('Neden tamir edilemedi?', '', { title: 'İade' }); if (n === null) return; setStatus(t, 'iade', n || 'Tamir edilemedi'); }
      else setStatus(t, s);
      re();
    });
    on(el, 'click', '[data-x]', (e, b) => {
      const x = b.dataset.x;
      if (x === 'print') printIntake(t);
      else if (x === 'track') { navigator.clipboard && navigator.clipboard.writeText(trackUrl(t)); window.open(trackUrl(t), '_blank'); toast('Takip linki kopyalandı', 'ok'); }
      else if (x === 'edit') formModal({ title: 'Kaydı düzenle', fields: [{ name: 'brand', label: 'Marka' }, { name: 'model', label: 'Model' }, { name: 'serial', label: 'Seri no' }, { name: 'issue', label: 'Arıza', type: 'textarea', full: true }, { name: 'tech', label: 'Teknisyen', type: 'select', options: db.all('techs').map((x2) => ({ value: x2.id, label: x2.name })) }, { name: 'priority', label: 'Öncelik', type: 'select', options: ['normal', 'acil'] }, { name: 'promisedD', label: 'Söz verilen tarih', type: 'date' }], values: { ...t, promisedD: iso(t.promised) } }).then((v) => { if (!v) return; v.promised = new Date(v.promisedD + 'T18:00').toISOString(); delete v.promisedD; db.update('tickets', t.id, v); re(); });
    });
    $('#dgs', el).onclick = () => { t.diagnosis = $('#dg', el).value; db.save(); toast('Kaydedildi', 'ok'); };
    $('#lbs', el).onclick = () => { t.labor = Number($('#lb', el).value) || 0; db.save(); re(); };
    $('#nts', el).onclick = () => { const v = $('#nt', el).value.trim(); if (!v) return; t.log.push({ at: new Date().toISOString(), status: t.status, note: v, user: NS.currentUser && NS.currentUser.name }); db.save(); re(); };
    $('#ap', el).onclick = async () => {
      const v = await formModal({ title: 'Parça ekle', fields: [{ name: 'pid', label: 'Parça', type: 'select', options: db.all('parts').map((p) => ({ value: p.id, label: `${p.name} — ${money(p.price)} (stok ${p.stock})` })) }, { name: 'qty', label: 'Adet', type: 'number', value: 1 }] });
      if (!v) return;
      const p = db.get('parts', v.pid);
      if (p.stock < v.qty && !(await confirm(`${p.name} stokta yetersiz (${p.stock}). Yine de eklensin mi? (Parça bekleniyor durumuna alabilirsiniz)`, { ok: 'Ekle', danger: false }))) return;
      p.stock -= v.qty; t.parts.push({ pid: p.id, name: p.name, qty: v.qty, price: p.price, cost: p.cost }); db.save(); re();
    };
    on(el, 'click', '[data-act=rp]', (e, b) => { const p = t.parts[b.dataset.id]; const part = db.get('parts', p.pid); if (part) part.stock += p.qty; t.parts.splice(b.dataset.id, 1); db.save(); re(); });
  }
  function statusButtons(t) {
    const B = (st, label, cls = '') => `<button class="btn ${cls}" data-st="${st}">${label}</button>`;
    switch (t.status) {
      case 'kabul': return B('inceleme', `${icon('search')} Arıza tespitine al`, 'primary');
      case 'inceleme': return B('onay', `${icon('send')} Fiyat teklifi gönder`, 'primary') + B('tamirde', `${icon('wrench')} Onaysız tamire al`) + B('iade', 'Tamir edilemez', 'danger');
      case 'onay': return B('approve', `${icon('check')} Müşteri onayladı`, 'ok') + B('iade', 'Müşteri reddetti', 'danger');
      case 'tamirde': return B('hazir', `${icon('check')} Onarım tamamlandı`, 'ok') + B('parca', `${icon('truck')} Parça bekleniyor`);
      case 'parca': return B('tamirde', `${icon('wrench')} Parça geldi, tamire al`, 'primary');
      case 'hazir': return B('teslim', `${icon('user')} Müşteriye teslim et`, 'primary');
      case 'iade': return t.delivered ? '' : B('teslim', `${icon('user')} Cihazı iade et (teslim)`);
      default: return `<span class="muted small">${t.warrantyUntil ? `Garanti: ${NS.date(t.warrantyUntil)} tarihine kadar` : 'Teslim edildi'}</span>`;
    }
  }
  function printDelivery(t) {
    const s = S(), c = cust(t.customer);
    NS.printHtml(`<div class="doc"><h2>${esc(s.bizName)}</h2><div>${esc(s.bizAddress)} · ${esc(s.bizPhone)}</div><hr><h3>TESLİM VE GARANTİ BELGESİ — ${esc(t.no)}</h3><p><b>${esc(c.name)}</b> · ${esc(t.brand)} ${esc(t.model)} (${esc(t.serial || '-')})</p><p><b>Yapılan işlem:</b> ${esc(t.diagnosis || '-')}</p>
      <table><tr><th>Kalem</th><th>Adet</th><th style="text-align:right">Tutar</th></tr>${t.parts.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.qty}</td><td style="text-align:right">${money(p.price * p.qty)}</td></tr>`).join('')}<tr><td>İşçilik</td><td>1</td><td style="text-align:right">${money(t.labor || 0)}</td></tr><tr><td colspan="2"><b>TOPLAM</b></td><td style="text-align:right"><b>${money(total(t))}</b></td></tr></table>
      <p>Garanti bitiş: <b>${NS.date(t.warrantyUntil)}</b> (yapılan işlem ve değişen parçalar için)</p><p style="margin-top:30px">Teslim alan müşteri imza: ____________________</p></div>`, { title: t.no });
  }

  // ---------- Kanban pano ----------
  function boardPage(el, p, app) {
    let q = '', tf = '';
    const draw = () => {
      const list = openT().filter((t) => (!tf || t.tech === tf) && NS.match(q, t.no, t.brand, t.model, cust(t.customer).name, cust(t.customer).phone, t.serial));
      el.innerHTML = pageHead('Servis Panosu', 'Kartları sürükleyerek durum değiştirin', `${NS.searchBox('q', 'No, müşteri, IMEI...', q)}<select class="input" id="tf" style="max-width:180px"><option value="">Tüm teknisyenler</option>${db.all('techs').map((x) => `<option value="${x.id}" ${tf === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><button class="btn primary" id="ni">${icon('plus')} Cihaz kabul</button>`) +
        `<div class="grid g4 mb">${kpi('Serviste', openT().length, 'wrench')}${kpi('Onay bekleyen', openT().filter((t) => t.status === 'onay').length, 'clock', 'warn')}${kpi('Teslime hazır', openT().filter((t) => t.status === 'hazir').length, 'check', 'ok')}${kpi('Geciken', openT().filter(late).length, 'alert', 'err')}</div>
        <div class="kanban">${SV.STATUS.filter((s) => s.id !== 'teslim').map((s) => { const cards = list.filter((t) => t.status === s.id); return `<div class="kcol" data-col="${s.id}"><h4 style="color:${s.color}">${icon(s.icon)} ${esc(s.name)} <span class="badge">${cards.length}</span></h4>${cards.map((t) => `<div class="kc ${late(t) ? 'late' : ''}" draggable="true" data-t="${t.id}" style="--c:${s.color}"><div class="row between nw"><b>${esc(t.brand)} ${esc(t.model)}</b>${t.priority === 'acil' ? badge('Acil', 'err') : ''}</div><div class="muted">${esc(cust(t.customer).name)}</div><div class="small faint">${esc(t.no)} · ${esc(tech(t.tech).name.split(' ')[0])} · ${NS.date(t.promised)}</div><div class="small" style="margin-top:4px">${esc(String(t.issue).slice(0, 60))}</div></div>`).join('')}</div>`; }).join('')}</div>`;
      $('#q', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#q', el); i.focus(); i.setSelectionRange(pos, pos); };
      $('#tf', el).onchange = (e) => { tf = e.target.value; draw(); };
      $('#ni', el).onclick = () => intake(app);
      $('#ni', el).insertAdjacentHTML('beforebegin', `<button class="btn" id="cid">${icon('phone')} Gelen çağrı</button>`);
      // Arayan numara: müşterinin serviste olan cihazları ve durumları anında gösterilir
      $('#cid', el).onclick = async () => {
        let phone = '';
        if (NS.integ && NS.integ.isOn('callerid')) { const r = await NS.integ.call('callerid', 'son-arama', {}, { silent: true }); phone = r && r.data && r.data.phone ? r.data.phone : r && r.simulated ? (cust((openT()[0] || {}).customer).phone || '') : ''; }
        if (!phone) phone = await NS.prompt('Arayan numara', '05', { title: 'Gelen çağrı', type: 'tel' }); if (!phone) return;
        const digits = String(phone).replace(/\D/g, '').slice(-10); const c = db.find('customers', (x) => String(x.phone).replace(/\D/g, '').slice(-10) === digits);
        if (!c) { toast('Kayıtlı müşteri değil — cihaz kabulü açılıyor'); return intake(app); }
        const ts = db.all('tickets', (t) => t.customer === c.id).sort((a, b) => String(b.no).localeCompare(String(a.no), 'tr', { numeric: true }));
        modal({ title: `${c.name} arıyor · ${c.phone}`, size: 'wide', body: table({ rows: ts, empty: 'Kayıt yok', columns: [{ label: 'No', render: (t) => `<b>${esc(t.no)}</b>` }, { label: 'Cihaz', render: (t) => `${esc(t.brand)} ${esc(t.model)}` }, { label: 'Durum', render: (t) => `<span style="color:${ST[t.status].color};font-weight:700">${esc(ST[t.status].name)}</span>` }, { label: 'Söz verilen', render: (t) => NS.date(t.promised) }] }), actions: [{ label: 'Yeni cihaz kabul', icon: 'plus', onClick: (cl) => { cl(); intake(app); } }, { label: 'Kapat', cls: 'primary' }] });
      };
    };
    let dragId = null;
    el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-t]'); if (c) { dragId = c.dataset.t; e.dataTransfer.effectAllowed = 'move'; } });
    el.addEventListener('dragover', (e) => { const col = e.target.closest('[data-col]'); if (col && dragId) { e.preventDefault(); $$('.kcol', el).forEach((k) => k.classList.toggle('over', k === col)); } });
    el.addEventListener('drop', (e) => {
      const col = e.target.closest('[data-col]'); if (!col || !dragId) return;
      e.preventDefault();
      const t = db.get('tickets', dragId); dragId = null;
      if (t.status !== col.dataset.col) { if (col.dataset.col === 'tamirde' && t.status === 'onay') t.approved = true; setStatus(t, col.dataset.col); toast(`${t.no} → ${ST[col.dataset.col].name}`, 'ok'); }
      draw();
    });
    el.addEventListener('dragend', () => $$('.kcol', el).forEach((k) => k.classList.remove('over')));
    on(el, 'click', '[data-t]', (e, c) => app.go('kayit', c.dataset.t));
    draw();
  }

  // ---------- Liste ----------
  function listPage(el, p, app) {
    let q = '', f = 'open';
    el.innerHTML = pageHead('Servis Kayıtları', 'Tüm kayıtlar, garanti sorgulama ve dışa aktarma', `<button class="btn" id="ex">${icon('download')}</button><button class="btn primary" id="ni">${icon('plus')} Cihaz kabul</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'No, müşteri, telefon, IMEI, marka...')}<div class="seg">${[['open', 'Açık'], ['teslim', 'Teslim edilen'], ['garanti', 'Garantide'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('tickets', (t) => (f === 'all' || (f === 'open' ? !['teslim', 'iade'].includes(t.status) : f === 'garanti' ? t.warrantyUntil && t.warrantyUntil >= today() : t.status === f)) && NS.match(q, t.no, t.brand, t.model, t.serial, cust(t.customer).name, cust(t.customer).phone)).sort((a, b) => b.received.localeCompare(a.received));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'wrench', columns: [{ label: 'No', render: (t) => `<b>${esc(t.no)}</b>` }, { label: 'Kabul', render: (t) => NS.date(t.received) }, { label: 'Müşteri', render: (t) => `${esc(cust(t.customer).name)}<div class="small faint">${esc(cust(t.customer).phone)}</div>` }, { label: 'Cihaz', render: (t) => `${esc(t.brand)} ${esc(t.model)}<div class="small faint">${esc(t.type)}</div>` }, { label: 'Teknisyen', render: (t) => esc(tech(t.tech).name) }, { label: 'Durum', render: (t) => `<span class="badge" style="background:${ST[t.status].color};color:#fff;border:0">${esc(ST[t.status].name)}</span>${late(t) ? ' ' + badge('Gecikti', 'err') : ''}` }, { label: 'Tutar', cls: 'right', render: (t) => money(total(t)) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} kayıt · ${money(sum(r, total))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => app.go('kayit', b.dataset.id));
    $('#ni', el).onclick = () => intake(app);
    $('#ex', el).onclick = () => NS.csv('servis-kayitlari', rows(), [{ key: 'no', label: 'No' }, { label: 'Müşteri', value: (t) => cust(t.customer).name }, { label: 'Cihaz', value: (t) => `${t.brand} ${t.model}` }, { label: 'Durum', value: (t) => ST[t.status].name }, { label: 'Tutar', value: total }]);
    draw();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const done = db.all('tickets', (t) => t.status === 'teslim' && t.delivered);
    const d30 = addDays(new Date(), -30).toISOString();
    const rev = sum(done.filter((t) => t.delivered > d30), total);
    const profit = sum(done.filter((t) => t.delivered > d30), (t) => total(t) - sum(t.parts, (x) => x.cost * x.qty));
    const avgH = done.length ? sum(done, (t) => (new Date(t.delivered) - new Date(t.received)) / 3600000) / done.length : 0;
    const ser = NS.dailySeries(done.map((t) => ({ ...t, at: t.delivered })), 30, 'at', total);
    const byType = NS.groupBy(db.all('tickets'), (t) => t.type);
    el.innerHTML = pageHead('Servis Özeti', NS.dateLong(new Date()), `<button class="btn primary" id="ni">${icon('plus')} Cihaz kabul</button>`) + `
      <div class="grid g4 mb">${kpi('Serviste bekleyen', openT().length, 'wrench')}${kpi('30 gün ciro', money(rev), 'trend', 'ok')}${kpi('30 gün brüt kâr', money(profit), 'wallet', 'info')}${kpi('Ort. teslim süresi', (avgH / 24).toFixed(1) + ' gün', 'clock', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük teslim cirosu</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money, labelEvery: 3 })}</div></div>
      <div class="card"><div class="card-h"><h3>Cihaz türleri</h3></div><div class="card-b">${chart.donut(Object.entries(byType).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Geciken işler</h3></div>${table({ rows: openT().filter(late), empty: 'Geciken iş yok 🎉', columns: [{ label: 'No', render: (t) => `<a href="#/kayit/${t.id}"><b>${esc(t.no)}</b></a>` }, { label: 'Cihaz', render: (t) => `${esc(t.brand)} ${esc(t.model)}` }, { label: 'Söz', render: (t) => NS.date(t.promised) }, { label: 'Durum', render: (t) => esc(ST[t.status].name) }] })}</div>
      <div class="card"><div class="card-h"><h3>Teknisyen iş yükü</h3></div><div class="card-b">${db.all('techs').map((x) => { const n = openT().filter((t) => t.tech === x.id).length; return `<div class="list-item"><div class="avatar">${esc(NS.initials(x.name))}</div><div class="grow"><b>${esc(x.name)}</b><div class="small faint">${esc(x.skill)}</div><div class="progress mt"><i style="width:${Math.min(100, n * 10)}%"></i></div></div><b>${n} iş</b></div>`; }).join('')}</div></div></div>`;
    $('#ni', el).onclick = () => intake(app);
  }

  // ---------- Parça, teknisyen, müşteri ----------
  function partsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'parts', title: 'Parça Stoku', sub: 'Yedek parça, maliyet ve satış fiyatları', single: 'Parça', addLabel: 'Yeni parça', emptyIcon: 'box', sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      fields: [{ name: 'name', label: 'Parça adı', required: true, full: true }, { name: 'cat', label: 'Kategori' }, { name: 'cost', label: 'Alış (₺)', type: 'number' }, { name: 'price', label: 'Satış (₺)', type: 'number', required: true }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'min', label: 'Kritik', type: 'number' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'low', label: 'Kritik', test: (x) => x.stock <= x.min }],
      columns: [{ key: 'name', label: 'Parça', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.cat || '')}</div>` }, { key: 'cost', label: 'Alış', cls: 'right', render: (x) => money(x.cost) }, { key: 'price', label: 'Satış', cls: 'right', render: (x) => money(x.price) }, { key: 'stock', label: 'Stok', cls: 'right', render: (x) => (x.stock <= x.min ? badge(x.stock, 'err') : x.stock) }, { label: 'Kullanım', cls: 'right', render: (x) => sum(db.all('tickets'), (t) => sum(t.parts.filter((pp) => pp.pid === x.id), (pp) => pp.qty)) }],
      extraActions: [{ icon: 'plus', act: 'in', title: 'Stok girişi' }],
      onAction: async (a, x, draw) => { const v = await NS.prompt(`${x.name} — gelen adet`, 1, { type: 'number' }); if (v) { x.stock += Number(v); db.save(); draw(); } },
    });
  }
  function techsPage(el, p, app) {
    NS.crud(el, app, { col: 'techs', title: 'Teknisyenler', single: 'Teknisyen', addLabel: 'Yeni teknisyen', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'skill', label: 'Uzmanlık' }, { name: 'phone', label: 'Telefon' }], columns: [{ key: 'name', label: 'Teknisyen', render: (x) => `<b>${esc(x.name)}</b>` }, { key: 'skill', label: 'Uzmanlık' }, { label: 'Açık iş', cls: 'right', render: (x) => openT().filter((t) => t.tech === x.id).length }, { label: 'Tamamlanan', cls: 'right', render: (x) => db.all('tickets', (t) => t.tech === x.id && t.status === 'teslim').length }, { label: 'Ciro', cls: 'right', render: (x) => money(sum(db.all('tickets', (t) => t.tech === x.id && t.status === 'teslim'), total)) }] });
  }
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: CUST_FIELDS, sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (c) => [c.name, c.phone], columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b>` }, { key: 'phone', label: 'Telefon' }, { label: 'Cihaz', cls: 'right', render: (c) => db.all('tickets', (t) => t.customer === c.id).length }, { label: 'Harcama', cls: 'right', render: (c) => money(sum(db.all('tickets', (t) => t.customer === c.id && t.status === 'teslim'), total)) }] });
  }
  function smsPage(el) {
    el.innerHTML = pageHead('Müşteri Bildirimleri', 'Teklif, parça bekleniyor ve teslime hazır durumlarında müşteriye otomatik SMS gider (demo: simüle)') + `<div class="card">${table({ rows: db.all('sms').slice().reverse(), empty: 'Henüz bildirim gönderilmedi', columns: [{ label: 'Zaman', render: (s) => NS.dt(s.at) }, { label: 'Alıcı', render: (s) => `${esc(s.name)}<div class="small faint">${esc(s.to)}</div>` }, { label: 'Mesaj', render: (s) => `<span class="small">${esc(s.text)}</span>` }] })}</div>`;
  }

  const ROLES = { admin: 'Yönetici', teknisyen: 'Teknisyen', kabul: 'Kabul / Danışma' };
  NS.shell({
    id: 'servis', integrations: ['sms', 'whatsapp', 'email', 'printer', 'label', 'barcode', 'pos', 'efatura', 'webhook', 'backup'], name: 'Teknik Servis', tagline: 'Servis Takip Sistemi', icon: 'wrench', accent: '#ea580c', db, home: 'pano', auth: { roles: ROLES }, titles: { kayit: 'Servis kaydı' },
    nav: [{ sec: 'Servis' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['admin'] }, { id: 'pano', label: 'Servis Panosu', icon: 'kanban' }, { id: 'kayitlar', label: 'Servis Kayıtları', icon: 'list' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users' }, { sec: 'Yönetim' }, { id: 'parcalar', label: 'Parça Stoku', icon: 'box' }, { id: 'teknisyenler', label: 'Teknisyenler', icon: 'user', roles: ['admin'] }, { id: 'bildirimler', label: 'SMS Bildirimleri', icon: 'message' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, pano: boardPage, kayitlar: listPage, kayit: detailPage, musteriler: customersPage, parcalar: partsPage, teknisyenler: techsPage, bildirimler: smsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Servis ayarları' }, { name: 'warrantyDays', label: 'Garanti süresi (gün)', type: 'number' }, { name: 'terms', label: 'Kabul formu koşulları', type: 'textarea', full: true }] }) },
  });
})();
