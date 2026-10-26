// Objetivos de treino: monta um plano a partir do objetivo, dias por semana, nível e equipamento.
// As regras (séries, repetições, descanso, ordem) seguem as meta-análises resumidas no documento do projeto.
(function () {
  'use strict';

  // ---------- objetivos ----------
  const GOALS = [
    { id: 'hipertrofia', nome: 'Hipertrofia', curto: 'Ganhar massa muscular', evid: 'Forte', weeks: 6, tests: ['pushups'], corpo: true,
      ciencia: 'Mais séries semanais geram mais músculo até 10+ por músculo; treinar cada músculo 2× por semana supera 1×; repetições de 6 a 30 perto da falha funcionam (Schoenfeld et al.).',
      regra: '10–20 séries por músculo na semana · 6–15 reps · sobrar 1–2 reps (RIR) · 60–120 s de descanso' },
    { id: 'forca', nome: 'Força máxima', curto: 'Levantar mais peso', evid: 'Forte', weeks: 6, tests: [], e1rm: true,
      ciencia: 'Os maiores ganhos de força aparecem com cargas perto de 80% (treinados) a 85% (atletas) do máximo, cerca de 2× por semana por músculo (Peterson et al.).',
      regra: '3–6 reps a 80–90% do máximo · 4–8 séries por levantamento · 2–5 min de descanso' },
    { id: 'potencia', nome: 'Potência e salto', curto: 'Mais explosão', evid: 'Forte', weeks: 6, tests: ['cmj', 'broad'],
      ciencia: 'Pliometria aumenta o salto vertical de 4,7% a 8,7% (26 estudos, Markovic 2007). Combinar carga pesada com saltos (treino complexo) potencializa salto e sprint.',
      regra: 'Saltos e levantamentos rápidos no início, descansado · poucas reps, máxima velocidade · descanso completo' },
    { id: 'velocidade', nome: 'Velocidade e aceleração', curto: 'Sprint e arrancada', evid: 'Moderada', weeks: 6, tests: ['sp10', 'sp30', 'broad'],
      ciencia: 'Sprint com resistência (trenó, colete) melhora o sprint, principalmente nos primeiros 10 m (meta-análise de 16 estudos, 2025). Hip thrust favoreceu o sprint de 10–20 m.',
      regra: 'Tiros curtos de 10–30 m em velocidade máxima · trenó · força de quadril e pernas · nórdico' },
    { id: 'corrida', nome: 'Corrida de resistência', curto: '5 km a maratona', evid: 'Forte', weeks: 8, tests: ['run5k', 'cooper'], runner: true,
      ciencia: 'Força pesada (≥80% do máximo) e pliometria melhoram a economia de corrida; 2–3 sessões por semana por 8–12 semanas (meta-análise 2024).',
      regra: '2–3 sessões curtas de força pesada · poucas reps, sem chegar à falha · saltos curtos · corrida nos outros dias' },
    { id: 'soco', nome: 'Força do soco', curto: 'Esportes de combate', evid: 'Promissora', weeks: 6, tests: ['mbthrow', 'cmj'],
      ciencia: 'Em boxeadores de elite, o impacto do soco acompanha a potência e a força de pernas (r = 0,67–0,85; Loturco et al.). A força de braço teve relação fraca (Iredale e Blazevich). Estudos pequenos, de correlação.',
      regra: 'Potência de pernas e quadril · landmine jammer e arremessos explosivos · core rotacional' },
    { id: 'prevencao', nome: 'Prevenção de lesões', curto: 'Futebol, corrida, esportes', evid: 'Forte', weeks: 8, tests: ['plank'],
      ciencia: 'Programas com o exercício nórdico reduziram lesões de posterior de coxa em cerca de 51% (4.455 atletas). FIFA 11+ e o exercício de Copenhagen reduzem lesões de virilha.',
      regra: 'Nórdico 2–3× por semana · adutor (Copenhagen) · prancha lateral · trabalho unilateral' },
    { id: 'emagrecimento', nome: 'Emagrecimento', curto: 'Perder gordura', evid: 'Forte', weeks: 8, tests: [], corpo: true,
      ciencia: 'Musculação + aeróbico reduz mais gordura que cada um sozinho e preserva massa magra; o maior efeito é com déficit calórico (meta-análises com milhares de participantes).',
      regra: 'Corpo inteiro com bi-sets (menos tempo) · 10–15 reps · 60 s de descanso · cardio no fim' },
    { id: 'saude', nome: 'Saúde e longevidade', curto: 'Iniciante ou 50+', evid: 'Forte', weeks: 8, tests: ['sitstand', 'plank', 'pushups'],
      ciencia: 'A OMS recomenda fortalecimento muscular 2× por semana. Musculação aparece ligada a cerca de 15% menos mortalidade (estudos observacionais).',
      regra: 'Corpo inteiro 2–3× por semana · exercícios básicos · sobrar 2–3 reps · equilíbrio e carregamento' },
    { id: 'resistencia', nome: 'Resistência muscular', curto: 'TAF e testes físicos', evid: 'Moderada', weeks: 8, tests: ['pushups', 'pullups', 'situps', 'cooper'],
      ciencia: 'A recomendação clássica do NSCA para resistência muscular é carga leve e descanso curto (≤30–60 s). A pesquisa de longo prazo é menos conclusiva.',
      regra: 'Circuitos · 15–25+ reps · 30–60 s de descanso · flexão, barra, abdominal e corrida' },
  ];
  const goal = (id) => GOALS.find((g) => g.id === id);
  const LEVELS = [['iniciante', 'Iniciante'], ['intermediario', 'Intermediário'], ['avancado', 'Avançado']];
  const EQUIPS = [['academia', 'Academia'], ['halteres', 'Halteres'], ['corpo', 'Peso do corpo']];

  // ---------- exercícios por padrão de movimento (ordem = preferência) ----------
  const POOLS = {
    squat: ['ex30', 'ex81', 'ex32', 'ex33', 'ex86', 'ex82'],
    squatEasy: ['ex33', 'ex31', 'ex86', 'ex82'],
    hinge: ['ex24', 'ex37', 'ex71', 'ex83'],
    hipthrust: ['ex39', 'ex40', 'ex83'],
    lunge: ['ex86', 'ex38', 'ex87', 'ex89'],
    pushH: ['ex01', 'ex02', 'ex08'],
    pushV: ['ex44', 'ex43', 'ex08'],
    pullV: ['ex17', 'ex22', 'ex85', 'ex84'],
    pullH: ['ex19', 'ex20', 'ex18', 'ex84'],
    biceps: ['ex25', 'ex26', 'ex27', 'ex85'],
    triceps: ['ex11', 'ex12', 'ex13', 'ex15'],
    delts: ['ex46', 'ex48', 'ex49'],
    quadIso: ['ex34', 'ex82'],
    hamIso: ['ex35', 'ex36', 'ex76'],
    calves: ['ex42', 'ex41'],
    core: ['ex55', 'ex54', 'ex52', 'ex88'],
    coreRot: ['ex75', 'ex69', 'ex53', 'tx01'],
    plyoV: ['ex56', 'ex58', 'ex61'],
    plyoH: ['ex62', 'ex60'],
    olympic: ['ex63', 'ex64', 'ex71', 'ex59', 'ex58'],
    pushPower: ['ex65', 'ex79', 'ex66'],
    throwMB: ['ex66', 'ex67', 'ex70', 'ex68'],
    rotMB: ['ex69', 'ex75', 'ex68'],
    punch: ['ex74', 'ex66', 'ex79'],
    sprint: ['ex80'],
    sled: ['ex73', 'ex72', 'ex80'],
    nordic: ['ex76', 'ex35'],
    adductor: ['tx08', 'ex77'],
    sidePlank: ['tx01'],
    carry: ['ex78'],
    cardio: ['tx03', 'tx04', 'tx05', 'tx06'],
    pushup: ['ex08'],
    pullup: ['ex22', 'ex84'],
    situp: ['ex52', 'ex88'],
    jumpBW: ['ex58'],
    lungeBW: ['ex89', 'ex38'],
  };
  // Bloco de cada padrão: define a ordem dentro do treino (potência primeiro, cardio por último).
  const BLOCK = { plyoV: 0, plyoH: 0, olympic: 0, sprint: 0, sled: 0, punch: 0, throwMB: 0, pushPower: 0, jumpBW: 1,
    squat: 1, squatEasy: 1, hinge: 1, pushH: 1, pushV: 1, pullV: 1, pullH: 1, lunge: 1, hipthrust: 1, pushup: 1, pullup: 1, lungeBW: 1,
    biceps: 2, triceps: 2, delts: 2, quadIso: 2, hamIso: 2, calves: 2, rotMB: 2,
    nordic: 3, adductor: 3, sidePlank: 3, core: 3, coreRot: 3, carry: 3, situp: 3, cardio: 4 };
  const EQUIP_OK = {
    academia: null,
    halteres: ['Halteres', 'Peso corporal', 'Caixa', 'Kettlebell', 'Medicine ball', 'Banco', 'Corda'],
    corpo: ['Peso corporal', 'Banco', 'Caixa', 'Corda'],
  };
  const HARD = ['ex57', 'ex63', 'ex64', 'ex65', 'ex24'];

  // s = séries, r = reps, rest = descanso, n = observação, t = segundos (exercício por tempo),
  // v = variante (outro exercício do mesmo padrão), g = grupo (bi-set)
  const S = (p, s, r, rest, n, t, v, g) => ({ p, s, r, rest, n, t, v, g });

  // ---------- modelos de sessão por objetivo ----------
  function templates(gid, days) {
    const full = days <= 3;
    switch (gid) {
      case 'hipertrofia':
        if (full) return [
          { nome: 'Corpo inteiro A', slots: [S('squat', 3, '8-10', 120), S('pushH', 3, '8-12', 120), S('pullV', 3, '8-12', 90), S('hamIso', 3, '10-12', 75), S('delts', 3, '12-15', 60), S('triceps', 2, '10-15', 60)] },
          { nome: 'Corpo inteiro B', slots: [S('hinge', 3, '8-10', 120), S('pullH', 3, '8-12', 90), S('pushV', 3, '8-12', 90), S('lunge', 3, '10', 90), S('biceps', 3, '10-15', 60), S('calves', 3, '12-15', 45)] },
          { nome: 'Corpo inteiro C', slots: [S('squat', 3, '10-12', 120, '', 0, 1), S('pushH', 3, '10-12', 90, '', 0, 1), S('pullH', 3, '10-12', 90, '', 0, 1), S('hipthrust', 3, '10', 90), S('delts', 3, '15', 60, '', 0, 1), S('core', 3, '', 45, '', 30)] },
        ];
        if (days === 4) return upperLower('hip');
        if (days === 5) return upperLower('hip').concat([{ nome: 'Braços e ombros', slots: [S('pushV', 3, '10', 90, '', 0, 1), S('delts', 4, '12-15', 60), S('biceps', 3, '10-12', 60), S('triceps', 3, '10-12', 60), S('biceps', 2, '12-15', 60, '', 0, 1), S('triceps', 2, '12-15', 60, '', 0, 1)] }]);
        return ppl();
      case 'forca':
        if (full) return [
          { nome: 'Força A', slots: [S('squat', 5, '3-5', 180, '~85% do máximo, técnica perfeita'), S('pushH', 5, '3-5', 180, '~85% do máximo'), S('pullH', 4, '6', 120), S('core', 3, '', 60, '', 30)] },
          { nome: 'Força B', slots: [S('hinge', 4, '3-5', 210, '~85% do máximo'), S('pushV', 4, '4-6', 150), S('pullV', 4, '6', 120), S('lunge', 3, '6', 90)] },
          { nome: 'Força C', slots: [S('squat', 4, '4-6', 180, '', 0, 1), S('pushH', 4, '5', 150, '', 0, 1), S('pullH', 4, '6', 120, '', 0, 1), S('hamIso', 3, '8', 90)] },
        ];
        return upperLower('forca');
      case 'potencia':
        return [
          { nome: 'Potência A', slots: [S('plyoV', 4, '5', 120, 'Máxima altura; descanse até estar 100%'), S('olympic', 4, '3', 150, 'Explosivo; pare se a velocidade cair'), S('squat', 4, '4', 180, '~80% do máximo, subida rápida'), S('pushPower', 3, '5', 120), S('pullV', 3, '6', 90), S('core', 3, '', 45, '', 30)] },
          { nome: 'Potência B', slots: [S('plyoH', 4, '5', 120, 'Cada perna'), S('throwMB', 4, '5', 90, 'Máxima força em cada arremesso'), S('hinge', 4, '4', 180, 'Subida rápida'), S('pushH', 3, '5', 150), S('pullH', 3, '6', 90), S('coreRot', 3, '8', 60)] },
          { nome: 'Potência C', slots: [S('plyoV', 4, '4', 120, '', 0, 1), S('olympic', 4, '3', 150, '', 0, 1), S('hipthrust', 4, '5', 150), S('pushPower', 3, '5', 120, '', 0, 1), S('pullV', 3, '6', 90, '', 0, 1), S('nordic', 3, '5', 90)] },
        ];
      case 'velocidade':
        return [
          { nome: 'Aceleração', slots: [S('sprint', 6, '1', 150, 'Tiros de 10–20 m em velocidade máxima'), S('sled', 4, '1', 150, '15–20 m com carga leve (~10–20% do peso corporal)'), S('plyoH', 3, '6', 90), S('hipthrust', 4, '6', 150), S('squat', 3, '5', 180), S('nordic', 3, '5', 90)] },
          { nome: 'Velocidade máxima', slots: [S('sprint', 5, '1', 180, 'Tiros de 30 m (aceleração de 10 m antes)'), S('plyoV', 4, '5', 120), S('hinge', 4, '5', 180), S('lunge', 3, '6', 90), S('calves', 3, '10', 60), S('core', 3, '', 45, '', 30)] },
          { nome: 'Força e saltos', slots: [S('plyoH', 4, '5', 120, '', 0, 1), S('olympic', 4, '3', 150), S('squat', 4, '4', 180, '', 0, 1), S('hipthrust', 3, '6', 120), S('nordic', 3, '5', 90), S('adductor', 2, '', 60, '', 20)] },
        ];
      case 'corrida':
        return [
          { nome: 'Força para corrida A', slots: [S('squat', 4, '4', 180, 'Pesado (≥80% do máximo), sem chegar à falha'), S('hinge', 3, '5', 150), S('calves', 3, '10', 75, 'Carga pesada'), S('plyoH', 3, '10', 75, 'Saltos curtos e rápidos'), S('sidePlank', 2, '', 45, '', 30)] },
          { nome: 'Força para corrida B', slots: [S('lunge', 3, '6', 120, 'Pesado, cada perna'), S('hipthrust', 3, '6', 120), S('nordic', 3, '5', 90), S('plyoV', 3, '5', 90), S('core', 2, '', 45, '', 40)] },
          { nome: 'Força para corrida C', slots: [S('squat', 3, '5', 180, '', 0, 1), S('hinge', 3, '5', 150, '', 0, 1), S('calves', 3, '12', 60, '', 0, 1), S('plyoH', 3, '8', 75, '', 0, 1), S('adductor', 2, '', 45, '', 20)] },
        ];
      case 'soco':
        return [
          { nome: 'Potência de soco A', slots: [S('plyoV', 4, '5', 120, '', 0, 1), S('olympic', 4, '3', 150, 'Explosivo'), S('punch', 4, '5', 90, 'Cada lado; gire o quadril como no soco'), S('throwMB', 3, '6', 90), S('squat', 4, '5', 180), S('pullH', 3, '8', 90), S('coreRot', 3, '8', 60, 'Cada lado')] },
          { nome: 'Potência de soco B', slots: [S('olympic', 4, '3', 150, '', 0, 1), S('punch', 3, '6', 90, '', 0, 1), S('rotMB', 4, '6', 75, 'Cada lado, máxima velocidade'), S('hipthrust', 4, '6', 150), S('pushH', 3, '6', 120), S('pullV', 3, '8', 90)] },
          { nome: 'Potência de soco C', slots: [S('plyoH', 3, '5', 90), S('punch', 4, '5', 90), S('pushPower', 3, '5', 120, '', 0, 1), S('lunge', 3, '6', 120), S('carry', 3, '', 75, 'Pesado, ~30 m', 40), S('coreRot', 3, '8', 60, '', 0, 1)] },
        ];
      case 'prevencao':
        return [
          { nome: 'Prevenção A', slots: [S('nordic', 3, '5', 90, 'Desça o mais devagar possível; comece com 2–3 séries'), S('adductor', 3, '', 60, 'Cada lado', 20), S('lunge', 3, '8', 90), S('hipthrust', 3, '10', 90), S('pullH', 3, '10', 90), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
          { nome: 'Prevenção B', slots: [S('nordic', 3, '6', 90), S('squat', 3, '8', 120), S('calves', 3, '15', 60), S('pushH', 3, '10', 90), S('adductor', 3, '', 60, '', 25), S('core', 3, '', 45, '', 40)] },
          { nome: 'Prevenção C', slots: [S('hinge', 3, '8', 120), S('lunge', 3, '10', 90, '', 0, 1), S('pullV', 3, '10', 90), S('nordic', 2, '6', 90), S('sidePlank', 3, '', 45, '', 35), S('calves', 3, '15', 60, '', 0, 1)] },
        ];
      case 'emagrecimento':
        return [
          { nome: 'Circuito A', slots: [S('squat', 3, '12', 60, '', 0, 0, 'g1'), S('pushH', 3, '12', 60, '', 0, 0, 'g1'), S('hinge', 3, '12', 60, '', 0, 0, 'g2'), S('pullV', 3, '12', 60, '', 0, 0, 'g2'), S('core', 3, '', 30, '', 30), S('cardio', 1, '', 60, 'Ritmo moderado: dá para falar frases curtas', 1200)] },
          { nome: 'Circuito B', slots: [S('lunge', 3, '12', 60, '', 0, 0, 'g1'), S('pushV', 3, '12', 60, '', 0, 0, 'g1'), S('hipthrust', 3, '12', 60, '', 0, 0, 'g2'), S('pullH', 3, '12', 60, '', 0, 0, 'g2'), S('core', 3, '15', 30, '', 0, 2), S('cardio', 1, '', 60, '', 1200, 1)] },
          { nome: 'Circuito C', slots: [S('squat', 3, '15', 60, '', 0, 1, 'g1'), S('pushH', 3, '15', 60, '', 0, 1, 'g1'), S('hinge', 3, '15', 60, '', 0, 1, 'g2'), S('pullH', 3, '15', 60, '', 0, 1, 'g2'), S('carry', 3, '', 60, '', 40), S('cardio', 1, '', 60, 'Intervalado: 1 min forte, 1 min leve', 900, 2)] },
        ];
      case 'saude':
        return [
          { nome: 'Saúde A', slots: [S('squatEasy', 3, '10', 90, 'Sobrar 2–3 reps'), S('pushH', 3, '10', 90), S('pullH', 3, '10', 90), S('hipthrust', 2, '12', 90), S('sidePlank', 2, '', 45, 'Cada lado', 20), S('carry', 2, '', 60, '', 30)] },
          { nome: 'Saúde B', slots: [S('lunge', 2, '10', 90), S('pushV', 3, '10', 90), S('pullV', 3, '10', 90), S('hinge', 2, '10', 120, 'Leve, foco na técnica'), S('core', 2, '', 45, '', 30), S('calves', 2, '15', 60)] },
          { nome: 'Saúde C', slots: [S('squatEasy', 3, '12', 90, '', 0, 1), S('pushH', 3, '12', 90, '', 0, 1), S('pullH', 3, '12', 90, '', 0, 1), S('hipthrust', 2, '12', 90, '', 0, 1), S('carry', 2, '', 60, '', 30), S('cardio', 1, '', 60, 'Caminhada ou bike leve', 900)] },
        ];
      case 'resistencia':
        return [
          { nome: 'TAF A', slots: [S('pushup', 4, '20', 45, 'Ou o máximo com técnica', 0, 0, 'g1'), S('pullup', 4, '8', 45, 'Máximo possível', 0, 0, 'g1'), S('situp', 4, '25', 45, '', 0, 0, 'g1'), S('jumpBW', 3, '15', 45), S('core', 3, '', 30, '', 60)] },
          { nome: 'TAF B', slots: [S('sprint', 6, '1', 90, 'Tiros de 200 m em ritmo forte'), S('lungeBW', 3, '20', 45, '', 0, 0, 'g1'), S('pushup', 3, '25', 45, '', 0, 0, 'g1'), S('situp', 3, '30', 45, '', 0, 1, 'g1'), S('sidePlank', 2, '', 30, '', 45)] },
          { nome: 'TAF C', slots: [S('pullup', 5, '6', 60), S('pushup', 5, '15', 45), S('squat', 3, '15', 60, '', 0, 5), S('situp', 4, '20', 30), S('cardio', 1, '', 60, 'Corrida contínua', 1200)] },
        ];
      default: return [];
    }
  }
  // Superior/inferior (4+ dias) e push/pull/legs (6 dias).
  function upperLower(kind) {
    const f = kind === 'forca';
    const R = (a, b) => (f ? a : b);
    return [
      { nome: 'Superior A', slots: [S('pushH', R(5, 4), R('3-5', '6-10'), R(180, 120)), S('pullH', 4, R('5', '8-10'), R(150, 90)), S('pushV', 3, R('6', '8-12'), 90), S('pullV', 3, R('6', '8-12'), 90), S('delts', f ? 0 : 3, '12-15', 60), S('biceps', 2, '10-12', 60), S('triceps', 2, '10-12', 60)] },
      { nome: 'Inferior A', slots: [S('squat', R(5, 4), R('3-5', '6-10'), R(180, 120)), S('hinge', 3, R('3-5', '8-10'), R(210, 120)), S('quadIso', f ? 0 : 3, '12', 75), S('hamIso', 3, R('8', '10-12'), 75), S('calves', 3, '12', 60), S('core', 3, '', 45, '', 30)] },
      { nome: 'Superior B', slots: [S('pushV', R(5, 4), R('3-5', '6-10'), R(180, 120)), S('pullV', 4, R('5', '8-10'), R(150, 90)), S('pushH', 3, R('6', '10-12'), 90, '', 0, 1), S('pullH', 3, R('6', '10-12'), 90, '', 0, 1), S('delts', f ? 0 : 3, '15', 60, '', 0, 1), S('biceps', 2, '12', 60, '', 0, 1), S('triceps', 2, '12', 60, '', 0, 1)] },
      { nome: 'Inferior B', slots: [S('hinge', R(4, 3), R('3-5', '8'), R(210, 150), '', 0, 1), S('squat', 3, R('5', '10'), R(180, 120), '', 0, 1), S('lunge', 3, R('6', '10'), 90), S('hipthrust', 3, R('6', '10'), 90), S('calves', 3, '15', 60, '', 0, 1), S('coreRot', 3, '10', 45)] },
    ];
  }
  function ppl() {
    return [
      { nome: 'Push · empurrar', slots: [S('pushH', 4, '6-10', 120), S('pushV', 3, '8-10', 90), S('pushH', 3, '10-12', 90, '', 0, 1), S('delts', 4, '12-15', 60), S('triceps', 3, '10-12', 60)] },
      { nome: 'Pull · puxar', slots: [S('pullV', 4, '6-10', 120), S('pullH', 3, '8-10', 90), S('pullH', 3, '10-12', 90, '', 0, 1), S('delts', 3, '15', 60, '', 0, 2), S('biceps', 3, '10-12', 60)] },
      { nome: 'Legs · pernas', slots: [S('squat', 4, '6-10', 150), S('hinge', 3, '8-10', 120, '', 0, 1), S('lunge', 3, '10', 90), S('quadIso', 3, '12', 75), S('hamIso', 3, '12', 75), S('calves', 4, '12-15', 45)] },
      { nome: 'Push · empurrar 2', slots: [S('pushV', 4, '6-10', 120), S('pushH', 3, '8-10', 90, '', 0, 1), S('delts', 4, '15', 60, '', 0, 1), S('triceps', 3, '12', 60, '', 0, 1), S('triceps', 2, '15', 60, '', 0, 2)] },
      { nome: 'Pull · puxar 2', slots: [S('pullH', 4, '6-10', 120), S('pullV', 3, '10', 90, '', 0, 1), S('delts', 3, '15', 60, '', 0, 2), S('biceps', 3, '12', 60, '', 0, 1), S('biceps', 2, '15', 60, '', 0, 2)] },
      { nome: 'Legs · pernas 2', slots: [S('hinge', 4, '6-10', 150), S('squat', 3, '10', 120, '', 0, 1), S('hipthrust', 3, '10', 90), S('hamIso', 3, '12', 75, '', 0, 1), S('calves', 4, '15', 45, '', 0, 1), S('core', 3, '', 45, '', 40)] },
    ];
  }

  // ---------- objetivo secundário: o que acrescenta em cada treino ----------
  function addOns(gid, i) {
    switch (gid) {
      case 'hipertrofia': return { post: [S('delts', 3, '12-15', 60, '', 0, i), S(i % 2 ? 'biceps' : 'triceps', 2, '10-15', 60)] };
      case 'forca': return { heavy: true };
      case 'potencia': return { pre: [S('plyoV', 3, '5', 120, 'Máxima altura', 0, i)] };
      case 'velocidade': return i % 2 === 0 ? { pre: [S('sprint', 5, '1', 150, 'Tiros de 10–20 m em velocidade máxima')] } : {};
      case 'corrida': return i < 2 ? { post: [S('calves', 3, '10', 60, 'Carga pesada'), S('plyoH', 2, '10', 60, 'Saltos curtos e rápidos')] } : {};
      case 'soco': return { pre: [S(i % 2 ? 'throwMB' : 'punch', 3, '5', 90, 'Explosivo')] };
      case 'prevencao': return i < 2 ? { post: [S('nordic', 3, '5', 90, 'Desça o mais devagar possível'), S('adductor', 2, '', 60, 'Cada lado', 20)] } : {};
      case 'emagrecimento': return { post: [S('cardio', 1, '', 60, 'Ritmo moderado', 900, i)] };
      case 'saude': return { post: [S('sidePlank', 2, '', 45, 'Cada lado', 25)] };
      case 'resistencia': return { post: [S('pushup', 2, '20', 45, 'Finalizador: máximo de reps'), S('situp', 2, '25', 30)] };
      default: return {};
    }
  }

  const DAYS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };

  // Escolhe o exercício de um padrão, respeitando equipamento, nível e o que já está na sessão.
  function pick(pattern, variant, ctx, used) {
    const ok = EQUIP_OK[ctx.equip];
    const list = (POOLS[pattern] || []).filter((id) => {
      const e = Store.exercise(id);
      if (!e || e.nome === 'Exercício removido') return false;
      if (ok && !ok.includes(e.equip || '')) return false;
      if (ctx.level === 'iniciante' && HARD.includes(id)) return false;
      return true;
    });
    if (!list.length) return null;
    for (let k = 0; k < list.length; k++) {
      const id = list[(variant + k) % list.length];
      if (!used.has(id)) return id;
    }
    return null;
  }

  // Monta o plano. opts = { primary, secondary, days, level, equip }
  function buildPlan(opts) {
    const g = goal(opts.primary), g2 = opts.secondary && opts.secondary !== opts.primary ? goal(opts.secondary) : null;
    const days = Math.max(2, Math.min(6, Number(opts.days) || 3));
    let base = templates(g.id, days);
    // Corrida: no máximo 3 sessões de força; os outros dias viram corrida.
    let strengthDays = g.runner ? Math.min(days, 3) : days;
    if (g.runner && days <= 3) strengthDays = Math.min(days, 2);
    const sessions = [];
    for (let i = 0; i < strengthDays; i++) {
      const t = base[i % base.length];
      sessions.push({ nome: t.nome + (i >= base.length ? ' · variação' : ''), slots: t.slots.map((x) => Object.assign({}, x, { v: (x.v || 0) + Math.floor(i / base.length) })) });
    }
    if (g.runner) for (let i = strengthDays; i < days; i++) sessions.push({ nome: 'Corrida', run: true, slots: [S('cardio', 1, '', 60, i % 2 ? 'Rodagem leve (conversando)' : 'Treino de qualidade do seu plano de corrida', 2400)] });

    const ctx = { equip: opts.equip || 'academia', level: opts.level || 'intermediario' };
    const plan = { id: Store.uid('p'), name: g.nome + (g2 ? ' + ' + g2.nome : ''), goal: days + ' dias · ' + (LEVELS.find((l) => l[0] === ctx.level) || [])[1] + ' · ' + (EQUIPS.find((e) => e[0] === ctx.equip) || [])[1],
      weeks: Math.max(g.weeks, g2 ? g2.weeks : 0), startDate: Store.iso(Store.weekStartOf(Store.today(), Store.state.settings.weekStart)),
      objetivo: { primary: g.id, secondary: g2 ? g2.id : null, days, level: ctx.level, equip: ctx.equip }, workouts: [] };
    const DAY = DAYS[days];
    sessions.forEach((sess, i) => {
      let slots = sess.slots.slice();
      if (g2 && !sess.run) {
        const add = addOns(g2.id, i);
        if (add.pre) slots = add.pre.concat(slots);
        if (add.post) slots = slots.concat(add.post);
        if (add.heavy) { const k = slots.findIndex((x) => BLOCK[x.p] === 1); if (k >= 0) slots[k] = Object.assign({}, slots[k], { s: Math.max(slots[k].s, 5), r: '3-5', rest: 180, n: '~85% do máximo (força)' }); }
      }
      // Ordem: potência → força → acessórios → prevenção/core → cardio (estável dentro do bloco).
      slots = slots.map((x, k) => ({ x, k })).sort((a, b) => (BLOCK[a.x.p] - BLOCK[b.x.p]) || (a.k - b.k)).map((o) => o.x).filter((x) => x.s > 0);
      if (slots.length > 8) slots = slots.filter((x, k) => k < 8 || BLOCK[x.p] === 4);
      const used = new Set(), gids = {};
      const items = [];
      slots.forEach((x) => {
        const id = pick(x.p, x.v || 0, ctx, used);
        if (!id) return;
        used.add(id);
        const ex = Store.exercise(id);
        let sets = x.s;
        if (ctx.level === 'iniciante' && BLOCK[x.p] <= 2 && x.p !== 'cardio') sets = Math.max(2, sets - 1);
        if (ctx.level === 'avancado' && BLOCK[x.p] === 1) sets += 1;
        const reps = ex.tipo === 'tempo' ? String(x.t || 30) : (x.r || '10');
        const it = { id: Store.uid('i'), exId: id, sets, reps, kg: 0, rest: x.rest || 90, note: x.n || '', tech: null, group: null };
        if (x.g) it.group = { id: gids[x.g] || (gids[x.g] = Store.uid('g')), type: 'biset' };
        items.push(it);
      });
      // Grupos com 3+ exercícios viram tri-set / série gigante; grupos de 1 são desfeitos.
      Object.values(gids).forEach((gid) => {
        const mem = items.filter((it) => it.group && it.group.id === gid);
        const type = mem.length >= 4 ? 'gigante' : mem.length === 3 ? 'triset' : 'biset';
        mem.forEach((it) => { if (mem.length < 2) it.group = null; else it.group.type = type; });
      });
      plan.workouts.push({ id: Store.uid('w'), letter: String.fromCharCode(65 + i), name: sess.nome, days: [DAY[i % DAY.length]], items });
    });
    return plan;
  }

  // ---------- testes de desempenho ----------
  const TESTS = [
    { id: 'cmj', nome: 'Salto vertical', un: 'cm', up: true, how: 'Em pé ao lado de uma parede, marque o ponto mais alto que alcança com a mão. Salte e marque de novo. A diferença é a altura do salto. Faça 3 e anote o melhor.' },
    { id: 'broad', nome: 'Salto horizontal', un: 'cm', up: true, how: 'Parado, com os dois pés, salte o mais longe possível. Meça da linha até o calcanhar mais próximo. Melhor de 3.' },
    { id: 'sp10', nome: 'Sprint 10 m', un: 's', up: false, dec: 2, how: 'Saída parada. Peça para alguém cronometrar ou filme e conte pelo vídeo. Melhor de 3, com 3 min de pausa.' },
    { id: 'sp30', nome: 'Sprint 30 m', un: 's', up: false, dec: 2, how: 'Saída parada, 30 m em velocidade máxima. Melhor de 2–3 tentativas.' },
    { id: 'run5k', nome: 'Corrida de 5 km', un: 'tempo', up: false, how: 'Tempo total para 5 km no seu melhor ritmo. Use relógio ou app de corrida.' },
    { id: 'cooper', nome: 'Teste de Cooper (12 min)', un: 'm', up: true, how: 'Distância máxima percorrida em 12 minutos de corrida. Muito usado em TAF.' },
    { id: 'mbthrow', nome: 'Arremesso de medicine ball', un: 'm', up: true, dec: 1, how: 'Passe de peito com bola de 3–4 kg, em pé, o mais longe possível. Meça a distância. Melhor de 3.' },
    { id: 'pushups', nome: 'Flexões máximas', un: 'reps', up: true, how: 'Máximo de flexões seguidas com técnica completa (peito perto do chão, corpo reto).' },
    { id: 'pullups', nome: 'Barras máximas', un: 'reps', up: true, how: 'Máximo de barras seguidas, queixo acima da barra, descendo até estender.' },
    { id: 'situps', nome: 'Abdominais em 1 minuto', un: 'reps', up: true, how: 'Máximo de abdominais em 60 segundos.' },
    { id: 'plank', nome: 'Prancha máxima', un: 'tempo', up: true, how: 'Tempo máximo em prancha com o corpo reto.' },
    { id: 'sitstand', nome: 'Sentar e levantar em 30 s', un: 'reps', up: true, how: 'Cadeira de ~43 cm, braços cruzados no peito. Conte quantas vezes senta e levanta em 30 s. Teste usado para avaliar força funcional.' },
  ];
  const test = (id) => TESTS.find((t) => t.id === id);
  // "25:30" → 1530; "42" → 42
  function parseVal(t, raw) {
    raw = String(raw || '').trim().replace(',', '.');
    if (!raw) return NaN;
    if (t.un === 'tempo' && raw.includes(':')) { const p = raw.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; }
    return parseFloat(raw);
  }
  function fmtVal(t, v) {
    if (v == null || isNaN(v)) return '–';
    if (t.un === 'tempo') { const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), s = Math.round(v % 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); }
    return UI.nf(v, t.dec != null ? t.dec : 1) + ' ' + t.un;
  }
  function results(id) { return (Store.state.tests || []).filter((r) => r.test === id).sort((a, b) => (a.date < b.date ? -1 : 1)); }
  function addResult(id, v) {
    const st = Store.state; st.tests = st.tests || [];
    st.tests.push({ id: Store.uid('t'), test: id, date: Store.iso(Store.today()), v });
    Store.save(true);
  }
  // Testes sugeridos para o plano ativo (pelos objetivos).
  function suggestedTests() {
    const p = Store.activePlan(), o = p && p.objetivo;
    if (!o) return [];
    const ids = [];
    [o.primary, o.secondary].filter(Boolean).forEach((gid) => goal(gid).tests.forEach((t) => { if (!ids.includes(t)) ids.push(t); }));
    return ids;
  }

  window.Goals = { GOALS, goal, LEVELS, EQUIPS, buildPlan, TESTS, test, parseVal, fmtVal, results, addResult, suggestedTests, POOLS };
})();
