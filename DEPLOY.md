# NEBSOFT — Canlıya Alma Rehberi

Bu rehber, sistemi gerçek müşterilere satışa açmak için sunucuya kurmayı adım adım anlatır.
Önerilen kurulum: **Ubuntu 22.04/24.04**, **Node.js 20+**, **MySQL 8 veya MariaDB 10.6+**, önde **nginx + Let's Encrypt (HTTPS)**.

---

## 1. Mimari (kısa)

```
İnternet ──HTTPS──> nginx (443) ──HTTP──> node server.js (127.0.0.1:5050) ──> MySQL
```

- `server.js`: web sitesi, satış sayfası (pazar), 31 uygulama, yönetim paneli (`/admin/`) ve bulut API'si.
- Veritabanı bağlantı bilgileri **yönetim panelinden** girilir ve diskte **AES-256-GCM ile şifreli** saklanır (`data/config.enc`).
- Her işletmenin uygulama verisi MySQL'de tutulur. İşletmenin müşterilerine açık sayfaları `/t/<işletme>/` altında çalışır.
- Ödeme yöntemi **havale/EFT**dir. Müşteri sipariş verir, admin panelinde **"Ödendi"** dendiğinde lisans açılır.
- Her ürün **7 gün ücretsiz** denenir. Süre, panelde Site Ayarları'ndan değiştirilebilir.

## 2. Sunucu hazırlığı

```bash
sudo apt update && sudo apt install -y nginx git ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable   # 5050 ve 3306 dışarı AÇILMAZ
sudo adduser --system --group --home /opt/nebsoft nebsoft
```

## 3. Kodu kurun

```bash
sudo -u nebsoft git clone <depo-adresi> /opt/nebsoft/app
cd /opt/nebsoft/app/nebsoft-pazar
sudo -u nebsoft npm ci --omit=dev
sudo -u nebsoft mkdir -p /opt/nebsoft/data && sudo chmod 700 /opt/nebsoft/data
```

## 4. Ortam değişkenleri

| Değişken | Örnek | Açıklama |
|---|---|---|
| `NODE_ENV` | `production` | Oturum çerezleri her zaman `Secure` olur |
| `PORT` | `5050` | Node'un dinlediği port |
| `HOST` | `127.0.0.1` | **Yalnızca nginx erişsin.** Dışarıya açmayın |
| `TRUST_PROXY` | `1` | nginx arkasında gerçek IP ve HTTPS bilgisini okur. Proxy yoksa **koymayın** |
| `NEBSOFT_SECRET` | 64 karakter rastgele | Şifreleme ana anahtarı. Üretmek için: `openssl rand -hex 32`. **Kaybetmeyin ve değiştirmeyin**, aksi halde kayıtlı DB ayarı çözülemez |
| `NEBSOFT_DATA` | `/opt/nebsoft/data` | Şifreli ayar, kurulum anahtarı (kod klasörünün dışında tutun) |
| `DB_POOL` | `10` | MySQL bağlantı havuzu boyutu |

`/etc/nebsoft.env` dosyasını oluşturun ve `chmod 600` yapın:

```
NODE_ENV=production
PORT=5050
HOST=127.0.0.1
TRUST_PROXY=1
NEBSOFT_SECRET=<openssl rand -hex 32 çıktısı>
NEBSOFT_DATA=/opt/nebsoft/data
```

## 5. systemd servisi

`/etc/systemd/system/nebsoft.service`:

```ini
[Unit]
Description=NEBSOFT
After=network.target mysql.service

[Service]
User=nebsoft
WorkingDirectory=/opt/nebsoft/app/nebsoft-pazar
EnvironmentFile=/etc/nebsoft.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now nebsoft
sudo journalctl -u nebsoft -f      # ilk açılışta "Kurulum anahtarı: ..." satırını görürsünüz
```

> **Tek süreç çalıştırın.** İstek sınırlama ve giriş denemesi sayaçları bellektedir. pm2 kullanacaksanız *cluster* değil *fork* modunu seçin.

