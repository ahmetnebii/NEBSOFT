# Çekirdek istekleri — İK ve Eczane (30.10.2026)

Program oturumu `core/`'a dokunmadı; ihtiyaçlar burada.

| # | Dosya | İstek | Neden | Şimdilik |
|---|---|---|---|---|
| 1 | `core/core.js` `crud` | "Excel (CSV)" `rowsFilter` ve kullanıcının gördüğü satırlarla sınırlansın | Şu an `app.db.all(col)` tüm kaydı verir: departman şefi başka departmanı dışa aktarabilirdi | İK şefte düğmeyi kaldırır |
| 2 | `core/core.js` `table` / `crud` | Sayfalama veya sanal liste | 8.000 ilaçta liste 4,9 sn, 2.000 personelde 2,6 sn | Yok |
| 3 | `core/core.js` `settingsPage` | Kullanıcı formuna uygulamaya özel alan (`userFields`) | Şefin departmanı formda seçilemiyor | İK Ayarlar'a ayrı kart eklendi |
| 4 | Sunucu / `NS.DB` | Rol kısıtının sunucuda zorlanması | Yetkiler yalnızca arayüzde: tüm veri tarayıcıya iner. Şefe maaş, kalfaya defter teknik olarak gizli değildir. **Sağlık ve maaş verisi için önemli** | Arayüzde gizli |
| 5 | `core/integrations.js` | `eczadeposu` sağlayıcıları `UNVERIFIED` listesine girsin | Depo API'leri doğrulanmadı ama listede yok | Program TEST sonucunu ayrıştırıyor |
| 6 | `sw.js` | `V` artırılmalı; `SHELL` listesi gerekiyorsa `/apps/ik/calisan.html`, `/apps/eczane/calc.js` | Görev gereği dokunulmadı | Yapılmadı |
| 7 | `core/docs.js` | Tablosuz belge için "Tutar" sütunu gizleme | Vardiya, puantaj, zimmet belgeleri tablo yerine not bloğu kullanıyor | Not bloğu |
| 8 | `package.json` | `npm test` zincirine ekleme | Görev gereği dokunulmadı | Aşağıda |
| 9 | `market/catalog.js`, `server/cloud/seo.js` | Çalışan portalı bağlantısı (`ik: ['calisan.html', 'Çalışan portalı', 'users']`) | Bulut sayfa listesi | Yapılmadı |

`package.json` `test` zincirine eklenecekler:

```
node server/test/ik-kural.test.js && node server/test/eczane-kural.test.js && node apps/ik/bordro.test.js && node apps/eczane/calc.test.js
```
