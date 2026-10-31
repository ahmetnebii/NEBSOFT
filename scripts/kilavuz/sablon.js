// Kılavuzun yazdırılacak HTML'i. Görüntüler dosya olarak bağlanır: Chrome JPEG'i yeniden kodlamadan PDF'e gömer.
// Üstbilgi ve altbilgi CSS sayfa kenar kutularıyla çizilir (Chrome 131+): kapakta görünmez, sayfa numarası Chrome'dan gelir.
const { svg } = require('./cizim'); const { MARKA } = require('./ayar');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
// **ad** ekrandaki adı, [yazı](https://...) dış bağlantıyı gösterir
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="ad">$1</b>').replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
const liste = (L) => `<ul>${L.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
const tablo = (b, L) => `<table><thead><tr>${b.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${L.map((r) => `<tr>${r.map((x) => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

// Metin arkası desen: çok hafif, baskıda okunurluğu bozmaz, mürekkep harcamaz
const DESEN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M22 19.5v5M19.5 22h5' stroke='%231D7BF5' stroke-opacity='.07' stroke-width='.8'/%3E%3C/svg%3E")`;

const CSS = (D) => { const L = MARKA.lacivert; const M = MARKA.mavi; const a = D.renk; const k = '"Segoe UI",Arial,"Liberation Sans",sans-serif'; return `
@page { size: A4; margin: 25mm 18mm 20mm;
  @top-left { content: "NEBSOFT"; font: 700 8.5pt ${k}; letter-spacing: .08em; color: ${L}; vertical-align: bottom; padding-bottom: 2.2mm; margin-bottom: 5mm; border-bottom: 1pt solid ${M}; }
  @top-right { content: "${css(D.urun.name)} kullanım kılavuzu"; font: 8pt ${k}; color: #5b6b82; vertical-align: bottom; padding-bottom: 2.2mm; margin-bottom: 5mm; border-bottom: 1pt solid ${M}; }
  @bottom-left { content: "${css(D.surum)}"; font: 7.5pt ${k}; color: #7a8799; vertical-align: top; padding-top: 2mm; margin-top: 4mm; border-top: .5pt solid #d5deeb; }
  @bottom-right { content: "Sayfa " counter(page) " / " counter(pages); font: 600 8pt ${k}; color: ${L}; vertical-align: top; padding-top: 2mm; margin-top: 4mm; border-top: .5pt solid #d5deeb; }
}
@page :first { margin: 0; @top-left { content: none; border: 0; } @top-right { content: none; border: 0; } @bottom-left { content: none; border: 0; } @bottom-right { content: none; border: 0; } }
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
html{background:${DESEN}}
body{font-family:${k};font-size:10.4pt;line-height:1.52;color:#223044}
/* Kapak */
.kapak{position:relative;height:297mm;width:210mm;overflow:hidden;background:#fff;page-break-after:always;break-after:page}
.kapak>svg.zem{position:absolute;inset:0;width:210mm;height:297mm}
.kapak .logo{position:absolute;left:22mm;top:20mm;width:30mm;height:30mm;object-fit:contain;border-radius:5mm;box-shadow:0 2mm 7mm rgba(11,42,91,.25)}
.kapak .tur{position:absolute;right:22mm;top:24mm;font-size:9.5pt;letter-spacing:.2em;font-weight:600;color:#fff;text-transform:uppercase}
.kapak .ikon{position:absolute;left:22mm;top:102mm;width:27mm;height:27mm;border-radius:7mm;background:#fff;border:.6pt solid #d9e4f4;color:${a};display:flex;align-items:center;justify-content:center;box-shadow:0 1.6mm 6mm rgba(11,42,91,.14)}
.kapak .ikon svg{width:15mm;height:15mm;stroke-width:1.6}
.kapak .govde{position:absolute;left:22mm;right:22mm;top:138mm}
.kapak .ust{margin:0 0 3mm;font-size:10pt;font-weight:700;letter-spacing:.24em;color:${M};text-transform:uppercase}
.kapak h1{margin:0;font-size:43pt;line-height:1.06;font-weight:700;color:${L};letter-spacing:-.01em;border:0;padding:0}
.kapak .cizgi{width:26mm;height:1.5mm;background:linear-gradient(90deg,${M},${a});border-radius:1mm;margin:6mm 0 5.5mm}
.kapak .tan{margin:0;font-size:13.5pt;line-height:1.4;color:#3f5068;max-width:148mm}
.kapak .bilgi{position:absolute;left:22mm;right:22mm;bottom:27mm;display:grid;grid-template-columns:repeat(3,1fr);border-top:.8pt solid #cfdbec;padding-top:4mm}
.kapak .bilgi div span{display:block;font-size:7.8pt;letter-spacing:.14em;text-transform:uppercase;color:#7a8799;margin-bottom:1mm}
.kapak .bilgi div b{font-size:11pt;color:${L};font-weight:600}
.kapak .son{position:absolute;left:22mm;right:22mm;bottom:15mm;display:flex;justify-content:space-between;font-size:8pt;color:#7a8799}
/* İçindekiler */
.ic{page-break-after:always;break-after:page}
.ic h2{margin:0 0 5mm;font-size:24pt;color:${L}}
.ic ol{list-style:none;margin:0;padding:0}
.ic li.k{margin:4.5mm 0 1mm;font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${M}}
.ic li a{display:flex;align-items:baseline;gap:6px;color:#223044;text-decoration:none;padding:.9mm 0}
.ic li.b a{font-weight:600}
.ic li.a a{padding-left:6mm;font-size:9.3pt;color:#54657c}
.ic .n{order:3;font-variant-numeric:tabular-nums;color:${L}}.ic .c{order:2;flex:1;border-bottom:.7pt dotted #a9b6c8;transform:translateY(-3px)}
/* Kısım açılışı */
.kisim{break-before:page;page-break-before:always;break-after:page;page-break-after:always;height:246mm;position:relative;border-radius:5mm;overflow:hidden;background:linear-gradient(160deg,#eef4fe 0%,#f8fbff 55%,#fff 100%);border:.6pt solid #dbe6f6;padding:0 16mm}
.kisim svg{position:absolute;right:-26mm;top:-22mm;width:130mm;height:130mm}
.kisim .sira{position:absolute;left:16mm;top:92mm;font-size:9pt;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:${M}}
.kisim h2{position:absolute;left:16mm;right:16mm;top:100mm;margin:0;font-size:32pt;line-height:1.12;color:${L};font-weight:700}
.kisim p{position:absolute;left:16mm;right:30mm;top:133mm;margin:0;font-size:11.5pt;color:#46586f}
.kisim ul{position:absolute;left:16mm;right:16mm;top:158mm;margin:0;padding:0;list-style:none;columns:2;column-gap:8mm;font-size:9.6pt;color:${L}}
.kisim li{margin:0 0 1.5mm;break-inside:avoid;padding-left:4mm;position:relative}
.kisim li:before{content:'';position:absolute;left:0;top:2mm;width:1.6mm;height:1.6mm;border-radius:50%;background:${M}}
/* Bölüm başı */
section.b{break-before:page;page-break-before:always}
.bas{display:flex;gap:5mm;align-items:flex-start;background:linear-gradient(100deg,#eaf2fe 0%,#f6f9ff 62%,#fff 100%);border-left:1.4mm solid ${M};border-radius:0 3mm 3mm 0;padding:5mm 6mm;margin:0 0 5mm;break-inside:avoid}
.bas .no{flex:0 0 auto;font-size:27pt;line-height:1;font-weight:700;color:${M}}
.bas h2{margin:0 0 1mm;font-size:18.5pt;line-height:1.2;color:${L};font-weight:700}
.bas p{margin:0;color:#3f5068;font-size:10.2pt}
h3{font-size:13.2pt;margin:7mm 0 2mm;color:${L};break-after:avoid;page-break-after:avoid}
h3.alt{font-size:15pt;padding-bottom:1.2mm;border-bottom:1pt solid #cfe0fb}
h4{font-size:10.8pt;margin:4.5mm 0 1.4mm;color:${L};break-after:avoid;page-break-after:avoid}
/* Görev kutusu: uzun görev sayfaya bölünebildiği için başlık şerit olarak çizilir */
.gorev{display:flex;align-items:center;gap:2.4mm;margin:5.5mm 0 2.2mm;padding:1.8mm 3mm;background:#fff;border:.7pt solid #cfdff6;border-left:1.1mm solid ${L};border-radius:1.6mm;break-after:avoid;page-break-after:avoid}
.gorev span{font-size:7.2pt;font-weight:700;letter-spacing:.14em;color:${M};text-transform:uppercase}
.gorev h4{margin:0;font-size:11pt}
p{margin:0 0 2.4mm}p.bag{break-after:avoid;page-break-after:avoid}ul,ol{margin:0 0 3mm;padding-left:5.6mm}li{margin-bottom:.9mm}
.ad{font-weight:600;color:${L};background:#e8f0fd;border-radius:3px;padding:0 3px}
a{color:${M}}
table{border-collapse:separate;border-spacing:0;width:100%;margin:2mm 0 4mm;font-size:9.3pt;background:#fff;border:.6pt solid #d7e2f1;border-radius:2mm;overflow:hidden}
tr{break-inside:avoid;page-break-inside:avoid}
th{text-align:left;background:#edf3fc;color:${L};padding:1.6mm 2.2mm;font-size:8.8pt}
td{padding:1.5mm 2.2mm;border-top:.5pt solid #e3eaf4;vertical-align:top}
/* Görsel çerçevesi */
figure{margin:2.5mm 0 2mm;break-inside:avoid;page-break-inside:avoid}
.sek{border:.6pt solid #c9d6e8;border-radius:2mm;overflow:hidden;background:#fff;box-shadow:0 .7mm 2.2mm rgba(11,42,91,.16)}
.sek .ust{display:flex;align-items:center;gap:1mm;height:4.6mm;padding:0 2mm;background:#eef3fa;border-bottom:.5pt solid #d5deeb}
.sek .ust i{width:1.4mm;height:1.4mm;border-radius:50%;background:#bcc9db}
.sek .ust span{margin-left:1.6mm;font-size:6.8pt;line-height:1;color:#64748b;white-space:nowrap;overflow:hidden}
.res{position:relative;line-height:0}
.res img{width:100%;height:auto;display:block}
.res svg{position:absolute;inset:0;width:100%;height:100%;font-family:"Segoe UI",Arial,sans-serif}
.sahne{break-inside:avoid;page-break-inside:avoid;margin-bottom:3.5mm}
ol.adim{list-style:none;padding:0;margin:2mm 0 0}
ol.adim li{display:flex;gap:2.4mm;margin-bottom:1.2mm;align-items:flex-start}
.nk{flex:0 0 5.2mm;height:5.2mm;border-radius:50%;background:${MARKA.isaret};color:#fff;font-size:8.3pt;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:.3mm}
.nk.b{background:#7a8799}
/* Kutular */
.not,.uy,.yok{position:relative;padding:2.4mm 3.4mm 2.4mm 4mm;margin:3mm 0;break-inside:avoid;font-size:9.8pt;border-radius:2mm;border:.6pt solid}
.not:before,.uy:before,.yok:before{display:block;font-size:7.4pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:.6mm}
.not{background:#f1f6ff;border-color:#cfe0fb}.not:before{content:'İpucu';color:${M}}
.uy{background:#fff8ec;border-color:#f3dcb0}.uy:before{content:'Dikkat';color:#a35c00}
.yok{background:#f4f6fb;border-color:#d5deeb}.yok:before{content:'Bilgi';color:${L}}
.etk{display:inline-block;font-size:8.2pt;font-weight:600;border-radius:3px;padding:0 4px;white-space:nowrap}
.etk.ok{background:#e3f0ff;color:#0b4fa8}.etk.ki{background:#fff3dc;color:#8a5200}.etk.no{background:#eef1f6;color:#3f5068}
`; };

// Küçük pencere gereksiz büyümesin, uzun ekran sayfayı doldurmasın: 174 mm metin genişliği, en çok 160 mm yükseklik
const olcu = (im) => Math.min(174, im.w * 0.2, 160 * im.w / im.h).toFixed(1);
// Sahne: görüntü + çizim + numaralı adımlar. sira, görev içinde devam eden adım numarasıdır.
function sahneHtml(s, sira, ad) {
  const im = s.cekim; const say = { n: sira };
  const satir = s.adimlar.map((a) => { const no = ++say.n; return `<li><span class="nk${a.isaretli ? '' : ' b'}">${no}</span><span>${md(a.metin)}</span></li>`; }).join('');
  let n = sira; const isaret = s.adimlar.map((a) => { n++; return a.isaretli ? { kutu: a.kutu, tur: a.tur, no: n } : null; }).filter(Boolean);
  return { html: `<div class="sahne"><figure><div class="sek" style="width:${olcu(im)}mm"><div class="ust"><i></i><i></i><i></i><span>${esc(s.baslik || ad || '')}</span></div><div class="res"><img src="${im.dosya}" alt="${esc(s.baslik || 'Ekran görüntüsü')}" width="${im.w}" height="${im.h}">${svg(isaret, im.w, im.h)}</div></div></figure>${satir ? `<ol class="adim">${satir}</ol>` : ''}</div>`, n: say.n };
}
const gorevHtml = (g) => { let n = 0; return `<div class="gorev"><span>Görev</span><h4>${esc(g.baslik)}</h4></div>${g.ne ? `<p class="bag">${md(g.ne)}</p>` : ''}${g.sahneler.map((s) => { const r = sahneHtml(s, n, g.baslik); n = r.n; return r.html; }).join('')}`; };
const bolumBas = (no, baslik, ne) => `<header class="bas"><span class="no">${String(no).padStart(2, '0')}</span><div><h2>${esc(baslik)}</h2>${ne ? `<p>${ne}</p>` : ''}</div></header>`;

const modulHtml = (m, no) => `<section class="b" id="${m.capa}">${bolumBas(no, m.baslik, md(m.ne))}
${(m.gorevler || []).map(gorevHtml).join('')}
${(m.alanlar || []).length ? `<h4>Alanların anlamı</h4>${tablo(['Alan', 'Anlamı'], m.alanlar.map(([a, b]) => [`**${a.replace(/^~/, '')}**`, b]))}` : ''}
${(m.hatalar || []).length ? `<h4>Sık hatalar ve çözümü</h4>${tablo(['Karşılaşılan durum', 'Çözüm'], m.hatalar)}` : ''}
${m.not ? `<div class="not">${md(m.not)}</div>` : ''}</section>`;

function kapak(D) {
  const L = MARKA.lacivert; const M = MARKA.mavi; const a = D.renk;
  const zem = `<svg class="zem" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><defs><linearGradient id="kl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L}"/><stop offset="1" stop-color="#123e86"/></linearGradient><linearGradient id="km" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${M}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>
    <rect width="210" height="297" fill="#fff"/><path d="M0 0H210V62C150 96 74 84 0 118Z" fill="url(#kl)"/><path d="M0 118C74 84 150 96 210 62V66.5C150 100 74 88 0 122.5Z" fill="url(#km)"/>
    <g fill="none" stroke="#fff" stroke-opacity=".11" stroke-width=".35"><circle cx="176" cy="20" r="26"/><circle cx="176" cy="20" r="40"/><circle cx="176" cy="20" r="54"/><circle cx="176" cy="20" r="68"/></g>
    <g fill="${M}" fill-opacity=".1"><circle cx="196" cy="250" r="1"/><circle cx="186" cy="250" r="1"/><circle cx="176" cy="250" r="1"/><circle cx="196" cy="240" r="1"/><circle cx="186" cy="240" r="1"/><circle cx="196" cy="230" r="1"/></g></svg>`;
  return `<div class="kapak">${zem}<img class="logo" src="${D.logo}" alt="NEBSOFT"><span class="tur">Kullanım kılavuzu</span>
<div class="ikon">${D.ikon || ''}</div>
<div class="govde"><p class="ust">NEBSOFT programı</p><h1>${esc(D.urun.name)}</h1><div class="cizgi"></div><p class="tan">${esc(D.urun.tagline || '')}</p></div>
<div class="bilgi"><div><span>Program sürümü</span><b>${esc(D.surum.replace(/^Sürüm /, ''))}</b></div><div><span>Üretim tarihi</span><b>${esc(D.tarih)}</b></div><div><span>Kapsam</span><b>${D.bolumler.length} bölüm</b></div></div>
<div class="son"><span>Ekran görüntüleri demo modundan alındı, örnek kişi ve işletme adları kurgudur.</span><span>${esc(D.alan || '')}</span></div></div>`;
}
const HALKA = `<svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="${MARKA.mavi}" stroke-opacity=".16" stroke-width=".4"><circle cx="65" cy="65" r="22"/><circle cx="65" cy="65" r="36"/><circle cx="65" cy="65" r="50"/><circle cx="65" cy="65" r="64"/></g><circle cx="65" cy="65" r="9" fill="${MARKA.mavi}" fill-opacity=".1"/></svg>`;
const kisimHtml = (K, no, L) => `<section class="kisim">${HALKA}<div class="sira">Kısım ${no}</div><h2>${esc(K.ad)}</h2><p>${esc(K.ne)}</p><ul>${L.map((b) => `<li>${esc(b.baslik)}</li>`).join('')}</ul></section>`;

// D: { urun, surum, tarih, logo, renk, ikon, alan, bolumler: [{capa, baslik, alt, html, kisim:{ad,ne}}], sayfa: {capa: no} }
function belge(D) {
  const s = (c) => (D.sayfa || {})[c] || '00'; let son = null; let kn = 0; let toc = ''; let govde = '';
  D.bolumler.forEach((b, i) => {
    if (b.kisim && b.kisim.ad !== son) { son = b.kisim.ad; kn++; toc += `<li class="k">Kısım ${kn} · ${esc(son)}</li>`; govde += kisimHtml(b.kisim, kn, D.bolumler.filter((x) => x.kisim && x.kisim.ad === son)); }
    toc += `<li class="b"><a href="#${b.capa}"><span>${i + 1}. ${esc(b.baslik)}</span><span class="c"></span><span class="n">${s(b.capa)}</span></a></li>${(b.alt || []).map((a) => `<li class="a"><a href="#${a.capa}"><span>${esc(a.baslik)}</span><span class="c"></span><span class="n">${s(a.capa)}</span></a></li>`).join('')}`;
    govde += b.html + '\n';
  });
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(D.urun.name)} kullanım kılavuzu</title><meta name="author" content="NEBSOFT"><style>${CSS(D)}</style></head><body>
${kapak(D)}
<div class="ic"><h2>İçindekiler</h2><ol>${toc}</ol></div>
${govde}</body></html>`;
}
module.exports = { esc, md, liste, tablo, gorevHtml, modulHtml, bolumBas, belge };