## 6. nginx + HTTPS

`/etc/nginx/sites-available/nebsoft`:

```nginx
server {
  listen 80;
  server_name www.alanadiniz.com alanadiniz.com;
  location /.well-known/acme-challenge/ { root /var/www/html; }
  location / { return 301 https://www.alanadiniz.com$request_uri; }
}
server {
  listen 443 ssl http2;
  server_name www.alanadiniz.com;
  # ssl_certificate satırlarını certbot ekler
  client_max_body_size 25m;
  gzip on; gzip_types text/css application/javascript application/json image/svg+xml application/xml;
  location / {
    proxy_pass http://127.0.0.1:5050;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # istemci IP'si (üzerine yazılır, sahte başlık geçmez)
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 70s;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nebsoft /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d www.alanadiniz.com -d alanadiniz.com
```

## 7. MySQL ve ilk kurulum (yönetim paneli)

1. `https://www.alanadiniz.com/admin/` adresini açın. Kurulum sihirbazı başlar.
2. **Adım 1:** Veritabanı adı, kullanıcı adı ve uygulama sunucusunun IP'sini girin. Panel, güçlü şifreli bir **CREATE DATABASE / CREATE USER / GRANT** SQL'i üretir. Bu SQL'i MySQL'de yetkili kullanıcıyla bir kez çalıştırın:
   ```bash
   sudo mysql < kurulum.sql
   ```
   MySQL ayrı bir sunucudaysa:
   - Uygulama sunucusunun IP'sini kullanıcı tanımında belirtin (`'nebsoft'@'10.0.0.5'`).
   - MySQL'de `bind-address` ayarını iç ağ IP'sine çekin.
   - 3306 portunu güvenlik duvarında **yalnızca bu IP'ye** açın.
3. **Adım 2:** MySQL IP adresi, veritabanı adı, kullanıcı adı ve şifreyi girin. Ayrıca **kurulum anahtarını** girin; anahtar servis günlüğünde ve `NEBSOFT_DATA/setup-token.txt` dosyasındadır. Bağlantı denenir, tablolar otomatik oluşur ve bağlantı bilgisi şifreli kaydedilir.
4. **Adım 3:** İlk süper yönetici hesabını oluşturun (şifre en az 12 karakter). Bundan sonra kurulum anahtarı geçersizleşir.

Bu noktadan sonra tüm uygulamalar, satış sitesi ve müşteri sayfaları bu MySQL bağlantısıyla çalışır.

## 8. Satışa açmadan önce (yönetim paneli)

- **Site Ayarları:**
  - **Site adresi** `https://www.alanadiniz.com` olarak girilmeli. Tanıtım sitelerindeki adresler, sitemap ve kanonik linkler buna göre üretilir.
  - Telefon, e-posta ve adres girilmeli.
  - Deneme süresi 7 gün, tavsiye ödülü 30 gün.
- **Banka Hesapları:**
  - Havale için hesap sahibinin **ad soyad / unvan** bilgisini, banka adını ve **IBAN**'ı girin. IBAN kontrol hanesi doğrulanır.
  - Aktif hesap olmadan sipariş alınmaz.
- **Kuponlar** (isteğe bağlı) ve **Yöneticiler**: personeliniz için ayrı hesaplar açın, ortak şifre kullanmayın.
- **Arama motorları:**
  - Ayarlar sayfasındaki **"Arama motorlarına bildir"** düğmesine basın (IndexNow: Bing, Yandex vb.).
  - Google Search Console'a `https://www.alanadiniz.com/sitemap.xml` adresini bir kez ekleyin.
- Yasal metinler (KVKK, mesafeli satış, iade) **örnek şablondur**. Yayından önce hukukçunuza onaylatın.

### Satış akışı

