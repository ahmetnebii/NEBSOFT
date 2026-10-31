// Borç tahsilatı: veli, üye ve sakin portalından kartla ödeme, eğitimde ödeme bağlantısı. Sağlayıcı katmanı vitrinle ortaktır (odeme-saglayici.js), geri çağrı uçları eticaret-odeme.js'tedir.
// Kurallar:
//  • Tutarı sunucu belgeden hesaplar. Müşteri yalnız hangi kalemi ödediğini seçer, tutar göndermez. Site gecikme tazminatı da sunucuda hesaplanır.
//  • Kalem belirteç sahibinin olmalı: veli kendi çocuğunun, üye kendi taksitini öder. Bağlantı tek kayda bağlıdır ve 7 gün geçerlidir.
//  • Sonuç sağlayıcıdan sorgulanır; imza + kayıt + tutar tutmadan borç kapanmaz (PayTR bildirimi imzalıdır, sonuç bildirimin kendisidir).
//  • Test ödemesi borcu kapatmaz, belgeye hiçbir şey yazmaz: yalnız bu tabloda "test" olarak kalır (CLAUDE.md §1).
//  • Aynı borç iki ödemeyle gelirse ikincisi işlenmez, "kontrol" durumuna düşer: para sağlayıcıdadır, işletme iade eder.
//  • Kayıtta kişisel bilgi tutulmaz (belge şifreli, tablo değil): yalnız kayıt kimliği, tutar, durum. İsim listede belgeden okunur.
//  • İade yalnız tam tutar: borç aynen geri açılır. Kısmi iade sağlayıcı panelinden yapılır, programa elle işlenir.
const crypto = require('crypto');
const db = require('./db');
const belge = require('./belge');
const log = require('./log');
const { TUM } = require('./odeme-saglayici');
const { route, err, valid, hesapRolu, canUseApp } = require('./routes');
const { signToken, readToken } = require('./public');
const { ayar, geriAdres, isletme, hataKapat, gorunum } = require('./eticaret-odeme');
const TTL = require('./isletim').odemeMs;
const BAG_SAAT = 7 * 24;
const r2 = (n) => Math.round(Number(n) * 100) / 100;
const gun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);
const trGun = (d) => new Date(new Date(d).getTime() + 3 * 3600e3).toISOString().slice(0, 10);
const on10 = (t) => String(t || '').replace(/\D/g, '').slice(-10);
const yeniId = () => `on${crypto.randomBytes(7).toString('hex')}`;
const gsm = (t) => (on10(t).length === 10 ? `+90${on10(t)}` : '');
const liste = (d, n) => (Array.isArray(d[n]) ? d[n] : (d[n] = []));
const bul = (d, n, id) => (d[n] || []).find((x) => x.id === id);
const gunluk = (d, action, detail) => { if (Array.isArray(d._log)) { d._log.unshift({ id: `p${Date.now().toString(36)}`, at: new Date().toISOString(), action, detail, user: 'Online' }); if (d._log.length > 300) d._log.length = 300; } };

