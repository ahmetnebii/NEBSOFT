# NEBSOFT — çalışma kuralları

Türkiye'deki işletmeler için 31 sektörel web yazılımı (`apps/<program>/`), ortak çekirdek (`core/`), pazar yeri (`index.html`, `market/`),
yerel/bulut sunucu (`server.js`, `server/`), masaüstü (`desktop/`, Electron) ve Android (`android/`). Arayüz dili Türkçe; kullanıcıya
görünen her metin sade ve doğru Türkçe olmalı. Ayrıntılı yapı: `README.md`, `docs/GELISTIRME-PLANI.md`.

## 1. Doğrulama ilkeleri (her şeyden önce gelir)
- **Kaynak:** Entegrasyon ve mevzuat iddiaları yalnızca resmî kaynağa dayanır: GİB dokümanları/şemaları, sağlayıcının resmî API
  dokümanı veya SDK'sı, mevzuat metni (mevzuat.gov.tr). Blog, forum, eski/sürümsüz doküman ve hafıza "doğrulanmış" sayılmaz;
  hafızadan gelen bilgi "(hafızadan, doğrulanmadı)" diye işaretlenir. Her iddianın yanında kaynak URL + tarih/sürüm yazılır.
- **Etiketler:** DOĞRULANDI · UYUMSUZ · DOĞRULANAMADI. "Muhtemelen doğru" gibi ara durum yok.
- **Kabul:** DOĞRULANAMADI veya UYUMSUZ olan entegrasyon canlıda **seçilemez** (kod/veri silinmez) ve raporun başındaki
  "CANLIYA ÇIKMAYI ENGELLEYENLER" bölümüne yazılıp kullanıcıya sorulur. Doğrulanamayan şey tahminle tamamlanmaz.
- **Dokümanla uyum ≠ canlı test.** Resmî dokümana uyan entegrasyon da canlıya çıkmadan sağlayıcının test hesabıyla denenir.
- **Sahte başarı yasak:** Gönderilmeyen bir şey "gönderildi / kuyrukta / raporlandı" gösterilmez; simülasyon sonucu her yerde
  "TEST" olarak görünür ve kalıcı "yapıldı" kaydı bırakmaz.

## 2. Ürün geliştirme yöntemi (her program için)
1. **Pazar araştırması:** sektördeki önde gelen 3–5 Türk ürünün herkese açık özellik sayfaları + kullanıcı şikâyetleri
   (Şikâyetvar, uygulama mağazası yorumları). Kaynaklar yazılır. Rakip ürünün kodu, metni veya tasarımı kopyalanmaz;
   yalnızca hangi ihtiyaçların karşılandığı çıkarılır.
2. **Mevcut durum:** programın her ekranı tarayıcıda açılır; çalışmayan, eksik, kafa karıştıran her şey listelenir.
3. **Ürün spesifikasyonu** `docs/urun/<PROGRAM>.md`: her özellik *Olmazsa olmaz / Beklenen / Fark yaratan* olarak sınıflanır,
   bizde var/yok/kırık durumu ve kaynağı yazılır. **Kullanıcı onaylamadan geliştirmeye geçilmez.**
4. **Dalgalar:** önce kırık ve eksik temel, sonra beklenen, sonra fark yaratan. Her dalga ayrı dalda (`<program>/<konu>`).
5. **Kalite kapısı** (her dalga sonunda — §3).
6. **Kabul:** kullanıcı (+ mümkünse pilot işletme) dener; geri bildirim sonraki dalgaya girer.

## 3. "Bitti" tanımı (kalite kapısı)
- `npm test` geçer (GİB XSD testi için .NET SDK gerekir; atlandıysa "atlandı" diye raporlanır, geçti sayılmaz).
- Değişen her ana akış tarayıcıda baştan sona denenir (yerel sunucu: `.claude/launch.json` → `nebsoft`, adres `?demo=1`).
  Konsolda hata kalmaz. Ortak dosya (`core/`) değiştiyse en az birkaç başka programın açıldığı da denenir.
- Telefon genişliği, koyu tema, boş liste, hata ve yükleniyor durumları kontrol edilir.
- Büyük veriyle (binlerce kayıt) ekranlar akıcı kalır.
- Yeni ayar/özellik varsayılanı mevcut kullanıcının verisini bozmaz; eski kayıtlarda eksik alan olabileceği düşünülür.
- Statik dosya değiştiyse `sw.js` içindeki `V` sürümü artırılır (yoksa kullanıcılar eski dosyayı görür).
- Rapor/spec güncellenir; yapılmayan veya doğrulanmayan şey açıkça yazılır.

## 4. Mimari notlar
- `core/` tüm programlarda ortaktır: buradaki değişiklik 31 programı etkiler. Paralel oturumlarda `core/`'u aynı anda yalnızca
  bir oturum değiştirir; program oturumları `apps/<program>/` dışına çıkmaz, çekirdek ihtiyacını raporlar.
- Ortak yapı taşlarını yeniden yazma, kullan: `NS.shell` (menü, roller, `navVisible` ile modül gizleme), `NS.DB`, `NS.table`,
  `NS.formModal`, `NS.settingsPage`, `NS.docs` (belge şablon tasarımcısı — yazdırılan her belge buradan geçer),
  `NS.integ` / `NS.ebelge` (entegrasyonlar ve e-Belge), `NS.notify`, `NS.forms` (imzalı belgeler).
- e-Belge: tüm programlar `NS.ebelge.create()` kullanır; UBL-TR yalnızca `core/ubltr.js` ile üretilir; resmî görünüm GİB
  `core/ebelge/general.xslt` + `core/vendor/xslt-polyfill-1.0.31` (tarayıcıların yerleşik XSLT'si Chrome 158'de kalktı).
- Dış servis istekleri `/api/istek` köprüsünden geçer (yerelde yalnızca 127.0.0.1, bulutta oturum + SSRF filtresi).
- Gizli bilgiler (`data/`) ve derleme çıktıları (`indir/`) depoya girmez.

## 5. Çalışma biçimi
- Kod çevresindeki stile uyar (yoğun tek satırlık JS, Türkçe yorumlar, bağımlılıksız). Dış kütüphane gerekiyorsa sürümü
  sabitlenir, lisansı kontrol edilir ve mümkünse `core/vendor/` altına gömülür.
- Commit mesajları Türkçe, ne ve neden.
- Rapor ve spec'ler `docs/` altında; kullanıcıya özet her zaman "engelleyenler + senden gerekenler" ile biter.
