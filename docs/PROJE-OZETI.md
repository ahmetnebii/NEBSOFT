# NEBSOFT proje özeti

Yeni oturum için hızlı giriş. Bu dosyayı okuyan oturum projeyi baştan taramamalı: aranan konunun dosyasını aşağıdaki tablodan bulup yalnız onu açmalı. Kurallar `CLAUDE.md`, yarım işler `docs/DEVAM-NOTU.md`, ayrıntılı günlük `docs/DEVIR.md` içindedir.

## Ne bu

Türkiye'deki işletmeler için 51 sektörel web programı (`danisan` satışa kapalı), ortak çekirdek, pazar yeri sitesi, bulut sunucusu, masaüstü (Electron) ve Android kabuğu. Arayüz dili Türkçe. Ana dal: `devir/hepsi`. Depo: `ahmetnebii/NEBSOFT`.

Programlar (`apps/<id>/`): adisyon, anaokulu, bilet, butik, crm, eczane (yeni satışa kapalı), emlak, eticaret, fabrika, fiyatrobotu, galeri, hukuk, ik, kargo, kiralama, klinik, kurs, kuyumcu, muhasebe, musavir, otel, oto, otoservis, pazaryeri, pos, randevu, servis, site, spor, toptan, veteriner. Yeni: cicekci, ciftci, danisan, dernek, dugun, egitim, fotograf, kurutemizleme, lastik, matbaa, mobilya, nakliyat, okulservisi, oyun, pastane, peyzaj, temizlik, terzi, usta, yurt. Program değil, ortak kod: `apps/saha-ortak/`, `apps/siparisortak/`.
Saha hizmeti programları (nakliyat, temizlik, usta, peyzaj) ortak motoru kullanır: `apps/saha-ortak/` (`hesap.js`, `saha.js`, `portal.js`), yeni kural `sahaKural` ve `sahaEkip`.

## Teknoloji

- Tarayıcı: düz JavaScript, derleme adımı yok, çerçeve yok. Yoğun tek satırlık stil, Türkçe yorum, bağımlılıksız kod.
- Sunucu: Node.js (`server.js`), tek üretim bağımlılığı `mysql2` 3.24.6. Veritabanı MySQL veya MariaDB.
- Masaüstü: Electron 45.1.0 (`desktop/`). Android: `android/`.
- e-Belge: UBL-TR `core/ubltr.js`, görünüm `core/ebelge/general.xslt` + `core/vendor/xslt-polyfill`.

## Veri modeli (en önemli bilgi)

Her işletme + program için **tek JSON belge** vardır: `app_data(tenant_id, app, data, version)`. İstemci belgenin tamamını alır, tamamını yazar. Çakışma sürüm numarasıyla yakalanır, istemci üç yollu birleştirir (`merge3`, `core/core.js`). Belge içinde koleksiyonlar dizi olarak durur (`patients`, `sales`), ayrıca `users`, `_settings`, `_meta`, `_log`.

Yazma yolları:
- Personel: `GET/PUT /api/data/:app` (`server/cloud/routes.js`).
- Müşteri sayfaları: `/api/public/:slug/:app/view|ops` (`server/cloud/public.js`), yalnız `public-rules.js` beyaz listesi.

Çalışma kipleri:
- Demo: `?demo=1`, veri tarayıcıda, örnek veriyle.
- Yerel: sunucu var, veritabanı yok; veri `localStorage`da, köprü `/api/*` yalnız 127.0.0.1.
- Bulut: `db.cloud`, MySQL, oturum, lisans.

## Klasörler

