const { GUNCELLEME, KMK } = require('./_kaynak');
module.exports = {
  slug: 'aidat-gecikme-tazminati-hesaplama', kategori: 'emlak', sira: 2, mevzuat: true, tek: true, renk: '#b91c1c', guncelleme: GUNCELLEME, kaynaklar: [KMK], ilgili: ['aidat-paylasimi-hesaplama', 'tahsilat-makbuzu-olusturucu'],
  ad: 'Aidat Gecikme Tazminatı Hesaplama', kisa: 'Kat Mülkiyeti Kanunu md. 20’ye göre geciken aidatın tazminatını gün gün bulun',
  baslik: 'Aidat Gecikme Tazminatı Hesaplama — KMK md. 20 Aylık Yüzde 5 | NEBSOFT',
  ozet: 'Ödenmeyen aidat ve ortak gider paylarınızı vade tarihleriyle girin; Kat Mülkiyeti Kanunu md. 20’deki aylık yüzde 5 oranıyla gün bazında gecikme tazminatını ve toplam borcu görün.',
  uyari: 'Hesap bileşik değildir ve bir ayı 30 gün sayar. Yönetim planınızı, kesinleşmiş işletme projenizi ve varsa icra takibindeki hesabı ayrıca kontrol edin; hukuki uyuşmazlıkta avukata danışın.',
  program: { slug: 'siteyonetimprogrami', metin: 'Site Yönetim programı her dairenin borcunu ve gecikme tazminatını kendisi izler, sakin portalından gösterir, tahsilatı kasaya işler.' },
  alanlar: [
    { ad: 'tarih', etiket: 'Hesap tarihi', tip: 'tarih', bugun: true, gerekli: true },
    { ad: 'kalemler', tip: 'satirlar', etiket: 'Ödenmeyen aidatlar', ekle: 'Dönem ekle', sutunlar: [{ ad: 'donem', etiket: 'Dönem' }, { ad: 'tutar', etiket: 'Tutar (₺)', tip: 'para' }, { ad: 'vade', etiket: 'Son ödeme tarihi', tip: 'tarih' }], satir: [{ donem: 'Ağustos 2026', tutar: '1500', vade: '2026-08-10' }, { donem: 'Eylül 2026', tutar: '1500', vade: '2026-09-10' }] },
  ],
  hesap: function (v, H) {
    const r = H.gecikmeTazminati({ satirlar: v.kalemler, tarih: v.tarih });
    return `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Dönem</th><th class="r">Tutar</th><th class="r">Geciken gün</th><th class="r">Tazminat</th></tr></thead><tbody>${r.satirlar.map((x) => `<tr><td>${H.esc(x.donem)}</td><td class="r">${H.tl(x.tutar)}</td><td class="r">${x.gun}</td><td class="r">${H.tl(x.tazminat)}</td></tr>`).join('')}</tbody></table></div>` + H.tablo([['Asıl borç', H.tl(r.anapara)], ['Gecikme tazminatı', H.tl(r.tazminat)], ['Toplam', H.tl(r.toplam), 1]]) + H.eylemler(H.btn('yazdir', 'Yazdır'));
  },
  aciklama: [
    'Kat Mülkiyeti Kanununun 20. maddesi, gider ve avans payını ödemeyen kat maliki için gecikme tazminatını düzenler: ödemede geciken günler için aylık yüzde beş hesabıyla tazminat işler. Kanunun ilk metnindeki yüzde on oranı 2007 değişikliğiyle yüzde beşe indirilmiştir. Bu nedenle sayfada oran alanı yoktur; yöneticinin bu oranı değiştirmesi istenen bir ayar değil, kanun metnindeki değerdir.',
    'Sık yapılan hata tazminatı tam ay üzerinden hesaplamaktır. Metin “geciken günler” dediği için araç her satırı gün bazında hesaplar: tutar çarpı yüzde beş çarpı gün, bölü otuz. Sonuç bileşik değildir, yani önceki tazminat tekrar tazminata girmez. Her dönemin vadesi farklı olduğundan satırları ayrı girmek gerekir. Hesap tarihi son ödeme tarihinden önceyse o satırda tazminat çıkmaz.',
    'Yönetici için bu dökümün faydası, kat malikine gerekçeli ve kontrol edilebilir bir tablo sunmasıdır. Kesinleşmiş işletme projesinin ve yönetim planının içeriği ödeme günlerini belirler, bu yüzden son ödeme tarihlerini kendi kararınızdan girin. Tazminat tutarı icra takibine konu olacaksa hesabı bir hukukçuya doğrulatın.',
  ],
  ornek: { baslik: 'Kullanım örneği: iki aylık aidat borcu', metin: [
    'Aylık aidatı 1.500 ₺ olan bir daire Ağustos ve Eylül aidatlarını ödememiştir. Son ödeme tarihleri 10 Ağustos ve 10 Eylül’dür. 30 Ekim’de yapılan hesapta ilk satır 81 gün, ikinci satır 50 gün gecikmiş görünür.',
    'Ağustos için 1.500 çarpı yüzde 5 çarpı 81 bölü 30 işlemiyle 202,50 ₺, Eylül için 125 ₺ tazminat çıkar. Asıl borç 3.000 ₺, tazminat 327,50 ₺, toplam 3.327,50 ₺ olur. Yönetici dökümü yazdırıp daire sahibine iletir.',
  ] },
  sss: [
    ['Aidat gecikme tazminatı oranı nedir?', 'Kat Mülkiyeti Kanunu md. 20’ye göre ödemede geciken günler için aylık yüzde beştir.'],
    ['Tazminat aylık mı günlük mü işler?', 'Oran aylıktır, ama metin geciken günleri esas alır. Araç bir ayı 30 gün sayarak gün bazında hesaplar.'],
    ['Tazminat üzerine tazminat işler mi?', 'Araç bileşik hesap yapmaz. Yalnız ödenmemiş asıl aidat tutarı üzerinden hesaplar.'],
    ['Kiracı gider ödemezse ne olur?', 'Kanun yönetici veya kat malikinin takip yollarını düzenler. Somut durum için avukata danışın.'],
  ],
};
