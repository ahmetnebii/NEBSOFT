// Hazır paketler: liste market/paketler.js'ten okunur, tutar yalnızca burada hesaplanır.
// Paket ayrı ürün değildir, içindeki programların sepete eklenmiş halidir. Bu yüzden fiyat, sepetle aynı yoldan geçer: catalog.price + indirim.hesapla.
// Sepette paket bilgisi kullanılmaz: sipariş tutarı yine kalemlerden çıkar, istemciden gelen hiçbir tutara bakılmaz.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cat = require('./catalog');
const indirim = require('./indirim');

const FILE = path.join(__dirname, '..', '..', 'market', 'paketler.js');
let cache = null; let mtime = 0;
function load() {
  const m = fs.statSync(FILE).mtimeMs;
  if (!cache || m !== mtime) { const w = {}; vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), { window: w }); cache = w.PAKETLER; mtime = m; }
  return cache;
}
const liste = () => load().liste;
const bul = (id) => liste().find((p) => p.id === id) || null;
// Satışta olmayan program: yönetim panelinden gizlenen veya yeni satışa kapalı olan
const eksik = (p) => p.programlar.filter((pid) => !cat.satista(pid));
const tl = (k) => Math.round(k) / 100;
function tutar(p, plan, period, opt) {
  const r = indirim.hesapla({ lines: cat.price([...p.programlar].map((pid) => ({ pid, plan, period, qty: 1 }))).lines }, { kdv: cat.VAT, ...opt });
  return { liste: r.subtotal, indirim: r.indirim ? { yuzde: r.indirim.yuzde, tutar: r.indirim.tutar, ad: r.indirim.ad } : null, net: tl(Math.round(r.subtotal * 100) - Math.round(r.discount * 100)), kdv: r.vat, toplam: r.total };
}
function fiyat(p, opt = {}) {
  const yok = eksik(p);
  if (yok.length) return { satista: false, eksik: yok, planlar: [] };
  return { satista: true, eksik: [], planlar: [0, 1, 2].map((plan) => ({ plan, aylik: tutar(p, plan, 'aylik', opt), yillik: tutar(p, plan, 'yillik', opt) })) };
}
const pub = () => liste().map((p) => ({ id: p.id, ad: p.ad, ...fiyat(p) }));
// Pakette yalnız satıştaki program olabilir; sayfa üretimi ve test bu denetimden geçer
function dogrula() {
  const L = liste(); const hatalar = [];
  if (new Set(L.map((p) => p.id)).size !== L.length) hatalar.push('paket kimliği tekrarlı');
  L.forEach((p) => { if (!/^[a-z0-9-]+$/.test(p.id)) hatalar.push(`${p.id}: kimlik adrese uygun değil`); if (p.programlar.length < 2) hatalar.push(`${p.id}: en az iki program gerekir`); if (new Set(p.programlar).size !== p.programlar.length) hatalar.push(`${p.id}: program tekrarlı`); eksik(p).forEach((x) => hatalar.push(`${p.id}: ${x} satışta değil`)); });
  return hatalar;
}
// Öneri sihirbazı: sektör paketi seçer, çalışan sayısı planı (Başlangıç 2, Profesyonel 10 kullanıcı), ihtiyaç program listesini belirler.
// Karar ve tutar burada verilir; "is" yalnız ana programı önerir, diğerleri paketi tutar ve eksik programı ekler.
const CALISAN = { '1-2': 0, '3-10': 1, '11+': 2 };
const IHTIYAC = { hepsi: { ad: 'tüm işler' }, is: { ad: 'günlük iş takibi' }, para: { ad: 'Fatura, cari ve kasa', pid: 'muhasebe' }, musteri: { ad: 'Müşteri ve teklif takibi', pid: 'crm' }, personel: { ad: 'Puantaj ve bordro', pid: 'ik' } };
function oner({ sektor, calisan, ihtiyac }, opt = {}) {
  const hatali = () => Object.assign(new Error('Geçersiz seçim'), { status: 400 });
  if (!Object.prototype.hasOwnProperty.call(CALISAN, calisan) || !Object.prototype.hasOwnProperty.call(IHTIYAC, ihtiyac)) throw hatali();
  if (sektor === 'diger') return { paket: null, satista: false };
  const p = bul(sektor); if (!p) throw hatali();
  const paketOzet = { id: p.id, ad: p.ad, kim: p.kim };
  if (eksik(p).length) return { paket: paketOzet, satista: false };
  const plan = CALISAN[calisan]; const planlar = cat.load().plans; const hedef = IHTIYAC[ihtiyac]; const neden = [];
  let liste = [...p.programlar]; let eklenen = null;
  if (ihtiyac === 'is') { liste = liste.slice(0, 1); neden.push(`Öncelik günlük iş takibi olduğu için ${cat.product(liste[0]).name} ile başlamak yeterli. Tüm paketi sonra da alabilirsiniz.`); }
  else if (hedef.pid && !liste.includes(hedef.pid) && cat.satista(hedef.pid)) { liste.push(hedef.pid); eklenen = hedef.pid; neden.push(`${p.ad} paketinde ${cat.product(hedef.pid).name} yok. ${hedef.ad} ihtiyacınız için ekledik.`); }
  else if (hedef.pid) neden.push(`${hedef.ad} için ${cat.product(hedef.pid).name} pakette var.`);
  else neden.push(`${p.ad} paketi ${p.kim.toLocaleLowerCase('tr')} için gereken programları bir arada sunar.`);
  neden.push(`${calisan === '11+' ? '11 ve üzeri' : calisan} kişi için ${planlar[plan].name} planını seçtik (${planlar[plan].users}).`);
  return { paket: paketOzet, satista: true, tek: liste.length === 1, plan, planAd: planlar[plan].name, eklenen, neden, programlar: liste.map((id) => { const x = cat.product(id); return { id, ad: x.name, tanim: x.tagline }; }), aylik: tutar({ programlar: liste }, plan, 'aylik', opt), yillik: tutar({ programlar: liste }, plan, 'yillik', opt) };
}
// Ekranda tutar: küsurat varsa iki hane, yoksa hanesiz
const yazi = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);

module.exports = { load, liste, bul, eksik, fiyat, pub, dogrula, oner, yazi };