| Yol | İçerik |
|---|---|
| `apps/<id>/` | `app.js`, `index.html`, varsa `data.js`, müşteri sayfaları (`book.html`, `veli.html`) |
| `core/` | Tüm programların ortak çekirdeği. Değişiklik hepsini etkiler |
| `server.js` | HTTP sunucusu, statik dosya, güvenlik filtresi |
| `server/cloud/` | Bulut API'si, aşağıda |
| `server/connectors/` | Pazaryeri bağlayıcıları (Trendyol, n11) |
| `server/test/` | Testler |
| `market/`, `index.html` | Pazar yeri (hash yönlendirmeli tek sayfa), `market/catalog.js` ürün ve fiyat kaynağı, `market/paketler.js` hazır paket listesi |
| `site/` | Üretilen statik SEO sayfaları. Elle düzenleme: `site/src/`, `site/tools/` |
| `admin/` | Platform yönetim paneli |
| `config/` | `destek-paketleri.json`, `toplu-indirim.json` (örnek fiyatlar), `bayi.json` (komisyon oranı, boş). Varsayılandır, panel kaydı önce gelir |
| `content/sablonlar/` | Program şablonları |
| `ic-araclar/nebsoftpazarlama/` | Özel araç, yayına çıkmaz |
| `scripts/` | `hosting-paketi.js`, `belge-coz.js`, `totp-sifirla.js`, `katalog-off-al.js` |
| `docs/` | Rapor ve spec. `docs/urun/<PROGRAM>.md` ürün spec'leri |
| `data/`, `indir/`, `yayin/` | Git'e girmez: gizli bilgi, derleme, hosting çıktısı |

## Konuya göre nereye bakılır

| Konu | Dosya |
|---|---|
| Ortak yapı taşları | `core/core.js`: `NS.shell`, `NS.DB`, `NS.table`, `NS.crud`, `NS.formModal`, `NS.settingsPage`, `NS.approve`, `NS.pinKontrol`, `NS.dosya` |
| Belge tasarımı, imzalı form | `core/docs.js`, `core/forms.js` |
| Entegrasyon, e-Belge | `core/integrations.js`, `core/integ-wizard.js`, rehberler `core/integ-guides*.js`; sözleşme gerektirenler `UNVERIFIED` listesinde, envanter `docs/ENTEGRASYON-ENVANTERI.md` |
| Sağlayıcı istemcileri | `server/cloud/entegrasyon/<saglayici>.js`, uçlar `server/cloud/entegrasyon-api.js`, durum tablosu `entegrasyon_durum` |
| API uçları | `server/cloud/routes.js` |
| Rol kuralları | `server/cloud/rol-kural.js`, ekip ekranı `market/market.js` |
| Belge şifreleme | `server/cloud/belge.js` (klinik, eczane, veteriner, danisan, ik, anaokulu, entegrasyon) |
| PIN | `server/cloud/pin.js`, istemci `pinKontrol` |
| Kimlik bilgisi şifreleme | `server/cloud/secrets.js` |
| Dosya deposu | `server/cloud/dosya.js`, `/f/<tenant>/<id>` |
| Giriş, oturum, TOTP | `server/cloud/auth.js`, `totp.js`, `totp-api.js` |
| Sipariş, fiyat, indirim | `server/cloud/catalog.js`, `indirim.js`, `destek.js`, `teklif.js` |
| Ödeme | `server/cloud/odeme.js`, `shopier.js` |
| Ortak katalog | `server/cloud/katalog.js`, `katalog-api.js`, `docs/KATALOG-LISANS.md` |
| Log ve analitik | `server/cloud/log.js`, `analitik.js`, `docs/LOG-YAPISI.md` |
| Dış istek köprüsü | `server/cloud/bridge.js`, `/api/istek` |
| Hazır paketler | `market/paketler.js`, `market/paket-ek.js`, `server/cloud/paket.js`, `site/src/paketler.js`, rapor `docs/HAZIR-PAKETLER.md` |
| SEO | `site/tools/build-sites.js`, `site/src/products.js`, `server/cloud/seo.js`, `docs/SEO-KURALLARI.md`, denetleyici `site/tools/seo-denetim.js`, rapor `docs/SEO-DENETIM.md` |
| Ücretsiz araçlar | `site/src/araclar/<slug>.js`, `site/tools/build-araclar.js`, görsel ve PDF altyapısı `docs/ARACLAR-DOSYA.md` |
| Rehber yazıları | `site/src/rehber/*.md` |
| Bayilik, veri taşıma, sistem durumu, yenilikler, yol haritası, WhatsApp | `server/cloud/vitrin.js`, `site/tools/guven-sayfalari.js`, `admin/panel-guven.js`, `docs/GUVEN-SAYFALARI.md` |
| Güvenlik durumu | `docs/GUVENLIK-RAPORU.md` |
| Söylenebilir iddialar | `docs/IDDIA-LISTESI.md` |
| Kurulum ve ayarlar, panele taşınan ayarlar | `server/cloud/kurulum.js`, `isletim.js`, `admin/panel-kurulum.js`, `docs/ADMIN-AYAR-DENETIMI.md` |
| Kurulum | `DEPLOY.md`, klasör ayrımı `docs/KLASOR-YAPISI.md` |
| Pazarlama | `docs/pazarlama/` |

