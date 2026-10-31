// Çiftçi & Kooperatif kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js ciftci
// Üretici portalı telefon ve kodla açılır: giriş bilgisi demo verisinden okunur, sayfa değişince yardımcı yeniden yüklenir. Ekrandaki kişiler kurgudur.
const YARDIM = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'scripts', 'kilavuz', 'sayfa.js'), 'utf8');
const PORTAL = [['js', "(()=>{const s=NS.app.opts.db.all('producers').find((x)=>x.portalCode);sessionStorage.setItem('__g',JSON.stringify([s.phone,s.portalCode]));location.href='uretici.html';})()"], ['bekle', 1400], ['js', YARDIM + ";(()=>{const t=document.createElement('style');t.textContent='.nsd,#nsdroot,.nsd-w{display:none!important}';document.head.append(t);const g=JSON.parse(sessionStorage.getItem('__g'));__k.yaz('#ph',g[0]);__k.yaz('#cd',g[1]);__k.tikla('#go');})()"], ['bekle', 500]];
const ILETISIM = 'NEBSOFT ile iletişime geçerek açtırılır.';
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında Entegre et düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, Bağlantıyı dene ile deneyin. ${deneme} Sonuç başarılıysa kart Bağlı görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz Bağlantıyı dene adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Çiftçi & Kooperatif, üreticiden yapılan alımları, müstahsil makbuzunu ve stopajı, veresiye girdi satışını, hasatta borç mahsubunu, toplu ödeme listesini, tarla defterini ve ortak defterini tek yerde tutar.',
  kimler: 'Tarımsal kalkınma kooperatifleri, ürün alan tüccarlar, girdi bayileri ve üreticiyle cari çalışan işletmeler.',
  ilkNot: 'Stopaj oranları GİB tablosundan varsayılan olarak gelir, Ayarlar sayfasından değiştirilir. Hangi alımda hangi oranın uygulanacağını mali müşavirinizle netleştirin.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Son 30 günün alımını, üretici borcunu, ödenecek ürün bedelini, risk limitini aşanları ve kritik girdileri gösterir. Kantar rolü tutar kutularını görmez.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', boy: 1100, kirp: 'ana', adimlar: [['**30 gün alım** son 30 günün toplamıdır.', '.kpi'], ['**Üretici borcu** girdi veresiyesi, **Ödenecek** üreticiye borçlu olduğunuz ürün bedelidir.', '.kpi@Üretici borcu'], ['**Risk limitini aşanlar** bakiyesi limiti geçen üreticilerdir.', '.card@Risk limitini aşanlar'], ['**Kritik girdi** stoğu en az seviyeye inen girdilerdir.', '.card@Kritik girdi']] }] }] },

    { id: 'alim', ne: 'Üreticiden yapılan alımları tutar. Kantar tartımı girilir, net miktar, bedel, stopaj ve ödenecek tutar hesaplanır, makbuz numarası verilir. Makbuz silinmez, iptal edilir, numara boşa çıkmaz. Yeni alım kaydedilince ürün stoğu artar, makbuz yazdırma açılır.',
      gorevler: [
        { baslik: 'Yeni alım girme', sahneler: [
          { git: 'alim', kirp: 'ana', adimlar: [['**Yeni alım** düğmesine basın.', '#nb'], ['Arama kutusuna fiş, makbuz, ürün veya üretici yazın.', '#q'], ['**Makbuz yazdır** makbuzu yeniden basar.', '[data-act=pr]'], ['**Makbuzu iptal et** neden sorar. Stok geri düşer, kayıt silinmez.', '[data-act=cn]']] },
          { git: 'alim', once: [['tikla', '#nb']], kirp: 'pencere', boy: 900, adimlar: [['**Üretici** ve **Ürün** seçin.', '.field@Üretici'], ['**Birim fiyat (₺)** boşsa ürün kartındaki fiyat alınır.', '.field@Birim fiyat'], ['**Brüt (dolu tartım)** ve **Dara (boş tartım)** yazın. Brüt, daradan büyük olmalıdır.', '.field@Brüt'], ['**Fire / kalite kesintisi (%)** net miktardan düşülür.', '.field@Fire'], ['Borsada tescil edildiyse kutuyu işaretleyin, stopaj oranı buna göre değişir.', '.check@Borsada tescil edildi'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Diğer kesinti (₺)', 'Ödenecek tutardan düşülür, makbuzda ayrı görünür.'], ['Stopaj uygulanmaz', 'İşaretlenirse bu alımda stopaj hesaplanmaz.'], ['e-Müstahsil gönder', 'Bağlantı açıksa makbuz sağlayıcıya iletilir.']],
      hatalar: [['Brüt, daradan büyük olmalı uyarısı çıkıyor.', 'Tartımları kontrol edin. Dolu tartım boş tartımdan büyük olmalıdır.']] },

    { id: 'satis', ne: 'Gübre, tohum, ilaç ve mazot satışlarını tutar. Veresiye satış üretici borcuna yazılır, hasatta alımdan mahsup edilir. Satış iptal edilince stok geri eklenir. Bu sayfayı yönetici ve muhasebe görür.',
      gorevler: [{ baslik: 'Girdi satma', sahneler: [
        { git: 'satis', kirp: 'ana', adimlar: [['**Girdi sat** düğmesine basın.', '#ns'], ['**Veresiye** ve **Reçeteli** süzgeçleri satışları ayırır.', 'button@Veresiye'], ['**Fiş yazdır** fişi yeniden basar.', '[data-act=pr]']] },
        { git: 'satis', once: [['tikla', '#ns']], kirp: 'pencere', boy: 900, adimlar: [['**Üretici**, **Ürün** ve **Miktar** zorunludur.', '.field@Ürün'], ['Hasatta ödenecekse **Veresiye (hasatta mahsup)** işaretli kalsın.', '.check@Veresiye'], ['**Vade (hasat)** Ayarlardaki hasat vadesiyle gelir.', '.field@Vade'], ['Reçeteli ürünse **Reçete no (reçeteli ürünse)** zorunludur.', '.field@Reçete no'], ['**Kaydet** düğmesine basın. Girdi fişi açılır.', 'button@Kaydet']] }] }],
      hatalar: [['Bu ürün reçeteli işaretli uyarısı çıkıyor.', 'Reçete numarasını yazın.'], ['Risk limiti aşılıyor uyarısı çıkıyor.', 'Yeni bakiye **Veresiye risk limiti (₺)** tutarını geçiyor. Onaylarsanız satış yapılır.']] },

    { id: 'odeme', ne: 'Alımlardan girdi borcu düşüldükten sonra alacaklı kalan üreticileri listeler. Program para göndermez: listeyi dışa aktarırsınız, ödemeyi bankada yapar, sonra ödendi işlersiniz. Bu sayfayı yönetici ve muhasebe görür.',
      gorevler: [{ baslik: 'Toplu ödeme', sahneler: [{ git: 'odeme', kirp: 'ana', adimlar: [['Üreticileri tek tek veya **Tümünü seç** ile işaretleyin.', '.check@Tümünü seç'], ['**Banka listesi (CSV)** ad, IBAN ve tutarı dosyaya alır. Seçim yoksa tüm liste alınır.', '#csv'], ['Bankadan ödedikten sonra **Seçilenleri ödendi işle** düğmesine basın.', '#pay']] }] }],
      hatalar: [['Üretici seçin uyarısı çıkıyor.', 'Ödendi işlemeden önce en az bir üretici seçin.'], ['IBAN yok yazıyor.', '**Üreticiler** sayfasında üretici kartına IBAN yazın.']] },

    { id: 'ureticiler', ne: 'Üretici kartlarını, tarlalarını, ortaklığını ve cari bakiyesini tutar. Hareketi olan üretici silinemez. Kantar rolü bakiyeyi ve satır işlemlerini görmez.',
      gorevler: [
        { baslik: 'Üretici ekleme', sahneler: [{ git: 'ureticiler', once: [['tikla', 'button@Üretici ekle']], kirp: 'pencere', adimlar: [['**Ad soyad** ve **Telefon** zorunludur.', '.field@Ad soyad'], ['**T.C. kimlik no (makbuz için)** 11 hane olmalıdır, makbuza yazılır.', '.field@T.C. kimlik no'], ['**IBAN** banka listesinde kullanılır.', '.field@IBAN'], ['**Veresiye risk limiti (₺)** aşılınca satışta onay sorulur.', '.field@Veresiye risk limiti'], ['Ortaksa **Kooperatif ortağı** kutusunu işaretleyin.', '.check@Kooperatif ortağı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Cari ve ekstre', sahneler: [
          { git: 'ureticiler', kirp: 'ana', adimlar: [['**Borçlu**, **Alacaklı** ve **Ortak** süzgeçleri listeyi ayırır.', 'button@Borçlu'], ['**Hesap ekstresi** hareketleri gösterir.', '[data-act=ext]'], ['**Girdi sat** bu üreticiye satış açar.', '[data-act=sl]'], ['**Ödeme veya tahsilat** cari hareket yazar.', '[data-act=pay]'], ['**Üretici portal kodu** adresi ve kodu gösterir.', '[data-act=code]']] },
          { git: 'ureticiler', once: [['tikla', '[data-act=ext]']], kirp: 'pencere', boy: 900, adimlar: [['**Yazdır** ekstreyi basar.', 'button@Yazdır'], ['**CSV indir** dosyaya alır.', 'button@CSV indir'], ['**WhatsApp ile gönder** bakiye özetini hazır mesajla açar.', 'button@WhatsApp ile gönder']] }] }],
      alanlar: [['Köy / mahalle', 'Makbuzda ve listede görünür.'], ['Ortak no', 'Ortak defterindeki numara.'], ['Pay adedi', 'Pay sermayesi hesabında kullanılır.'], ['Giriş tarihi', 'Kooperatife giriş tarihi.']],
      hatalar: [['T.C. kimlik no 11 hane olmalı uyarısı çıkıyor.', 'Numarayı 11 hane yazın veya boş bırakın.']] },

    { id: 'tarlalar', ne: 'Ada, parsel, alan ve ürün bilgisini, tarla defterini, verimi ve gideri tutar. Dönemi geldiğinde sayfanın üstünde Çiftçi Kayıt Sistemi tarih hatırlatması görünür.',
      gorevler: [{ baslik: 'Tarla defteri tutma', sahneler: [
        { git: 'tarlalar', kirp: 'ana', adimlar: [['**Tarla ekle** yeni parsel açar.', 'button@Tarla ekle'], ['**Tarla defteri** bu parselin işlemlerini açar.', '[data-act=log]']] },
        { git: 'tarlalar', once: [['tikla', '[data-act=log]']], kirp: 'pencere', adimlar: [['**İşlem ekle** tarih, işlem, miktar ve gider sorar. Hasat kaydında miktarı kilogram yazın, verim buradan hesaplanır.', '[data-add]']] }] }],
      alanlar: [['Alan (dekar)', 'Verim hesabında kullanılır, zorunludur.'], ['Sulama', 'Sulu veya kuru.'], ['Mülkiyet', 'Tarlanın işletilme şekli.'], ['Kullanılan ürün, not', 'İşlemde kullanılan ilaç veya gübre gibi bilgiler.']] },

    { id: 'stok', ne: 'Alınan ürünleri ve satılan girdileri tutar. Hareketi olan kart silinemez. Bu sayfayı yönetici ve muhasebe görür.',
      gorevler: [{ baslik: 'Kart ekleme', sahneler: [{ git: 'stok', once: [['tikla', 'button@Kart ekle']], kirp: 'pencere', adimlar: [['**Tür** alınan ürün veya satılan girdidir.', '.field@Tür'], ['**Vergi grubu (ürün)** stopaj oranını belirler.', '.field@Vergi grubu'], ['Reçete isteyen üründe **Reçeteli bitki koruma ürünü** kutusunu işaretleyin.', '.check@Reçeteli bitki koruma ürünü'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Fiyat (₺)', 'Üründe alım, girdide satış fiyatı olarak önerilir.'], ['Alış (₺)', 'Girdinin alış fiyatı.'], ['En az stok', 'Girdi bu seviyeye inince kritik sayılır.']] },

    { id: 'kooperatif', ne: 'Ortak listesini, payları ve gelir-gider farkı dağıtımını tutar. Dağıtım ortakların o yılki muamelesine göre yapılır. Oranlar ana sözleşmenize ve genel kurul kararına bağlıdır. Bu sayfayı yönetici ve muhasebe görür.',
      gorevler: [{ baslik: 'Gelir-gider farkı dağıtma', ne: '**Gelir-gider farkı dağıt** tutar ve yedek akçe oranını sorar, önce önizleme gösterir. **Alacağa işle** ile tutar ortakların alacağına yazılır.', sahneler: [{ git: 'kooperatif', kirp: 'ana', adimlar: [['**Gelir-gider farkı dağıt** penceresini açın.', '#dg'], ['**Ortak listesi (CSV)** listeyi dosyaya alır.', '#csv'], ['Üstteki kutular **Ortak**, **Toplam pay** ve **Pay sermayesi** değerleridir.', '.kpi']] }] }] },

    { id: 'rapor', ne: 'Seçilen yılın ürün bazında alımlarını ve aylık stopaj dökümünü gösterir. Döküm muhasebecinize yardımcı olur, beyannamenin yerine geçmez. Bu sayfayı yönetici ve muhasebe görür.',
      gorevler: [{ baslik: 'Stopaj dökümü alma', sahneler: [{ git: 'rapor', kirp: 'ana', adimlar: [['Yılı bu alana yazın.', '#yr'], ['**Stopaj dökümü (CSV)** makbuz bazında dosya verir.', '#cs'], ['**Aylık stopaj** ay ay tutarı gösterir.', 'h3@Aylık stopaj']] }] }] },

    { ...O.imzali(), ne: 'Karşı tarafa ekranda imzalatılan belgeler içindir. Bu programda hazır form gelmez. Form eklemek için **Şablonları tasarla** düğmesini veya Ayarlar sayfasındaki **Hazır şablonlar** bölümünü kullanın.', gorevler: [{ baslik: 'Form ekleme', sahneler: [{ git: 'imzali', kirp: 'ana', adimlar: [['Form tasarlamak için **Şablonları tasarla** düğmesini kullanın.', 'a@Şablonları tasarla']] }] }] },
    O.belgeler({ tur: 'Müstahsil makbuzu' }),
    O.ayarlar({ alanlar: [['Üretim yılı', 'Tarla ve kooperatif hesabında kullanılır.'], ['Varsayılan hasat vadesi', 'Veresiye satışta önerilen vade.'], ['Girdi satış KDV oranı (%)', 'Girdi satışında kullanılır.'], ['Bir pay tutarı (₺)', 'Pay sermayesi hesabında kullanılır.'], ['Yedek akçe (%)', 'Dağıtım penceresinde önerilen oran.'], ['Hayvansal, borsada tescilli (%1)', 'Oran değişirse yeni değeri yazın. Diğer üç stopaj alanı da aynı şekilde çalışır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Kantar rolü yalnız alım fişi yazar, üretici kartını adıyla görür. Kimlik numarası, IBAN, limit, ödeme, girdi satışı ve dağıtım bu role gönderilmez, makbuz iptal edemez. Muhasebe rolünde yalnız Ayarlar ve yönetim sayfaları kapalıdır.',
  musteri: [{ ad: 'Üretici portalı', ne: 'Üretici kayıtlı telefonu ve giriş koduyla borçlu veya alacaklı olduğu tutarı ve hesap hareketlerini görür. Kodu **Üreticiler** sayfasındaki **Üretici portal kodu** simgesinden alırsınız.',
    sahneler: [
      { adres: 'uretici.html', ilk: 700, kirp: 'tam', adimlar: [['Üretici kayıtlı telefonunu yazar.', '#ph'], ['Aldığı giriş kodunu yazar.', '#cd'], ['**Giriş yap** düğmesine basar.', '#go']] },
      { git: 'ozet', once: PORTAL, kirp: 'tam', boy: 1000, adimlar: [['Üstte bakiye durumu ve tutar görünür.', '.tk-head']] }] }],
  yazdirma: { ne: 'Belgeler işlem yapılan ekrandan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Müstahsil makbuzu', 'Alım kaydedilince açılır. Sonradan **Makbuz yazdır** simgesiyle.'], ['Girdi fişi', 'Satış kaydedilince açılır. Sonradan **Fiş yazdır** simgesiyle.'], ['Üretici ekstresi', '**Hesap ekstresi** penceresinde **Yazdır** düğmesi.']] },
  sssHaric: ['e-Müstahsil gönderilir mi?'], // katalog metni tek akış kuralına aykırı, aynı soru aşağıda güncel yazılı
  sss: [['e-Müstahsil makbuzu nasıl gönderilir?', 'Sağlayıcı bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Açılınca alım penceresindeki **e-Müstahsil gönder** seçeneği makbuzu iletir. Program bu arada makbuzu yazdırmanızı sağlar.']],

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bu programın ekranlarında SMS gönderen düğme yoktur. Üreticiye bakiye özetini **WhatsApp ile gönder** ile iletirsiniz.'], sorun: DENEME_HATA },
    whatsapp: { degisir: ['**Hesap ekstresi** ve **Üretici portal kodu** pencerelerindeki **WhatsApp ile gönder** WhatsApp’ı hazır mesajla açar, mesajı siz gönderirsiniz.', 'Bu düğmeler için hesap bağlamak gerekmez. Cloud API bağlansa da bu programda otomatik WhatsApp gönderimi olmaz.'], sorun: ['WhatsApp açılmıyorsa üreticinin telefonunu kontrol edin.'] },
    efatura: { kapali: { edm: ILETISIM, logo: ILETISIM, mysoft: ILETISIM, sovos: ILETISIM }, degisir: [AKIS('e-Fatura / e-Arşiv', 'Deneme entegratöre zararsız bir istek atar, belge kesmez.'), 'Alım ve girdi satışı ekranlarında fatura düğmesi yoktur. Belgeyi **e-Belgeler** sayfasındaki **Manuel e-Arşiv** ile oluşturursunuz.', 'Bağlantı yokken belge **TEST** etiketi taşır, GİB’e gitmez.'], sorun: [...DENEME_HATA, 'Hata durumundaki belge için **e-Belgeler** sayfasındaki ayrıntıya bakın.'] },
    emustahsil: { kapali: { '*': ILETISIM }, degisir: ['Sağlayıcı bağlantısı NEBSOFT ile iletişime geçerek açtırılır. Karttan iletişim talebi bırakın.', 'Bağlantı açılınca alım penceresindeki **e-Müstahsil gönder** makbuzu sağlayıcıya iletir, sonuç **Alımlar** listesinde makbuz satırında görünür.', 'Bağlantı açık değilken kutu işaretlense de makbuz gönderilmez. Makbuz kâğıt olarak yazdırılır.'], sorun: ['**e-Müstahsil gönderilemedi** uyarısında ekrandaki nedeni okuyun, NEBSOFT desteğine iletin.'] },
    printer: { degisir: ['Makbuz, fiş ve ekstre tarayıcının yazdırma penceresiyle basılır, yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını görmenizi sağlar.'], sorun: ['Kâğıt boyu yanlışsa **Belge şablonları** sayfasından değiştirin.'] },
    backup: O.E.backup(),
  },
});
