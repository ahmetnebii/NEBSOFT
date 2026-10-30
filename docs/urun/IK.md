# İK (Personel & Puantaj & Bordro) — Ürün Spesifikasyonu

> **Durum (30.10.2026):** 1., 2. ve 3. dalga tamamlandı. Program: `apps/ik/` (`bordro.js` hesap, `calisan.html` çalışan portalı). Kabul (kullanıcı/pilot işletme) bekliyor.

## CANLIYA ÇIKMAYI ENGELLEYENLER
- **SGK işe giriş/çıkış, banka toplu maaş, e-Bordro, PDKS — DOĞRULANAMADI:** resmî entegrasyon dokümanı yok → yalnızca simülasyon (TEST), gerçek gönderim yapılmaz. SGK bildirimleri e-Bildirge'den elle yapılır; Özet ekranı son günleri hatırlatır, "Bildirdim" işareti yalnızca kullanıcının beyanıdır.
- **Raporlu gün varsayılanı kullanıcı kararı bekliyor:** mevcut bordroyu bozmamak için raporlu günler varsayılan olarak tam ücretli sayılır, bordroda uyarı çıkar. 5510 md. 18 ödeneği hastalıkta 3. günden itibaren SGK öder; md. 86 ücret ödenmeyen günün eksik gün bildirilmesini ister. Rapor süresinde ücret ödemeyen işletme Ayarlar'dan "Raporlu günler SGK gününden düşsün"ü açmalı. Hangi varsayılanın doğru olduğunu mali müşavir teyit etmeli.
- **Eksik gün neden kodları, SGK işten çıkış kodları — DOĞRULANAMADI:** resmî liste okunamadı; program kod önermez, çıkış kodunu kullanıcı yazar (eski kodda her çıkış sabit "04" gidiyordu).
- **Çalışan portalı bulutta denenmedi:** kural testi var, tarayıcıda yalnızca yerel sunucuda açıldı. Pazar kataloğu (`market/catalog.js`) ve `server/cloud/seo.js` portal bağlantısı eklenmedi (kapsam dışı).
- **Şikâyet verisi:** Türk İK yazılımları için kullanıcı şikâyeti bulunamadı; öncelikler özellik sayfalarına ve kod incelemesine dayanır.

