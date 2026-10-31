// Tüm programlarda aynı olan bölümler. Program içeriği (docs/kilavuz/<id>.js) buradaki modülleri çağırır, kendi modüllerini yazar.
// Entegrasyon bölümü çekirdekten üretilir: bağlantı listesi NS.integ.USED, doğrulama durumu UNVERIFIED ve core/integ-guides.js kayıtlarıdır; elle kopyalanmaz.
const { md, esc, tablo, liste, gorevHtml, modulHtml, bolumBas } = require('./sablon');
const ham = (s) => esc(String(s ?? '').replace(/<a\b[^>]*>|<\/a>/g, '')).replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/&lt;code&gt;|&lt;\/code&gt;/g, '').replace(/&amp;(\w+);/g, '&$1;');
const TEMEL = new Set(['sim', 'none', 'demo', 'manual']);

// ---------- Ortak modüller ----------
const belgeler = (o = {}) => ({ id: 'belgeler', ne: 'Yazdırdığınız belgelerin görünümünü burada ayarlarsınız: kâğıt boyu, logo, renk, hangi bölümlerin görüneceği ve belge altındaki metinler. Değişiklik sağdaki önizlemede anında görünür.', gorevler: [{ baslik: 'Belge şablonunu düzenleme', sahneler: [
  { git: 'belgeler', adimlar: [[o.tur ? `Üstten düzenleyeceğiniz belgeyi seçin, örneğin **${o.tur}**.` : 'Üstten düzenleyeceğiniz belgeyi seçin.', o.tur ? `button@${o.tur}` : null], ['**Kâğıt** alanından A4, A5, 80 mm veya 58 mm boyutunu seçin. Fiş yazıcısı kullanıyorsanız kâğıt rulonuzun genişliğini seçin.', '.field@Kâğıt'], ['İşiniz bitince **Şablonu kaydet** düğmesine basın.', 'button@Şablonu kaydet']] },
  { git: 'belgeler', adimlar: [['Sonucu görmek için **Deneme yazdır** düğmesini kullanın. Bu düğme örnek veriyle yazdırma penceresini açar.', 'button@Deneme yazdır']] }] }],
alanlar: [['Kâğıt', 'Belgenin basılacağı kâğıt boyu.'], ['Vurgu rengi', 'Başlık ve çizgilerde kullanılan renk.'], ['Yazı boyu', 'Belgedeki yazıların büyüklüğü.'], ['Logo', 'Belgenin başında görünen işletme logosu.'], ['Başlık altı not', 'Başlığın hemen altına yazılacak kısa metin.'], ['Şartlar / garanti metni', 'Belgenin altındaki koşul metni. Metni işletmeniz belirler.'], ['İmza başlıkları (| ile ayırın)', 'İmza kutularının başlıkları. Örneğin Teslim eden | Teslim alan.']],
hatalar: [['Değişiklik yazdırılan belgede görünmüyor.', '**Şablonu kaydet** düğmesine bastığınızdan emin olun, sonra belgeyi yeniden yazdırın.'], ['Logo görünmüyor.', 'Sayfadaki **Başlık (logo + işletme bilgisi)** bölümünün açık olduğunu kontrol edin.']] });

const ebelge = () => ({ id: 'ebelge', ne: 'e-Fatura, e-Arşiv ve e-İrsaliye kayıtlarının giden ve gelen kutusudur. Belgeyi bu sayfadan veya belge kesilen işlemden oluşturursunuz, durumunu buradan izlersiniz. Gerçek gönderim için önce Entegrasyonlar bölümünden entegratör hesabınızı bağlamanız gerekir. Bağlantı yokken oluşan belgeler TEST olarak görünür, GİB’e gitmez.', gorevler: [{ baslik: 'Belge kutularını izleme', sahneler: [
  { git: 'ebelge', en: 1500, adimlar: [['**Giden kutusu** kestiğiniz belgeleri, **Gelen kutusu** size kesilen belgeleri gösterir.', 'button@Giden kutusu'], ['Belge durumlarını yenilemek için **Durumları güncelle** düğmesini kullanın.', '#eb-bulk'], ['Vergi numarasının e-Fatura mükellefi olup olmadığını **Mükellef sorgula** ile öğrenin.', '#eb-q'], ['Faturasız bir satış için **Manuel e-Arşiv** ile belge oluşturun.', '#eb-new']] }] }],
hatalar: [['Belge TEST olarak görünüyor.', 'Entegratör bağlı değildir. **Entegrasyonlar** sayfasından e-Fatura bağlantısını kurun. TEST belgeler resmî belge değildir.'], ['Belge hata durumunda kaldı.', 'Satırdaki **Tekrar gönder** seçeneğini kullanın. Hata sürerse entegratör panelinizdeki bilgileri kontrol edin.']] });

