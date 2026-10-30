# Saha hizmeti programları: çekirdek istekleri

Bu oturum `core/` değiştirmedi (`CLAUDE.md` §4). Aşağıdaki yamalar birleştirme aşamasında uygulanır. Uygulanana kadar şu testler **kırmızıdır**, bu beklenen durumdur ve geçti sayılmaz:

| Test | Neden |
|---|---|
| `server/test/program-duman.test.js` | Program sayısını 31 diye denetler, dal 35 programlı |
| `server/test/sablon.test.js` | `PROGRAMLAR` uzunluğunu 31 diye denetler, dal 35 |
| `server/test/yardim.test.js` | Katalogdaki her ürün için `core/kurulum-adimlari.js`, `core/yardim.json`, `core/kb.json`, `docs/video/<id>.md` ister |

## Ç1. Kurulum adımları: `core/kurulum-adimlari.js`, `STEPS` içine

```js
nakliyat: [S('arac', 'Araçlarınızı ekleyin', 'Plaka ve kapasite girin.', 'araclar', 'vehicles'), S('ekip', 'Ekiplerinizi tanımlayın', 'Saha ekibini ekleyin.', 'ekipler', 'teams'), S('tasima', 'İlk taşımayı açın', 'Talebi kaydedin.', 'isler', 'jobs')],
temizlik: [S('ekip', 'Ekiplerinizi tanımlayın', 'Saha ekibini ekleyin.', 'ekipler', 'teams'), S('musteri', 'Bir müşteri ekleyin', 'Sözleşmeli müşterinizi girin.', 'musteriler', 'customers'), S('sozlesme', 'İlk sözleşmeyi açın', 'Sıklık ve ücreti girin.', 'sozlesmeler', 'contracts')],
usta: [S('usta', 'Ustalarınızı ekleyin', 'Sahadaki ekibi tanımlayın.', 'ekipler', 'teams'), S('musteri', 'Bir müşteri ekleyin', 'Müşteri kartını açın.', 'musteriler', 'customers'), S('cihaz', 'Bir cihaz kaydedin', 'Kombi veya klimayı girin.', 'cihazlar', 'devices'), S('is', 'İlk iş emrini açın', 'Randevuyu kaydedin.', 'isler', 'jobs')],
peyzaj: [S('ekip', 'Ekiplerinizi tanımlayın', 'Saha ekibini ekleyin.', 'ekipler', 'teams'), S('urun', 'Ürün kartı ekleyin', 'Ruhsat bilgisini girin.', 'stok', 'items'), S('sozlesme', 'İlk sözleşmeyi açın', 'Sıklık ve ücreti girin.', 'sozlesmeler', 'contracts')],
```

## Ç2. Entegrasyon listeleri: `core/integrations.js`

`USED` (satır 784) içine:

```js
nakliyat: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], temizlik: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], usta: ['callerid', 'sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'], peyzaj: ['sms', 'whatsapp', 'email', 'printer', 'pos', 'efatura', 'webhook', 'backup'],
```

`appName` (satır 870) içine:

```js
nakliyat: 'Evden Eve Nakliyat', temizlik: 'Temizlik & Tesis', usta: 'Mobil Usta & Tesisat', peyzaj: 'Peyzaj & İlaçlama',
```

## Ç3. Yardım çıktıları

Ç1'den sonra iki üretici çalıştırılır. İçerik `site/tools/yardim-icerik.js` dosyasına eklendi. `core/yardim.json`, `core/kb.json` ve `docs/video/<id>.md` üretilir:

```bash
node site/tools/build-yardim.js
```

```bash
node site/tools/build-kb.js
```

`build-kb.js` menüyü `apps/<id>/app.js` içinden okur, dört programın menüsü bu dosyalardadır. Sayfa içeriği `apps/saha-ortak/saha.js` içinde olduğu için düğme adları `yardim.test.js` kalın ifade denetiminden geçmeyebilir: `Yeni taşıma`, `İşi bitir` gibi ifadeler programın kendi klasöründe aranır. Denetim kırmızı verirse iki çözüm var: `kaynak()` işlevine `apps/saha-ortak/` eklenir veya ilgili ifade kalın yazılmaz. Birinci öneri.

## Ç4. Program sayısı testleri

- `server/test/program-duman.test.js` satır 158-159: 31 yerine güncel program sayısı.
- `server/test/sablon.test.js`: `S.PROGRAMLAR.length` beklenen sayısı.
- `server/test/yardim.test.js`: "31 programın" metni.

Paralel oturumlar birleşince son sayı yazılır. Sayı `apps/` altında `index.html` taşıyan klasörlerden gelir; `apps/saha-ortak/` program değildir ve `index.html` taşımaz.

## Ç5. Küçük eşleştirmeler

- `core/bizsite.js`: işletme sitesi sektör eşleşmesi (temizlik, nakliyat, ilaçlama, tesisat).
- `admin/data.js`: yönetim paneli sektör listesi (çekirdek değil, görevin dışında bırakıldı).
- `docs/PROJE-OZETI.md`, `CLAUDE.md` ve vitrin metinlerindeki "31 program" ifadesi.

## Ç6. Üretilmiş sayfalar

Diğer programların sayfalarındaki alt bilgi listesi bu dalda güncellenmedi, birleştirme çakışması olmasın diye yalnız dört yeni sayfa, `site/sitemap.xml`, `site/src/lastmod.json`, `index.html` ve `robots.txt` commit edildi. Birleştirmeden sonra bir kez çalıştırılır:

```bash
node site/tools/build-sites.js
```
