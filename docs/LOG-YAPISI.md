# NEBSOFT günlük ve analitik yapısı

Kod: `server/cloud/log.js`, `server/cloud/analitik.js`, `server/cloud/analitik-api.js`, `core/olay.js`.
Testler: `server/test/log-maske.test.js`, `server/test/analitik.test.js`.

> **Hukuki durum: DOĞRULANAMADI.** Bu belgedeki saklama süreleri, rıza metni ve aydınlatma metni teknik varsayılandır.
> Hiçbiri mevzuat kaynağına dayandırılmadı. **Avukatla netleştirilecek.** Bkz. "Avukata sorulacaklar".

## 1. Tek ortak olay şeması

Her kanal aynı alanları üretir (`log.kayitOlustur`):

| Alan | Anlam |
|---|---|
| `zaman` | ISO 8601, UTC |
| `kanal` | `uygulama`, `denetim`, `analitik` |
| `seviye` | `bilgi`, `uyari`, `hata` |
| `olay` | Noktalı kısa ad: `api.hata`, `alarm.yavas`, `Giriş`, `katalog.oneri` (yalnız sayılar), `katalog.birlestirme` (denetim), `sablon.iceri_aktarildi` |
| `mesaj` | Maskelenmiş metin, en çok 500 karakter |
| `istek` | İstek kodu. 500 yanıtında kullanıcıya da döner, destek bununla kaydı bulur |
| `kullanici`, `isletme` | Kimlik numarası (ad veya e-posta değil) |
| `ip` | Uygulama kanalında günlük tuzlu özet, denetim kanalında ham IP |
| `sure` | Milisaniye |
| `veri` | Maskelenmiş yapısal veri |
| `hata` | `ad`, `kod`, `ileti`, `yigin`. SQL metni ve parametreleri bilerek alınmaz |

## 2. Üç kanal

| Kanal | Nereye yazılır | İçerik | Kullanım |
|---|---|---|---|
| **uygulama** | Standart çıktı (tek satır JSON, journald toplar) + uyarı ve hatalar `log_kayit` tablosu | Hata, uyarı, başlangıç, alarm | `log.uygulama.hata('api.hata', { hata: e })` |
| **denetim** | Mevcut `audit` tablosu | Giriş, onay, ayar değişikliği | `log.denetim('Giriş', { kullanici, isletme, ip, mesaj })` |
| **analitik** | Ham kayıt yok; yalnızca `an_toplam` saatlik sayaçları | Ziyaret, program, kaynak, huni, modül | `log.analitik('ziyaret', {...})` |

- `routes.js` içindeki `audit()` imzası değişmedi, tüm eski çağrılar aynı tabloya aynı alanlarla yazar. "Güvenlik Kayıtları" ekranı olduğu gibi çalışır.
- Fark: `detail` alanı artık maskelenir (telefon, TC, kart vb.). E-posta ve IP güvenlik kaydı için açık kalır.
- Yazıcı düşerse kayıt kaybolmaz; maskelenmiş hali standart çıktıya `uyari` olarak düşer. Eskiden audit hatası sessizce yutuluyordu.
- Hata fırtınasında `log_kayit` dakikada 60 satırla sınırlıdır, fazlası yalnızca standart çıktıya gider.

**Bilerek bağlanmayanlar:** `server/cloud/index.js` içindeki kurulum anahtarı satırı ve `server.js` içindeki "NEBSOFT çalışıyor" satırı düz kalır. Birincisini DEPLOY.md yöneticiye gösterir, maskelenirse kurulum yapılamaz; ikincisini başlatma betikleri ve testler bekler.

## 3. Maskeleme

İki katman birlikte çalışır:

**Alan adı** (büyük/küçük harf, Türkçe karakter, `camelCase`, `snake_case` fark etmez; kelime bazlı eşleşir, `tanim` veya `kartvizit` yakalanmaz):

| Sınıf | Örnek alanlar | Yerine yazılan |
|---|---|---|
| Gizli | parola, sifre, token, belirtec, apiKey, secret, authorization, cookie, session, otp, pin | `[GİZLİ]` |
| Kart | kart, cardNumber, cvv, cvc, skt, iban | `[KART]` |
| Kimlik | tc, tckn, vkn, kimlikNo, pasaport | `[KİMLİK]` |
| Telefon | telefon, phone, gsm, cep | `[TELEFON]` |
| Sağlık | tani, teshis, hastalik, ilac, recete, alerji, tedavi, muayene, sikayet, kanGrubu | `[SAĞLIK]` |

