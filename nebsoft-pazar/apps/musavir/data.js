/* Mali Müşavir Bürosu — beyanname türleri, son gün kuralları, demo verisi. Panel ve mükellef portalı kullanır.
   Son günler genel kuraldır; GİB'in uzatma/değişiklik duyurularına göre Ayarlar'dan güncellenebilir. */
window.MSV = {
  T: {
    kdv: { name: 'KDV-1', day: 28, color: '#2563eb', who: (c) => c.kdv === 'aylik' },
    kdv3: { name: 'KDV-1 (3 aylık)', day: 28, months: [1, 4, 7, 10], color: '#2563eb', who: (c) => c.kdv === 'uc' },
    muhsgk: { name: 'Muhtasar ve Prim Hizmet', day: 26, color: '#7c3aed', who: (c) => c.staff > 0 || c.type === 'serbest' },
    babs: { name: 'Form Ba-Bs', day: 'son', color: '#0891b2', who: (c) => c.defter === 'bilanco' },
    damga: { name: 'Damga Vergisi', day: 26, color: '#64748b', who: (c) => c.type !== 'sahis' },
    gecici: { name: 'Geçici Vergi', day: 17, months: [5, 8, 11], color: '#ea580c', who: () => true },
    edefter: { name: 'e-Defter Berat', day: 'son', lag: 3, color: '#16a34a', who: (c) => c.edefter },
    yillik: { name: 'Yıllık Gelir Vergisi', day: 31, months: [3], color: '#db2777', who: (c) => c.type === 'sahis' || c.type === 'serbest' },
    kurumlar: { name: 'Kurumlar Vergisi', day: 30, months: [4], color: '#be123c', who: (c) => ['ltd', 'as'].includes(c.type) },
  },
  ST: { bekliyor: ['Bekliyor', ''], evrak: ['Evrak bekleniyor', 'warn'], hazirlaniyor: ['Hazırlanıyor', 'info'], verildi: ['Verildi', 'ok'], odendi: ['Verildi + ödendi', 'ok'] },
  TYPES: { sahis: 'Şahıs (işletme)', serbest: 'Serbest meslek', ltd: 'Limited şirket', as: 'Anonim şirket' },
  DOCS: ['Satış faturaları', 'Alış faturaları', 'Banka ekstresi', 'POS / Z raporları', 'Personel puantaj', 'Kasa / gider fişleri'],
  // Dönem: "2026-09" → son gün (ayın 28'i gibi ya da ayın son günü), beyan bir sonraki ay verilir
  due(type, period) {
    const t = MSV.T[type]; const [y, m] = period.split('-').map(Number);
    const lag = t.lag || 1; const d = new Date(y, m - 1 + lag, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const day = t.day === 'son' ? last : Math.min(t.day, last);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },
  // Takvim ayı için verilmesi gereken beyannameler: [{type, period}]
  forMonth(c, ym) {
    const [y, m] = ym.split('-').map(Number); const prev = new Date(y, m - 2, 1); const pp = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const out = [];
    Object.entries(MSV.T).forEach(([k, t]) => {
      if (!t.who(c)) return;
      if (t.months) { if (t.months.includes(m)) out.push({ type: k, period: ['gecici', 'kdv3'].includes(k) ? pp : String(y - 1) }); return; }
      if (t.lag) { const p3 = new Date(y, m - 1 - t.lag, 1); out.push({ type: k, period: `${p3.getFullYear()}-${String(p3.getMonth() + 1).padStart(2, '0')}` }); return; }
      out.push({ type: k, period: pp });
    });
    return out.map((x) => ({ ...x, due: x.period.length === 4 || x.type === 'kdv3' ? `${y}-${String(m).padStart(2, '0')}-${String(MSV.T[x.type].day).padStart(2, '0')}` : MSV.due(x.type, x.period) }));
  },
  code: (c) => String(c.vkn).slice(-4) + c.id.replace(/\W/g, '').slice(-2).toUpperCase(),
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Akın Mali Müşavirlik', bizPhone: '0312 444 20 26', bizAddress: 'Kızılay, Atatürk Bulvarı No:112 K:4, Çankaya/Ankara', smmNo: '06.123456', docDay: 10, iban: 'TR33 0001 2009 4520 0058 0001 26' };
    db.data.users = [{ id: 'u1', name: 'Hakan Akın SMMM', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Burcu Stajyer', role: 'personel', pin: '1234', active: true }, { id: 'u3', name: 'Emre Muhasebe', role: 'personel', pin: '1234', active: true }];
    const C = [['Yıldız Kırtasiye', 'sahis', 'isletme', 'aylik', 1, 2500], ['Kaya İnşaat Ltd. Şti.', 'ltd', 'bilanco', 'aylik', 14, 9500], ['Dr. Selin Erdem', 'serbest', 'serbest', 'aylik', 1, 3000], ['Polat Gıda A.Ş.', 'as', 'bilanco', 'aylik', 28, 16000], ['Avcı Oto Kuaför', 'sahis', 'isletme', 'aylik', 2, 2800], ['Mimar Burak Güneş', 'serbest', 'serbest', 'aylik', 0, 2600], ['Aksoy Tekstil Ltd. Şti.', 'ltd', 'bilanco', 'aylik', 9, 8500], ['Tekin Kafe', 'sahis', 'isletme', 'aylik', 4, 3200], ['Çelik Lojistik Ltd. Şti.', 'ltd', 'bilanco', 'aylik', 22, 12500], ['Av. Esra Polat', 'serbest', 'serbest', 'aylik', 1, 2800], ['Doğan Elektrik', 'sahis', 'isletme', 'uc', 0, 2000], ['Kurt Yazılım A.Ş.', 'as', 'bilanco', 'aylik', 11, 11000], ['Ateş Emlak', 'sahis', 'isletme', 'aylik', 1, 2200], ['Özkan Market', 'sahis', 'bilanco', 'aylik', 6, 4800]];
    db.data.clients = C.map(([name, type, defter, kdv, staff, fee], i) => ({ id: 'm' + i, name, type, defter, kdv, staff, fee, edefter: defter === 'bilanco', vkn: String(rand(1000000000, 9999999999)), taxOffice: pick(['Kavaklıdere', 'Maltepe', 'Çankaya', 'Ostim', 'Yenimahalle']), contact: NS.NAMES[(i * 3) % 30], phone: NS.phone(), email: `muhasebe${i}@ornek.com.tr`, since: NS.iso(addDays(new Date(), -rand(120, 2500))), note: i === 3 ? 'Yabancı ortak var — transfer fiyatlandırması formu' : '' }));
    // Son 3 ay + bu ay için beyannameler
    const now = new Date(); const filings = [];
    for (let k = -3; k <= 1; k++) {
      const d = new Date(now.getFullYear(), now.getMonth() + k, 1); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      db.data.clients.forEach((c) => MSV.forMonth(c, ym).forEach((x) => {
        const past = x.due < NS.today();
        const st = past ? (Math.random() < 0.9 ? 'odendi' : 'verildi') : x.due <= NS.iso(addDays(now, 6)) ? pick(['hazirlaniyor', 'evrak', 'verildi', 'bekliyor']) : pick(['bekliyor', 'bekliyor', 'evrak', 'hazirlaniyor']);
        const amt = { kdv3: rand(0, 20) * 1000, kdv: rand(0, 60) * 1000 * (c.type === 'as' ? 4 : 1), muhsgk: c.staff * rand(7, 11) * 1000, damga: rand(1, 9) * 100, gecici: rand(5, 90) * 1000, babs: 0, edefter: 0, yillik: rand(10, 80) * 1000, kurumlar: rand(40, 400) * 1000 }[x.type];
        filings.push({ id: NS.uid(), client: c.id, ...x, status: st, amount: ['verildi', 'odendi'].includes(st) ? amt : null, user: pick(['Hakan Akın SMMM', 'Burcu Stajyer', 'Emre Muhasebe']), at: ['verildi', 'odendi'].includes(st) ? NS.iso(addDays(new Date(x.due), -rand(0, 6))) : null });
      }));
    }
    db.data.filings = filings;
    // Bu ay ve geçen ayın evrak durumu
    db.data.docs = {};
    [-2, -1].forEach((k) => { const d = new Date(now.getFullYear(), now.getMonth() + k, 1); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; db.data.clients.forEach((c, i) => { db.data.docs[`${c.id}|${ym}`] = MSV.DOCS.map((x, j) => (k < -1 ? 'geldi' : (i + j) % 4 === 0 ? 'yok' : (i + j) % 5 === 1 ? 'eksik' : 'geldi')).reduce((o, s, j) => ({ ...o, [MSV.DOCS[j]]: s }), {}); }); });
    // Aylık ücret tahakkukları ve tahsilatlar
    db.data.fees = []; db.data.payments = [];
    for (let k = -5; k <= 0; k++) { const d = new Date(now.getFullYear(), now.getMonth() + k, 1); const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; db.data.clients.forEach((c, i) => { db.data.fees.push({ id: NS.uid(), client: c.id, period: ym, amount: c.fee, smm: k < 0 ? 'SM' + ym.replace('-', '') + String(i).padStart(3, '0') : null }); if (k < -1 || (k === -1 && i % 4 !== 1)) db.data.payments.push({ id: NS.uid(), client: c.id, amount: c.fee, at: NS.iso(addDays(d, rand(32, 45))), method: pick(['Havale', 'Havale', 'Nakit', 'Kredi kartı']) }); }); }
    db.data.messages = [{ id: NS.uid(), client: 'm1', at: addDays(now, -1).toISOString(), from: 'mukellef', text: 'Ekim alış faturalarını portala yükledim, banka ekstresi yarın gelir.' }, { id: NS.uid(), client: 'm4', at: addDays(now, -2).toISOString(), from: 'mukellef', text: 'Yeni personel başlıyor, işe giriş bildirgesi için evraklar ektedir.' }];
    db.data.tasks = [{ id: NS.uid(), client: 'm3', title: 'Transfer fiyatlandırması formu hazırla', due: NS.iso(addDays(now, 12)), done: false }, { id: NS.uid(), client: 'm8', title: 'SGK teşvik kontrolü (6111)', due: NS.iso(addDays(now, 3)), done: false }, { id: NS.uid(), client: 'm1', title: 'Hakediş faturası tevkifat kontrolü', due: NS.iso(addDays(now, 1)), done: false }];
  },
};
