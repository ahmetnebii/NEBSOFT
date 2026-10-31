// Kâr & Fiyat Robotu kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js fiyatrobotu
module.exports = (O) => ({
  ne: 'Kâr & Fiyat Robotu, pazaryerindeki her listelemenin KDV, komisyon, hizmet bedeli, kargo ve paketleme sonrası net kârını hesaplar. Belirlediğiniz kurallara göre fiyat önerir, onayladığınız fiyatı uygular ve yaptığı değişikliği geçmişe yazar.',
  kimler: 'Pazaryerinde satış yapan ve ürün başına gerçek kârını görmek isteyen işletmeler. Tek satıcıda da, fiyat uzmanı olan ekipte de kullanılır.',
  ilkNot: 'Komisyon, kargo ve hizmet bedeli örnek değerlerle gelir, kârlar tahmindir. İlk iş **Komisyon & Kargo** sayfasına sözleşmenizdeki oranları girin.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
  moduller: [
    { id: 'ozet', ne: 'Ortalama net marjı, zarar eden listelemeleri, buybox durumunu, robot önerisini ve bir satışın parasının nereye gittiğini gösterir.',
      gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', boy: 1100, adimlar: [['**Zarar eden listeleme** komisyon ve kargo sonrası eksi kalan satışlardır.', '.kpi@Zarar eden listeleme'], ['**Bir satışın parası nereye gidiyor? (ortalama)** giderlerin payını gösterir.', 'h3@Bir satışın parası'], ['**Robotu çalıştır** Fiyat Robotu sayfasını açar.', '#view a.btn.primary, #view button.btn.primary']] }] }],
      not: 'Buybox kutusundaki bilgi demo verisidir. Gerçek değer için rakip fiyat dosyası yükleyin veya Trendyol’u canlıya alın.' },

    { id: 'karlilik', ne: 'Her listelemenin satış, maliyet, komisyon, kargo, net kâr ve marjını satır satır gösterir.',
      gorevler: [
        { baslik: 'Zarar edenleri bulma', sahneler: [{ git: 'karlilik', en: 1400, adimlar: [['Arama kutusuna ürün adı yazın.', '#q'], ['Kanalı buradan seçin.', '#ch'], ['**Zarar**, **Düşük marj** veya **Buybox kaybı** ile süzün.', 'button@Düşük marj'], ['Listeyi dosyaya almak için **Excel** düğmesini kullanın.', '#ex'], ['**Detay / rakipler** simgesi listelemenin ayrıntısını açar.', "button[title='Detay / rakipler']"]] }] },
        { baslik: 'Listeleme kuralı girme', ne: 'Her listelemenin kendi stratejisi olur. Rakip fiyatları, fiyat geçmişi ve kâr dökümü bu pencerededir.', sahneler: [{ git: 'karlilik', once: [['tikla', "button[title='Detay / rakipler']"]], kirp: 'pencere', boy: 1050, en: 1400, adimlar: [['**Strateji** seçin. Robot öneriyi buna göre hesaplar.', '.field@Strateji'], ['**En düşük fiyat (₺)** ve **En yüksek fiyat (₺)** robotun sınırıdır.', '.field@En düşük fiyat'], ['**Kuralı kaydet** düğmesine basın.', 'button@Kuralı kaydet'], ['**Fiyatı elle değiştir** tek fiyatı değiştirir, taban fiyatın altındaysa onay ister.', 'button@Fiyatı elle değiştir'], ['**Listelemeyi sil** kaydı siler, pazaryerindeki ürün etkilenmez.', 'button@Listelemeyi sil']] }] }],
      alanlar: [['Rakibin kaç ₺ altı', 'Buybox stratejisinde rakibin ne kadar altına inileceği.'], ['Hedef marj %', 'Marj stratejisinde korunacak oran.']],
      hatalar: [['Fiyat okunamadı: 1234,56 biçiminde yazın uyarısı çıkıyor.', 'Fiyatı sayı olarak yazın.']] },

    { id: 'robot', ne: 'Kurallarınıza göre önerilen fiyatları listeler. Fiyat zarar koruması sınırının altına inmez. Büyük değişiklik sınırını aşan öneri otomatik seçilmez. Fiyat önerilemeyen listelemeler üstte sayıyla görünür.',
      gorevler: [
        { baslik: 'Önerileri uygulama', ne: '**Seçilenleri uygula** önce onay sorar. Canlı kanaldaki fiyat pazaryerine gider, stok da birlikte gönderilir. Canlı olmayan kanalda fiyat yalnız programda değişir ve bu TEST olarak bildirilir. Rakibe göre fiyatta rakip verisi gerçek ve güncel değilse canlıya gönderilmez.', sahneler: [{ git: 'robot', en: 1400, boy: 900, adimlar: [['Şerit kuralları gösterir: zarar koruması, fiyat sonu ve büyük değişiklik sınırı. **Değiştir** Ayarlar sayfasını açar.', 'a@Değiştir'], ['Kutularla önerileri seçin veya çıkarın.', '[data-s]'], ['**Yeniden hesapla** önerileri tazeler.', '#re'], ['**Seçilenleri uygula** düğmesine basın.', '#ap']] }] },
        { baslik: 'Rakip fiyatını güncelleme', sahneler: [{ git: 'robot', en: 1400, adimlar: [['**Rakip fiyat dosyası** dosyadan rakip fiyatı alır, önizleyip onaylarsınız.', '#cmp'], ['**Trendyol buybox çek** canlı Trendyol hesabından buybox bilgisini alır.', '#bb']] }] }],
      hatalar: [['Seçili öneri yok uyarısı çıkıyor.', 'En az bir satır işaretleyin.'], ['TEST — Trendyol canlı bağlı değil uyarısı çıkıyor.', '**Komisyon & Kargo** sayfasındaki **Canlı fiyat gönderimi** bölümünden Trendyol’u canlıya alın.'], ['Barkodlu Trendyol listelemesi yok uyarısı çıkıyor.', 'Ürüne barkod girin.'], ['Uygulanacak satır yok uyarısı çıkıyor.', 'Rakip fiyat dosyasının sütunlarını kontrol edin.']] },

    { id: 'gecmis', ne: 'Uygulanan fiyat değişikliklerini, canlı gönderim sonucunu ve geri almayı gösterir. Fiyat değişikliği yapılmadıysa liste boştur.',
      gorevler: [{ baslik: 'Geçmişi izleme', ne: 'Her satırda üç işlem bulunur: **Rapor** değişikliği yazdırır, **Sonucu sorgula** pazaryerine iletilen toplu isteğin sonucunu sorar, **Geri al** fiyatları önceki değere döndürür.', sahneler: [{ git: 'gecmis', adimlar: [['Uygulanan değişiklikler burada listelenir.', '#view .card']] }] }],
      hatalar: [['Sonuç alınamadı uyarısı çıkıyor.', 'Bağlantınızı kontrol edip yeniden sorgulayın.'], ['Geri alınacak listeleme kalmadı uyarısı çıkıyor.', 'Listelemeler silinmiştir.']] },

    { id: 'senaryo', ne: 'Maliyet, komisyon veya kargo artarsa kaç listelemenin zarara geçeceğini hesaplar. Bu sayfa hiçbir fiyatı değiştirmez.',
      gorevler: [{ baslik: 'Artış denemesi', sahneler: [{ git: 'senaryo', en: 1500, adimlar: [['**Maliyet artışı %**, **Komisyon artışı (puan)** veya **Kargo artışı %** yazın.', '#f'], ['Sonuç anında burada değişir.', '#r']] }] }] },

    { id: 'hesap', ne: 'Ürünü listelemeden önce kullanılır: bu fiyattan satarsam ne kazanırım, hedef marj için kaça satmalıyım?',
      gorevler: [{ baslik: 'Kâr hesaplama', sahneler: [{ git: 'hesap', boy: 1000, adimlar: [['Pazaryeri, kategori, maliyet ve fiyatı girin.', '#f'], ['Bir satışın dökümü burada görünür.', '#r']] }] }],
      alanlar: [['Ürün maliyeti (KDV hariç ₺)', 'Ürünün alış maliyeti.'], ['Kampanya indirimi %', 'Satış fiyatından düşülen kampanya.'], ['Komisyon % (boşsa kategoriden)', 'Boşsa **Komisyon & Kargo** sayfasındaki oran kullanılır.'], ['Hedef net marj %', 'Bu marj için gereken fiyat hesaplanır.']] },

    { id: 'urunler', ne: 'Doğru kâr için ürün maliyetini ve desisini tutar. **EN İYİ KANAL** sütunu ürünün en çok kâr bıraktığı pazaryerini gösterir.',
      gorevler: [
        { baslik: 'Ürün ekleme', sahneler: [
          { git: 'urunler', en: 1400, adimlar: [['**Ürün ekle** düğmesine basın.', '#add'], ['**Şablon** örnek dosyayı indirir, **Excel\'den aktar** dosyadan ürün alır.', '#im'], ['**Kanala ekle** simgesi ürünü başka pazaryerine listeleme olarak ekler.', "button[title='Kanala ekle']"]] },
          { git: 'urunler', once: [['tikla', '#add']], kirp: 'pencere', adimlar: [['**Ürün**, **Stok kodu** ve **Maliyet (KDV hariç)** zorunludur.', '.field@Ürün'], ['**Desi** kargo hesabında kullanılır.', '.field@Desi'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Bu stok kodu veya barkod başka üründe kayıtlı uyarısı çıkıyor.', 'Kodu değiştirin veya mevcut ürünü açın.'], ['Listelemesi olan ürün silinemez uyarısı çıkıyor.', 'Önce **Kârlılık** ekranından listelemeyi silin.'], ['Ürün tüm kanallarda listeli uyarısı çıkıyor.', 'Eklenecek kanal kalmamıştır.'], ['Maliyet geçersiz uyarısı çıkıyor.', 'Maliyeti sayı olarak yazın.']] },

    { id: 'kanallar', ne: 'Kategori komisyonlarını, desi kargo baremlerini, hizmet bedellerini ve canlı fiyat gönderimini yönetir. Tüm kâr hesapları bu sayfaya göre yapılır. Bu sayfayı yalnız yönetici görür.',
      gorevler: [
        { baslik: 'Oranları girme', sahneler: [{ git: 'kanallar', boy: 1100, en: 1400, adimlar: [['Sözleşmenizdeki oranları **Kategori komisyonları (%)** tablosuna yazın.', 'h3@Kategori komisyonları'], ['**Oranları kaydet** düğmesine basın, kârlar yeniden hesaplanır.', '#sv']] }] },
        { baslik: 'Canlı fiyat gönderimi', ne: 'Bu programda Trendyol ve n11 canlıya alınır. Bu bağlantı Entegrasyonlar sayfasından değil, buradan kurulur. Diğer kanallar için fiyat programda kalır, canlı gönderim için NEBSOFT ile iletişime geçin.', sahneler: [{ git: 'kanallar', boy: 2000, en: 1400, adimlar: [['Her kanal için **Mod**, **Satıcı ID**, **API key** ve **API secret** girin. Bilgiler satıcı panelinizin entegrasyon bölümündedir.', 'h3@Canlı fiyat gönderimi'], ['**Kaydet** düğmesine basın.', '#lsv']] }] }],
      alanlar: [['Hizmet bedeli (KDV dahil)', 'Sipariş başına pazaryeri bedeli.']],
      hatalar: [['Canlı için API bilgileri gerekli uyarısı çıkıyor.', '**API key** ve **API secret** alanlarını doldurun. Trendyol’da **Satıcı ID** de gerekir.'], ['Geçersiz değer kaydedilmedi uyarısı çıkıyor.', 'Komisyon 0 ile 100 arasında olmalıdır.']] },

    O.belgeler({ tur: 'Fiyat değişiklik raporu' }),
    O.ayarlar({ alanlar: [['Zarar koruması: en az net marj %', 'Robot bu marjın altına inmez.'], ['Fiyat sonu (ör. 0.90)', 'Önerilen fiyatın kuruş sonu.'], ['Büyük değişiklik sınırı %', 'Üstündeki öneriler otomatik seçilmez.'], ['Rakip fiyatı kaç saat geçerli', 'Bu süreden eski rakip fiyatı güncel sayılmaz.'], ['Sipariş başı paketleme maliyeti (₺)', 'Kâr hesabında kullanılır.'], ['Reklam gideri (satışın %)', 'Kâr hesabında kullanılır.'], ['Komisyon KDV hariç fiyata uygulanır (sözleşmenize bakın)', 'Komisyonun hesaplanma biçimi.']] }),
    O.bildirimler(),
    O.entegrasyonlar(),
  ],
  roller: 'İzleyici rolü fiyat değiştiremez, **Seçilenleri uygula** düğmesini görmez. Fiyat uzmanı önerileri uygular. **Komisyon & Kargo** ve yönetim sayfaları yöneticiye aittir.',
  musteriYok: 'Kâr & Fiyat Robotu programında müşterinin kendisinin açtığı bir sayfa yoktur.',
  sssHaric: ['Rakip fiyatlarını nereden alıyor?'],
  sss: [['Rakip fiyatlarını nereden alıyor?', 'Demo verisi örnektir. Rakip bilgisi **Rakip fiyat dosyası** ile yüklediğiniz dosyadan veya canlı Trendyol hesabınızda **Trendyol buybox çek** ile gelir. Hepsiburada ve n11 için fiyat dosyası kullanılır.']],
  yazdirma: { ne: 'Robotun yaptığı değişiklikler rapor olarak yazdırılır.', belgeler: [['Fiyat değişiklik raporu', '**Robot Geçmişi** sayfasında satırdaki **Rapor** simgesi.']] },
  entegrasyon: { backup: O.E.backup() },
});
