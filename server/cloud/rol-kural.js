// Ekip hesabı rolleri: sunucuda alan ve koleksiyon filtresi. Saf işlevlerdir, veritabanına bağlı değildir (server/test/rol-kural.test.js).
// Hesabın rolü users.team_roles sütunundadır: {"klinik":"sekreter","ik":"sef","ik_dept":"Üretim"}. NULL veya programda kayıt yoksa tam yetki.
// Kural alanları (her alan isteğe bağlı):
//   gizle       { koleksiyon: ['alan'] }  okumada alan çıkarılır; yazmada kayıt id'siyle sunucudaki değer geri konur, yeni kayıtta boş kalır
//   kapat       ['koleksiyon']            okumada boş gider; yazmada sunucudaki hâli korunur
//   ekle        ['koleksiyon']            okumada boş gider; yazmada yalnızca yeni id'li kayıt eklenir (var olan değişmez, silinmez)
//   saltOkunur  ['koleksiyon']            okunur; yazmada sunucudaki hâli korunur
//   izinli      { koleksiyon: ['alan'] }  saltOkunur koleksiyonda rolün yine de yazabildiği alanlar
//   silemez     ['koleksiyon']            yazmada eksik gelen kayıt sunucudaki hâliyle geri konur
//   kapsam      { kok, alan, bagli, bosSerbest, anahtar }  yalnızca hesabın departmanına ait kayıtlar: kok koleksiyonu alan=departman; bagli koleksiyonda kişiye
//               bağlı alan (bosSerbest'teki koleksiyonda kişisi boş kayıt açıktır: elle adı yazılmış belge); anahtar koleksiyonda "<kişi>|<tarih>" biçimli anahtar.
//               Departmanı olmayan hesap kimseyi görmez (arayüz davranışı).
//   onayli      { koleksiyon: { alan: 'işlem' } }  var olan kayıtta o işlem türünün yetkili onayı (NS.approve) belirteci olmadan değişmez: sunucudaki değer geri konur, ek.reddedilen'e yazılır
//   onayAdim    (o, s, onayla, b) => void  alan kuralına sığmayan koşul (yeni kayıt, indirim oranı, hak aşımı). onayla(işlem, koleksiyon): belirteç varsa true, yoksa false + reddedilen. Geri alma kuralın işidir.
//   onayTurleri ['işlem']                 onayAdim'in kullandığı işlem türleri (belirteç yalnızca bilinen türe verilir)
//   onayToplu   ['işlem']                 bir belirteç tek PUT'taki tüm satırları açar (toplu fiyat aktarımı gibi); varsayılan tek kayıt
//   onayGeri    { işlem: ['koleksiyon'] }  o işlem reddedilirse bu koleksiyonlar da sunucudaki hâline döner (iptalin stok ve kasa etkisi gibi)
//   onayRol     ['rol']                   belirteci alabilecek program kullanıcıları (varsayılan yalnızca admin); istemcinin bildirdiği rol dikkate alınmaz
//   satir       { koleksiyon: (kayıt, b) => bool }  yalnızca dönen satırlar gider; gizli satır yazmada aynen korunur, id'si taklit edilemez. Görünen satır ve yeni kayıt serbesttir.
//               b: { dept, ad, ids(c), alanlar(c, a), kume(c, f) }: dept seçilen kişi veya departman, ad bağlı kişinin adı, ids o koleksiyonun bu hesaba görünen id'leri, alanlar görünen kayıtların a alanı, kume belgedeki f'e uyan kayıtların id'leri (tek çağrıda saklanır).
//               saltOkunur koleksiyonda izinli alanlar yalnızca görünen satırda yazılır.
//   kisi        { kol, alan, suz, baslik, yok, kayitAdi }  hesabı programdaki bir kişiye bağlar (kol koleksiyonundan seçilir, seçim users.team_roles içinde "<app>_dept"te durur).
//               Tarayıcıda NS.currentUser.id (alan yoksa) veya NS.currentUser[alan] bu kişi, name onun adı olur (kol bir kişi değilse kayitAdi: false ile hesabın adı kalır); programın "yalnız kendi kayıtlarım" süzgeci böyle çalışır.
//   ayarIzinli  ['anahtar']               _settings içinde rolün yazabildiği anahtarlar (rolün ekranı doğrudan ayar yazıyorsa); kalanı değişmez
//   yeniSerbest ['koleksiyon']            saltOkunur koleksiyonda rol yeni kayıt açabilir, var olana dokunamaz
//   yeniYazar   ['koleksiyon']            gizle alanları rolün açtığı yeni kayıtta silinmez (takas aracının alış değeri gibi)
//   numara      { koleksiyon: 'alan' }    satır filtresi yüzünden sıra numarası çakışan yeni kayıt, sunucudaki en büyük numaranın devamını alır
//   suz         (gorunum, b) => void      alan silmenin yetmediği görünüm düzeltmesi (iç içe alan, satıra göre alan). Girdiyi değiştirmez, kopya yazar.
//   sonra       (sonuc, sunucudaki, b) => void  programa özel tutarlılık adımı
// Her kuralda ek olarak: users[].pin gizlenir ve users korunur, _meta.ownerPin gizlenir, _settings değişmez, işlem geçmişi (_log) okunmaz ve yalnızca eklenir.
// Yeni program için RULES'e kayıt eklemek yeterlidir; diğer programların rolleri yalnızca arayüzdedir.
// Dikkat: gizle/kapat yazılmadan önce rolün ekranı o alandan hesap yapıp kaydediyor mu bakılır. Örnek: POS satırı ürünün alış fiyatını kopyalar, toptan sevkiyatı cari bakiyeyi artırır,
// kuyumcu tezgâhtarı kuru _settings'e yazar. Kaydetmeye giren alan gizlenecekse sonra, izinli veya ayarIzinli ile sunucu tarafı tamamlanır.
const eslesir = (r, a, b) => !!b.dept && r[a] === b.dept;
const sadeMusteri = (o) => { if (Array.isArray(o.customers)) o.customers = o.customers.map((c) => (nesne(c) ? { id: c.id, name: c.name } : c)); };
// Belge satırlarından fiyat alanlarını çıkarır (lines dizili kayıtlar)
const satirSil = (o, c, ...alanlar) => { if (Array.isArray(o[c])) o[c] = o[c].map((r) => (nesne(r) && Array.isArray(r.lines) ? { ...r, lines: r.lines.map((l) => { if (!nesne(l)) return l; const n = { ...l }; alanlar.forEach((a) => delete n[a]); return n; }) } : r)); };
// Fabrika operatörü maliyeti görmez. Tüketim ve üretim hareketinin maliyeti arayüzdeki hesapla (apps/fabrika: unitCost, reportModal) sunucuda yazılır.
function fabrikaMaliyet(o, s) {
  const M = idHarita(s.materials), T = idHarita(s.stations), BI = idHarita(s.boms), B = new Map(); dizi(s.boms).forEach((b) => { if (nesne(b) && b.active && !B.has(b.mat)) B.set(b.mat, b); });
  const r2 = (n) => Math.round(n * 100) / 100; const top = (l, f) => dizi(l).reduce((t, x) => t + (Number(f(x)) || 0), 0); const cph = (id) => Number((T.get(id) || {}).cph) || 0;
  const mc = (b, d) => top(b.lines, (l) => l.qty * (1 + (l.scrap || 0) / 100) * birim(l.mat, d)) / (b.base || 1); const oc = (b) => top(b.ops, (x) => ((x.run || 0) / (b.base || 1)) * (cph(x.station) / 60));
  function birim(id, d = 0) { const b = B.get(id); if (!b || d > 6) return Number((M.get(id) || {}).cost) || 0; return r2(mc(b, d + 1) + oc(b)); }
  const eskiW = idHarita(s.wo), eskiH = idHarita(s.moves), W = idHarita(o.wo);
  dizi(o.wo).forEach((w) => {
    const e = nesne(w) ? eskiW.get(w.id) : null; if (!e) return; const eski = dizi(e.issued), n = eski.length; if (Array.isArray(w.issued)) w.issued = w.issued.map((i, x) => { if (x < n) return eski[x]; if (!nesne(i)) return i; const k = i.ret ? eski.find((y) => y.lot === i.lot && y.mat === i.mat) : null; return { ...i, cost: k && k.cost != null ? k.cost : birim(i.mat) }; });
  });
  if (Array.isArray(o.moves)) o.moves = o.moves.map((m) => {
    if (!nesne(m) || eskiH.has(m.id)) return m; const w = W.get(m.ref); const v = { ...m };
    if (m.type === 'uretim' && w) { const b = BI.get(w.bom) || B.get(w.mat); const madde = top(w.issued, (i) => i.qty * (i.cost || 0)); const tot = w.produced || 0; const bm = b ? mc(b, 1) : 0; const std = !(tot > 0) || madde / tot < bm * 0.9; v.cost = std ? birim(w.mat) : r2(madde / Math.max(tot, bm > 0 ? Math.min(madde / bm, w.qty) : tot) + (b ? oc(b) : 0)); if (std && Array.isArray(w.reports)) w.reports = w.reports.map((r) => (nesne(r) && r.lot === m.lot ? { ...r, costStd: true } : r)); } else { const i = w ? dizi(w.issued).find((x) => nesne(x) && x.lot === m.lot && x.mat === m.mat) : null; v.cost = i && i.cost != null ? i.cost : birim(m.mat); }
    return v;
  });
}
// Danışan: kilitli seans notu değişmez ve silinmez. Ek yazmak serbesttir (adds)
const notKilit = (o, s) => { if (!Array.isArray(o.notes)) return; const yeni = idHarita(o.notes); const kilit = dizi(s.notes).filter((n) => nesne(n) && n.locked); o.notes = o.notes.map((n) => { const e = nesne(n) ? kilit.find((k) => k.id === n.id) : null; return e ? { ...e, adds: dizi(n.adds) } : n; }); kilit.forEach((k) => { if (!yeni.has(k.id)) o.notes.push(k); }); };
// Süresi geçmiş bilet iadesi: arayüzdeki gün farkı ile saat farkı yüzünden doğru işlem reddedilmesin diye bir gün pay bırakılır
const biletGec = (t, s) => { const e = idHarita(s.events).get(t.event); const g = Number((nesne(s._settings) ? s._settings : {}).refundDays) || 0; return !!e && !!e.date && (new Date(e.date) - Date.now()) / 864e5 < g - 1; };
const emlakYabanci = (r, b) => !eslesir(r, 'agent', b);
// Reddedilen POS iadesi kayda geçmez: iadenin artırdığı stok geri düşer
const posIadeGeri = (o, r) => { if (!Array.isArray(o.products)) return; const m = new Map(); dizi(r.items).forEach((i) => { if (nesne(i) && i.pid) m.set(i.pid, (m.get(i.pid) || 0) + (Number(i.qty) || 0)); }); o.products = o.products.map((p) => (nesne(p) && m.has(p.id) ? { ...p, stock: (Number(p.stock) || 0) - m.get(p.id) } : p)); };
const bordro = () => { try { return require('../../apps/ik/bordro.js'); } catch (e) { return null; } };
const RULES = {
  // apps/klinik/app.js: clinical() sekreterde kapalı (anamnez, muayene notu, tanı, reçete, e-Nabız). Yönetim menüsü (hakediş, tedavi listesi, hekimler, raporlar) yöneticide.
  // Hasta silme yöneticide (canDelete). Telefon, TC, kan grubu, Not alanı, tedavi planı, ödeme, randevu nedeni sekreterin ekranlarında kullanılır, açık kalır.
  klinik: { sekreter: { ad: 'Sekreter', gizle: { patients: ['anamnez', 'meds'], doctors: ['rate'] }, kapat: ['visits', 'prescriptions'], saltOkunur: ['doctors', 'treatments'], silemez: ['patients'] } },
  // apps/eczane/app.js: Kurum Mutabakatı ve Kontrole Tabi Defter yalnızca eczacıda; hasta silme eczacıda.
  // Kalfanın satışı deftere kayıt ekler (ctrl), bu yüzden defter "ekle" kuralındadır. Eczacı PIN'iyle onaylanan iade defterde "iade" olarak işaretlenir (sonra).
  // Alerji, kronik ilaç, TC ve satış geçmişi satış ekranında gerekir, açık kalır.
  // İade (sales.canceled) ve fiyat (drugs.price) ekranda eczacı PIN'i ister; onayli bu kuralı sunucuda da zorlar. Satış kaydı silinemez: iade silerek taklit edilemesin.
  eczane: { kalfa: { ad: 'Kalfa / teknisyen', kapat: ['claims'], ekle: ['ctrl'], silemez: ['patients', 'sales'], onayli: { sales: { canceled: 'iade' }, drugs: { price: 'fiyat' } }, onayToplu: ['fiyat'], sonra: (o) => { const iptal = new Set(dizi(o.sales).filter((s) => s && s.canceled).map((s) => s.no)); if (iptal.size && Array.isArray(o.ctrl)) o.ctrl = o.ctrl.map((c) => (c && iptal.has(c.saleNo) && !c.canceled ? { ...c, canceled: true } : c)); } } },
  // apps/veteriner/app.js: canAct → "muayene, aşı ve tedavi kaydı hekimindir; asistan görür, onam alır, satış yapar". Asistan muayene ve aşıyı görür, gizlenecek alan yoktur;
  // kayıtları değiştiremez. Aşı hatırlatma SMS'i asistana açık olduğu için hatırlatma işareti yazılabilir. Sahip silme yöneticide; hayvan silme ekranı yoktur.
  veteriner: { asistan: { ad: 'Asistan', saltOkunur: ['visits', 'vaccines'], izinli: { vaccines: ['reminded', 'remindTest'] }, silemez: ['owners', 'pets'] } },
  // apps/ik/app.js: şef yalnızca kendi departmanını görür (inScope), personel ekranı salt okunur, maaş sütunu ve TC araması kapalı; Bordro ve Belge & Zimmet yöneticide.
  // Telefon (vardiya ve izin SMS'i), doğum tarihi (doğum günü kartı, izin hakkı) ve izin hakkı alanları şefin ekranlarında gerekir, açık kalır.
  // Kapalı dönem bilgisi puantajı kilitlediği için payClosed görünür, maaş satırları (rows) gizlidir.
  // Hak aşımı onayı: izin onayı puantaja "I" işareti yazar. Yeni işaret sayısı kalan haktan fazlaysa belirteç ister; hak, arayüzle aynı bordro hesabıyla sunucudaki puantajdan bulunur.
  ik: { sef: { ad: 'Departman şefi', gizle: { employees: ['salary', 'salaryType', 'tc', 'iban', 'portalCode', 'exit'], payClosed: ['rows'] }, kapat: ['advances', 'files'], ekle: ['sms'], saltOkunur: ['employees', 'payClosed'], kapsam: { kok: 'employees', alan: 'dept', bagli: { leaves: 'emp', signedDocs: 'party' }, bosSerbest: ['signedDocs'], anahtar: ['ts', 'roster'] }, onayTurleri: ['hak-asimi'],
    onayAdim: (o, s, onayla) => {
      if (!nesne(o.ts) || !nesne(s.ts)) return; const say = (ts) => { const m = {}; let ilk = null; for (const [a, v] of Object.entries(ts)) { const [e, d] = [kisiAnahtar(a), a.slice(a.indexOf('|') + 1)]; if (!ilk || d < ilk) ilk = d; if (nesne(v) && v.s === 'I') m[e] = (m[e] || 0) + 1; } return { m, ilk }; };
      const once = say(s.ts), sonra = say(o.ts); const bugun = new Date().toISOString().slice(0, 10); const P = idHarita(s.employees);
      for (const [emp, n] of Object.entries(sonra.m)) {
        const yeni = n - (once.m[emp] || 0); const e = P.get(emp); if (!(yeni > 0) || !e) continue;
        const B = bordro(); const kalan = B ? B.leaveBalance(e, { asOf: bugun, used: once.m[emp] || 0, trackFrom: once.ilk || bugun }).left : null; if (kalan == null || yeni <= kalan || onayla('hak-asimi', 'leaves')) continue;
        for (const a of Object.keys(o.ts)) if (kisiAnahtar(a) === emp && nesne(o.ts[a]) && o.ts[a].s === 'I' && !(nesne(s.ts[a]) && s.ts[a].s === 'I')) { if (a in s.ts) o.ts[a] = s.ts[a]; else delete o.ts[a]; }
        const L = idHarita(s.leaves); if (Array.isArray(o.leaves)) o.leaves = o.leaves.map((l) => (nesne(l) && l.emp === emp && l.status === 'onay' && L.has(l.id) && L.get(l.id).status !== 'onay' ? L.get(l.id) : l));
      }
    } } },
  // apps/muhasebe/app.js: FIN/SAT/DEP. Satış; kasa, çek, tekrarlayan fatura, rapor ekranlarını görmez, fatura silemez (act=del). Cari ekstresi ve tahsilat için carili hareketler (txns) ve hesap adları gerekir;
  // cariye bağlı olmayan kasa hareketi (maaş, kira, virman) gitmez. Depo; irsaliye ve stok görür, irsaliyeden fatura açabilir (invoiceFromDispatches), bu yüzden faturalar "ekle"dir.
  // "muhasebe" rolü Ayarlar dışında her şeyi gördüğü için kural eklenmedi.
  muhasebe: {
    satis: { ad: 'Satış (teklif, sipariş, satış faturası, cari)', kapat: ['cheques', 'recurring'], saltOkunur: ['accounts', 'branches', 'projects'], satir: { txns: (t) => !!t.cari }, silemez: ['invoices'] },
    depo: { ad: 'Depo (stok, irsaliye)', kapat: ['txns', 'cheques', 'recurring', 'quotes', 'recons', 'accounts'], ekle: ['invoices'], saltOkunur: ['caris', 'branches', 'projects'] },
  },
  // apps/hukuk/app.js: mine() avukatı kendi dosyalarına süzer (lawyer alanı avukatın adıdır); ajanda, süre ve mesaj dosyaya bağlıdır. Dosyası gizlenen müvekkil ekranda "dosyasız" göründüğü için silinemez.
  // Masraf, avans, tahsilat, zaman kaydı ve görevlerde arayüz süzgeci yoktur (müvekkil bakiyesi hepsinden hesaplanır), açık kalır. Sekreterde yalnız menü farkı vardır, kural eklenmedi.
  hukuk: { avukat: { ad: 'Avukat', kisi: { kol: 'users', suz: (u) => !!u.lawyer, baslik: 'Avukat', yok: 'Avukat seçin (seçilmezse dosya görünmez)' },
    satir: { files: (f, b) => !!b.ad && f.lawyer === b.ad, hearings: (h, b) => b.ids('files').has(h.file), deadlines: (d, b) => b.ids('files').has(d.file), messages: (m, b) => b.alanlar('files', 'client').has(m.client) }, silemez: ['clients'], numara: { files: 'no' } } },
  // apps/musavir/app.js: fin() personelde kapalı; Ücret & Tahsilat ve Raporlar yöneticide. Silme denetimi ücret kaydına baktığı için mükellef silinemez olur.
  musavir: { personel: { ad: 'Büro personeli', kapat: ['fees', 'payments'], gizle: { clients: ['fee'] }, silemez: ['clients'] } },
  // apps/crm/app.js: mine() temsilciyi kendi fırsatlarına süzer; teklif fırsata, etkinlik fırsata veya sahibine bağlıdır. Firma silme ve toplu aktarım temsilcide kapalı. owner program kullanıcısının id'sidir.
  crm: { temsilci: { ad: 'Satış temsilcisi', kisi: { kol: 'users', suz: (u) => u.role === 'temsilci', baslik: 'Temsilci', yok: 'Temsilci seçin (seçilmezse fırsat görünmez)' },
    satir: { deals: (d, b) => eslesir(d, 'owner', b), quotes: (q, b) => b.ids('deals').has(q.deal), activities: (a, b) => eslesir(a, 'owner', b) || b.ids('deals').has(a.deal) }, silemez: ['companies'] } },
  // apps/toptan/app.js: myRep() plasiyeri kendi carilerine, siparişine, iadesine süzer; maliyet yalnızca ürünler ve raporlar ekranında. Plasiyerin iadesi stok yazar (izinli), sipariş numarası görünen siparişten sayılır (numara).
  // Depo sevkiyatı cari bakiyesini artırdığı için customers depoda açık ve yazılır kalır (gizlenirse bakiye bozulur). Ofiste yalnız menü farkı vardır, kural eklenmedi.
  toptan: {
    plasiyer: { ad: 'Plasiyer (saha)', kisi: { kol: 'reps', alan: 'rep', baslik: 'Plasiyer', yok: 'Plasiyer seçin (seçilmezse cari görünmez)' }, gizle: { products: ['cost'] }, saltOkunur: ['products', 'promos', 'reps'], izinli: { products: ['stock'] },
      satir: { customers: (c, b) => eslesir(c, 'rep', b), orders: (o, b) => eslesir(o, 'rep', b), returns: (r, b) => eslesir(r, 'rep', b), visits: (v, b) => eslesir(v, 'rep', b), dayends: (d, b) => eslesir(d, 'rep', b), payments: (p, b) => eslesir(p, 'rep', b) || b.ids('customers').has(p.customer) }, silemez: ['customers'], numara: { orders: 'no', returns: 'no' } },
    depo: { ad: 'Depo / sevkiyat', kapat: ['payments', 'dayends', 'visits'], saltOkunur: ['promos', 'reps'] },
  },
  // apps/otoservis/app.js: myTech() teknisyeni kendi iş emirlerine süzer, canPrice fiyatı kapatır. Teslim düğmesi teknisyende açıktır, bu yüzden tahsilat "ekle" ve customers yazılır (bakiye).
  // Parçanın alış fiyatı gizlendiği için iş emrine eklenen parçanın maliyeti sunucuda tamamlanır. Danışmanda yalnız menü farkı vardır, kural eklenmedi.
  otoservis: { teknisyen: { ad: 'Teknisyen', kisi: { kol: 'techs', alan: 'tech', baslik: 'Teknisyen', yok: 'Teknisyen seçin (seçilmezse iş emri görünmez)' }, satir: { jobs: (j, b) => eslesir(j, 'tech', b) }, gizle: { parts: ['cost'] }, saltOkunur: ['parts', 'labors', 'packs', 'techs'], izinli: { parts: ['stock'] }, ekle: ['payments'],
    sonra: (o, s) => { const m = idHarita(s.parts); dizi(o.jobs).forEach((j) => { if (nesne(j)) dizi(j.items).forEach((i) => { if (nesne(i) && i.pid && i.cost == null && m.has(i.pid)) i.cost = m.get(i.pid).cost; }); }); } } },
  // apps/pos/app.js: kasiyer ürün, stok, alış, tedarikçi, kampanya, rapor, ayar ekranlarını görmez; satış ekranında barkodu kayıtsız ürünü tanımlayabilir (quickCreate → yeniSerbest).
  // Satış satırı ürünün alış fiyatını kopyalar (kâr raporu buna bakar): alış fiyatı kasiyere gitmez, yeni satışın satırlarına sunucuda yazılır; eski satışın kalemleri değiştirilemez. Depo sorumlusunda yalnız menü farkı vardır, kural eklenmedi.
  // Yetkili onayı: iade yeni satış kaydıdır (type return): belirteçsiz kayda geçmez, stok geri düşer. İndirim yapılmış satış gerçekleşmiş sayılır, para alınmıştır: kayıt silinmez, onaysiz işaretlenir ve denetime yazılır.
  // Kontrol edilen: satır indirimi (cashierDiscMax üstü) ve ürün fiyatının altına inen birim fiyat. Genel indirim kampanya ve kuponla aynı alanda toplandığı için sunucuda ayrılamaz (arayüz PIN ister).
  pos: { kasiyer: { ad: 'Kasiyer', kapat: ['suppliers', 'purchases', 'priceLog', 'counts'], gizle: { products: ['buy'] }, saltOkunur: ['products', 'cats', 'campaigns'], izinli: { products: ['stock'] }, yeniSerbest: ['products'], silemez: ['sales'], onayTurleri: ['iade', 'indirim'],
    onayAdim: (o, s, onayla) => {
      if (!Array.isArray(o.sales)) return; const eski = idHarita(s.sales), P = idHarita(s.products); const lim = Number((nesne(s._settings) ? s._settings : {}).cashierDiscMax) || 0;
      o.sales = o.sales.flatMap((x) => {
        if (!nesne(x) || eski.has(x.id)) return [x];
        if (x.type === 'return') { if (onayla('iade', 'sales')) return [x]; posIadeGeri(o, x); return []; }
        const fazla = dizi(x.items).some((i) => nesne(i) && ((Number(i.disc) || 0) > lim || (i.pid && P.has(i.pid) && Number(i.price) < Number(P.get(i.pid).price)))); if (!fazla || onayla('indirim', 'sales')) return [x];
        return [{ ...x, onaysiz: ['indirim'] }];
      });
    },
    suz: (o) => { const kes = (l) => { if (!nesne(l)) return l; const { buy, ...r } = l; return r; }; if (Array.isArray(o.sales)) o.sales = o.sales.map((x) => (nesne(x) && Array.isArray(x.items) ? { ...x, items: x.items.map(kes) } : x)); if (Array.isArray(o.held)) o.held = o.held.map((h) => (nesne(h) && nesne(h.cart) && Array.isArray(h.cart.lines) ? { ...h, cart: { ...h.cart, lines: h.cart.lines.map(kes) } } : h)); },
    sonra: (o, s) => { if (!Array.isArray(o.sales)) return; const eski = idHarita(s.sales); const m = idHarita(s.products); o.sales = o.sales.map((x) => { if (!nesne(x)) return x; const e = eski.get(x.id); if (e) return { ...x, items: e.items }; return { ...x, items: dizi(x.items).map((i) => (nesne(i) ? { ...i, buy: i.pid && m.has(i.pid) ? m.get(i.pid).buy : i.buy } : i)) }; }); } } },
  // apps/adisyon/app.js: menü, reçete, malzeme stoku, raporlar yöneticide. Sipariş gönderme malzeme stoğunu düşer (izinli), maliyet gizli; paket ve QR ekranı ayar yazar (ayarIzinli).
  // Mutfak yalnızca kalem durumunu değiştirir (checks.items); ödeme bilgisi gitmez. Kapalı adisyonlar masa ekranında sayıldığı için garsonda açık kalır.
  adisyon: {
    // Mutfağa gitmiş kalemin iptali, ikramı, adet azaltması yönetici veya kasiyer PIN'i ister. Belirteçsiz değişiklikte kalem sunucudaki hâline döner, silinen gönderilmiş kalem geri gelir.
    garson: { ad: 'Garson', kapat: ['platLog', 'platReviews'], gizle: { ingredients: ['cost'] }, saltOkunur: ['menu', 'mcats', 'ingredients'], izinli: { ingredients: ['stock'] }, ayarIzinli: ['platformPull', 'qrOrder'], onayRol: ['admin', 'kasa'], onayTurleri: ['iptal', 'ikram', 'adet'],
      onayAdim: (o, s, onayla) => {
        if (!Array.isArray(o.checks)) return; const eski = idHarita(s.checks); const gitti = (i) => !!i && !!i.status && i.status !== 'new';
        o.checks = o.checks.map((c) => {
          const e = nesne(c) ? eski.get(c.id) : null; if (!e) return c; const eS = idHarita(e.items); const yeni = dizi(c.items).map((i) => {
            const y = nesne(i) ? eS.get(i.id) : null; if (!y || !gitti(y)) return i; const tur = i.cancel && !y.cancel ? 'iptal' : i.comp && !y.comp ? 'ikram' : Number(i.qty) < Number(y.qty) ? 'adet' : ''; return !tur || onayla(tur, 'checks') ? i : y; });
          const var_ = new Set(yeni.map((i) => i && i.id)); const silinen = dizi(e.items).filter((i) => nesne(i) && gitti(i) && !var_.has(i.id) && !onayla('iptal', 'checks'));
          return { ...c, items: [...yeni, ...silinen] };
        });
      } },
    kasa: { ad: 'Kasiyer', gizle: { ingredients: ['cost'] }, saltOkunur: ['menu', 'mcats', 'ingredients'], izinli: { ingredients: ['stock'] }, ayarIzinli: ['platformPull'] },
    mutfak: { ad: 'Mutfak', kapat: ['reservations', 'calls', 'areas', 'couriers', 'ingredients', 'platLog', 'platReviews'], gizle: { checks: ['payments', 'discount', 'tip', 'total'] }, saltOkunur: ['menu', 'mcats', 'tables', 'checks'], izinli: { checks: ['items'] } },
  },
  // apps/kuyumcu/app.js: Toptancı ekranı ve raporlar sahibinde. Tezgâhtar yetkili PIN'iyle kur girer, kur _settings'e yazılır (ayarIzinli). Stok formundaki tedarikçi öneri listesi boş kalır, alan serbest metindir.
  // Yetkili onayı: kur değişikliği her zaman, işlem iptali (tx.canceled) her zaman, indirim discMax üstünde. İptal reddedilirse iptalin stok, sikke, kasa ve cari etkisi de sunucudaki hâline döner.
  // Reddedilen kurda arayüz ayarları sunucudaki değere döner. İndirimli satış gerçekleşmiştir: silinmez, onaysiz işaretlenir ve denetime yazılır.
  kuyumcu: { tezgah: { ad: 'Tezgâhtar', kapat: ['suppliers', 'supMoves'], ayarIzinli: ['hasBuy', 'hasSell', 'usd', 'eur', 'coinBuyCut', 'coinSellAdd', 'scrapCut', 'laborDefault', 'rateSource', 'rateAt', 'fxSource'], onayli: { tx: { canceled: 'iptal' } }, onayGeri: { iptal: ['items', 'coins', 'cash', 'cashLog', 'customers', 'orders'], kur: ['rateLog'] }, onayTurleri: ['kur', 'indirim'],
    onayAdim: (o, s, onayla) => {
      const a = nesne(o._settings) ? o._settings : {}, e = nesne(s._settings) ? s._settings : {}; const lim = Number(e.discMax); const sinir = Number.isFinite(lim) ? lim : 5;
      if (['hasBuy', 'hasSell'].some((f) => a[f] !== e[f]) && !onayla('kur', '_settings')) o._settings = e;
      if (!Array.isArray(o.tx)) return; const eski = idHarita(s.tx);
      o.tx = o.tx.map((t) => { if (!nesne(t) || eski.has(t.id) || !(Number(t.disc) > 0)) return t; const brut = dizi(t.lines).reduce((x, l) => x + (nesne(l) ? Number(l.price) || 0 : 0), 0); return !(Number(t.disc) > (brut * sinir) / 100) || onayla('indirim', 'tx') ? t : { ...t, onaysiz: ['indirim'] }; });
    } } },
  // apps/otel/app.js: kat görevlisi yalnızca Odalar ekranını görür (isKat). Misafir kimliği ve fiyat gitmez; oda çakışması için rezervasyonun tarihi ve odası gerekir. assignee program kullanıcısının id'sidir (kisi).
  // Resepsiyonda yalnız menü farkı vardır, kural eklenmedi.
  otel: { kat: { ad: 'Kat Hizmetleri', kisi: { kol: 'users', suz: (u) => u.role === 'kat', baslik: 'Kat görevlisi', yok: 'Kat görevlisi seçin' }, kapat: ['guests', 'seasons', 'extras'], gizle: { reservations: ['price', 'deposit', 'folio', 'ota', 'source'] }, saltOkunur: ['reservations', 'types'] } },
  // apps/randevu/app.js: myStaff() personeli kendi randevularına süzer. Prim oranı yalnızca Personel ve Raporlar ekranında. Randevu kapatma paket seansı düşer ve SMS atar: packages yazılır, sms "ekle".
  // Resepsiyon Hatırlatma ekranından şablon ve hatırlatma ayarı yazar (ayarIzinli).
  randevu: {
    resepsiyon: { ad: 'Resepsiyon', gizle: { staff: ['commission'] }, saltOkunur: ['staff', 'services'], ayarIzinli: ['winbackText', 'smsTemplate', 'reminderHours', 'autoRemind'] },
    personel: { ad: 'Personel', kisi: { kol: 'staff', alan: 'staff', baslik: 'Personel', yok: 'Personel seçin (seçilmezse randevu görünmez)' }, kapat: ['expenses'], ekle: ['sms'], gizle: { staff: ['commission'] }, saltOkunur: ['staff', 'services'], satir: { appointments: (a, b) => eslesir(a, 'staff', b) } },
  },
  // apps/kurs/app.js: fin() öğretmende kapalı: taksit, ücret, borç. Öğrenci kaydı düğmesi öğretmende de açıktır, bu yüzden yeni kaydın ücreti korunur (yeniYazar) ve tahsilat "ekle"dir. Ders programı ekranı rol denetlemez, lessons yazılır.
  // Öğretmen ders ücreti Öğretmenler ekranında (yönetici). Sınıf ücreti (classes.fee) yeni kayıt formunda kullanılır, açık kalır.
  kurs: {
    ogretmen: { ad: 'Öğretmen', kisi: { kol: 'teachers', alan: 'teacher', baslik: 'Öğretmen', yok: 'Öğretmen seçin' }, kapat: ['leads'], ekle: ['payments'], gizle: { students: ['fee', 'installments'], teachers: ['rate'] }, saltOkunur: ['teachers', 'classes'], silemez: ['students'], yeniYazar: ['students'],
      suz: (o) => { if (Array.isArray(o.students)) o.students = o.students.map((s) => (nesne(s) ? { ...s, installments: [] } : s)); } },
    kayit: { ad: 'Kayıt / Muhasebe', gizle: { teachers: ['rate'] }, saltOkunur: ['teachers', 'classes'] },
  },
  // apps/anaokulu/app.js: myCls() öğretmeni kendi sınıfına süzer, fin() ücret ve bakiyeyi kapatır. Yoklama ve günlük rapor "<öğrenci>|<tarih>" anahtarlıdır. Muhasebe yalnızca Öğrenciler ve Aidat ekranını görür: sağlık olayı, ilaç, rapor, yoklama, mesaj gitmez.
  // Muhasebenin öğrenci formunda alerji alanı vardır (arayüz gösterir), açık kalır.
  anaokulu: {
    ogretmen: { ad: 'Öğretmen', kisi: { kol: 'classes', alan: 'cls', kayitAdi: false, baslik: 'Sınıf', yok: 'Sınıf seçin (seçilmezse öğrenci görünmez)' }, kapat: ['fees', 'payments'], saltOkunur: ['classes'], silemez: ['students'], satir: { students: (s, b) => eslesir(s, 'cls', b) },
      kapsam: { kok: 'students', alan: 'cls', bagli: { incidents: 'student', meds: 'student', messages: 'student' }, anahtar: ['att', 'reports'] } },
    muhasebe: { ad: 'Muhasebe', kapat: ['reports', 'att', 'messages', 'incidents', 'meds', 'posts', 'menu'] },
  },
  // apps/site/app.js: fin() görevlide kapalı: aidat, gider, proje, sayaç, kurul ve daire borcu yok. Silme denetimi borca baktığı için daire silinemez. Muhasebede yalnız Ayarlar kapalıdır, kural eklenmedi.
  site: { gorevli: { ad: 'Görevli', kapat: ['dues', 'receipts', 'expenses', 'plans', 'meters', 'meetings'], gizle: { flats: ['credit'] }, silemez: ['flats'] } },
  // apps/galeri/app.js: seeCost() alış, masraf, kâr ve konsinye ödemesini danışmandan gizler. Danışman takasla araç açabilir, alış değeri yeni kayıtta korunur.
  galeri: { satis: { ad: 'Satış danışmanı', gizle: { vehicles: ['buy', 'expenses', 'ownerPays'] }, yeniYazar: ['vehicles'], silemez: ['vehicles'] } },
  // apps/eticaret/app.js: isAdm() maliyet alanını, ürün silmeyi, iptal ve iade kararını depodan alır; kupon, kategori ve sepet ekranları yöneticide.
  eticaret: { depo: { ad: 'Depo / sevkiyat', kapat: ['carts'], gizle: { products: ['cost'] }, saltOkunur: ['coupons', 'cats'], silemez: ['products'] } },
  // apps/fabrika: OFIS rollerinin ortak ekranları (kontrol paneli OEE'si, stok değeri, malzeme kartı) wo, downtime, moves.cost ve materials.cost kullanır, açık kalır. İzlenebilirlik sevkiyat ve müşteri adı gösterir: müşteri kartı adla sınırlanır.
  // Bakım (maint, plans) ve genel gider (overheads) yalnızca bakım ve maliyet ekranlarında. Teklif (offers) satınalmada. Mal kabul malzemenin ortalama maliyetini yazar (izinli). Operatör yalnızca kendi ekranını görür: ticari koleksiyon gitmez, maliyet gitmez, tüm yazma alan bazlıdır.
  fabrika: {
    satinalma: { ad: 'Satınalma', kapat: ['overheads', 'plans', 'maint'], saltOkunur: ['customers', 'so', 'shipments', 'boms', 'stations', 'wo'], yeniSerbest: ['wo'], suz: (o) => { sadeMusteri(o); satirSil(o, 'so', 'price'); } },
    depo: { ad: 'Depo / Lojistik', kapat: ['overheads', 'plans', 'maint', 'offers'], ekle: ['prq'], saltOkunur: ['customers', 'boms', 'stations', 'suppliers'] },
    kalite: { ad: 'Kalite Kontrol', kapat: ['so', 'offers', 'prq', 'overheads', 'plans', 'maint'], saltOkunur: ['customers', 'shipments', 'boms', 'stations', 'wo', 'fason', 'materials'], izinli: { materials: ['cost'] }, suz: sadeMusteri },
    uretim: { ad: 'Üretim Planlama', kapat: ['offers', 'returns'], ekle: ['prq'], saltOkunur: ['customers', 'so', 'shipments', 'suppliers', 'po', 'receipts'], izinli: { so: ['woDone'] }, yeniSerbest: ['po'], suz: (o) => { sadeMusteri(o); satirSil(o, 'so', 'price'); satirSil(o, 'po', 'price', 'vat'); satirSil(o, 'receipts', 'price'); } },
    operator: { ad: 'Operatör', kapat: ['customers', 'so', 'shipments', 'suppliers', 'po', 'prq', 'offers', 'receipts', 'returns', 'fason', 'overheads', 'plans'], ekle: ['maint', 'downtime'], gizle: { materials: ['cost', 'price', 'supplier'], stations: ['cph'], moves: ['cost'], lots: ['supplier', 'supLot'] },
      saltOkunur: ['materials', 'stations', 'boms', 'warehouses', 'lots', 'moves', 'wo'], yeniSerbest: ['lots', 'moves'], izinli: { stations: ['status'], wo: ['status', 'produced', 'scrap', 'reports', 'issued', 'outLots', 'ops', 'startedAt', 'end', 'closeNote'] },
      suz: (o) => { if (Array.isArray(o.wo)) o.wo = o.wo.map((w) => (nesne(w) && Array.isArray(w.issued) ? { ...w, issued: w.issued.map((i) => { if (!nesne(i)) return i; const { cost, ...r } = i; return r; }) } : w)); },
      sonra: (o, s) => { fabrikaMaliyet(o, s); const biten = new Set(dizi(o.wo).filter((w) => nesne(w) && w.status === 'tamam' && w.so).map((w) => w.so)); if (biten.size && Array.isArray(o.so)) o.so = o.so.map((x) => (nesne(x) && biten.has(x.id) ? { ...x, woDone: true } : x)); } },
  },
  // apps/kargo: kurye yalnızca kendi ekranını görür (myCourier). Mutabakat, cari ve hakediş yöneticide. Kabulde cari indirimi gerekir, faturası ve vergi bilgisi gerekmez. Kurye teslimde yalnızca alan bazlı yazar: ücret ve kapıda tahsilat tutarı değişmez.
  kargo: {
    kabul: { ad: 'Kabul / şube', kapat: ['cashins', 'codPayouts'], gizle: { couriers: ['prim'], caris: ['invoices', 'taxNo', 'taxOffice'] }, saltOkunur: ['couriers', 'caris'], silemez: ['ships'] },
    kurye: { ad: 'Kurye', kisi: { kol: 'couriers', alan: 'courier', baslik: 'Kurye', yok: 'Kurye seçin (seçilmezse gönderi görünmez)' }, kapat: ['caris', 'cashins', 'codPayouts'], gizle: { couriers: ['prim'], ships: ['sender', 'cari', 'ebelge'] }, saltOkunur: ['couriers', 'ships'],
      izinli: { ships: ['status', 'history', 'failReason', 'failGeo', 'attempts', 'stopNo', 'deliveredTo', 'signature', 'geo', 'photo', 'codCollected', 'codPay', 'feeCollected', 'feePay'] }, satir: { ships: (x, b) => eslesir(x, 'courier', b), couriers: (c, b) => !!b.dept && c.id === b.dept } },
  },
  // apps/emlak: danışman tüm portföyü görür, başkasının ilanında mal sahibi ve teklif bilgisini görmez, ilanı değiştiremez (mine). Talep, kira ve işlem kendi ilanıyla sınırlıdır. Komisyon payı ve portal hesabı yöneticide.
  // Başkasının ilanındaki gösterim satırı ilan sayfasında görünür, gösterilen kişinin kimlik no ve imzası gitmez. Danışman kira bitişinde yönetici PIN'i ister (kira-bitis).
  emlak: { danisman: { ad: 'Danışman', kisi: { kol: 'agents', alan: 'agent', baslik: 'Danışman', yok: 'Danışman seçin (seçilmezse kendi ilanı görünmez)' }, kapat: ['portalCfg'], gizle: { agents: ['share'] }, saltOkunur: ['agents', 'portalListings'], silemez: ['props', 'deals', 'leases'], onayli: { leases: { status: 'kira-bitis' } },
    satir: { requests: (r, b) => !r.agent || eslesir(r, 'agent', b), leases: (l, b) => b.kume('props', (p) => eslesir(p, 'agent', b)).has(l.prop), deals: (d, b) => eslesir(d, 'agent', b) },
    suz: (o, b) => {
      if (Array.isArray(o.props)) o.props = o.props.map((p) => { if (!nesne(p) || !emlakYabanci(p, b)) return p; const { owner, ownerPhone, ownerTc, offers, ...r } = p; return r; });
      if (Array.isArray(o.showings)) o.showings = o.showings.map((x) => { if (!nesne(x) || !emlakYabanci(x, b)) return x; const { tc, sign, ...r } = x; return r; });
    },
    sonra: (o, s, b) => { for (const c of ['props', 'showings']) { if (!Array.isArray(o[c])) continue; const m = idHarita(s[c]); o[c] = o[c].map((r) => { const e = nesne(r) ? m.get(r.id) : null; return e && emlakYabanci(e, b) ? e : r; }); } } } },
  // apps/pazaryeri: isAdm() maliyet, kâr ve komisyonu yöneticide tutar. Depo ürün ve stok yazar; müşteri hizmetleri stok ve iptal işlemi yapmaz (canOps). Durum çekme zamanı (lastStatusPull) kanal kaydına yazılır, bu alan korunur.
  pazaryeri: {
    depo: { ad: 'Depo / paketleme', gizle: { products: ['cost'] }, saltOkunur: ['channels'], silemez: ['products', 'orders'], suz: (o) => kanalSuz(o), sonra: (o, s, b, g) => kanalYaz(o, s, g) },
    destek: { ad: 'Müşteri hizmetleri', kapat: ['picklists'], gizle: { products: ['cost'] }, saltOkunur: ['channels', 'products'], silemez: ['orders'], suz: (o) => kanalSuz(o), sonra: (o, s, b, g) => kanalYaz(o, s, g) },
  },
  // apps/bilet: gişe salon, rapor ve hesap kesimini görmez; süresi geçmiş iade Organizatör PIN'i ister, belirteçsiz iade uygulanmaz. Kapı görevlisi yalnızca Kapı Kontrol ve Canlı Giriş ekranını görür: fiyat, telefon, ödeme gitmez, biletlere yalnızca giriş alanları yazılır.
  bilet: {
    gise: { ad: 'Gişe', kapat: ['settlements'], saltOkunur: ['venues'], silemez: ['tickets'], onayTurleri: ['iade'], onayGeri: { iade: ['codes'] },
      onayAdim: (o, s, onayla) => { if (!Array.isArray(o.tickets)) return; const m = idHarita(s.tickets); o.tickets = o.tickets.map((t) => { const e = nesne(t) ? m.get(t.id) : null; return !e || t.status !== 'refunded' || e.status === 'refunded' || !biletGec(t, s) || onayla('iade', 'tickets') ? t : e; }); } },
    kapi: { ad: 'Kapı görevlisi', kapat: ['settlements', 'waitlist'], saltOkunur: ['tickets', 'events', 'venues', 'codes'], izinli: { tickets: ['status', 'usedAt', 'gate', 'out', 'outAt', 'reentries'] },
      suz: (o) => { if (Array.isArray(o.tickets)) o.tickets = o.tickets.map((t) => { if (!nesne(t)) return t; const { price, paid, fee, pay, paidAt, cashier, refund, refundedAt, order, discount, ...r } = t; return { ...r, buyer: nesne(t.buyer) ? { name: t.buyer.name } : t.buyer }; }); if (Array.isArray(o.codes)) o.codes = o.codes.map((k) => (nesne(k) ? { id: k.id, code: k.code, note: k.note } : k)); } },
  },
  // apps/butik: satış danışmanı ürün formunda maliyeti görür ve kampanyayı satışta kullanır, gizlenen alan yoktur. Süresi geçmiş değişim ve iade yönetici PIN'i ister: belirteçsiz işlem ve o kayıttaki stok, müşteri, çek değişiklikleri geri alınır. Satış kaydı silinemez.
  butik: { kasa: { ad: 'Satış danışmanı', silemez: ['sales'], onayTurleri: ['degisim'], onayGeri: { degisim: ['models', 'moves', 'customers', 'cheques', 'sales'] },
    onayAdim: (o, s, onayla) => {
      if (!Array.isArray(o.returns)) return; const eski = idHarita(s.returns); const g = Number((nesne(s._settings) ? s._settings : {}).exchangeDays) || 30; const fis = new Map(dizi(s.sales).filter(nesne).map((x) => [x.no, x]));
      o.returns = o.returns.filter((r) => { if (!nesne(r) || eski.has(r.id)) return true; const f = fis.get(r.saleNo); return !f || (Date.now() - new Date(f.at)) / 864e5 <= g || onayla('degisim', 'returns'); });
    } } },
  // apps/oto: yıkamacı yalnızca Yıkama Kuyruğu ve Araç Geçmişi ekranını görür. Abone kartı, abonelik ödemesi ve hizmet fiyat listesi değişmez; iptalde abonenin yıkama hakkı geri yazılır (izinli). Gişede yalnız menü farkı vardır, kural eklenmedi.
  oto: { yikama: { ad: 'Yıkamacı', kapat: ['subPays'], ekle: ['sms'], gizle: { subs: ['name', 'phone', 'price'] }, saltOkunur: ['subs', 'packages', 'workers'], izinli: { subs: ['washesLeft'] } } },
  // apps/dernek: fin() sekreterde kapalı: aidat, tahsilat, gelir-gider görünmez. Sayman toplantı ve evrakı okur. Üye kaydı silinmez (üye kayıt defterinde çıkış tarihi tutulur).
  dernek: { sayman: { ad: 'Sayman', saltOkunur: ['meetings', 'letters', 'posts'], silemez: ['members'] }, sekreter: { ad: 'Sekreter', kapat: ['dues', 'receipts', 'entries'], silemez: ['members'] } },
  // apps/egitim: fin() eğitmende kapalı: ücret, taksit, ön kayıt görünmez. Eğitmen yalnız kendi grubunu görür, yoklama ve not yazar. Sertifika üretimi ve iptali yöneticide/kayıtta.
  egitim: {
    egitmen: { ad: 'Eğitmen', kisi: { kol: 'teachers', alan: 'teacher', baslik: 'Eğitmen', yok: 'Eğitmen seçin (seçilmezse grup görünmez)' }, kapat: ['payments', 'leads'], ekle: ['sms'], gizle: { enrolls: ['fee', 'installments'], teachers: ['rate'], trainees: ['email', 'note'] }, saltOkunur: ['teachers', 'courses', 'groups', 'trainees', 'certs'], silemez: ['enrolls', 'sessions'],
      satir: { groups: (g, b) => eslesir(g, 'teacher', b), sessions: (s, b) => eslesir(s, 'teacher', b), enrolls: (e, b) => b.ids('groups').has(e.group) } },
    kayit: { ad: 'Kayıt / Muhasebe', gizle: { teachers: ['rate'] }, saltOkunur: ['teachers', 'courses'] },
  },
  // apps/danisan: clinical() sekreterde kapalı: seans notu, ölçüm, plan ve sağlık alanları gitmez. Uzman yalnız kendi danışanını görür (myS). Danışan kaydı silinmez, pasife alınır.
  danisan: {
    uzman: { ad: 'Uzman', kisi: { kol: 'staff', alan: 'staff', baslik: 'Uzman', yok: 'Uzman seçin (seçilmezse danışan görünmez)' }, ekle: ['sms'], gizle: { staff: ['rate'] }, saltOkunur: ['staff', 'services'], silemez: ['clients', 'notes'], sonra: notKilit,
      satir: { clients: (c, b) => eslesir(c, 'owner', b), appts: (a, b) => eslesir(a, 'staff', b), notes: (n, b) => b.ids('clients').has(n.client), measures: (m, b) => b.ids('clients').has(m.client), plans: (p, b) => b.ids('clients').has(p.client), packs: (p, b) => b.ids('clients').has(p.client), payments: (p, b) => b.ids('clients').has(p.client) } },
    sekreter: { ad: 'Sekreter', kapat: ['notes', 'measures', 'plans'], gizle: { clients: ['anamnez', 'goal', 'meds', 'allergy'], staff: ['rate'] }, saltOkunur: ['staff', 'services'], silemez: ['clients'] },
  },
  // apps/fiyatrobotu: izleyici tüm ekranları görür, hiçbir şeyi değiştiremez (canEdit). Gizlenecek alan yoktur, yazma kapalıdır. Fiyat uzmanında yalnız menü farkı vardır, kural eklenmedi.
  fiyatrobotu: { izleyici: { ad: 'İzleyici', saltOkunur: ['products', 'listings', 'history', 'runs', 'channels', 'cargoOverride', 'comOverride', 'feeOverride', 'ratesOwn'] } },
  // apps/servis: ROLES var, ekranlarda rol denetimi yok. Teknisyen ve kabul Özet, Teknisyenler, Ayarlar menüsünü görmez; parça alış fiyatı Parça Stoku ekranında herkese açık. Yalnız menü farkı: kural eklenmedi.
};
// Pazaryeri kanal kaydı: bağlantı alanları gerekir, komisyon ve hizmet bedeli kâr hesabıdır
const kanalSuz = (o) => { if (nesne(o.channels)) o.channels = Object.fromEntries(Object.entries(o.channels).map(([k, v]) => { if (!nesne(v)) return [k, v]; const { commission, fixedFee, payoutDays, ...r } = v; return [k, r]; })); };
const kanalYaz = (o, s, gelen) => { const g = nesne(gelen.channels) ? gelen.channels : null; if (!g || !nesne(s.channels)) return; o.channels = Object.fromEntries(Object.entries(s.channels).map(([k, v]) => [k, nesne(v) && nesne(g[k]) && g[k].lastStatusPull ? { ...v, lastStatusPull: g[k].lastStatusPull } : v])); };
// Programlar arası ortak veri: rolü olan hesapta entegrasyon ayarı değişmez, gönderim günlüğü (e-Nabız TEST yükü gibi sağlık verisi taşıyabilir) okunmaz, yalnızca eklenir
const ORTAK = { entegrasyon: { saltOkunur: ['cfg'], ekle: ['log'] } };

