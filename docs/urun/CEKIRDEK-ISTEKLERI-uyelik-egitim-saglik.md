# Çekirdek istekleri: üyelik, eğitim, sağlık oturumu

`core/` bu oturumda değiştirilmedi. Yeni program kimlikleri: `dernek`, `egitim`, `danisan`.

| Dosya | İstek |
|---|---|
| `core/kurulum-adimlari.js` | Üç program için 3-5 kurulum adımı. Öneri aşağıda |
| `core/yardim.json`, `core/kb.json` | `site/tools/yardim-icerik.js` kaydı, ardından yeniden üretim |
| `core/notify.js` | Program kaydı gerekmiyor, `NS.notify.define` ile eklenebilir. Bu oturumda bildirim tanımlanmadı |
| `core/bizsite.js` | Sektör eşlemesi: dernek, eğitim merkezi |
| `core/integrations.js` | `appName` ve `appGroups` satırları. Şu an isim kimlik olarak görünür |
| `core/kvkk.js` | `FREE` listesine `adds`, `title`, `goal` eklenebilir. Program anonimleştirmede bu alanları kendisi temizliyor |
| `core/forms.js` | Gerekmiyor: `NS.forms.FORMS.<id>` ile programdan eklendi. Danışan onamı avukat kararına kadar eklenmedi |

Kurulum adımı önerisi:

- `dernek`: `S('uye', 'Üyeleri ekleyin', 'İlk üyeyi kaydedin.', 'uyeler', 'members')`, `S('aidat', 'Aidat tahakkuku yapın', 'Dönem aidatını yazın.', 'aidat', 'dues')`, `S('toplanti', 'İlk toplantıyı planlayın', 'Gündem ve tarih girin.', 'toplanti', 'meetings')`
- `egitim`: `S('egitim', 'Eğitim kataloğunu girin', 'Saat ve ücretle ilk eğitimi ekleyin.', 'egitimler', 'courses')`, `S('grup', 'Grup açın', 'Tarih ve eğitmen seçin.', 'gruplar', 'groups')`, `S('kursiyer', 'İlk kursiyeri kaydedin', 'Kaydı ve ödeme planını girin.', 'kursiyerler', 'trainees')`
- `danisan`: `S('hizmet', 'Hizmetleri girin', 'Süre ve ücret tanımlayın.', 'hizmetler', 'services')`, `S('danisan', 'İlk danışanı ekleyin', 'Danışan kartını açın.', 'danisanlar', 'clients')`, `S('randevu', 'İlk randevuyu verin', 'Tarih ve saat seçin.', 'takvim', 'appts')`

`server/test/yardim.test.js` bu satırlar gelene kadar kaydı olmayan programı atlar (kardeş oturumlarla aynı geçici çözüm).

## Birleştirme notu

- `site/tools/build-sites.js` çalışınca 110 üretilmiş sayfa değişiyor (program sayısı, alt bilgi). Paralel oturumlarla çakışmasın diye yalnız `site/dernekprogrami`, `site/egitimmerkeziprogrami`, iki `assets/og` görseli ve `site/sitemap.xml` satırları commit edildi. Tüm dallar birleşince derleme **bir kez** çalıştırılmalı.
- `sw.js` `V` değeri her dalda artıyor, birleştirmede en büyük değer +1 yazılır.
- `site/tools/screens.js` Playwright ister, kurulu değil. Görseller başsız Edge ile aynı boyutta alındı.
