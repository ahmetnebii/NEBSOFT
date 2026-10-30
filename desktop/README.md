# NEBSOFT Masaüstü (Electron)

Web sitesindeki giriş akışını masaüstünde açar: giriş → lisansa göre tek program doğrudan, birden fazlaysa program seçici.
Ek olarak bilgisayardaki donanıma erişim sağlar.

| Özellik | Nasıl |
|---|---|
| Giriş ve program listesi | `config.json → serverUrl` adresindeki `/#/giris` açılır; akış web sitesiyle aynıdır |
| Donanım köprüsü | Paketteki `server.js` 127.0.0.1:`bridgePort` üzerinde çalışır; programlar `window.nebsoftDesktop.bridge` ile ağ yazıcısı, terazi, SMS vekili vb. kullanır |
| Seri port | `navigator.serial` çalışır; tek port doğrudan seçilir, birden fazlaysa soru penceresi açılır. Seçim `ayarlar.json` içinde hatırlanır |
| Yazdırma | `NS.printHtml` masaüstünde yazıcı penceresiyle; `localStorage['nebsoft:silentPrint']='1'` ise sessiz (varsayılan yazıcı) |
| Arka plan | Pencere kapatılınca sistem tepsisine iner; sipariş/garson bildirim sesleri çalmaya devam eder |
| Kasa modu | F10 · Yeni pencere Ctrl+N (ör. mutfak ekranı ikinci monitörde) |
| Güncelleme | `electron-updater`, `publish.url` adresindeki `latest.yml` dosyasına bakar |

## Geliştirme

Electron 45.1.0 kullanılır (sürüm sabittir); Node.js 22.12 veya üstü gerekir. Electron 42'den beri ikili dosya `npm install` sırasında değil,
ilk `npm start` çalıştığında indirilir. Önceden indirmek için: `node node_modules/electron/install.js`.

```bash
cd nebsoft-pazar/desktop
npm install
npm start
```

Yerel sunucuya bağlanmak için: `NEBSOFT_URL=http://localhost:5050 npm start`

## Kurulum dosyası üretme

1. `config.json` içindeki `serverUrl` ve `package.json → build.publish[0].url` alanlarına gerçek alan adınızı yazın.
2. İsteğe bağlı: `desktop/icon.png` (512×512) ekleyin.
3. `npm run dist` → çıktı `nebsoft-pazar/indir/NEBSOFT-Kurulum.exe` ve `latest.yml`.
   Sunucu bu klasörü `/indir/` adresinden yayınlar; sitedeki **Masaüstü & Mobil** sayfasındaki düğme dosya yüklenince otomatik etkinleşir.
4. Windows SmartScreen uyarısı görünmemesi için kurulum dosyasını kod imzalama sertifikasıyla imzalayın (`CSC_LINK`, `CSC_KEY_PASSWORD`).
