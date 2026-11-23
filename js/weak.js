// Pontos fracos (aprovado em 22/11): o app olha as últimas 6 semanas e acha o que está para trás —
// músculo com poucas séries, desequilíbrio empurrar × puxar ou quadríceps × posterior, levantamento com nível
// de força abaixo dos outros e exercício sem evoluir. A pessoa escolhe até 2 e o app reforça:
// "Ajustar meu plano" (mais séries no ponto fraco, feito no começo do treino) ou "Plano novo de 6 semanas".
// Base: mais séries semanais (10–20 por músculo) geram mais crescimento; o músculo treinado primeiro rende mais.
(function () {
  'use strict';
  const { icon, esc, toast, push, pop, refresh, sheet, closeSheet } = UI;
  const S = () => Store.state;
  const WEEKS = 6;
  const MAIN = ['peitoral', 'ombros', 'dorsais', 'meio', 'quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'biceps', 'triceps'];
  // Região → padrões de exercício do js/goals.js (o primeiro é o preferido).
  const POOL = { peitoral: ['pushH'], ombros: ['delts', 'pushV'], dorsais: ['pullV'], meio: ['pullH'], quadriceps: ['quadIso', 'squat'], posteriores: ['hamIso', 'hinge'],
    gluteos: ['hipthrust'], panturrilhas: ['calves'], biceps: ['biceps'], triceps: ['triceps'], trapezio: ['pullH'], abdomen: ['core'] };
  const LIFT = { supino: 'peitoral', agachamento: 'quadriceps', terra: 'posteriores', desenvolvimento: 'ombros', barra: 'dorsais' };
  const NOME = (id) => (Analytics.REGIONS.find((g) => g.id === id) || {}).nome || id;
  const nf = (n, d) => UI.nf ? UI.nf(n, d) : String(Math.round(n * 10) / 10).replace('.', ',');

  // ---------- análise ----------
  function range() { const to = Store.iso(Store.today()), from = Store.iso(Store.addDays(Store.today(), -7 * WEEKS)); return { from, to }; }
  function enoughData() { const { from } = range(); return S().sessions.filter((s) => s.date >= from && s.sets.some((x) => x.done)).length >= 4; }
  function analyze() {
    const { from, to } = range(), out = [];
    const sets = Analytics.setsByRegion(from, to);
    // 1) músculo com poucas séries (média semanal abaixo do mínimo)
    MAIN.forEach((r) => {
      const avg = sets[r] / WEEKS, alvo = Analytics.target(r);
      if (avg < alvo[0] * 0.8) out.push({ id: 'v-' + r, regions: [r], score: 1 - avg / alvo[0], titulo: NOME(r),
        texto: avg < 0.5 ? `<em>${avg < 0.25 ? '0' : nf(avg, 1)} séries</em> por semana nas últimas ${WEEKS} semanas.` : `Média de <em>${nf(avg, 1)} séries por semana</em> (meta ${alvo[0]}–${alvo[1]}).` });
    });
    // 2) equilíbrio
    Analytics.balanceDone(from, to).forEach((p) => {
      if (!p.off) return;
      const weakSide = p.off === 'a' ? 'b' : 'a', ratio = p.off === 'a' ? p.A / Math.max(1, p.B) : p.B / Math.max(1, p.A);
      const regs = p.id === 'pp' ? (weakSide === 'b' ? ['dorsais', 'meio'] : ['peitoral']) : (weakSide === 'b' ? ['posteriores'] : ['quadriceps']);
      const nomeFraco = weakSide === 'b' ? p.b : p.a, nomeForte = weakSide === 'b' ? p.a : p.b;
      out.push({ id: 'b-' + p.id, regions: regs, score: Math.min(1, ratio / 3) + 0.2, titulo: nomeFraco + (p.id === 'pp' && weakSide === 'b' ? ' (costas)' : ''),
        texto: `${esc(nomeForte)} recebe <em>${nf(ratio, 1)}× mais</em> séries. Ideal: até ${nf(p.max, 1)}×.` });
    });
    // 3) nível de força abaixo dos outros levantamentos
    const stg = Analytics.strength(), have = stg.lifts.filter((l) => l.idx != null);
    if (have.length >= 3) {
      const mean = have.reduce((a, l) => a + l.idx, 0) / have.length;
      have.filter((l) => l.idx < mean - 0.7).forEach((l) => out.push({ id: 's-' + l.key, regions: [LIFT[l.key]], score: (mean - l.idx) / 2, titulo: l.nome,
        texto: `Nível <em>${esc(l.level)}</em>; seus outros levantamentos estão mais adiante.` }));
    }
    // 4) exercício sem evoluir no plano ativo
    Store.stalledExercises().slice(0, 3).forEach((id) => {
      const ex = Store.exercise(id), reg = Object.keys(Analytics.musclesOf(ex)).find((k) => Analytics.musclesOf(ex)[k] === 1);
      if (reg) out.push({ id: 'e-' + id, regions: [reg], exId: id, score: 0.35, titulo: ex.nome, texto: '<em>Sem evoluir</em> nos últimos 4 treinos (mesma carga e repetições).' });
    });
    // Sem repetir região; mais importante primeiro.
    const seen = new Set();
    return out.sort((a, b) => b.score - a.score).filter((f) => { const k = f.regions.join(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
  }

  // ---------- montar as mudanças ----------
  const regionOf = (ex) => { const m = Analytics.musclesOf(ex); return Object.keys(m).filter((k) => m[k] === 1); };
  function used(exId) { return S().sessions.some((s) => s.sets.some((x) => x.exId === exId && x.done)); }
  function candidates(region, plan) {
    const inPlan = new Set(plan.workouts.flatMap((w) => w.items.map((it) => it.exId)));
    const ids = [...new Set((POOL[region] || []).flatMap((p) => Goals.POOLS[p] || []))].filter((id) => {
      const e = Store.exercise(id); if (!e || e.tipo === 'tempo' || inPlan.has(id)) return false;
      if (Store.available && !Store.available(id)) return false;
      return regionOf(e).includes(region);
    });
    return ids.sort((a, b) => (used(b) ? 1 : 0) - (used(a) ? 1 : 0));
  }
  // Devolve { plan (cópia alterada), changes: [{w, kind, exId, txt}], before, after }.
  function propose(plan, picks, extra) {
    const p = JSON.parse(JSON.stringify(plan)), changes = [];
    const want = extra || 6;
    const before = Analytics.plannedByRegion(plan);
    picks.forEach((f) => {
      f.regions.slice(0, 2).forEach((region, ri) => {
        let need = Math.max(4, Math.min(want, Math.round(Analytics.target(region)[0] + 2 - before[region])));
        if (ri) need = Math.ceil(need / 2);
        const hitW = p.workouts.filter((w) => w.items.some((it) => regionOf(Store.exercise(it.exId)).includes(region)));
        // Sem treino que já trabalhe o músculo: usa os treinos da mesma metade do corpo (pernas ou tronco).
        const LOWR = ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas'], low = LOWR.includes(region);
        const halfW = p.workouts.filter((w) => w.items.some((it) => !it.blk && regionOf(Store.exercise(it.exId)).some((k) => LOWR.includes(k) === low)));
        const ws = (hitW.length ? hitW : halfW.length ? halfW : p.workouts.slice().sort((a, b) => a.items.length - b.items.length)).slice(0, 2);
        ws.forEach((w) => {
          if (need <= 0) return;
          const times = Math.max(1, (w.days || []).length);
          // exercício sem evoluir: vai para o começo do treino com +1 série
          const exist = w.items.find((it) => (f.exId ? it.exId === f.exId : regionOf(Store.exercise(it.exId)).includes(region)) && !it.blk);
          if (exist && f.exId) {
            exist.sets = Math.min(6, Number(exist.sets) + 1); w.items = [exist].concat(w.items.filter((x) => x !== exist));
            changes.push({ w: w.name, letter: w.letter, kind: 'move', exId: exist.exId, txt: `${Number(exist.sets) - 1} → ${exist.sets} séries · passa para o 1º` }); need -= times;
            return;
          }
          const cand = candidates(region, p);
          if (cand.length) {
            const it = { id: Store.uid('i'), exId: cand[0], sets: 3, reps: '10-12', kg: 0, rest: 90, note: '', tech: null, group: null, weak: true };
            const firstReal = w.items.findIndex((x) => !x.blk);
            w.items.splice(firstReal < 0 ? w.items.length : firstReal, 0, it);
            changes.push({ w: w.name, letter: w.letter, kind: 'add', exId: cand[0], txt: '3 × 10–12 · antes dos outros exercícios' }); need -= 3 * times;
          } else if (exist) {
            exist.sets = Math.min(6, Number(exist.sets) + 1);
            changes.push({ w: w.name, letter: w.letter, kind: 'set', exId: exist.exId, txt: `${Number(exist.sets) - 1} → ${exist.sets} séries` }); need -= times;
          }
        });
      });
    });
    const after = Analytics.plannedByRegion(p);
    const regs = [...new Set(picks.flatMap((f) => f.regions))];
    const mins = changes.filter((c) => c.kind === 'add').length * 6 + changes.filter((c) => c.kind !== 'add').length * 2;
    return { plan: p, changes, before, after, regs, mins: Math.round(mins / Math.max(1, plan.workouts.length)) };
  }

  // ---------- telas ----------
  const topbar = (t) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${t}</h1></div>`;
  function WeakScreen() {
    const finds = analyze(), sel = new Set(finds.slice(0, 2).map((f) => f.id));
    let mode = 'ajustar', manual = null;
    const ck = icon('check', 'sm');
    const it = (f) => `<button class="wk-it press ${sel.has(f.id) ? 'on' : ''}" data-a="tog" data-id="${f.id}"><span class="ck">${sel.has(f.id) ? ck : ''}</span><span class="grow"><b>${esc(f.titulo)}</b><small>${f.texto}</small></span></button>`;
    return {
      hideNav: true,
      render: () => {
        const all = finds.concat(manual ? [manual] : []);
        return topbar('Pontos fracos') + `<div class="content">
        ${enoughData() ? `<div class="rh-intro">Olhei suas <b>últimas ${WEEKS} semanas</b> de treino. Escolha até 2 pontos para reforçar.</div>` : `<div class="rh-intro">Ainda há poucos treinos registrados para eu achar seus pontos fracos com segurança. Treine 2 semanas ou escolha você mesmo o músculo.</div>`}
        <div class="wk-list">${all.length ? all.map(it).join('') : '<div class="small muted" style="padding:6px 2px">Nada muito para trás no momento. Bom equilíbrio! Se quiser, escolha um músculo.</div>'}</div>
        <button class="link" style="margin:12px 2px 0" data-a="pick">+ Escolher outro músculo</button>
        <div class="caps" style="margin:18px 2px 8px">Como reforçar?</div>
        <div class="rh-opt"><button class="press ${mode === 'ajustar' ? 'on' : ''}" data-a="mode" data-v="ajustar"><b>Ajustar meu plano atual</b><small>Mais séries nos pontos fracos, feitos no começo do treino. O resto continua igual.</small><em>Recomendado</em></button>
        <button class="press ${mode === 'novo' ? 'on' : ''}" data-a="mode" data-v="novo"><b>Plano novo de 6 semanas</b><small>Especialização: pontos fracos 2× por semana com mais volume; o resto em manutenção.</small></button></div>
        <button class="btn lime block" style="margin-top:16px" data-a="go">Ver as mudanças</button></div>`;
      },
      actions: {
        back: pop,
        tog: (ds) => { if (sel.has(ds.id)) sel.delete(ds.id); else { if (sel.size >= 2) { toast('Escolha no máximo 2'); return; } sel.add(ds.id); } refresh(); },
        mode: (ds) => { mode = ds.v; refresh(); },
        pick: () => sheet({
          render: () => `<h3>Qual músculo?</h3><div class="filters wrap">${MAIN.map((r) => `<button class="filter" data-a="m" data-v="${r}">${esc(NOME(r))}</button>`).join('')}</div>`,
          actions: { m: (ds) => { manual = { id: 'm-' + ds.v, regions: [ds.v], score: 1, titulo: NOME(ds.v), texto: 'Escolhido por você.' }; if (sel.size >= 2) sel.delete([...sel][0]); sel.add(manual.id); closeSheet(); refresh(); } },
        }),
        go: () => {
          const all = finds.concat(manual ? [manual] : []), picks = all.filter((f) => sel.has(f.id));
          if (!picks.length) { toast('Escolha pelo menos 1 ponto'); return; }
          let base = Store.activePlan();
          if (mode === 'novo' || !base) {
            const days = base ? Math.max(3, Math.min(5, new Set(base.workouts.flatMap((w) => w.days)).size)) : 4;
            const exp = ((S().settings.profile || {}).exp || '').toLowerCase();
            const level = /inic/.test(exp) ? 'iniciante' : /avan/.test(exp) ? 'avancado' : 'intermediario';
            base = Goals.buildPlan({ primary: 'hipertrofia', secondary: null, days, level, equip: 'academia' });
            base.name = 'Pontos fracos · 6 semanas'; base.goal = 'Especialização: ' + [...new Set(picks.map((f) => f.titulo))].join(' e '); base.weeks = 6; base.isNew = true;
          }
          push(Preview(base, picks, mode === 'novo' ? 10 : 6));
        },
      },
    };
  }

  function Preview(base, picks, extra) {
    const pr = propose(base, picks, extra), isNew = !!base.isNew;
    const row = (c) => { const ex = Store.exercise(c.exId); return `<div class="rh-row">${UI.thumb(ex)}<span class="grow"><b>${esc(ex.nome)}</b><small>${esc(c.txt)}</small></span><span class="wk-add">${c.kind === 'add' ? 'NOVO' : '+1'}</span></div>`; };
    const byW = {}; pr.changes.forEach((c) => { (byW[c.letter + ' · ' + c.w] = byW[c.letter + ' · ' + c.w] || []).push(c); });
    return {
      hideNav: true,
      render: () => topbar(isNew ? 'Plano novo' : 'Mudanças no plano') + `<div class="content">
        <div class="rh-intro">${isNew ? `<b>${esc(pr.plan.name)}</b>: ${pr.plan.workouts.length} treinos por semana, com os pontos fracos reforçados.` : `Plano <b>${esc(base.name)}</b>. Os pontos fracos entram no começo do treino, quando você está descansado.`}</div>
        ${Object.keys(byW).length ? Object.keys(byW).map((k) => `<div class="caps" style="margin:12px 2px 4px">Treino ${esc(k)}</div>${byW[k].map(row).join('')}`).join('') : '<div class="small muted">Não encontrei exercícios para acrescentar. Tente escolher outro ponto.</div>'}
        <div class="caps" style="margin:16px 2px 6px">Séries por semana</div>
        <table class="wk-tbl">${pr.regs.map((r) => `<tr><td>${esc(NOME(r))}</td><td class="n">${nf(pr.before[r], 0)} → <span class="up">${nf(pr.after[r], 0)}</span></td></tr>`).join('')}
        ${isNew ? '' : `<tr><td>Tempo a mais por treino</td><td class="n">~${pr.mins} min</td></tr>`}</table>
        <div class="rh-src">Por quê: mais séries semanais (10 a 20 por músculo) geram mais crescimento, e o músculo treinado primeiro rende mais. Em ${WEEKS} semanas o app reavalia e te mostra o resultado.</div>
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="back">Ajustar</button><button class="btn lime" data-a="apply">${isNew ? 'Criar e usar' : 'Aplicar no plano'}</button></div></div>`,
      actions: {
        back: pop,
        apply: () => {
          const p = pr.plan;
          if (isNew) { delete p.isNew; p.id = Store.uid('p'); p.startDate = Store.iso(Store.weekStartOf(Store.today(), S().settings.weekStart)); S().plans.push(p); S().activePlanId = p.id; }
          else { const i = S().plans.findIndex((x) => x.id === base.id); S().plans[i] = p; }
          S().weak = { at: Date.now(), regions: pr.regs, before: pr.regs.map((r) => [r, Analytics.setsByRegion(range().from, range().to)[r] / WEEKS]), planId: p.id };
          Store.save(); if (window.Rehab) Rehab.sync();
          toast(isNew ? 'Plano criado e ativado' : 'Plano ajustado'); pop(); pop();
        },
      },
    };
  }

  // Reavaliação: 6 semanas depois do ajuste, um cartão na tela inicial.
  function homeCard() {
    const w = S().weak; if (!w || w.seen || Date.now() - w.at < WEEKS * 7 * Store.DAY) return '';
    const now = Analytics.setsByRegion(range().from, range().to);
    const txt = w.before.map(([r, b]) => `${NOME(r)}: ${nf(b, 1)} → ${nf(now[r] / WEEKS, 1)} séries/semana`).join(' · ');
    return `<div class="card rh-card ok appear"><b>${icon('trophy', 'sm')} ${WEEKS} semanas reforçando os pontos fracos</b><small>${esc(txt)}. Quer ver os pontos fracos de agora?</small><div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="wkSeen">Fechar</button><button class="btn lime sm" data-a="wkOpen">Ver agora</button></div></div>`;
  }
  function seen() { if (S().weak) { S().weak.seen = true; Store.save(); } }

  // Lado mais fraco: nos unilaterais, um lado 10% ou mais atrás nos 3 últimos treinos.
  function weakSide(exId) {
    const h = Store.exerciseHistory(exId).slice(-3);
    if (h.length < 3) return null;
    const per = h.map((x) => { const L = x.sets.filter((y) => y.repsR != null && y.repsL != null && !y.sub); if (!L.length) return null; const R = L.reduce((a, y) => a + y.repsR, 0), E = L.reduce((a, y) => a + y.repsL, 0); return { R, E }; });
    if (per.some((x) => !x || !x.R || !x.E)) return null;
    const right = per.every((x) => x.R <= x.E * 0.9), left = per.every((x) => x.E <= x.R * 0.9);
    if (!right && !left) return null;
    const pct = Math.round((1 - per.reduce((a, x) => a + (left ? x.E / x.R : x.R / x.E), 0) / 3) * 100);
    return { side: left ? 'esquerdo' : 'direito', pct };
  }

  window.Weak = { candidates, analyze, propose, WeakScreen, homeCard, seen, weakSide };
})();
