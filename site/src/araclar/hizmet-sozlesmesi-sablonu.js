const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'hizmet-sozlesmesi-sablonu', kategori: 'belge', sira: 2, renk: '#334155', guncelleme: GUNCELLEME,
  ad: 'Hizmet Sözleşmesi İskeleti', kisa: 'Taraflar, bedel, süre ve fesih maddeleri doldurulmuş sözleşme taslağı çıkarın',
  baslik: 'Hizmet Sözleşmesi Örneği Oluşturucu — Ücretsiz Taslak | NEBSOFT',
  ozet: 'Taraf, iş tanımı, bedel, ödeme, süre ve fesih bilgilerini girin; gözden geçirmeye hazır hizmet sözleşmesi taslağını yazdırın. Taslak olduğu için imzadan önce hukukçuya gösterin.',
  sonucBaslik: 'Sözleşme taslağı',
  uyari: 'Bu metin genel bir iskelettir, hukuki danışmanlık değildir. İşinize özgü riskleri kapsamayabilir; imzalamadan önce bir avukata inceletin.',
  program: { slug: 'hukukburosuprogrami', metin: 'Sözleşme, dava ve müvekkil dosyalarını süreleriyle birlikte tutan bürolar için Hukuk Bürosu programı takip ve hatırlatmayı tek yerde toplar.' },
  alanlar: [
    { ad: 'hizmetveren', etiket: 'Hizmet veren', deger: 'Örnek Danışmanlık Ltd. Şti.', gerekli: true }, { ad: 'hvadres', etiket: 'Hizmet veren adresi' },
    { ad: 'hizmetalan', etiket: 'Hizmet alan', deger: 'Deneme Gıda A.Ş.', gerekli: true }, { ad: 'hadres', etiket: 'Hizmet alan adresi' },
    { ad: 'konu', etiket: 'İşin tanımı', tip: 'cokmetin', deger: 'Web sitesinin aylık bakımı, güvenlik güncellemeleri ve içerik düzenlemeleri.', gerekli: true },
    { ad: 'bedel', etiket: 'Hizmet bedeli (₺)', tip: 'para', deger: '15000' },
    { ad: 'kdvli', etiket: 'Bedel', tip: 'secim', deger: 'haric', secenekler: [['haric', 'KDV hariç'], ['dahil', 'KDV dahil']] },
    { ad: 'odeme', etiket: 'Ödeme düzeni', deger: 'Her ayın ilk beş günü içinde fatura karşılığı' },
    { ad: 'bas', etiket: 'Başlangıç', tip: 'tarih', bugun: true }, { ad: 'bit', etiket: 'Bitiş', tip: 'tarih' },
    { ad: 'fesih', etiket: 'Fesih bildirim süresi (gün)', tip: 'sayi', deger: '30' }, { ad: 'sehir', etiket: 'Yetkili mahkeme şehri', deger: 'İstanbul' },
    { ad: 'ek', etiket: 'Ek hüküm', tip: 'cokmetin', yer: 'İşe özel eklemek istediğiniz madde' },
  ],
  hesap: function (v, H) {
    let m = 0; const M = (b, t) => `<h3>Madde ${++m} — ${b}</h3><p>${t}</p>`; const e = H.esc;
    return `${H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet'))}<div class="belge" style="margin-top:12px"><h2>HİZMET SÖZLEŞMESİ</h2><p class="ceza">Taslaktır. İmzalamadan önce hukukçunuza inceletin.</p>
${M('Taraflar', `Bir tarafta <b>${e(v.hizmetveren)}</b> (${e(v.hvadres) || 'adres'}; bundan sonra “Hizmet Veren”), diğer tarafta <b>${e(v.hizmetalan)}</b> (${e(v.hadres) || 'adres'}; bundan sonra “Hizmet Alan”) arasında aşağıdaki şartlarla bu sözleşme yapılmıştır.`)}
${M('Sözleşmenin konusu', `Hizmet Veren aşağıda tanımlanan işi yapmayı, Hizmet Alan da karşılığında bedeli ödemeyi kabul eder.</p><p style="white-space:pre-line">${e(v.konu)}`)}
${M('Süre', `Sözleşme ${H.tarihTR(v.bas) || '...'} tarihinde başlar${v.bit ? `, ${H.tarihTR(v.bit)} tarihinde sona erer` : ' ve taraflardan biri feshedene kadar devam eder'}.`)}
${M('Bedel ve ödeme', `Hizmet bedeli ${v.bedel != null ? `${H.tl(v.bedel)} (${H.esc(H.tutarYazi(v.bedel))})` : '...'}, ${v.kdvli === 'dahil' ? 'KDV dahil' : 'KDV hariç'} olarak belirlenmiştir. Ödeme düzeni: ${e(v.odeme)}. Süresinde ödenmeyen tutarlar için kanuni haklar saklıdır.`)}
${M('Tarafların yükümlülükleri', 'Hizmet Veren işi özenle ve kararlaştırılan kapsamda yerine getirir. Hizmet Alan, işin yapılması için gereken bilgi, erişim ve onayları zamanında sağlar. Kapsam dışı talepler yazılı olarak ayrıca kararlaştırılır.')}
${M('Gizlilik ve kişisel veriler', 'Taraflar birbirlerinin ticari bilgilerini üçüncü kişilere açıklamaz. Kişisel verilerin işlenmesi gerekiyorsa taraflar 6698 sayılı Kişisel Verilerin Korunması Kanununa uygun davranır.')}
${M('Fesih', `Taraflardan her biri ${v.fesih != null ? H.sayi(v.fesih, 0) : '...'} gün önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir. Fesih tarihine kadar yapılan işlerin bedeli ödenir. Haklı nedenle fesih hakkı saklıdır.`)}
${v.ek ? M('Ek hüküm', `<span style="white-space:pre-line">${e(v.ek)}</span>`) : ''}
${M('Uyuşmazlık', `Bu sözleşmeden doğan uyuşmazlıklarda ${e(v.sehir)} mahkemeleri ve icra daireleri yetkilidir.`)}
<p>${m} maddeden oluşan bu sözleşme ...../...../......... tarihinde iki nüsha olarak imzalanmıştır.</p><div class="imza"><div>Hizmet Veren<br>${e(v.hizmetveren)}</div><div>Hizmet Alan<br>${e(v.hizmetalan)}</div></div></div>`;
  },
  aciklama: [
    'Küçük işlerin çoğu sözlü anlaşmayla başlar, sorun ise iş bittiğinde çıkar: kapsam neydi, ödeme ne zamandı, kim ne zaman vazgeçebilir? Bu iskelet, hizmet ilişkisindeki temel başlıkları eksiksiz önünüze koyar ki taraflar bunları başta konuşsun. Bilgileri girdikçe maddeler dolar, sonucu yazdırıp imzaya hazır hale getirirsiniz.',
    'Metin bilerek genel tutulmuştur. Yazılım geliştirme, inşaat, sağlık veya tüketiciye yönelik işlerde özel kurallar ve zorunlu hükümler olabilir; iskelet bunların yerini tutmaz. Tüketici sözleşmesi yapıyorsanız yetkili mahkeme gibi maddeler ayrıca değerlendirilmelidir. Bu yüzden belgenin başında taslak uyarısı yer alır ve baskıda da görünür.',
    'İşin tanımını mümkün olduğunca ölçülebilir yazın: “aylık bakım” yerine yapılacak iş sayısı, yanıt süresi ve teslim biçimi belirtilirse kapsam tartışması azalır. Bir defalık işlerde bitiş tarihi yazın, süresiz hizmetlerde bu alanı boş bırakın; metin fesih edilene kadar sürecek şekilde değişir.',
  ],
  ornek: { baslik: 'Kullanım örneği: aylık web bakım anlaşması', metin: [
    'Bir danışmanlık firması, bir gıda şirketinin web sitesine aylık 15.000 ₺ karşılığında bakım verecektir. İşin tanımına güncelleme sıklığını, ödeme alanına “her ayın ilk beş günü fatura karşılığı” bilgisini yazar. Bitiş tarihini boş bırakır, fesih süresini 30 gün olarak girer.',
    'Metne bedel hem rakamla hem yazıyla işlenir, süre maddesi kendiliğinden “taraflardan biri feshedene kadar” biçimini alır. Firma taslağı avukatına gösterir, ek hüküm alanına yedekleme sorumluluğunu ekletir ve iki nüsha olarak imzalar.',
  ] },
  sss: [
    ['Bu metin hukuken geçerli mi?', 'Geçerlilik, tarafların ehliyeti, işin niteliği ve özel kurallara bağlıdır. Metin genel iskelettir; imzadan önce avukata göstermeniz gerekir.'],
    ['Sözleşmede damga vergisi çıkar mı?', 'Bu araç vergi hesabı yapmaz. Belgenizin vergisel sonucunu mali müşavirinize sorun.'],
    ['Tüketiciyle yaptığım işlerde kullanabilir miyim?', 'Dikkatli olun. Tüketici işlemlerinde zorunlu kurallar ve farklı yetki düzenlemeleri bulunur. Bu iskelet işletmeler arası işler düşünülerek hazırlanmıştır.'],
    ['Madde ekleyip çıkarabilir miyim?', 'Ek hüküm alanına kendi maddenizi yazabilirsiniz. Daha fazla düzenleme için çıktıyı metin belgesine kopyalayıp orada değiştirin.'],
  ],
};
