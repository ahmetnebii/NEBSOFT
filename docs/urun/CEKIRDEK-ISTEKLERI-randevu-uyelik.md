# Çekirdek istekleri — Randevu, Klinik, Veteriner, Spor, Kurs, Anaokulu

Bu oturum yalnızca `apps/<program>/` ve `docs/urun/` içinde değişiklik yapar. Aşağıdakiler `core/`, `server/` veya kök dosyalarda
yapılması gereken işlerdir; `core/` sahibi oturum sırayla ele almalıdır. Tarih: 29.10.2026.

| # | Dosya | İstek | Gerekçe | Program |
|---|---|---|---|---|
| Ç1 | `sw.js` | `V` sürümü bu dal birleştirilirken bir artırılmalı. | Statik dosyalar değişti; `CLAUDE.md` §3. Paralel dallar çakışmasın diye program oturumu değiştirmedi. | hepsi |
| Ç2 | `core/integrations.js` `call()` | Resmî kurum bağlayıcıları (`enabiz`, `erecete`, `kps`, `vetbis`, `petkayit`, `meb`) ve `googleisletme` için `provider: 'sim'` iken dönen sonuca `simulated: true` zaten ekleniyor; ama **"Özel API / çözüm ortağı"** yolu da doğrulanmamış bir uç noktaya `ok` dönebiliyor. Bu bağlayıcılar `integ-guides-ek.js`'te "yakında / desteklenmiyor" olarak işaretli; `call()` da bunlar için canlıda (sim dışı) `{ ok:false, error:'Doğrulanmadı — canlıda seçilemez' }` dönmeli. | `CLAUDE.md` §1 "DOĞRULANAMADI olan entegrasyon canlıda seçilemez". Program tarafında simülasyon sonucu artık kalıcı kayıt bırakmıyor (bkz. program dalgaları) ama canlı yol çekirdekte kapanmalı. | klinik, veteriner, kurs, randevu |
| Ç3 | `server/` | Zamanlanmış hatırlatma: panel kapalıyken de randevudan X saat önce SMS göndermek için sunucu tarafında zamanlayıcı (bulut). | Rakiplerde standart (Salon Randevu); şu an hatırlatma ancak panel açıkken veya elle gönderiliyor. | randevu, klinik, veteriner, spor, kurs |
| Ç4 | `server/cloud/public-rules.js` | Programlarda eklenen yeni alanların (ör. randevuda `noReminder`, bekleme listesi `waitlist` koleksiyonu) müşteri sayfalarından yazılabilmesi için kurallara eklenmesi. Ayrıntı her programın spesifikasyonunun §6'sında. | Bulut modunda müşteri sayfası yalnızca kuralda izin verilen alanları yazabilir. | randevu (+ diğerleri, sırası gelince) |
