# E-ticaret — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için dalgaları önceden onayladı ("atlama yok"). **1. dalga tamamlandı.** 2. ve 3. dalga sırada.

Tarih: 29.10.2026 · Dal: `claude/urun-eticaret-uretim-38c2a2` · Yöntem: `CLAUDE.md` §2 · Program: `apps/eticaret` (yönetim paneli `index.html`, vitrin `magaza.html`, pazaryeri merkezi `pazaryeri.js`)

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Sahte takip numarası | Alan boş ve zorunlu; kargo API'si simülasyondaysa gönderi oluşturulmuş sayılmaz; takip no olmadan etiket basılmaz | Tarayıcı |
| H2 | Simülasyonda sahte başarı | Sipariş uydurulmuyor; ürün gönderimi ve stok senkronu durum değiştirmiyor, yalnızca eksikleri işaretliyor; soru yanıtı taslak kalıyor; SMS sonucu gerçek durumuyla yazılıyor; günlükte "TEST" | Tarayıcı: çekmeden önce/sonra 184 sipariş; listeleme sayıları değişmedi |
| H3 | Vitrinde ödeme | Kart seçeneği "TEST", sipariş `payTest` ile "TEST — ödeme alınmadı"; havale "Ödeme bekleniyor" → "Ödeme alındı" düğmesi; ödemesiz sipariş hazırlanırken onay sorulur; kapıda ödeme teslimde alınmış sayılır; eski kayıtlar ödenmiş sayılır | Kod + tarayıcı |
| H4 | e-Arşiv faturası | `NS.ebelge.create()`; ürün KDV oranı (ürün kartı / mağaza varsayılanı); kupon kalemlere dağıtılıyor, kargo ve kapıda ödeme bedeli ayrı kalem; kurumsal fatura istenmişse VKN ile; simülasyon "TEST — gönderilmedi"; Trendyol'a ürün KDV'si gidiyor | Tarayıcı: indirimli + kargolu + kapıda ödemeli siparişte fatura 1.158,29 ₺ = sipariş 1.158,29 ₺ |
| H5 | Hakediş | "Ödendi" yalnızca Trendyol hakediş kaydı (canlı, "Hakedişleri çek") veya elle "Ödendi" işaretiyle; vade geçince "Vade geçti — ödemeyi kontrol edin" | Tarayıcı |
| H6 | Pazaryeri API uyumu | Trendyol ürün oluşturma `/v2/products`, şemadışı alanlar çıkarıldı, liste fiyatı ≥ satış fiyatı, en çok 8 görsel; takip no bildirme çağrısı kapatıldı (kullanıcıya panelden girmesi söyleniyor); hakediş 15 gün sınırı; "tedarik edilemedi" işlemi eklendi; Hepsiburada canlı seçilemez ("API doğrulanamadı"); n11 canlı seçilebilir | `server/test/kanal.test.js` 12/12; resmî doküman §6 |
| H7 | Barkod / SKU | Varyant başına stok kodu ve barkod alanı; tüm ürünlerde benzersizlik denetimi; SKU üründen türetiliyor | Kod |
| H8 | Eşleşmeyen ürünler | "Eşleşmeyen Ürünler" sayfası (menü rozeti); eşleştirme stoğu düşüyor ve kodu varyanta bağlıyor; aynı kod sonraki siparişte otomatik tanınıyor; eşleşmeyen sipariş hazırlanamıyor | Tarayıcı: 2. siparişte otomatik eşleşme, stok 4 → 3 |
| H9 | Kısmi iade | Ürün/adet seçimi, iade tutarı, "stoğa ekle" seçeneği; tümü dönünce "İade edildi", değilse "Kısmi iade"; panelden elle iade kaydı; raporlarda net ciro | Tarayıcı: 3 üründen 1'i iade → 333,33 ₺, stok +1 |
| H10 | Telefon, rapor, performans | Telefonda sipariş kart listesi; rapor dönemi (bu ay, geçen ay, 30/90 gün, bu yıl, tümü, aralık); 45 günlük satış tek geçişte; Türkçe yüzde biçimi; durum değişiklikleri kim/ne zaman kaydıyla "İşlem geçmişi"nde | 375 px tarayıcı |

**Kalite kapısı:** `npm test` → 6 test dosyası geçti (kanal, proto, takvim, UBL-TR, **XSD (.NET ile çalıştı)**, muhasebe); `cloud.test.js` bu daldan önce de başarısız (`'talep' == 'deneme'`, `CEKIRDEK-ISTEKLERI-eticaret-uretim.md` Ç5). 17 ekran konsol hatasız. `sw.js` sürümü çekirdek isteği (Ç1).

---

