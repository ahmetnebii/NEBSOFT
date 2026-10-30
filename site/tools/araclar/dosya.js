/* NEBSOFT ücretsiz araçlar — dosya araçlarının saf mantığı. Hem tarayıcıda hem Node'da çalışır, DOM ve ağ kullanmaz; baytlar üzerinde çalışır.
   Tarayıcıya site/assets/araclar-dosya-saf.js olarak build-araclar.js kopyalar; bu dosya dışında elle değiştirmeyin. Tarayıcı tarafı: site/assets/araclar-dosya.js */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.ARACLAR_DOSYA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const D = {};

  // ---------- Ad, boyut ----------
  D.boyutYaz = (n) => { if (!(n >= 0)) return '-'; if (n < 1024) return `${n} B`; const f = (x) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: x < 10 ? 2 : 1 }).format(x); return n < 1048576 ? `${f(n / 1024)} KB` : `${f(n / 1048576)} MB`; };
  D.dosyaKok = (ad) => String(ad || 'dosya').replace(/^.*[\\/]/, '').replace(/\.[^.]{1,6}$/, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim() || 'dosya';
  D.dosyaAdi = (ad, ek, uzanti) => `${D.dosyaKok(ad)}${ek ? `-${ek}` : ''}.${uzanti}`;
  // Aynı adlı iki dosya ZIP içinde birbirini ezmesin
  D.adlariAyir = (adlar) => { const say = new Map(); return adlar.map((a) => { const k = a.toLocaleLowerCase('tr'); const n = (say.get(k) || 0) + 1; say.set(k, n); return n === 1 ? a : a.replace(/(\.[^.]+)?$/, `-${n}$1`); }); };

  // ---------- Sayfa aralıkları ----------
  // "1-3, 5, 8-" → sıfır tabanlı dizinler. Boş metin tüm sayfalar demektir. Yazılan sıra korunur, tekrar edilebilir.
  D.sayfaAraligi = (metin, toplam) => {
    const t = String(metin || '').replace(/\s+/g, ''); if (!t) return Array.from({ length: toplam }, (_, i) => i);
    const son = []; t.split(/[,;]/).filter(Boolean).forEach((p) => {
      const m = /^(\d+)?(-)?(\d+)?$/.exec(p); if (!m || (!m[1] && !m[3])) throw new Error(`"${p}" geçerli bir sayfa aralığı değil. Örnek: 1-3, 5, 8-`);
      const a = m[1] ? Number(m[1]) : 1; const b = m[2] ? (m[3] ? Number(m[3]) : toplam) : a;
      if (a < 1 || b < 1 || a > toplam || b > toplam) throw new Error(`Bu dosyada ${toplam} sayfa var, "${p}" aralığı dosyanın dışında`);
      if (a <= b) for (let i = a; i <= b; i++) son.push(i - 1); else for (let i = a; i >= b; i--) son.push(i - 1);
    });
    if (!son.length) throw new Error('En az bir sayfa seçin'); return son;
  };
  // Bölme: her virgül bir dosya ("1-3, 4-6"), ya da her N sayfada bir dosya
  D.bolmeGruplari = (toplam, { kip, aralik, her }) => {
    if (kip === 'her') { const n = Math.floor(Number(her)); if (!(n >= 1)) throw new Error('Her dosyadaki sayfa sayısı en az 1 olmalı'); const g = []; for (let i = 0; i < toplam; i += n) g.push(Array.from({ length: Math.min(n, toplam - i) }, (_, k) => i + k)); return g; }
    const pp = String(aralik || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean); if (!pp.length) throw new Error('Sayfa aralığı yazın. Örnek: 1-3, 4-6');
    return pp.map((p) => D.sayfaAraligi(p, toplam));
  };
  D.sayfaNumarasi = (bicim, s, top) => ({ s: String(s), st: `${s} / ${top}`, sayfa: `Sayfa ${s}`, sayfat: `Sayfa ${s} / ${top}`, tire: `- ${s} -` }[bicim] || String(s));

  // ---------- Ölçü ----------
  // Hedef kutu için kaynak ve çizim dikdörtgeni. sigdir: oran korunur, kapla: taşan kırpılır, kenar: boşluk dolgu, esnet: oran bozulur
  D.olcek = (w, h, { gen, yuk, kip = 'sigdir', buyut = true }) => {
    if (!(w > 0 && h > 0)) throw new Error('Görsel ölçüsü okunamadı');
    const G = gen > 0 ? gen : (yuk > 0 ? yuk * w / h : w); const Y = yuk > 0 ? yuk : (gen > 0 ? gen * h / w : h); const tam = (n) => Math.max(1, Math.round(n));
    const kaynak = { x: 0, y: 0, w, h };
    if (kip === 'esnet') return { w: tam(G), h: tam(Y), kaynak, hedef: { x: 0, y: 0, w: tam(G), h: tam(Y) } };
    const sig = Math.min(G / w, Y / h); const kap = Math.max(G / w, Y / h);
    if (kip === 'kapla') { const o = kap; const kw = G / o, kh = Y / o; return { w: tam(G), h: tam(Y), kaynak: { x: (w - kw) / 2, y: (h - kh) / 2, w: kw, h: kh }, hedef: { x: 0, y: 0, w: tam(G), h: tam(Y) } }; }
    const o = buyut ? sig : Math.min(sig, 1);
    if (kip === 'kenar') { const dw = tam(w * o), dh = tam(h * o); return { w: tam(G), h: tam(Y), kaynak, hedef: { x: Math.round((G - dw) / 2), y: Math.round((Y - dh) / 2), w: dw, h: dh } }; }
    const dw = tam(w * o), dh = tam(h * o); return { w: dw, h: dh, kaynak, hedef: { x: 0, y: 0, w: dw, h: dh } };
  };
  // Dokuz konumdan biri (ust-sol ... alt-sag, orta)
  D.konum = (W, H, w, h, yer, kenar = 0) => { const [d, y] = yer === 'orta' ? ['orta', 'orta'] : String(yer).split('-'); return { x: y === 'sol' ? kenar : y === 'sag' ? W - w - kenar : (W - w) / 2, y: d === 'ust' ? kenar : d === 'alt' ? H - h - kenar : (H - h) / 2 }; };
  // Tekrarlı filigran için kaydırmalı ızgara: satırlar yarım adım kayar, sayfa kenarları boş kalmaz
  D.filigranIzgara = (W, H, adimX, adimY) => { const n = []; if (!(adimX > 0 && adimY > 0)) throw new Error('Filigran aralığı geçersiz'); let s = 0; for (let y = adimY / 2 - adimY; y < H + adimY; y += adimY, s++) for (let x = (s % 2 ? adimX / 2 : 0) - adimX; x < W + adimX; x += adimX) n.push({ x, y }); return n; };
  // Döndürülmüş PDF sayfası: pdf-lib ham koordinat ister, kullanıcı ekranda gördüğü yeri seçer. Sol üstten verilen kutu için çizim noktası ve açı
  D.pdfYer = (donus, W, Y, k) => { const r = ((donus % 360) + 360) % 360; const yb = k.y + k.h; if (r === 90) return { x: yb, y: k.x, aci: 90 }; if (r === 180) return { x: W - k.x, y: yb, aci: 180 }; if (r === 270) return { x: W - yb, y: Y - k.x, aci: 270 }; return { x: k.x, y: Y - yb, aci: 0 }; };
  // Hedef bayta inmek için en yüksek kaliteyi ikili arar. uret(kalite) → { boyut, ... }
  D.kaliteAra = async (uret, hedef, { alt = 0.3, ust = 0.92, adim = 7 } = {}) => {
    const ilk = await uret(ust); if (ilk.boyut <= hedef) return { ...ilk, kalite: ust, uydu: true };
    const dip = await uret(alt); if (dip.boyut > hedef) return { ...dip, kalite: alt, uydu: false };
    let lo = alt, hi = ust, en = { ...dip, kalite: alt, uydu: true };
    for (let i = 0; i < adim; i++) { const q = (lo + hi) / 2; const r = await uret(q); if (r.boyut <= hedef) { en = { ...r, kalite: q, uydu: true }; lo = q; } else hi = q; }
    return en;
  };

  // ---------- EXIF okuma ----------
  const T = { 0x010f: 'marka', 0x0110: 'model', 0x0112: 'yon', 0x0131: 'yazilim', 0x0132: 'tarih', 0x013b: 'yazar', 0x8298: 'telif' }; const TX = { 0x9003: 'cekim', 0xa431: 'seri', 0xa434: 'lens', 0xa430: 'sahip' };
  const gv = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
  // TIFF bloğunu okur; bozuk ofsette sessizce durur (fotoğraflardaki EXIF sık sık bozuktur, araç yine de çalışmalı)
  function tiffOku(b) {
    const s = {}; if (b.length < 8) return s; const v = gv(b); const m = v.getUint16(0); if (m !== 0x4949 && m !== 0x4d4d) return s; const le = m === 0x4949; const u16 = (o) => v.getUint16(o, le), u32 = (o) => v.getUint32(o, le);
    const yaz = (o, n) => { let t = ''; for (let i = 0; i < n && o + i < b.length; i++) { if (!b[o + i]) break; t += String.fromCharCode(b[o + i]); } return t.trim(); };
    const oran = (o) => { const a = u32(o), c = u32(o + 4); return c ? a / c : 0; };
    const ifd = (o, f) => { if (o < 8 || o + 2 > b.length) return; const n = u16(o); for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; if (e + 12 > b.length) return; const tag = u16(e), tip = u16(e + 2), say = u32(e + 4); const bt = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1 }[tip] || 1) * say; const d = bt > 4 ? u32(e + 8) : e + 8; if (d + Math.min(bt, 1) > b.length) continue; f(tag, tip, say, d); } };
    const genel = (tag, tip, say, d, tablo) => { const a = tablo[tag]; if (!a) return; if (tip === 2) { const t = yaz(d, say); if (t) s[a] = t; } else if (tip === 3) s[a] = u16(d); else if (tip === 4) s[a] = u32(d); };
    try {
      let exifO = 0, gpsO = 0;
      ifd(u32(4), (tag, tip, say, d) => { if (tag === 0x8769) exifO = u32(d); else if (tag === 0x8825) gpsO = u32(d); else genel(tag, tip, say, d, T); });
      if (exifO) ifd(exifO, (tag, tip, say, d) => genel(tag, tip, say, d, TX));
      if (gpsO) { const g = {}; ifd(gpsO, (tag, tip, say, d) => { if (tag === 1 || tag === 3) g[tag] = yaz(d, 2); else if ((tag === 2 || tag === 4) && tip === 5 && say >= 3) g[tag] = oran(d) + oran(d + 8) / 60 + oran(d + 16) / 3600; }); if (g[2] != null && g[4] != null) { const lat = g[2] * (g[1] === 'S' ? -1 : 1), lon = g[4] * (g[3] === 'W' ? -1 : 1); if (lat || lon) s.gps = { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 }; } }
    } catch (e) { /* bozuk EXIF: okunabilen kadarı döner */ }
    return s;
  }
  D.tiffOku = tiffOku;
  const esit = (b, o, t) => { for (let i = 0; i < t.length; i++) if (b[o + i] !== t.charCodeAt(i)) return false; return true; };
  const metin4 = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  D.turBul = (b) => (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 ? 'jpeg' : b.length > 8 && esit(b, 1, 'PNG') ? 'png' : b.length > 12 && esit(b, 0, 'RIFF') && esit(b, 8, 'WEBP') ? 'webp' : '');
  function jpegParcalar(b) {
    const p = []; let o = 2;
    while (o + 4 <= b.length) { if (b[o] !== 0xff) throw new Error('JPEG dosyası bozuk görünüyor'); let m = b[o + 1]; while (m === 0xff && o + 2 < b.length) { o++; m = b[o + 1]; } if (m === 0xda || m === 0xd9) { p.push({ m, o, u: 0 }); break; } const u = (b[o + 2] << 8) | b[o + 3]; if (u < 2 || o + 2 + u > b.length) throw new Error('JPEG dosyası bozuk görünüyor'); p.push({ m, o, u }); o += 2 + u; }
    return p;
  }
  function pngParcalar(b) { const p = []; let o = 8; while (o + 12 <= b.length) { const u = ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; const ad = metin4(b, o + 4); if (o + 12 + u > b.length) throw new Error('PNG dosyası bozuk görünüyor'); p.push({ ad, o, u }); o += 12 + u; if (ad === 'IEND') break; } return p; }
  function webpParcalar(b) { const p = []; let o = 12; while (o + 8 <= b.length) { const u = (b[o + 4] | (b[o + 5] << 8) | (b[o + 6] << 16) | (b[o + 7] << 24)) >>> 0; const ad = metin4(b, o); const dolgu = u & 1; if (o + 8 + u > b.length) throw new Error('WebP dosyası bozuk görünüyor'); p.push({ ad, o, u, top: 8 + u + dolgu }); o += 8 + u + dolgu; } return p; }
  // Dosyadaki bilgi bloklarını söyler: { tur, exif, bloklar: ['EXIF', 'XMP', ...] }
  D.metaOku = (b) => {
    const tur = D.turBul(b); const r = { tur, exif: {}, bloklar: [] }; const ekle = (x) => { if (!r.bloklar.includes(x)) r.bloklar.push(x); };
    if (tur === 'jpeg') jpegParcalar(b).forEach((s) => { const g = s.o + 4; if (s.m === 0xe1 && esit(b, g, 'Exif\0\0')) { ekle('EXIF'); r.exif = tiffOku(b.subarray(g + 6, s.o + 2 + s.u)); } else if (s.m === 0xe1) ekle('XMP'); else if (s.m === 0xed) ekle('IPTC'); else if (s.m === 0xfe) ekle('Yorum'); });
    else if (tur === 'png') pngParcalar(b).forEach((s) => { if (s.ad === 'eXIf') { ekle('EXIF'); r.exif = tiffOku(b.subarray(s.o + 8, s.o + 8 + s.u)); } else if (['tEXt', 'zTXt', 'iTXt'].includes(s.ad)) ekle('Metin'); else if (s.ad === 'tIME') ekle('Tarih'); });
    else if (tur === 'webp') webpParcalar(b).forEach((s) => { if (s.ad === 'EXIF') { ekle('EXIF'); const g = s.o + 8; const k = esit(b, g, 'Exif\0\0') ? 6 : 0; r.exif = tiffOku(b.subarray(g + k, g + s.u)); } else if (s.ad === 'XMP ') ekle('XMP'); });
    return r;
  };

  // ---------- Bilgi temizleme (görüntü yeniden kodlanmaz, kalite düşmez) ----------
  const birlestir = (parcalar) => { const t = parcalar.reduce((n, p) => n + p.length, 0); const c = new Uint8Array(t); let o = 0; parcalar.forEach((p) => { c.set(p, o); o += p.length; }); return c; };
  // Yön etiketi silinirse dik çekilmiş fotoğraf yan görünür: yalnız bu tek etiketi taşıyan küçük bir EXIF yazılır
  const yonApp1 = (y) => { const g = new Uint8Array(36); g.set([0xff, 0xe1, 0, 34], 0); g.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4); g.set([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, y, 0, 0, 0, 0, 0, 0, 0], 10); return g; };
  D.jpegTemizle = (b) => {
    const p = jpegParcalar(b); const yon = Number(D.metaOku(b).exif.yon); const c = [b.subarray(0, 2)]; let kes = 2;
    const tut = (s) => { if (s.m === 0xe0) return true; if (s.m === 0xe2) return esit(b, s.o + 4, 'ICC_PROFILE'); if (s.m === 0xee) return true; return !(s.m >= 0xe0 && s.m <= 0xef) && s.m !== 0xfe; };
    let yonEklendi = yon === 1 || !(yon >= 2 && yon <= 8);
    p.forEach((s, i) => { if (s.m === 0xda || s.m === 0xd9) return; if (tut(s)) return; c.push(b.subarray(kes, s.o)); kes = s.o + 2 + s.u; if (i >= 0 && !yonEklendi) { c.push(yonApp1(yon)); yonEklendi = true; } });
    c.push(b.subarray(kes)); return birlestir(c);
  };
  D.pngTemizle = (b) => { const sil = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']); const c = [b.subarray(0, 8)]; pngParcalar(b).forEach((s) => { if (!sil.has(s.ad)) c.push(b.subarray(s.o, s.o + 12 + s.u)); }); return birlestir(c); };
  D.webpTemizle = (b) => {
    const c = []; webpParcalar(b).forEach((s) => { if (s.ad === 'EXIF' || s.ad === 'XMP ') return; const p = b.slice(s.o, s.o + s.top); if (s.ad === 'VP8X') p[8] &= ~0x0c; c.push(p); });
    const g = birlestir(c); const s = new Uint8Array(12 + g.length); s.set(b.subarray(0, 12), 0); s.set(g, 12); const u = s.length - 8; s[4] = u & 255; s[5] = (u >> 8) & 255; s[6] = (u >> 16) & 255; s[7] = (u >>> 24) & 255; return s;
  };
  D.temizle = (b) => { const t = D.turBul(b); if (t === 'jpeg') return D.jpegTemizle(b); if (t === 'png') return D.pngTemizle(b); if (t === 'webp') return D.webpTemizle(b); throw new Error('Bu araç yalnız JPG, PNG ve WebP dosyalarını temizler'); };

  // ---------- Paketler ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  D.crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  // Varsayılan sıkıştırmasız ZIP: içindekiler zaten sıkıştırılmış görsel ve PDF. d.ham verilirse d.veri deflate kabul edilir. Türkçe ad için UTF-8 bayrağı açık
  D.zip = (dosyalar) => {
    const yerel = [], merkez = []; let o = 0; const te = new TextEncoder(); const ad = D.adlariAyir(dosyalar.map((d) => d.ad));
    dosyalar.forEach((d, i) => {
      const n = te.encode(ad[i]); const crc = d.crc ?? D.crc32(d.veri); const s = d.veri.length; const ham = d.ham ?? s; const yt = d.ham == null ? 0 : 8;
      const y = new Uint8Array(30 + n.length); const v = new DataView(y.buffer); v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, yt, true); v.setUint16(12, 0x5a21, true); v.setUint32(14, crc, true); v.setUint32(18, s, true); v.setUint32(22, ham, true); v.setUint16(26, n.length, true); y.set(n, 30);
      const m = new Uint8Array(46 + n.length); const w = new DataView(m.buffer); w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(10, yt, true); w.setUint16(14, 0x5a21, true); w.setUint32(16, crc, true); w.setUint32(20, s, true); w.setUint32(24, ham, true); w.setUint16(28, n.length, true); w.setUint32(42, o, true); m.set(n, 46);
      yerel.push(y, d.veri); merkez.push(m); o += y.length + s;
    });
    const mt = merkez.reduce((t, m) => t + m.length, 0); const e = new Uint8Array(22); const z = new DataView(e.buffer); z.setUint32(0, 0x06054b50, true); z.setUint16(8, dosyalar.length, true); z.setUint16(10, dosyalar.length, true); z.setUint32(12, mt, true); z.setUint32(16, o, true);
    return birlestir([...yerel, ...merkez, e]);
  };
  // ---------- Metin dosyası ve Excel ----------
  // BOM varsa ona, yoksa geçerli UTF-8 mi diye bakılır; değilse Türkçe Excel'in yazdığı Windows-1254 kabul edilir
  D.metinCoz = (b) => {
    if (b.length > 1 && b[0] === 0xff && b[1] === 0xfe) return { metin: new TextDecoder('utf-16le').decode(b), kodlama: 'UTF-16' }; if (b.length > 1 && b[0] === 0xfe && b[1] === 0xff) return { metin: new TextDecoder('utf-16be').decode(b), kodlama: 'UTF-16' };
    try { return { metin: new TextDecoder('utf-8', { fatal: true }).decode(b), kodlama: 'UTF-8' }; } catch (e) { return { metin: new TextDecoder('windows-1254').decode(b), kodlama: 'Windows-1254 (eski Türkçe)' }; }
  };
  D.zipAc = async (b) => {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength); let e = -1; for (let i = b.length - 22; i >= 0 && i >= b.length - 66000; i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; } if (e < 0) throw new Error('zip');
    const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const g = new Map(); const td = new TextDecoder();
    for (let i = 0; i < n; i++) { if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip'); const a = v.getUint16(p + 28, true), x = v.getUint16(p + 30, true), y = v.getUint16(p + 32, true); g.set(td.decode(b.subarray(p + 46, p + 46 + a)), { yontem: v.getUint16(p + 10, true), boyut: v.getUint32(p + 20, true), yer: v.getUint32(p + 42, true) }); p += 46 + a + x + y; }
    return async (ad) => { const k = g.get(ad); if (!k) return null; const h = k.yer + 30 + v.getUint16(k.yer + 26, true) + v.getUint16(k.yer + 28, true); const ham = b.subarray(h, h + k.boyut); if (k.yontem === 0) return td.decode(ham); if (typeof DecompressionStream !== 'function') throw new Error('Bu tarayıcı Excel dosyası açamıyor. Tarayıcınızı güncelleyin veya dosyayı CSV olarak kaydedin.'); return new Response(new Blob([ham]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); };
  };
  const xmlCoz = (s) => s.replace(/_x000[dD]_/g, '').replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|(amp|lt|gt|quot|apos));/g, (_, d, x, a) => (d ? String.fromCodePoint(Number(d)) : x ? String.fromCodePoint(parseInt(x, 16)) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' }[a]));
  const ozn = (t, a) => { const m = new RegExp(`\\s${a}="([^"]*)"`).exec(t); return m ? m[1] : ''; };
  const onekSil = (s) => s.replace(/<(\/?)[A-Za-z0-9]+:(?=[A-Za-z])/g, '<$1');
  const yaziAl = (s) => [...s.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => xmlCoz(m[1])).join('');
  const sutunNo = (r) => { let n = 0; for (const c of r) { const k = c.charCodeAt(0); if (k < 65 || k > 90) break; n = n * 26 + k - 64; } return n - 1; };
  const sutunAd = (n) => { let s = ''; for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; };
  const iki = (n) => String(n).padStart(2, '0');
  const ISO_TARIH = new Set([14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 34, 35, 36, 50, 51, 52, 53, 54, 57, 58]), ISO_SAAT = new Set([18, 19, 20, 21, 32, 33, 45, 46, 47]);
  // 0: tarih değil, 1: tarih, 2: yalnız saat
  const bicimTuru = (kod) => { const t = kod.replace(/\[[^\]]*\]|"[^"]*"|\\./g, ''); if (/[yd]/i.test(t)) return 1; if (/h|s/i.test(t)) return 2; return /m/i.test(t) ? 1 : 0; };
  // 1900 sisteminde 30.12.1899 sıfır günüdür (Excel'in 1900 şubat hatası 60'tan büyük seri numaralarında böyle düzelir)
  D.excelTarih = (n, tur, b1904) => { const ms = Math.round(((b1904 ? n + 1462 : n)) * 864e5) + Date.UTC(1899, 11, 30); const d = new Date(ms); const saat = `${iki(d.getUTCHours())}:${iki(d.getUTCMinutes())}`; if (tur === 2) return saat; const g = `${iki(d.getUTCDate())}.${iki(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`; return n % 1 ? `${g} ${saat}` : g; };
  D.xlsxOku = async (b, no = 1) => {
    let al; try { al = await D.zipAc(b); } catch (e) { throw new Error('Excel dosyası açılamadı. Dosya bozuk veya parola korumalı olabilir.'); }
    const kitap = await al('xl/workbook.xml'); if (!kitap) throw new Error('Bu dosya gerçek bir Excel (.xlsx) dosyası değil.');
    const kb = onekSil(kitap); const bag = {}; const rel = await al('xl/_rels/workbook.xml.rels'); [...onekSil(rel || '').matchAll(/<Relationship\b[^>]*>/g)].forEach((m) => { bag[ozn(m[0], 'Id')] = ozn(m[0], 'Target'); });
    const sayfalar = [...kb.matchAll(/<sheet\b[^>]*>/g)].map((m) => { const r = /\s[A-Za-z0-9]+:id="([^"]*)"/.exec(m[0]); const h = bag[r ? r[1] : ''] || ''; return { ad: xmlCoz(ozn(m[0], 'name')), gizli: !!ozn(m[0], 'state') && ozn(m[0], 'state') !== 'visible', yol: h.startsWith('/') ? h.slice(1) : `xl/${h}` }; });
    if (!sayfalar.length) throw new Error('Excel dosyasında sayfa bulunamadı.'); const S = sayfalar[no - 1]; if (!S) throw new Error(`Bu dosyada ${sayfalar.length} sayfa var, ${no}. sayfa yok.`);
    const b1904 = /date1904="(1|true)"/.test(kb); const ss = onekSil((await al('xl/sharedStrings.xml')) || ''); const paylasim = [...ss.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)].map((m) => yaziAl(m[1] || ''));
    const st = onekSil((await al('xl/styles.xml')) || ''); const ozel = {}; [...st.matchAll(/<numFmt\b[^>]*>/g)].forEach((m) => { ozel[ozn(m[0], 'numFmtId')] = bicimTuru(xmlCoz(ozn(m[0], 'formatCode'))); }); const xf = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(st);
    const stiller = xf ? [...xf[1].matchAll(/<xf\b[^>]*>/g)].map((m) => { const k = Number(ozn(m[0], 'numFmtId')); return ISO_TARIH.has(k) ? 1 : ISO_SAAT.has(k) ? 2 : ozel[k] || 0; }) : [];
    const xml = await al(S.yol); if (xml == null) throw new Error('Excel sayfası okunamadı.'); const satirlar = [];
    for (const m of onekSil(xml).matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const sat = []; let sira = 0; for (const c of (m[1] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const a = ` ${c[1]}`; const ic = c[2] || ''; const k = ozn(a, 'r') ? sutunNo(ozn(a, 'r')) : sira; sira = k + 1; const t = ozn(a, 't'); const vm = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(ic); const d = vm ? xmlCoz(vm[1]) : ''; let y = '';
        if (t === 's') y = paylasim[Number(d)] ?? ''; else if (t === 'inlineStr') y = yaziAl(ic); else if (t === 'b') y = d === '1' ? 'DOĞRU' : 'YANLIŞ'; else if (t === 'str' || t === 'e' || t === 'd') y = d; else if (d !== '') { const n = Number(Number(d).toPrecision(15)); const tur = stiller[Number(ozn(a, 's')) || 0] || 0; y = Number.isNaN(n) ? d : tur ? D.excelTarih(n, tur, b1904) : n; }
        while (sat.length < k) sat.push(''); sat[k] = y;
      }
      satirlar.push(sat);
    }
    // Excel sondaki boş hücreleri yazmaz: bu, gerçek bir sütun kayması değildir
    const G = satirlar.reduce((t, r) => Math.max(t, r.length), 0); satirlar.forEach((r) => { while (r.length < G) r.push(''); });
    return { satirlar, sayfalar: sayfalar.map((x) => x.ad), gizli: S.gizli, secili: S.ad };
  };
  // Metin hücresi gerçek sayıya yalnız kesinse çevrilir: başı sıfırlı kodlar, 10 haneden uzun barkod ve numaralar metin kalır
  D.sayiMi = (s) => { if (/^-?(0|[1-9]\d{0,9})(,\d+)?$/.test(s)) return Number(s.replace(',', '.')); if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.')); return null; };
  D.tarihSeri = (s) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s); if (!m) return null; const t = Date.UTC(+m[3], +m[2] - 1, +m[1]); const d = new Date(t); if (d.getUTCMonth() !== +m[2] - 1 || +m[3] < 1901) return null; return Math.round((t - Date.UTC(1899, 11, 30)) / 864e5); };
  const xmlKac = (s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const xlsxParca = (S) => {
    const MS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', RL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', PK = 'http://schemas.openxmlformats.org/package/2006', XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const sat = S.map((r, i) => `<row r="${i + 1}">${r.map((x, c) => { if (x == null || x === '') return ''; const ref = `${sutunAd(c)}${i + 1}`; if (typeof x === 'number') return `<c r="${ref}"><v>${x}</v></c>`; const n = i ? D.sayiMi(x) : null; if (n !== null) return `<c r="${ref}"><v>${n}</v></c>`; const t = i ? D.tarihSeri(x) : null; if (t !== null) return `<c r="${ref}" s="1"><v>${t}</v></c>`; return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlKac(String(x).slice(0, 32767))}</t></is></c>`; }).join('')}</row>`).join('');
    const gen = []; S.forEach((r) => r.forEach((x, c) => { gen[c] = Math.max(gen[c] || 11, Math.min(String(x == null ? '' : x).length + 2, 60)); })); const kol = gen.length ? `<cols>${gen.map((g, c) => `<col min="${c + 1}" max="${c + 1}" width="${g}" customWidth="1"/>`).join('')}</cols>` : '';
    const te = new TextEncoder(); const dosya = (ad, m) => ({ ad, veri: te.encode(XML + m) });
    return [
      dosya('[Content_Types].xml', `<Types xmlns="${PK}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
      dosya('_rels/.rels', `<Relationships xmlns="${PK}/relationships"><Relationship Id="rId1" Type="${RL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
      dosya('xl/workbook.xml', `<workbook xmlns="${MS}" xmlns:r="${RL}"><sheets><sheet name="Temiz" sheetId="1" r:id="rId1"/></sheets></workbook>`),
      dosya('xl/_rels/workbook.xml.rels', `<Relationships xmlns="${PK}/relationships"><Relationship Id="rId1" Type="${RL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${RL}/styles" Target="styles.xml"/></Relationships>`),
      dosya('xl/styles.xml', `<styleSheet xmlns="${MS}"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`),
      dosya('xl/worksheets/sheet1.xml', `<worksheet xmlns="${MS}">${kol}<sheetData>${sat}</sheetData></worksheet>`),
    ];
  };
  D.xlsxYaz = (S) => D.zip(xlsxParca(S));
  // Büyük tablo sıkıştırılmadan on katından fazla yer tutar. Tarayıcı desteklemiyorsa sıkıştırmasız yazar
  D.xlsxSikisik = async (S) => { const p = xlsxParca(S); if (typeof CompressionStream !== 'function') return D.zip(p); const q = await Promise.all(p.map(async (d) => ({ ad: d.ad, ham: d.veri.length, crc: D.crc32(d.veri), veri: new Uint8Array(await new Response(new Blob([d.veri]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()) }))); return D.zip(q); };

  // PNG gövdeli ICO: tarayıcılar ve Windows Vista sonrası okur. 256 piksel başlıkta 0 yazılır
  D.ico = (resimler) => {
    const b = new Uint8Array(6 + 16 * resimler.length); const v = new DataView(b.buffer); v.setUint16(2, 1, true); v.setUint16(4, resimler.length, true); let o = b.length;
    resimler.forEach((r, i) => { const e = 6 + i * 16; b[e] = r.boyut >= 256 ? 0 : r.boyut; b[e + 1] = r.boyut >= 256 ? 0 : r.boyut; v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true); v.setUint32(e + 8, r.png.length, true); v.setUint32(e + 12, o, true); o += r.png.length; });
    return birlestir([b, ...resimler.map((r) => r.png)]);
  };

  // ---------- Piksel işlemleri (RGBA dizi) ----------
  const uzak = (d, i, r) => Math.max(Math.abs(d[i] - r[0]), Math.abs(d[i + 1] - r[1]), Math.abs(d[i + 2] - r[2]));
  // Kenar piksellerinde en sık geçen renk: düz fon için en güvenli tahmin
  D.kenarRengi = (d, w, h) => {
    const say = new Map(); const al = (x, y) => { const i = (y * w + x) * 4; if (d[i + 3] < 128) return; const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); const s = say.get(k) || { n: 0, r: 0, g: 0, b: 0 }; s.n++; s.r += d[i]; s.g += d[i + 1]; s.b += d[i + 2]; say.set(k, s); };
    for (let x = 0; x < w; x++) { al(x, 0); al(x, h - 1); } for (let y = 0; y < h; y++) { al(0, y); al(w - 1, y); }
    let en = null; say.forEach((s) => { if (!en || s.n > en.n) en = s; }); return en ? [Math.round(en.r / en.n), Math.round(en.g / en.n), Math.round(en.b / en.n)] : [255, 255, 255];
  };
  // Fonu bulur. kenar: yalnız kenardan ulaşılan bölge (ürünün içindeki beyaz korunur); heryer: aynı renkteki tüm pikseller (imza, logo harf içleri)
  D.arkaPlanMaske = (d, w, h, { renk, tol = 30, heryer = false }) => {
    const m = new Uint8Array(w * h);
    if (heryer) { for (let i = 0, n = w * h; i < n; i++) if (uzak(d, i * 4, renk) <= tol) m[i] = 1; return m; }
    const yig = new Int32Array(w * h); let s = 0; const it = (p) => { if (!m[p] && uzak(d, p * 4, renk) <= tol) { m[p] = 1; yig[s++] = p; } };
    for (let x = 0; x < w; x++) { it(x); it((h - 1) * w + x); } for (let y = 0; y < h; y++) { it(y * w); it(y * w + w - 1); }
    while (s) { const p = yig[--s]; const x = p % w; if (x > 0) it(p - 1); if (x < w - 1) it(p + 1); if (p >= w) it(p - w); if (p < w * (h - 1)) it(p + w); }
    return m;
  };
  // Maskeyi uygular; fon sınırındaki pikseller renk uzaklığına göre yarı saydam olur, kenarda beyaz hale kalmaz
  D.arkaPlanUygula = (d, m, w, h, { renk, tol = 30 }) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x; const i = p * 4;
      if (m[p]) { d[i + 3] = 0; continue; }
      if ((x > 0 && m[p - 1]) || (x < w - 1 && m[p + 1]) || (y > 0 && m[p - w]) || (y < h - 1 && m[p + w])) { const a = Math.min(1, Math.max(0, (uzak(d, i, renk) - tol) / Math.max(tol, 24))); d[i + 3] = Math.round(d[i + 3] * Math.max(a, 0.25)); }
    }
    return d;
  };
  D.mozaik = (d, w, h, a, blok) => {
    const x0 = Math.max(0, Math.floor(a.x)), y0 = Math.max(0, Math.floor(a.y)), x1 = Math.min(w, Math.ceil(a.x + a.w)), y1 = Math.min(h, Math.ceil(a.y + a.h)); const B = Math.max(2, Math.floor(blok));
    for (let by = y0; by < y1; by += B) for (let bx = x0; bx < x1; bx += B) {
      let r = 0, g = 0, b = 0, n = 0; const ey = Math.min(by + B, y1), ex = Math.min(bx + B, x1);
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; }
    }
    return d;
  };

  // ---------- PDF metni ----------
  // pdf.js parçalarını satıra çevirir: aynı yükseklikteki parçalar soldan sağa dizilir, büyük boşlukta sütun ayrılır
  D.pdfSatirlar = (parcalar) => {
    const s = []; parcalar.filter((p) => p.str != null && p.transform).forEach((p) => { const y = p.transform[5], x = p.transform[4], yk = Math.abs(p.height || p.transform[3] || 10); let l = s.find((q) => Math.abs(q.y - y) < Math.max(yk * 0.45, 2)); if (!l) { l = { y, p: [] }; s.push(l); } l.p.push({ x, w: p.width || 0, t: p.str, yk }); });
    return s.sort((a, b) => b.y - a.y).map((l) => { l.p.sort((a, b) => a.x - b.x); let t = '', son = null; l.p.forEach((p) => { if (son != null && t && !t.endsWith(' ') && !p.t.startsWith(' ')) { const ara = p.x - son; if (ara > p.yk * 1.8) t += '   '; else if (ara > p.yk * 0.15) t += ' '; } t += p.t; son = p.x + p.w; }); return t.trimEnd(); });
  };
  return D;
});
