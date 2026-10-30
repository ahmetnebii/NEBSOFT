const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resim-format-donusturme', kategori: 'gorsel', sira: 3, renk: '#0f766e', guncelleme: GUNCELLEME, ilgili: ['resim-sikistirma', 'resimden-pdf-olusturma', 'pdf-resme-cevirme'],
  ad: 'Resim Format Dönüştürme', kisa: 'WebP, PNG ve JPG dosyalarını birbirine çevirin',
  baslik: 'Resim Format Dönüştürme — WebP, PNG, JPG Çevirici | NEBSOFT',
  ozet: 'WebP dosyasını JPG yapın, PNG\'yi JPG\'ye veya JPG\'yi PNG\'ye çevirin. Saydam alanların rengini seçin, toplu dönüştürün. Dosyalar tarayıcınızdan çıkmaz.',
  sonucBaslik: 'Dönüştürülen dosyalar', aciklamaBaslik: 'WebP, PNG ve JPG arasında ne fark var?',
  program: { slug: 'eticaretpaketi', metin: 'Ürün görsellerini kendi satış sitenizde kullanacaksanız E-ticaret paketi vitrini, varyantları, kuponları ve siparişleri tek panelden yönetir.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Görsel seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.heic', coklu: true, ipucu: 'veya sürükleyin. JPG, PNG, WebP, GIF, BMP, AVIF' },
    { ad: 'hedef', etiket: 'Dönüştürülecek biçim', tip: 'secim', deger: 'image/jpeg', genis: true, secenekler: [['image/jpeg', 'JPG (fotoğraf, en geniş uyum)'], ['image/png', 'PNG (logo, ekran görüntüsü, saydamlık)'], ['image/webp', 'WebP (web sitesi için küçük dosya)']] },
    { ad: 'kalite', etiket: 'Kalite', tip: 'kaydirici', min: 40, max: 100, deger: '90', goster: 'hedef=image/jpeg|image/webp' },
    { ad: 'fon', etiket: 'Saydam alan rengi', tip: 'renk', deger: '#ffffff', goster: 'hedef=image/jpeg', ipucu: 'JPG saydamlık taşımaz' },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? H.eylemler(H.btn('isle', v.dosyalar.length > 1 ? `${v.dosyalar.length} dosyayı dönüştür` : 'Dönüştür')) : H.not('Görsel seçtiğinizde dönüştürme düğmesi burada görünür.'); },
  isle: async function (v, H, c) {
    const n = v.dosyalar.length; let saydam = 0, once = 0, sonra = 0, yazamadi = false;
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; c.ilerle(i / n, `${f.name} dönüştürülüyor`); if (c.iptal()) return ''; const b = await H.gorselAc(f);
      const t = H.dolu(b.width, b.height, ''); const x = t.getContext('2d'); x.drawImage(b, 0, 0); b.close();
      if (v.hedef === 'image/jpeg') { const d = x.getImageData(0, 0, t.width, t.height).data; for (let k = 3; k < d.length; k += 4) if (d[k] < 250) { saydam++; break; } x.globalCompositeOperation = 'destination-over'; x.fillStyle = v.fon; x.fillRect(0, 0, t.width, t.height); }
      const blob = await H.kaydet(t, v.hedef, Number(v.kalite) / 100); if (blob.type !== v.hedef) yazamadi = true; once += f.size; sonra += blob.size; H.cikti(H.dosyaAdi(f.name, '', H.turUzanti(blob.type)), blob);
    }
    return `${H.karsilastir(once, sonra)}${H.ciktiListe()}${saydam ? H.not(`${saydam} dosyadaki saydam alan seçtiğiniz renkle dolduruldu.`) : ''}${yazamadi ? H.not('Bu tarayıcı WebP yazamıyor, dosyalar PNG olarak üretildi.', 'uyari') : ''}`;
  },
  aciklama: [
    'Üç biçim üç ayrı iş içindir. JPG fotoğraf için tasarlanmıştır, her program ve her kurum sistemi açar, ama saydamlık taşımaz ve keskin yazılarda leke bırakır. PNG kayıpsızdır; logo, ekran görüntüsü ve saydam arka planlı görsel için uygundur, fotoğrafta ise dosya şişer. WebP web sayfaları için geliştirilmiştir, benzer görünümü çoğu zaman daha küçük dosyayla verir, fakat eski programlar ve bazı kurum formları kabul etmez.',
    'En sık karşılaşılan durum internetten indirilen görselin WebP çıkmasıdır: sürüm eski bir ofis programı dosyayı açmaz, başvuru sitesi reddeder. Burada WebP dosyasını JPG veya PNG yapmak birkaç saniye sürer. Tersi de geçerlidir: site hızı için JPG ve PNG görselleri WebP biçimine çevirebilirsiniz. GIF, BMP ve AVIF dosyaları da girdi olarak kabul edilir; hareketli GIF yalnız ilk karesiyle dönüşür, bunu baştan bilin.',
    'Saydam bir PNG dosyasını JPG yapmak saydamlığı yok eder, bu alanlar bir renkle dolmak zorundadır. Araç varsayılan olarak beyaz kullanır, koyu zeminde kullanacağınız logo için rengi değiştirebilirsiniz. Saydamlık bulunan dosya sayısı sonuç ekranında yazılır. JPG dosyasını PNG yapmak kaybolan ayrıntıyı geri getirmez, yalnız bundan sonraki kayıpları durdurur; bu yüzden dosya büyür ama kalite artmaz.',
  ],
  ornek: { baslik: 'Kullanım örneği: inmeyen WebP görselini teklife eklemek', metin: [
    'Bir tedarikçi sitesinden indirilen ürün görseli "urun.webp" adıyla gelmiş, teklif dosyasına eklenmiyor. Dosyayı buraya sürükleyip JPG seçmek yeterli: aynı adla "urun.jpg" oluşur ve ofis programı açar.',
    'Bir tasarımcı ise saydam arka planlı logoyu lacivert kartvizit şablonuna JPG olarak koymak zorunda. Saydam alan rengini lacivert seçer, böylece logonun çevresinde beyaz kutu görünmez. Aynı logonun web için olan kopyasını ise PNG olarak saklar, çünkü saydamlık orada gereklidir.',
  ] },
  sss: [
    ['WebP dosyası JPG\'ye nasıl çevrilir?', 'Dosyayı seçin, biçim olarak JPG seçili kalsın, Dönüştür düğmesine basıp sonucu indirin. Toplu dosyalar ZIP olarak inebilir.'],
    ['PNG\'den JPG\'ye çevirince kalite düşer mi?', 'JPG kayıplı olduğu için çok az ayrıntı kaybolur. Fotoğrafta fark edilmez, yazılı görsellerde kaliteyi yüksek tutun veya PNG\'de kalın.'],
    ['Hareketli GIF dönüşür mü?', 'Yalnız ilk kare dönüşür, animasyon korunmaz.'],
    ['HEIC dosyasını çevirebilir miyim?', 'Dosyayı açabilen tarayıcıda evet, genellikle Safari. Diğerlerinde araç açılamadığını söyler; fotoğrafı telefondan JPG olarak paylaşın.'],
  ],
};
