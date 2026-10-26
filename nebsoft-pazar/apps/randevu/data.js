/* Randevu demo verisi ve ortak hesaplar — panel ve online randevu sayfası kullanır */
window.RANDEVU = {
  seed(db) {
    const { rand, pick, addDays, iso } = NS;
    db.data._settings = { bizName: 'Bella Güzellik & Kuaför', bizPhone: '0212 444 55 66', bizAddress: 'Nişantaşı, Abdi İpekçi Cad. No:40 Şişli/İstanbul', open: '09:00', close: '20:00', slot: 15, autoConfirm: false, reminderHours: 24, smsTemplate: 'Sayın {musteri}, {tarih} saat {saat} {hizmet} randevunuzu hatırlatırız. {isletme}', bookingNote: 'Randevunuza 10 dakika önce gelmenizi rica ederiz.', cancelHours: 12, slug: 'bella-guzellik' };
    db.data.users = [
      { id: 'u1', name: 'Nur Yönetici', role: 'admin', pin: '1234', active: true },
      { id: 'u2', name: 'Cansu Resepsiyon', role: 'resepsiyon', pin: '1234', active: true },
      { id: 'u3', name: 'Ayşe Kaya', role: 'personel', pin: '1234', active: true, staff: 's1' },
    ];
    const H = (a, b) => ({ start: a, end: b });
    const week = (sun) => ({ 0: sun ? H('11:00', '18:00') : null, 1: H('09:00', '19:00'), 2: H('09:00', '19:00'), 3: H('09:00', '19:00'), 4: H('09:00', '19:00'), 5: H('09:00', '20:00'), 6: H('09:00', '20:00') });
    db.data.staff = [
      { id: 's1', name: 'Ayşe Kaya', title: 'Kıdemli Kuaför', color: '#e11d48', hours: week(true), commission: 30, phone: '0532 100 20 30' },
      { id: 's2', name: 'Mert Arslan', title: 'Kuaför', color: '#2563eb', hours: week(false), commission: 25, phone: '0533 200 30 40' },
      { id: 's3', name: 'Selin Erdem', title: 'Estetisyen', color: '#9333ea', hours: week(false), commission: 25, phone: '0534 300 40 50' },
      { id: 's4', name: 'Derya Aksoy', title: 'Manikür & Pedikür', color: '#059669', hours: week(true), commission: 35, phone: '0535 400 50 60' },
    ];
    const S = (id, name, cat, duration, price, staff, desc = '') => ({ id, name, cat, duration, price, staff, desc, online: true, color: '' });
    db.data.services = [
      S('h1', 'Kadın Saç Kesimi', 'Saç', 45, 600, ['s1', 's2'], 'Yıkama ve fön dahil'), S('h2', 'Erkek Saç Kesimi', 'Saç', 30, 350, ['s2']), S('h3', 'Fön', 'Saç', 30, 300, ['s1', 's2']),
      S('h4', 'Saç Boyama', 'Saç', 120, 1800, ['s1']), S('h5', 'Röfle / Balyaj', 'Saç', 150, 2600, ['s1']), S('h6', 'Keratin Bakımı', 'Saç', 180, 3500, ['s1', 's2']),
      S('h7', 'Klasik Cilt Bakımı', 'Cilt', 60, 1200, ['s3'], 'Derinlemesine temizlik ve maske'), S('h8', 'Hydrafacial', 'Cilt', 75, 2200, ['s3']), S('h9', 'Kaş Alımı', 'Cilt', 15, 150, ['s3', 's4']),
      S('h10', 'Lazer Epilasyon (Bölge)', 'Epilasyon', 30, 900, ['s3']), S('h11', 'Manikür', 'El & Ayak', 45, 450, ['s4']), S('h12', 'Pedikür', 'El & Ayak', 60, 550, ['s4']),
      S('h13', 'Kalıcı Oje', 'El & Ayak', 60, 650, ['s4']), S('h14', 'Gelin Başı', 'Özel', 120, 4500, ['s1'], 'Prova dahil'),
    ];
    db.data.customers = NS.NAMES.slice(0, 26).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), email: NS.slug(n).replace('-', '.') + '@mail.com', birthday: `19${rand(70, 99)}-${NS.pad(rand(1, 12))}-${NS.pad(rand(1, 28))}`, notes: i % 6 === 0 ? 'Boya alerjisi var — test yapılmalı' : '', tags: i % 4 === 0 ? ['VIP'] : [], created: addDays(new Date(), -rand(30, 400)).toISOString() }));
    db.data.customers[2].birthday = `1990-${NS.pad(new Date().getMonth() + 1)}-${NS.pad(Math.min(28, new Date().getDate() + 2))}`;
    const apps = [];
    const slotFree = (staff, date, start, dur) => !apps.some((a) => a.staff === staff && a.date === date && a.status !== 'iptal' && RANDEVU.toMin(a.start) < start + dur && start < RANDEVU.toMin(a.start) + a.duration);
    for (let d = -30; d <= 14; d++) {
      const date = iso(addDays(new Date(), d));
      const dow = new Date(date).getDay();
      db.data.staff.forEach((st) => {
        const h = st.hours[dow]; if (!h) return;
        const n = rand(2, d === 0 ? 7 : 6);
        for (let k = 0; k < n; k++) {
          const sv = pick(db.data.services.filter((s) => s.staff.includes(st.id)));
          const start = RANDEVU.toMin(h.start) + rand(0, Math.floor((RANDEVU.toMin(h.end) - RANDEVU.toMin(h.start) - sv.duration) / 15)) * 15;
          if (!slotFree(st.id, date, start, sv.duration)) continue;
          const past = d < 0 || (d === 0 && start + sv.duration < new Date().getHours() * 60 + new Date().getMinutes());
          const status = past ? (Math.random() < 0.08 ? 'gelmedi' : Math.random() < 0.05 ? 'iptal' : 'tamam') : Math.random() < 0.8 ? 'onay' : 'bekliyor';
          apps.push({ id: NS.uid(), date, start: RANDEVU.toHM(start), duration: sv.duration, staff: st.id, service: sv.id, customer: pick(db.data.customers).id, price: sv.price, status, paid: status === 'tamam', payType: status === 'tamam' ? pick(['kart', 'kart', 'nakit']) : null, source: pick(['telefon', 'online', 'online', 'salon']), note: '', created: addDays(new Date(date), -rand(1, 10)).toISOString() });
        }
      });
    }
    const blockDay = iso(addDays(new Date(), 1));
    db.data.appointments = apps.filter((a) => !(a.staff === 's2' && a.date === blockDay && RANDEVU.toMin(a.start) < 15 * 60 && RANDEVU.toMin(a.start) + a.duration > 13 * 60));
    db.data.packages = [
      { id: 'p1', customer: 'c1', service: 'h10', total: 8, used: 3, price: 5600, expires: iso(addDays(new Date(), 200)), created: addDays(new Date(), -60).toISOString() },
      { id: 'p2', customer: 'c4', service: 'h7', total: 6, used: 5, price: 6000, expires: iso(addDays(new Date(), 40)), created: addDays(new Date(), -90).toISOString() },
      { id: 'p3', customer: 'c7', service: 'h8', total: 4, used: 1, price: 7200, expires: iso(addDays(new Date(), 120)), created: addDays(new Date(), -20).toISOString() },
    ];
    db.data.blocks = [{ id: 'b1', staff: 's2', date: iso(addDays(new Date(), 1)), start: '13:00', end: '15:00', reason: 'Doktor randevusu' }];
    db.data.sms = [];
    db.data.expenses = [];
  },
  toMin: (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + (m || 0); },
  toHM: (min) => `${NS.pad(Math.floor(min / 60))}:${NS.pad(min % 60)}`,
  // Personelin belirli günde boş başlangıç saatleri
  freeSlots(db, staffId, date, duration, ignoreId) {
    const st = db.get('staff', staffId); if (!st) return [];
    const h = st.hours[new Date(date + 'T12:00').getDay()]; if (!h) return [];
    const s = db.settings({ slot: 15 });
    const busy = [
      ...db.all('appointments', (a) => a.staff === staffId && a.date === date && !['iptal'].includes(a.status) && a.id !== ignoreId).map((a) => [RANDEVU.toMin(a.start), RANDEVU.toMin(a.start) + a.duration]),
      ...db.all('blocks', (b) => b.staff === staffId && b.date === date).map((b) => [RANDEVU.toMin(b.start), RANDEVU.toMin(b.end)]),
    ];
    const out = [];
    const nowMin = date === NS.today() ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
    for (let t = RANDEVU.toMin(h.start); t + duration <= RANDEVU.toMin(h.end); t += s.slot || 15) {
      if (t <= nowMin) continue;
      if (!busy.some(([a, b]) => t < b && a < t + duration)) out.push(RANDEVU.toHM(t));
    }
    return out;
  },
};

