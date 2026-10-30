/* NEBSOFT yönetim paneli: iş ortağı başvuruları, öneriler ve bakım kayıtları. panel-ek.js'ten sonra, panel.js'ten önce yüklenir; menü ve sayfaları window.PANEL_EK listesine ekler. Uçlar: server/cloud/vitrin.js */
(function () {
  'use strict';
  const { api, esc, $, on, icon, toast, confirm, formModal, table, badge, pageHead } = NS;
  const C = window.CATALOG;
  const pname = (id) => (C.products.find((p) => p.id === id) || { name: id }).name;
  const dt = (d) => (d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }) : '-');
  const sec = (id, v, L) => `<select class="input" data-st="${esc(id)}" style="height:30px;min-width:150px">${Object.entries(L).map(([k, a]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>`;
  const yerel = (d) => { if (!d) return ''; const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 60e3).toISOString().slice(0, 16); };

  const BD = { yeni: 'Yeni', gorusuluyor: 'Görüşülüyor', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' };
  async function bayiler(el) {
    let R = null;
    const draw = async () => {
      R = await api('GET', '/api/admin/bayiler');
      el.innerHTML = pageHead('İş ortağı başvuruları', 'Bayi ve mali müşavir başvuruları. Sitede yalnız onaylanan ve izin veren kayıtlar listelenir.') + `<div class="card">${table({ rows: R.rows, empty: 'Başvuru yok', emptyIcon: 'users', columns: [
        { label: 'Başvuran', render: (x) => `<b>${esc(x.unvan)}</b><div class="small faint">${esc(x.yetkili)} · ${esc(x.il)}</div>` }, { label: 'Tür', render: (x) => badge(R.turler[x.tur] || x.tur, 'acc') },
        { label: 'İletişim', render: (x) => `<span class="small">${esc(x.telefon)}<br>${esc(x.eposta)}</span>` }, { label: 'Not', render: (x) => `<span class="small">${esc(x.notu || '')}</span>` }, { label: 'Tarih', render: (x) => dt(x.created) },
        { label: 'Durum', render: (x) => sec(x.id, x.durum, BD) }, { label: 'Sitede', render: (x) => (x.vitrin_izin ? `<label class="check small"><input type="checkbox" data-vt="${esc(x.id)}" ${x.vitrin ? 'checked' : ''}> Listele</label>` : '<span class="small faint">İzin yok</span>') }] })}</div>`;
    };
    const kaydet = async (id) => { const x = R.rows.find((y) => y.id === id); const durum = $(`[data-st="${id}"]`, el).value; const k = $(`[data-vt="${id}"]`, el); try { await api('POST', `/api/admin/bayiler/${id}`, { durum, vitrin: !!(k && k.checked) }); toast('Güncellendi', 'ok'); } catch (e) { toast(e.message, 'err'); } await draw(); return x; };
    on(el, 'change', '[data-st]', (e, s) => kaydet(s.dataset.st)); on(el, 'change', '[data-vt]', (e, s) => kaydet(s.dataset.vt));
    await draw();
  }

  const OD = { yeni: 'Yeni', degerlendiriliyor: 'Değerlendiriliyor', planlandi: 'Planlandı', yapildi: 'Yapıldı', reddedildi: 'Reddedildi (sayılmaz)' };
  async function oneriler(el) {
    const draw = async () => {
      const r = await api('GET', '/api/admin/oneriler'); const top = r.sayim.reduce((s, x) => s + x.n, 0); const en = Math.max(1, ...r.sayim.map((x) => x.n));
      el.innerHTML = pageHead('Öneri kutusu', 'Müşterilerin istekleri ve hangi programın kaç kez istendiği. Reddedilenler sayıma girmez.')
        + `<h3 class="mb">En çok istenenler</h3><div class="card pad mb">${r.sayim.length ? r.sayim.map((x) => `<div class="row mb"><div style="flex:0 0 42%;min-width:0"><b>${esc(x.ad)}</b></div><div class="grow" style="background:var(--bg-2);border-radius:6px;height:10px"><div style="width:${Math.round((x.n / en) * 100)}%;height:10px;border-radius:6px;background:var(--accent)"></div></div><b style="min-width:36px;text-align:right">${x.n}</b></div>`).join('') + `<div class="small faint">Toplam ${top} istek</div>` : '<span class="small faint">Henüz istek yok</span>'}</div>
        <h3 class="mb">İstekler</h3><div class="card">${table({ rows: r.rows, empty: 'Öneri yok', emptyIcon: 'message', columns: [{ label: 'Konu', render: (x) => (x.yeni_program ? `${badge('Yeni program', 'warn')} <b>${esc(x.yeni_program)}</b>` : x.program ? badge(pname(x.program), 'acc') : '<span class="small faint">Genel</span>') }, { label: 'İstek', render: (x) => `<span class="small">${esc(x.metin)}</span>` }, { label: 'E-posta', render: (x) => `<span class="small">${esc(x.eposta || '-')}</span>` }, { label: 'Tarih', render: (x) => dt(x.created) }, { label: 'Durum', render: (x) => sec(x.id, x.durum, OD) }] })}</div>`;
    };
    on(el, 'change', '[data-st]', async (e, s) => { try { await api('POST', `/api/admin/oneriler/${s.dataset.st}`, { durum: s.value }); toast('Güncellendi', 'ok'); await draw(); } catch (x) { toast(x.message, 'err'); } });
    await draw();
  }

  async function bakim(el) {
    let R = null;
    const draw = async () => {
      R = await api('GET', '/api/admin/bakim');
      el.innerHTML = pageHead('Bakım kayıtları', 'Sistem durumu sayfasında görünen kayıtlar. Yalnız gerçekten yapılan veya planlanan işi yazın.', `<button class="btn" onclick="window.open('/sistem-durumu/','_blank')">${icon('eye')} Sayfayı aç</button><button class="btn primary" id="yk">${icon('plus')} Kayıt</button>`)
        + `<div class="card">${table({ rows: R.rows, empty: 'Bakım kaydı yok', emptyIcon: 'clock', columns: [{ label: 'Başlık', render: (x) => `<b>${esc(x.baslik)}</b><div class="small faint">${esc(x.aciklama || '')}</div>` }, { label: 'Tür', render: (x) => esc(R.turler[x.tur] || x.tur) }, { label: 'Başlangıç', render: (x) => dt(x.bas) }, { label: 'Bitiş', render: (x) => dt(x.bit) }, { label: 'Durum', render: (x) => (x.yayinda ? badge('Yayında', 'ok') : badge('Taslak', '')) }], actions: [{ icon: 'edit', act: 'ed', title: 'Düzenle' }, { icon: 'trash', act: 'sl', title: 'Sil', cls: 'danger' }] })}</div>`;
    };
    const duzenle = async (x = {}) => {
      const v = await formModal({ title: 'Bakım kaydı', submitLabel: 'Kaydet', fields: [{ name: 'tur', label: 'Tür', type: 'select', required: true, value: x.tur || 'planli', options: Object.entries(R.turler).map(([value, label]) => ({ value, label })) }, { name: 'baslik', label: 'Başlık', required: true, full: true, value: x.baslik || '' }, { name: 'bas', label: 'Başlangıç', type: 'datetime-local', required: true, value: yerel(x.bas) }, { name: 'bit', label: 'Bitiş', type: 'datetime-local', value: yerel(x.bit) }, { name: 'aciklama', label: 'Açıklama', type: 'textarea', full: true, value: x.aciklama || '' }, { name: 'yayinda', label: 'Sitede yayınla', type: 'checkbox', value: !!x.yayinda }] });
      if (!v) return; try { await api('POST', '/api/admin/bakim', { ...v, id: x.id, yayinda: !!v.yayinda, bas: v.bas ? new Date(v.bas).toISOString() : '', bit: v.bit ? new Date(v.bit).toISOString() : '' }); toast('Kaydedildi', 'ok'); await draw(); } catch (e) { toast(e.message, 'err'); }
    };
    on(el, 'click', '#yk', () => duzenle());
    on(el, 'click', '[data-act]', async (e, b) => { const a = b.dataset.act; const id = b.closest('tr').dataset.id; if (a === 'ed') return duzenle(R.rows.find((x) => x.id === id)); if (a !== 'sl' || !(await confirm('Kayıt silinsin mi?'))) return; try { await api('DELETE', `/api/admin/bakim/${id}`); await draw(); } catch (x) { toast(x.message, 'err'); } });
    await draw();
  }
  const E = window.PANEL_EK;
  E.nav.push({ id: 'bayiler', label: 'İş ortakları', icon: 'users', after: 'teklifler' }, { id: 'oneriler', label: 'Öneri kutusu', icon: 'message', after: 'bayiler' }, { id: 'bakim', label: 'Bakım kayıtları', icon: 'clock', after: 'duyuru' });
  Object.assign(E.routes, { bayiler, oneriler, bakim });
}());
