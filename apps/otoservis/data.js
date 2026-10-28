/* Oto Servis & Sanayi — iş emri durumları, demo verisi. Panel ve müşteri onay sayfası kullanır. */
window.OTS = {
  ST: { kabul: ['Araç kabul', 'info', 'car'], teshis: ['Arıza tespit', 'warn', 'search'], onay: ['Müşteri onayı bekliyor', 'warn', 'clock'], islemde: ['Tamirde', 'acc', 'wrench'], hazir: ['Teslime hazır', 'ok', 'check'], teslim: ['Teslim edildi', '', 'check'] },
  FLOW: ['kabul', 'teshis', 'onay', 'islemde', 'hazir', 'teslim'],
  BRANDS: { Renault: ['Clio', 'Megane', 'Taliant'], Fiat: ['Egea', 'Doblo', 'Fiorino'], Volkswagen: ['Passat', 'Golf', 'Polo', 'Caddy'], Ford: ['Focus', 'Fiesta', 'Courier', 'Transit'], Toyota: ['Corolla', 'C-HR', 'Yaris'], Hyundai: ['i20', 'Accent', 'Tucson'], Opel: ['Astra', 'Corsa'], Dacia: ['Duster', 'Sandero'] },
  token: (j) => (j.id.replace(/\W/g, '').slice(-6) + j.no.replace(/\D/g, '')).toUpperCase(),
  totals(j) {
    const ls = (j.items || []).filter((i) => i.approved !== false);
    const lt = (i) => i.qty * i.price * (1 - (Number(i.disc) || 0) / 100);
    const parca = ls.filter((i) => i.type === 'parca' || i.type === 'sarf').reduce((s, i) => s + lt(i), 0);
    const iscilik = ls.filter((i) => i.type === 'iscilik' || i.type === 'dis').reduce((s, i) => s + lt(i), 0);
    const net = parca + iscilik - (Number(j.disc) || 0); const kdv = Math.round(net * 0.2 * 100) / 100;
    return { parca, iscilik, net, kdv, total: Math.round((net + kdv) * 100) / 100 };
  },
  seed(db) {
    const { rand, pick, addDays } = NS;
    db.data._settings = { bizName: 'Usta Oto Servis', bizPhone: '0212 555 66 77', bizAddress: 'Ikitelli Oto Sanayi Sitesi 12. Blok No:8, İstanbul', laborRate: 1200, serviceKm: 15000, warrantyDays: 180 };
    db.data.users = [{ id: 'u1', name: 'Cengiz Usta', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Selin Danışman', role: 'danisman', pin: '1234', active: true }, { id: 'u3', name: 'Murat Teknisyen', role: 'teknisyen', pin: '1234', active: true, tech: 't1' }];
    db.data.techs = [{ id: 't1', name: 'Murat Kaya', skill: 'Mekanik' }, { id: 't2', name: 'Erkan Yılmaz', skill: 'Elektrik / beyin' }, { id: 't3', name: 'Sinan Aydın', skill: 'Kaporta & boya' }, { id: 't4', name: 'Ali Demir', skill: 'Mekanik' }];
    const P = [['YF-1101', 'Motor yağı 5W-30 (1 lt)', 'Castrol', 210, 380], ['FL-2201', 'Yağ filtresi', 'Bosch', 120, 260], ['FL-2202', 'Hava filtresi', 'Mann', 140, 290], ['FL-2203', 'Polen filtresi', 'Mann', 110, 240], ['FL-2204', 'Yakıt filtresi', 'Bosch', 190, 390], ['FR-3101', 'Ön fren balatası (takım)', 'TRW', 650, 1250], ['FR-3102', 'Arka fren balatası (takım)', 'TRW', 520, 990], ['FR-3103', 'Ön fren diski (adet)', 'Brembo', 900, 1650], ['AT-4101', 'Buji (adet)', 'NGK', 140, 280], ['AK-5101', 'Akü 60 Ah', 'Mutlu', 2100, 3400], ['TR-6101', 'Triger seti', 'Gates', 2600, 4600], ['SU-7101', 'Ön amortisör (adet)', 'Sachs', 1500, 2700], ['KL-8101', 'Klima gazı (R134a)', 'Genel', 300, 750], ['AN-9101', 'Antifriz (3 lt)', 'Prestone', 260, 480], ['DB-9201', 'Debriyaj seti', 'Valeo', 3800, 6400]];
    db.data.parts = P.map(([code, name, brand, cost, price], i) => ({ id: NS.uid(), code, name, brand, cost, price, stock: i % 6 === 4 ? rand(0, 1) : rand(3, 24), min: 2 }));
    db.data.customers = NS.NAMES.slice(0, 24).map((n, i) => ({ id: 'c' + i, name: i % 7 === 3 ? `${n.split(' ')[1]} Lojistik Ltd.` : n, phone: NS.phone(), fleet: i % 7 === 3, balance: 0 }));
    const cities = ['34', '34', '34', '41', '16', '06'];
    db.data.vehicles = db.data.customers.flatMap((c, i) => Array.from({ length: c.fleet ? 3 : 1 }, (_, k) => { const br = pick(Object.keys(OTS.BRANDS)); return { id: NS.uid(), plate: `${pick(cities)} ${String.fromCharCode(65 + ((i + k) % 26))}${String.fromCharCode(66 + ((i * 3 + k) % 24))} ${rand(100, 9999)}`, brand: br, model: pick(OTS.BRANDS[br]), year: rand(2012, 2024), km: rand(25, 210) * 1000, fuel: pick(['Benzin', 'Dizel', 'Dizel', 'LPG', 'Hibrit']), customer: c.id, vin: 'VF1' + Math.random().toString(36).slice(2, 16).toUpperCase(), inspection: NS.iso(addDays(new Date(), rand(-20, 300))), insurance: NS.iso(addDays(new Date(), rand(-5, 330))) }; }));
    const COMPLAINT = [['Periyodik bakım', [['FL-2201', 1], ['YF-1101', 4], ['FL-2202', 1], ['FL-2203', 1]], 1.5], ['Frenden ses geliyor', [['FR-3101', 1], ['FR-3103', 2]], 2], ['Akü bitiyor, zor çalışıyor', [['AK-5101', 1]], 0.5], ['Klima soğutmuyor', [['KL-8101', 1]], 1], ['Motor tekliyor, arıza lambası yanık', [['AT-4101', 4]], 1.5], ['Triger değişim zamanı', [['TR-6101', 1], ['AN-9101', 1]], 4], ['Ön düzende vuruntu', [['SU-7101', 2]], 2.5], ['Debriyaj kaçırıyor', [['DB-9201', 1]], 5]];
    const jobs = []; let no = 2400;
    for (let d = 45; d >= 0; d--) for (let k = 0; k < rand(1, 4); k++) {
      const at = addDays(new Date(), -d); at.setHours(rand(8, 16), rand(0, 59)); if (at > new Date()) continue;
      const v = pick(db.data.vehicles); const [complaint, parts, hrs] = pick(COMPLAINT);
      const items = parts.map(([code, qty]) => { const p = db.data.parts.find((x) => x.code === code); return { id: NS.uid(), type: 'parca', pid: p.id, name: `${p.name} (${p.brand})`, qty, price: p.price, cost: p.cost, approved: true }; });
      items.push({ id: NS.uid(), type: 'iscilik', name: `İşçilik — ${complaint.toLowerCase()}`, qty: hrs, price: 1200, approved: true });
      if (Math.random() < 0.3) items.push({ id: NS.uid(), type: 'parca', pid: db.data.parts[3].id, name: 'Polen filtresi (Mann) — öneri', qty: 1, price: 240, cost: 110, approved: Math.random() < 0.6 });
      const st = d > 2 ? 'teslim' : d === 2 ? pick(['teslim', 'hazir']) : d === 1 ? pick(['islemde', 'hazir', 'onay']) : pick(['kabul', 'teshis', 'onay', 'islemde']);
      const j = { id: NS.uid(), no: 'IE' + no++, vehicle: v.id, customer: v.customer, at: at.toISOString(), km: v.km - d * rand(30, 60), complaint, items: st === 'kabul' ? [] : items, tech: pick(db.data.techs).id, status: st, history: [], disc: 0, paid: 0, photos: Math.random() < 0.3 ? 2 : 0 };
      OTS.FLOW.slice(0, OTS.FLOW.indexOf(st) + 1).forEach((s, i) => j.history.push({ at: new Date(Math.min(Date.now() - 6e4, at.getTime() + i * 3 * 3600e3)).toISOString(), st: s, note: OTS.ST[s][0] }));
      if (st === 'teslim') { j.paid = Math.random() < 0.85 ? OTS.totals(j).total : 0; j.deliveredAt = j.history[j.history.length - 1].at; j.nextKm = j.km + (complaint === 'Periyodik bakım' ? 15000 : 0) || null; }
      if (st === 'onay') j.items.forEach((i) => { i.approved = null; });
      jobs.push(j);
    }
    db.data.jobs = jobs;
    db.data.customers.forEach((c) => { c.balance = jobs.filter((j) => j.customer === c.id && j.status === 'teslim').reduce((s, j) => s + OTS.totals(j).total - j.paid, 0); });
    db.data.payments = [];
  },
};
