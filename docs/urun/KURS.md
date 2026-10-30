# Kurs & Etüt — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/kurs/` (+ `veli.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **MEBBİS / e-Yaygın:** resmî entegrasyon dokümanı yok (`meb` → yalnızca simülasyon).
- **Yanlış götürme oranı:** deneme sınavında kaç yanlışın bir doğruyu götürdüğü kurum tarafından girilir; ÖSYM/MEB oranı doğrulanmadı.
- **Şikâyet verisi:** kullanıcı şikâyeti bulunamadı; öncelikler özellik sayfalarına ve kod incelemesine dayanır.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | Öğrencinin kurstan ayrılma akışı yoktu | "Kurstan ayrıl": ödenen, geçen süre, öneri iade ve kalan borç; yetkili onayı; ödenmemiş taksitler iptal, kalan borç ayrı taksit; iade negatif tahsilat; öğrenci sınıf ve yoklama listelerinden çıkar | Tarayıcı: 12.000 ₺ ödenmiş, 86/240 gün → iade 0, 8 taksit iptal, yoklamada görünmedi |
| H2 | Veli girişi yalnızca telefonla yapılıyordu | Telefon + rastgele kod; öğrenci kartında "Veli portalı kodu" | `portal-kod.test.js`, tarayıcı |
| H3 | Toplu ders bağlantısı ve yanıtlarda sonuçsuz "gönderildi" | Gerçek sonuç (n gönderildi / TEST / hata) | Çekirdek `smsBatch` |

Kalite kapısı: `npm test` geçti; konsol hatası yok. Telefon, koyu tema ve büyük veri ayrıca denenmedi.

## 1. Pazar araştırması (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı. [Dershane Otomasyonu](https://www.tamindir.com/indir/dershane-otomasyonu/): kayıt, ödeme, sınav, program, yoklama, veli mektubu. [Eyotek](https://apps.apple.com/tr/app/eyotek/id1571118477): ön kayıt, devamsızlık, ödev, etüt, sınav değerlendirme, veli bilgilendirme. [Etüt ve Özel Ders Takip](https://www.tamindir.com/indir/etut-ve-ozel-ders-takip-programi/): birebir randevu, muhasebe. [ABC](https://apps.apple.com/tr/app/abc/id1477201992): program, yoklama, ödev.

**Mevzuat — DOĞRULANDI:** [Özel Öğretim Kurumları Yönetmeliği](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.15970.pdf) (son değişiklik RG 5.9.2025-33008) md. 56 ücret iadesi, md. 57 en az %3 ücretsiz öğrenci.

## 2. dalga — güven ve beklenenler
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| B1 | Ayrılışta iade md. 56'ya uymuyordu (%10 düşülmüyordu) | Başlamadan: %10; sonra: %10 + görülen gün veya ders saati; üst sınır ücret; son iade tarihi 30 gün | Tarayıcı |
| B2 | Devamsızlık SMS'i "gönderildi" yazıyordu, yoklama değişince gitmiyordu; ekranda "demo" yazısı vardı | Gerçek sonuç; Var → Yok değişiminde gider | Tarayıcı |
| B3 | Taksit toplamı ücreti tutmuyordu; öğrenci no çakışabiliyordu | Kuruş son taksitte; sıralı no | Kod incelendi |
| B4 | Öğretmen borç ve ödemeleri görüyordu | Taksit, kalan ve düzenleme gizli | Tarayıcı |
| B5 | Hakediş tahminden hesaplanıyordu | Yoklaması alınan ders × ücret, ay seçimi | Tarayıcı |
| B6 | Makbuz, karne, sözleşme, program | `NS.docs`; sözleşmede iade hükmü | Tarayıcı (belge oluştu); kâğıtta denenmedi |
| B7 | Doğru-yanlıştan net; aynı derslikte çakışma; ücretsiz öğrenci %3 uyarısı; bağlı kayıt silme engeli | Eklendi | Kod incelendi |

## 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Ön kayıt | Aday, sonraki arama, kayda çevirme | Tarayıcı |
| F2 | Ödev | Sınıfa ödev, yapanlar, veli portalı sekmesi | Tarayıcı; veli sekmesi yalnızca boş durumda görüldü |
| F3 | Birebir etüt | Çakışma denetimi; yapılan etüt hakedişe girer | Tarayıcı |

Yapılmadı: konu bazlı sınav analizi, optik okuma, servis takibi.
