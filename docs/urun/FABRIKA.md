# Fabrika ERP — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. **1., 2. ve 3. dalga tamamlandı.** Yeni dosya: `apps/fabrika/uretim.js` (operatör, fason, maliyet analizi).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **e-İrsaliye / e-Fatura / e-Müstahsil:** gerçek gönderim sağlayıcı test hesabıyla denenmedi; simülasyonda TEST görünür. **Fason sevkinde e-İrsaliye** (fiyatsız satır, "fason işçilik" açıklaması) GİB dokümanına göre denetlenmedi — DOĞRULANAMADI; seçenek varsayılan kapalı, canlıdan önce mali müşavire ve sağlayıcıya sorulmalı.
- **Satış faturası KDV'si:** ayar boşsa %1 kullanılıyor; bisküvi gibi ürünlerde doğru oranın ne olduğu resmî kaynaktan doğrulanmadı — DOĞRULANAMADI. Canlıdan önce ayardan seçilmeli.
- **Kantar / PLC:** gerçek cihazla denenmedi.
- **Maliyet yöntemi:** genel gider stok değerine katılmıyor; malzeme çıkışı standart maliyetle yazılıyor (lotun alış maliyetiyle değil). Bu yüzden maliyet farkında malzeme fiyat farkı ayrı görünmez. Karar mali müşavirin.

## 2. ve 3. dalga — yapılanlar
Kanıt sütununda "Tarayıcı": `?demo=1` ile gerçekten denendi (DOM üzerinden tıklama). "Kod incelendi": tarayıcıda denenmedi.

### Kırık ve eksik temel
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| K1 | Kısmi üretim bildiriminde lot maliyeti şişiyordu (tüm çıkış ilk bildirilen miktara bölünüyordu) | Payda, çıkılan malzemenin karşıladığı üretim | Tarayıcı: 1000 kg için tam çıkış, 300 kg bildirim → lot 37,76 ₺ (eski hesap 124,83 ₺) |
| K2 | Hedefin altında kalan iş emri kapatılamıyordu; üretimdeki iş iptal edilemiyordu | "İş emrini bitir": neden zorunlu, kullanılmayan malzeme depoya döner (iş emrine eksi satır, izlenebilirlik korunur). Bildirimsiz üretimdeki iş iptal edilince malzeme döner | Tarayıcı: IE26037 300/1000 kapandı, un 410,06 kg depoya döndü; iptalde 5,858 kg döndü, net malzeme 0 |
| K3 | Sevkte bir kalem yetmezse önceki kalemlerin stok hareketi yazılı kalıyordu; aynı ürün iki satırdaysa sevk ilk satıra yazılıyordu | Önce tüm kalemler denetlenir; satır bazında sevk | Tarayıcı: yetersizde hareket sayısı 320 → 320; iki satır 2 ve 3 sevk edildi, sipariş tamam |
| K4 | SKT'si geçmiş lot üretime ve sevkiyata çıkabiliyordu | Toplama planı geçmiş lotu atlar, ekranda "SKT geçmiş" yazar | Tarayıcı: `pickPlan` ile lot atlandı; pencere rozeti görsel olarak denenmedi |
| K5 | Eksi miktarla bildirim, eksi stok girişi mümkündü | Reddedilir | Tarayıcı (bildirim); stok girişi Kod incelendi |
| K6 | Hareketli malzeme, müşteri, tedarikçi, istasyon, açık işi olan reçete silinebiliyordu | Sebebini söyleyerek reddeder | Tarayıcı: malzeme, tedarikçi, istasyon. Müşteri ve reçete: Kod incelendi |
| K7 | Belgeler sabit HTML'di ve iş emri föyü dışındakiler şablon kullanmıyordu; "Sevk irsaliyesi / İade irsaliyesi" başlığı gerçek irsaliye sanılabilirdi; palet sayısı uyduruluyordu | Satınalma, mal kabul, kalite, iade, iş emri, toplama, sayım, sevk, fason sevk, geri çağırma `NS.docs` ile; "Sevk fişi", "irsaliye yerine geçmez"; palet kaldırıldı | Tarayıcı: föy, sevk fişi, fason fişi metni. Diğerleri Kod incelendi; kâğıtta denenmedi |
| K8 | Sevk SMS'inin sonucu gösterilmiyordu | Gerçek sonuç bildirilir | Tarayıcı: "Müşteri SMS'i TEST — gönderilmedi" |
| K9 | Depo dışı kullanıcılar stok girişi/sayım yapabiliyor, bloke lotu herkes açabiliyordu; depo fiyat değiştirebiliyordu | Stok işlemleri depo + yönetici; bloke açma kalite; sipariş düzenleme/onay yönetici; kalite salt okunur malzeme kartı | Yalnızca operatör rolü Tarayıcı; diğer roller Kod incelendi |
| K10 | Binlerce kayıtta iç içe döngüler | id haritası, tek geçişli raporlar, liste sınırı (300–400 satır, sayı yazar) | Tarayıcı: 5.024 malzeme, 30.319 hareket, 5.037 iş emri: malzemeler 888 ms, MRP 834 ms, hareketler 285 ms, kalanı 230 ms altı |
| K11 | Örnek veride yarı mamul çıkışı 0 ₺ idi | Reçete maliyetiyle yazılır | Tarayıcı |

