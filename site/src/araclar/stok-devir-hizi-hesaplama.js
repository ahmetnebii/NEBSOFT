const { GUNCELLEME_T } = require('./_kaynak-ticaret');
module.exports = {
  slug: 'stok-devir-hizi-hesaplama', kategori: 'ticaret', sira: 10, renk: '#7c3aed', guncelleme: GUNCELLEME_T, ilgili: ['nakit-akisi-hesaplama', 'kar-marji-hesaplama', 'zincirleme-iskonto-hesaplama'],
  ad: 'Stok Devir Hızı Hesaplama', kisa: 'Stoğunuz yılda kaç kez dönüyor, kaç gün yetiyor, ne kadar para bağlı görün',
  baslik: 'Stok Devir Hızı Hesaplama: Stok Günü ve Bağlı Para | NEBSOFT',
  ozet: 'Dönem başı ve sonu stok ile satılan malın maliyetinden stok devir hızını ve stok gününü bulun. Hedef güne inerseniz kasaya ne kadar para döneceğini görün.',
  sonucBaslik: 'Stok sonucu', aciklamaBaslik: 'Stok devir hızı işletmeye ne söyler?',
  program: { slug: 'marketprogrami', metin: 'Market programında sayım, kritik stok ve sipariş önerisi bir arada çalışır; alış faturası stoğu ve maliyeti kendiliğinden günceller.' },
  alanlar: [
    { ad: 'mod', etiket: 'Satılan malın maliyetini biliyor musunuz?', tip: 'secim', deger: 'alis', genis: true, secenekler: [['alis', 'Hayır, dönem alışlarından bulunsun'], ['smm', 'Evet, kendim yazacağım']] },
    { ad: 'acilis', etiket: 'Dönem başı stok (₺)', tip: 'para', deger: '240000', gerekli: true, ipucu: 'Maliyet değeriyle' },
    { ad: 'kapanis', etiket: 'Dönem sonu stok (₺)', tip: 'para', deger: '200000', gerekli: true, ipucu: 'Maliyet değeriyle' },
    { ad: 'alis', etiket: 'Dönem alışları (₺)', tip: 'para', deger: '1160000', goster: 'mod=alis' },
    { ad: 'smm', etiket: 'Satılan malın maliyeti (₺)', tip: 'para', goster: 'mod=smm', yer: 'Satış cirosu değil' },
    { ad: 'gun', etiket: 'Dönem uzunluğu (gün)', tip: 'sayi', deger: '365' },
    { ad: 'hedefGun', etiket: 'Hedef stok günü (isteğe bağlı)', tip: 'sayi', deger: '45' },
  ],
  hesap: function (v, H) {
    const r = H.stokDevir({ smm: v.smm, alis: v.mod === 'alis' ? (v.alis || 0) : undefined, acilis: v.acilis, kapanis: v.kapanis, gun: v.gun > 0 ? v.gun : 365, hedefGun: v.hedefGun });
    return H.tablo([['Stok devir hızı', `${H.sayi(r.devir)} kez`, 1], ['Stokta kalma süresi', `${H.sayi(r.gun, 1)} gün`, 1], ['Satılan malın maliyeti', H.tl(r.smm)], ['Ortalama stok', H.tl(r.ortalama)], r.hedefStok != null ? [`${H.sayi(v.hedefGun, 0)} günlük stok tutarı`, H.tl(r.hedefStok)] : null, r.hedefStok != null ? [r.serbest >= 0 ? 'Serbest kalacak para' : 'Ek stok yatırımı', H.tl(Math.abs(r.serbest)), 1] : null])
      + H.not('Sonuç bütün stoğun ortalamasıdır. Çok satan ürün, rafta bekleyen ürünü gizleyebilir; mümkünse grup grup hesaplayın.');
  },
  aciklama: [
    'Rafta duran ürün, kasaya girmemiş paradır. Stok devir hızı, ortalama stoğunuzun dönem içinde kaç kez satılıp yenilendiğini söyler. Stok günü aynı bilgiyi daha kolay okunan bir biçimde verir: elinizdeki stok bugünkü satış temposuyla yaklaşık kaç gün yeter. Aynı ciroyla daha az stok taşıyan işletme, aradaki parayı tedarikçi ödemesine veya vadeli satışa ayırabilir.',
    'Formülde pay satış cirosu değil, satılan malın maliyetidir. Ciroyu kullanırsanız hız kâr marjınız kadar yüksek çıkar ve iki ürünü karşılaştırmak anlamsızlaşır. Maliyeti bilmiyorsanız araç, dönem başı stok artı dönem alışları eksi dönem sonu stok formülüyle kendisi bulur. Stokları da satış fiyatıyla değil alış maliyetiyle girin, sayım tutarı bunun için en güvenilir kaynaktır.',
    'Hedef gün alanı sonucu karara çevirir. Yazdığınız gün kadar satışı karşılayacak stok tutarı hesaplanır ve ortalama stokla farkı gösterilir. Bu para kendiliğinden gelmez: alımı kısarak ve yavaş ürünü eriterek ortaya çıkar. Hazır bir sektör ortalaması vermiyoruz, çünkü taze gıda ile hırdavatın doğru stok günü aynı olamaz ve elimizde bunu kanıtlayan güvenilir bir veri yok.',
    'Hesap iki sayının ortalamasına dayanır, bu yüzden dönem başı ile sonu tesadüfen düşük olan mevsimlik işletmede hızı olduğundan iyi gösterebilir. Aylık sayım varsa ortalamayı siz hesaplayıp iki alana aynı rakamı yazabilirsiniz. Dönem uzunluğunu üç ay için 90, bir ay için 30 yazın. O zaman devir hızı yıllık değil, yazdığınız döneme ait olur.',
  ],
  ornek: { baslik: 'Örnek: yıllık 1,2 milyon ₺ maliyetli satış yapan mağaza', metin: [
    'Yıla 240.000 ₺ stokla giren, 1.160.000 ₺ alış yapan ve yılı 200.000 ₺ stokla kapatan mağazada satılan malın maliyeti 1.200.000 ₺ çıkar. Ortalama stok 220.000 ₺ olduğu için devir hızı 5,45 kez, stok günü 66,9’dur.',
    'Yöneticisi stok gününü 45’e indirmek istesin. Kırk beş günlük satışın maliyeti 147.945,21 ₺ eder. Ortalama stokla aradaki 72.054,79 ₺, raftan kasaya dönebilecek paradır. Mağaza bunu ek krediyle değil, yavaş dönen ürünün alımını azaltarak sağlar.',
  ] },
  sss: [
    ['Stok devir hızı formülü nedir?', 'Satılan malın maliyeti, ortalama stoğa bölünür. Ortalama stok ise dönem başı ve dönem sonu stokunun yarısıdır.'],
    ['Stok devir hızı kaç olmalı?', 'Tek doğru rakam yoktur. Kendi önceki döneminizle ve benzer ürün gruplarınızla karşılaştırmak en sağlıklısıdır.'],
    ['Stok günü nasıl hesaplanır?', 'Dönem gün sayısı devir hızına bölünür. 365 gün ve 5,45 kez için yaklaşık 67 gün çıkar.'],
    ['Devir hızı çok yüksekse iyi midir?', 'Her zaman değil. Sürekli yok satıyorsanız yüksek hız kaçan satışı gizliyor olabilir.'],
    ['Eksi sonuç neden hata veriyor?', 'Dönem sonu stok, başlangıç ve alış toplamını aşarsa maliyet eksi çıkar. Bu genelde eksik girilmiş alış veya hatalı sayım demektir.'],
  ],
};
