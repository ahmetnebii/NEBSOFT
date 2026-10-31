# Birleştirme raporu: `birlesik/hepsi`

Tarih: 2026-10-31. Taban: `devir/hepsi` `d5f4e06`. `devir/hepsi` güncellenmedi, push yapılmadı. `claude/grup-*` alınmadı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Beş test raporundaki (`docs/test/*.md`) kod maddeleri tek listede. Kontrol biçimi: ticaret 4.1-4.3 ve üyelik 1-6 birleşik hâlde `npm test` çıktısında `AÇIK` satırıyla göründü. `belge.js` ve `integrations.js` maddeleri kodda arandı. Rezervasyon ve saha rol maddeleri için `rol-kural.js` farkı okundu, o kurallara dokunan değişiklik yok; bu maddeler ayrıca çalıştırılmadı. Program içi eksikler (`apps/nakliyat`, `apps/ciftci`, `market/catalog.js`) rapordan taşındı, yeniden denenmedi.

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

## Dallar

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
