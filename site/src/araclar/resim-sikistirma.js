const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resim-sikistirma', kategori: 'gorsel', sira: 1, renk: '#0f766e', guncelleme: GUNCELLEME, ilgili: ['resim-boyutlandirma', 'resim-format-donusturme', 'pdf-sikistirma'],
  ad: 'Resim Sıkıştırma', kisa: 'Fotoğrafın KB değerini düşürün, hedef boyuta indirin',
  baslik: 'Resim Sıkıştırma — Fotoğraf Boyutunu KB Olarak Küçültme | NEBSOFT',
  ozet: 'JPG, PNG ve WebP fotoğrafların dosya boyutunu tarayıcıda küçültün: kaliteyi seçin veya 200 KB gibi bir hedef yazın. Toplu çalışır, dosya sunucuya gitmez.',
  sonucBaslik: 'Sıkıştırma sonucu', aciklamaBaslik: 'Fotoğraf boyutu KB olarak nasıl küçültülür?',
  program: { slug: 'eticaretpaketi', metin: 'Sıkıştırdığınız ürün fotoğraflarını kendi mağazanızda kullanacaksanız E-ticaret paketi hazır vitrin, varyantlı ürün ve sipariş yönetimini tek panelde sunar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', coklu: true, ipucu: 'veya sürükleyin. JPG, PNG, WebP; birden çok dosya olabilir' },
    { ad: 'kip', etiket: 'Yöntem', tip: 'secim', deger: 'hedef', genis: true, secenekler: [['hedef', 'Hedef boyuta indir (KB)'], ['kalite', 'Kalite yüzdesini kendim seçeyim']] },
    { ad: 'hedefKb', etiket: 'Hedef boyut (KB)', tip: 'sayi', deger: '200', goster: 'kip=hedef' },
    { ad: 'kalite', etiket: 'Kalite', tip: 'kaydirici', min: 30, max: 95, deger: '80', goster: 'kip=kalite' },
    { ad: 'bicim', etiket: 'Çıktı biçimi', tip: 'secim', deger: 'image/jpeg', secenekler: [['image/jpeg', 'JPG'], ['image/webp', 'WebP']] },
  ],
  hesap: function (v, H) { if (!v.dosyalar.length) return H.not('Fotoğraf seçtiğinizde sıkıştırma ayarları uygulanacak.'); if (v.kip === 'hedef' && !(v.hedefKb >= 5)) return H.not('Hedef boyut en az 5 KB olmalı.', 'uyari'); return H.eylemler(H.btn('isle', v.dosyalar.length > 1 ? `${v.dosyalar.length} fotoğrafı sıkıştır` : 'Sıkıştır')); },
  isle: async function (v, H, c) {
    let once = 0, sonra = 0; const notlar = []; const n = v.dosyalar.length;
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; c.ilerle(i / n, `${f.name} sıkıştırılıyor`); if (c.iptal()) return ''; const b = await H.gorselAc(f); const t = H.dolu(b.width, b.height, '#fff'); t.getContext('2d').drawImage(b, 0, 0); b.close();
      const ara = (k) => H.kaliteAra(async (q) => { const x = await H.kaydet(k, v.bicim, q); return { boyut: x.size, blob: x }; }, v.hedefKb * 1024); let blob;
      if (v.kip === 'hedef') { let r = await ara(t); for (let o = 0.8; !r.uydu && o > 0.2; o -= 0.15) { const y = H.tuval(Math.round(t.width * o), Math.round(t.height * o)); y.getContext('2d').drawImage(t, 0, 0, y.width, y.height); r = await ara(y); if (r.uydu) notlar.push(`${f.name}: hedefe yalnız kaliteyle inilemedi, ölçüsü ${y.width} × ${y.height} piksele düşürüldü.`); } if (!r.uydu) notlar.push(`${f.name}: hedefe inilemedi, en küçük sonuç verildi.`); blob = r.blob; } else blob = await H.kaydet(t, v.bicim, Number(v.kalite) / 100);
      if (blob.type !== v.bicim) notlar.push('Bu tarayıcı WebP yazamıyor, çıktı PNG oldu. Küçük dosya için JPG seçin.');
      if (blob.size >= f.size && blob.type === f.type) { notlar.push(`${f.name}: dosya zaten daha küçüktü, özgün hâli bırakıldı.`); blob = f; }
      once += f.size; sonra += blob.size; H.cikti(H.dosyaAdi(f.name, 'kucuk', H.turUzanti(blob.type)), blob);
    }
    return `${H.karsilastir(once, sonra)}${H.ciktiListe()}${[...new Set(notlar)].map((x) => H.not(H.esc(x))).join('')}`;
  },
  aciklama: [
    'Bir fotoğrafın kaç KB tuttuğu ile ekranda kaç piksel göründüğü farklı şeylerdir. Bu araç yalnız birincisini değiştirir: fotoğrafı yeniden kodlayarak dosyayı küçültür, ölçüsüne hedefe inilemediği zorunlu durum dışında dokunmaz. Başvuru formu "en çok 200 KB" diyorsa, e-postaya sığmıyorsa veya web sitesi yavaş açılıyorsa aradığınız işlem budur. Resim küçültme, fotoğraf boyutu düşürme, JPG sıkıştırma ve KB azaltma aramalarının çoğu aynı ihtiyacı anlatır.',
    'Hedef boyut yönteminde araç, yazdığınız sınırın altında kalan en yüksek kaliteyi arar. Fotoğrafı birkaç kez yeniden kodlayıp sonucu ölçer, yani sabit bir yüzde uygulamaz. Bu yüzden düz bir duvar fotoğrafı ile ayrıntılı bir çarşı fotoğrafı aynı hedefe farklı kaliteyle iner. Kalite en alt sınıra geldiği hâlde hedef tutmuyorsa ölçüyü kademeli azaltır ve bunu sonuç ekranında söyler.',
    'Sıkıştırma kayıplıdır: atılan ayrıntı geri gelmez, bu nedenle özgün dosyanızı saklayın. Metin içeren ekran görüntülerinde çok düşük kalite harflerin çevresinde lekeler oluşturur; böyle görsellerde hedefi biraz yüksek tutun. Şeffaf PNG dosyası JPG olduğunda saydam alanlar beyaza döner. Saydamlık gerekiyorsa WebP seçin. Araç, sonucu özgün dosyadan büyük çıkan görseli büyütmez, özgün hâlini bırakır.',
  ],
  ornek: { baslik: 'Kullanım örneği: başvuru formuna fotoğraf yükleme', metin: [
    'Bir aday, telefonla çektiği 3,8 MB fotoğrafı "en çok 300 KB" kuralı olan bir forma yükleyecek. Hedef boyuta 300 yazar, çıktı olarak JPG seçer ve Sıkıştır düğmesine basar. Araç 300 KB altında kalan en yüksek kaliteyi bulur, önce ve sonra boyutunu gösterir.',
    'Aynı gün kırk ürün fotoğrafını mağazaya yükleyecek bir satıcı ise dosyaların hepsini birlikte sürükler, kaliteyi 80 yapar ve sonuçları tek ZIP olarak indirir. Dosya adları korunur, sonuna "-kucuk" eklenir; böylece özgün fotoğraflarla karışmaz.',
  ] },
  sss: [
    ['Fotoğrafım internete yükleniyor mu?', 'Hayır. Sıkıştırma tarayıcınızın içinde, bu cihazda yapılır. Sayfanın güvenlik kuralı dış adrese veri gönderilmesini de engeller.'],
    ['Fotoğrafı 100 KB altına indirebilir miyim?', 'Evet, hedef alanına 100 yazın. Çok büyük bir fotoğraf kaliteyle bu sınıra inemezse araç ölçüsünü de düşürür ve bunu size bildirir.'],
    ['Resmin ölçüsü de değişir mi?', 'Normalde hayır, yalnız dosya boyutu azalır. Belirli bir piksel ölçüsü istiyorsanız Resim Boyutlandırma aracını kullanın.'],
    ['iPhone HEIC fotoğrafı sıkıştırılır mı?', 'Yalnız HEIC açabilen tarayıcıda çalışır. Bilgisayarda açılmazsa fotoğrafı telefondan JPG olarak paylaşıp yeniden deneyin.'],
  ],
};
