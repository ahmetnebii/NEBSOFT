# NEBSOFT yasal metinler: inceleme raporu

> **YAYINDAN ÖNCE AVUKAT ONAYI GEREKİR.**
> `site/src/yasal/` altındaki sekiz metin taslaktır ve hukuki görüş değildir. Bu rapor da hukuki görüş değildir; bir yazılım ekibinin resmî metinleri ve kodu karşılaştırmasıdır. Avukat onayı alınmadan, köşeli parantezli yerler doldurulmadan ve aşağıdaki engelleyenler kapanmadan hiçbir metin yayımlanmaz.

- **Hazırlanma tarihi:** 30.10.2026
- **Kod tabanı:** `devir/hepsi` (0c49a1b) üzerinden açılan `yasal/taslaklar` dalı
- **Etiketler:** DOĞRULANDI, UYUMSUZ, DOĞRULANAMADI (`CLAUDE.md` §1)

## 1. CANLIYA ÇIKMAYI ENGELLEYENLER

Bunlar metinle çözülmez. Metin ancak gerçeği anlatabilir, gerçek değişmeden koruma sağlamaz. Kod veya işletme adımı gerekir.

| No | Engelleyen | Kanıt | Neden önemli | Gereken |
|---|---|---|---|---|
| E1 | Şirket kimliği yok | Kodda unvan, MERSİS, adres, KEP yok. `routes.js:26` adresi boş | MSY md. 5/1-b,c; 6563 md. 3; 5651 Yön. md. 5; TTK md. 39 | Kullanıcı bilgileri vermeli (§8) |
| E2 | Sağlık verisi şifresiz duruyor | `app_data.data` düz JSON (`db.js:35`, `routes.js:492`). Yalnızca entegrasyon sırları şifreli (`secrets.js`) | Kurul 2018/10: özel nitelikli veride "kriptografik yöntemler" | Klinik, eczane, veteriner canlıya alınmadan durağan şifreleme kararı ve uygulaması |
| E3 | İki adımlı giriş varsayılan kapalı | `mail.js:14` `twoFactorLogin` ayarı platform geneli, varsayılan kapalı | Kurul 2018/10: uzaktan erişimde "en az iki kademeli" doğrulama | Sağlık programlarında zorunlu iki adımlı giriş |
| E4 | Varsayılan sunucu adresi düz HTTP | `sunucu.json:4` `http://45.133.36.99:5050` ilk sırada. Masaüstü ve Android bunu önce dener. DEPLOY'a göre 5050 dışa açık olmamalı | Şifre ve hasta verisi şifresiz gidebilir. "256-bit SSL" iddiasıyla UYUMSUZ | HTTPS alan adını başa al, IP'yi çıkar, paketleri yeniden derle |
| E5 | Yedek garantisi yok | Yedek yalnızca DEPLOY §9'da önerilen cron. Çalıştığı doğrulanmadı, aynı sunucuda ve şifresiz. `market.js:292`, `:757` "günlük yedek" diyor | Yedek hiç yoksa "ağır kusur" sayılma riski doğar ve sorumluluk sınırı işlemez (TBK md. 115) | Çalışan, sunucu dışı, şifreli yedek ve geri yükleme testi |
| E6 | "Tümünü yedekle" bulutta eksik olabilir | `integrations.js:726` yalnızca `localStorage` okuyor. Bulut modunda veri orada değil (`core.js:412`). Yine de "yedeklendi" diyor. Kodu okuyarak bulundu, tarayıcıda denenmedi | Müşteriye "kendi yedeğini al" diyoruz (Koşullar md. 8). Araç çalışmıyorsa hüküm zayıflar ve `CLAUDE.md` sahte başarı yasağına aykırı olur | Tarayıcıda dene, bulutta tam dışa aktarım yap |
| E7 | Silme ve saklama süresi mekanizması yok | Otomatik silinen yalnızca oturumlar ve 48 saatlik geçmiş. `audit`, `leads`, `tickets`, `mail_log`, `kb_log`, `inbox`, `users`, `tenants`, `app_data` için silme kodu yok. İşletme silme ucu da yok | KVKK md. 7; Silme Yön. md. 7, 11, 12; KVKK md. 17/2 ceza atfı | Saklama politikası, periyodik imha, hesap kapatma akışı, imha kaydı |
| E8 | 5651 trafik kaydı yok | Kod trafik kaydı tutmuyor. nginx kaydı yapılandırılmamış, süresi bilinmiyor | 5651 md. 5/3 ve Yön. md. 7/1-c; ceza 100 bin ile 1 milyon TL (md. 5/6) | Yer sağlayıcı sayılıyorsak bütünlüklü log düzeni (S20) |
| E9 | Yurt dışı bağlantılar izinsiz başlıyor | `core.css:2` Google Fonts, `docs.js:18` ve `scan.js:9` cdnjs, `bizsite.js:111` Google Haritalar. Sağlık sayfaları dahil yükleniyor | IP adresi kişisel veri olabilir; KVKK md. 9, Çerez Rehberi s. 34-35 | Yazı tipi ve kütüphaneleri `core/vendor/` altına göm, haritayı tıklayınca yükle |
| E10 | Satış akışı MSY'ye uymuyor | Ön bilgilendirme ayrı değil, "Siparişi oluştur" düğmesi ödeme yükümlülüğü söylemiyor (`market.js:902`), sözleşme e-postayla gitmiyor | MSY md. 6, 7, 8/1: aksi hâlde sözleşme kurulmamış sayılır veya tüketici bağlı olmaz | §9'daki değişiklikler |
| E11 | Kabul kaydı yetersiz | Tek alan `users.kvkk_at`; metin sürümü, IP, tür yok. Sipariş onayı ayrıca kaydedilmiyor | İspat bize ait: MSY md. 5/6, 10; Tebliğ md. 5/e; TBK md. 21 | Kabul edilen belge, sürüm, zaman, IP kaydı |
| E12 | Tüketici ile ticari müşteri ayrılmıyor | Kayıt ve siparişte alan yok (`routes.js:171`) | Sorumluluk sınırı ve iade kuralları buna bağlı | Kayıtta veya siparişte müşteri türü sorusu |
| E13 | Ticari ileti düzeni eksik | `routes.js:641` ret yöntemi yalnızca e-postayı yanıtlamak, MERSİS ve unvan yok, İYS yok. `routes.js:100` hatırlatma e-postasında kampanya var | 6563 md. 6-8; TEI Yön. md. 5, 6/2, 8/2, 9 | İYS kaydı, onay ayrımı, ret bağlantısı, hatırlatmadan kampanyayı çıkar |
| E14 | Lisans bitince veriye erişim metinleri çelişiyor | `routes.js:100` "yalnızca yeni kayıt girişi durur", `routes.js:486` "okunabilir", gerçekte okuma da 402 döner ve program açılmaz (`routes.js:475`, `core.js:322`) | Süre sonu veri iadesi gereği; KVKK ve sözleşme vaadi | Süre sonu salt okuma veya dışa aktarım sayfası, metinleri eşitle |
| E15 | Ödeme kuruluşu belirsiz | Görevde Shopier geçiyor, kodda hiç yok (`git grep`, `main` ve `devir/hepsi`). Ödeme havale/EFT (DEPLOY §12) | Metinler yalnızca havale/EFT anlatıyor. Shopier gelirse KVKK, MSY ve iade metni değişir | Karar (S4) |

