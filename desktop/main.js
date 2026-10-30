// NEBSOFT masaüstü — Electron ana süreci
//  • Açılışta animasyonlu karşılama, ardından NEBSOFT girişi; giriş sonrası lisansa göre tek program doğrudan, birden fazlaysa seçici açılır
//    (aynı akış web sitesiyle ortaktır: /#/giris → /#/programlarim).
//  • Donanım köprüsü: paketteki server.js 127.0.0.1 üzerinde başlatılır; programlar ağ yazıcısı, terazi, SMS vekili gibi
//    işlemleri window.nebsoftDesktop.bridge ile bu yerel köprüye yaptırır (bulut sunucusu yerel ağa erişemez).
//  • Sessiz yazdırma, sistem tepsisi (pencere kapansa da sipariş/garson bildirimleri çalar), kiosk modu, ikinci pencere (mutfak ekranı), otomatik güncelleme.
const { app, BrowserWindow, ipcMain, shell, Menu, Tray, nativeImage, session, dialog } = require('electron');
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');

const CFG = (() => { const d = { serverUrl: '', bridgePort: 5051, minimizeToTray: true }; try { return { ...d, ...JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')) }; } catch (e) { return d; } })();
const USER_CFG = path.join(app.getPath('userData'), 'ayarlar.json');
const ucfg = () => { try { return JSON.parse(fs.readFileSync(USER_CFG, 'utf8')); } catch (e) { return {}; } };
const saveUcfg = (o) => { try { fs.writeFileSync(USER_CFG, JSON.stringify({ ...ucfg(), ...o }, null, 2)); } catch (e) { /* yok */ } };
const SERVER = () => String(process.env.NEBSOFT_URL || ucfg().serverUrl || CFG.serverUrl || '').replace(/\/$/, '');
// Örnek/yer tutucu adresler (domain.com, example.com) gerçek sunucu değildir: bunlara gidilirse Cloudflare "you have been blocked" sayfası döner
const PLACEHOLDER = /(^|\.)(domain|example)\.(com|org|net)$/i;
// Varsayılan sunucu adresleri tek yerde: nebsoft-pazar/sunucu.json ("adresler" sırayla denenir; ilki çalışmazsa sıradaki)
const DEFAULTS = (() => { try { const f = app.isPackaged ? path.join(process.resourcesPath, 'web', 'sunucu.json') : path.join(__dirname, '..', 'sunucu.json'); return (JSON.parse(fs.readFileSync(f, 'utf8')).adresler || []).map((x) => String(x).replace(/\/$/, '')).filter(Boolean); } catch (e) { return []; } })();
const needsSetup = () => { const s = SERVER(); if (!s) return true; try { return PLACEHOLDER.test(new URL(s).hostname); } catch (e) { return true; } };
// Bazı güvenlik duvarları "Electron" geçen tarayıcı kimliğini bot sayar: standart Chrome kimliği + NEBSOFT işareti kullanılır
const UA = () => `Mozilla/5.0 (${process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'Windows NT 10.0; Win64; x64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36 NEBSOFT-Desktop/${app.getVersion()}`;
// Sunucu testi: /api/auth/me NEBSOFT yanıtı vermeli; engelleme sayfası (403/HTML) anlaşılır mesaja çevrilir
async function testServer(url, ms = 12000) {
  let u; try { u = new URL(url); } catch (e) { return { ok: false, error: 'Geçerli bir adres girin (ör. https://www.nebsoft.com.tr)' }; }
  if (PLACEHOLDER.test(u.hostname)) return { ok: false, error: `"${u.hostname}" örnek bir adrestir, NEBSOFT sunucusu değildir. Kendi alan adınızı yazın.` };
  try {
    const r = await fetch(u.origin + '/api/auth/me', { headers: { 'User-Agent': UA(), 'x-ns-csrf': '1' }, signal: AbortSignal.timeout(ms) });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* HTML */ }
    if (j && j.ok !== undefined && ('mode' in j)) return { ok: true, mode: j.mode };
    if (/blocked|cloudflare|attention required|access denied/i.test(t)) return { ok: false, error: `Sunucunun güvenlik duvarı (ör. Cloudflare) uygulamayı engelliyor (HTTP ${r.status}). Barındırma panelinde "NEBSOFT-Desktop" tarayıcı kimliğine ve /api/ yoluna izin verin (DEPLOY.md → Masaüstü uygulaması).` };
    return { ok: false, error: `Bu adreste NEBSOFT bulunamadı (HTTP ${r.status}). Adresi kontrol edin.` };
  } catch (e) { return { ok: false, error: 'Sunucuya ulaşılamadı: ' + (e.name === 'TimeoutError' ? 'zaman aşımı' : e.message) }; }
}
// Kullanıcı adres girmediyse varsayılanlar sırayla denenir; çalışan ilk adres kaydedilir (sonra elle değiştirilebilir)
async function pickServer(skip) { for (const u of DEFAULTS) { if (u === skip) continue; const r = await testServer(u, 6000); if (r.ok) { saveUcfg({ serverUrl: u, auto: true }); return u; } } return ''; }
const userChose = () => !!process.env.NEBSOFT_URL || (!!ucfg().serverUrl && !ucfg().auto);
ipcMain.handle('ns:testServer', (e, url) => testServer(String(url || '')));
ipcMain.handle('ns:setServer', (e, url) => { saveUcfg({ serverUrl: String(url).replace(/\/$/, ''), auto: false }); if (main) main.loadURL(`${SERVER()}/?desktop=1#/giris`); return true; });
const setupUrl = (q = {}) => require('url').pathToFileURL(path.join(__dirname, 'setup.html')).href + '?' + new URLSearchParams(q).toString();
const ICON = fs.existsSync(path.join(__dirname, 'icon.png')) ? path.join(__dirname, 'icon.png') : undefined; // isteğe bağlı: desktop/icon.png (512×512)

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }
let main = null; let splash = null; let tray = null; let bridgeProc = null; let quitting = false;

// ---------- Yerel donanım köprüsü ----------
function startBridge() {
  const web = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, '..');
  const file = path.join(web, 'server.js'); if (!fs.existsSync(file)) return;
  bridgeProc = spawn(process.execPath, [file], { cwd: web, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: String(CFG.bridgePort), HOST: '127.0.0.1', NEBSOFT_DATA: path.join(app.getPath('userData'), 'kopru') }, stdio: 'ignore', windowsHide: true });
  bridgeProc.on('exit', () => { bridgeProc = null; });
}
ipcMain.handle('ns:bridge', async (e, pathname, body) => {
  if (typeof pathname !== 'string' || !/^\/[a-z0-9/_-]{1,60}$/i.test(pathname)) return { ok: false, error: 'Geçersiz köprü isteği' };
  try {
    const r = await fetch(`http://127.0.0.1:${CFG.bridgePort}/api${pathname}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await r.json();
  } catch (x) { return { ok: false, error: 'Yerel köprü çalışmıyor: ' + x.message }; }
});

// ---------- Sessiz yazdırma ----------
ipcMain.handle('ns:printers', async () => (main ? (await main.webContents.getPrintersAsync()).map((p) => ({ name: p.name, displayName: p.displayName })) : [])); // isDefault Electron 36'da kaldırıldı; boş deviceName sessiz yazdırmada sistemin varsayılan yazıcısını kullanır
ipcMain.handle('ns:print', async (e, html, opts = {}) => {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } });
  await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif}</style></head><body>${String(html)}</body></html>`));
  const printer = opts.deviceName || ucfg().printer || '';
  return new Promise((res) => w.webContents.print({ silent: opts.silent !== false, printBackground: true, deviceName: printer, copies: opts.copies || 1 }, (ok, err) => { w.destroy(); res({ ok, error: err || null }); }));
});
ipcMain.handle('ns:setting', (e, k, v) => { if (v !== undefined) saveUcfg({ [k]: v }); return ucfg()[k]; });
ipcMain.handle('ns:newWindow', (e, url) => { const u = new URL(url, SERVER()); if (u.origin !== new URL(SERVER()).origin) return false; createMain(u.href); return true; });
ipcMain.handle('ns:kiosk', (e, on) => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.setKiosk(!!on); return true; });

