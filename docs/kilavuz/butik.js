// Butik & Giyim kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js butik
module.exports = (O) => {
  const SEPET = [['yaz', '#scan', 'Keten'], ['tikla', '#sug [data-m]'], ['tikla', '[data-pv]']]; // sepete bir ürün ekler
  const ebelge = O.ebelge();
  return {
    ne: 'Butik & Giyim, giyim mağazasının beden ve renk bazında stok, satış, değişim ve etiket işlerini tek programda toplar. Modeli bir kez açarsınız, her beden ve renk için barkod kendiliğinden oluşur. Satış, değişim, iade, müşteri puanı ve sezon indirimi aynı yerden yürür.',
    kimler: 'Butik, giyim, ayakkabı ve aksesuar mağazaları. Tek kişilik mağazada da, satış danışmanı çalışan yerde de kullanılır.',
    ilkNot: 'Kasadan çıkan fiş bilgi fişidir, mali fişi yazarkasa cihazınızdan ayrıca kesersiniz.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],
    moduller: [
      { id: 'ozet', ne: 'Mağazanın durumunu gösterir: bugünkü satış, 30 günlük ciro ve brüt kâr, mağazadaki ürün, biten bedenler, en çok satan beden ve modeller.',
        gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1000, adimlar: [['Üstteki kutular bugünün ve son 30 günün özetidir.', '.kpi'], ['**Biten bedenler — sipariş verin** listesi diğer bedenleri stokta olup biten bedenleri gösterir.', 'h3@Biten bedenler'], ['Kasaya geçmek için **Satış** düğmesini kullanın.', '#view a.btn, #view button.btn']] }] }] },

      { id: 'satis', ne: 'Kasa ekranıdır. Barkodu okutursunuz veya modeli arayıp beden ve renk seçersiniz. Sepet oluşur, müşteri seçilirse puan işler, ödeme alınır, stok düşer ve fiş yazdırılır.',
        gorevler: [
          { baslik: 'Satış yapma', sahneler: [
            { git: 'satis', adimlar: [['Barkodu okutun veya model adını yazın. İki harften sonra modeller altta listelenir.', '#scan'], ['Satışı yapan kişiyi **Satış danışmanı** alanından seçin. Prim raporu buna göre hesaplanır.', '#rep']] },
            { git: 'satis', once: [['yaz', '#scan', 'Keten'], ['tikla', '#sug [data-m]']], kirp: 'pencere', adimlar: [['Tabloda rakamlar stok adedidir. Beden ve rengin kesiştiği düğmeye basın.', '[data-pv]'], ['Müşterinin bedeni yoksa **Bedeni yok mu? Gelince haber ver** ile kayıt açın.', '#wt']] },
            { git: 'satis', once: SEPET, kirp: 'tam', boy: 860, adimlar: [['Ürün sepete eklenir. Adedi satırdaki düğmelerle değiştirirsiniz.', '#cart'], ['Ek indirim tutarı için bu düğmeye basın.', '#dc'], ['Ödeme türüne basın: **Nakit**, **Kredi kartı** veya **Havale/EFT**.', '[data-pay=kart]'], ['Müşteri bekleyecekse **Beklet** sepeti kenara alır. **Bekleyenler** düğmesi geri getirir.', '#hold']] }] },
          { baslik: 'Müşteri seçme ve puan', ne: 'Telefon veya ad yazılır. Kayıtlı değilse yeni müşteri penceresi açılır. Müşterinin bedeninde stokta olan modeller kasada öneri olarak görünür. Puanı olan müşteride **Puan** ödemesi çıkar.', sahneler: [
            { git: 'satis', once: [['tikla', '#cus']], kirp: 'pencere', adimlar: [['**Müşteri telefonu veya adı** yazıp **Kaydet** düğmesine basın.', '.field@Müşteri telefonu']] }] },
          { baslik: 'Parçalı ödeme ve hediye çeki', ne: '**Parçalı / çek** birden çok ödeme türünü birlikte alır. Toplam satış tutarına eşit olmalıdır. İade çeki veya hediye çeki kodu burada kullanılır.', sahneler: [
            { git: 'satis', once: [...SEPET, ['tikla', '[data-pay=parcali]']], kirp: 'pencere', adimlar: [['Her türün tutarını yazın, **Satışı tamamla** düğmesine basın.', 'button@Satışı tamamla']] },
            { git: 'satis', once: [['tikla', '#gift']], kirp: 'pencere', adimlar: [['**Hediye çeki sat** için **Tutar (₺)** ve **Ödeme** girip **Kaydet** düğmesine basın. Çek kodu üretilir ve yazdırılır.', '.field@Tutar']] }] }],
        alanlar: [['Ek indirim (₺)', 'Sepetin toplamından düşülen tutar.']],
        hatalar: [['Barkod kayıtlı değil uyarısı çıkıyor.', 'Barkod ürünlerde yoktur. Model adıyla arayın veya modeli ekleyin.'], ['Ödemelerin toplamı satış tutarına eşit olmalı uyarısı çıkıyor.', 'Parçalı ödemedeki tutarların toplamını satış tutarına eşitleyin.'], ['Puan yetersiz uyarısı çıkıyor.', '**Parçalı / çek** ile puanı başka ödemeyle birleştirin.'], ['Bekleyen satış yok uyarısı çıkıyor.', 'Kenara alınmış sepet yoktur.']] },

      { id: 'degisim', ne: 'Fiş numarasıyla değişim ve iade yapılır. Değişim süresi **Ayarlar** sayfasındaki **Değişim süresi (gün)** alanından gelir. Süre geçmişse yönetici onayı gerekir. Stoklar karşılıklı güncellenir.',
        gorevler: [{ baslik: 'Değişim ve iade yapma', ne: 'Fiş numarası yazılınca satırlar listelenir. Aynı modelde fark alınmaz. Başka modele geçilirse yeni fiyat ile ödenen fiyat arasındaki fark alınır veya iade edilir. İade **Nakit iade**, **Karta iade**, **İade çeki ver (sonraki alışverişte)** veya müşteri seçiliyse **Puan olarak** yapılır.', sahneler: [
          { git: 'degisim', adimlar: [['Fiş barkodunu okutun veya fiş numarasını yazıp Enter’a basın.', '#fs'], ['Yapılan işlemler **Son işlemler** kartında görünür.', 'h3@Son işlemler']] },
          { git: 'degisim', once: [['yaz', '#fs', 'F5479'], ['tus', '#fs', 'Enter']], adimlar: [['Fişin satırları listelenir. Başlıktaki etiket fişin kaçıncı gününde olduğunuzu gösterir.', '#sale'], ['Satırdaki **Değiştir** veya **İade** düğmesini kullanın.', '#sale [data-act=rf]']] }] }],
        hatalar: [['Fiş bulunamadı uyarısı çıkıyor.', 'Fiş numarasını kontrol edin. **Satışlar** sayfasından arayabilirsiniz.'], ['Bu ürün için iade/değişim zaten yapıldı uyarısı çıkıyor.', 'Satırdaki adedin tamamı işlenmiştir.'], ['Aynı ürün uyarısı çıkıyor.', 'Değişimde farklı bir beden veya renk okutun.']] },

      { id: 'satislar', ne: 'Tüm fişlerin listesidir. Arama, süzme ve dosyaya alma buradadır.',
        gorevler: [{ baslik: 'Fiş bulma', sahneler: [{ git: 'satislar', adimlar: [['Arama kutusuna fiş numarası veya müşteri yazın.', '#q'], ['**Tümü**, **Bugün** veya **Online** ile süzün.', 'button@Bugün'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] }] }] },

      { id: 'urunler', ne: 'Model bazında beden ve renk stokunu yönetir. Her satırda beden kutuları stoka göre renklenir: kırmızı bitti, sarı azaldı. Üstteki şerit online kanalın durumunu gösterir.',
        gorevler: [
          { baslik: 'Yeni model ekleme', ne: 'Renkleri virgülle yazarsınız, beden takımındaki her beden ve renk için barkod oluşur.', sahneler: [
            { git: 'urunler', en: 1400, adimlar: [['**Yeni model** düğmesine basın.', '#add'], ['Listeyi **Azalan beden**, **İndirimde**, **Online satışta**, **Satmayan (60 gün)** veya **Pasif** ile süzün.', 'button@Azalan beden'], ['Bedenleri hazır takımlardan farklıysa **Beden takımları** ile yeni takım açın.', '#sz']] },
            { git: 'urunler', once: [['tikla', '#add']], kirp: 'pencere', boy: 960, adimlar: [['**Model adı**, **Model kodu** ve **Kategori** zorunludur.', '.field@Model adı'], ['**Beden takımı** seçin.', '.field@Beden takımı'], ['**Renkler (virgülle)** alanına renkleri yazın.', '.field@Renkler'], ['**Satış (₺)** alanını doldurun, **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Stok matrisi ve sayım', ne: 'Satırdaki **Stok matrisi** simgesi beden ve renk tablosunu açar. Sayım sonucunu kutulara yazıp kaydedersiniz.', sahneler: [
            { git: 'urunler', once: [['tikla', '[data-act=mx]']], kirp: 'pencere', adimlar: [['Kutulara sayılan adetleri yazın.', '.ns-overlay table'], ['**Hareketler** satış, iade, değişim, sayım ve mal kabul kayıtlarını gösterir.', 'button@Hareketler'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Mal kabul', ne: 'Tedarikçiden gelen malı modele göre girersiniz. Bekleyen beden talebi varsa program haber verilecek müşterileri listeler.', sahneler: [
            { git: 'urunler', once: [['tikla', '#kb']], kirp: 'pencere', adimlar: [['**Model** seçin.', '.field@Model'], ['Gelen adetleri tabloya yazın.', '.ns-overlay table'], ['**Gelen adet kadar etiket hazırla** işaretliyse etiketler seçili gelir.', 'label@Gelen adet kadar etiket hazırla'], ['**Stoğa ekle** düğmesine basın.', 'button@Stoğa ekle']] }] },
          { baslik: 'Dosyadan aktarma', ne: '**Excel\'den aktar** dosyada **Model kodu**, **Renk** ve **Beden** sütunlarını ister. Önizlemeden sonra **Aktar** ile eklenir.', sahneler: [{ git: 'urunler', en: 1400, adimlar: [['**Excel\'den aktar** düğmesine basın, dosyayı seçin.', '#xl'], ['**Etiket bas** Etiket Basımı sayfasına geçer.', '#lbl'], ['**Mal kabul** gelen malı stoğa alır.', '#kb']] }] }],
        alanlar: [['Üretici barkodu (varsa okutun, ad ve kategori dolar)', 'Ürünün üzerindeki barkod.'], ['Sezon', 'Sezon kampanyaları bu alana göre çalışır.'], ['Alış (₺)', 'Kâr ve stok maliyeti hesabında kullanılır.'], ['İndirim %', 'Modelin indirim oranı.'], ['Online / pazaryerinde sat', 'İşaretli modelin stoku bağlı kanala gönderilir.'], ['Birim alış (₺)', 'Mal kabulde gelen malın alış fiyatı.'], ['İrsaliye / fatura no', 'Mal kabulün belge numarası.']],
        not: 'İndirimden önceki fiyat olarak son 10 günün en düşük fiyatı gösterilir. Bu fiyat zaten uygulandıysa satırda eski fiyat gösterilmez, etiket de buna göre basılır.',
        hatalar: [['1–20 beden girin uyarısı çıkıyor.', 'Beden takımına 1 ile 20 arasında beden yazın.'], ['Gelen adetleri girin uyarısı çıkıyor.', 'Mal kabul tablosunda en az bir kutuyu doldurun.'], ['Gerekli sütunlar uyarısı çıkıyor.', 'Dosyanın ilk satırında **Model kodu**, **Renk** ve **Beden** başlıkları olmalıdır.']] },

      { id: 'etiket', ne: 'Askı, barkod ve indirim etiketlerini kendi şablonunuzla basarsınız. Fiyatı değişen modelleri tek düğmeyle bulursunuz.',
        gorevler: [
          { baslik: 'Etiket basma', sahneler: [
            { git: 'etiket', boy: 1300, en: 1400, adimlar: [['**Fiyatı değişen** etiketi eskimiş modelleri gösterir.', 'button@Fiyatı değişen'], ['Beden ve renk başına adet için **Beden/renk ve adet seç** düğmesini kullanın.', 'button@Beden/renk ve adet seç'], ['**Stok kadar** adetleri stoka eşitler, **+1** her bedenden bir etiket ekler.', 'button@Stok kadar'], ['**Şablon** seçin.', '#tp'], ['**Seçilenleri yazdır** düğmesine basın.', '#pr']] },
            { git: 'etiket', once: [['tikla', 'button@Beden/renk ve adet seç']], kirp: 'pencere', adimlar: [['Her kutu o beden ve renk için basılacak etiket adedidir. **Tamam** düğmesine basın.', 'button@Tamam']] }] },
          { baslik: 'Etiket şablonu düzenleme', sahneler: [{ git: 'etiket', once: [['tikla', '#ed']], kirp: 'pencere', boy: 1250, adimlar: [['Şablon seçin veya **Yeni** ile oluşturun. **En (mm)** ve **Boy (mm)** alanlarını etiketinize göre yazın.', '.field@En (mm)'], ['Soldaki öğelerden ekleyin, **Şablonu kaydet** düğmesine basın.', 'button@Şablonu kaydet']] }] }],
        hatalar: [['Etiket seçin uyarısı çıkıyor.', 'Yazdırmadan önce en az bir etiket seçin.'], ['Bu modelin stoğu yok uyarısı çıkıyor.', '**+1** ile her bedenden bir etiket ekleyin.']] },

      { id: 'musteriler', ne: 'Müşterinin bedenini, puanını, alışveriş geçmişini ve SMS iznini tutar.',
        gorevler: [
          { baslik: 'Müşteri ekleme', sahneler: [
            { git: 'musteriler', adimlar: [['**Yeni müşteri** düğmesine basın.', 'button@Yeni müşteri'], ['**Bu ay doğum günü** ve **SMS izni olan** süzgeçleri kampanya listesi çıkarır.', 'button@SMS izni olan']] },
            { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['SMS göndermek için müşterinin onayını alıp **SMS/kampanya izni** kutusunu işaretleyin.', 'label@SMS/kampanya izni'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
          { baslik: 'Geçmiş ve SMS', sahneler: [{ git: 'musteriler', adimlar: [['**Alışveriş geçmişi** simgesi fişleri ve çok aldığı bedeni gösterir.', '[data-act=hist]'], ['**SMS gönder** simgesi metni düzenleyip gönderir. SMS izni yoksa gönderilmez.', '[data-act=sms]']] }] }],
        hatalar: [['Müşterinin SMS izni yok (KVKK) uyarısı çıkıyor.', 'Müşterinin onayını alıp kartındaki izni işaretleyin.'], ['SMS sağlayıcısı bağlı değil uyarısı çıkıyor.', 'Mesaj gitmemiştir, TEST olarak kaydedilir. **Entegrasyonlar** sayfasından SMS bağlayın.']] },

      { id: 'kampanyalar', ne: 'Sezon veya kategori indirimi tanımlarsınız. **Yüzde indirim (etikete yansır)** kapsamdaki modellerin fiyatını değiştirir, **2. üründe indirim (kasada)** kasada uygulanır. Tarih verilirse kendiliğinden başlar ve biter. Bu sayfayı yalnız mağaza sahibi görür.',
        gorevler: [{ baslik: 'Kampanya tanımlama', sahneler: [
          { git: 'kampanyalar', adimlar: [['**Yeni kampanya** düğmesine basın.', '#bulk'], ['**Aç / kapat** simgesi kampanyayı durdurur veya başlatır.', '[data-act=tg], [title="Aç / kapat"]']] },
          { git: 'kampanyalar', once: [['tikla', '#bulk']], kirp: 'pencere', adimlar: [['**Kampanya adı** yazın, **Tür** ve **Kapsam** seçin.', '.field@Kampanya adı'], ['**Oran %** yazın.', '.field@Oran'], ['Boş bırakılırsa kampanya hemen başlar ve süresiz sürer.', '.field@Başlangıç'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Oran 1 ile 90 arasında olmalı uyarısı çıkıyor.', 'Oranı bu aralıkta yazın.'], ['Bitiş, başlangıçtan önce olamaz uyarısı çıkıyor.', 'Tarihleri düzeltin.']] },

      { id: 'raporlar', ne: 'Seçilen döneme göre ciro, ortalama fiş, ödeme türleri, danışman primi, kategori, renk, satış oranı ve ölü stoku gösterir. Bu sayfayı yalnız mağaza sahibi görür.',
        gorevler: [{ baslik: 'Dönem raporu alma', sahneler: [
          { git: 'raporlar', boy: 1000, en: 1400, adimlar: [['Dönemi **Bugün**, **7 gün**, **30 gün**, **Bu ay**, **Geçen ay** veya **Tarih seç** ile belirleyin.', 'button@30 gün'], ['**Gün sonu raporu yazdır** kasa raporunu basar.', '#zp'], ['**Kasa (ödeme türüne göre)** kartında satış, iade ve net görünür.', 'h3@Kasa (ödeme türüne göre)']] },
          { git: 'raporlar', boy: 2100, en: 1400, adimlar: [['**Satış oranı (sell-through)** dönemde satılanın eldeki stoka oranıdır.', 'h3@Satış oranı'], ['**Ölü stok — 60 gündür satılmayan** indirim veya pazaryeri adaylarını listeler.', 'h3@Ölü stok']] }] }] },

      O.imzali(),
      O.belgeler({ tur: 'İade / değişim formu' }),
      O.ayarlar({ alanlar: [['Puan oranı %', 'Alışverişten kazanılan puan oranı.'], ['Değişim süresi (gün)', 'Bu süreden sonra değişim yönetici onayı ister.'], ['Az kalan beden sınırı', 'Bu adedin altındaki beden azalan sayılır.'], ['Satış danışmanı primi % (net satış)', 'Raporlardaki prim hesabı.'], ['Stok değişince bağlı online kanala gönder', 'Kapalıysa stok ve fiyat kanala gönderilmez.']] }),
      O.bildirimler(),
      { ...ebelge, ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. Bu programın Entegrasyonlar sayfasında e-Fatura kartı yoktur, satış ekranında fatura kesen düğme de yoktur. Burada oluşan belgeler TEST olarak görünür, GİB’e gitmez. Fatura gerekiyorsa entegratörünüzün panelini kullanın.', hatalar: [['Belge TEST olarak görünüyor.', 'Bu programda entegratör bağlantısı kurulmaz. TEST belgeler resmî belge değildir.']] },
      O.entegrasyonlar(),
    ],
    roller: 'Satış danışmanı değişim süresi geçmiş işlemde yönetici PIN’i girer. Kampanya, rapor ve yönetim sayfaları mağaza sahibine aittir.',
    musteriYok: 'Butik & Giyim programında müşterinin kendisinin açtığı bir sayfa yoktur.',
    sssHaric: ['Trendyol mağazamla stok ortak olur mu?', 'Yazarkasadan mali fiş çıkar mı?'],
    sss: [['Trendyol mağazamla stok ortak olur mu?', 'Pazaryerleri bağlantısını kurup modelde **Online / pazaryerinde sat** kutusunu işaretlerseniz stok ve fiyat Trendyol veya n11 hesabınıza gönderilir. Sipariş bu programa gelmez.'], ['Yazarkasadan mali fiş çıkar mı?', 'Kasadan çıkan fiş bilgi fişidir, mali fişi cihazınızdan ayrıca kesersiniz.']],
    yazdirma: { ne: 'Fiş ve belgeler tarayıcının yazdırma penceresiyle basılır.', belgeler: [['Satış fişi', 'Satış tamamlanınca fiş penceresi.'], ['Değişim fişi', 'Değişim tamamlanınca açılır.'], ['Hediye çeki', '**Hediye çeki sat** sonrası.'], ['Etiket', '**Etiket Basımı** sayfasında **Seçilenleri yazdır**.'], ['Gün sonu raporu', '**Raporlar** sayfasında **Gün sonu raporu yazdır**.'], ['İade ve tadilat formları', '**İmzalı belgeler** sayfası.']] },
    entegrasyon: {
      sms: { degisir: ['**Entegre et** ile sağlayıcıyı seçip bilgileri girersiniz. **Bağlantıyı dene** hesap bakiyesini okur, ileti göndermez. **Bağlı** yazısı görünmeden SMS gönderilmez.', '**Müşteriler** sayfasındaki **SMS gönder** ve bekleyen beden için haber verme gerçek SMS gönderir.', 'Yalnız SMS izni olan müşteriye gönderilir. Bağlantı yokken mesaj TEST olarak kaydedilir, müşteriye gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Bilgileri değiştirdiyseniz **Bağlantıyı dene** adımını yineleyin.'] },
      pazaryeri: { kapali: { hepsiburada: 1, amazon: 1, idefix: 1 }, degisir: ['Trendyol ve n11 için stok ve fiyat gönderimi yapılır. Modelde **Online / pazaryerinde sat** işaretli olmalı, **Ayarlar** sayfasındaki **Stok değişince bağlı online kanala gönder** açık olmalıdır.', 'Satış, iade, değişim, mal kabul ve kampanya sonrası stok ve fiyat gönderilir. Sonuç **Ürünler & Stok** sayfasındaki şeritte **Son durum** olarak görünür.', 'Trendyol’da test ortamı işaretliyse gönderim test ortamına gider. n11’de test ortamı yoktur, işaretliyken gönderim yapılmaz.', 'Diğer kanallar bu programda stok göndermez, şerit **TEST** gösterir. Bu program pazaryerinden sipariş çekmez, sipariş için Pazaryeri veya E-ticaret programını kullanın.', 'Çiçeksepeti ve Pazarama NEBSOFT ile iletişime geçerek açtırılır.'], sorun: ['**Online stok gönderilemedi** uyarısında API bilgilerini ve satıcı numarasını kontrol edin.', 'Gönderim gitmiyorsa şeritte **Bağlı kanal yok** yazıp yazmadığına bakın.'] },
      printer: { degisir: ['Bu programda fiş, değişim fişi ve gün sonu raporu tarayıcının yazdırma penceresiyle basılır. Yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını sınamanızı sağlar, kasadaki fişi doğrudan yazıcıya yöneltmez.'], sorun: ['Fiş dar çıkıyorsa yazdırma penceresinde kâğıt boyunu seçin.'] },
      label: { degisir: ['**Etiket Basımı** sayfasında **Çıktı** seçeneği **A4 sayfa** veya **Etiket yazıcısı** olur. İkisi de tarayıcının yazdırma penceresinden basılır.', 'Etiket yazıcısı seçilince sayfa etiket boyunda hazırlanır.'], sorun: ['Etiket kaymışsa şablondaki **En (mm)** ve **Boy (mm)** değerlerini etiketinize göre düzeltin.'] },
      barcode: { degisir: ['USB ve Bluetooth okuyucular ek kurulumsuz çalışır. **Satış** ve **Değişim & İade** kutularına okutulan kod klavyeden yazılmış gibi gelir.', '**Etiket Basımı** ve **Yeni model** penceresinde **Kamerayla okut** telefon kamerasıyla okur.'], sorun: ['Okutunca işlem başlamıyorsa okuyucunun sonekini Enter yapın ve imlecin kutuda olduğunu kontrol edin.'] },
      pos: { degisir: ['Bu programda **Kredi kartı** ödemesi tutarı POS cihazına göndermez. Çekimi cihazdan yaparsınız, program ödemeyi kaydeder.'], sorun: ['Cihazdan çekim yapmadan satışı tamamlamayın.'] },
      backup: O.E.backup(),
    },
  };
};
