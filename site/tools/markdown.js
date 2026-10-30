// Bağımlılıksız küçük Markdown dönüştürücü: rehber ve yasal metinler için (## başlık, liste, tablo, paragraf, alıntı, kod, bağlantı).
// Ham HTML kabul edilmez: her şey kaçırılır, bağlantılarda yalnızca güvenli adresler geçer.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TR = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
const sluglastir = (s) => String(s).toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, (c) => TR[c]).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GUVENLI = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

function satirIci(s) {
  const kod = [];
  let t = String(s).replace(/`([^`]+)`/g, (m, a) => { kod.push(a); return `\u0000${kod.length - 1}\u0000`; });
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, ad, url) => { const u = url.replace(/&amp;/g, '&'); if (!GUVENLI.test(u)) return ad; return `<a href="${esc(u)}"${/^https?:/i.test(u) ? ' rel="noopener" target="_blank"' : ''}>${ad}</a>`; });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${esc(kod[Number(i)])}</code>`);
}
const hucre = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
const AYIRAC = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const OZEL = /^(#{1,6}\s|[-*]\s|\d+[.)]\s|>\s?|```|(-{3,}|\*{3,})\s*$)/;

function md(metin) {
  const L = String(metin ?? '').replace(/\r\n?/g, '\n').split('\n'); const out = []; let i = 0;
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if (/^```/.test(l)) { const k = []; i++; while (i < L.length && !/^```/.test(L[i])) k.push(L[i++]); i++; out.push(`<pre><code>${esc(k.join('\n'))}</code></pre>`); continue; }
    if ((m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l))) { const n = Math.min(4, Math.max(2, m[1].length)); out.push(`<h${n} id="${sluglastir(m[2])}">${satirIci(m[2])}</h${n}>`); i++; continue; } // sayfanın H1'i başlıktan gelir
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (l.includes('|') && i + 1 < L.length && AYIRAC.test(L[i + 1]) && L[i + 1].includes('-')) {
      const bas = hucre(l); i += 2; const satir = []; while (i < L.length && L[i].includes('|') && L[i].trim()) satir.push(hucre(L[i++]));
      out.push(`<div class="tablo"><table><thead><tr>${bas.map((h) => `<th>${satirIci(h)}</th>`).join('')}</tr></thead><tbody>${satir.map((r) => `<tr>${bas.map((_, k) => `<td>${satirIci(r[k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (/^>\s?/.test(l)) { const k = []; while (i < L.length && /^>\s?/.test(L[i])) k.push(L[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${md(k.join('\n'))}</blockquote>`); continue; }
    if ((m = /^\s*([-*]|\d+[.)])\s+/.exec(l))) {
      const sirali = /\d/.test(m[1]); const re = sirali ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/; const it = [];
      while (i < L.length) { if (re.test(L[i])) it.push(L[i++].replace(re, '')); else if (L[i].trim() && /^\s{2,}\S/.test(L[i])) it[it.length - 1] += ' ' + L[i++].trim(); else break; }
      out.push(`<${sirali ? 'ol' : 'ul'}>${it.map((x) => `<li>${satirIci(x)}</li>`).join('')}</${sirali ? 'ol' : 'ul'}>`); continue;
    }
    const p = []; while (i < L.length && L[i].trim() && !OZEL.test(L[i]) && !(L[i].includes('|') && i + 1 < L.length && AYIRAC.test(L[i + 1]))) p.push(L[i++].trim());
    if (!p.length) p.push(L[i++].trim());
    out.push(`<p>${satirIci(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Dosya başı bilgi bloğu: --- arasında "anahtar: değer" satırları ve S: / C: soru-cevapları
function onBilgi(metin) {
  const t = String(metin ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'); const m = /^---\n([\s\S]*?)\n---[ \t]*(\n|$)/.exec(t);
  if (!m) return { meta: {}, faq: [], govde: t };
  const meta = {}; const faq = []; let son = null; const temiz = (s) => s.trim().replace(/^(["'])(.*)\1$/, '$2');
  for (const l of m[1].split('\n')) {
    let k;
    if ((k = /^\s*(?:-\s*)?S:\s*(.+)$/.exec(l))) { faq.push({ s: temiz(k[1]), c: '' }); son = null; } else if ((k = /^\s*(?:-\s*)?C:\s*(.+)$/.exec(l))) { if (faq.length) { faq[faq.length - 1].c = temiz(k[1]); son = faq[faq.length - 1]; } } else if ((k = /^([A-Za-z_]+):\s*(.*)$/.exec(l))) { son = null; if (k[2].trim()) meta[k[1].toLowerCase()] = temiz(k[2]); } else if (son && l.trim()) son.c += ' ' + l.trim();
  }
  return { meta, faq: faq.filter((x) => x.s && x.c), govde: t.slice(m[0].length) };
}
module.exports = { md, onBilgi, satirIci, esc, sluglastir };
