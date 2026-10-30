# NEBSOFT pazar genişleme planı

Tarih: 30.10.2026 · Dal: `pazarlama/plan` (taban: `devir/hepsi` 7c5c352). İçerik: `docs/pazarlama/ICERIK-TAKVIMI.md`.

Bu belge hukuki veya mali görüş değildir. Puanlar ölçüm değil, kod ve belge incelemesine dayanan yargıdır.

## CANLIYA ÇIKMAYI ENGELLEYENLER

Satışa çıkmayı doğrudan durduranlar. Sıra önemlidir.

| # | Engel | Kanıt | Gereken | Durum |
|---|---|---|---|---|
| 1 | Şirket kimliği yok. "nebsoft yazılım şirketi" çatısı bugün belgede yok: unvan, MERSİS, adres, KEP | `docs/YASAL-INCELEME.md` E1 | Şirket kararı ve bilgileri | Açık |
| 2 | Yasal metinler taslak, avukat onayı yok | `docs/YASAL-INCELEME.md` başlık, `docs/DEVIR.md` | Avukat | Açık |
| 3 | Satış akışı mesafeli sözleşme kurallarına uymuyor, kabul kaydı yetersiz | `docs/YASAL-INCELEME.md` E10, E11, E12 | Kod işi, avukat | Açık |
| 4 | Ticari ileti düzeni eksik, İYS kaydı yok | `docs/YASAL-INCELEME.md` E13, `docs/PAZARLAMA-ARACI.md` | İYS kaydı, aydınlatma metni | Açık |
| 5 | Ödeme: Shopier kodu var, gerçek hesapla denenmedi, varsayılan kapalı; havale elle | `docs/DEVIR.md`, git geçmişi | Shopier erişim anahtarı ve canlı deneme | Açık |
| 6 | Yedek düzeni, silme ve saklama süresi, 5651 kaydı | `docs/YASAL-INCELEME.md` E5, E7, E8 | Sunucu işi | Bu çalışmada yeniden denetlenmedi |
| 7 | Varsayılan sunucu adresi düz HTTP | `docs/YASAL-INCELEME.md` E4, `docs/DEVIR.md` "Hâlâ açık" | HTTPS adres, exe ve apk yenileme | Açık |
| 8 | Alan adı yer tutucu, destek telefonu doğrulanmadı | `site/src/site.config.js`, `docs/IDDIA-LISTESI.md` §3 | Gerçek bilgi | Açık |
| 9 | Program rollerinin 27'si yalnız arayüzde, yetkili onayı sunucuda zorlanmıyor | `docs/DEVIR.md` "Hâlâ açık" | Çok kullanıcılı programlarda karar | Açık |
| 10 | Hiçbir programda pilot işletme kabulü yok | `docs/urun/*.md` "kabul bekliyor" | Dalga 1 pilotları | Açık |

Sonuç: **bugün ücretli reklam veya soğuk ulaşım önerilmez.** İlk adım Dalga 0'dır.

## 1. "Bugün çalışan" ne demek

`node server/test/program-duman.test.js` bu dalda 30.10.2026'da çalıştırıldı: 31/31 program yüklendi, 414 yönlendirme ve 13.729 tohum kaydı denetlendi, 4 denetim geçti. Bu test tarayıcı çizimi ve tıklama akışı denemez. `npm test` bu görevde çalıştırılmadı, çünkü kod değişmedi.

Spec dosyaları ve `docs/DEVIR.md` 31 programın üç geliştirme dalgasının da yapıldığını yazıyor. Bu, müşteri kullanımı demek değildir.

| Düzey | Tanım | Satış anlamı |
|---|---|---|
| A | Temel iş akışı dış hesap olmadan yürür. Dış bağlantılar isteğe bağlıdır | Bugünkü haliyle anlatılabilir |
| B | Çalışır, ama müşterinin beklediği önemli bir bağ dışarıda kalır (yazarkasa, KBS, e-İrsaliye, kart) | Sınır açıkça söylenerek satılır |
| C | Ana değer doğrulanmamış bağlantıya bağlıdır | Test hesabı olmadan satılmaz |

## 2. Öncelik ölçütleri

