const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'tahsilat-makbuzu-olusturucu', kategori: 'belge', sira: 4, renk: '#0369a1', guncelleme: GUNCELLEME,
  ad: 'Tahsilat Makbuzu Oluşturucu', kisa: 'Cari tahsilat, kapora ve avans için numaralı makbuz hazırlayın',
  baslik: 'Tahsilat Makbuzu Örneği — Ücretsiz Makbuz Hazırlama | NEBSOFT',
  ozet: 'Müşteriden alınan cari ödeme, kapora veya avans için numaralı tahsilat makbuzu hazırlayın, kalan bakiyeyi de gösterin ve yazdırın. Fatura yerine geçmez, iç kayıt içindir.',
  sonucBaslik: 'Makbuz',
  uyari: 'Bu belge işletme içi ödeme kaydıdır; fatura, e-Arşiv veya yazar kasa fişi yerine geçmez. Satış belgesi düzenleme yükümlülüğünüzü ayrıca yerine getirin.',
  program: { slug: 'onmuhasebeprogrami', metin: 'Tahsilatı cari hesaba işlemek, ekstre çıkarmak ve açık faturayı kapatmak için Ön Muhasebe programı aynı makbuzu kayıtlı müşteriden üretir.' },
  alanlar: [
    { ad: 'firma', etiket: 'İşletme adı', deger: 'Örnek Ticaret', gerekli: true }, { ad: 'iletisim', etiket: 'Adres / telefon' },
    { ad: 'no', etiket: 'Makbuz no', deger: 'TH-0001' }, { ad: 'tarih', etiket: 'Tarih', tip: 'tarih', bugun: true },
    { ad: 'odeyen', etiket: 'Ödeyen', deger: 'Deneme Market', gerekli: true }, { ad: 'tutar', etiket: 'Alınan tutar (₺)', tip: 'para', deger: '7500', gerekli: true },
    { ad: 'tur', etiket: 'Ödeme türü', tip: 'secim', deger: 'Cari hesap tahsilatı', secenekler: [['Cari hesap tahsilatı', 'Cari hesap tahsilatı'], ['Kapora', 'Kapora'], ['Avans', 'Avans'], ['Diğer', 'Diğer']] },
    { ad: 'sekil', etiket: 'Ödeme şekli', tip: 'secim', deger: 'Nakit', secenekler: [['Nakit', 'Nakit'], ['Havale / EFT', 'Havale / EFT'], ['Kredi kartı', 'Kredi kartı'], ['Çek', 'Çek']] },
    { ad: 'onceki', etiket: 'Önceki bakiye (₺)', tip: 'para', ipucu: 'Boş bırakılırsa bakiye satırı basılmaz' },
    { ad: 'aciklama', etiket: 'Açıklama', deger: 'Ekim ayı mal bedeli' },
  ],
  hesap: function (v, H) {
    if (!(v.tutar > 0)) throw new Error('Tutar sıfırdan büyük olmalı'); const kalan = v.onceki != null ? H.yuvarla(v.onceki - v.tutar) : null;
    return `${H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet'))}<div class="belge" style="margin-top:12px"><h2>TAHSİLAT MAKBUZU</h2><div class="ust"><div><b>${H.esc(v.firma)}</b><br>${H.esc(v.iletisim)}</div><div style="text-align:right">No: ${H.esc(v.no)}<br>Tarih: ${H.tarihTR(v.tarih)}</div></div><table><tbody><tr><th>Ödeyen</th><td>${H.esc(v.odeyen)}</td></tr><tr><th>Tür / şekil</th><td>${H.esc(v.tur)} · ${H.esc(v.sekil)}</td></tr><tr><th>Açıklama</th><td>${H.esc(v.aciklama)}</td></tr><tr><th>Alınan tutar</th><td><b>${H.tl(v.tutar)}</b><br>Yalnız ${H.esc(H.tutarYazi(v.tutar))}</td></tr>${kalan != null ? `<tr><th>Önceki bakiye</th><td>${H.tl(v.onceki)}</td></tr><tr><th>Kalan bakiye</th><td><b>${H.tl(kalan)}</b>${kalan < 0 ? ' (fazla ödeme)' : ''}</td></tr>` : ''}</tbody></table><div class="imza"><div>Teslim eden<br>İmza</div><div>Teslim alan<br>${H.esc(v.firma)}</div></div><p class="dip">İşletme içi ödeme kaydıdır, fatura yerine geçmez.</p></div>`;
  },
  aciklama: [
    'Toptancı, usta, atölye ya da servis gibi veresiye ve kaporayla çalışan işletmelerde “ödemiştim” tartışmasının en kolay çözümü, para alındığı anda verilen numaralı bir makbuzdur. Bu araç ödeyen kişiyi, tutarı, ödeme şeklini ve açıklamayı tek sayfada toplar, isterseniz önceki bakiyeden düşerek kalan borcu da gösterir.',
    'Kalan bakiye satırı küçük ama değerlidir: müşteri her ödemede ne kadar borcu kaldığını görür, ay sonunda ekstre tartışması azalır. Önceki bakiye alanını boş bırakırsanız satır basılmaz; yalnız kapora veya avans alıyorsanız bu daha sadedir.',
    'Bu belge işletmenin kendi kaydıdır. Satış gerçekleştiyse ayrıca fatura veya kasa fişi düzenlemek gerekir; makbuz bunların yerine geçmez. Kapora alındığında satış henüz tamamlanmamış olabilir, bunun muhasebe karşılığını mali müşavirinizle netleştirin. Numaraları sırayla kullanın ve kopyayı saklayın.',
  ],
  ornek: { baslik: 'Kullanım örneği: veresiye hesaptan kısmi ödeme', metin: [
    'Bir toptancının müşterisinin 20.000 ₺ cari borcu vardır ve Ekim ayı mal bedeli için 7.500 ₺ nakit öder. Önceki bakiye alanına 20.000, alınan tutara 7.500 yazılır. Makbuzda kalan bakiye 12.500 ₺ olarak görünür.',
    'Tahsilat yapan çalışan makbuzu yazdırır, iki taraf imzalar. Aynı bilgi işletmenin cari defterine işlenir. Ay sonunda müşteri elindeki makbuzlarla bakiyeyi kolayca karşılaştırır; fark varsa hangi ödemede oluştuğu numaradan bulunur.',
  ] },
  sss: [
    ['Tahsilat makbuzu fatura yerine geçer mi?', 'Hayır. Satış veya hizmet için ayrıca fatura ya da mevzuatın istediği belge düzenlenmelidir.'],
    ['Çekle ödemede ne yazmalıyım?', 'Ödeme şeklinde çek seçin, açıklamaya çek numarasını, bankayı ve vade tarihini ekleyin. Tahsilat çek ödendiğinde kesinleşir.'],
    ['Kalan bakiye eksi çıkıyor, ne demek?', 'Alınan tutar borçtan fazladır. Makbuzda fazla ödeme olarak görünür; bu tutarı sonraki işlere mahsup edebilir veya iade edebilirsiniz.'],
    ['Makbuz numaralarını nereden takip ederim?', 'Araç numarayı hatırlamaz, çünkü veri kaydedilmez. Son numarayı defterinizde tutun veya Ön Muhasebe programını kullanın.'],
  ],
};