**Değer deseni** (serbest metin, hata iletisi ve yığın izinde de çalışır):

- Kart: 13–19 hane **ve** Luhn kontrolü. Rastgele uzun numara (sipariş no) maskelenmez.
- TC: 11 hane **ve** kontrol haneleri. Telefon: Türkiye sabit ve cep biçimleri.
- IBAN (TR). `parola=…`, `token: …`, `?token=…`, `Cookie: …`, `kullanıcı:şifre@` adres kimliği.
- `Bearer …`, JWT, bilinen anahtar önekleri (`sk-`, `sk_live_`, `AKIA`, `ghp_`, `xox…`, `AIza`), 32+ hex, 40+ base64url.
- Sağlık: `tanı: …`, `ilaç= …` gibi anahtarlı ifadeler.
- E-posta: uygulama ve analitik kanalında `al***@alan.com`, denetim kanalında açık.

**Sınır:** Etiketsiz serbest metindeki sağlık bilgisi (örn. "hasta diyabetli") desenle yakalanamaz. Bu yüzden uygulama verisi ve serbest metin günlüğe hiç verilmemelidir; analitik kanalı zaten yalnızca beyaz listedeki alanları alır.

## 4. Analitik

**Toplanan:** Yalnızca saatlik sayaç. Sayfa adresi, arama sorgusu, IP, tarayıcı kimliği saklanmaz.

| Tablo | İçerik | Ömür |
|---|---|---|
| `an_toplam` | gün, saat (Türkiye), tür, anahtar, ek, adet | `analitikGun` |
| `an_sistem` | gün, saat, uç nokta kalıbı, istek, 5xx, 4xx, yavaş, süre | `analitikGun` |
| `an_tekil` | gün + 32 hane tuzlu özet | Gün dönünce silinir |
| `log_kayit` | uygulama uyarı ve hataları | `uygulamaGun` |

- **Tekil ziyaretçi:** `HMAC(günlük tuz, IP + tarayıcı)`. Tuz `settings.an_tuz` içinde tutulur, her gün üzerine yazılır. Dünün özetleri bu sayede kimseyle eşleştirilemez ve silinir.
- **Rıza:** Sunucu `riza: true` görmeden sayaç artırmaz. `Sec-GPC: 1` veya `DNT: 1` rızadan önce gelir. Reddedende istek bile gönderilmez, ret de sayılmaz (bu yüzden rıza oranı bilinemez).
- **Kayıtlı müşteri:** Bant gösterilmez, Hesabım sayfasında aydınlatma bağlantısı vardır. Yalnızca **geçerli denemedeki** işletmenin açtığı bölüm adı sayılır; kimliği ve lisansı sunucu doğrular. Tarayıcıda "red" kararı varsa sayılmaz. Ücretli müşteride sayaç çalışmaz.
- **Huni:** Ziyaret ve demo rızalı sayaçtan, kayıt (`tenants`), deneme (`licenses`) ve ödeme (`orders`) işletmenin kendi kayıtlarından okunur. Bu üç adım analitik olayı değildir, geçmiş veri de görünür. Paydalar farklı olduğu için oran önceki adımdan büyükse "—" gösterilir.
- **Deneme sayımı sınırı:** Yöneticinin askıya aldığı veya iptal ettiği deneme lisansı, ödemeye dönmediyse sayılmaz. Kayıt ve sipariş tablosundaki saniye çözünürlüğü nedeniyle aynı saniyedeki deneme ve sipariş doğrudan satın alma sayılır (gerçekte beklenmez).

### `/api/olay` korumaları

