// Temizlik & Tesis kullanım kılavuzu içeriği. Biçim: docs/kilavuz/DURUM.md. Üretim: node scripts/kilavuz/uret.js temizlik
const { ortak, KONTROLLU } = require('./_saha');
module.exports = (O) => { const c = { is: 'ziyaret', Is: 'Ziyaret', isler: 'Ziyaretler', ekip: 'Ekip', ekipler: 'Ekipler', yeniEkip: 'Yeni ekip', stok: 'Malzeme Stoğu', form: 'Hizmet raporu', kalem: 'Kalemler ve ücret' }; const S = ortak(O, c);
  return {
    ne: 'Temizlik & Tesis, sözleşmeli periyodik hizmetlerin ziyaretlerini takvime üretir, ekipleri planlar, sahada kontrol listesi ve raporla işi kayda geçirir. Müşteri ziyaret geçmişini kendi sayfasından görür, ay sonunda yapılan ve gelinmeyen ziyaretlerden dönem kaydı çıkar.',
    kimler: 'Temizlik firmaları, apartman ve site görevli hizmeti verenler, ofis ve tesis temizliği yapan ekipler. Ofis ve saha ekibi ayrı çalışan işletmeler için uygundur.',
    ilkNot: 'Periyodik müşterinizi tek tek ziyaret olarak açmayın: **Sözleşmeler** sayfasından sözleşme açınca ziyaretler kendiliğinden üretilir.',
    ekrantanitim: S.tanitim,
    moduller: [S.ozet, S.bugun, S.takvim, S.isler({ gorev: [{ baslik: 'Kontrol listesi', ne: 'Maddeler hizmetten veya sözleşmeden gelir. Müşteri sayfasında **Yapılan kontroller** başlığıyla görünür.', sahneler: [{ git: 'isler', once: [['js', KONTROLLU]], kirp: '.card@Kontrol listesi', boy: 1300, adimlar: [['Yapılan maddenin kutusunu işaretleyin.', '[data-ck]']] }] }] }), S.musteriler, S.sozlesmeler, S.faturalar, S.ekipler, S.hizmetler, S.stok(), S.bildirimler, O.imzali(), O.belgeler({ tur: 'Hizmet raporu' }), O.ayarlar({ alanlar: S.ayarAlan }), O.ebelge(), O.entegrasyonlar()],
    roller: 'Saha ekibi kendi ekibinin ziyaretlerini görür, ücret bilgisini görmez. Ofis müşteri, sözleşme ve dönem kayıtlarıyla çalışır. **Ayarlar** yalnız yöneticiye aittir.',
    musteri: [{ ad: 'Ziyaret ve rapor sayfası', ne: 'Müşteri ziyaret kodunu yazarak aşamayı, kontrolleri ve raporu görür, puan verir, eksik işi bildirir. Sözleşme kodu ise tüm ziyaretleri listeler. Üyelik gerekmez. Adresi ziyaret detayındaki **Takip bağlantısı** veya sözleşmedeki **Müşteri bağlantısı** düğmesiyle alırsınız.', sahneler: S.takipSahne({ sorun: 'Eksik iş bildir' }) }],
    yazdirma: { ne: 'Belgeler ilgili kayıttan yazdırılır. Görünümlerini Belge şablonları sayfasından değiştirirsiniz.', belgeler: [['Hizmet raporu', 'Ziyaret detayında **Hizmet raporu** düğmesi. İş bitince müşteri imzasıyla da açılır.'], ['Hizmet sözleşmesi (örnek şablon)', '**Sözleşmeler** sayfasında **Sözleşme yazdır**.'], ['Dönem hesap özeti', '**Aylık Faturalama** sayfasında **Yazdır**.'], ['Hasar tutanağı', '**İmzalı belgeler** sayfası.']] },
    entegrasyon: S.ent({ sms: ['**Aylık Faturalama** sayfasındaki **Hatırlat** ödeme hatırlatması gönderir.'] }),
  }; };
