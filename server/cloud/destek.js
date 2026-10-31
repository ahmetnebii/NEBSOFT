// Destek paketleri ve SLA: paketler config/destek-paketleri.json dosyasından gelir, kodda sabit değildir. Panelde kaydedilen ayar (settings: 'fiyat_destek') dosyanın önüne geçer.
// Süreler Türkiye saatine (UTC+3) göre yalnızca çalışma saatlerinde akar; talep açılırken sabitlenir, paket değişse de eski talep etkilenmez.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'config', 'destek-paketleri.json');
const TR = 3 * 3600e3; // Türkiye yaz-kış saati uygulamıyor
let cache = null; let mtime = 0; let panel = null;

function check(c) {
  if (!c || !c.paketler || !c.takvimler || !c.paketler[c.varsayilan]) throw new Error('destek-paketleri.json: paketler, takvimler veya varsayılan hatalı');
  Object.entries(c.takvimler).forEach(([k, t]) => { if (!Array.isArray(t.gunler) || !t.gunler.length || !(t.bas < t.bit)) throw new Error(`Takvim hatalı: ${k}`); });
  Object.entries(c.paketler).forEach(([k, p]) => { if (!c.takvimler[p.takvim]) throw new Error(`Paket takvimi yok: ${k}`); if (!(p.ilkYanitSaat > 0) || !(p.cozumSaat >= p.ilkYanitSaat) || !(p.aylik >= 0) || !Number.isInteger(p.oncelik)) throw new Error(`Paket hatalı: ${k}`); });
  return c;
}
// Bozuk kayıt satışı durdurmasın: geçersiz panel ayarı yok sayılır, dosya kullanılır
const panelAta = (c) => { try { panel = c ? check(c) : null; } catch (e) { panel = null; } };
const dosya = () => check(JSON.parse(fs.readFileSync(FILE, 'utf8')));
function load(file = FILE) {
  if (file !== FILE) return check(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (panel) return panel;
  const m = fs.statSync(file).mtimeMs; if (!cache || m !== mtime) { cache = check(JSON.parse(fs.readFileSync(file, 'utf8'))); mtime = m; } return cache;
}
const pack = (id, c = load()) => c.paketler[id] || c.paketler[c.varsayilan];
const packId = (id, c = load()) => (c.paketler[id] ? id : c.varsayilan);
// Sepet kalemi: yıllık alımda 10 ay (program fiyatlarıyla aynı kural)
function line(id, period, c = load()) {
  if (!c.paketler[id]) throw new Error('Geçersiz destek paketi'); const p = c.paketler[id]; const yil = period === 'yillik';
  return { type: 'support', pid: 'destek-' + id, plan: id, name: `${p.ad} destek paketi`, period: yil ? 'yillik' : 'aylik', qty: 1, price: p.aylik * (yil ? 10 : 1) };
}
// Çalışma saati ekler: başlangıçtan itibaren yalnızca takvimdeki saatlerde sayar
function addWork(start, hours, cal) {
  let t = new Date(start).getTime() + TR; let left = Math.round(hours * 3600e3); const H = 3600e3; const DAY = 24 * H;
  for (let guard = 0; guard < 4000; guard++) {
    const d = new Date(t); const day = d.getUTCDay(); const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); const open = base + cal.bas * H, close = base + cal.bit * H;
    if (!cal.gunler.includes(day) || t >= close) { t = base + DAY; continue; }
    if (t < open) t = open;
    const room = close - t; if (left <= room) return new Date(t + left - TR); left -= room; t = base + DAY;
  }
  throw new Error('SLA süresi hesaplanamadı');
}
// Yeni talebe yazılacak alanlar
function ticketFields(planId, at = new Date(), c = load()) {
  const id = packId(planId, c); const p = c.paketler[id]; const cal = c.takvimler[p.takvim];
  return { plan: id, priority: p.oncelik, first_due: addWork(at, p.ilkYanitSaat, cal), resolve_due: addWork(at, p.cozumSaat, cal) };
}
// Sayaç: ilk yanıt verilene dek ilk yanıt süresi, sonra çözüm süresi izlenir
function state(t, now = new Date()) {
  if (t.status === 'kapali' || t.closed_at) { const end = new Date(t.closed_at || t.updated || now); return { durum: t.resolve_due && end > new Date(t.resolve_due) ? 'gec-kapandi' : 'kapandi', kalanDk: 0 }; }
  const due = new Date(t.first_reply_at ? t.resolve_due : t.first_due); if (!t.first_due || Number.isNaN(due.getTime())) return { durum: 'yok', kalanDk: 0 };
  const dk = Math.round((due - new Date(now)) / 6e4); return { durum: dk < 0 ? 'asildi' : dk <= 60 ? 'yaklasti' : 'zamaninda', kalanDk: dk, asama: t.first_reply_at ? 'cozum' : 'ilk-yanit' };
}
const paid = (tenant, now = new Date()) => { const c = load(); return tenant && c.paketler[tenant.support_plan] && (!tenant.support_until || new Date(tenant.support_until) >= new Date(now)) ? tenant.support_plan : c.varsayilan; };

// Müşteriye gösterilecek takvim metni: yalnızca yapılandırmadaki gün ve saatlerden üretilir
const GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function takvimMetni(cal) {
  const g = [...cal.gunler].map((x) => (x === 0 ? 7 : x)).sort((a, b) => a - b); const ad = (x) => GUN[x % 7]; const ardisik = g.every((x, i) => !i || x === g[i - 1] + 1);
  return `${ardisik && g.length > 1 ? `${ad(g[0])}-${ad(g[g.length - 1])}` : g.map(ad).join(', ')} ${String(cal.bas).padStart(2, '0')}:00-${String(cal.bit).padStart(2, '0')}:00`;
}
// Sepet ve müşteri ekranı için paket listesi: rakamların tek kaynağı yapılandırma dosyasıdır
function pub(c = load()) {
  return Object.entries(c.paketler).map(([id, p]) => ({ id, ad: p.ad, kanallar: p.kanallar, ilkYanitSaat: p.ilkYanitSaat, cozumSaat: p.cozumSaat, takvim: takvimMetni(c.takvimler[p.takvim]), aylik: p.aylik, yillik: p.aylik * 10, oncelik: p.oncelik })).sort((a, b) => b.oncelik - a.oncelik);
}
const has = (id, c = load()) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(c.paketler, id);

module.exports = { load, dosya, panelAta, check, pack, packId, line, addWork, ticketFields, state, paid, pub, has, takvimMetni };
