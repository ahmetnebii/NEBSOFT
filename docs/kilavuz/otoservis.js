// Oto Servis kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js otoservis
const ONAY = `(()=>{const d=JSON.parse(localStorage['nebsoft:otoservis']);const j=d.jobs.find((x)=>x.status==='hazir')||d.jobs[0];const k=(j.id.replace(/\\W/g,'').slice(-6)+j.no.replace(/\\D/g,'')).toUpperCase();document.body.innerHTML='<iframe id="onay" style="position:fixed;inset:0;width:100%;height:100%;border:0" src="onay.html?k='+k+'"></iframe>';})()`;
module.exports = (O) => ({
  ne: 'Oto Servis programı, aracın kabulünden teslimine kadar iş emrini yönetir. Hasar ve yakıt durumu kaydedilir, parça ve işçilik kalem kalem yazılır, müşteri teklifi linkten onaylar, teslimde tahsilat alınır. Muayene, sigorta ve bakım zamanı gelen araçlar hatırlatma listesine düşer.',
  kimler: 'Sanayi tamircileri, özel oto servisler, kaporta ve boya atölyeleri, filo müşterisi olan servisler. Tek ustalı atölyede de, danışmanı ve birden çok teknisyeni olan serviste de kullanılır.',
  ilkNot: '**Ayarlar** sayfasındaki **İşçilik saat ücreti (₺)**, **Bakım aralığı (km)** ve **İşçilik garantisi (gün)** alanlarını ilk iş emrinden önce doldurun.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Servisteki araç sayısını, onay bekleyen işleri, 30 günlük ciroyu, açık hesabı, teknisyen yükünü ve azalan parçaları gösterir. Teknisyen rolü bu sayfayı görmez.',
      gorevler: [{ baslik: 'Durumu okuma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1100, adimlar: [['**Servisteki araç** ve yanındaki kutular günün durumunu verir. **Açık hesap** müşterilerin borç toplamıdır.', '.kpi'], ['**Araç kabul** düğmesi yeni servis açar.', 'a@Araç kabul']] }] }] },

    { id: 'kabul', ne: 'Araç geldiğinde servis burada açılır. Plaka, müşteri adı veya telefon yazınca kayıtlı araç gelir. Kayıt yoksa aynı ekranda yeni araç ve müşteri açılır.',
      gorevler: [{ baslik: 'Araç kabul etme', sahneler: [
        { git: 'kabul', kirp: 'ana', once: [['yaz', '#q', '34 AB 430']], adimlar: [['Plaka, müşteri adı veya telefon yazın. Kayıtlı araç listede çıkar. Yoksa **Yeni kayıt** satırına basın.', '#q']] },
        { git: 'kabul', kirp: 'ana', boy: 1500, once: [['yaz', '#q', '34 XY 123'], ['tikla', 'button@Yeni kayıt']], adimlar: [['**Plaka** ve **Güncel km** zorunludur. Marka, model ve şase bilgisini de girin.', '.field@Güncel km'], ['**Ad soyad / firma** ve **Cep telefonu** yazın. SMS bu numaraya gider.', '.field@Cep telefonu'], ['**Şikâyet ve talep** kutusuna yazın veya hazır düğmelerden seçin.', '#cpl'], ['**Hasar krokisi** üzerinde aracın mevcut izlerini işaretleyin.', '#dmg'], ['**Yakıt seviyesi** ve **Araçta bırakılanlar** bölümlerini doldurun.', '#fuel'], ['**Servisi aç ve iş emrine geç** düğmesine basın. **Kabul formunu yazdır** işaretliyse form yazdırılır.', '#sv']] }] }],
      hatalar: [['Şikâyet / talep yazın uyarısı çıkıyor.', 'Şikâyet kutusunu doldurun veya hazır düğmelerden birini seçin.'], ['Bu aracın açık iş emri var uyarısı çıkıyor.', 'Araç zaten serviste görünüyor. Yeni kayıt açmadan önce açık iş emrini kontrol edin.']] },

    { id: 'isemirleri', ne: 'Servisteki araçları durum sütunlarında, bitmiş işleri alttaki tabloda gösterir. Teknisyen rolü yalnız kendine atanan araçları görür. Karta tıklayınca iş emri açılır.',
      gorevler: [
        { baslik: 'İş emirlerini izleme', sahneler: [{ git: 'isemirleri', kirp: 'ana', en: 1450, adimlar: [['Plaka, müşteri veya iş emri numarası yazın.', '#q'], ['Sütunlar işin aşamasıdır. Karta tıklayın.', '#kb'], ['**Araç kabul** yeni servis açar.', 'a@Araç kabul']] }] },
        { baslik: 'İş emrinde çalışma', ne: 'Üstteki düğmeler işin aşamasına göre değişir. Sıra: **Arıza tespit**, **Müşteri onayı bekliyor**, **Tamirde**, **Teslime hazır**, **Teslim edildi**.', sahneler: [
          { git: 'isemirleri', once: [['tikla', '#kb [data-j]']], kirp: 'ana', en: 1450, boy: 1000, adimlar: [['**İş emri** belgeyi yazdırır.', 'button@İş emri'], ['Buradaki düğmeler işi ilerletir. **Müşteri onayına gönder** müşteriye onay linki yollar. **Onaysız tamire al** telefonda alınan onay içindir. **İşlemsiz teslim** aracı işlem yapmadan kapatır.', '[data-flow]'], ['**Parça**, **İşçilik** ve **Dış hizmet** düğmeleriyle satır açın.', '[data-add=parca]'], ['**Paket ekle** katalogdaki bakım paketini, **İşçilik kataloğu** hazır işçiliği ekler.', '[data-pack]'], ['Hızlı ekleme için parça kodu veya işlem adını yazıp Enter’a basın.', '#qn']] },
          { git: 'isemirleri', once: [['tikla', '#kb [data-j]']], kirp: 'ana', en: 1450, boy: 1500, adimlar: [['**Müşteri şikâyeti** ve **Teknisyen tespiti** kutularını doldurun.', 'textarea[data-j=finding]'], ['**Kabul imzası al** müşteriye ekranda imza attırır.', '[data-signin]']] }] },
        { baslik: 'Teslim etme', ne: 'Son aşamada teslim düğmesine basınca teslim penceresi açılır. **Tahsil edilen (₺)**, **Ödeme**, **Çıkış km** ve **Sonraki bakım km** alanlarını doldurun. **Cari hesaba (veresiye)** seçilirse tutar müşterinin borcuna yazılır. **e-Arşiv fatura kes** işaretlenirse fatura kesilir. **Teslim — müşteri imzası** adımında müşteri imzalar. Parça stoktan tamir bitince düşer.', sahneler: [] }],
      alanlar: [['Teknisyen', 'İşi yapacak kişi. Teknisyen rolündeki kullanıcı yalnız kendi işini görür.'], ['İnd. %', 'Satıra uygulanan indirim.'], ['Onay', 'Müşterinin kalemi onaylayıp onaylamadığı.']],
      hatalar: [['Önce işlem kalemlerini ekleyin uyarısı çıkıyor.', 'Müşteri onayına göndermeden önce en az bir parça veya işçilik ekleyin.'], ['Onay bekleyen kalem yok uyarısı çıkıyor.', 'Tüm kalemler onaylıdır, yeni kalem ekleyin veya işe devam edin.'], ['Kalemler müşteri onayı almadan faturalanacak sorusu çıkıyor.', 'Onay almadan devam ederseniz kalemler onaylanmış sayılır. Önce müşteriyle görüşün.'], ['Müşteri imzası alınmadan teslim edilsin mi sorusu çıkıyor.', 'İmza olmadan da teslim edilir, ancak teslim formunda imza boş kalır.'], ['e-Arşiv kesilemedi uyarısı çıkıyor.', '**e-Belgeler** sayfasındaki hata ayrıntısına bakın.']] },

    { id: 'araclar', ne: 'Araçları plaka bazında, km, ziyaret, muayene ve sigorta tarihiyle tutar. Teknisyen rolü bu sayfayı görmez.',
      gorevler: [{ baslik: 'Araç kartları', sahneler: [
        { git: 'araclar', kirp: 'ana', adimlar: [['**Araç ekle** yeni kart açar.', 'button@Araç ekle'], ['**Muayenesi yaklaşan** ve **Sigortası yaklaşan** süzgeçleri süresi yaklaşan araçları ayırır.', 'button@Muayenesi yaklaşan'], ['**Geçmiş / yeni iş emri** aracın servis geçmişine ve **Servis Aç** ekranına götürür.', 'button@Geçmiş / yeni iş emri'], ['**Servis karnesi yazdır** aracın geçmiş işlerini belge olarak basar.', 'button@Servis karnesi yazdır']] },
        { git: 'araclar', once: [['tikla', 'button@Araç ekle']], kirp: 'pencere', boy: 900, adimlar: [['**Plaka** yazın, **Sahibi** seçin.', '.field@Plaka'], ['**Muayene bitiş** ve **Sigorta bitiş** tarihleri **Hatırlatmalar** sayfasını besler.', '.field@Muayene bitiş'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'hatirlatma', ne: 'Muayenesi, sigortası veya bakımı yaklaşan araçları hazır mesajla listeler. SMS bağlı değilse mesaj müşteriye gitmez.',
      gorevler: [{ baslik: 'Hatırlatma gönderme', sahneler: [{ git: 'hatirlatma', kirp: 'ana', adimlar: [['**Tümüne SMS gönder** listedeki herkese gönderir, önce onay ister.', '#all'], ['Satırdaki **SMS gönder** tek müşteriye gönderir.', 'button@SMS gönder'], ['**WhatsApp ile gönder** sohbeti hazır mesajla açar.', 'button@WhatsApp ile gönder']] }] }],
      hatalar: [['Liste boş.', 'Araç kartlarında muayene ve sigorta tarihi yazılı değildir veya süresi yaklaşan araç yoktur.']] },

    { id: 'parcalar', ne: 'Yedek parçaları kodu, stoğu, alış ve satış fiyatı, kâr oranıyla tutar. İş emrinde kullanılan parça tamir bitince stoktan düşer. Teknisyen rolü bu sayfayı görmez.',
      gorevler: [
        { baslik: 'Parça ekleme', sahneler: [
          { git: 'parcalar', kirp: 'ana', adimlar: [['**Parça ekle** yeni kart açar.', 'button@Parça ekle'], ['**Azalan** süzgeci **En az stok** altına inen parçaları gösterir.', 'button@Azalan'], ['**Sipariş listesine al** parçayı sipariş listesine ekler.', 'button@Sipariş listesine al']] },
          { git: 'parcalar', once: [['tikla', 'button@Parça ekle']], kirp: 'pencere', adimlar: [['**Kod** ve **Parça adı** zorunludur.', '.field@Parça adı'], ['**Alış (₺)**, **Satış (₺)**, **Stok** ve **En az stok** alanlarını doldurup **Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Tedarikçi sipariş listesi', ne: 'Program parçayı tedarikçiye otomatik sipariş etmez. Listeyi kopyalayıp kendiniz gönderirsiniz.', sahneler: [{ git: 'parcalar', once: [['tikla', 'button@Kritik stok sipariş listesi']], kirp: 'pencere', adimlar: [['**Tedarikçi WhatsApp numarası (isteğe bağlı)** alanına numarayı yazabilirsiniz.', '#sup'], ['**CSV indir**, **Kopyala** veya **WhatsApp ile gönder** ile listeyi iletin.', 'button@WhatsApp ile gönder']] }] }] },

    { id: 'katalog', ne: 'Sık yapılan işçilikleri ve tek tıkla eklenen bakım paketlerini tutar. Sayfanın adı içeride **Hizmet kataloğu** olarak yazar. Teknisyen rolü bu sayfayı görmez.',
      gorevler: [
        { baslik: 'İşçilik ekleme', sahneler: [{ git: 'katalog', kirp: 'ana', adimlar: [['**İşçilikler** ve **Bakım paketleri** sekmeleri arasında geçin.', 'button@Bakım paketleri'], ['**İşçilik ekle** yeni satır açar. **Süre (saat)** ve **Tutar (KDV hariç)** girilir.', '#ad']] }] },
        { baslik: 'Bakım paketi', ne: 'Paketler iş emrinde **Paket ekle** ile seçilir, içindeki kalemler iş emrine satır satır yazılır.', sahneler: [{ git: 'katalog', once: [['tikla', 'button@Bakım paketleri']], kirp: 'ana', adimlar: [['**Paket ekle** yeni paket tanımlar.', '#ad']] }] }] },

    { id: 'musteriler', ne: 'Filo ve bireysel müşterileri, araç sayısını, toplam işi ve bakiyeyi tutar. Veresiye teslim edilen tutarlar burada bakiye olarak görünür. Teknisyen rolü bu sayfayı görmez.',
      gorevler: [{ baslik: 'Cari tahsilat', sahneler: [
        { git: 'musteriler', kirp: 'ana', adimlar: [['**Borcu olan** ve **Filo** süzgeçleriyle listeyi daraltın.', 'button@Borcu olan'], ['**Tahsilat** ödeme alır.', 'button@Tahsilat'], ['**Hesap ekstresi** müşterinin hareketlerini gösterir.', 'button@Hesap ekstresi']] },
        { git: 'musteriler', once: [['tikla', 'button@Tahsilat']], kirp: 'pencere', adimlar: [['**Tutar** ve **Yöntem** seçip **Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      hatalar: [['Tutar sıfırdan büyük olmalı uyarısı çıkıyor.', 'Tutar alanına sıfırdan büyük bir değer yazın.']] },

    O.belgeler({ tur: 'İş emri / araç kabul' }),
    O.ayarlar({ alanlar: [['İşçilik saat ücreti (₺)', 'Süreyle hesaplanan işçilik tutarının temelidir.'], ['Bakım aralığı (km)', 'Sonraki bakım km önerisinde kullanılır.'], ['İşçilik garantisi (gün)', 'Teslimde garanti bitiş tarihi bu süreyle hesaplanır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Teknisyen rolü yalnız **İş Emirleri** sayfasını ve kendine atanan araçları görür. Servis danışmanı ayarlar dışındaki bölümlerde çalışır.',
  musteri: [{ ad: 'Araç durumu ve onay sayfası', ne: 'Müşteri SMS ile gelen linkten aracının aşamasını, yapılacak işlemleri ve tutarı görür. Üyelik gerekmez. Onay beklenen işte kalemleri seçip **Seçilenleri onayla** veya **Hiçbirini yaptırmayacağım** düğmesine basar. Sayfada ödeme alınmaz, ödeme araç teslim alınırken yapılır.',
    sahneler: [{ git: 'ozet', once: [['js', ONAY], ['bekle', 1500]], kirp: 'tam', boy: 900, adimlar: [['Müşteri linki açınca bu sayfayı görür.', '#onay']] }],
    not: 'Link iş emrine özeldir. Başkasıyla paylaşılmamalıdır.' }],
  yazdirma: { ne: 'Belgeler iş emrinden ve araç kartından yazdırılır.', belgeler: [['İş emri / araç kabul', 'İş emrinde **İş emri** düğmesi. Kabulde **Kabul formunu yazdır** işaretliyse otomatik.'], ['Araç teslim formu', 'İş emrinde **Teslim formu** düğmesi veya teslim penceresindeki **Teslim formunu yazdır**.'], ['Araç servis karnesi', '**Araçlar** sayfasında **Servis karnesi yazdır**.']] },

  entegrasyon: {
    sms: { degisir: ['Onay linki, ek iş onayı ve teslime hazır mesajı müşteriye gerçek SMS olarak gider.', '**Hatırlatmalar** sayfasındaki **Tümüne SMS gönder** ve **SMS gönder** düğmeleri gerçek gönderim yapar.', 'Bağlantı yokken mesaj gitmez, program WhatsApp ile göndermeyi önerir.'], sorun: ['Sağlayıcı panelindeki krediyi ve onaylı başlığı kontrol edin.', 'Müşteri kartındaki telefonu kontrol edin.'] },
    whatsapp: O.E.whatsappLink('SMS gönderilemediğinde çıkan seçenek ve **Hatırlatmalar** sayfasındaki **WhatsApp ile gönder** düğmesi'),
    efatura: { degisir: ['Teslim penceresindeki **e-Arşiv fatura kes** kutusu faturayı entegratöre gönderir. Sağlayıcının altındaki sınırı okuyun.', 'Kesilen belge **e-Belgeler** sayfasında görünür, numarası iş emrine yazılır.', 'Simülasyonda belge TEST etiketi taşır, GİB’e gitmez.'], sorun: ['e-Arşiv kesilemedi uyarısında **e-Belgeler** sayfasındaki ayrıntıya bakın.'] },
    parca: { kapali: { '*': 'NEBSOFT ile iletişime geçerek açtırılır.' }, degisir: ['Yedek parça tedarikçisi bağlantısı NEBSOFT ile iletişime geçerek açtırılır.', 'Bağlantı açılana kadar **Parça Stoğu** sayfasındaki **Kritik stok sipariş listesi** ile listeyi tedarikçinize kendiniz gönderirsiniz.'], sorun: ['Sipariş listesi boşsa **En az stok** değerlerini kontrol edin.'] },
    backup: O.E.backup(),
  },
});
