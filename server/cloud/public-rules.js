// Müşteriye açık sayfaların veri kuralları (beyaz liste). Her uygulama için:
//   settings : sayfaya gidecek ayar anahtarları (verilmezse gizli anahtarlar hariç hepsi)
//   pub      : herkesin görebileceği koleksiyonlar → true (tüm alanlar) | ['alan', ...] | { fields, omit, where(r, x) }
//   login    : (x, q) → { k, i } | null — takip kodu, telefon + şifre gibi sorgulamalar; başarılıysa imzalı belirteç verilir
//   view     : (x) → { koleksiyon: [...] } — giriş yapan kişiye özel kayıtlar (x.ident.k / x.ident.i)
//   write    : { koleksiyon: { ins(rec, x), upd(cur, set, x, unset), del(cur, x) } } — yalnızca burada izin verilen değişiklikler yazılır
//   after    : (x, değişenler) → işlemler sonrası sunucu tarafı tamamlama (müşteri birleştirme vb.)
// x: { doc, ident, q, col(n), get(n, id), seq(n, önek), now, today }
const bad = (m) => { throw Object.assign(new Error(m || 'Geçersiz bilgi'), { status: 400 }); };
const deny = (m) => { throw Object.assign(new Error(m || 'Bu işleme izin verilmiyor'), { status: 403 }); };
const nowIso = () => new Date().toISOString();
const digits = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const samePhone = (a, b) => digits(a).length >= 10 && digits(a) === digits(b);
const norm = (s) => String(s || '').trim().toLocaleUpperCase('tr').replace(/\s+/g, '');

// Alan tipleri: 'str:80', 'int:0:99', 'num:0:1e6', 'bool', 'date', 'time', 'iso', 'phone', 'email', 'id', 'enum:a|b', 'json:2000', 'strs:20'
// Sonuna '?' eklenen alan isteğe bağlıdır.
function val(type, v, name) {
  const [t, a, b] = type.split(':');
  const fail = () => bad(`Geçersiz alan: ${name}`);
  switch (t) {
    case 'str': if (v == null) return ''; if (typeof v !== 'string' && typeof v !== 'number') fail(); return String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, Number(a) || 200);
    case 'int': { const n = Number(v); if (!Number.isInteger(n) || n < Number(a) || n > Number(b)) fail(); return n; }
    case 'num': { const n = Number(v); if (!Number.isFinite(n) || n < Number(a) || n > Number(b)) fail(); return Math.round(n * 100) / 100; }
    case 'bool': return !!v;
    case 'date': if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(); return v;
    case 'time': if (typeof v !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) fail(); return v;
    case 'iso': if (typeof v !== 'string' || isNaN(Date.parse(v)) || v.length > 40) fail(); return v;
    case 'phone': if (typeof v !== 'string' || v.replace(/\D/g, '').length < 10 || v.length > 25) fail(); return v.trim();
    case 'email': if (v === '' || v == null) return ''; if (typeof v !== 'string' || v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(); return v.trim();
    case 'id': if (typeof v !== 'string' || !/^[A-Za-z0-9_.:-]{1,60}$/.test(v)) fail(); return v;
    case 'enum': if (!a.split('|').includes(String(v))) fail(); return String(v);
    case 'json': { const s = JSON.stringify(v === undefined ? null : v); if (s.length > (Number(a) || 2000)) fail(); return JSON.parse(s); }
    case 'strs': if (!Array.isArray(v) || v.length > (Number(a) || 20)) fail(); return v.map((x) => val('str:120', x, name));
    default: return fail();
  }
}
// spec: { alan: 'tip' } → src'den yalnızca bu alanlar, doğrulanmış olarak
function clean(spec, src, partial) {
  const out = {};
  for (const [k, type] of Object.entries(spec)) {
    const opt = type.endsWith('?'); const tp = opt ? type.slice(0, -1) : type;
    if (src[k] === undefined || (opt && (src[k] === null || src[k] === ''))) { if (!opt && !partial) bad(`Eksik alan: ${k}`); if (opt && src[k] !== undefined) out[k] = tp.startsWith('str') || tp === 'email' ? '' : null; continue; }
    out[k] = val(tp, src[k], k);
  }
  return out;
}
// Ekleme kuralı: izinli alanlar + sunucunun belirlediği sabit alanlar
const I = (spec, fixed, check) => (rec, x) => {
  const r = { ...clean(spec, rec), ...(typeof fixed === 'function' ? fixed(rec, x) : fixed || {}), created: nowIso() };
  if (check) check(r, x, rec);
  return r;
};
// Güncelleme kuralı: yalnızca belirtilen alanlar değişebilir; guard kaydın sahipliğini / durumunu doğrular
const U = (spec, guard, fixed) => (cur, set, x, unset) => {
  const keys = Object.keys(set).filter((k) => k !== 'updated');
  if (keys.some((k) => !(k in spec)) || (unset || []).some((k) => !(k in spec))) deny();
  if (guard && !guard(cur, x, set)) deny();
  const patch = clean(spec, set, true);
  return { ...patch, ...(typeof fixed === 'function' ? fixed(cur, x, patch) : fixed || {}), updated: nowIso() };
};
const me = (x, kind) => x.ident && (!kind || x.ident.k === kind) ? x.ident.i : null;
// Aynı telefonla daha önce kayıtlı müşteri varsa yeni kaydı sil, bağlı kayıtları eskisine yönlendir
function mergeByPhone(x, list, col, refs) {
  list.filter(([n]) => n === col).forEach(([, rec]) => {
    const old = x.col(col).find((c) => c !== rec && samePhone(c.phone, rec.phone));
    if (!old) return;
    x.doc[col] = x.col(col).filter((c) => c !== rec);
    refs.forEach(([rc, f]) => x.col(rc).forEach((r) => { if (r[f] === rec.id) r[f] = old.id; }));
    if (!old.email && rec.email) old.email = rec.email;
  });
}
const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };

// Dizi alanı yalnızca sona eklenerek büyüyebilir (hareket geçmişi, mesajlar...): eski öğeler aynen kalmalı
function appendOnly(oldArr, newArr, max, spec, fixed) {
  const o = Array.isArray(oldArr) ? oldArr : []; if (!Array.isArray(newArr) || newArr.length < o.length || newArr.length - o.length > max) deny();
  for (let i = 0; i < o.length; i++) if (JSON.stringify(o[i]) !== JSON.stringify(newArr[i])) deny();
  return [...o, ...newArr.slice(o.length).map((it) => ({ ...clean(spec, it || {}), ...(fixed || {}) }))];
}
const strip = (r, fields) => { const o = { ...r }; fields.forEach((f) => delete o[f]); return o; };

const RULES = {};

// ---------- Randevu: online randevu (book.html) ----------
// Online randevu saati uygun mu: uzman, hizmet, çalışma saati, 90 gün sınırı, çakışma (taşımada kendisi hariç)
function randevuSlot(x, r, selfId) {
  const st = x.get('staff', r.staff); const sv = x.get('services', r.service);
  if (!st || st.active === false || !sv || (Array.isArray(sv.staff) && !sv.staff.includes(st.id))) bad('Uzman bulunamadı');
  if (r.date < x.today || r.date > new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10)) bad('Geçersiz tarih');
  const h = (st.hours || {})[new Date(r.date + 'T12:00').getDay()]; const a = toMin(r.start), b = a + Number(r.duration || 0);
  if (!h || a < toMin(h.start) || b > toMin(h.end)) bad('Uzman bu saatte çalışmıyor');
  const busy = x.col('appointments').some((o) => o.id !== selfId && o !== r && o.staff === r.staff && o.date === r.date && o.status !== 'iptal' && overlap(a, b, toMin(o.start), toMin(o.start) + Number(o.duration || 0)))
    || x.col('blocks').some((o) => o.staff === r.staff && o.date === r.date && overlap(a, b, toMin(o.start), toMin(o.end)));
  if (busy) throw Object.assign(new Error('Bu saat az önce doldu, lütfen başka saat seçin'), { status: 409 });
}
RULES.randevu = {
  pub: {
    services: { where: (r) => r.online, omit: ['cost'] },
    staff: { where: (r) => r.active !== false, fields: ['id', 'name', 'title', 'color', 'hours', 'active', 'photo', 'bio', 'skills'] },
    // Müsaitlik hesabı için yalnızca dolu saatler (müşteri bilgisi olmadan)
    appointments: { where: (r, x) => r.date >= x.today && r.status !== 'iptal', fields: ['id', 'date', 'start', 'duration', 'staff', 'status', 'service'] },
    blocks: { where: (r, x) => r.date >= x.today, fields: ['id', 'staff', 'date', 'start', 'end'] },
  },
  // Telefon tek başına kimlik değildir. Portal kodu (işletme verir) tüm randevuları, randevu kodu yalnızca o randevuyu açar:
  // başkasının numarasıyla randevu alan kişi kendi kodunu görür, ama müşterinin bilgilerine ve diğer randevularına ulaşamaz.
  login: (x, q) => {
    const code = norm(q.code); if (!code || !q.phone) return null;
    const c = x.col('customers').find((r) => r.portalCode && norm(r.portalCode) === code && samePhone(r.phone, q.phone)); if (c) return { k: 'c', i: c.id };
    const a = x.col('appointments').find((r) => r.tCode && norm(r.tCode) === code); const o = a && x.get('customers', a.customer);
    return o && samePhone(o.phone, q.phone) ? { k: 'a', i: a.id } : null;
  },
  loginError: 'Telefon veya kod hatalı',
  grant: (x, list) => { if (me(x, 'c')) return null; const a = list.find(([n, rec]) => n === 'appointments' && !rec.updated); return a ? { k: 'a', i: a[1].id } : null; },
  view: (x) => {
    const oneId = me(x, 'a'); if (oneId) { const a = x.get('appointments', oneId); return a ? { appointments: [...x.col('appointments').filter((r) => r.id !== oneId && r.date >= x.today && r.status !== 'iptal').map((r) => x.pick(r, ['id', 'date', 'start', 'duration', 'staff', 'status', 'service'])), x.pick(a, ['id', 'date', 'start', 'duration', 'staff', 'status', 'service', 'note', 'tCode'])] } : {}; }
    const id = me(x, 'c'); if (!id) return {};
    const c = x.get('customers', id); const mine = x.col('appointments').filter((a) => a.customer === id);
    const ids = new Set(mine.map((a) => a.id));
    return { customers: c ? [x.pick(c, ['id', 'name', 'phone', 'email'])] : [], appointments: [...x.col('appointments').filter((a) => a.date >= x.today && a.status !== 'iptal' && !ids.has(a.id)).map((a) => x.pick(a, ['id', 'date', 'start', 'duration', 'staff', 'status', 'service'])), ...mine] };
  },
  write: {
    customers: {
      ins: I({ name: 'str:80', phone: 'phone', email: 'email?' }, { tags: ['Online'], notes: '' }),
      upd: U({ email: 'email' }, (c, x) => c.id === me(x, 'c') && !c.email),
    },
    appointments: {
      ins: I({ date: 'date', start: 'time', staff: 'id', service: 'id', customer: 'id', note: 'str:300?', noReminder: 'bool?' }, (r, x) => {
        const sv = x.get('services', r.service); const s = x.doc._settings || {};
        if (!sv || !sv.online) bad('Hizmet bulunamadı');
        return { duration: Number(sv.duration) || 30, price: Number(sv.price) || 0, status: s.autoConfirm ? 'onay' : 'bekliyor', source: 'online', paid: false, tCode: rxCode() };
      }, (r, x) => {
        if (!x.get('customers', r.customer)) bad('Müşteri bilgisi eksik');
        randevuSlot(x, r);
      }),
      // Müşteri kendi randevusunu iptal eder ya da başka güne/saate taşır (iptal süresi kuralı ikisinde de geçerli; taşımada yeni saat yeniden denetlenir)
      upd: (a, set, x, unset) => {
        const s = x.doc._settings || {};
        if ((a.customer !== me(x, 'c') && a.id !== me(x, 'a')) || ['iptal', 'tamam'].includes(a.status) || (new Date(`${a.date}T${a.start}:00+03:00`) - Date.now()) / 3600e3 <= Number(s.cancelHours || 0)) deny();
        if (!('date' in set) && !('start' in set)) return U({ status: 'enum:iptal', note: 'str:200?' })(a, set, x, unset);
        const keys = Object.keys(set).filter((k) => !['updated', 'reminded', 'remindTried', 'remindTest', 'status'].includes(k));
        if (keys.some((k) => !['date', 'start', 'note'].includes(k)) || (unset || []).some((k) => !['reminded', 'remindTried', 'remindTest'].includes(k))) deny();
        const p = clean({ date: 'date', start: 'time', note: 'str:400?' }, set);
        randevuSlot(x, { ...a, date: p.date, start: p.start }, a.id);
        return { ...p, status: s.autoConfirm ? a.status : 'bekliyor', reminded: null, remindTried: null, remindTest: null, updated: nowIso() };
      },
    },
  },
  after: (x, list) => mergeByPhone(x, list, 'customers', [['appointments', 'customer']]),
};

