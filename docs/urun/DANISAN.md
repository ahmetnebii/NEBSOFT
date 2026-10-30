# Danışan Takibi: Diyetisyen, Psikolog, Fizyoterapist (`apps/danisan`)

Durum: kod geliştirildi, **satışa kapalı** (`market/catalog.js` `ready: false`). Spec kullanıcı onayı bekliyor. Tarih: 30.10.2026.

## CANLIYA ÇIKMAYI ENGELLEYENLER

1. **Avukat kontrolü yapılmadı.** Seans notu, ölçüm, öykü ve ilaç bilgisi özel nitelikli kişisel veridir. Satış açılmadan avukat şunları değerlendirmeli: NEBSOFT'un veri işleyen rolü, veri işleme sözleşmesi, onam metni, saklama ve silme süreleri, yurt dışına aktarım, psikolog notlarının gizliliği.
2. **KVKK md. 6/4 "yeterli önlemler" DOĞRULANAMADI.** Kurul kararının metni okunmadı. Programdaki önlemler bu karara göre denetlenmedi.
3. **Kişisel Sağlık Verileri Yönetmeliği DOĞRULANAMADI.** mevzuat.gov.tr adresi (`MevzuatNo=24657`) 404 döndü. Yürürlük ve serbest çalışan uzmana uygulanıp uygulanmadığı okunamadı.
4. **Sağlık Bakanlığı yükümlülüğü DOĞRULANAMADI.** e-Nabız bildirimi, reçete, meslek mensubu kayıt şartı bu üç meslek için incelenmedi. Program bu bağlantıları içermez.
5. **Psikolog ile psikiyatrist ayrımı ve meslek yetkisi DOĞRULANAMADI.** Program tanı kodu ve reçete tutmaz. Tanıtım tanı veya tedavi iddiası yazamaz.
6. **Şifreleme yalnız sunucudadır.** Sunucuya erişen yazılım veriyi okuyabilir (`server/cloud/belge.js`). Hesap sahibi kilitli notu da değiştirebilir, kural yalnız ekip hesaplarında çalışır.
7. **Fiyat örnektir:** `[449, 790, 1490]`.

## Doğrulanan kaynak

- 6698 sayılı Kanun md. 6, 7499 sayılı Kanunla 2.3.2024 değişikliği sonrası metin: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf, okundu 30.10.2026. DOĞRULANDI: işleme yasağı, istisnalar (a-g bentleri), (e) bendi sır saklama yükümlüsü kişiler, md. 6/4 ek önlem şartı.

## Uygulanan koruma

| Koruma | Yer |
|---|---|
| Belge veritabanında şifreli | `server/cloud/belge.js` `SIFRELI` |
| Toplu okuma kaydı | `server/cloud/routes.js` `HEALTH` |
| Sekreter: not, ölçüm, plan, sağlık alanı yok | `server/cloud/rol-kural.js`, arayüzde `clinical()` |
| Uzman: yalnız kendi danışanı | Sunucu `satir`, arayüzde `myS()` |
| Kilitli not değişmez, silinmez, yalnız ek | Sunucu `notKilit`, ekip hesapları için |
| Müşteri sayfası yok | `public-rules.js` kaydı bilerek eklenmedi |
| SMS'te hizmet ve uzmanlık yok | Yalnız tarih, saat, işletme adı |
| Kart görüntüleme kaydı, kişisel veri dışa aktarma, anonimleştirme | `core/kvkk.js` |
| Onam imzası, metni kurum yazar | Program hazır metin vermez |
| Pazarlama sitesi sayfası yok | `site/src/products.js` kaydı eklenmedi |

## Pazar araştırması

Türkçe, herkese açık özellik sayfası bulunan ürün sayısı az. Güvenilirliği düşük kaynaklar (test alanında yayınlanan SelfKlinik sayfası gibi) kullanılmadı. Fiyat toplanmadı, rakip metni kullanılmadı.

- DiyetimTakipte: diyetisyen ve danışanın birlikte kullandığı takip uygulaması. https://apps.apple.com/ao/app/diyetimtakipte/id1608540207
- Dietim: program izleme, randevu, hatırlatıcı. https://apps.apple.com/mk/app/dietim/id1636100228
- Fittut: diyet, ölçüm, mesajlaşma, randevu. https://apps.apple.com/de/app/fittut/id1519419503
- Hiwell: online psikolog ve diyetisyen görüşmesi, tüketici platformu. https://apps.apple.com/tr/app/hiwell-psikolog-ve-diyetisyen/id1506664037
- Carepatron (yabancı, Türkçe sayfalı): not kilitleme ve sağlayıcı imzası, yinelenen randevu. https://www.carepatron.com/tr/professionals/psychology-software/

Bu ürünlere özgü Şikâyetvar araştırması sonuç vermedi. Aşağıdaki ihtiyaçlar ürün sayfalarından ve sektör uygulamasından çıkarılmıştır, şikâyet kaydına dayanmaz.

| İhtiyaç | Özellik |
|---|---|
| Not sonradan değişmesin | Kilit ve ek yazma |
| Hatırlatma mesajı gizliliği bozmasın | Hizmet adı yazılmaz |
| Diyet ve fizik tedavide gelişim görünsün | Ölçüm ve grafik |
| Peşin alınan seans izlensin | Paket, kalan seans |

## Özellikler

| Özellik | Sınıf | Durum |
|---|---|---|
| Danışan kartı, sorumlu uzman | Olmazsa olmaz | Var |
| Randevu, çakışma kontrolü, seans kapatma | Olmazsa olmaz | Var |
| Seans notu, kilit, ek | Olmazsa olmaz | Var |
| Ödeme, makbuz, bakiye | Olmazsa olmaz | Var |
| Rol ayrımı, şifreli belge | Olmazsa olmaz | Var |
| Onam imzası | Olmazsa olmaz | Var, metin kurumdan |
| Ölçüm, grafik | Beklenen | Var, psikolog kartında kapalı |
| Plan yazdırma | Beklenen | Var |
| Seans paketi | Beklenen | Var |
| Toplu SMS hatırlatma | Beklenen | Var, sağlayıcı olmadan TEST |
| Uzman hakedişi | Beklenen | Yok |
| Besin veritabanı, kalori hesabı | Fark yaratan | Yok: sağlık iddiası riski |
| Test ve ölçek uygulama | Fark yaratan | Yok: telif ve mesleki yetki incelenmeli |
| Danışan portalı, online görüşme | Fark yaratan | Yok: avukat kararı gerekir |

## Çekirdek ihtiyacı

- `core/forms.js`: imzalı onam formları (`NS.forms`). Şu an onam `NS.sign` ile kart üzerinde.
- `core/kvkk.js`: anonimleştirme `adds` ve `title` alanlarını temizlemiyor; program bu alanları kendisi temizliyor.
- `core/kurulum-adimlari.js`, `core/notify.js`, `core/bizsite.js` kaydı.

## Deneme

`?demo=1`: tüm ekranlar, not ve kilit, ölçüm, paket düşümü, çakışma, TEST SMS metni, sekreter ve uzman görünümü, anonimleştirme penceresi. Konsol hatası yok. Bulutta şifreli saklama için tür listesi saf testle doğrulandı, gerçek veritabanında `npm test` zinciri çalıştırıldı (son rapora bakın).
