# Ortak çekirdek önerisi: giriş, SMS, raporlama, faturalama

Tarih: 30.10.2026 · Dal: `guvenlik/denetim`. Taşıma yapılmadı, yalnızca sayım ve öncelik.

Yöntem: `apps/` altındaki `.js` ve `.html` dosyalarında desen sayımı. Sayılar yaklaşıktır: desen dışı yazılmış tekrarlar sayılmaz, bir kısmı meşru kullanımdır. Karar için ölçektir, kesin envanter değildir.

## Sayım

| Alan | Tekrar | Toplam | Program |
|---|---|---:|---:|
| Giriş | Portal giriş ekranı (`db.lookup`) | 22 | 21 |
| Giriş | Telefon rakamlaştırma | 29 | 16 |
| Giriş | Elle `wa.me` bağlantısı | 26 | 15 |
| Giriş | Portal kodu gösterme / yenileme metni | 17 | 6 |
| Giriş | `public-rules.js` giriş kuralı | 21 | 21 kural; yalnızca 3'ü ortak yardımcı kullanıyor, 7 ayrı kod yardımcısı var |
| SMS | Program içi gönderici işlevi | 6 | 6 |
| SMS | Sonuç → durum çevirisi (`simulated ? 'TEST…'`) | 11 | 9 |
| SMS | Elle `db.insert('sms')` | 11 | 9 |
| SMS | Doğrudan `NS.integ.sms` | 15 | 13 |
| SMS | `NS.notify` kullanan | 4 | 2 |
| Rapor | Rapor sayfası işlevi | 22 | 21 |
| Rapor | `chart.bars/donut/line` | 97 | 30 |
| Rapor | `kpi(` kartı | 449 | 31 |
| Rapor | Elle dönem seçici | 4 | 4 |
| Rapor | CSV dışa aktarma | 32 | 15 |
| Fatura | `NS.ebelge.create` | 12 | 8 |
| Fatura | Elle belge HTML (`NS.printHtml`) | 63 | 21 |
| Fatura | `NS.docs` kullanan | 58 | 13 |
| Fatura | Elle KDV hesabı | 6 | 5 |
| Fatura | Elle tahsilat kaydı | 30 | 11 |

## Öncelikli taşıma listesi

Sıralama ölçütü: önce güvenlik ve sahte başarı riski, sonra hata üretme sıklığı, en son kod azalması.

### 1. Mesaj gönderme sonucu: `NS.notify.send()`

Etki yüksek, risk düşük. Bu denetimde bulunan sahte başarıların çoğu, her programın sonucu kendisinin yorumlamasından doğdu. Tek işlev gönderir, `gönderildi / TEST / hata` kaydını yazar, bildirimi gösterir. 9 programdaki 11 çeviri kalkar. `core/core.js` içinde `SMS_TEST` çevresindeki hazır akış temel alınabilir.

### 2. Telefon ve WhatsApp yardımcıları: `NS.phone.digits()`, `NS.phone.wa()`

Etki orta, risk en düşük. Saf işlev, kolay test. Bugün 16 programda ayrı yazılmış; sunucudaki `digits` ile aynı kural kullanılmalı. Aksi halde portal girişinde numara eşleşmesi programa göre değişebilir.

### 3. Portal girişi ve kodu: `NS.portal` + `public-rules` ortak yardımcı

Etki yüksek, risk orta. Kod üretimi, gösterimi, yenilemesi tek yerde olmalı. Sunucuda `login` kuralları tek kalıba inmeli: kimlik alanı + rastgele kod + başarısız deneme sınırı. Randevu sayfasının telefonla girişi (GUVENLIK-RAPORU A2) ve eczanedeki gibi kimlik yanlışları bu kalıpla önlenir. Mevcut portal kodları korunmalı.

### 4. Belge basımı: `NS.printHtml` → `NS.docs`

Etki orta, risk orta. `CLAUDE.md` yazdırılan her belgenin `NS.docs`'tan geçmesini söylüyor; 21 programda 63 elle HTML var. Önce fatura ve makbuz niteliğindekiler (fabrika, muhasebe, klinik, butik, kuyumcu), sonra iç listeler.

### 5. Tahsilat kaydı ve KDV: `NS.money`

Etki yüksek, risk yüksek. Para hesabı programlara göre farklı alan adları kullanıyor. Önce KDV yardımcısı, sonra tahsilat. Tahsilat taşıması eski kayıtlara dokunmamalı. Her program için mevcut kural testi şart; olmayanlara önce test yazılmalı.

### 6. Rapor iskeleti: `NS.reportPage({ range, kpis, charts, table, csv })`

Etki düşük, risk düşük. Hata üretmiyor, kod azaltır. Dönem seçici ve CSV ile başlanabilir. 449 `kpi` çağrısının taşınması gerekmez.

## Taşımada dikkat

- `core/` değişikliği 31 programı etkiler; paralel oturumlarda tek oturum değiştirir.
- Her adımda `server/test/program-duman.test.js` çalıştırılır ve birkaç program tarayıcıda denenir.
- Statik dosya değişince `sw.js` `V` sürümü artırılır.
