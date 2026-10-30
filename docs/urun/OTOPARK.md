# Otopark & Oto Yıkama — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini ve ek özellikleri önceden onayladı. Dalgalar sırayla uygulanıyor; sonuç §0'da.

Tarih: 29.10.2026 · Dal: `claude/urun-servis-arac-a1f676` · Yöntem: `CLAUDE.md` §2 · Program: `apps/oto/` (panel + `arac.html` müşteri sayfası)

## 0. Uygulama durumu
| Dalga | Durum |
|---|---|
| 1 — Temel ve güven (H1–H7) | **tamamlandı** — müşteri sayfasındaki kart formu ve sahte ön ödeme kaldırıldı; kamera simülasyonu plaka uydurmuyor (TEST uyarısı); indirim önce otoparktan sonra yıkamadan düşüyor ve kasada görünüyor; bitmemiş yıkamada çıkış uyarısı; abonelik tahsilatı (yeni + uzatma) kasada ve gün sonunda; yıkama iptali abonelik hakkını geri veriyor; otoparksız yıkamada kart cihazı ve mali fiş. Kanıt: başsız Chrome akış denemesi + tur, konsol hatası yok |
| 2 — Beklenenler | **tamamlandı** — kayıp fiş ücreti (ayar; girişte, fişte ve gişede yazar; çıkışta işaretlenir), 24 saat+ içeride kalan araç rozeti ve özet uyarısı, aboneliklerde "7 gün içinde bitecek" filtresi + bitiş hatırlatması (SMS sonucu bekleniyor, olmazsa WhatsApp), abone tahsilat geçmişi |
| 3 — Fark yaratanlar | **tamamlandı** — girişte isteğe bağlı telefon → yıkama bitince "aracınız hazır" bildirimi; Özet'te yıkamacı performansı (iş, ciro, ort. yıkama süresi) |

---

## 1. Kaynaklar
Pazar araştırması 29.10.2026. Türk otopark yazılımlarının kendi sayfalarına arama aracıyla ulaşılamadı; bulunanlar:

| Kısaltma | Kaynak | Öne çıkan |
|---|---|---|
| **V** | Vottopark tanıtım videosu (arama özeti; reklam içeriği) | SMS, plaka okuma, fiş yazdırma, araç çağırma (vale), sınırsız tarife, ayrıntılı kayıt, yetkilendirme |
| **BB** | Bursa BURBAK otopark uygulaması (haber: memurlar.net/haber/812124/otopark-ucretini-plaka-odeyecek.html) | Plaka tanıma ile giriş/çıkış, kartla ödeme, e-Arşiv/e-Fatura |
| **OP** | OtoparkPro (capterra.co.uk/software/1237261/OtoparkPro) | Liste kaydı; ayrıntı okunamadı |
| **AVM** | AVM otoparklarında plaka tanıma zorunluluğu haberi (karar.com/avmlerdeki-otoparklara-giren-ve-cikan-araclara-plaka-tanima-sistemi-355203) | Plaka verisinin kolluğa açılması — mevzuat metni okunamadı → **DOĞRULANAMADI** |

**Şikâyetler:** Şikâyetvar'da otopark *yazılımı* şikâyeti bulunamadı. Otopark işletmesi şikâyet temaları (arama özetleri): "fazla ücret / tarife görünmüyor", "kayıp fişte yüksek ceza", "araca hasar, kayıt yok". §4'e dönüştürüldü.

**Bizim durumumuz:** 11 menü sayfası başsız Chrome ile masaüstü, 375 px ve koyu temada gezildi; kod ve `arac.html` incelendi.

---

