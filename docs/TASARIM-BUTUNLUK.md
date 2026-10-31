# Site tasarım bütünlüğü

Tarih: 2026-10-31. Dal: `claude/tasarim-butunluk`, taban `birlesik/hepsi` (2fb3fb2).

## Ne değişti

Ana sayfa ile statik sayfalar iki ayrı tasarımdı: ayrı üst menü, ayrı stil, tema işletim sisteminden okunuyordu. Artık tek kabuk var.

| Parça | Tek kaynak |
|---|---|
| Üst menü, alt bilgi | `market/kabuk.js` (ana sayfa çalışırken, statik sayfalar derlenirken çağırır) |
| Üst menü ve alt bilgi stili | `market/kabuk.css` |
| Renk değişkenleri, tema menüsü, kaydırma çubuğu | `core/core.css`, derlemede seçilir |
| Logo, simge, tema listesi | `core/core.js`, derlemede okunur |
| Statik sayfa stili | `site/src/tasarim.css` |
| Üretilenler (elle düzenlenmez) | `site/assets/site.css`, `site/assets/kabuk.js`, `site/assets/gorsel/**` |
| Ortak çağrı | `site/tools/ortak.js` (`build-sites.js`, `build-araclar.js`, `guven-sayfalari.js` buradan alır) |
| Görsel sahneleri | `site/tools/gorsel.js` |

- Tema: `nebsoft:theme` ve `nebsoft:palette` her sayfada aynı okunur. Küçük betik stilden önce çalışır, geçişte parlama olmaz. Varsayılan ana sayfayla aynı: açık, Kurumsal.
- `/kurumsal-teklif` elle yazılmış sayfa olarak kaldı. Üst menü, alt bilgi ve stili derlemede tazelenir.
- Sepet sayısı ve hesap özeti statik sayfaya `nebsoft:kabuk` anahtarıyla geçer (ürün sayısı ve ilk ad). Ana sayfa yazar.
- Yeni araç, program, paket veya rehber yazısı eklenince `site/tools/gorsel.js` dosyasına sahne yazılır. Rehberde konu rozeti `REHBER_MOTIF` listesindedir. `server/test/site-kabuk.test.js` eksik sahneyi düşürür.

## Görsel dili

480×300 SVG, sektör renginde koyu degrade zemin, nokta deseni, açık renk nesneler. `<img>` sayfa değişkenini göremediği için zemin kendi içinde koyudur, iki temada da aynı okunur. 203 dosya, hepsi 7 KB altı, toplam 988 KB. Sayfa yalnız ekrana gelenleri indirir. Stok fotoğraf ve marka logosu yoktur.

## Bilinçli kararlar

- `lastmod` özeti görünen metinden alınır (`site/src/lastmod.json` içinde `m: 1`). Tasarım değişikliği tarihi oynatmaz. `sitemap.xml` tabanla bire bir aynıdır.
- Statik sayfanın alt bilgisinde "Yönetim paneli" bağlantısı yoktur, ana sayfada kalır. Panel arama motoruna kapalıdır.
- Ürün listesi alt bilgide iki sütun akar, ana sayfada da. Sayfa boyu uzamaz.
- Telefonda logo eskiden kırpılıyordu ("NEBSC"). "Giriş yap" 420 px altında yalnız simgeye iner, ana sayfada da.
- Görsel kartlar artık SVG'dir. Gerçek ekran görüntüleri program ve paket sayfalarının kahraman ve galeri bölümlerinde durur.
- `server/cloud/seo.js` yasal metni `.doc` bloğundan sonra arayarak yerleştirir. Yeni kahraman bölümü aynı HTML kalıbıyla bittiği için eski arama yanılıyordu.

## Ölçüm

Yerel sunucu, 375 px, 2x, 1,6 Mbit/s ve 150 ms gecikme simülasyonu, önbellek kapalı. Saha verisi değildir.

| Sayfa | LCP ms önce → sonra | İlk ekran KB | Tam kaydırma KB |
|---|---:|---:|---:|
| `/programlar` | 992 → 756 | 357 → 181 | 1470 → 248 |
| `/araclar` | 504 → 600 | 27 → 193 | 27 → 271 |
| `/paketler/` | 1012 → 620 | 219 → 182 | 219 → 226 |
| `/fiyatlar/` | 516 → 572 | 218 → 177 | 218 → 177 |
| `/rehber/` | 464 → 640 | 222 → 192 | 222 → 286 |
| `/marketprogrami` | 544 → 656 | 351 → 305 | 351 → 324 |
| `/paketler/oto-sanayi/` | 516 → 592 | 235 → 189 | 235 → 207 |
| `/araclar/kdv-hesaplama/` | 560 → 652 | 48 → 200 | 48 → 203 |
| Rehber yazısı | 488 → 516 | 220 → 175 | 220 → 182 |
| `/kvkk/` | 460 → 512 | 216 → 171 | 216 → 171 |

Araç sayfaları eskiden web fontu yüklemiyordu. Artışın büyük kısmı ana siteyle aynı Inter ve Michroma fontudur. Yazı tipi ayrı yüklenir, ilk boyamayı bekletmez. Tüm ölçümler 2,5 sn LCP eşiğinin altındadır. Stil dosyası 19,9 KB'tan 44,2 KB'a çıktı (sıkıştırılmış 10,2 KB) çünkü üst menü, tema ve bileşenler artık içindedir.

## Kalan işler

- Ana sayfadaki canlı destek balonu statik sayfalarda yoktur, kapsam dışı bırakıldı.
- Statik alt bilgide adres satırı yoktur: `site.config.js` içinde adres alanı yok, ana sayfa adresi panelden okur.
- Hesap özeti son ana sayfa ziyaretinden gelir. Başka sekmede çıkış yapılırsa statik sayfa ana sayfaya dönene kadar eski durumu gösterir.
- Saha LCP verisi Search Console olmadan DOĞRULANAMADI.
