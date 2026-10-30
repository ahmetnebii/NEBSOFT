# Çekirdek istekleri: Düğün, Yurt, Fotoğrafçı, Oyun Salonu

Bu oturum `core/` altına dokunmadı. Tarih 30.10.2026. Dal `claude/rezervasyon-aile-faf00d`. Program kimlikleri: `dugun`, `yurt`, `fotograf`, `oyun`.

| # | Dosya | İstek | Gerekçe | Öncelik |
|---|---|---|---|---|
| Ç1 | `core/kurulum-adimlari.js` | Dört programa 3-5 kurulum adımı ekleyin (aşağıda). | `server/test/yardim.test.js` şimdilik adımı olmayan programı atlıyor (`KAYITLI`). Satırlar gelince bu süzgeç kaldırılır. | Yüksek |
| Ç2 | `site/tools/yardim-icerik.js`, `core/yardim.json`, `core/kb.json`, `docs/video/<id>.md` | Yardım, bilgi bankası ve video senaryosu üretilsin. | Yeni programlarda yardım merkezi ve destek asistanı içeriği yok. | Orta |
| Ç3 | `core/bizsite.js` | İşletme sitesi eşlemesi: yurt `Hostel`, düğün `EventVenue`, fotoğrafçı `ProfessionalService`, oyun `EntertainmentBusiness` (schema.org türleri hafızadan, doğrulanmadı). | Yeni program işletme sayfalarında genel türle görünür. | Düşük |
| Ç4 | `core/integrations.js` `WHERE`, `SECTOR` | Dört programda SMS ve yazıcının nerede kullanıldığı metni. | Şimdilik genel metin görünür. | Düşük |
| Ç5 | `server/cloud/sablon.js`, `content/sablonlar/` | Dört programa hazır şablon (`hazir-paketler` oturumuyla çakışmasın). | `PROGRAMLAR` listesinde yoklar, şablon içe aktarılamaz. | Orta |
| Ç6 | `admin/data.js` `SEC_PID`, `ic-araclar/nebsoftpazarlama/esleme.js` | Sektör eşlemesi. | Yönetim demosu ve pazarlama aracı yeni programları tanımıyor. | Düşük |
| Ç7 | `core/core.js` NS.dosya, `server/cloud/dosya.js` | Müşteri belirteciyle okunan bir dosya sınıfı. | Fotoğrafçı galerisi `acik` sınıfta. Müşteri fotoğrafı için daha sıkı erişim gerekir. Ayrıntı `docs/urun/FOTOGRAF.md`. | Orta |
| Ç8 | `index.html`, `site/`, `README.md`, `docs/PROJE-OZETI.md` | Birleştirmeden sonra `node site/tools/build-sites.js` çalıştırın; "31 program" yazan metinleri güncelleyin. | Paralel oturumlarla çakışmasın diye üretilmiş ortak sayfalar yeniden yazılmadı. `/programlar` ve `/fiyatlar` yeni programları ancak bu adımdan sonra gösterir. | Yayından önce şart |
| Ç9 | `.claude/launch.json` | Bu oturum 5074 portu için yerel giriş ekledi, commit edilmedi. | Bilgi. | - |

## Ç1 için hazır satırlar