1. Müşteri siteden kayıt olur, istediği ürünü **7 gün ücretsiz** dener.
2. Sepetten sipariş verir. Fiyat sunucuda hesaplanır. Sipariş **"Ödeme bekliyor"** durumuna geçer ve müşteriye IBAN bilgileri gösterilir.
3. Havale gelince admin panelinde **Havale Onayı → "Ödendi"** denir. Lisans açılır veya uzar (aylık: +1 ay, yıllık: +12 ay).
4. Tavsiye ile gelen işletmenin ilk ödemesinde iki tarafa da ödül günleri eklenir.

### Sistemin kendini pazarlaması

- Her işletmenin `/t/<işletme>/` sayfası (online randevu, takip, portal bağlantıları) site haritasına **otomatik** eklenir.
- İşletme sitesi yayında ve içeriği yeterliyse dizine açıktır; `/t/<işletme>/hizmet/<slug>/` hizmet sayfaları ve `/t/<işletme>/sitemap.xml` sunucuda üretilir (kendi alan adında `/hizmet/<slug>/`, `/sitemap.xml`, `/robots.txt`). Sitesi yayında olmayan işletmenin yalın sayfası `noindex`tir ve kayıt telefonu/adresi göstermez.
- Müşteri sayfalarının altında, işletmenin tavsiye koduyla **"NEBSOFT ile hazırlandı · 7 gün ücretsiz deneyin"** bağlantısı bulunur. Bu bağlantıdan kayıt olan her işletme tavsiye programına girer.
- 31 ürün tanıtım sitesi (`/randevusistemi`, `/adisyonprogrami` …) ve `/programlar` merkez sayfası şema (SoftwareApplication, FAQ, Organization) içerir.

## 9. Yedekleme

```bash
# /etc/cron.d/nebsoft-yedek — her gece 03:15, 14 gün sakla
15 3 * * * root mysqldump --single-transaction --routines nebsoft | gzip > /var/backups/nebsoft-$(date +\%F).sql.gz && find /var/backups -name 'nebsoft-*.sql.gz' -mtime +14 -delete
```

- `NEBSOFT_DATA` klasörünü (`config.enc`) ve `/etc/nebsoft.env` dosyasını (`NEBSOFT_SECRET`) **ayrıca** güvenli bir yere yedekleyin.
- Yedekleri başka bir sunucuya veya nesne depolamaya kopyalayın.
- Geri yükleme: `gunzip < yedek.sql.gz | mysql nebsoft`
- Uygulama verilerinin son 48 saatlik saatlik anlık görüntüleri `app_data_history` tablosunda tutulur. Bu, yanlışlıkla silinen verilerin kurtarılması içindir.

## 10. Güncelleme

```bash
cd /opt/nebsoft/app && sudo -u nebsoft git pull
cd nebsoft-pazar && sudo -u nebsoft npm ci --omit=dev
sudo systemctl restart nebsoft      # tablolar açılışta otomatik güncellenir
```

Tanıtım sitelerinin metinlerini değiştirdiyseniz: `node site/tools/build-sites.js`

## 11. Güvenlik kontrol listesi

- [ ] Yalnızca 22, 80 ve 443 portları dışarı açık. Node (5050) ve MySQL (3306) dışarıdan erişilemiyor.
- [ ] `NEBSOFT_SECRET` güçlü, `/etc/nebsoft.env` dosyası `chmod 600` ve yedekli.
- [ ] HTTPS zorunlu (HTTP → HTTPS yönlendirmesi). `TRUST_PROXY=1` yalnızca nginx arkasında kullanılıyor.
- [ ] MySQL kullanıcısı yalnızca kendi veritabanına yetkili (sihirbazın ürettiği SQL bunu yapar). Root kullanılmıyor.
- [ ] Süper yönetici şifresi en az 12 karakter. Her personelin kendi hesabı var.
- [ ] Gece yedekleri alınıyor ve geri yükleme bir kez denendi.
- [ ] `sudo journalctl -u nebsoft` günlükleri düzenli kontrol ediliyor.

