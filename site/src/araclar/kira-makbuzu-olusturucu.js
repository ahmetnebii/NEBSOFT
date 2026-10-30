const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'kira-makbuzu-olusturucu', kategori: 'belge', sira: 3, renk: '#047857', guncelleme: GUNCELLEME,
  ad: 'Kira Makbuzu Oluşturucu', kisa: 'Kira ödemesi için yazdırılabilir, tutarı yazıyla da gösteren makbuz',
  baslik: 'Kira Makbuzu Örneği Oluşturucu — Ücretsiz, Yazdırılabilir | NEBSOFT',
  ozet: 'Kiracı, ev sahibi, dönem ve tutarı girin; tutarı yazıyla da gösteren iki nüsha kira makbuzunu yazdırın veya PDF kaydedin. Vergi belgesi değildir, ödeme kaydı içindir.',
  sonucBaslik: 'Makbuz',
  uyari: 'Bu makbuz taraflar arası ödeme kaydıdır; fatura, serbest meslek makbuzu veya banka dekontu yerine geçmez. Kira ödemesinin banka yoluyla yapılması ve beyanname gibi konularda mali müşavirinize danışın.',
  program: { slug: 'emlakprogrami', metin: 'Birden çok daire yönetiyorsanız Emlak programı kiracı, sözleşme ve kira tahsilatını tek ekranda tutar, geciken ödemeyi önünüze getirir.' },
  alanlar: [
    { ad: 'no', etiket: 'Makbuz no', deger: '2026-01' }, { ad: 'tarih', etiket: 'Düzenleme tarihi', tip: 'tarih', bugun: true },
    { ad: 'kiraci', etiket: 'Ödeyen (kiracı)', gerekli: true, deger: 'Ayşe Yılmaz' }, { ad: 'sahip', etiket: 'Alan (mülk sahibi)', gerekli: true, deger: 'Mehmet Kaya' },
    { ad: 'adres', etiket: 'Kiralanan adres', genis: true, deger: 'Moda Mah. Örnek Sok. No: 1 D: 3 Kadıköy / İstanbul' },
    { ad: 'tutar', etiket: 'Tutar (₺)', tip: 'para', deger: '25000', gerekli: true }, { ad: 'donem', etiket: 'Ait olduğu dönem', deger: 'Kasım 2026' },
    { ad: 'sekil', etiket: 'Ödeme şekli', tip: 'secim', deger: 'Banka havalesi / EFT', secenekler: [['Banka havalesi / EFT', 'Banka havalesi / EFT'], ['Nakit', 'Nakit'], ['Kredi kartı', 'Kredi kartı']] },
    { ad: 'iki', etiket: 'İki nüsha yazdır', tip: 'onay', deger: true },
  ],
  hesap: function (v, H) {
    if (!(v.tutar > 0)) throw new Error('Tutar sıfırdan büyük olmalı');
    const n = (ad) => `<div class="belge" style="margin-top:12px"><h2>KİRA MAKBUZU</h2><div class="ust"><div>No: ${H.esc(v.no)}</div><div>Tarih: ${H.tarihTR(v.tarih)}${ad ? ` · ${ad}` : ''}</div></div><table><tbody><tr><th>Ödeyen</th><td>${H.esc(v.kiraci)}</td></tr><tr><th>Alan</th><td>${H.esc(v.sahip)}</td></tr><tr><th>Adres</th><td>${H.esc(v.adres)}</td></tr><tr><th>Dönem</th><td>${H.esc(v.donem)}</td></tr><tr><th>Tutar</th><td><b>${H.tl(v.tutar)}</b><br>Yalnız ${H.esc(H.tutarYazi(v.tutar))}</td></tr><tr><th>Ödeme şekli</th><td>${H.esc(v.sekil)}</td></tr></tbody></table><p>Yukarıdaki tutar, belirtilen dönemin kirası olarak tahsil edilmiştir.</p><div class="imza"><div>Ödeyen<br>İmza</div><div>Alan<br>İmza</div></div><p class="dip">Taraflar arası ödeme kaydıdır, vergi belgesi yerine geçmez.</p></div>`;
    return H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet')) + (v.iki ? n('Kiracı nüshası') + n('Mülk sahibi nüshası') : n(''));
  },
  aciklama: [
    'Nakit ya da elden yapılan kira ödemelerinde iki tarafın da elinde kanıt olması gerekir. Bu araç kiracı, mülk sahibi, adres, dönem ve tutar bilgisinden iki nüsha makbuz hazırlar. Tutar rakamın yanında yazıyla da gösterilir, böylece sonradan rakam üzerinde oynama tartışması çıkmaz.',
    'Makbuz, hangi ayın kirasının ödendiğini açıkça yazar. Bu ayrıntı küçük görünse de kısmi ödemelerde önemlidir: “Kasım 2026 kirasının bir bölümü” gibi bir dönem açıklaması ileride hangi ayın eksik kaldığını gösterir. Her ay numarayı sırayla artırmak, belgeleri düzenli saklamanızı kolaylaştırır.',
    'Bu belge yalnız iki taraf arasındaki ödeme kaydıdır. Bir vergi belgesi değildir, fatura yerine kullanılamaz. Banka yoluyla ödemede dekont zaten kayıt oluşturur; o durumda makbuz, kiracının ayrıca talep etmesi halinde ek bir belgedir. Vergi yükümlülükleri için bu aracı değil, mali müşavirinizin bilgisini esas alın.',
  ],
  ornek: { baslik: 'Kullanım örneği: elden ödenen kira', metin: [
    'Ayşe Hanım, Kasım 2026 kirası olan 25.000 ₺ tutarı mülk sahibine elden öder. Makbuzda dönem alanına “Kasım 2026”, ödeme şekline “Nakit” yazılır. Tutar “Yirmi beş bin Türk lirası” olarak metne eklenir.',
    'İki nüsha seçili olduğu için aynı kâğıda kiracı ve mülk sahibi kopyaları yazdırılır. Taraflar ikisini de imzalar, her biri bir nüshayı saklar. Sonraki ay numara bir artırılır ve aynı form yeniden kullanılır.',
  ] },
  sss: [
    ['Kira makbuzu yasal belge midir?', 'Taraflar arasında ödemeyi gösteren imzalı bir kayıttır, ancak vergi belgesi değildir. Resmî işlemlerde hangi belgenin istendiğini ilgili kurumdan öğrenin.'],
    ['Depozito için de kullanabilir miyim?', 'Evet. Dönem alanına “Depozito” yazın. Banka hesabına yatırılan güvenceler için sözleşmenizdeki düzenlemeye bakın.'],
    ['Makbuz numarası zorunlu mu?', 'Bu araç için zorunlu değildir, ama sıra numarası ödemeleri takip etmeyi kolaylaştırır.'],
    ['İmzasız makbuz geçerli olur mu?', 'Kanıt değeri için imza önemlidir. Yazdırdıktan sonra iki tarafın da imzalaması gerekir.'],
  ],
};