Her ölçüt 1–5 arasıdır, 5 bizim için en iyisidir. Toplam 100 üzerindendir.

| Ölçüt | Ağırlık | 5 puan | 1 puan | Veri |
|---|---|---|---|---|
| Entegrasyon bağımlılığı | 30 | Dış hesap gerekmez | Ana değer doğrulanmamış bağlantıda | `docs/ENTEGRASYON-RAPORU.md`, spec engelleyenleri, `market/catalog.js` SSS |
| Satış döngüsü | 25 | Sahibi tek başına, demo sonrası karar verir | Kurul, ihale, kurulum projesi | Yargı |
| Destek yükü | 25 | Donanım yok, veri taşıma az, tek kullanıcı | Saha, kasa arızası, yasal sorumluluk | Yargı |
| Rekabet | 20 | Az ve dağınık yerli ürün | Çok sayıda köklü ürün | `docs/urun/*.md` rakip kaynakları. Pazar payı verisi yok |

Sıralama yalnız puanla yapılmaz. Üç kural puanın üstündedir: (1) soğuk ulaşım hukuku belirsiz meslekler yalnız organik kanaldan gider, (2) yasal zorunluluğu program dışında bırakan ürün "yardımcı program" diye anlatılır veya durdurulur, (3) düzey C program, puanı ne olursa olsun kendi kapısını bekler. Bu yüzden Kâr & Fiyat Robotu puanına göre daha geridedir. CRM puanı yüksek olsa da rekabeti en zor gruptadır ve Dalga 1–2 müşterisine hitap etmez, Dalga 3'e bırakıldı.

| Program | Düzey | Rekabet | Döngü | Entegrasyon | Destek | Toplam | Dalga | Gerekçe |
|---|---|---|---|---|---|---|---|---|
| Teknik Servis | A | 3 | 5 | 5 | 4 | 87 | 1 | Takip ve teklif onayı bağlantıyla çalışır, donanım şart değil |
| Oto Yıkama & Otopark | A | 4 | 4 | 4 | 4 | 80 | 1 | Plaka elle yazılır, müşteri sayfası bağımsız çalışır |
| Randevu | A | 2 | 5 | 4 | 4 | 77 | 1 | Rekabet yüksek, ama satışı hızlı; hatırlatma SMS sınırı açıkça söylenir |
| Oto Servis | A | 3 | 4 | 4 | 4 | 76 | 1 | Onay bağlantısı elle paylaşılabilir; e-Arşiv isteyen için sınır var |
| Spor Salonu | A | 3 | 4 | 4 | 4 | 76 | 1 | Turnike isteğe bağlı, QR girişi yazılımda |
| Anaokulu & Kreş | A | 3 | 3 | 5 | 3 | 72 | 2 | Dış bağımlılık yok; çocuk verisi hassas, okul takvimine bağlı |
| Kurs & Etüt | A | 3 | 3 | 5 | 3 | 72 | 2 | Dış bağımlılık yok; dönem başı satılır |
| Hukuk Bürosu | A | 3 | 3 | 5 | 3 | 72 | 2 | UYAP bağı yok, elle giriş; yalnız organik kanal |
| Emlak Ofisi | A | 3 | 4 | 3 | 4 | 70 | 2 | Portal gönderimi yok, elle kayıt var |
| Oto Galeri | A | 3 | 4 | 3 | 4 | 70 | 2 | Satış faturası yok, portal elle |
| Veteriner Kliniği | A | 3 | 4 | 3 | 4 | 70 | 2 | Resmî bildirimler dışarıda; yalnız organik kanal |
| CRM | A | 1 | 3 | 5 | 4 | 69 | 3 | Bağımsız çalışır, ama rakip çok ve fark anlatması zor |
| Mali Müşavir Bürosu | A | 3 | 3 | 4 | 3 | 66 | 2 | GİB’e göndermez, takip ürünüdür; yalnız organik kanal, ortak kanal adayı |
| Kuyumcu | A | 3 | 4 | 3 | 3 | 65 | 2 | Has tanımı ve kimlik sınırı kararları açık |
| Araç Kiralama | A | 3 | 4 | 3 | 3 | 65 | 2 | Emniyet bildirimi ve sözleşme metni açık |
| Etkinlik Bilet | B | 3 | 3 | 3 | 3 | 60 | 3 | Online kart yok, rezervasyon olarak satılır |
| Kâr & Fiyat Robotu | C | 2 | 4 | 2 | 4 | 60 | 4 | Hesaplayıcı çalışır, canlı fiyat denenmedi |
| Butik & Giyim | B | 3 | 4 | 2 | 3 | 59 | 3 | Yazarkasa bağı yok, mali fiş ayrı |
| Kargo & Kurye | B | 3 | 3 | 2 | 3 | 54 | 4 | Yerel kuryeye uygun; firma API’si ve GPS yok |
| Apartman & Site | B | 2 | 2 | 3 | 3 | 51 | 3 | Kart ve banka yok; karar kurulla alınır |
| Personel & Puantaj | B | 2 | 3 | 3 | 2 | 51 | 3 | Bordro sorumluluğu yüksek, SGK elle |
| Klinik & Muayenehane | B | 2 | 3 | 3 | 2 | 51 | 4 | Sağlık verisi kapısı, organik kanal |
| Toptancı & Plasiyer | B | 3 | 2 | 3 | 2 | 50 | 3 | e-İrsaliye yok, saha eğitimi gerekir |
| Otel & Pansiyon | B | 2 | 3 | 2 | 3 | 50 | 4 | KBS ve kanal yöneticisi yok |
| Adisyon | B | 1 | 4 | 2 | 2 | 46 | 3 | Pazar büyük, ama yazarkasa ve platform bağı yok, saha desteği ister |
| Market POS | B | 1 | 4 | 2 | 2 | 46 | 3 | Pazar büyük, ama yazarkasa bağı yok, kasa arızası acil destek ister |
| Pazaryeri Satıcı Paneli | C | 1 | 4 | 1 | 3 | 45 | 4 | Mağaza bağlantısı test hesabı ister |
| Ön Muhasebe | C | 1 | 3 | 2 | 2 | 41 | 4 | e-Fatura canlı denenmeden ana değer eksik |
| E-ticaret Mağazası | C | 1 | 3 | 1 | 3 | 40 | 4 | Kart ödeme ve fotoğraf yükleme yok |
| Fabrika ERP | B | 2 | 1 | 3 | 1 | 36 | 4 | Uzun satış, kurulum ve cihaz testi ister |
| Eczane | C | 1 | 2 | 1 | 1 | 25 | Durdur | MEDULA, İTS, ÜTS yok; yasal zorunluluk dışarıda kalır |

