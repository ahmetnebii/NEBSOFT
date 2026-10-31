// Ön Muhasebe kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js muhasebe
module.exports = (O) => {
  const SATIS = [['tikla', 'button@Yeni satış faturası']];
  return {
    ne: 'Ön Muhasebe, işletmenin fatura, cari, kasa, banka, stok, çek ve senet işlerini tek programda toplar. Teklifi siparişe, siparişi faturaya çevirirsiniz. Tahsilatı izler, hatırlatma gönderir, KDV taslağını ve Ba/Bs listesini mali müşavirinize hazırlarsınız.',
    kimler: 'Mal veya hizmet satan küçük ve orta ölçekli işletmeler. Tek yönetici olan yerde de, muhasebe, satış ve depo ayrı olan yerde de kullanılır.',
    ilkNot: 'Bu program resmî defter tutmaz. Beyan taslakları ve raporlar mali müşavirinize yardım içindir, beyanı mali müşaviriniz doğrular.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Kasa ve banka bakiyelerini, alacak ve borcu, bu ayki satışı, uyarıları, vadesi geçen alacakları, yaklaşan ödemeleri ve nakit akışı tahminini gösterir.',
        gorevler: [
          { baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', boy: 2100, en: 1400, adimlar: [['**Satış faturası** ve **Alış faturası** yeni fatura açar.', '.btn@Satış faturası'], ['**Vadesi geçen alacak** tahsilat önceliğidir.', '.kpi@Vadesi geçen alacak'], ['**Uyarılar** kartı dikkat isteyen işleri listeler.', 'h3@Uyarılar'], ['**Nakit akışı tahmini** 13 haftalık beklentidir.', 'h3@Nakit akışı tahmini']] }] },
          { baslik: 'Özeti düzenleme', sahneler: [{ git: 'ozet', once: [['tikla', 'button@Özelleştir']], kirp: 'pencere', boy: 900, adimlar: [['Görünecek kartları işaretleyin, sırayı oklarla değiştirin. **Varsayılana dön** ilk düzene alır.', 'button@Varsayılana dön'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      { id: 'faturalar', ne: 'Satış, alış ve iade faturalarını listeler. Fatura kesilir, tahsil edilir, e-Fatura veya e-Arşiv gönderilir, e-posta ve WhatsApp ile iletilir.',
        gorevler: [
          { baslik: 'Satış faturası kesme', sahneler: [
            { git: 'faturalar', en: 1500, adimlar: [['**Satış**, **Alış** veya **İadeler** bölümünü seçin.', '.btn@Alış'], ['**Yeni satış faturası** düğmesine basın.', 'button@Yeni satış faturası'], ['**Açık**, **Vadesi geçen**, **Kısmi** ve **Ödendi** ile süzün.', 'button@Vadesi geçen']] },
            { git: 'faturalar', once: SATIS, kirp: 'pencere', boy: 1050, en: 1500, adimlar: [['**Cari** seçin. Bakiye ve risk bilgisi altta görünür.', '.field@Cari'], ['**Vade**, **Para birimi** ve **Depo** alanlarını kontrol edin.', '.field@Vade'], ['Satırda ürün seçin, miktar ve fiyatı girin. **Satır ekle** yeni satır açar.', 'button@Satır ekle'], ['**İstisna / tevkifat** özel durumları açar.', 'button@İstisna / tevkifat'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Satır işlemleri', sahneler: [
            { git: 'faturalar', en: 1600, adimlar: [['**Tahsil et** ödeme kaydeder.', "button[title='Tahsil et']"], ['**e-Fatura / e-Arşiv gönder** belgeyi entegratöre iletir.', "button[title='e-Fatura / e-Arşiv gönder']"], ['**İade** iade faturası açar.', "button[title='İade']"], ['**Benzerini oluştur (kopyala)** aynı içerikle yeni fatura açar.', "button[title='Benzerini oluştur (kopyala)']"], ['**Tekrarlayan fatura yap** düzenli fatura şablonuna çevirir.', "button[title='Tekrarlayan fatura yap']"], ['**E-posta gönder** ve **WhatsApp** cariye iletir.', "button[title='WhatsApp']"]] },
            { git: 'faturalar', once: [['tikla', "button[title='Tahsil et']"]], kirp: 'pencere', adimlar: [['**Tutar (₺)** ve **Hangi hesaba** alanlarını doldurun.', '.field@Hangi hesaba'], ['**Tahsilat makbuzu yazdır** ve **Cariye SMS ile bildir** isteğe bağlıdır.', 'label@Tahsilat makbuzu yazdır'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['En az bir satır girin uyarısı çıkıyor.', 'Faturaya ürün veya hizmet ekleyin.'], ['Cari seçin uyarısı çıkıyor.', 'Listeden cari seçin.'], ['Aynı faturada tevkifat ve istisna birlikte kullanılamaz uyarısı çıkıyor.', 'Ayrı fatura kesin.'], ['Carinin e-posta adresi yok uyarısı çıkıyor.', 'Cari kartına e-posta girin.'], ['İade edilen faturanın numarasını girin uyarısı çıkıyor.', 'Alış iadesinde belge numarası zorunludur.'], ['Fatura silme yetkiniz yok uyarısı çıkıyor.', 'Silme Muhasebe veya Yönetici rolündedir.']] },

      { id: 'tekrar', ne: 'Kira, abonelik ve bakım sözleşmesi gibi düzenli faturaları kendiliğinden keser. Şablon, **Faturalar** sayfasındaki **Tekrarlayan fatura yap** ile oluşur. Şablon yoksa liste boş görünür.',
        gorevler: [{ baslik: 'Tekrarlayan faturayı izleme', sahneler: [{ git: 'tekrar', adimlar: [['Üstteki kutular aktif şablonu ve bu ay kesilecekleri gösterir.', '.kpi'], ['**Vadesi gelenleri şimdi oluştur** günü gelen faturaları hemen keser.', '#rn']] }] }],
        hatalar: [['Vadesi gelen tekrarlayan fatura yok uyarısı çıkıyor.', 'Bugün kesilecek şablon yoktur.'], ['Bitiş tarihi ilk faturadan önce olamaz uyarısı çıkıyor.', 'Tarihleri düzeltin.']] },

      { id: 'tahsilat', ne: 'Vadesi yaklaşan ve geciken alacakları, hatırlatma aşamasını gösterir. Hatırlatma SMS, WhatsApp veya e-posta ile gönderilir.',
        gorevler: [{ baslik: 'Ödeme hatırlatma', ne: 'Otomatik gönderim için **Ayarlar** sayfasındaki **Ödeme hatırlatmalarını otomatik gönder (SMS / WhatsApp Cloud / e-posta API bağlıysa)** seçeneğini açın. Bağlı kanal yoksa otomatik gönderim çalışmaz.', sahneler: [{ git: 'tahsilat', en: 1500, boy: 900, adimlar: [['**Açık alacak** ve **Vadesi geçmiş** kutuları toplamı gösterir.', '.kpi@Vadesi geçmiş'], ['**Hatırlatma bekleyen**, **Vadesi yaklaşan** ve **Vadesi geçen** ile süzün.', 'button@Vadesi yaklaşan'], ['**Bekleyenlere hatırlatma gönder** tümüne yollar.', '#ha'], ['Tek cari için **SMS ile hatırlat**, **WhatsApp ile hatırlat** veya **E-posta ile hatırlat** simgesine basın.', "button[title='SMS ile hatırlat']"]] }] }],
        hatalar: [['Hatırlatma bekleyen fatura yok uyarısı çıkıyor.', 'Süzgeçteki faturaların hatırlatması yapılmıştır.']] },

      { id: 'teklifler', ne: 'Fiyat teklifi hazırlarsınız. Kabul edilince siparişe veya faturaya çevrilir.',
        gorevler: [{ baslik: 'Teklif hazırlama', sahneler: [
          { git: 'teklifler', en: 1500, adimlar: [['**Yeni teklif** düğmesine basın.', '#nq'], ['Satırda durumu seçin: **Taslak**, **Gönderildi**, **Kabul edildi**, **Reddedildi**.', 'select'], ['**Siparişe çevir** ve **Faturaya çevir** teklifi aktarır.', "button[title='Faturaya çevir']"], ['**Proforma fatura** ön fatura basar.', "button[title='Proforma fatura']"]] },
          { git: 'teklifler', once: [['tikla', '#nq']], kirp: 'pencere', boy: 1050, en: 1500, adimlar: [['**Cari** ve **Geçerlilik** tarihini girin.', '.field@Geçerlilik'], ['Satırları doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      { id: 'siparisler', ne: 'Müşteri ve satın alma siparişlerini izler. Sevk ve faturalama siparişten yapılır.',
        gorevler: [{ baslik: 'Sipariş yönetimi', sahneler: [
          { git: 'siparisler', en: 1600, adimlar: [['**Satış** veya **Satın alma** seçin.', '.btn@Satın alma'], ['**Yeni sipariş** düğmesine basın.', '#nw'], ['**Sevk et** irsaliye keser, **Faturala** faturaya çevirir.', "button[title='Faturala']"], ['**İptal** siparişi kapatır.', "button[title='İptal']"]] },
          { git: 'siparisler', once: [['tikla', '#nw']], kirp: 'pencere', boy: 1050, en: 1500, adimlar: [['**Cari**, **Teslim tarihi** ve **Depo** girin.', '.field@Teslim tarihi'], ['Satırları doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Teslim edilecek stoklu kalem kalmadı uyarısı çıkıyor.', 'Sipariş tamamen sevk edilmiştir.']] },

      { id: 'irsaliyeler', ne: 'Sevk ve giriş irsaliyelerini tutar. İrsaliye stoğu günceller, sonra tek tek veya toplu faturalanır.',
        gorevler: [{ baslik: 'İrsaliye kesme', sahneler: [
          { git: 'irsaliyeler', en: 1500, adimlar: [['**Sevk (satış)** veya **Giriş (alış)** seçin.', '.btn@Giriş (alış)'], ['**Yeni irsaliye** düğmesine basın.', '#nw'], ['İşaretlenenleri **Seçilenleri faturala** ile toplu faturalayın.', '#bulk'], ['**Faturalanmamış**, **Faturalanmış** veya **Tümü** ile süzün.', 'button@Faturalanmış']] },
          { git: 'irsaliyeler', once: [['tikla', '#nw']], kirp: 'pencere', boy: 1100, en: 1500, adimlar: [['**Cari**, **Sevk tarihi** ve **Depo** girin.', '.field@Sevk tarihi'], ['**Araç plakası** ve **Şoför / teslim eden** yazın.', '.field@Araç plakası'], ['**Satır** ile ürün ekleyin, **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Faturalanacak irsaliyeleri seçin uyarısı çıkıyor.', 'En az bir satır işaretleyin.'], ['Toplu faturalamada irsaliyeler aynı cariye ait olmalı uyarısı çıkıyor.', 'Aynı cariyi seçin.'], ['En az bir ürün girin uyarısı çıkıyor.', 'İrsaliyeye ürün ekleyin.']] },

      { id: 'cariler', ne: 'Müşteri ve tedarikçi kartlarını, bakiyeleri ve ekstreyi tutar.',
        gorevler: [
          { baslik: 'Cari ekleme', sahneler: [
            { git: 'cariler', en: 1400, adimlar: [['**Yeni cari** düğmesine basın.', 'button@Yeni cari'], ['**İçe aktar** dosyadan cari alır.', '#imp'], ['**e-Belge bilgisi eksik** ve **Limit aşan** ile süzün.', 'button@Limit aşan']] },
            { git: 'cariler', once: [['tikla', 'button@Yeni cari']], kirp: 'pencere', boy: 1100, adimlar: [['**Ünvan** yazın, **Tür** seçin.', '.field@Ünvan'], ['e-Belge için **VKN / TCKN** ve **Vergi dairesi** gerekir.', '.field@VKN'], ['**Risk (borç) limiti ₺** aşılınca uyarı çıkar.', '.field@Risk'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Cari ekstresi', sahneler: [{ git: 'cariler', once: [['tikla', "button[title='Ekstre']"]], kirp: 'ana', boy: 1000, adimlar: [['**Ekstre yazdır** hareketleri basar.', 'button@Ekstre yazdır'], ['**Cari portalı** müşteriye giriş bilgisi verir.', 'button@Cari portalı'], ['**Mutabakat iste** mutabakat gönderir.', 'button@Mutabakat iste'], ['**Tahsilat** ve **Ödeme** hareket kaydeder.', 'button@Tahsilat']] }] }],
        alanlar: [['Etiketler (virgülle: bayi, İstanbul, VIP)', 'Süzme ve gruplama için.'], ['Fiyat listesi', 'Bu cariye kesilen faturada fiyatı belirler.'], ['Vade (gün)', 'Yeni faturada önerilen vade.']],
        hatalar: [['VKN 10, TCKN 11 haneli olmalı uyarısı çıkıyor.', 'Numarayı kontrol edin.'], ['Portal için carinin VKN / TCKN bilgisi gerekli uyarısı çıkıyor.', 'Cari kartını doldurun.']] },

      { id: 'beyanname', ne: 'Seçilen ayın KDV taslağını, Ba ve Bs listesini, cari mutabakatını ve beyan takvimini mali müşaviriniz için hazırlar. Bu sayfa beyan göndermez.',
        gorevler: [
          { baslik: 'KDV taslağı', sahneler: [{ git: 'beyanname', en: 1400, boy: 1000, adimlar: [['Ayı **Önceki ay** ve **Sonraki ay** simgeleriyle seçin.', ".btn[title='Önceki ay'], [aria-label='Önceki ay']"], ['**Ödenecek KDV** taslak sonucudur.', '.kpi@Ödenecek KDV'], ['**Excel** dosyaya alır, **Mali müşavire yazdır** basar.', '#kp']] }] },
          { baslik: 'Ba/Bs ve mutabakat', sahneler: [{ git: 'beyanname', once: [['tikla', 'button@Cari mutabakat']], en: 1400, boy: 1000, adimlar: [['Sekmeler: **KDV beyan taslağı**, **Ba / Bs formları**, **Cari mutabakat**, **Beyan takvimi**.', 'button@Ba / Bs formları'], ['**Mutabakat mektubu gönder** cariye iletir.', "button[title='Mutabakat mektubu gönder']"], ['**Mutabık** veya **Mutabık değil** ile sonucu işleyin.', "button[title='Mutabık']"]] }] }] },

      { id: 'urunler', ne: 'Stoklu ürün ve hizmet kartlarını tutar: kod, barkod, fiyat, KDV ve kritik stok.',
        gorevler: [
          { baslik: 'Kart ekleme', sahneler: [
            { git: 'urunler', en: 1400, adimlar: [['**Yeni kart** düğmesine basın.', 'button@Yeni kart'], ['**Fiyat listeleri** cariye özel fiyatı tanımlar.', '#fl'], ['**İçe aktar** dosyadan kart alır.', '#imp'], ['**Stoklu**, **Hizmet** ve **Kritik** ile süzün.', 'button@Kritik']] },
            { git: 'urunler', once: [['tikla', 'button@Yeni kart']], kirp: 'pencere', boy: 960, adimlar: [['**Ad** yazın, **Tür** seçin. Hizmette stok tutulmaz.', '.field@Tür'], ['**Satış fiyatı (₺)** zorunludur.', '.field@Satış fiyatı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        alanlar: [['Diğer birimler (ör. koli=12, paket=6)', 'Ana birimin katları.'], ['Kritik stok', 'Bu miktarda uyarı çıkar.'], ['Grup', 'Raporda gruplama için.']] },

      { id: 'stok', ne: 'Depo bazında stoğu, hareketleri ve depoları gösterir. Transfer ve sayım buradadır.',
        gorevler: [{ baslik: 'Transfer ve sayım', sahneler: [
          { git: 'stok', en: 1400, boy: 900, adimlar: [['**Depo transferi** depolar arası taşır.', '#tr'], ['**Sayım / düzeltme** stoğu eşitler.', '#cnt'], ['**Depo ekle** yeni depo açar.', '#nd'], ['**Stok durumu**, **Hareketler** ve **Depolar** sekmeleri arasında geçin.', 'button@Hareketler']] },
          { git: 'stok', once: [['tikla', '#tr']], kirp: 'pencere', adimlar: [['**Ürün**, **Çıkış deposu**, **Giriş deposu** ve **Miktar** girin.', '.field@Çıkış deposu'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Farklı depo seçin uyarısı çıkıyor.', 'Çıkış ve giriş deposu aynı olamaz.'], ['Transfer için en az iki depo gerekli uyarısı çıkıyor.', '**Depo ekle** ile ikinci depo açın.']] },

      { id: 'kasa', ne: 'Hesap bakiyelerini, gelir ve gideri, virmanı gösterir. Banka hareketi **Ekstre yükle** ile dosyadan gelir, önerilen eşleştirmeleri onaylarsınız.',
        gorevler: [{ baslik: 'Gelir, gider ve virman', sahneler: [
          { git: 'kasa', en: 1400, boy: 900, adimlar: [['**Gelir** ve **Gider** kayıt açar.', 'button@Gelir'], ['**Virman** hesaplar arası aktarır.', 'button@Virman'], ['**Ekstre yükle** banka dosyasını alır.', '#bxl'], ['**Hesap ekle** kasa veya banka hesabı açar.', 'button@Hesap ekle']] },
          { git: 'kasa', once: [['tikla', 'button@Gelir']], kirp: 'pencere', adimlar: [['**Hesap**, **Kategori** ve **Tutar** girin, **Kaydet** düğmesine basın.', '.field@Hesap']] }] }],
        hatalar: [['Farklı hesap seçin uyarısı çıkıyor.', 'Virmanda kaynak ve hedef aynı olamaz.'], ['Banka hesabı yok uyarısı çıkıyor.', '**Hesap ekle** ile banka hesabı açın.'], ['Dosyada tarih ve tutar sütunu bulunamadı uyarısı çıkıyor.', 'Ekstrede tarih ve tutar sütunu olmalıdır.']] },

      { id: 'cek', ne: 'Alınan ve verilen çek ile senetlerin vadesini izler.',
        gorevler: [{ baslik: 'Çek ekleme', sahneler: [
          { git: 'cek', en: 1400, adimlar: [['**Yeni çek/senet** düğmesine basın.', 'button@Yeni çek/senet'], ['**Portföyde**, **Alınan** ve **Verilen** ile süzün.', 'button@Portföyde']] },
          { git: 'cek', once: [['tikla', 'button@Yeni çek/senet']], kirp: 'pencere', adimlar: [['**Yön** ve **Tür** seçin.', '.field@Yön'], ['**Seri no**, **Vade** ve **Tutar** zorunludur.', '.field@Seri no'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      { id: 'kurlar', ne: 'Dövizli fatura, sipariş ve cari için kurları tutar. Hangi kurun ve günün kullanılacağını mali müşavirinize danışın.',
        gorevler: [{ baslik: 'Kur güncelleme', sahneler: [{ git: 'kurlar', en: 1400, adimlar: [['Kur türünü seçin: **Döviz alış**, **Döviz satış**, **Efektif alış**, **Efektif satış**.', '#rt'], ['**TCMB\'den güncelle** günün kurunu getirir.', '#tc'], ['**Kurları kaydet** saklar.', '#sv']] }] }],
        hatalar: [['TCMB kurları alınamadı uyarısı çıkıyor.', 'Kurları elle yazıp kaydedin.']] },

      { id: 'raporlar', ne: 'Dönem geliri, gideri, net kâr, KDV, alacak yaşlandırma ve gider dağılımını gösterir.',
        gorevler: [{ baslik: 'Rapor alma', sahneler: [
          { git: 'raporlar', en: 1400, boy: 1100, adimlar: [['Dönemi **Bu ay**, **Geçen ay**, **Bu çeyrek**, **Bu yıl** veya **Geçen yıl** ile seçin.', 'button@Bu çeyrek'], ['Üstteki kutular dönem toplamıdır.', '.kpi'], ['**Resmi muhasebeye aktar** kayıtları dosyaya alır.', '#aktar']] },
          { git: 'raporlar', once: [['tikla', '#aktar']], kirp: 'pencere', adimlar: [['**Dönem** ve **Aktarılacaklar** seçin, **Kaydet** düğmesine basın. Aktarım dosyası (CSV) iner.', '.field@Aktarılacaklar']] }] }] },

      { id: 'analiz', ne: 'Nakit akışı, ödeme takvimi, satış, tahsilat, kasa, stok ve dönem karşılaştırma analizlerini gösterir.',
        gorevler: [{ baslik: 'Analiz seçme', sahneler: [{ git: 'analiz', en: 1400, boy: 1000, adimlar: [['Sekmeler: **Nakit akışı**, **Ödeme takvimi**, **Satış**, **Tahsilat & ödeme**, **Kasa & banka**, **Stok**, **Dönem karşılaştırma**.', 'button@Dönem karşılaştırma'], ['**13. hafta sonu** kutusu beklenen bakiyedir.', '.kpi@13. hafta sonu']] }] }] },

      { id: 'karlilik', ne: 'Gelir ve gideri proje veya şube bazında gösterir. Faturaya proje veya şube seçilince kayıt buraya yansır.',
        gorevler: [{ baslik: 'Proje ekleme', sahneler: [
          { git: 'karlilik', en: 1400, adimlar: [['**Projeler** veya **Şubeler** seçin.', 'button@Şubeler'], ['**Yeni proje** düğmesine basın.', '#np'], ['**Şubeleri yönet** şube listesini açar.', '#br']] },
          { git: 'karlilik', once: [['tikla', '#np']], kirp: 'pencere', adimlar: [['**Proje / etiket adı** yazın.', '.field@Proje'], ['**Bütçe (gider, TL)** kârlılık takibi içindir, **Kaydet** düğmesine basın.', '.field@Bütçe']] }] }],
        hatalar: [['Bu adla bir proje var uyarısı çıkıyor.', 'Farklı ad yazın.'], ['Şubeleri yalnızca yönetici düzenler uyarısı çıkıyor.', 'Yöneticiyle girin.']] },

      { id: 'gecmis', ne: 'Kim, ne zaman, neyi ekledi, değiştirdi veya sildi bilgisini gösterir. Son 5.000 işlem tutulur.',
        gorevler: [{ baslik: 'İşlem arama', sahneler: [{ git: 'gecmis', adimlar: [['İşlem, belge no veya cari yazın.', '#aq'], ['Kullanıcıya göre süzün.', '#au'], ['**Excel (CSV)** dosyaya alır.', '#ax']] }] }] },

      O.imzali(),
      O.belgeler(),
      O.ayarlar({ alanlar: [['Mükellef türü (beyan takvimi için)', 'Beyan takvimi buna göre oluşur.'], ['Öncelikli kanal', 'Hatırlatmanın önce deneneceği kanal.'], ['Vadeden kaç gün önce', 'İlk hatırlatma zamanı.'], ['Gecikmede kaç günde bir (en çok 3 kez)', 'Gecikme hatırlatma aralığı.'], ['Ba/Bs bildirim sınırı (₺, KDV hariç)', 'Liste bu sınıra göre oluşur.'], ['IBAN (faturada görünür)', 'Fatura çıktısında görünür.'], ['Varsayılan fatura notu', 'Yeni faturada hazır gelir.'], ['Eksi stokla satış/sevke izin ver', 'Açıksa stok eksiye düşebilir.'], ['Satış faturası kaydedilince otomatik e-Fatura / e-Arşiv kes', 'Açıksa kayıtta belge gönderilir.']] }),
      O.bildirimler(),
      O.ebelge(),
      O.entegrasyonlar(),
    ],
    roller: 'Muhasebe finans, rapor ve e-Belge ile çalışır. Satış teklif, sipariş, fatura ve cariyi görür. Depo stok ve irsaliyeyle çalışır.',
    musteri: [{ ad: 'Cari hesap portalı', ne: 'Cari, VKN veya TCKN ve kendisine verilen giriş koduyla girer. Yalnız kendi ekstresini ve faturalarını görür, mutabakata cevap verir. Bilgi **Cari portalı** düğmesiyle verilir.',
      sahneler: [{ adres: 'cari.html', ilk: 900, kirp: 'tam', adimlar: [['Cari VKN veya TCKN numarasını buraya yazar.', '#vk']] }] }],
    yazdirma: { ne: 'Belgeler ilgili sayfadan yazdırılır.', belgeler: [['Fatura', '**Faturalar** sayfasında yazdır simgesi.'], ['Proforma fatura', '**Teklifler** ve **Siparişler** sayfası.'], ['Tahsilat makbuzu', 'Tahsilat penceresinde **Tahsilat makbuzu yazdır**.'], ['Cari ekstresi', '**Ekstre yazdır**.'], ['KDV taslağı', '**Mali müşavire yazdır**.']] },
    entegrasyon: {
      efatura: { degisir: ['**Entegre et** ile entegratörü seçip bilgileri girersiniz. Nilvera ve Paraşüt’te **Bağlantıyı dene** hesabı doğrular, fatura göndermez. Uyumsoft denemesi tarayıcıda yapılır, canlıdan önce test hesabıyla bakılmalıdır. Sovos, Mysoft ve Logo e-Dönüşüm NEBSOFT ile iletişime geçerek açtırılır.', '**e-Fatura / e-Arşiv gönder** ve **Satış faturası kaydedilince otomatik e-Fatura / e-Arşiv kes** belgeyi entegratöre gönderir, numara faturaya yazılır.', '**Gelen belgeleri al** gelen kutusunu doldurur.', 'Simülasyonda belge TEST etiketlidir, GİB’e gitmez.'], sorun: ['Hata durumundaki belge için **e-Belgeler** sayfasındaki ayrıntıya bakın.', 'Bilgileri değiştirdiyseniz **Bağlantıyı dene** adımını yineleyin.'] },
      email: { degisir: ['Tarayıcı seçeneğinde e-posta programınız açılır. Sağlayıcı bağlıysa e-posta programdan gider.', '**Bağlantıyı dene** hesap bilgisini okur, e-posta göndermez.', 'Faturadaki **E-posta gönder**, **E-posta ile hatırlat** ve mutabakat bu ayarı kullanır.'], sorun: ['Carinin e-posta adresini kontrol edin.', 'Gönderilmiyorsa sağlayıcı anahtarını ve gönderen adresini kontrol edin.'] },
      sms: { degisir: ['**Entegre et** ile sağlayıcıyı seçip bilgileri girersiniz. **Bağlantıyı dene** hesap bakiyesini okur, ileti göndermez. **Bağlı** yazısı görünmeden SMS gönderilmez.', '**SMS ile hatırlat**, **Cariye SMS ile bildir** ve otomatik hatırlatma gerçek mesaj gönderir.', 'Bağlantı yokken kayıt TEST olur, cariye gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Carinin telefonunu kontrol edin.'] },
      whatsapp: { degisir: ['Bağlantı modunda **WhatsApp** düğmesi WhatsApp’ı açar, mesaj hazır gelir, siz gönderirsiniz.', 'WhatsApp Cloud API bağlıysa hatırlatma programdan gider. **Bağlantıyı dene** numara bilgisini okur, mesaj göndermez.'], sorun: ['WhatsApp açılmıyorsa carinin telefonunu kontrol edin.'] },
      webhook: { degisir: ['**Bağlantıyı dene** adresinize imzalı bir test olayı gönderir. Adres başarılı yanıt verirse bağlantı **Bağlı** olur, bundan önce olay gönderilmez.', 'Fatura, sipariş ve teklif kaydedilince **fatura**, **siparis** ve **teklif** olayları gider.'], sorun: ['Olay gelmiyorsa hedef adresin internetten erişilebilir olduğunu kontrol edin.'] },
      backup: O.E.backup(),
    },
    sssHaric: ['e-Fatura için ne gerekir?'],
    sss: [['e-Fatura için ne gerekir?', 'Bir özel entegratör hesabı gerekir. Hesabınızı **Entegre et** ile bağlar, **Bağlantıyı dene** ile doğrularsınız. Canlıya geçmeden entegratörün test hesabıyla deneyin.']],
  };
};