const nesne = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const dizi = (v) => (Array.isArray(v) ? v : []);
const bos = (v) => (Array.isArray(v) ? [] : nesne(v) ? {} : undefined);
const kuralBul = (app, rol) => (rol === '*' ? (Object.hasOwn(ORTAK, app) ? ORTAK[app] : null) : Object.hasOwn(RULES, app) && Object.hasOwn(RULES[app], rol) ? RULES[app][rol] : null);
const SINIR = { _log: 5000, log: 500 }; // en yeni başta tutulan günlükler; diğerleri sona eklenir
const ekleListe = (k) => [...new Set(['_log', ...(k.ekle || [])])];
const idHarita = (v) => new Map(dizi(v).filter((x) => nesne(x) && x.id != null).map((x) => [x.id, x]));
const kapsamId = (k, belge, ek) => { const ka = k.kapsam; if (!ka) return null; const d = (ek && ek.dept) || ''; return new Set(dizi(belge[ka.kok]).filter((r) => nesne(r) && d && r[ka.alan] === d).map((r) => r.id)); };
const kisiAnahtar = (anahtar) => String(anahtar).split('|')[0];
// Satır kuralları için bağlam. Sonuçlar tek çağrı boyunca saklanır.
function baglam(k, belge, ek) {
  const dept = (ek && ek.dept) || ''; const bak = {}; const satirlar = (c) => { if (!bak[c]) { const f = (k.satir || {})[c]; bak[c] = dizi(belge[c]).filter((r) => nesne(r) && (!f || f(r, b))); } return bak[c]; };
  const kayit = k.kisi && dept ? dizi(belge[k.kisi.kol]).find((r) => nesne(r) && r.id === dept) : null;
  const kumeler = {}; const b = { dept, ad: kayit ? kayit.name || '' : '', ids: (c) => new Set(satirlar(c).map((r) => r.id)), alanlar: (c, a) => new Set(satirlar(c).map((r) => r[a])), kume: (c, f) => { if (!kumeler[c]) kumeler[c] = new Set(dizi(belge[c]).filter((r) => nesne(r) && f(r)).map((r) => r.id)); return kumeler[c]; } };
  return b;
}
// Satır filtresi görünen numaradan saydığı için çakışan yeni numarayı sunucudaki en büyük numaranın devamına taşır. Sondaki rakamlar artar (S7012, 2026/0104).
function numaraDuzelt(liste, sunucu, alan) {
  const eski = dizi(sunucu); const idler = new Set(eski.map((r) => r && r.id)); const var_ = new Set(eski.map((r) => r && r[alan]).filter(Boolean));
  return liste.map((r) => {
    if (!nesne(r) || idler.has(r.id) || !var_.has(r[alan])) { if (nesne(r) && r[alan]) var_.add(r[alan]); return r; }
    const m = String(r[alan]).match(/^(.*?)(\d+)$/); if (!m) return r;
    let n = 0; for (const x of var_) { const y = String(x).match(/^(.*?)(\d+)$/); if (y && y[1] === m[1]) n = Math.max(n, Number(y[2])); }
    const no = m[1] + String(n + 1).padStart(m[2].length, '0'); var_.add(no); return { ...r, [alan]: no };
  });
}
const icinde = (ka, c, alan, ids, r) => nesne(r) && (ids.has(r[alan]) || ((ka.bosSerbest || []).includes(c) && r[alan] == null));

