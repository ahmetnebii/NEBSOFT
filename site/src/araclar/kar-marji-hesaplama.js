const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'kar-marji-hesaplama', kategori: 'ticaret', sira: 3, renk: '#15803d', guncelleme: GUNCELLEME, ilgili: ['pazaryeri-komisyon-hesaplama', 'recete-maliyeti-hesaplama'],
  ad: 'Kâr Marjı ve Başabaş Hesaplama', kisa: 'Marj ile kârlılık farkını, hedef fiyatı ve başabaş adedini bulun',
  baslik: 'Kâr Marjı Hesaplama — Satış Fiyatı ve Başabaş Noktası | NEBSOFT',
  ozet: 'Maliyet ve satış fiyatından kâr marjını hesaplayın, hedef marja göre fiyat bulun, sabit giderinizi karşılamak için kaç adet satmanız gerektiğini görün.',
  program: { slug: 'onmuhasebeprogrami', metin: 'Ürün bazında gerçek kârlılığı alış ve satış kayıtlarından görmek için Ön Muhasebe programındaki analiz ekranlarını kullanabilirsiniz.' },
  alanlar: [
    { ad: 'mod', etiket: 'Ne hesaplanacak?', tip: 'secim', deger: 'marj', genis: true, secenekler: [['marj', 'Marj: maliyet ve fiyat biliniyor'], ['hedef', 'Fiyat: hedef marj biliniyor'], ['basabas', 'Başabaş: kaç adet satmalıyım?']] },
    { ad: 'maliyet', etiket: 'Birim maliyet (₺)', tip: 'para', deger: '80', goster: 'mod=marj|hedef' },
    { ad: 'satis', etiket: 'Satış fiyatı (₺)', tip: 'para', deger: '120', goster: 'mod=marj' },
    { ad: 'marj', etiket: 'Hedef marj (%)', tip: 'yuzde', deger: '35', goster: 'mod=hedef' },
    { ad: 'sabit', etiket: 'Aylık sabit gider (₺)', tip: 'para', deger: '60000', goster: 'mod=basabas' },
    { ad: 'fiyat', etiket: 'Birim satış fiyatı (₺)', tip: 'para', deger: '120', goster: 'mod=basabas' },
    { ad: 'degisken', etiket: 'Birim değişken maliyet (₺)', tip: 'para', deger: '80', goster: 'mod=basabas' },
  ],
  hesap: function (v, H) {
    if (v.mod === 'marj') { const r = H.karMarji(v); return H.tablo([['Birim kâr', H.tl(r.kar)], ['Kâr marjı (satışa göre)', `%${H.sayi(r.marj)}`, 1], ['Maliyet üzerine kâr', `%${H.sayi(r.markup)}`]]); }
    if (v.mod === 'hedef') { const f = H.hedefFiyat(v); return H.tablo([['Gereken satış fiyatı', H.tl(f), 1], ['Birim kâr', H.tl(f - v.maliyet)], ['Maliyet üzerine kâr', `%${H.sayi(H.karMarji({ maliyet: v.maliyet, satis: f }).markup)}`]]); }
    const r = H.basabas(v); return H.tablo([['Başabaş adedi', `${H.sayi(r.adet, 0)} adet`, 1], ['Başabaş cirosu', H.tl(r.ciro)], ['Birim katkı payı', H.tl(r.katki)]]);
  },
  aciklama: [
    'Esnafın en sık karıştırdığı iki kavram kâr marjı ve maliyet üzerine kârdır. 80 liraya alıp 120 liraya sattığınız ürünün kârı maliyete göre yüzde 50, satışa göre ise yüzde 33,3 eder. İkisini karıştırmak, “yüzde 30 kazanıyorum” sanırken çok daha az kazanmaya yol açar. Bu araç iki oranı aynı anda gösterir.',
    'İkinci bölüm tersini yapar: maliyeti ve istediğiniz marjı girersiniz, gereken satış fiyatını bulursunuz. Sık yapılan hata maliyetin üstüne yüzde ekleyerek fiyat koymaktır; oysa yüzde 35 marj için maliyeti 1,35 ile değil, 0,65’e bölmek gerekir.',
    'Üçüncü bölüm başabaş noktasını verir. Kira, personel ve fatura gibi sabit giderleri, ürün başına kalan katkı payına böler. Çıkan adet, ay içinde zarar etmemek için satmanız gereken miktardır. Ürün karmanız genişse ortalama fiyat ve ortalama maliyet girerek yaklaşık bir sonuç alabilirsiniz. Tutarları KDV hariç girin ki tablo tutarlı olsun.',
  ],
  ornek: { baslik: 'Kullanım örneği: küçük bir kafenin ay hesabı', metin: [
    'Bir tost 80 ₺ maliyetle 120 ₺’ye satılıyor. Birim kâr 40 ₺, satışa göre marj yüzde 33,33, maliyete göre kâr yüzde 50. İşletmeci yüzde 35 marj isteyince gereken fiyat 123,08 ₺ çıkar.',
    'Aylık sabit gideri 60.000 ₺ olan kafe için başabaş 1.500 adet ediyor, yani günde yaklaşık 50 satış. Fiyatı 130 ₺ yaparsa katkı payı 50 ₺’ye çıkar ve başabaş 1.200 adede düşer. Böylece zam kararının kaç satışlık rahatlık sağladığı somut olarak görülür.',
  ] },
  sss: [
    ['Kâr marjı nasıl hesaplanır?', 'Kâr satış fiyatına bölünüp yüzle çarpılır. Maliyet üzerine kârda ise kâr maliyete bölünür.'],
    ['Hedef marj neden yüzde 100 olamaz?', 'Marj satış fiyatına göre ölçülür. Maliyetiniz sıfır olmadıkça kâr hiçbir zaman satış fiyatının tamamı olamaz.'],
    ['Tutarları KDV dahil mi girmeliyim?', 'Hepsini KDV hariç girin. Karışık girilen tutarlar marjı olduğundan yüksek gösterir.'],
    ['Başabaş noktası neden tam sayı?', 'Yarım ürün satılamaz. Sonuç yukarı yuvarlanır, yani bu adede ulaşınca sabit gideriniz karşılanmış olur.'],
  ],
};
