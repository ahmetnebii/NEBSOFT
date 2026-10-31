// Emlak Ofisi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js emlak
const KAP = 'NEBSOFT ile iletişime geçerek açtırılır.';
module.exports = (O) => ({
  ne: 'Emlak Ofisi programı portföyü, yetkilendirme sözleşmelerini, müşteri taleplerini, gösterimleri, kira takibini, satış ve komisyonu yönetir. Kendi ilan siteniz müşteriden gelen başvuruları programa düşürür.',
  kimler: 'Emlak ofisleri, gayrimenkul danışmanlığı yapan işletmeler ve kira yönetimi hizmeti verenler.',
  ilkNot: 'İlk belgeden önce **Ayarlar** sayfasına **Taşınmaz ticareti yetki belgesi no** yazın. Yoksa program **Önce Ayarlar’dan işletmenin yetki belgesi numarasını girin** uyarısı verir.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Aktif ilanı, aktif talebi, 90 günlük işlem ve komisyonu, yetkisi dolan ilanları ve yaklaşan gösterimleri gösterir.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['**Aktif ilan**, **Aktif talep**, **90 gün işlem** ve **90 gün komisyon** kutuları ofisin durumudur.', '.kpi'], ['**Portföy** ilanlara götürür.', '.ns-main a@Portföy'], ['**Gösterim planla** yeni randevu açar.', '#ns']] }] }] },

    { id: 'portfoy', ne: 'Satılık ve kiralık ilanları kart veya liste olarak gösterir. İlana girince yetkilendirme, gösterim ve teklifler açılır.',
      gorevler: [
        { baslik: 'Yeni ilan girme', sahneler: [
          { git: 'portfoy', kirp: 'ana', adimlar: [['**Yeni ilan** düğmesine basın.', '#np'], ['**Tümü**, **Satılık** ve **Kiralık** ile listeyi süzün.', 'button@Satılık'], ['Arama kutusu ve durum listesiyle daraltın.', '#q'], ['Karta tıklayınca ilan detayı açılır.', '#g']] },
          { git: 'portfoy', once: [['tikla', '#np']], kirp: 'pencere', boy: 1300, en: 1300, adimlar: [['**İlan başlığı**, **Fiyat (₺)**, **İl** ve **İlçe** zorunludur.', '.field@İlan başlığı'], ['**Ada** ve **Parsel** taşınmazın kaydıdır.', '.field@Ada'], ['**Mal sahibi** bilgilerini ve **Yetkilendirme sözleşmesi no** alanını doldurun.', '.field@Mal sahibi tel.'], ['**Sözleşme bitiş tarihi** ve **EİDS ilan yetkisi bitiş tarihi** süresi dolan ilan uyarısını besler.', '.field@Sözleşme bitiş tarihi'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'İlan detayında çalışma', sahneler: [{ git: 'portfoy', once: [['tikla', '[data-p]']], kirp: 'ana', boy: 1000, adimlar: [['**Linki kopyala** ilan adresini kopyalar.', '#sh'], ['**Yetkilendirme sözleşmesi** belgeyi hazırlar.', '#yz'], ['**Portallara gönder** portal penceresini açar.', '#pub'], ['**Düzenle** kaydı değiştirir.', '#ed'], ['**Satıldı olarak kapat** işlemi kaydeder ve komisyonu oluşturur.', '#cl'], ['**Teklif ekle** teklif kaydeder.', '#of']] }] }],
      alanlar: [['Tapu durumu', 'İlan sayfasında gösterilen tapu bilgisi.'], ['Enerji kimlik bilgisi', 'Enerji sınıfı.'], ['Danışman', 'İlandan sorumlu kişi.'], ['Enlem (harita)', 'Haritada konum için.'], ['Boylam (harita)', 'Haritada konum için.']],
      hatalar: [['Yetkilendirme sözleşmesinin süresi dolmuş uyarısı çıkıyor.', 'Sözleşmeyi yenileyin ve **Sözleşme bitiş tarihi** alanını güncelleyin.'], ['Fiyat artışı uyarısı çıkıyor.', 'Yetkilendirme süresindeki artış yönetmelik sınırına takılmıştır. Uyarıdaki metni okuyun.'], ['Teklif tutarını girin uyarısı çıkıyor.', 'Teklif alanına tutar yazın.']] },

    { id: 'portallar', ne: 'sahibinden.com, Hepsiemlak ve Emlakjet ilanlarınızı tek tablodan izlersiniz. Yayını portalda kendiniz yapar, ilan numarasını buraya yazarsınız. Bu sayfayı yalnız yönetici görür.',
      gorevler: [
        { baslik: 'Portal ilanını kaydetme', sahneler: [
          { git: 'portallar', kirp: 'ana', en: 1450, boy: 1000, adimlar: [['**Portal ayarları** mağaza numarası, kota ve paket ücretini tutar.', 'button@Portal ayarları'], ['**Süresi dolanları yenile** süresi biten ilanları listeler.', 'button@Süresi dolanları yenile'], ['**Eksik portalı olan**, **Sorunlu** ve **Yetkilendirme yok** süzgeçleriyle eksikleri bulun.', 'button@Eksik portalı olan'], ['**Elle kaydet** portaldaki ilanın numarasını yazar.', 'button@Elle kaydet']] },
          { git: 'portallar', once: [['tikla', 'button@Elle kaydet']], kirp: 'pencere', adimlar: [['**Portal ilan numarası**, **Yayın tarihi** ve **Bitiş tarihi** girip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['İlan portalları bağlantısı kapalı uyarısı çıkıyor.', 'Bu bağlantı NEBSOFT ile iletişime geçerek açtırılır. İlanı portala kendiniz girip numarasını kaydedin.']] },

    { id: 'talepler', ne: 'Alıcı ve kiracı adaylarının kriterlerini tutar. Uygun ilanlar puanla eşleşir.',
      gorevler: [{ baslik: 'Talep ekleme', sahneler: [
        { git: 'talepler', kirp: 'ana', adimlar: [['**Yeni talep** düğmesine basın.', 'button@Yeni talep'], ['**Eşleşen ilanlar** müşteriye uygun ilanları gösterir.', 'button@Eşleşen ilanlar']] },
        { git: 'talepler', once: [['tikla', 'button@Yeni talep']], kirp: 'pencere', boy: 900, adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Arıyor**, **Kategori**, **Oda**, **Maks. bütçe (₺)** ve **Min. m²** eşleşmeyi belirler.', '.field@Maks. bütçe'], ['**Sonraki arama** tarihini yazıp **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'web', ne: 'İlan sitenizden gelen bilgi talebi, yer gösterme, değerleme, ilan alarmı, mülk listeleme ve iletişim formlarını toplar. Demoda henüz başvuru yoktur.',
      gorevler: [{ baslik: 'Başvuruları izleme', sahneler: [{ git: 'web', kirp: 'ana', adimlar: [['**Siteyi aç** ilan sitenizi açar.', 'a@Siteyi aç'], ['Sekmeler başvuruları türüne göre ayırır.', 'button@Yer gösterme']] }] }] },

    { id: 'gosterimler', ne: 'Yer gösterme randevularını ve sonuçlarını tutar. Taşınmaz gösterme belgesi müşteriye imzalatılır.',
      gorevler: [{ baslik: 'Gösterim planlama', sahneler: [
        { git: 'gosterimler', kirp: 'ana', adimlar: [['**Gösterim planla** yeni randevu açar.', '#ns'], ['**Taşınmaz gösterme belgesi (imzalı)** önce TC / yabancı kimlik no sorar, sonra müşteri imzalar.', 'button@Taşınmaz gösterme belgesi (imzalı)']] },
        { git: 'gosterimler', once: [['tikla', '#ns']], kirp: 'pencere', adimlar: [['**İlan**, **Müşteri**, **Tarih** ve **Saat** zorunludur.', '.field@İlan'], ['**Danışman** seçip **Kaydet** düğmesine basın. Sonucu sonradan **Sonuç / not** alanına yazın.', 'button@Kaydet']] }] }],
      hatalar: [['İlan ve müşteri seçin uyarısı çıkıyor.', 'İki alanı da doldurun.'], ['Danışman bu saatte başka gösterimde uyarısı çıkıyor.', 'Saati veya danışmanı değiştirin.']] },

    { id: 'kiralar', ne: 'Yönetimdeki kiralık mülkleri, aylık tahsilatı, geciken kiraları ve sözleşme tarihlerini gösterir.',
      gorevler: [
        { baslik: 'Kira tahsilatı', sahneler: [
          { git: 'kiralar', kirp: 'ana', en: 1450, adimlar: [['**Biten sözleşmeler** süresi dolanları gösterir.', 'a@Biten sözleşmeler'], ['**Tahsil** kira ödemesi alır ve makbuz yazdırır.', 'button@Tahsil'], ['**Kira artışı** yasal oranı kontrol ederek yeni kirayı kaydeder.', 'button@Kira artışı'], ['**Mal sahibi ekstresi** mal sahibine verilen dökümü hazırlar. **Hatırlat** WhatsApp’ı açar.', 'button@Mal sahibi ekstresi'], ['**Sözleşmeyi bitir** tahliye ve güvence iadesini kaydeder.', 'button@Sözleşmeyi bitir']] },
          { git: 'kiralar', once: [['tikla', 'button@Tahsil']], kirp: 'pencere', adimlar: [['**Dönem** seçin. **Tutar (boş = dönemin kalanı)** boşsa kalan tutar alınır.', '.field@Dönem'], ['**Ödeme** seçip **Tahsil et** düğmesine basın.', 'button@Tahsil et']] }] },
        { baslik: 'Kira artışı', ne: 'TÜİK’in açıkladığı on iki aylık ortalama TÜFE oranını yazın. Program yeni kirayı kontrol eder.', sahneler: [{ git: 'kiralar', once: [['tikla', 'button@Kira artışı']], kirp: 'pencere', adimlar: [['**Yeni aylık kira** ve **Geçerli olduğu tarih** alanlarını doldurup **Kontrol et ve kaydet** düğmesine basın.', 'button@Kontrol et ve kaydet']] }] }],
      not: '**Gecikenlere SMS** düğmesi gerçek gönderim için SMS bağlantısı ister. Bu programın Entegrasyonlar sayfasında SMS kartı yoktur, mesaj bu yüzden kiracıya gitmez. Hatırlatmayı **Hatırlat** düğmesiyle WhatsApp üzerinden yapın.',
      hatalar: [['Kesinti gerekçesi yazın uyarısı çıkıyor.', 'Güvence bedelinden kesinti yapıyorsanız **Kesinti gerekçesi** alanını doldurun.']] },

    { id: 'islemler', ne: 'Kapanan satış ve kiralamaları, hizmet bedeli tahsilatını ve danışman hakedişlerini gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Hizmet bedeli tahsilatı', sahneler: [{ git: 'islemler', kirp: 'ana', en: 1450, adimlar: [['Kutular toplam işlem, satış hacmi, hizmet bedeli ve tahsil edilmeyen tutarı gösterir.', '.kpi'], ['**Excel** listeyi dosyaya alır.', '#xl'], ['**Fatura** hizmet bedeli faturasını başlatır.', 'button@Fatura'], ['**Aracılık sözleşmesi** imzalı belgeyi hazırlar.', 'button@Aracılık sözleşmesi'], ['**İşlemi iptal et** tahsilat yoksa işlemi geri alır.', 'button@İşlemi iptal et']] }] }],
      hatalar: [['Belgede yetki belgesi numarası boş uyarısı çıkıyor.', '**Ayarlar** sayfasında **Taşınmaz ticareti yetki belgesi no** alanını doldurun.'], ['İşlem iptal edilemez uyarısı çıkıyor.', 'Kiralamada tahsilat vardır. Sözleşmeyi **Kira Takibi** sayfasından bitirin.']] },

    { id: 'danismanlar', ne: 'Danışmanları, yeterlilik belgesini, aktif ilanı, işlemi ve hakedişi gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Danışman ekleme', sahneler: [{ git: 'danismanlar', once: [['tikla', 'button@Yeni danışman']], kirp: 'pencere', adimlar: [['**Ad**, **Telefon**, **Hakediş payı %** ve **Mesleki yeterlilik belgesi no** yazın.', '.field@Ad'], ['**Program kullanıcısı** kişinin giriş hesabıdır. **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    O.belgeler({ tur: 'Taşınmaz gösterme belgesi' }),
    O.ayarlar({ alanlar: [['Taşınmaz ticareti yetki belgesi no', 'Belgelere basılır, zorunludur.'], ['Sorumlu emlak danışmanı (ad soyad)', 'Belgelere yazılır.'], ['Satış hizmet bedeli % (taraf başı, KDV hariç; toplam en çok %4)', 'Komisyon hesabında kullanılır.'], ['Kira hizmet bedeli (kiranın %si, KDV hariç; en çok %100)', 'Kiralama komisyonu hesabında kullanılır.'], ['Kira yönetim bedeli %', 'Yönetim hizmeti bedeli.'], ['KDV oranı % (faturada)', 'Faturada kullanılan oran.'], ['İlan sayfası WhatsApp numarası', 'İlan sitesindeki WhatsApp düğmesinin numarası.']] }),
    O.bildirimler(),
    { ...O.ebelge(), not: 'Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur. **Satış & Komisyon** sayfasındaki **Fatura** düğmesi bu yüzden TEST belge oluşturur.' },
    O.entegrasyonlar(),
  ],

  roller: 'Danışman ilan, talep, gösterim ve kira sayfalarında çalışır. İlan portalları, satış ve komisyon, danışmanlar ve ayarlar yöneticiye aittir.',
  musteri: [{ ad: 'İlan sitesi', ne: 'Müşteri üyelik açmadan ilanları arar, süzer, karşılaştırır ve favoriye ekler. Bilgi talebi, yer gösterme, değerleme ve ilan alarmı formları **Web Başvuruları** sayfasına düşer. Formlarda iletişim izni zorunludur. Sitenin adresini **Web Başvuruları** sayfasındaki **Siteyi aç** ile görürsünüz.',
    sahneler: [{ adres: 'ilan.html', ilk: 1000, kirp: 'tam', boy: 1000, adimlar: [['Müşteri arama kutusundan ilçe, emlak tipi, oda ve fiyat seçer, **İlan ara** düğmesine basar.', '#sf']] }] }],
  yazdirma: { ne: 'Belgeler ilan, gösterim ve kira ekranlarından yazdırılır.', belgeler: [['Yetkilendirme sözleşmesi', 'İlan detayında **Yetkilendirme sözleşmesi**.'], ['Taşınmaz gösterme belgesi', '**Gösterimler** sayfasında **Taşınmaz gösterme belgesi (imzalı)**.'], ['Kira tahsilat makbuzu', '**Kira Takibi** sayfasında tahsilattan sonra.'], ['Kira artış bildirimi', '**Kira Takibi** sayfasında kira artışından sonra.'], ['Aracılık sözleşmesi', '**Satış & Komisyon** sayfasında **Aracılık sözleşmesi**.']] },

  entegrasyon: {
    ilan: { kapali: { '*': KAP }, degisir: [`İlan portalları bağlantısı ${KAP}`, 'Bağlantı olmadan ilan portala otomatik gitmez. Yayını portalda yapıp **İlan Portalları** sayfasındaki **Elle kaydet** ile numarasını yazarsınız.', 'Simülasyonda sonuç TEST görünür, portalda bir şey değişmez.'], sorun: ['Portal kotası veya süresi için **Portal ayarları** değerlerini kontrol edin.'] },
    whatsapp: O.E.whatsappLink('**Kira Takibi** sayfasındaki **Hatırlat** düğmesi'),
    backup: O.E.backup(),
  },
});
