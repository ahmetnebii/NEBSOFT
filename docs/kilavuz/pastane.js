// Fırın & Pastane kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js pastane
const SIP = [['tikla', '[data-act=v]']]; // listedeki ilk açık sipariş
const HAZIR = [['tikla', '[data-col=hazir] .sp-card']];
const TALEP = "document.head.insertAdjacentHTML('beforeend','<style>.nv-alert{display:none!important}</style>');NS.app.db.all('requests').length||NS.app.db.insert('requests',{name:'Selin Örnek',phone:'',address:'',note:'Doğum günü için 12 kişilik pasta',status:'yeni'});NS.app.refresh()"; // demoda talep yok: kurgu kayıt, açılır uyarı görüntüyü örtmesin
const KODLA = (d) => `(()=>{const k=Object.keys(localStorage).find((x)=>{try{return (JSON.parse(localStorage[x])||{}).orders}catch(e){return false}});const o=JSON.parse(localStorage[k]).orders.find((x)=>x.status==='${d}');document.querySelector('#k').value=o.code;document.querySelector('#go').click()})()`; // takip kodu rastgeledir: demo kaydından okunur
module.exports = (O) => ({
  ne: 'Fırın & Pastane, özel pasta ve toplu siparişleri kapora, teslim saati, pasta yazısı ve alerji bilgisiyle kaydeder. Teslim gününe göre üretim planı çıkarır, reçeteden malzeme ihtiyacını ve birim maliyeti hesaplar, üretilen ürünün malzemesini stoktan düşer, zayiyi kaydeder.',
  kimler: 'Pastaneler, fırınlar, ev yapımı pasta atölyeleri ve butik tatlı üreticileri. Tezgâh, usta ve kurye ile çalışan işletmelerde de, tek kişilik atölyede de kullanılır.',
  ilkNot: 'Üretim planının çalışması için ürünü reçeteye bağlayın: **Ürünler ve Fiyatlar** sayfasında üründe **Reçete** alanını seçin. Reçetesiz ürün plana düşmez.',
  ekrantanitim: [{ git: 'pano', kirp: 'tam', adimlar: [['Sol taraftaki menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['Üstteki **Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'İşletmenin durumunu tek ekranda gösterir: açık işler, ciro, tahsil edilecek tutar, bugünkü sipariş, eldeki kapora, kritik malzeme ve geciken işler. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1250, adimlar: [['Üstteki kutular **Açık iş**, **30 gün ciro**, **Tahsil edilecek** ve **Müşteri puanı** bilgilerini gösterir.', '.kpi'], ['**Bugünkü sipariş**, **Eldeki kapora** ve **Kritik malzeme** kutularına bakın.', '.kpi@Eldeki kapora'], ['**Geciken işler** listesinde söz verilen saati geçen siparişler görünür.', 'h3@Geciken işler'], ['**Teslim alınmayanlar** listesinde 3 gün ve üzeri hazır bekleyen siparişler görünür.', 'h3@Teslim alınmayanlar']] }] }],
      hatalar: [['Ciro beklediğimden düşük.', 'Ciro teslim edilen siparişlerden hesaplanır. Teslim edilmemiş siparişler **Tahsil edilecek** tutarında görünür.']] },

    { id: 'pano', ne: 'Açık siparişleri aşamalara göre sütunlarda gösterir: **Sipariş alındı**, **Üretimde**, **Süsleme**, **Hazır**. Kartı sürükleyerek veya açıp durum düğmesine basarak ilerletirsiniz.',
      gorevler: [
        { baslik: 'Özel sipariş alma', ne: 'Telefon numarasını yazınca kayıtlı müşteri bulunur, yoksa kaydederken yeni müşteri oluşur.', sahneler: [
          { git: 'pano', adimlar: [['**Yeni sipariş** düğmesine basın.', '#ni'], ['Üstteki kutular **Açık iş**, **Bugün teslim**, **Hazır bekleyen** ve **Geciken** sayılarını gösterir.', '.kpi'], ['Kayıtlı siparişi bulmak için arama kutusunu kullanın.', '#q']] },
          { git: 'pano', once: [['tikla', '#ni']], kirp: 'pencere', boy: 1350, adimlar: [['Müşterinin **Telefon** numarasını ve **Müşteri adı** bilgisini yazın.', '#sp-ph'], ['Ürünü yazın veya listeden seçin, fiyat kendiliğinden gelir.', '#sp-ls'], ['Birden çok ürün için **Satır ekle** düğmesini kullanın.', '#sp-add'], ['**Teslim tarihi** ve **Teslim saati** zorunludur.', '[name=dueTime]'], ['Kurye götürecekse **Teslim şekli** alanından **Adrese teslim** seçin.', '[name=mode]'], ['**Kişi sayısı** ve **Tat / iç** bilgisini yazın.', '[name=kisi]'], ['**Pasta üzerindeki yazı** alanına yazıyı harfi harfine yazın. Fişe ve üretime aynen geçer.', '[name=yazi]'], ['**Alerji ve hassasiyet** alanı doluysa sipariş kartında kırmızı görünür.', '[name=alerjen]'], ['Alınan kaporayı **Kapora (₺)** alanına yazın.', '[name=deposit]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] },
        { baslik: 'Siparişi ilerletme', sahneler: [{ git: 'pano', kirp: 'ana', en: 1500, adimlar: [['Kartı sürükleyin veya açıp durum düğmesine basın.', '.sp-card'], ['Hazır olan siparişler bu sütunda bekler.', '[data-col=hazir]']] }] }],
      alanlar: [['Usta', 'Siparişi hazırlayacak kişi.'], ['Teslim şekli', 'Mağazadan teslim veya Adrese teslim.'], ['Müşteriye görünen not', 'Fişe yazılır.'], ['İç not (müşteri görmez)', 'Yalnız çalışanlar görür.'], ['İndirim (₺)', 'Toplamdan düşülür.'], ['Ödeme şekli', 'Kaporanın nasıl alındığı.']],
      hatalar: [['Teslim saatini yazın uyarısı çıkıyor.', 'Bu programda teslim saati zorunludur.'], ['Kapora alınmadan üretime geçilmez uyarısı çıkıyor.', '**Ayarlar** sayfasındaki **Kapora alınmadan üretime geçilmesin** seçeneği açıktır. Önce tahsilat girin.'], ['Telefon numarası 10 hane olmalı uyarısı çıkıyor.', 'Numarayı alan koduyla birlikte yazın.'], ['Teslim tarihi geçmişte olamaz uyarısı çıkıyor.', 'Yeni siparişte bugünü veya sonraki bir günü seçin.']] },

    { id: 'siparisler', ne: 'Tüm siparişlerin listesidir. Siparişe girince kalemler, sipariş kartı, fotoğraflar, ödeme ve geçmiş tek sayfada görünür.',
      gorevler: [
        { baslik: 'Sipariş arama', sahneler: [{ git: 'siparisler', adimlar: [['Arama kutusuna sipariş numarası, müşteri, telefon veya kalem yazın.', '#q'], ['**Açık**, **Teslim edilen**, **İptal** veya **Tümü** ile listeyi süzün.', '[data-f=teslim]'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesine basın.', '#ex'], ['Siparişi açmak için satırdaki **Aç** düğmesine basın.', '[data-act=v]']] }] },
        { baslik: 'Sipariş detayında çalışma', sahneler: [
          { git: 'siparisler', once: SIP, kirp: 'ana', adimlar: [['Üstteki adımlar siparişin aşamasını gösterir.', '.sp-steps'], ['Bu düğme siparişi bir sonraki aşamaya geçirir.', '[data-st]'], ['**Fiş** sipariş fişini yazdırır.', '[data-x=print]'], ['**WhatsApp** müşteriyle sohbeti açar. **Takip** müşteri sayfasını açar ve adresini kopyalar.', '[data-x=wa]'], ['**Düzenle** kaydı değiştirir. **İptal** ile siparişi iptal eder, varsa iade tutarını yazarsınız.', '[data-x=edit]']] },
          { git: 'siparisler', once: SIP, kirp: 'ana', boy: 1300, adimlar: [['**Örnek görsel ve teslim fotoğrafı** kartında müşterinin örnek görselini saklayın.', 'label.btn'], ['**Sipariş kartı** yazı, kişi sayısı, tat ve alerjiyi üretim için toplar.', 'h3@Sipariş kartı'], ['Ara ödemeyi **Tahsilat** düğmesiyle girin.', '[data-x=pay]']] }] },
        { baslik: 'Teslim etme', ne: 'Son aşamada **Teslim et** düğmesi çıkar. Kalan tutar varsa tahsilat sorulur, adrese teslimde teslim alan kişi yazılır, teslim belgesi yazdırılır.', sahneler: [{ git: 'pano', once: HAZIR, kirp: 'ana', adimlar: [['**Teslim et** düğmesine basın.', '[data-x=teslim]'], ['Müşteriye yeniden haber vermek için **Hazır SMS’i gönder** düğmesini kullanın.', '[data-x=tekrar]']] }] }],
      alanlar: [['Teslim alan kişi', 'Adrese teslimde zorunludur.'], ['Teslim notu', 'Örneğin komşuya bırakıldı.'], ['İptal nedeni', 'Sipariş iptal edilirken zorunludur.']],
      hatalar: [['İade, alınan tutarı aşamaz uyarısı çıkıyor.', 'İptal penceresinde iade tutarını alınan tutar veya altı yazın. İade yapmadıysanız 0 yazın.'], ['Müşterinin telefonu yok uyarısı çıkıyor.', 'Müşteri kaydına telefon ekleyin. Telefonsuz müşteriye SMS gönderilmez.']] },

    { id: 'takvim', ne: 'Önümüzdeki 7 günün teslimlerini saate göre sıralar. Tarihi geçen siparişler en üstte toplanır.',
      gorevler: [{ baslik: 'Teslimleri görme', sahneler: [{ git: 'takvim', adimlar: [['Sipariş numarasına tıklayarak detaya geçin.', 'table a']] }] }] },

    { id: 'dagitim', ne: '**Adrese teslim** seçilmiş ve **Hazır** durumundaki siparişleri listeler. **Kurye** rolüyle giren kullanıcı kendisine atanan işleri görür.',
      gorevler: [{ baslik: 'Adrese teslim', sahneler: [{ git: 'dagitim', adimlar: [['Yönetici ve tezgâh üstteki listeden kuryeye göre süzer.', '#kf']] }] }],
      hatalar: [['Sipariş bu listede görünmüyor.', 'Siparişte **Adrese teslim** seçili olmalı ve sipariş **Hazır** durumunda olmalıdır.']] },

    { id: 'talepler', ne: 'Müşterinin takip sayfasındaki **Özel sipariş talebi** formundan gönderdiği istekler buraya düşer. Talep, siz siparişe çevirene kadar sipariş sayılmaz.',
      gorevler: [{ baslik: 'Talebi siparişe çevirme', sahneler: [{ git: 'talepler', once: [['js', TALEP]], adimlar: [['Satırda talebi yazan kişi ve istek görünür.', 'table tbody tr'], ['**Siparişe çevir** yeni sipariş penceresini talep bilgileriyle açar.', '[data-act=cv]'], ['İşi almayacaksanız **Reddet** düğmesine basın.', '[data-act=rd]']] }] }] },

    { id: 'uretim', ne: 'Seçilen günün üretimini tek listede toplar: o gün teslim edilecek siparişlerin reçeteli ürünleri ile tezgâh için elle planlanan üretim. Yanında reçetelerden hesaplanan malzeme ihtiyacı ve eksikler görünür.',
      gorevler: [
        { baslik: 'Günün planını çıkarma', sahneler: [{ git: 'uretim', adimlar: [['Tarihi seçin. Sayfa bugünle açılır.', '#g'], ['Tezgâh için üretilecekleri **Tezgâh üretimi** ile ekleyin.', '#ek'], ['Listeyi mutfağa vermek için **Yazdır** düğmesini kullanın. Eksik malzemeler altına yazılır.', '#pr'], ['Üretim bitince satırdaki **Üretildi** düğmesine basın. Reçete malzemesi stoktan düşer, aynı satır iki kez düşmez.', '[data-act=ok]'], ['**Malzeme ihtiyacı** tablosu gereken miktarı ve eksiği gösterir.', 'h3@Malzeme ihtiyacı']] }] },
        { baslik: 'Tezgâh üretimi ekleme', sahneler: [{ git: 'uretim', once: [['tikla', '#ek']], kirp: 'pencere', adimlar: [['**Reçete** seçin.', '[name=rc]'], ['**Miktar** yazın.', '[name=qty]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Sipariş plana düşmüyor.', 'Üründe reçete seçili olmalı ve teslim tarihi seçilen gün olmalıdır.'], ['Eksik malzeme görünüyor.', 'Malzemenin stoğunu **Malzemeler** sayfasından güncelleyin.']] },

    { id: 'receteler', ne: 'Ürünlerin malzeme miktarlarını tutar. Yönetici ve tezgâh birim maliyeti, satış fiyatını ve kâr oranını görür. **Usta** rolü yalnız malzeme miktarlarını görür.',
      gorevler: [{ baslik: 'Reçete yazma', sahneler: [
        { git: 'receteler', adimlar: [['**Yeni reçete** düğmesine basın.', '#nw'], ['Satırdaki **Düzenle** ile reçeteyi değiştirin.', '[data-act=e]']] },
        { git: 'receteler', once: [['tikla', '#nw'], ['tikla', '#ad']], kirp: 'pencere', adimlar: [['**Reçete adı** yazın.', '[name=name]'], ['**Bu reçeteden çıkan miktar** alanına reçetenin verdiği adedi yazın. Birim maliyet buna bölünerek bulunur.', '[name=yield]'], ['**Malzeme ekle** ile satır açın, malzeme ve miktarı girin.', '#ad'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Eksik fiyat etiketi çıkıyor.', 'Reçetedeki bir malzemenin birim maliyeti girilmemiştir. **Malzemeler** sayfasından ekleyin.']] },

    { id: 'malzemeler', ne: 'Hammaddelerin birim maliyetini, stoğunu ve kritik seviyesini tutar. Stok **Üretildi** işlemiyle düşer. Mal aldığınızda stoğu satırdaki **Düzenle** ile artırın, bu programda ayrı alış ekranı yoktur.',
      gorevler: [{ baslik: 'Malzeme ekleme', sahneler: [
        { git: 'malzemeler', adimlar: [['**Yeni malzeme** düğmesine basın.', 'button@Yeni malzeme'], ['**Kritik** süzgeci azalan malzemeleri gösterir.', 'button@Kritik'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
        { git: 'malzemeler', once: [['tikla', 'button@Yeni malzeme']], kirp: 'pencere', adimlar: [['**Ad** ve **Birim** girin.', '[name=name]'], ['**Birim maliyet (₺)** reçete maliyetinde kullanılır.', '[name=cost]'], ['**Stok** eldeki miktardır. **Kritik** bu seviyeye inince malzeme uyarıda görünür.', '[name=stock]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }] },

    { id: 'zayi', ne: 'Bayat, kırık ve yanlış üretilen ürünleri kaydeder. Üstteki kutular nedenlere göre toplamı gösterir. Maliyet reçeteden hesaplanır.',
      gorevler: [{ baslik: 'Zayi kaydetme', sahneler: [
        { git: 'zayi', adimlar: [['**Zayi kaydet** düğmesine basın.', '#nw']] },
        { git: 'zayi', once: [['tikla', '#nw']], kirp: 'pencere', adimlar: [['**Reçete** seçin.', '[name=rc]'], ['**Miktar** yazın.', '[name=qty]'], ['**Neden** seçin.', '[name=reason]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      not: 'Zayi kaydı stoktan malzeme düşmez, kayıp maliyetini izlemenizi sağlar.' },

    { id: 'musteriler', ne: 'Müşteri kartlarını, sipariş sayısını, harcamayı ve borcu gösterir. Müşteri ilk siparişte kendiliğinden oluşur. Siparişi olan müşteri silinemez.',
      gorevler: [{ baslik: 'Müşteri ekleme', sahneler: [
        { git: 'musteriler', adimlar: [['**Yeni müşteri** ile kayıt açın.', 'button@Yeni müşteri'], ['Listeyi dosyaya almak için **Excel (CSV)** düğmesini kullanın.', 'button@Excel (CSV)']] },
        { git: 'musteriler', once: [['tikla', 'button@Yeni müşteri']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      hatalar: [['Müşteri silinmiyor.', 'Sipariş kaydı olan müşteri silinemez, geçmiş korunur.']] },

    { id: 'fiyatlar', ne: 'Siparişte seçilen ürünleri ve fiyatlarını tutar. Ürünü reçeteye bağlayınca üretim planına ve kâr hesabına girer. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Ürün ekleme', sahneler: [
        { git: 'fiyatlar', adimlar: [['**Yeni kalem** düğmesine basın.', 'button@Yeni kalem'], ['Mevcut ürünü **Düzenle** ile değiştirin.', 'button@Düzenle']] },
        { git: 'fiyatlar', once: [['tikla', 'button@Yeni kalem']], kirp: 'pencere', adimlar: [['**Ad** yazın, **Kategori** ile gruplayın.', '.field@Ad'], ['**Birim** alanından adet, kg, dilim veya tepsi seçin.', '.field@Birim'], ['**Satış fiyatı (₺)** zorunludur.', '.field@Satış fiyatı'], ['**Reçete** seçin. Seçmezseniz ürün üretim planına düşmez.', '[name=rc]'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }],
      alanlar: [['Teslim süresi (gün)', 'Ürünün ne kadar sürdüğüne dair bilgi notu.']] },

    { id: 'personel', ne: 'Usta ve kuryeleri tutar. **Açık iş** sütunu her kişinin üzerindeki iş sayısını gösterir. Burada eklenen kişi programa giriş yapamaz, giriş için **Ayarlar** sayfasından kullanıcı açın. Bu sayfayı yalnız yönetici görür.',
      gorevler: [{ baslik: 'Personel ekleme', sahneler: [
        { git: 'personel', adimlar: [['**Yeni personel** düğmesine basın.', 'button@Yeni personel']] },
        { git: 'personel', once: [['tikla', 'button@Yeni personel']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın, **Telefon** ve **Görev** ekleyin.', '.field@Ad soyad'], ['Teslimat yapıyorsa **Kurye / şoför** kutusunu işaretleyin.', '.field@Kurye / şoför'], ['**Kaydet** düğmesine basın.', '.ns-overlay button.primary']] }] }] },

    { id: 'bildirimler', ne: 'Müşteriye gönderilen hazır ve hatırlatma mesajlarının kaydıdır. SMS sağlayıcısı bağlı değilse mesaj gönderilmez, kayıt **TEST: gönderilmedi** olarak görünür.',
      gorevler: [{ baslik: 'Gönderim kaydına bakma', sahneler: [{ git: 'bildirimler', adimlar: [['Mesaj gönderildikçe bu sayfada zaman, alıcı, mesaj ve durum olarak listelenir.', '#view']] }] }],
      hatalar: [['Mesaj müşteriye gitmedi.', 'Kayıt TEST görünüyorsa SMS bağlı değildir. **Entegrasyonlar** sayfasından SMS sağlayıcısını bağlayın.']] },

    O.belgeler({ tur: 'Sipariş fişi' }),
    O.ayarlar({ alanlar: [['Varsayılan teslim süresi (gün)', 'Yeni siparişte teslim tarihinin kaç gün sonrası önerileceği.'], ['Aynı tarih ve saate en çok iş (boşsa sınır yok)', 'Sınıra ulaşınca program sorar, isterseniz yine eklersiniz.'], ['İş hazır olunca müşteriye otomatik SMS', 'Sipariş Hazır durumuna geçince SMS gönderilmek istenir. SMS sağlayıcısı bağlı değilse gönderilmez.'], ['Kayıttan sonra fişi yazdır', 'Yeni sipariş kaydedilince fiş yazdırma açılır.'], ['KDV oranı (%)', 'e-Belge satırlarına yazılır. Oranı muhasebecinize doğrulatın.'], ['Kapora alınmadan üretime geçilmesin', 'Açıksa ödemesiz sipariş Üretimde durumuna geçmez.'], ['Fişe yazılacak iptal ve kapora koşulunuz', 'Fişin altına yazılır. Metni kendi hukuk danışmanınıza doğrulatın, program hazır metin vermez.']] }),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Usta rolü panoyu, siparişleri, takvimi, dağıtımı ve üretim sayfalarını görür, maliyet ve kâr bilgisini görmez. Kurye **Dağıtım** sayfasıyla çalışır. Özet, fiyatlar, personel ve yönetim sayfaları yöneticiye aittir.',
  musteri: [{ ad: 'Sipariş takip sayfası', ne: 'Müşteri fişindeki 8 haneli takip koduyla siparişin aşamasını, teslim saatini ve kalan tutarı görür. Teslimden sonra puan ve yorum bırakabilir. **Özel sipariş talebi** formuyla da istek gönderir. Üyelik gerekmez. Adresi sipariş detayındaki **Takip** düğmesiyle alırsınız.',
    sahneler: [
      { adres: 'takip.html', ilk: 700, kirp: 'tam', boy: 1050, adimlar: [['Müşteri kodunu bu kutuya yazıp **Sorgula** düğmesine basar.', '#k'], ['**Özel sipariş talebi** formundan gelen istek **Gelen Talepler** sayfasına düşer.', '#ts']] },
      { adres: 'takip.html', ilk: 700, once: [['js', KODLA('hazir')]], kirp: 'tam', boy: 1000, adimlar: [['Kod bulununca müşteri aşamaları görür.', '.tk-steps'], ['Sipariş hazırsa ödenecek tutar burada yazar.', '.tk-call'], ['**Hareketler** bölümünde tarihli durum geçmişi görünür.', '.tk-tl']] }] }],
  yazdirma: { ne: 'Belgeler ilgili ekrandan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Sipariş fişi', 'Sipariş detayında **Fiş** düğmesi. Ayarlarda açıksa kayıttan sonra da açılır.'], ['Teslim belgesi', 'Teslim sırasında otomatik açılır. Sonradan teslim edilmiş siparişte **Teslim belgesi** düğmesiyle.'], ['Üretim planı', '**Üretim Planı** sayfasında **Yazdır** düğmesi.']] },

  entegrasyon: {
    sms: { degisir: ['Entegre et ile sağlayıcınızı seçin, bilgileri girin ve Bağlantıyı dene adımını yapın. Deneme geçmeden mesaj gönderilmez. Bilgileri değiştirirseniz denemeyi yineleyin.', 'Sipariş **Hazır** durumuna geçince, Ayarlardaki seçenek açıksa müşteriye hazır mesajı gider.', 'Sipariş detayındaki **Hazır SMS’i gönder** ve Özet sayfasındaki **Hatırlat** düğmesi SMS gönderir.', 'Gönderimler **SMS Bildirimleri** sayfasına işlenir. Bağlantı yokken aynı kayıt TEST görünür, müşteriye bir şey gitmez.'], sorun: ['Kart Bağlantı hatası gösteriyorsa kullanıcı adı, şifre ve mesaj başlığını sağlayıcı panelinden kontrol edin, Bağlantıyı dene adımını yineleyin.', 'Kayıt hata gösteriyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Müşteri kaydında telefon yoksa gönderim yapılmaz.'] },
    whatsapp: O.E.whatsappLink('Sipariş detayındaki **WhatsApp** düğmesi'),
    email: { degisir: ['Sipariş ekranlarında e-posta gönderen bir düğme yoktur.', 'Ayar yalnız **e-Belgeler** sayfasındaki belgeyi e-postayla göndermede ve e-Arşiv faturasının müşteriye iletilmesinde kullanılır.'], sorun: ['Gönderilemedi uyarısında sağlayıcı bilgilerini kontrol edin, Bağlantıyı dene adımını yineleyin.'] },
    printer: { degisir: ['Bu programdaki sipariş fişi, teslim belgesi ve üretim planı tarayıcının yazdırma penceresiyle basılır. Yazıcı seçimi orada yapılır.', 'Kurulumdaki deneme adımı yazıcıya ulaşılıp ulaşılamadığını gösterir.'], sorun: ['Fiş kâğıdı dar çıkıyorsa **Belge şablonları** sayfasından kâğıt boyunu seçin.'] },
    efatura: { degisir: ['Entegre et ile entegratörünüzü seçin, bilgileri girin ve Bağlantıyı dene adımını yapın.', 'Bağlantı açıkken teslim penceresinde **e-Arşiv / e-Fatura kes** seçeneği çıkar. Sağlayıcıda sınır yazıyorsa o sağlayıcının başlığı altında okuyun.', 'Kesilen belge **e-Belgeler** sayfasında görünür ve sipariş kaydına numarası yazılır.', 'Entegratör bağlı değilken oluşan belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    backup: O.E.backup(),
  },
});