Bayi siparişini reddetme: `bekliyor` siparişe iptal düğmesi eklendi (Kod incelendi).

### 2. dalga — beklenenler
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Geri bildirimli tüketim | Ayar (varsayılan kapalı): bildirimde (sağlam + fire) reçete ihtiyacı, çıkılan düşülerek FEFO ile çıkılır; stok yetmezse uyarı ve standart maliyet | Tarayıcı: 4 + 1 kg bildirim → un 2,929 kg, şeker 0,909 kg çıktı |
| B2 | Genel üretim gideri | Maliyet Analizi > aylık gider girişi, kapanan iş emirlerine süreye göre dağılım, giderli birim maliyet, Excel. Yalnızca bilgi; stok değerini değiştirmez | Tarayıcı: 460.000 ₺ / 4.800 dk = 95,83 ₺/dk; gider ekleme penceresi Kod incelendi |
| B3 | Operatör ekranı | Yeni rol "Operatör" (ofis ekranlarına girmez, maliyet görmez); istasyon seç, iş emri okut, Başla / Bitir / Üretim bildir / Arıza; seçim cihazda hatırlanır | Tarayıcı: kodla bulma, başlat, bitir, 375 px, yetki. Kamerayla okutma ve Arıza penceresi denenmedi |
| B4 | Fason iş | Malzeme "Fasoncuda" deposuna geçer (kullanılabilir stoktan düşer, toplam stok korunur); teslimde reçete kadar tüketilir, lot maliyeti malzeme + fason bedeli; kapanışta kalan döner; izlenebilirlik zinciri korunur | Tarayıcı: 20 kg gönderildi, 10 kg alındı, lot 42,31 ₺ (37,31 + 5), kapanışta 5,858 kg döndü, stok tuttu, geriye izleme kaynağa ulaştı. e-İrsaliye seçeneği denenmedi |

### 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Maliyet farkı analizi | Ay bazında iş emri: standart / gerçek, malzeme, işçilik, fire farkı; süresi ölçülmeyen "Kısmen standart"; malzeme çıkışı olmayan iş hesap dışı ve sayısı yazar; Excel | Tarayıcı: demo ayı toplam +17.922 ₺ |
| F2 | Alternatif istasyon önerisi | Kapasite aşan günde başlamamış operasyon için aynı türde çalışan ve boş istasyon, yük ve saatlik maliyet farkı; "Taşı" | Tarayıcı: öneri listesi ve "yok" durumu göründü; "Taşı" düğmesi tıklanmadı |

Kalite kapısı: 375 px'te 7 ekranda taşma yok, konsol hatası yok, boş liste (Fason, Maliyet) görüldü. Koyu tema denenmedi (yalnızca çekirdek sınıfları). `sw.js` sürümü bu görevde değiştirilmedi; birleştirmede artırılmalı.

