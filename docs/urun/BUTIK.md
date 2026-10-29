# Butik & Giyim — Ürün Spesifikasyonu

Program: `apps/butik/` · Dal: `claude/urun-perakende-f86f58` · Tarih: 29.10.2026
Yöntem: `CLAUDE.md` §2. Kullanıcı tüm dalgaları önceden onayladı ("atlama yok").

## 0. Yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| E1 | Ürün etiketi | "Etiket Basımı" sayfası: kendi şablonun (askı 40×60, barkod 50×30, indirim 60×40, mini 30×20 hazır), beden, renk, indirimli + eski fiyat, barkod, logo; tek tek, beden/renk matrisiyle, "stok kadar", barkod okuyucu veya kamerayla seçim; A4 ya da etiket yazıcısı (sürücüyle, şablon ölçüsünde); "fiyatı değişenler" filtresi | Commit `c6d95aa`, tarayıcı (masaüstü + 375 px) |

### 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| H1, H12 | Çift iade | İade/değişim satır ve adet bazında sayılıyor; kalan adet kadar işlem yapılabiliyor, dolan satırda düğmeler kalkıyor ("İade/değişim yapıldı"). Çok adetli satırda adet soruluyor | Tarayıcı: F5010 ikinci kez iade edilemedi |
| H2 | Süre kuralı | Süresi geçmiş fişte yönetici onayı: yönetici oturumdaysa onay, değilse yönetici PIN'i; onay işlem geçmişine yazılıyor | Tarayıcı (58 gün geçmiş fiş) |
| H3 | Puan | Satışta kazanılan puan fişe yazılıyor; iadede bu üründen kazanılan puan geri alınıyor; "puan olarak iade" seçeneği; puanla ödenmiş eski satışlarda geri alma yok | Kod + tarayıcı |
| H4 | SMS | Sağlayıcı bağlı değilse "gönderilmedi, TEST olarak kaydedildi"; bağlıysa sağlayıcı sonucu beklenip gösteriliyor | Kod |
| H5 | Bilgi fişi | Satış ve değişim fişinde "BİLGİ FİŞİDİR — MALİ DEĞERİ YOKTUR"; parçalı ödemeler ve kazanılan puan fişte | Tarayıcı (fiş metni) |
| H6 | 10 gün kuralı | Model başına fiyat geçmişi (fiyat/indirim değişince); eski fiyat = liste fiyatı ile indirimden önceki 10 günün en düşüğünden küçük olanı; indirimli fiyat 10 gün içinde zaten uygulandıysa eski fiyat hiç gösterilmiyor (etiket, kasa, ürün listesi); kampanya ve model kaydında uyarı | Tarayıcı: kampanya kapat/aç → "indirim gösterilemez" |
| H7 | Kampanya | Kampanya modelin kendi indirimini saklıyor, kapanınca geri yüklüyor | Tarayıcı |
| H8 | Kampanya formu | Tek "Kapsam" listesi ("Sezon: …" / "Kategori: …"); oran 1–90 kontrolü | Tarayıcı |
| H9 | Eksi stok | Stok eksiye düşebiliyor, matriste kırmızı; online kanala 0 gönderiliyor | Kod |
| H10 | Demo tarihleri | Demo iadeleri satıştan sonra ve bugünden önce | Kod |
| H11 | Fiş no | En büyük numara + 1 | Tarayıcı (F5468) |
| + | Parçalı ödeme | Nakit + kart + havale + puan; toplam eşit olmadan tamamlanmıyor, kalan/fazla canlı gösteriliyor | Tarayıcı |
| + | Mal kabul | Ürünler > "Mal kabul": model, tedarikçi, irsaliye no, alış fiyatı, beden × renk adetleri → stok + hareket; isteğe bağlı gelen adet kadar etiket | Tarayıcı (5 adet → etiket sayfası) |
| + | Stok hareketleri | Satış, iade, değişim, sayım, mal kabul kaydı; model stok penceresinde "Hareketler" | Tarayıcı |
| + | Sepet korunuyor | Kasadan başka sayfaya geçip dönünce sepet kaybolmuyor | Tarayıcı |
| + | Büyük veri | 3.016 modelde ürün listesi 2,2 sn → 40 ms (satış adetleri bir kez hesaplanıyor, ilk 200 satır); ölü stok raporu ilk 100 | Tarayıcı ölçümü |

