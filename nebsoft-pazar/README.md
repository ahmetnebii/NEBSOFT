# NEBSOFT Pazar — İşletme Yazılımları Pazar Yeri

Türkiye'deki işletmeler için 21 sektörel web yazılımı ve bunların satıldığı pazar yeri sitesi.
Her şey tarayıcıda çalışır; kurulum veya veritabanı gerekmez. Demo verileri tarayıcının
`localStorage` alanında tutulur. Donanım ve dış servis bağlantıları `server.js` köprüsüyle çalışır.

## Çalıştırma

- **Windows:** `baslat.bat` dosyasına çift tıklayın. Tarayıcıda `http://localhost:5050` açılır.
- **Komut satırı:** `node server.js` → `http://localhost:5050`
- Node.js yoksa `index.html` dosyasını doğrudan tarayıcıda da açabilirsiniz (ağ yazıcısı, SMS
  sağlayıcıları ve TCMB kurları gibi köprü gerektiren özellikler bu durumda çalışmaz).

## Demo girişleri

| Nerede | Bilgi |
|---|---|
| Tüm uygulamalar (personel girişi) | Kullanıcıyı seçin, PIN: **1234** |
| Pazar yerinden açılan demolar | `?demo=1` ile otomatik yönetici girişi |
| Pazar yeri yönetim paneli (`#/yonetim`) | PIN: **1234** |
| Demo kuponu | `NEBSOFT20` |

Her uygulamanın üstündeki **Demoyu sıfırla** bağlantısı örnek verileri yeniden yükler.

## Klasör yapısı

```
index.html            Pazar yeri (vitrin, ürün sayfaları, sepet, ödeme, hesabım, yönetim)
market/               Pazar yeri kodu, stilleri ve ürün kataloğu (catalog.js)
core/core.js          Ortak tasarım sistemi ve JS çekirdeği (DB, tablo, form, grafik, kabuk)
core/integrations.js  Entegrasyon merkezi (SMS, yazıcı, terazi, POS, e-Belge, sektörel bağlayıcılar)
apps/<ürün>/          Her ürün ayrı bir uygulama
server.js             Bağımlılıksız yerel sunucu + donanım/servis köprüsü (/api)
```

## Ürünler

