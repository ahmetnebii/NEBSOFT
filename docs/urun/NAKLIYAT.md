# Evden Eve Nakliyat — ürün spesifikasyonu

Program: `apps/nakliyat/`, ortak saha motoru `apps/saha-ortak/`. Durum: **kullanıcı onayı bekliyor** (temel ve beklenen dalga geliştirildi, görev bunu istedi). Araştırma tarihi: 2026-10-30.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| Konu | Etiket | Not |
|---|---|---|
| Örnek sözleşme metni | DOĞRULANAMADI | Metin "örnek şablon"dur, hukuki kesinlik iddia edilmez. Avukat incelemesi gerekir. |
| Karayolu Taşıma Yönetmeliği'nin güncel hâli | DOĞRULANAMADI | Okunan metin 8.1.2018 tarihli RG arşivi. Bakanlık PDF'i bağlantıyı reddetti, mevzuat.gov.tr adresi 404 verdi. 2018 sonrası değişiklikler denetlenmedi. |
| Yük (emtia) sigortası zorunluluğu | DOĞRULANAMADI | md. 1-57'de hüküm bulunmadı, md. 58-82 okunamadı. Program sigorta alanını isteğe bağlı tutar, "zorunlu" demez. |
| Ürün fiyatı | Kullanıcı kararı | Katalogdaki fiyat örnektir. |

## Mevzuat

| İddia | Etiket | Kaynak |
|---|---|---|
| Ticari taşınma eşyası taşımacılığı için C3 (md. 6/3-c), K3 (md. 6/8-c) yetki belgesi | DOĞRULANDI (2018 metni) | [RG 8.1.2018/30295](https://www.resmigazete.gov.tr/eskiler/2018/01/20180108-1.htm) |
| Eşya taşımaları taşıma senetsiz yapılamaz (md. 40/8) | DOĞRULANDI (2018 metni) | Aynı |
| Taşıma senedi alanları: taşıyıcı, gönderen, alıcı unvan-adres-iletişim; eşyanın cinsi, miktarı; teslim alma ve teslim yerleri; taşıma süresi; ücret; vergi kimlik no (md. 39/2) | DOĞRULANDI (2018 metni) | Aynı. Program bu alanların hepsini basar. |
| Makul süre taahhüdü (md. 40/7), kayıp ve hasarda sorumluluk (md. 40/9), hasarda tespit ve tutanak (md. 40/14) | DOĞRULANDI (2018 metni) | Aynı. Tutanak ekranı buna dayanır. |

Yetki belgesi tür ve numarası Ayarlar'da tutulur; program belgenin geçerliliğini denetlemez.

## Pazar araştırması

Ürünler: [Fenesoft Evden Eve](https://www.fenesoft.com/yazilim/evden-eve-tasimacilik/) (teklif, müşteri, kasa), [Nakliyat.app](https://nakliyat.app/) (talep kaynağı, PDF ve onay bağlantılı teklif, teklifi işe çevirme), [Rocketly Nakliyat](https://gorocketly.com/sektorler/nakliyat) (talep formundan teklif ve sözleşme PDF'i), [Rapitek CRM](https://rapitek.com/nakliyat-evden-eve-crm/), [Kurumsal Key](https://www.kurumsalkey.com/evden-eve-nakliyat-yonetim-yazilimi/). Hepsi satıcının kendi sayfası; iddialar bağımsız doğrulanmadı.

Şikâyet kaynakları (tek taraflı kullanıcı beyanı): [Deniz Nakliyat ek ücret](https://www.sikayetvar.com/deniz-nakliyat-izmir/deniz-nakliyat-izmir-ev-tasima-surecinde-yasanan-eksiklikler-ve-ek-ucret-talebi), [Armut kapora iadesi](https://www.sikayetvar.com/armut/kapora-iadesi-yapilmiyor-nakliyat-sirketi-cevapsiz), [Sedat Nakliyat](https://www.sikayetvar.com/sedat-nakliyat/yaniltici-firma-ve-haksiz-para-talebiyle-magduriyet), [Posta: "eşya fazla" haberi](https://www.posta.com.tr/galeri/yarisi-paketlenince-gercek-yuzleri-cikiyor-ev-tasimada-esya-fazla-vurgunu-2983210).

| Şikâyet | Karşılayan özellik |
|---|---|
| Taşıma günü ek ücret, "eşya fazla çıktı" | Teklif kilidi: onaylanan fiyat değişmez, fark gerekçeyle ek teklif olur, müşteri onaylamadan toplama girmez |
| Hasar ve kayıp, kanıt yok | Eşya envanteri, fotoğraf, hasar tutanağı, kapanmamış hasar uyarısı |
| Sözleşme veya belge verilmiyor | Örnek sözleşme, taşıma senedi, imzalı teslim |
| Kapora iade edilmiyor | Kapora ve iade ayrı kayıt, açık iade listesi |
| Ekip gelmedi, ulaşılamıyor | Takip sayfası, ekip ve saat bilgisi, durum geçmişi |

## Özellikler

| Sınıf | Özellik | Durum |
|---|---|---|
| Olmazsa olmaz | Talep kaydı, kaynak bilgisi | Var |
| Olmazsa olmaz | Keşif: oda bazlı eşya envanteri, hacim (m³) | Var |
| Olmazsa olmaz | Teklif hesabı (hacim, mesafe, kat, paketleme), kalem düzenleme | Var |
| Olmazsa olmaz | Örnek sözleşme ve taşıma senedi (imzalı, NS.docs) | Var |
| Olmazsa olmaz | Araç ve ekip takvimi, çakışma uyarısı | Var |
| Olmazsa olmaz | Kapora, tahsilat, kalan | Var |
| Olmazsa olmaz | Rol: saha ekibi yalnız kendi işini görür (sunucu) | Var |
| Beklenen | Müşteri takip sayfası: teklif onayı, ek teklif, puan (`takip.html`) | Var |
| Beklenen | Hasar tutanağı, fotoğraf | Var |
| Beklenen | Araç muayene ve sigorta bitiş uyarısı | Var |
| Beklenen | SMS bildirim (TEST ayrımlı), e-Belge (`NS.ebelge.create`) | Var |
| Fark yaratan | Teklif kilidi ve ek teklif onayı | Var |
| Fark yaratan | Eşya depolama, asansör kiralama takibi | Yok, sonraki dalga |
| Fark yaratan | Reklam kaynağı başına dönüşüm raporu | Kısmen: kaynak dağılımı var |
| Fark yaratan | Harita üzerinde rota, canlı araç konumu | Yok: doğrulanmış sağlayıcı yok |

## Yapılmayan veya doğrulanmayan

- U-ETDS bildirimi yoktur. Yönetmelik md. 40/6 (2018 metni) C3 ve K3 için kabulden en geç 6 saat içinde U-ETDS kaydı ister: DOĞRULANDI, güncel hâli DOĞRULANAMADI. Canlı engeli, `docs/test/saha-hizmet.md` E1.
- Taşıma irsaliyesi yoktur (md. 39/1, 39/2). Canlı engeli, aynı rapor E2.
- Fiyat hesabındaki birim ücretler işletmenin ayarıdır, program piyasa fiyatı önermez.
- Pilot işletme denemesi yapılmadı.
