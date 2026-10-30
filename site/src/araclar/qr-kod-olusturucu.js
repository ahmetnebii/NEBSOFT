const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'qr-kod-olusturucu', kategori: 'kod', sira: 2, qr: true, renk: '#0f766e', guncelleme: GUNCELLEME,
  ad: 'QR Kod Oluşturucu', kisa: 'Web adresi, Wi-Fi şifresi, kartvizit ve telefon için süresiz karekod',
  baslik: 'Ücretsiz QR Kod Oluşturucu — Wi-Fi, Kartvizit, Link Karekodu | NEBSOFT',
  ozet: 'Web adresi, Wi-Fi, kartvizit, telefon veya düz metin için QR kod üretin; PNG ve SVG olarak indirin. Üyelik yok, kodun süresi dolmaz, veriler tarayıcıdan çıkmaz.',
  sonucBaslik: 'QR kodunuz',
  program: { slug: 'adisyonprogrami', metin: 'Masaya özel karekod, online menü ve sipariş gerekiyorsa tek tek kod üretmek yerine Adisyon programı her masa için kodu kendisi oluşturur.' },
  alanlar: [
    { ad: 'tur', etiket: 'Kod türü', tip: 'secim', deger: 'adres', genis: true, secenekler: [['adres', 'Web adresi'], ['wifi', 'Wi-Fi'], ['vcard', 'Kartvizit'], ['tel', 'Telefon'], ['metin', 'Düz metin']] },
    { ad: 'adres', etiket: 'Web adresi', deger: 'www.nebsoft.com.tr', genis: true, goster: 'tur=adres' },
    { ad: 'wad', etiket: 'Ağ adı (SSID)', goster: 'tur=wifi' },
    { ad: 'wsifre', etiket: 'Şifre', goster: 'tur=wifi' },
    { ad: 'wtip', etiket: 'Güvenlik', tip: 'secim', deger: 'WPA', goster: 'tur=wifi', secenekler: [['WPA', 'WPA / WPA2 / WPA3'], ['WEP', 'WEP'], ['nopass', 'Şifresiz']] },
    { ad: 'wgizli', etiket: 'Ağ adı gizli', tip: 'onay', goster: 'tur=wifi' },
    { ad: 'vad', etiket: 'Ad', goster: 'tur=vcard' }, { ad: 'vsoyad', etiket: 'Soyad', goster: 'tur=vcard' },
    { ad: 'vfirma', etiket: 'Firma', goster: 'tur=vcard' }, { ad: 'vunvan', etiket: 'Unvan', goster: 'tur=vcard' },
    { ad: 'vtel', etiket: 'Telefon', goster: 'tur=vcard' }, { ad: 'veposta', etiket: 'E-posta', goster: 'tur=vcard' },
    { ad: 'vweb', etiket: 'Web', goster: 'tur=vcard' }, { ad: 'vadres', etiket: 'Adres', goster: 'tur=vcard' },
    { ad: 'tel', etiket: 'Telefon numarası', yer: '+90 5xx xxx xx xx', genis: true, goster: 'tur=tel' },
    { ad: 'metin', etiket: 'Metin', tip: 'cokmetin', goster: 'tur=metin' },
    { ad: 'duzeltme', etiket: 'Hata düzeltme', tip: 'secim', deger: 'M', ipucu: 'Yüksek seviye yıpranmaya dayanır, kodu sıklaştırır', secenekler: [['L', 'Düşük'], ['M', 'Orta'], ['Q', 'Yüksek'], ['H', 'En yüksek']] },
  ],
  hesap: function (v, H) {
    let m;
    if (v.tur === 'adres') m = H.adresMetni(v.adres);
    else if (v.tur === 'wifi') { m = H.wifiMetni({ ad: v.wad, sifre: v.wsifre, tip: v.wtip, gizli: v.wgizli }); }
    else if (v.tur === 'vcard') m = H.vcardMetni({ ad: v.vad, soyad: v.vsoyad, firma: v.vfirma, unvan: v.vunvan, tel: v.vtel, eposta: v.veposta, web: v.vweb, adres: v.vadres });
    else if (v.tur === 'tel') { const t = String(v.tel).replace(/[^\d+]/g, ''); if (t.length < 7) throw new Error('Telefon numarası girin'); m = `tel:${t}`; }
    else { if (!v.metin) throw new Error('Metin girin'); m = v.metin; }
    return `<div class="ar-kod">${H.qrSvg(m, { boyut: 280, duzeltme: v.duzeltme })}</div>${H.eylemler(H.btn('png', 'PNG indir'), H.btn('svg', 'SVG indir'), H.btn('yazdir', 'Yazdır'))}${H.not('Basmadan önce kendi telefonunuzla okutup deneyin.')}`;
  },
  aciklama: [
    'Karekod, kameranın okuduğu kısa bir veri kutusudur. Bu araç beş sık ihtiyacı karşılar: web adresi, misafirin şifre yazmadan bağlanacağı Wi-Fi kodu, rehbere tek dokunuşla kaydedilen kartvizit, arama başlatan telefon kodu ve serbest metin.',
    'Burada üretilen kodlar statiktir: içerik doğrudan desene işlenir, arada yönlendirme yapan bir hizmet yoktur. Bu yüzden abonelik bitince çalışmayı bırakan kodlardan farklı olarak süresi dolmaz, ama basıldıktan sonra içeriği değiştirilemez. Adresi değişecek kampanyalar için kendi alan adınızda kalıcı bir sayfaya yönlendirme yapmak daha güvenlidir.',
    'Baskı için SVG tercih edin: büyütünce bozulmaz, afişte bile keskin kalır. Ekran ve sosyal medya için PNG yeterlidir. Kodun etrafındaki beyaz boşluk okuma için gereklidir, kesimde bu boşluğu kırpmayın. Koyu zemine kod koyacaksanız beyaz bir kutu içinde yerleştirin.',
  ],
  ornek: { baslik: 'Kullanım örneği: misafir Wi-Fi kodu', metin: [
    'Bir kuaför salonu misafir ağının şifresini her müşteriye tekrar söylemekten sıkılmıştır. Kod türünde Wi-Fi seçilir, ağ adı ve şifre yazılır, güvenlik türü olarak modem ayarındaki değer işaretlenir. PNG dosyası indirilip resepsiyona koyulacak kartın üzerine yerleştirilir.',
    'Müşteri kamerayı tuttuğunda telefon ağa bağlanmayı önerir, şifre görünmez. Şifre değişirse kodu yenilemek gerekir, çünkü bilgi desenin içindedir. Personel ağı için ayrı, misafir ağı için ayrı kod kullanmak ağ güvenliği açısından doğru tercihtir.',
  ] },
  sss: [
    ['Bu QR kodun süresi dolar mı?', 'Hayır. İçerik desenin içine yazılır, çalışması için bizim sunucumuza ihtiyaç duymaz. Kodun gösterdiği web adresi kapanırsa yalnız o sayfa açılmaz.'],
    ['Wi-Fi şifrem güvende mi?', 'Şifre tarayıcınızda işlenir, bize gönderilmez. Ancak kodu gören herkes ağa bağlanabilir; bu nedenle misafirlere ayrı ağ açmanız önerilir.'],
    ['Karekod okunmuyor, ne yapmalıyım?', 'Kodu büyütün, parlak yüzeyden kaçının, etrafındaki beyaz boşluğu koruyun. Çok uzun içerik kodu sıklaştırır; hata düzeltme seviyesini düşürmek veya metni kısaltmak okumayı kolaylaştırır.'],
    ['Ortasına logo koyabilir miyim?', 'Grafik programıyla ortasına küçük bir logo ekleyecekseniz hata düzeltmeyi en yüksek seçin ve basmadan önce birkaç telefonla deneyin.'],
  ],
};
