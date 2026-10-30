// E-ticaret kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js eticaret
// iyzico anlatılmaz: kodu henüz eticaret/iyzico-odeme dalındadır, bu dala dayanılmaz.
module.exports = (O) => ({
  ne: 'E-ticaret programı online mağazanızı ve siparişlerinizi yönetir. Ürünleri renk ve beden kırılımıyla tutar, siparişi hazırlıktan kargoya izler, kupon ve iadeleri yönetir, pazaryeri siparişlerini aynı listede toplar.',
  kimler: 'Giyim, aksesuar ve benzeri ürünleri internetten satan işletmeler. Hem kendi mağazası olan hem de pazaryerinde satan işletmeler için uygundur.',
  ilkNot: 'Mağazayı yayına almadan önce Mağaza Ayarları sayfasındaki iade, kargo ve havale bilgilerini gerçek bilgilerinizle doldurun. Mağazada kartla ödeme için ödeme sağlayıcısı bağlı değilse sipariş TEST olarak işaretlenir ve karttan para çekilmez.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Mağazanın durumunu gösterir: bugünkü sipariş, 30 günlük net ciro, ortalama sepet ve kargolanacak sipariş sayısı. TEST ödemeler ciroya katılmaz.',
      gorevler: [{ baslik: 'Güne başlarken', sahneler: [{ git: 'ozet', boy: 900, adimlar: [['Yeni siparişlere geçmek için **Yeni siparişler** düğmesine basın.', 'a@Yeni siparişler'], ['Mağazanızı müşteri gözüyle görmek için **Mağazayı aç** düğmesini kullanın.', 'a@Mağazayı aç'], ['**Kargolanacak** kutusu bekleyen işi gösterir.', '.kpi@Kargolanacak']] }] }] },

    { id: 'siparisler', ne: 'Mağaza ve pazaryeri siparişleri tek listede durur. Sipariş **Yeni**, **Hazırlanan**, **Kargoda** ve **Teslim** aşamalarından geçer.',
      gorevler: [
        { baslik: 'Siparişi hazırlama ve kargoya verme', sahneler: [
          { git: 'siparisler', kirp: 'ana', adimlar: [['Aşamaya göre süzmek için üstteki düğmeleri kullanın.', 'button@Hazırlanan'], ['Pazaryerindeki yeni siparişleri almak için **Pazaryeri siparişlerini çek** düğmesine basın.', '#mp'], ['Satırdaki göz simgesi siparişi açar.', '[data-act=v]']] },
          { git: 'siparisler', once: [['tikla', '[data-act=v]']], kirp: 'pencere', boy: 900, adimlar: [['Sipariş penceresinde sipariş durumuna göre **Hazırlanıyor**, **Kargoya ver** veya **Teslim edildi** düğmesi çıkar. **Paket fişi** paket içine konan fişi yazdırır.', 'button@Paket fişi']] }] },
        { baslik: 'Telefonla gelen siparişi girme', sahneler: [{ git: 'siparisler', once: [['tikla', '#newo']], kirp: 'pencere', boy: 900, adimlar: [['**Müşteri**, **Telefon**, **Şehir** ve **Adres** alanlarını doldurun.', '.field@Müşteri'], ['**Kaynak** ve **Ödeme** seçin. Ödemeyi aldıysanız **Ödeme alındı** kutusunu işaretleyin.', '.field@Kaynak'], ['Ürünleri ekleyip **Siparişi kaydet** düğmesine basın.', 'button@Siparişi kaydet']] }] }],
      hatalar: [['Önce eşleşmeyen ürünü eşleştirin uyarısı çıkıyor.', '**Eşleşmeyen Ürünler** sayfasından ürünü eşleştirin.'], ['Stok yetersiz uyarısı çıkıyor.', '**Ürünler & Stok** sayfasından varyant stoğunu güncelleyin.'], ['Önce paketi doğrulayın uyarısı çıkıyor.', 'Siparişte **Paketi doğrula** düğmesini kullanın. Bu kural **Mağaza Ayarları** sayfasından kapatılır.'], ['Takip numarası olmadan etiket basılmaz uyarısı çıkıyor.', 'Kargoya verirken takip numarasını girin.'], ['En az bir ürün ekleyin uyarısı çıkıyor.', 'Elle siparişe ürün ekleyin.']] },

    { id: 'urunler', ne: 'Ürünleri renk ve beden kırılımıyla tutar. Stok her varyantta ayrı izlenir, satış hızına göre stoğun kaç günde biteceği gösterilir.',
      gorevler: [{ baslik: 'Yeni ürün ekleme', sahneler: [
        { git: 'urunler', adimlar: [['**Yeni ürün** düğmesine basın.', '#np'], ['Toplu güncelleme için **Excel\'den al** düğmesini kullanın.', '#imp'], ['Az kalan varyantları görmek için **Kritik stok (varyant ≤ 2)** kutusunu işaretleyin.', '#low']] },
        { git: 'urunler', once: [['tikla', '#np']], kirp: 'pencere', boy: 1000, adimlar: [['**Ürün adı**, **Kategori** ve **Fiyat (₺)** alanlarını doldurun.', '.field@Ürün adı'], ['Renkleri ve bedenleri işaretleyin. Tablo seçiminize göre varyant satırları oluşturur.', 'table'], ['Ürün mağazada görünsün istiyorsanız **Mağazada yayında** kutusunu işaretleyin.', '.field@Mağazada yayında'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['İndirimli fiyat (₺)', 'Doluysa mağazada indirimli fiyat görünür.'], ['Birim maliyet (₺, KDV hariç)', 'Kâr raporunda kullanılır.'], ['KDV oranı', 'Faturada kullanılan oran.'], ['Etiketler (virgülle)', 'Ürünü gruplamak için kısa sözcükler.'], ['Açıklama', 'Mağazadaki ürün açıklaması.']],
      hatalar: [['En az bir renk seçin uyarısı çıkıyor.', 'Varyant oluşması için bir renk işaretleyin.'], ['Bu ürünün siparişi var, silinemez uyarısı çıkıyor.', 'Ürünü silmek yerine yayından kaldırın.'], ['Kod başka üründe kullanılıyor uyarısı çıkıyor.', 'Her varyantın stok kodu ve barkodu ayrı olmalıdır.'], ['Gerekli sütun bulunamadı uyarısı çıkıyor.', 'Dosyada **Stok kodu** veya **Barkod** sütunu bulunmalıdır.']] },

    { id: 'kategoriler', ne: 'Mağaza vitrinindeki kategorileri tanımlar. Bu sayfayı yalnız mağaza sahibi görür.',
      gorevler: [{ baslik: 'Kategori ekleme', sahneler: [{ git: 'kategoriler', adimlar: [['**Yeni kategori** düğmesine basın, adı yazın.', 'button@Yeni kategori']] }] }],
      hatalar: [['Bu adla kategori var uyarısı çıkıyor.', 'Farklı bir ad yazın.']] },

    { id: 'pazaryeri', ne: 'Pazaryerlerini tek panelden yönetir. Kanalların durumu, siparişleri, komisyonu ve neti burada görünür. Demoda tüm kanallar simülasyondadır, işlemler pazaryerine gitmez.',
      gorevler: [{ baslik: 'Kanal bağlama ve eşitleme', sahneler: [
        { git: 'pazaryeri', kirp: 'ana', boy: 1100, en: 1500, adimlar: [['**Siparişleri çek** yeni siparişleri alır.', '#pull'], ['**Stok & fiyat gönder** güncel stoğu ve fiyatı iletir.', '#sync'], ['Kanal ayarı için **Bağlantı ve kurallar** düğmesine basın.', 'button@Bağlantı ve kurallar']] },
        { git: 'pazaryeri', once: [['tikla', 'button@Bağlantı ve kurallar']], kirp: 'pencere', boy: 950, adimlar: [['**Çalışma modu** alanından simülasyon veya canlıyı seçin. Canlı için bilgileri girmek gerekir.', '.field@Çalışma modu'], ['**Fiyat farkı % (komisyonu karşılamak için)** pazaryeri fiyatını mağaza fiyatından yukarı çeker.', '.field@Fiyat farkı'], ['**Stok tamponu (varyant başına düşülecek adet)** pazaryerine eksik stok gönderir, fazla satışı önler.', '.field@Stok tamponu'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Satıcı / mağaza no', 'Pazaryeri panelindeki satıcı numarası.'], ['API anahtarı', 'Pazaryeri panelinden alınır.'], ['API gizli anahtar', 'Pazaryeri panelinden alınır, kimseyle paylaşmayın.'], ['Komisyon % (sözleşmenize göre)', 'Hakediş hesabında kullanılır.'], ['Sipariş başı hizmet bedeli (₺)', 'Hakediş hesabından düşülür.'], ['Hakediş vadesi (teslimden sonra gün)', 'Ödeme tarihinin hesabı için.']],
      hatalar: [['Satıcı no ve API anahtarı gerekli uyarısı çıkıyor.', 'Canlı mod için iki alanı da doldurun.'], ['Bağlı pazaryeri yok uyarısı çıkıyor.', 'Önce bir kanal bağlayın.']],
      not: 'Canlı mod Trendyol ve n11 için çalışır. Hepsiburada API dokümanı doğrulanamadığı için bu kanalda canlı mod kapalıdır.' },

    { id: 'listeleme', ne: 'Hangi ürünün hangi pazaryerinde yayında olduğunu, fiyatını ve hatasını tek tabloda gösterir.',
      gorevler: [{ baslik: 'Eksik listelemeyi bulma', sahneler: [{ git: 'listeleme', adimlar: [['**Eksik kanalı olan** ve **Hatalı** süzgeçleriyle işi daraltın.', 'button@Eksik kanalı olan'], ['Satırları seçip üstteki kanal düğmesine basın.', 'button@Trendyol']] }] }],
      hatalar: [['En az bir ürün seçin uyarısı çıkıyor.', 'Tablodan ürün işaretleyin.']] },

    { id: 'eslesmeyen', ne: 'Pazaryeri siparişinde stok kodu veya barkodu tanınmayan kalemler burada listelenir. Bir kez eşleştirdiğiniz kod sonraki siparişlerde otomatik tanınır.',
      gorevler: [{ baslik: 'Listeyi izleme', sahneler: [{ git: 'eslesmeyen', adimlar: [['Liste boşsa bekleyen iş yoktur. Kayıt varsa ürünü seçerek eşleştirin.', '#view']] }] }],
      hatalar: [['Listeden ürün seçin uyarısı çıkıyor.', 'Eşleştirmek için bir ürün seçin.']] },

    { id: 'eslestirme', ne: 'Kendi kategorilerinizi her pazaryerinin kategori ağacıyla bir kez eşleştirirsiniz.',
      gorevler: [{ baslik: 'Kategori eşleştirme', sahneler: [{ git: 'eslestirme', adimlar: [['Boş kalanlar için **Boşları otomatik öner** düğmesine basın, önerileri kontrol edin.', '#auto'], ['Satırdaki listeden doğru pazaryeri kategorisini seçin.', 'td select']] }] }] },

    { id: 'hakedis', ne: 'Sipariş bazında komisyon, hizmet bedeli, kargo kesintisi ve ödeme vadesini gösterir. Net hakediş tahminidir, pazaryerinin ödeme raporuyla karşılaştırın.',
      gorevler: [{ baslik: 'Mutabakat', sahneler: [{ git: 'hakedis', boy: 1100, en: 1500, adimlar: [['Kanalı seçin.', '#pk'], ['Listeyi dosyaya almak için **Excel** düğmesini kullanın.', '#ex'], ['Ödeme geldikçe satırdaki **Ödendi** düğmesine basın.', 'button@Ödendi']] }] }] },

    { id: 'sorular', ne: 'Pazaryerlerinden gelen ürün soruları burada listelenir. Hazır yanıt seçebilir veya kendiniz yazabilirsiniz.',
      gorevler: [{ baslik: 'Soru yanıtlama', sahneler: [{ git: 'sorular', adimlar: [['Yanıtı yazın veya hazır yanıt seçin, **Gönder** düğmesine basın.', 'button@Gönder']] }] }] },

    { id: 'musteriler', ne: 'Müşterileri harcama ve son siparişe göre **Sadık**, **Yeni**, **Kaybedilmek üzere** ve **Kayıp** olarak ayırır.',
      gorevler: [{ baslik: 'Segmente göre müşteri bulma', sahneler: [{ git: 'musteriler', adimlar: [['Üstteki düğmelerle segment seçin.', 'button@Sadık'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] }] }] },

    { id: 'kuponlar', ne: 'İndirim kodlarını tanımlar. Müşteri kodu ödeme adımında yazar.',
      gorevler: [{ baslik: 'Kupon oluşturma', sahneler: [{ git: 'kuponlar', once: [['tikla', 'button@Yeni kupon']], kirp: 'pencere', boy: 900, adimlar: [['**Kod** yazın. Program büyük harfe çevirir.', '.field@Kod'], ['**Tür** ve **Değer** seçin.', '.field@Tür'], ['**Son kullanma** ve **Kullanım sınırı** alanlarıyla kuponu sınırlayın.', '.field@Son kullanma'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Alt limit (₺)', 'Kuponun geçerli olduğu en düşük sepet.'], ['Başlangıç', 'Kuponun başladığı gün.'], ['Kullanım sınırı', 'Toplam kullanım sayısı. Boşsa sınır yoktur.'], ['Aktif', 'Kapalıysa kupon çalışmaz.']],
      hatalar: [['Bu kod zaten var uyarısı çıkıyor.', 'Başka bir kod yazın.']] },

    { id: 'sepetler', ne: 'Ödeme adımına gelip tamamlamayan ziyaretçileri listeler, hatırlatma yapmanızı sağlar.',
      gorevler: [{ baslik: 'Hatırlatma gönderme', sahneler: [{ git: 'sepetler', adimlar: [['Toplu hatırlatma için **Bekleyenlere SMS** düğmesini kullanın. SMS bağlı değilse gönderim TEST kalır.', '#smsall'], ['Tek müşteriye yazmak için **WhatsApp ile hatırlat** düğmesine basın.', '[data-act=wa]']] }] }] },

    { id: 'iadeler', ne: 'Mağaza ve pazaryeri iade taleplerini yönetir.',
      gorevler: [{ baslik: 'İade onaylama', sahneler: [
        { git: 'iadeler', adimlar: [['Elle kayıt için **İade kaydı** düğmesini kullanın.', '#nr'], ['Satırdaki **Onayla** veya **Reddet** düğmesine basın.', 'button@Onayla']] },
        { git: 'iadeler', once: [['tikla', '#nr']], kirp: 'pencere', adimlar: [['**Sipariş no** yazın, **Neden** seçin, **Kaydet** düğmesine basın.', '.field@Sipariş no']] }] }],
      hatalar: [['Sipariş bulunamadı uyarısı çıkıyor.', 'Sipariş numarasını kontrol edin.'], ['Bu siparişte iade edilecek ürün kalmadı uyarısı çıkıyor.', 'Siparişin tamamı daha önce iade edilmiştir.'], ['Sipariş iptal edilmiş; iade onaylanamaz uyarısı çıkıyor.', 'İptal edilen siparişte iade yapılmaz.']] },

    { id: 'raporlar', ne: 'Kategori, şehir, ödeme ve dönüşüm analizlerini gösterir. Bu sayfayı yalnız mağaza sahibi görür.',
      gorevler: [{ baslik: 'Dönem seçme', sahneler: [{ git: 'raporlar', adimlar: [['Üstteki listeden dönemi seçin.', '#pk']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Paket fişi' }),
    O.ayarlar({ alanlar: [['Mağaza başlığı', 'Tarayıcı sekmesinde ve arama sonuçlarında görünür.'], ['Mağaza açıklaması', 'Mağaza ana sayfasında ve altbilgide kullanılır.'], ['Duyuru bandı', 'Mağazanın üstünde görünen kısa metin.'], ['Ücretsiz iade süresi (gün)', 'Boşsa mağazada ücretsiz iade yazmaz. Yasal cayma hakkı ayrıdır.'], ['Vade farksız taksit sayısı', 'Boşsa gösterilmez, yalnız gerçekten sunuyorsanız yazın.'], ['Ücretsiz kargo eşiği (₺)', 'Bu tutarın üstünde kargo ücreti alınmaz.'], ['Kargo ücreti (₺)', 'Müşteriden alınan kargo bedeli.'], ['Kapıda ödeme bedeli (₺)', 'Kapıda ödemede eklenir.'], ['Havale IBAN', 'Havaleyle ödemede müşteriye gösterilir.'], ['Kargo firmaları (virgülle)', 'Kargoya verirken seçilecek firmalar.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Depo / sevkiyat rolü siparişleri, ürünleri, iadeleri ve depo işlerini görür. Fiyat, kupon, rapor ve ayar sayfaları mağaza sahibine aittir.',
  musteri: [{ ad: 'Online mağaza', ne: 'Müşterileriniz ürünleri görür, sepete ekler ve sipariş verir. Üyelik gerekmez. Adresi **Mağazayı aç** düğmesiyle görürsünüz.', sahneler: [{ adres: 'magaza.html?demo=1', ilk: 900, kirp: 'tam', adimlar: [] }],
    not: 'Ödeme sağlayıcısı bağlı değilken mağazada kartla ödeme gerçek çekim yapmaz, sipariş TEST ödemesi olarak işaretlenir ve ciroya sayılmaz.' }],
  yazdirma: { ne: 'Sipariş belgeleri sipariş penceresinden ve seçili siparişlerden yazdırılır.', belgeler: [['Paket fişi', 'Sipariş penceresinde **Paket fişi**.'], ['Kargo etiketi', 'Kargoya verildikten sonra otomatik açılır. Takip numarası gerekir.'], ['Toplama listesi', 'Seçili siparişler için **Belge şablonları** sayfasında görünümü ayarlanır.'], ['İade teslim tutanağı', '**İmzalı belgeler** sayfası.']] },

  entegrasyon: {
    efatura: { degisir: ['Kargoya verme penceresindeki **e-Fatura / e-Arşiv fatura kes** kutusu ve kargodaki veya teslim edilen siparişteki **Fatura kes** düğmesi belgeyi entegratöre gönderir. Sağlayıcının altındaki sınırı okuyun: Paraşüt bu sürümde fatura göndermez.', 'Sipariş faturası **e-Belgeler** sayfasında görünür. Simülasyonda TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Fatura kesilemedi uyarısında entegratör bilgilerini sihirbazdan yeniden test edin.'] },
    eirsaliye: { degisir: ['Bu programın ekranlarında e-İrsaliye kesen bir düğme yoktur. Bu karttaki ayar programda bir şey değiştirmez.', 'Kargoya verme penceresindeki **e-Fatura / e-Arşiv fatura kes** kutusu irsaliye değil, fatura keser.'], sorun: ['İrsaliyeyi entegratörünüzün panelinden düzenleyin.'] },
    kargofirma: { degisir: ['Listedeki kargo firmaları bu sürümde yalnız takip içindir. Gönderiyi firmanın şubesinden veya panelinden oluşturursunuz, takip numarasını kargoya verirken yazarsınız, sipariş penceresinde **Takip et** düğmesi çıkar.', 'Gönderi ve barkod otomatik oluşturma yalnız **Özel API / çözüm ortağı** seçeneğiyle, kendi servisiniz üzerinden çalışır.'], sorun: ['Takip sayfası açılmazsa takip numarasını firmanın sitesinde deneyin.'] },
    pazaryeri: { kapali: { hepsiburada: 'API dokümanı doğrulanamadı, bu programda canlı mod kapalı.', amazon: 'Bu sürümde bağlantı yazılımı yok.', pazarama: 'Bu sürümde bağlantı yazılımı yok.', ciceksepeti: 'Bu sürümde bağlantı yazılımı yok.' }, degisir: ['Canlı bağlantı **Pazaryeri Merkezi** sayfasındaki **Bağlantı ve kurallar** penceresinden kurulur. Anahtarları o pencereye girersiniz, kanal **Çalışma modu** alanından canlıya geçer. Bu sihirbaz anahtarların doğruluğunu test eder.', 'Canlı mod Trendyol ve n11 için çalışır.', 'Canlı modda sipariş, stok ve fiyat gerçek pazaryerine gider. Simülasyonda sipariş gelmez, işlemler kayda yazılır.'], sorun: ['Bağlantı kurulamadı uyarısında anahtarları ve test ortamı seçimini kontrol edin.'] },
    sms: { degisir: ['Kargoya verilince müşteriye takip numaralı SMS gider.', '**Terk Edilen Sepetler** sayfasındaki toplu hatırlatma gerçek SMS gönderir.', 'Bağlantı yokken gönderim TEST görünür, müşteriye bir şey gitmez.'], sorun: ['Gönderilmedi uyarısında sağlayıcı kredisini ve onaylı başlığı kontrol edin.'] },
    whatsapp: O.E.whatsappLink('**Terk Edilen Sepetler** sayfasındaki **WhatsApp ile hatırlat** düğmesi'),
    backup: O.E.backup(),
  },
  sssHaric: ['Ürün fotoğrafını panelden yükleyebilir miyim?'], // katalog metni eski: ürün formunda fotoğraf yükleme var, DURUM.md
});
