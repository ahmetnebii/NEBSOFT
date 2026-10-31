// Kargo & Kurye kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js kargo
module.exports = (O) => {
  const ebelge = O.ebelge();
  return {
    ne: 'Kargo & Kurye, gönderinin şubede kabulünden alıcıya teslimine kadar her adımı izler. Şube gönderiyi kabul edip etiket basar, operasyon kuryelere zimmetler, kurye teslim eder ve imza alır, kapıda tahsilat parası mutabakatla kapanır, alıcı takip numarasıyla gönderisini görür.',
    kimler: 'Şehir içi kurye firmaları, kargo acenteleri ve kendi dağıtımını yapan işletmeler.',
    ilkNot: 'Kabulden önce **Tarife & Ayarlar** sayfasındaki desi kademelerini, kapıda tahsilat komisyonunu ve şubeleri kendi işletmenize göre girin. Fiyat buradan hesaplanır.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Bugün kabul edilen, dağıtımdaki ve depodaki gönderileri, teslim başarısını, teslim edilemeyenleri ve kurye performansını gösterir.',
        gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1100, adimlar: [['**Depoda bekleyen** gönderiler zimmet bekler.', '.kpi@Depoda bekleyen'], ['**Teslim edilemeyenler** listesi yeniden dağıtım adaylarıdır.', 'h3@Teslim edilemeyenler'], ['**Kurye performansı (bugün)** dağıtımdaki ve teslim edilen adedi gösterir.', 'h3@Kurye performansı']] }] }] },

      { id: 'kabul', ne: 'Şubede gönderi kaydı açılır. Bilgi girildikçe fiyat anında hesaplanır, kabulde etiket yazdırılır.',
        gorevler: [{ baslik: 'Gönderi kabul etme', sahneler: [
          { git: 'kabul', en: 1400, boy: 1400, adimlar: [['**Kurumsal müşteri** seçilirse indirim ve cari ödeme gelir. Bireysel göndericide **Ad / firma** ve **Telefon** girin.', '.field@Kurumsal müşteri'], ['Alıcının **Ad soyad**, **Telefon** ve **Açık adres** bilgileri zorunludur.', '.field@Açık adres'], ['**Bölge** şehir içi veya şehir dışıdır, **Hizmet** teslim süresini belirler.', '.field@Hizmet'], ['Ölçüleri yazın. Desi ve ağırlıktan büyüğü ücrete yansır.', '.field@Ağırlık'], ['**Kabul et ve etiket yazdır** düğmesine basın.', 'button@Kabul et ve etiket yazdır']] }] }],
        alanlar: [['Kapıda tahsilat tutarı (₺)', 'Alıcıdan alınacak ürün bedeli. Komisyon ücrete eklenir.'], ['Gönderi ücretini kim öder', 'Gönderici, alıcı veya kurumsal cari.'], ['Peşin ödeme şekli', 'Şubede alınan ödemenin türü.'], ['Parça adedi', 'Etiket sayısı buna göre çıkar.']],
        hatalar: [['Alıcı telefonu eksik uyarısı çıkıyor.', 'Takip doğrulaması ve SMS için telefon gerekir.'], ['Tutar ve parça eksi olamaz uyarısı çıkıyor.', 'Değerleri düzeltin.'], ['Cari ödeme için kurumsal müşteri seçin uyarısı çıkıyor.', 'Üstte kurumsal müşteri seçin.']] },

      { id: 'gonderiler', ne: 'Tüm gönderileri durumlarıyla listeler. Etiket, takip linki, fatura ve anlaşmalı kargoya aktarma gönderi detayındadır.',
        gorevler: [
          { baslik: 'Gönderi arama', sahneler: [{ git: 'gonderiler', en: 1500, adimlar: [['Takip no, alıcı veya telefon yazın.', '#q'], ['**Aktif**, **Kabul**, **Depoda**, **Dağıtımda**, **Edilemedi**, **Teslim** veya **Tümü** ile süzün.', 'button@Edilemedi'], ['**Excel\'den gönderi al** toplu gönderi açar, sonra etiket yazdırmayı sorar.', '#imp'], ['Göz simgesi detayı açar.', '[data-act=v]']] }] },
          { baslik: 'Gönderi detayı', ne: 'Düğmeler duruma göre değişir: **Tekrar dağıtıma**, **Göndericiye iade**, **Transfer merkezine al**, **Anlaşmalı kargoya aktar** ve **Firma teslim etti**.', sahneler: [{ git: 'gonderiler', once: [['tikla', '[data-act=v]']], kirp: 'pencere', boy: 1000, adimlar: [['**Hareketler** gönderinin geçmişidir.', 'h3@Hareketler'], ['**Etiket** yeniden basar.', 'button@Etiket'], ['**Takip linki** alıcıya verilecek adresi verir.', 'button@Takip linki']] }] }],
        hatalar: [['Dosyada satır yok uyarısı çıkıyor.', 'Dosyanın dolu olduğunu kontrol edin.'], ['TEST: kargo bağlantısı simülasyonda uyarısı çıkıyor.', 'Firmada gönderi açılmamıştır. Entegrasyonlar bölümüne bakın.']] },

      { id: 'zimmet', ne: 'Depodaki şehir içi gönderileri bölgeye göre kuryelere zimmetler. Zimmetlenen gönderi dağıtıma geçer.',
        gorevler: [{ baslik: 'Kuryeye zimmetleme', sahneler: [{ git: 'zimmet', en: 1400, boy: 1000, adimlar: [['**Bölgeye göre otomatik zimmetle** kuryenin bölgesine göre dağıtır.', '#auto'], ['Elle seçim için kurye seçin.', '#kc'], ['**Seçilenleri zimmetle** düğmesine basın.', '#as'], ['**Dağıtım listesi** kuryenin listesini yazdırır.', 'button@Dağıtım listesi'], ['**Kurye konumları** araç takip bağlantısı içindir.', '#gps']] }] }],
        hatalar: [['Gönderi seçin uyarısı çıkıyor.', 'En az bir gönderi işaretleyin.']] },

      { id: 'kurye', ne: 'Kuryenin telefondaki ekranıdır. Dağıtımdaki paketleri sıralar, teslimi ve imzayı alır, üzerindeki parayı gösterir. Yönetici buradan kurye seçer. Kurye rolüyle giren kişi yalnız bu sayfayı görür.',
        gorevler: [{ baslik: 'Teslim etme', ne: 'Her paket satırında **Teslim et** ve **Teslim edilemedi** düğmeleri bulunur. Teslimde alıcı imzası gerekir, tahsilat varsa nakit veya kart sorulur. Teslim edilemezse neden seçilir. Sıralamayı **Sırayı yukarı al** ile değiştirirsiniz.', sahneler: [{ git: 'kurye', adimlar: [['Yönetici kuryeyi buradan seçer.', '#kc'], ['**Üzerimdeki para** kapıda tahsilat ve alıcı ödemeli ücrettir.', '.kpi@Üzerimdeki para']] }] }],
        hatalar: [['Alıcı imzası gerekli uyarısı çıkıyor.', 'Alıcıya ekranda imzalatın.'], ['Dağıtımda paketiniz yok yazıyor.', 'Zimmetlenmiş paket kalmamıştır.']] },

      { id: 'mutabakat', baslik: 'KT Mutabakatı', ne: 'Kapıda tahsilat parasının izidir. Önce kuryeden para alınır, sonra göndericiye ödenir. Bu sayfayı yalnız operasyon müdürü görür.',
        gorevler: [{ baslik: 'Kuryeden para alma ve göndericiye ödeme', sahneler: [
          { git: 'mutabakat', en: 1700, boy: 1000, adimlar: [['**Kuryelerdeki para** teslim alınmamış tutardır.', '.kpi@Kuryelerdeki para'], ['Kurye geldiğinde **Say ve teslim al** düğmesine basın.', 'button@Say ve teslim al'], ['Gönderici için **Ödendi** düğmesine basın.', 'button@Ödendi']] },
          { git: 'mutabakat', once: [['tikla', 'button@Say ve teslim al']], kirp: 'pencere', adimlar: [['**Sayılan nakit (₺)** ve **POS raporundaki kart toplamı (₺)** girin.', '.field@Sayılan nakit'], ['Fark varsa **Not (fark varsa açıklama)** yazın, **Kaydet** düğmesine basın.', 'button@Kaydet']] },
          { git: 'mutabakat', once: [['tikla', 'button@Ödendi']], kirp: 'pencere', adimlar: [['**Ödeme yöntemi** ve **Dekont / referans no** girin, **Kaydet** düğmesine basın.', '.field@Ödeme yöntemi']] }] }] },

      { id: 'cariler', baslik: 'Kurumsal Müşteriler', ne: 'İndirimli tarife, aylık toplu fatura ve ödeme takibidir. Bu sayfayı yalnız operasyon müdürü görür.',
        gorevler: [{ baslik: 'Kurumsal müşteri ve aylık fatura', sahneler: [
          { git: 'cariler', en: 1500, adimlar: [['**Yeni kurumsal müşteri** düğmesine basın.', 'button@Yeni kurumsal müşteri'], ['**Aylık döküm** dönemin gönderilerini yazdırır.', "button[title='Aylık döküm']"], ['**Aylık fatura kes** döneme fatura oluşturur.', "button[title='Aylık fatura kes']"], ['**Fatura ödendi** ödemeyi kaydeder.', "button[title='Fatura ödendi']"]] },
          { git: 'cariler', once: [['tikla', 'button@Yeni kurumsal müşteri']], kirp: 'pencere', boy: 1000, adimlar: [['**Firma** zorunludur.', '.field@Firma'], ['**İndirim %** kabulde uygulanır.', '.field@İndirim'], ['Fatura için **VKN / TCKN** gerekir.', '.field@VKN'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Önce müşterinin VKN / TCKN bilgisini girin uyarısı çıkıyor.', 'Müşteri kartını düzenleyin.'], ['Bu dönemde faturalanacak cari gönderi yok uyarısı çıkıyor.', 'Dönemi kontrol edin.'], ['Ödeme bekleyen gerçek fatura yok uyarısı çıkıyor.', 'TEST faturalar ödeme kabul etmez.']] },

      { id: 'kuryeler', ne: 'Kuryeleri, araçlarını, bölgelerini, teslim sayısını ve primini tutar. Bu sayfayı yalnız operasyon müdürü görür.',
        gorevler: [{ baslik: 'Kurye ekleme', sahneler: [
          { git: 'kuryeler', en: 1400, adimlar: [['**Yeni kurye** düğmesine basın.', 'button@Yeni kurye'], ['**Bu ayın hakediş dökümü** kuryenin primini yazdırır.', "button[title='Bu ayın hakediş dökümü']"]] },
          { git: 'kuryeler', once: [['tikla', 'button@Yeni kurye']], kirp: 'pencere', adimlar: [['**Ad soyad**, **Araç** ve **Plaka** girin.', '.field@Ad soyad'], ['**Bölgeler (virgülle)** otomatik zimmeti belirler.', '.field@Bölgeler'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        alanlar: [['Teslim başına prim (₺)', 'Boşsa ayarlardaki tutar geçerlidir.']] },

      { id: 'raporlar', ne: 'Gönderi, ciro, ortalama teslim süresi, ilk denemede teslim, ilçe, teslim edilememe nedeni, şube ve kurye hakedişini gösterir. Bu sayfayı yalnız operasyon müdürü görür.',
        gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'raporlar', boy: 1500, en: 1400, adimlar: [['Dönemi buradan seçin.', '#pk'], ['**Teslim edilememe nedenleri** sorunun kaynağını gösterir.', 'h3@Teslim edilememe nedenleri'], ['**Şube bazında** şube sonuçlarını gösterir.', 'h3@Şube bazında'], ['Kurye hakedişi ayın primini listeler.', 'h3@Kurye hakedişi']] }] }] },

      O.imzali(),
      O.belgeler(),
      { ...O.ayarlar({ alanlar: [['Desi kademeleri (desi:fiyat,...)', 'Ücret tablosu.'], ['Son kademe üstü desi başı (₺)', 'Son kademeyi aşan desi ücreti.'], ['Kapıda tahsilat komisyonu %', 'Tahsilat tutarına uygulanan oran.'], ['KT en az ücret (₺)', 'Komisyonun alt sınırı.'], ['Gönderi ücreti KDV oranı (%)', 'Ücret KDV oranı.'], ['Şubeler (virgülle)', 'Kabulde seçilen şubeler.'], ['Şehir içi sayılan il', 'Bu il şehir içi tarifeye girer.'], ['Teslim başına kurye primi (₺)', 'Kuryede ayrı değer yoksa geçerlidir.'], ['Dağıtıma çıkınca alıcıya SMS gönder', 'Zimmette alıcıya SMS gider.']] }), baslik: 'Tarife & Ayarlar' },
      O.bildirimler(),
      { ...ebelge, ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. **Fatura kes** ve **Aylık fatura kes** belgeyi buraya işler. Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur, bu yüzden belgeler TEST görünür, GİB’e gitmez. Resmî fatura için entegratörünüzün panelini kullanın.', hatalar: [['Belge TEST olarak görünüyor.', 'Bu programda entegratör bağlantısı kurulmaz. TEST belgeler resmî belge değildir.']] },
      O.entegrasyonlar(),
    ],
    roller: 'Kabul rolü özet, kabul, gönderi ve zimmet ekranlarını görür. Kurye rolü yalnız **Kurye Ekranı** ile çalışır.',
    musteri: [{ ad: 'Gönderi takip sayfası', ne: 'Alıcı veya gönderici takip numarasıyla gönderisinin durumunu görür. Üyelik gerekmez. Adresi gönderi detayındaki **Takip linki** ile alırsınız. Yardım bölümünden işletmeyi arayabilir veya WhatsApp’tan yazabilir.',
      sahneler: [{ adres: 'takip.html', ilk: 900, kirp: 'tam', adimlar: [['Takip numarası bu kutuya yazılır.', '#k']] }] }],
    yazdirma: { ne: 'Belgeler kabul, zimmet ve mutabakat ekranlarından yazdırılır.', belgeler: [['Gönderi etiketi', 'Kabulde otomatik veya detayda **Etiket**.'], ['Dağıtım listesi', '**Zimmet & Dağıtım** sayfası.'], ['Aylık gönderi dökümü', '**Kurumsal Müşteriler** sayfasında **Aylık döküm**.'], ['Kapıda tahsilat ödeme dökümü', '**KT Mutabakatı** sayfası.'], ['Kurye hakediş dökümü', '**Kuryeler** sayfasında **Bu ayın hakediş dökümü**.']] },
    entegrasyon: {
      kargofirma: { degisir: ['Gönderi detayındaki **Anlaşmalı kargoya aktar** gönderiyi seçilen firmaya verir.', '**Entegre et** ile firmayı seçip bilgileri girersiniz. Yurtiçi Kargo ve Geliver’de gönderi firmada açılabilir. Aras, PTT Kargo, UPS ve DHL Express’te durum sorgulanır, gönderi firmanın panelinde açılıp takip numarası elle girilir.', '**Bağlantıyı dene** gönderi oluşturmaz. Aras, PTT Kargo ve Yurtiçi’nde girdiğiniz gerçek bir gönderi numarası sorgulanır, kayıt dönerse başarılı sayılır.', 'MNG, HepsiJet, Kolay Gelsin ve Sendeo NEBSOFT ile iletişime geçerek açtırılır. Sendeo Geliver üzerinden de kullanılır.', 'Simülasyonda firmada gönderi açılmaz, sonuç TEST görünür.'], sorun: ['Takip numarası elle sorulursa gönderiyi firma panelinde açın ve numarayı girin.', 'Bilgileri değiştirdiyseniz **Bağlantıyı dene** adımını yineleyin.'] },
      gps: { degisir: ['Araç takip firmalarının dokümanı herkese açık değildir, bağlantı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **Kurye konumları** gerçek konum göstermez.', 'Simülasyonda sonuç TEST olarak görünür.'], sorun: ['Konumu araç takip firmanızın kendi panelinden izleyin.'] },
      sms: { degisir: ['**Entegre et** ile sağlayıcıyı seçip bilgileri girersiniz. **Bağlantıyı dene** hesap bakiyesini okur, ileti göndermez. **Bağlı** yazısı görünmeden SMS gönderilmez.', '**Dağıtıma çıkınca alıcıya SMS gönder** açıksa zimmette alıcıya mesaj gider, mesajda takip bilgisi yer alır.', 'Bağlantı yokken kayıt TEST olur, alıcıya gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.'] },
      whatsapp: { degisir: ['Bu programda yönetim ekranlarından WhatsApp mesajı gönderen düğme yoktur.', 'Takip sayfasının yardım bölümündeki WhatsApp bağlantısıyla alıcı işletmeye kendisi yazar.'], sorun: ['Takip sayfasındaki numara **Ayarlar** sayfasındaki telefondan gelir, bu alanı kontrol edin.'] },
      backup: O.E.backup(),
    },
  };
};
