# Adisyon (Restoran / Kafe) — Ürün Spesifikasyonu

> **Durum (30.10.2026):** Kullanıcı dalgaları önceden onayladı. 1., 2. ve 3. dalga tamamlandı (devir oturumu). Program: `apps/adisyon/` (+ `qr.html` QR menü, `platform.js` yemek platformları).

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **ÖKC (yazarkasa) mali fiş:** resmî entegrasyon dokümanı yok → yalnızca simülasyon ("TEST"); adisyon bilgi fişidir.
- **Menü KDV oranları:** her ürüne oran girilebilir (boşsa %10). 2007/13033 sayılı Karar II sayılı liste md. 24: lokanta, içkili lokanta, kebapçı vb. hizmetler indirimli orandadır, "alkollü içeceklere isabet eden kısmı hariç"; gazino, bar, diskotek, pavyon, taverna, birahane listenin dışındadır (RG 30.12.2007/26742, `resmigazete.gov.tr/eskiler/2007/12/20071230-4.htm`, okundu 30.10.2026 — **DOĞRULANDI**, kapsam için). Güncel oran rakamları (%10 / %20) sonraki değişikliklerden gelir — **DOĞRULANAMADI** (metin okunamadı); alkollü içecekleri ve bar türü işletmeyi mali müşavire doğrulatın.
- **QR kodlar yeniden basılmalı:** bulutta QR sipariş artık masa + gizli QR anahtarı ister; eski QR'lar (anahtarsız) çalışmaz.

## 0. Yapılanlar
### 1. dalga — kırık, mevzuat ve güven
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **Zorunlu servis ücreti:** masa hesabına ayardaki % otomatik ekleniyordu. 30.01.2026 Fiyat Etiketi Yönetmeliği değişikliğiyle restoran ve kafelerde servis, masa ve kuver ücreti yasak; yalnızca müşterinin kendi isteğiyle gönüllü bahşiş serbest — **DOĞRULANDI** (Ticaret Bakanlığı duyurusu, 30.01.2026: `ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-fiyat-etiketi-yonetmeliginde-degisiklik-yapildi`; Resmî Gazete sayısı ve madde metni bu turda okunmadı) | Otomatik servis kaldırıldı (eski ayarda % olsa da uygulanmaz; kapanmış hesapların kayıtlı toplamı değişmez). Ayarlarda açıklama. Hesapta "Bahşiş (müşteri isterse)" → ayrı satır "Bahşiş (gönüllü)" | Tarayıcı: ayar %10 iken A5872 toplamı 1.610 ₺ (servis yok); 25 ₺ bahşiş → 1.635 ₺, ayrı satırda |
| H2 | **İndirim yazarkasaya yansımıyordu, KDV sabit %10:** ÖKC kalemleri liste fiyatıyla gidiyordu; paket teslimde ödeme bilgisi de yoktu | `okcItems`: ikram düşülür, indirim satırlara dağıtılır, bahşiş ayrı kalem (KDV 0), kalem toplamı = hesap toplamı; KDV menü kaleminden (yeni "KDV %" alanı, boşsa 10). Paket teslimde ödemeler gönderilir; simülasyonda "TEST" | Tarayıcı (ÖKC simülasyon kaydı): %10 indirimde Izgara Köfte 380 → 342 ₺, toplam 1.474 ₺ |
| H3 | **QR menüden dışarıdan sipariş:** bulut kuralı yalnızca masa kimliğini (`salon-1` gibi tahmin edilebilir) istiyordu | Her masaya rastgele `qrKey`; QR bağlantıları `&k=` içerir; sunucu sorgu, sipariş ve garson çağrısında masa + anahtar ister | `server/test/portal-kod.test.js` ("adisyon: QR sipariş / garson çağrısı masa + QR anahtarı ister") |

### 2. dalga — beklenen: yetkili onayı
| Konu | Sonuç | Kanıt |
|---|---|---|
| Garsonun mutfağa gitmiş ürünü iptali, ikram ve adet azaltma | `NS.approve(app, …, ['admin', 'kasa'])`: yönetici veya kasiyer PIN'i; onaylayan ürüne (`cancelBy` / `compBy`) ve işlem geçmişine yazılır | Tarayıcı (Ali Garson): Margarita Pizza iptali → PIN → `cancelBy: Selim Yönetici` |

### 3. dalga — fark yaratan: iptal ve ikram raporu
| Konu | Sonuç | Kanıt |
|---|---|---|
| Kayıp/kaçak kontrolü | Raporlar > "İptal ve ikramlar": tür, neden, garson / onaylayan, tutar, dönem toplamı | Tarayıcı: kart hatasız çiziliyor (dönemde kapanmış hesapta iptal yoktu) |

Kalite kapısı: `npm test` (cloud.test.js hariç) geçti; 17 ekran açıldı, konsol hatası yok. Telefon / koyu tema / 5000 kayıt bu turda ayrıca denenmedi. `sw.js` V artırıldı.

## 1. Kaynaklar
- Şikâyetler (Şikâyetvar, 30.10.2026): Simpra "sürekli çöküş, masalar kapanmıyor" (`sikayetvar.com/simpra-suite/simpra-pos-sistemindeki-surekli-cokus-ve-yetersiz-destek-bizim-isimizi-felc-etti`), Menülüx destek ve uzun süren arızalar (`sikayetvar.com/menulux-pos-sistemleri`), Vega "iskonto POS'a yansımıyor" (`sikayetvar.com/vega-yazilim/iskonto-posa-yansimiyor-ve-destek-yok`).
- Mevzuat: yukarıda H1.

## 2. Sonraki dalga adayları
- Yemek platformları (Yemeksepeti, Getir, Trendyol Yemek, Migros) resmî API dokümanı doğrulaması (şu an simülasyon / webhook).
- Masa birleştirme / ayırmada bahşiş ve indirimin taşınması kuralı.
