# NEBSOFT v3 — Kapsamlı Geliştirme Planı

> Dal: `feat/nebsoft-v3-yenileme` (kaynak: `claude/confident-rubin-epr7pl`)
> Kapsam: pazar yeri sitesi, giriş/kayıt, müşteri paneli, yönetim paneli, 31 uygulama, 31 ürün tanıtım sitesi, masaüstü sürümü, mobil, bildirimler.
> Hazırlayan: kod analizi (≈2,5 MB JS, 31 uygulama) + 2026 tasarım araştırması.

---

## Durum (2026-10-27)

| Faz | Durum | Not |
|---|---|---|
| 1 — Telefon tek kaynak, Giriş yap, tek giriş kapısı, deneme dili, şifremi unuttum | ✅ | Şifre sıfırlama e-posta altyapısı olmadığı için yönetici üzerinden (talep → geçici şifre) |
| 2 — Nova tasarım sistemi, açılış ekranı, giriş/kayıt ekranları, mobil alt çubuk, yeni ana sayfa | ✅ | Ana sayfa: aurora hero + sektör arama, özellik kartları, cihazlar bölümü; uydurma istatistik ve yorumlar ana sayfadan kaldırıldı |
| 3 — Müşteri paneli, tek yönetim paneli | ✅ | Tek adres `admin/`: bulut kuruluysa gerçek panel, değilse demo Yönetim Merkezi; pazar yeri satış yönetimi merkezin içinde; bulut panelinde Ürünler & Fiyatlar ve Duyurular & Bakım |
| 4 — Entegrasyon merkezi v2 | ✅ | Program başına yalnızca kullanılan bağlantılar + "Bu programda" ve "Nasıl bağlanır" kutusu |
| 5 — Belge şablon tasarımcısı + dijital imza | ✅ | `core/docs.js`; şimdilik Oto Servis belge türlerini tanımlıyor |
| 6 — Oto Servis v2 | ✅ | Tek ekranda servis açma, hasar krokisi, foto, kabul/teslim imzası, kalem kalem iş emri, paketler, katalog |
| 7 — Bildirim ve ses merkezi | ✅ | `core/notify.js`; 22 programda olay kataloğu |
| 8 — Masaüstü (Electron) | ✅ | `desktop/`; `npm run dist` ile `indir/NEBSOFT-Kurulum.exe` üretildi (imzasız — SmartScreen uyarısı için kod imzalama sertifikası gerekli) |
| 9 — PWA + mobil giriş | ✅ | Manifest, service worker, ana ekrana ekle, "Telefonumda aç" tek kullanımlık giriş linki + taranabilir QR. Passkey (parmak izi/yüz) sonraki adım |
| 10 — Diğer programların derinleştirilmesi | ✅ | Şablon + imza 29 programda: Oto Servis, Teknik Servis, Kiralama, Klinik, Emlak akış içinde; diğer 24 programda "İmzalı belgeler" sayfası (45 sektörel belge türü). Pazaryeri paneli ve Fiyat Robotu çevrimiçi olduğundan kâğıt belge gerektirmez |
| 11 — Tanıtım siteleri | ✅ kısmen | İletişim bilgisi, görünen fiyatlar ve JSON-LD fiyatları panelden dinamik; görsel şablon yenilemesi yapılmadı |
| Fiyatlandırma | ✅ | 2026 piyasa araştırmasına göre yeni liste fiyatları (aşağıda) |

### Fiyatlandırma (aylık, KDV hariç; yıllıkta 10 ay ödenir)
Referanslar: Adisyo 1.040–2.150 ₺, Simpra ~1.350–1.550 ₺; Logo İşbaşı 463 ₺, Paraşüt 940 ₺ (yıllık) / 1.450 ₺ (aylık); kuaför randevu 500–2.500 ₺;
oto servis 239–1.599 ₺; ikas Lift 4.660 ₺, Ticimax ~3.833 ₺, IdeaSoft ~3.325 ₺; küçük otel PMS €30–88.
İlke: Başlangıç paketi piyasanın giriş seviyesinin biraz altında (geçiş kolaylığı), Profesyonel piyasa ortalamasında, Kurumsal çok şube/API değerini yansıtır.
Fiyatlar artık **Yönetim paneli → Ürünler & Fiyatlar**'dan değiştirilebilir (sepet, ödeme hesabı ve tanıtım siteleri aynı değeri kullanır).

### E-posta (yönetim panelinden)
- **Ayar:** Yönetim → E-posta ayarları → sağlayıcı (Gmail, Outlook, Yandex, Yaani, diğer SMTP), ana adres, **uygulama şifresi** (AES-256-GCM ile şifreli saklanır), test gönderimi, gönderim geçmişi.
- **Doğrulama:** kayıt olurken e-postaya 6 haneli kod (açık/kapalı), isteğe bağlı her girişte kod (iki adımlı), şifre sıfırlama kodla. Kod 10 dk geçerli, 5 hatalı denemede iptal, veritabanında yalnızca özeti tutulur.
- **Bildirimler:** hoş geldin, deneme başladı, sipariş alındı (havale bilgisiyle), ödeme onaylandı / lisans aktif, lisans veya deneme bitiyor (7, 3, 1 gün kala), şifre değişti.
- **Toplu e-posta:** Yönetim → E-posta gönder; kitle (tüm müşteriler, denemede olanlar, aktif, süresi bitenler, elle adres), canlı önizleme. Ticari tanıtım e-postaları için alıcı onayı (İYS) gerekir.
- E-posta ayarlanmamışsa sistem eskisi gibi kodsuz çalışır.

