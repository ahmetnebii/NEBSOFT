// CRM & Satış Hunisi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js crm
module.exports = (O) => {
  const ebelge = O.ebelge();
  return {
    ne: 'CRM & Satış Hunisi, satış fırsatlarını ilk görüşmeden kapanışa kadar izler. Firma ve kişileri tutar, görevleri hatırlatır, teklif hazırlar, müşteriye online onay bağlantısı verir ve hedefe göre satış tahminini gösterir.',
    kimler: 'B2B satış yapan işletmeler, teklif ve görüşmeyle çalışan satış ekipleri.',
    ilkNot: 'Aylık hedefi ve temsilci hedeflerini **Ayarlar** sayfasından girin. Panodaki hedef çubuğu buradan gelir.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Bu ay kazanılan, hedef, açık huni, ağırlıklı tahmin, kazanma oranı, görevler, takip önerileri, yenilemesi yaklaşanlar ve sessiz kalan fırsatları gösterir.',
        gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', en: 1400, boy: 1400, adimlar: [['**Ağırlıklı tahmin** fırsat tutarının aşama olasılığıyla çarpımıdır.', '.kpi@Ağırlıklı tahmin'], ['**Görev yap** görevi tamamlanmış işaretler.', '.btn@Görev yap'], ['**Takip önerileri** aranması gereken fırsatlardır.', 'h3@Takip önerileri'], ['**14+ gündür sessiz fırsatlar** temas gerektirir.', 'h3@14+ gündür sessiz fırsatlar']] }] }] },

      { id: 'huni', ne: 'Fırsatlar aşamalara göre sütunlarda görünür: **Yeni fırsat**, **Görüşme**, **Teklif verildi**, **Pazarlık**. Kartı sürükleyerek ilerletirsiniz, sütun başında toplam tutar ve olasılık yazar.',
        gorevler: [
          { baslik: 'Fırsat ekleme', sahneler: [
            { git: 'huni', en: 1500, adimlar: [['**Fırsat** düğmesine basın.', '#nd'], ['Fırsat veya firma arayın.', '#q'], ['Temsilciye göre süzün.', '#own'], ['**Gelen çağrı** numarayı kayıtlı kişiyle eşleştirir.', '#cid']] },
            { git: 'huni', once: [['tikla', '#nd']], kirp: 'pencere', boy: 1000, adimlar: [['**Fırsat adı** ve **Tutar (₺)** zorunludur.', '.field@Fırsat adı'], ['**Firma** ve **Yetkili** seçin.', '.field@Firma'], ['**Aşama**, **Tahmini kapanış** ve **Sorumlu** girin.', '.field@Aşama'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Fırsat detayı', ne: 'Karta tıklayınca fırsat sayfası açılır. Aşama düğmeleri **Kazanıldı** ve **Kaybedildi** ile biter. Kaybedilirse neden sorulur.', sahneler: [{ git: 'huni', once: [['tikla', '.deal']], kirp: 'ana', en: 1400, boy: 1000, adimlar: [['**Teklif hazırla** bu fırsata teklif açar.', '#qt'], ['**Düzenle** kaydı değiştirir.', '#ed'], ['Aşamayı bu düğmelerle değiştirin.', 'button@Pazarlık'], ['**Arama**, **Toplantı**, **E-posta**, **Not** ve **Görev** ile temas kaydedin.', 'button@Toplantı']] }] }],
        alanlar: [['Kaynak', 'Fırsatın nereden geldiği. Kaynak raporu buna göre oluşur.'], ['Kayıp nedeni (kaybedildiyse)', 'Kayıp raporunda görünür.'], ['Sözleşme yenileme tarihi', 'Panodaki yenilemesi yaklaşanlar buradan gelir.']],
        hatalar: [['Kayıp nedenini seçin uyarısı çıkıyor.', 'Kaybedildi için neden seçin.'], ['Numara kayıtlı değil uyarısı çıkıyor.', 'Kişiyi **Kişiler** sayfasından ekleyin.'], ['Tutar negatif olamaz uyarısı çıkıyor.', 'Tutarı düzeltin.']] },

      { id: 'gorevler', ne: 'Görevleri **Gecikmiş**, **Bugün**, **Bu hafta** ve **Daha sonra / tarihsiz** olarak gruplar. **Son aktiviteler** ekibin görüşmelerini gösterir.',
        gorevler: [{ baslik: 'Görev ekleme', sahneler: [
          { git: 'gorevler', en: 1400, adimlar: [['**Görev** düğmesine basın.', '#nt'], ['Ekibe göre süzün.', '#ow']] },
          { git: 'gorevler', once: [['tikla', '#nt']], kirp: 'pencere', adimlar: [['**Fırsat** seçin, **Görev** yazın.', '.field@Fırsat'], ['**Son tarih** ve **Sorumlu** girip **Kaydet** düğmesine basın.', '.field@Son tarih']] }] }],
        hatalar: [['Fırsat seçin uyarısı çıkıyor.', 'Görev bir fırsata bağlıdır.']] },

      { id: 'teklifler', ne: 'Tüm teklifleri, müşteri yanıtını ve online onay durumunu gösterir. Teklif fırsat sayfasındaki **Teklif hazırla** ile açılır.',
        gorevler: [
          { baslik: 'Teklifleri izleme', sahneler: [{ git: 'teklifler', en: 1600, adimlar: [['**Yanıt bekleyen** ve **Görüntülenip yanıtlanmayan** kutuları takip önceliğidir.', '.kpi@Görüntülenip yanıtlanmayan'], ['**Bekleyen**, **Kabul**, **Red** ve **Süresi dolan** ile süzün.', 'button@Süresi dolan'], ['**Bağlantı / gönder** müşteri adresini verir.', "button[title='Bağlantı / gönder']"], ['**Revize et** yeni sürüm oluşturur.', "button[title='Revize et']"], ['**Kabul edildi olarak işaretle** telefonla gelen onayı işler.', "button[title='Kabul edildi olarak işaretle']"]] }] },
          { baslik: 'Teklifi müşteriye gönderme', ne: 'Müşteri bağlantıyı açar, teklifi görür, tek tıkla kabul veya red eder. Yanıt fırsata işlenir.', sahneler: [{ git: 'teklifler', once: [['tikla', "button[title='Bağlantı / gönder']"]], kirp: 'pencere', adimlar: [['**Kopyala** adresi kopyalar.', '#cp'], ['**WhatsApp** ve **E-posta** hazır mesajı açar.', 'a@WhatsApp'], ['**Önizle** müşterinin göreceği sayfayı açar.', '.btn@Önizle'], ['**PDF / yazdır** teklifi basar.', '#pp']] }] }],
        hatalar: [['Kabul edilen teklif revize edilemez uyarısı çıkıyor.', 'Yeni teklif hazırlayın.'], ['En az bir satır girin uyarısı çıkıyor.', 'Teklife kalem ekleyin.'], ['İskonto 0 ile 100 arasında olmalı uyarısı çıkıyor.', 'Oranı düzeltin.'], ['Kuru girin uyarısı çıkıyor.', 'Dövizli teklifte kuru yazın.'], ['Fatura için firma kartına VKN / TCKN girin uyarısı çıkıyor.', 'Firma kartını doldurun.']] },

      { id: 'firmalar', ne: 'Firma kartlarını, kişileri, fırsatları, teklifleri ve temas geçmişini tutar.',
        gorevler: [
          { baslik: 'Firma ekleme', sahneler: [
            { git: 'firmalar', en: 1400, adimlar: [['**Yeni firma** düğmesine basın.', 'button@Yeni firma'], ['**Excel\'den al** dosyadan firma alır.', '#imp'], ['**Firma kartı** simgesi firmanın sayfasını açar.', "button[title='Firma kartı']"]] },
            { git: 'firmalar', once: [['tikla', 'button@Yeni firma']], kirp: 'pencere', boy: 960, adimlar: [['**Firma adı** zorunludur.', '.field@Firma adı'], ['Fatura için **VKN / TCKN** ve **Vergi dairesi** gerekir.', '.field@VKN'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Firma kartı', sahneler: [{ git: 'firmalar', once: [['tikla', "button[title='Firma kartı']"]], kirp: 'ana', en: 1400, boy: 1100, adimlar: [['**Kazanılan ciro** ve **Son temas** kutularına bakın.', '.kpi@Son temas'], ['**Temas geçmişi** tüm görüşmelerdir.', 'h3@Temas geçmişi'], ['**Fırsat** bu firmaya yeni fırsat açar.', '.btn@Fırsat']] }] }] },

      { id: 'kisiler', ne: 'Firmalardaki yetkili kişileri tutar. Gelen çağrıda numara buradan eşleşir.',
        gorevler: [{ baslik: 'Kişi ekleme', sahneler: [
          { git: 'kisiler', adimlar: [['**Yeni kişi** düğmesine basın.', 'button@Yeni kişi'], ['**Excel\'den al** dosyadan kişi alır.', '#imp']] },
          { git: 'kisiler', once: [['tikla', 'button@Yeni kişi']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Firma** girin.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      { id: 'katalog', ne: 'Teklif satırlarına tek tıkla eklenen ürün ve hizmetleri tutar.',
        gorevler: [{ baslik: 'Kalem ekleme', sahneler: [{ git: 'katalog', adimlar: [['**Kalem ekle** düğmesine basın.', 'button@Kalem ekle'], ['**Excel (CSV)** listeyi dosyaya alır.', 'button@Excel (CSV)']] }] }],
        hatalar: [['Fiyat negatif olamaz uyarısı çıkıyor.', 'Fiyatı düzeltin.']] },

      { id: 'raporlar', ne: 'Kaynak verimliliği, kayıp nedenleri ve temsilci karşılaştırmasını gösterir. Bu sayfayı yalnız satış müdürü görür.',
        gorevler: [{ baslik: 'Raporu okuma', sahneler: [{ git: 'raporlar', en: 1400, boy: 1300, adimlar: [['Dönemi **30 gün**, **90 gün**, **1 yıl** veya **Tümü** ile seçin.', 'button@90 gün'], ['**Kaynaklara göre** fırsatın nereden geldiğini gösterir.', 'h3@Kaynaklara göre'], ['**Kayıp nedenleri** kaybedilen tutarı açıklar.', 'h3@Kayıp nedenleri'], ['**Temsilci karşılaştırması** kazanılan ve açık huniyi gösterir.', 'h3@Temsilci karşılaştırması']] }] }] },

      O.imzali(),
      O.belgeler(),
      O.ayarlar({ alanlar: [['Aylık satış hedefi (₺)', 'Panodaki hedef çubuğu.']] }),
      O.bildirimler(),
      { ...ebelge, ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. Kabul edilen tekliften kesilen fatura buraya işlenir. Entegratör bağlanmadan belgeler TEST görünür, GİB’e gitmez.', hatalar: [['Belge TEST olarak görünüyor.', '**Entegrasyonlar** sayfasında e-Fatura kartından entegratörünüzü bağlayın. TEST belgeler resmî belge değildir.']] },
      O.entegrasyonlar(),
    ],
    roller: 'Satış temsilcisi rapor ve yönetim sayfaları dışındaki bölümlerle çalışır.',
    musteri: [{ ad: 'Teklif sayfası', ne: 'Müşteri teklif bağlantısını açar, kalemleri ve toplamı görür, tek tıkla kabul veya red eder. Üyelik gerekmez. Bağlantı her teklife özeldir, **Bağlantı / gönder** penceresinden alınır. Yanıt teklife ve fırsata işlenir. Görünümü bu penceredeki **Önizle** ile görürsünüz.' }],
    yazdirma: { ne: 'Teklifler teklif ekranından yazdırılır.', belgeler: [['Teklif', '**Teklifler** sayfasında **Yazdır** veya pencerede **PDF / yazdır**.']] },
    entegrasyon: {
      email: { degisir: ['**E-posta istemcisini aç** seçeneğinde **E-posta** düğmesi e-posta programınızı hazır metinle açar, siz gönderirsiniz.', 'Teklif penceresindeki **E-posta** düğmesi sağlayıcı bağlı olsa da bu yolla çalışır.', '**Bağlantıyı dene** hesap bilgisini okur, e-posta göndermez.'], sorun: ['Kişinin e-posta adresini kontrol edin.'] },
      whatsapp: O.E.whatsappLink('Teklif penceresindeki **WhatsApp** düğmesi'),
      callerid: { degisir: ['Santral ve Caller ID cihazlarının bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **Gelen çağrı** numarayı elle sorar, kayıtlı kişi varsa eşleştirir.', 'Simülasyonda **Arayan numara TEST** uyarısı çıkar.'], sorun: ['Numarayı elle yazarak işinize devam edin.'] },
      takvim: { degisir: ['Google Takvim ve Outlook için kendi hesabınızı **Entegre et** ile bağlarsınız. **Bağlantıyı dene** takvim bilgisini okur, etkinlik eklemez, davet göndermez.', 'Bağlıyken fırsata son tarihli görev eklenince takvime etkinlik yazılır. Katılımcı eklenmez.', 'iCal aboneliği için bağlantı testi gerekmez.'], sorun: ['Google’da servis hesabının takvime yetkili olduğunu kontrol edin.', 'Etkinlik görünmüyorsa **Bağlantıyı dene** adımını yineleyin.'] },
      efatura: { degisir: ['Kabul edilen tekliften kesilen fatura entegratöre gönderilir.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Sağlayıcının altındaki sınırı okuyun.', 'Simülasyonda belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Belge kesilmezse **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
      backup: O.E.backup(),
    },
  };
};
