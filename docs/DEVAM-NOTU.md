# Devam notu (30.10.2026)

Yeni oturum bu dosyayla başlar. Sonra `CLAUDE.md` ve `docs/DEVIR.md`. Ana dal: `devir/hepsi`.

## Yeni oturuma yazılacak cümle

> `docs/PROJE-OZETI.md` ve `docs/DEVAM-NOTU.md` dosyalarını oku, projeyi baştan tarama, "Sıradaki iş" bölümünden devam et.

## Kullanıcı kararları (uygulanacak, yeniden sorma)

- Eczane aktif satışı durduruldu. Mevcut lisanslar çalışır ve yenilenir, kod ve veri silinmez.
- Pazar genişleme Dalga 1 sırası onaylı: Teknik Servis, Oto Servis, Oto Yıkama, Spor, Randevu.
- Fotoğraflar ayrı dosya deposuna geçecek.
- Electron 45'e yükseltilecek.
- Kalan 9 programın rolleri sunucuya taşınacak.
- Alt ajan serbest.

## Durum

Dosya deposu, kalan rol kuralları, işleme bağlı onay belirteci ve Electron 45 `devir/hepsi` içinde. Arka planda çalışan iş yok.

## Birleşen işler (30.10.2026)

Görsel ve PDF araçları ile yedi oturumun dalı `devir/hepsi`e birleşti, çekirdek yamaları uygulandı. Kalan çekirdek istekleri `docs/urun/CEKIRDEK-ISTEKLERI-*.md` içinde: `core/bizsite.js` sektör türleri (schema.org doğrulanmadan bağlanmaz), `NS.dosya` PDF desteği, müşteri belirteçli dosya sınıfı, `NS.crud` sayfalama. Yeni 11 programın şablonu yok (`server/cloud/sablon.js`). Spec, fiyat ve sözleşme metinleri onay bekliyor. `danisan` avukat onayına kadar satışa kapalı.

## Sıradaki iş

1. Yukarıdaki dalları birleştir, tam `npm test` çalıştır.
2. Son birleşik hâli tarayıcıda dene: telefon genişliği, koyu tema, boş liste, hata durumları (`CLAUDE.md` §3). Rollü hesapla henüz tarayıcıda açılmayanlar: musavir, otoservis, adisyon, kuyumcu, otel, randevu, site, galeri, eticaret.
2. Dalga 0 satışa hazırlık (`docs/pazarlama/PAZAR-GENISLEME.md`), yalnız kod işi olanlar. Kullanıcı bilgisi isteyenleri beklet.
3. `docs/DEVIR.md` ve `docs/GUVENLIK-RAPORU.md` güncelle.

## Kullanıcıdan beklenenler

- `www.nebsoftapp.com` için HTTPS kurulumu. Gelmeden `sunucu.json` HTTP adresi kalkmaz, exe ve apk derlenmez.
- Şirket unvanı, MERSİS, adres, KEP, gerçek destek telefonu ve saatleri.
- `NEBSOFT_SECRET` belirleme ve ayrı yedekleme. Kaybolursa şifreli veri geri gelmez.
- E-posta altyapısı. Yöneticiler telefonla iki adımlı girişi açacak.
- Trendyol stage, n11, e-Fatura ve Shopier test hesapları.
- Avukat ve mali müşavir kontrolü, İYS kaydı, `config/` içindeki gerçek fiyat ve süreler.
- Rol atamalarında kişi seçimi; sağlık ve İK işletmelerinde mevcut üyelere rol atanması.

## Çalışma notları

- MariaDB: `"$LOCALAPPDATA/MariaDB/mariadb-11.4.5-winx64/bin/mariadbd.exe" --datadir="$LOCALAPPDATA/MariaDB/data" --port=3306 --bind-address=127.0.0.1 --console` (arka planda; root şifresiz).
- Yerel sunucu: `PORT=5064 NEBSOFT_DATA=<geçici klasör> node server.js`. 5062 portunda eski bir sunucu çalışıyor olabilir, statik dosyaları bellekte tutar.
- Worktree alt ajanları eski `main`de açılır: dalı `origin/devir/hepsi`ten açmalarını söyle, sabit port ve benzersiz veritabanı adı ver, scratchpad'de kendi klasörünü kullansın.
- Dosya yamasında CRLF olabilir: satır sonunu normalleştirip yaz. Python: `python -X utf8`.
- Tarayıcı panelinde service worker kaydı her zaman "unknown error" verir, panele özgüdür. Gerçek Chrome'da doğrulanmadı.
- Commit mesajı Türkçe, sonu: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