## 0. Özet — 10 madde

1. **Telefon hatasının kök nedeni bulundu:** iletişim bilgisi **5 ayrı yerde** tutuluyor; yönetim panelinden kaydedilen numarayı pazar yeri **hiç okumuyor** (§2.1).
2. **3 ayrı yönetim paneli** var (`#/yonetim`, `admin/demo.html`, `admin/index.html`); veri ve ayarlar birbirine akmıyor. Tek panelde birleşecek.
3. **Site ile müşteri alanı iç içe:** tanıtım (vitrin) ile mevcut müşteri işlemleri (lisans, uygulama açma) aynı menüde. İkiye ayrılacak: **Vitrin** ve **Uygulama Merkezi** (`/app`).
4. **Tek giriş kapısı:** giriş → 0 lisans: ürün seç/deneme başlat · 1 lisans: doğrudan uygulama · 2+ lisans: program seçici. Web, masaüstü ve mobilde aynı akış.
5. **Kayıt metni düzeltmesi:** hesap süresiz, sadece **deneme lisansı 7 gün**. Bu, 6 farklı yerde yanlış yazıyor (§2.3).
6. **Entegrasyonlar:** uygulamaların listeledikleri entegrasyonların yarısı uygulama içinde **hiç çağrılmıyor** (§2.5). Kullanılmayanlar gizlenecek, her kartta "Bu programda nerede, nasıl kullanılır" kutusu olacak.
7. **Yeni tasarım sistemi "Nova":** shadcn/ui + Linear + Vercel çizgisinde token tabanlı; 3 ayrı mavi/mor yerine tek marka rengi; açılış (splash) animasyonu, gösterişli giriş ekranı, komut paleti, akıcı geçişler. Framework'e geçilmeden vanilla JS'ye uygulanacak.
8. **Belge şablon tasarımcısı + dijital imza:** ortak modül; tüm programlar kendi fiş, iş emri ve teslim formunu tasarlayıp müşteriye ekranda imzalatabilecek. İlk uygulandığı yer Oto Servis.
9. **Masaüstü sürümü (Electron) + mobil (PWA):** "Masaüstü sürümünü indir" butonu, masaüstünde giriş ve lisansa göre program listesi; mobilde ana ekrana eklenebilen uygulama, QR ile giriş, biyometrik giriş.
10. **Bildirim ve ses merkezi:** her programın olay kataloğu (garson çağrısı, yeni sipariş, online randevu…), olay başına ayrı ses, susturma saatleri ve tekrar; Ayarlar'dan yönetilecek.

---

## 1. Mevcut mimari (kısa)

| Katman | Dosya | Not |
|---|---|---|
| Pazar yeri SPA | `index.html`, `market/market.js` (100 KB), `market/market.css` | Hash yönlendirme; `CL` doluysa bulut, değilse localStorage demo |
| Çekirdek | `core/core.js` (141 KB), `core/core.css` | DB katmanı, kabuk (`shell`), PIN girişi, tablo/form/grafik, bulut eşitleme (`merge3`) |
| Entegrasyon | `core/integrations.js` (98 KB) | `DEFS` (genel) + `CONN` (sektörel) + `SECTOR` haritası + e-Belge |
| Uygulamalar | `apps/<id>/app.js` ×31 + müşteri sayfaları | Her biri `NS.shell({... integrations: [...]})` |
| Yönetim | `admin/index.html`→`panel.js` (bulut), `admin/demo.html`→`app.js`+`data.js` (yerel), `market.js#adminPage` (yerel) | **3 ayrı panel** |
| Sunucu | `server.js` + `server/cloud/*` | MySQL, oturum, lisans (`canUseApp`), herkese açık API, SEO |
| Tanıtım siteleri | `site/<slug>/index.html` ×31 | `site/tools/build-sites.js` ile **derleme anında** üretiliyor |

Güçlü yanlar korunacak: bağımlılıksız yapı, çevrimdışı çalışma + 3 yönlü birleştirme, sunucu taraflı lisans denetimi (`routes.js:256,267`), herkese açık API beyaz listesi, SEO altyapısı.

---

## 2. Tespit edilen sorunlar (kanıtlı)

### 2.1 🔴 "Admin panelden numaramı girdim ama sitede eski numara çıkıyor"
İletişim bilgisi 5 kaynakta:

