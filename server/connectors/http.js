// Pazaryeri adaptörleri için ortak HTTP: zaman aşımı, yeniden deneme (429/5xx), Basic auth, JSON
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, { method = 'GET', headers = {}, body, timeout = 20000, retries = 2 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { method, headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
      clearTimeout(t);
      const text = await r.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if ((r.status === 429 || r.status >= 500) && attempt < retries) { await sleep(Number(r.headers.get('retry-after')) * 1000 || 1500 * (attempt + 1)); continue; }
      return { ok: r.ok, status: r.status, data, error: r.ok ? null : errText(r.status, data) };
    } catch (e) {
      clearTimeout(t);
      if (attempt < retries) { await sleep(1000 * (attempt + 1)); continue; }
      return { ok: false, status: 0, data: null, error: e.name === 'AbortError' ? 'Zaman aşımı' : 'Bağlantı hatası: ' + e.message };
    }
  }
}
function errText(status, data) {
  const msg = data && typeof data === 'object' ? (data.message || data.errorMessage || (data.errors && data.errors[0] && (data.errors[0].message || data.errors[0].key)) || JSON.stringify(data).slice(0, 300)) : String(data || '').slice(0, 300);
  if (status === 401 || status === 403) return `Yetki hatası (${status}): API anahtarı/gizli anahtar veya satıcı no hatalı. ${msg}`;
  if (status === 404) return `Uç nokta bulunamadı (404). Adres ayarlarını kontrol edin. ${msg}`;
  if (status === 429) return 'Çok fazla istek (429): pazaryeri hız sınırı aşıldı, biraz sonra tekrar deneyin';
  return `HTTP ${status}: ${msg}`;
}
const basic = (user, pass) => 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

module.exports = { request, basic, chunk, sleep };