// ---------- Teknik servis: cihaz takip (takip.html?kod=) ----------
RULES.servis = {
  pub: {},
  // Yalnızca rastgele takip kodu: kayıt no (SRV-1001...) sıralı olduğu için tahmin edilebilir, başkasının cihazını gösterip onay verdirebiliyordu
  login: (x, q) => { const k = norm(q.kod); const t = k && x.col('tickets').find((t) => t.code && norm(t.code) === k); return t ? { k: 't', i: t.id } : null; },
  loginError: 'Bu koda ait kayıt bulunamadı',
  view: (x) => {
    const t = x.get('tickets', me(x, 't')); if (!t) return { tickets: [], techs: [] };
    const tech = x.get('techs', t.tech);
    return { tickets: [{ ...strip(t, ['lockCode', 'customer', 'serial', 'cost', 'internal']), parts: (t.parts || []).map((p) => strip(p, ['cost'])) }], techs: tech ? [{ id: tech.id, name: tech.name }] : [] };
  },
  write: {
    tickets: {
      upd: (cur, set, x) => {
        if (cur.id !== me(x, 't')) deny();
        const keys = Object.keys(set).filter((k) => k !== 'updated'); const out = {};
        const LOG = { at: 'iso', status: 'str:20', note: 'str:400' };
        if (cur.status === 'onay' && keys.every((k) => ['approved', 'status', 'log'].includes(k)) && ['tamirde', 'iade'].includes(set.status)) {
          out.status = set.status; out.approved = set.status === 'tamirde'; out.log = appendOnly(cur.log, set.log, 1, LOG, { user: 'Müşteri (online)', status: set.status });
          if (set.status === 'tamirde') out.approvedAt = nowIso();
        } else if (cur.status === 'teslim' && !cur.review && keys.length === 1 && keys[0] === 'review') {
          out.review = { ...clean({ stars: 'int:1:5', text: 'str:500?' }, set.review || {}), at: nowIso() };
        } else deny();
        return { ...out, updated: nowIso() };
      },
    },
  },
};

// ---------- Kargo: gönderi takip (takip.html?no=) ----------
const maskName = (n) => { const [name, rel] = String(n || '').split(' ('); return name.split(' ').filter(Boolean).map((w) => w[0] + '*'.repeat(Math.max(1, w.length - 1))).join(' ') + (rel ? ' (' + rel : ''); };
const publicNote = (h) => (h.status === 'teslim' ? 'Teslim edildi' : h.status === 'edilemedi' ? String(h.note || '').split(' — ')[0].split(' · konum')[0] : h.status === 'dagitimda' ? 'Kurye dağıtıma çıkardı' : String(h.note || ''));
RULES.kargo = {
  pub: {},
  // Takip numarası gönderiyi gösterir; değişiklik için alıcı telefonunun son 4 hanesi gerekir
  login: (x, q) => {
    const k = norm(q.no); const sh = k && x.col('ships').find((s) => s.no === k); if (!sh) return null;
    if (q.last4 === undefined) return { k: 's', i: sh.id };
    return String(q.last4).replace(/\D/g, '') === digits((sh.receiver || {}).phone).slice(-4) ? { k: 'v', i: sh.id } : null;
  },
  loginError: 'Bilgiler eşleşmedi',
  view: (x) => {
    const sh = x.ident && x.get('ships', x.ident.i); if (!sh) return { ships: [], couriers: [] };
    const r = sh.receiver || {}, sd = sh.sender || {}; const cr = sh.courier && x.get('couriers', sh.courier);
    // Hareket notlarında teslim alanın adı, teslim konumu ve personel adı var: takip numarasını bilen herkese gitmez
    const history = (sh.history || []).map((h) => ({ at: h.at, status: h.status, note: publicNote(h) }));
    return {
      ships: [{ ...x.pick(sh, ['id', 'no', 'at', 'status', 'retryDate', 'pref', 'service', 'cod', 'rating', 'courier', 'region', 'pieces', 'desi', 'failReason', 'attempts']), history, proof: !!(sh.signature || sh.geo || sh.photo), receiver: { name: maskName(r.name), district: r.district, city: r.city }, sender: { name: sd.name, district: sd.district }, deliveredTo: sh.deliveredTo ? maskName(sh.deliveredTo) : undefined }],
      couriers: cr ? [{ id: cr.id, name: String(cr.name || '').split(' ')[0], vehicle: cr.vehicle }] : [],
    };
  },
  write: {
    ships: {
      upd: (cur, set, x) => {
        if (!x.ident || cur.id !== x.ident.i) deny();
        const keys = Object.keys(set).filter((k) => k !== 'updated'); const out = {};
        const H = { at: 'iso', status: 'str:20', note: 'str:300' };
        if (keys.length === 1 && keys[0] === 'rating' && cur.status === 'teslim') out.rating = { ...clean({ stars: 'int:1:5' }, set.rating || {}), at: nowIso() };
        else if (x.ident.k === 'v' && keys.every((k) => ['pref', 'history', 'retryDate'].includes(k)) && !['teslim', 'iade'].includes(cur.status)) {
          if ('pref' in set) out.pref = set.pref ? { ...clean({ type: 'enum:komsu|gorevli|sube|gun', note: 'str:200?', date: 'str:10?' }, set.pref), at: nowIso() } : null;
          if ('retryDate' in set) { if (cur.status !== 'edilemedi') deny(); const d = val('date', set.retryDate, 'retryDate'); if (d <= x.today || d > new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10)) bad('Geçersiz tarih'); out.retryDate = d; }
          // Sayfa geçmişin süzülmüş halini gördüğü için eski öğeler karşılaştırılmaz: sunucudaki kayıt korunur, yalnızca son eklenen alınır
          if ('history' in set) { const old = cur.history || []; if (!Array.isArray(set.history) || set.history.length !== old.length + 1) deny(); out.history = [...old, { ...clean(H, set.history[old.length] || {}), status: 'retryDate' in set ? 'edilemedi' : cur.status, by: 'Alıcı (online)' }]; }
        } else deny();
        return { ...out, updated: nowIso() };
      },
    },
  },
};

// ---------- CRM: online teklif onayı (teklif.html?t=) ----------
RULES.crm = {
  pub: {},
  login: (x, q) => { const t = typeof q.t === 'string' && q.t.length >= 8 && x.col('quotes').find((r) => r.token === q.t); return t ? { k: 'q', i: t.id } : null; },
  loginError: 'Teklif bulunamadı veya bağlantı geçersiz',
  view: (x) => {
    const q = x.get('quotes', me(x, 'q')); if (!q) return { quotes: [] };
    const d = x.get('deals', q.deal) || {}; const c = x.get('companies', d.company); const ct = x.get('contacts', d.contact); const u = x.get('users', d.owner);
    return { quotes: [{ ...strip(q, ['cost', 'margin', 'internal']), lines: (q.lines || []).map((l) => strip(l, ['cost'])) }], deals: d.id ? [x.pick(d, ['id', 'title', 'company', 'contact', 'owner'])] : [], companies: c ? [x.pick(c, ['id', 'name'])] : [], contacts: ct ? [x.pick(ct, ['id', 'name', 'title'])] : [], users: u ? [x.pick(u, ['id', 'name'])] : [] };
  },
  write: {
    quotes: {
      upd: (q, set, x) => {
        if (q.id !== me(x, 'q')) deny();
        const keys = Object.keys(set).filter((k) => k !== 'updated');
        const act = (text) => x.col('activities').push({ id: 'pa' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), deal: q.deal, type: 'not', date: nowIso(), text, done: true, created: nowIso() });
        if (keys.length === 1 && keys[0] === 'viewedAt') { if (q.viewedAt) return {}; act(`Müşteri teklif ${q.no} bağlantısını açtı`); return { viewedAt: nowIso() }; }
        const open = (q.status || 'gonderildi') === 'gonderildi' && !(q.valid && q.valid < x.today);
        if (!open || !['kabul', 'red'].includes(set.status) || keys.some((k) => !['status', 'signer', 'respondedAt', 'rejectReason', 'viewedAt'].includes(k))) deny('Bu teklif artık yanıtlanamaz');
        const at = nowIso(); const d = x.get('deals', q.deal);
        if (set.status === 'kabul') {
          const signer = val('str:120', set.signer, 'signer'); if (signer.length < 3) bad('Adınızı yazın');
          if (d) { if (!['kazanildi', 'kaybedildi'].includes(d.stage)) { d.stage = 'kazanildi'; d.closedAt = at.slice(0, 10); d.value = q.total; } d.lastActivity = at; }
          x.col('quotes').forEach((o) => { if (o.id !== q.id && o.deal === q.deal && (o.status || 'gonderildi') === 'gonderildi') o.status = 'revize'; });
          act(`Teklif ${q.no} müşteri tarafından online kabul edildi (${signer})`);
          return { status: 'kabul', signer, respondedAt: at, updated: at };
        }
        const reason = val('str:600', set.rejectReason, 'rejectReason');
        if (d) { if (d.stage === 'teklif') d.stage = 'pazarlik'; d.lastActivity = at; }
        act(`Teklif ${q.no} müşteri tarafından reddedildi: ${reason}`);
        return { status: 'red', rejectReason: reason, respondedAt: at, updated: at };
      },
    },
    deals: 'ignore', activities: 'ignore',
  },
};

// ---------- Oto servis: iş emri onayı (onay.html?k=) ----------
const otsToken = (j) => (String(j.id).replace(/\W/g, '').slice(-6) + String(j.no).replace(/\D/g, '')).toUpperCase();
RULES.otoservis = {
  pub: {},
  login: (x, q) => { const k = norm(q.k); const j = k.length >= 6 && x.col('jobs').find((r) => otsToken(r) === k); return j ? { k: 'j', i: j.id } : null; },
  loginError: 'Kayıt bulunamadı',
  view: (x) => {
    const j = x.get('jobs', me(x, 'j')); if (!j) return { jobs: [] };
    const v = x.get('vehicles', j.vehicle);
    return { jobs: [{ ...strip(j, ['customer', 'internal', 'cost']), items: (j.items || []).map((i) => strip(i, ['cost'])) }], vehicles: v ? [x.pick(v, ['id', 'plate', 'brand', 'model', 'year'])] : [] };
  },
  write: {
    jobs: {
      upd: (j, set, x) => {
        if (j.id !== me(x, 'j') || j.status !== 'onay') deny('Bu iş emri artık onay beklemiyor');
        const keys = Object.keys(set).filter((k) => k !== 'updated'); if (keys.some((k) => !['items', 'status', 'history'].includes(k)) || !Array.isArray(set.items)) deny();
        const want = new Map(set.items.map((i) => [i && i.id, i && i.approved !== false]));
        const items = (j.items || []).map((i) => ({ ...i, approved: want.has(i.id) ? want.get(i.id) : i.approved !== false }));
        const n = items.filter((i) => i.approved).length; const status = n ? 'islemde' : 'hazir';
        const history = [...(j.history || []), { at: nowIso(), st: status, note: n ? `Müşteri ${n} kalemi online onayladı` : 'Müşteri işlemleri reddetti — araç teslime hazır' }];
        return { items, status, history, updated: nowIso() };
      },
    },
  },
};

