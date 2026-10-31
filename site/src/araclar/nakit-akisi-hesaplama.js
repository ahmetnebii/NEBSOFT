const { GUNCELLEME_T } = require('./_kaynak-ticaret');
module.exports = {
  slug: 'nakit-akisi-hesaplama', kategori: 'ticaret', sira: 9, renk: '#047857', guncelleme: GUNCELLEME_T, ilgili: ['ortalama-vade-hesaplama', 'stok-devir-hizi-hesaplama', 'personel-maliyeti-hesaplama'],
  ad: 'Nakit Akışı Hesaplama', kisa: 'Kasanın hangi ay eksiye düşeceğini ve tahsilat gecikirse ne olacağını görün',
  baslik: 'Nakit Akışı Hesaplama: Aylık Tablo ve Eksi Bakiye Uyarısı | NEBSOFT',
  ozet: 'Aylık tahsilat ve ödemelerinizi girin, kasanın hangi ay eksiye düştüğünü ve gereken finansmanı görün. Tahsilat gecikirse tablonun nasıl değiştiğini deneyin.',
  sonucBaslik: 'Nakit tablosu', aciklamaBaslik: 'Kâr eden işletmenin kasası neden eksiye düşer?',
  program: { slug: 'onmuhasebeprogrami', metin: 'Bu tabloyu tahmini rakamlarla kuruyorsunuz. Ön Muhasebe programında kasa ve banka hesapları ile vadesi yaklaşan tahsilat ve ödemeler kayıtlarınızdan izlenir.' },
  alanlar: [
    { ad: 'acilis', etiket: 'Dönem başı kasa + banka (₺)', tip: 'para', deger: '180000', gerekli: true },
    { ad: 'alt', etiket: 'Kasada kalmasını istediğiniz en az tutar (₺)', tip: 'para', deger: '50000' },
    { ad: 'gecikme', etiket: 'Bir ay geciken tahsilat oranı (%)', tip: 'yuzde', deger: '20', genis: true, ipucu: 'Her ayın tahsilatının bu kadarı ertesi aya kayarsa diye ikinci bir tablo kurar. 0 yazarsanız kapanır.' },
    { ad: 'aylar', tip: 'satirlar', etiket: 'Aylar', ekle: 'Ay ekle', ipucu: 'Fatura tarihini değil, paranın gerçekten girip çıkacağı ayı yazın.', sutunlar: [{ ad: 'ad', etiket: 'Ay', tip: 'metin' }, { ad: 'tahsilat', etiket: 'Tahsilat (₺)', tip: 'para' }, { ad: 'odeme', etiket: 'Ödeme (₺)', tip: 'para' }], satir: [{ ad: 'Kasım', tahsilat: '420000', odeme: '460000' }, { ad: 'Aralık', tahsilat: '380000', odeme: '510000' }, { ad: 'Ocak', tahsilat: '300000', odeme: '480000' }, { ad: 'Şubat', tahsilat: '520000', odeme: '430000' }, { ad: 'Mart', tahsilat: '560000', odeme: '440000' }, { ad: 'Nisan', tahsilat: '540000', odeme: '450000' }] },
  ],
  hesap: function (v, H) {
    const r = H.nakitAkisi({ acilis: v.acilis, aylar: v.aylar, gecikme: v.gecikme, alt: v.alt }); const sen = v.gecikme > 0;
    const dip = (o, ek) => [`${o.ilkEksi ? `${H.esc(o.ilkEksi)} ayında eksiye düşüyor` : 'Eksiye düşmüyor'}${ek}. En düşük kasa ${H.esc(o.enDusukAy)} sonunda`, H.tl(o.enDusuk), 1];
    return `<div class="ar-tablo-k"><table class="ar-liste-t"><thead><tr><th>Ay</th><th class="r">Ay sonu kasa</th>${sen ? '<th class="r">Gecikmeyle</th>' : ''}</tr></thead><tbody>${r.satirlar.map((x) => `<tr><td>${H.esc(x.ad)}</td><td class="r">${H.tl(x.kapanis)}</td>${sen ? `<td class="r">${H.tl(x.senaryoKapanis)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
      + H.tablo([dip(r.normal, ''), ['Gereken ek finansman', H.tl(r.normal.finansman), 1], sen ? dip(r.senaryo, ' (gecikmeyle)') : null, sen ? ['Gecikmede ek finansman', H.tl(r.senaryo.finansman)] : null])
      + H.not('Tablo girdiğiniz tahminlerden kurulur, ay içindeki dalgalanmayı göstermez. Finansman tutarına kredi faizi dahil değildir.');
  },
  aciklama: [
    'Kârlılık tablosu satışı fatura kesildiği ay yazar, kasa ise parayı girdiği gün görür. Altmış gün vadeyle satıp otuz günde ödeyen işletme, kâr ederken maaş gününde hesabında para bulamayabilir. Bu tablo muhasebe raporu değildir; önümüzdeki aylarda elinize geçecek ve çıkacak parayı alt alta koyarak “kasa hangi ay yetmiyor” sorusunu yanıtlar.',
    'Her satıra paranın gerçekten hareket edeceği ayı yazın. Peşin satışlar, vadesi gelen çekler ve kart blokeleri tahsilata girer. Maaş, kira, tedarikçi ödemesi, vergi, SGK ve kredi taksiti ödemeye girer. Amortisman gibi kasadan para çıkarmayan giderleri yazmayın. Her ayın kapanışı bir sonraki ayın başlangıcı olur, bu nedenle tek zayıf ay sonraki bütün ayları etkiler.',
    'Küçük işletmenin en sık yaşadığı risk satışın düşmesi değil, paranın geç gelmesidir. Gecikme alanına yazdığınız oran, her ayın tahsilatının o kadarını ertesi aya kaydırır ve ikinci sütunu buna göre kurar. Tablonun son ayından taşan tutar dönem dışında kalır. İlk ayın tahsilatına geçmiş dönemden sarkan parayı siz eklemelisiniz, araç geçmişi bilemez.',
    'Gereken ek finansman, en düşük kapanışın belirlediğiniz alt tutara çıkması için bulunması gereken paradır. Bu rakam krediye başvurmadan önce pazarlık alanını da gösterir: tedarikçi ödemesini bir ay ertelemek veya tahsilatı öne almak aynı boşluğu kapatabilir. Satırları değiştirerek hangi kararın ne kadar rahatlattığını denemek için kayıt gerekmez, girdiğiniz rakamlar da cihazınızdan çıkmaz.',
  ],
  ornek: { baslik: 'Örnek: kışın zayıflayan altı aylık tablo', metin: [
    'Bir işletme Kasım’a 180.000 ₺ ile giriyor. Kapanışlar sırasıyla 140.000, 10.000, -170.000, -80.000, 40.000 ve 130.000 ₺ çıkıyor. Yıl sonu toplamı artıda olsa bile Ocak ayında kasa 170.000 ₺ ekside. Kasada 50.000 ₺ kalsın isteniyorsa gereken ek finansman 220.000 ₺ olur.',
    'Her ayın tahsilatının yüzde 20’si bir ay geciksin. Kapanışlar 56.000, -66.000, -230.000, -184.000, -72.000 ve 22.000 ₺’ye döner. Eksiye düşüş bir ay öne, Aralık’a gelir, ihtiyaç da 280.000 ₺’ye çıkar. Yani tahsilatta yaşanacak küçük bir kayma 60.000 ₺ fazla kaynak istiyor.',
  ] },
  sss: [
    ['Nakit akışı ile kâr arasındaki fark nedir?', 'Kâr satış ve gideri döneme göre ölçer. Nakit akışı paranın fiilen girdiği ve çıktığı ana bakar.'],
    ['Kaç ay girmeliyim?', 'En az önümüzdeki üç ayı girin. Mevsimsel işlerde altı ila on iki ay daha anlamlı sonuç verir.'],
    ['KDV’yi nasıl yazmalıyım?', 'Tahsilat ve ödemeyi KDV dahil, kasaya giren çıkan tutarla yazın. Ödenecek KDV’yi beyanın ödendiği aya ayrıca ekleyin.'],
    ['Tablo kredi faizini hesaba katıyor mu?', 'Hayır. Kullandığınız kredinin taksitini ödeme satırına kendiniz eklemelisiniz.'],
    ['Açılış tutarı eksi olabilir mi?', 'Evet. Eksi bakiyeli hesap kullanıyorsanız başına eksi yazarak girebilirsiniz.'],
  ],
};
