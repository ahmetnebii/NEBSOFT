const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'satis-primi-hesaplama', kategori: 'calisma', sira: 4, renk: '#a21caf', guncelleme: GUNCELLEME, ilgili: ['fazla-mesai-hesaplama', 'kar-marji-hesaplama'],
  ad: 'Satış Primi Hesaplama', kisa: 'Kademeli veya tek oranlı prim planınızı deneyin, ödeme tutarını görün',
  baslik: 'Satış Primi Hesaplama — Kademeli Prim ve Hedef Planı | NEBSOFT',
  ozet: 'Satış personeli için kademeli prim hesaplayın: eşik ve oranları belirleyin, her dilimin ödemesini görün, iki prim sistemini aynı satışta karşılaştırın.',
  program: { slug: 'butikprogrami', metin: 'Mağazada satışları danışman bazında kaydediyorsanız Butik programı dönem sonunda her danışmanın primini satışlardan kendisi çıkarır.' },
  alanlar: [
    { ad: 'satis', etiket: 'Dönem satışı (₺)', tip: 'para', deger: '320000', gerekli: true }, { ad: 'sabit', etiket: 'Sabit prim / ek ödeme (₺)', tip: 'para' },
    { ad: 'mod', etiket: 'Prim sistemi', tip: 'secim', deger: 'kademeli', genis: true, secenekler: [['kademeli', 'Kademeli: her dilim kendi oranıyla'], ['tum', 'Baraj: ulaşılan oran tüm satışa']] },
    { ad: 'kademeler', tip: 'satirlar', etiket: 'Prim kademeleri', ekle: 'Kademe ekle', ipucu: 'Kendi planınızı yazın. Satır: bu tutardan başlayarak geçerli oran.', sutunlar: [{ ad: 'esik', etiket: 'Başlangıç (₺)', tip: 'para' }, { ad: 'oran', etiket: 'Oran (%)', tip: 'yuzde' }], satir: [{ esik: '0', oran: '1' }, { esik: '200000', oran: '2' }, { esik: '400000', oran: '3' }] },
  ],
  hesap: function (v, H) {
    const r = H.prim(v);
    return (r.detay.length ? `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Dilim tabanı</th><th class="r">Oran</th><th class="r">Prim</th></tr></thead><tbody>${r.detay.map((x) => `<tr><td>${H.tl(x.taban)}</td><td class="r">%${H.sayi(x.oran)}</td><td class="r">${H.tl(x.tutar)}</td></tr>`).join('')}</tbody></table></div>` : H.not('Bu satış tutarı hiçbir kademeye ulaşmıyor.', 'uyari')) + H.tablo([['Hesaplanan prim', H.tl(r.prim)], ['Etkin prim oranı', `%${H.sayi(r.etkin)}`], ['Toplam ödeme', H.tl(r.toplam), 1]]) + H.not('Prim planınız bordroya nasıl yansıyacağıyla birlikte yazılı olmalıdır.');
  },
  aciklama: [
    'Prim sisteminin iyi olup olmadığı, kâğıt üzerinde değil gerçek satış rakamlarıyla denenince anlaşılır. Bu araçta eşikleri ve oranları kendiniz belirlersiniz; sayfada hazır oran bulunmaz, çünkü doğru oran sektörünüzün kârlılığına bağlıdır. Dönem satışını yazınca hangi dilimden ne kadar prim doğduğu tek tek görünür.',
    'İki yaygın yaklaşım desteklenir. Kademeli sistemde her dilim kendi oranıyla ödenir, gelir vergisi dilimine benzer: eşiği az farkla geçmek sert bir sıçrama yaratmaz. Baraj sisteminde ise ulaşılan en üst oran tüm satışa uygulanır; satış ekibini hedefi aşmaya güçlü biçimde iter, ama eşiğin hemen üstüne çıkan satış işletmeye orantısız maliyet yükler. Aynı satışı iki modda deneyerek farkı görebilirsiniz.',
    'Etkin oran, toplam primin satışa oranıdır ve bütçe için en anlamlı rakamdır. Plan yaparken marjınızı da düşünün: Kâr Marjı aracında çıkan kârın ne kadarının prime gideceğini önceden görmek gerekir. Sonuç prim tutarıdır, brüt kabul edin; çalışana net ödeme bordroda kesintilerden sonra belli olur.',
  ],
  ornek: { baslik: 'Kullanım örneği: 320.000 ₺ satış yapan temsilci', metin: [
    'Bir mağaza 0–200.000 ₺ için yüzde 1, 200.000–400.000 ₺ için yüzde 2 oranı belirlesin. Kademeli sistemde ilk dilimden 2.000 ₺, kalan 120.000 ₺ için 2.400 ₺ doğar, toplam prim 4.400 ₺ ve etkin oran yüzde 1,38 olur.',
    'Aynı satış baraj sisteminde hesaplanırsa yüzde 2 tüm tutara uygulanır ve prim 6.400 ₺ çıkar. Yöneticiler iki sonucu karşılaştırarak bütçeye uyan planı seçer. Tablo yalnız örnektir, oranları işletmenizin kârlılığına göre belirleyin.',
  ] },
  sss: [
    ['Prim oranı kaç olmalı?', 'Tek doğru oran yoktur. Ürün marjınız ve satış süreciniz belirler. Önce marjınızı hesaplayın, sonra prim payını belirleyin.'],
    ['Kademeli ve baraj sistemi arasındaki fark nedir?', 'Kademelide her dilim kendi oranıyla ödenir. Barajda ulaşılan en yüksek oran tüm satışa uygulanır.'],
    ['Prim net mi brüt mü?', 'Araç hesaplanan tutarı gösterir. Bordroda nasıl vergilendirileceği için mali müşavirinize danışın.'],
    ['Satış iade edilirse ne olur?', 'Bu kuralı plana siz yazarsınız. İade tutarlarını dönem satışından düşüp hesabı öyle yapabilirsiniz.'],
  ],
};
