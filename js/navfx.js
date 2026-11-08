// Barra de baixo "líquida" (v0.38): o item escolhido sobe numa bolinha e a borda da barra forma uma onda
// embaixo dele. Ao trocar de aba, a bolinha afunda, a onda escorre pela barra até o novo item e a bolinha sobe.
// O desenho da barra é um SVG atrás dos botões; o botão Treinar (centro) não muda.
(function () {
  'use strict';
  const UP = 26; // espaço acima da barra para a onda
  let nav = null, svg = null, rect = null, blob = null, cur = null, raf = 0, last = null;

  // Barra = retângulo arredondado + uma "gota" (elipse) da mesma cor, fundidas pelo filtro "goo" (desfoca e
  // recorta o contorno): a junção fica sempre arredondada, inclusive nos cantos e durante o movimento.
  function size() { const r = nav.getBoundingClientRect(); return [r.width, r.height]; }
  function centerOf(tab) {
    const b = nav.querySelector(`button[data-tab="${tab}"]`); if (!b) return null;
    const n = nav.getBoundingClientRect(), r = b.getBoundingClientRect();
    return r.left - n.left + r.width / 2;
  }
  // x = centro da gota; k = 0 parada (gota alta e redonda) … 1 no meio do caminho (baixa e esticada).
  function draw(x, k) {
    const [W, H] = size(); if (!W) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H + UP}`); svg.style.height = (H + UP) + 'px';
    rect.setAttribute('width', W); rect.setAttribute('height', H); rect.setAttribute('y', UP);
    const f = svg.querySelector('filter'); f.setAttribute('width', W + 40); f.setAttribute('height', H + UP + 40);
    if (x == null) { blob.setAttribute('rx', 0); blob.setAttribute('ry', 0); return; }
    blob.setAttribute('cx', x); blob.setAttribute('cy', UP + 6 + 10 * k);
    blob.setAttribute('rx', 30 + 16 * k); blob.setAttribute('ry', 28 - 8 * k);
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function set(tab, animate) {
    if (!nav) init();
    const x1 = centerOf(tab);
    cancelAnimationFrame(raf);
    if (x1 == null) { cur = null; draw(null, 0); return; }
    const x0 = cur;
    cur = x1;
    if (!animate || x0 == null || Math.abs(x1 - x0) < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(x1, 0); return; }
    // A bolinha afunda (CSS) e a onda escorre: mais baixa e mais larga no meio do caminho, sobe de novo ao chegar.
    nav.classList.add('nav-moving');
    const t0 = performance.now(), D = 640;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / D), e = ease(t);
      const mid = Math.sin(Math.PI * t);
      draw(x0 + (x1 - x0) * e, mid);
      if (t < 1) raf = requestAnimationFrame(step);
      else { draw(x1, 0); nav.classList.remove('nav-moving'); }
    };
    raf = requestAnimationFrame(step);
  }
  function init() {
    nav = document.querySelector('.nav'); if (!nav || nav.querySelector('.nav-liquid')) return;
    nav.classList.add('liquid');
    nav.insertAdjacentHTML('afterbegin', `<svg class="nav-liquid" preserveAspectRatio="none" aria-hidden="true">
      <defs><filter id="navGoo" filterUnits="userSpaceOnUse" x="-20" y="-20" width="500" height="200" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7"/><feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"/></filter></defs>
      <g filter="url(#navGoo)"><rect x="0" rx="24" ry="24"/><ellipse rx="0" ry="0"/></g></svg>`);
    svg = nav.querySelector('.nav-liquid'); rect = svg.querySelector('rect'); blob = svg.querySelector('ellipse');
    addEventListener('resize', () => { if (last) { cur = null; set(last, false); } });
  }
  // Chamado pelo UI a cada troca de aba.
  function update(tab) { const anim = last != null && last !== tab; last = tab; set(tab, anim); }

  window.NavFx = { update, init };
})();
