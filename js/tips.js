// "Você sabia?" (v0.40): apresenta uma função por vez, em doses pequenas.
// - Estilo B (carta colecionável) no dia a dia; estilo C (holofote) quando a função está na tela que a pessoa vê.
// - No máximo 1 por dia, só na tela inicial, nunca durante o treino nem por cima de outro aviso.
// - Se a pessoa usar a função ou tocar em "Já conheço", ela nunca mais aparece. Ignorou (fechou)? Volta só daqui a 10 dias.
// - Regra fixa: toda função nova do app ganha a sua carta aqui (a coleção cresce junto).
(function () {
  'use strict';
  const S = () => Store.state;
  const st = () => { const s = S().settings; s.tips = s.tips || { seen: {}, shown: {}, last: '' }; return s.tips; };
  const today = () => Store.iso(Store.today());
  const go = (fn) => () => { UI.popTo && UI.popTo(1); setTimeout(fn, 60); };
  const tab = (t, then) => go(() => { UI.switchTab(t, true); if (then) setTimeout(then, 320); });
  const spot = (sel, txt) => setTimeout(() => News.spotlight(sel, txt), 120);
  const openWorkout = (then) => go(() => {
    const p = Store.activePlan(); if (!p || !p.workouts.length) { UI.toast('Monte um plano primeiro'); return; }
    const dow = Store.today().getDay(), w = p.workouts.find((x) => x.days.includes(dow)) || p.workouts[0];
    UI.push(Screens.WorkoutScreen(w.id)); if (then) setTimeout(then, 450);
  });
  const anySession = (f) => S().sessions.some(f);
  // raridade: comum, rara, épica (só enfeite da carta)
  const TIPS = [
    { id: 'swipe', nome: 'Deslize entre as abas', icon: 'repeat', r: 'rara', txt: 'Arraste a tela para o lado e a barra escorre junto: Semana, Planos, Exercícios e Progresso. O Treinar é só no toque.', des: 'Deslize da Semana até o Progresso sem tocar na barra.', run: tab('home') },
    { id: 'agenda', nome: 'Agenda da semana', icon: 'calendar', r: 'comum', sel: '.h2-tile[data-a="agenda"]', txt: 'Toque no bloco Semana: abre a agenda com todos os treinos, o que já foi feito e o que está atrasado.', des: 'Abra a agenda e veja o que falta na semana.' },
    { id: 'power', nome: 'Nível de poder', icon: 'bolt', r: 'épica', sel: '.h2-tile[data-a="pwOpen"]', txt: 'Sua força comparada ao seu peso. Passar de 9.000 é coisa de elite. É mais de 9.000!', des: 'Registre seu peso e veja seu nível.', used: () => Store.bodyWeight() > 0 },
    { id: 'muscles', nome: 'Músculos da semana', icon: 'target', r: 'comum', sel: '.h2-tile.wide[data-a="muscles"]', txt: 'O boneco pinta quem treinou na semana e mostra quem ficou para trás. Seu peito agradece, mas e as costas?', des: 'Abra o mapa e encontre o músculo mais esquecido.' },
    { id: 'medals', nome: 'Conquistas', icon: 'trophy', r: 'rara', sel: '.h2-lvl3', txt: 'Toque no quadro Nível para ver as 20 conquistas. Elas aparecem sozinhas conforme você treina.', des: 'Descubra qual conquista está mais perto.' },
    { id: 'avatar', nome: 'Sua foto no perfil', icon: 'camera', r: 'comum', sel: '.topbar .h2-av', txt: 'Toque no círculo no topo da tela inicial e coloque a sua foto. Fica só no seu celular.', des: 'Coloque uma foto sua no perfil.', used: () => !!S().settings.photo },
    { id: 'myBody', nome: 'Mapa com a sua foto', icon: 'camera', r: 'épica', txt: 'Em Músculos, troque o boneco pela SUA foto, com os músculos pintados por cima.', des: 'Encaixe uma foto de frente no mapa.', run: go(() => { UI.switchTab('home', true); setTimeout(() => UI.push(Screens.MuscleMap()), 250); }), used: () => window.MyBody && MyBody.has() },
    { id: 'balance', nome: 'Equilíbrio', icon: 'layers', r: 'rara', txt: 'Empurrar × puxar e quadríceps × posterior: o app avisa quando um lado passa muito do outro.', des: 'Veja se o seu treino está equilibrado.', run: go(() => UI.push(Screens.MuscleMap())) },
    { id: 'metro', nome: 'Metrônomo da cadência', icon: 'timer', r: 'rara', txt: 'No treino, toque em Metrônomo: bipes ou voz marcam "desce 3, segura 1, sobe 1". Para sozinho ao marcar a série.', des: 'Use o metrônomo na próxima série.', used: () => Object.keys(S().settings.metro || {}).length > 0 },
    { id: 'warm', nome: 'Aquecimento', icon: 'flame', r: 'comum', txt: 'No treino, toque em Aquecer: o app monta séries leves de aquecimento com a carga certa.', des: 'Aqueça no primeiro exercício de hoje.' },
    { id: 'swap', nome: 'Trocar exercício', icon: 'repeat', r: 'comum', txt: 'Aparelho ocupado? No treino, toque em Trocar e escolha um exercício parecido. Pode ser só hoje ou para sempre.', des: 'Troque um exercício quando o aparelho estiver ocupado.', used: () => anySession((s) => s.swaps && Object.keys(s.swaps).length) },
    { id: 'pin', nome: 'Nota fixa', icon: 'note', r: 'comum', txt: 'Ajuste do banco, pegada, altura do assento: toque em Nota fixa e ela aparece sempre naquele exercício.', des: 'Anote o ajuste de um aparelho.' },
    { id: 'pain', nome: 'Dor ou incômodo', icon: 'alert', r: 'rara', txt: 'Incomodou? Toque em Dor no exercício. Se repetir, o app sugere alternativas.', des: 'Saiba onde registrar um incômodo.', used: () => (S().pain || []).length > 0 },
    { id: 'swap', nome: 'Troca de exercício', icon: 'timer', r: 'rara', txt: 'Precisa de mais tempo para trocar de aparelho? Ligue um descanso maior só depois da última série de cada exercício.', des: 'Ajuste a troca de exercício nas Configurações.', used: () => Number(S().settings.restSwap) > 0, run: go(() => { UI.push(Screens.Settings()); setTimeout(() => News.spotlight('.swap-row', 'Troca de exercício'), 350); }) },
    { id: 'quick', nome: 'Pouco tempo hoje?', icon: 'timer', r: 'rara', txt: 'Diga quantos minutos você tem e o treino se encaixa: junta exercícios e corta séries.', des: 'Faça um treino de 30 minutos.', run: openWorkout(() => News.spotlight('[data-a="quick"]', 'Escolha quanto tempo você tem')) },
    { id: 'switchW', nome: 'Trocar de treino', icon: 'repeat', r: 'comum', txt: 'Hoje é perna mas você quer peito? Na tela do treino, toque em Trocar de treino.', des: 'Veja como fazer outro treino do plano hoje.', run: openWorkout(() => News.spotlight('[data-a="switchW"]', 'Faça outro treino do plano hoje')) },
    { id: 'rm', nome: 'Porcentagens do 1RM', icon: 'target', r: 'rara', txt: 'No detalhe do exercício e ao digitar a carga: 5×5 a 80%, 3×8 a 72,5% e outros atalhos.', des: 'Descubra quanto é 80% do seu máximo no supino.' },
    { id: 'gym', nome: 'Minha academia', icon: 'target', r: 'rara', sel: '[data-a="gym"]', txt: 'Desligue os aparelhos que a sua academia não tem: eles somem das trocas e dos planos.', des: 'Marque o que tem na sua academia.', run: tab('library', () => spot('[data-a="gym"]', 'Toque aqui para marcar os aparelhos')), used: () => (S().settings.gymOff || []).length > 0 || !!S().settings.gymOnly },
    { id: 'libNew', nome: '326 exercícios', icon: 'dumbbell', r: 'comum', txt: 'Filtre por Novos, Máquinas, Em alta, HYROX ou Calistenia. Tem rosca bayesiana, Kelso, pêndulo…', des: 'Encontre um exercício que você nunca fez.', run: go(() => { UI.switchTab('library', true); setTimeout(() => { const b = document.querySelector('[data-a="kind"][data-k="novo"]'); if (b) b.click(); }, 300); }) },
    { id: 'sports', nome: 'Treinos por esporte', icon: 'bolt', r: 'épica', sel: '[data-a="sports"]', txt: '20 esportes: futebol, vôlei, corrida, jiu-jitsu, beach tennis… Um treino feito para o seu.', des: 'Veja o treino do seu esporte.', run: tab('plans', () => spot('[data-a="sports"]', 'Treinos por esporte')) },
    { id: 'goal', nome: 'Montar por objetivo', icon: 'target', r: 'rara', sel: '[data-a="goal"]', txt: 'Hipertrofia, força, salto, emagrecimento, saúde… responda poucas perguntas e o plano sai pronto.', des: 'Monte um plano pelo seu objetivo.', run: tab('plans', () => spot('[data-a="goal"]', 'Montar por objetivo')) },
    { id: 'techs', nome: 'Técnicas avançadas', icon: 'flame', r: 'épica', sel: '[data-a="guide"]', txt: 'Drop set, rest-pause, FST-7, bi-set, pirâmide e mais 19 — com o jeito certo de fazer.', des: 'Coloque um drop set no último exercício.', run: tab('plans', () => spot('[data-a="guide"]', 'Técnicas avançadas')) },
    { id: 'import', nome: 'Importar planilha', icon: 'upload', r: 'comum', sel: '[data-a="import"]', txt: 'Tem o treino numa planilha? Importe e ele vira plano no app.', des: 'Traga o treino do seu personal.', run: tab('plans', () => spot('[data-a="import"]', 'Importar planilha')) },
    { id: 'month', nome: 'Resumo do mês', icon: 'calendar', r: 'rara', txt: 'Treinos, recordes, músculos e dias treinados do mês, com imagem pronta para postar.', des: 'Compartilhe o resumo deste mês.', run: tab('progress', () => UI.push(Screens.MonthSummary())) },
    { id: 'records', nome: 'Recordes', icon: 'trophy', r: 'rara', txt: 'A maior carga com 1, 3, 5 e 10 repetições de cada exercício. O app comemora na hora em que você bate um.', des: 'Veja seu melhor no agachamento.', run: tab('progress', () => UI.push(Screens.Records())) },
    { id: 'compare', nome: 'Comparar fotos', icon: 'layers', r: 'épica', txt: 'Em Progresso → Corpo, arraste a linha para ver o antes e o depois lado a lado.', des: 'Tire a primeira foto de progresso.', run: tab('progress', () => UI.push(Screens.Body())), used: () => Store.photos().length >= 2 },
    { id: 'tests', nome: 'Testes físicos', icon: 'target', r: 'comum', txt: 'Salto vertical, sprint, Cooper, flexões… repita a cada 4–8 semanas e veja se o treino está funcionando.', des: 'Faça o teste de flexões máximas.', run: tab('progress', () => UI.push(Screens.Tests())) },
    { id: 'voice', nome: 'Voz no treino', icon: 'play', r: 'rara', txt: 'O celular fala o próximo exercício, a carga e o fim do descanso. Dá para treinar sem olhar a tela.', des: 'Ligue a voz e treine de tela bloqueada.', run: go(() => { UI.push(Screens.Settings()); setTimeout(() => UI.push(Screens.VoiceSettings()), 300); }), used: () => !!S().settings.voice },
    { id: 'theme', nome: 'Temas', icon: 'sparkle', r: 'comum', txt: 'Dourado, Galáxia, Titânio, Azul, Luana ou Atelier. Escolha a cara do seu app.', des: 'Experimente um tema novo.', run: go(() => { UI.push(Screens.Settings()); setTimeout(() => News.spotlight('.theme-grid', 'Escolha o tema'), 350); }), used: () => !!S().settings.theme && S().settings.theme !== 'dourado' },
    { id: 'checkin', nome: 'Como você está hoje?', icon: 'check', r: 'comum', txt: 'Sono, energia e dor antes do treino. Dia ruim? O app sugere aliviar a carga.', des: 'Responda o check-in antes do próximo treino.' },
    { id: 'deload', nome: 'Semana leve', icon: 'sparkle', r: 'rara', txt: 'Depois de semanas pesadas, o app propõe uma semana mais leve para o corpo voltar mais forte.', des: 'Saiba quando o corpo pede descanso.' },
    { id: 'share', nome: 'Compartilhar treino', icon: 'share', r: 'comum', txt: 'Abra um treino feito em Progresso e toque em compartilhar: sai uma imagem com tudo o que você levantou.', des: 'Poste o treino de hoje.' },
    { id: 'backup', nome: 'Backup', icon: 'download', r: 'comum', txt: 'Seus treinos ficam só no celular. Em Configurações → Exportar, salve uma cópia para não perder nada.', des: 'Faça um backup agora.', run: go(() => { UI.push(Screens.Settings()); setTimeout(() => News.spotlight('[data-a="export"]', 'Salve uma cópia dos seus treinos'), 350); }), used: () => !!S().settings.lastBackup },
  ];
  const N = TIPS.length;
  const num = (t) => TIPS.indexOf(t) + 1;
  const known = (t) => !!st().seen[t.id] || (t.used && safe(t.used));
  function safe(f) { try { return !!f(); } catch (e) { return false; } }
  function mark(id, how) { st().seen[id] = how || 'known'; Store.save(); }
  function markUsed(id) { if (!st().seen[id]) mark(id, 'used'); }
  function discovered() { return TIPS.filter(known).length; }

  // Próxima dica: primeiro as que a pessoa nunca viu; ignoradas só voltam depois de 10 dias.
  function next() {
    const now = Date.now(), sh = st().shown;
    return TIPS.find((t) => !known(t) && (!sh[t.id] || now - sh[t.id] > 10 * 864e5));
  }
  function busy() {
    if (document.getElementById('splash') || document.querySelector('.tip-ov, .news-ov, .celebrate, .sheet-wrap.open, .spot-tip')) return true;
    if (UI.R.stack.length !== 1 || UI.R.tab !== 'home') return true;
    const s = S().activeSessionId && Store.session(S().activeSessionId);
    if (s && !s.finished && Date.now() - Store.lastActivity(s) < 3 * 3600000) return true; // treino aberto
    return false;
  }
  // Chamado pela tela inicial. Uma por dia, no máximo.
  function maybe() {
    const t0 = st();
    if (t0.last === today() || !S().plans.length) return;
    setTimeout(() => {
      if (busy() || st().last === today()) return;
      const t = next(); if (!t) return;
      st().last = today(); st().shown[t.id] = Date.now(); Store.save();
      const el = t.sel && [...document.querySelectorAll('.screen ' + t.sel)].pop();
      if (el && el.offsetParent) holofote(t, el); else carta(t);
    }, 1600);
  }

  // ---------- B: carta colecionável ----------
  function carta(t, fromCollection) {
    close();
    const ov = document.createElement('div'); ov.className = 'tip-ov';
    const ok = known(t);
    ov.innerHTML = `<div class="tip-deck"><div class="tip-card r-${t.r}">
      <button class="tip-x" data-t="x" aria-label="Fechar">${UI.icon('x', 'sm')}</button>
      <div class="tip-top"><span>Você sabia? · Carta ${num(t)} de ${N}</span><span class="tip-r">${t.r}</span></div>
      <div class="tip-ic">${UI.icon(t.icon)}</div>
      <h3>${UI.esc(t.nome)}</h3><p>${UI.esc(t.txt)}</p>
      <div class="tip-des"><b>Desafio</b>${UI.esc(t.des)}</div>
      <div class="tip-btns">${ok && fromCollection ? '' : `<button class="btn ghost" data-t="known">Já conheço</button>`}${t.run ? `<button class="btn primary" data-t="go">${ok && fromCollection ? 'Ver de novo' : 'Aceitar desafio'}<span class="arrow">${UI.icon('next', 'sm')}</span></button>` : `<button class="btn primary" data-t="okx">Entendi</button>`}</div>
      <div class="tip-count">Você descobriu ${discovered()} de ${N} funções</div></div></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) { if (e.target === ov) close(); return; }
      const a = b.dataset.t;
      if (a === 'known' || a === 'okx') mark(t.id, 'known');
      if (a === 'go') { mark(t.id, 'tried'); close(); t.run(); return; }
      close(); if (fromCollection) UI.refresh();
    });
  }
  // ---------- C: holofote na própria tela ----------
  function holofote(t, el) {
    close();
    el.scrollIntoView({ block: 'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), pad = 8;
      const ov = document.createElement('div'); ov.className = 'tip-ov tip-c';
      const below = r.top < innerHeight * 0.45;
      ov.innerHTML = `<div class="tip-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
        <div class="tip-ball ${below ? 'below' : 'above'}" style="${below ? `top:${r.bottom + 18}px` : `bottom:${innerHeight - r.top + 18}px`}">
          <div class="tip-top"><span>Você sabia?</span><span class="tip-r">${t.r}</span></div>
          <h3>${UI.esc(t.nome)}</h3><p>${UI.esc(t.txt)}</p>
          <div class="tip-btns"><button class="btn ghost sm" data-t="known">Já conheço</button><button class="btn primary sm" data-t="try">Experimentar</button></div></div>`;
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('on'));
      ov.addEventListener('click', (e) => {
        const b = e.target.closest('[data-t]');
        if (!b) { if (!e.target.closest('.tip-ball')) close(); return; }
        if (b.dataset.t === 'known') { mark(t.id, 'known'); close(); return; }
        mark(t.id, 'tried'); close(); if (t.run) t.run(); else el.click();
      });
    }, 260);
  }
  function close() { document.querySelectorAll('.tip-ov').forEach((o) => { o.classList.remove('on'); setTimeout(() => o.remove(), 220); }); }

  // ---------- coleção (Configurações → Você sabia?) ----------
  function Collection() {
    return {
      hideNav: true,
      render() {
        return `<div class="topbar"><button class="icon-btn" data-a="back">${UI.icon('back')}</button><h1>Você sabia?</h1></div><div class="content">
          <div class="small muted" style="margin:0 2px 12px">Você descobriu <b class="gold">${discovered()} de ${N}</b> funções. Toque numa carta para ver. A cada função nova do app, chega uma carta nova.</div>
          <div class="tip-grid">${TIPS.map((t) => { const k = known(t); return `<button class="tip-mini press ${k ? 'on' : ''} r-${t.r}" data-a="open" data-id="${t.id}"><span class="n">${num(t)}</span><span class="i">${UI.icon(k ? t.icon : 'info', 'sm')}</span><b>${k ? UI.esc(t.nome) : '???'}</b></button>`; }).join('')}</div></div>`;
      },
      actions: { back: UI.pop, open: (ds) => carta(TIPS.find((t) => t.id === ds.id), true) },
    };
  }

  window.TipsFx = { TIPS, maybe, markUsed, mark, carta, holofote, Collection, discovered, next };
})();
