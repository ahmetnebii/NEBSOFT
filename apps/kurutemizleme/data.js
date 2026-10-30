/* Kuru temizleme ve halı yıkama: durumlar, müşteri sayfası ayarı, demo verisi. Fiyatlar örnektir. */
window.KURU = {
  STATUS: [
    { id: 'alinacak', name: 'Adresten alınacak', color: '#64748b', icon: 'truck' },
    { id: 'alindi', name: 'Teslim alındı', color: '#0284c7', icon: 'box' },
    { id: 'yikama', name: 'Temizlikte', color: '#7c3aed', icon: 'drop' },
    { id: 'kurutma', name: 'Kurutma ve ütü', color: '#d97706', icon: 'sun' },
    { id: 'hazir', name: 'Hazır', color: '#16a34a', icon: 'check' },
    { id: 'teslim', name: 'Teslim edildi', color: '#334155', icon: 'user' },
  ],
  seed(db) {
    const H = window.SIPHESAP;
    window.SIPTOHUM(db, {
      prefix: 'KT', akis: ['alindi', 'yikama', 'kurutma', 'hazir'], adres: true,
      ayar: { bizName: 'Örnek Kuru Temizleme', bizPhone: '0216 000 00 00', bizAddress: 'Kadıköy, İstanbul', defaultDays: 3, smsHazir: true, autoPrint: false, terms: 'Teslim alınmayan eşyalar için işletmenin bekleme süresi fişte yazılıdır.' },
      users: [{ id: 'u1', name: 'Yönetici', role: 'admin', pin: '1234', active: true }, { id: 'u2', name: 'Tezgâh', role: 'tezgah', pin: '1234', active: true }, { id: 'u3', name: 'Şoför', role: 'kurye', pin: '1234', active: true, courier: 's2' }],
      staff: [{ id: 's1', name: 'Ayşe Usta', skill: 'Leke ve ütü' }, { id: 's2', name: 'Hasan Şoför', skill: 'Dağıtım', kurye: true, phone: NS.phone() }],
      services: [['Gömlek', 'Kuru temizleme', 'adet', 120], ['Takım elbise', 'Kuru temizleme', 'takım', 450], ['Mont', 'Kuru temizleme', 'adet', 400], ['Gelinlik', 'Kuru temizleme', 'adet', 2500], ['Perde', 'Ev tekstili', 'm²', 90], ['Yorgan', 'Ev tekstili', 'adet', 500], ['Makine halısı', 'Halı', 'm²', 80], ['Yün halı', 'Halı', 'm²', 130], ['El dokuma halı', 'Halı', 'm²', 220]].map(([name, cat, unit, price]) => ({ name, cat, unit, price })),
      satir: (s) => { if (s.unit === 'm²') { const en = NS.rand(12, 30) / 10, boy = NS.rand(15, 40) / 10; return { sid: s.id, name: s.name, unit: s.unit, price: s.price, en, boy, qty: H.m2(en, boy) }; } return { sid: s.id, name: s.name, unit: s.unit, price: s.price, qty: NS.rand(1, 4) }; },
      ek: (o) => { if (Math.random() < 0.3) o.condition = NS.pick(['Sol kolda mürekkep lekesi', 'Saçakta yıpranma var', 'Düğme eksik']); o.shelf = 'A' + NS.rand(1, 12); },
    });
  },
};
window.SIPTAKIP = { id: 'kurutemizleme', status: window.KURU.STATUS, pickupStatus: 'alinacak', seed: window.KURU.seed, baslik: 'Fiş durumu sorgulama', soru: 'Eşyanız ne durumda?', icon: 'drop', kodMetni: 'Fişinizdeki 8 haneli takip kodunu yazın. Eşyanızın hangi aşamada olduğunu ve kalan tutarı görürsünüz.', hazirBaslik: 'Eşyanız teslime hazır',
  talep: { baslik: 'Adresten alma talebi', metin: 'Adresinizi ve uygun zamanı yazın, işletme sizi arayarak onaylar.', adres: 'zorunlu' } };
