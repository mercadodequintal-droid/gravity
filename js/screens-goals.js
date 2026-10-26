// Montar plano por objetivo e testes de desempenho.
(function () {
  'use strict';
  const { icon, esc, nf, shortDate, toast, push, pop, popTo, refresh, sheet, closeSheet, switchTab } = UI;
  const S = () => Store.state;
  const topbar = (title, right) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${title}</h1>${right || ''}</div>`;
  const EVID = { Forte: 'done', Moderada: 'blue', Promissora: 'partial' };

  // ====================== MONTAR POR OBJETIVO ======================
  function GoalWizard() {
    const o = { primary: 'hipertrofia', secondary: null, days: 3, level: 'intermediario', equip: 'academia' };
    let showWhy = false;
    const opt = (a, val, on, label) => `<button class="filter ${on ? 'on' : ''}" data-a="${a}" data-v="${val}">${label}</button>`;
    return {
      hideNav: true,
      render() {
        const g = Goals.goal(o.primary), g2 = o.secondary ? Goals.goal(o.secondary) : null;
        const plan = Goals.buildPlan(o);
        return topbar('Montar por objetivo') + `<div class="content">
          <div class="small muted" style="margin:0 2px 12px">Escolha o objetivo e o app monta o plano seguindo o que a ciência e o treino de atletas mostram. Depois você pode editar tudo.</div>
          <div class="section-title" style="margin-top:4px"><h2>1. Objetivo principal</h2></div>
          <div class="goal-grid">${Goals.GOALS.map((x) => `<button class="card goal press ${x.id === o.primary ? 'on' : ''}" data-a="prim" data-v="${x.id}"><b>${esc(x.nome)}</b><span>${esc(x.curto)}</span></button>`).join('')}</div>
          <div class="card goal-info"><div class="row"><b class="grow">${esc(g.nome)}</b><span class="chip ${EVID[g.evid]}">Evidência ${g.evid.toLowerCase()}</span></div>
            <div class="small" style="margin-top:8px;color:var(--gold-2)">${esc(g.regra)}</div>
            ${showWhy ? `<div class="small muted" style="margin-top:8px">${esc(g.ciencia)}</div>` : ''}
            <button class="link" style="margin-top:8px" data-a="why">${showWhy ? 'Esconder' : 'Por que funciona?'}</button></div>
          <div class="section-title"><h2>2. Objetivo extra</h2><span class="small muted">opcional</span></div>
          <div class="filters wrap">${opt('sec', '', !o.secondary, 'Nenhum')}${Goals.GOALS.filter((x) => x.id !== o.primary).map((x) => opt('sec', x.id, o.secondary === x.id, x.nome)).join('')}</div>
          ${g2 ? `<div class="tiny muted" style="margin:6px 2px 0">Acrescenta ao treino: ${esc(g2.regra.split(' · ')[0])}.</div>` : ''}
          <div class="section-title"><h2>3. Dias por semana</h2></div>
          <div class="seg">${[2, 3, 4, 5, 6].map((n) => `<button class="${o.days === n ? 'on' : ''}" data-a="days" data-v="${n}">${n}</button>`).join('')}</div>
          <div class="section-title"><h2>4. Nível</h2></div>
          <div class="seg">${Goals.LEVELS.map(([k, l]) => `<button class="${o.level === k ? 'on' : ''}" data-a="lvl" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="section-title"><h2>5. Onde vai treinar</h2></div>
          <div class="seg">${Goals.EQUIPS.map(([k, l]) => `<button class="${o.equip === k ? 'on' : ''}" data-a="eq" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="section-title"><h2>Seu plano</h2><span class="small muted">${plan.workouts.length} treinos · ${plan.weeks} semanas</span></div>
          <div class="list">${plan.workouts.map((w) => `<div class="card goal-wo"><div class="row"><div class="letter">${esc(w.letter)}</div><div class="grow"><h4>${esc(w.name)}</h4><div class="meta">${Screens.daysText(w.days)} · ${w.items.length} exercícios · ~${Screens.estMinutes(w)} min</div></div></div>
            <ol>${w.items.map((it) => { const ex = Store.exercise(it.exId); return `<li><span class="grow ellipsis">${it.group ? '<i class="gdot"></i>' : ''}${esc(ex.nome)}</span><span class="num muted">${Tools.repsText(it, ex)}</span></li>`; }).join('')}</ol></div>`).join('')}</div>
          ${o.level === 'iniciante' ? '<div class="card small muted" style="margin-top:12px">' + icon('info', 'sm') + ' Iniciante: menos séries e exercícios mais simples (sem saltos em profundidade e levantamentos olímpicos). Aprenda a técnica com carga leve nas 2 primeiras semanas.</div>' : ''}
          ${g.tests.length || g.e1rm ? `<div class="card small muted" style="margin-top:12px">${icon('target', 'sm')} Para medir a evolução: ${g.tests.map((t) => esc(Goals.test(t).nome.toLowerCase())).concat(g.e1rm ? ['1RM estimado (Recordes)'] : []).join(', ')}. Faça os testes agora e repita no fim do plano.</div>` : ''}
          <button class="btn lime block" style="margin-top:16px" data-a="create">Criar e usar este plano</button></div>`;
      },
      actions: {
        back: pop,
        prim: (ds) => { o.primary = ds.v; if (o.secondary === ds.v) o.secondary = null; showWhy = false; refresh(); },
        sec: (ds) => { o.secondary = ds.v || null; refresh(); },
        days: (ds) => { o.days = Number(ds.v); refresh(); },
        lvl: (ds) => { o.level = ds.v; refresh(); },
        eq: (ds) => { o.equip = ds.v; refresh(); },
        why: () => { showWhy = !showWhy; refresh(); },
        create: () => {
          const p = Goals.buildPlan(o);
          S().plans.push(p); S().activePlanId = p.id; Store.save();
          toast('Plano criado e ativado');
          pop();
        },
      },
    };
  }

  // ====================== TESTES DE DESEMPENHO ======================
  function testSheet(id, done) {
    const t = Goals.test(id);
    let raw = '';
    sheet({
      render: () => `<h3>${esc(t.nome)}</h3><div class="desc">${esc(t.how)}</div>
        <div class="field"><label>Resultado (${t.un === 'tempo' ? 'min:seg' : t.un})</label><input class="input num" ${t.un === 'tempo' ? 'inputmode="numeric" placeholder="ex.: 25:30"' : 'type="number" inputmode="decimal" step="0.01" placeholder="–"'} data-in="v"></div>
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
      after: (el) => { const i = el.querySelector('input'); setTimeout(() => i && i.focus(), 250); },
      actions: {
        no: closeSheet,
        v: (ds, el) => { raw = el.value; },
        ok: () => {
          const v = Goals.parseVal(t, raw);
          if (isNaN(v) || v <= 0) { toast(t.un === 'tempo' ? 'Use o formato min:seg, ex.: 25:30' : 'Digite um número'); return; }
          const prev = Goals.results(id), best = prev.length ? (t.up ? Math.max(...prev.map((r) => r.v)) : Math.min(...prev.map((r) => r.v))) : null;
          Goals.addResult(id, v); closeSheet();
          if (best != null && (t.up ? v > best : v < best)) UI.prBurst('Melhor marca', t.nome + ': ' + Goals.fmtVal(t, v));
          else toast('Resultado salvo');
          done && done();
        },
      },
    });
  }
  function testCard(t, open) {
    const r = Goals.results(t.id), last = r[r.length - 1], first = r[0];
    let delta = '';
    if (r.length >= 2) {
      const d = last.v - first.v, better = t.up ? d > 0 : d < 0;
      const pct = first.v ? Math.abs(d / first.v) * 100 : 0;
      delta = d ? `<span class="chip ${better ? 'done' : 'late'}">${better ? '▲' : '▼'} ${nf(pct, 1)}%</span>` : '';
    }
    return `<div class="card test press" data-a="open" data-id="${t.id}"><div class="row"><div class="grow"><b>${esc(t.nome)}</b><div class="small muted">${last ? 'Último: ' + Goals.fmtVal(t, last.v) + ' · ' + shortDate(last.date) : 'Ainda não registrado'}</div></div>${delta}<button class="icon-btn" data-a="add" data-id="${t.id}">${icon('plus', 'sm')}</button></div>
      ${open ? `<div class="small muted" style="margin-top:10px">${esc(t.how)}</div>${r.length >= 2 ? Screens.lineChart(r.slice(-12).map((x) => ({ label: shortDate(x.date), v: x.v })), { color: 'var(--blue)', h: 130 }) : ''}
        ${r.length ? `<div style="margin-top:6px">${r.slice().reverse().slice(0, 6).map((x) => `<div class="kv"><span>${shortDate(x.date)}</span><span class="num">${Goals.fmtVal(t, x.v)}</span></div>`).join('')}</div>` : ''}` : ''}</div>`;
  }
  function Tests() {
    let opened = null;
    return {
      hideNav: true,
      render() {
        const sug = Goals.suggestedTests(), others = Goals.TESTS.filter((t) => !sug.includes(t.id));
        const p = Store.activePlan();
        return topbar('Testes') + `<div class="content">
          <div class="small muted" style="margin:0 2px 12px">Faça os testes no começo do plano e repita a cada 4–8 semanas, sempre do mesmo jeito e descansado. É o jeito mais honesto de saber se o treino está funcionando.</div>
          ${sug.length ? `<div class="section-title" style="margin-top:4px"><h2>Para o seu objetivo</h2><span class="small muted ellipsis">${esc(p.name)}</span></div><div class="list">${sug.map((id) => testCard(Goals.test(id), opened === id)).join('')}</div>` : ''}
          <div class="section-title"><h2>${sug.length ? 'Outros testes' : 'Testes'}</h2></div>
          <div class="list">${others.map((t) => testCard(t, opened === t.id)).join('')}</div>
          <div class="card small muted" style="margin-top:12px">${icon('trophy', 'sm')} A força máxima (1RM) é estimada pelas suas séries e aparece em Recordes. <button class="link" data-a="records">Ver recordes</button></div></div>`;
      },
      actions: {
        back: pop,
        open: (ds, el, e) => { if (e.target.closest('[data-a="add"]')) return; opened = opened === ds.id ? null : ds.id; refresh(); },
        add: (ds) => testSheet(ds.id, refresh),
        records: () => push(Screens.Records()),
      },
    };
  }

  Object.assign(window.Screens, { GoalWizard, Tests, testSheet });
})();
