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
