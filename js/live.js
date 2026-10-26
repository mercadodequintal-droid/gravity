// Treino em andamento: barra flutuante dentro do app (fora da tela do treino) e notificação fixa
// do Android com os botões Série feita, Abrir e Encerrar.
(function () {
  'use strict';
  const { icon, nf, clock, secs } = UI;
  const A = window.Android;
  const S = () => Store.state;
  let bar = null, lastSig = null, liveOn = false;

  // Sessão rodando agora (começada há menos de 12 h e não finalizada).
  function active() {
    const st = S(), s = st.activeSessionId && Store.session(st.activeSessionId);
    if (!s || s.finished || Date.now() - s.start > 12 * 3600000) return null;
    const fw = Store.findWorkout(s.workoutId);
    return fw ? { s, w: fw.workout, items: fw.workout.items } : null;
  }

  // Próxima série a fazer: começa pelo exercício aberto na tela do treino, depois segue a ordem.
  function nextSet(a) {
    const { s, items } = a;
    const f = Live.focus && Live.focus.sid === s.id ? Live.focus.i : 0;
    for (let k = 0; k < items.length; k++) {
      const i = (f + k) % items.length, it = items[i];
      if (Store.itemProgress(s, it).complete || (s.skipped || []).includes(it.id)) continue;
      const x = s.sets.find((y) => y.itemId === it.id && !y.done);
      if (x) return { i, it, x };
    }
    return null;
  }

  // Descanso depois da série (0 = segue direto: bi-set, drop set…).
  function restAfter(a, n) {
    if (n.x.warm) return 45;
    if (Store.isCardio(n.x.exId)) return 0;
    const g = TECH.groupOf(a.items, n.i);
    if (g && n.i < g.end) return 0;
    const mine = a.s.sets.filter((y) => y.itemId === n.it.id);
    const after = mine[mine.indexOf(n.x) + 1];
    if (after && after.sub && !after.warm && after.n === n.x.n) { const p = TECH.pauseFor(n.it); if (p !== 'rest') return p || 0; }
    return Number(n.it.rest) || S().settings.restDefault;
  }

  function setText(a, n) {
    const ex = Store.exercise(Store.exOf(a.s, n.it));
    const main = a.s.sets.filter((y) => y.itemId === n.it.id && !y.sub).length;
    const what = n.x.sub ? n.x.label : n.x.warm ? 'aquecimento' : 'série ' + n.x.n + ' de ' + main;
    const load = n.x.time ? secs(n.x.reps) : (Tools.loadText(n.x.kg, n.x.exId) ? Tools.loadText(n.x.kg, n.x.exId) + ' × ' : '') + n.x.reps;
    return { ex: ex.nome, text: ex.nome + ' · ' + what + ' · ' + load };
  }

  // Frase falada da próxima série: "Próximo exercício: crucifixo, 3 séries. Série 1, 20 quilos por 12 repetições."
  function phrase(a) {
    a = a || active(); if (!a) return '';
    const n = nextSet(a);
    if (!n) return 'Todos os exercícios feitos. Toque em finalizar.';
    const ex = Store.exercise(Store.exOf(a.s, n.it));
    const mine = a.s.sets.filter((y) => y.itemId === n.it.id);
    const main = mine.filter((y) => !y.sub).length;
    const first = !mine.some((y) => y.done);
    const left = a.s.sets.filter((y) => !y.done).length;
    let p = left === 1 ? 'Última série do treino! ' : '';
    if (first) p += 'Próximo exercício: ' + ex.nome + ', ' + main + (main === 1 ? ' série. ' : ' séries. ');
    else p += ex.nome + ', ';
    p += n.x.sub ? n.x.label + ', ' : n.x.warm ? 'aquecimento, ' : 'série ' + n.x.n + (first ? '' : ' de ' + main) + ', ';
    p += n.x.time ? Voice.secs(n.x.reps) : (Tools.loadSpoken(n.x.kg, n.x.exId) ? Tools.loadSpoken(n.x.kg, n.x.exId) + ' por ' : '') + n.x.reps + ' repetições';
    return p + '.';
  }

  function progress(a) {
    const done = a.items.filter((it) => Store.itemProgress(a.s, it).complete).length;
    return { done, total: a.items.length };
  }

  const inPlayer = () => { const t = UI.R.stack[UI.R.stack.length - 1]; return !!(t && t.player); };

  function paintBar(a) {
    const show = !!a && !inPlayer();
    document.body.classList.toggle('live-out', show);
    bar.classList.toggle('show', show);
    if (!show) return;
    const p = progress(a), R = UI.Rest;
    const resting = R.end && !R.over;
    bar.querySelector('[data-t]').textContent = 'Treino ' + a.w.letter + ' · ' + a.w.name;
    bar.querySelector('[data-s]').textContent = resting ? 'Descanso · ' + clock(R.left() * 1000 + 999) : p.done + ' de ' + p.total + ' exercícios · ' + clock(Date.now() - a.s.start);
    bar.classList.toggle('resting', !!resting);
  }

  function syncNative(a) {
    if (!A || !A.workoutUpdate) return;
    if (!a) { if (liveOn) { liveOn = false; lastSig = null; try { A.workoutEnd(); } catch (e) { /* ignora */ } } return; }
    const n = nextSet(a);
    const t = n ? setText(a, n) : null;
    const p = progress(a);
    const o = {
      title: 'Treino ' + a.w.letter + ' · ' + a.w.name + ' (' + p.done + '/' + p.total + ')',
      text: t ? t.text : 'Todos os exercícios feitos · toque em Encerrar',
      next: t ? t.ex : '', rest: n ? restAfter(a, n) : 0, allDone: !n,
      start: a.s.start, sound: !!S().settings.sound, vibrate: !!S().settings.vibrate,
      say: phrase(a),
    };
    const sig = JSON.stringify(o);
    if (sig === lastSig) return;
    lastSig = sig; liveOn = true;
    try { A.workoutUpdate(sig); } catch (e) { /* ignora */ }
  }

  function tick() {
    if (!bar) return;
    const a = active();
    paintBar(a);
    syncNative(a);
  }

  function open() {
    const a = active(); if (!a) return;
    UI.closeSheet();
    if (inPlayer()) return;
    UI.push(Screens.Player(a.s.id, Screens.firstOpenIndex(a.s)));
  }

  // "Série feita" tocado na notificação: marca a próxima série (o descanso já começou no Android).
  function doneNext() {
    const a = active(); if (!a) return;
    const n = nextSet(a); if (!n) return;
    Store.toggleSet(a.s, n.x.id);
    Store.save(true);
    const t = UI.R.stack[UI.R.stack.length - 1];
    if (t && t.player === a.s.id && t.refreshAll) t.refreshAll();
    else if (t && !t.player) UI.refresh();
  }

  // Ações vindas da notificação (o Android chama ao tocar um botão; o app também confere ao abrir).
  function pull() {
    if (!A || !A.takeActions) return;
    let list = [];
    try { list = JSON.parse(A.takeActions() || '[]'); } catch (e) { return; }
    list.forEach((x) => {
      if (x.a === 'done') doneNext();
      else if (x.a === 'open') open();
      else if (x.a === 'finish') { const a = active(); if (a) { open(); setTimeout(() => Screens.finishSheet(a.s.id), 420); } }
    });
    UI.Rest.sync();
    lastSig = null; tick();
  }

  function init() {
    bar = document.createElement('div');
    bar.className = 'live-bar';
    bar.innerHTML = `<span class="lb-dot"></span><div class="lb-t"><b data-t></b><small class="num" data-s></small></div><button class="lb-btn">${icon('play', 'sm')}Abrir</button>`;
    bar.addEventListener('click', () => { Native.vibrate(12); open(); });
    document.body.appendChild(bar);
    setInterval(tick, 1000);
    setTimeout(pull, 600);
    tick();
  }
  const Native = UI.Native;

  window.Live = { init, tick, pull, open, focus: null, active, nextSet, phrase };
})();
