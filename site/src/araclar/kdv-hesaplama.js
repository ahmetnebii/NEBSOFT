const { GUNCELLEME, GIB_KDV } = require('./_kaynak');
module.exports = {
  slug: 'kdv-hesaplama', kategori: 'vergi', sira: 1, mevzuat: true, renk: '#1d4ed8', guncelleme: GUNCELLEME, kaynaklar: [GIB_KDV], ilgili: ['kdv-tevkifat-hesaplama', 'teklif-olusturucu'],
  ad: 'KDV Hesaplama', kisa: 'KDV dahil ve hariç tutarı yüzde 1, 10 ve 20 oranlarıyla ayrıştırın',
  baslik: 'KDV Hesaplama — KDV Dahil ve Hariç Tutar, %1 %10 %20 | NEBSOFT',
  ozet: 'KDV hariç tutardan toplamı, KDV dahil tutardan matrahı bulun. GİB güncel oranları olan yüzde 1, 10 ve 20 hazır gelir; farklı oran için elle yazabilirsiniz. Sonuç kuruşuna kadar görünür.',
  program: { slug: 'onmuhasebeprogrami', metin: 'Her faturada elle hesaplamak yerine Ön Muhasebe programında e-Fatura kesebilir, KDV dökümünü beyan dönemine göre tek ekranda görebilirsiniz.' },
  alanlar: [
    { ad: 'tutar', etiket: 'Tutar (₺)', tip: 'para', deger: '1000', gerekli: true },
    { ad: 'yon', etiket: 'Girilen tutar', tip: 'secim', deger: 'haric', secenekler: [['haric', 'KDV hariç'], ['dahil', 'KDV dahil']] },
    { ad: 'oran', etiket: 'KDV oranı', tip: 'secim', deger: '20', secenekler: [['20', '%20 (genel oran)'], ['10', '%10 (II sayılı liste)'], ['1', '%1 (I sayılı liste)'], ['elle', 'Başka oran']] },
    { ad: 'elle', etiket: 'Oran (%)', tip: 'yuzde', goster: 'oran=elle' },
  ],
  hesap: function (v, H) {
    const oran = v.oran === 'elle' ? v.elle : H.sayiOku(v.oran); if (oran == null) throw new Error('Oranı yazın');
    const r = H.kdv({ tutar: v.tutar, oran, dahil: v.yon === 'dahil' }); const m = `Matrah ${H.tl(r.matrah)} · KDV ${H.tl(r.kdv)} · Toplam ${H.tl(r.toplam)}`;
    return H.tablo([['KDV hariç tutar', H.tl(r.matrah)], [`KDV (%${H.sayi(oran)})`, H.tl(r.kdv), 1], ['KDV dahil toplam', H.tl(r.toplam), 1]]) + H.eylemler(H.btn('kopyala', 'Sonucu kopyala', ` data-metin="${H.esc(m)}"`));
  },
  aciklama: [
    'Katma değer vergisi hesabında iki yön vardır. Elinizde KDV hariç fiyat varsa oran eklenerek toplam bulunur. Elinizde kasadan çıkan KDV dahil tutar varsa, vergiyi ayırmak için tutarı yüzdeyle çarpıp çıkarmak yanlıştır; doğru yöntem tutarı 1 artı oran değerine bölmektir. Birçok elle hesap hatası bu ayrımdan doğar, araç iki yönü de doğru uygular.',
    'Gelir İdaresi Başkanlığı’nın güncel KDV oranları belgesine göre listelerde yer almayan işlemlerde genel oran yüzde 20, (II) sayılı listedeki teslim ve hizmetlerde yüzde 10, (I) sayılı listedekilerde yüzde 1’dir. 7346 sayılı Cumhurbaşkanı Kararıyla belirlenen bu oranlar 10.07.2023 tarihinden beri uygulanmaktadır. Ürününüzün hangi listeye girdiği belgede ayrıntılı yazar ve bazı ürünlerde özel durumlar bulunur.',
    'Araç oranı seçmenizi ister, ürün sınıflandırması yapmaz. Emin olmadığınız bir ürün için GİB belgesini okuyun veya mali müşavirinize sorun. Listede olmayan bir oran gerekiyorsa başka oran seçeneğiyle elle girebilirsiniz.',
  ],
  ornek: { baslik: 'Kullanım örneği: fiş tutarından KDV ayırma', metin: [
    'Bir işletme KDV dahil 1.200 ₺ tutarında fatura almıştır ve gideri KDV hariç yazmak istemektedir. Girilen tutar olarak KDV dahil, oran olarak yüzde 20 seçer. Sonuç 1.000 ₺ matrah ve 200 ₺ KDV olarak görünür.',
    'Aynı tutarın yüzde 20’sini doğrudan almak 240 ₺ verir ve yanlıştır, çünkü 1.200 ₺ zaten vergiyi içerir. Yüzde 10’luk bir üründe 1.100 ₺ toplamdan 1.000 ₺ matrah ve 100 ₺ KDV çıkar. Kuruş yuvarlaması iki ondalığa göre yapılır, faturadaki tutar birkaç kuruş farklı olabilir.',
  ] },
  sss: [
    ['KDV dahil tutardan KDV nasıl ayrılır?', 'Tutar, 1 artı oran değerine bölünür. Yüzde 20 için 1,20’ye bölersiniz; çıkan matrahın tutardan farkı KDV’dir.'],
    ['Güncel KDV oranları nedir?', 'GİB’in güncel belgesine göre genel oran yüzde 20, (II) sayılı liste yüzde 10, (I) sayılı liste yüzde 1’dir. Kaynak bağlantısı bu sayfadadır.'],
    ['Ürünüm hangi orana giriyor?', 'Araç ürün sınıflandırması yapmaz. GİB’in oran belgesindeki listelere bakın veya mali müşavirinize danışın.'],
    ['Sonuç faturayla neden birkaç kuruş farklı?', 'Faturalar satır satır yuvarlanabilir. Araç toplam tutar üzerinden iki ondalık yuvarlar, bu yüzden küçük farklar görülebilir.'],
  ],
};
