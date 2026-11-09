// Trocar de aba deslizando o dedo (v0.40): Semana ⇄ Planos ⇄ Exercícios ⇄ Progresso (o Treinar fica de fora).
// A tela acompanha o dedo; ao soltar, segue com a velocidade do gesto e assenta com mola. Efeitos combinados:
// profundidade (a tela que sai afunda e escurece), borda líquida (a borda da tela que entra curva como uma gota),
// elástico nas pontas e a gota da barra de baixo no mesmo ritmo. (A cascata dos blocos saiu na v0.40.1: incomodava a vista.)
// No Progresso, deslizar para a esquerda continua abrindo as seções (Músculos…), como antes.
(function () {
  'use strict';
  const TABS = ['home', 'plans', 'library', 'progress'];
  const SKIP = '.filters, .ptabs, .seg, input, textarea, select, [data-cal], .photo-grid, .chip-row, .pager, .sortable, [data-cmp], .mb-fit, .range';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let liquidOff = false;
  try { liquidOff = localStorage.getItem('gravity.bordaLiquida') === 'off'; } catch (e) { /* ignora */ }

  let g = null; // gesto em andamento

  function sheetOpen() { const w = document.querySelector('.sheet-wrap'); return w && w.classList.contains('open'); }
  function rootEl() { const R = UI.R; return R.stack.length === 1 ? R.stack[0].el : null; }

  function start(e) {
    if (e.touches.length !== 1 || UI.R.stack.length !== 1 || sheetOpen() || document.getElementById('splash')) return;
    if (e.target.closest(SKIP) || e.target.closest('.nav')) return;
    const t = e.touches[0];
    g = { x0: t.clientX, y0: t.clientY, dx: 0, lock: null, samples: [[performance.now(), t.clientX]], W: innerWidth };
  }
  function move(e) {
    if (!g) return;
    const t = e.touches[0], dx = t.clientX - g.x0, dy = t.clientY - g.y0;
    if (!g.lock) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.3) { g = null; return; } // rolagem para baixo: não é com a gente
      const dir = dx < 0 ? 1 : -1, i = TABS.indexOf(UI.R.tab);
      if (i < 0) { g = null; return; }
      if (UI.R.tab === 'progress' && dir > 0) { g = null; return; } // Progresso → seções (gesto antigo)
      g.lock = true; g.dir = dir; g.from = UI.R.tab; g.to = TABS[i + dir] || null;
      g.out = rootEl(); g.out.classList.add('tab-drag', 'tab-out');
      if (g.to) {
        const def = UI.R.roots[g.to]();
        const el = UI.build(def, 'tab-drag tab-in');
        document.getElementById('app').appendChild(el);
        def.after && def.after(el, false);
        g.def = def; g.inEl = el;
      }
      g.x0 = t.clientX; // começa a contar daqui (sem salto)
    }
    g.dx = t.clientX - g.x0;
    g.samples.push([performance.now(), t.clientX]); if (g.samples.length > 6) g.samples.shift();
    paint(g.dx, 0);
  }
  // Desenha o estado para um deslocamento x (px) do dedo. vel = velocidade (px/ms) para a borda líquida.
  function paint(x, vel) {
    const W = g.W;
    if (!g.to) { // elástico nas pontas
      const r = x / (1 + Math.abs(x) / (W * 0.5)) * 0.45;
      g.out.style.transform = `translate3d(${r}px,0,0)`;
      return;
    }
    const p = Math.max(0, Math.min(1, -x * g.dir / W)); // 0 → 1
    // Profundidade: a que sai anda menos, encolhe e escurece.
    g.out.style.transform = `translate3d(${-g.dir * p * W * 0.28}px,0,0) scale(${1 - 0.06 * p})`;
    g.out.style.opacity = String(1 - 0.45 * p);
    // A que entra acompanha o dedo.
    const off = g.dir * (1 - p) * W;
    g.inEl.style.transform = `translate3d(${off}px,0,0)`;
    // Borda líquida: a borda de entrada fica curva (o meio adianta), mais curva quanto mais rápido.
    if (!liquidOff) {
      const H = g.inEl.offsetHeight || innerHeight;
      const b = Math.min(70, 24 + Math.abs(vel) * 40) * Math.sin(Math.PI * Math.min(1, p * 1.15)) * (p < 1 ? 1 : 0);
      if (b > 0.5) {
        const path = g.dir > 0
          ? `M${b} 0 Q${-b * 0.9} ${H / 2} ${b} ${H} L${W + 2} ${H} L${W + 2} 0 Z`
          : `M${W - b} 0 Q${W + b * 0.9} ${H / 2} ${W - b} ${H} L-2 ${H} L-2 0 Z`;
        g.inEl.style.clipPath = `path('${path}')`;
      } else g.inEl.style.clipPath = '';
    }
    if (window.NavFx) NavFx.drag(g.from, g.to, p);
  }
  function end() {
    if (!g) return;
    if (!g.lock) { g = null; return; }
    const s = g.samples, a = s[0], b = s[s.length - 1];
    const vel = (b[1] - a[1]) / Math.max(16, b[0] - a[0]); // px/ms
    const W = g.W, cur = g;
    g = null;
    let target = 0; // deslocamento final
    if (cur.to) {
      const fast = Math.abs(vel) > 0.45 && Math.sign(vel) === -cur.dir;
      if (fast || Math.abs(cur.dx) > W * 0.33) target = -cur.dir * W;
    }
    spring(cur, cur.dx, target, vel, () => finish(cur, target !== 0));
  }
  // Mola (rAF): leva o deslocamento x até o alvo com a velocidade inicial do gesto e um leve balanço.
  function spring(cur, x, target, v, done) {
    let last = performance.now(); const k = 0.00028, c = 0.026; // rigidez e amortecimento (por ms)
    let frames = 0, slow = 0;
    const step = (now) => {
      let dt = Math.min(32, now - last); last = now; frames++; if (dt > 24) slow++;
      for (let i = 0; i < 2; i++) { const h = dt / 2; const a = -k * (x - target) - c * v; v += a * h; x += v * h; }
      g = cur; paint(x, v); g = null;
      if (Math.abs(x - target) < 0.6 && Math.abs(v) < 0.02) {
        if (frames > 10 && slow / frames > 0.4 && !liquidOff) { liquidOff = true; try { localStorage.setItem('gravity.bordaLiquida', 'off'); } catch (e) { /* ignora */ } }
        g = cur; paint(target, 0); g = null; done(); return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function finish(cur, commit) {
    const clean = (el) => { if (!el) return; el.classList.remove('tab-drag', 'tab-in', 'tab-out'); el.style.transform = ''; el.style.opacity = ''; el.style.clipPath = ''; };
    if (commit) {
      const old = UI.R.stack[0];
      old.leave && old.leave(); old.el.remove();
      UI.R.tab = cur.to; UI.R.stack = [cur.def];
      clean(cur.inEl);
      if (window.NavFx) NavFx.settle(cur.to);
      UI.setNav();
      if (window.TipsFx) TipsFx.markUsed('swipe');
      UI.Native && UI.Native.vibrate && UI.Native.vibrate(8);
    } else {
      if (cur.inEl) { cur.def.leave && cur.def.leave(); cur.inEl.remove(); }
      clean(cur.out);
      if (window.NavFx) NavFx.settle(cur.from);
      UI.setNav();
    }
  }
  function init() {
    const app = document.getElementById('app'); if (!app || reduce()) return;
    app.addEventListener('touchstart', start, { passive: true });
    app.addEventListener('touchmove', move, { passive: true }); // a rolagem lateral do navegador já fica desligada no CSS (touch-action)
    app.addEventListener('touchend', end, { passive: true });
    app.addEventListener('touchcancel', end, { passive: true });
  }
  window.TabSwipe = { init, TABS };
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
