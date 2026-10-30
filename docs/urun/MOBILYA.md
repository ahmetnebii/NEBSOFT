# Mobilya & Özel İmalat (`apps/mobilya`)

Durum: temel dalga ve beklenenler yazıldı, **kullanıcı onayı bekliyor**. Tarih: 30.10.2026.
Kaynaklar, şikâyet bağlantıları ve mevzuat tablosu: [arastirma/arastirma-mobilya.md](arastirma/arastirma-mobilya.md).

## CANLIYA ÇIKMAYI ENGELLEYENLER
| Konu | Etiket | Programdaki karşılığı |
|---|---|---|
| Kapora ve ön ödeme hükmü (TBK okunmadı, 6502'de genel hüküm bulunamadı) | DOĞRULANAMADI | Program kaporayı ve iadeyi kaydeder, "iade edilmez" gibi sabit metin yoktur. Sözleşme metni işletmenin, avukata gösterilir |
| Yüz yüze özel siparişte vazgeçme | DOĞRULANAMADI | Metin yazılmadı |
| Mobilya kullanım ömrü ve azami tamir süresi tablosu (Satış Sonrası Hizmetler Yön. eki) | DOĞRULANAMADI | Programda yok. Sayaç 6502 m.11'deki 30 iş günüdür |
| Atölye üretici mi, satıcı mı (garanti belgesi yükümlülüğü) | DOĞRULANAMADI | Garanti belgesi metni Ayarlar'dan girilir |
| Canlı test | Yapılmadı | SMS ve e-Belge sağlayıcı hesabıyla denenmedi; simülasyon TEST yazar |

## Doğrulanan mevzuat (mevzuat.gov.tr PDF, 30.10.2026)
- 6502 m.8: süresinde teslim etmeme ve satıcının sorumlu olduğu montajın gereği gibi yapılmaması ayıplı ifa sayılır.
- 6502 m.10: ilk 6 ay ayıp teslimde var sayılır. m.11: dört seçimlik hak, onarım ve değişim için azami 30 iş günü. m.12: 2 yıl zamanaşımı. m.56: asgari 2 yıl garanti.
- Mesafeli Sözleşmeler Yön. m.15/1-b: kişisel isteğe göre hazırlanan malda, aksi kararlaştırılmadıkça cayma kullanılamaz. Program bu notu yalnız satış şekli "Mesafeli" olan işin sözleşmesine ekler.
- Garanti Belgesi Yön. ek liste satır 17: ahşap ve metal mobilya 2 yıl.

## Pazar
İncelenen: ÖzgürKod, Mobilya Takip, Delbig (sayfaları okundu); ADeko, Workcube, Teowin sayfaları açılamadı, özellikleri DOĞRULANAMADI. Ürünler canlı denenmedi. Boşluk: bakılan ürünlerin hiçbirinde ölçü onayı, kapora, üretim, montaj ve garanti birlikte değil.

## Özellikler
| Sınıf | Özellik | Durum | Dayanak veya şikâyet |
|---|---|---|---|
| Olmazsa olmaz | Sürümlü ölçü, fotoğraf, müşteri ölçü imzası | Var | Şikâyet 3 (ölçü hatası) |
| Olmazsa olmaz | Kalemli teklif, link veya imzayla onay, onaylı sürüm kilidi, değişiklik yeni sürümle | Var | Şikâyet 9 (fiyat farkı) |
| Olmazsa olmaz | Termin, kapora, ara ve son ödeme, iade, makbuz | Var. Vadeli ödeme planı yok | Şikâyet 1, 2 |
| Olmazsa olmaz | Durumlar: talep, ölçü, teklif, kapora, üretim, montaj, teslim, iptal | Var | ÖzgürKod, Delbig |
| Olmazsa olmaz | Montaj takvimi, ekip çakışma uyarısı, imzalı teslim tutanağı, eksik listesi | Var | Şikâyet 4, 5 |
| Olmazsa olmaz | Ayıp ve servis kaydı: 6 ay, 30 iş günü, 2 yıl göstergesi | Var. İş günü resmî tatilleri düşmez | Şikâyet 7 |
| Olmazsa olmaz | Garanti belgesi çıktısı | Var | Yönetmelik ek listesi |
| Beklenen | Üretim föyü, aşama panosu, koli sayısı | Var. Kesim listesi yok | ÖzgürKod, şikâyet 4 |
| Beklenen | Gecikme haberi (Özet'ten, TEST ayrımlı) | Var. Otomatik değil, elle başlatılır | Şikâyet 2, 8 |
| Beklenen | Malzeme stoğu, eksik malzeme listesi | Var. Tedarikçi termin takibi yok | Delbig |
| Beklenen | Müşteri takip sayfası | Var | Şikâyet 8 |
| Beklenen | Telefondan çalışma | Var (web). Ayrı çevrimdışı ekip uygulaması yok | ÖzgürKod |
| Fark yaratan | Revizyonda atölyeye "ölçü sürümü" uyarısı, stoktan yalnız fark düşme | Var | Şikâyet 3 |
| Fark yaratan | Kanıt paketi tek dosyada, memnuniyet anketi, duvar krokisi | Yok, sonraki dalga | Şikâyet 1, 10 |

## Roller (sunucuda, `rol-kural.js`)
Atölye ustası ve montaj ekibine fiyat, maliyet, ödeme gönderilmez. Usta telefon ve adres de görmez; yalnız aşama, not, koli yazar. Montaj ekibi yalnız kendi işini görür, eksik listesi ve fotoğraf yazar.

## Fiyat
Katalogdaki fiyat **örnektir** (`fiyatOrnek: true`), oto servis fiyatı yer tutucu olarak yazıldı. Kullanıcı belirleyecek.
