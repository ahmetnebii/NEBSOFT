# Klinik (Muayenehane & Diş Kliniği) — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini önceden onayladı. Dalgalar sırayla uygulanıyor; sonuçlar §0'da.

Tarih: 29.10.2026 · Dal: `claude/urun-randevu-uyelik-cfb186` · Yöntem: `CLAUDE.md` §2

## 0. Uygulama durumu
| Dalga | Durum | Kanıt |
|---|---|---|
| 1. dalga (H1–H7) | **Tamam** | Simülasyonda KPS → "TEST: Kimlik doğrulama — gerçek gönderim yapılmadı", rozet yazılmadı; e-Reçete işaretliyken reçete numarasız basıldı, kayıt oluşmadı; vadesi geçen taksit SMS'i "2 TEST (gönderilmedi…)"; 375 px'te hasta kartı 375 px (önce 514); 10:15'lik randevu 30 dk aralıklı takvimde görünüyor; sekreter rolünde "Muayene notları yalnızca hekimlere açıktır"; kayıtlı hasta silinmek istenince "Pasif yap" önerildi ve kayıt korundu; KVKK onam düğmesi ve ayar metni |
| 2. dalga (B1–B3) | sırada | |
| 3. dalga (F1–F2) | sırada | |

---

## 1. Kaynaklar
**Benzer ürünlerin herkese açık sayfaları** (29.10.2026'da arandı; yalnızca karşılanan ihtiyaçlara bakıldı):

| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **DB** | Dental Bulut | `habergazetesi.com.tr` tanıtım haberi ve `tamindir.com` sağlık sektörü listesi (randevu, hasta takibi, gelir-gider, raporlama, arşiv) |
| **MS** | Medicasimple | `medicasimple.com/tr/dental-charting`, `/treatment-planning` (renk kodlu diş şeması, fiyat listesiyle tedavi planı, dijital onay) |
| **CP** | Carepatron | `carepatron.com/tr/professionals/dental/` (hasta kaydı, randevu, faturalama, klinik dokümantasyon) |

**Kullanıcı şikâyetleri:** Klinik yazılımlarına özgü Şikâyetvar başlığı bulunamadı (arama, 29.10.2026). `sikayetvar.com/salon-randevu` kategorisindeki "randevu iptali / gecikme" ve "eksik seans" temaları ile MHRS haberindeki "randevu bulamama" teması (DHA, `dha.com.tr/...-2450450`) yol gösterici alındı.

**Resmî sistemler:** e-Nabız/USS, e-Reçete, MEDULA, KPS için `core/integ-guides-ek.js` araştırması (27.10.2026) geçerli: hepsi **"Yakında / kurum onayı gerekir"** — NEBSOFT'un kurum onayı ve resmî teknik dokümanı yok → **DOĞRULANAMADI, canlıda seçilemez**. Bu oturumda yeni resmî kaynak bulunamadı.

**Bizim durumumuz:** 21 ekran tarayıcıda gezildi (masaüstü + 375 px), konsol hatası yok. Kod satır satır incelendi.

---

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **e-Nabız, e-Reçete, KPS:** Kurum onayı / protokol yok (DOĞRULANAMADI). Programda bu düğmeler simülasyonda **TEST** sonucu gösterir ve kalıcı "yapıldı" kaydı bırakmaz (H1). Canlı kullanım için NEBSOFT'un Sağlık Bakanlığı / NVİ başvurusu gerekir → **senden karar:** başvuru yapılacak mı, yoksa yetkili bir çözüm ortağıyla mı çalışılacak?

## 2. Bulunan hatalar ve riskler (1. dalga)
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte başarı (resmî sistemler):** Simülasyonda KPS "Kimlik doğrulandı" rozeti kalıcı yazılıyor; e-Nabız gönderimi kayıtlara referans yazıp "iletildi" diyor; **e-Reçete'de uydurma numara reçeteye basılıyor** ve reçete kaydı oluşuyor; e-SMM / e-Arşiv test sonucu tahsilata belge no olarak yazılıyor. Taksit hatırlatma SMS'i sonucu beklenmeden "gönderildi" deniyor. | Kod (`patientPage` `kps`/`enb`/`note`/`rx`/`pay`, `cashPage` `#rm`) | `CLAUDE.md` §1 ihlali; sahte e-reçete numarası hukuki risk. |
| H2 | **Telefonda diş şeması taşıyor** (sayfa 514 px). | 375 px otomatik tarama | Telefonda hasta kartı yana kayıyor. |
| H3 | **Randevu durumları ham kod** ("bekliyor", "geldi") olarak görünüyor. | Tarayıcı + kod | Kafa karıştırıcı. |
| H4 | **Takvimde görünmeyen randevu:** saat aralık dışındaysa (ör. 30 dk aralıkta 10:15) randevu takvimde hiç çıkmıyor; aynı saatte iki randevu varsa ikincisi görünmüyor. | Kod (`calendarPage`, `db.find` + tam saat eşleşmesi) | Hasta gelir, takvimde yok. |
| H5 | **Sekreter sağlık verisini görüyor:** muayene notları, tanı (ICD) ve reçete tüm rollere açık. | Kod (rol kontrolü yok) | KVKK md. 6: sağlık verisi özel nitelikli; erişim "bilmesi gereken" kişilerle sınırlanmalı (hafızadan, doğrulanmadı — ilke olarak uygulanır). |
| H6 | **Hastanın KVKK onamı kaydı yok.** | Kod | Sağlık verisi işlemenin dayanağı belgelenemiyor. |
| H7 | **Kaydı olan hasta silinebiliyor:** tedavi, ödeme, randevu kayıtları sahipsiz kalıyor. | Kod (`NS.crud` sil) | Bakiye ve hakediş bozulur; sağlık kaydı saklama yükümlülüğüne aykırı olabilir. |

## 3. Özellik karşılaştırması
O = Olmazsa olmaz · E = Beklenen · F = Fark yaratan. ✅ var · ⚠️ kırık/eksik · ❌ yok

| Özellik | Sınıf | Rakipte | Bizde | Not |
|---|---|---|---|---|
| Hasta kartı, anamnez, risk uyarısı | O | DB, CP | ✅ | |
| Diş şeması + tedavi planı + fiyat listesi | O | MS | ⚠️ | H2 |
| Onam (dijital imza) ve plan yazdırma | O | MS | ✅ | |
| Hekim takvimi | O | DB, CP | ⚠️ | H3, H4 |
| Tahsilat, taksit planı, bakiye | O | DB | ✅ | |
| Laboratuvar iş takibi | E | — | ✅ | |
| Hekim hakedişi | E | — | ✅ | |
| Rol bazlı sağlık verisi erişimi | O | — | ❌ | H5 |
| KVKK onamı | O | — | ❌ | H6 |
| Randevu hatırlatma (ertesi gün toplu) | E | DB | ❌ | B1 |
| Periyodik kontrol çağrısı (6 ay / 1 yıl recall) | E | — | ❌ | B2 |
| Randevu süresi ve süre bazlı çakışma kontrolü | E | DB | ❌ | B3 |
| Bekleyen tedavisi olup randevusu olmayan hastalar (arama listesi) | F | — | ❌ | F1 |
| e-Nabız / e-Reçete / KPS | O (yasal) | DB (iddia) | ⚠️ | Kurum onayı → engelleyen |
| Hasta online randevu sayfası | E | — | ❌ | Bulut `public-rules.js` kuralı gerekir → çekirdek isteği Ç5 |

## 4. Güven kuralları
1. Resmî sisteme gönderilmeyen kayıt "gönderildi / doğrulandı" görünmez; simülasyon sonucu **TEST** yazar, kayda numara yazılmaz, reçeteye numara basılmaz.
2. Muayene notu, tanı ve reçete yalnızca hekim ve yönetici hekime görünür; sekreter randevu, iletişim ve ödeme bilgisini görür.
3. Hastanın KVKK aydınlatma/onam tarihi kartında görünür; yoksa uyarı verilir.
4. Kaydı olan hasta silinmez; "pasif" yapılır.

## 5. Dalga planı
**1. dalga:** H1–H7. **2. dalga:** B1 yarınki randevulara toplu hatırlatma (TEST ayrımıyla) · B2 periyodik kontrol çağrı listesi · B3 randevu süresi ve süre bazlı çakışma. **3. dalga:** F1 bekleyen tedavi arama listesi · F2 telefonda hasta kartı düzeni.

## 6. Karar / hesap gerektirenler
- e-Nabız / e-Reçete / KPS kurum başvurusu (yukarıda).
- KVKK onam metni: kliniğin hukukçusu hazırlar; program yalnızca metni gösterir ve imzayı kaydeder.
- Online hasta randevusu: bulut kuralı (Ç5) + kliniğin kararı.
