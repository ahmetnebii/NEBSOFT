# Hazır paketler raporu

Tarih: 2026-10-30. Dal: `claude/hazir-paketler-ad4950`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

- **Fiyatlar örnek değerdir.** Paket tutarı program fiyatları ve `config/toplu-indirim.json` kademelerinden hesaplanır (2 program %5, 3 program %10, 5 program %15). Kademe dosyası kendini "örnek" olarak tanımlar. Yayından önce kullanıcı onayı gerekir. 24 pakette bu haliyle en yüksek oran %10'dur, çünkü hiçbir pakette 5 program yoktur.
- **Paket sayfası metinleri kullanıcı onayı almadı.** Her iddia `market/catalog.js` özelliklerine dayanır, ama 24 sayfa pilot işletmeye gösterilmedi. Bu metinler yayın öncesi okunmalıdır.

## Ne yapıldı

| Parça | Dosya |
|---|---|
| Paket listesi (kimlik, kimin için, programlar) | `market/paketler.js` |
| Tutar hesabı | `server/cloud/paket.js`, uç nokta `GET /api/paketler` (`server/cloud/routes.js`) |
| Pazar yeri ekranları `#/paketler`, `#/paket/<id>` | `market/paket-ek.js`, sepete ekleme `addPaket` `market/market.js` |
| Sayfa metinleri | `site/src/paketler.js` |
| Sayfa üretimi `/paketler/`, `/paketler/<id>/` | `site/tools/build-sites.js` |
| Canlı fiyat yazımı (`data-pk`) | `server/cloud/seo.js` |
| Test | `server/test/paket.test.js` |

Tasarım kararları:

- **Paket ayrı ürün değildir.** Sepete içindeki programlar tek tek girer, sipariş ve lisans bugünkü yoldan geçer. Sunucu tarafında yeni sipariş türü yoktur, bu yüzden istemciye güvenilen yeni bir alan da yoktur.
- **Tutar tek yerden gelir.** `paket.fiyat()` sepetle aynı `catalog.price` + `indirim.hesapla` zincirini kullanır. Yönetim panelindeki fiyat değişikliği ve program gizleme paketlere yansır.
- **Programı gizlenen paket satıştan düşer.** Liste ekranında görünmez, paket ekranında sepete ekleme kapanır. Statik sayfa yayında kalır.
- **`eczane` hiçbir pakette yoktur.** Satışta olmayan program içeren liste sayfa üretimini durdurur (`paket.dogrula`).
- **Sepette Hepsi Bir Arada varsa paket eklenmez.** Aynı programlar için iki kez ödeme yapılmasın diye.
- **Plan seçimi pakette tektir.** Tüm programlar aynı planla eklenir, sepette program başına değiştirilebilir.

## Üst menü düzeltmesi

Giriş yapılmamış pazar yeri üst menüsü bu işten önce de 1.200 piksellik alana sığmıyor, sayfayı yana taşırıyordu (ölçüm: 1.440 px pencerede içerik 1.360 px civarı). "Paketler" bağlantısı bunu büyüttüğü için düzeltildi: menü alanı 1.320 px oldu, bağlantılar sıkılaştı, 1.320 px altında menü düğmesi görünür, "Ücretsiz araçlar" bağlantısı "Araçlar" oldu. Statik sayfa üst menüsü de 1.320 px altında sıkılaştı. 1.125, 1.325 ve 1.440 px genişlikte taşma kalmadı.

## Bilinen sınırlar

- **Programlar birbirine veri aktarmaz.** Her programın kendi veri belgesi vardır (`new NS.DB('<program>')`). "Entegre paket" denmedi, her sayfa ve paket ekranı bunu açıkça yazar. Örneğin Butik ile E-ticaret stoğu, Otel folyosu ile Adisyon ayrıdır; ilgili sayfaların SSS bölümünde belirtildi. Bu en büyük ürün boşluğudur.
- **Yerel kipte sepet toplu indirimi göstermez.** Bu mevcut davranıştır (`cartTotals`). Paket ekranı bu durumda not gösterir, gerçek sipariş bulutta sunucuda hesaplanır.
- **Yeni programlar paketlere girmedi.** Paralel oturumların programları (ör. Kuaför, Eğitim tarafındakiler) bitince paket içerikleri gözden geçirilmelidir. Örneğin Güzellik paketi bugün Randevu + Market POS kullanır.
- **Sıralama ve arama hacmi verisi yoktur.** `kw` alanı adaydır, Search Console verisi gelince gözden geçirilir.

## Doğrulama (2026-10-30)

- `node server/test/paket.test.js`: 21 kontrol geçti. Sayfalar arası en yüksek üçlü kelime örtüşmesi %28.
- `node server/test/seo-sayfalar.test.js`: geçti.
- Tarayıcıda, gerçek bulut kipinde (MariaDB, ayrı veritabanı): paket ekranı → sepet → giriş → ödeme ekranı. Oto Sanayi, Profesyonel, aylık: 2.870 ₺, %10 indirim 287 ₺, KDV 516,60 ₺, toplam 3.099,60 ₺. Paket ekranı, sepet ve ödeme ekranı aynı tutarı gösterdi.
- Sahte tutar: `/api/orders/quote` isteğine `price: 1`, `total: 1`, `discount: 999` eklendi, sunucu yok saydı.
- Yönetim paneli ayarı: `crm` fiyatı değişince `/paketler/oto-sanayi/` yeni tutarı gösterdi. `crm` gizlenince satıştaki paket 24'ten 16'ya indi.
- Telefon genişliği (375 px), koyu tema, boş arama, fiyat alınamama ve yeniden deneme durumları denendi, yatay taşma ve konsol hatası yok.
- Ödeme onayı denenmedi: test veritabanında banka hesabı tanımlı değildi, ödeme adımında durdu.

## Birleştirme notu

`site/*/index.html`, `site/sitemap.xml`, `site/src/lastmod.json` ve `index.html` üretilmiş dosyalardır. Üst menüye "Paketler" eklendiği için hepsi değişti, paralel oturumlarla çakışabilir. Birleştirmeden sonra yeniden üretin, elle çözmeyin:

```bash
node site/tools/build-sites.js
```

```bash
node site/tools/build-araclar.js
```