```js
dugun: [S('salon', 'Salonlarınızı girin', 'Salon adı ve kapasitesini ekleyin.', 'salonlar', 'halls'), S('paket', 'Paketlerinizi girin', 'Fiyat ve dahil olanları yazın.', 'paketler', 'packages'), S('etkinlik', 'İlk etkinliği açın', 'Takvimden tarih seçip opsiyon açın.', 'takvim', 'events')],
yurt: [S('donem', 'Dönemi tanımlayın', 'Tarih ve aylık ücreti girin.', 'donemler', 'terms'), S('oda', 'Odalarınızı ekleyin', 'Kat, oda ve yatak sayısını girin.', 'odalar', 'rooms'), S('ogrenci', 'İlk öğrenciyi kaydedin', 'Oda ve yatak seçin.', 'ogrenciler', 'students')],
fotograf: [S('paket', 'Paketlerinizi girin', 'Fiyat ve teslim süresini yazın.', 'paketler', 'packages'), S('foto', 'Fotoğrafçıları ekleyin', 'Takvimde görünecek kişileri tanımlayın.', 'personel', 'staff'), S('cekim', 'İlk çekimi açın', 'Takvimden tarih seçin.', 'takvim', 'shoots')],
oyun: [S('tarife', 'Tarifenizi girin', 'Saatlik ücreti yazın.', 'tarifeler', 'tariffs'), S('istasyon', 'İstasyonları ekleyin', 'Konsol, bilardo ve masaları tanımlayın.', 'istasyonlar', 'stations'), S('menu', 'Kafe menüsünü girin', 'İlk ürünü ekleyin.', 'menu', 'menu')],
```

## Ç2 için hazır satırlar: `site/tools/yardim-icerik.js`

Bu satırlar `core/yardim.json` ve `core/kb.json` üretir, bu yüzden uygulanmadı. Kalın ifadelerin hepsi programların kodunda geçiyor ve vaat denetiminden geçiyor (30.10.2026 denendi). Ç1 ile birlikte eklenir, sonra `node site/tools/build-yardim.js` ve `node site/tools/build-kb.js` çalıştırılır. Üretilen `docs/video/<id>.md` süresi 60-90 saniye dışında kalırsa metin kısaltılır; bu üretim denenmedi.

```js
  dugun: { kanca: 'Aynı tarih iki kişiye verilir diye mi korkuyorsunuz? Bu videoda Düğün Salonu programıyla ilk opsiyonu açıyoruz.',
    gorevler: [['Tanımlar', ['**Salonlar** sayfasında salonunuzu girin.', '**Paketler** sayfasında fiyatı ve dahil olanları yazın.']],
      ['Opsiyon', ['**Takvim** sayfasında boş güne tıklayın.', 'Müşteri ve paketi seçip **Devam** düğmesine basın.']],
      ['Kesinleştirme', ['Etkinlik kartında **Kesinleştir** düğmesine basın.', '**Sözleşme hazırla** ile imzalatın.', 'Ödemeleri **Tahsilat** ile alın.']]],
    ipucu: 'İmzalı sözleşmede fiyat değişikliğini Ek protokol ile yazın.',
    sss: [['Süresi dolan opsiyon ne olur?', 'Tarih boşalır, kayıt silinmez. **Opsiyon uzat** ile süreyi uzatabilirsiniz.'], ['Bekleyen iadeleri nerede görürüm?', '**Salon Özeti** sayfasındaki **Bekleyen iadeler** listesinde.']] },
  yurt: { kanca: 'Hangi yatak boş, kim dışarıda, deftere bakmadan bilebiliyor musunuz? Bu videoda Yurt programıyla ilk öğrenciyi kaydediyoruz.',
    gorevler: [['Kurulum', ['**Dönemler** sayfasında aylık ücreti girin.', '**Odalar** sayfasında kat ve yatak sayısını yazın.']],
      ['Kayıt', ['**Öğrenciler** sayfasında **Yeni kayıt** düğmesine basın.', 'Doğum tarihini ve veli bilgisini girin.', 'Oda ve yatağı seçin.']],
      ['Günlük', ['**Giriş & Çıkış** sayfasında öğrenci numarasını okutun.', '**Yoklama** ve **İzinler** sayfalarını kullanın.']]],
    ipucu: 'Reşit öğrencinin velisi yalnızca öğrencinin kayıtlı izniyle bilgi görür.',
    sss: [['Kimlik bildirimi otomatik mi?', 'Hayır. **Kimlik Bildirimi** sayfası yapılacakları listeler, bildirimi yetkili sistemden yaparsınız.'], ['Oda değişikliği nasıl yapılır?', 'Öğrenci kartında **Oda değiştir** ile.']] },
  fotograf: { kanca: 'Teslim tarihi aklınızdan çıkıyor mu? Bu videoda Fotoğrafçı programıyla ilk çekimi açıyoruz.',
    gorevler: [['Tanımlar', ['**Paketler** sayfasında fiyat ve teslim süresini girin.', '**Fotoğrafçılar** sayfasında ekibinizi ekleyin.']],
      ['Çekim', ['**Çekimler** sayfasında **Yeni çekim** düğmesine basın.', 'Tarih ve fotoğrafçıyı seçin.', 'Çekim kartında **Kesinleştir** düğmesine basın.']],
      ['Galeri', ['Çekim kartında **Fotoğraflar** ile yükleyin.', '**Müşteriye açık** seçeneğini işaretleyin.', '**Teslim Takibi** sayfasından izleyin.']]],
    ipucu: 'Kartı silmeden önce iki yedek kopyayı işaretleyin.',
    sss: [['Müşteri fotoğraf seçimini nerede yapar?', 'Galeri sayfasında seçer ve **Seçimi bitir** ile kilitler.'], ['Örnek çalışma izni nerede?', 'Çekim kartındaki **Yayın izni** bölümünde.']] },
  oyun: { kanca: 'Süre ve ücret tartışmasından yoruldunuz mu? Bu videoda Oyun Salonu programıyla ilk masayı başlatıyoruz.',
    gorevler: [['Tanımlar', ['**Tarifeler** sayfasında saatlik ücreti girin.', '**İstasyonlar** sayfasında konsol ve masaları ekleyin.']],
      ['Salon', ['**Salon** sayfasında boş istasyona dokunun.', '**Başlat** düğmesine basın.', 'Açık istasyondan kafe kalemi ekleyin.']],
      ['Hesap', ['**Hesabı kapat** düğmesine basın.', 'Ödeme türünü seçin.', '**Kasa** sayfasından günü kontrol edin.']]],
    ipucu: 'Kart bakiyesi silinmeyen bir deftere yazılır, üye telefonundan görür.',
    sss: [['Çocuk nasıl teslim edilir?', 'Çocuk alanında **Teslim** düğmesiyle, kayıtlı kişiye.'], ['Doğum günü nerede?', '**Doğum Günü** sayfasında.']] },
```

