# Birleştirme raporu: `birlesik/hepsi`

Tarih: 2026-10-31. Kod ve üretim son commit: `97137b9`, son `npm test` bunun üstünde koştu. Bu rapor ayrı bir belge commit'idir. `devir/hepsi` (`d5f4e06`) güncellenmedi, push yapılmadı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

### Yayın için gereken

1. **Kılavuz PDF'leri depoda değil.** 50 PDF yalnız bu çalışma kopyasının `indir/kilavuz/` klasöründe, 282 MB. Ana klasöre kopyalanmazsa `seo-denetim` 50 kesin hata verir, `hosting-paketi.js` durur. Barındırma planı bu boyutu taşımalı.
2. **Hiçbir sağlayıcı gerçek test hesabıyla denenmedi.** Ödeme dahil. Canlı kart kilitleri kapalı.
3. **Destek telefonu ve e-postası teyit bekliyor.** Kılavuzda `site/src/site.config.js` değerleri yazar, logo da kesin değil. Değişirse kılavuzlar yeniden üretilir.
4. **Gerçek telefon denemesi yok.** iOS Safari çalıştırılmadı, Android uygulaması derlenmedi. Ayrıntı `docs/test/telefon.md`.

### Bu iki birleştirmede kapanan

- `sw.js` sürümü yükseltildi, son değer `nebsoft-v3-96` (saha E9).
- Gece kırılan `bilet-kural.test.js` (ticaret 8 ve üç rapor).
- Panelden açılan iyzico kilidi birleşik kodda çalışıyor, borç tahsilatı süresi panelden okunuyor.
- Paraşüt notu kodla uyumlu, `core/integ-guides.js`.
- Kılavuzlarda eski sihirbaz ve "Henüz kullanılamıyor" kalmadı. `danisan` yayın dışı.
- Telefon denetiminin kod maddeleri (`docs/test/telefon.md`: "Bu turda kodda açık engel kalmadı").

### Kılavuz oturumlarının bildirdiği sahte başarı ve yanlış kayıt

Tam liste `docs/kilavuz/PROGRAM-HATALARI.md`. Bu maddeler kod okumasıdır, burada yeniden denenmedi. CLAUDE.md §1 kapsamında olduğu için öne alındı:

- `apps/site/sakin.html`: yerelde her 16 haneli kart kabul edilir, kalıcı makbuz oluşur.
- `apps/musavir/portal.html`: yalnız dosya adı kaydedilir ama "iletildi" yazar.
- `apps/otel/app.js`: POS TEST sonucu folyoya ödeme yazar. HotelRunner bağlayıcısı programla uyumsuz.
- `apps/bilet/app.js`: kapı açılmasa da bilet kullanıldı sayılır, `turnike` `UNVERIFIED` listesinde yok.
- `apps/klinik`, `apps/otel`: e-Fatura eski `sendEInvoice` yolundan gider, `NS.ebelge.create` kullanmaz (CLAUDE.md §4).
- `apps/randevu`, `apps/adisyon`, `apps/butik`, `apps/toptan`, `apps/kuyumcu`, `apps/kargo`, `apps/crm`, `apps/servis`, `apps/kiralama`, `apps/galeri`, `apps/spor`, `apps/kurs`, `apps/anaokulu`, `apps/emlak`: e-Belgeler menüde, `efatura` `USED` listesinde yok. Entegratör bağlanamaz, fatura TEST kalır. Liste notlardan alındı, satır satır yeniden doğrulanmadı.
- `core/integ-guides.js` `PAYLIMIT`: müşteriye açık kart ödemesi "henüz yoktur" diyor. iyzico, PayTR, Papara, Paynet, Craftgate için `integ-guides-sunucu.js` üstüne yazar, kalan sağlayıcılar için metin geçerli olabilir, denetlenmeli.
- `docs/kilavuz`: e-SMM kartı kılavuzda "açtırılır" der, kodda Paraşüt doğrudan gönderimi var, sihirbaz "desteklenmiyor" gösterir. UYUMSUZ, karar gerekli.

### Test raporlarından açık kalan kod maddeleri

