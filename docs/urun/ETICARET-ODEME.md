# E-ticaret kart ödemesi

Güncelleme 31.10.2026: Vitrin iyzico dışında PayTR, Papara, Paynet ve Craftgate ile de çalışır (`server/cloud/odeme-saglayici.js`). Ödeme ancak Bağlantıyı dene geçince açılır. PayTR bildirimi `/api/odeme/paytr/bildirim/<işletme>`, Papara ve Paynet `/api/odeme/bildirim/<sağlayıcı>/<işletme>/<sipariş>`, dönüş `/api/odeme/donus/<işletme>/<sipariş>`. Canlı kilitler ve açık noktalar `docs/ENTEGRASYON-ENVANTERI.md`. Aşağısı iyzico akışıdır.

Borç tahsilatı (kurs, spor, site, eğitim) aynı sağlayıcı katmanını ve aynı geri çağrı uçlarını kullanır: `server/cloud/tahsilat-odeme.js`, `core/tahsilat.js`, `apps/egitim/odeme.html`. Durum `online_tahsilat` tablosundadır, kişisel bilgi tutulmaz. Test ödemesi borç kapatmaz. Vitrinden farkı: iade yalnız tam tutar, sipariş değil borç kalemi kapanır.

Durum: kod tamam, sahte iyzico sunucusuyla test edildi. Gerçek iyzico test hesabıyla denenmedi. Canlı mod kapalı.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Etiket | Gereken |
|---|---|---|
| Gerçek iyzico test hesabıyla uçtan uca deneme | DOĞRULANAMADI | Kullanıcı test anahtarını panele girer, test kartıyla ödeme, iade, iptal denenir |
| `paymentStatus` başarı değeri `SUCCESS` | DOĞRULANAMADI | Dokümanda tanımlı değil, webhook listesinden alındı. Test hesabında görülür |
| `identityNumber` zorunlu, bilinmiyorsa ne gönderileceği yazmıyor | DOĞRULANAMADI | Müşteriden T.C. kimlik numarası istenir, yabancı müşteri kartla ödeyemez. iyzico'ya sorulmalı |
| Checkout Form'da 3D Secure zorunluluğu | DOĞRULANAMADI | Dokümanda açık değil |
| Sepet toplamı ile `price` eşitliği, küsurat kuralı | DOĞRULANAMADI | Tek kalem gönderildiği için fark oluşmaz, test hesabında görülür |
| Webhook gövdesi | DOĞRULANAMADI | Dokümanda örnek JSON yok. Webhook yalnız tetikler, sonuç sorgulanır |
| Aynı gün tam iade `cancel`, sonrası `refund` | DOĞRULANAMADI | Test hesabında denenir |
| Mesafeli satış, ön bilgilendirme, KVKK metni: kimlik numarasının iyzico'ya aktarımı | Avukat | Metinler avukat onaylı değil |

Canlı kilit: sunucuda `IYZICO_CANLI=1` yoksa işletme test modunu kapatsa bile kart seçeneği görünmez.

## Kaynak

docs.iyzico.com, okundu 30.10.2026, sayfalarda sürüm tarihi yok: `getting-started/preliminaries/authentication/hmacsha256-auth`, `payment-methods/checkoutform/cf-implementation/cf-initialize` ve `cf-retrieve`, `advanced/response-signature-validation`, `advanced/refund-and-cancel`, `advanced/webhook`, `getting-started/preliminaries/sandbox`. Resmî SDK: github.com/iyzico/iyzipay-node (`lib/utils.js`).

## Akış

1. İşletme Entegrasyonlar > Online ödeme ekranında iyzico API anahtarlarını girer. Anahtarlar şifreli saklanır, tarayıcıya dönmez.
2. Vitrinde kart seçilir, sipariş `payStatus: bekliyor` ile açılır, stok ayrılır.
3. `POST /api/public/<işletme>/eticaret/odeme/baslat` tutarı siparişten alır, iyzico sayfasına yönlendirir. T.C. kimlik numarası yalnız iyzico'ya iletilir, kaydedilmez.
4. Müşteri kartı iyzico sayfasına girer. Kart bilgisi bu sunucudan geçmez.
5. `POST /api/odeme/iyzico/donus/<işletme>/<sipariş>` veya webhook sonucu tetikler. Sonuç her zaman iyzico'dan sorgulanır, imza, sipariş, para birimi ve tutar tutmadan "ödendi" yazılmaz.
6. `fraudStatus` 1: ödendi, 0: inceleme, -1: reddedildi. Tutmayan ödeme `kontrol` durumuna düşer, iptal edilmez.
7. 30 dakikada ödenmeyen sipariş iptal olur, stok ve kupon geri alınır. Önce iyzico'ya son kez sorulur.
8. İade panelden yapılır: `POST /api/eticaret/siparis/<id>/iade`. Aynı gün tam tutar iptal, diğerleri iade. Depo rolü iade yapamaz.

Webhook adresi: `/api/odeme/iyzico/webhook/<işletme>` (`GET /api/eticaret/odeme/durum` döner, panelde henüz gösterilmiyor).

## Kararlar

- Para doğrudan işletmenin iyzico hesabına geçer, NEBSOFT aracı değildir. Pazaryeri modeli yok.
- Sepet iyzico'ya tek kalem gider: kupon ve kargo kuruş farkı çıkarmaz, kısmi iade tek işlemden düşer.
- Taksit iyzico formunda seçilir (`enabledInstallments` gönderilmez). Sipariş tutarı `price` ile karşılaştırılır, vade farkı `paidPrice`tadır.
- Test ödemesi `payTest` ile işaretlenir, ciroya girmez.

## Yapılmayanlar

- PayTR, Param, Stripe. Kart saklama ve abonelik.
- Panelde webhook adresi ve bağlantı durumu gösterimi. Ödeme bildirim e-postası.
- Otel, randevu, bilet gibi diğer programlar.
- Webhook V3 imza doğrulaması: sonuç zaten sorgulandığı için gerekli değil, hesapta ayrıca açtırılması gerekiyor.