## 2. Okunan resmî kaynaklar

Tüm kaynaklar 30.10.2026 tarihinde okundu. PDF'ler indirilip metne çevrildi ve ilgili maddeler doğrudan okundu. mevzuat.gov.tr metinleri o günkü işlenmiş hâldir.

| Kod | Kaynak | URL | Durum |
|---|---|---|---|
| K1 | 6698 sayılı KVKK | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf | DOĞRULANDI |
| K2 | 6502 sayılı Tüketicinin Korunması Hakkında Kanun | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6502.pdf | DOĞRULANDI |
| K3 | Mesafeli Sözleşmeler Yönetmeliği (son değişiklik 24.5.2025) | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20237&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 | DOĞRULANDI |
| K4 | 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6563.pdf | DOĞRULANDI |
| K5 | Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=20914&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 | DOĞRULANDI |
| K6 | 5651 sayılı Kanun | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5651.pdf | DOĞRULANDI |
| K7 | 5651 Usul ve Esaslar Yönetmeliği | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=11746&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5 | DOĞRULANDI (trafik süresinde K6 ile UYUMSUZ, bkz. S20) |
| K8 | 6102 sayılı Türk Ticaret Kanunu | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf | DOĞRULANDI (md. 5/A, 18, 39, 40, 82, 1524) |
| K9 | 6098 sayılı Türk Borçlar Kanunu | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6098.pdf | DOĞRULANDI (md. 20-25, 112, 115, 116, 136, 146-148) |
| K10 | 6100 sayılı Hukuk Muhakemeleri Kanunu | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6100.pdf | DOĞRULANDI (md. 17, 18, 193) |
| K11 | 213 sayılı Vergi Usul Kanunu | https://www.mevzuat.gov.tr/MevzuatMetin/1.4.213.pdf | DOĞRULANDI (md. 253) |
| K12 | Aydınlatma Tebliği | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=24454&mevzuatTur=Teblig&mevzuatTertip=5 | DOĞRULANDI |
| K13 | Veri Sorumlusuna Başvuru Tebliği | https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=24455&mevzuatTur=Teblig&mevzuatTertip=5 | DOĞRULANDI |
| K14 | Silme, Yok Etme, Anonim Hale Getirme Yönetmeliği | https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK | DOĞRULANDI (md. 5, 7-12) |
| K15 | Yurt Dışı Aktarım Yönetmeliği (RG 10.7.2024/32598) | https://kvkk.gov.tr/SharedFolderServer/CMSFiles/aaf0eeec-9599-4c68-8b7a-33039059ca41.pdf | DOĞRULANDI (md. 5-7, 14, 16) |
| K16 | Çerez Uygulamaları Hakkında Rehber (Yayın No 69, Temmuz 2025) | https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/fb193dbb-b159-4221-8a7b-3addc083d33f.pdf | DOĞRULANDI (ilgili bölümler) |
| K17 | Kurul 2018/10, özel nitelikli veri önlemleri | https://www.kvkk.gov.tr/Icerik/4110/2018-10 | DOĞRULANDI |
| K18 | Kurul 2020/71, veri sorumlusu ve veri işleyen ayrımı | https://www.kvkk.gov.tr/Icerik/6874/2020-71 | DOĞRULANDI |
| K19 | Kurul 2019/10, veri ihlali bildirimi | https://www.kvkk.gov.tr/Icerik/5362/Veri-Ihlali-Bildirimi | DOĞRULANDI |
| K20 | VERBİS istisna kriterleri, Kurul 2025/1572 duyurusu | https://www.kvkk.gov.tr/Icerik/8577/kisisel-verileri-koruma-kurulunun-04-09-2025-tarihli-ve-2025-1572-sayili-kararinin-uygulama-esaslarina-iliskin-kamuoyu-duyurusu | DOĞRULANDI |
| K21 | Kurul 2024/1361, tek onay ve çerez kararı | https://www.kvkk.gov.tr/Icerik/8884/2024-1361 | DOĞRULANDI |
| K22 | Kurul 2023/1787, eski numaraya sağlık bilgisi SMS'i | https://www.kvkk.gov.tr/Icerik/8842/2023-1787 | DOĞRULANDI |

