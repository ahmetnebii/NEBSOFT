# Klasör yapısı

Hostinge yalnızca `yayin/` klasörünün içeriği yüklenir. Paketi şu komut üretir:

```bash
node scripts/hosting-paketi.js
```

| Klasör | Ne işe yarar | Hostinge gider mi |
|---|---|---|
| `apps/`, `core/`, `market/`, `admin/`, `assets/` | Programlar, ortak çekirdek, pazar yeri, yönetim paneli, görseller | Evet |
| `server/` | Sunucu kodu (`server/test/` hariç) | Evet |
| `site/` | Üretilmiş tanıtım sayfaları (`site/src/`, `site/tools/` hariç) | Evet |
| `server.js`, `index.html`, `sw.js`, `robots.txt`, `sunucu.json`, `package.json`, `package-lock.json` | Ana dosyalar | Evet |
| `data/` | Şifreler, anahtarlar, imza dosyası. Depoya da girmez; sunucudaki `data/` silinmez | **Hayır** |
| `indir/` | Derlenmiş exe ve apk. Gerekirse ayrı yüklenir. `indir/kilavuz/` PDF kılavuzları hosting paketine girer | Ayrı |
| `android/`, `desktop/` | Mobil ve masaüstü kaynak kodu | Hayır |
| `docs/`, `CLAUDE.md`, `README.md`, `DEPLOY.md`, `DESIGN.md`, `.claude/`, `.agents/` | Belgeler ve geliştirme ayarları | Hayır |
| `ic-araclar/` | Yalnızca sana özel araçlar (NEBSOFT Pazarlama) | **Hayır** |
| `scripts/` | Paketleme betikleri | Hayır |
| `node_modules/` | Sunucuda `npm ci --omit=dev` ile kurulur | Hayır |
| `yayin/` | Üretilen paket. Depoya girmez | İçeriği yüklenir |

Yeni bir üst klasör gerekirse `scripts/hosting-paketi.js` içindeki `KLASORLER` listesine eklenir. Listede olmayan hiçbir şey hostinge gitmez. Paket içinde gizli dosya yakalanırsa betik durur.

Klasörler fiziksel olarak taşınmadı: `android/`, `desktop/` ve testlerdeki yollar buna bağlı. Karışıklığı paket çözer.
