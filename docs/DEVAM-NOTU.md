# Devam notu (30.10.2026)

Yeni oturum bu dosyayla başlar. Sonra `CLAUDE.md` ve `docs/DEVIR.md`. Ana dal: `devir/hepsi`.

## Yeni oturuma yazılacak cümle

> `docs/DEVAM-NOTU.md` dosyasını oku, "Sıradaki iş" bölümünden devam et.

## Kullanıcı kararları (uygulanacak, yeniden sorma)

- Eczane aktif satışı durduruldu. Mevcut lisanslar çalışır ve yenilenir, kod ve veri silinmez.
- Pazar genişleme Dalga 1 sırası onaylı: Teknik Servis, Oto Servis, Oto Yıkama, Spor, Randevu.
- Fotoğraflar ayrı dosya deposuna geçecek.
- Electron 45'e yükseltilecek.
- Kalan 9 programın rolleri sunucuya taşınacak.
- Alt ajan serbest.

## Arka planda çalışan dallar

Bu dallar bu oturum bitmeden yayınlanmış olmayabilir. `git branch -a` ile bak, `devir/hepsi` içinde yoksa birleştir.

| Dal | İçerik | Birleştirirken dikkat |
|---|---|---|
| `ozellik/dosya-deposu` | Dosya deposu, E-ticaret, Kiralama, Galeri fotoğrafları | Kiralama hasar fotoğrafı herkese açık olmamalı |
| `guvenlik/roller-son` | Kalan 9 program rolü, işleme bağlı onay belirteci | `rol-kural.js`, `routes.js` |
| `masaustu/electron-45` | Electron 45, küçük bulgular, `user` alanı şifreleme, test veritabanı adları | `secrets.js`, `sw.js` sürümü |

Bir dal yoksa veya commit içermiyorsa o iş yarım kalmıştır: `.claude/worktrees/` altındaki çalışma ağacına bak, yoksa işi yeniden başlat.

Birleştirme sırası: dosya deposu, roller, Electron. Her birleştirmeden sonra `sw.js` V artır, `node site/tools/build-sites.js`, sonunda tam `npm test` (MariaDB gerekir, aşağıda), `node scripts/hosting-paketi.js`, `git push`.

## Sıradaki iş

1. Yukarıdaki dalları birleştir, tam `npm test` çalıştır.
2. Son birleşik hâli tarayıcıda dene: telefon genişliği, koyu tema, boş liste, hata durumları (`CLAUDE.md` §3). Rollü hesapla henüz tarayıcıda açılmayanlar: musavir, otoservis, adisyon, kuyumcu, otel, randevu, site, galeri, eticaret.
3. Dalga 0 satışa hazırlık (`docs/pazarlama/PAZAR-GENISLEME.md`), yalnız kod işi olanlar. Kullanıcı bilgisi isteyenleri beklet.
4. `docs/DEVIR.md` ve `docs/GUVENLIK-RAPORU.md` güncelle.

## Kullanıcıdan beklenenler

- Alan adı ve HTTPS. Gelmeden `sunucu.json` HTTP adresi kalkmaz, exe ve apk derlenmez.
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
