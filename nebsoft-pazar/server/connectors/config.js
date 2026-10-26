// Uç nokta adresleri: endpoints.json + (varsa) data/endpoints.local.json ile birleştirilir
const fs = require('fs'); const path = require('path');
const base = require('./endpoints.json');
function load() {
  const out = JSON.parse(JSON.stringify(base));
  const local = path.join(__dirname, '..', '..', 'data', 'endpoints.local.json');
  if (fs.existsSync(local)) { try { const l = JSON.parse(fs.readFileSync(local, 'utf8')); Object.keys(l).forEach((k) => { out[k] = { ...(out[k] || {}), ...l[k] }; }); } catch (e) { console.warn('endpoints.local.json okunamadı:', e.message); } }
  // Test için tüm adresleri tek bir sahte sunucuya yönlendirme: NEBSOFT_MOCK=http://127.0.0.1:5099
  if (process.env.NEBSOFT_MOCK) Object.values(out).forEach((o) => Object.keys(o).forEach((k) => { if (/^https?:\/\//.test(o[k])) o[k] = process.env.NEBSOFT_MOCK; }));
  return out;
}
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(vars[k] ?? ''));
module.exports = { load, fill };