/* Online randevu sayfası görselleri (doğrulanmış Unsplash): hizmet adına göre, yoksa kategoriye göre; hizmete photo (URL) girilirse o kullanılır */
window.RANDEVU.photo = function (sv, w = 400) {
  if (sv && /^https?:/.test(sv.photo || '')) return sv.photo;
  const n = String((sv && sv.name) || '').toLocaleLowerCase('tr-TR');
  const K = [[/erkek|sakal|tıraş/, '1585747860715-2ba37e788b70'], [/boya|röfle|balyaj|keratin|bakım/, '1522337360788-8b13dee7a37e'], [/fön|maşa|topuz/, '1580618672591-eb180b1a973f'], [/kesim/, '1562322140-8baeececf3df'], [/gelin|makyaj/, '1487412947147-5cebf100ffc2'], [/kaş|kirpik/, '1487412947147-5cebf100ffc2'],
    [/hydra|cilt/, '1570172619644-dfd03ed5d881'], [/lazer|epilasyon|ağda|masaj/, '1544161515-4ab6ce6db874'], [/pedikür/, '1540555700478-4be289fbecef'], [/oje|protez|tırnak/, '1604654894610-df63bc536371'], [/manikür/, '1519014816548-bf5fe059798b']];
  const C = { Saç: '1562322140-8baeececf3df', Cilt: '1570172619644-dfd03ed5d881', Epilasyon: '1544161515-4ab6ce6db874', 'El & Ayak': '1519014816548-bf5fe059798b', Özel: '1487412947147-5cebf100ffc2' };
  const k = K.find(([re]) => re.test(n)); const id = (k && k[1]) || C[sv && sv.cat] || '1560066984-138dadb4c035';
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&q=70&auto=format&fit=crop`;
};
window.RANDEVU.COVER = ['1560066984-138dadb4c035', '1595476108010-b4d1f102b1b1', '1600948836101-f9ffda59d250', '1633681926022-84c23e8cb2d6', '1516975080664-ed2fc6a32937', '1522337360788-8b13dee7a37e'];
