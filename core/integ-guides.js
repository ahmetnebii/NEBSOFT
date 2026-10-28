/* NEBSOFT entegrasyon kurulum rehberleri — firma / cihaz bazında, kurulum sihirbazından (integ-wizard.js) ayrı tutulan veri.
   Yeni bir firma eklemek için bu listeye bir kayıt eklenir; arayüz değişmez.

   Kayıt: {
     key: '<tür>:<sağlayıcı>' (tür = integrations.js DEFS anahtarı, sağlayıcı = provider/mode değeri)
     name, mark (logo yerine kısa yazı), color, summary,
     status: 'dogrulandi' (resmî dokümandan doğrulandı) | 'genel' (endüstri standardı protokol, markaya özel menü yolu doğrulanmadı)
             | 'erisim' (resmî doküman erişime kapalı / doğrulanamadı) | 'desteklenmiyor',
     method: 'rest' | 'tcp' | 'serial' | 'hid' | 'camera' | 'sdk' | 'oauth',
     verified: 'YYYY-AA-GG' (araştırma tarihi), sources: [{ label, url }],
     prereq: [metin], where: [adım], envs: { test, prod } (varsa),
     fields: [{ name, label, type, required, secret, placeholder, example, help: { what, why, where, format, wrong } }],
     test: { type: 'trendyol' | 'tcp' | 'hid' | 'sms' | 'none', note },
     errors: [{ match (RegExp kaynağı veya durum kodu), title, fix }],
     map(values) → integrations.js ayar nesnesine dönüştürür (isteğe bağlı)
   }
   Kurallar: doğrulanmamış menü yolu yazılmaz; test altyapısı olmayan sağlayıcıda başarı gösterilmez. */
