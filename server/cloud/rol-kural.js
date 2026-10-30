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
//   onayli      { koleksiyon: ['alan'] }  var olan kayıtta yetkili onayı (NS.approve) belirteci olmadan değişmez: sunucudaki değer geri konur, ek.reddedilen'e yazılır
//   onayRol     ['rol']                   belirteci alabilecek program kullanıcıları (varsayılan yalnızca admin); istemcinin bildirdiği rol dikkate alınmaz
//   satir       { koleksiyon: (kayıt, b) => bool }  yalnızca dönen satırlar gider; gizli satır yazmada aynen korunur, id'si taklit edilemez. Görünen satır ve yeni kayıt serbesttir.
//               b: { dept, ad, ids(c), alanlar(c, a) }: dept seçilen kişi veya departman, ad bağlı kişinin adı, ids o koleksiyonun bu hesaba görünen id'leri, alanlar görünen kayıtların a alanı.
//               saltOkunur koleksiyonda izinli alanlar yalnızca görünen satırda yazılır.
//   kisi        { kol, alan, suz, baslik, yok, kayitAdi }  hesabı programdaki bir kişiye bağlar (kol koleksiyonundan seçilir, seçim users.team_roles içinde "<app>_dept"te durur).
//               Tarayıcıda NS.currentUser.id (alan yoksa) veya NS.currentUser[alan] bu kişi, name onun adı olur (kol bir kişi değilse kayitAdi: false ile hesabın adı kalır); programın "yalnız kendi kayıtlarım" süzgeci böyle çalışır.
//   ayarIzinli  ['anahtar']               _settings içinde rolün yazabildiği anahtarlar (rolün ekranı doğrudan ayar yazıyorsa); kalanı değişmez
//   yeniSerbest ['koleksiyon']            saltOkunur koleksiyonda rol yeni kayıt açabilir, var olana dokunamaz
//   yeniYazar   ['koleksiyon']            gizle alanları rolün açtığı yeni kayıtta silinmez (takas aracının alış değeri gibi)
//   numara      { koleksiyon: 'alan' }    satır filtresi yüzünden sıra numarası çakışan yeni kayıt, sunucudaki en büyük numaranın devamını alır
//   suz         (gorunum) => void         alan silmenin yetmediği görünüm düzeltmesi (iç içe alan, programın dizi beklediği alan). Girdiyi değiştirmez, kopya yazar.
//   sonra       (sonuc, sunucudaki) => void  programa özel tutarlılık adımı
// Her kuralda ek olarak: users[].pin gizlenir ve users korunur, _meta.ownerPin gizlenir, _settings değişmez, işlem geçmişi (_log) okunmaz ve yalnızca eklenir.
// Yeni program için RULES'e kayıt eklemek yeterlidir; diğer programların rolleri yalnızca arayüzdedir.
// Dikkat: gizle/kapat yazılmadan önce rolün ekranı o alandan hesap yapıp kaydediyor mu bakılır. Örnek: POS satırı ürünün alış fiyatını kopyalar, toptan sevkiyatı cari bakiyeyi artırır,
// kuyumcu tezgâhtarı kuru _settings'e yazar. Kaydetmeye giren alan gizlenecekse sonra, izinli veya ayarIzinli ile sunucu tarafı tamamlanır.
const eslesir = (r, a, b) => !!b.dept && r[a] === b.dept;
const RULES = {
  // apps/klinik/app.js: clinical() sekreterde kapalı (anamnez, muayene notu, tanı, reçete, e-Nabız). Yönetim menüsü (hakediş, tedavi listesi, hekimler, raporlar) yöneticide.
  // Hasta silme yöneticide (canDelete). Telefon, TC, kan grubu, Not alanı, tedavi planı, ödeme, randevu nedeni sekreterin ekranlarında kullanılır, açık kalır.
  klinik: { sekreter: { ad: 'Sekreter', gizle: { patients: ['anamnez', 'meds'], doctors: ['rate'] }, kapat: ['visits', 'prescriptions'], saltOkunur: ['doctors', 'treatments'], silemez: ['patients'] } },
  // apps/eczane/app.js: Kurum Mutabakatı ve Kontrole Tabi Defter yalnızca eczacıda; hasta silme eczacıda.
  // Kalfanın satışı deftere kayıt ekler (ctrl), bu yüzden defter "ekle" kuralındadır. Eczacı PIN'iyle onaylanan iade defterde "iade" olarak işaretlenir (sonra).
  // Alerji, kronik ilaç, TC ve satış geçmişi satış ekranında gerekir, açık kalır.
  // İade (sales.canceled) ve fiyat (drugs.price) ekranda eczacı PIN'i ister; onayli bu kuralı sunucuda da zorlar. Satış kaydı silinemez: iade silerek taklit edilemesin.
  eczane: { kalfa: { ad: 'Kalfa / teknisyen', kapat: ['claims'], ekle: ['ctrl'], silemez: ['patients', 'sales'], onayli: { sales: ['canceled'], drugs: ['price'] }, sonra: (o) => { const iptal = new Set(dizi(o.sales).filter((s) => s && s.canceled).map((s) => s.no)); if (iptal.size && Array.isArray(o.ctrl)) o.ctrl = o.ctrl.map((c) => (c && iptal.has(c.saleNo) && !c.canceled ? { ...c, canceled: true } : c)); } } },
  // apps/veteriner/app.js: canAct → "muayene, aşı ve tedavi kaydı hekimindir; asistan görür, onam alır, satış yapar". Asistan muayene ve aşıyı görür, gizlenecek alan yoktur;
  // kayıtları değiştiremez. Aşı hatırlatma SMS'i asistana açık olduğu için hatırlatma işareti yazılabilir. Sahip silme yöneticide; hayvan silme ekranı yoktur.
  veteriner: { asistan: { ad: 'Asistan', saltOkunur: ['visits', 'vaccines'], izinli: { vaccines: ['reminded', 'remindTest'] }, silemez: ['owners', 'pets'] } },
  // apps/ik/app.js: şef yalnızca kendi departmanını görür (inScope), personel ekranı salt okunur, maaş sütunu ve TC araması kapalı; Bordro ve Belge & Zimmet yöneticide.
  // Telefon (vardiya ve izin SMS'i), doğum tarihi (doğum günü kartı, izin hakkı) ve izin hakkı alanları şefin ekranlarında gerekir, açık kalır.
  // Kapalı dönem bilgisi puantajı kilitlediği için payClosed görünür, maaş satırları (rows) gizlidir.
  ik: { sef: { ad: 'Departman şefi', gizle: { employees: ['salary', 'salaryType', 'tc', 'iban', 'portalCode', 'exit'], payClosed: ['rows'] }, kapat: ['advances', 'files'], ekle: ['sms'], saltOkunur: ['employees', 'payClosed'], kapsam: { kok: 'employees', alan: 'dept', bagli: { leaves: 'emp', signedDocs: 'party' }, bosSerbest: ['signedDocs'], anahtar: ['ts', 'roster'] } } },
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
  pos: { kasiyer: { ad: 'Kasiyer', kapat: ['suppliers', 'purchases', 'priceLog', 'counts'], gizle: { products: ['buy'] }, saltOkunur: ['products', 'cats', 'campaigns'], izinli: { products: ['stock'] }, yeniSerbest: ['products'], silemez: ['sales'],
    suz: (o) => { const kes = (l) => { if (!nesne(l)) return l; const { buy, ...r } = l; return r; }; if (Array.isArray(o.sales)) o.sales = o.sales.map((x) => (nesne(x) && Array.isArray(x.items) ? { ...x, items: x.items.map(kes) } : x)); if (Array.isArray(o.held)) o.held = o.held.map((h) => (nesne(h) && nesne(h.cart) && Array.isArray(h.cart.lines) ? { ...h, cart: { ...h.cart, lines: h.cart.lines.map(kes) } } : h)); },
    sonra: (o, s) => { if (!Array.isArray(o.sales)) return; const eski = idHarita(s.sales); const m = idHarita(s.products); o.sales = o.sales.map((x) => { if (!nesne(x)) return x; const e = eski.get(x.id); if (e) return { ...x, items: e.items }; return { ...x, items: dizi(x.items).map((i) => (nesne(i) ? { ...i, buy: i.pid && m.has(i.pid) ? m.get(i.pid).buy : i.buy } : i)) }; }); } } },
  // apps/adisyon/app.js: menü, reçete, malzeme stoku, raporlar yöneticide. Sipariş gönderme malzeme stoğunu düşer (izinli), maliyet gizli; paket ve QR ekranı ayar yazar (ayarIzinli).
  // Mutfak yalnızca kalem durumunu değiştirir (checks.items); ödeme bilgisi gitmez. Kapalı adisyonlar masa ekranında sayıldığı için garsonda açık kalır.
  adisyon: {
    garson: { ad: 'Garson', kapat: ['platLog', 'platReviews'], gizle: { ingredients: ['cost'] }, saltOkunur: ['menu', 'mcats', 'ingredients'], izinli: { ingredients: ['stock'] }, ayarIzinli: ['platformPull', 'qrOrder'] },
    kasa: { ad: 'Kasiyer', gizle: { ingredients: ['cost'] }, saltOkunur: ['menu', 'mcats', 'ingredients'], izinli: { ingredients: ['stock'] }, ayarIzinli: ['platformPull'] },
    mutfak: { ad: 'Mutfak', kapat: ['reservations', 'calls', 'areas', 'couriers', 'ingredients', 'platLog', 'platReviews'], gizle: { checks: ['payments', 'discount', 'tip', 'total'] }, saltOkunur: ['menu', 'mcats', 'tables', 'checks'], izinli: { checks: ['items'] } },
  },
  // apps/kuyumcu/app.js: Toptancı ekranı ve raporlar sahibinde. Tezgâhtar yetkili PIN'iyle kur girer, kur _settings'e yazılır (ayarIzinli). Stok formundaki tedarikçi öneri listesi boş kalır, alan serbest metindir.
  kuyumcu: { tezgah: { ad: 'Tezgâhtar', kapat: ['suppliers', 'supMoves'], ayarIzinli: ['hasBuy', 'hasSell', 'usd', 'eur', 'coinBuyCut', 'coinSellAdd', 'scrapCut', 'laborDefault', 'rateSource', 'rateAt', 'fxSource'] } },
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
};
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
  const b = { dept, ad: kayit ? kayit.name || '' : '', ids: (c) => new Set(satirlar(c).map((r) => r.id)), alanlar: (c, a) => new Set(satirlar(c).map((r) => r[a])) };
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
  if (k.suz) k.suz(o);
  return o;
}

