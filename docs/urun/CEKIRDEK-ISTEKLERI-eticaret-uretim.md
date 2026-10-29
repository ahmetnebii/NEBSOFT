# Çekirdek ve ortak dosya istekleri — E-ticaret / Pazaryeri / Kargo / Fabrika oturumu

Bu oturum yalnızca `apps/eticaret`, `apps/pazaryeri`, `apps/kargo`, `apps/fabrika`, `server/connectors` ve `docs/urun` içinde değişiklik yapar.
Aşağıdakiler çekirdek (`core/`) veya kök dosyalarda yapılmalı; çekirdek oturumu karar verir.

| # | Dosya | İstek | Gerekçe |
|---|---|---|---|
| Ç1 | `sw.js` | `V` sürümünü artırın (şu an `nebsoft-v3-18`). | `CLAUDE.md` §3: statik dosyalar değişti (E-ticaret `app.js`, `pazaryeri.js`, `magaza.html` ve sonraki dalgalar). Artırılmazsa kullanıcı eski dosyayı görür — tarayıcı denemesinde eski `app.js` gelince doğrulandı. |
| Ç2 | `core/integrations.js` → `call()` | Simülasyon sonucunda `toast(..., 'ok')` yerine "TEST — gönderilmedi" uyarısı ve `ok: true` yerine açık `simulated: true` ile birlikte `ok: false` düşünülmeli. | `kargofirma` / `pazaryeri` simülasyonu `ok: true, ref: 'KAR…'` döndürüyor; eski E-ticaret kodu bu `ref`'i takip numarası diye kullanıyordu (H1). Program tarafında `r.simulated` kontrolüyle kapatıldı ama başka programlar aynı tuzağa düşebilir. |
| Ç3 | `core/integrations.js` → `sendEInvoice()` | Eski yol kullanılmamalı / kaldırılmalı; simülasyonda `ok: true` ve kalıcı fatura no döndürüyor. | E-ticaret `NS.ebelge.create()`'e geçirildi. `grep sendEInvoice apps/` ile kalan kullanımlar bulunabilir. |
| Ç4 | `server/test/kanal.test.js` | Trendyol `urun-gonder` için yeni yolu (`/v2/products`), `tedarik-edilemedi` işlemini ve `kargo-bildir`'in artık takip no çağrısı yapmadığını doğrulayan test eklensin; `server/test/mock-pazaryeri.js`'e `/v2/products` ve `/items/unsupplied` yolları eklensin. | Bu oturum `server/test`'e yazamıyor. |
| Ç5 | `server/test/cloud.test.js` | `'talep' == 'deneme'` hatası (müşteri kaydında lisans durumu). **Bu oturumun değişikliklerinden önce de var** (`22b1dae` üzerinde ayrı çalışma ağacında denendi). | `npm test` bu yüzden geçmiyor; diğer 6 test dosyası geçiyor. |
| Ç6 | `core/core.js` → `table()` | Dar ekranda isteğe bağlı kart görünümü (`mobileCard: (row) => html`). | E-ticaret sipariş listesinde program içinde yapıldı; diğer programlar da tabloyu telefonda yatay kaydırıyor. |
