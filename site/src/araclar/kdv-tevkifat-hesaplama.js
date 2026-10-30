const path = require('path');
const { GUNCELLEME, KOD, TEBLIG, GIB_KDV } = require('./_kaynak');
const KODLAR = require(path.join(__dirname, '..', '..', '..', 'core', 'ebelge', 'kodlar.js'));
// Adlar okunaklı Türkçe yazıldı; oran her derlemede GİB listesinin kopyası olan core/ebelge/kodlar.js'ten gelir (elle yazılmaz)
const AD = { 601: 'Yapım işleri ve birlikte ifa edilen mühendislik, mimarlık, etüt-proje', 602: 'Etüt, plan-proje, danışmanlık, denetim ve benzeri hizmetler', 603: 'Makine, teçhizat, demirbaş ve taşıt tadil, bakım ve onarımı', 604: 'Yemek servis hizmeti', 605: 'Organizasyon hizmeti', 606: 'İşgücü temin hizmetleri', 607: 'Özel güvenlik hizmeti', 608: 'Yapı denetim hizmetleri', 609: 'Fason tekstil, konfeksiyon, çanta ve ayakkabı dikim işleri', 610: 'Turistik mağazalara müşteri bulma / götürme hizmetleri', 611: 'Spor kulüplerinin yayın, reklam ve isim hakkı gelirleri', 612: 'Temizlik hizmeti', 613: 'Çevre ve bahçe bakım hizmetleri', 614: 'Servis taşımacılığı hizmeti', 615: 'Her türlü baskı ve basım hizmetleri', 616: 'Diğer hizmetler', 617: 'Hurda metalden elde edilen külçe teslimleri', 618: 'Hurda dışındaki bakır, çinko, demir, çelik, alüminyum ve kurşun külçe teslimi', 619: 'Bakır, çinko ve alüminyum ürünlerinin teslimi', 620: 'İstisnadan vazgeçenlerin hurda ve atık teslimi', 621: 'Metal, plastik, lastik, kauçuk, kâğıt ve cam hurdadan elde edilen hammadde', 622: 'Pamuk, tiftik, yün, yapağı, ham post ve deri teslimleri', 623: 'Ağaç ve orman ürünleri teslimi', 624: 'Yük taşımacılığı hizmeti', 625: 'Ticari reklam hizmetleri', 626: 'Diğer teslimler', 627: 'Demir-çelik ürünlerinin teslimi' };
const secenek = KODLAR.tevkifat.filter(([k]) => AD[k]).map(([k, , p]) => [`${k}|${p}`, `${k} · ${AD[k]} (${p}/10)`]);
module.exports = {
  slug: 'kdv-tevkifat-hesaplama', kategori: 'vergi', sira: 2, mevzuat: true, renk: '#4338ca', guncelleme: GUNCELLEME, kaynaklar: [KOD, TEBLIG, GIB_KDV], ilgili: ['kdv-hesaplama', 'teklif-olusturucu'],
  ad: 'KDV Tevkifat Hesaplama', kisa: 'GİB işlem koduna göre tevkif edilen KDV’yi ve satıcıya ödenecek tutarı bulun',
  baslik: 'KDV Tevkifat Hesaplama — GİB Kod Listesi ve Oranlar | NEBSOFT',
  ozet: 'İşlem türünü GİB kod listesinden seçin, matrahı girin; toplam KDV’yi, alıcının beyan edeceği tevkifatı ve satıcıya ödenecek net tutarı görün.',
  uyari: 'Tevkifat her işlemde ve her alıcıda uygulanmaz. Alıcınızın tebliğde sayılan gruplardan olup olmadığını, işlemin kapsama girip girmediğini ve tutar sınırlarını güncel tebliğ metninden veya mali müşavirinizden doğrulayın.',
  program: { slug: 'onmuhasebeprogrami', metin: 'Ön Muhasebe programında faturanın satırına tevkifat kodunu seçersiniz; tutar faturaya işlenir ve e-Fatura doğru tipte oluşturulur.' },
  alanlar: [
    { ad: 'matrah', etiket: 'KDV hariç tutar (₺)', tip: 'para', deger: '10000', gerekli: true },
    { ad: 'oran', etiket: 'KDV oranı', tip: 'secim', deger: '20', secenekler: [['20', '%20'], ['10', '%10'], ['1', '%1']] },
    { ad: 'islem', etiket: 'İşlem türü (GİB kodu)', tip: 'secim', genis: true, deger: secenek.find(([v]) => v.startsWith('612|'))[0], secenekler: [...secenek, ['elle', 'Oranı kendim gireceğim']] },
    { ad: 'pay', etiket: 'Tevkifat payı (x/10)', tip: 'sayi', goster: 'islem=elle', yer: '1 ile 10 arası' },
  ],
  hesap: function (v, H) {
    const pay = v.islem === 'elle' ? v.pay : H.sayiOku(v.islem.split('|')[1]); const r = H.tevkifat({ matrah: v.matrah, oran: H.sayiOku(v.oran), pay });
    return H.tablo([['Hesaplanan KDV', H.tl(r.kdv)], [`Tevkif edilen KDV (${H.sayi(pay)}/10)`, H.tl(r.tevkif), 1], ['Satıcının tahsil ettiği KDV', H.tl(r.saticiKdv)], ['Fatura toplamı', H.tl(r.faturaToplam)], ['Satıcıya ödenecek', H.tl(r.saticiyaOdenen), 1]]) + H.not('Tevkif edilen tutarı alıcı sorumlu sıfatıyla beyan edip öder, satıcıya ödemez.');
  },
  aciklama: [
    'KDV tevkifatı, faturadaki verginin bir bölümünün satıcı yerine alıcı tarafından beyan edilip ödenmesidir. Temizlik, güvenlik, yemek, yapım işi gibi belirli işlemlerde alıcı, KDV’nin tamamını satıcıya ödemez; satıcıya kalan kısmı öder, tevkif ettiği kısmı sorumlu sıfatıyla vergi dairesine yatırır. Bu nedenle fatura toplamı ile ödenecek tutar birbirinden farklıdır.',
    'Oranlar on üzerinden pay olarak gösterilir. 9/10 tevkifatta KDV’nin onda dokuzu alıcıda kalır. Sayfadaki liste, GİB’in UBL-TR Kod Listeleri belgesindeki kısmi tevkifat kodlarından alınmıştır; yani e-Faturaya yazacağınız işlem koduyla aynıdır. Aynı liste programlarımızdaki fatura ekranını da besler, böylece iki yerde farklı oran görünmez.',
    'Örnek olarak yapım işlerinde 4/10, işgücü temininde ve temizlik hizmetinde 9/10 oranı tebliğ metniyle de ayrıca karşılaştırılmıştır. Araç yalnız hesap yapar: işlemin kapsama girip girmediğini ve alıcının tevkifat yapmakla yükümlü olup olmadığını değerlendirmez. Tebliğde tutar sınırları ve alıcı gruplarına bağlı kurallar bulunur, güncel sınırları metinden kontrol edin.',
  ],
  ornek: { baslik: 'Kullanım örneği: temizlik hizmeti faturası', metin: [
    'Tevkifat kapsamındaki bir alıcı, 10.000 ₺ artı yüzde 20 KDV’li temizlik faturası alır. Hesaplanan KDV 2.000 ₺’dir. 612 kodu seçildiğinde 9/10 tevkifat uygulanır ve 1.800 ₺ alıcıda kalır.',
    'Satıcı yalnız 200 ₺ KDV tahsil eder, alıcı satıcıya 10.200 ₺ öder. Fatura toplamı 12.000 ₺ olmasına rağmen ödeme farklıdır. Alıcı 1.800 ₺ tutarı kendi beyanıyla öder. Oran elle girilecek bir durum varsa son seçenekle pay yazılabilir.',
  ] },
  sss: [
    ['Tevkifat oranını nereden bulurum?', 'İşlem türünü listeden seçtiğinizde GİB kod listesindeki oran gelir. Kod numarası e-Faturadaki işlem koduyla aynıdır.'],
    ['Her işlemde tevkifat yapılır mı?', 'Hayır. Tebliğde sayılan alıcılar ve işlemler için geçerlidir, tutar sınırları da vardır. Araç bu değerlendirmeyi yapmaz.'],
    ['Tevkif edilen tutarı kim öder?', 'Alıcı, sorumlu sıfatıyla beyan edip öder. Satıcıya bu kısım ödenmez.'],
    ['Listede 10/10 tam tevkifat neden yok?', 'Liste kısmi tevkifat kodlarını içerir. Tam tevkifat için oranı elle girerek hesap yapabilirsiniz.'],
  ],
};
