# Görsel ve PDF araçları raporu (30.10.2026)

## CANLIYA ÇIKMAYI ENGELLEYENLER

Kod tarafında engel yok. Yayından önce:

- Gerçek Chrome, Safari ve Firefox ile, gerçek telefonda dosya seçici denenmedi. Testler uygulama içi tarayıcıda, dosya seçici yerine `DataTransfer` ile yapıldı.
- Şifreli PDF için hazır test dosyası yoktu: parola hatası kod yolu okunarak yazıldı, gerçek şifreli dosyayla denenmedi. Bozuk PDF denendi ve Türkçe hata verdi.
- Search Console ve hacim verisi yok. Anahtar kelimeler aday listedir, sıralama beklentisi verilmez.
- Sıkıştırma ve görsel kalitesi rastgele üretilmiş örnek dosyalarla ölçüldü, gerçek taranmış belgelerle değil.

## Eklenenler

Toplam araç 25'ten 44'e çıktı. Hepsi `index,follow`, sitemap 142 adres.

| Araç | Yaptığı benzersiz iş | Aynı sayfada karşılanan aramalar (aday) |
|---|---|---|
| Resim Sıkıştırma | KB hedefine en yüksek kaliteyle ikili arama | resim küçültme, fotoğraf boyutu düşürme, KB azaltma, JPG sıkıştırma |
| Resim Boyutlandırma | Piksel/yüzde ölçü, kenar ekleme, kırpma | piksel değiştirme, fotoğraf kare yapma |
| Resim Format Dönüştürme | Biçim çevirme, saydam alan rengi | WebP JPG yapma, PNG JPG çevirme, JPG PNG çevirme |
| Resim Kırpma ve Döndürme | Sürüklenebilir seçim, oran kilidi, 90° döndürme | fotoğraf kesme, resim çevirme, aynalama |
| Resime Filigran Ekleme | Görsel üstüne yazı/logo, tekrarlı ızgara | fotoğrafa yazı ekleme, logo koyma |
| Fotoğraf Bulanıklaştırma | Seçili alanı bant, mozaik, bulanıkla kapatma | yüz, plaka, TC numarası kapatma |
| EXIF ve Konum Bilgisi Silme | Bayt düzeyinde bilgi bloğu silme, kayıpsız | fotoğraftan GPS silme, EXIF görme |
| Resim Arka Plan Silme | Kenardan renk taşması, yapay zekâ yok | logo ve imza fonu saydam yapma |
| Favicon Oluşturucu | ICO paketleme, altı ölçü, HTML kodu | site simgesi, ICO yapma |
| PDF Birleştirme | Sıralı birleştirme | PDF toplama |
| PDF Bölme | Aralık veya N sayfada bir parçalama | PDF sayfa ayırma, PDF'ten sayfa çıkarma |
| PDF Sayfa Düzenleme | Küçük resimle sil, sırala, döndür | PDF sayfa silme, sıralama, döndürme |
| Resimden PDF Oluşturma | A4'e yerleştirme, yeniden sıkıştırmasız gömme | JPG PDF yapma, fotoğraf PDF yapma |
| PDF'i Resme Çevirme | DPI seçimli çizim | PDF JPG yapma, PDF PNG yapma |
| PDF Sıkıştırma | İki yöntem: görsele çevirme veya yeniden yazma | PDF küçültme, MB düşürme |
| PDF Filigran Ekleme | Türkçe harfli filigran görseli | PDF'e taslak, gizli yazısı |
| PDF Sayfa Numarası Ekleme | Başlangıç, atlama, biçim | PDF numaralandırma |
| PDF Metin Çıkarma | Metin katmanını satırlara dizme | PDF'ten yazı kopyalama, PDF TXT yapma |
| PDF İmza Ekleme | Çizim ve yerleştirme | PDF'e imza koyma |

Her satır tek sayfadır. "JPG küçültme" ile "PNG küçültme" için ayrı sayfa açılmadı; bu ayrım doorway tanımına girerdi.

Yapılmayanlar: PDF şifreleme ve şifre kaldırma (pdf-lib desteklemiyor, güvenilir olmayan çözüm yazılmadı), OCR (Türkçe doğruluğu doğrulanmadan yanlış rakam üretme riski), Word'e çevirme, yapay zekâlı arka plan silme.

## Google kurallarına uyum

