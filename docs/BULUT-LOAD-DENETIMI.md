# Bulut kipinde `db.load()` denetimi

Tarih: 31.10.2026. Dal: `claude/bulut-load-denetim`, taban `fe72121`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

**e-Belge bulutta numara tekrar ediyor ve belge kaybolabiliyor.** Sebep `core/integrations.js` içinde, program dosyasından düzeltilemez, `CLAUDE.md` §4 gereği çekirdeğe dokunulmadı. Kullanıcı onayı bekliyor (aşağıda "Çekirdek önerisi").

Gerçek sunucu ve MariaDB ile, simülasyon sağlayıcısında, art arda üç `NS.ebelge.create`:

| | Üretilen numaralar | Sunucuda kalan belge |
|---|---|---|
| Çekirdek yaması yok | `EAR2026000000001` üç kez | 1 |
| Çekirdek yaması var | `...001`, `...002`, `...003` | 3 |

Sebep: `nextNo` sırayı artırıp kaydeder, 350 ms dolmadan `create` içindeki `store.load()` bu artışı siler (`core/integrations.js:919`, `:939`), `send` sonrası `log` içindeki `store.load()` da belgeyi siler (`:13`). Gerçek entegratörle denenmedi (test hesabı yok). Sıra artışının silindiği kod yolu sağlayıcıdan bağımsızdır, belgenin silinmesi ise `log` çağrısına kadar geçen süreye bağlıdır.

Aynı sebeple entegrasyon ayarı da kayboluyor: `setCfg` ardından 350 ms içinde `log` çalışırsa ayar sunucuya gitmiyor. Ayar penceresindeki "Test et" bu yoldan geçiyor (`core/integrations.js:779`). Kanıt programatik çağrıyla alındı, pencere elle tıklanmadı.

## Yöntem

Başsız Chrome, gerçek `server.js`, MariaDB. Hesap API ile açıldı, belge tohumlandı, işlem gerçek düğmeye basılarak yapıldı, 1,5 sn sonra sonuç ayrı oturumla `GET /api/data/:app` üzerinden okundu. Aynı senaryolar üç kopyada koştu: düzeltmesiz taban, program düzeltmeleri, düzeltmesiz programlar + çekirdek yaması. Betik oturuma özeldir, depoda yok. Üç koşuda da konsol istisnası sıfır.

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

## Çekirdek önerisi

`core/core.js` `_cloudLoad` başına tek satır, `_watch`taki koşulun aynısı:

```js
if (this.data && (this._dirty || this._flight)) return; // bekleyen kayıt var: sunucudaki hâl üstüne yazmaz, çakışmayı gönderim birleştirir
```

Düzeltmesiz programlarla ayrı kopyada sınandı: yukarıdaki tüm senaryolar korundu, e-Belge numaraları benzersiz, ayar kaldı, başka oturumun verisi geldi (15 sn), konsol hatası yok. Depoya uygulanmadı.

- `_flight` koşulu: gönderim sürerken gelen `load` eski hâli okur, `_base` ve `_v` ile bellek ayrışır. Program tarafında bu da korunuyor.
- `if (!db.cloud)` düzeltmeleri çekirdek yamasından sonra da kalmalı, her çizimde eşzamanlı istek atmıyorlar. `_dirty` koşulları zararsızca gereksizleşir.
- Yan etki: bekleyen kayıt varken `load` sessizce atlanır, ekran 350 ms eski kalabilir. `_watch` zaten aynı davranıyor.
- Canlıda e-Belge kesen hesap varsa tekrar eden numaralar ve eksik belgeler ayrıca incelenmeli; bu denetim yalnız yerel test verisine baktı.

## Testler

`server/test/bulut-load.test.js`: 33 test, gerçek dosyalar vm içinde, `load` gerçek davranışı taklit eder. Her düzeltme tek tek geri alındığında test kırıldı (11 dosyanın 11'i).

Denenmedi: telefon genişliği, koyu tema, boş liste. Arayüz metni ve düzeni değişmedi. Çekirdek değişmediği için başka programların açılış sınaması gerekmedi.

`npm test` zinciri tek tek koşuldu: 69 dosyadan 68'i geçti. `server/test/bilet-kural.test.js` kaldı ("Online satış kapandı"); düzeltmesiz tabanda da aynı hatayı veriyor, bu değişiklikle ilgisi yok, zincir `&&` ile bağlı olduğu için `npm test` orada durur.