Kalite kapısı: `npm test` — 6 test dosyası geçti (XSD: 9 belge uygun); `cloud.test.js` temel committe de aynı hatayla düşüyor
(bizden bağımsız, `CEKIRDEK-ISTEKLERI-perakende.md`). Konsol hatası yok. 375 px'te yatay taşma yok. Koyu tema yalnızca çekirdek
sınıflarıyla (ayrı denenmedi; etiket önizlemesi bilerek beyaz kâğıt). `sw.js` sürümü kök dosya olduğu için artırılmadı (Ç8).

Neden yoktu: butik çekirdekteki etiket tasarımcısını (`NS.labels`) hiç kullanmıyordu, sabit bir HTML basıyordu; ayrıca
`core/integrations.js` → `USED.butik` listesinde etiket yazıcısı olmadığı için Entegrasyonlar sayfasında görünmüyordu
(çekirdek isteği Ç7, `CEKIRDEK-ISTEKLERI-perakende.md`).

---

## 1. Kaynaklar (erişim: 29.10.2026)
| Kısaltma | Ürün / kaynak | Adres |
|---|---|---|
| **N** | Nebim V3 (broşür) ve bayi sayfası | nebim.com.tr/i/assets/images/v3_brosur/Nebim_V3_BR20.pdf · paroni.com.tr/hazir_giyim/ |
| **BS** | BarkodSis giyim satış programı | barkodsis.com/giyim-satis-programi |
| **V** | VShop giyim mağazası programı | vshopplatform.com |
| **A** | Aysima POS butik programı | aysimapos.com/butik-giyim-magazasi-programi |
| **M** | Motus giyim mağazası programı | motusbulut.com/giyim-magazasi-satis-programi |
| **Ş** | Şikâyetler: Demirsoft (destek, ek ücret), A101/Migros (etiket–kasa fiyat farkı, kasa donması) | sikayetvar.com/demirsoft-yazilim · sikayetvar.com/etiket-fiyati/farkli · sikayetvar.com/migros/barkod-okuyucu |
| **RG** | Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliğinde Değişiklik (RG 01.07.2026, sayı 33297; yürürlük 01.08.2026) | resmigazete.gov.tr/eskiler/2026/07/20260701-9.htm |

Rakip ürünlerin metni, kodu veya tasarımı kopyalanmadı; yalnızca karşıladıkları ihtiyaçlar çıkarıldı. Rakip sayfaları pazarlama
metnidir; iddiaları demo ile doğrulanmadı.

**Mevzuat (DOĞRULANDI, RG 33297, m.4 → Yönetmelik m.14/3 ve 14/5):** İndirimli satışta "indirimden önceki fiyat",
indirimin başlangıcından önceki **son 10 gün** içinde uygulanan en düşük fiyattır; farklı kanallarda (mağaza / online) referans
fiyat yalnızca indirimin yapıldığı kanaldan alınır. Not: sayfa metni bozuk Türkçe karakterle alındı, harfler bağlamdan
düzeltildi; birebir alıntı için RG PDF'i ile karşılaştırılmalı. Konsolide metin (mevzuat.gov.tr) açılamadı.

---

