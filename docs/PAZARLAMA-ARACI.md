# NEBSOFT Pazarlama iç aracı: doğrulama raporu

Tarih: 30.10.2026. Dal: `ic-arac/nebsoftpazarlama` (taban: `devir/hepsi` 0c49a1b).
Çalıştırma: `node ic-araclar/nebsoftpazarlama/baslat.js` → http://127.0.0.1:5090. Test: `node ic-araclar/nebsoftpazarlama/test.js`.

Bu rapor hukuki görüş değildir. Hukuk maddeleri resmî metinlerden okunmuştur; yorum gerektiren yerler DOĞRULANAMADI olarak bırakılmıştır.

## CANLIYA ÇIKMAYI ENGELLEYENLER

1. **`server.js` DENY listesinde `ic-araclar` yok (UYUMSUZ: "hostinge çıkmaz" şartı).** Dağıtım `git pull` ile yapıldığı için (`DEPLOY.md` §10) bu dal ana dala girerse `/ic-araclar/nebsoftpazarlama/arayuz.html`, `cekirdek.js` gibi dosyalar ana sunucudan herkese açık okunur. `server.js` bu görevin kapsamında olmadığı için değiştirilmedi. **Bu dalı birleştirmeden önce** `DENY` düzenine `ic-araclar` eklenmeli:

   ```js
   const DENY = /^\/(data|server|node_modules|site\/tools|site\/src|awesome-claude-design|docs|desktop|ic-araclar|\.[^/]*)(\/|$)|.../i;
   ```

   Veri tarafı bu olmadan da korunur: `veri/` içindeki tüm dosyaların adı noktayla başlar ve mevcut `DENY` kuralı (`\/\.[^/]+$`) bunları vermez; `test.js` bunu sınar. Masaüstü paketi `ic-araclar`ı içermez (`desktop/package.json` filtresi).

2. **Google Places kaynağı: DOĞRULANAMADI, varsayılan kapalı.** Kod yazıldı ve sahte yanıtla sınandı; aşağıdakiler nedeniyle anahtar girilse bile kullanıcı açıkça onaylamadan seçilemez:
   - Canlı test yapılmadı (anahtar yok).
   - Şartlar md. 3.2.3 "create content based on Google Maps Content" işini yasaklıyor. Canlı sonuçla ekranda puan hesaplamanın ve place_id ile aday takibinin buna girip girmediği metinden kesinleştirilemedi.
   - Haritasız gösterimde Google logosu istenir; araçta yalnızca "Google Maps" yazısı var. Logo dosyası eklenmedi (UYUMSUZ).

3. **Overpass genel sunucusu ticari kullanım için önerilmiyor (UYUMSUZ).** OSM wiki: "Commercial use should use self-hosted or paid Overpass servers." Bu araç ticari pazarlama için kullanılıyor. Görevde açıkça istendiği için varsayılan kaldı; günlük 100 sorgu sınırı ve 24 saat önbellek ile düşük hacimde tutuluyor. Sürekli kullanım için ücretli veya kendi sunucu gerekir: `PAZARLAMA_OVERPASS_URL` ortam değişkeni ile değiştirilebilir.

4. **Pazarlama iletişimi için hukuki önkoşullar kullanıcıda.** Araç bunları yapamaz:
   - Gönderen İYS'ye kayıtlı olmalı; alıcı adresleri İYS'ye kaydedilip ret kontrol edilmeli (Yönetmelik md. 5/2, 6/6).
   - Aydınlatma metni yayında olmalı.
   - Aşağıdaki DOĞRULANAMADI hukuk maddeleri bir avukata sorulmalı.

## Hukuk