const entegrasyonlar = () => ({ id: 'entegrasyonlar', ne: 'Bu programda kullanılan bağlantıların kurulduğu sayfadır. Sayfada yalnız bu programda çalışan bağlantılar listelenir. Kurulum adımları, her bağlantıda neyin değiştiği ve hangi bağlantıların henüz kullanılamadığı kılavuzun Entegrasyonlar bölümünde ayrıntılı yazılıdır.', gorevler: [] });

const bildirimler = () => ({ id: 'bildirimler', ne: 'Hangi olayda hangi sesin çalacağını seçtiğiniz sayfadır. Ayarlar bu cihaza özeldir, örneğin kasadaki bilgisayar ile depodaki tablet farklı ayarlanabilir.', gorevler: [{ baslik: 'Bildirim sesini ayarlama', sahneler: [{ git: 'bildirimler', adimlar: [['Ayarınızı denemek için **Deneme bildirimi** düğmesine basın.', 'button@Deneme bildirimi'], ['Program arka plandayken de uyarı almak için **Tarayıcı izni ver** düğmesini kullanın.', 'button@Tarayıcı izni ver']] }] }],
alanlar: [['Bildirimler açık', 'Kapalıysa bu cihazda ses çalmaz.'], ['Ses düzeyi', 'Bildirim sesinin yüksekliği.'], ['Onaylanana kadar tekrarla', 'Önemli olayda bildirimi görene kadar ses yinelenir.']],
hatalar: [['Ses gelmiyor.', 'Bilgisayarın sesini ve **Bildirimler açık** kutusunu kontrol edin. Tarayıcı sesi ancak sayfaya bir kez tıkladıktan sonra çalar.']] });

const imzali = () => ({ id: 'imzali', ne: 'Sözleşme, tutanak ve benzeri belgeleri karşı tarafa ekranda imzalatıp işletmenizin şablonuyla yazdırdığınız sayfadır. İmzalanan belgeler aynı sayfadaki **Arşiv** bölümünde saklanır.', gorevler: [{ baslik: 'Belge imzalatma', sahneler: [{ git: 'imzali', adimlar: [['Metinleri işletmenize göre değiştirmek için **Şablonları tasarla** düğmesini kullanın.', 'a@Şablonları tasarla'], ['Yukarıdaki belge türlerinden birini seçin, formu doldurun ve karşı tarafa ekranda imzalatın.', null]] }] }],
hatalar: [['Belge metni işletmeme uymuyor.', 'Metinler örnektir. **Şablonları tasarla** ile düzenleyin, gerekiyorsa hukuk danışmanınıza gösterin.']] });