| # | Kaynak | Kim kullanıyor |
|---|---|---|
| 1 | `market/market.js:11` yerel `_settings.phone = '0850 555 00 34'` | Pazar yeri alt bilgisi, iletişim sayfası (`frame()` → `S().phone`) |
| 2 | `server/cloud/routes.js:21` `DEFAULTS.phone` + yönetim paneli ayarı | `admin/panel.js:179` buraya kaydediyor; `/api/auth/me` → `site.phone` olarak dönüyor |
| 3 | `admin/data.js:19` `bizPhone`, `supportPhone` | Yerel yönetim merkezi |
| 4 | `core/core.js:1665` `supportPhone \|\| '0850 555 00 34'` | Uygulamalardaki "Lisans gerekli" kilit ekranı |
| 5 | `site/src/site.config.js:5` | 31 tanıtım sitesi + `index.html` SEO başlığı (**derlemede gömülü**) |

**Hata:** `market.js` bulut cevabındaki `CL.site`'ı hiç okumuyor; `S()` her zaman yerel demo ayarını döndürüyor. Tanıtım siteleri ise derlenmiş HTML olduğundan panel değişikliğini asla görmüyor.

**Çözüm:**
- Tek kaynak: sunucudaki `settings` tablosu. `GET /api/site` (herkese açık, önbellekli) → `{name, phone, whatsapp, email, address, iban…}`.
- `market.js` → `S()` bulut modunda `CL.site`'tan okur; yerel modda yerel ayar.
- `core.js` kilit ekranı → `CLOUD.site.phone`.
- Tanıtım siteleri: sunucu HTML'i gönderirken `{{phone}}`, `{{email}}` yer tutucularını değiştirir (`seo.js` zaten alan adını aynı yöntemle değiştiriyor) + `data-site="phone"` olan öğeleri istemci tarafında `/api/site` ile günceller.
- Kabul ölçütü: panelde numara değişince **sayfa yenilemesiyle** pazar yeri, ürün siteleri, kilit ekranı, JSON-LD ve fatura şablonu aynı numarayı gösterir. Test: `server/test/cloud.test.js`'e "ayar yayılımı" testi eklenecek.

### 2.2 🔴 Giriş zor bulunuyor
- `market.js:92-93`: "Hesabım" hayalet buton ve **mobilde gizli** (`mk-hide-m`); birincil buton "7 gün ücretsiz dene".
- Bulut modunda giriş yapmamış kullanıcı için `#acc` yalnızca küçük bir ikon ve "Giriş" yazısı (`market.js:111`).
- Uygulama içinden çıkış yapınca kullanıcı pazar yerine düşüyor; "Uygulamalarım"a dönüş yok.

### 2.3 🔴 "7 günlük kayıt" algısı
Yanlış anlatım yapan yerler: `index.html` `<title>` ve meta açıklaması · `market.js:93` navbar · `:583` kayıt başlığı · `:589` giriş altı bağlantı · `:649` boş durum · `:681` sayfa başlığı "Ücretsiz deneme" · `core.js:198` "NEBSOFT ile hazırlandı" rozeti · tanıtım siteleri.
Doğru dil: **"Ücretsiz hesap oluştur — hesabınız süresiz, seçtiğiniz programın 7 günlük deneme lisansı hemen başlar. Kredi kartı gerekmez."**

### 2.4 🔴 Tanıtım ile mevcut müşteri alanı iç içe
- Aynı üst menüde "Ürünler / Fiyatlar / Sepet" ile "Hesabım" duruyor; lisans sahibi, uygulamasına ulaşmak için vitrinin içinden geçiyor.
- `#/hesabim` hem müşteri paneli, hem satın alma, hem destek; kullanıcıyı ilk açılışta **uygulamalarına değil** lisans kartlarına götürüyor.
- Uygulama kabuğunun yan menüsündeki "NEBSOFT Pazar" linki (`core.js` shell) müşteriyi satış sitesine geri atıyor.

### 2.5 🟡 Entegrasyonlar
- Program başına iki ayrı liste var: uygulamadaki `integrations: [...]` ve `integrations.js:168` `SECTOR`. Birbirini tutmuyor.
- Listelenip **kodda hiç çağrılmayanlar** (örnekler): Oto Servis → `efatura`, `tramer`, `payment` (yalnızca `parca` çağrılıyor) · Anaokulu, Hukuk, Kuyumcu, Müşavir, Toptan, Fiyat Robotu → listelenenlerin hiçbiri `NS.integ.call` ile çağrılmıyor · Randevu `SECTOR`'da `esmm` var, uygulamada yok.
- Kartlarda yalnızca genel açıklama var (`desc`); "bu programda ne işe yarar, hangi ekranda, nasıl test edilir" yok.
- Pazar yeri (`appId()==='pazar'`) tüm sektörel bağlayıcıları gösteriyor.

### 2.6 🟡 Yönetim panelleri dağınık
`market.js#adminPage` (yerel), `admin/demo.html` (yerel "Yönetim Merkezi", lisans/duyuru/bakım modu verisini `nebsoft:yonetim` anahtarına yazıyor) ve `admin/index.html` (bulut). Yerel modda uygulamalar lisansı `nebsoft:yonetim`'den okuyor (`core.js:1649`), bulutta sunucudan. Bakım modu ve duyurular **yalnızca yerel panelde** var, bulutta yok.

