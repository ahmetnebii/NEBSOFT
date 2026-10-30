const { GUNCELLEME, KMK } = require('./_kaynak');
module.exports = {
  slug: 'aidat-paylasimi-hesaplama', kategori: 'emlak', sira: 3, mevzuat: true, tek: true, renk: '#0369a1', guncelleme: GUNCELLEME, kaynaklar: [KMK], ilgili: ['aidat-gecikme-tazminati-hesaplama', 'kira-artis-hesaplama'],
  ad: 'Aidat Paylaşımı Hesaplama', kisa: 'Ortak giderleri eşit ve arsa payına göre dairelere kuruşu kuruşuna bölün',
  baslik: 'Aidat Hesaplama — Arsa Payına Göre Gider Paylaşımı | NEBSOFT',
  ozet: 'Apartman ve site giderlerini KMK md. 20’ye göre dağıtın: görevli giderleri eşit, diğerleri arsa payı oranında. Daire başına aylık aidatı kuruş farksız görün.',
  uyari: 'Bu ayrım yönetim planında veya kat malikleri arasında aksi kararlaştırılmamışsa geçerlidir. Önce kendi yönetim planınızı okuyun; plan farklıysa o uygulanır.',
  program: { slug: 'siteyonetimprogrami', metin: 'Bu dağıtımı her dönem elle yapmak yerine Site Yönetim programında işletme projesi hazırlayın; aidatlar dairelere kendiliğinden yansısın, tahsilat izlensin.' },
  alanlar: [
    { ad: 'esitGider', etiket: 'Görevli giderleri (₺)', tip: 'para', deger: '360000', ipucu: 'Kapıcı, kaloriferci, bahçıvan, bekçi: eşit bölünür' },
    { ad: 'arsaGider', etiket: 'Diğer ortak giderler (₺)', tip: 'para', deger: '240000', ipucu: 'Sigorta, bakım, onarım, yönetici ücreti: arsa payına göre' },
    { ad: 'ay', etiket: 'Kaç aya bölünecek?', tip: 'sayi', deger: '12' },
    { ad: 'daireler', tip: 'satirlar', etiket: 'Daireler', ekle: 'Daire ekle', ipucu: 'Arsa payını tapudaki pay olarak yazın. Örneğin 240 üzerinden 20 ise 20 yazın.', sutunlar: [{ ad: 'ad', etiket: 'Daire' }, { ad: 'arsaPayi', etiket: 'Arsa payı', tip: 'sayi' }], satir: [{ ad: 'Daire 1', arsaPayi: '20' }, { ad: 'Daire 2', arsaPayi: '20' }, { ad: 'Daire 3', arsaPayi: '30' }, { ad: 'Daire 4', arsaPayi: '30' }] },
  ],
  hesap: function (v, H) {
    const r = H.aidatPaylas({ daireler: v.daireler, esitGider: v.esitGider, arsaGider: v.arsaGider, ay: v.ay });
    return `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Daire</th><th class="r">Eşit pay</th><th class="r">Arsa payı kısmı</th><th class="r">Toplam</th><th class="r">Aylık</th></tr></thead><tbody>${r.satirlar.map((x) => `<tr><td>${H.esc(x.ad)}</td><td class="r">${H.tl(x.esit)}</td><td class="r">${H.tl(x.arsa)}</td><td class="r">${H.tl(x.toplam)}</td><td class="r"><b>${H.tl(x.aylik)}</b></td></tr>`).join('')}</tbody></table></div>` + H.tablo([['Dağıtılan toplam', H.tl(r.toplam), 1]]) + H.eylemler(H.btn('yazdir', 'Yazdır'));
  },
  aciklama: [
    'Aidat herkese eşit bölünür düşüncesi yaygındır, ama Kat Mülkiyeti Kanunu böyle demez. Madde 20’ye göre aralarında başka anlaşma yoksa kat malikleri kapıcı, kaloriferci, bahçıvan ve bekçi giderlerine eşit olarak katılır. Sigorta primleri, ortak yerlerin bakım, koruma, güçlendirme ve onarım giderleri, yönetici ücreti ve ortak tesislerin işletme giderleri ise arsa payı oranında paylaşılır.',
    'Bu araç iki gider grubunu ayrı girmenizi ister ve her dairenin payını hesaplar. Kuruş farkı kalmaması için tutar kuruşa çevrilip küsuratlar en büyük paydan başlayarak dağıtılır, böylece daire payları toplamı girdiğiniz gideri tam karşılar. Tabloda eşit ve arsa payı bölümü ayrı sütunlardadır, sakinlere gerekçesiyle gösterebilirsiniz.',
    'Kanun, ortak yerlerden yararlanmadığını söyleyen kat malikinin gider payından kaçınamayacağını da belirtir. Yönetim planınız farklı bir paylaşım öngörüyorsa o geçerlidir, bu yüzden önce planı okuyun. Asansörlü bloklar veya ısınma payı gibi özel dağıtımlar için giderleri ayrı hesaplayıp sonuçları birleştirmeniz gerekebilir.',
  ],
  ornek: { baslik: 'Kullanım örneği: dört daireli apartman', metin: [
    'Bir apartmanın yıllık görevli gideri 360.000 ₺, bakım ve sigorta gideri 240.000 ₺ olsun. Görevli gideri dört daireye 90.000 ₺ olarak eşit bölünür. Toplam arsa payı 100 kabul edilen yapıda 20 paylı daire 48.000 ₺, 30 paylı daire 72.000 ₺ üstlenir.',
    'Sonuçta küçük daireler yıllık 138.000 ₺, büyük daireler 162.000 ₺ öder. On iki aya bölününce aylık aidat 11.500 ₺ ve 13.500 ₺ olur. Yönetici tabloyu yazdırıp toplantı evrakına ekler.',
  ] },
  sss: [
    ['Aidat arsa payına göre mi eşit mi hesaplanır?', 'KMK md. 20’ye göre görevli giderleri eşit, diğer ortak giderler arsa payı oranında paylaşılır. Yönetim planı aksini öngörebilir.'],
    ['Arsa payını nereden öğrenirim?', 'Tapu kaydınızda ve yönetim planı ekinde yazar. Tapudaki pay rakamını girin.'],
    ['Daire boş olsa da aidat ödenir mi?', 'Kanun, ortak yerlerden yararlanmadığını öne süren malikin gider payından kaçınamayacağını belirtir.'],
    ['Kuruş farkı neden çıkmıyor?', 'Araç küsuratları en büyük kalana dağıtır, böylece daire payları toplamı girilen gideri tam karşılar.'],
  ],
};
