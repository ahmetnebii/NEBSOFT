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
//   sonra       (sonuc, sunucudaki) => void  programa özel tutarlılık adımı
// Her kuralda ek olarak: users[].pin gizlenir ve users korunur, _meta.ownerPin gizlenir, _settings değişmez, işlem geçmişi (_log) okunmaz ve yalnızca eklenir.
// Yeni program için RULES'e kayıt eklemek yeterlidir; diğer programların rolleri yalnızca arayüzdedir.
const RULES = {
  // apps/klinik/app.js: clinical() sekreterde kapalı (anamnez, muayene notu, tanı, reçete, e-Nabız). Yönetim menüsü (hakediş, tedavi listesi, hekimler, raporlar) yöneticide.
  // Hasta silme yöneticide (canDelete). Telefon, TC, kan grubu, Not alanı, tedavi planı, ödeme, randevu nedeni sekreterin ekranlarında kullanılır, açık kalır.
  klinik: { sekreter: { ad: 'Sekreter', gizle: { patients: ['anamnez', 'meds'], doctors: ['rate'] }, kapat: ['visits', 'prescriptions'], saltOkunur: ['doctors', 'treatments'], silemez: ['patients'] } },
  // apps/eczane/app.js: Kurum Mutabakatı ve Kontrole Tabi Defter yalnızca eczacıda; hasta silme eczacıda.
  // Kalfanın satışı deftere kayıt ekler (ctrl), bu yüzden defter "ekle" kuralındadır. Eczacı PIN'iyle onaylanan iade defterde "iade" olarak işaretlenir (sonra).
  // Alerji, kronik ilaç, TC ve satış geçmişi satış ekranında gerekir, açık kalır.
  eczane: { kalfa: { ad: 'Kalfa / teknisyen', kapat: ['claims'], ekle: ['ctrl'], silemez: ['patients'], sonra: (o) => { const iptal = new Set(dizi(o.sales).filter((s) => s && s.canceled).map((s) => s.no)); if (iptal.size && Array.isArray(o.ctrl)) o.ctrl = o.ctrl.map((c) => (c && iptal.has(c.saleNo) && !c.canceled ? { ...c, canceled: true } : c)); } } },
  // apps/veteriner/app.js: canAct → "muayene, aşı ve tedavi kaydı hekimindir; asistan görür, onam alır, satış yapar". Asistan muayene ve aşıyı görür, gizlenecek alan yoktur;
  // kayıtları değiştiremez. Aşı hatırlatma SMS'i asistana açık olduğu için hatırlatma işareti yazılabilir. Sahip silme yöneticide; hayvan silme ekranı yoktur.
  veteriner: { asistan: { ad: 'Asistan', saltOkunur: ['visits', 'vaccines'], izinli: { vaccines: ['reminded', 'remindTest'] }, silemez: ['owners', 'pets'] } },
  // apps/ik/app.js: şef yalnızca kendi departmanını görür (inScope), personel ekranı salt okunur, maaş sütunu ve TC araması kapalı; Bordro ve Belge & Zimmet yöneticide.
  // Telefon (vardiya ve izin SMS'i), doğum tarihi (doğum günü kartı, izin hakkı) ve izin hakkı alanları şefin ekranlarında gerekir, açık kalır.
  // Kapalı dönem bilgisi puantajı kilitlediği için payClosed görünür, maaş satırları (rows) gizlidir.
  ik: { sef: { ad: 'Departman şefi', gizle: { employees: ['salary', 'salaryType', 'tc', 'iban', 'portalCode', 'exit'], payClosed: ['rows'] }, kapat: ['advances', 'files'], ekle: ['sms'], saltOkunur: ['employees', 'payClosed'], kapsam: { kok: 'employees', alan: 'dept', bagli: { leaves: 'emp', signedDocs: 'party' }, bosSerbest: ['signedDocs'], anahtar: ['ts', 'roster'] } } },
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
const kisi = (anahtar) => String(anahtar).split('|')[0];
const icinde = (ka, c, alan, ids, r) => nesne(r) && (ids.has(r[alan]) || ((ka.bosSerbest || []).includes(c) && r[alan] == null));

// İstemciye gidecek görünüm. Girdi değişmez.
function filtrele(app, rol, belge, ek = {}) {
  const k = kuralBul(app, rol); if (!k || !nesne(belge)) return belge;
  const o = { ...belge };
  for (const c of [...(k.kapat || []), ...ekleListe(k)]) if (c in o) { const b = bos(o[c]); if (b === undefined) delete o[c]; else o[c] = b; }
  if (Array.isArray(o.users)) o.users = o.users.map((u) => { if (!nesne(u)) return u; const { pin, ...r } = u; return r; });
  if (nesne(o._meta)) { const { ownerPin, ...r } = o._meta; o._meta = r; }
  for (const [c, alanlar] of Object.entries(k.gizle || {})) if (Array.isArray(o[c])) o[c] = o[c].map((r) => { if (!nesne(r)) return r; const n = { ...r }; alanlar.forEach((f) => delete n[f]); return n; });
  const ids = kapsamId(k, belge, ek);
  if (ids) {
    const { kok, bagli = {}, anahtar = [] } = k.kapsam;
    if (Array.isArray(o[kok])) o[kok] = o[kok].filter((r) => nesne(r) && ids.has(r.id));
    for (const [c, alan] of Object.entries(bagli)) if (Array.isArray(o[c])) o[c] = o[c].filter((r) => icinde(k.kapsam, c, alan, ids, r));
    for (const c of anahtar) if (nesne(o[c])) o[c] = Object.fromEntries(Object.entries(o[c]).filter(([a]) => ids.has(kisi(a))));
  }
  return o;
}

// PUT ile gelen belgeyi, rolün yazamadığı her şeyi sunucudaki hâlinden alarak birleştirir. sunucudaki: version=base olan satırın ham belgesi.
function geriKoy(app, rol, gelen, sunucudaki, ek = {}) {
  const k = kuralBul(app, rol); if (!k) return gelen;
  const g = nesne(gelen) ? gelen : {}; const s = nesne(sunucudaki) ? sunucudaki : {}; const o = { ...g };
  const geri = (c) => { if (c in s) o[c] = s[c]; else delete o[c]; };
  ['users', '_settings', ...(k.kapat || [])].forEach(geri);
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
    geri(c); const izin = (k.izinli || {})[c]; if (!izin || !Array.isArray(s[c])) continue;
    const m = idHarita(g[c]);
    o[c] = s[c].map((r) => { const x = nesne(r) ? m.get(r.id) : null; if (!x) return r; const n = { ...r }; izin.forEach((f) => { if (f in x) n[f] = x[f]; else delete n[f]; }); return n; });
  }
  for (const [c, alanlar] of Object.entries(k.gizle || {})) {
    if (salt.has(c)) continue;
    if (!Array.isArray(g[c])) { geri(c); continue; }
    const m = idHarita(s[c]);
    o[c] = g[c].map((r) => { if (!nesne(r)) return r; const n = { ...r }; const es = m.get(r.id); alanlar.forEach((f) => { if (es && f in es) n[f] = es[f]; else delete n[f]; }); return n; });
  }
  for (const c of k.silemez || []) {
    if (!Array.isArray(s[c])) continue;
    if (!Array.isArray(o[c])) { o[c] = s[c]; continue; }
    const var_ = new Set(o[c].map((x) => x && x.id)); const eksik = s[c].filter((r) => nesne(r) && !var_.has(r.id));
    if (eksik.length) o[c] = [...o[c], ...eksik];
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
      if (nesne(s[c])) for (const [a, v] of Object.entries(s[c])) if (!ids.has(kisi(a))) n[a] = v;
      for (const [a, v] of Object.entries(g[c])) if (ids.has(kisi(a))) n[a] = v;
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
const kapsamli = (app, rol) => { const k = kuralBul(app, rol); return !!(k && k.kapsam); };
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
const programlar = () => Object.entries(RULES).map(([app, roller]) => ({ app, roller: Object.entries(roller).map(([id, k]) => ({ id, ad: k.ad || id, departman: !!k.kapsam })) }));
const rolVar = (app, rol) => typeof rol === 'string' && !!kuralBul(app, rol) && rol !== '*';

module.exports = { RULES, ORTAK, filtrele, geriKoy, rolCoz, rolYaz, rollerTemizle, rolVar, programlar };
