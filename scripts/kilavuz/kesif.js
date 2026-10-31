// Kılavuz yazarken ilk adım: programın gerçek menüsünü, düğmelerini ve alanlarını çıkarır; ezbere düğme adı yazılmaz.
//   node scripts/kilavuz/kesif.js <program>                       tüm menü
//   node scripts/kilavuz/kesif.js <program> urunler --tikla "button@Yeni ürün"     tek ekran, tıklama sonrası
const fs = require('fs'); const path = require('path'); const { chrome, sunucu, wait } = require('./cdp');
const YARDIM = fs.readFileSync(path.join(__dirname, 'sayfa.js'), 'utf8');
(async () => {
  const a = process.argv.slice(2); const id = a.shift(); const tik = []; const hedef = []; while (a.length) { const x = a.shift(); if (x === '--tikla') tik.push(a.shift()); else hedef.push(x); }
  const s = await sunucu(); const ch = await chrome(9472); const p = await ch.yeni();
  try {
    const ac = async (r) => { await p.git(`${s.adres}/apps/${id}/?demo=1#/${r}`); await wait(700); await p.calistir(YARDIM); };
    await ac(''); const nav = await p.calistir(`[...document.querySelectorAll('.ns-nav a[data-nav]')].map(a=>[a.dataset.nav,a.innerText.trim()])`);
    if (!hedef.length) console.log('MENÜ', JSON.stringify(nav), '\nKULLANICI', await p.calistir(`document.querySelector('.ns-user')?.innerText`));
    for (const [r, ad] of hedef.length ? hedef.map((x) => [x, x]) : nav) {
      await ac(r); for (const t of tik) { if (!await p.calistir(`__k.tikla(${JSON.stringify(t)})`)) console.log('  TIKLANAMADI', t); await wait(450); }
      console.log(`\n# ${r} (${ad})\n` + JSON.stringify(await p.calistir('__k.ozet()')));
    }
    if (p.hatalar.length) console.log('\nKONSOL HATALARI\n' + [...new Set(p.hatalar)].join('\n'));
  } finally { await ch.kapat(); await s.kapat(); }
})().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
