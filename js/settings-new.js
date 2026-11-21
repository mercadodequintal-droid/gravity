// v0.48 · Configurações (menu com busca, atalhos e 6 subtelas) e Perfil (carteira do atleta, Editar perfil,
// Conta Gravity e Dados e privacidade). Aprovados em 14/11 (docs/referencias/configuracoes-* e perfil-*).
// Substitui Screens.Settings de screens-manage.js. Todas as opções antigas continuam, só mudaram de lugar.
(function () {
  'use strict';
  const { icon, esc, nf, restLabel, Native, toast, push, pop, refresh, sheet, closeSheet, confirmSheet } = UI;
  const S = () => Store.state;
  const st = () => S().settings;
  const topbar = (title) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${title}</h1></div>`;
  const dateBR = (ts) => new Date(ts).toLocaleDateString('pt-BR');

  // ---------- peças comuns ----------
  const stepRow = (label, sub, key, d, fmt, min, cls) => `<div class="switch-row ${cls || ''}" data-row="${key}"><div class="grow"><div>${label}</div><div class="small muted">${sub}</div></div><div class="stepper cf-step"><button data-a="st" data-k="${key}" data-d="${-d}" data-min="${min}" aria-label="Diminuir">${icon('minus', 'sm')}</button><div class="val"><b class="num">${fmt(st()[key])}</b></div><button data-a="st" data-k="${key}" data-d="${d}" data-min="${min}" aria-label="Aumentar">${icon('plus', 'sm')}</button></div></div>`;
  const sw = (label, sub, key) => `<div class="switch-row" data-row="${key}" data-a="sw" data-k="${key}"><div class="grow"><div>${label}</div><div class="small muted">${sub}</div></div><div class="switch ${st()[key] ? 'on' : ''}"></div></div>`;
  const link = (a, ic, label, sub, row) => `<button class="menu-item" data-a="${a}" ${row ? `data-row="${row}"` : ''}><span class="ic">${icon(ic, 'sm')}</span><span class="grow">${label}${sub ? `<div class="small muted">${sub}</div>` : ''}</span>${icon('next', 'sm')}</button>`;
  const cap = (t) => `<div class="cf-cap">${t}</div>`;
  const box = (html) => `<div class="card cf-box">${html}</div>`;

  // Ações compartilhadas pelas subtelas.
  const common = {
    back: pop,
    st: (ds) => { st()[ds.k] = Math.max(Number(ds.min), Math.round((Number(st()[ds.k]) + Number(ds.d)) * 10) / 10); Store.save(); Native.vibrate(6); refresh(); UI.savedFlash(); },
    sw: (ds) => {
      st()[ds.k] = !st()[ds.k]; Store.save();
      if (ds.k === 'reminder') { Screens.syncNative(); if (st().reminder) toast('Lembrete às ' + st().reminderTime + ' nos dias do plano'); else UI.savedFlash(); } else UI.savedFlash();
      refresh();
    },
  };

  // ---------- resumos ----------
  const planDays = () => { const p = Store.activePlan(); const set = new Set(); if (p) p.workouts.forEach((w) => (w.days || []).forEach((d) => set.add(d))); return set; };
  function nextReminder() {
    const days = planDays(); if (!st().reminder || !days.size) return null;
    const now = new Date(), [hh, mm] = String(st().reminderTime || '18:00').split(':').map(Number);
    for (let i = 0; i < 8; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i); d.setHours(hh, mm, 0, 0);
      if (days.has(d.getDay()) && d > now) return i === 0 ? 'hoje' : i === 1 ? 'amanhã' : Store.WEEKDAYS_LONG[d.getDay()].toLowerCase();
    }
    return null;
  }
  const voiceSum = () => (Voice.cfg().on ? Voice.count() + ' de ' + Voice.OPTS.length + ' avisos' : 'Desligada · só os bipes');
  const backupSum = () => (st().lastBackup ? 'Último backup: ' + dateBR(st().lastBackup) : 'Nenhum backup ainda');
  const appSum = () => 'v' + News.VERSION + (Updater.available ? ' · nova versão ' + esc(Updater.available.versionName) : '');

  // ---------- busca ----------
  // [texto, palavras relacionadas, subtela, linha]
  const INDEX = [
    ['Descanso padrão', 'descanso pausa intervalo tempo', 'treino', 'restDefault'],
    ['Ajuste do timer', 'timer cronometro botoes', 'treino', 'restStep'],
    ['Troca de exercício', 'troca aparelho descanso extra', 'treino', 'restSwap'],
    ['Incremento de carga', 'carga peso kg aumento', 'treino', 'incKg'],
    ['Peso da barra', 'barra anilhas calculadora', 'treino', 'bar'],
    ['Semana começa', 'semana segunda domingo', 'treino', 'weekStart'],
    ['Sugerir aumento de carga', 'sugestao progressao rir', 'treino', 'suggest'],
    ['Progressão pela faixa', 'faixa repeticoes progressao automatica', 'treino', 'rangeMode'],
    ['Perguntar como você está hoje', 'check-in sono energia dor', 'treino', 'checkin'],
    ['Perguntar como foi a série', 'esforco rir limite pesado tranquilo', 'treino', 'askRir'],
    ['Minha academia', 'academia aparelhos maquinas', 'treino', 'gym'],
    ['Tema', 'tema cor aparencia dourado galaxia titanio azul luana atelier', 'aparencia', 'theme'],
    ['Abertura animada', 'abertura scouter splash entrada', 'aparencia', 'splash'],
    ['Voz no treino', 'voz fala avisos', 'voz', 'voice'],
    ['Som no fim do descanso', 'som bipe beep', 'voz', 'sound'],
    ['Vibração', 'vibrar vibracao', 'voz', 'vibrate'],
    ['Lembrar de treinar', 'lembrete notificacao aviso', 'lembretes', 'reminder'],
    ['Horário do lembrete', 'horario hora lembrete', 'lembretes', 'rtime'],
    ['Aviso na pulseira ou relógio', 'pulseira relogio galaxy watch fit', 'lembretes', 'band'],
    ['Verificar atualizações', 'atualizar versao update', 'app', 'checkUpdate'],
    ['Avisar quando sair versão nova', 'atualizacao aviso', 'app', 'updateCheck'],
    ['Novidades', 'novidades versao changelog', 'app', 'news'],
    ['Você sabia?', 'dicas funcoes', 'app', 'tips'],
    ['Sugestões e problemas', 'sugestao problema erro bug elogio feedback opiniao', 'app', 'feedback'],
    ['Backup automático semanal', 'backup copia automatico', 'dados', 'autoBackup'],
    ['Fazer backup', 'backup exportar salvar copia drive', 'dados', 'export'],
    ['Restaurar backup', 'restaurar importar', 'dados', 'import'],
    ['Dados de exemplo', 'exemplo demo teste graficos', 'dados', 'demo'],
    ['Apagar tudo', 'apagar resetar limpar', 'menu', 'reset'],
    ['Perfil', 'perfil nome foto', 'perfil', ''],
    ['Conta Gravity', 'conta login entrar senha google sincronizar nuvem excluir conta', 'conta', ''],
  ];
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const CAT = { conta: 'Perfil', treino: 'Treino', aparencia: 'Aparência', voz: 'Voz no treino', lembretes: 'Lembretes', app: 'App', dados: 'Seus dados', menu: 'Configurações', perfil: 'Perfil' };

  // Abre uma subtela e destaca a linha pedida.
  function go(cat, row, label) {
    if (cat === 'perfil') { push(Profile2()); return; }
    if (cat === 'conta') { push(Account()); return; }
    if (cat === 'voz' && row === 'voice') { push(Screens.VoiceSettings()); return; }
    if (cat !== 'menu') push(Page(cat));
    if (row) setTimeout(() => News.spotlight('[data-row="' + row + '"]', label || ''), 380);
  }

  // ---------- menu principal ----------
  function Settings() {
    let q = '';
    const resHTML = () => {
      const n = norm(q).trim(); if (!n) return '';
      const hits = INDEX.filter(([t, k]) => norm(t + ' ' + k).includes(n));
      return hits.length ? `<div class="card cf-box cf-res">${hits.map(([t, , c, r]) => `<button class="menu-item" data-a="hit" data-c="${c}" data-r="${r}" data-t="${esc(t)}"><span class="grow">${esc(t)}<div class="small muted">${CAT[c]}</div></span>${icon('next', 'sm')}</button>`).join('')}</div>`
        : '<div class="small muted" style="padding:10px 4px">Nada encontrado. Tente outra palavra.</div>';
    };
    const def = {
      hideNav: true,
      render: () => {
        const rem = st().reminder ? esc(st().reminderTime) : 'Desligado';
        const cats = [
          ['treino', 'dumbbell', 'Treino', 'Descanso, carga, progressão e academia'],
          ['aparencia', 'sparkle', 'Aparência', Theme.current().nome],
          ['voz', 'play', 'Voz no treino', voiceSum()],
          ['lembretes', 'clock', 'Lembretes', st().reminder ? 'Ligado · ' + esc(st().reminderTime) : 'Desligado'],
          ['app', 'info', 'App', appSum()],
          ['dados', 'download', 'Seus dados', backupSum()],
        ];
        return topbar('Configurações') + `<div class="content cf-c">
          <button class="card cf-prof press" data-a="profile"><span class="av">${Profile.avatarHTML(30)}</span><span class="grow"><b class="ellipsis">${esc(st().name || 'Atleta')}</b><small>Ver perfil</small></span>${icon('next', 'sm')}</button>
          <label class="lb-search cf-search">${icon('search', 'sm')}<input type="search" placeholder="Buscar configuração" value="${esc(q)}" data-in="q"></label>
          <div data-res>${resHTML()}</div>
          <div class="cf-quick">
            <button class="card press" data-a="quick" data-c="treino" data-r="restDefault" data-t="Descanso padrão">${icon('timer', 'sm')}<span>Descanso</span><b class="num">${restLabel(st().restDefault)}</b></button>
            <button class="card press" data-a="quick" data-c="treino" data-r="incKg" data-t="Incremento de carga">${icon('weight', 'sm')}<span>Carga</span><b class="num">+${nf(st().incKg)} kg</b></button>
            <button class="card press" data-a="quick" data-c="lembretes" data-r="reminder" data-t="Lembrar de treinar">${icon('clock', 'sm')}<span>Lembrete</span><b class="num ${st().reminder ? '' : 'off'}">${rem}</b></button>
          </div>
          <div class="card cf-box">${cats.map(([c, ic, t, sub]) => `<button class="menu-item cf-cat" data-a="cat" data-c="${c}"><span class="ic">${icon(ic, 'sm')}</span><span class="grow"><b>${t}</b><div class="small muted">${sub}</div></span>${icon('next', 'sm')}</button>`).join('')}</div>
          <div class="card cf-box"><button class="menu-item danger" data-a="reset" data-row="reset"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Apagar tudo<div class="small muted">Planos, histórico e configurações</div></span>${icon('next', 'sm')}</button></div>
          <div class="tiny faint" style="text-align:center;margin-top:18px">Gravity · versão ${News.VERSION}</div></div>`;
      },
      actions: Object.assign({}, common, {
        profile: () => push(Profile2()),
        q: (ds, el) => { q = el.value; def.el.querySelector('[data-res]').innerHTML = resHTML(); },
        hit: (ds) => go(ds.c, ds.r, ds.t),
        quick: (ds) => go(ds.c, ds.r, ds.t),
        cat: (ds) => (ds.c === 'voz' ? push(Screens.VoiceSettings()) : push(Page(ds.c))),
        reset: () => confirmSheet('Apagar tudo?', 'Planos, histórico e exercícios criados serão apagados. Faça um backup antes, se quiser guardar.', 'Apagar tudo', () => { Store.reset(); UI.switchTab('home', true); toast('Dados apagados'); }, true),
      }),
    };
    return def;
  }

  // ---------- subtelas ----------
  function Page(cat) {
    const pages = {
      treino: () => `<div class="cf-sum">
          <div class="card"><span>Descanso</span><b class="num">${restLabel(st().restDefault)}</b></div>
          <div class="card"><span>Carga</span><b class="num">+${nf(st().incKg)} kg</b></div>
          <div class="card"><span>Semana</span><b class="num">${st().weekStart === 0 ? 'domingo' : 'segunda'}</b></div></div>
        ${cap('Tempos')}${box(stepRow('Descanso padrão', 'Para exercícios novos', 'restDefault', 15, restLabel, 15)
          + stepRow('Ajuste do timer', 'Botões +/− do descanso', 'restStep', 5, (v) => v + ' s', 5)
          + stepRow('Troca de exercício', 'A mais no descanso depois da última série de cada exercício', 'restSwap', 30, (v) => (Number(v) ? '+' + restLabel(Number(v)) : 'Igual'), 0, 'swap-row'))}
        ${cap('Carga e progressão')}${box(stepRow('Incremento de carga', 'Botões +/− e sugestões', 'incKg', 0.5, (v) => nf(v) + ' kg', 0.5)
          + stepRow('Peso da barra', 'Para a calculadora de anilhas', 'bar', 2.5, (v) => nf(v) + ' kg', 5)
          + sw('Sugerir aumento de carga', 'Pelas repetições e pelo esforço (RIR)', 'suggest')
          + `<div class="switch-row" data-row="rangeMode" style="flex-wrap:wrap"><div class="grow"><div>Progressão pela faixa de repetições</div><div class="small muted">Exercícios com faixa (ex.: 8–12): bateu o topo em todas as séries, a carga sobe e volta para o início</div></div>
            <div class="seg" style="width:100%;margin-top:8px">${[['ask', 'Perguntar'], ['auto', 'Automática'], ['off', 'Desligada']].map(([v, l]) => `<button class="${(st().rangeMode || 'ask') === v ? 'on' : ''}" data-a="rangeMode" data-v="${v}">${l}</button>`).join('')}</div></div>`)}
        ${cap('Semana')}${box(`<div class="switch-row" data-row="weekStart"><div class="grow"><div>Semana começa</div><div class="small muted">Para a agenda, a sequência e os gráficos</div></div><div class="seg" style="width:170px"><button class="${st().weekStart === 1 ? 'on' : ''}" data-a="ws" data-v="1">Segunda</button><button class="${st().weekStart === 0 ? 'on' : ''}" data-a="ws" data-v="0">Domingo</button></div></div>`)}
        ${cap('Experiência do treino')}${box(sw('Perguntar como você está hoje', 'Sono, energia e dor antes do treino · dia ruim alivia o treino', 'checkin')
          + sw('Perguntar como foi a série', 'No limite, pesado ou tranquilo · ajuda a sugerir a carga', 'askRir'))}
        ${cap('Academia')}${box(link('gym', 'dumbbell', 'Minha academia', 'Aparelhos que a sua academia tem · o app só sugere esses', 'gym'))}`,
      aparencia: () => {
        const t = Theme.current();
        return `<div class="card cf-theme-now"><div><span>Tema atual</span><b>${esc(t.nome)}</b><small>${esc(t.desc)}</small></div>
            <span class="sws">${t.sw.slice(0, 4).map((c) => `<i style="background:${c}"></i>`).join('')}</span></div>
          ${cap('Tema')}<div class="theme-grid" data-row="theme">${Theme.LIST.map((x) => `<button class="theme-opt press ${t.id === x.id ? 'on' : ''}" data-a="theme" data-v="${x.id}">
            <span class="th-prev" style="background:${x.sw[0]}"><i style="background:${x.sw[1]};border-color:${x.sw[2]}55"><b style="background:${x.sw[2]}"></b><b style="background:${x.sw[3]};width:60%"></b></i><em style="background:${x.sw[2]}"></em></span>
            <span class="th-name">${x.nome}${t.id === x.id ? icon('check', 'sm') : ''}</span><small>${x.desc}</small></button>`).join('')}</div>
          ${cap('Abertura')}${box(sw('Abertura animada', 'Scouter ao abrir o app · toque para pular', 'splash'))}`;
      },
      lembretes: () => {
        const days = planDays(), nx = nextReminder(), order = st().weekStart === 0 ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
        return `<div class="card cf-rem-now">${icon('clock')}<div class="grow"><b class="num">${st().reminder ? esc(st().reminderTime) : '--:--'}</b><small>${st().reminder ? (nx ? 'Próximo: ' + nx : 'Sem dias de treino no plano') : 'Lembrete desligado'}</small></div><span class="cf-pill ${st().reminder ? 'on' : ''}">${st().reminder ? 'Ligado' : 'Desligado'}</span></div>
          ${cap('Treino')}${box(sw('Lembrar de treinar', 'Notificação nos dias do plano, no horário escolhido', 'reminder')
            + (st().reminder ? `<div class="switch-row" data-row="rtime"><div class="grow"><div>Horário</div><div class="small muted">Hora do lembrete de treino</div></div><input class="input" type="time" style="width:130px;height:44px" data-ch="rtime" value="${esc(st().reminderTime)}"></div>` : '')
            + `<div class="switch-row" style="flex-wrap:wrap"><div class="grow"><div>Dias do plano</div><div class="small muted">Os lembretes seguem os dias do seu plano ativo. Para mudar, edite os dias em Planos.</div></div>
              <div class="cf-days">${order.map((d) => `<span class="${days.has(d) ? 'on' : ''}">${Store.WEEKDAYS[d]}</span>`).join('')}</div></div>`)}
          ${window.Android ? cap('Pulseira e relógio') + box(link('band', 'timer', 'Aviso na pulseira ou relógio', 'Galaxy Fit, Galaxy Watch e outros: vibra no pulso quando o descanso acaba', 'band')) : ''}
          <div class="small muted cf-note">${icon('info', 'sm')} Os lembretes funcionam nos dias do seu plano de treino.</div>`;
      },
      app: () => `<div class="card cf-app-now"><span class="av">${Screens.emblem(28)}</span><div class="grow"><b>Gravity</b><small>Versão ${News.VERSION}</small><small class="${Updater.available ? 'gold' : 'ok'}">${Updater.available ? 'Nova versão ' + esc(Updater.available.versionName) + ' disponível' : icon('check', 'sm') + ' Em dia'}</small></div><button class="btn lime sm" data-a="checkUpdate" data-row="checkUpdate">Verificar</button></div>
          ${Updater.store ? '' : cap('Atualizações') + box(sw('Avisar quando sair versão nova', window.Android ? 'Consulta ao abrir o app, se houver internet' : 'Mostra o aviso para recarregar na hora', 'updateCheck'))}
          ${cap('Conheça o app')}${box(link('news', 'sparkle', 'Novidades', 'O que mudou em cada versão', 'news')
            + link('tips', 'info', 'Você sabia?', window.TipsFx ? TipsFx.discovered() + ' de ' + TipsFx.TIPS.length + ' funções descobertas' : 'Funções do app', 'tips'))}
          ${cap('Ajude a melhorar')}${box(link('feedback', 'note', 'Sugestões e problemas', 'Envie uma ideia, relate um problema ou faça um elogio', 'feedback'))}
          ${cap('Informações')}${box(link('about', 'info', 'Sobre o Gravity', 'Versão de teste · Android e iPhone') + link('terms', 'note', 'Termos de uso', 'Versão ' + ((window.LEGAL && LEGAL.version) || '1.0')) + link('priv', 'note', 'Política de privacidade', 'Como seus dados são usados'))}`,
      dados: () => `<div class="card cf-app-now"><span class="ic-big">${icon('download')}</span><div class="grow"><b>${st().lastBackup ? 'Backup feito' : 'Sem backup ainda'}</b><small>${st().lastBackup ? 'Último: ' + dateBR(st().lastBackup) : 'Salve uma cópia dos seus treinos'}</small></div><button class="btn lime sm" data-a="export">Fazer backup</button></div>
          ${cap('Proteção')}${box(sw('Backup automático semanal', window.Android ? 'Salva toda semana em Downloads/Gravity (guarda os 4 últimos)' : 'Lembra toda semana de salvar o backup', 'autoBackup'))}
          ${cap('Backup')}${box(link('export', 'download', 'Fazer backup', 'Envie para o Drive, WhatsApp ou e-mail', 'export') + link('import', 'upload', 'Restaurar backup', 'Substitui os dados atuais', 'import'))}
          ${cap('Teste')}${box(link('demo', 'sparkle', S().sessions.some((s) => s.demo) ? 'Remover dados de exemplo' : 'Criar dados de exemplo', 'Para ver os gráficos funcionando', 'demo'))}
          <div class="small muted cf-note">${icon('info', 'sm')} Seus treinos ficam neste aparelho. Faça backup para não perder nada.</div>`,
    };
    return {
      hideNav: true,
      render: () => topbar(CAT[cat]) + `<div class="content cf-c">${pages[cat]()}</div>`,
      actions: Object.assign({}, common, {
        rangeMode: (ds) => { st().rangeMode = ds.v; Store.save(); UI.savedFlash(); refresh(); },
        ws: (ds) => { st().weekStart = Number(ds.v); Store.save(); refresh(); UI.savedFlash(); },
        gym: () => push(Screens.GymSetup()),
        theme: (ds) => { Theme.apply(ds.v); Store.save(); Native.vibrate(8); UI.savedFlash(); refresh(); },
        rtime: (ds, el) => { if (el.value) { st().reminderTime = el.value; Store.save(); Screens.syncNative(); toast('Lembrete às ' + el.value); refresh(); } },
        band: bandSheet,
        checkUpdate: () => Updater.check(true),
        feedback: () => Feedback.open(),
        terms: () => push(LegalDoc('termos')),
        priv: () => push(LegalDoc('privacidade')),
        news: () => push(News.History()),
        tips: () => push(TipsFx.Collection()),
        about: () => sheet({ render: () => `<h3>Sobre o Gravity</h3><div class="desc">Versão ${News.VERSION} · versão de teste para Android e iPhone.<br><br>Seus treinos ficam só neste aparelho, sem cadastro.<br><br>Fotos dos exercícios: Free Exercise DB (domínio público).</div><button class="btn lime block" style="margin-top:16px" data-a="ok">Fechar</button>`, actions: { ok: closeSheet } }),
        export: () => { Native.share('Backup Gravity', Store.exportBackup(), 'gravity-backup-' + Store.iso(Store.today()) + '.json'); Store.backupDone(); refresh(); },
        import: () => pickFile((text) => {
          confirmSheet('Restaurar backup?', 'Todos os dados atuais serão substituídos pelos do arquivo.', 'Restaurar', () => {
            try { Store.importBackup(text); toast('Backup restaurado'); UI.switchTab('home', true); } catch (err) { toast(err.message || 'Arquivo inválido'); }
          }, true);
        }),
        demo: () => { if (S().sessions.some((s) => s.demo)) { Store.clearDemo(); toast('Dados de exemplo removidos'); } else if (!Store.activePlan()) { toast('Escolha um plano primeiro, em Planos'); return; } else { Store.seedDemo(); toast('Dados de exemplo criados'); } refresh(); },
      }),
    };
  }

  function pickFile(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,text/plain'; inp.style.display = 'none';
    inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.onerror = () => toast('Não foi possível ler o arquivo'); r.readAsText(f, 'utf-8'); };
    document.body.appendChild(inp); inp.click();
  }

  function bandSheet() {
    sheet({
      render: () => `<h3>Aviso na pulseira</h3><div class="desc">Quando o descanso acaba, o Gravity mostra a notificação <b>“Bora! Descanso acabou”</b> com a próxima série. Pulseiras e relógios recebem essa notificação e vibram no pulso. Para ligar numa Galaxy Fit (ou Galaxy Watch):</div>
        <div class="list">
          <div class="menu-item"><span class="ic">1</span><span class="grow">Abra o app <b>Galaxy Wearable</b> no celular</span></div>
          <div class="menu-item"><span class="ic">2</span><span class="grow">Toque em <b>Notificações</b> e ligue o <b>Gravity</b> na lista de apps</span></div>
          <div class="menu-item"><span class="ic">3</span><span class="grow">Ainda em Notificações, ligue <b>Mostrar com o celular em uso</b> (ou desligue “Só quando o celular não estiver em uso”). Sem isso, a pulseira não vibra enquanto o Gravity está aberto na tela</span></div>
        </div><div class="tiny muted" style="margin-top:12px">Os nomes das opções podem mudar um pouco conforme a versão. Em outras marcas, o caminho é parecido: app da pulseira → Notificações → Gravity.</div>
        <button class="btn lime block" style="margin-top:16px" data-a="ok">Entendi</button>`,
      actions: { ok: closeSheet },
    });
  }

  // ====================== PERFIL ======================
  const GOALS = ['Ganhar massa muscular', 'Ganhar força', 'Emagrecer', 'Condicionamento', 'Saúde e longevidade', 'Desempenho no esporte'];
  const EXP = ['Iniciante', 'Intermediário', 'Avançado'];
  const prof = () => { const s = st(); if (!s.profile) s.profile = {}; return s.profile; };
  const completed = () => S().sessions.filter((s) => { const p = Store.sessionProgress(s); return p.total && p.complete >= p.total; });
  function streaks() {
    const p = Store.activePlan(); if (!p || !p.workouts.length) return { cur: 0, best: 0 };
    const weeks = Store.weeksBack(52), full = weeks.map((w) => p.workouts.every((wo) => Store.workoutStatus(wo, w).status === 'done'));
    let cur = full[full.length - 1] ? 1 : 0; for (let i = full.length - 2; i >= 0 && full[i]; i--) cur++;
    let best = 0, run = 0; full.forEach((f) => { run = f ? run + 1 : 0; best = Math.max(best, run); });
    return { cur, best };
  }
  function lastRecord() {
    const ss = S().sessions.filter((s) => s.sets.some((x) => x.done)).sort((a, b) => b.start - a.start);
    for (const s of ss) { const r = Store.sessionRecords(s); if (r.length) return Object.assign({ date: s.date }, r[0]); }
    return null;
  }

  function Profile2() {
    return {
      hideNav: true,
      render() {
        const pf = prof(), done = completed().length, lvl = 1 + Math.floor(done / 10), pw = Analytics.strength().power, sk = streaks();
        const p = Store.activePlan(), wk = p ? Store.planWeek(p) : null;
        const got = Analytics.earned(), medal = Analytics.MEDALS.filter((m) => got.has(m.id)).pop(), rec = lastRecord(), recEx = rec ? Store.exercise(rec.exId) : null;
        const pct = wk && wk.total ? Math.min(100, Math.round(Math.max(0, Math.min(wk.total, wk.n)) / wk.total * 100)) : 0;
        return topbar('Perfil') + `<div class="content cf-c">
          <button class="card pf-id press" data-a="edit"><span class="av">${Profile.avatarHTML(40)}</span><span class="grow"><b class="ellipsis">${esc(st().name || 'Atleta')}</b><small>${icon('target', 'sm')} ${esc(pf.goal || (p && p.goal) || 'Defina seu objetivo')}</small><em>Editar</em></span>${icon('next', 'sm')}</button>
          <div class="pf-stats">
            <button class="card press" data-a="medals">${icon('trophy', 'sm')}<span><small>Nível</small><b class="num">${lvl}</b></span>${icon('next', 'sm')}</button>
            <button class="card press" data-a="records">${icon('bolt', 'sm')}<span><small>Poder</small><b class="num">${pw != null ? nf(pw) : '—'}</b></span>${icon('next', 'sm')}</button>
            <button class="card press" data-a="history">${icon('calendar', 'sm')}<span><small>Sequência</small><b class="num">${sk.cur} ${sk.cur === 1 ? 'semana' : 'semanas'}</b></span>${icon('next', 'sm')}</button>
            <button class="card press" data-a="history">${icon('dumbbell', 'sm')}<span><small>Treinos</small><b class="num">${done}</b></span>${icon('next', 'sm')}</button>
          </div>
          ${cap('Objetivo atual')}
          ${p ? `<button class="card pf-plan press" data-a="plan"><span class="row" style="gap:12px">${icon('target', 'sm')}<span class="grow"><b class="ellipsis">${esc(p.name)}</b><small>${wk.n < 1 ? 'O plano começa em breve' : 'Semana ' + Math.min(wk.n, wk.total) + ' de ' + wk.total}</small></span><em>Ver plano</em></span><i class="pf-bar"><u style="width:${pct}%"></u></i></button>`
            : `<button class="card pf-plan press" data-a="plan"><span class="row" style="gap:12px">${icon('target', 'sm')}<span class="grow"><b>Sem plano ativo</b><small>Escolha ou crie um plano para começar</small></span><em>Escolher</em></span></button>`}
          ${cap('Marcos')}
          <div class="pf-marks">
            <div class="card">${icon('star', 'sm')}<small>Conquista</small><b>${medal ? esc(medal.nome) : 'Nenhuma ainda'}</b></div>
            <div class="card">${icon('trophy', 'sm')}<small>Recorde recente</small><b>${rec && recEx ? esc(recEx.nome.split(' ').slice(0, 2).join(' ')) + ' ' + nf(rec.kg) + ' kg' : 'Nenhum ainda'}</b></div>
            <div class="card">${icon('flame', 'sm')}<small>Melhor sequência</small><b>${sk.best} ${sk.best === 1 ? 'semana' : 'semanas'}</b></div>
          </div>
          ${cap('Conta Gravity')}
          ${(() => { const em = window.Cloud && Cloud.email(); return em ? `<button class="card pf-acc press" data-a="account"><span class="ic">${icon('check', 'sm')}</span><span class="grow"><b class="ellipsis">${esc(em)}</b><small>${syncLine()}</small></span>${icon('next', 'sm')}</button>` : `<button class="card pf-acc press" data-a="account"><span class="ic">${icon('info', 'sm')}</span><span class="grow"><b>Conta local</b><small>Seus dados estão somente neste aparelho</small></span><span class="pf-go">Entrar ou criar conta</span></button>`; })()}
          ${cap('Privacidade')}
          ${box(link('privacy', 'info', 'Dados e privacidade', 'Armazenamento local · nenhum dado enviado'))}
          ${cap('Assinatura')}
          <div class="card pf-acc is-off" aria-disabled="true"><span class="ic">${icon('star', 'sm')}</span><span class="grow"><b>Assinatura</b><small>A forma de assinatura ainda está sendo definida</small></span><span class="pf-soon">Em breve</span></div>
          </div>`;
      },
      actions: {
        back: pop,
        edit: () => push(EditProfile()),
        medals: () => push(Screens.Medals()),
        records: () => push(Screens.Records()),
        history: () => push(Screens.History()),
        plan: () => { if (Store.activePlan()) UI.switchTab('plans', true); else push(Screens.PlansCreate()); },
        account: () => push(Account()),
        privacy: () => push(Privacy()),
      },
    };
  }

  function EditProfile() {
    const pf = prof();
    const d = { name: st().name || '', birth: pf.birth || '', height: pf.height || 0, peso: Store.bodyWeight() || 0, goal: pf.goal || '', exp: pf.exp || '' };
    const w0 = d.peso;
    let dirty = false;
    const mark = () => { dirty = true; };
    const save = () => {
      st().name = d.name.trim(); pf.birth = d.birth; pf.height = d.height; pf.goal = d.goal; pf.exp = d.exp;
      if (d.peso && Math.abs(d.peso - w0) > 0.001) Store.addBody({ peso: d.peso });
      Store.save(); dirty = false; toast('✓ Salvo');
    };
    const def = {
      hideNav: true,
      render: () => topbar('Editar perfil') + `<div class="content cf-c">
        <div class="pf-photo"><span class="av">${Profile.avatarHTML(44)}</span><div><button class="btn lime sm" data-a="photo">${icon('camera', 'sm')}${Profile.photo() ? 'Trocar foto' : 'Colocar foto'}</button></div></div>
        ${cap('Identidade')}${box(`<div class="switch-row"><div class="grow"><div>Nome de exibição</div><div class="small muted">Como você será chamado no app</div></div><input class="input cf-in" data-in="name" value="${esc(d.name)}" placeholder="Atleta"></div>
          <div class="switch-row"><div class="grow"><div>Data de nascimento</div><div class="small muted">Para recomendações adequadas à sua idade</div></div><input class="input cf-in" type="date" data-ch="birth" value="${esc(d.birth)}"></div>`)}
        ${cap('Corpo')}<div class="small muted cf-note" style="margin:0 2px 8px">${icon('info', 'sm')} Seus dados do corpo ficam só neste aparelho.</div>
        ${box(`<div class="switch-row"><div class="grow"><div>Altura</div></div><div class="stepper cf-step"><button data-a="h" data-d="-1">${icon('minus', 'sm')}</button><div class="val"><b class="num">${d.height ? nf(d.height / 100, 2) + ' m' : '—'}</b></div><button data-a="h" data-d="1">${icon('plus', 'sm')}</button></div></div>
          <div class="switch-row"><div class="grow"><div>Peso atual</div><div class="small muted">O mesmo registro da tela Corpo</div></div><div class="stepper cf-step"><button data-a="w" data-d="-0.5">${icon('minus', 'sm')}</button><div class="val"><b class="num">${d.peso ? nf(d.peso, 1) + ' kg' : '—'}</b></div><button data-a="w" data-d="0.5">${icon('plus', 'sm')}</button></div></div>`)}
        ${cap('Treino')}${box(`<button class="switch-row" data-a="goal" style="width:100%;text-align:left"><div class="grow"><div>Objetivo principal</div><div class="small muted">Foco do seu treino</div></div><span class="cf-val">${esc(d.goal || 'Escolher')}</span>${icon('next', 'sm')}</button>
          <div class="switch-row" style="flex-wrap:wrap"><div class="grow"><div>Nível de experiência</div><div class="small muted">Ajuda a ajustar volume e intensidade</div></div><div class="seg" style="width:100%;margin-top:8px">${EXP.map((x) => `<button class="${d.exp === x ? 'on' : ''}" data-a="exp" data-v="${x}">${x}</button>`).join('')}</div></div>`)}
        <button class="btn lime block" style="margin-top:20px" data-a="save">Salvar alterações</button></div>`,
      leave: () => {},
      actions: {
        back: () => { if (!dirty) { pop(); return; } sheet({ render: () => `<h3>Salvar as alterações?</h3><div class="desc">Você mudou o perfil e ainda não salvou.</div><div class="list"><button class="btn lime block" data-a="s">Salvar</button><button class="btn ghost block" style="margin-top:8px" data-a="d">Descartar</button><button class="btn ghost block" style="margin-top:8px" data-a="c">Continuar editando</button></div>`, actions: { s: () => { save(); closeSheet(); pop(); }, d: () => { closeSheet(); pop(); }, c: closeSheet } }); },
        photo: () => Profile.sheet(refresh),
        name: (ds, el) => { d.name = el.value; mark(); },
        birth: (ds, el) => { d.birth = el.value; mark(); },
        h: (ds) => { d.height = Math.max(120, Math.min(230, (d.height || 170) + Number(ds.d))); mark(); refresh(); },
        w: (ds) => { d.peso = Math.max(30, Math.round(((d.peso || 75) + Number(ds.d)) * 10) / 10); mark(); refresh(); },
        exp: (ds) => { d.exp = ds.v; mark(); refresh(); },
        goal: () => sheet({ render: () => `<h3>Objetivo principal</h3><div class="desc">Descreve você. O objetivo do plano continua sendo editado em Planos.</div><div class="list">${GOALS.map((g) => `<button class="menu-item ${d.goal === g ? 'on' : ''}" data-a="g" data-v="${g}"><span class="grow">${g}</span>${d.goal === g ? icon('check', 'sm') : ''}</button>`).join('')}</div>`, actions: { g: (ds) => { d.goal = ds.v; mark(); closeSheet(); refresh(); } } }),
        save: () => { save(); pop(); },
      },
    };
    return def;
  }

  const soon = (ic, t, sub) => `<div class="menu-item is-off" aria-disabled="true"><span class="ic">${icon(ic, 'sm')}</span><span class="grow">${t}<div class="pf-soon sm">${sub || 'Em breve'}</div></span></div>`;

  // ====================== CONTA GRAVITY (login 1ª parte, 17/11) ======================
  const when = (ts) => { if (!ts) return 'ainda não'; const d = new Date(ts), t = new Date(); const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); return d.toDateString() === t.toDateString() ? 'hoje, ' + hm : d.toLocaleDateString('pt-BR') + ', ' + hm; };
  const syncLine = () => { const c = Cloud.state(); return c.on ? 'Sincronização ligada · última: ' + when(c.lastSync) : 'Sincronização desligada'; };

  // Pergunta de consentimento antes de ligar a sincronização (LGPD: dados de treino e corpo).
  function consentSheet(done) {
    sheet({
      render: () => `<h3>Ligar a sincronização?</h3><div class="desc">Seus <b>treinos, planos, medidas do corpo e configurações</b> ficam guardados na nuvem do Google (Firebase), ligados à sua conta, para você recuperar em outro celular ou se reinstalar o app.</div>
        <div class="list" style="margin-top:8px">
          <div class="menu-item"><span class="ic">${icon('camera', 'sm')}</span><span class="grow">Fotos de progresso <b>não</b> sobem</span></div>
          <div class="menu-item"><span class="ic">${icon('info', 'sm')}</span><span class="grow">Tudo continua salvo neste celular também</span></div>
          <div class="menu-item"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Dá para desligar ou excluir a conta e os dados da nuvem quando quiser</span></div></div>
        <button class="btn lime block" style="margin-top:16px" data-a="yes">Concordo, ligar</button><button class="btn ghost block" style="margin-top:8px" data-a="no">Agora não</button>`,
      actions: {
        yes: async () => { closeSheet(); Cloud.set({ on: true, consentAt: Date.now() }); try { toast('Sincronizando…'); await Cloud.push(true); toast('✓ Sincronizado'); } catch (e) { toast(Cloud.msg(e)); } refresh(); done && done(); },
        no: () => { closeSheet(); done && done(); },
      },
    });
  }
  // Depois de entrar: se já existe cópia na nuvem, pergunta o que fazer; se não, oferece ligar a sincronização.
  const hasLocal = () => Store.state.plans.length > 0 || Store.state.sessions.some((x) => !x.demo);
  let afterBusy = false;
  async function afterLogin() {
    if (afterBusy) return; afterBusy = true; setTimeout(() => { afterBusy = false; }, 8000);
    let info = null;
    try { info = await Cloud.cloudInfo(); } catch (e) { toast(Cloud.msg(e)); return; }
    const consented = !!Cloud.state().on;
    if (!info || !info.parts) {
      if (!consented) { setTimeout(() => consentSheet(), 300); return; }
      try { await Cloud.push(true); if (hasLocal()) toast('✓ Seus dados deste celular foram salvos na sua conta'); } catch (e) { toast(Cloud.msg(e)); }
      return;
    }
    if (!hasLocal()) { try { toast('Trazendo seus dados…'); await Cloud.pull(); Cloud.set({ on: true, consentAt: Cloud.state().consentAt || Date.now() }); toast('✓ Seus dados foram restaurados'); UI.switchTab('home', true); } catch (e) { toast(Cloud.msg(e)); } return; }
    sheet({
      render: () => `<h3>Encontramos seus dados</h3><div class="desc">Esta conta já tem uma cópia na nuvem (de ${when(info.updatedAt)}, app v${esc(info.app || '?')}), e este celular também tem dados. Qual você quer manter?</div>
        <button class="btn lime block" style="margin-top:14px" data-a="pull">Trazer da nuvem para este celular</button>
        <div class="small muted" style="margin:6px 2px 0">Substitui os dados deste celular pelos da nuvem.</div>
        <button class="btn ghost block" style="margin-top:14px" data-a="keep">Manter os deste celular</button>
        <div class="small muted" style="margin:6px 2px 0">A cópia da nuvem é substituída pela deste celular.</div>`,
      actions: {
        pull: async () => { closeSheet(); try { toast('Trazendo da nuvem…'); await Cloud.pull(); Cloud.set({ on: true, consentAt: Cloud.state().consentAt || Date.now() }); toast('✓ Dados restaurados'); UI.switchTab('home', true); } catch (e) { toast(Cloud.msg(e)); } },
        keep: async () => { closeSheet(); if (!Cloud.state().on) { setTimeout(() => consentSheet(), 300); return; } try { await Cloud.push(true); toast('✓ Seus dados deste celular foram salvos na sua conta'); } catch (e) { toast(Cloud.msg(e)); } },
      },
    });
  }
  Cloud.afterLogin = afterLogin;

  function Account() {
    let email = '', pass = '', busy = false, off = null;
    const run = async (fn) => { if (busy) return; if (navigator.onLine === false) { toast('Sem conexão com a internet'); return; } busy = true; refresh(); try { await fn(); } catch (e) { toast(Cloud.msg(e)); } busy = false; refresh(); };
    const def = {
      hideNav: true,
      render: () => {
        const u = Cloud.user(), c = Cloud.state(), logged = !!u;
        if (!logged) return topbar('Conta Gravity') + `<div class="content cf-c">
          <div class="card cf-app-now"><span class="av">${Screens.emblem(28)}</span><div class="grow"><b>Conta local</b><small>${c.email ? 'Conectando…' : 'Seus dados estão só neste aparelho'}</small></div></div>
          ${cap('Por que criar uma conta')}${box([['repeat', 'Sincronizar aparelhos', 'Seus treinos, planos e medidas em outro celular'], ['download', 'Recuperar seus dados', 'Se trocar de celular ou reinstalar o app']].map(([ic, t, s2]) => `<div class="menu-item"><span class="ic">${icon(ic, 'sm')}</span><span class="grow">${t}<div class="small muted">${s2}</div></span></div>`).join(''))}
          ${cap('Entrar ou criar conta')}
          <div class="card cf-box ac-form">
            <label class="ac-f"><span>E-mail</span><input class="input" type="email" autocomplete="email" inputmode="email" data-in="em" value="${esc(email)}" placeholder="seu@email.com"></label>
            <label class="ac-f"><span>Senha</span><input class="input" type="password" autocomplete="current-password" data-in="pw" value="${esc(pass)}" placeholder="Mínimo 6 caracteres"></label>
            <div class="ac-row"><button class="btn lime" data-a="in" ${busy ? 'disabled' : ''}>Entrar</button><button class="btn ghost" data-a="up" ${busy ? 'disabled' : ''}>Criar conta</button></div>
            <button class="link ac-forgot" data-a="forgot">Esqueci minha senha</button>
          </div>
          <div class="ac-or"><i></i><span>ou</span><i></i></div>
          <button class="btn block ac-google" data-a="google" ${busy ? 'disabled' : ''}><span class="g">G</span>Entrar com Google</button>
          <div class="small muted cf-note">${icon('info', 'sm')} Entrar não envia nada sozinho: depois você escolhe se quer ligar a sincronização.</div></div>`;
        return topbar('Conta Gravity') + `<div class="content cf-c">
          <div class="card cf-app-now"><span class="av">${Profile.avatarHTML(28)}</span><div class="grow"><b class="ellipsis" style="text-transform:none;font-size:16px">${esc(u.email || 'Conta Google')}</b><small class="${c.on ? 'ok' : ''}">${c.on ? icon('check', 'sm') : ''} ${syncLine()}</small></div></div>
          ${cap('Sincronização')}${box(`<div class="switch-row" data-a="sync"><div class="grow"><div>Sincronizar com a nuvem</div><div class="small muted">Treinos, planos, medidas e configurações · fotos de progresso nunca sobem</div></div><div class="switch ${c.on ? 'on' : ''}"></div></div>`
            + `<button class="menu-item" data-a="now" ${c.on && !busy ? '' : 'disabled'}><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Sincronizar agora<div class="small muted">Última: ${when(c.lastSync)}</div></span></button>`
            + `<button class="menu-item" data-a="restore"><span class="ic">${icon('download', 'sm')}</span><span class="grow">Trazer da nuvem<div class="small muted">Substitui os dados deste celular pela cópia da nuvem</div></span></button>`)}
          ${cap('Conta')}${box(`<button class="menu-item" data-a="out"><span class="ic">${icon('back', 'sm')}</span><span class="grow">Sair da conta<div class="small muted">Os dados continuam neste celular</div></span></button>`
            + `<button class="menu-item danger" data-a="del"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Excluir conta<div class="small muted">Apaga a conta e os dados da nuvem</div></span></button>`)}
          <div class="small muted cf-note">${icon('info', 'sm')} Tudo continua salvo neste celular. A nuvem é uma cópia para você não perder nada.</div></div>`;
      },
      after: () => { if (!off) off = Cloud.on(() => def.el && refresh()); if (!Cloud.ready() && Cloud.state().uid) Cloud.load().catch(() => {}); },
      leave: () => { if (off) { off(); off = null; } },
      actions: {
        back: pop,
        em: (ds, el) => { email = el.value; },
        pw: (ds, el) => { pass = el.value; },
        in: () => run(async () => { await Cloud.signIn(email, pass); pass = ''; toast('Conta conectada'); afterLogin(); }),
        up: () => run(async () => { await Cloud.signUp(email, pass); pass = ''; toast('Conta criada'); afterLogin(); }),
        forgot: () => { if (!email.trim()) { toast('Digite seu e-mail acima'); return; } run(async () => { await Cloud.reset(email); toast('Enviamos um e-mail para redefinir a senha'); }); },
        google: () => run(async () => { const u = await Cloud.google(); if (u) { toast('Conta conectada'); afterLogin(); } else if (window.Android) toast('Termine o login no navegador e volte ao app'); }),
        sync: () => { const c = Cloud.state(); if (c.on) { Cloud.set({ on: false }); toast('Sincronização desligada'); refresh(); } else consentSheet(); },
        now: () => run(async () => { await Cloud.push(true); toast('✓ Sincronizado'); }),
        restore: () => confirmSheet('Trazer da nuvem?', 'Os dados deste celular serão substituídos pela cópia da nuvem.', 'Trazer da nuvem', () => run(async () => { await Cloud.pull(); toast('✓ Dados restaurados'); })),
        out: () => confirmSheet('Sair da conta?', 'Seus dados continuam neste celular. A sincronização para até você entrar de novo.', 'Sair', () => run(async () => { await Cloud.signOut(); toast('Você saiu da conta'); })),
        del: () => confirmSheet('Excluir conta?', 'A conta e a cópia dos seus dados na nuvem serão apagadas para sempre. Os dados deste celular continuam.', 'Excluir conta', () => run(async () => {
          try { await Cloud.deleteAccount(); toast('Conta excluída'); }
          catch (e) { if (e && e.code === 'auth/requires-recent-login') { toast('Por segurança, saia, entre de novo e repita'); } else throw e; }
        }), true),
      },
    };
    return def;
  }

  function Privacy() {
    return {
      hideNav: true,
      render: () => { const u = Cloud.user() || (Cloud.state().uid ? {} : null), c = Cloud.state();
        return topbar('Dados e privacidade') + `<div class="content cf-c">
        <div class="card cf-app-now"><span class="ic-big">${icon('download')}</span><div class="grow"><b>${u && c.on ? 'Celular + nuvem' : 'Armazenamento local'}</b><small>${u && c.on ? 'Cópia na nuvem · última: ' + when(c.lastSync) : 'Nenhum dado enviado'}</small></div></div>
        <div class="card cf-box cf-priv">${icon('info', 'sm')}<div><b>Seus treinos e dados do corpo são privados.</b><small>Ficam neste aparelho. Só vão para a nuvem se você entrar na Conta Gravity e ligar a sincronização, e só a sua conta tem acesso a eles.</small></div></div>
        ${cap('Sincronização')}${box(`<button class="menu-item" data-a="acc"><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Treinos, planos e medidas<div class="small muted">${u ? (c.on ? 'Sincronizando com a nuvem' : 'Desligada') : 'Entre na Conta Gravity para ligar'}</div></span>${icon('next', 'sm')}</button>`
          + soon('camera', 'Fotos de progresso', 'Nunca sobem para a nuvem'))}
        ${cap('Controle dos dados')}${box(`<button class="menu-item" data-a="exp"><span class="ic">${icon('download', 'sm')}</span><span class="grow">Baixar meus dados<div class="small muted">Arquivo com todos os seus dados (backup)</div></span>${icon('next', 'sm')}</button>`
          + soon('repeat', 'Gerenciar aparelhos', 'Em breve')
          + `<button class="menu-item ${u ? 'danger' : 'is-off'}" data-a="acc" ${u ? '' : 'aria-disabled="true"'}><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Excluir conta<div class="small muted">${u ? 'Em Conta Gravity' : 'Disponível com a Conta Gravity'}</div></span>${icon('next', 'sm')}</button>`)}
        ${cap('Consentimento')}${box(link('terms', 'note', 'Termos de uso', 'Versão ' + ((window.LEGAL && LEGAL.version) || '1.0')) + link('priv', 'note', 'Política de privacidade', c.consentAt ? 'Aceita em ' + new Date(c.consentAt).toLocaleDateString('pt-BR') : 'Como seus dados são usados'))}
        </div>`; },
      actions: {
        back: pop,
        acc: () => push(Account()),
        terms: () => push(LegalDoc('termos')),
        priv: () => push(LegalDoc('privacidade')),
        exp: () => { Native.share('Backup Gravity', Store.exportBackup(), 'gravity-backup-' + Store.iso(Store.today()) + '.json'); Store.backupDone(); },
      },
    };
  }

  function LegalDoc(k) {
    return { hideNav: true, render: () => topbar(k === 'termos' ? 'Termos de uso' : 'Privacidade') + `<div class="content cf-c gt-doc in-app">${(window.LEGAL || {})[k] || ''}</div>`, actions: { back: pop } };
  }

  // Atalho usado por Novidades e Você sabia?: abre Configurações, a subtela e destaca a linha.
  function settingsGo(cat, row, label) { push(Settings()); setTimeout(() => go(cat, row, label), 320); }

  Object.assign(window.Screens, { Settings, SettingsPage: Page, ProfileScreen: Profile2, EditProfile, settingsGo });
})();