// ---------- Veteriner: pati karnesi (karne.html) — telefonla giriş ----------
// Telefon + işletmenin verdiği rastgele portalCode birlikte eşleşmeli (yalnızca telefonla giriş, numarayı bilen herkese kaydı açıyordu)
const ownerOf = (col, field = 'phone') => (x, q) => { const code = norm(q.code); const o = code && q.phone && x.col(col).find((r) => r.portalCode && norm(r.portalCode) === code && samePhone(r[field], q.phone)); return o ? { k: 'o', i: o.id } : null; };
RULES.veteriner = {
  pub: {},
  login: ownerOf('owners'), loginError: 'Telefon veya giriş kodu hatalı',
  view: (x) => {
    const o = x.get('owners', me(x, 'o')); if (!o) return {};
    const pets = x.col('pets').filter((p) => p.owner === o.id); const ids = new Set(pets.map((p) => p.id));
    return { owners: [x.pick(o, ['id', 'name', 'phone'])], pets, vaccines: x.col('vaccines').filter((v) => ids.has(v.pet)), visits: x.col('visits').filter((v) => ids.has(v.pet)).map((v) => x.pick(v, ['id', 'pet', 'date', 'diagnosis', 'complaint', 'treatment', 'weight'])), appts: x.col('appts').filter((a) => ids.has(a.pet)) };
  },
  write: {
    appts: {
      ins: I({ pet: 'id', date: 'date', time: 'time', reason: 'str:300' }, () => ({ vet: '', status: 'talep', source: 'online', at: nowIso() }), (r, x) => {
        const p = x.get('pets', r.pet); if (!p || p.owner !== me(x, 'o')) deny();
        if (r.date <= x.today || r.date > new Date(Date.now() + 31 * 864e5).toISOString().slice(0, 10)) bad('Geçersiz tarih');
        if (x.col('appts').filter((a) => a.pet === r.pet && a.status === 'talep').length >= 5) bad('Bekleyen çok fazla randevu isteğiniz var');
      }),
    },
  },
};

