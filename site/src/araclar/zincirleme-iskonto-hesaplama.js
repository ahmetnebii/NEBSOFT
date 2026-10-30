const { GUNCELLEME_T } = require('./_kaynak-ticaret');
module.exports = {
  slug: 'zincirleme-iskonto-hesaplama', kategori: 'ticaret', sira: 7, renk: '#b45309', guncelleme: GUNCELLEME_T, ilgili: ['kar-marji-hesaplama', 'ortalama-vade-hesaplama', 'teklif-olusturucu'],
  ad: 'Zincirleme İskonto Hesaplama', kisa: '10+5+3 gibi iskontoları ve mal fazlasını net fiyata çevirip teklifleri karşılaştırın',
  baslik: 'Zincirleme İskonto Hesaplama: 10+5+3 Net Fiyat Bulma | NEBSOFT',
  ozet: 'Kademeli iskontoyu 10+5+3 biçiminde yazın, net fiyatı ve tek orana denk iskontoyu görün. Mal fazlası dahil tedarikçi tekliflerini yan yana karşılaştırın.',
  sonucBaslik: 'Teklif karşılaştırması', aciklamaBaslik: 'Yüzde 10+5+3 neden yüzde 18 değildir?',
  program: { slug: 'toptanciprogrami', metin: 'Satış tarafında müşteriye özel fiyat listesi tutuyorsanız Toptancı programında her müşteri kendi fiyatını görür, plasiyer siparişi o fiyatla alır.' },
  alanlar: [
    { ad: 'teklifler', tip: 'satirlar', etiket: 'Teklifler', ekle: 'Teklif ekle', ipucu: 'Fiyatları KDV hariç yazın. Mal fazlası yoksa son iki sütunu boş bırakın.', kolon: 'minmax(0, 1fr) minmax(0, .9fr) minmax(0, 1.3fr) minmax(0, .6fr) minmax(0, .6fr)', sutunlar: [{ ad: 'ad', etiket: 'Teklif', tip: 'metin' }, { ad: 'liste', etiket: 'Liste fiyatı (₺)', tip: 'para' }, { ad: 'iskonto', etiket: 'İskontolar', tip: 'metin', yer: '10+5+3' }, { ad: 'alinan', etiket: 'Alınan', tip: 'sayi' }, { ad: 'bedava', etiket: 'Bedava', tip: 'sayi' }], satir: [{ ad: 'A firması', liste: '1000', iskonto: '10+5+3' }, { ad: 'B firması', liste: '980', iskonto: '12+3', alinan: '10', bedava: '1' }] },
    { ad: 'hedef', etiket: 'Hedef net birim fiyat (₺, isteğe bağlı)', tip: 'para', genis: true, ipucu: 'Her teklifin bu fiyata inmesi için istenecek ek iskontoyu gösterir' },
  ],
  hesap: function (v, H) {
    const L = (v.teklifler || []).filter((x) => x.ad || x.liste > 0 || x.iskonto); if (!L.length) throw new Error('En az bir teklif girin');
    const S = L.map((x, i) => { const oranlar = H.iskontoOku(x.iskonto); return { ad: x.ad || `${i + 1}. teklif`, ...H.zincirIskonto({ liste: x.liste, oranlar, alinan: x.alinan, bedava: x.bedava }) }; }).sort((a, b) => a.birim - b.birim); const en = S[0];
    const satir = S.map((x) => `<tr><td>${H.esc(x.ad)}</td><td class="r">${H.tl(x.birim)}</td><td class="r">%${H.sayi(x.toplamEsdeger)}</td>${v.hedef > 0 ? `<td class="r">%${H.sayi(H.ekIskonto({ birim: x.birim, hedef: v.hedef }))}</td>` : ''}</tr>`).join('');
    return `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Teklif</th><th class="r">Net birim</th><th class="r">Tek orana denk</th>${v.hedef > 0 ? '<th class="r">Ek iskonto</th>' : ''}</tr></thead><tbody>${satir}</tbody></table></div>`
      + H.tablo([[`En düşük net fiyat: ${H.esc(en.ad)}`, H.tl(en.birim), 1], S[1] ? ['Sonraki teklife göre birim fark', H.tl(S[1].birim - en.birim)] : null, en.duzToplam ? [`${H.esc(en.ad)}: oranların düz toplamı`, `%${H.sayi(en.duzToplam)}`] : null, en.duzToplam ? [`${H.esc(en.ad)}: gerçek zincir iskontosu`, `%${H.sayi(en.esdeger)}`] : null])
      + H.not('Vade, teslim süresi ve iade koşulu bu karşılaştırmaya girmez. Fiyat tek başına en iyi teklifi söylemez.');
  },
  aciklama: [
    'Toptan alımda fatura veya fiyat listesinde çoğu zaman “10+5+3” yazar. Burada oranlar toplanmaz, sırayla uygulanır: önce yüzde 10 düşülür, yüzde 5 kalan tutardan, yüzde 3 de ondan kalan tutardan hesaplanır. Bu yüzden gerçek iskonto oranların toplamından her zaman biraz düşüktür. Rakamlar büyüdükçe aradaki fark da büyür ve iki tedarikçiyi başlık iskontosuyla karşılaştırmak yanıltır.',
    'Araç her teklifi aynı ölçüye indirir: net birim fiyat ve tek orana denk iskonto. Mal fazlası da hesaba girer. “10 alana 1 bedava” gibi bir kampanyada on ürünün parasıyla on bir ürün gelir, net fiyat buna göre yeniden bölünür. Böylece yüksek liste fiyatlı ama mal fazlası veren teklif, düşük liste fiyatlı teklifle aynı terazide tartılır.',
    'Pazarlık yapıyorsanız hedef fiyat alanını doldurun; her teklifin o fiyata inmesi için istemeniz gereken ek iskonto tabloya gelir. Ekleyeceğiniz oran zincirin sonuna yazılır gibi çalışır, yani mevcut net fiyat üzerinden hesaplanır. Hesap liste fiyatına ve yazdığınız oranlara dayanır; ödeme vadesi, nakliye ve iade şartı hesaba katılmaz. Mal fazlasının satılabilir olduğu varsayılır, rafta kalacak ürün için bu kazanç kâğıt üzerinde kalır.',
  ],
  ornek: { baslik: 'Örnek: iki tedarikçi aynı ürüne teklif veriyor', metin: [
    'A firması 1.000 ₺ liste fiyatına 10+5+3 iskonto veriyor. Sırayla 900, 855 ve 829,35 ₺ bulunur. Düz toplam yüzde 18 görünse de gerçek iskonto yüzde 17,07’dir.',
    'B firması 980 ₺ liste fiyatına 12+3 iskonto ve 10 alana 1 bedava sunuyor. Net fiyat 836,53 ₺ olur, on bir ürüne bölününce birim 760,48 ₺ çıkar. Başlık iskontosu düşük görünen B, A’dan birim başına 68,87 ₺ ucuzdur. Hedef fiyat 800 ₺ ise A’dan yüzde 3,54 ek iskonto istemek gerekir, B zaten bu fiyatın altındadır.',
  ] },
  sss: [
    ['Zincirleme iskonto nasıl hesaplanır?', 'Liste fiyatı sırayla (1 - oran) değerleriyle çarpılır. 1.000 ₺ için 10+5 iskontoda 1.000 × 0,90 × 0,95 = 855 ₺ bulunur.'],
    ['Oranların sırası sonucu değiştirir mi?', 'Hayır. Çarpma sırası sonucu etkilemez, 10+5+3 ile 3+5+10 aynı net fiyatı verir.'],
    ['Mal fazlası gerçek iskonto sayılır mı?', 'Birim maliyeti düşürür ama ürün satılırsa kazanca döner. Stok devri yavaş bir üründe bedava adet rafta para bağlar.'],
    ['Hangi yazım biçimleri kabul ediliyor?', '10+5+3, %10 + %5 ve boşlukla ayrılmış 10 5 3 yazımı okunur. Ondalık için virgül kullanabilirsiniz: 2,5.'],
    ['KDV dahil fiyat girebilir miyim?', 'Karşılaştırma için yalnız bütün teklifler aynı biçimde girilmeli, karışık girerseniz sıralama bozulur. KDV hariç yazmanız önerilir.'],
  ],
};
