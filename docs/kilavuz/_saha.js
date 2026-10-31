// Saha ailesinin ortak kılavuz parçası: nakliyat, temizlik, usta ve peyzaj aynı motoru kullanır (apps/saha-ortak/saha.js). Program dosyası adları verir, kendi modüllerini ekler.
// Dosya adı alt çizgiyle başlar: uret.js --hepsi bunu program saymaz.
// c: is ('ziyaret'), Is ('Ziyaret'), isler ('Ziyaretler'), bugun ('Bugünkü Ziyaretler'), takvim ('Ekip Takvimi'), ekip ('Ekip'), ekipler ('Ekipler'), yeniEkip ('Yeni ekip'), stok ('Malzeme Stoğu'), form ('Hizmet raporu'), soz ('Sözleşmeler'), kalem ('Kalemler ve ücret')
const ILK = [['tikla', '[data-act=v]']]; // listedeki ilk açık kayıt
const KOD = (d) => `(()=>{const k=Object.keys(localStorage).find((x)=>{try{return (JSON.parse(localStorage[x])||{}).jobs}catch(e){return false}});const o=JSON.parse(localStorage[k]).jobs.find((x)=>x.status==='${d}'&&x.code);document.querySelector('#k').value=o.code;document.querySelector('#go').click()})()`; // takip kodu rastgeledir: demo kaydından okunur
const KONTROLLU = "(()=>{const j=NS.app.db.all('jobs',(x)=>(x.checks||[]).length&&x.status==='planli')[0];NS.app.go('is',j.id)})()"; // kontrol listesi olan planlı kayıt
const KAYDET = ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary'];

