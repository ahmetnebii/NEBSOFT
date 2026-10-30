const { GUNCELLEME_T, VUK_AMORTISMAN, GVK_BINEK, GIB_OMUR } = require('./_kaynak-ticaret');
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
module.exports = {
  slug: 'amortisman-hesaplama', kategori: 'ticaret', sira: 6, mevzuat: true, renk: '#0f766e', guncelleme: GUNCELLEME_T, kaynaklar: [VUK_AMORTISMAN, GVK_BINEK, GIB_OMUR], ilgili: ['personel-maliyeti-hesaplama', 'nakit-akisi-hesaplama', 'kar-marji-hesaplama'],
  ad: 'Amortisman Hesaplama', kisa: 'Normal ve azalan bakiye planını yıl yıl yan yana görün, binek kıstını ekleyin',
  baslik: 'Amortisman Hesaplama: Normal ve Azalan Bakiye Tablosu | NEBSOFT',
  ozet: 'Alış bedelini ve faydalı ömrü girin, normal ve azalan bakiye amortismanını yıl yıl görün. Binek otomobilde ilk yıl ay hesabı eklenir, üyelik gerekmez.',
  sonucBaslik: 'Amortisman planı', aciklamaBaslik: 'İki usul arasındaki fark ne zaman önemli olur?',
  uyari: 'Bu tablo plan amaçlıdır, vergi danışmanlığı yerine geçmez. Kıymetin faydalı ömrünü, usul seçimini ve güncel gider sınırlarını beyandan önce mali müşavirinizle doğrulayın.',
  program: { slug: 'onmuhasebeprogrami', metin: 'Ön Muhasebe programı amortisman tablosu tutmaz; gelir ve giderlerinizi kategoriyle izler, kâr-zarar raporu verir. Buradaki planı mali müşavirinizle birlikte kullanın.' },
  alanlar: [
    { ad: 'bedel', etiket: 'Amortismana tabi bedel (₺)', tip: 'para', deger: '120000', gerekli: true, ipucu: 'Fatura bedeli ve maliyete eklenen tutarlar, KDV hariç' },
    { ad: 'omur', etiket: 'Faydalı ömür (yıl)', tip: 'sayi', deger: '5', gerekli: true, ipucu: 'GİB listesindeki süre, sayfanın altındaki kaynakta' },
    { ad: 'yil', etiket: 'Aktife girdiği yıl', tip: 'sayi', deger: '2026' },
    { ad: 'binek', etiket: 'Bu kıymet binek otomobil (kiralama işi yapan işletmeler hariç)', tip: 'onay' },
    { ad: 'ay', etiket: 'Aktife girdiği ay', tip: 'secim', deger: '10', goster: 'binek=true', secenekler: AYLAR.map((a, i) => [String(i + 1), a]) },
  ],
  hesap: function (v, H) {
    const r = H.amortisman({ bedel: v.bedel, omur: v.omur, yil: v.yil > 0 ? Math.floor(v.yil) : 1, binek: v.binek, ay: H.sayiOku(v.ay) }); const s = r.satirlar; const fark = H.yuvarla(s[0].azalan - s[0].normal);
    return H.tablo([['Normal amortisman oranı', `%${H.sayi(r.normalOran)}`], ['Azalan bakiye oranı', `%${H.sayi(r.azalanOran)}`], [`İlk yıl normal usul${v.binek ? ` (${r.ayKist} ay)` : ''}`, H.tl(s[0].normal), 1], [`İlk yıl azalan bakiye${v.binek ? ` (${r.ayKist} ay)` : ''}`, H.tl(s[0].azalan), 1], ['İlk yıl farkı', H.tl(fark)]])
      + `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Yıl</th><th class="r">Normal</th><th class="r">Azalan</th></tr></thead><tbody>${s.map((x) => `<tr><td>${x.yil}</td><td class="r">${H.tl(x.normal)}</td><td class="r">${H.tl(x.azalan)}</td></tr>`).join('')}</tbody></table></div>`
      + H.not(v.binek ? 'İlk yıl ayrılmayan tutar son yıla eklendi. Binek otomobilde gider yazılabilecek kısım için ayrıca kanuni sınır vardır, tablo bu sınırı uygulamaz.' : 'Son yıla devreden bakiye o yıl tamamen yazılır, bu yüzden azalan bakiyede son satır önceki yıldan büyük olabilir.');
  },
  aciklama: [
    'Makine, araç veya demirbaş alan işletme, bedeli tek yılda gider yazamaz; kıymet ömrüne yayılarak yok edilir. Toplam gider iki usulde de aynıdır, değişen şey giderin hangi yıla düştüğüdür. Azalan bakiyede ilk yılların gideri yüksek olduğu için kârlı dönemde vergi matrahı erken düşer, sonraki yıllarda bu avantaj geri döner. Tablo bu zaman farkını görmek içindir.',
    'Normal usulde yıllık oran, bir bölü faydalı ömürdür. Azalan bakiyede oran normalin iki katıdır ama yüzde 50’yi geçemez; her yıl kalan değere uygulanır, sürenin son yılında devreden bakiye tamamen yazılır. Azalan bakiye yalnız bilanço esasına göre defter tutan mükellefler içindir, işletme hesabı esasında çalışıyorsanız normal sütununa bakın.',
    'Karar verirken dönüş yolunu da düşünün. Kanuna göre normal usulle başlanan kıymette azalan bakiyeye geçilemez, azalan bakiyeden normale ise bildirimle geçilebilir. Faydalı ömrü GİB listesinden siz girersiniz, çünkü liste tebliğlerle değişmiştir ve burada hazır oran tutulmaz. VUK 320 size listedeki süreden kısa olmamak, iki katını ve elli yılı aşmamak üzere daha uzun süre seçme imkânı da tanır.',
    'Araç üç şeyi hesaplamaz. Gün esasına göre amortisman seçeneği, enflasyon düzeltmesi veya yeniden değerleme tabloya girmez. Değeri kanuni sınırın altında kalan demirbaş amortisman yerine doğrudan gider yazılabilir; bu sınır güncellendiği için tutarını VUK 313 metninden kontrol edin. Binek otomobilde ilk yıl, aktife giriş ayı tam sayılarak kalan ay kadar amortisman ayrılır, kalan kısım son yılda yazılır.',
  ],
  ornek: { baslik: 'Örnek: 120.000 ₺ makine ve 600.000 ₺ binek otomobil', metin: [
    'Bilanço esasında çalışan atölye 120.000 ₺ bedelli, beş yıl ömürlü makine alsın. Normal usulde her yıl yüzde 20 ile 24.000 ₺ yazılır. Azalan bakiyede oran yüzde 40 olur ve yıllar sırasıyla 48.000, 28.800, 17.280, 10.368 ve 15.552 ₺ çıkar. Toplam yine 120.000 ₺ eder, ilk yılın farkı 24.000 ₺ gider öne çekmektir.',
    'Ekim ayında alınan 600.000 ₺ bedelli binek otomobilde ömür beş yıl olsun. Ekim tam ay sayıldığı için ilk yıl üç aylık pay yazılır: 30.000 ₺. Sonraki üç yıl 120.000 ₺ ayrılır, ayrılamayan 90.000 ₺ son yıla eklenir ve beşinci yıl 210.000 ₺ olur.',
  ] },
  sss: [
    ['Amortisman oranını nereden bulurum?', 'Kıymet türünün faydalı ömrü GİB’in amortisman listesinde yer alır, kaynak bağlantısı sayfanın altındadır. Oran, bir bölü ömürdür: beş yıllık kıymette yüzde 20.'],
    ['Azalan bakiye herkes için geçerli mi?', 'Hayır. Kanun bu usulü bilanço esasına göre defter tutan mükelleflere tanır.'],
    ['Binek otomobil neden ayrı işaretleniyor?', 'Binekte ilk yıl yalnız kalan aylar kadar amortisman ayrılır. Faaliyeti binek kiralamak veya işletmek olanların bu araçları bu kuralın dışındadır.'],
    ['Kıymeti süre bitmeden satarsam tablo geçerli mi?', 'Hayır, tablo kıymetin süre sonuna kadar işletmede kaldığını varsayar. Satış durumunu mali müşavirinizle değerlendirin.'],
    ['Faydalı ömür küsuratlı yazılabilir mi?', 'Araç 1 ile 50 arasında tam yıl kabul eder. Elli yıllık üst sınır VUK 320’deki süre tercihinden gelir.'],
  ],
};