Görevin izin verdiği iki alan adı dışındaki resmî kaynaklar (yalnızca ek bilgi):

| Kod | Kaynak | URL | Durum |
|---|---|---|---|
| K23 | Abonelik Sözleşmeleri Yönetmeliği, ilk metin (RG 24.1.2015/29246) | https://www.resmigazete.gov.tr/eskiler/2015/01/20150124-2.htm | DOĞRULANAMADI (güncel işlenmiş metin okunamadı) |
| K24 | Kişisel Sağlık Verileri Hakkında Yönetmelik, ilk metin (RG 21.6.2019/30808) | https://www.resmigazete.gov.tr/eskiler/2019/06/20190621-3.htm | DOĞRULANAMADI (3.12.2025 değişikliği okunmadı) |

### Okunamayan veya doğrulanamayan konular

| Konu | Durum |
|---|---|
| 2026 tüketici hakem heyeti parasal sınırı (RG 23.12.2025/33116 tebliği) | DOĞRULANAMADI. Metinde tutar yazılmadı |
| Yurt dışı yeterlilik kararı olan ülke listesi | DOĞRULANAMADI |
| Kurul standart sözleşme metinleri, Yurt Dışı Aktarım Rehberi | DOĞRULANAMADI |
| ETBİS kaydı ve e-ticaret ikincil mevzuatı | DOĞRULANAMADI |
| Veri Sorumluları Sicili Yönetmeliği tam metni | DOĞRULANAMADI |
| Yer sağlayıcı bildirimi ve faaliyet belgesi | DOĞRULANAMADI |
| Veteriner kayıtlarının özel nitelikli sayılması | DOĞRULANAMADI |
| Sağlık mevzuatında dosya saklama süreleri | DOĞRULANAMADI. Metinde süre yazılmadı |

## 3. Madde bazında dayanak

Okunma tarihi hepsi için 30.10.2026. Kod sütunu §2'dir.

### kvkk.md

| Bölüm | Dayanak |
|---|---|
| 1 Kimlik | K1 md. 10/1-a; K12 md. 4 |
| 2 Rol ayrımı | K1 md. 3/1-ğ, ı; K18 |
| 3 Amaç ve hukuki sebep | K1 md. 5/2; K12 md. 5/g, h |
| 4 Toplama yöntemi | K12 md. 5/i |
| 5 Aktarım | K1 md. 8, 10/1-c; K12 md. 5/ı |
| 6 Yurt dışı | K1 md. 9; K15 md. 5-7 |
| 7 Saklama | K1 md. 4/2-d, 7; K8 md. 82/5; K11 md. 253; K3 md. 20; K5 md. 13/2; K14 md. 7 |
| 8 Haklar | K1 md. 11 (a-ğ, eksiksiz) |
| 9 Başvuru | K1 md. 13, 14; K13 md. 4, 5, 6/5 |
| 10 Değişiklik | K12 md. 5/b |

### gizlilik.md

| Bölüm | Dayanak |
|---|---|
| 1-2 Roller | K1 md. 3, 12/4; K18. Kod: `katalog.js:4`, `apps/pos/app.js:558` |
| 3 Veri yeri | Kod: `core.js:417`, `kb-genel.js:52`. Sunucu ülkesi yer tutucu |
| 4 Güvenlik | K1 md. 12. Kod: `auth.js`, `security.js`, `secrets.js`. Yalnızca kodda görülen önlemler yazıldı |
| 5 Yedek | Kod: `routes.js:501-505` |
| 7 Sağlık | K1 md. 6 |

### cerez.md

| Bölüm | Dayanak |
|---|---|
| 2 Oturum çerezi | K16 s. 11-12 (zorunlu çerez). Kod: `auth.js:7,26-34` |
| 3 Tarayıcı deposu | K16 (kapsamda local storage). Kod: `core.js`, `market.js`, `pwa.js`, `support.js` |
| 4 Analiz çerezi yok | Kod taraması: gtag, fbq, hotjar, clarity, metrika bulunmadı. K21 opt-in |
| 5 Dış bağlantılar | K16 s. 34-35; K1 md. 9 |

### kullanim-kosullari.md

