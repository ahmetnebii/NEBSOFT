# Market POS — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1., 2. ve 3. dalga tamamlandı (devir oturumu). Program: `apps/pos/`.

Yöntem: `CLAUDE.md` §2. Bu tur kısa tutuldu: program zaten olgun (satış, terazi barkodu, kampanya/kupon, veresiye, vardiya, etiket,
alış faturası, pazaryeri stok, e-Arşiv); öncelik güven hataları ve kasada kayıp/kaçak kontrolü oldu.

## 0. Yapılanlar
### 1. dalga — kırık ve güven
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **İskonto yazarkasaya yansımıyordu:** ÖKC'ye (mali fiş) kalem başına liste fiyatı gidiyor, satır/kampanya/kupon/ek indirim gitmiyordu → mali fiş toplamı programdakinden yüksek. Rakiplerde en sık şikâyet (kaynak 2) | `okcLines`: tüm iskontolar satırlara dağıtılır, kuruş farkı son satıra; kalemde `price` (net birim), `amount`, `listPrice`, `discount`. Kalem toplamı = fiş toplamı | Tarayıcı (ÖKC simülasyon kaydı): 3×10 ₺ %10 satır indirimi + 20 ₺ + 5 ₺ ek indirim → kalemler 24,13 + 17,87 = 42,00 ₺ = fiş |
| H2 | ÖKC bağlantısının resmî dokümanı doğrulanmadı ama sağlayıcı seçilebiliyordu | Çekirdekte `okc` → `UNVERIFIED` (yalnızca simülasyon; adisyon ve otopark da etkilenir). Simülasyonda fiş "TEST" işaretlenir, gerçek seçimde "ÖKC bağlantısı doğrulanmadığı için mali fiş kesilmedi — fiş bilgi fişidir" | Tarayıcı: `sale.okc = 'TEST'` |
| H3 | **Fişten iade, iade tamamlanmadan fişi "iade edildi" yapıyordu:** vazgeçilse de fiş iade edilmiş görünüyor, bir daha iade alınamıyordu | Fiş ancak iade ödemesi tamamlanınca işaretlenir (`refundNo`, iade fişinde `refundOf`) | Tarayıcı: iade moduna geçince `refunded` boş; ödeme sonrası `I1765` |
| H4 | **İade tutarı bugünkü fiyat ve kampanyayla hesaplanıyordu:** müşteriye ödediğinden farklı para iade ediliyordu | Fişten iadede satırlar ödenen net birim fiyatla gelir (satır iskontosu + o günkü kupon/kampanya/ek indirim oranı); iade modunda kampanya/kupon uygulanmaz; kuruş farkı iade toplamı ödenen tutarı geçmeyecek şekilde kapatılır | Tarayıcı: 2×100 ₺ %10 + 50 ₺, 33 ₺ kupon (ödenen 197,00) → iade 197,00 ₺ |
| H5 | Gün sonu düğmesi "Z raporu" diyordu (mali Z raporuyla karışır) | "Gün sonu raporu" | — |

### 2. dalga — beklenen: yetkili onayı
| Konu | Sonuç | Kanıt |
|---|---|---|
| Kasiyer iade / indirim / fiyat değişikliği | `NS.approve` (çekirdek, tüm programlar kullanabilir): kasiyerin rolü yetmiyorsa yönetici PIN'i istenir; yanlış PIN reddedilir ve işlem geçmişine yazılır. POS'ta: fişsiz iade moduna geçiş, fişten iade, ayardaki sınırı aşan satır/genel indirim, fiyat değiştirme. Ayar: "Kasiyerin onaysız yapabileceği en fazla indirim (%)" (boşsa 0) | Tarayıcı (Zeynep Kasiyer): İade → PIN "0000x" → "PIN hatalı — işlem yapılmadı", mod satışta kaldı; doğru PIN → iade modu |

### 3. dalga — fark yaratan: onaylı işlemler raporu
| Konu | Sonuç | Kanıt |
|---|---|---|
| Kayıp/kaçak kontrolü | Onaylar satış fişine yazılır (`approvals`: işlem, onaylayan, zaman); Raporlar > "Onaylı işlemler": fiş, kasiyer, işlem/onaylayan, tutar | Tarayıcı: kasiyer %50 genel indirim → yönetici PIN → F1767; raporda "Genel indirim ₺44,90 — Ahmet Yönetici" |

Kalite kapısı: `npm test` (cloud.test.js hariç — MySQL yok) geçti; 21 ekran açıldı, konsol hatası yok; 375 px'te 5 ekranda taşma yok.
Koyu tema ayrıca denenmedi (çekirdek sınıfları). 5000 kayıtla hız denenmedi (satış listesi 400 satırla sınırlı). `sw.js` V artırıldı.