const ortak = (O, c) => ({
  tanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol taraftaki menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['Üstteki **Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  ozet: { id: 'ozet', ne: `Günün durumunu tek ekranda gösterir: bugünkü işler, gecikenler, açık alacak, ortalama puan ve yapılacaklar listesi. Bu sayfayı yönetici ve ofis görür.`,
    gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1000, adimlar: [['Üstteki kutular **Bugünkü iş**, **Geciken**, **Açık alacak** ve **Ortalama puan** bilgilerini gösterir.', '.kpi'], ['**Yapılacaklar** listesi geciken işleri, müşteri bildirimlerini, kritik stoğu ve bekleyen yanıtları toplar. Satıra tıklayınca ilgili sayfa açılır.', 'h3@Yapılacaklar'], [`Yeni kayıt için **Yeni ${c.is}** düğmesine basın.`, '#ni']] }] }] },

  bugun: { id: 'bugun', ne: `Sahadaki kişinin günlük listesidir. Bugünkü ve geciken ${c.isler.toLocaleLowerCase('tr')} saate göre sıralanır. **${c.ekipRol || 'Saha ekibi'}** rolüyle giren kullanıcı yalnız kendi ekibinin kayıtlarını görür.`,
    gorevler: [{ baslik: 'Günün işlerini yürütme', sahneler: [{ git: 'bugun', boy: 1000, adimlar: [['Kartta saat, hizmet, müşteri ve adres görünür.', '.sh-gun .card.pad'], ['**Ara** müşterinin telefonunu arar.', 'a.btn[href^="tel:"]'], ['**Yol tarifi** adresi haritada açar.', '.sh-gun a.btn[target=_blank]'], ['**Aç** kaydın detayına götürür.', '.sh-gun a.btn.primary']] }] }],
    hatalar: [[`Bugün için iş yok yazıyor.`, 'Tarihi bugün olan açık kayıt yoktur. Kullanıcı saha hesabıysa kayıtların kendi ekibine atandığını kontrol edin.']] },

  takvim: { id: 'takvim', ne: `Haftayı ${c.ekip.toLocaleLowerCase('tr')} satırlarıyla gösterir. Kartı sürükleyip başka güne veya ${c.ekip.toLocaleLowerCase('tr')} satırına taşırsınız, taşıma kaydın geçmişine yazılır. Aynı saatte iki iş çakışırsa program sorar.`,
    gorevler: [{ baslik: 'Haftayı planlama', sahneler: [{ git: 'takvim', adimlar: [['Önceki ve sonraki hafta okları ile **Bu hafta** düğmesi arasında geçin.', '#bu'], ['Kartı sürükleyip başka hücreye bırakın. Karta tıklayınca kayıt açılır.', '.sh-is']] }] }] },

  isler: (ek = []) => ({ id: 'isler', ne: `Tüm ${c.isler.toLocaleLowerCase('tr')} burada listelenir. Kayıt açma, arama, CSV alma ve sahadaki iş akışı bu sayfadan yürür.`,
    gorevler: [
      { baslik: 'Kayıt arama', sahneler: [{ git: 'isler', adimlar: [['Arama kutusuna numara, müşteri, telefon veya hizmet yazın.', '#q'], [`**Tüm ekipler** listesi ${c.ekip.toLocaleLowerCase('tr')} seçerek süzer.`, '#tf'], ['**Açık**, **Bugün**, **Geciken**, **Biten** veya **Tümü** ile listeyi daraltın.', '[data-f=gec]'], ['Listeyi dosyaya almak için **CSV** düğmesine basın.', '#ex'], ['Kaydı açmak için satırdaki **Aç** düğmesine basın.', '[data-act=v]']] }] },
      { baslik: 'Yeni kayıt açma', sahneler: [
        { git: 'isler', adimlar: [[`**Yeni ${c.is}** düğmesine basın.`, '#ni']] },
        { git: 'isler', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1050, adimlar: [['Müşteriyi **Telefonla bul** ile arayın. Telefon kayıtlıysa müşteri ve adres gelir.', '#sf'], ['Yeni müşteri için **Yeni** düğmesine basın.', '#smn'], ['**Hizmet** yazın veya listeden seçin. Fiyat ve kontrol listesi **Hizmetler** kaydından gelir.', '[name=title]'], [`**Tarih** ve saati girin, ${c.ekip.toLocaleLowerCase('tr')} seçin.`, '[name=team]'], ['**Adres** müşteri kaydından gelir, değiştirebilirsiniz.', '[name=addr]'], ...(c.formEk || []), KAYDET] }] },
      { baslik: 'Sahada çalışma', ne: `Sırayla **Yola çıktım**, **Başladım** ve **İşi bitir** düğmelerine basılır. Yola çıkınca ve iş bitince müşteriye SMS gönderilmek istenir. Bitirirken kontrol listesi ve kalan tutar sorulur, sonra müşteri imzasıyla ${c.form.toLocaleLowerCase('tr')} yazdırılır. Yapılamayan iş için **Ertele** veya **Gelinmedi** düğmesiyle neden yazılır. Ertelenen kayıtta **Yeni tarih ver** çıkar.`, sahneler: [
        { git: 'isler', once: ILK, kirp: 'ana', adimlar: [['Bu düğmeler işin aşamasını değiştirir.', '[data-st=basladi]'], [`**${c.form}** imzalı belgeyi yazdırır.`, '[data-x=print]'], ['**Takip bağlantısı** müşteri sayfasının adresini kopyalar.', '[data-x=link]'], ['**Düzenle** kaydı değiştirir. **İptal** nedeni sorarak kapatır.', '[data-x=edit]']] },
        ...(ek.sahne || []),
        { git: 'isler', once: ILK, kirp: '.card@Saha raporu', boy: 2600, adimlar: [['Sahada yapılanı **Saha raporu** alanına yazın, **Raporu kaydet** düğmesine basın. Rapor müşteri sayfasında görünür.', '#rp']] },
        { git: 'isler', once: ILK, kirp: '.card@Fotoğraflar', boy: 2600, adimlar: [['Fotoğrafları **Fotoğraflar** kartından seçin. Bir kayda en fazla 12 fotoğraf eklenir.', '#ff']] },
        { git: 'isler', once: ILK, kirp: '.card@Geçmiş', boy: 2600, adimlar: [['Görüşme notunu buraya yazın, **Geçmiş** bölümüne eklenir.', '#nt']] }] },
      { baslik: 'Ücret ve tahsilat', ne: 'Hizmet seçildiğinde fiyat kalem olarak gelir. Ek kalemleri ve ödemeleri bu kartlardan girersiniz.', sahneler: [{ git: 'isler', once: ILK, kirp: `.card@${c.kalem}`, boy: 2600, adimlar: [[`**${c.kalem}** kartındaki **Kalem** düğmesi yeni satır açar.`, '[data-lt=kalem]'], ...(c.stokKalem === false ? [] : [[`**Stoktan** düğmesi ${c.stok} kaydından ürün ekler ve stoktan düşer.`, '[data-lt=stok]']])] },
        { git: 'isler', once: ILK, kirp: '.card@Ödemeler', boy: 2600, adimlar: [['**Ödemeler** kartındaki **Tahsilat** düğmesiyle ödemeyi girin.', '[data-pay=tahsilat]'], ...(c.kapora ? [['Kapora için **Kapora** düğmesini kullanın. İptalde **İade** ile geri ödemeyi kaydedin.', '[data-pay=kapora]']] : [])] }] },
      ...(ek.gorev || [])],
    alanlar: [['Süre (dakika)', 'Çakışma denetiminde kullanılır.'], ['Not', 'Kayıt detayında görünür.'], ...(ek.alan || [])],
    hatalar: [['Müşteri seçin uyarısı çıkıyor.', 'Telefonla bulun veya **Yeni** düğmesiyle müşteri ekleyin.'], ['Çakışma uyarısı çıkıyor.', 'Seçilen kişi veya araç aynı saatte başka işte. Saati değiştirin veya bilerek **Kaydet** seçin.'], ['Kontrol maddesi işaretlenmedi uyarısı çıkıyor.', 'Yapılan maddeleri işaretleyin. Bilerek bitirecekseniz **Bitir** seçin.'], ...(c.stokKalem === false ? [] : [['Önce stok kartı ekleyin uyarısı çıkıyor.', `**${c.stok}** sayfasından ürün ekleyin.`]]),['Bir işte en fazla 12 fotoğraf uyarısı çıkıyor.', 'Gereksiz fotoğrafı silin.'], ...(ek.hata || [])] }),

  musteriler: { id: 'musteriler', ne: 'Müşteri kartlarını ve açık bakiyeyi gösterir. Satırdaki **Geçmiş** düğmesi müşterinin kayıtlarını listeler. İşi olan müşteri silinemez.',
    gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
      { git: 'musteriler', adimlar: [['**Yeni müşteri** ile kayıt açın.', 'button@Yeni müşteri'], ['**Geçmiş** müşterinin kayıtlarını açar. Pencereden yeni kayıt da başlatılır.', '[data-act=gec]'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
      { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad / unvan** ve **Telefon** zorunludur.', '[name=name]'], ['**VKN / TCKN** e-Belgede ve belgelerde kullanılır.', '[name=taxNo]'], ['**Adres** yeni kayıtta kendiliğinden gelir.', '[name=address]'], KAYDET] }] }],
    hatalar: [['İşi olan müşteri silinemez uyarısı çıkıyor.', 'Geçmiş korunduğu için müşteri silinmez.']] },

  sozlesmeler: { id: 'sozlesmeler', ne: 'Periyodik hizmet verdiğiniz müşterilerin sıklığını ve ücretini tutar. Aktif sözleşmeden ziyaretler takvime kendiliğinden üretilir. Bu sayfayı yönetici ve ofis görür.',
    gorevler: [
      { baslik: 'Sözleşme açma', sahneler: [
        { git: 'sozlesmeler', adimlar: [['**Yeni sözleşme** düğmesine basın.', 'button@Yeni sözleşme'], ['**Ziyaretleri üret** takvimdeki eksik ziyaretleri ekler. Aynı gün ikinci kez yazılmaz.', '[data-uret]'], ['**Sözleşme yazdır** müşteri imzasıyla örnek şablonu basar.', c.sozBos ? null : '[data-act=pr]'], ['**Müşteri bağlantısı** tüm ziyaretleri gösteren sayfanın adresini verir.', c.sozBos ? null : '[data-act=ln]']] },
        { git: 'sozlesmeler', once: [['tikla', 'button@Yeni sözleşme']], kirp: 'pencere', boy: 1250, adimlar: [['**Müşteri** ve **Hizmet** zorunludur.', '[name=customer]'], ['**Sıklık** seçin. Haftalıkta **Günler (haftalıkta)** alanına Pzt, Çar, Cum gibi yazın.', '[name=freq]'], ['**Başlangıç** zorunludur. **Bitiş** boşsa sözleşme süresizdir.', '[name=start]'], ['**Ücret modeli** olarak **Aylık sabit** veya **Ziyaret başı** seçin, tutarı KDV hariç girin.', '[name=billing]'], ['**Gelinmeyen ziyaret aylık ücretten düşülsün** seçiliyse ücret oransal azalır.', '[name=missedCut]'], ['Her satıra bir madde yazarak **Kontrol listesi (her satır bir madde)** alanını doldurun.', '[name=checklist]'], KAYDET] }] }],
    alanlar: [['KDV oranı (%)', 'Mali müşavirinize danışın.']],
    hatalar: [['Günleri Pzt, Sal, Çar, Per, Cum, Cmt, Paz biçiminde yazın uyarısı çıkıyor.', 'Gün adlarını bu kısaltmalarla, virgülle ayırarak yazın.'], ['Bitiş, başlangıçtan önce olamaz uyarısı çıkıyor.', 'Tarihleri düzeltin.'], ['Faturası olan sözleşme silinemez, durdurun uyarısı çıkıyor.', '**Durum** alanını **Durduruldu** yapın.']] },

  faturalar: { id: 'faturalar', ne: 'Sözleşmeli müşterilerin dönem kayıtlarını hazırlar. Yapılan ve gelinmeyen ziyaretler döneme yazılır. Bu kayıt hesap özetidir, fatura yerine geçmez. e-Belge bağlıysa satırdan belge kesilir.',
    gorevler: [{ baslik: 'Dönem kaydı oluşturma', sahneler: [{ git: 'faturalar', boy: 900, adimlar: [['Ayı seçin.', '#dn'], ['Üstteki kutular **Dönem toplamı**, **Tahsil edilen**, **Açık** ve **Gelinmeyen ziyaret** bilgilerini gösterir.', '.kpi'], [`Hazırlanacak müşteriler için **dönem kaydı oluştur** düğmesine basın.`, c.faturaOl === false ? null : '#ol']] }] },
      ...(c.faturaOl === false ? [] : [{ baslik: 'Dönem kaydında çalışma', sahneler: [{ git: 'faturalar', once: [['tikla', '#ol']], boy: 900, adimlar: [['**Tahsilat** ödemeyi işler.', '[data-act=odeme]'], ['**Yazdır** dönem hesap özetini basar.', '[data-act=yaz]'], ['**Yeniden hesapla** ödeme ve e-Belge yoksa kaydı tazeler.', '[data-act=hesap]'], ['**Hatırlat** müşteriye ödeme hatırlatma SMS’i gönderir.', '[data-act=sms]']] }] }])],
    hatalar: [['Düğme görünmüyor.', 'Seçilen dönem için hazırlanacak sözleşme yoktur veya kayıt zaten oluşturulmuştur.'], ['Tutar girin uyarısı çıkıyor.', 'Tahsilat tutarı sıfırdan büyük olmalıdır.']] },

  ekipler: { id: 'ekipler', ne: `${c.ekipler} listesidir. **Açık iş** yükü ve müşteri puanını gösterir. Burada eklenen kayıt programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Açık işi olan kayıt silinemez.`,
    gorevler: [{ baslik: 'Kayıt ekleme', sahneler: [
      { git: 'ekipler', adimlar: [[`**${c.yeniEkip}** düğmesine basın.`, `button@${c.yeniEkip}`]] },
      { git: 'ekipler', once: [['tikla', `button@${c.yeniEkip}`]], kirp: 'pencere', adimlar: [['**Ad** yazın, **Üyeler** ve **Uzmanlık** ekleyin.', '[name=name]'], ['**Aktif** işaretli olmayan kayıt yeni iş listelerinde çıkmaz.', '[name=active]'], KAYDET] }] }] },

  hizmetler: { id: 'hizmetler', ne: 'Sunduğunuz hizmetleri, fiyatı ve kontrol listesini tutar. Yeni kayıtta hizmet seçilince fiyat ve maddeler gelir.',
    gorevler: [{ baslik: 'Hizmet ekleme', sahneler: [
      { git: 'hizmetler', adimlar: [['**Yeni hizmet** düğmesine basın.', 'button@Yeni hizmet']] },
      { git: 'hizmetler', once: [['tikla', 'button@Yeni hizmet']], kirp: 'pencere', adimlar: [['**Hizmet** adını yazın.', '[name=name]'], ['**Fiyat (₺)** yeni kayıtta kalem olarak gelir.', '[name=price]'], ['Her satıra bir madde yazın.', '[name=checks]'], KAYDET] }] }] },

  stok: (x = {}) => ({ id: 'stok', ne: x.ne || `Sahada kullanılan ürünleri ve stok miktarını tutar. Stok seviyesi kritik sınıra inince kırmızı görünür ve **Özet** sayfasına düşer.`,
    gorevler: [{ baslik: 'Stok yönetimi', sahneler: [
      { git: 'stok', adimlar: [['**Yeni ürün** düğmesine basın.', 'button@Yeni ürün'], ['**Kritik** süzgeci azalan ürünleri gösterir.', 'button@Kritik'], ['Mal gelince satırdaki **Stok girişi** düğmesiyle miktarı artırın.', '[data-act=gir]']] },
      { git: 'stok', once: [['tikla', 'button@Yeni ürün']], kirp: 'pencere', boy: 1000, adimlar: [...(x.adim || [['**Ad**, **Birim**, **Alış (₺)** ve **Satış (₺)** bilgilerini girin.', '[name=name]'], ['**Stok** eldeki miktar, **Kritik** uyarı sınırıdır.', '[name=stock]']]), KAYDET] }] }] }),

  bildirimler: { id: 'bildirimler', ne: 'Müşteriye gönderilen yola çıkış, bitiş, teklif ve hatırlatma mesajlarının kaydıdır. SMS sağlayıcısı bağlı değilse mesaj gönderilmez, kayıt TEST olarak görünür.',
    gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', adimlar: [['Mesaj gönderildikçe bu sayfada zaman, alıcı, mesaj ve durum olarak listelenir.', '#view']] }] }],
    hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını bağlayın.']] },

  ayarAlan: [['Varsayılan KDV oranı (%)', 'Yeni sözleşmede ve e-Belgede kullanılır. Mali müşavirinize danışın.'], ['Takvime kaç gün ileri ziyaret üretilsin', 'Sözleşmeden üretilecek ziyaretlerin ufku.'], ['Garanti süresi (gün; boşsa gösterilmez)', 'İş bitince garanti bitiş tarihi yazılır.'], ['Ücretsiz tekrar süresi (gün; boşsa gösterilmez)', 'İş bitince ücretsiz tekrar tarihi yazılır.'], ['Sözleşme metni (örnek şablon)', 'Belgedeki metin. Kullanmadan önce avukatınıza gösterin.'], ['Form alt notu', 'Formun altına yazılır.']],

  takipSahne: (x = {}) => [
    { adres: 'takip.html', ilk: 700, kirp: 'tam', adimlar: [['Müşteri 6 haneli kodu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k']] },
    { adres: 'takip.html', ilk: 700, once: [['js', KOD('tamam')]], kirp: 'tam', boy: 1000, adimlar: [['Kod bulununca müşteri aşamaları görür.', '.tk-steps'], ['İş bitince **Tamamlandı** bölümü açılır. Müşteri buradan puan ve görüş bırakır.', '.tk-call'], [`**${x.sorun || 'Sorun bildir'}** düğmesiyle sorununu yazar. Bildirim kaydın detayında ve **Özet** sayfasında görünür.`, '#sor']] }],

  ent: (x = {}) => ({
    sms: { degisir: ['Entegre et ile sağlayıcınızı seçin, bilgileri girin ve Bağlantıyı dene adımını yapın. Deneme geçmeden mesaj gönderilmez. Bilgileri değiştirirseniz denemeyi yineleyin.', 'Kayıt **Yola çıktım** ve **İşi bitir** adımlarında müşteriye takip bağlantılı mesaj gider.', ...(x.sms || []), 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken aynı kayıt TEST görünür, müşteriye bir şey gitmez.'], sorun: ['Kart Bağlantı hatası gösteriyorsa kullanıcı adı, şifre ve mesaj başlığını sağlayıcı panelinden kontrol edin, Bağlantıyı dene adımını yineleyin.', 'Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kaydında telefon yoksa gönderim yapılmaz.'] },
    whatsapp: { degisir: ['Bu programın iş ekranlarında WhatsApp düğmesi yoktur. Müşteri mesajları SMS ile gider.', 'Kurulum iş akışını değiştirmez.'], sorun: ['Müşteriye WhatsApp’tan yazmak için takip bağlantısını kopyalayıp kendiniz gönderin.'] },
    email: { degisir: ['İş ekranlarında e-posta gönderen bir düğme yoktur.', 'Ayar yalnız **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede ve e-Arşiv faturasının müşteriye iletilmesinde kullanılır.'], sorun: ['Gönderilemedi uyarısında sağlayıcı bilgilerini kontrol edin, Bağlantıyı dene adımını yineleyin.'] },
    printer: { degisir: ['Bu programın belgeleri tarayıcının yazdırma penceresiyle basılır. Yazıcı seçimi orada yapılır.', 'Kurulumdaki deneme adımı yazıcıya ulaşılıp ulaşılamadığını gösterir.'], sorun: ['Kâğıt boyu uymuyorsa pencereden veya belge şablonundan değiştirin.'] },
    pos: { degisir: ['Tahsilat pencereleri POS cihazına tutar göndermez. Çekimi cihazdan yapın, programda ödeme şekli olarak **Kart** seçin.'], sorun: ['Cihazla program arasında fark görürseniz tahsilat kaydını cihaz gün sonuyla karşılaştırın.'] },
    efatura: { degisir: ['Entegre et ile entegratörünüzü seçin, bilgileri girin ve Bağlantıyı dene adımını yapın.', `Bağlantı açıkken **Ödemeler** kartında **e-Belge** düğmesi çıkar.${x.fatura === false ? '' : ' **Aylık Faturalama** kayıtlarında da aynı işlem bulunur.'} Sağlayıcıda sınır yazıyorsa o sağlayıcının başlığı altında okuyun.`, 'Kesilen belge **e-Belgeler** sayfasında görünür ve kayda numarası yazılır.', 'Entegratör bağlı değilken oluşan belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Belge oluşturulamadı uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    webhook: { degisir: ['Bu programın işlemleri tanımladığınız adrese otomatik olay göndermez.', 'Bağlantıyı dene adımı adresinize yalnız imzalı bir deneme olayı gönderir.'], sorun: ['Deneme olayı gelmiyorsa hedef adresin internetten erişilebilir olduğunu kontrol edin.'] },
    backup: O.E.backup(),
  }),
});
module.exports = { ortak, KOD, KAYDET, ILK, KONTROLLU };
