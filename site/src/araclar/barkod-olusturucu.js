const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'barkod-olusturucu', kategori: 'kod', sira: 3, renk: '#4f46e5', guncelleme: GUNCELLEME,
  ad: 'Barkod Oluşturucu', kisa: 'EAN-13, EAN-8 ve Code 128 barkodu çizin, kontrol hanesini denetleyin',
  baslik: 'Ücretsiz Barkod Oluşturucu — EAN-13, EAN-8, Code 128 | NEBSOFT',
  ozet: 'EAN-13, EAN-8 ve Code 128 barkodlarını ücretsiz üretin, kontrol hanesini otomatik hesaplayın; PNG veya SVG olarak indirip etikete, ambalaja ve rafa yerleştirin.',
  sonucBaslik: 'Barkodunuz',
  program: { slug: 'marketprogrami', metin: 'Barkodu okutup satış yapmak, stok düşmek ve raf etiketini fiyatla birlikte yazdırmak için Market programı kasada hazır çalışır.' },
  alanlar: [
    { ad: 'tur', etiket: 'Barkod türü', tip: 'secim', deger: 'ean13', genis: true, secenekler: [['ean13', 'EAN-13 (perakende ürün)'], ['ean8', 'EAN-8 (küçük ambalaj)'], ['code128', 'Code 128 (depo, raf, iç kod)']] },
    { ad: 'kod', etiket: 'Kod', deger: '869000000001', genis: true, gerekli: true, ipucu: 'EAN-13 için 12 hane yazarsanız son hane hesaplanır; 13 hane yazarsanız doğrulanır.' },
    { ad: 'yukseklik', etiket: 'Çubuk yüksekliği', tip: 'sayi', deger: '70' },
    { ad: 'metin', etiket: 'Altına rakamları yaz', tip: 'onay', deger: true },
  ],
  hesap: function (v, H) {
    const b = v.tur === 'ean13' ? H.ean13(v.kod) : v.tur === 'ean8' ? H.ean8(v.kod) : H.code128(v.kod);
    const y = Math.min(Math.max(v.yukseklik || 70, 30), 200);
    return `<div class="ar-kod">${H.barkodSvg(b, { yukseklik: y, metin: v.metin })}</div>${H.tablo([['Kodlanan değer', H.esc(b.metin)], v.tur !== 'code128' && ['Kontrol hanesi', b.metin.slice(-1)]])}${H.eylemler(H.btn('png', 'PNG indir'), H.btn('svg', 'SVG indir'), H.btn('yazdir', 'Yazdır'))}${H.not('Yazıcıdan çıkan barkodu okuyucuyla deneyin. Çubukları küçültmek okumayı zorlaştırır.')}`;
  },
  aciklama: [
    'Barkod türünü işinize göre seçmek gerekir. EAN-13 market kasalarının okuduğu 13 haneli perakende kodudur. EAN-8, üzerinde yer kalmayan küçük ambalajlar içindir. Code 128 ise harf ve rakam taşıyabilen, depo rafı, kargo paketi, demirbaş ve mağaza içi ürün kodlarında kullanılan esnek bir biçimdir.',
    'EAN kodlarının son hanesi önceki rakamlardan hesaplanan kontrol hanesidir. Okuyucu bu sayede yanlış okumayı yakalar. Araç eksik haneyi kendisi ekler, tam yazdığınız kodda hatalı son haneyi söyler ve doğru rakamı gösterir. Elle yazılan stok listelerindeki yanlış barkodları temizlerken bu kontrol tek başına işe yarar.',
    'Araç numara dağıtmaz, yalnız verdiğiniz numarayı çizer. Mağaza içinde kendi kodlarınızı kullanabilirsiniz; ürününüzü zincir marketlere veya pazaryerlerine verecekseniz numaranın size tahsis edilmiş olması gerekebilir, bunu satış yapacağınız kanalın koşullarından doğrulayın. Çizim SVG olarak iner, baskıda çubuk kenarları bulanıklaşmaz.',
  ],
  ornek: { baslik: 'Kullanım örneği: el yapımı sabun üreticisi', metin: [
    'Kendi ürününü iki mahalle marketine veren bir üretici, marketin bildirdiği 12 haneli numarayı EAN-13 alanına yazar. Araç son haneyi ekleyip 13 haneli kodu çizer. SVG dosyasını ambalaj tasarımına yerleştirir ve baskı provasını kasadaki okuyucuyla dener.',
    'Aynı üretici depodaki kolileri takip etmek için Code 128 seçer, “KOLI-0042” gibi harfli bir kod yazar. Bu biçim Türkçe karakter taşımaz; bu yüzden kodlarda ş, ğ, ı gibi harfleri kullanmaz. Kolilere bu kodu yapıştırarak sayımı okuyucuyla hızlandırır.',
  ] },
  sss: [
    ['Bu araç bana barkod numarası verir mi?', 'Hayır. Araç yalnız yazdığınız değeri barkoda çevirir. Rastgele üretilmiş bir numara başka bir ürünle çakışabilir.'],
    ['Kontrol hanesi hatası ne demek?', 'Son rakam diğer rakamlarla uyuşmuyor demektir. Numara yanlış yazılmış olabilir. Araç olması gereken rakamı gösterir, ama önce numarayı kaynağından kontrol edin.'],
    ['Code 128 neden Türkçe harf kabul etmiyor?', 'Burada kullanılan kod kümesi yalnız standart ASCII karakterleri taşır. Ş, ğ, ı gibi harfler okuyucuda bozulacağı için reddedilir.'],
    ['Hangi yazıcı gerekir?', 'Etiket yazıcısı en temiz sonucu verir, ancak iyi bir lazer yazıcı da yeterlidir. Mürekkepli baskıda çubuklar yayılabileceğinden yüksek çözünürlük seçip okuyucuyla deneyin.'],
  ],
};