// İstemciye gidecek görünüm. Girdi değişmez.
function filtrele(app, rol, belge, ek = {}) {
  const k = kuralBul(app, rol); if (!k || !nesne(belge)) return belge;
  const o = { ...belge };
  for (const c of [...(k.kapat || []), ...ekleListe(k)]) if (c in o) { const b = bos(o[c]); if (b === undefined) delete o[c]; else o[c] = b; }
  if (Array.isArray(o.users)) o.users = o.users.map((u) => { if (!nesne(u)) return u; const { pin, pinH, ...r } = u; return r; });
  if (nesne(o._meta)) { const { ownerPin, ...r } = o._meta; o._meta = r; }
  for (const [c, alanlar] of Object.entries(k.gizle || {})) if (Array.isArray(o[c])) o[c] = o[c].map((r) => { if (!nesne(r)) return r; const n = { ...r }; alanlar.forEach((f) => delete n[f]); return n; });
  const ids = kapsamId(k, belge, ek);
  if (ids) {
    const { kok, bagli = {}, anahtar = [] } = k.kapsam;
    if (Array.isArray(o[kok])) o[kok] = o[kok].filter((r) => nesne(r) && ids.has(r.id));
    for (const [c, alan] of Object.entries(bagli)) if (Array.isArray(o[c])) o[c] = o[c].filter((r) => icinde(k.kapsam, c, alan, ids, r));
    for (const c of anahtar) if (nesne(o[c])) o[c] = Object.fromEntries(Object.entries(o[c]).filter(([a]) => ids.has(kisiAnahtar(a))));
  }
  if (k.satir) { const b = baglam(k, belge, ek); for (const [c, f] of Object.entries(k.satir)) if (Array.isArray(o[c])) o[c] = o[c].filter((r) => nesne(r) && f(r, b)); }
  if (k.suz) k.suz(o, baglam(k, belge, ek));
  return o;
}

