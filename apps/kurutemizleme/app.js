/* NEBSOFT Kuru Temizleme & Halı Yıkama: fiş, m² hesabı, parça etiketi ve sayımı, adresten alma, "hazır" SMS'i */
/* Koleksiyonlar: orders, customers, services, staff, sms, requests */
(function () {
  'use strict';
  const { esc, $, on, icon, toast, confirm, badge } = NS;
  // Parça listesi: adetli satırda adet kadar, m² satırında tek parça. İşaretler kod üzerinden korunur.
  const parcalar = (o) => { const eski = new Map((o.pieces || []).map((p) => [p.k, p])); let i = 0; const L = []; (o.lines || []).forEach((l) => { const n = window.SIPHESAP.parcaAdet(l); for (let j = 0; j < n; j++) { const k = `${o.no}-${++i}`; L.push({ k, name: l.name, ok: !!(eski.get(k) || {}).ok }); } }); return L; };
  const ROLES = { admin: 'Yönetici', tezgah: 'Tezgâh', kurye: 'Şoför' };
  window.SIPARIS.kur({
    menu: [{ id: 'pano', label: 'İş Panosu' }, { id: 'siparisler', label: 'Fişler' }, { id: 'fiyatlar', label: 'Fiyat Listesi' }, { id: 'personel', label: 'Personel' }, { id: 'dagitim', label: 'Dağıtım' }],
    id: 'kurutemizleme', ad: 'Kuru Temizleme & Halı Yıkama', tagline: 'Fiş, etiket, adresten alma ve teslim', icon: 'drop', accent: '#0284c7', prefix: 'KT', status: window.KURU.STATUS, seed: window.KURU.seed, single: 'Fiş', panoBaslik: 'İş Panosu', listeBaslik: 'Fişler', docLabel: 'Teslim fişi', hazirKelime: 'Hazır SMS’i', pickup: true, pickupStatus: 'alinacak', delivery: true, adresBaslik: 'Alma ve teslim adresi', staffLabel: 'Sorumlu', units: ['adet', 'm²', 'takım', 'kg'], fiyatBaslik: 'Fiyat Listesi',
    roles: ROLES, navRoles: { ozet: ['admin'], fiyatlar: ['admin'], personel: ['admin'], talepler: ['admin', 'tezgah'], musteriler: ['admin', 'tezgah'], siparisler: ['admin', 'tezgah'], takvim: ['admin', 'tezgah'], pano: ['admin', 'tezgah'] }, home: 'pano',
    lineExtra: [{ name: 'color', label: 'Renk / marka' }], conditionLabel: 'Teslim alınırken durum (leke, yırtık, eksik düğme)', photos: 'Teslim alma fotoğrafları', signIn: 'Eşyamı yukarıda yazan adet, ölçü ve durumla teslim ettim.', talep: true,
    hazirMetni: (o, s) => `${s.bizName}: ${o.no} numaralı fişiniz hazır. Takip kodu: ${o.code}`,
    docInfo: (o) => (o.shelf ? [['Raf', o.shelf]] : []),
    docNote: () => { const g = Number(NS.app.db.settings().beklemeGun) || 0; return g ? `Teslim alınmayan eşya ${g} gün saklanır.` : ''; },
    docs: [['etiket', { label: 'Parça etiketi', sade: true, defaults: { paper: '58mm' }, data: (o) => ({ title: 'Parça etiketleri', no: o.no, date: o.at, money: () => '', lines: parcalar(o).map((p) => ({ name: `${p.k} ${p.name}`, qty: 1, price: 0, total: 0 })) }) }]],
    beforeTeslim: async (o, ctx) => { o.pieces = parcalar(o); const E = o.pieces.filter((p) => !p.ok); if (!E.length) return true; if (!(await confirm(`${E.length} parça sayılmadı: ${E.map((p) => p.k).slice(0, 6).join(', ')}. Yine de teslim edilsin mi?`, { title: 'Parça sayımı', ok: 'Yine de teslim et' }))) return false; ctx.addLog(o, o.status, `Sayılmadan teslim edilen parça: ${E.map((p) => p.k).join(', ')}`); return true; },
    cards: (o) => { const L = parcalar(o); const n = L.filter((p) => p.ok).length; return `<div class="card"><div class="card-h"><h3>${icon('tag')} Parçalar ${badge(`${n}/${L.length}`, n === L.length ? 'ok' : 'warn')}</h3><div class="row nw"><label class="small muted" for="sh">Raf</label><input class="input sm" id="sh" style="max-width:90px" value="${esc(o.shelf || '')}"></div></div><div class="card-b sp-grid">${L.map((p) => `<label class="check small"><input type="checkbox" data-pc="${esc(p.k)}" ${p.ok ? 'checked' : ''}> ${esc(p.k)}<br><span class="faint">${esc(p.name)}</span></label>`).join('')}</div></div>`; },
    bind: (el, o, ctx) => { $('#sh', el).onchange = (e) => { o.shelf = e.target.value.trim(); ctx.addLog(o, o.status, `Raf: ${o.shelf || '-'}`); ctx.db.save(); toast('Raf kaydedildi', 'ok'); };
      on(el, 'change', '[data-pc]', (e, c) => { o.pieces = parcalar(o); const p = o.pieces.find((x) => x.k === c.dataset.pc); if (p) p.ok = c.checked; ctx.db.save(); }); },
    settings: [{ name: 'beklemeGun', label: 'Teslim alınmayan eşya bekleme süresi (gün)', type: 'number', hint: 'Fişe yazılır. Süreyi hukuk danışmanınıza doğrulatın.' }],
    integrations: ['sms', 'whatsapp', 'email', 'printer', 'label', 'efatura', 'backup'],
  });
})();