### 2.7 🟡 Yazdırma basit
- Tek ortak işlev `NS.printHtml` (`core.js:721`): sabit 420 px pencere, gömülü stil, şablon yok, logo yok, A4/A5/80 mm seçimi yok.
- Oto Servis `printJob` (`apps/otoservis/app.js`): sabit HTML; imza alanı boş kutu; hasar krokisi, fotoğraf, KVKK onayı yok.

### 2.8 🟡 Bildirim yok
- Adisyonda QR menüden gelen **garson çağrısı ve hesap isteği** var (`apps/adisyon/app.js:62`) ama **sessiz**; yalnızca bir şerit gösteriliyor.
- `NS.beep` yalnızca barkod okutma sesi için kullanılıyor. Notification API, titreşim ve ses ayarı yok.

### 2.9 🟡 Mobil ve masaüstü
- PWA manifest'i ve service worker yok → "Ana ekrana ekle" yapılamıyor, çevrimdışı açılış yok.
- Masaüstü paketi yok; donanım köprüsü (`server.js`: ağ yazıcı, terazi, SMS vekili) için kullanıcının Node kurması gerekiyor (`baslat.bat`).

### 2.10 🟢 Tasarım tutarsızlığı
- Marka rengi üç farklı: `DESIGN.md` `#533afd` (Stripe tarzı), `core.css` `--brand:#4f46e5`, logo `#1d7bf5`.
- Yazı tipleri: Inter + Michroma; `DESIGN.md` "sohne" diyor.
- Açılış animasyonu, sayfa geçişi, iskelet yükleme (skeleton) yok; giriş ekranı düz bir kart; uygulama PIN ekranı sade.

---

## 3. Tasarım araştırması → "Nova" tasarım sistemi

### 3.1 Referanslar (2026)
| Kaynak | Ne alıyoruz |
|---|---|
| **shadcn/ui + Shadcn Admin (Vite)** | Token yapısı (`--background/--foreground/--muted/--ring`), yan menü + daraltılabilir gruplar, komut paleti, veri tablosu düzeni |
| **Next.js shadcn Dashboard Starter** | KPI kartı + mini grafik, Kanban, ayarlar sayfası düzeni |
| **Linear / Vercel** | Yoğun ama ferah bilgi düzeni, 1 px ince çizgiler, kısayol ipuçları (⌘K), sakin karanlık tema |
| **Magic UI / Aceternity (efektler)** | Aurora/mesh arka plan, ışıltılı kenar (border-beam), sayı sayaç animasyonu, spotlight kart — CSS ve vanilla JS'ye uyarlanacak |
| **Tremor** | Grafik renk paleti ve KPI "delta" rozetleri |
| **TailAdmin / Flowbite** | Mobil uyumlu tablo → kart dönüşümü, form düzenleri |

> Kararımız: **React'e geçmiyoruz.** 31 çalışan uygulamayı yeniden yazmak aylar sürer ve risklidir. Bu kütüphanelerin görsel dilini ve bileşen anatomisini `core.css` + `core.js`'e taşıyoruz; her uygulama otomatik olarak yeni görünüme geçer.

### 3.2 Nova token'ları (öneri)
- **Marka:** tek renk `--brand: #4f46e5` → yeni ton `oklch(0.56 0.22 268)` (indigo-elektrik); logo da bu tona çekilecek. Her program kendi `--app-accent` rengini korur.
- **Yüzeyler:** açık `#fafafa / #ffffff / #f4f4f5`, karanlık `#09090b / #111113 / #18181b` (zinc).
- **Çizgi:** `--border` %8 kontrast; kartlar gölge yerine 1 px çizgi + çok hafif gölge.
- **Yazı:** Inter Variable (rakamlarda `tabular-nums`), başlıklarda `-0.02em` harf aralığı; Michroma yalnızca logoda.
- **Yarıçap:** 10/14/20 px; **hareket:** 150 ms (hover), 220 ms (panel), 400 ms (sayfa), `cubic-bezier(.2,.8,.2,1)`; `prefers-reduced-motion` saygısı.
- **Yoğunluk anahtarı:** "Rahat / Sıkı" (kasa ekranları için büyük dokunma hedefleri).

### 3.3 İmza ekranlar
1. **Açılış (splash):** NEBSOFT "N" kurdele logosu çizgiyle çizilir (SVG stroke animasyonu, 700 ms) → bulanıklıktan netleşerek içerik gelir. Yalnızca ilk ziyarette ve uygulama açılışında; tekrar ziyarette 150 ms. Gerçek yükleme süresine bağlı, sahte bekletme yok.
2. **Giriş ekranı:** sol yarı canlı aurora/mesh gradyan + yüzen "canlı" kartlar (bugünkü ciro, yeni randevu, mutfak fişi — ürünlerden gerçek ekran parçaları) + müşteri yorumu; sağ yarı cam efektli form. E-posta → şifre; "Beni hatırla", "Şifremi unuttum", "Telefonla QR ile giriş", passkey (parmak izi/yüz). Mobilde tek sütun, arka plan sade.
3. **Program seçici:** büyük ikonlu kartlar (program rengi), lisans durumu, kalan gün, son kullanım; klavyeyle 1-9 kısayolu; "Varsayılan programım" seçeneği.
4. **Uygulama kabuğu v2:** daraltılabilir yan menü (ikon modu), üstte işletme/şube değiştirici, global arama + ⌘K, bildirim zili, kullanıcı menüsü; sayfa başlığında içerik haritası (breadcrumb); mobilde alt sekme çubuğu.
5. **PIN ekranı:** kullanıcı avatar kartları + büyük PIN tuş takımı, cam arka plan, program rengi.
6. **Boş durumlar ve iskeletler:** her tablo ve grafik için skeleton; boş durumlarda "ilk kaydı oluştur" çağrısı.

