// Telas de treino: Minha semana, Treino, Execução (player) e finalização.
(function () {
  'use strict';
  const { icon, esc, nf, kg, restLabel, clock, volume, imgHTML, thumb, ring, Native, toast, push, pop, popTo, sheet, closeSheet, sheetRefresh, numberSheet, Rest } = UI;

  const STATUS = {
    done: { label: 'Feito', cls: 'done' },
    partial: { label: 'Incompleto', cls: 'partial' },
    pending: { label: 'Pendente', cls: 'pending' },
    late: { label: 'Atrasado', cls: 'late' },
  };
  const daysText = (days) => (days && days.length ? days.map((d) => Store.WEEKDAYS[d]).join(', ') : 'Sem dia fixo');
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  function statusChip(st) {
    const m = STATUS[st.status];
    let txt = m.label;
    if (st.status === 'partial') txt += ' · ' + st.p.complete + '/' + st.p.total;
    if (st.status === 'done' && st.session) txt += ' · ' + Store.WEEKDAYS[Store.parseISO(st.session.date).getDay()].toLowerCase();
    return `<span class="chip ${m.cls}"><span class="dot"></span>${txt}</span>`;
  }

  // Sessão "atual" de um treino: a que está em andamento, ou a incompleta desta semana.
  function currentSession(w) {
    const S = Store.state;
    const act = S.activeSessionId && Store.session(S.activeSessionId);
    if (act && act.workoutId === w.id && !act.finished) return act;
    const st = Store.workoutStatus(w);
    return st.status === 'partial' ? st.session : null;
  }

  // ====================== MINHA SEMANA ======================
  // Frases do dia (a parte em <em> fica em destaque).
  const QUOTES = [
    'A disciplina de hoje é <em>a força de amanhã.</em>',
    'Ninguém vê o treino. <em>Todos veem o resultado.</em>',
    'Constância vence <em>intensidade.</em>',
    'Faça mesmo sem vontade. <em>Principalmente sem vontade.</em>',
    'O peso não fica mais leve. <em>Você fica mais forte.</em>',
    'Um treino de cada vez. <em>Uma semana de cada vez.</em>',
    'O corpo alcança o que <em>a mente sustenta.</em>',
    'Desculpas não <em>levantam peso.</em>',
    'Quem treina no silêncio <em>colhe no espelho.</em>',
    'Feito é melhor <em>que perfeito.</em>',
  ];
  const quoteOfDay = () => { const t = Store.today(); const doy = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / Store.DAY); return QUOTES[doy % QUOTES.length]; };

  // Logo do Gravity em vetor: bateria em tom champanhe com barras de progresso.
  // Logo do Gravity no círculo da tela inicial e no botão Treinar (desenho em js/logo.js).
  function emblem(size) {
    return Logo.svg({ style: `width:${Math.round(size * 1.25)}px;height:auto;overflow:visible` });
  }

  // Treinos concluídos por completo (para nível e sequência).
  function completedSessions() { return Store.state.sessions.filter((s) => { const p = Store.sessionProgress(s); return p.total && p.complete >= p.total; }); }
  function weekStreak(p) {
    if (!p || !p.workouts.length) return 0;
    const weeks = Store.weeksBack(52);
    const full = (w) => p.workouts.every((wo) => Store.workoutStatus(wo, w).status === 'done');
    let n = full(weeks[weeks.length - 1]) ? 1 : 0;
    for (let i = weeks.length - 2; i >= 0 && full(weeks[i]); i--) n++;
    return n;
  }

  function Home() {
    return {
      render() {
        const S = Store.state, p = Store.activePlan(), range = Store.weekRange(), t = Store.today();
        const done_ = completedSessions();
        const level = 1 + Math.floor(done_.length / 10);
        const head = `<div class="topbar"><span class="icon-btn plain" style="visibility:hidden"></span><h1 style="text-align:center;letter-spacing:7px;padding-left:7px;color:var(--gold-2);font-family:var(--display);font-size:17px;font-weight:400">Gravity</h1><button class="icon-btn plain" data-a="settings" aria-label="Configurações">${icon('gear')}</button></div>`;
        const who = `<div class="row appear" style="margin:2px 2px 16px"><button class="emblem-ring avatar press" style="width:50px;height:50px;margin:0" data-a="avatar" aria-label="Foto do perfil">${Profile.avatarHTML(30)}</button>
          <div class="grow"><div class="caps" style="font-size:10px">${greeting()}</div><div class="display" style="font-size:20px;letter-spacing:3px;text-transform:uppercase">${esc(S.settings.name || 'Atleta')}</div></div><button class="level" style="margin:0" data-a="medals">Nível ${level}</button></div>`;
        if (!p) {
          return head + `<div class="content">${who}<div class="card empty appear"><div class="ic">${icon('plans', 'lg')}</div><h3>Nenhum plano ativo</h3><p>Escolha um modelo pronto ou monte o seu plano de treino.</p><button class="btn lime" data-a="plans">Ver planos</button></div></div>`;
        }
        const list = p.workouts.map((w) => ({ w, st: Store.workoutStatus(w, range) }));
        const done = list.filter((x) => x.st.status === 'done').length;
        const partial = list.filter((x) => x.st.status === 'partial').length;
        const late = list.filter((x) => x.st.status === 'late').length;
        const pend = list.length - done - partial;
        const pct = list.length ? Math.round(((done + list.filter((x) => x.st.status === 'partial').reduce((a, x) => a + x.st.p.ratio, 0)) / list.length) * 100) : 0;
        const wk = Store.planWeek(p);
        const ws = S.sessions.filter((s) => s.date >= range.startISO && s.date <= range.endISO);
        const setsW = ws.reduce((a, s) => a + s.sets.filter((x) => x.done).length, 0);

        const overall = `<div class="card appear"><div class="caps" style="margin-bottom:14px">Progresso da semana</div><div class="overall">
          ${ring(118, 7, pct / 100, 'gold', `<b class="num">${pct}%</b><span>concluído</span>`)}
          <div class="legend-list"><div class="li"><i></i><span>Feitos</span><b>${done}/${list.length}</b></div>
          <div class="li"><i style="background:var(--amber)"></i><span>Incompletos</span><b>${partial}</b></div>
          <div class="li"><i style="background:${late ? 'var(--red)' : 'var(--text-3)'}"></i><span>${late ? 'Atrasados' : 'Pendentes'}</span><b>${late || pend}</b></div>
          <div class="li"><i style="background:var(--gold-3)"></i><span>Séries</span><b>${setsW}</b></div></div></div></div>`;

        // Chamada principal com a frase do dia
        const dow = t.getDay();
        const act = S.activeSessionId && Store.session(S.activeSessionId);
        const actW = act && !act.finished && Store.findWorkout(act.workoutId);
        let cta;
        const todays = list.filter((x) => x.w.days.includes(dow));
        const next = todays.find((x) => x.st.status !== 'done');
        const any = list.find((x) => x.st.status === 'partial' || x.st.status === 'late') || list.find((x) => x.st.status === 'pending');
        if (actW) cta = { k: 'Treino em andamento', w: actW.workout, btn: 'Continuar treino', a: 'resume', id: act.id };
        else if (next) cta = { k: 'Treino de hoje', w: next.w, btn: next.st.status === 'partial' ? 'Continuar treino' : 'Entrar no treino', a: 'open', id: next.w.id };
        else if (!todays.length && any) cta = { k: 'Dia livre · adiantar?', w: any.w, btn: 'Abrir treino', a: 'open', id: any.w.id };
        const ex0 = cta && cta.w.items[0] && Store.exercise(cta.w.items[0].exId);
        const bg = ex0 && ex0.img && ex0.img[0] ? `<div class="bgimg" style="background-image:url('${ex0.img[0]}')"></div>` : '';
        const quoteCard = `<div class="card quote-card appear">${bg}<div class="shade"></div><div class="halo"></div><div class="in">
          <div class="qmark">“</div><div class="quote">${quoteOfDay()}</div>
          <div class="quote-by">${cta ? '— ' + esc(cta.k) + ' · Treino ' + esc(cta.w.letter) + ' · ' + esc(cta.w.name) : todays.length ? '— Treino de hoje concluído' : '— Semana completa. Descanse.'}</div>
          ${cta ? `<button class="btn lime block" style="margin-top:18px;justify-content:space-between;padding:0 10px 0 22px" data-a="${cta.a}" data-id="${cta.id}">${cta.btn}<span class="arrow" style="margin-right:0">${icon('play', 'sm')}</span></button>` : ''}</div></div>`;

        // Agenda: treinos da semana com caixa de seleção
        const order = (w) => (w.days.length ? (w.days[0] - S.settings.weekStart + 7) % 7 : 9);
        const rows = list.slice().sort((a, b) => order(a.w) - order(b.w)).map(({ w, st }) => {
          const isToday = w.days.includes(dow);
          const sub = st.status === 'done' ? 'Concluído' : st.status === 'partial' ? 'Incompleto · ' + st.p.complete + ' de ' + st.p.total : st.status === 'late' ? 'Atrasado' : w.items.length + ' exercícios';
          return `<div class="srow press ${isToday ? 'today' : ''}" data-a="open" data-id="${w.id}"><span class="chk ${STATUS[st.status].cls}">${st.status === 'done' ? icon('check') : ''}</span>
            <div class="nm ellipsis">Treino ${esc(w.letter)} · ${esc(w.name)}<small>${sub}</small></div><div class="tm">${isToday ? '<span class="gold">HOJE</span>' : w.days.map((d) => Store.WEEKDAYS[d].toUpperCase()).join(' ') || '—'}</div></div>`;
        }).join('');
        const sched = `<div class="card sched appear"><div class="row" style="margin-bottom:8px"><div class="caps grow">Agenda da semana</div><button class="small muted" data-a="editPlan">Editar</button></div>${rows}</div>`;

        // Sequência e plano (missão)
        const streak = weekStreak(p);
        const drop = `<svg class="drop" viewBox="0 0 100 100"><defs><radialGradient id="dg" cx=".38" cy=".62" r=".7"><stop offset="0" stop-color="var(--gold-2)"/><stop offset=".35" stop-color="var(--gold)"/><stop offset=".75" stop-color="var(--gold-3)"/><stop offset="1" stop-color="#2a1f0c"/></radialGradient><radialGradient id="dgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="var(--gold)" stop-opacity=".45"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="62" r="46" fill="url(#dgl)"/><path d="M50 12C40 34 28 46 28 62a22 22 0 0 0 44 0C72 46 60 34 50 12z" fill="url(#dg)"/><ellipse cx="42" cy="58" rx="5" ry="9" fill="#fff8e0" opacity=".55"/></svg>`;
        const streakCard = `<div class="card streak appear"><div><div class="caps">Sequência</div><div class="v num">${streak}</div><div class="u">${streak === 1 ? 'semana completa' : 'semanas completas'}</div></div>${drop}</div>`;
        const total = Math.max(1, p.weeks), cur = Math.max(0, Math.min(total, wk.n));
        const ppct = Math.round((Math.max(0, cur - 1) + pct / 100) / total * 100);
        const steps = [];
        const maxSteps = 6;
        const first = total <= maxSteps ? 1 : Math.max(1, Math.min(total - maxSteps + 1, cur - 2));
        for (let i = first; i < first + Math.min(total, maxSteps); i++) steps.push(`<div class="st ${i < cur ? 'past' : i === cur ? 'cur' : ''}"><div class="dot">${i < cur ? icon('check', 'sm') : i}</div><div class="lb">Sem ${i}</div></div>`);
        const mission = `<div class="card mission appear" data-a="editPlan"><div class="caps">Plano atual</div>
          <div class="row" style="margin-top:6px"><div class="display grow ellipsis" style="font-size:21px;letter-spacing:1.5px;text-transform:uppercase">${esc(p.name)}</div><span class="display gold" style="font-size:17px">${Math.min(100, ppct)}%</span></div>
          <div class="bar"><i style="width:${Math.min(100, ppct)}%"></i></div>
          <div class="roadmap">${steps.join('')}</div>
          <div class="small muted" style="margin-top:12px;text-align:center">${wk.n < 1 ? 'O plano começa em breve' : wk.n > wk.total ? 'Duração concluída. Repita ou troque de plano.' : 'Semana ' + wk.n + ' de ' + wk.total}</div></div>`;

        const vol = ws.reduce((a, s) => a + Store.sessionVolume(s), 0);
        const mins = ws.reduce((a, s) => a + (s.end ? Store.sessionDuration(s) : 0), 0);
        const tiles = `<div class="tiles">
          <div class="card tile"><div class="ic">${icon('weight', 'sm')}</div><div class="v num">${volume(vol)}</div><div class="l">Volume</div></div>
          <div class="card tile"><div class="ic">${icon('layers', 'sm')}</div><div class="v num">${setsW}</div><div class="l">Séries</div></div>
          <div class="card tile"><div class="ic">${icon('clock', 'sm')}</div><div class="v num">${mins}<small>min</small></div><div class="l">Tempo</div></div></div>`;

        // Semana leve: proposta ou em andamento.
        const dl = Store.deloadActive(), dp = !dl && Store.deloadProposal();
        const deloadCard = dl ? `<div class="card deload-card appear"><div class="row"><span class="dl-ic">${icon('sparkle', 'sm')}</span><div class="grow"><b>Semana leve em andamento</b><small>Até ${dl.end.split('-').reverse().slice(0, 2).join('/')} · menos séries e 10% menos carga</small></div><button class="small muted" data-a="deloadEnd">Encerrar</button></div></div>`
          : dp ? `<div class="card deload-card appear"><div class="row" style="align-items:flex-start"><span class="dl-ic">${icon('sparkle', 'sm')}</span><div class="grow"><b>Hora de uma semana leve?</b><small>${dp.hard ? 'Muitas séries no limite nas últimas 2 semanas' : dp.weeks + ' semanas seguidas de treino'}. Uma semana com ~60% das séries e 10% menos carga ajuda o corpo a recuperar e voltar mais forte.</small></div></div>
            <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="deloadNo">Agora não</button><button class="btn lime sm" data-a="deloadYes">Fazer semana leve</button></div></div>` : '';
        return head + `<div class="content">${who}${overall}${deloadCard}${quoteCard}${sched}${Screens.muscleCard()}${Screens.strengthCard()}${streakCard}${mission}
          <div class="section-title"><h2>Esta semana</h2><button class="link" data-a="progress">Ver evolução</button></div>${tiles}</div>`;
      },
      actions: {
        settings: () => push(Screens.Settings()),
        plans: () => UI.switchTab('plans'),
        progress: () => UI.switchTab('progress'),
        muscles: () => push(Screens.MuscleMap()),
        medals: () => push(Screens.Medals()),
        avatar: () => Profile.sheet(UI.refresh),
        editPlan: () => push(Screens.PlanEditor(Store.activePlan().id)),
        pwOpen: () => UI.switchTab('progress'),
        pwWeight: () => Screens.measureSheet(() => UI.refresh()),
        deloadYes: () => { Store.startDeload(); toast('Semana leve ativada por 7 dias'); UI.refresh(); },
        deloadNo: () => { Store.snoozeDeload(); toast('Tudo bem. Pergunto de novo em uma semana.'); UI.refresh(); },
        deloadEnd: () => { Store.endDeload(); toast('Semana leve encerrada'); UI.refresh(); },
        open: (ds) => push(WorkoutScreen(ds.id)),
        resume: (ds) => { const s = Store.session(ds.id); push(Player(s.id, firstOpenIndex(s))); },
      },
    };
  }

  // Botão central da barra: vai direto para o treino que faz sentido agora.
  function trainNow() {
    const S = Store.state, p = Store.activePlan();
    const act = S.activeSessionId && Store.session(S.activeSessionId);
    if (act && !act.finished && Store.findWorkout(act.workoutId)) { push(Player(act.id, firstOpenIndex(act))); return; }
    if (!p || !p.workouts.length) { UI.switchTab('plans'); toast('Escolha um plano para começar'); return; }
    const dow = Store.today().getDay();
    const list = p.workouts.map((w) => ({ w, st: Store.workoutStatus(w) }));
    const pick = list.find((x) => x.w.days.includes(dow) && x.st.status !== 'done') || list.find((x) => x.st.status === 'partial') || list.find((x) => x.st.status === 'late') || list.find((x) => x.st.status === 'pending');
    if (!pick) { pickWorkout(null, 'Semana completa! Treinar mesmo assim?'); return; }
    push(WorkoutScreen(pick.w.id));
  }

  // Chips de técnica e de grupo para listas de exercícios.
  function techChips(items, i) {
    const g = TECH.groupOf(items, i), it = items[i];
    const parts = [];
    if (g) parts.push(`<span class="chip blue tchip">${icon('repeat', 'sm')}${esc(g.tech.nome)} ${g.pos}/${g.size}</span>`);
    if (it.tech && TECH.get(it.tech.id)) parts.push(`<span class="chip blue tchip">${icon('flame', 'sm')}${esc(TECH.chip(it))}</span>`);
    return parts.length ? `<div class="chip-row" style="margin-top:6px;gap:5px">${parts.join('')}</div>` : '';
  }

  function estMinutes(w) {
    return Math.max(10, Math.round(w.items.reduce((a, it) => a + (Store.isCardio(it.exId) ? it.sets * (Number(it.reps) || 1200) : it.sets * ((Number(it.rest) || 60) + 45)), 0) / 60));
  }
  function firstOpenIndex(s) {
    const fw = Store.findWorkout(s.workoutId);
    const i = fw.workout.items.findIndex((it) => !Store.itemProgress(s, it).complete && !(s.skipped || []).includes(it.id));
    return i < 0 ? 0 : i;
  }

  // ====================== TREINO (visão geral) ======================
  function WorkoutScreen(wid) {
    const def = {
      hideNav: true,
      render() {
        const fw = Store.findWorkout(wid);
        if (!fw) return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>Treino</h1></div><div class="content"><div class="empty">Treino não encontrado.</div></div>`;
        const w = fw.workout, st = Store.workoutStatus(w), cur = currentSession(w);
        const s = cur || (st.status === 'done' ? st.session : null);
        def.footer = true;
        const rows = w.items.map((it, i) => {
          const ex = Store.exercise(it.exId);
          const pr = s ? Store.itemProgress(s, it) : null;
          const dots = s ? `<div class="dots">${s.sets.filter((x) => x.itemId === it.id).map((x) => `<i class="${x.done ? 'on' : ''}"></i>`).join('')}</div>` : '';
          return `<div class="card ex-row press appear" data-a="item" data-i="${i}">${thumb(ex)}<div class="grow"><h4 class="ellipsis">${esc(ex.nome)}</h4>
            <div class="meta">${Tools.repsText(it, ex)}${Tools.loadText(it.kg, ex) ? ' · ' + Tools.loadText(it.kg, ex) : ''}${Store.isCardio(ex) ? '' : ' · ' + restLabel(it.rest)}</div>${techChips(w.items, i)}${dots}</div>
            <div class="state ${pr && pr.complete ? 'done' : ''}">${pr && pr.complete ? icon('check', 'sm') : '<span class="tiny num">' + (i + 1) + '</span>'}</div></div>`;
        }).join('');
        let footer;
        if (cur) {
          const pr = Store.sessionProgress(cur);
          footer = `<button class="btn lime" data-a="continue">Continuar (${pr.complete}/${pr.total})<span class="arrow">${icon('arrow', 'sm')}</span></button>`;
        } else if (st.status === 'done') {
          footer = `<button class="btn ghost" data-a="summary">Ver resumo</button><button class="btn lime" data-a="start">${icon('repeat', 'sm')}Treinar de novo</button>`;
        } else {
          footer = `<button class="btn lime" data-a="start">Começar treino<span class="arrow">${icon('play', 'sm')}</span></button>`;
        }
        return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>Treino ${esc(w.letter)}</h1><button class="icon-btn" data-a="edit">${icon('edit', 'sm')}</button></div>
          <div class="content"><div class="row appear" style="margin:4px 0 6px;gap:14px"><div class="letter ${STATUS[st.status].cls}" style="width:64px;height:64px;font-size:28px;border-radius:20px">${esc(w.letter)}</div>
          <div class="grow"><div style="font-size:22px;font-weight:700;letter-spacing:-.3px">${esc(w.name)}</div><div class="small muted">${daysText(w.days)} · ${w.items.length} exercícios · ~${estMinutes(w)} min</div></div></div>
          <div style="margin:10px 0 14px">${statusChip(st)}</div>
          ${!cur && w.items.length && estMinutes(w) > 25 ? `<button class="quick-link" data-a="quick">${icon('timer', 'sm')}Pouco tempo hoje?</button>` : ''}
          ${!cur && fw.plan.workouts.length > 1 ? `<button class="switch-w press" data-a="switchW">${icon('repeat', 'sm')}<span class="grow"><b>Trocar de treino</b><small>Fazer outro treino do plano hoje</small></span>${icon('next', 'sm')}</button>` : ''}
          <div class="list">${rows || '<div class="card empty">Nenhum exercício. Toque no lápis para montar o treino.</div>'}</div></div>
          <div class="footer">${footer}</div>`;
      },
      actions: {
        back: pop,
        edit: () => { const fw = Store.findWorkout(wid); push(Screens.WorkoutEditor(fw.plan.id, wid)); },
        switchW: () => pickWorkout(wid),
        start: () => {
          const fw = Store.findWorkout(wid);
          if (!fw.workout.items.length) { toast('Adicione exercícios primeiro'); return; }
          beginWorkout(wid, null);
        },
        quick: () => quickSheet(wid),
        continue: () => { const s = currentSession(Store.findWorkout(wid).workout); s.finished = false; Store.state.activeSessionId = s.id; Store.save(); push(Player(s.id, firstOpenIndex(s))); },
        summary: () => { const st = Store.workoutStatus(Store.findWorkout(wid).workout); push(Screens.SessionDetail(st.session.id)); },
        item: (ds) => {
          const w = Store.findWorkout(wid).workout, cur = currentSession(w);
          if (cur) push(Player(cur.id, Number(ds.i)));
          else push(Screens.ExerciseDetail(w.items[Number(ds.i)].exId));
        },
      },
    };
    return def;
  }

  // Começa o treino: pergunta como a pessoa está (se ligado) e aplica treino rápido / dia aliviado.
  function beginWorkout(wid, quickMin) {
    const fw = Store.findWorkout(wid);
    const go = (c) => {
      const s = Store.startSession(wid);
      if (quickMin && !s.deload) Store.applyQuick(s, fw.workout, quickMin);
      if (c) Store.applyCheckin(s, c, fw.workout);
      push(Player(s.id, 0));
    };
    if (Store.state.settings.checkin && !Store.deloadActive()) checkinSheet(go); else go(null);
  }

  // Treino rápido: "quanto tempo você tem?" → encurta descanso e tira séries para caber.
  function quickSheet(wid) {
    const w = Store.findWorkout(wid).workout, full = estMinutes(w);
    const opts = [15, 20, 25, 30, 40, 50, 60].filter((m) => m < full - 4).slice(-4);
    sheet({
      render: () => `<h3>Pouco tempo hoje?</h3><div class="desc">O treino completo leva ~${full} min. Escolha quanto tempo você tem: o app encurta o descanso e tira algumas séries, mantendo todos os exercícios.</div>
        <div class="list">${opts.map((m) => { const q = Store.quickPlan(w, m); return `<button class="menu-item" data-a="go" data-m="${m}"><span class="ic num" style="font-family:var(--display);font-size:15px">${m}'</span><span class="grow">${m} minutos<div class="small muted">~${q.est} min · descanso ${Math.round(q.restF * 100)}%${q.cut ? ' · ' + q.cut + (q.cut === 1 ? ' série a menos' : ' séries a menos') : ''}${q.est > m + 2 ? ' · não coube todo' : ''}</div></span>${icon('play', 'sm')}</button>`; }).join('')}</div>`,
      actions: { go: (ds) => { closeSheet(); setTimeout(() => beginWorkout(wid, Number(ds.m)), 300); } },
    });
  }

  // Como você está hoje: sono, energia e dor antes de começar. Dia ruim → sugere aliviar o treino.
  function checkinSheet(go) {
    const c = { sono: 1, energia: 1, dor: 2 };
    const Q = [['sono', 'Sono', ['Ruim', 'Ok', 'Bom']], ['energia', 'Energia', ['Baixa', 'Ok', 'Alta']], ['dor', 'Dor ou cansaço muscular', ['Muita', 'Pouca', 'Nenhuma']]];
    sheet({
      render: () => {
        const lv = Store.checkinLevel(c);
        const tip = lv >= 2 ? '<b>Dia puxado.</b> Sugestão: 10% menos carga e uma série a menos nos exercícios com 3 ou mais.' : lv ? '<b>Dia mais pesado que o normal.</b> Sugestão: 10% menos carga hoje.' : '';
        return `<h3>Como você está hoje?</h3><div class="desc">Leva 3 toques. Se o dia estiver ruim, o app sugere aliviar o treino.</div>
          ${Q.map(([k, l, o]) => `<div class="field" style="margin-top:12px"><label>${l}</label><div class="seg">${o.map((t, v) => `<button class="${c[k] === v ? 'on' : ''}" data-a="v" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div></div>`).join('')}
          ${lv ? `<div class="suggest" style="margin-top:14px">${icon('sparkle', 'sm')}<span>${tip}</span></div>
            <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-a="normal">Treinar normal</button><button class="btn lime" data-a="adj">Aliviar hoje</button></div>`
          : `<button class="btn lime block" style="margin-top:16px" data-a="normal">Começar treino</button>`}
          <div class="row" style="justify-content:space-between;margin-top:12px"><button class="link small muted" data-a="skip">Pular</button><button class="link small muted" data-a="never">Não perguntar mais</button></div>`;
      },
      actions: {
        v: (ds) => { c[ds.k] = Number(ds.v); Native.vibrate(6); sheetRefresh(); },
        adj: () => { closeSheet(); go(c); },
        normal: () => { closeSheet(); go(Object.assign({}, c, { forceNormal: true })); },
        skip: () => { closeSheet(); go(null); },
        never: () => { Store.state.settings.checkin = false; Store.save(); closeSheet(); toast('Não vou mais perguntar. Dá para ligar de novo em Configurações.'); go(null); },
      },
    });
  }

  // Faixa de repetições completa: pergunta antes de aplicar (uma vez, sempre ou não).
  function rangeSheet(s, it, sg, done) {
    const ex = Store.exercise(it.exId);
    sheet({
      render: () => `<h3>Subir a carga?</h3><div class="desc">Na última vez você fez <b>${sg.hi} repetições</b> em todas as séries de ${esc(ex.nome)}, o topo da faixa ${sg.lo}–${sg.hi}. A ideia agora é subir para <b>${kg(sg.to)}</b> e voltar para <b>${sg.lo} repetições</b>, até chegar de novo em ${sg.hi}.</div>
        <div class="list">
          <button class="menu-item" data-a="once"><span class="ic">${icon('check', 'sm')}</span><span class="grow">Aplicar agora<div class="small muted">Só neste treino</div></span></button>
          <button class="menu-item" data-a="auto"><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Aplicar sempre, automaticamente<div class="small muted">Nos próximos treinos a carga sobe sozinha quando a faixa for completada</div></span></button>
          <button class="menu-item" data-a="no"><span class="ic">${icon('x', 'sm')}</span><span class="grow">Não aplicar<div class="small muted">Mantém a carga de hoje</div></span></button>
        </div><div class="tiny muted" style="margin-top:12px">Dá para mudar em Configurações → Progressão pela faixa de repetições.</div>`,
      actions: {
        once: () => { Store.applyRange(s, it, sg); Store.save(); closeSheet(); toast('Carga: ' + kg(sg.to) + ' × ' + sg.lo); done(); },
        auto: () => { Store.state.settings.rangeMode = 'auto'; Store.applyRange(s, it, sg); Store.save(); closeSheet(); toast('Pronto: a carga vai subir sozinha nas próximas vezes'); done(); },
        no: () => { s.rangeSkip = Object.assign({}, s.rangeSkip, { [it.id]: true }); Store.save(); closeSheet(); done(); },
      },
    });
  }

  // Exercício estagnado: o que fazer.
  function stallSheet(s, it, done) {
    const exId = Store.exOf(s, it), ex = Store.exercise(exId), st = Store.stallOf(exId, s.id);
    const RANGES = ['6-8', '8-12', '12-15'];
    const what = st && st.e1rm ? 'o 1RM estimado não passou de ' + kg(Math.round(st.base * 2) / 2) : 'as repetições não passaram de ' + (st ? st.base : '');
    sheet({
      render: () => `<h3>Exercício estagnado</h3><div class="desc">Nos últimos 3 treinos de <b>${esc(ex.nome)}</b>, ${what}. Algumas saídas:</div>
        <div class="list">
          <button class="menu-item" data-a="swap"><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Trocar a variação<div class="small muted">Outro exercício para o mesmo músculo</div></span></button>
          <div class="menu-item" style="cursor:default"><span class="ic">${icon('target', 'sm')}</span><span class="grow">Mudar a faixa de repetições<div class="small muted">Hoje: ${esc(it.reps)} · vale para o plano</div>
            <div class="seg" style="margin-top:8px">${RANGES.map((r) => `<button class="${String(it.reps) === r ? 'on' : ''}" data-a="range" data-v="${r}">${r.replace('-', '–')}</button>`).join('')}</div></span></div>
          <button class="menu-item" data-a="deload"><span class="ic">${icon('sparkle', 'sm')}</span><span class="grow">Fazer uma semana leve<div class="small muted">7 dias com menos séries e 10% menos carga</div></span></button>
          <button class="menu-item" data-a="ignore"><span class="ic">${icon('x', 'sm')}</span><span class="grow">Ignorar por agora<div class="small muted">Avisa de novo daqui a 3 treinos, se continuar igual</div></span></button>
        </div>`,
      actions: {
        swap: () => { closeSheet(); setTimeout(() => Tools.swapSheet(s, it, done), 380); },
        range: (ds) => { it.reps = ds.v; Store.save(); closeSheet(); toast('Faixa ' + ds.v.replace('-', '–') + ' salva no plano'); done(); },
        deload: () => { Store.startDeload(); closeSheet(); toast('Semana leve ativada: vale a partir do próximo treino'); done(); },
        ignore: () => { Store.snoozeStall(exId); closeSheet(); done(); },
      },
    });
  }

  // Escolher outro treino do plano (em vez do treino do dia).
  function pickWorkout(currentId, title) {
    const p = Store.activePlan(); if (!p) return;
    sheet({
      render: () => `<h3>${title || 'Trocar de treino'}</h3><div class="desc">Escolha o treino que você vai fazer agora.</div>
        <div class="list">${p.workouts.map((w) => { const st = Store.workoutStatus(w); return `<button class="menu-item ${w.id === currentId ? 'on' : ''}" data-a="pick" data-id="${w.id}"><span class="letter ${STATUS[st.status].cls}" style="width:38px;height:38px;font-size:17px;border-radius:12px;flex:none">${esc(w.letter)}</span><span class="grow">${esc(w.name)}<div class="small muted">${w.items.length} exercícios · ${STATUS[st.status].label || ''}${w.id === currentId ? ' · aberto agora' : ''}</div></span>${icon('next', 'sm')}</button>`; }).join('')}</div>`,
      actions: {
        pick: (ds) => { closeSheet(); if (ds.id === currentId) return; setTimeout(() => (currentId ? UI.replace(WorkoutScreen(ds.id), 1) : push(WorkoutScreen(ds.id))), 300); },
      },
    });
  }

  // ====================== EXECUÇÃO (player) ======================
  // Esforço da série em palavras. Guardado como "reps que sobraram" (RIR) para a sugestão de carga.
  const EFFORT = [
    { v: 0, nome: 'No limite', desc: 'não saía mais nenhuma', short: 'no limite' },
    { v: 1, nome: 'Pesado', desc: 'saía mais 1 ou 2', short: 'pesado' },
    { v: 3, nome: 'Tranquilo', desc: 'saía mais 3 ou +', short: 'tranquilo' },
  ];
  const feelOf = (rir) => (rir >= 3 ? EFFORT[2] : rir >= 1 ? EFFORT[1] : EFFORT[0]);

  function Player(sid, startIdx) {
    let idx = startIdx || 0, elapsedT = null, scrollT = null, rirFor = null, rirT = null;
    const ctx = () => { const s = Store.session(sid); const fw = Store.findWorkout(s.workoutId); return { s, w: fw.workout, items: fw.workout.items }; };
    const exIdOf = (s, it) => Store.exOf(s, it);

    function segs() {
      const { s, items } = ctx();
      return items.map((it, i) => {
        const c = Store.itemProgress(s, it).complete;
        return `<i data-a="go" data-i="${i}" style="flex:1;height:6px;border-radius:3px;background:${c ? 'var(--lime)' : i === idx ? 'var(--text)' : 'rgba(var(--fg-rgb),.12)'};transition:background .3s"></i>`;
      }).join('');
    }

    // Linha de série. Séries extras (drop, mini, aquecimento…) aparecem recuadas, com o nome da etapa.
    // Exercício por tempo: a coluna de repetições vira segundos e o botão vira "iniciar".
    function setRow(x, last, uni) {
      const prev = !x.sub && last && (last[x.n - 1] || null);
      const bw = Store.isBodyweight(x.exId);
      // Peso do corpo: 0 mostra "Corpo"; o resto é o que se soma (+) ou tira (−) do corpo.
      const kgVal = (k) => (bw ? (!Number(k) ? 'Corpo' : (k > 0 ? '+' : '−') + nf(Math.abs(k))) : nf(k));
      const kgSmall = x.sub ? esc(x.label) : prev ? 'ant. ' + kgVal(prev.kg) : bw ? (Number(x.kg) < 0 ? 'kg ajuda' : Number(x.kg) > 0 ? 'kg extra' : 'peso') : 'kg';
      const cardio = x.time && Store.isCardio(x.exId);
      const repSmall = x.rir != null ? feelOf(x.rir).short : x.target ? 'alvo ' + x.target : cardio ? 'min' : x.time ? 'seg' : x.sub ? 'reps' : prev ? 'ant. ' + prev.reps : 'reps';
      let val = cardio ? (x.reps % 60 === 0 ? x.reps / 60 : UI.secs(x.reps)) : x.time ? UI.secs(x.reps) : x.reps;
      // Unilateral: "D 10 / E 9". O +/− muda os dois lados; tocar no número ajusta cada lado.
      const sides = uni && !x.time;
      if (sides) val = `<span class="sd">D</span>${Store.sideR(x)}<span class="sl">/</span><span class="sd">E</span>${Store.sideL(x)}`;
      const btn = x.time && !x.done ? `<button class="check play" data-a="play" data-set="${x.id}">${icon('play')}</button>` : `<button class="check" data-a="toggle" data-set="${x.id}">${icon('check')}</button>`;
      const row = `<div class="set ${x.done ? 'done' : ''} ${x.sub ? 'sub' : ''} ${x.warm ? 'warm' : ''}" data-set="${x.id}"><span class="n num">${x.sub ? icon(x.warm ? 'flame' : 'next', 'sm') : x.n}</span>
        <div class="stepper"><button data-a="kgm" data-set="${x.id}">${icon('minus', 'sm')}</button><div class="val" data-a="kgEdit" data-set="${x.id}"><b class="num">${kgVal(x.kg)}</b><small>${kgSmall}</small></div><button data-a="kgp" data-set="${x.id}">${icon('plus', 'sm')}</button></div>
        <div class="stepper"><button data-a="rm" data-set="${x.id}">${icon('minus', 'sm')}</button><div class="val ${sides ? 'uni' : ''}" data-a="rEdit" data-set="${x.id}"><b class="num">${val}</b><small>${sides && !x.rir && !x.target ? 'cada lado' : repSmall}</small></div><button data-a="rp" data-set="${x.id}">${icon('plus', 'sm')}</button></div>
        ${btn}</div>`;
      // Pergunta rápida de esforço logo após concluir (some sozinha).
      const pick = x.id === rirFor ? `<div class="rir-pick"><span>Como foi essa série?</span><div class="rir-opts">${EFFORT.map((f) => `<button data-a="rir" data-set="${x.id}" data-v="${f.v}"><b>${f.nome}</b><small>${f.desc}</small></button>`).join('')}</div></div>` : '';
      return row + pick;
    }

    function pageHTML(i) {
      const { s, items } = ctx();
      const it = items[i], exId = exIdOf(s, it), ex = Store.exercise(exId);
      const swapped = exId !== it.exId;
      const sets = s.sets.filter((x) => x.itemId === it.id);
      const pr = Store.itemProgress(s, it);
      const last = Store.lastSetsFor(exId, s.id);
      const sug = Store.loadSuggestion(it, s.id, exId);
      const sugTxt = sug && (sug.why === 'range' ? `Você fez ${sug.hi} repetições em todas as séries (faixa ${sug.lo}–${sug.hi}). <b>Subir para ${kg(sug.to)} e voltar para ${sug.lo}?</b>`
        : sug.why === 'rir' ? `Na última vez as séries foram tranquilas. <b>Subir para ${kg(sug.to)}?</b>` : `Você completou tudo nas 2 últimas vezes. <b>Subir para ${kg(sug.to)}?</b>`);
      const sugHTML = sug && !s.deload && !(s.rangeSkip || {})[it.id] && sets.some((x) => !x.done && !x.warm && x.kg < sug.to) ? `<button class="suggest" data-a="applySug" data-i="${i}" data-kg="${sug.to}" style="width:100%;text-align:left">${icon('sparkle', 'sm')}<span>${sugTxt}</span></button>` : '';
      const lastHTML = last ? `<div class="small faint" style="margin-top:10px">Última vez: ${last.map((x) => (x.time ? UI.secs(x.reps) : x.repsR != null && x.repsR !== x.repsL ? nf(x.kg) + '×' + x.repsR + '/' + x.repsL : Store.isBodyweight(x.exId) ? (Number(x.kg) ? (x.kg > 0 ? '+' : '−') + nf(Math.abs(x.kg)) + '×' : '') + x.reps : nf(x.kg) + '×' + x.reps)).join(' · ')}</div>` : '';
      const pin = Tools.pinOf(exId);
      const live = !s.finished && Store.state.activeSessionId === s.id;
      const stall = live && !s.deload && !pr.complete && Store.stallOf(exId, s.id);
      const stallHTML = stall ? `<button class="suggest warn" data-a="stall" data-i="${i}" style="width:100%;text-align:left">${icon('info', 'sm')}<span><b>3 treinos sem evoluir neste exercício.</b> Toque para ver o que fazer.</span></button>` : '';
      const quickHTML = s.quick ? `<div class="suggest" style="margin-top:10px">${icon('timer', 'sm')}<span><b>Treino rápido (~${s.quick.min} min):</b> descanso mais curto e menos séries.</span></div>` : '';
      const adjHTML = quickHTML + (s.checkin && s.checkin.adj && !s.deload ? `<div class="suggest" style="margin-top:10px">${icon('sparkle', 'sm')}<span><b>Treino aliviado hoje:</b> 10% menos carga${s.checkin.adj >= 2 ? ' e uma série a menos' : ''}, porque o dia está puxado.</span></div>` : '');
      const deloadHTML = adjHTML + (s.deload ? `<div class="suggest" style="margin-top:10px">${icon('sparkle', 'sm')}<span><b>Semana leve:</b> menos séries e 10% menos carga para o corpo recuperar.</span></div>` : '');
      const pending = items.findIndex((y) => !Store.itemProgress(s, y).complete);
      const doneBanner = live && pr.complete ? `<div class="done-banner" data-done-banner><span class="db-ic">${icon('check', 'sm')}</span><span class="grow"><b>Exercício finalizado</b><small>${sets.filter((x) => x.done).length} séries feitas${pending >= 0 ? ' · ainda faltam ' + items.filter((y) => !Store.itemProgress(s, y).complete).length + ' exercício(s)' : ' · treino completo'}</small></span>${pending >= 0 ? `<button data-a="go" data-i="${pending}">Ir ao próximo</button>` : `<button data-a="finish">Finalizar</button>`}</div>` : '';
      return `${doneBanner}<div class="player-img">${imgHTML(ex, '', true)}<div class="fade"></div><span class="chip count num">${i + 1} / ${items.length}</span>
          <div class="tools"><button data-a="howto" data-i="${i}">${icon('info', 'sm')}Como fazer</button><button data-a="video" data-i="${i}">${icon('video', 'sm')}Vídeo</button></div></div>
        <div class="ex-title">${esc(ex.nome)}</div>
        ${swapped ? `<div class="small" style="color:var(--gold);margin:-2px 0 6px">${icon('repeat', 'sm')} Trocado hoje (no plano: ${esc(Store.exercise(it.exId).nome)})</div>` : ''}
        <div class="plan-line"><span class="chip">${Tools.repsText(it, ex)}${it.tech && it.tech.id === 'r21' ? ' (7+7+7)' : ''}</span>${Tools.loadText(it.kg, ex) && !(it.tech && it.tech.id === 'w531') ? `<span class="chip">${Tools.loadText(it.kg, ex)}</span>` : ''}${Store.isCardio(ex) ? '' : `<button class="chip blue" data-a="restCfg" data-i="${i}">${icon('timer', 'sm')}Descanso ${restLabel(Store.restFor(s, it))}</button>`}${pr.complete ? `<span class="chip done">${icon('check', 'sm')}Concluído</span>` : ''}</div>
        ${pin ? `<button class="pin-note" data-a="pin" data-i="${i}">${icon('note', 'sm')}<span>${esc(pin)}</span></button>` : ''}
        <div class="quick-row">${ex.tipo === 'tempo' ? '' : `<button data-a="warm" data-i="${i}">${icon('flame', 'sm')}Aquecer</button>`}<button data-a="swap" data-i="${i}">${icon('repeat', 'sm')}Trocar</button>${pin ? '' : `<button data-a="pin" data-i="${i}">${icon('note', 'sm')}Nota fixa</button>`}</div>
        ${techBanner(items, i)}
        ${it.note ? `<div class="small muted" style="margin-top:10px">${icon('note', 'sm')} ${esc(it.note)}</div>` : ''}
        ${deloadHTML}${stallHTML}${sugHTML}
        <div class="sets"><div class="sets-head"><span>#</span><span>Carga</span><span>${ex.tipo === 'tempo' ? 'Tempo' : 'Reps'}</span><span></span></div>${sets.map((x) => setRow(x, last, Store.isUni(it, ex))).join('')}</div>
        <button class="add-set" data-a="addSet" data-i="${i}">${icon('plus', 'sm')}Adicionar série</button>
        ${lastHTML}
        <div class="section-title"><h2>Observação</h2></div>
        <textarea class="note-field" data-in="note" data-item="${it.id}" placeholder="Ex.: pegada fechada, ombro incomodou…">${esc((s.notes || {})[it.id] || '')}</textarea>
        <button class="btn ghost block sm" style="margin-top:12px" data-a="markAll" data-i="${i}">${pr.complete ? 'Desmarcar exercício' : 'Marcar exercício como feito'}</button>`;
    }

    function footerHTML() {
      const { items, s } = ctx();
      const allDone = items.every((it) => Store.itemProgress(s, it).complete);
      const cur = items[idx] && Store.itemProgress(s, items[idx]).complete;
      const prev = `<button class="btn ghost" style="flex:0 0 52px;padding:0;${idx === 0 ? 'opacity:.4' : ''}" data-a="prev" ${idx === 0 ? 'disabled' : ''}>${icon('back')}</button>`;
      if (idx === items.length - 1 || allDone) return prev + `<button class="btn lime" data-a="finish">${allDone ? 'Finalizar treino' : 'Finalizar'}<span class="arrow">${icon('check', 'sm')}</span></button>`;
      return prev + `<button class="btn ${cur ? 'lime' : 'primary'}" data-a="next">Próximo exercício<span class="arrow">${icon('next', 'sm')}</span></button>`;
    }

    function updatePage(i) {
      const page = def.el.querySelectorAll('.page')[i]; if (!page) return;
      const st = page.scrollTop; page.innerHTML = pageHTML(i); page.scrollTop = st;
      updateChrome();
    }
    let lastIdx = idx;
    function updateChrome() {
      if (!def.el) return;
      if (idx !== lastIdx) {
        lastIdx = idx;
        const b = def.el.querySelectorAll('.page')[idx];
        const banner = b && b.querySelector('[data-done-banner]');
        if (banner) { banner.classList.remove('flash'); void banner.offsetWidth; banner.classList.add('flash'); Native.vibrate(25); }
      }
      Live.focus = { sid, i: idx };
      const sg = def.el.querySelector('.segs'); if (sg) sg.innerHTML = segs();
      const f = def.el.querySelector('.footer'); if (f) f.innerHTML = footerHTML();
    }
    function go(i, smooth) {
      const { items } = ctx();
      i = Math.max(0, Math.min(items.length - 1, i));
      const pager = def.el.querySelector('.pager');
      pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth === false ? 'auto' : 'smooth' });
      idx = i; updateChrome();
    }
    function findSet(id) { const { s, items } = ctx(); const x = s.sets.find((y) => y.id === id); const i = items.findIndex((it) => it.id === x.itemId); return { s, x, i, it: items[i] }; }
    // Unilateral: ajusta direito/esquerdo e repete nas séries seguintes ainda não feitas que estavam iguais.
    const uniSet = (x, it) => !x.time && Store.isUni(it, Store.exercise(x.exId));
    function adjustSides(id, dR, dL, absR, absL) {
      const { s, x, i } = findSet(id);
      const oR = Store.sideR(x), oL = Store.sideL(x);
      const r = absR != null ? absR : oR + dR, l = absL != null ? absL : oL + dL;
      Store.setSides(x, r, l);
      if (!x.sub) s.sets.filter((y) => y.itemId === x.itemId && !y.sub && y.n > x.n && !y.done && Store.sideR(y) === oR && Store.sideL(y) === oL).forEach((y) => Store.setSides(y, r, l));
      Store.save(); Native.vibrate(8); updatePage(i);
    }
    function sidesSheet(id) {
      const { x } = findSet(id);
      let r = Store.sideR(x), l = Store.sideL(x);
      const box = (k, lb, v) => `<div class="field"><label>${lb}</label><div class="stepper big"><button data-a="sd" data-k="${k}" data-d="-1">${icon('minus')}</button><div class="val"><b class="num">${v}</b></div><button data-a="sd" data-k="${k}" data-d="1">${icon('plus')}</button></div></div>`;
      sheet({
        render: () => `<h3>Repetições · ${x.sub ? esc(x.label) : 'série ' + x.n}</h3><div class="desc">Exercício unilateral: conte cada lado separado.</div>
          <div class="form-row">${box('r', 'Lado direito', r)}${box('l', 'Lado esquerdo', l)}</div>
          <button class="btn lime block" style="margin-top:16px" data-a="ok">Salvar</button>`,
        actions: {
          sd: (ds) => { if (ds.k === 'r') r = Math.max(0, r + Number(ds.d)); else l = Math.max(0, l + Number(ds.d)); Native.vibrate(6); sheetRefresh(); },
          ok: () => { closeSheet(); adjustSides(id, 0, 0, r, l); },
        },
      });
    }
    // Ajusta uma série e repete o valor nas séries seguintes ainda não feitas que tinham o mesmo valor.
    function adjust(id, field, delta, absolute) {
      const { s, x, i } = findSet(id);
      const old = x[field];
      let v = absolute != null ? absolute : Number(old) + delta;
      // Carga negativa só no peso do corpo (ajuda do graviton ou elástico).
      v = Math.max(field === 'kg' && Store.isBodyweight(x.exId) ? -200 : 0, Math.round(v * 100) / 100);
      x[field] = v;
      if (!x.sub && !x.target) s.sets.filter((y) => y.itemId === x.itemId && !y.sub && y.n > x.n && !y.done && y[field] === old).forEach((y) => { y[field] = v; });
      Store.save(); Native.vibrate(8); updatePage(i);
    }

    // O que acontece depois de concluir uma série: recorde, RIR, pausa da técnica, grupo ou descanso.
    function afterDone(x, i, it, wasComplete) {
      const { s, items } = ctx();
      const exName = Store.exercise(exIdOf(s, it)).nome;
      const rec = Analytics.newRecord(x);
      if (rec) { UI.prBurst(rec.tipo, exName + ' · ' + rec.txt); Voice.say('Novo recorde no ' + exName + '!', 3); }
      if (Store.state.settings.askRir && !x.warm && !x.time && !x.sub) {
        rirFor = x.id; clearTimeout(rirT);
        rirT = setTimeout(() => { if (rirFor === x.id) { rirFor = null; updatePage(i); } }, 10000);
        updatePage(i);
      }
      if (x.warm) { Rest.start(45, 'Aquecimento · ' + exName); return; }
      const allDone = items.every((y) => Store.itemProgress(s, y).complete);
      if (allDone) { Rest.stop(); toast('Treino completo! Toque em Finalizar'); Voice.say('Treino completo! Toque em finalizar.', 2, rec ? 1800 : 0); return; }
      // Técnica com série extra logo em seguida (drop, rest-pause, myo-reps, cluster…)
      const mine = s.sets.filter((y) => y.itemId === it.id);
      const nextRow = mine.slice(mine.indexOf(x) + 1).find((y) => !y.done);
      const pause = TECH.pauseFor(it);
      if (nextRow && nextRow.sub && !nextRow.warm && nextRow.n === x.n && pause !== null && pause !== 'rest') {
        if (pause > 0) Rest.start(pause, 'Pausa · ' + nextRow.label);
        else { Rest.stop(); Native.pattern([0, 60, 60, 60]); toast('Sem descanso! ' + nextRow.label + ': ' + (Tools.loadText(nextRow.kg, nextRow.exId) || kg(0))); Voice.say('Sem descanso! ' + nextRow.label + (Tools.loadSpoken(nextRow.kg, nextRow.exId) ? ', ' + Tools.loadSpoken(nextRow.kg, nextRow.exId) : '') + '.', 2); }
        return;
      }
      // Bi-set, tri-set…: segue para o próximo exercício do grupo sem descanso
      const g = TECH.groupOf(items, i);
      if (g && i < g.end && !Store.itemProgress(s, items[i + 1]).complete) {
        Rest.stop();
        toast('Sem descanso: ' + Store.exercise(exIdOf(s, items[i + 1])).nome);
        Voice.say('Sem descanso: agora ' + Store.exercise(exIdOf(s, items[i + 1])).nome + '.', 2);
        setTimeout(() => go(i + 1), 380);
        return;
      }
      if (Store.isCardio(exIdOf(s, it))) { Rest.stop(); if (!wasComplete && Store.itemProgress(s, it).complete) toast('Cardio concluído'); return; }
      Rest.start(Store.restFor(s, it), exName);
      if (g && i === g.end) {
        const back = [...Array(g.size).keys()].map((k) => g.start + k).find((k) => !Store.itemProgress(s, items[k]).complete);
        if (back != null) setTimeout(() => go(back), 450);
      }
      if (!wasComplete && Store.itemProgress(s, it).complete && !rec) toast('Exercício concluído');
    }

    const def = {
      hideNav: true, footer: true, player: sid,
      // Chamado pela notificação ("Série feita") para redesenhar as séries.
      refreshAll() { const { items } = ctx(); items.forEach((_, i) => updatePage(i)); },
      render() {
        const { w, items, s } = ctx();
        return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button>
          <div class="grow"><h1>Treino ${esc(w.letter)}</h1><div class="timer-pill">${icon('clock', 'sm')}<span class="num" data-elapsed>${clock(Date.now() - s.start)}</span></div></div>
          <button class="btn sm lime" data-a="finish">Finalizar</button></div>
          <div class="session-head"><div class="segs" style="display:flex;gap:4px">${segs()}</div></div>
          <div class="pager">${items.map((_, i) => `<div class="page">${pageHTML(i)}</div>`).join('')}</div>
          <div class="footer">${footerHTML()}</div>`;
      },
      after(el) {
        const pager = el.querySelector('.pager');
        requestAnimationFrame(() => { pager.scrollLeft = idx * pager.clientWidth; });
        pager.addEventListener('scroll', () => {
          clearTimeout(scrollT);
          scrollT = setTimeout(() => {
            const i = Math.round(pager.scrollLeft / pager.clientWidth);
            if (i !== idx) { idx = i; updateChrome(); }
          }, 60);
        }, { passive: true });
        Native.keepOn(true);
        // "Feito" por voz: marca a próxima série do exercício que está na tela.
        window.onVoiceCmd = () => {
          const page = el.querySelectorAll('.page')[idx];
          const b = page && page.querySelector('.set:not(.done) [data-a="toggle"]');
          if (b) { b.click(); toast('🎙 Série marcada'); } else toast('🎙 Nenhuma série pendente neste exercício');
        };
        const sLive = Store.session(sid);
        Voice.listen(!!(sLive && !sLive.finished && Store.state.activeSessionId === sid));
        const s0 = Store.session(sid);
        if (s0 && s0.autoUp && s0.autoUp.length && !s0.autoUpShown) {
          s0.autoUpShown = true; Store.save();
          setTimeout(() => toast(s0.autoUp.length === 1 ? 'Faixa completa: ' + Store.exercise(s0.autoUp[0].exId).nome + ' subiu para ' + kg(s0.autoUp[0].to) + ' × ' + s0.autoUp[0].lo : s0.autoUp.length + ' exercícios subiram de carga (faixa de repetições completa)'), 600);
        }
        clearInterval(elapsedT);
        elapsedT = setInterval(() => { const e = el.querySelector('[data-elapsed]'); const s = Store.session(sid); if (e && s) e.textContent = clock(Date.now() - s.start); }, 1000);
      },
      leave() { clearInterval(elapsedT); clearTimeout(rirT); Native.keepOn(false); Voice.listen(false); window.onVoiceCmd = null; },
      actions: {
        back: pop,
        go: (ds) => go(Number(ds.i)),
        prev: () => go(idx - 1),
        next: () => go(idx + 1),
        toggle: (ds) => {
          const { s, x, i, it } = findSet(ds.set);
          const wasComplete = Store.itemProgress(s, it).complete;
          Store.toggleSet(s, x.id);
          Native.vibrate(x.done ? 30 : 10);
          if (!x.done) { x.rir = null; if (rirFor === x.id) rirFor = null; Store.save(); }
          updatePage(i);
          if (x.done) afterDone(x, i, it, wasComplete);
          Live.tick();
        },
        // Exercício por tempo: cronômetro de execução; ao terminar, a série é marcada sozinha.
        play: (ds) => {
          const { s, x, i, it } = findSet(ds.set);
          Rest.stop();
          Tools.timeSheet(Number(x.reps) || 30, Store.exercise(exIdOf(s, it)).nome, (secs) => {
            const wasComplete = Store.itemProgress(s, it).complete;
            if (secs != null) x.reps = secs;
            if (!x.done) Store.toggleSet(s, x.id);
            Store.save(); updatePage(i); afterDone(x, i, it, wasComplete);
          });
        },
        rir: (ds) => { const { s, x, i } = findSet(ds.set); x.rir = Number(ds.v); rirFor = null; Store.save(); Native.vibrate(10); updatePage(i); },
        kgm: (ds) => adjust(ds.set, 'kg', -(Store.state.settings.incKg || 1)),
        kgp: (ds) => adjust(ds.set, 'kg', Store.state.settings.incKg || 1),
        rm: (ds) => { const { x, it } = findSet(ds.set); if (uniSet(x, it)) { adjustSides(ds.set, -1, -1); return; } adjust(ds.set, 'reps', Store.isCardio(x.exId) ? -(x.reps > 60 ? 60 : 0) : x.time ? -(x.reps > 120 ? 60 : 15) : -1); },
        rp: (ds) => { const { x, it } = findSet(ds.set); if (uniSet(x, it)) { adjustSides(ds.set, 1, 1); return; } adjust(ds.set, 'reps', Store.isCardio(x.exId) ? 60 : x.time ? (x.reps >= 120 ? 60 : 15) : 1); },
        kgEdit: (ds) => {
          const { s, x, it } = findSet(ds.set);
          const ex = Store.exercise(exIdOf(s, it));
          // Peso do corpo: digita o peso extra (ou a ajuda, se a carga já é negativa); o sinal é mantido.
          if (Store.isBodyweight(ex)) { const sign = Number(x.kg) < 0 ? -1 : 1; numberSheet((sign < 0 ? 'Ajuda' : 'Peso extra') + ' · ' + (x.sub ? x.label : 'série ' + x.n), Math.abs(Number(x.kg) || 0), 0.5, (v) => adjust(ds.set, 'kg', 0, sign * Math.abs(v)), 'kg'); return; }
          numberSheet('Carga · ' + (x.sub ? x.label : 'série ' + x.n), x.kg, 0.5, (v) => adjust(ds.set, 'kg', 0, v), 'kg', /barra|smith/i.test(ex.equip || '') ? Tools.platesHTML : null);
        },
        rEdit: (ds) => {
          const { x, it } = findSet(ds.set);
          if (uniSet(x, it)) { sidesSheet(ds.set); return; }
          if (Store.isCardio(x.exId)) { numberSheet('Tempo (minutos)', Math.round(x.reps / 60), 1, (v) => adjust(ds.set, 'reps', 0, Math.max(1, Math.round(v)) * 60), 'min'); return; }
          numberSheet((x.time ? 'Tempo (segundos)' : 'Repetições') + ' · ' + (x.sub ? x.label : 'série ' + x.n), x.reps, 1, (v) => adjust(ds.set, 'reps', 0, Math.round(v)));
        },
        addSet: (ds) => { const { s, items } = ctx(); Store.addSet(s, items[Number(ds.i)]); const n = s.sets.filter((x) => x.itemId === items[Number(ds.i)].id); const last = n[n.length - 1]; if (Store.exercise(exIdOf(s, items[Number(ds.i)])).tipo === 'tempo') last.time = true; updatePage(Number(ds.i)); },
        markAll: (ds) => {
          const { s, items } = ctx(); const it = items[Number(ds.i)];
          const mine = s.sets.filter((x) => x.itemId === it.id);
          const all = Store.itemProgress(s, it).complete;
          s.completed = (s.completed || []).filter((id) => id !== it.id);
          mine.forEach((x) => { x.done = !all; x.at = all ? null : x.at || Date.now(); });
          Store.save(); Native.vibrate(20); updatePage(Number(ds.i));
        },
        applySug: (ds) => {
          const { s, items } = ctx(); const i = Number(ds.i), it = items[i];
          const sg = Store.loadSuggestion(it, s.id, exIdOf(s, it));
          if (sg && sg.why === 'range') { rangeSheet(s, it, sg, () => updatePage(i)); return; }
          s.sets.filter((x) => x.itemId === it.id && !x.done && !x.warm && !x.sub).forEach((x) => { x.kg = Number(ds.kg); });
          Store.save(); updatePage(Number(ds.i)); toast('Carga atualizada para ' + kg(ds.kg));
        },
        stall: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); stallSheet(s, items[i], () => updatePage(i)); },
        warm: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); Tools.warmupSheet(s, items[i], () => updatePage(i)); },
        swap: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); Tools.swapSheet(s, items[i], () => updatePage(i)); },
        pin: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); Tools.pinSheet(exIdOf(s, items[i]), () => updatePage(i)); },
        howto: (ds) => { const { s, items } = ctx(); push(Screens.ExerciseDetail(exIdOf(s, items[Number(ds.i)]))); },
        techInfo: (ds) => techSheet(ds.t, ctx().items[Number(ds.i)]),
        video: (ds) => { const { s, items } = ctx(); Native.open(Store.videoUrl(Store.exercise(exIdOf(s, items[Number(ds.i)])))); },
        note: (ds, el) => { const { s } = ctx(); s.notes = s.notes || {}; s.notes[ds.item] = el.value; Store.save(); },
        restCfg: (ds) => restSheet(ctx().items[Number(ds.i)], () => updatePage(Number(ds.i))),
        finish: () => finishSheet(sid),
      },
    };
    return def;
  }

  // Aviso da técnica no topo do exercício: técnica própria e/ou grupo (bi-set etc.).
  function techBanner(items, i) {
    const it = items[i];
    let html = '';
    const g = TECH.groupOf(items, i);
    if (g) {
      const others = [...Array(g.size).keys()].map((k) => g.start + k).filter((k) => k !== i).map((k) => Store.exercise(items[k].exId).nome);
      html += `<button class="tech-banner" data-a="techInfo" data-i="${i}" data-t="${g.type}"><span class="tb-ic">${icon('repeat', 'sm')}</span>
        <span class="grow"><b>${esc(g.tech.nome)} · ${g.pos} de ${g.size}</b><small>${i < g.end ? 'Sem descanso: depois vá para ' + esc(Store.exercise(items[i + 1].exId).nome) : 'Último do grupo: agora sim, descanse'}${others.length ? '' : ''}</small></span>${icon('info', 'sm')}</button>`;
    }
    const t = it.tech && TECH.get(it.tech.id);
    if (t) {
      html += `<button class="tech-banner" data-a="techInfo" data-i="${i}" data-t="${t.id}"><span class="tb-ic">${icon(t.mode === 'cue' ? 'clock' : 'flame', 'sm')}</span>
        <span class="grow"><b>${esc(t.nome)}</b><small>${esc(t.cue(TECH.params(it.tech)))}</small></span>${icon('info', 'sm')}</button>`;
    }
    return html;
  }

  // Explica a técnica com o passo a passo.
  function techSheet(id, item) {
    const t = TECH.get(id);
    if (!t) return;
    const p = item && item.tech && item.tech.id === id ? TECH.params(item.tech) : t.params;
    sheet({
      render: () => `<div class="caps" style="color:var(--gold)">${esc((TECH.CATS.find((c) => c.id === t.cat) || {}).nome || '')}</div><h3>${esc(t.nome)}</h3><div class="desc">${esc(t.resumo)}</div>
        <div class="card"><ol class="tips">${t.passos.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
        ${t.cue ? `<div class="suggest" style="margin-top:12px">${icon('sparkle', 'sm')}<span>Neste exercício: <b>${esc(t.cue(p))}</b></span></div>` : ''}
        <button class="btn lime block" style="margin-top:16px" data-a="ok">Entendi</button>`,
      actions: { ok: closeSheet },
    });
  }

  // Ajusta o descanso de um exercício (fica salvo no plano).
  function restSheet(item, done) {
    const opts = [30, 45, 60, 90, 120, 180];
    sheet({
      render: () => `<h3>Tempo de descanso</h3><div class="desc">${esc(Store.exercise(item.exId).nome)} · fica salvo no plano</div>
        <div class="filters" style="flex-wrap:wrap;margin:0">${opts.map((o) => `<button class="filter ${item.rest === o ? 'on' : ''}" data-a="set" data-v="${o}">${restLabel(o)}</button>`).join('')}</div>
        <div class="stepper big" style="margin-top:14px"><button data-a="m">${icon('minus')}</button><div class="val"><b class="num">${restLabel(item.rest)}</b><small>ajuste fino de 15 s</small></div><button data-a="p">${icon('plus')}</button></div>
        <button class="btn lime block" style="margin-top:16px" data-a="ok">Salvar</button>`,
      actions: {
        set: (ds) => { item.rest = Number(ds.v); Store.save(); sheetRefresh(); },
        m: () => { item.rest = Math.max(5, item.rest - 15); Store.save(); sheetRefresh(); },
        p: () => { item.rest += 15; Store.save(); sheetRefresh(); },
        ok: () => { closeSheet(); toast('✓ Descanso salvo'); done && done(); },
      },
    });
  }

  // ====================== FINALIZAR ======================
  const FEEL = [['1', 'Muito leve'], ['2', 'Leve'], ['3', 'Moderado'], ['4', 'Pesado'], ['5', 'Exaustivo']];
  function finishSheet(sid) {
    const s = Store.session(sid);
    let feel = s.feel || 0, note = s.note || '';
    sheet({
      render: () => {
        const pr = Store.sessionProgress(s);
        const missing = pr.total - pr.complete;
        return `<h3>Finalizar treino</h3><div class="desc">${missing ? `Faltam <b>${missing}</b> exercício${missing > 1 ? 's' : ''}. O treino fica como <b style="color:var(--amber)">incompleto</b> e você pode continuar depois.` : 'Todos os exercícios concluídos. Mandou bem!'}</div>
          <div class="tiles"><div class="card tile"><div class="v num">${clock(Date.now() - s.start)}</div><div class="l">Duração</div></div><div class="card tile"><div class="v num">${pr.setsDone}<small>/${pr.setsTotal}</small></div><div class="l">Séries</div></div><div class="card tile"><div class="v num">${volume(Store.sessionVolume(s))}</div><div class="l">Volume</div></div></div>
          <div class="field"><label>Como foi o treino?</label><div class="feel">${FEEL.map(([v, l]) => `<button class="${String(feel) === v ? 'on' : ''}" data-a="feel" data-v="${v}"><b>${v}</b>${l}</button>`).join('')}</div></div>
          <div class="field"><label>Observação geral (opcional)</label><textarea class="note-field" data-in="note" placeholder="Ex.: dormi mal, treino rendeu menos">${esc(note)}</textarea></div>
          <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Voltar</button><button class="btn lime" data-a="ok">Salvar treino</button></div>`;
      },
      actions: {
        feel: (ds) => { feel = Number(ds.v); sheetRefresh(); },
        note: (ds, el) => { note = el.value; },
        no: closeSheet,
        ok: () => {
          Store.finishSession(s, feel, note); Rest.stop(); closeSheet();
          popTo(1);
          setTimeout(() => celebrate(s), 380);
        },
      },
    });
  }

  function celebrate(s) {
    const pr = Store.sessionProgress(s);
    const recs = Store.sessionRecords(s);
    const medals = Analytics.newMedals();
    Screens.syncNative();
    const complete = pr.complete >= pr.total;
    Native.pattern([0, 40, 60, 40]);
    Voice.say((complete ? 'Treino concluído! ' : 'Treino salvo. ') + Store.sessionDuration(s) + ' minutos, ' + pr.setsDone + ' séries.' + (recs.length ? ' ' + recs.length + (recs.length > 1 ? ' recordes!' : ' recorde!') : ''), 3);
    sheet({
      render: () => `<div class="celebrate"><div class="badge">${icon(complete ? 'check' : 'flame', 'lg')}</div><h3>${complete ? 'Treino concluído!' : 'Treino salvo'}</h3><div class="desc">${complete ? 'Mais um na conta. Consistência é tudo.' : pr.complete + ' de ' + pr.total + ' exercícios feitos. Dá para continuar depois.'}</div></div>
        <div class="tiles"><div class="card tile"><div class="v num">${Store.sessionDuration(s)}<small>min</small></div><div class="l">Duração</div></div><div class="card tile"><div class="v num">${pr.setsDone}</div><div class="l">Séries</div></div><div class="card tile"><div class="v num">${volume(Store.sessionVolume(s))}</div><div class="l">Volume</div></div></div>
        ${recs.length ? `<div class="section-title"><h2>${icon('trophy', 'sm')} Recordes</h2></div>${recs.map((r) => `<div class="kv"><span>${esc(Store.exercise(r.exId).nome)}</span><b class="pr num">${kg(r.kg)} <span class="faint small">(antes ${nf(r.prev)})</span></b></div>`).join('')}` : ''}
        ${medals.length ? `<div class="section-title"><h2>${icon('star', 'sm')} Conquista${medals.length > 1 ? 's' : ''} nova${medals.length > 1 ? 's' : ''}</h2></div>${medals.map((m) => `<div class="kv"><span><b style="color:var(--gold-2)">${esc(m.nome)}</b></span><span class="small">${esc(m.desc)}</span></div>`).join('')}` : ''}
        <div class="btn-row" style="margin-top:18px"><button class="btn ghost" data-a="share">${icon('share', 'sm')}Compartilhar</button><button class="btn lime" data-a="ok">Fechar</button></div>`,
      actions: { ok: closeSheet, share: () => { toast('Gerando imagem…'); Screens.shareSession(s.id); } },
    });
  }

  window.Screens = Object.assign(window.Screens || {}, { finishSheet, firstOpenIndex, Home, WorkoutScreen, Player, trainNow, emblem, techSheet, techChips, restSheet, STATUS, daysText, estMinutes });
})();
