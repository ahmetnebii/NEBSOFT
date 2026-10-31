/* NEBSOFT — borç tahsilatı istemcisi: portaldan kartla ödeme, ödeme bağlantısı ve paneldeki online ödeme listesi. Kural ve tutar sunucudadır (server/cloud/tahsilat-odeme.js) */
(function () {
  const { esc, $, $$, icon, money, toast, badge } = NS;
  const MESAJ = {
    odendi: ['Ödemeniz alındı', 'ok', 'Teşekkürler, ödediğiniz borç kapandı.'],
    test: ['TEST ödemesi tamamlandı', 'warn', 'Karttan para çekilmedi, borcunuz kapanmadı. İşletme test modunda.'],
    inceleme: ['Ödemeniz inceleniyor', 'warn', 'Sonuç birkaç dakika içinde bu sayfada görünür. Yeniden ödeme yapmayın.'],
    bekliyor: ['Ödeme sonucu henüz gelmedi', 'warn', 'Biraz sonra bu sayfayı yenileyin. Kartınızdan çekim yapıldıysa yeniden ödeme yapmayın.'],
    kontrol: ['Ödemeniz kontrol ediliyor', 'warn', 'İşletme bu ödemeyi elle kontrol edecek. Yeniden ödeme yapmayın.'],
    basarisiz: ['Ödeme tamamlanamadı', 'err', 'Yeniden deneyebilirsiniz.'],
    vazgecildi: ['Ödeme tamamlanmadı', 'err', 'Yeniden deneyebilirsiniz.'],
    suresi: ['Ödeme süresi doldu', 'err', 'Yeniden deneyebilirsiniz.'],
    iade: ['Bu ödeme iade edildi', 'warn', ''],
  };
  const KISA = { odendi: ['Alındı', 'ok'], test: ['TEST', 'warn'], inceleme: ['İnceleniyor', 'warn'], bekliyor: ['Bekliyor', ''], kontrol: ['Kontrol edilmeli', 'err'], basarisiz: ['Başarısız', 'err'], iade: ['İade edildi', 'info'] };

  // Sağlayıcı sayfasına geçiş. PayTR çerçevede açılır, diğerleri yönlendirir
  function git(r) {
    if (r.iframe) return NS.modal({ title: 'Güvenli ödeme', size: 'wide', body: `<iframe src="${esc(r.iframe)}" title="Güvenli ödeme" style="width:100%;height:70vh;border:0"></iframe>`, actions: [{ label: 'Kapat' }] });
    location.href = r.url;
  }
  // Ödeme penceresi. Seçilebilir kalemleri sunucu verir; site tazminatı yalnız borçların tamamında eklenir
  function ode(db, { baslik, yenile, yedek, token } = {}) {
    const g = (a) => db.pubCall(a, { ...(token ? { token } : {}), ...(yenile ? { yenile } : {}) }); const r = g('tahsilat/borc');
    if (!r || r.status !== 200 || !r.ok) { toast((r && r.error) || 'Borç bilgisi alınamadı', 'err'); return null; }
    if (!r.kart) { if (yedek) return yedek(); toast('Kartla ödeme şu anda kapalı', 'err'); return null; }
    if (!r.kalemler.length) { toast('Ödenecek borcunuz yok'); return null; }
    const toplam = (b) => { const L = $$('[data-k]:checked', b).map((x) => r.kalemler.find((y) => y.k === x.dataset.k)); const hepsi = L.length === r.kalemler.length; return { L, tutar: L.reduce((n, x) => n + x.tutar, 0) + (hepsi && r.ek ? r.ek.tutar : 0), hepsi }; };
    const m = NS.modal({ title: baslik || 'Kartla ödeme', body: `${r.kart.test ? `<div class="card pad small mb" style="border-left:3px solid var(--warn)"><b>TEST modu.</b> Karttan para çekilmez, borcunuz kapanmaz.</div>` : ''}
      <div class="mb">${r.kalemler.map((x) => `<label class="row between" style="padding:9px 0;gap:10px;cursor:pointer;border-bottom:1px solid var(--border)"><span class="row nw" style="gap:9px"><input type="checkbox" data-k="${esc(x.k)}" ${x.sec || r.kalemler.length === 1 ? 'checked' : ''} ${yenile ? 'disabled' : ''}><span>${esc(x.ad)}${x.vade ? `<span class="small muted" style="display:block">${/^\d{4}-\d{2}-\d{2}$/.test(x.vade) ? NS.date(x.vade) : esc(x.vade)}</span>` : ''}</span></span><b>${money(x.tutar)}</b></label>`).join('')}
      ${r.ek ? `<div class="row between small" style="padding:9px 0"><span>${esc(r.ek.ad)}<span class="muted" style="display:block">Borçların tamamı seçilirse alınır</span></span><b id="tzm">${money(r.ek.tutar)}</b></div>` : ''}</div>
      <div class="row between mb"><b>Ödenecek</b><b id="top" style="font-size:22px"></b></div>
      <div class="form-grid">${r.kisi.epostaVar ? '' : '<div class="field full"><label for="ceposta">E-posta (makbuz için)</label><input class="input" id="ceposta" type="email" autocomplete="email"></div>'}${r.kisi.telVar ? '' : '<div class="field full"><label for="ctel">Cep telefonu</label><input class="input" id="ctel" inputmode="tel" autocomplete="tel"></div>'}${r.kart.tc ? '<div class="field full"><label for="ctc">T.C. kimlik no</label><input class="input mono" id="ctc" inputmode="numeric" maxlength="11" autocomplete="off"><span class="small faint">Ödeme kuruluşu ister, burada saklanmaz.</span></div>' : ''}</div>
      <p class="small faint mt">${icon('lock')} Kart bilgisi ${esc(r.kart.ad)} güvenli sayfasına girilir, bize gelmez.</p>`,
    actions: [{ label: 'Vazgeç' }, { label: 'Ödemeye geç', cls: 'primary', icon: 'lock', onClick: (close, b) => {
      const { L } = toplam(b); if (!L.length) return toast('En az bir kalem seçin', 'err');
      const s = db.pubCall('tahsilat/baslat', { ...(token ? { token } : {}), ...(yenile ? { yenile } : { kalemler: L.map((x) => x.k) }), email: ($('#ceposta', b) || {}).value || '', telefon: ($('#ctel', b) || {}).value || '', tc: ($('#ctc', b) || {}).value || '' });
      if (!s || s.status !== 200 || !s.ok) return toast((s && s.error) || 'Ödeme başlatılamadı', 'err'); close(); git(s);
    } }] });
    const yaz = () => { const b = m.root; const t = toplam(b); $('#top', b).textContent = money(t.tutar); const z = $('#tzm', b); if (z) z.style.opacity = t.hepsi ? 1 : 0.4; };
    const K = $$('[data-k]', m.root); if (!K.some((x) => x.checked)) K[0].checked = true; // vadesi gelen yoksa en yakın taksit
    K.forEach((x) => { x.onchange = yaz; }); yaz(); return m;
  }
  // Sağlayıcıdan dönüş: sayfa ?odeme=<kimlik> ile açılır. PayTR çerçevesi içindeysek önce çerçeveden çıkılır
  function donus(db, bitti) {
    const u = new URL(location.href); const id = u.searchParams.get('odeme'); if (!id || !NS.pub) return false;
    if (window.top !== window.self) { window.top.location.href = location.href; return true; }
    u.searchParams.delete('odeme'); history.replaceState(null, '', u.pathname + u.search + u.hash);
    const r = db.pubCall('tahsilat/sonuc', { id }); if (!r || r.status !== 200 || !r.ok) { toast((r && r.error) || 'Ödeme sonucu alınamadı', 'err'); return true; }
    const [t, , a] = MESAJ[r.durum] || MESAJ.bekliyor; db.load(); if (bitti) bitti();
    NS.modal({ title: t, body: `<div class="center">${r.tutar ? `<div style="font-size:28px;font-weight:800;margin:12px 0 4px">${money(r.tutar)}</div>` : ''}${r.ref ? `<div class="small muted mono">${esc(r.ref)}</div>` : ''}<p class="muted">${esc(a)}</p></div>`, actions: [{ label: 'Tamam', cls: 'primary' }] }); return true;
  }

  // Panel
  async function api(m, u, b) { try { const r = await fetch(u, { method: m, headers: { 'x-ns-csrf': '1', ...(b ? { 'Content-Type': 'application/json' } : {}) }, ...(b ? { body: JSON.stringify(b) } : {}) }); const j = await r.json().catch(() => ({})); return r.ok && j.ok ? j : { hata: j.error || 'İşlem yapılamadı' }; } catch (e) { return { hata: 'Sunucuya ulaşılamadı' }; } }
  async function liste(app) {
    const j = await api('GET', `/api/tahsilat/${app}/liste`); if (j.hata) return toast(j.hata, 'err');
    const m = NS.modal({ title: 'Online ödemeler', size: 'wide', body: `<div id="ol">${NS.table({ rows: j.liste, empty: 'Henüz online ödeme yok', emptyIcon: 'wallet', columns: [{ label: 'Tarih', render: (r) => NS.dt(r.at) }, { label: 'Kim', render: (r) => `<b>${esc(r.ad || '-')}</b><div class="small faint">${esc(r.etiket || '')}</div>${r.neden ? `<div class="small" style="color:var(--err)">${esc(r.neden)}</div>` : ''}` }, { label: 'Sağlayıcı', render: (r) => esc(r.saglayici) }, { label: 'Tutar', cls: 'right', render: (r) => `<b>${money(r.tutar)}</b>` }, { label: 'Durum', render: (r) => badge(...(KISA[r.durum] || [r.durum, ''])) }], actions: [{ label: 'İade et', act: 'iade', show: (r) => r.iade }] })}</div><p class="small muted mt">TEST ödemeleri borcu kapatmaz. İade tam tutar yapılır ve borç yeniden açılır; kısmi iade ödeme kuruluşunun panelinden yapılır.</p>`, actions: [{ label: 'Kapat' }] });
    NS.on(m.root, 'click', '[data-act=iade]', async (e, b) => {
      const r = j.liste.find((x) => x.id === b.dataset.id); if (!r || !(await NS.confirm(`${money(r.tutar)} karta iade edilsin mi? Borç yeniden açılır.`, { ok: 'İade et' }))) return;
      const s = await api('POST', `/api/tahsilat/${app}/${r.id}/iade`, {}); if (s.hata) return toast(s.hata, 'err');
      toast(`${money(s.tutar)} karta iade edildi`, 'ok'); m.close(); location.reload();
    });
  }
  // Bağlantı oluşturulur, gönderimi işletme yapar: program kendiliğinden ileti atmaz
  async function baglanti(app, kayit, { ad, tel } = {}) {
    const j = await api('POST', `/api/tahsilat/${app}/baglanti`, { kayit }); if (j.hata) return toast(j.hata, 'err');
    const n = String(tel || '').replace(/\D/g, '').replace(/^0/, ''); const metin = `Merhaba ${ad || ''}, kalan ödemenizi kartla yapmak için: ${j.url}`;
    const m = NS.modal({ title: 'Ödeme bağlantısı', body: `${j.test ? '<div class="card pad small mb" style="border-left:3px solid var(--warn)"><b>TEST modu.</b> Bu bağlantıyla para çekilmez, borç kapanmaz.</div>' : ''}<div class="field"><label for="obg">Bağlantı</label><input class="input mono" id="obg" readonly value="${esc(j.url)}"></div><p class="small muted mt">7 gün geçerlidir. Yalnız bu kaydın taksitlerini açar, tutarı program hesaplar.</p>`, actions: [{ label: 'Kapat' }, { label: 'Kopyala', icon: 'copy', onClick: () => { const x = $('#obg', m.root); x.select(); (navigator.clipboard ? navigator.clipboard.writeText(j.url) : Promise.reject()).then(() => toast('Kopyalandı', 'ok')).catch(() => toast('Bağlantıyı seçip kopyalayın')); } }, ...(n.length === 10 ? [{ label: 'WhatsApp ile aç', cls: 'primary', icon: 'message', onClick: () => window.open(`https://wa.me/90${n}?text=${encodeURIComponent(metin)}`, '_blank', 'noopener') }] : [])] });
  }
  const dugme = (app) => (NS.cloud && !NS.pub ? `<button class="btn" data-tahsilat-liste="${esc(app)}">${icon('wallet')} Online ödemeler</button>` : '');
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-tahsilat-liste]'); if (b) liste(b.dataset.tahsilatListe); });
  NS.tahsilat = { ode, donus, liste, baglanti, dugme };
})();
