// Abertura do Gravity: mira de scouter trava no logo, barras enchem, "nível de poder" sobe.
// Som sintetizado no estilo scouter (Arpejo, tom 60%, velocidade 180%, zumbido 160 Hz).
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

  // Nível de poder: sempre 9.001 ("é mais de 8 mil!").
  const POWER = 9001;

  const anim = (el, frames, opts) => el.animate(frames, Object.assign({ fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' }, opts));

  function run(root, done) {
    // Fundo opcional (foto). Config: { img, pos, size, filter, shade, stackTop }.
    const BG = window.SPLASH_BG || Object.assign({}, Splash.BG, { img: Splash.nextCover() });
    if (BG && BG.stackTop) root.style.setProperty('--sp-top', BG.stackTop);
    root.classList.toggle('has-bg', !!BG);
    root.innerHTML = (BG ? `<div class="sp-bg" style="${BG.box ? 'top:auto;height:' + BG.box + ';' : ''}background-image:url('${BG.img}');background-position:${BG.pos || '50% 50%'};background-size:${BG.size || 'cover'};${BG.filter ? 'filter:' + BG.filter : ''}"></div><div class="sp-shade" style="background:${BG.shade || 'rgba(0,0,0,.5)'}"></div>` : '') + `<div class="sp-glow"></div><div class="sp-reticle"><i></i><i></i><i></i><i></i></div><div class="sp-scan"></div>
      <div class="sp-power">Nível de poder<b>0</b></div>
      <div class="sp-stack">${logoSVG()}<div class="sp-word">Gravity</div><div class="sp-tag">${TAGLINE}</div></div>
      <button class="sp-go" type="button">Bora pro treino!</button>`;
    const q = (s) => root.querySelector(s);
    const svg = q('svg.sp-logo'), frame = q('.frame'), term = q('.term'), bars = [...svg.querySelectorAll('.bar')];
    const orbit = q('.orbit'), front = q('.orbit-front'), planet = q('.planet');
    const ret = q('.sp-reticle'), scan = q('.sp-scan'), pw = q('.sp-power'), num = pw.querySelector('b');
    [term].concat(bars).forEach((p) => { p.style.transformBox = 'fill-box'; p.style.transformOrigin = '50% 100%'; });

    anim(ret, [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'scale(1)', offset: 0.6 }, { opacity: 0.4, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1)' }], { duration: T(450) });
    const L = frame.getTotalLength();
    frame.style.strokeDasharray = L;
    anim(frame, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { delay: T(250), duration: T(800), easing: 'cubic-bezier(.6,0,.2,1)' });
    anim(term, [{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }], { delay: T(1000), duration: T(200) });
    // Órbita se desenha em volta da bateria e o planeta aparece no fim.
    [orbit, front].forEach((o) => { const l = o.getTotalLength(); o.style.strokeDasharray = l; anim(o, [{ strokeDashoffset: l }, { strokeDashoffset: 0 }], { delay: T(1500), duration: T(700), easing: 'cubic-bezier(.5,0,.2,1)' }); });
    planet.style.transformBox = 'fill-box'; planet.style.transformOrigin = '50% 50%';
    anim(planet, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.3)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], { delay: T(2050), duration: T(320) });
    anim(scan, [{ opacity: 0, transform: 'translateY(-50px)' }, { opacity: 1, offset: 0.1 }, { transform: 'translateY(50px)', offset: 0.5 }, { transform: 'translateY(-50px)', opacity: 1, offset: 0.9 }, { opacity: 0 }], { delay: T(300), duration: T(1700), easing: 'ease-in-out' });
    anim(pw, [{ opacity: 0 }, { opacity: 1 }], { delay: T(350), duration: T(200) });
    // A foto de fundo aparece aos poucos, enquanto o scouter faz a leitura.
    if (BG) anim(q('.sp-bg'), [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'scale(1)' }], { delay: T(300), duration: T(2400), easing: 'ease-out' });
    bars.forEach((b, i) => anim(b, [{ transform: 'scaleY(0)', opacity: 0.3 }, { transform: 'scaleY(1.12)', opacity: 1, offset: 0.7 }, { transform: 'scaleY(1)', opacity: 1 }], { delay: T(1250 + i * 230), duration: T(260) }));

    const target = POWER, t0 = performance.now() + T(350), dur = T(1650);
    let ff = false; // adiantado para o fim por um toque
    (function tick(now) {
      if (!root.isConnected) return;
      const k = ff ? 1 : Math.min(1, Math.max(0, (now - t0) / dur));
      num.textContent = (k < 1 ? Math.floor(target * k * k + Math.random() * target * 0.05 * (1 - k)) : target).toLocaleString('pt-BR');
      if (k < 1) requestAnimationFrame(tick);
    })(performance.now());

    anim(pw, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { delay: T(2000), duration: T(300) });
    anim(ret, [{ opacity: 1 }, { opacity: 0 }], { delay: T(2250), duration: T(400) });
    anim(q('.sp-glow'), [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.35 }, { opacity: 0.35, transform: 'translate(-50%,-50%) scale(1.05)' }], { delay: T(2000), duration: T(900) });
    anim(svg, [{ filter: 'drop-shadow(0 0 0 rgba(150,64,252,0))' }, { filter: 'drop-shadow(0 0 16px rgba(150,64,252,.75))', offset: 0.4 }, { filter: 'drop-shadow(0 0 5px rgba(150,64,252,.35))' }], { delay: T(2000), duration: T(900) });
    anim(q('.sp-word'), [{ opacity: 0, letterSpacing: '22px', filter: 'blur(4px)' }, { opacity: 1, letterSpacing: '10px', filter: 'blur(0)' }], { delay: T(2150), duration: T(700) });
    anim(q('.sp-tag'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { delay: T(2400), duration: T(600) });

    // O nível de poder fica na tela e o botão aparece no fim; o app só abre ao tocar nele.
    const go = q('.sp-go');
    anim(go, [{ opacity: 0, transform: 'translate(-50%, 16px) scale(.96)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { delay: DURATION, duration: 500 });
    setTimeout(() => go.classList.add('pulse'), DURATION + 500);

    if (Store.state.settings.sound) playSound();
    // Toque fora do botão: adianta a animação até o final (9.001 e o botão), sem entrar no app.
    root.addEventListener('click', (e) => {
      if (e.target.closest('.sp-go')) return;
      ff = true; num.textContent = target.toLocaleString('pt-BR');
      root.getAnimations({ subtree: true }).forEach((a) => { try { a.finish(); } catch (err) { /* ignora */ } });
      go.classList.add('pulse');
    });
    go.addEventListener('click', done);
  }

  // Mostra a abertura ao abrir o app pelo ícone. Pela notificação do treino ou pelo widget, vai direto.
  let enter = null;
  window.Splash = {
    // Fundo (opção 2 · Atleta embaixo): logo e nível de poder no preto, a foto embaixo.
    // A foto muda a cada abertura (ver COVERS / nextCover).
    BG: {
      img: 'img/capas/capa-01.jpg', box: '68%', size: 'cover', pos: '50% 35%', stackTop: 'max(30%, 222px)',
      shade: 'linear-gradient(180deg, #08080a 0%, #08080a 30%, rgba(8,8,10,.2) 48%, rgba(8,8,10,.12) 80%, rgba(8,8,10,.85) 100%)',
    },
    // Capas da abertura. Para incluir outra: salvar em img/capas/capa-NN.jpg (900 px de largura) e aumentar COVERS.
    COVERS: 16,
    // Sorteia sem repetir: todas as capas aparecem uma vez antes de recomeçar a fila, e a primeira
    // da fila nova nunca é a última mostrada. A fila fica no aparelho (localStorage).
    nextCover() {
      const n = Splash.COVERS, KEY = 'gravity.capas';
      let st = null;
      try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* ignora */ }
      if (!st || !Array.isArray(st.bag) || st.n !== n) st = { n, bag: [], last: 0 };
      if (!st.bag.length) {
        const bag = Array.from({ length: n }, (_, i) => i + 1);
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
        if (n > 1 && bag[0] === st.last) bag.push(bag.shift());
        st.bag = bag;
      }
      st.last = st.bag.shift();
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignora */ }
      return 'img/capas/capa-' + String(st.last).padStart(2, '0') + '.jpg';
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
        // Entrar: só uma vibração curta (sem bipe e sem voz).
        UI.Native.vibrate(40);
        root.classList.add('out');
        setTimeout(() => { root.remove(); if (ac) ac.close(); Theme.bars(); }, 450);
      };
      run(root, enter);
    },
    // Botão voltar do Android na abertura = "Bora pro treino!".
    back() { if (!enter) return false; enter(); return true; },
  };
})();
