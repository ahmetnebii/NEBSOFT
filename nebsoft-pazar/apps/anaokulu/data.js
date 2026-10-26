/* Anaokulu & Kreş — sınıflar, günlük rapor seçenekleri, demo verisi. Panel ve veli portalı kullanır. */
window.ANK = {
  MEALS: { kahvalti: 'Kahvaltı', ogle: 'Öğle yemeği', ikindi: 'İkindi' },
  EAT: { hepsi: ['Hepsini yedi', 'ok'], yarisi: ['Yarısını yedi', 'warn'], az: ['Az yedi', 'warn'], yemedi: ['Yemedi', 'err'] },
  MOOD: { mutlu: ['😊', 'Mutlu'], sakin: ['🙂', 'Sakin'], yorgun: ['😴', 'Yorgun'], huzursuz: ['😟', 'Huzursuz'] },
  // Portal giriş kodu: işletme 'portal bilgisini gönder' dediğinde rastgele kod üretilir (NS.portalCode); yoksa eski formül
  code: (s) => s.portalCode || String(s.parents[0].phone || '').replace(/\D/g, '').slice(-4) + s.id.replace(/\W/g, '').slice(-2).toUpperCase(),
  age: (b) => { const d = new Date(b); const n = new Date(); let y = n.getFullYear() - d.getFullYear(); let m = n.getMonth() - d.getMonth(); if (m < 0) { y--; m += 12; } return `${y} yaş ${m} ay`; },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Minik Adımlar Anaokulu', bizPhone: '0216 600 11 22', bizAddress: 'Ataşehir, Barbaros Mah. Lale Sok. No:5, İstanbul', fee: 18500, siblingDisc: 10, dueDay: 5, iban: 'TR44 0001 0017 4500 0000 0011 22' };
    db.data.users = [{ id: 'u1', name: 'Zeynep Müdür', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Elif Öğretmen', role: 'ogretmen', pin: '1234', active: true, cls: 's1' }, { id: 'u3', name: 'Seda Öğretmen', role: 'ogretmen', pin: '1234', active: true, cls: 's2' }, { id: 'u4', name: 'Muhasebe', role: 'muhasebe', pin: '1234', active: true }];
    db.data.classes = [{ id: 's1', name: 'Papatyalar', age: '2-3 yaş', teacher: 'Elif Öğretmen', color: '#f59e0b', nap: true }, { id: 's2', name: 'Kelebekler', age: '3-4 yaş', teacher: 'Seda Öğretmen', color: '#ec4899', nap: true }, { id: 's3', name: 'Yıldızlar', age: '4-5 yaş', teacher: 'Gizem Öğretmen', color: '#6366f1', nap: false }, { id: 's4', name: 'Gökkuşağı', age: '5-6 yaş', teacher: 'Derya Öğretmen', color: '#10b981', nap: false }];
    const kids = ['Ada', 'Ali', 'Defne', 'Yusuf', 'Zeynep', 'Eymen', 'Asel', 'Ömer', 'Elif', 'Kerem', 'Mira', 'Aras', 'Lina', 'Göktuğ', 'Nehir', 'Çınar', 'Duru', 'Mert', 'Ela', 'Atlas', 'Masal', 'Poyraz', 'İpek', 'Kuzey', 'Azra', 'Deniz', 'Ece', 'Emir'];
    const sur = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Arslan', 'Koç', 'Aydın', 'Öztürk', 'Yıldız', 'Kurt', 'Polat', 'Doğan', 'Kılıç'];
    db.data.students = kids.map((n, i) => { const cls = db.data.classes[i % 4]; const ageY = 2 + (i % 4); const s = sur[Math.floor(i / 2) % sur.length]; return { id: 'o' + i, name: `${n} ${s}`, cls: cls.id, birth: NS.iso(addDays(new Date(), -(ageY * 365 + rand(30, 330)))), gender: i % 2 ? 'Erkek' : 'Kız', parents: [{ name: `${pick(['Ayşe', 'Merve', 'Burcu', 'Selin', 'Ebru'])} ${s}`, rel: 'Anne', phone: NS.phone() }, { name: `${pick(['Murat', 'Emre', 'Can', 'Burak', 'Onur'])} ${s}`, rel: 'Baba', phone: NS.phone() }], pickup: i % 3 === 0 ? [{ name: `${pick(['Fatma', 'Hatice'])} ${s}`, rel: 'Babaanne', phone: NS.phone() }] : [], allergy: i % 7 === 2 ? 'Fıstık alerjisi' : i % 9 === 4 ? 'Laktoz intoleransı' : '', health: i % 11 === 5 ? 'Astım — inhaler çantasında' : '', service: i % 3 !== 1 ? (i % 2 ? 'r1' : 'r2') : '', fee: 18500, disc: i % 8 === 1 ? 10 : 0, start: NS.iso(addDays(new Date(), -rand(40, 400))) }; });
    db.data.routes = [{ id: 'r1', name: 'Servis 1 — Ataşehir / Kozyatağı', driver: 'Hakan Bey', hostess: 'Nur Hanım', plate: '34 SRV 101', phone: NS.phone() }, { id: 'r2', name: 'Servis 2 — Ümraniye / Çekmeköy', driver: 'Ramazan Bey', hostess: 'Gül Hanım', plate: '34 SRV 102', phone: NS.phone() }];
    // Son 10 iş günü yoklama ve günlük rapor
    db.data.att = {}; db.data.reports = {};
    for (let d = 14; d >= 0; d--) {
      const day = addDays(new Date(), -d); if ([0, 6].includes(day.getDay())) continue; const k = NS.iso(day);
      db.data.students.forEach((s, i) => {
        const absent = (i + d) % 13 === 0; db.data.att[`${s.id}|${k}`] = absent ? { st: 'yok', note: pick(['Hasta', 'İzinli', 'Ailevi']) } : { st: 'var', in: `08:${String(rand(5, 55)).padStart(2, '0')}`, out: d === 0 ? '' : `${pick(['16', '17', '17', '18'])}:${String(rand(0, 55)).padStart(2, '0')}`, by: d === 0 ? '' : pick([s.parents[0].name, s.parents[1].name, ...(s.pickup.map((x) => x.name))]) };
        if (absent || (d === 0 && i % 3 === 0)) return;
        const cls = db.data.classes.find((c) => c.id === s.cls);
        db.data.reports[`${s.id}|${k}`] = { kahvalti: pick(['hepsi', 'hepsi', 'yarisi', 'az']), ogle: pick(['hepsi', 'hepsi', 'yarisi', 'yemedi']), ikindi: d === 0 ? '' : pick(['hepsi', 'yarisi']), sleep: cls.nap ? `${pick(['12:45', '13:00', '13:15'])}–${pick(['14:15', '14:30', '15:00'])}` : '', mood: pick(['mutlu', 'mutlu', 'sakin', 'yorgun', 'huzursuz']), toilet: ageY(s) < 3 ? `${rand(2, 4)} bez` : '', note: pick(['Bugün parmak boyası etkinliğinde çok eğlendi.', 'Arkadaşlarıyla blok oyununda kule yaptı.', 'Bahçede top oynadı, enerjisi yüksekti.', 'Hikâye saatinde soruları cevapladı.', '']), photos: rand(0, 4), by: cls.teacher };
      });
    }
    function ageY(s) { return Math.floor((Date.now() - new Date(s.birth)) / (365 * 864e5)); }
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    db.data.menu = days.map((d, i) => ({ id: 'm' + i, day: d, kahvalti: ['Haşlanmış yumurta, peynir, zeytin, tam buğday ekmek, süt', 'Omlet, domates, salatalık, ekmek, ıhlamur', 'Peynirli tost, havuç, süt', 'Simit, beyaz peynir, bal, süt', 'Menemen, ekmek, meyve çayı'][i], ogle: ['Mercimek çorbası, tavuklu pilav, yoğurt', 'Sebzeli köfte, bulgur pilavı, ayran', 'Kuru fasulye, pirinç pilavı, turşusuz salata', 'Fırın makarna, yoğurtlu ıspanak', 'Tavuk sote, patates püresi, cacık'][i], ikindi: ['Elma, kraker', 'Ev yapımı kek, süt', 'Muz, yoğurt', 'Meyve tabağı', 'Mısır patlağı, ayran'][i] }));
    db.data.posts = [{ id: NS.uid(), at: addDays(new Date(), -1).toISOString(), title: 'Cumhuriyet Bayramı gösterisi', body: '28 Ekim Çarşamba 14:00\'te bahçede gösterimiz var. Tüm velilerimizi bekliyoruz. Kırmızı-beyaz kıyafet giydirmenizi rica ederiz.', cls: '' }, { id: NS.uid(), at: addDays(new Date(), -3).toISOString(), title: 'Kelebekler sınıfı — müze gezisi', body: 'Perşembe günü Oyuncak Müzesi gezimiz var. İzin formunu portaldan onaylamayı unutmayın.', cls: 's2' }, { id: NS.uid(), at: addDays(new Date(), -6).toISOString(), title: 'Grip salgını hakkında', body: 'Ateşi 38 derecenin üzerinde olan çocuklarımızı lütfen okula göndermeyelim.', cls: '' }];
    // Aidat: son 3 ay
    db.data.fees = []; db.data.payments = [];
    for (let k = -2; k <= 0; k++) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + k); const per = NS.iso(d).slice(0, 7); db.data.students.forEach((s, i) => { const amt = Math.round(s.fee * (1 - (s.disc || 0) / 100)); db.data.fees.push({ id: NS.uid(), student: s.id, period: per, amount: amt }); if (k < 0 || i % 4 !== 0) if (!(k === -1 && i % 9 === 3)) db.data.payments.push({ id: NS.uid(), student: s.id, amount: amt, at: NS.iso(addDays(d, rand(1, 8))), method: pick(['Havale', 'Kredi kartı', 'Havale']) }); }); }
    db.data.messages = [{ id: NS.uid(), student: 'o1', at: addDays(new Date(), 0).toISOString(), from: 'veli', text: 'Ali bugün öğleden sonra 15:00\'te babaannesiyle çıkacak.', type: 'alma' }, { id: NS.uid(), student: 'o5', at: addDays(new Date(), -1).toISOString(), from: 'veli', text: 'Yarın doktor kontrolü var, gelmeyecek.', type: 'izin' }];
  },
};