// ---------- Otel: online rezervasyon (rezervasyon.html) ----------
const addDay = (d, n) => new Date(new Date(d + 'T12:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);
const otelSet = (x) => ({ directDiscount: 10, hbPrice: 650, freeCancelDays: 3, ...(x.doc._settings || {}) });
function otelQuote(x, t, ci, co, board, ad, ch) {
  const S = otelSet(x); const ns = [];
  // Program ve rezervasyon.html ile aynı: sezon farkı + hafta sonu farkı (cuma ve cumartesi geceleri, types.weekendPct)
  for (let d = ci; d < co; d = addDay(d, 1)) { const pct = x.col('seasons').filter((s) => s.from <= d && d <= s.to).reduce((a, s) => a + (Number(s.pct) || 0), 0); const we = [5, 6].includes(new Date(d + 'T12:00:00Z').getUTCDay()) ? Number(t.weekendPct) || 0 : 0; ns.push(Math.round((Number(t.price) * (1 + pct / 100) * (1 + we / 100)) / 10) * 10); }
  const room = ns.reduce((a, b) => a + b, 0); const disc = Math.round(room * S.directDiscount / 100);
  const hb = board === 'HB' ? S.hbPrice * (ad + ch * 0.5) * ns.length : 0; const ro = board === 'RO' ? Math.round((room - disc) * 0.1) : 0;
  return { n: ns.length, total: room - disc + hb - ro };
}
const daysTo = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
// Bir rezervasyonun belirli bir odayı aralıkta kullanıp kullanmadığı (oda değişikliği: segs — geçmiş geceler eski odada)
const otelUses = (o, roomId, ci, co) => { if (!(o.checkIn < co && ci < o.checkOut)) return false; if (!(o.segs || []).length) return o.room === roomId; for (let d = o.checkIn > ci ? o.checkIn : ci; d < co && d < o.checkOut; d = addDay(d, 1)) { const sg = o.segs.find((g) => g.from <= d && d < g.to); if ((sg ? sg.room : o.room) === roomId) return true; } return false; };
RULES.otel = {
  pub: {
    types: true, seasons: true,
    rooms: { fields: ['id', 'no', 'type', 'hk', 'floor'] },
    reservations: { where: (r, x) => r.checkOut >= x.today && r.status !== 'iptal' && r.status !== 'noshow', fields: ['id', 'room', 'checkIn', 'checkOut', 'status', 'segs'] },
    blocks: { where: (b, x) => b.to >= x.today, fields: ['id', 'room', 'from', 'to'] }, // satışa kapalı aralıklar (neden gösterilmez)
  },
  login: (x, q) => { const no = norm(q.no); const r = no && x.col('reservations').find((r) => r.no === no); const g = r && x.get('guests', r.guest); return g && samePhone(g.phone, q.phone) ? { k: 'r', i: r.id } : null; },
  loginError: 'Eşleşen rezervasyon bulunamadı',
  view: (x) => {
    const r = x.get('reservations', me(x, 'r')); if (!r) return {};
    const g = x.get('guests', r.guest);
    return { reservations: [...x.col('reservations').filter((o) => o.id !== r.id && o.checkOut >= x.today && o.status !== 'iptal' && o.status !== 'noshow').map((o) => x.pick(o, ['id', 'room', 'checkIn', 'checkOut', 'status', 'segs'])), strip(r, ['folio', 'internal'])], guests: g ? [x.pick(g, ['id', 'name', 'phone', 'email'])] : [] };
  },
  write: {
    guests: { ins: I({ name: 'str:80', phone: 'phone', email: 'email?', nat: 'str:40?' }, { note: '' }) },
    reservations: {
      ins: I({ room: 'id', guest: 'id', checkIn: 'date', checkOut: 'date', adults: 'int:1:12', children: 'int:0:10', board: 'enum:RO|BB|HB', note: 'str:400?', email: 'email?', depositRequest: 'num:0:1e9?' }, (r, x) => ({ source: 'Web sitesi', direct: true, status: 'opsiyon', deposit: 0, folio: [] }), (r, x) => {
        const rm = x.get('rooms', r.room); const t = rm && x.get('types', rm.type);
        if (!rm || !t || rm.hk === 'arizali') bad('Oda bulunamadı');
        if (!x.get('guests', r.guest)) bad('Misafir bilgisi eksik');
        const n = daysTo(r.checkIn, r.checkOut); if (r.checkIn < x.today || n < 1 || n > 30 || daysTo(x.today, r.checkIn) > 400) bad('Geçersiz tarih');
        if (r.adults + r.children > (Number(t.capacity) || 4) + 1) bad('Kişi sayısı oda kapasitesini aşıyor');
        if (Number(t.minNights) > n) bad(`Bu oda tipinde en az ${t.minNights} gece konaklama gerekir`);
        if (x.col('blocks').some((b) => b.room === r.room && b.from < r.checkOut && r.checkIn < b.to)) throw Object.assign(new Error('Bu oda seçilen tarihlerde satışa kapalı'), { status: 409 });
        if (x.col('reservations').some((o) => o !== r && !['iptal', 'noshow'].includes(o.status) && otelUses(o, r.room, r.checkIn, r.checkOut))) throw Object.assign(new Error('Üzgünüz, bu oda az önce doldu'), { status: 409 });
        const q = otelQuote(x, t, r.checkIn, r.checkOut, r.board, r.adults, r.children);
        r.price = Math.round(q.total / q.n); r.no = x.seq('reservations', 'W');
        // Kapora talebi: tutarı istemci belirlemez; istenmişse toplamın %30'u (rezervasyon.html ile aynı)
        if (r.depositRequest) r.depositRequest = Math.round(q.total * 0.3); else delete r.depositRequest;
      }),
      // Misafir kendi rezervasyonunda: ücretsiz iptal süresi içinde iptal; ya da online ön check-in (kimlik, uyruk, doğum, plaka, varış, diğer kişiler)
      upd: (cur, set, x, unset) => {
        if (cur.id !== me(x, 'r') || !['rezerve', 'opsiyon'].includes(cur.status)) bad('Bu rezervasyon değiştirilemez');
        if ('precheck' in set) { const pc = clean({ idNo: 'str:20', nat: 'str:40?', birth: 'date?', plate: 'str:15?', eta: 'str:20?', others: 'str:600?' }, set.precheck || {}); if (Object.keys(set).some((k) => !['precheck', 'updated'].includes(k)) || (unset || []).length) deny(); return { precheck: { ...pc, at: nowIso() }, updated: nowIso() }; }
        return U({ status: 'enum:iptal', cancelNote: 'str:200?' }, (r) => daysTo(x.today, r.checkIn) >= otelSet(x).freeCancelDays)(cur, set, x, unset);
      },
    },
  },
  after: (x, list) => mergeByPhone(x, list, 'guests', [['reservations', 'guest']]),
  grant: (x, list) => { const r = list.find(([n, rec]) => n === 'reservations' && rec.created && !rec.updated); return r ? { k: 'r', i: r[1].id } : null; },
};

// ---------- Spor salonu: üye portalı (uye.html) — telefonla giriş ----------
const sporCls = (x, b) => x.get('classes', b.cls);
RULES.spor = {
  pub: {
    classes: true, plans: true,
    trainers: { fields: ['id', 'name', 'color', 'title', 'photo', 'branch'] },
    bookings: { where: (r, x) => r.date >= x.today, fields: ['id', 'cls', 'date'] }, // doluluk için (üye bilgisi olmadan)
  },
  login: ownerOf('members'), loginError: 'Telefon veya giriş kodu hatalı',
  view: (x) => {
    const m = x.get('members', me(x, 'o')); if (!m) return {};
    const mine = x.col('bookings').filter((b) => b.member === m.id); const ids = new Set(mine.map((b) => b.id));
    return { members: [strip(m, ['note', 'emergency'])], bookings: [...x.col('bookings').filter((b) => b.date >= x.today && !ids.has(b.id)).map((b) => x.pick(b, ['id', 'cls', 'date'])), ...mine], entries: x.col('entries').filter((e) => e.member === m.id), payments: x.col('payments').filter((p) => p.member === m.id) };
  },
  write: {
    bookings: {
      ins: I({ cls: 'id', date: 'date' }, (r, x) => ({ member: me(x, 'o'), source: 'portal', at: nowIso() }), (r, x) => {
        const m = x.get('members', me(x, 'o')); const c = sporCls(x, r); if (!m || !c) deny();
        if (r.date < x.today || r.date > addDay(x.today, 14) || new Date(r.date + 'T12:00:00Z').getUTCDay() !== Number(c.day)) bad('Geçersiz tarih');
        if (new Date(`${r.date}T${c.time}:00+03:00`) < Date.now()) bad('Bu ders başladı');
        if (m.end < x.today || m.freezeUntil >= x.today) bad('Üyeliğiniz aktif değil');
        if (x.col('bookings').some((b) => b.member === m.id && b.cls === c.id && b.date === r.date)) bad('Bu derse zaten kayıtlısınız');
        if (x.col('bookings').filter((b) => b.cls === c.id && b.date === r.date).length >= Number(c.capacity || 0)) throw Object.assign(new Error('Ders az önce doldu'), { status: 409 });
        if (typeof m.sessionsLeft === 'number') { if (m.sessionsLeft <= 0) bad('Ders hakkın kalmadı; paketini yenile'); m.sessionsLeft -= 1; }
      }),
      del: (b, x) => {
        const m = x.get('members', me(x, 'o')); const c = sporCls(x, b);
        if (!m || b.member !== m.id || !c || new Date(`${b.date}T${c.time}:00+03:00`) - Date.now() < 2 * 3600e3) return false;
        if (typeof m.sessionsLeft === 'number') m.sessionsLeft += 1;
        return true;
      },
    },
    members: {
      upd: (m, set, x) => {
        if (m.id !== me(x, 'o')) deny();
        const keys = Object.keys(set).filter((k) => k !== 'updated');
        if (keys.every((k) => k === 'sessionsLeft')) return {}; // ders hakkı sunucuda hesaplanır
        if (keys.some((k) => !['freezeUntil', 'end', 'frozen'].includes(k)) || m.freezeUntil >= x.today) deny();
        const d = daysTo(x.today, val('date', set.freezeUntil, 'freezeUntil')); const max = Number((x.doc._settings || {}).maxFreeze || 30) - (m.frozen || 0);
        if (d < 1 || d > max) bad('Dondurma hakkınız yetersiz');
        return { freezeUntil: addDay(x.today, d), end: addDay(m.end, d), frozen: (m.frozen || 0) + d, updated: nowIso() };
      },
    },
  },
};

// ---------- Kurs: veli portalı (veli.html) — veli telefonuyla giriş ----------
// Deneme sonuçlarında diğer öğrencilerin kimliği gizlenir (sıra ve sınıf ortalaması için puanlar anonim gider)
const anonScores = (e, own) => { let n = 0; const sc = {}; Object.entries(e.scores || {}).forEach(([k, v]) => { sc[own.has(k) ? k : 'x' + (++n)] = v; }); return { ...e, scores: sc }; };
RULES.kurs = {
  pub: { classes: true, lessons: true, teachers: { fields: ['id', 'name', 'color', 'branch', 'title'] } },
  login: (x, q) => { const d = digits(q.phone); const code = norm(q.code); return code && d.length === 10 && x.col('students').some((s) => digits(s.parentPhone) === d && s.portalCode && norm(s.portalCode) === code) ? { k: 'p', i: d } : null; },
  loginError: 'Bu numarayla kayıtlı öğrenci bulunamadı',
  view: (x) => {
    const ph = me(x, 'p'); if (!ph) return {};
    const kids = x.col('students').filter((s) => digits(s.parentPhone) === ph); const ids = new Set(kids.map((s) => s.id)); const cls = new Set(kids.map((s) => s.cls));
    return { homework: x.col('homework').filter((h) => cls.has(h.cls)).map((h) => ({ ...h, done: Object.fromEntries(Object.entries(h.done || {}).filter(([k]) => ids.has(k))) })), students: kids.map((s) => strip(s, ['note', 'internal'])), attendance: x.col('attendance').filter((a) => ids.has(a.student)), exams: x.col('exams').filter((e) => cls.has(e.cls)).map((e) => anonScores(e, ids)), parentMsgs: x.col('parentMsgs').filter((m) => ids.has(m.student)), payments: x.col('payments').filter((p) => ids.has(p.student)) };
  },
  write: {
    parentMsgs: {
      ins: I({ student: 'id', type: 'str:30', date: 'str:10?', text: 'str:1000' }, (r, x) => { const s = x.get('students', r.student) || {}; return { from: s.parent, phone: s.parentPhone, at: nowIso(), status: 'yeni' }; }, (r, x) => {
        const s = x.get('students', r.student); if (!s || digits(s.parentPhone) !== me(x, 'p')) deny();
        if (r.text.length < 5) bad('Lütfen mesajınızı yazın');
        if (x.col('parentMsgs').filter((m) => m.student === s.id && m.status === 'yeni').length >= 20) bad('Çok fazla yanıtlanmamış mesajınız var');
      }),
    },
  },
};

// ---------- Site yönetimi: sakin portalı (sakin.html) — daire + telefonun son 4 hanesi ----------
const SITE_FAC = { tenis: { slots: ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00', '20:00'], max: 2 }, toplanti: { slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], max: 4 }, barbeku: { slots: ['12:00', '15:00', '18:00'], max: 1 }, fitness: { slots: ['07:00', '08:00', '19:00', '20:00', '21:00'], max: 3 } };
const anonVotes = (p, own) => { let n = 0; const v = {}; Object.entries(p.votes || {}).forEach(([k, x]) => { v[k === own ? k : 'x' + (++n)] = x; }); return { ...p, votes: v }; };
RULES.site = {
  pub: {
    flats: { fields: ['id', 'block', 'no', 'floor'] },
    announcements: true,
    polls: { fields: true },
    bookings: { where: (r, x) => r.date >= x.today && r.status === 'aktif', fields: ['id', 'facility', 'date', 'slot', 'status'] },
  },
  // Telefonun son 4 hanesi komşular tarafından bilinebilir: giriş yalnızca yönetimin verdiği rastgele kodla
  login: (x, q) => { const f = typeof q.flat === 'string' && x.get('flats', q.flat); const c = norm(q.code); return f && c && f.portalCode && norm(f.portalCode) === c ? { k: 'f', i: f.id } : null; },
  loginError: 'Sakin kodu bu daireyle eşleşmedi',
  view: (x) => {
    const fid = me(x, 'f'); const own = (r) => r.flat === fid;
    const out = { polls: x.col('polls').map((p) => anonVotes(p, fid)), visitors: [], requests: [] };
    if (!fid) return out;
    const f = x.get('flats', fid);
    return { ...out, flats: x.col('flats').map((o) => (o.id === fid ? f : x.pick(o, ['id', 'block', 'no', 'floor']))), dues: x.col('dues').filter(own), receipts: x.col('receipts').filter(own), bookings: [...x.col('bookings').filter((b) => !own(b) && b.date >= x.today && b.status === 'aktif').map((b) => x.pick(b, ['id', 'facility', 'date', 'slot', 'status'])), ...x.col('bookings').filter(own)], visitors: x.col('visitors').filter(own), requests: x.col('requests').filter(own) };
  },
  write: {
    bookings: {
      ins: I({ facility: 'enum:tenis|toplanti|barbeku|fitness', date: 'date', slot: 'time', people: 'int:1:30', note: 'str:200?' }, (r, x) => ({ flat: me(x, 'f'), status: 'aktif', at: nowIso() }), (r, x) => {
        const fid = me(x, 'f'); const F = SITE_FAC[r.facility]; if (!fid) deny();
        if (!F.slots.includes(r.slot) || r.date < x.today || r.date > addDay(x.today, 6) || new Date(`${r.date}T${r.slot}:00+03:00`) < Date.now()) bad('Geçersiz saat');
        if (x.col('bookings').filter((b) => b.flat === fid && b.facility === r.facility && b.status === 'aktif' && b.date >= x.today).length >= F.max) bad(`Bu alan için en fazla ${F.max} aktif rezervasyon yapabilirsiniz`);
        if (x.col('bookings').some((b) => b.facility === r.facility && b.date === r.date && b.slot === r.slot && b.status === 'aktif')) throw Object.assign(new Error('Bu saat az önce başkası tarafından alındı'), { status: 409 });
      }),
      upd: U({ status: 'enum:iptal' }, (b, x) => b.flat === me(x, 'f') && b.status === 'aktif' && new Date(`${b.date}T${b.slot}:00+03:00`) - Date.now() >= 2 * 3600e3),
    },
    visitors: {
      ins: I({ name: 'str:80', type: 'enum:misafir|kargo|servis|taksi|nakliye', plate: 'str:15?', date: 'date', time: 'str:20?', note: 'str:200?' }, (r, x) => ({ flat: me(x, 'f'), code: require('crypto').randomBytes(3).toString('hex').toUpperCase(), status: 'bekleniyor', at: nowIso() }), (r, x) => {
        if (!me(x, 'f')) deny(); if (r.date < x.today || r.date > addDay(x.today, 60)) bad('Geçersiz tarih'); r.plate = (r.plate || '').toLocaleUpperCase('tr');
        if (x.col('visitors').filter((v) => v.flat === me(x, 'f') && v.status === 'bekleniyor').length >= 30) bad('Çok fazla bekleyen bildiriminiz var');
      }),
      upd: U({ status: 'enum:iptal' }, (v, x) => v.flat === me(x, 'f') && v.status === 'bekleniyor'),
    },
    requests: {
      ins: I({ title: 'str:120', desc: 'str:1000?', cat: 'str:40', urgent: 'bool?' }, (r, x) => ({ flat: me(x, 'f'), status: 'acik', at: nowIso() }), (r, x) => {
        if (!me(x, 'f')) deny(); if (r.title.length < 4) bad('Kısa bir başlık yazın');
        if (x.col('requests').filter((q) => q.flat === me(x, 'f') && q.status === 'acik').length >= 20) bad('Çok fazla açık talebiniz var');
      }),
      upd: (r, set, x) => {
        if (r.flat !== me(x, 'f') || r.status !== 'cozuldu' || r.rating) deny();
        return set.rating === 'iyi' ? { rating: 'iyi', updated: nowIso() } : set.rating === 'kotu' ? { rating: 'kotu', status: 'acik', reply: '', updated: nowIso() } : deny();
      },
    },
    polls: {
      upd: (p, set, x) => {
        const fid = me(x, 'f'); if (!fid || !p.active || p.until < x.today || !set.votes || typeof set.votes !== 'object') deny();
        const v = Number(set.votes[fid]); if (!Number.isInteger(v) || v < 0 || v >= (p.options || []).length) bad('Geçersiz oy');
        return { votes: { ...(p.votes || {}), [fid]: v } };
      },
    },
  },
};

// ---------- Araç kiralama: online kiralama (kirala.html) ----------
// Fiyat tek kaynaktan: panel ve kirala.html ile aynı hesap (apps/kiralama/hesap.js)
const KH = require('../../apps/kiralama/hesap.js');
const rentSet = (x) => ({ ...KH.DEF, ...(x.doc._settings || {}) });
RULES.kiralama = {
  pub: {
    cars: { where: (c) => KH.rentable(c), fields: ['id', 'brand', 'model', 'cls', 'fuel', 'gear', 'daily', 'color', 'year', 'status', 'seats', 'img', 'photo'] },
    rents: { where: (r, x) => (r.to >= x.today || r.status === 'kirada') && r.status !== 'iptal', fields: ['id', 'car', 'from', 'to', 'status'] },
    seasons: { fields: ['id', 'from', 'to', 'pct', 'cls', 'active'] },
  },
  login: (x, q) => { const no = norm(q.no); const r = no && x.col('rents').find((r) => r.no === no); const c = r && x.get('customers', r.customer); return c && samePhone(c.phone, q.phone) ? { k: 'r', i: r.id } : null; },
  loginError: 'Eşleşen rezervasyon bulunamadı',
  view: (x) => {
    const r = x.get('rents', me(x, 'r')); if (!r) return {};
    const c = x.get('customers', r.customer);
    return { rents: [...x.col('rents').filter((o) => o.id !== r.id && (o.to >= x.today || o.status === 'kirada') && o.status !== 'iptal').map((o) => x.pick(o, ['id', 'car', 'from', 'to', 'status'])), strip(r, ['internal', 'damage', 'kabis', 'emniyet', 'outPhotos', 'inPhotos'])], customers: c ? [x.pick(c, ['id', 'name', 'phone'])] : [] };
  },
  write: {
    customers: { ins: I({ name: 'str:80', phone: 'phone', tc: 'str:20?', birth: 'date', licenseDate: 'date' }, { license: '' }) },
    rents: {
      ins: I({ car: 'id', customer: 'id', from: 'date', to: 'date', fromTime: 'time', toTime: 'time', extras: 'strs:5', flight: 'str:20?' }, () => ({ status: 'rezervasyon', source: 'online', prepaid: 0, payments: [] }), (r, x) => {
        const S = rentSet(x); const car = x.get('cars', r.car); const cu = x.get('customers', r.customer);
        if (!KH.rentable(car) || !cu) bad('Araç bulunamadı');
        const d = daysTo(r.from, r.to); if (r.from < x.today || d < 1 || d > 60) bad('Geçersiz tarih');
        if (r.extras.some((e) => !KH.EXTRAS.some((k) => k.id === e))) bad('Geçersiz ek hizmet');
        const yrs = (a, b) => (new Date(b) - new Date(a)) / (365.25 * 864e5);
        if (yrs(cu.birth, r.from) < S.minAge) bad(`Sürücü en az ${S.minAge} yaşında olmalı`);
        if (yrs(cu.licenseDate, r.from) < S.minLicense) bad(`Ehliyet en az ${S.minLicense} yıllık olmalı`);
        if (x.col('customers').some((c) => c.blacklist && (samePhone(c.phone, cu.phone) || (cu.tc && c.tc === cu.tc)))) bad('Rezervasyonunuz online alınamıyor, lütfen ofisi arayın');
        if (x.col('rents').some((o) => o !== r && o.car === r.car && KH.overlaps(o, r.from, r.to, x.today))) throw Object.assign(new Error('Bu araç az önce doldu, başka araç seçin'), { status: 409 });
        const q = KH.quote(car.daily, r.from, r.to, car.cls, { seasons: x.col('seasons'), longDays: S.longDays, longPct: S.longPct });
        r.daily = q.rate; r.disc = q.disc; r.deposit = Number(car.daily) * 3; r.no = x.seq('rents', 'K');
      }),
      upd: U({ status: 'enum:iptal', cancelNote: 'str:200?' }, (r, x) => r.id === me(x, 'r') && r.status === 'rezervasyon' && (new Date(`${r.from}T${r.fromTime || '10:00'}:00+03:00`) - Date.now()) / 3600e3 >= rentSet(x).freeCancelHours),
    },
  },
  after: (x, list) => mergeByPhone(x, list, 'customers', [['rents', 'customer']]),
  grant: (x, list) => { const r = list.find(([n, rec]) => n === 'rents' && !rec.updated); return r ? { k: 'r', i: r[1].id } : null; },
};

// ---------- Oto yıkama & otopark: aracım nerede (arac.html) — plaka ile ----------
const plateNorm = (p) => String(p || '').toLocaleUpperCase('tr-TR').replace(/\s+/g, '').replace(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,4})$/, '$1 $2 $3');
RULES.oto = {
  pub: { packages: true, jobs: { where: (j) => ['bekliyor', 'yikaniyor'].includes(j.status), fields: ['id', 'status', 'in', 'pkg', 'started'] } },
  login: (x, q) => {
    // Plaka + fişteki takip kodu (abonede abone kodu) birlikte eşleşmeli; yalnızca plakayla sorgu KVKK açığıydı (servis-arac Ç6)
    const pl = plateNorm(q.plate); const code = norm(q.code); if (pl.length < 5 || code.length < 4) return null; const m = (r) => plateNorm(r.plate) === pl;
    const ok = x.col('jobs').some((j) => m(j) && j.status !== 'teslim' && j.code && norm(j.code) === code) || x.col('parks').some((p) => m(p) && !p.out && p.code && norm(p.code) === code) || x.col('subs').some((s) => m(s) && s.end >= x.today && s.portalCode && norm(s.portalCode) === code);
    return ok ? { k: 'p', i: pl } : null;
  },
  loginError: 'Plaka veya takip kodu hatalı ya da araç şu an tesiste görünmüyor',
  view: (x) => {
    const pl = me(x, 'p'); if (!pl) return {}; const m = (r) => plateNorm(r.plate) === pl;
    const own = x.col('jobs').filter((j) => m(j) && j.status !== 'teslim').map((j) => x.pick(j, ['id', 'plate', 'status', 'in', 'pkg', 'started', 'price']));
    const ids = new Set(own.map((j) => j.id));
    return { jobs: [...x.col('jobs').filter((j) => ['bekliyor', 'yikaniyor'].includes(j.status) && !ids.has(j.id)).map((j) => x.pick(j, ['id', 'status', 'in', 'pkg', 'started'])), ...own], parks: x.col('parks').filter((p) => m(p) && !p.out).map((p) => x.pick(p, ['id', 'plate', 'in', 'out', 'paidAt', 'paidAmount'])), subs: x.col('subs').filter((s) => m(s) && s.end >= x.today).map((s) => x.pick(s, ['id', 'plate', 'plan', 'end', 'start', 'washesLeft'])) };
  },
  write: {},
};

// ---------- Eczane: reçete hazırlatma, takip ve stok sorgu (recete.html) ----------
// Reçete takibi sağlık verisi içerdiği için telefon + takip kodu ister; reçeteyi gönderen tarayıcı otomatik görür
const rxCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return [...require('crypto').randomBytes(6)].map((b) => A[b % A.length]).join(''); };
RULES.eczane = {
  pub: {
    drugs: { fields: ['id', 'name', 'active', 'form', 'rx', 'price'] },
    lots: { where: (l, x) => l.skt >= x.today, fields: ['id', 'drug', 'skt', 'qty'] },
    duty: { where: (d, x) => d.date >= x.today },
  },
  login: (x, q) => { const code = norm(q.code); const o = code && x.col('rxOrders').find((r) => r.code === code && samePhone(r.phone, q.phone)); return o ? { k: 'p', i: digits(o.phone) } : null; },
  loginError: 'Telefon ve takip kodu eşleşmedi',
  // k:'p' telefon + takip koduyla giriş; k:'r' yalnızca az önce gönderilen tek reçete
  view: (x) => { const ph = me(x, 'p'); const one = me(x, 'r'); return { rxOrders: ph ? x.col('rxOrders').filter((o) => digits(o.phone) === ph) : one ? x.col('rxOrders').filter((o) => o.id === one) : [] }; },
  write: {
    rxOrders: {
      ins: I({ rxNo: 'str:12', name: 'str:80', phone: 'phone', pickup: 'str:40', note: 'str:400?' }, () => ({ code: 'R' + rxCode(), status: 'yeni', at: nowIso() }), (r, x) => {
        r.rxNo = r.rxNo.replace(/\s/g, '').toUpperCase(); if (!/^[A-Z0-9]{6,10}$/.test(r.rxNo)) bad('E-reçete numarası 6-10 harf/rakam olmalı');
        if (x.col('rxOrders').filter((o) => samePhone(o.phone, r.phone) && o.status === 'yeni').length >= 5) bad('Bu numarayla bekleyen çok fazla reçete var');
      }),
    },
  },
  // Reçete gönderen tarayıcı yalnızca kendi gönderdiği kaydı görür: telefona kimlik verilirse başkasının numarasıyla kayıt açıp o kişinin tüm reçetelerini okumak mümkün olur
  grant: (x, list) => { const o = list.find(([n]) => n === 'rxOrders'); return o ? { k: 'r', i: o[1].id } : null; },
};

// ---------- İK: çalışan portalı (calisan.html) — telefon + giriş kodu ----------
// Çalışan yalnızca kendi izin bakiyesini, izinlerini, vardiyasını ve kapatılmış aylardaki kendi bordrosunu görür; TC, IBAN, başkasının verisi çıkmaz
const ikCalc = () => { try { return require('../../apps/ik/bordro.js'); } catch (e) { return null; } };
const ikLeave = (x, e) => {
  const B = ikCalc(); if (!B) return null; const ts = x.doc.ts || {}; const p = e.id + '|'; let used = 0, first = null;
  Object.keys(ts).forEach((k) => { const d = k.slice(k.indexOf('|') + 1); if (!first || d < first) first = d; if (k.startsWith(p) && ts[k].s === 'I') used++; });
  return B.leaveBalance(e, { asOf: x.today, used, trackFrom: first || x.today });
};
RULES.ik = {
  settings: ['bizName', 'bizPhone'],
  login: (x, q) => { const d = digits(q.phone); const code = norm(q.code); const e = code && d.length === 10 && x.col('employees').find((r) => r.active !== false && digits(r.phone) === d && r.portalCode && norm(r.portalCode) === code); return e ? { k: 'e', i: e.id } : null; },
  loginError: 'Telefon veya giriş kodu hatalı',
  view: (x) => {
    const id = me(x, 'e'); const e = id && x.get('employees', id); if (!e || e.active === false) return {};
    const roster = x.doc.roster || {}; const p = id + '|'; const from = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    return {
      employees: [{ ...x.pick(e, ['id', 'name', 'dept', 'title', 'start', 'phone']), leave: ikLeave(x, e) }],
      leaves: x.col('leaves').filter((l) => l.emp === id).map((l) => x.pick(l, ['id', 'emp', 'type', 'from', 'to', 'note', 'status', 'source'])),
      shifts: x.col('shifts').map((s) => x.pick(s, ['id', 'name', 'start', 'end', 'color'])),
      myRoster: Object.keys(roster).filter((k) => k.startsWith(p) && k.slice(p.length) >= from).map((k) => ({ id: k, date: k.slice(p.length), shift: roster[k] })),
      payClosed: x.col('payClosed').map((c) => { const r = (c.rows || []).find((y) => y.emp === id); return r ? { id: c.id, ym: c.ym, paidAt: c.paidAt, rows: [x.pick(r, ['emp', 'days', 'gross', 'sgk', 'unemp', 'incomeTax', 'stamp', 'adv', 'netSalary', 'net'])] } : null; }).filter(Boolean),
    };
  },
  write: {
    leaves: {
      ins: I({ emp: 'id', type: 'enum:I|U', from: 'date', to: 'date', note: 'str:300?' }, () => ({ status: 'bekliyor', source: 'portal' }), (r, x) => {
        if (r.emp !== me(x, 'e')) deny(); if (r.to < r.from) bad('Bitiş tarihi başlangıçtan önce olamaz'); if (r.from < x.today) bad('Geçmiş tarihe izin istenemez');
        if (x.col('leaves').filter((l) => l.emp === r.emp && l.status === 'bekliyor').length >= 5) bad('Onay bekleyen çok fazla talebiniz var');
      }),
    },
  },
};

// ---------- Fabrika: bayi sipariş portalı (bayi.html) — vergi no/e-posta + telefonun son 4 hanesi ----------
const dealerLogin = (col) => (x, q) => {
  const v = String(q.vkn || '').trim().toLocaleLowerCase('tr'); const p = String(q.pin || '').replace(/\D/g, '');
  const c = v && x.col(col).find((c) => (c.taxNo && String(c.taxNo) === v) || (c.email && String(c.email).toLocaleLowerCase('tr') === v));
  return c && p.length === 4 && digits(c.phone).endsWith(p) ? { k: 'c', i: c.id } : null;
};
const workdaysAhead = (n) => { let d = new Date(Date.now() + 3 * 3600e3); let k = 0; while (k < n) { d = new Date(d.getTime() + 864e5); if (![0, 6].includes(d.getUTCDay())) k++; } return d.toISOString().slice(0, 10); };
RULES.fabrika = {
  pub: {},
  login: dealerLogin('customers'), loginError: 'Bilgiler eşleşmedi',
  view: (x) => {
    const c = x.get('customers', me(x, 'c')); if (!c) return {};
    const mats = x.col('materials').filter((m) => m.type === 'mamul' && m.price > 0);
    // Stok: diğer bayilerin siparişlerini göstermeden "boşta" miktar (eldeki − başkalarının açık siparişleri)
    const others = x.col('so').filter((s) => s.cust !== c.id && ['acik', 'kismi'].includes(s.status)).flatMap((s) => s.lines || []);
    const moves = mats.map((m) => ({ id: 'mv-' + m.id, mat: m.id, wh: 'w4', qty: x.col('moves').filter((v) => v.mat === m.id && v.wh === 'w4').reduce((t, v) => t + Number(v.qty || 0), 0) - others.filter((l) => l.mat === m.id).reduce((t, l) => t + l.qty - (l.shipped || 0), 0) }));
    const so = x.col('so').filter((s) => s.cust === c.id); const ids = new Set(so.map((s) => s.id));
    const sh = x.col('shipments').filter((s) => ids.has(s.so)); const lots = new Set(sh.flatMap((s) => (s.lines || []).map((l) => l.lot)));
    return { customers: [strip(c, ['note', 'risk', 'internal'])], materials: mats.map((m) => x.pick(m, ['id', 'name', 'code', 'unit', 'barcode', 'price', 'type'])), moves, so, shipments: sh, lots: x.col('lots').filter((l) => lots.has(l.id)).map((l) => x.pick(l, ['id', 'no'])) };
  },
  write: {
    so: {
      ins: I({ lines: 'json:20000', note: 'str:400?' }, (r, x) => ({ cust: me(x, 'c'), date: x.today, due: workdaysAhead(5), currency: 'TRY', status: 'bekliyor', portal: true }), (r, x) => {
        const c = x.get('customers', me(x, 'c')); if (!c) deny();
        if (!Array.isArray(r.lines) || !r.lines.length || r.lines.length > 100) bad('Sipariş boş');
        r.lines = r.lines.map((l) => { const m = x.get('materials', l && l.mat); const q = Number(l && l.qty); if (!m || m.type !== 'mamul' || !(m.price > 0) || !Number.isInteger(q) || q < 1 || q > 1e6) bad('Geçersiz ürün'); return { mat: m.id, qty: q, price: Math.round(m.price * (1 - (Number(c.discount) || 0) / 100) * 100) / 100, shipped: 0 }; });
        r.note = r.note && r.note.startsWith('Bayi portalı') ? r.note : 'Bayi portalı' + (r.note ? ' · ' + r.note : '');
        r.no = x.seq('so', 'SP');
      }),
    },
  },
};

// ---------- Toptan: bayi B2B sipariş (bayi.html) — telefon + bayi kodu ----------
const TPT_LIST = { A: 0, B: 4, C: 8 };
const tptPrice = (p, c) => Math.round(p.price * (1 + (TPT_LIST[c.list] ?? TPT_LIST.C) / 100) * 100) / 100; // bayiye yalnızca kendi liste fiyatı gider, taban fiyat gitmez
const tptCode = (c) => (c.portalCode ? norm(c.portalCode) : null); // formülle türetilen yedek kod kaldırıldı (tahmin edilebilirdi)
// Risk sunucuda da panelle aynı: bakiye + açık sipariş + tahsil olmamış çek; vadesi geçen borç varsa sipariş onaya düşer
const tptOrderTotal = (o) => (o.lines || []).reduce((t, l) => t + l.qty * l.price * (1 - (l.disc || 0) / 100) * (1 + (l.vat ?? 10) / 100), 0);
const tptLedger = (x, c) => {
  const ords = x.col('orders').filter((o) => o.customer === c.id); const pays = x.col('payments').filter((p) => p.customer === c.id && p.cheque !== 'karsiliksiz'); const rets = x.col('returns').filter((r) => r.customer === c.id);
  const open = ords.filter((o) => ['yeni', 'hazir', 'onay'].includes(o.status)).reduce((t, o) => t + tptOrderTotal(o), 0);
  const chq = pays.filter((p) => p.cheque === 'portfoy' || (p.cheque === 'bankada' && p.due >= x.today)).reduce((t, p) => t + p.amount, 0);
  let paid = Math.max(0, pays.reduce((t, p) => t + p.amount, 0) + rets.reduce((t, r) => t + r.total, 0) - Math.max(0, Number(c.opening) || 0)); let od = 0;
  ords.filter((o) => ['sevk', 'teslim'].includes(o.status)).sort((a, b) => String(a.at).localeCompare(String(b.at))).forEach((o) => { const v = tptOrderTotal(o); const use = Math.min(paid, v); paid -= use; if (v - use > 0.01 && Date.parse(o.at) + (Number(c.term) || 30) * 864e5 < Date.now()) od += v - use; });
  return { open, chq, overdue: od };
};
const tptPromo = (x, pid) => x.col('promos').find((k) => k.active !== false && k.pid === pid && (!k.start || k.start <= x.today) && (!k.end || k.end >= x.today));
const tptReserved = (x, pid) => x.col('orders').filter((o) => ['yeni', 'hazir', 'onay'].includes(o.status)).reduce((t, o) => t + (o.lines || []).filter((l) => l.pid === pid).reduce((a, l) => a + l.qty, 0), 0);
RULES.toptan = {
  pub: {},
  login: (x, q) => { const code = norm(q.code); const c = code && x.col('customers').find((c) => samePhone(c.phone, q.phone) && tptCode(c) === code); return c ? { k: 'c', i: c.id } : null; },
  loginError: 'Telefon veya kod hatalı',
  view: (x) => {
    const c = x.get('customers', me(x, 'c')); if (!c) return {};
    const rep = x.get('reps', c.rep);
    return { customers: [strip(c, ['note', 'risk', 'internal'])], products: x.col('products').filter((p) => p.active !== false).map((p) => ({ ...strip(p, ['cost', 'supplier', 'buyPrice', 'price']), listPrice: tptPrice(p, c) })), reps: rep ? [x.pick(rep, ['id', 'name', 'phone'])] : [], promos: x.col('promos').filter((k) => tptPromo(x, k.pid) === k), orders: x.col('orders').filter((o) => o.customer === c.id), payments: x.col('payments').filter((p) => p.customer === c.id), returns: x.col('returns').filter((r) => r.customer === c.id) };
  },
  write: {
    orders: {
      ins: I({ lines: 'json:30000' }, (r, x) => { const c = x.get('customers', me(x, 'c')) || {}; return { customer: c.id, rep: c.rep, src: 'b2b', at: nowIso(), note: 'Bayi portalından' }; }, (r, x) => {
        const c = x.get('customers', me(x, 'c')); if (!c) deny();
        if (!Array.isArray(r.lines) || !r.lines.length || r.lines.length > 200) bad('Sipariş boş');
        r.lines = r.lines.map((l) => { const p = x.get('products', l && l.pid); const q = Number(l && l.qty); if (!p || !Number.isInteger(q) || q < 1 || q > 1e6) bad('Geçersiz ürün'); return { pid: p.id, name: p.name, qty: q, price: tptPrice(p, c), vat: p.vat, disc: 0 }; });
        // Mal fazlası sunucuda hesaplanır: bayi bedelsiz satır gönderemez
        r.lines = [...r.lines, ...r.lines.flatMap((l) => { const k = tptPromo(x, l.pid); const n = k ? Math.floor(l.qty / k.buy) * k.free : 0; return n > 0 ? [{ pid: l.pid, name: `${l.name} (mal fazlası)`, qty: n, price: l.price, vat: l.vat, disc: 100, free: true }] : []; })];
        r.lines.forEach((l) => { const p = x.get('products', l.pid); const q = r.lines.filter((y) => y.pid === l.pid).reduce((t, y) => t + y.qty, 0); if (Number.isFinite(p.stock) && q > p.stock - tptReserved(x, p.id)) bad(`${p.name} için yeterli stok yok`); });
        const total = tptOrderTotal(r); const min = Number((x.doc._settings || {}).minOrder) || 0; if (total < min) bad(`En az sipariş tutarı ${min} TL`);
        const L = tptLedger(x, c); r.status = (Number(c.balance) || 0) + L.open + L.chq + total > (Number(c.limit) || 0) || L.overdue > 0 ? 'onay' : 'yeni';
        r.no = 'S' + (x.col('orders').reduce((m, o) => Math.max(m, Number(String(o.no).slice(1)) || 0), 6999) + 1);
      }),
    },
  },
};

// ---------- Mali müşavir: mükellef portalı (portal.html) — VKN + giriş kodu ----------
const msvCode = (c) => (c.portalCode ? norm(c.portalCode) : null);
const prevMonth = () => { const d = new Date(Date.now() + 3 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
RULES.musavir = {
  pub: {},
  login: (x, q) => { const code = norm(q.code); const c = code && x.col('clients').find((c) => String(c.vkn) === String(q.vkn || '').trim() && msvCode(c) === code); return c ? { k: 'c', i: c.id } : null; },
  loginError: 'VKN veya giriş kodu hatalı',
  view: (x) => {
    const c = x.get('clients', me(x, 'c')); if (!c) return { docs: {} };
    const own = (r) => r.client === c.id; const docs = {};
    Object.entries(x.doc.docs || {}).forEach(([k, v]) => { if (k.startsWith(c.id + '|')) docs[k] = v; });
    return { clients: [strip(c, ['note', 'notes', 'internal', 'portalCode'])], filings: x.col('filings').filter(own), fees: x.col('fees').filter(own), payments: x.col('payments').filter(own), messages: x.col('messages').filter(own), docs };
  },
  write: {
    messages: { ins: I({ text: 'str:2000', file: 'str:400?' }, (r, x) => ({ client: me(x, 'c'), from: 'mukellef', at: nowIso() }), (r, x) => { if (!me(x, 'c') || !r.text) deny(); }) },
    // Evrak durumu: yalnızca kendi, geçen ayın kaydında belge türlerini "geldi" olarak işaretleyebilir
    docs: {
      key: (key, val, cur, x) => {
        if (key !== `${me(x, 'c')}|${prevMonth()}` || !val || typeof val !== 'object') deny();
        const out = { ...(cur || {}) };
        Object.entries(val).forEach(([k, v]) => { if (out[k] !== v) { if (v !== 'geldi' || k.length > 60) deny(); out[k] = 'geldi'; } });
        return out;
      },
    },
  },
};

// ---------- Ön muhasebe: cari hesap portalı (cari.html) — VKN / TCKN + giriş kodu ----------
// Kod yalnızca işletmenin ürettiği rastgele portalCode'dur (VKN'den türetilmez). Cari yalnızca kendi faturalarını, tahsilat / ödemelerini
// ve mutabakat isteklerini görür; tek yazma izni bekleyen mutabakata onay / itiraz vermektir.
RULES.muhasebe = {
  settings: ['bizName', 'bizPhone', 'bizAddress', 'bizDistrict', 'bizCity', 'taxNo', 'taxOffice', 'iban', 'invoiceNote', 'logo'],
  pub: {},
  login: (x, q) => { const code = norm(q.code); const t = String(q.vkn || '').replace(/\D/g, ''); const c = code && t.length >= 10 && x.col('caris').find((c) => c.portalCode && String(c.taxNo || '') === t && norm(c.portalCode) === code); return c ? { k: 'c', i: c.id } : null; },
  loginError: 'VKN / TCKN veya giriş kodu hatalı',
  view: (x) => {
    const c = x.get('caris', me(x, 'c')); if (!c) return {};
    const own = (r) => r.cari === c.id;
    return {
      caris: [strip(c, ['note', 'notes', 'internal', 'portalCode', 'riskLimit', 'priceList', 'tags'])],
      invoices: x.col('invoices').filter(own).map((i) => strip(i, ['createdBy', 'internal', 'project', 'branch'])),
      txns: x.col('txns').filter((t) => own(t) && (t.type === 'tahsilat' || t.type === 'odeme')).map((t) => ({ id: t.id, cari: t.cari, date: t.date, type: t.type, amount: t.amount, invoice: t.invoice, alloc: t.alloc, desc: t.desc })),
      recons: x.col('recons').filter(own),
    };
  },
  write: {
    recons: { upd: U({ status: 'enum:onay|itiraz', note: 'str:1000?', name: 'str:80?' }, (cur, x) => cur.cari === me(x, 'c') && cur.status === 'bekliyor', () => ({ answered: nowIso() })) },
  },
};

// ---------- Hukuk: müvekkil portalı (muvekkil.html) — TCKN/VKN + giriş kodu ----------
const hkkCode = (c) => (c.portalCode ? norm(c.portalCode) : null);
RULES.hukuk = {
  pub: {},
  login: (x, q) => { const code = norm(q.code); const c = code && x.col('clients').find((c) => c.idNo && String(c.idNo) === String(q.idNo || '').trim() && hkkCode(c) === code); return c ? { k: 'c', i: c.id } : null; },
  loginError: 'Bilgiler hatalı',
  view: (x) => {
    const c = x.get('clients', me(x, 'c')); if (!c) return {};
    const files = x.col('files').filter((f) => f.client === c.id); const ids = new Set(files.map((f) => f.id)); const own = (r) => r.client === c.id;
    return { clients: [strip(c, ['note', 'notes', 'internal', 'portalCode'])], files: files.map((f) => strip(f, ['notes', 'strategy', 'internal'])), hearings: x.col('hearings').filter((h) => ids.has(h.file)), advances: x.col('advances').filter(own), expenses: x.col('expenses').filter(own), messages: x.col('messages').filter(own) };
  },
  write: { messages: { ins: I({ text: 'str:2000' }, (r, x) => ({ client: me(x, 'c'), from: 'muvekkil', at: nowIso() }), (r, x) => { if (!me(x, 'c') || !r.text) deny(); }) } },
};

// ---------- Anaokulu: veli portalı (veli.html) — veli telefonu + kod ----------
const ankCode = (s) => (s.portalCode ? norm(s.portalCode) : null);
const keysOf = (obj, ids) => { const o = {}; Object.entries(obj || {}).forEach(([k, v]) => { if (ids.has(k.split('|')[0])) o[k] = v; }); return o; };
RULES.anaokulu = {
  pub: { menu: true, classes: { fields: ['id', 'name', 'age', 'teacher', 'color'] } },
  login: (x, q) => { const code = norm(q.code); const d = digits(q.phone); return code && d.length === 10 && x.col('students').some((s) => (s.parents || []).some((p) => digits(p.phone) === d) && ankCode(s) === code) ? { k: 'p', i: d } : null; },
  loginError: 'Telefon veya kod hatalı',
  view: (x) => {
    const ph = me(x, 'p'); if (!ph) return { att: {}, reports: {} };
    const kids = x.col('students').filter((s) => (s.parents || []).some((p) => digits(p.phone) === ph)); const ids = new Set(kids.map((s) => s.id)); const cls = new Set(kids.map((s) => s.cls)); const own = (r) => ids.has(r.student);
    return { students: kids.map((s) => strip(s, ['portalCode', 'internal'])), att: keysOf(x.doc.att, ids), reports: keysOf(x.doc.reports, ids), posts: x.col('posts').filter((p) => !p.cls || cls.has(p.cls)), fees: x.col('fees').filter(own), payments: x.col('payments').filter(own), messages: x.col('messages').filter(own) };
  },
  write: {
    messages: { ins: I({ student: 'id', text: 'str:2000', type: 'enum:izin|alma|mesaj|onay', post: 'str:40?' }, () => ({ from: 'veli', at: nowIso() }), (r, x) => {
      const s = x.get('students', r.student); if (!s || !(s.parents || []).some((p) => digits(p.phone) === me(x, 'p')) || !r.text) deny();
      if (r.type === 'onay') { const p = x.get('posts', r.post); if (!p || !p.consent || (p.cls && p.cls !== s.cls)) bad('Bu duyuru için izin istenmiyor'); if (x.col('messages').some((m) => m.type === 'onay' && m.post === r.post && m.student === s.id)) bad('İzin zaten verildi'); } else delete r.post;
    }) },
  },
};

// ---------- Kuyumcu: vitrin kur ekranı (ekran.html) — yalnızca ayarlardaki kurlar ----------
// Beyaz liste: kur servisi adresi, kimlik sınırı, belge şablonu ve iç notlar vitrine gitmez
RULES.kuyumcu = { settings: ['bizName', 'bizPhone', 'hasBuy', 'hasSell', 'usd', 'eur', 'rateAt', 'rateSource', 'fxSource', 'rateMaxAge', 'coinBuyCut', 'coinSellAdd', 'scrapCut'], pub: {}, write: {} };

// ---------- Oto galeri: araç vitrini ve bilgi talebi (vitrin.html) ----------
const leadLimit = (col, phoneField = 'phone') => (r, x) => { if (x.col(col).filter((l) => samePhone(l[phoneField], r[phoneField]) && String(l.at || l.created || '').slice(0, 10) === x.today).length >= 5) bad('Bugün için çok fazla talep gönderdiniz'); };
RULES.galeri = {
  pub: { vehicles: { where: (v) => ['satista', 'opsiyon'].includes(v.status), fields: ['id', 'stockNo', 'brand', 'model', 'pkg', 'body', 'fuel', 'gear', 'year', 'km', 'color', 'listPrice', 'tramer', 'parts', 'expertise', 'status', 'desc', 'photos', 'photo'] } },
  write: { leads: { ins: I({ name: 'str:80', phone: 'phone', note: 'str:600?', body: 'str:30?', budget: 'num:0:1e9?' }, () => ({ status: 'yeni', source: 'Vitrin sayfası', at: nowIso() }), leadLimit('leads')) } },
};

// ---------- Emlak: ilan sitesi (ilan.html) — ilanlar, talep, yer gösterme, değerleme ----------
RULES.emlak = {
  settings: ['bizName', 'bizPhone', 'bizAddress', 'city', 'whatsapp', 'commission', 'rentCommission', 'vatPct', 'yetkiNo', 'sorumlu', 'logo', 'email'],
  pub: {
    props: { where: (p) => ['aktif', 'opsiyon'].includes(p.status), omit: ['owner', 'ownerPhone', 'ownerTc', 'authNo', 'authEnd', 'eidsEnd', 'offers', 'priceHist', 'portals', 'closedAt', 'commission', 'keyInfo', 'internal', 'notes', 'minPrice'] },
    agents: { fields: ['id', 'name', 'phone', 'color', 'photo', 'title'] },
    deals: { where: (d) => !d.cancelled, fields: ['id'] }, // yalnızca "satılan ilan" sayacı için
  },
  write: {
    requests: { ins: I({ name: 'str:80', phone: 'phone', type: 'enum:satilik|kiralik', cat: 'str:30', district: 'str:60?', rooms: 'str:20?', budgetMax: 'num:0:1e10?', m2Min: 'num:0:1e6?', note: 'str:600?', agent: 'str:40?' }, { status: 'aktif', source: 'web' }, leadLimit('requests')) },
    showings: {
      ins: I({ prop: 'id', request: 'id', date: 'date', time: 'str:20', agent: 'str:40?', note: 'str:400?' }, { result: '', source: 'web' }, (r, x) => {
        if (!x.get('props', r.prop) || !x.get('requests', r.request)) bad('İlan bulunamadı'); if (r.date < x.today || r.date > addDay(x.today, 60)) bad('Geçersiz tarih');
      }),
    },
    leads: { ins: I({ kind: 'enum:alarm|bilgi|gosterim|degerleme|portfoy|iletisim', name: 'str:80', phone: 'phone', email: 'email?', msg: 'str:1500?', prop: 'str:40?', agent: 'str:40?', request: 'str:40?', type: 'str:20?' }, () => ({ status: 'yeni', at: nowIso() }), leadLimit('leads')) },
    // Görüntülenme / iletişim sayaçları: istemcinin değeri yok sayılır, sunucu 1 artırır
    props: { upd: (p, set) => { const k = Object.keys(set).filter((f) => f !== 'updated'); if (!k.length || k.some((f) => !['views', 'contacts'].includes(f)) || !['aktif', 'opsiyon'].includes(p.status)) deny(); const o = {}; k.forEach((f) => { o[f] = (Number(p[f]) || 0) + 1; }); return o; } },
  },
};

// ---------- E-ticaret: mağaza vitrini (magaza.html) ----------
// Fiyat, indirim, kargo ve stok sunucuda hesaplanır; kartla ödeme bulutta kapalıdır (kapıda ödeme / havale)
const shopSet = (x) => ({ freeShip: 750, shipFee: 79, codFee: 30, ...(x.doc._settings || {}) });
// Kupon: etkin, tarih aralığında ve kullanım sınırı dolmamış olmalı (apps/eticaret/data.js couponCheck ile aynı)
const shopCoupon = (x, code) => { const k = code && x.col('coupons').find((c) => c.code === String(code).toUpperCase() && c.active); if (!k || (k.start && x.today < k.start) || (k.end && x.today > k.end) || (Number(k.maxUses) && (k.uses || 0) >= Number(k.maxUses))) return null; return k; };
RULES.eticaret = {
  pub: {
    cats: true,
    products: { where: (p) => p.active !== false, omit: ['cost', 'supplier', 'buyPrice'] },
    reviews: { where: (r) => !r.pending },
  },
  query: (x, q) => { const k = shopCoupon(x, q.coupon); return k ? { coupons: [x.pick(k, ['id', 'code', 'type', 'value', 'min', 'active', 'start', 'end', 'maxUses', 'uses'])] } : null; },
  login: (x, q) => { const no = norm(q.no); const o = no && x.col('orders').find((o) => o.no === no); const l4 = String(q.last4 || '').replace(/\D/g, ''); return o && l4.length === 4 && digits((o.ship || {}).phone).endsWith(l4) ? { k: 'o', i: o.id } : null; },
  loginError: 'Sipariş numarası ve telefon eşleşmedi',
  view: (x) => {
    const o = x.get('orders', me(x, 'o')); if (!o) return {};
    // İç not, etiket, işlem geçmişi ve kanal kesintileri müşteriye gitmez
    return { orders: [strip(o, ['memo', 'tags', 'history', 'payout', 'channelShip', 'packCheck', 'source'])], returns: x.col('returns').filter((r) => r.order === o.id).map((r) => strip(r, ['by', 'restocked', 'lines'])) };
  },
  write: {
    customers: { ins: I({ name: 'str:80', phone: 'phone', email: 'email?', city: 'str:40?', address: 'str:300?' }, {}) },
    orders: {
      ins: I({ customer: 'id', ship: 'json:1200', items: 'json:30000', pay: 'enum:kapida|havale', note: 'str:400?', invoice: 'json:600?', installment: 'int:1:12?' }, () => ({ at: nowIso(), status: 'yeni', channel: 'Web sitesi', installment: 1 }), (r, x) => {
        if (!x.get('customers', r.customer)) bad('Müşteri bilgisi eksik');
        const sh = clean({ name: 'str:80', phone: 'phone', city: 'str:40', address: 'str:400' }, r.ship || {}); r.ship = sh;
        if (r.invoice) r.invoice = clean({ title: 'str:160?', taxNo: 'str:11?', taxOffice: 'str:60?' }, r.invoice);
        if (!Array.isArray(r.items) || !r.items.length || r.items.length > 50) bad('Sepet boş');
        r.items = r.items.map((i) => {
          const p = x.get('products', i && i.pid); const v = p && (p.variants || []).find((z) => z.id === i.vid); const q = Number(i && i.qty);
          if (!p || p.active === false || !v || !Number.isInteger(q) || q < 1 || q > 50) bad('Ürün bulunamadı');
          if (Number(v.stock) < q) throw Object.assign(new Error(`${p.name} (${v.color} / ${v.size}) için stok yetersiz`), { status: 409 });
          return { pid: p.id, vid: v.id, name: p.name, variant: `${v.color} / ${v.size}`, qty: q, price: Number(p.sale || p.price) };
        });
        r.items.forEach((i) => { const v = x.get('products', i.pid).variants.find((z) => z.id === i.vid); v.stock -= i.qty; });
        const S = shopSet(x); const sub = r.items.reduce((t, i) => t + i.price * i.qty, 0);
        const k = shopCoupon(x, x.q.coupon); let discount = 0, freeBy = false;
        if (k && sub >= (k.min || 0)) { if (k.type === 'pct') discount = Math.round(sub * k.value) / 100; else if (k.type === 'tl') discount = Math.min(sub, Number(k.value)); else if (k.type === 'ship') freeBy = true; k.uses = (k.uses || 0) + 1; r.coupon = k.code; } else r.coupon = null;
        const shipping = sub - discount >= S.freeShip || freeBy ? 0 : Number(S.shipFee); const cod = r.pay === 'kapida' ? Number(S.codFee) : 0;
        Object.assign(r, { subtotal: sub, discount, shipping, cod, total: Math.max(0, sub - discount + shipping + cod), no: x.seq('orders', 'LB') });
      }),
    },
    returns: {
      ins: I({ order: 'id', reason: 'str:600' }, () => ({ at: nowIso(), status: 'bekliyor' }), (r, x) => {
        const o = x.get('orders', r.order); if (!o || o.id !== me(x, 'o') || o.status !== 'teslim' || x.col('returns').some((z) => z.order === o.id)) deny();
      }),
    },
    reviews: { ins: I({ pid: 'id', name: 'str:60', rating: 'int:1:5', size: 'str:10?', text: 'str:1000' }, () => ({ at: nowIso(), verified: false, pending: true }), (r, x) => { if (!x.get('products', r.pid)) bad('Ürün bulunamadı'); }) },
    subscribers: { ins: I({ email: 'email' }, () => ({ at: nowIso(), source: 'vitrin' }), (r, x) => { if (!r.email || x.col('subscribers').some((s) => s.email === r.email)) bad('Bu e-posta zaten kayıtlı'); }) },
    stockAlerts: { ins: I({ pid: 'id', color: 'str:40?', email: 'email' }, () => ({ at: nowIso() }), (r, x) => { if (!r.email || !x.get('products', r.pid)) bad('Geçersiz'); }) },
    // Stok ve kupon kullanımı sunucuda düşülür; ürünlerde yalnızca görüntülenme sayacı artar
    products: { upd: (p, set) => (set.views !== undefined ? { views: (Number(p.views) || 0) + 1 } : {}) },
    coupons: 'ignore',
  },
  after: (x, list) => mergeByPhone(x, list, 'customers', [['orders', 'customer']]),
  grant: (x, list) => { const o = list.find(([n, rec]) => n === 'orders' && !rec.updated); return o ? { k: 'o', i: o[1].id } : null; },
};

// ---------- Bilet: etkinlik satış sayfası (bilet.html) ----------
// Bulutta online alınan bilet "ödeme bekliyor" rezervasyonudur; işletme ödemeyi alınca panelden "Ödendi" der
const crypto = require('crypto');
const tixCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return [...crypto.randomBytes(8)].map((b) => A[b % A.length]).join(''); };
const evCode = (x, code) => code && x.col('codes').find((c) => c.code === String(code).toUpperCase() && c.active);
// Bilet saatleri Türkiye saatidir (UTC+3, yaz saati yok): sunucunun saat diliminden bağımsız hesaplanır
const trTime = (s) => (s ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : (s.length <= 16 ? s + ':00' : s) + '+03:00').getTime() : NaN);
const evStart = (e) => trTime(`${e.date}T${e.time || '20:00'}`);
// Program tarafıyla (apps/bilet/data.js codeCheck) aynı kurallar: aktif, tarih aralığı, etkinlik, kullanım sınırı; %100 ve gişe kodları online'da geçmez
function evCodeCheck(x, code, e) {
  if (!code) return null; const k = evCode(x, code); if (!k) bad('Geçersiz indirim kodu');
  if (k.from && x.today < k.from) bad('Bu kod henüz geçerli değil'); if (k.to && x.today > k.to) bad('Bu kodun süresi doldu');
  if (k.events && !String(k.events).split(',').map((v) => v.trim()).filter(Boolean).includes(e.id)) bad('Bu kod bu etkinlikte geçerli değil');
  if (Number(k.pct) >= 100 || k.online === false) bad('Bu kod online satışta kullanılamaz');
  if (Number(k.maxUses) && (k.uses || 0) + 1 > Number(k.maxUses)) bad('Bu kodun kullanım hakkı doldu');
  return k;
}
// Fiyat, program tarafıyla (apps/bilet/data.js unitPrice) aynı: erken kuş basamağı, sonra bilet türü
const evTypes = (e) => [{ id: 'Tam', pct: 0 }, ...String(e.ttypes || '').split(',').map((v) => v.trim()).filter(Boolean).map((v) => { const [id, p] = v.split(':'); return { id: id.trim(), pct: Math.min(100, Math.max(0, Number(p) || 0)) }; })];
const evTier = (e, day) => { const t = [[e.tier1Until, e.tier1Pct], [e.tier2Until, e.tier2Pct]].filter(([u, p]) => u && Number(p) > 0 && day <= u).sort((a, b) => a[0].localeCompare(b[0]))[0]; return t ? Math.min(100, Number(t[1])) : 0; };
const evUnit = (e, cat, ttype, day) => { const ty = evTypes(e).find((t) => t.id === ttype); if (ttype && !ty) bad('Geçersiz bilet türü'); return Math.round(Number(e.prices[cat]) * (1 - evTier(e, day) / 100) * (1 - ((ty || {}).pct || 0) / 100)); };
// Koltuğun kategorisi salondan gelir: istemcinin söylediği kategoriye güvenilmez (VIP koltuk ucuz kategoriden alınamaz); kapalı ve kontenjanlı koltuk satılmaz
const evSeatCat = (v, e, seat) => { const m = /^([A-Za-z]+)(\d+)$/.exec(String(seat || '')); const row = m && (v.rows || []).find((r) => r.r === m[1]); const n = m ? Number(m[2]) : 0; if (!row || n < 1 || n > Number(v.seatsPerRow) || (v.closed || []).includes(seat) || (e.blocks || {})[seat]) bad('Bu koltuk satışta değil'); return row.cat; };
const holdOwner = (q) => (q && typeof q.sahip === 'string' && q.sahip.length >= 8 && q.sahip.length <= 40 ? q.sahip : null);
RULES.bilet = {
  pub: {
    events: { where: (e) => e.status !== 'taslak', omit: ['cost', 'internal', 'share', 'orgName'] },
    venues: true,
    tickets: { where: (t) => t.status !== 'refunded', fields: ['id', 'event', 'seat', 'cat', 'status'] }, // doluluk (alıcı bilgisi olmadan)
    // Kilidin sahibi herkese açık değildir: sahip kimliği, kilidi kaldırma yetkisidir. Ziyaretçi yalnızca kendi kilidini sahip alanıyla görür (query).
    holds: { where: (h) => h.until > Date.now(), fields: ['id', 'event', 'seat', 'until'] },
  },
  query: (x, q) => { const k = evCode(x, q.code); const sahip = holdOwner(q); return { ...(k ? { codes: [x.pick(k, ['id', 'code', 'pct', 'note', 'active'])] } : {}), ...(sahip ? { holds: x.col('holds').filter((h) => h.until > Date.now()).map((h) => ({ ...x.pick(h, ['id', 'event', 'seat', 'until']), ...(h.owner === sahip ? { owner: h.owner } : {}) })) } : {}) }; },
  login: (x, q) => { const no = norm(q.order); const l4 = String(q.last4 || '').replace(/\D/g, ''); const t = no && l4.length === 4 && x.col('tickets').find((t) => t.order === no && digits((t.buyer || {}).phone).endsWith(l4)); return t ? { k: 'o', i: no } : null; },
  loginError: 'Sipariş numarası ve telefon eşleşmedi',
  view: (x) => {
    const no = me(x, 'o'); if (!no) return {};
    const mine = x.col('tickets').filter((t) => t.order === no); const ids = new Set(mine.map((t) => t.id));
    return { tickets: [...x.col('tickets').filter((t) => t.status !== 'refunded' && !ids.has(t.id)).map((t) => x.pick(t, ['id', 'event', 'seat', 'cat', 'status'])), ...mine] };
  },
  write: {
    holds: {
      ins: I({ event: 'id', seat: 'str:12', owner: 'str:40', until: 'num:0:1e14' }, {}, (r, x) => {
        const e = x.get('events', r.event); if (!e) bad('Etkinlik bulunamadı');
        const hv = x.get('venues', e.venue); if (hv && hv.type === 'seated') evSeatCat(hv, e, r.seat);
        r.until = Math.min(r.until, Date.now() + 9 * 60000);
        if (x.col('tickets').some((t) => t.event === r.event && t.seat === r.seat && t.status !== 'refunded')) throw Object.assign(new Error('Bu koltuk az önce satıldı'), { status: 409 });
        if (x.col('holds').filter((h) => h.owner === r.owner && h.until > Date.now()).length > 8) bad('En fazla 8 bilet');
      }),
      del: (h, x) => h.until <= Date.now() || (!!holdOwner(x.q) && h.owner === holdOwner(x.q)), // süresi dolan kilit temizlenebilir; süren kilidi yalnızca sahibi kaldırır
    },
    tickets: {
      ins: I({ event: 'id', seat: 'str:12?', cat: 'str:20', ttype: 'str:30?', buyer: 'json:400' }, () => ({ channel: 'online', pay: 'gise', status: 'reserved', at: nowIso() }), (r, x) => {
        const e = x.get('events', r.event); const v = e && x.get('venues', e.venue);
        if (!e || !v || e.status === 'iptal' || e.status === 'taslak' || e.date < x.today) bad('Etkinlik satışta değil');
        // Online satış penceresi: başlangıç–bitiş (boşsa etkinlik saatine kadar)
        const now = Date.now(), st = evStart(e); if (e.salesStart && now < trTime(e.salesStart)) bad('Online satış henüz başlamadı'); if (now > (e.salesEnd ? trTime(e.salesEnd) : st)) bad('Online satış kapandı');
        if (v.type === 'seated') r.cat = evSeatCat(v, e, r.seat);
        const price = Number((e.prices || {})[r.cat]); if (!(price >= 0) || !(r.cat in (v.cats || {}))) bad('Geçersiz kategori');
        const unit = evUnit(e, r.cat, r.ttype, x.today);
        r.buyer = clean({ name: 'str:80', phone: 'phone', email: 'email?' }, r.buyer || {});
        const live = x.col('tickets').filter((t) => t.event === e.id && t.status !== 'refunded');
        if (v.type === 'seated') { if (!r.seat || live.some((t) => t.seat === r.seat)) throw Object.assign(new Error('Koltuklardan biri satıldı, lütfen yeniden seçin'), { status: 409 }); }
        else { r.seat = null; if (live.filter((t) => t.cat === r.cat).length >= Number((v.capacity || {})[r.cat] || 0)) throw Object.assign(new Error('Bu kategoride yer kalmadı'), { status: 409 }); }
        x._n = (x._n || 0) + 1; if (x._n > 8) bad('En fazla 8 bilet');
        if (!x._order) x._order = x.seq('orders', 'B');
        const k = evCodeCheck(x, x.q.code, e); if (k) k.uses = (k.uses || 0) + 1;
        // Hizmet bedeli ve ödeme son anı sunucuda yazılır (ayar: serviceFee, resHours — en geç etkinlikten 2 saat önce)
        const set = { serviceFee: 15, ...(x.doc._settings || {}) }; const hold = Math.max(now + 15 * 60000, Math.min(now + (Number(set.resHours) || 48) * 3600000, st - 2 * 3600000));
        Object.assign(r, { code: tixCode(), price: unit, paid: k ? Math.round(unit * (1 - k.pct / 100)) : unit, ttype: r.ttype || 'Tam', discount: k ? k.code : null, order: x._order, fee: Number(set.serviceFee) || 0, holdUntil: hold });
      }),
    },
    // Bekleme listesi: tükenen etkinlik için ad + telefon; liste herkese açık değildir (pub'da yok)
    waitlist: {
      ins: I({ event: 'id', cat: 'str:20?', name: 'str:80', phone: 'phone', qty: 'int:1:8' }, () => ({ status: 'bekliyor', at: nowIso() }), (r, x) => {
        const e = x.get('events', r.event); if (!e || e.status === 'iptal' || e.status === 'taslak' || e.date < x.today) bad('Etkinlik satışta değil');
        const l = x.col('waitlist').filter((w) => w.event === r.event); if (l.length >= 2000) bad('Bekleme listesi dolu');
        if (l.some((w) => digits(w.phone) === digits(r.phone) && w.status === 'bekliyor')) bad('Bu telefon zaten bekleme listesinde');
      }),
    },
    codes: 'ignore',
  },
  grant: (x) => (x._order ? { k: 'o', i: x._order } : null),
};

// ---------- Adisyon: QR menü (qr.html?masa=) — masadan sipariş, garson/hesap çağırma, değerlendirme ----------
// Masa kimliği QR koddan gelir (x.masa); sayfa yalnızca o masanın açık hesabını görür
const qrItem = (x, i) => {
  const m = x.get('menu', i && i.pid); const q = Number(i && i.qty);
  if (!m || m.active === false || !Number.isInteger(q) || q < 1 || q > 50) bad('Menüde olmayan ürün');
  return { id: /^[A-Za-z0-9_-]{4,40}$/.test(String(i.id)) ? String(i.id) : 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), pid: m.id, name: m.name, price: Number(m.price), qty: q, note: val('str:200', i.note || '', 'note'), status: 'new', station: m.station, qr: true };
};
// Masa + masanın rastgele QR anahtarı (qrKey) birlikte gerekir: masa kimliği (salon-1) tahmin edilebildiği için dışarıdan sahte sipariş verilebiliyordu
const qrOk = (x) => { const t = x.q && x.get('tables', x.q.masa); return t && t.qrKey && String(x.q.k || '') === t.qrKey ? t : null; };
const qrTable = (x) => { const t = qrOk(x); if (!t) bad('Geçersiz masa kodu — masadaki QR kodu okutun'); return t; };
RULES.adisyon = {
  pub: {
    mcats: true,
    menu: { where: (m) => m.active !== false, omit: ['recipe', 'cost'] },
    tables: { fields: ['id', 'name', 'area', 'seats'] },
    checks: { where: () => false }, // hesaplar yalnızca masaya göre (query)
  },
  query: (x, q) => {
    const t = qrOk({ ...x, q }); if (!t) return null;
    // "Çok satanlar" için ürün bazında toplam (hesap ayrıntısı olmadan)
    const pop = {}; x.col('checks').forEach((k) => (k.items || []).forEach((i) => { pop[i.pid] = (pop[i.pid] || 0) + Number(i.qty || 0); }));
    const open = x.col('checks').filter((k) => k.table === t.id && k.status !== 'closed').map((k) => x.pick(k, ['id', 'no', 'table', 'items', 'payments', 'discount', 'status', 'opened', 'type']));
    return { checks: [...open, { id: '_pop', status: 'closed', table: null, items: Object.entries(pop).map(([pid, qty]) => ({ pid, qty })) }] };
  },
  write: {
    checks: {
      ins: (rec, x) => {
        const t = qrTable(x); if (x.col('checks').some((k) => k.table === t.id && k.status !== 'closed')) throw Object.assign(new Error('Masanın açık hesabı var, sayfayı yenileyin'), { status: 409 });
        const items = (Array.isArray(rec.items) ? rec.items : []).slice(0, 40).map((i) => qrItem(x, i)); if (!items.length) bad('Sepet boş');
        return { no: x.seq('checks', 'A'), type: 'masa', table: t.id, guests: 1, opened: nowIso(), items, payments: [], status: 'open', waiter: null, discount: null, created: nowIso() };
      },
      upd: (k, set, x) => {
        const t = qrTable(x); const keys = Object.keys(set).filter((f) => f !== 'updated');
        if (k.table !== t.id || k.status === 'closed' || keys.some((f) => f !== 'items') || !Array.isArray(set.items)) deny();
        const old = k.items || []; const ids = new Set(old.map((i) => i.id)); const add = set.items.filter((i) => i && !ids.has(i.id));
        if (!add.length || add.length > 40 || set.items.length - add.length !== old.length) deny();
        return { items: [...old, ...add.map((i) => qrItem(x, i))], updated: nowIso() };
      },
    },
    calls: {
      ins: I({ type: 'enum:garson|hesap', pay: 'enum:kart|nakit?', split: 'bool?', order: 'bool?' }, (r, x) => ({ table: qrTable(x).id, at: nowIso(), done: false }), (r, x) => {
        if (x.col('calls').filter((c) => c.table === r.table && !c.done).length >= 5) bad('Garsonunuz çağrıldı, birazdan masanızda');
      }),
    },
    feedback: { ins: I({ rating: 'int:1:5', comment: 'str:600?' }, (r, x) => ({ table: qrTable(x).id, at: nowIso(), source: 'qr' })) },
  },
};

module.exports = RULES;
module.exports._lib = { appendOnly, strip, bad, deny, val, clean, I, U, me, mergeByPhone, samePhone, digits, norm, overlap, toMin, nowIso };
