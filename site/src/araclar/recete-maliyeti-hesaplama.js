const { GUNCELLEME, GIB_KDV } = require('./_kaynak');
module.exports = {
  slug: 'recete-maliyeti-hesaplama', kategori: 'ticaret', sira: 4, tek: true, renk: '#c2410c', guncelleme: GUNCELLEME, kaynaklar: [GIB_KDV], ilgili: ['kar-marji-hesaplama', 'qr-menu-olusturucu'],
  ad: 'Reçete Maliyeti Hesaplama', kisa: 'Malzeme, fire ve porsiyondan yemek maliyetini ve menü fiyatını çıkarın',
  baslik: 'Reçete Maliyeti Hesaplama — Porsiyon Maliyeti ve Menü Fiyatı | NEBSOFT',
  ozet: 'Malzeme miktarı, birim fiyat ve fireyi girin; porsiyon maliyetini ve yiyecek maliyeti hedefinize göre menü fiyatını hesaplayın. Restoran ve kafeler için.',
  program: { slug: 'adisyonprogrami', metin: 'Reçeteyi satışa bağlayıp stoktan otomatik düşmek ve ürün başına kârı görmek için Adisyon programındaki reçete ve maliyet raporlarına bakın.' },
  alanlar: [
    { ad: 'kalemler', tip: 'satirlar', etiket: 'Malzemeler', ekle: 'Malzeme ekle', kolon: '2fr 90px 90px 110px 80px', ipucu: 'Fiyatı hangi birimde giriyorsanız miktarı da o birimde yazın. Örneğin kilogram fiyatı için 0,2 kg.', sutunlar: [{ ad: 'ad', etiket: 'Malzeme' }, { ad: 'miktar', etiket: 'Miktar', tip: 'sayi' }, { ad: 'birim', etiket: 'Birim', deger: 'kg' }, { ad: 'fiyat', etiket: 'Birim fiyat', tip: 'para' }, { ad: 'fire', etiket: 'Fire %', tip: 'yuzde' }], satir: [{ ad: 'Tavuk göğsü', miktar: '2', fiyat: '180', fire: '10' }, { ad: 'Pirinç', miktar: '1', fiyat: '75' }, { ad: 'Tereyağı', miktar: '0,2', fiyat: '420' }] },
    { ad: 'porsiyon', etiket: 'Çıkan porsiyon', tip: 'sayi', deger: '10', gerekli: true },
    { ad: 'hedefOran', etiket: 'Yiyecek maliyeti hedefi (%)', tip: 'yuzde', yer: 'İşletmenizin hedefi', ipucu: 'Doluysa menü fiyatı hesaplanır' },
    { ad: 'kdv', etiket: 'Menü KDV oranı', tip: 'secim', deger: '10', secenekler: [['10', '%10'], ['20', '%20'], ['1', '%1'], ['0', '%0']], ipucu: 'Ürününüzün oranını mali müşavirinizle doğrulayın' },
  ],
  hesap: function (v, H) {
    const r = H.recete({ malzemeler: v.kalemler, porsiyon: v.porsiyon, hedefOran: v.hedefOran, kdv: H.sayiOku(v.kdv) });
    return `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Malzeme</th><th class="r">Miktar</th><th class="r">Birim fiyat</th><th class="r">Fire</th><th class="r">Tutar</th></tr></thead><tbody>${r.satirlar.map((x) => `<tr><td>${H.esc(x.ad)}</td><td class="r">${H.sayi(x.miktar, 3)} ${H.esc(x.birim)}</td><td class="r">${H.tl(x.fiyat)}</td><td class="r">${x.fire ? '%' + H.sayi(x.fire) : '-'}</td><td class="r">${H.tl(x.tutar)}</td></tr>`).join('')}</tbody></table></div>` + H.tablo([['Reçete toplamı', H.tl(r.toplam)], ['Porsiyon maliyeti', H.tl(r.birim), 1], r.fiyat && ['KDV hariç menü fiyatı', H.tl(r.fiyat)], r.fiyat && ['KDV dahil menü fiyatı', H.tl(r.kdvli), 1]]) + H.not('Hesap yalnız malzemeyi kapsar. İşçilik, kira ve enerji için hedef oranınızı buna göre belirleyin.');
  },
  aciklama: [
    'Menü fiyatını komşu lokantaya bakarak belirlemek, malzeme zamlandığında kârın sessizce erimesine neden olur. Reçete maliyeti, bir tencere yemeğin ya da bir tepsi tatlının gerçekte kaça çıktığını gösterir. Bu araçta malzemeleri satır satır yazar, çıkan porsiyonu girersiniz, porsiyon başı maliyet anında görünür.',
    'Fire, en çok atlanan kalemdir. Temizlenen sebzenin kabuğu, pişerken eksilen et ve kesim artıkları satın aldığınız miktarın tamamının tabağa gitmediğini gösterir. Fire yüzdesini girdiğinizde araç satın alma tutarını buna göre büyütür. Kendi mutfağınızda bir kez tartarak gerçek değeri bulmanız en sağlıklısıdır.',
    'Yiyecek maliyeti hedefi, tabak maliyetinin satış fiyatına oranıdır. İşletmeden işletmeye değiştiği için sayfada hazır oran vermiyoruz; kendi hedefinizi girin, araç KDV hariç ve dahil menü fiyatını önersin. Malzeme fiyatları değiştikçe bu tabloyu güncellemek, zam kararını tahmine değil rakama dayandırır.',
  ],
  ornek: { baslik: 'Kullanım örneği: on porsiyon tavuklu pilav', metin: [
    'Bir lokanta 2 kg tavuk göğsünü kilosu 180 ₺’den, yüzde 10 fireyle yazar; tutar 400 ₺ çıkar. Pirinç 75 ₺, 0,2 kg tereyağı 84 ₺ eder. Reçete toplamı 559 ₺, on porsiyon için porsiyon maliyeti 55,90 ₺ olur.',
    'İşletme kendi hedefi olarak yüzde 30 belirlediğini varsayalım: KDV hariç fiyat 186,33 ₺, yüzde 10 KDV ile 204,96 ₺ görünür. Tavuk fiyatı yükseldiğinde yalnız o satırı değiştirir ve menü fiyatında ne kadar güncelleme gerektiğini hemen görür.',
  ] },
  sss: [
    ['Fire yüzdesini nasıl bulurum?', 'Malzemeyi temizlemeden ve temizledikten sonra tartın. Kaybolan miktarın ilk ağırlığa oranı firedir.'],
    ['Yiyecek maliyeti hedefi kaç olmalı?', 'Tek doğru oran yoktur. Konsept, kira ve işçilik giderinize göre değişir. Kendi giderlerinizden hesaplayarak belirleyin.'],
    ['İşçilik bu hesaba dahil mi?', 'Hayır. Araç yalnız malzeme maliyetini gösterir. Diğer giderler hedef oranınızın içinde düşünülmelidir.'],
    ['Reçeteyi kaydedebilir miyim?', 'Bu sayfa veri saklamaz. Sonucu yazdırın ya da reçete ve stok takibi için Adisyon programını kullanın.'],
  ],
};
