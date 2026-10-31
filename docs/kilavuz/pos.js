// Market POS kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js pos
module.exports = (O) => ({
  ne: 'Market POS, barkodlu satış, stok, veresiye ve kasa işlerini tek programda toplar. Kasiyer ürünü okutup ödemeyi alır, program stoktan düşer, fişi yazdırır ve gün sonunda kasayı karşılaştırır.',
  kimler: 'Market, bakkal, tekel, büfe ve benzeri perakende işletmeler. Tek kasalı dükkânda da, kasiyer ve depo sorumlusu olan yerde de kullanılır.',
  ilkNot: 'USB barkod okuyucu klavye gibi çalışır, satış ekranında ek sürücü kurmadan kullanılır.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'satis', ne: 'Kasiyerin gün boyu çalıştığı ekrandır. Ürün okutulur, sepet oluşur, ödeme alınır. Klavye kısayolları düğmelerin üzerinde yazar.',
      gorevler: [
        { baslik: 'Barkodla satış yapma', sahneler: [
          { git: 'satis', kirp: 'tam', adimlar: [['Barkodu okutun. İmleç kutuda durur, okuyucu ürünü sepete ekler. Elle barkod yazıp Enter’a da basabilirsiniz.', '#scan'], ['Barkodu olmayan ürün için hızlı düğmelerden seçin.', '#quick'], ['Listede olmayan bir kalem için **Serbest** düğmesiyle açıklama ve fiyat girin.', '#manual']] },
          { git: 'satis', once: [['tikla', 'button@Tam Yağlı Süt'], ['tikla', 'button@Ekmek 250g']], kirp: 'tam', adimlar: [['Sepetteki kalemler sağda görünür.', '#cart'], ['Tam nakit için **Nakit F2** düğmesine basın.', 'button@Nakit F2'], ['Kartla ödeme için **Kart F3** düğmesine basın.', 'button@Kart F3'], ['Parçalı ödeme, veresiye, havale veya yemek kartı için **Diğer / Parçalı F4** düğmesini kullanın.', 'button@Diğer / Parçalı F4']] },
          { git: 'satis', once: [['tikla', 'button@Tam Yağlı Süt'], ['tikla', 'button@Nakit F2']], kirp: 'pencere', adimlar: [['Satış tamamlanınca fişi **Fiş yazdır** ile basın.', 'button@Fiş yazdır'], ['Müşteri fatura isterse **Fatura kes (e-Arşiv/e-Fatura)** düğmesini kullanın.', 'button@Fatura kes'], ['Sıradaki müşteri için **Yeni satış (Enter)** düğmesine basın.', 'button@Yeni satış']] }] },
        { baslik: 'Parçalı ödeme ve veresiye', ne: 'Veresiye için önce müşteri seçilmelidir.', sahneler: [
          { git: 'satis', once: [['tikla', 'button@Tam Yağlı Süt'], ['tikla', 'button@Diğer / Parçalı F4']], kirp: 'pencere', adimlar: [['**Tutar** alanına alınan parayı yazın veya hızlı tutarlardan seçin.', '.field@Tutar'], ['Ödeme türüne basın. Kalan tutar için aynı işlemi başka türle yineleyin.', 'button@Kredi Kartı']] },
          { git: 'satis', once: [['tikla', 'button@Tam Yağlı Süt'], ['tikla', 'button@Seç (F6)']], kirp: 'pencere', boy: 900, adimlar: [['Müşteriyi listeden seçin veya **Yeni müşteri** ile ekleyin.', 'button@Yeni müşteri']] }] },
        { baslik: 'İndirim, kupon, bekletme ve iade', sahneler: [
          { git: 'satis', once: [['tikla', 'button@Tam Yağlı Süt']], kirp: 'tam', adimlar: [['**İndirim** sepete tutar veya yüzde indirim uygular. Kasiyerin sınırını **Ayarlar** belirler, üstü yetkili onayı ister.', 'button@İndirim'], ['**Kupon** kampanyalarda tanımlı kodu uygular.', 'button@Kupon'], ['**Beklet** sepeti kenara alır, sıradaki müşteriye geçersiniz.', 'button@Beklet'], ['**İade** fişsiz iade kipini açar, yetkili onayı ister. Fişli iade **Satış Geçmişi** sayfasından yapılır.', 'button@İade']] }] }],
      hatalar: [['Ürün bulunamadı uyarısı çıkıyor.', 'Barkod kayıtlı değildir. **Ürünler** sayfasından ekleyin veya **Serbest** ile satın.'], ['Stok yetersiz uyarısı çıkıyor.', 'Stok sıfırın altına düşecektir. Alış faturasıyla stok girin veya **Ayarlar** sayfasındaki **Eksi stokla satışa izin ver** seçeneğini açın.'], ['Müşterinin veresiye limiti aşılıyor uyarısı çıkıyor.', 'Müşteri kartındaki **Veresiye limiti (₺)** alanını artırın veya önce tahsilat yapın.'], ['Geçersiz kupon uyarısı çıkıyor.', 'Kodun **Kampanyalar** sayfasında tanımlı ve aktif olduğunu kontrol edin.'], ['ÖKC mali fiş kesilemedi uyarısı çıkıyor.', 'Yazarkasa bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Açılana kadar mali fişi yazarkasanızdan kesin.']] },

    { id: 'ozet', ne: 'Günün cirosunu, fiş sayısını, ortalama sepeti, brüt kârı ve kritik stoğu gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Günlük durumu okuma', sahneler: [{ git: 'ozet', boy: 900, adimlar: [['Üstteki kutular bugünün özetidir: **Bugünkü ciro**, **Bugünkü fiş**, **Ort. sepet**, **Bugünkü brüt kâr**.', '.kpi'], ['Azalan ürünler için **Kritik stok** kutusuna bakın.', '.kpi@Kritik stok'], ['Kasaya dönmek için **Satış ekranı** düğmesini kullanın.', 'a@Satış ekranı']] }] }] },

    { id: 'satislar', ne: 'Tüm fişleri ve iadeleri listeler. Fişi yeniden yazdırma, fişli iade ve fatura kesme buradan yapılır.',
      gorevler: [{ baslik: 'Fiş bulma ve iade alma', sahneler: [{ git: 'satislar', adimlar: [['Dönemi **Bugün**, **7 gün**, **30 gün** veya **Tümü** ile seçin.', 'button@7 gün'], ['Arama kutusuna fiş numarası veya müşteri yazın.', '#q'], ['Listeyi dosyaya almak için **Dışa aktar** düğmesini kullanın.', '#exp'], ['Fişi açmak için satıra tıklayın. Açılan pencerede **İade al** ve fatura seçenekleri bulunur.', '#tbl tbody tr']] }] }] },

    { id: 'kasa', ne: 'Vardiya açılışını, nakit ve kart satışlarını, kasaya giren çıkan parayı ve gün sonu raporunu yönetir.',
      gorevler: [
        { baslik: 'Kasaya para girme ve çıkarma', sahneler: [
          { git: 'kasa', adimlar: [['Bozuk para eklemek için **Kasaya para gir** düğmesine basın.', '#cin'], ['Gider veya bankaya yatırma için **Kasadan para çık** düğmesini kullanın.', '#cout']] },
          { git: 'kasa', once: [['tikla', '#cin']], kirp: 'pencere', adimlar: [['**Tutar** ve **Açıklama** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Gün sonu alma', sahneler: [
          { git: 'kasa', once: [['tikla', '#close']], kirp: 'pencere', adimlar: [['Kasadaki parayı sayın, sayılan tutarı alana yazın. Beklenen tutar başlıkta yazar.', '.field@Kasadaki sayılan nakit'], ['**Kaydet** düğmesine basın. Fark varsa raporda görünür.', 'button@Kaydet']] }] }],
      hatalar: [['Tutar girin uyarısı çıkıyor.', 'Tutar alanı boş bırakılamaz.']] },

    { id: 'hizli', ne: 'Hızlı ticaret kanallarının siparişlerini kabul etme, toplama ve kuryeye teslim ekranıdır. Kanalların canlı bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Açılana kadar ekran demo olarak çalışır, sipariş kanaldan gelmez.',
      gorevler: [{ baslik: 'Sipariş panosunu tanıma', sahneler: [{ git: 'hizli', adimlar: [['**Sipariş panosu** bekleyen siparişleri gösterir.', 'button@Sipariş panosu'], ['**Kanallar** bölümünde her kanalın durumu ve ayarı bulunur.', 'button@Kanallar'], ['Ekrandaki sarı uyarı simülasyon modunda olduğunuzu gösterir.', '.card@Demo / simülasyon']] }] }],
      not: 'Getir Çarşı, Yemeksepeti Market ve Trendyol Go bağlantısı için destek ekibimizle görüşün.' },

    { id: 'urunler', ne: 'Ürün kartlarını, fiyatları ve stok seviyelerini yönetir. Kasiyer bu sayfayı görmez.',
      gorevler: [
        { baslik: 'Yeni ürün ekleme', sahneler: [
          { git: 'urunler', adimlar: [['**Yeni ürün** düğmesine basın.', '#add'], ['Ürün barkodunu kamerayla okuyarak eklemek için **Okutarak ekle** düğmesini kullanın.', '#camadd'], ['Toplu seçim için **Hazır katalogdan ekle** düğmesi vardır. Katalog oturum açmış işletmelere açıktır, demoda boş görünür.', '#kat']] },
          { git: 'urunler', once: [['tikla', '#add']], kirp: 'pencere', boy: 900, adimlar: [['**Ürün adı** yazın.', '.field@Ürün adı'], ['**Barkod** okutun veya yazın. Boş bırakırsanız program üretir.', '.field@Barkod'], ['**Satış fiyatı (₺, KDV dahil)** alanını doldurun.', '.field@Satış fiyatı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Toplu fiyat değiştirme', sahneler: [
          { git: 'urunler', once: [['tikla', '#bulk']], kirp: 'pencere', adimlar: [['**Kategori** seçin.', '.field@Kategori'], ['**Değişim (%)** alanına zam için pozitif, indirim için negatif oran yazın.', '.field@Değişim'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Dosyadan ürün alma', ne: '**İçe aktar** CSV dosyası kabul eder. Sütunlar: Barkod;Ürün;Kategori;Alış;Satış;KDV;Stok;Birim. Mevcut barkodlar güncellenir, yeniler eklenir.', sahneler: [{ git: 'urunler', adimlar: [['**İçe aktar** düğmesine basın, dosyayı seçin.', '#imp'], ['Listeyi dosyaya almak için **Dışa aktar** düğmesini kullanın.', '#exp'], ['**Kritik** ve **Eksi** süzgeçleri azalan ve eksiye düşen ürünleri gösterir.', 'button@Kritik']] }] }],
      alanlar: [['Alış fiyatı (₺)', 'Kâr hesabında kullanılır.'], ['KDV %', 'Ürünün KDV oranı.'], ['Birim', 'Adet veya tartılı ürün için kilogram gibi satış birimi.'], ['Stok', 'Eldeki miktar.'], ['Kritik stok seviyesi', 'Bu miktarın altına düşünce ürün kritik stokta görünür.'], ['Terazi PLU kodu (5 hane)', 'Terazi etiketindeki ürün kodu.'], ['Raf / Reyon', 'Ürünün yeri.'], ['Hızlı satış ekranında göster', 'Ürün satış ekranındaki hızlı düğmelerde çıkar.']],
      hatalar: [['Bu barkod başka üründe kayıtlı uyarısı çıkıyor.', 'Aynı barkod iki üründe olamaz. Uyarıda yazan ürünü açın.'], ['Üründe satış fiyatı eksik uyarısı çıkıyor.', 'Dosyadaki satış fiyatı sütununu doldurun.']] },

    { id: 'kategoriler', ne: 'Ürün gruplarını tanımlar. Satış ekranındaki kategori düğmeleri buradan gelir.',
      gorevler: [{ baslik: 'Kategori ekleme', sahneler: [{ git: 'kategoriler', adimlar: [['**Yeni kategori** düğmesine basın, adı ve rengi girin.', 'button@Yeni kategori']] }] }] },

    { id: 'stok', ne: 'Kritik stokları, stok hareketlerini, sayımları ve sipariş önerisini gösterir.',
      gorevler: [{ baslik: 'Stok sayımı yapma', sahneler: [
        { git: 'stok', kirp: 'ana', adimlar: [['**Kritik stok**, **Hareketler**, **Sayımlar** ve **Sipariş önerisi** sekmeleri arasında geçin.', 'button@Hareketler'], ['Sayım için **Yeni sayım başlat** düğmesine basın.', '#count']] },
        { git: 'stok', once: [['tikla', '#count']], kirp: 'pencere', adimlar: [['Ürünü okutun, sayılan miktarı yazın, sıradakine geçin. Kamerayla okumak için **Kamerayla okut** düğmesi vardır.', 'button@Kamerayla okut'], ['Bitince **Sayımı bitir** düğmesine basın. Yarıda bırakmak için **Taslak olarak kapat** düğmesini kullanın.', 'button@Sayımı bitir']] }] }],
      hatalar: [['Henüz sayılan ürün yok uyarısı çıkıyor.', 'Sayımı bitirmeden önce en az bir ürün sayın.'], ['Geçerli bir miktar girin uyarısı çıkıyor.', 'Miktar alanına sayı yazın.']] },

    { id: 'alis', ne: 'Tedarikçiden gelen malı kaydeder. Stok ve maliyet otomatik güncellenir.',
      gorevler: [{ baslik: 'Alış faturası girme', sahneler: [
        { git: 'alis', adimlar: [['**Yeni alış faturası** düğmesine basın.', '#add']] },
        { git: 'alis', once: [['tikla', '#add']], kirp: 'pencere', adimlar: [['**Tedarikçi** seçin, **Fatura no** yazın.', '.field@Tedarikçi'], ['Ürünleri ekleyin, miktar ve fiyatı girin.', null], ['Ödediğiniz kısmı **Ödenen tutar (₺)** alanına yazın. Kalan tedarikçi borcuna eklenir.', '.field@Ödenen tutar'], ['**Faturayı kaydet** düğmesine basın.', 'button@Faturayı kaydet']] }] }],
      alanlar: [['Alış fiyatlarını güncelle', 'Açıksa ürün kartındaki alış fiyatı bu faturadaki fiyatla değişir.']],
      hatalar: [['Ürün ekleyin uyarısı çıkıyor.', 'Faturaya en az bir ürün ekleyin.']] },

    { id: 'etiket', ne: 'Raf, barkod ve fiyat etiketlerini kendi şablonunuzla basarsınız.',
      gorevler: [{ baslik: 'Etiket basma', sahneler: [{ git: 'etiket', boy: 900, kirp: 'ana', adimlar: [['Fiyatı değişen ürünleri bulmak için **Fiyatı değişenler** düğmesini kullanın.', '#chg'], ['Ürünleri listeden seçin, **Adet** yazın. **Okutarak seç** ile barkoddan da seçebilirsiniz.', '#cam'], ['**Şablon** seçin.', '#tp'], ['**Seçilenleri yazdır** düğmesine basın.', '#pr']] }] },
        { baslik: 'Etiket şablonu düzenleme', sahneler: [{ git: 'etiket', once: [['tikla', '#ed']], kirp: 'pencere', boy: 1250, adimlar: [['Şablon seçin veya **Yeni** ile oluşturun. **En (mm)** ve **Boy (mm)** alanlarını etiketinize göre yazın.', '.field@En (mm)'], ['Soldaki öğelerden ekleyin, **Şablonu kaydet** düğmesine basın.', 'button@Şablonu kaydet']] }] }] },

    { id: 'musteriler', ne: 'Müşteri kartlarını, veresiye borçlarını ve puanları tutar.',
      gorevler: [
        { baslik: 'Müşteri ekleme', sahneler: [{ git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın.', '.field@Ad soyad'], ['Veresiye verecekseniz **Veresiye limiti (₺)** alanını doldurun.', '.field@Veresiye limiti'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Veresiye tahsilatı', sahneler: [
          { git: 'musteriler', adimlar: [['Borcu olanları görmek için **Borçlu** süzgecini seçin.', 'button@Borçlu'], ['Satırdaki **Tahsilat** düğmesine basın. **Ekstre** müşterinin hareketlerini gösterir.', 'button@Tahsilat']] },
          { git: 'musteriler', once: [['tikla', 'button@Tahsilat']], kirp: 'pencere', adimlar: [['**Tutar (₺)** ve **Ödeme şekli** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'tedarikciler', ne: 'Tedarikçi cari hesaplarını ve yaptığınız ödemeleri tutar. **Borcumuz** sütunu alış faturalarından oluşur.',
      gorevler: [{ baslik: 'Tedarikçiye ödeme', sahneler: [
        { git: 'tedarikciler', adimlar: [['Yeni firma için **Yeni tedarikçi** düğmesini kullanın.', 'button@Yeni tedarikçi'], ['Satırdaki **Ödeme yap** düğmesine basın.', 'button@Ödeme yap']] },
        { git: 'tedarikciler', once: [['tikla', 'button@Ödeme yap']], kirp: 'pencere', adimlar: [['**Tutar** yazın, **Şekil** seçin. **Kasadan nakit** seçilirse tutar kasadan düşer.', '.field@Şekil']] }] }] },

    { id: 'kampanyalar', ne: 'X al Y öde, kategori indirimi ve kupon kodlarını tanımlar. Aktif kampanyalar satış ekranında uygulanır.',
      gorevler: [{ baslik: 'Kampanya tanımlama', sahneler: [{ git: 'kampanyalar', once: [['tikla', 'button@Yeni kampanya']], kirp: 'pencere', boy: 900, adimlar: [['**Kampanya adı** yazın.', '.field@Kampanya adı'], ['**Tür** seçin. Türe göre aşağıdaki ilgili alanları doldurun.', '.field@Tür'], ['**Aktif** işaretli değilse kampanya uygulanmaz.', '.field@Aktif'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Ürün (X al Y öde için)', 'Kampanyanın geçerli olduğu ürün.'], ['Kategori (% indirim için)', 'İndirimin geçerli olduğu kategori.'], ['X (al)', 'Alınması gereken adet.'], ['Y (öde)', 'Ödenecek adet.'], ['İndirim %', 'Yüzde indirim oranı.'], ['Kupon kodu', 'Kasada yazılacak kod.']] },

    { id: 'raporlar', ne: 'Satış, kâr, kategori ve personel analizlerini gösterir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Dönem raporu alma', sahneler: [{ git: 'raporlar', adimlar: [['Dönemi **7 gün**, **30 gün** veya **90 gün** olarak seçin.', 'button@30 gün']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Veresiye / cari hesap taahhüdü' }),
    O.ayarlar({ alanlar: [['Fiş alt yazısı', 'Fişin altına basılan metin.'], ['Puan oranı (her 10₺ için puan)', 'Müşteriye yazılacak puan.'], ['Satış sonrası otomatik fiş yazdır', 'Açıksa satış bitince fiş kendiliğinden basılır.'], ['Eksi stokla satışa izin ver', 'Açıksa stok bitse de satış yapılır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'İndirim sınırının üstü, fiyat değişikliği ve iade kasiyerde yetkili onayı ister. Sınır Ayarlar sayfasındaki indirim alanından belirlenir.',
  musteriYok: 'Market POS programında müşterinin kendisinin açtığı bir sayfa yoktur.',
  sssHaric: ['Getir Çarşı ve Yemeksepeti Market siparişleri gelir mi?', 'Yazarkasa POS bağlanıyor mu?'], // katalog cevabının son cümlesi kodda doğrulanmadı, DURUM.md; aynı bilgi Online Siparişler bölümünde yazılı
  yazdirma: { ne: 'Fiş ve belgeler işlem yapılan ekrandan yazdırılır. Fiş yazıcısı Entegrasyonlar bölümünden bağlanır, bağlı değilse tarayıcının yazdırma penceresi açılır.', belgeler: [['Satış fişi', 'Satış tamamlandı penceresinde **Fiş yazdır** veya **Satış Geçmişi** sayfası.'], ['Gün sonu raporu', '**Kasa & Gün Sonu** sayfasında **Gün sonu raporu**.'], ['Raf ve barkod etiketi', '**Etiket Basımı** sayfasında **Seçilenleri yazdır**.'], ['Veresiye taahhüdü, iade formu', '**İmzalı belgeler** sayfası.']] },

  entegrasyon: {
    printer: { degisir: ['Tarayıcı modunda fiş yazdırma penceresiyle basılır. USB, seri veya ağ yazıcısı seçilirse fiş pencere açılmadan doğrudan yazıcıya gider.', 'Nakit satışta para çekmecesi yazıcı üzerinden açılır.'], sorun: ['Ağ yazıcısında IP adresini ve 9100 portunu kontrol edin.', 'Yazıcı yanıt vermezse fişi tarayıcı modunda basıp işinize devam edin.'] },
    label: { degisir: ['**Etiket Basımı** sayfasındaki **Çıktı** seçeneğinde **Etiket yazıcısı** kullanılabilir hâle gelir.'], sorun: ['Etiket kaymışsa şablondaki **En (mm)** ve **Boy (mm)** değerlerini etiketinize göre düzeltin.'] },
    scale: { degisir: ['Terazi etiketinin barkodu okutulunca ürün ve ağırlık satış ekranına gelir. Eşleşme ürün kartındaki **Terazi PLU kodu (5 hane)** ile yapılır.', 'Kasaya bağlı terazide tartılı ürün seçilince ağırlık teraziden okunur.'], sorun: ['Ürün bulunamıyorsa PLU kodunu kontrol edin.', 'Ağırlık girin uyarısında ağırlığı elle yazın.'] },
    pos: { degisir: ['Bağlı modda **Kart F3** tutarı POS cihazına gönderir, sonuç ekrana döner.', 'Elle modda cihazdan ayrıca çekim yaparsınız, program yalnız kaydeder.'], sorun: ['Cihaz yanıt vermezse çekimi cihazdan kontrol edin, aynı tutarı yeniden göndermeden önce fişi doğrulayın.'] },
    okc: { degisir: ['Yazarkasa bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Açılana kadar program mali fiş kesmez, mali fişi yazarkasanızdan kesin.'], sorun: ['Bu bağlantı üretici kütüphanesi ve yetkili servis eşleştirmesi ister. Cihaz markanızı destek ekibimize iletin.'] },
    barcode: { degisir: ['USB ve Bluetooth okuyucular ek kurulumsuz çalışır. Ayarla sonek tuşu ve kamerayla okuma belirlenir.'], sorun: ['Okutunca sepete eklenmiyorsa okuyucunun sonekini Enter yapın ve imlecin barkod kutusunda olduğunu kontrol edin.'] },
    efatura: { degisir: ['Satış tamamlandı penceresindeki **Fatura kes (e-Arşiv/e-Fatura)** belgeyi entegratöre gönderir.', 'Kesilen belgeler **e-Belgeler** sayfasında görünür. Simülasyonda belge TEST etiketlidir, GİB’e gitmez.'], sorun: ['Hata durumundaki belge için **e-Belgeler** sayfasındaki ayrıntıya bakın.'] },
    pazaryeri: { degisir: ['**Ürünler** sayfasındaki **Pazaryerine gönder** seçtiğiniz bilgiyi bağlı pazaryerine iletir. Sağlayıcı o işlemi desteklemiyorsa hata ekranda yazar.', 'Satış sonrası stok güncellemesi açıksa satılan miktar pazaryerine bildirilir.', 'Bağlantıyı dene geçmeden gönderim yapılmaz. Simülasyonda sonuç TEST görünür.', '**Online Siparişler** sayfasındaki hızlı ticaret kanalları bu bağlantıdan bağımsızdır.'], sorun: ['Barkodlar pazaryerindeki barkodlarla aynı olmalıdır.', 'Bilgileri değiştirdiyseniz yeniden Bağlantıyı dene adımını yapın.'] },
    webhook: { degisir: ['Her satış ve iade tanımladığınız adrese olay olarak gönderilir.', 'Olay imza anahtarıyla imzalanır, kendi sisteminizde doğrulayabilirsiniz.'], sorun: ['Olay gelmiyorsa hedef adresin internetten erişilebilir olduğunu kontrol edin.'] },
    backup: O.E.backup(),
  },
});
