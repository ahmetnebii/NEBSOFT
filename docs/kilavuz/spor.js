// Spor Salonu kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js spor
const KAP = 'NEBSOFT ile iletişime geçerek açtırılır.';
module.exports = (O) => ({
  ne: 'Spor Salonu programı üyelikleri, paketleri, taksitleri, salon girişlerini, grup derslerini, ürün satışını ve raporları yönetir. Üyeler üye portalından dijital kartını, ders rezervasyonunu, ölçümlerini ve ödemelerini görür.',
  kimler: 'Spor salonları, fitness merkezleri, pilates ve yoga stüdyoları, dövüş sporları kulüpleri.',
  ilkNot: 'Önce **Paketler** sayfasına üyelik paketlerinizi girin. Üye kaydı paket seçilerek yapılır.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Aktif üyeyi, bugünkü girişi, içerideki kişi sayısını, 30 günlük tahsilatı, vadesi geçmiş tutarı ve saatlik yoğunluğu gösterir.',
      gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['**Aktif üye**, **Bugün giriş**, **30 gün tahsilat** ve **Vadesi geçmiş** kutuları günün özetidir.', '.kpi'], ['**Üye portalı** üyenin gördüğü sayfayı açar.', 'a@Üye portalı'], ['**Giriş kontrol** kapı ekranına götürür.', 'a@Giriş kontrol'], ['**Yeni üye** kayıt penceresini açar.', '#nm']] }] }] },

    { id: 'giris', ne: 'Danışmada veya kapıda açık duran ekrandır. Üye kartı okutulur, üye no veya telefon yazılır. Program üyeliğin geçerliliğini gösterir ve girişi kaydeder.',
      gorevler: [{ baslik: 'Üye girişi alma', sahneler: [{ git: 'giris', kirp: 'ana', adimlar: [['Kart okutun veya üye no ya da telefon yazıp Enter’a basın.', '#gi']] }] }],
      hatalar: [['Üye bulunamadı uyarısı çıkıyor.', 'Üye no veya telefonu kontrol edin, **Üyeler** sayfasından arayın.'], ['Üyenin ders hakkı yok uyarısı çıkıyor.', 'Paketteki ders hakkı bitmiştir. Üyeliği yenileyin.']] },

    { id: 'uyeler', ne: 'Üyeleri, paketini, bitiş tarihini, durumunu, borcunu ve son girişini listeler. Üyeye girince taksitler, ölçümler ve üyelik işlemleri açılır.',
      gorevler: [
        { baslik: 'Üye kaydı', sahneler: [
          { git: 'uyeler', kirp: 'ana', adimlar: [['**Yeni üye** kayıt penceresini açar.', '#nm'], ['**Aktif**, **Bitiyor**, **Süresi dolan**, **Borçlu** ve **Dondurulan** süzgeçleriyle listeyi daraltın.', 'button@Bitiyor'], ['Oklu düğme listeyi dosyaya alır.', '#ex'], ['Satırdaki göz simgesi üye kartını açar.', '[data-act=v]']] },
          { git: 'uyeler', once: [['tikla', '#nm']], kirp: 'pencere', boy: 1000, adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Acil durum telefonu** ve **Sağlık notu** eğitmen için önemlidir.', '.field@Sağlık notu'], ['**Paket** ve **Başlangıç** seçin.', '.field@Paket'], ['**Taksit sayısı**, **İndirim (₺)** ve **İlk ödeme** alanlarını doldurun.', '.field@Taksit sayısı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Üye kartında çalışma', sahneler: [{ git: 'uyeler', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 1100, adimlar: [['**Üye portalı kodu** üyenin portala gireceği kodu üretir.', '#ptl'], ['**Yenile / paket değiştir** üyeliği uzatır.', 'button@Yenile / paket değiştir'], ['**Dondur** üyeliği belirli gün için durdurur. Hak **Ayarlar** sayfasından gelir.', 'button@Dondur'], ['**Üyeliği iptal et** iade tutarını ve kalan borcu sorar.', 'button@Üyeliği iptal et'], ['**Ölçüm ekle** kilo, yağ, kas ve bel ölçüsü girer.', 'button@Ölçüm ekle']] }] }],
      alanlar: [['Cinsiyet', 'Üye kartında görünür.'], ['Doğum tarihi', 'Yaş hesabında kullanılır.']],
      hatalar: [['Üye portala giremiyor.', 'Üye kartındaki **Üye portalı kodu** ile kodu verin. Telefon kayıttakiyle aynı olmalıdır.']] },

    { id: 'dersler', ne: 'Haftalık grup derslerini gösterir. Derse tıklayınca katılımcı eklenir, ders silinir. Üyeler portal üzerinden de yer ayırır.',
      gorevler: [{ baslik: 'Ders ekleme ve katılımcı yazma', sahneler: [
        { git: 'dersler', kirp: 'ana', boy: 900, en: 1450, adimlar: [['Oklar ve **Bu hafta** düğmesi haftalar arasında geçirir.', 'button@Bu hafta'], ['**Ders ekle** programa yeni ders koyar.', '#nc']] },
        { git: 'dersler', once: [['tikla', '#nc']], kirp: 'pencere', adimlar: [['**Ders adı**, **Gün**, **Saat**, **Süre (dk)**, **Eğitmen** ve **Kontenjan** alanlarını doldurun.', '.field@Ders adı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] },
        { git: 'dersler', once: [['tikla', '[data-c]']], kirp: 'pencere', adimlar: [['Üyeyi listeden seçin, **Ekle** düğmesine basın.', '#am'], ['**Dersi sil** dersi programdan kaldırır.', 'button@Dersi sil']] }] }] },

    { id: 'tahsilat', ne: 'Üyelik, taksit ve ürün satışlarını gösterir. Sayfanın adı içeride **Tahsilatlar** olarak yazar. Eğitmen rolü bu sayfayı görmez.',
      gorevler: [{ baslik: 'Ürün veya PT satışı', sahneler: [
        { git: 'tahsilat', kirp: 'ana', adimlar: [['**7 gün**, **30 gün** ve **90 gün** ile dönemi seçin.', 'button@30 gün'], ['**Ürün / PT satışı** satış penceresini açar.', '#sale']] },
        { git: 'tahsilat', once: [['tikla', '#sale']], kirp: 'pencere', adimlar: [['**Ürün / hizmet**, **Adet**, **Üye** ve **Ödeme** seçin. Üye yoksa **Misafir** seçili kalır.', '.field@Ürün / hizmet'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'paketler', ne: 'Üyelik paketlerini, süresini, ders hakkını ve fiyatını tutar. Sayfanın adı içeride **Üyelik Paketleri** olarak yazar. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Paket ekleme', sahneler: [{ git: 'paketler', once: [['tikla', 'button@Yeni paket']], kirp: 'pencere', adimlar: [['**Paket adı**, **Süre (ay)** ve **Fiyat (₺)** zorunludur.', '.field@Paket adı'], ['**Ders hakkı (boş = sınırsız)** paketteki ders sayısıdır. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'egitmenler', ne: 'Eğitmenleri, branşını ve verdiği ders sayısını tutar. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Eğitmen ekleme', sahneler: [{ git: 'egitmenler', once: [['tikla', 'button@Yeni eğitmen']], kirp: 'pencere', adimlar: [['**Ad**, **Branş**, **Telefon** ve **Renk** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'urunler', ne: 'Satılan ürünleri ve kişisel antrenman gibi hizmetleri, fiyatı ve stoğu tutar. Sayfanın adı içeride **Ürünler & Hizmetler** olarak yazar. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Ürün ekleme', sahneler: [{ git: 'urunler', once: [['tikla', 'button@Yeni ürün']], kirp: 'pencere', adimlar: [['**Ad**, **Fiyat** ve **Stok** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'raporlar', ne: 'Gelir, üye kazanımı, yoğunluk, eğitmen performansı ve kayıp riski taşıyan üyeleri gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'raporlar', kirp: 'ana', boy: 1100, adimlar: [['**Toplam üye**, **Aktif oran**, **Devam oranı** ve **Ort. aylık gelir** özet değerlerdir.', '.kpi']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Üyelik sözleşmesi' }),
    O.ayarlar({ alanlar: [['Üyelik başına toplam dondurma hakkı (gün)', 'Bir üyeliğin en çok kaç gün dondurulabileceği.'], ['Üyelik iptal bedeli (₺, yoksa boş)', 'İptal penceresinde kullanılan bedel.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Eğitmen rolü tahsilat ve yönetim sayfalarını görmez. Danışma rolü üye, giriş ve tahsilatta çalışır.',
  musteri: [{ ad: 'Üye portalı', ne: 'Üye telefon numarası ve salondan aldığı giriş koduyla girer. Dijital üye kartını, ders rezervasyonunu, ölçüm grafiklerini ve ödemelerini görür. Derse 2 saatten az kala iptal yapılamaz. Üyelik dondurma ve yenileme portal üzerinden de istenir. Portalda kartla ödeme alınmaz, ödeme bilgisi gösterilir ve üye salonda veya havaleyle öder. Giriş kodunu üye kartındaki **Üye portalı kodu** düğmesiyle verirsiniz.',
    sahneler: [
      { adres: 'uye.html', ilk: 800, kirp: 'tam', adimlar: [['Üye telefonunu bu kutuya yazar.', '#ph'], ['Salondan aldığı kodu yazıp **Giriş** düğmesine basar.', '#cd']] },
      { adres: 'uye.html', ilk: 800, kirp: 'tam', boy: 1000, once: [['tikla', '#hint'], ['tikla', '#go']], adimlar: [['Girişten sonra üye kartı ve sekmeler görünür.', '#root']] }] }],
  yazdirma: { ne: 'Sözleşme ve formlar **İmzalı belgeler** sayfasından imzalatılıp yazdırılır.', belgeler: [['Üyelik sözleşmesi', '**İmzalı belgeler** sayfası.'], ['Sağlık beyan formu', '**İmzalı belgeler** sayfası.']] },

  entegrasyon: {
    turnike: { kapali: { '*': KAP }, degisir: [`Turnike ve kart okuyucu bağlantısı ${KAP}`, 'Bağlantı olmadan kapı açılmaz. **Giriş Kontrol** ekranı girişi kaydeder, kapıyı siz açarsınız.'], sorun: ['USB kart okuyucu klavye gibi çalışır, imleç giriş kutusundayken okutun.'] },
    payment: { degisir: ['Bu programda online tahsilat ekranı yoktur. Online ödeme kartı e-ticaret vitrininde kullanılır.', 'Üye portalı ödeme bilgisini gösterir, üye salonda veya havaleyle öder.'], sorun: ['Tahsilatı **Tahsilat & Satış** sayfasına veya üye kartına kendiniz işleyin.'] },
    whatsapp: O.E.whatsappLink('Üye kartındaki **WhatsApp hatırlatma** düğmesi'),
    sms: { degisir: ['**Raporlar** sayfasındaki kayıp riski listesinden gelmeyen üyelere gerçek SMS gider.', 'Bağlantı yokken mesaj gitmez.'], sorun: ['Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.', 'Kayıttaki telefon numarasını kontrol edin.'] },
    efatura: { degisir: ['Belgeyi **e-Belgeler** sayfasındaki **Manuel e-Arşiv** ile keserseniz entegratöre gider. Tahsilat ekranında fatura düğmesi yoktur.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Sağlayıcının altındaki sınırı okuyun.', 'Simülasyonda belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Belge kesilmezse **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
