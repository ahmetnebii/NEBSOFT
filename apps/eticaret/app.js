/* NEBSOFT E-ticaret — mağaza yönetimi: sipariş, ürün/varyant, müşteri, kupon, terk edilen sepet, iade ve raporlar */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const SH = window.SHOP;
  const db = new NS.DB('eticaret', SH.seed);
  const MP = window.MPHUB; MP.ensure(db);
  const chTag = (o) => (MP.CH[o.channel] ? MP.chBadge(o.channel) : '');
  const S = () => db.settings({});
  // Ürün sorgusu sipariş kalemi başına çalışır: dizi taranmaz, dizi veya boyu değişince dizin yeniden kurulur
  const pIdx = { c: null, n: -1, m: new Map() };
  const prod = (id) => { const c = db.col('products'); if (pIdx.c !== c || pIdx.n !== c.length) { pIdx.c = c; pIdx.n = c.length; pIdx.m = new Map(c.map((x) => [x.id, x])); } return pIdx.m.get(id) || { name: '-', variants: [], colors: [] }; };
  const isAdm = () => !NS.currentUser || NS.currentUser.role === 'admin'; // Depo: para, iptal ve iade kararı dışındaki işler
  const cust = (id) => db.get('customers', id) || { name: '-' };
  const catName = (id) => (db.get('cats', id) || {}).name || '-';
  const img = (p) => `<div class="pimg" style="background:#f4f1ec;overflow:hidden;padding:0"><img src="${SH.imgUrl(SH.photos(p)[0], 120, 120)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;this.src='${SH.fallback(p)}'"></div>`;
  const PAY = { kart: 'Kredi kartı', kapida: 'Kapıda ödeme', havale: 'Havale/EFT', nakit: 'Nakit' };
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
  const shortB = (o) => (o.items.some((i) => i.short) ? ' ' + badge('Stok yetmedi', 'err') : '');
  const hist = (o, note) => (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note, user: me() });
  // Kargoya verilmesi geciken sipariş: ayardaki saat (varsayılan 48) aşıldıysa
  const late = (o) => ['yeni', 'hazirlaniyor'].includes(o.status) && (Date.now() - new Date(o.at)) / 3600e3 > (Number(S().shipHours) || 48);
  // Kalem başına kupon sonrası tutar: iade ve kâr hesabı bunu kullanır (invLines ile aynı dağıtım)
  const lineNet = (o) => { const g = o.items.map((i) => r2(i.price * i.qty)); const tot = sum(g, (x) => x); let left = r2(Number(o.discount) || 0); return g.map((v, k) => { const d = k === g.length - 1 ? left : r2(tot ? (o.discount || 0) * v / tot : 0); left = r2(left - d); return r2(v - d); }); };
  const sale = (o) => !['iptal', 'iade'].includes(o.status) && !o.payTest; // TEST ödemeli sipariş ciroya girmez
  const netOf = (o) => (Number(o.total) || 0) - (Number(o.refunded) || 0);
  const lowLimit = () => { const v = S().lowStock; return v === '' || v === undefined || v === null ? 2 : Number(v) || 0; };
  const retQty = (o, vid) => sum((o.returned || []).filter((x) => x.vid === vid), (x) => x.qty);

  // ---------- Sipariş ----------
  function orderModal(app, o) {
    const idx = FLOW.indexOf(o.status);
    modal({
      title: `Sipariş ${o.no}`, size: 'wide',
      body: `${['iptal', 'iade'].includes(o.status) ? `<div class="mb">${badge(SH.ST[o.status][0], SH.ST[o.status][1])}</div>` : `<div class="steps-o mb">${FLOW.map((s, i) => `<div class="${i <= idx ? 'on' : ''}"><i></i>${SH.ST[s][0]}</div>`).join('')}</div>`}
        ${o.unmatched ? `<div class="card pad mb small" style="border-color:var(--err)">${icon('alert')} Bu siparişte stoğunuzla eşleşmeyen ürün var; stok düşülmedi. <a href="#/eslesmeyen">Eşleştir</a></div>` : ''}${o.items.some((i) => i.short) ? `<div class="card pad mb small" style="border-color:var(--err)">${icon('alert')} Pazaryeri siparişi stoktan fazla: ${o.items.filter((i) => i.short).map((i) => `${esc(i.name)} ${i.short} adet eksik`).join(', ')}. Tedarik edin ya da pazaryeri panelinden iptal edin.</div>` : ''}
        <div class="grid g2"><div>${o.items.map((i) => { const p = prod(i.pid); const rq = retQty(o, i.vid); return `<div class="list-item">${img(p)}<div class="grow"><b>${esc(i.name)}</b>${i.pid ? '' : ' ' + badge('Eşleşmedi', 'err')}<div class="small muted">${esc(i.variant)} · ${i.qty} adet${rq ? ` · <span style="color:var(--err)">${rq} iade</span>` : ''}</div><div class="small faint mono">${esc((p.variants.find((v) => v.id === i.vid) || {}).sku || '')}</div></div><b>${money(i.price * i.qty)}</b></div>`; }).join('')}
          <div class="row between mt small"><span>Ara toplam</span><span>${money(o.subtotal)}</span></div>${o.discount ? `<div class="row between small" style="color:var(--ok)"><span>İndirim ${esc(o.coupon || '')}</span><span>-${money(o.discount)}</span></div>` : ''}<div class="row between small"><span>Kargo</span><span>${o.shipping ? money(o.shipping) : 'Ücretsiz'}</span></div>${o.cod ? `<div class="row between small"><span>Kapıda ödeme bedeli</span><span>${money(o.cod)}</span></div>` : ''}<div class="row between"><b>Toplam</b><b style="font-size:20px">${money(o.total)}</b></div></div>
        <div class="col"><div class="card pad"><b>${esc(o.ship.name)}</b><div class="small">${esc(o.ship.phone)}</div><div class="small muted">${esc(o.ship.address)}, ${esc(o.ship.city)}</div></div>
          <div class="list-item small"><span class="grow muted">Ödeme</span>${PAY[o.pay]} ${payB(o)}</div>${o.invoice && o.invoice.taxNo ? `<div class="list-item small"><span class="grow muted">Fatura</span>${esc(o.invoice.title || '')} · VKN ${esc(o.invoice.taxNo)}</div>` : ''}${o.ebelge ? `<div class="list-item small"><span class="grow muted">e-Belge</span>${esc(o.ebelge.type)} ${esc(o.ebelge.no)} ${o.ebelge.test ? badge('TEST — gönderilmedi', 'warn') : ''}</div>` : ''}<div class="list-item small"><span class="grow muted">Kanal</span>${MP.CH[o.channel] ? `${chTag(o)} <span class="small mono">${esc(o.channelNo || '')}</span>` : `Kendi mağaza${o.channel ? ' · ' + esc(o.channel) : ''}`}</div><div class="list-item small"><span class="grow muted">Tarih</span>${NS.dt(o.at)}</div>
          ${o.tracking ? `<div class="list-item small"><span class="grow muted">Kargo</span><b>${esc(o.carrier)}</b> <span class="mono">${esc(o.tracking)}</span></div>` : ''}${o.note ? `<div class="card pad small" style="background:var(--warn-soft);border:0">${icon('message')} ${esc(o.note)}</div>` : ''}${o.memo || (o.tags || []).length ? `<div class="card pad small"><b>İç not</b> ${(o.tags || []).map((t) => badge(t, 'acc')).join(' ')}<div>${esc(o.memo || '')}</div></div>` : ''}${o.packCheck ? `<div class="list-item small"><span class="grow muted">Paket doğrulama</span>${badge(o.packCheck.manual ? 'Elle onaylandı' : 'Barkodla doğrulandı', o.packCheck.manual ? 'warn' : 'ok')}</div>` : ''}${(o.history || []).length ? `<details class="small mt"><summary>İşlem geçmişi (${o.history.length})</summary>${o.history.map((h) => `<div class="list-item small"><span class="grow">${esc(h.note)}</span><span class="faint">${esc(h.user || '')} · ${NS.dt(h.at)}</span></div>`).join('')}</details>` : ''}</div></div>`,
      actions: [
        ...(!['iptal', 'iade', 'teslim', 'kargoda'].includes(o.status) && isAdm() ? [{ label: 'İptal et', cls: 'danger', onClick: async (c) => { c(); if (await confirm(`Sipariş iptal edilsin mi? Stoklar geri eklenir.${o.payStatus === 'alindi' && !o.channelNo ? ' Alınan ödemeyi müşteriye ayrıca iade edin.' : ''}`)) { cancelOrder(o); db.log('Sipariş iptal', o.no); db.save(); if (o.channelNo && MP.CH[o.channel]) toast(`${MP.CH[o.channel].name} siparişini pazaryeri panelinden de iptal edin (tedarik edilemedi bildirimi)`, 'warn'); app.refresh(); } } }] : []),
        { label: 'Paket fişi', icon: 'print', onClick: () => printSlip(o) },
        { label: 'Not / etiket', icon: 'edit', onClick: async (c) => { const v = await formModal({ title: `İç not — ${o.no}`, fields: [{ name: 'memo', label: 'İç not (müşteri görmez)', type: 'textarea', full: true }, { name: 'tagsStr', label: 'Etiketler (virgülle)', hint: 'Acil, Hediye, Sorunlu' }], values: { memo: o.memo || '', tagsStr: (o.tags || []).join(', ') } }); if (!v) return; o.memo = v.memo; o.tags = v.tagsStr.split(',').map((t) => t.trim()).filter(Boolean); hist(o, 'İç not güncellendi'); db.save(); c(); app.refresh(); } },
        ...(o.status === 'hazirlaniyor' ? [{ label: 'Paketi doğrula', icon: 'barcode', onClick: (c) => { c(); packCheck(app, o); } }] : []),
        ...(o.tracking && NS.integ && NS.integ.trackOf(o.carrier) ? [{ label: 'Takip et', icon: 'truck', onClick: () => NS.integ.trackShipment(o.carrier, o.tracking) }] : []),
        ...(o.payStatus === 'bekliyor' && !o.payTest && !['iptal', 'iade'].includes(o.status) && isAdm() ? [{ label: 'Ödeme alındı', icon: 'check', onClick: async (c) => { if (!(await confirm(`${money(o.total)} ödemenin hesabınıza geçtiğini kontrol ettiniz mi?`))) return; o.payStatus = 'alindi'; (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note: 'Ödeme alındı', user: me() }); db.log('Ödeme alındı', o.no); db.save(); c(); app.refresh(); } }] : []),
        ...(o.status === 'yeni' ? [{ label: 'Hazırlanıyor', cls: 'primary', onClick: async (c) => { if (o.unmatched) return toast('Önce eşleşmeyen ürünü eşleştirin', 'err'); if (unpaid(o) && !(await confirm('Bu siparişin ödemesi alınmadı. Yine de hazırlansın mı?'))) return; setSt(o, 'hazirlaniyor'); db.save(); c(); app.refresh(); } }] : []),
        ...(o.status === 'hazirlaniyor' ? [{ label: 'Kargoya ver', cls: 'primary', icon: 'truck', onClick: (c) => { c(); ship(app, o); } }] : []),
        ...(o.status === 'kargoda' ? [{ label: 'Teslim edildi', cls: 'ok', onClick: (c) => { markDelivered(o); db.save(); c(); app.refresh(); } }] : []),
        ...(['kargoda', 'teslim'].includes(o.status) && (!o.ebelge || o.ebelge.test) && isAdm() ? [{ label: o.ebelge ? 'Faturayı yeniden kes' : 'Fatura kes', icon: 'file', onClick: async (c) => { const r = await invoice(o); c(); if (r && r.ok && !r.simulated) toast('Fatura kesildi', 'ok'); app.refresh(); } }] : []),
      ],
    });
  }
  // Stoğa yalnızca düşülmüş adet döner (pazaryeri siparişinde stok yetmemiş olabilir)
  function restock(o) { o.items.forEach((i) => { const v = prod(i.pid).variants.find((x) => x.id === i.vid); if (v) v.stock += i.taken ?? i.qty; }); MP.stockChanged(o.items.filter((i) => i.vid)); }
  // İptal: stok ve kupon kullanım hakkı geri döner
  function cancelOrder(o, note) { restock(o); if (o.coupon) { const k = db.find('coupons', (x) => x.code === o.coupon); if (k && k.uses) k.uses -= 1; } setSt(o, 'iptal', note); }
  const markDelivered = (o) => { setSt(o, 'teslim'); o.deliveredAt = new Date().toISOString(); if (o.payStatus === 'kapida') o.payStatus = 'alindi'; };
  async function ship(app, o) {
    if (S().requirePack && !o.packCheck) { toast('Önce paketi doğrulayın (ayarlarda zorunlu)', 'err'); return packCheck(app, o); }
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
    if (r && r.ok) { o.ebelge = { type: r.type, no: r.no, id: r.id, date: today(), test: !!r.simulated }; hist(o, `Fatura ${r.no}${r.simulated ? ' (TEST — gönderilmedi)' : ''}`); db.save(); }
    return r;
  }
  // Belgeler NS.docs üzerinden: işletmenin seçtiği şablon ve kâğıt
  const skuOf = (i) => { const v = prod(i.pid).variants.find((x) => x.id === i.vid) || {}; return v.sku || i.code || ''; };
  const slipDoc = (o) => ({ title: 'Paket fişi', no: o.no, date: o.at, party: { title: 'Alıcı', name: o.ship.name, lines: [o.ship.phone, `${o.ship.address}, ${o.ship.city}`] }, info: [['Ödeme', PAY[o.pay] || ''], ['Kargo', o.carrier || '']], lines: o.items.map((i) => ({ name: i.name, note: [i.variant, skuOf(i)].filter(Boolean).join(' · '), qty: i.qty, price: i.price, total: i.price * i.qty })), totals: [...(o.discount ? [['İndirim', -o.discount]] : []), ...(o.shipping ? [['Kargo', o.shipping]] : []), ...(o.cod ? [['Kapıda ödeme bedeli', o.cod]] : []), ['Toplam', o.total, true]], note: o.pay === 'kapida' ? `Kapıda tahsil edilecek: ${money(o.total)}` : '' });
  const printSlip = (o) => NS.docs.print('paket', slipDoc(o));
  const pickDoc = (list) => { const m = {}; list.forEach((o) => o.items.forEach((i) => { const k = i.vid || i.code || i.name; const x = (m[k] = m[k] || { name: i.name, variant: i.variant, sku: skuOf(i), qty: 0, n: 0 }); x.qty += i.qty; x.n++; })); return { title: 'Toplama listesi', no: `${list.length} sipariş`, lines: Object.values(m).sort((a, b) => a.sku.localeCompare(b.sku, 'tr')).map((x) => ({ name: x.name, note: [x.variant, x.sku, `${x.n} sipariş`].filter(Boolean).join(' · '), qty: x.qty, price: 0, total: 0 })), totals: [['Toplam adet', String(sum(Object.values(m), (x) => x.qty))]], note: `Siparişler: ${list.map((o) => o.no).join(', ')}` }; };
  if (NS.docs) { NS.docs.define('eticaret', 'paket', { label: 'Paket fişi', sample: () => { const o = db.all('orders')[0]; return o ? slipDoc(o) : {}; } }); NS.docs.define('eticaret', 'toplama', { label: 'Toplama listesi', sample: () => pickDoc(db.all('orders').slice(0, 3)) }); }
  const labelHtml = (o) => `<div style="border:2px solid #000;padding:12px;width:360px;font-family:Arial;page-break-after:always"><div style="display:flex;justify-content:space-between"><b>${esc(o.carrier)}</b><b>${esc(o.no)}</b></div><hr><div style="font-size:11px">GÖNDERİCİ: ${esc(S().bizName)} · ${esc(S().bizPhone)}</div><div style="font-size:16px;margin-top:8px"><b>ALICI: ${esc(o.ship.name)}</b></div><div>${esc(o.ship.address)}</div><div><b>${esc(o.ship.city)}</b> · ${esc(o.ship.phone)}</div>${o.pay === 'kapida' ? `<div style="background:#000;color:#fff;padding:4px;margin-top:6px;text-align:center"><b>KAPIDA ÖDEME ${money(o.total)}</b></div>` : ''}<div style="margin-top:8px">${NS.barcodeSvg(o.tracking, { height: 50 })}</div></div>`;
  function printLabel(o) { if (!o.tracking) return toast('Takip numarası olmadan etiket basılmaz', 'err'); NS.printHtml(labelHtml(o), { title: 'Kargo etiketi' }); }

  function ordersPage(el, p, app) {
    let q = '', f = p || 'aktif'; const sel = new Set();
    const lateN = db.all('orders', late).length;
    el.innerHTML = pageHead('Siparişler', 'Mağaza ve pazaryeri siparişleri', `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><button class="btn" id="mp">${icon('download')} Pazaryeri siparişlerini çek</button><button class="btn" id="ex" title="Listeyi indir" aria-label="Listeyi indir">${icon('download')}</button><button class="btn primary" id="newo">${icon('plus')} Elle sipariş</button>`) + `<div class="card"><div class="card-h" style="flex-wrap:wrap;gap:8px">${NS.searchBox('q', 'Sipariş no, müşteri, takip no, etiket...')}<div class="seg">${[['aktif', 'Aktif'], ['yeni', 'Yeni'], ['hazirlaniyor', 'Hazırlanan'], ['gec', 'Geciken'], ['kargoda', 'Kargoda'], ['teslim', 'Teslim'], ['iptal', 'İptal/İade'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}${v === 'yeni' ? ` (${db.all('orders', (o) => o.status === 'yeni').length})` : v === 'gec' && lateN ? ` (${lateN})` : ''}</button>`).join('')}</div><label class="check small"><input type="checkbox" id="sa"> Tümünü seç</label></div>
      <div class="card-h hide" id="bulk" style="background:var(--app-accent-soft);flex-wrap:wrap;gap:6px"><b id="bn"></b><span class="grow"></span><button class="btn sm" data-b="prep">Hazırlanıyor</button><button class="btn sm" data-b="pick">${icon('list')} Toplama listesi</button><button class="btn sm" data-b="slip">${icon('print')} Paket fişi</button><button class="btn sm" data-b="label">${icon('print')} Etiket</button><button class="btn sm" data-b="xl">${icon('download')} Kargo listesi</button>${isAdm() ? `<button class="btn sm" data-b="inv">${icon('file')} Fatura kes</button>` : ''}</div><div id="t"></div></div>`;
    const rows = () => db.all('orders', (o) => (f === 'all' || (f === 'gec' ? late(o) : f === 'aktif' ? ['yeni', 'hazirlaniyor', 'kargoda'].includes(o.status) : f === 'iptal' ? ['iptal', 'iade'].includes(o.status) : o.status === f)) && NS.match(q, o.no, o.ship.name, o.ship.phone, o.tracking, o.memo, ...(o.tags || []))).sort((a, b) => b.at.localeCompare(a.at));
    const bar = () => { $('#bulk', el).classList.toggle('hide', !sel.size); $('#bn', el).textContent = `${sel.size} sipariş seçildi`; };
    const box = (o) => `<input type="checkbox" data-sel="${o.id}" ${sel.has(o.id) ? 'checked' : ''} aria-label="Seç">`;
    // Telefonda tablo yerine kart listesi: tutar ve durum kaydırmadan görünür
    const narrow = () => window.matchMedia('(max-width: 700px)').matches;
    const stB = (o) => badge(SH.ST[o.status][0], SH.ST[o.status][1]) + ((o.returned || []).length && o.status !== 'iade' ? ' ' + badge('Kısmi iade', 'warn') : '') + (late(o) ? ' ' + badge('Gecikiyor', 'err') : '') + shortB(o) + (o.tags || []).map((t) => ' ' + badge(t, 'acc')).join('');
    const draw = () => {
      const r = rows(); const foot = `${r.length} sipariş · ${money(sum(r, (o) => o.total))}${r.length > 300 ? ' · ilk 300 gösteriliyor, aramayı daraltın' : ''}`;
      bar();
      if (narrow()) { $('#t', el).innerHTML = r.length ? `<div class="card-b">${r.slice(0, 300).map((o) => `<div class="list-item" style="align-items:flex-start">${box(o)}<div class="grow" data-act="v" data-id="${o.id}" style="cursor:pointer"><b>${esc(o.no)}</b> ${chTag(o)}${unmatchedB(o)}<div class="small">${esc(o.ship.name)} · ${esc(o.ship.city)}</div><div class="small faint">${NS.dt(o.at)}</div><div class="mt">${stB(o)} ${unpaid(o) ? payB(o) : ''}</div></div><b>${money(o.total)}</b></div>`).join('')}</div><div class="card-b small faint">${foot}</div>` : `<div class="empty">${icon('bag')}<div>Sipariş yok</div></div>`; return; }
      $('#t', el).innerHTML = table({ rows: r.slice(0, 300), emptyIcon: 'bag', columns: [{ label: '', render: box }, { label: 'Sipariş', render: (o) => `<b>${esc(o.no)}</b> ${chTag(o)}${unmatchedB(o)}<div class="small faint">${NS.dt(o.at)}</div>` }, { label: 'Müşteri', render: (o) => `${esc(o.ship.name)}<div class="small faint">${esc(o.ship.city)}</div>` }, { label: 'Ürün', render: (o) => `<span class="small">${esc(o.items.map((i) => i.name).join(', ')).slice(0, 60)}</span>` }, { label: 'Ödeme', render: (o) => `${badge(PAY[o.pay], o.pay === 'kapida' ? 'warn' : 'info')}${unpaid(o) ? '<div class="mt">' + payB(o) + '</div>' : ''}` }, { label: 'Durum', render: stB }, { label: 'Tutar', cls: 'right', render: (o) => `<b>${money(o.total)}</b>` }], actions: [{ icon: 'eye', act: 'v' }], foot });
    };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; sel.clear(); $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=v]', (e, b) => orderModal(app, db.get('orders', b.dataset.id)));
    on(el, 'change', '[data-sel]', (e, b) => { b.checked ? sel.add(b.dataset.sel) : sel.delete(b.dataset.sel); bar(); });
    on(el, 'change', '#sa', (e, b) => { rows().slice(0, 300).forEach((o) => (b.checked ? sel.add(o.id) : sel.delete(o.id))); draw(); });
    $('#newo', el).onclick = () => manualOrder(app);
    on(el, 'click', '[data-b]', (e, b) => bulk(app, b.dataset.b, [...sel].map((id) => db.get('orders', id)).filter(Boolean), () => { sel.clear(); draw(); }));
    // Trendyol / Hepsiburada / n11... siparişleri mağaza siparişi gibi düşer, stok varyanttan düşülür
    $('#mp', el).onclick = async () => {
      // Canlı kanal varsa doğrudan pazaryeri API'sinden çekilir; ardından müşteri iptali ve teslim durumu güncellenir
      if (Object.keys(MP.CH).some((k) => MP.isLive(k))) { const n = await MP.pullOrders(); const st = await MP.pullStatus((o) => cancelOrder(o, 'Pazaryerinde iptal edildi'), markDelivered); const err = n.err || st.err; toast(err || [`${n.count} pazaryeri siparişi alındı`, st.cancelled ? `${st.cancelled} iptal` : '', st.delivered ? `${st.delivered} teslim` : ''].filter(Boolean).join(' · '), err ? 'err' : n.count ? 'ok' : ''); return app.refresh(); }
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
  // Yerel kayıt tarayıcı deposuna sığmazsa core yalnızca konsola yazar: kaydın gerçekten yazıldığı burada doğrulanır
  const stored = () => { if (db.cloud || db.pub) return true; try { return localStorage.getItem(db.key) === JSON.stringify(db.data); } catch (e) { return false; } };
  function photoBox(b, p) {
    const draw = () => { const L = p.photos || []; $('#ph', b).innerHTML = L.length ? `<div class="row" style="gap:8px;flex-wrap:wrap">${L.map((u, i) => `<div style="width:104px"><img src="${esc(u)}" alt="Fotoğraf ${i + 1}" style="width:100%;height:132px;object-fit:cover;border-radius:8px"><div class="row nw" style="gap:4px">${i === 0 ? '<span class="small muted grow">Kapak</span>' : `<button type="button" class="btn sm grow" data-cv="${i}">Kapak yap</button>`}<button type="button" class="btn sm ghost icon" data-prm="${i}" title="Fotoğrafı sil" aria-label="Fotoğrafı sil">${icon('x')}</button></div></div>`).join('')}</div>` : '<div class="faint small">Fotoğraf yok. Mağazada ürün rengiyle yer tutucu görünür.</div>'; };
    on(b, 'click', '[data-prm]', (e, x) => { p.photos.splice(Number(x.dataset.prm), 1); draw(); });
    on(b, 'click', '[data-cv]', (e, x) => { const [u] = p.photos.splice(Number(x.dataset.cv), 1); p.photos.unshift(u); draw(); });
    $('#fl', b).onchange = async (e) => {
      await NS.dosya.toplu(e.target, [...e.target.files], async (f) => { const h = await NS.dosya.hazirla(db, f, { sinir: SH.PHOTO.perPhoto }); const msg = SH.photoCheck(db.all('products'), p, h.boyut, { docChars: JSON.stringify(db.data).length, local: !db.cloud, sunucu: db.cloud }); if (msg) { toast(msg, 'err'); return false; } p.photos = [...(p.photos || []), await h.yukle()]; draw(); });
    };
    draw();
  }
  async function productEditor(app, rec) {
    const p = rec ? JSON.parse(JSON.stringify(rec)) : { name: '', cat: (db.all('cats')[0] || {}).id || '', price: 0, sale: null, vat: '', desc: '', colors: ['Siyah'], variants: [], tags: [], active: true };
    const sizesOf = (cat) => (cat === 'ayakkabi' ? ['36', '37', '38', '39', '40'] : cat === 'aksesuar' ? ['Standart'] : ['XS', 'S', 'M', 'L', 'XL']);
    modal({
      title: rec ? p.name : 'Yeni ürün', size: 'xl',
      body: `<div class="grid g2"><div id="pf">${NS.fieldsHtml([{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'cat', label: 'Kategori', type: 'select', options: db.all('cats').map((c) => ({ value: c.id, label: c.name })) }, { name: 'price', label: 'Fiyat (₺)', type: 'number', required: true }, { name: 'sale', label: 'İndirimli fiyat (₺)', type: 'number' }, ...(isAdm() ? [{ name: 'cost', label: 'Birim maliyet (₺, KDV hariç)', type: 'number', step: '0.01', hint: 'Kâr raporu için; mağazada görünmez' }] : []), { name: 'vat', label: 'KDV oranı', type: 'select', options: [{ value: '', label: `Mağaza varsayılanı (%${Number(S().vat ?? 20)})` }, { value: '0', label: '%0' }, { value: '1', label: '%1' }, { value: '10', label: '%10' }, { value: '20', label: '%20' }], hint: 'Faturada ve pazaryerinde kullanılır; oranı mali müşavirinize danışın' }, { name: 'tagsStr', label: 'Etiketler (virgülle)', hint: 'Yeni, Çok satan, Son ürünler' }, { name: 'desc', label: 'Açıklama', type: 'textarea', full: true }, { name: 'active', label: 'Mağazada yayında', type: 'checkbox' }], { ...p, tagsStr: (p.tags || []).join(', ') })}</div>
        <div><h3 class="mb">Renkler</h3><div class="row mb">${Object.keys(SH.COLORS).map((c) => `<label class="check small"><input type="checkbox" data-col="${c}" ${p.colors.includes(c) ? 'checked' : ''}><span class="sw" style="background:${SH.COLORS[c]}"></span>${c}</label>`).join('')}</div>
        <h3 class="mb">Varyant stokları</h3><div id="vg" style="overflow:auto"></div><h3 class="mb mt">Stok kodu ve barkod</h3><div class="small faint mb">Pazaryerleri varyantı barkodla tanır. Boş stok kodu kaydederken üretilir.</div><div id="vc" style="overflow:auto"></div>
        <h3 class="mb mt">Fotoğraflar</h3><div class="small faint mb">En fazla ${SH.PHOTO.perProduct} fotoğraf. İlk fotoğraf kapak olur. Yüklenirken küçültülür.</div><div id="ph"></div><input class="input mt" type="file" id="fl" accept="image/*" multiple aria-label="Ürün fotoğrafı seç"></div></div>`,
      onOpen: (b) => {
        photoBox(b, p);
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
        // Açık siparişi olan varyant kaldırılamaz: iptal/iadede stok geri dönecek yer kalmaz
        const gone = rec ? rec.variants.filter((x) => !(p.colors.includes(x.color) && sizes.includes(x.size))) : [];
        if (gone.length) { const busy = gone.find((x) => db.find('orders', (o) => ['yeni', 'hazirlaniyor', 'kargoda'].includes(o.status) && o.items.some((i) => i.vid === x.id))); if (busy) return toast(`${busy.color} / ${busy.size} varyantında açık sipariş var; kaldırılamaz`, 'err'); }
        p.variants = p.variants.filter((x) => p.colors.includes(x.color) && sizes.includes(x.size));
        p.colors.forEach((col) => sizes.forEach((s) => { if (!p.variants.find((x) => x.color === col && x.size === s)) p.variants.push({ id: NS.uid(), color: col, size: s, stock: 0 }); }));
        // Stok kodu ve barkod tüm ürünlerde benzersiz olmalı (pazaryeri yanlış varyanta stok yazmasın)
        const taken = new Map(); db.all('products', (x) => !rec || x.id !== rec.id).forEach((x) => x.variants.forEach((y) => [y.sku, y.barcode, ...(y.aliases || [])].filter(Boolean).forEach((k) => taken.set(String(k).toUpperCase(), x.name))));
        const base = NS.slug(v.name).replace(/-/g, '').toUpperCase().slice(0, 6) || 'URUN';
        p.variants.forEach((x) => { if (!x.sku) { let k = `${base}-${x.color.slice(0, 3).toLocaleUpperCase('tr')}-${x.size}`, n = 1; while (taken.has(k.toUpperCase()) || p.variants.some((y) => y !== x && y.sku === k)) k = `${base}${++n}-${x.color.slice(0, 3).toLocaleUpperCase('tr')}-${x.size}`; x.sku = k; } });
        const seen = new Set(); for (const x of p.variants) for (const k of [x.sku, x.barcode].filter(Boolean)) { const K = String(k).toUpperCase(); if (taken.has(K)) return toast(`${k} kodu "${taken.get(K)}" ürününde kullanılıyor`, 'err'); if (seen.has(K)) return toast(`${k} kodu bu üründe iki varyantta var`, 'err'); seen.add(K); }
        if (p.variants.some((x) => x.barcode && !/^[0-9A-Za-z.\-_]{4,40}$/.test(x.barcode))) return toast('Barkod yalnızca harf, rakam ve . - _ içerebilir', 'err');
        Object.assign(p, { name: v.name, cat: v.cat, price: Number(v.price) || 0, sale: Number(v.sale) || null, vat: v.vat === '' ? '' : Number(v.vat), ...(isAdm() ? { cost: Number(v.cost) || 0 } : {}), desc: v.desc, active: v.active, tags: v.tagsStr.split(',').map((t) => t.trim()).filter(Boolean), slug: NS.slug(v.name) });
        delete p.tagsStr;
        const oldPh = rec ? rec.photos : []; const oncekiPh = [...(oldPh || [])]; const saved = rec ? db.update('products', rec.id, p) : db.insert('products', { ...p, views: 0 });
        // Tarayıcı deposu doluysa fotoğraflar geri alınır: kaydedildi denip yenilemede kaybolmasın
        if (!stored()) { const x = db.get('products', rec ? rec.id : saved.id); x.photos = oldPh || []; db.save(); if (!stored()) return toast('Tarayıcı deposu dolu, ürün kaydedilemedi. Depolamayı boşaltın veya bulut hesabı kullanın.', 'err'); toast('Tarayıcı deposu dolu: fotoğraflar kaydedilemedi, ürünün diğer bilgileri kaydedildi.', 'err'); c(); app.refresh(); return; }
        MP.stockChanged(p.variants.map((x) => ({ vid: x.id }))); NS.dosya.birak(db, oncekiPh, p.photos);
        c(); toast('Ürün kaydedildi', 'ok'); app.refresh();
      } }],
    });
  }
  function productsPage(el, p, app) {
    let q = '', c = '', low = p === 'kritik';
    el.innerHTML = pageHead('Ürünler', 'Varyant (renk/beden) bazlı stok', `<button class="btn" id="ex" title="Listeyi indir" aria-label="Listeyi indir">${icon('download')}</button>${isAdm() ? `<button class="btn" id="imp">${icon('upload')} Excel'den al</button><button class="btn" id="mps">${icon('store')} Pazaryerine gönder</button>` : ''}<button class="btn primary" id="np">${icon('plus')} Yeni ürün</button>`) + `<div class="card"><div class="card-h" style="flex-wrap:wrap">${NS.searchBox('q', 'Ürün adı, SKU, barkod...')}<select class="input" id="c" style="max-width:190px"><option value="">Tüm kategoriler</option>${db.all('cats').map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select><label class="check small"><input type="checkbox" id="low" ${low ? 'checked' : ''}> Kritik stok (varyant ≤ ${lowLimit()})</label></div><div id="t"></div></div>`;
    // 45 günlük satış bir kez hesaplanır (her satırda tüm siparişleri taramaz)
    const since45 = addDays(new Date(), -45).toISOString(); const sold = {};
    db.all('orders', (o) => o.at >= since45 && !['iptal', 'iade'].includes(o.status)).forEach((o) => o.items.forEach((i) => { sold[i.pid] = (sold[i.pid] || 0) + i.qty - retQty(o, i.vid); }));
    // Kaç günde biter: son 45 günün günlük satış hızı ile mevcut stok
    const daysLeft = (x) => { const r = (sold[x.id] || 0) / 45; return r > 0 ? Math.round(SH.stock(x) / r) : null; };
    const draw = () => { const lim = lowLimit(); const rows = db.all('products', (x) => (!c || x.cat === c) && (!low || x.variants.some((v) => v.stock <= lim)) && NS.match(q, x.name, ...x.variants.map((v) => v.sku), ...x.variants.map((v) => v.barcode))); $('#t', el).innerHTML = table({ rows: rows.slice(0, 300), columns: [{ label: 'Ürün', render: (x) => `<div class="row nw">${img(x)}<div><b>${esc(x.name)}</b> ${x.tags.map((t) => badge(t, 'acc')).join(' ')}${x.active ? '' : ' ' + badge('Yayında değil', 'err')}<div class="small faint">${esc(catName(x.cat))} · ${x.colors.map((col) => `<span class="sw" style="background:${SH.COLORS[col]}" title="${col}"></span>`).join(' ')}</div></div></div>` }, { label: 'Fiyat', cls: 'right', render: (x) => (x.sale ? `<s class="faint">${money(x.price)}</s><br><b style="color:var(--err)">${money(x.sale)}</b>` : `<b>${money(x.price)}</b>`) }, { label: 'Stok', cls: 'right', render: (x) => { const s = SH.stock(x); const z = x.variants.filter((v) => v.stock === 0).length; return `${s}${z ? `<div>${badge(z + ' varyant tükendi', 'warn')}</div>` : ''}`; } }, { label: 'Satış (45 gün)', cls: 'right', render: (x) => sold[x.id] || 0 }, { label: 'Kaç günde biter', cls: 'right', render: (x) => { const d = daysLeft(x); return d === null ? '<span class="faint">-</span>' : d <= 14 ? badge(`${d} gün`, d <= 7 ? 'err' : 'warn') : `${d} gün`; } }, { label: 'Görüntülenme', cls: 'right', render: (x) => num(x.views) }], actions: [{ icon: 'eye', act: 'view', title: 'Mağazada gör' }, { icon: 'edit', act: 'ed' }, ...(isAdm() ? [{ icon: 'trash', act: 'del' }] : [])], foot: `${rows.length} ürün · ${num(sum(rows, SH.stock))} adet stok${rows.length > 300 ? ' · ilk 300 gösteriliyor, aramayı daraltın' : ''}` }); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#c', el).onchange = (e) => { c = e.target.value; draw(); };
    $('#low', el).onchange = (e) => { low = e.target.checked; draw(); };
    if ($('#mps', el)) { $('#mps', el).onclick = () => { location.hash = '#/listeleme'; }; $('#imp', el).onclick = () => importProducts(app); }
    $('#np', el).onclick = () => productEditor(app);
    on(el, 'click', '[data-act]', async (e, b) => { const x = db.get('products', b.dataset.id); if (b.dataset.act === 'ed') productEditor(app, x); else if (b.dataset.act === 'view') window.open(`magaza.html#/urun/${x.slug}`, '_blank'); else if (b.dataset.act === 'del') { if (db.find('orders', (o) => o.items.some((i) => i.pid === x.id))) return toast('Bu ürünün siparişi var, silinemez. Yayından kaldırın.', 'err'); if (await confirm(`${x.name} silinsin mi?`)) { db.remove('products', x.id); (db.data.listings || []).filter((l) => l.pid === x.id).forEach((l) => db.remove('listings', l.id)); draw(); } } });
    $('#ex', el).onclick = () => NS.csv('urunler', db.all('products').flatMap((x) => x.variants.map((v) => ({ x, v }))), [{ label: 'Ürün', value: (r) => r.x.name }, { label: 'SKU', value: (r) => r.v.sku }, { label: 'Renk', value: (r) => r.v.color }, { label: 'Beden', value: (r) => r.v.size }, { label: 'Stok', value: (r) => r.v.stock }, { label: 'Fiyat', value: (r) => SH.price(r.x) }]);
    draw();
  }

  // ---------- Özet ----------
  function dashboard(el, p, app) {
    const ok = db.all('orders', sale);
    const t = today(); const d30 = addDays(new Date(), -30).toISOString();
    const todayO = ok.filter((o) => iso(o.at) === t), m30 = ok.filter((o) => o.at > d30);
    const ser = NS.dailySeries(ok, 30, 'at', netOf);
    const topMap = {}; m30.forEach((o) => o.items.forEach((i) => { topMap[i.pid] = (topMap[i.pid] || 0) + i.qty; }));
    const top = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const zeroV = db.all('products').flatMap((x) => x.variants.filter((v) => v.stock === 0).map((v) => ({ x, v })));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="magaza.html" target="_blank">${icon('globe')} Mağazayı aç</a><a class="btn primary" href="#/siparisler/yeni">${icon('bag')} Yeni siparişler (${db.all('orders', (o) => o.status === 'yeni').length})</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün sipariş', todayO.length, 'bag', '', `<div class="small faint">${money(sum(todayO, (o) => o.total))}</div>`)}${kpi('30 gün net ciro', money(sum(m30, netOf)), 'trend', 'ok', '<div class="small faint">İadeler düşüldü · TEST ödeme hariç</div>')}${kpi('Ortalama sepet', money(m30.length ? sum(m30, (o) => o.total) / m30.length : 0), 'cart', 'info')}${kpi('Kargolanacak', db.all('orders', (o) => ['yeni', 'hazirlaniyor'].includes(o.status)).length, 'truck', 'warn', db.all('orders', late).length ? `<div class="small"><a href="#/siparisler/gec" style="color:var(--err)">${db.all('orders', late).length} sipariş gecikiyor</a></div>` : '')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Günlük ciro (30 gün)</h3></div><div class="card-b">${chart.line([{ name: 'Ciro', values: ser.values }], ser.labels, { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Trafik kaynakları</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30, (o) => (o.channel ? (MP.CH[o.channel] || {}).name || o.channel : 'Kendi mağaza'))).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Çok satanlar</h3></div><div class="card-b">${top.map(([id, n]) => `<div class="list-item">${img(prod(id))}<span class="grow"><b>${esc(prod(id).name)}</b></span><b>${n} adet</b></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('cart')} Terk edilen sepetler</h3><a class="btn sm" href="#/sepetler">Tümü</a></div><div class="card-b">${db.all('carts', (c) => !c.reminded).slice(0, 5).map((c) => `<div class="list-item small"><span class="grow"><b>${esc(c.name)}</b><div class="faint">${NS.ago(c.at)}</div></span><b>${money(c.total)}</b></div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('alert')} Tükenen varyantlar (${zeroV.length})</h3></div><div class="card-b" style="max-height:300px;overflow:auto">${zeroV.slice(0, 12).map((r) => `<div class="list-item small"><span class="grow">${esc(r.x.name)}</span>${badge(`${r.v.color} / ${r.v.size}`, 'err')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>`;
  }
  function cartsPage(el, p, app) {
    const rows = db.all('carts').sort((a, b) => b.at.localeCompare(a.at));
    const open = rows.filter((c) => !c.reminded);
    const code = () => { const k = db.find('coupons', (x) => x.active && x.type === 'pct' && !SH.couponCheck(x)); return k ? ` ${k.code} koduyla %${k.value} indirim.` : ''; };
    const msg = (c) => `Merhaba ${c.name}, sepetinizde ${c.items.map((i) => i.name).join(', ')} sizi bekliyor.${code()} ${shopUrl()}`;
    el.innerHTML = pageHead('Terk Edilen Sepetler', 'Ödeme adımına gelip tamamlamayan ziyaretçiler — hatırlatma ile geri kazanın', open.length ? `<button class="btn" id="smsall">${icon('send')} Bekleyenlere SMS (${open.length})</button>` : '') + `<div class="grid g3 mb">${kpi('Bekleyen sepet', open.length, 'cart', 'warn')}${kpi('Potansiyel ciro', money(sum(open, (c) => c.total)), 'wallet', 'info')}${kpi('Hatırlatılan', rows.filter((c) => c.reminded).length, 'send', 'ok')}</div>
      <div class="card">${table({ rows, empty: 'Terk edilen sepet yok', columns: [{ label: 'Ziyaretçi', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}</div>` }, { label: 'Ürünler', render: (c) => esc(c.items.map((i) => i.name).join(', ')) }, { label: 'Zaman', render: (c) => NS.ago(c.at) }, { label: 'Tutar', cls: 'right', render: (c) => `<b>${money(c.total)}</b>` }, { label: 'Durum', render: (c) => (c.reminded === 'sms' ? badge('SMS gönderildi', 'ok') : c.reminded ? badge('WhatsApp açıldı', 'info') : badge('Bekliyor', 'warn')) }], actions: [{ icon: 'message', act: 'wa', title: 'WhatsApp ile hatırlat' }] })}</div>`;
    // WhatsApp yalnızca hazır mesajı açar; gönderilip gönderilmediği bilinmez, bu yüzden "açıldı" yazılır
    on(el, 'click', '[data-act=wa]', (e, b) => { const c = db.get('carts', b.dataset.id); c.reminded = c.reminded || 'wa'; db.save(); window.open(`https://wa.me/90${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(msg(c))}`, '_blank', 'noopener'); app.refresh(); });
    if ($('#smsall', el)) $('#smsall', el).onclick = async () => { const n = await NS.smsBatch(db, open.map((c) => ({ to: c.phone, name: c.name, text: msg(c) })), 'hatırlatma'); if (n.ok && !n.err && !n.test) open.forEach((c) => { c.reminded = 'sms'; }); db.save(); app.refresh(); };
  }
  function returnsPage(el, p, app) {
    const RS = { bekliyor: ['Onay bekliyor', 'warn'], onay: ['Onaylandı', 'ok'], red: ['Reddedildi', 'err'] };
    const adm = isAdm();
    el.innerHTML = pageHead('İade Talepleri', 'Mağaza ve pazaryeri iade talepleri', adm ? `${MP.isLive('trendyol') ? `<button class="btn" id="cl">${icon('download')} Trendyol iadelerini çek</button>` : ''}<button class="btn" id="nr">${icon('plus')} İade kaydı</button>` : '') + `<div class="card">${table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)), empty: 'İade talebi yok', columns: [{ label: 'Sipariş', render: (r) => `<b>${esc((db.get('orders', r.order) || {}).no || '-')}</b>${r.ext ? ' ' + MP.chBadge(r.ext) : ''}` }, { label: 'Müşteri', render: (r) => esc(((db.get('orders', r.order) || {}).ship || {}).name || '-') }, { label: 'Neden', key: 'reason' }, { label: 'Tarih', render: (r) => NS.ago(r.at) }, { label: 'Ürün', render: (r) => (r.items ? `<span class="small">${esc(r.items.map((i) => `${i.qty}× ${i.name}`).join(', '))}</span>` : '<span class="small faint">Tümü</span>') }, { label: 'İade tutarı', cls: 'right', render: (r) => (r.refund != null ? `<b>${money(r.refund)}</b>` : `<span class="faint">${money((db.get('orders', r.order) || {}).total || 0)}</span>`) }, { label: 'Durum', render: (r) => badge(RS[r.status][0], RS[r.status][1]) + (r.ebelge ? `<div class="small mt">${esc(r.ebelge.no)}${r.ebelge.test ? ' · TEST' : ''}</div>` : '') }], actions: [{ label: 'Onayla', act: 'ok', show: (r) => adm && r.status === 'bekliyor' }, { label: 'Reddet', act: 'no', show: (r) => adm && r.status === 'bekliyor' }, { label: 'İade faturası', act: 'rinv', show: (r) => { const o = adm && r.status === 'onay' && (r.lines || []).length && db.get('orders', r.order); return !!(o && o.ebelge && !o.ebelge.test && (!r.ebelge || r.ebelge.test)); } }] })}</div>`;
    on(el, 'click', '[data-act=rinv]', async (e, b) => { const r = db.get('returns', b.dataset.id); const o = db.get('orders', r.order); const x = await NS.ebelge.create({ docType: 'auto', refund: true, refundOf: o.ebelge.no, refundDate: o.ebelge.date || iso(o.at), no: o.no, buyer: (o.invoice && o.invoice.title) || o.ship.name, buyerVkn: (o.invoice && o.invoice.taxNo) || '', buyerTaxOffice: (o.invoice && o.invoice.taxOffice) || '', address: o.ship.address, district: o.ship.district || '', city: o.ship.city, note: `İade ${o.no}`, lines: r.lines }); if (x && x.ok) { r.ebelge = { no: x.no, id: x.id, test: !!x.simulated }; db.save(); app.refresh(); } });
    if ($('#cl', el)) $('#cl', el).onclick = async () => { const n = await MP.pullClaims(); toast(n.err || `${n.count} yeni iade talebi${n.miss ? ` · ${n.miss} talebin siparişi burada yok` : ''}`, n.err ? 'err' : n.count ? 'ok' : ''); app.refresh(); };
    on(el, 'click', '[data-act=no]', async (e, b) => { const r = db.get('returns', b.dataset.id); if (!(await confirm('İade talebi reddedilsin mi?'))) return; r.status = 'red'; r.decidedAt = new Date().toISOString(); r.by = me(); db.log('İade reddedildi', (db.get('orders', r.order) || {}).no || ''); db.save(); toast('İade reddedildi', 'ok'); app.refresh(); });
    on(el, 'click', '[data-act=ok]', (e, b) => { const r = db.get('returns', b.dataset.id); const o = db.get('orders', r.order); if (!o) return toast('Sipariş bulunamadı', 'err'); if (o.status === 'iptal') return toast('Sipariş iptal edilmiş; iade onaylanamaz', 'err'); approve(o, r); });
    if ($('#nr', el)) $('#nr', el).onclick = async () => { const v = await formModal({ title: 'İade kaydı', fields: [{ name: 'no', label: 'Sipariş no', required: true }, { name: 'reason', label: 'Neden', type: 'select', options: ['Beden uymadı', 'Ürün beklentimi karşılamadı', 'Kusurlu / hasarlı', 'Yanlış ürün gönderildi', 'Diğer'] }] }); if (!v) return; const o = db.find('orders', (x) => x.no.toUpperCase() === v.no.trim().toUpperCase() || x.channelNo === v.no.trim()); if (!o) return toast('Sipariş bulunamadı', 'err'); if (!['kargoda', 'teslim'].includes(o.status)) return toast('Yalnızca kargodaki veya teslim edilmiş sipariş iade edilebilir; hazırlanan siparişi iptal edin', 'err'); approve(o, db.insert('returns', { order: o.id, reason: v.reason, at: new Date().toISOString(), status: 'bekliyor' }, true)); };
    // Kısmi iade: hangi üründen kaç adet döndüğü, stoğa eklenip eklenmeyeceği ve iade edilen tutar seçilir
    function approve(o, r) {
      // İade tutarı kupon sonrası birim fiyatla önerilir; toplam iade sipariş tutarını aşamaz
      const nets = lineNet(o); const unit = (x) => nets[x.k] / (x.i.qty || 1); const maxR = r2((o.total || 0) - (o.refunded || 0));
      const open = o.items.map((i, k) => ({ i, k, left: i.qty - retQty(o, i.vid) })).filter((x) => x.left > 0);
      if (!open.length) return toast('Bu siparişte iade edilecek ürün kalmadı', 'err');
      const want = (x) => { if (!r.want) return x.left; const w = r.want.find((y) => y.code && (y.code === x.i.code || y.code === skuOf(x.i))); return w ? Math.min(x.left, w.qty) : 0; };
      const calc = (b) => Math.min(maxR, r2(sum(open, (x) => (Number(($(`[data-rq="${x.k}"]`, b) || {}).value) || 0) * unit(x))));
      modal({ title: `İade onayı — ${o.no}`, body: `<p class="small muted">Neden: ${esc(r.reason || '-')}</p>${open.map((x) => `<div class="list-item">${img(prod(x.i.pid))}<div class="grow"><b>${esc(x.i.name)}</b><div class="small muted">${esc(x.i.variant)} · ${money(x.i.price)}</div></div><input class="input" type="number" min="0" max="${x.left}" value="${want(x)}" data-rq="${x.k}" style="width:70px"> <span class="small faint">/ ${x.left}</span></div>`).join('')}
        <div class="form-grid mt"><div class="field"><label>İade edilecek tutar (₺, en çok ${money(maxR)})</label><input class="input" type="number" step="0.01" min="0" id="rf"></div><div class="field"><label class="check"><input type="checkbox" id="rs" checked> Ürünler sağlam, stoğa ekle</label></div></div><p class="small faint">Tutar kupon indirimi düşülerek önerilir; kargo bedeli için elle artırılabilir. Para iadesini ödeme kanalınızdan yapın; burada yalnızca kaydı tutulur.</p>`,
        onOpen: (b) => { $('#rf', b).value = calc(b); on(b, 'input', '[data-rq]', () => { $('#rf', b).value = calc(b); }); },
        actions: [{ label: 'Vazgeç' }, { label: 'İadeyi onayla', cls: 'primary', onClick: (c, b) => {
          const its = open.map((x) => ({ x, qty: Math.min(x.left, Math.max(0, Math.floor(Number($(`[data-rq="${x.k}"]`, b).value) || 0))) })).filter((y) => y.qty > 0);
          if (!its.length) return toast('En az bir ürün seçin', 'err');
          const refund = r2(Number($('#rf', b).value) || 0); const rs = $('#rs', b).checked;
          if (refund < 0 || refund > maxR) return toast(`İade tutarı en çok ${money(maxR)} olabilir`, 'err');
          its.forEach(({ x, qty }) => { (o.returned = o.returned || []).push({ vid: x.i.vid, qty, at: new Date().toISOString() }); if (rs) { const v = prod(x.i.pid).variants.find((y) => y.id === x.i.vid); if (v) v.stock += qty; } });
          // İade faturası kalemleri: tutar kaleme oranla bölünür, kuruş farkı son kaleme yazılır
          const base = sum(its, ({ x, qty }) => qty * unit(x)) || 1; let rest = refund; const lines = its.map(({ x, qty }, n) => { const t = n === its.length - 1 ? r2(rest) : r2(refund * (qty * unit(x)) / base); rest = r2(rest - t); return { name: `${x.i.name} ${x.i.variant || ''}`.trim(), qty, vat: vatOf(prod(x.i.pid)), total: t }; }).filter((l) => l.total > 0);
          Object.assign(r, { status: 'onay', items: its.map(({ x, qty }) => ({ vid: x.i.vid, name: `${x.i.name} ${x.i.variant || ''}`.trim(), qty })), lines, refund, restocked: rs, decidedAt: new Date().toISOString(), by: me() });
          o.refunded = r2((o.refunded || 0) + refund);
          const all = o.items.every((i) => retQty(o, i.vid) >= i.qty);
          if (all) setSt(o, 'iade', `İade: ${money(refund)}`); else (o.history = o.history || []).push({ at: new Date().toISOString(), st: o.status, note: `Kısmi iade: ${its.map(({ x, qty }) => `${qty}× ${x.i.name}`).join(', ')} · ${money(refund)}`, user: me() });
          if (rs) MP.stockChanged(its.map(({ x }) => ({ vid: x.i.vid })));
          db.log('İade onaylandı', `${o.no} · ${money(refund)}`); db.save(); c(); toast(`İade kaydedildi${rs ? ', stok güncellendi' : ''}`, 'ok'); app.refresh();
        } }] });
    }
  }
  function customersPage(el, p, app) {
    // Tüm siparişler bir kez gruplanır: müşteri × sipariş taraması binlerce kayıtta donuyordu
    const st = {}; db.all('orders', (o) => o.status !== 'iptal').forEach((o) => { const x = (st[o.customer] = st[o.customer] || { n: 0, tot: 0, last: '' }); x.n++; x.tot += netOf(o); if (o.at > x.last) x.last = o.at; });
    const of = (c) => st[c.id] || { n: 0, tot: 0, last: '' };
    const days = (c) => (of(c).last ? (Date.now() - new Date(of(c).last)) / 864e5 : Infinity);
    // Segment: son sipariş tarihi ve sipariş sayısına göre (eşikler sabit, ayarlanamaz)
    const SEG = { sadik: ['Sadık', 'ok'], yeni: ['Yeni', 'info'], risk: ['Kaybedilmek üzere', 'warn'], kayip: ['Kayıp', 'err'], yok: ['Sipariş yok', ''] };
    const seg = (c) => { const n = of(c).n, d = days(c); if (!n) return 'yok'; if (d > 365) return 'kayip'; if (n >= 2 && d > 120) return 'risk'; if (n >= 3) return 'sadik'; return d <= 120 ? 'yeni' : 'risk'; };
    NS.crud(el, app, {
      col: 'customers', title: 'Müşteriler', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users', filters: [{ value: 'all', label: 'Tümü' }, ...['sadik', 'yeni', 'risk', 'kayip'].map((k) => ({ value: k, label: SEG[k][0], test: (c) => seg(c) === k }))], canDelete: (c) => (st[c.id] || db.find('orders', (o) => o.customer === c.id) ? 'Bu müşterinin siparişi var, silinemez' : true), fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'email', label: 'E-posta', type: 'email' }, { name: 'city', label: 'Şehir' }, { name: 'address', label: 'Adres', full: true }],
      sort: (a, b) => of(b).tot - of(a).tot, searchFields: (c) => [c.name, c.phone, c.email, c.city],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.email || '')}</div>` }, { key: 'city', label: 'Şehir' }, { label: 'Segment', render: (c) => badge(...SEG[seg(c)]) }, { label: 'Sipariş', cls: 'right', render: (c) => of(c).n }, { label: 'Toplam harcama', cls: 'right', render: (c) => `<b>${money(of(c).tot)}</b>` }, { label: 'Son sipariş', render: (c) => (of(c).last ? NS.ago(of(c).last) : '-') }],
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
    const ok = all.filter(sale);
    const net = netOf; const pf = profitRows(ok); const tl = (x) => `<b style="color:var(--${x >= 0 ? 'ok' : 'err'})">${money(x)}</b>`;
    const byCat = {}; ok.forEach((o) => o.items.forEach((i) => { const c = catName(prod(i.pid).cat); byCat[c] = (byCat[c] || 0) + i.price * (i.qty - retQty(o, i.vid)); }));
    const byCity = NS.groupBy(ok, (o) => o.ship.city);
    const retN = all.filter((o) => o.status === 'iade' || (o.returned || []).length).length; const retRate = all.length ? (retN / all.length) * 100 : 0;
    const views = sum(db.all('products'), (x) => x.views); const pct = (n) => '%' + n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    const P = [['bu-ay', 'Bu ay'], ['gecen-ay', 'Geçen ay'], ['30', 'Son 30 gün'], ['90', 'Son 90 gün'], ['bu-yil', 'Bu yıl'], ['tum', 'Tümü'], ['aralik', 'Aralık']];
    el.innerHTML = pageHead('Raporlar', 'Kategori, şehir, ödeme ve dönüşüm analizleri', `<select class="input" id="pk" style="width:auto">${P.map(([v, l]) => `<option value="${v}" ${v === st.k ? 'selected' : ''}>${l}</option>`).join('')}</select>${st.k === 'aralik' ? `<input class="input" type="date" id="pf" value="${st.from}" style="width:auto"><input class="input" type="date" id="pt" value="${st.to}" style="width:auto">` : ''}`) + `
      <div class="grid g4 mb">${kpi('Net ciro', money(sum(ok, net)), 'trend', 'ok', `<div class="small faint">İadeler düşüldü · ${money(sum(all, (o) => o.refunded || 0))} iade</div>`)}${kpi('Sipariş', ok.length, 'bag')}${kpi('Dönüşüm oranı', views ? pct((ok.length / views) * 100) : '-', 'percent', 'info', '<div class="small faint">Sipariş / ürün görüntülenmesi (tüm zamanlar)</div>')}${kpi('İade oranı', pct(retRate), 'refresh', 'warn')}</div>
      <div class="grid g3"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(byCat).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), { format: money, size: 130 })}</div></div>
      <div class="card"><div class="card-h"><h3>Şehirler</h3></div><div class="card-b">${chart.bars(Object.entries(byCity).map(([label, v]) => ({ label: label.slice(0, 6), value: sum(v, net) })).sort((x, y) => y.value - x.value).slice(0, 10), { format: money })}</div></div>
      <div class="card"><div class="card-h"><h3>Ödeme yöntemleri</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(ok, (o) => PAY[o.pay])).map(([label, v]) => ({ label, value: v.length })), { size: 130 })}</div></div></div>
      <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Kanal bazında kâr (tahmini)</h3></div>${table({ rows: pf.ch.map((x, i) => ({ ...x, id: i })), empty: 'Bu dönemde satış yok', columns: [{ label: 'Kanal', render: (x) => esc(x.name) }, { label: 'Ciro (KDV hariç)', cls: 'right', render: (x) => money(x.rev) }, { label: 'Kesinti + kargo', cls: 'right', render: (x) => money(x.exp) }, { label: 'Maliyet', cls: 'right', render: (x) => money(x.cost) }, { label: 'Kâr', cls: 'right', render: (x) => tl(x.kar) }] })}</div>
      <div class="card"><div class="card-h"><h3>Ürün bazında kâr (tahmini)</h3></div>${table({ rows: pf.pr.slice(0, 15).map((x, i) => ({ ...x, id: i })), empty: 'Bu dönemde satış yok', columns: [{ label: 'Ürün', render: (x) => `${esc(x.name)}${x.noCost ? ' ' + badge('Maliyet yok', 'warn') : ''}` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Ciro', cls: 'right', render: (x) => money(x.rev) }, { label: 'Kâr', cls: 'right', render: (x) => (x.noCost ? '-' : tl(x.kar)) }] })}</div></div>
      <p class="small faint mt">Kâr tahminidir: KDV hariç ciro − komisyon/hizmet bedeli (kanal ayarındaki oranlar) − kargo gideri (ayarlardaki sipariş başı tutar) − ürün maliyeti. ${pf.miss ? `<b>${pf.miss} üründe maliyet girilmemiş; bunların maliyeti toplama girmez, kâr olduğundan yüksek görünür.</b>` : ''}</p>`;
    $('#pk', el).onchange = (e) => { st.k = e.target.value; app.refresh(); };
    if ($('#pf', el)) { $('#pf', el).onchange = (e) => { st.from = e.target.value; app.refresh(); }; $('#pt', el).onchange = (e) => { st.to = e.target.value; app.refresh(); }; }
  }

  // Tahmini kâr: iade edilen adetler düşülür, kanal kesintisi kaleme ciro payıyla dağıtılır
  function profitRows(orders) {
    const P = {}, C = {}; const miss = new Set(); const shipC = Number(S().shipCost) || 0;
    orders.forEach((o) => {
      const nets = lineNet(o); const gross = sum(nets, (x) => x) || 1; const mp = MP.CH[o.channel]; const st = mp ? MP.settle(o) : null; const exp = st ? st.com + st.fee + st.ship : shipC;
      const key = mp ? mp.name : 'Kendi mağaza'; const c = (C[key] = C[key] || { name: key, rev: 0, exp: 0, cost: 0, kar: 0 }); c.exp += exp;
      o.items.forEach((i, k) => {
        const qty = i.qty - retQty(o, i.vid); if (qty <= 0) return; const pr = prod(i.pid); const rev = (nets[k] * (qty / i.qty)) / (1 + vatOf(pr) / 100); const costU = Number(pr.cost) || 0; if (!costU) miss.add(i.pid);
        const share = exp * (nets[k] / gross); const x = (P[i.pid] = P[i.pid] || { name: i.name, qty: 0, rev: 0, kar: 0, noCost: !costU }); x.qty += qty; x.rev += rev; x.kar += rev - share - costU * qty; c.rev += rev; c.cost += costU * qty;
      });
    });
    const ch = Object.values(C).map((c) => ({ ...c, kar: c.rev - c.exp - c.cost })).sort((a, b) => b.rev - a.rev);
    return { pr: Object.values(P).sort((a, b) => b.kar - a.kar), ch, miss: miss.size };
  }
  // Çoklu seçim işlemleri
  async function bulk(app, a, list, done) {
    if (a === 'prep') { const go = list.filter((o) => o.status === 'yeni' && !o.unmatched); const un = go.filter(unpaid); if (!go.length) return toast('Seçilenlerde hazırlanacak yeni sipariş yok', 'err'); if (un.length && !(await confirm(`${un.length} siparişin ödemesi alınmadı. Yine de hazırlansın mı?`))) return; go.forEach((o) => setSt(o, 'hazirlaniyor')); db.save(); toast(`${go.length} sipariş hazırlanıyor${go.length < list.length ? ` · ${list.length - go.length} sipariş atlandı` : ''}`, 'ok'); done(); return app.refresh(); }
    if (a === 'slip') return NS.printHtml(list.map((o) => `<div style="page-break-after:always">${NS.docs.render('paket', slipDoc(o))}</div>`).join(''), { title: 'Paket fişleri' });
    if (a === 'pick') { const go = list.filter((o) => ['yeni', 'hazirlaniyor'].includes(o.status) && !o.unmatched); if (!go.length) return toast('Seçilenlerde toplanacak sipariş yok', 'err'); return NS.docs.print('toplama', pickDoc(go)); }
    if (a === 'label') { const go = list.filter((o) => o.tracking && o.status === 'kargoda'); if (!go.length) return toast('Etiket için takip numaralı (kargodaki) sipariş seçin', 'err'); return NS.printHtml(go.map(labelHtml).join(''), { title: 'Kargo etiketleri' }); }
    // Kargo & Kurye programının "Excel'den gönderi al" sütunlarıyla aynı
    if (a === 'xl') { const go = list.filter((o) => ['yeni', 'hazirlaniyor'].includes(o.status)); if (!go.length) return toast('Seçilenlerde gönderilecek sipariş yok', 'err'); return NS.csv('kargo-listesi', go, [{ label: 'Alıcı', value: (o) => o.ship.name }, { label: 'Telefon', value: (o) => o.ship.phone }, { label: 'Şehir', value: (o) => o.ship.city }, { label: 'İlçe', value: (o) => o.ship.district || '' }, { label: 'Adres', value: (o) => o.ship.address }, { label: 'Desi', value: (o) => Math.max(1, sum(o.items, (i) => i.qty)) }, { label: 'Kapıda tahsilat', value: (o) => (o.pay === 'kapida' ? o.total : 0) }, { label: 'Referans', value: (o) => o.no }]); }
    if (a === 'inv') { let n = 0, t = 0, e = 0; for (const o of list) { if (['iptal', 'yeni'].includes(o.status) || (o.ebelge && !o.ebelge.test)) continue; const r = await invoice(o); if (r && r.ok) (r.simulated ? t++ : n++); else e++; } toast([n && `${n} fatura kesildi`, t && `${t} fatura TEST (gönderilmedi)`, e && `${e} fatura kesilemedi`].filter(Boolean).join(' · ') || 'Faturası kesilecek sipariş yok', e ? 'err' : t ? 'warn' : n ? 'ok' : ''); done(); return app.refresh(); }
  }
  // Barkodla paket doğrulama: her kalem okutulur, yanlış ürün ve fazla adet uyarı verir
  function packCheck(app, o) {
    const items = o.items.map((i) => { const v = prod(i.pid).variants.find((x) => x.id === i.vid) || {}; return { i, codes: [v.barcode, v.sku, ...(v.aliases || []), i.code].filter(Boolean).map((c) => String(c).toUpperCase()), n: 0 }; });
    const body = () => items.map((x) => `<div class="list-item"><span class="grow"><b>${esc(x.i.name)}</b><div class="small faint">${esc(x.i.variant)} · ${esc(skuOf(x.i))}</div></span><b style="color:var(--${x.n >= x.i.qty ? 'ok' : 'text'})">${x.n}/${x.i.qty}</b></div>`).join('');
    const save = (manual, c) => { o.packCheck = { at: new Date().toISOString(), user: me(), manual }; hist(o, manual ? 'Paket elle onaylandı (barkod okutulmadı)' : 'Paket barkodla doğrulandı'); db.save(); c(); toast('Paket doğrulandı', 'ok'); app.refresh(); };
    let close = null;
    const hit = (raw, b) => { const c = String(raw || '').trim().toUpperCase(); if (!c) return; const x = items.find((y) => y.codes.includes(c) && y.n < y.i.qty); if (!x) { NS.beep(200, 300); return toast(items.some((y) => y.codes.includes(c)) ? 'Bu üründen fazla okuttunuz' : 'Bu ürün bu siparişte yok', 'err'); } x.n++; NS.beep(); $('#pk', b).innerHTML = body(); if (items.every((y) => y.n >= y.i.qty)) save(false, close); };
    modal({ title: `Paketi doğrula — ${o.no}`, body: `<div class="row nw mb" style="gap:6px"><input class="input grow" id="sc" autocomplete="off" placeholder="Ürün barkodu veya stok kodu okutun"><button class="btn" id="cam">${icon('barcode')} Kamera</button></div><div id="pk">${body()}</div>`,
      onOpen: (b) => { close = () => $('[data-x]', b.closest('.ns-modal')).click(); const inp = $('#sc', b); setTimeout(() => inp.focus(), 50); inp.onkeydown = (e) => { if (e.key === 'Enter') { hit(inp.value, b); inp.value = ''; } }; $('#cam', b).onclick = () => { if (NS.scan) NS.scan({ title: 'Ürün barkodu', continuous: true, onCode: (c) => { hit(c, b); return false; } }); }; },
      actions: [{ label: 'Vazgeç', onClick: (c) => c() }, ...(isAdm() ? [{ label: 'Elle onayla', onClick: async (c) => { if (await confirm('Barkod okutmadan paket doğrulanmış sayılsın mı?')) save(true, c); } }] : [])], });
  }
  // Telefon, WhatsApp, Instagram siparişi: stok düşer, ödeme durumu seçilir
  function manualOrder(app) {
    const vs = db.all('products').flatMap((p) => p.variants.map((v) => ({ p, v }))); const lines = [];
    const label = (r) => `${r.p.name} · ${r.v.color} / ${r.v.size} · ${r.v.sku || ''}`; const m = new Map(vs.map((r) => [label(r), r]));
    const draw = (b) => { const sub = sum(lines, (l) => l.qty * l.price); const ds = Math.min(sub, Number($('[name=disc]', b).value) || 0); const sh = Number($('[name=shipping]', b).value) || 0; $('#ml', b).innerHTML = lines.map((l, i) => `<div class="list-item small"><span class="grow"><b>${esc(l.name)}</b> ${esc(l.variant)}</span><input class="input" type="number" min="1" data-q="${i}" value="${l.qty}" style="width:64px"><input class="input" type="number" min="0" step="0.01" data-p="${i}" value="${l.price}" style="width:90px"><button class="btn sm ghost" data-del="${i}" aria-label="Çıkar">${icon('x')}</button></div>`).join('') || '<div class="small faint">Ürün ekleyin</div>'; $('#mt', b).textContent = money(sub - ds + sh); };
    modal({ title: 'Elle sipariş', size: 'wide', body: `<div class="form-grid" id="mf">${NS.fieldsHtml([{ name: 'name', label: 'Müşteri', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'city', label: 'Şehir', required: true }, { name: 'address', label: 'Adres', required: true, full: true }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Telefon', 'WhatsApp', 'Instagram', 'Mağazada', 'Diğer'] }, { name: 'pay', label: 'Ödeme', type: 'select', options: [{ value: 'havale', label: 'Havale/EFT' }, { value: 'kapida', label: 'Kapıda ödeme' }, { value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kart (POS)' }] }, { name: 'paid', label: 'Ödeme alındı', type: 'checkbox' }, { name: 'disc', label: 'İndirim (₺)', type: 'number', value: 0 }, { name: 'shipping', label: 'Kargo (₺)', type: 'number', value: 0 }, { name: 'note', label: 'Not', full: true }])}</div>
      <h3 class="mt mb">Ürünler</h3><div class="row nw mb" style="gap:6px"><input class="input grow" id="mi" list="mdl" placeholder="Ürün, renk, stok kodu yazın"><datalist id="mdl">${vs.slice(0, 3000).map((r) => `<option value="${esc(label(r))}">`).join('')}</datalist><button class="btn" id="ma">${icon('plus')} Ekle</button></div><div id="ml"></div><div class="row between mt"><b>Toplam</b><b id="mt" style="font-size:18px"></b></div>`,
      onOpen: (b) => { draw(b);
        $('#ma', b).onclick = () => { const r = m.get($('#mi', b).value); if (!r) return toast('Listeden ürün seçin', 'err'); const ex = lines.find((l) => l.vid === r.v.id); if (ex) ex.qty++; else lines.push({ pid: r.p.id, vid: r.v.id, name: r.p.name, variant: `${r.v.color} / ${r.v.size}`, qty: 1, price: SH.price(r.p) }); $('#mi', b).value = ''; draw(b); };
        on(b, 'input', '[name=disc],[name=shipping]', () => draw(b)); on(b, 'change', '[data-q]', (e, x) => { lines[x.dataset.q].qty = Math.max(1, Math.floor(Number(x.value) || 1)); draw(b); }); on(b, 'change', '[data-p]', (e, x) => { lines[x.dataset.p].price = Math.max(0, Number(x.value) || 0); draw(b); }); on(b, 'click', '[data-del]', (e, x) => { lines.splice(Number(x.dataset.del), 1); draw(b); }); },
      actions: [{ label: 'Vazgeç' }, { label: 'Siparişi kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => {
        if (!NS.validate($('#mf', b))) return; if (!lines.length) return toast('En az bir ürün ekleyin', 'err'); const a = NS.readForm($('#mf', b));
        for (const l of lines) { const v = prod(l.pid).variants.find((x) => x.id === l.vid); if (!v || v.stock < l.qty) return toast(`${l.name} (${l.variant}) için stok yetersiz: ${v ? v.stock : 0}`, 'err'); }
        lines.forEach((l) => { prod(l.pid).variants.find((x) => x.id === l.vid).stock -= l.qty; });
        const dg = (s) => String(s || '').replace(/\D/g, '').slice(-10); let cu = db.find('customers', (x) => dg(x.phone) === dg(a.phone)); if (!cu) cu = db.insert('customers', { name: a.name, phone: a.phone, city: a.city, address: a.address }, true);
        const sub = r2(sum(lines, (l) => l.qty * l.price)); const discount = Math.min(sub, Number(a.disc) || 0); const shipping = Number(a.shipping) || 0;
        const o = db.insert('orders', { no: db.nextNo('orders', 'LB'), at: new Date().toISOString(), customer: cu.id, ship: { name: a.name, phone: a.phone, city: a.city, address: a.address }, items: lines.map((l) => ({ ...l })), subtotal: sub, discount, shipping, total: r2(sub - discount + shipping), pay: a.pay, payStatus: a.paid ? 'alindi' : a.pay === 'kapida' ? 'kapida' : 'bekliyor', status: 'yeni', channel: a.source, note: a.note || '', history: [{ at: new Date().toISOString(), st: 'yeni', note: `Elle girildi (${a.source})`, user: me() }] }, true);
        db.log('Elle sipariş', o.no); db.save(); MP.stockChanged(lines); c(); toast(`${o.no} kaydedildi`, 'ok'); app.refresh();
      } }] });
  }
  // Excel/CSV: stok kodu veya barkodla var olan varyant güncellenir; yeni kod + ad varsa ürün/varyant açılır. Önce özet gösterilir.
  async function importProducts(app) {
    let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada satır yok', 'err');
    const nrm = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, ''); const numOf = (v) => { if (typeof v === 'number') return v; const t = String(v == null ? '' : v).trim(); return t === '' ? NaN : Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t); };
    const AL = { sku: ['stokkodu', 'sku', 'kod', 'ürünkodu'], barcode: ['barkod'], name: ['ürün', 'ürünadı', 'ad'], color: ['renk'], size: ['beden'], price: ['fiyat', 'satışfiyatı'], stock: ['stok', 'adet', 'miktar'], cost: ['maliyet', 'alışfiyatı', 'alış'], cat: ['kategori'] };
    const keys = [...new Set(f.rows.flatMap((r) => Object.keys(r)))]; const col = {}; Object.entries(AL).forEach(([k, al]) => { const h = keys.find((x) => al.includes(nrm(x))); if (h) col[k] = h; });
    if (!col.sku && !col.barcode) return toast('Gerekli sütun bulunamadı: Stok kodu veya Barkod', 'err');
    const errs = [], ups = [], adds = [];
    f.rows.forEach((r, n) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : ''); const code = g('sku') || g('barcode'); if (!code) return errs.push(`Satır ${n + 2}: kod boş`); const stock = g('stock') === '' ? null : numOf(g('stock')); const price = g('price') === '' ? null : numOf(g('price')); const cost = g('cost') === '' ? null : numOf(g('cost')); if ((stock !== null && !(stock >= 0)) || (price !== null && !(price > 0)) || (cost !== null && !(cost >= 0))) return errs.push(`Satır ${n + 2}: sayı geçersiz`); const fv = MP.findVariant(g('sku')) || MP.findVariant(g('barcode')); if (fv) return ups.push({ fv, stock, price, cost, barcode: g('barcode') }); if (!g('name') || price === null) return errs.push(`Satır ${n + 2}: ${code} bulunamadı; yeni ürün için ad ve fiyat gerekli`); adds.push({ sku: g('sku') || code, barcode: g('barcode'), name: g('name'), color: g('color') || 'Siyah', size: g('size') || 'Standart', cat: g('cat'), price, cost: cost || 0, stock: stock || 0 }); });
    if (!ups.length && !adds.length) return toast(errs[0] || 'Aktarılacak satır yok', 'err');
    if (!(await confirm(`${ups.length} güncelleme, ${adds.length} yeni varyant${errs.length ? `, ${errs.length} hatalı satır atlanacak (ilki: ${errs[0]})` : ''}. Aktarılsın mı?`))) return;
    const vids = []; ups.forEach((u) => { if (u.stock !== null) u.fv.v.stock = u.stock; if (u.barcode) u.fv.v.barcode = u.barcode; if (u.price !== null) u.fv.p.price = u.price; if (u.cost !== null) u.fv.p.cost = u.cost; vids.push({ vid: u.fv.v.id }); });
    const cats = db.all('cats'); adds.forEach((a) => { let p = db.find('products', (x) => nrm(x.name) === nrm(a.name)); if (!p) { const c = cats.find((x) => nrm(x.name) === nrm(a.cat)) || cats[0] || { id: '' }; p = db.insert('products', { name: a.name, slug: NS.slug(a.name), cat: c.id, price: a.price, sale: null, cost: a.cost, vat: '', desc: '', colors: [], variants: [], tags: [], active: false, views: 0 }, true); } if (!p.colors.includes(a.color)) p.colors.push(a.color); const v = { id: NS.uid(), color: a.color, size: a.size, stock: a.stock, sku: a.sku, barcode: a.barcode }; p.variants.push(v); vids.push({ vid: v.id }); });
    db.log('Excel aktarımı', `${ups.length + adds.length} satır`); db.save(); MP.stockChanged(vids); toast(`${ups.length + adds.length} satır aktarıldı${adds.length ? ' · yeni ürünler yayında değil, kontrol edip yayına alın' : ''}`, 'ok'); app.refresh();
  }

  const ROLES = { admin: 'Mağaza sahibi', depo: 'Depo / sevkiyat' };
  NS.shell({
    id: 'eticaret', integrations: ['payment','sms','email','whatsapp','label','efatura','webhook','backup'], name: 'E-ticaret', tagline: 'Online Mağaza Yönetimi', icon: 'bag', accent: '#7c3aed', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['admin'] }, { id: 'siparisler', label: 'Siparişler', icon: 'bag', badge: true }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'box' }, { id: 'kategoriler', label: 'Kategoriler', icon: 'grid', roles: ['admin'] }, ...MP.nav, { sec: 'Pazarlama' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['admin'] }, { id: 'kuponlar', label: 'Kuponlar', icon: 'ticket', roles: ['admin'] }, { id: 'sepetler', label: 'Terk Edilen Sepetler', icon: 'cart', roles: ['admin'] }, { id: 'iadeler', label: 'İadeler', icon: 'refresh' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Mağaza Ayarları', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ siparisler: db.all('orders', (o) => o.status === 'yeni').length || '', eslesmeyen: MP.unmatchedOrders().length || '' }),
    routes: {
      ...MP.routes, ozet: dashboard, siparisler: ordersPage, urunler: productsPage, musteriler: customersPage, sepetler: cartsPage, iadeler: returnsPage, raporlar: reportsPage,
      kategoriler: (el, p, a) => NS.crud(el, a, { col: 'cats', title: 'Kategoriler', single: 'Kategori', addLabel: 'Yeni kategori', fields: [{ name: 'name', label: 'Ad', required: true }], beforeSave: (v, rec) => { if (!rec) { v.id = NS.slug(v.name); if (db.get('cats', v.id)) return 'Bu adla kategori var'; } }, canDelete: (c) => { const n = db.all('products', (x) => x.cat === c.id).length; return n ? `Bu kategoride ${n} ürün var, silinemez` : true; }, columns: [{ key: 'name', label: 'Kategori', render: (c) => `${SH.CAT_EMOJI[c.id] || '🛍️'} <b>${esc(c.name)}</b>` }, { label: 'Ürün', cls: 'right', render: (c) => db.all('products', (x) => x.cat === c.id).length }] }),
      kuponlar: (el, p, a) => NS.crud(el, a, { col: 'coupons', title: 'Kuponlar', single: 'Kupon', addLabel: 'Yeni kupon', emptyIcon: 'ticket', fields: [{ name: 'code', label: 'Kod', required: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'pct', label: 'Yüzde indirim' }, { value: 'tl', label: 'Tutar indirimi' }, { value: 'ship', label: 'Ücretsiz kargo' }] }, { name: 'value', label: 'Değer', type: 'number' }, { name: 'min', label: 'Alt limit (₺)', type: 'number' }, { name: 'start', label: 'Başlangıç', type: 'date' }, { name: 'end', label: 'Son kullanma', type: 'date' }, { name: 'maxUses', label: 'Kullanım sınırı', type: 'number', hint: 'Boş: sınırsız' }, { name: 'active', label: 'Aktif', type: 'checkbox' }], defaults: { active: true, type: 'pct' }, beforeSave: (v, rec) => { v.code = v.code.trim().toUpperCase(); if (db.find('coupons', (k) => k.code === v.code && (!rec || k.id !== rec.id))) return 'Bu kod zaten var'; if (v.type === 'pct' && !(Number(v.value) > 0 && Number(v.value) <= 100)) return 'Yüzde 1–100 arasında olmalı'; if (v.type === 'tl' && !(Number(v.value) > 0)) return 'İndirim tutarı girin'; if (v.start && v.end && v.end < v.start) return 'Son kullanma başlangıçtan önce olamaz'; }, columns: [{ key: 'code', label: 'Kod', render: (k) => `<b class="mono">${esc(k.code)}</b>` }, { label: 'İndirim', render: (k) => (k.type === 'pct' ? '%' + k.value : k.type === 'tl' ? money(k.value) : 'Ücretsiz kargo') }, { key: 'min', label: 'Alt limit', render: (k) => money(k.min || 0) }, { key: 'uses', label: 'Kullanım', cls: 'right', render: (k) => `${k.uses || 0}${k.maxUses ? ' / ' + k.maxUses : ''}` }, { label: 'Son tarih', render: (k) => (k.end ? NS.date(k.end) : '-') }, { label: 'Durum', render: (k) => { const m = SH.couponCheck(k); return !k.active ? badge('Pasif') : m ? badge(/başlıyor/.test(m) ? 'Başlamadı' : /süresi/.test(m) ? 'Süresi doldu' : 'Hak doldu', 'warn') : badge('Aktif', 'ok'); } }] }),
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza' }, { name: 'shopTitle', label: 'Mağaza başlığı', full: true, hint: 'Tarayıcı sekmesinde ve arama sonuçlarında işletme adının yanında görünür. Örn: El yapımı deri çanta' }, { name: 'shopDesc', label: 'Mağaza açıklaması', type: 'textarea', full: true, hint: 'Ana sayfada, altbilgide ve arama sonucu açıklamasında kullanılır. Boşsa gösterilmez.' }, { name: 'banner', label: 'Duyuru bandı', full: true }, { name: 'returnDays', label: 'Ücretsiz iade süresi (gün)', type: 'number', hint: 'Boşsa mağazada ücretsiz iade vaadi gösterilmez. Yasal cayma hakkı ayrıdır.' }, { name: 'installments', label: 'Vade farksız taksit sayısı', type: 'number', hint: 'Boşsa mağazada taksit gösterilmez. Yalnızca gerçekten sunuyorsanız yazın.' }, { name: 'freeShip', label: 'Ücretsiz kargo eşiği (₺)', type: 'number' }, { name: 'shipFee', label: 'Kargo ücreti (₺)', type: 'number' }, { name: 'codFee', label: 'Kapıda ödeme bedeli (₺)', type: 'number' }, { name: 'vat', label: 'Varsayılan ürün KDV oranı (%)', type: 'number', hint: 'Ürün kartında ayrı oran seçilmemişse faturada bu kullanılır' }, { name: 'bankHolder', label: 'Havale alıcı adı' }, { name: 'iban', label: 'Havale IBAN', full: true }, { name: 'carriers', label: 'Kargo firmaları (virgülle)', full: true }, { type: 'section', label: 'Operasyon' }, { name: 'lowStock', label: 'Kritik stok sınırı (varyant adedi)', type: 'number', hint: 'Boşsa 2' }, { name: 'shipHours', label: 'Kargoya verme süresi (saat)', type: 'number', hint: 'Aşılınca sipariş "Gecikiyor" görünür; boşsa 48' }, { name: 'shipCost', label: 'Sipariş başı kargo gideriniz (₺)', type: 'number', step: '0.01', hint: 'Kendi mağaza kâr hesabında kullanılır' }, { name: 'requirePack', label: 'Kargoya vermeden önce paket doğrulama zorunlu', type: 'checkbox' }] }),
    },
  });
  window.addEventListener('storage', (e) => { if (e.key === db.key) db.load(); });
})();
