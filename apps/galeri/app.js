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
  const nextStock = () => 'G' + (Math.max(299, ...db.all('vehicles').map((x) => Number(String(x.stockNo).replace(/\D/g, '')) || 0)) + 1);
  const match = (l) => db.all('vehicles', (v) => v.status !== 'satildi' && (!l.body || v.body === l.body) && v.listPrice <= (l.budget || Infinity) * 1.05).sort((a, b) => b.listPrice - a.listPrice);

  // ---------- Araç detayı ----------
  function carModal(app, v) {
    const exp = sum(v.expenses || [], (e) => e.amount);
    const m = modal({ title: `${v.stockNo} · ${title(v)}`, size: 'wide', body: `<div class="grid g2"><div class="col">
        <div class="row">${stB(v.status)} ${badge(G.SRC[v.source], v.source === 'konsinye' ? 'acc' : '')} ${v.tramer ? badge('Tramer ' + money(v.tramer), 'warn') : badge('Tramer yok', 'ok')}</div>
        <div class="card pad"><b style="font-size:18px">${esc(v.brand)} ${esc(v.model)} ${esc(v.pkg || '')}</b><div class="small muted">${v.year} · ${NS.num(v.km)} km · ${esc(v.fuel)} · ${esc(v.gear)} · ${esc(v.color)} · ${esc(v.body)}</div><div class="small mt">Plaka <span class="mono">${esc(v.plate)}</span> · stokta ${G.days(v)} gün</div>${v.owner ? `<div class="small mt">Araç sahibi: <b>${esc(v.owner.name)}</b> ${esc(v.owner.phone)} · istediği ${money(v.owner.want)} · komisyon %${v.commission}</div>` : ''}</div>
        <div class="card pad">${v.source !== 'konsinye' ? `<div class="list-item small"><span class="grow muted">Alış</span>${money(v.buy)}</div>` : ''}<div class="list-item small"><span class="grow muted">Masraflar</span>${money(exp)}</div>${v.source !== 'konsinye' ? `<div class="list-item"><b class="grow">Toplam maliyet</b><b>${money(G.cost(v))}</b></div>` : ''}<div class="list-item small"><span class="grow muted">İlan fiyatı / en düşük</span>${money(v.listPrice)} / ${money(v.minPrice)}</div><div class="list-item"><b class="grow">${v.sale ? 'Gerçekleşen kâr' : 'Beklenen kâr'}</b>${pB(G.profit(v))}</div>${v.sale ? `<div class="small muted">${NS.date(v.sale.at)} · ${esc(v.sale.buyer)} · ${money(v.sale.price)} · ${esc(v.sale.pay)}</div>` : ''}</div>
        <div class="card">${table({ rows: v.expenses || [], empty: 'Masraf yok', columns: [{ label: 'Masraf', render: (e) => esc(e.type) + (e.note ? `<div class="small faint">${esc(e.note)}</div>` : '') }, { label: 'Tarih', render: (e) => NS.date(e.at) }, { label: 'Tutar', cls: 'right', render: (e) => money(e.amount) }] })}</div></div>
      <div class="col"><div class="card pad"><h3 class="mb">Ekspertiz ${noExp(v) ? badge('Girilmedi', 'err') : ''}</h3>${noExp(v) ? '<p class="small muted">Boya / değişen bilgisi girilmeden vitrinde "ekspertiz bilgisi girilmedi" yazar.</p>' : ''}<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;${noExp(v) ? 'display:none' : ''}">${G.PARTS.map((p) => { const s = (v.parts || {})[p] || 'orijinal'; return `<div class="small" style="display:flex;justify-content:space-between;align-items:center;gap:6px;white-space:nowrap"><span>${esc(p)}</span>${badge(G.PST[s][0], G.PST[s][1])}</div>`; }).join('')}</div></div>
        <div class="card pad"><h3 class="mb">İlanlar</h3>${Object.keys(v.ads || {}).length ? Object.entries(v.ads).map(([k, a]) => `<div class="list-item small" style="gap:10px;flex-wrap:wrap"><b class="grow">${k === 'sahibinden' ? 'sahibinden.com' : 'arabam.com'}</b><span class="mono">${esc(a.no)}</span><span>${a.views != null ? `${NS.num(a.views)} görüntülenme · ${a.fav || 0} favori` : a.at ? 'girildi ' + NS.date(a.at) : ''}</span></div>`).join('') : '<span class="small muted">İlana çıkmadı</span>'}</div>
        <div class="card pad small muted">${esc(v.desc || '')}</div></div></div>`,
      actions: [
        ...(v.status !== 'satildi' ? [{ label: 'Masraf ekle', icon: 'plus', onClick: async () => { const r = await formModal({ title: 'Masraf', fields: [{ name: 'type', label: 'Tür', type: 'select', options: G.EXP }, { name: 'amount', label: 'Tutar', type: 'number', required: true }, { name: 'note', label: 'Not' }] }); if (!r) return; (v.expenses = v.expenses || []).push({ id: NS.uid(), ...r, amount: Number(r.amount), at: today() }); db.save(); m.close(); carModal(app, v); } },
          { label: 'Düzenle', icon: 'edit', onClick: (c) => { c(); editCar(app, v); } },
          { label: 'Ekspertiz', icon: 'shield', onClick: async (c) => { const r = await formModal({ title: `Ekspertiz — ${title(v)}`, size: 'wide', fields: [...G.PARTS.map((p) => ({ name: 'p_' + p, label: p, type: 'select', options: Object.entries(G.PST).map(([value, [label]]) => ({ value, label })) })), { name: 'tramer', label: 'Tramer kaydı (₺, yoksa 0)', type: 'number' }, { name: 'expNote', label: 'Ekspertiz notu / rapor no', full: true }], values: { ...Object.fromEntries(G.PARTS.map((p) => ['p_' + p, (v.parts || {})[p] || 'orijinal'])), tramer: v.tramer || 0, expNote: v.expNote || '' } }); if (!r) return; v.parts = Object.fromEntries(G.PARTS.map((p) => [p, r['p_' + p]])); v.tramer = Number(r.tramer) || 0; v.expNote = r.expNote; v.expertise = true; db.save(); c(); carModal(app, v); } },
          { label: 'İlan', icon: 'globe', onClick: () => adModal(app, v, m) },
          { label: v.status === 'opsiyon' ? 'Opsiyonu kaldır' : 'Opsiyon koy', onClick: (c) => { v.status = v.status === 'opsiyon' ? 'satista' : 'opsiyon'; db.save(); c(); app.refresh(); } },
          { label: 'Sat', cls: 'primary', icon: 'cash', onClick: (c) => { c(); sell(app, v); } }] : [{ label: 'Satış belgesi', icon: 'print', onClick: () => printSale(v) }]),
      ] });
  }
  // İlan: portallara otomatik aktarım doğrulanamadı — ilan metni hazırlanır, kullanıcı yayınladığı ilanın numarasını girer
  const adText = (v) => `${title(v)} ${v.pkg || ''}\n${NS.num(v.km)} km · ${v.fuel} · ${v.gear} · ${v.color || ''}\nFiyat: ${money(v.listPrice)}\nTramer: ${v.tramer ? money(v.tramer) : 'kayıt yok'}\nEkspertiz: ${noExp(v) ? 'bilgi için arayın' : Object.entries(v.parts || {}).filter(([, s]) => s !== 'orijinal').map(([p, s]) => `${p} ${G.PST[s][0].toLowerCase()}`).join(', ') || 'boyasız, değişensiz'}\n${v.desc || ''}\n${S().bizName} · ${S().bizPhone || ''}`;
  function adModal(app, v, parent) {
    modal({ title: `İlan — ${title(v)}`, size: 'wide', body: `<p class="small muted mb">sahibinden.com / arabam.com otomatik aktarımı doğrulanmadığı için kapalı. Metni kopyalayıp portala yapıştırın, yayınlanınca ilan numarasını girin.</p><textarea class="input" rows="9" id="adt" readonly>${esc(adText(v))}</textarea><div class="form-grid mt"><div class="field"><label>Portal</label><select class="input" id="adp"><option value="sahibinden">sahibinden.com</option><option value="arabam">arabam.com</option></select></div><div class="field"><label>İlan numarası</label><input class="input" id="adn" placeholder="Yayınlandıysa"></div></div>`,
      actions: [{ label: 'Metni kopyala', icon: 'copy', onClick: async (c, b) => { try { await navigator.clipboard.writeText(adText(v)); toast('Kopyalandı', 'ok'); } catch (e) { $('#adt', b).select(); } } },
        { label: 'İlan numarasını kaydet', cls: 'primary', icon: 'check', onClick: (c, b) => { const no = $('#adn', b).value.trim(); if (!no) return toast('İlan numarasını girin', 'err'); v.ads = v.ads || {}; v.ads[$('#adp', b).value] = { no, at: today() }; if (v.status === 'hazirlik') v.status = 'satista'; db.save(); c(); if (parent) parent.close(); toast('İlan kaydedildi', 'ok'); carModal(app, v); } }] });
  }
  async function editCar(app, v) {
    const r = await formModal({ title: v ? `${v.stockNo} düzenle` : 'Araç alışı', size: 'wide', fields: [{ type: 'section', label: 'Araç' }, { name: 'plate', label: 'Plaka', required: true }, { name: 'brand', label: 'Marka', required: true }, { name: 'model', label: 'Model', required: true }, { name: 'pkg', label: 'Paket / motor' }, { name: 'year', label: 'Yıl', type: 'number', required: true }, { name: 'km', label: 'Km', type: 'number', required: true }, { name: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'LPG', 'Hibrit', 'Elektrik'] }, { name: 'gear', label: 'Vites', type: 'select', options: ['Manuel', 'Otomatik'] }, { name: 'body', label: 'Kasa', type: 'select', options: ['Sedan', 'Hatchback', 'SUV', 'Station wagon', 'Coupe', 'Ticari'] }, { name: 'color', label: 'Renk' }, { type: 'section', label: 'Alış' }, { name: 'source', label: 'Geliş şekli', type: 'select', options: Object.entries(G.SRC).map(([value, label]) => ({ value, label })) }, { name: 'buy', label: 'Alış fiyatı (konsinyede boş)', type: 'number' }, { name: 'buyDate', label: 'Alış tarihi', type: 'date' }, { name: 'tramer', label: 'Tramer kaydı (₺)', type: 'number' }, { name: 'listPrice', label: 'İlan fiyatı', type: 'number', required: true }, { name: 'minPrice', label: 'En düşük satış fiyatı', type: 'number' }, { name: 'desc', label: 'İlan açıklaması', type: 'textarea', full: true }], values: v || { source: 'bireysel', buyDate: today(), fuel: 'Benzin', gear: 'Otomatik', body: 'Sedan', year: 2020 } });
    if (!r) return;
    ['year', 'km', 'buy', 'tramer', 'listPrice', 'minPrice'].forEach((k) => { r[k] = Number(r[k]) || 0; });
    if (v) Object.assign(v, r); else v = db.insert('vehicles', { ...r, stockNo: nextStock(), status: 'hazirlik', parts: {}, expertise: false, expenses: [], ads: {}, commission: 3 });
    db.save(); toast('Kaydedildi', 'ok'); app.refresh();
  }
  async function sell(app, v) {
    const r = await formModal({ title: `Satış — ${title(v)}`, fields: [{ name: 'buyer', label: 'Alıcı ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'tc', label: 'TC kimlik / VKN' }, { name: 'price', label: 'Satış fiyatı (₺)', type: 'number', required: true }, { name: 'pay', label: 'Ödeme', type: 'select', options: ['Peşin', 'Kredi', 'Takas + nakit', 'Senetli'] }, { name: 'deposit', label: 'Alınan kapora', type: 'number' }, { name: 'noter', label: 'Noter tarihi', type: 'date' }], values: { price: v.listPrice, pay: 'Peşin', noter: today() } });
    if (!r) return; const price = Number(r.price);
    if (!(price > 0)) return toast('Satış fiyatı girin', 'err');
    if (price < v.minPrice && !(await confirm(`${money(price)} belirlenen en düşük fiyatın (${money(v.minPrice)}) altında. Bu satışta kâr ${money(price - G.cost(v))}. Onaylıyor musunuz?`))) return;
    v.sale = { at: new Date().toISOString(), buyer: r.buyer, phone: r.phone, tc: r.tc, price, pay: r.pay, deposit: Number(r.deposit) || 0, noter: r.noter }; v.status = 'satildi';
    db.save(); printSale(v); toast(`Satıldı · kâr ${money(G.profit(v))}`, 'ok'); app.refresh();
    if (v.source === 'konsinye' && v.owner) tell(v.owner.phone, v.owner.name, `${S().bizName}: ${title(v)} aracınız ${money(price)} bedelle satıldı. Komisyon sonrası ödemeniz: ${money(price - Math.round((price * v.commission) / 100))}.`, 'Araç sahibine bildirim');
  }
  const saleDoc = (v) => ({ title: 'Araç satış sözleşmesi (ön protokol)', no: v.stockNo, date: v.sale.at,
    info: [['Araç', `${title(v)} ${v.pkg || ''}`], ['Plaka', v.plate], ['Km', NS.num(v.km)], ['Tramer', v.tramer ? money(v.tramer) : 'Kayıt yok'], ['Noter tarihi', v.sale.noter ? NS.date(v.sale.noter) : '-'], ['Ödeme', v.sale.pay]],
    party: { title: 'Alıcı', name: v.sale.buyer, lines: [v.sale.phone, v.sale.tc ? 'TCKN/VKN: ' + v.sale.tc : ''] },
    lines: [{ name: `${title(v)} ${v.pkg || ''} · ${v.plate}`, qty: 1, price: v.sale.price, total: v.sale.price }],
    totals: [['Satış bedeli', v.sale.price, true], ...(v.sale.deposit ? [['Alınan kapora', v.sale.deposit], ['Kalan', v.sale.price - v.sale.deposit]] : [])],
    note: `Ekspertiz: ${noExp(v) ? 'girilmedi' : Object.entries(v.parts || {}).filter(([, s]) => s !== 'orijinal').map(([p, s]) => `${p}: ${G.PST[s][0]}`).join(', ') || 'Boyasız / değişensiz'}${v.expNote ? ' · ' + v.expNote : ''}\nAlıcı aracı ekspertiz bilgisini görerek, gördüğü şekliyle satın almıştır. Resmî devir noterde yapılır.`,
    signatures: [{ label: 'Satıcı' }, { label: 'Alıcı' }] });
  if (NS.docs) NS.docs.define('galeri', 'satis', { label: 'Araç satış sözleşmesi', sample: () => { const v = db.all('vehicles', (x) => x.sale)[0]; return v ? saleDoc(v) : { title: 'Örnek' }; } });
  function printSale(v) {
    if (NS.docs) return NS.docs.print('satis', saleDoc(v));
    NS.printHtml(`<div class="doc"><h2>${esc(S().bizName)}</h2><h3>ARAÇ SATIŞ SÖZLEŞMESİ (ÖN PROTOKOL)</h3><p>${NS.dateLong(new Date(v.sale.at))}</p><table><tr><td>Araç</td><td>${esc(title(v))} ${esc(v.pkg || '')} · ${esc(v.plate)}</td></tr><tr><td>Km</td><td>${NS.num(v.km)}</td></tr><tr><td>Tramer</td><td>${v.tramer ? money(v.tramer) : 'Kayıt yok'}</td></tr><tr><td>Ekspertiz</td><td>${Object.entries(v.parts || {}).filter(([, s]) => s !== 'orijinal').map(([p, s]) => `${p}: ${G.PST[s][0]}`).join(', ') || 'Boyasız / değişensiz'}</td></tr><tr><td>Alıcı</td><td>${esc(v.sale.buyer)} · ${esc(v.sale.phone)} · ${esc(v.sale.tc || '')}</td></tr><tr><td>Satış bedeli</td><td><b>${money(v.sale.price)}</b> · ${esc(v.sale.pay)}${v.sale.deposit ? ` · kapora ${money(v.sale.deposit)}` : ''}</td></tr><tr><td>Noter</td><td>${NS.date(v.sale.noter)}</td></tr></table><p style="font-size:11px">Alıcı aracı ekspertiz raporunu görerek, gördüğü ve beğendiği şekliyle satın almıştır. Resmi devir noterde yapılır.</p><table><tr><td>Satıcı</td><td>Alıcı</td></tr><tr><td style="height:60px"></td><td></td></tr></table></div>`, { title: 'Satış' });
  }

  // ---------- Stok ----------
  function stockPage(el, p, app) {
    let f = p || 'stok', q = '';
    el.innerHTML = pageHead('Araçlar', 'Stoktaki araçlar, maliyet ve beklenen kâr', `<button class="btn primary" id="add">${icon('plus')} Araç alışı</button>`) + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Marka, model, plaka...')}<div class="seg">${[['stok', 'Stokta'], ['hazirlik', 'Hazırlıkta'], ['eski', `${S().staleDays || 60}+ gün`], ['konsinye', 'Konsinye'], ['satildi', 'Satılan'], ['all', 'Tümü']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    const rows = () => db.all('vehicles', (v) => NS.match(q, v.brand, v.model, v.plate, v.stockNo) && (f === 'all' || (f === 'stok' ? v.status !== 'satildi' : f === 'eski' ? v.status !== 'satildi' && G.days(v) > (Number(S().staleDays) || 60) : f === 'konsinye' ? v.source === 'konsinye' && v.status !== 'satildi' : v.status === f))).sort((a, b) => (f === 'satildi' ? b.sale.at.localeCompare(a.sale.at) : G.days(b) - G.days(a)));
    const draw = () => { const r = rows(); $('#t', el).innerHTML = table({ rows: r, emptyIcon: 'car', columns: [
      { label: 'Araç', render: (v) => `<b>${esc(title(v))}</b><div class="small faint">${esc(v.pkg || '')} · ${NS.num(v.km)} km · ${esc(v.fuel)} · ${esc(v.gear)}</div><div class="small faint"><span class="mono">${esc(v.stockNo)}</span> · ${esc(v.plate)}</div>` },
      { label: 'Durum', render: (v) => `${stB(v.status)}${v.source === 'konsinye' ? '<div class="mt">' + badge('Konsinye', 'acc') + '</div>' : ''}` },
      { label: 'Maliyet', cls: 'right', render: (v) => (v.source === 'konsinye' ? '<span class="faint">—</span>' : money(G.cost(v))) },
      { label: 'Fiyat', cls: 'right', render: (v) => `<b>${money(v.sale ? v.sale.price : v.listPrice)}</b>` },
      { label: 'Kâr', cls: 'right', render: (v) => pB(G.profit(v)) },
      { label: 'Stokta', render: ageB },
      { label: 'İlan', render: (v) => { const a = Object.values(v.ads || {}); return a.length ? `<span class="small">${NS.num(sum(a, (x) => x.views))} 👁 · ${sum(a, (x) => x.fav)} ♥</span>` : '<span class="faint small">yok</span>'; } },
    ], actions: [{ icon: 'eye', act: 'v' }], foot: `${r.length} araç · ${money(sum(r.filter((v) => v.source !== 'konsinye'), G.cost))} sermaye` }); };
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
    on(el, 'click', '[data-sms]', (e, b) => { const l = db.get('leads', b.dataset.sms); const M = match(l).slice(0, 3); const url = location.href.replace(/index\.html.*$/, '').replace(/#.*$/, '') + 'vitrin.html'; tell(l.phone, l.name, `${S().bizName}: Aradığınıza uygun araçlar: ${M.map((v) => `${title(v)} ${money(v.listPrice)}`).join(' | ')}. Tümü: ${url}`, 'Uygun araçlar').then(() => { l.status = 'arandi'; l.sentAt = new Date().toISOString(); db.save(); draw(); }); });
    $('#add', el).onclick = async () => { const v = await formModal({ title: 'Müşteri talebi', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'body', label: 'Kasa', type: 'select', empty: 'Fark etmez', options: ['Sedan', 'Hatchback', 'SUV', 'Station wagon', 'Ticari'] }, { name: 'budget', label: 'Bütçe (₺)', type: 'number' }, { name: 'note', label: 'Aradığı araç', full: true }, { name: 'source', label: 'Kaynak', type: 'select', options: ['Telefon', 'Galeriye geldi', 'sahibinden', 'Instagram', 'Tavsiye'] }] }); if (!v) return; db.insert('leads', { ...v, budget: Number(v.budget) || 0, at: new Date().toISOString(), status: 'yeni' }); draw(); };
    draw();
  }

  // ---------- Özet & raporlar ----------
  function dashboard(el, p, app) {
    const V = db.all('vehicles'); const stock = V.filter((v) => v.status !== 'satildi'); const sold = V.filter((v) => v.status === 'satildi');
    const s30 = sold.filter((v) => v.sale.at > addDays(new Date(), -30).toISOString()); const own = stock.filter((v) => v.source !== 'konsinye');
    const stale = stock.filter((v) => G.days(v) > (Number(S().staleDays) || 60));
    // Sermayenin bekleme maliyeti: aylık %kasko/finansman oranı
    const holding = sum(own, (v) => (G.cost(v) * (Number(S().kaskoRate) || 1.8) / 100) * (G.days(v) / 30));
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn" href="#/talepler">${icon('users')} Talepler</a><a class="btn primary" href="#/araclar">${icon('car')} Araçlar</a>`) + `
      <div class="grid g4 mb">${kpi('Stoktaki araç', stock.length, 'car', '', `<div class="small faint">${money(sum(own, G.cost))} bağlı sermaye</div>`)}${kpi('30 gün satış', s30.length, 'trend', 'ok', `<div class="small faint">kâr ${money(sum(s30, G.profit))}</div>`)}${kpi('Ortalama satış süresi', `${sold.length ? Math.round(sum(sold, G.days) / sold.length) : 0} gün`, 'clock', 'info')}${kpi(`${S().staleDays || 60}+ gün bekleyen`, stale.length, 'alert', stale.length ? 'err' : 'ok', `<div class="small faint">bekleme maliyeti ≈ ${money(holding)}</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Araç başı kâr (son satışlar)</h3></div><div class="card-b">${chart.bars(sold.sort((a, b) => a.sale.at.localeCompare(b.sale.at)).slice(-12).map((v) => ({ label: v.brand.slice(0, 5), value: Math.max(0, G.profit(v)) })), { format: (x) => NS.compact(x) })}</div></div>
      <div class="card"><div class="card-h"><h3>Stok dağılımı</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(stock, (v) => v.body)).map(([label, x]) => ({ label, value: x.length })), { size: 130 })}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Uzun süredir bekleyenler</h3></div>${table({ rows: stale.sort((a, b) => G.days(b) - G.days(a)).slice(0, 8), empty: 'Bekleyen araç yok', columns: [{ label: 'Araç', render: (v) => `<b>${esc(title(v))}</b>` }, { label: 'Gün', render: ageB }, { label: 'İlan ilgisi', render: (v) => { const a = Object.values(v.ads || {}); return a.length ? `${NS.num(sum(a, (x) => x.views))} görüntülenme` : 'İlan yok'; } }, { label: 'Öneri', render: (v) => `<span class="small">${Object.keys(v.ads || {}).length ? `Fiyatı ${money(Math.max(v.minPrice, v.listPrice * 0.97))}'ye çekin` : 'İlana çıkarın'}</span>` }], actions: [{ icon: 'eye', act: 'v' }] })}</div>
      <div class="card"><div class="card-h"><h3>Yeni talepler</h3><a class="btn sm" href="#/talepler">Tümü</a></div>${table({ rows: db.all('leads', (l) => l.status === 'yeni'), empty: 'Yeni talep yok', columns: [{ label: 'Müşteri', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.note)}</div>` }, { label: 'Eşleşen', cls: 'right', render: (l) => badge(match(l).length + ' araç', match(l).length ? 'ok' : '') }] })}</div></div>`;
    on(el, 'click', '[data-act=v]', (e, b) => carModal(app, db.get('vehicles', b.dataset.id)));
  }

  const ROLES = { admin: 'Galeri sahibi', satis: 'Satış danışmanı' };
  NS.shell({
    id: 'galeri', integrations: ['sms', 'whatsapp', 'efatura', 'webhook', 'backup'], name: 'Oto Galeri', tagline: 'Araç alım-satım yönetimi', icon: 'car', accent: '#be123c', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Galeri' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['satis'] }, { id: 'araclar', label: 'Araçlar', icon: 'car', roles: ['satis'] }, { id: 'talepler', label: 'Müşteri Talepleri', icon: 'users', badge: true, roles: ['satis'] }, { sec: 'Yönetim' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    badges: () => ({ talepler: db.all('leads', (l) => l.status === 'yeni').length }),
    topActions: () => `<a class="btn sm" target="_blank" href="vitrin.html">${icon('globe')} Vitrin</a>`,
    routes: { ozet: dashboard, araclar: stockPage, talepler: leadsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Kurallar' }, { name: 'staleDays', label: 'Uzun bekleme uyarısı (gün)', type: 'number' }, { name: 'kaskoRate', label: 'Aylık sermaye maliyeti % (finansman/kasko)', type: 'number', step: '0.1' }] }) },
  });
})();
