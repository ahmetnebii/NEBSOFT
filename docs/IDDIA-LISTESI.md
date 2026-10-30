# Site iddiaları listesi

Tarih: 2026-10-30 · Dal: `guven/donusum-yardim` · Kapsam: `market/`, `site/src/products.js`, `site/tools/`, `core/support.js`, e-posta şablonları.

Etiketler CLAUDE.md §1'e göredir. Bir iddia ancak ölçüm veya resmî kaynak gelince geri yazılır; veri `docs/VAKA-FORMU.md` ile toplanır ve yönetim panelinden girilir.

## 1. Kaldırılan uydurma veriler

Bu veriler hiçbir kayda dayanmıyordu. Kod değil, elle yazılmış sabit değerlerdi.

| Yer | Eski | Yeni | Durum |
|---|---|---|---|
| `market/catalog.js` (21 ürün) | `rating`, `reviews`, `users` (ör. 4.9 puan, 412 değerlendirme, 3800 işletme) | Silindi. Sayaç yalnız `/api/guven` üzerinden gerçek lisanstan gelir | DOĞRULANAMADI → kaldırıldı |
| `market/catalog.js` `testimonials` | 4 kişi ve işletme adıyla yorum ("garson yükü yarıya indi" vb.) | Silindi. Sayfada gösterilmiyordu, ama izinsiz ve kaynaksızdı | DOĞRULANAMADI → kaldırıldı |
| Ürün kartı ve ürün sayfası | Yıldız, puan, "+ işletme" | Gösterim kaldırıldı | Kaldırıldı |
| Ürün listesi sıralama | "En yüksek puan", "En popüler" | "Önerilen sıra" | Kaldırıldı |
| Fiyat kartı (`market.js`, `build-sites.js`) | "En çok tercih edilen" | "Önerilen" | DOĞRULANAMADI → yumuşatıldı |

## 2. Yumuşatılan sonuç iddiaları

