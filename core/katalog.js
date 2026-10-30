/* NEBSOFT ortak ürün kataloğu istemcisi: barkodla ad, marka ve kategori doldurma, atıf ve öneri.
   • Sunucu sırası: catalog_own → catalog_ext → gerçek okutmada Open Food Facts canlı. Yalnız oturumlu kullanıcıya açıktır.
   • Eczane bu kataloğu kullanmaz. Öneriye yalnız gtin, ad, marka, kategori gider: fiyat, stok, işletme bilgisi gönderilmez. */
(function () {
  'use strict';
  if (!window.NS) return;
  const NS = window.NS; const { esc, icon, toast } = NS;
  const sor = async (code, o = {}) => { try { return (await NS.api('GET', `/api/katalog/barkod/${encodeURIComponent(code)}${o.okutma ? '?okutma=1' : ''}`)).item; } catch (e) { return null; } };
  const oner = (items) => { const L = (items || []).filter((x) => x && x.source !== 'off').map((x) => ({ gtin: x.gtin || x.barcode, ad: x.ad || x.name, marka: x.marka || x.brand || '', kategori: x.kategori || x.category || '' })); if (L.length) NS.api('POST', '/api/katalog/oneri', { items: L }).catch(() => {}); };
  // Open Food Facts kaydı gösterilen her yerde kaynak ve lisans bağlantısı görünür
  const atif = (it) => { const a = it && it.atif; if (!a) return ''; const l = (u, t) => (/^https:\/\//.test(u || '') ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>` : esc(t)); return `<span class="small faint ns-atif">Kaynak: ${l(a.kaynak_url, a.kaynak)} · ${l(a.lisans_url, a.lisans)}${a.gorsel_lisans ? ` · görsel ${l(a.gorsel_lisans_url, a.gorsel_lisans)}` : ''}</span>`; };
  const katSec = (sel, ad) => { if (!sel || !ad) return; const n = NS.sablon ? NS.sablon.norm(ad) : ad; const o = [...sel.options].find((x) => (NS.sablon ? NS.sablon.norm(x.textContent) : x.textContent) === n); if (o) sel.value = o.value; };
  // Form bağlayıcı: alan adları { barkod, ad, marka, kategori }. Barkod girilince (okutma) boş alanlar dolar, dolu alana dokunulmaz.
  function formaBagla(b, o = {}) {
    const f = (n) => (n ? b.querySelector(`[name="${n}"]`) : null); const bc = f(o.barkod || 'barcode'); const ad = f(o.ad || 'name'); if (!bc || !ad) return null; const st = { hit: null };
    const w = document.createElement('div'); w.className = 'pf-row'; bc.before(w); w.append(bc); w.insertAdjacentHTML('beforeend', `<button type="button" class="btn pf-cam" title="Kamerayla okut" aria-label="Kamerayla okut">${icon('camera')}</button>`);
    const at = document.createElement('div'); w.after(at);
    const bak = async () => { const code = bc.value.trim(); st.hit = null; at.innerHTML = ''; if (!/^\d{8,14}$/.test(code)) return; const hit = await sor(code, { okutma: true }); if (!hit) return; st.hit = hit; at.innerHTML = atif(hit); if (ad.value.trim()) return;
      ad.value = hit.name; const m = f(o.marka); if (m && !m.value) m.value = hit.brand; const k = f(o.kategori); if (k) { if (k.tagName === 'SELECT') katSec(k, hit.category); else if (!k.value) k.value = hit.category; } if (o.bulunca) o.bulunca(hit); toast('Ürün bilgisi katalogdan dolduruldu', 'ok'); };
    bc.addEventListener('change', bak); w.querySelector('.pf-cam').onclick = () => NS.scan({ title: 'Barkodu okut', onCode: (c) => { bc.value = c; bak(); } });
    return st;
  }
  NS.katalog = { sor, oner, atif, formaBagla };
})();
