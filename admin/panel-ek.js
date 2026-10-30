/* NEBSOFT yönetim paneli ek sayfaları: Deneme takibi ve Güven kanıtı. panel.js'ten önce yüklenir, menü ve sayfaları window.PANEL_EK ile verir.
   Deneme takibinde e-posta durumu trial_mail tablosundaki gerçek sonuçtur. WhatsApp otomatik gönderilmez: taslak + wa.me bağlantısı. */
(function () {
  'use strict';
  const { api, esc, $, on, icon, toast, confirm, formModal, table, badge, pageHead } = NS;
  const C = window.CATALOG;
  const pname = (id) => (C.products.find((p) => p.id === id) || { name: id || 'Genel' }).name;
  const urunler = [{ value: '', label: 'Genel (tüm programlar)' }, ...C.products.map((p) => ({ value: p.id, label: p.name }))];
  const bugun = () => new Date().toISOString().slice(0, 10);
  const mb = { 'gönderildi': 'ok', hata: 'err', 'gönderiliyor': 'warn' };

  async function denemeTakip(el) {
    const draw = async () => {
      const r = await api('GET', '/api/admin/deneme-takip'); const pz = r.pazarlama || {};
      el.innerHTML = pageHead('Deneme takibi', 'Süren denemeler, gerçek kurulum ilerlemesi ve e-posta sonuçları')
        + (!r.mailReady ? `<div class="card pad mb">${badge('E-posta gönderilmiyor', 'err')} <span class="small">E-posta ayarı yapılmadı; dizi başlamaz ve hiçbir kayıt "gönderildi" görünmez.</span></div>` : '')
        + (!r.siteUrl ? `<div class="card pad mb">${badge('Site adresi yok', 'err')} <span class="small">Site Ayarları'nda site adresini girin; çıkış bağlantısı üretilemediği için e-posta gönderilmez.</span></div>` : '')
        + `<div class="card">${table({ rows: r.rows, empty: 'Süren deneme yok', emptyIcon: 'key', columns: [
          { label: 'İşletme', render: (x) => `<b>${esc(x.biz || '-')}</b><div class="small faint">${esc(x.uname || '')} · ${esc(x.email || '')}</div>${x.cikti ? badge('E-posta çıkışı yaptı', 'warn') : ''}` },
          { label: 'Program', render: (x) => badge(pname(x.product), 'acc') }, { label: 'Kalan', render: (x) => `${x.kalan} gün` },
          { label: 'Kurulum', render: (x) => `${x.done}/${x.total}${x.sample ? ' <span class="small faint">(örnek veri var)</span>' : ''}` },
          { label: 'E-posta', render: (x) => (x.mails.length ? x.mails.map((m) => badge(`${m.step}: ${m.status}`, mb[m.status] || '')).join(' ') : '<span class="small faint">Henüz yok</span>') },
          { label: 'WhatsApp', render: (x) => (x.wa ? `<a class="btn sm" href="${esc(x.wa)}" target="_blank" rel="noopener">${icon('message')} Taslakla aç</a>` : '<span class="small faint">Cep numarası yok</span>') }] })}</div>
        <div class="card pad mt" id="pz" style="max-width:640px"><h3 class="mb">Tanıtım iletisi şartları</h3><p class="small muted mb">Tanıtım içeren e-posta için izin ve İYS kaydı gerekir. Bu beyan işaretlenmeden tanıtım satırı ve toplu e-posta gönderilmez. İzinlerin İYS'ye aktarımı henüz programda yoktur; elle yapılmalıdır.</p>
          <label class="check small mb"><input type="checkbox" name="iys" ${pz.iys ? 'checked' : ''}> <span>İYS'ye kayıtlıyız ve izinleri İYS'ye işliyoruz</span></label>${NS.fieldsHtml([{ name: 'unvan', label: 'Ticaret unvanı' }, { name: 'mersis', label: 'MERSİS numarası' }], pz)}<button class="btn mt" id="pzs">Kaydet</button></div>`;
      $('#pzs', el).onclick = async () => { const b = $('#pz', el); try { await api('PUT', '/api/admin/pazarlama', { ...NS.readForm(b), iys: b.querySelector('[name=iys]').checked }); toast('Kaydedildi', 'ok'); } catch (x) { toast(x.message, 'err'); } };
    };
    await draw();
  }

  const izin = (v) => [{ name: 'consent', label: 'Kişiden yayın izni aldım', type: 'checkbox', value: !!v.consent, full: true }, { name: 'consent_at', label: 'İzin tarihi', type: 'date', value: v.consent_at || '', required: true }, { name: 'proof', label: 'İzin belgesinin yeri (dışarıda görünmez)', value: v.proof || '' }, { name: 'published', label: 'Yayınla', type: 'checkbox', value: !!v.published }];
  const yorumF = (v) => [{ name: 'product', label: 'Program', type: 'select', options: urunler, value: v.product || '' }, { name: 'author', label: 'Yorum sahibi', required: true, value: v.author || '' }, { name: 'biz', label: 'İşletme', value: v.biz || '' }, { name: 'city', label: 'İl', value: v.city || '' }, { name: 'review_at', label: 'Yorum tarihi', type: 'date', required: true, value: v.review_at || bugun() }, { name: 'text', label: 'Yorum (kişinin kendi sözleri)', type: 'textarea', full: true, required: true, value: v.text || '' }, ...izin(v)];
  const vakaF = (v) => [{ name: 'product', label: 'Program', type: 'select', options: urunler, value: v.product || '' }, { name: 'biz', label: 'İşletme', required: true, value: v.biz || '' }, { name: 'sector', label: 'Sektör', value: v.sector || '' }, { name: 'city', label: 'İl', value: v.city || '' }, { name: 'title', label: 'Başlık', full: true, required: true, value: v.title || '' }, { name: 'problem', label: 'Sorun', type: 'textarea', full: true, required: true, value: v.problem || '' }, { name: 'solution', label: 'Çözüm', type: 'textarea', full: true, required: true, value: v.solution || '' }, { name: 'result', label: 'Ölçülen sonuç (rakamla)', type: 'textarea', full: true, required: true, value: v.result || '' }, { name: 'period', label: 'Ölçüm dönemi', required: true, value: v.period || '' }, { name: 'case_at', label: 'Vaka tarihi', type: 'date', required: true, value: v.case_at || bugun() }, ...izin(v)];

  async function guven(el) {
    let R = null;
    const draw = async () => {
      R = await api('GET', '/api/admin/guven');
      const durum = (x) => (x.published ? badge('Yayında', 'ok') : badge('Taslak', ''));
      el.innerHTML = pageHead('Güven kanıtı', 'Yalnızca izinli, gerçek kayıtlar yayınlanır. Kayıt yoksa sitede bölüm görünmez.', `<button class="btn" id="nv">${icon('plus')} Vaka</button><button class="btn primary" id="ny">${icon('plus')} Yorum</button>`)
        + `<div class="card pad mb row"><div class="grow"><b>Kullanan işletme sayacı</b><div class="small muted">Ödenmiş, süresi geçmemiş lisanslardan hesaplanır; eşiğin üstünde görünür. Şu an: ${R.gosterilen ? `<b>${R.gosterilen}</b> gösteriliyor` : 'gizli (eşiğin altında)'}</div></div><input class="input" type="number" min="1" id="es" value="${R.esik}" style="max-width:110px" aria-label="Eşik"><button class="btn" id="ess">Kaydet</button></div>
        <h3 class="mb">Yorumlar</h3><div class="card mb">${table({ rows: R.reviews, empty: 'Yorum yok', emptyIcon: 'message', columns: [{ label: 'Kişi', render: (x) => `<b>${esc(x.author)}</b><div class="small faint">${esc(x.biz || '')}</div>` }, { label: 'Program', render: (x) => esc(pname(x.product)) }, { label: 'Yorum', render: (x) => esc(x.text.slice(0, 90)) }, { label: 'İzin', render: (x) => esc(x.consent_at) }, { label: 'Durum', render: durum }], actions: [{ icon: 'edit', act: 'ey', title: 'Düzenle' }, { icon: 'trash', act: 'sy', title: 'Sil', cls: 'danger' }] })}</div>
        <h3 class="mb">Vaka çalışmaları</h3><div class="card">${table({ rows: R.cases, empty: 'Vaka yok', emptyIcon: 'file', columns: [{ label: 'İşletme', render: (x) => `<b>${esc(x.biz)}</b>` }, { label: 'Başlık', render: (x) => esc(x.title) }, { label: 'Dönem', render: (x) => esc(x.period) }, { label: 'İzin', render: (x) => esc(x.consent_at) }, { label: 'Durum', render: durum }], actions: [{ icon: 'edit', act: 'ev', title: 'Düzenle' }, { icon: 'trash', act: 'sv', title: 'Sil', cls: 'danger' }] })}</div>`;
    };
    const duzenle = async (tur, x) => { const v = await formModal({ title: tur === 'yorum' ? 'Yorum' : 'Vaka çalışması', fields: (tur === 'yorum' ? yorumF : vakaF)(x || {}), submitLabel: 'Kaydet' }); if (!v) return; try { await api('POST', `/api/admin/guven/${tur}`, { ...v, id: x && x.id, consent: !!v.consent, published: !!v.published }); toast('Kaydedildi', 'ok'); await draw(); } catch (e) { toast(e.message, 'err'); } };
    on(el, 'click', '#ny', () => duzenle('yorum')); on(el, 'click', '#nv', () => duzenle('vaka'));
    on(el, 'click', '#ess', async () => { try { await api('PUT', '/api/admin/guven/ayar', { esik: Number($('#es', el).value) }); toast('Kaydedildi', 'ok'); await draw(); } catch (e) { toast(e.message, 'err'); } });
    on(el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act; const id = b.closest('tr').dataset.id; if (!/^(ey|ev|sy|sv)$/.test(a)) return;
      if (a === 'ey') return duzenle('yorum', R.reviews.find((x) => x.id === id)); if (a === 'ev') return duzenle('vaka', R.cases.find((x) => x.id === id));
      if (!(await confirm('Kayıt silinsin mi?'))) return; await api('DELETE', `/api/admin/guven/${a === 'sy' ? 'yorum' : 'vaka'}/${id}`); await draw();
    });
    await draw();
  }
  window.PANEL_EK = { nav: [{ id: 'denemetakip', label: 'Deneme takibi', icon: 'clock', after: 'denemeler' }, { id: 'guven', label: 'Güven kanıtı', icon: 'star', after: 'asistan' }], routes: { denemetakip: denemeTakip, guven } };
}());