| Kural | Kaynak | Bu işte karşılığı |
|---|---|---|
| Toplu içerik: sıralama için çok sayıda değersiz sayfa üretmek, nasıl üretildiği fark etmez | [Spam politikaları, 2026-08-28](https://developers.google.com/search/docs/essentials/spam-policies) | Her sayfada ayrı çalışan araç. Metinler tek tek yazıldı, ortak cümle özgün sayılmaz, 200 özgün kelime altı `noindex` |
| Doorway: benzer aramalar için, kullanıcıyı asıl sayfaya akıtan ara sayfalar | Aynı sayfa | Biçim veya şehir başına sayfa yok, aramalar tek sayfada toplandı. Araç sayfanın kendisinde çalışır, kayıt veya program satışına yönlendirmez |
| Yanıltıcı işlev: PDF birleştirme gibi hizmet vaat edip reklama götürmek | Aynı sayfa, örnek olarak PDF birleştirme geçiyor | Reklam yok, araç üyeliksiz sonuç verir, sınırlar sayfada yazılı |
| Araçlar ana içeriktir; arama için üretim uyarı işaretidir | [Yararlı içerik, 2026-10-05](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | Araç sayfanın başında, metin sınırları da söyler |
| noindex sayfası robots.txt ile kapatılmaz | [noindex, 2025-12-10](https://developers.google.com/search/docs/crawling-indexing/block-indexing) | Mevcut kural korundu |

Site içi program bağlantıları yalnız `market/catalog.js` içindeki gerçek özelliklere dayanır.

## Gizlilik

Dosya `File` olarak bellekte kalır, işlem cihazda yapılır. Dosya araçlarının sayfasına `connect-src 'self' blob: data:; form-action 'none'` kuralı eklendi: tarayıcı dış adrese veri göndermeyi reddeder. Sunucuya yalnız sayfa ve kütüphane dosyası için istek gider; denemede ağ kaydında yükleme isteği görülmedi. Analitik açıksa sayfa görüntüleme gibi olaylar kendi sunucumuza gider, dosya içeriği gitmez.

## Yapı

- Saf mantık: `site/tools/araclar/dosya.js` → `site/assets/araclar-dosya-saf.js` (derleme kopyalar). Test: `server/test/araclar-dosya.test.js`.
- Tarayıcı: `site/assets/araclar-dosya.js` (dosya alanı, alan seçici, sayfa ızgarası, akış, çıktı).
- Araç tanımı `isle` alanı taşırsa dosya aracıdır. `hazirla` bir kez, dosya değişince çalışır. `canli: true` otomatik işler, yoksa `hesap` düğme döndürür.
- Kütüphaneler `site/assets/vendor/` altında, gerektiğinde yüklenir: pdf-lib 1.17.1 (MIT), pdf.js 6.4.299 (Apache-2.0). pdf.js dosyaları `.js` uzantısıyla gömüldü, sunucunun `.mjs` türü yoktur.

Tuzaklar:

- pdf.js normal kipte `requestAnimationFrame` ile çizer, sekme arka plandayken durur. `H.sayfaCiz` bu yüzden `intent: 'print'` kullanır.
- pdf-lib gömülü yazı tipi Türkçe harf yazamaz. Filigran ve numara görsel olarak gömülür (`H.metinTuval`).
- Döndürülmüş sayfada koordinat `H.pdfYer` ile çevrilir, doğrudan `drawImage` yazılmaz.
- pdf.js 6'da `PDFDocumentProxy.destroy` yoktur: `H.pdfKapat` kullanılır.
- Sunucu genel bir CSP gönderir, `eval` kapalıdır, wasm izinlidir.

## Alan adı

`site/src/site.config.js`, `index.html`, `robots.txt`, `site/kurumsal-teklif/index.html` artık `https://www.nebsoftapp.com`. Tüm sayfalar yeniden üretildi. `lastmod` tarihleri içerik tarihi olarak kaldı.

Eski alan adı metinleri `DEPLOY.md`, `docs/IDDIA-LISTESI.md`, `docs/pazarlama/ICERIK-TAKVIMI.md` içinde tarihsel kayıt olarak duruyor. `server/cloud/seo.js` içindeki yer tutucu eski derlemeler içindir. E-posta `destek@nebsoft.com.tr` değiştirilmedi; alan adıyla uyumsuz ve gerçekliği doğrulanmadı.

## Başlık ve açıklama sınırı

Eski araçlardaki 20 uzun açıklama ve 7 uzun başlık 31.10.2026 denetiminde kısaltıldı. Sınır testi artık tüm araçlarda çalışır. Rapor: `docs/SEO-DENETIM.md`.
