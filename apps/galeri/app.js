/* NEBSOFT Oto Galeri — araç stoğu, alış + masraf = gerçek maliyet, ekspertiz/tramer, ilan portalları,
   satış ve araç başına kâr, konsinye araçlar, müşteri talebi ↔ stok eşleştirme, vitrin sayfası */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const G = window.GLR;
  const db = new NS.DB('galeri', G.seed);
  const S = () => db.settings({});
  const stB = (s) => badge(G.ST[s][0], G.ST[s][1]);
  const title = (v) => `${v.year} ${v.brand} ${v.model}`;
  const ageB = (v) => { const d = G.days(v); return v.status === 'satildi' ? `<span class="small faint">${d} günde satıldı</span>` : d > (Number(S().staleDays) || 60) ? badge(`${d} gün`, 'err') : d > 30 ? badge(`${d} gün`, 'warn') : `<span class="small">${d} gün</span>`; };
  const pB = (n) => `<b style="color:var(--${n < 0 ? 'err' : 'ok'})">${money(n)}</b>`;
  // SMS: sonuç beklenir — gönderilmeyen "gönderildi" görünmez; olmazsa WhatsApp önerilir
  const waLink = (phone, text) => `https://wa.me/90${String(phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;
  async function tell(to, name, text, what) {
    const r = db.insert('sms', { to, name, text, at: new Date().toISOString(), status: 'gönderiliyor' }, true);
    const res = NS.integ ? await NS.integ.sms(to, text, { silent: true }) : { ok: false, error: 'SMS bağlantısı yok' };
    r.status = res.simulated ? 'TEST — gönderilmedi' : res.ok ? 'gönderildi' : 'gönderilmedi: ' + String(res.error || '').slice(0, 60); db.save();
    if (res.ok && !res.simulated) { toast(`${what}: SMS gönderildi`, 'ok'); return true; }
    if (await confirm(`${what} SMS ile gönderilemedi (${res.simulated ? 'TEST modu — gerçek gönderim yapılmadı' : res.error || 'hata'}). WhatsApp ile göndermek ister misiniz?`, { title: 'Bildirim', ok: 'WhatsApp ile gönder', danger: false })) window.open(waLink(to, text), '_blank', 'noopener');
    return false;
  }
  const noExp = (v) => v.expertise === false;
  const seeCost = () => !NS.app || !NS.app.can || NS.app.can(); // alış, maliyet ve kâr galeri sahibine özel; danışman ilan ve en düşük fiyatı görür
  const optLate = (v) => v.status === 'opsiyon' && v.option && v.option.until && v.option.until < today();
  const adsB = (v) => { const n = Object.keys(v.ads || {}).length; return n ? `<span class="small">${n} ilan</span>` : '<span class="faint small">yok</span>'; };
  // Talep ↔ araç: kasa ve bütçe (%5 pay)
  const fits = (l, v) => (!l.body || v.body === l.body) && v.listPrice <= (l.budget || Infinity) * 1.05;
  const PH_MAX = 6; // araç başına
  const nextStock = () => 'G' + (Math.max(299, ...db.all('vehicles').map((x) => Number(String(x.stockNo).replace(/\D/g, '')) || 0)) + 1);
  const match = (l) => db.all('vehicles', (v) => !['satildi', 'hazirlik'].includes(v.status) && fits(l, v)).sort((a, b) => b.listPrice - a.listPrice);

  // ---------- Araç detayı ----------
  function carModal(app, v) {
    const exp = sum(v.expenses || [], (e) => e.amount);
    const m = modal({ title: `${v.stockNo} · ${title(v)}`, size: 'wide', body: `<div class="grid g2"><div class="col">
        ${(v.photos || []).length ? `<div class="row" style="gap:6px;flex-wrap:wrap">${v.photos.map((u) => `<img src="${esc(u)}" alt="" style="width:84px;height:62px;object-fit:cover;border-radius:6px">`).join('')}</div>` : ''}
        ${v.option && v.status === 'opsiyon' ? `<div class="card pad small"><b>Opsiyon:</b> ${esc(v.option.name)} ${esc(v.option.phone || '')} · ${v.option.until ? NS.date(v.option.until) + ' tarihine kadar' : 'süresiz'} ${optLate(v) ? badge('Süresi geçti', 'err') : ''}${v.option.deposit ? ` · kapora ${money(v.option.deposit)}` : ''}</div>` : ''}
        <div class="row">${stB(v.status)} ${badge(G.SRC[v.source], v.source === 'konsinye' ? 'acc' : '')} ${v.tramer ? badge('Tramer ' + money(v.tramer), 'warn') : badge('Tramer yok', 'ok')}</div>
        <div class="card pad"><b style="font-size:18px">${esc(v.brand)} ${esc(v.model)} ${esc(v.pkg || '')}</b><div class="small muted">${v.year} · ${NS.num(v.km)} km · ${esc(v.fuel)} · ${esc(v.gear)} · ${esc(v.color)} · ${esc(v.body)}</div><div class="small mt">Plaka <span class="mono">${esc(v.plate)}</span> · stokta ${G.days(v)} gün</div>${v.owner ? `<div class="small mt">Araç sahibi: <b>${esc(v.owner.name)}</b> ${esc(v.owner.phone)} · istediği ${money(v.owner.want)} · komisyon %${v.commission}</div>` : ''}</div>
        <div class="card pad">${seeCost() && v.source !== 'konsinye' ? `<div class="list-item small"><span class="grow muted">Alış</span>${money(v.buy)}</div>` : ''}${seeCost() ? `<div class="list-item small"><span class="grow muted">Masraflar</span>${money(exp)}</div>` : ''}${seeCost() && v.source !== 'konsinye' ? `<div class="list-item"><b class="grow">Toplam maliyet</b><b>${money(G.cost(v))}</b></div>` : ''}<div class="list-item small"><span class="grow muted">İlan fiyatı / en düşük</span>${money(v.listPrice)} / ${money(v.minPrice)}</div>${seeCost() ? `<div class="list-item"><b class="grow">${v.sale ? 'Gerçekleşen kâr' : 'Beklenen kâr'}</b>${pB(G.profit(v))}</div>` : ''}${v.source === 'konsinye' && v.sale ? `<div class="list-item small"><span class="grow muted">Sahibine ödenecek / ödenen</span>${money(G.ownerNet(v))} / ${money(G.ownerPaid(v))}</div>` : ''}${v.sale ? `<div class="small muted">${NS.date(v.sale.at)} · ${esc(v.sale.buyer)} · ${money(v.sale.price)} · ${esc(v.sale.pay)}${v.sale.trade ? ` · takas ${esc(v.sale.trade.plate)} ${money(v.sale.trade.value)}` : ''}</div>` : ''}</div>
        ${seeCost() ? `<div class="card">${table({ rows: v.expenses || [], empty: 'Masraf yok', columns: [{ label: 'Masraf', render: (e) => esc(e.type) + (e.note ? `<div class="small faint">${esc(e.note)}</div>` : '') }, { label: 'Tarih', render: (e) => NS.date(e.at) }, { label: 'Tutar', cls: 'right', render: (e) => money(e.amount) }], actions: v.status !== 'satildi' ? [{ icon: 'trash', act: 'xp', title: 'Masrafı sil' }] : [] })}</div>` : ''}</div>
      <div class="col"><div class="card pad"><h3 class="mb">Ekspertiz ${noExp(v) ? badge('Girilmedi', 'err') : ''}</h3>${noExp(v) ? '<p class="small muted">Boya / değişen bilgisi girilmeden vitrinde "ekspertiz bilgisi girilmedi" yazar.</p>' : ''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;${noExp(v) ? 'display:none' : ''}">${G.PARTS.map((p) => { const s = (v.parts || {})[p] || 'orijinal'; return `<div class="small" style="display:flex;justify-content:space-between;align-items:center;gap:6px;white-space:nowrap"><span>${esc(p)}</span>${badge(G.PST[s][0], G.PST[s][1])}</div>`; }).join('')}</div></div>
        <div class="card pad"><h3 class="mb">İlanlar</h3>${Object.keys(v.ads || {}).length ? Object.entries(v.ads).map(([k, a]) => `<div class="list-item small" style="gap:10px;flex-wrap:wrap"><b class="grow">${k === 'sahibinden' ? 'sahibinden.com' : 'arabam.com'}</b><span class="mono">${esc(a.no)}</span><span>${a.at ? 'girildi ' + NS.date(a.at) : ''}</span></div>`).join('') : '<span class="small muted">İlana çıkmadı</span>'}</div>
        <div class="card pad small muted">${esc(v.desc || '')}</div></div></div>`,
      actions: [
        ...(v.status !== 'satildi' ? [{ label: 'Masraf ekle', icon: 'plus', onClick: async () => { const r = await formModal({ title: 'Masraf', fields: [{ name: 'type', label: 'Tür', type: 'select', options: G.EXP }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'note', label: 'Not' }] }); if (!r) return; if (!(Number(r.amount) > 0)) return toast('Tutar sıfırdan büyük olmalı', 'err'); (v.expenses = v.expenses || []).push({ id: NS.uid(), ...r, amount: Number(r.amount), at: today() }); db.save(); m.close(); carModal(app, v); } },
          { label: 'Fotoğraf', icon: 'plus', onClick: () => photosModal(app, v, m) },
          { label: 'Düzenle', icon: 'edit', onClick: (c) => { c(); editCar(app, v); } },
          { label: 'Ekspertiz', icon: 'shield', onClick: async (c) => { const r = await formModal({ title: `Ekspertiz — ${title(v)}`, size: 'wide', fields: [...G.PARTS.map((p) => ({ name: 'p_' + p, label: p, type: 'select', options: Object.entries(G.PST).map(([value, [label]]) => ({ value, label })) })), { name: 'tramer', label: 'Tramer kaydı (₺, yoksa 0)', type: 'number' }, { name: 'expNote', label: 'Ekspertiz notu / rapor no', full: true }], values: { ...Object.fromEntries(G.PARTS.map((p) => ['p_' + p, (v.parts || {})[p] || 'orijinal'])), tramer: v.tramer || 0, expNote: v.expNote || '' } }); if (!r) return; v.parts = Object.fromEntries(G.PARTS.map((p) => [p, r['p_' + p]])); v.tramer = Number(r.tramer) || 0; v.expNote = r.expNote; v.expertise = true; db.save(); c(); carModal(app, v); } },
          { label: 'İlan', icon: 'globe', onClick: () => adModal(app, v, m) },
          { label: v.status === 'opsiyon' ? 'Opsiyonu kaldır' : 'Opsiyon koy', onClick: (c) => (v.status === 'opsiyon' ? optionClear(app, v, c) : optionSet(app, v, c)) },
          { label: 'Eşleşen talepler', icon: 'users', onClick: () => matchLeads(app, v) },
          { label: 'Sat', cls: 'primary', icon: 'cash', onClick: (c) => { c(); sell(app, v); } }] : [{ label: 'Satış belgesi', icon: 'print', onClick: () => printSale(v) }, ...(seeCost() ? [{ label: 'Satışı geri al', onClick: (c) => undoSale(app, v, c) }] : [])]),
      ] });
    on(m.root, 'click', '[data-act=xp]', async (e, b) => { const x = (v.expenses || []).find((y) => y.id === b.dataset.id); if (x && (await confirm(`${x.type} ${money(x.amount)} silinsin mi?`))) { v.expenses = v.expenses.filter((y) => y !== x); db.save(); m.close(); carModal(app, v); } });
  }
  // ---------- Opsiyon ----------
  async function optionSet(app, v, c) {
    const r = await formModal({ title: `Opsiyon — ${title(v)}`, fields: [{ name: 'name', label: 'Müşteri', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'until', label: 'Bitiş tarihi', type: 'date', required: true, value: iso(addDays(new Date(), 3)) }, { name: 'deposit', label: 'Alınan kapora (₺)', type: 'number', value: 0 }, { name: 'note', label: 'Not', full: true }] }); if (!r) return;
    if (r.until < today()) return toast('Bitiş tarihi geçmiş olamaz', 'err'); if (Number(r.deposit) < 0) return toast('Kapora eksi olamaz', 'err');
    v.option = { ...r, deposit: Number(r.deposit) || 0, at: new Date().toISOString(), by: (NS.currentUser || {}).name || '' }; v.status = 'opsiyon'; db.log('Opsiyon', `${v.stockNo} · ${r.name}`); db.save(); c(); toast('Opsiyon kaydedildi', 'ok'); app.refresh();
  }
  async function optionClear(app, v, c) {
    const o = v.option || {}; const r = await formModal({ title: `Opsiyonu kaldır — ${title(v)}`, submitLabel: 'Kaldır', fields: o.deposit ? [{ name: 'dep', label: `Alınan kapora ${money(o.deposit)}`, type: 'select', required: true, empty: 'Seçin', options: [{ value: 'iade', label: 'Müşteriye iade edildi' }, { value: 'kaldi', label: 'Galeride kaldı (cayma)' }] }] : [{ type: 'section', label: 'Araç yeniden satışa açılacak.' }] }); if (!r) return;
    (v.optLog = v.optLog || []).push({ ...o, end: new Date().toISOString(), dep: r.dep || '' }); delete v.option; v.status = 'satista'; db.log('Opsiyon kaldırıldı', v.stockNo); db.save(); c(); toast('Araç yeniden satışta', 'ok'); app.refresh();
  }
  // ---------- Fotoğraf ----------
  function photosModal(app, v, parent) {
    const draw = (b) => { const L = v.photos || []; $('#ph', b).innerHTML = L.length ? `<div class="row" style="gap:8px;flex-wrap:wrap">${L.map((u, i) => `<div style="position:relative;width:132px"><img src="${esc(u)}" alt="Fotoğraf ${i + 1}" style="width:100%;height:96px;object-fit:cover;border-radius:8px">${i === 0 ? '<div class="small muted">Kapak</div>' : `<button class="btn sm" data-cv="${i}">Kapak yap</button>`} <button class="btn sm ghost icon" data-rm="${i}" title="Sil">${icon('x')}</button></div>`).join('')}</div>` : '<div class="faint small">Fotoğraf yok</div>'; };
    modal({ title: `Fotoğraflar — ${title(v)}`, size: 'wide', body: `<p class="small muted mb">En fazla ${PH_MAX} fotoğraf. İlk fotoğraf vitrinde kapak olur. Yüklenirken küçültülür.</p><div id="ph"></div><input class="input mt" type="file" id="fl" accept="image/*" multiple aria-label="Fotoğraf seç">`, onOpen: (b) => {
      draw(b); on(b, 'click', '[data-rm]', (e, x) => { const [u] = v.photos.splice(Number(x.dataset.rm), 1); db.save(); draw(b); NS.dosya.birak(db, [u], v.photos); }); on(b, 'click', '[data-cv]', (e, x) => { const [p] = v.photos.splice(Number(x.dataset.cv), 1); v.photos.unshift(p); db.save(); draw(b); });
      $('#fl', b).onchange = async (e) => { const fs = [...e.target.files]; v.photos = v.photos || []; const room = Math.max(0, PH_MAX - v.photos.length); if (fs.length > room) toast(`En fazla ${PH_MAX} fotoğraf; ${room} tanesi eklenecek`, 'warn'); await NS.dosya.toplu(e.target, fs.slice(0, room), async (f) => { const h = await NS.dosya.hazirla(db, f); v.photos.push(await h.yukle()); db.save(); draw(b); }); };
    }, actions: [{ label: 'Tamam', cls: 'primary', onClick: (c) => { c(); if (parent) parent.close(); carModal(app, v); } }] });
  }
  // ---------- Yeni araç ↔ talep ----------
  function matchLeads(app, v) {
    const L = db.all('leads', (l) => l.status !== 'kapandi' && fits(l, v) && l.phone); if (!L.length) return toast('Bu araca uyan açık talep yok', '');
    modal({ title: `${title(v)} — eşleşen talepler (${L.length})`, size: 'wide', body: table({ rows: L, columns: [{ label: '', render: (l) => `<input type="checkbox" data-lc="${l.id}" checked aria-label="${esc(l.name)}">` }, { label: 'Müşteri', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.note || '')}</div>` }, { label: 'Bütçe', cls: 'right', render: (l) => money(l.budget || 0) }, { label: 'Son haber', render: (l) => ((l.told || {})[v.id] ? badge('Haber verildi ' + NS.date(l.told[v.id]), 'ok') : '-') }] }),
      actions: [{ label: 'Kapat' }, { label: 'SMS ile haber ver', cls: 'primary', icon: 'send', onClick: async (c, b) => {
        const ids = [...b.querySelectorAll('[data-lc]:checked')].map((x) => x.dataset.lc); const sel = L.filter((l) => ids.includes(l.id)); if (!sel.length) return toast('Seçim yok', 'err'); c();
        const res = await Promise.all(sel.map((l) => NS.smsLog(db, { to: l.phone, name: l.name, text: `${S().bizName}: Aradığınıza uygun bir araç geldi: ${title(v)}, ${money(v.listPrice)}. Bilgi: ${S().bizPhone || ''}` }, true).result.then((r) => ({ l, r }))));
        let ok = 0, test = 0, err = 0; res.forEach(({ l, r }) => { if (r.simulated) test++; else if (r.ok) { ok++; l.told = { ...(l.told || {}), [v.id]: today() }; l.status = 'arandi'; l.sentAt = new Date().toISOString(); } else err++; }); db.save();
        toast([ok && `${ok} kişiye gönderildi`, test && `${test} TEST — gönderilmedi (SMS sağlayıcısı bağlı değil)`, err && `${err} gönderilemedi`].filter(Boolean).join(' · '), err ? 'err' : test ? 'warn' : 'ok'); app.refresh();
      } }] });
  }
  async function undoSale(app, v, c) {
    if ((v.ownerPays || []).length) return toast('Araç sahibine ödeme yapılmış, satış geri alınamaz', 'err');
    const t = v.sale.trade && db.get('vehicles', v.sale.trade.id); if (t && (t.status !== 'hazirlik' || (t.expenses || []).length)) return toast('Takas aracı işlem görmüş, satış geri alınamaz', 'err');
    if (!(await confirm(`${v.stockNo} satışı geri alınsın mı? Araç yeniden satışa açılır${t ? ', takas aracı stoktan çıkar' : ''}.`))) return;
    if (t) db.data.vehicles = db.all('vehicles', (x) => x.id !== t.id); (v.saleLog = v.saleLog || []).push({ ...v.sale, undoneAt: new Date().toISOString() }); delete v.sale; v.status = 'satista'; db.log('Satış geri alındı', v.stockNo); db.save(); c(); toast('Satış geri alındı', 'ok'); app.refresh();
  }
  // İlan: portallara otomatik aktarım doğrulanamadı — ilan metni hazırlanır, kullanıcı yayınladığı ilanın numarasını girer
  const adText = (v) => `${title(v)} ${v.pkg || ''}\n${NS.num(v.km)} km · ${v.fuel} · ${v.gear} · ${v.color || ''}\nFiyat: ${money(v.listPrice)}\nTramer: ${v.tramer ? money(v.tramer) : 'kayıt yok'}\nEkspertiz: ${noExp(v) ? 'bilgi için arayın' : Object.entries(v.parts || {}).filter(([, s]) => s !== 'orijinal').map(([p, s]) => `${p} ${G.PST[s][0].toLowerCase()}`).join(', ') || 'boyasız, değişensiz'}\n${v.desc || ''}\n${S().bizName} · ${S().bizPhone || ''}`;
  function adModal(app, v, parent) {
    modal({ title: `İlan — ${title(v)}`, size: 'wide', body: `<p class="small muted mb">sahibinden.com / arabam.com otomatik aktarımı doğrulanmadığı için kapalı. Metni kopyalayıp portala yapıştırın, yayınlanınca ilan numarasını girin.</p><textarea class="input" rows="9" id="adt" readonly>${esc(adText(v))}</textarea><div class="form-grid mt"><div class="field"><label>Portal</label><select class="input" id="adp"><option value="sahibinden">sahibinden.com</option><option value="arabam">arabam.com</option></select></div><div class="field"><label>İlan numarası</label><input class="input" id="adn" placeholder="Yayınlandıysa"></div></div>`,
      actions: [{ label: 'Metni kopyala', icon: 'copy', onClick: async (c, b) => { try { await navigator.clipboard.writeText(adText(v)); toast('Kopyalandı', 'ok'); } catch (e) { $('#adt', b).select(); } } },
        { label: 'İlan numarasını kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => { const no = $('#adn', b).value.trim(); if (!no) return toast('İlan numarasını girin', 'err'); v.ads = v.ads || {}; v.ads[$('#adp', b).value] = { no, at: today() }; if (v.status === 'hazirlik') v.status = 'satista'; db.save(); c(); if (parent) parent.close(); toast('İlan kaydedildi', 'ok'); carModal(app, v); } }] });
  }
  async function editCar(app, v) {
    const r = await formModal({ title: v ? `${v.stockNo} düzenle` : 'Araç alışı', size: 'wide', fields: [{ type: 'section', label: 'Araç' }, { name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', required: true }, { name: 'model', label: 'Model', required: true }, { name: 'pkg', label: 'Paket / motor' }, { name: 'year', label: 'Yıl', type: 'number', required: true }, { name: 'km', label: 'Km', type: 'number', required: true }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'gear', label: 'Vites', type: 'select', options: ['Manuel', 'Otomatik'] }, { name: 'body', label: 'Kasa', type: 'select', options: ['Sedan', 'Hatchback', 'SUV', 'Station wagon', 'Coupe', 'Ticari'] }, { name: 'color', label: 'Renk' }, { type: 'section', label: 'Alış' }, { name: 'source', label: 'Geliş şekli', type: 'select', options: Object.entries(G.SRC).map(([value, label]) => ({ value, label })) }, { name: 'buy', label: 'Alış fiyatı (konsinyede boş)', type: 'number' }, { name: 'buyDate', label: 'Alış tarihi', type: 'date' }, { name: 'tramer', label: 'Tramer kaydı (₺)', type: 'number' }, { name: 'listPrice', label: 'İlan fiyatı', type: 'number', required: true }, { name: 'minPrice', label: 'En düşük satış fiyatı', type: 'number' }, { type: 'section', label: 'Konsinye (emanet) araç sahibi' }, { name: 'oName', label: 'Araç sahibi' }, { name: 'oPhone', label: 'Telefon', type: 'tel' }, { name: 'oWant', label: 'İstediği bedel (₺)', type: 'number' }, { name: 'commission', label: 'Komisyon %', type: 'number' }, { name: 'desc', label: 'İlan açıklaması', type: 'textarea', full: true }], values: v ? { ...v, oName: (v.owner || {}).name, oPhone: (v.owner || {}).phone, oWant: (v.owner || {}).want } : { source: 'bireysel', buyDate: today(), fuel: 'Benzin', gear: 'Otomatik', body: 'Sedan', year: 2020, commission: 3 } });
    if (!r) return;
    ['year', 'km', 'buy', 'tramer', 'listPrice', 'minPrice'].forEach((k) => { r[k] = Number(r[k]) || 0; });
    if (!(r.listPrice > 0)) return toast('İlan fiyatı girin', 'err'); if (r.km < 0 || r.buy < 0 || r.tramer < 0) return toast('Tutar ve km eksi olamaz', 'err'); if (r.minPrice > r.listPrice) return toast('En düşük fiyat ilan fiyatından büyük olamaz', 'err');
    const plateN = String(r.plate).replace(/\s/g, '').toUpperCase(); if (db.find('vehicles', (x) => x !== v && x.status !== 'satildi' && String(x.plate).replace(/\s/g, '').toUpperCase() === plateN)) return toast('Bu plaka stokta kayıtlı', 'err');
    if (r.source === 'konsinye') { if (!r.oName || !r.oPhone) return toast('Konsinye araçta sahibin adı ve telefonu gerekli', 'err'); r.buy = 0; r.owner = { name: r.oName, phone: r.oPhone, want: Number(r.oWant) || 0 }; r.commission = Number(r.commission) || 3; } else delete r.commission;
    delete r.oName; delete r.oPhone; delete r.oWant; const fresh = !v;
    if (v) Object.assign(v, r); else v = db.insert('vehicles', { commission: 3, ...r, stockNo: nextStock(), status: 'hazirlik', parts: {}, expertise: false, expenses: [], ads: {} });
    db.save(); toast('Kaydedildi', 'ok'); app.refresh(); if (fresh) matchLeads(app, v);
  }
  async function sell(app, v) {
    const opt = v.status === 'opsiyon' ? v.option : null;
    const r = await formModal({ title: `Satış — ${title(v)}`, fields: [{ name: 'buyer', label: 'Alıcı ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'tc', label: 'TC kimlik / VKN' }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', required: true }, { name: 'pay', label: 'Ödeme', type: 'select', options: ['Peşin', 'Kredi', 'Takas + nakit', 'Senetli'] }, { name: 'deposit', label: 'Alınan kapora', type: 'number' }, { name: 'noter', label: 'Noter tarihi', type: 'date' }, { type: 'section', label: 'Takas aracı (ödeme "Takas + nakit" ise)' }, { name: 'tPlate', label: 'Plaka' }, { name: 'tBrand', label: 'Marka' }, { name: 'tModel', label: 'Model' }, { name: 'tYear', label: 'Yıl', type: 'number' }, { name: 'tKm', label: 'Km', type: 'number' }, { name: 'tValue', label: 'Takas bedeli (₺)', type: 'number' }], values: { price: v.listPrice, pay: 'Peşin', noter: today(), ...(opt ? { buyer: opt.name, phone: opt.phone, deposit: opt.deposit } : {}) } });
    if (!r) return; const price = Number(r.price); let dep = Number(r.deposit) || 0; const tv = Number(r.tValue) || 0; const isTrade = r.pay === 'Takas + nakit';
    if (!(price > 0)) return toast('Satış fiyatı girin', 'err'); if (dep < 0 || dep > price) return toast('Kapora 0 ile satış fiyatı arasında olmalı', 'err');
    if (isTrade && (!r.tPlate || !r.tBrand || !r.tModel || !(tv > 0))) return toast('Takas aracının plaka, marka, model ve bedelini girin', 'err'); if (isTrade && tv + dep > price) return toast('Takas bedeli ve kapora satış fiyatını aşamaz', 'err');
    // Başkasına satışta opsiyon sahibinin kaporası bu satışın ödemesi sayılmaz; iade edilecek olarak kayda geçer
    const other = opt && r.buyer.trim().toLocaleLowerCase('tr') !== String(opt.name).trim().toLocaleLowerCase('tr');
    if (other && !(await confirm(`Bu araç ${opt.name} adına opsiyonlu${opt.deposit ? ` (kapora ${money(opt.deposit)} iade edilecek)` : ''}${optLate(v) ? ', süresi geçmiş' : ''}. Başkasına satılsın mı?`, { ok: 'Yine de sat' }))) return;
    if (other && opt.deposit && dep === opt.deposit) dep = 0;
    if (price < v.minPrice && !(await confirm(`${money(price)} belirlenen en düşük fiyatın (${money(v.minPrice)}) altında.${seeCost() ? ` Bu satışta kâr ${money(price - G.cost(v))}.` : ''} Onaylıyor musunuz?`))) return;
    v.sale = { at: new Date().toISOString(), buyer: r.buyer, phone: r.phone, tc: r.tc, price, pay: r.pay, deposit: dep, noter: r.noter }; v.status = 'satildi'; if (opt) { (v.optLog = v.optLog || []).push({ ...opt, end: v.sale.at, dep: other ? 'iade-edilecek' : 'satis' }); delete v.option; if (other && opt.deposit) toast(`${opt.name} kaporası ${money(opt.deposit)} iade edilecek`, 'warn'); }
    if (isTrade) { const t = db.insert('vehicles', { plate: r.tPlate, brand: r.tBrand, model: r.tModel, year: Number(r.tYear) || 0, km: Number(r.tKm) || 0, fuel: 'Benzin', gear: 'Manuel', body: 'Sedan', source: 'takas', buy: tv, buyDate: today(), tramer: 0, listPrice: tv, minPrice: 0, stockNo: nextStock(), status: 'hazirlik', parts: {}, expertise: false, expenses: [], ads: {}, tradeFrom: v.id, desc: `${v.stockNo} satışından takas` }); v.sale.trade = { id: t.id, plate: t.plate, value: tv, stockNo: t.stockNo }; }
    db.log('Araç satışı', v.stockNo); db.save(); printSale(v); toast(seeCost() ? `Satıldı · kâr ${money(G.profit(v))}` : 'Satış kaydedildi', 'ok'); if (isTrade) toast(`Takas aracı ${v.sale.trade.stockNo} stoğa girdi: yakıt, vites ve ekspertizi tamamlayın`, 'warn'); app.refresh();
    if (v.source === 'konsinye' && v.owner) tell(v.owner.phone, v.owner.name, `${S().bizName}: ${title(v)} aracınız ${money(price)} bedelle satıldı. Komisyon sonrası ödemeniz: ${money(G.ownerNet(v))}.`, 'Araç sahibine bildirim');
  }
  const saleDoc = (v) => ({ title: 'Araç satış sözleşmesi (ön protokol)', no: v.stockNo, date: v.sale.at,
    info: [['Araç', `${title(v)} ${v.pkg || ''}`], ['Plaka', v.plate], ['Km', NS.num(v.km)], ['Tramer', v.tramer ? money(v.tramer) : 'Kayıt yok'], ['Noter tarihi', v.sale.noter ? NS.date(v.sale.noter) : '-'], ['Ödeme', v.sale.pay]],
    party: { title: 'Alıcı', name: v.sale.buyer, lines: [v.sale.phone, v.sale.tc ? 'TCKN/VKN: ' + v.sale.tc : ''] },
    lines: [{ name: `${title(v)} ${v.pkg || ''} · ${v.plate}`, qty: 1, price: v.sale.price, total: v.sale.price }],
    totals: [['Satış bedeli', v.sale.price, true], ...(v.sale.trade ? [[`Takas aracı (${v.sale.trade.plate})`, v.sale.trade.value]] : []), ...(v.sale.deposit ? [['Alınan kapora', v.sale.deposit]] : []), ...(v.sale.deposit || v.sale.trade ? [['Kalan', v.sale.price - (v.sale.deposit || 0) - ((v.sale.trade || {}).value || 0)]] : [])],
    note: `Ekspertiz: ${noExp(v) ? 'girilmedi' : Object.entries(v.parts || {}).filter(([, s]) => s !== 'orijinal').map(([p, s]) => `${p}: ${G.PST[s][0]}`).join(', ') || 'Boyasız / değişensiz'}${v.expNote ? ' · ' + v.expNote : ''}\nAlıcı aracı ekspertiz bilgisini görerek, gördüğü şekliyle satın almıştır. Resmî devir noterde yapılır.`,
    signatures: [{ label: 'Satıcı' }, { label: 'Alıcı' }] });
  if (NS.docs) NS.docs.define('galeri', 'konsinye', { label: 'Konsinye ödeme makbuzu', defaults: { terms: '', hide: ['qr'], signLabels: 'Ödeyen|Teslim alan' } });
  if (NS.docs) NS.docs.define('galeri', 'satis', { label: 'Araç satış sözleşmesi', defaults: { terms: '', hide: ['qr'], signLabels: 'Satıcı|Alıcı' }, sample: () => { const v = db.all('vehicles', (x) => x.sale)[0]; return v ? saleDoc(v) : { title: 'Örnek' }; } });
  function printSale(v) {
    NS.docs.print('satis', saleDoc(v));
  }

  // ---------- Stok ----------
  function stockPage(el, p, app) {
    let f = p || 'stok', q = '';
    el.innerHTML = pageHead('Araçlar', 'Stoktaki araçlar, maliyet ve beklenen kâr', `<button class="btn primary" id="add">${icon('plus')} Araç alışı</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Marka, model, plaka...')}<div class="seg">${[['stok', 'Stokta'], ['hazirlik', 'Hazırlıkta'], ['eski', `${S().staleDays || 60}+ gün`], ['konsinye', 'Konsinye'], ['satildi', 'Satılan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('vehicles', (v) => NS.match(q, v.brand, v.model, v.plate, v.stockNo) && (f === 'all' || (f === 'stok' ? v.status !== 'satildi' : f === 'eski' ? v.status !== 'satildi' && G.days(v) > (Number(S().staleDays) || 60) : f === 'konsinye' ? v.source === 'konsinye' && v.status !== 'satildi' : v.status === f))).sort((a, b) => (f === 'satildi' ? b.sale.at.localeCompare(a.sale.at) : G.days(b) - G.days(a)));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'car', columns: [
      { label: 'Araç', render: (v) => `<b>${esc(title(v))}</b><div class="small faint">${esc(v.pkg || '')} · ${NS.num(v.km)} km · ${esc(v.fuel)} · ${esc(v.gear)}</div><div class="small faint"><span class="mono">${esc(v.stockNo)}</span> · ${esc(v.plate)}</div>` },
      { label: 'Durum', render: (v) => `${stB(v.status)}${optLate(v) ? ' ' + badge('Opsiyon süresi geçti', 'err') : ''}${v.source === 'konsinye' ? '<div class="mt">' + badge('Konsinye', 'acc') + '</div>' : ''}${noExp(v) ? '<div class="mt">' + badge('Ekspertiz yok', 'warn') + '</div>' : ''}` },
      ...(seeCost() ? [{ label: 'Maliyet', cls: 'right', render: (v) => (v.source === 'konsinye' ? '<span class="faint">—</span>' : money(G.cost(v))) }] : []),
      { label: 'Fiyat', cls: 'right', render: (v) => `<b>${money(v.sale ? v.sale.price : v.listPrice)}</b>` },
      ...(seeCost() ? [{ label: 'Kâr', cls: 'right', render: (v) => pB(G.profit(v)) }] : []),
      { label: 'Stokta', render: ageB },
      { label: 'İlan', render: adsB },
    ], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} araç${r.length > 300 ? ' (ilk 300 gösteriliyor)' : ''}${seeCost() ? ` · ${money(sum(r.filter((v) => v.source !== 'konsinye'), G.cost))} sermaye` : ''}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => carModal(app, db.get('vehicles', b.dataset.id)));
    $('#add', el).onclick = () => editCar(app, null);
    draw();
  }

  // ---------- Talepler ----------
  function leadsPage(el, p, app) {
    el.innerHTML = pageHead('Müşteri Talepleri', 'Aradığı aracı bırakan müşteriler — stokla otomatik eşleşir', `<button class="btn primary" id="add">${icon('plus')} Talep ekle</button>`) + `<div class="col" id="l" style="gap:12px"></div>`;
    const draw = () => { $('#l', el).innerHTML = db.all('leads').sort((a, b) => b.at.localeCompare(a.at)).map((l) => { const M = match(l); return `<div class="card pad"><div class="row"><div class="grow"><b>${esc(l.name)}</b> ${badge(l.status === 'yeni' ? 'Yeni' : l.status === 'arandi' ? 'Arandı' : 'Kapandı', l.status === 'yeni' ? 'info' : '')} <span class="small faint">${esc(l.source)} · ${NS.dt(l.at)}</span><div class="small">${esc(l.note)}</div><div class="small muted">${esc(l.body || 'Her kasa')} · bütçe ${money(l.budget || 0)} · <a href="tel:${esc(l.phone)}">${esc(l.phone)}</a></div></div><div class="row" style="gap:6px"><button class="btn sm" data-sms="${l.id}" ${M.length ? '' : 'disabled'}>${icon('message')} Uygun araçları gönder</button><button class="btn sm ghost" data-c="${l.id}">Arandı</button></div></div>
      ${M.length ? `<div class="row mt" style="gap:8px;flex-wrap:wrap">${M.slice(0, 4).map((v) => `<button class="btn sm" data-v="${v.id}">${esc(title(v))} · ${money(v.listPrice)}</button>`).join('')}</div>` : '<div class="small faint mt">Şu an uygun araç yok — yeni araç girişinde eşleşir</div>'}</div>`; }).join(''); };
    on(el, 'click', '[data-v]', (e, b) => carModal(app, db.get('vehicles', b.dataset.v)));
    on(el, 'click', '[data-c]', (e, b) => { db.update('leads', b.dataset.c, { status: 'arandi' }); draw(); });
    on(el, 'click', '[data-sms]', (e, b) => { const l = db.get('leads', b.dataset.sms); const M = match(l).slice(0, 3); const url = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'vitrin.html'; tell(l.phone, l.name, `${S().bizName}: Aradığınıza uygun araçlar: ${M.map((v) => `${title(v)} ${money(v.listPrice)}`).join(' | ')}. Tümü: ${url}`, 'Uygun araçlar').then((sent) => { if (sent) { l.status = 'arandi'; l.sentAt = new Date().toISOString(); db.save(); } draw(); }); });
    $('#add', el).onclick = async () => { const v = await formModal({ title: 'Müşteri talebi', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'body', label: 'Kasa', type: 'select', empty: 'Fark etmez', options: ['Sedan', 'Hatchback', 'SUV', 'Station wagon', 'Ticari'] }, { name: 'budget', label: 'Bütçe (₺)', type: 'number' }, { name: 'note', label: 'Aradığı araç', full: true }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Telefon', 'Galeriye geldi', 'sahibinden', 'Instagram', 'Tavsiye'] }] }); if (!v) return; db.insert('leads', { ...v, budget: Number(v.budget) || 0, at: new Date().toISOString(), status: 'yeni' }); draw(); };
    draw();
  }

  // ---------- Özet & raporlar ----------
  function dashboard(el, p, app) {
    const V = db.all('vehicles'); const stock = V.filter((v) => v.status !== 'satildi'); const sold = V.filter((v) => v.status === 'satildi');
    const s30 = sold.filter((v) => v.sale.at > addDays(new Date(), -30).toISOString()); const own = stock.filter((v) => v.source !== 'konsinye');
    const stale = stock.filter((v) => G.days(v) > (Number(S().staleDays) || 60)); const late = stock.filter(optLate); const owed = sold.filter((v) => v.source === 'konsinye' && G.ownerPaid(v) < G.ownerNet(v));
    // Sermayenin bekleme maliyeti: aylık %kasko/finansman oranı
    const holding = sum(own, (v) => (G.cost(v) * (Number(S().kaskoRate) || 1.8) / 100) * (G.days(v) / 30));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/talepler">${icon('users')} Talepler</a><a class="btn primary" href="#/araclar">${icon('car')} Araçlar</a>`) + `
      <div class="grid g4 mb">${kpi('Stoktaki araç', stock.length, 'car', '', seeCost() ? `<div class="small faint">${money(sum(own, G.cost))} bağlı sermaye</div>` : '')}${kpi('30 gün satış', s30.length, 'trend', 'ok', seeCost() ? `<div class="small faint">kâr ${money(sum(s30, G.profit))}</div>` : '')}${kpi('Ortalama satış süresi', `${sold.length ? Math.round(sum(sold, G.days) / sold.length) : 0} gün`, 'clock', 'info')}${kpi(`${S().staleDays || 60}+ gün bekleyen`, stale.length, 'alert', stale.length ? 'err' : 'ok', seeCost() ? `<div class="small faint">bekleme maliyeti ≈ ${money(holding)}</div>` : '')}</div>
      ${late.length || owed.length ? `<div class="card pad mb">${late.map((v) => `<div class="small">${badge('Opsiyon süresi geçti', 'err')} <a href="#/araclar">${esc(v.stockNo)} ${esc(title(v))}</a> · ${esc(v.option.name)} ${esc(v.option.phone || '')}</div>`).join('')}${owed.length && seeCost() ? `<div class="small mt">${badge(`Konsinye sahiplerine borç ${money(sum(owed, (v) => G.ownerNet(v) - G.ownerPaid(v)))}`, 'warn')} <a href="#/konsinye">Ödemeler</a></div>` : ''}</div>` : ''}
      <div class="grid g2 mb">${seeCost() ? `<div class="card"><div class="card-h"><h3>Araç başı kâr (son satışlar)</h3></div><div class="card-b">${chart.bars(sold.sort((a, b) => a.sale.at.localeCompare(b.sale.at)).slice(-12).map((v) => ({ label: v.brand.slice(0, 5), value: Math.max(0, G.profit(v)) })), { format: (x) => NS.compact(x) })}</div></div>` : ''}
      <div class="card"><div class="card-h"><h3>Stok dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(stock, (v) => v.body)).map(([label, x]) => ({ label, value: x.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Uzun süredir bekleyenler</h3></div>${table({ rows: stale.sort((a, b) => G.days(b) - G.days(a)).slice(0, 8), empty: 'Bekleyen araç yok', columns: [{ label: 'Araç', render: (v) => `<b>${esc(title(v))}</b>` }, { label: 'Gün', render: ageB }, { label: 'İlan', render: adsB }, { label: 'Öneri', render: (v) => `<span class="small">${Object.keys(v.ads || {}).length ? `Fiyatı ${money(Math.max(v.minPrice, v.listPrice * 0.97))}'ye çekin` : 'İlana çıkarın'}</span>` }], actions: [{ icon: 'eye', act: 'v' }] })}</div>
      <div class="card"><div class="card-h"><h3>Yeni talepler</h3><a class="btn sm" href="#/talepler">Tümü</a></div>${table({ rows: db.all('leads', (l) => l.status === 'yeni'), empty: 'Yeni talep yok', columns: [{ label: 'Müşteri', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.note)}</div>` }, { label: 'Eşleşen', cls: 'right', render: (l) => badge(match(l).length + ' araç', match(l).length ? 'ok' : '') }] })}</div></div>`;
    on(el, 'click', '[data-act=v]', (e, b) => carModal(app, db.get('vehicles', b.dataset.id)));
  }

  // ---------- Konsinye ödemeleri ----------
  function ownersPage(el, p, app) {
    const V = db.all('vehicles', (v) => v.source === 'konsinye' && v.status === 'satildi'); const left = (v) => G.ownerNet(v) - G.ownerPaid(v);
    el.innerHTML = pageHead('Konsinye Ödemeleri', 'Satılan emanet araçların sahiplerine ödenecek tutarlar') + `<div class="grid g3 mb">${kpi('Ödenecek', money(sum(V, left)), 'wallet', 'warn')}${kpi('Bekleyen araç', V.filter((v) => left(v) > 0).length, 'car')}${kpi('Ödenen', money(sum(V, G.ownerPaid)), 'check', 'ok')}</div><div class="card">${table({ rows: V.sort((a, b) => (left(b) > 0) - (left(a) > 0) || b.sale.at.localeCompare(a.sale.at)).slice(0, 300), empty: 'Satılmış konsinye araç yok', emptyIcon: 'car', columns: [{ label: 'Araç', render: (v) => `<b>${esc(title(v))}</b><div class="small faint">${esc(v.stockNo)} · ${NS.date(v.sale.at)} · ${money(v.sale.price)}</div>` }, { label: 'Sahibi', render: (v) => `${esc((v.owner || {}).name || '-')}<div class="small faint">${esc((v.owner || {}).phone || '')}</div>` }, { label: 'Komisyon', cls: 'right', render: (v) => '%' + (v.commission || 3) }, { label: 'Ödenecek', cls: 'right', render: (v) => money(G.ownerNet(v)) }, { label: 'Ödenen', cls: 'right', render: (v) => money(G.ownerPaid(v)) }, { label: 'Durum', render: (v) => (left(v) > 0 ? badge(`Kalan ${money(left(v))}`, 'err') : badge('Ödendi', 'ok')) }], actions: [{ label: 'Ödeme yap', act: 'op', show: (v) => left(v) > 0 }, { icon: 'print', act: 'mk', title: 'Son ödeme makbuzu', show: (v) => (v.ownerPays || []).length > 0 }] })}</div>`;
    const doc = (v, x) => ({ title: 'Konsinye ödeme makbuzu', no: v.stockNo, date: x.at, party: { title: 'Ödeme yapılan', name: (v.owner || {}).name || '-', lines: [(v.owner || {}).phone] }, info: [['Araç', `${title(v)} · ${v.plate}`], ['Satış bedeli', money(v.sale.price)], ['Komisyon', '%' + (v.commission || 3)], ['Ödeme şekli', x.method], ['Not', x.note || '']], totals: [['Bu ödeme', x.amount, true], ['Kalan', left(v)]] });
    on(el, 'click', '[data-act]', async (e, b) => { const v = db.get('vehicles', b.dataset.id); if (b.dataset.act === 'mk') return NS.docs.print('konsinye', doc(v, v.ownerPays[v.ownerPays.length - 1]));
      const r = await formModal({ title: `Ödeme — ${(v.owner || {}).name || ''}`, fields: [{ name: 'amount', label: `Tutar (kalan ${money(left(v))})`, type: 'number', required: true, value: left(v) }, { name: 'method', label: 'Ödeme şekli', type: 'select', options: ['Havale / EFT', 'Nakit', 'Çek'] }, { name: 'note', label: 'Not', full: true }] }); if (!r) return; const a = Number(r.amount); if (!(a > 0) || a > left(v)) return toast(`Tutar 0 ile ${money(left(v))} arasında olmalı`, 'err');
      const x = { id: NS.uid(), amount: a, method: r.method, note: r.note, at: new Date().toISOString(), by: (NS.currentUser || {}).name || '' }; (v.ownerPays = v.ownerPays || []).push(x); db.log('Konsinye ödeme', `${v.stockNo} · ${money(a)}`); db.save(); toast('Ödeme kaydedildi', 'ok'); NS.docs.print('konsinye', doc(v, x)); app.refresh(); });
  }
  // ---------- Kârlılık raporu ----------
  function reportsPage(el, p, app) {
    let per = '12';
    const grp = (L, fn) => Object.entries(NS.groupBy(L, fn)).map(([k, x]) => ({ id: k, k, n: x.length, rev: sum(x, (v) => v.sale.price), prof: sum(x, G.profit), days: Math.round(sum(x, G.days) / x.length) })).sort((a, b) => b.prof - a.prof);
    const box = (t, rows) => `<div class="card"><div class="card-h"><h3>${esc(t)}</h3></div>${table({ rows, empty: 'Satış yok', columns: [{ label: t, render: (r) => `<b>${esc(r.k)}</b>` }, { label: 'Adet', cls: 'right', key: 'n' }, { label: 'Ciro', cls: 'right', render: (r) => money(r.rev) }, { label: 'Kâr', cls: 'right', render: (r) => pB(r.prof) }, { label: 'Araç başı', cls: 'right', render: (r) => money(Math.round(r.prof / r.n)) }, { label: 'Ort. gün', cls: 'right', key: 'days' }] })}</div>`;
    const draw = () => { const from = per === 'all' ? '' : addDays(new Date(), -Number(per) * 30).toISOString(); const L = db.all('vehicles', (v) => v.status === 'satildi' && v.sale && v.sale.at >= from);
      el.innerHTML = pageHead('Kârlılık Raporu', 'Marka, geliş şekli ve kasaya göre gerçekleşen kâr ve satış süresi', `<select class="input" id="pr" style="max-width:170px">${[['3', 'Son 3 ay'], ['12', 'Son 12 ay'], ['all', 'Tümü']].map(([k, l]) => `<option value="${k}" ${k === per ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn" id="ex">${icon('download')} Excel</button>`) + `<div class="grid g4 mb">${kpi('Satılan araç', L.length, 'car')}${kpi('Ciro', money(sum(L, (v) => v.sale.price)), 'wallet', 'info')}${kpi('Kâr', money(sum(L, G.profit)), 'trend', 'ok')}${kpi('Ort. satış süresi', (L.length ? Math.round(sum(L, G.days) / L.length) : 0) + ' gün', 'clock')}</div><div class="card pad mb small">Kâr KDV ve vergi hesaba katılmadan gösterilir: satış − alış − masraf; konsinyede komisyon − masraf.</div><div class="grid g2">${box('Marka', grp(L, (v) => v.brand))}${box('Geliş şekli', grp(L, (v) => G.SRC[v.source] || v.source))}${box('Kasa', grp(L, (v) => v.body || '-'))}</div>`;
      $('#pr', el).onchange = (e) => { per = e.target.value; draw(); }; $('#ex', el).onclick = () => NS.csv('galeri-karlilik', L, [{ label: 'Stok no', value: (v) => v.stockNo }, { label: 'Araç', value: title }, { label: 'Geliş', value: (v) => G.SRC[v.source] }, { label: 'Satış tarihi', value: (v) => NS.date(v.sale.at) }, { label: 'Satış', value: (v) => v.sale.price }, { label: 'Kâr', value: G.profit }, { label: 'Gün', value: G.days }]); };
    draw();
  }

  const ROLES = { admin: 'Galeri sahibi', satis: 'Satış danışmanı' };
  NS.shell({
    id: 'galeri', integrations: ['sms', 'whatsapp', 'efatura', 'webhook', 'backup'], name: 'Oto Galeri', tagline: 'Araç alım-satım yönetimi', icon: 'car', accent: '#be123c', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Galeri' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['satis'] }, { id: 'araclar', label: 'Araçlar', icon: 'car', roles: ['satis'] }, { id: 'talepler', label: 'Müşteri Talepleri', icon: 'users', badge: true, roles: ['satis'] }, { sec: 'Yönetim' }, { id: 'konsinye', label: 'Konsinye Ödemeleri', icon: 'wallet', roles: ['admin'] }, { id: 'raporlar', label: 'Kârlılık Raporu', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ talepler: db.all('leads', (l) => l.status === 'yeni').length }),
    topActions: () => `<a class="btn sm" target="_blank" href="vitrin.html">${icon('globe')} Vitrin</a>`,
    routes: { ozet: dashboard, araclar: stockPage, talepler: leadsPage, konsinye: ownersPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Kurallar' }, { name: 'staleDays', label: 'Uzun bekleme uyarısı (gün)', type: 'number' }, { name: 'kaskoRate', label: 'Aylık sermaye maliyeti % (finansman/kasko)', type: 'number', step: '0.1' }] }) },
  });
})();
