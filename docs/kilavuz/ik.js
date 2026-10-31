// Personel & Puantaj kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js ik
module.exports = (O) => ({
  ne: 'Personel & Puantaj, çalışan kayıtlarını, günlük puantajı, vardiyayı, izinleri, belgeleri, avansı ve bordroyu tek programda toplar. Onaylanan izin puantaja işlenir, puantajdan bordro hesaplanır, pusula ve ödeme listesi yazdırılır.',
  kimler: 'Personeli olan işletmeler, üretim tesisleri, mağazalar ve vardiyalı çalışan yerler. İK sorumlusu ile departman şefi birlikte kullanır.',
  ilkNot: 'Bordro hesabı **Ayarlar** sayfasındaki yasal parametrelerle yapılır. Sonuçları mali müşavirinizle doğrulayın. Bu program SGK’ya veya bankaya kendiliğinden gönderim yapmaz.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
  moduller: [
    { id: 'ozet', ne: 'Aktif personeli, bugün işte olanları, izinli ve raporluları, onay bekleyen izinleri, doğum günlerini ve iş yıldönümlerini gösterir.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1000, en: 1400, adimlar: [['**Onay bekleyen izin** kutusu İzinler sayfasındaki işleri gösterir.', '.kpi@Onay bekleyen izin'], ['**Bugün yok** listesi izinli, raporlu ve devamsız kişileri gösterir.', 'h3@Bugün yok'], ['**Bu ay devamsızlık (gün)** kartına bakın.', 'h3@Bu ay devamsızlık']] }] }] },

    { id: 'puantaj', ne: 'Her personelin ayın her günündeki durumunu tablo olarak tutar. Hücreye dokunarak durumu değiştirirsiniz. Sağdaki sütunlar çalışılan gün, izin, rapor, devamsızlık ve fazla mesaiyi toplar.',
      gorevler: [{ baslik: 'Puantaj doldurma', sahneler: [{ git: 'puantaj', en: 1800, boy: 900, adimlar: [['Ayı **Önceki ay** ve **Sonraki ay** simgeleriyle değiştirin.', "[title='Önceki ay'], [aria-label='Önceki ay']"], ['**Bugünü "çalıştı" doldur** boş hücreleri doldurur.', '.btn@Bugünü'], ['**Fazla mesai gir** saat girişini açar.', '.btn@Fazla mesai gir'], ['**PDKS’den aktar** cihaz verisi içindir, cihaz bağlı değilse işlenmez.', '.btn@PDKS’den aktar'], ['**Yazdır** puantaj cetvelini basar, **Excel** dosyaya alır.', '#prt']] }] }],
      hatalar: [['Bu ay kapatıldı uyarısı çıkıyor.', 'Bordro dönemi kapanmıştır. **Bordro & Avans** sayfasından dönemi açın.'], ['PDKS TEST uyarısı çıkıyor.', 'Cihaz bağlı değildir, puantaja kayıt işlenmez.']] },

    { id: 'vardiya', ne: 'Haftalık vardiya planıdır. Hücreye dokunarak vardiya atarsınız, T hafta tatilidir. Tablonun altında vardiya türleri tanımlanır.',
      gorevler: [{ baslik: 'Vardiya planlama', sahneler: [{ git: 'vardiya', en: 1500, boy: 1200, adimlar: [['**Geçen haftayı kopyala** planı taşır.', '#cp'], ['**Yazdır** planı basar.', '#pr'], ['**Personele SMS** planı personele yollar.', '#sm'], ['**Yeni vardiya** tür ekler.', '.btn@Yeni vardiya']] }] }],
      hatalar: [['Önce aşağıdan vardiya türü ekleyin uyarısı çıkıyor.', '**Yeni vardiya** ile tür ekleyin.'], ['Planı olan ve telefonu kayıtlı personel yok uyarısı çıkıyor.', 'Personele telefon girin.']] },

    { id: 'izinler', ne: 'İzin taleplerini ve bakiyeleri yönetir. Onaylanan izin puantaja işlenir. Hafta tatili ve resmî tatil izinden düşmez.',
      gorevler: [{ baslik: 'İzin girme ve onaylama', sahneler: [
        { git: 'izinler', en: 1500, boy: 1000, adimlar: [['**İzin talebi** düğmesine basın.', '#nl'], ['Talebi **Onayla** veya **Reddet** ile sonuçlandırın.', "button[title='Onayla']"], ['**İzin formu** imzalanacak formu basar.', "button[title='İzin formu']"], ['**İzin bakiyeleri** kartında kalan haklar görünür.', 'h3@İzin bakiyeleri']] },
        { git: 'izinler', once: [['tikla', '#nl']], kirp: 'pencere', adimlar: [['**Personel** ve **Tür** seçin.', '.field@Personel'], ['**Başlangıç** ve **Bitiş** girip **Kaydet** düğmesine basın.', '.field@Başlangıç']] }] }],
      hatalar: [['Bitiş tarihi başlangıçtan önce olamaz uyarısı çıkıyor.', 'Tarihleri düzeltin.'], ['Bu tarihlerde onaylı izin var uyarısı çıkıyor.', 'Çakışan izni kontrol edin.'], ['İzin kapatılmış bir ayı kapsıyor uyarısı çıkıyor.', 'Önce dönemi açın.']] },

    { id: 'personel', ne: 'Özlük bilgilerini, kıdemi ve izin haklarını tutar. Tazminat hesabı, çalışma belgesi, çalışan portalı kodu ve işten çıkış buradadır.',
      gorevler: [
        { baslik: 'Personel ekleme', sahneler: [
          { git: 'personel', en: 1500, adimlar: [['**Yeni personel** düğmesine basın.', 'button@Yeni personel'], ['**Aktif** ve **Ayrılanlar** ile süzün.', 'button@Ayrılanlar'], ['**Kıdem / ihbar tazminatı hesapla** tahmini tutarı gösterir.', "button[title='Kıdem / ihbar tazminatı hesapla']"], ['**Çalışma belgesi** belgeyi basar.', "button[title='Çalışma belgesi']"], ['**Çalışan portalı kodu** giriş kodu verir.', "button[title='Çalışan portalı kodu']"], ['**İşten çıkış** kaydı kapatır.', "button[title='İşten çıkış']"]] },
          { git: 'personel', once: [['tikla', 'button@Yeni personel']], kirp: 'pencere', boy: 1100, adimlar: [['**Ad soyad**, **İşe giriş** ve **Maaş (₺)** zorunludur.', '.field@Ad soyad'], ['**Departman** ve **Görev** seçin.', '.field@Departman'], ['**Maaş türü** bordro hesabını belirler.', '.field@Maaş türü'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['TC kimlik no', 'Bildirim ve bordro için.'], ['IBAN', 'Banka listesinde kullanılır.'], ['Önceki yıllardan devreden izin (gün)', 'Geçişte kalan izin hakkı.'], ['Sözleşmeyle ek yıllık izin (gün)', 'Yasal hakka eklenir.']],
      hatalar: [['Çıkış tarihi girişten önce olamaz uyarısı çıkıyor.', 'Tarihi düzeltin.']] },

    { id: 'ozluk', ne: 'Ehliyet, sağlık raporu, eğitim gibi süreli belgeleri ve personele teslim edilen eşyayı tutar. Demo verisinde kayıt yoktur. Bu sayfayı yalnız İK görür.',
      gorevler: [{ baslik: 'Kayıt ekleme', sahneler: [{ git: 'ozluk', adimlar: [['**Yeni kayıt** düğmesine basın.', 'button@Yeni kayıt'], ['**30 gün içinde dolan** ve **Zimmette** ile süzün.', 'button@30 gün içinde dolan']] }] }] },

    { id: 'maas', ne: 'Puantajdan aylık bordro hesaplanır. Avans düşülür, pusula ve ödeme listesi basılır, ay kapatılır. Rakamlar tahmindir, mali müşavirinizle doğrulayın. Bu sayfayı yalnız İK görür.',
      gorevler: [{ baslik: 'Aylık bordro', sahneler: [{ git: 'maas', en: 1800, boy: 1100, adimlar: [['**Avans ver** avans kaydeder, bordrodan düşer.', '.btn@Avans ver'], ['**Bordro pusulaları** tümünü basar.', '#slips'], ['**Ödeme listesi** imza listesi basar.', '#pr'], ['**Banka listesi (CSV)** dosya üretir, dosyayı bankanıza yüklersiniz.', '.btn@Banka listesi (CSV)'], ['**Dönemi kapat** ayı kilitler.', '.btn@Dönemi kapat']] }] }],
      hatalar: [['Bu ayın bordrosu kapatıldı uyarısı çıkıyor.', 'Değişiklik için dönemi açın.'], ['Personel ve tutar girin uyarısı çıkıyor.', 'Avans penceresini doldurun.'], ['Banka TEST uyarısı çıkıyor.', 'Maaş talimatı gitmemiştir, listeyi bankanıza siz yükleyin.'], ['e-Bordro TEST uyarısı çıkıyor.', 'Pusulalar gönderilmemiştir, **Bordro pusulaları** ile basın.']] },

    O.imzali(),
    O.belgeler(),
    O.ayarlar({ alanlar: [['Departmanlar (virgülle)', 'Personel kartında seçilir.'], ['Aylık çalışma saati', 'Saatlik ücret hesabı.'], ['Fazla mesai katsayısı', 'Fazla mesai ücreti çarpanı.'], ['Raporlu günler SGK gününden düşsün (rapor süresinde ücret ödenmiyor)', 'Bordro gün hesabını değiştirir.'], ['İzin kararında personele SMS gönder', 'SMS bağlıysa çalışır.'], ['Dinî bayram ve ek tatil günleri (YYYY-AA-GG, virgülle)', 'İzin hesabında düşülür.'], ['Parametre yılı', 'Yasal parametrelerin yılı.'], ['Asgari ücret (brüt ₺)', 'Yılın değerini girin.']] }),
    O.bildirimler(),
    O.entegrasyonlar(),
  ],
  roller: 'Departman şefi puantaj, vardiya, izin ve personel ekranlarını görür. Belge, bordro ve yönetim sayfaları İK’ya aittir.',
  musteri: [{ ad: 'Çalışan portalı', ne: 'Çalışan telefon numarası ve **Çalışan portalı kodu** ile girer. Kendi bilgilerini, izin hakkını, taleplerini, vardiyasını ve bordrolarını görür, izin talebi açar. Müşteriye değil, çalışana açık sayfadır.',
    sahneler: [{ adres: 'calisan.html', ilk: 900, kirp: 'tam', adimlar: [['Çalışan telefon numarasını buraya yazar.', '#ph']] }] }],
  yazdirma: { ne: 'Belgeler ilgili sayfadan yazdırılır.', belgeler: [['Puantaj cetveli', '**Puantaj** sayfasında **Yazdır**.'], ['Vardiya planı', '**Vardiya Planı** sayfasında **Yazdır**.'], ['Bordro pusulası', '**Bordro & Avans** sayfası.'], ['Maaş ödeme listesi', '**Ödeme listesi**.'], ['Çalışma belgesi', '**Personel** sayfası.'], ['Tazminat dökümü', '**Kıdem / ihbar tazminatı hesapla** penceresinde **Yazdır**.']] },
  entegrasyon: {
    sgk: { degisir: ['SGK e-Bildirge bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar işe giriş ve çıkış bildirimini SGK ekranından kendiniz yaparsınız. Program bildirim göndermez.'], sorun: ['Bildirim sürelerini mali müşavirinizle takip edin.'] },
    pdks: { degisir: ['PDKS cihazı bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **PDKS’den aktar** puantaja kayıt işlemez, puantajı elle doldurursunuz.'], sorun: ['**PDKS TEST** uyarısında **Bugünü "çalıştı" doldur** düğmesini kullanın.'] },
    ebordro: { degisir: ['e-Bordro bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **e-Bordro gönder** pusula iletmez, TEST görünür. Pusulaları **Bordro pusulaları** ile basıp imzalatın.'], sorun: ['Pusula yazdırılamıyorsa **Belge şablonları** sayfasını kontrol edin.'] },
    bankamaas: { degisir: ['Toplu maaş ödeme bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **Bankaya talimat** para göndermez, TEST görünür. **Banka listesi (CSV)** dosyasını bankanıza kendiniz yüklersiniz.'], sorun: ['Personel kartında IBAN olduğunu kontrol edin.'] },
    backup: O.E.backup(),
  },
});
