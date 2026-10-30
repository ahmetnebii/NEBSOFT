# Matbaa & Reklam Atölyesi: ürün spesifikasyonu

Durum: **kullanıcı onayı bekliyor.** Görev verenin isteğiyle temel ve beklenen dalga spec'ten sonra geliştirildi. Program kimliği `matbaa`, kod `apps/matbaa/`, ortak motor `apps/siparisortak/`.

## Pazar araştırması (okuma: 2026-10-30)

Özellikler satıcıların kendi sayfalarındandır, bağımsız doğrulama yoktur.

| Ürün | Kaynak | Öne çıkan ihtiyaç |
|---|---|---|
| MATPRO | https://matpro.com.tr/ | Fiyat hesaplı teklif, internetten onay, personel bazlı üretim, kiosk |
| PusulaERP Matbaa | https://matbaayazilimi.com/ | Baskı öncesi onay, MES, Gantt planlama, bakım |
| MatbaaSoft | https://matbaasoft.com/ | Kâğıt, baskı, fire maliyeti, kademeli adet fiyatı, tekliften iş emri |
| e-baski.com | https://www.e-baski.com/matbaa/ | İstasyon programı, koli etiketi, matbaalar arası iş paylaşımı |
| Prodio | https://getprodio.com/tr/baski-sektoru-ve-matbaalar/ | Atölye takibi, ürün şablonu, müşteri paneli |

TAM Matbaa ERP, Prozen, EraOFSET ve Net-X yalnız arama özetinden görüldü: sayılmadı. Türkçe, m² fiyatlı branda ve tabela atölyesine özel program **bulunamadı**; mevcut ürünler ofset ve kâğıt maliyetine ağırlıklı. Burası konumlanma fırsatıdır.

Yazılım ürünlerine özel şikâyet **bulunamadı**. Aşağıdakiler baskı hizmeti müşterilerinin şikâyetidir ve yalnız arama özetinden görülmüştür: tek tek açılıp doğrulanmadı.

## Şikâyetlerin karşılanması

| Şikâyet | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Çift yön yerine tek yön, lak yanlış yüze | [Reklam Durağı](https://www.sikayetvar.com/reklam-duragi/reklam-duragi-kartvizit-ve-branda-siparisinde-yasanan-sorunlar) | Yön, ebat, malzeme, son işlem kaleme yazılır; üretim kontrol listesi siparişten çıkar | Var |
| Yanlış renk | [Davetiyetube](https://www.sikayetvar.com/davetiyetubecom/yanlis-renk-davetiye-hayal-kirikligi-yaratti) | Onay ekranında "ekran rengi baskıdan farklı olabilir" uyarısı, hata nedeni raporu | Kısmen: renk provası takibi yok |
| Vaat edilen süre aşıldı | [Matbaakent](https://www.sikayetvar.com/matbaakent/matbaa-kentte-magnet-baski-gecikmesi-ve-ucret-iadesi-talebi) | Söz verilen tarih, gecikme işareti, takvim, istasyon sayaçları | Var; yüke göre önceden uyarı yok |
| Müşteriye ulaşılamıyor, onay karışıklığı | [Tuna](https://www.sikayetvar.com/tuna-copy-center/tuna-dijital-ankara-musterinin-isteklerini-umursamiyor) | Sürüm geçmişi: kim, ne zaman, hangi sürümü onayladı | Var |
| Paketleme hasarı | [Reha Davetiye](https://www.sikayetvar.com/reha-davetiye/yetersiz-paketleme-nedeniyle-brosurlerde-tekrarlanan-hasar) | Teslim ve paketleme fotoğrafı | Var |

## Özellikler

### Olmazsa olmaz

| Özellik | Durum | Kaynak |
|---|---|---|
| Teklif belgesi, işe dönüşme | Var | MatbaaSoft, MATPRO |
| m² ve adet fiyatı | Var | Araştırma boşluğu |
| Ebat, malzeme, yön, son işlem | Var | Şikâyetler |
| Tasarım onayı ve sürümler | Var | MATPRO, PusulaERP |
| Onaysız üretime geçiş engeli | Var | Şikâyetler |
| Üretim panosu | Var | Hepsi |
| Tahsilat, kalan | Var | Hepsi |

### Beklenen

| Özellik | Durum | Kaynak |
|---|---|---|
| Müşterinin bağlantıyla onayı veya düzeltme isteği | Var (sunucu kuralıyla) | MATPRO |
| Yüz yüze onay, onaylayan adı | Var | Çıkarım |
| Ücretsiz sürüm hakkı uyarısı | Var | Çıkarım |
| Üretim kontrol listesi | Var | Çıkarım |
| Hata ve yeniden üretim kaydı, neden raporu | Var | PusulaERP (fire), çıkarım |
| Rol: üretim maliyeti görmez (sunucuda) | Var | MATPRO |
| Adrese teslim ve montaj atama | Var | Çıkarım |

### Fark yaratan (yapılmadı)

| Özellik | Durum |
|---|---|
| Parametreli maliyet hesabı (kâğıt, kalıp, fire) | Yok: birim fiyat ve birim maliyet elle |
| Kademeli adet fiyatı | Yok |
| Dosya (PDF, AI) yükleme | Yok: `NS.dosya` yalnız görsel kabul eder, çekirdek ihtiyacı |
| Dış hizmet (lamine, kesim) takibi | Yok |
| Barkodlu istasyon ekranı, RFID | Yok |
| Yüke göre teslim tarihi önerisi | Yok |

## Bilinmeyenler

- Ekranda onaylanan görselin baskıyla aynı olduğu iddia edilmez; müşteri sayfası bunu açıkça yazar.
- Görsel sürüm adresi elle verilir. PDF yüklenemez: bkz. `CEKIRDEK-ISTEKLERI-siparis-teslim.md`.