// Taksitli programlar (kurs, spor, eğitim): kalem anahtarı "sahip.taksit"
function taksitli({ kim, sayfa, roller, col, sahipler, kisi, etiket, odeme }) {
  const taksit = (d, k) => { const [s, t] = String(k).split('.'); const o = bul(d, col, s); return { o, t: o && (o.installments || []).find((x) => x.id === t) }; };
  const toplu = (d, kalemler, fn) => { const m = {}; kalemler.forEach((x) => { const s = String(x.k).split('.')[0]; m[s] = r2((m[s] || 0) + x.tutar); }); Object.entries(m).forEach(([s, n]) => liste(d, 'payments').push({ id: yeniId(), ...odeme(bul(d, col, s) || { id: s }), ...fn(n) })); };
  return {
    kim, sayfa, roller, ad: (d, r) => { const o = bul(d, col, r.sahip); return o ? kisi(d, o).ad : ''; },
    kisi: (d, i) => { const o = sahipler(d, i)[0]; return o ? kisi(d, o) : null; },
    kalemler: (d, i) => { const g = gun(); return sahipler(d, i).flatMap((o) => (o.installments || []).filter((t) => !t.paid && !t.canceled && Number(t.amount) > 0).map((t) => ({ k: `${o.id}.${t.id}`, ad: etiket(d, o, t), tutar: r2(t.amount), vade: t.due, sec: t.due <= g }))).sort((a, b) => String(a.vade).localeCompare(String(b.vade))); },
    uygula(d, r, c) {
      const yapilan = r.kalemler.filter((x) => { const { t } = taksit(d, x.k); if (!t || t.paid || t.canceled) return false; t.paid = true; t.paidAt = c.gun; return true; });
      if (yapilan.length) toplu(d, yapilan, (n) => ({ amount: n, at: c.at, created: c.at, type: 'online kart', ref: c.ref, online: true, desc: `Online ödeme ${c.ref}` }));
      return { yapilan: yapilan.map((x) => x.k) };
    },
    geriAl(d, r, c) {
      const L = r.kalemler.filter((x) => (r.yapilan || []).includes(x.k)); L.forEach((x) => { const { t } = taksit(d, x.k); if (t) { t.paid = false; delete t.paidAt; } });
      if (L.length) toplu(d, L, (n) => ({ amount: -n, at: c.at, created: c.at, type: 'online kart', ref: c.ref, online: true, desc: `Online ödeme iadesi ${c.ref}` }));
    },
  };
}

const kurs = taksitli({
  kim: 'p', sayfa: 'veli.html', roller: ['admin', 'kayit'], col: 'students',
  sahipler: (d, ph) => (d.students || []).filter((s) => on10(s.parentPhone) === ph),
  kisi: (d, s) => ({ ad: String(s.parent || s.name || ''), tel: s.parentPhone, eposta: s.parentEmail || s.email }),
  etiket: (d, s) => `${s.name} taksiti`, odeme: (s) => ({ student: s.id }),
});
const egitim = taksitli({
  kim: 'b', sayfa: 'odeme.html', roller: ['admin', 'kayit'], col: 'enrolls',
  sahipler: (d, id) => (d.enrolls || []).filter((e) => e.id === id && e.status !== 'ayrildi'),
  kisi: (d, e) => { const t = bul(d, 'trainees', e.trainee) || {}; return { ad: String(t.name || ''), tel: t.phone, eposta: t.email }; },
  etiket: (d, e) => { const g = bul(d, 'groups', e.group) || {}; return `${(bul(d, 'courses', g.course) || {}).name || 'Eğitim'} taksiti`; }, odeme: (e) => ({ enroll: e.id, trainee: e.trainee }),
});
// Spor: taksitlere ek olarak paket yenileme. Kalem anahtarı "yenile:<paket>", geri almak için eski üyelik saklanır
const sporT = taksitli({
  kim: 'o', sayfa: 'uye.html', roller: ['admin', 'danisma'], col: 'members',
  sahipler: (d, id) => (d.members || []).filter((m) => m.id === id),
  kisi: (d, m) => ({ ad: String(m.name || ''), tel: m.phone, eposta: m.email }),
  etiket: (d, m) => `${(bul(d, 'plans', m.plan) || {}).name || 'Üyelik'} taksiti`, odeme: (m) => ({ member: m.id }),
});
const YEN = 'yenile:'; const yeniMi = (x) => String(x.k).startsWith(YEN);
const spor = { ...sporT,
  yenileme(d, i, planId) { const p = bul(d, 'plans', String(planId)); return p && Number(p.price) > 0 && bul(d, 'members', i) ? [{ k: `${YEN}${p.id}`, ad: `${p.name} yenileme`, tutar: r2(p.price), sec: true }] : []; },
  uygula(d, r, c) {
    const yen = r.kalemler.find(yeniMi); const son = sporT.uygula(d, { ...r, kalemler: r.kalemler.filter((x) => !yeniMi(x)) }, c); if (!yen) return son;
    const m = bul(d, 'members', r.sahip); const p = bul(d, 'plans', yen.k.slice(YEN.length)); if (!m || !p) return son;
    const once = { plan: m.plan, start: m.start, end: m.end, sessionsLeft: m.sessionsLeft }; const taban = m.end > c.gun ? m.end : c.gun; const tid = yeniId();
    m.plan = p.id; m.start = m.end > c.gun ? m.start : c.gun; m.end = new Date(new Date(`${taban}T12:00:00Z`).getTime() + Number(p.months) * 30 * 864e5).toISOString().slice(0, 10); if (p.sessions) m.sessionsLeft = (m.sessionsLeft || 0) + p.sessions;
    liste(m, 'installments').push({ id: tid, due: c.gun, amount: yen.tutar, paid: true, paidAt: c.gun });
    liste(d, 'payments').push({ id: yeniId(), member: m.id, amount: yen.tutar, at: c.at, created: c.at, type: 'online kart', ref: c.ref, online: true, desc: p.name });
    return { ...son, yenileme: { once, tid, tutar: yen.tutar } };
  },
  geriAl(d, r, c) {
    sporT.geriAl(d, r, c); const y = r.yenileme; const m = bul(d, 'members', r.sahip); if (!y || !m) return;
    Object.assign(m, y.once); if (y.once.sessionsLeft === undefined) delete m.sessionsLeft; m.installments = (m.installments || []).filter((t) => t.id !== y.tid);
    liste(d, 'payments').push({ id: yeniId(), member: m.id, amount: -y.tutar, at: c.at, created: c.at, type: 'online kart', ref: c.ref, online: true, desc: `Online yenileme iadesi ${c.ref}` });
  },
};

