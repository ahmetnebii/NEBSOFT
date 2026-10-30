# Öğrenci Yurdu & Apart: ürün spesifikasyonu

Program kimliği `yurt`. Dal: `claude/rezervasyon-aile-faf00d`. Araştırma ve okuma tarihi 30.10.2026. Kullanıcı onayı bekliyor. Bu belge hukuki görüş değildir.

## CANLIYA ÇIKMAYI ENGELLEYENLER

| # | Konu | Etiket | Şimdiki davranış |
|---|---|---|---|
| 1 | Yurt, pansiyon ve apartın kimlik bildirim yolu: 1774 md. 6/c mi, md. 2 + Ek md. 1 (KBS'ye anlık) mı | DOĞRULANAMADI | Yalnız hazırlık listesi. "Gönderildi" yazmaz, kullanıcı "bildirimi yaptım" diye işaretler. |
| 2 | KBS, GSB bilişim sistemi, MEB modülü için üçüncü taraf API belgesi | DOĞRULANAMADI | Bağlantı yok, seçilemez. |
| 3 | MEB yönetmeliğinin 2020 sonrası değişiklik geçmişi | DOĞRULANAMADI | Metin okundu, oran ayar olarak gelir, yazılıma gömülü kesin kural değildir. |
| 4 | 5395 Ek md. 1 uygulama usulü | DOĞRULANAMADI | Belge adı kesinleştirilemedi. Program yalnız son ibraz tarihini izler. |
| 5 | Taahhütname metni | Örnek | "Örnek şablon" uyarısıyla gelir, avukat kontrolü gerekir. |
| 6 | Sayısal hükümler | Kontrol gerek | Oranlar 30.10.2026 okumasıdır. Yayından önce resmî metinden bir kez daha kontrol edilmeli. |
| 7 | Veli SMS'i | Test edilmedi | Sağlayıcı yoksa "TEST, gönderilmedi" yazar. |

## Pazar araştırması

Ürünler denenmedi. [Livinsoft](https://apps.apple.com/tr/app/livinsoft/id1567831708?l=en) tek modern rakip olarak göründü. [Hursoft](https://www.tamindir.com/indir/hursoft-yurt-programi/) ve [Microm](https://www.tamindir.com/indir/microm-yurt-otomasyonu/) eski masaüstü kayıtları. [Eyotek](https://apps.apple.com/tr/app/eyotek/id1571118477) yurda özgü değil. [Sabancı şartnamesi](https://mysu.sabanciuniv.edu/purchasing/sites/mysu.sabanciuniv.edu.purchasing/files/teknik_sartname_24.pdf) alıcı beklentisi için okundu (arama özeti).

| Tema (tek taraflı beyan) | Kaynak | Karşılayan özellik | Durum |
|---|---|---|---|
| Depozito iadesi gecikiyor, kesinti gerekçesiz | [Egeyurt](https://www.sikayetvar.com/egeyurt), [Özel yurt listesi](https://www.sikayetvar.com/ogrenci-yurdu/ozel), [Yakın Doğu](https://www.sikayetvar.com/yakin-dogu-universitesi/yurt) | Gerekçeli kesinti dökümü, iade son günü, Bekleyen iadeler listesi, oda teslim tutanağı | Var |
| Dönem ortası ayrılma bedeli belirsiz | Aynı kaynaklar | Rejime göre ayrılış önerisi, taahhütnamede oran | Var |
| Ücret dışı ek bedel | Egeyurt | Ücrete dahil hizmetler taahhütnamede yazar | Var |
| Bakım talebi sonuçsuz | Egeyurt | Arıza kaydı, portaldan bildirim, kapanış tarihi, ortalama kapanış raporu | Var |
| Veliye bilgi verilmemesi | [KYK örneği](https://www.sikayetvar.com/kredi-ve-yurtlar-kurumu/eryaman-yesilova-kiz-kyk-yurdu) | Veli portalı, izin ve geç dönüş bildirimi | Var, SMS sağlayıcıya bağlı |
| Oda değişimi anlaşmazlığı | Bulunamadı | Oda değişikliği kaydı | Var |
| Uygulama çökünce izin alınamaması | [Livinsoft yorumu](https://apps.apple.com/tr/app/livinsoft/id1567831708?l=en) | Yönetim ekranından elle izin | Var |

## Mevzuat

| İddia | Etiket | Kaynak |
|---|---|---|
| Yükseköğrenim: Yükseköğrenim Özel Barınma Hizmetleri Yönetmeliği | DOĞRULANDI | [RG 09.09.2022/31948](https://www.resmigazete.gov.tr/eskiler/2022/09/20220909-1.htm), değişiklik [30.10.2024](https://www.resmigazete.gov.tr/eskiler/2024/10/20241030-1.htm), [07.08.2026](https://www.resmigazete.gov.tr/eskiler/2026/08/20260807-2.htm) |
| Ortaokul-lise: Ortaokul ve Ortaöğretim Kurumları Özel Barınma Hizmetleri Yönetmeliği | DOĞRULANDI (metin), DOĞRULANAMADI (sonraki değişiklik) | [RG 11.09.2020/31241](https://www.resmigazete.gov.tr/eskiler/2020/09/20200911-2.htm) |
| Ayrılma: GSB md. 37/10, MEB md. 21/4 | DOĞRULANDI (metin) | Yukarıdaki metinler |
| Depozito en çok bir aylık ücret | DOĞRULANDI | GSB 37/9, MEB 21/5 |
| Kimlik bildirimi: yurtlar 1774 md. 6/c kapsamında, üç gün | DOĞRULANDI | [1774](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.1774.pdf) |
| Reşitlik 18, küçüğün sözleşmesinde temsilci | DOĞRULANDI | [TMK md. 11, 16](https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4721.pdf) |
| Velinin bilgilendirilmesini emreden hüküm | Metinde yok | Veli paylaşımı ürün kararıdır, yasal zorunluluk diye yazılmaz. |
| Çocuk verisi: veri azaltma, ayrı aydınlatma ve rıza | DOĞRULANDI | [KVKK Yayın 91](https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/f506d8fe-9f36-4538-bce9-a05a5ca8d8e6.pdf), [İlke Kararı 2026/347](https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu) |
| Parmak izi | DOĞRULANAMADI | Program parmak izi kullanmaz. |

## Özellikler

| Özellik | Sınıf | Durum | Kaynak |
|---|---|---|---|
| İki rejim, kurum türü | Olmazsa olmaz | Var | Mevzuat |
| Kat, oda, yatak, kapasite ve cinsiyet denetimi | Olmazsa olmaz | Var | Pazar, mevzuat |
| Kayıt, taahhütname (NS.docs, 16 px), reşit değilse veli imzası | Olmazsa olmaz | Var, örnek şablon | Mevzuat |
| Dönem ücreti, taksit, depozito, tahsilat, makbuz | Olmazsa olmaz | Var | Pazar |
| Ayrılış hesabı | Olmazsa olmaz | Var, öneri | Mevzuat, şikâyet |
| Giriş-çıkış, son giriş saati, yazılı izin | Olmazsa olmaz | Var | Mevzuat |
| Yoklama, ziyaretçi defteri | Olmazsa olmaz | Var | Mevzuat |
| Roller sunucuda, belge şifreli | Olmazsa olmaz | Var | CLAUDE.md |
| Veli portalı, izne bağlı paylaşım | Beklenen | Var | Görev, mevzuat |
| Kimlik bildirim hazırlık listesi, üç gün sayacı | Beklenen | Var | Mevzuat |
| Oda değişikliği, arıza, personel belge takibi | Beklenen | Var | Pazar, mevzuat |
| Nöbet ve disiplin defteri, yemek listesi | Beklenen | Yok | Mevzuat |
| Kayıt yenileme sırası, zam üst sınırı hesabı | Beklenen | Yok | Mevzuat |
| Depozito dökümü | Fark yaratan | Var | Şikâyet |
| Fotoğraflı oda teslimi, oda arkadaşı eşleşmesi, QR geçiş | Fark yaratan | Yok | Pazar |
| e-Belge | Beklenen | Yok | Pazar |

## Kişisel veri ve erişim

| Rol | Görür | Yazar |
|---|---|---|
| Yönetici | Her şey | Her şey |
| Kayıt / Muhasebe | Kayıt ve ödeme. Sağlık, hareket, yoklama, izin gitmez. | Kayıt, ödeme. Ayrılış yönetici PIN'i ister. |
| Belletmen / Nöbetçi | Ad, oda, veli telefonu, kısa acil not, "reşit değil" bilgisi. Kimlik, sağlık, doğum tarihi, ücret, kod gitmez. | Hareket, yoklama, izin, ziyaretçi, arıza |
| Veli (portal) | Kendi çocuğu: durum, 30 gün hareket, izin, ödeme | İzin isteği, izin teyidi |
| Öğrenci (portal) | Kendisi | İzin isteği, arıza |

Veli kodu ile öğrenci kodu ayrıdır. Reşit öğrencinin velisi yalnızca kayıtlı izinle girer; izin geri alınınca açık oturum da veri görmez. Doğum tarihi yoksa paylaşım kapalıdır, kayıtta zorunludur.

Mevzuatta veliye bildirim hükmü olmadığından varsayılan olarak hareket başına SMS kapalıdır, Ayarlar'dan açılır.

## Sonraki dalga önerisi

Yönetmelik defterleri (nöbet, disiplin, yemek), kayıt yenileme ve zam hesabı, fotoğraflı oda teslimi, e-Belge.
