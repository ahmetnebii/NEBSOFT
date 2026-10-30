# Çekirdek istekleri: üyelik, eğitim, sağlık oturumu

`core/` bu dalda değiştirilmedi. Yeni program kimlikleri: `dernek`, `egitim`, `danisan`.

## Hazır yama

Dosya: `docs/urun/cekirdek-yama-uyelik.js`. Çekirdek sırası gelince depo kökünde çalıştırılır:

```bash
node docs/urun/cekirdek-yama-uyelik.js && node site/tools/build-yardim.js && node site/tools/build-kb.js
```

Yama şunları ekler. Yalnız kendi satırlarıdır, ikinci çalıştırmada bir şey değiştirmez.

| Dosya | Eklenen |
|---|---|
| `core/kurulum-adimlari.js` | `dernek`, `egitim`, `danisan` için üçer kurulum adımı |
| `core/integrations.js` `USED` | Üç programın entegrasyon listesi |
| `core/integrations.js` `appName` | Görünen adlar (`appAd`) |
| `server/test/program-duman.test.js` | 31 yerine en az 31 program |
| `core/yardim.json`, `core/kb.json` | Üretici komutlarıyla yeniden oluşur |

Yama dalın bir kopyasında denendi: `yardim`, `program-duman`, `sablon` testleri yeşil. Kardeş oturumlar aynı satırlara kendi programını ekleyecektir: `yardim.json` ve `kb.json` çakışırsa elle birleştirilmez, tüm yamalardan sonra üreticiler bir kez çalıştırılır.

`site/tools/yardim-icerik.js` kayıtları ve `docs/video/{dernek,egitim,danisan}.md` bu dalda commit edildi, çekirdek değildir.

## Yama gelmeden kırmızı kalan testler

| Test | Neden | Çözen |
|---|---|---|
| `server/test/yardim.test.js` | `dernek: 0 adım`: `core/kurulum-adimlari.js`, `core/yardim.json`, `core/kb.json` kaydı yok | Hazır yama |
| `server/test/program-duman.test.js` | Program sayısı 31 değil, 34 | Hazır yama |

`server/test/sablon.test.js` yeşildir: üç program `server/cloud/sablon.js` listesine eklenmedi. Şablon sonraki dalgadır.

`npm test` zincirde ilk hatada durur, bu yüzden `yardim` kırmızıyken sonraki testler `npm test` ile çalışmaz. Son durum için her dosya ayrı çalıştırıldı.

## Yama dışı istekler

| Dosya | İstek |
|---|---|
| `core/bizsite.js` | Sektör eşlemesi: dernek, eğitim merkezi. Danışan satış açılınca |
| `core/kvkk.js` | `FREE` listesine `adds`, `title`, `goal`. Program anonimleştirmede bu alanları şimdilik kendisi temizliyor |
| `core/notify.js` | Gerekmiyor, `NS.notify.define` var. Bu dalda bildirim tanımlanmadı |
| `core/forms.js` | Gerekmiyor, `NS.forms.FORMS.<id>` ile programdan eklendi. Danışan onamı avukat kararına kadar eklenmedi |

## Birleştirme notu

- `site/tools/build-sites.js` çalışınca 110 üretilmiş sayfa değişiyor (program sayısı, alt bilgi). Paralel oturumlarla çakışmasın diye yalnız `site/dernekprogrami`, `site/egitimmerkeziprogrami`, iki `assets/og` görseli ve `site/sitemap.xml` satırları commit edildi. Tüm dallar birleşince derleme bir kez çalıştırılmalı.
- `sw.js` `V` değeri her dalda artıyor, birleştirmede en büyük değer +1 yazılır.
- `site/tools/screens.js` Playwright ister, kurulu değil. Görseller başsız Edge ile aynı boyutta alındı.
