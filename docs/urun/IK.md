# İK (Personel & Puantaj & Bordro) — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1. dalga (güven ve mevzuat) tamamlandı (devir oturumu). Program: `apps/ik/` (`bordro.js` hesap).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **Bordro parametreleri — DOĞRULANAMADI:** gelir vergisi dilimleri (190.000 / 400.000 / 1.500.000 / 5.300.000), damga vergisi binde 7,59, işveren SGK %21,75 / işsizlik %2 / teşvik 5 puan, SGK tavan katsayısı 9, kıdem tavanı 64.948,77 ₺ hafızadandır. Resmî Gazete metinleri (RG 33124 5. mük., 332 seri no'lu GV Genel Tebliği) PDF olduğu için okunamadı; kıdem tavanı Temmuz 2026'da değişti (csgb.gov.tr sayfası görselde). Program bu değerler Ayarlar > Bordro'dan girilene kadar maaş ekranında uyarı gösterir. **Mali müşavir onayı gerekir.**
- **SGK işe giriş/çıkış, banka toplu maaş, e-Bordro, PDKS:** resmî entegrasyon dokümanı yok → yalnızca simülasyon (TEST), gerçek gönderim yapılmaz.

## Doğrulananlar
- 2026 asgari ücret 33.030,00 ₺ brüt / 28.075,50 ₺ net; SGK işçi %14, işsizlik işçi %1 — **DOĞRULANDI** (`csgb.gov.tr/poco-pages/asgari-ucret/`, 01/01/2026–31/12/2026, okundu 30.10.2026).
- Yıllık ücretli izin — 4857 sayılı İş Kanunu md. 53 — **DOĞRULANDI** (`mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm`, okundu 30.10.2026): en az 1 yıl; 1–5 yıl (5 dahil) 14, 5'ten fazla 15'ten az 20, 15 ve üstü 26 gün; 18 yaş ve altı ile 50 yaş ve üstü en az 20 gün; yer altı işlerinde +4 gün (6552/5).

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **PDKS simülasyonu uydurma giriş-çıkış saatlerini puantaja yazıyordu** (fazla mesai → maaş) | Simülasyonda hiçbir kayıt işlenmez: "PDKS TEST — cihaz bağlı değil" | Tarayıcı: puantaj verisi değişmedi |
| H2 | SGK işe giriş/çıkış simülasyonu kartta "SGK giriş ✓" gösteriyordu | Yalnızca gerçek bildirimde ✓; simülasyonda "SGK giriş TEST (bildirilmedi)" | Kod incelendi |
| H3 | Banka toplu maaş simülasyonu "bankaya iletildi" deyip ayı ödendi işaretliyordu | "Banka TEST — gönderilmedi; ödendi işaretlenmedi" | Tarayıcı: `paid_*` ayarı yok |
| H4 | e-Bordro simülasyonu "iletildi" diyordu | "e-Bordro TEST — gönderilmedi" | Tarayıcı |
| H5 | Tam 5 yılını dolduran personele 20 gün izin veriliyordu (madde: "beş yıl dahil" 14); yaş alt sınırı ve yer altı eki yoktu — UYUMSUZ | Düzeltildi; personel kartına "yer altı" ve "sözleşmeyle ek izin" | Tarayıcı: 55 yaş/2 yıl → 20, 5 yıl → 14, 6 yıl yer altı → 24 |
| H6 | Doğrulanmamış bordro varsayılanları sessizce kullanılıyordu | Maaş ekranında hangi değerlerin doğrulanmadığını gösteren uyarı; ayarda girilen değer uyarıyı kaldırır | Tarayıcı |

Kalite kapısı: 11 ekran açıldı, konsol hatası yok; `npm test` (cloud.test.js hariç) geçti. Pazar araştırması, 2–3. dalga (ör. vardiya planı, izin talebi onay akışı, personel self-servis) bu turda yapılmadı — sıradaki.
