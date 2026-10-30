/* NEBSOFT E-ticaret — mağaza yönetimi: sipariş, ürün/varyant, müşteri, kupon, terk edilen sepet, iade ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const SH = window.SHOP;
  const db = new NS.DB('eticaret', SH.seed);
  const MP = window.MPHUB; MP.ensure(db);
  const chTag = (o) => (MP.CH[o.channel] ? MP.chBadge(o.channel) : '');
  const S = () => db.settings({});
  const prod = (id) => db.get('products', id) || { name: '-', variants: [], colors: [] };
  const cust = (id) => db.get('customers', id) || { name: '-' };
  const catName = (id) => (db.get('cats', id) || {}).name || '-';
  const img = (p) => `<div class="pimg" style="background:#f4f1ec;overflow:hidden;padding:0"><img src="${SH.imgUrl(SH.photos(p)[0], 120, 120)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;this.src='${SH.fallback(p)}'"></div>`;
  const PAY = { kart: 'Kredi kartı', kapida: 'Kapıda ödeme', havale: 'Havale/EFT' };
  const FLOW = ['yeni', 'hazirlaniyor', 'kargoda', 'teslim'];
  const shopUrl = () => location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'magaza.html';
  // Ödeme durumu: eski kayıtlarda alan yoksa ödenmiş sayılır; vitrindeki kart ödemesi sağlayıcı bağlı olmadığı için TEST'tir
  const PST = { alindi: ['Ödeme alındı', 'ok'], bekliyor: ['Ödeme bekleniyor', 'warn'], kapida: ['Kapıda tahsil', 'info'] };
  const payB = (o) => (o.payTest ? badge('TEST — ödeme alınmadı', 'err') : badge(...(PST[o.payStatus || 'alindi'] || PST.alindi)));
  const unpaid = (o) => o.payTest || o.payStatus === 'bekliyor';
  const me = () => (NS.currentUser || {}).name || '';
  // Durum değişikliği her zaman kim/ne zaman kaydıyla tutulur
  const setSt = (o, st, note) => { o.status = st; (o.history = o.history || []).push({ at: new Date().toISOString(), st, note: note || SH.ST[st][0], user: me() }); };
  const vatOf = (p) => { const v = (p || {}).vat; return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : Number(S().vat ?? 20); };
  const r2 = (n) => Math.round(n * 100) / 100;
  // Fatura kalemleri (KDV dahil): kupon indirimi kalemlere oranla dağıtılır, kargo ve kapıda ödeme bedeli ayrı kalem; toplam = sipariş toplamı
  function invLines(o) {
    const g = o.items.map((i) => r2(i.price * i.qty)); const sub = sum(g, (x) => x); let left = r2(Number(o.discount) || 0);
    const ls = o.items.map((i, k) => { const d = k === o.items.length - 1 ? left : r2(sub ? (o.discount || 0) * g[k] / sub : 0); left = r2(left - d); const p = prod(i.pid); return { name: `${i.name} ${i.variant || ''}`.trim(), code: ((p.variants || []).find((v) => v.id === i.vid) || {}).barcode || '', qty: i.qty, vat: vatOf(p), total: r2(g[k] - d) }; });
    if (o.shipping) ls.push({ name: 'Kargo bedeli', qty: 1, vat: 20, total: r2(o.shipping) });
    if (o.cod) ls.push({ name: 'Kapıda ödeme hizmet bedeli', qty: 1, vat: 20, total: r2(o.cod) });
    return ls.filter((l) => l.total > 0);
  }
  const unmatchedB = (o) => (o.unmatched ? ' ' + badge('Eşleşmeyen ürün', 'err') : '');
  const retQty = (o, vid) => sum((o.returned || []).filter((x) => x.vid === vid), (x) => x.qty);

  // ---------- Sipariş ----------
  function orderModal(app, o) {
    const idx = FLOW.indexOf(o.status);
    modal({
      title: `Sipariş ${o.no}`, size: 'wide',
      body: `${['iptal', 'iade'].includes(o.status) ? `<div class="mb">${badge(SH.ST[o.status][0], SH.ST[o.status][1])}</div>` : `<div class="steps-o mb">${FLOW.map((s, i) => `<div class="${i <= idx ? 'on' : ''}"><i></i>${SH.ST[s][0]}</div>`).join('')}</div>`}
        ${o.unmatched ? `<div class="card pad mb small" style="border-color:var(--err)">${icon('alert')} Bu siparişte stoğunuzla eşleşmeyen ürün var; stok düşülmedi. <a href="#/eslesmeyen">Eşleştir</a></div>` : ''}
        <div class="grid g2"><div>${o.items.map((i) => { const p = prod(i.pid); const rq = retQty(o, i.vid); return `<div class="list-item">${img(p)}<div class="grow"><b>${esc(i.name)}</b>${i.pid ? '' : ' ' + badge('Eşleşmedi', 'err')}<div class="small muted">${esc(i.variant)} · ${i.qty} adet${rq ? ` · <span style="color:var(--err)">${rq} iade</span>` : ''}</div><div class="small faint mono">${esc((p.variants.find((v) => v.id === i.vid) || {}).sku || '')}</div></div><b>${money(i.price * i.qty)}</b></div>`; }).join('')}
          <div class="row between mt small"><span>Ara toplam</span><span>${money(o.subtotal)}</span></div>${o.discount ? `<div class="row between small" style="color:var(--ok)"><span>İndirim ${esc(o.coupon || '')}</span><span>-${money(o.discount)}</span></div>` : ''}<div class="row between small"><span>Kargo</span><span>${o.shipping ? money(o.shipping) : 'Ücretsiz'}</span></div>${o.cod ? `<div class="row between small"><span>Kapıda ödeme bedeli</span><span>${money(o.cod)}</span></div>` : ''}<div class="row between"><b>Toplam</b><b style="font-size:20px">${money(o.total)}</b></div></div>
        <div class="col"><div class="card pad"><b>${esc(o.ship.name)}</b><div class="small">${esc(o.ship.phone)}</div><div class="small muted">${esc(o.ship.address)}, ${esc(o.ship.city)}</div></div>
          <div class="list-item small"><span class="grow muted">Ödeme</span>${PAY[o.pay]} ${payB(o)}</div>${o.invoice && o.invoice.taxNo ? `<div class="list-item small"><span class="grow muted">Fatura</span>${esc(o.invoice.title || '')} · VKN ${esc(o.invoice.taxNo)}</div>` : ''}${o.ebelge ? `<div class="list-item small"><span class="grow muted">e-Belge</span>${esc(o.ebelge.type)} ${esc(o.ebelge.no)} ${o.ebelge.test ? badge('TEST — gönderilmedi', 'warn') : ''}</div>` : ''}<div class="list-item small"><span class="grow muted">Kanal</span>${MP.CH[o.channel] ? `${chTag(o)} <span class="small mono">${esc(o.channelNo || '')}</span>` : `Kendi mağaza${o.channel ? ' · ' + esc(o.channel) : ''}`}</div><div class="list-item small"><span class="grow muted">Tarih</span>${NS.dt(o.at)}</div>
          ${o.tracking ? `<div class="list-item small"><span class="grow muted">Kargo</span><b>${esc(o.carrier)}</b> <span class="mono">${esc(o.tracking)}</span></div>` : ''}${o.note ? `<div class="card pad small" style="background:var(--warn-soft);border:0">${icon('message')} ${esc(o.note)}</div>` : ''}${(o.history || []).length ? `<details class="small mt"><summary>İşlem geçmişi (${o.history.length})</summary>${o.history.map((h) => `<div class="list-item small"><span class="grow">${esc(h.note)}</span><span class="faint">${esc(h.user || '')} · ${NS.dt(h.at)}</span></div>`).join('')}</details>` : ''}</div></div>`,
      actions: [
        ...(!['iptal', 'iade', 'teslim'].includes(o.status) ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { c(); if (await confirm('Sipariş iptal edilsin mi? Stoklar geri eklenir.')) { restock(o); setSt(o, 'iptal'); db.log('Sipariş iptal', o.no); db.save(); if (o.channelNo && MP.CH[o.channel]) toast(`${MP.CH[o.channel].name} siparişini pazaryeri panelinden de iptal edin (tedarik edilemedi bildirimi)`, 'warn'); app.refresh(); } } }] : []),
        { label: 'Paket fişi', icon: 'print', onClick: () => printSlip(o) },
        ...(o.tracking && NS.integ && NS.integ.trackOf(o.carrier) ? [{ label: 'Takip et', icon: 'truck', onClick: () => NS.integ.trackShipment(o.carrier, o.tracking) }] : []),
        ...(o.payStatus === 'bekliyor' && !o.payTest && !['iptal', 'iade'].includes(o.status) ? [{ label: 'Ödeme alındı', icon: 'check', onClick: async (c) => { if (!(await confirm(`${money(o.total)} ödemenin hesabınıza geçtiğini kontrol ettiniz mi?`))) return; o.payStatus = 'alindi'; (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note: 'Ödeme alındı', user: me() }); db.log('Ödeme alındı', o.no); db.save(); c(); app.refresh(); } }] : []),
        ...(o.status === 'yeni' ? [{ label: 'Hazırlanıyor', cls: 'primary', onClick: async (c) => { if (o.unmatched) return toast('Önce eşleşmeyen ürünü eşleştirin', 'err'); if (unpaid(o) && !(await confirm('Bu siparişin ödemesi alınmadı. Yine de hazırlansın mı?'))) return; setSt(o, 'hazirlaniyor'); db.save(); c(); app.refresh(); } }] : []),
        ...(o.status === 'hazirlaniyor' ? [{ label: 'Kargoya ver', cls: 'primary', icon: 'truck', onClick: (c) => { c(); ship(app, o); } }] : []),
        ...(o.status === 'kargoda' ? [{ label: 'Teslim edildi', cls: 'ok', onClick: (c) => { setSt(o, 'teslim'); o.deliveredAt = new Date().toISOString(); if (o.payStatus === 'kapida') o.payStatus = 'alindi'; db.save(); c(); app.refresh(); } }] : []),
      ],
    });
  }
  function restock(o) { o.items.forEach((i) => { const v = prod(i.pid).variants.find((x) => x.id === i.vid); if (v) v.stock += i.qty; }); }
  async function ship(app, o) {
    const trackOnly = !!(NS.integ && NS.integ.isOn('kargofirma') && NS.integ.TRACK[NS.integ.cfg('kargofirma').provider]);
    const api = NS.integ && NS.integ.isOn('kargofirma') && !trackOnly;
    const v = await formModal({ title: `Kargoya ver — ${o.no}`, fields: [{ name: 'carrier', label: 'Kargo firması', type: 'select', options: String(S().carriers || '').split(',').map((x) => x.trim()).filter(Boolean) }, { name: 'desi', label: 'Desi', type: 'number', value: Math.max(1, sum(o.items, (i) => i.qty)) }, { name: 'tracking', label: api ? 'Takip numarası (boşsa kargo firmasından alınır)' : 'Takip numarası (kargo firmasının verdiği)', required: !api, value: '' }, { name: 'eirs', label: 'e-Fatura / e-Arşiv fatura kes', type: 'checkbox', value: !!(NS.ebelge && NS.integ && NS.integ.cfg('efatura').provider !== 'sim') && !o.ebelge }] });
    if (!v) return;
    // Kargo firması API: gönderi oluşturulur, takip no ve barkod geri döner
    if (api && !v.tracking) { const r = await NS.integ.call('kargofirma', 'gonderi-olustur', { carrier: v.carrier, ref: o.no, desi: v.desi, cod: o.pay === 'kapida' ? o.total : 0, receiver: o.ship, sender: { name: S().bizName, phone: S().bizPhone, address: S().bizAddress } }, { silent: true }); if (!r || !r.ok) return toast(`Gönderi oluşturulamadı: ${(r && r.error) || 'kargo bağlantısı kapalı'}`, 'err'); if (r.simulated || !(r.data && r.data.tracking)) return toast('TEST: kargo bağlantısı simülasyonda, gönderi oluşturulmadı. Takip numarasını kargo firmasından alıp girin.', 'warn'); v.tracking = r.data.tracking; }
    const eirs = v.eirs; delete v.eirs;
    Object.assign(o, v); o.shippedAt = new Date().toISOString(); setSt(o, 'kargoda', `Kargoya verildi: ${v.carrier} ${v.tracking}`); db.log('Kargoya verildi', o.no); db.save();
    if (eirs) await invoice(o);
    if (o.channelNo && MP.CH[o.channel]) MP.shipNotify(o);
    const sm = NS.integ ? await NS.integ.sms(o.ship.phone, `${S().bizName}: ${o.no} nolu siparişiniz ${o.carrier} ile kargoya verildi. Takip no: ${o.tracking}`, { silent: true }) : { ok: false, error: 'SMS tanımlı değil' };
    toast(sm.ok && !sm.simulated ? 'Kargoya verildi, müşteriye SMS gönderildi' : sm.simulated ? 'Kargoya verildi · SMS TEST (gönderilmedi)' : `Kargoya verildi · SMS gönderilmedi: ${sm.error || 'kapalı'}`, sm.ok && !sm.simulated ? 'ok' : 'warn'); printLabel(o); app.refresh();
  }
  // e-Fatura / e-Arşiv: NS.ebelge üzerinden; tutar sipariş toplamıyla aynı, kurumsal fatura istenmişse VKN ile
  async function invoice(o) {
    if (!NS.ebelge) return toast('e-Belge modülü yüklü değil', 'err');
    const inv = o.invoice && o.invoice.taxNo ? o.invoice : null; const c = db.get('customers', o.customer) || {};
    const r = await NS.ebelge.create({ docType: inv ? 'auto' : 'e-Arşiv', no: o.no, buyer: inv ? inv.title || o.ship.name : o.ship.name, buyerVkn: inv ? inv.taxNo : '', buyerTaxOffice: inv ? inv.taxOffice : '', buyerEmail: c.email || '', address: o.ship.address, district: o.ship.district || '', city: o.ship.city, note: `Sipariş ${o.no}${o.channelNo ? ' · ' + (MP.CH[o.channel] || {}).name + ' ' + o.channelNo : ''}`, lines: invLines(o) });
    if (r && r.ok) { o.ebelge = { type: r.type, no: r.no, id: r.id, test: !!r.simulated }; db.save(); }
    return r;
  }
  function printSlip(o) { NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>PAKET FİŞİ — ${esc(o.no)}</h3><p><b>${esc(o.ship.name)}</b> · ${esc(o.ship.phone)}<br>${esc(o.ship.address)}, ${esc(o.ship.city)}</p><table><tr><th>Ürün</th><th>Varyant</th><th>SKU</th><th>Adet</th><th>✓</th></tr>${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.variant)}</td><td>${esc((prod(i.pid).variants.find((v) => v.id === i.vid) || {}).sku || '')}</td><td>${i.qty}</td><td>☐</td></tr>`).join('')}</table><p>Ödeme: ${PAY[o.pay]} ${o.pay === 'kapida' ? `— <b>Kapıda tahsil: ${money(o.total)}</b>` : ''}</p><p style="margin-top:30px">Bizi tercih ettiğiniz için teşekkürler 💜</p></div>`, { title: o.no }); }
  function printLabel(o) { if (!o.tracking) return toast('Takip numarası olmadan etiket basılmaz', 'err'); NS.printHtml(`<div style="border:2px solid #000;padding:12px;width:360px;font-family:Arial"><div style="display:flex;justify-content:space-between"><b>${esc(o.carrier)}</b><b>${esc(o.no)}</b></div><hr><div style="font-size:11px">GÖNDERİCİ: ${esc(S().bizName)} · ${esc(S().bizPhone)}</div><div style="font-size:16px;margin-top:8px"><b>ALICI: ${esc(o.ship.name)}</b></div><div>${esc(o.ship.address)}</div><div><b>${esc(o.ship.city)}</b> · ${esc(o.ship.phone)}</div>${o.pay === 'kapida' ? `<div style="background:#000;color:#fff;padding:4px;margin-top:6px;text-align:center"><b>KAPIDA ÖDEME ${money(o.total)}</b></div>` : ''}<div style="margin-top:8px">${NS.barcodeSvg(o.tracking, { height: 50 })}</div></div>`, { title: 'Kargo etiketi' }); }

  function ordersPage(el, p, app) {
    let q = '', f = p || 'aktif';
    el.innerHTML = pageHead('Siparişler', 'Mağaza ve pazaryeri siparişleri', `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><button class="btn" id="mp">${icon('download')} Pazaryeri siparişlerini çek</button><button class="btn" id="ex">${icon('download')}</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Sipariş no, müşteri, takip no...')}<div class="seg">${[['aktif', 'Aktif'], ['yeni', 'Yeni'], ['hazirlaniyor', 'Hazırlanan'], ['kargoda', 'Kargoda'], ['teslim', 'Teslim'], ['iptal', 'İptal/İade'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}${v === 'yeni' ? ` (${db.all('orders', (o) => o.status === 'yeni').length})` : ''}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('orders', (o) => (f === 'all' || (f === 'aktif' ? ['yeni', 'hazirlaniyor', 'kargoda'].includes(o.status) : f === 'iptal' ? ['iptal', 'iade'].includes(o.status) : o.status === f)) && NS.match(q, o.no, o.ship.name, o.ship.phone, o.tracking)).sort((a, b) => b.at.localeCompare(a.at));
    // Telefonda tablo yerine kart listesi: tutar ve durum kaydırmadan görünür
    const narrow = () => window.matchMedia('(max-width: 700px)').matches;
    const stB = (o) => badge(SH.ST[o.status][0], SH.ST[o.status][1]) + ((o.returned || []).length && o.status !== 'iade' ? ' ' + badge('Kısmi iade', 'warn') : '');
    const draw = () => {
      const r = rows(); const foot = `${r.length} sipariş · ${money(sum(r, (o) => o.total))}${r.length > 300 ? ' · ilk 300 gösteriliyor, aramayı daraltın' : ''}`;
      if (narrow()) { $('#t', el).innerHTML = r.length ? `<div class="card-b">${r.slice(0, 300).map((o) => `<div class="list-item" data-act="v" data-id="${o.id}" style="cursor:pointer;align-items:flex-start"><div class="grow"><b>${esc(o.no)}</b> ${chTag(o)}${unmatchedB(o)}<div class="small">${esc(o.ship.name)} · ${esc(o.ship.city)}</div><div class="small faint">${NS.dt(o.at)}</div><div class="mt">${stB(o)} ${unpaid(o) ? payB(o) : ''}</div></div><b>${money(o.total)}</b></div>`).join('')}</div><div class="card-b small faint">${foot}</div>` : `<div class="empty">${icon('bag')}<div>Sipariş yok</div></div>`; return; }
      $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'bag', columns: [{ label: 'Sipariş', render: (o) => `<b>${esc(o.no)}</b> ${chTag(o)}${unmatchedB(o)}<div class="small faint">${NS.dt(o.at)}</div>` }, { label: 'Müşteri', render: (o) => `${esc(o.ship.name)}<div class="small faint">${esc(o.ship.city)}</div>` }, { label: 'Ürün', render: (o) => `<span class="small">${esc(o.items.map((i) => i.name).join(', ')).slice(0, 60)}</span>` }, { label: 'Ödeme', render: (o) => `${badge(PAY[o.pay], o.pay === 'kapida' ? 'warn' : 'info')}${unpaid(o) ? '<div class="mt">' + payB(o) + '</div>' : ''}` }, { label: 'Durum', render: stB }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>` }], actions: [{ icon: 'eye', act: 'v' }], foot });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    // Trendyol / Hepsiburada / n11... siparişleri mağaza siparişi gibi düşer, stok varyanttan düşülür
    $('#mp', el).onclick = async () => {
      // Canlı kanal varsa doğrudan pazaryeri API'sinden çekilir
      if (Object.keys(MP.CH).some((k) => MP.isLive(k))) { const n = await MP.pullOrders(); toast(n.err || `${n.count} pazaryeri siparişi alındı`, n.err ? 'err' : n.count ? 'ok' : ''); return app.refresh(); }
      // Simülasyonda sipariş uydurulmaz (CLAUDE.md §1): yalnızca gerçek servisin döndürdüğü siparişler kaydedilir
      if (!NS.integ) return; const r = await NS.integ.call('pazaryeri', 'siparis-cek', { since: S().mpSince || '' }, { silent: true });
      if (!r || !r.ok) return toast(r && r.disabled ? 'Canlı bağlı pazaryeri yok. Pazaryeri Merkezi’nde kanalın ⚙ ayarından canlı modu açın.' : `Siparişler alınamadı: ${(r && r.error) || 'bağlantı yok'}`, 'warn');
      if (r.simulated) return toast('TEST: pazaryeri bağlantısı simülasyonda, sipariş alınmadı', 'warn');
      const n = MP.importOrders(r.data && Array.isArray(r.data.orders) ? r.data.orders : []);
      db.saveSettings({ mpSince: new Date().toISOString() }); db.save(); toast(`${n} pazaryeri siparişi alındı`, n ? 'ok' : ''); app.refresh();
    };
    $('#ex', el).onclick = () => NS.csv('siparisler', rows(), [{ key: 'no', label: 'No' }, { label: 'Tarih', value: (o) => NS.dt(o.at) }, { label: 'Müşteri', value: (o) => o.ship.name }, { label: 'Şehir', value: (o) => o.ship.city }, { label: 'Durum', value: (o) => SH.ST[o.status][0] }, { key: 'total', label: 'Tutar' }, { key: 'tracking', label: 'Takip' }]);
    draw();
  }

  // ---------- Ürünler ----------
  async function productEditor(app, rec) {
    const p = rec ? JSON.parse(JSON.stringify(rec)) : { name: '', cat: (db.all('cats')[0] || {}).id || '', price: 0, sale: null, vat: '', desc: '', colors: ['Siyah'], variants: [], tags: [], active: true };
    const sizesOf = (cat) => (cat === 'ayakkabi' ? ['36', '37', '38', '39', '40'] : cat === 'aksesuar' ? ['Standart'] : ['XS', 'S', 'M', 'L', 'XL']);
    modal({
      title: rec ? p.name : 'Yeni ürün', size: 'xl',
      body: `<div class="grid g2"><div id="pf">${NS.fieldsHtml([{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'cat', label: 'Kategori', type: 'select', options: db.all('cats').map((c) => ({ value: c.id, label: c.name })) }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'sale', label: 'İndirimli fiyat (₺)', type: 'number' }, { name: 'vat', label: 'KDV oranı', type: 'select', options: [{ value: '', label: `Mağaza varsayılanı (%${Number(S().vat ?? 20)})` }, { value: '0', label: '%0' }, { value: '1', label: '%1' }, { value: '10', label: '%10' }, { value: '20', label: '%20' }], hint: 'Faturada ve pazaryerinde kullanılır; oranı mali müşavirinize danışın' }, { name: 'tagsStr', label: 'Etiketler (virgülle)', hint: 'Yeni, Çok satan, Son ürünler' }, { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }, { name: 'active', label: 'Mağazada yayında', type: 'checkbox' }], { ...p, tagsStr: (p.tags || []).join(', ') })}</div>
        <div><h3 class="mb">Renkler</h3><div class="row mb">${Object.keys(SH.COLORS).map((c) => `<label class="check small"><input type="checkbox" data-col="${c}" ${p.colors.includes(c) ? 'checked' : ''}><span class="sw" style="background:${SH.COLORS[c]}"></span>${c}</label>`).join('')}</div>
        <h3 class="mb">Varyant stokları</h3><div id="vg" style="overflow:auto"></div><h3 class="mb mt">Stok kodu ve barkod</h3><div class="small faint mb">Pazaryerleri varyantı barkodla tanır. Boş stok kodu kaydederken üretilir.</div><div id="vc" style="overflow:auto"></div></div></div>`,
      onOpen: (b) => {
        const draw = () => {
          const cat = $('[name=cat]', b).value; const sizes = sizesOf(cat);
          $('#vg', b).innerHTML = p.colors.length ? `<table class="vgrid"><tr><th></th>${sizes.map((s) => `<th>${s}</th>`).join('')}</tr>${p.colors.map((c) => `<tr><th><span class="sw" style="background:${SH.COLORS[c]}"></span> ${c}</th>${sizes.map((s) => { const v = p.variants.find((x) => x.color === c && x.size === s); return `<td><input class="input" type="number" min="0" data-v="${c}|${s}" value="${v ? v.stock : 0}"></td>`; }).join('')}</tr>`).join('')}</table>` : '<div class="faint small">Renk seçin</div>';
          $('#vc', b).innerHTML = p.colors.length ? `<table class="vgrid"><tr><th>Varyant</th><th>Stok kodu (SKU)</th><th>Barkod</th></tr>${p.colors.flatMap((c) => sizes.map((s) => { const v = p.variants.find((x) => x.color === c && x.size === s) || {}; return `<tr><th class="small">${c} / ${s}</th><td><input class="input" style="width:150px;text-align:left" data-code="sku|${c}|${s}" value="${esc(v.sku || '')}"></td><td><input class="input" style="width:150px;text-align:left" inputmode="numeric" data-code="barcode|${c}|${s}" value="${esc(v.barcode || '')}"></td></tr>`; })).join('')}</table>` : '';
        };
        const vOf = (c, s) => { let v = p.variants.find((y) => y.color === c && y.size === s); if (!v) { v = { id: NS.uid(), color: c, size: s, stock: 0, sku: '' }; p.variants.push(v); } return v; };
        on(b, 'input', '[data-code]', (e, x) => { const [f, c, s] = x.dataset.code.split('|'); vOf(c, s)[f] = x.value.trim(); });
        on(b, 'change', '[data-col]', (e, x) => { const c = x.dataset.col; p.colors = x.checked ? [...p.colors, c] : p.colors.filter((y) => y !== c); draw(); });
        on(b, 'input', '[data-v]', (e, x) => { const [c, s] = x.dataset.v.split('|'); let v = p.variants.find((y) => y.color === c && y.size === s); if (!v) { v = { id: NS.uid(), color: c, size: s, stock: 0, sku: '' }; p.variants.push(v); } v.stock = Math.max(0, Number(x.value) || 0); });
        $('[name=cat]', b).onchange = draw;
        draw();
      },
      actions: [{ label: 'Vazgeç' }, { label: 'Kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => {
        if (!NS.validate($('#pf', b))) return;
        const v = NS.readForm($('#pf', b)); if (!p.colors.length) return toast('En az bir renk seçin', 'err');
        const sizes = sizesOf(v.cat);
        p.variants = p.variants.filter((x) => p.colors.includes(x.color) && sizes.includes(x.size));
        p.colors.forEach((col) => sizes.forEach((s) => { if (!p.variants.find((x) => x.color === col && x.size === s)) p.variants.push({ id: NS.uid(), color: col, size: s, stock: 0 }); }));
        // Stok kodu ve barkod tüm ürünlerde benzersiz olmalı (pazaryeri yanlış varyanta stok yazmasın)
        const taken = new Map(); db.all('products', (x) => !rec || x.id !== rec.id).forEach((x) => x.variants.forEach((y) => [y.sku, y.barcode, ...(y.aliases || [])].filter(Boolean).forEach((k) => taken.set(String(k).toUpperCase(), x.name))));
        const base = NS.slug(v.name).replace(/-/g, '').toUpperCase().slice(0, 6) || 'URUN';
        p.variants.forEach((x) => { if (!x.sku) { let k = `${base}-${x.color.slice(0, 3).toLocaleUpperCase('tr')}-${x.size}`, n = 1; while (taken.has(k.toUpperCase()) || p.variants.some((y) => y !== x && y.sku === k)) k = `${base}${++n}-${x.color.slice(0, 3).toLocaleUpperCase('tr')}-${x.size}`; x.sku = k; } });
        const seen = new Set(); for (const x of p.variants) for (const k of [x.sku, x.barcode].filter(Boolean)) { const K = String(k).toUpperCase(); if (taken.has(K)) return toast(`${k} kodu "${taken.get(K)}" ürününde kullanılıyor`, 'err'); if (seen.has(K)) return toast(`${k} kodu bu üründe iki varyantta var`, 'err'); seen.add(K); }
        if (p.variants.some((x) => x.barcode && !/^[0-9A-Za-z.\-_]{4,40}$/.test(x.barcode))) return toast('Barkod yalnızca harf, rakam ve . - _ içerebilir', 'err');
        Object.assign(p, { name: v.name, cat: v.cat, price: Number(v.price) || 0, sale: Number(v.sale) || null, vat: v.vat === '' ? '' : Number(v.vat), desc: v.desc, active: v.active, tags: v.tagsStr.split(',').map((t) => t.trim()).filter(Boolean), slug: NS.slug(v.name) });
        delete p.tagsStr;
        if (rec) db.update('products', rec.id, p); else db.insert('products', { ...p, views: 0 });
        c(); toast('Ürün kaydedildi', 'ok'); app.refresh();
      } }],
    });
  }
  function productsPage(el, p, app) {
    let q = '', c = '', low = false;
    el.innerHTML = pageHead('Ürünler', 'Varyant (renk/beden) bazlı stok', `<button class="btn" id="ex">${icon('download')}</button><button class="btn" id="mps">${icon('store')} Pazaryerine gönder</button><button class="btn primary" id="np">${icon('plus')} Yeni ürün</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Ürün adı, SKU, barkod...')}<select class="input" id="c" style="max-width:190px"><option value="">Tüm kategoriler</option>${db.all('cats').map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><label class="check small"><input type="checkbox" id="low"> Tükenen varyantı olanlar</label></div><div id="t"></div></div>`;
    // 45 günlük satış bir kez hesaplanır (her satırda tüm siparişleri taramaz)
    const since45 = addDays(new Date(), -45).toISOString(); const sold = {};
    db.all('orders', (o) => o.at >= since45 && !['iptal', 'iade'].includes(o.status)).forEach((o) => o.items.forEach((i) => { sold[i.pid] = (sold[i.pid] || 0) + i.qty - retQty(o, i.vid); }));
    const draw = () => { const rows = db.all('products', (x) => (!c || x.cat === c) && (!low || x.variants.some((v) => v.stock === 0)) && NS.match(q, x.name, ...x.variants.map((v) => v.sku), ...x.variants.map((v) => v.barcode))); $('#t', el).innerHTML = table({ rows, columns: [{ label: 'Ürün', render: (x) => `<div class="row nw">${img(x)}<div><b>${esc(x.name)}</b> ${x.tags.map((t) => badge(t, 'acc')).join(' ')}${x.active ? '' : ' ' + badge('Yayında değil', 'err')}<div class="small faint">${esc(catName(x.cat))} · ${x.colors.map((col) => `<span class="sw" style="background:${SH.COLORS[col]}" title="${col}"></span>`).join(' ')}</div></div></div>` }, { label: 'Fiyat', cls: 'right', render: (x) => (x.sale ? `<s class="faint">${money(x.price)}</s><br><b style="color:var(--err)">${money(x.sale)}</b>` : `<b>${money(x.price)}</b>`) }, { label: 'Stok', cls: 'right', render: (x) => { const s = SH.stock(x); const z = x.variants.filter((v) => v.stock === 0).length; return `${s}${z ? `<div>${badge(z + ' varyant tükendi', 'warn')}</div>` : ''}`; } }, { label: 'Satış (45 gün)', cls: 'right', render: (x) => sold[x.id] || 0 }, { label: 'Görüntülenme', cls: 'right', render: (x) => num(x.views) }], actions: [{ icon: 'eye', act: 'view', title: 'Mağazada gör' }, { icon: 'edit', act: 'ed' }, { icon: 'trash', act: 'del' }], foot: `${rows.length} ürün · ${num(sum(rows, SH.stock))} adet stok` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#c', el).onchange = (e) => { c = e.target.value; draw(); };
    $('#low', el).onchange = (e) => { low = e.target.checked; draw(); };
    $('#mps', el).onclick = () => { location.hash = '#/listeleme'; };
    $('#np', el).onclick = () => productEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => { const x = db.get('products', b.dataset.id); if (b.dataset.act === 'ed') productEditor(app, x); else if (b.dataset.act === 'view') window.open(`magaza.html#/urun/${x.slug}`, '_blank'); else if (await confirm(`${x.name} silinsin mi?`)) { db.remove('products', x.id); draw(); } });
    $('#ex', el).onclick = () => NS.csv('urunler', db.all('products').flatMap((x) => x.variants.map((v) => ({ x, v }))), [{ label: 'Ürün', value: (r) => r.x.name }, { label: 'SKU', value: (r) => r.v.sku }, { label: 'Renk', value: (r) => r.v.color }, { label: 'Beden', value: (r) => r.v.size }, { label: 'Stok', value: (r) => r.v.stock }, { label: 'Fiyat', value: (r) => SH.price(r.x) }]);
    draw();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const ok = db.all('orders', (o) => !['iptal', 'iade'].includes(o.status));
    const t = today(); const d30 = addDays(new Date(), -30).toISOString();
    const todayO = ok.filter((o) => iso(o.at) === t), m30 = ok.filter((o) => o.at > d30);
    const ser = NS.dailySeries(ok, 30, 'at', (o) => o.total);
    const topMap = {}; m30.forEach((o) => o.items.forEach((i) => { topMap[i.pid] = (topMap[i.pid] || 0) + i.qty; }));
    const top = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const zeroV = db.all('products').flatMap((x) => x.variants.filter((v) => v.stock === 0).map((v) => ({ x, v })));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><a class="btn primary" href="#/siparisler/yeni">${icon('bag')} Yeni siparişler (${db.all('orders', (o) => o.status === 'yeni').length})</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün sipariş', todayO.length, 'bag', '', `<div class="small faint">${money(sum(todayO, (o) => o.total))}</div>`)}${kpi('30 gün ciro', money(sum(m30, (o) => o.total)), 'trend', 'ok')}${kpi('Ortalama sepet', money(m30.length ? sum(m30, (o) => o.total) / m30.length : 0), 'cart', 'info')}${kpi('Kargolanacak', db.all('orders', (o) => ['yeni', 'hazirlaniyor'].includes(o.status)).length, 'truck', 'warn')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük ciro (30 gün)</h3></div><div class="card-b">${chart.line([{ name: 'Ciro', values: ser.values }], ser.labels, { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Trafik kaynakları</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => (o.channel ? (MP.CH[o.channel] || {}).name || o.channel : 'Kendi mağaza'))).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Çok satanlar</h3></div><div class="card-b">${top.map(([id, n]) => `<div class="list-item">${img(prod(id))}<span class="grow"><b>${esc(prod(id).name)}</b></span><b>${n} adet</b></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('cart')} Terk edilen sepetler</h3><a class="btn sm" href="#/sepetler">Tümü</a></div><div class="card-b">${db.all('carts', (c) => !c.reminded).slice(0, 5).map((c) => `<div class="list-item small"><span class="grow"><b>${esc(c.name)}</b><div class="faint">${NS.ago(c.at)}</div></span><b>${money(c.total)}</b></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Tükenen varyantlar (${zeroV.length})</h3></div><div class="card-b" style="max-height:300px;overflow:auto">${zeroV.slice(0, 12).map((r) => `<div class="list-item small"><span class="grow">${esc(r.x.name)}</span>${badge(`${r.v.color} / ${r.v.size}`, 'err')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>`;
  }
  function cartsPage(el, p, app) {
    const rows = db.all('carts').sort((a, b) => b.at.localeCompare(a.at));
    el.innerHTML = pageHead('Terk Edilen Sepetler', 'Ödeme adımına gelip tamamlamayan ziyaretçiler — hatırlatma ile geri kazanın') + `<div class="grid g3 mb">${kpi('Bekleyen sepet', rows.filter((c) => !c.reminded).length, 'cart', 'warn')}${kpi('Potansiyel ciro', money(sum(rows, (c) => c.total)), 'wallet', 'info')}${kpi('Hatırlatılan', rows.filter((c) => c.reminded).length, 'send', 'ok')}</div>
      <div class="card">${table({ rows, empty: 'Terk edilen sepet yok', columns: [{ label: 'Ziyaretçi', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}</div>` }, { label: 'Ürünler', render: (c) => esc(c.items.map((i) => i.name).join(', ')) }, { label: 'Zaman', render: (c) => NS.ago(c.at) }, { label: 'Tutar', cls: 'right', render: (c) => `<b>${money(c.total)}</b>` }, { label: 'Durum', render: (c) => (c.reminded ? badge('Hatırlatıldı', 'ok') : badge('Bekliyor', 'warn')) }], actions: [{ icon: 'message', act: 'wa', title: 'WhatsApp ile hatırlat' }] })}</div>`;
    on(el, 'click', '[data-act=wa]', (e, b) => { const c = db.get('carts', b.dataset.id); c.reminded = true; db.save(); window.open(`https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Merhaba ${c.name}, sepetinizde ${c.items.map((i) => i.name).join(', ')} sizi bekliyor 💜 HOSGELDIN koduyla %10 indirim: ${shopUrl()}`)}`, '_blank', 'noopener'); app.refresh(); });
  }
  function returnsPage(el, p, app) {
    const RS = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi', 'err'] };
    el.innerHTML = pageHead('İade Talepleri', 'Müşterilerin mağazadan oluşturduğu iade talepleri', `<button class="btn" id="nr">${icon('plus')} İade kaydı</button>`) + `<div class="card">${table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)), empty: 'İade talebi yok', columns: [{ label: 'Sipariş', render: (r) => `<b>${esc((db.get('orders', r.order) || {}).no || '-')}</b>` }, { label: 'Müşteri', render: (r) => esc(((db.get('orders', r.order) || {}).ship || {}).name || '-') }, { label: 'Neden', key: 'reason' }, { label: 'Tarih', render: (r) => NS.ago(r.at) }, { label: 'Ürün', render: (r) => (r.items ? `<span class="small">${esc(r.items.map((i) => `${i.qty}× ${i.name}`).join(', '))}</span>` : '<span class="small faint">Tümü</span>') }, { label: 'İade tutarı', cls: 'right', render: (r) => (r.refund != null ? `<b>${money(r.refund)}</b>` : `<span class="faint">${money((db.get('orders', r.order) || {}).total || 0)}</span>`) }, { label: 'Durum', render: (r) => badge(RS[r.status][0], RS[r.status][1]) }], actions: [{ label: 'Onayla', act: 'ok', show: (r) => r.status === 'bekliyor' }, { label: 'Reddet', act: 'no', show: (r) => r.status === 'bekliyor' }] })}</div>`;
    on(el, 'click', '[data-act=no]', async (e, b) => { const r = db.get('returns', b.dataset.id); if (!(await confirm('İade talebi reddedilsin mi?'))) return; r.status = 'red'; r.decidedAt = new Date().toISOString(); r.by = me(); db.log('İade reddedildi', (db.get('orders', r.order) || {}).no || ''); db.save(); toast('İade reddedildi', 'ok'); app.refresh(); });
    on(el, 'click', '[data-act=ok]', (e, b) => { const r = db.get('returns', b.dataset.id); const o = db.get('orders', r.order); if (!o) return toast('Sipariş bulunamadı', 'err'); approve(o, r); });
    $('#nr', el).onclick = async () => { const v = await formModal({ title: 'İade kaydı', fields: [{ name: 'no', label: 'Sipariş no', required: true }, { name: 'reason', label: 'Neden', type: 'select', options: ['Beden uymadı', 'Ürün beklentimi karşılamadı', 'Kusurlu / hasarlı', 'Yanlış ürün gönderildi', 'Diğer'] }] }); if (!v) return; const o = db.find('orders', (x) => x.no.toUpperCase() === v.no.trim().toUpperCase() || x.channelNo === v.no.trim()); if (!o) return toast('Sipariş bulunamadı', 'err'); if (['iptal', 'iade'].includes(o.status)) return toast('Bu sipariş iptal veya iade edilmiş', 'err'); approve(o, db.insert('returns', { order: o.id, reason: v.reason, at: new Date().toISOString(), status: 'bekliyor' }, true)); };
    // Kısmi iade: hangi üründen kaç adet döndüğü, stoğa eklenip eklenmeyeceği ve iade edilen tutar seçilir
    function approve(o, r) {
      const open = o.items.map((i, k) => ({ i, k, left: i.qty - retQty(o, i.vid) })).filter((x) => x.left > 0);
      if (!open.length) return toast('Bu siparişte iade edilecek ürün kalmadı', 'err');
      const calc = (b) => r2(sum(open, (x) => (Number(($(`[data-rq="${x.k}"]`, b) || {}).value) || 0) * x.i.price));
      modal({ title: `İade onayı — ${o.no}`, body: `<p class="small muted">Neden: ${esc(r.reason || '-')}</p>${open.map((x) => `<div class="list-item">${img(prod(x.i.pid))}<div class="grow"><b>${esc(x.i.name)}</b><div class="small muted">${esc(x.i.variant)} · ${money(x.i.price)}</div></div><input class="input" type="number" min="0" max="${x.left}" value="${x.left}" data-rq="${x.k}" style="width:70px"> <span class="small faint">/ ${x.left}</span></div>`).join('')}
        <div class="form-grid mt"><div class="field"><label>İade edilecek tutar (₺)</label><input class="input" type="number" step="0.01" id="rf" value="${calc(document)}"></div><div class="field"><label class="check"><input type="checkbox" id="rs" checked> Ürünler sağlam, stoğa ekle</label></div></div><p class="small faint">Tutar, kupon indirimi ve kargo bedeli için elle düzeltilebilir. Para iadesini ödeme kanalınızdan yapın; burada yalnızca kaydı tutulur.</p>`,
        onOpen: (b) => { $('#rf', b).value = calc(b); on(b, 'input', '[data-rq]', () => { $('#rf', b).value = calc(b); }); },
        actions: [{ label: 'Vazgeç' }, { label: 'İadeyi onayla', cls: 'primary', onClick: (c, b) => {
          const its = open.map((x) => ({ x, qty: Math.min(x.left, Math.max(0, Math.floor(Number($(`[data-rq="${x.k}"]`, b).value) || 0))) })).filter((y) => y.qty > 0);
          if (!its.length) return toast('En az bir ürün seçin', 'err');
          const refund = r2(Number($('#rf', b).value) || 0); const rs = $('#rs', b).checked;
          its.forEach(({ x, qty }) => { (o.returned = o.returned || []).push({ vid: x.i.vid, qty, at: new Date().toISOString() }); if (rs) { const v = prod(x.i.pid).variants.find((y) => y.id === x.i.vid); if (v) v.stock += qty; } });
          Object.assign(r, { status: 'onay', items: its.map(({ x, qty }) => ({ vid: x.i.vid, name: `${x.i.name} ${x.i.variant || ''}`.trim(), qty })), refund, restocked: rs, decidedAt: new Date().toISOString(), by: me() });
          o.refunded = r2((o.refunded || 0) + refund);
          const all = o.items.every((i) => retQty(o, i.vid) >= i.qty);
          if (all) setSt(o, 'iade', `İade: ${money(refund)}`); else (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note: `Kısmi iade: ${its.map(({ x, qty }) => `${qty}× ${x.i.name}`).join(', ')} · ${money(refund)}`, user: me() });
          if (rs && o.channelNo) MP.stockChanged(its.map(({ x }) => ({ vid: x.i.vid })));
          db.log('İade onaylandı', `${o.no} · ${money(refund)}`); db.save(); c(); toast(`İade kaydedildi${rs ? ', stok güncellendi' : ''}`, 'ok'); app.refresh();
        } }] });
    }
  }
  function customersPage(el, p, app) {
    const ords = db.all('orders', (o) => !['iptal'].includes(o.status));
    NS.crud(el, app, {
      col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'city', label: 'Şehir' }, { name: 'address', label: 'Adres', full: true }],
      sort: (a, b) => sum(ords.filter((o) => o.customer === b.id), (o) => o.total) - sum(ords.filter((o) => o.customer === a.id), (o) => o.total), searchFields: (c) => [c.name, c.phone, c.email, c.city],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.email || '')}</div>` }, { key: 'city', label: 'Şehir' }, { label: 'Sipariş', cls: 'right', render: (c) => ords.filter((o) => o.customer === c.id).length }, { label: 'Toplam harcama', cls: 'right', render: (c) => `<b>${money(sum(ords.filter((o) => o.customer === c.id), (o) => o.total))}</b>` }, { label: 'Son sipariş', render: (c) => { const o = ords.filter((x) => x.customer === c.id).sort((a, b) => b.at.localeCompare(a.at))[0]; return o ? NS.ago(o.at) : '-'; } }],
    });
  }
  // Rapor dönemi: bu ay, geçen ay, son 30/90 gün, bu yıl, tümü veya serbest aralık
  function period(k, from, to) {
    const d = new Date(); const y = d.getFullYear(), m = d.getMonth(); const f = (x) => iso(x);
    if (k === 'bu-ay') return [f(new Date(y, m, 1)), today()];
    if (k === 'gecen-ay') return [f(new Date(y, m - 1, 1)), f(new Date(y, m, 0))];
    if (k === '30') return [f(addDays(d, -29)), today()];
    if (k === '90') return [f(addDays(d, -89)), today()];
    if (k === 'bu-yil') return [`${y}-01-01`, today()];
    if (k === 'aralik') return [from || '0000', to || '9999'];
    return ['0000', '9999'];
  }
  function reportsPage(el, p, app) {
    const st = (reportsPage.st = reportsPage.st || { k: '30', from: '', to: '' });
    const [a, b] = period(st.k, st.from, st.to); const inP = (o) => { const d = iso(o.at); return d >= a && d <= b; };
    const all = db.all('orders', inP);
    const ok = all.filter((o) => !['iptal', 'iade'].includes(o.status));
    const net = (o) => o.total - (o.refunded || 0);
    const byCat = {}; ok.forEach((o) => o.items.forEach((i) => { const c = catName(prod(i.pid).cat); byCat[c] = (byCat[c] || 0) + i.price * (i.qty - retQty(o, i.vid)); }));
    const byCity = NS.groupBy(ok, (o) => o.ship.city);
    const retN = all.filter((o) => o.status === 'iade' || (o.returned || []).length).length; const retRate = all.length ? (retN / all.length) * 100 : 0;
    const views = sum(db.all('products'), (x) => x.views); const pct = (n) => '%' + n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    const P = [['bu-ay', 'Bu ay'], ['gecen-ay', 'Geçen ay'], ['30', 'Son 30 gün'], ['90', 'Son 90 gün'], ['bu-yil', 'Bu yıl'], ['tum', 'Tümü'], ['aralik', 'Aralık']];
    el.innerHTML = pageHead('Raporlar', 'Kategori, şehir, ödeme ve dönüşüm analizleri', `<select class="input" id="pk" style="width:auto">${P.map(([v, l]) => `<option value="${v}" ${v === st.k ? 'selected' : ''}>${l}</option>`).join('')}</select>${st.k === 'aralik' ? `<input class="input" type="date" id="pf" value="${st.from}" style="width:auto"><input class="input" type="date" id="pt" value="${st.to}" style="width:auto">` : ''}`) + `
      <div class="grid g4 mb">${kpi('Net ciro', money(sum(ok, net)), 'trend', 'ok', `<div class="small faint">İadeler düşüldü · ${money(sum(all, (o) => o.refunded || 0))} iade</div>`)}${kpi('Sipariş', ok.length, 'bag')}${kpi('Dönüşüm oranı', views ? pct((ok.length / views) * 100) : '-', 'percent', 'info', '<div class="small faint">Sipariş / ürün görüntülenmesi (tüm zamanlar)</div>')}${kpi('İade oranı', pct(retRate), 'refresh', 'warn')}</div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), { format: money, size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Şehirler</h3></div><div class="card-b">${chart.bars(Object.entries(byCity).map(([label, v]) => ({ label: label.slice(0, 6), value: sum(v, net) })).sort((x, y) => y.value - x.value).slice(0, 10), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Ödeme yöntemleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(ok, (o) => PAY[o.pay])).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>`;
    $('#pk', el).onchange = (e) => { st.k = e.target.value; app.refresh(); };
    if ($('#pf', el)) { $('#pf', el).onchange = (e) => { st.from = e.target.value; app.refresh(); }; $('#pt', el).onchange = (e) => { st.to = e.target.value; app.refresh(); }; }
  }

  const ROLES = { admin: 'Mağaza sahibi', depo: 'Depo / sevkiyat' };
  NS.shell({
    id: 'eticaret', integrations: ['payment','sms','email','whatsapp','label','efatura','webhook','backup'], name: 'E-ticaret', tagline: 'Online Mağaza Yönetimi', icon: 'bag', accent: '#7c3aed', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['admin'] }, { id: 'siparisler', label: 'Siparişler', icon: 'bag', badge: true }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box' }, { id: 'kategoriler', label: 'Kategoriler', icon: 'grid', roles: ['admin'] }, ...MP.nav, { sec: 'Pazarlama' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['admin'] }, { id: 'kuponlar', label: 'Kuponlar', icon: 'ticket', roles: ['admin'] }, { id: 'sepetler', label: 'Terk Edilen Sepetler', icon: 'cart', roles: ['admin'] }, { id: 'iadeler', label: 'İadeler', icon: 'refresh' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Mağaza Ayarları', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'yeni').length || '', eslesmeyen: MP.unmatchedOrders().length || '' }),
    routes: {
      ...MP.routes, ozet: dashboard, siparisler: ordersPage, urunler: productsPage, musteriler: customersPage, sepetler: cartsPage, iadeler: returnsPage, raporlar: reportsPage,
      kategoriler: (el, p, a) => NS.crud(el, a, { col: 'cats', title: 'Kategoriler', single: 'Kategori', addLabel: 'Yeni kategori', fields: [{ name: 'name', label: 'Ad', required: true }], beforeSave: (v, rec) => { if (!rec) v.id = NS.slug(v.name); }, columns: [{ key: 'name', label: 'Kategori', render: (c) => `${SH.CAT_EMOJI[c.id] || '🛍️'} <b>${esc(c.name)}</b>` }, { label: 'Ürün', cls: 'right', render: (c) => db.all('products', (x) => x.cat === c.id).length }] }),
      kuponlar: (el, p, a) => NS.crud(el, a, { col: 'coupons', title: 'Kuponlar', single: 'Kupon', addLabel: 'Yeni kupon', emptyIcon: 'ticket', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'pct', label: 'Yüzde indirim' }, { value: 'tl', label: 'Tutar indirimi' }, { value: 'ship', label: 'Ücretsiz kargo' }] }, { name: 'value', label: 'Değer', type: 'number' }, { name: 'min', label: 'Alt limit (₺)', type: 'number' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { active: true, type: 'pct' }, beforeSave: (v) => { v.code = v.code.toUpperCase(); }, columns: [{ key: 'code', label: 'Kod', render: (k) => `<b class="mono">${esc(k.code)}</b>` }, { label: 'İndirim', render: (k) => (k.type === 'pct' ? '%' + k.value : k.type === 'tl' ? money(k.value) : 'Ücretsiz kargo') }, { key: 'min', label: 'Alt limit', render: (k) => money(k.min || 0) }, { key: 'uses', label: 'Kullanım', cls: 'right', render: (k) => k.uses || 0 }, { label: 'Durum', render: (k) => (k.active ? badge('Aktif', 'ok') : badge('Pasif')) }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza' }, { name: 'banner', label: 'Duyuru bandı', full: true }, { name: 'freeShip', label: 'Ücretsiz kargo eşiği (₺)', type: 'number' }, { name: 'shipFee', label: 'Kargo ücreti (₺)', type: 'number' }, { name: 'codFee', label: 'Kapıda ödeme bedeli (₺)', type: 'number' }, { name: 'vat', label: 'Varsayılan ürün KDV oranı (%)', type: 'number', hint: 'Ürün kartında ayrı oran seçilmemişse faturada bu kullanılır' }, { name: 'bankHolder', label: 'Havale alıcı adı' }, { name: 'iban', label: 'Havale IBAN', full: true }, { name: 'carriers', label: 'Kargo firmaları (virgülle)', full: true }] }),
    },
  });
  window.addEventListener('storage', (e) => { if (e.key === db.key) db.load(); });
})();
