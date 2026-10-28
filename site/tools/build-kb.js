/* NEBSOFT bilgi bankası üreticisi → core/kb.json
   Kaynaklar (hepsi projedeki gerçek veriler):
     1) site/tools/kb-genel.js — elle yazılmış genel sorular
     2) market/catalog.js — her programın açıklaması, özellikleri, modülleri, SSS'si, sektörleri ve fiyatları
     3) apps/<program>/app.js — programın gerçek sol menüsü (sayfa adları)
   Çıktı her kayıt için { id, m (modül), t (konu), q, alt[], a, tags[] } içerir; yapay zekâ eğitimi için
   doğrudan soru-cevap çiftlerine dönüştürülebilir. Çalıştırma: node site/tools/build-kb.js */
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
global.window = {}; require(path.join(ROOT, 'market', 'catalog.js')); const C = window.CATALOG;
const GEN = require('./kb-genel.js');
const out = []; const seen = new Set();
const add = (m, t, q, alt, a, tags = []) => { const k = m + '|' + q.toLocaleLowerCase('tr'); if (seen.has(k)) return; seen.add(k); out.push({ id: 'k' + out.length.toString(36), m, t, q, alt: alt.filter(Boolean), a, tags }); };
const tl = (n) => Number(n).toLocaleString('tr-TR');
const lc = (s) => s.toLocaleLowerCase('tr');
// Türkçe ek: "Market POS'ta", "Adisyon'da"
const ek = (name, kind) => { const last = lc(name).replace(/[^a-zçğıöşü]/g, '').slice(-1); const vowels = (lc(name).match(/[aeıioöuü]/g) || []); const v = vowels[vowels.length - 1] || 'e'; const back = 'aıou'.includes(v); const hard = 'fstkçşhp'.includes(last) || /[A-Z]$/.test(name); if (kind === 'da') return `${name}'${hard ? 't' : 'd'}${back ? 'a' : 'e'}`; if (kind === 'in') { const iv = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v] || 'i'; return `${name}'${'aeıioöuü'.includes(last) ? 'n' : ''}${iv}n`; } return name; };

GEN.forEach(([t, q, alt, a, tags]) => add('genel', t, q, alt, a, tags));
add('genel', 'lisans', 'Hangi programlar var?', ['program listesi', 'ne tür yazılımlarınız var', 'sektörüme uygun program'], `NEBSOFT'ta ${C.products.length} program var: ${C.products.map((p) => p.name).join(', ')}. Hepsini [Programlar](/#/urunler) sayfasında kategoriye göre inceleyebilir, kayıt olmadan demolarını açabilirsiniz.`, ['program']);

// Sayfa adına göre kısa açıklama (yalnızca sayfa adından kesin çıkarılabilen anlamlar)
const PAGE = [
  [/^(özet|genel bakış|pano|dashboard)/i, 'günün ve dönemin özet rakamlarını, grafikleri ve dikkat isteyen kayıtları gösterir'],
  [/rapor/i, 'dönemsel raporları, grafik ve tabloları gösterir; çoğu rapor yazdırılabilir veya dışa aktarılabilir'],
  [/ayar/i, 'işletme bilgileri, kullanıcılar ve yetkiler, görünüm/tema ve programa özel tercihlerin yapıldığı yerdir'],
  [/müşteri|cari/i, 'müşteri kartlarını, iletişim bilgilerini ve müşteriye ait hareketleri yönetmenizi sağlar'],
  [/tedarikçi/i, 'tedarikçi kartlarını ve tedarikçiyle olan alış/ödeme hareketlerini yönetir'],
  [/stok|depo|envanter/i, 'stok miktarlarını, kritik seviyeleri ve stok hareketlerini izlemenizi sağlar'],
  [/kasa|gün sonu/i, 'kasa giriş/çıkışlarını ve gün sonu kapanışını takip eder'],
  [/fatura/i, 'faturaları listeler, yeni fatura girmenizi ve geçmiş faturaları görüntülemenizi sağlar'],
  [/randevu|takvim|ajanda/i, 'randevuları takvim görünümünde planlamanızı ve yönetmenizi sağlar'],
  [/personel|çalışan|ekip|kadro/i, 'çalışan bilgilerini ve çalışanlara ait kayıtları yönetir'],
  [/ürün|hizmet/i, 'ürün/hizmet kartlarını, fiyatları ve tanımları yönetir'],
  [/kategori/i, 'kayıtları gruplamak için kullanılan kategorileri düzenler'],
  [/sipariş/i, 'siparişleri listeler ve sipariş durumlarını takip etmenizi sağlar'],
  [/kampanya|indirim|kupon/i, 'kampanya ve indirim tanımlarını yönetir'],
  [/belge|imza/i, 'şablonlu belgeleri oluşturup müşteriye dijital olarak imzalatmanızı ve saklamanızı sağlar'],
  [/bildirim/i, 'program içi bildirimleri ve uyarıları listeler'],
  [/sms|mesaj|iletişim/i, 'müşterilere gönderilen mesajları ve iletişim kayıtlarını yönetir'],
  [/ödeme|tahsilat|aidat|borç|veresiye/i, 'ödeme, tahsilat ve borç/alacak takibini yapmanızı sağlar'],
  [/etiket|barkod/i, 'ürünler için barkod ve raf etiketi basmanızı sağlar'],
  [/satış/i, 'satış işlemlerini yapmanızı veya geçmiş satışları görüntülemenizi sağlar'],
];
const pageDesc = (label) => { const h = PAGE.find(([r]) => r.test(label)); return h ? h[1] : null; };

