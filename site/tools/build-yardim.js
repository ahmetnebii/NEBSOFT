/* Yardım merkezi üreticisi → core/yardim.json (site ve destek asistanı) + docs/video/<program>.md (60–90 sn senaryo).
   Kaynaklar: site/tools/yardim-icerik.js, core/kurulum-adimlari.js, market/catalog.js. Çalıştırma: node site/tools/build-yardim.js */
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
global.window = global.window || {}; require(path.join(ROOT, 'market', 'catalog.js')); const C = window.CATALOG;
const Y = require('./yardim-icerik'); const K = require(path.join(ROOT, 'core', 'kurulum-adimlari.js'));
const WPS = 2.2; // Türkçe anlatım hızı (saniyede sözcük, yaklaşık)
const EKRAN = { Açılış: 1, İpucu: 2, Kapanış: 2 }; const GOREV = 7; // anlatım dışında ekrandaki tıklama ve geçiş payı (sn)
const duz = (s) => String(s).replace(/\*\*/g, '');
const say = (s) => duz(s).trim().split(/\s+/).filter(Boolean).length;
const sahneler = (p, y) => [
  ['Açılış', y.kanca, `${p.name} ana ekranı`],
  ...y.gorevler.map(([b, a]) => [b, a.map(duz).join(' '), `Demo: ${a.filter((x) => x.includes('**')).map((x) => (x.match(/\*\*(.+?)\*\*/) || [])[1]).slice(0, 3).join(' → ')}`]),
  ['İpucu', y.ipucu, 'İlgili ekranda imleçle gösterim'],
  ['Kapanış', `${p.name} programını yedi gün ücretsiz deneyebilirsiniz. Takıldığınız yerde yardım merkezine bakın veya destek ekibimize yazın.`, 'Yardım merkezi bağlantısı ve iletişim bilgisi'],
];
const out = [];
for (const p of C.products) {
  const y = Y[p.id]; if (!y) throw new Error('İçerik yok: ' + p.id);
  out.push({ id: p.id, name: p.name, tagline: p.tagline, kurulum: K.list(p.id).map((s) => ({ t: s.t, d: s.d })), gorevler: y.gorevler.map(([b, a]) => ({ b, a })), ipucu: y.ipucu, sss: [...y.sss, ...(p.faq || [])] });
  const S = sahneler(p, y); let t = 0; const satir = S.map(([b, m, g]) => { const sn = Math.round(say(m) / WPS) + (EKRAN[b] ?? GOREV); const a = t; t += sn; return `| ${a}–${t} sn | ${b} | ${duz(m)} | ${g} |`; });
  fs.mkdirSync(path.join(ROOT, 'docs', 'video'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'video', `${p.id}.md`), `# ${p.name} — tanıtım videosu senaryosu\n\nSüre: yaklaşık ${t} saniye · Ekran kaydı: \`/apps/${p.id}/?demo=1\` (örnek veriler) · Dil: Türkçe\n\nKayıt sırasında müşteri verisi, gerçek telefon veya gerçek işletme adı görünmez. Senaryoda sonuç vaadi ve rakam yoktur.\n\n| Zaman | Bölüm | Anlatım | Ekranda |\n|---|---|---|---|\n${satir.join('\n')}\n\n<!-- üretildi: site/tools/build-yardim.js -->\n`);
}
fs.writeFileSync(path.join(ROOT, 'core', 'yardim.json'), JSON.stringify({ n: out.length, items: out }));
console.log('Yardım merkezi:', out.length, 'program');
module.exports = { say, sahneler, WPS };