// Site: aidat ve sayaç borcu. Formül apps/site/data.js lateFee ile aynıdır, makbuz alanları panelin tahsilat iptaliyle uyumludur
const sonGun = (per, gn) => { const [y, m] = String(per).split('-').map(Number); return Date.UTC(y, m - 1, Math.min(Number(gn) || 10, new Date(Date.UTC(y, m, 0)).getUTCDate()), 9); };
const acikAidat = (d, f) => (d.dues || []).filter((x) => x.flat === f && x.amount > (x.paid || 0)).sort((a, b) => String(a.period).localeCompare(String(b.period)));
const gecikme = (d, f) => { const s = d._settings || {}; const oran = Number(s.lateFee ?? 5) / 100; return Math.round(acikAidat(d, f).reduce((t, x) => (x.type === 'faiz' ? t : t + (x.amount - (x.paid || 0)) * oran * Math.max(0, Math.floor((Date.now() - sonGun(x.period, s.dueDay ?? 10)) / 864e5)) / 30), 0)); };
const FAIZ = 'faiz';
const site = {
  kim: 'f', sayfa: 'sakin.html', roller: ['admin', 'muhasebe'],
  ad: (d, r) => { const f = bul(d, 'flats', r.sahip); return f ? `${f.block} Blok ${f.no}` : ''; },
  kisi: (d, i) => { const f = bul(d, 'flats', i); return f ? { ad: String(f.tenant || f.owner || `${f.block} Blok ${f.no}`), tel: f.tenantPhone || f.ownerPhone, eposta: f.tenantEmail || f.ownerEmail } : null; },
  kalemler: (d, i) => acikAidat(d, i).map((x) => ({ k: x.id, ad: String(x.desc || x.period), tutar: r2(x.amount - (x.paid || 0)), vade: x.period, sec: true })),
  // Tazminat, panel ve portal kuralıyla aynı: borçların tamamı ödenince alınır
  ek(d, i, secilen) { const fee = gecikme(d, i); return fee > 0 && secilen.length === acikAidat(d, i).length ? [{ k: FAIZ, ad: 'Gecikme tazminatı', tutar: fee }] : []; },
  uygula(d, r, c) {
    const alloc = []; const yapilan = []; const f = bul(d, 'flats', r.sahip); let fee = 0;
    r.kalemler.forEach((x) => { if (x.k === FAIZ) { fee = x.tutar; return; } const b = bul(d, 'dues', x.k); if (!b || b.amount <= (b.paid || 0)) return; const p = r2(Math.min(b.amount - (b.paid || 0), x.tutar)); b.paid = r2((b.paid || 0) + p); b.paidAt = c.gun; alloc.push({ due: b.id, amt: p }); yapilan.push(x.k); });
    if (!yapilan.length || !f) return { yapilan };
    const feeRec = fee > 0 ? { id: yeniId(), created: c.at, flat: f.id, period: c.gun.slice(0, 7), type: 'faiz', desc: 'Gecikme tazminatı', amount: fee, paid: fee, paidAt: c.gun } : null; if (feeRec) { liste(d, 'dues').push(feeRec); yapilan.push(FAIZ); }
    const makbuz = { id: yeniId(), created: c.at, flat: f.id, amount: r2(alloc.reduce((t, a) => t + a.amt, 0) + fee), type: 'kart', ref: c.ref, at: c.at, online: true, alloc, credit: 0, feeDue: feeRec ? feeRec.id : null }; liste(d, 'receipts').push(makbuz);
    return { yapilan, makbuz: makbuz.id };
  },
  geriAl(d, r, c) {
    const rc = bul(d, 'receipts', r.makbuz); if (!rc || rc.canceled) return;
    (rc.alloc || []).forEach((a) => { const b = bul(d, 'dues', a.due); if (b) { b.paid = r2((b.paid || 0) - a.amt); if (b.paid <= 0) { b.paid = 0; b.paidAt = null; } } }); if (rc.feeDue) d.dues = (d.dues || []).filter((x) => x.id !== rc.feeDue);
    rc.canceled = { at: c.at, by: c.by || 'Online', why: `Karta iade ${c.ref}` };
  },
};
const P = { kurs, spor, site, egitim };