Tarih: 29.10.2026 · Dal: `claude/urun-eticaret-uretim-38c2a2` · Yöntem: `CLAUDE.md` §2 · Program: `apps/fabrika` (`app.js` stok/lot, satınalma, mal kabul, kalite; `app2.js` reçete, iş emri, plan, MRP, satış/sevkiyat, bakım/OEE; `bayi.html` bayi portalı)

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Kantar simülasyonda uydurma ağırlık yok | Simülasyonda ağırlık okunmaz, "TEST: … tartımı elle girin" uyarısı | Kod (`readWeight`); cihaz yok, tarayıcıda kantar açılmadı |
| F2 | Simülasyon belge no olarak yazılmaz | e-Müstahsil ve tedarikçi iadesi e-İrsaliyesi: simülasyon ref'i kaydedilmez, `…Test` işareti, çıktıda "e-İrsaliye: TEST — gönderilmedi". Sevkiyatta e-İrsaliye/e-Fatura simülasyonsa listede "Test — gönderilmedi"; TEST faturası onayla yeniden kesilebilir ("Faturala" düğmesi kalır) | Tarayıcı: SV2613 → e-İrsaliye ve e-Fatura "Test — gönderilmedi"; "Faturala" → onay → NEB…0002 (yine TEST) |
| F3 | Ölçülmeyen operasyon süresi uydurulmaz | İş emri kapanırken süre yazılmaz ("ölçülmedi"); OEE yalnızca süresi ölçülen operasyonlarla | Tarayıcı: IE26037 kapatıldı → Yoğurma "ölçülmedi / Bitti" |
| F4 | Eksik malzeme çıkışında lot maliyeti sıfıra düşmez | Çıkılan malzeme reçetenin %90'ından azsa lot standart maliyetle girer, uyarı verilir, bildirimde `costStd` işareti | Tarayıcı: çıkışsız 200 kg bildirim → "lot standart maliyetle (₺37,76) girdi" |
| F5 | Bayi siparişi onayında SMS sonucu gerçek | "Sipariş onaylandı · SMS TEST — gönderilmedi (SMS sağlayıcısı bağlı değil)"; SMS kaydı gerçek durumla | Tarayıcı (SP2613 bekliyor yapılarak) |
| F6 | Gerçek / standart maliyet ayrımı | İş emri maliyet kartında malzeme (gerçek çıkış), işçilik (ölçülen süre) ve standart kısım (ölçülmeyen operasyonlar) ayrı; standart maliyetli lot uyarısı; malzeme çıkışı yoksa "Gerçek birim maliyet" gösterilmez | Tarayıcı: "Malzeme ₺0 · İşçilik ₺0 · ₺525 (standart…)" |

Kalite kapısı: `npm test` (cloud.test.js hariç, MySQL yok) geçti. 375 px'te 6 sayfada taşma yok; konsolda hata yok. Koyu tema ayrı
denenmedi (yalnızca çekirdek sınıfları). 5000 kayıtla hız denenmedi. `sw.js` V `nebsoft-v3-22` (aynı oturumda artırıldı).

---

## 1. Kaynaklar
**Rakiplerin herkese açık sayfaları** (29.10.2026; yalnızca karşılanan ihtiyaçlara bakıldı):

| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **L** | Logo Tiger Wings | `cdn.logo.com.tr/files/logocomtr/Uploads/Documents/logo-tiger-wings-tanitim-brosuru-tr.pdf` (maliyet muhasebesi: malzeme, genel gider, istasyon ve işçilik maliyetiyle safha bazlı üretim maliyeti; üretim emrini alternatif makineye yönlendirerek çizelgeleme) |
| **D** | DİA (Mikro'nun satın alma başvurusu, `webrazzi.com/2026/01/06/mikro-yazilim-dia-yazilim-i-satin-aliyor/`) | bulut ERP kapsamı: finans, stok, üretim, satış, e-ticaret |
| **M** | MRPeasy, Odoo (KOBİ üretim yazılımı örnekleri, `tecnoloblog.com/tr/MrPeasy-nedir/`, `ecosire.com/tr/blog/odoo-vs-epicor-manufacturing-comparison`) | MRP, reçete, iş emri rotası, atölye kontrolü, kalite, bakım planı |
Mikro ve DİA'nın üretim modülü özellik sayfası bu turda bulunamadı → karşılaştırmaya girmedi.

**Kullanıcı şikâyetleri** (Şikâyetvar, 29.10.2026): `sikayetvar.com/logo-yazilim/logo-yazilimda-suregelen-sorunlar-ve-yetersiz-destek` (yıllardır çözülmeyen hatalar), `sikayetvar.com/mikro-yazilim` (35 şikâyet/yıl; KDV hesap hataları, güncelleme sonrası açılmama, lisans–özellik uyumsuzluğu).

**Bizim durumumuz:** 18 ekran gezildi, `app.js` + `app2.js` (≈170 KB) maliyet, lot, iş emri ve e-Belge akışları kodda incelendi.

---

## 2. Bulunan hatalar ve riskler (1. dalga)
| # | Sorun | Etkisi |
|---|---|---|
| F1 | **Uydurma kantar ağırlığı:** kantar bağlantısı simülasyondaysa 14–20 ton arası rastgele ağırlık okunmuş gibi forma yazılıyor. | Mal kabulde gerçek olmayan miktar stoğa ve tedarikçi borcuna girer. |
| F2 | **Sahte belge numaraları:** tedarikçi iadesinde e-İrsaliye ve çiftçi alımında e-Müstahsil genel servis üzerinden gönderiliyor; simülasyonun iç referansı belge no olarak kaydediliyor. Sevkiyatta simülasyon e-İrsaliye/e-Fatura "TEST" olarak işaretlenmiyor ve fatura yeniden kesilemiyor. | Gönderilmemiş resmî belge gönderilmiş görünür. |
| F3 | **Uydurma operasyon süresi:** iş emri kapatılırken ölçülmemiş operasyonlara "ideal süre × 1,15" yazılıyor. Bu süre işçilik/makine maliyetine ve OEE'ye giriyor. | Gerçek maliyet ve verimlilik yanlış; sorun gizlenir. |
| F4 | **Malzeme çıkışından önce üretim bildirilirse lot maliyeti neredeyse sıfır:** lot maliyeti "o ana kadar çıkılan malzeme / üretilen" ile hesaplanıyor. | Stok değeri ve satış kârlılığı yanlış (sık görülen: önce üretip sonra malzeme çıkmak). |
| F5 | **Bayi siparişi onayında "bayiye SMS gönderildi"** her zaman yazıyor. | SMS kapalıyken de gönderildi sanılır. |
| F6 | **Gerçek / standart maliyet karışık:** iş emri detayında hangi kalemin gerçek ölçüm, hangisinin standart olduğu görünmüyor. | Maliyet farkı yorumlanamaz. |

---

## 3. Özellik karşılaştırması
**Bizde:** ✅ / 🟡 / ❌ · **Sınıf:** O / E / F

| Özellik | Bizde | Rakipte | Sınıf |
|---|---|---|---|
| Malzeme kartı, çoklu depo/lokasyon, lot + SKT, FEFO, sayım, transfer, fire | ✅ | L D | O |
| Satınalma talebi → teklif → sipariş → mal kabul → kalite (karantina) → tedarikçi iadesi | ✅ | L | O |
| Çok seviyeli reçete + rota, iş emri, malzeme çıkışı, üretim bildirimi, lot izlenebilirliği | ✅ | L M | O |
| MRP, üretim planı, satış siparişi → sevkiyat → e-İrsaliye / e-Fatura | ✅ | L M | O |
| Doğru iş emri maliyeti (F3, F4, F6) | 🟡 | L (safha bazlı maliyet) | O |
| Uydurma veri olmaması (F1, F2, F5) | ❌ | — | O |
| Geri bildirimli tüketim (üretim bildirince reçeteden otomatik malzeme çıkışı) | ✅ B1 | L M | E |
| Genel üretim gideri (elektrik, kira) dağıtımı | ✅ B2 (bilgi amaçlı) | L | E |
| Alternatif istasyon / kapasite çizelgeleme | ✅ F2 | L | E |
| Fason üretim (malzeme gönder, mamul al) | ✅ B4 | L | E |
| Operatör ekranı (tablet: başla / bitir / fire, barkodla iş emri) | ✅ B3 | M | E |
| Bakım planı + OEE + PLC sayaç | ✅ | M | E |
| Bayi portalı (sipariş, bakiye) | ✅ | — | F |
| Maliyet farkı analizi (standart vs gerçek, malzeme/işçilik/fire ayrımı) | ✅ F1 | L | F |

---

## 4. Güven kuralları
1. **Ölçülmeyen ölçülmüş gibi yazılmaz:** süre, ağırlık, sayaç yalnızca cihazdan veya kullanıcıdan gelir; tahmin "standart" etiketiyle ayrı tutulur.
2. **Stok değeri sıfıra düşmez:** malzeme çıkışı eksikse lot standart maliyetle girer ve bu açıkça yazar.
3. **Resmî belge no yalnızca entegratörden:** simülasyon "TEST".

---

## 5. Dalga planı
| Dalga | İçerik |
|---|---|
| **1 — Temel ve güven** | F1–F6 |
| **2 — Beklenenler** | Geri bildirimli tüketim (ayar), genel üretim gideri dağıtımı, operatör (tablet) ekranı, fason iş emri |
| **3 — Fark yaratanlar** | Maliyet farkı analizi (malzeme/işçilik/fire), alternatif istasyonla çizelgeleme önerisi |

## 6. Karar / hesap gerektirenler
- **Kantar / PLC cihazı:** gerçek cihaz bağlantısı (seri port / Modbus) sahada denenmeli.
- **e-Müstahsil / e-İrsaliye entegratörü:** sağlayıcı seçimi ve test hesabı.
- **Maliyet yöntemi:** lot değerlemesinde "gerçekleşen" (mevcut) mi "standart + fark" mı kullanılacağı — mali müşavir kararı. Bu dalgada mevcut yöntem korunup yalnızca eksik çıkışta standarda düşülüyor.
