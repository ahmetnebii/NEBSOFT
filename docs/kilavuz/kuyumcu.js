// Kuyumcu kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js kuyumcu
module.exports = (O) => {
  const ebelge = O.ebelge();
  return {
    ne: 'Kuyumcu programı has kuruna göre çalışır. Günün kurunu girersiniz, sikke, gram altın, takı ve hurda fiyatları buna göre hesaplanır. Satış, alış, kasa, has pozisyonu, müşteri altın hesabı, özel sipariş ve toptancı borcu tek programdadır.',
    kimler: 'Kuyumcular ve altın satış noktaları. Tek tezgâhlı dükkânda da, tezgâhtar çalışan yerde de kullanılır.',
    ilkNot: 'Yeni hesapta kur **Örnek veri** olarak gelir, gerçek piyasa fiyatı değildir. Gerçek işleme başlamadan **Kur & Fiyatlar** sayfasına güncel kuru girin. Örnek kurla gerçek işlem yapılamaz.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Güncel kuru, bugünkü satış ve alışı, kasadaki parayı, 30 günlük brüt kârı ve bugünkü işlemleri gösterir.',
        gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1100, adimlar: [['Kur şeridi has alış, has satış ve kaynağı gösterir. Kur eskiyse işlem öncesi uyarılırsınız.', '.btn@Kuru güncelle'], ['**Bugün satış** ve **Bugün alış** kutuları günün toplamıdır.', '.kpi@Bugün satış'], ['**Bugünkü işlemler** listesinde **Fiş** yeniden yazdırır, **İptal** işlemi geri alır.', 'h3@Bugünkü işlemler']] }] }] },

      { id: 'satis', ne: 'Sikke, gram altın ve takı satışı yapılır. Fiyat güncel kurdan hesaplanır. Kodlu takı okutulur, kodsuz takı **Tartılı takı** ile girilir.',
        gorevler: [
          { baslik: 'Satış yapma', sahneler: [
            { git: 'satis', en: 1400, boy: 860, adimlar: [['Takının kodunu okutun.', '#sc'], ['Sikke için hazır düğmelere basın.', 'button@Çeyrek Altın'], ['Kodsuz takı için **Tartılı takı** düğmesini kullanın.', '#free'], ['Müşteri için **Müşteri seç** düğmesine basın.', '#cs']] },
            { git: 'satis', once: [['tikla', 'button@Çeyrek Altın']], en: 1400, boy: 860, adimlar: [['Kalem sepette görünür. **Çıkar** satırı siler.', '#cart'], ['Ödeme türüne basın: **Nakit**, **Kredi kartı** veya **Havale**. Birden çok türde **Karma ödeme** kullanın.', 'button@Karma ödeme'], ['**İndirim** yetkiniz içinde indirim uygular.', '#disc']] }] },
          { baslik: 'Tartılı takı', sahneler: [{ git: 'satis', once: [['tikla', '#free']], kirp: 'pencere', adimlar: [['**Ürün**, **Ayar** ve **Gram** girin.', '.field@Gram'], ['**İşçilik türü** olarak **₺/gr** veya **Milyem** seçip **İşçilik** yazın.', '.field@İşçilik türü'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        not: 'Tutar **Kimlik tespiti sınırı (₺)** değerine ulaşırsa program müşterinin kimlik bilgisini ister.',
        hatalar: [['Önce has alış ve satış kurunu girin uyarısı çıkıyor.', '**Kur & Fiyatlar** sayfasından kuru kaydedin.'], ['Örnek kur gerçek işlemde kullanılamaz uyarısı çıkıyor.', 'Güncel kuru girin.'], ['Kimlik numarası geçersiz uyarısı çıkıyor.', 'Numarayı kontrol edin.'], ['Geçersiz indirim uyarısı çıkıyor.', 'İndirim sınırını **Ayarlar** sayfasından kontrol edin.'], ['Bu ürün satılmış uyarısı çıkıyor.', 'Kod daha önce satılmıştır.']] },

      { id: 'alis', ne: 'Müşteriden sikke veya hurda altın alımı yapılır. Hurda has üzerinden, kesinti düşülerek hesaplanır.',
        gorevler: [{ baslik: 'Alış yapma', sahneler: [{ git: 'alis', once: [['tikla', 'button@Çeyrek Altın']], en: 1400, boy: 900, adimlar: [['Sikke için hazır düğmelere basın.', 'button@Yarım Altın'], ['Hurda için **Hurda ayarı**, **Brüt gram** ve **Taş / fire düşümü (gr)** girip **Hurdayı ekle** düğmesine basın.', '#ah'], ['Alınanlar listelenir.', '#cart'], ['**Nakit öde** veya **Havale** ile bitirin. Makbuz yazdırılır.', 'button@Nakit öde']] }] }],
        hatalar: [['Gram ve taş ağırlığını kontrol edin uyarısı çıkıyor.', 'Düşüm brüt gramdan büyük olamaz.'], ['Kasada yeterli nakit yok uyarısı çıkıyor.', '**Havale** seçin veya kasaya para girin.']] },

      { id: 'kur', ne: 'Has alış ve satış kurunu, sikke farklarını, hurda kesintisini ve işçiliği tutar. Her kayıt **Kur geçmişi** kartına yazılır.',
        gorevler: [
          { baslik: 'Kuru girme', sahneler: [{ git: 'kur', en: 1400, boy: 1500, adimlar: [['**Alış (₺)**, **Satış (₺)** ve **Kur kaynağı** alanlarını doldurun.', '#rf'], ['**Kuru kaydet** düğmesine basın. Sikke ve ayar fiyatları yeniden hesaplanır.', '#sv'], ['**Kur servisinden çek** Ayarlar’da tanımlı adresten kuru alır.', '#fetch'], ['**TCMB döviz kuru** USD ve EUR bilgisini getirir.', '#fx'], ['**Vitrin ekranını aç** dükkândaki TV ekranını açar.', 'a@Vitrin ekranını aç']] }] }],
        alanlar: [['Sikke satış farkı %', 'Sikke satış fiyatına eklenen fark.'], ['Sikke alış farkı %', 'Sikke alış fiyatından düşülen fark.'], ['Hurda alış kesintisi %', 'Hurda alışta uygulanan kesinti.'], ['Varsayılan işçilik (₺/gr)', 'Yeni takıda önerilen işçilik.']],
        hatalar: [['Kur sıfır olamaz uyarısı çıkıyor.', 'Alış ve satış kurunu yazın.'], ['Satış kuru alıştan düşük olamaz uyarısı çıkıyor.', 'Kurları kontrol edin.'], ['Kur servisi adresi tanımlı değil uyarısı çıkıyor.', '**Ayarlar** sayfasındaki **Kur servisi adresi (JSON)** alanını doldurun.'], ['Kur alınamadı uyarısı çıkıyor.', 'Adresi kontrol edin veya kuru elle girin.']] },

      { id: 'kasa', ne: 'TL kasa hareketlerini, elde olan hası ve gün sonunu gösterir. **Net has pozisyonu** eldeki hasın toptancı borcu düşülmüş hâlidir.',
        gorevler: [
          { baslik: 'Kasa hareketi ve gün sonu', sahneler: [
            { git: 'kasa', boy: 900, adimlar: [['**Kasa hareketi** gider veya giriş kaydeder.', '#mv'], ['**Gün sonu** kasayı sayarak kapatır.', '#z'], ['**Net has pozisyonu** altın durumunuzu gösterir.', '.kpi@Net has pozisyonu']] },
            { git: 'kasa', once: [['tikla', '#z']], kirp: 'pencere', adimlar: [['Başlıkta beklenen tutar yazar. **Sayılan nakit (₺)** alanına sayımı yazın, **Kaydet** düğmesine basın. Gün sonu raporu çıkar.', '.field@Sayılan nakit']] }] }],
        hatalar: [['Tutar geçersiz uyarısı çıkıyor.', 'Tutarı sayı olarak yazın.']] },

      { id: 'stok', ne: 'Kodlu takı, sikke ve hurda stoğunu has karşılığıyla gösterir. Takı fiyatı güncel kurla değişir.',
        gorevler: [
          { baslik: 'Takı girişi', sahneler: [
            { git: 'stok', en: 1400, boy: 900, adimlar: [['**Takı girişi** düğmesine basın.', '#add'], ['**Etiket bas** stoktaki takıların etiketini yazdırır.', '#lbl'], ['**Sayım** sikke adetlerini eşitler.', '#cnt'], ['**Stokta**, **Satılan** veya **Tümü** ile süzün.', 'button@Satılan']] },
            { git: 'stok', once: [['tikla', '#add']], kirp: 'pencere', boy: 980, adimlar: [['**Ürün**, **Kategori** ve **Ayar** girin.', '.field@Kategori'], ['**Brüt gram** yazın.', '.field@Brüt gram'], ['Taş varsa **Taş ağırlığı (gr)** has hesabından düşülür.', '.field@Taş ağırlığı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Sikke sayımı', sahneler: [{ git: 'stok', once: [['tikla', '#cnt']], kirp: 'pencere', adimlar: [['Her sikkenin sayılan adedini yazıp **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        alanlar: [['İşçilik türü', '₺/gr veya milyem.'], ['Taş bedeli (₺)', 'Taşın fiyata eklenen bedeli.'], ['İmalatçı / tedarikçi', 'Takının geldiği yer.']],
        hatalar: [['Etiketlenecek ürün yok uyarısı çıkıyor.', 'Stokta takı kalmamıştır.']] },

      { id: 'musteriler', ne: 'Cari borcu ve eski altın hesabını tutar. Müşterinin yıllarca biriktirdiği altın hesabı burada izlenir, teslim edilince tutanakla kapatılır.',
        gorevler: [{ baslik: 'Müşteri işlemleri', sahneler: [
          { git: 'musteriler', en: 1400, adimlar: [['**Yeni müşteri** düğmesine basın.', '#add'], ['**Cari borcu olan** veya **Eski altın hesabı** ile süzün.', 'button@Cari borcu olan']] },
          { git: 'musteriler', once: [['tikla', '#add']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın.', '.field@Ad soyad'], ['Yüksek tutarlı işlem için **T.C. kimlik / pasaport (yüksek tutarlı işlem)** alanını doldurun.', '.field@T.C. kimlik'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        not: 'Satırda bakiye varsa **Cari tahsilat** ve **Altın hesabını kapat** simgeleri çıkar. Kapatırken **Altın hesabı teslim tutanağı** yazdırılır.',
        hatalar: [['Bakiyesi olan müşteri silinemez uyarısı çıkıyor.', 'Önce bakiyeyi kapatın.'], ['Tutar borçtan büyük olamaz uyarısı çıkıyor.', 'Tutarı düzeltin.'], ['Bakiye yetersiz uyarısı çıkıyor.', 'Hesapta bu kadar has yoktur.']] },

      { id: 'siparis', ne: 'Yüzük ölçüsü, isim kolye ve tamir işlerini tutar. Kapora kasaya işlenir, iş hazır olunca müşteriye haber verilir.',
        gorevler: [{ baslik: 'Sipariş izleme', sahneler: [
          { git: 'siparis', en: 1500, adimlar: [['**Yeni sipariş** düğmesine basın.', 'button@Yeni sipariş'], ['**Kapora al** ödeme kaydeder.', "button[title='Kapora al']"], ['**"Hazır" SMS** müşteriye haber verir. **Hazırlara SMS** bekleyen tümüne yollar.', '#smsall'], ['**Teslim et** kalan tutarı alıp işi kapatır.', "button[title='Teslim et']"]] },
          { git: 'siparis', once: [['tikla', 'button@Yeni sipariş']], kirp: 'pencere', adimlar: [['**Tür** ve **Müşteri** seçin.', '.field@Müşteri'], ['**Sipariş detayı** ve **Teslim tarihi** girin.', '.field@Sipariş detayı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Önce durumu "Hazır" yapın uyarısı çıkıyor.', 'Kaydı düzenleyip durumu değiştirin.'], ['Müşteri telefonu yok uyarısı çıkıyor.', 'Müşteri kartına telefon ekleyin.'], ['Bildirim bekleyen hazır sipariş yok uyarısı çıkıyor.', 'Hazır durumda bildirilmemiş iş yoktur.']] },

      { id: 'toptanci', ne: 'Toptancıya olan has ve TL borcunu izler. Hurdayı toptancıya vererek has borcu kapatılır. Bu sayfayı yalnız dükkân sahibi görür.',
        gorevler: [{ baslik: 'Borç ve ödeme', sahneler: [
          { git: 'toptanci', en: 1400, adimlar: [['**Mal alındı (borç)** borç yazar.', "button[title='Mal alındı (borç)']"], ['**Hurda ver** stoktaki hurdayla has borcu düşer.', "button[title='Hurda ver']"], ['**TL ödeme** TL borcu öder.', "button[title='TL ödeme']"]] },
          { git: 'toptanci', once: [['tikla', "button[title='Mal alındı (borç)']"]], kirp: 'pencere', adimlar: [['**Has borç (gr)**, **TL borç (işçilik vb.)** ve **Açıklama** girip **Kaydet** düğmesine basın.', '.field@Açıklama']] }] }],
        hatalar: [['Hurda stoğu yetersiz uyarısı çıkıyor.', 'Verilen has stoktan fazla olamaz.'], ['Hurda toptancıya verilmiş; alış iptal edilemez uyarısı çıkıyor.', 'Bu alış iptal edilmez.']] },

      { id: 'raporlar', ne: 'Seçilen dönemin satış, alış, işçilik geliri, brüt kâr ve ödeme dağılımını gösterir. **Özel matrah dökümü** ve kimlikli işlemler de buradadır. Rakamları mali müşavirinizle doğrulayın. Bu sayfayı yalnız dükkân sahibi görür.',
        gorevler: [{ baslik: 'Dönem raporu', sahneler: [{ git: 'raporlar', en: 1400, boy: 1300, adimlar: [['Tarihleri **Başlangıç** ve **Bitiş** alanlarından seçin.', '#f'], ['Üstteki kutular dönem toplamıdır.', '.kpi'], ['**Özel matrah dökümü** kartını **Dökümü Excel\'e aktar** ile dosyaya alın.', '#sb'], ['İşlem listesi için **Excel** düğmesini kullanın.', '#ex']] }] }] },

      O.imzali(),
      O.belgeler(),
      O.ayarlar({ alanlar: [['Kur servisi adresi (JSON)', 'Bağlı olduğunuz toptancının kur adresi.'], ['Kur en çok kaç dakika geçerli', 'Süre dolunca işlemde onay istenir.'], ['Kimlik tespiti sınırı (₺)', 'Bu tutara ulaşan işlemde kimlik istenir.'], ['Onaysız en çok indirim %', 'Bu oranın üstü onay ister.'], ['Satış fişi notu', 'Satış fişinin altındaki metin.'], ['Alış makbuzu notu', 'Alış makbuzunun altındaki metin.']] }),
      O.bildirimler(),
      { ...ebelge, ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. Satış ekranında fatura kesen düğme yoktur, faturayı **Manuel e-Arşiv** ile bu sayfadan kesersiniz. Entegratör bağlanmadan belgeler TEST görünür, GİB’e gitmez.', hatalar: [['Belge TEST olarak görünüyor.', '**Entegrasyonlar** sayfasında e-Fatura kartından entegratörünüzü bağlayın. TEST belgeler resmî belge değildir.']] },
      O.entegrasyonlar(),
    ],
    roller: 'Tezgâhtar satış, alış, kasa, stok, müşteri ve sipariş ekranlarıyla çalışır. **Onaysız en çok indirim %** üstü ve eski kurla işlem dükkân sahibi onayı ister.',
    musteri: [{ ad: 'Vitrin ekranı', ne: 'Dükkândaki TV’ye bağlı bilgisayarda tam ekran açılan fiyat ekranıdır. Müşteri işlem yapmaz, güncel altın fiyatlarını görür. Adresi **Kur & Fiyatlar** sayfasındaki **Vitrin ekranını aç** düğmesiyle açarsınız.',
      sahneler: [{ adres: 'ekran.html', ilk: 900, kirp: 'tam', adimlar: [['Fiyatlar kayıtlı kurdan hesaplanır.', null]] }] }],
    yazdirma: { ne: 'Belgeler işlem sırasında veya raporlardan yazdırılır.', belgeler: [['Satış fişi ve alış makbuzu', 'İşlem bitince veya listedeki **Fiş** düğmesi.'], ['Etiketler', '**Stok** sayfasında **Etiket bas**.'], ['Gün sonu raporu', '**Kasa** sayfasında **Gün sonu**.'], ['Altın hesabı teslim tutanağı', '**Altın hesabını kapat** sırasında.'], ['Tahsilat makbuzu', '**Cari tahsilat** sırasında.']] },
    entegrasyon: {
      sms: { degisir: ['**Entegre et** ile sağlayıcıyı seçip bilgileri girersiniz. **Bağlantıyı dene** hesap bakiyesini okur, ileti göndermez. **Bağlı** yazısı görünmeden SMS gönderilmez.', '**Sipariş & Tamir** sayfasındaki **"Hazır" SMS** ve **Hazırlara SMS** gerçek mesaj gönderir. Bağlantı yokken kayıt TEST olur, müşteriye gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kartında telefon olduğunu kontrol edin.'] },
      efatura: { degisir: ['**e-Belgeler** sayfasındaki **Manuel e-Arşiv** düğmesi belgeyi entegratöre gönderir. Satış ekranında fatura kesen düğme yoktur.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Sağlayıcının altındaki sınırı okuyun.', 'Simülasyonda belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Belge kesilmezse **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
      backup: O.E.backup(),
    },
  };
};
