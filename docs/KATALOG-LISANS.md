# Ortak katalog: kaynaklar ve lisanslar

Son gözden geçirme: 30.10.2026. Etiketler CLAUDE.md §1'e göredir: DOĞRULANDI, UYUMSUZ, DOĞRULANAMADI.
Hukuki yorum değildir; ticari kullanımdan önce avukata gösterilmelidir (`docs/YASAL-INCELEME.md`).

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Durum | Gereken |
|---|---|---|
| GS1 kuralları: GTIN verisinin üçüncü taraflarca listelenmesi, iç kullanım önek aralıkları | DOĞRULANAMADI | GS1 Türkiye'den yazılı yanıt. O zamana dek katalog herkese açık değildir, yalnız oturumlu kullanıcıya döner |
| Open Food Facts toplu aktarımı gerçek dosyayla denenmedi | DOĞRULANAMADI | `scripts/katalog-off-al.js --kuru` ile gerçek dosyada deneme. Dosya sütun adları hafızadandır (doğrulanmadı); beklenen sütun yoksa betik durur |
| Canlı Open Food Facts çağrısı gerçek API ile denenmedi | DOĞRULANAMADI | Testler yerel sahte sunucuyla yapıldı. Canlıya çıkmadan gerçek barkodla denenmeli |
| ODbL "Share-Alike": catalog_ext üzerinden üretilen veri tabanının paylaşım yükümlülüğü | DOĞRULANAMADI | Ayrı tablo kararı riski azaltır, sonucu avukat değerlendirmeli |

## Kaynak tablosu

| Kaynak | Tablo | Lisans | Kullanım kuralı | Kaynak adresi, tarih | Etiket |
|---|---|---|---|---|---|
| Open Food Facts veritabanı | `catalog_ext` | ODbL 1.0 | Değiştirilmeden, ayrı tabloda. Atıf zorunlu | https://world.openfoodfacts.org/data (30.10.2026) | DOĞRULANDI |
| Open Food Facts içeriği | `catalog_ext` | DbCL 1.0 | Aynı | https://world.openfoodfacts.org/data (30.10.2026) | DOĞRULANDI |
| Open Food Facts görselleri | `catalog_ext.gorsel` | CC BY-SA (sürüm 3.0: kullanıcının 30.10.2026 okuması; sayfada sürüm yazmıyor) | Atıfla gösterilir, işletme sitesine taşınmaz | https://world.openfoodfacts.org/data (30.10.2026) | DOĞRULANDI (sürüm: kullanıcı okuması) |
| Open Food Facts API | Canlı sorgu | Üstteki lisanslar | 1 API çağrısı = 1 gerçek okutma; API ile toplu çekim engellenir, toplu ihtiyaç için dışa aktarım dosyası | https://world.openfoodfacts.org/data (30.10.2026) | DOĞRULANDI |
| Open Food Facts API sınırı | Canlı sorgu | | Ürün okuma 15 istek/dakika/IP; arama 10 istek/dakika/IP; özel User-Agent | https://openfoodfacts.github.io/openfoodfacts-server/api/ (30.10.2026) | DOĞRULANDI |
| Open Food Facts dışa aktarımı | `scripts/katalog-off-al.js` | Üstteki lisanslar | Gece üretilir; CSV sıkıştırılmış yaklaşık 0,9 GB, açılmış yaklaşık 9 GB | https://world.openfoodfacts.org/data (30.10.2026) | DOĞRULANDI |
| Müşteri önerileri | `catalog_suggest` → onayla `catalog_own` | NEBSOFT katalog kaydı | Yalnız gtin, ad, marka, kategori. Kişisel veri süzgeci ve yönetici onayı | Bu depo | DOĞRULANDI (test: `server/test/katalog.test.js`) |
| İzinli tedarikçi listeleri (CSV) | `catalog_suggest` → onayla `catalog_own` | Kaydın `lisans` ve `izin` alanı | Kaynak ve lisans/izin zorunlu; fiyat, stok okunmaz | Her liste kendi izniyle | DOĞRULANDI (kod); tek tek izinler işletmenin sorumluluğunda |
| Başka sitelerden kazıma | Yok | | Kod yazılmadı, kullanıcı planı | | Uygulanmıyor |
| GS1 / GTIN kuralları | | | Kontrol hanesi algoritması uygulanır; kullanım koşulları okunamadı | | DOĞRULANAMADI |

Atıf metni (kullanıcıya her OFF kaydında kaynak ve lisans bağlantısıyla gösterilir): "Open Food Facts verisi, Open Database License (ODbL) ile". Kaynak: https://world.openfoodfacts.org/data

## Veri düzeni

- `catalog_ext`: dış kaynak. Değer değiştirilmez, yalnız sütun boyuna kısaltılır. `kaynak, lisans, kaynak_url, alindi` zorunlu.
- `catalog_own`: bizim kayıtlar. Yalnız yönetici onayıyla girer. OFF kaydında düzeltme gerekirse `ust_kaynak='off'` ile üstüne yazma kaydı açılır; OFF satırı değişmez.
- `catalog_suggest`: moderasyon kuyruğu. İşletme, fiyat, stok sütunu yoktur.
- `catalog_merge`: birleştirme geçmişi. Önceki hâli tutar, geri alınabilir.
- `product_pool`: eski havuz. Bir kez göç eder (`settings.katalog_goc_1`), sonra okunmaz ve yazılmaz. Silinmez: kişisel veri denetimine takılan satırlar içinde kalır; inceledikten sonra yönetici kaldırmalıdır.

## Akış

1. Barkod: `GET /api/katalog/barkod/:gtin` sırası `catalog_own` → `catalog_ext` → gerçek okutmada (`?okutma=1`) OFF canlı. Sonuç `catalog_ext`'e yazılır; bulunamayan barkod bir gün sorulmaz; tüm sunucu dakikada 15 çağrıyla sınırlıdır.
2. Arama `GET /api/katalog/ara` yalnız kendi tablolarımıza bakar, OFF API'sine gitmez.
3. Öneri `POST /api/katalog/oneri`: fazladan alanlar yok sayılır; hatalı GTIN, iç kullanım barkodu, telefon, e-posta, TC, IBAN, kart, adres ve kişi adı benzeri örüntü reddedilir. OFF'tan gelen kayıt öneri olmaz.
4. Moderasyon: yönetici paneli, Ortak katalog. Uyarılar: hatalı GTIN, aynı GTIN farklı ad, benzer ad. Kararlar: onay, ret, birleştirme.
5. Eczane bu kataloğu kullanmaz. Başka siteden OFF'a veri yazılmaz.

## Toplu aktarım

```
node scripts/katalog-off-al.js --dosya en.openfoodfacts.org.products.csv.gz --kuru   # önce deneme
node scripts/katalog-off-al.js --dosya en.openfoodfacts.org.products.csv.gz          # yaz
```

Sunucu klasöründe, elle çalıştırılır. Akışla işlenir, dosya belleğe alınmaz. Tekrar çalıştırmak aynı kayıtları günceller. Silinen OFF ürünleri güncelleme ile düşmez.