| Yer | Eski | Yeni | Geri yazmak için gereken |
|---|---|---|---|
| randevu | "gelmeme oranı belirgin şekilde düşer" | "Randevu öncesi SMS hatırlatması gönderilir (SMS sağlayıcı hesabı gerekir). Gelmeyen sayınızı raporlardan izleyebilirsiniz." | Pilot işletmede önce/sonra gelmeyen oranı |
| randevu | "boş saat kalmasın, kimse randevusunu unutmasın"; "gelmeyenleri azaltsın" | "takvim, hatırlatma ve kasa tek yerde"; "saatini anımsatsın" | Aynı ölçüm |
| adisyon | "hiçbir sipariş unutulmaz" | "Siparişler mutfak ekranında hazırlık süresiyle görünür." | Mutlak ifade, geri yazılmaz |
| pos | "saniyede satış" | "ile satış" | Ölçülmüş işlem süresi |
| bilet | "saniyede giriş"; "komisyonsuz satış" | "kapı kontrolü"; "Kendi sitenizden satış." | Süre ölçümü; ödeme kuruluşu kesintisi netleşmeli |
| pazaryeri | "yanlış paket yok" | Başlıktan çıkarıldı | Mutlak ifade, geri yazılmaz |
| otel | "sıfır overbooking", "komisyonsuz" (başlık) | "doğrudan rezervasyon ve tek takvim" | Kanal bağlantısı canlı test |
| servis | "telefonları bitsin" | "müşteri cihazının durumunu kendisi izlesin" | Arama sayısı ölçümü |
| muhasebe | "mali müşaviriniz de memnun" | "faturadan KDV taslağına tek yerde" | Müşteri görüşü (izinli yorum) |
| oto | "gerisi kendiliğinden" | "plaka ile giriş-çıkış ve ücret hesabı" | Donanımlı saha testi |
| kiralama | "filo doluluğu artsın, evrak işi azalsın" | "filo, sözleşme ve teslim tek yerde" | Doluluk ölçümü |
| site | "aidat kendiliğinden tahsil edilsin" | "aidat tahakkuku ve sakin portalı tek yerde" | Tahsilat oranı ölçümü |
| veteriner, eczane, musavir, hukuk | "hiçbir ... unutulmasın / kaçmasın / kalmasın" | "tek yerde / tek ekranda" | Mutlak ifade, geri yazılmaz |
| fiyatrobotu, galeri | "kuruşu kuruşuna", "asla" | Çıkarıldı | Mutlak ifade, geri yazılmaz |
| anaokulu | "birkaç dakikada" (2 yer) | "tek ekrandan" | Ölçülmüş süre |
| pazar yeri ana sayfa | "satışı hızlandırın ... müşterinizi kaybetmeyin"; "Hiçbir siparişi kaçırmayın" | "satış, stok ve müşteri takibi tek yerde"; "Bildirimler tek yerde" | Ölçüm |
| pazar yeri ana sayfa | "Veri kaybı yok." | Çıkarıldı. Çevrimdışı eşitleme anlatımı kaldı | Mutlak ifade, geri yazılmaz |
| pazar yeri ana sayfa | "Entegrasyonlar hazır" | "Entegrasyon merkezi ... sağlayıcıdaki hesabınız gerekir" | `docs/ENTEGRASYON-RAPORU.md` |
| ana sayfa, alt bilgi, giriş | "KVKK uyumlu", "yedekli, günlük yedek", "Verileriniz Türkiye'de", "256-bit SSL", "Türkiye'de barındırılır" | "HTTPS bağlantı · KVKK aydınlatma metni"; "son 48 saatin değişiklik geçmişi" (kodda `app_data_history`) | Barındırma sözleşmesi, yedek düzeni, hukuk görüşü |
| ana sayfa, hoş geldiniz e-postası | "ücretsiz kurulum ve aktarım desteği" | "takıldığınız yerde destek ekibimize yazın" | Bu hizmeti vereceğinize karar verin |
| ana sayfa | "Bir dakikada kayıt olun" | "Kısa bir formla kayıt olun" | Ölçüm |
| kb-genel | "Kişisel veriler KVKK'ya uygun işlenir" | Yalnız aydınlatma metnine bağlantı | Hukuk görüşü |
| Yenileme e-postası | "Yıllık ödemede 2 ay ücretsiz." | Çıkarıldı (bilgilendirme iletisinde tanıtım olamaz) | Tanıtım izni |

## 3. Dokunulmayan, sizin bakmanız gereken ifadeler

Bunlar site metninde duruyor. Sonuç vaadi değil, özellik veya entegrasyon anlatımı oldukları için bu işte değiştirilmedi; entegrasyon durumları `docs/ENTEGRASYON-RAPORU.md` ile karşılaştırılmalıdır. Hepsi: DOĞRULANAMADI (bu çalışmada denenmedi).

- `site/src/products.js`: Booking/Expedia, Trendyol, Hepsiburada, Amazon, n11, sahibinden, Hepsiemlak, Emlakjet, Yemeksepeti, Getir, Migros, e-Nabız, plaka kamerası, bariyer, turnike, online ödeme anlatımları.
- `market/market.js`: ana sayfa örnek ekranındaki rakamlar ("312 Fiş", "%24", "₺48.320", "+%12") gösterim amaçlıdır; "örnek" etiketi yoktur.
- `market/market.js`: "Canlı önizleme" bölümündeki `nebsoftapp.com` adresi ve `site.config.js` içindeki `www.domain.com` yer tutucu görünüyor.
- Destek telefonu `0850 555 00 34` varsayılan değerdir; gerçek hat olduğu bu çalışmada doğrulanmadı.
- Yıllık ödemede "2 ay bedava": kodla uyumludur (`catalog.js` fiyatı × 10), tanıtım olarak kullanımı izne bağlıdır.
