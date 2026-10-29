/* Hukuk Bürosu — dosya türleri, süre hesabı, demo verisi. Panel ve müvekkil portalı kullanır.
   Süre hesabı yardımcıdır; kesin süreyi avukat ilgili kanun ve tebliğ tarihine göre kontrol eder. */
window.HKK = {
  TYPES: { dava: 'Dava', icra: 'İcra takibi', danismanlik: 'Danışmanlık', arabuluculuk: 'Arabuluculuk', ceza: 'Ceza' },
  ST: { derdest: ['Derdest', 'info'], karar: ['Karar çıktı', 'acc'], istinaf: ['İstinafta', 'warn'], yargitay: ['Yargıtay\'da', 'warn'], takip: ['Takipte', 'info'], kesin: ['Kesinleşti', 'ok'], kapali: ['Kapandı', ''] },
  // Usul süreleri — kaynak: mevzuat.gov.tr metinleri (29.10.2026'da okundu, docs/urun/HUKUK.md §1). n + birim: g gün, h hafta, a ay, y yıl.
  // law: HMK (adli tatil +1 hafta, HMK 104) · CMK (+3 gün, CMK 331/4) · İYUK (+7 gün, İYUK 8/3) · İİK (adli tatil yok)
  RULES: [
    { id: 'hmk127', label: 'Cevap dilekçesi', ref: 'HMK 127', n: 2, u: 'h', law: 'HMK' },
    { id: 'hmk317', label: 'Cevap dilekçesi — basit yargılama', ref: 'HMK 317', n: 2, u: 'h', law: 'HMK' },
    { id: 'hmk136', label: 'Cevaba cevap / ikinci cevap', ref: 'HMK 136', n: 2, u: 'h', law: 'HMK' },
    { id: 'hmk281', label: 'Bilirkişi raporuna itiraz', ref: 'HMK 281', n: 2, u: 'h', law: 'HMK' },
    { id: 'hmk345', label: 'İstinaf', ref: 'HMK 345', n: 2, u: 'h', law: 'HMK' },
    { id: 'hmk361', label: 'Temyiz', ref: 'HMK 361', n: 2, u: 'h', law: 'HMK' },
    { id: 'iik16', label: 'İcra mahkemesine şikâyet', ref: 'İİK 16', n: 7, u: 'g', law: 'İİK' },
    { id: 'iik62', label: 'Ödeme emrine itiraz', ref: 'İİK 62', n: 7, u: 'g', law: 'İİK' },
    { id: 'iik168', label: 'Kambiyo — borca / imzaya itiraz, şikâyet', ref: 'İİK 168', n: 5, u: 'g', law: 'İİK' },
    { id: 'iik68', label: 'İtirazın kaldırılması', ref: 'İİK 68', n: 6, u: 'a', law: 'İİK' },
    { id: 'iik67', label: 'İtirazın iptali davası', ref: 'İİK 67', n: 1, u: 'y', law: 'İİK' },
    { id: 'cmk273', label: 'Ceza — istinaf', ref: 'CMK 273', n: 2, u: 'h', law: 'CMK' },
    { id: 'cmk291', label: 'Ceza — temyiz', ref: 'CMK 291', n: 2, u: 'h', law: 'CMK' },
    { id: 'iyuk7i', label: 'İdari dava açma (idare mahkemesi / Danıştay)', ref: 'İYUK 7', n: 60, u: 'g', law: 'İYUK' },
    { id: 'iyuk7v', label: 'Vergi mahkemesinde dava açma', ref: 'İYUK 7', n: 30, u: 'g', law: 'İYUK' },
    { id: 'hakim', label: 'Hâkimin verdiği süre', ref: 'HMK 90', n: 14, u: 'g', law: 'HAKIM', custom: true },
  ],
  UNIT: { g: 'gün', h: 'hafta', a: 'ay', y: 'yıl' },
  ruleLabel: (r) => `${r.label} (${r.ref}) — ${r.n} ${HKK.UNIT[r.u]}`,
  rule: (id) => HKK.RULES.find((r) => r.id === id),
  // Eski kayıtlardaki "Cevaba cevap (HMK 136)" gibi metinlerden kural bul
  ruleOf: (d) => HKK.rule(d.rule) || HKK.RULES.find((r) => String(d.kind || '').includes(r.ref)) || null,
  // Sabit tarihli resmî tatiller (2429 s. K. m.2) — bayramlar her yıl Ayarlar'dan girilir
  FIXED: ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'],
  list: (s) => String(s || '').split(/[\s,;]+/).map((x) => x.trim()).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
  /* Son gün hesabı. opt: { holidays:[YYYY-AA-GG], half:[arefe YYYY-AA-GG], urgent: adli tatilde görülen iş (HMK 103), n, u (hâkim süresi) }
     Döner: { date, steps:[gerekçe], warn:[uyarı] } — tarih yerel gün olarak hesaplanır (saat dilimi kayması yok) */
  due(served, rule, opt = {}) {
    const p = (x) => String(x).padStart(2, '0'); const iso = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const [Y, M, D] = String(served).split('-').map(Number); let d = new Date(Y, M - 1, D, 12);
    const n = Number(opt.n || rule.n); const u = opt.u || rule.u; const steps = []; const warn = [];
    if (u === 'g') d.setDate(d.getDate() + n);
    else if (u === 'h') d.setDate(d.getDate() + 7 * n);
    else { const add = u === 'a' ? n : 12 * n; const t = new Date(Y, M - 1 + add, 1, 12); const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(D, last)); d = t; }
    steps.push(`Tebliğ ${served}; ${n} ${HKK.UNIT[u]} → ${iso(d)}${u === 'g' ? ' (tebliğ günü sayılmaz)' : ' (karşılık gelen gün)'}`);
    // Adli tatil: 20 Temmuz – 31 Ağustos (HMK 102, CMK 331, İYUK 61)
    const y = d.getFullYear(); const inT = iso(d) >= `${y}-07-20` && iso(d) <= `${y}-08-31`;
    if (inT) {
      const ext = rule.law === 'HMK' ? (opt.urgent ? 0 : 7) : rule.law === 'CMK' ? 3 : rule.law === 'İYUK' ? 7 : 0;
      if (ext) { d = new Date(y, 7, 31 + ext, 12); steps.push(`Son gün adli tatile rastladı → tatilin bittiği 31 Ağustos'tan itibaren ${ext} gün uzar (${rule.law === 'HMK' ? 'HMK 104' : rule.law === 'CMK' ? 'CMK 331/4' : 'İYUK 8/3'}) → ${iso(d)}`); }
      else if (rule.law === 'İİK') steps.push('İcra süreleri adli tatilden etkilenmez (İİK’da adli tatil hükmü yok)');
      else if (rule.law === 'HMK' && opt.urgent) steps.push('Dosya adli tatilde görülen işlerden işaretli (HMK 103) → uzama yok');
      else if (rule.law === 'HAKIM') warn.push('Son gün adli tatile denk geliyor. Hâkimin verdiği sürede HMK 104 uzamasının uygulanıp uygulanmayacağını kontrol edin; program uzatmadı.');
    }
    const hol = new Set(opt.holidays || []); const half = new Set(opt.half || []);
    const off = (x) => x.getDay() === 0 || x.getDay() === 6 || HKK.FIXED.includes(iso(x).slice(5)) || hol.has(iso(x));
    const before = iso(d); let guard = 0; while (off(d) && guard++ < 30) d.setDate(d.getDate() + 1);
    if (before !== iso(d)) steps.push(`Son gün hafta sonu / resmî tatil → ilk iş günü ${iso(d)} (HMK 93, İİK 19, CMK 39, İYUK 8)`);
    const fin = iso(d);
    if (fin.slice(5) === '10-28' || half.has(fin)) warn.push('Son gün yarım gün tatile (13.00’ten itibaren) denk geliyor (2429 s. K.). Sürenin o gün mü bittiğini kontrol edin; dilekçeyi sabah verin.');
    const yrs = new Set([String(Y), fin.slice(0, 4)]); const missing = [...yrs].filter((yy) => ![...hol].some((h) => h.startsWith(yy)));
    if (missing.length) warn.push(`${missing.join(', ')} yılının bayram günleri Ayarlar'da girilmemiş; son gün bir bayrama denk geliyorsa kaydırılmadı.`);
    return { date: fin, steps, warn };
  },
  CASES: ['Alacak davası', 'İşçilik alacağı', 'Kira tespit', 'Tahliye', 'Boşanma (anlaşmalı)', 'Boşanma (çekişmeli)', 'Tazminat', 'İtirazın iptali', 'Tapu iptal ve tescil', 'Ortaklığın giderilmesi', 'Kambiyo senedi takibi', 'İlamsız icra takibi', 'Marka hükümsüzlüğü', 'Tüketici hakem itirazı'],
  COURTS: ['İstanbul Anadolu 4. Asliye Hukuk', 'İstanbul 12. İş Mahkemesi', 'İstanbul Anadolu 7. Sulh Hukuk', 'İstanbul 3. Aile Mahkemesi', 'İstanbul Anadolu 2. Asliye Ticaret', 'İstanbul 18. İcra Dairesi', 'İstanbul Anadolu 9. İcra Dairesi', 'Kartal 5. Asliye Ceza'],
  // Portal giriş kodu: her müvekkile rastgele 6 karakter (NS.portalCode, program açılınca eksik olanlara üretilir). Formülle türetilen eski kod kullanılmaz.
  code: (c) => c.portalCode || '',
  newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = new Uint8Array(6); crypto.getRandomValues(b); return [...b].map((x) => A[x % A.length]).join(''); },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Av. Selin Erdem Hukuk Bürosu', bizPhone: '0216 330 70 70', bizAddress: 'Kozyatağı, Bayar Cad. No:88 K:6, Kadıköy/İstanbul', baroNo: 'İstanbul Barosu 61234', hourly: 4500, iban: 'TR20 0006 7010 0000 0012 3456 78' };
    db.data.users = [{ id: 'u1', name: 'Av. Selin Erdem', role: 'admin', pin: '1234', active: true, lawyer: true }, { id: 'u2', name: 'Av. Kaan Uçar', role: 'avukat', pin: '1234', active: true, lawyer: true }, { id: 'u3', name: 'Stj. Av. Deniz Tekin', role: 'avukat', pin: '1234', active: true, lawyer: true }, { id: 'u4', name: 'Esra Sekreter', role: 'sekreter', pin: '1234', active: true }];
    db.data.clients = [['Yıldız İnşaat A.Ş.', 'kurumsal'], ['Mehmet Demir', 'bireysel'], ['Ayşe Kaya', 'bireysel'], ['Polat Gıda Ltd. Şti.', 'kurumsal'], ['Hasan Öztürk', 'bireysel'], ['Merve Yıldız', 'bireysel'], ['Kurt Lojistik A.Ş.', 'kurumsal'], ['Can Özdemir', 'bireysel'], ['Ebru Şen', 'bireysel'], ['Aksoy Tekstil Ltd. Şti.', 'kurumsal']].map(([name, type], i) => ({ id: 'k' + i, name, type, idNo: type === 'kurumsal' ? String(rand(1000000000, 9999999999)) : String(rand(10000000000, 69999999999)), phone: NS.phone(), email: `muvekkil${i}@ornek.com`, advance: 0, retainer: type === 'kurumsal' ? rand(15, 40) * 1000 : 0 }));
    const lawyers = ['Av. Selin Erdem', 'Av. Kaan Uçar', 'Stj. Av. Deniz Tekin'];
    db.data.files = Array.from({ length: 22 }, (_, i) => {
      const type = i % 5 === 3 ? 'icra' : i % 9 === 7 ? 'arabuluculuk' : i % 11 === 10 ? 'ceza' : 'dava';
      const cl = db.data.clients[i % 10]; const subj = type === 'icra' ? pick(['Kambiyo senedi takibi', 'İlamsız icra takibi']) : type === 'ceza' ? 'Dolandırıcılık (müşteki vekili)' : type === 'arabuluculuk' ? 'İşçilik alacağı (arabuluculuk)' : pick(HKK.CASES.slice(0, 10));
      const open = addDays(new Date(), -rand(30, 700));
      const st = type === 'icra' ? pick(['takip', 'takip', 'kesin']) : i % 7 === 6 ? pick(['karar', 'istinaf', 'yargitay']) : i % 13 === 12 ? 'kapali' : 'derdest';
      return { id: NS.uid(), no: `2026/${String(100 + i)}`, type, client: cl.id, subject: subj, court: type === 'icra' ? pick(HKK.COURTS.slice(5, 7)) : type === 'ceza' ? HKK.COURTS[7] : pick(HKK.COURTS.slice(0, 5)), esas: `${open.getFullYear()}/${rand(100, 999)} ${type === 'icra' ? 'E.' : 'Esas'}`, opponent: pick(['Beyaz Market Ltd.', 'Ali Koç', 'Öz Yapı Kooperatifi', 'Güneş Sigorta A.Ş.', 'Burak Güneş', 'Doruk Enerji A.Ş.', 'Selin Ateş']), role: pick(['Davacı', 'Davacı', 'Davalı']), lawyer: lawyers[i % 3], value: rand(5, 400) * 5000, fee: { type: i % 3 === 0 ? 'yuzde' : 'sabit', amount: i % 3 === 0 ? 15 : rand(30, 150) * 1000, paid: 0 }, status: st, opened: NS.iso(open), notes: [] };
    });
    db.data.files.forEach((f, i) => { f.fee.paid = f.fee.type === 'sabit' ? Math.round(f.fee.amount * (i % 4 === 1 ? 0.3 : 0.7)) : 0; });
    // Duruşmalar: önümüzdeki 30 gün + geçmiş
    db.data.hearings = [];
    db.data.files.filter((f) => ['derdest', 'istinaf'].includes(f.status) && f.type !== 'icra').forEach((f, i) => {
      const d = addDays(new Date(), [-40, -12, 0, 1, 2, 3, 6, 8, 9, 13, 15, 20, 27][i % 13] + (i > 12 ? 30 : 0));
      while ([0, 6].includes(d.getDay()) || ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'].includes(NS.iso(d).slice(5))) d.setDate(d.getDate() + 1);
      db.data.hearings.push({ id: NS.uid(), file: f.id, date: NS.iso(d), time: pick(['09:30', '10:00', '10:40', '11:20', '13:30', '14:10', '15:00']), kind: pick(['Ön inceleme', 'Tahkikat', 'Bilirkişi incelemesi', 'Tanık dinlenmesi', 'Karar duruşması']), note: '', done: d < new Date(new Date().toDateString()), result: d < new Date(new Date().toDateString()) ? 'Ara karar: bilirkişi raporu beklenecek, sonraki duruşma bildirildi' : '' });
    });
    db.data.deadlines = [['hmk136', 2], ['hmk345', 5], ['hmk281', 1], ['iik62', 9], ['hmk127', 12], ['hmk361', -1]].map(([rid, d], i) => { const r = HKK.rule(rid); const served = NS.iso(addDays(new Date(), d - (r.u === 'h' ? 7 * r.n : r.n))); const due = HKK.due(served, r, {}); return { id: NS.uid(), file: db.data.files[(i * 3) % 22].id, rule: rid, kind: HKK.ruleLabel(r), served, due: due.date, steps: due.steps, done: d < 0, note: d < 0 ? 'Dilekçe UYAP’tan gönderildi' : '' }; });
    db.data.files.forEach((f, i) => { f.urgent = /İşçilik/.test(f.subject) && f.role === 'Davacı'; });
    db.data.clients.forEach((c) => { c.portalCode = HKK.newCode(); });
    db.data.expenses = []; db.data.advances = [];
    db.data.files.forEach((f, i) => { const cl = f.client; const adv = rand(3, 15) * 1000; db.data.advances.push({ id: NS.uid(), client: cl, file: f.id, amount: adv, at: f.opened }); [['Başvuru / peşin harç', rand(800, 6000)], ['Tebligat gideri', rand(150, 700)], ...(i % 3 === 0 ? [['Bilirkişi ücreti', rand(3000, 9000)]] : [])].forEach(([t, a]) => db.data.expenses.push({ id: NS.uid(), file: f.id, client: cl, type: t, amount: a, at: f.opened })); });
    db.data.messages = [{ id: NS.uid(), client: 'k1', at: addDays(new Date(), -1).toISOString(), from: 'muvekkil', text: 'Duruşmaya benim de gelmem gerekiyor mu?' }];
    db.data.times = db.data.files.slice(0, 8).map((f, i) => ({ id: NS.uid(), file: f.id, at: NS.iso(addDays(new Date(), -i)), hours: [1, 1.5, 2, 0.5, 3][i % 5], desc: pick(['Dilekçe hazırlığı', 'Müvekkil görüşmesi', 'Duruşma', 'Dosya inceleme']), user: lawyers[i % 3] }));
  },
};