## 2. Bulunan hatalar ve riskler
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Müşteri sayfası kart bilgisi istiyor, ödeme almadan "Ödendi, 15 dk içinde ücretsiz çık" diyor** ("Demo: gerçek ödeme alınmaz"). Çıkışta ücret sıfır çıkıyor. | Kod (`arac.html`) | Para alınmadan araç ücretsiz çıkar. |
| H2 | **Plaka kamerası simülasyonda rastgele plaka uyduruyor;** abone plakası denk gelirse otomatik giriş kaydı açıp "bariyer açıldı" diyor. | Kod | Sahte giriş kaydı, doluluk ve kasa bozulur (`CLAUDE.md` §1). |
| H3 | **İndirim yanlış yere yazılıyor:** çıkıştaki indirim otopark ücretinden düşülüyor; otopark ücretinden büyükse fazlası hiçbir yere yazılmıyor, kasa raporu tahsil edilenden fazla görünüyor. | Kod (`checkout`) | Gün sonu kasası tutmaz. |
| H4 | **Bitmemiş yıkama teslim ediliyor:** çıkışta "henüz hazır değil" yazan yıkama uyarısız "teslim" yapılıp ücretlendiriliyor. | Kod | Yapılmamış iş tahsil edilir. |
| H5 | **Abonelik ücretleri kasada yok:** yeni abone ve "1 ay uzat" tahsilatı kayda geçmiyor. | Kod | Ciro ve gün sonu eksik. |
| H6 | **Yıkama iptal edilemiyor;** abonelikten düşülen yıkama hakkı geri gelmiyor. | Kod + ekran | Yanlış hak sayısı. |
| H7 | **Otoparksız yıkama tahsilatında kart cihazı ve mali fiş atlanıyor** (otoparklı çıkışta var). | Kod | Kayıt dışı satış riski. |

**Ayrıca (çekirdek/sunucu):** Müşteri sayfası araç bilgisini yalnız plakayla gösteriyor; plakayı bilen herkes aracın içeride olup olmadığını görebilir. Fişe kod basıp sorguda istemek sunucudaki herkese açık sorgu kuralının da değişmesini gerektirir → `CEKIRDEK-ISTEKLERI-servis-arac.md` Ç6.

---

## 3. Özellik karşılaştırması
| Özellik | Bizde | Sektörde | Sınıf |
|---|---|---|---|
| Plakayla giriş/çıkış, giriş fişi (barkod), doluluk | ✅ | V BB | O |
| Tarife: ilk saat, sonraki saat, günlük tavan, ücretsiz süre | ✅ | V ("sınırsız tarife") | O |
| Abonelik (aylık otopark, yıkama paketi) | ✅ (H5, H6) | V | O |
| Kart / nakit tahsilat, ÖKC mali fiş, gün sonu | ✅ (H3, H7) | BB | O |
| Plaka tanıma kamerası + bariyer | 🟡 donanım sağlayıcısı doğrulanmadı (H2) | V BB | E |
| Kayıp fiş ücreti | ❌ | şikâyet teması | E |
| Uzun süre içeride kalan araç uyarısı (24 saat+) | ❌ | — | E |
| Abonelik bitiş hatırlatması (SMS / WhatsApp) | ❌ | V (SMS) | E |
| Yıkama kuyruğu, müşteri "aracım hazır mı" sayfası | ✅ | — | F |
| "Aracınız hazır" bildirimi (girişte telefon alınırsa) | ❌ | V ("araç çağırma") | F |
| Yıkamacı performansı (iş, ciro, ort. süre) | ❌ | — | F |
| Online ön ödeme | ❌ sahte (H1) | BB | E (§6) |

## 4. Güven kuralları
1. Para alınmadan "ödendi" yazılmaz; online ödeme ancak doğrulanmış sanal POS ile.
2. Simülasyon/test cihaz verisi gerçek kayıt oluşturmaz.
3. Kasadaki her kuruş bir tahsilata karşılık gelir (indirim nereden düştüyse oraya yazılır; abonelik dahil).
4. Tarife ve kayıp fiş ücreti girişte ve müşteri sayfasında açıkça görünür.

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1** | H1–H7 |
| **2** | Kayıp fiş ücreti; 24 saat+ içeride kalan araç uyarısı; abonelik bitiş hatırlatması; abonelik tahsilat geçmişi |
| **3** | Girişte isteğe bağlı telefon → "aracınız hazır" bildirimi; yıkamacı performans raporu |

## 6. Sağlayıcı / karar gerektirenler
- **Plaka tanıma kamerası ve bariyer (Hikvision, Dahua, Nedap, röle kartı):** üretici API dokümanı ve cihazla canlı test → şu an **DOĞRULANAMADI**; bağlantı kapalıyken düğme "bağlı değil" der, simülasyon kayıt açmaz.
- **Online ön ödeme:** sanal POS hesabı.
- **AVM plaka kaydı paylaşımı:** mevzuat metninin resmî kaynaktan okunması (işletme AVM otoparkıysa).

