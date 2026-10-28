// Kanal kaydı: doğrudan API adaptörü olan kanallar ve webhook ile sipariş gönderen (push) platformlar
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ADAPTERS = { trendyol: require('./trendyol'), hepsiburada: require('./hepsiburada'), n11: require('./n11') };
// Siparişi kendi sunucumuza POST eden platformlar: satıcı paneline webhook adresi girilir
const PUSH = ['trendyol', 'hepsiburada', 'getir', 'getircarsi', 'yemeksepeti', 'ysmarket', 'trendyolgo', 'trendyolyemek', 'migrosyemek', 'n11', 'amazon', 'pazarama', 'ciceksepeti'];
const DATA = path.join(__dirname, '..', '..', 'data');
const INBOX = path.join(DATA, 'inbox');

function info() { return { adapters: Object.fromEntries(Object.entries(ADAPTERS).map(([k, a]) => [k, a.actions])), push: PUSH }; }
async function run(channel, action, creds, payload) {
  const a = ADAPTERS[channel];
  if (!a) return { ok: false, unsupported: true, error: `${channel} için doğrudan API adaptörü yok. Siparişler webhook ile alınır (/api/webhook/${channel}); ürün/stok gönderimi için yetkili entegratör adresi Entegrasyonlar sayfasından tanımlanır.` };
  try { return await a.run(action, creds, payload); } catch (e) { return { ok: false, error: e.message }; }
}

// Webhook belirteci: data/webhook-token.txt (ilk çalıştırmada üretilir) veya NEBSOFT_WEBHOOK_TOKEN
function token() {
  if (process.env.NEBSOFT_WEBHOOK_TOKEN) return process.env.NEBSOFT_WEBHOOK_TOKEN;
  const f = path.join(DATA, 'webhook-token.txt');
  if (!fs.existsSync(f)) { fs.mkdirSync(DATA, { recursive: true }); fs.writeFileSync(f, crypto.randomBytes(18).toString('hex')); }
  return fs.readFileSync(f, 'utf8').trim();
}
const safeEq = (a, b) => { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
function pushIn(channel, tok, body) {
  if (!PUSH.includes(channel)) return { code: 404, body: { ok: false, error: 'Bilinmeyen kanal' } };
  if (!safeEq(tok || '', token())) return { code: 401, body: { ok: false, error: 'Geçersiz belirteç' } };
  fs.mkdirSync(INBOX, { recursive: true });
  const f = path.join(INBOX, channel + '.json');
  const list = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8') || '[]') : [];
  list.push({ id: crypto.randomUUID(), at: new Date().toISOString(), body });
  if (list.length > 2000) list.splice(0, list.length - 2000);
  fs.writeFileSync(f, JSON.stringify(list));
  return { code: 200, body: { ok: true } };
}
// Panel gelen kutusunu okur ve boşaltır
function drain(channel) {
  const f = path.join(INBOX, channel + '.json');
  if (!fs.existsSync(f)) return [];
  const list = JSON.parse(fs.readFileSync(f, 'utf8') || '[]'); fs.writeFileSync(f, '[]');
  return list;
}
module.exports = { run, info, token, pushIn, drain, PUSH };