## Ç4 ek: `core/integrations.js` `USED`

`USED` satırı yokken ekran programın `integrations` listesine döner, kırılma olmaz. Ancak bu liste WhatsApp, e-posta, POS ve yazıcı gibi kodda çağrılmayan bağlantıları da gösteriyor. Çekirdek satırı gelene kadar bu fazlalık görünür.

```js
dugun: ['sms', 'backup'], yurt: ['sms', 'backup'], fotograf: ['sms', 'backup'], oyun: ['sms', 'backup'],
```

## Testlerin birleştirmeye kadarki durumu

`core/` satırları gelmeden üç test ancak gevşetilerek yeşil kalıyor. Bu yüzden "npm test geçti" denemez.

| Test | Gevşetme | Neden | Satır gelince |
|---|---|---|---|
| `server/test/yardim.test.js` | `KAYITLI` süzgeci dört programı denetim dışı bırakıyor | `core/kurulum-adimlari.js`, `core/yardim.json`, `core/kb.json`, `docs/video/<id>.md` kaydı yok. Süzgeç olmasa kırmızı olur. | Süzgeç kaldırılır |
| `server/test/program-duman.test.js` | Program sayısı `=== 31` yerine `>= 31` | Program sayısı 35 oldu. Süzgeç olmasa kırmızı olur. | Yeni sayı yazılır |
| `server/test/sablon.test.js` | `=== 31` yerine `>= 31` | `PROGRAMLAR` hâlâ 31, dört programın şablonu yok (Ç5). Testin "tüm programlarda şablon var" iletisi bu dört program için doğru değil. | Şablon eklenince sayı yazılır |
