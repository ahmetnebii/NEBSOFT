/* Servis & Okul Taşımacılığı — belge listeleri, tahakkuk hesapları ve örnek veri. Panel ve veli portalı kullanır.
   Çocuk verisi en aza indirilir: T.C. kimlik, fotoğraf, açık adres ve sağlık bilgisi alanı yoktur. */
window.SRV = {
  // Takip edilen belgeler: yazılım tarih hatırlatır, belgenin geçerliliğini onaylamaz
  VDOCS: [['izin', 'Özel izin belgesi'], ['yetki', 'Yetki belgesi / taşıt kartı'], ['sigorta', 'Yolcu mali sorumluluk sigortası'], ['muayene', 'Periyodik muayene'], ['bakim', 'Altı aylık bakım']],
  SDOCS: { sofor: [['ehliyet', 'Sürücü belgesi'], ['src', 'Mesleki yeterlilik'], ['egitim', 'Eğitim sertifikası'], ['rapor', 'Aile hekimi raporu'], ['psiko', 'Psikoteknik']], rehber: [['egitim', 'Eğitim sertifikası'], ['rapor', 'Aile hekimi raporu']] },
  DIR: { am: 'Sabah', pm: 'Akşam' },
  MARK: { bindi: ['Bindi', 'ok'], binmedi: ['Binmedi', 'err'], indi: ['İndi', 'info'] },
  MT: { sikayet: 'Şikâyet', talep: 'Talep', soru: 'Soru' },
  MST: { yeni: ['Yeni', 'warn'], islemde: ['İşlemde', 'info'], kapandi: ['Kapandı', 'ok'] },
  r2: (x) => Math.round((Number(x) || 0) * 100) / 100,
  period: (d) => String(d || new Date().toISOString()).slice(0, 7),
  periodName(p) { const [y, m] = String(p).split('-'); return `${['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][Number(m) - 1] || m} ${y}`; },
  tid: (date, route, dir) => `${date}|${route}|${dir}`,
  digits: (p) => String(p || '').replace(/\D/g, '').slice(-10),
  // Kardeş indirimi: aynı veli telefonundaki aktif ve ücretli ikinci öğrenciden itibaren
  // sib: telefon başına { n, first } dizini; binlerce kayıtta her satır için liste taranmaz
  sibMap(all) { const m = new Map(); (all || []).forEach((x) => { const k = SRV.digits(x.parentPhone); if (!k || x.active === false || x.free) return; const r = m.get(k); if (!r) m.set(k, { n: 1, first: x.id }); else { r.n++; if (String(x.id).localeCompare(String(r.first)) < 0) r.first = x.id; } }); return m; },
  feeOf(s, all, pct, sib) { const fee = Number(s.fee) || 0; if (s.free) return 0; if (!pct) return fee; const r = (sib || SRV.sibMap(all)).get(SRV.digits(s.parentPhone)); return r && r.n > 1 && r.first !== s.id ? SRV.r2(fee * (1 - pct / 100)) : fee; },
  // Bir ayın tahakkuku: aktif, ücretli, o ayda başlamış ve daha önce tahakkuk etmemiş öğrenciler
  accrue(students, fees, period, pct) {
    const has = new Set((fees || []).filter((f) => f.period === period).map((f) => f.student)); const sib = SRV.sibMap(students);
    return (students || []).filter((s) => s.active !== false && !has.has(s.id) && (!s.start || s.start.slice(0, 7) <= period)).map((s) => ({ student: s.id, period, amount: SRV.feeOf(s, students, pct, sib), paid: 0 })).filter((f) => f.amount > 0);
  },
  feeLeft: (f) => SRV.r2((Number(f.amount) || 0) - (Number(f.paid) || 0)),
  // Ayrılışta kalan ay: ayrılış ayından sonraki ödemeler iade, ödenmemiş sonraki tahakkuklar silinir
  leave(fees, student, period) { const later = (fees || []).filter((f) => f.student === student && f.period > period); return { refund: SRV.r2(later.reduce((s, f) => s + (Number(f.paid) || 0), 0)), remove: later.map((f) => f.id) }; },
  // Ödeme en eski borçtan başlayarak dağıtılır
  allocate(fees, student, amount) { let left = Number(amount) || 0; const out = []; (fees || []).filter((f) => f.student === student && SRV.feeLeft(f) > 0.001).sort((a, b) => a.period.localeCompare(b.period)).forEach((f) => { if (left <= 0.001) return; const x = Math.min(left, SRV.feeLeft(f)); out.push({ id: f.id, add: SRV.r2(x) }); left = SRV.r2(left - x); }); return { rows: out, rest: SRV.r2(left) }; },
  docState(date, today, days) { if (!date) return 'yok'; if (date < today) return 'bitti'; const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (days == null ? 30 : days)); return date <= d.toISOString().slice(0, 10) ? 'yakin' : 'tamam'; },
  // Tüm araç ve personel belgeleri: durum sırasına göre
  docRows(vehicles, staff, today, days) {
    const R = []; const add = (owner, ownerId, type, key, label, date) => R.push({ id: `${type}-${ownerId}-${key}`, owner, ownerId, type, key, label, date: date || '', state: SRV.docState(date, today, days) });
    (vehicles || []).forEach((v) => SRV.VDOCS.forEach(([k, l]) => add(v.plate, v.id, 'vehicles', k, l, (v.docs || {})[k])));
    (staff || []).forEach((s) => (SRV.SDOCS[s.kind] || []).forEach(([k, l]) => add(s.name, s.id, 'staff', k, l, (s.docs || {})[k])));
    const o = { bitti: 0, yakin: 1, yok: 2, tamam: 3 }; return R.sort((a, b) => o[a.state] - o[b.state] || a.date.localeCompare(b.date));
  },
  seats(route, vehicles) { const v = (vehicles || []).find((x) => x.id === route.vehicle); return v ? Number(v.seats) || 0 : 0; },
  load: (route, students) => { let n = 0; (students || []).forEach((s) => { if (s.route === route.id && s.active !== false) n++; }); return n; },
  // Sefer sonu: binen herkes işaretli mi, araç boş mu
  unmarked(list, trip) { return (list || []).filter((s) => !(trip.marks || {})[s.id]); },
  newCode: () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''),
  seed(db) {
    const { rand, pick, addDays } = NS; const iso = NS.iso; const fut = (a, b) => iso(addDays(new Date(), rand(a, b)));
    db.data._settings = { bizName: 'Güven Okul Servisleri', bizPhone: '0312 555 22 11', bizAddress: 'Yenimahalle, Ankara', siblingPct: 10, docDays: 30 };
    db.data.schools = ['Atatürk Ortaokulu', 'Cumhuriyet İlkokulu', 'Fatih Anadolu Lisesi'].map((name, i) => ({ id: 'sc' + i, name, phone: NS.phone() }));
    const D = (full) => ({ izin: fut(40, 300), yetki: fut(60, 300), sigorta: full ? fut(5, 25) : fut(60, 300), muayene: fut(30, 300), bakim: full ? fut(-6, -1) : fut(20, 170) });
    db.data.staff = [['Ramazan Ateş', 'sofor'], ['Kemal Şahin', 'sofor'], ['Yıldız Aslan', 'sofor'], ['Hatice Tan', 'rehber'], ['Sevgi Demir', 'rehber'], ['Meryem Koç', 'rehber']].map(([name, kind], i) => ({ id: 'st' + i, name, kind, phone: NS.phone(), docs: kind === 'sofor' ? { ehliyet: fut(100, 900), src: fut(100, 900), egitim: fut(100, 500), rapor: i === 1 ? fut(4, 20) : fut(60, 300), psiko: fut(100, 900) } : { egitim: fut(100, 500), rapor: fut(60, 300) } }));
    db.data.vehicles = [['06 ABC 101', 16, 'Ford Transit', 2021], ['06 DEF 202', 19, 'Mercedes Sprinter', 2020], ['06 GHI 303', 16, 'Volkswagen Crafter', 2022]].map(([plate, seats, model, year], i) => ({ id: 'v' + i, plate, seats, model, year, docs: D(i === 1) }));
    const STOPS = [['Batıkent Metro', 'Demetevler 5. Cadde', 'Yenimahalle Pazar', 'Şentepe Park'], ['Eryaman 3. Etap', 'Elvankent Çarşı', 'Sincan Yol Ayrımı'], ['Keçiören Bağlum', 'Etlik Kavşak', 'Aktepe Çarşı']];
    db.data.routes = STOPS.map((L, i) => ({ id: 'r' + i, name: `${i + 1} No'lu güzergâh`, kind: 'okul', school: 'sc' + (i % 3), vehicle: 'v' + i, driver: 'st' + i, hostess: 'st' + (i + 3), amStart: `07:${10 + i * 5}`, pmStart: '15:30', stops: L.map((name, k) => ({ id: `s${i}${k}`, name, am: `07:${String(15 + i * 5 + k * 8).padStart(2, '0')}`, pm: `15:${String(40 + k * 6).padStart(2, '0')}` })) }));
    db.data.routes.push({ id: 'r9', name: 'Fabrika vardiya hattı', kind: 'personel', corp: 'Başkent Plastik A.Ş.', corpFee: 68000, vehicle: 'v2', driver: 'st2', hostess: '', amStart: '06:30', pmStart: '17:15', stops: [{ id: 's90', name: 'Sincan Merkez', am: '06:40', pm: '17:25' }, { id: 's91', name: 'OSB Giriş', am: '07:05', pm: '17:50' }] });
    const G = ['1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf', '5. sınıf', '6. sınıf', '7. sınıf', '8. sınıf', '9. sınıf'];
    const per = SRV.period(); const months = [-1, 0].map((k) => { const d = new Date(); d.setDate(15); d.setMonth(d.getMonth() + k); return SRV.period(d.toISOString()); });
    const ST = []; NS.NAMES.slice(0, 36).forEach((n, i) => { const r = db.data.routes[i % 3]; const stop = pick(r.stops); const pp = i % 9 === 4 && ST[i - 1] ? ST[i - 1].parentPhone : NS.phone(); ST.push({ id: 'o' + i, name: n, grade: pick(G), school: r.school, route: r.id, stop: stop.id, parentName: `${pick(NS.NAMES).split(' ')[0]} ${n.split(' ')[1]}`, parentPhone: pp, fee: pick([2800, 3200, 3600]), active: true, portalCode: 'VELI' + String(1000 + i), free: i === 11, start: months[0] + '-01', consent: i % 6 === 5 ? null : { at: addDays(new Date(), -50).toISOString(), name: 'Veli', ver: 1 } }); });
    db.data.students = ST;
    const fees = []; months.forEach((p) => SRV.accrue(ST, fees, p, 10).forEach((f) => { const pd = p === per ? (Math.random() < 0.55 ? f.amount : 0) : (Math.random() < 0.9 ? f.amount : 0); fees.push({ ...f, id: `${f.student}|${p}`, paid: pd, paidAt: pd ? addDays(new Date(), -rand(1, 20)).toISOString() : null }); }));
    db.data.fees = fees; db.data.payments = fees.filter((f) => f.paid).map((f) => ({ id: NS.uid(), student: f.student, amount: f.paid, method: pick(['Havale', 'Nakit', 'Kredi kartı']), at: f.paidAt, period: f.period }));
    db.data.corpBills = [{ id: NS.uid(), route: 'r9', period: months[0], amount: 68000, paid: 68000 }, { id: NS.uid(), route: 'r9', period: months[1], amount: 68000, paid: 0 }];
    const today = iso(new Date()); const trips = [];
    for (let d = 14; d >= 0; d--) { const date = iso(addDays(new Date(), -d)); const wk = new Date(date + 'T12:00:00').getDay(); if (wk === 0 || wk === 6) continue; ['am', 'pm'].forEach((dir) => db.data.routes.slice(0, 3).forEach((r) => { if (date === today && dir === 'pm') return; const start = new Date(`${date}T${dir === 'am' ? r.amStart : r.pmStart}:00`); if (start > new Date()) return; const late = rand(0, 12); const marks = {}; ST.filter((s) => s.route === r.id).forEach((s) => { marks[s.id] = Math.random() < 0.93 ? (dir === 'am' ? 'bindi' : 'indi') : 'binmedi'; }); const st = new Date(start.getTime() + late * 6e4); trips.push({ id: SRV.tid(date, r.id, dir), date, route: r.id, dir, startAt: st.toISOString(), lateMin: late, endAt: new Date(st.getTime() + 45 * 6e4).toISOString(), marks, emptied: true, by: 'Şoför' }); })); }
    db.data.trips = trips;
    db.data.absences = [{ id: NS.uid(), student: 'o2', date: today, dir: 'am', note: 'Doktor randevusu', source: 'portal', at: new Date().toISOString() }];
    db.data.notices = [{ id: NS.uid(), at: addDays(new Date(), -3).toISOString(), title: 'Ara tatil programı', text: 'Ara tatilde servis çalışmayacaktır.', route: '' }];
    db.data.messages = [{ id: NS.uid(), student: 'o7', type: 'sikayet', text: 'Sabah servis üç gündür geç geliyor.', status: 'yeni', at: addDays(new Date(), -1).toISOString(), source: 'portal' }, { id: NS.uid(), student: 'o15', type: 'talep', text: 'Durağımızı değiştirmek istiyoruz.', status: 'islemde', at: addDays(new Date(), -4).toISOString(), source: 'portal', answer: 'Güzergâh planını kontrol ediyoruz.' }];
    db.data.changes = []; db.data.sms = [];
    db.data.users = [{ id: 'u1', name: 'Ayhan Güven', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Ofis Görevlisi', role: 'ofis', pin: '1234', active: true }, { id: 'u3', name: 'Ramazan Ateş', role: 'sofor', pin: '1234', active: true, staffId: 'st0' }];
  },
};
