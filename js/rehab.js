// Fortalecer região (aprovado em 22/11): 8 protocolos de fortalecimento baseados em diretrizes de fisioterapia,
// em 3 fases (Ativar, Fortalecer, Função), versão academia e em casa. Usa-se como bloco OPCIONAL no começo dos
// treinos (recomendado) ou como plano separado. Liga-se ao registro de dor: a mesma região 2× em 14 dias, sem dor
// forte, vira sugestão na tela inicial; depois do treino, uma nota de 0 a 10 decide se a fase avança.
// Fontes por região em REGIONS[x].fonte; detalhes em docs/PROPOSTA-PONTOS-FRACOS-FISIO.md.
(function () {
  'use strict';
  const { icon, esc, toast, push, pop, refresh, sheet, closeSheet, sheetRefresh } = UI;
  const S = () => Store.state;

  // Os 6 exercícios novos (rx01–rx06) ficam em js/library-extra.js, que carrega antes do Store.


  // [exercício, séries, repetições (ou segundos), descanso s, observação]
  const R = (id, s, r, rest, n) => [id, s, String(r), rest || 45, n || ''];
  const REGIONS = {
    joelho: { nome: 'Joelho', sub: 'dor patelar, artrose leve', low: true,
      fonte: 'Diretriz de dor patelofemoral (JOSPT, 2019): exercícios de quadril e joelho combinados. Diretriz de artrose (OARSI, 2019): exercício de força como tratamento central.',
      test: 'stepdown',
      f: [
        { g: [R('rx01', 3, 15, 45, 'Cada lado'), R('ex40', 3, 15), R('tx02', 4, 30, 45, 'Sem dor ou dor até 3'), R('ex34', 3, 15, 60, 'Só os últimos 30° (arco curto), carga leve'), R('nx101', 3, 12, 45, 'Passos para cada lado')],
          c: [R('rx01', 3, 15, 45, 'Cada lado'), R('ex40', 3, 15, 45, 'Peso do corpo'), R('tx02', 4, 30, 45, 'Sem dor ou dor até 3'), R('nx102', 3, 15, 45, 'Cada lado'), R('lx01', 3, 10, 60)] },
        { g: [R('ex151', 3, 15, 60), R('ex31', 3, 12, 90, 'Amplitude sem dor'), R('ex34', 3, 12, 60), R('ex83', 3, 10, 60, 'Cada lado'), R('rx02', 3, 10, 60, 'Cada lado, desça em 3 s')],
          c: [R('rx01', 3, 20, 45, 'Cada lado, com elástico se tiver'), R('lx01', 3, 15, 60), R('rx02', 3, 10, 60, 'Cada lado, desça em 3 s'), R('ex83', 3, 12, 60, 'Cada lado'), R('nx101', 3, 15, 45)] },
        { g: [R('rx02', 3, 12, 60, 'Cada lado'), R('nx079', 3, 10, 90, 'Cada lado'), R('ex33', 3, 12, 90), R('sx04', 3, 30, 45, 'Cada lado'), R('ex83', 3, 12, 60, 'Cada lado')],
          c: [R('rx02', 3, 15, 60, 'Cada lado'), R('lx01', 3, 20, 60), R('sx04', 3, 30, 45, 'Cada lado'), R('ex83', 3, 15, 60, 'Cada lado'), R('nx101', 3, 20, 45)] },
      ] },
    ombro: { nome: 'Ombro', sub: 'manguito, estabilidade', low: false,
      fonte: 'Diretriz de tendinopatia do manguito rotador (JOSPT, 2025): exercício é o tratamento central, com resistência progressiva e controle motor, conforme a tolerância à dor.',
      test: 'extrot',
      f: [
        { g: [R('rx04', 3, 15, 45, 'Cada lado; se doer, isometria de 30 s'), R('sx03', 2, 8), R('nx039', 3, 15), R('ex18', 3, 12, 60, 'Carga leve')],
          c: [R('rx04', 3, 15, 45, 'Cada lado; se doer, isometria de 30 s'), R('sx03', 2, 8), R('nx039', 3, 15), R('nx045', 3, 12)] },
        { g: [R('sx02', 3, 12, 60, 'Cada lado'), R('ex49', 3, 15, 60), R('ex20', 3, 12, 60, 'Cada lado'), R('ex46', 3, 12, 60, 'Até a altura do ombro'), R('ex101', 3, 10, 60)],
          c: [R('rx04', 3, 20, 45, 'Cada lado'), R('nx045', 3, 15), R('sx03', 3, 8), R('nx039', 3, 20), R('ex101', 3, 10, 60)] },
        { g: [R('sx02', 3, 12, 60, 'Cada lado'), R('ex20', 3, 10, 60, 'Cada lado'), R('ex46', 3, 12, 60), R('ex08', 3, 10, 60), R('ex43', 3, 10, 90, 'Carga leve, sem dor')],
          c: [R('rx04', 3, 20, 45, 'Cada lado, elástico mais forte'), R('ex84', 3, 10, 60), R('ex08', 3, 10, 60), R('sx03', 3, 10), R('nx045', 3, 15)] },
      ] },
    lombar: { nome: 'Lombar', sub: 'costas baixas', low: true,
      fonte: 'Diretriz da OMS sobre dor lombar crônica (2023) e NICE NG59: exercício estruturado é recomendado; nenhum tipo específico se mostrou melhor que outro.',
      test: 'sideplank',
      f: [
        { g: [R('nx107', 3, 8, 45, 'Cada lado'), R('nx106', 3, 8, 45, 'Cada lado'), R('ex40', 3, 12), R('tx01', 3, 20, 45, 'Cada lado'), R('ex55', 3, 20)],
          c: [R('nx107', 3, 8, 45, 'Cada lado'), R('nx106', 3, 8, 45, 'Cada lado'), R('ex40', 3, 12, 45, 'Peso do corpo'), R('tx01', 3, 20, 45, 'Cada lado'), R('ex55', 3, 20)] },
        { g: [R('nx107', 3, 10, 45, 'Cada lado'), R('tx01', 3, 30, 45, 'Cada lado'), R('ex149', 3, 10, 90, 'Carga leve, costas neutras'), R('nx105', 3, 10, 45, 'Cada lado'), R('ex33', 3, 10, 90)],
          c: [R('nx107', 3, 10, 45, 'Cada lado'), R('tx01', 3, 30, 45, 'Cada lado'), R('ex83', 3, 10, 60, 'Cada lado'), R('ex55', 3, 40), R('lx01', 3, 15, 60)] },
        { g: [R('ex149', 3, 10, 90), R('ex78', 3, 30, 60), R('tx01', 3, 40, 45, 'Cada lado'), R('ex33', 3, 12, 90), R('nx105', 3, 12, 45, 'Cada lado')],
          c: [R('ex83', 3, 12, 60, 'Cada lado'), R('tx01', 3, 40, 45, 'Cada lado'), R('nx106', 3, 12, 45, 'Cada lado'), R('lx01', 3, 20, 60), R('ex55', 3, 45)] },
      ] },
    pescoco: { nome: 'Pescoço', sub: 'e parte alta das costas', low: false,
      fonte: 'Diretriz de dor no pescoço (JOSPT, 2017) e revisão Cochrane: fortalecimento de pescoço, ombros e escápulas; flexores profundos do pescoço para coordenação.',
      test: null,
      f: [
        { g: [R('rx03', 3, 10, 30, 'Segure 5 s'), R('nx039', 3, 15), R('sx03', 2, 8), R('ex18', 3, 12, 60, 'Carga leve')],
          c: [R('rx03', 3, 10, 30, 'Segure 5 s'), R('nx039', 3, 15), R('sx03', 2, 8), R('nx045', 3, 12)] },
        { g: [R('rx03', 3, 10, 30, 'Segure 10 s'), R('ex49', 3, 15, 60), R('ex20', 3, 12, 60, 'Cada lado'), R('ex51', 3, 12, 60, 'Carga leve'), R('sx02', 3, 12, 60, 'Cada lado')],
          c: [R('rx03', 3, 10, 30, 'Segure 10 s'), R('nx045', 3, 15), R('sx03', 3, 8), R('nx039', 3, 20), R('rx04', 3, 15, 45, 'Cada lado')] },
        { g: [R('rx03', 3, 12, 30, 'Segure 10 s'), R('ex20', 3, 10, 60, 'Cada lado'), R('ex49', 3, 15, 60), R('ex51', 3, 12, 60), R('ex46', 3, 12, 60)],
          c: [R('rx03', 3, 12, 30, 'Segure 10 s'), R('ex84', 3, 10, 60), R('nx045', 3, 15), R('sx03', 3, 10), R('rx04', 3, 20, 45, 'Cada lado')] },
      ] },
    quadril: { nome: 'Quadril', sub: 'glúteos e lateral', low: true,
      fonte: 'Diretriz de artrose (OARSI, 2019) e estudo LEAP (tendinopatia glútea): exercício com orientação sobre carga funciona melhor que injeção a longo prazo. Evite cruzar as pernas e alongar a lateral do quadril.',
      test: 'oneleg',
      f: [
        { g: [R('rx01', 3, 12, 45, 'Cada lado'), R('ex40', 3, 15), R('nx101', 3, 12, 45), R('lx01', 3, 10, 60), R('sx04', 3, 20, 45, 'Cada lado')],
          c: [R('rx01', 3, 12, 45, 'Cada lado'), R('ex40', 3, 15, 45, 'Peso do corpo'), R('nx101', 3, 12, 45), R('lx01', 3, 10, 60), R('sx04', 3, 20, 45, 'Cada lado')] },
        { g: [R('ex151', 3, 12, 60), R('ex83', 3, 10, 60, 'Cada lado'), R('ex33', 3, 10, 90), R('rx02', 3, 10, 60, 'Cada lado'), R('nx101', 3, 15)],
          c: [R('nx102', 3, 15, 45, 'Cada lado'), R('ex83', 3, 10, 60, 'Cada lado'), R('lx01', 3, 15, 60), R('rx02', 3, 10, 60, 'Cada lado'), R('nx101', 3, 15)] },
        { g: [R('ex39', 3, 10, 90), R('nx079', 3, 10, 90, 'Cada lado'), R('sx04', 3, 30, 45, 'Cada lado'), R('nx101', 3, 15), R('ex149', 3, 10, 90)],
          c: [R('ex83', 3, 15, 60, 'Cada lado'), R('rx02', 3, 12, 60, 'Cada lado'), R('sx04', 3, 30, 45, 'Cada lado'), R('nx101', 3, 20), R('lx01', 3, 20, 60)] },
      ] },
    tornozelo: { nome: 'Tornozelo', sub: 'entorse, equilíbrio, Aquiles', low: true,
      fonte: 'Diretriz de entorse lateral (JOSPT, 2021): equilíbrio e propriocepção previnem novas entorses. Diretriz de tendão de Aquiles (JOSPT, 2018 e 2024): carga no tendão, a mais alta que tolerar, 3× por semana.',
      test: 'oneleg',
      f: [
        { g: [R('rx05', 3, 15, 30, 'Cada direção'), R('sx04', 3, 30, 45, 'Cada lado'), R('ex155', 3, 15, 60, 'Suba em 2 s, desça em 3 s'), R('nx103', 3, 15)],
          c: [R('rx05', 3, 15, 30, 'Cada direção'), R('sx04', 3, 30, 45, 'Cada lado'), R('sx08', 3, 10, 60, 'Com as duas pernas no começo'), R('nx103', 3, 15)] },
        { g: [R('sx08', 3, 12, 60, 'Cada lado, desça em 3 s'), R('rx05', 3, 20, 30, 'Cada direção'), R('sx04', 3, 30, 45, 'Olhos fechados, perto de um apoio'), R('ex41', 3, 15, 60), R('nx103', 3, 15)],
          c: [R('sx08', 3, 12, 60, 'Cada lado, desça em 3 s'), R('rx05', 3, 20, 30, 'Cada direção'), R('sx04', 3, 30, 45, 'Olhos fechados, perto de um apoio'), R('lx02', 3, 10, 30), R('nx103', 3, 15)] },
        { g: [R('sx08', 3, 15, 60, 'Cada lado, com peso'), R('sx04', 3, 45, 45, 'Olhos fechados'), R('sx01', 3, 8, 60, 'Aterrisse macio'), R('ex155', 3, 12, 60), R('lx02', 3, 10, 30)],
          c: [R('sx08', 3, 15, 60, 'Cada lado, com mochila'), R('sx04', 3, 45, 45, 'Olhos fechados'), R('sx01', 3, 8, 60, 'Aterrisse macio'), R('lx02', 3, 10, 30), R('rx05', 3, 20, 30)] },
      ] },
    cotovelo: { nome: 'Cotovelo', sub: 'tendinite lateral', low: false,
      fonte: 'Revisão de 30 estudos e guia do NHS (tendinite lateral do cotovelo): exercício é melhor que tratamentos passivos, com carga progressiva (subida e descida do punho).',
      test: null,
      f: [
        { g: [R('nx060', 3, 15, 45, 'Carga bem leve; se doer, isometria de 30 s'), R('rx06', 3, 12, 45, 'Cada lado'), R('nx059', 2, 15, 45, 'Leve'), R('ex27', 2, 12, 60, 'Leve')],
          c: [R('nx060', 3, 15, 45, 'Com garrafa de água; se doer, isometria de 30 s'), R('rx06', 3, 12, 45, 'Cada lado'), R('nx059', 2, 15, 45, 'Leve'), R('ex27', 2, 12, 60, 'Com garrafas')] },
        { g: [R('nx060', 3, 12, 45, 'Desça em 3 s'), R('rx06', 3, 15, 45, 'Cada lado'), R('ex27', 3, 12, 60), R('ex20', 3, 12, 60, 'Cada lado'), R('ex78', 3, 30, 60)],
          c: [R('nx060', 3, 12, 45, 'Desça em 3 s'), R('rx06', 3, 15, 45, 'Cada lado'), R('ex27', 3, 12, 60), R('ex84', 3, 10, 60), R('nx059', 3, 15)] },
        { g: [R('nx060', 3, 12, 45, 'Mais carga, desça em 3 s'), R('ex27', 3, 10, 60), R('ex78', 3, 40, 60), R('sx05', 3, 20, 60), R('ex20', 3, 10, 60, 'Cada lado')],
          c: [R('nx060', 3, 12, 45, 'Mais carga, desça em 3 s'), R('rx06', 3, 15, 45, 'Cada lado'), R('ex27', 3, 12, 60), R('ex84', 3, 12, 60), R('nx059', 3, 15)] },
      ] },
    punho: { nome: 'Punho', sub: 'e pegada', low: false,
      fonte: 'Estudo controlado em dor crônica no punho: força de pegada com estabilidade do punho. Evidência mais fraca que nas outras regiões.',
      test: null,
      f: [
        { g: [R('nx059', 2, 15, 45, 'Leve'), R('nx060', 2, 15, 45, 'Leve'), R('rx06', 3, 12, 45, 'Cada lado'), R('ex78', 3, 20, 60)],
          c: [R('nx059', 2, 15, 45, 'Com garrafa de água'), R('nx060', 2, 15, 45, 'Com garrafa de água'), R('rx06', 3, 12, 45, 'Cada lado'), R('ex27', 2, 12, 60, 'Com garrafas')] },
        { g: [R('nx059', 3, 12, 45), R('nx060', 3, 12, 45), R('rx06', 3, 15, 45, 'Cada lado'), R('ex78', 3, 30, 60), R('ex27', 3, 12, 60)],
          c: [R('nx059', 3, 12, 45), R('nx060', 3, 12, 45), R('rx06', 3, 15, 45, 'Cada lado'), R('ex27', 3, 12, 60), R('ex101', 3, 10, 60, 'Punho neutro')] },
        { g: [R('nx059', 3, 12, 45, 'Mais carga'), R('nx060', 3, 12, 45, 'Mais carga'), R('sx05', 3, 20, 60), R('ex78', 3, 40, 60), R('ex08', 3, 8, 60, 'Punho neutro')],
          c: [R('nx059', 3, 12, 45), R('nx060', 3, 12, 45), R('rx06', 3, 15, 45, 'Cada lado'), R('ex08', 3, 8, 60, 'Punho neutro'), R('ex27', 3, 12, 60)] },
      ] },
  };
  const ORDER = ['joelho', 'ombro', 'lombar', 'pescoco', 'quadril', 'tornozelo', 'cotovelo', 'punho'];
  const PHASES = [['Ativar', 'sem 1–2', 'isometria e controle'], ['Fortalecer', 'sem 3–6', 'carga progressiva'], ['Função', 'sem 7–8', 'mais difícil e no dia a dia']];
  const WEEKS = 8;
  // Região do registro de dor → protocolo.
  const SPOT = { Ombro: 'ombro', Cotovelo: 'cotovelo', Punho: 'punho', 'Pescoço': 'pescoco', Costas: 'pescoco', Lombar: 'lombar', Quadril: 'quadril', Joelho: 'joelho', Tornozelo: 'tornozelo' };
  // Esporte → região mais exigida (bloco de prevenção opcional).
  const SPORT = { futebol: 'joelho', futsal: 'tornozelo', basquete: 'tornozelo', volei: 'ombro', futevolei: 'tornozelo', handebol: 'ombro', natacao: 'ombro', tenis: 'ombro', beachtennis: 'ombro',
    corrida: 'tornozelo', ciclismo: 'joelho', skate: 'tornozelo', atletismo: 'tornozelo', judo: 'ombro', jiujitsu: 'pescoco', surfe: 'ombro', funcional: 'lombar', caminhada: 'tornozelo' };

  // ---------- estado ----------
  // S.rehab = { regions: { joelho: { start, place, mode: 'bloco'|'plano', planId, scores: [{date, v}], hold } }, snooze: { joelho: ts }, warned: { regiao: true } }
  function st() { const s = S(); if (!s.rehab) s.rehab = { regions: {}, snooze: {}, warned: {} }; return s.rehab; }
  const active = () => Object.keys(st().regions);
  const info = (r) => st().regions[r];
  // Semana (1..8) e fase (0..2). Dor acima de 5 na última semana segura a fase.
  function weekOf(r) {
    const a = info(r); if (!a) return 0;
    return Math.min(WEEKS, Math.floor((Store.today() - Store.parseISO(a.start)) / (7 * Store.DAY)) + 1);
  }
  function phaseOf(r) {
    const a = info(r); if (!a) return 0;
    const wk = weekOf(r), byWeek = wk <= 2 ? 0 : wk <= 6 ? 1 : 2;
    if (a.hold && a.phase != null) return a.phase;
    return byWeek;
  }
  function list(r, phase, place) { const R0 = REGIONS[r]; return R0.f[phase][place === 'casa' ? 'c' : 'g']; }

  // Itens do bloco: 3 exercícios, no máximo 2 séries (o bloco é curto). Plano separado: tudo, com as séries cheias.
  function blockItems(r, phase, place, full) {
    const L = list(r, phase, place), a = info(r) || {};
    return (full ? L : L.slice(0, 3)).map(([exId, sets, reps, rest, note]) => ({
      id: Store.uid('i'), exId, sets: full ? sets : Math.min(2, sets) - (a.lighter ? 1 : 0) || 1, reps, kg: 0, rest, note, tech: null, group: null,
      opt: !full, blk: r, ph: phase,
    }));
  }
  // Treinos que recebem o bloco: os que treinam a parte do corpo da região (até 3); sem nenhum, todos.
  const LOW = ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas'];
  function targetWorkouts(plan, r) {
    const low = REGIONS[r].low;
    const hits = plan.workouts.filter((w) => w.items.some((it) => { const ex = Store.exercise(it.exId); if (!ex) return false; const m = Object.keys(Analytics.musclesOf(ex)); return low ? m.some((k) => LOW.includes(k)) : m.some((k) => !LOW.includes(k) && k !== 'abdomen'); }));
    return (hits.length ? hits : plan.workouts).slice(0, 3);
  }
  // Mantém os blocos do plano ativo na fase certa (chamado ao abrir a tela inicial e ao começar um treino).
  function sync() {
    const plan = Store.activePlan(); if (!plan) return;
    let changed = false;
    active().forEach((r) => {
      const a = info(r), ph = phaseOf(r);
      if (a.mode === 'plano') {
        const p = S().plans.find((x) => x.id === a.planId); if (!p) return;
        p.workouts.forEach((w) => { if (w.items.some((it) => it.blk === r && it.ph !== ph)) { w.items = blockItems(r, ph, a.place, true); changed = true; } });
        return;
      }
      const ws = targetWorkouts(plan, r);
      plan.workouts.forEach((w) => {
        const has = w.items.filter((it) => it.blk === r);
        const want = ws.includes(w);
        if (!want && has.length) { w.items = w.items.filter((it) => it.blk !== r); changed = true; }
        if (want && (!has.length || has.some((it) => it.ph !== ph))) { w.items = blockItems(r, ph, a.place, false).concat(w.items.filter((it) => it.blk !== r)); changed = true; }
      });
    });
    // Região encerrada: tira os blocos que sobraram.
    plan.workouts.forEach((w) => { if (w.items.some((it) => it.blk && !info(it.blk))) { w.items = w.items.filter((it) => !it.blk || info(it.blk)); changed = true; } });
    if (changed) Store.save();
  }
  function start(r, place, mode) {
    const s = st();
    s.regions[r] = { start: Store.iso(Store.weekStartOf(Store.today(), S().settings.weekStart)), place, mode, scores: [], hold: false };
    if (mode === 'plano') {
      const d = S().settings.weekStart === 0 ? [1, 3, 5] : [1, 3, 5];
      const p = { id: Store.uid('p'), name: 'Fortalecer ' + REGIONS[r].nome.toLowerCase(), goal: 'Fortalecimento · 3 dias · ~20 min', weeks: WEEKS, startDate: s.regions[r].start, rehab: r,
        workouts: [{ id: Store.uid('w'), letter: 'A', name: 'Fortalecer ' + REGIONS[r].nome.toLowerCase(), days: d, items: blockItems(r, 0, place, true) }] };
      S().plans.push(p); S().activePlanId = p.id; s.regions[r].planId = p.id;
    }
    Store.save(); sync();
  }
  function stop(r) { delete st().regions[r]; Store.save(); sync(); }
  // Nota da dor depois do treino: acima de 5 segura a fase e diminui o bloco; duas notas até 3 liberam de novo.
  function score(r, v) {
    const a = info(r); if (!a) return;
    a.scores = (a.scores || []).concat([{ date: Store.iso(Store.today()), v }]).slice(-40);
    if (v > 5) { a.phase = phaseOf(r); a.hold = true; a.lighter = true; }
    else { const last = a.scores.slice(-2); if (a.hold && last.length === 2 && last.every((x) => x.v <= 3)) { a.hold = false; a.lighter = false; a.phase = null; } }
    Store.save(); sync();
  }

  // ---------- dor → sugestão ----------
  const DAY14 = () => Store.iso(Store.addDays(Store.today(), -14));
  function painSuggestion() {
    const since = DAY14(), pains = (S().pain || []).filter((p) => p.date >= since && SPOT[p.where]);
    const by = {};
    pains.forEach((p) => { const r = SPOT[p.where]; (by[r] = by[r] || []).push(p); });
    const sn = st().snooze || {};
    for (const r of Object.keys(by)) {
      if (info(r)) continue;
      if (sn[r] && Date.now() - sn[r] < 14 * Store.DAY) continue;
      const L = by[r];
      if (L.some((p) => p.lvl === 2)) return { r, strong: true, n: L.length, ex: [...new Set(L.map((p) => Store.exercise(p.exId).nome))] };
      if (L.length >= 2) return { r, n: L.length, ex: [...new Set(L.map((p) => Store.exercise(p.exId).nome))] };
    }
    return null;
  }
  function homeCard() {
    const sg = painSuggestion(); if (!sg) return '';
    const nome = REGIONS[sg.r].nome.toLowerCase(), exs = sg.ex.slice(0, 2).map(esc).join(' e ');
    if (sg.strong) return `<div class="card rh-card appear"><b>${icon('alert', 'sm')} Dor forte no ${nome}</b><small>Você marcou dor forte ${exs ? 'em ' + exs : ''}. Antes de fortalecer a região, procure um médico ou fisioterapeuta. Se a dor for aguda ou não melhorar, não treine a região.</small><div class="btn-row" style="margin-top:12px"><button class="btn lime sm" data-a="rhNo" data-r="${sg.r}">Entendi</button></div></div>`;
    return `<div class="card rh-card appear"><b>${icon('alert', 'sm')} Seu ${nome} incomodou ${sg.n}× nos últimos 14 dias</b><small>${exs ? 'Em ' + exs + '. ' : ''}Quer incluir 3 exercícios curtos para fortalecer o ${nome} nos próximos treinos? São opcionais e levam ~8 min.</small><div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="rhNo" data-r="${sg.r}">Agora não</button><button class="btn lime sm" data-a="rhYes" data-r="${sg.r}">Incluir</button></div></div>`;
  }
  function snooze(r) { st().snooze[r] = Date.now(); Store.save(); }
  function includeFromPain(r) { safety(r, () => { start(r, 'academia', 'bloco'); toast('Bloco de ' + REGIONS[r].nome.toLowerCase() + ' incluído nos próximos treinos'); refresh(); }); }

  // ---------- telas ----------
  const topbar = (t) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${t}</h1></div>`;
  function painCount(r) { const since = DAY14(); return (S().pain || []).filter((p) => p.date >= since && SPOT[p.where] === r).length; }

  // Sinais de alerta + regra da dor; na primeira vez de cada região. ok() segue.
  function safety(r, ok) {
    if (st().warned[r]) { ok(); return; }
    const fl = ['Dor forte, que piora à noite ou em repouso', 'Inchaço, calor ou vermelhidão na região', 'Formigamento, dormência ou perda de força', 'Depois de queda, pancada ou cirurgia recente', 'Febre ou perda de peso sem explicação', '<b>Urgente:</b> perda de controle da urina ou das fezes, ou dormência na virilha'];
    sheet({
      render: () => `<h3>Antes de começar</h3><div class="desc">Se tiver algum destes sinais, procure um médico ou fisioterapeuta antes de treinar a região:</div>
        ${fl.map((t) => `<div class="rh-flag"><span>●</span><span>${t}</span></div>`).join('')}
        <div class="caps" style="margin:16px 2px 8px">Dor durante os exercícios</div>${semaforo()}
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="tenho">Tenho algum</button><button class="btn lime" data-a="ok">Não tenho, continuar</button></div>`,
      actions: {
        tenho: () => { closeSheet(); setTimeout(() => UI.confirmSheet('Procure um profissional', 'Com esses sinais, o melhor é ser avaliado por um médico ou fisioterapeuta antes de treinar a região. Você pode voltar aqui depois da avaliação.', 'Entendi', () => {}), 380); },
        ok: () => { st().warned[r] = true; Store.save(); closeSheet(); setTimeout(ok, 380); },
      },
    });
  }
  const semaforo = () => `<div class="rh-sem"><div><i class="g">0–2</i>Tranquilo, pode seguir.</div><div><i class="y">3–5</i>Aceitável, se na manhã seguinte voltar ao normal.</div><div><i class="r">6–10</i>Pare o exercício e diminua a carga no próximo.</div></div>`;

  // Escolha da região.
  function RegionPicker(pre) {
    const o = { r: pre || null, place: 'academia', pain: 'leve' };
    return {
      hideNav: true,
      render: () => topbar('Fortalecer região') + `<div class="content">
        <div class="rh-intro">Exercícios para deixar uma região mais forte e resistente, baseados em diretrizes de fisioterapia. <b>Não substitui avaliação profissional.</b></div>
        ${active().length ? `<div class="caps" style="margin:4px 2px 8px">Em andamento</div><div class="list">${active().map((r) => `<button class="pl-row press" data-a="open" data-r="${r}"><span class="grow"><b>Fortalecer ${esc(REGIONS[r].nome.toLowerCase())}</b><small>Semana ${weekOf(r)} de ${WEEKS} · Fase ${phaseOf(r) + 1} · ${info(r).mode === 'plano' ? 'plano separado' : 'bloco no treino'}</small></span>${icon('next', 'sm')}</button>`).join('')}</div>` : ''}
        <div class="caps" style="margin:14px 2px 8px">Qual região?</div>
        <div class="rh-reg">${ORDER.map((r) => { const n = painCount(r); return `<button class="press ${o.r === r ? 'on' : ''}" data-a="reg" data-r="${r}">${esc(REGIONS[r].nome)}<small>${esc(REGIONS[r].sub)}</small>${n ? `<span class="dot">DOR ${n}×</span>` : ''}</button>`; }).join('')}</div>
        <div class="caps" style="margin:16px 2px 8px">Onde vai fazer?</div>
        <div class="seg">${[['academia', 'Academia'], ['casa', 'Em casa']].map(([k, l]) => `<button class="${o.place === k ? 'on' : ''}" data-a="place" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="caps" style="margin:16px 2px 8px">Como está a região?</div>
        <div class="seg">${[['sem', 'Sem dor'], ['leve', 'Dor leve'], ['forte', 'Dor forte']].map(([k, l]) => `<button class="${o.pain === k ? 'on' : ''}" data-a="pain" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="tiny muted" style="margin:8px 2px 0">Com dor forte, o app pede para procurar um profissional antes.</div>
        <button class="btn lime block" style="margin-top:16px" data-a="go">Continuar</button></div>`,
      actions: {
        back: pop,
        reg: (ds) => { o.r = ds.r; refresh(); },
        place: (ds) => { o.place = ds.v; refresh(); },
        pain: (ds) => { o.pain = ds.v; refresh(); },
        open: (ds) => push(RegionPlan(ds.r)),
        go: () => {
          if (!o.r) { toast('Escolha a região'); return; }
          if (o.pain === 'forte') { UI.confirmSheet('Dor forte', 'Com dor forte, procure um médico ou fisioterapeuta antes de fortalecer a região. Depois da avaliação, volte aqui e escolha "Dor leve" ou "Sem dor".', 'Entendi', () => {}); return; }
          const r = o.r; safety(r, () => push(RegionPlan(r, o.place)));
        },
      },
    };
  }

  // Plano da região: fases, exercícios, como usar, teste e gráfico da dor.
  function RegionPlan(r, placeArg) {
    const R0 = REGIONS[r]; let mode = 'bloco', phase = info(r) ? phaseOf(r) : 0;
    const place = () => (info(r) ? info(r).place : placeArg || 'academia');
    const row = ([exId, sets, reps, rest, note]) => { const ex = Store.exercise(exId); return `<div class="rh-row">${UI.thumb(ex)}<span class="grow"><b>${esc(ex.nome)}</b><small>${Tools.repsText({ sets, reps }, ex)}${note ? ' · ' + esc(note) : ''}</small></span></div>`; };
    const chart = () => { const sc = (info(r) && info(r).scores) || []; if (sc.length < 2) return ''; const L = sc.slice(-12);
      return `<div class="caps" style="margin:16px 2px 8px">Sua dor depois dos treinos</div><div class="rh-chart">${L.map((x) => `<div><i style="height:${Math.max(6, x.v * 10)}%" class="${x.v > 5 ? 'r' : x.v > 2 ? 'y' : 'g'}"></i><span>${x.v}</span></div>`).join('')}</div>`; };
    return {
      hideNav: true,
      render: () => {
        const a = info(r);
        return topbar('Fortalecer ' + esc(R0.nome.toLowerCase())) + `<div class="content">
        <div class="rh-intro"><b>${WEEKS} semanas · 3× por semana · ~20 min.</b> ${a ? `Você está na <b>semana ${weekOf(r)}</b>${a.hold ? ' (fase mantida por causa da dor)' : ''}.` : 'A carga sobe aos poucos, em 3 fases.'}</div>
        <div class="rh-ph">${PHASES.map(([n, w, d], i) => `<button class="press ${phase === i ? 'on' : ''}" data-a="ph" data-v="${i}"><b>${i + 1} · ${n}</b><small>${w}<br>${d}</small></button>`).join('')}</div>
        <div class="caps" style="margin:14px 2px 6px">Fase ${phase + 1} · exercícios ${place() === 'casa' ? '(em casa)' : '(academia)'}</div>
        ${list(r, phase, place()).map(row).join('')}
        ${chart()}
        ${a ? '' : `<div class="caps" style="margin:16px 2px 8px">Como usar</div>
        <div class="rh-opt"><button class="press ${mode === 'bloco' ? 'on' : ''}" data-a="mode" data-v="bloco"><b>Bloco no meu treino</b><small>3 exercícios curtos no começo dos seus treinos (também servem de aquecimento), como opcionais.</small><em>Recomendado</em></button>
        <button class="press ${mode === 'plano' ? 'on' : ''}" data-a="mode" data-v="plano"><b>Plano separado</b><small>Vira o plano ativo, para quem quer focar só nisso.</small></button></div>`}
        ${R0.test ? `<button class="pl-mini press" style="margin-top:14px" data-a="test">${icon('target', 'sm')}<span class="grow"><b>Teste da região</b> · ${esc(Goals.test(R0.test).nome)} (repita a cada 4 semanas)</span>${icon('next', 'sm')}</button>` : ''}
        <div class="caps" style="margin:16px 2px 8px">Dor durante os exercícios</div>${semaforo()}
        <div class="rh-src">Base: ${esc(R0.fonte)} Não substitui avaliação de um profissional.</div>
        ${a ? `<button class="btn ghost block" style="margin-top:14px" data-a="stop">Encerrar fortalecimento</button>` : `<button class="btn lime block" style="margin-top:14px" data-a="use">Usar este plano</button>`}</div>`;
      },
      actions: {
        back: pop,
        ph: (ds) => { phase = Number(ds.v); refresh(); },
        mode: (ds) => { mode = ds.v; refresh(); },
        test: () => Screens.testSheet(R0.test, () => refresh()),
        stop: () => UI.confirmSheet('Encerrar?', 'Os exercícios de fortalecimento saem dos seus treinos. As notas de dor continuam guardadas.', 'Encerrar', () => { stop(r); toast('Fortalecimento encerrado'); pop(); }, true),
        use: () => {
          if (mode === 'bloco' && !Store.activePlan()) { toast('Escolha um plano primeiro, ou use como plano separado'); return; }
          start(r, place(), mode); toast(mode === 'plano' ? 'Plano criado e ativado' : 'Bloco incluído nos seus treinos'); pop(); refresh();
        },
      },
    };
  }

  // Depois do treino: nota da dor da região do bloco feito hoje.
  function regionsDone(s) { return [...new Set(s.sets.filter((x) => x.done).map((x) => { const fw = Store.findWorkout(s.workoutId); const it = fw && fw.workout.items.find((i) => i.id === x.itemId); return it && it.blk; }).filter(Boolean))]; }

  // Esporte → oferecer o bloco de prevenção.
  function offerSport(sportId) {
    const r = SPORT[sportId]; if (!r || info(r)) return;
    setTimeout(() => UI.confirmSheet('Prevenção de ' + REGIONS[r].nome.toLowerCase() + '?', 'É a região que mais sofre nesse esporte. Quer incluir 3 exercícios curtos de fortalecimento no começo dos treinos? São opcionais e levam ~8 min.', 'Incluir', () => safety(r, () => { start(r, 'academia', 'bloco'); toast('Bloco de prevenção incluído'); refresh(); })), 500);
  }

  window.Rehab = { REGIONS, ORDER, SPOT, active, info, weekOf, phaseOf, sync, start, stop, score, painSuggestion, homeCard, snooze, includeFromPain, RegionPicker, RegionPlan, regionsDone, offerSport, safety };
})();