## 3. Sektör sırası

### Dalga 0: Satışa hazırlık

Amaç: yukarıdaki engelleri kapatmak. Kanal: yalnız site, rehber yazıları, ücretsiz araçlar ve Search Console. Yayınlanan içerik yok, reklam yok.

Çıkış kapısı: engel 1–5, 7, 8 kapandı.

### Dalga 1: Görünür fayda, hızlı karar

Programlar: Teknik Servis, Oto Servis, Oto Yıkama & Otopark, Spor Salonu, Randevu.

Neden: müşteriye açık bir bağlantı (takip, onay, online randevu, üye portalı) demoda hemen görülür. Karar veren çoğunlukla işletme sahibidir. Yazarkasa ve resmî kurum bağı olmadan çalışır.

Kanal: dikey video ve Instagram, sanayi siteleri ve çarşıda yüz yüze ziyaret, düşük hacimli telefon araması (İYS sonrası, `ic-araclar/nebsoftpazarlama`), teknik servis ve bilgisayarcı ortaklığı.

Pilot: sektör başına 1–2 işletme, `docs/VAKA-FORMU.md` ile ölçüm ve izin. Çıkış kapısı (öneri, kanıta dayanmıyor): en az 3 işletme iki hafta gerçek kayıt girer, destek konuları sınıflanır, kritik hata kalmaz.

### Dalga 2: Bağımsız çalışan dikey programlar

Programlar: Emlak, Oto Galeri, Araç Kiralama, Kuyumcu, Anaokulu, Kurs, Hukuk, Mali Müşavir, Veteriner.

Kanal farkı:

