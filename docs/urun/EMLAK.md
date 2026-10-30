# Emlak Ofisi — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1. dalga (güven) tamamlandı (devir oturumu). Pazar araştırması ve 2–3. dalga sırada. Program: `apps/emlak/` (+ `portal.js` ilan portalları, `ilan.html`).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **İlan portalları (sahibinden.com, Hepsiemlak, Emlakjet):** resmî ilan API dokümanı doğrulanmadı → çekirdekte `UNVERIFIED`, yalnızca simülasyon.

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Portal yanıtı yok sayılıyordu:** ilan gönderilince rastgele portal ilan numarası uyduruluyor, 2,5 sn sonra kendiliğinden "Yayında" oluyordu | Yanıta göre: simülasyon "TEST — yayınlanmadı" (no uydurulmaz), hata, ya da "Onayda" (no portaldan); otomatik yayına alma kaldırıldı | Kod incelendi |
| H2 | Süresi dolanları yenileme ve satılanları kaldırma sonuçtan bağımsız başarılı sayılıyordu | Yalnızca portal onaylarsa tarih uzar / kaldırıldı olur; simülasyonda TEST | Tarayıcı: "TEST — 4 ilan yenilenmedi" |
| H3 | Doping kredisi portal yanıtı beklenmeden düşülüyordu | Kredi ve işaret ancak portal onaylarsa | Kod incelendi |
| H4 | İlan kartından portala gönderimde simülasyon "yayında" yazıyordu | "TEST" / "onayda" / "hata" | Kod incelendi |

Kalite kapısı: ekranlar açıldı, konsol hatası yok.
