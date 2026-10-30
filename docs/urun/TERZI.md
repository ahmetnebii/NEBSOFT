# Terzi & Tadilat: ürün spesifikasyonu

Durum: **kullanıcı onayı bekliyor.** Görev verenin isteğiyle temel ve beklenen dalga spec'ten sonra geliştirildi. Program kimliği `terzi`, kod `apps/terzi/`, ortak motor `apps/siparisortak/`.

## Pazar araştırması (okuma: 2026-10-30)

Türkiye'de terzi atölyesine özel, olgun, herkese açık özellik sayfası olan yazılım **bulunamadı**. Bulunanlar yeni, yorumsuz mobil uygulamalar. Bu sektörde 3-5 Türk ürünü şartı karşılanamadı: rapora yazıldı. Google Play sayfaları okunamadı.

| Ürün | Kaynak | Öne çıkan ihtiyaç |
|---|---|---|
| Terzi Defteri | https://apps.apple.com/ke/app/terzi-defteri/id6499427515 | Ölçü, borç, kıyafet kalemi, model resmi |
| Vipgelinlik (müşteri uygulaması, atölye yazılımı değil) | https://apps.apple.com/dz/app/vipgelinlik/id1494489024 | Randevu takvimi |
| Tailored Made (uluslararası) | https://apps.apple.com/us/app/-/id6445846228 | Erkek ve kadın ölçü formu, iş takibi |
| Teilorr (uluslararası) | https://apps.apple.com/ca/app/teilorr/id6753590166 | Teslim hatırlatması, kıyafet türü tanımlama |

SadeRandevu, TailorPad ve Easy Tailor yalnız arama özetinden görüldü: sayılmadı.

Yazılıma özel şikâyet **bulunamadı**, incelenen uygulamalarda okunabilir yorum yok. Aşağıdakiler tek bir terzi markasının hizmet şikâyetleridir, sektörün tamamını temsil etmez.

## Şikâyetlerin karşılanması

| Şikâyet | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Aşırı daraltma, yanlış boy | [Terzi Adem Altun](https://www.sikayetvar.com/terziademaltun/ankara) | Satırda önceki ve istenen ölçü, fişte yazılı | Var |
| Onaysız tadilat | Aynı kaynak | Fişte müşteri imzası: işlem ve ölçü onayı | Var |
| Yapılmayan iş, nişan riske girdi | Aynı kaynak | Etkinlik tarihi, geri sayım, teslim etkinlikten sonraysa uyarı | Var |
| Eksik ölçü alanı (yazılım) | [Shopify yorumu, arama özeti](https://apps.shopify.com/tailor-suit-shop/reviews) | Kendi ölçü şablonunuz | Var |

## Özellikler

### Olmazsa olmaz

| Özellik | Durum | Kaynak |
|---|---|---|
| Ölçü kaydı, kadın, erkek, gelinlik şablonu | Var | Terzi Defteri, Tailored Made |
| Prova tarihi ve düzeltme notu | Var | Araştırma |
| Teslim tarihi, iş panosu | Var | Teilorr |
| "Hazır" SMS'i; bağlı değilse TEST yazar | Var | `CLAUDE.md` §1 |
| Kapora, kalan | Var | Terzi Defteri |
| İşlem fiyat listesi | Var | Çıkarım |

### Beklenen

| Özellik | Durum | Kaynak |
|---|---|---|
| Ölçü geçmişi, tarih ve fark | Var | Çıkarım |
| Özelleştirilebilir ölçü şablonu | Var | Teilorr, Shopify yorumu |
| Önceki ve istenen ölçü | Var | Şikâyet |
| Müşteri imzası | Var | Şikâyet |
| Etkinlik tarihi uyarısı | Var | Şikâyet |
| Prova hatırlatma SMS'i | Var | Teilorr |
| Askı fişi (`NS.docs`) | Var | Çıkarım |
| Model ve kumaş fotoğrafı | Var | Terzi Defteri |
| Takip sayfası | Var | Çıkarım |
| Rol: usta ölçü silemez, fiyat değiştiremez (sunucuda) | Var | Çıkarım |

### Fark yaratan (yapılmadı)

| Özellik | Durum |
|---|---|
| Usta başına iş ve prim | Yok; iş ataması var |
| Online prova randevusu | Yok |
| Kumaş stoğu | Yok |
| Barkodlu askı takibi | Yok |

## Bilinmeyenler

- Ölçü alanları ve işlem adları hafızadan alındı, doğrulanmadı. Kullanıcı veya pilot terzi gözden geçirmeli.
