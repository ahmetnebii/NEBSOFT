# Kuru Temizleme & Halı Yıkama: ürün spesifikasyonu

Durum: **kullanıcı onayı bekliyor.** Görev verenin isteğiyle temel ve beklenen dalga spec'ten sonra geliştirildi. Program kimliği `kurutemizleme`, kod `apps/kurutemizleme/`, ortak motor `apps/siparisortak/`.

## Pazar araştırması (okuma: 2026-10-30)

Bulgu: Kuru temizlemeye özgü, markası bilinen bir Türk yazılımı **bulunamadı** (DOĞRULANAMADI). Bulunanlar halı yıkama odaklı küçük mobil uygulamalar.

| Ürün | Kaynak | Öne çıkan ihtiyaç |
|---|---|---|
| UstaPOS Halı Yıkama | https://apps.apple.com/tr/app/ustapos-hal%C4%B1-y%C4%B1kama-otomasyonu/id1547260422 | Konum ve rota, arayan müşteri tanıma, Bluetooth fiş, silinmeyen halı etiketi |
| MisPaQ Halı Takip | https://apps.apple.com/app/mispaq/id6760352476 | Çok adres, durak sıralama, mesaj şablonları, fason iş, müşteri takip linki |
| Halı TR | https://apps.apple.com/at/app/hal%C4%B1-tr/id6480406678?l=en-GB | Araç başına ekran, raf sistemi, etiket, eski müşteriye toplu SMS |
| Dehapos | https://apps.apple.com/us/app/id1553131502 | Alınacak ve teslim edilecek bildirimi, cari geçmiş |
| Cyristal (eski masaüstü) | https://www.tamindir.com/indir/hali-yikama-ve-temizleme-is-takip-programi/ | İş emri, günlük teslim listesi, makbuz |

NegroPos sayfası 404 verdi, yalnız arama özeti görüldü: sayılmadı.

Yazılıma özel şikâyet: yalnız UstaPOS App Store yorumları (güncelleme yok, donma, destek dönmüyor). Şikâyetvar'da bu yazılımlar için kayıt bulunamadı. Google Play yorumları okunamadı. Aşağıdaki diğer şikâyetler işletmelere aittir, yazılıma değil.

## Şikâyetlerin karşılanması

| Şikâyet | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| m² şişirme, 10 yerine 11 m² | [Diyar](https://www.sikayetvar.com/diyar-hali-yikama/olcu-hilesiyle-ucret-artirimi-ve-temizlenmemis-halilar-uzerine-sikayet) | En × boy fişe yazılır, m² otomatik; sonradan tutar değişimi geçmişe yazılır | Var |
| Fiş verilmedi, leke sonradan mı çıktı | [Bypak](https://www.sikayetvar.com/bypak-kuru-temizleme/bypak-kurutemizleme-zarar-verdikleri-bu-ceketimin-ucretinin-karsilamasini-istiyorum) | Teslim alınırken durum kaydı, fotoğraf, müşteri imzası, fişte yazılı durum | Var |
| Önceden var olan leke tartışması | [Özveren](https://www.sikayetvar.com/ozveren-hali-yikama/ozveren-hali-yikama-da-halima-zarar-verdiler-telafi-etmiyorlar) | Aynı kayıt; sözlü söz kaydın geçmişine not edilir | Var |
| Söz verilen gün gecikti | [Temiz.co](https://www.sikayetvar.com/temizco/temizco-taahhut-edilen-cumartesi-utu-teslimi-gecikti) | Gecikme işareti, teslim takvimi, söz değişince iz | Var; gecikmeden önce otomatik SMS yok |
| Program donuyor, güncellenmiyor | UstaPOS yorumları | Tarayıcıda çalışır, kurulum yok | Var; büyük veri denemesi kalite kapısında |
| Hasar sorumluluğu | [Dry Center](https://www.sikayetvar.com/dry-center-kuru-temizleme/dry-center-istanbul-subesinde-yuksek-degerli-kazaklarin-kuru-temizleme-sonrasi-zarar-gormesi) | Durum kaydı dayanak olur; tazminat akışı yok | Kısmen |
| Kayıp eşya | Doğrudan okunmuş kaynak yok | Parça etiketi, raf, teslimde parça sayımı | Var (ihtiyaç çıkarımdır) |

## Özellikler

### Olmazsa olmaz

| Özellik | Durum | Kaynak |
|---|---|---|
| Fiş: müşteri, kalem, tutar, teslim tarihi | Var | Ortak özellik |
| m² hesabı (en × boy) | Var | UstaPOS, MisPaQ |
| Durum akışı ve pano | Var | MisPaQ, Halı TR |
| "Hazır" SMS'i; bağlı değilse TEST yazar | Var | `CLAUDE.md` §1 |
| Tahsilat, kapora, kalan | Var | Ortak özellik |
| Teslim alınırken durum kaydı, imza | Var | Şikâyetler |
| Telefonla müşteri bulma | Var | UstaPOS |

### Beklenen

| Özellik | Durum | Kaynak |
|---|---|---|
| Adresten alma ve dağıtım listesi, şoför atama, harita bağlantısı | Var | UstaPOS, MisPaQ |
| Parça etiketi (`NS.docs`) ve raf | Var | UstaPOS, Halı TR |
| Teslimde parça sayımı | Var | Çıkarım |
| Müşteri takip sayfası ve puan | Var | MisPaQ, Halı TR |
| Adresten alma talebi (müşteri sayfası) | Var | Networkdry akışı |
| Durum fotoğrafı | Var | Şikâyetler |
| Teslim alınmayan eşya listesi, hatırlatma | Var | Çıkarım |
| Şoför rolü: yalnız kendi işi (sunucuda) | Var | Halı TR |

### Fark yaratan (yapılmadı)

| Özellik | Durum |
|---|---|
| Rota optimizasyonu, canlı konum | Yok: harita bağlantısı var, sıralama saate göre |
| Arayan müşteri tanıma (santral) | Yok |
| Fason iş akışı | Yok |
| Hasar ve anlaşmazlık dosyası | Yok |
| Gecikmeden önce otomatik müşteri SMS'i | Yok |
| Kurumsal müşteri (otel) cari ve toplu fiş | Yok |
| Eski müşteriye toplu SMS | Yok: ticari ileti, onay gerektirir |

## Bilinmeyenler

- Teslim alınmayan eşyada bekleme süresinin hukuki karşılığı: DOĞRULANAMADI. Ayar serbest metin değil gün sayısıdır, varsayılanı boştur.
- m² yuvarlama kuralı ve asgari tutar işletmeye göre değişir: program yuvarlamaz, 2 hane tutar.
