// Kurs & Etüt kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js kurs
const KAP = 'NEBSOFT ile iletişime geçerek açtırılır.';
module.exports = (O) => ({
  ne: 'Kurs & Etüt programı öğrenci ve veli kayıtlarını, yoklamayı, ders programını, deneme sınavlarını, ödevleri, birebir etütleri, ön kayıtları ve taksitleri yönetir. Veliler veli portalından devamı, sınavları, ödevleri ve ödemeleri görür.',
  kimler: 'Etüt merkezleri, özel öğretim kursları, dil ve sınav hazırlık kurumları.',
  ilkNot: 'Önce **Sınıflar** ve **Öğretmenler** sayfalarını doldurun, sonra **Ders Programı** sayfasına dersleri yazın. Yoklama bu programdan gelir.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Öğrenci sayısını, devam oranını, bugünkü dersleri, gecikmiş taksitleri ve devamsızlığı artan öğrencileri gösterir.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1100, adimlar: [['**Öğrenci**, **Devam oranı (30 gün)**, **Bugünkü ders** ve **Gecikmiş taksit** kutuları günün özetidir.', '.kpi'], ['**Yoklama al** yoklama ekranını açar.', '#att'], ['**Öğrenci kaydı** yeni öğrenci açar.', '#ns']] }] }] },

    { id: 'yoklama', ne: 'Öğretmenin dersteki öğrencileri işaretlediği ekrandır. **Devamsızlıkta veliye otomatik SMS** açıksa yok yazılan öğrencinin velisine mesaj denenir.',
      gorevler: [{ baslik: 'Yoklama alma', sahneler: [{ git: 'yoklama', kirp: 'ana', boy: 950, adimlar: [['Dersi listeden seçin, tarihi yandan değiştirin.', '#ls'], ['**Hepsi var** tüm sınıfı işaretler.', '#all'], ['Öğrenci için **Var**, **Yok**, **Geç** veya **İzinli** seçin.', 'button@Yok'], ['**Online ders** ders bağlantısı oluşturur ve velilere göndermeyi sorar.', '#ol'], ['**Yoklamayı kaydet** düğmesine basın.', '#sv']] }] }] },

    { id: 'program', ne: 'Sınıfın haftalık programını gösterir. Boş hücreye tıklayınca ders eklenir, dersin üzerine tıklayınca düzenlenir. Aynı öğretmen veya derslik aynı saate yazılamaz.',
      gorevler: [{ baslik: 'Program düzenleme', sahneler: [
        { git: 'program', kirp: 'ana', en: 1450, boy: 900, adimlar: [['Sınıfı listeden seçin.', '#c'], ['Yazdırma düğmesi haftalık programı basar.', '#pr'], ['Ders hücresine tıklayın.', '[data-l]']] },
        { git: 'program', once: [['tikla', '[data-l]']], kirp: 'pencere', adimlar: [['**Ders** ve **Öğretmen** seçin.', '.field@Ders'], ['**Bu dersi programdan kaldır** dersi siler. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Öğretmen bu saatte başka sınıfta uyarısı çıkıyor.', 'Saati veya öğretmeni değiştirin.'], ['Derslik bu saatte başka sınıfta uyarısı çıkıyor.', 'Saati değiştirin veya **Sınıflar** sayfasından dersliği düzenleyin.']] },

    { id: 'sinavlar', ne: 'Deneme sınavlarını, sonuç girişini, sınıf sıralamasını ve karneyi yönetir.',
      gorevler: [{ baslik: 'Sınav açma ve net girme', sahneler: [
        { git: 'sinavlar', kirp: 'ana', adimlar: [['**Yeni sınav** kayıt açar. Satırdaki göz simgesi sonuç girişine geçer.', '#ne']] },
        { git: 'sinavlar', once: [['tikla', '#ne']], kirp: 'pencere', adimlar: [['**Sınav adı**, **Tarih** ve **Sınıf** seçin.', '.field@Sınav adı'], ['**Ders başına soru** ve **Kaç yanlış bir doğruyu götürür (0 = net girilir)** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] },
        { git: 'sinavlar', once: [['tikla', '[data-act]']], kirp: 'ana', boy: 950, adimlar: [['Her öğrencinin netlerini yazın, **Netleri kaydet** düğmesine basın. Sıralama kendiliğinden oluşur.', '#sv']] }] }] },

    { id: 'ogrenciler', ne: 'Öğrenci ve veli kartlarını, devamsızlığı ve kalan borcu gösterir. Öğrenciye girince sınavlar, taksitler ve belgeler açılır.',
      gorevler: [
        { baslik: 'Öğrenci kaydı', sahneler: [
          { git: 'ogrenciler', kirp: 'ana', adimlar: [['**Öğrenci kaydı** yeni kayıt açar.', '#ns'], ['Sınıfa göre süzün. **Ayrılanlar** seçeneği ayrılan öğrencileri gösterir.', '#c'], ['Oklu düğme listeyi dosyaya alır.', '#ex'], ['Satırdaki göz simgesi öğrenci kartını açar.', '[data-act=v]']] },
          { git: 'ogrenciler', once: [['tikla', '#ns']], kirp: 'pencere', boy: 1000, adimlar: [['**Öğrenci adı** yazın, **Sınıf** seçin.', '.field@Öğrenci adı'], ['**Veli adı** ve **Veli telefonu** zorunludur.', '.field@Veli adı'], ['**Ücretsiz / burslu öğrenci** işaretliyse taksit oluşmaz.', 'label@Ücretsiz / burslu öğrenci'], ['**Dönem ücreti (₺)** boşsa sınıf ücreti kullanılır. **Taksit sayısı** ve **İlk taksit tarihi** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Öğrenci kartı', sahneler: [{ git: 'ogrenciler', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 1000, adimlar: [['**Veli portalı kodu** velinin giriş kodunu üretir.', '#ptl'], ['**Sözleşme** kayıt sözleşmesini yazdırır.', '#sz'], ['**Karne** gelişim karnesini yazdırır.', '#kr'], ['**Kurstan ayrıl** iade tutarını ve kalan borcu sorar.', '#ayr'], ['**Düzenle** kaydı değiştirir.', '#ed']] }] }],
      hatalar: [['Sınıf kontenjanı dolu sorusu çıkıyor.', 'Sınıfın **Kontenjan** değeri doludur. Yine de kaydedebilir veya başka sınıf seçebilirsiniz.'], ['Ücreti girin uyarısı çıkıyor.', '**Dönem ücreti (₺)** alanına tutar yazın.']] },

    { id: 'odevler', ne: 'Sınıfa ödev verirsiniz, yapanları işaretlersiniz. Ödevler veli portalında görünür. Demoda örnek ödev yoktur.',
      gorevler: [{ baslik: 'Ödev verme', sahneler: [{ git: 'odevler', once: [['tikla', 'button@Yeni ödev']], kirp: 'pencere', adimlar: [['**Sınıf**, **Ders**, **Ödev** ve **Teslim tarihi** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'etut', ne: 'Öğrenciye özel etüt randevularını tutar. Yapılan etütler öğretmen hakedişine girer. Demoda örnek etüt yoktur.',
      gorevler: [{ baslik: 'Etüt ekleme', sahneler: [{ git: 'etut', once: [['tikla', 'button@Etüt ekle']], kirp: 'pencere', adimlar: [['**Öğrenci**, **Öğretmen**, **Tarih**, **Saat**, **Konu** ve **Durum** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'onkayit', ne: 'Aday öğrencileri ve geri aranacakları tutar. **Aranacak** süzgeci bugünün aramalarını ayırır.',
      gorevler: [{ baslik: 'Aday ekleme ve kayda çevirme', sahneler: [
        { git: 'onkayit', kirp: 'ana', adimlar: [['**Yeni aday** kayıt açar.', 'button@Yeni aday'], ['**Açık**, **Aranacak** ve **Tümü** ile listeyi süzün.', 'button@Aranacak'], ['**Kayda çevir** adayı öğrenci kaydı penceresine taşır.', 'button@Kayda çevir']] },
        { git: 'onkayit', once: [['tikla', 'button@Yeni aday']], kirp: 'pencere', boy: 900, adimlar: [['**Öğrenci adı** ve **Telefon** zorunludur.', '.field@Öğrenci adı'], ['**Sonraki arama** tarihini yazın. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'taksitler', ne: 'Vadesi gelen ve geciken taksitleri gösterir, tahsilat ve hatırlatma buradan yapılır. Öğretmen rolü bu sayfayı görmez.',
      gorevler: [{ baslik: 'Tahsilat alma', sahneler: [
        { git: 'taksitler', kirp: 'ana', adimlar: [['Kutular **Gecikmiş**, **Bu ay vadesi gelen**, **30 gün tahsilat** ve **Toplam kalan** tutarlarıdır.', '.kpi'], ['**Tahsil et** ödeme kaydeder ve makbuz basar.', 'button@Tahsil et'], ['**Veliye hatırlat** WhatsApp’ı hazır mesajla açar.', 'button@Veliye hatırlat']] },
        { git: 'taksitler', once: [['tikla', 'button@Tahsil et']], kirp: 'pencere', adimlar: [['**Ödeme** türünü seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'siniflar', ne: 'Sınıfları, seviyesini, dersliğini, kontenjanını ve dönem ücretini tutar. Bu sayfayı yalnız müdür görür.',
      gorevler: [{ baslik: 'Sınıf ekleme', sahneler: [{ git: 'siniflar', once: [['tikla', 'button@Yeni sınıf']], kirp: 'pencere', adimlar: [['**Sınıf adı**, **Seviye**, **Derslik**, **Kontenjan** ve **Dönem ücreti** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'ogretmenler', ne: 'Öğretmenleri, branşını, ders ücretini, haftalık dersini ve hakedişini gösterir. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Bu sayfayı yalnız müdür görür.',
      gorevler: [{ baslik: 'Öğretmen ekleme', sahneler: [{ git: 'ogretmenler', once: [['tikla', 'button@Yeni öğretmen']], kirp: 'pencere', adimlar: [['**Ad**, **Branş**, **Ders ücreti (₺)** ve **Telefon** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'bildirimler', ne: 'Veli portalından gelen mesaj ve mazeretleri, gönderilen SMS bildirimlerini gösterir. Mesajı **Yanıtla** ile yanıtlarsınız, yanıt veliye SMS ile gönderilmek istenir.',
      gorevler: [{ baslik: 'Veli mesajlarını görme', sahneler: [{ git: 'bildirimler', kirp: 'ana', adimlar: [['**Veli portalı** velinin sayfasını açar.', 'a@Veli portalı']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Kayıt sözleşmesi' }),
    O.ayarlar({ alanlar: [['Eğitim dönemi', 'Ekranlarda görünen dönem adı.'], ['Dönem başlangıcı', 'İade hesabında kullanılır.'], ['Dönem bitişi', 'İade hesabında kullanılır.'], ['Öğrenim ücreti', '**Dönemlik (iade güne göre)** veya **Ders saati (iade ders saatine göre)**.'], ['Devamsızlıkta veliye otomatik SMS', 'Açıksa yoklamada yok yazılan öğrencinin velisine mesaj denenir.']] }),
    { ...O.ebelge(), not: 'Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur. Bu sayfada oluşan belgeler TEST kalır.' },
    O.entegrasyonlar(),
  ],

  roller: 'Öğretmen rolü yoklama, program, sınav, ödev ve etütte çalışır. Kayıt / Muhasebe rolü ön kayıt ve taksitleri görür. Sınıflar, öğretmenler ve ayarlar müdüre aittir.',
  musteri: [{ ad: 'Veli portalı', ne: 'Veli telefon numarası ve kurumdan aldığı giriş koduyla girer. Devam, ders programı, denemeler, ödevler ve ödemeler sekmelerini görür. **Mesaj & mazeret** sekmesinden kuruma yazar. Portalda kartla ödeme alınmaz, ödeme bilgisi gösterilir. Giriş kodunu öğrenci kartındaki **Veli portalı kodu** düğmesiyle verirsiniz.',
    sahneler: [
      { adres: 'veli.html', ilk: 800, kirp: 'tam', adimlar: [['Veli telefonunu bu kutuya yazar.', '#ph'], ['Giriş kodunu yazıp girer.', '#cd']] },
      { adres: 'veli.html', ilk: 800, kirp: 'tam', boy: 1000, once: [['tikla', '#hint'], ['tikla', '#go']], adimlar: [['Girişten sonra sekmeler ve öğrenci özeti görünür.', '#root']] }] }],
  yazdirma: { ne: 'Belgeler öğrenci kartından ve ilgili sayfadan yazdırılır.', belgeler: [['Kayıt sözleşmesi', 'Öğrenci kartında **Sözleşme**.'], ['Gelişim karnesi', 'Öğrenci kartında **Karne**.'], ['Tahsilat makbuzu', '**Taksit & Tahsilat** sayfasında tahsilattan sonra.'], ['Haftalık ders programı', '**Ders Programı** sayfasındaki yazdırma düğmesi.']] },

  entegrasyon: {
    meb: { kapali: { '*': KAP }, degisir: [`MEBBİS ve e-Yaygın bağlantısı ${KAP}`, 'Bağlantı olmadan yoklama ve kayıt bildirimi programdan gitmez. Bildirimi yetkili sistemden kendiniz yapın.'], sorun: ['Bildirim için kurumunuzun MEBBİS hesabını kullanın.'] },
    onlineders: { degisir: ['Bağlantı açıkken **Online ders** düğmesi seçtiğiniz sağlayıcıyla toplantı bağlantısı üretir. Zoom’da API bilgileri girildiyse toplantı Zoom’da açılır.', 'Bağlantı yokken **Online ders** düğmesi meet.jit.si adresinde bir bağlantı üretir.', 'Bağlantı velilere SMS ile gönderilmek istenir.'], sorun: ['Toplantı açılmıyorsa sağlayıcı hesabınızı Bağlantıyı dene adımıyla kontrol edin.'] },
    payment: { degisir: ['**Entegrasyonlar** sayfasında Online ödeme kartında **Entegre et** düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, **Bağlantıyı dene** ile deneyin. Deneme para çekmez. Sonuç başarılıysa kart **Bağlı** görünür.', 'Veli portalında **Taksit öde** veya gecikmiş tutar düğmesi kartla ödemeyi açar. Veli taksitleri seçer, kart bilgisini sağlayıcının güvenli sayfasına girer. Ödeme sağlayıcıdan doğrulanınca taksit ödenmiş görünür.', 'Bulut hesabında **Taksit & Tahsilat** sayfasındaki **Online ödemeler** düğmesi gelen ödemeleri listeler, kart iadesi buradan yapılır. Elden veya havaleyle alınan taksiti **Tahsil et** ile kaydedersiniz.', 'Kart bağlı değilse veli ödeme bilgisini görür.', 'Test modunda para çekilmez, borç kapanmaz. Canlı ödeme sunucu kilidi açılınca çalışır.'], sorun: ['Veli portalında kart seçeneği görünmüyorsa kartın **Bağlı** olduğuna bakın. Bilgiler değişince **Bağlantıyı dene** yeniden yapılmalıdır.', 'Yarım kalan ödemede kişi yeniden ödemeden önce sonucu bekler, sonuç sağlayıcıdan sorulur.'] },
    sms: { degisir: ['Devamsızlık bildirimi, **Online ders** bağlantısı ve **Veli İletişimi** yanıtları gerçek SMS olarak gider.', 'Gönderimler **Veli İletişimi** sayfasına işlenir. Bağlantı yokken müşteriye bir şey gitmez.'], sorun: ['Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.', 'Öğrenci kaydındaki veli telefonunu kontrol edin.'] },
    whatsapp: O.E.whatsappLink('**Taksit & Tahsilat** sayfasındaki **Veliye hatırlat** düğmesi'),
    backup: O.E.backup(),
  },
});