const ayarlar = (o = {}) => ({ id: 'ayarlar', ne: 'İşletme bilgilerini, kullanıcıları, menüde görünecek bölümleri, temayı ve yedeklemeyi buradan yönetirsiniz.', gorevler: [{ baslik: 'İşletme bilgilerini girme', ne: 'Buraya yazdığınız bilgiler fişlerde, belgelerde ve müşteri sayfalarında görünür.', sahneler: [
  { git: 'ayarlar', kirp: '.card@İşletme Bilgileri', boy: 1900, adimlar: [['**İşletme adı** ve iletişim bilgilerinizi yazın.', '.field@İşletme adı'], ['**Kaydet** düğmesine basın.', '#ss']] }] },
{ baslik: 'Kullanıcı ekleme', ne: 'Her çalışana ayrı kullanıcı açın. Kullanıcının rolü menüde neleri göreceğini belirler. Rollerin ayrıntısı Roller ve yetkiler bölümündedir.', sahneler: [
  { git: 'ayarlar', once: [['tikla', '#ua']], kirp: 'pencere', adimlar: [['**Ad soyad** yazın.', '.field@Ad soyad'], ['**Rol** seçin.', '.field@Rol'], ['Kullanıcının gireceği dört haneli **PIN (4 hane)** kodunu belirleyin.', '.field@PIN'], ['**Kaydet** düğmesine basın.', 'button@Kaydet']] }] },
{ baslik: 'Kullanmadığınız bölümü gizleme', sahneler: [
  { git: 'ayarlar', boy: 1500, kirp: '#navh', adimlar: [['**Menü ve modüller** listesinde kutuyu kaldırın. Bölüm menüden gizlenir, veriler silinmez. Kutuyu yeniden işaretleyince bölüm geri gelir.', null]] }] }],
alanlar: [['İşletme adı', 'Belgelerde ve müşteri sayfalarında görünen ad.'], ['Vergi no', 'Faturalarda kullanılan vergi numarası.'], ['Vergi dairesi', 'Faturalarda kullanılan vergi dairesi.'], ...(o.alanlar || [])],
hatalar: [['Kaydet düğmesi sonrası uyarı çıkıyor.', 'Yıldızlı alanlar zorunludur. Boş kalan alanı doldurun.'], ['PIN kabul edilmiyor.', 'PIN dört haneli rakam olmalıdır.'], ['Tema başka bilgisayarda farklı.', 'Tema seçimi cihaza özeldir. Her cihazda ayrı seçilir.']] });

// ---------- Hazır entegrasyon metinleri ----------
const E = {
  backup: () => ({ degisir: ['**Yedek al** bu programın verilerini JSON dosyası olarak bilgisayarınıza indirir. Dosya adı program adı ve tarihle başlar.', 'Hatırlatma süresi yedek almanızı hatırlatan ayardır. Otomatik yedek almaz.', 'Bu bağlantı dış bir servise veri göndermez.'], sorun: ['Yedek dosyası inmiyorsa tarayıcının indirme iznini kontrol edin.'] }),
  whatsappLink: (nerede) => ({ degisir: [`${nerede} WhatsApp’ı açar. Mesaj hazır gelir, siz gönderirsiniz.`, 'Bu düğme API bağlansa da WhatsApp’ı açar. Mesajı siz gönderirsiniz, otomatik gönderim olmaz.'], sorun: ['WhatsApp açılmıyorsa müşterinin telefon numarasını kontrol edin.'] }),
};

// ---------- Entegrasyon sınıflandırma ----------
// Sınıf çekirdekten gelir: NB_GUIDES.kapali (sihirbaz da bunu kullanır) ve NS.integ.unverified. Sözleşme gereken sağlayıcı için kısa ve dürüst tek cümle kullanılır.
const ILETISIM = 'NEBSOFT ile iletişime geçerek açtırılır';
// x: programın entegrasyon içeriği. kapali listesindeki sağlayıcı bu programda doğrudan bağlanmaz (koddan doğrulanır)
function durum(e, p, x) {
  const g = p.g;
  if (TEMEL.has(p.value)) return ['ki', 'TEST veya temel mod', 'Dış servise bağlanmaz, gönderim yapılmaz.'];
  const kap = x && x.kapali && (x.kapali[p.value] || x.kapali['*']); if (kap && p.value !== 'custom') return ['no', ILETISIM, ''];
  if (p.value === 'custom') return ['ki', 'Özel servis', 'Kendi servisinizi veya çözüm ortağınızı bağlamak içindir, teknik bilgi gerekir.'];
  if (p.kilit || !g || g.kapali) return ['no', ILETISIM, ''];
  return ['ok', 'Entegre et', g.test || 'Bağlantı denenerek kurulur.'];
}
const kullanilir = (d) => d[0] === 'ok' || d[0] === 'ki';

