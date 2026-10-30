# Veteriner (Klinik & Pet Otel) — Ürün Spesifikasyonu

> **Durum (29.10.2026):** Kullanıcı tüm programlar için eksiklerin giderilmesini önceden onayladı. Dalgalar sırayla uygulanıyor; sonuçlar §0'da.

Tarih: 29.10.2026 · Dal: `claude/urun-randevu-uyelik-cfb186` · Yöntem: `CLAUDE.md` §2

## 0. Uygulama durumu
| Dalga | Durum | Kanıt |
|---|---|---|
| 1. dalga (H1–H4) | **Tamam** | Simülasyonda VETBİS aşı bildirimi → "TEST: VETBİS aşı bildirimi — gerçek gönderim yapılmadı", kayda ref yazılmadı (e-reçete, PETVET, e-SMM aynı kural); online randevu onayında SMS sonucu gerçek durumla bildiriliyor; hayvan kartı > Karne kodu (WhatsApp ile gönder, yenile); karnede yanlış kodla giriş reddedildi, kodsuz "giriş kodunu yazın", doğru kodla açıldı (yerel mod; bulut için Ç7); 25 stoklu ürün sepete 26. kez eklenemedi; aynı saat/hekim randevusunda uyarı (Ç8) |
| 2. dalga (B1–B3) | **Tamam** (30.10.2026, devir oturumu; "YARIM" commit `445e35b` denendi ve tamamlandı) | B1: Özet > Aşı hatırlatmaları > "Hepsine SMS (18)" → SMS sağlayıcısı yokken "18 TEST (gönderilmedi…)", satırlarda "TEST — gönderilmedi", hiçbiri "hatırlatıldı" sayılmadı (düğme yine 18). B2: hasta düzenle > Durum "Vefat etti" → başlıkta rozet, aşı listesinden düştü (18 → 17). B3: Pet Otel > konaklama "Çıkış yaptı" → "Çıkış ödemesi" (gece × günlük, tutar düzenlenebilir); Vazgeç → listede "Ödenmedi" rozeti (bu oturumda eklendi), tekrar kaydedince ödeme yeniden sorulur; Tahsil et → "Ödendi" ve Satış & Stok'ta satış kaydı. 375 px'te 4 sayfada taşma yok, konsol hatası yok. Not: erken çıkışta tutar planlanan bitiş tarihine göre önerilir (elle düzeltilir). Eski kayıtlara "Ödenmedi" yazılmaz (yalnızca ödeme alınmadan çıkış yapılanlara) |
| 3. dalga (F1) | sırada | |

---

