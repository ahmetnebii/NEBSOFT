// Matbaa & Reklam Atölyesi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js matbaa
const IS = [['tikla', '[data-act=v]']]; // listedeki ilk açık iş
const ONAY = [['tikla', '[data-col=onay] .sp-card']]; // müşteri onayı bekleyen iş
const HAZIR = [['tikla', '[data-col=hazir] .sp-card']];
const KODLA = (d) => `(()=>{const k=Object.keys(localStorage).find((x)=>{try{return (JSON.parse(localStorage[x])||{}).orders}catch(e){return false}});const o=JSON.parse(localStorage[k]).orders.find((x)=>x.status==='${d}');document.querySelector('#k').value=o.code;document.querySelector('#go').click()})()`; // takip kodu rastgeledir: demo kaydından okunur
module.exports = (O) => ({
  ne: 'Matbaa & Reklam Atölyesi, teklif verdiğiniz işi tasarım, müşteri onayı, baskı ve son işlem aşamalarından geçirerek teslime kadar izler. Tasarım sürümlerini saklar, onaysız işin baskıya geçmesini engeller, ebat ve yön gibi bilgileri üretim kontrol listesine çevirir, hatalı işlerin zararını kaydeder.',
  kimler: 'Matbaalar, dijital baskı ve reklam atölyeleri, tabela ve branda üreticileri, araç giydirme yapan işletmeler. Satış, grafiker ve üretim ayrı çalışan yerlerde de, tek kişilik atölyede de kullanılır.',
  ilkNot: 'Müşteri hazır dosya getirdiyse yeni iş penceresinde **Tasarım onayı gerekmez (müşteri hazır dosya verdi)** kutusunu işaretleyin. İşaretlemezseniz onaylı sürüm olmadan iş baskıya geçmez.',
  ekrantanitim: [{ git: 'pano', kirp: 'tam', adimlar: [['Sol taraftaki menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['Üstteki **Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Atölyenin durumunu tek ekranda gösterir: açık işler, ciro, tahsil edilecek tutar, her aşamadaki iş sayısı, hata nedenleri ve geciken işler. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Günün durumunu okuma', sahneler: [{ git: 'ozet', boy: 1250, adimlar: [['Üstteki kutular **Açık iş**, **30 gün ciro**, **Tahsil edilecek** ve **Müşteri puanı** bilgilerini gösterir.', '.kpi'], ['**Günlük teslim cirosu** son 30 günde teslim edilen işlerin tutarıdır.', 'h3@Günlük teslim cirosu'], ['**Hata nedenleri** tablosu hangi hatanın kaç kez olduğunu ve zararını toplar.', 'h3@Hata nedenleri'], ['**Geciken işler** listesinde söz verilen tarihi geçen işler görünür.', 'h3@Geciken işler']] }] }],
      hatalar: [['Ciro beklediğimden düşük.', 'Ciro teslim edilen işlerden hesaplanır. Teslim edilmemiş işler **Tahsil edilecek** tutarında görünür.']] },

    { id: 'pano', ne: 'İşleri aşamalara göre sütunlarda gösterir: **Teklif**, **Tasarım**, **Müşteri onayı**, **Baskı**, **Son işlem**, **Hazır**. Kartı sürükleyerek veya açıp durum düğmesine basarak ilerletirsiniz. Onaysız iş baskı aşamalarına geçmez.',
      gorevler: [
        { baslik: 'Yeni iş açma', ne: 'Telefon numarasını yazınca kayıtlı müşteri bulunur, yoksa kaydederken yeni müşteri oluşur.', sahneler: [
          { git: 'pano', adimlar: [['**Yeni iş** düğmesine basın.', '#ni'], ['Üstteki kutular **Açık iş**, **Bugün teslim**, **Hazır bekleyen** ve **Geciken** sayılarını gösterir.', '.kpi'], ['Kayıtlı işi bulmak için arama kutusunu kullanın.', '#q']] },
          { git: 'pano', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1250, adimlar: [['Müşterinin **Telefon** numarasını ve **Müşteri adı** bilgisini yazın.', '#sp-ph'], ['Kalemi yazın veya listeden seçin. Birim ve fiyat **Ürün ve Fiyatlar** kaydından gelir. Satırın altına **Ebat**, **Malzeme / gramaj**, **Yön** ve **Son işlem** bilgilerini yazın, bunlar üretim kontrol listesine geçer.', '#sp-ls'], ['Birden çok ürün için **Satır ekle** düğmesini kullanın.', '#sp-add'], ['**Teslim tarihi** zorunludur.', '[name=due]'], ['Montaj veya kargo varsa **Teslim şekli** alanından **Adrese teslim** seçin.', '[name=mode]'], ['Hazır dosya geldiyse bu kutuyu işaretleyin.', '[name=noDesign]'], ['Peşin ödemeyi **Kapora (₺)** alanına yazın.', '[name=deposit]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'İşi aşamalarda ilerletme', ne: 'm² birimli üründe **En (m)** ve **Boy (m)** kutuları açılır, miktar kendiliğinden hesaplanır.', sahneler: [{ git: 'pano', kirp: 'ana', en: 1500, adimlar: [['Kartı sürükleyin veya açıp durum düğmesine basın.', '.sp-card'], ['Bu sütundaki işler müşterinin tasarım yanıtını bekliyor.', '[data-col=onay]']] }] }],
      alanlar: [['Teslim saati', 'Müşteriye söz verdiğiniz saat. Boş kalabilir.'], ['Teslim şekli', 'Mağazadan teslim veya Adrese teslim.'], ['Sorumlu', 'İşe bakan kişi.'], ['Müşteriye görünen not', 'Fişe yazılır.'], ['İç not (müşteri görmez)', 'Yalnız çalışanlar görür.'], ['İndirim (₺)', 'Toplamdan düşülür.'], ['Kapora (₺)', 'İş açılırken alınan ödeme.'], ['Ödeme şekli', 'Kaporanın nasıl alındığı.']],
      hatalar: [['Tasarım onayı olmadan üretime geçilemez uyarısı çıkıyor.', 'Sürümü müşteriye onaylatın veya **Yüz yüze onay** ile kaydedin. Hazır dosyalı işte **Düzenle** ile **Tasarım onayı gerekmez (müşteri hazır dosya verdi)** kutusunu işaretleyin.'], ['Önce "Sürüm ekle" ile tasarımı onaya sunun uyarısı çıkıyor.', 'İş detayındaki **Tasarım onayı** kartından **Sürüm ekle** düğmesini kullanın.'], ['Telefon numarası 10 hane olmalı uyarısı çıkıyor.', 'Numarayı alan koduyla birlikte yazın.'], ['En az bir kalem girin uyarısı çıkıyor.', 'En az bir satırda ürün adı olmalıdır.']] },

    { id: 'siparisler', ne: 'Tüm işlerin listesidir. İşe girince kalemler, tasarım sürümleri, üretim kontrol listesi, hata kaydı, ödeme ve geçmiş tek sayfada görünür.',
      gorevler: [
        { baslik: 'İş arama', sahneler: [{ git: 'siparisler', adimlar: [['Arama kutusuna iş numarası, müşteri, telefon veya kalem yazın.', '#q'], ['**Açık**, **Teslim edilen**, **İptal** veya **Tümü** ile listeyi süzün.', '[data-f=teslim]'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesine basın.', '#ex'], ['İşi açmak için satırdaki **Aç** düğmesine basın.', '[data-act=v]']] }] },
        { baslik: 'İş detayını tanıma', sahneler: [{ git: 'siparisler', once: IS, kirp: 'ana', adimlar: [['Üstteki adımlar işin nerede olduğunu gösterir.', '.sp-steps'], ['**Fiş** iş emrini, **Teklif** fiyat teklifini yazdırır.', '[data-doc=teklif]'], ['**WhatsApp** müşteriyle sohbeti hazır mesajla açar. **Takip** müşteri sayfasını açar ve adresini kopyalar.', '[data-x=wa]'], ['**Düzenle** kaydı değiştirir. Tutar veya teslim sözü değişirse **Geçmiş** bölümüne yazılır.', '[data-x=edit]'], ['**İptal** işi nedeniyle iptal eder.', '[data-x=iptal]']] }] },
        { baslik: 'Tasarımı onaya sunma', ne: 'Her sürüm numaralanır ve saklanır. **Sürüm ekle** işi **Müşteri onayı** aşamasına geçirir ve müşteriye onay bağlantısı SMS’i gönderilmek istenir. Müşteri takip sayfasından yanıt verince iş kendiliğinden ilerler: onayda **Baskı**, düzeltmede **Tasarım** aşamasına döner.', sahneler: [
          { git: 'pano', once: ONAY, kirp: '.card@Tasarım onayı', boy: 1500, adimlar: [['**Sürüm ekle** ile yeni sürümü onaya sunun.', '[data-p=ekle]'], ['Müşteri yüz yüze, telefonla veya mesajla onay verdiyse **Yüz yüze onay** düğmesini kullanın. Onaylayan kişi kayda yazılır, iş **Baskı** aşamasına geçer.', '[data-p=elle]']] },
          { git: 'pano', once: [...ONAY, ['tikla', '[data-p=ekle]']], kirp: 'pencere', adimlar: [['**Bu sürümde ne var?** alanına değişikliği yazın.', '[name=note]'], ['Müşteri görseli takip sayfasında görsün diye https ile başlayan **Görsel adresi (isteğe bağlı)** girin.', '[name=url]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'Üretim kontrol listesi', ne: 'Liste iş kalemlerinden kendiliğinden oluşur: ebat, yön, malzeme, son işlem ve adet. Baskıdan önce her maddeyi işaretleyin, gözden kaçan ayrıntı azalır.', sahneler: [{ git: 'siparisler', once: IS, kirp: '.card@Üretim kontrol listesi', boy: 1700, adimlar: [['Kontrol ettiğiniz maddenin kutusunu işaretleyin.', '[data-c]']] }] },
        { baslik: 'Hata ve yeniden üretim kaydı', ne: 'Hatalı basılan işin nedenini ve zararını yazın. Toplamlar **Özet** sayfasındaki **Hata nedenleri** tablosuna geçer.', sahneler: [
          { git: 'siparisler', once: [...IS, ['tikla', '[data-p=hata]']], kirp: 'pencere', boy: 900, adimlar: [['**Neden** seçin.', '[name=reason]'], ['**Zarar (₺)** alanına maliyeti yazın.', '[name=cost]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'Tahsilat ve teslim', ne: 'Son aşamada **Teslim et** düğmesi çıkar. Kalan tutar varsa tahsilat sorulur, adrese teslimde teslim alan kişi yazılır, teslim belgesi yazdırılır. e-Fatura bağlantısı açıksa pencerede **e-Arşiv / e-Fatura kes** seçeneği görünür.', sahneler: [{ git: 'pano', once: HAZIR, kirp: 'ana', adimlar: [['**Teslim et** düğmesine basın.', '[data-x=teslim]'], ['Müşteriye yeniden haber vermek için **Hazır SMS’i gönder** düğmesini kullanın.', '[data-x=tekrar]'], ['Ara ödeme için **Tahsilat** düğmesini kullanın.', '[data-x=pay]']] }] }],
      alanlar: [['Teslim alan kişi', 'Adrese teslimde zorunludur.'], ['Teslim notu', 'Örneğin komşuya bırakıldı.'], ['İptal nedeni', 'İş iptal edilirken zorunludur.']],
      hatalar: [['Görsel adresi https ile başlamalı uyarısı çıkıyor.', 'Adresi https ile yazın veya alanı boş bırakın.'], ['Müşterinin telefonu yok uyarısı çıkıyor.', 'Müşteri kaydına telefon ekleyin. Telefonsuz müşteriye SMS gönderilmez.'], ['İade, alınan tutarı aşamaz uyarısı çıkıyor.', 'İptal penceresinde iade tutarını alınan tutar veya altı yazın.'], ['Ücretsiz sürüm hakkı aşıldı yazısı çıkıyor.', 'Ek ücreti **Düzenle** ile kaleme ekleyin. Sınır **Ayarlar** sayfasındaki **Ücretsiz tasarım sürümü sayısı** alanından gelir.']] },

    { id: 'takvim', ne: 'Önümüzdeki 7 günün teslimlerini saate göre sıralar. Tarihi geçen işler en üstte toplanır.',
      gorevler: [{ baslik: 'Teslimleri görme', sahneler: [{ git: 'takvim', adimlar: [['İş numarasına tıklayarak detaya geçin.', 'table a']] }] }] },

    { id: 'dagitim', ne: '**Adrese teslim** seçilmiş ve **Hazır** durumundaki işleri listeler. Montaj ve kargo sırasını buradan görürsünüz. Yeni bir iş buraya ancak hazır olunca düşer.',
      gorevler: [{ baslik: 'Adrese teslim', sahneler: [{ git: 'dagitim', adimlar: [['Üstteki liste kuryeye göre süzer.', '#kf']] }] }],
      hatalar: [['İş bu listede görünmüyor.', 'İşte **Adrese teslim** seçili olmalı ve iş **Hazır** durumunda olmalıdır.'], ['Liste boş ve kurye seçemiyorum.', 'Kurye listesi **Ekip** sayfasında **Kurye / şoför** işaretli kişilerden gelir.']] },

    { id: 'musteriler', ne: 'Müşteri kartlarını, iş sayısını, harcamayı ve borcu gösterir. Müşteri ilk işte kendiliğinden oluşur, buradan da eklenebilir. İş kaydı olan müşteri silinemez.',
      gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
        { git: 'musteriler', adimlar: [['**Yeni müşteri** ile kayıt açın.', 'button@Yeni müşteri'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
        { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Müşteri silinmiyor.', 'İş kaydı olan müşteri silinemez, geçmiş korunur.']] },

    { id: 'fiyatlar', ne: 'İş açarken seçilen ürünleri, fiyatlarını ve birim maliyetlerini tutar. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Ürün ekleme', sahneler: [
        { git: 'fiyatlar', adimlar: [['**Yeni kalem** düğmesine basın.', 'button@Yeni kalem'], ['Mevcut ürünü **Düzenle** ile değiştirin.', 'button@Düzenle']] },
        { git: 'fiyatlar', once: [['tikla', 'button@Yeni kalem']], kirp: 'pencere', adimlar: [['**Ad** yazın, **Kategori** ile gruplayın.', '.field@Ad'], ['**Birim** alanından adet, m² veya takım seçin.', '.field@Birim'], ['**Satış fiyatı (₺)** zorunludur.', '.field@Satış fiyatı'], ['**Birim maliyet (₺)** listede **Maliyet** sütununda görünür.', '.field@Birim maliyet'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      alanlar: [['Teslim süresi (gün)', 'Ürünün ne kadar sürdüğüne dair bilgi notu.']] },

    { id: 'personel', ne: 'Grafiker, usta ve kuryeleri tutar. **Açık iş** sütunu her kişinin üzerindeki iş sayısını gösterir. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Ekibe kişi ekleme', sahneler: [
        { git: 'personel', adimlar: [['**Yeni personel** düğmesine basın.', 'button@Yeni personel']] },
        { git: 'personel', once: [['tikla', 'button@Yeni personel']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın, **Telefon** ve **Görev** ekleyin.', '.field@Ad soyad'], ['Teslimat yapıyorsa **Kurye / şoför** kutusunu işaretleyin.', '.field@Kurye / şoför'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }] },

    { id: 'bildirimler', ne: 'Müşteriye gönderilen hazır ve onay mesajlarının kaydıdır. SMS sağlayıcısı bağlı değilse mesaj gönderilmez, kayıt **TEST: gönderilmedi** olarak görünür.',
      gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', adimlar: [['Mesaj gönderildikçe bu sayfada zaman, alıcı, mesaj ve durum olarak listelenir.', '#view']] }] }],
      hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını kurun.']] },

    O.belgeler({ tur: 'İş emri' }),
    O.ayarlar({ alanlar: [['Varsayılan teslim süresi (gün)', 'Yeni işte teslim tarihinin kaç gün sonrası önerileceği.'], ['Aynı tarih ve saate en çok iş (boşsa sınır yok)', 'Sınıra ulaşınca program sorar, isterseniz yine eklersiniz.'], ['İş hazır olunca müşteriye otomatik SMS', 'İş Hazır durumuna geçince SMS gönderilmek istenir. SMS sağlayıcısı bağlı değilse gönderilmez.'], ['Kayıttan sonra fişi yazdır', 'Yeni iş kaydedilince iş emri yazdırma açılır.'], ['KDV oranı (%)', 'e-Belge satırlarına yazılır. Oranı muhasebecinize doğrulatın.'], ['Ücretsiz tasarım sürümü sayısı', 'Bu sayı aşılınca iş detayında uyarı çıkar. Boşsa uyarı çıkmaz.'], ['Teklif altı notu', 'Fiyat teklifinin altına yazılır.']] }),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Satış ve Üretim rolleri panoyu, işleri, takvimi ve dağıtımı görür. Müşteriler sayfası yönetici ve satışa açıktır. Özet, ürün fiyatları ve ekip yöneticiye aittir.',
  musteri: [{ ad: 'İş durumu ve tasarım onayı sayfası', ne: 'Müşteri 8 haneli takip koduyla işinin aşamasını, kalan tutarı ve hareketleri görür. Sunulan tasarımı buradan onaylar veya düzeltme ister. Üyelik gerekmez. Adresi iş detayındaki **Takip** düğmesiyle alırsınız.',
    sahneler: [
      { adres: 'takip.html', ilk: 700, kirp: 'tam', adimlar: [['Müşteri kodunu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k']] },
      { adres: 'takip.html', ilk: 700, once: [['js', KODLA('onay')]], kirp: 'tam', boy: 1100, adimlar: [['Onay bekleyen sürüm burada görünür.', '.tk-call'], ['Müşteri ebat, renk, yazı ve yönleri kontrol ettiğini işaretler.', '#tc'], ['**Onaylıyorum** işi baskıya geçirir.', '#ok'], ['**Düzeltme istiyorum** ile neyin değişeceğini yazar, iş **Tasarım** aşamasına döner.', '#no']] }],
    not: 'Ekrandaki renk baskıdan farklı görünebilir. Sayfa bu uyarıyı müşteriye gösterir.' }],
  yazdirma: { ne: 'Belgeler iş detayından yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['İş emri', 'İş detayında **Fiş** düğmesi. Ayarlarda açıksa kayıttan sonra da açılır.'], ['Fiyat teklifi', 'İş detayında **Teklif** düğmesi.'], ['Teslim belgesi', 'Teslim sırasında otomatik açılır. Sonradan teslim edilmiş işte **Teslim belgesi** düğmesiyle.']] },

  entegrasyon: {
    sms: { degisir: ['İş **Hazır** durumuna geçince, Ayarlardaki seçenek açıksa müşteriye hazır mesajı gider.', '**Sürüm ekle** müşteriye takip bağlantısıyla onay mesajı gönderir.', 'İş detayındaki **Hazır SMS’i gönder** ve Özet sayfasındaki **Hatırlat** düğmesi gerçek SMS gönderir.', 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken aynı kayıt TEST görünür, müşteriye bir şey gitmez.'], sorun: ['Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kaydında telefon yoksa gönderim yapılmaz.'] },
    whatsapp: O.E.whatsappLink('İş detayındaki **WhatsApp** düğmesi'),
    email: { degisir: ['İş ekranlarında e-posta gönderen bir düğme yoktur.', 'Ayar yalnız **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede ve e-Arşiv faturasının müşteriye iletilmesinde kullanılır.'], sorun: ['Gönderilemedi uyarısında sağlayıcı bilgilerini sihirbazdan yeniden test edin.'] },
    printer: { degisir: ['Bu programdaki iş emri, teklif ve teslim belgesi tarayıcının yazdırma penceresiyle basılır. Yazıcı seçimi orada yapılır.', 'Bu ayardaki test düğmesi yazıcının çalıştığını denemenizi sağlar.'], sorun: ['Kâğıt dar çıkıyorsa **Belge şablonları** sayfasından kâğıt boyunu seçin.'] },
    efatura: { degisir: ['Bağlantı açıkken teslim penceresinde **e-Arşiv / e-Fatura kes** seçeneği çıkar. Sağlayıcının altındaki sınırı okuyun: Paraşüt bu sürümde fatura göndermez.', 'Kesilen belge **e-Belgeler** sayfasında görünür ve iş kaydına numarası yazılır.', 'Simülasyonda belge numarası TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
