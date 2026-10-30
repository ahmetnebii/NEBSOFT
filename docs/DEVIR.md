# DEVİR — yeni Claude oturumu için tam iş listesi

> Yazıldığı gün: 30.10.2026 · Yazan: önceki ana oturum (Claude) · Okuyacak: yeni bilgisayardaki Claude oturumu.
> **Yeni Claude'a ilk mesaj olarak şunu yaz:** "`docs/DEVIR.md` dosyasını ve `CLAUDE.md`'yi oku, §0'daki kurulumu yap, sonra §4'teki
> sırayla devam et. Kota çabuk doluyor: en fazla 2 paralel alt oturum aç."

`CLAUDE.md` bu projenin kalıcı kurallarıdır (doğrulama ilkeleri, ürün yöntemi, "bitti" tanımı). Bu dosya yalnızca **nerede
kalındığını** ve **ne yapılacağını** anlatır. İkisi çelişirse `CLAUDE.md` geçerlidir.

---

## İlerleme günlüğü (yeni bilgisayar, 30.10.2026)
- Kurulum: `devir/hepsi` çekildi (`Desktop
ebsoft güncel`). Node 24, .NET 8 var → `npm test`: 8 test dosyası geçti (XSD 9 belge);
  `cloud.test.js` MySQL olmadığı için bağlanamadı (B8 hatasına kadar gelemedi). Masaüstü kurulumu derlendi (`indir/NEBSOFT-Kurulum.exe`, imzasız).
- **APK derlenmedi:** JDK 17 ve Android SDK 34 yok; `data/android-release.jks` bu klasörde yok (betik anahtar yoksa YENİSİNİ üretir →
  telefonlar güncellemeyi kurmaz). Eski `data/` klasörü kopyalanmadan APK derlenmemeli. Not: yerel sunucu çalıştırılınca `data/` içinde
  yeni `secret.key`/`setup-token.txt` üretildi; eski `data/` gelince onların üzerine yazılmalı.
