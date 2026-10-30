# Sipariş ve Teslim grubu: çekirdek (`core/`) istekleri

Kuru Temizleme, Matbaa, Pastane, Çiçekçi ve Terzi oturumu `core/`'u değiştirmez. İhtiyaçlar burada gerekçesiyle listelenir. Çekirdeği değiştiren oturum uyguladıkça "Durum" sütununu günceller.

Ortak altyapı `core/` dışında kuruldu: `apps/siparisortak/` (`hesap.js`, `tohum.js`, `siparis.js`, `siparis.css`, `takip.js`). Klasörde `index.html` olmadığı için program sayılmaz. Beş program yalnız yapılandırma ve kendi ekranlarını verir.

| # | Dosya | İstek | Gerekçe | Bizdeki geçici çözüm | Durum |
|---|---|---|---|---|---|
| Ç1 | `core/kurulum-adimlari.js` | Aşağıdaki 5 satır `STEPS`e eklensin. | `server/test/yardim.test.js` katalogdaki her üründe 3-5 adım ister. Satırlar eklenmeden `npm test` bu testte durur. | Yok | Bekliyor, **engelleyici** |
| Ç2 | `core/yardim.json`, `core/kb.json` | `node site/tools/build-yardim.js` ve `node site/tools/build-kb.js` çalıştırılsın. | Yardım içeriği `site/tools/yardim-icerik.js` dosyasına eklendi, çıktı `core/` altında. | Yardım merkezi bu 5 programı boş gösterir | Bekliyor |
| Ç3 | `core/bizsite.js` | `kurutemizleme`, `matbaa`, `pastane`, `cicekci`, `terzi` için şema türü eklensin. | İşletme web sitesinin LocalBusiness alt türü bu programlarda genel kalır. | Genel tür | Bekliyor |
| Ç4 | `core/core.js` `NS.dosya` | Görsel dışında PDF yükleme. | Matbaa müşteri dosyası çoğunlukla PDF ve AI. `hazirla` yalnız görsel kabul eder. | Sürüme görsel adresi yazılır | Bekliyor |
| Ç5 | `core/integrations.js` `USED` | Yeni programlar `USED` listesine eklenmesin ya da ürün kodundaki liste ile aynı tutulsun. | `USED` kaydı yoksa `NS.shell(integrations)` listesi geçerli olur, bugün doğru çalışıyor. | Değişiklik gerekmez | Bilgi |
| Ç6 | Programlar arası veri | Aynı işletmede Pastane reçetesi ile Adisyon menüsü arasında okuma yolu. | "Adisyon ile ilişki" isteği otomatik karşılanamadı: Adisyon'da içe aktarma ekranı yok, `/api/data/<app>` program başına ayrı belge. | Spec'te yazılı, otomatik geçiş yok | Karar gerekli |

## Kırmızı kalan test

`server/test/yardim.test.js`: `npm test` zinciri burada durur, çünkü Ç1 satırları `core/` kuralı gereği eklenmedi. Ç1 uygulanınca yeniden çalıştırılmalı; yardım metnindeki kalın ifadeler program klasöründe aranır, bu sınama Ç1 olmadan yapılamadı.

`core/integrations.js` ve `core/notify.js` için satır gerekmez: `USED` kaydı olmayan programda `NS.shell(integrations)` listesi geçerlidir, bildirimler `NS.notify.define` ile programdan tanımlanır. 31 sayısı geçen testler bu dalda kataloğa bağlandı.

## Ç1 satırları

```js
    kurutemizleme: [S('fiyat', 'Fiyat listenizi girin', 'Ürün ve m² fiyatlarınızı yazın.', 'fiyatlar', 'services'), S('ekip', 'Personeli ekleyin', 'Sorumlu ve şoförü tanımlayın.', 'personel', 'staff'), S('fis', 'İlk fişi açın', 'Müşteri ve kalemleri girin.', 'pano', 'orders')],
    matbaa: [S('fiyat', 'Ürün ve fiyatları girin', 'Sık yaptığınız işleri tanımlayın.', 'fiyatlar', 'services'), S('ekip', 'Ekibi ekleyin', 'Grafiker ve ustaları tanımlayın.', 'personel', 'staff'), S('is', 'İlk işi açın', 'Müşteri, ebat ve adedi girin.', 'pano', 'orders')],
    pastane: [S('fiyat', 'Ürünleri girin', 'Satış fiyatlarınızı yazın.', 'fiyatlar', 'services'), S('recete', 'İlk reçeteyi yazın', 'Malzeme ve miktarları girin.', 'receteler', 'recipes'), S('siparis', 'İlk siparişi alın', 'Yazı, tat ve teslim saatini girin.', 'pano', 'orders')],
    cicekci: [S('fiyat', 'Ürünleri girin', 'Buket ve aranjman fiyatlarınızı yazın.', 'fiyatlar', 'services'), S('bolge', 'Teslimat bölgelerini ekleyin', 'Bölge ve ücretleri yazın.', 'bolgeler', 'zones'), S('siparis', 'İlk siparişi alın', 'Alıcı ve saat aralığını girin.', 'pano', 'orders')],
    terzi: [S('fiyat', 'İşlem fiyatlarını girin', 'Sık yaptığınız tadilatları yazın.', 'fiyatlar', 'services'), S('olcu', 'İlk ölçüyü kaydedin', 'Müşteriyi bulup ölçü girin.', 'olculer', 'measures'), S('is', 'İlk işi açın', 'Kalem ve teslim tarihini girin.', 'pano', 'orders')],
```

## Birleştirme notu

Şu dosyalardaki eklemeler diğer paralel oturumlarla aynı satırları değiştirir, birleştirmede ikisi de korunur: `market/market.js` (SLUG), `admin/data.js` (SEC_PID), `server/cloud/sablon.js` (PROGRAMLAR), `sw.js` (V, SHELL), `package.json` (test zinciri). `site/sitemap.xml`, `site/src/lastmod.json` ve ana sayfa gibi üretilen dosyalar birleştirmeden sonra `node site/tools/build-sites.js` ile yeniden üretilir.

## Kod tekrarı raporu

"Sipariş ve Teslim" adlı hazır bir altyapı yoktu. Benzer yapı `apps/servis` ve `apps/otoservis` içindeydi; oradan desen alınıp `apps/siparisortak/` kuruldu.

| Konu | Durum |
|---|---|
| Beş program arası | Fiş, pano, takvim, dağıtım, tahsilat, belge, SMS, müşteri, takip sayfası ve sunucu kuralı tek yerde. Tekrar yalnız `index.html`, `takip.html` iskeleti ve `data.js` içindeki tohum yapısı. |
| `apps/servis` ve `apps/otoservis` ile | Kanban, durum geçmişi, takip sayfası ve SMS sonucu yazma benzer kalıplarla iki kez daha var. Bu oturum onlara dokunmadı. |
| Öneri | Bu motor pilotta oturursa `core/` altına taşınıp yeni sipariş odaklı programlarda kullanılsın. Servis programları ayrı iş olarak değerlendirilir; taşıma riski kazancından büyükse olduğu gibi kalır. |
