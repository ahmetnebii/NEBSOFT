# Perakende grubu — çekirdek (`core/`) istekleri

Perakende oturumu (Butik, Market POS, Adisyon, Kuyumcu, Toptan, Fiyat Robotu) `core/`'u değiştirmez; ihtiyaçlar burada
gerekçesiyle listelenir. Çekirdeği değiştiren oturum uyguladıkça "Durum" sütununu günceller.

| # | Dosya | İstek | Gerekçe | Bizdeki geçici çözüm | Durum |
|---|---|---|---|---|---|
| Ç1 | `core/labels.js` | `val('old')`: `oldPrice` yoksa **boş** dönsün (bugün `fiyat × 1,2` uyduruyor). | İndirimsiz üründe gerçek olmayan "eski fiyat" basılıyor. Bu, tüketiciyi yanıltan indirim gösterimidir (hukuki dayanak spesifikasyonda doğrulanacak; teknik olarak her durumda yanlış veri). POS'ta ürünlerde `oldPrice` yok → raf etiketinde sahte eski fiyat basılıyor. | Butik: `old` öğesi indirimsiz modelde şablondan çıkarılıyor (`lbFor`). POS: dalga 1'de aynı yöntem. | Açık |
| Ç2 | `core/labels.js` | Programa özel alan kaydı: `NS.labels.field(key, label, (p, ctx) => değer)`. | Butik beden/renk, kuyumcu gram/ayar/milyem, toptan koli içi adet gibi alanlar için. Bugün alanlar sabit `switch` içinde. | Butik çekirdek alanları yeniden adlandırıyor: `unit` = beden, `cat` = renk, `biz` = mağaza adı; `unitPrice` ve `shelf` gizleniyor. | Açık |
| Ç3 | `core/labels.js` | `designer(el, db, sample, onSaved, ctx)` — önizleme bağlamı (`ctx`) alsın. | Tasarımcı `labelHtml(t, sample)` çağırıyor, `ctx` geçmiyor: "Kategori/Renk" ve "İşletme adı" tasarım alanında boş görünüyor (POS'ta da). | Butikte tasarımcı üstünde açıklama yazılı; doğru görünüm etiket sayfasındaki önizlemede. | Açık |
| Ç4 | `core/labels.js` | Resim (logo) öğesi: `f: 'logo'`, kaynak `ctx.logo` veya şablonda `src`; tasarımcıda "Logo" düğmesi. | Kullanıcı etikette kendi logosunu istiyor. | Butik: logo, zemini `url(data:…)` olan kutu öğesi (`logo: true`); logo "Etiket Basımı" sayfasından yüklenip şablona ekleniyor. Tasarımcıda "Zemin" renk seçicisine dokunulursa logo kaybolur. | Açık |
| Ç5 | `core/labels.js` | İndirim yüzdesi alanı (`%30`) ve "indirimli fiyat" / "eski fiyat" alanlarının ayrı adlandırılması. | Butik indirim etiketinde yüzde gösterimi beklenen özellik. | Yok (serbest metinle sabit "İNDİRİM"). | Açık |
| Ç6 | `core/integrations.js` | `printLabels` şablonu desteklesin (ZPL `^GFA` ile görüntü ya da öğe bazında `^FO`/`TEXT` çevirisi) ve şablon ölçüsünü kullansın. | Bugün ZPL/TSPL çıktısı sabit düzen (ad, fiyat, barkod) — kullanıcı tasarımı uygulanmıyor. Ayrıca ZPL/TSPL yolu sağlayıcı dokümanıyla doğrulanmadı ve gerçek yazıcıyla denenmedi → **DOĞRULANAMADI** (CLAUDE.md §1). | Butik ve POS etiket yazıcısına tarayıcı yazdırmayla (yazıcı sürücüsü, her etiket bir sayfa, şablon ölçüsünde) basıyor. Doğrudan ZPL/TSPL seçeneği sunulmuyor. | Açık |
| Ç7 | `core/integrations.js` | `USED.butik` listesine `printer`, `label`, `barcode`, `pos` eklenmeli. | Butik `NS.shell(... integrations: [...])` ile bunları istiyor ama `USED.butik = ['sms','pazaryeri','backup']` olduğu için Entegrasyonlar sayfasında etiket/fiş yazıcısı görünmüyor. Butikte etiket modülü olmamasının bir nedeni de bu. | — | Açık |
| Ç8 | `sw.js` | `V` sürümü artırılmalı (statik dosya değişti). | CLAUDE.md §3. Perakende oturumu kök dosyaya dokunmuyor; birleştirmede artırılmalı. | — | Açık |

## Not: `npm test`
`server/test/cloud.test.js` bu dalda ve değiştirilmemiş temel committe (`22b1dae`) aynı hatayla düşüyor:
`'talep' == 'deneme'` (müşteri kaydında lisans durumu). Perakende değişikliklerinden bağımsız; sunucu sahibine iletilmeli.
Diğer 6 test geçiyor (GİB XSD testi dahil: 9 belge uygun).
