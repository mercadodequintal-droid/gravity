// Novidades de cada versão: usadas no aviso de versão nova e no "O que há de novo".
// A primeira entrada é a versão deste app. plat: 'android', 'web' (iPhone/navegador) ou omitido (os dois).
// go: atalho do botão "Ver agora" (ver GO abaixo).
(function () {
  'use strict';
  const CHANGELOG = [
    { v: '0.29.4', date: '2026-11-05', items: [
      { icon: 'sparkle', t: 'Ícone ajustado', d: 'O ícone voltou a mostrar a pedra e o G de metal ocupando todo o espaço, sem a borda preta.' },
    ] },
    { v: '0.29.3', date: '2026-11-05', items: [
      { icon: 'sparkle', t: 'Ícone com a moldura brilhante', d: 'O ícone novo agora mostra a arte inteira, com a moldura de metal e o brilho dourado em volta.' },
    ] },
    { v: '0.29.2', date: '2026-11-05', items: [
      { icon: 'sparkle', t: 'Ícone novo', d: 'O app tem um ícone novo na tela de aplicativos do celular: o G de metal sobre pedra escura com brilho dourado.' },
    ] },
    { v: '0.29.1', date: '2026-11-04', items: [
      { icon: 'camera', t: 'Mapa com a sua foto corrigido', d: 'Na tela Músculos, a sua foto agora aparece com os músculos pintados, também no modo Recuperação.', go: 'myBody' },
    ] },
    { v: '0.29.0', date: '2026-11-04', items: [
      { icon: 'dumbbell', t: '134 exercícios novos', d: 'Agora são 326: máquinas novas (pêndulo, belt squat, hip thrust na máquina, remadas iso-laterais), exercícios em alta (rosca bayesiana, Kelso, tibial), HYROX, calistenia e mobilidade. Filtre por Novos, Máquinas, Em alta, HYROX ou Calistenia.', go: 'libNew', img: 'img/news/0.29.0.jpg', main: true, dot: { tab: 'library', sel: '[data-a="kind"][data-k="novo"]' } },
      { icon: 'target', t: 'Minha academia', d: 'Desligue os aparelhos que a sua academia não tem: eles somem das trocas sugeridas e dos planos que o app monta.', go: 'gym', dot: { sel: '[data-a="gym"]' },
        tour: [['[data-a="gymOnly"]', 'Ligue para ver só o que tem na sua academia'], ['[data-a="gym"]', 'Toque aqui para marcar os aparelhos']] },
      { icon: 'play', t: 'Voz: escolha cada aviso', d: 'Em Voz no treino, cada aviso falado tem a sua chave: fim do descanso, próxima série, técnicas, 10 segundos finais, recordes e resumo.', go: 'voice' },
      { icon: 'check', t: 'Textos no lugar', d: 'Botões e seletores não deixam mais o texto sair do quadro em telas estreitas.' },
    ] },
    { v: '0.28.0', date: '2026-11-04', items: [
      { icon: 'layers', t: 'Equilíbrio entre os músculos', d: 'Empurrar × puxar e quadríceps × posterior: o app avisa quando um lado passa muito do outro e diz o que incluir. Os planos que o app monta já saem equilibrados.', go: 'balance', img: 'img/news/0.28.0.jpg', main: true, dot: { sel: '.muscle-card' } },
      { icon: 'camera', t: 'Mapa com a sua foto', d: 'Em Músculos, toque em Minha foto, escolha uma foto de frente e outra de costas e encaixe no desenho. Fica só no seu celular.', go: 'myBody', dot: { tab: 'progress', sel: '[data-a="bodyView"][data-v="foto"]' },
        tour: [['[data-a="bodyView"][data-v="foto"]', 'Toque em Minha foto para escolher suas fotos'], ['.mb-switch', 'Para voltar ao boneco, é só tocar em Boneco']] },
      { icon: 'timer', t: 'Metrônomo da cadência', d: 'No treino, toque em Metrônomo: bipes ou voz marcam “desce 3, segura 1, sobe 1”. Para sozinho quando você marca a série.' },
      { icon: 'camera', t: 'Fotos dos exercícios novos', d: 'Salto patinador, Y-T-W, burpee, flexão pike e mais 5 agora têm foto.' },
      { icon: 'sparkle', t: 'Novidades de um jeito novo', d: 'Um cartão por versão, depois do treino, e um ponto dourado no que mudou até você tocar.' },
    ] },
    { v: '0.27.0', date: '2026-11-04', items: [
      { icon: 'bolt', t: 'Treinos por esporte', d: '20 esportes: futebol, vôlei, corrida, jiu-jitsu, beach tennis e mais. Responda o questionário (posição, fase, lesões) ou pegue um treino pronto, na academia ou sem equipamento.', go: 'sports' },
      { icon: 'target', t: 'Meta de séries por músculo', d: 'A tela inicial avisa direto quem está faltando, ex.: “Posteriores de coxa: 4 de 10 séries”. Toque num músculo em Progresso → Músculos para mudar a meta.', go: 'muscles' },
    ] },
    { v: '0.26.0', date: '2026-11-03', items: [
      { icon: 'download', t: 'Atualização pelo próprio app', d: 'Quando sair versão nova, aparece um aviso na tela inicial. Toque em Atualizar e confirme: o app baixa e instala, sem perder nada.', go: 'settingsUpdate', plat: 'android' },
      { icon: 'download', t: 'Aviso de versão nova', d: 'Quando sair versão nova, aparece o aviso “Atualizar agora” e o app recarrega na hora.', go: 'settingsUpdate', plat: 'web' },
      { icon: 'sparkle', t: 'O que há de novo', d: 'A cada atualização, estes cartões mostram o que mudou. Para rever depois: Configurações → Novidades.', go: 'news' },
    ] },
    { v: '0.25.2', date: '2026-10-29', items: [
      { icon: 'timer', t: 'Fotos dos aeróbicos', d: 'Esteira, bicicleta, elíptico, pular corda e escada agora têm foto.' },
    ] },
    { v: '0.25.0', date: '2026-10-27', items: [
      { icon: 'calendar', t: 'Resumo do mês', d: 'Treinos, recordes, músculos e dias treinados do mês, com imagem para compartilhar.', go: 'month' },
      { icon: 'layers', t: 'Comparar fotos', d: 'Em Progresso → Corpo, arraste a linha dourada para ver o antes e o depois.', go: 'compare' },
      { icon: 'alert', t: 'Dor ou incômodo', d: 'No treino, toque em Dor para registrar. Se repetir no mesmo exercício, o app sugere alternativas.' },
      { icon: 'target', t: 'Porcentagens do 1RM', d: 'No detalhe do exercício e ao digitar a carga: 5×5 a 80%, 3×8 a 72,5% e outros atalhos.' },
      { icon: 'download', t: 'Backup semanal', d: 'Toda semana o app salva uma cópia em Downloads/Gravity.', plat: 'android' },
      { icon: 'download', t: 'Backup semanal', d: 'Toda semana o app lembra de salvar uma cópia dos seus treinos.', plat: 'web' },
      { icon: 'trash', t: 'Cancelar treino', d: 'Em Finalizar, dá para cancelar o treino sem salvar nada.' },
    ] },
    { v: '0.24.0', date: '2026-10-27', items: [
      { icon: 'bolt', t: 'Nível de poder de verdade', d: 'Sua força comparada ao peso do corpo, na tela inicial e em Progresso. 9.001 = elite.', go: 'power' },
      { icon: 'repeat', t: 'Reordenar arrastando', d: 'Em Editar plano e Editar treino, segure um cartão e arraste.' },
      { icon: 'check', t: 'Como você está hoje?', d: 'Sono, energia e dor antes do treino. Dia ruim, o app sugere aliviar.' },
      { icon: 'timer', t: 'Pouco tempo hoje?', d: 'Na tela do treino, escolha quantos minutos tem e o treino se encaixa.' },
    ] },
  ];
  const VERSION = CHANGELOG[0].v;
  const forMe = (it) => !it.plat || (it.plat === 'android') === !!window.Android;
  // Compara "0.25.2" com "0.26.0".
  const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

  // ---------- destaque (balão + brilho pulsando) ----------
  function spotlight(sel, text, tries) {
    const els = [...document.querySelectorAll(sel)];
    const el = els[els.length - 1];
    if (!el) { if ((tries || 0) < 12) setTimeout(() => spotlight(sel, text, (tries || 0) + 1), 250); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      el.classList.add('spot');
      const r = el.getBoundingClientRect(), b = document.createElement('div');
      b.className = 'spot-tip'; b.textContent = text || 'Novo';
      const top = r.top > 90 ? r.top - 46 : r.bottom + 10;
      b.style.top = top + 'px'; b.style.left = Math.max(12, Math.min(window.innerWidth - 232, r.left + r.width / 2 - 110)) + 'px';
      if (r.top <= 90) b.classList.add('below');
      document.body.appendChild(b);
      const off = () => { el.classList.remove('spot'); b.remove(); document.removeEventListener('pointerdown', off, true); };
      setTimeout(off, 4500); document.addEventListener('pointerdown', off, true);
    }, 450);
  }
  // Atalhos do "Ver agora".
  const GO = {
    libNew: () => { UI.switchTab('library', true); setTimeout(() => { const b = document.querySelector('[data-a="kind"][data-k="novo"]'); if (b) b.click(); spotlight('[data-a="kind"][data-k="novo"]', 'Os exercícios novos'); }, 300); },
    gym: () => { UI.switchTab('library', true); },
    voice: () => { UI.push(Screens.Settings()); setTimeout(() => UI.push(Screens.VoiceSettings()), 300); },
    balance: () => { UI.switchTab('home', true); setTimeout(() => { UI.push(Screens.MuscleMap()); setTimeout(() => spotlight('.bal-card', 'Equilíbrio entre os músculos'), 450); }, 250); },
    myBody: () => { UI.switchTab('home', true); setTimeout(() => UI.push(Screens.MuscleMap()), 250); },
    sports: () => { UI.switchTab('plans', true); setTimeout(() => spotlight('[data-a="sports"]', 'Treinos por esporte'), 250); },
    muscles: () => { UI.switchTab('home', true); setTimeout(() => UI.push(Screens.MuscleMap()), 250); },
    month: () => { UI.switchTab('progress', true); setTimeout(() => UI.push(Screens.MonthSummary()), 250); },
    compare: () => { UI.switchTab('progress', true); setTimeout(() => { const b = document.querySelector('.screen [data-a="body"]'); if (b) b.click(); setTimeout(() => spotlight('[data-a="compare"]', 'Comparar fotos'), 500); }, 250); },
    power: () => { UI.switchTab('home', true); setTimeout(() => spotlight('.pw-card', 'Seu nível de poder'), 250); },
    settingsUpdate: () => { UI.push(Screens.Settings()); setTimeout(() => spotlight('[data-a="checkUpdate"]', 'Verificar atualizações'), 350); },
    news: () => { UI.push(Screens.Settings()); setTimeout(() => spotlight('[data-a="news"]', 'Todas as novidades'), 350); },
  };

  // ---------- tour guiado (balões em sequência, toque para avançar) ----------
  function tour(steps, k) {
    k = k || 0; const st = steps[k]; if (!st) return;
    const [sel, text] = st;
    const find = (tries) => {
      const els = [...document.querySelectorAll(sel)], el = els[els.length - 1];
      if (!el) { if (tries < 12) setTimeout(() => find(tries + 1), 250); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        el.classList.add('spot');
        const r = el.getBoundingClientRect(), b = document.createElement('button');
        b.className = 'spot-tip tour'; b.innerHTML = `${UI.esc(text)}<small>${k < steps.length - 1 ? 'Toque para o próximo · ' + (k + 1) + '/' + steps.length : 'Toque para fechar'}</small>`;
        const top = r.top > 110 ? r.top - 66 : r.bottom + 10;
        b.style.top = top + 'px'; b.style.left = Math.max(12, Math.min(window.innerWidth - 232, r.left + r.width / 2 - 110)) + 'px';
        if (r.top <= 110) b.classList.add('below');
        document.body.appendChild(b);
        const end = (adv) => { el.classList.remove('spot'); b.remove(); document.removeEventListener('pointerdown', other, true); if (adv) setTimeout(() => tour(steps, k + 1), 250); };
        const other = (e) => { if (!b.contains(e.target)) end(false); };
        b.addEventListener('click', () => end(true));
        setTimeout(() => document.addEventListener('pointerdown', other, true), 50);
      }, 450);
    };
    find(0);
  }
  function goItem(it) {
    GO[it.go]();
    if (it.tour) setTimeout(() => tour(it.tour), 900);
  }

  // ---------- ponto "Novo" nas abas e botões que mudaram ----------
  // settings.newDots = { "0.28.0:1": true, … } enquanto a pessoa não tocar no lugar.
  const dotKey = (v, k) => v + ':' + k;
  function dotItems() {
    const on = Store.state.settings.newDots || {};
    const out = [];
    CHANGELOG.forEach((c) => c.items.forEach((it, k) => { if (it.dot && on[dotKey(c.v, k)] && forMe(it)) out.push({ key: dotKey(c.v, k), dot: it.dot }); }));
    return out;
  }
  let dotRaf = 0;
  function paintDots() {
    dotRaf = 0;
    const list = dotItems();
    document.querySelectorAll('.nd').forEach((e) => e.classList.remove('nd'));
    list.forEach(({ dot }) => {
      if (dot.tab) { const b = document.querySelector(`.nav button[data-tab="${dot.tab}"]`); if (b) b.classList.add('nd'); }
      if (dot.sel) document.querySelectorAll(dot.sel).forEach((e) => e.classList.add('nd'));
    });
  }
  function startDots() {
    new MutationObserver(() => { if (!dotRaf) dotRaf = requestAnimationFrame(paintDots); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', (e) => {
      const list = dotItems(); if (!list.length) return;
      let changed = false;
      list.forEach(({ key, dot }) => { if (dot.sel && e.target.closest(dot.sel)) { delete Store.state.settings.newDots[key]; changed = true; } });
      if (changed) { Store.save(); paintDots(); }
    }, true);
    paintDots();
  }
  function addDots(sinceV) {
    const st = Store.state.settings; st.newDots = st.newDots || {};
    CHANGELOG.forEach((c) => { if (cmp(c.v, sinceV) > 0) c.items.forEach((it, k) => { if (it.dot && forMe(it)) st.newDots[dotKey(c.v, k)] = true; }); });
  }

  // ---------- "O que há de novo" (um cartão por versão) ----------
  // Cada versão vira um cartão: a novidade principal (a primeira, ou main: true) com print da tela,
  // e as outras numa lista curta embaixo. Quem pulou versões vê no máximo as 3 mais novas.
  function cardsSince(v, max) {
    return CHANGELOG.filter((c) => !v || cmp(c.v, v) > 0).map((c) => {
      const its = c.items.filter(forMe); if (!its.length) return null;
      const main = its.find((x) => x.main) || its[0];
      return { v: c.v, main, rest: its.filter((x) => x !== main) };
    }).filter(Boolean).slice(0, max || 3);
  }
  function show(cards, title) {
    if (!cards.length) return;
    const ov = document.createElement('div');
    ov.className = 'news-ov';
    const media = (it) => (it.img ? `<div class="news-img"><img src="${it.img}" alt="" onerror="this.parentNode.outerHTML='<div class=&quot;news-ic&quot;>${UI.icon(it.icon || 'sparkle', 'lg').replace(/"/g, '&quot;')}</div>'"></div>` : `<div class="news-ic">${UI.icon(it.icon || 'sparkle', 'lg')}</div>`);
    ov.innerHTML = `<div class="news-box"><div class="news-head"><span class="caps">${UI.esc(title || 'O que há de novo')}</span><button class="link small muted" data-n="skip">Pular</button></div>
      <div class="news-track">${cards.map((c, k) => `<div class="news-card">${media(c.main)}<small>Novo na v${c.v}</small><h3>${UI.esc(c.main.t)}</h3><p>${UI.esc(c.main.d)}</p>
        ${c.main.go && GO[c.main.go] ? `<button class="btn lime sm" data-n="go" data-k="${k}">${c.main.tour ? 'Me mostre como' : 'Ver agora'}</button>` : ''}
        ${c.rest.length ? `<div class="news-more"><span>E mais ${c.rest.length === 1 ? '1 novidade' : c.rest.length + ' novidades'}:</span>${c.rest.map((it, j) => `<button data-n="${it.go && GO[it.go] ? 'goR' : 'hist'}" data-k="${k}" data-j="${j}">${UI.icon(it.icon || 'sparkle', 'sm')}<span class="grow">${UI.esc(it.t)}</span>${it.go && GO[it.go] ? UI.icon('next', 'sm') : ''}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>
      <div class="news-foot"><div class="news-dots">${cards.length > 1 ? cards.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('') : ''}</div><button class="btn ghost sm" data-n="next">${cards.length > 1 ? 'Próximo' : 'Fechar'}</button></div></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
    const track = ov.querySelector('.news-track'), dots = ov.querySelectorAll('.news-dots i'), next = ov.querySelector('[data-n="next"]');
    const at = () => Math.round(track.scrollLeft / track.clientWidth);
    track.addEventListener('scroll', () => { const k = at(); dots.forEach((d, j) => d.classList.toggle('on', j === k)); next.textContent = k >= cards.length - 1 ? 'Fechar' : 'Próximo'; }, { passive: true });
    const close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 300); };
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]'); if (!b) return;
      const c = cards[Number(b.dataset.k)];
      if (b.dataset.n === 'skip') close();
      if (b.dataset.n === 'next') { const k = at(); if (k >= cards.length - 1) close(); else track.scrollTo({ left: (k + 1) * track.clientWidth, behavior: 'smooth' }); }
      if (b.dataset.n === 'go') { close(); setTimeout(() => goItem(c.main), 320); }
      if (b.dataset.n === 'goR') { close(); setTimeout(() => goItem(c.rest[Number(b.dataset.j)]), 320); }
      if (b.dataset.n === 'hist') { close(); setTimeout(() => UI.push(History()), 320); }
    });
  }
  const itemsSince = (v) => CHANGELOG.filter((c) => !v || cmp(c.v, v) > 0).flatMap((c) => c.items.filter(forMe).map((it) => Object.assign({ v: c.v }, it)));

  // Na abertura: decide se é instalação nova ou atualização (antes de qualquer plano ser criado).
  // Atualização: os pontos "Novo" aparecem na hora; os cartões ficam guardados para depois de finalizar
  // o próximo treino (settings.newsPending). Exceções: novidade que muda o próprio treino (now: true)
  // aparece já na abertura, e se a pessoa passar 3 dias sem treinar os cartões aparecem ao abrir.
  function maybeShow() {
    const st = Store.state.settings, S = Store.state;
    let seen = st.newsSeen;
    if (!seen) {
      const used = S.sessions.some((s) => !s.demo) || S.plans.length > 0;
      st.newsSeen = VERSION; Store.save();
      if (!used) { startDots(); return; }
      seen = '0.24.1';
    }
    if (cmp(VERSION, seen) > 0) {
      addDots(seen);
      if (!st.newsPending || cmp(st.newsPending, seen) > 0) st.newsPending = seen;
      if (!st.newsPendingAt) st.newsPendingAt = Store.iso(Store.today());
      st.newsSeen = VERSION; Store.save();
    }
    startDots();
    if (!st.newsPending) return;
    const urgent = itemsSince(st.newsPending).some((it) => it.now);
    const old = (Date.now() - new Date(st.newsPendingAt + 'T12:00:00').getTime()) / 864e5 >= 3;
    if (!urgent && !old) return;
    const wait = () => { if (document.getElementById('splash')) { setTimeout(wait, 600); return; } setTimeout(showPending, 500); };
    wait();
  }
  function showPending() {
    const st = Store.state.settings; if (!st.newsPending) return;
    const cards = cardsSince(st.newsPending);
    delete st.newsPending; delete st.newsPendingAt; Store.save();
    show(cards);
  }
  // Chamado ao fechar a tela de "Treino concluído".
  function afterWorkout() { if (Store.state.settings.newsPending) setTimeout(showPending, 450); }

  // Tela "Novidades" (Configurações): histórico por versão.
  function History() {
    return {
      hideNav: true,
      render: () => `<div class="topbar"><button class="icon-btn" data-a="back">${UI.icon('back')}</button><h1>Novidades</h1></div><div class="content">
        <div class="small muted" style="margin:0 2px 12px">Você está na versão <b class="gold">${VERSION}</b>.</div>
        ${CHANGELOG.map((c) => { const its = c.items.filter(forMe); return its.length ? `<div class="section-title"><h2>v${c.v}</h2><span class="small muted">${c.date.split('-').reverse().join('/')}</span></div>
          <div class="card" style="padding:4px 14px">${its.map((it, k) => `<div class="news-row">${UI.icon(it.icon || 'sparkle', 'sm')}<div class="grow"><b>${UI.esc(it.t)}</b><small>${UI.esc(it.d)}</small></div>${it.go && GO[it.go] ? `<button class="link small gold" data-a="go" data-g="${it.go}">Ver</button>` : ''}</div>`).join('')}</div>` : ''; }).join('')}
        <button class="btn ghost block" style="margin-top:18px" data-a="replay">${UI.icon('play', 'sm')}Ver os cartões desta versão</button></div>`,
      actions: {
        back: UI.pop,
        go: (ds) => { UI.pop(); const it = CHANGELOG.flatMap((c) => c.items).find((x) => x.go === ds.g); setTimeout(() => (it ? goItem(it) : GO[ds.g]()), 300); },
        replay: () => show(cardsSince(CHANGELOG[1] && CHANGELOG[1].v, 1)),
      },
    };
  }

  window.News = { CHANGELOG, VERSION, cmp, show, cardsSince, maybeShow, showPending, afterWorkout, tour, paintDots, History, spotlight, forMe };
})();
