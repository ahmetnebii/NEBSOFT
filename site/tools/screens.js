// Tanıtım siteleri için ekran görüntüleri: node site/tools/screens.js [ürün-id ...]
// Önce "node server.js" çalışmalı. Çıktı: site/<slug>/img/*.jpg  (PC 1440×900, mobil 390×844 @2x)
const path = require('path'); const fs = require('fs');
const { chromium } = require('playwright');
const PRODUCTS = require('../src/products');
const BASE = process.env.SITE_BASE || 'http://localhost:5050';
const OUT = path.join(__dirname, '..');
const HIDE = '.ns-demo-bar{display:none!important} .ns-toasts{display:none!important} *{caret-color:transparent!important;animation:none!important;transition:none!important} .tk-bar,.top,.bar,.topbar{position:relative!important}';

// Giriş gerektiren müşteri sayfaları için demo oturumu
const PREP = {
  'site/sakin.html': () => { sessionStorage.setItem('nebsoft:site:sakin', 'A1'); },
  'spor/uye.html': () => { const db = new NS.DB('spor'); const m = db.all('members').find((x) => x.end >= NS.today()); sessionStorage.setItem('nebsoft:spor:uye', m.id); },
  'kurs/veli.html': () => { const db = new NS.DB('kurs'); sessionStorage.setItem('nebsoft:kurs:veli', String(db.all('students')[0].parentPhone).replace(/\D/g, '').slice(-10)); },
  'veteriner/karne.html': () => { const db = new NS.DB('veteriner'); const o = db.all('owners').find((x) => db.all('pets', (p) => p.owner === x.id).length > 1) || db.all('owners')[0]; sessionStorage.setItem('nebsoft:vet:sahip', o.id); },
  'fabrika/bayi.html': () => { sessionStorage.setItem('nebsoft:fab:bayi', 'm0'); },
  'musavir/portal.html': () => { sessionStorage.setItem('nebsoft:musavir:portal', 'm1'); },
  'toptan/bayi.html': () => { sessionStorage.setItem('nebsoft:toptan:bayi', 'c2'); },
  'hukuk/muvekkil.html': () => { sessionStorage.setItem('nebsoft:hukuk:portal', 'k1'); },
  'anaokulu/veli.html': () => { const db = new NS.DB('anaokulu'); const s = db.all('students').find((x) => db.data.reports[`${x.id}|${NS.today()}`]) || db.all('students')[0]; sessionStorage.setItem('nebsoft:anaokulu:veli', String(s.parents[0].phone).replace(/\D/g, '').slice(-10)); },
};
// Sorgu gerektiren sayfalar için örnek kayıt
const QUERY = {
  'servis/takip.html': () => '?kod=' + (new NS.DB('servis').all('tickets').find((t) => t.status === 'onay') || new NS.DB('servis').all('tickets')[0]).code,
  'kargo/takip.html': () => '?no=' + (new NS.DB('kargo').all('ships').find((s) => s.status === 'dagitimda') || new NS.DB('kargo').all('ships')[0]).no,
  'otoservis/onay.html': () => '?k=' + OTS.token(new NS.DB('otoservis').all('jobs').find((j) => j.status === 'onay') || new NS.DB('otoservis').all('jobs').find((j) => j.status === 'islemde')),
  'oto/arac.html': () => '?plaka=' + encodeURIComponent((new NS.DB('oto').all('jobs').find((j) => j.status === 'bekliyor') || {}).plate || ''),
};

async function shot(page, url, file, prepKey) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: HIDE });
  if (prepKey && (PREP[prepKey] || QUERY[prepKey])) {
    if (PREP[prepKey]) await page.evaluate(PREP[prepKey]);
    const q = QUERY[prepKey] ? await page.evaluate(QUERY[prepKey]) : '';
    await page.goto(url.split('?')[0] + (q || (url.includes('?') ? '?' + url.split('?')[1] : '')), { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: HIDE });
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
}

(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch();
  for (const p of PRODUCTS.filter((x) => !only.length || only.includes(x.id))) {
    const dir = path.join(OUT, p.slug, 'img'); fs.mkdirSync(dir, { recursive: true });
    const desk = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const mob = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const dp = await desk.newPage(), mp = await mob.newPage();
    // Demo verisi her bağlamda bir kez yüklensin
    for (const pg of [dp, mp]) { await pg.goto(`${BASE}/apps/${p.id}/index.html?demo=1`); await pg.waitForTimeout(700); }
    for (const [i, [route]] of p.shots.entries()) await shot(dp, `${BASE}/apps/${p.id}/index.html?demo=1#/${route}`, path.join(dir, `pc-${i + 1}.jpg`));
    await shot(mp, `${BASE}/apps/${p.id}/index.html?demo=1#/${p.mobile}`, path.join(dir, 'mobil-1.jpg'));
    for (const [i, [url]] of (p.pub || []).entries()) {
      const key = url.replace(/^apps\//, '').split('?')[0];
      await shot(dp, `${BASE}/${url}`, path.join(dir, `musteri-pc-${i + 1}.jpg`), key);
      await shot(mp, `${BASE}/${url}`, path.join(dir, `musteri-mobil-${i + 1}.jpg`), key);
    }
    await desk.close(); await mob.close();
    console.log('✓', p.slug, fs.readdirSync(dir).length, 'görsel');
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
