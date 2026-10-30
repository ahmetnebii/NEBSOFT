/* NEBSOFT CRM — satış hunisi, fırsat, firma/kişi, aktivite/görev, teklif ve satış tahmini */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const STAGES = [{ id: 'yeni', name: 'Yeni fırsat', p: 10, color: '#64748b' }, { id: 'gorusme', name: 'Görüşme', p: 25, color: '#0284c7' }, { id: 'teklif', name: 'Teklif verildi', p: 50, color: '#7c3aed' }, { id: 'pazarlik', name: 'Pazarlık', p: 75, color: '#d97706' }, { id: 'kazanildi', name: 'Kazanıldı', p: 100, color: '#16a34a' }, { id: 'kaybedildi', name: 'Kaybedildi', p: 0, color: '#dc2626' }];
  const LOST = ['Fiyat yüksek', 'Rakip tercih edildi', 'Bütçe ertelendi', 'İhtiyaç değişti', 'Yanıt alınamadı', 'Diğer'];
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
  const ctcName = (id) => (db.get('contacts', id) || {}).name || 'Yetkili';
  // Demo: teklif aşamasındaki fırsatlara örnek teklifler (bir kez)
  if (!db.meta('demoQuotes')) {
    const T = window.CRMQ; let n = 0;
    db.all('deals', (d) => ['teklif', 'pazarlik', 'kazanildi', 'kaybedildi'].includes(d.stage)).slice(0, 14).forEach((d, i) => {
      const st0 = d.stage === 'kazanildi' ? 'kabul' : d.stage === 'kaybedildi' ? 'red' : 'gonderildi';
      const date = iso(addDays(new Date(), -(st0 === 'gonderildi' ? NS.rand(1, 9) : NS.rand(15, 40))));
      const lines = [{ name: d.title, qty: 1, price: Math.round(d.value * 0.8) }, { name: 'Kurulum ve eğitim', qty: 1, price: Math.round(d.value * 0.2) }];
      const st = d.stage === 'kazanildi' ? 'kabul' : d.stage === 'kaybedildi' ? 'red' : 'gonderildi';
      const k = T.calc({ lines, disc: 0, vat: 20 });
      db.data.quotes.push({ id: NS.uid(), deal: d.id, no: 'TKL-' + (2001 + n++), rev: 1, date, valid: iso(addDays(new Date(date), 15)), lines, disc: 0, vat: 20, payment: 'Sipariş onayında %50, teslimde %50', note: 'Kurulum ve 1 yıl destek dahildir.', total: k.net, grand: k.grand, status: st, token: T.token(), owner: d.owner, viewedAt: st !== 'gonderildi' || i % 2 ? addDays(new Date(date), 1).toISOString() : null, respondedAt: st === 'gonderildi' ? null : addDays(new Date(date), 3).toISOString(), signer: st === 'kabul' ? ctcName(d.contact) : null, rejectReason: st === 'red' ? (d.lostReason || 'Fiyat yüksek') : null });
    });
    db.data._meta._seq_quotes = 2000 + n;
    db.meta('demoQuotes', 1);
  }
  const S = () => db.settings({ target: 2000000 });
  // Binlerce kayıtta tek çizim için kimlik dizini (bir sonraki adımda yenilenir)
  const index = (col) => { let m = null; return (id) => { if (!m) { m = new Map(db.all(col).map((x) => [x.id, x])); setTimeout(() => { m = null; }, 0); } return m.get(id); }; };
  const compIx = index('companies'); const comp = (id) => compIx(id) || { name: '-' };
  const ctc = (id) => db.get('contacts', id) || { name: '-' };
  const usr = (id) => db.get('users', id) || { name: '-' };
  const stage = (id) => STAGES.find((s) => s.id === id) || STAGES[0];
  const mine = () => (NS.currentUser && NS.currentUser.role === 'temsilci' ? NS.currentUser.id : null);
  const myDeals = () => db.all('deals', (d) => !mine() || d.owner === mine());
  const isOpen = (d) => !['kazanildi', 'kaybedildi'].includes(d.stage);
  const weighted = (d) => (d.value * stage(d.stage).p) / 100;
  const stale = (d) => isOpen(d) && daysBetween(d.lastActivity || d.created, new Date()) > 14;
  const canSee = (d) => !mine() || d.owner === mine();
  const touch = (dealId) => { const d = db.get('deals', dealId); if (d) d.lastActivity = new Date().toISOString(); };
  const dueCmp = (a, b) => String(a.due || '9').localeCompare(String(b.due || '9'));

  async function dealForm(app, rec = {}) {
    const v = await formModal({ title: rec.id ? 'Fırsatı düzenle' : 'Yeni fırsat', size: 'wide', fields: [{ name: 'title', label: 'Fırsat adı', required: true, full: true }, { name: 'company', label: 'Firma', type: 'select', options: db.all('companies').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => ({ value: c.id, label: c.name })) }, { name: 'contact', label: 'Yetkili', type: 'select', empty: '-', options: db.all('contacts').map((c) => ({ value: c.id, label: `${c.name} (${comp(c.company).name})` })) }, { name: 'value', label: 'Tutar (₺)', type: 'number', required: true }, { name: 'stage', label: 'Aşama', type: 'select', options: STAGES.map((s) => ({ value: s.id, label: s.name })) }, { name: 'expected', label: 'Tahmini kapanış', type: 'date' }, { name: 'owner', label: 'Sorumlu', type: 'select', options: db.all('users').map((u) => ({ value: u.id, label: u.name })) }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Web formu', 'Referans', 'Fuar', 'Soğuk arama', 'LinkedIn', 'Mevcut müşteri'] }, { name: 'lostReason', label: 'Kayıp nedeni (kaybedildiyse)', type: 'select', empty: '-', options: LOST }], values: { stage: 'yeni', expected: iso(addDays(new Date(), 30)), owner: (NS.currentUser || {}).id, ...rec },
      // Yetkili listesi seçilen firmayla sınırlıdır: başka firmanın kişisi fırsata bağlanmasın
      onOpen: (b) => { const f = $('[name=company]', b); const k = $('[name=contact]', b); const fill = () => { const cur = k.value; k.innerHTML = `<option value="">-</option>${db.all('contacts', (c) => c.company === f.value).map((c) => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}`; }; f.onchange = fill; fill(); } });
    if (!v) return;
    v.value = Number(v.value) || 0; if (v.value < 0) return toast('Tutar negatif olamaz', 'err'); if (v.stage === 'kaybedildi' && !v.lostReason) return toast('Kayıp nedenini seçin', 'err');
    Object.assign(v, closing(rec, v.stage));
    if (rec.id) db.update('deals', rec.id, { ...v, lastActivity: new Date().toISOString() }); else { const d = db.insert('deals', { ...v, lastActivity: new Date().toISOString() }); db.log('Yeni fırsat', d.title); }
    toast('Kaydedildi', 'ok'); app.refresh();
  }
  // Kapanış bilgisi: kapanınca tarih yazılır, yeniden açılınca kapanış ve kayıp nedeni silinir (raporlar kapalı saymasın)
  const closing = (d, to) => { const cl = ['kazanildi', 'kaybedildi']; if (cl.includes(to)) return d.stage === to && d.closedAt ? {} : { closedAt: today(), ...(to === 'kazanildi' ? { lostReason: '' } : {}) }; return { closedAt: null, lostReason: '' }; };
  async function moveStage(app, d, to) {
    if (d.stage === to) return;
    if (to === 'kaybedildi') { const v = await formModal({ title: 'Fırsat kaybedildi', fields: [{ name: 'why', label: 'Kayıp nedeni', type: 'select', options: LOST, required: true }, { name: 'note', label: 'Açıklama', full: true }] }); if (!v) return app.refresh(); d.lostReason = v.why; if (v.note) db.insert('activities', { deal: d.id, type: 'not', date: new Date().toISOString(), text: `Kayıp notu: ${v.note}`, owner: (NS.currentUser || {}).id, done: true }, true); }
    const was = d.lostReason; Object.assign(d, closing(d, to)); if (to === 'kaybedildi') d.lostReason = was;
    d.stage = to; d.lastActivity = new Date().toISOString();
    db.insert('activities', { deal: d.id, type: 'not', date: new Date().toISOString(), text: `Aşama değişti: ${stage(to).name}`, owner: (NS.currentUser || {}).id, done: true }, true);
    db.save(); if (to === 'kazanildi') { toast(`🎉 ${d.title} kazanıldı: ${money(d.value)}`, 'ok'); NS.beep(1500, 200); } app.refresh();
  }

  function pipelinePage(el, p, app) {
    let q = '', own = '';
    const draw = () => {
      const list = myDeals().filter((d) => (!own || d.owner === own) && NS.match(q, d.title, comp(d.company).name));
      const open = list.filter(isOpen);
      el.innerHTML = pageHead('Satış Hunisi', `${open.length} açık fırsat · ${money(sum(open, (d) => d.value))} · ağırlıklı ${money(sum(open, weighted))}`, `${NS.searchBox('q', 'Fırsat veya firma...', q)}${mine() ? '' : `<select class="input" id="own" style="max-width:180px"><option value="">Tüm temsilciler</option>${db.all('users').map((u) => `<option value="${u.id}" ${own === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`}<button class="btn primary" id="nd">${icon('plus')} Fırsat</button>`) +
        `<div class="pipe">${STAGES.map((s) => { const ds = list.filter((d) => d.stage === s.id).filter((d) => isOpen(d) || (d.closedAt || '') >= iso(addDays(new Date(), -30))).sort((a, b) => b.value - a.value); const more = ds.length - 100; return `<div class="stage" data-st="${s.id}"><h4 style="color:${s.color}"><span class="dot" style="background:${s.color}"></span>${s.name} <span class="badge">${ds.length}</span></h4><div class="sum">${money(sum(ds, (d) => d.value))}${s.p && s.p < 100 ? ` · %${s.p}` : ''}${!isOpen({ stage: s.id }) ? ' · son 30 gün' : ''}</div>${ds.slice(0, 100).map((d) => `<div class="deal ${stale(d) ? 'stale' : ''}" draggable="true" data-d="${d.id}"><b>${esc(d.title)}</b><span class="small muted">${esc(comp(d.company).name)}</span><div class="v">${money(d.value)}</div><div class="row between small faint"><span>${esc(usr(d.owner).name.split(' ')[0])}</span><span>${stale(d) ? '⚠ ' + daysBetween(d.lastActivity || d.created, new Date()) + ' gündür sessiz' : d.expected ? NS.date(d.expected) : ''}</span></div></div>`).join('')}${more > 0 ? `<div class="small faint" style="padding:6px">+${more} fırsat daha — aramayla daraltın</div>` : ''}</div>`; }).join('')}</div>`;
      $('#q', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#q', el); i.focus(); i.setSelectionRange(pos, pos); };
      if ($('#own', el)) $('#own', el).onchange = (e) => { own = e.target.value; draw(); };
      $('#nd', el).onclick = () => dealForm(app);
      $('#nd', el).insertAdjacentHTML('beforebegin', `<button class="btn" id="cid">${icon('phone')} Gelen çağrı</button>`);
      // Arayan numara: kişi ve firması bulunur, açık fırsatlar listelenir, görüşme notu tek tıkla eklenir
      $('#cid', el).onclick = async () => {
        let phone = '';
        if (NS.integ && NS.integ.isOn('callerid')) { const r = await NS.integ.call('callerid', 'son-arama', {}, { silent: true }); phone = r && !r.simulated && r.data && r.data.phone ? r.data.phone : ''; if (r && r.simulated) toast('Arayan numara TEST — santral bağlı değil (simülasyon)', 'warn'); }
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
    const d = db.get('deals', id); if (!d || !canSee(d)) return app.go('huni');
    const acts = db.all('activities', (a) => a.deal === id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const c = comp(d.company), ct = ctc(d.contact), s = stage(d.stage);
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/huni">${icon('back')} Huni</a><h1 class="grow">${esc(d.title)}</h1><button class="btn" id="qt">${icon('file')} Teklif hazırla</button><button class="btn" id="ed">${icon('edit')} Düzenle</button></div>
      <div class="card pad mb"><div class="row">${STAGES.map((x) => `<button class="btn sm ${x.id === d.stage ? '' : 'ghost'}" data-mv="${x.id}" style="${x.id === d.stage ? `background:${x.color};color:#fff;border-color:${x.color}` : ''}">${x.name}</button>`).join(icon('right'))}</div></div>
      <div class="grid g4 mb">${kpi('Tutar', money(d.value), 'wallet')}${kpi('Olasılık', '%' + s.p, 'percent', 'info')}${kpi('Ağırlıklı', money(weighted(d)), 'trend', 'ok')}${kpi('Tahmini kapanış', d.expected ? NS.date(d.expected) : '—', 'calendar', d.expected && d.expected < today() && isOpen(d) ? 'err' : 'warn')}</div>
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Aktiviteler</h3>${Object.entries(ACT).map(([k, v]) => `<button class="btn sm" data-add="${k}">${icon(v[1])} ${v[0]}</button>`).join('')}</div><div class="card-b">${acts.map((a) => `<div class="act"><div class="ai">${icon(ACT[a.type][1])}</div><div class="grow"><div class="row between"><b>${ACT[a.type][0]}</b><span class="small faint">${NS.dt(a.date)} · ${esc(usr(a.owner).name)}</span></div><div>${esc(a.text)}</div>${a.type === 'gorev' ? `<label class="check small mt"><input type="checkbox" data-done="${a.id}" ${a.done ? 'checked' : ''}> Tamamlandı${a.due ? ` · son tarih ${NS.date(a.due)}` : ''}</label>` : ''}</div></div>`).join('') || '<div class="faint small">Aktivite yok</div>'}</div></div>
      <div class="col" style="gap:16px"><div class="card pad"><h3 class="mb">${icon('building')} ${esc(c.name)}</h3><div class="small muted">${esc(c.sector || '')} · ${esc(c.city || '')} · ${esc(c.size || '')} çalışan</div><div class="small mt">${esc(c.phone || '')} · ${esc(c.web || '')}</div>${ct.name !== '-' ? `<hr><b>${esc(ct.name)}</b><div class="small muted">${esc(ct.title || '')}</div><div class="small">${esc(ct.phone || '')}<br>${esc(ct.email || '')}</div><div class="row mt"><a class="btn sm" href="tel:${esc(String(ct.phone).replace(/\s/g, ''))}">${icon('phone')}</a><a class="btn sm" href="mailto:${esc(ct.email || '')}">${icon('mail')}</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/90${String(ct.phone).replace(/\D/g, '').replace(/^0/, '')}">${icon('message')}</a></div>` : ''}</div>
      <div class="card pad small"><div class="list-item"><span class="grow muted">Sorumlu</span><b>${esc(usr(d.owner).name)}</b></div><div class="list-item"><span class="grow muted">Kaynak</span>${esc(d.source || '-')}</div><div class="list-item"><span class="grow muted">Oluşturma</span>${NS.date(d.created)}</div>${d.lostReason ? `<div class="list-item"><span class="grow muted">Kayıp nedeni</span>${badge(d.lostReason, 'err')}</div>` : ''}</div>
      <div class="card"><div class="card-h"><h3>Teklifler</h3></div><div class="card-b">${db.all('quotes', (q) => q.deal === id).map((q) => { const st = Q.status(q); return `<div class="list-item small"><span class="grow"><b class="mono">${esc(q.no)}</b> · ${NS.date(q.date)}<br>${badge(Q.STATUS[st][0], Q.STATUS[st][1])}${q.viewedAt && st === 'gonderildi' ? ` <span class="faint">görüntülendi</span>` : ''}</span><b>${money(Q.calc(q).grand)}</b><button class="btn sm icon ghost" data-sq="${q.id}" aria-label="Gönder">${icon('send')}</button><button class="btn sm icon ghost" data-pq="${q.id}" aria-label="Yazdır">${icon('print')}</button></div>`; }).join('') || '<div class="faint small">Teklif yok</div>'}</div></div></div></div>`;
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
    on(el, 'change', '[data-done]', (e, b) => { db.update('activities', b.dataset.done, { done: b.checked, doneAt: b.checked ? new Date().toISOString() : null }); touch(id); db.save(); });
    $('#qt', el).onclick = () => quoteModal(app, d);
    on(el, 'click', '[data-pq]', (e, b) => printQuote(db.get('quotes', b.dataset.pq)));
    on(el, 'click', '[data-sq]', (e, b) => shareQuote(db.get('quotes', b.dataset.sq)));
  }
  const Q = window.CRMQ;
  const quoteUrl = (q) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'teklif.html?t=' + q.token;
  // Teklif: satırlar, iskonto, KDV; revize edilen teklifin yerine yeni sürüm açılır
  function quoteModal(app, d, from) {
    const lines = from ? from.lines.map((l) => ({ ...l })) : [{ name: d.title, qty: 1, price: d.value }];
    modal({
      title: from ? `Teklifi revize et — ${from.no}` : 'Teklif hazırla', size: 'wide',
      body: `<div class="row nw small muted mb" style="gap:8px"><span class="grow">Açıklama</span><span style="width:80px">Miktar</span><span style="width:130px">Birim fiyat</span><span style="width:36px"></span></div><div id="ql"></div><button class="btn sm" id="qa">${icon('plus')} Satır</button>
        <div class="form-grid mt"><div class="field"><label>İskonto %</label><input class="input" type="number" id="qd" value="${from ? from.disc || 0 : 0}" min="0" max="100" step="0.01"></div><div class="field"><label>KDV</label><select class="input" id="qk">${[20, 10, 1, 0].map((v) => `<option value="${v}" ${(from ? Q.calc(from).vat : 20) === v ? 'selected' : ''}>%${v}</option>`).join('')}</select></div><div class="field"><label>Geçerlilik (gün)</label><input class="input" type="number" id="qv" value="15"></div><div class="field"><label>Ödeme</label><input class="input" id="qp" value="${esc(from ? from.payment || '' : 'Sipariş onayında %50, teslimde %50')}"></div><div class="field full"><label>Not</label><input class="input" id="qn" value="${esc(from ? from.note || '' : 'Kurulum ve 1 yıl destek dahildir.')}"></div></div>
        <div class="card pad mt" id="qt"></div>`,
      onOpen: (b) => {
        const draw = () => { $('#ql', b).innerHTML = lines.map((l, i) => `<div class="row nw mb" style="gap:8px"><input class="input grow" data-i="${i}" data-f="name" value="${esc(l.name)}" placeholder="Ürün / hizmet"><input class="input" type="number" data-i="${i}" data-f="qty" value="${l.qty}" style="width:80px" min="0"><input class="input" type="number" data-i="${i}" data-f="price" value="${l.price}" style="width:130px" min="0"><button class="btn icon ghost" data-x="${i}" aria-label="Satırı sil">${icon('x')}</button></div>`).join(''); tot(); };
        const tot = () => { const c = Q.calc({ lines, disc: $('#qd', b).value, vat: $('#qk', b).value }); $('#qt', b).innerHTML = `<div class="row between small"><span>Ara toplam</span><span>${money(c.gross)}</span></div>${c.disc ? `<div class="row between small"><span>İskonto</span><span>−${money(c.disc)}</span></div>` : ''}<div class="row between small"><span>KDV %${c.vat}</span><span>${money(c.vatAmt)}</span></div><div class="row between mt"><b>Genel toplam</b><b style="font-size:20px">${money(c.grand)}</b></div>`; };
        on(b, 'input', '[data-i]', (e, x) => { const l = lines[x.dataset.i]; l[x.dataset.f] = x.dataset.f === 'name' ? x.value : Number(x.value) || 0; tot(); });
        on(b, 'click', '[data-x]', (e, x) => { lines.splice(x.dataset.x, 1); draw(); });
        $('#qa', b).onclick = () => { lines.push({ name: '', qty: 1, price: 0 }); draw(); };
        $('#qd', b).oninput = tot; $('#qk', b).onchange = tot;
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet ve gönder', cls: 'primary', icon: 'send', onClick: (c, b) => {
        const ls = lines.filter((l) => l.name && l.qty > 0); if (!ls.length) return toast('En az bir satır girin', 'err'); const dv = Number($('#qd', b).value) || 0; if (dv < 0 || dv > 100) return toast('İskonto 0 ile 100 arasında olmalı', 'err'); if (ls.some((l) => l.price < 0)) return toast('Fiyat negatif olamaz', 'err');
        const base = { lines: ls, disc: dv, vat: Number($('#qk', b).value) };
        const k = Q.calc(base);
        const rev = from ? (from.rev || 1) + 1 : 1;
        const q = db.insert('quotes', { deal: d.id, no: from ? `${from.no.split('/')[0]}/R${rev}` : db.nextNo('quotes', 'TKL-'), rev, date: today(), valid: iso(addDays(new Date(), Number($('#qv', b).value) || 15)), ...base, payment: $('#qp', b).value, note: $('#qn', b).value, total: k.net, grand: k.grand, status: 'gonderildi', token: Q.token(), owner: (NS.currentUser || {}).id }, true);
        db.all('quotes', (x) => x.id !== q.id && x.deal === d.id && Q.status(x) === 'gonderildi').forEach((x) => { x.status = 'revize'; }); if (from) from.status = 'revize';
        if (['yeni', 'gorusme'].includes(d.stage)) d.stage = 'teklif';
        d.lastActivity = new Date().toISOString();
        db.insert('activities', { deal: d.id, type: 'eposta', date: new Date().toISOString(), text: `Teklif ${q.no} gönderildi (${money(k.grand)} KDV dahil)`, owner: (NS.currentUser || {}).id, done: true }, true);
        db.save(); c(); shareQuote(q); app.refresh();
      } }],
    });
  }
  function shareQuote(q) {
    const d = db.get('deals', q.deal) || {}; const ct = ctc(d.contact); const u = quoteUrl(q); const k = Q.calc(q);
    const msg = `Sayın ${ct.name || 'Yetkili'}, ${d.title || ''} için ${q.no} numaralı teklifimizi (${money(k.grand)} KDV dahil) aşağıdaki bağlantıdan inceleyip onaylayabilirsiniz:\n${u}\n\n${S().bizName}`;
    modal({ title: `${q.no} — müşteriye gönder`, body: `<p class="small muted">Müşteri bağlantıyı açtığında teklifi görür, tek tıkla kabul veya red eder; yanıt fırsata işlenir.</p><div class="row nw"><input class="input mono grow" value="${esc(u)}" readonly id="qu"><button class="btn" id="cp">${icon('copy')} Kopyala</button></div>
      <div class="row mt" style="gap:8px"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${String(ct.phone || '').replace(/\D/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}">${icon('message')} WhatsApp</a><a class="btn" href="mailto:${esc(ct.email || '')}?subject=${encodeURIComponent(`${S().bizName} teklifi ${q.no}`)}&body=${encodeURIComponent(msg)}">${icon('mail')} E-posta</a><a class="btn" target="_blank" rel="noopener" href="${esc(u)}">${icon('eye')} Önizle</a><button class="btn" id="pp">${icon('print')} PDF / yazdır</button></div>`,
      onOpen: (b) => { $('#cp', b).onclick = async () => { try { await navigator.clipboard.writeText(u); toast('Bağlantı kopyalandı', 'ok'); } catch (e) { $('#qu', b).select(); } }; $('#pp', b).onclick = () => printQuote(q); } });
  }
  const quoteDoc = (q) => { const d = db.get('deals', q.deal) || {}; const c = comp(d.company); const ct = ctc(d.contact); const k = Q.calc(q); return { title: 'Teklif', no: q.no, date: q.date, party: { title: 'Sayın', name: c.name, lines: [ct.name !== '-' ? `${ct.name}${ct.title ? ', ' + ct.title : ''}` : ''] }, info: [['Konu', d.title || ''], ['Geçerlilik', NS.date(q.valid)], ['Ödeme', q.payment || ''], ['Hazırlayan', usr(d.owner).name]], lines: q.lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price, total: l.qty * l.price })), totals: [['Ara toplam', k.gross], ...(k.disc ? [[`İskonto %${q.disc}`, -k.disc]] : []), [`KDV %${k.vat}`, k.vatAmt], ['Genel toplam', k.grand, true]], note: [q.note, q.status === 'kabul' && q.signer ? `Müşteri onayı: ${q.signer} · ${NS.dt(q.respondedAt)}` : ''].filter(Boolean).join('\n') }; };
  const printQuote = (q) => NS.docs.print('teklif', quoteDoc(q));
  if (NS.docs) NS.docs.define('crm', 'teklif', { label: 'Teklif', sample: () => { const q = db.all('quotes')[0]; return q ? quoteDoc(q) : {}; } });
  // Teklif yanıtı (müşteri sayfası veya temsilci): kabul fırsatı kazandırır
  function respond(app, q, st, reason) {
    const d = db.get('deals', q.deal);
    q.status = st; q.respondedAt = new Date().toISOString(); if (reason) q.rejectReason = reason;
    if (d) {
      db.insert('activities', { deal: d.id, type: 'not', date: q.respondedAt, text: st === 'kabul' ? `Teklif ${q.no} kabul edildi` : `Teklif ${q.no} reddedildi${reason ? ': ' + reason : ''}`, owner: (NS.currentUser || {}).id, done: true }, true);
      d.lastActivity = q.respondedAt;
      if (st === 'kabul') Q.closeOthers(db.all('quotes'), q);
      if (st === 'kabul' && isOpen(d)) { Object.assign(d, closing(d, 'kazanildi')); d.stage = 'kazanildi'; d.value = q.total; }
      if (st === 'red' && d.stage === 'teklif') d.stage = 'pazarlik';
    }
    db.save(); app.refresh();
  }

  function quotesPage(el, p, app) {
    let flt = 'bekleyen', q = '';
    const draw = () => {
      db.load();
      const all = db.all('quotes', (x) => !mine() || (db.get('deals', x.deal) || {}).owner === mine()).sort((a, b) => String(b.date + b.no).localeCompare(a.date + a.no));
      const F = { bekleyen: (x) => Q.status(x) === 'gonderildi', kabul: (x) => Q.status(x) === 'kabul', red: (x) => Q.status(x) === 'red', suresi: (x) => Q.status(x) === 'suresi', all: () => true };
      const rows = all.filter(F[flt]).filter((x) => { const d = db.get('deals', x.deal) || {}; return NS.match(q, x.no, d.title, comp(d.company).name); });
      const pend = all.filter(F.bekleyen), acc = all.filter((x) => Q.status(x) === 'kabul' && (x.respondedAt || '').slice(0, 7) === today().slice(0, 7));
      const decided = all.filter((x) => ['kabul', 'red'].includes(Q.status(x)));
      $('#tb', el).innerHTML = `<div class="grid g4 mb">${kpi(`Yanıt bekleyen (${pend.length})`, money(sum(pend, (x) => Q.calc(x).grand)), 'clock', 'warn')}${kpi('Bu ay kabul edilen', money(sum(acc, (x) => Q.calc(x).grand)), 'check', 'ok')}${kpi('Kabul oranı', '%' + (decided.length ? Math.round((decided.filter((x) => x.status === 'kabul').length / decided.length) * 100) : 0), 'percent', 'info')}${kpi('Görüntülenip yanıtlanmayan', pend.filter((x) => x.viewedAt).length, 'eye')}</div>
        <div class="card"><div class="card-h">${NS.searchBox('qq', 'Teklif no, fırsat, firma...', q)}<div class="seg">${[['bekleyen', 'Bekleyen'], ['kabul', 'Kabul'], ['red', 'Red'], ['suresi', 'Süresi dolan'], ['all', 'Tümü']].map(([k, l]) => `<button data-qf="${k}" class="${flt === k ? 'active' : ''}">${l}</button>`).join('')}</div></div>
        ${table({ rows, empty: 'Teklif yok', emptyIcon: 'file', columns: [
          { label: 'Teklif', render: (x) => `<b class="mono">${esc(x.no)}</b><div class="small faint">${NS.date(x.date)} · geçerli ${NS.date(x.valid)}</div>` },
          { label: 'Fırsat / firma', render: (x) => { const d = db.get('deals', x.deal) || {}; return `<a href="#/firsat/${d.id}"><b>${esc(d.title || '-')}</b></a><div class="small faint">${esc(comp(d.company).name)}</div>`; } },
          { label: 'Tutar', cls: 'right', render: (x) => `<b>${money(Q.calc(x).grand)}</b><div class="small faint">KDV hariç ${money(Q.calc(x).net)}</div>` },
          { label: 'Durum', render: (x) => { const st = Q.status(x); return `${badge(Q.STATUS[st][0], Q.STATUS[st][1])}${x.viewedAt && st === 'gonderildi' ? `<div class="small faint">${icon('eye')} ${NS.ago(x.viewedAt)} görüntülendi</div>` : ''}${st === 'kabul' && x.signer ? `<div class="small faint">${esc(x.signer)} · ${NS.date(x.respondedAt)}</div>` : ''}${st === 'red' && x.rejectReason ? `<div class="small" style="color:var(--err)">${esc(x.rejectReason)}</div>` : ''}`; } },
        ], actions: [{ icon: 'send', act: 'share', title: 'Bağlantı / gönder' }, { icon: 'print', act: 'print', title: 'Yazdır' }, { icon: 'edit', act: 'rev', title: 'Revize et' }, { icon: 'check', act: 'ok', title: 'Kabul edildi olarak işaretle' }, { icon: 'x', act: 'no', title: 'Reddedildi olarak işaretle' }] })}</div>`;
      $('#qq', el).oninput = (e) => { q = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#qq', el); i.focus(); i.setSelectionRange(pos, pos); };
    };
    el.innerHTML = pageHead('Teklifler', 'Tüm teklifler, müşteri yanıtları ve online onay durumu') + '<div id="tb"></div>';
    on(el, 'click', '[data-qf]', (e, b) => { flt = b.dataset.qf; draw(); });
    on(el, 'click', '[data-act]', async (e, b) => {
      const x = db.get('quotes', b.dataset.id); const d = db.get('deals', x.deal);
      if (['ok', 'no'].includes(b.dataset.act) && !['gonderildi', 'suresi'].includes(Q.status(x))) return toast(`Bu teklif ${Q.STATUS[Q.status(x)][0].toLocaleLowerCase('tr-TR')}; değiştirilemez`, 'err');
      if (b.dataset.act === 'rev' && Q.status(x) === 'kabul') return toast('Kabul edilen teklif revize edilemez', 'err');
      if (b.dataset.act === 'share') shareQuote(x);
      else if (b.dataset.act === 'print') printQuote(x);
      else if (b.dataset.act === 'rev') { if (!d) return; quoteModal(app, d, x); }
      else if (b.dataset.act === 'ok') { if (await confirm(`${x.no} kabul edildi olarak işaretlensin mi? Fırsat kazanıldı olarak kapanır.`, { ok: 'Kabul edildi', danger: false })) { x.signer = (NS.currentUser || {}).name + ' (temsilci girişi)'; respond(app, x, 'kabul'); toast('Teklif kabul edildi, fırsat kazanıldı', 'ok'); } }
      else if (b.dataset.act === 'no') { const r = await NS.prompt('Red nedeni', 'Fiyat yüksek', { title: `${x.no} reddedildi` }); if (r !== null) respond(app, x, 'red', r); }
    });
    draw();
  }

  // Görevler: gecikmiş, bugün, bu hafta, sonra
  function tasksPage(el, p, app) {
    let own = mine() || (NS.currentUser || {}).id || '';
    const draw = () => {
      db.load();
      const t0 = today(), wk = iso(addDays(new Date(), 7));
      const all = db.all('activities', (a) => a.type === 'gorev' && (!own || a.owner === own));
      const open = all.filter((a) => !a.done).sort(dueCmp);
      const G = [['Gecikmiş', open.filter((a) => a.due && a.due < t0), 'err'], ['Bugün', open.filter((a) => a.due === t0), 'warn'], ['Bu hafta', open.filter((a) => a.due > t0 && a.due <= wk), 'info'], ['Daha sonra / tarihsiz', open.filter((a) => !a.due || a.due > wk), '']];
      const doneRecent = all.filter((a) => a.done).sort((a, b) => String(b.doneAt || b.date).localeCompare(String(a.doneAt || a.date))).slice(0, 8);
      const feed = db.all('activities', (a) => a.type !== 'gorev' && (!own || a.owner === own)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
      const item = (a) => { const d = db.get('deals', a.deal) || {}; return `<div class="list-item"><input type="checkbox" data-tdone="${a.id}" aria-label="Tamamlandı"><div class="grow"><b>${esc(a.text)}</b><div class="small muted"><a href="#/firsat/${d.id}">${esc(d.title || '-')}</a> · ${esc(comp(d.company).name)}${own ? '' : ' · ' + esc(usr(a.owner).name)}</div></div><span class="small ${a.due && a.due < t0 ? '' : 'muted'}" style="${a.due && a.due < t0 ? 'color:var(--err);font-weight:600' : ''}">${a.due ? NS.date(a.due) : '—'}</span></div>`; };
      el.innerHTML = pageHead('Görevler', `${open.length} açık görev${G[0][1].length ? ` · ${G[0][1].length} gecikmiş` : ''}`, `${mine() ? '' : `<select class="input" id="ow" style="width:auto"><option value="">Tüm ekip</option>${db.all('users').map((u) => `<option value="${u.id}" ${own === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`}<button class="btn primary" id="nt">${icon('plus')} Görev</button>`) + `
        <div class="grid g-21"><div>${G.map(([t, list, c]) => `<div class="card mb"><div class="card-h"><h3>${t}</h3>${list.length ? badge(String(list.length), c) : ''}</div><div class="card-b">${list.map(item).join('') || '<div class="faint small">Yok</div>'}</div></div>`).join('')}</div>
        <div><div class="card mb"><div class="card-h"><h3>Son aktiviteler</h3></div><div class="card-b">${feed.map((a) => { const d = db.get('deals', a.deal) || {}; return `<div class="act"><div class="ai">${icon(ACT[a.type][1])}</div><div class="grow small"><b>${esc(ACT[a.type][0])}</b> · <a href="#/firsat/${d.id}">${esc(d.title || '-')}</a><div>${esc(a.text)}</div><div class="faint">${NS.ago(a.date)} · ${esc(usr(a.owner).name)}</div></div></div>`; }).join('') || '<div class="faint small">Aktivite yok</div>'}</div></div>
          <div class="card"><div class="card-h"><h3>Son tamamlananlar</h3></div><div class="card-b">${doneRecent.map((a) => `<div class="list-item small"><span style="color:var(--ok)">${icon('check')}</span><span class="grow" style="text-decoration:line-through;color:var(--text-3)">${esc(a.text)}</span></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div></div>`;
      if ($('#ow', el)) $('#ow', el).onchange = (e) => { own = e.target.value; draw(); };
      $('#nt', el).onclick = async () => {
        const v = await formModal({ title: 'Yeni görev', fields: [{ name: 'deal', label: 'Fırsat', type: 'select', options: myDeals().filter(isOpen).map((d) => ({ value: d.id, label: `${d.title} — ${comp(d.company).name}` })) }, { name: 'text', label: 'Görev', required: true, full: true }, { name: 'due', label: 'Son tarih', type: 'date', value: iso(addDays(new Date(), 1)) }, { name: 'owner', label: 'Sorumlu', type: 'select', options: db.all('users').map((u) => ({ value: u.id, label: u.name })) }], values: { owner: own || (NS.currentUser || {}).id } });
        if (!v) return; if (!v.deal) return toast('Fırsat seçin', 'err'); db.insert('activities', { ...v, type: 'gorev', date: new Date().toISOString(), done: false }, true); touch(v.deal); db.save(); toast('Görev eklendi', 'ok'); draw();
      };
    };
    on(el, 'change', '[data-tdone]', (e, b) => { const a = db.update('activities', b.dataset.tdone, { done: true, doneAt: new Date().toISOString() }); touch((a || db.get('activities', b.dataset.tdone)).deal); db.save(); toast('Görev tamamlandı', 'ok'); draw(); });
    draw();
  }

  // Firma 360°: kişiler, fırsatlar, teklifler ve tüm temas geçmişi
  function companyPage(el, id, app) {
    const c = db.get('companies', id); if (!c) return app.go('firmalar');
    const deals = myDeals().filter((d) => d.company === id).sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));
    const ids = deals.map((d) => d.id);
    const acts = db.all('activities', (a) => ids.includes(a.deal)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const quotes = db.all('quotes', (q) => ids.includes(q.deal));
    const won = deals.filter((d) => d.stage === 'kazanildi'), open = deals.filter(isOpen);
    const last = acts[0];
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/firmalar">${icon('back')} Firmalar</a><div class="avatar lg">${esc(NS.initials(c.name))}</div><div class="grow"><h1 style="margin:0">${esc(c.name)}</h1><div class="small muted">${esc([c.sector, c.city, c.size ? c.size + ' çalışan' : ''].filter(Boolean).join(' · '))}</div></div>${c.phone ? `<a class="btn" href="tel:${esc(String(c.phone).replace(/\s/g, ''))}">${icon('phone')} Ara</a>` : ''}${c.web ? `<a class="btn" target="_blank" rel="noopener" href="https://${esc(String(c.web).replace(/^https?:\/\//, ''))}">${icon('globe')} Web</a>` : ''}<button class="btn primary" id="nd">${icon('plus')} Fırsat</button></div>
      <div class="grid g4 mb">${kpi('Kazanılan ciro', money(sum(won, (d) => d.value)), 'award', 'ok')}${kpi(`Açık fırsat (${open.length})`, money(sum(open, (d) => d.value)), 'kanban', 'info')}${kpi('Kazanma oranı', '%' + (won.length + deals.filter((d) => d.stage === 'kaybedildi').length ? Math.round((won.length / (won.length + deals.filter((d) => d.stage === 'kaybedildi').length)) * 100) : 0), 'percent')}${kpi('Son temas', last ? NS.ago(last.date) : '—', 'clock', last && daysBetween(last.date, new Date()) > 30 ? 'warn' : '')}</div>
      <div class="grid g-21"><div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Fırsatlar</h3></div>${table({ rows: deals, empty: 'Fırsat yok', columns: [{ label: 'Fırsat', render: (d) => `<a href="#/firsat/${d.id}"><b>${esc(d.title)}</b></a><div class="small faint">${esc(usr(d.owner).name)} · ${esc(d.source || '')}</div>` }, { label: 'Aşama', render: (d) => `<span class="badge" style="background:${stage(d.stage).color};color:#fff;border:0">${esc(stage(d.stage).name)}</span>` }, { label: 'Tutar', cls: 'right', render: (d) => money(d.value) }, { label: 'Kapanış', render: (d) => NS.date(d.closedAt || d.expected) }] })}</div>
        <div class="card"><div class="card-h"><h3>Temas geçmişi</h3></div><div class="card-b">${acts.slice(0, 25).map((a) => `<div class="act"><div class="ai">${icon(ACT[a.type][1])}</div><div class="grow small"><b>${esc(ACT[a.type][0])}</b> · ${esc((db.get('deals', a.deal) || {}).title || '')}<div>${esc(a.text)}</div><div class="faint">${NS.dt(a.date)} · ${esc(usr(a.owner).name)}</div></div></div>`).join('') || '<div class="faint small">Kayıt yok</div>'}</div></div></div>
      <div class="col" style="gap:16px"><div class="card"><div class="card-h"><h3>Kişiler</h3><a class="btn sm" href="#/kisiler">${icon('plus')}</a></div><div class="card-b">${db.all('contacts', (k) => k.company === id).map((k) => `<div class="list-item"><div class="avatar">${esc(NS.initials(k.name))}</div><div class="grow"><b>${esc(k.name)}</b><div class="small muted">${esc(k.title || '')}</div><div class="small">${k.phone ? `<a href="tel:${esc(String(k.phone).replace(/\s/g, ''))}">${esc(k.phone)}</a>` : ''}${k.email ? ` · <a href="mailto:${esc(k.email)}">${esc(k.email)}</a>` : ''}</div></div></div>`).join('') || '<div class="faint small">Kişi yok</div>'}</div></div>
        <div class="card"><div class="card-h"><h3>Teklifler</h3></div><div class="card-b">${quotes.map((q) => { const st = Q.status(q); return `<div class="list-item small"><span class="grow mono">${esc(q.no)}</span>${badge(Q.STATUS[st][0], Q.STATUS[st][1])}<b>${money(Q.calc(q).grand)}</b></div>`; }).join('') || '<div class="faint small">Teklif yok</div>'}</div></div></div></div>`;
    $('#nd', el).onclick = () => dealForm(app, { company: id });
  }

  function dashboard(el, p, app) {
    const ds = myDeals(); const open = ds.filter(isOpen);
    const mo = today().slice(0, 7);
    const wonM = ds.filter((d) => d.stage === 'kazanildi' && (d.closedAt || '').startsWith(mo));
    const closed90 = ds.filter((d) => !isOpen(d) && d.closedAt >= iso(addDays(new Date(), -90)));
    const winRate = closed90.length ? Math.round((closed90.filter((d) => d.stage === 'kazanildi').length / closed90.length) * 100) : 0;
    const tasks = db.all('activities', (a) => a.type === 'gorev' && !a.done && (!mine() || a.owner === mine())).sort(dueCmp);
    const months = Array.from({ length: 4 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + i); return iso(d).slice(0, 7); });
    const target = Number(S().target) || 0, won = sum(wonM, (d) => d.value); const pct = target ? Math.round((won / target) * 100) : 0;
    el.innerHTML = pageHead('Satış Panosu', NS.dateLong(new Date()), `<a class="btn" href="#/huni">${icon('kanban')} Huni</a><button class="btn primary" id="nd">${icon('plus')} Fırsat</button>`) + `
      <div class="grid g4 mb">${kpi('Bu ay kazanılan', money(won), 'award', 'ok', `<div class="progress mt"><i style="width:${Math.min(100, pct)}%;background:var(--ok)"></i></div><div class="small faint">${target ? `Hedef ${money(target)} · %${pct}` : 'Hedef girilmedi (Ayarlar)'}</div>`)}${kpi('Açık huni', money(sum(open, (d) => d.value)), 'kanban', 'info', `<div class="small faint">${open.length} fırsat</div>`)}${kpi('Ağırlıklı tahmin', money(sum(open, weighted)), 'trend')}${kpi('Kazanma oranı (90 gün)', '%' + winRate, 'percent', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Aylara göre tahmini kapanış (ağırlıklı)</h3></div><div class="card-b">${chart.bars(months.map((m) => ({ label: NS.MONTHS[Number(m.slice(5)) - 1], value: sum(open.filter((d) => String(d.expected || '').startsWith(m)), weighted) })), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('check')} Görevlerim (${tasks.length})</h3></div><div class="card-b" style="max-height:300px;overflow:auto">${tasks.map((t) => `<div class="list-item small"><input type="checkbox" data-done="${t.id}"><div class="grow"><a href="#/firsat/${t.deal}">${esc(t.text)}</a><div class="faint">${esc((db.get('deals', t.deal) || {}).title || '')}</div></div>${t.due ? badge(NS.date(t.due), t.due < today() ? 'err' : t.due === today() ? 'warn' : '') : ''}</div>`).join('') || '<div class="faint small">Bekleyen görev yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} 14+ gündür sessiz fırsatlar</h3></div>${table({ rows: open.filter(stale).sort((a, b) => b.value - a.value), empty: 'Yok', columns: [{ label: 'Fırsat', render: (d) => `<a href="#/firsat/${d.id}"><b>${esc(d.title)}</b></a><div class="small faint">${esc(comp(d.company).name)}</div>` }, { label: 'Tutar', cls: 'right', render: (d) => money(d.value) }, { label: 'Son temas', render: (d) => NS.ago(d.lastActivity || d.created) }] })}</div>
      <div class="card"><div class="card-h"><h3>Temsilci performansı (90 gün)</h3></div>${table({ rows: db.all('users').map((u) => ({ id: u.id, u, w: sum(closed90.filter((d) => d.owner === u.id && d.stage === 'kazanildi'), (d) => d.value), n: closed90.filter((d) => d.owner === u.id && d.stage === 'kazanildi').length, o: sum(open.filter((d) => d.owner === u.id), (d) => d.value) })), columns: [{ label: 'Temsilci', render: (r) => `<b>${esc(r.u.name)}</b>` }, { label: 'Kazanılan', cls: 'right', render: (r) => `${money(r.w)} <span class="faint small">(${r.n})</span>` }, { label: 'Açık huni', cls: 'right', render: (r) => money(r.o) }] })}</div></div>`;
    $('#nd', el).onclick = () => dealForm(app);
    on(el, 'change', '[data-done]', (e, b) => { const a = db.get('activities', b.dataset.done); db.update('activities', a.id, { done: true, doneAt: new Date().toISOString() }); touch(a.deal); db.save(); toast('Görev tamamlandı', 'ok'); app.refresh(); });
  }
  function companiesPage(el, p, app) {
    const G = NS.groupBy(db.all('deals'), (d) => d.company); const K = NS.groupBy(db.all('contacts'), (x) => x.company); const of = (c) => G[c.id] || [];
    NS.crud(el, app, {
      col: 'companies', title: 'Firmalar', single: 'Firma', extraActions: [{ icon: 'eye', act: 'view', title: 'Firma kartı' }], onAction: (a, c) => app.go('firma', c.id), addLabel: 'Yeni firma', emptyIcon: 'building', sort: (a, b) => a.name.localeCompare(b.name, 'tr'),
      fields: [{ name: 'name', label: 'Firma adı', required: true, full: true }, { name: 'sector', label: 'Sektör' }, { name: 'city', label: 'Şehir' }, { name: 'phone', label: 'Telefon' }, { name: 'web', label: 'Web sitesi' }, { name: 'size', label: 'Çalışan sayısı', type: 'select', options: ['1-10', '10-50', '50-250', '250-1000', '1000+'] }],
      columns: [{ key: 'name', label: 'Firma', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.web || '')}</div>` }, { key: 'sector', label: 'Sektör' }, { key: 'city', label: 'Şehir' }, { label: 'Kişi', cls: 'right', render: (c) => (K[c.id] || []).length }, { label: 'Açık fırsat', cls: 'right', render: (c) => money(sum(of(c).filter(isOpen), (d) => d.value)) }, { label: 'Kazanılan', cls: 'right', render: (c) => money(sum(of(c).filter((d) => d.stage === 'kazanildi'), (d) => d.value)) }],
      searchFields: (c) => [c.name, c.city, c.sector, c.phone],
      beforeSave: (v, rec) => { const n = NS.slug(v.name); if (db.find('companies', (x) => (!rec || x.id !== rec.id) && NS.slug(x.name) === n)) return 'Bu adla kayıtlı firma var'; },
      canDelete: (c) => (db.find('deals', (d) => d.company === c.id) ? 'Bu firmanın fırsatı var; silinemez.' : db.find('contacts', (x) => x.company === c.id) ? 'Bu firmanın kişileri var; önce kişileri silin.' : true),
    });
  }
  function contactsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'contacts', title: 'Kişiler', single: 'Kişi', addLabel: 'Yeni kişi', emptyIcon: 'users', sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (c) => [c.name, c.email, c.phone, comp(c.company).name],
      canDelete: (k) => (db.find('deals', (d) => d.contact === k.id) ? 'Bu kişi bir fırsata bağlı; silinemez.' : true),
      fields: () => [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'company', label: 'Firma', type: 'select', options: db.all('companies').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => ({ value: c.id, label: c.name })) }, { name: 'title', label: 'Ünvan' }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }],
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
    id: 'crm', integrations: ['email', 'sms', 'whatsapp', 'printer', 'efatura', 'webhook', 'backup'], name: 'CRM', tagline: 'Satış Hunisi & Müşteri İlişkileri', icon: 'kanban', accent: '#db2777', db, home: 'ozet', auth: { roles: ROLES }, titles: { firsat: 'Fırsat', firma: 'Firma' },
    nav: [{ sec: 'Satış' }, { id: 'ozet', label: 'Satış Panosu', icon: 'home' }, { id: 'huni', label: 'Satış Hunisi', icon: 'kanban' }, { id: 'gorevler', label: 'Görevler', icon: 'check' }, { id: 'teklifler', label: 'Teklifler', icon: 'file' }, { id: 'firmalar', label: 'Firmalar', icon: 'building' }, { id: 'kisiler', label: 'Kişiler', icon: 'users' }, { sec: 'Yönetim' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, huni: pipelinePage, firsat: dealPage, gorevler: tasksPage, teklifler: quotesPage, firma: companyPage, firmalar: companiesPage, kisiler: contactsPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Hedef' }, { name: 'target', label: 'Aylık satış hedefi (₺)', type: 'number' }] }) },
  });
})();
