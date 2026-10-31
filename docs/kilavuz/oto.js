// Oto Yıkama & Otopark kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js oto
module.exports = (O) => {
  const ayar = O.ayarlar({ alanlar: [['Kapasite (araç)', 'Doluluk oranı ve dolu uyarısı bu sayıyla hesaplanır.'], ['Ücretsiz süre (dk)', 'Bu sürede çıkan araçtan ücret alınmaz.'], ['İlk saat (₺)', 'İlk saatin ücreti.'], ['Sonraki her saat (₺)', 'Sonraki her saatin ücreti.'], ['Günlük en fazla (₺)', 'Bir günde alınacak en yüksek ücret.'], ['Kayıp fiş ücreti (₺, yoksa 0)', 'Çıkış penceresinde **Kayıp fiş** seçilince eklenir.'], ['Oto kuaför modülü', 'Açıp sayfayı yenileyince **Oto Kuaför** menüsü çıkar.'], ['Vale modülü', 'Açıp sayfayı yenileyince **Vale** menüsü çıkar.'], ['Vale hizmet bedeli (₺)', 'Vale fişinde kullanılan ücret.'], ['Vale/garaj sigorta poliçesi bitişi', 'Vale sayfasındaki kontrol uyarısında kullanılır.'], ['Üçüncü şahıs mali mesuliyet poliçesi bitişi', 'Vale sayfasındaki kontrol uyarısında kullanılır.']] });
  ayar.gorevler = [...ayar.gorevler,
    { baslik: 'Oto Kuaför modülü', ne: 'Bu modül varsayılan olarak kapalıdır. **Ek modüller (açınca sayfayı yenileyin)** bölümünden **Oto kuaför modülü** kutusunu işaretleyin, kaydedin ve sayfayı yenileyin. Detaylı temizlik, pasta cila ve kaplama işleri **Kabul**, **İşlemde**, **Kalite kontrol** ve **Hazır** sütunlarında izlenir.', sahneler: [
      { git: 'kuafor', kirp: 'ana', adimlar: [['**İş kartı** yeni iş açar. **Bakımı gelen** kutusu bakım hatırlatması gelen araçları sayar.', '#nj']] },
      { git: 'kuafor', once: [['tikla', '#nj']], kirp: 'pencere', boy: 1000, adimlar: [['**Plaka**, **Araç sahibi** ve **Marka / model** bilgilerini girin.', '.field@Araç sahibi'], ['**Söz verilen tarih**, **Garanti (ay, yoksa 0)** ve **Bakım hatırlatma (ay, yoksa 0)** alanlarını doldurun.', '.field@Söz verilen tarih'], ['**Hizmetler** listesinden yapılacak işleri işaretleyip **Devam** düğmesine basın.', 'button@Devam']] }] },
    { baslik: 'Vale modülü', ne: 'Bu modül varsayılan olarak kapalıdır. **Vale modülü** kutusunu işaretleyip kaydedin ve sayfayı yenileyin. **Fiş kes** ile araç teslim fişi oluşur, anahtar ve park yeri izlenir, iade fişteki kodla yapılır. **Görevliler** sayfasına MYK belge ve sürücü belgesi bilgilerini yazın.', sahneler: [
      { git: 'vale', kirp: 'ana', adimlar: [['**Fiş kes** yeni araç teslim fişi açar. Önce **Görevliler** sayfasından görevli ekleyin.', '#nv'], ['**Görevliler** vale görevlilerinin kaydını açar.', 'a@Görevliler']] }] }];
  ayar.hatalar = [...ayar.hatalar, ['Önce vale görevlisi ekleyin uyarısı çıkıyor.', '**Vale** sayfasındaki **Görevliler** düğmesiyle görevli kaydedin.'], ['Bu plaka zaten valede uyarısı çıkıyor.', 'Araç için açık fiş vardır. Listeden iade edin.']];
  return {
    ne: 'Oto Yıkama & Otopark programı, plakayla giriş ve çıkış yapar, otopark ücretini hesaplar, yıkama kuyruğunu yürütür, aboneleri izler ve gün sonu raporu verir. Müşteri fişteki kodla aracının durumunu telefonundan görür. İsteğe bağlı olarak oto kuaför ve vale modülleri açılır.',
    kimler: 'Oto yıkama, otopark, kapalı garaj ve detaylı temizlik işletmeleri. Tek gişeli yerde de, gişe görevlisi ve yıkamacıları olan yerde de kullanılır.',
    ilkNot: 'İlk araçtan önce **Ayarlar & Tarife** sayfasına kapasiteyi ve otopark ücretlerini yazın. Ücret bu değerlerden hesaplanır.',
    ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

    moduller: [
      { id: 'ozet', ne: 'Doluluğu, bugünkü ciroyu, kuyruktaki aracı, 14 günlük ciroyu ve yıkamacı performansını gösterir. Yıkamacı rolü bu sayfayı görmez.',
        gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['**Doluluk**, **Bugünkü ciro** ve **Kuyrukta** kutuları anlık durumu verir.', '.kpi'], ['**Müşteri sayfası** müşterinin gördüğü sayfayı açar.', 'a@Müşteri sayfası'], ['**Giriş / çıkış** gişe ekranına götürür.', 'a@Giriş / çıkış']] }] }] },

      { id: 'gise', ne: 'Gişenin çalıştığı ekrandır. Plakayı yazınca araç içerideyse çıkış, değilse giriş açılır. Tarife özeti ekranda yazar. Yıkamacı rolü bu sayfayı görmez.',
        gorevler: [
          { baslik: 'Giriş ve çıkış yapma', sahneler: [
            { git: 'gise', kirp: 'ana', boy: 900, adimlar: [['Plakayı yazın, **Devam (Enter)** düğmesine basın.', '#pl'], ['**Kamera** plaka okuma bağlantısı içindir. Bağlı değilse plakayı elle yazın.', '#cam'], ['**Bariyer** bariyer bağlantısı içindir ve işlemi kayda yazar.', '#bar'], ['**İçerideki araçlar** listesinde plaka arayın. Satırdaki **Çıkış** düğmesi ödeme penceresini açar.', '#iq']] },
            { git: 'gise', once: [['tikla', 'button@Çıkış']], kirp: 'pencere', adimlar: [['**Ödeme** türünü seçin. **İndirim (₺)** varsa yazın. Ayarlarda kayıp fiş ücreti tanımlıysa burada kayıp fiş kutusu da çıkar.', '.field@Ödeme'], ['**Tahsil et** düğmesine basın. Araçta yıkama varsa tutara eklenir.', 'button@Tahsil et']] }] }],
        alanlar: [['Yıkama hizmeti', 'Girişte seçilirse iş **Yıkama Kuyruğu** sayfasına düşer.'], ['Telefon (yıkama hazır olunca haber verilir)', 'Yıkama bitince mesaj bu numaraya gönderilmek istenir.'], ['Not (hasar, eşya...)', 'Araçtaki hasar veya bırakılan eşya notu.']],
        hatalar: [['Plaka girin uyarısı çıkıyor.', 'Plaka kutusunu doldurun.'], ['Otopark dolu görünüyor sorusu çıkıyor.', '**Kapasite (araç)** değeri doludur. Yerinde boş alan varsa devam edin veya kapasiteyi düzeltin.'], ['Kameradan plaka okunamadı uyarısı çıkıyor.', 'Plakayı elle yazın.'], ['Kart ödemesi alınamadı uyarısı çıkıyor.', 'POS bağlantısını kontrol edin veya ödemeyi **Nakit** seçerek kaydedin.']] },

      { id: 'yikama', ne: 'Yıkama işlerini **Sırada**, **Yıkanıyor** ve **Hazır** sütunlarında gösterir. Kartlardaki düğmelerle iş ilerler.',
        gorevler: [{ baslik: 'Yıkama işini yürütme', sahneler: [
          { git: 'yikama', kirp: 'ana', boy: 900, adimlar: [['**Yıkama ekle (otoparksız)** otoparka girmeyen araç için iş açar.', '#nj'], ['**Başla** yıkamacı seçtirip işi başlatır.', 'button@Başla'], ['**Bitti** aracı **Hazır** sütununa alır.', 'button@Bitti'], ['**Teslim et** ödeme penceresini açar.', 'button@Teslim et']] },
          { git: 'yikama', once: [['tikla', '#nj']], kirp: 'pencere', adimlar: [['**Plaka** ve **Hizmet** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['En az bir hizmet seçin uyarısı çıkıyor.', 'Hizmet listesinden seçim yapın.'], ['Bitmemiş yıkama sorusu çıkıyor.', 'Araç çıkıyor ama iş bitmemiştir. Yıkamayı bitirin veya iptal edin.'], ['Hizmet ücreti görünmüyor.', 'Fiyatlar **Hizmet & Fiyatlar** sayfasından gelir.']] },

      { id: 'gecmis', ne: 'Plakaya göre tüm otopark ve yıkama kayıtlarını gösterir.',
        gorevler: [{ baslik: 'Plaka sorgulama', sahneler: [{ git: 'gecmis', kirp: 'ana', adimlar: [['Plakayı yazın. Sonuç kutunun altında listelenir.', '#q']] }] }] },

      { id: 'abonelik', ne: 'Aylık otopark ve yıkama paketi abonelerini tutar. Abonenin plakası gişede tanınır. Yıkamacı rolü bu sayfayı görmez.',
        gorevler: [{ baslik: 'Abone yönetme', sahneler: [
          { git: 'abonelik', kirp: 'ana', adimlar: [['**Yeni abone** kayıt açar.', 'button@Yeni abone'], ['**7 gün içinde bitecek** ve **Süresi biten** süzgeçleri yenilenecekleri ayırır.', 'button@7 gün içinde bitecek'], ['**1 ay uzat + tahsil et** süreyi uzatır ve parayı kasaya yazar.', 'button@1 ay uzat + tahsil et'], ['**Bitiş hatırlatması gönder** aboneye hazır mesaj gönderir. **Tahsilat geçmişi** ödemeleri listeler.', 'button@Bitiş hatırlatması gönder']] },
          { git: 'abonelik', once: [['tikla', 'button@Yeni abone']], kirp: 'pencere', boy: 900, adimlar: [['**Plaka** ve **Ad soyad** yazın.', '.field@Plaka'], ['**Plan** seçin: **Aylık otopark** veya **Aylık 4 yıkama**.', '.field@Plan'], ['**Başlangıç**, **Bitiş**, **Ücret** ve **Kalan yıkama** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
        hatalar: [['Abonenin telefonu yok uyarısı çıkıyor.', 'Abone kaydına telefon ekleyin.']] },

      { id: 'kasa', ne: 'Seçilen günün tahsilatlarını nakit ve kart olarak toplar ve gün sonu raporu verir. Yıkamacı rolü bu sayfayı görmez.',
        gorevler: [{ baslik: 'Gün sonu alma', sahneler: [{ git: 'kasa', kirp: 'ana', adimlar: [['**Toplam**, **Nakit**, **Kart** ve **İşlem** kutuları seçili günü özetler.', '.kpi'], ['Tarih kutusundan gün seçin.', '#dd'], ['**Gün sonu raporu** raporu yazdırır.', '#z']] }] }] },

      { id: 'hizmetler', ne: 'Yıkama hizmetlerini, süresini, fiyatını ve kart rengini tutar. **30 gün adet** sütunu hizmetin ne kadar yapıldığını gösterir.',
        gorevler: [{ baslik: 'Hizmet ekleme', sahneler: [
          { git: 'hizmetler', kirp: 'ana', adimlar: [['**Yeni hizmet** düğmesine basın.', 'button@Yeni hizmet']] },
          { git: 'hizmetler', once: [['tikla', 'button@Yeni hizmet']], kirp: 'pencere', adimlar: [['**Hizmet**, **Fiyat**, **Süre (dk)** ve **Renk** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

      O.imzali(),
      O.belgeler({ tur: 'Araç kabul / teslim tutanağı' }),
      ayar,
      O.bildirimler(),
      O.entegrasyonlar(),
    ],

    roller: 'Yıkamacı rolü yalnız **Yıkama Kuyruğu** ve **Araç Geçmişi** ile temel sayfaları görür. Gişe rolü operasyon sayfalarında çalışır. Tarife ve kullanıcılar yöneticiye aittir.',
    musteri: [{ ad: 'Aracım nerede sayfası', ne: 'Müşteri plakasını ve fişteki takip kodunu yazarak yıkamadaki sırasını, tahmini hazır olma saatini ve otopark ücretini görür. Üyelik gerekmez. Yalnız plakayla sorgu yapılmaz, kod da gerekir. Sayfanın adresini **Özet** sayfasındaki **Müşteri sayfası** düğmesiyle açarsınız.',
      sahneler: [{ adres: 'arac.html', ilk: 800, kirp: 'tam', adimlar: [['Müşteri plakayı bu kutuya yazar.', '#k'], ['Fişteki kodu yazar, **Sorgula** düğmesine basar.', '#kc']] }] }],
    yazdirma: { ne: 'Fişler işlem ekranından yazdırılır. Fiş yazıcısı bağlıysa fiş doğrudan yazıcıya gider, bağlı değilse tarayıcının yazdırma penceresi açılır.', belgeler: [['Giriş fişi', '**Giriş / Çıkış** sayfasında giriş yapılınca.'], ['Gün sonu raporu', '**Kasa & Gün Sonu** sayfasında **Gün sonu raporu**.'], ['Araç kabul / teslim tutanağı', '**İmzalı belgeler** sayfası.'], ['Oto kuaför iş kartı', '**Oto Kuaför** modülü açıkken iş kartından.'], ['Araç teslim fişi', '**Vale** modülü açıkken **Fiş kes** ile.']] },

    entegrasyon: {
      anpr: { kapali: { '*': 'NEBSOFT ile iletişime geçerek açtırılır.' }, degisir: ['Plaka tanıma kamerası ve bariyer bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar plakayı elle yazarsınız. **Kamera** düğmesi plaka okumaz, **Bariyer** düğmesi bariyere komut göndermez.'], sorun: ['Kamera uyarısı çıkarsa plakayı elle yazıp işleme devam edin.'] },
      okc: { kapali: { '*': 'NEBSOFT ile iletişime geçerek açtırılır.' }, degisir: ['Yazarkasa bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Bağlantı olmadan program mali fiş kesmez.', 'Mali fişi yazarkasanızdan kesin.'], sorun: ['Bu bağlantı üretici anlaşması ve cihaz gerektirir.'] },
      printer: { degisir: ['Tarayıcı modunda fiş yazdırma penceresiyle basılır. USB, seri veya ağ yazıcısı seçilirse giriş fişi ve gün sonu doğrudan yazıcıya gider.', 'Nakit tahsilatta para çekmecesi yazıcı üzerinden açılır.'], sorun: ['Ağ yazıcısında IP adresini ve 9100 portunu kontrol edin.', 'Yazıcı yanıt vermezse tarayıcı moduna dönüp işe devam edin.'] },
      pos: { degisir: ['Kart seçilen tahsilatlarda tutar POS bağlantısına gönderilir. Otopark çıkışı, yıkama teslimi ve abonelik uzatma bu yolu kullanır.', 'Elle modda cihazdan ayrıca çekim yaparsınız, program yalnız kaydeder.'], sorun: ['Kart ödemesi alınamadı uyarısında çekimi cihazdan kontrol edin, aynı tutarı yeniden göndermeden önce doğrulayın.'] },
      backup: O.E.backup(),
    },
  };
};
