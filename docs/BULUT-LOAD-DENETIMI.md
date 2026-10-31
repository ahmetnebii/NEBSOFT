# Bulut kipinde `db.load()` denetimi

Tarih: 31.10.2026. Dal: `claude/bulut-load-denetim`, taban `fe72121`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Bu denetimden kalan engel yok, çekirdek yaması kullanıcı onayıyla uygulandı. Canlıda e-Belge kesmiş bulut hesabı varsa geçmiş kayıtlar ayrıca incelenmeli: tekrar eden numaralar ve eksik belgeler yama ile düzelmez.

## e-Belge hatası (giderildi)

Gerçek sunucu ve MariaDB ile, simülasyon sağlayıcısında, art arda üç `NS.ebelge.create`:

| | Üretilen numaralar | Bu üç belgeden sunucuda kalan |
|---|---|---|
| Yama öncesi | `EAR2026000000001` üç kez | 1 |
| Yama sonrası | `...001`, `...002`, `...003` | 3 |

Sebep: `nextNo` sırayı artırıp kaydeder, 350 ms dolmadan `create` içindeki `store.load()` bu artışı siler (`core/integrations.js:919`, `:939`), `send` sonrası `log` içindeki `store.load()` da belgeyi siler (`:13`). Gerçek entegratörle denenmedi (test hesabı yok).

Aynı sebeple `setCfg` ardından 350 ms içinde `log` çalışırsa entegrasyon ayarı sunucuya gitmiyordu. Ayar penceresindeki "Test et" bu yoldan geçiyor (`core/integrations.js:779`). Kanıt programatik çağrıyla alındı, pencere elle tıklanmadı.

## Yöntem

Başsız Chrome, gerçek `server.js`, MariaDB. Hesap API ile açıldı, belge tohumlandı, işlem gerçek düğmeye basılarak yapıldı, 1,5 sn sonra sonuç ayrı oturumla `GET /api/data/:app` üzerinden okundu. Aynı senaryolar üç kopyada koştu: düzeltmesiz taban, program düzeltmeleri, düzeltmesiz programlar + çekirdek yaması; sonra son hâl. Betik oturuma özeldir, depoda yok. Üç koşuda da konsol istisnası sıfır.

## Sonuç

| Çağrı | İşlem | Taban | Düzeltme sonrası | Düzeltme |
|---|---|---|---:|---|
| `apps/emlak/app.js:227` | Başvuru "arandı" | KAYIP | korundu | `if (!db.cloud)` |
| `apps/eticaret/pazaryeri.js:154` | Ürün gönderim kaydı | KAYIP | korundu | `if (!db.cloud)` |
| `apps/eticaret/pazaryeri.js:231` | Soru taslak yanıtı | KAYIP | korundu | `if (!db.cloud)` |
| `apps/crm/app.js:214` | Teklif kabul | KAYIP | korundu | `if (!db.cloud)` |
| `apps/crm/app.js:249` | Görev tamamlama | KAYIP | korundu | `if (!db.cloud)` |
| `apps/klinik/app.js:298` | Toplu SMS kaydı | KAYIP | korundu | `if (!db.cloud)` |
| `apps/muhasebe/beyan.js:34` | Cari mutabakat | KAYIP | korundu | `if (!X.db.cloud)` |
| `apps/randevu/app.js:555` | 5 dk turu, bekleyen kayıt | 46 kayıttan 24'ü kaldı | 47'de 47 | bekleyen kayıt yoksa okur |
| `apps/veteriner/app.js:187` | Art arda iki satış | 1 satış, stok 9 | 2 satış, stok 8 | bekleyen kayıt yoksa okur |
| `apps/site/app.js:284` | Art arda iki kod | ilki silindi | ikisi kaldı | bekleyen kayıt yoksa okur |
| `apps/bilet/ek.js:116` | 4 sn yoklama, bekleyen kayıt | 69 kayıttan 10'u kaldı | 71'de 71 | bekleyen kayıt yoksa okur |
| `apps/siparisortak/takip.js:21,36,40` | Personel `/t/` olmadan açarsa | taban koşulmadı, vm testi kaybı yakaladı | vm testi geçti | `!db.cloud` |
| `apps/saha-ortak/portal.js:24,29` | Personel `/t/` olmadan açarsa | KAYIP | korundu | `!db.cloud` |