| Bölüm | Koruma | Dayanak ve sınır |
|---|---|---|
| 2 Müşteri türü | Hükümlerin ayrılması | K2 md. 3/k; K3 md. 4/1-ğ |
| 6 Müşteri yükümlülükleri | Kullanıcı yükümlülüğü | K9 md. 25'e uygun, dengeli tutuldu |
| 7 Hizmet seviyesi | Rakamsal taahhüt yok | K2 md. 13/2: site ve reklamdaki özellikler ölçüt olur |
| 8 Yedek | Müşteri kendi kopyasını alır | K9 md. 112, 115; K8 md. 18/2. E5, E6 kapanmadan zayıftır |
| 9 Üçüncü taraf | Sağlayıcı riski | "Kendi kusuru olmadıkça" sınırı konuldu; K9 md. 112 |
| 11 İçerik | Önceden denetim yok | K6 md. 4, 5/1, 5/2 |
| 13 Mücbir sebep | İfa imkânsızlığı | K9 md. 136. Kullanılamayan dönem bedeli iade edilir |
| 14 Sorumluluk | Tazminat tavanı, dolaylı zarar | K9 md. 115/1 ağır kusur hariç. Yalnızca Ticari Müşteri. K9 md. 20-25 denetimi uygulanır; K9 md. 21 açık bilgilendirme gerekir |
| 15 Tazmin | Rücu | Yalnızca Ticari Müşteri, kusur oranıyla |
| 16 Sona erme | Otomatik yenileme yok | K2 md. 52/3, 52/4 |
| 17 Değişiklik | Tek taraflı yetki kullanılmadı | K9 md. 24 böyle hükmü yazılmamış sayar; K2 md. 4/2 |
| 18 Bildirim | Ticari ihtar şekli | K8 md. 18/3 |
| 19 Delil | Kesin delil yazılmadı | K10 md. 193/2; K2 md. 5 |
| 20 Yetki | Yalnızca tacirler | K10 md. 17, 18; K2 md. 68, 73, 73/A; K8 md. 5/A |

### mesafeli-satis.md

| Bölüm | Dayanak |
|---|---|
| A.1 Sağlayıcı | K3 md. 5/1-b, c, ç; K4 md. 3/1-a |
| A.2 Nitelikler, donanım | K3 md. 5/1-a, i, j |
| A.3 Fiyat | K3 md. 5/1-d, 5/4 |
| A.4 Ödeme | K3 md. 5/1-f, 6/2-b |
| A.5 İfa | K3 md. 5/1-f, 16 |
| A.6 Yenileme yok | K2 md. 52/3 |
| A.7 Cayma | K2 md. 48/4; K3 md. 5/1-g, ğ, h; 9/1-2; 11; 12/3, 12/4; 15/1 |
| A.8 Şikâyet | K3 md. 5/1-f, k |
| A.9 Teknik adımlar | K4 md. 3/1; K3 md. 7, 8/1 |
| B.4 İmkânsızlık, gecikme | K3 md. 16/2-4 |
| B.6 Bilgilendirme eksikliği | K2 md. 48/4; K3 md. 10 |
| B.7 Ayıplı hizmet | K2 md. 13-16; K3 md. 20/3 |
| B.10 Saklama | K3 md. 20/1 |
| Cayma formu | K3 EK |
| Bölüm C | K2 md. 3/k |

### iade.md

| Bölüm | Dayanak |
|---|---|
| 2 Cayma | K2 md. 48/4; K3 md. 9, 11, 12 |
| 3 Ticari iade | Mevcut site vaadi (`market.js:756`), sözleşmesel |
| 4 Aylık | K2 md. 52/4; K23 md. 22/2 (güncel metin kontrol edilecek) |
| 5 Yıllık | Mevcut site vaadi; K2 md. 52/5; K23 md. 22, 24, 25/3 |
| 6 Ayıp | K2 md. 15 |
| 7 Lisans açılmazsa | K3 md. 16 |
| 8 İade yöntemi | K3 md. 12/4 |

### veri-isleme-sozlesmesi.md

| Bölüm | Dayanak |
|---|---|
| 1 Roller | K1 md. 3; K18 |
| 2 Talimat | K1 md. 3/1-ğ, 12/4; K15 md. 5/1 |
| 3.1-3.3 | K1 md. 4, 5, 6, 10; K12 md. 5/e, f; K18 |
| 3.4 VERBİS | K1 md. 16; K20 |
| 3.5 Başvuru | K1 md. 13 |
| 3.6 İmha | K1 md. 7; K14 |
| 3.8 İhlal | K1 md. 12/5; K19 |
| 3.9 Aktarım | K1 md. 8, 9; K15 md. 7 |
| 4 Sağlık | K1 md. 6/1, 6/3-e, 6/4; K17; K22; K24 md. 15, 18, 20 (ilk metin) |
| 5 İşleyen | K1 md. 12/1, 12/4 |
| 6 İhlal bildirimi | K19 ("herhangi bir gecikmeye yer vermeksizin") |
| 8 Yurt dışı | K1 md. 9/4-5; K15 md. 7, 14/5 |
| 11 Sorumluluk | K1 md. 12/2 (müştereken sorumluluk sözleşmeyle kaldırılmaz) |
| 12 Silme | K1 md. 7; K14 md. 7, 12 |
| Ek-2 | Yalnızca kodda görülen önlemler |

### acik-riza.md

| Bölüm | Dayanak |
|---|---|
| Serbestlik, ayrı kutu | K1 md. 3/1-a; K12 md. 5/f; K21 |
| A.1 Ticari ileti | K4 md. 6, 8; K5 md. 7/4-5, 7/8-9, 9, 10 |
| B bölümü uyarısı | K1 md. 6/3 |
| B.5 Yurt dışı | K1 md. 9/6-a; K15 md. 16 (arızi şartı) |

## 4. Kaldırılamayan haklar: bilerek yazmadıklarımız

Şirketi korumak için en sık yapılan hatalar bunlardır. Hükümsüz bir madde koruma sağlamaz, tüm metnin güvenilirliğini düşürür.

