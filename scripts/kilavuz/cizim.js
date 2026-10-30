// Ekran görüntüsü üzerine çizim: numaralı işaret, çerçeve, ok. Konum elle yazılmaz, elementin kutusundan gelir.
// Çizim SVG olarak görüntünün üstüne biner: PDF'te yazı gibi keskin kalır, JPEG'e gömülmediği için dosyayı büyütmez.
const { RENK } = require('./ayar');
const R = 13; // işaret yarıçapı (css piksel)
const kesisir = (a, b, ara = 3) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + ara;
const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));

// kutu: görüntüye göre {x,y,w,h}; tur: 'cerceve' | 'ok'. Dönen işaret yeri başka işaretlerin üstüne binmez.
function yerlestir(isaretler, W, H) {
  const dolu = [];
  return isaretler.map((m, i) => {
    const b = m.kutu; const on = m.tur === 'ok' ? 62 : 0; // okta numara elementin dışında durur
    const adaylar = m.tur === 'ok'
      ? [[b.x - on, b.y + b.h / 2], [b.x + b.w + on, b.y + b.h / 2], [b.x + b.w / 2, b.y - on], [b.x + b.w / 2, b.y + b.h + on], [b.x - on, b.y - on], [b.x + b.w + on, b.y + b.h + on]]
      : b.h < 46 ? [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h], [b.x - R - 5, b.y + b.h / 2]] // düğmede köşe boşluğa denk gelir, yandaki düğmenin yazısını örtmez
        : [[b.x - R - 5, b.y + b.h / 2], [b.x + b.w + R + 5, b.y + b.h / 2], [b.x + b.w, b.y], [b.x, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
    const uygun = adaylar.map(([x, y]) => ({ x: sinirla(x, R + 2, W - R - 2), y: sinirla(y, R + 2, H - R - 2), r: R })).find((c) => !dolu.some((d) => kesisir(c, d)) && !(c.x > b.x + 4 && c.x < b.x + b.w - 4 && c.y > b.y + 4 && c.y < b.y + b.h - 4));
    const n = uygun || { x: sinirla(b.x + i * 8, R + 2, W - R - 2), y: sinirla(b.y, R + 2, H - R - 2), r: R }; dolu.push(n);
    return { ...m, no: m.no ?? i + 1, n };
  });
}
// Okun ucu: numaradan elementin kutusuna en yakın kenar noktası
function okUcu(n, b) { return { x: sinirla(n.x, b.x, b.x + b.w), y: sinirla(n.y, b.y, b.y + b.h) }; }

function svg(isaretler, W, H) {
  const c = RENK.isaret; const P = yerlestir(isaretler, W, H); let s = '';
  P.forEach((m) => {
    const b = m.kutu;
    s += `<rect x="${(b.x - 3).toFixed(1)}" y="${(b.y - 3).toFixed(1)}" width="${(b.w + 6).toFixed(1)}" height="${(b.h + 6).toFixed(1)}" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/>`;
    if (m.tur === 'ok') { const u = okUcu(m.n, b); const a = Math.atan2(u.y - m.n.y, u.x - m.n.x); const uz = 10; const k = (d) => `${(u.x - uz * Math.cos(a + d)).toFixed(1)},${(u.y - uz * Math.sin(a + d)).toFixed(1)}`; s += `<line x1="${m.n.x.toFixed(1)}" y1="${m.n.y.toFixed(1)}" x2="${u.x.toFixed(1)}" y2="${u.y.toFixed(1)}" stroke="${c}" stroke-width="3"/><polygon points="${u.x.toFixed(1)},${u.y.toFixed(1)} ${k(0.45)} ${k(-0.45)}" fill="${c}"/>`; }
  });
  P.forEach((m) => { s += `<circle cx="${m.n.x.toFixed(1)}" cy="${m.n.y.toFixed(1)}" r="${R}" fill="${c}" stroke="#fff" stroke-width="2"/><text x="${m.n.x.toFixed(1)}" y="${(m.n.y + 5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="700" fill="${RENK.yazi}">${m.no}</text>`; });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}
module.exports = { svg, yerlestir, okUcu };
