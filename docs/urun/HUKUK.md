# Hukuk Bürosu — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı ("atlama yok").
> Dalgalar sırayla uygulanıyor; her dalganın sonucu aşağıdaki "Yapılanlar" bölümüne yazılır.

Tarih: 29.10.2026 · Dal: `claude/urun-profesyonel-5c5840` · Yöntem: `CLAUDE.md` §2 · Program: `apps/hukuk/`

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Süre hesabı | `HKK.due()`: 16 kural (HMK, İİK, CMK, İYUK, hâkim süresi), hafta/ay/yıl karşılık gelen gün, HMK +1 hafta / CMK +3 gün / İYUK +7 gün / İİK uzamasız, HMK 103 işareti, hafta sonu + resmî tatil + girilen bayram, arefe ve 28 Ekim uyarısı, "nasıl hesaplandı" adımları kayda yazılıyor | `apps/hukuk/sure.test.js` 18/18 |
| H2 | Mahkeme adı | Serbest metin + öneri listesi | Tarayıcı: "Ankara 3. İş Mahkemesi" ile dosya açıldı |
| H3 | Müvekkil mesajları | "Mesajlar" sayfası, okunmamış rozeti, yanıt portalda görünüyor, isteğe bağlı SMS | Tarayıcı: büro yanıtı portalda "Büro" olarak görüldü |
| H4 | Makbuz | e-Arşiv fatura yerine e-SMM (`NS.integ.call('esmm')`); tahsilatlar ayrı kayıt, silinebilir; bireysel müvekkilde stopaj girili ise engel (§0) | Tarayıcı: e-SMM kapalıyken "düzenlenemedi" mesajı |
| H5 | Sahte başarı | SMS sonucu bekleniyor; simülasyonda "TEST — gönderilmedi" | Kod + tarayıcı |
| H6 | Portal kodu | Her müvekkile rastgele 6 karakter (eski kayıtlara açılışta), kod yenileme; formül kodu reddediliyor | Tarayıcı: TCKN son 4 ile giriş reddedildi, yeni kodla girildi. Sunucudaki yedek formül çekirdek isteği Ç2 |
| H7 | Geçmiş duruşma | Dosya ekranında sonuç gir/sil, özet sayfasında "sonucu girilmemiş duruşmalar", sonraki duruşmada çakışma uyarısı | Tarayıcı |
| H8 | Silme / numara | Dosyası olan müvekkil silinemiyor; dosya no yıl içindeki en büyük + 1; avans/masraf/süre/tahsilat silinebiliyor, avans/masrafa tarih ve açıklama | Tarayıcı |
| H9 | Telefon | Süre hesaplayıcı sayfanın başında; bekleyen/tamamlanan filtresi | 375 px |
| + | Ajanda .ics | Son günler de takvim dosyasına tüm gün etkinliği olarak ekleniyor | Kod |

