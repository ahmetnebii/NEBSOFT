// Kılavuzun yazdırılacak HTML'i. Görüntüler dosya olarak bağlanır: Chrome JPEG'i yeniden kodlamadan PDF'e gömer.
const { svg } = require('./cizim');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// **ad** ekrandaki adı, [yazı](https://...) dış bağlantıyı gösterir
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="ad">$1</b>').replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
const liste = (L) => `<ul>${L.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
const tablo = (b, L) => `<table><thead><tr>${b.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${L.map((r) => `<tr>${r.map((x) => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

const CSS = (a) => `
@page { size: A4; margin: 20mm 17mm 18mm 17mm; }
@page :first { margin: 0; }
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:"Segoe UI",Arial,"Liberation Sans",sans-serif;font-size:10.5pt;line-height:1.5;color:#1f2733}
.kapak{height:297mm;width:210mm;display:flex;flex-direction:column;justify-content:space-between;padding:30mm 22mm 24mm;background:#fff;page-break-after:always;break-after:page;position:relative}
.kapak:before{content:'';position:absolute;left:0;right:0;top:12mm;height:5mm;background:${a}}
.kapak img{width:58mm;height:auto}
.kapak h1{font-size:40pt;line-height:1.1;margin:0 0 4mm;color:#111827;font-weight:700;border:0;padding:0}
.kapak .alt{font-size:18pt;color:${a};font-weight:600;margin:0 0 8mm}
.kapak .tan{font-size:12pt;color:#4b5563;max-width:140mm;margin:0}
.kapak dl{display:grid;grid-template-columns:34mm 1fr;gap:1.5mm 4mm;margin:0;font-size:10pt;color:#4b5563}
.kapak dt{font-weight:600;color:#111827}.kapak dd{margin:0}
.ic{page-break-after:always;break-after:page}
.ic h2{margin-top:0}
.ic ol{list-style:none;margin:0;padding:0}
.ic li a{display:flex;align-items:baseline;gap:6px;color:#1f2733;text-decoration:none;padding:1.1mm 0}
.ic li.b a{font-weight:600}
.ic li.a a{padding-left:7mm;font-size:9.5pt;color:#4b5563}
.ic .n{order:3;font-variant-numeric:tabular-nums}.ic .c{order:2;flex:1;border-bottom:1px dotted #9ca3af;transform:translateY(-3px)}
h1,h2,h3,h4{color:#111827;line-height:1.25;break-after:avoid;page-break-after:avoid}
h2{font-size:20pt;margin:0 0 3mm;padding-bottom:2mm;border-bottom:2.5pt solid ${a}}
section.b{break-before:page;page-break-before:always}
h3{font-size:13.5pt;margin:7mm 0 2mm}
h4{font-size:11pt;margin:5mm 0 1.5mm}
p{margin:0 0 2.5mm}p.bag{break-after:avoid;page-break-after:avoid}ul,ol{margin:0 0 3mm;padding-left:6mm}li{margin-bottom:1mm}
.ad{font-weight:600;color:#111827;background:#f1f3f7;border-radius:3px;padding:0 3px}
a{color:${a}}
table{border-collapse:collapse;width:100%;margin:2mm 0 4mm;font-size:9.5pt;break-inside:auto}
tr{break-inside:avoid;page-break-inside:avoid}
th{text-align:left;background:#f1f3f7;color:#111827;padding:1.5mm 2mm;border-bottom:1pt solid #cbd2dc}
td{padding:1.5mm 2mm;border-bottom:.5pt solid #e2e6ec;vertical-align:top}
figure{margin:3mm 0 2mm;break-inside:avoid;page-break-inside:avoid}
.sek{position:relative;border:.5pt solid #cbd2dc;border-radius:2px;overflow:hidden;line-height:0}
.sek img{width:100%;height:auto;display:block}
.sek svg{position:absolute;inset:0;width:100%;height:100%;font-family:"Segoe UI",Arial,sans-serif}
.sahne{break-inside:avoid;page-break-inside:avoid;margin-bottom:4mm}
ol.adim{list-style:none;padding:0;margin:2mm 0 0}
ol.adim li{display:flex;gap:2.5mm;margin-bottom:1.4mm;align-items:flex-start}
.nk{flex:0 0 5.4mm;height:5.4mm;border-radius:50%;background:#e11d48;color:#fff;font-size:8.5pt;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:.3mm}
.nk.b{background:#6b7280}
.not{border-left:2.5pt solid ${a};background:#f7f8fb;padding:2mm 3mm;margin:3mm 0;break-inside:avoid;font-size:9.8pt}
.uy{border-left:2.5pt solid #b45309;background:#fff8ec;padding:2mm 3mm;margin:3mm 0;break-inside:avoid;font-size:9.8pt}
.yok{border-left:2.5pt solid #b91c1c;background:#fdf1f1;padding:2mm 3mm;margin:3mm 0;break-inside:avoid;font-size:9.8pt}
.etk{display:inline-block;font-size:8.5pt;font-weight:600;border-radius:3px;padding:0 4px;white-space:nowrap}
.etk.ok{background:#e6f5ec;color:#116b3a}.etk.ki{background:#fff3dc;color:#8a5200}.etk.no{background:#fde8e8;color:#991b1b}
.c2{word-break:break-word}
`;

// Küçük pencere gereksiz büyümesin, uzun ekran sayfayı doldurmasın: 174 mm metin genişliği, en çok 165 mm yükseklik
const olcu = (im) => Math.min(174, im.w * 0.2, 165 * im.w / im.h).toFixed(1);
// Sahne: görüntü + çizim + numaralı adımlar. sira, görev içinde devam eden adım numarasıdır.
function sahneHtml(s, sira) {
  const im = s.cekim; const say = { n: sira };
  const satir = s.adimlar.map((a) => { const no = ++say.n; return `<li><span class="nk${a.isaretli ? '' : ' b'}">${no}</span><span>${md(a.metin)}</span></li>`; }).join('');
  let n = sira; const isaret = s.adimlar.map((a) => { n++; return a.isaretli ? { kutu: a.kutu, tur: a.tur, no: n } : null; }).filter(Boolean);
  return { html: `<div class="sahne"><figure><div class="sek" style="width:${olcu(im)}mm"><img src="${im.dosya}" alt="${esc(s.baslik || 'Ekran görüntüsü')}" width="${im.w}" height="${im.h}">${svg(isaret, im.w, im.h)}</div></figure>${satir ? `<ol class="adim">${satir}</ol>` : ''}</div>`, n: say.n };
}
const gorevHtml = (g) => { let n = 0; return `<h4>${esc(g.baslik)}</h4>${g.ne ? `<p class="bag">${md(g.ne)}</p>` : ''}${g.sahneler.map((s) => { const r = sahneHtml(s, n); n = r.n; return r.html; }).join('')}`; };

const modulHtml = (m, no) => `<section class="b" id="${m.capa}"><h2>${no}. ${esc(m.baslik)}</h2><p>${md(m.ne)}</p>
${(m.gorevler || []).map(gorevHtml).join('')}
${(m.alanlar || []).length ? `<h4>Alanların anlamı</h4>${tablo(['Alan', 'Anlamı'], m.alanlar.map(([a, b]) => [`**${a.replace(/^~/, '')}**`, b]))}` : ''}
${(m.hatalar || []).length ? `<h4>Sık hatalar ve çözümü</h4>${tablo(['Karşılaşılan durum', 'Çözüm'], m.hatalar)}` : ''}
${m.not ? `<div class="not">${md(m.not)}</div>` : ''}</section>`;

// D: { K, urun, surum, tarih, logo, renk, bolumler: [{capa, baslik, alt:[{capa,baslik}], html}], sayfa: {capa: no} }
function belge(D) {
  const toc = D.bolumler.map((b, i) => `<li class="b"><a href="#${b.capa}"><span>${i + 1}. ${esc(b.baslik)}</span><span class="c"></span><span class="n">${(D.sayfa || {})[b.capa] || '00'}</span></a></li>${(b.alt || []).map((a) => `<li class="a"><a href="#${a.capa}"><span>${esc(a.baslik)}</span><span class="c"></span><span class="n">${(D.sayfa || {})[a.capa] || '00'}</span></a></li>`).join('')}`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(D.urun.name)} kullanım kılavuzu</title><meta name="author" content="NEBSOFT"><style>${CSS(D.renk)}</style></head><body>
<div class="kapak"><div><img src="${D.logo}" alt="NEBSOFT"></div><div><h1>${esc(D.urun.name)}</h1><p class="alt">Kullanım Kılavuzu</p><p class="tan">${esc(D.urun.tagline || '')}</p></div>
<dl><dt>Program sürümü</dt><dd>${esc(D.surum)}</dd><dt>Üretim tarihi</dt><dd>${esc(D.tarih)}</dd><dt>Ekran görüntüleri</dt><dd>Programın demo modundan alındı, örnek verilerdeki kişi ve işletme adları kurgudur.</dd></dl></div>
<div class="ic"><h2>İçindekiler</h2><ol>${toc}</ol></div>
${D.bolumler.map((b) => b.html).join('\n')}
</body></html>`;
}
const baslikSablon = (ad) => `<div style="width:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:8px;color:#6b7280;padding:0 17mm;display:flex;justify-content:space-between"><span>NEBSOFT</span><span>${esc(ad)} kullanım kılavuzu</span></div>`;
const altSablon = (surum) => `<div style="width:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:8px;color:#6b7280;padding:0 17mm;display:flex;justify-content:space-between"><span>${esc(surum)}</span><span>Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
module.exports = { esc, md, liste, tablo, gorevHtml, modulHtml, belge, baslikSablon, altSablon };
