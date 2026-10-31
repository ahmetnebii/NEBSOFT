// Eğitim & Sertifika Merkezi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js egitim
const GRUP = [['tikla', '[data-act=v]']]; // Süren grupların ilki
const BITEN = [['tikla', '[data-f=bit]'], ['tikla', '[data-act=v]'], ['tikla', '[data-tab=belge]']];
const ILETISIM = 'NEBSOFT ile iletişime geçerek açtırılır.';
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında Entegre et düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, Bağlantıyı dene ile deneyin. ${deneme} Sonuç başarılıysa kart Bağlı görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz Bağlantıyı dene adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Eğitim & Sertifika, kısa dönemli eğitimlerin kataloğunu, gruplarını, kursiyerlerini, yoklamasını, notunu, taksitini ve sertifikasını yönetir. Üretilen belge kurumun kendi belgesidir, doğrulama sayfası yalnız kurum kaydını gösterir.',
  kimler: 'Mesleki eğitim merkezleri, seminer ve sertifikalı kurs veren kurumlar. Sınıf ve deneme sınavı odaklı kurumlar için Kurs & Etüt programı daha uygundur.',
  ilkNot: 'Program e-Devlet veya MEB sistemine bağlı değildir. Belge resmî geçerlilik sağlamaz, belgenin üzerinde de bu yazar.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Aktif kursiyer, süren grup, geciken taksit, belge bekleyen kursiyer, bugünkü oturumlar ve grupları gösterir. Eğitmen kendi gruplarını görür, tutarları görmez.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', adimlar: [['Üstteki kutular **Aktif kursiyer**, **Süren grup**, **Geciken taksit** ve **Belge bekleyen** değerleridir.', '.kpi'], ['**Yeni kayıt** kayıt formunu açar.', '#ne'], ['**Bugünkü oturumlar** günün derslerini ve yoklama durumunu gösterir.', '.card@Bugünkü oturumlar']] }] }] },

    { id: 'gruplar', ne: 'Eğitim gruplarını, tarihlerini, eğitmenini ve kontenjanını tutar. Grup açılınca oturumlar günlere göre kendiliğinden oluşur. Grup kartında kursiyerler, oturumlar, notlar ve sertifikalar bulunur.',
      gorevler: [
        { baslik: 'Grup açma', sahneler: [
          { git: 'gruplar', kirp: 'ana', adimlar: [['**Yeni grup** formu açar.', '#ng'], ['**Süren / gelecek** ve **Biten** ile listeyi süzün.', '[data-f=bit]'], ['Gruba girmek için bu simgeye basın.', '[data-act=v]']] },
          { git: 'gruplar', once: [['tikla', '#ng']], kirp: 'pencere', adimlar: [['**Eğitim** seçin, **Grup adı** yazın.', '.field@Grup adı'], ['**Başlangıç** ve **Bitiş** tarihlerini girin.', '.field@Başlangıç'], ['Ders günlerini virgülle yazın: 1 pazartesi, 7 pazar. Örnek: 2,4', '.field@Günler'], ['**Kontenjan** dolarsa kayıtta onay sorulur.', '.field@Kontenjan'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Yoklama alma', ne: 'Yalnız yoklaması alınan oturumlar devam oranına girer.', sahneler: [
          { git: 'gruplar', once: [...GRUP, ['tikla', '[data-tab=oturum]']], kirp: 'ana', adimlar: [['Üstte **Kayıt**, **Oturum**, **Saat** ve **Belgeye hazır** görünür.', '.kpi'], ['**Kursiyerler**, **Oturumlar** ve **Not & Sertifika** sekmeleri arasında geçin.', '.seg'], ['**Yoklama listesi** imza kâğıdını yazdırır.', '#pr'], ['Satırdaki **Yoklama** düğmesine basın.', '[data-act=att]']] },
          { git: 'gruplar', once: [...GRUP, ['tikla', '[data-tab=oturum]'], ['tikla', '[data-act=att]']], kirp: 'pencere', boy: 900, adimlar: [['İşlenen konuyu yazın.', '#tp'], ['Gelmeyenin işaretini kaldırın.', '[data-y]'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Not girme ve sertifika üretme', ne: 'Şartlar **Ayarlar** sayfasından belirlenir. Eksik olan satırda ne eksik olduğu yazar. Şartı sağlamayan kursiyere belge **Şartsız belge** ile verilir, neden ve yönetici onayı ister. Üretilen belge bildirimi kursiyere SMS ile gider.', sahneler: [{ git: 'gruplar', once: BITEN, kirp: 'ana', boy: 950, adimlar: [['Notları yazıp **Notları kaydet** düğmesine basın.', '#sv'], ['**Hazır olanlara belge üret** şartı tamam olanlara sertifika üretir.', '#bulk'], ['Not 0 ile 100 arasında olmalıdır.', '[data-sc]']] }] }],
      alanlar: [['Eğitmen', 'Grubu yürüten kişi.'], ['Derslik', 'Dersin yapıldığı yer.'], ['Saat', 'Oturum başlangıcı.'], ['Oturum süresi (saat)', 'Devam ve hakediş hesabında kullanılır.']],
      hatalar: [['Önce bir eğitim tanımlayın uyarısı çıkıyor.', '**Eğitim Kataloğu** sayfasından eğitim ekleyin.'], ['Bitiş başlangıçtan önce olamaz uyarısı çıkıyor.', 'Tarihleri kontrol edin.'], ['Gün girin uyarısı çıkıyor.', 'Günleri rakamla ve virgülle yazın.']] },

    { id: 'kursiyerler', ne: 'Kursiyerleri, eğitimlerini, devamını, notunu ve kalan ödemesini gösterir. Eğitmen yalnız kendi gruplarındaki kursiyerleri görür.',
      gorevler: [
        { baslik: 'Yeni kayıt', sahneler: [
          { git: 'kursiyerler', kirp: 'ana', adimlar: [['**Yeni kayıt** düğmesine basın.', '#ne'], ['Arama kutusuna ad, telefon veya numara yazın.', '#q'], ['Bu düğme listeyi dosyaya alır.', '#ex']] },
          { git: 'kursiyerler', once: [['tikla', '#ne']], kirp: 'pencere', boy: 900, adimlar: [['Kayıtlı kursiyeri seçin veya **Ad soyad (yeni kursiyer)** yazın.', '.field@Kayıtlı kursiyer'], ['**Grup** seçin.', '.field@Grup'], ['**Ücret (₺)** boşsa eğitim ücreti alınır.', '.field@Ücret'], ['**Taksit sayısı** ve **İlk vade** ödeme planını oluşturur, taksitler 30 gün arayla gelir.', '.field@Taksit sayısı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Kursiyer kartı', ne: 'Kartta her eğitim için devam, not, kalan ödeme, sertifika için eksikler ve taksitler görünür. **Ayrıldı** ödenmemiş taksitleri iptal eder, iade tutarını siz yazarsınız, program hesap yapmaz.', sahneler: [{ git: 'kursiyerler', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 950, adimlar: [['**Düzenle** kişi bilgilerini değiştirir.', '#ed'], ['**Yeni eğitim** aynı kişiyi başka gruba kaydeder.', '#ne'], ['**Kayıt formu** eğitim kayıt formunu yazdırır.', '[data-sz]'], ['**Tahsil et** taksiti öder, makbuz açılır.', '[data-act=pay]']] }] }],
      hatalar: [['Bu kursiyer zaten bu grupta uyarısı çıkıyor.', 'Aynı kişi aynı gruba iki kez kaydedilmez.'], ['Önce bir grup açın uyarısı çıkıyor.', '**Gruplar** sayfasından grup açın.'], ['Kursiyer seçin veya adını yazın uyarısı çıkıyor.', 'Listeden seçin ya da yeni kursiyerin adını yazın.']] },

    { id: 'sertifikalar', ne: 'Üretilen belgeleri, teslim durumunu ve doğrulamayı gösterir. Belgeler grup sayfasından üretilir. Üzerinde karekod ve doğrulama kodu bulunur. Sertifika iptali neden ve yönetici onayı ister, iptal doğrulama sayfasında görünür.',
      gorevler: [{ baslik: 'Belge yazdırma ve teslim', sahneler: [{ git: 'sertifikalar', kirp: 'ana', adimlar: [['**Yazdır** belgeyi basar.', '[data-act=pr]'], ['**Teslim edildi** teslim kaydı yazar.', '[data-act=tes]'], ['**İptal et** belgeyi iptal eder.', '[data-act=ip]'], ['**Teslim bekleyen** süzgeci verilmemiş belgeleri gösterir.', '[data-f=hazir]'], ['**Doğrulama sayfası** herkese açık sayfayı açar.', 'a.btn@Doğrulama sayfası']] }] }] },

    { id: 'onkayit', ne: 'Aday kursiyerleri ve geri arama tarihlerini tutar. Sonraki arama günü gelen adayda tarih uyarı rengiyle görünür. Bu sayfayı müdür ve kayıt görür.',
      gorevler: [{ baslik: 'Aday izleme', sahneler: [{ git: 'onkayit', kirp: 'ana', adimlar: [['**Yeni aday** ad, telefon, ilgilendiği eğitim ve sonraki arama tarihini sorar.', 'button@Yeni aday'], ['**Kayda çevir** adayı kayıt formuna taşır.', '[data-act=kayit]']] }] }] },

    { id: 'taksitler', ne: 'Vadesi gelen ve geciken taksitleri listeler. Bu sayfayı müdür ve kayıt görür.',
      gorevler: [{ baslik: 'Taksit tahsil etme', sahneler: [{ git: 'taksitler', kirp: 'ana', adimlar: [['Üstte **Gecikmiş**, **Bu ay**, **30 gün tahsilat** ve **Toplam kalan** görünür.', '.kpi'], ['**Gecikenlere hatırlat** telefonu kayıtlı kursiyerlere SMS gönderir.', '#rm'], ['**Tahsil et** ödeme türünü sorar, makbuz açılır.', '[data-act=pay]']] }] }],
      hatalar: [['Telefonu kayıtlı gecikmiş kursiyer yok uyarısı çıkıyor.', 'Kursiyer kartına telefon yazın.']] },

    { id: 'egitimler', ne: 'Verilen eğitimleri, saatini, ücretini ve belge geçerliliğini tutar. Grubu olan eğitim silinemez. Bu sayfayı yalnız müdür görür.',
      gorevler: [{ baslik: 'Eğitim ekleme', sahneler: [{ git: 'egitimler', once: [['tikla', 'button@Yeni eğitim']], kirp: 'pencere', adimlar: [['**Eğitim adı** yazın.', '.field@Eğitim adı'], ['**Toplam saat** belgeye yazılır.', '.field@Toplam saat'], ['**Belge geçerliliği (yıl, süresizse 0)** doluysa belgede bitiş tarihi görünür.', '.field@Belge geçerliliği'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'egitmenler', ne: 'Eğitmenleri ve aylık hakedişi tutar. Hakediş yoklaması alınan saat ile saat ücretinin çarpımıdır, vergi ve SGK kesintileri dahil değildir. Grubu olan eğitmen silinemez. Bu sayfayı yalnız müdür görür.',
      gorevler: [{ baslik: 'Hakediş görme', sahneler: [{ git: 'egitmenler', kirp: 'ana', boy: 900, adimlar: [['**Yeni eğitmen** ad, alan, saat ücreti ve telefon sorar.', 'button@Yeni eğitmen'], ['Ayı buradan seçin, tablo o ayın saat ve hakedişini gösterir.', '#mo']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Eğitim sertifikası' }),
    O.ayarlar({ alanlar: [['En az devam (%)', 'Sertifika için gereken devam.'], ['En az not (0 = not aranmaz)', 'Sertifika için gereken not.'], ['Ödemesi bitmeyene belge verilmesin', 'Açıksa kalan borç belge üretimini engeller.'], ['Belgeyi imzalayan unvan', 'Belgedeki imza başlığı.'], ['İade ve devam koşulları metni', 'Kayıt formuna yazılır. Kurumunuzun türüne göre hukuk danışmanınız hazırlar.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Eğitmen yalnız kendi gruplarını görür, yoklama ve not yazar. Ücret, taksit ve ön kayıt bu role gönderilmez. Sertifika üretimi ve iptali yönetici ve kayıt rolündedir. Şartsız belge ve sertifika iptali müdür onayı ister.',
  musteri: [{ ad: 'Sertifika doğrulama sayfası', ne: 'Belgeyi gören kişi kodu yazar veya karekodu okutur, belgenin kurum kaydında olup olmadığını görür. Üyelik gerekmez. İptal edilen belge iptal olarak, süresi dolan belge süresi dolmuş olarak görünür. Sonuç yalnız kurum kaydını gösterir, resmî onay anlamına gelmez.',
    sahneler: [
      { adres: 'dogrula.html', ilk: 700, kirp: 'tam', adimlar: [['Belgedeki kodu bu kutuya yazıp **Doğrula** düğmesine basın.', '#k']] },
      { adres: 'dogrula.html', ilk: 700, once: [['tikla', '#hint']], kirp: 'tam', adimlar: [['Sonuç ve belge bilgileri burada görünür.', '.tk-panel']] }] }],
  yazdirma: { ne: 'Belgeler işlem yapılan ekrandan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Eğitim sertifikası', '**Sertifikalar** sayfasında **Yazdır** simgesi.'], ['Tahsilat makbuzu', 'Tahsilatta açılır.'], ['Kayıt formu', 'Kursiyer kartında **Kayıt formu**.'], ['Yoklama listesi', 'Grup kartında **Yoklama listesi**.'], ['Eğitim kayıt sözleşmesi, teslim tutanağı', '**İmzalı belgeler** sayfası.']] },

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bağlandıktan sonra **Gecikenlere hatırlat** ve sertifika üretimi kursiyere SMS gönderir.', 'Bağlantı yokken gönderim **TEST** kalır, kursiyere bir şey gitmez.'], sorun: [...DENEME_HATA, 'Hata görünüyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.'] },
    whatsapp: { degisir: [AKIS('WhatsApp', 'Deneme numara bilgisini okur, mesaj göndermez.'), 'Bu programın ekranlarında WhatsApp gönderen düğme yoktur. Kursiyere bildirim SMS ile gider.'], sorun: DENEME_HATA },
    email: { degisir: [AKIS('E-posta', 'Deneme hesap bilgisini okur, e-posta göndermez.'), 'Bu programın iş ekranlarında e-posta gönderen düğme yoktur. Ayar **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede kullanılır.'], sorun: DENEME_HATA },
    payment: { kapali: { param: ILETISIM, payu: ILETISIM, lidio: ILETISIM }, degisir: [AKIS('Online ödeme', 'Deneme para çekmez.'), 'Bağlandıktan sonra taksit için ödeme bağlantısı oluşturulur. Bağlantıyı kursiyere siz iletirsiniz, program kendiliğinden ileti atmaz. Bağlantı 7 gün geçerlidir, yalnız o kaydın taksitlerini açar.', 'Kursiyer kartla ödeyince taksit kapanır, ödemeler Online ödemeler listesinde görünür.', 'Moka United ve Sipay için yalnız Bağlantıyı dene çalışır, ödeme başlatılmaz.', 'Test modunda para çekilmez, borç kapanmaz, sonuç TEST görünür.'], sorun: [...DENEME_HATA, 'PayTR’de verilen Bildirim URL’sini panele yazın. Yazmazsanız sonuç geç gelir.', 'Kısmi iadeyi sağlayıcı panelinden yapıp programa elle işleyin.'] },
    printer: { degisir: ['Belgeler tarayıcının yazdırma penceresiyle basılır, yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını görmenizi sağlar.'], sorun: ['Kâğıt boyu yanlışsa **Belge şablonları** sayfasından değiştirin.'] },
    backup: O.E.backup(),
  },
});
