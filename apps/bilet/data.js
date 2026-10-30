/* Etkinlik bilet demo verisi, koltuk planı ve ortak hesaplar — yönetim paneli ve online satış sayfası kullanır */
window.BILET = {
  CATS: ['Konser', 'Tiyatro', 'Stand-up', 'Çocuk', 'Spor', 'Konferans'],
  HOLD_MIN: 8,
  seed(db) {
    const { rand, pick, addDays, iso } = NS;
    db.data._settings = { bizName: 'Sahne Bilet', bizPhone: '0850 222 33 44', bizAddress: 'Harbiye, İstanbul', serviceFee: 15, refundDays: 2 };
    db.data.users = [{ id: 'u1', name: 'Derya Organizatör', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tuna Gişe', role: 'gise', pin: '1234', active: true }, { id: 'u3', name: 'Kerem Kapı', role: 'kapi', pin: '1234', active: true }]; db.data._settings.gates = 'Ana kapı, VIP kapı';
    const R = (from, to) => { const out = []; for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c++) out.push(String.fromCharCode(c)); return out; };
    db.data.venues = [
      { id: 'v1', name: 'Kültür Sahnesi', city: 'İstanbul', type: 'seated', seatsPerRow: 16, rows: [...R('A', 'C').map((r) => ({ r, cat: 'vip' })), ...R('D', 'H').map((r) => ({ r, cat: 'k1' })), ...R('I', 'L').map((r) => ({ r, cat: 'k2' }))], cats: { vip: 'VIP', k1: '1. Kategori', k2: '2. Kategori' } },
      { id: 'v2', name: 'Gülüş Kulüp', city: 'İstanbul', type: 'seated', seatsPerRow: 12, rows: [...R('A', 'B').map((r) => ({ r, cat: 'on' })), ...R('C', 'H').map((r) => ({ r, cat: 'gen' }))], cats: { on: 'Ön sıralar', gen: 'Genel' } },
      { id: 'v3', name: 'Açıkhava Arena', city: 'İstanbul', type: 'ga', capacity: { sahne: 400, genel: 1600, loca: 60 }, cats: { sahne: 'Sahne önü', genel: 'Genel alan', loca: 'Loca' } },
    ];
    const E = [
      ['Hamlet', 'v1', 'Tiyatro', 'Şehir Tiyatrosu Topluluğu', 4, '20:30', { vip: 900, k1: 650, k2: 450 }, '#7c3aed'], ['Caz Gecesi: Bosphorus Quartet', 'v1', 'Konser', 'Bosphorus Quartet', 9, '21:00', { vip: 1100, k1: 800, k2: 550 }, '#0284c7'],
      ['Gülme Garantili', 'v2', 'Stand-up', 'Emre Kılıç', 2, '21:30', { on: 750, gen: 500 }, '#ea580c'], ['Kahkaha Akşamı', 'v2', 'Stand-up', 'Selin Uzun', 13, '21:30', { on: 700, gen: 450 }, '#db2777'],
      ['Yaz Sonu Festivali', 'v3', 'Konser', 'Çeşitli sanatçılar', 18, '19:00', { sahne: 1500, genel: 850, loca: 4000 }, '#16a34a'], ['Pinokyo', 'v1', 'Çocuk', 'Masal Tiyatrosu', 6, '14:00', { vip: 400, k1: 300, k2: 250 }, '#ca8a04'],
      ['Girişimcilik Zirvesi', 'v1', 'Konferans', 'Sektör liderleri', 24, '10:00', { vip: 1500, k1: 900, k2: 600 }, '#475569'], ['Geçen Haftanın Galası', 'v1', 'Tiyatro', 'Modern Sahne', -5, '20:30', { vip: 850, k1: 600, k2: 400 }, '#9333ea'],
    ];
    db.data.events = E.map(([name, venue, cat, artist, d, time, prices, color], i) => ({ id: 'e' + i, name, venue, cat, artist, date: iso(addDays(new Date(), d)), time, prices, color, desc: `${artist} ile unutulmaz bir ${cat.toLocaleLowerCase('tr-TR')} deneyimi. Kapılar etkinlikten 45 dakika önce açılır. Süre yaklaşık 2 saattir.`, age: cat === 'Çocuk' ? 'Genel izleyici' : '+13', status: 'satista' }));
    db.data.codes = [{ id: 'c1', code: 'OGRENCI', pct: 30, note: 'Girişte öğrenci kimliği istenir', active: true, uses: 34 }, { id: 'c2', code: 'ERKEN20', pct: 20, note: 'Erken rezervasyon', active: true, uses: 61 }, { id: 'c3', code: 'SPONSOR', pct: 100, note: 'Davetiye', active: true, online: false, maxUses: 40, uses: 12 }];
    const tickets = []; let ord = 3000;
    db.data.events.forEach((ev) => {
      const v = db.data.venues.find((x) => x.id === ev.venue);
      const fill = ev.date < NS.today() ? 0.92 : rand(25, 85) / 100;
      const make = (seat, cat) => { const at = addDays(new Date(ev.date), -rand(1, 40)); if (at > new Date()) at.setTime(Date.now() - rand(1, 48) * 3600000); const used = ev.date < NS.today() && Math.random() < 0.94; tickets.push({ id: NS.uid(), code: BILET.code(), event: ev.id, seat, cat, price: ev.prices[cat], paid: ev.prices[cat], buyer: { name: pick(NS.NAMES), phone: NS.phone() }, channel: pick(['online', 'online', 'online', 'gise']), at: at.toISOString(), status: used ? 'used' : 'valid', usedAt: used ? new Date(`${ev.date}T${ev.time}`).toISOString() : null, order: 'B' + ++ord }); };
      if (v.type === 'seated') BILET.seats(v).forEach((s) => { if (Math.random() < fill) make(s.id, s.cat); });
      else Object.entries(v.capacity).forEach(([cat, cap]) => { for (let k = 0; k < Math.floor(cap * fill * 0.15); k++) make(null, cat); });
    });
    db.data.tickets = tickets; db.data._meta._seq_orders = ord;
    db.data.holds = []; db.data.waitlist = []; db.data.settlements = [];
  },
  // Doğrulanmış Unsplash afiş görselleri; etkinlikte photo (URL veya kimlik) varsa o kullanılır
  PH: {
    Konser: ['1501281668745-f7f57925c3b4', '1470229722913-7c0e2dbbafd3', '1459749411175-04bf5292ceea', '1514525253161-7a46d19cd819', '1465847899084-d164df4dedc6', '1540039155733-5bb30b53aa14', '1460723237483-7a6dc9d0b212', '1506157786151-b8491531f063'],
    Tiyatro: ['1503095396549-807759245b35', '1517604931442-7e0c8ed2963c', '1489599849927-2ee91cede3ba'],
    'Stand-up': ['1508700115892-45ecd05ae2ad', '1585699324551-f6c309eedeca'],
    Çocuk: ['1492684223066-81342ee5ff30', '1517604931442-7e0c8ed2963c'],
    Spor: ['1429962714451-bb934ecdc4ec', '1522158637959-30385a09e0da'],
    Konferans: ['1585699324551-f6c309eedeca'],
  },
  poster(e, w = 800, h = 0) {
    const p = String(e.photo || '').trim();
    if (/^https?:/.test(p)) return p;
    const list = this.PH[e.cat] || this.PH.Konser; const k = [...String(e.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
    const id = p || list[k % list.length];
    return `https://images.unsplash.com/photo-${id}?w=${w}${h ? '&h=' + h : ''}&q=75&auto=format&fit=crop`;
  },
  // Ödenmemiş rezervasyonun süresi dolunca / iptal edilince koltuk açılır. Sunucu kuralıyla uyumlu kalmak için durum "refunded",
  // nedeni void alanında ('expired' süresi doldu, 'cancelled' ödenmeden iptal) — para iadesi yalnızca refund kaydı varsa vardır.
  voidLabel(t) { return t.void === 'expired' ? 'Süresi doldu (ödenmedi)' : t.void === 'cancelled' ? 'İptal (ödenmemişti)' : 'İade edildi'; },
  expire(db) {
    const now = Date.now(); let n = 0;
    db.all('tickets', (t) => t.status === 'reserved' && t.holdUntil && t.holdUntil < now).forEach((t) => { t.status = 'refunded'; t.void = 'expired'; t.refundedAt = new Date().toISOString(); BILET.codeBack(db, t); n++; });
    if (n) { db.log('Süresi dolan rezervasyon', `${n} bilet serbest bırakıldı`); db.save(); }
    return n;
  },
  // Rezervasyon için ödeme son anı: ayardaki saat kadar, en geç etkinlikten 2 saat önce
  holdUntil(e, hours) { const start = new Date(`${e.date}T${e.time || '20:00'}`).getTime(); return Math.max(Date.now() + 15 * 60000, Math.min(Date.now() + (Number(hours) || 48) * 3600000, start - 2 * 3600000)); },
  start(e) { return new Date(`${e.date}T${e.time || '20:00'}`); },
  // Satış penceresi: online satış başlangıç–bitiş (boşsa etkinlik saatine kadar); gişe etkinlik başladıktan 1 saat sonrasına kadar
  salesOpen(e, channel) {
    if (!e || e.status === 'iptal' || e.status === 'taslak') return { ok: false, why: 'Etkinlik satışta değil' };
    const now = Date.now(), st = window.BILET.start(e).getTime();
    if (channel === 'online' && e.salesStart && now < new Date(e.salesStart).getTime()) return { ok: false, why: `Satış ${NS.dt(e.salesStart)} tarihinde başlıyor` };
    const end = channel === 'online' ? (e.salesEnd ? new Date(e.salesEnd).getTime() : st) : st + 3600000;
    if (now > end) return { ok: false, why: channel === 'online' ? 'Online satış kapandı' : 'Etkinlik başlayalı 1 saatten fazla oldu' };
    return { ok: true };
  },
  // İndirim kodu: aktif, tarih aralığında, kullanım sınırı içinde, etkinliğe uygun; %100 kodlar (davetiye) online kullanılamaz
  codeCheck(db, code, e, n, channel) {
    if (!code) return { k: null };
    const k = db.find('codes', (c) => c.code === String(code).trim().toUpperCase());
    if (!k || !k.active) return { err: 'Geçersiz indirim kodu' };
    const d = NS.today();
    if (k.from && d < k.from) return { err: `Bu kod ${NS.date(k.from)} tarihinden itibaren geçerli` };
    if (k.to && d > k.to) return { err: 'Bu kodun süresi doldu' };
    if (k.events && !String(k.events).split(',').map((x) => x.trim()).filter(Boolean).includes(e.id)) return { err: 'Bu kod bu etkinlikte geçerli değil' };
    if (Number(k.maxUses) && (k.uses || 0) + n > Number(k.maxUses)) return { err: `Bu kodun kullanım hakkı doldu (kalan ${Math.max(0, k.maxUses - (k.uses || 0))})` };
    if (channel === 'online' && (Number(k.pct) >= 100 || k.online === false)) return { err: 'Bu kod online satışta kullanılamaz' };
    return { k };
  },
  // Kullanılmayan indirim hakkı geri döner (süresi dolan, iptal edilen, iade edilen bilet)
  codeBack(db, t) { if (!t.discount) return; const k = db.find('codes', (c) => c.code === t.discount); if (k) k.uses = Math.max(0, (k.uses || 0) - 1); },
  // Bilet türleri etkinlikte tutulur ("Öğrenci:30, Çocuk:50"); Tam her zaman vardır. Fiyat kuralı sunucuyla aynıdır (public-rules: evUnit)
  types(e) { return [{ id: 'Tam', pct: 0 }, ...String((e && e.ttypes) || '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [id, p] = x.split(':'); return { id: id.trim(), pct: Math.min(100, Math.max(0, Number(p) || 0)) }; })]; },
  // Erken kuş: tarihi gelen ilk basamak uygulanır
  tierPct(e, day = NS.today()) { const t = [[e.tier1Until, e.tier1Pct], [e.tier2Until, e.tier2Pct]].filter(([u, p]) => u && Number(p) > 0 && day <= u).sort((a, b) => a[0].localeCompare(b[0]))[0]; return t ? Math.min(100, Number(t[1])) : 0; },
  unitPrice(e, cat, ttype, day) { const base = Number((e.prices || {})[cat]) || 0; const ty = BILET.types(e).find((x) => x.id === ttype) || { pct: 0 }; return Math.round(base * (1 - BILET.tierPct(e, day) / 100) * (1 - ty.pct / 100)); },
  code() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += A[Math.floor(Math.random() * A.length)]; return s; },
  seats(v) { const off = new Set(v.closed || []); return v.type !== 'seated' ? [] : v.rows.flatMap(({ r, cat }) => Array.from({ length: v.seatsPerRow }, (_, i) => ({ id: `${r}${i + 1}`, row: r, n: i + 1, cat }))).filter((s) => !off.has(s.id)); },
  sold(db, evId) { return new Set(db.all('tickets', (t) => t.event === evId && t.status !== 'refunded' && t.seat).map((t) => t.seat)); },
  held(db, evId, mine) { const now = Date.now(); return new Set(db.all('holds', (h) => h.event === evId && h.until > now && h.owner !== mine).map((h) => h.seat)); },
  capacity(v) { return v.type === 'seated' ? BILET.seats(v).length : Object.values(v.capacity).reduce((a, b) => a + b, 0); },
  // Kontenjana ayrılan koltuk satışa kapalıdır (davetiye bu koltuklardan verilir)
  blocked(ev) { return (ev && ev.blocks) || {}; },
  catLeft(db, ev, v, cat) { if (v.type !== 'seated') return v.capacity[cat] - db.all('tickets', (t) => t.event === ev.id && t.cat === cat && t.status !== 'refunded').length; const sold = BILET.sold(db, ev.id); const bl = BILET.blocked(ev); return BILET.seats(v).filter((s) => s.cat === cat && !sold.has(s.id) && !bl[s.id]).length; },
  COLORS: ['#7c3aed', '#0284c7', '#16a34a', '#ea580c'],
  // Koltuk planı: sahne üstte, kategori renkleri, satılmış/kilitli/seçili durumları
  seatMap(db, ev, v, { selected = [], mine = null, interactive = true, editor = false } = {}) {
    const sold = BILET.sold(db, ev.id), held = BILET.held(db, ev.id, mine); const off = new Set(v.closed || []); const bl = BILET.blocked(ev); const aisles = v.aisles && v.aisles.length ? v.aisles : [Math.floor(v.seatsPerRow / 2)];
    const catColor = Object.fromEntries(Object.keys(v.cats).map((c, i) => [c, BILET.COLORS[i % BILET.COLORS.length]]));
    return `<div class="smap"><div class="stage">SAHNE</div>${v.rows.map(({ r, cat }) => `<div class="srow"><span class="rl">${r}</span>${Array.from({ length: v.seatsPerRow }, (_, i) => { const id = `${r}${i + 1}`; const gap = aisles.includes(i) ? ' gap' : ''; if (off.has(id)) return `<span class="seat off${gap}" ${editor ? `data-seat="${id}" role="button"` : ''}></span>`; const st = sold.has(id) ? 'sold' : held.has(id) || (bl[id] && !editor) ? 'held' : selected.includes(id) ? 'sel' : bl[id] ? 'blk' : 'free'; return `<button type="button" class="seat ${st}${gap}" ${(interactive && st !== 'sold' && st !== 'held') ? `data-seat="${id}"` : 'disabled'} title="${id} · ${v.cats[cat]}${bl[id] ? ' · ' + NS.esc(bl[id]) : ''} · ${NS.money(ev.prices[cat])}" style="--c:${catColor[cat]}">${i + 1}</button>`; }).join('')}<span class="rl">${r}</span></div>`).join('')}
      <div class="legend" style="justify-content:center">${Object.entries(v.cats).map(([c, n]) => `<span><i style="background:${catColor[c]}"></i>${n} ${NS.money(ev.prices[c])}</span>`).join('')}<span><i style="background:var(--border)"></i>Dolu</span><span><i style="background:repeating-linear-gradient(45deg,#999 0 3px,transparent 3px 6px)"></i>Başkası seçiyor</span></div></div>`;
  },
  CSS: `.smap{overflow-x:auto;padding:6px 0}.stage{margin:0 auto 18px;max-width:420px;text-align:center;padding:8px;border-radius:0 0 60px 60px;background:linear-gradient(180deg,var(--text),color-mix(in srgb,var(--text) 70%,transparent));color:var(--bg);font-weight:800;letter-spacing:.3em;font-size:12px}
    .srow{display:flex;gap:4px;justify-content:center;margin-bottom:4px;align-items:center}.srow .rl{width:18px;text-align:center;font-size:11px;font-weight:700;color:var(--text-3)}
    .seat{width:26px;height:24px;border-radius:6px 6px 3px 3px;border:0;font:700 9px var(--font);cursor:pointer;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);box-shadow:inset 0 -3px 0 color-mix(in srgb,var(--c) 45%,transparent);padding:0}
    .seat.gap{margin-left:14px}.seat:hover{background:var(--c);color:#fff}.seat.sel{background:var(--c);color:#fff;transform:scale(1.08)}.seat.sold{background:var(--border);color:transparent;box-shadow:none;cursor:not-allowed}
    .seat.held{background:repeating-linear-gradient(45deg,#9993 0 3px,transparent 3px 6px);color:transparent;cursor:not-allowed}
    .seat.off{display:inline-block;background:transparent;box-shadow:inset 0 0 0 1px var(--border);opacity:.5}.seat.blk{background:var(--text);color:var(--bg)}
    .tv{min-height:calc(100vh - 120px);display:flex;flex-direction:column;gap:18px}.tv .big{font-size:clamp(64px,16vw,190px);font-weight:900;line-height:1}.tv .tvg{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
    .tix{display:grid;grid-template-columns:1fr auto;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--surface)}.tix .l{padding:16px;color:#fff}.tix .r{padding:12px;display:grid;place-items:center;border-left:2px dashed var(--border);background:var(--surface)}`,
};
