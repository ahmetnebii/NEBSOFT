// NEBSOFT Pazarlama: sektör ↔ program ↔ harita etiketi eşlemesi. Program bilgileri site/src/products.js'ten okunur; burada yalnızca kimlik tutulur.
// programlar: işletme türü programı doğrudan gösterir. dolayli: yalnızca olası hedef (ör. her mağaza e-ticaret yapmaz); puan düşer ve arayüzde söylenir.
// randevu: online randevu/rezervasyon sektörün temel ihtiyacı. serbestMeslek: alıcının tacir/esnaf sayılıp sayılmadığı belirsiz (docs/PAZARLAMA-ARACI.md).
// osm etiketleri taginfo.openstreetmap.org'da var olduğu denetlendi (30.10.2026).
const SEKTORLER = [
  { id: 'kuafor', ad: 'Kuaför ve berber', programlar: ['randevu'], osm: ['shop=hairdresser'], metin: 'kuaför', randevu: true },
  { id: 'guzellik', ad: 'Güzellik merkezi', programlar: ['randevu'], osm: ['shop=beauty'], metin: 'güzellik merkezi', randevu: true },
  { id: 'restoran', ad: 'Restoran ve lokanta', programlar: ['adisyon'], osm: ['amenity=restaurant', 'amenity=fast_food'], metin: 'restoran' },
  { id: 'kafe', ad: 'Kafe ve bar', programlar: ['adisyon'], osm: ['amenity=cafe', 'amenity=bar', 'amenity=pub'], metin: 'kafe' },
  { id: 'market', ad: 'Market, manav ve şarküteri', programlar: ['pos'], osm: ['shop=supermarket', 'shop=convenience', 'shop=greengrocer', 'shop=butcher', 'shop=deli'], metin: 'market' },
  { id: 'otel', ad: 'Otel ve pansiyon', programlar: ['otel'], osm: ['tourism=hotel', 'tourism=guest_house', 'tourism=hostel', 'tourism=motel'], metin: 'otel pansiyon', randevu: true },
  { id: 'teknikservis', ad: 'Telefon ve bilgisayarcı, teknik servis', programlar: [], dolayli: ['servis'], osm: ['shop=mobile_phone', 'shop=computer', 'shop=electronics', 'shop=appliance'], metin: 'teknik servis' },
  { id: 'spor', ad: 'Spor salonu', programlar: ['spor'], osm: ['leisure=fitness_centre', 'leisure=sports_centre'], metin: 'spor salonu', randevu: true },
  { id: 'kobi', ad: 'Şirket ofisleri (KOBİ)', programlar: [], dolayli: ['muhasebe', 'crm', 'ik'], osm: ['office=company'], metin: 'şirket ofisi' },
  { id: 'klinik', ad: 'Diş kliniği ve muayenehane', programlar: ['klinik'], dolayli: ['randevu'], osm: ['amenity=dentist', 'amenity=clinic', 'amenity=doctors'], metin: 'diş kliniği', randevu: true, serbestMeslek: true },
  { id: 'emlak', ad: 'Emlak ofisi', programlar: ['emlak'], osm: ['office=estate_agent', 'shop=estate_agent'], metin: 'emlak ofisi' },
  { id: 'kurs', ad: 'Kurs, etüt ve sürücü kursu', programlar: ['kurs'], osm: ['amenity=language_school', 'amenity=prep_school', 'amenity=music_school', 'amenity=driving_school'], metin: 'kurs merkezi' },
  { id: 'otoyikama', ad: 'Oto yıkama', programlar: ['oto'], osm: ['amenity=car_wash'], metin: 'oto yıkama' },
  { id: 'kiralama', ad: 'Araç kiralama', programlar: ['kiralama'], osm: ['amenity=car_rental'], metin: 'araç kiralama', randevu: true },
  { id: 'siteyonetim', ad: 'Site ve apartman yönetimi', programlar: ['site'], osm: ['office=property_management'], metin: 'site yönetim şirketi' },
  { id: 'veteriner', ad: 'Veteriner kliniği', programlar: ['veteriner'], osm: ['amenity=veterinary'], metin: 'veteriner kliniği', randevu: true, serbestMeslek: true },
  { id: 'eczane', ad: 'Eczane', programlar: ['eczane'], osm: ['amenity=pharmacy'], metin: 'eczane', serbestMeslek: true },
  { id: 'kargo', ad: 'Kargo ve kurye', programlar: ['kargo'], osm: ['office=courier'], metin: 'kurye kargo' },
  { id: 'etkinlik', ad: 'Tiyatro, sinema ve etkinlik salonu', programlar: ['bilet'], osm: ['amenity=theatre', 'amenity=cinema', 'amenity=events_venue', 'amenity=arts_centre'], metin: 'etkinlik salonu' },
  { id: 'fabrika', ad: 'Üretim tesisi ve atölye', programlar: ['fabrika'], osm: ['man_made=works'], metin: 'üretim tesisi fabrika' },
  { id: 'butik', ad: 'Giyim mağazası ve butik', programlar: ['butik'], dolayli: ['eticaret', 'pazaryeri'], osm: ['shop=clothes', 'shop=boutique', 'shop=shoes'], metin: 'giyim mağazası butik' },
  { id: 'magaza', ad: 'Hediyelik ve kozmetik mağazası', programlar: [], dolayli: ['eticaret', 'pazaryeri', 'fiyatrobotu'], osm: ['shop=gift', 'shop=cosmetics'], metin: 'hediyelik kozmetik mağazası' },
  { id: 'otoservis', ad: 'Oto tamirci ve yedek parça', programlar: ['otoservis'], osm: ['shop=car_repair', 'shop=car_parts'], metin: 'oto tamirci' },
  { id: 'kuyumcu', ad: 'Kuyumcu', programlar: ['kuyumcu'], osm: ['shop=jewelry'], metin: 'kuyumcu' },
  { id: 'galeri', ad: 'Oto galeri', programlar: ['galeri'], osm: ['shop=car'], metin: 'oto galeri' },
  { id: 'hukuk', ad: 'Avukat ve hukuk bürosu', programlar: ['hukuk'], osm: ['office=lawyer'], metin: 'hukuk bürosu', serbestMeslek: true },
  { id: 'musavir', ad: 'Mali müşavir ve muhasebe bürosu', programlar: ['musavir'], osm: ['office=accountant', 'office=tax_advisor'], metin: 'mali müşavir', serbestMeslek: true },
  { id: 'toptan', ad: 'Toptancı', programlar: ['toptan'], osm: ['shop=wholesale'], metin: 'toptancı' },
  { id: 'anaokulu', ad: 'Anaokulu ve kreş', programlar: ['anaokulu'], osm: ['amenity=kindergarten', 'amenity=childcare'], metin: 'özel anaokulu kreş' },
];

