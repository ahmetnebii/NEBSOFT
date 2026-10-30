// Terzi & Tadilat kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js terzi
// Her sahnenin adımı: [metin, seçici, 'ok']. **ad** ekrandaki veya koddaki birebir addır, üretim sırasında denetlenir.
module.exports = (O) => ({
  ne: 'Terzi & Tadilat, atölyenizdeki işleri alındığı andan teslim edilene kadar izlemenizi sağlar. Müşterinin ölçülerini tarihli saklar, prova günlerini gösterir, düğün gibi sabit tarihli işleri uyarır ve iş hazır olunca müşteriye haber verilmesine yardım eder.',
  kimler: 'Terziler, tadilat atölyeleri, gelinlik ve abiye dikimi yapan işletmeler. Tek kişilik atölyede de, birden çok ustanın çalıştığı yerde de kullanılır.',
  ilkNot: 'Ayarlar sayfasından işletme adınızı girmeden iş fişi yazdırmayın: fişin başında bu ad görünür.',
  ekrantanitim: [{ git: 'pano', kirp: 'tam', adimlar: [['Sol taraftaki menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['Üstteki **Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Atölyenin o anki durumunu tek ekranda gösterir: açık işler, ciro, tahsil edilecek tutar, bugünkü provalar, yaklaşan etkinlikler ve geciken işler. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1000, adimlar: [['**Açık iş** kutusu teslim edilmemiş işlerin sayısıdır.', '.kpi'], ['**Bugünkü prova** ve **7 gün içinde etkinlik** kutularına bakın. Etkinliği yaklaşan işler öncelikli yapılmalıdır.', '.kpi@Bugünkü prova'], ['**Geciken işler** listesinden söz verilen tarihi geçen işleri görün. Hazır bekleyen iş varsa satırdaki **Hatırlat** düğmesi müşteriye teslim hatırlatması yollar.', 'h3@Geciken işler']] }] }],
      hatalar: [['Ciro beklediğimden düşük.', 'Ciro teslim edilen işlerden hesaplanır. Teslim edilmemiş işler **Tahsil edilecek** tutarında görünür.']] },

    { id: 'pano', ne: 'İşleri durumlarına göre sütunlarda gösterir: **Alındı**, **Kesim ve dikim**, **Prova**, **Son düzeltme**, **Hazır**. Kartı sürükleyerek veya açıp durumunu değiştirerek işi ilerletirsiniz.',
      gorevler: [
        { baslik: 'Yeni iş açma', ne: 'Müşteri geldiğinde işi buradan kaydedin. Telefon numarasını yazınca kayıtlı müşteri bulunur, yoksa yeni müşteri oluşur.', sahneler: [
          { git: 'pano', adimlar: [['**Yeni iş** düğmesine basın.', '#ni']] },
          { git: 'pano', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1050, adimlar: [['Müşterinin **Telefon** numarasını ve **Müşteri adı** bilgisini yazın.', '#sp-ph'], ['Kalemleri seçin. Birden çok işlem için **Satır ekle** düğmesini kullanın.', '#sp-add'], ['**Teslim tarihi** alanını doldurun. Düğün veya nişan varsa **Düğün / nişan tarihi** alanına da yazın.', '.field@Teslim tarihi'], ['Alınan kaporayı **Kapora (₺)** alanına yazın.', '.field@Kapora'], ['**Kaydet** düğmesine basın. İş fişi yazdırma için müşteri imzası istenir.', 'button@Kaydet']] }] },
        { baslik: 'İşi ilerletme', sahneler: [{ git: 'pano', kirp: 'ana', adimlar: [['Kartı bir sonraki sütuna sürükleyin veya kartı açıp durum düğmesine basın.', '.sp-card']] }] }],
      alanlar: [['Teslim saati', 'Müşteriye söz verdiğiniz saat. Boş kalabilir.'], ['Düğün / nişan tarihi', 'Sabit tarihli işlerde girilir. Teslim tarihi bu günden sonraysa program uyarır.'], ['Usta', 'İşi yapacak kişi.'], ['Kıyafetin alındığı durum', 'Kıyafetteki leke, yırtık gibi notlar. Fişe yazılır, anlaşmazlıkta dayanak olur.'], ['Müşteriye görünen not', 'Müşteri sayfasında görünür.'], ['İç not (müşteri görmez)', 'Yalnız çalışanlar görür.'], ['İndirim (₺)', 'Toplamdan düşülür.'], ['Kapora (₺)', 'İş alınırken yapılan ödeme.'], ['Ödeme şekli', 'Kaporanın nasıl alındığı.']],
      hatalar: [['Teslim tarihi etkinlikten sonra uyarısı çıkıyor.', 'Teslim tarihini etkinlikten önceye alın. Bilerek devam edecekseniz uyarıda **Kaydet** seçin.'], ['Kapora alınmadan işe başlanmaz uyarısı çıkıyor.', '**Ayarlar** sayfasındaki **Kapora alınmadan işe başlanmasın** seçeneği açıktır. Önce tahsilat girin veya seçeneği kapatın.']] },

    { id: 'siparisler', ne: 'Tüm işlerin listesidir. Arama, durum süzgeci ve Excel’e aktarma buradadır. Bir işe girince kalemler, provalar, ödeme, fotoğraf ve geçmiş tek sayfada görünür.',
      gorevler: [
        { baslik: 'İş arama', sahneler: [{ git: 'siparisler', adimlar: [['Arama kutusuna müşteri adı, telefon veya iş numarası yazın.', '#q'], ['**Açık**, **Teslim edilen**, **İptal** veya **Tümü** ile listeyi süzün.', 'button@Teslim edilen'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesine basın.', '#ex']] }] },
        { baslik: 'İş detayında çalışma', sahneler: [
          { git: 'siparisler', once: [['tikla', 'button@Aç']], kirp: 'ana', adimlar: [['Üstteki adımlar işin nerede olduğunu gösterir.', '.sp-steps'], ['**Fiş** iş fişini, **Askı fişi** kıyafete takılan küçük fişi yazdırır.', 'button@Askı fişi'], ['**WhatsApp** müşteriye hazır mesajla sohbeti açar. **Takip** müşteri sayfasını açar ve adresini kopyalar.', 'button@WhatsApp'], ['**Düzenle** kaydı değiştirir. Tutar veya teslim tarihi değişirse **Geçmiş** bölümüne yazılır.', 'button@Düzenle']] },
          { git: 'siparisler', once: [['tikla', 'button@Aç']], kirp: 'ana', boy: 1150, adimlar: [['Prova eklemek için **Prova ekle** düğmesine basın, tarih ve saati girin.', '#pa'], ['Müşterinin ölçülerine geçmek için **Ölçüleri aç** düğmesini kullanın.', 'a@Ölçüleri aç']] }] },
        { baslik: 'Tahsilat ve teslim', ne: 'Son durumda **Teslim et** düğmesi çıkar. Kalan tutar varsa tahsilat sorulur, teslim belgesi yazdırılır ve müşteriden imza alınır. e-Fatura bağlantısı açıksa teslim penceresinde fatura seçeneği görünür.', sahneler: [{ git: 'siparisler', once: [['tikla', 'button@Aç']], kirp: 'ana', boy: 1150, adimlar: [['Ara ödemeleri **Ödeme** kartındaki **Tahsilat** düğmesiyle girin.', 'button@Tahsilat']] }] }],
      hatalar: [['Müşterinin telefonu yok uyarısı çıkıyor.', 'Müşteri kaydına telefon ekleyin. Telefonsuz müşteriye SMS gönderilmez.'], ['İade, alınan tutarı aşamaz uyarısı çıkıyor.', 'İptal penceresinde iade tutarını alınan tutar veya altı yazın.']] },

    { id: 'takvim', ne: 'Önümüzdeki 7 günün teslimlerini saate göre sıralar. Tarihi geçen işler üstte sayılır. Sabah bakıp günün sırasını belirlemek için kullanın.',
      gorevler: [{ baslik: 'Teslimleri görme', sahneler: [{ git: 'takvim', adimlar: [['İş numarasına tıklayarak işin detayına geçin.', 'table a']] }] }] },

    { id: 'olculer', ne: 'Müşteri ölçülerini tarihli saklar. Eski kayıt silinmez, son iki ölçü arasındaki fark görünür.',
      gorevler: [{ baslik: 'Yeni ölçü girme', sahneler: [
        { git: 'olculer', once: [['yaz', '#cq', 'ay']], son: 400, adimlar: [['**Müşteri ara** kutusuna ad veya telefon yazın, çıkan listeden müşteriyi seçin.', '#cq']] },
        { git: 'musteriler', once: [['tikla', 'button@Ölçüler'], ['tikla', '#yn']], kirp: 'pencere', boy: 980, adimlar: [['**Şablon** seçin. Kadın, erkek ve gelinlik şablonları hazır gelir.', '#mt'], ['Ölçüleri santim olarak yazın. Kutulardaki soluk sayı son kayıttaki ölçüdür.', '#mf'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Önce ölçü şablonu ekleyin uyarısı çıkıyor.', '**Ölçü Şablonları** sayfasından bir şablon oluşturun.'], ['En az bir ölçü girin uyarısı çıkıyor.', 'En az bir alanı doldurun.'], ['Ölçü sıfırdan büyük olmalı uyarısı çıkıyor.', 'Sıfır veya eksi değer yazmayın, boş bırakın.']] },

    { id: 'provalar', ne: 'Yaklaşan provaları tarihe göre listeler. Geçmiş provalar **Geçti** etiketiyle görünür. Prova sonucunu ve hatırlatmayı iş detayından yaparsınız.',
      gorevler: [{ baslik: 'Prova listesini izleme', sahneler: [{ git: 'provalar', adimlar: [['İşe geçmek için satırdaki iş numarasına tıklayın.', 'table a']] }] }] },

    { id: 'sablonlar', ne: 'Ölçü formlarındaki alanları belirlersiniz. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Şablon ekleme', sahneler: [
        { git: 'sablonlar', adimlar: [['**Yeni şablon** düğmesine basın.', 'button@Yeni şablon']] },
        { git: 'sablonlar', once: [['tikla', 'button@Yeni şablon']], kirp: 'pencere', adimlar: [['**Şablon adı** yazın.', '.field@Şablon adı'], ['Ölçü adlarını virgülle ayırarak **Alanlar (virgülle)** kutusuna yazın.', '.field@Alanlar'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Şablon adı', 'Ölçü girerken seçilecek ad.'], ['Alanlar (virgülle)', 'Formda çıkacak ölçüler. Örneğin Boy, Omuz, Bel.']],
      hatalar: [['Bu şablonla kayıtlı ölçü var, silinemez uyarısı çıkıyor.', 'Eski ölçüler korunduğu için şablon silinmez. Yeni şablon açıp onu kullanın.']] },

    { id: 'musteriler', ne: 'Müşteri kartlarını, iş sayısını, harcamayı ve borcu gösterir. Müşteri ilk işte kendiliğinden oluşur, buradan da eklenebilir.',
      gorevler: [{ baslik: 'Müşteri ekleme ve ölçüye geçme', sahneler: [{ git: 'musteriler', adimlar: [['**Yeni müşteri** ile kayıt açın.', 'button@Yeni müşteri'], ['Satırdaki **Ölçüler** düğmesi müşterinin ölçü sayfasını açar.', 'button@Ölçüler'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] }] }] },

    { id: 'fiyatlar', ne: 'İş açarken seçilen hazır işlemleri ve fiyatlarını tutar. Sık yaptığınız tadilatları buraya yazarsanız iş açmak hızlanır. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'İşlem fiyatı ekleme', sahneler: [
        { git: 'fiyatlar', adimlar: [['**Yeni kalem** düğmesine basın.', 'button@Yeni kalem']] },
        { git: 'fiyatlar', once: [['tikla', 'button@Yeni kalem']], kirp: 'pencere', adimlar: [['Ad, birim ve fiyatı girin, **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'personel', ne: 'İşlere atanacak ustaları tutar. **Açık iş** sütunu her ustanın üzerindeki iş sayısını gösterir. Burada eklenen kişi programa giriş yapamaz, giriş için Ayarlar sayfasından kullanıcı açın.',
      gorevler: [{ baslik: 'Usta ekleme', sahneler: [{ git: 'personel', adimlar: [['**Yeni personel** düğmesine basın, adını ve görevini girin.', 'button@Yeni personel']] }] }] },

    { id: 'bildirimler', ne: 'Müşteriye gönderilen hazır ve hatırlatma mesajlarının kaydıdır. SMS sağlayıcısı bağlı değilse mesaj gönderilmez, kayıt TEST olarak görünür. Sağlayıcı bağlamak için Entegrasyonlar bölümüne bakın.',
      gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', adimlar: [['Mesaj gönderildikçe bu sayfada listelenir.', '#view']] }] }],
      hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını kurun.']] },

    O.belgeler({ tur: 'İş fişi' }),
    O.ayarlar({ alanlar: [['Varsayılan teslim süresi (gün)', 'Yeni işte teslim tarihinin kaç gün sonrası önerileceği.'], ['Aynı tarih ve saate en çok iş (boşsa sınır yok)', 'Aynı saate yazılabilecek iş sayısı.'], ['İş hazır olunca müşteriye otomatik SMS', 'İş Hazır durumuna geçince SMS gönderilmek istenir. SMS sağlayıcısı bağlı değilse gönderilmez.'], ['Kayıttan sonra fişi yazdır', 'Yeni iş kaydedilince iş fişi yazdırma açılır.'], ['KDV oranı (%)', 'Belgelerde kullanılan oran.'], ['Kapora alınmadan işe başlanmasın', 'Açıksa ödeme alınmamış iş Kesim ve dikim durumuna geçmez.']] }),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Usta rolü işleri, provaları, ölçüleri ve müşterileri görür. Özet, işlem fiyatları, ustalar, ölçü şablonları ve yönetim sayfaları yöneticiye aittir.',
  musteri: [{ ad: 'İş takip sayfası', ne: 'Müşteri fişindeki takip koduyla işinin hangi aşamada olduğunu, kalan tutarı ve işletmenin iletişim bilgisini görür. Üyelik gerekmez. Adresi iş detayındaki **Takip** düğmesiyle alırsınız.',
    sahneler: [{ adres: 'takip.html', ilk: 700, kirp: 'tam', adimlar: [['Müşteri kodunu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k']] }] }],
  yazdirma: { ne: 'Belgeler iş detayından yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['İş fişi', 'İş detayında **Fiş** düğmesi.'], ['Askı fişi', 'İş detayında **Askı fişi** düğmesi.'], ['Teslim belgesi', 'Teslim sırasında otomatik açılır. Sonradan iş detayındaki **Teslim belgesi** düğmesiyle.']] },

  entegrasyon: {
    sms: { degisir: ['İş **Hazır** durumuna geçince, Ayarlardaki seçenek açıksa müşteriye hazır mesajı gider.', 'İş detayındaki **Hazır SMS’i gönder**, provadaki hatırlatma ve **Hatırlat** düğmesi gerçek SMS gönderir.', 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken aynı kayıt TEST görünür, müşteriye bir şey gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kaydında telefon yoksa gönderim yapılmaz.'] },
    whatsapp: O.E.whatsappLink('İş detayındaki **WhatsApp** düğmesi'),
    email: { degisir: ['İş ekranlarında e-posta gönderen bir düğme yoktur.', 'Ayar yalnız **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede ve e-Arşiv faturasının müşteriye iletilmesinde kullanılır.'], sorun: ['Gönderilemedi uyarısında sağlayıcı bilgilerini sihirbazdan yeniden test edin.'] },
    printer: { degisir: ['Bu programdaki iş fişi, askı fişi ve teslim belgesi tarayıcının yazdırma penceresiyle basılır. Yazıcı seçimi orada yapılır.', 'Bu ayardaki test düğmesi yazıcının çalıştığını denemenizi sağlar.'], sorun: ['Fiş kâğıdı dar çıkıyorsa **Belge şablonları** sayfasından kâğıt boyunu seçin.'] },
    efatura: { degisir: ['Bağlantı açıkken teslim penceresinde **e-Arşiv / e-Fatura kes** seçeneği çıkar. Sağlayıcının altındaki sınırı okuyun: Paraşüt bu sürümde fatura göndermez.', 'Kesilen belge **e-Belgeler** sayfasında görünür ve iş kaydına numarası yazılır.', 'Simülasyonda belge numarası TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