---

## 4. Bilgi mimarisi — yeni yapı

```
/                      Vitrin (tanıtım)  → Ürünler · Çözümler (sektör) · Fiyatlar · Masaüstü & Mobil · İletişim
                        Sağ üst: [Giriş yap]  [Ücretsiz başla ▸]
/giris  /kayit  /sifre  Kimlik (tam ekran, vitrin menüsü yok)
/app                   Uygulama Merkezi (giriş zorunlu)
  ├─ Programlarım      (1 lisans → otomatik yönlendirme)
  ├─ Abonelik & Fatura (lisans, sipariş, ödeme, yükselt)
  ├─ Ekip & Yetkiler
  ├─ İşletme sayfam    (/t/<slug>)
  ├─ Destek
  └─ Profil & Güvenlik (şifre, passkey, oturumlar, cihazlar)
/admin                 Tek Yönetim Paneli (bulut + yerel demo aynı arayüz)
/apps/<id>/            Programlar (kabuk v2)
/<slug>                Ürün tanıtım siteleri (dinamik iletişim bilgisi)
```

### 4.1 Giriş akışı
```
Giriş başarılı
 ├─ rol admin/superadmin            → /admin
 ├─ ?next= parametresi var          → oraya
 ├─ geçerli lisans/deneme = 0       → "Programını seç" (deneme başlat) ekranı
 ├─ = 1                             → apps/<id>/ (splash ile)
 └─ ≥ 2                             → Program seçici (varsayılan seçildiyse doğrudan o)
Uygulama içi yan menü: "Programlarım" (seçiciye döner), "Hesabım" (/app)
```
Aynı karar işlevi (`resolveLanding(me)`) web, masaüstü ve PWA'da kullanılır.

---

## 5. İş paketleri (fazlar)

> Her fazın sonunda: `npm test`, tarayıcıda açık/karanlık tema, 375 px mobil, demo ve bulut modu kontrolü.