const satir = (r) => r && { ...r, tutar: Number(r.tutar), v: JSON.parse(r.veri || '{}') };
const kayit = async (tid, id) => satir(await db.one('SELECT * FROM online_tahsilat WHERE tenant_id=? AND id=?', [tid, String(id).slice(0, 40)]));
// Sağlayıcı katmanı sipariş biçimiyle çalışır: kayıt aynı biçime çevrilir
const nesne = (r) => ({ id: r.id, no: r.id.slice(-8).toUpperCase(), total: r.tutar, customer: r.sahip, etiket: r.v.etiket, sanal: true, payment: r.v.payment });
const belgeOku = async (tid, app) => { const r = await db.one('SELECT data, version FROM app_data WHERE tenant_id=? AND app=?', [tid, app]); return r ? belge.oku(tid, app, r) : null; };
const veriYaz = (tx, r, durum, v) => tx.q('UPDATE online_tahsilat SET durum=?, veri=?, updated=? WHERE tenant_id=? AND id=?', [durum, JSON.stringify(v), new Date(), r.tenant_id, r.id]);
// Satır önce, belge sonra kilitlenir: aynı sonuç iki kez gelse de borç bir kez kapanır
async function isle(tid, id, fn) {
  return db.tx(async (tx) => {
    const r = satir((await tx.q('SELECT * FROM online_tahsilat WHERE tenant_id=? AND id=? FOR UPDATE', [tid, id]))[0]); if (!r) return null;
    const row = (await tx.q('SELECT data, version FROM app_data WHERE tenant_id=? AND app=? FOR UPDATE', [tid, r.app]))[0]; const doc = row && await belge.oku(tid, r.app, row); if (!doc) return null;
    const son = await fn(r, doc, tx); if (son && son.yaz) await tx.q('UPDATE app_data SET data=?, version=version+1, updated=? WHERE tenant_id=? AND app=?', [await belge.kapat(tid, r.app, JSON.stringify(doc)), new Date(), tid, r.app]);
    return son ? son.durum : r.durum;
  });
}
const SURER = new Set(['bekliyor', 'vazgecildi', 'inceleme', 'basarisiz']);
// Bildirim, dönüş veya tarama buraya gelir. hazir: imzası doğrulanmış sonuç (PayTR)
async function tamamla(tid, id, hazir) {
  const r = await kayit(tid, id); if (!r || !r.v.payment) return null; if (!SURER.has(r.durum)) return r.durum;
  const a = await ayar(tid); if (!a) return r.durum; const k = hazir || await TUM[r.v.payment.provider].sonuc(a, nesne(r));
  if (k.durum === 'bekliyor') return r.durum === 'vazgecildi' ? 'vazgecildi' : 'bekliyor';
  const ref = `ONL${r.id.slice(-8).toUpperCase()}`; const at = new Date().toISOString();
  return isle(tid, id, async (x, doc, tx) => {
    if (!SURER.has(x.durum)) return { durum: x.durum }; const v = { ...x.v, payment: { ...x.v.payment, ...(k.bilgi || {}), at }, neden: k.neden || undefined };
    if (k.durum === 'basarisiz') { await veriYaz(tx, x, 'basarisiz', v); return { durum: 'basarisiz' }; }
    if (k.durum === 'inceleme') { await veriYaz(tx, x, 'inceleme', v); return { durum: 'inceleme' }; }
    if (k.durum !== 'odendi') { await veriYaz(tx, x, 'kontrol', v); log.uygulama.hata('tahsilat.uyusmazlik', `${x.app} ${x.id}: ${k.neden}`); return { durum: 'kontrol' }; }
    if (x.test) { await veriYaz(tx, x, 'test', v); return { durum: 'test' }; } // test ödemesi borç kapatmaz
    const u = P[x.app].uygula(doc, { ...x.v, sahip: x.sahip }, { gun: gun(), at, ref }); const tum = (u.yapilan || []).length + (u.yenileme ? 1 : 0) >= x.v.kalemler.length;
    if (!tum) { v.neden = 'Bu ödemenin bir kısmı veya tamamı başka yolla kapanan borca geldi. Fazla tutarı karta iade edin.'; log.uygulama.hata('tahsilat.cift', `${x.app} ${x.id}`); }
    Object.assign(v, u, { ref }); gunluk(doc, 'Online tahsilat', `${ref} · ${x.tutar} TL`); await veriYaz(tx, x, tum ? 'odendi' : 'kontrol', v); return { durum: tum ? 'odendi' : 'kontrol', yaz: !!(u.yapilan || []).length || !!u.yenileme };
  });
}
async function tara() {
  if (!db.ready()) return; const L = await db.q("SELECT tenant_id, id, durum FROM online_tahsilat WHERE durum='inceleme' OR (durum='bekliyor' AND created < ?) LIMIT 200", [new Date(Date.now() - TTL())]);
  for (const r of L) { try { const s = await tamamla(r.tenant_id, r.id); if (s === 'bekliyor') await db.q("UPDATE online_tahsilat SET durum='suresi', updated=? WHERE tenant_id=? AND id=? AND durum='bekliyor'", [new Date(), r.tenant_id, r.id]); } catch (e) { log.uygulama.hata('tahsilat.tarama', e.message); } }
}
setInterval(() => tara().catch(() => {}), Number(process.env.ETICARET_ODEME_TARA_MS) || 300e3).unref();

