# Anaokulu & Kreş — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/anaokulu/` (+ `veli.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEB bildirimleri:** resmî entegrasyon dokümanı yok (`meb` → yalnızca simülasyon).
- **Fotoğraf paylaşımı:** dosya deposu yok. Eski ekran fotoğraf saklamadan "eklendi" diyordu; kaldırıldı. Çocuk fotoğrafı KVKK açık rızası da gerektirebilir, avukata sorulmalı.
- **Kreşler:** md. 56 yalnızca MEB'e bağlı kurumlar içindir. Başka kurumlarda ayarı kapatın; iade elle girilir.
- **İlaç ve olay kaydı:** program kayıt tutar; ilaç verme yetkisi ve kurum kuralları doğrulanmadı.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Listede olmayan kişiye teslim** serbest metinle yapılabiliyordu | Ad, 11 haneli TC, "veliyi aradım" onayı ve müdür PIN'i zorunlu; veliye her durumda bildirim; TC yalnızca işlem geçmişinde (SMS ve veli portalının okuduğu kayıtta yok) | Tarayıcı: eksik TC reddedildi; Elif Öğretmen → PIN → "onay Zeynep Müdür" kaydı. TC'nin kayıttan çıkarılması kodda yapıldı, bu son hâl tarayıcıda ayrıca denenmedi |
| H2 | Menüde alerji eşleşmesi yoktu (yalnızca genel liste) | Her gün için alerji uyarısı sütunu: çocuğun alerji metni + yaygın ürün eşleşmesi (laktoz/süt, yumurta, gluten, fındık, fıstık, ceviz, balık). Yardımcıdır, mutfak kontrolünün yerine geçmez | Tarayıcı: laktoz intoleranslı Zeynep, Göktuğ, İpek pazartesi menüsünde uyarıldı |
| H3 | Ödeme kaydı olan öğrenci silinebiliyordu | `canDelete` ile engellenir | Kod incelendi |
| H4 | Portal girişi formülle üretilen kodla yapılabiliyordu; bildirimler sonuçsuz "gönderildi" diyordu | Rastgele kod; gerçek SMS sonucu | `portal-kod.test.js`, tarayıcı |

Kalite kapısı: `npm test` geçti; konsol hatası yok. Telefon, koyu tema ve büyük veri ayrıca denenmedi.

## 1. Kaynaklar (30.10.2026)
**Mevzuat — DOĞRULANDI:** [Özel Öğretim Kurumları Yönetmeliği](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.15970.pdf) md. 56/3-a (RG 5.9.2025-33008).

Bu turda rakip ürün araştırması yapılmadı; kapsam kod incelemesi ve Kurs araştırmasındaki veli iletişimi ihtiyaçlarına dayanır. Kullanıcı şikâyeti toplanmadı.

## 2. dalga — güven ve beklenenler
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Fotoğraf saklanmadan "eklendi" deniyor, veli portalında sahte kutular çıkıyordu | Kaldırıldı | Tarayıcı |
| B2 | Kardeş indirimi ekranda yazıyor, uygulanmıyordu | Aynı veli telefonu: en büyük çocuk tam, diğerleri indirimli | Tarayıcı |
| B3 | Ayrılış akışı yoktu | md. 56 hesabı, onay, iade son tarihi; listelerden çıkar | Tarayıcı |
| B4 | Servis ekranı "Bindi" gösteriyordu, biniş verisi yok | "Okulda / Teslim edildi" | Kod incelendi |
| B5 | Sınıf ve rota eklenemiyordu; öğretmen hesabı sınıfa bağlanamıyordu | Sınıflar ve Rotalar ekranı | Tarayıcı |
| B6 | Öğretmen bakiyeleri görüyordu; toplu duyuru SMS'i sonuçsuzdu | Bakiye gizli; gerçek sonuç | Kod incelendi |
| B7 | Makbuz ve servis listesi şablondan geçmiyordu | `NS.docs` | Tarayıcı (belge oluştu); kâğıtta denenmedi |

## 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Haber vermeden gelmeyen uyarısı | Saat 10'dan sonra izinsiz gelmeyenler, veli telefonuyla | Tarayıcı |
| F2 | Olay kaydı | Kaza ve sağlık olayı; silinemez; tutanak | Tarayıcı |
| F3 | İlaç takibi | Veli isteği zorunlu; doz, saat, veren | Tarayıcı |
| F4 | Etkinlik izni | Duyuruda izin; veli portaldan onaylar; bekleyenler listesi; sunucu kuralı | Tarayıcı (yerel); bulutta denenmedi |
