// Ferramentas rápidas usadas no meio do treino: anilhas, aquecimento, troca de exercício,
// nota fixa e cronômetro de execução. Cada uma é uma folha simples, com no máximo dois toques.
(function () {
  'use strict';
  const { icon, esc, nf, kg, secs, ring, Native, toast, sheet, closeSheet, sheetRefresh } = UI;
  const S = () => Store.state;

  // "3 × 10", "4 × 12-10-8-6" ou, para exercício por tempo, "3 × 30 s".
  // Tempo de cardio em minutos: 1800 → "30 min", 1530 → "25:30 min".
  const minText = (s) => (s % 60 === 0 ? s / 60 + ' min' : UI.secs(s) + ' min');
  // Texto da carga. Peso do corpo: "Peso do corpo", "Corpo + 10 kg" (lastro) ou "Corpo − 15 kg" (ajuda).
  function loadText(kg, ex) {
    const k = Number(kg) || 0;
    if (Store.isBodyweight(ex)) return !k ? 'Peso do corpo' : 'Corpo ' + (k > 0 ? '+ ' : '− ') + UI.kg(Math.abs(k));
    return k ? UI.kg(k) : '';
  }
  // Mesma ideia, falada.
  function loadSpoken(kg, ex) {
    const k = Number(kg) || 0;
    if (Store.isBodyweight(ex)) return !k ? '' : (k > 0 ? 'mais ' : 'menos ') + Voice.kg(Math.abs(k));
    return k ? Voice.kg(k) : '';
  }
  function repsText(it, ex) {
    if (Store.isCardio(ex)) return (it.sets > 1 ? it.sets + ' × ' : '') + minText(Number(it.reps) || 1200);
    if (ex && ex.tipo === 'tempo') return `${it.sets} × ${UI.restLabel(Number(it.reps) || 30)}`;
    return `${it.sets} × ${esc(it.reps)}`;
  }

  // ---------- anilhas ----------
  const PCOLOR = { 25: '#c8574b', 20: '#4c7dd9', 15: '#d9b25f', 10: '#5aa469', 5: '#e8e2d4', 2.5: '#8a8478', 1.25: '#6a655c' };
  // Desenho das anilhas de um lado da barra + texto, para a carga digitada.
  function platesHTML(total) {
    const bar = Number(S().settings.bar) || 20;
    if (!(total > 0)) return '';
    const p = Analytics.plates(total, bar);
    if (total <= bar) return `<div class="plates"><div class="small muted">Só a barra (${nf(bar)} kg)</div></div>`;
    const draw = p.side.map((w) => `<i style="height:${28 + w * 1.6}px;background:${PCOLOR[w]}" title="${nf(w)}"></i>`).join('');
    return `<div class="plates"><div class="plates-bar"><span class="sleeve"></span>${draw}<span class="collar"></span></div>
      <div class="small"><b style="color:var(--gold-2)">Por lado:</b> ${p.side.map((w) => nf(w, 2)).join(' + ') || '—'} <span class="faint">· barra ${nf(bar)} kg</span></div>
      ${p.resto ? `<div class="tiny" style="color:var(--amber)">Faltam ${nf(p.resto)} kg que não fecham com as anilhas comuns.</div>` : ''}</div>`;
  }

  // ---------- aquecimento (v0.45: % da carga e anilhas desenhadas por lado) ----------
  function platesMini(total, bar) {
    const p = Analytics.plates(total, bar);
    if (!p.side.length) return '';
    return `<div class="fx-pl"><span class="bar"></span>${p.side.map((w) => `<i style="height:${12 + w}px;background:${PCOLOR[w]}"></i>`).join('')}</div>`;
  }
  function warmupSheet(s, item, done) {
    const exId = Store.exOf(s, item), ex = Store.exercise(exId);
    const first = s.sets.find((x) => x.itemId === item.id && !x.sub && !x.done) || s.sets.find((x) => x.itemId === item.id && !x.sub);
    const work = first ? Number(first.kg) : Number(item.kg) || 0, wreps = first ? first.reps : item.reps;
    const bar = Number(S().settings.bar) || 20;
    const list = Analytics.warmup(work, ex.equip, bar);
    if (!list.length) { toast('Carga leve: pode ir direto para a série'); return; }
    const isBar = /barra|smith/i.test(ex.equip || '');
    const sub = (k) => { if (!isBar) return ''; const p = Analytics.plates(k, bar); return p.side.length ? 'por lado: ' + p.side.map((x) => nf(x, 2)).join(' + ') : 'só a barra'; };
    const step = (k, reps, pc, work) => `<div class="fx-step ${work ? 'work' : ''}"><span class="pc">${pc}%</span><div class="g"><b class="num">${nf(k)} kg × ${esc(reps)}</b><small>${work ? 'série de trabalho' + (sub(k) ? ' · ' + sub(k) : '') : sub(k) || '&nbsp;'}</small></div>${isBar ? platesMini(k, bar) : ''}</div>`;
    sheet({
      render: () => `<h3>Aquecimento</h3><div class="desc">Para chegar em <b>${kg(work)}</b> no ${esc(ex.nome)} sem gastar energia. Descanse 30 a 60 s entre elas.</div>
        <div class="fx-steps">${list.map((w) => step(w.kg, w.reps, Math.round(w.kg / work * 100), false)).join('')}${step(work, wreps, 100, true)}</div>
        <div class="fx-btns wide"><button class="btn ghost" data-a="no">Fechar</button><button class="btn lime pl-create" data-a="add">Adicionar ${list.length} ${list.length === 1 ? 'série' : 'séries'}</button></div>`,
      actions: {
        no: closeSheet,
        add: () => { Store.addWarmups(s, item, list); closeSheet(); toast(list.length + ' séries de aquecimento adicionadas'); done && done(); },
      },
    });
  }

  // ---------- troca de exercício ----------
  // Sugere exercícios que trabalham os mesmos músculos, com outro equipamento primeiro.
  function swapCandidates(exId) {
    const ex = Store.exercise(exId), mine = Analytics.musclesOf(ex);
    const main = Object.keys(mine).filter((k) => mine[k] === 1);
    return Store.allExercises().filter((e) => e.id !== exId && Store.available(e) && (e.tipo === 'tempo') === (ex.tipo === 'tempo')).map((e) => {
      const m = Analytics.musclesOf(e);
      let score = 0;
      main.forEach((k) => { if (m[k] === 1) score += 3; else if (m[k]) score += 1; });
      if (e.grupo === ex.grupo) score += 2;
      if (e.equip && e.equip !== ex.equip) score += 0.5;
      return { e, score };
    }).filter((c) => c.score >= 3).sort((a, b) => b.score - a.score).slice(0, 8).map((c) => c.e);
  }
  // v0.45: busca, selo "Mais parecido" no primeiro, grupo e aparelho; chave "Trocar também no plano" no fim.
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function swapSheet(s, item, done) {
    const exId = Store.exOf(s, item);
    const list = swapCandidates(exId);
    let forever = false, q = '';
    const row = (e, best) => `<button class="fx-sw press ${best ? 'best' : ''}" data-a="pick" data-id="${e.id}">${UI.thumb(e)}<div class="g"><b class="ellipsis">${esc(e.nome)}</b><div class="fx-tags">${best ? '<span class="g">Mais parecido</span>' : ''}<span>${esc(e.grupo)}</span>${e.equip ? `<span>${esc(e.equip.split(/[ ,/]/)[0])}</span>` : ''}</div></div>${icon('next', 'sm')}</button>`;
    const results = () => {
      if (!q.trim()) return list.map((e, i) => row(e, i === 0)).join('') || '<div class="card small muted">Nenhum equivalente na biblioteca.</div>';
      const t = norm(q);
      const r = Store.allExercises().filter((e) => e.id !== exId && Store.available(e) && norm(e.nome).includes(t)).slice(0, 12);
      return r.map((e) => row(e, false)).join('') || '<div class="card small muted">Nada encontrado.</div>';
    };
    sheet({
      render: () => `<h3>Trocar exercício</h3><div class="desc">Aparelho ocupado? Estes trabalham os mesmos músculos de <b>${esc(Store.exercise(exId).nome)}</b>.</div>
        <label class="fx-search">${icon('search', 'sm')}<input type="search" placeholder="Buscar outro exercício" value="${esc(q)}" data-in="q"></label>
        <div id="swList">${results()}</div>
        ${exId !== item.exId ? `<button class="btn ghost block sm" style="margin-top:8px" data-a="undo">Voltar para ${esc(Store.exercise(item.exId).nome)}</button>` : ''}
        <div class="switch-row" data-a="forever" style="padding:8px 0 0"><div class="grow">Trocar também no plano<div class="small muted">Desligado: só no treino de hoje</div></div><div class="switch ${forever ? 'on' : ''}"></div></div>`,
      actions: {
        q: (ds, el) => { q = el.value; const box = document.getElementById('swList'); if (box) box.innerHTML = results(); },
        forever: () => { forever = !forever; const sw = document.querySelector('.sheet [data-a="forever"] .switch'); if (sw) sw.classList.toggle('on', forever); },
        pick: (ds) => { Store.swapExercise(s, item, ds.id, forever); closeSheet(); toast('Trocado por ' + Store.exercise(ds.id).nome + (forever ? ' (no plano também)' : ' (só hoje)')); done && done(); },
        undo: () => { Store.swapExercise(s, item, item.exId, false); closeSheet(); done && done(); },
      },
    });
  }

  // ---------- nota fixa do exercício (ajuste do banco, pegada…) ----------
  const pinOf = (exId) => ((S().exMeta[exId] || {}).nota || '').trim();
  // v0.45: sugestões com um toque. As que têm "_" deixam o cursor no lugar do número.
  const PIN_SUG = ['Banco no furo _', 'Assento na altura _', 'Pino no _', 'Pegada aberta', 'Pegada fechada', 'Usar cinto', 'Pés no banco'];
  function pinSheet(exId, done) {
    sheet({
      render: () => `<h3>Nota fixa</h3><div class="desc">Aparece sempre neste exercício, em todos os treinos.</div>
        <textarea class="note-field" id="pinTxt" style="min-height:80px" placeholder="Ajustes do aparelho, pegada, observações…">${esc(pinOf(exId))}</textarea>
        <div class="fx-chipsel">${PIN_SUG.map((t, i) => `<button data-a="sug" data-i="${i}">${esc(t)}</button>`).join('')}</div>
        <div class="small muted" style="margin-top:8px">Toque numa sugestão para completar mais rápido.</div>
        <div class="fx-btns"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime pl-create" data-a="ok">Salvar</button></div>`,
      after: (el) => setTimeout(() => { const t = el.querySelector('#pinTxt'); if (t && !t.value) t.focus(); }, 350),
      actions: {
        no: closeSheet,
        sug: (ds, el) => {
          const t = document.getElementById('pinTxt'), sug = PIN_SUG[Number(ds.i)], blank = sug.indexOf('_');
          const base = t.value.trim(), sep = base ? (/[.,;]$/.test(base) ? ' ' : ', ') : '';
          const txt = blank >= 0 ? sug.slice(0, blank) : sug;
          t.value = base + sep + (base ? txt.charAt(0).toLowerCase() + txt.slice(1) : txt);
          el.classList.add('on'); Native.vibrate(6);
          t.focus(); const end = t.value.length; t.setSelectionRange(end, end);
        },
        ok: () => { const v = document.getElementById('pinTxt').value.trim(); S().exMeta[exId] = Object.assign(S().exMeta[exId] || {}, { nota: v }); Store.save(); closeSheet(); toast(v ? 'Nota salva' : 'Nota removida'); done && done(); },
      },
    });
  }

  // ---------- cronômetro de execução (prancha, isometria, cardio) ----------
  function timeSheet(total, label, onDone) {
    let start = Date.now(), paused = 0, pausedAt = 0, tick = null, finished = false;
    const cd = {};
    const left = () => Math.max(0, total - ((pausedAt || Date.now()) - start - paused) / 1000);
    const finish = (secsDone) => {
      if (finished) return; finished = true; clearInterval(tick);
      Native.pattern([0, 700]); UI.beep('go');
      if (secsDone >= total) Voice.say('Acabou!', 'conta', Store.state.settings.sound ? 850 : 0);
      closeSheet(); onDone(secsDone);
    };
    const def = {
      render: () => `<h3 style="text-align:center">${esc(label)}</h3><div class="desc" style="text-align:center">Mantenha a posição até o fim</div>
        <div class="big-ring" data-exec>${ring(230, 14, 1, 'var(--lime)', `<b class="num">${UI.clock(left() * 1000 + 999)}</b><span>de ${secs(total)}</span>`)}</div>
        <div class="btn-row"><button class="btn ghost" data-a="pause">${pausedAt ? 'Continuar' : 'Pausar'}</button><button class="btn lime" data-a="done">Concluir agora</button></div>`,
      after: () => {
        clearInterval(tick);
        tick = setInterval(() => {
          const box = document.querySelector('[data-exec]'); if (!box) { clearInterval(tick); return; }
          const l = left();
          box.querySelector('b').textContent = UI.clock(l * 1000 + 999);
          const br = box.querySelector('.bar'); const c = parseFloat(br.getAttribute('stroke-dasharray')); br.setAttribute('stroke-dashoffset', c * (1 - l / total));
          if (l <= 0 && !pausedAt) finish(total);
          else if (!pausedAt && total >= 4) UI.countdown(cd, l);
          if (!pausedAt && total >= 40 && !cd.half && l <= total / 2) { cd.half = true; Voice.say('Metade', 'dez'); }
          if (!pausedAt && total >= 30 && !cd.ten && l <= 10) { cd.ten = true; Voice.say('Faltam 10 segundos', 'dez'); }
        }, 250);
      },
      onClose: () => clearInterval(tick),
      actions: {
        pause: () => { if (pausedAt) { paused += Date.now() - pausedAt; pausedAt = 0; } else pausedAt = Date.now(); sheetRefresh(); },
        done: () => finish(Math.max(1, Math.round(total - left()))),
      },
    };
    sheet(def);
  }

  // ---------- porcentagens do 1RM ----------
  // Base: 1RM estimado das suas melhores séries. Repetições máximas aproximadas pela fórmula de Epley.
  const PCTS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];
  const SCHEMES = [['Força', '5×5', 80], ['Hipertrofia', '3×8', 72.5], ['Hipertrofia', '3×12', 67.5], ['Resistência', '2×15', 60]];
  const repsAt = (p) => (p >= 100 ? 1 : Math.max(1, Math.round(30 * (100 / p - 1))));
  function roundKg(ex, kg) { const st = /barra|smith/i.test((ex && ex.equip) || '') ? 2.5 : 0.5; return Math.round(kg / st) * st; }
  function oneRM(exId) { const ex = Store.exercise(exId); if (!ex || ex.tipo === 'tempo' || Store.isBodyweight(ex)) return 0; return Analytics.bestOf(exId).e1rm || 0; }
  function pctTable(exId) {
    const rm = oneRM(exId), ex = Store.exercise(exId);
    if (!rm) return '';
    return `<div class="card pct-card"><div class="row"><div class="caps grow">Porcentagens do 1RM</div><span class="small muted">1RM estimado: <b class="gold">${UI.nf(Math.round(rm))} kg</b></span></div>
      <div class="pct-schemes">${SCHEMES.map(([n, sr, p]) => `<div><small>${n}</small><b>${sr}</b><span>${UI.nf(roundKg(ex, rm * p / 100))} kg · ${String(p).replace('.', ',')}%</span></div>`).join('')}</div>
      <div class="pct-grid"><span class="h">%</span><span class="h">Carga</span><span class="h">Reps máx.</span>${PCTS.map((p) => `<span class="p">${p}%</span><span class="num">${UI.nf(roundKg(ex, rm * p / 100))} kg</span><span class="muted">~${repsAt(p)}</span>`).join('')}</div>
      <div class="tiny faint" style="margin-top:8px">Valores aproximados. Use como ponto de partida e ajuste pela sensação da série.</div></div>`;
  }
  // Atalhos na hora de digitar a carga: toca e preenche.
  function pctChips(exId) {
    const rm = oneRM(exId), ex = Store.exercise(exId);
    if (!rm) return '';
    return `<div class="caps" style="margin:14px 2px 6px">% do 1RM (${UI.nf(Math.round(rm))} kg)</div><div class="pct-chips">${[90, 85, 80, 75, 70, 65, 60].map((p) => { const k = roundKg(ex, rm * p / 100); return `<button data-a="numSet" data-v="${k}"><b>${p}%</b>${UI.nf(k)}</button>`; }).join('')}</div>`;
  }

  window.Tools = { pctTable, pctChips, minText, loadText, loadSpoken, repsText, platesHTML, warmupSheet, swapSheet, swapCandidates, pinOf, pinSheet, timeSheet };
})();
