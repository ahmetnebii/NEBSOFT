// Teknik Servis kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js servis
module.exports = (O) => ({
  ne: 'Teknik Servis programı, cihazın kabulünden teslimine kadar her aşamayı izler. Kabul fişi yazdırılır, arıza tespiti ve fiyat teklifi kaydedilir, parça stoktan düşülür, müşteri cihazının durumunu takip sayfasından görür ve teslimde garanti belgesi imzalatılır.',
  kimler: 'Telefon, bilgisayar, televizyon, beyaz eşya ve klima tamircileri. Tek ustalı dükkânda da, danışması ve birden çok teknisyeni olan serviste de kullanılır.',
  ilkNot: 'İlk cihazı kabul etmeden önce **Ayarlar** sayfasına işletme adınızı ve **Kabul formu koşulları** metnini yazın. Bu bilgiler kabul fişine basılır.',
  ekrantanitim: [{ git: 'pano', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Serviste bekleyen cihaz sayısını, son 30 günün cirosunu ve brüt kârını, ortalama teslim süresini ve cihaz türlerini gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1100, adimlar: [['Üstteki kutular **Serviste bekleyen**, **30 gün ciro**, **30 gün brüt kâr** ve **Ort. teslim süresi** değerlerini verir.', '.kpi'], ['**Cihaz kabul** düğmesi yeni kayıt açar.', '#ni']] }] }],
      hatalar: [['Ciro beklediğimden düşük.', 'Ciro teslim edilen işlerden hesaplanır. Teslim edilmemiş işler sayılmaz.']] },

    { id: 'pano', ne: 'Açık işleri durumlarına göre sütunlarda gösterir. Kartı sürükleyerek işi ilerletirsiniz. Program açıldığında bu sayfa gelir.',
      gorevler: [
        { baslik: 'Panoyu okuma', sahneler: [{ git: 'pano', kirp: 'ana', en: 1450, boy: 950, adimlar: [['Kutular **Serviste**, **Onay bekleyen**, **Teslime hazır** ve **Geciken** sayılarını gösterir.', '.kpi'], ['Arama kutusuna kayıt no, müşteri veya IMEI yazın.', '#q'], ['**Tüm teknisyenler** listesinden tek ustanın işlerini süzün.', '#tf'], ['Kartı başka sütuna sürükleyin. Karta tıklayınca kayıt açılır.', '.kc']] }] },
        { baslik: 'Cihaz kabul', ne: 'Cihaz geldiğinde kaydı buradan açın. Kayıt bitince kabul fişi için müşteri imzası istenir, imzadan sonra fiş yazdırılır.', sahneler: [
          { git: 'pano', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1000, adimlar: [['**Telefonla bul** kutusuna numarayı yazın. Kayıtlıysa müşteri seçilir. Yoksa **Yeni** ile ekleyin.', '#iph'], ['**Marka**, **Model** ve **Seri no / IMEI** alanlarını doldurun.', '.field@Marka'], ['**Müşteri şikâyeti / arıza** yazın. Bu alan zorunludur.', '.field@Müşteri şikâyeti'], ['Cihazdaki çizik, kırık gibi izleri **Fiziksel durum** alanına yazın. Anlaşmazlıkta dayanak olur.', '.field@Fiziksel durum'], ['**Ekran kilidi / şifre** yalnız test için gerekiyorsa girilir, teslimde silinir.', '.field@Ekran kilidi'], ['**Kaydet ve fiş yazdır** düğmesine basın.', 'button@Kaydet ve fiş yazdır']] }] },
        { baslik: 'Gelen çağrıda müşteriyi bulma', ne: 'Arayan müşterinin servisteki cihazını hızlıca görmek içindir. Numarayı elle yazarsınız. Kayıtlı değilse cihaz kabul penceresi açılır.', sahneler: [{ git: 'pano', once: [['tikla', '#cid']], kirp: 'pencere', adimlar: [['**Arayan numara** alanına telefonu yazıp **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Cihaz türü', 'Telefon, laptop, klima gibi tür. Özet sayfasındaki dağılımı oluşturur.'], ['Teslim alınan aksesuar', 'Şarj aleti, kılıf gibi cihazla bırakılanlar.'], ['Teknisyen', 'İşi yapacak kişi.'], ['Söz verilen teslim', 'Bu tarih geçince kart **Geciken** sayılır.'], ['Öncelik', '**Normal** veya **Acil**. Acil iş kartta etikettir.'], ['Alınan ön ödeme (₺)', 'Kabulde alınan para, kalan tutardan düşülür.'], ['Tahmini ücret (₺)', 'Bilinmiyorsa boş bırakın.']],
      hatalar: [['Müşteri seçin uyarısı çıkıyor.', '**Müşteri** alanını seçin veya **Yeni** ile ekleyin.'], ['Kart Müşteri onayı bekliyor sütununa geçmiyor, kayıt açılıyor.', 'Teklif tutarı gerekir. Teklif için kayıttaki **Fiyat teklifi gönder** düğmesini kullanın. İade sütunu da aynı şekilde neden ister.'], ['Fiyat teklifinde SMS gitmedi.', 'SMS bağlı değilse program WhatsApp ile göndermeyi önerir. Kayıt **SMS Bildirimleri** sayfasına TEST olarak düşer.']] },

    { id: 'kayitlar', ne: 'Tüm servis kayıtlarını listeler. Garanti sorgulama, arama ve dışa aktarma buradadır. Bir kayda girince cihaz bilgisi, tespit, parçalar, işçilik, ödeme ve geçmiş tek sayfada görünür.',
      gorevler: [
        { baslik: 'Kayıt bulma', sahneler: [{ git: 'kayitlar', kirp: 'ana', adimlar: [['Arama kutusuna kayıt no, müşteri, telefon, IMEI veya marka yazın.', '#q'], ['**Açık**, **Teslim edilen**, **Garantide** ve **Tümü** ile listeyi süzün.', 'button@Garantide'], ['Oklu düğme listeyi dosyaya alır.', '#ex'], ['Kaydı açmak için satırdaki göz simgesine basın.', '[data-act=v]']] }] },
        { baslik: 'Kayıtta çalışma', ne: 'İşin durumuna göre üstteki düğmeler değişir: **Arıza tespitine al**, **Fiyat teklifi gönder**, **Müşteri onayladı**, **Onarım tamamlandı**, **Parça bekleniyor**, **Müşteriye teslim et**. Teklif, parça bekleme ve teslime hazır durumlarında müşteriye bildirim gönderilmek istenir.', sahneler: [
          { git: 'kayitlar', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 950, adimlar: [['Bu düğmeler işi sonraki aşamaya taşır.', '[data-st]'], ['**Kabul fişi** fişi yeniden yazdırır.', 'button@Kabul fişi'], ['**Takip linki** müşteri sayfasını açar ve adresi kopyalar.', 'button@Takip linki'], ['**Düzenle** cihaz bilgilerini değiştirir.', 'button@Düzenle']] },
          { git: 'kayitlar', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 1350, adimlar: [['Yaptığınız tespiti yazıp **Tespiti kaydet** düğmesine basın.', '#dg'], ['**Parça ekle** stoktan parça düşer. Stok yetersizse program sorar.', '#ap'], ['**İşçilik** tutarını yazıp yanındaki **Kaydet** düğmesine basın.', '#lb']] }] },
        { baslik: 'Teslim ve tahsilat', ne: '**Müşteriye teslim et** düğmesine basınca kalan tutar varsa tahsilat sorulur. Ardından **Teslim — müşteri imzası** penceresi açılır, müşteri imzalar ve **Teslim ve garanti belgesi** yazdırılır. **Garanti süresi** Ayarlardan gelir. Ekran kilidi şifresi teslimde silinir.', sahneler: [{ git: 'kayitlar', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 1350, adimlar: [['Toplam, alınan ön ödeme ve kalan tutar bu kartın altında görünür.', '.card@Parça ve işçilik']] }] }],
      hatalar: [['Stokta yetersiz sorusu çıkıyor.', 'Parça stokta yoktur. Yine de ekleyip kaydı **Parça bekleniyor** durumuna alabilirsiniz.'], ['Garantide süzgeci boş.', '**Ayarlar** sayfasında garanti süresi yazılı değilse teslim edilen işe garanti bitişi yazılmaz.']] },

    { id: 'musteriler', ne: 'Müşteri kartlarını, cihaz sayısını ve toplam harcamayı tutar. Müşteri ilk cihaz kabulünde de oluşturulabilir.',
      gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
        { git: 'musteriler', kirp: 'ana', adimlar: [['**Yeni müşteri** düğmesine basın.', 'button@Yeni müşteri'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
        { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** yazın.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'parcalar', ne: 'Yedek parçaları, alış ve satış fiyatını, stoğu ve kullanım sayısını tutar. **Kritik** süzgeci azalan parçaları gösterir.',
      gorevler: [
        { baslik: 'Parça ekleme ve stok girişi', sahneler: [
          { git: 'parcalar', kirp: 'ana', adimlar: [['**Yeni parça** düğmesiyle kart açın.', 'button@Yeni parça'], ['Tedarikçiden mal gelince satırdaki **Stok girişi** düğmesine basın, gelen adedi yazın.', 'button@Stok girişi'], ['**Kritik** süzgeci azalan parçaları gösterir.', 'button@Kritik']] },
          { git: 'parcalar', once: [['tikla', 'button@Yeni parça']], kirp: 'pencere', adimlar: [['**Parça adı** ve **Kategori** yazın.', '.field@Parça adı'], ['**Satış (₺)** zorunludur. **Alış (₺)** kâr hesabında kullanılır.', '.field@Satış'], ['**Kritik** stok bu sayının altına inince parça uyarıda görünür. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Parça sipariş listesi', ne: 'Bekleyen işlerin ihtiyacı ve azalan stoktan liste oluşur. Liste tedarikçiye gönderilmek içindir, program sipariş vermez.', sahneler: [{ git: 'parcalar', once: [['tikla', 'button@Sipariş listesi']], kirp: 'pencere', adimlar: [['**CSV indir** dosyaya alır.', 'button@CSV indir'], ['**Kopyala** listeyi panoya alır.', 'button@Kopyala'], ['**WhatsApp ile gönder** sohbeti hazır mesajla açar.', 'button@WhatsApp ile gönder']] }] }],
      hatalar: [['Sipariş edilecek parça yok uyarısı çıkıyor.', 'Azalan parça veya parça bekleyen iş yoktur.']] },

    { id: 'teknisyenler', ne: 'Ustaların uzmanlığını, açık işini, tamamladığı işi, cirosunu, ortalama süresini, garanti dönüşünü ve puanını gösterir. Bu sayfayı yalnız yönetici görür. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın.',
      gorevler: [{ baslik: 'Teknisyen ekleme', sahneler: [{ git: 'teknisyenler', once: [['tikla', 'button@Yeni teknisyen']], kirp: 'pencere', adimlar: [['**Ad soyad**, **Uzmanlık** ve **Telefon** yazın.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'bildirimler', ne: 'Müşteriye gönderilen mesajların kaydıdır. Sayfanın adı içeride **Müşteri Bildirimleri** olarak yazar. Teklif, parça bekleniyor ve teslime hazır durumlarında mesaj denenir. SMS bağlı değilse mesaj gitmez, kayıt **TEST — gönderilmedi** olarak düşer ve program WhatsApp önerir.',
      gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', kirp: 'ana', adimlar: [['Mesaj gönderildikçe bu sayfada listelenir.', '#view']] }] }],
      hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını kurun.']] },

    O.belgeler({ tur: 'Servis kabul formu' }),
    O.ayarlar({ alanlar: [['Garanti süresi (gün; boşsa müşteriye gösterilmez)', 'Teslimde garanti bitiş tarihi bu süreyle hesaplanır.'], ['Onarılamayan cihazda tespit ücreti (₺, yoksa 0)', 'Müşteri teklifi reddederse veya cihaz onarılamazsa alınacak ücret.'], ['Kabul formu koşulları', 'Kabul fişine basılan metin. Metni işletmeniz belirler.']] }),
    { ...O.ebelge(), not: 'Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur. Bu yüzden entegratör buradan bağlanamaz, teslim penceresindeki fatura seçeneği çıkmaz ve bu sayfada oluşan belgeler TEST kalır.' },
    O.entegrasyonlar(),
  ],

  roller: 'Özet, teknisyenler, belge şablonları, ayarlar ve entegrasyonlar yöneticiye aittir. Teknisyen ve Kabul / Danışma rolleri pano, kayıtlar, müşteriler ve parça stoğunda çalışır.',
  musteri: [{ ad: 'Cihaz takip sayfası', ne: 'Müşteri kabul fişindeki 6 haneli takip koduyla cihazının durumunu, ödenecek tutarı ve işletmenin iletişim bilgisini görür. Üyelik gerekmez. Teklif verilen işte **Onaylıyorum, onarılsın** veya **Onaylamıyorum** seçebilir. Teslimden sonra puan verebilir. Adresi kayıttaki **Takip linki** düğmesiyle alırsınız. Sayfada ödeme alınmaz, ödeme cihaz teslim alınırken yapılır.',
    sahneler: [
      { adres: 'takip.html', ilk: 800, kirp: 'tam', adimlar: [['Müşteri kodu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k']] },
      { adres: 'takip.html?kod=SRV5000', ilk: 800, kirp: 'tam', boy: 1000, adimlar: [['Kod doğruysa cihazın durumu ve aşamaları görünür.', '#root']] }] }],
  yazdirma: { ne: 'Belgeler kayıt ekranından yazdırılır. İki belgede de müşteri imzası ekranda alınır.', belgeler: [['Servis kabul formu', 'Cihaz kabulde **Kaydet ve fiş yazdır**. Sonradan kayıttaki **Kabul fişi** düğmesi.'], ['Teslim ve garanti belgesi', 'Kayıtta **Müşteriye teslim et** adımının sonunda açılır.']] },

  entegrasyon: {
    callerid: { kapali: { '*': 'Bu sürümde desteklenmiyor.' }, degisir: ['Bu sürümde santral bağlantısı yoktur. **Gelen çağrı** düğmesi numarayı size sorar, siz yazarsınız.'], sorun: ['Numarayı yazınca müşteri bulunmuyorsa kayıttaki telefonu kontrol edin.'] },
    sms: { degisir: ['Fiyat teklifi, parça bekleniyor ve teslime hazır durumlarında müşteriye gerçek SMS gider. Mesajda takip adresi bulunur.', 'Özet sayfasındaki teslim hatırlatması da SMS gönderir.', 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken **TEST — gönderilmedi** görünür, müşteriye bir şey gitmez.'], sorun: ['SMS gönderilemezse program WhatsApp ile göndermeyi önerir.', 'Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.'] },
    whatsapp: O.E.whatsappLink('SMS gönderilemediğinde çıkan **WhatsApp ile gönder** seçeneği'),
    backup: O.E.backup(),
  },
});