Sistemde yerleşik olan korumalar:
- scrypt ile şifre özeti; 5 hatalı girişte 15 dakika hesap kilidi.
- HttpOnly + SameSite oturum çerezi; CSRF başlığı ve kaynak kontrolü.
- IP başına istek sınırı; müşteri sayfası girişlerinde kaba kuvvet koruması.
- CSP, HSTS ve X-Frame güvenlik başlıkları. Sunucu kodu, veri klasörü ve gizli dosyalar asla sunulmaz.
- Dış isteklerde iç ağ adresleri (SSRF) engellenir.
- Fiyat, stok, indirim ve müsaitlik her zaman sunucuda hesaplanır.
- Müşteri sayfaları yalnızca beyaz listedeki alanları okuyup yazabilir.

## 12. Bilmeniz gerekenler (sınırlar)

- **Kartla ödeme yoktur.** Satış havale/EFT ile yapılır. İşletmelerin müşteri sayfalarında kart formları bulutta kapalıdır. Ödeme işletmeye elden, kapıda veya havale ile yapılır; online bilet satışları **"ödeme bekliyor"** rezervasyonu olarak oluşur.
- **SMS / e-posta gönderimi**, uygulamalarda Entegrasyon Merkezi'nden bir SMS sağlayıcısı (Netgsm, İleti Merkezi vb.) bağlanana kadar yalnızca kayda geçer, gerçekten gönderilmez.
- e-Fatura/e-Arşiv, MEDULA/İTS, KBS ve pazaryeri entegrasyonları için ilgili entegratör sözleşmesi ve API bilgileri gerekir.
- Yerel donanım (fiş yazıcısı, POS cihazı, terazi) bulut sunucusundan değil, işletmedeki bilgisayarda çalışan yerel köprüden (`node server.js`, veritabanısız mod) kullanılır.

## 13. Testler

```bash
npm test     # bağlayıcı testleri + bulut API uçtan uca testleri
# Bulut testleri için test veritabanı yetkisi olan bir MySQL kullanıcısı gerekir:
TEST_DB_HOST=127.0.0.1 TEST_DB_USER=root TEST_DB_PASS=... npm test
```


## Uygulamaların varsayılan sunucu adresi (sunucu.json)

Masaüstü (exe) ve Android (APK) uygulaması ilk açılışta `sunucu.json` içindeki `adresler` listesini sırayla dener; çalışan ilk adrese bağlanır, hiçbiri açılmazsa adres sorar. Varsayılan adres sonradan açılmazsa (ör. IP değişti) sıradaki denenir; kullanıcının elle yazdığı adres değiştirilmez.

```json
{ "adresler": ["http://45.133.36.99:5050", "https://www.nebsoftapp.com"] }
```

Alan adını aldığınızda en üste yazın ve iki paketi yeniden derleyin: `cd desktop && npm run dist` ve `bash android/build.sh`. Çıkan `indir/NEBSOFT-Kurulum.exe` ile `indir/NEBSOFT.apk` dosyalarını sunucunun `indir/` klasörüne koyun.

## Masaüstü uygulaması ve güvenlik duvarı (Cloudflare / WAF)

**"Sorry, you have been blocked – You are unable to access domain.com" hatası:** uygulama, ayar dosyasındaki örnek adrese (`https://www.domain.com`) bağlanmaya çalışıyordu. Bu adres size ait değil; Cloudflare arkasındaki başka bir sitedir ve isteği engeller. v3'te örnek adres kaldırıldı: ilk açılışta **Sunucu adresi** ekranı çıkar, adres test edilip kaydedilir (menü → NEBSOFT → Sunucu adresini değiştir).

