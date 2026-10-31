// Araç Kiralama kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js kiralama
const KAP = 'NEBSOFT ile iletişime geçerek açtırılır.';
module.exports = (O) => ({
  ne: 'Araç Kiralama programı filonuzu, rezervasyonları, teslim ve iadeyi, depozitoyu, masrafları ve araç kârlılığını yönetir. Müsaitlik takvimi çakışmayı önler. Online kiralama sayfasından müşteriler kendileri rezervasyon yapabilir.',
  kimler: 'Rent a car işletmeleri, havalimanı ofisleri ve filosunu kiralayan küçük ve orta ölçekli firmalar.',
  ilkNot: '**Ayarlar** sayfasındaki **Kiralama kuralları** bölümünü ilk kiralamadan önce doldurun. Km limiti, yakıt ücreti, yaş ve ehliyet şartı buradan gelir.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Kiradaki ve müsait araçları, 30 günlük kullanım ve ciroyu, bugünün teslim ve iadelerini, bakım ve evrak hatırlatmalarını gösterir.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['**Kirada**, **Müsait**, **30 gün kullanım** ve **30 gün ciro** kutuları filonun durumudur.', '.kpi'], ['**Online kiralama** müşterinin sayfasını açar.', 'a@Online kiralama'], ['**Kiralama** yeni kayıt açar.', '#nr'], ['Yarınki alış ve iadeler için hatırlatma düğmesi SMS gönderilmek ister.', '#sm']] }] }] },

    { id: 'takvim', ne: 'Araçları satırlarda, günleri sütunlarda gösterir. **Rezervasyon**, **Kirada**, **Tamamlandı** ve **Bakımda** durumları renkle ayrılır. Boş günü görmek için kullanın.',
      gorevler: [{ baslik: 'Müsaitlik görme', sahneler: [{ git: 'takvim', kirp: 'ana', en: 1450, adimlar: [['**Bugün** düğmesi takvimi bugüne getirir.', 'button@Bugün'], ['Satırlar araçtır, renkli çubuklar kiralamalardır.', '#gt'], ['**Kiralama** yeni kayıt açar.', '#nr']] }] }] },

    { id: 'kiralamalar', ne: 'Tüm rezervasyon ve kiralamaları listeler. Satırı açınca teslim, iade, ödeme, masraf, depozito, sözleşme ve tutanak işlemleri buradan yapılır.',
      gorevler: [
        { baslik: 'Yeni kiralama açma', sahneler: [
          { git: 'kiralamalar', kirp: 'ana', adimlar: [['**Rezervasyon**, **Kirada**, **Geciken**, **Tamamlanan** ve **İptal** ile listeyi süzün.', 'button@Geciken'], ['**Excel** listeyi dosyaya alır.', '#xl'], ['**Kiralama** yeni kayıt açar.', '#nr']] },
          { git: 'kiralamalar', once: [['tikla', '#nr']], kirp: 'pencere', boy: 1050, adimlar: [['**Müşteri** seçin, yoksa **Yeni** ile ekleyin.', '#fc'], ['**Alış tarihi**, **Alış saati**, **İade tarihi** ve **İade saati** alanlarını doldurun. Müsait araç sayısı başlıkta yazar.', '#ff'], ['Listeden aracı seçin. **Günlük fiyat** araçtan ve sezon oranından gelir.', '#fa'], ['Gerekiyorsa **Ek hizmetler** bölümünü işaretleyin.', '.field@Ek hizmetler'], ['**Kanal** ve **Depozito** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Rezervasyonu teslim etme', ne: 'Satırı açın, **Aracı teslim et** düğmesine basın. Çıkış km, yakıt, depozito ve peşin tahsilat girilir, **Teslim — kiracı imzası** adımında kiracı imzalar. Alış tarihinden önce teslim için önce tarihi düzenleyin.', sahneler: [{ git: 'kiralamalar', once: [['tikla', '[data-act=v]']], kirp: 'pencere', adimlar: [['**Aracı teslim et** teslim penceresini açar.', 'button@Aracı teslim et'], ['**Sözleşme** kiralama sözleşmesini yazdırır.', 'button@Sözleşme'], ['**Düzenle** tarih ve aracı değiştirir, **İptal** rezervasyonu kapatır.', 'button@Düzenle']] }] },
        { baslik: 'İade alma', ne: 'Kiradaki araçta **İade al** düğmesine basın. Dönüş km, yakıt ve yeni hasarı yazın. Km aşımı ve yakıt farkı **Ayarlar** değerlerinden hesaplanır. **Erken iade: kullanılmayan günler ücretlendirilmesin** kutusu erken dönüşte kullanılır.', sahneler: [{ git: 'kiralamalar', once: [['tikla', 'button@Kirada'], ['tikla', '[data-act=v]']], kirp: 'pencere', adimlar: [['**İade al** iade penceresini açar.', 'button@İade al'], ['**Ödeme al** tahsilat girer. **Masraf ekle** ceza, köprü gibi kalemleri sözleşmeye yazar.', 'button@Ödeme al']] }] }],
      alanlar: [['Kanal', 'Müşterinin geldiği yer. **Raporlar** sayfasındaki kanal dağılımını oluşturur.'], ['Depozito', 'Teslimde alınır, iade sonrası **Depozito kapatma** ile kapatılır.'], ['Hasar bedeli (₺)', 'Yeni hasar varsa yazılır, açıklama zorunludur.'], ['Bildirim numarası (yetkili sistemden)', 'Emniyet bildirimini kendiniz yaptıysanız numarasını buraya yazarsınız.']],
      hatalar: [['Bu tarihlerde müsait araç yok uyarısı çıkıyor.', 'Tarihi değiştirin veya **Müsaitlik Takvimi** sayfasına bakın.'], ['Kara listedeki müşteriye kiralama yapılamaz uyarısı çıkıyor.', 'Müşteri kartında **Kara liste** işaretlidir.'], ['Bu araç kiralamaya kapalı uyarısı çıkıyor.', 'Araç **Bakımda** veya **Satıldı / pasif** durumundadır.'], ['İade tarihi alıştan sonra olmalı uyarısı çıkıyor.', 'Tarihleri kontrol edin.'], ['Hasar bedeli için açıklama yazın uyarısı çıkıyor.', '**Yeni hasar açıklaması (yoksa boş)** alanını doldurun.'], ['Kesinti kalan borçtan büyük olamaz uyarısı çıkıyor.', 'Önce masrafı sözleşmeye ekleyin, sonra depozitoyu kapatın.'], ['Araç hâlâ başka kiralamada uyarısı çıkıyor.', 'Önceki kiralamanın iadesini alın.']] },

    { id: 'musteriler', ne: 'Kiracıları, ehliyet bilgisini, kiralama sayısını ve ciroyu tutar. **Kara liste** süzgeci sorunlu müşterileri gösterir.',
      gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
        { git: 'musteriler', kirp: 'ana', adimlar: [['**Yeni müşteri** düğmesine basın.', 'button@Yeni müşteri'], ['**Kara liste** süzgeci işaretli müşterileri gösterir.', 'button@Kara liste']] },
        { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', boy: 900, adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Ehliyet no** ve **Ehliyet tarihi** sözleşmeye yazılır, ehliyet yılı kontrolünde kullanılır.', '.field@Ehliyet no'], ['**Kara liste** işaretlenirse **Kara liste nedeni** yazın, **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'filo', ne: 'Araçları, sınıfını, günlük fiyatını, km bilgisini, sigorta ve muayene tarihlerini ve 90 günlük cirosunu tutar. Sayfanın adı içeride **Filo** olarak yazar.',
      gorevler: [{ baslik: 'Araç ekleme', sahneler: [
        { git: 'filo', kirp: 'ana', adimlar: [['**Yeni araç** düğmesine basın.', 'button@Yeni araç']] },
        { git: 'filo', once: [['tikla', 'button@Yeni araç']], kirp: 'pencere', boy: 950, adimlar: [['**Plaka**, **Marka** ve **Model** zorunludur.', '.field@Plaka'], ['**Günlük fiyat** yazın. **Sınıf** sezon oranında ve online sayfada kullanılır.', '.field@Günlük fiyat'], ['**Sonraki bakım km**, **Sigorta bitiş** ve **Muayene bitiş** hatırlatmaları besler.', '.field@Sonraki bakım km'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Günlük fiyat girin uyarısı çıkıyor.', 'Araç kartındaki **Günlük fiyat** alanını doldurun.']] },

    { id: 'bakim', ne: 'Servis, lastik ve onarım kayıtlarını tutar. Sayfa araç kârlılığındaki masrafı besler.',
      gorevler: [{ baslik: 'Bakım kaydı ekleme', sahneler: [
        { git: 'bakim', kirp: 'ana', adimlar: [['**Yeni kayıt** düğmesine basın.', 'button@Yeni kayıt']] },
        { git: 'bakim', once: [['tikla', 'button@Yeni kayıt']], kirp: 'pencere', adimlar: [['**Araç**, **İşlem** ve **Tutar** girin.', '.field@İşlem'], ['**Araç hâlâ serviste** işaretliyse araç takvimde **Bakımda** görünür. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'sezon', ne: 'Tarih aralığında günlük fiyatı artırır veya azaltır. Panelde ve online kiralamada aynı hesap kullanılır. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Sezon tanımlama', sahneler: [{ git: 'sezon', once: [['tikla', 'button@Yeni sezon']], kirp: 'pencere', adimlar: [['**Ad**, **Başlangıç** ve **Bitiş** girin.', '.field@Ad'], ['**Oran % (indirim için eksi)** yazın. **Sınıf (boş = tümü)** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'raporlar', ne: 'Son 90 günün cirosunu, bakım masrafını, kullanımı, açık alacağı, bekleyen depozitoyu, kanal dağılımını ve araç bazlı kârlılığı gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Kârlılık okuma', sahneler: [{ git: 'raporlar', kirp: 'ana', boy: 1000, adimlar: [['Üstteki kutular dönemin özetidir.', '.kpi'], ['**Excel** araç tablosunu dosyaya alır.', '#xl']] }] }] },

    O.belgeler({ tur: 'Kiralama sözleşmesi' }),
    O.ayarlar({ alanlar: [['Günlük km limiti', 'Aşan km için ücret alınır.'], ['Aşım km ücreti (₺)', 'Limit üstü her km ücreti.'], ['Çeyrek depo yakıt ücreti (₺)', 'Eksik yakıtta uygulanır.'], ['Minimum yaş', 'Online rezervasyonda kontrol edilir.'], ['Minimum ehliyet yılı', 'Online rezervasyonda kontrol edilir.'], ['Geç iade toleransı (saat)', 'Bu sürenin üstü geç iade sayılır.'], ['Uzun kiralama günü', 'İndirimin başladığı gün sayısı.'], ['Uzun kiralama indirimi %', 'Uzun kiralamada uygulanan oran.'], ['Ücretsiz iptal (saat önce)', 'Müşterinin ücretsiz iptal süresi.'], ['KDV oranı % (fiyatlar KDV dahil)', 'Belgelerde kullanılan oran.']] }),
    O.bildirimler(),
    { ...O.ebelge(), not: 'Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur. Tamamlanan kiralamadaki **Fatura kes** düğmesi bu yüzden TEST belge oluşturur.' },
    O.entegrasyonlar(),
  ],

  roller: 'Ofis personeli kiralama, müşteri, araç ve bakım sayfalarında çalışır. Sezon fiyatları, raporlar ve ayarlar yöneticiye aittir.',
  musteri: [{ ad: 'Online kiralama sayfası', ne: 'Müşteri üyelik açmadan tarih seçer, sınıfa göre araç görür, ek hizmetleri işaretler ve rezervasyon yapar. Yaş ve ehliyet şartı **Ayarlar** değerlerinden kontrol edilir. **Rezervasyonum** bölümünde rezervasyon numarası ve telefonla kaydını görür, süresi içindeyse iptal eder.',
    sahneler: [{ adres: 'kirala.html', ilk: 900, kirp: 'tam', boy: 760, adimlar: [['Müşteri tarihleri seçer, **Araç bul** düğmesine basar.', '#sf'], ['**Rezervasyonum** kaydını açar.', 'a@Rezervasyonum']] }],
    not: 'Sayfada kart bilgisi istenmez, ödeme araç teslim alınırken yapılır. Rezervasyon için müşteri kiralama koşullarını ve kişisel veri bilgilendirmesini işaretlemek zorundadır.' }],
  yazdirma: { ne: 'Belgeler kiralama penceresinden yazdırılır. Sözleşme ve tutanakta kiracı imzası ekranda alınır.', belgeler: [['Kiralama sözleşmesi', 'Kiralama penceresinde **Sözleşme**.'], ['Teslim ve iade tutanağı', 'Kiralama penceresinde **Tutanak**.'], ['Depozito kapatma belgesi', 'Kiralama penceresinde **Depozito belgesi**.']] },

  entegrasyon: {
    aracbildirim: { kapali: { '*': KAP }, degisir: [`Emniyet kiralık araç bildirimi ${KAP}`, 'Bu bağlantı olmadan bildirim programdan gitmez. Bildirimi yetkili sistemden kendiniz yapın, numarasını kiralama penceresindeki **Bildirim kaydı** ile yazın.'], sorun: ['Yetkili sistemden aldığınız numarayı **Bildirim numarası (yetkili sistemden)** alanına yazın.'] },
    hgs: { kapali: { '*': KAP }, degisir: [`HGS ve OGS geçiş sorgusu ${KAP}`, 'Bağlantı olmadan geçiş sorgulanmaz. Geçiş ücretlerini **Masraf ekle** ile elle girin.'], sorun: ['Geçiş bilgisini kendi HGS kanalınızdan alıp masraf olarak yazın.'] },
    gps: { kapali: { '*': KAP }, degisir: [`Araç takip bağlantısı ${KAP}`, 'Bağlantı olmadan iade km değerini siz yazarsınız.'], sorun: ['Km değerini araç göstergesinden okuyun.'] },
    backup: O.E.backup(),
  },
});
