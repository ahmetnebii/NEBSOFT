// Chrome'un ürettiği PDF'ten sayfa sayısını ve iç bağlantı hedeflerinin sayfasını okur. İçindekilerdeki sayfa numarası ve test için kullanılır, bağımlılık yoktur.
const zlib = require('zlib');
function nesneler(buf) {
  const s = buf.toString('latin1'); const N = new Map(); const re = /(\d+) 0 obj\b/g; let m;
  while ((m = re.exec(s))) { const son = s.indexOf('endobj', m.index); if (son < 0) break; N.set(Number(m[1]), s.slice(m.index + m[0].length, son)); re.lastIndex = son; }
  // Nesne akışları (/ObjStm) içindeki sıkıştırılmış nesneler de açılır
  for (const [, v] of [...N]) {
    if (!/\/Type\s*\/ObjStm/.test(v)) continue; const a = v.indexOf('stream'); const z = v.indexOf('endstream'); if (a < 0 || z < 0) continue;
    let bas = a + 6; if (v[bas] === '\r') bas++; if (v[bas] === '\n') bas++;
    let d; try { d = zlib.inflateSync(Buffer.from(v.slice(bas, z), 'latin1')).toString('latin1'); } catch (e) { continue; }
    const n = Number((v.match(/\/N\s+(\d+)/) || [])[1]); const first = Number((v.match(/\/First\s+(\d+)/) || [])[1]); const b = d.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) { const no = b[i * 2]; const y = first + b[i * 2 + 1]; const z2 = i + 1 < n ? first + b[(i + 1) * 2 + 1] : d.length; N.set(no, d.slice(y, z2)); }
  }
  return N;
}
function sayfalar(N) {
  const kok = [...N.values()].find((v) => /\/Type\s*\/Pages/.test(v) && !/\/Parent/.test(v)); const L = [];
  const gez = (v) => { const k = (v.match(/\/Kids\s*\[([^\]]*)\]/) || [])[1] || ''; [...k.matchAll(/(\d+) 0 R/g)].forEach((m) => { const c = N.get(Number(m[1])) || ''; if (/\/Type\s*\/Pages/.test(c)) gez(c); else L.push(Number(m[1])); }); };
  if (kok) gez(kok); return L;
}
// PDF adlarında # ile yazılan baytlar ve dizge kaçışları çözülür
const ad = (x) => x.replace(/\\(\d{3})/g, (m, o) => String.fromCharCode(parseInt(o, 8))).replace(/\\([()\\])/g, '$1');
function oku(buf) {
  const N = nesneler(buf); const S = sayfalar(N); const yer = new Map(S.map((id, i) => [id, i + 1])); const hedef = {};
  const ekle = (metin) => { for (const m of metin.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*\[\s*(\d+) 0 R\s*\/XYZ/g)) { const p = yer.get(Number(m[2])); if (p) hedef[ad(m[1])] = p; } for (const m of metin.matchAll(/\/([^\s/<>[\]()]+)\s*\[\s*(\d+) 0 R\s*\/XYZ/g)) { const p = yer.get(Number(m[2])); if (p) hedef[m[1].replace(/#([0-9a-fA-F]{2})/g, (a, h) => String.fromCharCode(parseInt(h, 16)))] = p; } };
  N.forEach((v) => { if (/\/XYZ/.test(v)) ekle(v); });
  let bag = 0; N.forEach((v) => { if (/\/Subtype\s*\/Link/.test(v) && /\/Dest|\/GoTo/.test(v)) bag++; });
  return { sayfa: S.length, hedef, bag };
}
module.exports = { oku };