// Yetkili onayı. ek.onay: Map(işlem → geçerli belirteç sayısı) veya true (tüm işlemler, saf testler). Bir belirteç tek kaydı açar; onayToplu'daki işlem tek PUT'taki tüm kayıtları.
function onayci(k, ek) {
  const kalan = ek.onay instanceof Map ? ek.onay : null; const toplu = k.onayToplu || []; const harcanan = new Map();
  return (islem, c) => {
    const acik = toplu.includes(islem) && harcanan.has(islem); const hak = ek.onay === true || acik || (kalan && (kalan.get(islem) || 0) > 0);
    if (!hak) { ek.reddedilen = [...new Set([...(ek.reddedilen || []), c])]; ek.redIslem = [...new Set([...(ek.redIslem || []), islem])]; return false; }
    ek.onayKullanildi = true; if (kalan && !acik) { kalan.set(islem, kalan.get(islem) - 1); harcanan.set(islem, (harcanan.get(islem) || 0) + 1); ek.harcanan = harcanan; }
    return true;
  };
}

// PUT ile gelen belgeyi, rolün yazamadığı her şeyi sunucudaki hâlinden alarak birleştirir. sunucudaki: version=base olan satırın ham belgesi.
function geriKoy(app, rol, gelen, sunucudaki, ek = {}) {
  const k = kuralBul(app, rol); if (!k) return gelen;
  const g = nesne(gelen) ? gelen : {}; const s = nesne(sunucudaki) ? sunucudaki : {}; const o = { ...g };
  const geri = (c) => { if (c in s) o[c] = s[c]; else delete o[c]; };
  ['users', '_settings', ...(k.kapat || [])].forEach(geri);
  if (k.ayarIzinli && nesne(g._settings)) { const y = { ...(nesne(s._settings) ? s._settings : {}) }; k.ayarIzinli.forEach((a) => { if (a in g._settings) y[a] = g._settings[a]; }); o._settings = y; }
  const b = baglam(k, s, ek); const onayla = onayci(k, ek);
  o._meta = { ...(nesne(s._meta) ? s._meta : {}), ...(nesne(g._meta) ? g._meta : {}) };
  if (nesne(s._meta) && 'ownerPin' in s._meta) o._meta.ownerPin = s._meta.ownerPin; else delete o._meta.ownerPin;
  if (!nesne(g._meta) && !nesne(s._meta)) delete o._meta;
  for (const c of ekleListe(k)) {
    const S = dizi(s[c]); const var_ = new Set(S.map((x) => x && x.id));
    const yeni = dizi(g[c]).filter((x) => nesne(x) && x.id != null && !var_.has(x.id));
    if (!(c in s) && !yeni.length) { delete o[c]; continue; }
    o[c] = SINIR[c] ? [...yeni, ...S].slice(0, SINIR[c]) : [...S, ...yeni];
  }
  const salt = new Set(k.saltOkunur || []);
  for (const c of salt) {
    geri(c); const izin = (k.izinli || {})[c]; const f = (k.satir || {})[c];
    if (izin && Array.isArray(s[c])) {
      const m = idHarita(g[c]);
      o[c] = s[c].map((r) => { const x = nesne(r) && (!f || f(r, b)) ? m.get(r.id) : null; if (!x) return r; const n = { ...r }; izin.forEach((a) => { if (a in x) n[a] = x[a]; else delete n[a]; }); return n; });
    }
    if ((k.yeniSerbest || []).includes(c)) { const var_ = new Set(dizi(s[c]).map((x) => x && x.id)); const yeni = dizi(g[c]).filter((x) => nesne(x) && x.id != null && !var_.has(x.id)); if (yeni.length) o[c] = [...dizi(o[c]), ...yeni]; }
  }
  for (const [c, alanlar] of Object.entries(k.gizle || {})) {
    if (salt.has(c)) continue;
    if (!Array.isArray(g[c])) { geri(c); continue; }
    const m = idHarita(s[c]);
    const yaz = (k.yeniYazar || []).includes(c);
    o[c] = g[c].map((r) => { if (!nesne(r)) return r; const n = { ...r }; const es = m.get(r.id); alanlar.forEach((f) => { if (es && f in es) n[f] = es[f]; else if (es || !yaz) delete n[f]; }); return n; });
  }
  for (const [c, f] of Object.entries(k.satir || {})) {
    if (salt.has(c)) continue;
    if (!Array.isArray(g[c])) { geri(c); continue; }
    const disi = dizi(s[c]).filter((r) => !(nesne(r) && f(r, b))); const disiId = new Set(disi.map((r) => r && r.id));
    o[c] = [...dizi(o[c]).filter((r) => !(nesne(r) && disiId.has(r.id))), ...disi];
  }
  for (const [c, alan] of Object.entries(k.numara || {})) if (Array.isArray(o[c])) o[c] = numaraDuzelt(o[c], s[c], alan);
  for (const c of k.silemez || []) {
    if (!Array.isArray(s[c])) continue;
    if (!Array.isArray(o[c])) { o[c] = s[c]; continue; }
    const var_ = new Set(o[c].map((x) => x && x.id)); const eksik = s[c].filter((r) => nesne(r) && !var_.has(r.id));
    if (eksik.length) o[c] = [...o[c], ...eksik];
  }
  // Yetkili onayı: belirteç yoksa korunan alan sunucudaki değerine döner. Yeni kayıt kapsam dışıdır (ilk fiyat onay istemez).
  for (const [c, alanlar] of Object.entries(k.onayli || {})) {
    if (!Array.isArray(o[c]) || !Array.isArray(s[c])) continue; const m = idHarita(s[c]);
    o[c] = o[c].map((r) => {
      const es = nesne(r) ? m.get(r.id) : null; if (!es) return r; const degisen = Object.keys(alanlar).filter((f) => JSON.stringify(r[f]) !== JSON.stringify(es[f])); if (!degisen.length) return r;
      const karar = new Map(); const n = { ...r }; degisen.forEach((f) => { const i = alanlar[f]; if (!karar.has(i)) karar.set(i, onayla(i, c)); if (karar.get(i)) return; if (f in es) n[f] = es[f]; else delete n[f]; }); return n;
    });
  }
  const ids = kapsamId(k, s, ek);
  if (ids) {
    const { bagli = {}, anahtar = [] } = k.kapsam;
    for (const [c, alan] of Object.entries(bagli)) {
      if (!Array.isArray(g[c])) { geri(c); continue; }
      const disi = dizi(s[c]).filter((r) => !icinde(k.kapsam, c, alan, ids, r)); const disiId = new Set(disi.map((r) => r && r.id));
      o[c] = [...g[c].filter((r) => icinde(k.kapsam, c, alan, ids, r) && !disiId.has(r.id)), ...disi];
    }
    for (const c of anahtar) {
      if (!nesne(g[c])) { geri(c); continue; }
      const n = {};
      if (nesne(s[c])) for (const [a, v] of Object.entries(s[c])) if (!ids.has(kisiAnahtar(a))) n[a] = v;
      for (const [a, v] of Object.entries(g[c])) if (ids.has(kisiAnahtar(a))) n[a] = v;
      o[c] = n;
    }
  }
  if (k.onayAdim) k.onayAdim(o, s, onayla, b);
  for (const i of ek.redIslem || []) for (const c of (k.onayGeri || {})[i] || []) geri(c);
  if (k.sonra) k.sonra(o, s, b, g);
  return o;
}