| Ürün | Klasör | Öne çıkanlar | Sektörel bağlantılar |
|---|---|---|---|
| Fabrika ERP | `apps/fabrika` | Satınalma talep→teklif→sipariş, kantarlı mal kabul, karantina + giriş kalite kontrol, lot/SKT/FEFO, çok seviyeli reçete, iş emri, MRP, kapasite planı, bakım/OEE, sevkiyat, izlenebilirlik & geri çağırma | e-İrsaliye, e-Müstahsil, kantar, PLC/OPC-UA, muhasebe aktarımı, banka |
| Market POS | `apps/pos` | Barkod/terazi, veresiye, kampanya, alış faturası, sayım, Z raporu, etiket | ÖKC (GMP3), pazaryerleri, muhasebe aktarımı |
| Adisyon | `apps/adisyon` | Masa planı, mutfak ekranı, paket servis, reçeteli stok, hesap bölme, QR menü | ÖKC, Yemeksepeti/Getir/Trendyol, yemek kartları, arayan numara |
| Randevu | `apps/randevu` | Sürükle-bırak takvim, paket/seans, SMS şablonu, prim, online randevu | Google/Outlook takvim, Google İşletme & Instagram, e-SMM |
| Otel & Pansiyon | `apps/otel` | Oda×gün takvimi, check-in/out, folyo, housekeeping, ADR/RevPAR, kanal & KBS ekranı | KBS, kanal yöneticisi (Booking/Expedia/Airbnb), kartlı kilit, santral |
| Teknik Servis | `apps/servis` | Kabul formu, kanban, teklif/onay, parça stoku, garanti, takip sayfası | Arayan numara, takvim, muhasebe aktarımı |
| Spor Salonu | `apps/spor` | Giriş kontrol, dondurma, taksit, ders programı, ölçüm | Turnike / yüz tanıma, KPS, takvim |
| Ön Muhasebe | `apps/muhasebe` | Fatura/teklif/sipariş, sevk & alış irsaliyesi, depo/stok, dövizli belge + TCMB kurları, cari ekstre, kasa-banka, çek/senet, makbuz | e-Fatura/e-Arşiv/e-İrsaliye, e-SMM, e-Müstahsil, e-Defter, banka, Logo/Mikro/Luca aktarımı |
| Klinik | `apps/klinik` | Diş şeması, tedavi planı, anamnez, reçete, hekim takvimi | e-Nabız, e-Reçete, KPS, e-SMM, takvim |
| Emlak Ofisi | `apps/emlak` | Portföy, talep eşleştirme, gösterim, kira takibi, komisyon | sahibinden / Hepsiemlak / Emlakjet, yetki belgesi |
| Kurs & Etüt | `apps/kurs` | Yoklama + veli SMS, ders programı, deneme sınavı, taksit | MEBBİS / e-Yaygın, online ders, e-SMM |
| Oto Yıkama & Otopark | `apps/oto` | Plaka ile giriş/çıkış, tarife, yıkama kuyruğu, abonelik | Plaka tanıma kamerası + bariyer, ÖKC |
| Araç Kiralama | `apps/kiralama` | Filo takvimi, sözleşme, km/yakıt/hasar, bakım hatırlatma | Emniyet kiralık araç bildirimi, HGS/OGS, GPS |
| Site Yönetimi | `apps/site` | Aidat tahakkuku, gider dağıtımı, gecikme faizi, duyuru, sakin portalı | Banka hareketi eşleştirme, toplu SMS |
| CRM | `apps/crm` | Kanban huni, aktivite/görev, teklif, tahmin | Arayan numara, takvim |
| Personel & Puantaj | `apps/ik` | Aylık puantaj, fazla mesai, izin onayı, yasal bordro ve tazminat | SGK işe giriş/çıkış, PDKS, e-Bordro, banka maaş talimatı |
| Veteriner | `apps/veteriner` | Aşı karnesi/hatırlatma, muayene, kilo takibi, pet otel | VETBİS, PETVET, e-SMM |
| E-ticaret Mağazası | `apps/eticaret` | Varyantlı ürün, sipariş/kargo, kupon, terk edilen sepet, iade | Pazaryerleri, kargo firmaları API, e-İrsaliye |
| Eczane | `apps/eczane` | Reçeteli satış ve SGK katkı payı, parti/SKT, muadil, depo siparişi, kurum mutabakatı | MEDULA, İTS, ÜTS, ecza deposu, ÖKC |
| Kargo & Kurye | `apps/kargo` | Desi fiyatı, etiket, zimmet, kurye imzalı teslim, KT mutabakatı | Anlaşmalı kargo firmaları, GPS |
| Etkinlik Bilet | `apps/bilet` | Koltuk planı, gişe, kapı kontrol, iade, indirim kodu, online bilet | Turnike / QR kapı okuyucu |

## Müşteriye açık sayfalar

| Sayfa | Adres | Ne yapar |
|---|---|---|
| Site sakin portalı | `apps/site/sakin.html` | Blok/daire + telefon son 4 hane ile giriş; aidat şeridi, kartla ödeme ve makbuz, ortak alan rezervasyonu, QR kodlu ziyaretçi bildirimi, talep takibi, anket, duyurular |
| Servis takip | `apps/servis/takip.html?kod=` | Adım çubuğu, kalem kalem teklif onayı/reddi, teslime hazırda online ödeme, garanti bitişi, puanlama |
| Kargo takip | `apps/kargo/takip.html?no=` | Rota görseli, saat aralığı, alıcı doğrulamalı teslimat tercihi (komşu/görevli/şube/başka gün), yeniden teslimat, puan |
| CRM teklif onayı | `apps/crm/teklif.html?t=` | Müşteri teklifi görür, adıyla kabul veya nedenli red eder; fırsat otomatik güncellenir |
| Pati karnesi | `apps/veteriner/karne.html` | Telefonla giriş; aşı karnesi, muayeneler, kilo grafiği, online randevu isteği |
| Otel rezervasyon motoru | `apps/otel/rezervasyon.html` | Müsaitlik ve sezon fiyatı, pansiyon seçimi, OTA karşılaştırması, kapora, rezervasyon yönetimi/iptal |
| Spor üye portalı | `apps/spor/uye.html` | QR üye kartı, ders rezervasyonu, ölçüm grafiği, taksit ödeme, yenileme, dondurma |
| Kurs veli portalı | `apps/kurs/veli.html` | Yoklama, ders programı, deneme analizi, taksit ödeme, mazeret ve mesaj |
| Online araç kiralama | `apps/kiralama/kirala.html` | Model bazında müsaitlik, ekstralar, yaş/ehliyet kontrolü, ön ödeme, iptal |
| Aracım nerede? | `apps/oto/arac.html` | Yıkama sırası ve hazır saati, otopark ön ödemesi, abonelik |
| Reçetemi hazırla | `apps/eczane/recete.html` | E-reçete hazırlatma ve takip, stok sorgu, nöbet bilgisi |
| Bayi sipariş portalı | `apps/fabrika/bayi.html` | Özel fiyat listesiyle B2B sipariş, sevkiyat ve lot takibi |

