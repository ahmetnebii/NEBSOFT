// Toptancı & Plasiyer kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js toptan
module.exports = (O) => {
  const ebelge = O.ebelge();
  return {
    ne: 'Toptan program, saha satışını, siparişi, sevkiyatı, tahsilatı ve cari hesabı tek yerde toplar. Plasiyer rotasındaki müşteriden sipariş ve tahsilat alır, depo aracı yükler, ofis teslimatı ve faturayı izler, bayi kendi sayfasından sipariş verir.',
    kimler: 'Gıda, içecek, temizlik ve benzeri ürünleri bakkal, market ve bayilere dağıtan toptancılar. Plasiyeri, deposu ve ofisi olan işletmeler içindir.',
    ilkNot: 'Ürün fiyatları A, B ve C listeleriyle çalışır. Cari kartında müşterinin fiyat listesini seçin, sipariş fiyatı buna göre gelir.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Bugünkü siparişi, risk onayı bekleyenleri, toplam alacağı, 30 günlük satışı, plasiyer performansını ve vadesi geçenleri gösterir.',
        gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1200, adimlar: [['**Risk onayı bekleyen** limitini aşan müşterilerin siparişleridir.', '.kpi@Risk onayı bekleyen'], ['**Plasiyer performansı (bu ay)** satış ve tahsilatı hedefle karşılaştırır.', 'h3@Plasiyer performansı'], ['**Vadesi geçenler** tahsilat önceliğidir.', 'h3@Vadesi geçenler'], ['Yeni sipariş için **Sipariş** düğmesine basın.', '#new']] }] }] },

      { id: 'siparisler', ne: 'Saha, bayi sayfası ve ofis siparişleri tek listededir. Limitini aşan müşterinin siparişi onay bekler, onaylanmadan sevke çıkmaz.',
        gorevler: [
          { baslik: 'Sipariş girme', ne: 'Müşteri seçilince fiyat listesi, iskonto sınırı ve kampanyalar kendiliğinden işler. **Öneri** carinin geçmiş siparişlerinden kalem önerir.', sahneler: [
            { git: 'siparisler', en: 1400, adimlar: [['**Yeni sipariş** düğmesine basın.', '#new'], ['**Açık**, **Onay**, **Sevkte**, **Teslim**, **Faturasız** veya **Tümü** ile süzün.', 'button@Onay'], ['**Faturasızları faturala** teslim edilmiş siparişlerin faturasını toplu keser.', '#bulk'], ['Göz simgesi siparişi açar.', '[data-act=v]']] },
            { git: 'siparisler', once: [['tikla', '#new']], kirp: 'pencere', boy: 1000, en: 1400, adimlar: [['Müşteriyi buradan seçin.', '#oc'], ['Ürünü **Ürün ara...** kutusuyla bulun.', '#oq'], ['**1 koli** düğmesi koli içi adet kadar ekler.', 'button@1 koli'], ['**Siparişi kaydet** düğmesine basın.', 'button@Siparişi kaydet']] }] },
          { baslik: 'Sipariş detayı', ne: 'Detaydaki düğmeler siparişin durumuna göre değişir: **Onayla**, **Hazırlamaya al**, **İptal**, **Fatura kes**, **İade al** ve **Yazdır**.', sahneler: [{ git: 'siparisler', once: [['tikla', '[data-act=v]']], kirp: 'pencere', adimlar: [['**Yazdır** sipariş ve sevk fişini basar.', 'button@Yazdır']] }] }],
        hatalar: [['Ürün ekleyin uyarısı çıkıyor.', 'Siparişe en az bir kalem ekleyin.'], ['Öneri için bu carinin en az iki siparişi olmalı uyarısı çıkıyor.', 'Ürünleri elle ekleyin.'], ['Faturasız teslimat yok uyarısı çıkıyor.', 'Teslim edilmiş ve faturasız sipariş kalmamıştır.'], ['Sipariş onay bekliyor.', 'Müşteri limitini aşmıştır. Yönetici **Onay gerekçesi** yazıp **Onayla** ile açar.']] },

      { id: 'plasiyer', ne: 'Sahadaki plasiyerin ekranıdır, telefona göre tasarlanmıştır. Bugünün rotasındaki müşteriler listelenir, her satırda sipariş, tahsilat ve ziyaret sonucu girilir. Liste carinin **Rota günü** alanına göre oluşur. O gün rotada müşteri yoksa liste boş görünür.',
        gorevler: [{ baslik: 'Günü yürütme', ne: 'Müşteri satırındaki **Sipariş** ve **Tahsilat** düğmeleri kayıt açar. Satış yapılmadıysa **Sipariş yok** ile ziyaret sonucu girilir. Gün bitince **Gün sonu** ile kasa teslim edilir.', sahneler: [{ git: 'plasiyer', adimlar: [['Yönetici ve ofis plasiyeri buradan seçer.', '#rs'], ['Üstteki kutular günün siparişi, tahsilatı ve ziyaretidir.', '.kpi'], ['Gün bitince **Gün sonu** düğmesine basın.', '#ge']] }] }],
        hatalar: [['Bugün rotada müşteri yok yazıyor.', 'Carilerin **Rota günü** alanını kontrol edin.'], ['Son kapanıştan beri tahsilat yok uyarısı çıkıyor.', 'Kapatılacak tahsilat yoktur.'], ['Kasa farkını açıklayın uyarısı çıkıyor.', 'Teslim edilen tutar farklıysa nedenini yazın.']] },

      { id: 'sevkiyat', ne: 'Onaylı siparişler plasiyere ve araca göre gruplanır. Depo yükleme listesini alır, araç yola çıkınca stok düşer ve sipariş sevke geçer.',
        gorevler: [{ baslik: 'Aracı yükleme ve gönderme', sahneler: [
          { git: 'sevkiyat', boy: 900, adimlar: [['**Yükleme listesi** araca yüklenecek ürünleri yazdırır.', 'button@Yükleme listesi'], ['**Yola çıkar** siparişleri sevke alır, sevk fişlerini yazdırır.', 'button@Yola çıkar']] },
          { git: 'sevkiyat', once: [['tikla', 'button@Yola çıkar']], kirp: 'pencere', adimlar: [['Stok yetmeyen kalem varsa eksik sevk edileceği yazılır. **Evet** düğmesine basın.', 'button@Evet']] }] }],
        not: 'Teslim, sipariş detayından girilir. Eksik veya alınmayan kalem için miktar ve **Eksik veya alınmadıysa nedeni** yazılır, ardından **Teslimatı kaydet** düğmesine basılır.',
        hatalar: [['Stok olmadığı için sevk edilecek ürün yok uyarısı çıkıyor.', 'Stok girin veya siparişi düzeltin.'], ['Teslim miktarı 0 ile sevk miktarı arasında olmalı uyarısı çıkıyor.', 'Teslim miktarını sevk edilenden fazla yazmayın.'], ['Farkın nedenini yazın uyarısı çıkıyor.', 'Eksik teslimde neden girin.']] },

      { id: 'iadeler', ne: 'Teslim edilen siparişlerden alınan iadeleri listeler. Yeni iade bu sayfadan değil, siparişi açıp **İade al** ile yapılır. Demo verisinde iade yoktur.',
        gorevler: [{ baslik: 'İade alma', ne: 'İade penceresinde miktar ve **İade nedeni** girilir. **Ürün satılabilir, stoğa dönsün** işaretliyse ürün stoğa döner.', sahneler: [{ git: 'iadeler', adimlar: [['Alınan iadeler burada listelenir.', '#view .card']] }] }],
        hatalar: [['İade miktarı satılan miktarı aşamaz uyarısı çıkıyor.', 'Miktarı düzeltin.'], ['Satış faturası kesilmemiş; iade faturası kesilemez uyarısı çıkıyor.', 'Önce satış faturasını kesin.']] },

      { id: 'plasiyerler', ne: 'Plasiyerleri, araçlarını, aylık hedeflerini ve bağlı oldukları kullanıcıyı tutar. Bu sayfayı yalnız yönetici görür.',
        gorevler: [{ baslik: 'Plasiyer ekleme', ne: 'Plasiyerin telefonda kendi ekranını görmesi için önce **Ayarlar** sayfasından kullanıcı açıp burada **Kullanıcı hesabı** alanından bağlayın.', sahneler: [
          { git: 'plasiyerler', adimlar: [['**Plasiyer ekle** düğmesine basın.', 'button@Plasiyer ekle']] },
          { git: 'plasiyerler', once: [['tikla', 'button@Plasiyer ekle']], kirp: 'pencere', adimlar: [['**Ad soyad**, **Araç plakası** ve **Aylık hedef (₺)** girin.', '.field@Ad soyad'], ['**Kullanıcı hesabı** seçip **Kaydet** düğmesine basın.', '.field@Kullanıcı hesabı']] }] }],
        alanlar: [['İskonto sınırı % (boşsa genel ayar)', 'Plasiyerin verebileceği en yüksek iskonto.']] },

      { id: 'tahsilat', ne: 'Plasiyer tahsilatlarını, tahsil olmamış çek ve senetleri, plasiyer gün sonlarını izler.',
        gorevler: [{ baslik: 'Çek izleme', sahneler: [{ git: 'tahsilat', en: 1600, boy: 1800, adimlar: [['**Son tahsilatlar** kartı kayıtları gösterir.', 'h3@Son tahsilatlar'], ['**Tahsil olmamış çek / senet** kartında satırın sonundaki simgeleri kullanın: çek bankaya gidince **Bankaya tahsile ver**, ödenince **Tahsil edildi**, ödenmezse **Karşılıksız**.', 'h3@Tahsil olmamış çek'], ['**Plasiyer gün sonları** teslim edilen kasayı listeler.', 'h3@Plasiyer gün sonları']] }] }],
        hatalar: [['Bu çek zaten bankada uyarısı çıkıyor.', 'Çek daha önce bankaya verilmiştir.']] },

      { id: 'cariler', ne: 'Müşteri kartlarını, risk limitini, fiyat listesini, rota gününü ve ekstreyi tutar.',
        gorevler: [
          { baslik: 'Cari ekleme', sahneler: [
            { git: 'cariler', en: 1400, adimlar: [['**Yeni cari** düğmesine basın.', 'button@Yeni cari'], ['**Excel\'den al** dosyadan cari alır.', '#imp'], ['**Limit aşan** ve **Vadesi geçen** ile süzün.', 'button@Limit aşan']] },
            { git: 'cariler', once: [['tikla', 'button@Yeni cari']], kirp: 'pencere', boy: 1100, adimlar: [['**Ünvan** ve **Telefon** zorunludur.', '.field@Ünvan'], ['**Rota günü** ve **Plasiyer** plasiyer ekranını belirler.', '.field@Rota günü'], ['**Risk limiti (₺)** aşılınca sipariş onaya düşer.', '.field@Risk limiti'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Tahsilat, ekstre ve bayi bilgisi', sahneler: [
            { git: 'cariler', en: 1400, adimlar: [['**Ekstre** cari hesap ekstresini yazdırır.', "button[title='Ekstre']"], ['**Tahsilat** ödeme alır.', "button[title='Tahsilat']"], ['**Bayi portalı bilgisini gönder** bayiye giriş kodunu SMS ile yollar.', "button[title='Bayi portalı bilgisini gönder']"]] },
            { git: 'cariler', once: [['tikla', "button[title='Tahsilat']"]], kirp: 'pencere', boy: 900, adimlar: [['**Tutar** ve **Yöntem** girin. Çek ve senette **Çek/senet vadesi** ve **Çek/senet no** zorunludur.', '.field@Yöntem'], ['**Kaydet** düğmesine basın. Makbuz yazdırılır.', 'button@Kaydet']] }] }],
        alanlar: [['Fiyat listesi', 'A, B veya C fiyatı.'], ['Vade (gün)', 'Bu cariye uygulanan vade.'], ['Açılış bakiyesi (₺)', 'Programa geçişteki alacak.'], ['VKN / TCKN', 'Fatura için kimlik bilgisi.']],
        hatalar: [['Tutar sıfırdan büyük olmalı uyarısı çıkıyor.', 'Tutarı yazın.'], ['Çek/senet için vade ve numara zorunlu uyarısı çıkıyor.', 'İki alanı da doldurun.'], ['Dosyada satır yok uyarısı çıkıyor.', 'Dosyanın dolu olduğunu kontrol edin.']] },

      { id: 'urunler', ne: 'Ürünleri, koli içi adedi, stoku ve fiyat listelerini tutar. B listesi A fiyatının yüzde 4, C listesi yüzde 8 üstündedir.',
        gorevler: [{ baslik: 'Ürün yönetimi', sahneler: [{ git: 'urunler', en: 1400, adimlar: [['**Ürün ekle** düğmesine basın.', 'button@Ürün ekle'], ['**Excel\'den al** dosyadan ürün alır.', '#imp'], ['Azalanları **Kritik stok** ile süzün.', 'button@Kritik stok']] }] }] },

      { id: 'kampanyalar', ne: 'Mal fazlası kampanyası tanımlar: belirli adede bedelsiz ürün. Sipariş ve bayi sayfasına kendiliğinden yansır.',
        gorevler: [{ baslik: 'Kampanya ekleme', sahneler: [
          { git: 'kampanyalar', once: [['tikla', 'button@Kampanya ekle']], kirp: 'pencere', adimlar: [['**Kampanya adı** ve **Ürün** seçin.', '.field@Kampanya adı'], ['**Alınan adet** ve **Bedelsiz adet** yazın.', '.field@Alınan adet'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      { id: 'raporlar', ne: 'Alacak yaşlandırma, kategori satışı, en çok satan ürünler, en büyük müşteriler, kayıp müşteri riski ve ziyaret uyumunu gösterir. Bu sayfayı yalnız yönetici görür.',
        gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'raporlar', boy: 1900, adimlar: [['**Alacak yaşlandırma** alacakları güne göre gruplar.', 'h3@Alacak yaşlandırma'], ['**Kayıp müşteri riski (45+ gün)** uzun süredir sipariş vermeyen carilerdir.', 'h3@Kayıp müşteri riski'], ['**Ziyaret uyumu ve iade (30 gün)** plasiyerin rota uyumunu gösterir.', 'h3@Ziyaret uyumu']] }] }] },

      O.imzali(),
      O.belgeler(),
      O.ayarlar({ alanlar: [['En az sipariş tutarı (₺)', 'Bayi siparişi için alt sınır.'], ['Varsayılan vade (gün)', 'Yeni caride önerilen vade.'], ['Plasiyer iskonto sınırı (%)', 'Plasiyere özel sınır yoksa bu değer geçerlidir.'], ['IBAN', 'Bayi sayfasında ve belgelerde görünür.']] }),
      O.bildirimler(),
      { ...ebelge, ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. **Fatura kes** ve **Faturasızları faturala** belgeyi buraya işler. Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur, bu yüzden belgeler TEST görünür, GİB’e gitmez. Resmî fatura için entegratörünüzün panelini kullanın.', hatalar: [['Belge TEST olarak görünüyor.', 'Bu programda entegratör bağlantısı kurulmaz. TEST belgeler resmî belge değildir.']] },
      O.entegrasyonlar(),
    ],
    roller: 'Plasiyer yalnız sipariş, plasiyer ekranı, iade ve carileri görür. Depo sevkiyat ve ürünlerle çalışır. Ofis tahsilat ve kampanyaları yönetir.',
    musteri: [{ ad: 'Bayi sipariş sayfası', ne: 'Bayi telefon numarası ve kendisine gönderilen kodla girer. Kendi fiyat listesiyle ürünleri görür, sipariş verir, geçmiş siparişlerini ve hesap ekstresini izler. Kod, cari satırındaki **Bayi portalı bilgisini gönder** ile SMS olarak yollanır.',
      sahneler: [{ adres: 'bayi.html', ilk: 900, kirp: 'tam', adimlar: [['Bayi telefon numarasını buraya yazar.', '#ph']] }] }],
    yazdirma: { ne: 'Belgeler sipariş ve cari ekranlarından yazdırılır.', belgeler: [['Sipariş / sevk fişi', 'Sipariş detayında **Yazdır**, sevkte otomatik.'], ['Yükleme listesi', '**Sevkiyat** sayfasında **Yükleme listesi**.'], ['Tahsilat makbuzu', 'Tahsilat kaydedilince.'], ['Cari hesap ekstresi', '**Cariler** sayfasında **Ekstre**.']] },
    entegrasyon: {
      sms: { degisir: ['Entegre et ile sağlayıcıyı seçip bilgileri girersiniz. Bağlantıyı dene hesap bakiyesini okur, ileti göndermez. Bağlı yazısı görünmeden SMS gönderilmez.', '**Bayi portalı bilgisini gönder** bayiye gerçek SMS yollar. Bağlantı yokken kayıt TEST olur, bayiye gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Carinin telefonunu kontrol edin.'] },
      backup: O.E.backup(),
    },
  };
};