## Komutlar

```bash
npm test
```

```bash
PORT=5064 node server.js
```

```bash
node site/tools/build-sites.js
```

```bash
node scripts/hosting-paketi.js
```

- `npm test` MariaDB ister; XSD testi .NET ister, atlanırsa "atlandı" raporlanır.
- MariaDB yerelde portatif kurulu: `"$LOCALAPPDATA/MariaDB/mariadb-11.4.5-winx64/bin/mariadbd.exe" --datadir="$LOCALAPPDATA/MariaDB/data" --port=3306 --bind-address=127.0.0.1 --console`, root şifresiz.
- Statik dosya değişince `sw.js` içindeki `V` artırılır, yeni statik dosya `SHELL`e eklenir.
- `site/src` değişince sayfalar yeniden üretilir, üretilmiş HTML elle düzeltilmez.
- Yeni test dosyası `package.json` `test` zincirine `cloud.test.js`ten önce eklenir.

## Tuzaklar

- Belge şifreli olabilir: `app_data.data` doğrudan `JSON.parse` edilmez, `belge.oku` kullanılır. SQL `LIKE` şifreli belgede çalışmaz.
- PUT öncesi sıra önemli: rol geri koyma, PIN özetleme, gizli bilgi mührü, şifreleme.
- `cat.product()` yalnız satıştaki ürünü döner; lisanslı ama kapalı ürün için `cat.kayitli()`.
- Yeni alan eski kayıtlarda eksik olabilir.
- Bulutta `db.load()` sunucudan okur, 350 ms içinde gönderilmemiş kaydı siler. `save` ile aynı akışta `load` yazılmaz; ayrıntı `docs/BULUT-LOAD-DENETIMI.md`.
- Tek satırlı test satırına `//` yorum eklemek satırın kalanını yutar.
- Dosyalarda CRLF olabilir, yamadan önce satır sonunu kontrol et.
- Tarayıcı panelinde service worker kaydı hata verir; bu hata panele özgü görünüyor, gerçek Chrome'da doğrulanmadı.
- `CLOUD` bulut kipinde birden çok kullanıcı varsa PIN ekranı açılır; rol atanmış hesapta PIN ekranı yoktur.
- Entegrasyonda Bağlı yalnız gerçek Bağlantıyı dene sonucundan yazılır, bilgi değişince yeniden deneme gerekir. Simülasyon her yerde TEST görünür. Sanal POS canlı işlemi `<SAGLAYICI>_CANLI=1` olmadan yapılmaz.

## Token tasarrufu

Bütün depoyu tarama. `Grep` ile dosya ve satırı bul, yalnız gereken aralığı oku. Program işi `apps/<id>/` ve `docs/urun/<PROGRAM>.md` ile sınırlıdır. Üretilmiş `site/*/index.html`, `yayin/`, `node_modules/`, `core/vendor/` okunmaz.
