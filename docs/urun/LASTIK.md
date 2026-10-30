# Lastikçi & Oto Yedek Parça (`apps/lastik`)

Durum: temel dalga ve beklenenlerin çoğu yazıldı, **kullanıcı onayı bekliyor**. Tarih: 30.10.2026.
Kaynaklar, şikâyet bağlantıları ve mevzuat tablosu: [arastirma/arastirma-lastik.md](arastirma/arastirma-lastik.md).

## CANLIYA ÇIKMAYI ENGELLEYENLER
| Konu | Etiket | Programdaki karşılığı |
|---|---|---|
| TecDoc lisansı ve fiyatı | DOĞRULANAMADI | Bağlantı **yok**. OEM, muadil ve uyduğu araç elle girilir; katalogda yazıyor |
| Lastik etiketleme satıcı yükümlülüğü (md. 6) | DOĞRULANAMADI | Etiket özelliği yok, iddia yok |
| Satış Sonrası Hizmetler ek liste, lastik satırı | DOĞRULANAMADI | Süre sayacı yok |
| 2918 md. 65/A'nın güncel hâli | DOĞRULANAMADI | Metinde ceza bilgisi yok |
| DOT yaş sınırı | Resmî hüküm bulunamadı, kesin "yok" DOĞRULANAMADI | Eşik işletme tercihidir, ekranda öyle yazar |
| Eşdeğer parça tanımı (Rekabet Kurumu 2017/3) | DOĞRULANAMADI | Ekranda "muadil" denir, yasal eşdeğerlik iddiası yok |
| Eski lastik 60 gün | Araştırma md. 5(1)(f) dayanağı, satır ayrıntısı gözden geçirilmeli | Süre ayardan gelir, "uyarı sınırı" diye gösterilir, yükümlülük iddiası yok |
| Canlı test | Yapılmadı | SMS ve e-Belge sağlayıcı hesabıyla denenmedi |

## Doğrulanan mevzuat
- Kış lastiği tebliği md. 5: dönem 15 Kasım – 15 Nisan, valilik değiştirebilir. Ekranda valilik kararını kontrol uyarısı var.
- TBK md. 561-567: saklama sözleşmesi. Giriş formu ve imza kaydı bunu destekler, şart metni işletmenindir.
- 6502 md. 8, 11, 12, 56: ayıp ve garanti. Garanti kaydı yalnız takip amaçlıdır.

## Pazar
İncelenen: Lastsis, Servislet, AysimaPOS, Senkronix, Vilyonix (herkese açık sayfalar). Ürünler canlı denenmedi. Şikâyetler Şikâyetvar liste ve arama özetlerinden, 10 tema.

## Özellikler
| Sınıf | Özellik | Durum | Dayanak veya şikâyet |
|---|---|---|---|
| Olmazsa olmaz | Otel kaydı: 4 lastik DOT ve diş, raf, giriş ve çıkış, imza | Var | Şikâyet 1, 2 |
| Olmazsa olmaz | Giriş ve çıkış formu, etiket ve QR | Var | TBK 561-566 |
| Olmazsa olmaz | Çıkışta etiket, plaka ve sayı doğrulaması | Var, eşleşmezse teslim yok | Şikâyet 2 |
| Olmazsa olmaz | Ebatla arama, DOT, indeks, mevsim, yaş uyarısı | Var, her DOT ayrı satır | Şikâyet 4, 5 |
| Olmazsa olmaz | Parça kodu, OEM, muadil, uyduğu araç, raf | Var, elle | AysimaPOS |
| Olmazsa olmaz | Cari, limit, ekstre, tahsilat | Var | Lastsis |
| Olmazsa olmaz | İş emri: km, rot ölçümü, tork, basınç, usta | Var. Tork fişe yazılır | Şikâyet 6, 7 |
| Olmazsa olmaz | e-Arşiv | `NS.ebelge.create`, canlı denenmedi | Lastsis |
| Olmazsa olmaz | SMS: otele alındı, iş hazır, sezon | Var, TEST ayrımlı | Lastsis |
| Beklenen | Plakadan iş ve otel geçmişi, DOT dahil | Var | Şikâyet 7, 8 |
| Beklenen | Sezon hatırlatma | Var | Servislet |
| Beklenen | Garanti kaydı | Var | Şikâyet 8 |
| Beklenen | Kritik stok, eski DOT süzgeci | Var. Barkodlu sayım, atıl stok raporu yok | Lastsis |
| Beklenen | Raf doluluğu | Var, tek depo | Senkronix |
| Beklenen | Eski lastik defteri | Var | ÖTL Yön. |
| Beklenen | Ek ücretler ayrı kalem, saklama ücreti tek kez | Var | Şikâyet 9 |
| Fark yaratan | Müşteri sorgu sayfası, teslim talebi | Var. Raf gizli | Şikâyet 3 |
| Fark yaratan | DOT yaş renkleri | Var, eşik işletmenin | Şikâyet 4 |
| Fark yaratan | Fotoğraflı dijital teslim, TecDoc, çok şube | Yok | Sonraki dalga |

## Fiyat
Katalogdaki fiyat **örnektir** (`fiyatOrnek: true`). Kullanıcı belirleyecek.