const sayfa = (t, r) => `/t/${t.slug}/apps/${r.app}/${P[r.app].sayfa}?odeme=${r.id}`;
async function baglam(c) {
  const app = c.params.app; const p = Object.prototype.hasOwnProperty.call(P, app) ? P[app] : null; const t = p && await isletme(c.params.slug); if (!t) throw err(404, 'Sayfa bulunamadı');
  const lic = await db.one('SELECT status, end FROM licenses WHERE tenant_id=? AND product=?', [t.id, app]); if (!valid(lic)) throw err(402, 'Bu hizmet şu anda kullanılamıyor');
  const ident = readToken(c.body.token, t.id, app); if (!ident || ident.k !== p.kim) throw err(401, app === 'egitim' ? 'Ödeme bağlantısının süresi dolmuş. Kurumdan yeni bağlantı isteyin.' : 'Oturumunuz kapanmış. Yeniden giriş yapın.');
  const doc = await belgeOku(t.id, app); if (!doc) throw err(404, 'Kayıt bulunamadı'); return { t, app, p, i: ident.i, doc };
}
const secim = (p, doc, i, b) => {
  if (b.yenile) { if (!p.yenileme) throw err(400, 'Bu işlem bu programda yok'); return p.yenileme(doc, i, b.yenile); }
  const tum = p.kalemler(doc, i); const iste = Array.isArray(b.kalemler) ? b.kalemler.map(String) : tum.filter((x) => x.sec).map((x) => x.k); const sec = tum.filter((x) => iste.includes(x.k));
  return [...sec, ...(p.ek ? p.ek(doc, i, sec) : [])];
};
// Kendi kaydı dışında isim gösterilmez: bağlantı başkasının eline geçebilir
const maske = (ad) => String(ad || '').trim().split(/\s+/).map((s) => `${s[0] || ''}${'*'.repeat(Math.min(3, Math.max(0, s.length - 1)))}`).join(' ');

