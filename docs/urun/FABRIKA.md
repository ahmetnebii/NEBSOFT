# Fabrika ERP — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı dalgaları önceden onayladı. 1. dalga uygulanıyor.

Tarih: 29.10.2026 · Dal: `claude/urun-eticaret-uretim-38c2a2` · Yöntem: `CLAUDE.md` §2 · Program: `apps/fabrika` (`app.js` stok/lot, satınalma, mal kabul, kalite; `app2.js` reçete, iş emri, plan, MRP, satış/sevkiyat, bakım/OEE; `bayi.html` bayi portalı)

## 1. dalga — yapılanlar
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| F1–F6 | _uygulanıyor_ | | |

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
| Geri bildirimli tüketim (üretim bildirince reçeteden otomatik malzeme çıkışı) | ❌ | L M | E |
| Genel üretim gideri (elektrik, kira) dağıtımı | ❌ | L | E |
| Alternatif istasyon / kapasite çizelgeleme | 🟡 (plan ekranı) | L | E |
| Fason üretim (malzeme gönder, mamul al) | ❌ | L | E |
| Operatör ekranı (tablet: başla / bitir / fire, barkodla iş emri) | 🟡 (iş emri detayında) | M | E |
| Bakım planı + OEE + PLC sayaç | ✅ | M | E |
| Bayi portalı (sipariş, bakiye) | ✅ | — | F |
| Maliyet farkı analizi (standart vs gerçek, malzeme/işçilik/fire ayrımı) | ❌ | L | F |

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
