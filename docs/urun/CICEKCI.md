# Çiçekçi: ürün spesifikasyonu

Durum: **kullanıcı onayı bekliyor.** Görev verenin isteğiyle temel ve beklenen dalga spec'ten sonra geliştirildi. Program kimliği `cicekci`, kod `apps/cicekci/`, ortak motor `apps/siparisortak/`.

## CANLIYA ÇIKMAYI ENGELLEYENLER

- **Özel gün SMS'i kapalıdır.** Tanıtım içeren kutlama veya hatırlatma mesajı onay gerektirir (RG 15.07.2015/29417 Yönetmelik m.5, araçla okundu, 2020 değişikliği öncesi metin). Tanıtım içermeyen, müşterinin kurduğu hatırlatma için açık hüküm bulunamadı: **DOĞRULANAMADI.** İYS sayfaları okunamadı. Program bu yüzden yalnız işletmeye iç liste gösterir; müşteriye SMS göndermez. Sipariş ve teslim bildirimi tanıtım içermez, aynı yönetmelik m.6/2 kapsamında görünür; bu da hukukçuya doğrulatılmalı.

## Pazar araştırması (okuma: 2026-10-30)

| Ürün | Kaynak | Öne çıkan ihtiyaç |
|---|---|---|
| ÇiçekçiSitem | https://www.cicekcisitem.com.tr/ | Bölge ücreti, çelenk seçenekleri, kurye ve QR teslim |
| Çiçekçi barkod sistemi | https://www.barkod-programi.org/cicekci-barkod-sistemi/ | Saat aralığı, kart mesajı, kurye fişi, reçete, fire |
| Flowers Form 2.0 | https://www.tamindir.com/indir/flowers-form-20/ | Doğum günü hatırlatması, cari |
| Orest çiçekçi paketi | https://www.orestteknoloji.com/blogdetay/sanliurfa-cicekci-muhasebe-programi | Bileşen bazlı stok |
| Shipday (yabancı, genel) | https://www.shipday.com/campaign/flower-delivery | Fotoğraf ve imza kanıtı, rota |

Çiçeksepeti platformdur, yazılım rakibi sayılmadı. P'li Flower sayfası 404 verdi. Şikâyetler çiçek sipariş platformlarına aittir, çiçekçi yazılımına değil. Google Play yorumlarına erişilemedi. Kart notu ve çelenk şikâyeti **bulunamadı**.

## Şikâyetlerin karşılanması

| Şikâyet | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Yanlış adrese teslim | [Çiçeksepeti](https://www.sikayetvar.com/ciceksepeti/cicek-sepeti-yanlis-adrese-teslim-edilen-cicek-ve-yardimsiz-musteri-destegi) | Alıcı adı ve telefonu ayrı, adreste kat ve bölüm, kurye fişi | Var |
| "Teslim edildi" dendi, alıcı bulamadı | [Çiçeksepeti hastane](https://www.sikayetvar.com/ciceksepeti/hastanede-gerceklesmeyen-cicek-teslimati-ve-cevapsiz-musteri-destegi) | Teslim alan kişi adı zorunlu, teslim fotoğrafı, "Teslim edilemedi" nedeni | Var |
| Geç gelen, solmuş çiçek | [Taze Çiçek](https://www.sikayetvar.com/taze-cicek-tazecicekcom/gec-teslim-edilen-solmus-cicekler-sikayeti) | Saat aralığı, gecikme, parti ve kalan ömür | Var |
| Solmuş çiçek | [App Store](https://apps.apple.com/us/app/id723715907) | Ömrü azalan parti uyarısı, fire | Var |
| Takip yok | [Çiçeksepeti, yalnız başlık](https://www.sikayetvar.com/ciceksepeti/odeme-alindi-numarasi-gelmedi-teslimat-takibi-imkansiz) | Takip kodu ve sayfası | Var |

## Özellikler

### Olmazsa olmaz

| Özellik | Durum | Kaynak |
|---|---|---|
| Gönderen ve alıcı ayrı | Var | Barkod sistemi |
| Saat aralığı | Var | Barkod sistemi, ÇiçekçiSitem |
| Kart notu, gizli gönderen, şerit yazısı | Var | ÇiçekçiSitem |
| Kurye atama, dağıtım ekranı | Var | ÇiçekçiSitem |
| Teslim kanıtı: kişi ve saat | Var | Şikâyetler |
| Teslimde gönderene SMS; bağlı değilse TEST | Var | ÇiçekçiSitem |
| Başarısız teslim kaydı, yeniden deneme | Var | Çıkarım |

### Beklenen

| Özellik | Durum | Kaynak |
|---|---|---|
| Bölgeye göre teslimat ücreti | Var | ÇiçekçiSitem |
| Kurye fişi (`NS.docs`) | Var | Barkod sistemi |
| Özel günler: iç hatırlatma listesi | Var, müşteriye SMS yok | Flowers Form |
| Çiçek partisi, kalan ömür, fire | Var | Barkod sistemi |
| Saat aralığı başına iş sınırı | Var | Çıkarım |
| Takip sayfası | Var; alıcı, adres, kart notu görünmez | Şikâyetler |
| Kurye rolü: yalnız kendi işi (sunucuda) | Var | Çıkarım |

### Fark yaratan (yapılmadı)

| Özellik | Durum |
|---|---|
| Buket reçetesi ve stoktan düşüm | Yok |
| QR ile kuryeye zimmet | Yok |
| Rota optimizasyonu | Yok |
| Müşteriye özel gün SMS'i | Kapalı, yukarıda |
| Online sipariş sayfası | Yok; mağaza sitesi eklentisi ayrı konu |
| Çelenk şerit önizleme onayı | Yok |
