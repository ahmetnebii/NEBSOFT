# Çiftçi & Kooperatif (`apps/ciftci`)

Durum: temel dalga ve beklenenler yazıldı, **kullanıcı onayı bekliyor**. Tarih: 30.10.2026.
Kaynaklar ve 27 satırlık mevzuat tablosu: [arastirma/arastirma-ciftci.md](arastirma/arastirma-ciftci.md).

## CANLIYA ÇIKMAYI ENGELLEYENLER
| Konu | Etiket | Programdaki karşılığı |
|---|---|---|
| Kooperatif zorunlu defter listesi (1163 md. 89 yollaması, tebliğ okunmadı) | DOĞRULANAMADI | "Ortak listesi" var, resmî defter yerine geçtiği söylenmez |
| KDV tevkifatı ve tarım ürünü KDV oranları | DOĞRULANAMADI | Alımda KDV hesabı yok. Girdi satışı KDV oranı Ayarlar'dan gelir, varsayılan 20 işletme tarafından kontrol edilmeli |
| HKS bildirim eşiği ve web servisi | DOĞRULANAMADI | HKS bildirimi **yok**, katalogda yazıyor |
| B-Reçete fiilî durumu ve bayi API'si | DOĞRULANAMADI | Reçeteli ürüne elle reçete no istenir, bağlantı iddiası yok |
| ÇKS EK-1 alan listesi | DOĞRULANAMADI | Parsel alanları ÇKS Yön. md. 6, 7'den çıkarıldı, eşleşme iddiası yok |
| Stopaj ve makbuz için tutar eşiği | DOĞRULANAMADI | Eşik uygulanmaz |
| Kooperatif ortağından alımda istisna ayrımı | Mali müşavire sorulacak | Alımda "Stopaj uygulanmaz" kutusu var |
| e-Müstahsil | Canlı denenmedi | `NS.ebelge` e-Müstahsil desteklemiyor; fabrika ile aynı `NS.integ.call('emustahsil')` yolu kullanıldı. Simülasyon TEST yazar |
| Üretici Kayıt Defteri (ÜKD) uyumu | DOĞRULANAMADI | Tarla defteri var, ÜKD uyumu iddia edilmez |

## Doğrulanan mevzuat (ayrıntı araştırma dosyasında)
- GVK 94/11, 2009/14592 sayılı Karar ve GİB tablosu: hayvansal borsa tescilli %1, tescilsiz %2; diğer ürün borsa tescilli %2, tescilsiz %4. Oranlar **ayar** olarak tutulur.
- VUK 235: müstahsil makbuzu iki nüsha, asgari alanlar. Numara kesintisiz, silme yok.
- 1163 md. 38, 39: gelir-gider farkı muamele oranında dağıtılır, en az %10 yedek akçe, zararda dağıtım yok. Kanun metninde "risturn" adı geçmez, ekranda "gelir-gider farkı" denir.
- 509 sıra no.lu VUK GT (düzeltildi, bağımsız denetim 31.10.2026): e-Fatura mükellefi olup müstahsil makbuzu düzenleyenler ve HKS kapsamındaki sebze meyve tüccar ve komisyoncuları için e-Müstahsil zorunludur; diğerleri için isteğe bağlıdır. Kaynak: https://ebelge.gib.gov.tr/emustahsilhakkinda.html
- BKÜ bayi yükümlülükleri RG 13.12.2025: reçeteli ürünün reçetesiz satılmaması. ÇKS takvimi: başvuru 1 Eylül – 31 Aralık, güncelleme 15 Mart – 15 Nisan (Tarlalar ekranında dönemde görünür).

## Pazar
3-5 "lider" ürün bulunamadı; 10 küçük ürün incelendi (Eva, Comport, Aves, OliveOS, TMP, SBTPro, AKINSOFT Çiftçi Koruma, Sütçü Mobil, Tarla.pro, Tarım Cebimde). Ürünlere ait Şikâyetvar ve Play yorumu bulunamadı; 7 tema yakın kaynaklardan çıkarıldı, güvenilirliği düşüktür.

## Özellikler
| Sınıf | Özellik | Durum | Dayanak veya şikâyet |
|---|---|---|---|
| Olmazsa olmaz | Üretici kartı: köy, telefon, IBAN, ortaklık, pay | Var | 1163 md. 16, 19 |
| Olmazsa olmaz | Kantar alımı: brüt, dara, fire, fiyat | Var. Kantar cihazı bağlı değil | Comport, OliveOS |
| Olmazsa olmaz | Müstahsil makbuzu, kesintisiz numara, iptal | Var | VUK 235 |
| Olmazsa olmaz | Stopaj: ürün grubu, borsa tescili, ayardan oran | Var | GVK 94/11 |
| Olmazsa olmaz | Üretici carisi: girdi, ürün bedeli, ödeme, ekstre | Var | Eva, Comport |
| Olmazsa olmaz | Roller, silinemeyen makbuz | Var | VUK 235 |
| Olmazsa olmaz | Reçeteli ürün uyarısı, reçete no kaydı | Var. Bayi Kontrol Defteri basımı yok | BKÜ Yön. |
| Beklenen | e-Müstahsil | Bağlı sağlayıcıyla, canlı denenmedi | 509 GT |
| Beklenen | Hasatta mahsup | Var: aynı cari, net ödenecek | Eva, tema 7 |
| Beklenen | Banka ödeme listesi (CSV) | Var. Banka biçimi doğrulanmadı | Eva |
| Beklenen | Parsel kaydı, ürün, sulama, mülkiyet | Var | ÇKS Yön. |
| Beklenen | Tarla defteri, verim, gider | Var | Tarla.pro |
| Beklenen | Gelir-gider farkı dağıtımı | Var, önizlemeli | 1163 md. 38, 39 |
| Beklenen | Stopaj dökümü (CSV) | Var, beyanname yerine geçmez | GVK 94 |
| Fark yaratan | Risk limiti uyarısı | Var, elle limit | Boşluk |
| Fark yaratan | Üretici portalı | Var, salt okunur | Sütçü Mobil |
| Fark yaratan | Limiti parsel verimine göre hesaplama, çevrimdışı kantar, HKS, lisanslı depo | Yok | Sonraki dalga |

## Fiyat
Katalogdaki fiyat **örnektir** (`fiyatOrnek: true`). Kullanıcı belirleyecek.
