const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'exif-konum-bilgisi-silme', kategori: 'gorsel', sira: 7, renk: '#0f766e', guncelleme: GUNCELLEME, canli: true, ilgili: ['fotograf-bulaniklastirma', 'resim-sikistirma'],
  ad: 'EXIF ve Konum Bilgisi Silme', kisa: 'Fotoğrafın içindeki GPS, cihaz ve tarih bilgisini görün, silin',
  baslik: 'EXIF ve Konum Bilgisi Silme — Fotoğraftan GPS Kaldırma | NEBSOFT',
  ozet: 'Fotoğrafın içindeki GPS konumunu, telefon modelini ve çekim tarihini görün, tek tıkla silin. Görüntü yeniden sıkıştırılmaz, dosya sunucuya gönderilmez.',
  sonucBaslik: 'Fotoğrafın içindeki bilgiler', aciklamaBaslik: 'Fotoğrafın içinde hangi bilgiler saklanır?',
  program: { slug: 'emlakprogrami', metin: 'Müşteriyle sürekli fotoğraf paylaşan bir emlak ofisiyseniz Emlak Ofisi programı portföyü, yer göstermeleri ve kira takibini tek panelde toplar.' },
  alanlar: [{ ad: 'dosyalar', etiket: 'Fotoğraf seçin', tip: 'dosya', kabul: 'image/jpeg,image/png,image/webp', coklu: true, ipucu: 'veya sürükleyin. JPG, PNG, WebP' }],
  hesap: function (v, H) { return v.dosyalar.length ? '<p class="ar-bos">Dosya okunuyor.</p>' : H.not('Fotoğraf seçtiğinizde içinde saklanan bilgiler burada listelenir.'); },
  isle: async function (v, H, c) {
    const n = v.dosyalar.length; let gov = '', gpsVar = 0, hata = '';
    for (let i = 0; i < n; i++) {
      const f = v.dosyalar[i]; if (c.iptal()) return ''; try {
        const b = await H.bayt(f); const m = H.metaOku(b); if (!m.tur) throw new Error('Desteklenmeyen dosya'); const e = m.exif; const y = H.temizle(b); const blob = new Blob([y], { type: f.type }); H.cikti(H.dosyaAdi(f.name, 'temiz', ({ jpeg: 'jpg', png: 'png', webp: 'webp' })[m.tur]), blob);
        const sat = [e.gps && ['Konum (GPS)', `${H.sayi(e.gps.lat, 6)}, ${H.sayi(e.gps.lon, 6)}`, 1], (e.marka || e.model) && ['Cihaz', H.esc([e.marka, e.model].filter(Boolean).join(' '))], (e.cekim || e.tarih) && ['Çekim tarihi', H.esc(e.cekim || e.tarih)], e.seri && ['Cihaz seri no', H.esc(e.seri)], e.yazilim && ['Yazılım', H.esc(e.yazilim)], e.yazar && ['Yazar', H.esc(e.yazar)], e.sahip && ['Sahip', H.esc(e.sahip)], m.bloklar.length ? ['Bilgi blokları', H.esc(m.bloklar.join(', '))] : null, ['Önce → sonra', `${H.boyutYaz(f.size)} → ${H.boyutYaz(y.length)}`]];
        if (e.gps) gpsVar++; gov += `${n > 1 ? `<p><b>${H.esc(f.name)}</b></p>` : ''}${sat.filter(Boolean).length > 1 ? H.tablo(sat) : H.not('Bu dosyada bilgi bloğu bulunamadı, dosya zaten temiz.')}`;
      } catch (e) { hata += H.not(`${H.esc(f.name)}: ${H.esc(e.message)}`, 'uyari'); }
    }
    return `${gpsVar ? H.not(`${gpsVar} dosyada konum kaydı var. Temizlenmiş kopyalarda bu kayıt yoktur.`, 'uyari') : ''}${gov}${hata}${H.ciktiListe()}${H.ciktilar.length ? H.not('Görüntü verisine dokunulmadı. Dik çekilmiş fotoğrafın yan çıkmaması için yalnız yön etiketi korunur.') : ''}`;
  },
  aciklama: [
    'Telefonla çekilen her fotoğrafın içinde, görüntüden ayrı bir bilgi bölümü bulunur. Buna EXIF denir. Konum servisi açıksa burada çekimin yapıldığı noktanın enlem ve boylamı yazabilir. Ayrıca telefon markası ve modeli, çekim tarihi ve saati, bazı cihazlarda seri numarası ile kullanılan yazılım da saklanır. Fotoğrafa bakan kişi bunları görmez, ama basit bir programla okuyabilir.',
    'Bu bilgi sıradan görünür ama sonuç doğurabilir. Evinizde çekip ilana koyduğunuz bir ürün fotoğrafı ev adresinizi, dükkânda çekilen bir fotoğraf çalışma saatinizi ele verebilir. Birçok sosyal ağ yüklenen görseldeki bilgiyi kendi kaldırır, fakat e-postayla gönderilen, dosya olarak paylaşılan veya kendi sitenize yüklediğiniz fotoğraf için bu geçerli olmayabilir. Araç önce dosyada ne bulunduğunu gösterir, sonra temiz kopya üretir.',
    'Buradaki işlem sıkıştırma değildir. Araç dosyanın baytları içinde bilgi bölümlerini bulup çıkarır, görüntü verisine hiç dokunmaz, bu yüzden tek bir piksel bile değişmez ve kalite düşmez. JPG için EXIF, XMP, IPTC ve yorum blokları, PNG için metin ve tarih parçaları, WebP için EXIF ve XMP kaldırılır. Renk profili korunur. Yön etiketi ise bilinçli olarak bırakılır, yoksa dikey fotoğraf yan görünürdü.',
  ],
  ornek: { baslik: 'Kullanım örneği: ikinci el ürün ilanı', metin: [
    'Bir kişi evdeki koltuğu satmak için fotoğrafını çekti ve bir alıcıya dosya olarak gönderecek. Fotoğrafı araca attığında listede Konum (GPS) satırını, telefon modelini ve çekim saatini görüyor. Temiz kopyayı indirip onu gönderiyor.',
    'Bir fotoğrafçı ise müşteriye teslimden önce kendi cihaz seri numarasını ve yazılım bilgisini çıkarmak istiyor. Aynı anda elli dosyayı seçer, hepsi yeniden sıkıştırılmadan temizlenir, ZIP olarak iner. Baskı kalitesi etkilenmez, çünkü görüntü verisi hiç değişmemiştir.',
  ] },
  sss: [
    ['Fotoğrafımda konum olup olmadığını nasıl anlarım?', 'Dosyayı seçmeniz yeterli. Kayıt varsa tabloda Konum (GPS) satırı çıkar ve uyarı gösterilir.'],
    ['Silme işlemi kaliteyi düşürür mü?', 'Hayır. Görüntü verisi yeniden kodlanmaz, yalnız bilgi blokları çıkarılır.'],
    ['Silinen bilgi geri gelir mi?', 'Temizlenmiş kopyada gelmez. Özgün dosyanız cihazınızda aynen durur, onu ayrıca silmeniz gerekir.'],
    ['Çekim sırasında konum kaydı nasıl kapatılır?', 'Telefonun kamera ayarlarında konum etiketi seçeneğini kapatabilirsiniz. Menü adı cihaza göre değişir.'],
  ],
};
