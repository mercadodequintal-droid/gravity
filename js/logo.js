// Logo do Gravity (2026-10): bateria creme com barras roxas e uma órbita com planeta.
// Medido do arquivo original (1254 × 1254 px) e redesenhado em vetor. A órbita passa por trás
// da bateria em cima e pela frente embaixo.
(function () {
  'use strict';
  const CREAM = '#fcf6e8', PURPLE = '#9640fc';
  const VB = '100 255 1060 670';
  const FRAME = 'M236.5 555 L330 457.5 H888 L936.5 506 V773 L888 821 H617 L568 773.5 H325 L236.5 690 Z';
  const TERM = 'M973 539 H1013 L1054 580 V708 L1013 749 H973 Z';
  const BARS = ['M650 712 L713 669 V785 H650 Z', 'M739 652 L800 611 V785 H739 Z', 'M824 597 L886 555 V785 H824 Z'];
  // Órbita: elipse com centro (627.3, 603.8), raios 546.1 × 210.8, girada −26,06°.
  const ORBIT = { cx: 627.3, cy: 603.8, rx: 546.1, ry: 210.8, rot: -26.06 };
  // Trecho da frente (de 64,8° a 223,6° no parâmetro da elipse).
  const FRONT = 'M920 673 A546.1 210.8 -26.06 0 1 208.2 646.9';
  const PLANET = { cx: 1050, cy: 318.5, r: 50 };

  // A parte da órbita que passa atrás da bateria (e em volta do planeta) é recortada por uma máscara,
  // então o logo funciona sobre qualquer fundo.
  let seq = 0;
  function svg(opts) {
    const o = Object.assign({ cls: '', style: '' }, opts || {});
    const e = ORBIT, id = 'gvm' + (++seq) + Math.random().toString(36).slice(2, 6);
    return `<svg class="gv-logo ${o.cls}" viewBox="${VB}" style="${o.style}" aria-label="Gravity">
      <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="150" width="1254" height="900">
        <rect x="0" y="150" width="1254" height="900" fill="#fff"/>
        <path d="${FRAME}" fill="#000" stroke="#000" stroke-width="51" stroke-linejoin="miter"/>
        <path d="${TERM}" fill="#000" stroke="#000" stroke-width="24"/>
        <circle cx="${PLANET.cx}" cy="${PLANET.cy}" r="${PLANET.r + 15}" fill="#000"/>
      </mask></defs>
      <g mask="url(#${id})"><ellipse class="orbit" cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${e.rot} ${e.cx} ${e.cy})" fill="none" style="stroke:var(--logo-ink, ${CREAM})" stroke-width="15"/></g>
      <path class="frame" d="${FRAME}" fill="none" style="stroke:var(--logo-ink, ${CREAM})" stroke-width="23" stroke-linejoin="miter"/>
      <path class="term" d="${TERM}" fill="${PURPLE}"/>
      ${BARS.map((d) => `<path class="bar" d="${d}" fill="${PURPLE}"/>`).join('')}
      <path class="orbit-front" d="${FRONT}" fill="none" style="stroke:var(--logo-ink, ${CREAM})" stroke-width="15"/>
      <circle class="planet" cx="${PLANET.cx}" cy="${PLANET.cy}" r="${PLANET.r}" fill="${PURPLE}"/>
    </svg>`;
  }
  // Imagem do logo (para desenhar em canvas, ex.: imagem de compartilhar).
  function image() {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="670" '));
    });
  }

  window.Logo = { svg, image, CREAM, PURPLE, VB, FRAME, TERM, BARS, ORBIT, FRONT, PLANET };
})();
