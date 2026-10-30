/* NEBSOFT Temizlik & Tesis Hizmetleri: sözleşmeli periyodik iş, ekip takvimi, kontrol listesi, müşteri raporu ve aylık faturalama (motor: apps/saha-ortak/saha.js) */
(function () {
  'use strict';
  const ROLES = { admin: 'Yönetici', ofis: 'Ofis', ekip: 'Saha ekibi' };
  const T = (name, label, type = 'text') => ({ name, label, type }); const YON = ['admin', 'ofis'];
  NS.saha({
    id: 'temizlik', name: 'Temizlik & Tesis', tagline: 'Periyodik İş ve Ekip Takibi', icon: 'sparkles', accent: '#0d9488', prefix: 'TM', seed: window.TEMIZLIK.seed, home: 'ozet', jobWord: 'Ziyaret', listLabel: 'Ziyaretler', todayLabel: 'Bugünkü Ziyaretler', formLabel: 'Hizmet raporu', signText: 'Hizmetin yukarıdaki şekilde yapıldığını gördüm.',
    roles: ROLES, checks: 'Zeminler\nToz alma\nÇöpler alındı',
    forms: { coll: 'customers', party: 'Müşteri', kinds: [{ id: 'hasar', label: 'Hasar tutanağı', sign: ['İşletme', 'Müşteri'], fields: [T('tarih', 'Tarih', 'date'), T('esya', 'Zarar gören eşya'), T('aciklama', 'Açıklama', 'textarea')], body: '{{tarih}} tarihli hizmet sırasında {{esya}} zarar görmüştür. Açıklama: {{aciklama}}. Bu metin örnektir, hukuki danışmanlık değildir.' }] },
    nav: [{ sec: 'Saha' }, { id: 'ozet', label: 'Özet', icon: 'home', roles: YON }, { id: 'bugun', label: 'Bugünkü Ziyaretler', icon: 'calendar' }, { id: 'takvim', label: 'Ekip Takvimi', icon: 'kanban' }, { id: 'isler', label: 'Ziyaretler', icon: 'list' }, { sec: 'Müşteri' }, { id: 'musteriler', label: 'Müşteriler', icon: 'users', roles: YON }, { id: 'sozlesmeler', label: 'Sözleşmeler', icon: 'file', roles: YON }, { id: 'faturalar', label: 'Aylık Faturalama', icon: 'receipt', roles: YON }, { sec: 'Yönetim' }, { id: 'ekipler', label: 'Ekipler', icon: 'users', roles: YON }, { id: 'hizmetler', label: 'Hizmetler', icon: 'list', roles: YON }, { id: 'stok', label: 'Malzeme Stoğu', icon: 'box', roles: YON }, { id: 'bildirimler', label: 'SMS Bildirimleri', icon: 'message', roles: YON }, { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', roles: ['admin'] }],
  });
})();