- Yerel önizleme: 5050 portu bu bilgisayarda başka bir uygulamada → denemeler `PORT=5062 node server.js` ile yapıldı.
- **YARIM commitler tamamlandı:** Butik 3. dalga (`06faf6b`), Veteriner 2. dalga, Fabrika spec + 1. dalga F1–F6 (bu commit). Ayrıntı ilgili spec'lerde.
- `.claude/launch.json` servis-arac kaydı hâlâ 5061'i başlatıyordu → 5067 yapıldı. `sw.js` V → `nebsoft-v3-22`.
- **Ön Muhasebe 3. dalga tamamlandı** (özelleştirilebilir özet, akıllı uyarılar, proje/şube, 5000 faturada hız) — `docs/urun/ON-MUHASEBE.md`.
- **Çekirdek istekleri — yüksek öncelikliler tamamlandı** (sahte başarı, doğrulanamayan bağlayıcılar, tutar, portal kodları); konaklama vergisi DOĞRULANAMADI. `sw.js` V → `nebsoft-v3-24`.
- **Çekirdek orta/düşük istekleri tamamlandı** (etiket, crud kancaları, mobil kart, Bilet/Otel/Randevu/Otopark/Adisyon bulut kuralları + testleri). Ertelenen: sunucu zamanlayıcısı, dosya deposu, Klinik online randevu.
- **Programlar (devir oturumu):** Market POS 1–3 (`POS.md`), Adisyon 1–3 (`ADISYON.md`), İK 1. dalga (`IK.md`), Eczane 1. dalga (`ECZANE.md`), Site: gecikme tazminatı KMK md. 20'ye göre gün bazında (DOĞRULANDI), Randevu: simülasyon belge no'su TEST.
- Çekirdek `UNVERIFIED` (yalnızca simülasyon): okc, sgk, bankamaas, ebordro, pdks, medula, its, uts, aracbildirim, hgs, ilan, parca, tramer, kbs, kanal, enabiz, erecete, kps, vetbis, petkayit, meb, googleisletme.
- `NS.approve` (yetkili PIN onayı) çekirdekte; POS ve Adisyon kullanıyor.
- **1. dalga (güven) ayrıca yapıldı:** Kuyumcu (`KUYUMCU.md`), Fiyat Robotu (`FIYAT-ROBOTU.md`), Araç Kiralama (`KIRALAMA.md`), Emlak (`EMLAK.md`); simülasyonda banka hareketi / arayan numara / gelen e-Fatura uydurma kaldırıldı (Ön Muhasebe, Site, Adisyon, CRM, çekirdek).
- **Bu bilgisayarda kurulanlar (30.10.2026):** `%LOCALAPPDATA%\Android` altında Microsoft JDK 17 ve Android SDK (build-tools 34.0.0, android-34); `%LOCALAPPDATA%\MariaDB` altında taşınabilir MariaDB 11.4.5 (sistem servisi değil; test için `mariadbd.exe --datadir=...\data --port=3306 --bind-address=127.0.0.1 --console` ile başlatılır, root şifresiz, yalnızca yerel).
- **Yeni APK imza anahtarı üretildi** (kullanıcı kararı, 30.10.2026): `data/android-release.jks` + `android-keystore.txt`. Eski kurulu APK'lar bu sürümle güncellenemez, önce silinmeli. Bu iki dosya depoda yok; yedeklenmeli. SHA-256: 51b76361e3242712a547856b9e2157c1468b03217e76e80966685872f5785fa9.
- **B8 kapandı (kullanıcı kararı 30.10.2026): deneme hemen başlar.** Kayıtta ve `/api/trial`'da 7 gün `deneme` açılır, yönetici onayı yok; eski `talep` kayıtları müşteri karta dokununca başlar. Yönetici paneli "Deneme talepleri" yalnızca eski kayıtlar için kaldı. `cloud.test.js` 41 test geçiyor. Not: aynı kişi yeni e-postayla tekrar deneme alabilir (önceden yönetici onayı bu kapıydı).
- **Bordro parametreleri doğrulandı** (`IK.md`); kıdem tavanı ve prim indirimi düzeltildi.
- **Spor 1–3 (`SPOR.md`), Kurs ve Anaokulu 1. dalga (`KURS.md`, `ANAOKULU.md`), Mali Müşavir 1. dalga (`MUSAVIR.md`) yapıldı.** §4.3: **Nilvera eklendi** (`core/integrations.js`, sahte sunucuyla denendi; gerçek test hesabı gerekir), tablo `MUHASEBE-DOGRULAMA-RAPORU.md` §3.0.
- **Toptan 1–3 tamamlandı** (`TOPTAN.md`): stok, risk, iade, çek, plasiyer yetkisi, fatura, gün sonu, kampanya; `toptan-kural.test.js` 15 test.
- **CRM 1–3 tamamlandı** (`CRM.md`): teklif kuralları, güvenli anahtar, temsilci yetkisi, döviz, katalog, fatura, takip önerileri, yenileme; `crm-kural.test.js` 8 test.
- **Site Yönetimi 1–3 tamamlandı** (`SITE.md`): avans, tahsilat iptali, rastgele sakin kodu, KMK md. 20 paylaşımı, işletme projesi, sayaç, kurul; `site-kural.test.js` 11 test. Mevcut sakinlere yeni kod dağıtılmalı.
- **Kurs 1–3 tamamlandı** (`KURS.md`): md. 56 iade, gerçek SMS sonucu, hakediş, ön kayıt, ödev, etüt.
- **Anaokulu 1–3 tamamlandı** (`ANAOKULU.md`): sahte fotoğraf kaldırıldı, kardeş indirimi, md. 56 ayrılış, sınıf/rota, olay, ilaç, etkinlik izni.
- **Mali Müşavir 1–3 tamamlandı** (`MUSAVIR.md`): uydurma makbuz no kaldırıldı, e-SMM tahsilatta, resmî tatil kayması, süre uzatma, süreli belgeler; `musavir-kural.test.js` 8 test.
- **SEO ve site:** anahtar kelime altyapısı, işletme sayfaları, 20+ ücretsiz araç, yardım merkezi, 62 rehber yazısı (`site/src/rehber/`, program başına 2). Statik `#/` bağlantıları kaldırıldı, sitemap yalnız dizinlenebilir adresleri içerir.
- **Ödeme ve yasal:** Shopier adaptörü birleşti (kişisel erişim anahtarını kullanıcı girecek, kart verisi bizde tutulmaz); KVKK ve sözleşme taslakları yazıldı, `**TASLAK` veya `[...]` içeren metin yayınlanmaz.
- **Yönetim:** ortak olay şeması, analitik, maskelenmiş günlük (`denetimGun` varsayılan 3650), güvenlik denetiminin kritikleri (yol aşımı, nginx arkasında köprü).
- **Satın alma:** destek paketi (`config/destek-paketleri.json`), toplu indirim (`config/toplu-indirim.json`), kurumsal teklif; fiyat ve süreler örnek değerdir, kullanıcı değiştirecek.
- **Program dalgaları:** Kuyumcu, Fiyat Robotu, E-ticaret, Pazaryeri, Kargo, Kiralama, Emlak, Fabrika, Bilet, Veteriner, Galeri, İK ve Eczane 2-3. dalgaları birleşti. `ic-araclar/nebsoftpazarlama/` özel araç olarak eklendi.
- **Çekirdek:** `NS.uid` sayaçlı (duman testindeki yinelenen id çözüldü), `NS.kvkk` telefonla bağlı kayıtları kapsıyor (`phoneCols`, eczanede online reçete), `eczadeposu` doğrulanmamış listede.
- **Tanıtım metinleri koda uyduruldu:** `products.js` ve `catalog.js` temizlendi; canlı seçilebilen pazaryeri yalnız Trendyol ve n11 (sahte sunucuyla denendi). Yemek platformu ve Getir Çarşı vaadi kaldırıldı, adaptör yok. `docs/IDDIA-LISTESI.md` bu değişikliği yansıtmıyor. Ürün eksikleri: Butik `syncOnline` `/api/kanal` kullanmıyor; Pazaryeri programında webhook okuma ve elle sipariş yok; E-ticaret panelinde fotoğraf yükleme yok, `magaza.html` sabit demo metni ve sabit "3 taksit", "14 gün iade" yazıyor; Kiralama'da fotoğraf alanı yok; Otel `rezervasyon.html` "Booking.com'da yaklaşık X" gerçek fiyat değil; randevu hatırlatması yalnız panel açıkken çalışır.
- **Katalog ve şablon:** OFF betiği gerçek dosyayla, canlı OFF akışı gerçek API ile denenmedi; GS1 ve ODbL yükümlülüğü DOĞRULANAMADI; `product_pool` tablosu silinmedi, göç sonrası incelenecek.
- **Güvenlik ikinci tur (`docs/GUVENLIK-RAPORU.md`):** klinik, eczane, veteriner ve İK rolleri sunucuda (`rol-kural.js`), randevu kodla giriş, mysql2 3.24.6, gizli bilgi adres sınırı, müşteri sayfası kotası, alan adı TXT doğrulaması.
- **Şifreleme:** hassas belgeler `belge.js`, PIN `pin.js`. `NEBSOFT_SECRET` kaybolursa bu veri geri gelmez (`DEPLOY.md`).
- **Hâlâ açık:** kalan 27 programın rolleri arayüzde, yetkili onayı sunucuda zorlanmıyor, CSP `unsafe-inline`, TOTP yok, `sunucu.json` HTTP, masaüstü bağımlılıkları; hosting paketi, exe ve apk yeniden derlenmeli; pazar genişleme planı ile video ve sosyal medya içeriği yapılmadı; 6 mevzuat yazısı hukuk/mali müşavir kontrolü bekliyor.