## 2. dalga — yapılanlar
| Konu | Sonuç | Kanıt |
|---|---|---|
| Görevler | "Görevler" sayfası (benim / tüm açık / tamamlanan), dosyadan görev açma, menü rozeti, özet sayfasında hatırlatma | Tarayıcı |
| Vekaletname | Müvekkil kartında tarih, noter, yevmiye, geçerlilik sonu, kapsam; "vekaleti biten / yok" filtresi; 30 gün kala özet uyarısı | Tarayıcı |
| Aylık takvim | Ajanda > Ay: gün başına duruşma ve son gün sayısı, tatiller soluk, güne tıklayınca liste, önceki/sonraki ay | Tarayıcı |
| Çakışma uyarısı | Aynı avukata aynı gün ve saatte ikinci duruşma eklenirken onay (1. dalgada eklendi) | Kod |
| Danışmanlık → dava | Dosya ekranında "Davaya dönüştür"; kayıtlar korunur, nota iz düşer | Kod |
| Müvekkil ekstresi | Avans/masraf dökümü ve bakiye, `NS.docs` şablonundan yazdırılır (Belge şablonları'nda düzenlenebilir) | Tarayıcı (yazdırma penceresi açıldı) |
| Raporlar | Avukat bazında iş yükü, aylık ücret tahsilatı, ücret alacağı, dosya bazında çalışma süresi ve saatlik ücretle dökümü (yazdır) | Tarayıcı |
| Toplu duruşma hatırlatması | Ajanda > Hatırlat: seçilen günün duruşmaları için müvekkile SMS; sonuç tek tek beklenir, simülasyon "TEST (gönderilmedi)" sayılır | Tarayıcı: "Gönderildi: 0 · TEST: 2" |

Kalite kapısı: `npm test` — bulut testi (`cloud.test.js`) bu değişikliklerden **önceki** commit'te de aynı hatayla kırık (Ç7); diğer testler ve GİB XSD testi geçti. `sw.js` sürümü bu oturumun kapsamı dışında (Ç4).

---

## 0. CANLIYA ÇIKMAYI ENGELLEYENLER
| Konu | Durum | Neden | Senden gereken |
|---|---|---|---|
| UYAP entegrasyonu (dosya, safahat, duruşma çekme) | DOĞRULANAMADI | Adalet Bakanlığı'nın üçüncü taraf yazılımlara açık, belgeli bir UYAP API'si bulunamadı. Rakiplerden yalnızca Zirve e-İcraProPlus "UYAP XML dosyası + e-imza" akışını tarif ediyor; resmî şema okunamadı. UYAP Avukat Portal kurallarına göre robotla yoğun işlem erişim engeline yol açabiliyor (TBB raporu, aşağıda). | Bakanlıktan resmî entegrasyon dokümanı veya XML şeması. Gelene kadar programda UYAP bağlantısı **yok**; elle giriş + takvim aktarımı var. |
| Dini bayram günleri (süre hesabında son gün kaydırma) | DOĞRULANAMADI | Diyanet'in "dini günler" sayfası (vakithesaplama.diyanet.gov.tr) bu ortamdan açılamadı (bağlantı reddedildi, 29.10.2026). Tarih tahminle girilmedi. | Ayarlar > "Bayram ve ek tatil günleri"ne o yılın bayram günlerini gir. Girilmemişse hesaplayıcı **uyarı gösterir**. |
| e-SMM'de stopaj | UYUMSUZ (çekirdek) | Çekirdekteki e-SMM gönderimi stopajı her makbuza uyguluyor; GVK 94'e göre stopajı yalnızca vergi kesintisi yapmakla yükümlü alıcı (ör. şirket) keser, bireysel müvekkilde stopaj olmaz. | Çekirdek düzeltmesi (`CEKIRDEK-ISTEKLERI-profesyonel.md` Ç1). O zamana kadar bireysel müvekkile e-SMM kesmeden önce program uyarır. |
| Avukatlık Asgari Ücret Tarifesi (AAÜT) hesabı | DOĞRULANAMADI | Güncel tarifenin Resmî Gazete metni okunmadı. | Programda AAÜT hesabı yok; büro kendi ücretini girer. |

---

## 1. Kaynaklar

**Mevzuat** (mevzuat.gov.tr PDF'leri 29.10.2026'da indirildi, metin `pdftotext` ile okundu):
| Konu | Madde | Kaynak | Etiket |
|---|---|---|---|
| Adli tatil 20 Temmuz – 31 Ağustos | HMK 102 (6494 ile yeniden düzenleme) | mevzuat.gov.tr/mevzuatmetin/1.5.6100.pdf | DOĞRULANDI |
| Adli tatilde görülen işler (nafaka, soybağı, velayet, **işçilerin açtığı iş davaları**, ihtiyati tedbir/haciz, iflas, çekişmesiz yargı, ivedi işler…) | HMK 103 | aynı | DOĞRULANDI |
| Adli tatile rastlayan **kanuni** sürelerin bitişi tatilin bittiği günden itibaren **bir hafta** uzar | HMK 104 | aynı | DOĞRULANDI |
| Gün sürelerinde tebliğ günü sayılmaz; hafta/ay/yıl sürelerinde karşılık gelen gün, yoksa ayın son günü | HMK 92 | aynı | DOĞRULANDI |
| Son gün resmî tatile rastlarsa ilk iş günü | HMK 93 | aynı | DOĞRULANDI |
| Cevap 2 hafta (+en çok 1 ay ek süre) · basit yargılamada cevap 2 hafta (+en çok 2 hafta) | HMK 127, 317 | aynı | DOĞRULANDI |
| Cevaba cevap / ikinci cevap 2 hafta | HMK 136 | aynı | DOĞRULANDI |
| Bilirkişi raporuna itiraz 2 hafta | HMK 281 | aynı | DOĞRULANDI |
| İstinaf 2 hafta · temyiz 2 hafta | HMK 345, 361 | aynı | DOĞRULANDI |
| Gün sürelerinde ilk gün sayılmaz; ay/yıl/hafta karşılık gelen gün; son gün tatilse ertesi gün | İİK 19 (7499 ile ek cümle) | mevzuat.gov.tr/mevzuatmetin/1.3.2004.pdf | DOĞRULANDI |
| Şikâyet 7 gün · ödeme emrine itiraz 7 gün · itirazın iptali 1 yıl · itirazın kaldırılması 6 ay | İİK 16, 62, 67, 68 | aynı | DOĞRULANDI |
| Kambiyo: kambiyo vasfına şikâyet 5 gün, imzaya itiraz 5 gün, borca itiraz (169, 168/5) | İİK 168, 169 | aynı | DOĞRULANDI (168/5'in süresi metindeki 5. bentten; 3. ve 4. bent 5 gün) |
| İİK'da adli tatil hükmü yok (metinde "adli tatil" ifadesi geçmiyor) | İİK | aynı | DOĞRULANDI |
| Ceza: istinaf 2 hafta, temyiz 2 hafta (gerekçeli hükmün tebliğinden) | CMK 273, 291 | mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf | DOĞRULANDI |
| Ceza: adli tatile rastlayan süreler tatilin bittiği günden itibaren **üç gün** uzar | CMK 331/4 | aynı | DOĞRULANDI |
| Ceza: hafta/ay süreleri, son gün tatilse ertesi gün | CMK 39 | aynı | DOĞRULANDI |
| İdari yargı: dava açma 60 gün (idare/Danıştay), 30 gün (vergi); ara vermeye rastlarsa ara vermenin bittiği günü izleyen günden itibaren **yedi gün** uzar | İYUK 7, 8, 61 | mevzuat.gov.tr/mevzuatmetin/1.5.2577.pdf | DOĞRULANDI |
| Resmî tatiller: 1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim (28 Ekim 13.00'ten), Ramazan Bayramı arefe 13.00'ten 3,5 gün, Kurban Bayramı arefe 13.00'ten 4,5 gün | 2429 sayılı Kanun m.1–2 | mevzuat.gov.tr/mevzuatmetin/1.5.2429.pdf | DOĞRULANDI |
| Cumartesi ve Pazar resmî dairelerde tatil | 657 sayılı DMK m.99 | mevzuat.gov.tr/mevzuatmetin/1.5.657.pdf | DOĞRULANDI |
| Bayram tarihleri 2026–2027 | — | Diyanet sayfası açılamadı | DOĞRULANAMADI |

**Rakiplerin herkese açık özellik sayfaları** (29.10.2026'da okundu; yalnızca hangi ihtiyacı karşıladıklarına bakıldı):
| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **A** | Avukat Bulut / Evobulut Hukuk Programı (aynı firma) | avukatbulut.com, evobulut.com/hukuk-programi |
| **HB** | Hukuk Bulutu | hukukbulutu.com.tr |
| **Z** | Zirve DavaProWeb, İcraProWeb, e-İcraProPlus | zirve-bilgisayar.com/davaproweb-urun2, /icraproweb-yeni-urun7, /e-icraproplus-urun8 |
| **D** | Dijimo hukuk CRM | dijimo.com.tr/cozumler/hukuk-otomasyonu.html |

Okunamayanlar: mobikob.com.tr (bağlantı koptu), avukatpro.com (sertifika süresi dolmuş).

**Kullanıcı şikâyetleri** (29.10.2026): `sikayetvar.com/zirve-bilgisayar` — "icra programı sürekli hata veriyor", "lisanslı program açılmıyor, firmaya ulaşılamıyor, süreli işlerim var". `sikayetvar.com/avutap` (tevkil platformu) — destek yanıtsız, mükerrer tahsilat, gerekçesiz hesap kısıtlaması. TBB Avukat Hakları Merkezi yazısı (d.barobirlik.org.tr/2020/20200922_ahmek.pdf): UYAP'ta robot/otomatik yazılımla yoğun işlemde geçici erişim engeli.

**Bizim durumumuz:** 6 ekran ve müvekkil portalı tarayıcıda gezildi (masaüstü + 375 px), konsol hatası yok. Kod satır satır incelendi.

---

## 2. Bulunan hatalar ve riskler (1. dalgada düzeltilir)
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Süre hesabı mevzuata uymuyor:** (a) ceza sürelerine de 7 gün ekliyor, CMK 331/4'e göre 3 gün; (b) adli tatil uzaması sonucu 7 Eylül hafta sonuna denk gelirse kaydırmıyor (HMK 93); (c) işçinin açtığı iş davası gibi adli tatilde görülen işlerde de uzatıyor (HMK 103); (d) "bir yıl" süresini 365 gün sayıyor (HMK 92/2, İİK 19: aynı gün); (e) idari yargı süreleri ve İİK 16/68/168 yok; (f) arefe yarım gününde ve bayram günleri girilmemişse uyarı yok. | Kod + mevzuat | **Süre kaçırma riski.** Avukat için en ağır hata. |
| H2 | **Mahkeme yazılamıyor:** mahkeme alanı demodaki 8 mahkemelik sabit listeden seçiliyor. | Kod + ekran | Gerçek büro kendi mahkemesini giremiyor. |
| H3 | **Müvekkil mesajları büroya ulaşmıyor:** portaldan yazılan mesaj kaydediliyor ama büro tarafında mesaj ekranı yok. | Kod (`messages` yalnızca portalda) | Müvekkil "iletildi" görüyor, kimse okumuyor. Sahte başarı. |
| H4 | **Makbuz yanlış belge türü:** "Serbest meslek makbuzu kes" seçeneği e-SMM yerine e-Arşiv **fatura** oluşturuyor; KDV/stopaj yok. Ücret tahsilatları ayrı kayıt tutulmuyor (yalnızca toplam artıyor), geri alınamıyor. | Kod | Yanlış resmî belge; tahsilat geçmişi yok. |
| H5 | **Sahte başarı:** SMS/portal bilgisi simülasyonda bile "gönderildi" diyor. | Kod (`smsLog` sonucu beklenmiyor) | Müvekkile bilgi gitmediği hâlde gitti sanılıyor. |
| H6 | **Zayıf portal kodu:** kod üretilmemiş müvekkilde giriş kodu TCKN'nin son 4 hanesi + kayıt kimliğinden türetiliyor. | Kod (`HKK.code`, sunucu kuralı aynı) | Tahmin edilebilir kod; KVKK ve sır saklama riski. |
| H7 | **Geçmiş duruşmanın sonucu girilemiyor:** sonuç yalnızca "bugünün duruşmaları"ndan giriliyor; ertesi gün kaçan duruşma sonuçsuz kalıyor. Dosya ekranında sonuç girme yok. | Ekran + kod | Safahat eksik kalır, sonraki duruşma kaçabilir. |
| H8 | **Silme kontrolsüz:** dosyası olan müvekkil silinebiliyor (dosyalar sahipsiz kalıyor). Dosya numarası `100 + dosya sayısı` olduğundan silme sonrası çakışıyor. Masraf/avans düzeltilemiyor, silinemiyor. | Kod | Veri bütünlüğü. |
| H9 | **Telefonda süre hesaplayıcı** listenin altında kalıyor; en sık iş en zor erişilen yerde. | 375 px ekran | Kullanım. |

---

## 3. Özellik karşılaştırması
**Bizde:** ✅ var · 🟡 kısmen · ❌ yok   **Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Dosya ve takvim
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Dava / icra / arabuluculuk / danışmanlık / ceza dosyası, durum, karşı taraf | ✅ | A HB Z | O |
| Serbest mahkeme adı (H2) | ❌ | A HB Z | O |
| Duruşma ajandası, .ics aktarımı | ✅ | A HB Z | O |
| Geçmiş duruşma sonucu, safahat (H7) | 🟡 | Z ("ara karar takibi") | O |
| Aylık takvim görünümü | ❌ | A (renk kodlu takvim) | E |
| Duruşma çakışma uyarısı (aynı avukat, aynı saat) | ❌ | A ("çakışma önleme") | E |
| Görev atama ve yapılacaklar | ❌ | A HB Z | E |
| Vekaletname takibi (tarih, kapsam, bitiş) | ❌ | A | E |
| Danışmanlık dosyasını davaya dönüştürme | ❌ | A | E |
| Yaklaşan duruşmayı müvekkile otomatik hatırlatma (SMS/WhatsApp) | 🟡 (elle) | D | E |
| UYAP'tan dosya/safahat çekme | ❌ | Z (XML + e-imza), HB ("UYAP uyumlu XML") | E — **DOĞRULANAMADI** (§0) |

### Süre
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Usul süresi hesaplayıcı (adli tatil, tatil günü) | 🟡 (H1) | A (yalnızca hatırlatma) — hesaplayan rakip yok | O |
| Kanun maddesi ve gerekçeli sonuç ("neden bu tarih") | ❌ | — | F |
| Hâkimin verdiği süre (serbest gün/hafta) | ❌ | — | O |
| Süre hatırlatması (bildirim) | ✅ (rozet + özet) | A | O |

### Müvekkil ve para
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Masraf avansı, masraf, bakiye, eksiye düşünce uyarı | ✅ | A HB Z | O |
| Masraf/avans düzeltme ve silme, tarih ve açıklama | ❌ (H8) | A | O |
| Vekalet ücreti tahsilat geçmişi | ❌ (H4) | A | O |
| e-SMM (doğru belge türü) | ❌ (H4) | A | O |
| Müvekkil ekstresi (yazdır / PDF) | ❌ | A ("detaylı ekstre") | E |
| Zaman kaydı | ✅ | A | E |
| Zaman kaydından ücret dökümü (saatlik ücret × saat) | ❌ | — | E |
| Raporlar: avukat bazında dosya, tahsilat, alacak | ❌ | A Z | E |
| **Çıkar çatışması kontrolü** (yeni dosyada karşı taraf daha önce müvekkilimiz mi?) | ❌ | — | F |

### Müvekkil portalı
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Portal: dosyalar, duruşmalar, masraf dökümü, mesaj | ✅ (rakiplerde yok) | — | F |
| Mesajların büroya ulaşması ve yanıt (H3) | ❌ | D (WhatsApp paneli) | O |
| Güçlü giriş kodu (H6) | ❌ | — | O |

### Güven
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Rol: kurucu avukat / avukat (yalnızca kendi dosyaları) / sekreter | ✅ | HB | O |
| Yedek, CSV | ✅ | A HB | O |
| Dosya notlarının portalda görünmemesi | ✅ (sunucu `notes` alanını siliyor) | — | O |

---

## 4. Güven kuralları (KVKK ve sır saklama)
1. **Süre hesabı hiçbir zaman sessizce tahmin etmez.** Sonuç ekranı uygulanan kuralı ve kanun maddesini yazar; bayram günleri girilmemişse veya son gün arefeye denk geliyorsa kırmızı uyarı gösterir. "Kesin süreyi avukat kontrol eder" notu kalır.
2. **Avukat–müvekkil gizliliği (Av. K. m.36):** Dosya notu ve iç yazışma portala hiç gitmez (sunucu kuralı `notes`, `internal` alanlarını siler); yeni iç alanlar yalnızca bu adlarla veya portala açılmayan ayrı koleksiyonlarda tutulur (görevler, tahsilatlar).
3. **Portal girişi tahmin edilemez kodla:** Her müvekkile rastgele 6 karakterlik kod üretilir; eski formül kodları devre dışı kalır.
4. **Sahte başarı yok:** SMS/WhatsApp/e-SMM simülasyondaysa ekranda "TEST — gönderilmedi" görünür; gönderilmeyen şey "gönderildi" diye yazılmaz.
5. **Silme izi:** Dosyası olan müvekkil silinemez; masraf/tahsilat silinince işlem geçmişine düşer.

---

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H9; süre kurallarının otomatik testi |
| **2 — Beklenenler** | Görevler; vekaletname takibi; aylık takvim; duruşma çakışma uyarısı; danışmanlık → dava dönüştürme; müvekkil ekstresi (yazdır); zaman kaydından ücret dökümü; raporlar (avukat, tahsilat, alacak); yaklaşan duruşma hatırlatma listesi (toplu SMS) |
| **3 — Fark yaratanlar** | Çıkar çatışması kontrolü; süre sonucunda "neden bu tarih" açıklaması; dosya safahat zaman çizelgesi; portal tarafında okunmamış yanıt göstergesi |

## 6. Karar / hesap gerektirenler
- **UYAP:** resmî entegrasyon dokümanı (Adalet Bakanlığı Bilgi İşlem). Gelene kadar elle giriş.
- **Bayram günleri:** her yıl Ayarlar'dan girilmeli (Diyanet resmî takvimi).
- **e-SMM:** entegratör hesabı (Paraşüt) + stopaj düzeltmesi (çekirdek Ç1).
- **AAÜT / icra faiz hesabı:** resmî tarife ve oran kaynağı seçilince eklenebilir; şimdilik yok.
