/* NEBSOFT Butik & Giyim — beden/renk matrisli stok, barkodlu satış, değişim/iade, müşteri puanı,
   sezon indirimi, etiket basımı ve mağaza + pazaryeri ortak stoğu */
(function () {
  'use strict';
  const { esc, $, $$, on, icon, money, toast, modal, confirm, formModal, table, chart, badge, kpi, pageHead, sum, addDays, iso, today } = NS;
  const B = window.BTK;
  const db = new NS.DB('butik', B.seed);
  const S = () => db.settings({});
  const model = (id) => db.get('models', id);
  const cust = (id) => db.get('customers', id);
  const findV = (code) => { const c = String(code || '').trim(); for (const m of db.all('models')) { const v = m.variants.find((x) => x.barcode === c); if (v) return { m, v }; } return null; };
  const unit = (m) => (Number(m.disc) ? Math.round(m.price * (1 - Number(m.disc) / 100)) : Number(m.price) || 0); // indirimli fiyat tam liraya yuvarlanır
  const mStock = (m) => sum(m.variants, (v) => v.stock);
  // Beden takımları: hazır takımlar + işletmenin eklediği (Ürünler > Beden takımları)
  const allSets = () => ({ ...B.SIZES, ...(S().sizeSets || {}) });
  const SZ = (t) => allSets()[t] || [];
  const SET_NAMES = { harf: 'XS–XXL', beden: '34–44', numara: 'Ayakkabı 36–41', tek: 'Tek beden' };
  const setName = (t) => SET_NAMES[t] || (S().sizeNames || {})[t] || t;
  // Etiketi basıldıktan sonra fiyatı değişen model (raftaki etiket eski)
  const lblOld = (m) => !!(m.priceAt && (!m.lblAt || m.priceAt > m.lblAt));
  const sw = (hex) => `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};border:1px solid var(--border);vertical-align:-1px"></span>`;
  const colorHex = (m, name) => (m.colors.find((c) => c.name === name) || {}).hex || '#999';
  // Online stok ve fiyat: Pazaryeri ve E-ticaret programlarıyla aynı yol (/api/kanal). Sonuç günlüğe yazılır;
  // bağlantı yoksa veya canlı değilse istek atılmaz, "gönderildi" gösterilmez (CLAUDE.md §1)
  const kanal = () => B.kanalDurum(NS.integ ? NS.integ.cfg('pazaryeri') : {});
  const onlineTone = (m) => (m === 'canli' ? 'ok' : m === 'yok' ? '' : 'warn');
  const syncNote = (e) => { db.data.onlineLog = [{ at: new Date().toISOString(), ...e }, ...(db.data.onlineLog || [])].slice(0, 30); const nu = db._noUndo; db._noUndo = true; db.save(); db._noUndo = nu; };
  async function syncOnline(models) {
    const list = models.filter((m) => m.online); if (!list.length || S().online === false) return null;
    const d = kanal(); const n = sum(list, (m) => m.variants.length);
    if (d.mode === 'yok' || d.mode === 'test') return { mode: d.mode, ok: false, msg: `${d.label}: gönderilmedi` }; // yapılmamış işlem günlüğe yazılmaz
    const items = list.flatMap((m) => m.variants.map((v) => ({ barcode: v.barcode, sku: v.barcode, stock: Math.max(0, v.stock), price: unit(m), listPrice: Math.max(Number(m.price) || 0, unit(m)) })));
    let r;
    if (d.mode === 'ozel') r = await NS.integ.call('pazaryeri', 'stok-fiyat', { items }, { silent: true });
    else { const c = NS.integ.cfg('pazaryeri'); try { r = await (await fetch('/api/kanal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: d.channel, action: 'stok-fiyat', creds: { sellerId: c.sellerId, apiKey: c.user, apiSecret: c.pass, stage: d.mode === 'stage' }, payload: { items } }) })).json(); } catch (e) { r = { ok: false, error: 'Sunucu köprüsüne ulaşılamadı' }; } }
    const ok = !!(r && r.ok); const e = { mode: d.mode, ok, msg: ok ? `${d.label}: ${n} varyant kabul edildi` : `${d.label}: gönderilemedi. ${(r && r.error) || 'Bilinmeyen hata'}` };
    syncNote(e); if (!ok) toast(`Online stok gönderilemedi: ${(r && r.error) || 'bilinmeyen hata'}`, 'err'); return e;
  }
  const onlineBar = () => { const d = kanal(); const l = (db.data.onlineLog || [])[0]; return `<div class="card pad mb row small" style="flex-wrap:wrap">${badge(d.label, onlineTone(d.mode))}<span class="grow">${esc(S().online === false ? 'Online gönderim Ayarlar\'dan kapalı.' : d.text)}${l ? ` <span class="faint">Son durum: ${esc(l.msg)} (${NS.dt(l.at)})</span>` : ''}</span>${['canli', 'stage', 'ozel'].includes(d.mode) && S().online !== false ? '<button class="btn sm" id="ols">Şimdi gönder</button>' : ''}<a class="btn sm" href="#/entegrasyonlar">Bağlantı</a></div>`; };
  // Stok hareketi: satış, iade, değişim, sayım, mal kabul (model kartında "Hareketler")
  const MOVE = { satis: 'Satış', iade: 'İade', degisim: 'Değişim', sayim: 'Sayım', kabul: 'Mal kabul' };
  const move = (m, v, qty, type, ref) => { if (qty) db.insert('moves', { at: new Date().toISOString(), mid: m.id, barcode: v.barcode, size: v.size, color: v.color, qty, type, ref: ref || '', user: (NS.currentUser || {}).name || '' }, true); };
  const nextNo = () => 'F' + (Math.max(5000, ...db.all('sales').map((s) => Number(String(s.no).replace(/\D/g, '')) || 0)) + 1);
  // Fiyat geçmişi ve indirim kuralı (RG 01.07.2026/33297, Yönetmelik m.14/3): indirimden önceki fiyat = son 10 gündeki en düşük fiyat
  const priceEdit = (m, fn) => {
    const before = unit(m), d0 = Number(m.disc) || 0; fn(); const now = new Date().toISOString();
    if (unit(m) !== before) { if (!Array.isArray(m.ph)) m.ph = [{ at: '2000-01-01T00:00:00.000Z', v: before }]; m.ph.push({ at: now, v: unit(m) }); if (m.ph.length > 60) m.ph = m.ph.slice(-60); m.priceAt = now; }
    if ((Number(m.disc) || 0) !== d0 && m.disc > 0) m.discAt = now;
  };
  const priceAt = (m, t) => { const h = (m.ph || []).filter((x) => x.at <= t); return h.length ? h[h.length - 1].v : m.ph && m.ph.length ? m.ph[0].v : m.price; };
  const low10 = (m) => { const st = m.discAt || new Date().toISOString(); const from = addDays(new Date(st), -10).toISOString(); const vs = [priceAt(m, from), ...(m.ph || []).filter((x) => x.at > from && x.at < st).map((x) => x.v)]; return Math.min(...vs); };
  // Gösterilecek eski fiyat: liste fiyatı ile son 10 günün en düşüğünden küçük olanı; indirim yoksa ya da indirimli fiyattan yüksek değilse 0
  const oldRef = (m) => { if (!(m.disc > 0)) return 0; const o = Math.min(m.price, low10(m)); return o > unit(m) ? o : 0; };
  const pctOff = (m) => { const o = oldRef(m); return o ? Math.round((1 - unit(m) / o) * 100) : 0; };
  // Yönetici onayı: yönetici oturumdaysa onay, değilse yönetici PIN'i
  async function adminOk(msg) {
    if ((NS.currentUser || {}).role === 'admin') return confirm(msg);
    const pin = await NS.prompt(`${msg} — yönetici PIN'i`, ''); if (pin === null) return false;
    let ok = null; try { ok = await NS.pinKontrol(db, pin); } catch (x) { toast(x.message, 'err'); return false; } if (!ok) toast('PIN hatalı', 'err'); else db.log('Yönetici onayı', msg); return !!ok;
  }

  // ---------- Matris (beden × renk) ----------
  const matrix = (m, editable) => {
    const sizes = SZ(m.sizeType);
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${sizes.map((s) => `<th class="right">${esc(s)}</th>`).join('')}<th class="right">Toplam</th></tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${sizes.map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); if (!v) return '<td></td>'; return `<td class="right">${editable ? `<input class="input" type="number" min="0" data-bc="${v.barcode}" value="${v.stock}" style="width:64px;height:32px;text-align:right">` : `<b style="color:var(--${v.stock <= 0 ? 'err' : v.stock <= (Number(S().lowStock) || 2) ? 'warn' : 'text'})">${v.stock}</b>`}</td>`; }).join('')}<td class="right"><b>${sum(m.variants.filter((v) => v.color === c.name), (v) => v.stock)}</b></td></tr>`).join('')}</tbody></table></div>`;
  };

  // ---------- Satış ----------
  // Müşterinin bedeninde stokta olan, son 30 günde gelen veya çok satan modeller (kasada öneri)
  function suggest(cu) {
    if (!cu || !cu.size) return ''; const from = addDays(new Date(), -30).toISOString(); const bought = new Set(db.all('sales', (s) => s.customer === cu.id).flatMap((s) => s.lines.map((l) => l.mid)));
    const fresh = new Map(); db.all('moves', (x) => x.type === 'kabul' && x.at > from).forEach((x) => fresh.set(x.mid, 1));
    const ms = db.all('models', (m) => !m.passive && !bought.has(m.id) && m.variants.some((v) => v.size === cu.size && v.stock > 0)).map((m) => ({ m, sc: (fresh.has(m.id) ? 2 : 0) + (m.disc > 0 ? 1 : 0) })).sort((a, b) => b.sc - a.sc).slice(0, 6);
    return ms.length ? `<div class="small muted mt">Bedeninde stokta (${esc(cu.size)}):</div><div class="row mt" style="flex-wrap:wrap;gap:6px">${ms.map(({ m, sc }) => `<button class="btn sm" data-m="${m.id}" title="${sc >= 2 ? 'Yeni geldi' : ''}">${sc >= 2 ? '🆕 ' : ''}${esc(m.name)} · ${money(unit(m))}</button>`).join('')}</div>` : '';
  }
  let posKeep = { cart: [], customer: null, extra: 0, rep: '' }; // Başka sayfaya geçince sepet kaybolmasın
  function posPage(el, p, app) {
    campTick(); let { cart, customer, extra, rep: srep } = posKeep; if (!srep) srep = (NS.currentUser || {}).name || '';
    el.innerHTML = pageHead('Satış', 'Barkodu okutun veya modeli arayıp beden/renk seçin', `<button class="btn" id="held">${icon('clock')} Bekleyenler <span id="hn"></span></button><button class="btn" id="gift">${icon('gift')} Hediye çeki sat</button>`) + `
      <div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><div class="row"><input class="input grow" id="scan" autocomplete="off" placeholder="Barkod okutun / model adı veya kodu yazın" style="height:52px;font-size:18px"></div><div id="sug" class="mt"></div></div><div class="card" id="cart"></div></div>
      <div class="col" style="gap:16px"><div class="card pad" id="cu"></div><div class="card pad" id="tot"></div></div></div>`;
    // İkinci üründe indirim kampanyası (kategori bazında)
    const calc = () => {
      const lines = cart.map((l) => ({ ...l, line: l.price * l.qty, camp: 0 }));
      db.all('campaigns', (c) => campOn(c) && c.type === 'ikinci').forEach((c) => { const ls = lines.filter((l) => (model(l.mid) || {}).cat === c.target); const units = ls.flatMap((l) => Array(l.qty).fill(l)).sort((a, b) => a.price - b.price); const n = Math.floor(units.length / 2); units.slice(0, n).forEach((l) => { l.camp += Math.round((l.price * c.value) / 100); }); });
      const sub = sum(lines, (l) => l.line); const camp = sum(lines, (l) => l.camp); const total = Math.max(0, sub - camp - extra);
      return { lines, sub, camp, total };
    };
    const draw = () => {
      posKeep = { cart, customer, extra, rep: srep }; const c = calc(); const hn = db.all('held').length; $('#hn', el).textContent = hn ? `(${hn})` : '';
      $('#cart', el).innerHTML = cart.length ? table({ rows: c.lines.map((l, i) => ({ ...l, id: i })), columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${sw(colorHex(model(l.mid), l.color))} ${esc(l.color)} · ${esc(l.size)} · <span class="mono">${esc(l.barcode)}</span></div>` }, { label: 'Adet', cls: 'right', render: (l) => `<div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm ghost icon" data-q="-1" data-i="${l.id}">${icon('minus')}</button><b>${l.qty}</b><button class="btn sm ghost icon" data-q="1" data-i="${l.id}">${icon('plus')}</button></div>` }, { label: 'Tutar', cls: 'right', render: (l) => `<b>${money(l.line - l.camp)}</b>${l.camp ? `<div class="small" style="color:var(--ok)">kampanya −${money(l.camp)}</div>` : ''}` }] }) : `<div class="empty">${icon('barcode')}<div>Sepet boş — barkod okutun</div></div>`;
      const cu = customer && cust(customer);
      $('#cu', el).innerHTML = (cu ? `<div class="row"><div class="grow"><b>${esc(cu.name)}</b><div class="small muted">${esc(cu.phone)} · ${cu.points} puan (${money(cu.points)})${cu.size ? ` · beden <b>${esc(cu.size)}</b>` : ''}</div></div><button class="btn sm ghost icon" id="cux">${icon('x')}</button></div>${suggest(cu)}` : `<button class="btn block" id="cus">${icon('user')} Müşteri seç / ekle</button><p class="small muted mt">Müşteri seçilirse alışverişten %${S().pointPct || 3} puan kazanır.</p>`) + `<div class="field mt"><label>Satış danışmanı</label><select class="input" id="rep">${[...new Set([...reps(), srep].filter(Boolean))].map((n) => `<option ${n === srep ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>`;
      $('#tot', el).innerHTML = `<div class="list-item small"><span class="grow muted">Ara toplam</span>${money(c.sub)}</div>${c.camp ? `<div class="list-item small"><span class="grow muted">Kampanya</span>−${money(c.camp)}</div>` : ''}<div class="list-item small"><span class="grow muted">Ek indirim</span><button class="btn sm ghost" id="dc">${extra ? '−' + money(extra) : 'Ekle'}</button></div><div class="list-item"><b class="grow" style="font-size:18px">Toplam</b><b style="font-size:26px">${money(c.total)}</b></div>
        <div class="grid g2 mt">${Object.entries(B.PAY).filter(([k]) => ['nakit', 'kart', 'havale'].includes(k)).map(([k, l]) => `<button class="btn ${k === 'kart' ? 'primary' : ''}" data-pay="${k}" ${cart.length ? '' : 'disabled'}>${icon(k === 'nakit' ? 'cash' : k === 'kart' ? 'card' : 'building')} ${l}</button>`).join('')}${cu && cu.points ? `<button class="btn" data-pay="puan" ${cart.length ? '' : 'disabled'}>${icon('gift')} Puanla öde</button>` : ''}<button class="btn" data-pay="parcali" ${cart.length ? '' : 'disabled'}>${icon('layers')} Parçalı / çek</button><button class="btn ghost" id="hold" ${cart.length ? '' : 'disabled'}>${icon('clock')} Beklet</button></div>`;
    };
    const add = (m, v) => { if (m.passive) { NS.beep(200, 250); return toast(`${m.name} satıştan kaldırılmış (pasif) — Ürünler sayfasından açın`, 'err'); } if (v.stock <= 0) toast(`${m.name} ${v.color}/${v.size} stokta görünmüyor — yine de eklendi`, 'err'); if (lblOld(m)) toast(`Dikkat: ${m.name} fiyatı etiket basıldıktan sonra değişti — kasa fiyatı ${money(unit(m))}. Raftaki etiketi yenileyin (Etiket Basımı > Fiyatı değişen).`, 'err'); const l = cart.find((x) => x.barcode === v.barcode); if (l) l.qty++; else cart.push({ mid: m.id, barcode: v.barcode, name: m.name, size: v.size, color: v.color, qty: 1, price: unit(m), cost: m.cost }); NS.beep(); draw(); };
    const pickVariant = (m) => modal({ title: `${m.name} — beden/renk seçin`, size: 'wide', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${SZ(m.sizeType).map((s) => `<th class="center">${esc(s)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${SZ(m.sizeType).map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); return `<td class="center">${v ? `<button class="btn sm ${v.stock ? '' : 'ghost'}" data-pv="${v.barcode}" style="min-width:52px">${v.stock}</button>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Rakamlar stok adedidir. Fiyat: <b>${money(unit(m))}</b>${oldRef(m) ? ` (<s>${money(oldRef(m))}</s> %${pctOff(m)})` : ''}</p><button class="btn sm" id="wt">${icon('bell')} Bedeni yok mu? Gelince haber ver</button>`, onOpen: (b, close) => { on(b, 'click', '[data-pv]', (e, t) => { add(m, m.variants.find((v) => v.barcode === t.dataset.pv)); close(); }); $('#wt', b).onclick = () => { close(); addWait(m, customer); }; } });
    const inp = $('#scan', el);
    inp.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const f = findV(inp.value); if (f) { add(f.m, f.v); inp.value = ''; $('#sug', el).innerHTML = ''; return; } const ms = db.all('models', (m) => !m.passive && NS.match(inp.value, m.name, m.code)); if (ms.length === 1) { pickVariant(ms[0]); inp.value = ''; } else if (!ms.length) { NS.beep(200, 250); toast('Ürün bulunamadı', 'err'); } });
    inp.addEventListener('input', () => { const q = inp.value.trim(); $('#sug', el).innerHTML = q.length < 2 ? '' : `<div class="row" style="flex-wrap:wrap;gap:6px">${db.all('models', (m) => !m.passive && NS.match(q, m.name, m.code)).slice(0, 8).map((m) => `<button class="btn sm" data-m="${m.id}">${esc(m.name)} · ${money(unit(m))}</button>`).join('')}</div>`; });
    on(el, 'click', '[data-m]', (e, b) => pickVariant(model(b.dataset.m)));
    on(el, 'click', '[data-q]', (e, b) => { const l = cart[Number(b.dataset.i)]; l.qty += Number(b.dataset.q); if (l.qty <= 0) cart.splice(Number(b.dataset.i), 1); draw(); });
    on(el, 'click', '#cux', () => { customer = null; draw(); });
    on(el, 'change', '#rep', (e, t) => { srep = t.value; draw(); });
    // Satışı beklet (müşteri kabinde) / geri çağır
    on(el, 'click', '#hold', async () => { const note = await NS.prompt('Bekleyen satış notu (ör. kabin 2, mavi ceketli müşteri)', ''); if (note === null) return; db.insert('held', { at: new Date().toISOString(), cart, customer, extra, rep: srep, note }); db.save(); cart = []; customer = null; extra = 0; draw(); toast('Satış bekletildi', 'ok'); inp.focus(); });
    $('#held', el).onclick = () => { const hs = db.all('held').sort((a, b) => b.at.localeCompare(a.at)); if (!hs.length) return toast('Bekleyen satış yok');
      modal({ title: 'Bekleyen satışlar', body: table({ rows: hs, columns: [{ label: 'Saat', render: (h) => NS.dt(h.at) }, { label: 'Not', render: (h) => `<b>${esc(h.note || '-')}</b><div class="small faint">${sum(h.cart, (l) => l.qty)} ürün · ${esc((cust(h.customer) || {}).name || '')}</div>` }], actions: [{ icon: 'check', act: 'take', title: 'Kasaya al' }, { icon: 'trash', act: 'drop', title: 'Sil' }] }),
        onOpen: (b, close) => on(b, 'click', '[data-act]', async (e, t) => { const h = db.get('held', t.dataset.id); if (t.dataset.act === 'drop') { if (!(await confirm('Bekleyen satış silinsin mi?'))) return; db.remove('held', h.id); db.save(); close(); draw(); return; }
          if (cart.length && !(await confirm('Kasadaki sepet bekletilip bu satış açılsın mı?'))) return; if (cart.length) db.insert('held', { at: new Date().toISOString(), cart, customer, extra, rep: srep, note: 'Otomatik bekletildi' });
          ({ cart, customer, extra } = h); srep = h.rep || srep; db.remove('held', h.id); db.save(); close(); draw(); }) }); };
    $('#gift', el).onclick = async () => { const v = await formModal({ title: 'Hediye çeki sat', fields: [{ name: 'amount', label: 'Tutar (₺)', type: 'number', required: true }, { name: 'pay', label: 'Ödeme', type: 'select', options: [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kredi kartı' }, { value: 'havale', label: 'Havale/EFT' }] }] }); if (!v) return; const a = Math.round((Number(v.amount) || 0) * 100) / 100; if (a <= 0) return toast('Tutar girin', 'err'); const c = chqIssue(a, 'satis', customer, '', v.pay); db.log('Hediye çeki satıldı', `${c.code} · ${money(a)}`); toast(`Hediye çeki ${c.code} · ${money(a)}`, 'ok'); };
    on(el, 'click', '#dc', async () => { const v = await NS.prompt('Ek indirim (₺)', extra || ''); if (v !== null) { extra = Math.max(0, Number(v) || 0); draw(); } });
    on(el, 'click', '#cus', async () => {
      const q = await NS.prompt('Müşteri telefonu veya adı', ''); if (q === null) return;
      let c = db.find('customers', (x) => NS.match(q, x.name, x.phone) || String(x.phone).replace(/\D/g, '').endsWith(String(q).replace(/\D/g, '').slice(-10)));
      if (!c) { const v = await formModal({ title: 'Yeni müşteri', fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'size', label: 'Beden' }, { name: 'birthday', label: 'Doğum günü', type: 'date' }, { name: 'kvkk', label: 'SMS/kampanya izni (KVKK)', type: 'checkbox' }], values: { phone: /\d/.test(q) ? q : '', name: /\d/.test(q) ? '' : q } }); if (!v) return; c = db.insert('customers', { ...v, points: 0 }); }
      customer = c.id; draw();
    });
    const finish = (pays) => {
      const c = calc(); const cu = customer && cust(customer); const used = sum(pays.filter((x) => x.type === 'puan'), (x) => x.amount);
      const pts = cu ? Math.round(((c.total - used) * (Number(S().pointPct) || 3)) / 100) : 0;
      const s = db.insert('sales', { no: nextNo(), at: new Date().toISOString(), customer, lines: c.lines.map((l) => ({ mid: l.mid, barcode: l.barcode, name: l.name, size: l.size, color: l.color, qty: l.qty, price: Math.round((l.line - l.camp) / l.qty), cost: l.cost })), sub: c.sub, disc: c.camp + extra, total: c.total, pay: pays.length > 1 ? 'parcali' : pays[0].type, pays, pts, ptsUsed: used, user: (NS.currentUser || {}).name, rep: srep, channel: 'magaza' });
      pays.filter((x) => x.type === 'cek').forEach((x) => { const q = chqFind(x.code); if (q) { q.balance = Math.round((q.balance - x.amount) * 100) / 100; q.uses.push({ at: s.at, no: s.no, amount: x.amount }); } });
      // Stok eksiye düşebilir: stokta görünmeyen ürünün satışı sayım farkı olarak izlenir
      const touched = new Set(); s.lines.forEach((l) => { const f = findV(l.barcode); if (f) { f.v.stock -= l.qty; move(f.m, f.v, -l.qty, 'satis', s.no); touched.add(f.m); } });
      if (cu) cu.points = (cu.points || 0) - used + pts;
      db.save(); syncOnline([...touched]); receipt(s); toast(`${s.no} · ${money(s.total)} satış tamamlandı`, 'ok');
      cart = []; customer = null; extra = 0; draw(); inp.focus();
    };
    const split = () => {
      const c = calc(); const cu = customer && cust(customer); const ks = ['nakit', 'kart', 'havale', ...(cu && cu.points ? ['puan'] : []), 'cek'];
      modal({ title: `Parçalı ödeme · ${money(c.total)}`, body: `<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">${ks.map((k) => `<div class="field"><label>${esc(B.PAY[k])}${k === 'puan' ? ` (en çok ${cu.points})` : ''}</label><input class="input" type="number" min="0" step="0.01" data-sp="${k}" value="${k === 'kart' ? c.total : ''}"></div>${k === 'cek' ? `<div class="field"><label>Çek kodu</label><input class="input mono" id="spc" placeholder="Okutun veya yazın" autocomplete="off"></div>` : ''}`).join('')}</div><div class="lbs-sum mt" id="spr"></div>`,
        onOpen: (b) => { $('#spc', b).addEventListener('change', (e) => { const q = chqFind(e.target.value); if (!q) return toast('Çek bulunamadı', 'err'); if (q.balance <= 0) return toast('Çekin bakiyesi yok', 'err'); const ci = $('[data-sp=cek]', b), ki = $('[data-sp=kart]', b); const a = Math.min(q.balance, c.total); ci.value = a; ki.value = Math.max(0, Math.round((c.total - a) * 100) / 100) || ''; toast(`Çek bakiyesi ${money(q.balance)}`, 'ok'); b.dispatchEvent(new Event('input')); }); const upd = () => { const t = sum($$('[data-sp]', b), (i) => Number(i.value) || 0); const r = Math.round((c.total - t) * 100) / 100; $('#spr', b).innerHTML = r === 0 ? 'Tutar tamam' : r > 0 ? `Kalan: <b>${money(r)}</b>` : `Fazla: <b>${money(-r)}</b>`; }; b.addEventListener('input', upd); upd(); },
        actions: [{ label: 'Vazgeç' }, { label: 'Satışı tamamla', cls: 'primary', onClick: (close, b) => {
          const pays = $$('[data-sp]', b).map((i) => ({ type: i.dataset.sp, amount: Math.round((Number(i.value) || 0) * 100) / 100 })).filter((x) => x.amount > 0);
          if (Math.round(sum(pays, (x) => x.amount) * 100) !== Math.round(c.total * 100)) return toast('Ödemelerin toplamı satış tutarına eşit olmalı', 'err');
          const pu = pays.find((x) => x.type === 'puan'); if (pu && pu.amount > cu.points) return toast(`Puan yetersiz (${cu.points} puan)`, 'err');
          const ce = pays.find((x) => x.type === 'cek'); if (ce) { const q = chqFind($('#spc', b).value); if (!q) return toast('Çek kodunu girin', 'err'); if (ce.amount > q.balance) return toast(`Çek bakiyesi ${money(q.balance)}`, 'err'); ce.code = q.code; }
          close(); finish(pays); } }] });
    };
    on(el, 'click', '[data-pay]', async (e, b) => {
      const c = calc(); const pay = b.dataset.pay; const cu = customer && cust(customer);
      if (pay === 'parcali') return split();
      if (pay === 'puan' && cu.points < c.total) return toast(`Puan yetersiz (${cu.points} puan) — “Parçalı” ile puan + başka ödeme kullanın`, 'err');
      finish([{ type: pay, amount: c.total }]);
    });
    draw(); setTimeout(() => inp.focus(), 50);
  }
  function receipt(s) {
    const cu = s.customer && cust(s.customer);
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><div style="text-align:center"><b style="font-size:16px">${esc(S().bizName)}</b><div>${esc(S().bizAddress || '')}</div><div>${esc(S().bizPhone || '')}</div></div><hr>
      <div>Fiş: ${esc(s.no)} · ${NS.dt(s.at)}</div>${cu ? `<div>Müşteri: ${esc(cu.name)}</div>` : ''}<hr>${s.lines.map((l) => `<div>${esc(l.name)}<br>${esc(l.color)} / ${esc(l.size)} <span style="float:right">${l.qty} × ${money(l.price)}</span></div>`).join('')}<hr>
      ${s.disc ? `<div>İndirim <span style="float:right">−${money(s.disc)}</span></div>` : ''}<div style="font-size:15px"><b>TOPLAM <span style="float:right">${money(s.total)}</span></b></div>${(s.pays || [{ type: s.pay, amount: s.total }]).map((x) => `<div>${esc(B.PAY[x.type] || x.type)}${x.code ? ' ' + esc(x.code) : ''} <span style="float:right">${money(x.amount)}</span></div>`).join('')}${s.rep ? `<div>Danışman: ${esc(s.rep)}</div>` : ''}${cu ? `<div>${s.pts ? `Kazanılan puan: ${s.pts} · ` : ''}Puan bakiyesi: ${cu.points}</div>` : ''}<hr>
      <div style="text-align:center">${NS.barcodeSvg(s.no, { height: 36 })}<div>Etiketi sökülmemiş ürünlerde ${S().exchangeDays || 30} gün içinde bu fişle değişim yapılır.</div><div style="margin-top:6px;font-weight:700">BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</div></div></div>`, { title: s.no });
  }

  // ---------- SMS: sonuç sağlayıcıdan gelir; bağlı değilse TEST olarak kaydedilir ----------
  function smsSend(c, text) {
    if (!c.kvkk) return toast('Müşterinin SMS izni yok (KVKK)', 'err');
    if (!(NS.integ && NS.integ.isOn && NS.integ.isOn('sms'))) { NS.smsLog(db, { to: c.phone, name: c.name, text }, true); return toast('SMS sağlayıcısı bağlı değil — mesaj gönderilmedi, TEST olarak kaydedildi (Entegrasyonlar > SMS)', 'err'); }
    const r = NS.smsLog(db, { to: c.phone, name: c.name, text }); toast('SMS gönderiliyor…');
    let n = 0; const t = setInterval(() => { const st = r.status; if (st !== 'gönderiliyor' || ++n > 40) { clearInterval(t); toast(st === 'gönderildi' ? 'SMS gönderildi' : st === 'gönderiliyor' ? 'SMS sonucu alınamadı — SMS kayıtlarından kontrol edin' : st === 'simülasyon' ? 'SMS gönderilmedi (TEST)' : 'SMS gönderilemedi: ' + st, st === 'gönderildi' ? 'ok' : 'err'); } }, 300);
  }

  // ---------- İade / hediye çeki: kodlu, bakiyeli; kasada "Parçalı" ödemede kullanılır ----------
  const chqFind = (code) => db.find('cheques', (x) => x.code === String(code || '').trim().toUpperCase());
  function chqPrint(c) {
    NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px;text-align:center"><b style="font-size:16px">${esc(S().bizName)}</b><div>${esc(S().bizPhone || '')}</div><hr><b style="font-size:15px">${c.source === 'iade' ? 'İADE ÇEKİ' : 'HEDİYE ÇEKİ'}</b><div style="font-size:24px;font-weight:800;margin:6px 0">${money(c.amount)}</div>${NS.barcodeSvg(c.code, { height: 40 })}<div>Kod: <b>${esc(c.code)}</b> · ${NS.date(c.at)}</div><div style="margin-top:6px">Kasada ödeme olarak kullanılır. Kalan bakiye bir sonraki alışverişe aktarılır.</div><hr><b>BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</b></div>`, { title: c.code });
  }
  function chqIssue(amount, source, customer, ref, pay) {
    let code; do { code = 'C' + String(Math.floor(1e7 + Math.random() * 9e7)); } while (chqFind(code));
    const c = db.insert('cheques', { code, amount, balance: amount, at: new Date().toISOString(), source, customer: customer || null, ref: ref || '', pay: pay || '', uses: [] }); db.save(); chqPrint(c); return c;
  }
  // Satış danışmanları (aktif kullanıcılar) ve kampanyanın bugün geçerli olup olmadığı
  const reps = () => db.all('users', (u) => u.active !== false).map((u) => u.name);
  const campOn = (c) => c.active && (!c.start || today() >= c.start) && (!c.end || today() <= c.end);
  // Kampanya indirimi: modelin kendi indirimi saklanır, kampanya bitince geri yüklenir
  function campApply(c, pct, quiet) {
    const ms = db.all('models', (m) => (c.scope === 'sezon' ? m.season === c.target : m.cat === c.target)); let low = 0;
    ms.forEach((m) => priceEdit(m, () => { if (pct > 0) { if (m.camp !== c.id) { m.ownDisc = Number(m.disc) || 0; m.camp = c.id; } m.disc = pct; } else if (m.camp === c.id) { m.disc = m.ownDisc || 0; delete m.camp; delete m.ownDisc; } }));
    c.applied = pct > 0; ms.forEach((m) => { if (m.disc > 0 && oldRef(m) < m.price) low++; }); const none = ms.filter((m) => m.disc > 0 && !oldRef(m)).length;
    syncOnline(ms); if (!quiet) toast(`${ms.length} modelde indirim ${pct ? '%' + pct : 'kaldırıldı'}${low ? ` · ${low} modelde son 10 günde daha düşük fiyat var, eski fiyat olarak o gösterilecek` : ''}${none ? ` (${none} modelde indirim gösterilemez: bu fiyat son 10 günde zaten uygulandı)` : ''}`, ms.length ? 'ok' : 'err');
  }
  // Tarihli kampanyalar kendiliğinden başlar/biter (eski kayıtlar: açıksa uygulanmış sayılır, veriye dokunulmaz)
  function campTick() {
    let ch = false; db.all('campaigns', (c) => c.type === 'yuzde').forEach((c) => { if (c.applied === undefined) { c.applied = !!c.active; ch = true; } const want = campOn(c); if (want !== c.applied) { campApply(c, want ? c.value : 0, true); ch = true; } });
    if (ch) db.save();
  }

  // ---------- "Bedeni gelince haber ver": müşteri talebi → mal kabulde eşleşenlere bildirim ----------
  const waitsFor = (m) => db.all('waits', (w) => w.status === 'bekliyor' && w.mid === m.id && m.variants.some((v) => v.stock > 0 && v.size === w.size && (!w.color || v.color === w.color)));
  async function addWait(m, customerId) {
    let c = customerId && cust(customerId);
    if (!c) { const q = await NS.prompt('Müşteri telefonu veya adı', ''); if (q === null) return; const d = String(q).replace(/\D/g, '').slice(-10);
      // Telefonda en az 7 hane eşleşmeli (boş rakam her numaraya "uyuyordu"); birden çok eşleşmede seçtirilir
      const hits = db.all('customers', (x) => (d.length >= 7 && String(x.phone).replace(/\D/g, '').endsWith(d)) || (String(q).trim().length >= 2 && NS.match(q, x.name, x.phone)));
      if (!hits.length) return toast('Müşteri bulunamadı — önce kasada veya Müşteriler sayfasında ekleyin', 'err');
      if (hits.length === 1) c = hits[0]; else { if (hits.length > 50) return toast(`${hits.length} müşteri eşleşti — daha ayrıntılı yazın`, 'err'); const p = await formModal({ title: 'Müşteri seçin', fields: [{ name: 'id', label: `${hits.length} müşteri eşleşti`, type: 'select', options: hits.map((x) => ({ value: x.id, label: `${x.name} · ${x.phone || '-'}` })) }] }); if (!p) return; c = cust(p.id); } }
    const v = await formModal({ title: `${m.name} — haber ver`, fields: [{ name: 'size', label: 'Beden', type: 'select', options: SZ(m.sizeType) }, { name: 'color', label: 'Renk', type: 'select', options: [{ value: '', label: 'Fark etmez' }, ...m.colors.map((x) => x.name)] }, { name: 'note', label: 'Not', full: true }], values: { size: c.size && SZ(m.sizeType).includes(c.size) ? c.size : SZ(m.sizeType)[0] } }); if (!v) return;
    db.insert('waits', { customer: c.id, mid: m.id, size: v.size, color: v.color, note: v.note, at: new Date().toISOString(), status: 'bekliyor' }); db.save();
    toast(`${c.name} için ${m.name} ${v.color || ''} ${v.size} listeye eklendi${c.kvkk ? '' : ' (SMS izni yok — gelince telefonla arayın)'}`, 'ok');
  }
  function notifyWaits(ws) {
    if (!ws.length) return;
    modal({ title: `${ws.length} müşteri bu bedeni bekliyordu`, size: 'wide', body: table({ rows: ws, columns: [{ label: 'Müşteri', render: (w) => { const c = cust(w.customer) || {}; return `<b>${esc(c.name || '-')}</b><div class="small faint">${esc(c.phone || '')}${c.kvkk ? '' : ' · SMS izni yok'}</div>`; } }, { label: 'İstenen', render: (w) => `${esc((model(w.mid) || {}).name || '')} · ${esc(w.color || 'her renk')} <b>${esc(w.size)}</b>` }, { label: 'Talep', render: (w) => NS.date(w.at) }], actions: [{ icon: 'message', act: 'sms', title: 'SMS gönder' }, { icon: 'check', act: 'done', title: 'Haber verildi (telefonla)' }] }),
      onOpen: (b) => on(b, 'click', '[data-act]', (e, t) => { const w = db.get('waits', t.dataset.id); const c = cust(w.customer); const m = model(w.mid);
        if (t.dataset.act === 'sms') { if (!c || !c.kvkk) return toast('SMS izni yok — telefonla arayıp “Haber verildi” işaretleyin', 'err'); smsSend(c, `Merhaba ${c.name.split(' ')[0]}, beklediğiniz ${m.name} ${w.color || ''} ${w.size} bedeni ${S().bizName}'e geldi. Sizin için ayırabiliriz.`); }
        w.status = 'bildirildi'; w.doneAt = new Date().toISOString(); db.save(); t.closest('tr').style.opacity = .45; }) });
  }

  // ---------- Stok hareketleri ve mal kabul ----------
  function moves(m) {
    const rs = db.all('moves', (x) => x.mid === m.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
    modal({ title: `${m.name} — stok hareketleri`, size: 'wide', body: table({ rows: rs, empty: 'Henüz hareket yok (bu sürümden önceki işlemler kayıtlı değil)', emptyIcon: 'layers', columns: [{ label: 'Tarih', render: (x) => `<span class="small">${NS.dt(x.at)}</span>` }, { label: 'İşlem', render: (x) => `${esc(MOVE[x.type] || x.type)}<div class="small faint">${esc(x.ref)}${x.user ? ' · ' + esc(x.user) : ''}</div>` }, { label: 'Renk / beden', render: (x) => `${esc(x.color)} · <b>${esc(x.size)}</b>` }, { label: 'Adet', cls: 'right', render: (x) => `<b style="color:var(--${x.qty < 0 ? 'err' : 'ok'})">${x.qty > 0 ? '+' : ''}${x.qty}</b>` }] }) });
  }
  // Tedarikçiden gelen ürün: model seç → beden × renk adetleri → stok + hareket + isteğe bağlı etiket
  function receive(after) {
    const ms = db.all('models').sort((a, b) => a.name.localeCompare(b.name, 'tr')); if (!ms.length) return toast('Önce model ekleyin', 'err');
    const grid = (m) => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${SZ(m.sizeType).map((x) => `<th class="center">${esc(x)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${SZ(m.sizeType).map((x) => { const v = m.variants.find((y) => y.size === x && y.color === c.name); return `<td class="center">${v ? `<input class="input" type="number" min="0" data-kb="${v.barcode}" placeholder="0" title="Mevcut: ${v.stock}" style="width:60px;height:32px;text-align:right">` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    modal({ title: 'Mal kabul', size: 'wide', body: `<div class="form-grid" style="grid-template-columns:2fr 1fr 1fr 1fr;gap:10px"><div class="field"><label>Model</label><select class="input" id="kbm">${ms.map((m) => `<option value="${m.id}">${esc(m.name)} · ${esc(m.code)}</option>`).join('')}</select></div><div class="field"><label>Tedarikçi</label><input class="input" id="kbs"></div><div class="field"><label>İrsaliye / fatura no</label><input class="input" id="kbd"></div><div class="field"><label>Birim alış (₺)</label><input class="input" type="number" step="0.01" id="kbc"></div></div><div id="kbg" class="mt"></div><label class="check mt"><input type="checkbox" id="kbl" checked> Gelen adet kadar etiket hazırla</label>`,
      onOpen: (b) => { const sel = $('#kbm', b); const show = () => { const m = model(sel.value); $('#kbg', b).innerHTML = grid(m); $('#kbc', b).value = m.cost || ''; }; sel.onchange = show; show(); },
      actions: [{ label: 'Vazgeç' }, { label: 'Stoğa ekle', cls: 'primary', onClick: (close, b) => {
        const m = model($('#kbm', b).value); const ref = [$('#kbs', b).value.trim(), $('#kbd', b).value.trim()].filter(Boolean).join(' · ') || 'Mal kabul';
        const got = $$('[data-kb]', b).map((i) => ({ v: m.variants.find((x) => x.barcode === i.dataset.kb), n: Math.max(0, Math.floor(Number(i.value) || 0)) })).filter((x) => x.v && x.n);
        if (!got.length) return toast('Gelen adetleri girin', 'err');
        got.forEach(({ v, n }) => { v.stock += n; move(m, v, n, 'kabul', ref); }); const c = Number($('#kbc', b).value); if (c > 0) m.cost = c;
        db.log('Mal kabul', `${m.code} · ${sum(got, (x) => x.n)} adet · ${ref}`); db.save(); syncOnline([m]); close(); toast(`${m.name}: ${sum(got, (x) => x.n)} adet stoğa eklendi`, 'ok'); if (after) after();
        if ($('#kbl', b).checked) goLabels(got); notifyWaits(waitsFor(m));
      } }] });
  }

  function sizeSets() {
    const body = () => table({ rows: Object.keys(allSets()).map((k) => ({ id: k, n: db.all('models', (m) => m.sizeType === k).length })), columns: [{ label: 'Takım', render: (x) => `<b>${esc(setName(x.id))}</b>${B.SIZES[x.id] ? ' <span class="small faint">hazır</span>' : ''}` }, { label: 'Bedenler', render: (x) => esc(SZ(x.id).join(', ')) }, { label: 'Model', cls: 'right', key: 'n' }], actions: [{ icon: 'trash', act: 'del', title: 'Sil', show: (x) => !B.SIZES[x.id] && !x.n }] });
    modal({ title: 'Beden takımları', size: 'wide', body: `<div id="szt">${body()}</div><p class="small muted">Hazır takımlar değiştirilemez. Kullanılan takım silinemez. Yeni takım: ör. büyük beden “46, 48, 50, 52, 54”, çocuk “2-3 yaş, 4-5 yaş…”, kemer “85, 90, 95, 100”.</p>`,
      onOpen: (b) => on(b, 'click', '[data-act=del]', async (e, t) => { if (!(await confirm('Beden takımı silinsin mi?'))) return; const st = S(); delete st.sizeSets[t.dataset.id]; if (st.sizeNames) delete st.sizeNames[t.dataset.id]; db.save(); $('#szt', b).innerHTML = body(); }),
      actions: [{ label: 'Kapat' }, { label: 'Yeni takım', cls: 'primary', icon: 'plus', onClick: async (c, b) => {
        const v = await formModal({ title: 'Yeni beden takımı', fields: [{ name: 'name', label: 'Takım adı', required: true, placeholder: 'Büyük beden' }, { name: 'sizes', label: 'Bedenler (sırasıyla, virgülle)', required: true, full: true, placeholder: '46, 48, 50, 52, 54' }] }); if (!v) return;
        const sz = [...new Set(v.sizes.split(',').map((x) => x.trim().toLocaleUpperCase('tr-TR')).filter(Boolean))]; if (!sz.length || sz.length > 20) return toast('1–20 beden girin', 'err');
        const st = S(); st.sizeSets = st.sizeSets || {}; st.sizeNames = st.sizeNames || {}; const k = 'o' + NS.uid().slice(0, 6); st.sizeSets[k] = sz; st.sizeNames[k] = v.name.trim(); db.save(); $('#szt', b).innerHTML = body(); toast('Beden takımı eklendi', 'ok'); } }] });
  }

  // ---------- Excel / CSV'den model aktarımı: her satır bir beden/renk; var olan model ve varyant ezilmez, eksik varyant eklenir ----------
  function importModels(after) {
    const norm = (k) => NS.trLower(String(k)).replace(/[^a-z0-9çğıöşü]/g, '');
    const COLS = { code: ['modelkodu', 'kod', 'stokkodu'], name: ['modeladi', 'modeladı', 'urunadi', 'ürünadı', 'ad'], cat: ['kategori', 'grup'], season: ['sezon'], color: ['renk'], size: ['beden', 'numara'], barcode: ['barkod'], stock: ['stok', 'adet', 'miktar'], cost: ['alis', 'alış', 'alisfiyati', 'alışfiyatı'], price: ['satis', 'satış', 'satisfiyati', 'satışfiyatı', 'fiyat'] };
    const typeOf = (sizes) => Object.keys(allSets()).find((t) => sizes.every((x) => SZ(t).includes(x)));
    NS.readSheet().then((sh) => {
      const rows = sh.rows || []; if (!rows.length) return toast('Dosyada satır yok', 'err');
      const keys = Object.keys(rows[0]); const col = {}; Object.entries(COLS).forEach(([k, al]) => { const h = keys.find((x) => al.includes(norm(x))); if (h) col[k] = h; });
      if (!col.code || !col.color || !col.size) return toast('Gerekli sütunlar: Model kodu, Renk, Beden (bulunan: ' + keys.join(', ') + ')', 'err');
      const num = (v) => Number(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.')) || 0; const errs = []; const groups = new Map();
      rows.forEach((r, i) => { const g = (k) => (col[k] ? String(r[col[k]] == null ? '' : r[col[k]]).trim() : ''); const code = g('code').toUpperCase(); if (!code) return errs.push(`Satır ${i + 2}: model kodu boş`); if (!groups.has(code)) groups.set(code, []); groups.get(code).push({ i: i + 2, name: g('name'), cat: g('cat'), season: g('season'), color: g('color'), size: g('size').toLocaleUpperCase('tr-TR'), barcode: g('barcode'), stock: Math.max(0, Math.floor(num(g('stock')))), cost: num(g('cost')), price: num(g('price')) }); });
      const plan = []; const usedBc = new Set(db.all('models').flatMap((m) => m.variants.map((v) => v.barcode)));
      groups.forEach((rs, code) => {
        const ex = db.find('models', (m) => String(m.code).toUpperCase() === code); const sizes = [...new Set(rs.map((x) => x.size))]; const st = ex ? ex.sizeType : typeOf(sizes);
        if (!st || (ex && !sizes.every((x) => SZ(st).includes(x)))) return errs.push(`${code}: beden(ler) tanınmadı (${sizes.join(', ')}) — kullanılabilir: ${Object.values(allSets()).map((a) => a.join('/')).join(' · ')} — yeni takımı Ürünler > Beden takımları'ndan ekleyin`);
        if (!ex && !rs[0].name) return errs.push(`${code}: yeni model için model adı gerekli`);
        const add = rs.filter((x) => !(ex && ex.variants.some((v) => v.size === x.size && v.color === x.color))).filter((x) => { if (x.barcode && usedBc.has(x.barcode)) { errs.push(`Satır ${x.i}: barkod ${x.barcode} başka üründe kayıtlı`); return false; } if (x.barcode) usedBc.add(x.barcode); return true; });
        plan.push({ code, ex, st, rs, add });
      });
      const nNew = plan.filter((x) => !x.ex).length, nVar = sum(plan, (x) => x.add.length);
      modal({ title: 'Excel aktarımı — önizleme', size: 'wide', body: `<div class="grid g3 mb">${kpi('Yeni model', nNew, 'plus', 'ok')}${kpi('Eklenecek beden/renk', nVar, 'grid', 'info')}${kpi('Hata', errs.length, 'alert', errs.length ? 'err' : 'ok')}</div><p class="small muted">Var olan modellerin bilgisi ve var olan beden/renklerin stoğu değiştirilmez; yalnızca eksik beden/renk eklenir. Barkodu boş satırlara barkod üretilir.</p>${errs.length ? `<div class="lbs-sum" style="max-height:200px;overflow:auto">${errs.slice(0, 200).map((e) => `<div class="small">${esc(e)}</div>`).join('')}</div>` : ''}`,
        actions: [{ label: 'Vazgeç' }, { label: `Aktar (${nVar} satır)`, cls: 'primary', onClick: (close) => {
          if (!nVar) return toast('Aktarılacak satır yok', 'err'); let seq = Date.now() % 1e6; const PAL = ['#111827', '#f1ead9', '#d6c3a5', '#6b705c', '#1e3a5f', '#7f1d1d', '#e8b4b8', '#5b8bd0'];
          plan.forEach(({ code, ex, st, rs, add }) => {
            const f0 = rs[0]; const m = ex || db.insert('models', { code, name: f0.name, cat: f0.cat || 'Genel', sizeType: st, season: B.SEASONS.includes(f0.season) ? f0.season : B.SEASONS[B.SEASONS.length - 1], cost: f0.cost, price: f0.price, disc: 0, online: false, colors: [], variants: [] });
            add.forEach((x) => { if (!m.colors.some((c) => c.name === x.color)) m.colors.push({ name: x.color, hex: PAL[m.colors.length % PAL.length] }); let bc = x.barcode; while (!bc || db.all('models').some((mm) => mm.variants.some((v) => v.barcode === bc))) bc = B.ean('86955' + String(seq++).padStart(7, '0')); const v = { size: x.size, color: x.color, barcode: bc, stock: x.stock }; m.variants.push(v); move(m, v, x.stock, 'kabul', 'Excel aktarımı'); });
          });
          db.log('Excel aktarımı', `${nNew} model, ${nVar} beden/renk`); db.save(); close(); toast(`${nNew} yeni model, ${nVar} beden/renk aktarıldı`, 'ok'); if (after) after(); } }] });
    }).catch((e) => { if (e) toast('Dosya okunamadı: ' + (e.message || e), 'err'); });
  }

  // ---------- Değişim / iade ----------
  function exchangePage(el, p, app) {
    el.innerHTML = pageHead('Değişim & İade', `Fiş barkodunu okutun · ${S().exchangeDays || 30} gün içinde değişim`) + `<div class="grid g-21"><div class="col" style="gap:16px"><div class="card pad"><input class="input" id="fs" placeholder="Fiş no (F5123) okutun" style="height:52px;font-size:18px" autocomplete="off"></div><div id="sale"></div></div><div class="card"><div class="card-h"><h3>Son işlemler</h3></div><div id="rl"></div></div></div>`;
    const list = () => { $('#rl', el).innerHTML = table({ rows: db.all('returns').sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12), empty: 'İşlem yok', columns: [{ label: 'Fiş', render: (r) => `<b class="mono">${esc(r.saleNo)}</b><div class="small faint">${NS.dt(r.at)}</div>` }, { label: 'İşlem', render: (r) => (r.type === 'iade' ? badge('İade ' + money(r.refund), 'err') : badge('Değişim', 'info')) }, { label: 'Ürün', render: (r) => `<span class="small">${(r.qty || 1) > 1 ? r.qty + ' × ' : ''}${esc(r.line.name)} ${esc(r.line.size)}${r.newLine ? ` → ${r.newLine.name && r.newLine.name !== r.line.name ? esc(r.newLine.name) + ' ' : ''}${esc(r.newLine.size)} ${esc(r.newLine.color)}` : ''}${r.cheque ? ' · çek ' + esc(r.cheque) : ''}</span>` }] }); };
    // Satırdan daha önce iade/değişim yapılan adet (eski kayıtlarda adet yoksa 1)
    const done = (s, i, l) => sum(db.all('returns', (r) => r.saleNo === s.no && (r.li !== undefined ? r.li === i : r.line.barcode === l.barcode)), (r) => r.qty || 1);
    const show = (s) => {
      const age = (Date.now() - new Date(s.at)) / 864e5; const late = age > (Number(S().exchangeDays) || 30);
      const rows = s.lines.map((l, i) => ({ ...l, id: i, left: l.qty - done(s, i, l) }));
      $('#sale', el).innerHTML = `<div class="card"><div class="card-h"><b>${esc(s.no)}</b><span class="small muted">${NS.dt(s.at)} · ${money(s.total)}</span><span class="grow"></span>${late ? badge(`${Math.floor(age)} gün geçmiş — yönetici onayı gerekir`, 'err') : badge(`${Math.floor(age)}. gün`, 'ok')}</div>${table({ rows, columns: [{ label: 'Ürün', render: (l) => `<b>${esc(l.name)}</b><div class="small faint">${esc(l.color)} · ${esc(l.size)}${l.qty > 1 ? ` · ${l.qty} adet` : ''}</div>` }, { label: 'Ödenen', cls: 'right', render: (l) => money(l.price) }, { label: 'Durum', render: (l) => (l.left <= 0 ? badge('İade/değişim yapıldı') : l.left < l.qty ? badge(`${l.left} adet kaldı`, 'warn') : '') }], actions: [{ icon: 'refresh', act: 'ex', title: 'Değiştir', show: (l) => l.left > 0 }, { icon: 'cash', act: 'rf', title: 'İade et', show: (l) => l.left > 0 }] })}</div>`;
      const box = $('#sale', el); box.onclick = async (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return; const i = Number(b.dataset.id); const l = s.lines[i]; const left = l.qty - done(s, i, l); if (left <= 0) return toast('Bu ürün için iade/değişim zaten yapıldı', 'err');
        if (late && !(await adminOk(`${s.no} fişinin değişim süresi geçmiş (${Math.floor(age)} gün)`))) return;
        const f = findV(l.barcode); const cu = s.customer && cust(s.customer);
        if (b.dataset.act === 'rf') {
          const how = [{ value: 'nakit', label: 'Nakit iade' }, { value: 'kart', label: 'Karta iade' }, { value: 'cek', label: 'İade çeki ver (sonraki alışverişte)' }, ...(cu ? [{ value: 'puan', label: 'Puan olarak' }] : [])];
          const v = await formModal({ title: `İade — ${l.name}`, fields: [...(left > 1 ? [{ name: 'qty', label: `Adet (en çok ${left})`, type: 'number', required: true }] : []), { name: 'reason', label: 'Neden', type: 'select', options: ['Beden uymadı', 'Renk beğenilmedi', 'Kusurlu ürün', 'Vazgeçti'] }, { name: 'how', label: 'Ödeme', type: 'select', options: how }], values: { qty: left, how: (s.pays && s.pays.length === 1 && s.pays[0].type === 'puan') || s.pay === 'puan' ? 'puan' : s.pay === 'nakit' ? 'nakit' : 'kart' } }); if (!v) return;
          const qty = Math.min(left, Math.max(1, Math.floor(Number(v.qty) || 1))); const refund = l.price * qty;
          if (f) { f.v.stock += qty; move(f.m, f.v, qty, 'iade', s.no); }
          // Puan düzeltmesi: bu üründen kazanılan puan geri alınır; puanla iade seçildiyse tutar puan olarak yüklenir
          let ptsBack = 0; if (cu) { const earnedRate = s.total ? (s.pts !== undefined ? s.pts : s.pay === 'puan' ? 0 : Math.round((s.total * (Number(S().pointPct) || 3)) / 100)) / s.total : 0; ptsBack = Math.round(refund * earnedRate); cu.points = (cu.points || 0) - ptsBack + (v.how === 'puan' ? refund : 0); }
          const chq = v.how === 'cek' ? chqIssue(refund, 'iade', s.customer, s.no) : null;
          db.insert('returns', { saleNo: s.no, li: i, qty, at: new Date().toISOString(), type: 'iade', line: l, reason: v.reason, refund, how: v.how, ptsBack, cheque: chq ? chq.code : '' });
          db.save(); syncOnline(f ? [f.m] : []); toast(`${money(refund)} iade edildi${v.how === 'puan' ? ' (puan olarak)' : v.how === 'cek' ? ` (iade çeki ${chq.code})` : ''}, ürün stoğa döndü${ptsBack ? ` · ${ptsBack} kazanılmış puan geri alındı` : ''}`, 'ok'); list(); show(s);
        } else {
          const m = model(l.mid); if (!m) return toast('Model artık kayıtlı değil', 'err');
          // Aynı modelde fark alınmaz; başka modelde yeni fiyat − ödenen fiyat kadar fark alınır / iade edilir
          const swap = async (m2, nv, close) => {
            const diff = m2.id === m.id ? 0 : unit(m2) - l.price; let how = '';
            if (diff) { const v = await formModal({ title: diff > 0 ? `Fark tahsilatı: ${money(diff)}` : `Fark iadesi: ${money(-diff)}`, fields: [{ name: 'how', label: diff > 0 ? 'Müşteri öder' : 'Müşteriye', type: 'select', options: diff > 0 ? [{ value: 'nakit', label: 'Nakit' }, { value: 'kart', label: 'Kredi kartı' }] : [{ value: 'nakit', label: 'Nakit iade' }, { value: 'kart', label: 'Karta iade' }, { value: 'cek', label: 'İade çeki' }] }] }); if (!v) return; how = v.how; }
            nv.stock--; move(m2, nv, -1, 'degisim', s.no); const ov = m.variants.find((x) => x.barcode === l.barcode); if (ov) { ov.stock++; move(m, ov, 1, 'degisim', s.no); }
            const chq = diff < 0 && how === 'cek' ? chqIssue(-diff, 'iade', s.customer, s.no) : null;
            db.insert('returns', { saleNo: s.no, li: i, qty: 1, at: new Date().toISOString(), type: 'degisim', line: l, newLine: { mid: m2.id, name: m2.name, size: nv.size, color: nv.color, barcode: nv.barcode, qty: 1, price: m2.id === m.id ? l.price : unit(m2), cost: m2.cost }, reason: m2.id === m.id ? 'Beden/renk değişimi' : 'Başka modelle değişim', refund: diff < 0 ? -diff : 0, extra: diff > 0 ? diff : 0, how, cheque: chq ? chq.code : '' });
            db.save(); syncOnline([...new Set([m, m2])]); close(); toast(`Değişim yapıldı${diff > 0 ? ` · ${money(diff)} fark alındı` : diff < 0 ? ` · ${money(-diff)} fark iade edildi` : ''}`, 'ok'); list(); show(s);
            NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><b>${esc(S().bizName)}</b><br>DEĞİŞİM FİŞİ · ${NS.dt(new Date())}<hr>Fiş: ${esc(s.no)}<br>Alınan: ${esc(l.name)} ${esc(l.color)}/${esc(l.size)} (${money(l.price)})<br>Verilen: ${esc(m2.name)} ${esc(nv.color)}/${esc(nv.size)}${diff ? ` (${money(unit(m2))})` : ''}<hr>${diff > 0 ? `Tahsil edilen fark: ${money(diff)} · ${esc(B.PAY[how])}` : diff < 0 ? `İade edilen fark: ${money(-diff)} · ${how === 'cek' ? 'İade çeki ' + esc(chq.code) : esc(B.PAY[how])}` : 'Fiyat farkı yok'}<hr><b>BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</b></div>`, { title: 'Değişim' });
          };
          modal({ title: `Değişim — ${m.name} (${l.color} ${l.size})`, size: 'wide', body: `${matrix(m)}<p class="small muted mt">Aynı modelden yeni beden/renk seçin:</p><div class="row" style="flex-wrap:wrap;gap:6px">${m.variants.filter((x) => x.stock > 0 && x.barcode !== l.barcode).map((x) => `<button class="btn sm" data-nv="${x.barcode}">${esc(x.color)} ${esc(x.size)}</button>`).join('') || '<span class="small muted">Bu modelde başka beden/renk stokta yok.</span>'}</div><div class="field mt"><label>ya da başka bir ürünün barkodunu okutun (fiyat farkı hesaplanır)</label><input class="input mono" id="xo" autocomplete="off" placeholder="Barkod"></div>`,
            onOpen: (bx, close) => { on(bx, 'click', '[data-nv]', (ev, t) => swap(m, m.variants.find((x) => x.barcode === t.dataset.nv), close));
              $('#xo', bx).addEventListener('keydown', (ev) => { if (ev.key !== 'Enter') return; const fv = findV(ev.target.value); if (!fv) return toast('Barkod kayıtlı değil', 'err'); if (fv.v.barcode === l.barcode) return toast('Aynı ürün', 'err'); if (fv.m.passive) return toast('Bu model satıştan kaldırılmış', 'err'); swap(fv.m, fv.v, close); }); setTimeout(() => $('#xo', bx).focus(), 50); } });
        }
      };
    };
    $('#fs', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const s = db.find('sales', (x) => x.no.toLowerCase() === e.target.value.trim().toLowerCase()); if (!s) return toast('Fiş bulunamadı', 'err'); e.target.value = ''; show(s); });
    list(); setTimeout(() => $('#fs', el).focus(), 50);
  }

  // ---------- Ürünler ----------
  function productsPage(el, p, app) {
    let q = '', f = p || '';
    el.innerHTML = pageHead('Ürünler & Stok', 'Model bazında beden × renk stok matrisi', `<button class="btn" id="lbl">${icon('tag')} Etiket bas</button><button class="btn" id="kb">${icon('download')} Mal kabul</button><button class="btn" id="xl">${icon('upload')} Excel'den aktar</button><button class="btn" id="sz">${icon('grid')} Beden takımları</button><button class="btn primary" id="add">${icon('plus')} Yeni model</button>`) + onlineBar() + `<div class="card"><div class="card-h">${NS.searchBox('q', 'Model, kod, kategori...')}<div class="seg">${[['', 'Tümü'], ['az', 'Azalan beden'], ['indirim', 'İndirimde'], ['online', 'Online satışta'], ['olu', 'Satmayan (60 gün)'], ['pasif', 'Pasif']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div><div id="t"></div></div>`;
    // Satış adetleri bir kez hesaplanır (binlerce modelde her satır için tüm satışları taramamak için)
    const soldMap = (days) => { const from = addDays(new Date(), -days).toISOString(); const r = new Map(); db.all('sales', (x) => x.at > from).forEach((x) => x.lines.forEach((l) => r.set(l.mid, (r.get(l.mid) || 0) + l.qty))); return r; };
    let S30 = soldMap(30), S60 = soldMap(60); const sold = (m, days) => (days === 30 ? S30 : S60).get(m.id) || 0;
    const rows = () => db.all('models', (m) => NS.match(q, m.name, m.code, m.cat) && (f === 'pasif' ? m.passive : !m.passive && (!f || (f === 'az' ? m.variants.some((v) => v.stock <= (Number(S().lowStock) || 2)) : f === 'indirim' ? m.disc > 0 : f === 'online' ? m.online : sold(m, 60) === 0))));
    if ($('#ols', el)) $('#ols', el).onclick = async (e) => { e.target.disabled = true; const ms = db.all('models', (m) => m.online && !m.passive); const r = await syncOnline(ms); e.target.disabled = false; if (!r) return toast('Online işaretli model yok', 'warn'); if (r.ok) toast(r.msg, r.mode === 'canli' ? 'ok' : 'warn'); app.refresh(); };
    const draw = () => { S30 = soldMap(30); S60 = soldMap(60); const all = rows(); const LIM = 200; $('#t', el).innerHTML = (all.length > LIM ? `<p class="small muted" style="padding:8px 16px;margin:0">${all.length} modelden ilk ${LIM} tanesi gösteriliyor — aramayı daraltın.</p>` : '') + table({ rows: all.slice(0, LIM), emptyIcon: 'tag', columns: [
      { label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint"><span class="mono">${esc(m.code)}</span> · ${esc(m.cat)} · ${esc(m.season)}</div>` },
      { label: 'Renkler', render: (m) => m.colors.map((c) => sw(c.hex)).join(' ') },
      { label: 'Bedenler', render: (m) => `<div class="row" style="gap:3px;flex-wrap:wrap">${SZ(m.sizeType).map((s) => { const n = sum(m.variants.filter((v) => v.size === s), (v) => v.stock); return `<span class="badge ${n === 0 ? 'err' : n <= 2 ? 'warn' : ''}" title="${n} adet">${esc(s)}</span>`; }).join('')}</div>` },
      { label: 'Stok', cls: 'right', render: (m) => `<b>${mStock(m)}</b>` },
      { label: 'Fiyat', cls: 'right', render: (m) => (oldRef(m) ? `<s class="faint small">${money(oldRef(m))}</s> <b>${money(unit(m))}</b><div>${badge('%' + pctOff(m), 'err')}${oldRef(m) < m.price ? ` <span class="small" title="Son 10 günde daha düşük fiyat uygulandığı için eski fiyat olarak o gösterilir (Yönetmelik m.14/3)">${icon('alert')}</span>` : ''}</div>` : `<b>${money(unit(m))}</b>${m.disc ? `<div class="small faint" title="Bu fiyat son 10 günde zaten uygulandığı için indirim olarak gösterilemez">%${m.disc} uygulanıyor · eski fiyat gösterilmez</div>` : ''}`) },
      { label: '30 gün satış', cls: 'right', render: (m) => sold(m, 30) },
      { label: 'Online', render: (m) => (m.online ? badge(kanal().mode === 'canli' ? 'Gönderiliyor' : 'İşaretli', kanal().mode === 'canli' ? 'ok' : '') : '') },
    ], actions: [{ icon: 'grid', act: 'mx', title: 'Stok matrisi' }, { icon: 'edit', act: 'ed' }] }); };
    const edit = async (m) => {
      let kat = null;
      const v = await formModal({ title: m ? m.name : 'Yeni model', size: 'wide', fields: [...(m ? [] : [{ name: 'gtin', label: 'Üretici barkodu (varsa okutun, ad ve kategori dolar)', full: true }]), { name: 'name', label: 'Model adı', required: true, full: true }, { name: 'code', label: 'Model kodu', required: true }, { name: 'cat', label: 'Kategori', required: true }, { name: 'sizeType', label: 'Beden takımı', type: 'select', options: Object.keys(allSets()).map((k) => ({ value: k, label: `${setName(k)} (${SZ(k).join(', ')})` })) }, { name: 'season', label: 'Sezon', type: 'select', options: B.SEASONS }, { name: 'colorsStr', label: 'Renkler (virgülle)', full: true, placeholder: 'Siyah, Ekru, Bej' }, { name: 'cost', label: 'Alış (₺)', type: 'number', step: '0.01' }, { name: 'price', label: 'Satış (₺)', type: 'number', step: '0.01' }, { name: 'disc', label: 'İndirim %', type: 'number' }, { name: 'online', label: 'Online / pazaryerinde sat', type: 'checkbox' }, ...(m ? [{ name: 'passive', label: 'Satıştan kaldır (pasif) — kasada ve etikette görünmez, geçmiş korunur', type: 'checkbox', full: true }] : [])], values: m ? { ...m, colorsStr: m.colors.map((c) => c.name).join(', ') } : { sizeType: 'harf', season: B.SEASONS[0], online: true, code: 'LB' + (2600 + db.all('models').length) }, onOpen: (b) => { if (!m) kat = NS.katalog.formaBagla(b, { barkod: 'gtin', ad: 'name', kategori: 'cat' }); } });
      if (!v) return; if (v.gtin && !(kat && kat.hit)) NS.katalog.oner([{ gtin: v.gtin, ad: v.name, kategori: v.cat }]); delete v.gtin;
      const names = v.colorsStr.split(',').map((x) => x.trim()).filter(Boolean); delete v.colorsStr;
      v.price = Number(v.price) || 0; v.cost = Number(v.cost) || 0; v.disc = Math.min(90, Math.max(0, Number(v.disc) || 0));
      const rec = m || db.insert('models', { ...v, colors: [], variants: [] }); if (m) priceEdit(rec, () => Object.assign(rec, v)); else Object.assign(rec, v);
      if (m && m.disc > 0 && oldRef(m) < m.price) toast(`Son 10 günde daha düşük fiyat (${money(oldRef(m))}) uygulanmış: etikette ve kasada eski fiyat olarak o gösterilecek`, 'err');
      const PAL = ['#111827', '#f1ead9', '#d6c3a5', '#6b705c', '#1e3a5f', '#7f1d1d', '#e8b4b8', '#5b8bd0'];
      rec.colors = names.map((n, i) => rec.colors.find((c) => c.name === n) || { name: n, hex: PAL[i % PAL.length] });
      // Yeni beden/renk kombinasyonları stok 0 ile eklenir, mevcutlar korunur
      let seq = Date.now() % 1e6;
      rec.colors.forEach((c) => SZ(rec.sizeType).forEach((s) => { if (!rec.variants.find((x) => x.size === s && x.color === c.name)) rec.variants.push({ size: s, color: c.name, barcode: B.ean('86955' + String(seq++).padStart(7, '0')), stock: 0 }); }));
      rec.variants = rec.variants.filter((x) => names.includes(x.color) && SZ(rec.sizeType).includes(x.size));
      db.save(); syncOnline([rec]); toast('Kaydedildi', 'ok'); draw(); if (!m) mx(rec);
    };
    const mx = (m) => modal({ title: `${m.name} — stok`, size: 'wide', body: matrix(m, true) + `<p class="small muted mt">Sayım sonucunu girip kaydedin. ${esc(m.online && S().online !== false ? kanal().text : 'Bu model online kanala gönderilmez.')}</p>`, actions: [{ label: 'Hareketler', icon: 'layers', onClick: () => moves(m) }, { label: 'Etiket bas', icon: 'tag', onClick: (c) => { c(); goLabels(m.variants.filter((v) => v.stock > 0).map((v) => ({ v, n: v.stock }))); } }, { label: 'Kaydet', cls: 'primary', onClick: (c, b) => { $$('[data-bc]', b).forEach((i) => { const v = m.variants.find((x) => x.barcode === i.dataset.bc); const n = Math.max(0, Math.floor(Number(i.value) || 0)); move(m, v, n - v.stock, 'sayim', 'Sayım'); v.stock = n; }); db.log('Stok sayımı', m.code); db.save(); syncOnline([m]); c(); draw(); toast('Stok güncellendi', 'ok'); } }] });
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act=ed]', (e, b) => edit(model(b.dataset.id)));
    on(el, 'click', '[data-act=mx]', (e, b) => mx(model(b.dataset.id)));
    $('#add', el).onclick = () => edit(null);
    $('#kb', el).onclick = () => receive(draw);
    $('#xl', el).onclick = () => importModels(draw);
    $('#sz', el).onclick = () => sizeSets();
    $('#lbl', el).onclick = () => { const it = rows().flatMap((m) => m.variants.filter((v) => v.stock > 0).map((v) => ({ v, n: 1 }))); if (!it.length) return toast('Listede stoklu ürün yok', 'err'); goLabels(it); };
    draw();
  }
  // ---------- Etiket: çekirdek tasarımcı (NS.labels) + butik alanları (renk, beden, indirimli fiyat, logo) ----------
  // Çekirdek alanlar butik anlamıyla adlandırılır: unit = beden, cat = renk (bağlam), biz = mağaza adı. Logo, zemini resim olan kutu öğesidir.
  if (NS.labels) { const F = NS.labels.FIELDS; Object.assign(F, { name: 'Model adı', price: 'Satış fiyatı (indirimli)', old: 'Eski fiyat (yalnız indirimde)', unit: 'Beden', cat: 'Renk', biz: 'Mağaza adı', code: 'Barkod numarası' }); delete F.unitPrice; delete F.shelf; }
  const LE = (f, x, y, w, h, o = {}) => ({ id: NS.uid(), f, x, y, w, h, size: 8, bold: false, align: 'left', color: '#000000', ...o });
  const LB_PRESETS = () => [
    { id: 'askili', name: 'Askı etiketi 40×60', w: 40, h: 60, els: [LE('box', 10, 2, 20, 8, { logo: true }), LE('biz', 2, 10.5, 36, 4, { size: 7, align: 'center' }), LE('name', 2, 15, 36, 5, { size: 8, bold: true, align: 'center' }), LE('cat', 2, 20.5, 36, 4, { size: 7.5, align: 'center' }), LE('unit', 2, 25, 36, 10, { size: 24, bold: true, align: 'center' }), LE('barcode', 3, 35.5, 34, 13), LE('old', 2, 50.5, 16, 5, { size: 8 }), LE('price', 14, 49.5, 24, 9, { size: 15, bold: true, align: 'right' })] },
    { id: 'barkod', name: 'Barkod etiketi 50×30', w: 50, h: 30, els: [LE('name', 2, 1.5, 46, 5, { size: 8, bold: true }), LE('cat', 2, 6.5, 30, 4.5, { size: 7 }), LE('unit', 32, 6, 16, 5.5, { size: 13, bold: true, align: 'right' }), LE('barcode', 2, 11.5, 46, 12), LE('old', 2, 24.3, 20, 5, { size: 8 }), LE('price', 20, 24, 28, 5.5, { size: 12, bold: true, align: 'right' })] },
    { id: 'indirim', name: 'İndirim etiketi 60×40', w: 60, h: 40, els: [LE('box', 0, 0, 60, 8, { bg: '#db2777' }), LE('text', 3, 1, 54, 6, { size: 11, bold: true, color: '#ffffff', text: 'İNDİRİM' }), LE('name', 3, 9.5, 54, 5, { size: 9, bold: true }), LE('cat', 3, 15, 36, 4.5, { size: 8 }), LE('unit', 40, 14, 17, 6, { size: 13, bold: true, align: 'right' }), LE('old', 3, 21, 30, 6, { size: 11 }), LE('price', 3, 26, 54, 12, { size: 26, bold: true, align: 'right', color: '#db2777' })] },
    { id: 'mini', name: 'Mini 30×20', w: 30, h: 20, els: [LE('unit', 1.5, 1, 12, 5.5, { size: 11, bold: true }), LE('cat', 13, 1.5, 15.5, 4.5, { size: 6, align: 'right' }), LE('barcode', 2, 6.5, 26, 7), LE('price', 1.5, 14, 27, 5, { size: 9, bold: true, align: 'center' })] },
  ];
  const lbTpls = () => { if (!Array.isArray(db.data.labelTpls) || !db.data.labelTpls.length) { db.data.labelTpls = LB_PRESETS(); db.save(); } return NS.labels.tpls(db); };
  const lbOpt = () => S().labelOpt || { tpl: '', roll: false };
  const lbProd = (m, v) => ({ name: m.name, price: unit(m), oldPrice: oldRef(m), barcode: v.barcode, unit: v.size });
  const lbCtx = (v) => ({ biz: S().bizName, cat: v.color, logo: S().logo || '' });
  const logoBg = () => (S().logo ? `url('${S().logo}') center/contain no-repeat` : 'transparent');
  // İndirimsiz üründe "eski fiyat" öğesi şablondan çıkarılır (çekirdek de artık gerçek eski fiyat yoksa boş bırakır)
  const lbFor = (t, m) => ({ ...t, els: t.els.filter((e) => e.f !== 'old' || oldRef(m) > 0).map((e) => (e.logo ? { ...e, bg: logoBg() } : e)) });
  const lbTpl = (id) => lbTpls().find((x) => x.id === id) || lbTpls()[0];
  const lbSample = () => { const m = db.all('models').find((x) => x.disc > 0) || db.all('models')[0]; return m && m.variants[0] ? { m, v: m.variants[0] } : null; };
  const lbPreview = (tplId, it) => { const t = lbTpl(tplId); it = it || lbSample(); const k = Math.min(2.2, 300 / (t.w * 3.78), 340 / (t.h * 3.78)); const p = it ? lbProd(it.m, it.v) : { name: 'Örnek model', price: 999, barcode: '8695500000001', unit: 'M' };
    return `<div class="lbp" style="width:${t.w * 3.78 * k}px;height:${t.h * 3.78 * k}px"><div style="transform:scale(${k});transform-origin:0 0">${NS.labels.labelHtml(it ? lbFor(t, it.m) : t, p, it ? lbCtx(it.v) : { biz: S().bizName, cat: 'Siyah' })}</div></div><div class="small muted center mt">${esc(t.name)} · ${t.w}×${t.h} mm</div>`; };
  const lbOptions = (sel) => lbTpls().map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  // items: [{ m, v, n }] — A4'e dizilir ya da etiket yazıcısında (sürücüyle) her etiket bir sayfa
  function lbPrint(items, tplId, roll) {
    const t = lbTpl(tplId); const all = items.flatMap(({ m, v, n }) => Array.from({ length: Math.max(1, n | 0) }, () => NS.labels.labelHtml(lbFor(t, m), lbProd(m, v), lbCtx(v))));
    if (!all.length) return toast('Basılacak etiket yok', 'err');
    const body = roll ? all.map((h) => `<div class="pg">${h}</div>`).join('') : `<div class="sheet">${all.join('')}</div>`;
    NS.printHtml(`<style>${NS.labels.CSS}@page{${roll ? `size:${t.w}mm ${t.h}mm;margin:0` : 'size:A4;margin:8mm'}}body{margin:0;padding:0}.pg{page-break-after:always}.sheet{display:flex;flex-wrap:wrap;gap:2mm}.sheet .lb{outline:.2mm dashed #bbb}</style>${body}`, { title: `${t.name} · ${all.length} etiket` });
    const now = new Date().toISOString(); new Set(items.map((x) => x.m)).forEach((m) => { m.lblAt = now; }); db.save();
  }
  function lbDesigner(onDone) {
    const it = lbSample(); const sample = it ? lbProd(it.m, it.v) : { name: 'Örnek model', price: 999, oldPrice: 1299, barcode: '8695500000001', unit: 'M' };
    lbTpls().forEach((t) => t.els.forEach((e) => { if (e.logo) e.bg = logoBg(); }));
    modal({ title: 'Etiket şablonları', size: 'xl', body: '<p class="small muted" style="margin:0 0 10px">Önizleme örnek modelle gösterilir. Mağaza logosu “Etiket Basımı” sayfasından yüklenir; şablona “Logo / görsel” öğesiyle başka bir görsel de eklenebilir.</p><div id="ldx"></div>', onOpen: (b) => NS.labels.designer($('#ldx', b), db, sample, (id) => { S().labelOpt = { ...lbOpt(), tpl: id }; db.save(); }, { ...(it ? lbCtx(it.v) : { biz: S().bizName, cat: 'Siyah' }), logo: S().logo || '' }), onClose: () => onDone && onDone() });
  }
  let lbPending = null; // Başka sayfadan gelen seçim: Map(barkod → adet)
  const goLabels = (items) => { lbPending = new Map(items.map(({ v, n }) => [v.barcode, n])); location.hash = '#/etiket'; };
  function labelsPage(el) {
    const sel = lbPending || new Map(); lbPending = null; let q = '', f = sel.size ? 'sec' : ''; const o = lbOpt(); let tpl = lbTpls().some((t) => t.id === o.tpl) ? o.tpl : lbTpls()[0].id, roll = !!o.roll;
    const changed = lblOld;
    const redraw = () => { lbPending = sel; labelsPage(el); };
    el.innerHTML = pageHead('Etiket Basımı', 'Askı, barkod ve indirim etiketlerini kendi tasarımınızla tek tek veya toplu basın', `<button class="btn" id="cam">${icon('camera')} Kamerayla okut</button><button class="btn" id="ed">${icon('edit')} Şablonları düzenle</button>`) +
      `<div class="lbw"><div class="card"><div class="card-h">${NS.searchBox('q', 'Model, kod, renk veya barkod...')}<div class="seg">${[['', 'Tümü'], ['fd', 'Fiyatı değişen'], ['ind', 'İndirimde'], ['sec', 'Seçilenler']].map(([v, l]) => `<button data-f="${v}" class="${v === f ? 'active' : ''}">${l}</button>`).join('')}</div></div>
        <div class="pad" style="padding-top:0"><input class="input" id="gun" autocomplete="off" placeholder="Barkod okuyucuyla okutun — her okutma 1 etiket ekler"></div><div id="tbl"></div></div>
        <aside class="card pad lbs"><h3>Önizleme</h3><div id="pv"></div>
          <div class="field mt"><label>Şablon</label><select class="input" id="tp">${lbOptions(tpl)}</select></div>
          <div class="field"><label>Çıktı</label><div class="seg" id="ro"><button data-r="0" class="${roll ? '' : 'active'}">A4 sayfa</button><button data-r="1" class="${roll ? 'active' : ''}">Etiket yazıcısı</button></div><p class="small muted" style="margin:6px 0 0">Etiket yazıcısında her etiket ayrı sayfa olarak, şablon ölçüsünde basılır. Yazdırma penceresinde etiket yazıcınızı seçin.</p></div>
          <div class="field"><label>Logo</label><div class="row nw" style="gap:6px;flex-wrap:wrap"><label class="btn sm">${icon('upload')} ${S().logo ? 'Değiştir' : 'Yükle'}<input type="file" accept="image/*" id="lg" hidden></label>${S().logo ? `<button class="btn sm" id="lga">Şablona ekle</button><button class="btn sm ghost" id="lgx">Kaldır</button>` : ''}</div></div>
          <div class="lbs-sum" id="sum"></div><button class="btn primary block" id="pr">${icon('print')} Seçilenleri yazdır</button><button class="btn ghost block" id="none">Seçimi temizle</button></aside></div>`;
    const V = () => { const r = []; db.all('models').forEach((m) => m.variants.forEach((v) => { if (sel.has(v.barcode)) r.push({ m, v, n: sel.get(v.barcode) }); })); return r; };
    const side = () => { const it = V(); $('#pv', el).innerHTML = lbPreview(tpl, it[0]); const n = sum(it, (x) => x.n); const nd = new Set(it.filter((x) => !oldRef(x.m)).map((x) => x.m)).size;
      $('#sum', el).innerHTML = it.length ? `<b>${new Set(it.map((x) => x.m)).size}</b> model · <b>${it.length}</b> beden/renk · <b>${n}</b> etiket${nd && lbTpl(tpl).els.some((e) => e.f === 'old') ? `<div class="small mt">${nd} modelde gösterilebilir indirim yok: eski fiyat basılmaz.</div>` : ''}` : 'Listeden model seçin, barkod okutun veya “Stok kadar” ile toplu ekleyin.'; };
    const rows = () => db.all('models', (m) => (!m.passive || f === 'sec') && (!q || NS.match(q, m.name, m.code, m.cat, ...m.colors.map((c) => c.name)) || m.variants.some((v) => v.barcode === q.trim())) && (!f || (f === 'fd' ? changed(m) : f === 'ind' ? m.disc > 0 : m.variants.some((v) => sel.has(v.barcode)))));
    const draw = () => {
      const all = rows(); const rs = all.slice(0, 150);
      $('#tbl', el).innerHTML = table({ rows: rs, emptyIcon: 'tag', empty: f === 'fd' ? 'Son etiket basımından beri fiyatı değişen model yok' : f === 'sec' ? 'Henüz etiket seçilmedi' : 'Model bulunamadı', columns: [
        { label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint"><span class="mono">${esc(m.code)}</span> · ${oldRef(m) ? `<s>${money(oldRef(m))}</s> <b>${money(unit(m))}</b>` : money(unit(m))} · stok ${mStock(m)}${changed(m) ? ' · ' + badge('Fiyat değişti', 'warn') : ''}</div>` },
        { label: 'Etiket', cls: 'right', render: (m) => { const n = sum(m.variants, (v) => sel.get(v.barcode) || 0); return `<div class="row" style="gap:4px;justify-content:flex-end;flex-wrap:wrap">${n ? `<b style="min-width:28px">${n}</b>` : ''}<button class="btn sm" data-act="pick" data-id="${m.id}" title="Beden/renk ve adet seç">${icon('grid')}</button><button class="btn sm" data-act="stk" data-id="${m.id}" title="Her beden/renkten stok adedi kadar">Stok kadar</button><button class="btn sm" data-act="one" data-id="${m.id}" title="Her beden/renkten 1 etiket">+1</button>${n ? `<button class="btn sm ghost" data-act="clr" data-id="${m.id}" title="Bu modeli çıkar">${icon('x')}</button>` : ''}</div>`; } },
      ] }) + (all.length > rs.length ? `<p class="small muted center">${all.length - rs.length} model daha var — aramayı daraltın.</p>` : '');
      side();
    };
    const pick = (m) => modal({ title: `${m.name} — etiket adedi`, size: 'wide', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Renk</th>${SZ(m.sizeType).map((s) => `<th class="center">${esc(s)}</th>`).join('')}</tr></thead><tbody>${m.colors.map((c) => `<tr><td>${sw(c.hex)} ${esc(c.name)}</td>${SZ(m.sizeType).map((s) => { const v = m.variants.find((x) => x.size === s && x.color === c.name); return `<td class="center">${v ? `<input class="input" type="number" min="0" data-lb="${v.barcode}" value="${sel.get(v.barcode) || 0}" title="Stok: ${v.stock}" style="width:60px;height:32px;text-align:right">` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">Her hücre o beden/renk için basılacak etiket adedidir.</p>`,
      actions: [{ label: 'Stok kadar', onClick: (c, b) => { $$('[data-lb]', b).forEach((i) => { i.value = (m.variants.find((v) => v.barcode === i.dataset.lb) || {}).stock || 0; }); return false; } }, { label: 'Tamam', cls: 'primary', onClick: (c, b) => { $$('[data-lb]', b).forEach((i) => { const n = Math.max(0, Math.floor(Number(i.value) || 0)); if (n) sel.set(i.dataset.lb, n); else sel.delete(i.dataset.lb); }); c(); draw(); } }] });
    const addCode = (code) => { const fv = findV(code); if (!fv) { NS.beep(220, 180); toast('Barkod kayıtlı değil: ' + code, 'err'); return; } sel.set(fv.v.barcode, (sel.get(fv.v.barcode) || 0) + 1); NS.beep(); toast(`${fv.m.name} ${fv.v.color}/${fv.v.size} · ${sel.get(fv.v.barcode)} etiket`, 'ok'); draw(); };
    $('#q', el).oninput = (e) => { q = e.target.value; draw(); };
    $('#gun', el).addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.value.trim()) return; addCode(e.target.value.trim()); e.target.value = ''; });
    on(el, 'click', '[data-f]', (e, b) => { f = b.dataset.f; $$('[data-f]', el).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    on(el, 'click', '[data-act]', (e, b) => { const m = model(b.dataset.id); if (!m) return; const a = b.dataset.act;
      if (a === 'pick') return pick(m);
      if (a === 'stk') { const vs = m.variants.filter((v) => v.stock > 0); if (!vs.length) return toast('Bu modelin stoğu yok — “+1” ile her bedenden bir etiket ekleyin', 'err'); vs.forEach((v) => sel.set(v.barcode, v.stock)); }
      if (a === 'one') m.variants.forEach((v) => sel.set(v.barcode, (sel.get(v.barcode) || 0) + 1));
      if (a === 'clr') m.variants.forEach((v) => sel.delete(v.barcode));
      draw(); });
    $('#tp', el).onchange = (e) => { tpl = e.target.value; S().labelOpt = { tpl, roll }; db.save(); side(); };
    on(el, 'click', '[data-r]', (e, t) => { roll = t.dataset.r === '1'; $$('[data-r]', el).forEach((x) => x.classList.toggle('active', x === t)); S().labelOpt = { tpl, roll }; db.save(); });
    $('#none', el).onclick = () => { sel.clear(); draw(); };
    $('#ed', el).onclick = () => lbDesigner(() => { if (!lbTpls().some((t) => t.id === tpl)) tpl = lbTpls()[0].id; $('#tp', el).innerHTML = lbOptions(tpl); side(); });
    $('#cam', el).onclick = () => NS.scan({ title: 'Etiket için okut', hint: 'Okuttuğunuz her ürün 1 etiket olarak eklenir', continuous: true, onCode: addCode });
    $('#lg', el).onchange = (e) => { const file = e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 360 / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); S().logo = cv.toDataURL('image/png'); db.save(); toast('Logo kaydedildi', 'ok'); redraw(); }; im.onerror = () => toast('Resim okunamadı', 'err'); im.src = rd.result; }; rd.readAsDataURL(file); };
    on(el, 'click', '#lga', () => { const t = lbTpl(tpl); if (t.els.some((x) => x.logo)) return toast('Bu şablonda logo zaten var — yerini “Şablonları düzenle”den değiştirin'); const w = Math.min(20, t.w - 4); t.els.unshift(LE('box', (t.w - w) / 2, 1.5, w, Math.min(8, t.h / 4), { logo: true })); db.save(); toast('Logo şablonun üstüne eklendi', 'ok'); side(); });
    on(el, 'click', '#lgx', async () => { if (!(await confirm('Logo kaldırılsın mı?'))) return; delete S().logo; db.save(); redraw(); });
    $('#pr', el).onclick = () => { const it = V(); if (!it.length) return toast('Etiket seçin', 'err'); S().labelOpt = { tpl, roll }; lbPrint(it, tpl, roll); draw(); };
    draw(); setTimeout(() => $('#gun', el).focus(), 50);
  }

  // ---------- Müşteriler ----------
  function customersPage(el, p, app) {
    NS.crud(el, app, { col: 'customers', title: 'Müşteriler', sub: 'Puan, beden ve alışveriş geçmişi', single: 'Müşteri', addLabel: 'Yeni müşteri', emptyIcon: 'users',
      fields: [{ name: 'name', label: 'Ad soyad', required: true }, { name: 'phone', label: 'Telefon', type: 'tel', required: true }, { name: 'size', label: 'Beden' }, { name: 'birthday', label: 'Doğum günü', type: 'date' }, { name: 'points', label: 'Puan', type: 'number' }, { name: 'kvkk', label: 'SMS/kampanya izni', type: 'checkbox' }, { name: 'note', label: 'Not', full: true }],
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'dg', label: 'Bu ay doğum günü', test: (c) => c.birthday && c.birthday.slice(5, 7) === today().slice(5, 7) }, { value: 'izin', label: 'SMS izni olan', test: (c) => c.kvkk }],
      searchFields: (c) => [c.name, c.phone],
      columns: [{ key: 'name', label: 'Müşteri', render: (c) => `<b>${esc(c.name)}</b><div class="small faint">${esc(c.phone)}${c.kvkk ? '' : ' · SMS izni yok'}</div>` }, { key: 'size', label: 'Beden', render: (c) => esc(c.size || '-') }, { label: 'Alışveriş', cls: 'right', render: (c) => { const ss = db.all('sales', (s) => s.customer === c.id); return `${ss.length}<div class="small faint">${money(sum(ss, (s) => s.total))}</div>`; } }, { key: 'points', label: 'Puan', cls: 'right', render: (c) => `<b>${c.points || 0}</b>` }, { label: 'Son ziyaret', render: (c) => { const s = db.all('sales', (x) => x.customer === c.id).sort((a, b) => b.at.localeCompare(a.at))[0]; return s ? NS.date(s.at) : '-'; } }],
      extraActions: [{ icon: 'clock', act: 'hist', title: 'Alışveriş geçmişi' }, { icon: 'message', act: 'sms', title: 'SMS gönder' }],
      onAction: async (a, c) => { if (a === 'hist') return custHist(c); const v = await NS.prompt(`${c.name} için SMS`, `Merhaba ${c.name.split(' ')[0]}, ${S().bizName}'de yeni sezon ürünleri geldi! ${c.points ? c.points + ' puanınız sizi bekliyor.' : ''}`); if (v) { if (!c.kvkk) return toast('Müşterinin SMS izni yok (KVKK)', 'err'); smsSend(c, v); } },
    });
  }

  function custHist(c) {
    const ss = db.all('sales', (s) => s.customer === c.id).sort((a, b) => b.at.localeCompare(a.at)); const nos = new Set(ss.map((s) => s.no)); const rs = db.all('returns', (r) => nos.has(r.saleNo));
    const fav = Object.entries(NS.groupBy(ss.flatMap((s) => s.lines), (l) => l.size)).sort((a, b) => b[1].length - a[1].length)[0];
    const ws = db.all('waits', (w) => w.customer === c.id && w.status === 'bekliyor');
    modal({ title: `${c.name} — alışveriş geçmişi`, size: 'wide', body: `${ws.length ? `<div class="lbs-sum mb"><b>Bekleyen talepler:</b> ${ws.map((w) => `${esc((model(w.mid) || {}).name || '')} ${esc(w.color || '')} ${esc(w.size)}`).join(' · ')}</div>` : ''}<div class="grid g4 mb">${kpi('Alışveriş', ss.length, 'receipt')}${kpi('Toplam', money(sum(ss, (s) => s.total)), 'cash', 'ok')}${kpi('Puan', c.points || 0, 'gift', 'info')}${kpi('Çok aldığı beden', fav ? fav[0] : '-', 'tag')}</div>${table({ rows: ss.slice(0, 100), empty: 'Alışveriş yok', columns: [{ label: 'Fiş', render: (s) => `<b class="mono">${esc(s.no)}</b><div class="small faint">${NS.dt(s.at)}</div>` }, { label: 'Ürünler', render: (s) => s.lines.map((l) => `<div class="small">${esc(l.name)} · ${esc(l.color)} ${esc(l.size)}${rs.some((r) => r.saleNo === s.no && (r.line.barcode === l.barcode)) ? ' ' + badge('iade/değişim', 'warn') : ''}</div>`).join('') }, { label: 'Tutar', cls: 'right', render: (s) => `<b>${money(s.total)}</b>` }] })}` });
  }

  // ---------- Kampanyalar ----------
  function campaignsPage(el, p, app) {
    campTick();
    el.innerHTML = pageHead('Sezon & Kampanyalar', `Sezon/kategori indirimi tek tıkla tüm etiketlere yansır; tarih verilirse kendiliğinden başlar ve biter. ${kanal().text}`, `<button class="btn primary" id="bulk">${icon('percent')} Yeni kampanya</button>`) + `<div class="card"><div class="card-h"><h3>Kampanyalar</h3></div><div id="t"></div></div>`;
    const st = (c) => (!c.active ? badge('Kapalı') : campOn(c) ? badge('Uygulanıyor', 'ok') : c.start && today() < c.start ? badge('Başlayacak', 'info') : badge('Süresi bitti', 'warn'));
    const draw = () => { $('#t', el).innerHTML = table({ rows: db.all('campaigns'), columns: [{ label: 'Kampanya', render: (c) => `<b>${esc(c.name)}</b>${c.start || c.end ? `<div class="small faint">${c.start ? NS.date(c.start) : '…'} – ${c.end ? NS.date(c.end) : '…'}</div>` : ''}` }, { label: 'Kapsam', render: (c) => `${c.scope === 'sezon' ? 'Sezon' : 'Kategori'}: ${esc(c.target)}` }, { label: 'Tür', render: (c) => (c.type === 'ikinci' ? `2. üründe %${c.value}` : `%${c.value} indirim`) }, { label: 'Durum', render: st }], actions: [{ icon: 'refresh', act: 'tg', title: 'Aç / kapat' }, { icon: 'trash', act: 'del' }] }); };
    on(el, 'click', '[data-act]', async (e, b) => { const c = db.get('campaigns', b.dataset.id); if (b.dataset.act === 'del') { if (!(await confirm('Kampanya silinsin mi?'))) return; if (c.type === 'yuzde' && c.applied) campApply(c, 0); db.remove('campaigns', c.id); } else { c.active = !c.active; if (c.type === 'yuzde' && campOn(c) !== !!c.applied) campApply(c, campOn(c) ? c.value : 0); } db.save(); draw(); });
    $('#bulk', el).onclick = async () => {
      const cats = [...new Set(db.all('models').map((m) => m.cat))];
      const v = await formModal({ title: 'Yeni kampanya', fields: [{ name: 'name', label: 'Kampanya adı', required: true, full: true }, { name: 'type', label: 'Tür', type: 'select', options: [{ value: 'yuzde', label: 'Yüzde indirim (etikete yansır)' }, { value: 'ikinci', label: '2. üründe indirim (kasada)' }] }, { name: 'target', label: 'Kapsam', type: 'select', options: [...B.SEASONS.map((x) => ({ value: 'sezon|' + x, label: 'Sezon: ' + x })), ...cats.map((x) => ({ value: 'kategori|' + x, label: 'Kategori: ' + x }))] }, { name: 'value', label: 'Oran %', type: 'number', required: true }, { name: 'start', label: 'Başlangıç (boşsa hemen)', type: 'date' }, { name: 'end', label: 'Bitiş (boşsa süresiz)', type: 'date' }] });
      if (!v) return; const pct = Number(v.value); if (!(pct > 0 && pct <= 90)) return toast('Oran 1 ile 90 arasında olmalı', 'err'); if (v.start && v.end && v.end < v.start) return toast('Bitiş, başlangıçtan önce olamaz', 'err');
      const [scope, target] = v.target.split('|'); const c = db.insert('campaigns', { ...v, scope, target, value: pct, active: true, applied: false }); if (c.type === 'yuzde' && campOn(c)) campApply(c, c.value); else if (c.type === 'yuzde') toast(`Kampanya ${NS.date(c.start)} tarihinde başlayacak`, 'ok'); db.save(); draw();
    };
    draw();
  }

  // ---------- Özet ve raporlar ----------
  function dashboard(el, p, app) {
    campTick(); const all = db.all('sales'); const t = today(); const tod = all.filter((s) => iso(s.at) === t);
    const m30 = all.filter((s) => s.at > addDays(new Date(), -30).toISOString());
    const kar = (ss) => sum(ss.flatMap((s) => s.lines), (l) => (l.price - (l.cost || 0)) * l.qty) - sum(ss, (s) => s.disc || 0);
    const low = db.all('models').flatMap((m) => m.variants.filter((v) => v.stock === 0 && sum(m.variants.filter((x) => x.color === v.color), (x) => x.stock) > 0).map((v) => ({ m, v })));
    const ser = NS.dailySeries(all, 14, 'at', (s) => s.total);
    el.innerHTML = pageHead(S().bizName, NS.dateLong(new Date()), `<a class="btn primary" href="#/satis">${icon('barcode')} Satış</a>`) + `
      <div class="grid g4 mb">${kpi('Bugün satış', money(sum(tod, (s) => s.total)), 'cash', '', `<div class="small faint">${tod.length} fiş · ${sum(tod.flatMap((s) => s.lines), (l) => l.qty)} ürün</div>`)}${kpi('30 gün ciro', money(sum(m30, (s) => s.total)), 'trend', 'ok', `<div class="small faint">brüt kâr ${money(kar(m30))}</div>`)}${kpi('Mağazadaki ürün', sum(db.all('models'), mStock), 'tag', 'info', `<div class="small faint">${money(sum(db.all('models'), (m) => mStock(m) * m.cost))} maliyet</div>`)}${kpi('Biten beden', low.length, 'alert', low.length ? 'warn' : 'ok', '<div class="small faint">Diğer bedenleri stokta</div>')}</div>
      <div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Son 14 gün</h3></div><div class="card-b">${chart.bars(ser.labels.map((l, i) => ({ label: l, value: ser.values[i] })))}</div></div>
      <div class="card"><div class="card-h"><h3>En çok satan beden (30 gün)</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(m30.flatMap((s) => s.lines), (l) => l.size)).map(([label, v]) => ({ label, value: sum(v, (l) => l.qty) })).sort((a, b) => b.value - a.value).slice(0, 7), { size: 130 })}</div></div></div>
      ${(() => { const ready = db.all('models').flatMap(waitsFor); const n = db.all('waits', (w) => w.status === 'bekliyor').length; return n ? `<div class="card pad mb row" style="gap:12px;flex-wrap:wrap"><span class="grow">${icon('bell')} <b>${n}</b> müşteri beden/renk bekliyor${ready.length ? ` · <b style="color:var(--ok)">${ready.length} talep artık stokta</b>` : ''}</span>${ready.length ? '<button class="btn primary sm" id="wready">Haber ver</button>' : ''}<button class="btn sm" id="wall">Listeyi gör</button></div>` : ''; })()}
      <div class="grid g2"><div class="card"><div class="card-h"><h3>Biten bedenler — sipariş verin</h3></div>${table({ rows: low.slice(0, 10).map((x, i) => ({ ...x, id: i })), empty: 'Eksik beden yok', columns: [{ label: 'Model', render: (x) => `<b>${esc(x.m.name)}</b>` }, { label: 'Renk / beden', render: (x) => `${sw(colorHex(x.m, x.v.color))} ${esc(x.v.color)} · <b>${esc(x.v.size)}</b>` }] })}</div>
      <div class="card"><div class="card-h"><h3>En çok satan modeller (30 gün)</h3></div>${table({ rows: Object.entries(NS.groupBy(m30.flatMap((s) => s.lines), (l) => l.mid)).map(([id, v]) => ({ id, m: model(id), n: sum(v, (l) => l.qty), c: sum(v, (l) => l.qty * l.price) })).filter((x) => x.m).sort((a, b) => b.n - a.n).slice(0, 8), columns: [{ label: 'Model', render: (x) => `<b>${esc(x.m.name)}</b>` }, { label: 'Adet', cls: 'right', key: 'n' }, { label: 'Ciro', cls: 'right', render: (x) => money(x.c) }] })}</div></div>`;
    const wr = $('#wready', el); if (wr) wr.onclick = () => notifyWaits(db.all('models').flatMap(waitsFor));
    const wa = $('#wall', el); if (wa) wa.onclick = () => modal({ title: 'Bekleyen beden/renk talepleri', size: 'wide', body: table({ rows: db.all('waits', (w) => w.status === 'bekliyor').sort((a, b) => a.at.localeCompare(b.at)), columns: [{ label: 'Müşteri', render: (w) => `<b>${esc((cust(w.customer) || {}).name || '-')}</b>` }, { label: 'İstenen', render: (w) => `${esc((model(w.mid) || {}).name || '')} · ${esc(w.color || 'her renk')} <b>${esc(w.size)}</b>${w.note ? `<div class="small faint">${esc(w.note)}</div>` : ''}` }, { label: 'Talep', render: (w) => NS.date(w.at) }], actions: [{ icon: 'x', act: 'cl', title: 'Kapat (vazgeçti)' }] }), onOpen: (b) => on(b, 'click', '[data-act=cl]', (e, t) => { const w = db.get('waits', t.dataset.id); w.status = 'kapandi'; db.save(); t.closest('tr').remove(); }) });
  }
  let rptRange = { k: '30' };
  const rangeOf = (r) => { const t = today(); const d = (n) => iso(addDays(new Date(), n)); const ym = t.slice(0, 7); const pm = iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).slice(0, 7);
    return r.k === 'bugun' ? [t, t] : r.k === '7' ? [d(-6), t] : r.k === '30' ? [d(-29), t] : r.k === 'ay' ? [ym + '-01', t] : r.k === 'gecen' ? [pm + '-01', iso(new Date(new Date().getFullYear(), new Date().getMonth(), 0))] : [r.from || t, r.to || t]; };
  // Gün sonu kasa: ödeme türüne göre satış, iade, fark tahsilatı ve hediye çeki satışı
  function cashTable(from, to) {
    const inR = (x) => iso(x.at) >= from && iso(x.at) <= to; const T = {}; const add = (k, col, v) => { T[k] = T[k] || { satis: 0, iade: 0, cek: 0 }; T[k][col] += v; };
    db.all('sales', inR).forEach((s) => (s.pays || [{ type: s.pay, amount: s.total }]).forEach((x) => add(x.type, 'satis', x.amount)));
    db.all('returns', inR).forEach((r) => { if (r.refund && r.how && r.how !== 'puan') add(r.how === 'cek' ? 'cekver' : r.how, 'iade', r.refund); else if (r.refund && !r.how && r.type === 'iade') add('kart', 'iade', r.refund); if (r.extra) add(r.how || 'nakit', 'satis', r.extra); if (r.refund && r.how === 'puan') add('puan', 'iade', r.refund); });
    db.all('cheques', (c) => inR(c) && c.source === 'satis').forEach((c) => add(c.pay || 'nakit', 'cek', c.amount));
    const L = { ...B.PAY, cekver: 'Verilen iade çeki' };
    return Object.entries(T).map(([k, v]) => ({ id: k, name: L[k] || k, ...v, cash: ['nakit', 'kart', 'havale'].includes(k), net: v.satis + v.cek - v.iade })).sort((a, b) => b.cash - a.cash);
  }
  function reportsPage(el) {
    const [from, to] = rangeOf(rptRange); const inR = (x) => iso(x.at) >= from && iso(x.at) <= to;
    const m30 = db.all('sales', inR); const L = m30.flatMap((s) => s.lines);
    const rets = db.all('returns', inR); const cash = cashTable(from, to); const pct = Number(S().commPct) || 0;
    const byRep = Object.entries(NS.groupBy(m30, (s) => s.rep || s.user || '-')).map(([id, ss]) => { const net = sum(ss, (s) => s.total) - sum(rets.filter((r) => ss.some((s) => s.no === r.saleNo)), (r) => r.refund || 0); return { id, n: ss.length, ciro: sum(ss, (s) => s.total), net, avg: ss.length ? sum(ss, (s) => s.total) / ss.length : 0, upt: ss.length ? sum(ss.flatMap((s) => s.lines), (l) => l.qty) / ss.length : 0, prim: (net * pct) / 100 }; }).sort((a, b) => b.ciro - a.ciro);
    const sold60 = new Set(db.all('sales', (s) => s.at > addDays(new Date(), -60).toISOString()).flatMap((s) => s.lines.map((l) => l.mid))); const dead = db.all('models').filter((m) => !m.passive && !sold60.has(m.id) && mStock(m) > 0);
    const R = [['bugun', 'Bugün'], ['7', '7 gün'], ['30', '30 gün'], ['ay', 'Bu ay'], ['gecen', 'Geçen ay'], ['ozel', 'Tarih seç']];
    el.innerHTML = pageHead('Raporlar', `${NS.date(from)} – ${NS.date(to)}`, `<button class="btn" id="zp">${icon('print')} Gün sonu raporu yazdır</button>`) + `<div class="card pad mb"><div class="row" style="flex-wrap:wrap;gap:8px"><div class="seg">${R.map(([k, l]) => `<button data-rk="${k}" class="${rptRange.k === k ? 'active' : ''}">${l}</button>`).join('')}</div>${rptRange.k === 'ozel' ? `<input class="input" type="date" id="rf" value="${from}" style="width:auto"><input class="input" type="date" id="rt" value="${to}" style="width:auto">` : ''}</div></div>
      <div class="grid g4 mb">${kpi('Ciro', money(sum(m30, (s) => s.total)), 'trend', 'ok', `<div class="small faint">${m30.length} fiş</div>`)}${kpi('Ortalama fiş', money(m30.length ? sum(m30, (s) => s.total) / m30.length : 0), 'receipt', 'info')}${kpi('Fiş başı ürün', (m30.length ? sum(L, (l) => l.qty) / m30.length : 0).toFixed(2), 'tag')}${kpi('Değişim / iade', rets.length, 'refresh', 'warn', `<div class="small faint">iade ${money(sum(rets, (r) => r.refund || 0))}</div>`)}</div>
      <div class="grid g2 mb"><div class="card"><div class="card-h"><h3>Kasa (ödeme türüne göre)</h3></div>${table({ rows: cash, empty: 'Hareket yok', columns: [{ label: 'Ödeme', render: (x) => `<b>${esc(x.name)}</b>` }, { label: 'Satış', cls: 'right', render: (x) => money(x.satis) }, { label: 'Hediye çeki satışı', cls: 'right', render: (x) => (x.cek ? money(x.cek) : '-') }, { label: 'İade', cls: 'right', render: (x) => (x.iade ? '−' + money(x.iade) : '-') }, { label: 'Net', cls: 'right', render: (x) => (x.cash ? `<b>${money(x.net)}</b>` : '<span class="small faint">kasaya girmez</span>') }], foot: `<b>Kasa neti: ${money(sum(cash.filter((x) => x.cash), (x) => x.net))}</b>` })}</div>
        <div class="card"><div class="card-h"><h3>Satış danışmanları</h3><span class="small muted">${pct ? `prim %${pct} (net satış üzerinden)` : 'Prim oranı Ayarlar’dan girilir'}</span></div>${table({ rows: byRep, empty: 'Satış yok', columns: [{ label: 'Danışman', render: (x) => `<b>${esc(x.id)}</b><div class="small faint">${x.n} fiş · fiş başı ${x.upt.toFixed(1)} ürün</div>` }, { label: 'Ciro', cls: 'right', render: (x) => money(x.ciro) }, { label: 'Net', cls: 'right', render: (x) => money(x.net) }, { label: 'Prim', cls: 'right', render: (x) => (pct ? `<b>${money(x.prim)}</b>` : '-') }] })}</div></div>
      <div class="grid g3 mb"><div class="card"><div class="card-h"><h3>Kategoriler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => (model(l.mid) || {}).cat || '-')).map(([label, v]) => ({ label, value: sum(v, (l) => l.price * l.qty) })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Renkler</h3></div><div class="card-b">${chart.donut(Object.entries(NS.groupBy(L, (l) => l.color)).map(([label, v]) => ({ label, value: v.length })), { size: 120 })}</div></div>
      <div class="card"><div class="card-h"><h3>Mağaza / online</h3></div><div class="card-b">${chart.donut([{ label: 'Mağaza', value: m30.filter((s) => s.channel !== 'online').length }, { label: 'Online', value: m30.filter((s) => s.channel === 'online').length }], { size: 120 })}</div></div></div>
      <div class="card mb"><div class="card-h"><h3>Satış oranı (sell-through)</h3><span class="small muted">dönemde satılan ÷ (satılan + eldeki stok)</span></div>${(() => { const sold = new Map(); L.forEach((l) => sold.set(l.mid, (sold.get(l.mid) || 0) + l.qty)); const rs = db.all('models', (m) => !m.passive && (sold.has(m.id) || mStock(m) > 0)).map((m) => { const n = sold.get(m.id) || 0; const st = Math.max(0, mStock(m)); return { id: m.id, m, n, st, r: n + st ? n / (n + st) : 0 }; }); const top = [...rs].sort((a, b) => b.r - a.r).slice(0, 8); const bot = rs.filter((x) => x.st > 0).sort((a, b) => a.r - b.r).slice(0, 8);
        const t = (rows, h) => `<div><div class="small muted" style="padding:8px 16px 0">${h}</div>${table({ rows, empty: 'Yok', columns: [{ label: 'Model', render: (x) => `<b>${esc(x.m.name)}</b><div class="small faint">${x.n} satıldı · ${x.st} stokta</div>` }, { label: 'Oran', cls: 'right', render: (x) => `<b style="color:var(--${x.r >= 0.5 ? 'ok' : x.r < 0.15 ? 'err' : 'text'})">%${Math.round(x.r * 100)}</b>` }] })}</div>`;
        return `<div class="grid g2">${t(top, 'Hızlı dönen — yeniden sipariş adayı')}${t(bot, 'Yavaş dönen — indirim/kampanya adayı')}</div>`; })()}</div>
      <div class="card"><div class="card-h"><h3>Ölü stok — 60 gündür satılmayan</h3><span class="small muted">İndirime alın veya pazaryerine açın</span></div>${table({ rows: dead.sort((a, b) => mStock(b) * b.cost - mStock(a) * a.cost).slice(0, 100), empty: 'Yok', columns: [{ label: 'Model', render: (m) => `<b>${esc(m.name)}</b><div class="small faint">${esc(m.season)}</div>` }, { label: 'Stok', cls: 'right', render: mStock }, { label: 'Bağlı para', cls: 'right', render: (m) => money(mStock(m) * m.cost) }] })}</div>`;
    on(el, 'click', '[data-rk]', (e, b) => { rptRange = { ...rptRange, k: b.dataset.rk }; reportsPage(el); });
    on(el, 'change', '#rf, #rt', () => { rptRange = { k: 'ozel', from: $('#rf', el).value, to: $('#rt', el).value }; reportsPage(el); });
    $('#zp', el).onclick = () => NS.printHtml(`<div style="width:280px;font-family:Arial;font-size:12px"><div style="text-align:center"><b style="font-size:15px">${esc(S().bizName)}</b><div>GÜN SONU KASA RAPORU</div><div>${NS.date(from)}${from !== to ? ' – ' + NS.date(to) : ''}</div></div><hr>${cash.filter((x) => x.cash).map((x) => `<div><b>${esc(x.name)}</b></div><div>Satış <span style="float:right">${money(x.satis + x.cek)}</span></div>${x.iade ? `<div>İade <span style="float:right">−${money(x.iade)}</span></div>` : ''}<div>Net <span style="float:right"><b>${money(x.net)}</b></span></div>`).join('<hr style="border-style:dotted">')}<hr><div style="font-size:14px"><b>KASA NETİ <span style="float:right">${money(sum(cash.filter((x) => x.cash), (x) => x.net))}</span></b></div>${cash.filter((x) => !x.cash).map((x) => `<div class="small">${esc(x.name)} (kasaya girmez) <span style="float:right">${x.satis ? money(x.satis) : ''}${x.iade ? ' −' + money(x.iade) : ''}</span></div>`).join('')}<hr><div>Fiş sayısı <span style="float:right">${m30.length}</span></div><div>İade/değişim <span style="float:right">${rets.length}</span></div><div style="font-size:14px"><b>Ciro <span style="float:right">${money(sum(m30, (s) => s.total))}</span></b></div><hr><div style="text-align:center">Yazdıran: ${esc((NS.currentUser || {}).name || '')} · ${NS.dt(new Date())}<br><b>BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR</b></div></div>`, { title: 'Gün sonu' });
  }
  function salesPage(el, p, app) {
    NS.crud(el, app, { col: 'sales', title: 'Satışlar', sub: 'Fişler', readonly: true, emptyIcon: 'receipt', searchFields: (s) => [s.no, (cust(s.customer) || {}).name, ...s.lines.map((l) => l.name)], sort: (a, b) => b.at.localeCompare(a.at),
      filters: [{ value: 'all', label: 'Tümü' }, { value: 'bugun', label: 'Bugün', test: (s) => iso(s.at) === today() }, { value: 'online', label: 'Online', test: (s) => s.channel === 'online' }],
      columns: [{ key: 'no', label: 'Fiş', render: (s) => `<b class="mono">${esc(s.no)}</b><div class="small faint">${NS.dt(s.at)}</div>` }, { label: 'Müşteri', render: (s) => esc((cust(s.customer) || {}).name || '-') }, { label: 'Ürünler', render: (s) => s.lines.map((l) => `<div class="small">${esc(l.name)} ${esc(l.size)}</div>`).join('') }, { label: 'Ödeme', render: (s) => esc(B.PAY[s.pay] || s.pay) + (s.channel === 'online' ? ' ' + badge('Online', 'info') : '') + (s.rep ? `<div class="small faint">${esc(s.rep)}</div>` : '') }, { key: 'total', label: 'Tutar', cls: 'right', render: (s) => `<b>${money(s.total)}</b>` }],
      extraActions: [{ icon: 'print', act: 'pr' }], onAction: (a, s) => receipt(s) });
  }

  const ROLES = { admin: 'Mağaza sahibi', kasa: 'Satış danışmanı' };
  NS.shell({
    id: 'butik', integrations: ['pazaryeri', 'pos', 'printer', 'label', 'barcode', 'efatura', 'sms', 'whatsapp', 'webhook', 'backup'], name: 'Butik & Giyim', tagline: 'Beden-renk stok ve mağaza satış', icon: 'tag', accent: '#db2777', db, home: 'ozet', auth: { roles: ROLES },
    nav: [{ sec: 'Mağaza' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: ['kasa'] }, { id: 'satis', label: 'Satış', icon: 'barcode', roles: ['kasa'] }, { id: 'degisim', label: 'Değişim & İade', icon: 'refresh', roles: ['kasa'] }, { id: 'satislar', label: 'Satışlar', icon: 'receipt', roles: ['kasa'] }, { id: 'urunler', label: 'Ürünler & Stok', icon: 'tag', roles: ['kasa'] }, { id: 'etiket', label: 'Etiket Basımı', icon: 'print', roles: ['kasa'] }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: ['kasa'] }, { sec: 'Yönetim' }, { id: 'kampanyalar', label: 'Sezon & Kampanya', icon: 'percent', roles: ['admin'] }, { id: 'raporlar', label: 'Raporlar', icon: 'chart', roles: ['admin'] }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
    routes: { ozet: dashboard, satis: posPage, degisim: exchangePage, satislar: salesPage, urunler: productsPage, etiket: labelsPage, musteriler: customersPage, kampanyalar: campaignsPage, raporlar: reportsPage,
      ayarlar: (el, p, a) => NS.settingsPage(el, a, { roles: ROLES, fields: [{ type: 'section', label: 'Mağaza kuralları' }, { name: 'pointPct', label: 'Puan oranı %', type: 'number' }, { name: 'exchangeDays', label: 'Değişim süresi (gün)', type: 'number' }, { name: 'lowStock', label: 'Az kalan beden sınırı', type: 'number' }, { name: 'commPct', label: 'Satış danışmanı primi % (net satış)', type: 'number' }, { name: 'online', label: 'Stok değişince bağlı online kanala gönder', type: 'checkbox', hint: 'Bağlantı Entegrasyonlar > Pazaryerleri ekranından kurulur. Bağlı kanal yoksa gönderim yapılmaz.' }] }) },
  });
})();