(function () {
  'use strict';
  const G = [];
  const add = (g) => G.push(g);

  // ---------- Trendyol (resmî dokümandan doğrulandı) ----------
  add({
    key: 'pazaryeri:trendyol', name: 'Trendyol', mark: 'ty', color: '#f27a1a', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'Trendyol satıcı API’si: sipariş çekme, stok ve fiyat gönderme. Kimlik doğrulama Basic Authentication (API Key + API Secret) ile yapılır.',
    sources: [{ label: 'Trendyol Developers · Yetkilendirme', url: 'https://developers.trendyol.com/v2.0/docs/authorization' }, { label: 'Trendyol Developers · Başlarken', url: 'https://developers.trendyol.com/tr/v3.0/docs/getting-started-1' }],
    prereq: ['Onaylı bir Trendyol satıcı hesabı', 'Satıcı paneline <b>ana kullanıcı</b> ile giriş (entegrasyon bilgilerini yalnızca ana kullanıcı görür)', 'NEBSOFT’taki ürün barkodlarının Trendyol’daki barkodlarla aynı olması (stok ve sipariş eşleşmesi barkodla yapılır)', 'NEBSOFT sunucusu veya masaüstü uygulaması açık olmalı (istekler tarayıcıdan değil, köprüden gider)'],
    where: ['Trendyol satıcı paneline ana kullanıcı ile giriş yapın.', '<b>Hesap Bilgilerim</b> menüsünden <b>Entegrasyon Bilgileri</b> sayfasını açın.', 'Bu sayfadaki <b>Satıcı ID (Supplier ID)</b>, <b>API Key</b> ve <b>API Secret</b> değerlerini kopyalayıp sonraki adımdaki alanlara yapıştırın.', 'Test (stage) ortamının bilgileri canlı ortamdan <b>farklıdır</b>; hangi ortamı kullandığınızı aşağıdan seçin.'],
    envs: { test: 'Stage (test) ortamı — Trendyol’un test için verdiği ayrı bilgilerle', prod: 'Canlı ortam — gerçek siparişler ve stok' },
    fields: [
      { name: 'sellerId', label: 'Satıcı ID (Supplier ID)', required: true, placeholder: 'ör. 123456', pattern: '^\\d{3,12}$', help: { what: 'Trendyol’daki mağazanızın sayısal kimliği.', why: 'Tüm istek adreslerinde ve User-Agent başlığında kullanılır.', where: 'Satıcı paneli → Hesap Bilgilerim → Entegrasyon Bilgileri.', format: 'Yalnızca rakam.', wrong: 'Yanlış girilirse istekler başka bir satıcı adına yapılmaya çalışılır ve yetki hatası (401) alınır.' } },
      { name: 'apiKey', label: 'API Key', required: true, secret: true, help: { what: 'Satıcı ID’nize özel API kullanıcı anahtarı.', why: 'Basic Authentication’ın kullanıcı adı kısmıdır.', where: 'Satıcı paneli → Hesap Bilgilerim → Entegrasyon Bilgileri.', format: 'Panelde gösterildiği gibi, boşluksuz kopyalayın.', wrong: 'Trendyol 401 “ClientApiAuthenticationException” döndürür.' } },
      { name: 'apiSecret', label: 'API Secret', required: true, secret: true, help: { what: 'API Key ile birlikte kullanılan gizli anahtar.', why: 'Basic Authentication’ın şifre kısmıdır.', where: 'Satıcı paneli → Hesap Bilgilerim → Entegrasyon Bilgileri.', format: 'Panelde gösterildiği gibi, boşluksuz.', wrong: 'Trendyol 401 döndürür. Kimseyle paylaşmayın; sızdığını düşünüyorsanız panelden yenileyin.' } },
      { name: 'stage', label: 'Test (stage) ortamını kullan', type: 'checkbox', help: { what: 'İstekleri Trendyol’un test ortamına gönderir.', why: 'Canlı mağazanızı etkilemeden denemek için.', where: 'Test ortamı bilgileri canlıdan farklıdır.', format: 'Canlı bilgilerle test ortamı seçilirse doğrulama başarısız olur.', wrong: 'Ortam ile bilgiler uyuşmazsa 401 alınır.' } },
      { name: 'integrator', label: 'Entegratör adı (User-Agent)', placeholder: 'SelfIntegration', help: { what: 'Trendyol’a her istekte “SatıcıID - Ad” biçiminde gönderilen tanıtıcı.', why: 'Trendyol, User-Agent içermeyen istekleri 403 ile engeller.', where: 'Kendi yazılımınız için “SelfIntegration” bırakın; bir entegratör firma kullanıyorsanız onun adını yazın.', format: 'Harf ve rakam, en fazla 30 karakter.', wrong: 'Eksik veya hatalı User-Agent 403 hatasına yol açar.' } },
    ],
    test: { type: 'trendyol', note: 'Trendyol’dan son 1 sipariş istenir (salt okuma). Siparişleriniz değişmez.' },
    errors: [
      { match: '401|ClientApiAuthentication', title: 'Kimlik doğrulama başarısız', fix: 'API Key / API Secret ya da Satıcı ID hatalı veya test/canlı ortam karışmış. Bilgileri Entegrasyon Bilgileri sayfasından yeniden kopyalayın ve ortam seçimini kontrol edin.' },
      { match: '403', title: 'API yetkisi / erişim reddedildi', fix: 'User-Agent (entegratör adı) eksik ya da hatalı olabilir; “SelfIntegration” yazıp yeniden deneyin. Sorun sürerse hesabınızın API erişimini Trendyol’a sorun.' },
      { match: '429', title: 'Çok fazla istek', fix: 'Trendyol aynı uç noktaya 10 saniyede en fazla 50 istek kabul eder. Birkaç saniye bekleyip tekrar deneyin.' },
      { match: 'Zaman aşımı', title: 'Zaman aşımı', fix: 'Trendyol yanıt vermedi. İnternet bağlantınızı kontrol edip tekrar deneyin.' },
      { match: 'Bağlantı hatası|ulaşılamadı|fetch', title: 'Trendyol’a erişilemiyor', fix: 'NEBSOFT sunucusu veya masaüstü uygulaması internete çıkamıyor. Güvenlik duvarı / proxy ayarlarını kontrol edin.' },
    ],
    map: (v) => ({ enabled: true, provider: 'trendyol', sellerId: v.sellerId, apiKey: v.apiKey, apiSecret: v.apiSecret, stage: !!v.stage, integrator: v.integrator || '' }),
  });

  // ---------- Hepsiburada ve diğer pazaryerleri: adaptör var/yok, resmî doküman bu sürümde doğrulanmadı ----------
  // ---------- Hepsiburada (geliştirici portalı tarayıcıyla okundu; kullanıcı adı/şifre eşleşmesi dokümanda açık değil) ----------
  add({
    key: 'pazaryeri:hepsiburada', name: 'Hepsiburada', mark: 'hb', color: '#ff6000', status: 'erisim', method: 'rest', verified: '2026-10-27',
    summary: 'Hepsiburada satıcı API’si HTTP Basic Authentication ile korunur. Kendi yazılımınızla bağlanacaksanız Hepsiburada önce test ortamı bilgisi verir; testler başarılı olunca canlı ortam bilgisi verilir. NEBSOFT’un Hepsiburada adaptörü listeleme ve sipariş uç noktalarına bağlanır.',
    sources: [{ label: 'Hepsiburada Developer Portal · Servis anahtarı', url: 'https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&product=api-authentication&version=v1.0&guide=entegratore-servis-anahtari-eklemegoruntuleme&view=guide' }, { label: 'Hepsiburada Developer Portal · Sıkça sorulan sorular', url: 'https://developers.hepsiburada.com/tr/companies/hepsiburada?category=baslangic&product=entegrasyonda-sikca-sorulan-sorular&version=v1.0&guide=sikca-sorulan-sorular&view=guide' }, { label: 'Hepsiburada Developer Portal · Listeleme önemli bilgiler', url: 'https://developers.hepsiburada.com/tr/companies/hepsiburada?category=listeleme&product=listeleme&version=v1&guide=listing-bilgilerini-guncelleme-1&view=guide' }],
    prereq: ['Hepsiburada satıcı hesabı', 'Hepsiburada’dan alınmış API erişim bilgileri: bir <b>entegratör</b> kullanıyorsanız onun servis anahtarı; <b>kendi yazılımınız</b> için Hepsiburada’nın talep üzerine verdiği test ve canlı ortam kullanıcı bilgileri', 'Merchant ID (mağaza kimliği)', 'NEBSOFT sunucusu veya masaüstü uygulaması açık olmalı (istekler köprüden gider)'],
    where: ['<b>Entegratör servis anahtarı:</b> Satıcı panelinde <b>Bilgilerim</b> altından <b>Entegrasyon</b> sayfasına gidin; 2. sekme <b>Entegratör Bilgileri</b>’nde ilgili entegratörü bulup <b>Servis Anahtarı</b> düğmesine tıklayın ve kopyalayın.', 'Anahtarı yenilerseniz (“Yeni servis anahtarı oluşturmak istiyorum”) yeni anahtarı buraya da girmeniz gerekir.', '<b>Kendi yazılımınızla bağlanıyorsanız:</b> Satıcı paneli → <b>Yardım Merkezi</b> → <b>Talepler</b> → <b>Taleplerimi Görüntüle</b> → <b>Yeni talep</b> → <b>API ENTEGRASYON – API Entegratör Yetkilendirme İşlemleri</b>. Hepsiburada önce test ortamı bilgilerini iletir; testleri tamamlayınca aynı yoldan canlı ortam bilgisi istenir.', 'Hangi değerin kullanıcı adı, hangisinin şifre olarak girileceği Hepsiburada’nın size ilettiği bilgilerde yazar; dokümanda genel bir eşleşme verilmediği için burada varsayım yapılmamıştır.'],
    envs: { test: 'Test (SIT) ortamı — adreslerde “-sit” bulunur, Hepsiburada’nın verdiği test kullanıcı bilgileriyle', prod: 'Canlı ortam — adreslerden “-sit” kaldırılır, canlı ortam kullanıcı bilgileriyle' },
    fields: [
      { name: 'sellerId', label: 'Merchant ID', required: true, pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', help: { what: 'Hepsiburada’daki mağazanızın kimliği.', why: 'Listeleme ve sipariş adreslerinde kullanılır.', where: 'Hepsiburada’nın ilettiği entegrasyon bilgileri / satıcı paneli.', format: '36 karakterlik GUID (ör. 3fa85f64-5717-4562-b3fc-2c963f66afa6).', wrong: 'Hepsiburada “Merchant ID is not specified” (400) veya yetki hatası (401) döndürür.' } },
      { name: 'apiKey', label: 'API kullanıcı adı', required: true, secret: true, help: { what: 'Basic Authentication’ın kullanıcı adı kısmı.', why: 'Hepsiburada, istemcinin kullanıcı adı ve şifreyi Authorization başlığında göndermesini ister.', where: 'Hepsiburada’nın size ilettiği entegrasyon bilgileri.', format: 'Olduğu gibi.', wrong: 'Hepsiburada 401 döndürür.' } },
      { name: 'apiSecret', label: 'Şifre / servis anahtarı', required: true, secret: true, help: { what: 'Basic Authentication’ın şifre kısmı.', why: 'Kimlik doğrulama için.', where: 'Entegratör kullanıyorsanız Bilgilerim → Entegrasyon → Entegratör Bilgileri → Servis Anahtarı; kendi yazılımınızda Hepsiburada’nın ilettiği şifre.', format: 'Kopyala düğmesiyle alınan değer, boşluksuz.', wrong: '401; anahtar yenilendiyse eskisi geçersizdir.' } },
      { name: 'stage', label: 'Test (SIT) ortamını kullan', type: 'checkbox', help: { what: 'İstekleri Hepsiburada test ortamına gönderir.', why: 'Kendi entegrasyonunuz önce test ortamında onaylanmalıdır.', where: 'Test bilgileri canlıdan farklıdır.', format: 'Test bilgisiyle işaretli, canlı bilgisiyle işaretsiz.', wrong: 'Ortam ile bilgi uyuşmazsa 401.' } },
      { name: 'integrator', label: 'User-Agent (isteğe bağlı)', placeholder: 'nebsoft_dev', help: { what: 'İsteklerde gönderilen istemci tanıtıcısı.', why: 'Hepsiburada size belirli bir değer bildirdiyse onu kullanın.', where: 'Hepsiburada’nın ilettiği entegrasyon bilgileri.', format: 'Bildirilen değer; boşsa NEBSOFT varsayılanı kullanılır.', wrong: 'Hatalı değer erişim reddine yol açabilir.' } },
    ],
    test: { type: 'hepsiburada', note: 'Hepsiburada’dan 1 listeleme kaydı istenir (salt okuma). Ürün ve stoklarınız değişmez.' },
    errors: [
      { match: 'Merchant ID is not specified', title: 'Merchant ID geçersiz', fix: 'Merchant ID’yi Hepsiburada’nın ilettiği biçimde (36 karakterlik GUID) girin.' },
      { match: '\\b401\\b|\\b403\\b|Yetki|authorization failed', title: 'Kimlik doğrulama başarısız', fix: 'Kullanıcı adı / şifre (servis anahtarı) veya Merchant ID hatalı ya da test/canlı ortam karışmış. Servis anahtarı yenilendiyse yenisini girin.' },
      { match: '\\b429\\b', title: 'Çok fazla istek', fix: 'Hepsiburada listeleme servislerinde mağaza başına dakikada ortalama 240 istek kabul eder. Bir dakika bekleyip tekrar deneyin.' },
      { match: '\\b404\\b', title: 'Uç nokta bulunamadı', fix: 'Merchant ID’yi kontrol edin; adres değiştiyse NEBSOFT desteğine bildirin.' },
      { match: 'Zaman aşımı|Bağlantı hatası|ulaşılamadı|fetch', title: 'Hepsiburada’ya erişilemiyor', fix: 'Sunucunun internet bağlantısını ve güvenlik duvarını kontrol edin.' },
    ],
    map: (v) => ({ enabled: true, provider: 'hepsiburada', sellerId: String(v.sellerId).trim(), apiKey: String(v.apiKey).trim(), apiSecret: String(v.apiSecret).trim(), stage: !!v.stage, integrator: v.integrator || '' }),
  });

  // ---------- n11 (developer.n11.com ve n11 Mağaza Destek Merkezi ile doğrulandı) ----------
  add({
    key: 'pazaryeri:n11', name: 'n11', mark: 'n11', color: '#5d2e8c', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'n11 REST API’si her istekte <b>appKey</b> ve <b>appSecret</b> başlıklarını ister (Authorization kullanılmaz). Bu kurulum anahtarlarınızı gerçek bir ürün sorgusuyla doğrular. Pazaryeri programında n11 kanalı canlı modda sipariş çekme (son 15 gün), fiyat-stok gönderme (1000’lik partiler) ve gönderim sonucu sorgulama yapar; ürünler n11’deki <b>satıcı stok kodu</b> ile eşlenir (NEBSOFT’ta ürünün SKU’su, yoksa barkodu).',
    sources: [{ label: 'n11 Mağaza Destek · API hesaplarına nereden ulaşılır', url: 'https://magazadestek.n11.com/satis-surecleri/api-hesaplarina-nereden-ulasilir-2285' }, { label: 'developer.n11.com · Satıcı ürün sorgulama', url: 'https://developer.n11.com/documentation/n11-marketplace-entegrasyonu/satici-urun-sorgulama/' }, { label: 'developer.n11.com · API hata mesajları', url: 'https://developer.n11.com/documentation/bilgilendirme/api-hata-mesajlari-ve-aciklamalari/' }],
    prereq: ['n11 mağaza hesabı (Satıcı Ofisi)', 'Mağaza hesabına yüklediğiniz evrak süreçlerinin tamamlanmış olması (API anahtarı bundan sonra oluşturulabilir)', 'Mağazaya kayıtlı e-posta adresinize erişim (API şifresi bu adrese gönderilir)'],
    where: ['n11 <b>Satıcı Ofisi</b>’ne (so.n11.com) giriş yapın.', '<b>Hesabım</b> → <b>Api Hesapları</b> sayfasını açın.', '<b>Yeni Hesap Oluştur</b> düğmesine basın; ekranın alt bölümündeki API hesaplarınız arasında <b>API anahtarınız (appKey)</b> oluşur.', '<b>API şifreniz (appSecret)</b> mağazaya kayıtlı e-posta adresinize gönderilir.', 'İkisini sonraki adımdaki alanlara yapıştırın.'],
    fields: [
      { name: 'apiKey', label: 'API anahtarı (appKey)', required: true, secret: true, help: { what: 'n11 API hesabınızın anahtarı.', why: 'Her istekte appKey başlığıyla gönderilir.', where: 'Satıcı Ofisi → Hesabım → Api Hesapları.', format: 'Panelde gösterildiği gibi.', wrong: 'n11 istekleri yetkisiz olarak reddeder.' } },
      { name: 'apiSecret', label: 'API şifresi (appSecret)', required: true, secret: true, help: { what: 'API hesabınızın şifresi.', why: 'Her istekte appSecret başlığıyla gönderilir.', where: 'API hesabı oluşturulunca mağazaya kayıtlı e-posta adresinize gönderilir.', format: 'E-postadaki gibi, boşluksuz.', wrong: 'İstekler yetkisiz olarak reddedilir.' } },
    ],
    test: { type: 'n11', note: 'n11’den ürün listenizin ilk kaydı istenir (GET /ms/product-query, salt okuma). Ürünleriniz değişmez.' },
    errors: [
      { match: '\\b401\\b|\\b403\\b|unauthor|yetki', title: 'Kimlik doğrulama başarısız', fix: 'appKey veya appSecret hatalı. Satıcı Ofisi → Hesabım → Api Hesapları’ndan anahtarı, e-postanızdan şifreyi yeniden kopyalayın; gerekirse yeni API hesabı oluşturun.' },
      { match: '\\b429\\b', title: 'Çok fazla istek', fix: 'Biraz bekleyip tekrar deneyin.' },
      { match: 'Zaman aşımı|Bağlantı hatası|ulaşılamadı|fetch', title: 'n11’e erişilemiyor', fix: 'Sunucunun internet bağlantısını ve güvenlik duvarını kontrol edin.' },
    ],
    map: (v) => ({ enabled: true, provider: 'n11', apiKey: String(v.apiKey).trim(), apiSecret: String(v.apiSecret).trim() }),
  });

  // ---------- Fiş yazıcı (ağ) — ESC/POS ham TCP ----------
  add({
    key: 'printer:network', name: 'Ağ fiş yazıcısı (ESC/POS)', mark: 'IP', color: '#0f766e', status: 'genel', method: 'tcp', verified: '2026-10-27',
    summary: 'Ethernet / Wi-Fi bağlantılı termal fiş yazıcılarına ESC/POS komutları ham TCP ile (genellikle 9100 numaralı port) gönderilir. Yazdırma penceresi açılmaz.',
    sources: [], prereq: ['Yazıcının kasa bilgisayarıyla <b>aynı yerel ağda</b> olması', 'Yazıcıya sabit IP verilmesi (değişirse bağlantı kopar)', 'NEBSOFT masaüstü uygulaması veya yerel sunucu (tarayıcı ağ cihazına doğrudan bağlanamaz)'],
    where: ['Çoğu termal yazıcı, açılışta besleme tuşuna basılı tutulduğunda ayarlarını gösteren bir <b>kendi kendine test (self-test)</b> fişi basar; IP adresi bu fişte yazar. Modelinize özel yöntem için yazıcı kılavuzuna bakın.', 'Modeminizin yönetim sayfasındaki bağlı cihazlar listesinde de yazıcının IP’sini görebilirsiniz.', 'Port çoğu yazıcıda 9100’dür (RAW / JetDirect). Kılavuzunuzda farklı yazıyorsa onu kullanın.'],
    fields: [
      { name: 'host', label: 'Yazıcı IP adresi', required: true, placeholder: '192.168.1.50', pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$', example: '192.168.1.50', help: { what: 'Yazıcının yerel ağdaki adresi.', why: 'Fiş verisi bu adrese gönderilir.', where: 'Self-test fişi veya modem arayüzündeki bağlı cihazlar listesi.', format: 'Dört bölümlü IPv4 adresi, ör. 192.168.1.50', wrong: '“Cihaza erişilemiyor” hatası alırsınız.' } },
      { name: 'port', label: 'Port', type: 'number', placeholder: '9100', example: '9100', help: { what: 'Yazıcının ham veri kabul ettiği TCP portu.', why: 'ESC/POS komutları bu porta yazılır.', where: 'Genellikle 9100; yazıcı kılavuzunda “RAW” veya “Port 9100” olarak geçer.', format: 'Sayı (1–65535).', wrong: 'Bağlantı reddedilir veya zaman aşımı olur.' } },
      { name: 'paper', label: 'Kâğıt genişliği', type: 'select', options: [{ value: 80, label: '80 mm' }, { value: 58, label: '58 mm' }], help: { what: 'Rulo kâğıt genişliği.', why: 'Satır uzunluğu buna göre ayarlanır.', where: 'Yazıcıdaki ruloyu ölçün veya kutusuna bakın.', format: '58 veya 80 mm.', wrong: 'Satırlar kesilir veya kayar.' } },
    ],
    test: { type: 'tcp', note: 'Yazıcıya bağlanılıp bağlantı hemen kapatılır; kâğıt harcanmaz. İsterseniz ardından deneme fişi basabilirsiniz.' },
    errors: [
      { match: 'EINVAL', title: 'Adres kabul edilmedi', fix: 'Yalnızca yerel ağ IP adresleri (192.168.x.x, 10.x.x.x, 172.16–31.x.x) ve 1–65535 arası port girilebilir.' },
      { match: 'ECONNREFUSED|reddetti', title: 'Yazıcı bağlantıyı reddetti', fix: 'Port numarası yanlış olabilir (çoğunlukla 9100). Yazıcının ağ yazdırma özelliğinin açık olduğunu kontrol edin.' },
      { match: 'EHOSTUNREACH|ENETUNREACH|zaman aşımı|Zaman aşımı|ETIMEDOUT', title: 'Cihaza erişilemiyor', fix: 'Yazıcı kapalı, farklı ağda veya IP adresi değişmiş olabilir. Self-test fişindeki IP’yi kontrol edin; modemden yazıcıya sabit IP verin.' },
      { match: 'köprü|Köprü|404', title: 'Yerel bağlantı servisi yok', fix: 'Ağ yazıcısına yalnızca NEBSOFT masaüstü uygulaması veya işletmedeki yerel sunucu bağlanabilir. Masaüstü uygulamasını kurun.' },
    ],
    map: (v) => ({ mode: 'network', host: v.host, port: Number(v.port) || 9100, paper: Number(v.paper) || 80, cols: Number(v.paper) === 58 ? 32 : 48 }),
  });

  // ---------- Barkod okuyucu (USB / Bluetooth HID) ----------
  add({
    key: 'barcode:hid', name: 'USB / Bluetooth barkod okuyucu', mark: '|||', color: '#334155', status: 'genel', method: 'hid', verified: '2026-10-27',
    summary: 'Okuyucular bilgisayara klavye (HID) olarak bağlanır: okutulan barkod, imlecin bulunduğu kutuya yazılır ve sonuna genellikle Enter eklenir. Sürücü gerekmez.',
    sources: [], prereq: ['Okuyucunun takılı (USB) veya eşleştirilmiş (Bluetooth) olması', 'Okuyucunun “klavye / HID” modunda olması (çoğu modelde varsayılan)'],
    where: ['Okuyucuyu takın; bilgisayar onu klavye olarak tanır.', 'Sonraki adımda test kutusuna tıklayıp bir ürün barkodu okutun.', 'Okutunca alt satıra geçilmiyorsa, okuyucunun kılavuzundaki “Enter / CR suffix” ayar barkodunu okutun.'],
    fields: [{ name: 'suffix', label: 'Okuyucunun sonek tuşu', type: 'select', options: [{ value: 'enter', label: 'Enter' }, { value: 'tab', label: 'Tab' }], help: { what: 'Okuyucunun barkoddan sonra gönderdiği tuş.', why: 'Satış ekranı barkodun bittiğini bu tuştan anlar.', where: 'Test adımında otomatik algılanır.', format: 'Enter veya Tab.', wrong: 'Ürün sepete eklenmez, barkod kutuda bekler.' } }],
    test: { type: 'hid', note: 'Kutuya bir barkod okutun; hız ve sonek tuşu ölçülür. Klavyeyle yazılan değer okuyucu olarak sayılmaz.' },
    errors: [{ match: 'yavaş', title: 'Klavye girişi algılandı', fix: 'Değer elle yazılmış gibi yavaş geldi. Okuyucuyla okutun; okuyucu hâlâ yavaşsa kılavuzdaki hız ayarını yükseltin.' }, { match: 'sonek', title: 'Enter gelmedi', fix: 'Okuyucunun kılavuzundaki “Enter/CR suffix” ayar barkodunu okutun veya sonek tuşunu Tab olarak seçin.' }],
    map: (v, h) => ({ suffix: (h && h.suffix) || v.suffix || 'enter' }),
  });

  // ---------- Netgsm SMS (resmî doküman sayfası dinamik; yalnızca resmî GitHub README’den doğrulanan bilgiler) ----------
  add({
    key: 'sms:netgsm', name: 'Netgsm', mark: 'N', color: '#00a0e3', status: 'erisim', method: 'rest', verified: '2026-10-27',
    summary: 'Netgsm SMS API’si kullanıcı kodu, şifre ve onaylı mesaj başlığıyla çalışır. Netgsm’in doküman sayfası bu araştırmada okunamadı; aşağıdakiler Netgsm’in resmî GitHub paketindeki bilgilerle sınırlıdır.',
    sources: [{ label: 'Netgsm API dokümanı', url: 'https://www.netgsm.com.tr/dokuman/' }, { label: 'Netgsm resmî SMS paketi (GitHub)', url: 'https://github.com/netgsm1/sms' }],
    prereq: ['Netgsm aboneliği ve SMS paketi', 'API erişimi açık bir kullanıcı (yetkisiz kullanıcıda 30 kodu döner)', 'Netgsm’de tanımlı ve onaylı bir mesaj başlığı', 'Hesapta IP kısıtlaması varsa NEBSOFT sunucusunun IP’sinin izinli olması'],
    where: ['Kullanıcı kodu ve şifre Netgsm hesabınızın bilgileridir; API kullanıcısı oluşturma menüsü bu sürümde doğrulanmadığı için Netgsm destek ekibine veya dokümana başvurun.', 'Mesaj başlığınızı Netgsm panelinizde tanımlı başlıklar arasından aynen yazın.'],
    fields: [
      { name: 'user', label: 'Kullanıcı kodu', required: true, help: { what: 'Netgsm hesabınızın kullanıcı kodu (usercode).', why: 'API kimlik doğrulaması için.', where: 'Netgsm hesabınız.', format: 'Genellikle rakamlardan oluşur.', wrong: 'Netgsm 30 kodunu döndürür.' } },
      { name: 'pass', label: 'Şifre', required: true, secret: true, help: { what: 'API erişimi olan kullanıcının şifresi.', why: 'API kimlik doğrulaması için.', where: 'Netgsm hesabınız.', format: 'Olduğu gibi.', wrong: 'Netgsm 30 kodunu döndürür.' } },
      { name: 'header', label: 'Mesaj başlığı', required: true, help: { what: 'SMS’in gönderen adı.', why: 'Alıcının gördüğü gönderen adıdır.', where: 'Netgsm panelinizde tanımlı başlıklar.', format: 'Panelde nasıl yazıyorsa öyle (büyük/küçük harf dahil).', wrong: 'Netgsm 40 kodunu döndürür (başlık tanımlı değil).' } },
    ],
    test: { type: 'sms', note: 'Netgsm için ücretsiz doğrulama uç noktası bu sürümde doğrulanmadı. Gerçek test, kendi numaranıza 1 SMS göndererek yapılır (paketinizden düşer).' },
    errors: [{ match: '\\b30\\b', title: 'Kimlik doğrulama başarısız veya API yetkisi yok', fix: 'Kullanıcı kodu/şifre hatalı, kullanıcının API yetkisi yok ya da IP kısıtlaması isteği engelliyor.' }, { match: '\\b40\\b', title: 'Mesaj başlığı tanımlı değil', fix: 'Başlığı Netgsm panelinizdeki tanımlı başlıklarla birebir aynı yazın.' }],
    map: (v) => ({ enabled: true, provider: 'netgsm', user: v.user, pass: v.pass, header: v.header }),
  });

  // ---------- İleti Merkezi SMS (bakiye uç noktası ve hata kodları doğrulandı) ----------
  add({
    key: 'sms:iletimerkezi', name: 'İleti Merkezi', mark: 'İM', color: '#e30613', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'İleti Merkezi SMS API’si JSON/XML ile çalışır; her istekte API anahtarı (key) ve API hash birlikte gönderilir. Bağlantı, ücretsiz bakiye sorgusuyla doğrulanır — SMS harcanmaz.',
    sources: [{ label: 'İleti Merkezi API · Bakiye sorgulama (JSON)', url: 'https://www.toplusmsapi.com/en/hesap/bakiye/json' }, { label: 'İleti Merkezi resmî PHP SDK', url: 'https://github.com/iletimerkezi/iletimerkezi-php' }],
    prereq: ['İleti Merkezi hesabı ve SMS kredisi', 'Panelin <b>ayarlar</b> bölümünde oluşturulmuş API anahtarı ve API hash', 'Onaylı bir gönderici adı (başlık)', 'Hesapta sabit IP tanımlıysa NEBSOFT sunucusunun IP’si (aksi hâlde 401 döner)'],
    where: ['İleti Merkezi paneline giriş yapın.', 'Panelin <b>ayarlar</b> bölümünden <b>API anahtarı</b> ve <b>Secret Key</b> oluşturun; dokümana göre <b>hash</b> bu ikisinden oluşturulur ve yine ayarlar bölümünde verilir.', 'API anahtarını ve hash değerini sonraki adıma yapıştırın. (Ayarlar içindeki alt menü adı resmî dokümanda verilmediği için burada yazılmamıştır.)', 'Gönderici adınızı panelde onaylı başlıklarınız arasından aynen yazın.'],
    fields: [
      { name: 'key', label: 'API anahtarı (key)', required: true, secret: true, help: { what: 'Hesabınıza ait API kullanıcı anahtarı.', why: 'Her istekte kimlik doğrulama için gönderilir.', where: 'İleti Merkezi paneli → ayarlar bölümü.', format: 'Panelde gösterildiği gibi.', wrong: 'İleti Merkezi 401 “Üyelik bilgileri hatalı” döndürür.' } },
      { name: 'hash', label: 'API hash', required: true, secret: true, help: { what: 'API anahtarı ve Secret Key ile oluşturulan doğrulama değeri.', why: 'key ile birlikte gönderilmesi zorunludur.', where: 'İleti Merkezi paneli → ayarlar bölümü.', format: 'Panelde gösterildiği gibi, boşluksuz.', wrong: '401 “Üyelik bilgileri hatalı”.' } },
      { name: 'header', label: 'Gönderici adı (başlık)', required: true, help: { what: 'SMS’te alıcının gördüğü gönderen adı.', why: 'Her SMS bu başlıkla gönderilir.', where: 'Panelinizdeki onaylı başlıklar.', format: 'Onaylı başlıkla birebir aynı.', wrong: 'Gönderim reddedilir; bakiye testi başlığı kontrol etmez.' } },
    ],
    test: { type: 'iletimerkezi', note: 'İleti Merkezi’ne bakiye sorgusu yapılır (get-balance). SMS gönderilmez, kredi harcanmaz.' },
    errors: [
      { match: '\\b401\\b|Üyelik', title: 'Kimlik doğrulama başarısız', fix: 'API anahtarı veya hash hatalı ya da hesabınızda tanımlı sabit IP, NEBSOFT sunucusunun IP’si değil. Bilgileri ayarlar bölümünden yeniden kopyalayın, IP kısıtını kontrol edin.' },
      { match: '\\b400\\b', title: 'İstek çözümlenemedi', fix: 'Girilen değerlerde geçersiz karakter olabilir. Kopyalarken baş/son boşlukları silin.' },
      { match: '\\b404\\b', title: 'Uç nokta bulunamadı', fix: 'İleti Merkezi adresi değişmiş olabilir; NEBSOFT desteğine bildirin.' },
      { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'İleti Merkezi’ne erişilemiyor', fix: 'Sunucunun internet bağlantısını ve güvenlik duvarını kontrol edin.' },
    ],
    map: (v) => ({ enabled: true, provider: 'iletimerkezi', key: v.key, hash: v.hash, header: v.header }),
  });

  // ---------- Verimor SMS (resmî GitHub dokümanıyla doğrulandı) ----------
  add({
    key: 'sms:verimor', name: 'Verimor', mark: 'V', color: '#1f6feb', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'Verimor SMS API’si kullanıcı adı (12 haneli telefon numaranız) ve ayrı bir API şifresiyle çalışır; sunucu IP’sinin izinli olması gerekir. Bağlantı ücretsiz bakiye ve başlık sorgusuyla doğrulanır.',
    sources: [{ label: 'Verimor SMS API dokümanı (GitHub)', url: 'https://github.com/verimor/SMS-API/blob/master/user_guide.md' }, { label: 'Verimor OİM · SMS Ayarlarım', url: 'https://oim.verimor.com.tr/sms_settings/edit' }],
    prereq: ['Verimor SMS hesabı ve kredi', 'OİM’de <b>SMS Ayarlarım</b> sayfasında oluşturulmuş <b>API şifresi</b> (panel giriş şifrenizden farklıdır)', 'Aynı sayfada NEBSOFT sunucusunun IP adresinin <b>izinli IP</b> olarak girilmesi — girilmezse “Hesabınızda izinli IP ayarları yapılmamış” (401) hatası alınır', 'Hesabınızda kayıtlı en az bir SMS başlığı'],
    where: ['Verimor Online İşlem Merkezi’ne (OİM) giriş yapın.', '<b>SMS Ayarlarım</b> sayfasını açın: <a href="https://oim.verimor.com.tr/sms_settings/edit" target="_blank" rel="noopener">oim.verimor.com.tr/sms_settings/edit</a>', 'Bu sayfada bir <b>API şifresi</b> belirleyin ve NEBSOFT sunucunuzun IP adresini <b>izinli IP</b> listesine ekleyin.', 'Kullanıcı adınız 12 haneli telefon numaranızdır (ör. 908501234567).'],
    envs: null,
    fields: [
      { name: 'user', label: 'Kullanıcı adı', required: true, placeholder: '908501234567', pattern: '^90\\d{10}$', example: '908501234567', help: { what: 'Verimor hesabınızın kullanıcı adı: 12 haneli telefon numaranız.', why: 'API kimlik doğrulaması için.', where: 'Verimor hesabınızın numarası.', format: '90 ile başlayan 12 hane, boşluksuz.', wrong: '401 “Geçersiz kullanıcı adı/şifre”.' } },
      { name: 'pass', label: 'API şifresi', required: true, secret: true, help: { what: 'Yalnızca API için belirlenen şifre (OİM giriş şifresi değil).', why: 'API kimlik doğrulaması için.', where: 'OİM → SMS Ayarlarım.', format: 'Belirlediğiniz gibi.', wrong: '401 “Geçersiz kullanıcı adı/şifre”.' } },
      { name: 'header', label: 'SMS başlığı', placeholder: 'Boşsa ilk kayıtlı başlık kullanılır', help: { what: 'SMS’te görünen gönderen adı.', why: 'Birden çok başlığınız varsa hangisinin kullanılacağını belirler.', where: 'Test adımında hesabınızdaki başlıklar listelenir.', format: 'Kayıtlı başlıkla birebir aynı.', wrong: 'Gönderimde 400 INVALID_SOURCE_ADDRESS hatası.' } },
    ],
    test: { type: 'verimor', note: 'Verimor’dan kalan kredi ve kayıtlı başlıklarınız sorgulanır. SMS gönderilmez.' },
    errors: [
      { match: 'izinli IP', title: 'Sunucu IP’si izinli değil', fix: 'OİM → SMS Ayarlarım sayfasında NEBSOFT sunucusunun IP adresini izinli IP listesine ekleyin.' },
      { match: '\\b401\\b|Geçersiz kullanıcı', title: 'Kimlik doğrulama başarısız', fix: 'Kullanıcı adı 12 haneli numaranız olmalı (90 ile başlar) ve şifre, OİM → SMS Ayarlarım’da belirlediğiniz API şifresi olmalıdır.' },
      { match: 'başlık', title: 'Başlık hesabınızda yok', fix: 'Yazdığınız başlık hesabınızdaki başlıklar arasında yok. Test sonucundaki listeden birini aynen yazın.' },
      { match: '\\b429\\b', title: 'Çok fazla istek', fix: 'Verimor istek sınırı aşıldı; biraz bekleyip tekrar deneyin.' },
      { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'Verimor’a erişilemiyor', fix: 'Sunucunun internet bağlantısını ve güvenlik duvarını kontrol edin.' },
    ],
    map: (v) => ({ enabled: true, provider: 'verimor', user: v.user, pass: v.pass, header: v.header || '' }),
  });

  // ---------- WhatsApp Business Cloud API (Meta) ----------
  add({
    key: 'whatsapp:cloud', name: 'WhatsApp Cloud API', mark: 'WA', color: '#25d366', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'Meta’nın WhatsApp Business Cloud API’si ile mesajlar otomatik gönderilir. İstekler telefon numarası kimliği (Phone number ID) ve Bearer erişim jetonuyla yapılır. Bağlantı, numaranın bilgileri okunarak doğrulanır — mesaj gönderilmez.',
    sources: [{ label: 'Meta · WhatsApp Cloud API başlarken', url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started' }, { label: 'Meta · Erişim jetonları rehberi', url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/' }, { label: 'Meta · İşletme telefon numaraları', url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers' }],
    prereq: ['Meta işletme hesabı (Business Manager) ve WhatsApp kullanım senaryolu bir Meta uygulaması', 'Uygulamaya eklenmiş bir işletme telefon numarası', 'Kalıcı erişim jetonu için bir <b>sistem kullanıcısı</b> (paneldeki geçici jeton kısa sürede geçersiz olur)', '24 saatlik müşteri hizmeti penceresi dışında yalnızca Meta’nın onayladığı <b>şablon mesajlar</b> gönderilebilir'],
    where: ['<b>App Dashboard → WhatsApp → API Setup</b> sayfasını açın; <b>Phone number ID</b> değerini buradan kopyalayın. Bu sayfadaki erişim jetonu geçicidir — yalnızca denemek için kullanın.', 'Kalıcı jeton için <b>Business Settings</b> (İşletme Ayarları) → <b>System users</b> bölümünde bir sistem kullanıcısı oluşturun.', 'Sistem kullanıcısına <b>Assign Assets</b> ile uygulamanızı (<b>Manage app</b>, tam kontrol) ve WhatsApp hesabınızı (<b>Manage WhatsApp Business accounts</b>, tam kontrol) atayın.', '<b>Generate token</b> ile jeton üretirken <b>business_management</b>, <b>whatsapp_business_messaging</b> ve <b>whatsapp_business_management</b> izinlerini seçin; süre tercihi olarak süresiz/uzun seçeneği seçin.', 'Jetonu ve Phone number ID’yi sonraki adıma yapıştırın.'],
    envs: { test: 'Meta’nın verdiği test numarası (yalnızca kayıtlı alıcılara gönderir)', prod: 'Kendi işletme numaranız' },
    fields: [
      { name: 'phoneId', label: 'Phone number ID', required: true, pattern: '^\\d{6,25}$', placeholder: 'ör. 106540352242922', help: { what: 'Mesajı gönderecek işletme numaranızın Meta’daki sayısal kimliği (telefon numarasının kendisi değil).', why: 'Mesajlar /PHONE_NUMBER_ID/messages adresine gönderilir.', where: 'App Dashboard → WhatsApp → API Setup.', format: 'Yalnızca rakam.', wrong: 'Meta “nesne bulunamadı / izin yok” hatası döndürür.' } },
      { name: 'token', label: 'Erişim jetonu (access token)', required: true, secret: true, help: { what: 'İsteklerin Authorization: Bearer başlığında gönderilen jeton.', why: 'Meta, isteğin işletmenize ait olduğunu bununla doğrular.', where: 'Kalıcı jeton: Business Settings → System users → Generate token. Geçici jeton: API Setup sayfası.', format: 'Uzun bir metin; başına “Bearer” yazmayın.', wrong: 'Geçersiz veya süresi dolmuş jetonda Meta 190 kodlu hata döndürür; asset ataması eksikse 200 kodlu izin hatası döner.' } },
      { name: 'version', label: 'Graph API sürümü', placeholder: 'v23.0', pattern: '^v\\d{2}\\.\\d$', help: { what: 'İsteklerin gönderileceği Meta Graph API sürümü.', why: 'Eski sürümler belirli bir süre sonra kapatılır.', where: 'Meta dokümanlarındaki güncel sürüm.', format: 'v23.0 biçiminde.', wrong: 'Kapatılmış bir sürümde istekler başarısız olur.' } },
      { name: 'template', label: 'Onaylı şablon adı (isteğe bağlı)', help: { what: 'Meta’nın onayladığı mesaj şablonunun adı.', why: '24 saat penceresi dışındaki mesajlarda zorunludur.', where: 'WhatsApp Manager → mesaj şablonları.', format: 'Şablon adı, küçük harf ve alt çizgi.', wrong: 'Boş bırakılırsa serbest metin gönderilir; pencere dışındaysa Meta reddeder.' } },
    ],
    test: { type: 'whatsapp', note: 'Meta’dan bu telefon numarasının adı, görünen numarası ve kalite puanı okunur. Mesaj gönderilmez.' },
    errors: [
      { match: '"code"\\s*:\\s*190|OAuthException.*expired|Session has expired|Invalid OAuth', title: 'Erişim jetonu geçersiz veya süresi dolmuş', fix: 'API Setup sayfasındaki geçici jeton kısa sürede geçersiz olur. Sistem kullanıcısıyla kalıcı jeton üretip yeniden girin.' },
      { match: '"code"\\s*:\\s*(200|10)\\b|permission', title: 'API yetkisi eksik', fix: 'Sistem kullanıcısına uygulamayı ve WhatsApp hesabını Assign Assets ile atayın; jetonu whatsapp_business_messaging ve whatsapp_business_management izinleriyle yeniden üretin.' },
      { match: '"code"\\s*:\\s*100|does not exist|Unsupported get request', title: 'Phone number ID bulunamadı', fix: 'Telefon numarasının kendisini değil, API Setup sayfasındaki Phone number ID değerini girin; jetonun bu numaraya erişimi olduğundan emin olun.' },
      { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'Meta’ya erişilemiyor', fix: 'Sunucunun internet bağlantısını ve güvenlik duvarını kontrol edin.' },
    ],
    map: (v) => ({ mode: 'cloud', phoneId: String(v.phoneId).trim(), token: String(v.token).trim(), version: v.version || 'v23.0', template: v.template || '' }),
  });

  // ---------- Paraşüt (apidocs.parasut.com, API v4) ----------
  add({
    key: 'efatura:parasut', name: 'Paraşüt', mark: 'P', color: '#0bb07b', status: 'dogrulandi', method: 'oauth', verified: '2026-10-27',
    limit: 'Bağlantı ve yetki doğrulanır, bilgiler saklanır. Faturanın Paraşüt üzerinden e-Fatura / e-Arşiv olarak gönderilmesi bu sürümde henüz yok; satışta fatura kesilmez ve sistem bunu açıkça bildirir.',
    summary: 'Paraşüt API v4 OAuth2 ile çalışır. NEBSOFT “password” yöntemini kullanır: uygulama kimliği (client id / secret) ve Paraşüt e-posta / şifrenizle 2 saat geçerli bir erişim jetonu alınır. İstekler https://api.parasut.com/v4/<firma_no> altına yapılır; 10 saniyede en fazla 10 istek kabul edilir.',
    sources: [{ label: 'Paraşüt API v4 dokümanı', url: 'https://apidocs.parasut.com/' }],
    prereq: ['Paraşüt hesabı ve e-Fatura / e-Arşiv hizmeti', '<b>CLIENT_ID</b> ve <b>CLIENT_SECRET</b>: Paraşüt’e <a href="mailto:destek@parasut.com">destek@parasut.com</a> adresinden e-posta atarak alınır', 'Paraşüt’e giriş yaptığınız e-posta ve şifre (jeton almak için)'],
    where: ['<a href="mailto:destek@parasut.com">destek@parasut.com</a> adresine e-posta atıp API erişimi için <b>CLIENT_ID</b> ve <b>CLIENT_SECRET</b> isteyin.', 'Yönlendirme adresi (REDIRECT_URL) olarak varsayılan <code>urn:ietf:wg:oauth:2.0:oob</code> kullanılır; NEBSOFT için ayrıca tanımlatmanız gerekmez.', 'Paraşüt’e giriş yaptığınız e-posta ve şifreyi sonraki adıma girin.', '<b>Firma numarası</b>nı bilmiyorsanız boş bırakın; bağlantı testinde hesabınızdaki firmalar listelenir.'],
    fields: [
      { name: 'clientId', label: 'CLIENT_ID', required: true, secret: true, help: { what: 'Paraşüt’ün size verdiği uygulama kimliği.', why: 'OAuth2 jetonu alırken gönderilir.', where: 'destek@parasut.com’dan talep edilir.', format: 'E-postadaki gibi.', wrong: 'Paraşüt “invalid_client” hatası döndürür.' } },
      { name: 'clientSecret', label: 'CLIENT_SECRET', required: true, secret: true, help: { what: 'Uygulama kimliğinin gizli anahtarı.', why: 'OAuth2 jetonu alırken gönderilir.', where: 'destek@parasut.com’dan talep edilir.', format: 'E-postadaki gibi.', wrong: '“invalid_client”.' } },
      { name: 'user', label: 'Paraşüt e-posta adresi', required: true, help: { what: 'Paraşüt’e giriş yaptığınız e-posta.', why: '“password” yöntemiyle jeton alınırken kullanılır.', where: 'Kendi Paraşüt hesabınız.', format: 'ornek@firma.com', wrong: '“invalid_grant” hatası.' } },
      { name: 'pass', label: 'Paraşüt şifresi', required: true, secret: true, help: { what: 'Paraşüt giriş şifreniz.', why: 'Jeton almak için.', where: 'Kendi Paraşüt hesabınız.', format: 'Olduğu gibi.', wrong: '“invalid_grant” hatası.' } },
      { name: 'companyId', label: 'Firma numarası (isteğe bağlı)', pattern: '^\\d*$', help: { what: 'Firmanızın Paraşüt veritabanındaki kayıt numarası.', why: 'Tüm istek adresleri /v4/<firma_no>/… biçimindedir.', where: 'Boş bırakırsanız test adımında hesabınızdaki firmalar listelenir.', format: 'Yalnızca rakam.', wrong: 'İstekler 403/404 döner.' } },
    ],
    test: { type: 'parasut', note: 'Jeton alınır ve /me ile kullanıcı ve firma bilgileri okunur. Hiçbir kayıt oluşturulmaz.' },
    errors: [
      { match: 'invalid_client', title: 'Uygulama kimliği hatalı', fix: 'CLIENT_ID / CLIENT_SECRET hatalı. destek@parasut.com’un ilettiği değerleri yeniden kopyalayın.' },
      { match: 'invalid_grant', title: 'E-posta veya şifre hatalı', fix: 'Paraşüt’e giriş yaptığınız e-posta ve şifreyi kontrol edin.' },
      { match: 'firma', title: 'Firma numarası bu hesapta yok', fix: 'Test sonucunda listelenen firma numaralarından birini girin veya alanı boş bırakın.' },
      { match: '\\b429\\b', title: 'Çok fazla istek', fix: 'Paraşüt 10 saniyede 10 istek kabul eder; biraz bekleyip tekrar deneyin.' },
      { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'Paraşüt’e erişilemiyor', fix: 'Sunucunun internet bağlantısını kontrol edin.' },
    ],
    map: (v) => ({ provider: 'parasut', clientId: v.clientId, clientSecret: v.clientSecret, user: v.user, pass: v.pass, companyId: v.companyId || '' }),
  });

  // ---------- Online ödeme ----------
  const PAYLIMIT = 'Anahtarlar doğrulanır ve saklanır. Müşteriye açık sayfalarda kartla ödeme alma (ödeme formu oluşturma ve sonuç bildirimi) bu sürümde henüz yoktur; o zamana kadar ödeme demo olarak çalışır.';
  add({
    key: 'payment:iyzico', name: 'iyzico', mark: 'iy', color: '#1e64ff', status: 'dogrulandi', method: 'rest', verified: '2026-10-27', limit: PAYLIMIT,
    summary: 'iyzico API’si her istekte IYZWSv2 imzalı Authorization başlığı ister: HMACSHA256(rastgele anahtar + adres yolu + istek gövdesi, gizli anahtar). Sandbox ve canlı ortamın anahtarları ve adresleri farklıdır.',
    sources: [{ label: 'iyzico · Sandbox', url: 'https://docs.iyzico.com/on-hazirliklar/sandbox' }, { label: 'iyzico · HMACSHA256 kimlik doğrulama', url: 'https://docs.iyzico.com/on-hazirliklar/kimlik-dogrulama/hmacsha256-kimlik-dogrulama' }],
    prereq: ['iyzico üye işyeri hesabı (canlı) veya ücretsiz sandbox hesabı (test)', 'API Anahtarı ve Güvenlik Anahtarı'],
    where: ['Test için <a href="https://sandbox-merchant.iyzipay.com/auth/register" target="_blank" rel="noopener">sandbox-merchant.iyzipay.com</a> adresinden sandbox hesabı açın.', 'Panelde <b>Ayarlar → Firma Ayarları</b> sayfasını açın.', '<b>API Anahtarları</b> bölümünde <b>Görüntüle</b>’ye tıklayın; <b>API Anahtarı</b> ve <b>Güvenlik Anahtarı</b>’nı kopyalayın.', 'Canlı anahtarlar canlı üye işyeri panelinizde yer alır; canlıya geçince “Sandbox” işaretini kaldırın.'],
    envs: { test: 'sandbox-api.iyzipay.com — sandbox anahtarlarıyla', prod: 'api.iyzipay.com — canlı anahtarlarla' },
    fields: [
      { name: 'apiKey', label: 'API Anahtarı', required: true, secret: true, help: { what: 'Üye işyerinizin API anahtarı.', why: 'İmzalı başlıkta apiKey olarak gönderilir.', where: 'Ayarlar → Firma Ayarları → API Anahtarları → Görüntüle.', format: 'Panelde gösterildiği gibi.', wrong: 'iyzico kimlik doğrulama hatası döndürür.' } },
      { name: 'secret', label: 'Güvenlik Anahtarı (secret key)', required: true, secret: true, help: { what: 'İmzayı üretmekte kullanılan gizli anahtar.', why: 'HMACSHA256 imzası bununla hesaplanır; isteklerde kendisi gönderilmez.', where: 'Ayarlar → Firma Ayarları → API Anahtarları → Görüntüle.', format: 'Panelde gösterildiği gibi.', wrong: 'İmza doğrulanamaz.' } },
      { name: 'sandbox', label: 'Sandbox (test) ortamı', type: 'checkbox', help: { what: 'İstekleri iyzico test ortamına gönderir.', why: 'Gerçek kartla çekim yapmadan denemek için.', where: 'Sandbox anahtarlarıyla işaretli, canlı anahtarlarla işaretsiz kullanın.', format: '—', wrong: 'Ortam ile anahtar uyuşmazsa kimlik doğrulama başarısız olur.' } },
    ],
    test: { type: 'iyzico', note: 'iyzico’ya imzalı BIN sorgusu gönderilir (POST /payment/bin/check, örnek BIN 535805). Ödeme alınmaz.' },
    errors: [{ match: 'yer tutucu', title: 'Anahtarları yeniden girin', fix: 'Güvenlik için kayıtlı anahtarlar tarayıcıya gönderilmez; iyzico imzası tarayıcıda hesaplandığından testi yapmak için API Anahtarı ve Güvenlik Anahtarı’nı bu adımda yeniden yazın.' }, { match: 'failure|1000|1001|api|Api', title: 'Kimlik doğrulama başarısız', fix: 'API Anahtarı / Güvenlik Anahtarı hatalı ya da sandbox–canlı ortam karışmış.' }, { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'iyzico’ya erişilemiyor', fix: 'Sunucunun internet bağlantısını kontrol edin.' }],
    map: (v) => ({ provider: 'iyzico', apiKey: v.apiKey, secret: v.secret, sandbox: !!v.sandbox }),
  });
  add({
    key: 'payment:stripe', name: 'Stripe', mark: 'S', color: '#635bff', status: 'dogrulandi', method: 'rest', verified: '2026-10-27', limit: PAYLIMIT,
    summary: 'Stripe API’si gizli anahtar veya kısıtlı anahtarla (Basic / Bearer) çalışır. Sandbox anahtarları sk_test_ / rk_test_, canlı anahtarlar sk_live_ / rk_live_ ile başlar. Stripe yeni kullanımlarda kısıtlı anahtar (RAK) önerir.',
    sources: [{ label: 'Stripe · API keys', url: 'https://docs.stripe.com/keys' }, { label: 'Stripe · Retrieve balance', url: 'https://docs.stripe.com/api/balance/balance_retrieve' }],
    prereq: ['Stripe hesabı (Türkiye’deki işletmeler için Stripe hesabı açılabilirliğini Stripe’tan kontrol edin)', 'Gizli anahtar veya bakiye okuma izni olan kısıtlı anahtar'],
    where: ['Stripe Dashboard’da <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener">API keys</a> sayfasını açın.', 'Önerilen: <b>Restricted keys</b> altında yalnızca gereken izinlerle kısıtlı anahtar (RAK) oluşturun.', 'Ya da <b>Create secret key</b> ile gizli anahtar oluşturun; canlı modda anahtar yalnızca bir kez gösterilir, hemen kopyalayın.', 'Test için sandbox, gerçek ödemeler için live mode anahtarlarını kullanın.'],
    envs: { test: 'Sandbox — sk_test_ / rk_test_ anahtarları', prod: 'Live mode — sk_live_ / rk_live_ anahtarları' },
    fields: [{ name: 'secret', label: 'Gizli / kısıtlı anahtar', required: true, secret: true, pattern: '^(sk|rk)_(test|live)_[A-Za-z0-9]+$', help: { what: 'Sunucu tarafında kullanılan Stripe anahtarı.', why: 'Stripe API isteklerinin kimliği.', where: 'Dashboard → API keys.', format: 'sk_test_…, sk_live_…, rk_test_… veya rk_live_… ile başlar. Yayınlanabilir anahtar (pk_) kabul edilmez.', wrong: 'Stripe kimlik doğrulama hatası döndürür.' } }],
    test: { type: 'stripe', note: 'Stripe’tan hesap bakiyesi okunur (GET /v1/balance). Ödeme alınmaz.' },
    errors: [{ match: '\\b401\\b|Invalid API Key|authentication', title: 'Anahtar geçersiz', fix: 'Anahtarı Dashboard → API keys’ten yeniden kopyalayın; süresi dolmuş ya da döndürülmüş olabilir.' }, { match: '\\b403\\b|permission', title: 'Anahtarın yetkisi yok', fix: 'Kısıtlı anahtara bakiye okuma (Balance: Read) izni verin.' }, { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'Stripe’a erişilemiyor', fix: 'Sunucunun internet bağlantısını kontrol edin.' }],
    map: (v) => ({ provider: 'stripe', secret: v.secret, apiKey: '', sandbox: /_test_/.test(v.secret) }),
  });
  add({ key: 'payment:paytr', name: 'PayTR', mark: 'PT', color: '#0aa1dd', status: 'erisim', method: 'rest', verified: '2026-10-27', limit: PAYLIMIT,
    summary: 'PayTR entegrasyonu mağaza numarası (merchant_id), mağaza parolası (merchant_key) ve mağaza gizli anahtarı (merchant_salt) ile imzalanan isteklerle çalışır (resmî kod örneklerinde bu üç değer kullanılır). Bu değerlerin PayTR panelindeki menü yolu resmî dokümandan doğrulanamadı.',
    sources: [{ label: 'PayTR geliştirici dokümanı', url: 'https://dev.paytr.com/' }], prereq: ['PayTR mağaza hesabı', 'Mağaza No, Mağaza Parola ve Mağaza Gizli Anahtar'], where: ['Bu üç değer PayTR mağaza panelinizdedir; tam menü yolu doğrulanmadığı için PayTR destek ekibine veya panelinizdeki entegrasyon bilgilerine bakın.'], fields: [], test: { type: 'none', note: 'PayTR için ödeme oluşturmadan yapılabilen doğrulanmış bir test isteği bulunmadı.' }, errors: [] });
  add({ key: 'payment:param', name: 'Param', mark: 'PR', color: '#00a19a', status: 'erisim', method: 'sdk', verified: '2026-10-27', limit: PAYLIMIT,
    summary: 'Param POS servisleri SOAP ile çalışır; isteklerde CLIENT_CODE, CLIENT_USERNAME, CLIENT_PASSWORD ve GUID bilgileri gönderilir. Bu bilgiler Param tarafından verilir. Test ortamı için sunucunuzun sabit çıkış IP’sinin integration@param.com.tr adresine bildirilmesi gerekir. Param’ın geliştirici sitesi bu araştırmada erişime kapalıydı; ayrıntılar arama sonuçlarındaki resmî sayfa özetlerinden alınmıştır.',
    sources: [{ label: 'Param geliştirici dokümanı', url: 'https://dev.param.com.tr/' }], prereq: ['Param üye işyeri sözleşmesi', 'Param’ın ilettiği CLIENT_CODE, CLIENT_USERNAME, CLIENT_PASSWORD ve GUID', 'Test ortamı için sunucu IP’sinin integration@param.com.tr’ye bildirilmesi'], where: ['Kimlik bilgileri Param tarafından iletilir; Param entegrasyon ekibiyle (integration@param.com.tr) iletişime geçin.'], fields: [], test: { type: 'none', note: 'NEBSOFT’ta Param SOAP bağlantısı henüz yok.' }, errors: [] });

  // ---------- Twilio ve Mutlucell SMS ----------
  add({
    key: 'sms:twilio', name: 'Twilio', mark: 'Tw', color: '#f22f46', status: 'dogrulandi', method: 'rest', verified: '2026-10-27',
    summary: 'Twilio API’si Account SID ve Auth Token ile HTTP Basic kimlik doğrulama kullanır. Bağlantı, hesap bilgisi okunarak ücretsiz doğrulanır.',
    sources: [{ label: 'Twilio · Account resource', url: 'https://www.twilio.com/docs/iam/api/account' }],
    prereq: ['Twilio hesabı', 'SMS gönderebilen bir Twilio numarası', 'Deneme (Trial) hesaplarda yalnızca doğrulanmış numaralara gönderim yapılabilir'],
    where: ['<a href="https://www.twilio.com/console" target="_blank" rel="noopener">twilio.com/console</a> adresinde hesabınızın <b>Account SID</b> değerini bulun.', 'Aynı hesabın <b>Auth Token</b> değerini kopyalayın (Twilio, yerel testler için Account SID + Auth Token kullanılabileceğini belirtir).', 'Gönderen olarak Twilio numaranızı +90… / +1… biçiminde yazın.'],
    fields: [
      { name: 'sid', label: 'Account SID', required: true, pattern: '^AC[0-9a-fA-F]{32}$', help: { what: 'Twilio hesabınızın kimliği.', why: 'İstek adresinde ve kimlik doğrulamada kullanılır.', where: 'twilio.com/console.', format: 'AC ile başlayan 34 karakter.', wrong: 'Twilio 401 / 404 döndürür.' } },
      { name: 'token', label: 'Auth Token', required: true, secret: true, help: { what: 'Hesabın gizli anahtarı.', why: 'Basic kimlik doğrulamanın şifre kısmıdır.', where: 'Twilio Console, hesap bilgileri.', format: 'Olduğu gibi.', wrong: 'Twilio 401 döndürür.' } },
      { name: 'from', label: 'Gönderen numara', required: true, placeholder: '+15017122661', pattern: '^\\+\\d{8,15}$', help: { what: 'SMS’i gönderecek Twilio numaranız.', why: 'Twilio’da From alanıdır.', where: 'Twilio hesabınızdaki numaralar.', format: '+ ile başlayan uluslararası biçim.', wrong: 'Gönderim reddedilir (bağlantı testi bunu kontrol etmez).' } },
    ],
    test: { type: 'twilio', note: 'Twilio’dan hesap bilgisi okunur (durum ve tür). SMS gönderilmez.' },
    errors: [{ match: '\\b401\\b|Authenticate|20003', title: 'Kimlik doğrulama başarısız', fix: 'Account SID veya Auth Token hatalı.' }, { match: '\\b404\\b', title: 'Hesap bulunamadı', fix: 'Account SID’i Console’dan yeniden kopyalayın.' }, { match: 'suspended|closed', title: 'Hesap aktif değil', fix: 'Twilio hesabınız askıya alınmış veya kapatılmış.' }, { match: 'ulaşılamadı|Bağlantı|fetch|Zaman', title: 'Twilio’ya erişilemiyor', fix: 'Sunucunun internet bağlantısını kontrol edin.' }],
    map: (v) => ({ enabled: true, provider: 'twilio', sid: v.sid, token: v.token, from: v.from }),
  });
  add({
    key: 'sms:mutlucell', name: 'Mutlucell', mark: 'M', color: '#e4002b', status: 'erisim', method: 'rest', verified: '2026-10-27',
    summary: 'Mutlucell SMS ağ geçidi XML ile veri alır. Resmî API dokümanına bu araştırmada ulaşılamadığı için ücretsiz bir doğrulama uç noktası kullanılmaz; gerçek test kendi numaranıza 1 SMS göndererek yapılır.',
    sources: [{ label: 'Mutlucell resmî PHP kütüphanesi', url: 'https://packagist.org/packages/mutlucell/api' }],
    prereq: ['Mutlucell hesabı ve SMS kredisi', 'Kullanıcı adı, şifre ve onaylı başlık'], where: ['Kullanıcı adı ve şifre Mutlucell hesabınızın bilgileridir; API erişimi ve başlık tanımı için Mutlucell destek ekibine başvurun.'],
    fields: [
      { name: 'user', label: 'Kullanıcı adı', required: true, help: { what: 'Mutlucell kullanıcı adınız.', why: 'Kimlik doğrulama için.', where: 'Mutlucell hesabınız.', format: 'Olduğu gibi.', wrong: 'Gönderim reddedilir.' } },
      { name: 'pass', label: 'Şifre', required: true, secret: true, help: { what: 'Mutlucell şifreniz.', why: 'Kimlik doğrulama için.', where: 'Mutlucell hesabınız.', format: 'Olduğu gibi.', wrong: 'Gönderim reddedilir.' } },
      { name: 'header', label: 'Başlık', required: true, help: { what: 'Onaylı gönderici adı.', why: 'Alıcının gördüğü gönderen.', where: 'Mutlucell hesabınızdaki başlıklar.', format: 'Birebir aynı.', wrong: 'Gönderim reddedilir.' } },
    ],
    test: { type: 'sms', note: 'Kendi numaranıza 1 SMS gönderilir (kredinizden düşer).' }, errors: [],
    map: (v) => ({ enabled: true, provider: 'mutlucell', user: v.user, pass: v.pass, header: v.header }),
  });

  // ---------- Kargo firmaları: herkese açık takip sayfası (gerçek) · gönderi oluşturma API'si sözleşmeyle verilir (yok) ----------
  // Takip adresleri 27–28.10.2026'da firmaların sitesinde örnek numarayla tek tek denendi.
  [
    ['yurtici', 'Yurtiçi Kargo', '#003d7d', 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula', true, 'Servis kullanıcı adı ve şifresi sözleşmeli müşterilere Yurtiçi Kargo şubesine başvuru üzerine verilir; resmî doküman herkese açık değil.'],
    ['aras', 'Aras Kargo', '#cc0000', 'https://kargotakip.araskargo.com.tr', true, 'Aras Kargo gönderi servisleri müşteri kodu, kullanıcı adı ve şifreyle çalışır; bu bilgiler sözleşme üzerinden tanımlanır, resmî doküman herkese açık değil.'],
    ['surat', 'Sürat Kargo', '#e30613', 'https://suratkargo.com.tr/KargoTakip/', true, 'Sürat Kargo servis bilgileri sözleşmeli müşterilere verilir; resmî doküman herkese açık değil.'],
    ['hepsijet', 'HepsiJet', '#ff6000', 'https://www.hepsijet.com', true, 'HepsiJet entegrasyon servisleri X-Auth-Token başlığıyla çalışır (Hepsiburada Developer Portal); jetonun alınma yöntemi bu araştırmada bulunamadı.'],
    ['ups', 'UPS', '#351c15', 'https://www.ups.com/track?loc=tr_TR', true, 'UPS gönderi oluşturma API’si UPS Developer Portal’da hesap ve uygulama kaydıyla verilir; bu sürümde bağlı değil.'],
    ['mng', 'MNG / DHL eCommerce', '#ffcc00', 'https://www.dhlecommerce.com.tr/gonderitakip', false, 'MNG Kargo (yeni adıyla DHL eCommerce) API’si istemci kimliği / gizli anahtarla jeton alır ve müşteri numarası ister; resmî doküman bu araştırmada okunamadı. Takip formu numarayı adresle kabul etmiyor.'],
    ['ptt', 'PTT Kargo', '#ffd100', 'https://www.ptt.gov.tr/', false, 'PTT Kargo servis bilgileri sözleşmeli müşterilere verilir. PTT’nin takip formu numarayı adresle kabul etmiyor ve doğrulama adımıyla korunuyor.'],
    ['kolaygelsin', 'Kolay Gelsin', '#00a19a', 'https://www.kolaygelsin.com/tracking', false, 'Kolay Gelsin gönderi servisleri kurumsal sözleşmeyle verilir; resmî doküman herkese açık değil. Takip formu numarayı adresle kabul etmiyor.'],
  ].forEach(([p, n, c, page, direct, info]) => add({ key: 'kargofirma:' + p, name: n, mark: n.slice(0, 2), color: c, status: 'genel', method: 'rest', verified: '2026-10-28',
    summary: direct ? `Gönderinin “Takip et” düğmesi ${n}’nun takip sayfasını takip numarasıyla doğrudan açar. Takip numarası gönderiye elle girilir.` : `Gönderinin “Takip et” düğmesi takip numarasını panoya kopyalar ve ${n} takip sayfasını açar; numarayı sayfadaki kutuya yapıştırırsınız (firmanın sayfası numarayı adresle almıyor).`,
    limit: 'Yalnızca takip: gönderi oluşturma, barkod ve otomatik teslim bildirimi firmanın kurumsal API’sini gerektirir ve bağlı değildir. ' + info,
    sources: [{ label: n + ' · gönderi takip sayfası', url: page }].concat(p === 'hepsijet' ? [{ label: 'Hepsiburada Developer Portal · HepsiJet', url: 'https://developers.hepsiburada.com/tr/companies/hepsijet' }] : []),
    prereq: [n + ' ile çalışıyor olmanız (gönderiyi firmanın şubesinden veya panelinden oluşturursunuz)'], where: ['Gönderiyi kargoya verdiğinizde firmanın verdiği takip / gönderi numarasını NEBSOFT’taki gönderiye yazın.'],
    fields: [], test: { type: 'track', note: 'Elinizdeki bir takip numarasıyla ' + n + ' takip sayfası açılır; sonucu firmanın sayfasında görürsünüz.' }, errors: [],
    map: () => ({ enabled: true, provider: p }) }));

  // ---------- Elektronik teraziler: marka → cihaz türü → bağlantı yöntemi ----------
  // Ortak alanlar: etiketli terazi barkodu (GS1: 20–29 ön ekleri tartılı ürünler için mağaza içi numaralardır) ve seri port
  const SCALE_BARCODE = [
    { name: 'prefix', label: 'Barkod ön ekleri', methods: ['barcode'], placeholder: '27,28', example: '27,28', help: { what: 'Terazinin bastığı barkodun ilk 2 hanesi.', why: 'Kasa, bu ön ekle başlayan barkodu tartılı ürün olarak çözer.', where: 'Terazinin barkod formatı ayarı (kurulum menüsü veya yetkili servis). GS1, 20–29 arası ön ekleri mağaza içi tartılı ürünler için ayırmıştır.', format: 'Virgülle ayrılmış iki haneli sayılar, ör. 27,28', wrong: 'Tartılı ürün barkodu normal ürün sanılır, “ürün bulunamadı” hatası alınır.' } },
    { name: 'pluLen', label: 'PLU hane sayısı', type: 'number', methods: ['barcode'], placeholder: '5', help: { what: 'Barkodda ürün (PLU) kodunun kaç hane olduğu.', why: 'Ürün bu koddan bulunur.', where: 'Terazinin barkod formatı ayarı.', format: 'Genellikle 5.', wrong: 'Ürün yanlış eşleşir veya bulunamaz.' } },
    { name: 'valLen', label: 'Değer hane sayısı', type: 'number', methods: ['barcode'], placeholder: '5', help: { what: 'Barkoddaki ağırlık/tutar bölümünün hane sayısı.', why: 'Ağırlık veya tutar bu haneden okunur.', where: 'Terazinin barkod formatı ayarı.', format: 'Genellikle 5.', wrong: 'Ağırlık 10 / 100 kat hatalı okunur.' } },
    { name: 'valType', label: 'Barkoddaki değer', type: 'select', methods: ['barcode'], options: [{ value: 'weight', label: 'Ağırlık (gram)' }, { value: 'price', label: 'Tutar (kuruş)' }], help: { what: 'Terazi barkoda ağırlığı mı yoksa tutarı mı yazıyor.', why: 'Kasa satır tutarını buna göre hesaplar.', where: 'Terazinin barkod formatı ayarı.', format: '—', wrong: 'Tutar yanlış hesaplanır.' } },
  ];
  const SCALE_SERIAL = (d) => [
    { name: 'baud', label: 'Baud hızı', type: 'select', methods: ['serial'], options: ['2400', '4800', '9600', '19200'].map((x) => ({ value: x, label: x })), help: { what: 'Seri port hızı.', why: 'Kasa ile terazi aynı hızda konuşmalıdır.', where: 'Terazinin iletişim (RS-232 / ECR) ayarı veya kılavuzu.' + (d ? ' Bu marka için yaygın değer: ' + d.baud + '.' : ''), format: 'Sayı.', wrong: 'Anlamsız karakterler okunur veya hiç veri gelmez.' } },
    { name: 'dataBits', label: 'Veri biti', type: 'select', methods: ['serial'], options: [{ value: '8', label: '8' }, { value: '7', label: '7' }], help: { what: 'Karakter başına veri biti.', why: 'Terazi ayarıyla aynı olmalıdır.', where: 'Terazi kılavuzu.', format: '7 veya 8.', wrong: 'Okunan veri bozulur.' } },
    { name: 'parity', label: 'Parite', type: 'select', methods: ['serial'], options: [{ value: 'none', label: 'Yok (N)' }, { value: 'even', label: 'Çift (E)' }, { value: 'odd', label: 'Tek (O)' }], help: { what: 'Hata denetim biti.', why: 'Terazi ayarıyla aynı olmalıdır.', where: 'Terazi kılavuzu (ör. 7E1 = 7 veri biti, çift parite, 1 dur biti).', format: '—', wrong: 'Okunan veri bozulur.' } },
    { name: 'request', label: 'Ağırlık isteme komutu', methods: ['serial'], placeholder: d && d.request ? d.request : 'Boşsa terazinin sürekli gönderdiği veri dinlenir', help: { what: 'Kasanın teraziden ağırlık istemek için gönderdiği komut.', why: 'Bazı teraziler yalnızca istendiğinde ağırlık gönderir.', where: 'Terazinin iletişim protokolü kılavuzu.' + (d && d.request ? ' Bu marka için: ' + d.request : ''), format: 'Komut metni; ENQ yazılırsa 05h karakteri gönderilir.', wrong: 'Terazi yanıt vermez, “ağırlık okunamadı” hatası alınır.' } },
  ];
  const scaleMap = (brand) => (v) => ({ brand, model: v.model || '', mode: v.method === 'serial' ? 'serial' : 'barcode', ...(v.method === 'barcode' ? { prefix: v.prefix || '27,28', pluLen: Number(v.pluLen) || 5, valLen: Number(v.valLen) || 5, valType: v.valType || 'weight' } : { baud: Number(v.baud) || 9600, dataBits: Number(v.dataBits) || 8, parity: v.parity || 'none', stopBits: 1, request: v.request || '', protocol: brand === 'cas' ? 'cas' : brand === 'toledo' ? 'toledo' : 'auto' }) });
  const SCALE_TEST = { barcode: { type: 'scale-barcode', note: 'Terazinin bastığı bir etiketin barkodunu okutun; PLU ve ağırlık/tutar çözülerek gösterilir.' }, serial: { type: 'scale-serial', note: 'Terazinin üzerine bir ürün koyun. Tarayıcı seri port izni ister; teraziden gerçek ağırlık okunur. Chrome veya Edge gerekir.' } };
  const SCALE_ERR = [{ match: 'Web Serial', title: 'Tarayıcı seri portu desteklemiyor', fix: 'Chrome veya Edge kullanın ya da NEBSOFT masaüstü uygulamasını açın.' }, { match: 'okunamadı|sabit', title: 'Ağırlık okunamadı', fix: 'Tartımın sabitlendiğini, baud / veri biti / parite ayarlarının terazidekiyle aynı olduğunu ve gerekiyorsa ağırlık isteme komutunu kontrol edin.' }, { match: 'No port|requestPort|NotFound', title: 'Port seçilmedi', fix: 'Açılan pencerede terazinin bağlı olduğu USB/COM portunu seçin.' }, { match: 'çözülemedi', title: 'Barkod çözülemedi', fix: 'Ön ek, PLU hane ve değer hane ayarlarını terazinin barkod formatıyla karşılaştırın.' }];
  const scaleTypes = (serialNote) => [{ id: 'etiket', name: 'Etiket basan (barkodlu) terazi', methods: ['barcode'], note: 'Terazi etiket basar; kasada etiketteki barkod okutulur. Kasaya kablo gerekmez.' }, { id: 'kasa', name: 'Kasaya bağlı terazi (RS-232 / USB)', methods: ['serial'], note: serialNote }, { id: 'ikisi', name: 'Hem etiket basan hem kasaya bağlanabilen', methods: ['barcode', 'serial'], note: 'İki yöntemden birini seçin; etiketli kullanım daha az ayar gerektirir.' }];
  add({ key: 'scale:toledo', name: 'Mettler Toledo', mark: 'MT', color: '#0066b3', status: 'erisim', method: 'serial', verified: '2026-10-27',
    summary: 'Mettler Toledo cihazlarının çoğu MT-SICS komut setini kullanır: seviye 0 komutlarından “SI” ağırlığı anında, “S” sabit ağırlığı gönderir; yanıtın ilk alanı durumu (S: sabit, D: değişken) belirtir. Hangi komut setinin desteklendiği ve seri port ayarları modele göre değişir.',
    sources: [{ label: 'Mettler Toledo · MT-SICS başvuru kılavuzu (XPR)', url: 'https://b2b.wagnermunz.com/download/Mettler-Toledo GmbH/Reference_Manual_MT-SICS-XPR_EN.pdf' }, { label: 'Mettler Toledo · IND400 SICS komutları', url: 'https://mt.com/dam/ind/IND_PDF/2024/ind400-downloads/sics-reference-manual/30881805 _A_MAN_RM_IND400_SICS Commands_EN.pdf' }, { label: 'GS1 · 20–29 ön ekleri', url: 'https://www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf' }],
    models: scaleTypes('MT-SICS destekleyen modellerde ağırlık isteme komutu olarak SI kullanılır. Seri port ayarlarını cihazın kılavuzundan kontrol edin.'),
    prereq: ['Terazinin kasa bilgisayarına RS-232 (USB dönüştürücüyle) veya USB ile bağlı olması (kasaya bağlı kullanım için)', 'Chrome / Edge tarayıcı veya NEBSOFT masaüstü uygulaması (Web Serial)', 'Etiketli kullanımda terazinin barkod formatının bilinmesi'],
    where: ['<b>Etiketli kullanım:</b> Terazinin barkod formatını (ön ek, PLU hane sayısı, ağırlık/tutar hane sayısı) terazinin kurulum menüsünden veya yetkili servisten öğrenin.', '<b>Kasaya bağlı kullanım:</b> Cihazın kılavuzunda MT-SICS desteğini ve seri port ayarlarını (baud, veri biti, parite) bulun. Ağırlık isteme komutu olarak <code>SI</code> yazın.', 'Ürün kartlarında terazideki PLU kodlarını NEBSOFT ürünlerine girin.'],
    fields: [...SCALE_BARCODE, ...SCALE_SERIAL({ baud: 'cihaza göre', request: 'SI' })], test: SCALE_TEST, errors: SCALE_ERR, map: scaleMap('toledo') });
  add({ key: 'scale:cas', name: 'CAS', mark: 'CAS', color: '#d71920', status: 'erisim', method: 'serial', verified: '2026-10-27',
    summary: 'CAS teraziler etiketli (barkodlu) veya ECR/POS bağlantılı kullanılabilir. PD-II modelinde 9 pinli RS-232C portu bulunur; topluluk kaynaklarında ECR tipi 2 (STX/ETX) modunda 9600 baud, 7 veri biti, çift parite, 1 dur biti ve “W” istek komutu bildirilmiştir (resmî protokol kılavuzu bu araştırmada okunamadı).',
    sources: [{ label: 'CAS PD-II broşürü (RS-232C portu)', url: 'https://cdn11.bigcommerce.com/s-novopaarpb/content/brochure/p/d/pd-2e_3.pdf' }, { label: 'Topluluk kütüphanesi: @kortoaus/cas-scale', url: 'https://npmjs.com/package/@kortoaus/cas-scale' }],
    models: [{ id: 'cl', name: 'Etiket basan terazi (ör. CL serisi)', methods: ['barcode'], note: 'Etiketteki barkod kasada okutulur.' }, { id: 'pd2', name: 'PD-II (kasaya bağlı)', methods: ['serial'], note: 'ECR tipini terazinin kurulum modundan ayarlayın; bildirilen ayar 9600 / 7 / Çift / 1 ve istek komutu W.' }, { id: 'diger', name: 'Diğer CAS modeli', methods: ['barcode', 'serial'], note: 'Seri port ayarlarını modelin kılavuzundan alın.' }],
    prereq: ['Kasaya bağlı kullanımda RS-232 kablo / USB dönüştürücü', 'Chrome / Edge veya NEBSOFT masaüstü uygulaması'],
    where: ['<b>Etiketli:</b> Terazinin barkod formatını kurulum menüsünden veya CAS servisinden öğrenin.', '<b>PD-II:</b> Terazinin kurulum modunda ECR tipini ayarlayın; seri ayarları 9600 baud, 7 veri biti, çift parite olarak girin ve istek komutuna <code>W</code> yazın (topluluk kaynağı — çalışmazsa kılavuzu kontrol edin).'],
    fields: [...SCALE_BARCODE, ...SCALE_SERIAL({ baud: '9600 (7E1)', request: 'W' })], test: SCALE_TEST, errors: SCALE_ERR, map: scaleMap('cas') });
  [['dibal', 'Dibal', '#e2001a'], ['digi', 'DIGI', '#003087'], ['bizerba', 'Bizerba', '#c8102e'], ['diger', 'Diğer marka', '#64748b']].forEach(([id, n, c]) => add({ key: 'scale:' + id, name: n, mark: n.slice(0, 2), color: c, status: 'erisim', method: 'serial', verified: '2026-10-27',
    summary: n + ' için iletişim protokolü bu araştırmada resmî kaynaktan doğrulanamadı. Etiketli (barkodlu) kullanım her markada aynı mantıkla çalışır; kasaya bağlı kullanımda “otomatik” okuma, gelen veride ağırlık sayısını arar.',
    sources: [{ label: 'GS1 · 20–29 ön ekleri', url: 'https://www.gs1.org/docs/barcodes/SummaryOfGS1MOPrefixes20-29.pdf' }], models: scaleTypes('Seri port ayarlarını ve (varsa) ağırlık isteme komutunu cihaz kılavuzundan alın.'),
    prereq: ['Etiketli kullanımda terazinin barkod formatı', 'Kasaya bağlı kullanımda RS-232 / USB bağlantısı ve Chrome / Edge'], where: ['Terazinin barkod formatını veya seri port ayarlarını cihaz kılavuzundan ya da yetkili servisten öğrenin.'],
    fields: [...SCALE_BARCODE, ...SCALE_SERIAL(null)], test: SCALE_TEST, errors: SCALE_ERR, map: scaleMap(id) }));

  // ---------- POS / ödeme terminalleri: marka → cihaz türü → yöntem ----------
  const POS_TYPES = [
    { id: 'banka', name: 'Bankanın verdiği bağımsız POS cihazı', methods: ['manual'], note: 'Tutar cihaza elle girilir; çekim onaylanınca kasada “Onaylandı” denir. Her cihazla çalışır.' },
    { id: 'okc', name: 'Yazarkasa POS (ÖKC, GMP3)', methods: ['manual', 'gmp3'], note: 'Kasa ile doğrudan GMP3 bağlantısı üreticinin SDK’sı ve entegrasyon anlaşması gerektirir; NEBSOFT’ta bu katman henüz yok. O zamana kadar manuel onayla kullanılır.' },
    { id: 'servis', name: 'Üretici / çözüm ortağı yazılımı olan terminal', methods: ['manual', 'bridge'], note: 'Terminal üreticisinin veya çözüm ortağınızın kasa bilgisayarında çalışan bir servisi varsa tutar o servise gönderilebilir.' },
  ];
  const POS_FIELDS = [
    { name: 'url', label: 'Terminal servis adresi', methods: ['bridge'], required: true, placeholder: 'http://localhost:8085/sale', help: { what: 'Kasa bilgisayarında çalışan terminal servisinin adresi.', why: 'Satış tutarı bu adrese gönderilir, onay sonucu buradan döner.', where: 'Terminal üreticisinin veya çözüm ortağınızın kurulum belgesi.', format: 'http:// veya https:// ile başlayan adres.', wrong: 'Kartlı ödemede “terminale ulaşılamadı” hatası alınır.' } },
    { name: 'timeout', label: 'Zaman aşımı (sn)', type: 'number', methods: ['bridge'], placeholder: '60', help: { what: 'Müşterinin kartı okutması için beklenecek süre.', why: 'Süre dolunca işlem iptal sayılır.', where: '—', format: 'Saniye.', wrong: 'Çok kısa olursa onaylanan işlem yarıda kalabilir.' } },
    { name: 'maxInst', label: 'En fazla taksit', type: 'number', methods: ['manual', 'bridge'], placeholder: '6', help: { what: 'Kasada sunulacak en yüksek taksit sayısı.', why: 'Taksit seçimi bu sınırla gösterilir.', where: 'Banka anlaşmanız.', format: 'Sayı.', wrong: 'Bankanın izin vermediği taksit seçilebilir.' } },
  ];
  [['ingenico', 'Ingenico', '#0072ce'], ['verifone', 'Verifone', '#00a3e0'], ['beko', 'Beko', '#002b5c'], ['hugin', 'Hugin', '#e30613'], ['pavo', 'Pavo', '#5b2d90'], ['paygo', 'PayGo / Android POS', '#00a86b'], ['diger', 'Diğer marka', '#64748b']].forEach(([id, n, c]) => add({
    key: 'pos:' + id, name: n, mark: n.slice(0, 2), color: c, status: 'erisim', method: 'sdk', verified: '2026-10-27',
    summary: n + ' terminallerinin kasa yazılımıyla doğrudan bağlantı protokolü herkese açık değildir (üretici SDK’sı ve anlaşma gerekir). NEBSOFT’ta bu cihazlar manuel onayla veya üreticinin / çözüm ortağının kasa bilgisayarında çalışan servisi üzerinden kullanılır.',
    sources: [], models: POS_TYPES,
    prereq: ['Bankanızla POS anlaşması', 'Doğrudan bağlantı için: üreticinin veya çözüm ortağınızın kasa bilgisayarında çalışan terminal servisi'],
    where: ['<b>Manuel:</b> Ek bilgi gerekmez; kartlı ödemede tutarı cihaza girin, onaylanınca kasada onaylayın.', '<b>Terminal servisi:</b> Servis adresini üreticinizin veya çözüm ortağınızın kurulum belgesinden alın.', '<b>Yazarkasa POS (GMP3):</b> NEBSOFT’ta doğrudan bağlantı henüz yok; manuel yöntemi seçin.'],
    fields: POS_FIELDS,
    test: { manual: { type: 'none', note: 'Manuel yöntemde cihazla bağlantı kurulmaz; test gerekmez.' }, bridge: { type: 'none', note: 'Terminal servisine test isteği göndermek gerçek bir çekim başlatabileceğinden otomatik test yapılmaz. İlk satışta 1 ₺’lik deneme çekimi yapıp iptal edin.' }, gmp3: { type: 'none', note: 'Bu yöntem henüz desteklenmiyor.' } },
    unsupportedMethods: ['gmp3'],
    errors: [],
    map: (v) => ({ brand: id, model: v.model || '', mode: v.method === 'bridge' ? 'bridge' : 'manual', url: v.url || '', timeout: Number(v.timeout) || 60, maxInst: Number(v.maxInst) || 6 }),
  }));
  const METHOD_NAMES = { barcode: 'Etiketteki barkodu okutma', serial: 'Seri port (RS-232 / USB)', manual: 'Manuel onay', bridge: 'Terminal servisi (üretici / çözüm ortağı)', gmp3: 'Doğrudan GMP3 bağlantısı (henüz yok)' };


  // ---------- Uyumsoft e-Fatura / e-Arşiv (özel entegratör) — 28.10.2026 ----------
  // Kaynak: Uyumsoft'un herkese açık WSDL'i ve şemaları; fatura GİB e-Fatura Paketi'ndeki UBL-TR kurallarına göre core/ubltr.js ile üretilir.
  // Doğrulama: üretilen gönderi Uyumsoft şemalarına karşı XmlSchemaSet ile geçerli; test sunucusuna gerçek SOAP çağrısı (sahte kullanıcıya yetki hatası).
  add({ key: 'efatura:uyumsoft', name: 'Uyumsoft', mark: 'Uy', color: '#e4002b', status: 'dogrulandi', method: 'soap', verified: '2026-10-28',
    summary: 'Faturalar GİB’in UBL-TR 1.2 biçiminde hazırlanır ve Uyumsoft entegrasyon servisine (SendInvoice) gönderilir. Alıcı e-Fatura mükellefiyse (Uyumsoft üzerinden GİB listesi sorgulanır) e-Fatura, değilse e-Arşiv kesilir. Mali mühürle imzalama ve GİB’e iletim Uyumsoft tarafından yapılır.',
    limit: 'e-Fatura ve e-Arşiv faturası gönderilir (SATIS, IADE; KDV). Tevkifat, istisna (%0 KDV için istisna kodu gerekir), ihracat ve özel matrah senaryoları bu sürümde yoktur. e-İrsaliye Uyumsoft’un ayrı servisidir. Fatura numarası her programda kendi serisiyle artar; birden çok program aynı Uyumsoft hesabını kullanıyorsa her birine ayrı seri verin.',
    sources: [{ label: 'Uyumsoft entegrasyon servisi (WSDL)', url: 'https://efatura.uyumsoft.com.tr/Services/Integration?wsdl' }, { label: 'Uyumsoft test servisi (WSDL)', url: 'https://efatura-test.uyumsoft.com.tr/Services/Integration?wsdl' }, { label: 'GİB e-Fatura Paketi (UBL-TR şematron ve örnekler)', url: 'https://ebelge.gib.gov.tr/dosyalar/kilavuzlar/e-FaturaPaketi.zip' }, { label: 'GİB e-Arşiv Teknik Kılavuzu (internet satışı bilgileri)', url: 'https://ebelge.gib.gov.tr/dosyalar/kilavuzlar/e-Arsiv_Teknik_Kilavuzu_V.1.19.pdf' }],
    prereq: ['GİB’e e-Fatura / e-Arşiv mükellefi olarak kayıtlı olmanız', 'Uyumsoft’tan özel entegrasyon hizmeti (sözleşme) ve mali mühürünüzün Uyumsoft’a tanımlı olması', 'Uyumsoft’un verdiği web servis (entegrasyon) kullanıcı adı ve şifresi'],
    where: ['Web servis kullanıcı adı ve şifresi Uyumsoft ile sözleşme yaptığınızda verilir. Portal kullanıcınızdan farklı olabilir; hangi bilgilerin entegrasyon için olduğunu Uyumsoft destek ekibine sorun (menü yeri uydurulmamıştır).', 'Önce test ortamında deneyin: Uyumsoft size test kullanıcısı verdiyse “Test ortamı” kutusunu işaretleyin.', 'Fatura serisini (3 harf / rakam, ör. NEB) ve daha önce bu seriyle kestiğiniz son fatura numarasını Uyumsoft portalınızdan kontrol edin; numara buradan devam eder.', 'İnternetten satış yapıyorsanız e-Arşiv faturasına web adresi, ödeme şekli ve kargo firmasının VKN / unvanı yazılması zorunludur (GİB e-Arşiv Teknik Kılavuzu).'],
    fields: [
      { name: 'user', label: 'Web servis kullanıcı adı', required: true, help: {"what":"Uyumsoft entegrasyon servisine giriş adı.","why":"Her istekte WS-Security ile gönderilir.","where":"Uyumsoft sözleşmesiyle verilir.","format":"Metin.","wrong":"“Bu sisteme erişmek için gerekli yetkiniz yok” hatası."} },
      { name: 'pass', label: 'Web servis şifresi', secret: true, required: true, help: {"what":"Entegrasyon şifresi.","why":"Kimlik doğrulama; sunucuda şifreli saklanır.","where":"Uyumsoft sözleşmesiyle verilir.","format":"Metin.","wrong":"Yetki hatası."} },
      { name: 'test', label: 'Test ortamı (efatura-test.uyumsoft.com.tr)', type: 'checkbox', help: {"what":"İstekler test sunucusuna gider.","why":"Gerçek fatura kesmeden denemek için.","where":"Uyumsoft test kullanıcısı verdiyse işaretleyin.","format":"—","wrong":"Canlı kullanıcıyla test ortamında yetki hatası alınır."} },
      { name: 'vkn', label: 'Firmanızın VKN / TCKN', required: true, pattern: '^(\\d{10}|\\d{11})$', help: {"what":"Faturayı kesen firmanın vergi kimlik no (şahıs firmasında TCKN).","why":"Satıcı ve imza bilgisine yazılır.","where":"Vergi levhası.","format":"10 veya 11 hane.","wrong":"Uyumsoft faturayı reddeder."} },
      { name: 'title', label: 'Firma unvanı', required: true, help: {"what":"Vergi levhasındaki unvan.","why":"Faturada satıcı adı.","where":"Vergi levhası.","format":"Metin.","wrong":"Faturada yanlış unvan görünür."} },
      { name: 'taxOffice', label: 'Vergi dairesi', required: true, help: {"what":"Bağlı olduğunuz vergi dairesi.","why":"Faturada satıcı bilgisi.","where":"Vergi levhası.","format":"Metin.","wrong":"Faturada eksik bilgi."} },
      { name: 'street', label: 'Adres (cadde, no)', help: {"what":"Firma adresi.","why":"Faturada satıcı adresi.","where":"Vergi levhası.","format":"Metin.","wrong":"—"} },
      { name: 'district', label: 'İlçe', required: true, help: {"what":"Firma ilçesi.","why":"Adres bilgisi.","where":"—","format":"Metin.","wrong":"—"} },
      { name: 'city', label: 'İl', required: true, help: {"what":"Firma ili.","why":"Adres bilgisi.","where":"—","format":"Metin.","wrong":"—"} },
      { name: 'profile', label: 'e-Fatura senaryosu', type: 'select', options: [{ value: 'TEMELFATURA', label: 'Temel fatura' }, { value: 'TICARIFATURA', label: 'Ticari fatura (alıcı kabul / red yanıtı verir)' }], help: {"what":"Alıcı e-Fatura mükellefiyken kullanılacak senaryo.","why":"Ticari faturada alıcı 8 gün içinde kabul / red verebilir.","where":"Muhasebecinize danışın.","format":"Temel veya ticari.","wrong":"İade faturası ticari senaryoda kesilemez."} },
      { name: 'efPrefix', label: 'e-Fatura serisi', required: true, pattern: '^[A-Za-z0-9]{3}$', placeholder: 'NEB', help: {"what":"e-Fatura numarasının ilk 3 karakteri.","why":"Numara: seri + yıl + 9 haneli sıra (GİB).","where":"Uyumsoft portalınızdaki seri.","format":"3 harf / rakam.","wrong":"Numara çakışması reddedilir."} },
      { name: 'eaPrefix', label: 'e-Arşiv serisi', required: true, pattern: '^[A-Za-z0-9]{3}$', placeholder: 'EAR', help: {"what":"e-Arşiv numarasının ilk 3 karakteri.","why":"e-Arşiv sırası ayrı tutulur.","where":"Uyumsoft portalı.","format":"3 harf / rakam.","wrong":"Numara çakışması."} },
      { name: 'efLast', label: 'Son e-Fatura numarası (varsa)', placeholder: 'NEB2026000000123 veya 123', help: {"what":"Bu seriyle bu yıl kesilen son e-Fatura.","why":"Numara buradan devam eder; atlama / tekrar olmaz.","where":"Uyumsoft portalındaki giden faturalar.","format":"Tam numara ya da yalnızca sıra.","wrong":"Aynı numara reddedilir."} },
      { name: 'eaLast', label: 'Son e-Arşiv numarası (varsa)', placeholder: 'EAR2026000000045 veya 45', help: {"what":"Bu seriyle bu yıl kesilen son e-Arşiv faturası.","why":"Numara buradan devam eder.","where":"Uyumsoft portalı.","format":"Tam numara ya da yalnızca sıra.","wrong":"Aynı numara reddedilir."} },
      { name: 'webAddress', label: 'İnternet satışı: web adresiniz', placeholder: 'https://www.siteniz.com', help: {"what":"Satış yaptığınız web sitesi.","why":"İnternet satışı e-Arşiv faturasında zorunlu.","where":"—","format":"https:// ile tam adres.","wrong":"İnternet satışı faturası gönderilmez."} },
      { name: 'carrierVkn', label: 'İnternet satışı: kargo firması VKN', help: {"what":"Gönderiyi taşıyan kargo firmasının vergi no.","why":"GİB e-Arşiv kılavuzu gönderi bilgilerinde zorunlu tutar.","where":"Kargo firmasının faturası / sözleşmesi.","format":"10 hane.","wrong":"İnternet satışı faturası gönderilmez."} },
      { name: 'carrierName', label: 'İnternet satışı: kargo firması unvanı', help: {"what":"Kargo firmasının unvanı.","why":"Gönderi bilgisi.","where":"Kargo faturası.","format":"Metin.","wrong":"İnternet satışı faturası gönderilmez."} },
    ],
    test: { type: 'uyumsoft', note: 'Uyumsoft servisine kullanıcı adı / şifrenizle bağlanılır ve firmanızın e-Fatura kaydı sorgulanır. Fatura kesilmez.' },
    errors: [{ match: 'yetkiniz yok|yetki', title: 'Kullanıcı adı veya şifre kabul edilmedi', fix: 'Web servis (entegrasyon) kullanıcı adı ve şifresini kontrol edin; test kullanıcısıyla deniyorsanız “Test ortamı” işaretli olmalı, canlı kullanıcıyla işaretsiz.' }, { match: 'IP', title: 'IP adresi izinli değil', fix: 'Uyumsoft, servise yalnızca tanımlı IP adreslerinden erişime izin veriyor olabilir; sunucunuzun IP adresini Uyumsoft’a bildirin.' }, { match: 'seri', title: 'Fatura serisi eksik', fix: '3 karakterli e-Fatura ve e-Arşiv serilerini girin.' }, { match: 'posta kutusu', title: 'Alıcının posta kutusu bulunamadı', fix: 'Alıcının e-Fatura posta kutusu etiketi GİB listesinde etkin değil; alıcıya danışın.' }],
    map: (v) => ({ enabled: true, provider: 'uyumsoft', user: v.user, pass: v.pass, test: !!v.test, vkn: String(v.vkn || '').trim(), title: v.title, taxOffice: v.taxOffice, street: v.street || '', district: v.district, city: v.city, profile: v.profile || 'TEMELFATURA', efPrefix: String(v.efPrefix || '').toUpperCase(), eaPrefix: String(v.eaPrefix || '').toUpperCase(), efLast: v.efLast || '', eaLast: v.eaLast || '', webAddress: v.webAddress || '', carrierVkn: v.carrierVkn || '', carrierName: v.carrierName || '' }),
  });

  // ---------- Desteklenmeyen / sözleşme gerektiren örnekler (dürüst işaretleme) ----------
  ['logo:Logo e-Dönüşüm', 'sovos:Sovos (Foriba)', 'mysoft:Mysoft', 'edm:EDM Bilişim'].forEach((x) => { const [p, n] = x.split(':'); add({ key: 'efatura:' + p, name: n, mark: n.slice(0, 2), color: '#64748b', status: 'desteklenmiyor', method: 'rest', verified: '2026-10-27', summary: `${n} için NEBSOFT’ta doğrudan bağlantı kodu henüz yok. Bu sağlayıcı seçildiğinde fatura gönderilmez. Entegratörünüzün sağladığı bir ara servis varsa “Özel API” ile bağlanabilirsiniz.`, sources: [], prereq: [], where: [], fields: [], test: { type: 'none' }, errors: [] }); });
  ['ingenico:Ingenico (GMP3)', 'beko:Beko 300TR / 400TR', 'hugin:Hugin', 'profilo:Profilo', 'pavo:Pavo', 'vera:Verifone (ÖKC)', 'paygo:PayGo Android ÖKC'].forEach((x) => { const [p, n] = x.split(':'); add({ key: 'okc:' + p, name: n, mark: n.slice(0, 2), color: '#7c3aed', status: 'yakinda', method: 'sdk', verified: '2026-10-28', summary: `Yakında: yazarkasaya doğrudan bağlanmak için NEBSOFT’un üreticiyle GMP3 entegrasyon anlaşması ve sertifikasyonu gerekir; onay alınana kadar bu seçenek kullanılamaz (kart tutarı kasaya elle girilerek çalışılır). ${n} yazarkasa POS cihazları üreticinin SDK’sı ve/veya entegrasyon anlaşmasıyla bağlanır (GMP3). NEBSOFT’ta bu cihaz için sürücü katmanı henüz yok; tarayıcı bu cihazlara doğrudan bağlanamaz. Gerekli altyapı: masaüstü yerel köprüsünde üretici SDK’sını çağıran bir servis.`, sources: [], prereq: ['Üreticiyle entegrasyon anlaşması / SDK', 'NEBSOFT masaüstü uygulaması (yerel köprü)'], where: [], fields: [], test: { type: 'none' }, errors: [] }); });

  const byKey = Object.fromEntries(G.map((g) => [g.key, g]));
  // Ek rehber dosyaları (ör. integ-guides-ek.js) kayıt eklemek için kullanır; aynı anahtar varsa ilk kayıt korunur
  const addMore = (g) => { if (byKey[g.key]) return; G.push(g); byKey[g.key] = g; };
  const STATUS = { dogrulandi: ['Resmî dokümanla doğrulandı', 'ok'], genel: ['Standart protokol', 'info'], erisim: ['Kısmen doğrulandı', 'warn'], desteklenmiyor: ['Henüz desteklenmiyor', 'err'], yakinda: ['Yakında', 'acc'] };
  window.NB_GUIDES = { add: addMore, BRAND_KINDS: { scale: 1, pos: 1 }, METHOD_NAMES, list: G, get: (kind, prov) => byKey[`${kind}:${prov}`] || null, forKind: (kind) => G.filter((g) => g.key.startsWith(kind + ':')), STATUS };
})();
