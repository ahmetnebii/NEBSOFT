/* NEBSOFT Yönetim Merkezi — sabitler ve örnek veri (işletmeler, lisanslar, kullanıcılar, tahsilatlar, destek, olay geçmişi) */
window.YON = (function () {
  'use strict';
  const { iso, addDays, rand, pick, uid } = NS;
  const C = window.CATALOG;
  const PLANS = { 0: { name: 'Başlangıç', users: 2, branches: 1, devices: 2 }, 1: { name: 'Profesyonel', users: 10, branches: 3, devices: 6 }, 2: { name: 'Kurumsal', users: 999, branches: 99, devices: 99 } };
  const TST = { aktif: ['Aktif', 'ok'], deneme: ['Deneme', 'info'], askida: ['Askıda', 'err'], kapali: ['Kapalı', ''] };
  const LST = { aktif: ['Aktif', 'ok'], deneme: ['Deneme', 'info'], askida: ['Askıda', 'err'], iptal: ['İptal', ''], 'suresi-doldu': ['Süresi doldu', 'err'], 'odeme-bekliyor': ['Ödeme bekliyor', 'warn'] };
  const UROLES = { sahip: 'İşletme sahibi', yonetici: 'Yönetici', muhasebe: 'Muhasebe', personel: 'Personel' };
  const SECTORS = ['Market', 'Restoran', 'Kafe', 'Kuaför', 'Güzellik merkezi', 'Diş kliniği', 'Veteriner', 'Otel', 'Rent a car', 'Spor salonu', 'Kurs', 'Teknik servis', 'Emlak', 'Site yönetimi', 'Eczane', 'E-ticaret', 'Pazaryeri satıcısı', 'Butik / giyim', 'Oto servis', 'Toptancı', 'Kuyumcu', 'Oto galeri', 'Hukuk bürosu', 'Anaokulu', 'Kargo', 'Fabrika', 'Muhasebe bürosu', 'Organizasyon'];
  const SEC_PID = { Market: 'pos', Restoran: 'adisyon', Kafe: 'adisyon', Kuaför: 'randevu', 'Güzellik merkezi': 'randevu', 'Diş kliniği': 'klinik', Veteriner: 'veteriner', Otel: 'otel', 'Rent a car': 'kiralama', 'Spor salonu': 'spor', Kurs: 'kurs', 'Teknik servis': 'servis', Emlak: 'emlak', 'Site yönetimi': 'site', Eczane: 'eczane', 'E-ticaret': 'eticaret', 'Pazaryeri satıcısı': 'pazaryeri', 'Butik / giyim': 'butik', 'Oto servis': 'otoservis', Mobilya: 'mobilya', 'Okul servisi': 'okulservisi', Kooperatif: 'ciftci', Lastikçi: 'lastik', Toptancı: 'toptan', Kuyumcu: 'kuyumcu', 'Oto galeri': 'galeri', 'Hukuk bürosu': 'hukuk', Anaokulu: 'anaokulu', Kargo: 'kargo', Fabrika: 'fabrika', 'Muhasebe bürosu': 'musavir', Organizasyon: 'bilet' };
  const code4 = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  const licKey = (pid) => `NEB-${String(pid).toUpperCase().slice(0, 4).padEnd(4, 'X')}-${code4()}-${code4()}-${code4()}`;
  const prod = (pid) => (pid === 'bundle' ? { id: 'bundle', name: 'Hepsi Bir Arada', prices: [1999, 3999, 7999], icon: 'layers', accent: '#4f46e5' } : C.products.find((p) => p.id === pid) || { id: pid, name: pid, prices: [0, 0, 0], icon: 'box', accent: '#64748b' });
  const price = (pid, plan, period) => prod(pid).prices[plan] * (period === 'yillik' ? 10 : 1);

  function seed(db) {
    const d = db.data; const D = (n) => addDays(new Date(), n);
    d._settings = { bizName: 'NEBSOFT Yazılım A.Ş.', bizPhone: '0850 555 00 34', bizAddress: 'Maslak, Büyükdere Cad. No:255 Sarıyer/İstanbul', taxNo: '6310457289', taxOffice: 'Maslak', supportPhone: '0850 555 00 34', trialDays: 14, graceDays: 7, warnDays: 30, autoSuspend: true, maxFailedPin: 5, sessionHours: 12 };
    d.users = [
      { id: 'a1', name: 'NEBSOFT Yönetici', role: 'admin', pin: '1234', active: true },
      { id: 'a2', name: 'Selin Satış', role: 'satis', pin: '1234', active: true },
      { id: 'a3', name: 'Murat Destek', role: 'destek', pin: '1234', active: true },
      { id: 'a4', name: 'Aylin Finans', role: 'finans', pin: '1234', active: true },
    ];
    d.resellers = [['Anadolu Bilişim', 'Ankara', 20], ['Ege Yazılım Çözümleri', 'İzmir', 25], ['Marmara POS Sistemleri', 'Bursa', 20]].map(([name, city, pct], i) => ({ id: 'b' + i, name, city, pct, phone: NS.phone(), email: 'bayi@' + NS.slug(name).split('-')[0] + '.com', active: true }));
    const names = ['Yıldız Market', 'Lezzet Durağı Restoran', 'Kahve Köşesi', 'Makas Kuaför', 'Ayna Güzellik', 'Gülümse Diş Kliniği', 'Pati Veteriner', 'Mavi Koy Otel', 'Yol Arkadaşı Rent a Car', 'FitLife Spor', 'Başarı Kurs Merkezi', 'Hızlı Teknik Servis', 'Kent Emlak', 'Yeşilvadi Sitesi', 'Şifa Eczanesi', 'Moda Butik Online', 'Ekspres Kurye', 'Ege Bisküvi Fabrikası', 'Atlas Mali Müşavirlik', 'Sahne Organizasyon', 'Bereket Gıda Market', 'Köz Kebap', 'Lavanta Kafe', 'Asil Berber', 'Vita Klinik', 'Dostlar Pet Klinik', 'Sahil Pansiyon', 'Hedef Etüt'];
    const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Eskişehir', 'Trabzon', 'Muğla', 'Kocaeli'];
    d.tenants = names.map((n, i) => {
      const sector = i < 20 ? SECTORS[i] : pick(['Market', 'Restoran', 'Kafe', 'Kuaför', 'Diş kliniği', 'Veteriner', 'Otel', 'Kurs']);
      const created = D(-rand(20, 400));
      return { id: 't' + i, code: 'NB-' + (1001 + i), name: n + (i % 3 === 0 ? ' Ltd. Şti.' : i % 3 === 1 ? '' : ' A.Ş.'), type: i % 3 === 0 ? 'ltd' : i % 3 === 1 ? 'sahis' : 'as', sector, city: cities[i % cities.length], district: pick(['Merkez', 'Çankaya', 'Kadıköy', 'Karşıyaka', 'Nilüfer', 'Muratpaşa']), address: '', taxNo: String(rand(1000000000, 9999999999)), taxOffice: pick(['Kadıköy', 'Çankaya', 'Konak', 'Nilüfer', 'Muratpaşa']), contact: NS.NAMES[i % NS.NAMES.length], phone: NS.phone(), email: 'info@' + NS.slug(n).split('-').slice(0, 2).join('') + '.com.tr', reseller: i % 4 === 0 ? pick(['b0', 'b1', 'b2']) : '', status: i === 6 ? 'askida' : i >= 25 ? 'deneme' : i === 13 ? 'kapali' : 'aktif', created: created.toISOString(), tags: i % 5 === 0 ? ['VIP'] : i % 7 === 0 ? ['Çok şubeli'] : [], branches: i % 7 === 0 ? rand(2, 5) : 1, notes: [], apiKeys: i % 6 === 0 ? [{ id: uid(), key: 'nk_live_' + Math.random().toString(36).slice(2, 18), label: 'Muhasebe aktarımı', created: created.toISOString(), last: D(-rand(0, 5)).toISOString(), active: true }] : [] };
    });
    d.accounts = []; d.licenses = []; d.payments = [];
    d.tenants.forEach((t, i) => {
      const n = t.status === 'deneme' ? 1 : rand(1, 6);
      for (let k = 0; k < n; k++) { const nm = NS.NAMES[(i * 3 + k + 7) % NS.NAMES.length]; d.accounts.push({ id: uid(), tenant: t.id, name: nm, email: NS.slug(nm).replace('-', '.') + '@' + t.email.split('@')[1], phone: NS.phone(), role: k === 0 ? 'sahip' : pick(['yonetici', 'personel', 'personel', 'muhasebe']), status: i === 9 && k === 1 ? 'kilitli' : k === 3 ? 'pasif' : 'aktif', twoFA: k === 0 && i % 2 === 0, failed: i === 9 && k === 1 ? 5 : 0, created: t.created, lastLogin: t.status === 'kapali' ? null : D(-rand(0, 9)).toISOString(), products: [] }); }
      const pids = [SEC_PID[t.sector] || 'pos', ...(i % 4 === 0 ? ['muhasebe'] : []), ...(i % 9 === 0 ? ['crm'] : [])];
      pids.forEach((pid, j) => {
        const plan = t.status === 'deneme' ? 1 : i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1; const period = i % 3 === 1 ? 'yillik' : 'aylik';
        const start = t.status === 'deneme' ? D(-rand(1, 10)) : new Date(t.created);
        let end = new Date(start); if (t.status === 'deneme') end = addDays(start, 14); else { while (end < D(rand(-6, 40))) end.setMonth(end.getMonth() + (period === 'yillik' ? 12 : 1)); }
        const lid = uid(); const pl = PLANS[plan];
        d.licenses.push({ id: lid, key: licKey(pid), tenant: t.id, pid, plan, period, start: start.toISOString(), end: end.toISOString(), status: t.status === 'askida' ? 'askida' : t.status === 'deneme' ? 'deneme' : t.status === 'kapali' ? 'iptal' : i === 11 && j === 0 ? 'odeme-bekliyor' : 'aktif', price: price(pid, plan, period), maxUsers: pl.users, branches: t.branches, maxDevices: pl.devices, devices: Array.from({ length: Math.min(pl.devices, rand(1, 3)) }, (_, q) => ({ id: uid(), name: pick(['Kasa-1', 'Kasa-2', 'Ofis PC', 'Tablet', 'Laptop', 'Resepsiyon']), device: pick(['Chrome · Windows', 'Edge · Windows', 'Safari · iOS', 'Chrome · Android']), first: start.toISOString(), last: D(-rand(0, 6)).toISOString() })), autoRenew: i % 4 !== 2, grace: 7, features: { ebelge: plan > 0, entegrasyon: plan > 0, api: plan === 2, cokSube: plan === 2 }, src: 'panel', history: [{ at: start.toISOString(), what: t.status === 'deneme' ? 'Deneme lisansı oluşturuldu' : 'Lisans oluşturuldu', by: 'Selin Satış' }] });
        // Geçmiş tahsilatlar
        if (t.status !== 'deneme') { let p = new Date(start); let no = 0; while (p < new Date() && no < 14) { d.payments.push({ id: uid(), no: 'TH' + (26000 + d.payments.length), tenant: t.id, license: lid, pid, amount: price(pid, plan, period) * 1.2, net: price(pid, plan, period), at: p.toISOString(), method: pick(['kart', 'kart', 'havale', 'otomatik']), status: 'odendi', invoice: 'NEB2026' + String(100 + d.payments.length).padStart(9, '0') }); p = new Date(p); p.setMonth(p.getMonth() + (period === 'yillik' ? 12 : 1)); no++; } }
      });
    });
    const pend = d.licenses.find((l) => l.status === 'odeme-bekliyor'); if (pend) d.payments.push({ id: uid(), no: 'TH' + (26000 + d.payments.length), tenant: pend.tenant, license: pend.id, pid: pend.pid, amount: pend.price * 1.2, net: pend.price, at: D(-2).toISOString(), method: 'havale', status: 'bekliyor', invoice: '' });
    d.tickets = [
      ['t0', 'Fiş yazıcı Türkçe karakter sorunu', 'yuksek', 'acik', 'pos'], ['t3', 'Online randevu sayfasında logo değişmiyor', 'normal', 'islemde', 'randevu'], ['t7', 'Booking rezervasyonları gelmiyor', 'acil', 'acik', 'otel'], ['t14', 'MEDULA provizyon hatası', 'acil', 'islemde', 'eczane'], ['t17', 'İş emri maliyeti yanlış hesaplanıyor', 'yuksek', 'acik', 'fabrika'], ['t1', 'Mutfak ekranı yenilenmiyor', 'normal', 'kapali', 'adisyon'], ['t18', 'e-Fatura gelen kutusu boş', 'normal', 'cozuldu', 'muhasebe'],
    ].map(([tenant, subject, prio, status, pid], i) => ({ id: 'dt' + i, no: 'DST' + (5001 + i), tenant, subject, prio, status, pid, assignee: pick(['a3', 'a3', 'a2']), created: D(-rand(0, 12)).toISOString(), messages: [{ from: 'musteri', text: subject + ' — yardımcı olabilir misiniz?', at: D(-rand(1, 12)).toISOString() }, ...(status !== 'acik' ? [{ from: 'destek', text: 'Kaydınızı aldık, uzaktan bağlantı ile kontrol ediyoruz.', at: D(-rand(0, 1)).toISOString(), by: 'Murat Destek' }] : [])] }));
    d.announcements = [{ id: 'an1', title: 'Yeni: e-Belge merkezi', body: 'e-Fatura, e-Arşiv ve e-İrsaliye artık tek ekranda. Menüden "e-Belgeler" sayfasına göz atın.', level: 'info', products: [], tenants: [], active: true, until: iso(D(20)), created: D(-1).toISOString() }];
    d.maintenance = {};
    d.notesLog = [];
    // Merkezi olay geçmişi (son 30 gün) — yalnızca boşsa oluşturulur
    let au = []; try { au = JSON.parse(localStorage.getItem('nebsoft:audit') || '[]'); } catch (e) { au = []; }
    if (au.length < 50) {
      const acts = { pos: ['Satış', 'İade', 'Alış faturası', 'Kasa açılışı', 'Z raporu'], adisyon: ['Adisyon açıldı', 'Adisyon kapandı', 'Mutfağa gönderildi', 'İkram', 'Masa birleştirildi'], randevu: ['Randevu oluşturuldu', 'Randevu tamamlandı', 'SMS gönderildi'], muhasebe: ['Satış faturası', 'Tahsilat', 'Ödeme', 'e-Fatura'], otel: ['Check-in', 'Check-out', 'Rezervasyon'], eczane: ['Reçeteli satış', 'Depo siparişi'], fabrika: ['Mal kabul', 'İş emri', 'Sevkiyat', 'Kalite kararı'] };
      const devs = ['Chrome · Windows', 'Edge · Windows', 'Safari · iOS', 'Chrome · Android'];
      d.tenants.filter((t) => t.status !== 'kapali').forEach((t) => {
        const us = d.accounts.filter((a) => a.tenant === t.id); const pid = SEC_PID[t.sector] || 'pos'; const list = acts[pid] || ['Kayıt oluşturuldu', 'Kayıt güncellendi', 'Rapor alındı'];
        for (let day = 0; day < 30; day++) {
          if (Math.random() < 0.25) continue;
          us.forEach((u) => {
            if (u.status !== 'aktif' || Math.random() < 0.3) return;
            const base = D(-day); base.setHours(rand(8, 11), rand(0, 59)); const dev = pick(devs); const sidv = Math.random().toString(36).slice(2, 10);
            const push = (h, action, type, level, detail) => { const at = new Date(base.getTime() + h * 3600000); if (at > new Date()) return; au.push({ id: uid(), at: at.toISOString(), app: pid, tenant: t.id, tenantName: t.name, user: u.name, role: u.role, type, action, detail: detail || '', level: level || 'bilgi', device: dev, sid: sidv }); };
            push(0, 'Oturum açıldı', 'oturum');
            for (let k = 0; k < rand(2, 9); k++) push(rand(1, 80) / 10, pick(list), 'islem', 'bilgi', pick(['', '#' + rand(1000, 9999), NS.money(rand(100, 9000))]));
            if (Math.random() < 0.08) push(rand(2, 7), pick(['Kayıt silindi', 'Fatura iptal edildi', 'Ürün silindi']), 'silme', 'uyari');
            if (Math.random() < 0.05) push(rand(2, 7), 'Ayarlar güncellendi', 'ayar');
            push(rand(85, 100) / 10, 'Oturum kapatıldı', 'oturum');
          });
        }
      });
      // Güvenlik olayları: art arda hatalı PIN, mesai dışı giriş, toplu silme
      const t9 = d.tenants[9]; const lk = d.accounts.find((a) => a.tenant === t9.id && a.status === 'kilitli');
      if (lk) for (let k = 0; k < 6; k++) { const at = D(-1); at.setHours(23, 40 + k); au.push({ id: uid(), at: at.toISOString(), app: 'spor', tenant: t9.id, tenantName: t9.name, user: lk.name, role: lk.role, type: 'oturum', action: 'Hatalı PIN denemesi', detail: lk.name, level: 'uyari', device: 'Chrome · Android', sid: 'bf1' }); }
      const t2 = d.tenants[2]; const at3 = D(-2); at3.setHours(3, 14); au.push({ id: uid(), at: at3.toISOString(), app: 'adisyon', tenant: t2.id, tenantName: t2.name, user: d.accounts.find((a) => a.tenant === t2.id).name, role: 'sahip', type: 'oturum', action: 'Oturum açıldı', detail: 'Mesai dışı', level: 'bilgi', device: 'Safari · iOS', sid: 'ng1' });
      const t4 = d.tenants[4]; const u4 = d.accounts.find((a) => a.tenant === t4.id); for (let k = 0; k < 14; k++) { const at = D(-3); at.setHours(18, 5 + k); au.push({ id: uid(), at: at.toISOString(), app: 'randevu', tenant: t4.id, tenantName: t4.name, user: u4.name, role: u4.role, type: 'silme', action: 'Kayıt silindi', detail: 'Müşteri kartı', level: 'uyari', device: 'Chrome · Windows', sid: 'dl1' }); }
      au.sort((a, b) => b.at.localeCompare(a.at));
      try { localStorage.setItem('nebsoft:audit', JSON.stringify(au.slice(0, 6000))); } catch (e) { /* kota */ }
    }
  }
  return { seed, PLANS, TST, LST, UROLES, SECTORS, SEC_PID, prod, price, licKey };
})();
