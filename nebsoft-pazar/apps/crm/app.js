/* NEBSOFT CRM — satış hunisi, fırsat, firma/kişi, aktivite/görev, teklif ve satış tahmini */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const STAGES = [{ id: 'yeni', name: 'Yeni fırsat', p: 10, color: '#64748b' }, { id: 'gorusme', name: 'Görüşme', p: 25, color: '#0284c7' }, { id: 'teklif', name: 'Teklif verildi', p: 50, color: '#7c3aed' }, { id: 'pazarlik', name: 'Pazarlık', p: 75, color: '#d97706' }, { id: 'kazanildi', name: 'Kazanıldı', p: 100, color: '#16a34a' }, { id: 'kaybedildi', name: 'Kaybedildi', p: 0, color: '#dc2626' }];
  const ACT = { arama: ['Arama', 'phone'], toplanti: ['Toplantı', 'users'], eposta: ['E-posta', 'mail'], not: ['Not', 'edit'], gorev: ['Görev', 'check'] };

  function seed(db) {
    db.data._settings = { bizName: 'Delta Bilişim Satış', target: 2500000 };
    db.data.users = [{ id: 'u1', name: 'Gökhan Satış Md.', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'İrem Temsilci', role: 'temsilci', pin: '1234', active: true }, { id: 'u3', name: 'Barış Temsilci', role: 'temsilci', pin: '1234', active: true }];
    const comps = [['Yıldız Holding', 'Holding', 'İstanbul'], ['Ege Lojistik', 'Lojistik', 'İzmir'], ['Anadolu Sağlık Grubu', 'Sağlık', 'Ankara'], ['Marmara Gıda', 'Gıda', 'Bursa'], ['Toros Enerji', 'Enerji', 'Adana'], ['Kuzey Tekstil', 'Tekstil', 'Denizli'], ['Akdeniz Otelleri', 'Turizm', 'Antalya'], ['Başkent İnşaat', 'İnşaat', 'Ankara'], ['Pera Perakende', 'Perakende', 'İstanbul'], ['Mavi Eğitim Kurumları', 'Eğitim', 'İzmir'], ['Vadi Otomotiv', 'Otomotiv', 'Kocaeli'], ['Kale Mobilya', 'Mobilya', 'Kayseri']];
    db.data.companies = comps.map(([name, sector, city], i) => ({ id: 'f' + i, name, sector, city, phone: NS.phone(), web: 'www.' + NS.slug(name).split('-')[0] + '.com.tr', size: pick(['10-50', '50-250', '250-1000', '1000+']) }));
    db.data.contacts = db.data.companies.flatMap((c, i) => [0, 1].slice(0, rand(1, 2)).map((k) => ({ id: `k${i}_${k}`, company: c.id, name: NS.NAMES[(i * 2 + k) % NS.NAMES.length], title: pick(['Genel Müdür', 'BT Müdürü', 'Satın Alma Müdürü', 'CFO', 'Operasyon Direktörü']), phone: NS.phone(), email: NS.slug(NS.NAMES[(i * 2 + k) % NS.NAMES.length]).replace('-', '.') + '@' + c.web.replace('www.', '') })));
    const titles = ['ERP lisans yenileme', 'Bulut sunucu geçişi', 'Siber güvenlik denetimi', 'Network altyapı yenileme', 'CRM kurulumu', 'Yedekleme çözümü', 'Donanım alımı (50 laptop)', 'Yıllık destek sözleşmesi', 'E-ticaret entegrasyonu', 'Veri merkezi kolokasyon'];
    const deals = [];
    for (let k = 0; k < 42; k++) {
      const c = pick(db.data.companies); const ct = db.data.contacts.find((x) => x.company === c.id);
      const created = addDays(new Date(), -rand(2, 150)); const st = pick(['yeni', 'gorusme', 'gorusme', 'teklif', 'teklif', 'pazarlik', 'kazanildi', 'kazanildi', 'kaybedildi']);
      const closed = ['kazanildi', 'kaybedildi'].includes(st);
      deals.push({ id: 'd' + k, title: pick(titles), company: c.id, contact: ct ? ct.id : null, value: rand(4, 90) * 10000, stage: st, owner: pick(['u1', 'u2', 'u3', 'u2', 'u3']), source: pick(['Web formu', 'Referans', 'Fuar', 'Soğuk arama', 'LinkedIn', 'Mevcut müşteri']), expected: iso(addDays(new Date(), closed ? -rand(1, 60) : rand(5, 90))), created: created.toISOString(), closedAt: closed ? iso(addDays(created, rand(10, 60))) > today() ? today() : iso(addDays(created, rand(10, 60))) : null, lostReason: st === 'kaybedildi' ? pick(['Fiyat yüksek', 'Rakip tercih edildi', 'Bütçe ertelendi', 'İhtiyaç değişti']) : '', lastActivity: addDays(new Date(), -rand(0, 25)).toISOString() });
    }
    db.data.deals = deals;
    const acts = [];
    deals.forEach((d) => { for (let i = 0; i < rand(1, 4); i++) { const type = pick(Object.keys(ACT)); const date = addDays(new Date(), -rand(0, 40)); acts.push({ id: NS.uid(), deal: d.id, type, date: date.toISOString(), text: { arama: 'İhtiyaçları konuşuldu, bütçe onayı bekleniyor.', toplanti: 'Demo toplantısı yapıldı, teknik ekip katıldı.', eposta: 'Teklif ve referans listesi iletildi.', not: 'Karar verici CFO, Q4 bütçesinden çıkacak.', gorev: 'Revize teklif hazırla' }[type], owner: d.owner, done: type !== 'gorev' || Math.random() < 0.5, due: type === 'gorev' ? iso(addDays(new Date(), rand(-3, 10))) : null }); } });
    db.data.activities = acts;
    db.data.quotes = [];
  }
  const db = new NS.DB('crm', seed);
  const S = () => db.settings({ target: 2000000 });
  const comp = (id) => db.get('companies', id) || { name: '-' };
  const ctc = (id) => db.get('contacts', id) || { name: '-' };
  const usr = (id) => db.get('users', id) || { name: '-' };
  const stage = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
  const mine = () => (NS.currentUser && NS.currentUser.role === 'temsilci' ? NS.currentUser.id : null);
  const myDeals = () => db.all('deals', (d) => !mine() || d.owner === mine());
  const isOpen = (d) => !['kazanildi', 'kaybedildi'].includes(d.stage);
  const weighted = (d) => (d.value * stage(d.stage).p) / 100;
  const stale = (d) => isOpen(d) && daysBetween(d.lastActivity, new Date()) > 14;

  async function dealForm(app, rec = {}) {
    const v = await formModal({ title: rec.id ? 'Fırsatı düzenle' : 'Yeni fırsat', size: 'wide', fields: [{ name: 'title', label: 'Fırsat adı', required: true, full: true }, { name: 'company', label: 'Firma', type: 'select', options: db.all('companies').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => ({ value: c.id, label: c.name })) }, { name: 'contact', label: 'Yetkili', type: 'select', empty: '-', options: db.all('contacts').map((c) => ({ value: c.id, label: `${c.name} (${comp(c.company).name})` })) }, { name: 'value', label: 'Tutar (₺)', type: 'number', required: true }, { name: 'stage', label: 'Aşama', type: 'select', options: STAGES.map((s) => ({ value: s.id, label: s.name })) }, { name: 'expected', label: 'Tahmini kapanış', type: 'date' }, { name: 'owner', label: 'Sorumlu', type: 'select', options: db.all('users').map((u) => ({ value: u.id, label: u.name })) }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Web formu', 'Referans', 'Fuar', 'Soğuk arama', 'LinkedIn', 'Mevcut müşteri'] }, { name: 'lostReason', label: 'Kayıp nedeni (kaybedildiyse)' }], values: { stage: 'yeni', expected: iso(addDays(new Date(), 30)), owner: (NS.currentUser || {}).id, ...rec } });
    if (!v) return;
    if (['kazanildi', 'kaybedildi'].includes(v.stage) && (!rec.id || rec.stage !== v.stage)) v.closedAt = today();
    if (rec.id) db.update('deals', rec.id, { ...v, lastActivity: new Date().toISOString() }); else { const d = db.insert('deals', { ...v, lastActivity: new Date().toISOString() }); db.log('Yeni fırsat', d.title); }
    toast('Kaydedildi', 'ok'); app.refresh();
  }
  async function moveStage(app, d, to) {
    if (d.stage === to) return;
    if (to === 'kaybedildi') { const r = await NS.prompt('Kayıp nedeni', 'Fiyat yüksek', { title: 'Fırsat kaybedildi' }); if (r === null) return app.refresh(); d.lostReason = r; }
    d.stage = to; d.lastActivity = new Date().toISOString();
    if (['kazanildi', 'kaybedildi'].includes(to)) d.closedAt = today();
    db.insert('activities', { deal: d.id, type: 'not', date: new Date().toISOString(), text: `Aşama değişti: ${stage(to).name}`, owner: (NS.currentUser || {}).id, done: true }, true);
    db.save(); if (to === 'kazanildi') { toast(`🎉 ${d.title} kazanıldı: ${money(d.value)}`, 'ok'); NS.beep(1500, 200); } app.refresh();
  }

  function pipelinePage(el, p, app) {
    let q = '', own = '';
    const draw = () => {
      const list = myDeals().filter((d) => (!own || d.owner === own) && NS.match(q, d.title, comp(d.company).name));
      const open = list.filter(isOpen);
      el.innerHTML = pageHead('Satış Hunisi', `${open.length} açık fırsat · ${money(sum(open, (d) => d.value))} · ağırlıklı ${money(sum(open, weighted))}`, `${NS.searchBox('q', 'Fırsat veya firma...', q)}${mine() ? '' : `<select class="input" id="own" style="max-width:180px"><option value="">Tüm temsilciler</option>${db.all('users').map((u) => `<option value="${u.id}" ${own === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`}<button class="btn primary" id="nd">${icon('plus')} Fırsat</button>`) +
        `<div class="pipe">${STAGES.map((s) => { const ds = list.filter((d) => d.stage === s.id).filter((d) => isOpen(d) || (d.closedAt || '') >= iso(addDays(new Date(), -30))).sort((a, b) => b.value - a.value); return `<div class="stage" data-st="${s.id}"><h4 style="color:${s.color}"><span class="dot" style="background:${s.color}"></span>${s.name} <span class="badge">${ds.length}</span></h4><div class="sum">${money(sum(ds, (d) => d.value))}${s.p && s.p < 100 ? ` · %${s.p}` : ''}${!isOpen({ stage: s.id }) ? ' · son 30 gün' : ''}</div>${ds.map((d) => `<div class="deal ${stale(d) ? 'stale' : ''}" draggable="true" data-d="${d.id}"><b>${esc(d.title)}</b><span class="small muted">${esc(comp(d.company).name)}</span><div class="v">${money(d.value)}</div><div class="row between small faint"><span>${esc(usr(d.owner).name.split(' ')[0])}</span><span>${stale(d) ? '⚠ ' + daysBetween(d.lastActivity, new Date()) + ' gündür sessiz' : NS.date(d.expected)}</span></div></div>`).join('')}</div>`; }).join('')}</div>`;
      $('#q', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#q', el); i.focus(); i.setSelectionRange(pos, pos); };
      if ($('#own', el)) $('#own', el).onchange = (e) => { own = e.target.value; draw(); };
      $('#nd', el).onclick = () => dealForm(app);
      $('#nd', el).insertAdjacentHTML('beforebegin', `<button class="btn" id="cid">${icon('phone')} Gelen çağrı</button>`);
      // Arayan numara: kişi ve firması bulunur, açık fırsatlar listelenir, görüşme notu tek tıkla eklenir
      $('#cid', el).onclick = async () => {
        let phone = '';
        if (NS.integ && NS.integ.isOn('callerid')) { const r = await NS.integ.call('callerid', 'son-arama', {}, { silent: true }); phone = r && r.data && r.data.phone ? r.data.phone : r && r.simulated ? (db.all('contacts')[0] || {}).phone || '' : ''; }
        if (!phone) phone = await NS.prompt('Arayan numara', '05', { title: 'Gelen çağrı', type: 'tel' }); if (!phone) return;
        const dg = String(phone).replace(/\D/g, '').slice(-10);
        const k = db.find('contacts', (x) => String(x.phone || '').replace(/\D/g, '').slice(-10) === dg); const c = k ? comp(k.company) : db.find('companies', (x) => String(x.phone || '').replace(/\D/g, '').slice(-10) === dg);
        if (!c) return toast('Numara kayıtlı değil — Kişiler sayfasından ekleyebilirsiniz', 'err');
        const ds = db.all('deals', (d) => d.company === c.id && isOpen(d));
        modal({ title: `${k ? k.name + ' · ' : ''}${c.name} arıyor`, size: 'wide', body: `<div class="small muted mb">${esc(phone)}${k ? ' · ' + esc(k.title || '') : ''}</div>` + table({ rows: ds, empty: 'Açık fırsat yok', columns: [{ label: 'Fırsat', render: (d) => `<a href="#/firsat/${d.id}"><b>${esc(d.title)}</b></a>` }, { label: 'Aşama', render: (d) => esc(stage(d.stage).name) }, { label: 'Tutar', cls: 'right', render: (d) => money(d.value) }] }), actions: [{ label: 'Yeni fırsat', icon: 'plus', onClick: (cl) => { cl(); dealForm(app, { company: c.id }); } }, ...(ds[0] ? [{ label: 'Görüşme notu ekle', cls: 'primary', onClick: async (cl) => { cl(); const v = await formModal({ title: 'Telefon görüşmesi', fields: [{ name: 'text', label: 'Not', type: 'textarea', required: true, full: true }] }); if (v) { db.insert('activities', { deal: ds[0].id, type: 'arama', date: new Date().toISOString(), text: v.text, done: true, owner: (NS.currentUser || {}).id }, true); ds[0].lastActivity = new Date().toISOString(); db.save(); toast('Görüşme kaydedildi', 'ok'); } } }] : [])] });
      };
    };
    let drag = null;
    el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-d]'); if (c) { drag = c.dataset.d; e.dataTransfer.effectAllowed = 'move'; } });
    el.addEventListener('dragover', (e) => { const s = e.target.closest('[data-st]'); if (s && drag) { e.preventDefault(); $$('.stage', el).forEach((x) => x.classList.toggle('over', x === s)); } });
    el.addEventListener('dragend', () => $$('.stage', el).forEach((x) => x.classList.remove('over')));
    el.addEventListener('drop', (e) => { const s = e.target.closest('[data-st]'); if (!s || !drag) return; e.preventDefault(); const d = db.get('deals', drag); drag = null; moveStage(app, d, s.dataset.st); });
    on(el, 'click', '[data-d]', (e, c) => app.go('firsat', c.dataset.d));
    draw();
  }
  function dealPage(el, id, app) {
    const d = db.get('deals', id); if (!d) return app.go('huni');
    const acts = db.all('activities', (a) => a.deal === id).sort((a, b) => b.date.localeCompare(a.date));
    const c = comp(d.company), ct = ctc(d.contact), s = stage(d.stage);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/huni">${icon('back')} Huni</a><h1 class="grow">${esc(d.title)}</h1><button class="btn" id="qt">${icon('file')} Teklif hazırla</button><button class="btn" id="ed">${icon('edit')} Düzenle</button></div>
      <div class="card pad mb"><div class="row">${STAGES.map((x) => `<button class="btn sm ${x.id === d.stage ? '' : 'ghost'}" data-mv="${x.id}" style="${x.id === d.stage ? `background:${x.color};color:#fff;border-color:${x.color}` : ''}">${x.name}</button>`).join(icon('right'))}</div></div>
      <div class="grid g4 mb">${kpi('Tutar', money(d.value), 'wallet')}${kpi('Olasılık', '%' + s.p, 'percent', 'info')}${kpi('Ağırlıklı', money(weighted(d)), 'trend', 'ok')}${kpi('Tahmini kapanış', NS.date(d.expected), 'calendar', d.expected < today() && isOpen(d) ? 'err' : 'warn')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Aktiviteler</h3>${Object.entries(ACT).map(([k, v]) => `<button class="btn sm" data-add="${k}">${icon(v[1])} ${v[0]}</button>`).join('')}</div><div class="card-b">${acts.map((a) => `<div class="act"><div class="ai">${icon(ACT[a.type][1])}</div><div class="grow"><div class="row between"><b>${ACT[a.type][0]}</b><span class="small faint">${NS.dt(a.date)} · ${esc(usr(a.owner).name)}</span></div><div>${esc(a.text)}</div>${a.type === 'gorev' ? `<label class="check small mt"><input type="checkbox" data-done="${a.id}" ${a.done ? 'checked' : ''}> Tamamlandı · son tarih ${NS.date(a.due)}</label>` : ''}</div></div>`).join('') || '<div class="faint small">Aktivite yok</div>'}</div></div>
      <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">${icon('building')} ${esc(c.name)}</h3><div class="small muted">${esc(c.sector || '')} · ${esc(c.city || '')} · ${esc(c.size || '')} çalışan</div><div class="small mt">${esc(c.phone || '')} · ${esc(c.web || '')}</div>${ct.name !== '-' ? `<hr><b>${esc(ct.name)}</b><div class="small muted">${esc(ct.title || '')}</div><div class="small">${esc(ct.phone || '')}<br>${esc(ct.email || '')}</div><div class="row mt"><a class="btn sm" href="tel:${esc(String(ct.phone).replace(/\s/g, ''))}">${icon('phone')}</a><a class="btn sm" href="mailto:${esc(ct.email || '')}">${icon('mail')}</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/90${String(ct.phone).replace(/\D/g, '').replace(/^0/, '')}">${icon('message')}</a></div>` : ''}</div>
      <div class="card pad small"><div class="list-item"><span class="grow muted">Sorumlu</span><b>${esc(usr(d.owner).name)}</b></div><div class="list-item"><span class="grow muted">Kaynak</span>${esc(d.source || '-')}</div><div class="list-item"><span class="grow muted">Oluşturma</span>${NS.date(d.created)}</div>${d.lostReason ? `<div class="list-item"><span class="grow muted">Kayıp nedeni</span>${badge(d.lostReason, 'err')}</div>` : ''}</div>
      <div class="card"><div class="card-h"><h3>Teklifler</h3></div><div class="card-b">${db.all('quotes', (q) => q.deal === id).map((q) => `<div class="list-item small"><span class="grow">${esc(q.no)} · ${NS.date(q.date)}</span><b>${money(q.total)}</b><button class="btn sm icon ghost" data-pq="${q.id}">${icon('print')}</button></div>`).join('') || '<div class="faint small">Teklif yok</div>'}</div></div></div></div>`;
    on(el, 'click', '[data-mv]', (e, b) => moveStage(app, d, b.dataset.mv));
    $('#ed', el).onclick = () => dealForm(app, d);
    on(el, 'click', '[data-add]', async (e, b) => {
      const type = b.dataset.add;
      const v = await formModal({ title: ACT[type][0], fields: [{ name: 'text', label: 'Açıklama', type: 'textarea', required: true, full: true }, ...(type === 'gorev' ? [{ name: 'due', label: 'Son tarih', type: 'date', value: iso(addDays(new Date(), 2)) }] : [])] });
      if (!v) return;
      db.insert('activities', { deal: id, type, date: new Date().toISOString(), text: v.text, due: v.due || null, done: type !== 'gorev', owner: (NS.currentUser || {}).id }, true);
      d.lastActivity = new Date().toISOString(); db.save();
      // Görev ve toplantılar sorumlunun Google / Outlook takvimine düşer
      if (v.due && NS.integ && NS.integ.isOn('takvim')) NS.integ.call('takvim', 'etkinlik-ekle', { calendar: usr(d.owner).name, title: `${d.title || d.name || 'Fırsat'}: ${v.text.slice(0, 60)}`, start: `${v.due}T10:00`, minutes: 30 }, { silent: true });
      app.refresh();
    });
    on(el, 'change', '[data-done]', (e, b) => { db.update('activities', b.dataset.done, { done: b.checked }); });
    $('#qt', el).onclick = () => quoteModal(app, d);
    on(el, 'click', '[data-pq]', (e, b) => printQuote(db.get('quotes', b.dataset.pq)));
  }
  function quoteModal(app, d) {
    const lines = [{ name: d.title, qty: 1, price: d.value }];
    modal({
      title: 'Teklif hazırla', size: 'wide',
      body: `<div id="ql"></div><button class="btn sm mt" id="qa">${icon('plus')} Satır</button><div class="form-grid mt"><div class="field"><label>İskonto %</label><input class="input" type="number" id="qd" value="0"></div><div class="field"><label>Geçerlilik (gün)</label><input class="input" type="number" id="qv" value="15"></div><div class="field full"><label>Not</label><input class="input" id="qn" value="Fiyatlara KDV dahil değildir. Kurulum ve 1 yıl destek dahildir."></div></div><div class="right big mt" id="qt"></div>`,
      onOpen: (b) => {
        const draw = () => { $('#ql', b).innerHTML = lines.map((l, i) => `<div class="row nw mb"><input class="input" data-i="${i}" data-f="name" value="${esc(l.name)}"><input class="input" type="number" data-i="${i}" data-f="qty" value="${l.qty}" style="width:80px"><input class="input" type="number" data-i="${i}" data-f="price" value="${l.price}" style="width:130px"><button class="btn icon ghost" data-x="${i}">${icon('x')}</button></div>`).join(''); tot(); };
        const tot = () => { const g = sum(lines, (l) => l.qty * l.price); const disc = g * (Number($('#qd', b).value) || 0) / 100; $('#qt', b).textContent = `Toplam (KDV hariç): ${money(g - disc)}`; };
        on(b, 'input', '[data-i]', (e, x) => { const l = lines[x.dataset.i]; l[x.dataset.f] = x.dataset.f === 'name' ? x.value : Number(x.value) || 0; tot(); });
        on(b, 'click', '[data-x]', (e, x) => { lines.splice(x.dataset.x, 1); draw(); });
        $('#qa', b).onclick = () => { lines.push({ name: '', qty: 1, price: 0 }); draw(); };
        $('#qd', b).oninput = tot;
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet ve yazdır', cls: 'primary', icon: 'print', onClick: (c, b) => {
        const g = sum(lines, (l) => l.qty * l.price); const disc = Number($('#qd', b).value) || 0;
        const q = db.insert('quotes', { deal: d.id, no: db.nextNo('quotes', 'TKL-'), date: today(), valid: iso(addDays(new Date(), Number($('#qv', b).value) || 15)), lines: lines.filter((l) => l.name), disc, note: $('#qn', b).value, total: g * (1 - disc / 100) });
        if (['yeni', 'gorusme'].includes(d.stage)) { d.stage = 'teklif'; }
        d.lastActivity = new Date().toISOString();
        db.insert('activities', { deal: d.id, type: 'eposta', date: new Date().toISOString(), text: `Teklif ${q.no} gönderildi (${money(q.total)})`, owner: (NS.currentUser || {}).id, done: true });
        c(); printQuote(q); app.refresh();
      } }],
    });
  }
  function printQuote(q) {
    const d = db.get('deals', q.deal) || {}; const c = comp(d.company); const ct = ctc(d.contact);
    NS.printHtml(`<div class="doc"><table><tr><td><h2>${esc(S().bizName)}</h2></td><td style="text-align:right"><h2>TEKLİF</h2><div>${esc(q.no)} · ${NS.date(q.date)}</div><div>Geçerlilik: ${NS.date(q.valid)}</div></td></tr></table><hr><p><b>${esc(c.name)}</b><br>Sayın ${esc(ct.name)}${ct.title ? ', ' + esc(ct.title) : ''}</p><p>Konu: ${esc(d.title || '')}</p>
      <table><tr><th>Açıklama</th><th>Miktar</th><th style="text-align:right">Birim</th><th style="text-align:right">Tutar</th></tr>${q.lines.map((l) => `<tr><td>${esc(l.name)}</td><td>${l.qty}</td><td style="text-align:right">${money(l.price)}</td><td style="text-align:right">${money(l.qty * l.price)}</td></tr>`).join('')}${q.disc ? `<tr><td colspan="3" style="text-align:right">İskonto %${q.disc}</td><td style="text-align:right">-${money(sum(q.lines, (l) => l.qty * l.price) * q.disc / 100)}</td></tr>` : ''}<tr><td colspan="3" style="text-align:right"><b>TOPLAM (KDV hariç)</b></td><td style="text-align:right"><b>${money(q.total)}</b></td></tr></table><p><i>${esc(q.note || '')}</i></p><p style="margin-top:40px">Saygılarımızla,<br>${esc(usr(d.owner).name)}</p></div>`, { title: q.no });
  }

  function dashboard(el, p, app) {
    const ds = myDeals(); const open = ds.filter(isOpen);
    const mo = today().slice(0, 7);
    const wonM = ds.filter((d) => d.stage === 'kazanildi' && (d.closedAt || '').startsWith(mo));
    const closed90 = ds.filter((d) => !isOpen(d) && d.closedAt >= iso(addDays(new Date(), -90)));
    const winRate = closed90.length ? Math.round((closed90.filter((d) => d.stage === 'kazanildi').length / closed90.length) * 100) : 0;
    const tasks = db.all('activities', (a) => a.type === 'gorev' && !a.done && (!mine() || a.owner === mine())).sort((a, b) => a.due.localeCompare(b.due));
    const months = Array.from({ length: 4 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + i); return iso(d).slice(0, 7); });
    const target = S().target, won = sum(wonM, (d) => d.value);
    el.innerHTML = pageHead('Satış Panosu', NS.dateLong(new Date()), `<a class="btn" href="#/huni">${icon('kanban')} Huni</a><button class="btn primary" id="nd">${icon('plus')} Fırsat</button>`) + `
      <div class="grid g4 mb">${kpi('Bu ay kazanılan', money(won), 'award', 'ok', `<div class="progress mt"><i style="width:${Math.min(100, (won / target) * 100)}%;background:var(--ok)"></i></div><div class="small faint">Hedef ${money(target)} · %${Math.round((won / target) * 100)}</div>`)}${kpi('Açık huni', money(sum(open, (d) => d.value)), 'kanban', 'info', `<div class="small faint">${open.length} fırsat</div>`)}${kpi('Ağırlıklı tahmin', money(sum(open, weighted)), 'trend')}${kpi('Kazanma oranı (90 gün)', '%' + winRate, 'percent', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Aylara göre tahmini kapanış (ağırlıklı)</h3></div><div class="card-b">${chart.bars(months.map((m) => ({ label: NS.MONTHS[Number(m.slice(5)) - 1], value: sum(open.filter((d) => d.expected.startsWith(m)), weighted) })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('check')} Görevlerim (${tasks.length})</h3></div><div class="card-b" style="max-height:300px;overflow:auto">${tasks.map((t) => `<div class="list-item small"><input type="checkbox" data-done="${t.id}"><div class="grow"><a href="#/firsat/${t.deal}">${esc(t.text)}</a><div class="faint">${esc((db.get('deals', t.deal) || {}).title || '')}</div></div>${badge(NS.date(t.due), t.due < today() ? 'err' : t.due === today() ? 'warn' : '')}</div>`).join('') || '<div class="faint small">Bekleyen görev yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} 14+ gündür sessiz fırsatlar</h3></div>${table({ rows: open.filter(stale).sort((a, b) => b.value - a.value), empty: 'Yok', columns: [{ label: 'Fırsat', render: (d) => `<a href="#/firsat/${d.id}"><b>${esc(d.title)}</b></a><div class="small faint">${esc(comp(d.company).name)}</div>` }, { label: 'Tutar', cls: 'right', render: (d) => money(d.value) }, { label: 'Son temas', render: (d) => NS.ago(d.lastActivity) }] })}</div>
      <div class="card"><div class="card-h"><h3>Temsilci performansı (90 gün)</h3></div>${table({ rows: db.all('users').map((u) => ({ id: u.id, u, w: sum(closed90.filter((d) => d.owner === u.id && d.stage === 'kazanildi'), (d) => d.value), n: closed90.filter((d) => d.owner === u.id && d.stage === 'kazanildi').length, o: sum(open.filter((d) => d.owner === u.id), (d) => d.value) })), columns: [{ label: 'Temsilci', render: (r) => `<b>${esc(r.u.name)}</b>` }, { label: 'Kazanılan', cls: 'right', render: (r) => `${money(r.w)} <span class="faint small">(${r.n})</span>` }, { label: 'Açık huni', cls: 'right', render: (r) => money(r.o) }] })}</div></div>`;
    $('#nd', el).onclick = () => dealForm(app);
    on(el, 'change', '[data-done]', (e, b) => { db.update('activities', b.dataset.done, { done: true }); toast('Görev tamamlandı', 'ok'); app.refresh(); });
  }
  function companiesPage(el, p, app) {
    NS.crud(el, app, {
      col: 'companies', title: 'Firmalar', single: 'Firma', addLabel: 'Yeni firma', emptyIcon: 'building', sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      fields: [{ name: 'name', label: 'Firma adı', required: true, full: true }, { name: 'sector', label: 'Sektör' }, { name: 'city', label: 'Şehir' }, { name: 'phone', label: 'Telefon' }, { name: 'web', label: 'Web sitesi' }, { name: 'size', label: 'Çalışan sayısı', type: 'select', options: ['1-10', '10-50', '50-250', '250-1000', '1000+'] }],
      columns: [{ key: 'name', label: 'Firma', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.web || '')}</div>` }, { key: 'sector', label: 'Sektör' }, { key: 'city', label: 'Şehir' }, { label: 'Kişi', cls: 'right', render: (c) => db.all('contacts', (x) => x.company === c.id).length }, { label: 'Açık fırsat', cls: 'right', render: (c) => money(sum(db.all('deals', (d) => d.company === c.id && isOpen(d)), (d) => d.value)) }, { label: 'Kazanılan', cls: 'right', render: (c) => money(sum(db.all('deals', (d) => d.company === c.id && d.stage === 'kazanildi'), (d) => d.value)) }],
    });
  }
  function contactsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'contacts', title: 'Kişiler', single: 'Kişi', addLabel: 'Yeni kişi', emptyIcon: 'users', sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (c) => [c.name, c.email, c.phone, comp(c.company).name],
      fields: () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'company', label: 'Firma', type: 'select', options: db.all('companies').map((c) => ({ value: c.id, label: c.name })) }, { name: 'title', label: 'Ünvan' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }],
      columns: [{ key: 'name', label: 'Kişi', render: (c) => `<div class="row nw"><div class="avatar">${esc(NS.initials(c.name))}</div><div><b>${esc(c.name)}</b><div class="small faint">${esc(c.title || '')}</div></div></div>` }, { label: 'Firma', render: (c) => esc(comp(c.company).name) }, { key: 'phone', label: 'Telefon' }, { key: 'email', label: 'E-posta' }],
    });
  }
  function reportsPage(el) {
    const ds = db.all('deals'); const closed = ds.filter((d) => !isOpen(d));
    const bySrc = Object.entries(NS.groupBy(closed, (d) => d.source)).map(([k, v]) => ({ id: k, k, n: v.length, w: v.filter((d) => d.stage === 'kazanildi').length, val: sum(v.filter((d) => d.stage === 'kazanildi'), (d) => d.value) })).sort((a, b) => b.val - a.val);
    const lost = NS.groupBy(closed.filter((d) => d.stage === 'kaybedildi'), (d) => d.lostReason || 'Belirtilmedi');
    const won = closed.filter((d) => d.stage === 'kazanildi');
    const cycle = won.length ? Math.round(sum(won, (d) => daysBetween(d.created, d.closedAt)) / won.length) : 0;
    el.innerHTML = pageHead('Raporlar', 'Kaynak verimliliği, kayıp nedenleri ve satış döngüsü') + `
      <div class="grid g4 mb">${kpi('Kazanılan toplam', money(sum(won, (d) => d.value)), 'award', 'ok')}${kpi('Ortalama fırsat', money(won.length ? sum(won, (d) => d.value) / won.length : 0), 'wallet', 'info')}${kpi('Ort. satış döngüsü', cycle + ' gün', 'clock', 'warn')}${kpi('Kazanma oranı', '%' + (closed.length ? Math.round((won.length / closed.length) * 100) : 0), 'percent')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Kaynaklara göre</h3></div>${table({ rows: bySrc, columns: [{ label: 'Kaynak', render: (r) => `<b>${esc(r.k)}</b>` }, { label: 'Kapanan', cls: 'right', key: 'n' }, { label: 'Kazanma', cls: 'right', render: (r) => '%' + Math.round((r.w / r.n) * 100) }, { label: 'Kazanılan ₺', cls: 'right', render: (r) => money(r.val) }] })}</div>
      <div class="card"><div class="card-h"><h3>Kayıp nedenleri</h3></div><div class="card-b">${chart.donut(Object.entries(lost).map(([label, v]) => ({ label, value: v.length })), { size: 140 })}</div></div></div>`;
  }

  const ROLES = { admin: 'Satış müdürü', temsilci: 'Satış temsilcisi' };
  NS.shell({
    id: 'crm', integrations: ['email', 'sms', 'whatsapp', 'printer', 'efatura', 'webhook', 'backup'], name: 'CRM', tagline: 'Satış Hunisi & Müşteri İlişkileri', icon: 'kanban', accent: '#db2777', db, home: 'ozet', auth: { roles: ROLES }, titles: { firsat: 'Fırsat' },
    nav: [{ sec: 'Satış' }, { id: 'ozet', label: 'Satış Panosu', icon: 'home' }, { id: 'huni', label: 'Satış Hunisi', icon: 'kanban' }, { id: 'firmalar', label: 'Firmalar', icon: 'building' }, { id: 'kisiler', label: 'Kişiler', icon: 'users' }, { sec: 'Yönetim' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, huni: pipelinePage, firsat: dealPage, firmalar: companiesPage, kisiler: contactsPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Hedef' }, { name: 'target', label: 'Aylık satış hedefi (₺)', type: 'number' }] }) },
  });
})();
