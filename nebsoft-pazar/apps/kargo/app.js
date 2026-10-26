/* NEBSOFT Kargo & Kurye — gönderi kabul, etiket, zimmet/dağıtım, kurye teslim ekranı, COD mutabakatı, cari ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const K = window.KARGO;
  const db = new NS.DB('kargo', K.seed);
  const S = () => db.settings({});
  const cour = (id) => db.get('couriers', id) || { name: 'Atanmadı', zone: [] };
  const cari = (id) => db.get('caris', id);
  const stB = (s) => badge(K.ST[s][0], K.ST[s][1]);
  const trackUrl = (sh) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'takip.html?no=' + sh.no;
  const myCourier = () => (NS.currentUser && NS.currentUser.role === 'kurye' ? NS.currentUser.courier : null);
  function setStatus(sh, status, note) { sh.status = status; sh.history.push({ at: new Date().toISOString(), status, note: note || K.ST[status][0], user: (NS.currentUser || {}).name }); }
  const suggest = (sh) => db.all('couriers').find((c) => c.zone.includes(sh.receiver.district)) || null;

  // ---------- Gönderi kabul ----------
  function intakePage(el, p, app) {
    const st = S();
    el.innerHTML = pageHead('Gönderi Kabul', 'Bilgileri girin; fiyat anında hesaplanır, etiket otomatik yazdırılır') + `<div class="grid g-21"><div class="col" style="gap:16px">
      <div class="card pad" id="sf"><h3 class="mb">Gönderici</h3>${NS.fieldsHtml([{ name: 'cari', label: 'Kurumsal müşteri', type: 'select', empty: 'Bireysel gönderici', options: db.all('caris').map((c) => ({ value: c.id, label: `${c.name} (%${c.discount} indirim)` })) }, { name: 'sname', label: 'Ad / firma' }, { name: 'sphone', label: 'Telefon' }, { name: 'sdistrict', label: 'İlçe', type: 'select', options: K.DISTRICTS }])}</div>
      <div class="card pad" id="rf"><h3 class="mb">Alıcı</h3>${NS.fieldsHtml([{ name: 'rname', label: 'Ad soyad', required: true }, { name: 'rphone', label: 'Telefon', required: true, type: 'tel' }, { name: 'region', label: 'Bölge', type: 'select', options: Object.entries(K.REGION).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'rcity', label: 'Şehir', value: 'İstanbul' }, { name: 'rdistrict', label: 'İlçe (şehir içi)', type: 'select', options: K.DISTRICTS }, { name: 'raddress', label: 'Açık adres', required: true, full: true }])}</div>
      <div class="card pad" id="pf"><h3 class="mb">Paket</h3>${NS.fieldsHtml([{ name: 'service', label: 'Hizmet', type: 'select', options: Object.entries(K.SERVICE).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'pieces', label: 'Parça adedi', type: 'number', value: 1 }, { name: 'w', label: 'En (cm)', type: 'number', value: 30 }, { name: 'l', label: 'Boy (cm)', type: 'number', value: 20 }, { name: 'h', label: 'Yükseklik (cm)', type: 'number', value: 15 }, { name: 'kg', label: 'Ağırlık (kg)', type: 'number', value: 2, step: '0.1' }, { name: 'cod', label: 'Kapıda tahsilat tutarı (₺)', type: 'number', value: 0, hint: 'Alıcıdan tahsil edilip göndericiye aktarılır' }, { name: 'content', label: 'İçerik', placeholder: 'Giysi, evrak, elektronik...' }])}</div></div>
      <div><div class="col" style="position:sticky;top:80px;gap:16px"><div class="price-box"><div class="small" style="opacity:.85">Gönderi ücreti</div><div class="v" id="pv">-</div><div class="small" id="pd"></div></div>
        <button class="btn primary lg block" id="save">${icon('print')} Kabul et ve etiket yazdır</button><div class="card pad small muted">Desi = En × Boy × Yükseklik / 3000. Desi ile kilogramdan büyük olan ücretlendirilir.<br>Tarife: ${K.tiers(st).map(([d, p]) => `${d} desiye kadar ${money(p)}`).join(' · ')} · üzeri desi başı ${money(st.perDesi)}</div></div></div></div>`;
    const read = () => { const sf = NS.readForm($('#sf', el)), rf = NS.readForm($('#rf', el)), pf = NS.readForm($('#pf', el)); const desi = Math.max(Math.ceil((pf.w * pf.l * pf.h) / 3000), Math.ceil(pf.kg || 0), 1); return { sf, rf, pf, desi }; };
    const calc = () => { const { sf, rf, pf, desi } = read(); const c = sf.cari ? cari(sf.cari) : null; const sh = { desi, pieces: pf.pieces || 1, service: pf.service, region: rf.region, cod: pf.cod || 0 }; const pr = K.price(S(), sh, c); $('#pv', el).textContent = money(pr); $('#pd', el).innerHTML = `${desi} desi · ${K.SERVICE[pf.service][0]} · ${K.REGION[rf.region][0]}${pf.cod ? ` · KT ${money(pf.cod)}` : ''}${c ? ` · %${c.discount} kurumsal indirim` : ''}`; return { sh, pr, c }; };
    el.addEventListener('input', calc); el.addEventListener('change', (e) => { if (e.target.name === 'cari') { const c = cari(e.target.value); if (c) { $('[name=sname]', el).value = c.name; $('[name=sphone]', el).value = c.phone; $('[name=sdistrict]', el).value = c.district; } } calc(); });
    $('#save', el).onclick = () => {
      if (!NS.validate($('#rf', el))) return;
      const { sf, rf, pf, desi } = read(); const { pr } = calc();
      const sh = db.insert('ships', { no: 'HK' + Date.now().toString().slice(-9), at: new Date().toISOString(), cari: sf.cari || null, sender: { name: sf.sname || 'Bireysel', phone: sf.sphone, district: sf.sdistrict }, receiver: { name: rf.rname, phone: rf.rphone, city: rf.rcity, district: rf.region === 'sehirici' ? rf.rdistrict : '', address: rf.raddress }, desi, pieces: pf.pieces || 1, service: pf.service, region: rf.region, cod: pf.cod || 0, content: pf.content, price: pr, status: 'kabul', history: [{ at: new Date().toISOString(), status: 'kabul', note: 'Gönderi kabul edildi', user: (NS.currentUser || {}).name }] });
      db.log('Gönderi kabul', `${sh.no} · ${money(pr)}`); toast(`${sh.no} kabul edildi`, 'ok'); printLabel(sh); app.go('gonderiler');
    };
    calc();
  }
  function printLabel(sh) {
    NS.printHtml(`<div style="border:2px solid #000;width:380px;font-family:Arial;padding:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">${esc(S().bizName)}</b><span style="background:#000;color:#fff;padding:2px 8px;font-weight:700">${esc(K.SERVICE[sh.service][0].split(' ')[0].toUpperCase())}</span></div>
      <div style="margin:8px 0">${NS.barcodeSvg(sh.no, { height: 56 })}</div><div style="font-size:11px">GÖNDERİCİ: ${esc(sh.sender.name)} · ${esc(sh.sender.phone || '')}</div><hr>
      <div style="font-size:18px"><b>${esc(sh.receiver.name)}</b></div><div>${esc(sh.receiver.address || '')}</div><div style="font-size:16px"><b>${esc(sh.receiver.district || '')} / ${esc(sh.receiver.city || '')}</b></div><div>${esc(sh.receiver.phone)}</div>
      <hr><div style="display:flex;justify-content:space-between"><span>${sh.desi} desi · ${sh.pieces} parça</span><span>${NS.date(sh.at)}</span></div>${sh.cod ? `<div style="background:#000;color:#fff;text-align:center;padding:4px;margin-top:6px;font-size:16px"><b>KAPIDA TAHSİLAT ${money(sh.cod)}</b></div>` : ''}<div style="display:flex;gap:10px;align-items:center;margin-top:6px">${NS.qrSvg(trackUrl(sh), 70)}<span style="font-size:10px">Takip: ${esc(trackUrl(sh))}</span></div></div>`, { title: sh.no });
  }

  // ---------- Gönderiler ----------
  function shipModal(app, sh) {
    modal({
      title: `${sh.no}`, size: 'wide',
      body: `<div class="grid g2"><div class="col"><div class="row">${stB(sh.status)} ${badge(K.SERVICE[sh.service][0], 'acc')} ${sh.cod ? badge('KT ' + money(sh.cod), 'warn') : ''}</div>
          <div class="card pad"><div class="small muted">Gönderici</div><b>${esc(sh.sender.name)}</b><div class="small">${esc(sh.sender.phone || '')} · ${esc(sh.sender.district || '')}</div></div>
          <div class="card pad"><div class="small muted">Alıcı</div><b>${esc(sh.receiver.name)}</b><div class="small">${esc(sh.receiver.phone)}</div><div class="small muted">${esc(sh.receiver.address || '')} ${esc(sh.receiver.district || '')} / ${esc(sh.receiver.city || '')}</div></div>
          <div class="list-item small"><span class="grow muted">Desi / parça</span>${sh.desi} / ${sh.pieces}</div><div class="list-item small"><span class="grow muted">Ücret</span><b>${money(sh.price)}</b></div><div class="list-item small"><span class="grow muted">Kurye</span>${esc(cour(sh.courier).name)}</div>
          ${sh.signature ? `<div><div class="small muted">Alıcı imzası</div><img src="${sh.signature}" style="max-width:100%;border:1px solid var(--border);border-radius:8px;background:#fff"></div>` : ''}</div>
        <div><h3 class="mb">Hareketler</h3><div class="tl">${sh.history.slice().reverse().map((h) => `<div class="it"><b>${esc(K.ST[h.status][0])}</b><div class="small">${esc(h.note || '')}</div><div class="small faint">${NS.dt(h.at)}${h.user ? ' · ' + esc(h.user) : ''}</div></div>`).join('')}</div></div></div>`,
      actions: [
        { label: 'Etiket', icon: 'print', onClick: () => printLabel(sh) },
        { label: 'Takip linki', icon: 'globe', onClick: () => { navigator.clipboard && navigator.clipboard.writeText(trackUrl(sh)); window.open(trackUrl(sh), '_blank'); } },
        ...(sh.status === 'kabul' ? [{ label: 'Transfer merkezine al', cls: 'primary', onClick: (c) => { setStatus(sh, 'depoda', 'Transfer merkezine ulaştı'); db.save(); c(); app.refresh(); } }] : []),
        // Şehir dışı / bölge dışı gönderiler anlaşmalı kargo firmasına API ile aktarılır
        ...(['kabul', 'depoda'].includes(sh.status) && !sh.partner ? [{ label: 'Anlaşmalı kargoya aktar', icon: 'truck', onClick: async (c) => {
          if (!NS.integ) return; const provs = NS.integ.CONN.kargofirma[4];
          const v = await formModal({ title: 'Anlaşmalı kargo firmasına aktar', fields: [{ name: 'carrier', label: 'Kargo firması', type: 'select', options: Object.values(provs) }] }); if (!v) return;
          const r = await NS.integ.call('kargofirma', 'gonderi-olustur', { carrier: v.carrier, ref: sh.no, desi: sh.desi, pieces: sh.pieces, cod: sh.cod || 0, receiver: sh.receiver, sender: sh.sender }); if (!r || !r.ok) return;
          sh.partner = { carrier: v.carrier, tracking: (r.data && r.data.tracking) || r.ref }; setStatus(sh, 'depoda', `${v.carrier} firmasına aktarıldı · takip ${sh.partner.tracking}`); db.save(); c(); app.refresh();
        } }] : []),
        ...(sh.partner ? [{ label: `${sh.partner.carrier} durumu`, icon: 'refresh', onClick: async () => { const r = await NS.integ.call('kargofirma', 'durum-sorgu', { carrier: sh.partner.carrier, tracking: sh.partner.tracking }); if (r && r.ok && r.data && r.data.delivered) { setStatus(sh, 'teslim', `${sh.partner.carrier} teslim etti`); db.save(); app.refresh(); } } }] : []),
        ...(sh.status === 'edilemedi' ? [{ label: 'Tekrar dağıtıma', onClick: (c) => { setStatus(sh, 'depoda', 'Yeniden dağıtım için depoya alındı'); db.save(); c(); app.refresh(); } }, { label: 'Göndericiye iade', cls: 'danger', onClick: (c) => { setStatus(sh, 'iade'); db.save(); c(); app.refresh(); } }] : []),
      ],
    });
  }
  function shipsPage(el, p, app) {
    let q = '', f = p || 'aktif';
    el.innerHTML = pageHead('Gönderiler', 'Tüm gönderiler ve durumları', `<button class="btn" id="ex">${icon('download')}</button><a class="btn primary" href="#/kabul">${icon('plus')} Gönderi kabul</a>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Takip no, alıcı, telefon...')}<div class="seg">${[['aktif', 'Aktif'], ['kabul', 'Kabul'], ['depoda', 'Depoda'], ['dagitimda', 'Dağıtımda'], ['edilemedi', 'Edilemedi'], ['teslim', 'Teslim'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('ships', (s) => (f === 'all' || (f === 'aktif' ? ['kabul', 'depoda', 'dagitimda', 'edilemedi'].includes(s.status) : s.status === f)) && NS.match(q, s.no, s.receiver.name, s.receiver.phone, s.sender.name)).sort((a, b) => b.at.localeCompare(a.at));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'truck', columns: [{ label: 'Takip no', render: (s) => `<b class="mono">${esc(s.no)}</b><div class="small faint">${NS.dt(s.at)}</div>` }, { label: 'Gönderici', render: (s) => esc(s.sender.name) }, { label: 'Alıcı', render: (s) => `${esc(s.receiver.name)}<div class="small faint">${esc(s.receiver.district || s.receiver.city)}</div>` }, { label: 'Hizmet', render: (s) => `${esc(K.SERVICE[s.service][0].split(' ')[0])} · ${s.desi} ds` }, { label: 'KT', cls: 'right', render: (s) => (s.cod ? money(s.cod) : '-') }, { label: 'Kurye', render: (s) => esc(s.courier ? cour(s.courier).name.split(' ')[0] : '-') }, { label: 'Durum', render: (s) => stB(s.status) }, { label: 'Ücret', cls: 'right', render: (s) => money(s.price) }], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} gönderi · ${money(sum(r, (s) => s.price))}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => shipModal(app, db.get('ships', b.dataset.id)));
    $('#ex', el).onclick = () => NS.csv('gonderiler', rows(), [{ key: 'no', label: 'Takip' }, { label: 'Tarih', value: (s) => NS.dt(s.at) }, { label: 'Alıcı', value: (s) => s.receiver.name }, { label: 'İlçe', value: (s) => s.receiver.district }, { label: 'Durum', value: (s) => K.ST[s.status][0] }, { key: 'price', label: 'Ücret' }, { key: 'cod', label: 'KT' }]);
    draw();
  }

  // ---------- Zimmet / dağıtım ----------
  function assignPage(el, p, app) {
    const pool = db.all('ships', (s) => ['kabul', 'depoda'].includes(s.status) && s.region === 'sehirici');
    const byD = NS.groupBy(pool, (s) => s.receiver.district || '-');
    el.innerHTML = pageHead('Zimmet & Dağıtım', 'Depodaki şehir içi gönderileri bölgeye göre kuryelere zimmetleyin', `<button class="btn" id="gps">${icon('map')} Kurye konumları</button><button class="btn" id="auto">${icon('zap')} Bölgeye göre otomatik zimmetle</button>`) + `
      <div class="grid g-21"><div class="card"><div class="card-h"><h3>Dağıtım bekleyen (${pool.length})</h3></div>${Object.entries(byD).sort((a, b) => b[1].length - a[1].length).map(([d, list]) => `<div class="card-b" style="border-bottom:1px solid var(--border)"><div class="row mb"><b class="grow">${icon('map')} ${esc(d)} <span class="faint">(${list.length})</span></b><span class="small muted">Önerilen: ${esc((suggest(list[0]) || { name: '-' }).name)}</span></div>${list.map((s) => `<div class="list-item small"><input type="checkbox" data-pick="${s.id}"><b class="mono">${esc(s.no)}</b><span class="grow">${esc(s.receiver.name)} · ${esc(s.receiver.address || '')}</span>${s.cod ? badge('KT', 'warn') : ''}${badge(K.SERVICE[s.service][0].split(' ')[0], s.service === 'ayni' ? 'err' : '')}</div>`).join('')}</div>`).join('') || '<div class="empty">Dağıtım bekleyen gönderi yok</div>'}
        <div class="card-b row"><select class="input" id="kc">${db.all('couriers').map((c) => `<option value="${c.id}">${esc(c.name)} — ${esc(c.zone.join(', '))}</option>`).join('')}</select><button class="btn primary" id="as">${icon('truck')} Seçilenleri zimmetle</button></div></div>
      <div class="col" style="gap:12px">${db.all('couriers').map((c) => { const mine = db.all('ships', (s) => s.courier === c.id && s.status === 'dagitimda'); return `<div class="card pad"><div class="row nw"><div class="avatar">${esc(NS.initials(c.name))}</div><div class="grow"><b>${esc(c.name)}</b><div class="small faint">${esc(c.vehicle)} · ${esc(c.plate)}</div></div>${badge(mine.length + ' paket', mine.length ? 'acc' : '')}</div><div class="small muted mt">${esc(c.zone.join(', '))}</div>${mine.length ? `<button class="btn sm mt" data-route="${c.id}">${icon('print')} Dağıtım listesi</button>` : ''}</div>`; }).join('')}</div></div>`;
    const assign = (ids, cid) => { ids.forEach((id) => { const s = db.get('ships', id); s.courier = cid; if (s.status === 'kabul') setStatus(s, 'depoda', 'Transfer merkezine ulaştı'); setStatus(s, 'dagitimda', `Kurye ${cour(cid).name} dağıtıma çıkardı`); }); db.save(); toast(`${ids.length} gönderi zimmetlendi`, 'ok'); app.refresh(); };
    $('#gps', el).onclick = async () => {
      if (!NS.integ) return; const cs = db.all('couriers'); const r = await NS.integ.call('gps', 'konumlar', { plates: cs.map((c) => c.plate) }); if (!r || !r.ok) return;
      const pos = r.data && Array.isArray(r.data.positions) ? r.data.positions : cs.map((c) => ({ plate: c.plate, lat: 41.0 + Math.random() * 0.1, lng: 28.95 + Math.random() * 0.15, speed: NS.rand(0, 55), at: new Date().toISOString() }));
      modal({ title: 'Kurye konumları', size: 'wide', body: table({ rows: pos.map((x, i) => ({ ...x, id: i })), columns: [{ label: 'Kurye', render: (x) => esc((cs.find((c) => c.plate === x.plate) || {}).name || x.plate) }, { label: 'Plaka', render: (x) => esc(x.plate) }, { label: 'Hız', cls: 'right', render: (x) => `${x.speed} km/s` }, { label: 'Zaman', render: (x) => NS.time(x.at) }, { label: 'Harita', render: (x) => `<a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${x.lat},${x.lng}">${icon('map')} Aç</a>` }] }) });
    };
    $('#as', el).onclick = () => { const ids = $$('[data-pick]:checked', el).map((c) => c.dataset.pick); if (!ids.length) return toast('Gönderi seçin', 'err'); assign(ids, $('#kc', el).value); };
    $('#auto', el).onclick = () => { let n = 0; pool.forEach((s) => { const c = suggest(s); if (c) { s.courier = c.id; if (s.status === 'kabul') setStatus(s, 'depoda'); setStatus(s, 'dagitimda', `Kurye ${c.name} dağıtıma çıkardı`); n++; } }); db.save(); toast(`${n} gönderi bölgesine göre zimmetlendi`, 'ok'); app.refresh(); };
    on(el, 'click', '[data-route]', (e, b) => { const c = cour(b.dataset.route); const list = db.all('ships', (s) => s.courier === c.id && s.status === 'dagitimda').sort((x, y) => String(x.receiver.district).localeCompare(String(y.receiver.district), 'tr')); NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)} — Dağıtım Listesi</h2><p><b>${esc(c.name)}</b> · ${esc(c.plate)} · ${NS.date(new Date())}</p><table><tr><th>#</th><th>Takip</th><th>Alıcı / adres</th><th>KT</th><th>İmza</th></tr>${list.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.no)}</td><td><b>${esc(s.receiver.name)}</b> ${esc(s.receiver.phone)}<br>${esc(s.receiver.address || '')} ${esc(s.receiver.district)}</td><td>${s.cod ? money(s.cod) : ''}</td><td style="width:110px"></td></tr>`).join('')}</table><p>Toplam ${list.length} gönderi · Kapıda tahsilat: ${money(sum(list, (s) => s.cod))}</p></div>`, { title: 'Dağıtım listesi' }); });
  }

  // ---------- Kurye ekranı ----------
  let viewCourier = null;
  function courierPage(el, p, app) {
    viewCourier = myCourier() || viewCourier || 'k1';
    const c = cour(viewCourier);
    const list = db.all('ships', (s) => s.courier === c.id && s.status === 'dagitimda').sort((a, b) => String(a.receiver.district).localeCompare(String(b.receiver.district), 'tr'));
    const doneToday = db.all('ships', (s) => s.courier === c.id && ['teslim', 'edilemedi'].includes(s.status) && iso(s.history[s.history.length - 1].at) === today());
    el.innerHTML = pageHead('Kurye Ekranı', `${esc(c.name)} · ${esc(c.vehicle)} ${esc(c.plate || '')}`, myCourier() ? '' : `<select class="input" id="kc" style="max-width:220px">${db.all('couriers').map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`) + `
      <div class="grid g3 mb">${kpi('Teslim edilecek', list.length, 'truck', 'info')}${kpi('Bugün teslim', doneToday.filter((s) => s.status === 'teslim').length, 'check', 'ok')}${kpi('Üzerimdeki KT', money(sum(db.all('ships', (s) => s.courier === c.id && s.codCollected && !s.codSettled), (s) => s.codCollected)), 'cash', 'warn')}</div>
      ${list.map((s, i) => `<div class="stop"><div class="row nw"><div class="n">${i + 1}</div><div class="grow"><b>${esc(s.receiver.name)}</b> <span class="mono small faint">${esc(s.no)}</span><div class="small">${esc(s.receiver.address || '')} · <b>${esc(s.receiver.district)}</b></div></div>${s.cod ? badge('Tahsil: ' + money(s.cod), 'warn') : ''}</div>
        <div class="row mt"><a class="btn sm" href="tel:${esc(String(s.receiver.phone).replace(/\s/g, ''))}">${icon('phone')} Ara</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(`${s.receiver.address || ''} ${s.receiver.district} İstanbul`)}">${icon('map')} Yol tarifi</a><span class="grow"></span><button class="btn sm danger" data-fail="${s.id}">Teslim edilemedi</button><button class="btn sm ok" data-ok="${s.id}">${icon('check')} Teslim et</button></div></div>`).join('') || `<div class="card pad empty">${icon('check')}<div>Dağıtımda paketiniz yok</div></div>`}`;
    if ($('#kc', el)) $('#kc', el).onchange = (e) => { viewCourier = e.target.value; app.refresh(); };
    on(el, 'click', '[data-ok]', (e, b) => deliver(app, db.get('ships', b.dataset.ok)));
    on(el, 'click', '[data-fail]', async (e, b) => { const s = db.get('ships', b.dataset.fail); const v = await formModal({ title: 'Teslim edilemedi', fields: [{ name: 'reason', label: 'Neden', type: 'select', options: K.FAIL }, { name: 'note', label: 'Not' }] }); if (!v) return; s.failReason = v.reason; s.attempts = (s.attempts || 0) + 1; setStatus(s, 'edilemedi', v.reason + (v.note ? ' — ' + v.note : '')); db.save(); if (NS.integ) NS.integ.sms(s.receiver.phone, `${S().bizName}: ${s.no} nolu gönderiniz teslim edilemedi (${v.reason}). Yeniden teslim için: ${S().bizPhone}. Takip: ${trackUrl(s)}`, { silent: true }); toast('Kaydedildi, alıcıya SMS gönderildi', 'ok'); app.refresh(); });
  }
  function deliver(app, s) {
    modal({
      title: `Teslim — ${s.receiver.name}`,
      body: `<div class="field mb"><label>Teslim alan</label><input class="input" id="dn" value="${esc(s.receiver.name)}"></div><div class="field mb"><label>Yakınlık</label><select class="input" id="dr"><option>Kendisi</option><option>Aile bireyi</option><option>Komşu</option><option>Kapıcı / görevli</option><option>İş arkadaşı</option></select></div>
        ${s.cod ? `<div class="card pad mb" style="background:var(--warn-soft);border:0"><b>Kapıda tahsilat: ${money(s.cod)}</b><div class="row mt"><label class="check"><input type="radio" name="cp" value="nakit" checked> Nakit</label><label class="check"><input type="radio" name="cp" value="kart"> Kart (POS)</label></div></div>` : ''}
        <div class="field"><label>Alıcı imzası</label><canvas class="sig" id="sig" width="600" height="220"></canvas><button class="btn sm ghost mt" id="cl">Temizle</button></div>`,
      onOpen: (b) => {
        const cv = $('#sig', b); const ctx = cv.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
        let drawing = false; const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
        cv.onpointerdown = (e) => { drawing = true; cv.dataset.signed = '1'; ctx.beginPath(); ctx.moveTo(...pos(e)); cv.setPointerCapture(e.pointerId); };
        cv.onpointermove = (e) => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); };
        cv.onpointerup = () => { drawing = false; };
        $('#cl', b).onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); delete cv.dataset.signed; };
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Teslimi onayla', cls: 'ok', icon: 'check', onClick: (c, b) => {
        const cv = $('#sig', b); if (!cv.dataset.signed) return toast('Alıcı imzası gerekli', 'err');
        s.deliveredTo = `${$('#dn', b).value} (${$('#dr', b).value})`; s.signature = cv.toDataURL('image/png');
        if (s.cod) { s.codCollected = s.cod; s.codPay = ($('[name=cp]:checked', b) || {}).value; }
        setStatus(s, 'teslim', `Teslim alan: ${s.deliveredTo}`); db.save(); c(); NS.beep(1300, 120); toast('Teslim edildi', 'ok'); app.refresh();
      } }],
    });
  }

  // ---------- Mutabakat ----------
  function settlePage(el, p, app) {
    const open = db.all('ships', (s) => s.codCollected && !s.codSettled);
    const byC = NS.groupBy(open, (s) => s.courier);
    const owed = NS.groupBy(db.all('ships', (s) => s.codSettled && !s.codPaidOut), (s) => s.cari || 'bireysel');
    el.innerHTML = pageHead('Kapıda Tahsilat Mutabakatı', 'Kuryelerin topladığı paranın teslim alınması ve göndericilere ödeme') + `
      <div class="grid g3 mb">${kpi('Kuryelerdeki para', money(sum(open, (s) => s.codCollected)), 'cash', 'warn')}${kpi('Göndericilere ödenecek', money(sum(Object.values(owed).flat(), (s) => s.codCollected)), 'wallet', 'info')}${kpi('Bu ay tahsil edilen', money(sum(db.all('ships', (s) => s.codCollected && s.at.slice(0, 7) === today().slice(0, 7)), (s) => s.codCollected)), 'trend', 'ok')}</div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>1) Kuryelerden teslim al</h3></div>${table({ rows: Object.entries(byC).map(([k, v]) => ({ id: k, k, v })), empty: 'Kuryelerde bekleyen para yok', columns: [{ label: 'Kurye', render: (r) => `<b>${esc(cour(r.k).name)}</b>` }, { label: 'Paket', cls: 'right', render: (r) => r.v.length }, { label: 'Nakit', cls: 'right', render: (r) => money(sum(r.v.filter((s) => s.codPay !== 'kart'), (s) => s.codCollected)) }, { label: 'Kart', cls: 'right', render: (r) => money(sum(r.v.filter((s) => s.codPay === 'kart'), (s) => s.codCollected)) }, { label: 'Toplam', cls: 'right', render: (r) => `<b>${money(sum(r.v, (s) => s.codCollected))}</b>` }], actions: [{ label: 'Teslim aldım', act: 'set' }] })}</div>
      <div class="card"><div class="card-h"><h3>2) Göndericilere öde</h3></div>${table({ rows: Object.entries(owed).map(([k, v]) => ({ id: k, k, v })), empty: 'Ödenecek tutar yok', columns: [{ label: 'Gönderici', render: (r) => `<b>${esc(r.k === 'bireysel' ? 'Bireysel göndericiler' : (cari(r.k) || {}).name)}</b>` }, { label: 'Paket', cls: 'right', render: (r) => r.v.length }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(sum(r.v, (s) => s.codCollected))}</b>` }], actions: [{ label: 'Ödendi', act: 'pay' }] })}</div></div>`;
    on(el, 'click', '[data-act]', (e, b) => { const k = b.dataset.id; if (b.dataset.act === 'set') { (byC[k] || []).forEach((s) => { s.codSettled = true; }); db.log('KT teslim alındı', cour(k).name); } else { (owed[k] || []).forEach((s) => { s.codPaidOut = true; }); db.log('KT göndericiye ödendi', k); } db.save(); toast('Kaydedildi', 'ok'); app.refresh(); });
  }

  // ---------- Özet / cari / tarife / raporlar ----------
  function dashboard(el, p, app) {
    const all = db.all('ships'); const t = today();
    const todayAcc = all.filter((s) => iso(s.at) === t);
    const done7 = all.filter((s) => ['teslim', 'edilemedi'].includes(s.status) && s.at > addDays(new Date(), -7).toISOString());
    const rate = done7.length ? Math.round((done7.filter((s) => s.status === 'teslim').length / done7.length) * 100) : 0;
    const ser = NS.dailySeries(all, 14, 'at', () => 1);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/zimmet">${icon('truck')} Zimmet</a><a class="btn primary" href="#/kabul">${icon('plus')} Gönderi kabul</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün kabul', todayAcc.length, 'box', '', `<div class="small faint">${money(sum(todayAcc, (s) => s.price))}</div>`)}${kpi('Dağıtımda', all.filter((s) => s.status === 'dagitimda').length, 'truck', 'info')}${kpi('Depoda bekleyen', all.filter((s) => ['kabul', 'depoda'].includes(s.status)).length, 'building', 'warn')}${kpi('Teslim başarısı (7 gün)', '%' + rate, 'check', 'ok')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük gönderi adedi</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div>
      <div class="card"><div class="card-h"><h3>Hizmet dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(all, (s) => s.service)).map(([k, v]) => ({ label: K.SERVICE[k][0], value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Teslim edilemeyenler</h3></div>${table({ rows: all.filter((s) => s.status === 'edilemedi').slice(-8).reverse(), empty: 'Yok', columns: [{ label: 'Takip', render: (s) => `<b class="mono">${esc(s.no)}</b>` }, { label: 'Alıcı', render: (s) => esc(s.receiver.name) }, { label: 'Neden', render: (s) => badge(s.failReason || '-', 'err') }], actions: [{ icon: 'eye', act: 'v' }] })}</div>
      <div class="card"><div class="card-h"><h3>Kurye performansı (bugün)</h3></div>${table({ rows: db.all('couriers').map((c) => ({ id: c.id, c, on: all.filter((s) => s.courier === c.id && s.status === 'dagitimda').length, ok: all.filter((s) => s.courier === c.id && s.status === 'teslim' && iso(s.history[s.history.length - 1].at) === t).length })), columns: [{ label: 'Kurye', render: (r) => `<b>${esc(r.c.name)}</b>` }, { label: 'Dağıtımda', cls: 'right', key: 'on' }, { label: 'Teslim', cls: 'right', key: 'ok' }] })}</div></div>`;
    on(el, 'click', '[data-act=v]', (e, b) => shipModal(app, db.get('ships', b.dataset.id)));
  }
  function carisPage(el, p, app) {
    const mo = today().slice(0, 7);
    NS.crud(el, app, {
      col: 'caris', title: 'Kurumsal Müşteriler', sub: 'İndirimli tarife ve aylık toplu fatura', single: 'Müşteri', addLabel: 'Yeni kurumsal müşteri', emptyIcon: 'building',
      fields: [{ name: 'name', label: 'Firma', required: true }, { name: 'contact', label: 'Yetkili' }, { name: 'phone', label: 'Telefon' }, { name: 'district', label: 'Alım ilçesi', type: 'select', options: K.DISTRICTS }, { name: 'discount', label: 'İndirim %', type: 'number' }],
      columns: [{ key: 'name', label: 'Firma', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.contact || '')} · ${esc(c.phone || '')}</div>` }, { key: 'discount', label: 'İndirim', render: (c) => '%' + (c.discount || 0) }, { label: 'Bu ay gönderi', cls: 'right', render: (c) => db.all('ships', (s) => s.cari === c.id && s.at.startsWith(mo)).length }, { label: 'Bu ay tutar', cls: 'right', render: (c) => `<b>${money(sum(db.all('ships', (s) => s.cari === c.id && s.at.startsWith(mo)), (s) => s.price))}</b>` }],
      extraActions: [{ icon: 'print', act: 'inv', title: 'Aylık döküm' }],
      onAction: (a, c) => { const list = db.all('ships', (s) => s.cari === c.id && s.at.startsWith(mo)); NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>AYLIK GÖNDERİ DÖKÜMÜ — ${esc(c.name)} · ${NS.MONTHS[Number(mo.slice(5)) - 1]} ${mo.slice(0, 4)}</h3><table><tr><th>Tarih</th><th>Takip</th><th>Alıcı</th><th>Desi</th><th>Durum</th><th style="text-align:right">Ücret</th></tr>${list.map((s) => `<tr><td>${NS.date(s.at)}</td><td>${esc(s.no)}</td><td>${esc(s.receiver.name)}</td><td>${s.desi}</td><td>${K.ST[s.status][0]}</td><td style="text-align:right">${money(s.price)}</td></tr>`).join('')}<tr><td colspan="5"><b>TOPLAM (${list.length} gönderi)</b></td><td style="text-align:right"><b>${money(sum(list, (s) => s.price))}</b></td></tr></table></div>`, { title: 'Döküm' }); },
    });
  }
  function couriersPage(el, p, app) {
    NS.crud(el, app, { col: 'couriers', title: 'Kuryeler', single: 'Kurye', addLabel: 'Yeni kurye', emptyIcon: 'user', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'vehicle', label: 'Araç', type: 'select', options: ['Motor', 'Panelvan', 'Kamyonet', 'Bisiklet'] }, { name: 'plate', label: 'Plaka' }, { name: 'zoneStr', label: 'Bölgeler (virgülle)', full: true, hint: K.DISTRICTS.join(', ') }], toForm: (r) => ({ ...r, zoneStr: (r.zone || []).join(', ') }), beforeSave: (v) => { v.zone = v.zoneStr.split(',').map((x) => x.trim()).filter(Boolean); delete v.zoneStr; }, columns: [{ key: 'name', label: 'Kurye', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone || '')}</div>` }, { key: 'vehicle', label: 'Araç', render: (c) => `${esc(c.vehicle)} · ${esc(c.plate || '')}` }, { label: 'Bölgeler', render: (c) => (c.zone || []).map((z) => badge(z)).join(' ') }, { label: '30 gün teslim', cls: 'right', render: (c) => db.all('ships', (s) => s.courier === c.id && s.status === 'teslim' && s.at > addDays(new Date(), -30).toISOString()).length }] });
  }
  function reportsPage(el) {
    const all = db.all('ships', (s) => s.at > addDays(new Date(), -30).toISOString());
    const fin = all.filter((s) => ['teslim', 'edilemedi', 'iade'].includes(s.status));
    const hrs = all.filter((s) => s.status === 'teslim').map((s) => (new Date(s.history[s.history.length - 1].at) - new Date(s.at)) / 3600000);
    el.innerHTML = pageHead('Raporlar', 'Son 30 gün') + `<div class="grid g4 mb">${kpi('Gönderi', all.length, 'box')}${kpi('Ciro', money(sum(all, (s) => s.price)), 'trend', 'ok')}${kpi('Ort. teslim süresi', (hrs.length ? sum(hrs) / hrs.length : 0).toFixed(1) + ' saat', 'clock', 'info')}${kpi('İlk denemede teslim', '%' + (fin.length ? Math.round((fin.filter((s) => s.status === 'teslim' && !s.attempts).length / fin.length) * 100) : 0), 'check', 'warn')}</div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>İlçelere göre</h3></div><div class="card-b">${chart.bars(Object.entries(NS.groupBy(all.filter((s) => s.receiver.district), (s) => s.receiver.district)).map(([l, v]) => ({ label: l.slice(0, 6), value: v.length })).sort((a, b) => b.value - a.value))}</div></div>
      <div class="card"><div class="card-h"><h3>Teslim edilememe nedenleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(all.filter((s) => s.failReason), (s) => s.failReason)).map(([label, v]) => ({ label, value: v.length })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Kurumsal / bireysel</h3></div><div class="card-b">${chart.donut([{ label: 'Kurumsal', value: all.filter((s) => s.cari).length }, { label: 'Bireysel', value: all.filter((s) => !s.cari).length }], { size: 120 })}</div></div></div>`;
  }

  const ROLES = { admin: 'Operasyon müdürü', kabul: 'Kabul / şube', kurye: 'Kurye' };
  const app = NS.shell({
    id: 'kargo', integrations: ['sms','whatsapp','label','printer','webhook','backup'], name: 'Kargo & Kurye', tagline: 'Gönderi & Dağıtım Yönetimi', icon: 'truck', accent: '#ea580c', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Operasyon' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['kabul'] }, { id: 'kabul', label: 'Gönderi Kabul', icon: 'plus', roles: ['kabul'] }, { id: 'gonderiler', label: 'Gönderiler', icon: 'box', roles: ['kabul'] }, { id: 'zimmet', label: 'Zimmet & Dağıtım', icon: 'layers', roles: ['kabul'] }, { id: 'kurye', label: 'Kurye Ekranı', icon: 'truck' }, { sec: 'Finans' }, { id: 'mutabakat', label: 'KT Mutabakatı', icon: 'cash', roles: ['admin'] }, { id: 'cariler', label: 'Kurumsal Müşteriler', icon: 'building', roles: ['admin'] }, { id: 'kuryeler', label: 'Kuryeler', icon: 'user', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Tarife & Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, kabul: intakePage, gonderiler: shipsPage, zimmet: assignPage, kurye: courierPage, mutabakat: settlePage, cariler: carisPage, kuryeler: couriersPage, raporlar: reportsPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Tarife' }, { name: 'tiers', label: 'Desi kademeleri (desi:fiyat,...)', full: true, hint: 'Örn. 1:90,5:120,10:160' }, { name: 'perDesi', label: 'Son kademe üstü desi başı (₺)', type: 'number' }, { name: 'codPct', label: 'Kapıda tahsilat komisyonu %', type: 'number' }, { name: 'codMin', label: 'KT en az ücret (₺)', type: 'number' }] }) },
  });
  if (myCourier() && !location.hash.includes('kurye')) app.go('kurye');
})();