| Durum | İddia | Kaynak |
|---|---|---|
| DOĞRULANDI | Telefon, SMS, e-posta ile ticari amaçlı iletiler "ticari elektronik ileti"dir | 6563 md. 2/1-c, [mevzuat.gov.tr PDF](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf), 30.10.2026 |
| DOĞRULANDI | Kural önceden onay; esnaf ve tacire önceden onay aranmaz | 6563 md. 6/1, 6/2 (aynı PDF) |
| DOĞRULANDI | Tacir ve esnaf reddederse onaysız gönderilemez | Yönetmelik md. 6/3, [mevzuat.gov.tr PDF](https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5), 30.10.2026; [Ticaret Bakanlığı](https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler), 30.10.2026 |
| DOĞRULANDI | Göndermek isteyen İYS'ye kaydolur; İYS'de onayı olmayana gönderilemez | Yönetmelik md. 5/2, 5/3 |
| DOĞRULANDI | Tacir ve esnaf adresleri göndermeden önce İYS'ye kaydedilir, ret kontrol edilir | Yönetmelik md. 6/6 |
| DOĞRULANDI | Metinde kimlik, nitelik ibaresi (sesli aramada görüşme başında) ve iletişim bilgisi bulunur | Yönetmelik md. 8 |
| DOĞRULANDI | Her iletide ücretsiz ret yolu; ret üç iş günü içinde İYS'ye bildirilir ve uygulanır | Yönetmelik md. 9/3, 9/4, 9/6, 10 |
| DOĞRULANDI | İspat yükü gönderende; kayıtlar üç yıl saklanır | Yönetmelik md. 13 |
| DOĞRULANDI | 2026 cezası md. 12/1-a: 2.859 TL ile 14.309 TL arası | 6563 PDF sonundaki tablo (RG 25.12.2025/33118) |
| DOĞRULANDI | Kişisel veri, belirlenebilir gerçek kişiye ilişkin her bilgidir; sebep kalkınca silinir | 6698 md. 3, 7, [mevzuat.gov.tr PDF](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf), 30.10.2026 |
| DOĞRULANDI | Veri kişiden alınmadıysa aydınlatma en geç ilk iletişimde yapılır | [KVKK duyurusu](https://www.kvkk.gov.tr/Icerik/8830/ucuncu-kisilerden-elde-edilen-kisisel-verilerin-reklam-ve-pazarlama-amacli-kullanilmasina-iliskin-kamuoyu-duyurusu), 21.07.2026 (Tebliğ md. 6'ya atıfla) |
| DOĞRULANDI | Üçüncü kişiden edinilen iletişim bilgisi pazarlama için kendiliğinden dayanak değildir; görüşmeyi sürdürmek rıza sayılmaz | Aynı duyuru |
| DOĞRULANDI | Bir bankanın telefonla sözlü aydınlatması Kurul kararında kabul edilmedi; aydınlatma ile rıza ayrı yürütülmeli | [KVKK 2022/863](https://www.kvkk.gov.tr/Icerik/7582/2022-863), 01.09.2022 |
| DOĞRULANAMADI | Doktor, avukat, mali müşavir, veteriner, eczacı "esnaf ve tacir" istisnasına giriyor mu | Kanun ve Yönetmelikte tanım bulunamadı. Araç bu sektörlerde "önceden onay gerekebilir" uyarısı gösterir |
| DOĞRULANAMADI | Haritadan edinilen şahıs işletmesi cep telefonunun pazarlama için işlenme dayanağı (alenileştirme, meşru menfaat veya açık rıza) | KVKK duyurusu internetten toplamayı ele almıyor. Karar özetleri bu soruyu doğrudan çözmüyor |
| DOĞRULANAMADI | Aracın saklama süresi ile Yönetmelik md. 13/2'nin üç yıllık kayıt yükümü nasıl uzlaşır | 180 gün aracın varsayılanıdır, yasal bir süre değildir. Süre 7 ile 1095 gün arasında ayarlanır |
| DOĞRULANAMADI | Mobil numara dışında ofis/sabit hattın şahıs işletmesinde kişisel veri sayılması | KVKK 2023/78 özeti kurumsal numara için ayrım yapıyor; şahıs işletmesi için açık karar bulunamadı. Araç yalnızca cep numaralarını işaretler |

## Google Places API (New)

| Durum | İddia | Kaynak |
|---|---|---|
| DOĞRULANDI | `POST https://places.googleapis.com/v1/places:searchText`; `X-Goog-Api-Key`, zorunlu `X-Goog-FieldMask`; `textQuery`, `languageCode`, `regionCode`, `pageSize` (1-20), `pageToken`; en çok 60 sonuç | [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), güncelleme 28.10.2026 |
| DOĞRULANDI | `GET https://places.googleapis.com/v1/places/PLACE_ID` ve alan maskesi | [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details), 28.10.2026 |
| DOĞRULANDI | Telefon, web, puan, yorum sayısı Enterprise katmanıdır; en yüksek katman faturalanır | [Data fields](https://developers.google.com/maps/documentation/places/web-service/data-fields), [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing), 28.10.2026 |
| DOĞRULANDI | Text Search Enterprise ve Place Details Enterprise ayda 1.000 çağrı ücretsiz; sonrası 1.000 çağrıda 35 ve 20 USD | [Fiyat](https://developers.google.com/maps/billing-and-pricing/pricing), 28.10.2026 |
| DOĞRULANDI | İçerik saklanamaz; "copy and save business names, addresses, or user reviews" yasak; dışa aktarma yasak | [Hizmet Şartları md. 3.2.3(a)(b)](https://cloud.google.com/maps-platform/terms), son değişiklik 26.08.2026 |
| DOĞRULANDI | `place_id` saklanabilir; enlem/boylam en çok 30 gün önbelleğe alınabilir; Google dışı haritayla kullanılamaz | [Hizmete Özel Şartlar md. 3, 14.2, 14.3](https://cloud.google.com/maps-platform/terms/maps-service-terms), son değişiklik 28.10.2026; [Policies](https://developers.google.com/maps/documentation/places/web-service/policies), 28.10.2026 |
| DOĞRULANDI | Maps URL'si anahtarsızdır: `search/?api=1&query=…&query_place_id=…` | [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), 28.10.2026 |

**Uyum tasarımı:** Diske yalnızca `place_id` ile kullanıcının kendi girdileri (durum, not, tarih, sektör, seçtiği il/ilçe) yazılır; tek kapı `adayKaydi()`. Ad, adres, telefon, web, konum ve puan diske, önbelleğe ve CSV'ye girmez; yalnızca tarayıcı belleğinde durur. Kayıtlı Google adayı için bilgi "Google'dan getir" ile canlı istenir (ücretli olabilir) veya ücretsiz Maps bağlantısı açılır. OSM ile eşleşen Google kaydının alanları OSM kaydına kopyalanmaz. Harita gösterilmez. **Sonuç:** Google adaylarında CSV'de ad ve telefon boştur; bu bir hata değil, şart gereğidir.

## OpenStreetMap ve Overpass

| Durum | İddia | Kaynak |
|---|---|---|
| DOĞRULANDI | Veri ODbL lisanslıdır; OpenStreetMap atfı ve lisansın belirtilmesi gerekir; değiştirilerek dağıtılırsa aynı lisans | [Copyright](https://www.openstreetmap.org/copyright), [Atıf rehberi](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) (10.09.2026), 30.10.2026 |
| DOĞRULANDI | Adil kullanım: günde 10.000 sorgu ve 1 GB altı; düzenli kullanımda 100'e bölünür; tanıtıcı User-Agent; 429/406'da 30 sn bekleme; önbellek ve hız sınırı | [Overpass wiki](https://wiki.openstreetmap.org/wiki/Overpass_API) (24.10.2026), [kullanım notu](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html), 30.10.2026 |
| DOĞRULANDI | Araçtaki tüm OSM etiketleri kullanımda (en azı `office=property_management` 8.415, `office=courier` 2.789 kayıt) | [taginfo](https://taginfo.openstreetmap.org), 30.10.2026 |
| DOĞRULANDI | `contact:phone`, `contact:website`, `contact:instagram`, `contact:facebook` etiketleri | [Key:contact](https://wiki.openstreetmap.org/wiki/Key:contact), 31.10.2025 |
| UYUMSUZ | Genel sunucunun ticari kullanımı (bkz. engelleyen 3) | Overpass wiki |
| DOĞRULANAMADI | Tüm iller için `ISO3166-2` etiketi var mı | Yalnızca İstanbul (TR-34) ve Çanakkale (TR-17) denendi. Etiketi olmayan ilde araç "sınır kaydı bulunamadı" der |

**Gerçek ağ denemesi (30.10.2026, overpass-api.de):**

| Sorgu | Süre | Sonuç |
|---|---|---|
| Kadıköy, kuaför, ilk 5 (sorgu denemesi) | 34,6 sn | HTTP 200 |
| Çanakkale/Gelibolu, kuaför (arayüzden) | 31,5 sn | Adı olan işletme yok; boş durum doğru göründü |
| İstanbul/Kadıköy, kuaför (arayüzden) | 27,5 sn | 152 işletme; 12 adsız veya kamu kaydı atıldı, 3 mükerrer elendi. İlk 100 sırada 9 telefon; 9 yüksek, 91 orta fırsat |
| İstanbul/Kadıköy, kuaför (arayüzden, tekrar) | Ölçülmedi | Bir deneme hata verdi (tarayıcı konsolunda HTTP 502); sonraki deneme yine 152 işletme döndürdü |

Toplam 5 gerçek sorgu yapıldı. Yanıt süresi uzun ve genel sunucu aralıklı hata verebiliyor; araç hatayı kullanıcıya gösterir, kendisi yeniden denemez.

**Gözlem:** OSM'de telefon oranı düşük, web alanı da sık boş. Bu yüzden OSM'de "web yok" zayıf işaret sayılır ve daha az puan alır. Liste keşif için işe yarar, hazır arama listesi olarak görülmemelidir.

## Puanlama

Puan tahmindir ve her zaman nedenleriyle gösterilir. Taban 25; Google'da web yok +40, OSM'de web yok +20; yalnız sosyal medya +30/+25; randevu sektöründe kendi sitesi yoksa +15 (çıkarım); telefon var +10, yok −10; düşük Google puanı +10; 100+ yorum +10; zincir −20; dolaylı eşleşme −10; rakip platform −10. Sınırlar: 60 ve üzeri Yüksek, 35 ve üzeri Orta. Online randevu doğrudan gözlenmez: web sitesi yoksa çıkarım yapılır, varsa "incelenmedi" yazılır. Siteler taranmaz. Ağırlıklar kanıta değil yargıya dayanır; satış sonuçlarıyla ayarlanmalıdır.

## Sınırlar ve yapılmayanlar

- Otomatik toplu SMS veya e-posta yoktur; metin yalnızca kopyalanır. `test.js` bunu kodda arar.
- İlçe listesi gömülü değildir; serbest yazılır ve OSM'de bulunamazsa hata verilir.
- Sektör eşlemesi `esleme.js` içinde elle tutulur; program adları `site/src/products.js`'ten okunur. Yeni program eklenince `test.js` eşlemesiz programı hata olarak bildirir. `eticaret`, `pazaryeri`, `fiyatrobotu`, `muhasebe`, `crm`, `ik`, `servis` eşleşmeleri dolaylıdır.
- Google anahtarı `veri/.ayar.json` içinde düz metindir (görevin istediği yerel saklama). Windows'ta dosya izni sınırlamaz; anahtarı Google Cloud'da Places API (New) ile kısıtlayın ve bütçe uyarısı koyun.
- Sunucu yalnızca 127.0.0.1'e bağlanır; Host, Origin ve Sec-Fetch-Site denetlenir. OSM içeriği herkesçe düzenlenebildiği için arayüzde kaçışlanır, CSV'de formül enjeksiyonu engellenir.
- Araç `npm test`'e bağlı değildir (`package.json` değiştirilmedi); testi ayrı çalıştırın.

## Kullanıcıdan gerekenler

1. `server.js` DENY satırını ekleme onayı (birleştirmeden önce).
2. Google kaynağı için karar: resmî logoyu ekleyin, canlı deneyin, şart uyumunu değerlendirin. Anahtar sizde.
3. Overpass için karar: düşük hacimde devam mı, ücretli veya kendi sunucu mu?
4. İYS kaydı, aydınlatma metni ve serbest meslek ile KVKK dayanağı sorularının avukata sorulması.
5. Saklama süresi (varsayılan 180 gün) ve puan ağırlıkları için onay.