| Yazılmayan hüküm | Neden |
|---|---|
| "Hiçbir zarardan sorumlu değiliz" | K9 md. 115/1: ağır kusurda önceden sorumsuzluk kesin hükümsüz. K2 md. 5: tüketicide haksız şart |
| "Koşulları dilediğimiz zaman değiştiririz" | K9 md. 24 yazılmamış sayar. K2 md. 4/2 süre içinde aleyhe değişiklik yasak |
| "Dijital ürünlerde cayma yoktur" (kayıtsız) | K3 md. 15 "aksi kararlaştırılmadıkça" der. Sitedeki 14 gün vaadi bu aksi karardır. Bkz. S1 |
| "İade yapılmaz" | K2 md. 15, 52/5; K3 md. 12, 16 |
| "Dava süresi 6 ay" | K9 md. 148: zamanaşımı sözleşmeyle değiştirilemez. K2 md. 16 |
| "Şirket defteri kesin delildir" | K10 md. 193/2; K2 md. 5 |
| "Tüm davalarda [şehir] mahkemeleri yetkilidir" | K2 md. 73/5; K10 md. 17 yalnızca tacirler |
| "Kaydolarak verilerinizin işlenmesine rıza gösterirsiniz" | K1 md. 3/1-a; K12 md. 5/f; K21 |
| "KVKK haklarınızdan vazgeçersiniz" | K1 md. 11, 13 |
| "Veri ihlalinden sorumlu değiliz" | K1 md. 12/2: müştereken sorumluluk |
| "Pazarlama iznini hizmet şartı yapma" | K5 md. 7/9; K21 |

## 5. Koddan çıkan gerçekler

### 5.1 Sitedeki iddiaların durumu

| İddia | Yer | Durum |
|---|---|---|
| "Veriler Türkiye'deki veri merkezlerinde" | `market.js:757`, `:292` | DOĞRULANAMADI. IP kaydı TR ama barındırma sözleşmesi görülmedi |
| "şifreli saklanır" | `market.js:757` | UYUMSUZ. Uygulama verisi düz JSON |
| "günlük yedeklenir", "günlük yedek" | `market.js:757`, `:292` | DOĞRULANAMADI. Yalnızca rehberde öneri |
| "üçüncü kişilerle paylaşılmaz" | `market.js:757` | UYUMSUZ. Entegrasyonlar ve ürün havuzu |
| "KVKK uyumlu" | `market.js:110`, `:292`, `:587` | DOĞRULANAMADI. Kanıtlanamaz mutlak iddia; E2, E3, E7 açık |
| "256-bit SSL" | `market.js:110`, `:587` | UYUMSUZ. Varsayılan adres düz HTTP (E4) |
| "Lisans anahtarı ödeme onayının ardından derhal" | `market.js:755` | UYUMSUZ. Havale elle onaylanıyor |
| "ortalama yanıt 15 dk", "aynı gün arasın", "Hafta içi 09:00–22:00" | `market.js:739-740` | DOĞRULANAMADI. K2 md. 13/2 gereği ölçüt olabilir |
| "her değişiklik geçmişiyle kaydedilir" | `kb-genel.js:52` | UYUMSUZ. En çok saatlik görüntü, 48 saat |
| "verileriniz silinmez" (süresiz) | `kb-genel.js:17`, `:22`, `routes.js:100` | UYUMSUZ. KVKK md. 7 ile çelişir, E14 |
| "Kişisel veriler KVKK'ya uygun işlenir" | `kb-genel.js:54` | DOĞRULANAMADI |
| Son güncelleme tarihi | `market.js:759` | UYUMSUZ. Her açılışta bugünün tarihini gösterir |

### 5.2 Veri akışı ve yurt dışı aktarım

