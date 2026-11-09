// Abertura do Gravity (v0.30, identidade Obsidian Chrome): a foto da entrada já traz o logo.
// Duas aberturas que se alternam a cada vez que o app abre:
//  A · Eclipse: um anel de cobre acende, a foto surge do escuro e o nível de poder sobe até 9.001.
//  C · Scouter cromado: a mira de titânio procura o atleta, trava em cobre e a leitura sobe até 9.001.
// Som: A = zumbido grave + brilho metálico; C = scouter (arpejo, tom 60%, velocidade 180%, zumbido 160 Hz).
(function () {
  'use strict';

  const SOUND = { pitch: 0.6 * 0.4, speed: 1.8 * 0.96, hum: 160 };
  const TAGLINE = 'Foco · Disciplina · Muito café';
  // Fator de tempo da abertura: 1,35 × ~2,9 s ≈ 3,9 s (1 segundo a mais).
  const TS = 1.35;
  const T = (ms) => ms * TS;
  const DURATION = T(2900);

  const logoSVG = () => Logo.svg({ cls: 'sp-logo' });

  // ---------- som ----------
  let ac = null;
  function tone(t, freq, dur, type, vol, slideTo) {
    const at = ac.currentTime + t, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(ac.destination); o.start(at); o.stop(at + dur + 0.05);
  }
  // Bipe com zumbido metálico: onda quadrada modulada por outra (som de circuito).
  function buzz(t, f, d, v) {
    const at = ac.currentTime + t;
    const o = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), bp = ac.createBiquadFilter(), env = ac.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f, at); o.frequency.linearRampToValueAtTime(f * 0.94, at + d);
    mod.type = 'square'; mod.frequency.value = SOUND.hum;
    mg.gain.value = 0.5; g.gain.setValueAtTime(0.5, at);
    bp.type = 'bandpass'; bp.frequency.value = Math.max(400, f * 1.4); bp.Q.value = 0.9;
    env.gain.setValueAtTime(0.0001, at); env.gain.exponentialRampToValueAtTime(v, at + 0.002); env.gain.setValueAtTime(v, at + d * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, at + d);
    mod.connect(mg); mg.connect(g.gain); o.connect(g); g.connect(bp); bp.connect(env); env.connect(ac.destination);
    o.start(at); mod.start(at); o.stop(at + d + 0.02); mod.stop(at + d + 0.02);
  }
  function playSound() {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; return; }
    const P = SOUND.pitch, V = SOUND.speed;
    tone(0, 300 * P, 0.16 * TS, 'sawtooth', 0.05, 2000 * P);                                // liga
    buzz(0.18 * TS, 1500 * P, 0.05, 0.11); buzz(0.25 * TS, 1500 * P, 0.05, 0.11);           // prontidão
    const steps = [1, 1.26, 1.5];                                                           // arpejo de três tons
    const a = 0.4 * TS, z = 1.95 * TS;
    let t = a, i = 0;
    while (t < z) {
      const k = (t - a) / (z - a);
      buzz(t, (1250 + 450 * k) * P * steps[i % 3], 0.026, 0.1);
      t += (0.045 - 0.018 * k) / V; i++;
    }
    [1.25, 1.48, 1.71].forEach((tt) => buzz(tt * TS, 980 * P, 0.06, 0.13));                // cada barra
    buzz(2.0 * TS, 2100 * P, 0.06, 0.12); buzz(2.09 * TS, 2100 * P, 0.3, 0.1);             // leitura concluída
  }

  // Som da abertura A: zumbido grave que cresce, sopro e um "brilho" metálico no 9.001.
  function playSoundA() {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; return; }
    tone(0, 55, 2.4, 'sine', 0.22, 82);
    tone(0.05, 110, 2.2, 'triangle', 0.05, 164);
    try {
      const n = ac.sampleRate * 1.6, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; bp.type = 'bandpass'; bp.frequency.setValueAtTime(400, ac.currentTime + 0.3); bp.frequency.exponentialRampToValueAtTime(3200, ac.currentTime + 1.9); bp.Q.value = 1.2;
      g.gain.value = 0.06; src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(ac.currentTime + 0.3);
    } catch (e) { /* sem ruído */ }
    const hit = 2.25;
    [[1760, 0.16], [2640, 0.09], [3520, 0.05], [880, 0.12]].forEach(([f, v]) => tone(hit, f, 1.3, 'sine', v));
    tone(hit, 70, 0.6, 'sine', 0.3, 45);
  }

  // Nível de poder: sempre 9.001 ("é mais de 8 mil!").
  const POWER = 9001;
  const anim = (el, frames, opts) => el.animate(frames, Object.assign({ fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' }, opts));
  const fmt = (n) => n.toLocaleString('pt-BR');

  // Contador do nível de poder (curva que acelera no fim). Devolve "adiantar para o fim".
  function counter(el, t0, dur) {
    let ff = false;
    (function tick(now) {
      if (!el.isConnected) return;
      if (!ff && now < t0) { requestAnimationFrame(tick); return; } // ainda não começou: mantém o texto inicial
      const k = ff ? 1 : Math.min(1, Math.max(0, (now - t0) / dur));
      el.textContent = k < 1 ? fmt(Math.floor(POWER * k * k + Math.random() * POWER * 0.04 * (1 - k))) : fmt(POWER);
      if (k < 1) requestAnimationFrame(tick);
    })(performance.now());
    return () => { ff = true; el.textContent = fmt(POWER); };
  }

  function run(root, done, mode, img) {
    root.className = 'sp2 mode-' + mode;
    // Fotos só com o logo (sem atleta): a arte desce o nome GRAVITY até onde fica o nível de poder; sobem um pouco.
    const nImg = Number((String(img).match(/entrada-(\d+)/) || [])[1]), logoOnly = nImg && !Splash.ATHLETE.includes(nImg);
    root.innerHTML = `<div class="sp-photo${logoOnly ? ' logo-only' : ''}" style="background-image:url('${img}')"></div><div class="sp-vig"></div>
      ${mode === 'A' ? '<div class="sp-ring"></div><div class="sp-flare"></div>' : '<div class="sp-scope"><i></i><i></i><i></i><i></i><span class="sp-cross"></span></div><div class="sp-read"><small>Analisando…</small><b>– – – –</b></div>'}
      <div class="sp-panel"><div class="sp-cap">Nível de poder</div><div class="sp-num">0</div><div class="sp-sub">É mais de 9.000!</div>
        <div class="sp-line"><i></i></div><button class="sp-go" type="button">Iniciar treino</button></div>`;
    const q = (sel) => root.querySelector(sel);
    const photo = q('.sp-photo'), num = q('.sp-num'), line = q('.sp-line i'), go = q('.sp-go'), sub = q('.sp-sub'), panel = q('.sp-panel');
    let finish;
    if (mode === 'A') {
      // Eclipse: anel de cobre acende no escuro, a foto aparece com zoom lento e o anel se abre e some no arco da foto.
      const ring = q('.sp-ring');
      anim(ring, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.35) rotate(-40deg)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(.6) rotate(0)', offset: 0.35 }, { opacity: 0.9, transform: 'translate(-50%,-50%) scale(1.05)', offset: 0.75 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.25)' }], { duration: 2300, easing: 'cubic-bezier(.3,.1,.2,1)' });
      anim(photo, [{ opacity: 0, transform: 'scale(1.1)', filter: 'brightness(.4)' }, { opacity: 1, transform: 'scale(1)', filter: 'brightness(1)' }], { delay: 500, duration: 2300, easing: 'cubic-bezier(.2,.6,.2,1)' });
      anim(q('.sp-flare'), [{ opacity: 0, transform: 'translateX(-60%) scaleX(.2)' }, { opacity: 1, transform: 'translateX(0) scaleX(1)', offset: 0.5 }, { opacity: 0, transform: 'translateX(40%) scaleX(.6)' }], { delay: 2150, duration: 900, easing: 'ease-out' });
      anim(panel, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { delay: 900, duration: 600 });
      anim(line, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { delay: 950, duration: 1350, easing: 'cubic-bezier(.5,0,.3,1)' });
      finish = counter(num, performance.now() + 950, 1350);
    } else {
      // Scouter cromado: a foto aparece escurecida, a mira procura, trava em cobre e a leitura sobe.
      const scope = q('.sp-scope'), read = q('.sp-read'), rb = read.querySelector('b'), rs = read.querySelector('small');
      anim(photo, [{ opacity: 0, filter: 'brightness(.35) saturate(.5)' }, { opacity: 1, filter: 'brightness(.55) saturate(.6)', offset: 0.5 }, { opacity: 1, filter: 'brightness(1) saturate(1)' }], { duration: 2600, easing: 'ease-out' });
      anim(scope, [
        { opacity: 0, transform: 'translate(-50%,-50%) translate(-60px,40px) scale(1.5)' },
        { opacity: 1, transform: 'translate(-50%,-50%) translate(-50px,30px) scale(1.35)', offset: 0.15 },
        { transform: 'translate(-50%,-50%) translate(55px,-20px) scale(1.25)', offset: 0.4 },
        { transform: 'translate(-50%,-50%) translate(-25px,-35px) scale(1.15)', offset: 0.6 },
        { transform: 'translate(-50%,-50%) scale(1)', offset: 0.78 },
        { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 1700, easing: 'cubic-bezier(.45,.05,.3,1)' });
      setTimeout(() => { if (root.isConnected) { scope.classList.add('lock'); rs.textContent = 'Nível de poder'; } }, 1330);
      anim(read, [{ opacity: 0 }, { opacity: 1 }], { delay: 200, duration: 300 });
      const fr = counter(rb, performance.now() + 1350, 950);
      anim(read, [{ opacity: 1 }, { opacity: 0 }], { delay: 2350, duration: 300 });
      anim(scope, [{ opacity: 1 }, { opacity: 0 }], { delay: 2600, duration: 500 });
      anim(panel, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { delay: 2300, duration: 500 });
      anim(line, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { delay: 2300, duration: 500 });
      num.textContent = fmt(POWER);
      finish = fr;
    }
    // 9.001 em cobre, com um pulso; depois o botão.
    const END = mode === 'A' ? 2300 : 2350;
    setTimeout(() => { if (root.isConnected) root.classList.add('hit'); }, END);
    anim(sub, [{ opacity: 0 }, { opacity: 1 }], { delay: END + 100, duration: 400 });
    anim(go, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { delay: END + 350, duration: 450 });

    if (Store.state.settings.sound) (mode === 'A' ? playSoundA : playSound)();
    // Toque fora do botão: adianta até o final (9.001 e o botão), sem entrar no app.
    root.addEventListener('click', (e) => {
      if (e.target.closest('.sp-go')) return;
      finish();
      const rb = root.querySelector('.sp-read b'); if (rb) rb.textContent = fmt(POWER);
      root.getAnimations({ subtree: true }).forEach((a) => { try { a.finish(); } catch (err) { /* ignora */ } });
      root.classList.add('hit'); const sc = root.querySelector('.sp-scope'); if (sc) sc.classList.add('lock');
    });
    go.addEventListener('click', done);
  }

  // Mostra a abertura ao abrir o app pelo ícone. Pela notificação do treino ou pelo widget, vai direto.
  let enter = null;
  const pick = (key, list) => {
    // Sorteia sem repetir: todas aparecem uma vez antes de recomeçar a fila, e a primeira da fila nova
    // nunca é a última mostrada. A fila fica no aparelho (localStorage).
    let st = null;
    try { st = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { /* ignora */ }
    const sig = list.join(',');
    if (!st || !Array.isArray(st.bag) || st.sig !== sig) st = { sig, bag: [], last: 0 };
    st.bag = (st.bag || []).filter((n) => list.includes(n)); // fotos que saíram (ex.: troca de fotos na v0.40)
    if (!st.bag.length) {
      const bag = list.slice();
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[0] === st.last) bag.push(bag.shift());
      st.bag = bag;
    }
    st.last = st.bag.shift();
    try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) { /* ignora */ }
    return st.last;
  };
  window.Splash = {
    // Fotos da entrada: img/entrada/entrada-NN.jpg (900 px de largura, 9:16, com o logo já na arte).
    // ATHLETE = as que têm atleta (a mira da abertura C precisa de alguém para "ler").
    // v0.40: 9 fotos com o logo oficial (manual da marca); 1–7 com atleta, 8 e 9 só com o logo.
    PHOTOS: 9,
    ATHLETE: [1, 2, 3, 4, 5, 6, 7],
    // Alterna A e C a cada abertura.
    nextMode() {
      let m = 'C';
      try { m = localStorage.getItem('gravity.entradaModo') === 'A' ? 'C' : 'A'; localStorage.setItem('gravity.entradaModo', m); } catch (e) { m = 'A'; }
      return m;
    },
    nextPhoto(mode) {
      const all = Array.from({ length: Splash.PHOTOS }, (_, i) => i + 1);
      const n = pick(mode === 'C' ? 'gravity.entradaC' : 'gravity.entradaA', mode === 'C' ? Splash.ATHLETE : all);
      return 'img/entrada/entrada-' + String(n).padStart(2, '0') + '.jpg';
    },
    show() {
      const root = document.getElementById('splash');
      if (!root) return;
      let src = '';
      try { src = window.Android && Android.launchSource ? Android.launchSource() : ''; } catch (e) { /* ignora */ }
      if (src || Store.state.settings.splash === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.remove(); Theme.bars(); return; }
      let closed = false;
      enter = () => {
        if (closed) return; closed = true; enter = null;
        UI.Native.vibrate(40);
        root.classList.add('out');
        setTimeout(() => { root.remove(); if (ac) ac.close(); Theme.bars(); }, 450);
      };
      const mode = window.SPLASH_MODE || Splash.nextMode();
      run(root, enter, mode, window.SPLASH_IMG || Splash.nextPhoto(mode));
    },
    // Botão voltar do Android na abertura = "Iniciar treino".
    back() { if (!enter) return false; enter(); return true; },
  };
})();