---

## 0. Yeni bilgisayarda kurulum

### 0.1 Projeyi çek
> **GitHub uyarısı:** depodaki `main` dalı, 26.10.2026'da elle atılmış eski bir "first commit"tir (`nebsoft-pazar/` klasörü, 94 dosya)
> ve bu projeyle ortak geçmişi yoktur. Üzerine yazılmadı. `git clone` varsayılan olarak `main`'i açar → mutlaka `devir/hepsi`'ye geç.
> İstersen GitHub → Settings → Branches → varsayılan dalı `devir/hepsi` yap; eski `main`'in silinmesi / değiştirilmesi kullanıcı kararıdır.

```bash
git clone https://github.com/ahmetnebii/NEBSOFT.git NEBSOFTAPP
cd NEBSOFTAPP
git checkout devir/hepsi   # TÜM işin birleşik hâli — buradan devam et
git branch -a              # ayrı dallar da duruyor (§2)
```
Depo adresi yoksa: eski bilgisayardaki `C:\Users\AHMET\Downloads\NEBSOFT-git.bundle` dosyasını kopyala ve
`git clone NEBSOFT-git.bundle NEBSOFTAPP` çalıştır (bundle tüm dalları içerir). Sonra `git remote set-url origin <yeni adres>`.

### 0.2 Git'e GİRMEYEN, elle taşınması gereken dosyalar (önemli)
`data/` klasörü `.gitignore`'da (gizli bilgiler). Eski bilgisayardan **USB ile** kopyala, git'e/buluta koyma:

| Dosya | Neden gerekli |
|---|---|
| `data/android-release.jks` + `data/android-keystore.txt` | **APK imza anahtarı.** Kaybolursa veya yenisi üretilirse telefonlar güncellemeyi kurmaz (önce eski uygulamayı silmek gerekir). |
| `data/secret.key` | Yerel/bulut ayar dosyalarının şifre anahtarı (yoksa yeni üretilir, eski şifreli ayarlar okunamaz). |
| `data/setup-token.txt`, `data/webhook-token.txt` | Yerel sunucu kurulum / webhook anahtarları (yoksa yeniden üretilir). |

### 0.3 Gereken araçlar
| Araç | Sürüm | Ne için |
|---|---|---|
| Node.js | ≥ 18 | sunucu, testler |
| .NET SDK | 8 | GİB UBL-TR XSD testi (`server/test/ubltr-xsd.test.js`). Yoksa test "atlandı" der — geçti sayılmaz |
| Git Bash | — | `android/build.sh` |
| JDK 17 | `%LOCALAPPDATA%\Android\jdk-17*` veya `JAVA_HOME` | APK |
| Android SDK | build-tools **34.0.0** + platforms **android-34** (`%LOCALAPPDATA%\Android\Sdk` veya `ANDROID_SDK`) | APK |

```bash
npm install                 # kök (mysql2)
npm test                    # tamamı geçer; cloud.test.js için yerelde MySQL/MariaDB (root, şifresiz, 3306) açık olmalı
npm start                   # http://localhost:5050  — ürünleri ?demo=1 ile aç, ör. /apps/muhasebe/index.html?demo=1
```
Claude Desktop tarayıcı önizlemesi için `.claude/launch.json` depoda var (`nebsoft`, port 5050).

### 0.4 APK ve masaüstü uygulamasını yeniden derle (çıktılar git'e girmez: `indir/`, `android/build/`, `desktop/dist/`)
**Android APK** (Gradle gerekmez):
```bash
bash android/build.sh
```
- Çıktı: `indir/NEBSOFT.apk`. Sürüm `android/AndroidManifest.xml → android:versionName`; her yayında artır.
- Varsayılan sunucu adresleri `sunucu.json → adresler` listesinden alınır.
- `data/android-release.jks` yoksa betik YENİ anahtar üretir → §0.2'deki dosyaları önce kopyala.

**Windows masaüstü (Electron)**:
```bash
cd desktop
npm install
npm run dist          # çıktı: ../indir/NEBSOFT-Kurulum.exe + latest.yml (+ win-unpacked/)
```
- Geliştirme: `npm start` (yerel sunucuya: `NEBSOFT_URL=http://localhost:5050 npm start`).
- Yayından önce `desktop/config.json → serverUrl` ve `desktop/package.json → build.publish[0].url` gerçek alan adı olmalı.
- Paket `server.js`, `core/`, `apps/`... klasörlerini `extraResources` ile içine alır → **web dosyası değiştiyse exe'yi yeniden derle.**
- İmzasız exe SmartScreen uyarısı verir; kod imzalama sertifikası: `CSC_LINK`, `CSC_KEY_PASSWORD`.
- Sunucu `indir/` klasörünü `/indir/` adresinden yayınlar; sitedeki "Masaüstü & Mobil" düğmeleri dosya varsa açılır.