for (const p of C.products) {
  const m = p.id; const N = p.name; const appF = path.join(ROOT, 'apps', m, 'app.js');
  // Program tanıtımı
  add(m, 'tanitim', `${N} nedir?`, [`${N} ne işe yarar`, `${lc(N)} programı`, `${ek(N, 'in')} özellikleri neler`], `**${N}** — ${p.tagline}. ${p.desc}`, ['tanıtım']);
  add(m, 'tanitim', `${N} hangi işletmeler için uygun?`, [`${N} kimler kullanabilir`, `${N} hangi sektörler`], `${N}; ${p.sectors.join(', ')} gibi işletmeler için tasarlandı.`, ['sektör']);
  p.sectors.forEach((s) => add(m, 'sektor', `${s} için hangi program?`, [`${lc(s)} programı`, `${lc(s)} yazılımı`, `${lc(s)} otomasyonu`, `${lc(s)} için yazılım önerisi`], `${s} işletmeleri için **${N}** öneriyoruz: ${p.tagline}. [İncele](/#/urun/${m})`, ['sektör', lc(s)]));
  if (p.prices) add(m, 'fiyat', `${N} fiyatı ne kadar?`, [`${N} ücreti`, `${N} aylık fiyat`, `${lc(N)} kaç para`, `${N} paketleri`], `${N} aylık fiyatları: ${C.plans.map((pl, i) => `**${pl.name}** ${tl(p.prices[i])} ₺ (${pl.users})`).join(', ')}. Yıllık ödemede indirim uygulanır; güncel tutarlar [programın sayfasında](/#/urun/${m}).`, ['fiyat']);
  add(m, 'tanitim', `${N} demosunu nasıl denerim?`, [`${N} demo`, `${N} canlı demo`, `${N} kayıtsız deneme`], `Programın sayfasındaki **Canlı demo** düğmesiyle kayıt olmadan örnek verilerle deneyebilirsiniz. Kendi verilerinizle 7 gün denemek için hesabınızla **Ücretsiz dene** talebi oluşturun. [${N}](/#/urun/${m})`, ['demo']);
  (p.features || []).forEach((f) => { const short = f.split(/[:,;—(]/)[0].trim(); add(m, 'ozellik', `${ek(N, 'da')} ${lc(short)} var mı?`, [`${N} ${lc(short)}`, `${lc(short)} nasıl yapılır`, `${lc(short)} özelliği`], `Evet. ${f}.`.replace('..', '.'), ['özellik']); });
  (p.modules || []).forEach((mo) => add(m, 'modul', `${ek(N, 'da')} ${mo} modülü var mı?`, [`${N} ${lc(mo)}`, `${lc(mo)} modülü`], `Evet, ${N} içinde **${mo}** bölümü bulunur.`, ['modül']));
  (p.faq || []).forEach(([q, a]) => add(m, 'sss', q, [`${N} ${lc(q.replace(/\?$/, ''))}`], a, ['sss']));
  // Gerçek menü: sayfa yeri, ne işe yarar, nasıl kullanılır
  if (fs.existsSync(appF)) {
    const src = fs.readFileSync(appF, 'utf8'); const items = [...src.matchAll(/\{ id: '([a-z0-9_-]+)', label: '([^']+)', icon: '[^']+'(?:, roles: \[([^\]]*)\])?/g)];
    const uniq = new Map(); items.forEach((x) => uniq.has(x[2]) || uniq.set(x[2], x));
    uniq.forEach(([, id, label, roles]) => {
      const d = pageDesc(label); const r = roles ? roles.replace(/'/g, '').split(/,\s*/).filter(Boolean) : null;
      const yetki = r && r.length && !r.includes('*') ? ` Bu sayfayı yalnızca şu rollerdeki kullanıcılar görür: ${r.join(', ')}.` : '';
      add(m, 'menu', `${ek(N, 'da')} ${label} nerede?`, [`${label} nerede`, `${lc(label)} sayfası`, `${lc(label)} ekranına nasıl girilir`, `${lc(label)} bulamıyorum`], `${N} programında sol menüden **${label}** sayfasını açın.${yetki} Menü gruplarından biri kapalıysa başlığına tıklayarak açabilir veya **Ctrl + K** ile "${label}" yazarak arayabilirsiniz.`, ['menü', id]);
      if (d) add(m, 'menu', `${ek(N, 'da')} ${label} ne işe yarar?`, [`${lc(label)} ne işe yarar`, `${lc(label)} ekranı`, `${lc(label)} nedir`], `**${label}** sayfası ${d}. Sol menüden **${label}** ile açılır.${yetki}`, ['menü', id]);
      if (!d && !roles) add(m, 'menu', `${ek(N, 'da')} ${label} nasıl kullanılır?`, [`${lc(label)} nasıl kullanılır`, `${lc(label)} işlemleri`], `Sol menüden **${label}** sayfasını açın. Sayfanın üst kısmındaki düğmeler o bölümdeki işlemleri içerir; listelerde arama kutusuyla kayıt bulabilir, satırdaki simgelerle düzenleme yapabilirsiniz. Ayrıntılı adım isterseniz sorunuzu daha açık yazın, ekibimize iletelim.`, ['menü', id]);
    });
  }
}
fs.writeFileSync(path.join(ROOT, 'core', 'kb.json'), JSON.stringify({ v: Date.now(), n: out.length, items: out }));
const by = out.reduce((a, x) => ((a[x.m] = (a[x.m] || 0) + 1), a), {});
console.log('Bilgi bankası:', out.length, 'kayıt ·', Object.keys(by).length, 'modül · örnek:', JSON.stringify(by).slice(0, 200));