// ---------- Seri port (terazi, seri yazıcı) ----------
// Electron'da navigator.serial.requestPort seçimi ana süreçte yapılır: tek port doğrudan seçilir, birden fazlaysa kullanıcıya sorulur.
// İzin bellekte tutulduğu için seçilen portlar ayarlara yazılır; program yeniden açılınca kullanıcı hareketi beklenmeden getPorts ile gelir.
const sameOrigin = (u) => { try { return !!SERVER() && new URL(u).origin === new URL(SERVER()).origin; } catch (e) { return false; } };
const portKey = (p) => [p.vendorId || '', p.productId || '', p.serialNumber || p.portName || ''].join(':');
const rememberPort = (p) => { const l = ucfg().serialPorts || []; if (!l.includes(portKey(p))) saveUcfg({ serialPorts: [...l, portKey(p)] }); };
function serialSetup(ses) {
  ses.setPermissionCheckHandler((wc, perm, origin) => perm !== 'serial' || sameOrigin(origin)); // diğer izin denetimleri varsayılan gibi kalır
  ses.setDevicePermissionHandler((d) => d.deviceType !== 'serial' || (sameOrigin(d.origin) && (ucfg().serialPorts || []).includes(portKey(d.device))));
  ses.on('select-serial-port', async (ev, ports, wc, cb) => { ev.preventDefault();
    if (!sameOrigin(wc.getURL()) || !ports.length) return cb('');
    let i = 0; if (ports.length > 1) { const names = ports.map((p) => p.displayName || p.portName || p.portId); i = (await dialog.showMessageBox(BrowserWindow.fromWebContents(wc), { type: 'question', title: 'Seri port seçin', message: 'Cihazın bağlı olduğu portu seçin', buttons: [...names, 'Vazgeç'], cancelId: names.length })).response; }
    if (!ports[i]) return cb(''); rememberPort(ports[i]); cb(ports[i].portId); });
}