- **Emlak, Galeri, Kiralama, Kuyumcu:** Dalga 1 ile aynı kanal. Belge taslakları önce hukukçuya gösterilir.
- **Anaokulu, Kurs:** okul takvimine bağlı. Çocuk verisi nedeniyle avukat onayı ve veli aydınlatması önce gelir.
- **Hukuk, Müşavir, Veteriner:** soğuk ileti yok (serbest meslek istisnası DOĞRULANAMADI). Rehber yazıları, LinkedIn, oda etkinlikleri (içerik izni alınarak).
- **Mali müşavir** aynı zamanda ortak kanaldır: mükelleflerine Ön Muhasebe veya sektör programı önerebilir. Ortaklık şartı ve tavsiye ödülü sizin kararınızdır (`server/cloud/routes.js` tavsiye ödülü gün ekler, nakit vermez).

### Dalga 3: Kasa ve ofis

Programlar: Adisyon, Market POS, Butik, CRM, Personel, Toptan, Site, Bilet.

Neden sonra: pazar büyük ama yazarkasa bağı yok (GMP-3 üretici kütüphanesi ve anlaşma gerekir, `docs/DEVIR.md` B11). Kasa durursa acil destek ister. Önce destek kapasitesi kurulmalı. Teklif "mali fişi cihazınızdan kesersiniz" cümlesiyle verilir.

Kanal: esnaf odası ziyaretleri, barkod ve yazarkasa bayileri (anlaşma gerekir), yerel saha. CRM ve Personel için LinkedIn.

### Dalga 4: Kapısı olan programlar

Her biri kendi kapısı açılınca sıraya girer.

| Program | Kapı |
|---|---|
| Ön Muhasebe | e-Fatura sağlayıcı test hesabı, B1 |
| Otel | Kanal ve KBS için karar, kapasiteye göre yalnız web rezervasyonu teklifi |
| Klinik | Şifreleme birleşti (`docs/DEVIR.md`), iki adımlı giriş ve sağlık verisi kuralları yeniden denetlenmeli; avukat; organik kanal |
| Kargo | Yalnız kendi kuryesiyle çalışan işletme |
| Kâr & Fiyat Robotu | Hesaplayıcı önce ücretsiz araç olarak; canlı fiyat test hesabından sonra |
| Pazaryeri | Trendyol ve n11 satıcı test hesabı |
| E-ticaret | Fotoğraf yükleme, kart ödeme |
| Fabrika ERP | Pilot projeyle, cihaz testiyle, doğrudan görüşmeyle |

### Durdurulan: Eczane

**Kullanıcı kararı 30.10.2026:** Aktif satış durduruldu, Dalga 1 sırası onaylandı.

MEDULA, İTS, ÜTS ve ÖKC bildirimleri yasal zorunluluktur ve programda yoktur (`docs/urun/ECZANE.md`). Aktif satış önerilmez. Program silinmez, tanıtım "yardımcı takip programı" diye sınırlı kalır.

## 4. Kanallar

| Kanal | Hazır mı | Kural | Hangi dalga |
|---|---|---|---|
| SEO: 62 rehber, ücretsiz araçlar, ürün sayfaları | Kod hazır, alan adı ve Search Console yok | Sıralama garantisi yok, anahtar kelimeler aday | 0'dan itibaren |
| Kısa video, Instagram | Metin hazır | `ICERIK-TAKVIMI.md` kuralları | 1 |
| LinkedIn | Metin hazır | Aynı kurallar | 1, ağırlık 2–3 |
| Yüz yüze saha | Araç listesi var | 6563 elektronik iletiyi kapsar; kişisel veri alınırsa aydınlatma gerekir | 1 |
| Telefon, SMS, e-posta | Araç var, otomatik gönderim yok | Esnaf ve tacire önceden onay aranmaz, ama İYS kaydı ve ret kontrolü zorunludur. Serbest meslek DOĞRULANAMADI | 1, İYS sonrası |
| Ortak ve bayi | Tavsiye ödülü var, bayi programı yok | Sözleşme ve komisyon kararı gerekir | 2 |
| Tavsiye | Kod var | Tavsiye daveti ticari ileti mi: S23, avukata sorulacak | 1 sonrası |
| Ücretli reklam | Hazır değil | Dönüşüm ölçümü, çerez onayı, bütçe kararı gerekir | Dalga 1 çıkışından sonra |

