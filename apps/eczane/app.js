/* NEBSOFT Eczane — reçeteli/elden satış, katkı payı, parti/SKT stok, muadil, kronik hasta, depo siparişi, nöbet */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, num, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, rand, pick, addDays, iso, today, daysBetween } = NS;
  const { r2, calc, sameDrug, parseCode, gtinMatch, takeLots, tcOk } = ECZ;
  const RX = { yok: 'Reçetesiz (OTC)', normal: 'Normal reçete', kirmizi: 'Kırmızı reçete', yesil: 'Yeşil reçete', mor: 'Mor reçete', turuncu: 'Turuncu reçete' };
  const CTRL = ['kirmizi', 'yesil']; // Kontrole tabi: defter kaydı ve eczacı onayı
  const INST = { sgk: 'SGK', ozel: 'Özel sigorta', ucretli: 'Ücretli (kendisi)' };
  const KV = { col: 'patients', link: 'patient', phoneCols: ['rxOrders'] };

  function seed(db) {
    db.data._settings = { bizName: 'Şifa Eczanesi', bizPhone: '0216 345 67 89', bizAddress: 'Kadıköy, Söğütlüçeşme Cad. No:12', pharmacist: 'Ecz. Selin Aydın', gln: '8680000123456', patientPct: 20, retiredPct: 10, rxFee: 3.76, rxFeeExtra: 1.25, privatePct: 10, sktWarnDays: 90 };
    db.data.users = [{ id: 'u1', name: 'Ecz. Selin Aydın', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Kalfa Murat', role: 'kalfa', pin: '1234', active: true }];
    // Kurgusal marka adları; etken maddeler gerçek
    const D = [
      ['Paranol 500 mg 20 tablet', 'Parasetamol', 'Tablet', 'yok', true, 48, 'İlaç'], ['Termofen 500 mg 20 tablet', 'Parasetamol', 'Tablet', 'yok', true, 42, 'İlaç'], ['Ibufen 400 mg 20 tablet', 'İbuprofen', 'Tablet', 'yok', true, 62, 'İlaç'],
      ['Amoksilin 1000 mg 14 tablet', 'Amoksisilin + Klavulanik asit', 'Tablet', 'normal', true, 185, 'İlaç'], ['Klavomed 1000 mg 14 tablet', 'Amoksisilin + Klavulanik asit', 'Tablet', 'normal', true, 162, 'İlaç'],
      ['Metfor 1000 mg 100 tablet', 'Metformin', 'Tablet', 'normal', true, 138, 'İlaç'], ['Glukomet 850 mg 100 tablet', 'Metformin', 'Tablet', 'normal', true, 112, 'İlaç'],
      ['Tansinorm 5 mg 30 tablet', 'Amlodipin', 'Tablet', 'normal', true, 96, 'İlaç'], ['Amlovas 10 mg 30 tablet', 'Amlodipin', 'Tablet', 'normal', true, 118, 'İlaç'],
      ['Kolestat 20 mg 28 tablet', 'Atorvastatin', 'Tablet', 'normal', true, 214, 'İlaç'], ['Atorlip 40 mg 28 tablet', 'Atorvastatin', 'Tablet', 'normal', true, 268, 'İlaç'],
      ['Levotir 100 mcg 50 tablet', 'Levotiroksin', 'Tablet', 'normal', true, 74, 'İlaç'], ['Pantomid 40 mg 28 tablet', 'Pantoprazol', 'Tablet', 'normal', true, 156, 'İlaç'], ['Gastroprol 40 mg 28 tablet', 'Pantoprazol', 'Tablet', 'normal', true, 142, 'İlaç'],
      ['Sertrin 50 mg 28 tablet', 'Sertralin', 'Tablet', 'normal', true, 128, 'İlaç'], ['Alprax 0,5 mg 50 tablet', 'Alprazolam', 'Tablet', 'yesil', true, 98, 'İlaç'], ['Tramadin 50 mg 20 kapsül', 'Tramadol', 'Kapsül', 'kirmizi', true, 145, 'İlaç'],
      ['Desloran 5 mg 20 tablet', 'Desloratadin', 'Tablet', 'normal', true, 88, 'İlaç'], ['Öksürük şurubu 150 ml', 'Dekstrometorfan', 'Şurup', 'yok', false, 165, 'İlaç'], ['Burun spreyi 15 ml', 'Ksilometazolin', 'Sprey', 'yok', false, 92, 'İlaç'],
      ['İnsülin kalem 3 ml x5', 'İnsülin glarjin', 'Enjeksiyon', 'normal', true, 1450, 'İlaç'], ['Ventolin inhaler 200 doz', 'Salbutamol', 'İnhaler', 'normal', true, 134, 'İlaç'],
      ['C vitamini 1000 mg 30 efervesan', 'Askorbik asit', 'Efervesan', 'yok', false, 210, 'Vitamin'], ['D3 vitamini damla 50 ml', 'Kolekalsiferol', 'Damla', 'yok', false, 245, 'Vitamin'], ['Omega-3 60 kapsül', 'Balık yağı', 'Kapsül', 'yok', false, 520, 'Vitamin'], ['Magnezyum 30 tablet', 'Magnezyum sitrat', 'Tablet', 'yok', false, 290, 'Vitamin'],
      ['Güneş kremi SPF50 50 ml', '-', 'Krem', 'yok', false, 680, 'Dermokozmetik'], ['Nemlendirici krem 200 ml', '-', 'Krem', 'yok', false, 540, 'Dermokozmetik'], ['Bebek pişik kremi 100 g', 'Çinko oksit', 'Krem', 'yok', false, 185, 'Dermokozmetik'],
      ['Tansiyon aleti (koldan)', '-', 'Cihaz', 'yok', false, 1650, 'Medikal'], ['Şeker ölçüm stribi 50 adet', '-', 'Sarf', 'yok', true, 420, 'Medikal'], ['Cerrahi maske 50 adet', '-', 'Sarf', 'yok', false, 95, 'Medikal'],
    ];
    let bc = 8699500000000;
    db.data.drugs = D.map(([name, active, form, rx, sgk, price, cat], i) => ({ id: 'd' + i, name, active, form, rx, sgk, price, diff: sgk && Math.random() < 0.35 ? rand(3, 25) : 0, cat, barcode: String(bc + i * 13 + 7), min: cat === 'İlaç' ? rand(4, 10) : 3 }));
    const lots = [];
    db.data.drugs.forEach((d) => { for (let k = 0; k < rand(1, 3); k++) lots.push({ id: NS.uid(), drug: d.id, lot: 'L' + rand(10000, 99999), skt: iso(addDays(new Date(), pick([rand(-20, 30), rand(31, 120), rand(150, 900), rand(150, 900), rand(300, 900)]))), qty: rand(0, 18), cost: r2(d.price * 0.75) }); });
    db.data.lots = lots;
    db.data.patients = NS.NAMES.slice(0, 20).map((n, i) => ({ id: 'h' + i, name: n, tc: String(rand(10000000000, 99999999999)), phone: NS.phone(), retired: i % 4 === 0, chronic: i % 2 ? [pick(['d5', 'd7', 'd9', 'd11', 'd12', 'd20'])] : [], allergy: i % 7 === 0 ? 'Penisilin alerjisi' : '', smsOk: i % 3 === 0 }));
    const sales = []; let no = 7000;
    for (let d = 30; d >= 0; d--) for (let k = 0; k < rand(15, 35); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(9, 21), rand(0, 59)); if (at > new Date()) continue;
      const isRx = Math.random() < 0.55; const pt = isRx ? pick(db.data.patients) : null;
      const pool = db.data.drugs.filter((x) => (isRx ? x.rx !== 'yok' && x.sgk : x.rx === 'yok'));
      const items = Array.from({ length: rand(1, 3) }, () => { const x = pick(pool); return { drug: x.id, name: x.name, qty: 1, price: x.price, diff: x.diff, sgk: x.sgk, rx: x.rx, form: x.form }; });
      const c = calc({ mode: isRx ? 'recete' : 'elden', inst: 'sgk', retired: pt && pt.retired, items }, db.data._settings);
      sales.push({ id: NS.uid(), no: 'S' + ++no, at: at.toISOString(), mode: isRx ? 'recete' : 'elden', inst: isRx ? 'sgk' : null, rxNo: isRx ? Math.random().toString(36).slice(2, 9).toUpperCase() : '', patient: pt ? pt.id : null, items, ...c, pay: pick(['nakit', 'kart', 'kart']), user: pick(['u1', 'u2']) });
      if (pt) pt.lastBuy = at.toISOString();
    }
    db.data.sales = sales; db.data._meta._seq_sales = no;
    db.data.depots = [{ id: 'dp1', name: 'Anadolu Ecza Deposu (örnek)' }, { id: 'dp2', name: 'Marmara Ecza Deposu (örnek)' }];
    db.data.orders = []; db.data.moves = []; db.data.ctrl = []; db.data.rxOrders = [];
    const duty = []; for (let k = -10; k < 40; k += rand(6, 12)) duty.push({ id: NS.uid(), date: iso(addDays(new Date(), k)), note: 'Gece nöbeti 19:00 – 08:30' });
    db.data.duty = duty;
  }
  const db = new NS.DB('eczane', seed);
  const DEF = { patientPct: 20, retiredPct: 10, rxFee: 3.76, rxFeeExtra: 1.25, privatePct: 10, sktWarnDays: 90 };
  const S = () => db.settings(DEF);
  // Eski varsayılan 5 ₺ kaynaksızdı (UYUMSUZ): elle değiştirilmediyse RG 33124 tutarına çekilir; geçmiş satışlar değişmez
  { const s = db.settings({}); if (Number(s.rxFee) === 5 && s.rxFeeExtra === undefined) { db.saveSettings({ rxFee: 3.76, rxFeeExtra: 1.25 }); db.log('Reçete katılımı güncellendi', '5 ₺ → 3,76 ₺ (RG 31.12.2025/33124)'); } }
  const drug = (id) => db.get('drugs', id) || { name: '-', price: 0 };
  const pat = (id) => db.get('patients', id) || { name: '-' };
  const live = (s) => !s.canceled;
  const isKalfa = () => !!(NS.currentUser && NS.currentUser.role === 'kalfa');
  const me = () => (NS.currentUser || {}).name || '';

  // Tek geçişte özetler (binlerce parti/ilaç/satış): aynı görevde bir kez kurulur, stok yazınca dirty()
  let SI = null, EQ = null, LB = null; const dirty = () => { SI = null; EQ = null; LB = null; };
  const later = () => setTimeout(dirty, 0);
  const idx = () => { if (SI) return SI; SI = {}; const t = today(); db.all('lots').forEach((l) => { const x = SI[l.drug] || (SI[l.drug] = { qty: 0, near: null, lots: [] }); x.lots.push(l); if (l.skt >= t && l.qty > 0) { x.qty += l.qty; if (!x.near || l.skt < x.near) x.near = l.skt; } }); later(); return SI; };
  const lotsAll = (id) => (idx()[id] ? idx()[id].lots : []);
  const stock = (id) => (idx()[id] ? idx()[id].qty : 0);
  const nearSkt = (id) => (idx()[id] ? idx()[id].near : null);
  const lastCost = (id) => { const l = lotsAll(id).slice().sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')))[0]; return l ? l.cost : 0; };
  const rxDot = (r) => `<span class="rx rx-${r}" title="${RX[r] || ''}"></span>`;
  // Muadil: aynı etken + form + doz. Etken maddeye göre grup tek geçişte kurulur.
  const equivalents = (d) => { if (!EQ) { EQ = {}; db.all('drugs').forEach((x) => { if (x.active && x.active !== '-') (EQ[x.active] = EQ[x.active] || []).push(x); }); later(); } return (EQ[d.active] || []).filter((x) => sameDrug(d, x)); };
  const lastBuy = () => { if (LB) return LB; LB = {}; db.all('sales', (s) => live(s) && s.patient).forEach((s) => s.items.forEach((i) => { const k = `${s.patient}|${i.drug}`; if (!LB[k] || s.at > LB[k]) LB[k] = s.at; })); later(); return LB; };
  // Kronik ilaç bitişi: son alım + kutu süresi (ilaç kartı, boşsa 30 gün)
  const renew = (pt) => (pt.chronic || []).map((id) => { const d = drug(id); const at = lastBuy()[`${pt.id}|${id}`]; if (!at) return null; const days = Number(d.days) || 30; return { id, name: d.name, at, left: days - daysBetween(at, new Date()) }; }).filter(Boolean);
  const due = (pt) => renew(pt).some((r) => r.left <= 5);
  const smsDue = (pt) => `${S().bizName}: Düzenli kullandığınız ilacınızın yenilenme zamanı yaklaşıyor. Reçeteniz için bizi arayabilirsiniz.`;

  if (NS.docs) [['fis', 'Satış fişi', { paper: '80mm', footer: 'Geçmiş olsun · Mali değeri yoktur' }], ['gunsonu', 'Gün sonu', { paper: '80mm', footer: '' }], ['icmal', 'Kurum reçete icmali', { footer: '' }], ['siparis', 'Depo siparişi', { footer: '' }], ['tutanak', 'İmha / iade tutanağı', { footer: '', signLabels: 'Eczacı|Teslim alan' }], ['defter', 'Kontrole tabi ilaç defteri', { footer: '', signLabels: 'Eczacı|Kontrol' }]].forEach(([k, label, defaults]) => NS.docs.define('eczane', k, { label, defaults: { terms: '', cols: { unit: k === 'fis', disc: false }, ...defaults } }));

  // ---------- Satış ----------
  let sale = newSale();
  // Açık olan resmi bağlantılara sessiz çağrı (kapalıysa null)
  const ig = (k, a, p) => (NS.integ && NS.integ.isOn(k) ? NS.integ.call(k, a, p, { silent: true }) : Promise.resolve(null));
  // Sonuç kaydı: simülasyon "TEST", gerçek referans, başarısız "hata". Simülasyon asla gerçek gibi yazılmaz.
  const st = (x) => (!x ? null : x.simulated ? 'TEST' : x.ok ? x.ref : 'hata');
  function newSale() { return { mode: 'elden', inst: 'sgk', patient: null, rxNo: '', doctor: '', items: [] }; }
  function salePage(el, p, app) {
    const draw = () => {
      const pt = sale.patient ? pat(sale.patient) : null;
      const c = calc({ ...sale, retired: pt && pt.retired }, S());
      const needsRx = sale.items.filter((i) => i.rx !== 'yok'); const ctrl = sale.items.some((i) => CTRL.includes(i.rx));
      el.innerHTML = `<div class="sale"><div class="col">
          <div class="search">${icon('barcode')}<input class="input lg" id="sc" placeholder="Karekod / barkod okutun veya ilaç, etken madde yazın" autocomplete="off"></div>
          <div class="card" id="res"></div>
          ${sale.items.length ? `<div class="card"><div class="card-h"><h3>${icon('layers')} Muadil öneriler</h3><span class="small muted">Aynı etken madde, form ve doz. Değişimi eczacı onaylar.</span></div><div class="card-b">${sale.items.map((i) => { const eq = equivalents(drug(i.drug)).filter((x) => stock(x.id) > 0 && x.rx === i.rx); return eq.length ? `<div class="list-item small"><span class="grow"><b>${esc(i.name)}</b> → ${eq.map((x) => `<button class="btn sm" data-swap="${i.drug}|${x.id}">${esc(x.name.split(' ')[0])} ${money(x.price)}${x.price < i.price ? ` <span style="color:var(--ok)">(-${money(i.price - x.price)})</span>` : ''}</button>`).join(' ')}</span></div>` : ''; }).join('') || '<div class="faint small">Sepetteki ilaçların stokta muadili yok</div>'}</div></div>` : ''}
        </div>
        <div class="card"><div class="mode"><button class="btn ${sale.mode === 'elden' ? 'on' : ''}" data-mode="elden">${icon('bag')} Elden satış</button><button class="btn ${sale.mode === 'recete' ? 'on' : ''}" data-mode="recete">${icon('file')} Reçeteli</button></div>
          ${sale.mode === 'recete' ? `<div class="card-b col" style="border-bottom:1px solid var(--border)"><div class="row nw"><div class="grow" style="position:relative"><input class="input" id="pq" placeholder="Hasta ara: ad, TC, telefon" autocomplete="off" value="${esc(pt ? pt.name : '')}"><div id="pl" class="card" style="position:absolute;z-index:5;left:0;right:0;display:none"></div></div><button class="btn icon" id="ptn" aria-label="Yeni hasta">${icon('plus')}</button></div>
            ${pt && pt.allergy ? `<div>${badge(pt.allergy, 'err')}</div>` : ''}${pt && pt.retired ? `<div>${badge('Emekli — katılım %' + S().retiredPct, 'info')}</div>` : ''}${sale.rxVerified ? `<div>${badge('MEDULA: reçete doğrulandı ' + sale.rxVerified, 'ok')}</div>` : ''}
            <div class="row nw"><input class="input" id="rxno" placeholder="E-reçete no" value="${esc(sale.rxNo)}"><button class="btn icon" id="rxq" title="MEDULA reçete sorgu" aria-label="MEDULA reçete sorgu">${icon('search')}</button><select class="input" id="inst">${Object.entries(INST).map(([k, v]) => `<option value="${k}" ${k === sale.inst ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            ${ctrl ? `<input class="input" id="doc" placeholder="Hekim adı (kontrole tabi ilaç defteri için)" value="${esc(sale.doctor)}">` : ''}</div>` : ''}
          <div>${sale.items.length ? sale.items.map((i, k) => { const d = drug(i.drug); return `<div class="line"><b>${rxDot(i.rx)} ${esc(i.name)}</b><b>${money(i.price * i.qty)}</b><div class="meta"><button class="btn sm icon" data-q="${k}|-1" aria-label="Azalt">${icon('minus')}</button><b>${i.qty}</b><button class="btn sm icon" data-q="${k}|1" aria-label="Artır">${icon('plus')}</button>${i.sgk ? badge('SGK', 'info') : ''}${i.diff && sale.mode === 'recete' && sale.inst === 'sgk' ? badge('Fark ' + money(i.diff), 'warn') : ''}${sale.mode === 'recete' && sale.inst === 'sgk' && i.sgk ? `<button class="btn sm ${i.exempt ? 'primary' : ''}" data-ex="${k}" title="Raporlu, EK-4/D listesinde: katılım payı alınmaz">Muaf</button>` : ''}<span class="grow"></span><span class="faint">stok ${stock(d.id)}</span><button class="btn sm ghost icon" data-x="${k}" aria-label="Kaldır">${icon('x')}</button></div></div>`; }).join('') : `<div class="empty">${icon('pill')}<div>Karekod okutarak başlayın</div></div>`}</div>
          ${sale.mode === 'elden' && needsRx.length ? `<div class="card-b small" style="background:var(--err-soft);color:var(--err)">${icon('alert')} ${needsRx.length} reçeteli ilaç var — elden satılamaz, reçeteli moda geçin.</div>` : ''}
          <div class="pay-split"><div class="row between small"><span>İlaç bedeli</span><span>${money(c.total - c.rxFee - c.diffPay)}</span></div>${c.diffPay ? `<div class="row between small"><span>Eşdeğer fark</span><span>${money(c.diffPay)}</span></div>` : ''}${c.rxFee ? `<div class="row between small"><span>Reçete katılım payı</span><span>${money(c.rxFee)}</span></div>` : ''}${c.instPay ? `<div class="row between small" style="color:var(--info)"><span>${INST[sale.inst]} öder</span><span>${money(c.instPay)}</span></div>` : ''}
            <div class="row between mt"><span class="muted">HASTA ÖDER</span><b style="font-size:30px">${money(c.patientPay)}</b></div>
            <div class="row mt"><button class="btn ok lg grow" data-pay="nakit" ${sale.items.length ? '' : 'disabled'}>${icon('cash')} Nakit</button><button class="btn primary lg grow" data-pay="kart" ${sale.items.length ? '' : 'disabled'}>${icon('card')} Kart</button></div>
            <button class="btn ghost block mt" id="clr">${icon('trash')} Temizle</button></div></div></div>`;
      const sc = $('#sc', el); if (window.innerWidth > 1000) sc.focus();
      const results = (q) => { const r = q ? db.all('drugs', (d) => NS.match(q, d.name, d.active, d.barcode)).slice(0, 8) : []; $('#res', el).innerHTML = r.length ? table({ rows: r, columns: [{ label: 'İlaç', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b><div class="small faint">${esc(d.active)} · ${esc(d.form)}</div>` }, { label: 'Fiyat', cls: 'right', render: (d) => money(d.price) }, { label: 'Stok / SKT', cls: 'right', render: (d) => `${stock(d.id) ? stock(d.id) : badge('Yok', 'err')}<div class="small faint">${nearSkt(d.id) ? NS.date(nearSkt(d.id)) : ''}</div>` }], actions: [{ icon: 'plus', act: 'add', title: 'Sepete ekle' }] }) : `<div class="card-b small muted">${q ? 'Sonuç bulunamadı.' : 'İlaç adı, etken madde (ör. "metformin"), barkod veya karekod ile arayın.'}${db.all('drugs').length ? '' : ' Önce İlaç Kartları ekranından ürün ekleyin.'}</div>`; };
      sc.oninput = () => results(sc.value);
      sc.onkeydown = (e) => {
        if (e.key !== 'Enter') return; const v = sc.value.trim(); const code = parseCode(v);
        if (code) { const d = db.find('drugs', (x) => gtinMatch(x.barcode, code.gtin)); if (!d) { NS.beep(220, 250); return toast('Bu karekod ilaç kartlarında yok: ' + code.gtin, 'err'); } return add(d, code); }
        const d = db.find('drugs', (x) => x.barcode === v) || (() => { const m = db.all('drugs', (x) => NS.match(v, x.name, x.active)); return m.length === 1 ? m[0] : null; })(); if (d) add(d); else results(v);
      };
      results('');
      if ($('#pq', el)) {
        const ql = $('#pl', el); $('#pq', el).oninput = (e) => { const q = e.target.value.trim(); const r = q ? db.all('patients', (x) => !x.anonAt && NS.match(q, x.name, x.tc, x.phone)).slice(0, 8) : []; ql.style.display = r.length ? '' : 'none'; ql.innerHTML = r.map((x) => `<button class="btn ghost block" style="justify-content:flex-start" data-pt="${x.id}">${esc(x.name)} <span class="faint small">${esc(String(x.tc || '').slice(0, 3))}*****${esc(String(x.tc || '').slice(-3))}</span></button>`).join(''); };
        $('#rxno', el).oninput = (e) => { sale.rxNo = e.target.value; sale.rxVerified = null; }; if ($('#doc', el)) $('#doc', el).oninput = (e) => { sale.doctor = e.target.value; };
        $('#rxq', el).onclick = async () => { if (!sale.rxNo) return toast('E-reçete numarası girin', 'err'); const r = await NS.integ.call('medula', 'recete-sorgu', { rxNo: sale.rxNo, tc: sale.patient ? pat(sale.patient).tc : '' }); if (r && r.simulated) { toast('MEDULA TEST — reçete sorgulanmadı (simülasyon); provizyonu MEDULA’dan kontrol edin', 'warn'); } else if (r && r.ok) { sale.rxVerified = r.ref; draw(); } };
        $('#inst', el).onchange = (e) => { sale.inst = e.target.value; draw(); };
        $('#ptn', el).onclick = async () => { const v = await formModal({ title: 'Yeni hasta', fields: PF }); if (!v) return; const bad = checkPt(v); if (bad) return toast(bad, 'err'); const n = db.insert('patients', { ...v, chronic: [] }); sale.patient = n.id; draw(); };
      }
      $('#clr', el).onclick = () => { sale = newSale(); draw(); };
    };
    const inCart = (id) => sum(sale.items.filter((i) => i.drug === id), (i) => i.qty);
    const add = (d, code) => {
      if (code && code.exp && code.exp < today()) { NS.beep(220, 250); return toast(`${d.name}: bu kutunun son kullanma tarihi geçmiş (${NS.date(code.exp)})`, 'err'); }
      if (code && code.sn && sale.items.some((i) => (i.serials || []).includes(code.sn))) { NS.beep(220, 250); return toast('Bu kutu zaten okutuldu', 'err'); }
      if (stock(d.id) <= inCart(d.id)) { NS.beep(220, 250); return toast(`${d.name} stokta yok`, 'err'); }
      if (d.rx !== 'yok' && sale.mode === 'elden') toast(`${RX[d.rx]} gerektirir`, '');
      if (CTRL.includes(d.rx)) toast(`Dikkat: ${RX[d.rx]} — hasta kimliği ve reçete aslı kontrol edilmeli`, 'err');
      let ex = sale.items.find((i) => i.drug === d.id); if (ex) ex.qty++; else { ex = { drug: d.id, name: d.name, qty: 1, price: d.price, diff: d.diff, sgk: d.sgk, rx: d.rx, form: d.form, serials: [] }; sale.items.push(ex); }
      if (code) { if (code.sn) (ex.serials = ex.serials || []).push(code.sn); if (code.lot) ex.lot = code.lot; }
      NS.beep(1200, 50); draw();
    };
    on(el, 'click', '[data-pt]', (e, b) => { sale.patient = b.dataset.pt; draw(); });
    on(el, 'click', '[data-act=add]', (e, b) => add(drug(b.dataset.id)));
    on(el, 'click', '[data-mode]', (e, b) => { sale.mode = b.dataset.mode; draw(); });
    on(el, 'click', '[data-ex]', (e, b) => { const i = sale.items[Number(b.dataset.ex)]; i.exempt = !i.exempt; draw(); });
    on(el, 'click', '[data-q]', (e, b) => { const [k, d] = b.dataset.q.split('|').map(Number); const i = sale.items[k]; if (d > 0 && stock(i.drug) <= inCart(i.drug)) return toast(`${i.name} için stok yetersiz`, 'err'); i.qty += d; if (i.qty <= 0) sale.items.splice(k, 1); draw(); });
    on(el, 'click', '[data-x]', (e, b) => { sale.items.splice(Number(b.dataset.x), 1); draw(); });
    on(el, 'click', '[data-swap]', async (e, b) => { const [from, to] = b.dataset.swap.split('|'); const i = sale.items.find((x) => x.drug === from); const d = drug(to); if (stock(to) < i.qty) return toast(`${d.name} için stok yetersiz`, 'err'); if (sale.mode === 'recete' && !(await NS.approve(NS.app, 'Muadil değişimi', ['admin']))) return; Object.assign(i, { drug: d.id, name: d.name, price: d.price, diff: d.diff, sgk: d.sgk, rx: d.rx, form: d.form, serials: [], lot: '' }); toast('Muadil ile değiştirildi', 'ok'); draw(); });
    on(el, 'click', '[data-pay]', async (e, b) => {
      if (sale.mode === 'elden' && sale.items.some((i) => i.rx !== 'yok')) return toast('Reçeteli ilaçlar elden satılamaz', 'err');
      if (sale.mode === 'recete' && (!sale.patient || !sale.rxNo)) return toast('Hasta ve e-reçete numarası girin', 'err');
      const short = sale.items.find((i) => stock(i.drug) < i.qty); if (short) return toast(`${short.name} için stok yetersiz (${stock(short.drug)})`, 'err');
      const ctrl = sale.items.filter((i) => CTRL.includes(i.rx));
      if (ctrl.length && !sale.doctor.trim()) return toast('Kontrole tabi ilaçta hekim adı girin', 'err');
      const pt = sale.patient ? pat(sale.patient) : null;
      if (sale.mode === 'recete' && db.find('sales', (s) => live(s) && s.rxNo === sale.rxNo.trim() && s.patient === sale.patient) && !(await confirm('Bu reçete numarasıyla bu hastaya satış yapılmış. Yine de devam edilsin mi?', { ok: 'Devam', danger: false }))) return;
      if (pt && pt.allergy && !(await confirm(`Hasta alerji kaydı: ${pt.allergy}. İlaçları kontrol ettiniz mi?`, { ok: 'Kontrol ettim', danger: false }))) return;
      let okBy = null; if (ctrl.length) { okBy = await NS.approve(NS.app, 'Kontrole tabi ilaç satışı', ['admin']); if (!okBy) return; }
      const c = calc({ ...sale, retired: pt && pt.retired }, S());
      if (b.dataset.pay === 'kart' && c.patientPay > 0 && NS.integ) { const r = await NS.integ.cardPayment(c.patientPay); if (!r.ok) return toast('Kart ödemesi alınamadı: ' + (r.error || ''), 'err'); }
      // Stok düşümü: okutulan parti, sonra son kullanma tarihi en yakın parti (FEFO). Hangi partiden düştüğü saklanır (iade için).
      sale.items.forEach((i) => { const r = takeLots(lotsAll(i.drug), i.qty, today(), i.lot); r.taken.forEach((t) => { db.get('lots', t.id).qty -= t.qty; }); i.taken = r.taken; }); dirty();
      const s = db.insert('sales', { no: db.nextNo('sales', 'S'), at: new Date().toISOString(), mode: sale.mode, inst: sale.mode === 'recete' ? sale.inst : null, rxNo: sale.rxNo.trim(), doctor: sale.doctor.trim(), patient: sale.patient, items: sale.items.map((i) => ({ ...i })), ...c, pay: b.dataset.pay, user: (NS.currentUser || {}).id });
      ctrl.forEach((i) => db.insert('ctrl', { at: s.at, saleNo: s.no, drug: i.drug, name: i.name, rx: i.rx, qty: i.qty, patient: s.patient, rxNo: s.rxNo, doctor: s.doctor, by: okBy.name || me(), seller: me() }, true));
      if (pt) { pt.lastBuy = s.at; } db.save();
      // Resmi bildirimler: MEDULA provizyon (reçeteli), İTS satış bildirimi (karekodlu), ÖKC mali fiş
      const items = s.items.map((i) => ({ barcode: drug(i.drug).barcode, name: i.name, qty: i.qty, price: i.price, serials: i.serials || [] }));
      Promise.all([s.mode === 'recete' ? ig('medula', 'provizyon', { rxNo: s.rxNo, tc: pt ? pt.tc : '', inst: s.inst, items, instPay: s.instPay, patientPay: s.patientPay }) : null, ig('its', 'satis-bildirim', { no: s.no, tc: pt ? pt.tc : '', items }), ig('okc', 'mali-fis', { no: s.no, total: s.patientPay, pay: s.pay, items })]).then(([m, i, o]) => { // Simülasyon sonucu "TEST" yazılır (gerçek bildirim sanılmasın); doğrulanmamış bağlayıcı "hata" (gönderilmedi)
        s.medula = st(m); s.its = st(i); s.okc = o && o.ok && !o.simulated ? o.ref : o && o.simulated ? 'TEST' : null; db.save(); if ((m && !m.ok) || (i && !i.ok)) toast('Bazı resmi bildirimler gönderilemedi — Satışlar ekranından tekrar deneyin', 'err'); });
      printReceipt(s); toast(`Satış tamamlandı · hasta ${money(c.patientPay)}`, 'ok');
      sale = newSale(); app.refresh();
    });
    draw();
  }
  function printReceipt(s) {
    const t = S();
    if (NS.integ && NS.integ.isOn && NS.integ.isOn('printer')) return NS.integ.printReceipt(`<div class="c"><div class="big">${esc(t.bizName)}</div><div>${esc(t.bizAddress)}</div><div>${esc(t.pharmacist)}</div></div><hr><div class="r"><span>${NS.dt(s.at)}</span><span>${esc(s.no)}</span></div>${s.mode === 'recete' ? `<div>Reçete: ${esc(s.rxNo)} · ${INST[s.inst]}</div><div>Hasta: ${esc(pat(s.patient).name)}</div>` : ''}<hr>${s.items.map((i) => `<div>${esc(i.name)}</div><div class="r"><span>${i.qty} x ${money(i.price)}</span><span>${money(i.qty * i.price)}</span></div>`).join('')}<hr>${s.diffPay ? `<div class="r"><span>Eşdeğer fark</span><span>${money(s.diffPay)}</span></div>` : ''}${s.rxFee ? `<div class="r"><span>Reçete katılım</span><span>${money(s.rxFee)}</span></div>` : ''}${s.instPay ? `<div class="r"><span>Kurum payı</span><span>${money(s.instPay)}</span></div>` : ''}<div class="r big"><span>ÖDENEN</span><span>${money(s.patientPay)}</span></div><hr><div class="c">Geçmiş olsun · Mali değeri yoktur</div>`, { title: s.no });
    NS.docs.print('fis', { title: 'Satış fişi', no: s.no, date: s.at, party: s.mode === 'recete' ? { title: INST[s.inst] || 'Reçete', name: pat(s.patient).name, lines: [`Reçete ${s.rxNo}`] } : null, lines: s.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, total: r2(i.qty * i.price) })), totals: [...(s.diffPay ? [['Eşdeğer fark', s.diffPay]] : []), ...(s.rxFee ? [['Reçete katılım', s.rxFee]] : []), ...(s.instPay ? [['Kurum payı', s.instPay]] : []), ['Ödenen', s.patientPay, true]] });
  }

  // ---------- İlaçlar / stok / SKT ----------
  const DF = [{ name: 'name', label: 'Ürün adı', required: true, full: true }, { name: 'barcode', label: 'Barkod (GTIN)' }, { name: 'active', label: 'Etken madde' }, { name: 'strength', label: 'Doz', placeholder: 'Boşsa addan okunur, ör. 20 mg' }, { name: 'form', label: 'Form', type: 'select', options: ['Tablet', 'Kapsül', 'Şurup', 'Krem', 'Damla', 'Sprey', 'Enjeksiyon', 'İnhaler', 'Efervesan', 'Cihaz', 'Sarf'] }, { name: 'cat', label: 'Kategori', type: 'select', options: ['İlaç', 'Vitamin', 'Dermokozmetik', 'Medikal'] }, { name: 'rx', label: 'Reçete türü', type: 'select', options: Object.entries(RX).map(([value, label]) => ({ value, label })) }, { name: 'price', label: 'Perakende satış fiyatı (₺)', type: 'number', step: '0.01', required: true }, { name: 'diff', label: 'Eşdeğer fark ücreti (₺)', type: 'number', step: '0.01' }, { name: 'min', label: 'Kritik stok', type: 'number' }, { name: 'days', label: 'Bir kutu kaç gün yeter (kronik)', type: 'number', placeholder: '30' }, { name: 'sgk', label: 'SGK ödemeli', type: 'checkbox' }];
  const nrm = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
  const numOf = (v) => { if (typeof v === 'number') return v; const t = String(v == null ? '' : v).trim(); return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t) || 0; };
  // İlaç listesi aktarımı: barkoda göre eşleşen güncellenir (fiyat değişimi dahil), önce özet gösterilir; reçete türü dosyada yoksa ilaç reçeteli sayılır (elden satılamaz)
  async function importDrugs(app) {
    let f; try { f = await NS.readSheet(); } catch (e) { return toast(e.message, 'err'); } if (!f) return; if (!f.rows.length) return toast('Dosyada satır yok', 'err');
    const C = { name: ['ad', 'ürün', 'ürünadı', 'ilaç', 'ilaçadı'], barcode: ['barkod', 'gtin'], active: ['etken', 'etkenmadde'], form: ['form'], price: ['fiyat', 'psf', 'perakende', 'satışfiyatı'], diff: ['fark', 'eşdeğerfark'], rx: ['reçete', 'reçetetürü'], sgk: ['sgk'], cat: ['kategori'] };
    const keys = Object.keys(f.rows[0]); const col = {}; Object.entries(C).forEach(([k, al]) => { const h = keys.find((x) => al.includes(nrm(x))); if (h) col[k] = h; }); const miss = ['name', 'price'].filter((k) => !col[k]); if (miss.length) return toast(`Gerekli sütun bulunamadı: ${miss.map((k) => C[k][0]).join(', ')}`, 'err');
    const by = new Map(db.all('drugs').filter((d) => d.barcode).map((d) => [String(d.barcode), d])); const rxOf = (t) => { const k = nrm(t); return Object.keys(RX).find((x) => x === k || nrm(RX[x]).startsWith(k)) || ''; };
    const errs = []; const plan = []; f.rows.forEach((r, i) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : ''); const name = g('name'); const price = numOf(col.price ? r[col.price] : 0); if (!name) return errs.push(`Satır ${i + 2}: ad boş`); if (!(price > 0)) return errs.push(`Satır ${i + 2}: fiyat geçersiz`); const v = { name, price }; [['barcode'], ['active'], ['form'], ['cat']].forEach(([k]) => { if (g(k)) v[k] = g(k); }); if (g('diff')) v.diff = numOf(g('diff')); if (g('rx') && rxOf(g('rx'))) v.rx = rxOf(g('rx')); if (g('sgk')) v.sgk = /^(1|e|evet|var|true)/i.test(g('sgk')); plan.push({ ex: v.barcode ? by.get(v.barcode) : null, v }); });
    const upd = plan.filter((x) => x.ex).length; if (!(await confirm(`${plan.length - upd} yeni, ${upd} güncelleme${errs.length ? `, ${errs.length} hatalı satır atlanacak (ilki: ${errs[0]})` : ''}. Aktarılsın mı?`, { ok: 'Aktar', danger: false }))) return; if (isKalfa() && upd && !(await NS.approve(NS.app, 'Toplu fiyat güncelleme', ['admin']))) return;
    plan.forEach((x) => { if (x.ex) Object.assign(x.ex, x.v); else db.data.drugs.push({ id: NS.uid(), created: new Date().toISOString(), rx: 'normal', cat: 'İlaç', form: 'Tablet', min: 3, active: '-', ...x.v }); }); dirty(); db.log('Excel aktarımı', `İlaç: ${plan.length} kayıt`); db.save(); toast(`${plan.length} kayıt aktarıldı`, 'ok'); app.refresh();
  }
  function drugsPage(el, p, app) {
    NS.crud(el, app, {
      col: 'drugs', title: 'İlaç & Ürün Kartları', sub: 'Reçete türü, SGK durumu, fiyat ve stok', single: 'Ürün', addLabel: 'Yeni ürün', emptyIcon: 'pill', fields: DF, defaults: { rx: 'yok', cat: 'İlaç', min: 5, form: 'Tablet' },
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (d) => [d.name, d.active, d.barcode],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'rx', label: 'Reçeteli', test: (d) => d.rx !== 'yok' }, { value: 'low', label: 'Kritik stok', test: (d) => stock(d.id) <= d.min }, { value: 'otc', label: 'Reçetesiz', test: (d) => d.rx === 'yok' }],
      beforeSave: async (v, rec) => { if (v.barcode && db.find('drugs', (d) => String(d.barcode) === String(v.barcode) && (!rec || d.id !== rec.id))) return 'Bu barkod başka bir üründe kayıtlı'; if (rec && isKalfa() && Number(v.price) !== Number(rec.price) && !(await NS.approve(NS.app, 'Fiyat değişikliği', ['admin']))) return false; dirty(); },
      canDelete: (d) => (lotsAll(d.id).length ? 'Bu ürünün parti kaydı var; silinemez.' : db.find('sales', (s) => s.items.some((i) => i.drug === d.id)) ? 'Bu ürünün satışı var; silinemez.' : true),
      columns: [{ key: 'name', label: 'Ürün', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b><div class="small faint">${esc(d.active)} · ${esc(d.form)} · ${esc(d.barcode || '')}</div>` }, { key: 'cat', label: 'Kategori', render: (d) => `${esc(d.cat)}${d.sgk ? ' ' + badge('SGK', 'info') : ''}` }, { key: 'price', label: 'PSF', cls: 'right', render: (d) => money(d.price) }, { label: 'Stok', cls: 'right', render: (d) => (stock(d.id) <= d.min ? badge(stock(d.id), 'err') : stock(d.id)) }, { label: 'En yakın SKT', render: (d) => { const s = nearSkt(d.id); return s ? (daysBetween(new Date(), s) <= S().sktWarnDays ? badge(NS.date(s), 'warn') : NS.date(s)) : '-'; } }, { label: 'Muadil', cls: 'right', render: (d) => equivalents(d).length || '-' }],
      extraActions: [{ icon: 'layers', act: 'lots', title: 'Partiler' }],
      onAction: (a, d) => { const mm = modal({ title: `${d.name} — partiler`, size: 'wide', body: table({ rows: lotsAll(d.id).slice().sort((x, y) => x.skt.localeCompare(y.skt)), empty: 'Parti yok', columns: [{ label: 'Parti', key: 'lot' }, { label: 'SKT', render: (l) => (l.skt < today() ? badge('Geçti ' + NS.date(l.skt), 'err') : NS.date(l.skt)) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Maliyet', cls: 'right', render: (l) => money(l.cost) }], actions: [{ label: 'Sayım', act: 'cnt' }] }) + (equivalents(d).length ? `<h3 class="mt mb">Muadiller</h3>${equivalents(d).map((x) => `<div class="list-item small"><span class="grow">${esc(x.name)}</span><b>${money(x.price)}</b><span class="faint">stok ${stock(x.id)}</span></div>`).join('')}` : ''), onOpen: (b) => on(b, 'click', '[data-act=cnt]', async (e, t) => { const l = db.get('lots', t.dataset.id); const v = await formModal({ title: `Sayım — ${l.lot}`, fields: [{ name: 'qty', label: 'Sayılan adet', type: 'number', required: true, value: l.qty }, { name: 'note', label: 'Fark nedeni' }] }); if (!v) return; const q = Math.max(0, Math.round(Number(v.qty) || 0)); if (q === l.qty) return; if (!(await NS.approve(NS.app, 'Stok sayım düzeltmesi', ['admin']))) return; db.insert('moves', { at: new Date().toISOString(), type: 'sayim', drug: l.drug, lot: l.lot, qty: q - l.qty, cost: l.cost, by: me(), note: v.note }, true); l.qty = q; dirty(); db.log('Sayım düzeltmesi', `${drug(l.drug).name} · ${l.lot}`); db.save(); toast('Sayım kaydedildi', 'ok'); mm.close(); app.refresh(); }) }); },
    });
    const x = $('[data-export]', el); if (x) { x.insertAdjacentHTML('beforebegin', `<button class="btn" id="imp">${icon('upload')} Excel'den al</button>`); $('#imp', el).onclick = () => importDrugs(app); }
  }
  const MV = { 'depo-iade': 'Depoya iade', imha: 'İmha', sayim: 'Sayım düzeltmesi', 'satis-iade': 'Satış iadesi' };
  function sktPage(el, p, app) {
    const warn = S().sktWarnDays; const t = today();
    const lots = db.all('lots', (l) => l.qty > 0 && daysBetween(new Date(), l.skt) <= warn).sort((a, b) => a.skt.localeCompare(b.skt));
    const moves = db.all('moves').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
    el.innerHTML = pageHead('Stok & SKT Takibi', `Son kullanma tarihi ${warn} gün içinde dolacak veya geçmiş partiler`, `<button class="btn primary" id="in">${icon('plus')} Mal kabul (parti girişi)</button>`) + `
      <div class="grid g4 mb">${kpi('SKT geçmiş', lots.filter((l) => l.skt < t).length + ' parti', 'alert', 'err', `<div class="small faint">${money(sum(lots.filter((l) => l.skt < t), (l) => l.qty * l.cost))} maliyet</div>`)}${kpi('30 gün içinde', lots.filter((l) => l.skt >= t && daysBetween(new Date(), l.skt) <= 30).length + ' parti', 'clock', 'warn')}${kpi(`${warn} gün içinde`, lots.filter((l) => l.skt >= t).length + ' parti', 'calendar', 'info')}${kpi('Toplam stok değeri', money(sum(db.all('lots', (l) => l.skt >= t), (l) => l.qty * l.cost)), 'wallet', 'ok')}</div>
      <div class="card mb">${table({ rows: lots, empty: 'SKT riski olan parti yok', emptyIcon: 'clock', columns: [{ label: 'Ürün', render: (l) => `${rxDot(drug(l.drug).rx)} <b>${esc(drug(l.drug).name)}</b>` }, { label: 'Parti', key: 'lot' }, { label: 'SKT', render: (l) => (l.skt < t ? badge(`Geçti (${daysBetween(l.skt, new Date())} gün)`, 'err') : badge(`${daysBetween(new Date(), l.skt)} gün kaldı`, daysBetween(new Date(), l.skt) <= 30 ? 'warn' : 'info')) }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Maliyet', cls: 'right', render: (l) => money(l.qty * l.cost) }], actions: [{ label: 'Depoya iade', act: 'ret' }, { label: 'İmha', act: 'dis', show: (l) => l.skt < t }] })}</div>
      <div class="card"><div class="card-h"><h3>Stok hareketleri</h3></div>${table({ rows: moves, empty: 'Hareket yok', emptyIcon: 'layers', columns: [{ label: 'Tarih', render: (m) => NS.dt(m.at) }, { label: 'İşlem', render: (m) => badge(MV[m.type] || m.type, m.type === 'imha' ? 'err' : 'info') }, { label: 'Ürün', render: (m) => `<b>${esc(drug(m.drug).name)}</b><div class="small faint">${esc(m.lot || '')}</div>` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Yapan', render: (m) => `${esc(m.by || '')}<div class="small faint">${esc(m.note || '')}</div>` }], actions: [{ icon: 'print', act: 'tt', title: 'Tutanak', show: (m) => ['imha', 'depo-iade'].includes(m.type) }] })}</div>`;
    const tutanak = (m) => NS.docs.print('tutanak', { title: `${MV[m.type]} tutanağı`, date: m.at, info: [['Ürün', drug(m.drug).name], ['Parti', m.lot], ['Adet', m.qty], ['Maliyet', money(m.qty * (m.cost || 0))], ['Düzenleyen', m.by]], note: m.note || '' });
    on(el, 'click', '[data-act]', async (e, b) => {
      if (b.dataset.act === 'tt') return tutanak(db.get('moves', b.dataset.id));
      const l = db.get('lots', b.dataset.id); const ret = b.dataset.act === 'ret'; const v = await formModal({ title: `${ret ? 'Depoya iade' : 'İmha'} — ${drug(l.drug).name}`, fields: [{ name: 'qty', label: `Adet (en çok ${l.qty})`, type: 'number', required: true, value: l.qty }, { name: 'note', label: ret ? 'Depo / iade belgesi' : 'İmha yöntemi / tutanak no', full: true }] }); if (!v) return;
      const q = Math.min(l.qty, Math.max(0, Math.round(Number(v.qty) || 0))); if (!q) return toast('Adet girin', 'err'); if (!(await NS.approve(NS.app, ret ? 'Depoya iade' : 'İmha', ['admin']))) return;
      const m = db.insert('moves', { at: new Date().toISOString(), type: ret ? 'depo-iade' : 'imha', drug: l.drug, lot: l.lot, qty: q, cost: l.cost, by: me(), note: v.note }, true); l.qty -= q; dirty(); db.log(MV[m.type], `${drug(l.drug).name} · ${q} adet`); db.save(); app.refresh(); tutanak(m);
    });
    $('#in', el).onclick = () => receiveLot(app);
  }
  // Mal kabul: parti ve SKT kutudan okunur ya da elle yazılır; program uydurmaz (eski kod rastgele parti ve SKT üretiyordu)
  async function receiveLot(app, drugId, qty) {
    const v = await formModal({ title: 'Mal kabul', fields: [{ name: 'code', label: 'Karekod (okutun, isteğe bağlı)', full: true }, { name: 'drug', label: 'Ürün', type: 'select', options: db.all('drugs').sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((d) => ({ value: d.id, label: d.name })), value: drugId }, { name: 'lot', label: 'Parti no' }, { name: 'skt', label: 'Son kullanma tarihi', type: 'date' }, { name: 'qty', label: 'Adet', type: 'number', required: true, value: qty || 1 }, { name: 'cost', label: 'Birim maliyet (₺)', type: 'number', step: '0.01', value: drugId ? lastCost(drugId) || '' : '' }] });
    if (!v) return false; const c = parseCode(v.code); if (v.code && !c) return toast('Karekod çözülemedi', 'err'), false;
    if (c) { const d = db.find('drugs', (x) => gtinMatch(x.barcode, c.gtin)); if (!d) return toast('Bu karekod ilaç kartlarında yok: ' + c.gtin, 'err'), false; v.drug = d.id; v.lot = v.lot || c.lot; v.skt = v.skt || c.exp; }
    if (!v.drug) return toast('Ürün seçin', 'err'), false; if (!v.lot || !v.skt) return toast('Parti no ve son kullanma tarihi gerekli', 'err'), false; if (!(Number(v.qty) > 0)) return toast('Adet girin', 'err'), false;
    if (v.skt <= today()) return toast('SKT geçmiş ürün stoğa alınamaz', 'err'), false;
    if (v.skt <= iso(addDays(new Date(), 90)) && !(await confirm('Bu partinin SKT\'si 90 günden yakın. Yine de kabul edilsin mi?', { ok: 'Kabul et', danger: false }))) return false;
    addLot(v.drug, v.lot, v.skt, Number(v.qty), Number(v.cost) || 0); db.save(); toast('Parti stoğa eklendi', 'ok'); app.refresh(); return true;
  }
  const addLot = (id, lot, skt, qty, cost) => { const ex = db.find('lots', (l) => l.drug === id && l.lot === lot && l.skt === skt); if (ex) { ex.qty += qty; if (cost) ex.cost = cost; } else db.insert('lots', { drug: id, lot, skt, qty, cost }, true); dirty(); };
  const ORD = { kayit: ['Kaydedildi · depoya iletilmedi', 'warn'], test: ['TEST — iletilmedi', 'warn'], iletildi: ['Depoya iletildi', 'info'], yolda: ['Yolda', 'warn'], geldi: ['Teslim alındı', 'ok'] };
  function ordersPage(el, p, app) {
    const since = addDays(new Date(), -30).toISOString(); const sold = {};
    db.all('sales', (s) => s.at > since && live(s)).forEach((s) => s.items.forEach((i) => { sold[i.drug] = (sold[i.drug] || 0) + i.qty; }));
    const sug = db.all('drugs').map((d) => ({ ...d, st: stock(d.id), m: sold[d.id] || 0, need: Math.max(0, Math.ceil((sold[d.id] || 0) * 0.5 + (d.min || 0) - stock(d.id))) })).filter((d) => d.need > 0).sort((a, b) => b.need - a.need);
    const deps = db.all('depots');
    el.innerHTML = pageHead('Depo Siparişi', 'Son 30 günlük satış hızı ve kritik stoğa göre sipariş önerisi') + `
      <div class="card mb"><div class="card-h"><h3>Sipariş önerisi (${sug.length})</h3><select class="input" id="dp" style="max-width:220px">${deps.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><button class="btn primary" id="send">${icon('send')} Seçilenleri kaydet</button></div>${table({ rows: sug, empty: 'Sipariş gereken ürün yok', emptyIcon: 'truck', columns: [{ label: '', render: (d) => `<input type="checkbox" data-sel="${d.id}" checked aria-label="Seç">` }, { label: 'Ürün', render: (d) => `${rxDot(d.rx)} <b>${esc(d.name)}</b>` }, { label: 'Stok', cls: 'right', key: 'st' }, { label: '30 gün satış', cls: 'right', key: 'm' }, { label: 'Önerilen', cls: 'right', render: (d) => `<input class="input" type="number" style="width:76px;text-align:right" data-n="${d.id}" value="${d.need}" aria-label="Adet">` }, { label: 'Son maliyetle', cls: 'right', render: (d) => money(d.need * lastCost(d.id)) }] })}</div>
      <div class="card mb"><div class="card-h"><h3>Verilen siparişler</h3></div>${table({ rows: db.all('orders').sort((a, b) => b.at.localeCompare(a.at)), empty: 'Henüz sipariş verilmedi', emptyIcon: 'truck', columns: [{ label: 'Tarih', render: (o) => NS.dt(o.at) }, { label: 'Depo', render: (o) => esc((db.get('depots', o.depot) || {}).name || '-') }, { label: 'Kalem', cls: 'right', render: (o) => o.items.length }, { label: 'Durum', render: (o) => badge(...(ORD[o.status] || ORD.kayit)) }], actions: [{ label: 'Teslim al', act: 'recv', show: (o) => o.status !== 'geldi' }, { icon: 'print', act: 'opr', title: 'Sipariş listesi' }] })}</div><div id="dpx"></div>`;
    $('#send', el).onclick = async () => {
      const items = $$('[data-sel]:checked', el).map((c) => ({ drug: c.dataset.sel, qty: Number($(`[data-n="${c.dataset.sel}"]`, el).value) || 0 })).filter((i) => i.qty > 0); if (!items.length) return toast('Ürün seçin', 'err'); const depot = $('#dp', el).value; if (!depot) return toast('Önce aşağıdan depo ekleyin', 'err');
      const dep = db.get('depots', depot) || {}; const o = db.insert('orders', { at: new Date().toISOString(), depot, items, status: 'kayit' }); if (NS.integ) NS.integ.emit('depo_siparis', { depot: dep.name, items });
      const r = await ig('eczadeposu', 'siparis', { depot: dep.name, items: items.map((i) => ({ barcode: drug(i.drug).barcode, name: drug(i.drug).name, qty: i.qty })) });
      if (!r) toast('Sipariş kaydedildi. Depoya iletilmedi: listeyi yazdırıp iletin.', 'warn'); else if (r.simulated) { o.status = 'test'; toast('Depo TEST — sipariş iletilmedi (simülasyon)', 'warn'); } else if (r.ok) { o.status = 'iletildi'; o.ref = r.ref; toast(`${dep.name} deposuna sipariş iletildi (${r.ref})`, 'ok'); } else toast('Depo siparişi iletilemedi; kayıt duruyor', 'err');
      db.save(); app.refresh();
    };
    on(el, 'click', '[data-act=opr]', (e, b) => { const o = db.get('orders', b.dataset.id); NS.docs.print('siparis', { title: 'Depo siparişi', date: o.at, party: { title: 'Depo', name: (db.get('depots', o.depot) || {}).name || '-', lines: [] }, note: o.items.map((i) => `${i.qty} adet · ${drug(i.drug).name}${drug(i.drug).barcode ? ' · ' + drug(i.drug).barcode : ''}`).join('\n') }); });
    on(el, 'click', '[data-act=recv]', async (e, b) => {
      const o = db.get('orders', b.dataset.id);
      const v = await formModal({ title: 'Teslim al', size: 'wide', fields: o.items.flatMap((i, k) => [{ type: 'section', label: `${drug(i.drug).name} (sipariş ${i.qty})` }, { name: 'q' + k, label: 'Gelen adet', type: 'number', value: i.qty }, { name: 'l' + k, label: 'Parti no' }, { name: 's' + k, label: 'SKT', type: 'date' }, { name: 'c' + k, label: 'Birim maliyet (₺)', type: 'number', step: '0.01', value: lastCost(i.drug) || '' }]), submitLabel: 'Stoğa al' }); if (!v) return;
      const rows = o.items.map((i, k) => ({ i, qty: Number(v['q' + k]) || 0, lot: String(v['l' + k] || '').trim(), skt: v['s' + k], cost: Number(v['c' + k]) || 0 })).filter((r) => r.qty > 0);
      if (!rows.length) return toast('Gelen ürün yok', 'err'); const badR = rows.find((r) => !r.lot || !r.skt); if (badR) return toast(`${drug(badR.i.drug).name}: parti no ve SKT gerekli`, 'err'); const old = rows.find((r) => r.skt <= today()); if (old) return toast(`${drug(old.i.drug).name}: SKT geçmiş ürün stoğa alınamaz`, 'err');
      rows.forEach((r) => addLot(r.i.drug, r.lot, r.skt, r.qty, r.cost)); o.status = 'geldi'; o.recvAt = new Date().toISOString(); db.save(); const x = await ig('its', 'alim-bildirim', { depot: (db.get('depots', o.depot) || {}).name, items: rows.map((r) => ({ barcode: drug(r.i.drug).barcode, qty: r.qty, lot: r.lot, skt: r.skt })) }); o.its = st(x); db.save(); toast('Ürünler stoğa alındı', 'ok'); app.refresh();
    });
    NS.crud($('#dpx', el), app, { col: 'depots', title: 'Depolar', single: 'Depo', addLabel: 'Depo ekle', emptyIcon: 'truck', fields: [{ name: 'name', label: 'Depo adı', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'code', label: 'Müşteri kodu' }], canDelete: (d) => (db.find('orders', (o) => o.depot === d.id) ? 'Bu depoya sipariş var; silinemez.' : true), columns: [{ key: 'name', label: 'Depo', render: (d) => `<b>${esc(d.name)}</b>` }, { key: 'phone', label: 'Telefon' }, { key: 'code', label: 'Müşteri kodu' }], onSave: () => app.refresh() });
  }
  const PF = [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'tc', label: 'TC kimlik no', required: true }, { name: 'phone', label: 'Telefon' }, { name: 'allergy', label: 'Alerji', full: true }, { name: 'retired', label: 'Gelir/aylık alıyor veya bakmakla yükümlü (katılım %10)', type: 'checkbox' }, { name: 'smsOk', label: 'Hatırlatma SMS\'i için açık rızası var', type: 'checkbox' }];
  const checkPt = (v, rec) => { const tc = String(v.tc || '').trim(); if (tc !== String((rec || {}).tc || '')) { if (!tcOk(tc)) return 'TC kimlik numarası geçersiz'; if (db.find('patients', (x) => x.tc === tc && (!rec || x.id !== rec.id))) return 'Bu TC kimlik numarasıyla kayıtlı hasta var'; } };
  function patientsPage(el, p, app) {
    const c = NS.crud(el, app, {
      col: 'patients', title: 'Hastalar', sub: 'Kronik ilaç kullananlara bitiş hatırlatması', single: 'Hasta', addLabel: 'Yeni hasta', emptyIcon: 'users',
      // Yalnızca hastanın aldığı ilaçlar listelenir (binlerce ilaçlık kutu yığını yerine)
      fields: (rec) => { const ids = new Set((rec && rec.chronic) || []); if (rec) db.all('sales', (s) => s.patient === rec.id && live(s)).forEach((s) => s.items.forEach((i) => { if (i.rx !== 'yok') ids.add(i.drug); })); return [...PF, ...(ids.size ? [{ type: 'section', label: 'Kronik ilaçlar (aldığı reçeteli ilaçlar)' }] : []), ...[...ids].map((id) => ({ name: 'ch_' + id, label: drug(id).name, type: 'checkbox' }))]; },
      toForm: (r) => ({ ...r, ...Object.fromEntries((r.chronic || []).map((id) => ['ch_' + id, true])) }), beforeSave: (v, rec) => { const bad = checkPt(v, rec); if (bad) return bad; const had = Object.keys(v).some((k) => k.startsWith('ch_')); v.chronic = Object.keys(v).filter((k) => k.startsWith('ch_') && v[k]).map((k) => k.slice(3)); Object.keys(v).filter((k) => k.startsWith('ch_')).forEach((k) => delete v[k]); if (!had && rec) v.chronic = rec.chronic || []; dirty(); },
      // Hasta verisi: toplu dışa aktarma ve silme eczacıda; satışı olan hasta silinmez (kayıt sahipsiz kalmasın), anonimleştirilir
      exportRoles: ['admin'], canDelete: (x) => (!app.can('admin') ? 'Hasta kaydını yalnızca eczacı silebilir' : db.find('sales', (s) => s.patient === x.id) ? 'Satış kaydı olan hasta silinemez; gerekirse anonimleştirin' : true),
      sort: (a, b) => a.name.localeCompare(b.name, 'tr'), searchFields: (x) => [x.name, x.tc, x.phone],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'due', label: 'İlacı bitmek üzere', test: due }],
      columns: [{ key: 'name', label: 'Hasta', render: (x) => `<b>${esc(x.name)}</b> ${x.retired ? badge('Emekli', 'info') : ''} ${x.allergy ? badge(x.allergy, 'err') : ''}<div class="small faint">${esc(x.phone || '')}</div>` }, { label: 'Kronik ilaç', render: (x) => (x.chronic || []).map((id) => esc(drug(id).name.split(' ')[0])).join(', ') || '-' }, { label: 'Kalan gün', render: (x) => { const r = renew(x); if (!r.length) return '-'; const l = Math.min(...r.map((y) => y.left)); return l <= 5 ? badge(l < 0 ? `${-l} gün geçti` : `${l} gün`, 'warn') : `${l} gün`; } }],
      extraActions: [{ icon: 'message', act: 'wa', title: 'WhatsApp hatırlatma', show: (x) => due(x) && x.phone }, ...(NS.kvkk && app.can('admin') ? [{ icon: 'download', act: 'kvexp', title: 'Verisini dışa aktar' }, { icon: 'shield', act: 'kvanon', title: 'Anonimleştir' }] : [])],
      // İlaç adı mesajda yazmaz: sağlık verisi aracı servislere gitmez
      onAction: async (a, x, redraw) => (a === 'kvexp' ? NS.kvkk.exportPerson(app, KV, x) : a === 'kvanon' ? (await NS.kvkk.anonymize(app, KV, x)) && redraw() : window.open(`https://wa.me/90${String(x.phone).replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(smsDue(x))}`, '_blank', 'noopener')),
    });
    const x = $('.page-h .row', el); if (x) { x.insertAdjacentHTML('afterbegin', `<button class="btn" id="rem">${icon('message')} Hatırlatma SMS'i</button>`); $('#rem', el).onclick = async () => { const list = db.all('patients', (y) => due(y) && y.phone && y.smsOk); const noOk = db.all('patients', (y) => due(y) && y.phone && !y.smsOk).length; if (!list.length) return toast(noOk ? `${noOk} hastanın SMS rızası yok` : 'Hatırlatılacak hasta yok', 'warn'); if (await confirm(`${list.length} hastaya hatırlatma SMS'i gönderilsin mi?${noOk ? ` ${noOk} hasta rıza olmadığı için atlanır.` : ''} Mesajda ilaç adı yazmaz.`, { ok: 'Gönder', danger: false })) NS.smsBatch(db, list.map((y) => ({ to: y.phone, name: y.name, kind: 'kronik', text: smsDue(y) })), 'hatırlatma'); }; }
    return c;
  }
  // Hastanın recete.html'den gönderdiği e-reçeteler
  function rxOrdersPage(el, p, app) {
    const ST = { yeni: ['Yeni', 'info'], hazirlaniyor: ['Hazırlanıyor', 'warn'], hazir: ['Hazır', 'ok'], eksik: ['Eksik ilaç', 'err'], teslim: ['Teslim edildi', ''] };
    const sms = (o, text) => NS.smsLog(db, { to: o.phone, name: o.name, text: `${S().bizName}: ${text}`, kind: 'recete' }, true).result.then((res) => toast(NS.smsText(res, 'Hasta SMS'), NS.smsTone(res)));
    const open = (o) => o.status !== 'teslim';
    NS.crud(el, app, {
      col: 'rxOrders', title: 'Online Reçeteler', sub: 'Hastaların web sayfasından gönderdiği e-reçeteler — hazırlayın, SMS ile haber verin', single: 'Reçete', canAdd: false, emptyIcon: 'file',
      fields: [{ name: 'rxNo', label: 'E-reçete no' }, { name: 'name', label: 'Hasta' }, { name: 'phone', label: 'Telefon' }, { name: 'total', label: 'Katkı payı / fark (₺)', type: 'number', step: '0.01' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'open', label: 'Açık', test: open }, { value: 'all', label: 'Tümü' }],
      sort: (a, b) => FLOWI(a) - FLOWI(b) || String(b.at).localeCompare(String(a.at)), searchFields: (o) => [o.rxNo, o.name, o.phone, o.code],
      columns: [{ key: 'rxNo', label: 'E-reçete', render: (o) => `<b class="mono">${esc(o.rxNo)}</b><div class="small faint">${esc(o.code)} · ${NS.ago(o.at)}</div>` }, { key: 'name', label: 'Hasta', render: (o) => `<b>${esc(o.name)}</b><div class="small faint">${esc(o.phone)}</div>` }, { key: 'pickup', label: 'Alış' }, { key: 'note', label: 'Not', render: (o) => `<span class="small">${esc(o.note || '')}</span>${o.missing ? `<div class="small" style="color:var(--err)">${esc(o.missing)}</div>` : ''}` }, { key: 'status', label: 'Durum', render: (o) => badge(...(ST[o.status] || ST.yeni)) }],
      extraActions: [{ icon: 'pill', act: 'prep', title: 'Hazırlanıyor', show: open }, { icon: 'check', act: 'ready', title: 'Hazır — SMS gönder', show: open }, { icon: 'alert', act: 'miss', title: 'Eksik ilaç bildir', show: open }, { icon: 'barcode', act: 'sale', title: 'Satış ekranına aktar', show: open }, { icon: 'user', act: 'done', title: 'Teslim edildi', show: open }],
      onAction: async (a, o, redraw) => {
        if (a === 'sale') { const x = db.find('patients', (y) => y.phone && String(y.phone).replace(/\D/g, '').slice(-10) === String(o.phone).replace(/\D/g, '').slice(-10)); sale = { ...newSale(), mode: 'recete', rxNo: o.rxNo, patient: x ? x.id : null }; if (!x) toast('Hasta kayıtlı değil: satış ekranında seçin veya ekleyin', 'warn'); return app.go('satis'); }
        if (a === 'prep') { o.status = 'hazirlaniyor'; }
        else if (a === 'ready') { const v = await formModal({ title: 'Reçete hazır', fields: [{ name: 'total', label: 'Ödenecek katkı payı / fark (₺)', type: 'number', step: '0.01', value: o.total || 0 }] }); if (!v) return; o.total = v.total; o.status = 'hazir'; sms(o, `${o.rxNo} numaralı reçeteniz hazır.${o.total ? ' Ödenecek: ' + money(o.total) + '.' : ''} Kimliğinizle gelebilirsiniz.`); }
        // SMS'te ilaç adı yazmaz: eksik bilgisi yalnızca takip sayfasında görünür
        else if (a === 'miss') { const v = await formModal({ title: 'Eksik ilaç', fields: [{ name: 'missing', label: 'Eksik ilaç / açıklama', required: true, full: true, value: o.missing || '' }, { name: 'eta', label: 'Tahmini geliş', value: o.eta || '' }] }); if (!v) return; o.missing = v.missing; o.eta = v.eta; o.status = 'eksik'; sms(o, `${o.rxNo} numaralı reçetenizde eksik ilaç var.${v.eta ? ' Tahmini geliş: ' + v.eta + '.' : ''} Ayrıntı için bizi arayın.`); }
        else if (a === 'done') { o.status = 'teslim'; o.doneAt = new Date().toISOString(); }
        db.save(); toast('Güncellendi', 'ok'); redraw();
      },
    });
  }
  const FLOWI = (o) => ['yeni', 'eksik', 'hazirlaniyor', 'hazir', 'teslim'].indexOf(o.status);

  function dutyPage(el, p, app) {
    NS.crud(el, app, { col: 'duty', title: 'Nöbet Takvimi', sub: 'Eczacılar odası nöbet listesi', single: 'Nöbet', addLabel: 'Nöbet ekle', emptyIcon: 'calendar', fields: [{ name: 'date', label: 'Tarih', type: 'date', required: true }, { name: 'note', label: 'Açıklama', value: 'Gece nöbeti 19:00 – 08:30' }], sort: (a, b) => a.date.localeCompare(b.date), filters: [{ value: 'up', label: 'Yaklaşan', test: (d) => d.date >= today() }, { value: 'all', label: 'Tümü' }], columns: [{ key: 'date', label: 'Tarih', render: (d) => `<b>${NS.dateLong(d.date)}</b> ${d.date === today() ? badge('BUGÜN NÖBETÇİ', 'err') : ''}` }, { key: 'note', label: 'Not' }, { label: 'Kalan', render: (d) => (d.date >= today() ? daysBetween(new Date(), d.date) + ' gün' : 'Geçti') }] });
  }
  function dashboard(el, p, app) {
    const t = today(); const all = db.all('sales', live); const todayS = all.filter((s) => iso(s.at) === t);
    const d30 = all.filter((s) => s.at > addDays(new Date(), -30).toISOString());
    const ser = NS.dailySeries(all, 14, 'at', (s) => s.total);
    const nextDuty = db.all('duty', (d) => d.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
    const low = db.all('drugs', (d) => stock(d.id) <= d.min);
    const skt = db.all('lots', (l) => l.qty > 0 && daysBetween(new Date(), l.skt) <= 30);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/satis">${icon('barcode')} Satış ekranı</a>`) + `
      ${nextDuty && nextDuty.date === t ? `<div class="card pad mb row" style="background:var(--err-soft);border-color:var(--err)">${icon('alert')}<b class="grow">Bugün nöbetçisiniz — ${esc(nextDuty.note)}</b></div>` : ''}
      <div class="grid g4 mb">${kpi('Bugünkü ciro', money(sum(todayS, (s) => s.total)), 'trend', 'ok', `<div class="small faint">Hastadan ${money(sum(todayS, (s) => s.patientPay))}</div>`)}${kpi('Bugün reçete', todayS.filter((s) => s.mode === 'recete').length, 'file', 'info', `<div class="small faint">${todayS.filter((s) => s.mode === 'elden').length} elden satış</div>`)}${kpi('30 gün kurum alacağı', money(sum(d30, (s) => s.instPay)), 'wallet', 'warn')}${kpi('Sonraki nöbet', nextDuty ? NS.date(nextDuty.date) : '-', 'calendar')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün</h3></div><div class="card-b">${all.length ? chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })), { format: money }) : '<div class="faint small">Henüz satış yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Satış türü (30 gün)</h3></div><div class="card-b">${d30.length ? chart.donut([{ label: 'Reçeteli', value: d30.filter((s) => s.mode === 'recete').length, color: '#0d9488' }, { label: 'Elden', value: d30.filter((s) => s.mode === 'elden').length, color: '#f59e0b' }], { size: 130 }) : '<div class="faint small">Henüz satış yok</div>'}</div></div></div>
      <div class="grid g2"><div class="card"><div class="card-h"><h3>${icon('alert')} Kritik stok (${low.length})</h3><a class="btn sm" href="#/siparis">Depo siparişi</a></div><div class="card-b">${low.slice(0, 8).map((d) => `<div class="list-item small"><span class="grow">${rxDot(d.rx)} ${esc(d.name)}</span>${badge(stock(d.id) + ' adet', 'err')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>${icon('clock')} 30 gün içinde SKT (${skt.length})</h3><a class="btn sm" href="#/skt">Tümü</a></div><div class="card-b">${skt.slice(0, 8).map((l) => `<div class="list-item small"><span class="grow">${esc(drug(l.drug).name)}</span>${badge(l.skt < t ? 'Geçti' : NS.date(l.skt), l.skt < t ? 'err' : 'warn')}</div>`).join('') || '<div class="faint small">Yok</div>'}</div></div></div>`;
  }
  // Satış iadesi: parti partisine stoğa döner; resmî iptal programdan yapılmaz (MEDULA/İTS doğrulanmadı)
  async function refundSale(s, app) {
    const v = await formModal({ title: `İade — ${s.no}`, extra: `<div class="card pad mt small">Hastaya iade: <b>${money(s.patientPay)}</b>.${s.medula && !['hata', 'TEST'].includes(s.medula) ? ' MEDULA ve İTS kaydını ilgili sistemden ayrıca iptal edin.' : ''}</div>`, fields: [{ name: 'reason', label: 'İade nedeni', required: true, full: true }, { name: 'back', label: 'İlaçlar sağlam: stoğa geri al', type: 'checkbox' }], submitLabel: 'İadeyi kaydet' }); if (!v) return;
    const ok = await NS.approve(NS.app, 'Satış iadesi', ['admin']); if (!ok) return; let lost = 0;
    if (v.back) s.items.forEach((i) => { if (!i.taken) { lost++; return; } i.taken.forEach((t) => { const l = db.get('lots', t.id); if (l) { l.qty += t.qty; db.insert('moves', { at: new Date().toISOString(), type: 'satis-iade', drug: i.drug, lot: l.lot, qty: t.qty, cost: l.cost, by: me(), note: s.no }, true); } }); });
    s.canceled = { at: new Date().toISOString(), by: ok.name || me(), reason: v.reason, back: !!v.back }; db.all('ctrl', (c) => c.saleNo === s.no).forEach((c) => { c.canceled = true; }); dirty(); db.log('Satış iadesi', s.no); db.save(); toast(lost ? `İade kaydedildi; ${lost} kalemin partisi bilinmediği için stok elle girilmeli` : 'İade kaydedildi', lost ? 'warn' : 'ok'); app.refresh();
  }
  function salesPage(el, p, app) {
    let day = today();
    const draw = () => {
      const dayAll = db.all('sales', (s) => iso(s.at) === day).sort((a, b) => b.at.localeCompare(a.at)); const rows = dayAll.filter(live); const pay = (k) => sum(rows.filter((s) => s.pay === k), (s) => s.patientPay);
      el.innerHTML = pageHead('Satışlar & Kasa', NS.dateLong(day), `<input type="date" class="input" id="dd" value="${day}" style="max-width:170px" aria-label="Gün"><button class="btn" id="z">${icon('print')} Gün sonu</button>`) + `<div class="grid g4 mb">${kpi('Toplam', money(sum(rows, (s) => s.total)), 'trend', 'ok')}${kpi('Hastadan tahsil', money(sum(rows, (s) => s.patientPay)), 'cash', '', `<div class="small faint">Nakit ${money(pay('nakit'))} · Kart ${money(pay('kart'))}</div>`)}${kpi('Kurum alacağı', money(sum(rows, (s) => s.instPay)), 'building', 'info')}${kpi('Reçete', rows.filter((s) => s.mode === 'recete').length, 'file', 'warn', dayAll.length > rows.length ? `<div class="small faint">${dayAll.length - rows.length} iade</div>` : '')}</div>
        <div class="card">${table({ rows: dayAll, empty: 'Bu gün satış yok', emptyIcon: 'receipt', columns: [{ label: 'Saat', render: (s) => `<b>${NS.time(s.at)}</b> <span class="faint small">${esc(s.no)}</span>` }, { label: 'Tür', render: (s) => (s.canceled ? badge('İade', 'err') : s.mode === 'recete' ? badge(`Reçete · ${INST[s.inst] || ''}`, 'info') : badge('Elden', 'warn')) }, { label: 'Hasta', render: (s) => esc(s.patient ? pat(s.patient).name : '-') }, { label: 'İlaçlar', render: (s) => `<span class="small">${esc(s.items.map((i) => i.name.split(' ')[0]).join(', '))}</span>` }, { label: 'Hasta öder', cls: 'right', render: (s) => money(s.patientPay) }, { label: 'Kurum', cls: 'right', render: (s) => (s.instPay ? money(s.instPay) : '-') }, { label: 'Bildirim', render: (s) => [s.medula ? badge(s.medula === 'TEST' ? 'MEDULA TEST' : s.medula === 'hata' ? 'MEDULA hata' : 'MEDULA', s.medula === 'hata' ? 'err' : s.medula === 'TEST' ? 'warn' : 'ok') : '', s.its ? badge(s.its === 'TEST' ? 'İTS TEST' : s.its === 'hata' ? 'İTS hata' : 'İTS', s.its === 'hata' ? 'err' : s.its === 'TEST' ? 'warn' : 'ok') : '', s.okc ? badge(s.okc === 'TEST' ? 'ÖKC TEST' : 'ÖKC', s.okc === 'TEST' ? 'warn' : 'ok') : ''].join(' ') || '<span class="faint small">-</span>' }], actions: [{ icon: 'refresh', act: 'rs', title: 'Bildirimleri yeniden gönder', show: (s) => live(s) && (s.medula === 'hata' || s.its === 'hata' || (!s.its && NS.integ && NS.integ.isOn('its'))) }, { icon: 'print', act: 'p', title: 'Fiş' }, { icon: 'x', act: 'ref', title: 'İade', show: live }] })}</div>`;
      $('#dd', el).onchange = (e) => { day = e.target.value || today(); draw(); };
      $('#z', el).onclick = () => { const cn = dayAll.filter((s) => s.canceled); NS.docs.print('gunsonu', { title: 'Gün sonu', no: NS.date(day), info: [['Satış', rows.length], ['Reçete', rows.filter((s) => s.mode === 'recete').length], ['İade', cn.length]], totals: [['Nakit', pay('nakit')], ['Kart', pay('kart')], ['Kurum alacağı', sum(rows, (s) => s.instPay)], ['İade toplamı', sum(cn, (s) => s.patientPay)], ['Hastadan tahsil', sum(rows, (s) => s.patientPay), true]] }); };
    };
    on(el, 'click', '[data-act=p]', (e, b) => printReceipt(db.get('sales', b.dataset.id)));
    on(el, 'click', '[data-act=ref]', (e, b) => refundSale(db.get('sales', b.dataset.id), app));
    on(el, 'click', '[data-act=rs]', async (e, b) => { const s = db.get('sales', b.dataset.id); const pt = s.patient ? pat(s.patient) : null; const items = s.items.map((i) => ({ barcode: drug(i.drug).barcode, name: i.name, qty: i.qty, serials: i.serials || [] })); if (s.mode === 'recete' && s.medula !== undefined && (!s.medula || s.medula === 'hata')) { const m = await ig('medula', 'provizyon', { rxNo: s.rxNo, tc: pt ? pt.tc : '', inst: s.inst, items, instPay: s.instPay, patientPay: s.patientPay }); if (m) s.medula = st(m); } if (!s.its || s.its === 'hata') { const i = await ig('its', 'satis-bildirim', { no: s.no, tc: pt ? pt.tc : '', items }); if (i) s.its = st(i); } db.save(); toast('Bildirimler yeniden denendi; sonuç satırda görünür', 'ok'); draw(); });
    draw();
  }

  // Kurum (SGK ve diğer) dönem mutabakatı: aylık reçete fatura kaydı ve tahsilat takibi
  function claimsPage(el, p, app) {
    const on2 = NS.integ && NS.integ.isOn('medula'); const G = {}; const list = {};
    db.all('sales', (s) => s.mode === 'recete' && live(s) && s.inst !== 'ucretli').forEach((s) => { const m = s.at.slice(0, 7); const k = `${m}|${s.inst}`; const g = G[k] || (G[k] = { id: k, month: m, inst: s.inst, count: 0, amount: 0, missing: 0 }); g.count++; g.amount += s.instPay || 0; if (s.medula === 'hata' || s.medula === 'TEST' || (on2 && !s.medula)) g.missing++; (list[k] = list[k] || []).push(s); });
    const cl = {}; db.all('claims').forEach((c) => { cl[`${c.month}|${c.inst}`] = c; });
    const rows = Object.values(G).sort((a, b) => b.month.localeCompare(a.month) || a.inst.localeCompare(b.inst)).map((g) => { const c = cl[g.id] || {}; return { ...g, amount: r2(g.amount), ref: c.ref, paid: c.paid, paidAmount: c.paidAmount, manual: c.manual, id2: c.id }; });
    el.innerHTML = pageHead('Kurum Mutabakatı', 'Aylık reçete dönem faturası, kurum alacağı ve tahsilat takibi') + `
      <div class="card pad mb small" style="border-color:var(--warn)">${icon('alert')} MEDULA bağlantısı doğrulanmadı: dönem faturasını MEDULA'dan yapın, buraya fatura numarasını işleyin.</div>
      <div class="grid g3 mb">${kpi('Faturalanmamış kurum alacağı', money(sum(rows.filter((r) => !r.ref), (r) => r.amount)), 'wallet', 'warn')}${kpi('Tahsil bekleyen', money(sum(rows.filter((r) => r.ref && !r.paid), (r) => r.amount)), 'clock', 'info')}${kpi('Provizyonu doğrulanmayan reçete', sum(rows, (r) => r.missing), 'alert', 'err')}</div>
      <div class="card">${table({ rows, empty: 'Reçeteli satış yok', emptyIcon: 'file', columns: [{ label: 'Dönem', render: (r) => `<b>${NS.MONTHS[Number(r.month.slice(5)) - 1]} ${r.month.slice(0, 4)}</b>` }, { label: 'Kurum', render: (r) => esc(INST[r.inst]) }, { label: 'Reçete', cls: 'right', render: (r) => `${r.count}${r.missing ? ' ' + badge(r.missing + ' doğrulanmadı', 'err') : ''}` }, { label: 'Kurum payı', cls: 'right', render: (r) => `<b>${money(r.amount)}</b>` }, { label: 'Durum', render: (r) => (r.paid ? `${badge('Tahsil edildi ' + NS.date(r.paid), 'ok')}${r.paidAmount !== undefined && r.paidAmount < r.amount ? `<div class="small" style="color:var(--err)">Kesinti ${money(r.amount - r.paidAmount)}</div>` : ''}` : r.ref ? badge('Faturalandı · ' + r.ref, 'info') : badge('Faturalanmadı', 'warn')) }], actions: [{ label: on2 ? 'Dönem faturası gönder' : 'Fatura no işle', act: 'inv', show: (r) => !r.ref }, { label: 'Tahsil edildi', act: 'paid', show: (r) => r.ref && !r.paid }, { icon: 'print', act: 'pr', title: 'İcmal' }] })}</div>`;
    on(el, 'click', '[data-act]', async (e, b) => {
      const r = rows.find((x) => x.id === b.dataset.id); const a = b.dataset.act;
      if (a === 'pr') return NS.docs.print('icmal', { title: `${INST[r.inst]} reçete icmali`, no: r.month, lines: list[r.id].map((s) => ({ name: `${NS.date(s.at)} · ${s.rxNo}`, note: `${s.patient ? pat(s.patient).name : ''} · provizyon ${s.medula || '-'}`, qty: 1, total: s.instPay })), totals: [['Toplam', r.amount, true]] });
      if (a === 'inv') {
        let res; if (on2) { if (r.missing && !(await confirm(`${r.missing} reçetenin provizyonu doğrulanmadı. Yine de dönem faturası gönderilsin mi?`, { ok: 'Gönder', danger: false }))) return; res = await NS.integ.call('medula', 'donem-fatura', { month: r.month, inst: r.inst, count: r.count, amount: r.amount }); if (res && res.simulated) return toast('MEDULA TEST — dönem faturası gönderilmedi (simülasyon); kayıt oluşturulmadı', 'warn'); if (!res || !res.ok) return; }
        else { const v = await formModal({ title: `${INST[r.inst]} dönem faturası`, fields: [{ name: 'ref', label: 'Fatura no', required: true }, { name: 'date', label: 'Fatura tarihi', type: 'date', required: true, value: today() }] }); if (!v) return; res = { ref: v.ref, date: v.date, manual: true }; }
        db.insert('claims', { month: r.month, inst: r.inst, ref: res.ref, date: res.date, manual: !!res.manual, amount: r.amount, at: new Date().toISOString() }); toast(res.manual ? 'Fatura no işlendi' : 'Dönem faturası kaydedildi', 'ok'); app.refresh();
      } else if (a === 'paid') { const v = await formModal({ title: 'Kurum tahsilatı', fields: [{ name: 'amount', label: 'Tahsil edilen (₺)', type: 'number', step: '0.01', required: true, value: r.amount }, { name: 'date', label: 'Tarih', type: 'date', required: true, value: today() }] }); if (!v) return; const c = db.get('claims', r.id2); c.paid = v.date; c.paidAmount = Number(v.amount) || 0; db.log('Kurum tahsilatı', `${r.month} ${r.inst}`); db.save(); app.refresh(); }
    });
  }
  // Kontrole tabi ilaç defteri: kırmızı ve yeşil reçeteli satışlar. Yalnızca eczacı görür; işlem geçmişine hasta bilgisi yazılmaz.
  function ledgerPage(el, p, app) {
    let mo = today().slice(0, 7);
    const draw = () => {
      const rows = db.all('ctrl', (c) => c.at.slice(0, 7) === mo).sort((a, b) => b.at.localeCompare(a.at)); const act = rows.filter((c) => !c.canceled);
      el.innerHTML = pageHead('Kontrole Tabi İlaç Defteri', 'Kırmızı ve yeşil reçeteli satış kayıtları', `<input type="month" class="input" id="mo" value="${mo}" style="max-width:170px" aria-label="Ay"><button class="btn" id="pr">${icon('print')} Yazdır</button>`) + `<div class="card">${table({ rows, empty: 'Bu ay kayıt yok', emptyIcon: 'file', columns: [{ label: 'Tarih', render: (c) => NS.dt(c.at) }, { label: 'İlaç', render: (c) => `${rxDot(c.rx)} <b>${esc(c.name || drug(c.drug).name)}</b>${c.canceled ? ' ' + badge('İade', 'err') : ''}` }, { label: 'Adet', cls: 'right', key: 'qty' }, { label: 'Hasta', render: (c) => esc(pat(c.patient).name) }, { label: 'Reçete', render: (c) => `${esc(c.rxNo)}<div class="small faint">${esc(c.doctor || '')}</div>` }, { label: 'Eczacı onayı', render: (c) => esc(c.by || '') }] })}</div><p class="small faint mt">Defterin resmî biçimi ve saklama kuralı doğrulanmadı; mevzuata uygun defterin yerine geçmez.</p>`;
      $('#mo', el).onchange = (e) => { mo = e.target.value || today().slice(0, 7); draw(); };
      $('#pr', el).onclick = () => NS.docs.print('defter', { title: 'Kontrole tabi ilaç defteri', no: mo, note: act.map((c) => `${NS.dt(c.at)} · ${c.name || drug(c.drug).name} · ${c.qty} adet · ${pat(c.patient).name} · Reçete ${c.rxNo} · ${c.doctor || ''}`).join('\n') || 'Kayıt yok' });
    };
    draw();
  }
  // Raporlar: ölü stok, en çok satanlar, imha kaybı (tek geçiş)
  function reportsPage(el, p, app) {
    let days = 30;
    const draw = () => {
      const since = addDays(new Date(), -days).toISOString(); const since90 = addDays(new Date(), -90).toISOString(); const sold = {}, rev = {}, sold90 = {}; let tot = 0, ins = 0;
      db.all('sales', live).forEach((s) => { const n = s.at >= since; if (n) { tot += s.total; ins += s.instPay || 0; } s.items.forEach((i) => { if (s.at >= since90) sold90[i.drug] = (sold90[i.drug] || 0) + i.qty; if (n) { sold[i.drug] = (sold[i.drug] || 0) + i.qty; rev[i.drug] = (rev[i.drug] || 0) + i.qty * i.price; } }); });
      const top = Object.keys(sold).map((id) => ({ id, name: drug(id).name, q: sold[id], r: rev[id] })).sort((a, b) => b.r - a.r).slice(0, 15);
      const dead = db.all('drugs', (d) => stock(d.id) > 0 && !sold90[d.id]).map((d) => ({ ...d, st: stock(d.id), val: sum(lotsAll(d.id).filter((l) => l.skt >= today()), (l) => l.qty * (l.cost || 0)) })).sort((a, b) => b.val - a.val);
      const lost = db.all('moves', (m) => m.type === 'imha' && m.at >= since);
      el.innerHTML = pageHead('Raporlar', 'Satış ve stok özeti', `<select class="input" id="dy" style="max-width:150px" aria-label="Dönem">${[30, 90, 365].map((d) => `<option value="${d}" ${d === days ? 'selected' : ''}>Son ${d} gün</option>`).join('')}</select><button class="btn" id="ex">${icon('download')} Ölü stok</button>`) + `
        <div class="grid g4 mb">${kpi('Ciro', money(tot), 'trend', 'ok')}${kpi('Kurum payı', money(ins), 'building', 'info')}${kpi('Ölü stok (90 gün satılmayan)', money(sum(dead, (d) => d.val)), 'layers', 'warn', `<div class="small faint">${dead.length} ürün</div>`)}${kpi('İmha kaybı', money(sum(lost, (m) => m.qty * (m.cost || 0))), 'alert', 'err')}</div>
        <div class="grid g2"><div class="card"><div class="card-h"><h3>En çok satanlar</h3></div>${table({ rows: top, empty: 'Bu dönemde satış yok', columns: [{ label: 'Ürün', render: (x) => esc(x.name) }, { label: 'Adet', cls: 'right', key: 'q' }, { label: 'Tutar', cls: 'right', render: (x) => money(x.r) }] })}</div>
        <div class="card"><div class="card-h"><h3>Ölü stok</h3></div>${table({ rows: dead.slice(0, 15), empty: 'Ölü stok yok', columns: [{ label: 'Ürün', render: (x) => esc(x.name) }, { label: 'Adet', cls: 'right', key: 'st' }, { label: 'Maliyet', cls: 'right', render: (x) => money(x.val) }] })}</div></div>`;
      $('#dy', el).onchange = (e) => { days = Number(e.target.value); draw(); };
      $('#ex', el).onclick = () => NS.csv('olu-stok', dead, [{ key: 'name', label: 'Ürün' }, { key: 'st', label: 'Adet' }, { key: 'val', label: 'Maliyet' }]);
    };
    draw();
  }

  const ROLES = { admin: 'Eczacı', kalfa: 'Kalfa / teknisyen' };
  NS.shell({
    id: 'eczane', integrations: ['printer','label','pos','barcode','efatura','sms','whatsapp','webhook','backup'], name: 'Eczane', tagline: 'Eczane Otomasyonu', icon: 'pill', accent: '#0d9488', db, home: 'satis', auth: { roles: ROLES },
    nav: [{ sec: 'Eczane' }, { id: 'satis', label: 'Satış Ekranı', icon: 'barcode' }, { id: 'ozet', label: 'Özet', icon: 'home' }, { id: 'satislar', label: 'Satışlar & Kasa', icon: 'receipt' }, { id: 'hastalar', label: 'Hastalar', icon: 'users' }, { id: 'recete', label: 'Online Reçeteler', icon: 'file' }, { id: 'kurum', label: 'Kurum Mutabakatı', icon: 'building', roles: ['admin'] }, { id: 'defter', label: 'Kontrole Tabi Defter', icon: 'lock', roles: ['admin'] }, { sec: 'Stok' }, { id: 'ilaclar', label: 'İlaç Kartları', icon: 'pill' }, { id: 'skt', label: 'Stok & SKT', icon: 'clock' }, { id: 'siparis', label: 'Depo Siparişi', icon: 'truck' }, { sec: 'Yönetim' }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'nobet', label: 'Nöbet Takvimi', icon: 'calendar' }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { recete: rxOrdersPage, kurum: claimsPage, defter: ledgerPage, raporlar: reportsPage, satis: salePage, ozet: dashboard, satislar: salesPage, hastalar: patientsPage, ilaclar: drugsPage, skt: sktPage, siparis: ordersPage, nobet: dutyPage, ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, defaults: DEF, fields: [{ type: 'section', label: 'Reçete hesabı' }, { name: 'pharmacist', label: 'Mesul eczacı' }, { name: 'gln', label: 'GLN no' }, { name: 'patientPct', label: 'Hasta katılım payı %', type: 'number' }, { name: 'retiredPct', label: 'Gelir/aylık alan katılım payı %', type: 'number' }, { name: 'rxFee', label: 'Reçete katılımı: 3 kutuya kadar (₺)', type: 'number', step: '0.01' }, { name: 'rxFeeExtra', label: 'Reçete katılımı: ilave her kutu (₺)', type: 'number', step: '0.01' }, { name: 'privatePct', label: 'Özel sigorta hasta payı %', type: 'number' }, { name: 'sktWarnDays', label: 'SKT uyarı süresi (gün)', type: 'number' }, { type: 'section', label: 'Hasta sayfası' }, { name: 'openFrom', label: 'Açılış saati', type: 'time' }, { name: 'openTo', label: 'Kapanış saati', type: 'time' }] }) },
  });
})();