**Her dalga / sürüm sonunda:** `sw.js` içindeki `V` artırılır (şu an `nebsoft-v3-21`), sonra APK ve exe yeniden derlenir.

---

## 1. Kullanıcının istekleri (özet — hepsi geçerli)
1. **Doğrulama ilkeleri** (`CLAUDE.md` §1): yalnızca resmî kaynak, her iddiaya URL + tarih/sürüm, etiket DOĞRULANDI / UYUMSUZ /
   DOĞRULANAMADI, doğrulanamayan canlıda seçilemez, sahte başarı yok.
2. **31 programın hepsi** "piyasadaki en profesyonel" seviyeye: eksiksiz, sorunsuz, bol özellik, kolay kullanım. Her program için
   sektör araştırması (rakipler + Şikâyetvar + mağaza yorumları) → `docs/urun/<PROGRAM>.md` → 3 dalga → kalite kapısı.
   Rakipten fikir alınır, **kopyalanmaz**. "Atlama yok": her programda eksikler giderilir ve ek özellik eklenir.
   Kullanıcı bu yöntemi ve dalgaları **önceden onayladı** (her dalga için tekrar sormaya gerek yok; sağlayıcı hesabı veya iş kararı
   gerekirse durup sor).
3. **Modül gizleme / sade arayüz**, e-Fatura görünümü ve tasarımı (Ön Muhasebe'de yapıldı, çekirdekte → tüm programlar kullanabilir).
4. **Butikte ürün etiketi modülü** — yapıldı (dal `claude/urun-perakende-f86f58`, commit `c6d95aa`).
5. **YENİ (30.10.2026): "Yapabildiğimiz kadar entegratör ekleyelim — gerçek kullanım kaynağı bulabildiklerimizi."** → §4.3.
6. APK ve masaüstü yeniden derlenebilir olmalı → §0.4.

---

## 2. Dallar ve durumları
**`devir/hepsi` = `muhasebe/urun-spec` + aşağıdaki 6 alt oturum dalının birleşimi (30.10.2026).** Yeni işler bu dalda veya bundan
açılan dallarda yapılır. Birleştirmede tek çakışma `.claude/launch.json` idi (tüm port kayıtları tutuldu); birleşik dalda `npm test`
öncekiyle aynı sonucu verdi (yalnızca B8). `main`'e henüz birleştirilmedi. Tüm dallar `main` + Ön Muhasebe 1. dalgası (`22b1dae`) üzerinden açıldı; birleştirme sırasında
çakışma çıkarsa genelde `docs/urun/ON-MUHASEBE.md` ve `.claude/launch.json` olur.

| Dal | Programlar (grup) | Biten | Yarım / kalan |
|---|---|---|---|
| `muhasebe/urun-spec` (ana oturum) | Ön Muhasebe + çekirdek (`core/`) | 1. ve 2. dalga (`0530bdc`); 3. dalgadan **cari portalı** (bu commit) | 3. dalganın kalanı — §4.1 |
| `claude/urun-servis-arac-a1f676` | Oto Servis, Teknik Servis, Otopark (`apps/oto`), Oto Galeri, Araç Kiralama, Emlak | Oto Servis 1–3, Teknik Servis 1–3, Otopark 1–3, Oto Galeri **1. dalga** | Oto Galeri 2–3; **Araç Kiralama**, **Emlak** hiç başlanmadı |
| `claude/urun-perakende-f86f58` | Butik, Market POS, Adisyon, Kuyumcu, Toptan, Fiyat Robotu | Butik etiketi, Butik 1–2 | ~~Butik 3. dalga YARIM~~ **yapıldı 30.10.2026** (`06faf6b`); POS, Adisyon, Kuyumcu, Toptan, Fiyat Robotu başlanmadı |
| `claude/urun-eticaret-uretim-38c2a2` | E-ticaret, Pazaryeri, Kargo, Fabrika ERP | E-ticaret spec + 1. dalga, Pazaryeri spec + 1. dalga, Kargo spec + 1. dalga | E-ticaret/Pazaryeri/Kargo 2–3. dalga; ~~Fabrika spec YARIM~~ spec + 1. dalga **yapıldı 30.10.2026**; Fabrika 2–3 |
| `claude/urun-randevu-uyelik-cfb186` | Randevu, Klinik, Veteriner, Spor, Kurs, Anaokulu | Randevu 1–3, Klinik 1–3, Veteriner 1. dalga | ~~Veteriner 2. dalga YARIM~~ **yapıldı 30.10.2026**; Veteriner 3; Spor, Kurs, Anaokulu başlanmadı |
| `claude/urun-konaklama-etkinlik-8b3b84` | Otel, Bilet / Etkinlik, Site Yönetimi, CRM | Otel 1–3, Bilet 1. dalga | Bilet 2–3; Site Yönetimi, CRM başlanmadı |
| `claude/urun-profesyonel-5c5840` | Hukuk, Mali Müşavir, İK, Eczane | Hukuk 1–3 | Mali Müşavir, İK, Eczane başlanmadı |

**Hiç dağıtılmamış program:** Pazar yeri sitesi (`index.html`, `market/`) ve yönetim paneli (`admin/`) ayrı bir ürün olarak ele
alınmadı. 31 programın tamamı yukarıdaki gruplarda + Ön Muhasebe.

"YARIM:" commitleri, oturumlar kullanım kotası yüzünden ortada kaldığı için alındı: kod sözdizimi kontrolünden geçti ama
**tarayıcıda denenmedi**. Devam eden oturum önce o programı açıp son değişikliği bitirmeli veya düzeltmeli.

Her dalın `docs/urun/` klasöründe o programların spesifikasyonu (yapılanlar tablosu dahil) ve
`docs/urun/CEKIRDEK-ISTEKLERI-<grup>.md` (o oturumun `core/`'dan istedikleri) var. **Programın kaldığı yer spec dosyasının başındaki
"Durum" satırı ve yapılanlar tablosundadır.**

---

## 3. Ana oturumun (Ön Muhasebe + çekirdek) bu ana kadar yaptıkları
Ayrıntı: `docs/urun/ON-MUHASEBE.md` (yapılanlar tabloları) ve `docs/MUHASEBE-DOGRULAMA-RAPORU.md` (entegrasyon doğrulaması, B1–B8).
- **Entegrasyon doğrulaması:** Uyumsoft (WSDL), Paraşüt (API v4 swagger), Netgsm (REST v2), İleti Merkezi, Verimor, Twilio,
  EmailJS, WhatsApp Cloud API, TCMB kur arşivi → DOĞRULANDI. Mutlucell → kaynak yok, kapatıldı. Paraşüt tevkifat oranı birimi
  belirsiz → tevkifatlı fatura Paraşüt'e gönderilmiyor.
- **e-Fatura / e-Arşiv:** `core/ubltr.js` GİB UBL-TR 1.2.1 XSD'ye karşı .NET ile doğrulanıyor (9 belge); istisna (83 kod) ve tevkifat
  (52 kod, `core/ebelge/kodlar.js`, GİB Kod Listeleri V1.43); resmî görünüm GİB `general.xslt` + xslt-polyfill (Chrome 158 yerleşik
  XSLT'yi kaldırıyor); logo/tasarım sekmesi; arşiv ZIP; Uyumsoft gönder/sorgula/iptal.
- **Çekirdek:** modül gizleme (`navVisible`), pasif kullanıcı oturumu kapatma, ekran içi yardım (`opts.help`), `NS.zip`,
  `NS.readSheet` (xlsx/csv), ilçe/il alanları, CSP `wasm-unsafe-eval`.
- **Ön Muhasebe 1–2. dalga:** kuruş farkı (`calc.js`), iade faturası, istisna/tevkifat, telefon ekranı, roller, işlem geçmişi,
  dövizli raporlar TL, Excel aktarımı (cari/ürün), banka ekstresi yükleme + eşleştirme, carisiz ödeme dağıtımı, tekrarlayan fatura,
  tahsilat hatırlatma, analiz (nakit akışı 13 hafta, ödeme takvimi, satış, tahsilat, kasa, stok, karşılaştırma), beyan takvimi
  (VUK 18 kayması, e-Defter berat günü GİB takvimine göre), kurulum sihirbazı, fiyat listeleri, risk limiti, çoklu birim.
- **3. dalga – cari portalı (bu commit, 30.10.2026):**
  - `apps/muhasebe/cari.html`: müşteri VKN/TCKN + rastgele giriş koduyla girer; özet (borç, vadesi geçen, IBAN), ekstre (yazdırılır),
    faturalar (kalem ayrıntısı, yazdır), ödemeler, mutabakat onay/itiraz.
  - `server/cloud/public-rules.js → RULES.muhasebe`: yalnızca kendi kayıtları; kod, iç not, risk limiti, hesap bilgisi gönderilmez;
    tek yazma izni bekleyen mutabakata onay/itiraz. `server/cloud/seo.js`'e sayfa eklendi.
  - Program: cari kartında "Cari portalı" (bağlantı + kod, kopyala, SMS) ve "Mutabakat iste" düğmeleri, mutabakat geçmişi kartı.
  - Ekstre hesabı tek yerde: `MUHCALC.statement` (program ve portal aynı bakiyeyi gösterir).
  - Test: `server/test/muhasebe-portal.test.js` (9 test, `npm test`'e eklendi).
  - **Kalan doğrulama:** tarayıcıda uçtan uca denenmedi (yalnızca cari sayfası açıldı). Yapılacak: Ön Muhasebe → Cariler → bir cari →
    "Mutabakat iste" → `cari.html` → "örnek cari bilgisini doldurun" → giriş → onay/itiraz → programda mutabakat kartında görünmeli.
    Telefon genişliği + koyu tema. Bulutta (`NS.pub`) gerçek giriş henüz denenmedi.

---

## 4. YAPILACAKLAR (öncelik sırasıyla)

### 4.1 Ön Muhasebe 3. dalga — kalanlar (dal `muhasebe/urun-spec`)
1. Cari portalını tarayıcıda uçtan uca dene (§3 "Kalan doğrulama"); hata varsa düzelt.
2. **Özelleştirilebilir ana sayfa:** kullanıcı özet ekranındaki kartları seçer/sıralar (ayar kullanıcı başına saklanır).
3. **Proje / etiket kârlılığı:** fatura ve giderlere proje (veya etiket) atanır; proje bazında gelir − gider − kâr raporu.
   Not: portal kuralı faturadan `project` ve `branch` alanlarını zaten çıkarıyor.
4. **Akıllı uyarılar:** mükerrer fatura (aynı cari + tutar + tarih yakın), risk limiti aşımı, kritik nakit (nakit akışı tahmini
   eksiye düşüyor), vadesi bugün dolanlar. Özet ekranında ve bildirim olarak.
5. **Çoklu şube:** şube tanımı; fatura/kasa/depo şubeye bağlanır; rapor ve ekranlarda şube filtresi; kullanıcı şube yetkisi.
6. Kalite kapısı (`CLAUDE.md` §3): `npm test`, tarayıcı (`?demo=1`), telefon, koyu tema, boş liste, 5000 kayıtla hız, başka
   2–3 program açılıyor mu, `sw.js` V artır, `docs/urun/ON-MUHASEBE.md` başlığını "3. dalga tamamlandı" + tablo ile güncelle, commit.

### 4.2 Çekirdek istekleri (yalnızca ana oturum `core/`'a dokunur)
`docs/urun/CEKIRDEK-ISTEKLERI-*.md` (6 dosya, `devir/hepsi`'de hepsi var). Ayrıntı ve gerekçe o dosyalarda; özet (birleştirilmiş):

| Öncelik | İstek | İsteyen (dosya · no) |
|---|---|---|
| ~~**Yüksek — sahte başarı**~~ **yapıldı 30.10.2026** | `NS.smsLog` sonucu Promise döndürsün, simülasyon "TEST" görünsün | servis-arac Ç1 |
| ~~**Yüksek — sahte başarı**~~ **yapıldı 30.10.2026** | `NS.integ.call` simülasyonda `toast(..,'ok')` yerine "TEST — gönderilmedi" | eticaret Ç2, konaklama Ç2, randevu Ç2 |
| ~~**Yüksek — sahte başarı**~~ **yapıldı 30.10.2026** (zaten `create()`'e yönlenmişti; iç yol TEST no döndürür) | Eski `sendEInvoice` yolu kaldırılsın / simülasyonda başarı yazmasın | eticaret Ç3 |
| ~~**Yüksek — doğrulanamayan**~~ **yapıldı 30.10.2026** (`UNVERIFIED`, rapor B10) | Yedek parça (Martaş/Başbuğ/Dinamik), TRAMER, KBS, kanal yöneticisi (HotelRunner, SiteMinder, Booking…), resmî kurum bağlayıcıları (e-Nabız, e-Reçete, KPS, VetBİS, MEB) ve Google İşletme: resmî doküman yoksa "doğrulanmadı — seçilemez" | servis-arac Ç2, konaklama Ç4–Ç5, randevu Ç2 |
| ~~Yüksek — tutar~~ **yapıldı (reddeder)** | `NS.ebelge.create()` belge geneli indirimi (`doc.disc`) desteklesin ya da reddetsin | servis-arac Ç3 |
| Yüksek — tutar — **DOĞRULANAMADI** (rapor B9; GİB Kod Listeleri V1.43'te vergi kodu yok) | e-Belge'de konaklama vergisi (yalnızca KDV 0015 yazılıyor) — GİB kod listesinden doğrulanarak | konaklama Ç3 |
| ~~Yüksek — tutar~~ **yapıldı 30.10.2026** | e-SMM'de stopaj yalnızca alıcı vergi kesintisi yapmakla yükümlüyse | profesyonel Ç1 |
| ~~Yüksek — güvenlik~~ **yapıldı 30.10.2026** (`portal-kod.test.js`) | Portal kodları formülle türetilmesin (VKN/TCKN/telefon + id): yalnızca rastgele `portalCode` (hukuk `hkkCode`, veteriner/spor/kurs telefonla giriş, anaokulu) — Ön Muhasebe portalı zaten böyle | profesyonel Ç2, randevu Ç7 |
| Orta — bulut kuralları — **kısmen yapıldı 30.10.2026:** `RULES.bilet` kod sınırları/satış penceresi/ücret (`bilet-kural.test.js`), Otopark plaka + takip kodu (`portal-kod.test.js`); otel (hafta sonu, en az gece, blok, segs, no-show, kapora, ön check-in — `otel-kural.test.js`), randevu (online taşıma — `randevu-kural.test.js`; `noReminder` zaten vardı). **Kalan:** Klinik online randevu sayfası + kuralı (Klinik programının sonraki dalgasına alındı) | `RULES.otel` (hafta sonu fiyatı vb.), `RULES.bilet` (kod sınırları), randevuda yeni alanlar (`noReminder`, `waitlist`), Klinik online randevu kuralı, Otopark plaka sorgusu kuralı | konaklama Ç7–Ç8, randevu Ç4–Ç5, servis-arac Ç6 |
| Orta — sunucu — **yapılmadı (bilerek):** bulutta işletme adına SMS göndermek, sağlayıcı gizli anahtarlarının sunucuda okunmasını ve zamanlayıcının çok kiracılı veride çalışmasını gerektiriyor; tasarım + sağlayıcı test hesabıyla ayrı iş | Zamanlanmış hatırlatma (panel kapalıyken randevudan X saat önce SMS) | randevu Ç3 |
| ~~Orta — etiket~~ **yapıldı 30.10.2026** (Ç1–Ç5, Ç7; Ç6 ZPL/TSPL DOĞRULANAMADI) | `core/labels.js`: eski fiyat uydurmasın (`fiyat × 1,2`), program alanı kaydı, önizleme bağlamı, logo öğesi, indirim yüzdesi; `printLabels` şablon desteği; `USED.butik`'e printer/label/barcode/pos | perakende Ç1–Ç7 |
| ~~Orta — çekirdek UI~~ **yapıldı 30.10.2026** (hukuk/klinik/veteriner geçici çözümleri kaldırıldı) | `NS.crud`: `beforeDelete`/`canDelete` kancası, `beforeSave` false dönerse kaydetmesin; `fieldsHtml` datalist önerisi; `table()` dar ekranda kart görünümü | profesyonel Ç5–Ç6, randevu Ç6/Ç8, eticaret Ç6 |
| Orta — dosya — **yapılmadı:** bulut dosya deposu (depolama + yetki + yedek) ayrı altyapı işi; şimdilik kargo fotoğrafı 480 px JPEG | Fotoğraf vb. ikili veri kayıt dışında (dosya deposu) | eticaret Ç7 |
| ~~Düşük~~ **yapıldı** | `navigator.vibrate` kullanıcı dokunmadan çağrılınca konsol hatası | profesyonel Ç8 |
| ~~Düşük~~ **yapıldı** (3 test) | `kanal.test.js`: Trendyol yeni yollar (`/v2/products` vb.) | eticaret Ç4 |
| **Yapıldı (30.10.2026)** | `sw.js` V → `nebsoft-v3-21` (tüm "V artır" istekleri); `apps/hukuk/sure.test.js` `npm test`'e eklendi (18/18); servis-arac önizleme portu 5061 Chrome'da güvensiz port → 5067 | hepsi Ç1/Ç4/Ç8, profesyonel Ç3, servis-arac Ç5 |
| Kullanıcı kararı | `cloud.test.js` 'talep' ≠ 'deneme' (§5 B8) | eticaret Ç5, konaklama Ç6, profesyonel Ç7 |

Uyguladıkça ilgili dosyada "yapıldı (commit)" diye işaretle ve isteyen programda geçici çözümü kaldır.

### 4.3 YENİ: Daha fazla e-Fatura entegratörü (kullanıcı isteği, 30.10.2026)
Amaç: resmî, herkese açık API dokümanı veya SDK'sı **bulunabilen** her GİB özel entegratörünü eklemek. Kural `CLAUDE.md` §1:
- Her aday için resmî doküman URL'si + sürüm/tarih yaz; bulunamazsa DOĞRULANAMADI → canlıda seçilemez, rapora yaz.
- Uygulama yeri: `core/integrations.js` e-Belge sağlayıcıları (`send`, `isPayer`, `query`, `cancel`, Uyumsoft/Paraşüt kalıbıyla
  `I.sendDirect`); UBL-TR yalnızca `core/ubltr.js` ile üretilir.
- Dokümana uyum ≠ canlı test: her yeni sağlayıcı için kullanıcıdan test hesabı iste.
- Başlangıç listesi — GİB'in özel entegratör listesinden doğrula (adaylar **hafızadan, doğrulanmadı**): Logo (eLogo), Sovos (Foriba),
  QNB eFinans, İzibiz, Nilvera, EDM, Mysoft, Digital Planet, Kolaysoft, Turkcell e-Şirket, Türk Telekom, Uyumsoft (var),
  Paraşüt (var; entegratörün üstündeki bir hizmet). Resmî liste: GİB e-Belge portalı → "Özel Entegratörler" (adres
  doğrulanmalı: `ebelge.gib.gov.tr`).
- Rapor: `docs/MUHASEBE-DOGRULAMA-RAPORU.md`'ye tablo (sağlayıcı · kaynak URL · sürüm · etiket · desteklenen işlemler).
- Aynı yaklaşım SMS (Netgsm, İleti Merkezi, Verimor var), banka (açık bankacılık), kargo ve pazaryeri sağlayıcıları için de
  uygulanabilir; bunlar ilgili program dallarında (E-ticaret/Pazaryeri/Kargo) zaten kısmen doğrulandı — o spec'lere bak.

### 4.4 Program dalgaları (alt oturumlar)
§2 tablosundaki "Yarım / kalan" sütunu. Her oturuma verilecek talimat kalıbı (önceki oturumlarda kullanılan):
> Grubun: <programlar ve klasörleri>. Her program için sırayla: (1) `CLAUDE.md` §2 adım 1–3: pazar araştırması (önde gelen 3–5 Türk
> ürünü, Şikâyetvar, mağaza yorumları; kaynak URL + tarih), programın her ekranını tarayıcıda gez (telefon dahil), hataları kodla
> doğrula, sektörün günlük iş akışını düşünüp kullanım kolaylıkları tasarla. (2) `docs/urun/<PROGRAM>.md`'yi `ON-MUHASEBE.md`
> biçiminde yaz: hatalar, Olmazsa olmaz / Beklenen / Fark yaratan karşılaştırma tablosu, güven kuralları, 3 dalga, karar gerektirenler.
> (3) Kullanıcı önceden onay verdi: özeti sun, dalgaları sırayla uygula; her dalga §3 kalite kapısından geçer ve ayrı commit olur.
> Kısıtlar: yalnızca `apps/<program>/` ve `docs/urun/` içinde değişiklik; `core/` gerekirse `docs/urun/CEKIRDEK-ISTEKLERI-<grup>.md`'ye
> yaz. Entegrasyonlar `CLAUDE.md` §1'e göre. Yerel sunucu için ayrı port kullan (`.claude/launch.json`'a `<grup>` adlı kayıt).
> Kaldığın yer: <spec dosyasının Durum satırı>.

**Kota uyarısı:** 7 paralel oturum 5 saatlik kotayı 5–10 dakikada bitirdi. Öneri: aynı anda en fazla 1–2 oturum; önce yarım kalanlar
(Butik 3, Veteriner 2, Fabrika spec), sonra her gruptan sıradaki program. Dalga sonunda commit almadan oturumu bırakma.

**Önerilen sıra:** (1) ~~YARIM commitleri tamamla~~ (yapıldı 30.10.2026) → (2) Ön Muhasebe 3. dalga (§4.1) → (3) çekirdek istekleri (§4.2) → (4) başlanmamış
programlar (POS, Adisyon, Spor, Mali Müşavir, Eczane, Kuyumcu, Toptan, Fiyat Robotu, Kurs, Anaokulu, Site, CRM, İK, Kiralama, Emlak)
→ (5) kalan 2–3. dalgalar → (6) entegratörler (§4.3, Ön Muhasebe ile paralel gidebilir).

### 4.5 Birleştirme ve yayın (kullanıcı onayıyla)
1. Kullanıcı söylerse dalları `main`'e birleştir (tek tek, her birinden sonra `npm test` + birkaç program tarayıcıda).
2. `sw.js` V artır, APK + exe derle (§0.4), sunucuya yükle.

---

## 5. CANLIYA ÇIKMAYI ENGELLEYENLER ve kullanıcıdan gerekenler
Ayrıntı ve kaynaklar: `docs/MUHASEBE-DOGRULAMA-RAPORU.md`.
| # | Konu | Gereken |
|---|---|---|
| B1 | e-Fatura gerçek gönderimi hiç test edilmedi | Uyumsoft ve/veya Paraşüt **test ortamı hesabı** (kullanıcıdan) |
| B2 | GİB Schematron kuralları otomatik denetlenmiyor (yalnızca XSD) | Schematron derleyicisi / karar |
| B3 | Dövizli faturada kur politikası (VUK 280 hangi kuru belirtmiyor) | Mali müşavir görüşü |
| B4 | e-İrsaliye, e-Defter, banka (açık bankacılık), resmî muhasebeye aktarım: adaptör yok, canlıda kapalı | Sağlayıcı seçimi + doküman |
| B5 | Mutlucell SMS: resmî doküman bulunamadı, kapalı | — |
| B6 | Logo / Sovos / Mysoft / EDM entegratörleri: kapalı | §4.3 ile doküman ara |
| B7 | Gelen e-Faturaları entegratörden çekme yok | B1 hesabı ile |
| ~~B8~~ | **Kapandı 30.10.2026:** `cloud.test.js` talep + yönetici onayı akışına uyarlandı, 44 test geçiyor | — |
| B11 | **ÖKC (yazarkasa) — DOĞRULANAMADI.** Kaynak: GİB [GMP-3 s.5.0](https://ynokc.gib.gov.tr/UploadedFiles/Files/GMP3_v5_0_02082018.pdf) (okundu 30.10.2026). Bağlantı Ethernet, RS232 veya USB ile kablolu olur; Wi-Fi ve Bluetooth yasak (§2.6, §3.1, §5.3). Yazılım ÖKC üreticisinin derlenmiş GMP-3 kütüphanesini kullanmak zorunda; eşleştirmeyi üreticinin yetkili servisi yönetir (§3.3). Tarayıcıdan çalışan yazılım için bilgisayarda ayrı ara yazılım gerekir (§3.3). Üreticiyle güvenlik taahhütnamesi şart (§5.5). ÖKC TSM Merkezi üzerinden kablosuz yol da tanımlı (§2.3, §6, Ek-1), ayrıntısı üreticiye bağlı | Marka/model seçimi, üreticiyle anlaşma + kütüphane, test cihazı |
Alt oturumların kendi engelleyenleri her spec dosyasının "karar / hesap gerektirenler" bölümündedir.

---

## 6. Faydalı bilgiler
- Diğer belgeler: `docs/MUHASEBE-DOGRULAMA-RAPORU.md` (entegrasyon doğrulaması, test stratejisi, §6.2 canlı öncesi manuel test
  listesi), `docs/urun/*.md` (21 program spec'i), `docs/GELISTIRME-PLANI.md`, `README.md`, `desktop/README.md`.
- Önizleme portları (`.claude/launch.json`): nebsoft 5050, servis-arac 5067, perakende 5062, eticaret-uretim 5063,
  randevu-uyelik 5064, konaklama-etkinlik 5065, profesyonel 5066.
- Eski bilgisayardaki alt oturum çalışma ağaçları (`.claude/worktrees/`) taşınmaz; tüm işleri dallarda ve `devir/hepsi`'de.
- Yerel sunucu statik dosyaları bellekte önbelleğe alır: dosya değişince sunucuyu yeniden başlat. Tarayıcıda eski dosya görünürse
  servis çalışanı kaydını sil (DevTools → Application) veya `sw.js` V'yi artır.
- Ön Muhasebe betik sırası `apps/muhasebe/index.html`'de; yeni modül `window.MUH<AD>` kalıbıyla, `init(ctx)` ile bağlanır.
- Bulut müşteri sayfaları: `server/cloud/public-rules.js` (beyaz liste kuralları) + sayfada `NS.pub` / `db.lookup`.
- Python ile dosya yamarken heredoc kaçışlarına dikkat (`\.`, `\D` gibi regex'ler bozulabiliyor); sonra `node -e "new Function(...)"`
  ile sözdizimini kontrol et.
- Commit mesajları Türkçe, sonuna: `Co-Authored-By: Claude <noreply@anthropic.com>` (oturumun verdiği satır).