Aşağıdaki listeler ilk birleştirmedendir. İkinci birleştirmede `server/cloud/rol-kural.js`, `belge.js`, `dosya.js` ve `market/catalog.js` hiç değişmedi, `core/integrations.js` içinde `UNVERIFIED`, `EFAT_OK` ve WhatsApp isteği aynı kaldı. `npm test` çıktısında `AÇIK` satırı yine 9 tanedir.

İlk birleştirmede beş test raporundaki (`docs/test/*.md`) kod maddeleri tek listede. Kontrol biçimi: ticaret 4.1-4.3 ve üyelik 1-6 birleşik hâlde `npm test` çıktısında `AÇIK` satırıyla göründü. `belge.js` ve `integrations.js` maddeleri kodda arandı. Rezervasyon ve saha rol maddeleri için `rol-kural.js` farkı okundu, o kurallara dokunan değişiklik yok; bu maddeler ayrıca çalıştırılmadı. Program içi eksikler (`apps/nakliyat`, `apps/ciftci`, `market/catalog.js`) rapordan taşındı, yeniden denenmedi.

### Düzeltilmemiş, sunucu rol kuralı (`server/cloud/rol-kural.js`)

| Kaynak | Program | Sorun |
|---|---|---|
| rezervasyon E2 | tümü | Rolü yalnız bir programda tanımlı ekip üyesi diğer programlarda filtresiz belge alır (`rolCoz` rol yoksa `null`). Oyun görevlisi yurt verisini okuyabilir |
| rezervasyon E4 | oyun | Süre adisyonunda kasiyerin sınır içi indirimi sessizce silinir, `ara` süre ücretini saymıyor |
| rezervasyon E5 | fotograf | Teslim tutanaksız kalabilir, kapora almadan talep aşaması atlanabilir |
| saha E4 | nakliyat, temizlik, peyzaj | `SAHA_FIYAT` eksik: `services.price`, `items.price`, birim ücretler, `_settings.taxNo` ekibe gider |
| saha E5 | usta | Usta onaylı `lines` ve `accepted` değerini değiştirebilir, ekip kendi işinin `team` alanını da |
| ticaret 4.1 | okulservisi | Şoför başka güzergâha yeni sefer kaydı yazabilir |
| ticaret 4.2 | ciftci | Kantar eski alımın fiyatını ve durumunu değiştirebilir |
| ticaret 4.3 | mobilya, lastik | Eski iş notundaki tutar ve eski `jobs[].items[].cost` ustaya gider |
| üyelik 1-3 | danisan | Uzman kilitli notun eklerini değiştirir, başka uzmanın danışanına not yazar, `owner` alanını devreder |
| üyelik 4-6 | egitim | Eğitmene tüm kursiyerler, sertifika kodları ve diğer eğitmenlerin telefonu gider |

### Düzeltilmemiş, diğer kod

| Kaynak | Dosya | Sorun |
|---|---|---|
| rezervasyon E1 | sunucu birleştirme | Çift rezervasyon yalnız tarayıcıda engelli. İki PUT birleşince aynı salon ve seans iki kez kaydolur. Yurt yatağı, fotoğrafçı, oyun alanı aynı yoldan geçer (kod okuması) |
| rezervasyon E3 | `server/cloud/dosya.js`, `core/core.js` | `/f/` adresi kalıcı ve girişsiz açık, `public, immutable`, `noindex` yok. Çocuk fotoğrafı için kabul edilemez, karar gerekli |
| ticaret 1 | `server/cloud/belge.js` | `okulservisi` şifreli değil, `ciftci` için karar bekliyor. `SIFRELI` listesinde ikisi de yok |
| ticaret 2 | `core/integrations.js` | `emustahsil` `UNVERIFIED` listesinde değil, karşı taraf numara dönmese de yerel `EMU…` numarası başarı olarak döner |
| ticaret 3 | `apps/ciftci` | e-Fatura mükellefi kooperatif için e-Müstahsil yok (GİB zorunluluğu) |
| siparis E3 | `core/integrations.js` | Uyumsoft `EFAT_OK` içinde, resmî dokümanla doğrulanmadı |
| siparis E4 | `core/integrations.js` | WhatsApp isteğinde `recipient_type` yok |
| siparis E7 | `core/integrations.js` | Fiş ve etiket yazıcı ağ/seri kipleri doğrulanmadan seçilebilir |
| saha E1, E2 | `apps/nakliyat` | U-ETDS kaydı ve taşıma irsaliyesi yok, yeni belge türü onayı gerekir |
| saha E6 | `core/integrations.js` | `pos`, `email`, `whatsapp`, `webhook`, `callerid`, fiş yazıcı dört saha programında çağrılmıyor |
| rezervasyon E6 | `core/integrations.js` | Verimor ticari ileti alanları gönderilmiyor |
| üyelik 7, 8 | `market/catalog.js` | `danisan` tanıtım sayfası ve demosu herkese açık, satış yolları kapalı |

