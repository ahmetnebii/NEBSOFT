# Çekirdek istekleri: mobilya, okulservisi, ciftci, lastik

Bu oturum `core/` değiştirmedi. Aşağıdakiler birleştirmede veya çekirdek oturumunda yapılır.

## Kayıt satırları (programlar bunlar olmadan da çalışır, ilgili yardım eksik kalır)

`core/kurulum-adimlari.js` `STEPS` içine:

```js
mobilya: [S('malzeme', 'Malzemeleri girin', 'İlk malzemenizi ekleyin.', 'malzeme', 'materials'), S('katalog', 'Fiyat kataloğunu girin', 'Sık kullandığınız işçilikleri ekleyin.', 'katalog', 'catalog'), S('musteri', 'Bir müşteri kaydedin', 'Telefonuyla müşteri açın.', 'musteriler', 'customers'), S('is', 'İlk talebi açın', 'Yeni talep ile başlayın.', 'isler', 'jobs')],
okulservisi: [S('arac', 'Aracınızı ekleyin', 'Plaka ve koltuk sayısını girin.', 'araclar', 'vehicles'), S('personel', 'Şoförü ekleyin', 'Şoför ve rehberi girin.', 'personel', 'staff'), S('guzergah', 'Güzergâhı oluşturun', 'Durakları sırayla yazın.', 'guzergah', 'routes'), S('ogrenci', 'İlk öğrenciyi kaydedin', 'Veli telefonuyla ekleyin.', 'ogrenciler', 'students')],
ciftci: [S('uretici', 'İlk üreticiyi ekleyin', 'Telefon ve köy bilgisini girin.', 'ureticiler', 'producers'), S('urun', 'Ürün ve girdileri girin', 'Alınan ürünü tanımlayın.', 'stok', 'products'), S('alim', 'İlk alımı yapın', 'Kantar bilgisiyle makbuz kesin.', 'alim', 'purchases')],
lastik: [S('stok', 'Stoğu girin', 'İlk lastiği DOT ile ekleyin.', 'stok', 'stock'), S('arac', 'Araç kaydedin', 'Plaka ve ebadı girin.', 'araclar', 'vehicles'), S('otel', 'Lastik otelini başlatın', 'İlk takımı rafa alın.', 'otel', 'hotels')],
```

Sonra:

```bash
node site/tools/build-yardim.js
```

```bash
node site/tools/build-kb.js
```

`server/test/yardim.test.js` içindeki `KAYITLI` süzgeci bu satırlar gelince kendiliğinden tüm ürünleri kapsar. Üretilen `core/yardim.json` ve `core/kb.json` bu oturumda değiştirilmedi.

`core/forms.js` `FORMS` satırı (imzalı belgeler sayfası için; yoksa sayfa boş kalır, programlar kendi belgelerini `NS.docs` ile basar):

```js
mobilya: { coll: 'customers', party: 'Müşteri', kinds: [] }, okulservisi: { coll: 'students', party: 'Veli', kinds: [] }, ciftci: { coll: 'producers', party: 'Üretici', kinds: [] }, lastik: { coll: 'customers', party: 'Müşteri', kinds: [] },
```

`core/bizsite.js` `BIZ_TYPES`: `mobilya` için `FurnitureStore`, `lastik` için `TireShop`, `okulservisi` için `LocalBusiness`, `ciftci` için `LocalBusiness`. schema.org türleri bağlanmadan önce doğrulanmalı.

`core/notify.js` olayları: mobilya müşteri onayı (`jobs`), okul servisi veli mesajı (`messages`) ve gelmeyecek bildirimi (`absences`), lastik teslim talebi (`hotels`).

`core/integrations.js`: program bazlı yardım metni (`opts.integrations` çalıştığı için zorunlu değil).

## Davranış istekleri
- `NS.crud` sayfalama: 5.000 satırda ilk çizim 2 saniye. Çiftçi alım ve satışları bu yüzden son 90 gün ile açılıyor.
- `NS.ebelge.create()` e-Müstahsil desteği: `ciftci` ve `fabrika` şu an `NS.integ.call('emustahsil')` kullanıyor.
- `NS.uid` zaman tabanlı: müşteri bağlantısı üreten programlar için ortak `NS.gizliKod()` faydalı olur. Bu dört program `crypto.getRandomValues` kullanıyor.

## Birleştirmede
- `node site/tools/build-sites.js` bir kez çalıştırıldı; yalnız dört yeni sayfa klasörü, `site/sitemap.xml` ve `site/src/lastmod.json` tutuldu, diğer üretilmiş sayfalar geri alındı (paralel oturumlarla çakışmasın). Birleştirmede yeniden derleyin: ana sayfa, `/programlar` ve iç bağlantılar yeni programları o zaman gösterir.
- `assets/og/og-mobilya.png`, `og-okulservisi.png`, `og-ciftci.png`, `og-lastik.png` şimdilik genel `og.png` kopyasıdır. Ürün görselleri üretilmeli; mevcut görsellerde fiyat yazdığı için fiyat kararı beklenmeli.
- `site/tools/screens.js` Playwright ister, bu ortamda yok. Dört ürünün ekran görüntüleri üretilmeli, yoksa tanıtım sayfasında görsel kırık olur.
- `server/cloud/seo.js` `PAGES`: portallar `noindex` olduğu için eklenmedi.
- `server/test/program-duman.test.js`, `sablon.test.js`, `yardim.test.js` düzeltmesi diğer oturumlarla çakışabilir; değişiklik paylaşılan nota yazıldı.
