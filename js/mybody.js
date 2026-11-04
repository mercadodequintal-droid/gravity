// Mapa muscular com a foto da própria pessoa (v0.28): no lugar do boneco, a foto de frente e de costas,
// com os músculos pintados por cima. Tudo fica no celular, sem internet. A pessoa encaixa a foto no
// desenho uma vez (arrastar, pinça ou controle de tamanho) e pode voltar ao boneco quando quiser.
(function () {
  'use strict';
  const KEY = 'gravity.meucorpo';
  // Metade de cada vista no desenho (coordenadas da imagem do boneco, 1536 × 1024).
  const VIEWS = { front: { nome: 'Frente', x0: 120, x1: 764 }, back: { nome: 'Costas', x0: 764, x1: 1410 } };
  let cache = null;
  function data() {
    if (!cache) { try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cache = {}; } }
    return cache;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cache || {})); return true; } catch (e) { return false; } }
  const has = () => !!(data().front || data().back);
  const active = () => Store.state.settings.bodyView === 'foto' && has();
  function setView(v) { Store.state.settings.bodyView = v === 'foto' ? 'foto' : 'boneco'; Store.save(); }
  const cx = (view) => { const b = AnatomyReal.BODIES[AnatomyReal.gender()]; return b.views[view === 'front' ? 0 : 1].cx; };

  // Encaixe inicial: a altura da pessoa na foto ≈ altura do boneco (do topo da cabeça aos pés, ~y 95 a 985).
  function place(view, w, h) {
    const s = 960 / h;
    return { x: cx(view) - (w * s) / 2, y: 50, s, w, h };
  }
  function setPhoto(view, src, done) {
    const img = new Image();
    img.onload = () => {
      data()[view] = Object.assign({ src }, place(view, img.width, img.height));
      if (!save()) { delete data()[view]; UI.toast('Sem espaço para guardar a foto'); return; }
      done && done();
    };
    img.src = src;
  }
  function remove(view) { delete data()[view]; save(); if (!has()) setView('boneco'); }

  // Fundo do mapa: a foto de cada vista recortada na sua metade; sem foto naquela vista, fica o boneco.
  // ghost = boneco transparente por cima (só na tela de encaixe).
  // uid: cada desenho precisa de ids próprios; com ids repetidos o navegador usa o recorte de outra tela
  // (escondida) e a foto some.
  function bg(img, ghost, uid) {
    const d = data(), out = [];
    Object.keys(VIEWS).forEach((k) => {
      const v = VIEWS[k], p = d[k], cid = 'mbc-' + (uid || 'x') + '-' + k;
      out.push(`<clipPath id="${cid}"><rect x="${v.x0}" y="0" width="${v.x1 - v.x0}" height="1024"/></clipPath>`);
      out.push(`<rect x="${v.x0}" y="0" width="${v.x1 - v.x0}" height="1024" fill="#0b0b0b"/>`);
      if (p) out.push(`<g clip-path="url(#${cid})"><image href="${p.src}" x="${p.x}" y="${p.y}" width="${p.w * p.s}" height="${p.h * p.s}" preserveAspectRatio="none"/></g>`);
      else out.push(`<g clip-path="url(#${cid})"><image href="${img}" x="0" y="0" width="1536" height="1024" preserveAspectRatio="none"/></g>`);
      if (ghost && p) out.push(`<g clip-path="url(#${cid})" opacity="0.38"><image href="${img}" x="0" y="0" width="1536" height="1024" preserveAspectRatio="none"/></g>`);
    });
    return out.join('');
  }

  function pick(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => shrink(r.result, 1100, cb); r.readAsDataURL(f); inp.remove(); };
    document.body.appendChild(inp); inp.click();
  }
  function shrink(src, max, cb) {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => UI.toast('Imagem inválida');
    img.src = src;
  }

  // ---------- telas ----------
  const TIPS = 'Corpo inteiro, de pé, braços um pouco afastados do corpo, roupa justa (ou sem camisa) e fundo liso. A foto fica só no seu celular.';
  // Folha de entrada: escolher as fotos de frente e de costas.
  function setup(done) {
    const prog = Store.photos();
    const row = (k) => {
      const p = data()[k], v = VIEWS[k];
      const fromProg = prog.filter((f) => (k === 'front' ? /frente/i : /costas/i).test(f.pose || ''));
      return `<div class="mb-row"><div class="mb-thumb">${p ? `<img src="${p.src}" alt="">` : UI.icon('camera')}</div><div class="grow"><b>${v.nome}</b><small>${p ? 'Foto escolhida' : 'Sem foto (usa o boneco)'}</small>
        <div class="btn-row" style="margin-top:8px"><button class="btn ghost sm" data-a="pick" data-v="${k}">${UI.icon('camera', 'sm')}${p ? 'Trocar' : 'Escolher'}</button>${fromProg.length ? `<button class="btn ghost sm" data-a="prog" data-v="${k}">Do Progresso</button>` : ''}${p ? `<button class="btn ghost sm" data-a="fit" data-v="${k}">Ajustar</button>` : ''}</div></div></div>`;
    };
    UI.sheet({
      render: () => `<h3>Mapa com a sua foto</h3><div class="desc">${TIPS}</div>${row('front')}${row('back')}
        <div class="btn-row" style="margin-top:16px">${has() ? '<button class="btn ghost" data-a="del">Voltar ao boneco</button>' : '<button class="btn ghost" data-a="no">Cancelar</button>'}<button class="btn lime" data-a="ok" ${has() ? '' : 'disabled'}>Usar minha foto</button></div>`,
      actions: {
        no: UI.closeSheet,
        pick: (ds) => pick((src) => setPhoto(ds.v, src, () => { UI.closeSheet(); setTimeout(() => UI.push(Fit(ds.v, done)), 300); })),
        prog: (ds) => {
          const list = prog.filter((f) => (ds.v === 'front' ? /frente/i : /costas/i).test(f.pose || '')).slice().reverse();
          setPhoto(ds.v, list[0].data, () => { UI.closeSheet(); setTimeout(() => UI.push(Fit(ds.v, done)), 300); });
        },
        fit: (ds) => { UI.closeSheet(); setTimeout(() => UI.push(Fit(ds.v, done)), 300); },
        del: () => { setView('boneco'); UI.closeSheet(); done && done(); },
        ok: () => { setView('foto'); UI.closeSheet(); done && done(); },
      },
    });
  }

  // Tela de encaixe: o boneco aparece transparente por cima; arraste a foto, use a pinça ou o controle
  // de tamanho até o corpo coincidir com o desenho.
  function Fit(view, done) {
    const v = VIEWS[view];
    const p = () => data()[view];
    let svgEl = null;
    const paint = () => {
      const q = p(); if (!svgEl || !q) return;
      const im = svgEl.querySelector('[data-photo]');
      im.setAttribute('x', q.x); im.setAttribute('y', q.y); im.setAttribute('width', q.w * q.s); im.setAttribute('height', q.h * q.s);
      const r = svgEl.closest('.screen').querySelector('[data-size]'); if (r) r.value = Math.round(q.s * 1000);
    };
    const zoom = (f, ax, ay) => { const q = p(); const ns = Math.max(0.05, Math.min(20, q.s * f)); const k = ns / q.s; q.x = ax - (ax - q.x) * k; q.y = ay - (ay - q.y) * k; q.s = ns; paint(); };
    return {
      hideNav: true,
      render() {
        const q = p(), b = AnatomyReal.BODIES[AnatomyReal.gender()];
        const outline = AnatomyReal.paths().map((x) => `<path d="${x.d}" fill="none" stroke="var(--gold-2)" stroke-width="2.2" opacity=".7"/>`).join('');
        return `<div class="topbar"><button class="icon-btn" data-a="back">${UI.icon('back')}</button><h1>Ajustar · ${v.nome}</h1></div><div class="content">
          <div class="small muted" style="margin:0 2px 10px">Arraste a foto e use dois dedos (ou o controle abaixo) até o seu corpo ficar em cima do desenho. Ombros, cintura e joelhos são as melhores referências.</div>
          <div class="card mb-fit"><svg viewBox="${v.x0} 0 ${v.x1 - v.x0} 1010" data-fit>
            <rect x="${v.x0}" y="0" width="${v.x1 - v.x0}" height="1024" fill="#0b0b0b"/>
            <image data-photo href="${q.src}" x="${q.x}" y="${q.y}" width="${q.w * q.s}" height="${q.h * q.s}" preserveAspectRatio="none"/>
            <image href="${b.img}" x="0" y="0" width="1536" height="1024" preserveAspectRatio="none" opacity="0.35" style="pointer-events:none"/>
            <g style="pointer-events:none">${outline}</g></svg></div>
          <div class="field"><label>Tamanho</label><input type="range" class="range" min="50" max="4000" step="1" value="${Math.round(q.s * 1000)}" data-in="size" data-size></div>
          <div class="btn-row"><button class="btn ghost sm" data-a="z" data-f="0.97">${UI.icon('minus', 'sm')}Menor</button><button class="btn ghost sm" data-a="z" data-f="1.03">${UI.icon('plus', 'sm')}Maior</button><button class="btn ghost sm" data-a="reset">Recomeçar</button></div>
          <button class="btn lime block" style="margin-top:16px" data-a="ok">Pronto</button></div>`;
      },
      after(el) {
        svgEl = el.querySelector('[data-fit]');
        const pts = new Map();
        let last = null;
        const toSvg = (e) => { const r = svgEl.getBoundingClientRect(); const k = (v.x1 - v.x0) / r.width; return [v.x0 + (e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
        svgEl.addEventListener('pointerdown', (e) => { svgEl.setPointerCapture(e.pointerId); pts.set(e.pointerId, toSvg(e)); last = null; });
        svgEl.addEventListener('pointermove', (e) => {
          if (!pts.has(e.pointerId)) return;
          const prev = pts.get(e.pointerId), cur = toSvg(e); pts.set(e.pointerId, cur);
          const q = p();
          if (pts.size === 1) { q.x += cur[0] - prev[0]; q.y += cur[1] - prev[1]; paint(); return; }
          const [a, b2] = [...pts.values()], dist = Math.hypot(a[0] - b2[0], a[1] - b2[1]);
          if (last) zoom(dist / last, (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2);
          last = dist;
        });
        const up = (e) => { pts.delete(e.pointerId); last = null; save(); };
        svgEl.addEventListener('pointerup', up); svgEl.addEventListener('pointercancel', up);
      },
      actions: {
        back: () => { save(); UI.pop(); },
        size: (ds, el) => { const q = p(); zoom(Number(el.value) / 1000 / q.s, cx(view), 500); save(); },
        z: (ds) => { zoom(Number(ds.f), cx(view), 500); save(); },
        reset: () => { const q = p(); Object.assign(q, place(view, q.w, q.h)); paint(); save(); },
        ok: () => { save(); setView('foto'); UI.pop(); UI.toast('Mapa com a sua foto ativado'); done && done(); },
      },
    };
  }

  window.MyBody = { has, active, setView, bg, setup, Fit, data, remove, VIEWS };
})();