Kod dışı maddeler (test hesabı, avukat, mevzuat metni, fiyat onayı, KDV kararı) kendi raporlarında durur. Hiçbir sağlayıcı gerçek test hesabıyla denenmedi. Kılavuz maddeleri `docs/kilavuz/DURUM.md` başında.

### Kapanan

- saha E9: `sw.js` `V` artırıldı, son değer `nebsoft-v3-94`.
- ticaret 8 ve üç raporda geçen gece kırılan `bilet-kural.test.js`: `test/bilet-saat-bagimsiz` ile çözüldü.

## İkinci birleştirme

| # | Dal | Sonuç | Çakışma |
|---|---|---|---|
| 1 | `claude/sunucu-tanimlari-cffcb8` (`73715d9`) | alındı | `package.json`, `sw.js`, `eticaret-odeme.js`, `index.js` |
| 2 | `claude/altyapi-83e71a` (`8c56112`) | alındı | `sw.js` |
| 3 | `claude/tasarim-butunluk` (`996e684`) | alındı | `package.json`, `sw.js` |
| 4 | `claude/telefon-183ca2` (`3e72e63`) | alındı | `package.json`, `sw.js` |
| 5 | `claude/grup-1-e70de7` … `claude/grup-5-202f1c` | beşi de alındı | yok |

Düzeltmeler:

- `server/cloud/tahsilat-odeme.js` ödeme süresini ortam değişkeninden okuyordu, kurulum paneline bağlandı. Çakışma görünmüyordu.
- `kurs`, `spor`, `site`, `egitim` kılavuzları online tahsilattan önceki durumu anlatıyordu, dördü de gerçek akışa getirildi. `site` için sağlayıcılar kapalı yazılıydı, açıldı.
- `egitim` kılavuzu kaldırılmış e-Belge modülünü anlatıyordu, üretici durdurdu, modül çıkarıldı.
- `oto` sahnesi rastgele demo kuyruğuna bağlıydı, sahne eksik durumları kendi ekliyor.
- `danisan` için `scripts/kilavuz/ayar.js` `YAYIN_DISI` eklendi, `server/test/kilavuz.test.js` bunu sınıyor.
- `uret.js` liste dosyasını yazarken paralel koşunun kaydını artık ezmiyor. Bu üretimde liste günlüklerden kuruldu, 50 kayıt ve 50 PDF eşleşti.

Sonuç:

- **`npm test`:** 83 dosya geçti, çıkış kodu 0, 1783 denetim. XSD çalıştı, atlanmadı. Veritabanı `nebsoft_test_b1`. Paralel oturumlarla çakışmasın diye testlerin kendi port değişkenleri verildi.
- **SEO:** 210 sayfa, kesin hata 0, uyarı 100 (`baslik-60` 94, `yetim` 2, `baslik-kalip` 2, `ayni-niyet` 1, `hiz-js` 1).
- **Kılavuz:** 50 PDF, 282,0 MB, 3332 sayfa, 1991 ekran. En büyüğü `fabrika` 13,4 MB, 15 MB sınırını aşan yok. `danisan` üretilmedi, adresi 404, listede yok. PDF metni 3332 sayfada taranarak "Henüz kullanılamıyor" dahil beş eski ifade aranıp 0 bulundu; yöntem yeni metinleri bularak sınandı.
- **Tarayıcı:** ana sayfa, `/paketler/`, `/fiyatlar/`, `/rehber/`, `/araclar/`, `/marketprogrami/` kılavuz bağlantısı (`pos.pdf` 200, `application/pdf`, `noindex`), `pos`, `egitim`, `dugun` tüm menü sayfaları, `/admin/#/kurulum`. 375 genişlikte yatay taşma yok, koyu temada arka plan ve üst menü her sayfada aynı, üst menü 65 px. Konsol ve sunucu günlüğü temiz. Kurulum sayfası yalnız bulut kipinde yüklenir, geçici veritabanıyla açıldı, veritabanı sonra silindi.

