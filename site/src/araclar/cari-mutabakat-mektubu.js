const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'cari-mutabakat-mektubu', kategori: 'belge', sira: 5, renk: '#7c3aed', guncelleme: GUNCELLEME,
  ad: 'Cari Mutabakat Mektubu', kisa: 'Dönem sonu bakiye teyidi için imzalı mutabakat formu hazırlayın',
  baslik: 'Cari Mutabakat Mektubu Örneği — Ücretsiz Form Oluşturucu | NEBSOFT',
  ozet: 'Dönem sonu bakiye teyidi için cari mutabakat mektubu hazırlayın: borç ya da alacak, tarih ve yanıt süresi metne işlenir, imzaya hazır çıktı alın.',
  sonucBaslik: 'Mektup önizlemesi',
  program: { slug: 'onmuhasebeprogrami', metin: 'Ön Muhasebe programındaki cari portalında müşteriniz ekstreyi görür, mutabakatı onaylar veya itiraz eder; kâğıt dolaşmaz.' },
  alanlar: [
    { ad: 'firma', etiket: 'Gönderen firma', deger: 'Örnek Ticaret Ltd. Şti.', gerekli: true }, { ad: 'iletisim', etiket: 'Yanıt adresi (e-posta / faks)', deger: 'muhasebe@ornek.com' },
    { ad: 'karsi', etiket: 'Karşı firma', deger: 'Deneme Sanayi A.Ş.', gerekli: true }, { ad: 'hesap', etiket: 'Cari hesap kodu' },
    { ad: 'tarih', etiket: 'Mutabakat tarihi', tip: 'tarih', deger: '2026-12-31' }, { ad: 'bakiye', etiket: 'Bakiye (₺)', tip: 'para', deger: '184250,75', gerekli: true },
    { ad: 'yon', etiket: 'Bakiye kimin lehine', tip: 'secim', deger: 'borc', secenekler: [['borc', 'Karşı firma bize borçlu'], ['alacak', 'Karşı firma bizden alacaklı']] },
    { ad: 'sure', etiket: 'Yanıt süresi (gün)', tip: 'sayi', deger: '15' },
  ],
  hesap: function (v, H) {
    return `${H.eylemler(H.btn('yazdir', 'Yazdır / PDF kaydet'))}<div class="belge" style="margin-top:12px"><h2>CARİ HESAP MUTABAKAT MEKTUBU</h2><div class="ust"><div><b>Sayın ${H.esc(v.karsi)}</b>${v.hesap ? `<br>Hesap kodu: ${H.esc(v.hesap)}` : ''}</div><div>${H.esc(v.firma)}</div></div><p>Kayıtlarımıza göre ${H.tarihTR(v.tarih)} tarihi itibarıyla cari hesabınız <b>${H.tl(v.bakiye)}</b> (${H.esc(H.tutarYazi(v.bakiye))}) <b>${v.yon === 'borc' ? 'borç' : 'alacak'}</b> bakiyesi vermektedir.</p><p>Kayıtlarınızla uyumlu ise aşağıdaki bölümü imzalayarak${v.sure ? ` ${H.sayi(v.sure, 0)} gün içinde` : ''} ${H.esc(v.iletisim)} adresine iletmenizi rica ederiz. Mutabık değilseniz farkın dökümünü ekstrenizle birlikte göndermenizi bekleriz.</p><div class="imza"><div>${H.esc(v.firma)}<br>Kaşe / imza</div></div><h3>Yanıt bölümü</h3><p>☐ Bakiyede mutabıkız. &nbsp;&nbsp; ☐ Mutabık değiliz, kayıtlarımıza göre bakiye: ............................ ₺</p><div class="imza"><div>${H.esc(v.karsi)}<br>Kaşe / imza / tarih</div></div></div>`;
  },
  aciklama: [
    'Cari mutabakat, iki işletmenin karşılıklı kayıtlarındaki bakiyenin aynı olduğunu yazılı teyit etmesidir. Yıl sonlarında ve dönem kapanışlarında, özellikle müşteri ya da tedarikçi sayısı arttıkça bu mektup, küçük farkların büyüyüp anlaşmazlığa dönüşmesini engeller.',
    'Araç, gönderen ve karşı firma bilgisini, tarihi, bakiyeyi ve bakiyenin yönünü metne işler; bakiye rakam ve yazıyla yazılır. Sayfanın altında karşı firmanın işaretleyeceği iki seçenek bulunur: mutabıkız ya da mutabık değiliz. Fark varsa kendi bakiyelerini yazmaları için boşluk bırakılmıştır, böylece yanıt tek sayfada geri döner.',
    'Mektubu göndermeden önce kendi ekstrenizi hazır tutun. Yoldaki ödeme, henüz işlenmemiş fatura, kur farkı ve iade en sık görülen fark nedenleridir. Yanıt süresi yazmak takip için önemlidir; süre dolduğunda hatırlatma yapılacak kişiler bellidir. Bu mektup tek başına borcu ortaya çıkarmaz, mevcut kayıtların karşılıklı teyidini sağlar.',
  ],
  ornek: { baslik: 'Kullanım örneği: yıl sonu kapanışı', metin: [
    'Bir toptancı 31 Aralık itibarıyla bir sanayi müşterisinin 184.250,75 ₺ borç bakiyesi taşıdığını görür. Bakiye yönünde “Karşı firma bize borçlu” seçer, yanıt süresine 15 gün yazar ve mektubu PDF olarak e-postayla gönderir.',
    'Müşteri kendi kayıtlarında 180.000 ₺ görür ve “Mutabık değiliz” kutusunu işaretler. İki muhasebe ekstreleri karşılaştırır, aradaki farkın yolda olan bir havaleden kaynaklandığını bulur. Kayıt düzeltilir, yeni mektup imzalanır ve dosyaya konur.',
  ] },
  sss: [
    ['Mutabakat mektubu ne zaman gönderilir?', 'Genellikle yıl sonu veya dönem sonu bakiyeleri için gönderilir. İşletmeniz gerektiğinde herhangi bir tarih için de düzenleyebilir.'],
    ['Karşı firma yanıt vermezse ne olur?', 'Yanıt vermemek bakiyeyi kendiliğinden kesinleştirmez. Hatırlatma yapın, gerekirse mali müşavirinizle sonraki adımı konuşun.'],
    ['Dövizli cariler için kullanılır mı?', 'Araç Türk lirası gösterir. Döviz bakiyesi için tutarı ayrı mektupla, para birimini açıklayarak bildirmeniz daha doğrudur.'],
    ['BA ve BS mutabakatı ile aynı mı?', 'Hayır. Bu mektup bakiye teyididir. Form BA ve BS mutabakatı, bildirilen belge sayısı ve tutarlarının karşılaştırılmasıdır.'],
  ],
};
