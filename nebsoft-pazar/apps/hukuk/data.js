/* Hukuk Bürosu — dosya türleri, süre hesabı, demo verisi. Panel ve müvekkil portalı kullanır.
   Süre hesabı yardımcıdır; kesin süreyi avukat ilgili kanun ve tebliğ tarihine göre kontrol eder. */
window.HKK = {
  TYPES: { dava: 'Dava', icra: 'İcra takibi', danismanlik: 'Danışmanlık', arabuluculuk: 'Arabuluculuk', ceza: 'Ceza' },
  ST: { derdest: ['Derdest', 'info'], karar: ['Karar çıktı', 'acc'], istinaf: ['İstinafta', 'warn'], yargitay: ['Yargıtay\'da', 'warn'], takip: ['Takipte', 'info'], kesin: ['Kesinleşti', 'ok'], kapali: ['Kapandı', ''] },
  // Sık kullanılan süreler (gün / hafta) — HMK, İİK, CMK
  DEADLINES: [['Cevap dilekçesi (HMK 127)', 14], ['Cevaba cevap / ikinci cevap (HMK 136)', 14], ['İstinaf (HMK 345)', 14], ['Temyiz (HMK 361)', 14], ['İcra takibine itiraz (İİK 62)', 7], ['Ödeme emrine itiraz — kambiyo (İİK 168)', 5], ['İtirazın iptali davası (İİK 67)', 365], ['Ceza istinaf (CMK 273)', 14], ['Bilirkişi raporuna itiraz (HMK 281)', 14], ['Tanık listesi / delil süresi', 14]],
  CASES: ['Alacak davası', 'İşçilik alacağı', 'Kira tespit', 'Tahliye', 'Boşanma (anlaşmalı)', 'Boşanma (çekişmeli)', 'Tazminat', 'İtirazın iptali', 'Tapu iptal ve tescil', 'Ortaklığın giderilmesi', 'Kambiyo senedi takibi', 'İlamsız icra takibi', 'Marka hükümsüzlüğü', 'Tüketici hakem itirazı'],
  COURTS: ['İstanbul Anadolu 4. Asliye Hukuk', 'İstanbul 12. İş Mahkemesi', 'İstanbul Anadolu 7. Sulh Hukuk', 'İstanbul 3. Aile Mahkemesi', 'İstanbul Anadolu 2. Asliye Ticaret', 'İstanbul 18. İcra Dairesi', 'İstanbul Anadolu 9. İcra Dairesi', 'Kartal 5. Asliye Ceza'],
  // Adli tatil (20 Temmuz – 31 Ağustos): tatile denk gelen süreler tatilin bitiminden itibaren 1 hafta uzar (HMK 104)
  addDays(from, days, opt = {}) {
    const d = new Date(from + 'T12:00'); d.setDate(d.getDate() + days);
    const y = d.getFullYear(); const start = new Date(y, 6, 20), end = new Date(y, 7, 31, 23);
    if (opt.adli !== false && d >= start && d <= end) { const n = new Date(y, 8, 7, 12); return { date: NS.iso(n), note: 'Adli tatile denk geldi → 7 Eylül' }; }
    // Hafta sonu / sabit tarihli resmi tatil → ilk iş günü (dini bayramlar yıla göre Ayarlar'dan eklenir)
    const OFF = ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29', ...(opt.holidays || [])];
    const off = (x) => x.getDay() === 0 || x.getDay() === 6 || OFF.includes(NS.iso(x).slice(5)) || OFF.includes(NS.iso(x));
    while (off(d)) d.setDate(d.getDate() + 1);
    return { date: NS.iso(d), note: '' };
  },
  // Portal giriş kodu: işletme 'portal bilgisini gönder' dediğinde rastgele kod üretilir (NS.portalCode); yoksa eski formül
  code: (c) => c.portalCode || String(c.idNo || '').slice(-4) + c.id.replace(/\W/g, '').slice(-2).toUpperCase(),
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
    db.data.deadlines = [['Cevaba cevap (HMK 136)', 2], ['İstinaf (HMK 345)', 5], ['Bilirkişi raporuna itiraz (HMK 281)', 1], ['İcra takibine itiraz (İİK 62)', 9], ['Tanık listesi / delil süresi', 12], ['Temyiz (HMK 361)', -1]].map(([kind, d], i) => ({ id: NS.uid(), file: db.data.files[(i * 3) % 22].id, kind, served: NS.iso(addDays(new Date(), d - 14)), due: NS.iso(addDays(new Date(), d)), done: d < 0, note: d < 0 ? 'Dilekçe UYAP\'tan gönderildi' : '' }));
    db.data.expenses = []; db.data.advances = [];
    db.data.files.forEach((f, i) => { const cl = f.client; const adv = rand(3, 15) * 1000; db.data.advances.push({ id: NS.uid(), client: cl, file: f.id, amount: adv, at: f.opened }); [['Başvuru / peşin harç', rand(800, 6000)], ['Tebligat gideri', rand(150, 700)], ...(i % 3 === 0 ? [['Bilirkişi ücreti', rand(3000, 9000)]] : [])].forEach(([t, a]) => db.data.expenses.push({ id: NS.uid(), file: f.id, client: cl, type: t, amount: a, at: f.opened })); });
    db.data.messages = [{ id: NS.uid(), client: 'k1', at: addDays(new Date(), -1).toISOString(), from: 'muvekkil', text: 'Duruşmaya benim de gelmem gerekiyor mu?' }];
    db.data.times = db.data.files.slice(0, 8).map((f, i) => ({ id: NS.uid(), file: f.id, at: NS.iso(addDays(new Date(), -i)), hours: [1, 1.5, 2, 0.5, 3][i % 5], desc: pick(['Dilekçe hazırlığı', 'Müvekkil görüşmesi', 'Duruşma', 'Dosya inceleme']), user: lawyers[i % 3] }));
  },
};