## Sayfaları gözle okunmamış kılavuzlar

**50 kılavuzun son baskısı sayfa sayfa okunmadı.** Bu turda yalnız üretici denetimi ve metin taraması geçti. Kılavuz oturumlarında önceki baskılardan okunan bölümler:

| Durum | Programlar |
|---|---|
| Önceki baskısı tümüyle okundu | `pos`, `terzi`, `eticaret` (ilk örnekler), `fotograf` (düzeltme öncesi), `klinik` (ilk baskı) |
| Kısmen okundu | `matbaa` (9-20, 33-36), `oyun` (25-32, 41-46 hariç), `mobilya`, `okulservisi`, `ciftci`, `lastik`, `dernek`, `egitim` (modül ve müşteri sayfaları) |
| İnceleme tamamlanmadı | `eczane` |
| Okunduğuna dair kayıt yok | Kalan 36 program |
| Bu turda metni değişti, okunmadı | `egitim`, `kurs`, `spor`, `site`, `oto` |

Ortak bölümler (Ayarlar, Bildirimler, Belge şablonları, sağlayıcı rehberleri) hiçbir programda son baskıda okunmadı.

## İlk birleştirme: dallar

| # | Dal | Sonuç | Çakışma |
|---|---|---|---|
| 1 | `eticaret/iyzico-odeme` | alındı | yok |
| 2 | `test/bilet-saat-bagimsiz` | alındı | yok |
| 3 | `claude/brave-mirzakhani-ab98ff` | alındı | yok |
| 4 | `claude/determined-wiles-b6f4fd` | alındı | yok |
| 5 | `claude/confident-cerf-6bc3a4` | alındı | `package.json`, `sw.js` |
| 6 | `claude/bulut-load-denetim` | alındı, `claude/beautiful-tu-6247c1` alınmadı | `package.json`, `sw.js` |
| 7 | `claude/siparis-teslim-eea7dd` | alındı | `sw.js` |
| 7 | `claude/saha-hizmet-743e04` | alındı | yok |
| 7 | `claude/rezervasyon-aile-c6d113` | alındı | `sw.js` |
| 7 | `claude/ticaret-tasima-0f4440` | alındı | `package.json`, `sw.js` |
| 7 | `claude/uyelik-egitim-saglik-4305e7` | alındı | `package.json`, `sw.js` |
| 8 | `claude/tam-denetim-be0ad8` | alındı | `package.json`, `sw.js` |
| 9 | `claude/belge-veri-7508d5` | alındı | `package.json`, `site/araclar/index.html` |
| 9 | `claude/ticaret-hesap-0b85c8` | alındı | `site/araclar/index.html` |
| 10 | `claude/kurulum-ayarlari-b61988` | alındı | `package.json`, `sw.js` |
| 11 | `claude/sunucu-tanimlari-cffcb8` | alındı | `package.json`, `sw.js`, `eticaret-odeme.js`, `index.js`, `secrets.js` |
| 12 | `claude/altyapi-83e71a` | alındı | `package.json`, `sw.js`, `core/support.js` |
| 13 | `claude/sistem-arastirma-09634e` | alındı | yok |

`claude/beautiful-tu-6247c1`, `main` ile aynı ilişkisiz `first commit` (`80fe325`) üstündedir, `devir/hepsi` ile ortak geçmişi yoktur ve denetim işini içermez. `db.load` denetimi `claude/bulut-load-denetim` dalındadır (`574fa4a`), bu yüzden o alındı.

