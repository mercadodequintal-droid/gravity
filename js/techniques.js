// Técnicas avançadas de treino: catálogo e regras de como cada uma vira séries no treino.
// Modos:
//   sub    → séries extras ligadas a uma série (drop, rest-pause, myo-reps, cluster…)
//   scheme → muda a estrutura das séries (FST-7, GVT, pirâmides, 21)
//   group  → combina exercícios seguidos sem descanso (bi-set, tri-set…)
//   cue    → orientação de execução (negativa, isometria, cadência…)
(function () {
  'use strict';

  const CATS = [
    { id: 'alem', nome: 'Além da falha', desc: 'Estendem a série depois que as repetições normais acabam.' },
    { id: 'series', nome: 'Estrutura das séries', desc: 'Mudam quantas séries, repetições e quanto descanso.' },
    { id: 'combinar', nome: 'Combinar exercícios', desc: 'Exercícios seguidos, sem descanso entre eles.' },
    { id: 'execucao', nome: 'Controle do movimento', desc: 'Mudam o jeito de executar cada repetição.' },
  ];

  const LIST = [
    // ---------- além da falha ----------
    { id: 'drop', nome: 'Drop set', cat: 'alem', mode: 'sub', sub: 'Drop', pause: 0,
      params: { qtd: 2, pct: 20, todas: false },
      resumo: 'Ao chegar na falha, reduza a carga e continue sem descanso.',
      passos: ['Faça a série normal até perto da falha.', 'Sem descansar, tire cerca de 20% da carga.', 'Repita até a falha de novo; faça 1 a 3 reduções.'],
      cue: (p) => `${p.qtd} ${p.qtd > 1 ? 'reduções' : 'redução'} de ~${p.pct}% sem descanso` },
    { id: 'mecanico', nome: 'Drop set mecânico', cat: 'alem', mode: 'sub', sub: 'Variação', pause: 0,
      params: { qtd: 1, pct: 0, todas: false },
      resumo: 'Na falha, troque para uma variação mais fácil do mesmo movimento, sem descanso.',
      passos: ['Faça a série até perto da falha.', 'Sem descansar, mude para uma variação mais fácil (ex.: inclinado → reto, pegada aberta → fechada).', 'Continue até a falha.'],
      cue: () => 'Na falha, mude para uma variação mais fácil' },
    { id: 'restpause', nome: 'Rest-pause', cat: 'alem', mode: 'sub', sub: 'Mini', pause: 'param',
      params: { qtd: 2, pausa: 15, todas: false },
      resumo: 'Na falha, descanse 10 a 20 s e faça mais algumas repetições com a mesma carga.',
      passos: ['Faça a série até a falha.', 'Descanse de 10 a 20 segundos (o app conta).', 'Faça o máximo de repetições de novo, com a mesma carga.', 'Repita 1 a 3 vezes.'],
      cue: (p) => `${p.qtd} ${p.qtd > 1 ? 'mini-séries' : 'mini-série'} com ${p.pausa} s de pausa` },
    { id: 'myoreps', nome: 'Myo-reps', cat: 'alem', mode: 'sub', sub: 'Mini', pause: 'param',
      params: { qtd: 4, reps: 4, pausa: 5, todas: false },
      resumo: 'Uma série de ativação perto da falha e várias mini-séries curtas com pausas de 3 a 5 respirações.',
      passos: ['Série de ativação de 12 a 20 repetições, perto da falha.', 'Pausa de 3 a 5 respirações (~5 s).', 'Mini-séries de 3 a 5 repetições, com a mesma pausa.', 'Pare quando não conseguir completar a mini-série.'],
      cue: (p) => `Ativação + ${p.qtd} minis de ${p.reps} reps, pausa ${p.pausa} s` },
    { id: 'parciais', nome: 'Repetições parciais', cat: 'alem', mode: 'sub', sub: 'Parciais', pause: 0,
      params: { qtd: 1, reps: 5, pct: 0, todas: false },
      resumo: 'Depois da falha, continue com repetições curtas, só na parte do movimento que ainda sai.',
      passos: ['Faça a série completa até a falha.', 'Sem soltar o peso, faça repetições em meia amplitude.', 'Pare quando nem a parcial sair.'],
      cue: (p) => `+${p.reps} parciais após a falha` },
    { id: 'forcadas', nome: 'Repetições forçadas', cat: 'alem', mode: 'sub', sub: 'Forçadas', pause: 0,
      params: { qtd: 1, reps: 2, pct: 0, todas: false },
      resumo: 'Na falha, um parceiro ajuda só o suficiente para mais 2 ou 3 repetições.',
      passos: ['Faça a série até a falha.', 'O parceiro ajuda levemente na subida.', 'Faça 2 ou 3 repetições extras, descendo sozinho e devagar.'],
      cue: (p) => `+${p.reps} reps com ajuda de um parceiro` },
    { id: 'backoff', nome: 'Back-off set', cat: 'alem', mode: 'sub', sub: 'Back-off', pause: 'rest',
      params: { qtd: 1, pct: 20, extra: 4, todas: false },
      resumo: 'Depois das séries pesadas, uma série extra mais leve e com mais repetições.',
      passos: ['Faça as séries principais.', 'Descanse normalmente.', 'Faça uma série com ~20% menos carga e mais repetições.'],
      cue: (p) => `1 série extra com −${p.pct}% de carga` },

    // ---------- estrutura das séries ----------
    { id: 'fst7', nome: 'FST-7', cat: 'series', mode: 'scheme',
      scheme: { sets: 7, reps: '8-12', rest: 30 }, params: {},
      resumo: '7 séries de 8 a 12 repetições com 30 a 45 s de descanso, no último exercício do músculo.',
      passos: ['Use como o último exercício do grupo muscular.', '7 séries de 8 a 12 repetições.', 'Descanse só 30 a 45 s; beba água e alongue o músculo entre as séries.', 'Se as repetições caírem abaixo de 8, reduza um pouco a carga.'],
      cue: () => '7 séries · 30–45 s de descanso · alongue entre as séries' },
    { id: 'gvt', nome: 'GVT (10×10)', cat: 'series', mode: 'scheme',
      scheme: { sets: 10, reps: '10', rest: 75 }, params: {},
      resumo: 'German Volume Training: 10 séries de 10 repetições com a mesma carga (~60% do máximo).',
      passos: ['Escolha uma carga que você faria cerca de 20 vezes.', '10 séries de 10 repetições.', 'Descanso de 60 a 90 s.', 'Só aumente a carga quando completar as 10×10.'],
      cue: () => '10 × 10 com a mesma carga · 60–90 s de descanso' },
    { id: 'pircresc', nome: 'Pirâmide crescente', cat: 'series', mode: 'scheme', pyramid: 1,
      scheme: { sets: 4, reps: '12-10-8-6' }, params: {},
      resumo: 'A cada série a carga sobe e as repetições caem.',
      passos: ['Comece mais leve, com mais repetições.', 'Aumente a carga a cada série.', 'Termine com a série mais pesada e menos repetições.'],
      cue: () => 'Carga sobe e repetições caem a cada série' },
    { id: 'pirdecr', nome: 'Pirâmide decrescente', cat: 'series', mode: 'scheme', pyramid: -1,
      scheme: { sets: 4, reps: '6-8-10-12' }, params: {},
      resumo: 'Começa com a série mais pesada; a cada série a carga cai e as repetições sobem.',
      passos: ['Aqueça bem antes.', 'Primeira série: a mais pesada, com poucas repetições.', 'Reduza a carga a cada série e faça mais repetições.'],
      cue: () => 'Carga cai e repetições sobem a cada série' },
    { id: 'w531', nome: '5/3/1 (Wendler)', cat: 'series', mode: 'scheme', w531: true,
      scheme: { sets: 3, reps: '5/3/1', rest: 180 }, params: {},
      resumo: 'Ciclo de 4 semanas com porcentagens do seu máximo de treino (TM). A última série é "o máximo que der".',
      passos: ['Em "Carga sugerida", coloque seu máximo de treino (TM ≈ 90% do seu 1RM).', 'Semana 1: 65%, 75% e 85% × 5, 5, 5+.', 'Semana 2: 70%, 80% e 90% × 3, 3, 3+.', 'Semana 3: 75%, 85% e 95% × 5, 3, 1+.', 'Semana 4 (deload): 40%, 50% e 60% × 5.', 'Na série com "+", faça o máximo de repetições com boa técnica. No ciclo seguinte, suba o TM em 2,5 kg (supino e desenvolvimento) ou 5 kg (agachamento e terra).'],
      cue: () => 'Carga calculada pela semana do plano · última série: máximo de reps' },
    { id: 'cluster', nome: 'Cluster set', cat: 'series', mode: 'sub', sub: 'Bloco', pause: 'param',
      params: { qtd: 3, reps: 3, pausa: 15, todas: true },
      resumo: 'Cada série é dividida em blocos curtos com 10 a 20 s de pausa, para usar mais carga.',
      passos: ['Escolha uma carga pesada.', 'Faça um bloco de 2 a 4 repetições.', 'Pausa de 10 a 20 s (o app conta).', 'Repita os blocos; o conjunto conta como uma série.'],
      cue: (p) => `Blocos de ${p.reps} reps com ${p.pausa} s de pausa` },
    { id: 'r21', nome: 'Método 21', cat: 'series', mode: 'scheme',
      scheme: { sets: 3, reps: '21', rest: 60 }, params: {},
      resumo: '7 repetições na metade de baixo, 7 na metade de cima e 7 completas, sem parar.',
      passos: ['7 repetições da posição inicial até a metade.', '7 repetições da metade até o topo.', '7 repetições completas.', 'Tudo seguido; use uma carga mais leve.'],
      cue: () => '7 baixo + 7 cima + 7 completas' },

    // ---------- combinar exercícios ----------
    { id: 'biset', nome: 'Bi-set', cat: 'combinar', mode: 'group', size: 2, params: {},
      resumo: 'Dois exercícios do mesmo músculo, um seguido do outro, sem descanso.',
      passos: ['Faça a série do 1º exercício.', 'Vá direto para o 2º, sem descanso.', 'Descanse só depois do 2º e repita.'],
      cue: () => '2 exercícios seguidos, descanso no fim' },
    { id: 'superset', nome: 'Super-set', cat: 'combinar', mode: 'group', size: 2, params: {},
      resumo: 'Dois exercícios de músculos opostos (ex.: bíceps e tríceps) seguidos, sem descanso.',
      passos: ['Escolha músculos antagonistas (peito/costas, bíceps/tríceps).', 'Faça um exercício e vá direto para o outro.', 'Descanse no fim do par.'],
      cue: () => 'Músculos opostos seguidos, descanso no fim' },
    { id: 'preexaustao', nome: 'Pré-exaustão', cat: 'combinar', mode: 'group', size: 2, params: {},
      resumo: 'Um exercício isolado antes do composto, para cansar o músculo-alvo primeiro.',
      passos: ['1º: exercício isolado (ex.: crucifixo, extensora).', 'Sem descanso, 2º: exercício composto (ex.: supino, agachamento).', 'Descanse no fim do par.'],
      cue: () => 'Isolado primeiro, composto em seguida' },
    { id: 'posexaustao', nome: 'Pós-exaustão', cat: 'combinar', mode: 'group', size: 2, params: {},
      resumo: 'O composto primeiro e, sem descanso, um isolado para terminar o músculo.',
      passos: ['1º: exercício composto pesado.', 'Sem descanso, 2º: exercício isolado do mesmo músculo.', 'Descanse no fim do par.'],
      cue: () => 'Composto primeiro, isolado em seguida' },
    { id: 'triset', nome: 'Tri-set', cat: 'combinar', mode: 'group', size: 3, params: {},
      resumo: 'Três exercícios seguidos, sem descanso entre eles.',
      passos: ['Faça os três exercícios em sequência.', 'Descanse só no fim da volta.', 'Repita o número de séries.'],
      cue: () => '3 exercícios seguidos, descanso no fim' },
    { id: 'gigante', nome: 'Série gigante', cat: 'combinar', mode: 'group', size: 4, params: {},
      resumo: 'Quatro ou mais exercícios seguidos, sem descanso. Muito estresse metabólico.',
      passos: ['Faça 4 ou mais exercícios em sequência.', 'Descanse só no fim da volta.', 'Use cargas moderadas.'],
      cue: () => '4+ exercícios seguidos, descanso no fim' },

    // ---------- controle do movimento ----------
    { id: 'negativa', nome: 'Negativa lenta', cat: 'execucao', mode: 'cue', params: { seg: 4 },
      resumo: 'Controle a descida do peso (fase excêntrica) bem devagar.',
      passos: ['Suba normalmente.', 'Desça contando os segundos, sem deixar o peso cair.', 'Mantenha a tensão o tempo todo.'],
      cue: (p) => `Desça em ${p.seg} s` },
    { id: 'isometria', nome: 'Isometria / pico', cat: 'execucao', mode: 'cue', params: { seg: 2 },
      resumo: 'Segure o peso parado no ponto de maior contração.',
      passos: ['Suba até a contração máxima.', 'Segure parado e aperte o músculo.', 'Desça controlando.'],
      cue: (p) => `Segure ${p.seg} s na contração` },
    { id: 'cadencia', nome: 'Cadência controlada', cat: 'execucao', mode: 'cue', params: { tempo: '3-1-1' },
      resumo: 'Tempo fixo para cada fase: descida, pausa e subida.',
      passos: ['O 1º número é a descida, em segundos.', 'O 2º é a pausa embaixo.', 'O 3º é a subida.'],
      cue: (p) => `Cadência ${p.tempo} (desce-pausa-sobe)` },
    { id: 'umaemeia', nome: 'Repetição 1½', cat: 'execucao', mode: 'cue', params: {},
      resumo: 'Cada repetição tem meia repetição embaixo e depois uma completa.',
      passos: ['Desça até embaixo.', 'Suba até a metade e volte.', 'Suba até o topo: isso conta como 1 repetição.'],
      cue: () => 'Meia repetição + uma completa = 1' },
  ];

  const MAP = {};
  LIST.forEach((t) => { MAP[t.id] = t; });
  const get = (id) => MAP[id] || null;
  const params = (tech) => (tech ? Object.assign({}, (get(tech.id) || {}).params, tech) : {});
  const round = (v) => Math.max(0, Math.round(v * 2) / 2);
  const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);

  // Rótulo curto para chips (ex.: "Drop set · 2×20%").
  function chip(item) {
    const t = item.tech && get(item.tech.id);
    if (!t) return '';
    const p = params(item.tech);
    if (t.id === 'drop') return `Drop set · ${p.qtd}×${p.pct}%`;
    if (t.id === 'restpause') return `Rest-pause · ${p.qtd}×${p.pausa}s`;
    if (t.id === 'cluster') return `Cluster · ${p.reps} reps`;
    if (t.id === 'w531') return `5/3/1 · TM ${item.kg} kg`;
    return t.nome;
  }

  // Ao escolher uma técnica de estrutura, ajusta séries, repetições e descanso do exercício.
  function applyScheme(item, id) {
    const t = get(id);
    if (!t || t.mode !== 'scheme') return false;
    if (t.scheme.sets) item.sets = t.scheme.sets;
    if (t.scheme.reps) item.reps = t.scheme.reps;
    if (t.scheme.rest) item.rest = t.scheme.rest;
    return true;
  }

  // Monta as séries de um exercício para uma sessão, incluindo as séries extras da técnica.
  // last = séries principais feitas da última vez (para pré-preencher carga/repetições).
  // Semana do ciclo 5/3/1: porcentagens do TM e repetições ("+" = máximo possível).
  const WAVE = [[[0.65, 5], [0.75, 5], [0.85, '5+']], [[0.7, 3], [0.8, 3], [0.9, '3+']], [[0.75, 5], [0.85, 3], [0.95, '1+']], [[0.4, 5], [0.5, 5], [0.6, 5]]];
  function wave531(item, week) {
    const wk = ((Math.max(1, week || 1) - 1) % 4);
    const tm = Number(item.kg) || 0;
    return WAVE[wk].map(([pct, r], i) => ({ n: i + 1, kg: Math.max(0, Math.round(tm * pct / 2.5) * 2.5), reps: parseInt(r, 10), target: String(r) }));
  }

  function buildSets(item, last, inc, repsTarget, week) {
    const t = item.tech && get(item.tech.id);
    const p = params(item.tech);
    const rows = [];
    if (t && t.w531) return wave531(item, week);
    const list = nums(item.reps);
    const pyr = t && t.pyramid && list.length > 1;
    for (let n = 1; n <= item.sets; n++) {
      const prev = last && (last[n - 1] || last[last.length - 1]);
      let kg = prev ? prev.kg : Number(item.kg) || 0;
      let reps = prev ? prev.reps : repsTarget(item.reps);
      let target = null;
      if (pyr) {
        target = list[Math.min(n - 1, list.length - 1)];
        if (!prev || !last[n - 1]) kg = round((Number(item.kg) || 0) + t.pyramid * (n - 1) * (inc || 2) * 2);
        reps = prev && last[n - 1] ? prev.reps : target;
      }
      if (t && t.id === 'cluster') reps = p.reps;
      rows.push({ n, kg, reps, target });
      if (t && t.mode === 'sub' && (p.todas || n === item.sets)) {
        let k = kg;
        for (let j = 1; j <= p.qtd; j++) {
          if (p.pct) k = round(k * (1 - p.pct / 100));
          let r = reps;
          if (t.id === 'restpause') r = Math.max(2, Math.round(reps / 3));
          else if (t.id === 'backoff') r = reps + (p.extra || 4);
          else if (p.reps) r = p.reps;
          rows.push({ n, sub: true, label: `${t.sub}${p.qtd > 1 ? ' ' + j : ''}`, kg: k, reps: r });
        }
      }
    }
    return rows;
  }

  // Pausa entre uma série e sua próxima série extra: 0 = sem descanso, número = segundos, 'rest' = descanso normal.
  function pauseFor(item) {
    const t = item.tech && get(item.tech.id);
    if (!t || t.mode !== 'sub') return null;
    if (t.pause === 'param') return Number(params(item.tech).pausa) || 15;
    if (t.pause === 'rest') return 'rest';
    return 0;
  }

  // Grupos (bi-set etc.): itens seguidos com o mesmo group.id.
  function groupOf(items, i) {
    const g = items[i] && items[i].group;
    if (!g) return null;
    let a = i, b = i;
    while (a > 0 && items[a - 1].group && items[a - 1].group.id === g.id) a--;
    while (b < items.length - 1 && items[b + 1].group && items[b + 1].group.id === g.id) b++;
    if (a === b) return null;
    return { start: a, end: b, type: g.type, tech: get(g.type), pos: i - a + 1, size: b - a + 1 };
  }

  const findByName = (name) => {
    const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    if (!n) return null;
    return LIST.find((t) => t.id === n || t.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '') === n) || null;
  };

  window.TECH = { CATS, LIST, get, params, chip, applyScheme, buildSets, pauseFor, groupOf, findByName };
})();