// ---------- Pencereler ----------
function createSplash() {
  splash = new BrowserWindow({ width: 420, height: 300, frame: false, transparent: false, resizable: false, alwaysOnTop: true, show: false, backgroundColor: '#09090b', icon: ICON });
  splash.loadFile(path.join(__dirname, 'splash.html'));
  splash.once('ready-to-show', () => splash.show());
}
function createMain(url) {
  const first = !main;
  const w = new BrowserWindow({ width: 1360, height: 860, minWidth: 980, minHeight: 640, show: false, backgroundColor: '#09090b', icon: ICON, title: 'NEBSOFT', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false } });
  // Giriş sayfası: oturum varsa web sitesi kullanıcıyı doğrudan programına götürür (tek program) ya da seçiciyi açar
  w.loadURL(url || (needsSetup() ? setupUrl({ u: DEFAULTS[0] || '' }) : `${SERVER()}/?desktop=1#/giris`));
  w.webContents.setWindowOpenHandler(({ url: u }) => { try { if (new URL(u).origin === new URL(SERVER()).origin) { createMain(u); return { action: 'deny' }; } } catch (e) { /* yok */ } shell.openExternal(u); return { action: 'deny' }; });
  w.webContents.on('will-navigate', (ev, u) => { if (u.startsWith('file:') || u.startsWith('data:')) return; try { const o = new URL(u).origin; if (!SERVER() || o !== new URL(SERVER()).origin) { ev.preventDefault(); shell.openExternal(u); } } catch (e) { ev.preventDefault(); } });
  // Güvenlik duvarı engelleme sayfası geldiyse: açıklayıcı ekran + adresi değiştirme
  w.webContents.on('did-finish-load', async () => { try { const u = w.webContents.getURL(); if (!/^https?:/.test(u)) return; const t = await w.webContents.executeJavaScript('document.title + " " + (document.body ? document.body.innerText.slice(0, 400) : "")'); if (/you have been blocked|attention required|access denied|cloudflare ray id/i.test(t)) w.loadURL(setupUrl({ u: SERVER(), e: 'Sunucunun güvenlik duvarı uygulamayı engelledi. Adres doğruysa barındırma panelinde "NEBSOFT-Desktop" tarayıcı kimliğine izin verin; adres yanlışsa aşağıdan düzeltin.' })); } catch (e) { /* yok */ } });
  w.webContents.on('did-fail-load', async (ev, code, desc, u, isMain) => { if (!isMain || code === -3 || String(u).startsWith('file:') || String(u).startsWith('data:')) return;
    // Varsayılan adres açılmazsa (ör. IP değişti) sıradaki varsayılan adres denenir; kullanıcının kendi girdiği adres değiştirilmez
    if (!userChose()) { const alt = await pickServer(SERVER()); if (alt) return w.loadURL(`${alt}/?desktop=1#/giris`); }
    w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(offlineHtml(desc))); });
  w.once('ready-to-show', () => { setTimeout(() => { if (splash) { splash.destroy(); splash = null; } w.show(); }, first ? 900 : 0); });
  w.on('close', (e) => { if (first && CFG.minimizeToTray && !quitting && BrowserWindow.getAllWindows().length === 1) { e.preventDefault(); w.hide(); if (tray) tray.displayBalloon && tray.displayBalloon({ title: 'NEBSOFT arka planda çalışıyor', content: 'Sipariş ve çağrı bildirimleri gelmeye devam edecek. Kapatmak için tepsi simgesinden Çıkış seçin.' }); } });
  if (first) main = w;
  return w;
}
const offlineHtml = (desc) => `<!doctype html><meta charset="utf-8"><body data-setup="${setupUrl({ u: SERVER() })}" style="margin:0;display:grid;place-items:center;height:100vh;background:#09090b;color:#e5e7eb;font-family:Segoe UI,Arial,sans-serif;text-align:center"><div><h2>Sunucuya ulaşılamıyor</h2><p style="color:#9ca3af">İnternet bağlantınızı kontrol edin. (${String(desc).replace(/[<>&]/g, '')})</p><p><button onclick="location.href='${SERVER()}/#/giris'" style="padding:10px 18px;border-radius:10px;border:0;background:#4f46e5;color:#fff;font-size:15px;cursor:pointer">Tekrar dene</button> <button onclick="location.href=document.body.dataset.setup" style="padding:10px 18px;border-radius:10px;border:1px solid #3f3f55;background:transparent;color:#fff;font-size:15px;cursor:pointer">Sunucu adresini değiştir</button></p></div></body>`;

