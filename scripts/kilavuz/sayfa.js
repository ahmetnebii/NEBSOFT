// Tarayıcıda çalışan yardımcı (window.__k). Seçici biçimi: CSS, istenirse "@metin" eki: `button@Yeni ürün` bu metni içeren görünür ilk düğmedir.
// Eşleşmeyen seçici null döner; üretici bunu hataya çevirir, boş geçmez. Açık pencere varsa arama önce pencerenin içinde yapılır.
window.__k = (function () {
  const gorunur = (e) => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const metin = (e) => (e.innerText || e.value || e.getAttribute('title') || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  const kok = () => [...document.querySelectorAll('.ns-overlay')].filter(gorunur).pop() || document;
  function hepsi(sec) {
    const i = sec.indexOf('@'); const css = i < 0 ? sec : sec.slice(0, i) || '*'; const m = i < 0 ? null : sec.slice(i + 1);
    const ara = (k) => { let L = [...k.querySelectorAll(css)].filter(gorunur); if (m != null) { const tam = L.filter((e) => metin(e) === m); L = tam.length ? tam : L.filter((e) => metin(e).includes(m)); } return L; };
    const k = kok(); const L = ara(k); return L.length || k === document ? L : ara(document);
  }
  const bul = (sec) => hepsi(sec)[0] || null;
  const ustte = (e) => { const r = e.getBoundingClientRect(); const x = Math.min(innerWidth - 2, Math.max(1, r.left + r.width / 2)); const y = Math.min(innerHeight - 2, Math.max(1, r.top + r.height / 2)); const u = document.elementFromPoint(x, y); return !!u && (u === e || e.contains(u) || u.contains(e)); };
  return {
    bul, hepsi, gorunur,
    kutu(sec) { const e = bul(sec); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, metin: metin(e).slice(0, 80), ustte: ustte(e) }; },
    tikla(sec) { const e = bul(sec); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; },
    yaz(sec, v) { const e = bul(sec); if (!e) return false; e.focus(); const d = Object.getOwnPropertyDescriptor(e.tagName === 'SELECT' ? HTMLSelectElement.prototype : e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'); d.set.call(e, v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; },
    tus(sec, key) { const e = sec ? bul(sec) : document.activeElement; if (!e) return false; ['keydown', 'keypress', 'keyup'].forEach((t) => e.dispatchEvent(new KeyboardEvent(t, { key, bubbles: true, cancelable: true }))); return true; },
    bulanik(sec) { const L = hepsi(sec); L.forEach((e) => { e.style.filter = 'blur(5px)'; }); return L.length; },
    kaydir(sec) { const e = bul(sec); if (!e) return false; e.scrollIntoView({ block: 'start' }); return true; },
    // Telefon, e-posta ve kimlik numarası biçimindeki metin görüntü alınmadan bulanıklaştırılır: rastgele örnek numara gerçek birine denk gelebilir
    maskele() {
      const RE = /(?:\+?90[\s-]?)?0?\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}|\b0?5\d{9}\b|\b[1-9]\d{10}\b|[\w.+-]+@[\w-]+\.[\w.-]+/g; let n = 0; const kes = 'blur(3.5px)';
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (/^(SCRIPT|STYLE|TITLE)$/.test(t.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      const L = []; while (w.nextNode()) { RE.lastIndex = 0; if (RE.test(w.currentNode.nodeValue)) L.push(w.currentNode); }
      L.forEach((t) => { const f = document.createDocumentFragment(); let i = 0; const s = t.nodeValue; s.replace(RE, (m, at) => { f.append(s.slice(i, at)); const b = document.createElement('span'); b.style.filter = kes; b.textContent = m; f.append(b); i = at + m.length; n++; return m; }); f.append(s.slice(i)); t.replaceWith(f); });
      document.querySelectorAll('input,textarea').forEach((e) => { RE.lastIndex = 0; if (e.value && e.type !== 'password' && RE.test(e.value)) { e.style.filter = kes; n++; } });
      return n;
    },
    // Keşif: bir ekrandaki düğme, sekme, alan ve tablo başlıkları
    ozet() {
      const o = [...document.querySelectorAll('.ns-overlay')].filter(gorunur).pop(); const v = o || document.querySelector('#view') || document.body;
      const g = (s) => [...new Set([...v.querySelectorAll(s)].filter(gorunur).map(metin).filter(Boolean))];
      return { baslik: (document.querySelector('#ttl') || {}).innerText, pencere: !!o, dugme: g('button, a.btn'), alan: g('.field label, label'), tablo: g('th'), sekme: g('.tabs button'), kimlik: [...v.querySelectorAll('[id]')].filter(gorunur).map((e) => e.tagName.toLowerCase() + '#' + e.id).slice(0, 30), metin: (v.innerText || '').replace(/\s+/g, ' ').slice(0, 300) };
    },
  };
})();
