/* NEBSOFT Ön Muhasebe — İlk kurulum sihirbazı
   1 İşletme bilgileri (e-Fatura için VKN, ilçe, il) · 2 Kasa ve banka hesapları + açılış bakiyeleri · 3 Eski programdan veri
   aktarımı · 4 e-Fatura bağlantısı · 5 Kullanıcılar. İstendiği an yarıda bırakılabilir; Ayarlar'dan tekrar açılır. */
window.MUHKURULUM = (function () {
  'use strict';
  const { esc, $, $$, icon, money, toast, modal, badge } = NS;
  let X; // { db, S, accBalance }
  const STEPS = ['İşletme', 'Hesaplar', 'Veriler', 'e-Fatura', 'Kullanıcılar'];
  function open(app) {
    let step = 0;
    const m = modal({ title: 'Kurulum sihirbazı', size: 'xl', body: '<div id="kw"></div>', actions: [{ label: 'Sonra tamamla' }] });
    const host = m.root.querySelector('#kw');
    const nav = () => `<div class="row wrap mb" style="gap:6px">${STEPS.map((s, i) => `<button class="btn sm ${i === step ? 'primary' : i < step ? '' : 'ghost'}" data-st="${i}">${i < step ? icon('check') : i + 1 + '.'} ${s}</button>`).join('')}</div>`;
    const foot = (last) => `<div class="row between mt"><button class="btn" data-prev ${step ? '' : 'disabled'}>Geri</button><button class="btn primary" data-next>${last ? icon('check') + ' Kurulumu bitir' : 'Kaydet ve devam'}</button></div>`;
    const field = (n, l, v, extra = '') => `<div class="field"><label>${l}</label><input class="input" name="${n}" value="${esc(v || '')}" ${extra}></div>`;
    const draw = () => {
      const s = X.S(); let b = '';
      if (step === 0) b = `<p class="muted mb">Bu bilgiler faturalarınızda ve e-Fatura / e-Arşiv belgelerinizde görünür. e-Fatura için VKN, ilçe ve il zorunludur.</p><div class="form-grid">${field('bizName', 'İşletme unvanı *', s.bizName)}${field('taxNo', 'VKN / TCKN *', s.taxNo, 'inputmode="numeric"')}${field('taxOffice', 'Vergi dairesi', s.taxOffice)}${field('bizPhone', 'Telefon', s.bizPhone)}<div class="field full"><label>Adres (cadde, sokak, no)</label><input class="input" name="bizAddress" value="${esc(s.bizAddress || '')}"></div>${field('bizDistrict', 'İlçe *', s.bizDistrict)}${field('bizCity', 'İl *', s.bizCity)}${field('iban', 'IBAN (faturada görünür)', s.iban)}<div class="field"><label>Mükellef türü</label><select class="input" name="taxpayerType"><option value="kurum" ${s.taxpayerType !== 'gelir' ? 'selected' : ''}>Tüzel kişi — kurumlar vergisi</option><option value="gelir" ${s.taxpayerType === 'gelir' ? 'selected' : ''}>Gerçek kişi — gelir vergisi</option></select></div></div>`;
      else if (step === 1) b = `<p class="muted mb">Kasa ve banka hesaplarınızı, bugünkü bakiyeleriyle girin. Bakiye bilmiyorsanız 0 bırakıp sonra düzeltebilirsiniz.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Hesap adı</th><th>Tür</th><th>IBAN</th><th>Açılış bakiyesi (₺)</th><th></th></tr></thead><tbody>${X.db.all('accounts').map((a) => `<tr><td><input class="input" data-a="${a.id}" data-f="name" value="${esc(a.name)}"></td><td><select class="input" data-a="${a.id}" data-f="type"><option value="kasa" ${a.type === 'kasa' ? 'selected' : ''}>Kasa</option><option value="banka" ${a.type === 'banka' ? 'selected' : ''}>Banka</option><option value="kart" ${a.type === 'kart' ? 'selected' : ''}>Kredi kartı</option></select></td><td><input class="input" data-a="${a.id}" data-f="iban" value="${esc(a.iban || '')}"></td><td><input class="input" type="number" step="0.01" data-a="${a.id}" data-f="opening" value="${a.opening || 0}" style="width:140px"></td><td class="small faint">Güncel: ${money(X.accBalance(a.id))}</td></tr>`).join('')}</tbody></table></div><button class="btn sm mt" data-add>${icon('plus')} Hesap ekle</button>`;
      else if (step === 2) b = `<p class="muted mb">Başka bir programdan geçiyorsanız carilerinizi (açılış bakiyeleriyle) ve stok kartlarınızı Excel veya CSV ile aktarın. Sütun adları otomatik eşleşir, hiçbir şey siz onaylamadan kaydedilmez.</p><div class="grid g2"><div class="card pad"><b>${icon('building')} Cari hesaplar</b><p class="small muted">Ünvan, VKN, adres, ilçe, il, açılış bakiyesi</p><button class="btn primary" data-imp="cari">${icon('upload')} Cari aktar</button> <span class="small faint">${X.db.all('caris').length} cari kayıtlı</span></div><div class="card pad"><b>${icon('box')} Stok ve hizmet kartları</b><p class="small muted">Kod, barkod, ad, birim, fiyatlar, KDV, açılış stoğu</p><button class="btn primary" data-imp="urun">${icon('upload')} Ürün aktar</button> <span class="small faint">${X.db.all('items').length} kart kayıtlı</span></div></div>`;
      else if (step === 3) { const c = NS.integ ? NS.integ.cfg('efatura') : {}; b = `<p class="muted mb">e-Fatura / e-Arşiv için entegratörünüzü bağlayın. Bağlanana kadar kestiğiniz belgeler "TEST — gönderilmedi" olarak kalır, hiçbir yere gönderilmez.</p><div class="card pad">Şu anki durum: ${c.provider && c.provider !== 'sim' ? badge(({ uyumsoft: 'Uyumsoft', parasut: 'Paraşüt', custom: 'Özel API' })[c.provider] || c.provider, 'ok') + (c.test ? ' ' + badge('test ortamı', 'warn') : '') : badge('Bağlı değil (simülasyon)', 'warn')}<p class="small muted mt">Desteklenen entegratörler: Uyumsoft, Paraşüt (resmî dokümanlarıyla doğrulandı). Önce entegratörün test ortamı hesabıyla deneyin.</p><button class="btn primary" data-ef>${icon('zap')} Entegrasyonlar'ı aç</button></div>`; }
      else b = `<p class="muted mb">Çalışanlarınız için kullanıcı ve PIN tanımlayın; her rol yalnızca kendi ekranlarını görür. Ayrılan bir çalışanı "pasif" yaptığınızda açık oturumu anında kapanır.</p><div class="card pad">${X.db.all('users').map((u) => `<div class="row between"><span><b>${esc(u.name)}</b> <span class="small faint">${esc(u.role)}</span></span>${u.active === false ? badge('pasif', '') : badge('aktif', 'ok')}</div>`).join('')}<button class="btn mt" data-us>${icon('users')} Kullanıcıları düzenle (Ayarlar)</button></div><p class="small muted mt">Bitirdiğinizde sihirbaz bir daha kendiliğinden açılmaz; Ayarlar'dan istediğiniz zaman tekrar açabilirsiniz.</p>`;
      host.innerHTML = nav() + b + foot(step === STEPS.length - 1);
    };
    const save = () => {
      if (step === 0) { const v = Object.fromEntries($$('[name]', host).map((x) => [x.name, x.value.trim()])); const t = v.taxNo.replace(/\D/g, ''); if (!v.bizName) return toast('İşletme unvanı gerekli', 'err'), false; if (t && ![10, 11].includes(t.length)) return toast('VKN 10, TCKN 11 haneli olmalı', 'err'), false; v.taxNo = t; X.db.saveSettings(v); X.db.log('Kurulum: işletme bilgileri', v.bizName); }
      if (step === 1) { $$('[data-a]', host).forEach((x) => { const a = X.db.get('accounts', x.dataset.a); if (a) a[x.dataset.f] = x.dataset.f === 'opening' ? Number(x.value) || 0 : x.value.trim(); }); X.db.save(); }
      return true;
    };
    host.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.st !== undefined) { if (save() !== false) { step = Number(t.dataset.st); draw(); } }
      else if (t.hasAttribute('data-prev')) { save(); step = Math.max(0, step - 1); draw(); }
      else if (t.hasAttribute('data-next')) { if (save() === false) return; if (step === STEPS.length - 1) { X.db.saveSettings({ setupDone: new Date().toISOString() }); X.db.log('Kurulum tamamlandı', ''); m.close(); toast('Kurulum tamamlandı', 'ok'); app.refresh(); return; } step++; draw(); }
      else if (t.hasAttribute('data-add')) { save(); X.db.insert('accounts', { name: 'Yeni banka hesabı', type: 'banka', opening: 0, color: '#2563eb' }); draw(); }
      else if (t.dataset.imp) window.MUHAKTAR.open(app, t.dataset.imp);
      else if (t.hasAttribute('data-ef')) { m.close(); app.go('entegrasyonlar'); }
      else if (t.hasAttribute('data-us')) { m.close(); app.go('ayarlar'); }
    });
    draw();
  }
  // İlk açılışta (demo değilse ve kurulum bitmediyse) yöneticiye bir kez önerilir
  function maybe(app) { const s = X.S(); if (s.setupDone || /[?&]demo=1/.test(location.search) || !app.can('admin') || sessionStorage.getItem('nb-kurulum-ertelendi')) return; sessionStorage.setItem('nb-kurulum-ertelendi', '1'); open(app); }
  return { init(ctx) { X = ctx; }, open, maybe };
})();
