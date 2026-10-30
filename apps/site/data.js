/* Site yönetimi demo verisi ve hesaplar — yönetim paneli ve sakin portalı kullanır */
window.SITE = {
  seed(db) {
    const { rand, pick, addDays, iso } = NS;
    db.data._settings = { bizName: 'Yeşilvadi Sitesi Yönetimi', bizPhone: '0216 555 90 90', bizAddress: 'Ataşehir, Yeşilvadi Sok. No:1', iban: 'TR55 0001 5001 5800 7300 1234 56', bank: 'Vakıfbank', baseDue: 1850, lateFee: 5, dueDay: 10, manager: 'Hakan Yılmaz', openingCash: 900000 };
    db.data.users = [{ id: 'u1', name: 'Hakan Yılmaz', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Sevgi Muhasebe', role: 'muhasebe', pin: '1234', active: true }, { id: 'u3', name: 'Ramazan Görevli', role: 'gorevli', pin: '1234', active: true }];
    const flats = [];
    ['A', 'B', 'C'].forEach((bl) => { for (let f = 1; f <= 6; f++) for (let k = 1; k <= 2; k++) { const no = (f - 1) * 2 + k; const m2 = pick([95, 110, 125, 140]); const owner = pick(NS.NAMES); const rented = Math.random() < 0.3; flats.push({ id: `${bl}${no}`, block: bl, no, floor: f, m2, share: m2, owner, ownerPhone: NS.phone(), tenant: rented ? pick(NS.NAMES) : '', tenantPhone: rented ? NS.phone() : '', dueOverride: null, cars: rand(0, 2), plate: rand(0, 1) ? `34 ${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))} ${rand(100, 999)}` : '' }); } });
    db.data.flats = flats;
    const dues = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m); const per = iso(d).slice(0, 7);
      flats.forEach((f) => {
        const amount = db.data._settings.baseDue + (f.m2 > 120 ? 250 : 0);
        const late = Math.random() < (m === 0 ? 0.55 : m === 1 ? 0.2 : 0.06);
        dues.push({ id: NS.uid(), flat: f.id, period: per, type: 'aidat', desc: `${NS.MONTHS[d.getMonth()]} ${d.getFullYear()} aidatı`, amount, paid: late ? 0 : amount, paidAt: late ? null : iso(addDays(d, rand(1, 15))) });
      });
    }
    // Olağanüstü gider dağıtımı örneği
    const ext = new Date(); ext.setMonth(ext.getMonth() - 2);
    const totalShare = flats.reduce((t, f) => t + f.share, 0);
    flats.forEach((f) => dues.push({ id: NS.uid(), flat: f.id, period: iso(ext).slice(0, 7), type: 'demirbas', desc: 'Asansör revizyonu payı', amount: Math.round(180000 * f.share / totalShare), paid: Math.random() < 0.7 ? Math.round(180000 * f.share / totalShare) : 0, paidAt: iso(ext) }));
    db.data.dues = dues;
    const cats = ['Elektrik (ortak alan)', 'Su (ortak alan)', 'Personel maaşı', 'Temizlik malzemesi', 'Asansör bakımı', 'Bahçe bakımı', 'Güvenlik', 'Sigorta', 'Kamera sistemi'];
    const exps = [];
    for (let m = 5; m >= 0; m--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m); [['Personel maaşı', 52000], ['Elektrik (ortak alan)', rand(7000, 12000)], ['Su (ortak alan)', rand(3000, 6000)], ['Asansör bakımı', 4500], ['Güvenlik', 38000], ['Temizlik malzemesi', rand(1500, 3500)], ['Bahçe bakımı', rand(2000, 6000)]].forEach(([cat, amount]) => exps.push({ id: NS.uid(), date: iso(addDays(d, rand(2, 25))) > NS.today() ? NS.today() : iso(addDays(d, rand(2, 25))), cat, desc: cat, amount, vendor: pick(['Enerjisa', 'İSKİ', 'Kone Asansör', 'Gardiyan Güvenlik', 'Yeşil Peyzaj', '-']) })); }
    exps.push({ id: NS.uid(), date: iso(ext), cat: 'Asansör bakımı', desc: 'Asansör revizyonu (olağanüstü)', amount: 180000, vendor: 'Kone Asansör' });
    db.data.expenses = exps;
    db.data.expCats = cats;
    db.data.announcements = [
      { id: 'n1', title: 'Olağan genel kurul toplantısı', text: 'Yıllık olağan genel kurul toplantımız ayın son cumartesi saat 14:00\'te sosyal tesis toplantı salonunda yapılacaktır. Katılımınızı rica ederiz.', date: iso(addDays(new Date(), -2)), pinned: true },
      { id: 'n2', title: 'Su kesintisi', text: 'İSKİ çalışması nedeniyle Perşembe günü 10:00-16:00 arası su kesintisi olacaktır.', date: iso(addDays(new Date(), -6)), pinned: false },
      { id: 'n3', title: 'Havuz sezonu kapandı', text: 'Havuzumuz bakım için kapatılmıştır. İyi kışlar dileriz.', date: iso(addDays(new Date(), -20)), pinned: false },
    ];
    db.data.requests = [
      { id: 'r1', flat: 'A5', title: 'Koridor lambası yanmıyor', desc: '3. kat koridor lambası yanmıyor.', status: 'acik', at: addDays(new Date(), -1).toISOString(), cat: 'Elektrik' },
      { id: 'r2', flat: 'B9', title: 'Otopark kapısı kumandası', desc: 'Yeni kumanda talep ediyorum.', status: 'islemde', at: addDays(new Date(), -3).toISOString(), cat: 'Genel' },
      { id: 'r3', flat: 'C2', title: 'Bahçe sulama', desc: 'C blok önü fıskiyeler çalışmıyor.', status: 'cozuldu', at: addDays(new Date(), -12).toISOString(), cat: 'Bahçe' },
    ];
  },
  // Son ödeme günü ayın gün sayısını aşamaz (31 → şubatta 28/29)
  dueDate(period, day) { const [y, m] = period.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return new Date(y, m - 1, Math.min(Number(day) || 10, last), 12); },
  // Gider paylaşımı — 634 KMK md. 20 (mevzuat.gov.tr/mevzuatmetin/1.5.634.htm, okundu 30.10.2026 — DOĞRULANDI): yönetim planında aksi yoksa
  // kapıcı, kaloriferci, bahçıvan, bekçi gibi görevlilerin giderleri eşit; sigorta, bakım, onarım, yönetici ücreti ve diğer giderler arsa payına göre.
  // Kuruş farkı kalmasın: toplam tam tutar çıkacak şekilde en büyük küsurlara dağıtılır.
  split(flats, total, mode) {
    const w = flats.map((f) => (mode === 'esit' ? 1 : mode === 'm2' ? Number(f.m2) || 0 : Number(f.share) || 0)); const W = w.reduce((a, b) => a + b, 0); if (!W) return null;
    const kr = Math.round(total * 100); const raw = w.map((x) => (kr * x) / W); const base = raw.map(Math.floor); let left = kr - base.reduce((a, b) => a + b, 0);
    raw.map((x, i) => [x - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } }); return Object.fromEntries(flats.map((f, i) => [f.id, base[i] / 100]));
  },
  // Daire borcu ve gecikme faizi
  debt(db, flatId) { return db.all('dues', (d) => d.flat === flatId).reduce((t, d) => t + (d.amount - (d.paid || 0)), 0); },
  // Gecikme tazminatı — 634 sayılı Kat Mülkiyeti Kanunu md. 20 (mevzuat.gov.tr/mevzuatmetin/1.5.634.htm, okundu 30.10.2026 — DOĞRULANDI):
  // "ödemede geciken günler için aylık yüzde beş". Gün bazında hesaplanır (1 ay = 30 gün kabul edildi); önceden tam ay sayılıyordu
  // (ilk ay hiç tazminat çıkmıyordu). Bileşik değildir; tahsil edilen tazminat (type 'faiz') tekrar tazminata girmez.
  lateFee(db, flatId) {
    const s = db.settings({ lateFee: 5, dueDay: 10 }); const now = new Date();
    return Math.round(db.all('dues', (d) => d.flat === flatId && d.amount > (d.paid || 0)).reduce((t, d) => { const due = SITE.dueDate(d.period, s.dueDay); const days = Math.max(0, Math.floor((now - due) / 864e5)); return t + (d.type === 'faiz' ? 0 : (d.amount - (d.paid || 0)) * (Number(s.lateFee) / 100) * days / 30); }, 0));
  },
};

