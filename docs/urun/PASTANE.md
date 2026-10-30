# Fırın & Pastane: ürün spesifikasyonu

Durum: **kullanıcı onayı bekliyor.** Görev verenin isteğiyle temel ve beklenen dalga spec'ten sonra geliştirildi. Program kimliği `pastane`, kod `apps/pastane/`, ortak motor `apps/siparisortak/`.

## Pazar araştırması (okuma: 2026-10-30)

Metinler satıcı sayfalarıdır, sayfa özetleri araçla alındı.

| Ürün | Kaynak | Öne çıkan ihtiyaç |
|---|---|---|
| PastaTakip | https://pastatakip.com/ | Sipariş görseli, kapora izleme, teslim saati, WhatsApp onayı |
| Webticari Fırın | https://webticari.net/firin-programi | Üretim fişi, reçeteden düşüm, şube transferi, zayi ve bayat iade |
| Lotus Pecas | https://www.lotuspecas.com.tr/pastane-yazilimi/ | Üretim takibi, fire, POS |
| Aybit POS | https://www.aybitpos.com/pastane-firin-pos-adisyon-sistemi-cafe-programi/ | Reçeteli üretim, çok şube |
| Tabpad | https://www.tabpadmenu.com/pastane-adisyon-sistemi | Mobil sipariş, stok ve maliyet |

Zükkan, Lisa ve Simpra yalnız arama özetinden görüldü: sayılmadı. Bulgu: özel sipariş ile üretim ve zayiyi tek üründe birleştiren Türk ürün **bulunamadı** (bulunamadı, yok demek değildir).

Yazılıma özel şikâyet ve mağaza yorumu **bulunamadı**. Aşağıdakiler pastane ve teslimat şikâyetidir, arama özetinden görülmüştür.

## Şikâyetlerin karşılanması

| Şikâyet | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Görselden farklı pasta | [Trendyol](https://www.sikayetvar.com/trendyol/siparis-edilen-pastanin-gorselden-tamamen-farkli-gelmesi-ve-cozum-sunulmamasi) | Sipariş kartı, örnek görsel kaydı, yazı harfi harfine | Var |
| Çilekli yerine çikolatalı, kanıt yok | [Limon Çiçek](https://www.sikayetvar.com/limoncicekcom/cilekli-pasta-yerine-cikolatali-pasta-gonderilmesi-ve-ucret-iadesi-reddi) | Tat alanı fişte, teslim fotoğrafı | Var |
| Dağılmış pasta | [Pelit](https://www.sikayetvar.com/pelit-pastanesi/fatih-subesinde-dagilmis-pasta-ve-eksik-paketleme-sikayeti) | Teslim fotoğrafı | Kısmen |
| Özel gün bozuldu, sipariş karıştı | [Pasta Canavarı](https://www.sikayetvar.com/pasta-canavari/isparta-pasta-canavarinda-siparis-skandali-ozel-gunum-mahvoldu) | Teslim saati zorunlu, saate göre takvim, saat başına sınır | Var |
| Taze değil | [Meydani](https://www.sikayetvar.com/meydani-pastanesi/taze-olmayan-pasta-ve-yetersiz-musteri-hizmeti-nedeniyle-yasanan-magduriyet) | Üretim planı teslim gününe göre | Kısmen: raf ömrü takibi yok |
| Kapora iadesi | Doğrudan pastane şikâyeti bulunamadı | Kapora, iade kaydı ve fişte işletmenin kendi koşul metni | Var |

## Özellikler

### Olmazsa olmaz

| Özellik | Durum | Kaynak |
|---|---|---|
| Özel sipariş: kişi, tat, yazı, alerji | Var | PastaTakip |
| Kapora, bakiye, iptalde iade kaydı | Var | PastaTakip |
| Teslim saati zorunlu | Var | PastaTakip |
| Reçete ve birim maliyet | Var | Webticari |
| Üretim planı: siparişler + tezgâh | Var | Webticari |
| "Hazır" SMS'i; bağlı değilse TEST yazar | Var | `CLAUDE.md` §1 |

### Beklenen

| Özellik | Durum | Kaynak |
|---|---|---|
| Malzeme stoğu, üretimle düşüm (iki kez düşmez) | Var | Webticari |
| Malzeme ihtiyacı ve eksik uyarısı | Var | Çıkarım |
| Zayi ve neden raporu | Var | Webticari, Lotus |
| Satış fiyatına göre kâr | Var | Çıkarım |
| Saat başına iş sınırı uyarısı | Var | Çıkarım |
| Örnek görsel ve teslim fotoğrafı | Var | PastaTakip |
| Takip sayfası, özel sipariş talebi | Var | Zükkan (yalnız özet) |
| Adrese teslim, kurye | Var | Ortak |
| Rol: usta maliyeti görmez, reçete değiştiremez (sunucuda) | Var | Çıkarım |

### Fark yaratan (yapılmadı)

| Özellik | Durum |
|---|---|
| Şube ve üretimhane sevkiyatı, irsaliye | Yok |
| Reçeteyi kişi sayısına göre ölçekleme | Yok |
| Zayiye göre ertesi gün üretim önerisi | Yok |
| Gün sonu mutabakatı | Yok |

## Adisyon ile ilişki

İki program ayrı belgede çalışır. Tezgâh ve masa satışı Adisyon'da, özel sipariş ve üretim burada kalır. Şu an aralarında otomatik veri geçişi **yok**: Adisyon'da reçete veya menü içe aktarma ekranı bulunmuyor, programlar arası veri çekme ortak çekirdek işi. Sipariş tahsilatı Adisyon kasasına düşmez. İhtiyaç çekirdek istek dosyasına yazıldı.

## Bilinmeyenler

- Kapora ve cayma: **DOĞRULANAMADI.** mevzuat.gov.tr metni araçla okunamadı. Ticaret Bakanlığı rehberi ile bir arama özeti birbirini tutmadı. Bu yüzden program hazır iptal metni vermez; işletme kendi metnini yazar ve hukuk danışmanına doğrulatır.
- Usta hesabıyla açılan zayide maliyet boş kalır: usta maliyeti görmediği için hesaplayamaz. Yönetici raporu bu satırlarda maliyeti 0 gösterir.
