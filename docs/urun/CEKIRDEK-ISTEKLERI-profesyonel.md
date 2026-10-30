# Çekirdek istekleri — Hukuk, Mali Müşavir, İK, Eczane oturumu

Bu oturum yalnızca `apps/hukuk`, `apps/musavir`, `apps/ik`, `apps/eczane` ve `docs/urun/` içinde çalışır (`CLAUDE.md` §4).
Aşağıdakiler `core/`, `server/` veya kök dosyalarda değişiklik gerektirir; çekirdek oturumu tarafından yapılmalıdır.

| # | Dosya | İstek | Gerekçe | Öncelik |
|---|---|---|---|---|
| Ç1 | `core/integrations.js` `sendEsmmParasut` | e-SMM'de stopaj yalnızca alıcı vergi kesintisi yapmakla yükümlüyse uygulanmalı: `payload.withholding` (true/false) parametresi eklensin; verilmezse bugünkü davranış. | GVK 94: stopajı (vergi kesintisini) ödemeyi yapan yükümlü (şirket, kurum) keser; bireysel müvekkile/hastaya kesilen makbuzda stopaj olmaz. Şu an kurulumdaki oran her makbuza uygulanıyor. Hukuk programı bu durumda e-SMM'yi engelliyor (sahte belge yerine). | Yüksek |
| Ç2 | `server/cloud/public-rules.js` `hkkCode` | Formülle türetilen yedek kod (`TCKN son 4 + kayıt kimliği`) kaldırılsın; yalnızca `c.portalCode`. | Tahmin edilebilir giriş kodu, avukat–müvekkil gizliliği (Av. K. m.36) ve KVKK riski. Hukuk programı artık her müvekkile rastgele kod üretiyor (eski kayıtlara da açılışta), sunucudaki yedek formül gereksiz ve zayıf. | Yüksek |
| Ç3 | `package.json` `test` | `node apps/hukuk/sure.test.js` (ve bu oturumun eklediği diğer `apps/*/…test.js` dosyaları) `npm test`'e eklensin. | Usul süresi hesabı mevzuata bağlı; regresyon testi kalite kapısında otomatik koşmalı. | Orta |
| Ç4 | `sw.js` `V` | Bu oturumun her commit'inden sonra sürüm artırılmalı. | `CLAUDE.md` §3: statik dosya değişince kullanıcı eski dosyayı görmesin. Bu oturum kök dosyaya dokunamıyor. Denemede servis çalışanı eski `app.js`'i sundu (elle temizlendi). | Yüksek |
| Ç5 | `core/core.js` `crud` | `beforeDelete(rec) → false/metin` kancası. | Hukuk'ta dosyası olan müvekkilin silinmesini engellemek için yakalama (capture) dinleyicisi kullanıldı; resmî kanca daha temiz olur. | Düşük |
| Ç6 | `core/core.js` `fieldsHtml` | Metin alanına öneri listesi: `{ type:'text', list:[...] }` → `<datalist>`. | Hukuk'ta mahkeme adı serbest yazılabilsin ama önerilsin diye formModal açıldıktan sonra datalist bağlanıyor. | Düşük |
| Ç7 | `server/test/cloud.test.js` | 60. satır: deneme lisansı beklenirken `talep` dönüyor (`'talep' == 'deneme'`). | Bu oturumun değişikliklerinden önceki commit'te (6c7a6c7) de aynı hata var; `npm test` bu yüzden kırmızı. | Yüksek |
| Ç8 | Toast | `navigator.vibrate` kullanıcı dokunmadan çağrılınca konsola hata düşüyor. | Müvekkil portalında giriş hatası toast'unda görüldü. | Düşük |
