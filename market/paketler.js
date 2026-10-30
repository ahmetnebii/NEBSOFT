/* NEBSOFT hazır paketler — sektöre göre program grupları. Yalnızca kimlik ve program listesi burada durur; fiyat yazılmaz.
   Tutar sunucuda hesaplanır: server/cloud/paket.js (katalog fiyatı + config/toplu-indirim.json). Sayfa metinleri site/src/paketler.js içindedir.
   Paket ayrı bir ürün değildir: sepete içindeki programlar tek tek eklenir. Yeni satışa kapalı program buraya yazılmaz (eczane). */
window.PAKETLER = {
  plan: 1, // sepete tek tıkla eklerken seçili gelen plan (Profesyonel)
  liste: [
    { id: 'oto-sanayi', ad: 'Oto Sanayi', kim: 'Oto tamirci, kaportacı', icon: 'wrench', accent: '#b45309', programlar: ['otoservis', 'muhasebe', 'crm'] },
    { id: 'oto-bakim', ad: 'Oto Bakım', kim: 'Yıkama, otopark, detaylı temizlik', icon: 'car', accent: '#0284c7', programlar: ['oto', 'muhasebe', 'randevu'] },
    { id: 'oto-ticaret', ad: 'Oto Ticaret', kim: 'Galerici, rent a car', icon: 'car', accent: '#1d4ed8', programlar: ['galeri', 'kiralama', 'muhasebe'] },
    { id: 'teknik-servis', ad: 'Teknik Servis', kim: 'Beyaz eşya, telefon, bilgisayar', icon: 'wrench', accent: '#ea580c', programlar: ['servis', 'muhasebe', 'crm'] },
    { id: 'guzellik', ad: 'Güzellik', kim: 'Kuaför, güzellik salonu', icon: 'calendar', accent: '#9333ea', programlar: ['randevu', 'pos', 'muhasebe'] },
    { id: 'spor', ad: 'Spor', kim: 'Salon, stüdyo, pilates', icon: 'dumbbell', accent: '#16a34a', programlar: ['spor', 'randevu', 'muhasebe'] },
    { id: 'saglik', ad: 'Sağlık', kim: 'Muayenehane, diş kliniği', icon: 'heart', accent: '#dc2626', programlar: ['klinik', 'muhasebe', 'ik'] },
    { id: 'veteriner', ad: 'Veteriner', kim: 'Veteriner kliniği, pet', icon: 'heart', accent: '#0d9488', programlar: ['veteriner', 'pos', 'muhasebe'] },
    { id: 'restoran', ad: 'Restoran', kim: 'Kafe, restoran', icon: 'coffee', accent: '#e11d48', programlar: ['adisyon', 'ik', 'muhasebe'] },
    { id: 'perakende', ad: 'Perakende', kim: 'Market, bakkal', icon: 'barcode', accent: '#4f46e5', programlar: ['pos', 'muhasebe', 'crm'] },
    { id: 'moda', ad: 'Moda', kim: 'Butik, giyim', icon: 'store', accent: '#db2777', programlar: ['butik', 'eticaret', 'muhasebe'] },
    { id: 'e-ticaret', ad: 'E-ticaret', kim: 'Online satıcı', icon: 'store', accent: '#7c3aed', programlar: ['eticaret', 'pazaryeri', 'kargo', 'fiyatrobotu'] },
    { id: 'kuyumcu', ad: 'Kuyumcu', kim: 'Kuyumcu', icon: 'store', accent: '#ca8a04', programlar: ['kuyumcu', 'muhasebe', 'crm'] },
    { id: 'toptan', ad: 'Toptan', kim: 'Toptancı, dağıtıcı', icon: 'truck', accent: '#0f766e', programlar: ['toptan', 'muhasebe', 'kargo'] },
    { id: 'uretim', ad: 'Üretim', kim: 'Atölye, fabrika', icon: 'factory', accent: '#475569', programlar: ['fabrika', 'toptan', 'muhasebe', 'ik'] },
    { id: 'egitim', ad: 'Eğitim', kim: 'Kurs, etüt merkezi', icon: 'school', accent: '#2563eb', programlar: ['kurs', 'muhasebe', 'ik'] },
    { id: 'okul-oncesi', ad: 'Okul Öncesi', kim: 'Anaokulu, kreş', icon: 'school', accent: '#f59e0b', programlar: ['anaokulu', 'muhasebe', 'ik'] },
    { id: 'konaklama', ad: 'Konaklama', kim: 'Butik otel, pansiyon', icon: 'bed', accent: '#0891b2', programlar: ['otel', 'adisyon', 'muhasebe', 'ik'] },
    { id: 'etkinlik', ad: 'Etkinlik', kim: 'Tiyatro, konser, salon', icon: 'ticket', accent: '#c026d3', programlar: ['bilet', 'muhasebe', 'crm'] },
    { id: 'emlak', ad: 'Emlak', kim: 'Emlak ofisi', icon: 'building', accent: '#15803d', programlar: ['emlak', 'crm', 'muhasebe'] },
    { id: 'hukuk-burosu', ad: 'Hukuk Bürosu', kim: 'Avukat', icon: 'shield', accent: '#1e3a8a', programlar: ['hukuk', 'muhasebe', 'ik'] },
    { id: 'mali-musavir', ad: 'Mali Müşavir', kim: 'SMMM ofisi', icon: 'chart', accent: '#0e7490', programlar: ['musavir', 'crm', 'ik'] },
    { id: 'site-yonetimi', ad: 'Site Yönetimi', kim: 'Apartman, site', icon: 'building', accent: '#65a30d', programlar: ['site', 'muhasebe'] },
    { id: 'kurumsal', ad: 'Kurumsal', kim: 'Büyüyen şirket', icon: 'layers', accent: '#4338ca', programlar: ['muhasebe', 'crm', 'ik', 'servis'] },
  ],
};