Olasılık farkı: emlak, eticaret, crm, muhasebe ve klinik toplu SMS her tıklamada kayıp verir, `save(); draw()` zincirinde. Klinik kasaya kayıttan hemen sonra geçiş (`app.go`) yalnızca betikle sınandı, programda bu yolla giden akış bulunamadı. Veteriner ve site yalnızca 350 ms içinde ikinci işlemde kayıp verir: insan için zor, barkod okuyucuda olası. Randevu yalnızca otomatik hatırlatma ve gerçek SMS sağlayıcısı açıksa. Bilet canlı ekranında kayıt kaynağı arka plandaki `B.expire`dır ve bir dakika sonra tekrar çalışıp kendini onarır; senaryo betikten sürekli kayıtla ölçüldü.

## `load` bulutta gerekli mi

- Liste ekranları (emlak, eticaret, crm, klinik, muhasebe): gerekmez. `_watch` 15 sn'de bir sürüm yoklar, `app.refresh` çağırır. Gerçek sunucuda başka oturumun web başvurusu emlak ekranına 14 sn'de geldi. Ek kazanç: arama kutusunda her tuşta çalışan eşzamanlı sunucu isteği kalktı.
- Randevu turu: gerekir, gizli sekmede `_watch` çalışmaz.
- Veteriner stok, site ziyaretçi kodu: gerekir, güncel veri işlemin doğruluğunu belirler. Portaldan az önce gelen kod güvenlikte hemen doğrulandı.
- Bilet canlı ekran: gerekir, kapıdaki giriş 4 sn içinde görünmeli.

Bu dört yerde `if (!db._dirty && !db._flight) db.load();` kullanıldı: bekleyen kayıt varken bellek esas alınır, yokken sunucudan okunur.

## Etkilenmeyenler

- `apps/randevu/app.js:652`, `apps/eticaret/app.js:430`, `apps/bilet/app.js:316`, `apps/adisyon/app.js:655`, `market/market.js:1023`: `storage` dinleyicisi. Bulut kaydı `localStorage`daki `db.key`i yazmaz (gerçek sunucuda doğrulandı), olay bulut kaydından doğmaz. Tek istisna: aynı tarayıcıda `?demo=1` sekmesi aynı programda kayıt yaparsa olay gelir; 350 ms çakışması gerektiği için dokunulmadı.
- `apps/siparisortak/takip.js`, `apps/saha-ortak/portal.js` müşteri kipi (`/t/<işletme>/`): `db.pub` kaydı eşzamanlı POST ile gider, `load` kayıp vermez. Saha portalında gerçek sunucuda doğrulandı.
- `core/notify.js:184`: zaten `!app.db.cloud` koşullu.
- `core/integ-wizard.js`: `entegrasyon-kurulum` bulut belgesi değil (`catalog.js` `SHARED` listesinde yok), `localStorage`da.
- `apps/pos/hizli.js`, `apps/emlak/portal.js`: önceden düzeltilmiş.

## Çekirdek düzeltmesi

`core/core.js` `_cloudLoad` başına tek satır eklendi, `_watch`taki koşulun aynısı: bekleyen kayıt varsa (`_dirty`) veya gönderim sürüyorsa (`_flight`) `load` hiçbir şey yapmaz. Sunucudaki değişikliği gönderimin çakışma birleştirmesi getirir.

Sınama iki kez yapıldı: düzeltmesiz programlar + yama, sonra depodaki son hâl. İkisinde de tüm senaryolar korundu, başka oturumun verisi geldi (14-15 sn), konsol hatası çıkmadı. Tarayıcı senaryoları 11 programı açtı, çekirdek değiştiği için istenen "başka programlar da açılıyor" sınaması budur.

- `if (!db.cloud)` düzeltmeleri kaldı, her çizimde eşzamanlı istek atmıyorlar. Programlardaki `_dirty` koşulları artık gereksiz ama zararsız.
- Yan etki: bekleyen kayıt varken `load` sessizce atlanır, ekran kısa süre eski kalabilir. `_watch` zaten aynı davranıyor.

## Testler

`server/test/bulut-load.test.js`: 36 test. Program testleri gerçek dosyaları vm içinde çalıştırır, `load` gerçek davranışı taklit eder; çekirdek testleri gerçek `core/core.js` ile koşar. Her düzeltme tek tek geri alındığında test kırıldı (12 dosyanın 12'si).

Denenmedi: telefon genişliği, koyu tema, boş liste. Arayüz metni ve düzeni değişmedi.

`npm test` zinciri çekirdek yamasıyla tek tek koşuldu: 69 dosyadan 68'i geçti, XSD dahil. `server/test/bilet-kural.test.js` kaldı ("Online satış kapandı"); düzeltmesiz tabanda da aynı hatayı veriyor, bu değişiklikle ilgisi yok, zincir `&&` ile bağlı olduğu için `npm test` orada durur.
