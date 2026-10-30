# Servis & Okul Taşımacılığı (`apps/okulservisi`)

Durum: temel dalga ve beklenenlerin çoğu yazıldı, **kullanıcı onayı bekliyor**. Tarih: 30.10.2026.
Kaynaklar, şikâyet bağlantıları ve mevzuat tablosu: [arastirma/arastirma-okulservisi.md](arastirma/arastirma-okulservisi.md).

## CANLIYA ÇIKMAYI ENGELLEYENLER
| Konu | Etiket | Programdaki karşılığı |
|---|---|---|
| Okul Servis Araçları Yönetmeliği'nin güncel birleşik metni (yalnız RG 25.10.2017 özgün metni okundu, sonraki değişiklikler okunmadı) | DOĞRULANAMADI | Belge listesi yalnız hatırlatmadır, ekranda 2017 metnine dayandığı ve güncel hâlin doğrulanamadığı yazar. "Mevzuata uygun" iddiası yok |
| KVKK 6698 madde metni, açık rıza ve aydınlatma ayrımı, Kurul 2026/347 kararı | DOĞRULANAMADI | Aydınlatma metni işletme hukukçusuyla hazırlanır, program imza ve sürüm kaydeder. Metin önerilmez |
| Canlı konum paylaşımının hukuki durumu, GPS sağlayıcı API'si | DOĞRULANAMADI | Konum özelliği **yok**. Veli yalnız sefer durumunu görür |
| MEB Öğrenci Servisi Takip Yönergesi | DOĞRULANAMADI | Bağlantı yok |
| Belge şifreleme kararı | Karar bekliyor | Çocuk verisi taşıdığı için `server/cloud/belge.js` `SIFRELI` listesine `okulservisi` eklenmesi önerilir. Görev gereği yalnız raporlandı, eklenmedi |
| Canlı test | Yapılmadı | SMS ve e-Fatura sağlayıcı hesabıyla denenmedi |

Not: Görevdeki "personel taşıma = D2/B2" ifadesi **UYUMSUZ**. Okunan RG metinlerine göre kendi personelini taşıyan işletme D3, ticari servis firması D4 belgesi kullanır (Karayolu Taşıma Yön. RG 08.01.2018; değişiklik RG 15.11.2019). Programda belge türü dayatılmaz, "Yetki belgesi / taşıt kartı" olarak izlenir.

## Veri en aza indirme
- Tutulan: öğrenci adı, sınıf, okul, güzergâh, durak, veli adı ve telefonu, ücret. T.C. kimlik, fotoğraf, açık adres, sağlık alanı **yoktur**. Kısa not alanında "sağlık bilgisi yazmayın" uyarısı vardır.
- Şoför ve rehbere sunucudan veli adı ve telefonu, ücret, kod, sözleşme, tahsilat ve mesaj gitmez; yalnız kendi güzergâhının öğrencisi gider.
- Veli yalnız kendi çocuğunu görür; seferdeki başka öğrencinin yoklaması görünmez. Portal kodu rastgeledir.
- Ayrılan öğrenci anonimleştirilir, kişi verisi dışa aktarılır (`NS.kvkk`), kart görüntüleme kaydı tutulur, toplu dışa aktarma yalnız yöneticidedir.
- Araç içi kamera ve konum verisi programa alınmaz.

## Doğrulanan hükümler (özgün metin, güncel hâl okunmadı)
Yönetmelik m.3/n kapasite ruhsattaki koltuk, m.5/2/f değişikliğin aynı gün okula bildirimi, m.5/2/e ayrılışta kalan ay iadesi, m.9 şoför ve rehber belgeleri, m.10-12 sigorta. MEB Usul ve Esaslar haberi: yıllık veya 9 aya kadar taksit, araç başına 1 ücretsiz öğrenci.

## Pazar
İncelenen: Servis Map, PortAkıl, ServisCell, Okul Servisi Yönetim (App Store sayfaları). Üretici siteleri ve Google Play açılmadı, yorum yok denecek kadar az; ürün düzeyi şikâyet analizi DOĞRULANAMADI. Şikâyetvar liste başlıklarından 10 tema çıkarıldı.

## Özellikler
| Sınıf | Özellik | Durum | Dayanak veya şikâyet |
|---|---|---|---|
| Olmazsa olmaz | Güzergâh, durak sırası, sabah ve akşam saati | Var | Rakipler |
| Olmazsa olmaz | Koltuk kapasitesi denetimi | Var, kayıt engellenir | Şikâyet 6 (ayakta taşıma), Yön. m.3/n |
| Olmazsa olmaz | Şoför yoklaması: bindi, binmedi, indi | Var, telefonda büyük düğmeler | Şikâyet 9 |
| Olmazsa olmaz | Sefer sonu "araçta öğrenci kalmadı" onayı | Var, işaretlenmeden sefer bitmez | Şikâyet 10 |
| Olmazsa olmaz | Aylık tahakkuk, kısmi ödeme, kardeş indirimi, ücretsiz öğrenci, makbuz | Var | Şikâyet 8 |
| Olmazsa olmaz | Ayrılışta sonraki ay iade hesabı | Var | Yön. m.5/2/e |
| Olmazsa olmaz | Veli "gelmeyecek" bildirimi | Var, şoför listesinde görünür | PortAkıl |
| Olmazsa olmaz | Şoför, rehber, araç değişikliği için okula bildirilecekler listesi | Var, otomatik gönderim yok | Şikâyet 4, Yön. m.5/2/f |
| Olmazsa olmaz | Belge süresi uyarısı | Var | Yön. m.4, 9 |
| Beklenen | Şikâyet ve talep kaydı, yanıt, durum | Var | Şikâyet 1, 3, 5 |
| Beklenen | Gecikme bildirimi, duyuru, toplu SMS (TEST ayrımlı) | Var. Gecikme portalda görünür, SMS duyurudan gönderilir | Şikâyet 2, 3 |
| Beklenen | Sefer gecikme raporu, en çok binmeyenler | Var | Şikâyet 2 |
| Beklenen | Personel hattı, kuruma aylık tahakkuk ve e-Fatura | Var | Araştırma |
| Beklenen | Canlı konum, GPS kaydı, veli-şoför mesajı, yaklaşma bildirimi | Yok. Konum hukuki ve sağlayıcı doğrulaması bekliyor | Şikâyet 2 |
| Fark yaratan | Güzergâh önerisi, yedek şoför akışı, firma belge rozeti | Yok, sonraki dalga | Şikâyet 4 |

## Bilinen sınır
5.000 öğrencide Öğrenciler ekranı yaklaşık 2 saniyede açılır: `NS.crud` tüm satırları çizer. Sayfalama çekirdek isteğidir.

## Fiyat
Katalogdaki fiyat **örnektir** (`fiyatOrnek: true`). Kullanıcı belirleyecek.