// 81 il; sıra plaka kodudur (ISO 3166-2:TR kodu da aynıdır: TR-34)
const ILLER = 'Adana,Adıyaman,Afyonkarahisar,Ağrı,Amasya,Ankara,Antalya,Artvin,Aydın,Balıkesir,Bilecik,Bingöl,Bitlis,Bolu,Burdur,Bursa,Çanakkale,Çankırı,Çorum,Denizli,Diyarbakır,Edirne,Elazığ,Erzincan,Erzurum,Eskişehir,Gaziantep,Giresun,Gümüşhane,Hakkari,Hatay,Isparta,Mersin,İstanbul,İzmir,Kars,Kastamonu,Kayseri,Kırklareli,Kırşehir,Kocaeli,Konya,Kütahya,Malatya,Manisa,Kahramanmaraş,Mardin,Muğla,Muş,Nevşehir,Niğde,Ordu,Rize,Sakarya,Samsun,Siirt,Sinop,Sivas,Tekirdağ,Tokat,Trabzon,Tunceli,Şanlıurfa,Uşak,Van,Yozgat,Zonguldak,Aksaray,Bayburt,Karaman,Kırıkkale,Batman,Şırnak,Bartın,Ardahan,Iğdır,Yalova,Karabük,Kilis,Osmaniye,Düzce'.split(',');

module.exports = { SEKTORLER, ILLER };
