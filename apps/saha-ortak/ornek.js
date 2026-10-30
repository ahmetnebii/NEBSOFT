/* Saha programlarının ortak örnek verisi. Panel ve müşteri sayfası aynı tohumu kullanır. Tutarlar yalnız örnektir. */
window.SAHA_ORNEK = {
  // o: { biz, ekipler:[[ad, üyeler, uzmanlık]], hizmetler:[[ad, fiyat, kat, kontrol]], stok:[[ad, kat, birim, alış, satış, stok]], ayar, roller }
  temel(db, o) {
    const NS = window.NS; const H = window.SAHA_HESAP;
    db.data._settings = { bizName: o.biz, bizPhone: '0216 444 10 20', bizAddress: 'Ataşehir, İstanbul', vat: 20, planDays: 45, ...(o.ayar || {}) };
    db.data.users = [{ id: 'u1', name: 'Selin Aksoy', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Burak Ofis', role: 'ofis', pin: '1234', active: true }, { id: 'u3', name: 'Saha Hesabı', role: 'ekip', team: 't0', pin: '1234', active: true }];
    db.data.teams = o.ekipler.map(([name, members, skill], i) => ({ id: 't' + i, name, members, skill, phone: NS.phone(), active: true }));
    db.data.services = o.hizmetler.map(([name, price, cat, checks], i) => ({ id: 's' + i, name, price, cat, checks: checks || '' }));
    db.data.items = (o.stok || []).map(([name, cat, unit, cost, price, stock], i) => ({ id: 'i' + i, name, cat, unit, cost, price, stock, min: 3, ...(o.stokEk ? o.stokEk(i) : {}) }));
    const ilce = ['Kadıköy', 'Ataşehir', 'Üsküdar', 'Maltepe', 'Kartal', 'Beşiktaş', 'Şişli', 'Bakırköy'];
    db.data.customers = NS.NAMES.slice(0, 22).map((n, i) => ({ id: 'c' + i, name: i % 5 === 4 ? `${n.split(' ')[1] || n} Apartmanı` : n, phone: NS.phone(), email: '', kind: i % 5 === 4 ? 'Kurumsal' : 'Bireysel', taxNo: '', address: `${ilce[i % ilce.length]} ${10 + i}. Sokak No:${i + 1}` }));
    db.data.jobs = []; db.data.contracts = []; db.data.invoices = []; db.data.sms = [];
    const bu = NS.today(); // UTC değil: gece yarısından sonra bugünkü işler dün sayılmasın
    return { bu, H, NS, ek: (n) => H.ekle(bu, n), is: (r) => { const sira = db.data.jobs.length; const c = db.data.customers[r.c !== undefined ? r.c : sira % db.data.customers.length]; const at = `${r.date || bu}T08:00:00.000Z`; const st = r.status || 'planli'; delete r.c; const j = { id: 'j' + sira, no: db.nextNo('jobs', o.on || 'IS'), code: H.kod(), customer: c.id, addr: c.address, duration: 120, team: 't' + (sira % o.ekipler.length), lines: [], payments: [], checks: [], date: bu, created: at, status: st, log: [{ at, status: st, note: 'Kayıt açıldı' }], ...r }; db.data.jobs.push(j); return j; } };
  },
};