Kendi alan adınız Cloudflare veya başka bir WAF arkasındaysa masaüstü uygulamasının isteklerine izin verin:
1. Uygulama tarayıcı kimliği: `… Chrome/<sürüm> Safari/537.36 NEBSOFT-Desktop/<sürüm>` ("Electron" içermez).
2. Cloudflare → Security → WAF → Custom rules: *User Agent contains "NEBSOFT-Desktop"* → **Skip** (Bot Fight Mode / Super Bot Fight, Managed Challenge, Rate limiting).
3. `/api/*` yolunda "JS Challenge / Managed Challenge" kullanmayın; uygulama ve telefon PWA'sı bu sayfaları çözemez. Gerekirse yalnızca `/admin/*` için challenge açın.
4. Kurulumdan önce varsayılan adresi vermek için: `desktop/config.json → serverUrl` alanına alan adınızı yazıp yeniden derleyin (`npm run dist`).


## Android uygulaması (APK) ve PWA

NEBSOFT zaten kurulabilir bir web uygulamasıdır (PWA): `/manifest.webmanifest`, `/sw.js` ve `assets/icons` altındaki 192/512 px ve maskable simgeler hazırdır. Android'de Chrome “Uygulamayı yükle” ile gerçek bir uygulama (WebAPK) kurar; iPhone'da Safari → Paylaş → Ana Ekrana Ekle kullanılır. İndirme sayfası (`/#/indir`) bunları cihaza göre gösterir.

**Hazır APK (önerilen):** `android/` klasöründeki uygulama masaüstü sürümüyle aynı akışı izler: ilk açılışta sunucu adresini sorar, `/api/auth/me` ile test eder (Cloudflare engeli, DNS ve zaman aşımı ayrı mesajlarla), sonra giriş ekranını açar. Alan adı gerekmez; yerel ağdaki sunucu (ör. `http://192.168.1.20:5050`) de yazılabilir. Kamerayla barkod okutma tarayıcı kuralı gereği yalnızca **https** adreste çalışır.

```bash
bash android/build.sh   # JDK 17 + Android SDK (platforms;android-34, build-tools;34.0.0) gerekir, Gradle gerekmez
```

Çıktı `indir/NEBSOFT.apk` olur. İlk derlemede imza anahtarı `data/android-release.jks` ve şifresi `data/android-keystore.txt` üretilir: **bu iki dosyayı yedekleyin**, farklı anahtarla imzalanan sürüm telefonlarda mevcut uygulamanın üzerine kurulmaz. Sürüm yükseltirken `android/AndroidManifest.xml` içindeki `versionCode` değerini bir artırın.

Alan adınız yayına girdikten sonra adres çubuğu olmayan, siteye bağlı bir paket (Trusted Web Activity) isterseniz şu iki yoldan biri de kullanılabilir:

1. **PWABuilder (kurulum gerektirmez):** https://www.pwabuilder.com adresine canlı site adresinizi girin → *Package for stores* → *Android* → paket adı (ör. `tr.com.nebsoft.app`) ve imza ayarlarıyla indirin. Çıkan zip içinde imzalı **.apk**, Play Store için **.aab**, imza anahtarı ve **assetlinks.json** bulunur. İmza anahtarını güvenli saklayın; güncellemelerde aynı anahtar gerekir.
2. **Bubblewrap (komut satırı):** `npx @bubblewrap/cli init --manifest https://<alan-adiniz>/manifest.webmanifest` ardından `npx @bubblewrap/cli build`. İlk çalıştırmada JDK ve Android SDK'yı kendisi indirmeyi önerir. Çıktı: `app-release-signed.apk`.

Yayınlama:
- APK dosyasını sunucuda `indir/NEBSOFT.apk` adıyla koyun. İndirme sayfasındaki “APK dosyasını indir” düğmesi dosya bulunduğunda kendiliğinden etkinleşir (yoksa “Çok yakında” görünür).
- Üretilen `assetlinks.json` dosyasını `data/assetlinks.json` olarak kaydedin; sunucu onu `/.well-known/assetlinks.json` adresinde yayınlar. Bu doğrulama olmadan uygulama üstte adres çubuğuyla açılır.