## 2. Bulunan hatalar ve riskler (1. dalgada düzeltilecek)
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Aynı satır sınırsız iade edilebiliyor.** F5010 (949 ₺, tek ürün) iki kez iade edildi: 1.898 ₺ iade, stok 2 arttı. Değişimde de aynı. | Tarayıcı | Kasa açığı, sahte stok. |
| H2 | **Değişim süresi geçmiş fişte uyarısız iade/değişim.** 57 gün geçmiş fişte rozet görünüyor ama işlem engellenmiyor, onay sorulmuyor. | Tarayıcı | Mağaza kuralı uygulanamıyor. |
| H3 | **İadede kazanılmış puan geri alınmıyor;** puanla ödenen satış iadesinde puan iade edilmiyor. | Kod (`exchangePage`) | Müşteri iade edilen alışverişin puanını kullanır. |
| H4 | **SMS "gönderildi" diyor ama gönderilmemiş olabilir:** sağlayıcı bağlı değilse kayıt "simülasyon" olur, ekranda yine "SMS gönderildi" yazar. | Kod (`customersPage` → `NS.smsLog`) | Sahte başarı (CLAUDE.md §1). |
| H5 | **Satış fişi mali fiş değil ama öyle görünüyor;** ÖKC (yazarkasa POS) bağlantısı yok. | Kod | Kullanıcı yasal fiş kestiğini sanabilir. Fişe "Bilgi fişidir, mali değeri yoktur" yazılmalı. ÖKC entegrasyonu sağlayıcı hesabı gerektirir (§6). |
| H6 | **İndirim, son 10 günün en düşük fiyatına göre kontrol edilmiyor;** fiyat geçmişi tutulmuyor. Etikette ve kasada "eski fiyat" doğrudan liste fiyatı. | Kod + RG | Yönetmeliğe aykırı indirim gösterimi riski (para cezası). |
| H7 | **Kampanya kapatılınca modelin kendi indirimi de sıfırlanıyor** (kampanya `disc`'i doğrudan yazıp siliyor). | Kod (`campaignsPage.apply`) | Elle verilen indirim kaybolur. |
| H8 | **Kampanya formunda "sezon / kategori" listesi kapsamdan bağımsız** — "Kategori" seçip sezon adı seçilebiliyor, sonuç 0 model. | Kod | Kafa karıştırıcı, sessiz başarısızlık. |
| H9 | **Stok eksiye düşmüyor** (`Math.max(0, …)`): stokta görünmeyen ürün satılınca fark kayboluyor. | Kod | Sayım farkı izlenemez. |
| H10 | **Demo verisinde ileri tarihli iadeler** (satış + 1–6 gün, bugünü geçebiliyor). | Tarayıcı (01.11.2026 tarihli iade) | Raporlar yanıltıcı. |
| H11 | **Satış no sayıdan türüyor** (`5000 + adet`): kayıt silinirse/eşzamanlı cihazda aynı numara tekrar verilir. | Kod | Değişimde yanlış fiş bulunur. |
| H12 | **Çok adetli satırda iade yalnızca 1 adet ve adet seçilemiyor.** | Kod | İki adet alınmış ürünün ikisi iade edilemez (H1 ile birlikte düzelir). |

---

## 3. Özellik karşılaştırması
Sınıf: **O** olmazsa olmaz · **E** beklenen · **F** fark yaratan.

### Satış (kasa)
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Barkodla satış, beden/renk matrisinden seçim, müşteri, ek indirim, 2. ürün kampanyası | ✅ | BS A M | O |
| **Parçalı ödeme** (nakit + kart + puan + hediye çeki) | ❌ | — (aramada bulunamadı) | O |
| Satışı beklet / geri çağır (müşteri deneme kabininde) | ❌ | — | E |
| Satış danışmanı seçimi ve prim raporu | ❌ | — | E |
| Bilgi fişi / mali fiş ayrımı (H5), ÖKC bağlantısı | ❌ | V ("kasa/POS entegrasyonu") | O (ÖKC sağlayıcı ister) |
| Telefonda kasa (375 px) | 🟡 denenecek | — | E |

### Değişim / iade
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Fiş barkoduyla değişim (aynı model başka beden/renk) | ✅ | A V | O |
| İade/değişim miktar kontrolü (H1, H12), süre kuralı ve yönetici onayı (H2) | ❌ | — | O |
| Başka modelle değişim + fiyat farkı tahsili/iadesi | ❌ | — | E |
| **İade çeki / hediye çeki** (kodlu, bakiyeli, kasada kullanılır) | ❌ | V ("iade, değişim ve hediye çeki") | E |
| İadede puan düzeltmesi (H3) | ❌ | — | O |

### Ürün ve stok
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Model + beden × renk matrisi, varyant başına barkod, sayım | ✅ | N BS A M | O |
| Etiket tasarımı ve basımı | ✅ (E1) | BS ("barkod etiket sihirbazı") | O |
| **Mal kabul** (tedarikçiden gelen ürünü matrise adetle gir → stok + etiket) | ❌ | N | O |
| Model pasife alma / silme | ❌ | — | E |
| Excel'den model/varyant aktarımı | ❌ | — | E (geçiş için) |
| Ölü stok, azalan beden | ✅ | A ("atıl stok analizi") | E |
| Stok hareket geçmişi (satış, iade, sayım, mal kabul) | ❌ | A ("stok hareketi bağımsız izlenir") | E |

### Fiyat ve kampanya
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Sezon/kategori yüzde indirimi, 2. üründe indirim | ✅ (H7, H8 kusurlu) | — | O |
| **Fiyat geçmişi ve 10 gün kuralı kontrolü** (H6) | ❌ | — | O (mevzuat) |
| Etiket–kasa fiyat tutarlılığı: fiyat değişince "etiketi yenile" listesi | ✅ (E1) | Ş (en sık şikâyet) | O |
| Kampanya başlangıç/bitiş tarihi | ❌ | — | E |

### Müşteri
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Puan, beden, doğum günü, KVKK izni, SMS | ✅ (H4) | BS ("sadakat puanları") | O |
| Müşteri kartında alışveriş geçmişi | ❌ | — | E |
| **"Bedeni gelince haber ver"** talep listesi → mal kabulde eşleşen müşterilere tek tıkla bildirim | ❌ | — | F |
| Müşteri bedenine göre öneri (kasada ve mal kabulde) | ❌ | — | F |

### Raporlar
| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Ciro, kâr, en çok satan, beden/renk/kategori dağılımı, ölü stok | ✅ (sabit 30 gün) | A | O |
| Tarih aralığı | ❌ | — | E |
| Gün sonu kasa raporu (ödeme türüne göre, iade dahil) | ❌ | — | E |
| Satış–stok oranı (sell-through) model/beden bazında | ❌ | — | F |

---

## 4. Şikâyetlerden çıkan güven kuralları
1. **Etiketteki fiyat = kasadaki fiyat.** Fiyat/indirim değişen model etiket sayfasında "Fiyat değişti" olarak listelenir (yapıldı). Kasada etiketi yenilenmemiş modelde uyarı gösterilecek.
2. **İndirim gerçek olmalı.** Eski fiyat, son 10 günün en düşük fiyatından yüksekse etikete basılmadan önce uyarılır (H6).
3. **Sessiz/sahte başarı yok.** SMS, ÖKC, pazaryeri: gönderilmeyen şey "gönderildi" görünmez (H4).
4. **Para kaçağı kapısı yok.** İade miktarı satılandan fazla olamaz, süresi geçmişte yönetici onayı gerekir (H1, H2).
5. **Kasa donmaz.** Büyük veride (binlerce model) arama ve listeler akıcı kalır; etiket listesi ilk 150 model ile sınırlandı.

---

## 5. Dalga planı (önceden onaylandı)
| Dalga | İçerik |
|---|---|
| **1 — Kırık ve temel** | H1–H12; parçalı ödeme; bilgi fişi ibaresi; mal kabul (matrisle adet + otomatik etiket); stok hareket geçmişi |
| **2 — Beklenenler** | İade/hediye çeki; başka modelle değişim + fark; satışı beklet; satış danışmanı + prim raporu; müşteri geçmişi; model pasife alma; kampanya tarihleri; rapor tarih aralığı + gün sonu kasa raporu; Excel'den model aktarımı |
| **3 — Fark yaratanlar** | "Bedeni gelince haber ver" listesi + mal kabulde bildirim; bedene göre öneri; sell-through raporu; kasada "etiketi eski" uyarısı |

---

## 6. Sağlayıcı / karar gerektirenler
- **ÖKC (yeni nesil yazarkasa POS):** marka/model ve üreticinin resmî entegrasyon dokümanı + test cihazı. O gelene kadar butik fişi "bilgi fişi"dir. → **CANLIYA ÇIKMAYI ENGELLER** (mali fiş zorunluluğu olan işletmede).
- **SMS sağlayıcısı:** hesap (Entegrasyonlar > SMS). Bağlı değilse gönderim "TEST" görünür.
- **Pazaryeri stok gönderimi:** `NS.integ.call('pazaryeri', …)` çekirdekte; doğrulama durumu çekirdek raporunda.
- **Puan değeri:** 1 puan = 1 ₺ ve %3 kazanım varsayılanı; işletme kararı (ayarlardan değişir).
