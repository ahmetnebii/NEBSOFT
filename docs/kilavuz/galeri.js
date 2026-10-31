// Oto Galeri kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js galeri
const KAP = 'NEBSOFT ile iletişime geçerek açtırılır.';
module.exports = (O) => ({
  ne: 'Oto Galeri programı, araç stoğunu, alış ve masraflarla oluşan gerçek maliyeti, ekspertiz bilgisini, ilan metinlerini, opsiyon ve satışı, konsinye ödemelerini ve kârlılığı izler. Vitrin sayfasında müşteriler stoktaki araçları görür ve bilgi ister.',
  kimler: 'Oto galeriler ve ikinci el araç alım satımı yapan işletmeler. Konsinye (emanet) araç çalışan yerlerde de kullanılır.',
  ilkNot: '**Ayarlar** sayfasındaki **Uzun bekleme uyarısı (gün)** ve **Aylık sermaye maliyeti % (finansman/kasko)** alanlarını doldurun. Bekleyen araçların maliyeti bunlardan hesaplanır.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Stoktaki aracı, bağlı sermayeyi, 30 günlük satışı, ortalama satış süresini ve uzun bekleyen araçları gösterir.',
      gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1100, adimlar: [['**Stoktaki araç**, **30 gün satış**, **Ortalama satış süresi** ve **60+ gün bekleyen** kutuları galerinin durumudur.', '.kpi'], ['**Talepler** ve **Araçlar** düğmeleri ilgili sayfayı açar.', 'a@Talepler']] }] }] },

    { id: 'araclar', ne: 'Stoktaki araçları maliyet, fiyat, beklenen kâr ve stok günüyle listeler. Araca tıklayınca masraf, ekspertiz, ilan, opsiyon ve satış işlemleri açılır. Alış, maliyet ve kârı yalnız galeri sahibi görür.',
      gorevler: [
        { baslik: 'Araç alışı', sahneler: [
          { git: 'araclar', kirp: 'ana', adimlar: [['**Araç alışı** yeni araç açar.', '#add'], ['Listeyi **Stokta**, **Hazırlıkta**, **60+ gün**, **Konsinye**, **Satılan** ve **Tümü** ile süzün.', 'button@Konsinye'], ['Plaka, marka veya model yazın.', '#q'], ['Satırdaki göz simgesi araç penceresini açar.', '[data-act=v]']] },
          { git: 'araclar', once: [['tikla', '#add']], kirp: 'pencere', boy: 1250, adimlar: [['**Plaka**, **Marka**, **Model**, **Yıl** ve **Km** zorunludur.', '.field@Plaka'], ['**Geliş şekli** seçin. **Konsinye (emanet)** seçilirse sahip bilgileri gerekir.', '.field@Geliş şekli'], ['**Alış fiyatı (konsinyede boş)** ve **Tramer kaydı (₺)** alanlarını doldurun.', '.field@Alış fiyatı'], ['**İlan fiyatı** zorunludur. **En düşük satış fiyatı** danışmanın inebileceği sınırdır.', '.field@İlan fiyatı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Araç üzerinde çalışma', sahneler: [{ git: 'araclar', once: [['tikla', '[data-act=v]']], kirp: 'pencere', boy: 1000, adimlar: [['**Masraf ekle** yıkama, boya, noter gibi gideri maliyete yazar.', 'button@Masraf ekle'], ['**Ekspertiz** tramer ve ekspertiz notunu saklar.', 'button@Ekspertiz'], ['**İlan** ilan metnini hazırlar.', 'button@İlan'], ['**Opsiyon koy** aracı kaporayla müşteriye ayırır.', 'button@Opsiyon koy'], ['**Eşleşen talepler** bu aracı arayan müşterileri gösterir.', 'button@Eşleşen talepler'], ['**Sat** satış penceresini açar.', 'button@Sat']] }] },
        { baslik: 'İlan metni hazırlama', ne: 'Program ilanı portala kendisi göndermez. Metni kopyalayıp portala yapıştırırsınız, yayınlanınca numarasını kaydedersiniz.', sahneler: [{ git: 'araclar', once: [['tikla', '[data-act=v]'], ['tikla', 'button@İlan']], kirp: 'pencere', boy: 900, adimlar: [['**Metni kopyala** ile metni alın.', 'button@Metni kopyala'], ['**Portal** seçin, **İlan numarası** yazın, **İlan numarasını kaydet** düğmesine basın.', '#adn']] }] },
        { baslik: 'Satış yapma', ne: 'Satış kaydedilince araç stoktan çıkar, satış belgesi hazırlanır. Takasta aracın bilgileri girilir ve takas aracı stoğa düşer. Satış sonrası **Satış belgesi** ve **Satışı geri al** düğmeleri çıkar.', sahneler: [{ git: 'araclar', once: [['tikla', '[data-act=v]'], ['tikla', 'button@Sat']], kirp: 'pencere', boy: 1000, adimlar: [['**Alıcı ad soyad** ve **Telefon** yazın.', '.field@Alıcı ad soyad'], ['**Satış fiyatı (₺)** yazın. En düşük fiyatın altındaysa program sorar.', '.field@Satış fiyatı'], ['**Ödeme** türünü seçin. **Takas + nakit** seçilirse takas aracı alanlarını doldurun.', '.field@Ödeme'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Komisyon %', 'Konsinye satıştan galerinin alacağı oran.'], ['İstediği bedel (₺)', 'Konsinye araç sahibinin istediği tutar.'], ['İlan açıklaması', 'İlan metninde ve vitrinde kullanılır.'], ['Noter tarihi', 'Devir işleminin tarihi.'], ['Alınan kapora', 'Kapora kalan tutardan düşülür.']],
      hatalar: [['Bu plaka stokta kayıtlı uyarısı çıkıyor.', 'Aynı plakalı araç zaten vardır. Listede arayın.'], ['İlan fiyatı girin uyarısı çıkıyor.', '**İlan fiyatı** alanını doldurun.'], ['En düşük fiyat ilan fiyatından büyük olamaz uyarısı çıkıyor.', '**En düşük satış fiyatı** değerini düşürün.'], ['Konsinye araçta sahibin adı ve telefonu gerekli uyarısı çıkıyor.', '**Araç sahibi** ve **Telefon** alanlarını doldurun.'], ['Takas bedeli ve kapora satış fiyatını aşamaz uyarısı çıkıyor.', 'Tutarları kontrol edin.'], ['Araç sahibine ödeme yapılmış, satış geri alınamaz uyarısı çıkıyor.', 'Konsinye ödemesi yapılan satış geri alınmaz. Düzeltme için muhasebecinizle görüşün.']] },

    { id: 'talepler', baslik: 'Müşteri Talepleri', ne: 'Araç arayan müşterileri, bütçesini ve aradığı aracı tutar. Vitrin sayfasından gelen talepler de buraya düşer. Program bütçeye ve kasaya uyan araçları önerir. Menüdeki sayı yeni talep adedidir.',
      gorevler: [{ baslik: 'Talep ekleme ve araç önerme', sahneler: [
        { git: 'talepler', kirp: 'ana', boy: 900, adimlar: [['**Talep ekle** yeni kayıt açar.', '#add'], ['**Uygun araçları gönder** eşleşen araçları müşteriye iletir. SMS bağlı değilse WhatsApp önerilir.', 'button@Uygun araçları gönder'], ['**Arandı** görüşmeyi kaydeder.', 'button@Arandı']] },
        { git: 'talepler', once: [['tikla', '#add']], kirp: 'pencere', boy: 900, adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Bütçe (₺)**, **Kasa** ve **Aradığı araç** eşleştirmede kullanılır.', '.field@Bütçe'], ['**Kaynak** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'konsinye', ne: 'Satılan emanet araçların sahiplerine ödenecek tutarları gösterir. **Ödenecek** ve **Ödenen** toplamları üstte yazar. Satır açıldığında **Ödeme yap** ile ödeme girilir, **Konsinye ödeme makbuzu** yazdırılır. Bu sayfayı yalnız galeri sahibi görür.',
      gorevler: [{ baslik: 'Konsinye ödemesi', sahneler: [{ git: 'konsinye', kirp: 'ana', adimlar: [['Kutular ödenecek ve ödenen toplamları gösterir. Demoda satılmış konsinye araç yoktur, liste boştur.', '.kpi']] }] }],
      hatalar: [['Tutar 0 ile kalan arasında olmalı uyarısı çıkıyor.', 'Ödeme kalan tutarı aşamaz.']] },

    { id: 'raporlar', ne: 'Marka, geliş şekli ve kasaya göre gerçekleşen kârı ve satış süresini gösterir. Kâr KDV ve vergi hesaba katılmadan gösterilir. Bu sayfayı yalnız galeri sahibi görür.',
      gorevler: [{ baslik: 'Kârlılık okuma', sahneler: [{ git: 'raporlar', kirp: 'ana', boy: 1000, adimlar: [['**Son 3 ay**, **Son 12 ay** veya **Tümü** seçin.', '#pr'], ['**Excel** satışları dosyaya alır.', '#ex']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Araç satış sözleşmesi' }),
    O.ayarlar({ alanlar: [['Uzun bekleme uyarısı (gün)', 'Bu süreyi geçen araç uyarıda görünür.'], ['Aylık sermaye maliyeti % (finansman/kasko)', 'Bekleyen aracın maliyetini tahmin etmede kullanılır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Satış danışmanı alış, maliyet ve kârı görmez. İlan fiyatı ve en düşük fiyatı görür. Konsinye ödemeleri ve kârlılık raporu galeri sahibine aittir.',
  musteri: [{ ad: 'Araç vitrini', ne: 'Müşteri üyelik açmadan stoktaki araçları, fiyatı ve tramer bilgisini görür. Araç için bilgi isteyebilir veya aradığı aracı bulamazsa talep bırakabilir. Talepler **Müşteri Talepleri** sayfasına düşer. Alış fiyatı, maliyet ve en düşük fiyat vitrinde görünmez.',
    sahneler: [{ adres: 'vitrin.html', ilk: 900, kirp: 'tam', boy: 1000, adimlar: [['Müşteri araçları bu listede görür.', '#root']] }] }],
  yazdirma: { ne: 'Belgeler araç penceresinden ve **İmzalı belgeler** sayfasından yazdırılır.', belgeler: [['Araç satış sözleşmesi', 'Satıştan sonra araç penceresinde **Satış belgesi**.'], ['Araç teslim tutanağı', '**İmzalı belgeler** sayfası.'], ['Konsinye ödeme makbuzu', '**Konsinye Ödemeleri** sayfası.']] },

  entegrasyon: {
    ilan: { kapali: { '*': KAP }, degisir: [`İlan portalları bağlantısı ${KAP}`, 'Bağlantı olmadan ilan otomatik gitmez. Araç penceresindeki **İlan** ekranından metni kopyalayıp portala yapıştırır, numarasını kaydedersiniz.'], sorun: ['İlan numarası kaydedilmezse listede **İlan** sütunu **yok** görünür.'] },
    sms: { degisir: ['**Uygun araçları gönder** müşteriye gerçek SMS gönderir. **Eşleşen talepler** penceresindeki **SMS ile haber ver** de aynı yolu kullanır.', 'Konsinye araç satılınca araç sahibine satış bilgisi SMS ile gider.', 'Bağlantı yokken mesaj gitmez, program WhatsApp ile göndermeyi önerir.'], sorun: ['Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.', 'Müşteri kaydındaki telefonu kontrol edin.'] },
    whatsapp: O.E.whatsappLink('SMS gönderilemediğinde çıkan **WhatsApp ile gönder** seçeneği'),
    efatura: { degisir: ['Belgeyi **e-Belgeler** sayfasındaki **Manuel e-Arşiv** ile keserseniz entegratöre gider. Satış ekranında fatura düğmesi yoktur.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Sağlayıcının altındaki sınırı okuyun.', 'Simülasyonda belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Belge kesilmezse **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