## Kanal / pazaryeri merkezleri

| Merkez | Modül | Kanallar |
|---|---|---|
| Pazaryeri Merkezi | E-ticaret (`pazaryeri.js`) | Trendyol, Hepsiburada, n11, Amazon TR, Pazarama, Çiçeksepeti — fiyat/stok kuralı, listeleme matrisi, kategori eşleştirme, hakediş, sorular |
| Hızlı ticaret | Market POS (`hizli.js`) | Getir Çarşı, Yemeksepeti Market, Trendyol Go — sipariş panosu, barkodla toplama, otomatik satış/stok |
| Yemek platformları | Adisyon (`platform.js`) | Yemeksepeti, Getir Yemek, Trendyol Yemek, Migros Yemek — aç/kapat, yoğunluk modu, ürün kapatma, komisyon, yorumlar |
| İlan portalları | Emlak (`portal.js`) | sahibinden.com, Hepsiemlak, Emlakjet — yetki belgesi, kota, doping, yenileme, talep başı maliyet |

Entegrasyon merkezinde ilgili bağlantı kapalıyken merkezler **simülasyon modunda** çalışır ve bunu ekranda belirtir.

## Son eklenen ürün özellikleri

- **Personel & Puantaj — yasal bordro:** `apps/ik/bordro.js` brüt/net, SGK ve işsizlik (tavan/taban), kümülatif gelir vergisi,
  asgari ücret GV/DV istisnası, işveren maliyeti; bordro pusulası; kıdem/ihbar/kullanılmayan izin hesabı.
  Parametreler (2026 varsayılanları) Ayarlar > Bordro'dan yıllık güncellenir — resmi beyandan önce mali müşavirle teyit edin.
- **CRM:** KDV'li ve revizyonlu teklifler, teklif durumları ve görüntülenme takibi, Görevler ajandası, Firma 360° kartı.
- **Klinik:** taksitli ödeme planı, Kasa & Tahsilat (gün sonu, geciken taksite SMS), Laboratuvar iş takibi, Hekim hakedişi.
- **Site yönetimi:** Ziyaretçiler (kodla giriş doğrulama), Rezervasyonlar, Anketler; taleplere yönetim yanıtı.
- **Veteriner:** online randevu isteklerini SMS ile onaylama, sahibine karne bağlantısı.
- **Ön Muhasebe:** KDV beyan taslağı (devreden KDV zinciri), Form Ba/Bs, cari mutabakat mektupları, beyan takvimi.
- **Fabrika ERP:** bayi portalından gelen siparişlerin onayı ve SMS bildirimi.

## Tasarım skill'leri

Depo kökündeki `.claude/skills` altında Claude Code oturumlarında otomatik yüklenen tasarım rehberleri bulunur:
`design-taste-frontend`, `ui-ux-pro-max`, `design-motion-principles`.

## Canlıya geçiş (pazaryeri API'leri)

Kanal merkezleri her kanal için **Simülasyon** veya **Canlı** modda çalışır. Canlı mod `server.js` köprüsündeki
adaptörleri kullanır (`server/connectors`), bu yüzden uygulama `node server.js` ile açılmalıdır.

