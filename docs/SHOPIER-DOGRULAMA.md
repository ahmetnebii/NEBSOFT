# Shopier ile Kart Ödemesi — Doğrulama Raporu

Tarih: 30.10.2026 · Dal: `odeme/shopier` · Kapsam: paket satın alan müşteriye havale yanında "Banka / kredi kartı (Shopier)" seçeneği.

Kaynaklar 30.10.2026'da doğrudan okundu (`developer.shopier.com`, API sürümü v1). Hafızadan bilgi kullanılmadı. Etiketler: **DOĞRULANDI** (resmî dokümanda yazıyor, kod uyumlu) · **UYUMSUZ** · **DOĞRULANAMADI**. "DOĞRULANDI" belgeye uyum demektir, gerçek hesapla denendi demek değildir.

---

## 1. CANLIYA ÇIKMAYI ENGELLEYENLER (sizden gerekenler)

| # | Konu | Durum | Ne gerekli |
|---|---|---|---|
| E1 | **Gerçek hesapla deneme** | Sandbox bulunamadı; bağlantı yalnızca sahte sunucuyla sınandı. Bu yüzden seçenek varsayılan olarak **müşterilere kapalıdır**, yalnızca panelde yazılan deneme müşterisine görünür | §5'teki listeyi gerçek mağazada, düşük tutarla yürütün. Sonra panelde "Gerçek hesapla denedim, müşterilere aç" |
| E2 | **PAT** | Shopier hesabınızda 2FA açıkken üretilir, yalnızca bir kez gösterilir | Shopier'de Hesap > Hesap Güvenliği'nden 2FA'yı açın, Hesap > Personal Access Token'dan üretin, NEBSOFT panelindeki alana kendiniz yapıştırın. Anahtar hesaba tam erişim verir: sohbete, e-postaya yazmayın, başkasına vermeyin (Shopier'in uyarısı) |
| E3 | **PAT'in üretimde kullanımı** | Shopier "PAT üretimde önerilmez" der ama "yalnızca kendi kullanımınız için özel çözüm" için uygun bulur. NEBSOFT kendi mağazasına satış yaptığı için bu kapsamda olduğu yorumlanıyor; Shopier'den teyit alınmadı | Karar sizin: PAT ile devam veya OAuth uygulaması (uygulama incelemesi gerekir, bu sürümde yok) |
| E4 | **Mağazada görünme** | Ürün normal mağaza ürünü olarak açılır. `customListing` alanının etkisi belgede yok, gönderilmedi. Ürün, sipariş ödenene/kapanana kadar mağaza vitrininde görünebilir ve başkası satın alabilir | E1 denemesinde vitrini kontrol edin. Görünüyorsa ayrı bir Shopier mağazası kullanın veya `customListing` etkisini Shopier'e sorun |
| E5 | **KDV** | Ürün fiyatı KDV dahil sipariş toplamıdır; `vatPercent` gönderilmedi çünkü fiyata eklenip eklenmediği belgelenmemiş | E1'de müşterinin ödediği tutarın sipariş toplamıyla aynı olduğunu ve Shopier'in KDV gösterimini kontrol edin; mali müşavirinize danışın |
| E6 | **Taksit** | Taksitte vadeyi alıcı öderse `totals.total` tutarının değişip değişmediği belgede yok | Değişirse tutar uyuşmazlığı olur: lisans açılmaz, yönetici uyarılır (güvenli taraf). Taksitli deneme yapın; gerekirse Shopier'den taksiti kapatın |
| E7 | **Yasal metin** | §6'daki eklemeler yapılmadı | Hukuk danışmanı onayı |
| E8 | **Ürün limiti** | Mağaza başına ürün sınırı belgede bulunamadı; açık bağlantılar en çok 48 saat kalır | Hesabınızdaki limiti Shopier'den öğrenin |

Webhook imza kontrolü gerçek bildirimle denenmedi (§3). Tutmazsa ödeme yine yakalanır: bu engelleyici değildir.

---

## 2. Akış

1. Müşteri "Banka / kredi kartı (Shopier)" seçer. Sipariş "ödeme bekliyor" açılır, sunucu `POST /products` ile sipariş tutarında tek adetlik dijital ürün açar. Ürüne müşteri adı veya vergi numarası yazılmaz.
2. Dönüş sayfası (`#/basarili/<id>`) "Ödeme kontrol ediliyor" gösterir ve yeni sekmede Shopier ürün bağlantısını açan düğme sunar. Kart bilgisi bizim sayfada alınmaz. Shopier ödeme sonrası dönüş adresi belgelemediği için sayfa kendi kendini 6 saniyede bir yeniler.
3. Üç tetikleyici aynı işlevi çağırır (`check`): imzası tutan `order.created` webhook'u, dönüş sayfası, 60 saniyelik arka plan taraması.
4. `check`, PAT ile `GET /orders?productId=` okur. Webhook gövdesine güvenilmez: imzası doğru sahte bir bildirim bile lisans açamaz.
5. Ödeme durumu `paid`, ürün kimliği, adet 1, tek kalem, TRY, tutar (kuruş kuruş) tutarsa ve iade yoksa: sipariş ödendi, lisans açıldı/uzadı, ürün silindi.
6. Tutmazsa: lisans açılmaz, sipariş bekler, ürün silinir, panelde kırmızı uyarı + güvenlik kaydı + (e-posta ayarlıysa) yöneticiye e-posta. Müşteri "Ödemeniz inceleniyor" görür. Yönetici Havale Onayları'ndan elle onaylar veya reddeder.

Hatalar: Shopier yanıt vermezse sipariş kaybolmaz, müşteri havale bilgisini görür ve yeniden deneyebilir. 48 saat ödenmeyen bağlantı kapanır, sipariş durur, yeni bağlantı alınabilir. İptalde önce son sorgu yapılır, sonra ürün silinir; iptalden sonra gelen ödeme iade uyarısı üretir.

Tekrar koruması: `shopier_orders.shop_id` birincil anahtar (aynı Shopier siparişi iki kez işlenmez), `shopier_events.id` (Shopier-Webhook-Id), `shopier_payments.product_id` tekil. Eşleştirme `orders` satırı kilitliyken tek işlemde yapılır. Aynı ürüne ikinci ödeme "çift ödeme" uyarısıdır, lisans uzamaz.

Gizli bilgi: PAT ve webhook token'ı `settings` içinde `enc:v1:` (AES-256-GCM, `server/cloud/secrets.js`) saklanır; hiçbir yanıta, loga, denetim kaydına yazılmaz. Üretimde (`NODE_ENV=production`) `SHOPIER_API_BASE` yok sayılır, PAT yalnızca `api.shopier.com`'a gider.

---

## 3. Bulgular

Kaynak kısaltmaları tablonun altındadır.

| Konu | Bulgu | Etiket | Kaynak |
|---|---|---|---|
| Kimlik doğrulama | `Authorization: Bearer <PAT>`, 2FA gerekli, PAT bir kez görünür, hesaba tam erişim verir | DOĞRULANDI | [PAT] |
| Taban adres ve sürüm | `https://api.shopier.com/v1`; sürüm içinde geriye dönük uyum taahhüdü | DOĞRULANDI | [VER] |
| Özel tutar için ödeme bağlantısı | Referansta yok; hedeflenen ürün yolu kullanıldı | DOĞRULANDI (uç yok) | [LLMS] |
| Ürün açma | `POST /products`. Zorunlu: `title`, `type`, `media`, `priceData` (`currency`, `price`), `shippingPayer`. Yanıtta `id`, `url` | DOĞRULANDI | [PROD] |
| Ürün görseli **zorunlu** | `media` zorunlu; jpg, jpeg, png, bmp. Görevde öngörülmemişti. Varsayılan `<siteUrl>/assets/icons/icon-512.png`; panelden değiştirilebilir | DOĞRULANDI | [PROD] |
| Görselin Shopier tarafından çekilmesi | Herkese açık https adresi gerektiği varsayımı belgede açık değil | DOĞRULANAMADI | — |
| `stockQuantity: 1` ile çift satın almanın engellenmesi | Alan belgeli; stok bitince satışın durduğu belgeli değil. Çift ödeme yine de yakalanır | DOĞRULANAMADI | [PROD] |
| `url` alanının ödeme sayfası olması | Örnek `https://www.shopier.com/696547`; doğrudan satın almaya açıldığı denenmedi | DOĞRULANAMADI | [MODEL] |
| Ödeme sonrası dönüş adresi | Ürün modelinde ve referansta yok | DOĞRULANAMADI (yok sayıldı) | [PROD] |
| Ürün silme | `DELETE /products/{id}`, 200 | DOĞRULANDI | [DEL] |
| Silinen ürünün eski siparişlerdeki etkisi | Belgede yok | DOĞRULANAMADI | — |
| Sipariş sorgulama | `GET /orders?productId=`, `limit` en çok 50, `sort=dateAsc`; yanıt dizi | DOĞRULANDI | [LIST] |
| Sipariş alanları | `paymentStatus` (`paid`/`unpaid`; şu an yalnız `paid` kapsamda), `currency`, `totals.total`, `lineItems[].productId/quantity`, `refunds[]` | DOĞRULANDI | [GET] |
| Olay listesi | `order.created` var; yükü Order modelidir | DOĞRULANDI | [EVT] |
| PAT ile webhook | `POST /webhooks` (`event`, `url`); `token` **yalnızca oluşturma yanıtında** döner | DOĞRULANDI | [HOOK], [WH] |
| İmza anahtarı | Webhook token'ı | DOĞRULANDI | [CONF], [HOOK] |
| İmza algoritması ve çıktı | HMAC-SHA256, onaltılık (PHP `hash_hmac(..., false)`, Python `hexdigest()`, Node `digest("hex")`) | DOĞRULANDI | [PHP], [PY], [NODE] |
| İmzalanan metin | PHP tarifi ham gövde (`php://input`); Python tarifi `data` baytları. **Node tarifi `JSON.stringify(data)` kullanır**, yani yeniden serileştirme. Gövde sıkışık değilse farklı sonuç verir. Kod ham gövdeyi kullanır | DOĞRULANDI (iki tarif); Node tarifiyle tutarsızlık gerçek bildirimle DOĞRULANAMADI | [PHP], [PY], [NODE] |
| Başlıklar | `Shopier-Signature`, `Shopier-Event`, `Shopier-Webhook-Id` (yeniden gönderimde aynı), `Shopier-Timestamp` | DOĞRULANDI | [EVT] |
| `Shopier-Timestamp` imzaya dahil mi | Tariflerde dahil değil; tekrar saldırısı denetimi yapılmadı. Lisans API'den doğrulandığı için tekrar zararsız | DOĞRULANDI | [PHP] |
| Yeniden gönderim | 5 saniyede 200 gelmezse 9 deneme, 72 saate kadar. Yanıt hemen döner, sorgu arkada yapılır | DOĞRULANDI | [CONF] |
| Hız sınırı | 200/dk, 60 sn kayan pencere, 429 + `Retry-After`. 3 sn'ye kadar beklenir, daha uzunsa tarama sonraki tura kalır | DOĞRULANDI | [RATE] |
| Hata kodları | 4xx yeniden denenmez; 5xx sonra tekrar. Yalnızca GET yeniden denenir: POST tekrarı ikinci ürün açabilir | DOĞRULANDI | [CODE] |
| Sandbox | Belgelerde yok | DOĞRULANAMADI | [LLMS] |
| Zaman aşımında yetim ürün | POST zaman aşımına uğrar ama Shopier işlerse kimliği bilinmeyen ürün kalır (başlıkta sipariş no var, elle silinir) | Bilinen sınır | — |

Kaynaklar (erişim 30.10.2026):
- [LLMS] https://developer.shopier.com/llms.txt
- [PAT] https://developer.shopier.com/docs/creating-and-using-pats.md · https://developer.shopier.com/docs/pats-and-apps.md · PAT üretim uyarısı: https://developer.shopier.com/docs/bonus-shortcut-to-start-playing-with-the-api.md
- [VER] https://developer.shopier.com/reference/versioning.md
- [PROD] https://developer.shopier.com/reference/post-products.md
- [MODEL] https://developer.shopier.com/reference/the-product-model.md · https://developer.shopier.com/reference/get-products-id.md
- [DEL] https://developer.shopier.com/reference/delete-products-id.md
- [LIST] https://developer.shopier.com/reference/get-orders.md
- [GET] https://developer.shopier.com/reference/get-orders-id.md · https://developer.shopier.com/reference/the-order-model.md
- [HOOK] https://developer.shopier.com/reference/post-webhooks.md
- [WH] https://developer.shopier.com/reference/webhooks.md
- [CONF] https://developer.shopier.com/reference/webhook-configuration.md
- [EVT] https://developer.shopier.com/reference/events-headers-payloads.md
- [RATE] https://developer.shopier.com/reference/rate-limits.md
- [CODE] https://developer.shopier.com/reference/response-codes.md
- [PHP] https://developer.shopier.com/recipes/webhook-handler-php
- [PY] https://developer.shopier.com/recipes/webhook-handler-python
- [NODE] https://developer.shopier.com/recipes/webhook-handler-nodejs-1

---

## 4. Yapılan sınamalar

- `server/test/shopier.test.js`: **54 kontrol geçti** (sahte Shopier + yerel MariaDB 10.4, ayrı veritabanı `nebsoft_shopier_test`). Kapsam: tutar uyuşmazlığı, sahte imza, imzası doğru ama ödemesi olmayan bildirim, tekrar webhook, eşzamanlı sorgu, çift ödeme, zaman aşımı, 429, iptal sonrası ödeme, 48 saat dolumu, arka plan taraması, PAT sızmaması (yanıt, log, denetim kaydı, veritabanı), havale akışının bozulmaması. MySQL yoksa uçtan uca bölüm "ATLANDI" yazar, geçti sayılmaz.
- Tarayıcı (sahte Shopier, port 5073): panelde PAT kaydı, müşteri ödeme ekranı, "kontrol ediliyor" → otomatik "onaylandı", tutar uyuşmazlığında "inceleniyor" ve panel uyarısı, telefon genişliği (375 px, yatay taşma yok), koyu tema.
- Çalıştırılmadı: `cloud.test.js` (talimat gereği), gerçek Shopier hesabı.
- Konsolda yalnız Service Worker kayıt hatası görüldü (test tarayıcı bölmesi, `/sw.js` 200 dönüyor); `sw.js` ve `core/` değişmedi.

## 5. Gerçek hesapla deneme listesi (E1)

1. Site Ayarları'nda https site adresi. Panel → Kartla Ödeme: PAT ve deneme müşterisi e-postası. "Bağlantıyı dene", "Webhook'u kaydet".
2. Deneme müşterisiyle en düşük tutarlı siparişi Shopier seçerek verin; bağlantı Shopier ödeme sayfasını açıyor mu, tutar doğru mu, KDV nasıl görünüyor?
3. Mağaza vitrininde ürün görünüyor mu (E4)?
4. Gerçek kartla ödeyin. Lisans açıldı mı, ürün silindi mi? Panelde "Son geçerli webhook" doldu mu? Dolmadıysa ve güvenlik kayıtlarında "imza geçersiz" varsa Node tarifindeki biçim gerekir: bana bildirin.
5. Taksitli ödeme deneyin (E6). Shopier panelinden iade yapın, `refunds` alanının geldiğini görün.
6. Hepsi tamamsa "Gerçek hesapla denedim, müşterilere aç".

## 6. Mesafeli satış ve iade metni için önerilen ekler (taslak, hukuk onayı gerekir)

Mevcut metin "ilk 14 gün koşulsuz iade" diyor (`market/market.js`). Bu taahhüt kaldığı sürece cayma istisnasına dayanılmaz; değiştirilecekse karar hukukçunundur. Yönetmelik md. 15, "elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallar"ı istisna sayar: [Mesafeli Sözleşmeler Yönetmeliği](https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/7.5.20237.pdf) (arama özeti üzerinden görüldü, güncel metin okunup teyit edilmeli).

- **Ödeme:** "Kartlı ödemeler Shopier altyapısı üzerinden, Shopier'in güvenli ödeme sayfasında yapılır. Kart bilgileriniz NEBSOFT tarafından alınmaz ve saklanmaz."
- **Satıcı/alıcı adı:** "Ödeme kaydınızda ve kart ekstrenizde işlem Shopier üzerinden görünebilir." (Ekstre metni doğrulanmadı.)
- **Veri paylaşımı (KVKK):** "Ödeme sırasında Shopier'e girdiğiniz bilgiler Shopier tarafından işlenir." Aydınlatma metnine alıcı olarak Shopier eklenmeli.
- **İfa:** "Lisans, ödemenin Shopier üzerinden doğrulanmasının ardından elektronik ortamda açılır. Doğrulanamayan ödemeler elle incelenir."
- **İade:** "Kartla yapılan ödemelerin iadesi aynı kart hesabına Shopier üzerinden yapılır; tutarın hesaba geçiş süresi bankanıza bağlıdır."
- **Fatura:** "Faturanız NEBSOFT tarafından düzenlenir." (Shopier'de ayrıca belge düzenlenip düzenlenmediği doğrulanmadı.)