route('POST', '/api/public/:slug/:app/tahsilat/borc', { auth: 'none', limit: ['tahborc', 60, 60e3], bodyMax: 2e3 }, async (c) => {
  const { t, app, p, i, doc } = await baglam(c); const g = await gorunum(t); const k = p.kisi(doc, i); if (!k) throw err(404, 'Kayıt bulunamadı');
  const kalemler = c.body.yenile ? secim(p, doc, i, c.body) : p.kalemler(doc, i);
  return { ok: true, kart: g.kartOdeme || null, kisi: { ad: app === 'egitim' ? maske(k.ad) : k.ad, epostaVar: !!k.eposta, telVar: !!gsm(k.tel) }, isletme: (doc._settings || {}).bizName || '', kalemler: kalemler.map(({ k: a, ad, tutar, vade, sec }) => ({ k: a, ad, tutar, vade, sec })), ek: p.ek ? p.ek(doc, i, p.kalemler(doc, i))[0] || null : null };
});

route('POST', '/api/public/:slug/:app/tahsilat/baslat', { auth: 'none', limit: ['tahbaslat', 20, 60e3], bodyMax: 4e3 }, async (c) => {
  const { t, app, p, i } = await baglam(c); const a = await ayar(t.id); if (!a) throw err(409, 'Kartla ödeme şu anda kapalı'); const sg = TUM[a.saglayici];
  const tc = String(c.body.tc || '').replace(/\D/g, ''); if (sg.tc && !/^[1-9]\d{10}$/.test(tc)) throw err(400, 'T.C. kimlik numarasını 11 hane olarak girin');
  let doc = await belgeOku(t.id, app); const ilk = secim(p, doc, i, c.body); if (!ilk.length) throw err(400, 'Ödenecek borç seçilmedi');
  // Yarım kalan ödeme varsa önce sonucu öğrenilir: aynı borç için ikinci çekim açılmaz
  const anahtar = new Set(ilk.map((x) => x.k)); const acik = (await db.q("SELECT * FROM online_tahsilat WHERE tenant_id=? AND app=? AND durum IN ('bekliyor','inceleme') LIMIT 50", [t.id, app])).map(satir).filter((r) => r.v.kalemler.some((x) => anahtar.has(x.k)));
  for (const r of acik) { const s = await tamamla(t.id, r.id); if (s === 'odendi' || s === 'inceleme' || s === 'kontrol') throw err(409, 'Bu borç için ödeme alınmış veya inceleniyor. Sayfayı yenileyin, yeniden ödeme yapmayın.'); if (s === 'bekliyor') await db.q("UPDATE online_tahsilat SET durum='vazgecildi', updated=? WHERE tenant_id=? AND id=? AND durum='bekliyor'", [new Date(), t.id, r.id]); }
  doc = await belgeOku(t.id, app); const kalemler = secim(p, doc, i, c.body); if (!kalemler.length) throw err(409, 'Bu borç kapanmış. Sayfayı yenileyin.');
  const tutar = r2(kalemler.reduce((n, x) => n + x.tutar, 0)); if (!(tutar > 0)) throw err(400, 'Tutar geçersiz');
  const k = p.kisi(doc, i) || {}; const eposta = String(k.eposta || c.body.email || '').trim().slice(0, 120); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) throw err(400, 'Kartla ödeme için e-posta adresi gerekir'); const tel = gsm(k.tel) || gsm(c.body.telefon); if (!tel) throw err(400, 'Telefon numarası geçersiz');
  const ad = String(k.ad || 'Müşteri').trim() || 'Müşteri'; const parca = ad.split(/\s+/); const soyad = parca.length > 1 ? parca.pop() : parca[0]; const geri = await geriAdres(c); const id = `ot${crypto.randomBytes(8).toString('hex')}`; const sahip = String(kalemler[0].k.startsWith(YEN) || kalemler[0].k === FAIZ || app === 'site' ? i : kalemler[0].k.split('.')[0]).slice(0, 60);
  const etiket = kalemler.length > 1 ? `${kalemler[0].ad} ve ${kalemler.length - 1} kalem` : kalemler[0].ad; const adres = String(t.address || (doc._settings || {}).bizAddress || 'Türkiye').slice(0, 300);
  const o = { id, no: id.slice(-8).toUpperCase(), total: tutar, customer: sahip, etiket, sanal: true, ship: { name: ad, city: 'Türkiye', address: adres, phone: tel } };
  const r0 = { app, id }; const f = await sg.baslat(a, o, { geri, slug: t.slug, donus: `${geri}${sayfa(t, r0)}`, donusSunucu: `${geri}/api/odeme/donus/${t.slug}/${id}`, ip: String(c.ip || ''), adSoyad: ad, ad: parca.join(' ') || soyad, soyad, tc, eposta, gsm: tel }).catch((e) => hataKapat(e, 'Ödeme başlatılamadı: '));
  const v = { kalemler: kalemler.map(({ k: a2, tutar: n }) => ({ k: a2, tutar: n })), etiket, payment: { provider: a.saglayici, token: f.token, ...(f.oid ? { oid: f.oid } : {}), test: a.test, startedAt: new Date().toISOString() } };
  await db.q("INSERT INTO online_tahsilat (tenant_id, app, id, sahip, tutar, durum, test, saglayici, veri, created, updated) VALUES (?,?,?,?,?,'bekliyor',?,?,?,?,?)", [t.id, app, id, sahip, tutar, a.test ? 1 : 0, a.saglayici, JSON.stringify(v), new Date(), new Date()]);
  return { ok: true, tutar, ...(f.iframe ? { iframe: f.iframe } : { url: f.url }) };
});

