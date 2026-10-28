// Web sayfasına açılan güvenli masaüstü arayüzü (window.nebsoftDesktop). Yalnızca tanımlı işlemler; Node erişimi yok.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nebsoftDesktop', {
  isDesktop: true,
  platform: process.platform,
  bridge: (pathname, body) => ipcRenderer.invoke('ns:bridge', pathname, body), // yerel donanım köprüsü (yazıcı, terazi, SMS vekili)
  print: (html, opts) => ipcRenderer.invoke('ns:print', html, opts), // sessiz yazdırma
  printers: () => ipcRenderer.invoke('ns:printers'),
  setting: (k, v) => ipcRenderer.invoke('ns:setting', k, v),
  newWindow: (url) => ipcRenderer.invoke('ns:newWindow', url),
  kiosk: (on) => ipcRenderer.invoke('ns:kiosk', on),
  testServer: (url) => ipcRenderer.invoke('ns:testServer', url), // ilk kurulum: sunucu adresi
  setServer: (url) => ipcRenderer.invoke('ns:setServer', url),
});
