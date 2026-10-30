# Site iddiaları listesi

Tarih: 2026-10-30 · Son güncelleme: `masaustu/electron-45` (tanıtım metinleri `0ee1c46`, sunucu rolleri, belge şifreleme, yönetici TOTP sonrası) · Kapsam: `market/`, `site/src/products.js`, `site/tools/`, `core/support.js`, e-posta şablonları, müşteriye açık program sayfaları.

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
| `apps/randevu/book.html` kapak | "288+ tamamlanan randevu" | Silindi. Demoda sayı rastgele örnek veriden geliyordu; canlıda müşteri sayfasına yalnız bugünden sonraki randevular gittiği için toplamı yansıtmıyordu | DOĞRULANAMADI → kaldırıldı |
| `apps/servis/takip.html` | Ayar yoksa da "90 gün garanti" | İşletmenin "Garanti süresi" ayarından gelir, ayar boşsa gösterilmez. Teslim edilmiş kayıtta teslimde yazılan tarih esastır | Kaldırıldı |
| `apps/servis/app.js` | Ayar yoksa 90 gün garanti kaydı ve teslim belgesi | Ayar boşsa garanti tarihi yazılmaz | Kaldırıldı |

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

## 3. Tanıtım metinleri: `0ee1c46` sonrası durum

Doğrulanmamış veya çalışmayan bağlantılar müşteriye özellik gibi sunulmuyor. Bu çalışmada `site/src/products.js` ve `market/` tek tek yeniden okundu.

| İfade | Bugünkü metin | Durum |
|---|---|---|
| Yemek platformları (Yemeksepeti, Getir, Trendyol Yemek, Migros) | Platform siparişi elle girilir; bağlantı platform anlaşması ve canlı test sonrası açılır | Düzeltildi. Otomatik bağlantı DOĞRULANAMADI |
| Booking, Expedia | Kanal bağlantısı açılana kadar elle girilir | Düzeltildi. Otomatik bağlantı DOĞRULANAMADI |
| sahibinden, Hepsiemlak, Emlakjet | Portal ilanlarının numara ve süresinin elle kaydı | Düzeltildi. Otomatik gönderim DOĞRULANAMADI: `core/integrations.js` `UNVERIFIED.ilan`, yalnız TEST seçilebilir. `docs/video/emlak.md` de buna göre yazıldı |
| Trendyol, n11 | Pazaryeri metinleri canlı seçilebilen bu iki kanalla sınırlı | Hesap ve canlı test gerekir, `docs/ENTEGRASYON-RAPORU.md` |
| Hepsiburada, Amazon | `fiyatrobotu` tanıtımında kâr hesabı için geçer; `catalog.js` canlıda seçilemediğini açıkça yazar | Canlı bağlantı iddiası değil |
| Plaka tanıma kamerası, bariyer | Donanım anlatımı olarak duruyor | DOĞRULANAMADI (donanımlı saha testi yok) |
| e-ticaret fotoğrafı | Üründe fotoğraf yükleme var, ilk fotoğraf kapak | DOĞRULANDI (kod, `docs/video/eticaret.md`) |

## 4. Güvenlik anlatımı: kullanılabilecek sınırlar

Site bu konularda şu an iddia taşımıyor. Eklenecekse aşağıdaki sınırların dışına çıkılmamalı. Test: `npm test` içindeki `rol-kural`, `sifreleme`, `guvenlik`, `guvenlik-ucuncu`.

| Konu | Söylenebilir | Söylenemez | Durum |
|---|---|---|---|
| Ekip rolleri | Rol seçilen üye, kuralı olan 20 programda yalnız rolünün gördüğü veriyi alır; veri sunucuda süzülür | "Tüm programlarda". Rol atanmayan ekip hesabı tam yetkilidir; bilet, butik, emlak, fabrika, fiyatrobotu, kargo, oto, pazaryeri, servis programlarında rol yalnız arayüzdedir; spor ve kiralamada menü farkıdır | DOĞRULANDI (20 program, kod ve test) |
| Belge şifreleme | Klinik, eczane, veteriner, İK, anaokulu ve entegrasyon verisi veritabanında şifreli tutulur (`server/cloud/belge.js`) | "Tüm veriler şifreli", "KVKK uyumlu", "256-bit" gibi tanıtım ifadeleri | DOĞRULANDI (6 program, kod ve test) |
| Entegrasyon anahtarları | Bulutta kayıtlı şifre ve API anahtarları şifreli saklanır, tarayıcıya gitmez; API anahtarı olabilen `user` alanı da kapsama alındı | Yerel (bulut dışı) kullanımda bu koruma yoktur | DOĞRULANDI (kod ve test) |
| İki adımlı giriş | Platform yöneticisi uygulama tabanlı iki adımlı girişi kendisi açabilir | "Tüm hesaplarda iki adımlı giriş", "zorunlu". Müşteri hesaplarında bu özellik yoktur | Kod ve RFC testi DOĞRULANDI; gerçek telefon uygulamasıyla DOĞRULANAMADI |

## 5. Hâlâ sizin bakmanız gereken ifadeler

Sonuç vaadi değil, ama doğrulanmamış. Hepsi: DOĞRULANAMADI (bu çalışmada denenmedi).

- `market/market.js`: ana sayfa örnek ekranındaki rakamlar ("₺48.250", "312 Fiş", "%24") gösterim amaçlıdır; "örnek" etiketi yoktur.
- `market/market.js`: örnek pencerelerdeki `nebsoftapp.com` adresi ve `site/src/site.config.js` içindeki `www.domain.com` yer tutucu görünüyor.
- Destek telefonu `0850 555 00 34` varsayılan değerdir; gerçek hat olduğu bu çalışmada doğrulanmadı.
- Yıllık ödemede "2 ay bedava": kodla uyumludur (`catalog.js` fiyatı × 10), tanıtım olarak kullanımı izne bağlıdır.
- Video senaryolarının kapanışındaki "yedi gün ücretsiz": varsayılan `trialDays: 7` ile uyumludur; yönetim panelinden değiştirilirse senaryo elle güncellenmelidir.
