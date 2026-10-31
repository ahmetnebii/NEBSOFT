// Çiçekçi kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js cicekci
const SIP = [['tikla', '[data-act=v]']]; // listedeki ilk açık sipariş
const HAZIR = [['tikla', '[data-col=hazir] .sp-card']];
const KODLA = (d) => `(()=>{const k=Object.keys(localStorage).find((x)=>{try{return (JSON.parse(localStorage[x])||{}).orders}catch(e){return false}});const o=JSON.parse(localStorage[k]).orders.find((x)=>x.status==='${d}');document.querySelector('#k').value=o.code;document.querySelector('#go').click()})()`; // takip kodu rastgeledir: demo kaydından okunur
module.exports = (O) => ({
  ne: 'Çiçekçi, siparişi alıcı ve gönderen ayrı olacak şekilde kaydeder. Teslim saat aralığını, kart notunu ve teslimat bölgesini tutar, işi kuryeye atar, teslim alan kişiyi kaydeder. Başarısız teslimi nedeniyle yazar, müşterilerin özel günlerini ve çiçek partilerinin ömrünü izler.',
  kimler: 'Çiçekçiler, online çiçek siparişi alan dükkânlar, aranjman ve çelenk hazırlayan işletmeler. Tek dükkânda da, tezgâh ve kurye ile çalışan yerde de kullanılır.',
  ilkNot: 'Yeni siparişte teslim şekli **Adrese teslim** olarak gelir. **Teslimat Bölgeleri** sayfasına bölgeleri yazarsanız siparişte bölge seçilince ücret kendiliğinden gelir.',
  ekrantanitim: [{ git: 'pano', kirp: 'tam', adimlar: [['Sol taraftaki menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['Üstteki **Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Dükkânın durumunu tek ekranda gösterir: açık işler, ciro, tahsil edilecek tutar, yaklaşan özel günler, ömrü azalan partiler, fire ve geciken işler. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1250, adimlar: [['Üstteki kutular **Açık iş**, **30 gün ciro**, **Tahsil edilecek** ve **Müşteri puanı** bilgilerini gösterir.', '.kpi'], ['**7 gün içinde özel gün**, **Ömrü azalan parti** ve **Fire (adet)** kutularına bakın.', '.kpi@Ömrü azalan parti'], ['**Geciken işler** listesinde söz verilen saati geçen siparişler görünür.', 'h3@Geciken işler']] }] }],
      hatalar: [['Ciro beklediğimden düşük.', 'Ciro teslim edilen siparişlerden hesaplanır.']] },

    { id: 'pano', ne: 'Açık siparişleri aşamalara göre sütunlarda gösterir: **Sipariş alındı**, **Hazırlanıyor**, **Hazır**, **Kuryede**. Kartı sürükleyerek veya açıp durum düğmesine basarak ilerletirsiniz.',
      gorevler: [
        { baslik: 'Sipariş alma', ne: 'Telefon ve müşteri adı siparişi veren kişiye aittir. Çiçeğin gideceği kişi alıcı alanlarına yazılır.', sahneler: [
          { git: 'pano', adimlar: [['**Yeni sipariş** düğmesine basın.', '#ni'], ['Üstteki kutular **Açık iş**, **Bugün teslim**, **Hazır bekleyen** ve **Geciken** sayılarını gösterir.', '.kpi'], ['Kayıtlı siparişi bulmak için arama kutusunu kullanın.', '#q']] },
          { git: 'pano', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1400, adimlar: [['Gönderenin **Telefon** numarasını ve **Müşteri adı** bilgisini yazın.', '#sp-ph'], ['Ürünü yazın veya listeden seçin.', '#sp-ls'], ['**Teslim tarihi** zorunludur. **Saat aralığı** alanına 14:00-16:00 gibi yazın.', '[name=dueTime]'], ['**Teslim adresi (kat, bölüm, oda)** alanını doldurun.', '[name=address]'], ['**Kurye** seçin. Sonra **Dağıtım** sayfasından da atayabilirsiniz.', '[name=courier]'], ['**Alıcı adı** zorunludur. **Alıcı telefonu** adres bulunamazsa kurye içindir.', '[name=recipient]'], ['**Teslimat bölgesi** seçin. Ücret boşsa bölgeden gelir.', '[name=zone]'], ['**Kart notu** alanına metni harfi harfine yazın.', '[name=cardNote]'], ['**Gönderen gizli kalsın** işaretliyse kurye fişinde gönderen **Gizli** yazar.', '[name=anon]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'Siparişi ilerletme', sahneler: [{ git: 'pano', kirp: 'ana', en: 1500, adimlar: [['Kartı sürükleyin veya açıp durum düğmesine basın.', '.sp-card'], ['Kuryedeki siparişler bu sütunda görünür.', '[data-col=yolda]']] }] }],
      alanlar: [['Teslimat ücreti (₺)', 'Boş bırakılırsa seçilen bölgenin ücreti yazılır.'], ['Çelenk şerit yazısı', 'Çelenk ve aranjman şeridine yazılacak metin.'], ['Hazırlayan', 'Siparişi hazırlayan kişi.'], ['Müşteriye görünen not', 'Fişe yazılır.'], ['İç not (müşteri görmez)', 'Yalnız çalışanlar görür.'], ['İndirim (₺)', 'Toplamdan düşülür.'], ['Kapora (₺)', 'Sipariş alınırken yapılan ödeme.'], ['Ödeme şekli', 'Kaporanın nasıl alındığı.']],
      hatalar: [['Teslim adresini yazın uyarısı çıkıyor.', '**Adrese teslim** seçilince adres zorunludur. Mağazadan alınacaksa **Teslim şekli** alanını değiştirin.'], ['Telefon numarası 10 hane olmalı uyarısı çıkıyor.', 'Numarayı alan koduyla birlikte yazın.'], ['En az bir kalem girin uyarısı çıkıyor.', 'En az bir satırda ürün adı olmalıdır.']] },

    { id: 'siparisler', ne: 'Tüm siparişlerin listesidir. Siparişe girince kalemler, alıcı ve kart bilgisi, teslim fotoğrafı, ödeme ve geçmiş tek sayfada görünür.',
      gorevler: [
        { baslik: 'Sipariş arama', sahneler: [{ git: 'siparisler', adimlar: [['Arama kutusuna sipariş numarası, müşteri, telefon veya kalem yazın.', '#q'], ['**Açık**, **Teslim edilen**, **İptal** veya **Tümü** ile listeyi süzün.', '[data-f=teslim]'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesine basın.', '#ex'], ['Siparişi açmak için satırdaki **Aç** düğmesine basın.', '[data-act=v]']] }] },
        { baslik: 'Sipariş detayında çalışma', sahneler: [
          { git: 'siparisler', once: SIP, kirp: 'ana', adimlar: [['Üstteki adımlar siparişin aşamasını gösterir.', '.sp-steps'], ['**Fiş** sipariş fişini, **Kurye fişi** kuryenin taşıyacağı fişi yazdırır.', '[data-doc=kurye]'], ['**WhatsApp** müşteriyle sohbeti açar. **Takip** müşteri sayfasını açar ve adresini kopyalar.', '[data-x=wa]'], ['**Düzenle** kaydı değiştirir. **İptal** siparişi iptal eder.', '[data-x=edit]']] },
          { git: 'siparisler', once: SIP, kirp: 'ana', boy: 1300, adimlar: [['**Teslim fotoğrafı** kartında fotoğraf ekleyin.', 'label.btn'], ['**Alıcı ve kart** bölümü alıcıyı, göndereni ve kart notunu toplar.', 'h3@Alıcı ve kart'], ['Ara ödemeyi **Tahsilat** düğmesiyle girin.', '[data-x=pay]']] }] },
        { baslik: 'Teslim edilemeyen sipariş', ne: 'Alıcıya ulaşılamazsa **Alıcı ve kart** kartındaki **Teslim edilemedi** düğmesine basın. Neden kayda yazılır, sipariş **Hazır** durumuna döner ve kartta başarısız deneme sayısı görünür.', sahneler: [{ git: 'pano', once: [...HAZIR, ['tikla', '#fail']], kirp: 'pencere', adimlar: [['**Neden** seçin.', '[name=why]'], ['Gerekirse **Not** yazın.', '[name=note]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      alanlar: [['Teslim alan kişi', 'Adrese teslimde zorunludur. Yazılmadan teslim tamamlanmaz.'], ['Teslim notu', 'Örneğin komşuya bırakıldı.'], ['İptal nedeni', 'Sipariş iptal edilirken zorunludur.']],
      hatalar: [['İade, alınan tutarı aşamaz uyarısı çıkıyor.', 'İptal penceresinde iade tutarını alınan tutar veya altı yazın.'], ['Müşterinin telefonu yok uyarısı çıkıyor.', 'Müşteri kaydına telefon ekleyin. Telefonsuz müşteriye SMS gönderilmez.']] },

    { id: 'takvim', ne: 'Önümüzdeki 7 günün teslimlerini saate göre sıralar. Tarihi geçen siparişler en üstte toplanır. Özel gün yoğunluğunda sırayı buradan izleyin.',
      gorevler: [{ baslik: 'Teslimleri görme', sahneler: [{ git: 'takvim', adimlar: [['Sipariş numarasına tıklayarak detaya geçin.', 'table a']] }] }] },

    { id: 'dagitim', ne: 'Kuryenin iş listesidir. **Hazır** ve **Kuryede** durumundaki adrese teslim siparişler saate göre sıralanır. **Kurye** rolüyle giren kullanıcı kendisine atanan işleri görür.',
      gorevler: [{ baslik: 'Teslimat yapma', sahneler: [{ git: 'dagitim', adimlar: [['Yönetici ve tezgâh üstteki listeden kuryeye göre süzer.', '#kf'], ['Kartta alıcı, adres, saat, kart notu ve tahsil edilecek tutar görünür. Adrese tıklayınca harita açılır.', '.card.pad'], ['**Ara** alıcının telefonunu arar.', 'a.btn[href^="tel:"]'], ['İşi atamak için **Kurye seç** listesini kullanın.', '[data-kurye]'], ['Teslim edince **Teslim ettim** düğmesine basın, teslim alan kişiyi yazın.', '[data-d]']] }] }],
      hatalar: [['Sipariş bu listede görünmüyor.', 'Siparişte **Adrese teslim** seçili olmalı ve sipariş **Hazır** veya **Kuryede** durumunda olmalıdır.']] },

    { id: 'ozelgunler', ne: 'Müşterilerin hatırlamak istediği günleri tutar. Yaklaşan günler üstte görünür. Bu liste işletme içidir: program müşteriye özel gün SMS’i göndermez, müşteriyi siz ararsınız.',
      gorevler: [{ baslik: 'Özel gün ekleme', sahneler: [
        { git: 'ozelgunler', adimlar: [['**Yeni özel gün** düğmesine basın.', 'button@Yeni özel gün'], ['**30 gün içinde** süzgeci yaklaşan günleri gösterir.', 'button@30 gün içinde']] },
        { git: 'ozelgunler', once: [['tikla', 'button@Yeni özel gün']], kirp: 'pencere', adimlar: [['**Müşteri** seçin.', '[name=customer]'], ['**Özel gün** adını yazın.', '[name=title]'], ['**Gün ve ay (AA-GG)** alanına önce ayı, sonra günü yazın, örneğin 02-14.', '[name=date]'], ['**Müşteri ticari ileti için yazılı onay verdi** yalnız kayıttır, gönderim başlatmaz.', '[name=consent]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Tarihi AA-GG biçiminde yazın uyarısı çıkıyor.', 'Tarihi ay-gün olarak iki haneli yazın, örneğin 02-14.']] },

    { id: 'stok', ne: 'Çiçek partilerini giriş tarihi ve vazo ömrüyle tutar. Ömrü en az kalan parti üstte görünür. Bu sayfa sipariş kaleminden otomatik düşmez, adetleri siz güncellersiniz.',
      gorevler: [
        { baslik: 'Parti girme', sahneler: [
          { git: 'stok', adimlar: [['**Yeni parti** düğmesine basın.', 'button@Yeni parti'], ['**Ömrü azalan** süzgeci 2 gün veya daha az ömrü kalanları gösterir.', 'button@Ömrü azalan'], ['Solan veya kırılan çiçek için satırdaki **Fire yaz** düğmesini kullanın.', '[data-act=fire]']] },
          { git: 'stok', once: [['tikla', 'button@Yeni parti']], kirp: 'pencere', adimlar: [['**Çiçek** adını ve **Adet** bilgisini yazın.', '[name=name]'], ['**Giriş tarihi** ve **Vazo ömrü (gün)** kalan ömrü belirler.', '[name=life]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'Fire yazma', sahneler: [{ git: 'stok', once: [['tikla', '[data-act=fire]']], kirp: 'pencere', adimlar: [['**Adet** yazın.', '[name=qty]'], ['**Neden** seçin.', '[name=reason]'], ['**Kaydet** düğmesine basın. Adet partiden düşer, **Özet** sayfasındaki toplama eklenir.', '.ns-overlay button.primary']] }] }] },

    { id: 'bolgeler', ne: 'Teslimat bölgelerini ve ücretlerini tutar. Siparişte bölge seçilince ücret buradan gelir. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Bölge ekleme', sahneler: [
        { git: 'bolgeler', adimlar: [['**Yeni bölge** düğmesine basın.', 'button@Yeni bölge']] },
        { git: 'bolgeler', once: [['tikla', 'button@Yeni bölge']], kirp: 'pencere', adimlar: [['**Bölge** adını yazın.', '[name=name]'], ['**Teslimat ücreti (₺)** alanını doldurun.', '[name=fee]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }] },

    { id: 'musteriler', ne: 'Sipariş veren müşterileri, sipariş sayısını, harcamayı ve borcu gösterir. Müşteri ilk siparişte kendiliğinden oluşur. Siparişi olan müşteri silinemez.',
      gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
        { git: 'musteriler', adimlar: [['**Yeni müşteri** ile kayıt açın.', 'button@Yeni müşteri'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
        { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Müşteri silinmiyor.', 'Sipariş kaydı olan müşteri silinemez, geçmiş korunur.']] },

    { id: 'fiyatlar', ne: 'Siparişte seçilen buket, aranjman ve diğer ürünleri fiyatlarıyla tutar. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Ürün ekleme', sahneler: [
        { git: 'fiyatlar', adimlar: [['**Yeni kalem** düğmesine basın.', 'button@Yeni kalem'], ['Mevcut ürünü **Düzenle** ile değiştirin.', 'button@Düzenle']] },
        { git: 'fiyatlar', once: [['tikla', 'button@Yeni kalem']], kirp: 'pencere', adimlar: [['**Ad** yazın, **Kategori** ile gruplayın.', '.field@Ad'], ['**Birim** alanından adet veya demet seçin.', '.field@Birim'], ['**Satış fiyatı (₺)** zorunludur.', '.field@Satış fiyatı'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      alanlar: [['Teslim süresi (gün)', 'Ürünün ne kadar sürdüğüne dair bilgi notu.']] },

    { id: 'personel', ne: 'Hazırlayan kişileri ve kuryeleri tutar. **Açık iş** sütunu her kişinin üzerindeki iş sayısını gösterir. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Personel ekleme', sahneler: [
        { git: 'personel', adimlar: [['**Yeni personel** düğmesine basın.', 'button@Yeni personel']] },
        { git: 'personel', once: [['tikla', 'button@Yeni personel']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın, **Telefon** ve **Görev** ekleyin.', '.field@Ad soyad'], ['Kuryeyse **Kurye / şoför** kutusunu işaretleyin.', '.field@Kurye / şoför'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }] },

    { id: 'bildirimler', ne: 'Müşteriye gönderilen hazır, teslim ve hatırlatma mesajlarının kaydıdır. SMS sağlayıcısı bağlı değilse mesaj gönderilmez, kayıt **TEST: gönderilmedi** olarak görünür.',
      gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', adimlar: [['Mesaj gönderildikçe bu sayfada zaman, alıcı, mesaj ve durum olarak listelenir.', '#view']] }] }],
      hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını bağlayın.']] },

    O.belgeler({ tur: 'Kurye fişi' }),
    O.ayarlar({ alanlar: [['Varsayılan teslim süresi (gün)', 'Yeni siparişte teslim tarihinin kaç gün sonrası önerileceği.'], ['Aynı tarih ve saate en çok iş (boşsa sınır yok)', 'Sınıra ulaşınca program sorar, isterseniz yine eklersiniz.'], ['İş hazır olunca müşteriye otomatik SMS', 'Sipariş Hazır durumuna geçince SMS gönderilmek istenir. Çiçekçide varsayılan kapalıdır.'], ['Kayıttan sonra fişi yazdır', 'Yeni sipariş kaydedilince fiş yazdırma açılır.'], ['KDV oranı (%)', 'e-Belge satırlarına yazılır. Oranı muhasebecinize doğrulatın.'], ['Teslimde gönderene bilgi SMS’i', 'Teslim kaydı girilince gönderene saat ve teslim alan kişi bilgisiyle SMS gönderilmek istenir.']] }),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Tezgâh rolü panoyu, siparişleri, takvimi, dağıtımı, özel günleri, stoğu ve müşterileri görür. Kurye **Dağıtım** sayfasıyla çalışır. Özet, fiyatlar, bölgeler, personel ve yönetim sayfaları yöneticiye aittir.',
  musteri: [{ ad: 'Sipariş takip sayfası', ne: 'Müşteri fişindeki 8 haneli takip koduyla hazırlık, kurye ve teslim bilgisini görür, teslimden sonra puan ve yorum bırakabilir. Üyelik gerekmez. Adresi sipariş detayındaki **Takip** düğmesiyle alırsınız.',
    sahneler: [
      { adres: 'takip.html', ilk: 700, kirp: 'tam', adimlar: [['Müşteri kodunu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k']] },
      { adres: 'takip.html', ilk: 700, once: [['js', KODLA('hazir')]], kirp: 'tam', boy: 1000, adimlar: [['Kod bulununca müşteri aşamaları görür.', '.tk-steps'], ['**Hareketler** bölümünde tarihli durum geçmişi görünür.', '.tk-tl']] }] }],
  yazdirma: { ne: 'Belgeler sipariş detayından yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Sipariş fişi', 'Sipariş detayında **Fiş** düğmesi.'], ['Kurye fişi', 'Sipariş detayında **Kurye fişi** düğmesi. Varsayılan kâğıt 80 mm.'], ['Teslim belgesi', 'Teslim sırasında otomatik açılır. Sonradan teslim edilmiş siparişte **Teslim belgesi** düğmesiyle.']] },

  entegrasyon: {
    sms: { degisir: ['**Entegre et** ile sağlayıcınızı seçin, bilgileri girin ve **Bağlantıyı dene** adımını yapın. Deneme geçmeden mesaj gönderilmez. Bilgileri değiştirirseniz denemeyi yineleyin.', 'Adrese teslim kaydı girilince, **Teslimde gönderene bilgi SMS’i** açıksa gönderene teslim mesajı gider.', '**İş hazır olunca müşteriye otomatik SMS** açıksa sipariş **Hazır** olunca mesaj gider.', 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken aynı kayıt TEST görünür, müşteriye bir şey gitmez.', '**Özel Günler** listesi bu bağlantıyla da SMS göndermez.'], sorun: ['Kart Bağlantı hatası gösteriyorsa kullanıcı adı, şifre ve mesaj başlığını sağlayıcı panelinden kontrol edin, **Bağlantıyı dene** adımını yineleyin.', 'Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kaydında telefon yoksa gönderim yapılmaz.'] },
    whatsapp: O.E.whatsappLink('Sipariş detayındaki **WhatsApp** düğmesi'),
    email: { degisir: ['Sipariş ekranlarında e-posta gönderen bir düğme yoktur.', 'Ayar yalnız **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede ve e-Arşiv faturasının müşteriye iletilmesinde kullanılır.'], sorun: ['Gönderilemedi uyarısında sağlayıcı bilgilerini kontrol edin, **Bağlantıyı dene** adımını yineleyin.'] },
    printer: { degisir: ['Bu programdaki sipariş fişi, kurye fişi ve teslim belgesi tarayıcının yazdırma penceresiyle basılır. Yazıcı seçimi orada yapılır.', 'Kurulumdaki deneme adımı yazıcıya ulaşılıp ulaşılamadığını gösterir.'], sorun: ['Fiş kâğıdı dar çıkıyorsa **Belge şablonları** sayfasından kâğıt boyunu seçin.'] },
    efatura: { degisir: ['**Entegre et** ile entegratörünüzü seçin, bilgileri girin ve **Bağlantıyı dene** adımını yapın.', 'Bağlantı açıkken teslim penceresinde **e-Arşiv / e-Fatura kes** seçeneği çıkar. Sağlayıcıda sınır yazıyorsa o sağlayıcının başlığı altında okuyun.', 'Kesilen belge **e-Belgeler** sayfasında görünür ve sipariş kaydına numarası yazılır.', 'Entegratör bağlı değilken oluşan belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
