// Foto de perfil: aparece no círculo da tela inicial (no lugar do logo) e na imagem de compartilhar.
// Fica em settings.photo (JPEG 256×256, ~15 KB) e por isso entra no backup.
(function () {
  'use strict';
  const { icon, toast, sheet, closeSheet } = UI;
  const A = window.Android;
  const OUT = 256, VIEW = 240;

  const photo = () => Store.state.settings.photo || '';

  // Conteúdo do círculo: a foto, ou o emblema do Gravity.
  function avatarHTML(size) {
    const p = photo();
    return p ? `<img class="avatar-img" src="${p}" alt="">` : Screens.emblem(size || 30);
  }

  function pickGallery(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); };
    document.body.appendChild(inp); inp.click();
  }
  function takePhoto(cb) {
    if (!A || !A.takePhoto) { pickGallery(cb); return; }
    window.onNativePhoto = (data) => { window.onNativePhoto = null; if (data) cb(data); };
    try { A.takePhoto(); } catch (e) { pickGallery(cb); }
  }

  // Menu ao tocar no círculo.
  function sheetMenu(done) {
    const has = !!photo();
    sheet({
      render: () => `<h3>Foto do perfil</h3><div class="desc">Aparece no círculo da tela inicial e na imagem de compartilhar treino.</div>
        <div class="list">
          <button class="menu-item" data-a="cam"><span class="ic">${icon('camera', 'sm')}</span><span class="grow">Tirar foto</span></button>
          <button class="menu-item" data-a="gal"><span class="ic">${icon('upload', 'sm')}</span><span class="grow">Escolher da galeria</span></button>
          ${has ? `<button class="menu-item" data-a="logo"><span class="ic">${icon('x', 'sm')}</span><span class="grow">Voltar ao logo do Gravity</span></button>` : ''}
        </div>`,
      actions: {
        cam: () => { closeSheet(); takePhoto((d) => crop(d, done)); },
        gal: () => { closeSheet(); pickGallery((d) => crop(d, done)); },
        logo: () => { Store.state.settings.photo = ''; Store.save(); closeSheet(); toast('Logo do Gravity de volta'); done && done(); },
      },
    });
  }

  // Ajuste do enquadramento: arrastar e zoom dentro do círculo.
  function crop(dataURL, done) {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height, s0 = VIEW / Math.min(w, h);
      let z = 1, ox = (VIEW - w * s0) / 2, oy = (VIEW - h * s0) / 2;
      const S = () => s0 * z;
      const clamp = () => { ox = Math.min(0, Math.max(VIEW - w * S(), ox)); oy = Math.min(0, Math.max(VIEW - h * S(), oy)); };
      let el = null;
      const paint = () => { if (el) el.style.transform = `translate(${ox}px, ${oy}px) scale(${S()})`; };
      sheet({
        render: () => `<h3 style="text-align:center">Ajuste a foto</h3><div class="desc" style="text-align:center">Arraste para posicionar e use o controle para aproximar.</div>
          <div class="crop-view" style="width:${VIEW}px;height:${VIEW}px"><img src="${dataURL}" alt="" draggable="false"></div>
          <div class="crop-zoom">${icon('minus', 'sm')}<input type="range" min="1" max="3" step="0.01" value="1" data-in="zoom">${icon('plus', 'sm')}</div>
          <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
        after: (root) => {
          const view = root.querySelector('.crop-view');
          el = view.querySelector('img');
          el.style.transformOrigin = '0 0'; el.style.width = w + 'px'; el.style.height = h + 'px';
          paint();
          let drag = null;
          view.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ox, oy }; view.setPointerCapture(e.pointerId); });
          view.addEventListener('pointermove', (e) => { if (!drag) return; ox = drag.ox + e.clientX - drag.x; oy = drag.oy + e.clientY - drag.y; clamp(); paint(); });
          const end = () => { drag = null; };
          view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
        },
        actions: {
          zoom: (ds, input) => {
            // Mantém o centro do círculo parado ao aproximar.
            const cx = (VIEW / 2 - ox) / S(), cy = (VIEW / 2 - oy) / S();
            z = Number(input.value); ox = VIEW / 2 - cx * S(); oy = VIEW / 2 - cy * S(); clamp(); paint();
          },
          no: closeSheet,
          ok: () => {
            const c = document.createElement('canvas'); c.width = c.height = OUT;
            const r = OUT / VIEW, g = c.getContext('2d');
            g.fillStyle = '#08080a'; g.fillRect(0, 0, OUT, OUT);
            g.drawImage(img, ox * r, oy * r, w * S() * r, h * S() * r);
            Store.state.settings.photo = c.toDataURL('image/jpeg', 0.82);
            Store.save(); closeSheet(); toast('Foto salva'); done && done();
          },
        },
      });
    };
    img.onerror = () => toast('Não foi possível abrir a imagem');
    img.src = dataURL;
  }

  window.Profile = { photo, avatarHTML, sheet: sheetMenu };
})();
