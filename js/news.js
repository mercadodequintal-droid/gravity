// Novidades de cada versão: usadas no aviso de versão nova e no "O que há de novo".
// A primeira entrada é a versão deste app. plat: 'android', 'web' (iPhone/navegador) ou omitido (os dois).
// go: atalho do botão "Ver agora" (ver GO abaixo).
(function () {
  'use strict';
  const CHANGELOG = [
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
    sports: () => { UI.switchTab('plans', true); setTimeout(() => spotlight('[data-a="sports"]', 'Treinos por esporte'), 250); },
    muscles: () => { UI.switchTab('home', true); setTimeout(() => UI.push(Screens.MuscleMap()), 250); },
    month: () => { UI.switchTab('progress', true); setTimeout(() => UI.push(Screens.MonthSummary()), 250); },
    compare: () => { UI.switchTab('progress', true); setTimeout(() => { const b = document.querySelector('.screen [data-a="body"]'); if (b) b.click(); setTimeout(() => spotlight('[data-a="compare"]', 'Comparar fotos'), 500); }, 250); },
    power: () => { UI.switchTab('home', true); setTimeout(() => spotlight('.pw-card', 'Seu nível de poder'), 250); },
    settingsUpdate: () => { UI.push(Screens.Settings()); setTimeout(() => spotlight('[data-a="checkUpdate"]', 'Verificar atualizações'), 350); },
    news: () => { UI.push(Screens.Settings()); setTimeout(() => spotlight('[data-a="news"]', 'Todas as novidades'), 350); },
  };

  // ---------- "O que há de novo" (cartões) ----------
  function show(items, title) {
    if (!items.length) return;
    const ov = document.createElement('div');
    ov.className = 'news-ov';
    ov.innerHTML = `<div class="news-box"><div class="news-head"><span class="caps">${UI.esc(title || 'O que há de novo')}</span><button class="link small muted" data-n="skip">Pular</button></div>
      <div class="news-track">${items.map((it, k) => `<div class="news-card"><div class="news-ic">${UI.icon(it.icon || 'sparkle', 'lg')}</div><small>Novo na v${it.v}</small><h3>${UI.esc(it.t)}</h3><p>${UI.esc(it.d)}</p>
        ${it.go && GO[it.go] ? `<button class="btn lime sm" data-n="go" data-k="${k}">Ver agora</button>` : ''}</div>`).join('')}</div>
      <div class="news-foot"><div class="news-dots">${items.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</div><button class="btn ghost sm" data-n="next">${items.length > 1 ? 'Próximo' : 'Fechar'}</button></div></div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
    const track = ov.querySelector('.news-track'), dots = ov.querySelectorAll('.news-dots i'), next = ov.querySelector('[data-n="next"]');
    const at = () => Math.round(track.scrollLeft / track.clientWidth);
    track.addEventListener('scroll', () => { const k = at(); dots.forEach((d, j) => d.classList.toggle('on', j === k)); next.textContent = k >= items.length - 1 ? 'Fechar' : 'Próximo'; }, { passive: true });
    const close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 300); };
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]'); if (!b) return;
      if (b.dataset.n === 'skip') close();
      if (b.dataset.n === 'next') { const k = at(); if (k >= items.length - 1) close(); else track.scrollTo({ left: (k + 1) * track.clientWidth, behavior: 'smooth' }); }
      if (b.dataset.n === 'go') { close(); setTimeout(() => GO[items[Number(b.dataset.k)].go](), 320); }
    });
  }
  const itemsSince = (v) => CHANGELOG.filter((c) => !v || cmp(c.v, v) > 0).flatMap((c) => c.items.filter(forMe).map((it) => Object.assign({ v: c.v }, it)));

  // Depois de atualizar: mostra uma vez as novidades das versões que a pessoa ainda não viu.
  // Instalação nova (sem dados) não mostra nada; quem já usava antes da v0.26 vê as novidades da v0.25 em diante (até 7 cartões).
  // A decisão (instalação nova ou atualização) é tomada na abertura, antes de qualquer plano ser criado.
  function maybeShow() {
    const st = Store.state.settings, S = Store.state;
    let seen = st.newsSeen;
    if (!seen) {
      const used = S.sessions.some((s) => !s.demo) || S.plans.length > 0;
      st.newsSeen = VERSION; Store.save();
      if (!used) return;
      seen = '0.24.1';
    }
    if (cmp(VERSION, seen) <= 0) return;
    st.newsSeen = VERSION; Store.save();
    const items = itemsSince(seen).slice(0, 7);
    const wait = () => { if (document.getElementById('splash')) { setTimeout(wait, 600); return; } setTimeout(() => show(items), 500); };
    wait();
  }

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
        go: (ds) => { UI.pop(); setTimeout(() => GO[ds.g](), 300); },
        replay: () => show(itemsSince(CHANGELOG[1] && CHANGELOG[1].v)),
      },
    };
  }

  window.News = { CHANGELOG, VERSION, cmp, show, maybeShow, History, spotlight, forMe };
})();
