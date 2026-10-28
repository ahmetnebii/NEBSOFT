/* NEBSOFT Oto Servis & Sanayi — plakadan araç geçmişi, iş emri, parça + işçilik, müşteri onay linki,
   teknisyen ekranı, parça stoğu, bakım/muayene/sigorta hatırlatmaları ve cari tahsilat */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const O = window.OTS;
  const db = new NS.DB('otoservis', O.seed);
  const S = () => db.settings({});
  const veh = (id) => db.get('vehicles', id) || { plate: '-', brand: '', model: '' };
  const cus = (id) => db.get('customers', id) || { name: '-', phone: '' };
  const tech = (id) => db.get('techs', id) || { name: '-' };
  const stB = (s) => badge(O.ST[s][0], O.ST[s][1]);
  const normPlate = (p) => String(p || '').toLocaleUpperCase('tr').replace(/\s+/g, '');
  const findVeh = (p) => db.find('vehicles', (v) => normPlate(v.plate) === normPlate(p));
  const linkOf = (j) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'onay.html?k=' + O.token(j);
  const setSt = (j, st, note) => { j.status = st; j.history.push({ at: new Date().toISOString(), st, note: note || O.ST[st][0], user: (NS.currentUser || {}).name }); };
  const sms = (j, text) => { const c = cus(j.customer); NS.smsLog(db, { to: c.phone, name: c.name, text }, true); };
  const myTech = () => (NS.currentUser && NS.currentUser.role === 'teknisyen' ? NS.currentUser.tech : null);

  // ---------- Kalem türleri, işçilik kataloğu ve bakım paketleri ----------
  const KT = { parca: ['Parça', 'info'], iscilik: ['İşçilik', 'acc'], dis: ['Dış hizmet', 'warn'], sarf: ['Sarf malzeme', ''] };
  const lineTotal = (i) => Math.round((Number(i.qty) || 0) * (Number(i.price) || 0) * (1 - (Number(i.disc) || 0) / 100) * 100) / 100;
  const CHK = ['Stepne', 'Kriko', 'Yangın tüpü', 'İlk yardım çantası', 'Reflektör', 'Ruhsat', 'Yedek anahtar', 'Multimedya / teyp', 'Paspas takımı', 'Araçta değerli eşya yok'];
  const COMPL = ['Periyodik bakım', 'Fren', 'Motor arıza lambası', 'Klima', 'Lastik / rot-balans', 'Elektrik / akü', 'Şanzıman / debriyaj', 'Alt takım / süspansiyon', 'Kaporta / boya', 'Muayene öncesi kontrol'];
  const FUEL = ['Boş', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Dolu'];
  function ensureCatalog() {
    let ch = false;
    if (!db.data.labors) { ch = true; db.data.labors = [['IS-01', 'Periyodik bakım işçiliği', 1], ['IS-02', 'Ön fren balatası değişimi', 0.8], ['IS-03', 'Arka fren balatası / pabuç değişimi', 1], ['IS-04', 'Fren diski değişimi (çift)', 1.2], ['IS-05', 'Triger seti değişimi', 3.5], ['IS-06', 'Debriyaj seti değişimi', 4], ['IS-07', 'Klima gazı dolumu ve kaçak testi', 0.7], ['IS-08', 'Arıza tespit (bilgisayarlı)', 0.5], ['IS-09', 'Rot-balans ayarı', 0.6], ['IS-10', 'Akü değişimi ve şarj testi', 0.3], ['IS-11', 'Amortisör değişimi (çift)', 1.5], ['IS-12', 'Buji / ateşleme bobini değişimi', 0.7]].map(([code, name, hours]) => ({ id: NS.uid(), code, name, hours })); }
    if (!db.data.packs) { ch = true; db.data.packs = [
      { id: NS.uid(), name: '10.000 km periyodik bakım', items: [['parca', 'Motor yağı 5W-30 (4 L)', 1, 1650], ['parca', 'Yağ filtresi', 1, 340], ['parca', 'Hava filtresi', 1, 420], ['parca', 'Polen filtresi', 1, 310], ['sarf', 'Karter tapa contası', 1, 40], ['iscilik', 'Periyodik bakım işçiliği', 1, null]] },
      { id: NS.uid(), name: 'Ön fren bakımı', items: [['parca', 'Ön fren balatası (takım)', 1, 1450], ['sarf', 'Fren temizleme spreyi', 1, 120], ['iscilik', 'Ön fren balatası değişimi', 0.8, null]] },
      { id: NS.uid(), name: 'Klima bakımı', items: [['parca', 'Klima gazı R134a', 1, 950], ['parca', 'Polen filtresi', 1, 310], ['iscilik', 'Klima gazı dolumu ve kaçak testi', 0.7, null]] },
      { id: NS.uid(), name: 'Muayene öncesi kontrol', items: [['iscilik', 'Arıza tespit (bilgisayarlı)', 0.5, null], ['iscilik', 'Far ayarı ve egzoz emisyon ön kontrolü', 0.4, null]] },
    ].map((p) => ({ ...p, items: p.items.map(([type, name, qty, price]) => ({ type, name, qty, price })) })); }
    if (ch) db.save();
  }
  // Fotoğraf: en fazla 1000 px, JPEG — buluta küçük boyutla gider
  const shrink = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1000 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.72)); }; im.onerror = () => res(null); im.src = r.result; }; r.readAsDataURL(file); });

  // ---------- Belgeler (işletmenin şablonuyla yazdırılır) ----------
  function jobDoc(j, kind) {
    const v = veh(j.vehicle), c = cus(j.customer), t = O.totals(j); const L = j.items.filter((i) => i.approved !== false);
    const del = kind === 'teslim';
    return {
      title: del ? 'Araç teslim formu' : 'İş emri / araç kabul', no: j.no, date: del ? j.deliveredAt || new Date().toISOString() : j.at,
      info: [['Plaka', v.plate], ['Araç', `${v.brand || ''} ${v.model || ''} ${v.year || ''}`.trim()], ['Giriş km', NS.num(j.km)], ...(del ? [['Çıkış km', NS.num(j.outKm || v.km || j.km)]] : [['Yakıt', FUEL[j.fuel] || '']]), ['Şase no', v.vin || ''], ['Teknisyen', tech(j.tech).name], ...(j.eta && !del ? [['Tahmini teslim', NS.dt(j.eta)]] : []), ...(del && j.nextKm ? [['Sonraki bakım', NS.num(j.nextKm) + ' km']] : [])],
      party: { title: 'Müşteri', name: c.name, lines: [c.phone, c.taxNo ? 'VKN/TCKN: ' + c.taxNo : ''] },
      lines: L.map((i) => ({ name: i.name, note: KT[i.type] ? KT[i.type][0] : '', qty: i.qty, unit: i.type === 'iscilik' ? 'sa' : 'ad', price: i.price, disc: i.disc, total: lineTotal(i) })),
      totals: [['Parça ve malzeme', t.parca], ['İşçilik ve hizmet', t.iscilik], ...(j.disc ? [['İndirim', -j.disc]] : []), ['KDV %20', t.kdv], ['GENEL TOPLAM', t.total, true], ...(del && j.paid ? [['Tahsil edilen', j.paid], ['Kalan', Math.max(0, t.total - j.paid)]] : [])],
      note: [`Şikâyet: ${j.complaint || '-'}`, j.finding ? `Tespit: ${j.finding}` : '', !del && (j.belongings || []).length ? `Araçta bırakılanlar: ${j.belongings.join(', ')}` : ''].filter(Boolean).join('\n'),
      damage: !del || (j.damage || []).length ? { svg: NS.docs.carSvg(j.damage || []), marks: NS.docs.damageText(j.damage || []) } : null,
      signatures: del ? [{ label: 'Teslim eden (servis)', ...(j.signOutStaff || {}) }, { label: 'Aracı sağlam ve eksiksiz teslim aldım', ...(j.signOut || {}) }]
        : [{ label: 'Aracı teslim alan (servis)', ...(j.signInStaff || {}) }, { label: 'Müşteri — kabul ve onay', ...(j.signIn || {}) }],
      qr: { url: linkOf(j), label: 'Aracınızın durumunu buradan izleyin' },
    };
  }
  const printJob = (j, kind = 'isemri') => NS.docs.print(kind, jobDoc(j, kind));
  if (NS.docs) {
    const sample = (kind) => () => { const j = db.all('jobs').find((x) => x.items.length) || db.all('jobs')[0]; return j ? jobDoc(j, kind) : { title: 'Örnek' }; };
    NS.docs.define('otoservis', 'isemri', { label: 'İş emri / araç kabul', sample: sample('isemri') });
    NS.docs.define('otoservis', 'teslim', { label: 'Araç teslim formu', sample: sample('teslim') });
  }

  // ---------- Servis aç: plaka, müşteri adı veya telefonla tek ekran ----------
  function intakePage(el, p, app) {
    ensureCatalog();
    const st = { v: null, c: null, fuel: 4, belongings: [], damage: [], photos: [], signIn: null, q: p || '' };
    const isPlate = (s) => /^\d{2}\s*[a-zçğıöşü]{1,3}\s*\d{2,5}$/i.test(String(s).trim());
    const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
    el.innerHTML = pageHead('Servis aç', 'Plaka, müşteri adı veya telefon yazın — kayıtlıysa araç ve müşteri anında gelir, değilse aynı ekranda kaydedin') + `
      <div class="card pad mb os-find"><div class="search">${icon('search')}<input class="input lg" id="q" placeholder="34 ABC 123 · Ahmet Yılmaz · 0532…" autocomplete="off" style="height:58px;font-size:20px;padding-left:44px"></div><div id="sug" class="os-sug"></div></div>
      <div id="f"></div>`;
    const qi = $('#q', el);
    const suggest = () => {
      const q = qi.value.trim(); const box = $('#sug', el);
      if (q.length < 2) { box.innerHTML = ''; return; }
      const d = digits(q); const np = normPlate(q);
      const byV = db.all('vehicles', (v) => normPlate(v.plate).includes(np));
      const byC = db.all('customers', (c) => NS.match(q, c.name) || (d.length >= 4 && digits(c.phone).includes(d)));
      const rows = [...byV.map((v) => ({ v, c: cus(v.customer) })), ...byC.flatMap((c) => { const vs = db.all('vehicles', (v) => v.customer === c.id); return vs.length ? vs.map((v) => ({ v, c })) : [{ v: null, c }]; })];
      const seen = new Set(); const uniq = rows.filter((r) => { const k = (r.v ? r.v.id : '') + '|' + r.c.id; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
      box.innerHTML = uniq.map((r, i) => `<button class="os-sug-i" data-pick="${i}"><span class="os-plate">${r.v ? esc(r.v.plate) : '—'}</span><span class="grow"><b>${esc(r.c.name)}</b><span class="small muted"> · ${esc(r.c.phone || '')}</span><div class="small faint">${r.v ? `${esc(r.v.brand)} ${esc(r.v.model)} ${r.v.year || ''} · ${NS.num(r.v.km || 0)} km` : 'Kayıtlı aracı yok'}</div></span>${icon('right')}</button>`).join('')
        + `<button class="os-sug-i new" data-new>${icon('plus')}<span class="grow"><b>Yeni kayıt</b><span class="small muted"> · “${esc(q)}” ${isPlate(q) ? 'plakasıyla yeni araç' : 'adına yeni müşteri ve araç'}</span></span></button>`;
      box._rows = uniq;
    };
    qi.oninput = suggest;
    qi.onkeydown = (e) => { if (e.key === 'Enter') { const b = $('#sug [data-pick], #sug [data-new]', el); if (b) b.click(); } };
    on(el, 'click', '[data-pick]', (e, b) => { const r = $('#sug', el)._rows[b.dataset.pick]; st.v = r.v; st.c = r.c; $('#sug', el).innerHTML = ''; form(); });
    on(el, 'click', '[data-new]', () => { const q = qi.value.trim(); st.v = null; st.c = null; st.newPlate = isPlate(q) ? q.toLocaleUpperCase('tr') : ''; st.newName = !isPlate(q) && !digits(q) ? q : ''; st.newPhone = digits(q).length >= 10 ? q : ''; $('#sug', el).innerHTML = ''; form(); });
    function form() {
      const v = st.v || {}, c = st.c || {}; const prev = v.id ? db.all('jobs', (j) => j.vehicle === v.id).sort((a, b) => b.at.localeCompare(a.at)) : [];
      const open = prev.find((j) => j.status !== 'teslim');
      $('#f', el).innerHTML = `${open ? `<div class="card pad mb row" style="border-color:var(--warn);background:var(--warn-soft)">${icon('alert')}<span class="grow">Bu aracın açık iş emri var: <b>${esc(open.no)}</b> (${esc(O.ST[open.status][0])})</span><a class="btn sm" href="#/is/${open.id}">İş emrini aç</a></div>` : ''}
        <div class="grid g-21"><div class="col" style="gap:16px">
          <div class="card pad"><div>${NS.fieldsHtml([{ type: 'section', label: 'Araç' }, { name: 'plate', label: 'Plaka', required: true }, { name: 'km', label: 'Güncel km', type: 'number', required: true }, { name: 'brand', label: 'Marka', type: 'select', options: Object.keys(O.BRANDS) }, { name: 'model', label: 'Model' }, { name: 'year', label: 'Model yılı', type: 'number' }, { name: 'fuelType', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'vin', label: 'Şase no', full: true },
            { type: 'section', label: v.id ? 'Müşteri (kayıtlı — değişiklik kaydedilir)' : 'Müşteri' }, { name: 'cname', label: 'Ad soyad / firma', required: true }, { name: 'cphone', label: 'Cep telefonu', type: 'tel', required: true }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'tech', label: 'Teknisyen', type: 'select', options: db.all('techs').map((t) => ({ value: t.id, label: t.name })) }, { name: 'eta', label: 'Tahmini teslim', type: 'datetime-local' }],
            { plate: v.plate || st.newPlate || '', km: v.km || '', brand: v.brand, model: v.model, year: v.year, fuelType: v.fuel, vin: v.vin, cname: c.name || st.newName || '', cphone: c.phone || st.newPhone || '', taxNo: c.taxNo || '' })}</div></div>
          <div class="card pad"><h3 class="mb">Şikâyet ve talep</h3><div class="row mb" style="gap:6px">${COMPL.map((x) => `<button type="button" class="btn sm" data-cp="${esc(x)}">${esc(x)}</button>`).join('')}</div><textarea class="input" id="cpl" rows="3" placeholder="Müşterinin anlattığı şikâyet…"></textarea></div>
          <div class="card pad"><h3 class="mb">Hasar krokisi</h3><div id="dmg"></div></div></div>
        <div class="col" style="gap:16px">
          ${prev.length ? `<div class="card"><div class="card-h"><h3>${icon('clock')} Araç geçmişi (${prev.length})</h3></div>${prev.slice(0, 5).map((j) => `<a class="list-item" style="padding:10px 18px;color:inherit" href="#/is/${j.id}"><span class="grow"><b class="small">${NS.date(j.at)} · ${NS.num(j.km)} km</b><div class="small muted">${esc(j.complaint)}</div></span><b class="small">${money(O.totals(j).total)}</b></a>`).join('')}</div>` : ''}
          <div class="card pad"><h3 class="mb">Yakıt seviyesi</h3><input type="range" min="0" max="8" value="${st.fuel}" id="fuel" style="width:100%"><div class="row between small muted"><span>Boş</span><b id="fl">${FUEL[st.fuel]}</b><span>Dolu</span></div></div>
          <div class="card pad"><h3 class="mb">Araçta bırakılanlar</h3><div class="row" style="gap:6px">${CHK.map((x) => `<button type="button" class="btn sm ${st.belongings.includes(x) ? 'soft' : ''}" data-bl="${esc(x)}">${st.belongings.includes(x) ? icon('check') : ''}${esc(x)}</button>`).join('')}</div></div>
          <div class="card pad"><h3 class="mb">Fotoğraflar</h3><div class="os-photos">${st.photos.map((ph, i) => `<div class="os-ph"><img src="${ph}" alt="Araç fotoğrafı ${i + 1}"><button class="btn sm icon" data-rph="${i}" title="Sil">${icon('x')}</button></div>`).join('')}${st.photos.length < 6 ? `<label class="os-ph add">${icon('plus')}<span class="small">Fotoğraf</span><input type="file" accept="image/*" capture="environment" multiple hidden id="ph"></label>` : ''}</div></div>
          <div class="card pad"><h3 class="mb">Müşteri kabul imzası</h3>${st.signIn ? `<div class="os-sig"><img src="${st.signIn.img}" alt="İmza"><div class="small muted">${esc(st.signIn.name)} · ${NS.dt(st.signIn.at)}</div></div>` : '<p class="small muted mb">Müşteri araç durumunu, yakıtı ve şikâyeti onaylayıp imzalar.</p>'}<button class="btn block mt" id="sgi">${icon('edit')} ${st.signIn ? 'Yeniden imzalat' : 'Müşteriye imzalat'}</button></div>
          <button class="btn primary lg block" id="sv">${icon('check')} Servisi aç ve iş emrine geç</button><label class="check small center" style="justify-content:center"><input type="checkbox" id="pr" checked> Kabul formunu yazdır</label></div></div>`;
      NS.docs.damageEditor($('#dmg', el), st.damage);
      $('#fuel', el).oninput = (e) => { st.fuel = Number(e.target.value); $('#fl', el).textContent = FUEL[st.fuel]; };
      $('#sgi', el).onclick = async () => { const s = await NS.sign({ title: 'Araç kabul — müşteri imzası', label: 'Müşteri adı soyadı', name: $('[name=cname]', el).value, text: 'Aracımı yukarıdaki km, yakıt seviyesi, hasar ve eşya bilgileriyle servise teslim ettim. Arıza tespitinden sonra fiyat onayım alınmadan işlem yapılmayacağını biliyorum.' }); if (s) { st.signIn = s; keep(); } };
      const ph = $('#ph', el); if (ph) ph.onchange = async () => { for (const f of [...ph.files].slice(0, 6 - st.photos.length)) { const d = await shrink(f); if (d) st.photos.push(d); } keep(); };
      $('#sv', el).onclick = save;
    }
    // Yeniden çizerken formdaki yazılanları koru
    function keep() { const box = $('#f', el); const vals = NS.readForm(box); const cpl = $('#cpl', el).value; form(); Object.entries(vals).forEach(([k, x]) => { const i = $(`[name="${k}"]`, el); if (i && x != null) i.value = x; }); $('#cpl', el).value = cpl; }
    on(el, 'click', '[data-cp]', (e, b) => { const t = $('#cpl', el); t.value = t.value ? `${t.value}, ${b.dataset.cp}` : b.dataset.cp; t.focus(); });
    on(el, 'click', '[data-bl]', (e, b) => { const x = b.dataset.bl; st.belongings = st.belongings.includes(x) ? st.belongings.filter((y) => y !== x) : [...st.belongings, x]; b.classList.toggle('soft'); b.innerHTML = (st.belongings.includes(x) ? icon('check') : '') + esc(x); });
    on(el, 'click', '[data-rph]', (e, b) => { st.photos.splice(Number(b.dataset.rph), 1); keep(); });
    function save() {
      const box = $('#f', el); if (!NS.validate(box)) return; const f = NS.readForm(box); const complaint = $('#cpl', el).value.trim();
      if (!complaint) return toast('Şikâyet / talep yazın', 'err');
      const plate = String(f.plate).toLocaleUpperCase('tr').replace(/\s+/g, ' ').trim();
      let cc = st.c && st.c.id ? st.c : db.find('customers', (x) => digits(x.phone) === digits(f.cphone) && digits(f.cphone).length >= 10);
      if (!cc) cc = db.insert('customers', { name: f.cname, phone: f.cphone, taxNo: f.taxNo, balance: 0 }, true); else Object.assign(cc, { name: f.cname, phone: f.cphone, taxNo: f.taxNo || cc.taxNo });
      let vv = st.v && st.v.id ? st.v : findVeh(plate);
      const vdata = { plate, brand: f.brand, model: f.model, year: f.year, fuel: f.fuelType, vin: f.vin, km: Number(f.km), customer: cc.id };
      if (!vv) vv = db.insert('vehicles', vdata, true); else Object.assign(vv, vdata);
      const now = new Date().toISOString(); const user = NS.currentUser || {};
      const note = [`Yakıt ${FUEL[st.fuel]}`, st.belongings.length ? `${st.belongings.length} eşya` : '', st.damage.length ? `${st.damage.length} hasar işareti` : '', st.signIn ? 'müşteri imzaladı' : ''].filter(Boolean).join(' · ');
      const j = db.insert('jobs', { no: 'IE' + (2400 + db.all('jobs').length), vehicle: vv.id, customer: cc.id, at: now, km: Number(f.km), complaint, tech: f.tech, eta: f.eta || null, fuel: st.fuel, belongings: st.belongings, damage: st.damage, photos: st.photos, signIn: st.signIn, signInStaff: { name: user.name || '', at: now }, items: [], status: 'kabul', disc: 0, paid: 0, history: [{ at: now, st: 'kabul', note, user: user.name }] }, true);
      sms(j, `${S().bizName}: ${vv.plate} aracınız ${j.no} numarasıyla teslim alındı. Durumu buradan izleyebilirsiniz: ${linkOf(j)}`);
      db.save(); toast(`${j.no} açıldı`, 'ok');
      if ($('#pr', el).checked) printJob(j, 'isemri');
      app.go('is', j.id);
    }
    if (p) { qi.value = p; suggest(); }
    setTimeout(() => qi.focus(), 50);
  }

  // ---------- İş emri: kalem kalem işlem, onay, teslim ----------
  function jobPage(el, id, app) {
    ensureCatalog();
    const j = db.get('jobs', id);
    if (!j) { el.innerHTML = `<div class="card pad empty">${icon('alert')}<div>İş emri bulunamadı</div><a class="btn mt" href="#/isemirleri">İş emirlerine dön</a></div>`; return; }
    j.items.forEach((i) => { if (!i.id) i.id = NS.uid(); });
    const lock = () => j.status === 'teslim';
    const canPrice = () => !myTech();
    let saveT = null; const later = () => { clearTimeout(saveT); saveT = setTimeout(() => db.save(), 400); };
    const totalsHtml = () => { const t = O.totals(j); return `${[['Parça ve malzeme', t.parca], ['İşçilik ve hizmet', t.iscilik], ...(j.disc ? [['İndirim', -j.disc]] : []), ['KDV %20', t.kdv]].map(([l, x]) => `<div class="list-item small"><span class="grow muted">${l}</span>${money(x)}</div>`).join('')}<div class="list-item"><b class="grow">Genel toplam</b><b style="font-size:22px">${money(t.total)}</b></div>${j.paid ? `<div class="list-item small"><span class="grow muted">Tahsil edilen</span>${money(j.paid)}</div>` : ''}`; };
    const row = (i, n) => { const L = lock(); const ap = i.approved === true ? badge('Onaylı', 'ok') : i.approved === false ? badge('Reddedildi', 'err') : badge('Onay bekliyor', 'warn');
      return `<tr data-row="${i.id}" class="${i.approved === false ? 'os-rej' : ''}"><td class="faint">${n + 1}</td>
        <td>${L ? badge(KT[i.type][0], KT[i.type][1]) : `<select class="input os-in" data-k="type">${Object.entries(KT).map(([k, [l]]) => `<option value="${k}" ${k === i.type ? 'selected' : ''}>${l}</option>`).join('')}</select>`}</td>
        <td style="min-width:220px">${L ? esc(i.name) : `<input class="input os-in" data-k="name" value="${esc(i.name)}" list="os-parts">`}</td>
        <td class="right">${L ? i.qty : `<input class="input os-in os-n" data-k="qty" type="number" step="0.1" min="0" value="${i.qty}">`}</td>
        <td class="right">${L || !canPrice() ? money(i.price) : `<input class="input os-in os-n" data-k="price" type="number" step="0.01" min="0" value="${i.price}">`}</td>
        <td class="right">${L || !canPrice() ? (i.disc ? '%' + i.disc : '') : `<input class="input os-in os-n" data-k="disc" type="number" min="0" max="100" value="${i.disc || ''}" placeholder="0">`}</td>
        <td class="right"><b data-tot>${money(lineTotal(i))}</b></td>
        <td><button class="btn sm ghost" data-ap="${i.id}" ${L ? 'disabled' : ''} title="Onay durumunu değiştir">${ap}</button></td>
        <td>${L ? '' : `<button class="btn sm icon ghost" data-rm="${i.id}" title="Kalemi sil">${icon('trash')}</button>`}</td></tr>`; };
    const FLOWBTN = () => ({
      kabul: [['teshis', 'Arıza tespitine al', 'search', 'primary']],
      teshis: [['onay', 'Müşteri onayına gönder (SMS)', 'send', 'primary'], ['islemde', 'Onaysız tamire al', 'wrench', '']],
      onay: [['islemde', 'Telefonla onay alındı', 'phone', 'primary'], ['link', 'Onay linkini kopyala', 'link', '']],
      islemde: [['hazir', 'Tamir bitti — teslime hazır', 'check', 'primary']],
      hazir: [['teslim', 'Teslim et + tahsilat + imza', 'cash', 'primary']],
      teslim: [],
    }[j.status] || []);
    function draw() {
      const v = veh(j.vehicle), c = cus(j.customer); const L = lock(); const idx = O.FLOW.indexOf(j.status);
      el.innerHTML = `<div class="page-h"><div class="grow"><div class="row mb" style="gap:8px"><a class="btn sm ghost" href="#/isemirleri">${icon('back')} İş emirleri</a>${stB(j.status)}<span class="small faint mono">${esc(j.no)}</span></div>
          <h1><span class="os-plate lg">${esc(v.plate)}</span> <span class="muted" style="font-weight:600;font-size:18px">${esc(v.brand)} ${esc(v.model)} ${v.year || ''}</span></h1><p>${esc(c.name)} · ${esc(c.phone)} · Giriş ${NS.dt(j.at)} · ${NS.num(j.km)} km</p></div>
        <div class="row"><button class="btn" data-pr="isemri">${icon('print')} İş emri</button>${j.status === 'teslim' || j.status === 'hazir' ? `<button class="btn" data-pr="teslim">${icon('print')} Teslim formu</button>` : ''}${FLOWBTN().map(([k, l, ic, cls]) => `<button class="btn ${cls}" data-flow="${k}">${icon(ic)} ${l}</button>`).join('')}</div></div>
        <div class="os-steps mb">${O.FLOW.map((s, i) => `<div class="os-step ${i < idx ? 'done' : i === idx ? 'cur' : ''}"><span>${i < idx ? icon('check') : i + 1}</span>${esc(O.ST[s][0])}</div>`).join('')}</div>
        <div class="grid g-21"><div class="col" style="gap:16px">
          <div class="card"><div class="card-h"><h3>${icon('list')} Yapılan işlemler — kalem kalem</h3>${L ? '' : `<div class="row" style="gap:6px"><button class="btn sm" data-add="parca">${icon('plus')} Parça</button><button class="btn sm" data-add="iscilik">${icon('wrench')} İşçilik</button><button class="btn sm" data-add="dis">${icon('truck')} Dış hizmet</button><button class="btn sm soft" data-pack>${icon('layers')} Paket ekle</button><button class="btn sm soft" data-labor>${icon('book')} İşçilik kataloğu</button></div>`}</div>
            <div class="tbl-wrap"><table class="tbl os-lines"><thead><tr><th>#</th><th>Tür</th><th>Açıklama</th><th class="right">Miktar</th><th class="right">Birim fiyat</th><th class="right">İnd. %</th><th class="right">Tutar</th><th>Onay</th><th></th></tr></thead>
              <tbody id="ln">${j.items.map(row).join('') || `<tr><td colspan="9" class="center muted" style="padding:28px">Henüz kalem yok — arıza tespitinden sonra parça ve işçilik ekleyin, ya da hazır bir paket seçin.</td></tr>`}</tbody></table></div>
            ${L ? '' : `<div class="os-quick"><select class="input" id="qt">${Object.entries(KT).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join('')}</select><input class="input grow" id="qn" list="os-parts" placeholder="Hızlı ekle: parça kodu / adı veya yapılan işlem — Enter"><input class="input os-n" id="qq" type="number" step="0.1" value="1" title="Miktar"><input class="input os-n" id="qp" type="number" step="0.01" placeholder="Fiyat" title="Birim fiyat"><button class="btn primary" id="qa">${icon('plus')} Ekle</button></div>`}
            <div class="card-b" id="tt" style="max-width:380px;margin-left:auto">${totalsHtml()}</div></div>
          <div class="card pad grid g2"><div class="field"><label>Müşteri şikâyeti</label><textarea class="input" rows="3" data-j="complaint" ${L ? 'readonly' : ''}>${esc(j.complaint || '')}</textarea></div><div class="field"><label>Teknisyen tespiti</label><textarea class="input" rows="3" data-j="finding" ${L ? 'readonly' : ''} placeholder="Arıza tespit notu…">${esc(j.finding || '')}</textarea></div></div></div>
        <div class="col" style="gap:16px">
          <div class="card pad"><div class="row nw mb"><div class="avatar lg">${esc(NS.initials(c.name))}</div><div class="grow"><b>${esc(c.name)}</b><div class="small muted">${esc(c.phone)}</div></div><a class="btn sm" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">${icon('phone')}</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/90${String(c.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`${S().bizName}: ${v.plate} aracınızın durumu: ${linkOf(j)}`)}">${icon('message')}</a></div>
            <div class="kv small"><b>Teknisyen</b><span>${L ? esc(tech(j.tech).name) : `<select class="input" style="height:32px" data-j="tech">${db.all('techs').map((t) => `<option value="${t.id}" ${t.id === j.tech ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`}</span><b>Yakıt</b><span>${FUEL[j.fuel] || '-'}</span><b>Tahmini teslim</b><span>${j.eta ? NS.dt(j.eta) : '-'}</span><b>Şase</b><span class="mono">${esc(v.vin || '-')}</span>${(j.belongings || []).length ? `<b>Eşyalar</b><span>${esc(j.belongings.join(', '))}</span>` : ''}</div></div>
          <div class="card pad"><h3 class="mb">Hasar ve fotoğraflar</h3><div class="nv-dmg"><div class="nv-dmg-car" style="cursor:default">${NS.docs.carSvg(j.damage || [])}</div><div class="small col" style="gap:4px">${NS.docs.damageText(j.damage || []).map((x, i) => `<div><b>${i + 1}.</b> ${esc(x)}</div>`).join('') || '<span class="muted">Hasar işaretlenmedi</span>'}</div></div>
            ${(j.photos || []).length ? `<div class="os-photos mt">${j.photos.map((ph, i) => `<a class="os-ph" href="${ph}" target="_blank" rel="noopener"><img src="${ph}" alt="Fotoğraf ${i + 1}"></a>`).join('')}</div>` : ''}</div>
          <div class="card pad"><h3 class="mb">İmzalar</h3><div class="grid g2">${[['Kabul (müşteri)', j.signIn], ['Teslim (müşteri)', j.signOut]].map(([l, s]) => `<div class="os-sig">${s ? `<img src="${s.img}" alt="${l}">` : `<div class="os-sig-e">${icon('edit')}</div>`}<div class="small"><b>${l}</b><div class="faint">${s ? `${esc(s.name)} · ${NS.dt(s.at)}` : 'Alınmadı'}</div></div></div>`).join('')}</div>${!j.signIn && !L ? `<button class="btn sm block mt" data-signin>${icon('edit')} Kabul imzası al</button>` : ''}</div>
          <div class="card pad"><h3 class="mb">Geçmiş</h3><div class="col" style="gap:6px">${j.history.slice().reverse().map((h) => `<div class="small"><b>${esc(O.ST[h.st][0])}</b> — ${esc(h.note || '')} <span class="faint">${NS.dt(h.at)}${h.user ? ' · ' + esc(h.user) : ''}</span></div>`).join('')}</div></div></div></div>
        <datalist id="os-parts">${db.all('parts').map((x) => `<option value="${esc(x.code)} · ${esc(x.name)} (${esc(x.brand)})">stok ${x.stock} · ${money(x.price)}</option>`).join('')}${db.all('labors').map((x) => `<option value="${esc(x.name)}">İşçilik · ${x.hours} sa</option>`).join('')}</datalist>`;
    }
    const findPart = (txt) => { const code = String(txt).split(' · ')[0].trim(); return db.find('parts', (x) => x.code === code); };
    const findLabor = (txt) => db.find('labors', (x) => x.name === String(txt).trim());
    const addItem = (it) => { const pa = it.type === 'parca' || it.type === 'sarf' ? findPart(it.name) : null; const lb = it.type === 'iscilik' ? findLabor(it.name) : null;
      const item = { id: NS.uid(), type: it.type, name: pa ? `${pa.name} (${pa.brand})` : it.name, qty: Number(it.qty) || (lb ? lb.hours : 1), price: it.price != null && it.price !== '' ? Number(it.price) : pa ? pa.price : it.type === 'iscilik' ? S().laborRate || 0 : 0, disc: 0, approved: j.status === 'onay' ? null : true, ...(pa ? { pid: pa.id, cost: pa.cost } : {}) };
      j.items.push(item); db.save(); draw(); };
    const refreshRow = (i) => { const tr = $(`[data-row="${i.id}"]`, el); if (tr) $('[data-tot]', tr).textContent = money(lineTotal(i)); $('#tt', el).innerHTML = totalsHtml(); };
    el.addEventListener('input', (e) => {
      const tr = e.target.closest('[data-row]'); const k = e.target.dataset.k;
      if (tr && k) { const i = j.items.find((x) => x.id === tr.dataset.row); if (!i) return; i[k] = ['qty', 'price', 'disc'].includes(k) ? Number(e.target.value) || 0 : e.target.value; refreshRow(i); later(); }
      const jk = e.target.dataset.j; if (jk && e.target.tagName === 'TEXTAREA') { j[jk] = e.target.value; later(); }
    });
    el.addEventListener('change', (e) => {
      const tr = e.target.closest('[data-row]');
      if (tr && e.target.dataset.k === 'name') { const i = j.items.find((x) => x.id === tr.dataset.row); const pa = findPart(e.target.value); if (i && pa) { Object.assign(i, { name: `${pa.name} (${pa.brand})`, pid: pa.id, price: pa.price, cost: pa.cost, type: i.type === 'iscilik' ? 'parca' : i.type }); db.save(); draw(); } }
      if (e.target.dataset.j === 'tech') { j.tech = e.target.value; db.save(); }
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && ['qn', 'qq', 'qp'].includes(e.target.id)) { e.preventDefault(); $('#qa', el).click(); } });
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('button,a[data-pr]'); if (!b) return;
      if (b.id === 'qa') { const n = $('#qn', el).value.trim(); if (!n) return $('#qn', el).focus(); addItem({ type: $('#qt', el).value, name: n, qty: $('#qq', el).value, price: $('#qp', el).value }); setTimeout(() => { const q = $('#qn', el); if (q) q.focus(); }, 30); return; }
      if (b.dataset.add) { addItem({ type: b.dataset.add, name: b.dataset.add === 'iscilik' ? 'İşçilik' : b.dataset.add === 'dis' ? 'Dış hizmet (torna, rektifiye…)' : 'Parça', qty: 1 }); const rows = $$('[data-row]', el); const last = rows[rows.length - 1]; if (last) { const inp = $('[data-k=name]', last); inp.focus(); inp.select(); } return; }
      if (b.dataset.rm) { j.items = j.items.filter((i) => i.id !== b.dataset.rm); db.save(); draw(); return; }
      if (b.dataset.ap) { const i = j.items.find((x) => x.id === b.dataset.ap); i.approved = i.approved === true ? false : i.approved === false ? null : true; db.save(); draw(); return; }
      if (b.dataset.pr) { printJob(j, b.dataset.pr); return; }
      if (b.hasAttribute('data-signin')) { const s = await NS.sign({ title: 'Araç kabul — müşteri imzası', label: 'Müşteri adı soyadı', name: cus(j.customer).name, text: 'Aracımı belirtilen km, yakıt, hasar ve eşya bilgileriyle servise teslim ettim.' }); if (s) { j.signIn = s; db.save(); draw(); } return; }
      if (b.hasAttribute('data-pack')) {
        const P = db.all('packs'); const v = await formModal({ title: 'Bakım paketi ekle', fields: [{ name: 'p', label: 'Paket', type: 'select', options: P.map((p) => ({ value: p.id, label: `${p.name} · ${p.items.length} kalem` })), full: true }] });
        if (!v) return; db.get('packs', v.p).items.forEach((it) => j.items.push({ id: NS.uid(), type: it.type, name: it.name, qty: it.qty, price: it.price == null ? (S().laborRate || 0) * (it.qty || 1) / (it.qty || 1) : it.price, disc: 0, approved: j.status === 'onay' ? null : true }));
        db.save(); draw(); toast('Paket kalemleri eklendi', 'ok'); return;
      }
      if (b.hasAttribute('data-labor')) {
        const v = await formModal({ title: 'İşçilik kataloğundan ekle', fields: [{ name: 'l', label: 'İşlem', type: 'select', options: db.all('labors').map((x) => ({ value: x.id, label: `${x.code} · ${x.name} (${x.hours} sa)` })), full: true }] });
        if (!v) return; const x = db.get('labors', v.l); addItem({ type: 'iscilik', name: x.name, qty: x.hours, price: S().laborRate || 0 }); return;
      }
      if (b.dataset.flow) await flow(b.dataset.flow);
    });
    async function flow(k) {
      const v = veh(j.vehicle);
      if (k === 'link') { try { await navigator.clipboard.writeText(linkOf(j)); toast('Onay linki kopyalandı', 'ok'); } catch (x) { NS.prompt('Onay linki', linkOf(j)); } return; }
      if (k === 'teshis') { const f = await NS.prompt('Tespit edilen arıza', j.finding || ''); if (f === null) return; j.finding = f; setSt(j, 'teshis', f); }
      else if (k === 'onay') { if (!j.items.length) return toast('Önce işlem kalemlerini ekleyin', 'err'); j.items.forEach((i) => { if (i.approved !== true) i.approved = null; }); setSt(j, 'onay', 'Onay linki SMS ile gönderildi'); sms(j, `${S().bizName}: ${v.plate} aracınız için ${money(O.totals({ ...j, items: j.items.map((i) => ({ ...i, approved: true })) }).total)} tutarında teklif hazır. İnceleyip onaylamak için: ${linkOf(j)}`); toast('Onay linki gönderildi', 'ok'); }
      else if (k === 'islemde') { j.items.forEach((i) => { if (i.approved == null) i.approved = true; }); setSt(j, 'islemde', j.status === 'onay' ? 'Müşteri telefonda onayladı' : 'Onaysız tamire alındı'); }
      else if (k === 'hazir') { useParts(j); setSt(j, 'hazir'); sms(j, `${S().bizName}: ${v.plate} aracınız teslime hazır. Tutar: ${money(O.totals(j).total)}. Detay ve online ödeme: ${linkOf(j)}`); toast('Müşteriye "aracınız hazır" SMS gönderildi', 'ok'); }
      else if (k === 'teslim') { if (!(await deliver(j))) return; }
      db.save(); draw();
    }
    draw();
  }
  function useParts(j) { if (j.partsUsed) return; j.items.filter((i) => ['parca', 'sarf'].includes(i.type) && i.approved !== false && i.pid).forEach((i) => { const p = db.get('parts', i.pid); if (p) p.stock = Math.max(0, p.stock - i.qty); }); j.partsUsed = true; }
  async function deliver(j) {
    const t = O.totals(j); const vv = veh(j.vehicle);
    const v = await formModal({ title: `Teslim — ${vv.plate} · ${money(t.total)}`, fields: [{ name: 'amount', label: 'Tahsil edilen (₺)', type: 'number', step: '0.01' }, { name: 'method', label: 'Ödeme', type: 'select', options: ['Nakit', 'Kredi kartı', 'Havale', 'Cari hesaba (veresiye)'] }, { name: 'km', label: 'Çıkış km', type: 'number' }, { name: 'nextKm', label: 'Sonraki bakım km', type: 'number' }, { name: 'efatura', label: 'e-Arşiv fatura kes', type: 'checkbox' }, { name: 'print', label: 'Teslim formunu yazdır', type: 'checkbox' }], values: { amount: Math.max(0, t.total - (j.paid || 0)), method: 'Kredi kartı', km: j.km, nextKm: j.km + (S().serviceKm || 15000), print: true } });
    if (!v) return false;
    let sig = await NS.sign({ title: 'Teslim — müşteri imzası', label: 'Teslim alan adı soyadı', name: cus(j.customer).name, text: `<b>${esc(vv.plate)}</b> plakalı aracımı yapılan işlemlerin dökümünü görerek, <b>sağlam ve eksiksiz</b> teslim aldım. Toplam tutar: <b>${money(t.total)}</b>.` });
    if (!sig && !(await confirm('Müşteri imzası alınmadan teslim edilsin mi?'))) return false;
    useParts(j); const got = v.method.startsWith('Cari') ? 0 : Number(v.amount) || 0; j.paid = (j.paid || 0) + got; j.nextKm = Number(v.nextKm) || null; j.deliveredAt = new Date().toISOString(); j.outKm = Number(v.km) || j.km;
    if (vv.id) vv.km = j.outKm;
    const c = cus(j.customer); if (c.id) c.balance = (c.balance || 0) + t.total - got;
    if (got) db.insert('payments', { customer: j.customer, job: j.id, amount: got, method: v.method, at: new Date().toISOString() }, true);
    j.signOut = sig || null; j.signOutStaff = { name: (NS.currentUser || {}).name || '', at: j.deliveredAt };
    if (v.efatura && NS.ebelge) { const r = await NS.ebelge.create({ docType: 'auto', buyer: c.name, no: j.no, lines: j.items.filter((i) => i.approved !== false).map((i) => ({ name: i.name, qty: i.qty, price: i.price * (1 - (Number(i.disc) || 0) / 100), vat: 20 })), note: `${vv.plate} · ${j.km} km`, disc: j.disc }); if (r && r.no) j.invoice = r.no; }
    setSt(j, 'teslim', `${v.method}${j.invoice ? ' · fatura ' + j.invoice : ''}${sig ? ' · müşteri imzaladı' : ' · imzasız'}`);
    db.save(); if (v.print) printJob(j, 'teslim');
    return true;
  }

  // ---------- İşçilik kataloğu ve bakım paketleri ----------
  function catalogPage(el, p, app) {
    ensureCatalog();
    let tab = p === 'paketler' ? 'paketler' : 'iscilik';
    const draw = () => {
      el.innerHTML = pageHead('Hizmet kataloğu', 'Sık yapılan işçilikler ve tek tıkla eklenen bakım paketleri', `<button class="btn primary" id="ad">${icon('plus')} ${tab === 'iscilik' ? 'İşçilik ekle' : 'Paket ekle'}</button>`) + `<div class="tabs"><button data-tb="iscilik" class="${tab === 'iscilik' ? 'active' : ''}">İşçilikler</button><button data-tb="paketler" class="${tab === 'paketler' ? 'active' : ''}">Bakım paketleri</button></div><div class="card" id="t"></div>`;
      $('#t', el).innerHTML = tab === 'iscilik'
        ? table({ rows: db.all('labors'), columns: [{ label: 'Kod', render: (x) => `<span class="mono">${esc(x.code)}</span>` }, { label: 'İşlem', render: (x) => `<b>${esc(x.name)}</b>` }, { label: 'Süre', cls: 'right', render: (x) => x.hours + ' sa' }, { label: 'Tutar', cls: 'right', render: (x) => money(x.hours * (S().laborRate || 0)) }], actions: [{ icon: 'edit', act: 'ed' }, { icon: 'trash', act: 'rm' }] })
        : table({ rows: db.all('packs'), columns: [{ label: 'Paket', render: (x) => `<b>${esc(x.name)}</b><div class="small muted">${x.items.map((i) => esc(i.name)).join(' · ')}</div>` }, { label: 'Tutar (KDV hariç)', cls: 'right', render: (x) => money(sum(x.items, (i) => (i.price == null ? (S().laborRate || 0) : i.price) * (i.qty || 1))) }], actions: [{ icon: 'edit', act: 'ed' }, { icon: 'trash', act: 'rm' }] });
    };
    const packText = (p) => p.items.map((i) => `${i.type};${i.name};${i.qty};${i.price == null ? '' : i.price}`).join('\n');
    const parsePack = (s) => String(s).split('\n').map((l) => l.split(';').map((x) => x.trim())).filter((a) => a[1]).map(([type, name, qty, price]) => ({ type: KT[type] ? type : 'parca', name, qty: Number(qty) || 1, price: price === '' || price == null ? null : Number(price) }));
    const edit = async (x) => {
      const col = tab === 'iscilik' ? 'labors' : 'packs';
      const v = await formModal({ title: x ? 'Düzenle' : 'Ekle', fields: tab === 'iscilik' ? [{ name: 'code', label: 'Kod' }, { name: 'name', label: 'İşlem', required: true, full: true }, { name: 'hours', label: 'Süre (saat)', type: 'number', step: '0.1', required: true }] : [{ name: 'name', label: 'Paket adı', required: true, full: true }, { name: 'items', label: 'Kalemler — her satır: tür;açıklama;miktar;fiyat (tür: parca, iscilik, dis, sarf · işçilikte fiyat boşsa saat ücreti kullanılır)', type: 'textarea', full: true, required: true }], values: x ? (tab === 'iscilik' ? x : { name: x.name, items: packText(x) }) : {} });
      if (!v) return; const data = tab === 'iscilik' ? { code: v.code, name: v.name, hours: Number(v.hours) || 1 } : { name: v.name, items: parsePack(v.items) };
      if (x) Object.assign(x, data); else db.insert(col, data, true); db.save(); draw();
    };
    on(el, 'click', '[data-tb]', (e, b) => { tab = b.dataset.tb; draw(); });
    on(el, 'click', '#ad', () => edit(null));
    on(el, 'click', '[data-act=ed]', (e, b) => edit(db.get(tab === 'iscilik' ? 'labors' : 'packs', b.dataset.id)));
    on(el, 'click', '[data-act=rm]', async (e, b) => { if (await confirm('Silinsin mi?')) { db.remove(tab === 'iscilik' ? 'labors' : 'packs', b.dataset.id); draw(); } });
    draw();
  }

  // ---------- İş emirleri (pano) ----------
  function jobsPage(el, p, app) {
    let q = ''; const mine = myTech();
    el.innerHTML = pageHead('İş Emirleri', mine ? 'Size atanan araçlar' : 'Servisteki tüm araçlar — karta tıklayın', `<a class="btn primary" href="#/kabul">${icon('plus')} Araç kabul</a>`) + `<div class="card pad mb">${NS.searchBox('q', 'Plaka, müşteri, iş emri no...')}</div><div class="grid" style="grid-template-columns:repeat(5,minmax(200px,1fr));overflow-x:auto;gap:12px" id="kb"></div><div class="card mt"><div class="card-h"><h3>Son teslim edilenler</h3></div><div id="done"></div></div>`;
    const draw = () => {
      const all = db.all('jobs', (j) => (!mine || j.tech === mine) && NS.match(q, j.no, veh(j.vehicle).plate, cus(j.customer).name));
      $('#kb', el).innerHTML = O.FLOW.slice(0, 5).map((s) => { const L = all.filter((j) => j.status === s); return `<div><div class="row mb"><b class="grow">${esc(O.ST[s][0])}</b>${badge(L.length, O.ST[s][1])}</div>${L.map((j) => `<div class="card pad mb" data-j="${j.id}" style="cursor:pointer"><div class="row"><b class="grow mono">${esc(veh(j.vehicle).plate)}</b><span class="small faint">${esc(j.no)}</span></div><div class="small muted">${esc(veh(j.vehicle).brand)} ${esc(veh(j.vehicle).model)}</div><div class="small mt">${esc(j.complaint)}</div><div class="row small mt"><span class="grow faint">${esc(tech(j.tech).name.split(' ')[0])}</span>${j.items.length ? `<b>${money(O.totals(j).total)}</b>` : ''}</div></div>`).join('') || '<div class="small faint">—</div>'}</div>`; }).join('');
      $('#done', el).innerHTML = table({ rows: all.filter((j) => j.status === 'teslim').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10), columns: [{ label: 'İş emri', render: (j) => `<b class="mono">${esc(veh(j.vehicle).plate)}</b> <span class="small faint">${esc(j.no)}</span>` }, { label: 'Müşteri', render: (j) => esc(cus(j.customer).name) }, { label: 'İşlem', render: (j) => `<span class="small">${esc(j.complaint)}</span>` }, { label: 'Tutar', cls: 'right', render: (j) => money(O.totals(j).total) }, { label: 'Ödeme', render: (j) => (j.paid >= O.totals(j).total - 0.01 ? badge('Ödendi', 'ok') : badge('Açık ' + money(O.totals(j).total - j.paid), 'warn')) }], actions: [{ icon: 'eye', act: 'v' }] });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-j]', (e, b) => app.go('is', b.dataset.j));
    on(el, 'click', '[data-act=v]', (e, b) => app.go('is', b.dataset.id));
    draw();
  }

  // ---------- Araçlar ----------
  function vehiclesPage(el, p, app) {
    NS.crud(el, app, { col: 'vehicles', title: 'Araçlar', sub: 'Plaka bazında servis geçmişi, muayene ve sigorta tarihleri', single: 'Araç', addLabel: 'Araç ekle', emptyIcon: 'car',
      fields: [{ name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', type: 'select', options: Object.keys(O.BRANDS) }, { name: 'model', label: 'Model' }, { name: 'year', label: 'Yıl', type: 'number' }, { name: 'km', label: 'Km', type: 'number' }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'customer', label: 'Sahibi', type: 'select', options: db.all('customers').map((c) => ({ value: c.id, label: c.name })) }, { name: 'vin', label: 'Şase no' }, { name: 'inspection', label: 'Muayene bitiş', type: 'date' }, { name: 'insurance', label: 'Sigorta bitiş', type: 'date' }],
      searchFields: (v) => [v.plate, v.brand, v.model, cus(v.customer).name],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'mu', label: 'Muayenesi yaklaşan', test: (v) => v.inspection && v.inspection <= iso(addDays(new Date(), 30)) }, { value: 'si', label: 'Sigortası yaklaşan', test: (v) => v.insurance && v.insurance <= iso(addDays(new Date(), 30)) }],
      columns: [{ key: 'plate', label: 'Plaka', render: (v) => `<b class="mono">${esc(v.plate)}</b><div class="small faint">${esc(v.brand)} ${esc(v.model)} ${v.year || ''}</div>` }, { label: 'Sahibi', render: (v) => esc(cus(v.customer).name) }, { key: 'km', label: 'Km', cls: 'right', render: (v) => NS.num(v.km || 0) }, { label: 'Ziyaret', cls: 'right', render: (v) => db.all('jobs', (j) => j.vehicle === v.id).length }, { label: 'Muayene', render: (v) => (v.inspection ? (v.inspection < today() ? badge('Geçmiş', 'err') : v.inspection <= iso(addDays(new Date(), 30)) ? badge(NS.date(v.inspection), 'warn') : NS.date(v.inspection)) : '-') }],
      extraActions: [{ icon: 'clock', act: 'h', title: 'Geçmiş / yeni iş emri' }], onAction: (a, v) => app.go('kabul', v.plate) });
  }

  // ---------- Parça stoğu ----------
  function partsPage(el, p, app) {
    NS.crud(el, app, { col: 'parts', title: 'Parça Stoğu', sub: 'İş emrinde kullanılan parça tamir bitince stoktan düşer', single: 'Parça', addLabel: 'Parça ekle', emptyIcon: 'box',
      fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'name', label: 'Parça adı', required: true }, { name: 'brand', label: 'Marka' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış (₺)', type: 'number', step: '0.01' }, { name: 'stock', label: 'Stok', type: 'number' }, { name: 'min', label: 'En az stok', type: 'number' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'az', label: 'Azalan', test: (x) => x.stock <= (x.min || 2) }],
      searchFields: (x) => [x.code, x.name, x.brand],
      columns: [{ key: 'code', label: 'Kod', render: (x) => `<span class="mono">${esc(x.code)}</span>` }, { key: 'name', label: 'Parça', render: (x) => `<b>${esc(x.name)}</b><div class="small faint">${esc(x.brand || '')}</div>` }, { key: 'stock', label: 'Stok', cls: 'right', render: (x) => `<b style="color:var(--${x.stock <= (x.min || 2) ? 'err' : 'text'})">${x.stock}</b>` }, { key: 'cost', label: 'Alış', cls: 'right', render: (x) => money(x.cost) }, { key: 'price', label: 'Satış', cls: 'right', render: (x) => money(x.price) }, { label: 'Kâr %', cls: 'right', render: (x) => '%' + Math.round(((x.price - x.cost) / (x.cost || 1)) * 100) }],
      extraActions: [{ icon: 'truck', act: 'ord', title: 'Tedarikçiden sipariş' }],
      onAction: async (a, x) => { if (NS.integ && NS.integ.isOn('parca')) { const r = await NS.integ.call('parca', 'siparis', { code: x.code, qty: Math.max(5, (x.min || 2) * 3) }); if (r && r.ok) toast('Sipariş tedarikçiye iletildi', 'ok'); } else toast('Entegrasyonlar > Yedek parça tedarikçileri bölümünden Martaş / Başbuğ / Dinamik bağlantısını açın', 'err'); } });
  }

  // ---------- Hatırlatmalar ----------
  function remindersPage(el, p, app) {
    const lim = iso(addDays(new Date(), 30));
    const V = db.all('vehicles');
    const last = (v) => db.all('jobs', (j) => j.vehicle === v.id && j.status === 'teslim').sort((a, b) => b.at.localeCompare(a.at))[0];
    const rows = [
      ...V.filter((v) => v.inspection && v.inspection <= lim).map((v) => ({ id: 'm' + v.id, v, type: 'Muayene', date: v.inspection, text: `${S().bizName}: ${v.plate} aracınızın muayenesi ${NS.date(v.inspection)} tarihinde doluyor. Muayene öncesi kontrol için randevu: ${S().bizPhone}` })),
      ...V.filter((v) => v.insurance && v.insurance <= lim).map((v) => ({ id: 's' + v.id, v, type: 'Sigorta', date: v.insurance, text: `${S().bizName}: ${v.plate} aracınızın trafik sigortası ${NS.date(v.insurance)} tarihinde bitiyor.` })),
      ...V.map((v) => ({ v, j: last(v) })).filter(({ v, j }) => j && j.nextKm && (v.km || 0) + 1500 >= j.nextKm).map(({ v, j }) => ({ id: 'b' + v.id, v, type: 'Bakım', date: '', text: `${S().bizName}: ${v.plate} aracınızın ${NS.num(j.nextKm)} km bakımı yaklaştı. Randevu için: ${S().bizPhone}` })),
      ...V.map((v) => ({ v, j: last(v) })).filter(({ j }) => j && j.at < addDays(new Date(), -330).toISOString()).map(({ v }) => ({ id: 'y' + v.id, v, type: 'Yıllık bakım', date: '', text: `${S().bizName}: ${v.plate} aracınızın son bakımının üzerinden 1 yıl geçti.` })),
    ];
    const sent = db.data.sentReminders = db.data.sentReminders || {};
    el.innerHTML = pageHead('Hatırlatmalar', 'Muayene, sigorta ve bakım zamanı gelen araçlar — müşteriyi geri getiren SMS', `<button class="btn primary" id="all">${icon('send')} Tümüne SMS gönder</button>`) + `<div class="card" id="t"></div>`;
    const draw = () => { $('#t', el).innerHTML = table({ rows, empty: 'Hatırlatılacak araç yok', emptyIcon: 'bell', columns: [{ label: 'Tür', render: (r) => badge(r.type, r.type === 'Muayene' ? 'warn' : r.type === 'Sigorta' ? 'info' : 'acc') }, { label: 'Araç', render: (r) => `<b class="mono">${esc(r.v.plate)}</b><div class="small faint">${esc(cus(r.v.customer).name)}</div>` }, { label: 'Tarih', render: (r) => (r.date ? NS.date(r.date) : '-') }, { label: 'Mesaj', render: (r) => `<span class="small">${esc(r.text)}</span>` }, { label: '', render: (r) => (sent[r.id] ? badge('Gönderildi ' + NS.date(sent[r.id]), 'ok') : '') }], actions: [{ icon: 'send', act: 's', title: 'SMS', show: (r) => !sent[r.id] }] }); };
    const send = (r) => { NS.smsLog(db, { to: cus(r.v.customer).phone, name: cus(r.v.customer).name, text: r.text }, true); sent[r.id] = today(); };
    on(el, 'click', '[data-act=s]', (e, b) => { send(rows.find((r) => r.id === b.dataset.id)); db.save(); draw(); toast('SMS gönderildi', 'ok'); });
    $('#all', el).onclick = async () => { const L = rows.filter((r) => !sent[r.id]); if (!L.length) return toast('Gönderilecek yok'); if (!(await confirm(`${L.length} müşteriye SMS gönderilsin mi?`))) return; L.forEach(send); db.save(); draw(); toast(`${L.length} SMS gönderildi`, 'ok'); };
    draw();
  }

  // ---------- Cari & tahsilat ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler & Cari', sub: 'Filo / kurumsal müşteriler ve açık hesaplar', single: 'Müşteri', addLabel: 'Müşteri ekle', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad / firma', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'taxNo', label: 'VKN / TCKN' }, { name: 'fleet', label: 'Filo / kurumsal', type: 'checkbox' }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'borc', label: 'Borcu olan', test: (c) => (c.balance || 0) > 0.01 }, { value: 'filo', label: 'Filo', test: (c) => c.fleet }],
      searchFields: (c) => [c.name, c.phone],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b> ${c.fleet ? badge('Filo', 'info') : ''}<div class="small faint">${esc(c.phone)}</div>` }, { label: 'Araç', cls: 'right', render: (c) => db.all('vehicles', (v) => v.customer === c.id).length }, { label: 'Toplam iş', cls: 'right', render: (c) => money(sum(db.all('jobs', (j) => j.customer === c.id && j.status === 'teslim'), (j) => O.totals(j).total)) }, { key: 'balance', label: 'Bakiye', cls: 'right', render: (c) => ((c.balance || 0) > 0.01 ? `<b style="color:var(--err)">${money(c.balance)}</b>` : '<span class="faint">0</span>') }],
      extraActions: [{ icon: 'cash', act: 'pay', title: 'Tahsilat' }],
      onAction: async (a, c, draw) => { const v = await formModal({ title: `Tahsilat — ${c.name}`, fields: [{ name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'method', label: 'Yöntem', type: 'select', options: ['Nakit', 'Kredi kartı', 'Havale'] }], values: { amount: Math.max(0, c.balance || 0) } }); if (!v) return; c.balance = (c.balance || 0) - Number(v.amount); db.insert('payments', { customer: c.id, amount: Number(v.amount), method: v.method, at: new Date().toISOString() }); db.save(); draw(); toast('Tahsilat kaydedildi', 'ok'); } });
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const all = db.all('jobs'); const open = all.filter((j) => j.status !== 'teslim');
    const m30 = all.filter((j) => j.status === 'teslim' && j.at > addDays(new Date(), -30).toISOString());
    const T = m30.map(O.totals); const partProfit = sum(m30.flatMap((j) => j.items.filter((i) => i.type === 'parca' && i.approved !== false)), (i) => (i.price - (i.cost || 0)) * i.qty);
    const ser = NS.dailySeries(all.filter((j) => j.status === 'teslim'), 14, 'at', (j) => O.totals(j).total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/kabul">${icon('plus')} Araç kabul</a>`) + `
      <div class="grid g4 mb">${kpi('Servisteki araç', open.length, 'car', 'info', `<div class="small faint">${open.filter((j) => j.status === 'hazir').length} teslime hazır</div>`)}${kpi('Onay bekleyen', open.filter((j) => j.status === 'onay').length, 'clock', 'warn')}${kpi('30 gün ciro', money(sum(T, (t) => t.total)), 'trend', 'ok', `<div class="small faint">işçilik ${money(sum(T, (t) => t.iscilik))} · parça kârı ${money(partProfit)}</div>`)}${kpi('Açık hesap', money(sum(db.all('customers'), (c) => Math.max(0, c.balance || 0))), 'wallet', 'err')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün teslim cirosu</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div>
      <div class="card"><div class="card-h"><h3>Gelen işler (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (j) => j.complaint)).map(([label, v]) => ({ label, value: v.length })).sort((a, b) => b.value - a.value).slice(0, 6), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Teknisyen yükü</h3></div>${table({ rows: db.all('techs').map((t) => ({ id: t.id, t, n: open.filter((j) => j.tech === t.id).length, d: m30.filter((j) => j.tech === t.id).length, h: sum(m30.filter((j) => j.tech === t.id).flatMap((j) => j.items.filter((i) => i.type === 'iscilik')), (i) => i.qty) })), columns: [{ label: 'Teknisyen', render: (r) => `<b>${esc(r.t.name)}</b><div class="small faint">${esc(r.t.skill)}</div>` }, { label: 'Açık iş', cls: 'right', key: 'n' }, { label: '30 gün iş', cls: 'right', key: 'd' }, { label: 'Faturalı saat', cls: 'right', key: 'h' }] })}</div>
      <div class="card"><div class="card-h"><h3>Kritik parça</h3><a class="btn sm" href="#/parcalar">Stok</a></div>${table({ rows: db.all('parts', (x) => x.stock <= (x.min || 2)), empty: 'Kritik parça yok', columns: [{ label: 'Parça', render: (x) => `<b>${esc(x.name)}</b> <span class="small faint">${esc(x.brand)}</span>` }, { label: 'Stok', cls: 'right', render: (x) => badge(x.stock, 'err') }] })}</div></div>`;
  }

  const ROLES = { admin: 'Servis sahibi', danisman: 'Servis danışmanı', teknisyen: 'Teknisyen' };
  const app = NS.shell({
    id: 'otoservis', integrations: ['sms', 'whatsapp', 'efatura', 'parca', 'tramer', 'printer', 'payment', 'webhook', 'backup'], name: 'Oto Servis', tagline: 'Sanayi & servis yönetimi', icon: 'wrench', accent: '#0369a1', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Servis' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['danisman'] }, { id: 'kabul', label: 'Servis Aç', icon: 'plus', roles: ['danisman'] }, { id: 'isemirleri', label: 'İş Emirleri', icon: 'kanban' }, { id: 'araclar', label: 'Araçlar', icon: 'car', roles: ['danisman'] }, { id: 'hatirlatma', label: 'Hatırlatmalar', icon: 'bell', roles: ['danisman'] }, { sec: 'Yönetim' }, { id: 'parcalar', label: 'Parça Stoğu', icon: 'box', roles: ['danisman'] }, { id: 'katalog', label: 'Hizmet Kataloğu', icon: 'book', roles: ['danisman'] }, { id: 'musteriler', label: 'Müşteriler & Cari', icon: 'users', roles: ['danisman'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    titles: { is: 'İş emri' },
    routes: { is: jobPage, katalog: catalogPage, ozet: dashboard, kabul: intakePage, isemirleri: jobsPage, araclar: vehiclesPage, hatirlatma: remindersPage, parcalar: partsPage, musteriler: customersPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Servis' }, { name: 'laborRate', label: 'İşçilik saat ücreti (₺)', type: 'number' }, { name: 'serviceKm', label: 'Bakım aralığı (km)', type: 'number' }, { name: 'warrantyDays', label: 'İşçilik garantisi (gün)', type: 'number' }] }) },
  });
  if (myTech() && !location.hash) app.go('isemirleri');
})();