## 1. Kaynaklar
**Benzer ürünlerin herkese açık sayfaları** (29.10.2026'da arandı):

| Kısaltma | Ürün | Sayfa |
|---|---|---|
| **CV** | CetaSoft Veteriner | `tamindir.com/indir/cetasoft-veteriner/` (aşı kaydı ve tekrar tarihi izleme, son kullanma tarihi yaklaşan ilaç raporu) |
| **VK** | Veteriner Klinik Modülü | `tamindir.com/indir/veteriner-klinik-modulu/` (aşı tarihleri ekranı, aşı/ilaçlama raporları) |
| **VH** | Veteriner Hasta Takip Programı | `tamindir.com/indir/veteriner-hasta-takip-programi-v310/` (aşı tipleri ve etki süreleri, aşı çizelgesi, randevu önerisi, aşı stoku) |
| **EC** | Odoo tabanlı klinik çözümü | `ecosire.com/tr/industries/veterinary` (aşı/kontrol/ilaç hatırlatmalarının SMS/e-posta ile otomatik gönderimi) |

**Kullanıcı şikâyetleri:** Veteriner yazılımlarına özgü Şikâyetvar başlığı bulunamadı (29.10.2026). Randevu kategorisindeki "randevu iptali/gecikme" teması ve genel sektör bilgisi (hafızadan, doğrulanmadı): ölen hayvan için aşı hatırlatması gelmesi sahipler için en üzücü hatadır → B2.

**Resmî sistemler:** VETBİS / HAYBİS ve PETVET için `core/integ-guides-ek.js` araştırması (27.10.2026): Bakanlık yetkisi gerekir, açık teknik doküman bulunamadı → **DOĞRULANAMADI, canlıda seçilemez**.

**Bizim durumumuz:** 22 ekran tarayıcıda gezildi (masaüstü + 375 px), konsol hatası yok. Kod ve `karne.html` incelendi; sunucu kuralı `server/cloud/public-rules.js` okundu.

---

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **VETBİS / PETVET:** Bakanlık yetkisi ve resmî doküman yok (DOĞRULANAMADI). Simülasyon artık TEST yazar, kayıt bırakmaz (H1). **Senden karar:** Bakanlık başvurusu yapılacak mı?
- **Pati karnesi erişimi (H2):** Sunucu kuralı yalnızca telefon numarasıyla giriş veriyor. Program tarafında kod eklendi ama **bulutta koruma ancak `public-rules.js` kodu zorunlu tuttuğunda** sağlanır → çekirdek isteği Ç7. Bu yapılmadan bulutta pati karnesi yayına alınmamalı.

## 2. Bulunan hatalar ve riskler (1. dalga)
| # | Sorun | Nasıl bulundu | Etkisi |
|---|---|---|---|
| H1 | **Sahte başarı:** VETBİS aşı bildirimi, VETBİS e-reçete, PETVET çip kaydı ve e-SMM simülasyonda kayda referans yazıyor; online randevu onayında SMS sonucu beklenmeden "sahibine SMS gönderildi" deniyor. | Kod (`vaxDone`, `visitForm`, `#pv`, `apptsPage`) | `CLAUDE.md` §1 ihlali. |
| H2 | **Pati karnesine yalnızca telefonla giriş:** numarayı bilen herkes sahibin adını, hayvanların tanı ve tedavilerini görüyor ve randevu isteği gönderebiliyor. | `karne.html` + `public-rules.js` `RULES.veteriner.login` | Kişisel veri sızıntısı (KVKK). |
| H3 | **Satışta stok eksiye düşüyor**, stokta olmayan ürün sepete eklenebiliyor. | Kod (`shopPage` `[data-pay]`) | Stok güvenilmez. |
| H4 | **Randevu çakışması kontrol edilmiyor** (aynı saat, aynı hekim). | Kod (`apptsPage` `NS.crud`) | Çift randevu. |

## 3. Özellik karşılaştırması
| Özellik | Sınıf | Rakipte | Bizde | Not |
|---|---|---|---|---|
| Sahip + hayvan kartı, çip no | O | hepsi | ✅ | |
| Aşı karnesi, tür bazlı aşı takvimi | O | CV, VH | ✅ | |
| Muayene kaydı, tanı, tedavi, kilo | O | hepsi | ✅ | |
| Mama/ilaç satışı ve stok | O | CV | ⚠️ | H3 |
| Pet otel | E | — | ✅ | Ödeme kaydı yok → B3 |
| Aşı hatırlatması (toplu SMS) | O | EC, VK | ⚠️ | tek tek WhatsApp var → B1 |
| Vefat / kayıp işaretleme (hatırlatma durur) | O | — | ❌ | B2 |
| Sahip portalı (karne, randevu isteği) | F | — | ⚠️ | H2 |
| Ameliyat / anestezi onam formu (imzalı) | E | — | ❌ | F1 |
| VETBİS / PETVET | O (yasal) | — | ⚠️ | engelleyen |

## 4. Güven kuralları
1. Gönderilmeyen bildirim/SMS "gönderildi" görünmez; simülasyon **TEST**.
2. Sahip portalı yalnızca telefon + klinik tarafından verilen kod ile açılır.
3. Vefat eden/kaybolan hayvana hatırlatma gitmez; kartı ve geçmişi korunur.
4. Stok sıfırın altına satılmaz (stok düzeltmesi ayrı yapılır).

## 5. Dalga planı
**1. dalga:** H1–H4. **2. dalga:** B1 toplu aşı hatırlatma (TEST ayrımı, hatırlatıldı işareti) · B2 vefat/kayıp işaretleme · B3 pet otel çıkışında ödeme kaydı. **3. dalga:** F1 imzalı ameliyat/anestezi onam formu.

## 6. Karar / hesap gerektirenler
- VETBİS / PETVET Bakanlık başvurusu.
- Ç7 (sunucu kuralında kod zorunluluğu) yapılana kadar bulutta pati karnesinin kapalı tutulması.