function createTray() {
  try {
    const img = ICON ? nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }) : nativeImage.createEmpty();
    tray = new Tray(img); tray.setToolTip('NEBSOFT');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'NEBSOFT’u aç', click: () => { if (main) { main.show(); main.focus(); } } },
      { label: 'Programlarım', click: () => { if (main) { main.show(); main.loadURL(`${SERVER()}/#/programlarim`); } } },
      { label: 'Yeni pencere (ör. mutfak ekranı)', click: () => createMain(`${SERVER()}/#/programlarim`) },
      { type: 'separator' },
      { label: 'Çıkış', click: () => { quitting = true; app.quit(); } },
    ]));
    tray.on('click', () => { if (main) { main.show(); main.focus(); } });
  } catch (e) { tray = null; }
}
function appMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'NEBSOFT', submenu: [{ label: 'Programlarım', accelerator: 'CmdOrCtrl+Shift+P', click: () => main && main.loadURL(`${SERVER()}/#/programlarim`) }, { label: 'Yeni pencere', accelerator: 'CmdOrCtrl+N', click: () => createMain(`${SERVER()}/#/programlarim`) }, { label: 'Sunucu adresini değiştir', click: () => main && main.loadURL(setupUrl({ u: SERVER() })) }, { type: 'separator' }, { role: 'reload', label: 'Yenile' }, { role: 'togglefullscreen', label: 'Tam ekran' }, { label: 'Kasa (kiosk) modu', accelerator: 'F10', click: (m, w) => w && w.setKiosk(!w.isKiosk()) }, { type: 'separator' }, { label: 'Çıkış', accelerator: 'CmdOrCtrl+Q', click: () => { quitting = true; app.quit(); } }] },
    { label: 'Düzen', submenu: [{ role: 'undo', label: 'Geri al' }, { role: 'redo', label: 'Yinele' }, { type: 'separator' }, { role: 'cut', label: 'Kes' }, { role: 'copy', label: 'Kopyala' }, { role: 'paste', label: 'Yapıştır' }, { role: 'selectAll', label: 'Tümünü seç' }] },
    { label: 'Görünüm', submenu: [{ role: 'zoomIn', label: 'Büyüt' }, { role: 'zoomOut', label: 'Küçült' }, { role: 'resetZoom', label: 'Gerçek boyut' }, { type: 'separator' }, { role: 'toggleDevTools', label: 'Geliştirici araçları' }] },
  ]));
}

app.on('second-instance', () => { if (main) { if (main.isMinimized()) main.restore(); main.show(); main.focus(); } });
app.whenReady().then(async () => {
  app.setAppUserModelId('com.nebsoft.masaustu');
  app.userAgentFallback = UA(); session.defaultSession.setUserAgent(UA());
  // Bildirim ve kamera/mikrofon izinleri yalnızca NEBSOFT sunucusu için
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, d) => { let ok = false; try { ok = !!SERVER() && new URL(d.requestingUrl).origin === new URL(SERVER()).origin && ['notifications', 'media', 'clipboard-sanitized-write', 'fullscreen'].includes(perm); } catch (e) { ok = false; } cb(ok); });
  serialSetup(session.defaultSession);
  startBridge(); createSplash(); appMenu(); createTray();
  if (!userChose() && !ucfg().serverUrl) await pickServer();
  createMain();
  // Güncellemeler kullanıcının bağlandığı sunucunun /indir/ klasöründen alınır (paketteki örnek adrese gidilmez)
  if (app.isPackaged && !needsSetup()) { try { const { autoUpdater } = require('electron-updater'); autoUpdater.setFeedURL({ provider: 'generic', url: SERVER() + '/indir/' }); autoUpdater.on('error', () => { /* güncelleme sunucusu yoksa sessiz geç */ }); autoUpdater.checkForUpdatesAndNotify().catch(() => {}); } catch (e) { /* geliştirme ortamı */ } }
});
app.on('before-quit', () => { quitting = true; if (bridgeProc) bridgeProc.kill(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (main) main.show(); });
