/* NEBSOFT Ön Muhasebe — Tekrarlayan faturalar (kira, abonelik, bakım sözleşmesi, aidat…)
   Bir faturadan şablon oluşturulur; dönem gelince fatura kendiliğinden kesilir. Program kapalıyken geçen dönemler bir sonraki
   açılışta sırayla oluşturulur (hiçbiri atlanmaz) ve kullanıcıya bildirilir. İsteğe bağlı: oluşan fatura e-Fatura / e-Arşiv olarak
   gönderilir — eksik bilgi varsa gönderilmez, "gönderilmeyi bekleyen" olarak bildirilir (sessiz hata yok). */
window.MUHTEKRAR = (function () {
  'use strict';
  const { esc, $, on, icon, money, toast, confirm, formModal, table, badge, pageHead, iso, today } = NS;
  let X; // { db, cari, invTotals, createDoc, sendEDoc, cm }
  const PER = { aylik: ['Her ay', 1], ucaylik: ['3 ayda bir', 3], altiaylik: ['6 ayda bir', 6], yillik: ['Her yıl', 12], haftalik: ['Her hafta', 0] };
  // Ayın son gününü aşmadan dönem ekler (31 Ocak → 28/29 Şubat → 31 Mart: istenen gün korunur)
  function step(dateIso, per, day) {
    const d = new Date(dateIso + 'T12:00:00');
    if (per === 'haftalik') { d.setDate(d.getDate() + 7); return iso(d); }
    const m = d.getMonth() + PER[per][1]; const y = d.getFullYear() + Math.floor(m / 12); const mm = ((m % 12) + 12) % 12;
    const last = new Date(y, mm + 1, 0).getDate(); return iso(new Date(y, mm, Math.min(day || d.getDate(), last), 12));
  }
  // Vadesi gelen tüm dönemleri oluşturur; dönüş: oluşturulan fatura listesi
  function run({ silent } = {}) {
    if (!X) return [];
    const made = []; const t = today();
    X.db.all('recurring', (r) => r.active !== false).forEach((r) => {
      let guard = 0;
      while (r.next && r.next <= t && (!r.end || r.next <= r.end) && guard++ < 120) {
        const c = X.cari(r.cari); if (!c || !c.id) { r.active = false; r.stopReason = 'Cari silinmiş'; break; }
        const doc = X.createDoc('satis', { cari: r.cari, date: r.next, due: iso(new Date(new Date(r.next + 'T12:00:00').getTime() + (Number(c.term) || 0) * 864e5)), currency: r.currency || 'TRY', rate: r.currency && r.currency !== 'TRY' ? r.rate || 1 : 1, depot: r.depot, lines: JSON.parse(JSON.stringify(r.lines)), note: (r.note || '').replace(/\{dönem\}/g, NS.MONTHS[Number(r.next.slice(5, 7)) - 1] + ' ' + r.next.slice(0, 4)), recurring: r.id });
        made.push({ r, doc }); r.count = (r.count || 0) + 1; r.last = r.next; r.next = step(r.next, r.period, r.day);
      }
      if (r.end && r.next > r.end) { r.active = false; r.stopReason = 'Bitiş tarihine ulaşıldı'; }
    });
    if (made.length) { X.db.save(); X.db.log('Tekrarlayan faturalar oluşturuldu', made.map((m) => m.doc.no).join(', ')); if (!silent) toast(`${made.length} tekrarlayan fatura oluşturuldu`, 'ok'); }
    return made;
  }
  // Otomatik e-Belge: yalnızca bilgileri tam olan faturalar gönderilir, kalanlar listede "bekliyor" görünür
  async function sendQueued(app, made) {
    const pend = [];
    for (const { r, doc } of made) {
      if (!r.autoSend) continue;
      const c = X.cari(doc.cari); const s = X.db.settings();
      if (!String(c.district || '').trim() || !String(c.city || '').trim() || !String(s.bizDistrict || '').trim() || !String(s.bizCity || '').trim()) { pend.push(doc.no); continue; }
      const res = await X.sendEDoc(app, doc, { auto: true }); if (!res || !res.ok) pend.push(doc.no);
    }
    if (pend.length) NS.toast(`${pend.length} tekrarlayan fatura e-Belge olarak gönderilemedi (${pend.join(', ')}) — Faturalar ekranından gönderin`, 'warn');
  }
  async function create(app, inv) {
    const v = await formModal({ title: `${inv.no} — tekrarlayan fatura`, fields: [
      { type: 'section', label: 'Bu faturanın kalemleriyle düzenli fatura kesilir' },
      { name: 'period', label: 'Sıklık', type: 'select', options: Object.entries(PER).map(([value, [label]]) => ({ value, label })) },
      { name: 'start', label: 'İlk fatura tarihi', type: 'date', required: true, value: step(inv.date, 'aylik') },
      { name: 'end', label: 'Bitiş tarihi (boşsa süresiz)', type: 'date' },
      { name: 'note', label: 'Fatura notu ({dönem} → "Kasım 2026")', full: true, value: inv.note || '{dönem} dönemi hizmet bedeli' },
      { name: 'autoSend', label: 'Oluşunca e-Fatura / e-Arşiv olarak gönder', type: 'checkbox' }] });
    if (!v) return;
    if (v.end && v.end < v.start) return toast('Bitiş tarihi ilk faturadan önce olamaz', 'err');
    const r = X.db.insert('recurring', { cari: inv.cari, currency: inv.currency || 'TRY', rate: inv.rate || 1, depot: inv.depot, lines: JSON.parse(JSON.stringify(inv.lines)), note: v.note, period: v.period, day: Number(v.start.slice(8, 10)), next: v.start, end: v.end || '', autoSend: !!v.autoSend, active: true, source: inv.no, count: 0 });
    toast(`Tekrarlayan fatura kuruldu: ${PER[r.period][0]}, ilk fatura ${NS.date(r.next)}`, 'ok');
    const made = run(); if (made.length) sendQueued(app, made);
    app.refresh();
  }
  function page(el, p, app) {
    const draw = () => {
      const rows = X.db.all('recurring').sort((a, b) => String(a.next).localeCompare(String(b.next)));
      const monthly = rows.filter((r) => r.active !== false).reduce((s, r) => s + X.invTotals(r).tl / (r.period === 'haftalik' ? 12 / 52 : PER[r.period][1]), 0);
      el.innerHTML = pageHead('Tekrarlayan faturalar', 'Kira, abonelik, bakım sözleşmesi gibi düzenli faturalar kendiliğinden kesilir', `<button class="btn primary" id="rn">${icon('refresh')} Vadesi gelenleri şimdi oluştur</button>`) + `
        <div class="grid g3 mb">${NS.kpi('Aktif şablon', rows.filter((r) => r.active !== false).length, 'refresh')}${NS.kpi('Aylık ortalama gelir', money(monthly), 'trend', 'ok')}${NS.kpi('Bu ay kesilecek', rows.filter((r) => r.active !== false && r.next && r.next.slice(0, 7) === today().slice(0, 7)).length, 'calendar', 'info')}</div>
        <div class="card">${table({ rows, empty: 'Henüz tekrarlayan fatura yok. Faturalar listesinde bir faturanın "Tekrarla" düğmesiyle kurun.', emptyIcon: 'refresh', columns: [
          { label: 'Cari', render: (r) => `<b>${esc(X.cari(r.cari).name)}</b><div class="small faint">Kaynak: ${esc(r.source || '-')}</div>` },
          { label: 'Sıklık', render: (r) => esc(PER[r.period][0]) },
          { label: 'Tutar', cls: 'right', render: (r) => X.cm(X.invTotals(r).total, r.currency) },
          { label: 'Sonraki', render: (r) => (r.active === false ? '—' : NS.date(r.next)) },
          { label: 'Kesilen', render: (r) => `${r.count || 0}${r.last ? `<div class="small faint">son ${NS.date(r.last)}</div>` : ''}` },
          { label: 'Durum', render: (r) => (r.active === false ? badge(r.stopReason || 'Durduruldu', '') : badge('Aktif', 'ok')) + (r.autoSend ? ' ' + badge('e-Belge', 'acc') : '') }],
          actions: [{ icon: 'check', act: 'go', title: 'Devam ettir', show: (r) => r.active === false && (!r.end || r.next <= r.end) }, { icon: 'clock', act: 'ps', title: 'Duraklat', show: (r) => r.active !== false }, { icon: 'trash', act: 'del', title: 'Sil' }] })}</div>`;
      $('#rn', el).onclick = async () => { const made = run(); if (!made.length) toast('Vadesi gelen tekrarlayan fatura yok'); else await sendQueued(app, made); draw(); };
    };
    on(el, 'click', '[data-act]', async (e, b) => {
      const r = X.db.get('recurring', b.dataset.id); if (!r) return;
      if (b.dataset.act === 'ps') { X.db.update('recurring', r.id, { active: false, stopReason: 'Duraklatıldı' }); toast('Duraklatıldı', 'ok'); }
      else if (b.dataset.act === 'go') { const t = today(); let n = r.next; while (n < t) n = step(n, r.period, r.day); X.db.update('recurring', r.id, { active: true, stopReason: '', next: n }); toast(`Devam ediyor; sonraki fatura ${NS.date(n)} (duraklatılan dönemler kesilmedi)`, 'ok'); }
      else if (b.dataset.act === 'del' && (await confirm('Tekrarlayan fatura şablonu silinsin mi? Daha önce kesilen faturalar silinmez.'))) X.db.remove('recurring', r.id);
      draw();
    });
    draw();
  }
  return { init(ctx) { X = ctx; }, run, sendQueued, create, page, step, PER };
})();