## 1. Kaynaklar (30.10.2026)
1. Rakip tanıtımları (indirme siteleri / satıcı sayfaları — yalnızca ihtiyaç listesi için, iddialar doğrulanmadı): TeknoPOS
   (`tamindir.com/indir/teknopos-magaza-ve-market-otomasyon-programi/`), MacMar (`tamindir.com/indir/macmar-market-programi/amp/`),
   Bilsoft terazi entegrasyonu (`bilsoft.com/en/entegrasyonlar/terazi`), GoPOS incelemesi (`donanimhaber.com/gopos-inceleme--205943`).
   Ortak ihtiyaçlar: barkodlu terazi, yazarkasa (ÖKC) bağlantısı, raf etiketi, kampanya, cari/veresiye, çoklu şube.
2. Şikâyetler (Şikâyetvar): Vega "iskonto POS'a yansımıyor" (`sikayetvar.com/vega-yazilim/iskonto-posa-yansimiyor-ve-destek-yok`),
   Beko yazarkasa POS bağlantı sorunları (`sikayetvar.com/beko/acilista-beko-yazarkasa-pos-baglanti-sorunu-ve-destek-eksikligi`),
   Simpra sürekli çöküş (`sikayetvar.com/simpra-suite/...`).

## 2. Karşılaştırma (özet)
| Özellik | Bizde | Sınıf |
|---|---|---|
| Barkod, terazi barkodu (önek 27), hızlı ürün, kategori | ✅ | O |
| İskonto, kampanya (X al Y öde, kategori %), kupon | ✅ (H1 ile yazarkasaya doğru yansır) | O |
| İade (fişli/fişsiz), veresiye limiti, vardiya / gün sonu | ✅ (H3–H5) | O |
| Yazarkasa (ÖKC/GMP3) mali fiş | ❌ doğrulanamadı → simülasyon | O — **CANLIYA ÇIKMAYI ENGELLER** (mali fiş zorunlu işletmede) |
| Yetkili onayı, onaylı işlem raporu | ✅ (2–3. dalga) | E / F |
| Çoklu şube / merkezden fiyat | ❌ | E — sonraki dalga |

## 3. Karar / hesap gerektirenler
- **ÖKC:** kullanılacak marka/model, üreticiyle güvenlik taahhütnamesi, üreticinin GMP-3 iletişim kütüphanesi ve test cihazı (Ingenico, Beko, Hugin, PAX…). Doğrudan TCP/IP ile kendi yazdığımız bağlantı GMP-3'e aykırıdır; ayrıntı `docs/DEVIR.md` B11. O gelene kadar POS fişi bilgi fişidir.
- **Eksi stokla satış** varsayılanı açık (marketlerde yaygın); işletme isterse Ayarlar'dan kapatır.

## Hızlı ticaret tohumu bulut belgesine yazmıyor (31.10.2026)

**Sorun:** `apps/pos/hizli.js` `ensure()` bulut belgesine bağlı görünen Getir ve Yemeksepeti ile 3 uydurma sipariş yazıyordu. Sipariş teslim edilince gerçek satış ve stok düşümü oluşuyordu. `CLAUDE.md` §1'e aykırı.

**Yapılan:**
- `ensure()` bulutta (`db.cloud`) hiçbir şey yazmaz. Demo ve yerel aynen kaldı.
- `qcChannels`, `qcOrders` bulutta kullanıcı kanal bağlayana veya webhook siparişi gelene kadar yoktur. Bağlı kanal yokken "Bağlı kanal yok" görünür.
- "Sipariş çek" bulutta simülasyon siparişi yazmaz: gelen kutusu çevrimiçiyse "Yeni sipariş yok", değilse TEST uyarısı verir.
- `draw()` bulutta `db.load()` çağırmaz. Bu çağrı gönderilmemiş kaydı sildiği için bulutta bu ekrandaki her işlem (kanal bağlama, sipariş kabulü) kayboluyordu.

Kanıt: `server/test/kanal-tohum.test.js` (üç programda 29 senaryo, eski kodda her programın ilk senaryosunda kırılır). Tarayıcı: gerçek sunucu, MariaDB ve başsız Chrome ile 22 denetim geçti. Yeni bulut hesabı, ilk açılış, yeniden açılış, arayüzden bağlama, 375 px, koyu tema, `?demo=1`; konsol hatası yok.

Daha önce tohumlanmış bulut belgeleri otomatik düzeltilmedi; düzeltme kararı işletme bazında verilmeli. Şu kayıtlar tohumdan gelmiş olabilir, bu kurallar kod incelemesine dayanır, gerçek müşteri belgesinde denenmedi: `qcChannels.getir.storeId = 'GC-11872'`, `qcChannels.ys.storeId = 'YSM-5521'`, numarası `G` veya `Y` ile başlayan ve müşterisi "Elif K., Murat A., Zeynep T., Can Ö., Deniz Y." olan `qcOrders`, bunlardan teslim edilip `sales` ve `moves` kaydına dönenler.