Sunucu kaydı: `45.133.36.99` için RIPE kaydında blok "FiberNet", ülke TR, yönetici etiketi `tr-moondc-1-mnt` görünüyor (https://rdap.db.ripe.net/ip/45.133.36.99, 30.10.2026). Bu bir IP kaydıdır, sunucunun gerçek konumunu kanıtlamaz. DOĞRULANAMADI.

| Akış | Kim başlatır | Veri | Sağlayıcının yeri | NEBSOFT rolü | Durum |
|---|---|---|---|---|---|
| Google Fonts | Her sayfa açılışı, tarayıcı | IP, tarayıcı | Yurt dışı (hafızadan, doğrulanmadı) | Veri sorumlusu | E9 |
| cdnjs (Cloudflare) | QR ve barkod kullanımı | IP, tarayıcı | Yurt dışı (hafızadan, doğrulanmadı) | Veri sorumlusu | E9 |
| Google Haritalar | İşletme sitesinde harita | IP, tarayıcı, Google çerezleri olabilir | Yurt dışı (hafızadan, doğrulanmadı) | Avukata soru S13 | E9 |
| E-posta (SMTP) | Sunucu | Ad, e-posta, kod, sipariş, 2 adımlı girişte IP ve cihaz | Hazır seçenek Gmail, Outlook, Yandex, Yaani, özel. Gerçek seçim bilinmiyor (`mail.js:8`) | Veri sorumlusu | Gerekli bilgi |
| Toplu kampanya e-postası | Yönetici | Ad, e-posta | Aynı | Veri sorumlusu | E13 |
| SMS | Müşteri entegrasyonu | Alıcı numara, metin | Netgsm, İleti Merkezi, Verimor, Mutlucell yurt içi görünüyor (hafızadan, doğrulanmadı). Twilio uluslararası (`integrations.js`) | Veri işleyen. Kendi hesap iletişimimizde SMS kodu yok | Müşteri kararı |
| WhatsApp Cloud API | Müşteri entegrasyonu | Numara, metin | Meta `graph.facebook.com` | Veri işleyen | Sağlık için uyarı yazıldı |
| EmailJS, Zoom, Stripe | Müşteri entegrasyonu | Duruma göre | Yurt dışı (hafızadan, doğrulanmadı) | Veri işleyen | Sağlık için uyarı yazıldı |
| Köprü `/api/istek` | Müşteri işlemi | Entegrasyon gövdesi sunucumuzdan geçer, kaydedilmez | Kendi sunucumuz | Veri işleyen | Kod okundu (`bridge.js:35`) |
| e-Belge (Nilvera, Paraşüt vb.) | Müşteri entegrasyonu | Fatura tarafları | Sağlayıcıya bağlı | Veri işleyen | Ayrı doğrulama |
| Ürün havuzu, Open Food Facts | POS programı | Barkod, ad, marka, görsel. Kişi verisi yok | Dış servis yurt dışı (hafızadan, doğrulanmadı) | Veri sorumlusu değil, ama müşteri verisi | S14 |
| IndexNow | Yönetici | Sayfa adresleri | Bing, Yandex vb. | Kişisel veri yok | Bilgi |
| Shopier | Yok | Yok | Kodda yok | Yok | E15 |
| Sanal POS seçenekleri (iyzico, PayTR, Param, Stripe) | Müşteri entegrasyonu | Duruma göre | Sağlayıcıya bağlı | Veri işleyen. NEBSOFT'un kendi satışında kullanılmıyor | Bilgi |

### 5.3 Saklama süreleri

| Veri | Kodda gerçekleşen | Öneri (avukat onayı gerekir) | Yer tutucu |
|---|---|---|---|
| Oturum (`sessions`) | 1 veya 30 gün; saatlik silme (`auth.js:26,71`) | Değişiklik yok | Metinde sabit |
| E-posta kodu | 10 dk geçerli, 5 deneme. Süresi dolan satır kendiliğinden silinmiyor | Süresi dolanı sil | Metinde sabit |
| Giriş bağlantısı | 10 dk. Temizlik yalnızca yeni bağlantıda (`routes.js:256`) | Periyodik sil | Yok |
| Uygulama geçmişi | 48 saat. Silme yalnızca yeni görüntü alınırken çalışır (`routes.js:505`) | Periyodik sil | Metinde sabit |
| Gece yedeği | Rehberde 14 gün önerisi, çalıştığı doğrulanmadı | Gerçek düzen yazılır | [YEDEK SIKLIĞI VE SÜRESİ] |
| İşlem kaydı (`audit`) | Sınırsız | 2 yıl | [İŞLEM KAYDI SÜRESİ] |
| Trafik kaydı | Kodda yok | S20 yanıtına göre | [TRAFİK KAYDI SÜRESİ] |
| İletişim formu (`leads`) | Sınırsız | Sonuçlanınca 1 yıl | [TALEP KAYDI SÜRESİ] |
| Destek (`tickets`) | Sınırsız | Sözleşme sonu + 3 yıl | [DESTEK KAYDI SÜRESİ] |
| E-posta kaydı (`mail_log`) | Sınırsız | Pazarlama için 3 yıl (K5 md. 13), işlem için 1 yıl | [E-POSTA KAYDI SÜRESİ] |
| Yardım arama (`kb_log`) | Sınırsız, serbest metin | 6 ay | Metne eklenmedi, karar sonrası |
| Sipariş, fatura | Sınırsız | 10 yıl (K8 md. 82/5), MSY 3 yıl | Metinde sabit |
| Hesap (`users`, `tenants`) | Sınırsız | Kapatma + 30 gün, kanuni kayıtlar hariç | [HESAP SAKLAMA SÜRESİ] |
| Lisans bitince iş verisi (`app_data`) | Sınırsız | 90 gün | [SÜRE SONU SAKLAMA] |
| Sunucu hata günlüğü | `journalctl`, süre bilinmiyor | Ayarlanacak | Yok |

## 6. Bilinçli verilen kararlar

Bu kararlar kullanıcının ve avukatın onayına açıktır.

1. **Cayma için A seçeneği:** Sitedeki "14 gün koşulsuz iade" vaadi korundu. MSY md. 15 istisnalarına dayanılmadı. Bkz. S1.
2. **Yıllık kısmi iade:** Sitedeki vaat korundu. Hesap, ödenen tutarın orantılı payı. Aylık liste fiyatına göre yeniden hesap, tüketicide K2 md. 52/5 "kesinti yapmaksızın" nedeniyle yazılmadı.
3. **Sorumluluk tavanı** yalnızca Ticari Müşteri için yazıldı.
4. **Rakamsal hizmet seviyesi** yazılmadı. Ölçülmeyen bir taahhüt ayıplı hizmet riski yaratır.
5. **Ek-2** yalnızca kodda görülen önlemleri sayar. Eksikler gizlenmedi, köşeli parantezle işaretlendi.
6. **Her metnin başındaki TASLAK notu** yayında kaldırılır.
7. **Gizlilik metninde** "şifreli saklanır", "günlük yedek" ve "Türkiye'de" ifadeleri doğrulanana kadar kullanılmadı.

## 7. Avukata sorulacak sorular

**Tüketici ve satış**

- S1. Sitedeki 14 günlük iade vaadi sürsün mü, yoksa MSY md. 15/1-ğ ve h istisnasına geçilsin mi? Yazılım aboneliği "anında ifa edilen hizmet" veya "gayrimaddi mal" sayılır mı? İstisna için ödeme ekranında hangi onay gerekir?
- S2. Çoğu müşteri tacir veya esnaf. Bir klinik, eczane veya esnaf hiçbir durumda tüketici sayılmaz mı? Şahıs işletmesinde ayrım nasıl yapılır? Beyan yeterli mi?
- S3. Otomatik yenilenmeyen ve peşin ödenen aylık lisans "belirli süreli abonelik" mi, yoksa belirsiz süreli sayılma riski var mı (6502 md. 52/4)?
- S4. Shopier kullanılacak mı? Kullanılırsa NEBSOFT için aracı hizmet sağlayıcı ilişkisi, veri aktarımı ve iade süreci metinlere nasıl yansır?
- S5. 6502 md. 52/4 "bir yıldan daha uzun", Abonelik Yönetmeliği md. 22 "bir yıl ve daha uzun" diyor. Yıllık abonelikte hangisi uygulanır? Güncel yönetmelik metni bu şekilde mi?
- S6. Ticari müşteri iadesini "aynı program için bir kez" ile sınırlamak geçerli mi?

**Sorumluluk**

- S7. Kullanım Koşulları md. 14'teki 12 aylık bedel tavanı TBK md. 25 ve 115 yönünden geçerli mi? Tutar yeterince makul mü? Ayrı kabul kutusu yeterli mi, yoksa bireysel müzakere izlenimi için ek adım gerekir mi?
- S8. Dolaylı zarar ve kâr kaybı dışlaması tacirler için geçerli mi?
- S9. Mesleki yazılımda (bordro, vergi süresi, ilaç) hatalı hesap sonucu ceza doğarsa md. 6 ve 14 korumayı sağlar mı?
- S10. Yedek hiç alınmazsa ağır kusur sayılır mı? Müşteriye yedek yükümlülüğü yüklemek hangi şartla geçerli olur?
- S11. Sigorta (mesleki sorumluluk, siber) önerilir mi?

**KVKK**

- S12. NEBSOFT'un işletmelerin verisi için veri işleyen rolü, ürün geliştirme ve destek erişimi dikkate alındığında tartışmasız mı? Bazı işlemlerde ortak veri sorumlusu sayılma riski var mı?
- S13. İşletme sitesindeki Google Haritalar ve Google Fonts bağlantısında veri sorumlusu kim? Yurt dışı aktarım dayanağı ne olmalı? Düzenli aktarım olduğu için açık rıza kullanılamaz mı?
- S14. POS ürün havuzuna otomatik katkı için müşteriden ayrıca izin gerekir mi? Kapatma seçeneği zorunlu mu?
- S15. E-posta Gmail veya Outlook ile gönderilecekse KVKK md. 9 dayanağı ne olur? Standart sözleşmeyi kim imzalar ve bildirir?
- S16. Veri işleme sözleşmesi site üzerinden kabulle yeterli mi, klinik ve eczane için imzalı nüsha gerekir mi?
- S17. NEBSOFT'un kendisi VERBİS'e kayıtlı olmalı mı? Veri işleyen olarak yoğun sağlık verisi barındırmak istisnayı etkiler mi?
- S18. Veteriner kayıtları özel nitelikli sayılır mı? Metindeki yaklaşım yeterli mi?
- S19. Klinik ve eczane verisi için ek düzenleme var mı (Kişisel Sağlık Verileri Yönetmeliği, Sağlık Bakanlığı kuralları, 2025 değişikliği)? Sağlık verisinin ticari bulutta veya yurt içi dışında barındırılması kısıtlanıyor mu? Yazılım tıbbi cihaz sayılabilir mi?

**5651 ve e-ticaret**

- S20. NEBSOFT işletme sayfaları için yer sağlayıcı mı? Yer sağlayıcı bildirimi gerekir mi? Trafik saklama süresi kaç? 5651 md. 5/3 "bir yıldan az ve iki yıldan fazla olmamak", Yönetmelik md. 7 "altı ay" diyor. Bu fark UYUMSUZ. 24.7.2026 tarihli 7590 sayılı Kanun değişiklikleri bu yükümlülükleri ve yetkili kurumu nasıl etkiliyor?
- S21. İşletme sitelerindeki online sipariş ve rezervasyon NEBSOFT'u "aracı hizmet sağlayıcı" yapar mı (MSY md. 4, 12/A; 6563)? Ödeme almamamız yeterli mi? ETBİS kaydı gerekir mi?
- S22. Müşteri sayfalarındaki "NEBSOFT ile hazırlandı" bağlantısı ve site haritasına otomatik ekleme için hangi bilgilendirme yeterli?

**Ticari ileti ve diğer**

- S23. Lisans hatırlatma e-postası ve tavsiye daveti ticari ileti sayılır mı? Mevcut müşteriye kampanya e-postası için onay ve İYS düzeni nasıl kurulmalı?
- S24. Mali müşavir, avukat, hekim gibi serbest meslek sahipleri ETK md. 6/2 anlamında "tacir veya esnaf" sayılır mı?
- S25. Yetkili mahkeme kaydı, tacir olmayan ticari müşteride (serbest meslek, dernek) geçersiz mi? HMK md. 18 "yazılı" şartı internette tıklamayla karşılanır mı?
- S26. Kullanım Koşulları md. 21 devir hükmü geçerli mi?
- S27. Şirket türü (limited, anonim, şahıs) hangi zorunlu bilgileri değiştirir (TTK md. 39, 1524)?
- S28. NEBSOFT çalışan ve aday aydınlatma metni, gizlilik sözleşmesi, saklama ve imha politikası gibi iç belgeler ayrıca hazırlanmalı mı?

## 8. Kullanıcıdan gerekenler

**Şirket bilgileri**

- Ticaret unvanı, şirket türü, MERSİS, vergi dairesi ve no, ticaret sicil no, açık adres
- KEP adresi, KVKK e-postası, hukuk ve içerik bildirimi e-postası
- Doğru telefon ve e-posta. Kodda `0850 555 00 34` ve `destek@nebsoft.com.tr` varsayılan olarak var, gerçek olduğu doğrulanmadı. Alan adı da belirsiz: `sunucu.json` `nebsoftapp.com`, kod `nebsoft.com.tr`, `site.config.js` `domain.com`
- VERBİS durumu, ETBİS durumu, İYS kaydı
- Çalışan sayısı ve yıllık bilanço (VERBİS istisnası için)

**Altyapı**

- Sunucu ve veritabanı sağlayıcısı, sözleşmesi, ülkesi
- Yedek var mı, nerede, sıklığı, süresi, şifreli mi, geri yükleme denendi mi
- MySQL disk şifrelemesi var mı
- Cloudflare veya benzeri CDN kullanılıyor mu
- Canlıda hangi e-posta sağlayıcısı seçili
- nginx erişim kaydı ve süresi
- NEBSOFT'ta veritabanına kimler erişiyor
- Yedek depolama sağlayıcısı ve ülkesi
- NEBSOFT'un kendi faturaları için e-Belge sağlayıcısı ve mali müşaviri
- Sitenin kesin adresi

**İş kararları**

- Ödeme: yalnızca havale mi, Shopier gelecek mi
- Cayma kararı (S1), kısmi iade kararı
- Destek saatleri ve kanalları, bildirim süreleri
- Havale onay süresi, ödeme bekleme süresi, mücbir sebep süresi, değişiklik bildirim süresi
- Sorumluluk tavanı, yetkili mahkeme şehri
- §5.3'teki saklama süreleri
- İhlal bildirim süresi, alt işleyen bildirim süresi, başvuru iletme süresi

**Avukat**

- Sekiz metnin ve bu raporun incelenmesi
- §7'deki soruların yanıtlanması

## 9. Market ve kod tarafında gereken değişiklikler

Bu görevde kod değiştirilmedi. `market/market.js`, `sw.js`, `package.json` değişmedi.

**Yasal sayfalar**

- `market.js:751-757` içindeki sabit metinler `site/src/yasal/*.md` ile değiştirilmeli.
- Rota eşlemesi: `sozlesme` → `mesafeli-satis`. Yeni rotalar: `cerez`, `kullanim-kosullari`, `veri-isleme-sozlesmesi`, `acik-riza`. Eski bağlantılar çalışmaya devam etmeli (`market.js:109`, `:477`, `:669`, `:899`, `site/tools/build-sites.js:37`, `kb-genel.js:54`).
- `market.js:759` her zaman bugünün tarihini gösteriyor. `updated` alanı gösterilmeli. "örnek şablondur" notu avukat onayı sonrası kalkmalı.
- Metinler en az 12 punto (yaklaşık 16 piksel) gösterilmeli: 6502 md. 4/1; MSY md. 6/1.
- Footer'a kaldırılan iddialar yerine Kullanım Koşulları, Çerez Politikası bağlantısı ve 5651 Yön. md. 5 tanıtıcı bilgileri ana sayfadan iletişim başlığı altında eklenmeli.

**Pazarlama iddiaları** (§5.1)

- `market.js:110`, `:292`, `:587`, `:757`: "KVKK uyumlu", "Türkiye'de barındırılır", "günlük yedek", "şifreli" doğrulanana kadar kaldırılmalı.
- `market.js:739-740`: yanıt süresi ve saat bilgileri gerçek değilse kaldırılmalı.
- `kb-genel.js:17`, `:22`, `:52`, `:54` ve `routes.js:100`: gerçek davranışa göre yeniden yazılmalı.

**Kayıt ve iletişim formu**

- `market.js:669`: "kullanım koşullarını" bağlantısı yanlış sayfaya gidiyor. Kullanım Koşulları'na bağlanmalı.
- Aydınlatma "okudum, kabul ediyorum" değil, "bilgilendirildim" biçiminde ayrı olmalı. Kullanım Koşulları kabulü ayrı kutu olmalı.
- `market.js:742`, `:745`: "KVKK ... okudum, iletişim izni veriyorum" tek kutusu ve zorunluluğu kaldırılmalı. Aydınlatma bağlantı olarak verilmeli. Ticari ileti izni ayrı, isteğe bağlı ve boş kutu olmalı (K5 md. 7/8-9; K21).
- Kayıtta müşteri türü sorulmalı (E12). Veri İşleme Sözleşmesi kabulü eklenmeli.

**Sipariş**

- Ödeme adımında Bölüm A ön bilgilendirme gösterilmeli, MSY md. 5/1 a, d, g, h birlikte ve ödemeden hemen önce görünmeli (MSY md. 6/2-a).
- `market.js:902` düğmesi ödeme yükümlülüğünü açıkça söylemeli. Örnek: "Siparişi onayla, ödeme yükümlülüğü doğar" (MSY md. 8/1).
- `market.js:899`, ön bilgilendirme ve sözleşme için ayrı onay almalı.
- Sipariş sonrası sözleşme kalıcı veri saklayıcısıyla e-posta olarak gönderilmeli (6502 md. 4/1, 52/2).
- Kabul kaydı tutulmalı (E11).
- Ticari Müşteri için Koşullar md. 14 ayrıca gösterilmeli (TBK md. 21).

**Yer tutucular**

Yayın sırasında `[...]` kalan bir sayfa derlemeyi durdurmalı.

---

Engelleyenler + senden gerekenler: §1'deki E1-E15 kapanmadan ve §8'deki bilgiler verilmeden metinler yayımlanmaz. İlk adım şirket bilgileri, altyapı bilgileri ve avukat incelemesidir.