/* Sakin portalı koleksiyonları (ortak alan rezervasyonu, ziyaretçi bildirimi, anketler) — eski kurulumlara da eksikse eklenir */
window.SITE.FAC = [
  { id: 'tenis', name: 'Tenis kortu', icon: 'award', slots: ['08:00', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00', '20:00'], max: 2 },
  { id: 'toplanti', name: 'Toplantı salonu', icon: 'users', slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], max: 4 },
  { id: 'barbeku', name: 'Barbekü alanı', icon: 'flask', slots: ['12:00', '15:00', '18:00'], max: 1 },
  { id: 'fitness', name: 'Fitness salonu (özel ders)', icon: 'dumbbell', slots: ['07:00', '08:00', '19:00', '20:00', '21:00'], max: 3 },
];
window.SITE.ensure = function (db) {
  let ch = false;
  if (!db.data.bookings) { db.data.bookings = []; ch = true; }
  if (!db.data.visitors) { db.data.visitors = []; ch = true; }
  if (!db.data.polls) {
    db.data.polls = [{ id: 'pl1', title: 'Site girişine elektrikli araç şarj istasyonu kurulsun mu?', options: ['Evet, kurulsun', 'Hayır', 'Fikrim yok'], votes: {}, until: NS.iso(NS.addDays(new Date(), 14)), active: true, at: new Date().toISOString() },
      { id: 'pl2', title: 'Havuz açılış saati ne olsun?', options: ['08:00', '09:00', '10:00'], votes: {}, until: NS.iso(NS.addDays(new Date(), 7)), active: true, at: new Date().toISOString() }];
    (db.data.flats || []).slice(0, 23).forEach((f, i) => { db.data.polls[0].votes[f.id] = i % 4 === 0 ? 1 : i % 7 === 0 ? 2 : 0; if (i % 2) db.data.polls[1].votes[f.id] = i % 3; });
    ch = true;
  }
  if (ch) db.save();
};
