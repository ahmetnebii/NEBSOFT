/* Sipariş ve Teslim demo verisi üreticisi: panel ve müşteri sayfası aynı tohumu kullanır. Fiyatlar örnektir. */
window.SIPTOHUM = function (db, { ayar, users, staff, services, prefix, akis, teslimDurum = 'hazir', adet = 60, satir, ek, adres }) {
  const { rand, pick, addDays, iso } = NS; const H = window.SIPHESAP;
  const d = db.data; d._settings = ayar; d.users = users; d.staff = staff; d.services = services.map((s, i) => ({ id: 'h' + i, ...s })); d.sms = []; d.requests = [];
  d.customers = NS.NAMES.slice(0, 26).map((n, i) => ({ id: 'c' + i, name: n, phone: NS.phone(), address: adres ? `${pick(['Moda Cad.', 'Bahariye Cad.', 'Söğütlüçeşme Cad.', 'Fenerbahçe Mah.'])} No:${rand(1, 90)} Kadıköy` : '' }));
  const ALF = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; const kod = () => Array.from({ length: 8 }, () => ALF[rand(0, ALF.length - 1)]).join('');
  const kurye = staff.filter((s) => s.kurye).map((s) => s.id); const usta = staff.filter((s) => !s.kurye).map((s) => s.id);
  d.orders = Array.from({ length: adet }, (_, k) => {
    const yas = k < 22 ? rand(0, 4) : rand(5, 50); const at = addDays(new Date(), -yas); at.setHours(rand(9, 19), rand(0, 59));
    const status = yas > 4 ? (Math.random() < 0.93 ? 'teslim' : 'iptal') : pick(akis);
    const lines = Array.from({ length: rand(1, 3) }, () => satir(pick(d.services)));
    const c = pick(d.customers); const dueD = addDays(at, rand(1, 6));
    const o = { id: 'o' + k, no: prefix + (5000 + k), code: kod(), customer: c.id, at: at.toISOString(), due: iso(dueD), dueTime: pick(['', '10:00', '12:00-14:00', '15:30', '17:00-19:00']), status, lines, payments: [], log: [{ at: at.toISOString(), status: akis[0], note: 'Kayıt açıldı' }], photos: [], mode: 'magaza', disc: 0, fee: 0, staff: usta.length ? pick(usta) : '' };
    if (adres && Math.random() < 0.5) { o.mode = 'adres'; o.address = c.address; o.fee = 0; o.courier = kurye.length ? pick(kurye) : ''; }
    if (ek) ek(o, c, k);
    const t = H.toplam(o); if (Math.random() < 0.5 || status === 'teslim') o.payments.push({ type: pick(['nakit', 'kart']), amount: H.r2(status === 'teslim' ? t : t * 0.3), at: o.at, kind: status === 'teslim' ? 'tahsilat' : 'kapora' });
    akis.slice(1, akis.indexOf(status) + 1).forEach((s, i) => o.log.push({ at: addDays(at, 0.2 * (i + 1)).toISOString(), status: s, note: '' }));
    if (status === 'teslim') { o.delivered = addDays(at, rand(1, 4)).toISOString(); o.log.push({ at: addDays(at, 1).toISOString(), status: teslimDurum, note: '' }, { at: o.delivered, status: 'teslim', note: 'Teslim edildi' }); if (Math.random() < 0.3) o.review = { stars: rand(3, 5), text: '', at: o.delivered }; }
    if (status === 'iptal') o.log.push({ at: at.toISOString(), status: 'iptal', note: 'Müşteri vazgeçti' });
    return o;
  });
};
