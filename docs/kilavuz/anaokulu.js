// Anaokulu & Kreş kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js anaokulu
module.exports = (O) => ({
  ne: 'Anaokulu & Kreş programı günlük giriş ve çıkışı, teslim alan kişiyi, yemek ve uyku raporunu, veli mesajlarını, duyuruları, yemek menüsünü, servis listelerini, olay ve ilaç kayıtlarını ve aidatları yönetir. Veliler veli portalından çocuğunun gününü görür.',
  kimler: 'Anaokulları, kreşler, gündüz bakımevleri ve okul öncesi kurumlar.',
  ilkNot: 'Önce **Sınıflar** sayfasını ve öğrenci kayıtlarını doldurun. Teslim listesi öğrenci kartındaki veliler ve yetkili kişilerden gelir, bu yüzden bu alanları eksiksiz girin.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Okuldaki çocuk sayısını, gelmeyenleri, eksik raporları, günün veli mesajlarını ve haber vermeden gelmeyenleri gösterir.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['**Okulda**, **Gelmeyen**, **Raporu eksik** ve **Bugünkü veli mesajı** kutuları günün durumudur.', '.kpi'], ['**Günlük rapor** rapor ekranını açar.', 'a@Günlük rapor'], ['**Giriş & çıkış** yoklama ekranını açar.', 'a@Giriş & çıkış']] }] }] },

    { id: 'yoklama', ne: 'Çocukların gelişini ve teslimini kaydeder. Çocuğu teslim alan kişi kayıt altına alınır. Sınıf düğmeleriyle sınıf seçilir.',
      gorevler: [
        { baslik: 'Geliş kaydı', sahneler: [{ git: 'yoklama', kirp: 'ana', adimlar: [['Sınıfı seçin.', '#cp'], ['Çocuk gelince **Geldi** düğmesine basın.', 'button@Geldi'], ['Gelmeyen çocuk için **Gelmedi** düğmesine basın.', 'button@Gelmedi']] }] },
        { baslik: 'Teslim etme', ne: 'Liste veliler ve kartta yazılı yetkili kişilerden oluşur. Listede olmayan kişiye teslimde ad, 11 haneli TC kimlik numarası ve velinin telefonla teyidi zorunludur.', sahneler: [{ git: 'yoklama', once: [['tikla', 'button@Geldi'], ['tikla', 'button@Teslim et']], kirp: 'pencere', adimlar: [['**Teslim alan** kişiyi seçin. Yoksa **Listede olmayan kişi** seçeneğini kullanın.', '.field@Teslim alan'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Teslim alanın adını ve 11 haneli TC kimlik numarasını yazın uyarısı çıkıyor.', 'Listede olmayan kişinin bilgilerini kimlikten kontrol edip yazın.'], ['Önce veliyi arayıp teyit edin uyarısı çıkıyor.', 'Veliyi arayın, **Veliyi arayıp teyit ettim** kutusunu işaretleyin.']] },

    { id: 'rapor', ne: 'Her çocuk için kahvaltı, öğle yemeği, uyku ve duygu durumunu tek dokunuşla işaretlersiniz. Veliler raporu portalda görür.',
      gorevler: [{ baslik: 'Günlük rapor doldurma', sahneler: [{ git: 'rapor', kirp: 'ana', boy: 950, adimlar: [['Sınıfı seçin.', '#cp'], ['Her satırda **Hepsi**, **Yarısı**, **Az** veya **Yemedi** seçin.', 'button@Yarısı'], ['**Velilere bildir** biten raporları veli portalında yayınlar.', '#pub']] }] }],
      hatalar: [['Gönderilecek yeni rapor yok uyarısı çıkıyor.', 'Seçili sınıfta yeni doldurulan rapor yoktur.']] },

    { id: 'mesajlar', baslik: 'Veli Mesajları', ne: 'Veli portalından gelen izin bildirimleri, erken alma ve soruları gösterir. Menüdeki sayı bugünkü veli mesajı adedidir.',
      gorevler: [{ baslik: 'Mesaj yanıtlama', sahneler: [{ git: 'mesajlar', kirp: 'ana', adimlar: [['**Yanıtla** yanıt penceresini açar, yanıt veli portalında görünür.', 'button@Yanıtla']] }] }] },

    { id: 'ogrenciler', ne: 'Öğrencileri, velileri, sağlık bilgisini, servisi, bakiyeyi ve portal kodunu tutar.',
      gorevler: [
        { baslik: 'Öğrenci kaydı', sahneler: [
          { git: 'ogrenciler', kirp: 'ana', adimlar: [['**Yeni kayıt** düğmesine basın.', 'button@Yeni kayıt'], ['Sınıfa göre, **Alerjisi olan** veya **Ayrılan** ile listeyi süzün.', 'button@Alerjisi olan'], ['**Veli portalı bilgisini gönder** portal kodunu veliye iletir.', 'button@Veli portalı bilgisini gönder'], ['**Ayrılış** çocuğun ayrılış kaydını açar, iade tutarını sorar.', 'button@Ayrılış']] },
          { git: 'ogrenciler', once: [['tikla', 'button@Yeni kayıt']], kirp: 'pencere', boy: 1050, adimlar: [['**Ad soyad** ve **Doğum tarihi** zorunludur.', '.field@Ad soyad'], ['**1. veli ad soyad** ve **1. veli telefon** zorunludur. Portal bu telefonla açılır.', '.field@1. veli ad soyad'], ['Teslim alabilecek diğer kişileri satır satır yazın.', '.field@Teslim alabilecek'], ['**Alerji** ve **Kronik hastalık / ilaç** alanları mutfak ve öğretmen uyarılarını besler.', '.field@Alerji'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Yakınlık', 'Velinin çocuğa yakınlığı.'], ['Aylık ücret', 'Boşsa varsayılan ücret kullanılır.'], ['İndirim %', 'Öğrenciye özel indirim.'], ['Servis', 'Çocuğun bağlı olduğu rota.']] },

    { id: 'duyurular', ne: 'Veli portalında yayınlanan duyuruları ve etkinlikleri yönetir. Sayfanın adı içeride **Duyurular & Etkinlikler** olarak yazar.',
      gorevler: [{ baslik: 'Duyuru yayınlama', sahneler: [
        { git: 'duyurular', kirp: 'ana', adimlar: [['**Yeni duyuru** düğmesine basın.', 'button@Yeni duyuru'], ['**İzin vermeyenler** izin istenen duyuruda henüz izin vermeyenleri gösterir.', 'button@İzin vermeyenler']] },
        { git: 'duyurular', once: [['tikla', 'button@Yeni duyuru']], kirp: 'pencere', adimlar: [['**Başlık** ve **Metin** yazın, **Kime** seçin.', '.field@Başlık'], ['**Veli izni iste (gezi, etkinlik)** veliden onay ister.', 'label@Veli izni iste'], ['**Velilere SMS ile bildir** işaretlenirse velilere mesaj denenir. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'menu', ne: 'Haftalık kahvaltı, öğle ve ikindi menüsünü gösterir. **Alerji uyarısı** sütunu alerjisi olan çocuklar için mutfağı uyarır. Veliler menüyü portalda görür.',
      gorevler: [{ baslik: 'Menü düzenleme', sahneler: [{ git: 'menu', kirp: 'ana', adimlar: [['Satırdaki **Düzenle** ile günün menüsünü değiştirin.', 'button@Düzenle']] }] }] },

    { id: 'servis', ne: 'Rota listelerini gösterir: sabah biniş ve akşam iniş. Rotaları **Rotalar** düğmesiyle tanımlarsınız.',
      gorevler: [{ baslik: 'Rota listeleri', sahneler: [
        { git: 'servis', kirp: 'ana', adimlar: [['**Rotalar** rota tanımlarını açar.', 'a@Rotalar']] }] }] },

    { id: 'olaylar', ne: 'Kaza ve sağlık olaylarını tutar. Veliye bilgi verilip verilmediği kaydedilir, olay için imzalı tutanak alınır. Demoda örnek kayıt yoktur.',
      gorevler: [{ baslik: 'Olay kaydetme', sahneler: [{ git: 'olaylar', once: [['tikla', 'button@Yeni olay']], kirp: 'pencere', boy: 900, adimlar: [['**Çocuk**, **Zaman** ve **Tür** seçin.', '.field@Çocuk'], ['**Ne oldu?** ve **Yapılan müdahale** alanlarını doldurun.', '.field@Ne oldu'], ['**Veliye haber verildi** kutusunu işaretleyip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'ilac', ne: 'Veli isteğiyle verilen ilaçları, dozu, saati ve veren kişiyi tutar. Demoda örnek kayıt yoktur.',
      gorevler: [{ baslik: 'İlaç kaydı', sahneler: [{ git: 'ilac', once: [['tikla', 'button@Yeni kayıt']], kirp: 'pencere', adimlar: [['**Çocuk**, **İlaç**, **Doz**, **Tarih** ve **Saat** girin.', '.field@İlaç'], ['**Veli yazılı isteği alındı** kutusunu işaretleyip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'siniflar', ne: 'Sınıfları, yaş grubunu, öğretmeni ve öğrenci sayısını tutar. Bu sayfayı yalnız müdür görür.',
      gorevler: [{ baslik: 'Sınıf ekleme', sahneler: [{ git: 'siniflar', once: [['tikla', 'button@Yeni sınıf']], kirp: 'pencere', adimlar: [['**Sınıf adı**, **Yaş grubu** ve **Öğretmen adı** yazın.', '.field@Sınıf adı'], ['**Öğretmen hesabı** öğretmenin giriş kullanıcısıdır. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'aidat', ne: 'Aylık ücretleri, tahsilatı ve gecikmiş alacağı yönetir. Kardeş indirimi **Ayarlar** sayfasından gelir.',
      gorevler: [{ baslik: 'Aidat ve tahsilat', sahneler: [
        { git: 'aidat', kirp: 'ana', adimlar: [['**Bu ayın aidatını oluştur** tüm öğrenciler için aylık borç yazar.', '#acc'], ['**Aylık beklenen**, **Bu ay tahsil**, **Gecikmiş alacak** ve **Borçlu veli** kutuları özetidir.', '#k'], ['**Tahsilat** ödeme alır, **Hatırlat** veliye mesaj hazırlar.', 'button@Tahsilat']] },
        { git: 'aidat', once: [['tikla', 'button@Tahsilat']], kirp: 'pencere', adimlar: [['**Tutar** ve **Yöntem** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Tutar sıfırdan büyük olmalı uyarısı çıkıyor.', 'Tutar alanına sıfırdan büyük bir değer yazın.']] },

    O.imzali(),
    O.belgeler({ tur: 'Kayıt sözleşmesi' }),
    O.ayarlar({ alanlar: [['Varsayılan aylık ücret', 'Yeni öğrencide kullanılan ücret.'], ['Kardeş indirimi %', 'Kardeşlere uygulanan oran.'], ['Ödeme günü (ayın)', 'Aidatın vade günü.'], ['IBAN', 'Velilere gösterilen ödeme bilgisi.'], ['Eğitim yılı başlangıcı', 'Ayrılış iadesinde kullanılır.'], ['Eğitim yılı bitişi', 'Ayrılış iadesinde kullanılır.']] }),
    O.bildirimler(),
    { ...O.ebelge(), not: 'Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur. Bu sayfada oluşan belgeler TEST kalır.' },
    O.entegrasyonlar(),
  ],

  roller: 'Öğretmen günlük işlerde çalışır. Muhasebe rolü öğrenciler ve aidat sayfalarını görür. Sınıflar ve ayarlar müdüre aittir.',
  musteri: [{ ad: 'Veli portalı', ne: 'Veli telefonu ve okulun verdiği kodla girer. Bugünkü rapor, menü, duyurular, ödemeler ve mesaj bölümlerini görür. Duyurudaki izni onaylar, izin veya erken alma bildirir. Kodu **Öğrenciler** sayfasındaki **Veli portalı bilgisini gönder** ile iletirsiniz.',
    sahneler: [
      { adres: 'veli.html', ilk: 800, kirp: 'tam', adimlar: [['Veli telefonunu bu kutuya yazar.', '#ph'], ['Okuldan aldığı kodu yazıp **Giriş** düğmesine basar.', '#cd']] },
      { adres: 'veli.html', ilk: 800, kirp: 'tam', boy: 1000, once: [['tikla', '#hint'], ['tikla', '#go']], adimlar: [['Girişten sonra **Bugün**, **Menü**, **Duyurular**, **Ödemeler** ve **Mesaj / izin** sekmeleri görünür.', '#root']] }] }],
  yazdirma: { ne: 'Belgeler ilgili sayfadan ve **İmzalı belgeler** sayfasından yazdırılır.', belgeler: [['Kayıt sözleşmesi', '**İmzalı belgeler** sayfası.'], ['Teslim alma yetki formu', '**İmzalı belgeler** sayfası.'], ['Fotoğraf / video izin formu', '**İmzalı belgeler** sayfası.'], ['Tahsilat makbuzu', '**Aidat & Tahsilat** sayfasında tahsilattan sonra.'], ['Olay tutanağı', '**Olay Kayıtları** sayfasında **Tutanak**.']] },

  entegrasyon: {
    sms: { degisir: ['Yeni duyuruda **Velilere SMS ile bildir** işaretlenirse velilere gerçek SMS gider.', '**Velilere bildir**, **Hatırlat** ve portal bilgisi gönderimi de aynı bağlantıyı kullanır.', 'Bağlantı yokken veliye bir şey gitmez.'], sorun: ['Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.', 'Öğrenci kartındaki **1. veli telefon** alanını kontrol edin.'] },
    backup: O.E.backup(),
  },
});