## Çözülen kod çakışmaları

- **`server/cloud/eticaret-odeme.js`:** kurulum dalı iyzico canlı kilidini panele taşımıştı, entegrasyon dalı beş sağlayıcılı kilit getirmişti. İkisi korundu. TTL panelden okunur.
- **`server/cloud/entegrasyon/odeme-kilit.js`:** çakışma görünmeyen asıl sorun buradaydı. Kilit yalnız ortam değişkenine bakıyordu, panelden açılan iyzico kilidi çalışmazdı. `IYZICO` artık `isletim.iyzicoCanli()` ile okunur. `entegrasyon/iyzico.js` mesajı da aynı kaynağa bakar.
- **`server/cloud/secrets.js`:** `GROUPS` ve `SECRET` iki tarafın ekleriyle birleşti (`eticaret`, `fiyatrobotu`; `guid`, `serviceAccount`, `refreshToken`).
- **`server/cloud/index.js`:** `kurulum` ve `entegrasyon-api` ikisi de yüklenir.
- **`core/support.js`:** telefon ve e-posta panelden gelir ve boşsa gizlenir, kılavuz bağlantısı da eklendi.

## Kök nedenle düzeltilen test

`server/test/eticaret-odeme.test.js` birleşince kırıldı. Panel kilidi testi Bağlantıyı dene zorunluluğundan önce yazılmıştı. Test sıkılaştırıldı: canlı anahtar denendikten sonra da kilit kapalıyken kart kapalı kalmalı, yani sonuç parmak izinden değil kilitten gelmeli. Beklenen yanıt `{ test: false, ad: 'iyzico', tc: true }`. Hiçbir denetim çıkarılmadı.

## Doğrulama

- `npm test`: 80 dosyanın tamamı geçti, çıkış kodu 0, 1722 denetim. GİB XSD testi çalıştı, atlanmadı. Veritabanı `nebsoft_test_b1`, kullanıcı `ns_test_b1`. İlk iki deneme başka oturumların testleriyle port çakışması yüzünden durdu (`5193` ve `kanal.test.js` sahte sunucusu). Kod hatası değildi; testlerin kendi port değişkenleriyle ayrı portlara alındı, test kodu değişmedi. Testlerin varsayılan portları sabittir, paralel oturumlarda aynı çakışma yine çıkabilir.
- `node --check`: her birleştirmeden sonra değişen `.js` dosyaları temiz.
- Üretim: 55 araç, 51 program yardımı, 2699 bilgi bankası kaydı, 50 tanıtım sitesi, 62 rehber, 203 adresli site haritası.
- SEO denetimi: kesin hata 0, uyarı 102. Kesin hata 0 için üç kılavuz PDF'i `claude/altyapi-83e71a` çalışma kopyasından bu kopyanın `indir/kilavuz/` klasörüne alındı. Boyutları `core/kilavuz.json` ile aynı. `indir/` git'e girmez.
- Tarayıcı (`PORT=5161`): ana sayfa, `/paketler/`, `/araclar/`, `/admin/` ve admin demosu 14 sayfa, `pos` 20, `klinik` 14, `otel` 14, `cicekci` 16, `dugun` 17, `ciftci` 15 menü sayfası açıldı. Konsol ve sunucu günlüğü hatasız. Telefon genişliği ve koyu tema bu turda denenmedi.

## Kalan sorun

- Ana klasörde birleştirmeden sonra `indir/kilavuz/` yoksa `seo-denetim` üç kesin hata verir, `hosting-paketi.js` durur. PDF'ler kopyalanmalı veya `node scripts/kilavuz/uret.js pos terzi eticaret` çalıştırılmalı.
- `docs/ENTEGRASYON-ENVANTERI.md` ve `docs/kilavuz/DURUM.md` iyzico kilidini yalnız `IYZICO_CANLI` ile anlatır, panelden açma da artık geçerlidir.
- Hazır kılavuzlar (`pos`, `terzi`, `eticaret`) bu birleşimden önce üretildi, yeniden üretilmedi. `claude/grup-*` dalları `core/kilavuz.json` kayıtları getirince bu dosyada çakışma beklenir.
