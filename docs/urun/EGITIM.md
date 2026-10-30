# Eğitim & Sertifika Merkezi (`apps/egitim`)

Durum: temel dalga ve beklenenler geliştirildi, spec kullanıcı onayı bekliyor. Tarih: 30.10.2026.

## CANLIYA ÇIKMAYI ENGELLEYENLER

- **Fiyat örnektir:** `[549, 990, 1890]`, Kurs & Etüt ile aynı başlangıç. Onayınız gerekir.
- **Resmî geçerlilik iddiası yoktur:** Belge, doğrulama sayfası ve katalog "kurumun kendi belgesi" der. e-Devlet, MEB, MYK veya üniversite bağlantısı yoktur. Tanıtımda "onaylı sertifika" denemez.
- **İade kuralı DOĞRULANAMADI:** Kurs programındaki md. 56 hesabı MEB'e bağlı özel öğretim kurumları içindir. Bu program farklı kurum türlerine satılacağı için aynı hesap uygulanmadı. İade tutarı elle yazılır, sözleşme metni kuruma aittir.
- **Sözleşme metni avukat görmeli:** Program hazır iade metni vermez.

## Pazar araştırması

Kaynaklar üretici sayfaları ve Şikâyetvar kayıtlarıdır, fiyat toplanmadı. Rakip metni veya tasarımı kullanılmadı.

- Hursoft Kurs Otomasyonu: sınıf, öğrenci, ödeme planı, yoklama, sınav. https://www.tamindir.com/indir/hursoft-kurs-otomasyonu/amp/
- Bilsa: eğitim kurumu yönetimi, ders dağıtımı. https://bilsa.com.tr/en/fiyatlandirma/web/
- Odoo eğitim modülü: öğrenci, sertifika, gecikme, iade. https://ecosire.com/tr/blog/odoo-for-education-institutions
- ODTÜ-SEM düzenlemesi: sertifika devam ve başarı şartına bağlı (yazılım değil, sektör uygulaması). https://www.lexpera.com.tr/resmi-gazete/metin/orta-dogu-teknik-universitesi-surekli-egitim-merkezi-odtu-sem-sertifikaya-yonelik-egitim-programlari-1

Şikâyetler ve karşılayan özellik:

| Şikâyet | Kaynak | Özellik |
|---|---|---|
| Program bitti, sertifika aylarca gelmedi | https://www.sikayetvar.com/istanbul-universitesi/sertifika | Belge bekleyen sayacı, teslim durumu, hazır bildirimi |
| Ödeme yapıldı, belge teslim edilmedi | https://www.sikayetvar.com/kariyer-adam | Teslim takibi; ödeme şartı ayarı |
| Belge e-Devlet'te görünmüyor, beklenti yanlış kuruldu | https://www.sikayetvar.com/kariyer-adam/sertifika-sureci-ve-e-devlet-kaydi-sorunu-kariyer-adam-deneyimim | Belgede ve doğrulamada açık "resmî onay taşımaz" yazısı |
| Kurum yanıt vermiyor | https://www.sikayetvar.com/gen-academy/executive-sertifikamin-verilmemesi-ve-cevapsiz-iletisim | Kursiyerin kod ile kendi belgesini doğrulaması |

Not: Şikâyetler rakip ürünün yazılımına değil kurumların hizmetine aittir; karşılanan ihtiyaç kurum tarafının takip eksiğidir.

## Özellikler

| Özellik | Sınıf | Durum |
|---|---|---|
| Eğitim kataloğu, grup, kontenjan | Olmazsa olmaz | Var |
| Otomatik oturum takvimi, saat bazlı yoklama | Olmazsa olmaz | Var |
| Taksit, tahsilat, makbuz, ayrılış | Olmazsa olmaz | Var, iade elle |
| Şart kontrolü: devam, not, ödeme | Olmazsa olmaz | Var |
| Sertifika `NS.docs` şablonuyla, karekodlu | Olmazsa olmaz | Var |
| Şartsız belge: neden ve yetkili onayı | Beklenen | Var, kayıtta işaretli |
| Toplu üretim, teslim takibi | Beklenen | Var |
| Doğrulama sayfası, iptal görünür | Beklenen | Var |
| Eğitmen rolü: yalnız kendi grubu | Beklenen | Var, sunucu kuralıyla |
| Eğitmen saat hakedişi | Beklenen | Var |
| Ön kayıt | Beklenen | Var |
| İmzalı kayıt formu (`NS.forms`) | Beklenen | Yok: `core/forms.js` kaydı gerekir. Kayıt formu `NS.docs` ile yazdırılır |
| Kursiyer portalı | Fark yaratan | Yok, sonraki dalga |
| Online eğitim bağlantısı | Fark yaratan | Yok |
| Rozet, LinkedIn paylaşımı | Fark yaratan | Yok |

## Çekirdek ihtiyacı

- `core/forms.js`: `egitim` kaydı (kayıt sözleşmesi, imzalı).
- `core/kurulum-adimlari.js`, `core/notify.js`, `core/bizsite.js`, `core/integrations.js` `appName`.

## Deneme

`?demo=1`: tüm ekranlar, yeni kayıt, taksit, yoklama, toplu belge, yazdırma, doğrulama (geçerli, iptal, yok), TEST SMS. Konsol hatası yok. 5.000 kursiyerde liste 34-101 ms. Aynı gruba 5.000 kişi yazılınca grup sayfası 2 sn sürüyor; kontenjanlı grupta bu senaryo gerçekçi değil. Telefon genişliği son kalite kapısında denendi. Bulut doğrulama akışı gerçek sunucuda denenmedi, kural saf testle sınandı.