### FAZ 1 — Temel düzeltmeler ve tek kaynak (öncelik: 🔴)
| # | İş | Dosyalar | Kabul ölçütü |
|---|---|---|---|
| 1.1 | Site ayarları tek kaynak (`/api/site`, `S()` bulut uyumu, kilit ekranı, tanıtım sitesi yer tutucuları) | `routes.js`, `seo.js`, `market.js`, `core.js`, `build-sites.js`, `site.config.js` | Panelde değişen telefon 5 yerde de görünür; test eklendi |
| 1.2 | Navbar: belirgin **Giriş yap** + **Ücretsiz başla**; giriş yaptıysa avatar menüsü (Programlarım / Hesabım / Çıkış); mobil menüde de | `market.js frame/drawNav`, `market.css` | Masaüstü ve 375 px'te tek dokunuşla girişe ulaşılır |
| 1.3 | Deneme dili düzeltmesi (§2.3'teki tüm yerler + SEO metinleri) | `index.html`, `market.js`, `core.js`, `site/src/*` | "7 gün" ifadesi yalnızca lisans için geçer |
| 1.4 | `resolveLanding` + program seçici + "Programlarım" uygulama içi linki | `market.js`, `core.js shell` | 1 lisans: doğrudan · 2+: seçici · 0: deneme başlat |
| 1.5 | Kayıt sonrası e-posta doğrulama ve şifre sıfırlama uçları (yoksa) | `routes.js`, `auth.js` | Şifremi unuttum çalışır |

### FAZ 2 — Nova tasarım sistemi
| # | İş | Not |
|---|---|---|
| 2.1 | `core.css` token yenilemesi (renk, yüzey, yarıçap, hareket, yoğunluk) | Eski değişken adları takma ad olarak korunur → uygulamalar bozulmaz |
| 2.2 | Bileşenler: buton (ripple yerine basınç efekti), giriş alanı, seçim, sekme, rozet, KPI kartı (sayaç + delta + mini grafik), tablo (yapışkan başlık, satır hover, mobilde kart), modal → yan çekmece (drawer) seçeneği, toast yığını | |
| 2.3 | Splash/yükleme ekranı (pazar yeri + uygulamalar) ve sayfa geçişleri, skeleton | `prefers-reduced-motion` |
| 2.4 | Gösterişli giriş/kayıt ekranı (§3.3-2) | |
| 2.5 | Kabuk v2: daraltılabilir yan menü, üst çubuk, ⌘K paleti (mevcut `palette` geliştirilir), bildirim zili, mobil alt sekme | `core.js shell` |
| 2.6 | Vitrin yeniden tasarım: hero'da canlı ürün önizlemesi, sektör seçici, "nasıl çalışır" 3 adım, sosyal kanıt, karşılaştırmalı fiyat tablosu, SSS, masaüstü/mobil indirme bölümü | `market.js home`, `market.css` |
| 2.7 | Logo ve marka rengini tekleştir, `DESIGN.md`'yi Nova'ya göre güncelle | |

### FAZ 3 — Müşteri paneli (`/app`) ve tek yönetim paneli
| # | İş |
|---|---|
| 3.1 | `/app` Uygulama Merkezi: Programlarım (büyük kartlar), Abonelik & Fatura (yükselt/uzat tek tık), Ekip & Yetkiler (program bazlı erişim), İşletme sayfam, Destek, Güvenlik (oturum ve cihaz listesi) |
| 3.2 | Yönetim panellerini birleştir: `admin/panel.js` tek arayüz; yerel demo modu aynı arayüzü sahte API ile kullanır. Bakım modu ve duyuruları buluta taşı (`settings`/`announcements` tabloları) |
| 3.3 | Yönetim panosu: MRR, deneme→ödeme dönüşümü, biten lisanslar, bekleyen havaleler, destek SLA; müşteri 360° sayfası |
| 3.4 | Tüm site ayarları (telefon, WhatsApp, e-posta, adres, IBAN, sosyal medya, logo, renk) tek "Marka & İletişim" sayfasında |

### FAZ 4 — Entegrasyon merkezi v2
| # | İş |
|---|---|
| 4.1 | Tek kaynak: `integrations.js`'de **`USAGE`** kataloğu → `{ appId: { kind: { where: 'Kasa > Ödeme al', how: '…', events: ['satis'], test: '…' } } }`. `SECTOR` ve uygulamadaki listeler buradan türetilir |
| 4.2 | Görünürlük: yalnızca o programda kullanımı tanımlı olanlar listelenir; pazar yerinde hiçbiri |
| 4.3 | Kart tasarımı: durum (Kapalı / Simülasyon / Canlı), "Bu programda nerede kullanılır" bilgi kutusu, "Nasıl bağlanır" adımları, "Test et" ve son 5 gönderim |
| 4.4 | Listelenip kodda çağrılmayan entegrasyonlar için ya gerçek kullanım eklenir (ör. Oto Servis → e-Arşiv teslimde, TRAMER plaka sorgusunda) ya da listeden çıkar |
| 4.5 | Kurulum sihirbazı: ilk açılışta "Fiş yazıcınız var mı? SMS göndermek ister misiniz?" 3 adım |

### FAZ 5 — Belge şablon tasarımcısı + dijital imza (tüm programlar)
| # | İş |
|---|---|
| 5.1 | `core/docs.js`: şablon motoru. Kâğıt: A4, A5, 80 mm, 58 mm, etiket. Bloklar: logo, işletme başlığı, müşteri, araç/kayıt bilgisi, kalem tablosu, toplamlar, serbest metin, QR (takip linki), barkod, imza kutuları, KVKK metni, hasar krokisi |
| 5.2 | Görsel düzenleyici: sürükle-bırak blok sırası, alan aç/kapat, yazı boyutu, renk, önizleme (gerçek veriyle); program başına hazır 2-3 şablon |
| 5.3 | `NS.sign()`: tuval üzerinde parmak/kalem imzası (basınç yumuşatma), imza PNG + zaman + cihaz bilgisi kayda eklenir; "müşteri ekranı" (tablette ikinci pencere) ve **uzaktan imza linki** (SMS/WhatsApp ile) |
| 5.4 | Yazdırma: `printHtml` yerine `NS.print(doc, template)`; ESC/POS fiş yazıcıya da aynı şablondan metin çıktısı; PDF olarak kaydet / WhatsApp'la gönder |

### FAZ 6 — Oto Servis v2 (örnek program, sonra diğerlerine yayılır)
Kullanıcının tarif ettiği akış:
1. **Servis oluştur** tek ekran: plaka **veya** müşteri adı **veya** telefonla arama (otomatik tamamlama). Kayıtlıysa araç + müşteri + geçmiş anında gelir; değilse aynı ekranda yeni kayıt (ayrı form yok).
2. Kabulde: km, yakıt seviyesi (görsel gösterge), araçta bırakılan eşyalar, **hasar krokisi** (araç silüeti üzerinde tıkla-işaretle: çizik/göçük/kırık), fotoğraf (kamera), müşteri şikâyeti, tahmini teslim; **müşteri kabul imzası**.
3. Her servis = 1 iş emri satırı; altında **kalem kalem** (satır içi düzenlenebilir tablo): tür (parça/işçilik/dış hizmet/sarf), kod, açıklama, miktar, birim, fiyat, indirim, KDV, teknisyen, onay durumu. Klavyeyle hızlı giriş (Enter → yeni satır), hazır **işçilik kataloğu** ve **bakım paketleri** (ör. "10.000 km bakım" tek tıkla 6 kalem).
4. Müşteri onay linki (mevcut) + kalem bazında onay.
5. **Teslim:** çıkış km, yapılan işlerin özeti, garanti şartları, **"aracı sağlam ve eksiksiz teslim aldım" teslim alan imzası** + teslim eden personel imzası; e-Arşiv kes; işletmenin seçtiği şablonla yazdır/PDF/WhatsApp.
6. Sonraki bakım hatırlatması (km/tarih) otomatik SMS.

Aynı "kayıt aç → kalem kalem işlem → şablonla yazdır → imza" deseni: Teknik Servis, Klinik (tedavi planı), Veteriner, Kiralama (teslim/iade tutanağı + hasar krokisi), Otel (folyo), Hukuk (masraf), Kargo (teslim imzası — mevcut olan şablonlara bağlanır).

### FAZ 7 — Bildirim ve ses merkezi
- `core/notify.js`: `NS.notify(event, {title, body, data})`.
- Ses: WebAudio ile sentezlenmiş ses paketi (dosya yok, küçük): **zil, gong, çift bip, marimba, acil (tekrarlı), kasa**. Olay başına ses, ses düzeyi, **onaylanana kadar tekrar**, susturma saatleri.
- Kanal: uygulama içi toast + zil listesi, masaüstü bildirimi (Notification API / Electron yerel bildirim), mobilde titreşim, sekme başlığında sayaç (`(3) Adisyon`).
- Ayarlar → **Bildirimler**: olay listesi, her satırda aç/kapa, ses seçimi ▶ dinle, tekrar, kime (rol: garson/mutfak/kasa).
- Olay kataloğu (başlangıç):

| Program | Olaylar |
|---|---|
| Adisyon | Garson çağrıldı · Hesap istendi · Yeni QR sipariş · Platform siparişi (Yemeksepeti/Getir/Trendyol) · Mutfak: sipariş hazır · Uzun süredir bekleyen masa |
| Market POS | Hızlı ticaret siparişi · Stok kritik · Z raporu hatırlatma |
| Randevu / Klinik / Veteriner | Yeni online randevu · İptal · 10 dk sonra randevu · Aşı/kontrol günü |
| Oto Servis / Teknik Servis | Müşteri teklifi onayladı/reddetti · Online ödeme geldi · Parça geldi |
| Otel | Yeni rezervasyon (kanal) · Check-in yaklaşıyor · Housekeeping oda hazır |
| E-ticaret / Pazaryeri | Yeni sipariş · Kargoya verme süresi doluyor · Müşteri sorusu |
| Kargo | Teslimat tercihi değişti · Kurye gecikmesi |
| Eczane | Reçete hazırlama talebi |
| Site yönetimi | Sakin talebi · Ödeme geldi |
| Hepsi | Lisans bitiyor · Eşitleme hatası · Destek yanıtı |

- Çapraz cihaz: bulutta olaylar `/api/events` (SSE) ile tüm cihazlara iletilir → garsonun telefonu, mutfak ekranı ve kasa aynı anda duyar.

### FAZ 8 — Masaüstü sürümü
**Önerim: Electron.** Gerekçe: mevcut donanım köprüsü (`server.js` — ağ yazıcısı, terazi, SMS vekili, TCMB kuru) Node ile yazılmış; Electron bunu **değiştirmeden** ana süreçte çalıştırır, kullanıcının Node kurmasına gerek kalmaz. Tauri 2 kurulum boyutunda çok daha küçük (≈10 MB ve ≈100 MB), ama köprüyü Rust'a taşımak ya da Node'u ayrıca paketlemek gerekir; bu, boyut avantajını büyük ölçüde siler.
- Uygulama: `desktop/` klasörü; `electron-builder` ile Windows (NSIS kurulum + otomatik güncelleme), macOS (dmg) çıktısı.
- Açılış: splash → **yerel giriş ekranı** (aynı Nova tasarımı) → `resolveLanding` → 1 lisans: doğrudan program, 2+: program seçici (pencere içinde).
- Özellikler: ESC/POS yazıcıya sessiz yazdırma (yazdır penceresi yok), seri port/terazi, yerel bildirimler + sistem tepsisi (arka planda sipariş sesi), kiosk/tam ekran kasa modu, çevrimdışı çalışma ve sonra eşitleme, birden fazla pencere (mutfak ekranı ikinci monitörde).
- İndirme: vitrinde **"Masaüstü & Mobil"** sayfası + navbar/footer "Masaüstü sürümünü indir"; işletim sistemi otomatik algılanır. Sürüm dosyaları sunucudan (`/indir/latest.yml`).
- İmzalama: Windows SmartScreen uyarısı olmaması için kod imzalama sertifikası gerekir (satın alma kararı sizde).

### FAZ 9 — Mobil kolaylık
- **PWA:** `manifest.webmanifest` (program başına ikon ve renk), service worker (kabuk önbelleği, çevrimdışı açılış), "Ana ekrana ekle" yönlendirmesi (iOS için adım adım görsel).
- **Kolay giriş:** (a) "Beni hatırla" ile 30 günlük cihaz oturumu + uygulama PIN'i; (b) **passkey** (WebAuthn — parmak izi/Face ID); (c) **QR ile giriş:** masaüstünde açık oturumdan "Telefona aktar" → telefon kamerası okutur → giriş yapılmış olur; (d) e-posta sihirli bağlantı.
- **Mobil arayüz:** kabukta alt sekme çubuğu, büyük dokunma hedefleri, tablolar karta dönüşür, garson için tek elle kullanılan sipariş ekranı, kamera ile barkod/plaka okuma.
- İleride: aynı PWA Capacitor ile mağazaya (Play/App Store) sarmalanabilir.

### FAZ 10 — Programların derinleştirilmesi ("iddialı ol")
Her program için ortak kontrol listesi; her biri için ayrı eksik analizi yapılıp sırayla uygulanacak:
- [ ] Kayıt aç → kalem kalem → şablonla yazdır → imza deseni (uygun olanlarda)
- [ ] Şablon tasarımcısında hazır belgeler (fiş, fatura, sözleşme, tutanak)
- [ ] Bildirim olayları tanımlı
- [ ] Entegrasyon `USAGE` girdileri ve gerçek çağrıları
- [ ] Mobil görünüm ve PWA ikonu
- [ ] Toplu işlem, Excel içe/dışa aktarım, kayıtlı filtre (çekirdekte var, her listede açık mı?)
- [ ] Rol bazlı yetki ve işlem günlüğü
- [ ] Müşteriye açık sayfa (varsa) Nova tasarımında

Öncelik sırası (satış potansiyeli ve kullanıcı geri bildirimi): **Oto Servis → Adisyon → Market POS → Teknik Servis → Randevu → Klinik → Otel → E-ticaret/Pazaryeri → diğerleri.**

### FAZ 11 — Ürün tanıtım siteleri
- `build-sites.js` şablonu Nova'ya geçer; iletişim bilgisi dinamik (§2.1).
- Her sitede: sektör diliyle hero, kısa demo videosu/GIF alanı, "Bu programda neler var" (gerçek ekran görüntüleri), entegrasyon logoları (yalnızca o programda kullanılanlar — `USAGE`'den), fiyat, SSS, **"Masaüstü / mobil"** bölümü, sağ üstte **Giriş yap**.

---

## 6. Teknik kurallar
- Framework yok; ES2020 vanilla JS. Yeni modüller: `core/nova.css`, `core/notify.js`, `core/docs.js` (şablon + imza), `core/pwa.js`, `desktop/`.
- Geriye uyum: eski CSS değişken adları ve `NS.*` API'leri korunur; uygulamalar kademeli taşınır.
- Erişilebilirlik: kontrast AA, klavye ile tam kullanım, odak halkası, `aria-live` bildirimler.
- Performans: ilk açılış < 1,5 sn (3G hızlı), JS tembel yükleme (şablon tasarımcısı yalnızca açıldığında).
- Güvenlik: imza verisi ve fotoğraflar tenant'a özel; herkese açık uçlar beyaz listede (`public-rules.js`); passkey ve QR girişte tek kullanımlık, 60 sn ömürlü belirteç.
- Test: her fazda `server/test`'e uç testi; arayüz için duman testi listesi.

---

## 7. Önerilen sıra ve kapsam tahmini
| Sıra | Faz | Büyüklük |
|---|---|---|
| 1 | Faz 1 — temel düzeltmeler, tek giriş akışı | Orta |
| 2 | Faz 2 — Nova tasarım sistemi, splash, giriş ekranı, kabuk v2 | Büyük |
| 3 | Faz 7 — bildirim/ses merkezi (Adisyon ile) | Orta |
| 4 | Faz 5 + 6 — şablon tasarımcısı, imza, Oto Servis v2 | Büyük |
| 5 | Faz 4 — entegrasyon merkezi v2 | Orta |
| 6 | Faz 3 — /app müşteri paneli, tek yönetim paneli | Büyük |
| 7 | Faz 9 — PWA ve mobil giriş | Orta |
| 8 | Faz 8 — Electron masaüstü | Orta |
| 9 | Faz 10–11 — program bazlı derinleştirme, tanıtım siteleri | Sürekli |

## 8. Sizin kararınızı bekleyen konular
1. Marka rengi: mevcut indigo mu kalsın, logodaki maviye (#1d7bf5) mi geçelim?
2. Masaüstü teknolojisi: **Electron** (önerilen) mi, Tauri mi, yoksa .NET WebView2 sarmalayıcı mı?
3. Windows kod imzalama sertifikası alınacak mı? (SmartScreen uyarısı için)
4. Passkey ve QR giriş ilk sürümde olsun mu?

## Kaynaklar
- shadcn tabanlı panolar: https://adminlte.io/blog/free-shadcn-admin-dashboards · https://dev.to/bishoy_semsem/11-best-open-source-shadcn-dashboard-templates-for-2026-479d
- Tailwind admin şablonları 2026: https://www.jetadmin.io/blog/best-tailwind-admin-template-options-in-2026-and-when-to-use-jet-admin-instead/amp/
- Tauri ve Electron karşılaştırması: https://tech-insider.org/tauri-vs-electron-2026/ · https://vanja.io/tauri-2-new-default/ · https://capgo.app/blog/electron-vs-tauri-capacitor/
- Cam efektli giriş örnekleri: https://www.superdesign.dev/styles/glassmorphism/login · https://21st.dev/@dhileepkumargm/components/premium-auth.md
