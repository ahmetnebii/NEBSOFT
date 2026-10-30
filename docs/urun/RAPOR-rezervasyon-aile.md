# Rezervasyon ailesi raporu

Tarih 30.10.2026. Dal `claude/rezervasyon-aile-faf00d`. Push ve merge yapılmadı. Spec'ler kullanıcı onayına sunulur: `DUGUN.md`, `YURT.md`, `FOTOGRAF.md`, `OYUN.md`. Çekirdek istekleri: `CEKIRDEK-ISTEKLERI-rezervasyon-aile.md`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Durum |
|---|---|---|
| 1 | Dört programın fiyatı | ÖRNEK. Katalogda `ornekFiyat: true`, ama pazar yerinde bu etiket görünmez. Onay olmadan yayınlanmamalı. |
| 2 | Sözleşme, taahhütname, yayın izni şablonları | Örnek şablon. Avukat kontrolü gerekir. |
| 3 | Kapora iadesi, yüz yüze sözleşmede cayma, kapora planının taksitle satış sayılması | DOĞRULANAMADI. Program yasal oran göstermez. |
| 4 | Yurt: kimlik bildirim yolu, KBS bağlantısı | DOĞRULANAMADI. Bildirim gönderilmez, hazırlık listesi var. |
| 5 | Yurt: MEB yönetmeliğinin güncel hâli, sayısal oranlar | DOĞRULANAMADI (sonraki değişiklik). Yayından önce resmî metinden yeniden kontrol edilmeli. |
| 6 | Oyun: salona giriş yaşı, internet kafe yükümlülükleri, bakiye kartının 6493 durumu, çocuk bırakma | DOĞRULANAMADI. Yaş uyarısı varsayılan kapalı, model refakatli, bakiye tek işletmede. |
| 7 | 5395 Ek md. 1 uygulama usulü | DOĞRULANAMADI. Yalnız tarih izlenir. |
| 8 | Fotoğraf galerisi `acik` dosya sınıfında | Adres tahmin edilemez ama adresi bilen açabilir. Karar gerekli (Ç7). |
| 9 | SMS | Gerçek sağlayıcıyla denenmedi. Sağlayıcı yoksa TEST yazar. |
| 10 | e-Belge | Dört programda bağlı değil. Oyun adisyon fişi mali belge değildir. |
| 11 | Ortak üretilmiş sayfalar | `/programlar`, `/fiyatlar`, ana sayfa yeni programları `build-sites` çalıştırılana kadar göstermez (Ç8). |

## Yapılanlar

| Program | Ekran | Müşteri sayfası | Sunucu rolü |
|---|---|---|---|
| `dugun` | Takvim, etkinlik, talep, tahsilat, rapor, tanımlar | `salon.html` | Satış, Operasyon |
| `yurt` | Oda planı, öğrenci, giriş-çıkış, yoklama, izin, ziyaretçi, arıza, kimlik, personel | `veli.html` | Kayıt, Nöbetçi. Belge şifreli. |
| `fotograf` | Takvim, çekim, teslim takibi, galeri, tahsilat | `galeri.html` | Asistan, Fotoğrafçı |
| `oyun` | Salon panosu, adisyon, üye ve kart, çocuk alanı, doğum günü, olay, kasa | `kart.html` | Kasiyer, Görevli |

Tanıtım sayfaları, OG görselleri, ekran görüntüleri üretildi. Ekran görüntüleri demo verisindendir, örnek fotoğraflar çizimdir.

## Doğrulama

- `npm test` zinciri tek tek çalıştırıldı (hata çıkınca durmadan, benzersiz veritabanı adıyla): 55 adımın hepsi geçti. Dört hesap testi, kural testi ve uçtan uca test dahil.
- `server/test/rezervasyon-aile-uctan.test.js`: gerçek sunucu ve MariaDB ile lisans, belge kaydı, müşteri girişi, müşteri işlemi, dosya yükleme, yurt belgesinin şifreli saklanması.
- Tarayıcıda `?demo=1` ile dört programın tüm menü sayfaları açıldı, ana akışlar sonuna kadar çalıştırıldı, konsolda hata yok. Boş liste, telefon genişliği, koyu tema denendi.
- Binlerce kayıt: düğün ve fotoğrafta 6.000 kayıt, yurtta 1.500 öğrenci ve 40.000 hareket, oyunda 6.000 adisyon.
- Denenmeyen: bulut kipinde tarayıcıdan fotoğraf yükleme (sunucu ucu test edildi, tarayıcı küçültmesi yerel kipte denendi), yazdırma çıktısının kâğıda dökümü (belge üretimi denendi), imza kanvası (imza adımı denemede taklit edildi), gerçek SMS.

## Kullanıcıdan gerekenler

1. Dört programın fiyatını belirleyin ve spec'leri onaylayın.
2. Şablonları avukata gösterin.
3. Pilot yurttan KBS kullanımını, pilot oyun salonundan kolluk ve belediyenin 18 yaş altı uygulamasını öğrenin.
4. Fotoğraf galerisi için `acik` sınıf kabul mü, yoksa müşteri belirteçli dosya sunumu mu istiyorsunuz, karar verin.
5. Çocuk alanında "veli bırakıp gidebilir" akışı istiyor musunuz, karar verin. Şimdilik refakatli.
6. Birleştirmeden sonra `node site/tools/build-sites.js` çalıştırın.
