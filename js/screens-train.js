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
  function emblem(size, where) {
    // Logo novo (v0.36): o G de metal sobre a pedra escura, centralizado, preenchendo o círculo.
    // No botão Treinar dos temas Azul, Luana e Atelier, só o G recortado sobre o tom claro do tema (fundo no CSS).
    // Logo v0.39 (manual da marca): símbolo branco com a barra cobre; versão escura nos fundos claros.
    if (where === 'nav' && window.Theme && ['azul', 'luana', 'atelier'].includes(Theme.current().id)) return `<img class="g-emb g-cut" src="img/${Theme.current().id === 'azul' ? 'g-mark' : 'g-mark-dark'}.png" alt="Gravity">`;
    const px = Math.round(size * 1.6); return `<img class="g-emb" src="img/g-tile.png" alt="Gravity" style="width:${px}px;height:${px}px">`;
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
        // v0.42: com plano, a foto do atleta fica fixa no topo (à esquerda do GRAVITY); sem a linha "Bom dia".
        const head = `<div class="topbar">${p ? `<button class="h2-av tb press" data-a="avatar" aria-label="Foto do perfil">${Profile.avatarHTML(26)}</button>` : '<span class="icon-btn plain" style="visibility:hidden"></span>'}<h1 style="text-align:center;letter-spacing:7px;padding-left:7px;color:var(--gold-2);font-family:var(--display);font-size:17px;font-weight:400">Gravity</h1><button class="icon-btn plain" data-a="settings" aria-label="Configurações">${icon('gear')}</button></div>`;
        const who = `<div class="row appear" style="margin:12px 2px 16px"><button class="emblem-ring avatar press" style="width:50px;height:50px;margin:0" data-a="avatar" aria-label="Foto do perfil">${Profile.avatarHTML(30)}</button>
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

        // Backup da semana (navegador/iPhone; no Android é automático).
        const backupCard = !window.Android && Store.backupDue() ? `<div class="card deload-card appear"><div class="row" style="align-items:flex-start"><span class="dl-ic">${icon('download', 'sm')}</span><div class="grow"><b>Backup da semana</b><small>Seus treinos ficam só neste celular. Salve uma cópia (Arquivos, WhatsApp ou e-mail) para não perder nada.</small></div></div>
          <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="bkLater">Depois</button><button class="btn lime sm" data-a="bkNow">Fazer backup</button></div></div>` : '';
        // Semana leve: proposta ou em andamento.
        const dl = Store.deloadActive(), dp = !dl && Store.deloadProposal();
        const deloadCard = dl ? `<div class="card deload-card appear"><div class="row"><span class="dl-ic">${icon('sparkle', 'sm')}</span><div class="grow"><b>Semana leve em andamento</b><small>Até ${dl.end.split('-').reverse().slice(0, 2).join('/')} · menos séries e 10% menos carga</small></div><button class="small muted" data-a="deloadEnd">Encerrar</button></div></div>`
          : dp ? `<div class="card deload-card appear"><div class="row" style="align-items:flex-start"><span class="dl-ic">${icon('sparkle', 'sm')}</span><div class="grow"><b>Hora de uma semana leve?</b><small>${dp.hard ? 'Muitas séries no limite nas últimas 2 semanas' : dp.weeks + ' semanas seguidas de treino'}. Uma semana com ~60% das séries e 10% menos carga ajuda o corpo a recuperar e voltar mais forte.</small></div></div>
            <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="deloadNo">Agora não</button><button class="btn lime sm" data-a="deloadYes">Fazer semana leve</button></div></div>` : '';
        // Tela inicial (v0.37): o "Painel" em blocos (B), que nasceu no tema Azul, vale para todos os temas.
        const hs = 'B';
        if (hs) return head + homeStyled(hs, { S, p, list, range, t, dow, cta, done, partial, late, pct, setsW, vol, mins, level, upd: Updater.card(), extra: backupCard + deloadCard });
        return head + `<div class="content">${who}${Updater.card()}${overall}${backupCard}${deloadCard}${quoteCard}${sched}${Screens.muscleCard()}${Screens.strengthCard()}${streakCard}${mission}
          <div class="section-title"><h2>Esta semana</h2><button class="link" data-a="progress">Ver evolução</button></div>${tiles}</div>`;
      },
      // Uma dica do "Você sabia?" por dia, depois de a tela inicial aparecer.
      after(el, re) {
        if (re) return;
        const st = Store.state.settings;
        if (st.swapHint) {
          st.swapHint = false; st.swapAskAt = Date.now(); Store.save();
          const nv = (Number(st.restSwap) || 0) + 60;
          setTimeout(() => UI.confirmSheet('Mais tempo na troca?', 'Nas últimas trocas de exercício você quase sempre pediu mais tempo. Quer aumentar a <b>troca de exercício</b> para <b>+' + UI.restLabel(nv) + '</b>? Dá para mudar em Configurações › Treino.', 'Aumentar', () => { st.restSwap = nv; Store.save(); UI.toast('Troca de exercício: +' + UI.restLabel(nv)); }), 600);
          return;
        }
        if (window.TipsFx) TipsFx.maybe();
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
        updNow: () => Updater.install(),
        updLater: () => Updater.later(),
        bkNow: () => { Native.share('Backup Gravity', Store.exportBackup(), 'gravity-backup-' + Store.iso(Store.today()) + '.json'); Store.backupDone(); UI.refresh(); },
        bkLater: () => { Store.snoozeBackup(); toast('Lembro de novo em 2 dias'); UI.refresh(); },
        pwWeight: () => Screens.measureSheet(() => UI.refresh()),
        deloadYes: () => { Store.startDeload(); toast('Semana leve ativada por 7 dias'); UI.refresh(); },
        deloadNo: () => { Store.snoozeDeload(); toast('Tudo bem. Pergunto de novo em uma semana.'); UI.refresh(); },
        deloadEnd: () => { Store.endDeload(); toast('Semana leve encerrada'); UI.refresh(); },
        open: (ds) => push(WorkoutScreen(ds.id)),
        agenda: () => agendaSheet(),
        day: (ds) => { if (ds.id) push(WorkoutScreen(ds.id)); else agendaSheet(); },
        rest: () => trainNow(),
        resume: (ds) => { const s = Store.session(ds.id); push(Player(s.id, firstOpenIndex(s))); },
      },
    };
  }


  // ---------- Tela inicial por tema (v0.33) ----------
  // Foto do cartão do treino: uma por dia, entre as fotos de atleta da entrada (o recorte esconde o logo da arte).
  // Usa a mesma lista da abertura (Splash.ATHLETE): foto nova adicionada à entrada entra aqui sozinha.
  function homePhoto(d) {
    const list = (window.Splash && Splash.ATHLETE && Splash.ATHLETE.length) ? Splash.ATHLETE : [1, 3, 4, 6, 7, 8, 9, 10];
    const n = list[Math.floor(d / 86400000) % list.length];
    return 'img/entrada/entrada-' + String(n).padStart(2, '0') + '.jpg';
  }
  function workoutSets(w) { return w.items.reduce((a, it) => a + (Number(it.sets) || 0), 0); }
  // Agenda da semana numa folha (usada pelos atalhos das telas A e B).
  function agendaSheet() {
    const S = Store.state, p = Store.activePlan(); if (!p) return;
    const dow = Store.today().getDay(), order = (w) => (w.days.length ? (w.days[0] - S.settings.weekStart + 7) % 7 : 9);
    const rows = p.workouts.map((w) => ({ w, st: Store.workoutStatus(w) })).sort((a, b) => order(a.w) - order(b.w)).map(({ w, st }) => {
      const sub = st.status === 'done' ? 'Concluído' : st.status === 'partial' ? 'Incompleto · ' + st.p.complete + ' de ' + st.p.total : st.status === 'late' ? 'Atrasado' : w.items.length + ' exercícios';
      return `<div class="srow press ${w.days.includes(dow) ? 'today' : ''}" data-a="go" data-id="${w.id}"><span class="chk ${STATUS[st.status].cls}">${st.status === 'done' ? icon('check') : ''}</span>
        <div class="nm ellipsis">Treino ${esc(w.letter)} · ${esc(w.name)}<small>${sub}</small></div><div class="tm">${w.days.includes(dow) ? '<span class="gold">HOJE</span>' : w.days.map((d) => Store.WEEKDAYS[d].toUpperCase()).join(' ') || '—'}</div></div>`;
    }).join('');
    sheet({ render: () => `<h3>Agenda da semana</h3><div class="sched">${rows}</div><div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-a="edit">Editar plano</button><button class="btn lime" data-a="ok">Fechar</button></div>`,
      actions: { go: (ds) => { closeSheet(); setTimeout(() => push(WorkoutScreen(ds.id)), 250); }, edit: () => { closeSheet(); setTimeout(() => push(Screens.PlanEditor(p.id)), 250); }, ok: closeSheet } });
  }
  function homeStyled(kind, c) {
    const { S, p, list, range, t, dow, cta, done, partial, late, pct, setsW, vol, mins, level } = c;
    const top = `<div class="h2-top"><button class="h2-av press" data-a="avatar" aria-label="Foto do perfil">${Profile.avatarHTML(26)}</button>
      <div class="h2-hi"><small>${greeting()}${kind === 'A' ? ' · ' + Store.WEEKDAYS_LONG[dow].toLowerCase() + ', ' + t.getDate() + ' ' + ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][t.getMonth()] : ''}</small><b class="ellipsis">${esc(S.settings.name || 'Atleta')}</b></div>
      <button class="h2-lvl" data-a="medals">Nível ${level}</button></div>${c.upd || ''}`;
    const st = Analytics.strength();
    const power = st.power != null ? Math.round(st.power).toLocaleString('pt-BR') : '—';
    const w = cta && cta.w, items = w ? w.items : [];
    const meta = w ? `<div class="h2-meta"><span>${items.length} exercícios</span><span>${workoutSets(w)} séries</span><span>~${estMinutes(w)} min</span></div>` : '';
    const short = { 'Entrar no treino': 'Começar', 'Continuar treino': 'Continuar', 'Abrir treino': 'Abrir' };
    const btn = (cls) => cta ? `<button class="btn primary block ${cls || ''}" data-a="${cta.a}" data-id="${cta.id}">${kind === 'B' ? short[cta.btn] || cta.btn : cta.btn}<span class="arrow">${icon('play', 'sm')}</span></button>`
      : `<button class="btn ghost block" data-a="rest">Treinar mesmo assim</button>`;
    const title = w ? `Treino ${esc(w.letter)}<br>${esc(w.name)}` : (list.some((x) => x.w.days.includes(dow)) ? 'Treino de hoje<br>concluído' : 'Semana<br>completa');
    const tag = cta ? esc(kind === 'B' ? ({ 'Treino de hoje': 'Hoje', 'Dia livre · adiantar?': 'Adiantar?', 'Treino em andamento': 'Em andamento' }[cta.k] || cta.k) : cta.k) : 'Descanse';
    const photo = `<div class="h2-ph" style="background-image:url('${homePhoto(t.getTime())}')"></div>`;
    if (kind === 'A') {
      // Faixa da semana: marca de cada dia pela situação dos treinos daquele dia.
      const rank = { late: 4, partial: 3, pending: 2, done: 1 };
      const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const d = Store.addDays(range.start, i), wd = d.getDay(), ws = list.filter((x) => x.w.days.includes(wd));
        const worst = ws.reduce((a, x) => (!a || rank[x.st.status] > rank[a] ? x.st.status : a), null);
        const m = worst === 'done' ? 'ok' : worst === 'late' ? 'late' : worst === 'partial' ? 'part' : ws.length ? 'plan' : '';
        const isT = Store.iso(d) === Store.iso(t), pick = ws.find((x) => x.st.status !== 'done') || ws[0];
        return `<button class="h2-d ${isT ? 'today' : ''}" data-a="day" data-id="${pick ? pick.w.id : ''}">${Store.WEEKDAYS[wd][0]}<b>${d.getDate()}</b><span class="m ${m}"></span></button>`;
      }).join('');
      const thumbs = items.slice(0, 4).map((it) => { const e = Store.exercise(it.exId); const im = e && e.img && e.img[0]; return im ? `<div style="background-image:url('${im}')"></div>` : `<div class="no">${icon('dumbbell', 'sm')}</div>`; }).join('') + (items.length > 4 ? `<div class="more">+${items.length - 4}</div>` : '');
      const lateL = list.filter((x) => x.st.status === 'late');
      const alert = lateL.length ? `<div class="card h2-alert press" data-a="agenda"><div class="ic">${icon('alert', 'sm')}</div><div class="t">${lateL.length} ${lateL.length === 1 ? 'treino atrasado' : 'treinos atrasados'}<small class="ellipsis">${lateL.map((x) => 'Treino ' + esc(x.w.letter) + ' · ' + esc(x.w.name)).join(', ')}</small></div><span class="h2-chip">Ver</span></div>` : '';
      return `<div class="content home2 hA">${top}<div class="h2-wk">${days}</div>
        <div class="h2-hero appear">${photo}<div class="in"><span class="h2-tag">● ${tag}</span><h2>${title}</h2>${meta}${items.length ? `<div class="h2-th">${thumbs}</div>` : ''}${btn()}</div></div>
        ${alert}${c.extra}
        <div class="card h2-trio press" data-a="progress"><div><b class="num">${volume(vol)}</b><small>Volume</small></div><div><b class="num">${setsW}</b><small>Séries</small></div><div><b class="num">${power}</b><small>Nível de poder</small></div></div></div>`;
    }
    // B: painel em blocos
    const vd = Screens.volumeData ? Screens.volumeData().st : [];
    const ranked = vd.filter((r) => r.alvo).map((r) => ({ r, k: r.n / Math.max(1, r.alvo[0]) })).sort((a, b) => a.k - b.k);
    const bars = (vd.some((r) => r.n > 0) ? ranked.slice(0, 3) : ranked.slice(0, 3)).map(({ r }) => `<div><div class="r"><span class="ellipsis">${esc(r.nome)}</span><b class="num">${nf(r.n)}/${r.alvo[0]}</b></div><div class="h2-bar"><i style="width:${Math.min(100, r.n / Math.max(1, r.alvo[0]) * 100)}%;${r.st === 'pouco' || r.st === 'zero' ? 'background:var(--amber)' : r.st === 'alto' ? 'background:#d0803e' : ''}"></i></div></div>`).join('');
    const gaugeLen = 188.5, g = st.power != null ? Math.min(1, st.power / 9001) : 0;
    return `<div class="content home2 hB">${c.upd || ''}<div class="h2-bento">
      <div class="card h2-tile press" data-a="agenda"><div class="caps">Semana</div>${ring(104, 9, pct / 100, 'gold', `<b class="num">${pct}%</b>`)}
        <div class="h2-cnt"><span><i style="background:#2FB36B"></i>${done}/${list.length}</span><span><i style="background:var(--amber)"></i>${partial}</span><span><i style="background:var(--red)"></i>${late}</span></div></div>
      <div class="card h2-tile h2-next">${photo}<div class="in"><span class="h2-tag">${tag}</span><h3>${title}</h3>${w ? `<div class="h2-meta"><span>${items.length} ex</span><span>~${estMinutes(w)} min</span></div>` : ''}${btn('sm')}</div></div>
      <div class="card h2-tile press" data-a="pwOpen"><div class="caps">Nível de poder</div><svg class="h2-gauge" viewBox="0 0 140 78"><path d="M10 70 A60 60 0 0 1 130 70" stroke="rgba(var(--fg-rgb),.08)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M10 70 A60 60 0 0 1 130 70" stroke="var(--gold)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${(g * gaugeLen).toFixed(1)} 400"/><text x="70" y="64" text-anchor="middle" fill="var(--text)" font-family="Oswald" font-size="26">${power}</text></svg><div class="h2-sub">${st.power != null ? 'de 9.001 · ' + esc(st.level) : 'Registre os básicos'}</div></div>
      <div class="card h2-tile wide press" data-a="muscles"><div class="h2-mus"><div class="h2-body">${(() => { const mp = Screens.volumeData().map; return Screens.bodySVG((k) => Screens.VCOL[(mp[k] || {}).st || 'zero'], 104); })()}</div><div class="h2-bars"><div class="caps">Músculos da semana</div>${bars}</div></div></div>
      <div class="h2-row3"><div class="card h2-tile mini press" data-a="progress"><div class="ic">${icon('weight', 'sm')}</div><b class="num">${volume(vol)}</b><small>Volume da semana</small></div>
      <div class="card h2-tile mini press" data-a="progress"><div class="ic">${icon('clock', 'sm')}</div><b class="num">${mins} min</b><small>Tempo treinando</small></div>
      <div class="card h2-tile mini press h2-lvl3" data-a="medals"><div class="ic">${icon('trophy', 'sm')}</div><b class="num">Nível ${level}</b><small>Conquistas</small></div></div>
    </div>${c.extra}</div>`;
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

  // " · troca 2:30" na lista do treino (não no último exercício nem no meio de um bi-set).
  function swapTxt(items, i) {
    if (i === items.length - 1) return '';
    const g = TECH.groupOf(items, i); if (g && i < g.end) return '';
    const b = Store.swapBase(items[i]); return b ? ` <span class="swap-txt">· troca ${UI.restLabel(b)}</span>` : '';
  }
  function estMinutes(w) {
    return Math.max(10, Math.round(w.items.reduce((a, it) => a + (Store.isCardio(it.exId) ? it.sets * (Number(it.reps) || 1200) : it.sets * ((Number(it.rest) || 60) + 45)), 0) / 60 + Store.swapExtra(w) / 60));
  }
  function firstOpenIndex(s) {
    const fw = Store.findWorkout(s.workoutId);
    const i = fw.workout.items.findIndex((it) => !Store.itemProgress(s, it).complete && !(s.skipped || []).includes(it.id));
    return i < 0 ? 0 : i;
  }

  // Volume da sessão anterior do mesmo treino (para o "↑ x%").
  function prevVolume(s) {
    const o = Store.state.sessions.filter((x) => x.workoutId === s.workoutId && x.id !== s.id && x.start < s.start && x.sets.some((y) => y.done)).sort((a, b) => b.start - a.start)[0];
    return o ? Store.sessionVolume(o) : 0;
  }
  // Próximo treino do plano depois deste (o primeiro ainda não feito na semana, na ordem do plano).
  function nextWorkout(p, w) {
    const ws = p.workouts, i = ws.indexOf(w);
    for (let k = 1; k < ws.length; k++) { const o = ws[(i + k) % ws.length]; if (Store.workoutStatus(o).status !== 'done') return o; }
    return null;
  }
  function nextWhen(w) {
    if (!w.days.length) return 'sem dia fixo';
    const t = Store.today().getDay();
    const d = w.days.map((x) => (x - t + 7) % 7).sort((a, b) => a - b);
    const n = d.find((x) => x > 0); const k = n === undefined ? d[0] : n;
    return k === 0 ? 'hoje' : k === 1 ? 'amanhã' : Store.WEEKDAYS[(t + k) % 7].toLowerCase();
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
        // "Rodando" = treino aberto agora (não finalizado). Um treino incompleto já salvo deixa trocar de treino.
        const running = cur && !cur.finished && Store.state.activeSessionId === cur.id;
        const done = !cur && st.status === 'done';
        def.footer = true;
        const recIds = done && s ? Store.sessionRecords(s).map((r) => r.exId) : [];
        const rows = w.items.map((it, i) => {
          const ex = Store.exercise(it.exId);
          const pr = s ? Store.itemProgress(s, it) : null, ok = pr && pr.complete;
          const base = Tools.repsText(it, ex) + (Tools.loadText(it.kg, ex) ? ' · ' + Tools.loadText(it.kg, ex) : '');
          const meta = s ? base + ' · ' + (ok ? 'feito' : 'falta') : base + (Store.isCardio(ex) ? '' : ' · ' + restLabel(it.rest)) + swapTxt(w.items, i);
          return `<div class="wk-ex press appear" data-a="item" data-i="${i}"><span class="n ${ok ? 'ok' : ''}">${ok ? icon('check', 'sm') : i + 1}</span>${thumb(ex)}<div class="grow"><b class="ellipsis">${esc(ex.nome)}</b><small>${meta}</small>${techChips(w.items, i)}</div>${recIds.includes(Store.exOf(s, it)) ? '<span class="wk-tag">Recorde</span>' : ''}</div>`;
        }).join('');
        const mus = [...new Set(w.items.map((x) => Store.exercise(x.exId).grupo).filter(Boolean))];
        const sets = workoutSets(w), dow = Store.today().getDay();
        let tag, info, footer;
        if (done) {
          const recs = recIds.length, pv = prevVolume(s), vol = Store.sessionVolume(s);
          const when = s.date === Store.iso(Store.today()) ? 'Feito hoje' : 'Feito · ' + Store.WEEKDAYS[Store.parseISO(s.date).getDay()].toLowerCase();
          tag = `<span class="wk-tag ok">${icon('check', 'sm')}${when}</span>`;
          info = `<div class="wk-nums"><div><b class="num">${Store.sessionDuration(s)}</b><small>minutos</small></div><div><b class="num">${volume(vol)}</b><small>volume${pv ? ' · ' + (vol >= pv ? '↑ ' : '↓ ') + Math.abs(Math.round((vol / pv - 1) * 100)) + '%' : ''}</small></div><div><b class="num">${recs}</b><small>${recs === 1 ? 'recorde' : 'recordes'}</small></div></div>`;
          footer = `<button class="btn ghost" data-a="start">${icon('repeat', 'sm')}Treinar de novo</button><button class="btn lime" data-a="summary">Ver resumo</button>`;
        } else if (cur) {
          const pr = Store.sessionProgress(cur);
          const left = w.items.filter((it) => !Store.itemProgress(cur, it).complete).map((it) => Store.exercise(Store.exOf(cur, it)).nome);
          const missing = pr.total - pr.complete;
          tag = `<span class="wk-tag warn">${running ? 'Em andamento' : 'Incompleto'} · ${pr.complete} de ${pr.total}</span>`;
          const dm = Store.sessionDuration(cur);
          info = `<div class="wk-prog"><i style="width:${pr.total ? Math.round(pr.complete / pr.total * 100) : 0}%"></i></div><div class="wk-sub">${dm ? dm + ' min' : ''}${left.length ? (dm ? ' · ' : '') + 'faltam ' + esc(left.length > 2 ? left.slice(0, 2).join(', ') + ' e mais ' + (left.length - 2) : left.join(' e ')) : ''}</div>`;
          footer = `<button class="btn lime" data-a="continue">${icon('play', 'sm')}${missing > 0 ? 'Continuar · faltam ' + missing : 'Continuar'}</button>`;
        } else {
          const lab = w.days.includes(dow) ? 'Hoje' : st.status === 'late' ? 'Atrasado' : daysText(w.days);
          tag = `<span class="wk-tag ${w.days.includes(dow) ? 'fill' : st.status === 'late' ? 'late' : ''}">${lab}</span>`;
          info = `<div class="wk-sub">${w.items.length} exercícios · ~${estMinutes(w)} min · ${sets} séries${mus.length ? ' · ' + esc(mus.slice(0, 3).join(', ')) : ''}</div>`;
          footer = `<button class="btn lime" data-a="start">${icon('play', 'sm')}Começar treino</button>`;
        }
        const links = [];
        if (!running && !done && w.items.length && estMinutes(w) > 25) links.push(`<button class="press" data-a="quick">${icon('timer', 'sm')}Pouco tempo?</button>`);
        if (!running && !done && fw.plan.workouts.length > 1) links.push(`<button class="press" data-a="switchW">${icon('repeat', 'sm')}Trocar treino</button>`);
        const nx = done ? nextWorkout(fw.plan, w) : null;
        const next = nx ? `<div class="caps wk-cap">Próximo treino</div><button class="wk-next press" data-a="open" data-id="${nx.id}"><span class="lt">${esc(nx.letter)}</span><span class="grow"><b class="ellipsis">${esc(nx.name)}</b><small>${nextWhen(nx)} · ${nx.items.length} exercícios · ~${estMinutes(nx)} min</small></span>${icon('next', 'sm')}</button>` : '';
        return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>Treino ${esc(w.letter)}</h1><button class="icon-btn" data-a="edit">${icon('edit', 'sm')}</button></div>
          <div class="content"><div class="wk-hero appear"><div class="ph" style="background-image:url('${homePhoto(Store.today().getTime())}')"></div><div class="in">${tag}<h2>${esc(w.name)}</h2>${info}</div></div>
          ${links.length ? `<div class="wk-links">${links.join('')}</div>` : ''}${next}
          <div class="caps wk-cap">${done ? 'Exercícios feitos' : 'Exercícios'}</div>
          <div class="wk-list">${rows || '<div class="card empty">Nenhum exercício. Toque no lápis para montar o treino.</div>'}</div></div>
          <div class="footer wk-foot">${footer}</div>`;
      },
      actions: {
        back: pop,
        edit: () => { const fw = Store.findWorkout(wid); push(Screens.WorkoutEditor(fw.plan.id, wid)); },
        switchW: () => pickWorkout(wid),
        open: (ds) => UI.replace(WorkoutScreen(ds.id), 1),
        start: () => {
          const fw = Store.findWorkout(wid);
          if (!fw.workout.items.length) { toast('Adicione exercícios primeiro'); return; }
          beginWorkout(wid, null);
        },
        quick: () => quickSheet(wid),
        continue: () => { const s = currentSession(Store.findWorkout(wid).workout); if (s.finished || Date.now() - Store.lastActivity(s) > 20 * 60000) Store.resumeSession(s); else { Store.state.activeSessionId = s.id; Store.save(); } push(Player(s.id, firstOpenIndex(s))); },
        summary: () => { const st = Store.workoutStatus(Store.findWorkout(wid).workout); push(Screens.SessionDetail(st.session.id)); },
        item: (ds) => {
          const w = Store.findWorkout(wid).workout, cur = currentSession(w);
          if (cur) { if (cur.finished || Date.now() - Store.lastActivity(cur) > 20 * 60000) Store.resumeSession(cur); push(Player(cur.id, Number(ds.i))); }
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

  // Treino rápido: régua de tempo → encurta descanso e tira séries para caber (v0.45: régua).
  function quickSheet(wid) {
    const w = Store.findWorkout(wid).workout, full = estMinutes(w);
    let min = Math.max(10, Math.min(full - 1, Math.round(full * 0.66)));
    const hh = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const body = () => {
      const all = min >= full, q = all ? null : Store.quickPlan(w, min), est = all ? full : q.est;
      const rows = w.items.map((it, i) => { const e = Store.exercise(it.exId), a0 = Number(it.sets) || 1, n = all ? a0 : q.sets[i]; return `<div class="pq-row">${thumb(e)}<span class="nm">${esc(e.nome)}</span><span class="st ${n < a0 ? 'cut' : ''}">${n < a0 ? `<s>${a0}×</s>` : ''}${n} ${n === 1 ? 'série' : 'séries'}</span></div>`; }).join('');
      return `<div class="pq-top"><div class="pq-big num">${est}<small>min</small></div><div class="pq-end">termina por volta das<b class="num">${hh(new Date(Date.now() + est * 60000))}</b></div></div>
        <div class="pq-sum"><span>${icon('check', 'sm')}todos os ${w.items.length} exercícios</span>${all ? '<span>treino inteiro</span>' : `<span>descanso ${Math.round(q.restF * 100)}%</span>${q.cut ? `<span>${q.cut} ${q.cut === 1 ? 'série' : 'séries'} a menos</span>` : ''}${q.est > min + 2 ? '<span>não coube todo</span>' : ''}`}</div>
        <div class="pq-list">${rows}</div>
        <button class="btn lime block pl-create" style="margin-top:14px" data-a="go">${icon('play', 'sm')}${all ? 'Começar o treino inteiro' : 'Começar com ' + est + ' min'}</button>`;
    };
    const ticks = [10, 15, 20, 25, 30, 40, 50].filter((m) => m < full - 3).concat([full]);
    const pc = (v) => ((v - 10) / Math.max(1, full - 10)) * 100;
    sheet({
      render: () => `<h3>Pouco tempo hoje?</h3><div class="desc" style="margin-bottom:6px">Treino completo: ~${full} min. Arraste para o tempo que você tem.</div>
        <div class="pq-rule"><input type="range" min="10" max="${full}" step="1" value="${min}" data-in="m" style="--p:${pc(min)}%">${ticks.map((m) => `<span class="tk" style="left:${pc(m)}%">${m === full ? m + ' (todo)' : m}</span>`).join('')}</div>
        <div id="pqBody">${body()}</div>
        <div class="pq-note">Os exercícios com mais séries perdem uma primeiro; nenhum sai do treino.</div>`,
      actions: {
        m: (ds, el) => { min = Number(el.value); el.style.setProperty('--p', pc(min) + '%'); const box = document.getElementById('pqBody'); if (box) box.innerHTML = body(); },
        go: () => { const m = min; closeSheet(); setTimeout(() => beginWorkout(wid, m >= full ? null : m), 300); },
      },
    });
  }

  // Como você está hoje: um toque (3 rostos), uma vez por dia. "Detalhar" abre sono, energia e dor.
  const FACES = [
    { nome: 'Cansado', sub: 'dormi mal / dolorido', c: { sono: 0, energia: 0, dor: 1 } },
    { nome: 'Normal', sub: 'como sempre', c: { sono: 1, energia: 1, dor: 2 } },
    { nome: 'Ótimo', sub: 'com energia', c: { sono: 2, energia: 2, dor: 2 } },
  ];
  const face = (m) => `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="16" r="2" fill="currentColor"/><circle cx="26" cy="16" r="2" fill="currentColor"/>${m === 0 ? '<path d="M13 28q7-6 14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : m === 1 ? '<path d="M13 26h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M12 24q8 7 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}</svg>`;
  function checkinSheet(go) {
    const S = Store.state.settings, today = Store.iso(Store.today());
    // Só uma vez por dia: no segundo treino do dia, vale a resposta da primeira vez.
    if (S.checkinLast && S.checkinLast.date === today) { go(S.checkinLast.c); return; }
    let c = Object.assign({}, FACES[1].c), pick = 1, detail = false;
    const Q = [['sono', 'Sono', ['Ruim', 'Ok', 'Bom']], ['energia', 'Energia', ['Baixa', 'Ok', 'Alta']], ['dor', 'Dor muscular', ['Muita', 'Pouca', 'Nenhuma']]];
    const remember = (v) => { S.checkinLast = { date: today, c: v }; Store.save(); };
    sheet({
      render: () => {
        const lv = Store.checkinLevel(c);
        const tip = lv >= 2 ? '10% menos carga e uma série a menos nos exercícios com 3 ou mais.' : '10% menos carga hoje.';
        return `<h3>Como você está hoje?</h3><div class="desc">Um toque. Se o dia estiver ruim, o app alivia o treino.</div>
          ${detail ? Q.map(([k, l, o]) => `<div class="ck-q"><span>${l}</span><div class="opts">${o.map((t, v) => `<button class="${c[k] === v ? 'on' : ''}" data-a="v" data-k="${k}" data-v="${v}">${face(v)}${t}</button>`).join('')}</div></div>`).join('')
            : `<div class="ck-faces">${FACES.map((f, i) => `<button class="${pick === i ? 'on' : ''}" data-a="f" data-i="${i}">${face(i)}<b>${f.nome}</b>${f.sub}</button>`).join('')}</div>
               <button class="ck-more" data-a="more">${icon('down', 'sm')}Detalhar (sono, energia e dor)</button>`}
          ${lv ? `<div class="ck-sug">${icon('sparkle', 'sm')} <b>Sugestão para hoje:</b> ${tip}</div>
            <div class="ck-btns"><button class="btn ghost" data-a="normal">Treinar normal</button><button class="btn lime pl-create" data-a="adj">Aliviar hoje</button></div>`
          : `<button class="btn lime block pl-create" style="margin-top:16px" data-a="normal">Começar treino</button>`}
          <div class="row" style="justify-content:space-between;margin-top:12px"><button class="link small muted" data-a="skip">Pular</button><button class="link small muted" data-a="never">Não perguntar mais</button></div>`;
      },
      actions: {
        f: (ds) => { pick = Number(ds.i); c = Object.assign({}, FACES[pick].c); Native.vibrate(6); sheetRefresh(); },
        more: () => { detail = true; sheetRefresh(); },
        v: (ds) => { c[ds.k] = Number(ds.v); Native.vibrate(6); sheetRefresh(); },
        adj: () => { remember(c); closeSheet(); go(c); },
        normal: () => { const v = Object.assign({}, c, { forceNormal: true }); remember(v); closeSheet(); go(v); },
        skip: () => { closeSheet(); go(null); },
        never: () => { S.checkin = false; Store.save(); closeSheet(); toast('Não vou mais perguntar. Dá para ligar de novo em Configurações.'); go(null); },
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

  // Dor ou incômodo: onde e quanto. Forte → sugere parar e trocar o exercício.
  function painSheet(s, it, done) {
    const exId = Store.exOf(s, it), ex = Store.exercise(exId);
    let where = null, lvl = 0, note = '';
    const LC = ['#d9b25f', '#d0803e', '#c8574b'];
    sheet({
      render: () => `<h3>Dor ou incômodo</h3><div class="desc">Em ${esc(ex.nome)}. Fica registrado; se repetir, o app avisa e sugere alternativas.</div>
        <div class="fx-cap">Onde?</div><div class="fx-grid">${Store.PAIN_SPOTS.map((p) => `<button class="${where === p ? 'on' : ''}" data-a="w" data-v="${p}">${p}</button>`).join('')}</div>
        <div class="fx-cap">Quanto?</div><div class="fx-lv">${Store.PAIN_LEVELS.map((l, v) => `<button class="${lvl === v ? 'on' : ''}" data-a="l" data-v="${v}" style="--lc:${LC[v]}">${l}<i></i></button>`).join('')}</div>
        <div class="fx-cap">Observação (opcional)</div><input class="input" data-in="n" value="${esc(note)}" placeholder="Ex.: na descida, pegada aberta">
        <div class="fx-btns wide"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime pl-create" data-a="ok" ${where ? '' : 'disabled'}>Registrar</button></div>`,
      actions: {
        no: closeSheet,
        w: (ds) => { where = ds.v; Native.vibrate(6); sheetRefresh(); },
        l: (ds) => { lvl = Number(ds.v); Native.vibrate(6); sheetRefresh(); },
        n: (ds, el) => { note = el.value; },
        ok: () => {
          if (!where) return;
          Store.addPain({ exId, sessionId: s.id, where, lvl, note });
          closeSheet(); done();
          if (lvl === 2) setTimeout(() => UI.confirmSheet('Dor forte', `Melhor parar ${esc(ex.nome)} por hoje. Quer trocar por outro exercício para o mesmo músculo? Se a dor for aguda ou continuar, procure um profissional.`, 'Trocar exercício', () => Tools.swapSheet(s, it, done)), 380);
          else toast('Registrado. Se repetir, eu aviso.');
        },
      },
    });
  }
  // Dor repetida: alternativas.
  function painAlertSheet(s, it, done) {
    const exId = Store.exOf(s, it), ex = Store.exercise(exId), pa = Store.painAlert(exId, s.id);
    const list = Store.painsFor(exId).slice(-5).reverse();
    sheet({
      render: () => `<h3>${esc(pa ? pa.where : 'Incômodo')} incomodando</h3><div class="desc">${esc(ex.nome)} causou incômodo ${pa ? pa.n : ''} vezes recentemente. Algumas saídas:</div>
        <div class="list">
          <button class="menu-item" data-a="swap"><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Trocar o exercício<div class="small muted">Outro para o mesmo músculo, com outro ângulo</div></span></button>
          <button class="menu-item" data-a="light"><span class="ic">${icon('minus', 'sm')}</span><span class="grow">Fazer hoje com 20% menos carga<div class="small muted">Nas séries que faltam</div></span></button>
          <button class="menu-item" data-a="ignore"><span class="ic">${icon('x', 'sm')}</span><span class="grow">Ignorar por agora<div class="small muted">Avisa de novo se houver outro registro</div></span></button>
        </div>
        <div class="caps" style="margin:16px 2px 6px">Registros</div>${list.map((p) => `<div class="kv"><span>${shortDateBR(p.date)} · ${esc(p.where)}</span><span class="small ${p.lvl === 2 ? 'late-txt' : 'muted'}">${Store.PAIN_LEVELS[p.lvl]}${p.note ? ' · ' + esc(p.note) : ''}</span></div>`).join('')}
        <div class="tiny muted" style="margin-top:12px">Se a dor for aguda ou continuar, procure um profissional de saúde.</div>`,
      actions: {
        swap: () => { closeSheet(); setTimeout(() => Tools.swapSheet(s, it, done), 380); },
        light: () => { s.sets.filter((x) => x.itemId === it.id && !x.done && Number(x.kg) > 0).forEach((x) => { x.kg = Math.round(x.kg * 0.8 * 2) / 2; }); Store.save(); closeSheet(); toast('Carga reduzida em 20% nas séries que faltam'); done(); },
        ignore: () => { Store.snoozePain(exId); closeSheet(); done(); },
      },
    });
  }
  const shortDateBR = (d) => d.split('-').reverse().slice(0, 2).join('/');

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

  // Escolher outro treino do plano: lista informativa (músculos, tempo, estado; atrasados primeiro; aviso de músculo de ontem).
  function pickWorkout(currentId, title) {
    const p = Store.activePlan(); if (!p) return;
    const t = Store.today(), dow = t.getDay(), yIso = Store.iso(Store.addDays(t, -1)), tIso = Store.iso(t);
    const yGroups = new Set(Store.state.sessions.filter((x) => x.date === yIso).flatMap((x) => x.sets.filter((y) => y.done).map((y) => (Store.exercise(y.exId) || {}).grupo)).filter(Boolean));
    const groupsOf = (w) => [...new Set(w.items.map((x) => Store.exercise(x.exId).grupo).filter(Boolean))];
    const rank = (o) => (o.st.status === 'late' ? 0 : o.w.days.includes(dow) && o.st.status !== 'done' ? 1 : o.st.status === 'done' ? 3 : 2);
    const list = p.workouts.map((w, i) => ({ w, i, st: Store.workoutStatus(w) })).sort((a, b) => rank(a) - rank(b) || a.i - b.i);
    const rec = list.find((o) => o.st.status === 'late');
    const row = (o) => {
      const { w, st } = o, g = groupsOf(w), rep = g.filter((x) => yGroups.has(x));
      const done = st.status === 'done', late = st.status === 'late', today = w.days.includes(dow) && !done;
      const dd = st.session && st.session.date;
      const tag = done ? `<span class="wk-tag ok">${dd === yIso ? 'Feito ontem' : dd === tIso ? 'Feito hoje' : 'Feito'}</span>` : late ? '<span class="wk-tag late">Atrasado</span>' : today ? '<span class="wk-tag fill">Hoje</span>' : st.status === 'partial' ? `<span class="wk-tag warn">${st.p.complete}/${st.p.total}</span>` : icon('next', 'sm');
      return `<button class="tt-row press ${o === rec ? 'rec' : ''} ${w.id === currentId ? 'cur' : ''}" data-a="pick" data-id="${w.id}"><span class="lt ${done ? 'ok' : late ? 'late' : today ? 'on' : ''}">${esc(w.letter)}</span><span class="g"><b class="ellipsis">${esc(w.name)}</b><small>${esc(g.slice(0, 3).join(', ') || w.items.length + ' exercícios')} · ~${estMinutes(w)} min${w.id === currentId ? ' · aberto agora' : ''}</small>${rep.length && !done ? `<span class="tt-warn">${icon('alert', 'sm')}${esc(rep.join(' e '))} ${rep.length > 1 ? 'foram treinados' : 'foi treinado'} ontem</span>` : ''}</span>${tag}</button>`;
    };
    sheet({
      render: () => `<h3>${title || 'Trocar de treino'}</h3><div class="desc">Escolha o treino que você vai fazer agora.</div>
        ${list.map(row).join('')}<div class="tt-warn" style="color:var(--text-2);margin-top:4px">${icon('info', 'sm')}Atrasados primeiro; aviso quando repete músculos de ontem.</div>`,
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

  // Jeito do treino de hoje (rápido, aliviado, semana leve): um selo ao lado do cronômetro, para o treino todo.
  function modeChip(s) {
    const m = [];
    if (s.quick) m.push('Rápido');
    if (s.checkin && s.checkin.adj && !s.deload) m.push(m.length ? 'aliviado' : 'Aliviado');
    if (s.deload) m.push(m.length ? 'semana leve' : 'Semana leve');
    return m.length ? `<span class="av-top" data-a="modeInfo">${m.join(' · ')}</span>` : '';
  }
  function Player(sid, startIdx) {
    let idx = startIdx || 0, elapsedT = null, scrollT = null, rirFor = null, rirT = null;
    const avOpen = {}; // itens com "ver todos" aberto
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
        <div class="stepper"><button data-a="kgm" data-set="${x.id}">${icon('minus', 'sm')}</button><div class="val" data-a="kgEdit" data-set="${x.id}"><b class="num">${kgVal(x.kg)}</b><small>${kgSmall}</small>${x.upFrom != null && Number(x.kg) > x.upFrom ? `<span class="av-up">↑ ${nf(Number(x.kg) - x.upFrom)}</span>` : ''}</div><button data-a="kgp" data-set="${x.id}">${icon('plus', 'sm')}</button></div>
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
      // v0.45: avisos inteligentes. Um por vez (dor → sem evoluir → subir carga); os outros em "ver todos".
      // Dourado = oportunidade (subir carga, com "Aplicar"); laranja = atenção (dor, sem evoluir, com "Ver").
      const live = !s.finished && Store.state.activeSessionId === s.id;
      const showSug = sug && !s.deload && !(s.rangeSkip || {})[it.id] && sets.some((x) => !x.done && !x.warm && x.kg < sug.to);
      const stall = live && !s.deload && !pr.complete && Store.stallOf(exId, s.id);
      const pa = live && Store.painAlert(exId, s.id);
      const av = [];
      if (pa) av.push({ warn: true, ic: 'alert', t: `${esc(pa.where)} incomodou ${pa.n} vezes aqui`, d: 'Veja alternativas que poupam a região', a: 'painAlert', b: 'Ver' });
      if (stall) av.push({ warn: true, ic: 'info', t: '3 treinos sem evoluir', d: 'Veja o que mudar para voltar a progredir', a: 'stall', b: 'Ver' });
      if (showSug) av.push({ ic: 'sparkle', t: `Hora de subir: ${kg(sug.to)}`, d: sug.why === 'range' ? `Você fez ${sug.hi} reps em todas as séries · depois volta para ${sug.lo}` : sug.why === 'rir' ? 'As séries foram tranquilas na última vez' : 'Você fez tudo nas 2 últimas vezes', a: 'applySug', b: 'Aplicar', kg: sug.to });
      const avCard = (v, k) => `<div class="av-one ${v.warn ? 'warn' : ''}" ${k ? 'style="margin-top:6px"' : ''}><span class="ic">${icon(v.ic, 'sm')}</span><span class="t"><b>${v.t}</b>${v.d}</span><button class="go" data-a="${v.a}" data-i="${i}"${v.kg ? ` data-kg="${v.kg}"` : ''}>${v.b}</button></div>`;
      const avHTML = !av.length ? '' : (avOpen[it.id] ? av.map(avCard).join('') : avCard(av[0], 0))
        + (av.length > 1 ? `<button class="av-more" data-a="avAll" data-i="${i}"><span>${avOpen[it.id] ? av.length + ' avisos neste exercício' : '+' + (av.length - 1) + (av.length > 2 ? ' avisos' : ' aviso') + ' neste exercício'}</span><b>${avOpen[it.id] ? 'recolher' : 'ver todos'}</b></button>` : '');
      const lastHTML = last ? `<div class="small faint" style="margin-top:10px">Última vez: ${last.map((x) => (x.time ? UI.secs(x.reps) : x.repsR != null && x.repsR !== x.repsL ? nf(x.kg) + '×' + x.repsR + '/' + x.repsL : Store.isBodyweight(x.exId) ? (Number(x.kg) ? (x.kg > 0 ? '+' : '−') + nf(Math.abs(x.kg)) + '×' : '') + x.reps : nf(x.kg) + '×' + x.reps)).join(' · ')}</div>` : '';
      const pin = Tools.pinOf(exId);
      const pending = items.findIndex((y) => !Store.itemProgress(s, y).complete);
      const doneBanner = live && pr.complete ? `<div class="done-banner" data-done-banner><span class="db-ic">${icon('check', 'sm')}</span><span class="grow"><b>Exercício finalizado</b><small>${sets.filter((x) => x.done).length} séries feitas${pending >= 0 ? ' · ainda faltam ' + items.filter((y) => !Store.itemProgress(s, y).complete).length + ' exercício(s)' : ' · treino completo'}</small></span>${pending >= 0 ? `<button data-a="go" data-i="${pending}">Ir ao próximo</button>` : `<button data-a="finish">Finalizar</button>`}</div>` : '';
      return `${doneBanner}<div class="player-img">${imgHTML(ex, '', true)}<div class="fade"></div><span class="chip count num">${i + 1} / ${items.length}</span>
          <div class="tools"><button data-a="howto" data-i="${i}">${icon('info', 'sm')}Como fazer</button><button data-a="video" data-i="${i}">${icon('video', 'sm')}Vídeo</button></div></div>
        <div class="ex-title">${esc(ex.nome)}</div>
        ${swapped ? `<div class="small" style="color:var(--gold);margin:-2px 0 6px">${icon('repeat', 'sm')} Trocado hoje (no plano: ${esc(Store.exercise(it.exId).nome)})</div>` : ''}
        <div class="plan-line"><span class="chip">${Tools.repsText(it, ex)}${it.tech && it.tech.id === 'r21' ? ' (7+7+7)' : ''}</span>${Tools.loadText(it.kg, ex) && !(it.tech && it.tech.id === 'w531') ? `<span class="chip">${Tools.loadText(it.kg, ex)}</span>` : ''}${Store.isCardio(ex) ? '' : `<button class="chip blue" data-a="restCfg" data-i="${i}">${icon('timer', 'sm')}Descanso ${restLabel(Store.restFor(s, it))}</button>`}${pr.complete ? `<span class="chip done">${icon('check', 'sm')}Concluído</span>` : ''}</div>
        ${pin ? `<button class="pin-note" data-a="pin" data-i="${i}">${icon('note', 'sm')}<span>${esc(pin)}</span></button>` : ''}
        <div class="quick-row">${ex.tipo === 'tempo' ? '' : `<button data-a="warm" data-i="${i}">${icon('flame', 'sm')}Aquecer</button>`}${ex.tipo === 'tempo' || Store.isCardio(ex) ? '' : `<button data-a="metro" data-i="${i}">${icon('timer', 'sm')}Metrônomo</button>`}<button data-a="swap" data-i="${i}">${icon('repeat', 'sm')}Trocar</button>${pin ? '' : `<button data-a="pin" data-i="${i}">${icon('note', 'sm')}Nota fixa</button>`}${live ? `<button data-a="pain" data-i="${i}">${icon('alert', 'sm')}Dor</button>` : ''}</div>
        ${techBanner(items, i)}
        ${it.note ? `<div class="small muted" style="margin-top:10px">${icon('note', 'sm')} ${esc(it.note)}</div>` : ''}
        ${avHTML}
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
      const nx = items[idx + 1] && Store.exercise(exIdOf(s, items[idx + 1]));
      return prev + `<button class="btn ${cur ? 'lime' : 'primary'} next-ex" data-a="next"><span class="nx-t">Próximo${nx ? ' · <b>' + esc(nx.nome) + '</b>' : ' exercício'}</span><span class="arrow">${icon('next', 'sm')}</span></button>`;
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
      if (i !== idx && Metro.running()) Metro.stop();
      idx = i; updateChrome();
    }
    // Barra do metrônomo (fase, segundo e repetição), por cima do rodapé.
    function paintMetro(st) {
      const bar = def.el && def.el.querySelector('[data-metro]'); if (!bar) return;
      def.el.classList.toggle('metro-on', !!st);
      if (!st) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      bar.className = 'metro-bar ph-' + st.ph;
      bar.innerHTML = `<span class="mb-ph">${st.label}</span><span class="mb-k num">${st.ph === 'prep' ? st.k : st.k + 1}</span><span class="grow mb-info">Rep <b class="num">${st.rep + (st.ph === 'prep' ? 0 : 1)}</b> · ${Metro.fmt(st.c)}</span><button class="icon-btn" data-a="metroStop" aria-label="Parar metrônomo">${icon('x', 'sm')}</button>`;
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
      if (rec) { UI.prBurst(rec.tipo, exName + ' · ' + rec.txt); Voice.say('Novo recorde no ' + exName + '!', 'recordes'); }
      if (Store.state.settings.askRir && !x.warm && !x.time && !x.sub) {
        // Com o descanso na tela, a pergunta aparece junto da barrinha; sem descanso, na própria série.
        setTimeout(() => {
          if (Rest.el && Rest.el.classList.contains('show') && Rest.askEffort(EFFORT, (v) => { x.rir = v; Store.save(); Native.vibrate(10); updatePage(i); })) return;
          rirFor = x.id; clearTimeout(rirT);
          rirT = setTimeout(() => { if (rirFor === x.id) { rirFor = null; updatePage(i); } }, 10000);
          updatePage(i);
        }, 60);
      }
      if (x.warm) { Rest.start(45, 'Aquecimento · ' + exName); return; }
      const allDone = items.every((y) => Store.itemProgress(s, y).complete);
      if (allDone) { Rest.stop(); toast('Treino completo! Toque em Finalizar'); Voice.say('Treino completo! Toque em finalizar.', 'resumo', rec ? 1800 : 0); return; }
      // Técnica com série extra logo em seguida (drop, rest-pause, myo-reps, cluster…)
      const mine = s.sets.filter((y) => y.itemId === it.id);
      const nextRow = mine.slice(mine.indexOf(x) + 1).find((y) => !y.done);
      const pause = TECH.pauseFor(it);
      if (nextRow && nextRow.sub && !nextRow.warm && nextRow.n === x.n && pause !== null && pause !== 'rest') {
        if (pause > 0) Rest.start(pause, 'Pausa · ' + nextRow.label);
        else { Rest.stop(); Native.pattern([0, 60, 60, 60]); toast('Sem descanso! ' + nextRow.label + ': ' + (Tools.loadText(nextRow.kg, nextRow.exId) || kg(0))); Voice.say('Sem descanso! ' + nextRow.label + (Tools.loadSpoken(nextRow.kg, nextRow.exId) ? ', ' + Tools.loadSpoken(nextRow.kg, nextRow.exId) : '') + '.', 'tecnicas'); }
        return;
      }
      // Bi-set, tri-set…: segue para o próximo exercício do grupo sem descanso
      const g = TECH.groupOf(items, i);
      if (g && i < g.end && !Store.itemProgress(s, items[i + 1]).complete) {
        Rest.stop();
        toast('Sem descanso: ' + Store.exercise(exIdOf(s, items[i + 1])).nome);
        Voice.say('Sem descanso: agora ' + Store.exercise(exIdOf(s, items[i + 1])).nome + '.', 'tecnicas');
        setTimeout(() => go(i + 1), 380);
        return;
      }
      if (Store.isCardio(exIdOf(s, it))) { Rest.stop(); if (!wasComplete && Store.itemProgress(s, it).complete) toast('Cardio concluído'); return; }
      // Troca de exercício: depois da última série (do exercício, ou do grupo inteiro num bi-set), descanso maior.
      const doneNow = !wasComplete && Store.itemProgress(s, it).complete;
      const groupDone = !g || [...Array(g.size).keys()].every((k) => Store.itemProgress(s, items[g.start + k]).complete);
      const swap = doneNow && groupDone ? Store.swapFor(s, it) : 0;
      if (swap) {
        const nx = [...items.keys()].filter((k) => k > i).concat([...items.keys()].filter((k) => k < i)).find((k) => !Store.itemProgress(s, items[k]).complete);
        if (nx != null) {
          const nextName = Store.exercise(exIdOf(s, items[nx])).nome;
          Rest.start(swap, exName, { swap: true, next: nextName });
          if (!rec) toast('Exercício concluído');
          return;
        }
      }
      // "A seguir": a próxima série deste exercício (carga × reps) ou o próximo exercício.
      const nr = s.sets.filter((y) => y.itemId === it.id && !y.done && !y.warm)[0];
      let after = null;
      if (nr) { const ld = Tools.loadText(nr.kg, exIdOf(s, it)); after = { head: 'A seguir · série ' + nr.n, detail: (ld ? ld + ' × ' : '') + (nr.reps || '') + (ld ? '' : ' reps') }; }
      else { const nx = [...items.keys()].filter((k) => k > i).concat([...items.keys()].filter((k) => k < i)).find((k) => !Store.itemProgress(s, items[k]).complete); if (nx != null) after = { head: 'A seguir', detail: Store.exercise(exIdOf(s, items[nx])).nome }; }
      Rest.start(Store.restFor(s, it), exName, after);
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
          <div class="grow"><h1>Treino ${esc(w.letter)}</h1><div class="timer-pill">${icon('clock', 'sm')}<span class="num" data-elapsed>${clock(Store.activeMs(s))}</span>${modeChip(s)}</div></div>
          <button class="btn sm lime" data-a="finish">Finalizar</button></div>
          <div class="session-head"><div class="segs" style="display:flex;gap:4px">${segs()}</div></div>
          <div class="pager">${items.map((_, i) => `<div class="page">${pageHTML(i)}</div>`).join('')}</div>
          <div class="metro-bar" data-metro hidden></div>
          <div class="footer">${footerHTML()}</div>`;
      },
      after(el) {
        const pager = el.querySelector('.pager');
        requestAnimationFrame(() => { pager.scrollLeft = idx * pager.clientWidth; });
        pager.addEventListener('scroll', () => {
          clearTimeout(scrollT);
          scrollT = setTimeout(() => {
            const i = Math.round(pager.scrollLeft / pager.clientWidth);
            if (i !== idx) { if (Metro.running()) Metro.stop(); idx = i; updateChrome(); }
          }, 60);
        }, { passive: true });
        Native.keepOn(true);
        const s0 = Store.session(sid);
        if (s0 && s0.autoUp && s0.autoUp.length && !s0.autoUpShown) {
          s0.autoUpShown = true; Store.save();
          setTimeout(() => toast(s0.autoUp.length === 1 ? 'Faixa completa: ' + Store.exercise(s0.autoUp[0].exId).nome + ' subiu para ' + kg(s0.autoUp[0].to) + ' × ' + s0.autoUp[0].lo : s0.autoUp.length + ' exercícios subiram de carga (faixa de repetições completa)'), 600);
        }
        clearInterval(elapsedT);
        elapsedT = setInterval(() => { const e = el.querySelector('[data-elapsed]'); const s = Store.session(sid); if (e && s) e.textContent = clock(Store.activeMs(s)); }, 1000);
      },
      leave() { Metro.stop(); clearInterval(elapsedT); clearTimeout(rirT); Native.keepOn(false); },
      actions: {
        back: pop,
        go: (ds) => go(Number(ds.i)),
        prev: () => go(idx - 1),
        next: () => go(idx + 1),
        metro: (ds) => {
          const { s, items } = ctx(), it = items[Number(ds.i)], exId = exIdOf(s, it);
          Metro.sheet(it, exId, (c, m) => Metro.start({ c, mode: m, exId, onTick: paintMetro }));
        },
        metroStop: () => Metro.stop(),
        toggle: (ds) => {
          const { s, x, i, it } = findSet(ds.set);
          if (Metro.running()) Metro.stop();
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
          const bar = /barra|smith/i.test(ex.equip || '');
          numberSheet('Carga · ' + (x.sub ? x.label : 'série ' + x.n), x.kg, 0.5, (v) => adjust(ds.set, 'kg', 0, v), 'kg', (v) => (bar ? Tools.platesHTML(v) : '') + Tools.pctChips(ex.id));
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
          s.sets.filter((x) => x.itemId === it.id && !x.done && !x.warm && !x.sub).forEach((x) => { if (x.upFrom == null) x.upFrom = Number(x.kg); x.kg = Number(ds.kg); });
          Store.save(); updatePage(Number(ds.i)); toast('Carga atualizada para ' + kg(ds.kg));
        },
        pain: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); painSheet(s, items[i], () => updatePage(i)); },
        painAlert: (ds) => { const { s, items } = ctx(); const i = Number(ds.i); painAlertSheet(s, items[i], () => updatePage(i)); },
        modeInfo: () => { const { s } = ctx(); const t = []; if (s.quick) t.push(`<b>Treino rápido (~${s.quick.min} min):</b> descanso mais curto e menos séries.`); if (s.checkin && s.checkin.adj && !s.deload) t.push(`<b>Treino aliviado:</b> 10% menos carga${s.checkin.adj >= 2 ? ' e uma série a menos' : ''}, porque o dia está puxado.`); if (s.deload) t.push('<b>Semana leve:</b> menos séries e 10% menos carga para o corpo recuperar.'); sheet({ render: () => `<h3>Treino de hoje</h3>${t.map((x) => `<div class="suggest" style="margin-top:10px">${icon('sparkle', 'sm')}<span>${x}</span></div>`).join('')}<button class="btn lime block pl-create" style="margin-top:16px" data-a="ok">Entendi</button>`, actions: { ok: closeSheet } }); },
        avAll: (ds) => { const { items } = ctx(); const i = Number(ds.i), id = items[i].id; avOpen[id] = !avOpen[id]; updatePage(i); },
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
          <div class="tiles"><div class="card tile"><div class="v num">${clock(Store.activeMs(s))}</div><div class="l">Duração</div></div><div class="card tile"><div class="v num">${pr.setsDone}<small>/${pr.setsTotal}</small></div><div class="l">Séries</div></div><div class="card tile"><div class="v num">${volume(Store.sessionVolume(s))}</div><div class="l">Volume</div></div></div>
          <div class="field"><label>Como foi o treino?</label><div class="feel">${FEEL.map(([v, l]) => `<button class="${String(feel) === v ? 'on' : ''}" data-a="feel" data-v="${v}"><b>${v}</b>${l}</button>`).join('')}</div></div>
          <div class="field"><label>Observação geral (opcional)</label><textarea class="note-field" data-in="note" placeholder="Ex.: dormi mal, treino rendeu menos">${esc(note)}</textarea></div>
          <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Voltar</button><button class="btn lime" data-a="ok">Salvar treino</button></div>
          <button class="discard-link" data-a="discard">${icon('trash', 'sm')}Cancelar treino sem salvar</button>`;
      },
      actions: {
        // Cancelar: apaga este treino inteiro (séries, notas, tempo), como se não tivesse começado.
        discard: () => confirmDiscard(sid),
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

  function confirmDiscard(sid) {
    const s = Store.session(sid), done = s ? s.sets.filter((x) => x.done).length : 0;
    UI.confirmSheet('Cancelar treino?', `Nada deste treino fica salvo${done ? `: as <b>${done} séries</b> feitas, as notas e o tempo são apagados` : ''}. O treino volta a ficar pendente na semana.`, 'Cancelar treino', () => {
      Store.deleteSession(sid); Rest.stop(); Live.tick(); Screens.syncNative();
      popTo(1); UI.switchTab('home', true); toast('Treino cancelado. Nada foi salvo.');
    }, true);
  }

  // v0.45: comemoração em tela cheia. Selo grande, 3 números, destaques curtos (recordes antes → agora,
  // no máximo uma conquista e "e mais N") e Compartilhar como botão principal.
  function celebrate(s) {
    const pr = Store.sessionProgress(s);
    const recs = Store.sessionRecords(s);
    const medals = Analytics.newMedals();
    Screens.syncNative();
    const complete = pr.complete >= pr.total;
    Native.pattern([0, 40, 60, 40]);
    Voice.say((complete ? 'Treino concluído! ' : 'Treino salvo. ') + Store.sessionDuration(s) + ' minutos, ' + pr.setsDone + ' séries.' + (recs.length ? ' ' + recs.length + (recs.length > 1 ? ' recordes!' : ' recorde!') : ''), 'resumo');
    const fw = Store.findWorkout(s.workoutId), w = fw && fw.workout;
    const wk = Store.weekRange();
    const nWeek = Store.state.sessions.filter((x) => x.date >= wk.startISO && x.date <= wk.endISO && x.start <= s.start && x.sets.some((y) => y.done)).length;
    const vol = Store.sessionVolume(s), pv = prevVolume(s);
    const up = pv ? Math.round((vol / pv - 1) * 100) : null;
    const hl = recs.slice(0, 3).map((r) => `<div class="fm-hl"><span class="ic">${icon('trophy', 'sm')}</span><span class="g"><b>Recorde no ${esc(Store.exercise(r.exId).nome)}</b><small>antes ${kg(r.prev)}</small></span><span class="r num">${kg(r.kg)}</span></div>`).join('')
      + (recs.length > 3 ? `<div class="small muted" style="margin:-2px 2px 8px">e mais ${recs.length - 3} ${recs.length - 3 > 1 ? 'recordes' : 'recorde'}</div>` : '')
      + (medals.length ? `<div class="fm-hl"><span class="ic">${icon('star', 'sm')}</span><span class="g"><b>Conquista: ${esc(medals[0].nome)}</b><small>${medals.length > 1 ? 'e mais ' + (medals.length - 1) + (medals.length > 2 ? ' conquistas novas' : ' conquista nova') : esc(medals[0].desc)}</small></span></div>` : '');
    const el = document.createElement('div');
    el.className = 'fm-full';
    el.innerHTML = `<div class="fm-in"><div class="fm-badge">${icon(complete ? 'check' : 'flame', 'lg')}</div><div class="fm-h">${complete ? 'Treino concluído!' : 'Treino salvo'}</div>
      <div class="fm-sub">${w ? 'Treino ' + esc(w.letter) + ' · ' + esc(w.name) : ''}${complete ? (nWeek ? ' · ' + nWeek + 'º treino da semana' : '') : ' · ' + pr.complete + ' de ' + pr.total + ' exercícios'}</div>
      <div class="fm-tiles"><div><b class="num">${Store.sessionDuration(s)}</b><small>minutos</small></div><div><b class="num">${pr.setsDone}</b><small>séries</small></div><div><b class="num">${volume(vol)}</b><small>volume</small>${up != null && up !== 0 ? `<span class="up ${up < 0 ? 'down' : ''}">${up > 0 ? '↑' : '↓'} ${Math.abs(up)}%</span>` : ''}</div></div>
      ${hl ? `<div class="fm-cap">Destaques</div>${hl}` : `<div class="fm-quote">${complete ? 'Mais um na conta. Consistência é tudo.' : 'Dá para continuar depois, na tela do treino.'}</div>`}</div>
      <div class="fm-btns"><button class="btn ghost" data-fm="ok">Fechar</button><button class="btn lime pl-create" data-fm="share">${icon('share', 'sm')}Compartilhar</button></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    const close = () => { if (!el.parentNode) return false; el.classList.remove('show'); setTimeout(() => el.remove(), 320); UI.overlayBack = null; if (window.News) setTimeout(() => News.afterWorkout(), 350); return true; };
    UI.overlayBack = close;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fm]'); if (!b) return;
      if (b.dataset.fm === 'share') { toast('Gerando imagem…'); Screens.shareSession(s.id); } else close();
    });
  }

  window.Screens = Object.assign(window.Screens || {}, { finishSheet, firstOpenIndex, Home, WorkoutScreen, Player, trainNow, emblem, techSheet, techChips, restSheet, STATUS, daysText, estMinutes });
})();
