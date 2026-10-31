const { TAVAN } = require('./_kaynak');
const { GUNCELLEME_T, SGK_81, CSGB_ASGARI, SGK_PEK } = require('./_kaynak-ticaret');
module.exports = {
  slug: 'personel-maliyeti-hesaplama', kategori: 'calisma', sira: 5, mevzuat: true, renk: '#be123c', guncelleme: GUNCELLEME_T, kaynaklar: [CSGB_ASGARI, SGK_81, SGK_PEK, TAVAN], ilgili: ['kidem-tazminati-hesaplama', 'nakit-akisi-hesaplama', 'fazla-mesai-hesaplama'],
  ad: 'Personel Maliyeti Hesaplama', kisa: 'Brüt ücretin işverene aylık ve yıllık toplam maliyetini görün',
  baslik: 'Personel Maliyeti Hesaplama: İşverene Toplam Maliyet 2026 | NEBSOFT',
  ozet: 'Brüt ücreti yazın, 2026 SGK ve işsizlik işveren primleriyle aylık ve yıllık maliyeti görün. Yan haklar, kıdem karşılığı ve gereken ek ciro da hesaplanır.',
  sonucBaslik: 'İşverene maliyet', aciklamaBaslik: 'Brüt ücret neden gerçek maliyet değildir?',
  uyari: 'Oran ve sınırlar 2026 yılı içindir; yıl değişince bu sayfadaki değerleri resmî kaynaktan kontrol edin. Sonuç bütçe içindir, bordro veya hukuki danışmanlık yerine geçmez.',
  program: { slug: 'personeltakipprogrami', metin: 'Gerçek bordroda Personel Takip programı puantajdan SGK gününü ve fazla mesaiyi alır, işveren maliyetini ve muhtasar özetini çıkarır.' },
  alanlar: [
    { ad: 'brut', etiket: 'Aylık brüt ücret (₺)', tip: 'para', deger: '50000', gerekli: true },
    { ad: 'adet', etiket: 'Kişi sayısı', tip: 'sayi', deger: '1' },
    { ad: 'oran', etiket: 'SGK işveren payı', tip: 'secim', genis: true, deger: '19.75', secenekler: [['19.75', '%19,75 · 2 puan indirimli, imalat dışı'], ['16.75', '%16,75 · 5 puan indirimli, imalat'], ['21.75', '%21,75 · indirimsiz'], ['elle', 'Oranı kendim yazacağım']] },
    { ad: 'elle', etiket: 'SGK işveren payı (%)', tip: 'yuzde', goster: 'oran=elle', genis: true },
    { ad: 'yemek', etiket: 'Aylık yemek gideri (₺)', tip: 'para', deger: '3000' },
    { ad: 'yol', etiket: 'Aylık yol veya servis (₺)', tip: 'para', deger: '1500' },
    { ad: 'diger', etiket: 'Diğer aylık gider (₺)', tip: 'para', ipucu: 'İş kıyafeti, sağlık sigortası gibi' },
    { ad: 'marj', etiket: 'Satış marjınız (%, isteğe bağlı)', tip: 'yuzde', deger: '25', ipucu: 'Bu maliyeti karşılayacak ek ciroyu gösterir' },
    { ad: 'kidem', etiket: 'Aylık kıdem karşılığı da eklensin', tip: 'onay', deger: true },
    { ad: 'tavan', etiket: 'Kıdem tavanı (₺)', tip: 'para', deger: '73729,87', goster: 'kidem=true', ipucu: 'Temmuz-Aralık 2026 tavanı' },
    { ad: 'alt', etiket: 'SGK alt sınırı (₺/ay)', tip: 'para', deger: '33030', ipucu: '2026 özel sektör' },
    { ad: 'ust', etiket: 'SGK üst sınırı (₺/ay)', tip: 'para', deger: '297270', ipucu: '2026 özel sektör' },
  ],
  hesap: function (v, H) {
    const oran = v.oran === 'elle' ? v.elle : H.sayiOku(v.oran); const r = H.personelMaliyet({ brut: v.brut, sgkOran: oran, altSinir: v.alt, ustSinir: v.ust, yemek: v.yemek, yol: v.yol, diger: v.diger, kidemTavan: v.kidem ? v.tavan : 0, adet: v.adet, marj: v.marj }); const n = v.adet > 1;
    return H.tablo([['Brüt ücret', H.tl(v.brut)], [`SGK işveren payı (%${H.sayi(oran)})`, H.tl(r.sgk)], ['İşsizlik işveren payı (%2)', H.tl(r.issizlik)], r.yan ? ['Yemek, yol ve diğer', H.tl(r.yan)] : null, r.kidem ? ['Aylık kıdem karşılığı', H.tl(r.kidem)] : null, ['Kişi başı aylık maliyet', H.tl(r.aylik), 1], ['Kişi başı yıllık maliyet', H.tl(r.yillik)], n ? ['Toplam aylık maliyet', H.tl(r.toplamAylik), 1] : null, n ? ['Toplam yıllık maliyet', H.tl(r.toplamYillik)] : null, ['Brüt ücrete oranı', `${H.sayi(r.carpan)} kat`], r.ekCiro != null ? ['Karşılamak için gereken aylık ek ciro', H.tl(r.ekCiro), 1] : null])
      + (r.altta ? H.not('Brüt ücret SGK alt sınırının altında. Prim alt sınırdan hesaplandı. Tam ay çalışmayan kısmi süreli personelde sonuç farklı olur, işçi payı farkını da işveren karşılayabilir.', 'uyari') : '') + (r.ustte ? H.not('Brüt ücret SGK üst sınırını aşıyor, prim üst sınırdan hesaplandı.') : '') + H.not('Hesap otuz günlük tam ay varsayar. Teşvik, asgari ücret desteği ve damga vergisi istisnası gibi kalemler dahil değildir.');
  },
  aciklama: [
    'İş ilanına yazılan rakam net ücrettir, bordroda görünen brüttür, işverenin kasasından çıkan ise ikisinden de yüksektir. Brüt ücretin üstüne SGK işveren payı ve işsizlik primi eklenir. Sonra yemek, servis gibi düzenli giderler ve ileride ödenecek kıdem tazminatı için ayrılması akıllıca olan pay gelir. Yeni birini almadan önce bakılacak rakam bu toplamdır.',
    'Bu araç 2026 için ÇSGB’nin işverene maliyet tablosundaki oranları kullanır: indirimsiz yüzde 21,75, iki puan indirimle yüzde 19,75, imalatta beş puan indirimle yüzde 16,75, işverenin işsizlik payı yüzde 2. Hazine indiriminden yararlanmak için kanundaki şartları karşılamanız gerekir: belgeler zamanında verilmeli, primler süresinde ödenmeli, Kuruma borç bulunmamalıdır. Şartı karşılamıyorsanız indirimsiz satırı seçin.',
    'Prim tutarı brüt ücrete değil, alt ve üst sınır arasına çekilmiş kazanca uygulanır. Üst sınırı aşan ücrette fark primsiz kalır, bu yüzden maliyet oranı yüksek maaşta düşer. Sınırları form alanlarında açıkça gösteriyoruz, yıl değiştiğinde kendiniz güncelleyebilirsiniz. Yemek ve yol giderlerini maliyete ekliyoruz ama prim matrahına katmıyoruz; nakit ödediğiniz yan hak prime tabiyse o tutarı brüt ücrete dahil edin.',
    'Son satır kararı işe bağlar. Yazdığınız marjla, bu kişinin maliyetini karşılamak için ayda ne kadar ek satış gerektiği bulunur. Kıdem karşılığı brüt ücretin on ikide biridir ve tavanla sınırlıdır; yasal bir ödeme kalemi değil, ileride çıkacak yük için ayrılan bütçedir. Hesap tehlikeli işlerdeki fiilî hizmet zammını, ihbar tazminatını, fazla mesaiyi ve kullanılmayan izni kapsamaz. Net maaş da hesaplanmaz, gelir vergisi için bordro gerekir.',
  ],
  ornek: { baslik: 'Örnek: 50.000 ₺ brüt ücretle işe alım', metin: [
    'İmalat dışı bir işletme 50.000 ₺ brüt ücretle eleman alsın. Yüzde 19,75 SGK işveren payı 9.875 ₺, yüzde 2 işsizlik payı 1.000 ₺ eder. Üzerine 3.000 ₺ yemek, 1.500 ₺ yol ve 4.166,67 ₺ kıdem karşılığı gelince aylık maliyet 69.541,67 ₺ olur. Bu, brüt ücretin 1,39 katıdır.',
    'Yıllık maliyet 834.500,04 ₺ tutar. İşletme yüzde 25 marjla çalışıyorsa bu kişiyi karşılamak için ayda 278.166,68 ₺ ek satış gerekir. Aynı araç 33.030 ₺ asgari ücretle ve yan haksız denenirse ÇSGB tablosundaki 40.214,03 ₺ sonucu çıkar.',
  ] },
  sss: [
    ['İşverene maliyet nasıl hesaplanır?', 'Brüt ücrete SGK işveren payı ve işsizlik işveren payı eklenir. Bu araçta yan giderler ve kıdem karşılığı da ayrı satırda toplanır.'],
    ['Hangi SGK oranını seçmeliyim?', 'İmalat sektöründeyseniz ve şartları karşılıyorsanız yüzde 16,75, diğer özel sektörde yüzde 19,75 seçilir. Şart sağlanmıyorsa yüzde 21,75 kullanılır.'],
    ['Asgari ücret desteği dahil mi?', 'Hayır. Destek ve teşvikler kişiye, işyerine ve döneme göre değişir, bu nedenle tutar hesaba girmez.'],
    ['Net maaştan brüt bulabilir miyim?', 'Bu araç brüt ücretten başlar. Net anlaşmalı personelde brüt tutarı bordronuzdan alın.'],
    ['2027 için kullanabilir miyim?', 'Yeni yıl değerleri açıklanınca alt sınır, üst sınır ve oran alanlarını güncelleyerek kullanabilirsiniz. Hazır değerler 2026 içindir.'],
  ],
};
