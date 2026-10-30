const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resim-arka-plan-silme', kategori: 'gorsel', sira: 8, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, ilgili: ['resime-filigran-ekleme', 'resim-format-donusturme', 'pdf-imza-ekleme'],
  ad: 'Resim Arka Plan Silme', kisa: 'Düz renkli fonu kaldırın: logo, imza, ürün görseli saydam olsun',
  baslik: 'Resim Arka Plan Silme — Logo ve İmza Fonunu Saydam Yapma | NEBSOFT',
  ozet: 'Beyaz veya düz renkli arka planı silin; logoyu, taranmış imzayı ve ürün görselini saydam PNG yapın ya da fonu beyaz boyayın. Dosya bilgisayarınızdan çıkmaz.',
  sonucBaslik: 'Sonuç', aciklamaBaslik: 'Bu araç hangi arka planları siler, hangilerini silemez?',
  program: { slug: 'eticaretpaketi', metin: 'Temizlediğiniz ürün görsellerini satışa dönüştürmek için E-ticaret paketi hazır mağaza vitrini, kupon, kargo takibi ve sipariş yönetimi sunar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Görsel seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp', ipucu: 'veya sürükleyin. Düz zeminli görsel en iyi sonucu verir' },
    { ad: 'fon', etiket: 'Silinecek renk', tip: 'secim', deger: 'oto', secenekler: [['oto', 'Kenarlardan otomatik bul'], ['elle', 'Rengi kendim seçeyim']] },
    { ad: 'renk', etiket: 'Fon rengi', tip: 'renk', deger: '#ffffff', goster: 'fon=elle' },
    { ad: 'tol', etiket: 'Hassasiyet', tip: 'kaydirici', min: 5, max: 100, deger: '30', ipucu: 'Fon kalıyorsa artırın, ürün yeniyorsa azaltın' },
    { ad: 'kip', etiket: 'Silinecek alan', tip: 'secim', deger: 'kenar', secenekler: [['kenar', 'Yalnız dış zemin (ürün)'], ['heryer', 'Her yerde aynı renk (imza, logo)']] },
    { ad: 'cikti', etiket: 'Yeni zemin', tip: 'secim', deger: 'seffaf', genis: true, secenekler: [['seffaf', 'Saydam (PNG)'], ['beyaz', 'Beyaz (JPG)'], ['renk', 'Başka renk (JPG)']] },
    { ad: 'yeni', etiket: 'Zemin rengi', tip: 'renk', deger: '#f3f4f6', goster: 'cikti=renk' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Arka plan aranıyor.</p>' : H.not('Görsel seçtiğinizde sonuç burada görünür.'); },
  hazirla: async function (v, H, c) { const b = await H.gorselAc(v.dosyalar[0]); const o = Math.min(1, Math.sqrt(16e6 / (b.width * b.height))); const t = H.tuval(Math.round(b.width * o), Math.round(b.height * o)); t.getContext('2d', { willReadFrequently: true }).drawImage(b, 0, 0, t.width, t.height); b.close(); c.durum.t = t; c.durum.kucuk = o < 1; },
  isle: async function (v, H, c) {
    const t = c.durum.t; if (!t) return ''; const w = t.width, h = t.height; const g = t.getContext('2d').getImageData(0, 0, w, h); const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const renk = v.fon === 'oto' ? H.kenarRengi(g.data, w, h) : hex(v.renk); const tol = Number(v.tol);
    const m = H.arkaPlanMaske(g.data, w, h, { renk, tol, heryer: v.kip === 'heryer' }); let silinen = 0; for (let i = 0; i < m.length; i++) silinen += m[i]; H.arkaPlanUygula(g.data, m, w, h, { renk, tol }); const o = H.tuval(w, h); o.getContext('2d').putImageData(g, 0, 0); let son = o;
    if (v.cikti !== 'seffaf') { son = H.dolu(w, h, v.cikti === 'beyaz' ? '#ffffff' : v.yeni); son.getContext('2d').drawImage(o, 0, 0); }
    const tur = v.cikti === 'seffaf' ? 'image/png' : 'image/jpeg'; const blob = await H.kaydet(son, tur, 0.92); if (c.iptal()) return ''; H.cikti(H.dosyaAdi(v.dosyalar[0].name, 'arka-plansiz', tur === 'image/png' ? 'png' : 'jpg'), blob); const y = Math.round(silinen / m.length * 100);
    return `<img class="ar-onizle" src="${H.adres(blob)}" alt="Arka planı silinmiş görsel" width="${w}" height="${h}">${H.tablo([['Silinen alan', `%${y}`, 1], ['Bulunan fon', `rgb(${renk.join(', ')})`]])}${H.ciktiListe()}${y < 3 ? H.not('Çok az alan silindi. Fon düz renkli değilse bu araç doğru sonuç vermez; hassasiyeti artırmayı veya rengi elle seçmeyi deneyin.', 'uyari') : ''}${c.durum.kucuk ? H.not('Çok büyük görsel bu cihazda işlenebilsin diye küçültüldü.') : ''}`;
  },
  aciklama: [
    'Bu araç yapay zekâ kullanmaz ve bunu söylemek önemlidir. Kenar piksellerden zemin rengini bulur, ona benzeyen ve kenardan kesintisiz ulaşılabilen alanı siler. Bu yöntem beyaz fon üzerine çekilmiş ürün, beyaz kâğıda atılmış imza, düz zeminli logo ve kaşe taramalarında çok temiz çalışır. Görüntünün tamamı cihazınızda işlendiği için hiçbir fotoğraf yapay zekâ servisine gönderilmez.',
    'Karışık sahneler içinse uygun değildir. Parkta çekilmiş bir portrede ya da desenli halı üzerindeki üründe arka plan tek renk olmadığı için doğru sonuç alamazsınız. Araç böyle bir durumu çok az alan silerek belli eder ve sizi uyarır. Sonuç iyi değilse önce ürünü düz bir kâğıdın önünde yeniden çekmek, herhangi bir ayardan daha çok fayda sağlar.',
    'İki ayar sonucu belirler. Hassasiyet, zemine ne kadar benzeyen rengin silineceğini söyler: gölge kalıyorsa artırın, üründen parça gidiyorsa azaltın. Silinecek alan seçeneği ise iç boşlukları yönetir. Yalnız dış zemin modunda beyaz bir fincanın içi korunur. Her yerde modu ise imzadaki halkaların içini ve logodaki harf boşluklarını da temizler; bu yüzden imza ve logo için bu mod seçilmelidir.',
  ],
  ornek: { baslik: 'Kullanım örneği: taranmış imza ve ürün fotoğrafı', metin: [
    'Bir yönetici imzasını beyaz kâğıda atıp telefonla çekiyor. Her yerde modunu ve saydam çıktıyı seçer. Kâğıt zemini silinir, harf içleri de temizlenir. Elde kalan PNG dosyası hem belge şablonlarına hem PDF İmza Ekleme aracına konabilir.',
    'Bir satıcı beyaz masada kupa fotoğrafladı, ama masanın üzerinde hafif gölge var. Hassasiyeti 30 değerinden 45 değerine çıkarınca gölge gider. Yalnız dış zemin modunda kaldığı için kupanın içindeki beyaz alan silinmez. Yeni zemin olarak beyazı seçip JPG alır.',
  ] },
  sss: [
    ['Fotoğraftaki kişinin arka planını silebilir miyim?', 'Yalnız arka plan düz ve tek renkliyse. Karışık sahneler için bu araç uygun değildir, araç bunu sonuçta söyler.'],
    ['Beyaz ürünü beyaz fondan ayırır mı?', 'Zor. Renkler çok yakınsa kenarda parça kaybı olur. Ürünü zıt renkli zeminde çekip rengi elle seçin.'],
    ['Neden JPG saydam olmuyor?', 'JPG biçimi saydamlık taşımaz. Saydam çıktı seçtiğinizde dosya PNG olur.'],
    ['Görselim bir yapay zekâ servisine gidiyor mu?', 'Hayır. İşlem tamamen tarayıcınızda, renk karşılaştırmasıyla yapılır.'],
  ],
};
