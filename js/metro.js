// Metrônomo da cadência (v0.28): marca o ritmo da repetição com bipes ou voz, ex.: 3-1-1 =
// desce em 3 s, segura 1 s, sobe em 1 s. Liga por exercício, na tela do treino; para sozinho ao marcar a série.
// A cadência vem da técnica do exercício (Cadência controlada, Negativa) ou da última escolhida para ele.
(function () {
  'use strict';
  const S = () => Store.state;
  const PH = [['desce', 'Desce'], ['segura', 'Segura'], ['sobe', 'Sobe'], ['topo', 'Segura em cima']];
  let ac = null, timer = null, run = null, onTick = null;

  // "3-1-1" ou "3-1-1-0" → [3, 1, 1, 0]; "X" (explosivo) = 1.
  function parse(str) {
    const n = String(str || '').split(/[-–\/ ]+/).map((x) => (/x/i.test(x) ? 1 : Math.max(0, Math.min(10, parseInt(x, 10) || 0))));
    while (n.length < 4) n.push(0);
    if (!n[0] && !n[2]) return [3, 1, 1, 0];
    return n.slice(0, 4);
  }
  const fmt = (c) => (c[3] ? c.join('-') : c.slice(0, 3).join('-'));

  // Cadência sugerida para um item do plano.
  function forItem(it, exId) {
    const saved = (S().settings.metro || {})[exId];
    if (saved && saved.c) return parse(saved.c);
    const t = it && it.tech;
    if (t && t.id === 'cadencia' && t.tempo) return parse(t.tempo);
    if (t && t.id === 'negativa') return [Number(t.seg) || 4, 0, 1, 0];
    return [3, 1, 1, 0];
  }
  const mode = () => (S().settings.metroMode === 'voz' ? 'voz' : 'bipe');
  function remember(exId, c, m) {
    S().settings.metro = S().settings.metro || {};
    S().settings.metro[exId] = { c: fmt(c) };
    if (m) S().settings.metroMode = m;
    Store.save();
  }

  // ---------- som ----------
  function tone(f, dur, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime + 0.005, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* sem áudio */ }
  }
  // Início de cada fase tem um som próprio (desce grave, sobe agudo); os segundos seguintes, um tique leve.
  const PHASE_TONE = { desce: [520, 0.22, 0.7], segura: [780, 0.12, 0.5], sobe: [1040, 0.22, 0.75], topo: [780, 0.12, 0.5] };
  function cue(ph, k) {
    if (run.mode === 'voz' && window.Voice) {
      Voice.speak(k === 0 ? PH.find((x) => x[0] === ph)[1].replace('Segura em cima', 'Segura') : String(k + 1), true);
    } else if (k === 0) { const [f, d, v] = PHASE_TONE[ph]; tone(f, d, v); } else tone(1400, 0.05, 0.3);
  }

  // ---------- ciclo ----------
  // Sequência de segundos de uma repetição: [[fase, segundo dentro da fase], …].
  function steps(c) {
    const out = [];
    PH.forEach(([id], i) => { for (let k = 0; k < c[i]; k++) out.push([id, k]); });
    return out;
  }
  function start(o) {
    stop();
    run = { c: o.c, mode: o.mode || mode(), seq: steps(o.c), pos: -3, rep: 0, exId: o.exId, ph: null, k: 0 };
    onTick = o.onTick || null;
    let next = performance.now();
    const step = () => {
      if (!run) return;
      if (run.pos < 0) { // contagem 3, 2, 1 antes de começar
        tone(880, 0.1, 0.45);
        if (run.mode === 'voz' && window.Voice) Voice.speak(String(-run.pos), true);
        run.ph = 'prep'; run.k = -run.pos;
      } else {
        const [ph, k] = run.seq[run.pos % run.seq.length];
        if (run.pos > 0 && run.pos % run.seq.length === 0) { run.rep++; UI.Native.vibrate(25); }
        run.ph = ph; run.k = k; cue(ph, k);
      }
      run.pos++;
      if (onTick) onTick(state());
      next += 1000;
      timer = setTimeout(step, Math.max(0, next - performance.now()));
    };
    step();
  }
  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    const was = !!run;
    run = null;
    if (was && onTick) onTick(null);
    onTick = null;
  }
  function state() {
    if (!run) return null;
    const lbl = run.ph === 'prep' ? 'Prepare' : PH.find((x) => x[0] === run.ph)[1];
    return { ph: run.ph, label: lbl, k: run.k, rep: run.rep, c: run.c, exId: run.exId, mode: run.mode };
  }

  // ---------- telas ----------
  // Folha para escolher a cadência e o som antes de começar.
  // v0.45: ritmos prontos, barra colorida da repetição e "Personalizar tempos".
  const PRESETS = [['3-1-1', 'controle'], ['2-0-2', 'constante'], ['4-0-1', 'negativa'], ['1-0-1', 'rápido']];
  function sheet(it, exId, onStart) {
    const c = forItem(it, exId).slice();
    let m = mode(), custom = false;
    const ex = Store.exercise(exId);
    const reps = parseInt(String((it && it.reps) || 10), 10) || 10;
    const box = (i, lb) => `<div class="field"><label>${lb}</label><div class="stepper big"><button data-a="st" data-i="${i}" data-d="-1">${UI.icon('minus')}</button><div class="val"><b class="num">${c[i]}</b><small>seg</small></div><button data-a="st" data-i="${i}" data-d="1">${UI.icon('plus')}</button></div></div>`;
    const seg = (n, lb, bg, ink) => (n ? `<div style="flex:${n};background:${bg};color:${ink || 'var(--lime-ink)'}">${n >= 2 ? lb + ' ' : ''}${n}s</div>` : '');
    UI.sheet({
      render: () => {
        const tot = c[0] + c[1] + c[2] + c[3], cur = fmt(c);
        return `<h3>Metrônomo</h3><div class="desc">Marca o ritmo de cada repetição em ${UI.esc(ex.nome)}. Para sozinho quando você marca a série.</div>
        <div class="fx-cap">Ritmo</div><div class="fx-pre">${PRESETS.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-a="pre" data-v="${k}"><b class="num">${k}</b><small>${l}</small></button>`).join('')}</div>
        <div class="fx-tl">${seg(c[0], 'DESCE', 'var(--gold)')}${seg(c[1], 'SEGURA', 'var(--gold-2)')}${seg(c[2], 'SOBE', '#2FB36B', '#fff')}${seg(c[3], 'TOPO', 'rgba(var(--fg-rgb),.25)', 'var(--text)')}</div>
        <div class="small muted" style="text-align:center">${tot} segundos por repetição · ${reps} repetições ≈ ${UI.secs(tot * reps)}</div>
        ${custom ? `<div class="form-row" style="margin-top:10px">${box(0, 'Desce')}${box(1, 'Segura embaixo')}</div><div class="form-row">${box(2, 'Sobe')}${box(3, 'Segura em cima')}</div>` : `<button class="fx-link" data-a="custom">${UI.icon('edit', 'sm')}Personalizar tempos</button>`}
        <div class="fx-cap">Som</div><div class="seg"><button class="${m === 'bipe' ? 'on' : ''}" data-a="m" data-v="bipe">Bipes</button><button class="${m === 'voz' ? 'on' : ''}" data-a="m" data-v="voz">Voz</button></div>
        <div class="tiny muted" style="margin-top:6px">${m === 'bipe' ? 'Som grave = desce, agudo = sobe, tique = cada segundo.' : 'A voz diz "desce… 2… 3… segura… sobe".'}</div>
        <button class="btn lime block pl-create" style="margin-top:14px" data-a="ok">${UI.icon('play', 'sm')}Começar</button>`;
      },
      actions: {
        pre: (ds) => { const n = parse(ds.v); for (let i = 0; i < 4; i++) c[i] = n[i]; UI.sheetRefresh(); },
        custom: () => { custom = true; UI.sheetRefresh(); },
        st: (ds) => { const i = Number(ds.i); c[i] = Math.max(i === 0 || i === 2 ? 1 : 0, Math.min(10, c[i] + Number(ds.d))); UI.sheetRefresh(); },
        m: (ds) => { m = ds.v; UI.sheetRefresh(); },
        ok: () => { remember(exId, c, m); UI.closeSheet(); onStart(c, m); },
      },
    });
  }

  window.Metro = { parse, fmt, forItem, start, stop, state, sheet, running: () => !!run };
})();
