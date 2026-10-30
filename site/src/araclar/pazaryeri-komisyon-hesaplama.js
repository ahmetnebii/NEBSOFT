const { GUNCELLEME, GIB_KDV } = require('./_kaynak');
module.exports = {
  slug: 'pazaryeri-komisyon-hesaplama', kategori: 'ticaret', sira: 1, renk: '#7c3aed', guncelleme: GUNCELLEME, kaynaklar: [GIB_KDV], ilgili: ['kargo-desi-hesaplama', 'kar-marji-hesaplama', 'kdv-hesaplama'],
  ad: 'Pazaryeri Komisyon ve Kâr Hesaplama', kisa: 'Komisyon, kargo ve hizmet bedeli sonrası gerçek kârı ve hedef fiyatı görün',
  baslik: 'Pazaryeri Komisyon Hesaplama — Trendyol, Hepsiburada, n11 Net Kâr | NEBSOFT',
  ozet: 'Satış fiyatınızı, kendi komisyon oranınızı, kargo ve hizmet bedelinizi girin; KDV sonrası net kârı, marjı ve hedef marj için gereken fiyatı görün. Oranlar sizin panelinizden gelir.',
  program: { slug: 'pazaryerikarhesaplama', metin: 'Tek ürün için hesap burada yeterli. Yüzlerce listelemede zarar edenleri bulmak ve fiyatı marjınıza göre korumak için Pazaryeri Kâr Hesaplama programını deneyin.' },
  alanlar: [
    { ad: 'fiyat', etiket: 'Satış fiyatı (KDV dahil)', tip: 'para', deger: '599,90', gerekli: true },
    { ad: 'kdv', etiket: 'Ürün KDV oranı', tip: 'secim', deger: '20', secenekler: [['20', '%20'], ['10', '%10'], ['1', '%1']] },
    { ad: 'maliyet', etiket: 'Ürün maliyeti (KDV hariç)', tip: 'para', deger: '250', gerekli: true },
    { ad: 'komisyon', etiket: 'Komisyon oranı (%)', tip: 'yuzde', gerekli: true, yer: 'Satıcı panelinizden', ipucu: 'Kategoriye ve mağazaya göre değişir, panelinizdeki güncel oranı yazın.' },
    { ad: 'kargo', etiket: 'Kargo ücreti (₺)', tip: 'para', ipucu: 'Sözleşmenizdeki desi fiyatı, KDV dahil' },
    { ad: 'hizmet', etiket: 'Hizmet bedeli (₺)', tip: 'para', ipucu: 'Pazaryerinin sipariş başına kestiği tutar, KDV dahil' },
    { ad: 'paket', etiket: 'Paketleme / diğer (₺)', tip: 'para' },
    { ad: 'kesintiKdv', etiket: 'Kesintilerin KDV oranı (%)', tip: 'yuzde', deger: '20', ipucu: 'Komisyon, kargo ve hizmet faturalarındaki oran' },
    { ad: 'hedef', etiket: 'Hedef net marj (%)', tip: 'yuzde', ipucu: 'Doluysa gereken satış fiyatı da hesaplanır' },
  ],
  hesap: function (v, H) {
    const g = { fiyat: v.fiyat, kdv: H.sayiOku(v.kdv), maliyet: v.maliyet, komisyon: v.komisyon, kargo: v.kargo || 0, hizmet: v.hizmet || 0, paket: v.paket || 0, kesintiKdv: v.kesintiKdv || 0 };
    const r = H.pazaryeri(g); let h = null, hata = '';
    if (v.hedef != null) { try { h = H.pazaryeriHedef({ ...g, marj: v.hedef }); } catch (e) { hata = H.not(H.esc(e.message), 'uyari'); } }
    return H.tablo([['KDV hariç satış', H.tl(r.netSatis)], ['Satış KDV’si', H.tl(r.satisKdv)], ['Komisyon (KDV dahil)', H.tl(r.komisyonTutar)], ['Kesintiler (KDV hariç)', H.tl(r.kesinti)], ['Ürün maliyeti', H.tl(g.maliyet)], ['Net kâr', H.tl(r.kar), 1], ['Net marj', `%${H.sayi(r.marj, 1)}`], ['Maliyete göre getiri', `%${H.sayi(r.roi, 1)}`], h != null && [`%${H.sayi(v.hedef)} marj için fiyat`, H.tl(h), 1]]) + hata + (r.kar < 0 ? H.not('Bu fiyatla ürün başına zarar ediyorsunuz.', 'uyari') : '') + H.not('Hesap, komisyonun KDV dahil fiyattan alındığını varsayar. Pazaryerinizin kesintisi farklıysa ödeme ekstrenizle karşılaştırın.');
  },
  aciklama: [
    'Pazaryerinde “kaça satıyorum” ile “cebime ne kalıyor” arasındaki fark çoğu satıcının sandığından büyüktür. Satış fiyatının içindeki KDV, komisyon, kargo, hizmet bedeli ve paketleme ayrı ayrı düşülmeden gerçek kâr görünmez. Bu araç tek bir ürün için bu dökümü çıkarır ve hedef marja ulaşmak için hangi fiyatın gerektiğini söyler.',
    'Hiçbir pazaryerinin komisyonunu sayfaya sabit yazmadık. Oranlar kategoriye, mağaza durumuna ve kampanyaya göre değişir, ayrıca sık güncellenir; eski bir tablo sizi yanıltır. Bu nedenle oranı kendi satıcı panelinizden girersiniz ve sonuç gerçek sözleşmenize göre çıkar.',
    'Hesapta kesintilerin KDV’si kârdan ayrılır, çünkü KDV mükellefi satıcı bu faturaların KDV’sini indirim konusu yapar. Şahıs şirketi olmayan ya da farklı vergi durumundaki satıcılar için kesinti KDV oranını sıfır girerek daha temkinli bir sonuç görebilirsiniz. Gelir vergisi ve kurumlar vergisi bu hesaba dahil değildir.',
  ],
  ornek: { baslik: 'Kullanım örneği: 599,90 ₺ fiyatlı ürün', metin: [
    'Satıcı, paneline göre komisyonu yüzde 15 yazdığını varsayalım. Ürünün KDV dahil fiyatı 599,90 ₺, maliyeti 250 ₺, kargo faturası 70 ₺. KDV hariç satış 499,92 ₺ olur, komisyon 89,99 ₺ tutar. Kesintiler KDV’den arındırılınca 133,32 ₺ çıkar ve net kâr 116,60 ₺ görünür.',
    'Satıcı yüzde 30 net marj istediğini hedef alanına yazınca gereken fiyat ayrıca hesaplanır. Böylece kampanya indirimine girmeden önce ne kadar pay kaldığını görür. Bu örnekteki yüzde 15 yalnız anlatım içindir, sizin oranınızı temsil etmez.',
  ] },
  sss: [
    ['Komisyon oranları neden hazır gelmiyor?', 'Oranlar kategoriye, mağazaya ve kampanyaya göre değişir, ayrıca sık güncellenir. Doğru sonuç için satıcı panelinizdeki güncel oranı girmeniz gerekir.'],
    ['Komisyon KDV dahil fiyattan mı alınır?', 'Hesap bu varsayımla çalışır. Pazaryerinizin sözleşmesi farklıysa ödeme ekstrenizdeki tutarla karşılaştırın.'],
    ['Net marj ile maliyete göre getiri farkı nedir?', 'Net marj kârın KDV hariç satışa oranıdır. Getiri ise kârın ürün maliyetine oranıdır. Aynı kâr için iki farklı yüzde çıkar.'],
    ['Kargo ücretini nereden bulurum?', 'Sözleşmeli taşıyıcınızın desi tablosuna bakın. Ürünün desisini Kargo Desi Hesaplama aracıyla bulabilirsiniz.'],
  ],
};