## 1. Kaynaklar

**Rakiplerin herkese açık sayfaları** (29.10.2026'da okundu; yalnızca hangi ihtiyacı karşıladıklarına bakıldı, metin, tasarım ya da kod alınmadı):

| Kısaltma | Ürün | Sayfalar |
|---|---|---|
| **T** | Ticimax | `ticimax.com/ozellikler/`, `ticimax.com/yurtici-kargo-entegrasyonu-/` (sipariş takibi/raporlama; Yurtiçi'nde takip numarası elle giriliyor) |
| **I** | IdeaSoft | `ideasoft.com.tr/eticaret-cozum-merkezi/kargo-ve-lojistik-entegrasyonlari/`, `ideasoft.com.tr/urun-siparis-yonetimi/` (siparişi kargo firmasına aktarma, durum güncelleyip müşteriyi bilgilendirme) |
| **K** | ikas | `ikas.com/tr/blog/sikayetvar-musteri-memnuniyeti-yarismasinda-birinciyiz` (yalnızca kurum açıklaması; özellik sayfası bu turda okunamadı → karşılaştırmaya girmedi) |
| **B** | BirFatura (e-ticaret operasyon) | `birfatura.com/ozellikler/`, `birfatura.com/ticimax-entegrasyonu/` (sipariş → fatura → kargo tek ekranda) |

**Kullanıcı şikâyetleri** (Şikâyetvar, 29.10.2026, ilk sayfa başlıkları):
- `sikayetvar.com/ideasoft`: kargoya verilip takip numarası girilen siparişler kendiliğinden "onaylandı" durumuna dönüyor; vaat edilen kurulum/entegrasyon özellikleri eksik.
- `sikayetvar.com/sopyo`: Çiçeksepeti siparişlerinde hatalı kargo kodları; fiyat ve stok hataları.
- Sektör genel (DHA haberleri, Şikâyetvar verisi): stok gerekçesiyle iptaller, yanlış ürün gönderimi, teslimat gecikmesi en sık konular.

**Bizim durumumuz:** 15 ekran tarayıcıda gezildi (konsol hatası yok), sipariş listesi 375 px'te denendi, kod satır satır incelendi. Pazaryeri API'leri resmî dokümanla yeniden doğrulandı (§6).

---

## 2. Bulunan hatalar ve riskler (hepsi 1. dalgada)

| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte takip numarası:** "Kargoya ver" penceresi takip numarası alanına rastgele 9 haneli sayı yazıyor; etikete bu sayının barkodu basılıyor, müşteriye SMS'le gidiyor. | Kod (`ship()`) | Müşteri geçersiz numarayla takip eder; kargo firması etiketi okutamaz. |
| H2 | **Simülasyonda sahte başarı:** (a) "Pazaryeri siparişlerini çek" simülasyonda **uydurma sipariş oluşturup stoğu düşüyor**; (b) ürün gönderiminde ürünler "Onay bekliyor", stok senkronunda "Yayında" oluyor; (c) soru yanıtı "pazaryerine gönderildi" diyor; (d) her kargolamada "müşteriye SMS gönderildi" yazıyor (SMS tanımlı olmasa da); (e) "varyant pazaryerine iletildi". | Kod | `CLAUDE.md` §1 ihlali. Kullanıcı yayında sandığı ürünü satamaz, olmayan siparişi paketler. |
| H3 | **Vitrinde ödeme alınmadan "Kredi kartı" siparişi:** Ödeme sağlayıcısı bağlı değilken kart numarası formu kabul ediliyor, sipariş "Kredi kartı" ödemeli olarak düşüyor. | Kod (`magaza.html`) | Para tahsil edilmemiş sipariş ödenmiş gibi kargolanır. |
| H4 | **e-Arşiv faturası siparişle tutmuyor:** KDV hep %20 (giyimde %10 olabilir), kupon indirimi ve kapıda ödeme bedeli faturaya girmiyor; kurumsal fatura bilgisi (VKN) kullanılmıyor; eski `sendEInvoice` yolu kullanılıyor (`NS.ebelge.create` değil), simülasyon sonucu siparişe kalıcı fatura no olarak yazılıyor. Pazaryerine ürün gönderiminde KDV %10 sabit. | Kod | Fatura toplamı ≠ tahsilat; resmî belgede hata. |
| H5 | **Hakediş "Ödendi" tahmini:** Teslim + vade günü geçince sipariş "Ödendi" görünüyor; ödeme hiçbir yerden doğrulanmıyor. | Kod (`settle()`) | Ödenmemiş hakediş fark edilmez. |
| H6 | **Pazaryeri API uyumu** (§6): Trendyol ürün oluşturma yolu eski (`/products` → `/v2/products`), gövdede şemada olmayan alanlar var; takip no bildirme servisi resmî dokümanda yok; hakediş sorgusu 15 günü aşabiliyor. Hepsiburada dokümanı doğrulanamadı ama canlı mod seçilebiliyor. n11 adaptörü doğrulandı ama panelde canlı seçilemiyor. | Resmî doküman | Canlıda hata veya doğrulanmamış servise veri gönderimi. |
| H7 | **Varyant barkodu yok, SKU çakışabilir:** Barkod girilemiyor (pazaryeri barkod ister, yerine SKU gidiyor); yeni ürün SKU'su zaman damgasının son 3 hanesinden üretiliyor, benzersizlik denetimi yok. | Kod | Pazaryerinde yanlış varyanta stok yazılır. |
| H8 | **Eşleşmeyen pazaryeri ürünleri görünmüyor:** Barkodu bulunamayan kalemli sipariş `unmatched` işaretleniyor ama bunu gösteren/düzelten ekran yok; stok düşmüyor. | Kod | Satılan ürün stokta görünmeye devam eder → fazla satış. |
| H9 | **Kısmi iade yok:** İade onayı tüm siparişi "iade" yapıp tüm kalemleri stoğa ekliyor; iade edilen tutar kaydı yok. | Kod | 3 üründen 1'i iade edilince stok ve ciro yanlış. |
| H10 | **Telefon ve rapor:** Sipariş listesi telefonda yatay kayıyor (tutar görünmüyor); raporlarda dönem seçimi yok; "Satış (45 gün)" sütunu tüm zamanları sayıyor ve her satırda tüm siparişleri tarıyor; dönüşüm oranı "%0.34" (Türkçe ondalık virgül olmalı). | Tarayıcı + kod | Telefondan sipariş yönetimi zor; rapor yanıltıcı; büyük veride yavaş. |

---

## 3. Özellik karşılaştırması

**Bizde:** ✅ var · 🟡 kısmen · ❌ yok · **Sınıf:** **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan

### Sipariş ve sevkiyat
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Sipariş durum akışı, paket fişi, kargo etiketi, iptal + stok iadesi | ✅ | T I B | O |
| Doğru takip no / kargo etiketi (H1) | ❌ | T I | O |
| Kısmi iade, iade tutarı (H9) | ❌ | — | O |
| Çoklu seçimle toplu işlem (hazırlanıyor, paket fişi, etiket) | ❌ | B | E |
| Toplama listesi (aynı ürünler birleşik) | ❌ (Pazaryeri programında var) | — | E |
| Telefon/WhatsApp/Instagram siparişini elle girme | ❌ | T | E |
| Sipariş notu, iç etiket, işlem geçmişi | 🟡 (yalnızca müşteri notu) | T | E |
| Kargoya verme süresi uyarısı (geciken sipariş) | ❌ | — | E |
| Barkod okutarak paket doğrulama (yanlış ürün göndermeyi önler) | ❌ | — | F (şikâyet: yanlış ürün) |

### Ürün ve stok
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Renk/beden varyant matrisi, kategori, indirimli fiyat | ✅ | T I | O |
| Varyant barkodu, benzersiz SKU (H7) | ❌ | T I | O |
| Ürün KDV oranı | ❌ (H4) | T I | O |
| Excel'den toplu ürün/stok aktarımı | ❌ | T I | E |
| Ürün fotoğrafı yükleme | ❌ (demo görselleri sabit) | T I | E |
| Kritik stok uyarısı + "kaç günde biter" | 🟡 (yalnızca tükenen) | — | E |
| Ürün bazında net kâr (maliyet + komisyon + kargo) | ❌ | — | F |

### Pazaryeri (bu programın içindeki merkez)
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Kanal bağlantısı, stok/fiyat senkronu, kategori eşleştirme, hakediş, sorular | ✅ | Sentos, Dopigo | O |
| Eşleşmeyen ürünleri gösterme ve eşleştirme (H8) | ❌ | — | O |
| Simülasyonun açıkça TEST görünmesi (H2) | ❌ | — | O |
| Pazaryeri iade (claim) çekme | ❌ | — | E |

### Vitrin, müşteri, pazarlama
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Vitrin, sepet, kupon, kapıda ödeme, havale, sözleşme onayı, sipariş takibi, iade talebi | ✅ | T I | O |
| Gerçek ödeme veya açık "ödeme alınmadı" durumu (H3) | ❌ | T I | O |
| Terk edilen sepet hatırlatma (WhatsApp) | ✅ | T | E |
| Kupon son kullanma tarihi ve kullanım sınırı | ❌ | T I | E |
| Müşteri segmenti (sadık, kaybedilmek üzere) | ❌ | — | F |

### Raporlar
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Ciro, kategori, şehir, ödeme yöntemi | ✅ | T | O |
| Dönem seçimi (H10) | ❌ | T | O |
| Kanal bazında net kâr | ❌ | — | F |

---

## 4. Şikâyetlerden çıkan "güven" kuralları
1. **Durum geri kaymaz:** kargoya verilmiş sipariş hiçbir otomatik işlemle önceki duruma dönmez (IdeaSoft şikâyeti). Her durum değişikliği kim/ne zaman kaydıyla tutulur.
2. **Uydurma veri yok:** takip no, sipariş, fatura no, ödeme yalnızca gerçek kaynaktan gelir; simülasyon her yerde "TEST" yazar ve kalıcı kayıt bırakmaz.
3. **Fazla satış olmaz:** pazaryeri siparişindeki her kalem bir varyanta eşlenir; eşlenemeyen kalem kırmızı uyarı olarak kalır.
4. **Fatura = tahsilat:** fatura toplamı sipariş toplamıyla kuruşu kuruşuna aynıdır (indirim, kargo, kapıda ödeme dahil).

---

## 5. Dalga planı

| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | H1–H10 |
| **2 — Beklenenler** | Toplu işlem (durum, paket fişi, etiket), toplama listesi, elle sipariş girme, sipariş iç notu ve işlem geçmişi, geciken sipariş uyarısı, kupon son tarih/kullanım sınırı, Excel'den ürün/stok aktarımı, kritik stok + "kaç günde biter" |
| **3 — Fark yaratanlar** | Barkodla paket doğrulama, ürün/kanal bazında net kâr (maliyet alanı), müşteri segmentleri, pazaryeri iade (Trendyol claims) çekme |

---

## 6. Entegrasyon doğrulaması (29.10.2026, `CLAUDE.md` §1)

| Servis | Durum | Kaynak |
|---|---|---|
| Trendyol sipariş paketleri `GET /integration/order/sellers/{id}/orders` (size ≤200) | DOĞRULANDI | developers.trendyol.com/reference/getshipmentpackages |
| Trendyol paket durumu `PUT …/shipment-packages/{id}` (Picking/Invoiced) | DOĞRULANDI | …/reference/updatepackagestatus |
| Trendyol stok-fiyat `POST /integration/inventory/sellers/{id}/products/price-and-inventory` (≤1000, aynı istek 15 dk tekrarlanamaz) | DOĞRULANDI | …/reference/updatepriceandinventory |
| Trendyol ürün oluşturma | **UYUMSUZ → düzeltildi:** yol `/integration/product/sellers/{id}/v2/products`; `currencyType`, `cargoCompanyId` şemada yok | …/reference/createproducts |
| Trendyol batch sonucu, kategori ağacı, soru-cevap (yanıt 10–2000 karakter), hakediş (≤15 gün, size 500/1000), iadeler `/claims` | DOĞRULANDI | …/reference/getbatchrequestresult, getcategorytree, getquestionfilter, answerquestion, getsettlements, getclaims |
| Trendyol takip no bildirme `…/update-tracking-number` | **DOĞRULANAMADI** (resmî dizinde sayfa yok) → çağrı kapatıldı | developers.trendyol.com/llms.txt |
| Hepsiburada (kimlik, listeleme, envanter, sipariş) | **DOĞRULANAMADI** (developers.hepsiburada.com HTTP 403) → canlı mod seçilemez | — |
| n11 sipariş paketleri, fiyat-stok, görev sonucu, ürün sorgu | DOĞRULANDI → canlı mod açıldı | developer.n11.com/documentation/… (siparis-listeleme-servisi, urun-fiyat-stok-guncelleme, task-detail-sorgulama, satici-urun-sorgulama) |

**Dokümanla uyum ≠ canlı test:** Trendyol ve n11 canlıya çıkmadan satıcının test (stage) hesabıyla denenmelidir.

---

## 7. Karar / hesap gerektirenler
- **Ödeme sağlayıcısı (iyzico / PayTR vb.):** vitrinde kartla ödeme için sanal POS hesabı ve sağlayıcının resmî dokümanı. O zamana kadar kart seçeneği "TEST — ödeme alınmaz" olarak görünür.
- **Hepsiburada:** geliştirici portalına erişimi olan satıcı hesabı (doküman 403) — doğrulanınca canlı mod açılır.
- **Trendyol / n11 test hesabı:** canlı deneme için.
- **Kargo firması gönderi oluşturma API'si:** sözleşme ve test hesabı (Kargo programı spesifikasyonuna bakın).