- Aynı kaynak + `x-ns-csrf` başlığı. Başka siteden gönderilemez.
- Gövde en çok 2 KB (413). IP başına dakikada 120, tüm sunucuda dakikada 20.000 olay (429).
- Tür ve alan beyaz listesi, program kimliği katalogdan doğrulanır (400).
- Serbest değerli türlerde (kaynak, UTM, araç) günde en çok 300 farklı değer, fazlası `(diğer)`.
- Bellek tamponu 20.000 anahtarla sınırlıdır; bot kimlikleri sayılmaz.
- Sayaçlar tek süreçte bellektedir (DEPLOY.md: tek süreç). Canlıda nginx `limit_req` eklenmesi önerilir.

### Araçlar bölümü sözleşmesi

Kodda henüz "Araçlar" bölümü yok. Bölüm açılınca bir şey yazmaya gerek kalmadan sayılması için:

- `/araclar/<ad>` veya `#/araclar/<ad>` sayfasındaki program bağlantıları (`apps/<id>/`, `#/urun/<id>`, `#/dene/<id>`, `#/kayit/<id>`) otomatik geçiş sayılır.
- Başka yerde: `<a data-arac="kdv-hesap" data-program="muhasebe">`.

## 5. Hata ve yavaşlık alarmları

- Her API isteği uç nokta **kalıbıyla** sayılır (`/api/public/:slug/...`), gerçek adres ve belirteç kayda girmez. `/api/olay` ve toplu e-posta sayılmaz.
- Dakikada bir, son `pencereDk` dakikaya bakılır. `minIstek` altında alarm üretilmez.
- Alarm açılınca `alarm.hata` veya `alarm.yavas` günlüğe yazılır, panelde görünür, `alarmEposta` açıksa ana adrese saatte en çok bir e-posta gider.
- Etkin alarm bellektedir: sunucu yeniden başlarsa bir sonraki kontrolde yeniden hesaplanır.

## 6. Ayarlar ve saklama

Panel: **Analitik → Hata & Yavaşlık → Analitik, saklama ve alarm ayarları** (yalnız süper yönetici). Değişiklik denetim kaydına yazılır. Süresi dolanlar 6 saatte bir parça parça silinir.

| Ayar | Varsayılan | Aralık | Durum |
|---|---|---|---|
| Toplu analitik (`analitikGun`) | 365 gün | 7–1095 | **Avukatla netleştirilecek** |
| Uygulama günlüğü (`uygulamaGun`) | 90 gün | 7–365 | **Avukatla netleştirilecek** |
| Denetim kaydı (`denetimGun`) | 3650 gün (avukat görüşüne kadar) | 30–3650 | **Avukatla netleştirilecek** |
| Rıza kararı | 180 gün (kodda sabit) | - | **Avukatla netleştirilecek** |
| Tekil özet ve tuz | 1 gün (kodda sabit) | - | Tasarım gereği |

**Dikkat:**

- Denetim süresi `audit` tablosundan gerçek silme yapar. İlk kurulumda 3650 gün (avukat görüşüne kadar)den eski kayıt varsa silinir. Hukuken daha uzun tutma zorunluluğu çıkarsa ayar önce yükseltilmelidir.
- Sistem dışında kalanlar: journald (`/etc/systemd/journald.conf`), nginx erişim günlüğü (ham IP içerir), gece `mysqldump` yedekleri (DEPLOY.md: 14 gün). Silinen kayıt yedekte kalabilir.
- `leads.ip`, `users.last_ip`, `sessions.ip` ve `login_links.ip` alanları bu çalışmada değiştirilmedi, ham IP içerir.

## 7. Avukata sorulacaklar

Aşağıdakilerin hiçbiri doğrulanmadı (hafızadan, doğrulanmadı):

1. Tuzlu günlük özet KVKK anlamında kişisel veri midir, açık rıza gerekir mi, yoksa aydınlatma yeter mi?
2. Rıza bandının metni ve 180 günlük geçerlilik uygun mu?
3. Kayıtlı müşteride modül sayımı için hangi işleme şartı geçerli, aydınlatma yeterli mi, itiraz yolu gerekir mi?
4. Denetim kaydı (giriş ve IP) için asgari veya azami süre var mı? 5651 sayılı Kanun bu hizmete uygulanıyor mu?
5. Yukarıdaki tablodaki sürelerin her biri ve VERBİS kaydına etkisi.
6. `market.js` içindeki KVKK ve gizlilik metinlerine eklenen paragraflar (mevcut uyarı: metinler örnek şablondur).
