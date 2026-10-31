// Servis & Okul Taşımacılığı kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js okulservisi
// Veli portalı telefon ve kodla açılır: giriş bilgisi demo verisinden okunur, sayfa değişince yardımcı yeniden yüklenir. Ekrandaki kişiler kurgudur, telefonlar bulanıktır.
const YARDIM = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'scripts', 'kilavuz', 'sayfa.js'), 'utf8');
const VELI = [['js', "(()=>{const s=NS.app.opts.db.all('students').find((x)=>x.portalCode);sessionStorage.setItem('__g',JSON.stringify([s.parentPhone,s.portalCode]));location.href='veli.html';})()"], ['bekle', 1400], ['js', YARDIM + ";(()=>{const t=document.createElement('style');t.textContent='.nsd,#nsdroot,.nsd-w{display:none!important}';document.head.append(t);const g=JSON.parse(sessionStorage.getItem('__g'));__k.yaz('#ph',g[0]);__k.yaz('#cd',g[1]);__k.tikla('#go');})()"], ['bekle', 500]];
const ILETISIM = 'NEBSOFT ile iletişime geçerek açtırılır.';
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında **Entegre et** düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, **Bağlantıyı dene** ile deneyin. ${deneme} Sonuç başarılıysa kart **Bağlı** görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz **Bağlantıyı dene** adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Servis & Okul Taşımacılığı, güzergâhları, öğrencileri, sefer yoklamasını, aylık ücretleri ve araç ile şoför belgelerinin bitiş tarihlerini tek yerde tutar. Şoför telefondan yoklama alır, veli sefer durumunu ve ödemesini kendi sayfasından görür. Program konum toplamaz.',
  kimler: 'Okul servisi işletmeleri ve personel servisi çalıştıran taşımacılar. Tek araçla da, birden çok güzergâhla da kullanılır.',
  ilkNot: 'Öğrenci eklemeden önce araç, şoför ve güzergâh gerekir: **Güzergâh ve durak** alanı güzergâhlardan gelir. Program belgelerin geçerliliğini onaylamaz, yalnız girdiğiniz tarihleri hatırlatır.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Günün durumunu gösterir: aktif öğrenci, bu ay kalan ücret, belge uyarıları, yeni mesajlar ve bugünkü seferler. Güzergâhta araç veya şoför değişirse **Okula bugün bildirilecek değişiklikler** listesi çıkar. Okula haber verince satırdaki **Okula bildirildi** simgesine basın.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 900, adimlar: [['Üstteki kutular **Aktif öğrenci**, **Bu ay kalan**, **Belge uyarısı** ve **Yeni mesaj** sayılarını gösterir.', '.kpi'], ['**Sefer ekranı** yoklama sayfasını açar.', 'a.btn@Sefer ekranı'], ['**Yaklaşan belgeler** bitiş tarihi yaklaşan belgeleri listeler.', '.card@Yaklaşan belgeler']] }] }] },

    { id: 'sefer', ne: 'Şoför ve rehberin telefondan kullandığı yoklama ekranıdır. Şoför yalnız kendi güzergâhını görür. Program saate göre sabah veya akşam seferini seçer. Sefer öğrencileri durak sırasıyla listelenir, velinin gelmeyecek bildirimi ilgili satırda yazar.',
      gorevler: [{ baslik: 'Yoklama alma', ne: 'Sefer başlayınca **Gecikme bildir** düğmesi çıkar: yazdığınız dakika veli sayfasında duyuru olarak görünür. Sefer sonunda **Tüm koltukları kontrol ettim, araçta öğrenci kalmadı** kutusunu işaretleyip **Seferi bitir** düğmesine basın. Kutu işaretlenmeden sefer bitmez.', sahneler: [{ git: 'sefer', kirp: 'ana', adimlar: [['Güzergâhı seçin.', '#rt'], ['**Sabah** veya **Akşam** seferini seçin.', '[data-dir=am]'], ['**Seferi başlat** başlangıç saatini kaydeder, gecikme bu saate göre hesaplanır.', '#st'], ['Sabah **Bindi**, akşam **İndi** düğmesine basın. Yanlış bastıysanız aynı düğmeye yeniden basın.', '[data-mk]'], ['Gelmeyen öğrenci için **Binmedi** düğmesine basın.', '[data-v=binmedi]']] }] }],
      hatalar: [['Önce araçta öğrenci kalmadığını kontrol edip işaretleyin uyarısı çıkıyor.', 'Koltukları kontrol edip kutuyu işaretleyin, sonra **Seferi bitir** düğmesine basın.'], ['Size atanmış güzergâh yok yazıyor.', 'Ofis **Güzergâhlar** sayfasında sizi şoför veya rehber olarak atamalı ve kullanıcınızın personel kaydıyla eşleşmesi gerekir.']],
      not: 'Personel servisi güzergâhları bu ekranda listelenmez.' },

    { id: 'veli', ne: 'Velilerin bıraktığı şikâyet ve talepleri, gelmeyecek bildirimlerini ve duyuruları yönetir. Yanıtlar ve duyurular veli sayfasında görünür.',
      gorevler: [
        { baslik: 'Mesaj yanıtlama', sahneler: [{ git: 'veli', kirp: 'ana', adimlar: [['**Mesajlar**, **Gelmeyecekler** ve **Duyurular** sekmeleri arasında geçin.', '.tabs'], ['Satırdaki **Yanıtla** simgesi yanıt ve durum penceresini açar.', '[data-act=an]'], ['**Duyuru yap** yeni duyuru açar.', '#nw']] }] },
        { baslik: 'Duyuru yapma', sahneler: [{ git: 'veli', once: [['tikla', '#nw']], kirp: 'pencere', adimlar: [['**Başlık** yazın.', '.field@Başlık'], ['**Kime** alanında güzergâh seçin veya **Tüm veliler** bırakın.', '.field@Kime'], ['**Metin** alanına duyuruyu yazın.', '.field@Metin'], ['SMS de gitsin istiyorsanız **Velilere SMS de gönder** kutusunu işaretleyin.', '.check@Velilere SMS de gönder'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'tahsilat', ne: 'Aylık ücreti tahakkuk eder, ödemeleri ve gecikmeyi izler. **Kurumlar** sekmesinde personel servisi bedelleri bulunur. Tahakkuk aktif öğrenciler için yapılır, aynı ay iki kez yazılmaz. Kardeş indirimi tahakkukta uygulanır.',
      gorevler: [
        { baslik: 'Tahakkuk ve tahsilat', sahneler: [{ git: 'tahsilat', kirp: 'ana', adimlar: [['Ayı bu alandan seçin.', '#pe'], ['**tahakkuku** ile biten düğme seçili ayın borçlarını oluşturur.', '#ac'], ['**Ödenmeyen** süzgeci borcu kalanları gösterir.', '[data-ff=acik]'], ['**Hatırlatma gönder** ödemeyen velilere SMS gönderir.', '#rem'], ['**Tahsilat** simgesi ödeme penceresini açar.', '[data-act=pay]']] }] },
        { baslik: 'Kurum bedeli', ne: 'Personel servisi için tahakkuk, güzergâhtaki **Aylık kurum bedeli (₺)** tutarından yazılır.', sahneler: [{ git: 'tahsilat', once: [['tikla', '[data-tb=kurum]']], kirp: 'ana', adimlar: [['**Ödendi işaretle** kurum ödemesini kapatır.', '[data-act=bp]'], ['**e-Fatura kes** kurum faturasını oluşturur.', '[data-act=bi]']] }] }],
      hatalar: [['Bu ay için yeni tahakkuk yok uyarısı çıkıyor.', 'Tahakkuk yapılmıştır veya aktif öğrenci kalmamıştır.'], ['Tutar borçtan fazla uyarısı çıkıyor.', 'Fazla tutar hesapta kalmaz. İade edin veya sonraki ayı tahakkuk edin.']] },

    { id: 'ogrenciler', ne: 'Öğrencileri, durağını, veli iletişimini ve ücretini tutar. Yalnız taşıma için gereken bilgiler yazılır. Araç kapasitesi dolu güzergâha öğrenci eklenmez.',
      gorevler: [
        { baslik: 'Öğrenci ekleme', sahneler: [{ git: 'ogrenciler', once: [['tikla', 'button@Öğrenci ekle']], kirp: 'pencere', boy: 900, adimlar: [['**Güzergâh ve durak** zorunludur.', '.field@Güzergâh ve durak'], ['**Veli adı soyadı** ve **Veli telefonu** zorunludur. Veli sayfasına bu telefonla girilir.', '.field@Veli telefonu'], ['**Aylık ücret (₺)** boşsa Ayarlardaki ücret önerilir.', '.field@Aylık ücret'], ['Şoföre gereken kısa notu yazın. Bu alana sağlık bilgisi yazmayın.', '.field@Şoförün bilmesi gereken'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Satır işlemleri', sahneler: [{ git: 'ogrenciler', kirp: 'ana', adimlar: [['**Veli portal kodu** adresi ve kodu gösterir, **WhatsApp ile gönder** ile iletilir.', '[data-act=code]'], ['**Aydınlatma kaydı** veliye ekranda imzalatır. Metin Ayarlar sayfasından gelir.', '[data-act=kv]'], ['**Sözleşme** imza alır ve yazdırır.', '[data-act=sz]'], ['**Ayrılış** sonraki ayların tahakkukunu kaldırır, ödenmişse iadeyi kaydeder, kaydı pasife alır.', '[data-act=out]'], ['**Kişisel veriyi dışa aktar** bu kişinin verisini dosyaya verir.', '[data-act=xp]'], ['**Aydınlatma eksik** süzgeci imzası olmayanları gösterir.', 'button@Aydınlatma eksik']] }] }],
      alanlar: [['Sınıf', 'Öğrencinin sınıfı.'], ['Başlangıç tarihi', 'Servise başladığı gün.'], ['Ücretsiz taşınan öğrenci', 'Ücret tahakkuk edilmez.']],
      hatalar: [['Güzergâh dolu, kapasite aşılamaz uyarısı çıkıyor.', 'Başka güzergâh seçin veya **Araçlar** sayfasında doğru koltuk sayısını yazın.'], ['Önce Ayarlar sayfasına aydınlatma metnini girin uyarısı çıkıyor.', 'Metni hukukçunuzla hazırlayıp **Ayarlar** sayfasına yazın.'], ['Tahakkuk kaydı olan öğrenci silinmiyor.', 'Silmek yerine **Ayrılış** yapın. Ayrılan öğrencide **Anonimleştir** simgesi çıkar.']] },

    { id: 'guzergah', ne: 'Durak sırasını, sabah ve akşam saatlerini, aracı, şoförü ve doluluğu tutar. Araç, şoför veya rehber değişirse program bunu **Özet** sayfasındaki okula bildirilecekler listesine yazar.',
      gorevler: [{ baslik: 'Güzergâh ekleme', sahneler: [
        { git: 'guzergah', kirp: 'ana', adimlar: [['**Güzergâh ekle** yeni kayıt açar.', 'button@Güzergâh ekle'], ['**Durak listesi yazdır** güzergâh ve durak listesini basar.', '[data-act=pr]'], ['**Doluluk** öğrenci sayısını ve koltuk sayısını gösterir.', 'th@DOLULUK']] },
        { git: 'guzergah', once: [['tikla', 'button@Güzergâh ekle']], kirp: 'pencere', boy: 1000, adimlar: [['**Araç** ve **Şoför** zorunludur.', '.field@Araç'], ['**Sabah çıkış** ve **Akşam çıkış** saatlerini girin. Gecikme bu saatlere göre hesaplanır.', '.field@Sabah çıkış'], ['Her durağı ayrı satıra yazın: durak adı; sabah saati; akşam saati.', '.field@Duraklar'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Tür', 'Okul servisi veya personel servisi.'], ['Rehber', 'Araçtaki rehber personel.'], ['Kurum (personel servisi)', 'Hizmet verilen kurum.'], ['Aylık kurum bedeli (₺)', 'Kurum tahakkukunda kullanılır.']],
      hatalar: [['Araç aynı saatte başka güzergâhta uyarısı çıkıyor.', 'Aynı sabah çıkışına aynı araç iki kez yazılamaz.'], ['Kapasite aşılamaz uyarısı çıkıyor.', 'Araçtaki koltuk sayısı güzergâhtaki öğrenciden az olamaz.']] },

    { id: 'araclar', ne: 'Araçları, ruhsattaki koltuk sayısını ve belge durumunu gösterir. Kapasite buradan denetlenir. Güzergâhta kullanılan araç silinemez.',
      gorevler: [{ baslik: 'Araç ekleme', sahneler: [{ git: 'araclar', once: [['tikla', 'button@Araç ekle']], kirp: 'pencere', adimlar: [['**Plaka** yazın.', '.field@Plaka'], ['**Ruhsattaki koltuk sayısı** ruhsata göre girilir.', '.field@Ruhsattaki koltuk sayısı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'personel', ne: 'Şoför ve rehberleri tutar. Güzergâhta görevli kişi silinemez. Burada eklenen kişi programa giriş yapamaz, giriş için Ayarlar sayfasından kullanıcı açın.',
      gorevler: [{ baslik: 'Personel ekleme', sahneler: [{ git: 'personel', kirp: 'ana', adimlar: [['**Personel ekle** düğmesine basın, **Ad soyad**, **Görev** ve **Telefon** girin.', 'button@Personel ekle']] }] }] },

    { id: 'okullar', ne: 'Taşıma yapılan okulları tutar. Öğrencisi olan okul silinemez.',
      gorevler: [{ baslik: 'Okul ekleme', sahneler: [{ git: 'okullar', kirp: 'ana', adimlar: [['**Okul ekle** düğmesine basın, **Okul adı** ve **Telefon** girin.', 'button@Okul ekle']] }] }] },

    { id: 'belgesure', ne: 'Araç, şoför ve rehber belgelerinin bitiş tarihlerini izler. Sorunlu belge varsa yalnız onlar listelenir. Uyarı süresini **Belge uyarısı (gün önce)** ayarı belirler. Sayfanın altındaki not belge listesinin dayandığı metni yazar, listeyi kurumunuzdan teyit edin.',
      gorevler: [{ baslik: 'Bitiş tarihi güncelleme', sahneler: [{ git: 'belgesure', kirp: 'ana', adimlar: [['Üstteki kutular **Süresi geçen**, **Yaklaşan** ve **Tarih girilmemiş** sayılarıdır.', '.kpi'], ['**Tarihi güncelle** simgesine basın, tarihi YYYY-AA-GG biçiminde yazın.', '[data-act=dt]']] }] }],
      hatalar: [['Tarih YYYY-AA-GG biçiminde olmalı uyarısı çıkıyor.', 'Tarihi 2027-01-31 gibi yazın.']] },

    { id: 'rapor', ne: 'Son 30 günün sefer gecikmelerini ve en çok binmeyen öğrencileri gösterir.',
      gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'rapor', kirp: 'ana', adimlar: [['**Excel (CSV)** sefer kayıtlarını dosyaya alır.', '#cs'], ['**5 dk üstü** planlanan çıkıştan 5 dakikadan çok geç başlayan sefer sayısıdır.', 'th@5 DK ÜSTÜ'], ['**Boşaltma kontrolsüz** araç boşaltma kutusu işaretlenmemiş sefer sayısıdır.', 'th@BOŞALTMA KONTROLSÜZ']] }] }] },

    { ...O.imzali(), ne: 'Karşı tarafa ekranda imzalatılan belgeler içindir. Bu programda hazır form gelmez. Form eklemek için **Şablonları tasarla** düğmesini veya Ayarlar sayfasındaki **Hazır şablonlar** bölümünü kullanın. Servis sözleşmesi ve aydınlatma imzası **Öğrenciler** sayfasından alınır.', gorevler: [{ baslik: 'Form ekleme', sahneler: [{ git: 'imzali', kirp: 'ana', adimlar: [['Form tasarlamak için **Şablonları tasarla** düğmesini kullanın.', 'a@Şablonları tasarla']] }] }] },
    O.belgeler({ tur: 'Servis hizmet sözleşmesi' }),
    O.ayarlar({ alanlar: [['Varsayılan aylık ücret (₺)', 'Yeni öğrencide önerilen ücret.'], ['Kardeş indirimi (%)', 'Aynı veli telefonundaki kardeşlerde uygulanır.'], ['Fatura KDV oranı (%)', 'Tahsilatta kesilen faturada kullanılır.'], ['Belge uyarısı (gün önce)', 'Belge bu kadar gün kala uyarı verir.'], ['Sözleşme metni (avukatınıza gösterin)', 'Servis hizmet sözleşmesine yazılır.'], ['Aydınlatma metni (hukukçunuzla hazırlayın)', 'Veliye imzalatılan metin.'], ['Aydınlatma metni sürümü', 'Metin değişince sürüm artırılır, imza kaydına yazılır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Şoför ve rehber yalnız kendi güzergâhını, öğrencinin adını, durağını ve kısa notunu görür. Veli telefonu, ücret, giriş kodu, sözleşme, tahsilat ve mesajlar bu role gönderilmez. Yalnız yoklama ve gecikme bildirimi yazar.',
  musteri: [{ ad: 'Veli sayfası', ne: 'Veli kayıtlı telefonu ve giriş koduyla girer. Durağı, saatleri, aracı, bugünkü sefer durumunu, çocuğunun bindi veya binmedi bilgisini, ödemelerini ve duyuruları görür. **Gelmeyecek bildir** ile tarih ve sefer seçer, **Şikâyet ve talep** bölümünden mesaj bırakır. Sayfa konum göstermez. Kodu **Öğrenciler** sayfasındaki **Veli portal kodu** simgesinden alırsınız.',
    sahneler: [
      { adres: 'veli.html', ilk: 700, kirp: 'tam', adimlar: [['Veli kayıtlı telefonunu yazar.', '#ph'], ['Firmadan aldığı giriş kodunu yazar.', '#cd'], ['**Giriş yap** düğmesine basar.', '#go']] },
      { git: 'ozet', once: VELI, kirp: 'tam', boy: 1300, adimlar: [['Çocuğun durağı, saatleri ve sefer durumu burada yazar.', '.tk-panel'], ['**Gelmeyecek bildir** seçilen gün için şoföre bildirim düşer.', '[data-ab]']] }] }],
  yazdirma: { ne: 'Belgeler işlem yapılan ekrandan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Güzergâh ve durak listesi', '**Güzergâhlar** listesinde **Durak listesi yazdır** simgesi.'], ['Servis hizmet sözleşmesi', '**Öğrenciler** listesinde **Sözleşme** simgesi.'], ['Tahsilat makbuzu', 'Tahsilat penceresinde **Makbuz yazdır** işaretlenirse açılır.']] },

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bağlandıktan sonra **Hatırlatma gönder** ödemeyen velilere, **Velilere SMS de gönder** seçilen duyuru velilere SMS olarak gider.', 'Gönderim sonunda kaç SMS gittiği ekranda yazar.', 'Bağlantı yokken gönderimler **TEST** sayılır, veliye bir şey gitmez.'], sorun: [...DENEME_HATA, 'Hata görünüyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.'] },
    whatsapp: { degisir: ['**Veli portal kodu** penceresindeki **WhatsApp ile gönder** WhatsApp’ı hazır mesajla açar, mesajı siz gönderirsiniz.', 'Bu düğme için hesap bağlamak gerekmez. Cloud API bağlansa da bu programda otomatik WhatsApp gönderimi olmaz.'], sorun: ['WhatsApp açılmıyorsa veli telefonunu kontrol edin.'] },
    efatura: { kapali: { edm: ILETISIM, logo: ILETISIM, mysoft: ILETISIM, sovos: ILETISIM }, degisir: [AKIS('e-Fatura / e-Arşiv', 'Deneme entegratöre zararsız bir istek atar, belge kesmez.'), 'Bağlandıktan sonra tahsilat penceresindeki **e-Arşiv fatura kes** ve **Kurumlar** sekmesindeki **e-Fatura kes** belgeyi entegratöre gönderir.', 'Belgeler **e-Belgeler** sayfasında görünür. Bağlantı yokken belge **TEST** etiketi taşır, GİB’e gitmez.'], sorun: [...DENEME_HATA, 'Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