// Sonuç sayfası. Kimlik tahmin edilemez, yanıtta yalnız durum ve tutar vardır
route('POST', '/api/public/:slug/:app/tahsilat/sonuc', { auth: 'none', limit: ['tahsonuc', 60, 60e3], bodyMax: 1e3 }, async (c) => {
  const t = await isletme(c.params.slug); if (!t) throw err(404, 'Sayfa bulunamadı'); const id = String(c.body.id || ''); if (!/^ot[0-9a-f]{16}$/.test(id)) throw err(404, 'Ödeme bulunamadı');
  const r = await kayit(t.id, id); if (!r || r.app !== c.params.app) throw err(404, 'Ödeme bulunamadı'); let s = r.durum; try { s = await tamamla(t.id, id) || s; } catch (e) { log.uygulama.hata('tahsilat.sonuc', e.message); }
  return { ok: true, durum: s, tutar: r.tutar, test: !!r.test, ref: (await kayit(t.id, id)).v.ref || '' };
});

// Panel uçları. İsimler tabloda değil, belgede: liste belgeden okunarak doldurulur
async function panel(c) {
  const app = c.params.app; const p = Object.prototype.hasOwnProperty.call(P, app) ? P[app] : null; const tid = c.user.tenant_id; if (!p) throw err(404, 'Bulunamadı'); if (!tid) throw err(403, 'İşletme hesabı gerekir');
  if (!(await canUseApp(c.user, app))) throw err(402, 'Bu uygulama için geçerli lisans veya deneme yok'); const k = await hesapRolu(c.user, app); return { app, p, tid, k, yetkili: !k || p.roller.includes(k.rol) };
}
route('GET', '/api/tahsilat/:app/durum', { auth: 'user' }, async (c) => { const { tid } = await panel(c); const a = await ayar(tid); return { ok: true, bagli: !!a, test: a ? a.test : null, ad: a ? TUM[a.saglayici].ad : '' }; });
route('GET', '/api/tahsilat/:app/liste', { auth: 'user' }, async (c) => {
  const { app, p, tid, yetkili } = await panel(c); if (!yetkili) throw err(403, 'Bu listeyi görme yetkiniz yok');
  const L = (await db.q("SELECT * FROM online_tahsilat WHERE tenant_id=? AND app=? AND durum NOT IN ('vazgecildi','suresi') ORDER BY created DESC LIMIT 200", [tid, app])).map(satir); const doc = await belgeOku(tid, app) || {};
  return { ok: true, liste: L.map((r) => ({ id: r.id, at: r.created, tutar: r.tutar, durum: r.durum, test: !!r.test, saglayici: (TUM[r.saglayici] || {}).ad || r.saglayici, ad: p.ad(doc, r), etiket: r.v.etiket, neden: r.v.neden || '', ref: r.v.ref || '', iade: (r.durum === 'odendi' || r.durum === 'kontrol') && !r.test && !!(r.v.payment || {}).paymentId })) };
});
// Yalnız eğitimde: kursiyere gönderilecek bağlantı. Portal gerektirmez, tek kayda bağlıdır
route('POST', '/api/tahsilat/:app/baglanti', { auth: 'user', limit: ['tahbag', 60, 60e3], bodyMax: 1e3 }, async (c) => {
  const { app, p, tid, yetkili } = await panel(c); if (p.kim !== 'b') throw err(400, 'Bu program portal kullanır'); if (!yetkili) throw err(403, 'Ödeme bağlantısı oluşturma yetkiniz yok');
  const a = await ayar(tid); if (!a) throw err(409, 'Online ödeme bağlı değil. Entegrasyon Merkezi\'nden kurup Bağlantıyı dene adımını tamamlayın.');
  const doc = await belgeOku(tid, app) || {}; const i = String(c.body.kayit || '').slice(0, 40); if (!p.kalemler(doc, i).length) throw err(400, 'Bu kayıtta ödenecek taksit yok');
  const t = await db.one('SELECT slug FROM tenants WHERE id=?', [tid]); const token = signToken({ t: tid, a: app, k: p.kim, i }, BAG_SAAT);
  return { ok: true, url: `${await geriAdres(c)}/t/${t.slug}/apps/${app}/${p.sayfa}#${token}`, test: a.test };
});
// Tam iade: sağlayıcıda iade, sonra borç geri açılır. Sağlayıcı hata verirse programda hiçbir şey değişmez
route('POST', '/api/tahsilat/:app/:id/iade', { auth: 'user', limit: ['tahiade', 30, 60e3], bodyMax: 2e3 }, async (c) => {
  const { tid, k, app } = await panel(c); if (k) throw err(403, 'İade yetkiniz yok');
  const kl = await db.q('UPDATE online_tahsilat SET kilit=? WHERE tenant_id=? AND app=? AND id=? AND (kilit IS NULL OR kilit < ?)', [new Date(), tid, app, c.params.id, new Date(Date.now() - 60e3)]); if (!kl.affectedRows) throw err(409, 'Bu ödeme için iade işleniyor');
  try {
    const r = await kayit(tid, c.params.id); if (!r || (r.durum !== 'odendi' && r.durum !== 'kontrol') || r.test || !(r.v.payment || {}).paymentId) throw err(409, 'Bu ödeme iade edilemez');
    const a = await ayar(tid); if (!a) throw err(409, 'Ödeme bağlantısı kapalı'); const sg = TUM[r.v.payment.provider]; if (sg.iadeYok) throw err(409, sg.iadeYok); const o = nesne(r);
    const tam = trGun(r.v.payment.at) === trGun(Date.now()); const s = await sg.iade(a, o, r.tutar, tam).catch((e) => hataKapat(e, '')); const at = new Date().toISOString(); const ref = r.v.ref || r.id;
    await isle(tid, r.id, async (x, doc, tx) => { P[x.app].geriAl(doc, { ...x.v, sahip: x.sahip }, { at, ref, by: c.user.name || c.user.email || '' }); gunluk(doc, 'Online tahsilat iadesi', `${ref} · ${x.tutar} TL`); await veriYaz(tx, x, 'iade', { ...x.v, iade: { at, ref: s.ref, tur: s.tur, by: c.user.name || c.user.email || '' } }); return { durum: 'iade', yaz: true }; });
    return { ok: true, tutar: r.tutar, tur: s.tur };
  } finally { await db.q('UPDATE online_tahsilat SET kilit=NULL WHERE tenant_id=? AND id=?', [tid, c.params.id]).catch(() => {}); }
});

module.exports = { kayit, nesne, tamamla, sayfa, tara };
