/* NEBSOFT Emlak Ofisi — portföy, talep eşleştirme, gösterim, kira takibi, satış/komisyon */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const E = window.EMLAK;
  const db = new NS.DB('emlak', E.seed);
  const PH = window.PORTALHUB; PH.ensure(db);
  const S = () => db.settings({ commission: 2 });
  const prop = (id) => db.get('props', id) || { title: '-', price: 0 };
  const agent = (id) => db.get('agents', id) || { name: '-', color: '#64748b' };
  const req = (id) => db.get('requests', id) || { name: '-' };
  const short = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' M ₺' : money(n).replace(',00', ''));
  const listingUrl = (p) => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'ilan.html?id=' + p.id;
  const catIcon = (c) => ({ Daire: 'building', Villa: 'home', Arsa: 'map', İşyeri: 'store' }[c] || 'building');
  const card = (p) => `<div class="card pc" data-p="${p.id}"><div class="img" style="background:#334 url(${E.imgUrl(E.photos(p)[0], 520, 300)}) center/cover"><span class="ic">${icon(catIcon(p.cat))}</span><div><span class="badge" style="background:rgba(255,255,255,.2);color:#fff;border:0">${E.TYPE[p.type]}</span> ${p.status !== 'aktif' ? badge(E.ST[p.status][0], E.ST[p.status][1]) : ''}</div></div>
    <div class="bd"><div class="pr">${short(p.price)}${p.type === 'kiralik' ? '<span class="small faint">/ay</span>' : ''}</div><b style="font-size:13px">${esc(p.title)}</b><div class="small muted">${icon('map')} ${esc(p.district)} / ${esc(p.nb)}</div>
    <div class="spec">${p.rooms !== '-' ? `<span>${icon('bed')} ${p.rooms}</span>` : ''}<span>${icon('grid')} ${p.m2} m²</span>${p.floor ? `<span>${p.floor}. kat</span>` : ''}<span>${p.age} yaş</span></div><div class="small faint mt">${esc(p.no)} · ${esc(agent(p.agent).name)} · ${num(p.views)} görüntülenme</div></div></div>`;

  const PF = () => [{ name: 'title', label: 'İlan başlığı', required: true, full: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'satilik', label: 'Satılık' }, { value: 'kiralik', label: 'Kiralık' }] }, { name: 'cat', label: 'Kategori', type: 'select', options: ['Daire', 'Villa', 'Arsa', 'İşyeri'] }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'district', label: 'İlçe', required: true }, { name: 'nb', label: 'Mahalle' }, { name: 'rooms', label: 'Oda sayısı', type: 'select', options: ['-', '1+0', '1+1', '2+1', '3+1', '4+1', '5+1'] }, { name: 'm2', label: 'm²', type: 'number' }, { name: 'floor', label: 'Kat', type: 'number' }, { name: 'age', label: 'Bina yaşı', type: 'number' }, { name: 'dues', label: 'Aidat', type: 'number' }, { name: 'heating', label: 'Isıtma', type: 'select', options: ['Kombi', 'Merkezi', 'Yerden ısıtma', 'Klima', 'Soba', 'Yok'] }, { name: 'owner', label: 'Mal sahibi' }, { name: 'ownerPhone', label: 'Mal sahibi tel.' }, { name: 'agent', label: 'Danışman', type: 'select', options: db.all('agents').map((a) => ({ value: a.id, label: a.name })) }, { name: 'status', label: 'Durum', type: 'select', options: Object.entries(E.ST).map(([value, v]) => ({ value, label: v[0] })) }, { name: 'furnished', label: 'Eşyalı', type: 'checkbox' }, { name: 'lat', label: 'Enlem (harita)', placeholder: 'ör. 38.4595' }, { name: 'lng', label: 'Boylam (harita)', placeholder: 'ör. 27.1150' }, { name: 'photoList', label: 'Fotoğraf adresleri (her satıra bir URL — boşsa kategoriye uygun örnek görseller)', type: 'textarea', full: true }, { name: 'video', label: 'Video / sanal tur bağlantısı (YouTube, Matterport)', full: true }, { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }];

  function portfolioPage(el, p, app) {
    let q = '', t = '', st = 'aktif', view = 'grid';
    el.innerHTML = pageHead('Portföy', 'Satılık ve kiralık ilanlarınız', `<div class="seg"><button data-v="grid" class="active">${icon('grid')}</button><button data-v="list">${icon('list')}</button></div><button class="btn primary" id="np">${icon('plus')} Yeni ilan</button>`) + `<div class="card mb"><div class="card-h">${NS.searchBox('q', 'Başlık, ilçe, mahalle, ilan no...')}<div class="seg">${[['', 'Tümü'], ['satilik', 'Satılık'], ['kiralik', 'Kiralık']].map(([v, l]) => `<button data-t="${v}" class="${v === t ? 'active' : ''}">${l}</button>`).join('')}</div><select class="input" id="st" style="max-width:160px"><option value="">Tüm durumlar</option>${Object.entries(E.ST).map(([k, v]) => `<option value="${k}" ${k === st ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div></div><div id="g"></div>`;
    const draw = () => {
      const rows = db.all('props', (x) => (!t || x.type === t) && (!st || x.status === st) && NS.match(q, x.title, x.district, x.nb, x.no, x.owner)).sort((a, b) => b.created.localeCompare(a.created));
      $('#g', el).innerHTML = view === 'grid' ? `<div class="pgrid2">${rows.map(card).join('')}</div>${rows.length ? '' : '<div class="empty">İlan yok</div>'}` : `<div class="card">${table({ rows, columns: [{ label: 'İlan', render: (x) => `<b>${esc(x.title)}</b><div class="small faint">${esc(x.no)}</div>` }, { label: 'Konum', render: (x) => `${esc(x.district)} / ${esc(x.nb)}` }, { label: 'Oda / m²', render: (x) => `${x.rooms} · ${x.m2} m²` }, { label: 'Fiyat', cls: 'right', render: (x) => `<b>${money(x.price)}</b>` }, { label: 'Durum', render: (x) => badge(E.ST[x.status][0], E.ST[x.status][1]) }, { label: 'Danışman', render: (x) => esc(agent(x.agent).name) }], actions: [{ icon: 'eye', act: 'v' }] })}</div>`;
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#st', el).onchange = (e) => { st = e.target.value; draw(); };
    on(el, 'click', '[data-t]', (e, b) => { t = b.dataset.t; $$('[data-t]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-v]', (e, b) => { view = b.dataset.v; $$('[data-v]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-p]', (e, b) => app.go('ilan', b.dataset.p));
    on(el, 'click', '[data-act=v]', (e, b) => app.go('ilan', b.dataset.id));
    $('#np', el).onclick = async () => { const v = await formModal({ title: 'Yeni ilan', size: 'wide', fields: PF(), values: { type: 'satilik', cat: 'Daire', status: 'aktif', rooms: '3+1', agent: (NS.currentUser && NS.currentUser.agent) || 'a1', color: NS.pick(NS.PALETTE) } }); if (v) { const n = db.insert('props', { ...v, no: 'ILN' + (7000 + db.all('props').length + 50), city: 'İzmir', features: [], views: 0 }); db.log('Yeni ilan', n.title); app.go('ilan', n.id); } };
    draw();
  }
  function propPage(el, id, app) {
    const p = db.get('props', id); if (!p) return app.go('portfoy');
    const matches = db.all('requests', (r) => r.status === 'aktif').map((r) => ({ ...r, s: E.score(r, p) })).filter((r) => r.s >= 55).sort((a, b) => b.s - a.s);
    const shows = db.all('showings', (s) => s.prop === id).sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = `<div class="row mb"><a class="btn" href="#/portfoy">${icon('back')} Portföy</a><span class="grow"></span><a class="btn" href="${listingUrl(p)}" target="_blank">${icon('globe')} İlan sayfası</a><button class="btn" id="sh">${icon('copy')} Linki kopyala</button><button class="btn" id="pub">${icon('send')} Portallara gönder</button><button class="btn" id="ed">${icon('edit')} Düzenle</button>${p.status === 'aktif' || p.status === 'opsiyon' ? `<button class="btn primary" id="cl">${icon('check')} ${p.type === 'satilik' ? 'Satıldı' : 'Kiralandı'} olarak kapat</button>` : ''}</div>
      <div class="grid g-21"><div class="col" style="gap:16px">
        <div class="card pc" style="cursor:default"><div class="img" style="height:260px;background:#334 url(${E.imgUrl(E.photos(p)[0], 1100)}) center/cover"><span class="ic">${icon(catIcon(p.cat))}</span><div><h1 style="color:#fff">${esc(p.title)}</h1><div>${icon('map')} ${esc(p.district)} / ${esc(p.nb)} · ${esc(p.no)}</div></div></div>
          <div class="bd"><div class="row"><div class="pr" style="font-size:28px">${money(p.price)}${p.type === 'kiralik' ? '<span class="small faint">/ay</span>' : ''}</div><span class="grow"></span>${badge(E.TYPE[p.type], 'acc')} ${badge(E.ST[p.status][0], E.ST[p.status][1])}</div>
          <div class="grid g4 mt">${[['Oda', p.rooms], ['Alan', p.m2 + ' m²'], ['Kat', p.floor || '-'], ['Bina yaşı', p.age], ['Aidat', p.dues ? money(p.dues) : '-'], ['Isıtma', p.heating], ['Eşyalı', p.furnished ? 'Evet' : 'Hayır'], ['m² fiyatı', p.type === 'satilik' ? money(Math.round(p.price / p.m2)) : '-']].map(([k, v]) => `<div><div class="small faint">${k}</div><b>${esc(String(v))}</b></div>`).join('')}</div>
          <p class="mt">${esc(p.desc || '')}</p><div class="row mt gap-s">${(p.features || []).map((f) => badge(f)).join('')}</div></div></div>
        <div class="card"><div class="card-h"><h3>Gösterimler</h3><button class="btn sm" id="ns">${icon('plus')} Gösterim planla</button></div>${table({ rows: shows, empty: 'Gösterim yok', columns: [{ label: 'Tarih', render: (s) => `${NS.date(s.date)} ${s.time}` }, { label: 'Müşteri', render: (s) => esc(req(s.request).name) }, { label: 'Danışman', render: (s) => esc(agent(s.agent).name) }, { label: 'Sonuç', render: (s) => esc(s.result || (s.date >= today() ? 'Planlandı' : '-')) }] })}</div>
      </div><div class="col" style="gap:16px">
        <div class="card pad"><h3 class="mb">Mal sahibi</h3><b>${esc(p.owner || '-')}</b><div class="small muted">${esc(p.ownerPhone || '')}</div><h3 class="mb mt">Danışman</h3><b style="color:${agent(p.agent).color}">${esc(agent(p.agent).name)}</b><div class="small muted">${esc(agent(p.agent).phone)}</div><div class="small muted mt">${icon('eye')} ${num(p.views)} görüntülenme · ${NS.ago(p.created)} eklendi</div>${p.authNo ? `<div class="small mt">${badge('Yetki belgesi ' + p.authNo + (p.authEnd ? ' · ' + NS.date(p.authEnd) : ''), p.authEnd && p.authEnd < today() ? 'err' : 'ok')}</div>` : ''}${p.portals ? `<div class="row mt gap-s">${Object.entries(p.portals).map(([k, v]) => badge(`${k}: ${v}`, v === 'kaldırıldı' ? '' : 'info')).join('')}</div>` : ''}</div>
        <div class="card"><div class="card-h"><h3>${icon('zap')} Uygun müşteriler (${matches.length})</h3></div><div class="card-b">${matches.map((r) => `<div class="list-item"><div class="grow"><b>${esc(r.name)}</b><div class="small faint">Bütçe ${short(r.budgetMax)} · ${esc(r.district || 'her yer')} ${esc(r.rooms || '')}</div></div>${badge('%' + r.s, r.s >= 80 ? 'ok' : 'warn')}<a class="btn sm icon" target="_blank" rel="noopener" href="https://wa.me/90${String(r.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${r.name}, aradığınız kriterlere uygun bir ilanımız var: ${p.title} — ${money(p.price)}. Detaylar: ${listingUrl(p)}`)}">${icon('message')}</a></div>`).join('') || '<div class="faint small">Eşleşen talep yok</div>'}</div></div>
        <div class="card pad center"><div class="small muted mb">İlan QR kodu</div>${NS.qrSvg(listingUrl(p), 120)}</div>
      </div></div>`;
    $('#sh', el).onclick = () => { navigator.clipboard && navigator.clipboard.writeText(listingUrl(p)); toast('İlan linki kopyalandı', 'ok'); };
    // İlan portalları: Taşınmaz Ticareti Yönetmeliği gereği yetki belgesi no ilanda zorunludur
    $('#pub', el).onclick = async () => {
      const provs = NS.integ ? NS.integ.CONN.ilan[4] : { sahibinden: 'sahibinden.com', hepsiemlak: 'Hepsiemlak', emlakjet: 'Emlakjet' };
      const v = await formModal({ title: 'İlan portallarına gönder', fields: [...Object.entries(provs).map(([k, l]) => ({ name: 'p_' + k, label: l, type: 'checkbox', value: true })), { name: 'authNo', label: 'Yetki belgesi no (zorunlu)', required: true, value: p.authNo || '' }, { name: 'authEnd', label: 'Yetki bitiş tarihi', type: 'date', value: p.authEnd || iso(addDays(new Date(), 90)) }, { name: 'doping', label: 'Öne çıkarma (doping)', type: 'checkbox' }], values: {} });
      if (!v) return; p.authNo = v.authNo; p.authEnd = v.authEnd; p.portals = p.portals || {};
      for (const [k, l] of Object.entries(provs)) { if (!v['p_' + k]) continue; const r = NS.integ ? await NS.integ.call('ilan', p.portals[l] ? 'guncelle' : 'yayinla', { portal: k, no: p.no, title: p.title, type: p.type, cat: p.cat, price: p.price, rooms: p.rooms, m2: p.m2, district: p.district, nb: p.nb, desc: p.desc, features: p.features, authNo: p.authNo, doping: v.doping }, { silent: true }) : null; if (r && r.ok) p.portals[l] = 'yayında'; else if (r && !r.disabled) p.portals[l] = 'hata'; else if (r && r.disabled) { toast('İlan portalları bağlantısı kapalı — Entegrasyonlar sayfasından açın', 'err'); break; } }
      db.save(); app.refresh();
    };
    $('#ed', el).onclick = async () => { const v = await formModal({ title: 'İlanı düzenle', size: 'wide', fields: PF(), values: p }); if (v) { db.update('props', id, v); app.refresh(); } };
    if ($('#cl', el)) $('#cl', el).onclick = async () => {
      const sale = p.type === 'satilik';
      const v = await formModal({ title: sale ? 'Satış kaydı' : 'Kira sözleşmesi', fields: [{ name: 'buyer', label: sale ? 'Alıcı' : 'Kiracı', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'price', label: sale ? 'Satış bedeli' : 'Aylık kira', type: 'number', value: p.price, required: true }, { name: 'pct', label: sale ? 'Komisyon % (taraf başı)' : 'Komisyon (kiranın %si)', type: 'number', value: sale ? S().commission : S().rentCommission || 100 }, ...(sale ? [] : [{ name: 'start', label: 'Başlangıç', type: 'date', value: today() }, { name: 'deposit', label: 'Depozito', type: 'number', value: p.price * 2 }])] });
      if (!v) return;
      p.status = sale ? 'satildi' : 'kiralandi';
      db.insert('deals', { prop: id, buyer: v.buyer, price: v.price, pct: v.pct, date: today(), agent: p.agent, kind: sale ? 'satis' : 'kira' }, true);
      if (!sale) { const st = v.start || today(); db.insert('leases', { prop: id, tenant: v.buyer, tenantPhone: v.phone, rent: v.price, deposit: v.deposit, start: st, end: iso(addDays(st, 365)), payDay: Number(st.slice(8)) || 5, payments: [{ period: st.slice(0, 7), paid: true }] }, true); }
      if (p.portals && NS.integ) Object.keys(p.portals).forEach((l) => { if (p.portals[l] === 'yayında') { NS.integ.call('ilan', 'kaldir', { portal: l, no: p.no }, { silent: true }); p.portals[l] = 'kaldırıldı'; } });
      db.log(sale ? 'Satış' : 'Kiralama', `${p.title} · ${money(v.price)}`); db.save(); toast('Kaydedildi, komisyon hesaplandı', 'ok'); app.refresh();
    };
    $('#ns', el).onclick = () => showForm(app, { prop: id });
  }
  async function showForm(app, rec = {}) {
    const v = await formModal({ title: 'Gösterim planla', fields: [{ name: 'prop', label: 'İlan', type: 'select', options: db.all('props', (p) => ['aktif', 'opsiyon'].includes(p.status)).map((p) => ({ value: p.id, label: `${p.no} · ${p.title}` })) }, { name: 'request', label: 'Müşteri', type: 'select', options: db.all('requests').map((r) => ({ value: r.id, label: r.name })) }, { name: 'date', label: 'Tarih', type: 'date', value: today() }, { name: 'time', label: 'Saat', type: 'time', value: '14:00' }, { name: 'agent', label: 'Danışman', type: 'select', options: db.all('agents').map((a) => ({ value: a.id, label: a.name })) }, { name: 'result', label: 'Sonuç / not', full: true }], values: { agent: (NS.currentUser && NS.currentUser.agent) || 'a1', ...rec } });
    if (v) { if (rec.id) db.update('showings', rec.id, v); else db.insert('showings', v); toast('Kaydedildi', 'ok'); app.refresh(); }
  }
  function requestsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'requests', title: 'Müşteri Talepleri', sub: 'Alıcı ve kiracı adaylarının kriterleri — uygun ilanlar otomatik eşleşir', single: 'Talep', addLabel: 'Yeni talep', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', required: true }, { name: 'type', label: 'Arıyor', type: 'select', options: [{ value: 'satilik', label: 'Satılık' }, { value: 'kiralik', label: 'Kiralık' }] }, { name: 'cat', label: 'Kategori', type: 'select', options: ['Daire', 'Villa', 'Arsa', 'İşyeri'] }, { name: 'district', label: 'İlçe (boş = farketmez)' }, { name: 'rooms', label: 'Oda', type: 'select', options: ['', '1+1', '2+1', '3+1', '4+1'] }, { name: 'budgetMax', label: 'Maks. bütçe (₺)', type: 'number' }, { name: 'm2Min', label: 'Min. m²', type: 'number' }, { name: 'status', label: 'Durum', type: 'select', options: [{ value: 'aktif', label: 'Aktif' }, { value: 'pasif', label: 'Pasif' }, { value: 'tamam', label: 'Ev buldu' }] }, { name: 'note', label: 'Not', full: true }],
      defaults: { status: 'aktif', type: 'satilik', cat: 'Daire' }, searchFields: (r) => [r.name, r.phone, r.district],
      columns: [{ key: 'name', label: 'Müşteri', render: (r) => `<b>${esc(r.name)}</b><div class="small faint">${esc(r.phone)}</div>` }, { label: 'Kriter', render: (r) => `${E.TYPE[r.type]} ${esc(r.cat)} ${esc(r.rooms || '')} · ${esc(r.district || 'her yer')}${r.note ? `<div class="small faint">${esc(r.note)}</div>` : ''}` }, { key: 'budgetMax', label: 'Bütçe', cls: 'right', render: (r) => short(r.budgetMax || 0) }, { label: 'Eşleşme', cls: 'right', render: (r) => { const n = db.all('props', (x) => E.score(r, x) >= 55).length; return n ? badge(n + ' ilan', 'ok') : '<span class="faint">0</span>'; } }, { key: 'status', label: 'Durum', render: (r) => badge({ aktif: 'Aktif', pasif: 'Pasif', tamam: 'Ev buldu' }[r.status], r.status === 'aktif' ? 'ok' : '') }],
      extraActions: [{ icon: 'zap', act: 'm', title: 'Eşleşen ilanlar' }],
      onAction: (a, r) => { const ms = db.all('props').map((x) => ({ ...x, s: E.score(r, x) })).filter((x) => x.s >= 55).sort((x, y) => y.s - x.s); modal({ title: `${r.name} için uygun ilanlar`, size: 'wide', body: ms.length ? `<div class="pgrid2">${ms.map((x) => card(x).replace('<div class="card pc"', `<div class="card pc" title="Uyum %${x.s}"`)).join('')}</div>` : '<div class="empty">Eşleşen ilan yok</div>', onOpen: (b, c) => on(b, 'click', '[data-p]', (e, x) => { c(); app.go('ilan', x.dataset.p); }) }); },
    });
  }
  function showingsPage(el, p, app) {
    const rows = db.all('showings').sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));
    el.innerHTML = pageHead('Gösterimler', 'Yer gösterme randevuları ve sonuçları', `<button class="btn primary" id="ns">${icon('plus')} Gösterim planla</button>`) + `<div class="card">${table({ rows, columns: [{ label: 'Tarih', render: (s) => `<b>${NS.date(s.date)} ${s.time}</b>${s.date === today() ? ' ' + badge('Bugün', 'warn') : ''}` }, { label: 'İlan', render: (s) => `<a href="#/ilan/${s.prop}">${esc(prop(s.prop).title)}</a>` }, { label: 'Müşteri', render: (s) => `${esc(req(s.request).name)}<div class="small faint">${esc(req(s.request).phone || '')}</div>` }, { label: 'Danışman', render: (s) => `<span style="color:${agent(s.agent).color}">${esc(agent(s.agent).name)}</span>` }, { label: 'Sonuç', render: (s) => esc(s.result || '-') }], actions: [{ icon: 'edit', act: 'e' }] })}</div>`;
    $('#ns', el).onclick = () => showForm(app);
    on(el, 'click', '[data-act=e]', (e, b) => showForm(app, db.get('showings', b.dataset.id)));
  }
  function leasesPage(el, p, app) {
    const cur = today().slice(0, 7);
    const rows = db.all('leases');
    el.innerHTML = pageHead('Kira Takibi', 'Yönetimdeki kiralık mülkler ve aylık tahsilat') + `
      <div class="grid g4 mb">${kpi('Yönetilen mülk', rows.length, 'key')}${kpi('Aylık kira toplamı', money(sum(rows, (l) => l.rent)), 'wallet', 'ok')}${kpi('Bu ay ödenmeyen', rows.filter((l) => !(l.payments.find((x) => x.period === cur) || {}).paid).length, 'alert', 'err')}${kpi('60 günde biten sözleşme', rows.filter((l) => l.end <= iso(addDays(new Date(), 60))).length, 'clock', 'warn')}</div>
      <div class="card">${table({ rows, columns: [{ label: 'Mülk', render: (l) => `<a href="#/ilan/${l.prop}"><b>${esc(prop(l.prop).title)}</b></a>` }, { label: 'Kiracı', render: (l) => `${esc(l.tenant)}<div class="small faint">${esc(l.tenantPhone || '')}</div>` }, { label: 'Kira', cls: 'right', render: (l) => `<b>${money(l.rent)}</b>` }, { label: 'Sözleşme', render: (l) => `${NS.date(l.start)} – ${NS.date(l.end)}${l.end <= iso(addDays(new Date(), 60)) ? '<div class="small" style="color:var(--warn)">Yenileme yaklaşıyor</div>' : ''}` }, { label: 'Bu ay', render: (l) => ((l.payments.find((x) => x.period === cur) || {}).paid ? badge('Ödendi', 'ok') : badge('Bekliyor', 'err')) }, { label: 'Son 6 ay', render: (l) => l.payments.slice(-6).map((x) => `<span class="dot ${x.paid ? 'ok' : 'err'}" title="${x.period}"></span>`).join(' ') }], actions: [{ label: 'Ödendi', act: 'pay', show: (l) => !(l.payments.find((x) => x.period === cur) || {}).paid }, { icon: 'message', act: 'wa', title: 'Hatırlat' }] })}</div>`;
    on(el, 'click', '[data-act]', (e, b) => {
      const l = db.get('leases', b.dataset.id);
      if (b.dataset.act === 'wa') return window.open(`https://wa.me/90${String(l.tenantPhone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${l.tenant}, ${NS.MONTHS[new Date().getMonth()]} ayı kira bedeli ${money(l.rent)} hatırlatmasıdır. ${S().bizName}`)}`, '_blank', 'noopener');
      const x = l.payments.find((y) => y.period === cur); if (x) x.paid = true; else l.payments.push({ period: cur, paid: true });
      db.save(); toast('Kira ödendi olarak işaretlendi', 'ok'); app.refresh();
    });
  }
  const commission = (d) => (d.kind === 'kira' ? d.price * d.pct / 100 : d.price * d.pct / 100 * 2);
  function dashboard(el, p, app) {
    const props = db.all('props');
    const deals = db.all('deals', (d) => d.date >= iso(addDays(new Date(), -90)));
    const shows = db.all('showings', (s) => s.date >= today()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/portfoy">${icon('grid')} Portföy</a><button class="btn primary" id="ns">${icon('calendar')} Gösterim planla</button>`) + `
      <div class="grid g4 mb">${kpi('Aktif ilan', props.filter((x) => x.status === 'aktif').length, 'building', '', `<div class="small faint">${props.filter((x) => x.status === 'aktif' && x.type === 'satilik').length} satılık · ${props.filter((x) => x.status === 'aktif' && x.type === 'kiralik').length} kiralık</div>`)}${kpi('Aktif talep', db.all('requests', (r) => r.status === 'aktif').length, 'users', 'info')}${kpi('90 gün işlem', deals.length, 'check', 'ok')}${kpi('90 gün komisyon', money(sum(deals, commission)), 'wallet', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Yaklaşan gösterimler</h3></div>${table({ rows: shows.slice(0, 8), empty: 'Planlı gösterim yok', columns: [{ label: 'Tarih', render: (s) => `<b>${NS.date(s.date)} ${s.time}</b>` }, { label: 'İlan', render: (s) => `<a href="#/ilan/${s.prop}">${esc(prop(s.prop).title)}</a>` }, { label: 'Müşteri', render: (s) => esc(req(s.request).name) }, { label: 'Danışman', render: (s) => esc(agent(s.agent).name) }] })}</div>
      <div class="card"><div class="card-h"><h3>Danışman komisyonları (90 gün)</h3></div><div class="card-b">${chart.bars(db.all('agents').map((a) => ({ label: a.name.split(' ')[0], value: sum(deals.filter((d) => d.agent === a.id), commission), color: a.color })), { format: money })}</div></div></div>
      <h2 class="mb">En çok görüntülenen ilanlar</h2><div class="pgrid2">${props.filter((x) => x.status === 'aktif').sort((a, b) => b.views - a.views).slice(0, 4).map(card).join('')}</div>`;
    $('#ns', el).onclick = () => showForm(app);
    on(el, 'click', '[data-p]', (e, b) => app.go('ilan', b.dataset.p));
  }
  function dealsPage(el) {
    const rows = db.all('deals').sort((a, b) => b.date.localeCompare(a.date));
    el.innerHTML = pageHead('Satış & Komisyon', 'Kapanan işlemler ve danışman hakedişleri') + `<div class="grid g3 mb">${kpi('Toplam işlem', rows.length, 'check')}${kpi('Satış hacmi', short(sum(rows.filter((d) => d.kind === 'satis'), (d) => d.price)), 'trend', 'ok')}${kpi('Toplam komisyon', money(sum(rows, commission)), 'wallet', 'warn')}</div>
      <div class="card">${table({ rows, columns: [{ label: 'Tarih', render: (d) => NS.date(d.date) }, { label: 'Mülk', render: (d) => `<a href="#/ilan/${d.prop}">${esc(prop(d.prop).title)}</a>` }, { label: 'Tür', render: (d) => badge(d.kind === 'satis' ? 'Satış' : 'Kiralama', d.kind === 'satis' ? 'acc' : 'info') }, { label: 'Müşteri', key: 'buyer' }, { label: 'Bedel', cls: 'right', render: (d) => money(d.price) }, { label: 'Danışman', render: (d) => esc(agent(d.agent).name) }, { label: 'Komisyon', cls: 'right', render: (d) => `<b>${money(commission(d))}</b>` }] })}</div>`;
  }

  // Web sitesinden gelen başvurular (bilgi, yer gösterme, değerleme, ilan alarmı, mülk listeleme, iletişim)
  const LK = { bilgi: ['Bilgi talebi', 'info'], gosterim: ['Yer gösterme', 'acc'], degerleme: ['Değerleme', 'warn'], alarm: ['İlan alarmı', ''], portfoy: ['Mülk listeleme', 'ok'], iletisim: ['İletişim', ''] };
  const LS = { yeni: ['Yeni', 'err'], arandi: ['Arandı', 'warn'], donustu: ['Talebe dönüştü', 'ok'], kapandi: ['Kapandı', ''] };
  function leadsPage(el) {
    let kind = '';
    const draw = () => {
      db.load();
      const all = db.all('leads').sort((a, b) => b.at.localeCompare(a.at)); const rows = all.filter((l) => !kind || l.kind === kind);
      const wk = all.filter((l) => l.at >= addDays(new Date(), -7).toISOString());
      el.innerHTML = pageHead('Web Başvuruları', 'İlan sitesinden gelen formlar, randevu ve değerleme talepleri', `<a class="btn" href="ilan.html" target="_blank">${icon('globe')} Siteyi aç</a>`) + `<div class="grid g4 mb">${kpi('Yeni başvuru', all.filter((l) => l.status === 'yeni').length, 'bell', 'err')}${kpi('Son 7 gün', wk.length, 'trend')}${kpi('Yer gösterme', all.filter((l) => l.kind === 'gosterim').length, 'calendar', 'acc')}${kpi('Dönüşüm', all.length ? '%' + Math.round((all.filter((l) => l.status === 'donustu').length / all.length) * 100) : '-', 'zap', 'ok')}</div>
        <div class="seg mb"><button data-k="" class="${!kind ? 'active' : ''}">Tümü (${all.length})</button>${Object.entries(LK).map(([k, v]) => `<button data-k="${k}" class="${kind === k ? 'active' : ''}">${v[0]} (${all.filter((l) => l.kind === k).length})</button>`).join('')}</div>
        <div class="card">${table({ rows, empty: 'Henüz web başvurusu yok', columns: [{ label: 'Tarih', render: (l) => `${NS.date(l.at)}<div class="small faint">${NS.ago(l.at)}</div>` }, { label: 'Tür', render: (l) => badge(...(LK[l.kind] || [l.kind, ''])) }, { label: 'Kişi', render: (l) => `<b>${esc(l.name || '-')}</b><div class="small muted">${esc(l.phone || '')}${l.email ? ' · ' + esc(l.email) : ''}</div>` }, { label: 'İlan', render: (l) => (l.prop ? `<a href="#/ilan/${l.prop}">${esc(prop(l.prop).no || '')}</a><div class="small faint">${esc(prop(l.prop).title)}</div>` : '-') }, { label: 'Mesaj', render: (l) => `<span class="small">${esc(l.msg || '')}</span>` }, { label: 'Durum', render: (l) => badge(...(LS[l.status] || [l.status, ''])) }, { label: '', cls: 'right nw', render: (l) => `${l.phone ? `<a class="btn sm icon" title="WhatsApp" target="_blank" rel="noopener" href="https://wa.me/90${String(l.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${l.name || ''}, ${S().bizName} olarak web sitemizden ilettiğiniz talep için yazıyoruz.`)}">${icon('message')}</a>` : ''}${l.status === 'yeni' ? `<button class="btn sm" data-act="call" data-id="${l.id}">Arandı</button>` : ''}${!l.request && l.status !== 'kapandi' ? `<button class="btn sm" data-act="req" data-id="${l.id}" title="Müşteri talebine dönüştür">${icon('users')} Talep</button>` : ''}${l.status !== 'kapandi' ? `<button class="btn sm ghost" data-act="close" data-id="${l.id}">Kapat</button>` : ''}` }] })}</div>`;
    };
    on(el, 'click', '[data-k]', (e, b) => { kind = b.dataset.k; draw(); });
    on(el, 'click', '[data-act]', (e, b) => {
      const l = db.get('leads', b.dataset.id); if (!l) return;
      if (b.dataset.act === 'call') { l.status = 'arandi'; db.log('Web başvurusu arandı', l.name); }
      if (b.dataset.act === 'close') { l.status = 'kapandi'; db.log('Web başvurusu kapatıldı', l.name); }
      if (b.dataset.act === 'req') { const p = l.prop ? prop(l.prop) : {}; const r = db.insert('requests', { name: l.name, phone: l.phone, type: l.type || p.type || 'satilik', cat: p.cat || 'Daire', district: p.district || '', rooms: p.rooms && p.rooms !== '-' ? p.rooms : '', budgetMax: p.price ? Math.round(p.price * 1.1) : 0, m2Min: 0, note: 'Web: ' + (l.msg || LK[l.kind][0]), status: 'aktif', agent: l.agent || p.agent || (db.all('agents')[0] || {}).id, created: new Date().toISOString(), source: 'web' }, true); l.request = r.id; l.status = 'donustu'; db.log('Web başvurusu talebe dönüştü', l.name); toast('Müşteri talebi oluşturuldu', 'ok'); }
      db.save(); draw();
    });
    draw();
  }

  const ROLES = { admin: 'Broker / Yönetici', danisman: 'Danışman' };
  NS.shell({
    id: 'emlak', integrations: ['sms', 'whatsapp', 'email', 'efatura', 'printer', 'webhook', 'backup'], name: 'Emlak Ofisi', tagline: 'Gayrimenkul CRM', icon: 'building', accent: '#ca8a04', db, home: 'ozet', badges: () => ({ web: db.all('leads', (l) => l.status === 'yeni').length || '' }), auth: { roles: ROLES }, titles: { ilan: 'İlan detayı' },
    nav: [{ sec: 'Ofis' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'portfoy', label: 'Portföy', icon: 'grid' }, PH.nav, { id: 'talepler', label: 'Müşteri Talepleri', icon: 'users' }, { id: 'web', label: 'Web Başvuruları', icon: 'globe', badge: true }, { id: 'gosterimler', label: 'Gösterimler', icon: 'calendar' }, { id: 'kiralar', label: 'Kira Takibi', icon: 'key' }, { sec: 'Yönetim' }, { id: 'islemler', label: 'Satış & Komisyon', icon: 'wallet', roles: ['admin'] }, { id: 'danismanlar', label: 'Danışmanlar', icon: 'user', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: {
      ...PH.routes, ozet: dashboard, portfoy: portfolioPage, ilan: propPage, talepler: requestsPage, web: leadsPage, gosterimler: showingsPage, kiralar: leasesPage, islemler: dealsPage,
      danismanlar: (el, p, a) => NS.crud(el, a, { col: 'agents', title: 'Danışmanlar', single: 'Danışman', addLabel: 'Yeni danışman', fields: [{ name: 'name', label: 'Ad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'color', label: 'Renk', type: 'color' }], columns: [{ key: 'name', label: 'Danışman', render: (x) => `<b style="color:${x.color}">${esc(x.name)}</b>` }, { key: 'phone', label: 'Telefon' }, { label: 'Aktif ilan', cls: 'right', render: (x) => db.all('props', (pp) => pp.agent === x.id && pp.status === 'aktif').length }, { label: 'İşlem', cls: 'right', render: (x) => db.all('deals', (d) => d.agent === x.id).length }, { label: 'Komisyon', cls: 'right', render: (x) => money(sum(db.all('deals', (d) => d.agent === x.id), commission)) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Komisyon ve iletişim' }, { name: 'commission', label: 'Satış komisyonu % (taraf başı)', type: 'number' }, { name: 'rentCommission', label: 'Kira komisyonu (kiranın %si)', type: 'number' }, { name: 'whatsapp', label: 'İlan sayfası WhatsApp numarası' }] }),
    },
  });
})();
