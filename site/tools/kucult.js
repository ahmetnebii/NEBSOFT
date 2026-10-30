// Tanıtım sitelerindeki pc-1.jpg için 640 px genişliğinde küçük kopya üretir: node site/tools/kucult.js
// Bağımlılıksızdır: yüklü Chrome'u başsız çalıştırıp görseli tuvalde küçültür. Yol farklıysa: CHROME=... node site/tools/kucult.js. Node 22+ gerekir.
const { spawn, spawnSync } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const SITE = path.join(__dirname, '..');
const CH = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((x) => fs.existsSync(x));
if (!CH) { console.error('Chrome bulunamadı. CHROME ortam değişkeniyle yol verin.'); process.exit(1); }
const port = 9334; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kucult-'));
const ch = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const kapat = () => { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(ch.pid), '/T', '/F']); else ch.kill(); }; // Windows'ta alt süreçler de kapansın
(async () => {
  let pg; for (let i = 0; i < 50 && !pg; i++) { try { pg = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch (e) { /* açılıyor */ } if (!pg) await wait(200); }
  const ws = new WebSocket(pg.webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
  let id = 0; const pend = {}; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; } };
  const c = (method, params) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  let n = 0;
  for (const d of fs.readdirSync(SITE)) {
    const f = path.join(SITE, d, 'img', 'pc-1.jpg'); const hedef = path.join(SITE, d, 'img', 'pc-1-640.jpg');
    if (!fs.existsSync(f) || (fs.existsSync(hedef) && fs.statSync(hedef).mtimeMs >= fs.statSync(f).mtimeMs)) continue;
    const b64 = fs.readFileSync(f).toString('base64');
    const r = await c('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const w=640,h=Math.round(i.height*w/i.width),k=document.createElement('canvas');k.width=w;k.height=h;const x=k.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(i,0,0,w,h);ok(k.toDataURL('image/jpeg',.74))};i.onerror=no;i.src='data:image/jpeg;base64,${b64}'})` });
    if (!r.result || !r.result.value) { console.error('küçültülemedi:', f); continue; }
    fs.writeFileSync(hedef, Buffer.from(r.result.value.split(',')[1], 'base64')); n++;
  }
  console.log(`✓ ${n} küçük görsel üretildi`); ws.close(); kapat(); await wait(300); process.exit(0);
})().catch((e) => { console.error(e); kapat(); process.exit(1); });
