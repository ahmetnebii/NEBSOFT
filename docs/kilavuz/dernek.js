// Dernek, Vakıf & Muhtarlık kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js dernek
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında **Entegre et** düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, **Bağlantıyı dene** ile deneyin. ${deneme} Sonuç başarılıysa kart **Bağlı** görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz **Bağlantıyı dene** adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Dernek & Vakıf, üye kayıtlarını, aidat ve tahsilatı, gelir ve gideri, toplantıları, kararları, evrakı ve duyuruları tek yerde tutar. Bu program yardımcı kayıttır: tasdikli defterlerinizin ve basılı alındı belgelerinizin yerine geçmez.',
  kimler: 'Dernekler, vakıflar ve muhtarlıklar. Muhtarlıkta aidat ekranları kapanır, kişi, toplantı, evrak ve duyuru bölümleri kullanılır.',
  ilkNot: 'Kurum türünü **Ayarlar** sayfasından seçin. Yönetmelik süre uyarıları yalnız dernek türünde görünür. DERBİS bildirimi yapılmaz: beyanname ve bildirimleri siz verirsiniz, program yalnız tarihi hatırlatır.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Aktif üye sayısını, toplam aidat borcunu, yılın gelir ve giderini, yaklaşan toplantıyı ve yönetmelik tarihlerini gösterir. Sekreter tutarları görmez, toplantı, evrak ve duyuru sayılarını görür.',
      gorevler: [{ baslik: 'Güne başlarken bakılacaklar', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 950, adimlar: [['Üstteki kutular **Aktif üye** ve **Toplam aidat borcu** gibi değerleri gösterir.', '.kpi'], ['**Yaklaşan** kartı toplantıyı ve genel kurul çağrısı gibi tarih hatırlatmalarını gösterir.', '.card@Yaklaşan'], ['**Üye ekle** üye formunu açar.', '#nm'], ['**Tahsilat** ödeme penceresini açar.', '#cl']] }] }] },

    { id: 'uyeler', ne: 'Üye kayıt bilgilerini tutar: kimlik, giriş ve çıkış tarihleri, kabul kararı. Üye silinmez, çıkış tarihi yazılır.',
      gorevler: [
        { baslik: 'Üye ekleme', sahneler: [
          { git: 'uyeler', kirp: 'ana', adimlar: [['**Üye ekle** formu açar.', '#nm'], ['Bu düğme üye listesini yazdırır.', '#pr'], ['Bu düğme listeyi dosyaya alır.', '#ex'], ['**Aktif**, **Borçlu**, **Ayrılan** ve **Tümü** ile listeyi süzün.', '[data-f=borc]']] },
          { git: 'uyeler', once: [['tikla', '#nm']], kirp: 'pencere', boy: 900, adimlar: [['**Ad soyad** ve **Giriş tarihi** zorunludur.', '.field@Ad soyad'], ['**Üyelik türü** asıl, fahri veya onursal üyedir. Hazirun listesine asıl üyeler girer.', '.field@Üyelik türü'], ['**Kabul kararı (tarih / no)** yönetim kurulu kararını yazar.', '.field@Kabul kararı'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Üye kartı', sahneler: [{ git: 'uyeler', once: [['tikla', '[data-act=v]']], kirp: 'ana', adimlar: [['**Portal kodu** üyenin giriş kodunu gösterir. Telefon kayıtlı olmalıdır.', '#pt'], ['**Üyelik belgesi** belgeyi yazdırır.', '#ub'], ['**Üyelikten çıkar** tarih, neden ve karar sorar, kayıt silinmez.', '#ay'], ['**Tahsilat** bu üyeden ödeme alır.', '#cl'], ['Üstte **Kalan borç**, **Ödenen** ve **Avans** görünür.', '.kpi']] }] }],
      alanlar: [['TC kimlik no', '11 hane olmalıdır.'], ['Meslek', 'Üyenin mesleği.'], ['Adres', 'İletişim adresi.'], ['Not', 'Yönetimin notu.']],
      hatalar: [['TC kimlik no 11 hane olmalı uyarısı çıkıyor.', 'Numarayı 11 hane yazın veya boş bırakın.'], ['Portal için telefon gerekli uyarısı çıkıyor.', 'Üye kartına telefon yazın.']] },

    { id: 'toplanti', ne: 'Yönetim kurulu ve genel kurul toplantılarının gündemini, çağrısını, katılımını ve kararlarını tutar. Genel kurulda ikinci toplantı tarihi ilkinden 7-60 gün sonra olmalıdır, çağrı en az 15 gün önce yapılmalıdır. Program bu süreleri ekranda uyarır.',
      gorevler: [
        { baslik: 'Toplantı planlama', sahneler: [{ git: 'toplanti', once: [['tikla', '#nm']], kirp: 'pencere', adimlar: [['**Tür** yönetim kurulu veya genel kuruldur.', '.field@Tür'], ['Genel kurulda **İkinci toplantı tarihi (genel kurul)** alanını doldurun.', '.field@İkinci toplantı tarihi'], ['Gündemi her satıra bir madde olacak şekilde yazın.', '.field@Gündem'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
        { baslik: 'Genel kurulu yürütme', ne: 'Toplantıdan sonra **Yapıldı** ile kapatın. Genel kurul yapıldıktan sonra Genel Kurul Sonuç Bildirimi son günü görünür. Bildirimi siz yaparsınız, **Bildirdim** ile işaretlersiniz.', sahneler: [{ git: 'toplanti', once: [['tikla', '[data-act=v]']], kirp: 'ana', boy: 900, adimlar: [['**Çağrı gönder** SMS gönderir veya program dışında yapılan çağrıyı kaydeder. TEST sonucu çağrı sayılmaz.', '#ca'], ['**Hazirun** katılma hakkı olan üyelerin imza listesini yazdırır.', '#hz'], ['**Tutanak** toplantı tutanağını yazdırır.', '#tt'], ['**Karar ekle** karar metnini ve oylamayı yazar.', '#ad'], ['Gelen üyeleri işaretleyip **Kaydet** düğmesine basın.', '#sv'], ['**Yapıldı** toplantıyı kapatır. Tarih gelmeden kapatılamaz.', '#dn']] }] }],
      alanlar: [['Saat', 'Toplantı saati.'], ['Yer', 'Toplantı yeri.'], ['Karar metni', 'Karar penceresinde yazılır.'], ['Oylama', 'Oy birliği veya oy çokluğu.'], ['Çağrı yolu', 'SMS veya program dışı çağrı.']],
      hatalar: [['İkinci toplantı ilkinden 7-60 gün sonra olmalı uyarısı çıkıyor.', 'İkinci toplantı tarihini bu aralığa alın.'], ['Toplantı tarihi henüz gelmedi uyarısı çıkıyor.', 'Tarih gelmeden **Yapıldı** seçilemez. Tarih yanlışsa düzenleyin.'], ['Çağrı için süre geçti uyarısı çıkıyor.', 'Üyeler en az 15 gün önce çağrılmalıdır. Toplantı tarihini değiştirin.']],
      not: 'Tutanak tasdikli karar defterine işlenmeden resmî karar kaydı sayılmaz.' },

    { id: 'kararlar', ne: 'Yönetim kurulu kararlarını tarih ve numara sırasıyla listeler. Kararlar toplantıdan gelir, burada yeni karar yazılmaz. Liste aramaya ve hazırlığa yardımcıdır. Kararları tasdikli karar defterine geçirip katılanlara imzalatmanız gerekir.',
      gorevler: [{ baslik: 'Karar arama', sahneler: [{ git: 'kararlar', kirp: 'ana', adimlar: [['Arama kutusuna karar metninden bir sözcük yazın.', '#q'], ['Bu düğme karar listesini yazdırır.', '#pr'], ['Tarihe tıklayınca toplantı açılır.', 'table a']] }] }] },

    { id: 'evrak', ne: 'Gelen ve giden evrakı tarih ve sıra numarasıyla tutar. Sıra numarası kendiliğinden verilir. Evrak kaydı silinmez, sıra boş kalmasın diye yanlış kayıt düzeltilir.',
      gorevler: [{ baslik: 'Evrak ekleme', sahneler: [{ git: 'evrak', once: [['tikla', 'button@Evrak ekle']], kirp: 'pencere', adimlar: [['**Yön** gelen veya giden seçilir.', '.field@Yön'], ['**Kurum / kişi** ve **Konu** zorunludur.', '.field@Kurum'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'duyurular', ne: 'Duyurular üye portalında görünür, isterseniz SMS ile de gönderilir.',
      gorevler: [{ baslik: 'Duyuru yazma', sahneler: [{ git: 'duyurular', kirp: 'ana', adimlar: [['**Duyuru yaz** başlık, metin ve tarih sorar.', 'button@Duyuru yaz'], ['**SMS gönder** duyuruyu telefonu kayıtlı aktif üyelere gönderir. **SMS** sütununda kaç kişiye gittiği yazar.', '[data-act=sms]']] }] }],
      hatalar: [['Telefonu kayıtlı kişi yok uyarısı çıkıyor.', 'Üye kartlarına telefon yazın.']] },

    { id: 'aidat', ne: 'Dönem aidatını tahakkuk eder, borçluları gösterir, tahsilat alır ve hatırlatma gönderir. Ödeme en eski borçtan kapanır, fazlası avans olur ve sonraki tahakkuktan düşer. Bu sayfayı başkan ve sayman görür.',
      gorevler: [
        { baslik: 'Tahakkuk oluşturma', sahneler: [
          { git: 'aidat', kirp: 'ana', adimlar: [['**Tahakkuk oluştur** dönem aidatını yazar.', '#ta'], ['**Borçlulara hatırlat** telefonu kayıtlı borçlulara SMS gönderir.', '#rm'], ['Dönemi buradan seçin.', '#pr'], ['**Ödemeyenler** ve **Tümü** ile listeyi süzün.', '[data-o="0"]'], ['Üstte **Tahakkuk**, **Tahsil edilen**, **Kalan** ve **Tahsilat oranı** görünür.', '.kpi']] },
          { git: 'aidat', once: [['tikla', '#ta']], kirp: 'pencere', adimlar: [['**Yıl** dönemdir. Aylık aidatta 2026-03 gibi yazılır.', '.field@Yıl'], ['**Kişi başı tutar (₺)** Ayarlardaki aidat tutarıyla gelir.', '.field@Kişi başı tutar'], ['**Fahri ve onursal üyeler hariç** işaretliyse yalnız asıl üyeler borçlanır.', '.check@Fahri ve onursal üyeler hariç'], ['**Tahakkuk et** düğmesine basın, onay sorulur.', 'button@Tahakkuk et']] }] },
        { baslik: 'Tahsilat alma', ne: 'Tahsilat sonrası **Tahsilat bilgi fişi** açılır. Bu fiş alındı belgesi değildir. Tahsilat iptali kaydı silmez, borcu geri açar, neden sorar ve başkan onayı ister.', sahneler: [{ git: 'aidat', once: [['tikla', '#cl']], kirp: 'pencere', adimlar: [['**Gelir türü** aidat, bağış veya diğer gelirdir.', '.field@Gelir türü'], ['**Üye** seçin. Üye olmayan bağışçı için **Ödeyen adı (üye değilse)** yazın.', '.field@Üye'], ['**Tutar (₺)** yazın.', '.field@Tutar'], ['**Basılı alındı belgesi seri-sıra no** alanına kullandığınız belgenin numarasını yazın.', '.field@Basılı alındı belgesi'], ['**Tahsil et** düğmesine basın.', 'button@Tahsil et']] }] }],
      hatalar: [['Bu alındı belgesi numarası kullanılmış uyarısı çıkıyor.', 'Numarayı kontrol edin. Aynı numara iki tahsilatta olamaz.'], ['Tahakkuk edilecek üye yok uyarısı çıkıyor.', 'Bu dönem tahakkuku yapılmıştır.'], ['Dönem 2026 veya 2026-03 biçiminde olmalı uyarısı çıkıyor.', 'Dönemi bu biçimde yazın.'], ['Aidat için üye seçin uyarısı çıkıyor.', 'Aidat üye adına alınır. Üye olmayan kişi için **Gelir türü** bağış veya diğer gelir seçin.'], ['Avansı kullanılmış tahsilat iptal edilmiyor.', 'Önce sonraki kayıtları iptal edin.']] },

    { id: 'gelirgider', ne: 'Tahsilatlar gelire kendiliğinden yazılır, giderleri siz girersiniz. **Yıl sonu tablosu** hazırlığa yardımcıdır, resmî İşletme Hesabı Tablosu değildir. Yıllık gelir yönetmelikteki sınırı aşarsa ekranda uyarı çıkar, bilanço defterleri bu programda yoktur. Bu sayfayı başkan ve sayman görür.',
      gorevler: [{ baslik: 'Gider girme', sahneler: [
        { git: 'gelirgider', kirp: 'ana', adimlar: [['Yılı bu alana yazın.', '#y'], ['**Yıl sonu tablosu** gelir ve gider özetini yazdırır.', '#pr'], ['**Gelir / gider** yeni kayıt açar.', '#ne'], ['Üstte **Gelir**, **Gider** ve **Fark** görünür.', '.kpi']] },
        { git: 'gelirgider', once: [['tikla', '#ne']], kirp: 'pencere', adimlar: [['**Yön** gider veya tahsilat dışı gelirdir.', '.field@Yön'], ['**Kategori** ve **Tutar (₺)** zorunludur.', '.field@Kategori'], ['**Belge** türünü ve **Belge no** bilgisini yazın.', '.field@Belge no'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    O.imzali(),
    O.belgeler({ tur: 'Tahsilat bilgi fişi' }),
    O.ayarlar({ alanlar: [['Kurum türü (değişiklik yeniden açılışta görünür)', 'Dernek, vakıf veya muhtarlık. Muhtarlıkta aidat ekranları kapanır.'], ['Son olağan genel kurul', 'Olağan kurul hatırlatmasında kullanılır.'], ['Aidat dönemi', 'Yıllık veya aylık.'], ['Aidat tutarı (₺)', 'Tahakkukta önerilen tutar.'], ['Giriş aidatı (₺)', 'Doluysa yeni üyede borçlandırma seçeneği çıkar.'], ['Aidat borcu olan üye hazirun listesine girmesin (tüzüğünüzde bu kural varsa açın)', 'Açıksa borçlu üye listeye girmez.'], ['Banka', 'Banka adı.'], ['IBAN', 'Hatırlatma SMS’inde ve üye portalında kalan borcu olan üyeye görünür.']] }),
    O.bildirimler(),
    O.entegrasyonlar(),
  ],

  roller: 'Sayman aidat, tahsilat ve gelir-gideri yönetir, toplantı, evrak ve duyuruyu okur. Sekreter üye, toplantı, karar, evrak ve duyuru işlerini yapar, aidat, tahsilat ve gelir-gider görmez. Üye kaydını kimse silemez. Tahsilat iptali başkan onayı ister.',
  musteri: [{ ad: 'Üye portalı', ne: 'Üye telefon numarası ve yönetimden aldığı giriş koduyla kalan aidatını, ödediği tutarı, aidat dönemlerini, planlanan genel kurulu ve duyuruları görür. Kalan borcu varsa ve IBAN girilmişse IBAN görünür. Kodu üye kartındaki **Portal kodu** düğmesiyle alırsınız. Muhtarlık türünde portal kodu düğmesi çıkmaz.',
    sahneler: [
      { adres: 'uye.html', ilk: 700, kirp: 'tam', adimlar: [['Üye telefonunu yazar.', '#ph'], ['Giriş kodunu yazıp **Giriş** düğmesine basar.', '#go']] },
      { adres: 'uye.html', ilk: 700, once: [['tikla', '#hint'], ['tikla', '#go']], kirp: 'tam', boy: 1100, adimlar: [['Üstte **Kalan aidat** ve **Ödenen** görünür.', '.stat2'], ['**Aidat dönemleri** dönem dönem durumu gösterir.', '.tk-panel@Aidat dönemleri']] }] }],
  yazdirma: { ne: 'Belgeler işlem yapılan ekrandan yazdırılır. Çıktılar yardımcı kayıttır, resmî alındı belgesi veya defter yerine geçmez. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Tahsilat bilgi fişi', 'Tahsilatta açılır. Sonradan satırdaki **Bilgi fişi** simgesiyle.'], ['Üyelik belgesi', 'Üye kartında **Üyelik belgesi**.'], ['Toplantı tutanağı', 'Toplantıda **Tutanak**.'], ['Hazirun listesi', 'Genel kurulda **Hazirun**.'], ['Gelir-gider tablosu', '**Gelir & Gider** sayfasında **Yıl sonu tablosu**.'], ['Üye listesi', '**Üyeler** sayfasındaki yazıcı simgesi.']] },

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bağlandıktan sonra **Borçlulara hatırlat**, **Çağrı gönder** ve duyurudaki **SMS gönder** gerçek SMS gönderir.', 'Genel kurul çağrısı yalnız sağlayıcının kabul ettiği gönderimle kayda geçer.', 'Bağlantı yokken sonuç **TEST** görünür, üyeye bir şey gitmez, çağrı yapıldı sayılmaz.'], sorun: [...DENEME_HATA, 'Hata görünüyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.', 'Telefonu olmayan üyelere başka yolla bildirin.'] },
    whatsapp: { degisir: ['Portal kodu penceresindeki **WhatsApp** düğmesi giriş bilgisini hazır mesajla açar, mesajı siz gönderirsiniz.', 'Bu düğme için hesap bağlamak gerekmez. Cloud API bağlansa da bu programda otomatik WhatsApp gönderimi olmaz.'], sorun: ['WhatsApp açılmıyorsa üyenin telefonunu kontrol edin.'] },
    email: { degisir: [AKIS('E-posta', 'Deneme hesap bilgisini okur, e-posta göndermez.'), 'Bu programın ekranlarında e-posta gönderen düğme yoktur. Üyeye bildirim için SMS veya WhatsApp kullanılır.'], sorun: DENEME_HATA },
    printer: { degisir: ['Belgeler tarayıcının yazdırma penceresiyle basılır, yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını görmenizi sağlar.'], sorun: ['Kâğıt boyu yanlışsa **Belge şablonları** sayfasından değiştirin.'] },
    backup: O.E.backup(),
  },
});
