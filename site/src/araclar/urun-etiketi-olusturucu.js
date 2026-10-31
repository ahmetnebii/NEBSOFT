const { GUNCELLEME } = require('./_kaynak');
module.exports = {
  slug: 'urun-etiketi-olusturucu', kategori: 'kod', sira: 4, tek: true, renk: '#be185d', guncelleme: GUNCELLEME,
  ad: 'Ürün ve Raf Etiketi Oluşturucu', kisa: 'Excel listesini yapıştırın, barkodlu fiyat etiketlerini A4 kâğıda yazdırın',
  baslik: 'Ücretsiz Raf ve Fiyat Etiketi Oluşturucu — Barkodlu A4 | NEBSOFT',
  ozet: 'Ürün adı, barkod ve fiyatı Excel’den yapıştırın; barkodlu fiyat etiketlerini A4 sayfaya dizip yazdırın. Hatalı barkodlar satır satır gösterilir, üyelik gerekmez.',
  sonucBaslik: 'Etiketler',
  program: { slug: 'butikprogrami', metin: 'Beden, renk ve indirimli fiyat taşıyan etiketleri kendi tasarımınızla ürün kartından basmak için Butik programındaki etiket tasarımcısını kullanabilirsiniz.' },
  alanlar: [
    { ad: 'liste', etiket: 'Ürün listesi', tip: 'cokmetin', gerekli: true, deger: 'Pamuklu Havlu;8690000000012;149,90\nSeramik Kupa;8690000000029;89,50\nDefter A5;KIRT-A5-01;35', ipucu: 'Her satır: ad, barkod, fiyat. Excel’den üç sütunu kopyalayıp yapıştırın ya da noktalı virgülle ayırın.' },
    { ad: 'sutun', etiket: 'Sayfadaki sütun', tip: 'secim', deger: '3', secenekler: [['2', '2 sütun'], ['3', '3 sütun'], ['4', '4 sütun']] },
    { ad: 'kopya', etiket: 'Her üründen adet', tip: 'sayi', deger: '1', ipucu: 'En fazla 500 etiket üretilir.' },
  ],
  hesap: function (v, H) {
    const S = H.satirlarOku(v.liste, 3); const hatalar = []; const et = [];
    S.forEach(([ad, kod, fiyat], i) => {
      let b = null; if (kod) { try { b = /^\d{12,13}$/.test(kod) ? H.ean13(kod) : H.code128(kod); } catch (e) { hatalar.push(`${i + 1}. satır (${H.esc(ad || kod)}): ${H.esc(e.message)}`); } }
      const f = H.sayiOku(fiyat); if (fiyat && Number.isNaN(f)) hatalar.push(`${i + 1}. satır (${H.esc(ad)}): fiyat okunamadı`);
      et.push({ ad, b, f });
    });
    const n = Math.max(Math.floor(v.kopya || 1), 1); const tum = []; for (const e of et) for (let i = 0; i < n && tum.length < 500; i++) tum.push(e);
    const html = tum.map((e) => `<div class="etiket"><b>${H.esc(e.ad)}</b>${Number.isNaN(e.f) ? '' : `<div class="f">${H.tl(e.f)}</div>`}${e.b ? H.barkodSvg(e.b, { yukseklik: 46, modul: 1.5 }) : ''}</div>`).join('');
    return `${hatalar.map((x) => H.not(x, 'uyari')).join('')}${H.eylemler(H.btn('yazdir', 'Etiketleri yazdır'))}${H.not(`${tum.length} etiket hazır. Yazdırırken ölçeği yüzde 100 seçin.`)}<div class="etiketler" style="--etk:${Number(v.sutun) || 3};margin-top:12px">${html}</div>`;
  },
  aciklama: [
    'Fiyat değişikliği olan bir mağazada en çok zaman alan iş etiketleri tek tek hazırlamaktır. Bu araçta ürün listesini Excel’den üç sütun olarak kopyalayıp yapıştırmanız yeterli: ad, barkod ve fiyat. Araç hepsini aynı biçimde kesim çizgili bir A4 düzenine dizer, tarayıcının yazdırma penceresinden PDF olarak da kaydedebilirsiniz.',
    'Barkod sütununda 12 veya 13 rakam varsa EAN-13, harf içeren kodlarda Code 128 çizilir. Yanlış kontrol hanesi taşıyan ya da Türkçe harf içeren satırlar sessizce atlanmaz; hangi satırın sorunlu olduğu listenin üstünde yazar, böylece rafta okunmayan etiketle karşılaşmazsınız.',
    'Tüm ürünlerde aynı adette etiket gerekiyorsa adet alanını kullanın. Çok sayıda etiketi önce tek sayfa deneyin: yazıcının ölçekleme ayarı kâğıda sığdır seçiliyse barkod küçülür ve okuyucu zorlanabilir. Ölçeği yüzde yüz seçmek en güvenli yoldur.',
  ],
  ornek: { baslik: 'Kullanım örneği: zam sonrası raf etiketi yenileme', metin: [
    'Bir kırtasiye, tedarikçi zammından sonra 40 ürünün fiyatını değiştirir. Stok listesindeki ad, barkod ve yeni fiyat sütunlarını seçip yapıştırır. Sütun sayısını 3 yapar ve önizlemede fiyatları kontrol eder.',
    'Liste üstünde “7. satır: kontrol hanesi hatalı” uyarısı çıkar; bu ürünün barkodu stok listesine yanlış girilmiştir. Numarayı ambalajdan düzeltir, uyarı kaybolunca yazdırır ve kesim çizgilerinden keserek raflara yerleştirir.',
  ] },
  sss: [
    ['Etiket kâğıdı (hazır yapışkanlı) ile uyumlu mu?', 'Sütun sayısı değişse de sayfa düzeni düz A4 kâğıda göredir, hazır etiket kâğıtlarının ölçüleriyle birebir eşleşmeyebilir. Önce boş kâğıda basıp üst üste tutarak kontrol edin.'],
    ['Barkodu olmayan ürün için etiket basabilir miyim?', 'Evet. Barkod sütununu boş bırakın; etiketin üzerinde yalnız ad ve fiyat görünür.'],
    ['Binlerce ürünü aynı anda basabilir miyim?', 'Tarayıcıyı yormamak için tek seferde 500 etiket üretilir. Daha uzun listeleri bölümlere ayırın.'],
    ['Fiyatlar Excel’de noktalı yazılmış, sorun olur mu?', 'Hayır. Hem 1.234,50 hem de 1234.50 biçimi okunur. Okunamayan fiyat satır numarasıyla bildirilir.'],
  ],
};