// users.team_roles → bu program için rol. null: tam yetki. { hata: true }: kayıt okunamadı veya kural kaldırılmış; tam yetki sayılmaz, istek reddedilir.
function rolCoz(app, metin) {
  if (metin == null || metin === '') return null;
  let r; try { r = JSON.parse(metin); } catch (e) { return { hata: true }; }
  if (!nesne(r)) return { hata: true };
  if (!Object.keys(r).length) return null;
  if (Object.hasOwn(ORTAK, app)) return { rol: '*', ortak: true };
  const rol = r[app]; if (rol == null || rol === '') return null;
  if (!kuralBul(app, rol)) return { hata: true };
  return { rol, dept: typeof r[`${app}_dept`] === 'string' ? r[`${app}_dept`] : '' };
}
// Bu rolde yetkili onayı belirteci üretilir mi, üretilirse PIN sahibi hangi rollerde olmalı
const onayRolleri = (app, rol) => { const k = kuralBul(app, rol); return k && (k.onayli || k.onayAdim) ? k.onayRol || ['admin'] : null; };
// Rolün belirteç alabileceği işlem türleri
const onayIslemleri = (app, rol) => { const k = kuralBul(app, rol); if (!k) return []; return [...new Set([...(k.onayTurleri || []), ...Object.values(k.onayli || {}).flatMap((x) => Object.values(x))])]; };
const kapsamli = (app, rol) => { const k = kuralBul(app, rol); return !!(k && (k.kapsam || k.kisi)); };
// Tek programın rolünü günceller. rol boşsa kayıt kalkar; hiç kayıt kalmazsa null döner (tam yetki).
function rolYaz(metin, app, rol, dept) {
  let r = {}; try { const x = JSON.parse(metin || '{}'); if (nesne(x)) r = x; } catch (e) { r = {}; }
  delete r[app]; delete r[`${app}_dept`];
  if (rol) { r[app] = rol; if (kapsamli(app, rol)) r[`${app}_dept`] = String(dept || '').trim().slice(0, 80); }
  return Object.keys(r).length ? JSON.stringify(r) : null;
}
// POST /api/team için: { klinik: 'sekreter', ik: 'sef', ik_dept: 'Üretim' }. Geçersiz rol varsa hata fırlatır.
function rollerTemizle(roller) {
  if (roller == null || roller === '') return null;
  if (!nesne(roller)) throw new Error('Geçersiz rol bilgisi');
  let m = null;
  for (const [app, rol] of Object.entries(roller)) {
    if (/_dept$/.test(app) || rol == null || rol === '') continue;
    if (!rolVar(app, rol)) throw new Error('Geçersiz rol bilgisi');
    m = rolYaz(m, app, rol, roller[`${app}_dept`]);
  }
  return m;
}
// Ekip ekranı için: rolü tanımlı programlar
const programlar = () => Object.entries(RULES).map(([app, roller]) => ({ app, roller: Object.entries(roller).map(([id, k]) => ({ id, ad: k.ad || id, departman: !!(k.kapsam || k.kisi), ...(k.kisi ? { kisi: true, baslik: k.kisi.baslik, yok: k.kisi.yok } : {}) })) }));
// Ekip ekranı: rolün bağlanabileceği kişiler (yalnızca hesap sahibine gider)
function kisiler(app, belge) {
  const k = Object.values(Object.hasOwn(RULES, app) ? RULES[app] : {}).find((x) => x.kisi); if (!k || !nesne(belge)) return [];
  return dizi(belge[k.kisi.kol]).filter((r) => nesne(r) && r.id != null && r.active !== false && (!k.kisi.suz || k.kisi.suz(r))).map((r) => ({ value: r.id, label: String(r.name || r.id) }));
}
// GET /api/data: hesabın programdaki karşılığı. Kişi silinmişse boş döner, program "kişi yok" davranışına düşer.
function kisiBilgi(app, rol, dept, belge) {
  const k = kuralBul(app, rol); if (!k || !k.kisi || !dept) return null;
  const r = dizi((nesne(belge) ? belge : {})[k.kisi.kol]).find((x) => nesne(x) && x.id === dept); if (!r) return null;
  return { id: r.id, ad: k.kisi.kayitAdi === false ? '' : String(r.name || ''), ...(k.kisi.alan ? { alan: k.kisi.alan } : {}) };
}
// Koleksiyona yazamayan rol o koleksiyonun fotoğrafını da yükleyemez (dosya.js)
const yazabilir = (app, rol, kol) => { const k = kuralBul(app, rol); return !k || !((k.saltOkunur || []).includes(kol) || (k.kapat || []).includes(kol)); };
const rolVar = (app, rol) => typeof rol === 'string' && !!kuralBul(app, rol) && rol !== '*';

module.exports = { RULES, ORTAK, filtrele, geriKoy, rolCoz, rolYaz, rollerTemizle, rolVar, yazabilir, programlar, onayRolleri, onayIslemleri, kisiler, kisiBilgi };