## Doğrulananlar
- **Bordro parametreleri — DOĞRULANDI (30.10.2026):** asgari ücret günlük 1.101 ₺ = 33.030 ₺ (RG 26.12.2025/33119); SGK işçi %14, işsizlik işçi %1, işveren %21,75 + işsizlik %2, prim indirimi imalat 5 / diğer 2 puan (`csgb.gov.tr/poco-pages/asgari-ucret/`); SGK tavanı 9 kat (5510 md. 82); ücret gelir vergisi tarifesi (GV Genel Tebliği 332, RG 31.12.2025/33124 5. Mük.); damga binde 7,59 (488 s.K. tablo IV-1-b); kıdem tavanı 73.729,87 ₺ (01.07.2026, csgb.gov.tr Temmuz 2026 tablosu).
- **UYUMSUZ bulunup düzeltilen:** kıdem tavanı 64.948,77 → 73.729,87 ₺; prim indirimi 5 → 2 puan varsayılan (imalat işletmesi Ayarlar'dan 5 yapar).
- Not: Çalışma Bakanlığı sayfasının dipnotu 5510 md. 81/ı'ya 5 puan diyor, kanun metninde bu bent 2 puan; ayrıca 7590 s.K. (24/7/2026) md. 81'de bir fıkrayı yürürlükten kaldırmış, hangisi olduğu okunamadı. Mali müşavirin bir kez bakması yararlı.
- **4857 sayılı İş Kanunu — DOĞRULANDI** ([mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.htm), okundu 30.10.2026): md. 17 ihbar 2/4/6/8 hafta (6 ay, 1,5 yıl, 3 yıl); md. 28 çalışma belgesi; md. 41 fazla çalışma %50, yılda en çok 270 saat; md. 46 hafta tatili; md. 47 tatilde çalışılan gün için bir günlük ücret daha; md. 53 izin süreleri; md. 54, 59 izin hakkı; md. 56 tatiller izne eklenir, bir bölümü en az 10 gün, 4 güne kadar ücretsiz yol izni; md. 57 izin ücreti izinden önce; md. 63 haftalık 45 saat; md. 68 ara dinlenme; md. 69 gece 20:00–06:00, en çok 7,5 saat.
- **5510 sayılı Kanun — DOĞRULANDI** ([mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5510.htm), okundu 30.10.2026): md. 8 işe giriş bildirgesi sigortalılık başlamadan önce; md. 9 ayrılış en geç 10 gün içinde; md. 18 ödenek; md. 86 eksik gün bildirimi, kayıtlar 10 yıl saklanır.
- **2429 sayılı Kanun — DOĞRULANDI** ([mevzuat.gov.tr/mevzuatmetin/1.5.2429.htm](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.2429.htm), okundu 30.10.2026): sabit tatil günleri. Dinî bayram tarihleri her yıl değişir: resmî takvim doğrulanmadığı için program tarih yazmaz, Ayarlar'dan girilir. Arefe ve 28 Ekim yarım günleri ayrıca işlenmiyor.

## 1. Pazar araştırması (30.10.2026)
Satıcı tanıtımlarıdır; iddialar bağımsız doğrulanmadı. Yalnızca hangi ihtiyacın karşılandığı çıkarıldı.
- [Kolay İK Puantaj](https://kolayik.com/puantaj), [PDKS](https://kolayik.com/pdks): PDKS'ten otomatik puantaj, departman/kişi bazlı çalışma takvimi, planlanan-gerçekleşen karşılaştırma, geç giriş uyarısı, mali müşavire dışa aktarım, yetkiye göre erişim.
- [WOLVOX İK](https://akinsoft.com.tr/programlar/e-katalog/wolvox_hrm_v7.pdf): toplu/tekil puantaj ve bordro, izin formları. PDF metni okunamadı; arama özetinden.
- [Barkodes](https://www.habergazetesi.com.tr/personel-devam-kontrol-sistemlerinde-yeni-donem-barkodesten-yerli-ve-akilli-cozumler) (haber): vardiya planlama, puantaj, izin.
- [BIOSOFT Maaş-Bordro](https://www.ciceksepeti.com/biosoft-maas-bordro-yazilimi-hikvision-pdks-kcm12252797): hak edilen, kullanılan, kalan izin takibi.
- [Alomaliye PDKS](https://alomaliye.com/programlar/personel-devam-kontrol-sistemi-programi-pdks-programi/): mesai kontrolü, şüpheli giriş-çıkış.

**Şikâyetler — bulunamadı:** Şikâyetvar aramasında Kolay İK için sayfa çıkmadı (benzer adlı başka markalar geldi); [G2](https://www.g2.com/products/kolay-ik/reviews) sonucunda tek inceleme var, şikâyet özeti yok.

| Özellik | Sınıf | Rakipte | Bizde (önce → sonra) |
|---|---|---|---|
| Puantaj, izin bakiyesi, bordro | Olmazsa olmaz | Var | Var, hatalı → düzeltildi |
| Dönem kapatma / geçmiş bordronun donması | Olmazsa olmaz | Belirtilmemiş | Yok → var |
| Rol bazlı erişim | Olmazsa olmaz | Var | Kırık → düzeltildi |
| Vardiya planı | Beklenen | Var | Yok → var |
| İzin onay akışı | Beklenen | Var | Eksik → var |
| Mali müşavire dışa aktarım | Beklenen | Var | Excel var |
| Çalışan self-servisi | Fark yaratan | Sayfada açık değil | Yok → portal |
| Süreli belge ve zimmet | Fark yaratan | Belirtilmemiş | Yok → var |
| Yasal son gün hatırlatması | Fark yaratan | Belirtilmemiş | Yok → var |
| Planlanan-gerçekleşen karşılaştırma, geç giriş uyarısı | Beklenen | Var | Yok (PDKS bağlantısı gerekir) |

## 0. Yapılanlar — 1. dalga
| # | Sorun | Sonuç | Kanıt |
|---|---|---|---|
| H1 | **PDKS simülasyonu uydurma giriş-çıkış saatlerini puantaja yazıyordu** (fazla mesai → maaş) | Simülasyonda hiçbir kayıt işlenmez: "PDKS TEST — cihaz bağlı değil" | Tarayıcı: puantaj verisi değişmedi |
| H2 | SGK işe giriş/çıkış simülasyonu kartta "SGK giriş ✓" gösteriyordu | Yalnızca gerçek bildirimde ✓; simülasyonda "SGK giriş TEST (bildirilmedi)" | Kod incelendi |
| H3 | Banka toplu maaş simülasyonu "bankaya iletildi" deyip ayı ödendi işaretliyordu | "Banka TEST — gönderilmedi; ödendi işaretlenmedi" | Tarayıcı: `paid_*` ayarı yok |
| H4 | e-Bordro simülasyonu "iletildi" diyordu | "e-Bordro TEST — gönderilmedi" | Tarayıcı |
| H5 | Tam 5 yılını dolduran personele 20 gün izin veriliyordu (madde: "beş yıl dahil" 14); yaş alt sınırı ve yer altı eki yoktu — UYUMSUZ | Düzeltildi; personel kartına "yer altı" ve "sözleşmeyle ek izin" | Tarayıcı: 55 yaş/2 yıl → 20, 5 yıl → 14, 6 yıl yer altı → 24 |
| H6 | Bordro varsayılanları kaynaksız ve kısmen eskiydi | Resmî kaynaktan doğrulandı, eskiler düzeltildi; yıl değişince ekranda güncelleme uyarısı | Yukarıdaki kaynaklar |

## 2. dalga — kırık temel ve beklenenler
| # | Konu | Sonuç | Kanıt |
|---|---|---|---|
| B1 | **Şef tüm maaşları görüyordu:** maaş sütunu, CSV, tazminat, düzenle ve sil açıktı. Departmanı atanmamış şef tüm şirketi görüyordu | Şefte salt okunur, maaş sütunu ve dışa aktarma yok; departmansız şef kimseyi görmez, uyarı alır. Ayarlar'a şef departmanı eklendi (çekirdek kullanıcı formunda alan yok). Şef PDKS aktaramaz, Özet sayıları kendi departmanı | Tarayıcı: 7 kişi, tek departman, işlem düğmesi yok; departmansız 0 kişi |
| B2 | **Tam 1. yıl gününde kıdem 0 çıkıyordu** (365,25'e bölme); ihbar süresi sınır günlerinde kayıyordu | Takvimle tam yıl ve ay; artan süre orantılı | `bordro.test.js` |
| B3 | İzin yalnızca takvim yılını sayıyor, kullanılmayan izin ertesi yıl yanıyordu (md. 54, 59); hak 365'e bölme ile erken/geç doluyordu | Yıldönümünde hak doğar, bakiye birikir; takipten önceki yıllar için "devreden izin" alanı | `bordro.test.js`, tarayıcı: portal 18 kalan / 20 hak / 2 kullanılan |
| B4 | İzin talebi takvim günü sayıyordu (Pazar ve tatiller düşüyordu, md. 56'ya aykırı); onaylı izin iptal edilemiyordu; aynı tarihte iki izin onaylanabiliyordu; onayda hak kontrolü yoktu | İş günü sayılır; iptal puantajı eski haline döndürür; çakışma engeli; şef hak aşımında yönetici PIN'i (`NS.approve`) | Tarayıcı: 16–22.11 → 6 iş günü, Pazar boş kaldı; iptal geri aldı; yanlış PIN reddedildi, doğru PIN onayladı |
| B5 | **Pasife alınan personelin son maaşı bordrodan düşüyordu**, SGK kapalıyken çıkış tarihi de yazılmıyordu | "İşten çıkış" akışı: tarih, neden, SGK kodu, zimmet uyarısı, tazminat penceresi, ayrılış son günü; ay içinde ayrılan o ayın bordrosunda; yeniden işe alma | Tarayıcı: 15.10 çıkış → 15 gün, 16.250 ₺ |
| B6 | Personel silinince puantaj, izin ve avans sahipsiz kalıyordu | Bağlı kaydı olan silinemez, işten çıkışa yönlendirir (5510 md. 86) | Tarayıcı |
| B7 | **Bordro canlı hesaplanıyordu:** maaş değişince geçmiş aylar değişiyordu | Dönem kapatma: tutarlar dondurulur, puantaj/avans/izin/çıkış kilitlenir, kümülatif matrah kapalı aydan gelir; dönem açma; ödendi işareti | Tarayıcı: maaş 99.999 yapıldı, kapalı ay 33.705,36 ₺ kaldı; puantaj hücresi değişmedi |
| B8 | Telefonda fazla mesai girilemiyordu (yalnızca sağ tık) | "Fazla mesai gir" modu | Tarayıcı |
| B9 | Yıllık 270 saat sınırı yoktu | Girişte uyarı, puantajda işaret, Özet'te liste | Tarayıcı: 294 saatte uyarı ve Özet satırı |
| B10 | Tatilde çalışma ücreti yoktu (md. 47); dinî bayramlar çalışma günüydü | "T · Tatilde çalıştı" + bir günlük ücret; Ayarlar'da tatil günleri, eksikse uyarı | Tarayıcı: 1 gün tatil 935,85 ₺ eklendi |
| B11 | Avans silinemiyordu; neti aşınca uyarı yoktu | Ay listesi, silme, uyarı | Tarayıcı (ekleme); silme kod incelendi |
| B12 | Tüm ayı ücretsiz izinli çalışanda Şubat'ta 2 gün SGK kalıyordu | Tam ay eksikte 0 gün | Kod incelendi |
| B13 | Yazdırılanlar elle HTML'di | Pusula, ödeme listesi, tazminat, puantaj `NS.docs` üzerinden; toplu pusula sayfa sayfa | Tarayıcı (belge üretildi); kâğıtta denenmedi |
| B14 | TC, IBAN denetimi yoktu; departman listesi sabitti | Kontrol hanesi denetimi (yalnızca değişen alanda, eski kayıt bozulmaz), mükerrer TC, Ayarlar'dan departman | Tarayıcı (TC), `bordro.test.js` |
| B15 | Hız: izin hesabı her personelde tüm puantajı tarıyordu | Tek geçişte özet; netten brüt ve parametre önbelleği | Tarayıcı: 2.000 personel + 560.000 hücre: Özet 1,1 sn, İzin 1,2 sn, Personel 2,6 sn, Bordro 4,9 sn. Bordro hâlâ yavaş, kapalı ay anında gelir |

## 3. dalga — fark yaratanlar
| # | Özellik | Sonuç | Kanıt |
|---|---|---|---|
| F1 | Vardiya planı | Haftalık tablo, vardiya türleri, geçen haftayı kopyala, yazdır; 45 saat, hafta tatili ve gece 7,5 saat uyarısı; ara dinlenme düşülür; hafta tatili "Bugünü doldur"a yansır | Tarayıcı: 52,5 saatte uyarı, yazdırma. SMS gönderimi kod incelendi (`NS.smsBatch`, gerçek sonuç) |
| F2 | Çalışan portalı (`calisan.html`) | Telefon + kod; izin bakiyesi, talep gönderme, vardiya, kapatılmış bordro. TC, IBAN, işveren maliyeti çıkmaz | `ik-kural.test.js`; tarayıcı yerel sunucuda, telefon genişliği; **bulutta denenmedi** |
| F3 | Belge ve zimmet | Süreli belge, 30 gün uyarısı, zimmet tutanağı, çıkışta zimmet uyarısı | Tarayıcı |
| F4 | Yasal yapılacaklar | Özet'te SGK giriş/ayrılış son günü ve dolan belgeler | Kod incelendi |
| F5 | Çalışma belgesi (md. 28), izin formu | `NS.docs` | Tarayıcı (izin formu); çalışma belgesi kod incelendi |
| F6 | İzin kararında SMS | Ayarla açılır, gerçek sonuç gösterilir | Kod incelendi |

**Yapılmadı:** arefe ve 28 Ekim yarım günü; denkleştirme; serbest zaman (md. 41); planlanan-gerçekleşen karşılaştırma; işe alım; performans; yetkilerin sunucuda zorlanması (şef sınırı yalnızca arayüzde, bkz. `docs/urun/CEKIRDEK-ISTEKLERI-ik-eczane.md`).

Kalite kapısı: bkz. rapor. 8 ekran + portal açıldı, konsol hatası yok; 375 px genişlikte yatay taşma yok; koyu tema ve boş liste bakıldı. Kâğıda basım denenmedi.
