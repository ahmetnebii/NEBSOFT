/* Yönetici paneli — ortak katalog moderasyonu: öneri kuyruğu, birleştirme geçmişi, tedarikçi listesi.
   Open Food Facts kaydı burada değiştirilmez; düzeltme gerekiyorsa onay, catalog_own'da üstüne yazma kaydı açar. */
(function () {
  'use strict';
  const { esc, icon, toast, modal, pageHead, table, badge, kpi, confirm, formModal } = window.NS;
  const ROZET = { hatali_gtin: ['Hatalı GTIN', 'err'], ayni_gtin_farkli_ad: ['Aynı GTIN, farklı ad', 'warn'], benzer_ad: ['Benzer ad', 'info'] };
  const DURUM = [['bekliyor', 'Bekleyen'], ['onaylandi', 'Onaylanan'], ['birlesti', 'Birleşen'], ['reddedildi', 'Reddedilen']];
  const FILTRE = [['', 'Tümü'], ['hatali_gtin', 'Hatalı GTIN'], ['ayni_gtin_farkli_ad', 'Aynı GTIN farklı ad'], ['benzer_ad', 'Benzer ad']];
  const duz = (d) => (d ? new Date(d).toLocaleString('tr-TR') : '-');
  window.NS_KATALOG_PANEL = async (el, { api }) => {
    let durum = 'bekliyor', filtre = '', sekme = 'kuyruk';
    const degerAl = (r, baslik, ek = []) => formModal({ title: baslik, fields: [...ek, { name: 'ad', label: 'Ürün adı', required: true, full: true }, { name: 'marka', label: 'Marka' }, { name: 'kategori', label: 'Kategori' }], values: r });
    const yap = async (fn, msg) => { try { await fn(); toast(msg, 'ok'); ciz(); } catch (e) { toast(e.message, 'err'); } };
    const kuyruk = async (b) => {
      const R = (await api('GET', `/api/admin/katalog/oneriler?durum=${durum}&filtre=${filtre}`)).rows; const bek = durum === 'bekliyor';
      b.innerHTML = `<div class="card"><div class="card-h"><div class="seg">${DURUM.map(([v, l]) => `<button data-d="${v}" class="${v === durum ? 'active' : ''}">${l}</button>`).join('')}</div><div class="seg">${FILTRE.map(([v, l]) => `<button data-f="${v}" class="${v === filtre ? 'active' : ''}">${l}</button>`).join('')}</div></div>
      ${table({ rows: R, empty: 'Bu görünümde öneri yok', emptyIcon: 'box', columns: [
        { label: 'GTIN', render: (r) => `<span class="mono">${esc(r.gtin)}</span>` },
        { label: 'Ürün', render: (r) => `<b>${esc(r.ad)}</b><div class="small faint">${esc([r.marka, r.kategori].filter(Boolean).join(' · '))}</div>${(r.farkli || []).map((x) => `<div class="small">${x.nerede === 'ext' ? 'Open Food Facts' : x.nerede === 'own' ? 'Katalog' : 'Öneri'}: ${esc(x.ad)}</div>`).join('')}${(r.benzer || []).map((x) => `<div class="small">Benzer: ${esc(x.ad)} <span class="mono faint">${esc(x.gtin)}</span></div>`).join('')}` },
        { label: 'Kaynak', render: (r) => `${esc(r.kaynak)}<div class="small faint">${esc(r.lisans)}</div>` },
        { label: 'Adet', render: (r) => r.sayac },
        { label: 'Uyarı', render: (r) => r.bayraklar.map((x) => badge(...ROZET[x])).join(' ') || '-' },
      ], actions: bek ? [{ icon: 'check', act: 'on', title: 'Onayla' }, { icon: 'link', act: 'bi', title: 'Birleştir' }, { icon: 'x', act: 're', title: 'Reddet' }] : [] })}</div>`;
      b.onclick = async (e) => {
        const d = e.target.closest('[data-d]'); if (d) { durum = d.dataset.d; return ciz(); } const f = e.target.closest('[data-f]'); if (f) { filtre = f.dataset.f; return ciz(); }
        const a = e.target.closest('[data-act]'); if (!a) return; const r = R.find((x) => String(x.id) === a.dataset.id); if (!r) return;
        if (a.dataset.act === 'on') { const v = await degerAl(r, 'Öneriyi onayla', [{ name: 'gtin', label: 'GTIN', required: true }]); if (v) yap(() => api('POST', `/api/admin/katalog/oneri/${r.id}/onay`, v), 'Kataloğa eklendi'); }
        if (a.dataset.act === 'bi') { const v = await degerAl({ ...r, hedef_gtin: (r.benzer[0] && r.benzer[0].gtin) || r.gtin }, 'Birleştir (geri alınabilir)', [{ name: 'hedef_gtin', label: 'Hedef GTIN', required: true }]); if (v) yap(() => api('POST', `/api/admin/katalog/oneri/${r.id}/birlestir`, v), 'Birleştirildi'); }
        if (a.dataset.act === 're') { const v = await formModal({ title: 'Öneriyi reddet', fields: [{ name: 'neden', label: 'Neden', full: true }], submitLabel: 'Reddet' }); if (v) yap(() => api('POST', `/api/admin/katalog/oneri/${r.id}/ret`, v), 'Reddedildi'); }
      };
    };
    const gecmis = async (b) => {
      const R = (await api('GET', '/api/admin/katalog/birlestirmeler')).rows;
      b.innerHTML = `<div class="card">${table({ rows: R, empty: 'Henüz birleştirme yok', emptyIcon: 'list', columns: [{ label: 'Tarih', render: (r) => duz(r.zaman) }, { label: 'GTIN', render: (r) => `<span class="mono">${esc(r.hedef_gtin)}</span>` }, { label: 'Önce → sonra', render: (r) => { const o = JSON.parse(r.onceki || 'null'); const s = JSON.parse(r.sonraki); return `${esc(o ? o.ad : '(yeni kayıt)')} → <b>${esc(s.ad)}</b>`; } }, { label: 'Durum', render: (r) => (r.geri_alindi ? badge('Geri alındı') : badge('Etkin', 'ok')) }], actions: [{ icon: 'back', act: 'ga', title: 'Geri al', show: (r) => !r.geri_alindi }] })}</div>`;
      b.onclick = async (e) => { const a = e.target.closest('[data-act=ga]'); if (a && await confirm('Birleştirme geri alınsın mı? Öneri kuyruğa döner.', { title: 'Geri al', ok: 'Geri al', danger: false })) yap(() => api('POST', `/api/admin/katalog/birlestirme/${a.dataset.id}/geri-al`), 'Geri alındı'); };
    };
    const tedarik = (b) => {
      b.innerHTML = `<div class="card"><div class="card-b"><p class="small muted mb">Yalnız izinli tedarikçi listesi yükleyin. Sütunlar: barkod, ürün adı, marka, kategori. Fiyat ve stok sütunları okunmaz. Kayıtlar önce öneri kuyruğuna düşer.</p>
        <div class="grid g2"><label class="col small">Tedarikçi adı<input class="input" id="tk"></label><label class="col small">Lisans veya izin (zorunlu)<input class="input" id="tl" placeholder="Örn. tedarikçinin yazılı izni, tarih"></label><label class="col small" style="grid-column:1/-1">Kaynak adresi (varsa)<input class="input" id="tu"></label></div>
        <div class="row mt"><input type="file" id="tf" accept=".csv,.tsv,.txt"><button class="btn" id="to">${icon('eye')} Önizle</button><button class="btn primary" id="ty" disabled>${icon('upload')} Kuyruğa al</button></div><div id="tr" class="mt"></div></div></div>`;
      let metin = ''; const g = (i) => b.querySelector(i); const veri = (onizleme) => ({ csv: metin, kaynak: g('#tk').value, lisans: g('#tl').value, kaynak_url: g('#tu').value, onizleme });
      g('#tf').onchange = async (e) => { const f = e.target.files[0]; metin = f ? await f.text() : ''; g('#ty').disabled = true; };
      const yaz = (r) => { g('#tr').innerHTML = `<div class="small">${r.toplam} satır: ${r.gecerli} geçerli, ${r.hataliGtin} hatalı GTIN (işaretli), ${r.reddedilen} reddedildi</div><div class="tbl-wrap mt"><table class="tbl"><tbody>${r.ornek.map((x) => `<tr><td class="mono">${esc(x.gtin)}</td><td>${esc(x.ad)}</td><td>${esc(x.marka || '')}</td><td>${x.hatali ? badge('Hatalı GTIN', 'err') : ''}</td></tr>`).join('')}</tbody></table></div>`; };
      g('#to').onclick = async () => { if (!metin) return toast('Önce dosya seçin', 'err'); try { yaz(await api('POST', '/api/admin/katalog/tedarikci', veri(true))); g('#ty').disabled = false; } catch (e) { toast(e.message, 'err'); } };
      g('#ty').onclick = async () => { try { yaz(await api('POST', '/api/admin/katalog/tedarikci', veri(false))); g('#ty').disabled = true; toast('Kuyruğa alındı', 'ok'); } catch (e) { toast(e.message, 'err'); } };
    };
    async function ciz() {
      const d = await api('GET', '/api/admin/katalog/durum');
      el.innerHTML = pageHead('Ortak katalog', 'Müşteri ve tedarikçi önerilerini inceleyin. Open Food Facts verisi ayrı tutulur, değiştirilmez.') + `<div class="grid g4 mb">${kpi('Bekleyen öneri', d.bekleyen, 'clock', 'warn')}${kpi('Kendi kataloğumuz', d.own, 'box', 'ok')}${kpi('Open Food Facts', d.ext, 'data', 'info')}${kpi('Birleştirme', d.birlestirme, 'link', 'info')}</div>
        <div class="seg mb" id="sk">${[['kuyruk', 'Öneri kuyruğu'], ['gecmis', 'Birleştirmeler'], ['tedarik', 'Tedarikçi listesi']].map(([v, l]) => `<button data-s="${v}" class="${v === sekme ? 'active' : ''}">${l}</button>`).join('')}</div><div id="kb"></div>`;
      el.querySelector('#sk').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { sekme = b.dataset.s; ciz(); } };
      const b = el.querySelector('#kb'); await ({ kuyruk, gecmis, tedarik }[sekme])(b);
    }
    await ciz();
  };
})();
