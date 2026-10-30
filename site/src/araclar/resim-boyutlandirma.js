const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'resim-boyutlandirma', kategori: 'gorsel', sira: 2, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, ilgili: ['resim-sikistirma', 'resim-kirpma', 'favicon-olusturucu'],
  ad: 'Resim Boyutlandırma', kisa: 'Fotoğrafın piksel ölçüsünü değiştirin, kare yapın, kenar ekleyin',
  baslik: 'Resim Boyutlandırma — Piksel Ölçüsü Değiştirme ve Kare Yapma | NEBSOFT',
  ozet: 'Fotoğrafın en ve boyunu piksel veya yüzde olarak değiştirin. Oranı koruyun, taşanı kırpın ya da beyaz kenar ekleyerek kare yapın. Toplu çalışır, dosya gönderilmez.',
  sonucBaslik: 'Yeni ölçü', aciklamaBaslik: 'Resmin piksel ölçüsü nasıl değiştirilir?',
  program: { slug: 'pazaryeriprogrami', metin: 'Trendyol ve n11 satışlarını yürütüyorsanız Pazaryeri Satıcı Paneli siparişleri, paketlemeyi ve sipariş başına gerçek kârı tek ekranda toplar.' },
  alanlar: [
    { ad: 'dosyalar', etiket: 'Görsel seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp,.heic', coklu: true, ipucu: 'veya sürükleyin. Aynı ölçü tüm dosyalara uygulanır' },
    { ad: 'olcu', etiket: 'Ölçü türü', tip: 'secim', deger: 'piksel', genis: true, secenekler: [['piksel', 'Piksel olarak'], ['yuzde', 'Yüzde olarak']] },
    { ad: 'gen', etiket: 'Genişlik (px)', tip: 'sayi', deger: '1000', goster: 'olcu=piksel', ipucu: 'Boş bırakırsanız orandan bulunur' },
    { ad: 'yuk', etiket: 'Yükseklik (px)', tip: 'sayi', deger: '1000', goster: 'olcu=piksel' },
    { ad: 'yuzde', etiket: 'Yüzde', tip: 'sayi', deger: '50', goster: 'olcu=yuzde' },
    { ad: 'kip', etiket: 'Oran uymazsa', tip: 'secim', deger: 'kenar', goster: 'olcu=piksel', genis: true, secenekler: [['kenar', 'Kenar ekleyip tam ölçü yap'], ['kapla', 'Taşan kısmı kırp'], ['sigdir', 'Oranı koru, ölçüye sığdır'], ['esnet', 'Esnet (görüntü bozulur)']] },
    { ad: 'renk', etiket: 'Kenar rengi', tip: 'renk', deger: '#ffffff', goster: 'kip=kenar' },
    { ad: 'bicim', etiket: 'Çıktı', tip: 'secim', deger: 'image/jpeg', secenekler: [['image/jpeg', 'JPG'], ['image/png', 'PNG'], ['image/webp', 'WebP']] },
  ],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Yeni ölçü hazırlanıyor.</p>' : H.not('Görsel seçtiğinizde yeni ölçü burada görünür.'); },
  isle: async function (v, H, c) {
    let onizle = '', bilgi = ''; const n = v.dosyalar.length;
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; if (n > 1) c.ilerle(i / n, `${f.name} hazırlanıyor`); if (c.iptal()) return ''; const b = await H.gorselAc(f);
      const r = v.olcu === 'yuzde' ? H.olcek(b.width, b.height, { gen: b.width * Math.max(1, v.yuzde || 0) / 100, kip: 'sigdir' }) : H.olcek(b.width, b.height, { gen: v.gen, yuk: v.yuk, kip: v.kip });
      if (r.w > 12000 || r.h > 12000) throw new Error('En çok 12.000 piksel yazabilirsiniz.');
      const t = H.dolu(r.w, r.h, v.bicim === 'image/jpeg' || v.kip === 'kenar' ? v.renk : ''); const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(b, r.kaynak.x, r.kaynak.y, r.kaynak.w, r.kaynak.h, r.hedef.x, r.hedef.y, r.hedef.w, r.hedef.h);
      const blob = await H.kaydet(t, v.bicim, 0.9); H.cikti(H.dosyaAdi(f.name, `${r.w}x${r.h}`, H.turUzanti(blob.type)), blob);
      if (!i) { onizle = `<img class="ar-onizle" src="${H.adres(blob)}" alt="Yeni ölçüdeki görsel" width="${r.w}" height="${r.h}">`; bilgi = H.tablo([['Eski ölçü', `${b.width} × ${b.height} px`], ['Yeni ölçü', `${r.w} × ${r.h} px`, 1]]); if (r.w > b.width * 1.2) bilgi += H.not('Görsel özgün ölçüsünden büyütülüyor. Yeni ayrıntı oluşmaz, görüntü yumuşak görünebilir.'); } b.close();
    }
    return `${onizle}${bilgi}${H.ciktiListe()}`;
  },
  aciklama: [
    'Resim boyutlandırma, görselin eni ve boyunun kaç piksel olduğunu değiştirir. Bir pazaryeri 1000 × 1000 piksel kare görsel istiyorsa, kapak fotoğrafı belli bir ölçüde olmalıysa ya da fotoğrafı yarıya indirmek gerekiyorsa aradığınız işlem budur. Dosyanın kaç KB tuttuğu ise ayrı bir konudur; belirli bir KB sınırı için Resim Sıkıştırma aracını kullanın.',
    'En zor durum oranı tutmayan görseldir. Dikey çekilmiş bir ürünü kareye çevirmek için dört yol vardır ve hangisinin doğru olduğu işe bağlıdır. Kenar ekleme görüntünün tamamını korur, boşlukları seçtiğiniz renkle doldurur; ürün fotoğrafında en güvenli yol budur. Taşanı kırpma alanı doldurur ama ürünün ucu kesilebilir. Sığdırma tam ölçü vermez, oranı korur. Esnetme ise görüntüyü bozduğu için yalnız bilerek seçilmelidir.',
    'Küçültme neredeyse her zaman temiz sonuç verir, büyütme vermez: küçük fotoğrafı büyütmek ayrıntı eklemez, var olan pikselleri yayar. Araç özgün ölçünün belirgin üstüne çıktığınızda bunu söyler. Kurallar platforma göre değiştiği ve zamanla güncellendiği için sayfada hazır pazaryeri ölçüsü vermedik; satıcı panelinizde yazan güncel değeri girin.',
  ],
  ornek: { baslik: 'Kullanım örneği: dikey ürün fotoğraflarını kareye çevirme', metin: [
    'Bir satıcının telefonla çektiği fotoğraflar 3000 × 4000 piksel, satış kanalı ise kare görsel istiyor. Genişliğe ve yüksekliğe 1000 yazar, "Kenar ekleyip tam ölçü yap" seçeneğini ve beyaz rengi seçer. Görüntü 750 × 1000 piksele iner, iki yanına eşit beyaz kenar eklenir, ürünün hiçbir yeri kesilmez.',
    'Aynı satıcı kategori sayfası için fotoğrafları doldurmak isterse "Taşan kısmı kırp" seçeneğine geçer. Bu kez görüntü kareyi tamamen kaplar, ama üst ve alttan eşit pay kesilir. Birinci dosyanın önizlemesine bakıp karar verir, ayar diğer dosyalara da uygulanır ve hepsi ZIP olarak iner.',
  ] },
  sss: [
    ['Oran bozulmadan resim nasıl boyutlandırılır?', 'Yalnız genişliği yazıp yüksekliği boş bırakın, yükseklik orandan hesaplanır. Yüzde seçeneği de oranı korur.'],
    ['Fotoğraf nasıl kare yapılır?', 'Genişlik ve yüksekliğe aynı değeri yazın, sonra kenar ekleme veya taşanı kırpma seçeneğini seçin.'],
    ['Boyutlandırma dosya boyutunu da düşürür mü?', 'Küçültmek genellikle dosyayı da küçültür. Belirli bir KB değerine inmek için sonucu Resim Sıkıştırma aracından geçirin.'],
    ['Birden çok görsel aynı anda değişir mi?', 'Evet. Yazdığınız ölçü tüm dosyalara uygulanır, ilk dosyanın önizlemesi gösterilir, sonuçlar ZIP olarak inebilir.'],
  ],
};