| Kanal | Bağlantı | Yapılabilenler |
|---|---|---|
| Trendyol | Doğrudan API (satıcı no + API anahtarı + gizli anahtar) | Bağlantı testi, sipariş çekme, stok/fiyat (1000'lik partiler), toplu işlem sonucu, ürün gönderme (marka/kategori ID ile), paket durum ve kargo bildirimi, soru çekme/yanıtlama, hakediş |
| Hepsiburada | Doğrudan API (merchantId + servis kullanıcı adı + servis anahtarı) | Bağlantı testi, sipariş çekme, stok/fiyat yükleme ve durum sorgusu |
| Getir, Yemeksepeti, Trendyol Go/Yemek, Migros Yemek, n11, Amazon, Pazarama, Çiçeksepeti | Webhook (`/api/webhook/<kanal>?token=…`) veya yetkili entegratör adresi | Siparişler webhook ile gelen kutusuna düşer (`/api/inbox`); gönderim entegratör üzerinden |

1. Satıcı panelinden API bilgilerini alın (Trendyol: Hesap Bilgilerim > Entegrasyon Bilgileri; Hepsiburada: Entegrasyon > API bilgileri).
2. E-ticaret > Pazaryeri Merkezi > kanal ⚙ > **Canlı mod**; önce **Test ortamı** işaretliyken deneyin. Kayıttan önce gerçek bağlantı testi yapılır.
3. Trendyol'a ürün göndermek için kanal ayarına marka ID ve kargo firması ID, Kategori Eşleştirme'ye Trendyol kategori ID'lerini girin.
4. Webhook belirteci ilk çalıştırmada `data/webhook-token.txt` içinde üretilir; `GET /api/kanal` tam adresi verir.
5. Pazaryeri bir adresi değiştirirse kod değil `data/endpoints.local.json` güncellenir (yapı: `server/connectors/endpoints.json`).

Adaptör testleri: `node server/test/kanal.test.js` (sahte pazaryeri sunucusuna karşı 12 test).
`data/` klasörü gizli bilgiler ve gelen kutusu içerir, sürüm kontrolüne eklenmez.

## Kullanım kolaylıkları (tüm ürünlerde)

- **Tutar ve sayı alanları:** yazarken binlik ayıracı eklenir (100000 → 100.000), ondalık için virgül,
  tutar alanlarında ₺ işareti; ↑/↓ ile artır-azalt, yapıştırılan "1.250,50" / "1250.50" doğru okunur.
- **Aramalı seçim:** 6'dan fazla seçeneği olan listeler (cari, ürün, hasta, malzeme...) tıklanınca veya
  harf yazılınca arama kutulu pencereyle açılır; ↑↓ Enter ile seçilir.
- **Doğrulama ve biçim:** telefon (0532 123 45 67), IBAN (TR.. gruplu), plaka (büyük harf), TC kimlik ve
  VKN kontrol hanesi, e-posta.
- **Klavye:** Ctrl+K hızlı menü, `/` sayfa araması, formda Enter ile sonraki alan, Ctrl+S kaydet,
  tarih alanında B (bugün) ve +/- gün, `?` kısayol listesi. Tablo başlıklarına tıklayarak sıralama.

- **Listeler:** her tablonun sağ üstündeki ⚙ menüsünden sütun göster/gizle (hatırlanır), görünen
  (filtrelenmiş, sıralanmış) listeyi **Excel (.xlsx)** olarak indir, yazdır. Sayfalardaki tüm "dışa aktar"
  düğmeleri de artık gerçek Excel dosyası üretir (sayılar sayı olarak, başlık satırı sabit, otomatik filtreli).
- **Çoklu seçim ve toplu işlem:** satır başındaki kutularla (Shift ile aralık) seçim; alttaki çubuktan
  seçilenleri Excel'e aktar, yazdır veya satır işlemini (sil, iptal, gönder, onayla, uzat, askıya al…)
  tümüne uygula. Form isteyen işlemler toplu yapılmaz, uyarı verilir.
- **Kayıtlı filtreler:** arama kutusunun yanındaki "Filtreler" ile o anki arama + filtre düğmeleri + seçimler
  adıyla kaydedilir; ★ ile varsayılan yapılan filtre sayfa açılınca uygulanır.
- **Form taslakları:** pencerelerde yazılanlar otomatik kaydedilir; kaydetmeden kapatılırsa bir sonraki
  açılışta "Taslağı geri yükle" çıkar.
- **Geri al:** Ctrl+Z veya üst çubuktaki ↶ düğmesi son değişikliği geri alır (oturum boyunca 30 adım);
  silme ve toplu işlemlerden sonra bildirimde "Geri al" düğmesi çıkar. Toplu işlem tek adımda geri alınır.

## Yönetim Merkezi (admin/index.html)

NEBSOFT'un kendi yönetim paneli (PIN 1234; pazar yeri yönetim panelinden de açılır).
- **İşletmeler:** şirket ekleme (deneme lisansı ve sahip kullanıcısıyla hızlı kurulum), VKN tekrar kontrolü,
  sektör/şehir/bayi, etiketler, askıya alma. İşletme kartında lisanslar, kullanıcılar, tahsilatlar, log
  kayıtları, destek, API anahtarları ve notlar.
- **Lisanslar:** anahtar üretimi/yenileme, plan ve periyot, kullanıcı/şube/cihaz limitleri, özellik bayrakları
  (e-Belge, entegrasyon, API, çok şube), uzatma (tahsilat ve e-Fatura ile), askıya alma/iptal, cihaz
  aktivasyonları, lisans geçmişi ve lisans belgesi; anahtar doğrulama. Pazar yeri lisanslarıyla iki yönlü eşitlenir.
- **Kullanıcılar:** tüm işletmelerin kullanıcıları; rol, 2FA, kilit açma, şifre sıfırlama, oturum sonlandırma,
  pasif/aktif; kullanıcı limiti kontrolü.
- **Log takibi:** tüm ürünlerden merkezi olay kaydı (oturum, işlem, silme, ayar, e-Belge, entegrasyon,
  lisans). Tarih, işletme, kullanıcı, ürün, tür, seviye filtreleri; olay listesi, zaman çizelgesi, gün×saat
  ısı haritası, kullanıcı ve işletme özetleri, canlı izleme, Excel'e aktarım.
- **Güvenlik uyarıları:** art arda hatalı PIN, mesai dışı giriş, kısa sürede çok sayıda silme, kilitli hesap.
- **Tahsilat & abonelik:** MRR/ARR, bekleyen havale onayı, otomatik yenileme, faturalama (e-Belge).
- **Destek** (SLA'lı), **bayiler** (komisyon), **duyurular** (ürünlerde bant olarak çıkar) ve ürün bazında
  **bakım modu**.
- **Ürünlerle bağlantı:** bir işletme "Bu tarayıcıya bağla" ile bağlanırsa ürünler o işletmenin lisansını
  denetler (askıda/süresi dolmuşta kilit ekranı, bitişe 14 gün kala uyarı bandı) ve tüm olaylar o işletme
  adına loglanır.

## e-Belge merkezi (e-Fatura / e-Arşiv / e-İrsaliye)

e-Fatura kullanan her ürünün menüsünde **e-Belgeler** sayfası bulunur; belgeler tüm ürünlerde ortak
depoda tutulur.
- **Giden kutusu:** GİB biçiminde seri numarası (NEB2026000000001), ETTN, senaryo; alıcının e-Fatura
  mükellefi olup olmadığı sorgulanarak e-Fatura ya da e-Arşiv otomatik seçilir. Görüntüle / yazdır,
  UBL-TR XML indir, e-posta, durum sorgula, tekrar gönder, iptal veya iptal talebi.
- **Gelen kutusu:** gelen belgeleri al, kabul / red yanıtı, tek tıkla **alış faturası** (Ön Muhasebe:
  cari VKN ile bulunur, stok girer; Market POS: tedarikçi ve ürün eşleşir, stok ve maliyet güncellenir).
- **Bağlantılar:** Ön Muhasebe satış faturası (isteğe bağlı otomatik), Market POS satış fişi, Fabrika ERP
  sevkiyat (e-İrsaliye + sipariş fiyatlarıyla fatura), e-ticaret kargolama, otel çıkışı, randevu ve klinik
  tahsilatı. e-Belgesi kesilmiş fatura kilitlenir; değişiklik için önce iptal gerekir.

## Entegrasyon merkezi

Her ürünün yönetici menüsünde **Entegrasyonlar** sayfası vardır. Ayarlar tüm ürünlerde ortaktır.

- **Genel:** SMS (Netgsm, İleti Merkezi, Verimor, Mutlucell, Twilio, özel API), WhatsApp (bağlantı /
  Cloud API), e-posta, fiş yazıcı (tarayıcı / USB Web Serial / ağ ESC/POS), etiket yazıcı (ZPL/TSPL),
  terazi (barkodlu / seri port), POS terminali, e-Fatura/e-Arşiv entegratörü, online ödeme, barkod,
  webhook (HMAC imzalı), toplu yedekleme.
- **Sektörel & resmi:** Ürüne göre otomatik listelenir. Her bağlayıcıda sağlayıcı seçimi, servis
  adresi, kimlik bilgileri ve test ortamı ayarı bulunur. **Simülasyon** modunda akış kayda geçer ama
  dış sisteme gönderim yapılmaz; **Özel API** seçildiğinde istek `{action, payload}` JSON'u olarak
  `server.js` köprüsü üzerinden verdiğiniz adrese (yetkili entegratör / kendi ara servisiniz) gider.
- Tüm gönderimler **Gönderim kayıtları** sekmesinde izlenir.

Resmi kurum sistemleri (GİB, SGK MEDULA, İTS, e-Nabız, KBS, VETBİS, MEBBİS) doğrudan tarayıcıdan
çağrılamaz; yetkili entegratör veya kurumun verdiği web servis yetkisiyle sunucu tarafında bağlanır.

## Canlıya alma için yapılacaklar

Bu sürüm, tam çalışan bir **ön yüz ve demo** sürümüdür. Gerçek müşterilere satış için:

1. **Sunucu ve veritabanı:** `core/core.js` içindeki `DB` sınıfı localStorage kullanır. Aynı API
   (`all/get/insert/update/remove`) bir REST API'ye (Node.js + PostgreSQL vb.) bağlanarak
   çok kullanıcılı ve çok şubeli yapıya geçilir.
2. **Kimlik doğrulama:** PIN girişi sunucu tarafında şifreli parola/oturum yönetimine taşınmalı.
3. **Ödeme:** Pazar yerindeki ödeme adımı iyzico veya PayTR'nin ortak ödeme sayfasına
   yönlendirilecek şekilde tasarlandı. Üye işyeri anahtarlarıyla entegre edilmeli.
4. **Resmi entegrasyonlar:** Entegrasyon merkezindeki her bağlayıcı için seçilen entegratörün
   (e-Belge, MEDULA/İTS, KBS vb.) sözleşmesi yapılıp servis adresi ve kimlik bilgileri girilmeli.
5. **Yasal metinler:** KVKK, mesafeli satış ve iade metinleri örnek şablondur; hukukçuya onaylatın.

## Ürün tanıtım siteleri (domain.com/<program>)

Her program için ayrı bir SEO tanıtım sayfası vardır: `/randevusistemi`, `/adisyonprogrami`, `/marketprogrami` … (21 adres, liste: `site/src/products.js`).

- İçerik: `site/src/products.js` (başlık, açıklama, sorunlar, ekranlar) + `market/catalog.js` (özellikler, modüller, fiyat, SSS)
- Alan adı, telefon, e-posta: `site/src/site.config.js`
- Ekran görüntüleri (PC 1440×900 ve mobil): önce `node server.js`, sonra `node site/tools/screens.js` (tek ürün için: `node site/tools/screens.js randevu`). İnterneti olan bir bilgisayarda çalıştırın, yoksa fotoğraflı sayfalarda gri kutular çıkar.
- Sayfaları üretmek: `node site/tools/build-sites.js` → `site/<slug>/index.html`, `site/sitemap.xml`, `robots.txt`
- `server.js` `/<slug>` adresini `site/<slug>/index.html` dosyasına bağlar. Nginx'te karşılığı: `location ~ ^/([a-z0-9-]+)$ { try_files /site/$1/index.html =404; }` ve `location ~ ^/([a-z0-9-]+)/img/(.+)$ { alias /SITE_KOKU/site/$1/img/$2; }`
