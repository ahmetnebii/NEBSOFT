// Lastikçi & Oto Yedek Parça kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js lastik
// Demo verisinde açık iş yoktur: iş ekranı için demo verisindeki son işin kalemleriyle açık bir iş oluşturulur. Yeni iş düğmesinin yaptığıyla aynı kayıttır.
const ACIK = [['js', "(()=>{const d=NS.app.opts.db;let j=d.all('jobs').find((x)=>x.status==='acik');if(!j){const o=d.all('jobs').find((x)=>(x.items||[]).length);const v=d.get('vehicles',o.vehicle);j=d.insert('jobs',{no:'IS7999',at:new Date().toISOString(),customer:o.customer,vehicle:o.vehicle,km:v.km,items:o.items,status:'acik',paid:0,oldQty:0,measures:{},worker:o.worker||''},true);d.save();}location.hash='#/is/'+j.id;})()"], ['bekle', 400]];
// Müşteri sayfası kaydın gizli anahtarıyla açılır, anahtar demo verisinden okunur. Sayfa değişince yardımcı yeniden yüklenir.
const YARDIM = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'scripts', 'kilavuz', 'sayfa.js'), 'utf8');
const LASTIGIM = [['js', "(()=>{const h=NS.app.opts.db.all('hotels').find((x)=>x.status==='depoda');location.href='lastigim.html?k='+h.key;})()"], ['bekle', 1400], ['js', YARDIM + ";(()=>{const t=document.createElement('style');t.textContent='.nsd,#nsdroot,.nsd-w{display:none!important}';document.head.append(t)})()"]];
const ILETISIM = 'NEBSOFT ile iletişime geçerek açtırılır.';
const AKIS = (kart, deneme) => `**Entegrasyonlar** sayfasında ${kart} kartında **Entegre et** düğmesine basın, sağlayıcınızı seçin, ekranda nereden alınacağı yazan bilgileri girin, **Bağlantıyı dene** ile deneyin. ${deneme} Sonuç başarılıysa kart **Bağlı** görünür.`;
const DENEME_HATA = ['Deneme hata verirse ekrandaki iletiyi okuyun, bilgileri sağlayıcı panelinden yeniden kopyalayın.', 'Bilgileri değiştirirseniz **Bağlantıyı dene** adımını yeniden yapın, deneme geçene kadar işlem durur.'];
module.exports = (O) => ({
  ne: 'Lastikçi & Yedek Parça, lastik otelini, ebat ve DOT bilgili stoğu, montaj ve rot-balans iş emirlerini, plakadan araç geçmişini, cari hesapları, eski lastik defterini ve garanti kayıtlarını tek programda toplar.',
  kimler: 'Lastikçiler, rot-balans atölyeleri, lastik oteli işletenler ve oto yedek parça satanlar.',
  ilkNot: 'DOT sarı ve kırmızı uyarı yılları işletmenizin tercihidir, yasal sınır değildir. TecDoc bağlı değildir: OEM, muadil ve uyduğu araç bilgisi elle girilir.',
  ekrantanitim: [{ git: 'ozet', kirp: 'tam', adimlar: [['Sol menüden sayfalar arasında geçersiniz.', '.ns-nav'], ['**Ara · Ctrl K** düğmesi ekranlar arasında hızlı geçiş sağlar.', '[data-cmdk]', 'ok'], ['Ay simgesi açık ve koyu tema arasında geçer.', 'button[data-theme]'], ['Sağ üstte giriş yapan kullanıcı ve rolü görünür.', '.ns-user', 'ok']] }],

  moduller: [
    { id: 'ozet', ne: 'Açık işleri, oteldeki lastikleri, 30 günlük ciroyu, eski DOT stoğunu ve kritik stoğu gösterir. Plaka kutusu en hızlı başlangıçtır.',
      gorevler: [{ baslik: 'Plakadan iş açma', sahneler: [{ git: 'ozet', kirp: 'ana', boy: 1000, adimlar: [['Plakayı yazıp Enter’a basın. Araç kayıtlıysa bilgileri gelir, yoksa yeni kayıt açılır.', '#pq'], ['Üstteki kutular **Açık iş**, **Otelde lastik**, **30 gün ciro** ve **Eski DOT stok** değerleridir.', '.kpi'], ['**Yeni iş** plaka sorarak iş emri açar.', '#nw'], ['**Kritik stok** en az seviyeye inen ürünleri listeler.', '.card@Kritik stok']] }] }] },

    { id: 'isler', ne: 'Lastik montajı, rot-balans ve parça satışı iş emirlerini tutar. Aynı araçta açık iş varsa yeni iş açılmaz, açık iş gelir.',
      gorevler: [
        { baslik: 'İş emri açma', sahneler: [{ git: 'isler', kirp: 'ana', adimlar: [['**Yeni iş** düğmesine basın, plakayı yazın. Sonra araç ve müşteri bilgisi sorulur.', '#nw'], ['**Açık**, **Biten** ve **Tümü** ile listeyi süzün.', '[data-f=teslim]'], ['Arama kutusuna plaka, müşteri veya iş numarası yazın.', '#q']] }] },
        { baslik: 'İş emrinde çalışma', ne: 'Stoktan eklenen ürünün stoğu teslimde düşer. Eski DOT’lu ürün eklenirse program müşteriye üretim yılını söylemenizi hatırlatır.', sahneler: [{ git: 'isler', once: ACIK, kirp: 'ana', boy: 1000, adimlar: [['**Ebattan seç** aracın ebadıyla stok arar.', '[data-size]'], ['**Stoktan** kod, OEM veya ad ile arar.', '[data-stock]'], ['**İşçilik** sökme takma, balans, rot gibi işlemleri ekler.', '[data-labor]'], ['**İş hazır** işi hazıra alır, müşteriye haber verir.', '[data-ready]'], ['**Teslim et ve tahsil et** ödemeyi, faturayı ve müşteri imzasını alır.', '[data-done]'], ['**Fiş** iş emrini yazdırır.', '[data-pr]']] }] }],
      alanlar: [['Rot ölçümü (önce → sonra)', 'Fişe yazılır.'], ['Bijon torku (Nm)', 'Fişe yazılır.'], ['Hava basıncı (psi)', 'Fişe yazılır.'], ['Yapan usta', 'İşi yapan kişi.'], ['Müşteriden alınan eski lastik (adet)', 'Teslimde **Eski Lastikler** defterine yazılır.'], ['Tahsil edilen (₺)', 'Teslimde alınan tutar. Açık hesapta ödeme türünü **Cari hesaba** seçin.'], ['e-Arşiv / e-Fatura kes', 'Teslim penceresinde işaretlenirse belge oluşturulur.']],
      hatalar: [['Kalem ekleyin uyarısı çıkıyor.', 'Kalemsiz iş teslim edilmez.'], ['Eşleşen stok yok uyarısı çıkıyor.', 'Ebat, kod veya OEM yazımını kontrol edin ya da **Stok** sayfasından ürün ekleyin.']] },

    { id: 'otel', ne: 'Müşterinin lastiklerini etiketli rafta saklamanızı sağlar. Çıkışta etiket ve plaka birlikte doğrulanır, lastik sayılır, müşteri imzalar. Eşleşme olmadan kayıt kapanmaz.',
      gorevler: [
        { baslik: 'Lastik alma', ne: '**Lastik al** plaka sorar, araç ve müşteri bilgisini gösterir, sonra raf, ebat ve her lastiğin DOT ile diş derinliğini ister. Müşteri ekranda imzalar, giriş formu yazdırılır, müşteriye bağlantı gönderilir.', sahneler: [{ git: 'otel', kirp: 'ana', adimlar: [['**Lastik al** düğmesine basın.', '#nw'], ['Üstteki kutular **Depoda**, **Doluluk**, **Tahsil edilmemiş** ve **Teslim talebi** değerleridir.', '.kpi'], ['**Etiket yazdır** lastiğe yapıştırılacak QR etiketi basar.', '[data-act=lb]'], ['**Giriş formu** formu yeniden yazdırır.', '[data-act=fr]'], ['**Müşteri bağlantısı** müşterinin sayfasını kopyalar.', '[data-act=ln]'], ['**Çıkış yap** teslim penceresini açar.', '[data-act=ot]']] }] },
        { baslik: 'Lastik teslim etme', sahneler: [{ git: 'otel', once: [['tikla', '[data-act=ot]']], kirp: 'pencere', adimlar: [['Etiketi lastikten okuyup yazın.', '.field@Etiket numarası'], ['Plakayı müşteriye sorun.', '.field@Plaka'], ['Lastikleri sayın. Sayı tutmazsa program onay ister.', '.field@Sayılan lastik'], ['**Kaydet** düğmesine basın, müşteri imzalar, çıkış formu yazdırılır.', 'button@Kaydet']] }] },
        { baslik: 'Raf haritası', sahneler: [{ git: 'otel', once: [['tikla', '[data-v=raf]']], kirp: 'ana', adimlar: [['Her raf dolu sayısını ve plakaları gösterir.', '#w'], ['**Raf ekle** kod ve kaç takım sığacağını sorar.', '#ar']] }] }],
      alanlar: [['Saklanan lastik', 'Yaz, kış veya 4 mevsim.'], ['Saklama ücreti (₺)', 'Öneri Ayarlardan gelir.'], ['Jantlı', 'Lastik jantıyla saklanıyorsa işaretleyin.'], ['Ücret şimdi alındı', 'Ücret girişte alındıysa işaretleyin. Alınmadıysa çıkışta sorulur.'], ['Hasar ve not', 'Giriş formuna yazılır.']],
      hatalar: [['Etiket ve plaka eşleşmedi uyarısı çıkıyor.', 'Lastikleri kontrol edin. Yanlış takım olabilir.'], ['DOT dört hane olmalı uyarısı çıkıyor.', 'Hafta ve yıl yazın, örnek 2424.'], ['Bu raf kodu var uyarısı çıkıyor.', 'Her raf kodu tek olmalıdır.']] },

    { id: 'hatirlatma', ne: 'Depodaki lastik sahiplerine sezon değişimi hatırlatması gönderir. Liste tarihe göre kış veya yaz lastiklerini gösterir. Sayfanın üstündeki tarih genel bilgidir, bölgeniz için valilik kararını kontrol edin. Bu sayfayı işletme sahibi ve satış danışmanı görür.',
      gorevler: [{ baslik: 'Hatırlatma gönderme', sahneler: [{ git: 'hatirlatma', kirp: 'ana', adimlar: [['**Tümüne SMS gönder** listedeki herkese gönderir.', '#all'], ['**SMS gönder** tek müşteriye gönderir. Sonuç **Durum** sütununda yazar.', '[data-act=s]'], ['**WhatsApp ile gönder** hazır mesajla WhatsApp’ı açar.', '[data-act=w]']] }] }],
      hatalar: [['Durum sütununda TEST yazıyor.', 'SMS bağlı değildir, mesaj gitmemiştir. **Entegrasyonlar** sayfasından SMS bağlayın.']] },

    { id: 'stok', ne: 'Lastik ebatla, parça kod, OEM veya muadil ile bulunur. Her DOT ayrı satırdır, farklı DOT’la stok girişi yeni satır açar. Lastik ustası alış fiyatını görmez.',
      gorevler: [{ baslik: 'Stok ekleme ve giriş', sahneler: [
        { git: 'stok', kirp: 'ana', adimlar: [['**Stok ekle** yeni kart açar.', 'button@Stok ekle'], ['**Eski DOT** süzgeci eski üretimli lastikleri gösterir.', 'button@Eski DOT'], ['**Stok girişi** gelen adedi, DOT’u ve alış fiyatını yazar.', '[data-act=in]']] },
        { git: 'stok', once: [['tikla', 'button@Stok ekle']], kirp: 'pencere', boy: 1050, adimlar: [['**Kod** ve **Ad** zorunludur.', '.field@Kod'], ['**Ebat (205/55 R16)** iş emrindeki ebat aramasında kullanılır.', '.field@Ebat'], ['**DOT (HHYY)** hafta ve yıldır, örnek 2424.', '.field@DOT'], ['**Muadil kodlar** aramada bulunur.', '.field@Muadil kodlar'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }],
      alanlar: [['Yük ve hız indeksi', 'Lastiğin indeks bilgisi.'], ['OEM kodu', 'Orijinal parça kodu.'], ['Uyduğu araçlar (elle)', 'Elle yazılır, aramada bulunur.'], ['En az', 'Bu seviyeye inince ürün kritik sayılır.']] },

    { id: 'araclar', ne: 'Araçları, sahibini, ebadını ve plakadan tüm geçmişi tutar. İşi olan araç silinemez.',
      gorevler: [{ baslik: 'Araç geçmişi', sahneler: [{ git: 'araclar', kirp: 'ana', adimlar: [['**Araç ekle** yeni kayıt açar.', 'button@Araç ekle'], ['**Geçmiş** bu aracın işlerini ve otel kayıtlarını gösterir.', '[data-act=h]'], ['**Yeni iş** bu plakayla iş emri açar.', '[data-act=n]']] }] }] },

    { id: 'musteriler', ne: 'Filo ve bireysel müşterileri, açık hesabı ve bakiyeyi tutar. Bakiye limiti aşarsa kırmızı yazılır. İşi olan müşteri silinemez. Bu sayfayı işletme sahibi ve satış danışmanı görür.',
      gorevler: [{ baslik: 'Cari izleme', sahneler: [{ git: 'musteriler', kirp: 'ana', adimlar: [['**Müşteri ekle** yeni kayıt açar.', 'button@Müşteri ekle'], ['**Borcu olan** ve **Filo** süzgeçleri listeyi ayırır.', 'button@Borcu olan'], ['**Tahsilat** ödeme yazar.', '[data-act=pay]'], ['**Hesap ekstresi** borç ve alacak hareketlerini gösterir.', '[data-act=ext]']] }] }],
      alanlar: [['VKN / TCKN', 'Faturada kullanılır.'], ['Filo', 'Filo müşterisini işaretler.'], ['Açık hesap limiti (₺)', 'Aşılınca bakiye kırmızı görünür.']] },

    { id: 'garanti', ne: 'Satılan lastik ve parça için arıza bildirimlerini tutar. Bu sayfayı işletme sahibi ve satış danışmanı görür.',
      gorevler: [{ baslik: 'Garanti kaydı açma', sahneler: [{ git: 'garanti', once: [['tikla', 'button@Kayıt aç']], kirp: 'pencere', adimlar: [['**Plaka**, **Ürün**, **Bildirim tarihi** ve **Arıza** zorunludur.', '.field@Arıza'], ['**Durum** **Açık**, **Üreticide**, **Kabul** veya **Ret** olur.', '.field@Durum'], ['**Sonuç ve üretici yanıtı** alanına sonucu yazın.', '.field@Sonuç'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] }] },

    { id: 'eski', ne: 'Müşteriden alınan ömrünü tamamlamış lastikleri ve yetkili toplayıcıya teslimi kaydeder. Giriş iş emrinden gelir. Süre ve yükümlülük yorumu için çevre mevzuatını ve belediyenizi kontrol edin. Bu sayfayı işletme sahibi ve satış danışmanı görür.',
      gorevler: [{ baslik: 'Toplayıcıya teslim', sahneler: [{ git: 'eski', kirp: 'ana', adimlar: [['**Toplayıcıya teslim** adet, tarih, toplayıcı ve belge numarası sorar.', '#out'], ['**En eski bekleme** elde en uzun bekleyen lastiğin gün sayısıdır, sınır Ayarlardan gelir.', '.kpi@En eski bekleme']] }] }] },

    { ...O.imzali(), ne: 'Karşı tarafa ekranda imzalatılan belgeler içindir. Bu programda hazır form gelmez. Form eklemek için **Şablonları tasarla** düğmesini veya Ayarlar sayfasındaki **Hazır şablonlar** bölümünü kullanın. Otel ve teslim imzaları ilgili ekrandan alınır.', gorevler: [{ baslik: 'Form ekleme', sahneler: [{ git: 'imzali', kirp: 'ana', adimlar: [['Form tasarlamak için **Şablonları tasarla** düğmesini kullanın.', 'a@Şablonları tasarla']] }] }] },
    O.belgeler({ tur: 'İş emri ve teslim fişi' }),
    O.ayarlar({ alanlar: [['DOT sarı uyarı (yıl, işletme tercihi)', 'Bu yaştan sonra sarı uyarı görünür.'], ['DOT kırmızı uyarı (yıl, işletme tercihi)', 'Bu yaştan sonra ürün eski DOT sayılır.'], ['Saklama ücreti (₺)', 'Otel girişinde önerilen ücret.'], ['Bijon kontrolü (km)', 'Fişe yazılan hatırlatma.'], ['Eski lastik bekleme uyarısı (gün)', 'Bu süreyi aşan bekleme kırmızı görünür.'], ['Giriş formu şartları (avukatınıza gösterin)', 'Lastik oteli giriş formuna yazılır.']] }),
    O.bildirimler(),
    O.ebelge(),
    O.entegrasyonlar(),
  ],

  roller: 'Lastik ustası iş emri ve otel kaydı yazar. Ödeme, cari, garanti ve alış fiyatı bu role gönderilmez, teslim ve tahsilat yapamaz. Fiyat alanı açıktır, usta işçilik kalemi girebilir. Teslim et ve tahsil et düğmesi satış danışmanı ve işletme sahibinde görünür.',
  musteri: [{ ad: 'Lastiklerim sayfası', ne: 'Müşteri kendisine gönderilen bağlantıyla lastiklerinin DOT ve diş bilgisini, saklama ücretini ve durumunu görür. **Talep bırak** ile gelmek istediği tarihi yazar, talep **Lastik Oteli** sayfasındaki **Teslim talebi** kutusuna düşer. Üyelik gerekmez. Bağlantı giriş formundaki QR kodda ve **Müşteri bağlantısı** simgesindedir.',
    sahneler: [{ git: 'ozet', once: LASTIGIM, kirp: 'tam', boy: 1000, adimlar: [['Plaka ve durum üstte görünür.', '.tk-head'], ['Her lastiğin DOT ve diş bilgisi listelenir.', '.tk-panel'], ['**Talep bırak** teslim tarihi talebini iletir.', '#rq']] }],
    not: 'Bağlantıyı yalnız ilgili müşteriyle paylaşın.' }],
  yazdirma: { ne: 'Belgeler işlem yapılan ekrandan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Lastik oteli giriş formu', 'Lastik alınınca açılır. Sonradan **Giriş formu** simgesiyle.'], ['Lastik oteli çıkış formu', 'Çıkış yapılınca açılır.'], ['Lastik etiketi', '**Etiket yazdır** simgesi.'], ['İş emri ve teslim fişi', 'İş emrinde **Fiş** düğmesi veya teslimde **Fiş yazdır** seçeneği.']] },

  entegrasyon: {
    sms: { degisir: [AKIS('SMS', 'Deneme hesap bakiyesini okur, ileti göndermez, kredi harcamaz.'), 'Bağlandıktan sonra otele lastik alınınca ve **İş hazır** düğmesiyle müşteriye mesaj gider. **Sezon Hatırlatma** sayfasındaki gönderimler gerçek SMS olur.', 'SMS gidemezse program WhatsApp ile göndermeyi önerir.', 'Bağlantı yokken gönderim **TEST** kalır, müşteriye bir şey gitmez.'], sorun: [...DENEME_HATA, 'Hata görünüyorsa sağlayıcı panelindeki kredi ve onaylı başlık bilgisini kontrol edin.'] },
    whatsapp: { degisir: ['SMS gönderilemediğinde çıkan öneri ve **Sezon Hatırlatma** sayfasındaki **WhatsApp ile gönder** WhatsApp’ı hazır mesajla açar, mesajı siz gönderirsiniz.', 'Bu düğmeler için hesap bağlamak gerekmez. Cloud API bağlansa da bu programda otomatik WhatsApp gönderimi olmaz.'], sorun: ['WhatsApp açılmıyorsa müşterinin telefonunu kontrol edin.'] },
    efatura: { kapali: { edm: ILETISIM, logo: ILETISIM, mysoft: ILETISIM, sovos: ILETISIM }, degisir: [AKIS('e-Fatura / e-Arşiv', 'Deneme entegratöre zararsız bir istek atar, belge kesmez.'), 'Bağlandıktan sonra teslim penceresindeki **e-Arşiv / e-Fatura kes** seçeneği belgeyi entegratöre gönderir.', 'Belgeler **e-Belgeler** sayfasında görünür. Bağlantı yokken belge **TEST** etiketi taşır, GİB’e gitmez.'], sorun: [...DENEME_HATA, 'Fatura kesilemedi uyarısında **e-Belgeler** sayfasındaki hata ayrıntısına bakın.'] },
    printer: { degisir: ['Belgeler ve etiket tarayıcının yazdırma penceresiyle basılır, yazıcı orada seçilir.', 'Bu ayardaki deneme yazıcının çalıştığını görmenizi sağlar.'], sorun: ['Kâğıt boyu yanlışsa **Belge şablonları** sayfasından değiştirin.'] },
    backup: O.E.backup(),
  },
});
