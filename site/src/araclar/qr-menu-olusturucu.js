const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'qr-menu-olusturucu', kategori: 'kod', sira: 1, qr: true, tek: true, renk: '#c2410c', guncelleme: GUNCELLEME,
  ad: 'QR Menü Oluşturucu', kisa: 'Menünüzü yazın; basılı menü, tek dosyalık web menüsü ve masa kartları alın',
  baslik: 'Ücretsiz QR Menü Oluşturucu — Masa Kartı ve Web Menüsü Hazırlama | NEBSOFT',
  ozet: 'Kafe ve restoranlar için ücretsiz QR menü: ürünleri ve fiyatları girin, yazdırılabilir menüyü, tek dosyalık web menüsünü ve masa numaralı QR kartlarını hemen alın.',
  sonucBaslik: 'Menü ve masa kartları',
  program: { slug: 'adisyonprogrami', metin: 'Fiyat her değiştiğinde dosya yüklemek istemiyorsanız Adisyon programında QR menü kayıtlı ürünlerden gelir; masadan sipariş, mutfak ekranı ve hesap kapama aynı yerdedir.' },
  alanlar: [
    { ad: 'isletme', etiket: 'İşletme adı', deger: 'Örnek Kafe', gerekli: true },
    { ad: 'alt', etiket: 'Alt yazı', deger: 'Fiyatlara KDV dahildir', ipucu: 'Adres, çalışma saati veya kısa bir not' },
    { ad: 'kalemler', tip: 'satirlar', etiket: 'Menü', ekle: 'Ürün ekle', kolon: '1fr 1.4fr 1.4fr 110px', sutunlar: [{ ad: 'grup', etiket: 'Bölüm', yer: 'Sıcak içecekler' }, { ad: 'urun', etiket: 'Ürün' }, { ad: 'not', etiket: 'İçerik / alerjen' }, { ad: 'fiyat', etiket: 'Fiyat', tip: 'para' }], satir: [{ grup: 'Sıcak içecekler', urun: 'Türk kahvesi', not: '', fiyat: '60' }, { grup: 'Sıcak içecekler', urun: 'Demleme çay', not: '', fiyat: '25' }, { grup: 'Tatlılar', urun: 'Sütlaç', not: 'Süt içerir', fiyat: '85' }] },
    { tip: 'ara', etiket: 'Masa kartları' },
    { ad: 'link', etiket: 'Menünüzün web adresi', yer: 'ornekkafe.com/menu', ipucu: 'İndirdiğiniz menü dosyasını yayınladığınız adres. Karekod bu adrese gider.' },
    { ad: 'masa', etiket: 'Masa sayısı', tip: 'sayi', deger: '6', ipucu: 'En fazla 60. Adrese masa numarası eklenir.' },
  ],
  gerekli: [],
  hesap: function (v, H) {
    const L = v.kalemler.filter((x) => x.urun); if (!L.length) return H.not('En az bir ürün girin.', 'uyari');
    const gruplar = []; L.forEach((x) => { const g = x.grup || 'Menü'; let k = gruplar.find((y) => y.g === g); if (!k) gruplar.push((k = { g, l: [] })); k.l.push(x); });
    const icerik = gruplar.map((k) => `<h3>${H.esc(k.g)}</h3>${k.l.map((x) => `<div class="m-urun"><span>${H.esc(x.urun)}${x.not ? `<small>${H.esc(x.not)}</small>` : ''}</span><b>${x.fiyat != null ? H.tl(x.fiyat) : ''}</b></div>`).join('')}`).join('');
    const baslik = `<h2>${H.esc(v.isletme || 'Menü')}</h2>${v.alt ? `<p style="text-align:center">${H.esc(v.alt)}</p>` : ''}`;
    H.dosya = { ad: 'menu.html', tur: 'text/html;charset=utf-8', icerik: `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${H.esc(v.isletme || 'Menü')}</title><style>body{margin:0 auto;max-width:640px;padding:20px;font:16px/1.45 system-ui,Arial,sans-serif;color:#111;background:#fff}h2{text-align:center;font-size:26px;margin:8px 0}h3{text-transform:uppercase;font-size:15px;letter-spacing:.05em;border-bottom:1px solid #333;padding-bottom:3px;margin-top:22px}.m-urun{display:flex;justify-content:space-between;gap:14px;padding:6px 0}.m-urun small{display:block;color:#555}.m-urun b{white-space:nowrap}</style></head><body>${baslik}${icerik}</body></html>` };
    let masa = '', uyari = '';
    if (v.link) {
      try { const u = H.adresMetni(v.link); const n = Math.min(Math.max(Math.floor(v.masa || 0), 0), 60); masa = n ? `<div class="masa-k" style="margin-top:16px">${Array.from({ length: n }, (_, i) => `<div class="masa"><b>Masa ${i + 1}</b>${H.qrSvg(H.masaLinki(u, i + 1), { boyut: 170 })}<div>Menü için telefonunuzun kamerasıyla okutun</div></div>`).join('')}</div>` : ''; } catch (e) { uyari = H.not(H.esc(e.message), 'uyari'); }
    } else uyari = H.not('Masa kartları için önce menü dosyasını yayınlayacağınız web adresini girin. Adres olmadan karekod üretilmez.');
    return `${H.eylemler(H.btn('yazdir', 'Yazdır / PDF'), H.btn('dosya', 'Web menüsünü indir (menu.html)'))}<div class="belge menu" style="margin-top:14px">${baslik}${icerik}</div>${uyari}${masa}`;
  },
  aciklama: [
    'Bu araç, basılı menüsünü telefona taşımak isteyen küçük işletmeler için üç çıktı birden hazırlar: A4 boyutunda yazdırılabilir menü, herhangi bir web hosting alanına yüklenebilen tek dosyalık menü sayfası ve her masaya ayrı numara taşıyan karekodlu masa kartları.',
    'Karekod bir adresi gösterir, menünün kendisini taşımaz. Bu nedenle önce menu.html dosyasını kendi sitenize veya dosya barındırma alanınıza yükleyip oradaki adresi girmeniz gerekir. Tek bir karekoda sığdırılan menü metni telefonlarda okunmaz; adres yöntemi fiyat değiştiğinde kartları yeniden bastırmadan güncelleme yapmanızı sağlar, çünkü aynı adresteki dosyayı değiştirmeniz yeterlidir.',
    'Ürünün içerik satırına alerjen uyarısı yazmak, garsona tekrar tekrar sorulan soruları azaltır. Fiyatların KDV dahil olup olmadığını alt yazıda açıkça belirtmeniz müşteriyle hesap anındaki tartışmayı önler.',
  ],
  ornek: { baslik: 'Kullanım örneği: altı masalı bir kafe', metin: [
    'Bir kafe sahibi bölüm sütununa “Sıcak içecekler” ve “Tatlılar” yazar, altına ürünleri ve fiyatları ekler. Aynı bölüm adını yazdığı satırlar menüde tek başlık altında toplanır. “Web menüsünü indir” düğmesiyle aldığı dosyayı sitesine yükler, adresi masa kartları bölümüne girer.',
    'Masa sayısına 6 yazınca her kart kendi numarasıyla üretilir: birinci masanın karekodu adresin sonuna masa=1 ekler. Kartları A4 kâğıda yazdırıp keser, masalara yerleştirir. Sütlacın fiyatı değiştiğinde yalnız menu.html dosyasını yeniler; basılı kartlar aynı kalır.',
  ] },
  sss: [
    ['QR menü için aylık ücret ödemem gerekir mi?', 'Bu sayfadaki araç ücretsizdir. Yalnız menü dosyasını yayınlayacağınız bir web adresine ihtiyacınız olur; mevcut siteniz varsa onu kullanabilirsiniz.'],
    ['Karekodu okutunca menü açılmıyor, neden?', 'Karekod girdiğiniz adrese gider. Dosyayı o adrese yüklemediyseniz, adresi eksik yazdıysanız veya sayfa yayında değilse telefonda hata görünür. Kartları basmadan önce kendi telefonunuzla deneyin.'],
    ['Girdiğim menü bir yere kaydediliyor mu?', 'Hayır. Bilgiler yalnız bu sekmede işlenir, sayfa kapanınca kaybolur. Saklamak için web menüsü dosyasını indirin.'],
    ['Masa numarası ne işe yarar?', 'Adrese eklenen masa bilgisi hangi masadan okutulduğunu gösterir. Tek dosyalık menü bunu kullanmaz; sipariş almak için masa bilgisini okuyan bir sistem gerekir.'],
  ],
};