// PUT ile gelen belgeyi, rolün yazamadığı her şeyi sunucudaki hâlinden alarak birleştirir. sunucudaki: version=base olan satırın ham belgesi.
function geriKoy(app, rol, gelen, sunucudaki, ek = {}) {
  const k = kuralBul(app, rol); if (!k) return gelen;
  const g = nesne(gelen) ? gelen : {}; const s = nesne(sunucudaki) ? sunucudaki : {}; const o = { ...g };
  const geri = (c) => { if (c in s) o[c] = s[c]; else delete o[c]; };
  ['users', '_settings', ...(k.kapat || [])].forEach(geri);
  if (k.ayarIzinli && nesne(g._settings)) { const y = { ...(nesne(s._settings) ? s._settings : {}) }; k.ayarIzinli.forEach((a) => { if (a in g._settings) y[a] = g._settings[a]; }); o._settings = y; }
  const b = k.satir ? baglam(k, s, ek) : null;
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
      const es = nesne(r) ? m.get(r.id) : null; if (!es) return r; const degisen = alanlar.filter((f) => JSON.stringify(r[f]) !== JSON.stringify(es[f])); if (!degisen.length) return r;
      if (ek.onay) { ek.onayKullanildi = true; return r; }
      const n = { ...r }; degisen.forEach((f) => { if (f in es) n[f] = es[f]; else delete n[f]; }); ek.reddedilen = [...new Set([...(ek.reddedilen || []), c])]; return n;
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
  if (k.sonra) k.sonra(o, s);
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
const onayRolleri = (app, rol) => { const k = kuralBul(app, rol); return k && k.onayli ? k.onayRol || ['admin'] : null; };
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
const rolVar = (app, rol) => typeof rol === 'string' && !!kuralBul(app, rol) && rol !== '*';

module.exports = { RULES, ORTAK, filtrele, geriKoy, rolCoz, rolYaz, rollerTemizle, rolVar, programlar, onayRolleri, kisiler, kisiBilgi };
