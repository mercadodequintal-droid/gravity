// Boneco anatômico (frente e costas) para o mapa muscular.
// Cada lado é desenhado só na metade esquerda (x ≤ 80) e espelhado. Os músculos usam as regiões
// de Analytics.REGIONS; color(regiao) devolve a cor ou '' para o músculo apagado (cinza).
(function () {
  'use strict';

  // ---------- silhueta (metade) ----------
  const BODY = 'M80 35 L74.5 35 C73.5 40 72.5 43 70 45.5 C62 49 54 50.5 48 53.5 C43 57 41 63 42 70 L45.5 84 C47.5 97 52 108 55 120 C56.5 130 53.5 141 51 152 C48 172 47.5 196 51.5 221 C53.5 231 55 238 54 246 C52 258 53 273 57 290 C58 298 58.5 304 57 309 C56 315 64 317 70.5 314.5 C72.5 312 70.5 306 69.5 300 C70 286 73 268 73 254 C73 244 72 238 73 232 C76 214 77 196 78 181 L80 169 Z';
  const ARM = 'M45 58 C38.5 62 35.5 73 35.5 86 C35 96 34 104 33.5 110 C30.5 122 28 136 26 150 L25 158 C22 162 20.5 170 21.5 176 C22.5 182 28 183.5 30 178 L31 166 L32.5 158 C35.5 146 39 131 41 117 C43 108 45 100 46.5 92 Z';
  const HEAD = '<ellipse cx="80" cy="20" rx="11.5" ry="14.5"/>';

  // ---------- músculos de frente (metade) ----------
  const FRONT = [
    ['trapezio', 'M72.5 44 C67 47 59 50 52.5 52.5 C60 53.5 68 52.5 74.5 50 C74 48 73.5 46 72.5 44 Z'],
    ['peitoral', 'M79.3 55.5 C70 54.5 61 55.5 55 58.5 C50 63 47.5 70 48.5 78 C53 87 63 92.5 73 92 C77.5 91.5 79.3 88.5 79.3 84 Z'],
    ['ombros', 'M50 52.5 C42 54 36.5 62 36 74 C36 80 37 84 39.5 86 C42 82 44.5 74 47.5 67 C50 61 53 57 56 55 C54 53 52 52.5 50 52.5 Z'],
    ['biceps', 'M40 82 C36.5 88 35.5 98 36 106 C37.5 111 42.5 112 44.8 107 C46.5 99 46.8 90 45 84 C43.5 82 41.5 81.5 40 82 Z'],
    ['antebracos', 'M35.8 110 C32 118 28.8 132 27 146 C26.5 152 28 156 30 156.5 C33 156 36 146 38.5 136 C40.5 128 42.5 120 43.5 113 C42 110 38.5 108.5 35.8 110 Z'],
    // serrátil
    ['abdomen', 'M55.5 85.5 a5.2 1.9 22 1 0 9.6 3.9 a5.2 1.9 22 1 0 -9.6 -3.9 Z M55 92 a5.2 1.9 22 1 0 9.6 3.9 a5.2 1.9 22 1 0 -9.6 -3.9 Z M55.2 98.5 a5 1.8 22 1 0 9.2 3.7 a5 1.8 22 1 0 -9.2 -3.7 Z'],
    // oblíquo
    ['abdomen', 'M71 95 C66 97 61 101 58 106.5 C56 117 58.5 131 64 143 C67.5 141 70.5 136.5 72 131 C70.8 120 70.6 106 71 95 Z'],
    // reto abdominal (gomos)
    ['abdomen', 'M79.3 93.5 L73 94.5 C71.2 99 71.2 103 71.8 106 L79.3 106 Z M79.3 108 L71.8 108 C71.2 112 71.2 116 71.8 119.5 L79.3 119.5 Z M79.3 121.5 L71.8 121.5 C71.2 125.5 71.3 129.5 72 133 L79.3 133 Z M79.3 135 L72.3 135 C72.5 144 74.5 152 79.3 159 Z'],
    ['quadriceps', 'M52.5 156 C48.5 176 48.5 200 52.5 222 C55 228 60 229 61.5 224 C60 204 59 182 60 160 C58 156.5 55 155 52.5 156 Z'],
    ['quadriceps', 'M61 152 C59 172 59.5 198 62.5 222 C65 228.5 70.5 227 71 220 C72 198 71 174 67 155 C65 152 63 151 61 152 Z'],
    ['quadriceps', 'M71.5 196 C69 207 69 219 71.5 228 C75 231.5 77.5 227 77.5 220 C77.5 210 75.5 201 71.5 196 Z'],
    // adutores
    ['quadriceps', 'M68.5 156 C73 161.5 77 166 79 171 C77.5 183 75 193 72 199 C71.5 186 70.5 172 68.5 156 Z'],
    // tibial anterior e gastrocnêmio medial
    ['panturrilhas', 'M56.5 238 C53.5 254 54.5 272 58 290 C60 291 61.5 290 62 288 C62 270 62.5 254 62 240 C60.5 237.5 58 237 56.5 238 Z'],
    ['panturrilhas', 'M66 239 C70.5 245 73.5 256 72.8 268 C72 278 70 284 68 287 C66.5 272 65.5 254 66 239 Z'],
  ];
  // Detalhes neutros: pescoço, joelho, linha do antebraço
  const FRONT_NEUTRAL = '<path d="M74.6 33 C74 38 74.5 42 77.5 45.5 L79.3 45.5 C77.3 41 76.5 37 76.5 33 Z" fill="#5c6067"/>'
    + '<path d="M59.5 229.5 C62 226.5 68 226.5 71 229.5 C71.5 234.5 69 238 65.5 238 C62 238 59 234.5 59.5 229.5 Z" fill="#8a8172" opacity=".55"/>'
    + '<path d="M39.5 113 C36.5 125 33.5 139 30.8 154" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>';

  // ---------- músculos de costas (metade) ----------
  const BACK = [
    ['trapezio', 'M80 33.5 L74.5 35 C73.5 43 66 48.5 51 53 C58.5 57 65.5 64.5 70.5 74 C74 84 77.5 96 79.3 106 L80 106 Z'],
    ['meio', 'M55.5 58 C60 63 66 68.5 70.5 75 C68 82.5 63 88 56 88.5 C51.5 83 50 72 52.5 62 C53.3 60 54.3 58.5 55.5 58 Z'],
    ['ombros', 'M50 52.5 C42 54 36.5 62 36 74 C36 80 37 84 39.5 86 C42.5 83 45.5 76 48.5 69 C51 63 53 58 54.5 55 C53 53 51.5 52.5 50 52.5 Z'],
    ['dorsais', 'M49.5 86.5 C55.5 90 62.5 90.5 70.5 86.5 C74 98 77 111 79.3 121 L79.3 132 C73 138 65 141.5 59 141.5 C56.5 130 53 114 49.5 98.5 C48.6 93.5 48.8 89.5 49.5 86.5 Z'],
    ['lombar', 'M73 114 C70.5 126 70.5 140 72.5 152 L79.3 154 L79.3 116 Z'],
    ['triceps', 'M37 80 C35 90 35 100 36.5 110 C39 114 43.5 113.5 45 108 C46.5 99 46 89 44.5 82 C42 79 39 78.5 37 80 Z'],
    ['antebracos', 'M35.8 112 C32 120 28.8 133 27 146 C26.5 152 28 156 30 156.5 C33 156 36 146 38.5 137 C40.5 129 42.5 121 43.5 115 C42 112 38.5 110.5 35.8 112 Z'],
    ['gluteos', 'M55 144 C52 150 51.5 156 53.5 161 C58 155 64.5 150.5 71.5 148.5 C66 145 60 143.5 55 144 Z'],
    ['gluteos', 'M79.3 150 C70 147.5 60 150.5 54 158 C50.5 168 52.5 181 59.5 187.5 C67.5 192 76 190 79.3 184 Z'],
    ['posteriores', 'M51.5 188 C49 204 51 220 56 232 C59.5 235 63 232 63 225 C62 208 61 196 61 189 C58 186.5 54 186.5 51.5 188 Z'],
    ['posteriores', 'M63 190 C62.5 206 64 221 66 232 C70 235.5 74 232 74 224 C75 208 76.5 197 77.5 189 C73 187.5 67.5 188 63 190 Z'],
    ['panturrilhas', 'M55.5 236 C51.5 247 52.5 262 57.5 274 C61 277 64 272.5 64 263 C64 252 62.5 243 60.5 237 C58.5 235.5 57 235.5 55.5 236 Z'],
    ['panturrilhas', 'M64.5 238 C64.5 251 65.5 264 67.5 275 C71.5 278 74 271 73.8 262 C73.5 250 71.5 242 68 237 C66.5 236.5 65.3 237 64.5 238 Z'],
  ];
  const BACK_NEUTRAL = '<path d="M60.5 277 C60.5 287 61.5 295 63 302 L66 302 C66.5 294 67 286 67 278 Z" fill="#5c6067" opacity=".8"/>'
    + '<path d="M39.5 115 C36.5 127 33.5 140 30.8 154" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>';

  const SKIN = '#4b4e54', OFF = '#5c6067';
  const defs = `<defs>
    <linearGradient id="anaSkin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2c30"/><stop offset=".5" stop-color="#43464c"/><stop offset="1" stop-color="#2f3135"/></linearGradient>
    <radialGradient id="anaShade" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
  </defs>`;

  function half(list, color, neutral) {
    const base = `<path d="${BODY}" fill="url(#anaSkin)"/><path d="${ARM}" fill="url(#anaSkin)"/>`;
    const mus = list.map(([k, d]) => {
      const c = color(k) || OFF;
      return `<path d="${d}" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".6"/><path d="${d}" fill="url(#anaShade)"/>`;
    }).join('');
    return base + neutral + mus;
  }
  function side(list, color, neutral, dx, label) {
    const h = half(list, color, neutral);
    return `<g transform="translate(${dx} 0)"><g fill="url(#anaSkin)">${HEAD}<rect x="73.5" y="30" width="13" height="12" rx="4"/></g>
      <g>${h}</g><g transform="matrix(-1 0 0 1 160 0)">${h}</g>
      <text x="80" y="334" text-anchor="middle" font-size="10" letter-spacing="2" fill="var(--text-3)">${label}</text></g>`;
  }
  // Mesma assinatura do boneco anterior: bodySVG(color, altura).
  function bodySVG(color, height) {
    return `<svg viewBox="0 0 330 342" class="bodymap" style="height:${height || 300}px">${defs}${side(FRONT, color, FRONT_NEUTRAL, 0, 'FRENTE')}${side(BACK, color, BACK_NEUTRAL, 170, 'COSTAS')}</svg>`;
  }

  window.Anatomy = { bodySVG, SKIN };
})();