// Akış görüntüsü için alanları doldurulabilen ilk sağlayıcı seçilir; deneme düğmesine basılmaz, hiçbir yere istek gitmez
// Yarım kalan kurulum taslağı sihirbazı ortadan açtırmasın
const TASLAK = ['js', `(()=>{const d=new NS.DB('entegrasyon-kurulum');d.load();d.data.drafts={};d.save();})()`];
const ornekSec = (K, R) => { for (const e of R.ent) { if (e.provs.length < 2) continue; for (const p of e.provs) { if (durum(e, p, K.entegrasyon[e.k])[0] !== 'ok' || !p.g || !p.g.sunucu) continue; const zorunlu = p.g.fields.filter((f) => f.required); if (zorunlu.length && zorunlu.every((f) => !f.pattern && f.type !== 'select')) return { e, p, zorunlu }; } } return null; };
function entegrasyonHazirla(K, R) {
  K.entSahne = [{ git: 'entegrasyonlar', kirp: 'ana', once: [['js', `(()=>{const L=[...document.querySelectorAll('button[data-wz]')];const b=L.find((x)=>x.innerText.trim()==='Entegre et')||L[0];if(b)b.setAttribute('data-klv','1')})()`]], adimlar: [['Sol menüden **Entegrasyonlar** sayfasını açın. Üstteki kutular kaç bağlantının **Bağlı** olduğunu, hata verdiğini veya beklediğini gösterir.', '.ic-kpi'], ['Bağlantıyı bulmak için arama kutusunu veya kategorileri kullanın.', '#icq'], ['Karttaki **{dugme}** düğmesine basın.', '[data-klv]']] }];
  const o = ornekSec(K, R);
  if (o) { const ac = [TASLAK, ['tikla', `[data-wz="${o.e.k}"]`], ['tikla', `[data-prov="${o.p.value}"]`], ['tikla', '[data-nav=next]']]; const doldur = o.zorunlu.map((f) => ['yaz', `[data-f="${f.name}"]`, 'ornek']);
    K.entSahne.push({ git: 'entegrasyonlar', once: ac, kirp: 'pencere', boy: 980, baslik: `${o.e.title} · ${o.p.label}`, adimlar: [['Sihirbazın üstünde üç adım görünür: **Sağlayıcı**, **Bilgiler**, **Bağlantıyı dene**. Sağlayıcıyı seçtikten sonra **Bilgiler** adımına geçersiniz.', '.wz-steps'], ['Bilgileri girin. Alanların yanındaki **?** simgesi bilginin ne olduğunu ve nereden alınacağını açıklar.', '.wz-body h2']] },
      { git: 'entegrasyonlar', once: [...ac, ...doldur, ['tikla', '[data-nav=next]']], kirp: 'pencere', boy: 980, baslik: `${o.e.title} · ${o.p.label}`, adimlar: [['Son adımda **Bağlantıyı dene** düğmesine basın. Sunucu sağlayıcıya zararsız bir istek atar, sonuç ekrana yazılır. Kart yalnız deneme geçerse **Bağlı** olur.', '#wzt']] }); }
  R.ent.forEach((e) => { const x = K.entegrasyon[e.k] = K.entegrasyon[e.k] || {}; x.sahneler = x.sahneler || [{ git: 'entegrasyonlar', once: [TASLAK, ['tikla', `[data-wz="${e.k}"]`]], kirp: 'pencere', baslik: e.title, adimlar: [['Sihirbaz bu pencereyle açılır. Sağlayıcınızı seçip **Bilgiler** adımına geçin.', '.wz-steps']] }]; });
  return null;
}
function entegrasyonBolum(K, R, baslangic) {
  const alt = R.ent.map((e) => ({ capa: `ent-${e.k}`, baslik: e.title }));
  const ozetDurum = (e) => { const x = K.entegrasyon[e.k]; const D = e.provs.map((p) => durum(e, p, x)); if (!e.provs.length || D.some((d) => d[0] === 'ok')) return 'Entegre et ile kurulur'; if (D.some((d) => d[1] === 'Temel mod' || d[1] === 'TEST veya temel mod') && !D.some((d) => d[0] === 'no')) return 'Temel modda çalışır'; return ILETISIM; };
  const parca = R.ent.map((e) => {
    const x = K.entegrasyon[e.k]; const L = e.provs.map((p) => ({ p, d: durum(e, p, x) }));
    const acik = L.filter((y) => y.d[0] !== 'no'); const kap = L.filter((y) => y.d[0] === 'no');
    const satir = acik.map(({ p, d }) => `<tr><td>${esc(p.label)}</td><td><span class="etk ${d[0]}">${esc(d[1])}</span></td><td>${ham(d[2])}</td></tr>`).join('');
    const uy = acik.filter(({ p }) => p.g && !TEMEL.has(p.value)).map((y) => y.p);
    // Aynı kurulum metnini paylaşan sağlayıcılar tek başlıkta toplanır (POS cihaz markaları gibi)
    const grup = new Map(); uy.forEach((p) => { const a = JSON.stringify([p.g.prereq, p.g.where, p.g.fields.map((f) => [f.label, f.nereden]), p.g.test, p.g.errors, p.g.limit]); if (!grup.has(a)) grup.set(a, []); grup.get(a).push(p); });
    const prov = [...grup.values()].map((G) => { const p = G[0]; const g = p.g; return `<h4>${esc(G.map((y) => y.label).join(', '))}</h4>${g.summary && G.length === 1 ? `<p>${ham(g.summary)}</p>` : ''}${g.limit ? `<div class="not"><b>Kapsam:</b> ${ham(g.limit)}</div>` : ''}
      ${g.prereq.length ? `<p class="bag"><b>Başlamadan önce</b></p><ul>${g.prereq.map((y) => `<li>${ham(y)}</li>`).join('')}</ul>` : ''}${g.where.length ? `<p class="bag"><b>Bilgiler sağlayıcıda nereden alınır</b></p><ol>${g.where.map((y) => `<li>${ham(y)}</li>`).join('')}</ol>` : ''}
      ${g.fields.length ? `<p class="bag"><b>Alanlar</b></p><table><thead><tr><th>Alan</th><th>Nereden alınır</th></tr></thead><tbody>${g.fields.map((f) => `<tr><td>${esc(f.label)}${f.required ? ' *' : ''}</td><td>${ham(f.nereden || f.ne || '')}</td></tr>`).join('')}</tbody></table>` : ''}
      ${g.test ? `<p><b>Bağlantıyı dene:</b> ${ham(g.test)}</p>` : ''}${g.errors.length ? `<p class="bag"><b>Hata ve çözümü</b></p><table><thead><tr><th>Hata</th><th>Çözüm</th></tr></thead><tbody>${g.errors.map((h) => `<tr><td>${ham(h.title)}</td><td>${ham(h.fix)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${g.sources.length ? `<p><b>Sağlayıcının resmî dokümanı:</b> ${g.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.label)}</a>`).join(' · ')}</p>` : ''}`; }).join('');
    const kapSatir = kap.length ? `<div class="yok"><b>${esc(ILETISIM)}:</b> ${kap.map(({ p }) => esc(p.label)).join(', ')}. Bu sağlayıcıların dokümanı herkese açık değildir veya bağlantı için sözleşme gerekir. Kartta **İletişim talebi** düğmesiyle talep bırakın.</div>`.replace('**İletişim talebi**', '<b class="ad">İletişim talebi</b>') : '';
    return `<section class="alt" id="ent-${e.k}"><h3 class="alt">${esc(e.title)}</h3><p class="bag">${esc(e.desc)}.</p>
      ${gorevHtml({ baslik: 'Nereden açılır', ne: `**Entegrasyonlar** sayfasında **${e.title}** kartındaki düğmeye basın.`, sahneler: x.sahneler })}
      ${satir ? `<h4>Sağlayıcılar</h4><table><thead><tr><th>Sağlayıcı</th><th>Kurulum</th><th>Bağlantıyı dene ne yapar</th></tr></thead><tbody>${satir}</tbody></table>` : ''}${kapSatir}
      <h4>Bağlandıktan sonra bu programda ne değişir</h4>${liste(x.degisir)}${x.sorun ? `<h4>Sorun çıkarsa ne yapılır</h4>${liste(x.sorun)}` : ''}${prov}</section>`;
  }).join('');
  return { capa: 'entegrasyon', baslik: 'Entegrasyonlar', alt, html: `<section class="b" id="entegrasyon">${bolumBas(baslangic, 'Entegrasyonlar', 'Servisleri kendi hesabınızla bağlarsınız. Bu bölümde yalnız bu programda kullanılan bağlantılar anlatılır.')}
    ${gorevHtml({ baslik: 'Tek akış: Entegre et, Bağlantıyı dene, Bağlı', sahneler: K.entSahne })}
    <div class="uy">Kart yalnız <b>Bağlantıyı dene</b> geçince <b>Bağlı</b> görünür. Deneme sunucudan sağlayıcıya zararsız bir istek atar: bakiye, hesap bilgisi veya kimlik jetonu. İleti gönderilmez, para çekilmez. Bilgileri değiştirirseniz bağlantı yeniden denenene kadar iş akışı durur.</div>
    <div class="not">Entegrasyon desteklenir, kendi hesabınızla bağlarsınız. Sonuç sağlayıcı hesabınıza bağlıdır. İlk gerçek işlemde sağlayıcı panelinden kontrol edin.</div>
    <h3>Bu programdaki bağlantılar</h3>${tablo(['Bağlantı', 'Durum'], R.ent.map((e) => [e.title, ozetDurum(e)]))}
    ${parca}</section>` };
}

// ---------- Bölümler ----------
const KIS = { bas: { ad: 'Başlarken', ne: 'Programın ne işe yaradığı, ekranın bölümleri ve ilk kurulum sırası.' }, mod: { ad: 'Modüller', ne: 'Menüdeki her sayfa için ne işe yaradığı, adım adım kullanımı, alanların anlamı ve sık hatalar.' }, yon: { ad: 'Yönetim ve belgeler', ne: 'Kullanıcı yetkileri, müşterinin gördüğü sayfalar, yazdırma ve yedekleme.' }, ent: { ad: 'Entegrasyonlar', ne: 'Kendi hesabınızla bağlayacağınız servisler. Entegre et, bilgileri girin, Bağlantıyı dene.' }, des: { ad: 'Destek', ne: 'Sık sorulan sorular ve bize ulaşma yolları.' } };
function bolumler(K, R, X) {
  const nav = Object.fromEntries(R.navHepsi); const B = []; let no = 0; const yeni = (b) => { no++; B.push(typeof b === 'function' ? b(no) : b); };
  yeni((n) => ({ kisim: KIS.bas, capa: 'tanitim', baslik: `${X.urun.name} programını tanıyın`, html: `<section class="b" id="tanitim">${bolumBas(n, `${X.urun.name} programını tanıyın`, md(K.ne))}<h3>Kimler için</h3><p>${md(K.kimler)}</p>
    ${gorevHtml({ baslik: 'Ekranı tanıyın', sahneler: K.ekrantanitim })}
    <h3>İlk kurulum adımları</h3><p>Programı ilk açtığınızda şu sırayla ilerleyin. Yeni hesaplar örnek veriyle açılır. Ürünü tanıdıktan sonra örnekleri temizleyip kendi kayıtlarınızı girin.</p>
    <ol>${X.kurulum.map((s) => `<li><b>${esc(s.t)}.</b> ${esc(s.d)} <span style="color:#6b7280">(${esc(nav[s.go] || s.go)} sayfası)</span></li>`).join('')}</ol>${K.ilkNot ? `<div class="not">${md(K.ilkNot)}</div>` : ''}</section>` }));
  K.moduller.filter((m) => m.id !== 'entegrasyonlar').forEach((m) => { m.baslik = m.baslik || nav[m.id] || m.id; m.capa = `m-${m.id}`; yeni((n) => ({ kisim: KIS.mod, capa: m.capa, baslik: m.baslik, html: modulHtml(m, n) })); });
  yeni((n) => { const rol = Object.entries(R.roles); const mu = (N, r) => !N.roles || r === 'admin' || N.roles.includes(r);
    return { kisim: KIS.yon, capa: 'roller', baslik: 'Roller ve yetkiler', html: `<section class="b" id="roller">${bolumBas(n, 'Roller ve yetkiler', `Her kullanıcının bir rolü vardır. Rol, menüde hangi bölümlerin görüneceğini belirler. Kullanıcıları ${md('**Ayarlar**')} sayfasından eklersiniz. Yetkisiz kullanıcı o bölümü menüde görmez.`)}
    <table><thead><tr><th>Menü</th>${rol.map(([, ad]) => `<th>${esc(ad)}</th>`).join('')}</tr></thead><tbody>${R.nav.filter((N) => nav[N.id]).map((N) => `<tr><td>${esc(nav[N.id])}</td>${rol.map(([r]) => `<td>${mu(N, r) ? 'Görür' : '-'}</td>`).join('')}</tr>`).join('')}</tbody></table>${K.roller ? `<div class="not">${md(K.roller)}</div>` : ''}</section>` }; });
  yeni((n) => ({ kisim: KIS.yon, capa: 'musteri', baslik: 'Müşteriye açık sayfalar', html: `<section class="b" id="musteri">${bolumBas(n, 'Müşteriye açık sayfalar')}${(K.musteri || []).length ? (K.musteri).map((m) => `<h3>${esc(m.ad)}</h3><p>${md(m.ne)}</p>${m.sahneler ? gorevHtml({ baslik: 'Sayfanın görünümü', sahneler: m.sahneler }) : ''}${m.not ? `<div class="not">${md(m.not)}</div>` : ''}`).join('') : `<p>${md(K.musteriYok || 'Bu programda müşterinin kendisinin açtığı bir sayfa yoktur.')}</p>`}</section>` }));
  yeni((n) => ({ kisim: KIS.yon, capa: 'yazdirma', baslik: 'Yazdırma ve belge işlemleri', html: `<section class="b" id="yazdirma">${bolumBas(n, 'Yazdırma ve belge işlemleri', md(K.yazdirma.ne))}${tablo(['Belge', 'Nereden yazdırılır'], K.yazdirma.belgeler)}<div class="not">Yazdırma tarayıcının yazdırma penceresiyle yapılır. Bu pencereden yazıcıyı seçer veya belgeyi PDF olarak kaydedersiniz. Görünümü **Belge şablonları** sayfasından ayarlarsınız.</div></section>`.replace('**Belge şablonları**', '<b class="ad">Belge şablonları</b>') }));
  yeni((n) => ({ kisim: KIS.yon, capa: 'yedek', baslik: 'Yedekleme', html: `<section class="b" id="yedek">${bolumBas(n, 'Yedekleme', 'Verilerinizi düzenli olarak dosyaya alın. Yedek dosyası işletme verilerinizi içerir, güvenli bir yerde saklayın.')}<ol><li>${md('**Ayarlar** sayfasını açın.')}</li><li>${md('**Veri Yönetimi** kartında **Yedek al** düğmesine basın. JSON dosyası bilgisayarınıza iner.')}</li><li>${md('Dosyayı başka bir diske veya güvendiğiniz bir depolama alanına kopyalayın.')}</li></ol><h3>Yedekten geri dönme</h3><p>${md('**Yedekten yükle** seçilen dosyadaki veriyi programa yazar, mevcut verinin yerine geçer. Bu düğme bulut hesabında rolü sunucuda atanmış kullanıcılarda görünmez.')}</p><div class="uy">${md('**Demoyu sıfırla** tüm verileri siler ve örnek verileri yükler. Gerçek verilerle çalışırken bu düğmeyi kullanmayın, önce yedek alın.')}</div></section>` }));
  yeni((n) => ({ kisim: KIS.ent, ...entegrasyonBolum(K, R, n) }));
  yeni((n) => { const sss = [...(X.yardim ? X.yardim.sss : []), ...(X.urun.faq || []), ...(K.sss || [])].filter(([q]) => !(K.sssHaric || []).includes(q)); return { kisim: KIS.des, capa: 'sss', baslik: 'Sık sorulan sorular ve destek', html: `<section class="b" id="sss">${bolumBas(n, 'Sık sorulan sorular ve destek')}${sss.map(([q, a]) => `<h4>${esc(q)}</h4><p>${md(a)}</p>`).join('')}<h3>Destek</h3><p>Takıldığınız yerde programın sağ altındaki destek balonuna yazabilir veya bize ulaşabilirsiniz.</p><ul><li>Telefon: ${esc(X.CFG.phone)}</li><li>E-posta: ${esc(X.CFG.email)}</li><li>Yardım merkezi: <a href="${X.CFG.domain}/#/yardim/${X.id}">${X.CFG.domain.replace('https://', '')}/#/yardim/${X.id}</a></li></ul></section>` }; });
  return B;
}
module.exports = { ornekSec, belgeler, ebelge, entegrasyonlar, bildirimler, imzali, ayarlar, E, durum, entegrasyonHazirla, entegrasyonBolum, bolumler };
