/* Matbaa ve reklam atölyesi: durumlar, müşteri sayfası ayarı, demo verisi. Fiyatlar örnektir. */
window.MATBAA = {
  STATUS: [
    { id: 'teklif', name: 'Teklif', color: '#64748b', icon: 'file' },
    { id: 'tasarim', name: 'Tasarım', color: '#0284c7', icon: 'palette' },
    { id: 'onay', name: 'Müşteri onayı', color: '#d97706', icon: 'clock' },
    { id: 'baski', name: 'Baskı', color: '#7c3aed', icon: 'print' },
    { id: 'sonislem', name: 'Son işlem', color: '#db2777', icon: 'scissors' },
    { id: 'hazir', name: 'Hazır', color: '#16a34a', icon: 'check' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
  ],
  seed(db) {
    const H = window.SIPHESAP;
    window.SIPTOHUM(db, {
      prefix: 'MB', akis: ['teklif', 'tasarim', 'onay', 'baski', 'sonislem', 'hazir'], adres: true,
      ayar: { bizName: 'Örnek Matbaa', bizPhone: '0212 000 00 00', bizAddress: 'Topkapı, İstanbul', defaultDays: 5, freeRev: 2, smsHazir: true, autoPrint: false },
      users: [{ id: 'u1', name: 'Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Satış', role: 'satis', pin: '1234', active: true }, { id: 'u3', name: 'Üretim', role: 'uretim', pin: '1234', active: true }],
      staff: [{ id: 's1', name: 'Deniz Grafiker', skill: 'Tasarım' }, { id: 's2', name: 'Kemal Usta', skill: 'Baskı' }, { id: 's3', name: 'Murat Montaj', skill: 'Montaj', kurye: true, phone: NS.phone() }],
      services: [['Kartvizit', 'Kâğıt', 'adet', 2], ['Broşür A5', 'Kâğıt', 'adet', 3], ['Afiş', 'Kâğıt', 'adet', 45], ['Branda', 'Geniş format', 'm²', 180], ['Folyo', 'Geniş format', 'm²', 240], ['Tabela', 'Reklam', 'm²', 1800], ['Araç giydirme', 'Reklam', 'm²', 900]].map(([name, cat, unit, price]) => ({ name, cat, unit, price, cost: Math.round(price * 0.55 * 100) / 100 })),
      satir: (s) => { const b = { sid: s.id, name: s.name, unit: s.unit, price: s.price }; if (s.unit === 'm²') { const en = NS.rand(10, 40) / 10, boy = NS.rand(10, 30) / 10; return { ...b, en, boy, qty: H.m2(en, boy), size: `${en} × ${boy} m`, side: NS.pick(['Tek yön', 'Çift yön']), finish: NS.pick(['Kuş gözü', 'Kenar kaynak', '']) }; } return { ...b, qty: NS.pick([500, 1000, 2000]), size: NS.pick(['85 × 55 mm', 'A5', 'A4']), paper: NS.pick(['350 g kuşe', '170 g kuşe', 'Bristol']), side: NS.pick(['Tek yön', 'Çift yön']), finish: NS.pick(['Mat selofan', 'Parlak selofan', '']) }; },
      ek: (o, c, k) => { o.proofs = []; o.defects = []; if (['baski', 'sonislem', 'hazir', 'teslim'].includes(o.status)) o.proofs.push({ rev: 1, note: 'İlk sürüm', at: o.at, status: 'onaylandi', by: 'Müşteri (online)' }); if (o.status === 'onay') o.proofs.push({ rev: 1, note: 'Ön ve arka yüz', at: o.at, status: 'bekliyor' }); if (k % 11 === 3 && o.status === 'teslim') o.defects.push({ reason: 'Renk farkı', note: 'Yeniden basıldı', cost: 350, at: o.at }); },
    });
  },
};
window.SIPTAKIP = { id: 'matbaa', status: window.MATBAA.STATUS, seed: window.MATBAA.seed, baslik: 'İş durumu ve tasarım onayı', soru: 'İşiniz ne durumda?', icon: 'print', kodMetni: 'Size verilen 8 haneli takip kodunu yazın. Tasarımı buradan onaylayabilir, üretim aşamasını izleyebilirsiniz.', hazirBaslik: 'İşiniz teslime hazır',
  onay: { baslik: 'Tasarım onayınız bekleniyor', uyari: 'Onayınızdan sonra baskıya geçilir. Ekrandaki renk baskıdan farklı görünebilir.', sonra: 'baski', geri: 'tasarim' } };
