// Yüklü Chrome'u başsız açıp DevTools protokolüyle süren küçük istemci. Bağımlılıksızdır, Node 22+ yerleşik WebSocket kullanır.
// Yol farklıysa: CHROME=... ortam değişkeni. Sunucu yardımcısı da buradadır: kılavuz üretimi kendi sunucusunu açar, başka oturumun portuna dokunmaz.
const { spawn, spawnSync } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = () => process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((x) => fs.existsSync(x));
const durdur = (ch) => { if (!ch || ch.killed) return; if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(ch.pid), '/T', '/F'], { stdio: 'ignore' }); else ch.kill(); };

async function ws(url) {
  const s = new WebSocket(url); await new Promise((ok, no) => { s.onopen = ok; s.onerror = () => no(new Error('Chrome bağlantısı kurulamadı')); });
  let id = 0; const pend = new Map(); const dinle = new Set();
  s.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const [ok, no] = pend.get(d.id); pend.delete(d.id); return d.error ? no(new Error(`${d.error.message} ${d.error.data || ''}`)) : ok(d.result); } [...dinle].forEach((f) => f(d)); };
  const send = (method, params = {}) => new Promise((ok, no) => { const i = ++id; pend.set(i, [ok, no]); s.send(JSON.stringify({ id: i, method, params })); });
  return { send, dinle, kapat: () => s.close() };
}

// Sayfa istemcisi: git, calistir, goruntu, pdf. Konsol hataları `hatalar` dizisinde toplanır.
async function sekme(c, { en = 1200, boy = 760, olcek = 1 } = {}) {
  const hatalar = []; await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
  c.dinle.add((d) => {
    if (d.method === 'Runtime.exceptionThrown') hatalar.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon|service worker/i.test(d.params.entry.text + d.params.entry.url)) hatalar.push(d.params.entry.text + ' ' + (d.params.entry.url || ''));
  });
  const boyut = (e, b, o = olcek) => c.send('Emulation.setDeviceMetricsOverride', { width: e, height: b, deviceScaleFactor: o, mobile: false });
  await boyut(en, boy);
  // Demo verisi rastgele üretilir: aynı tohum her üretimde aynı örnekleri verir, seçiciler veriye göre oynamaz
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'let __t=20261031;Math.random=()=>{__t=(__t*1664525+1013904223)>>>0;return __t/4294967296;};' });
  const calistir = async (expression) => { const r = await c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'sayfa hatası').slice(0, 400)); return r.result.value; };
  // Yalnız #adres değişirse Chrome yükleme olayı vermez: her gidişte sayfa baştan açılsın diye önce boş sayfaya dönülür
  const yukle = async (url) => { const y = new Promise((ok) => { const f = (d) => { if (d.method === 'Page.loadEventFired') { c.dinle.delete(f); ok(); } }; c.dinle.add(f); }); await c.send('Page.navigate', { url }); await Promise.race([y, wait(15000)]); };
  const git = async (url) => { await yukle('about:blank'); await yukle(url); };
  const goruntu = async (kes, kalite = 72) => { const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: kalite, ...(kes ? { clip: { ...kes, scale: 1 } } : {}) }); return Buffer.from(r.data, 'base64'); };
  const pdf = async (o) => Buffer.from((await c.send('Page.printToPDF', o)).data, 'base64');
  return { c, hatalar, boyut, calistir, git, goruntu, pdf };
}

// Chrome'u başlatır; yeni() ile sekme açılır
async function chrome(port = 9471) {
  const yol = CHROME(); if (!yol) throw new Error('Chrome bulunamadı. CHROME ortam değişkeniyle yol verin.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kilavuz-'));
  const ch = spawn(yol, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', '--lang=tr-TR', 'about:blank'], { stdio: 'ignore' });
  let hedef; for (let i = 0; i < 100 && !hedef; i++) { try { hedef = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch (e) { /* açılıyor */ } if (!hedef) await wait(150); }
  if (!hedef) { durdur(ch); throw new Error('Chrome açılamadı'); }
  const kapat = async () => { durdur(ch); await wait(250); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Windows dosyayı geç bırakır */ } };
  return { yeni: async (o) => sekme(await ws((await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()).webSocketDebuggerUrl), o), kapat };
}

// Yerel sunucu: PORT ve NEBSOFT_DATA verilmezse 5121 ve geçici veri klasörü. KILAVUZ_ADRES verilirse çalışan sunucu kullanılır.
async function sunucu() {
  if (process.env.KILAVUZ_ADRES) return { adres: process.env.KILAVUZ_ADRES.replace(/\/$/, ''), kapat: async () => {} };
  const port = Number(process.env.PORT) || 5121; const data = process.env.NEBSOFT_DATA || fs.mkdtempSync(path.join(os.tmpdir(), 'kilavuz-veri-'));
  const adres = `http://127.0.0.1:${port}`;
  const s = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), NEBSOFT_DATA: data }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(adres + '/core/core.js')).ok) return { adres, kapat: async () => { durdur(s); } }; } catch (e) { /* açılıyor */ } await wait(150); }
  durdur(s); throw new Error('Yerel sunucu açılmadı: ' + adres);
}
module.exports = { chrome, sunucu, wait, ROOT };