Veri kaynağı uyarısı: Overpass genel sunucusu ticari kullanım için önerilmiyor (UYUMSUZ); Google kaynağı DOĞRULANAMADI (`docs/PAZARLAMA-ARACI.md`).

## 5. Pazar büyüklüğü verileri

Yalnız resmî kurum veya meslek kuruluşu kaynağı kullanıldı. Bu sayılar hedef müşteri sayısı değildir: kaç işletmenin yazılım aradığını, ödeme gücünü veya bize ulaşılabilirliğini söylemez.

### DOĞRULANDI

| Alan | Değer | Kaynak | Dönem / okundu |
|---|---|---|---|
| Esnaf ve sanatkâr | 2.267.700 kişi, 2.559.758 iş yeri, 184 meslek dalı | [TESK Nisan Ayı İstatistik Raporu](https://tesk.org.tr/resimler/soneko/2026004.pdf), kaynak ESBİS | 30.04.2026, okundu 30.10.2026 |
| Bakkallık, bayilik, büfecilik | 193.759 (grafik); metinde 193.717 | Aynı rapor. İki değer çelişiyor | 30.04.2026 |
| Lokantacılık | 143.910 | Aynı rapor, şekil 5 | 30.04.2026 |
| E-ticaret yapan işletme | 634.611 (2025), 600.800 (2024). Sektör payı: yemek %20,3, giyim %13,8 | [Ticaret Bakanlığı ETBİS duyurusu](https://etbis.ticaret.gov.tr/tr/Post/postturkiyede-e-ticaretin-gorunumu-2025-raporu-yayimlandi-3) | 2025, yayın 12.05.2026, okundu 30.10.2026 |
| Konaklama tesisi | İşletme belgeli 8.821, yatırım belgeli 444, basit konaklama 12.225 (veriler geçici) | [Kültür ve Turizm Bakanlığı, Eylül 2026 tablosu](https://yigm.ktb.gov.tr/TR-201136/bakanlik-belgeli-tesis-istatistikleri.html) | Eylül 2026, okundu 30.10.2026 |
| Okul öncesi | 17.640 okul, 1.741.314 öğrenci. Tüm özel okullar 14.700 | [MEB, 2024-2025 Örgün Eğitim İstatistikleri](https://www.meb.gov.tr/2024-2025-orgun-egitim-istatistikleri-aciklandi/haber/38473/tr) | 2024-2025, yayın 30.09.2025 |
| Diş hekimi | 52.994; özel sektör 31.558 | [Sağlık Bakanlığı, Sağlık İstatistikleri Yıllığı 2025 Haber Bülteni, Tablo 18](https://dosyamerkez.saglik.gov.tr/Eklenti/56342/0/haber-bulteni-2025-trpdf.pdf) | 2025, okundu 30.10.2026 |
| Eczacı | 43.720; özel sektör 37.875. Eczane sayısı değildir | Aynı bülten | 2025 |
| Mali müşavir | SM ve SMMM 132.169; serbest çalışan toplam 63.562 (SM 1.944, SMMM 58.592, YMM 3.026) | [TÜRMOB dağılım tablosu](https://www.turmob.org.tr/istatistikler), [özet tablo](https://www.turmob.org.tr/istatistikler/72930aad-2c4a-4592-b492-6b5f4df1c503/calisanlarin-kutuge-kayitli-olanlar---olmayanlar-ozet-tablosu) | Tablolarda tarih yok, okundu 30.10.2026 |

Not: TESK ve Sağlık Bakanlığı PDF'lerinin metni dosyadan çıkarıldı. KTB verisi resmî Excel dosyasından okundu; sütun sırası aynı tablonun Ağustos 2026 kopyasıyla karşılaştırıldı.

### DOĞRULANAMADI

Rakam yazılmadı.

| Alan | Neden |
|---|---|
| Türkiye toplam girişim sayısı (TÜİK) | TÜİK bülteni bu ortamda okunamadı. Yalnız haberlerde geçiyor |
| Avukat sayısı | TBB sitesi erişim vermedi. Yalnız ikincil kaynak |
| Eczane sayısı | TEB sitesinde resmî tablo bulunamadı. Yalnız basın demeci |
| Muayenehane ve klinik sayısı | TDB belgesi okunamadı, bakanlık bülteninde yok |
| Veteriner kliniği sayısı | Resmî tablo bulunamadı |
| Emlak ofisi sayısı | Ticaret Bakanlığı il sayfalarında ülke toplamı yok |
| Kuaför, berber, oto tamir, oto yıkama, teknik servis, kuyumcu, butik | TESK raporu yalnız ilk beş meslek kolunu veriyor. Meslek kolu tablosu TESK'ten istenebilir |
| Spor salonu, kurs, kargo, rent a car, site yönetimi, toptancı, fabrika | Bu çalışmada resmî sektör sayısı bulunamadı |
| Özel anaokulu sayısı | MEB duyurusu resmî ve özel ayrımı vermiyor |
| Yazılım kullanma oranı ve pazar değeri (TL) | Resmî kaynak bulunamadı. Hiçbir sektör için tahmin yazılmadı |

## 6. Şirket çatısı önerisi

- **Tek marka:** NEBSOFT. Her program `[ALAN_ADI]/<sayfa>` altında kalır. Ayrı marka açılmaz.
- **Vaat:** sektöre özel program, örnek verili demo, neyin açık olmadığını baştan söylemek. Bu vaat koda dayanır: TEST etiketi, ürün SSS'leri.
- **Fiyat:** liste fiyatları piyasa araştırmasına dayanıyor (`docs/GELISTIRME-PLANI.md`), gerçek satışla sınanmadı. Destek paketi ve toplu indirim değerleri örnektir (`docs/DEVIR.md`).
- **Destek:** dalga başına destek konuları sayılır. Kapasite dolmadan yeni dalga açılmaz.

## 7. Ölçüm

Hedef rakam yazılmadı, çünkü taban veri yok. İlk 30 gün sadece ölçülür.

| Aşama | Ölçü | Kaynak |
|---|---|---|
| İlgi | Sayfa ziyareti, video izlenme | Search Console, platform |
| Deneme | Demo açma, deneme başlatma | Yönetim analitiği |
| Etkinleşme | İlk gerçek kayıt, 7 gündeki kullanım günü | Yönetim analitiği |
| Ödeme | Denemeden ödemeye geçiş | Sipariş kayıtları |
| Destek | Program başına talep, konu | Destek kayıtları |
| Kanıt | İzinli vaka sayısı | `docs/VAKA-FORMU.md` |

## 8. Karar listesi

1. **Şirket:** tür, unvan, adres, KEP ve kimin adına İYS kaydı yapılacak?
2. **Sıra onayı:** Dalga 1 bu beş program mı? Pilotları kim bulacak?
3. **Eczane:** durdurmayı onaylıyor musunuz, yoksa yetkili bir çözümle iş ortaklığı mı aranacak?
4. **Kasa programları:** yazarkasa üreticisiyle görüşülecek mi, yoksa "mali fiş ayrı" diye mi satılacak? Marka ve model hangisi?
5. **Ödeme:** Shopier canlı denensin mi? Havale ilk dönemde yeterli mi?
6. **Saha:** ziyaret ve aramayı kim yapacak? Komisyon veya bayi modeli olacak mı?
7. **Mali müşavir ortaklığı:** ortaklık, ödül veya gelir paylaşımı istiyor musunuz? Avukat görüşü gerekir.
8. **Veri toplama:** Overpass düşük hacimde devam mı, ücretli mi? Google kaynağı açılsın mı?
9. **Reklam bütçesi:** Dalga 1 sonrası var mı, ne kadar?
10. **Destek saatleri ve kanalı:** gerçek telefon hattı olacak mı?
11. **Fiyatlar:** liste, kampanya ve "2 ay bedava" kullanımı için karar.
12. **Avukat soruları:** S23 ve S24 (`docs/YASAL-INCELEME.md`), serbest meslek ve tavsiye daveti.

## Senden gerekenler

Şirket bilgileri, alan adı, İYS ve avukat. Bunlar gelmeden yalnız Dalga 0 yürür. Ardından sıra onayı ve Dalga 1 için iki veya üç pilot işletme.