## Modül: Oto kuaför ve vale (30.10.2026)

Varsayılan kapalı. Ayarlar > Ek modüller. Kapalıyken menü, kasa ve gün sonu tutarları değişmez; gün sonu fişinde yalnız sıfır tutarlı bir satır görünür.

**Kaynak:** İşletmeler ve İşyerlerinin Araç Park Hizmetlerinin (Vale) Yürütülmesine İlişkin Yönetmelik, RG 25.12.2020-31345, https://www.turmob.org.tr/arsiv/mbs/resmigazete/31345-31345-2.pdf, okundu 30.10.2026. Yayımlanan ilk metin okundu; sonraki değişiklikler DOĞRULANAMADI.

| Kural | Madde | Etiket | Programda |
|---|---|---|---|
| Fiş alanları: işletme, sürücü, plaka, tarih-saat, görevli adı ve telefonu, km | md. 4/a | DOĞRULANDI | Fişte zorunlu |
| İki nüsha; elektronik uygulama olabilir | md. 4/a | DOĞRULANDI | Görevli ve sürücü nüshası basılır |
| Araç iadesi fiş ile yapılır | md. 8/1 | DOĞRULANDI | Kod kontrolü, fişsiz iade yetkili onaylı |
| Kıymetli eşya uyarısı | md. 6/4 | DOĞRULANDI | Fişte |
| Vale/garaj ve üçüncü şahıs sigortası | md. 6/8 | DOĞRULANDI | Poliçe bitiş uyarısı |
| MYK Seviye 3, uygun sürücü belgesi | md. 7 | DOĞRULANDI | Görevli kartında eksik uyarısı |
| Hasar, ceza ve çekme bedelini tazmin | md. 8/4 | DOĞRULANDI | Hasar notu kaydı; hesap yok |
| Anahtar saklama, kayıt saklama süresi | yok | Metinde bulunamadı | Yazılmadı |

Rakip: Türk vale yazılımı sayfası bulunamadı. Otovınn müşteriye dönük hizmet pazarıdır, arka ofis yazılımı değildir (uygulama mağazası kaydı). Yabancı detailing yazılımları genel fikir verdi: https://urable.com/?p=1578

Şikâyetler:

| Şikâyet | Kaynak | Özellik |
|---|---|---|
| Vale sonrası hasar reddedildi | https://www.sikayetvar.com/opel/vale-hizmeti-sonrasi-aracta-olusan-hasarin-otel-tarafindan-karsilanmamasi | Fiş, km, hasar notu, iş kartında hasar krokisi |
| Otel otoparkında hasar ve ilgisizlik | https://www.sikayetvar.com/la-quinta-by-wyndham-istanbul/otel-otoparkinda-olusan-arac-hasari-ve-yetersiz-musteri-hizmeti | Teslim kaydı, kim teslim aldı |

Seramik kaplama garantisine ilişkin şikâyet kaydı bulunamadı.

| Özellik | Sınıf | Durum |
|---|---|---|
| Oto kuaför iş kartı, aşamalar, hasar krokisi | Olmazsa olmaz | Var |
| Teslim imzası, tahsilat, kasa | Olmazsa olmaz | Var |
| Vale fişi, anahtar no, iade | Olmazsa olmaz | Var |
| Görevli listesi, belge ve poliçe uyarısı | Beklenen | Var |
| Garanti bitişi, bakım hatırlatma | Beklenen | Var |
| Fotoğraflı kabul | Beklenen | Yok, `NS.dosya` izinli uygulama listesi gerekir |
| Sürücünün telefondan aracı çağırması | Fark yaratan | Yok, `public-rules.js` işi |

Özet ekranındaki "Bugünkü ciro" otopark ve yıkamayı gösterir; modül gelirleri Kasa sayfasındadır.

Deneme: `?demo=1`, modül kapalı menü, açık menü, fiş, mükerrer plaka, iade, hasar notu, iş kartı aşamaları, teslim, garanti, kasa. Konsol hatası yok. Yıkamacı rolü bu kayıtları görmez.
