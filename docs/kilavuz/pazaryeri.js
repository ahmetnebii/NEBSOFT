// Pazaryeri Satıcı Paneli kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js pazaryeri
module.exports = (O) => ({
  ne: 'Pazaryeri Satıcı Paneli, pazaryeri satışlarınızı tek ekranda yönetir: siparişleri listeler, depoda toplama ve paketlemeyi düzenler, stoku tek yerden tutar, iade ve müşteri sorularını izler, komisyon ve kargo düşülmüş tahmini kârı gösterir.',
  kimler: 'Trendyol, Hepsiburada, n11 ve benzeri pazaryerlerinde satış yapan işletmeler. Tek kişilik satıcıda da, depo ve müşteri hizmetleri ekibi olan yerde de kullanılır.',
  ilkNot: 'Yeni hesapta kanallar Demo (TEST) çalışır, pazaryerine bir şey gitmez. Canlıya almak için **Pazaryerleri** sayfasını kullanın.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz. Yanındaki sayılar bekleyen siparişleri, iadeleri ve soruları gösterir.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
  moduller: [
    { id: 'ozet', ne: 'Günün işini gösterir: bugünkü sipariş, kargoya verilecekler, gecikme riski, 30 günlük net kâr, ciro ve pazaryeri payı.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1100, adimlar: [['**Gecikme riski** kutusu kargoya verme süresine 6 saatten az kalan siparişlerdir.', '.kpi@Gecikme riski'], ['**Önce bunları kargolayın** listesi süresi en yakın siparişlerdir.', 'h3@Önce bunları kargolayın'], ['**Siparişleri çek** bağlı kanallardan yeni siparişleri alır.', '#pull']] }] }] },

    { id: 'siparisler', baslik: 'Siparişler', ne: 'Tüm pazaryerlerinin siparişleri tek listededir. Durum sekmeleri, kanal süzgeci, toplu işlem ve sipariş detayı buradadır.',
      gorevler: [
        { baslik: 'Siparişleri izleme', sahneler: [{ git: 'siparisler', en: 1500, adimlar: [['Durum sekmeleriyle süzün: **Kargolanacak**, **Yeni**, **Toplanıyor**, **Paketlendi**, **Kargoda**, **Teslim**, **İade**, **İptal**.', 'button@Toplanıyor'], ['Arama kutusuna sipariş no, alıcı, ürün veya barkod yazın.', '#q'], ['**Siparişleri çek** canlı kanallardan siparişleri alır. Demo kanallardan sipariş gelmez.', '#pull'], ['**Listeyi indir** listeyi dosyaya alır.', '#ex'], ['Göz simgesi sipariş detayını açar.', '[data-act=v]']] }] },
        { baslik: 'Sipariş detayı', ne: 'Detayda alıcı, ürünler, **Kâr hesabı** ve **Hareketler** görünür.', sahneler: [
          { git: 'siparisler', once: [['tikla', '[data-act=v]']], kirp: 'pencere', boy: 1000, adimlar: [['**Etiket** kargo etiketini basar.', 'button@Etiket'], ['**Fatura kes** e-Arşiv fatura oluşturur. Bağlantı yoksa fatura TEST görünür.', 'button@Fatura kes'], ['**Paketlemeye git** Paketleme sayfasına geçer.', 'button@Paketlemeye git'], ['**İptal et** siparişi iptal eder.', 'button@İptal et']] }] },
        { baslik: 'Elle sipariş girme', ne: 'Canlı bağlı olmayan kanalın siparişini buradan girersiniz. Pazaryerine bilgi gitmez, kargo ve durum güncellemesini pazaryeri panelinden yaparsınız.', sahneler: [
          { git: 'siparisler', once: [['tikla', '#man']], kirp: 'pencere', boy: 1050, adimlar: [['**Kanal**, **Pazaryeri sipariş no** ve **Alıcı adı** alanlarını doldurun.', '.field@Kanal'], ['Ürünü barkod, stok kodu veya adla bulup **Ekle** düğmesine basın.', 'button@Ekle'], ['**Siparişi kaydet** düğmesine basın.', 'button@Siparişi kaydet']] }] }],
      hatalar: [['Takip numarası girilmeyen sipariş kargoya verilmedi uyarısı çıkıyor.', 'Kargoya vermeden önce takip numarasını girin.'], ['Siparişte **Eşleşmeyen ürün** etiketi var.', 'Barkod ürünlerde bulunamamıştır. Sipariş detayından ürünle eşleştirin, stok o zaman düşer.'], ['Ürün seçin uyarısı çıkıyor.', 'Elle siparişe en az bir ürün ekleyin.']] },

    { id: 'toplama', ne: 'Bekleyen siparişlerin ürünlerini raf sırasına göre listeler. Depoda tek turda toplamayı sağlar.',
      gorevler: [{ baslik: 'Toplama listesi oluşturma', sahneler: [{ git: 'toplama', boy: 900, adimlar: [['Liste oluşturma düğmesine basın. Düğmedeki sayı listeye girecek sipariş adedidir. Siparişler **Toplanıyor** durumuna geçer.', '#mk'], ['Ürünler **RAF** sütununa göre sıralıdır.', 'h3@Toplanacak ürünler']] }] }] },

    { id: 'paketleme', ne: 'Sipariş veya ürün barkodu okutulur, ürünler doğrulanır, paket kapanır. Ayarlara göre etiket ve fatura kendiliğinden çıkar.',
      gorevler: [{ baslik: 'Paket hazırlama', sahneler: [{ git: 'paketleme', adimlar: [['Sipariş no, paket no veya ürün barkodunu okutun. Tek ürünlü siparişlerde doğrudan ürün barkodu yeterlidir.', '#scan'], ['Durum burada görünür. Yanlış ürün okutulursa program uyarır.', '#box'], ['Gün içi sayılar burada görünür.', '#stat']] }] }],
      hatalar: [['Barkod bulunamadı uyarısı çıkıyor.', 'Barkod ürünlerde kayıtlı değildir.'], ['Bu ürün bu siparişte yok! uyarısı çıkıyor.', 'Yanlış ürün okutuldu. Paketi kontrol edin.'], ['Bu üründen fazla okuttunuz uyarısı çıkıyor.', 'Siparişteki adetten fazla okuttunuz.'], ['Eşleşmeyen ürün var uyarısı çıkıyor.', 'Önce sipariş detayından ürünü eşleştirin.']] },

    { id: 'gelen', ne: 'Pazaryerlerinin sunucuya gönderdiği bildirimleri listeler. Yalnız resmî biçimi doğrulanan bildirim siparişe çevrilir, şu an bu Trendyol’un yeni sipariş bildirimidir. Diğerleri tahminle okunmaz, **Elle incele** listesinde durur.',
      gorevler: [{ baslik: 'Bildirimleri okuma', sahneler: [{ git: 'gelen', bulanik: ['#wh code'], adimlar: [['**Kutuyu oku** bekleyen bildirimleri alır.', '#hp'], ['Sekmeler bildirimin durumunu gösterir: **Elle incele**, **Siparişe çevrilen**, **Kapatılan**.', 'button@Siparişe çevrilen']] }] }] },

    { id: 'iadeler', baslik: 'İadeler', ne: 'Pazaryeri iade taleplerini izlersiniz. Ürün depoya gelince kontrol eder, sağlamsa stoğa alırsınız.',
      gorevler: [{ baslik: 'İade kontrolü', sahneler: [
        { git: 'iadeler', en: 1400, adimlar: [['İade kargo barkodunu veya sipariş numarasını okutun.', '#sc'], ['**İşlem bekleyen**, **Onaylanan**, **Reddedilen** veya **Tümü** ile süzün.', 'button@Onaylanan'], ['Satırdaki **Kontrol et / sonuçlandır** simgesine basın.', 'button[title="Kontrol et / sonuçlandır"]']] },
        { git: 'iadeler', once: [['tikla', 'button[title="Kontrol et / sonuçlandır"]']], kirp: 'pencere', adimlar: [['**Ürün durumu** seçin. Sağlam ürün stoğa döner. Hasarlı ürünün itirazı pazaryeri panelinden açılır.', '.field@Ürün durumu'], ['İtirazda kullanacağınız notu yazıp **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Bu barkoda ait açık iade yok uyarısı çıkıyor.', 'Barkodu kontrol edin veya listeden seçin.']] },

    { id: 'sorular', baslik: 'Müşteri Soruları', ne: 'Pazaryerlerinden gelen ürün sorularını listeler. Hazır yanıtlar **Ayarlar** sayfasındaki **Hazır soru yanıtları (her satır bir yanıt)** alanından gelir.',
      gorevler: [{ baslik: 'Soru yanıtlama', sahneler: [
        { git: 'sorular', adimlar: [['**Soruları çek** yeni soruları alır.', '#pull'], ['Satırdaki **Yanıtla** düğmesine basın.', 'button@Yanıtla']] },
        { git: 'sorular', once: [['tikla', 'button@Yanıtla']], kirp: 'pencere', adimlar: [['**Hazır yanıt** seçin veya **Yanıtınız** alanına yazın, **Kaydet** düğmesine basın.', '.field@Yanıtınız']] }] }],
      hatalar: [['Yanıt 10–2000 karakter olmalı uyarısı çıkıyor.', 'Yanıtı bu uzunlukta yazın.']] },

    { id: 'urunler', ne: 'Stok tek yerde tutulur. Her üründe kalan gün tahmini, raf, maliyet, fiyat ve listelendiği kanallar görünür. Üründe kanal başına stok tamponu **Pazaryerleri** ayarından gelir.',
      gorevler: [
        { baslik: 'Ürün ekleme', sahneler: [
          { git: 'urunler', en: 1400, adimlar: [['Yeni ürün için **Ürün** düğmesine basın.', '#add'], ['**Excel\'den al** dosyadan ürün alır.', '#imp'], ['**Tüm kanallara stok gönder** stoku bağlı kanallara gönderir.', '#sync'], ['**Kritik stok**, **Hatalı listeleme**, **Eksik kanal** ve **Model grupları** ile süzün.', 'button@Eksik kanal']] },
          { git: 'urunler', once: [['tikla', '#add']], kirp: 'pencere', boy: 1100, adimlar: [['**Ürün adı**, **Barkod** ve **Stok kodu** zorunludur.', '.field@Ürün adı'], ['**Raf / lokasyon** toplama listesindeki sırayı belirler.', '.field@Raf'], ['**Maliyet (₺)** kâr hesabında kullanılır.', '.field@Maliyet'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Stok girme ve düşme', sahneler: [
          { git: 'urunler', once: [['tikla', 'button[title="Stok gir / düş"]']], kirp: 'pencere', adimlar: [['**İşlem** seçin: **Giriş (mal kabul)**, **Çıkış (fire / hasar)** veya **Sayım (stoğu eşitle)**.', '.field@İşlem'], ['**Adet** yazıp **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Model grubu', 'Aynı modelin renk ve bedenlerini birleştirir.'], ['Renk / beden', 'Ürünün varyant bilgisi.'], ['Satış fiyatı (₺)', 'Satış fiyatı.'], ['Kritik stok', 'Bu miktarın altında ürün kritik sayılır.'], ['Desi', 'Kargo hesabı için ürün hacmi.'], ['KDV %', 'Fatura ve kâr hesabında kullanılır.']] },

    { id: 'kanallar', ne: 'Her pazaryerinin bağlantısını, komisyonunu ve ödeme süresini tutar. Kart üzerinde **Canlı** veya **Demo (TEST)** etiketi görünür. Altta **Senkron günlüğü** tüm işlemleri kaydeder. Bu programda pazaryeri bağlantısı Entegrasyonlar sayfasından değil, buradan kurulur.',
      gorevler: [{ baslik: 'Kanalı canlıya alma', ne: 'Trendyol ve n11 canlıya alınabilir. **Canlı (gerçek API)** seçilince **Kaydet ve test et** pazaryerine bağlantı denemesi yapar, başarısızsa kaydetmez.', sahneler: [
        { git: 'kanallar', boy: 1300, adimlar: [['Bağlı kanalda **Ayarlar**, bağlı olmayanda **Bağlan** düğmesine basın.', 'button@Ayarlar'], ['Yapılan işlemler **Senkron günlüğü** kartındadır.', 'h3@Senkron günlüğü']] },
        { git: 'kanallar', once: [['tikla', 'button@Ayarlar']], kirp: 'pencere', boy: 1000, adimlar: [['**Çalışma modu** alanında **Canlı (gerçek API)** seçin.', '.field@Çalışma modu'], ['**Satıcı ID**, **API key** ve **API secret** bilgilerini satıcı panelinizin entegrasyon bölümünden alın.', '.field@Satıcı ID'], ['**Test ortamı (stage)** işaretliyse canlı mağaza değişmez.', 'label@Test ortamı'], ['**Stok tamponu (adet)** kanala gönderilen stoktan düşülür, son ürünün iki kez satılma riskini azaltır.', '.field@Stok tamponu'], ['**Kaydet ve test et** düğmesine basın.', 'button@Kaydet ve test et']] }] }],
      alanlar: [['Komisyon %', 'Sözleşmenizdeki oran. Kâr hesabı buna göre yapılır.'], ['Sipariş başı hizmet bedeli (₺)', 'Sipariş başına kesilen bedel.'], ['Teslimden sonra ödeme (gün)', 'Tahmini ödeme takvimi buna göre oluşur.'], ['Kargoya verme süresi (gün)', 'Gecikme riski buna göre hesaplanır.']],
      not: 'Hepsiburada, Amazon TR, Pazarama, Çiçeksepeti ve İdefix bu sayfada demo kanalı olarak görünür, siparişleri **Elle sipariş** ile girersiniz. Canlı bağlantı için NEBSOFT ile iletişime geçin.',
      hatalar: [['Canlı mod için API bilgileri gerekli uyarısı çıkıyor.', '**API key** ve **API secret** alanlarını doldurun.'], ['Bağlantı kurulamadı uyarısı çıkıyor.', 'Bilgileri satıcı panelinden yeniden kopyalayın. Test ve canlı bilgileri farklıdır.'], ['Sunucu köprüsüne ulaşılamadı uyarısı çıkıyor.', 'Program yerel kurulumda sunucusu açıkken çalışmalıdır.']] },

    { id: 'fiyat', ne: 'Maliyet, komisyon, hizmet bedeli ve kargodan sonra hedef marjı bırakacak en düşük fiyatı hesaplar. Hedef marj **Ayarlar** sayfasından girilir. Girilmediyse tablo yalnız zarar eşiğini gösterir.',
      gorevler: [{ baslik: 'Fiyatı tabana çekme', sahneler: [{ git: 'fiyat', adimlar: [['Taban fiyatın altında kalan ürünler ve fark burada listelenir. Tek ürün için satırdaki **Tabana çek** düğmesini kullanın. Altında ürün yoksa alan boş görünür.', '#t'], ['**Tümünü tabana çek** tüm satırları günceller.', '#all']] }] }],
      hatalar: [['Tabanın altında fiyat yok uyarısı çıkıyor.', 'Tüm fiyatlar tabanın üstündedir.']] },

    { id: 'hakedis', ne: 'Son 45 günün satışını, kesintisini, beklenen ödemesini ve net kârını gösterir. Rakamlar **Pazaryerleri** ayarındaki oranlarla hesaplanan tahmindir, pazaryerinin ödeme belgesinin yerini tutmaz. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Kârı okuma', sahneler: [{ git: 'hakedis', boy: 1900, adimlar: [['Üstteki kutular dönem toplamıdır.', '.kpi'], ['**Kanal bazında** her pazaryerinin sonucunu gösterir.', 'h3@Kanal bazında'], ['**Tahmini ödeme takvimi** beklenen ödeme günlerini gösterir.', 'h3@Tahmini ödeme takvimi'], ['**Zarar eden siparişler** fiyatı gözden geçirilecek satırlardır.', 'h3@Zarar eden siparişler']] }] }] },

    { id: 'raporlar', ne: 'Son 30 günün sipariş, ciro, ortalama sepet ve iade oranını, kanala göre siparişi, iade nedenlerini ve en çok satan ürünleri gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'raporlar', boy: 1000, adimlar: [['**İade oranı** kutusu dönemin iade yüzdesidir.', '.kpi@İade oranı'], ['**İade nedenleri** en sık sorunları gösterir.', 'h3@İade nedenleri'], ['**En çok satan ürünler** adet, ciro ve kâr sıralar.', 'h3@En çok satan ürünler']] }] }] },

    O.belgeler(),
    O.ayarlar({ alanlar: [['Günlük kargo kesim saati', 'Kargoya verme için son saat.'], ['Varsayılan kargo firması', 'Yeni kayıtlarda önerilen firma.'], ['Kritik stok sınırı', 'Üründe ayrı değer yoksa bu sınır kullanılır.'], ['Hedef marj (satış fiyatının %)', 'Fiyat Kuralı sayfası bu marjı korur.'], ['Ortalama sipariş kargo gideri (₺)', 'Kâr hesabında kullanılır.'], ['Paketlemede e-Arşiv faturayı otomatik kes', 'Açıksa paket kapanınca fatura oluşturulur.'], ['Sipariş gelince stoğu tüm kanallara otomatik gönder', 'Açıksa yeni siparişten sonra stok kanallara gider.'], ['Tüm ürünler okutulunca paketi otomatik kapat', 'Açıksa son ürün okutulunca paket kapanır.'], ['Hazır soru yanıtları (her satır bir yanıt)', 'Müşteri Soruları penceresinde çıkan metinler.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],
  roller: 'Depo rolü sipariş, toplama, paketleme ve ürünlerle çalışır. Müşteri hizmetleri rolü sipariş, iade ve sorularla çalışır. Kanal, fiyat, kâr ve yönetim sayfaları yöneticiye aittir.',
  musteriYok: 'Pazaryeri Satıcı Paneli programında müşterinin kendisinin açtığı bir sayfa yoktur. Alıcılar pazaryeri üzerinden işlem yapar.',
  sssHaric: ['Hangi pazaryerleri bağlanıyor?'],
  sss: [['Hangi pazaryerleri bağlanıyor?', 'Bu programda Trendyol ve n11 **Pazaryerleri** sayfasından canlıya alınır, canlı kullanımdan önce satıcı test hesabıyla denenir. Diğer kanallar demo olarak görünür, siparişlerini **Elle sipariş** ile girersiniz. Canlı bağlantı için NEBSOFT ile iletişime geçin.']],
  yazdirma: { ne: 'Belgeler sipariş detayından ve toplama sayfasından yazdırılır.', belgeler: [['Kargo etiketi', 'Sipariş detayında **Etiket** düğmesi.'], ['Toplama listesi', '**Toplama Listesi** sayfasındaki önceki listeler.'], ['Fatura', 'Sipariş detayında **Fatura kes**, **e-Belgeler** sayfasından görüntüleme.']] },
  entegrasyon: {
    efatura: { degisir: ['Entegre et ile entegratörü seçip bilgileri girersiniz, Bağlantıyı dene hesabı doğrular. Bağlı yazısı görünmeden gerçek fatura kesilmez.', 'Sipariş detayındaki **Fatura kes** ve **Paketlemede e-Arşiv faturayı otomatik kes** ayarı belgeyi entegratöre gönderir, numara siparişe yazılır.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Simülasyonda belge TEST etiketlidir, GİB’e gitmez.', 'İade faturası yalnız gerçek satış faturası olan siparişte kesilir.'], sorun: ['Hata durumundaki belge için **e-Belgeler** sayfasındaki ayrıntıya bakın.', 'Bilgileri değiştirdiyseniz Bağlantıyı dene adımını yineleyin.'] },
    label: { degisir: ['Bu programda kargo etiketi tarayıcının yazdırma penceresiyle basılır. Yazıcı orada seçilir.', 'Sihirbazdaki deneme yazıcının çalıştığını sınamanızı sağlar, kargo etiketini doğrudan yazıcıya yöneltmez.'], sorun: ['Etiket kaymışsa yazdırma penceresinde kâğıt boyunu kontrol edin.'] },
    backup: O.E.backup(),
  },
});
