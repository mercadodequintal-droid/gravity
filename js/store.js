// Dados do app: tudo fica salvo no próprio celular (localStorage do WebView).
(function () {
  'use strict';

  const KEY = 'meutreino.v1';
  const DAY = 86400000;
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WEEKDAYS_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const GROUPS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Posterior', 'Glúteos', 'Panturrilha', 'Trapézio', 'Abdômen', 'Cardio', 'Outro'];

  const uid = (p) => (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- datas ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  function weekStartOf(d, ws) {
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    const diff = (x.getDay() - ws + 7) % 7;
    return addDays(x, -diff);
  }

  // ---------- planos-modelo ----------
  // Cada item: [id do exercício na biblioteca, séries, repetições, carga sugerida, descanso em s]
  const TEMPLATES = [
    {
      key: 'abcde', name: 'ABCDE Hipertrofia', goal: 'Hipertrofia · 5 dias', weeks: 4,
      workouts: [
        ['A', 'Peito e Tríceps', [1], [['ex01', 4, '10', 40, 90], ['ex02', 3, '10', 18, 90], ['ex04', 3, '12', 14, 60], ['ex11', 3, '12', 25, 60], ['ex13', 3, '10', 20, 60]]],
        ['B', 'Costas e Bíceps', [2], [['ex17', 4, '10', 45, 90], ['ex18', 3, '10', 40, 90], ['ex20', 3, '10', 20, 60], ['ex25', 3, '10', 20, 60], ['ex27', 3, '12', 10, 60]]],
        ['C', 'Pernas', [3], [['ex30', 4, '8', 50, 120], ['ex31', 4, '12', 120, 90], ['ex34', 3, '12', 40, 60], ['ex38', 3, '10', 12, 60], ['ex42', 4, '15', 40, 45]]],
        ['D', 'Ombros e Abdômen', [4], [['ex43', 4, '10', 14, 90], ['ex46', 4, '12', 8, 60], ['ex48', 3, '12', 6, 60], ['ex49', 3, '15', 20, 60], ['ex53', 3, '15', 25, 45]]],
        ['E', 'Posterior e Glúteos', [5], [['ex37', 4, '10', 40, 90], ['ex35', 4, '12', 35, 60], ['ex39', 4, '10', 60, 90], ['ex36', 3, '12', 30, 60], ['ex41', 4, '15', 30, 45]]],
      ],
    },
    {
      key: 'abc', name: 'ABC Clássico', goal: 'Hipertrofia · 3 dias', weeks: 4,
      workouts: [
        ['A', 'Peito, Ombros e Tríceps', [1], [['ex01', 4, '10', 40, 90], ['ex02', 3, '10', 18, 90], ['ex43', 3, '10', 14, 90], ['ex46', 3, '12', 8, 60], ['ex11', 3, '12', 25, 60]]],
        ['B', 'Costas e Bíceps', [3], [['ex17', 4, '10', 45, 90], ['ex19', 3, '10', 40, 90], ['ex20', 3, '10', 20, 60], ['ex25', 3, '10', 20, 60], ['ex27', 3, '12', 10, 60]]],
        ['C', 'Pernas completo', [5], [['ex30', 4, '8', 50, 120], ['ex31', 3, '12', 120, 90], ['ex34', 3, '12', 40, 60], ['ex35', 3, '12', 35, 60], ['ex41', 4, '15', 30, 45]]],
      ],
    },
    {
      key: 'abcd', name: 'ABCD Intermediário', goal: 'Hipertrofia · 4 dias', weeks: 4,
      workouts: [
        ['A', 'Peito e Tríceps', [1], [['ex01', 4, '8-10', 40, 90], ['ex02', 3, '10', 18, 90], ['ex06', 3, '12', 15, 60], ['ex11', 3, '12', 25, 60], ['ex12', 3, '10', 20, 60]]],
        ['B', 'Costas e Bíceps', [2], [['ex17', 4, '10', 45, 90], ['ex19', 4, '8-10', 40, 90], ['ex18', 3, '12', 40, 60], ['ex25', 3, '10', 20, 60], ['ex28', 3, '12', 15, 60]]],
        ['C', 'Pernas', [4], [['ex30', 4, '8', 50, 120], ['ex31', 4, '12', 120, 90], ['ex34', 3, '12', 40, 60], ['ex35', 3, '12', 35, 60], ['ex42', 4, '15', 40, 45]]],
        ['D', 'Ombros e Abdômen', [5], [['ex44', 4, '8-10', 30, 90], ['ex46', 4, '12', 8, 60], ['ex48', 3, '12', 6, 60], ['ex51', 3, '12', 16, 60], ['ex54', 3, '12', 0, 45]]],
      ],
    },
    {
      key: 'full', name: 'Full Body Iniciante', goal: 'Condicionamento · 3 dias', weeks: 6,
      workouts: [
        ['A', 'Corpo inteiro A', [1], [['ex30', 3, '10', 30, 90], ['ex01', 3, '10', 30, 90], ['ex17', 3, '12', 35, 60], ['ex43', 3, '12', 10, 60], ['ex55', 3, '30s', 0, 45]]],
        ['B', 'Corpo inteiro B', [3], [['ex31', 3, '12', 80, 90], ['ex08', 3, '10', 0, 60], ['ex18', 3, '12', 30, 60], ['ex46', 3, '12', 6, 60], ['ex52', 3, '15', 0, 45]]],
        ['C', 'Corpo inteiro C', [5], [['ex33', 3, '12', 16, 90], ['ex02', 3, '10', 14, 90], ['ex20', 3, '10', 16, 60], ['ex25', 3, '12', 15, 60], ['ex10', 3, '12', 20, 60]]],
      ],
    },
    {
      key: 'avancado', name: 'ABC Avançado (técnicas)', goal: 'Hipertrofia · 3 dias · técnicas avançadas', weeks: 4,
      workouts: [
        ['A', 'Peito e Tríceps', [1], [
          ['ex01', 4, '12-10-8-6', 40, 120, { id: 'pircresc' }],
          ['ex04', 3, '12', 14, 60, null, { g: 'a', t: 'biset' }], ['ex06', 3, '12', 15, 75, null, { g: 'a', t: 'biset' }],
          ['ex11', 3, '12', 25, 60, { id: 'drop', qtd: 2, pct: 20 }],
          ['ex13', 7, '8-12', 15, 30, { id: 'fst7' }]]],
        ['B', 'Costas e Bíceps', [3], [
          ['ex17', 3, '10', 45, 90, { id: 'restpause', qtd: 2, pausa: 15 }],
          ['ex18', 3, '12', 40, 60, null, { g: 'b', t: 'biset' }], ['ex23', 3, '12', 20, 75, null, { g: 'b', t: 'biset' }],
          ['ex25', 3, '21', 15, 60, { id: 'r21' }],
          ['ex27', 3, '10', 12, 60, { id: 'drop', qtd: 1, pct: 25 }]]],
        ['C', 'Pernas', [5], [
          ['ex34', 3, '15', 35, 60, null, { g: 'c', t: 'preexaustao' }], ['ex30', 3, '10', 50, 120, null, { g: 'c', t: 'preexaustao' }],
          ['ex31', 3, '12', 120, 90, { id: 'myoreps', qtd: 4, reps: 4, pausa: 5 }],
          ['ex35', 4, '10', 35, 60, { id: 'negativa', seg: 4 }],
          ['ex41', 7, '8-12', 30, 30, { id: 'fst7' }]]],
      ],
    },
    {
      key: 'ppl', name: 'Push/Pull/Legs', goal: 'Hipertrofia · 6 dias · empurrar, puxar e pernas', weeks: 6,
      workouts: [
        ['A', 'Push · empurrar', [1], [['ex01', 4, '6-8', 50, 150], ['ex44', 3, '8', 30, 120], ['ex02', 3, '10', 18, 90], ['ex46', 3, '12', 8, 60], ['ex11', 3, '12', 25, 60]]],
        ['B', 'Pull · puxar', [2], [['ex24', 3, '5', 80, 180], ['ex22', 3, '8', 0, 120], ['ex19', 3, '8', 40, 90], ['ex49', 3, '15', 20, 60], ['ex25', 3, '10', 20, 60]]],
        ['C', 'Legs · pernas', [3], [['ex30', 4, '6-8', 60, 150], ['ex37', 3, '10', 40, 90], ['ex31', 3, '12', 120, 90], ['ex35', 3, '12', 35, 60], ['ex42', 4, '15', 40, 45]]],
        ['D', 'Push · empurrar 2', [4], [['ex43', 4, '8-10', 16, 90], ['ex16', 3, '8', 40, 120], ['ex05', 3, '12', 12, 60], ['ex46', 4, '15', 6, 45], ['ex12', 3, '10', 20, 60]]],
        ['E', 'Pull · puxar 2', [5], [['ex17', 4, '10', 45, 90], ['ex20', 3, '10', 22, 75], ['ex18', 3, '12', 40, 60], ['ex48', 3, '15', 6, 45], ['ex27', 3, '12', 12, 60]]],
        ['F', 'Legs · pernas 2', [6], [['ex32', 4, '10', 60, 120], ['ex38', 3, '10', 12, 75], ['ex34', 3, '15', 35, 60], ['ex36', 3, '12', 30, 60], ['ex41', 4, '15', 30, 45]]],
      ],
    },
    {
      key: 'upperlower', name: 'Upper/Lower', goal: 'Força e hipertrofia · 4 dias · superior e inferior', weeks: 6,
      workouts: [
        ['A', 'Superior 1', [1], [['ex01', 4, '6-8', 50, 150], ['ex19', 4, '8', 40, 120], ['ex44', 3, '8', 30, 90], ['ex17', 3, '10', 45, 75], ['ex25', 2, '12', 20, 60], ['ex10', 2, '12', 25, 60]]],
        ['B', 'Inferior 1', [2], [['ex30', 4, '6-8', 60, 150], ['ex37', 3, '10', 40, 120], ['ex31', 3, '12', 120, 90], ['ex35', 3, '12', 35, 60], ['ex42', 4, '12', 40, 45]]],
        ['C', 'Superior 2', [4], [['ex02', 3, '10', 18, 90], ['ex20', 3, '10', 22, 75], ['ex43', 3, '10', 14, 75], ['ex18', 3, '12', 40, 60], ['ex27', 2, '12', 12, 60], ['ex11', 2, '12', 25, 60]]],
        ['D', 'Inferior 2', [5], [['ex24', 3, '5', 80, 180], ['ex32', 3, '10', 60, 120], ['ex39', 3, '10', 60, 90], ['ex36', 3, '12', 30, 60], ['ex41', 4, '15', 30, 45]]],
      ],
    },
    {
      key: 'w531', name: '5/3/1 Boring But Big', goal: 'Força · 4 dias · ciclos de 4 semanas (Wendler)', weeks: 4,
      workouts: [
        ['A', 'Desenvolvimento', [1], [['ex44', 3, '5/3/1', 40, 180, { id: 'w531' }], ['ex44', 5, '10', 20, 90], ['ex17', 5, '10', 40, 90], ['ex46', 3, '15', 6, 45]]],
        ['B', 'Levantamento terra', [2], [['ex24', 3, '5/3/1', 120, 180, { id: 'w531' }], ['ex24', 5, '10', 60, 120], ['ex54', 3, '12', 0, 60]]],
        ['C', 'Supino', [4], [['ex01', 3, '5/3/1', 70, 180, { id: 'w531' }], ['ex01', 5, '10', 35, 90], ['ex20', 5, '10', 20, 75], ['ex11', 3, '12', 25, 60]]],
        ['D', 'Agachamento', [5], [['ex30', 3, '5/3/1', 90, 180, { id: 'w531' }], ['ex30', 5, '10', 45, 120], ['ex35', 3, '12', 35, 60], ['ex52', 3, '15', 0, 45]]],
      ],
    },
  ];

  function planFromTemplate(t, ws) {
    return {
      id: uid('p'), name: t.name, goal: t.goal, weeks: t.weeks,
      startDate: iso(weekStartOf(today(), ws)),
      workouts: t.workouts.map(([letter, name, days, items]) => ({
        id: uid('w'), letter, name, days: days.slice(),
        items: (function () {
          const gids = {};
          return items.map(([exId, sets, reps, kg, rest, tech, grp]) => ({
            id: uid('i'), exId, sets, reps, kg, rest, note: '', tech: tech ? Object.assign({}, tech) : null,
            group: grp ? { id: gids[grp.g] || (gids[grp.g] = uid('g')), type: grp.t } : null,
          }));
        })(),
      })),
    };
  }

  // ---------- estado ----------
  // Instalação nova começa zerada: sem plano e sem histórico (os modelos ficam em Planos → Modelos prontos).
  // Quem atualiza o app mantém tudo, porque load() só chama fresh() quando não há dados salvos.
  function fresh() {
    const settings = { name: '', restDefault: 60, restStep: 15, incKg: 2, weekStart: 1, sound: true, vibrate: true, suggest: true, colorPhotos: false, splash: true, bar: 20, askRir: true, reminder: false, reminderTime: '18:00', checkin: true, voiceDone: false, autoBackup: true };
    return { v: 1, settings, customExercises: [], exMeta: {}, plans: [], activePlanId: null, sessions: [], activeSessionId: null };
  }

  let S;
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
    if (!S || S.v !== 1) S = fresh();
    S.settings = Object.assign(fresh().settings, S.settings);
    S.exMeta = S.exMeta || {};
    S.body = S.body || { entries: [] };
    S.medals = S.medals || null;
    return S;
  }
  // Fotos de progresso ficam numa chave separada (são grandes e não entram no backup em texto).
  const PHOTO_KEY = 'meutreino.fotos';
  let photoCache = null;
  function photos() {
    if (!photoCache) { try { photoCache = JSON.parse(localStorage.getItem(PHOTO_KEY)) || []; } catch (e) { photoCache = []; } }
    return photoCache;
  }
  function savePhotos() {
    try { localStorage.setItem(PHOTO_KEY, JSON.stringify(photoCache || [])); return true; } catch (e) { return false; }
  }
  function addPhoto(data, pose) {
    photos().push({ id: uid('f'), date: iso(today()), data, pose: pose || 'Frente' });
    if (!savePhotos()) { photoCache.pop(); return false; }
    return true;
  }
  function deletePhoto(id) { photoCache = photos().filter((f) => f.id !== id); savePhotos(); }

  let saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.error(e); } };
    if (now) write(); else saveTimer = setTimeout(write, 120);
  }

  // ---------- exercícios ----------
  const libMap = {};
  (window.LIBRARY || []).forEach((e) => { libMap[e.id] = e; });
  function allExercises() { return (window.LIBRARY || []).concat(S.customExercises); }
  // Cardio (esteira, bicicleta, elíptico, corda, escada): tempo em minutos e sem descanso depois.
  // Exercício com o peso do corpo (flexão, barra fixa, paralela…): a carga do treino é o que se soma
  // ao corpo (lastro, positiva) ou o que se tira (ajuda do graviton ou elástico, negativa). 0 = só o corpo.
  function isBodyweight(exOrId) { const e = typeof exOrId === 'string' ? exercise(exOrId) : exOrId; return !!e && e.tipo !== 'tempo' && /peso corporal/i.test(e.equip || ''); }
  // Peso do corpo mais recente registrado em Progresso → Corpo (0 se nunca registrou).
  function bodyWeight() { const e = ((S.body && S.body.entries) || []).filter((x) => Number(x.peso) > 0); return e.length ? Number(e[e.length - 1].peso) : 0; }
  // Carga que conta para volume e recordes: no peso do corpo, corpo + lastro (ou − ajuda).
  function loadOf(x) { const k = Number(x.kg) || 0; return isBodyweight(x.exId) ? Math.max(0, bodyWeight() + k) : k; }
  function isCardio(exOrId) { const e = typeof exOrId === 'string' ? exercise(exOrId) : exOrId; return !!e && e.tipo === 'tempo' && e.grupo === 'Cardio'; }
  function exercise(id) { return libMap[id] || S.customExercises.find((e) => e.id === id) || { id, nome: 'Exercício removido', grupo: 'Outro', img: [], dicas: [], musculos: [] }; }
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function findExerciseByName(name) {
    const n = norm(name);
    return allExercises().find((e) => norm(e.nome) === n) || allExercises().find((e) => norm(e.nome).startsWith(n) || n.startsWith(norm(e.nome)));
  }
  function videoUrl(ex) {
    const meta = S.exMeta && S.exMeta[ex.id];
    return (meta && meta.video) || ex.video || 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.nome + ' execução correta');
  }

  // ---------- plano e semana ----------
  function activePlan() { return S.plans.find((p) => p.id === S.activePlanId) || S.plans[0] || null; }
  function plan(id) { return S.plans.find((p) => p.id === id); }
  function findWorkout(wid) {
    for (const p of S.plans) { const w = p.workouts.find((x) => x.id === wid); if (w) return { plan: p, workout: w }; }
    return null;
  }
  function weekRange(d) {
    const start = weekStartOf(d || today(), S.settings.weekStart);
    return { start, end: addDays(start, 6), startISO: iso(start), endISO: iso(addDays(start, 6)) };
  }
  function planWeek(p, d) {
    if (!p) return { n: 0, total: 0 };
    const s = weekStartOf(parseISO(p.startDate), S.settings.weekStart);
    const n = Math.floor((weekStartOf(d || today(), S.settings.weekStart) - s) / (7 * DAY)) + 1;
    return { n, total: p.weeks };
  }

  // Exercício concluído = todas as séries planejadas marcadas (ou marcado manualmente).
  // Séries que este treino pede do exercício: as do plano, ou menos (semana leve, dia aliviado, treino rápido).
  function sessionNeed(s, item) { return s.target && s.target[item.id] != null ? s.target[item.id] : item.sets; }
  function itemProgress(session, item) {
    const mains = session.sets.filter((x) => x.itemId === item.id && !x.sub);
    const done = mains.filter((x) => x.done).length;
    const need = sessionNeed(session, item);
    const planned = Math.max(need, mains.length);
    const extrasLeft = session.sets.some((x) => x.itemId === item.id && x.sub && !x.warm && !x.done);
    const complete = (session.completed || []).includes(item.id) || (done >= need && !extrasLeft);
    return { done, planned, complete };
  }
  function sessionProgress(session) {
    const fw = findWorkout(session.workoutId);
    const items = fw ? fw.workout.items : [];
    const total = items.length;
    const complete = items.filter((it) => itemProgress(session, it).complete).length;
    const setsDone = session.sets.filter((x) => x.done).length;
    const setsTotal = items.reduce((a, it) => a + it.sets, 0);
    return { total, complete, setsDone, setsTotal, ratio: total ? complete / total : 0 };
  }

  // Status de um treino na semana: feito, incompleto, pendente ou atrasado.
  function workoutStatus(w, range) {
    range = range || weekRange();
    const ss = S.sessions.filter((s) => s.workoutId === w.id && s.date >= range.startISO && s.date <= range.endISO);
    let best = null, bestP = null;
    ss.forEach((s) => { const p = sessionProgress(s); if (!bestP || p.ratio > bestP.ratio || (p.ratio === bestP.ratio && s.date > best.date)) { best = s; bestP = p; } });
    if (best && bestP.total && bestP.complete >= bestP.total) return { status: 'done', session: best, p: bestP };
    if (best && (bestP.setsDone > 0 || bestP.complete > 0 || best.id === S.activeSessionId)) return { status: 'partial', session: best, p: bestP };
    const t = today();
    const late = (w.days || []).length > 0 && (w.days || []).every((d) => {
      const dayDate = addDays(range.start, (d - S.settings.weekStart + 7) % 7);
      return dayDate < t;
    }) && range.end >= t;
    return { status: late ? 'late' : 'pending', session: best, p: bestP || { total: w.items.length, complete: 0, ratio: 0, setsDone: 0 } };
  }

  // ---------- sessões ----------
  function lastSetsFor(exId, excludeSessionId) {
    const ss = S.sessions.filter((s) => s.id !== excludeSessionId && s.sets.some((x) => x.exId === exId && x.done))
      .sort((a, b) => (b.end || b.start) - (a.end || a.start));
    if (!ss.length) return null;
    return ss[0].sets.filter((x) => x.exId === exId && x.done && !x.sub);
  }

  function startSession(workoutId) {
    const fw = findWorkout(workoutId);
    const s = { id: uid('s'), planId: fw.plan.id, workoutId, date: iso(today()), start: Date.now(), end: null, sets: [], completed: [], skipped: [], notes: {}, note: '', feel: 0, finished: false };
    fw.workout.items.forEach((it) => {
      const last = lastSetsFor(it.exId);
      const isTime = exercise(it.exId).tipo === 'tempo';
      TECH.buildSets(it, last, S.settings.incKg, repsTarget, planWeek(fw.plan).n).forEach((r) => {
        s.sets.push({ id: uid('x'), itemId: it.id, exId: it.exId, n: r.n, kg: r.kg, reps: r.reps, target: r.target || null, sub: !!r.sub, label: r.label || null, time: isTime || undefined, done: false, at: null, rest: null });
      });
    });
    if (deloadActive()) applyDeload(s, fw.workout);
    else if (rangeMode() === 'auto') {
      // Faixa de repetições no automático: quem bateu o topo da faixa já começa com a carga nova.
      fw.workout.items.forEach((it) => {
        const sg = loadSuggestion(it, s.id);
        if (sg && sg.why === 'range') { applyRange(s, it, sg); (s.autoUp = s.autoUp || []).push({ exId: it.exId, to: sg.to, lo: sg.lo }); }
      });
    }
    S.sessions.push(s);
    S.activeSessionId = s.id;
    save();
    return s;
  }

  // ---------- faixa de repetições (ex.: "8-12") ----------
  // Bateu o topo da faixa em todas as séries → sobe a carga e volta para o início da faixa.
  // settings.rangeMode: 'ask' (pergunta antes), 'auto' (aplica sozinho) ou 'off'.
  function repRange(r) {
    const m = String(r || '').match(/^\s*(\d+)\s*(?:-|–|a)\s*(\d+)\s*$/);
    return m && Number(m[2]) > Number(m[1]) ? { lo: Number(m[1]), hi: Number(m[2]) } : null;
  }
  const rangeMode = () => S.settings.rangeMode || 'ask';
  function applyRange(s, item, sg) {
    s.sets.filter((x) => x.itemId === item.id && !x.done && !x.warm && !x.sub).forEach((x) => { x.kg = sg.to; x.reps = sg.lo; });
  }

  // ---------- semana leve (deload) ----------
  // Proposta depois de 5 semanas seguidas treinando, ou 4 com metade das séries "no limite" nas últimas 2 semanas.
  // Na semana leve: ~60% das séries (sem as etapas extras das técnicas) e −10% de carga.
  const DELOAD = { weeks: 5, hardWeeks: 4, sets: 0.6, load: 0.9 };
  function deloadActive() { const d = S.deload, t = iso(today()); return d && d.start <= t && d.end >= t ? d : null; }
  function startDeload() { S.deload = { start: iso(today()), end: iso(addDays(today(), 6)) }; S.settings.deloadSnooze = null; save(true); }
  function endDeload() { if (S.deload) S.deload.end = iso(addDays(today(), -1)); save(true); }
  function snoozeDeload() { S.settings.deloadSnooze = iso(addDays(today(), 7)); save(true); }
  function deloadProposal() {
    if (deloadActive() || !activePlan()) return null;
    const t = iso(today());
    if (S.settings.deloadSnooze && S.settings.deloadSnooze > t) return null;
    const since = S.deload ? S.deload.end : '';
    const done = S.sessions.filter((s) => s.finished && !s.deload && s.date > since);
    const inWeek = (ws) => done.some((s) => s.date >= iso(ws) && s.date <= iso(addDays(ws, 6)));
    const cur = weekRange().start;
    let weeks = inWeek(cur) ? 1 : 0;
    for (let ws = addDays(cur, -7); inWeek(ws); ws = addDays(ws, -7)) weeks++;
    const rated = done.filter((s) => s.date >= iso(addDays(today(), -14))).flatMap((s) => s.sets.filter((x) => x.done && !x.warm && x.rir != null));
    const hard = rated.length >= 6 && rated.filter((x) => x.rir === 0).length / rated.length >= 0.5;
    if (weeks >= DELOAD.weeks || (weeks >= DELOAD.hardWeeks && hard)) return { weeks, hard };
    return null;
  }
  function applyDeload(s, w) {
    s.deload = true;
    const keep = [];
    w.items.forEach((it) => {
      const mine = s.sets.filter((x) => x.itemId === it.id);
      const mains = mine.filter((x) => !x.sub);
      const n = Math.max(1, Math.round(mains.length * DELOAD.sets));
      (s.target = s.target || {})[it.id] = n;
      mains.slice(0, n).forEach((x) => { if (Number(x.kg) > 0 && !x.time) x.kg = Math.round(x.kg * DELOAD.load * 2) / 2; keep.push(x); });
    });
    s.sets = s.sets.filter((x) => keep.includes(x));
  }

  // ---------- dor ou incômodo ----------
  // Registro por exercício (S.pain). Se repetir em 2 dos últimos 3 treinos do exercício (ou 2 vezes
  // em 30 dias), a execução avisa e sugere alternativas. "Ignorar" vale até a próxima dor registrada.
  const PAIN_SPOTS = ['Ombro', 'Cotovelo', 'Punho', 'Pescoço', 'Costas', 'Lombar', 'Quadril', 'Joelho', 'Tornozelo', 'Outro'];
  const PAIN_LEVELS = ['Leve', 'Moderada', 'Forte'];
  function addPain(e) {
    S.pain = S.pain || [];
    const p = Object.assign({ id: uid('p'), date: iso(today()), at: Date.now() }, e);
    S.pain.push(p); save(true);
    return p;
  }
  const painsFor = (exId) => (S.pain || []).filter((p) => p.exId === exId);
  function painAlert(exId, currentSessionId) {
    const list = painsFor(exId);
    if (list.length < 2) return null;
    const last3 = exerciseHistory(exId).slice(-3).map((h) => h.session.id).concat(currentSessionId || []);
    const since = iso(addDays(today(), -30));
    const recent = list.filter((p) => last3.includes(p.sessionId) || p.date >= since);
    if (recent.length < 2) return null;
    const last = recent[recent.length - 1];
    const sn = (S.settings.painSnooze || {})[exId];
    if (sn && sn >= last.at) return null;
    const count = {};
    recent.forEach((p) => { count[p.where] = (count[p.where] || 0) + 1; });
    const where = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    return { n: recent.length, where, last, strong: recent.some((p) => p.lvl === 2) };
  }
  function snoozePain(exId) { S.settings.painSnooze = Object.assign({}, S.settings.painSnooze, { [exId]: Date.now() }); save(); }

  // ---------- exercícios unilaterais ----------
  // Lado direito e esquerdo contados separados (x.repsR / x.repsL); x.reps guarda o menor dos dois
  // para recordes e volume. Liga sozinho para nomes como "unilateral", "um braço", "uma perna".
  const UNI_RX = /unilateral|um braço|uma perna|uma mão|one.arm|one.leg|single/i;
  function isUni(it, ex) { if (it && it.uni != null) return !!it.uni; const e = ex || (it && exercise(it.exId)); return !!(e && e.tipo !== 'tempo' && UNI_RX.test(e.nome || '')); }
  const sideR = (x) => (x.repsR != null ? x.repsR : Number(x.reps) || 0);
  const sideL = (x) => (x.repsL != null ? x.repsL : Number(x.reps) || 0);
  function setSides(x, r, l) { x.repsR = Math.max(0, r); x.repsL = Math.max(0, l); x.reps = Math.min(x.repsR, x.repsL); }

  // ---------- como você está hoje ----------
  // Respostas: sono, energia e dor (0 = ruim/baixa/muita, 1 = ok/pouca, 2 = bom/alta/nenhuma).
  // 1 resposta ruim → 10% menos carga; 2 ou mais → também 1 série a menos nos exercícios com 3 ou mais.
  function checkinLevel(c) { return ['sono', 'energia', 'dor'].filter((k) => c[k] === 0).length; }
  function applyCheckin(s, c, w) {
    const lv = c.forceNormal ? 0 : checkinLevel(c);
    s.checkin = { sono: c.sono, energia: c.energia, dor: c.dor, adj: lv ? Math.min(2, lv) : 0 };
    if (!lv) return;
    const keep = [];
    w.items.forEach((it) => {
      const mains = s.sets.filter((x) => x.itemId === it.id && !x.sub);
      const n = lv >= 2 && mains.length >= 3 ? mains.length - 1 : mains.length;
      if (n < mains.length) (s.target = s.target || {})[it.id] = Math.min(sessionNeed(s, it), n);
      s.sets.filter((x) => x.itemId === it.id).forEach((x) => { if (!x.sub && mains.indexOf(x) >= n) return; if (Number(x.kg) > 0 && !x.time) x.kg = Math.round(x.kg * 0.9 * 2) / 2; keep.push(x); });
    });
    s.sets = s.sets.filter((x) => keep.includes(x));
    save();
  }
  // ---------- treino rápido ----------
  // "Pouco tempo hoje": primeiro encurta o descanso (60%, mínimo 30 s); se ainda não couber, tira séries
  // dos exercícios com mais séries, deixando pelo menos 1 em cada. Sem as etapas extras das técnicas.
  const SET_S = 45;
  function estimate(w, sets, restF) {
    return w.items.reduce((a, it, k) => a + (isCardio(it.exId) ? sets[k] * (Number(it.reps) || 1200)
      : sets[k] * (SET_S + Math.max(restF < 1 ? 30 : 0, Math.round((Number(it.rest) || S.settings.restDefault) * restF)))), 0) / 60;
  }
  function quickPlan(w, min) {
    const full = w.items.map((it) => Number(it.sets) || 1), sets = full.slice();
    let restF = 0.6;
    while (estimate(w, sets, restF) > min) {
      let k = -1;
      sets.forEach((n, j) => { if (n > 1 && !isCardio(w.items[j].exId) && (k < 0 || n >= sets[k])) k = j; });
      if (k < 0) break;
      sets[k]--;
    }
    return { sets, restF, est: Math.round(estimate(w, sets, restF)), full: Math.round(estimate(w, full, 1)), cut: full.reduce((a, n) => a + n, 0) - sets.reduce((a, n) => a + n, 0) };
  }
  function applyQuick(s, w, min) {
    const q = quickPlan(w, min);
    s.quick = { min, rest: q.restF };
    s.target = s.target || {};
    const keep = [];
    w.items.forEach((it, k) => {
      const mine = s.sets.filter((x) => x.itemId === it.id), mains = mine.filter((x) => !x.sub);
      const n = Math.min(mains.length, q.sets[k]);
      s.target[it.id] = Math.min(sessionNeed(s, it), n);
      mains.slice(0, n).forEach((x) => keep.push(x));
      if (n >= mains.length) mine.filter((x) => x.sub).forEach((x) => keep.push(x));
    });
    s.sets = s.sets.filter((x) => keep.includes(x));
    save();
  }
  // Descanso deste exercício neste treino (encurtado no treino rápido).
  function restFor(s, it) {
    const r = Number(it.rest) || S.settings.restDefault;
    return s && s.quick ? Math.max(30, Math.round(r * s.quick.rest / 5) * 5) : r;
  }

  // Treinos "leves" (semana leve ou dia ajustado) não contam para sugestões e estagnação.
  const lightSession = (s) => !!(s.deload || (s.checkin && s.checkin.adj));

  // ---------- estagnação ----------
  // Os 3 últimos treinos do exercício não superaram o anterior a eles (1RM estimado, ou repetições
  // quando não há carga). Semanas leves não contam. "Ignorar" esconde o aviso por mais 3 treinos.
  function stallOf(exId, currentSessionId) {
    const ex = exercise(exId);
    if (!ex || ex.tipo === 'tempo') return null;
    const h = exerciseHistory(exId).filter((x) => !lightSession(x.session) && x.session.id !== currentSessionId);
    if (h.length < 4) return null;
    const score = (x) => (x.e1rm > 0 ? x.e1rm : Math.max(...x.sets.map((y) => Number(y.reps) || 0)));
    const base = score(h[h.length - 4]), best = Math.max(...h.slice(-3).map(score));
    if (best > base + 0.25) return null;
    const sn = (S.settings.stallSnooze || {})[exId];
    if (sn && h.length < sn + 3) return null;
    return { base, best, e1rm: h[h.length - 4].e1rm > 0 };
  }
  function snoozeStall(exId) {
    S.settings.stallSnooze = Object.assign({}, S.settings.stallSnooze, { [exId]: exerciseHistory(exId).filter((x) => !x.session.deload).length });
    save();
  }
  function stalledExercises() {
    const p = activePlan(); if (!p) return [];
    return [...new Set(p.workouts.flatMap((w) => w.items.map((it) => it.exId)))].filter((id) => stallOf(id));
  }
  function repsTarget(r) { const m = String(r).match(/\d+/g); return m ? Number(m[m.length - 1]) : 10; }
  function session(id) { return S.sessions.find((s) => s.id === id); }

  // Ao concluir uma série, grava a hora e o descanso real desde a série anterior desta sessão.
  function toggleSet(s, setId) {
    const x = s.sets.find((y) => y.id === setId);
    x.done = !x.done;
    if (x.done) {
      x.at = Date.now();
      const prevDone = s.sets.filter((y) => y.done && y.id !== x.id && y.at).sort((a, b) => b.at - a.at)[0];
      if (prevDone && x.at - prevDone.at < 15 * 60000) prevDone.rest = Math.round((x.at - prevDone.at) / 1000);
    } else { x.at = null; }
    save();
    return x;
  }
  function addSet(s, item) {
    const mine = s.sets.filter((x) => x.itemId === item.id);
    const mains = mine.filter((x) => !x.sub);
    const last = mine[mine.length - 1], lastMain = mains[mains.length - 1];
    const x = { id: uid('x'), itemId: item.id, exId: item.exId, n: mains.length + 1, kg: lastMain ? lastMain.kg : Number(item.kg) || 0, reps: lastMain ? lastMain.reps : repsTarget(item.reps), done: false, at: null, rest: null };
    const idx = s.sets.indexOf(last);
    s.sets.splice(idx + 1, 0, x);
    save();
    return x;
  }
  // Troca o exercício de um item nesta sessão (e, se pedido, também no plano).
  function swapExercise(s, item, newExId, permanent) {
    s.swaps = s.swaps || {};
    s.swaps[item.id] = newExId;
    const isTime = exercise(newExId).tipo === 'tempo';
    const last = lastSetsFor(newExId);
    s.sets.filter((x) => x.itemId === item.id).forEach((x) => {
      x.exId = newExId; x.time = isTime || undefined;
      if (!x.done && !x.sub && last) { const p = last[x.n - 1] || last[last.length - 1]; x.kg = p.kg; x.reps = p.reps; }
    });
    if (permanent) { item.exId = newExId; delete s.swaps[item.id]; }
    save();
  }
  const exOf = (s, item) => (s && s.swaps && s.swaps[item.id]) || item.exId;

  // Séries de aquecimento: entram antes da 1ª série, não contam para volume nem recordes.
  function addWarmups(s, item, list) {
    s.sets = s.sets.filter((x) => !(x.itemId === item.id && x.warm && !x.done));
    const first = s.sets.findIndex((x) => x.itemId === item.id);
    const rows = list.map((w, i) => ({ id: uid('x'), itemId: item.id, exId: exOf(s, item), n: 0, kg: w.kg, reps: w.reps, sub: true, warm: true, label: 'Aquec. ' + (i + 1), done: false, at: null, rest: null }));
    s.sets.splice(first < 0 ? s.sets.length : first, 0, ...rows);
    save();
  }

  // ---------- corpo: peso e medidas ----------
  const MEASURES = [['peso', 'Peso', 'kg'], ['gordura', 'Gordura', '%'], ['cintura', 'Cintura', 'cm'], ['peito', 'Peito', 'cm'], ['braco', 'Braço', 'cm'], ['coxa', 'Coxa', 'cm'], ['quadril', 'Quadril', 'cm'], ['panturrilha', 'Panturrilha', 'cm']];
  function addBody(entry) {
    const e = Object.assign({ id: uid('b'), date: iso(today()) }, entry);
    S.body.entries = S.body.entries.filter((x) => x.date !== e.date).concat(e).sort((a, b) => (a.date < b.date ? -1 : 1));
    save(true);
    return e;
  }

  function finishSession(s, feel, note) {
    s.end = Date.now(); s.finished = true; s.feel = feel || 0; s.note = note || '';
    if (S.activeSessionId === s.id) S.activeSessionId = null;
    save(true);
  }
  function deleteSession(id) {
    S.sessions = S.sessions.filter((s) => s.id !== id);
    if (S.activeSessionId === id) S.activeSessionId = null;
    save();
  }

  // ---------- métricas ----------
  const e1rm = (kg, reps) => (reps > 0 ? kg * (1 + reps / 30) : 0);
  function sessionVolume(s) { return s.sets.filter((x) => x.done && !x.warm && !x.time).reduce((a, x) => a + loadOf(x) * (Number(x.reps) || 0), 0); }
  function sessionDuration(s) { return s.end ? Math.round((s.end - s.start) / 60000) : Math.round((Date.now() - s.start) / 60000); }

  function exerciseHistory(exId) {
    return S.sessions.filter((s) => s.sets.some((x) => x.exId === exId && x.done && !x.warm))
      .sort((a, b) => a.start - b.start)
      .map((s) => {
        const sets = s.sets.filter((x) => x.exId === exId && x.done && !x.warm);
        const maxKg = Math.max(...sets.map(loadOf));
        const best = Math.max(...sets.map((x) => e1rm(loadOf(x), Number(x.reps) || 0)));
        return { date: s.date, session: s, sets, maxKg, e1rm: best, volume: sets.reduce((a, x) => a + loadOf(x) * x.reps, 0) };
      });
  }

  // Sugestão de carga:
  // - com RIR registrado: bateu as repetições na última vez e sobraram 2+ repetições em média → sobe já;
  // - sem RIR: bateu todas as repetições nas 2 últimas sessões com a mesma carga → sobe.
  function loadSuggestion(item, currentSessionId, exId) {
    exId = exId || item.exId;
    // Peso do corpo progride em repetições, sem sugestão de carga.
    if (exercise(exId).tipo === 'tempo' || isBodyweight(exId) || (item.tech && item.tech.id === 'w531')) return null;
    const all = exerciseHistory(exId).filter((h) => h.session.id !== currentSessionId && !lightSession(h.session));
    const lastH = all[all.length - 1];
    const rg = repRange(item.reps);
    if (rg && rangeMode() !== 'off') {
      const m = lastH ? lastH.sets.filter((x) => !x.sub) : [];
      if (lastH && lastH.maxKg > 0 && m.length >= item.sets && m.every((x) => Number(x.reps) >= rg.hi)) return { from: lastH.maxKg, to: lastH.maxKg + Number(S.settings.incKg || 2), why: 'range', lo: rg.lo, hi: rg.hi };
      return null;
    }
    if (!S.settings.suggest) return null;
    if (lastH) {
      const m = lastH.sets.filter((x) => !x.sub);
      const rirs = m.map((x) => x.rir).filter((v) => v != null);
      if (rirs.length >= Math.ceil(m.length / 2) && m.length >= item.sets) {
        const avg = rirs.reduce((a, v) => a + v, 0) / rirs.length;
        const hit = m.every((x) => x.reps >= repsTarget(item.reps));
        if (hit && avg >= 2) return { from: lastH.maxKg, to: lastH.maxKg + Number(S.settings.incKg || 2), why: 'rir', rir: Math.round(avg * 10) / 10 };
        return null;
      }
    }
    const hist = all.slice(-2);
    if (hist.length < 2) return null;
    const target = repsTarget(item.reps);
    const ok = hist.every((h) => { const m = h.sets.filter((x) => !x.sub); return m.length >= item.sets && m.every((x) => x.reps >= target); });
    const sameKg = hist[0].maxKg === hist[1].maxKg && hist[1].maxKg > 0;
    if (!ok || !sameKg) return null;
    return { from: hist[1].maxKg, to: hist[1].maxKg + Number(S.settings.incKg || 2), why: 'reps' };
  }

  // Recordes: maior carga do exercício superada nesta sessão.
  function sessionRecords(s) {
    const out = [];
    const exIds = [...new Set(s.sets.filter((x) => x.done).map((x) => x.exId))];
    exIds.forEach((exId) => {
      const before = S.sessions.filter((o) => o.id !== s.id && o.start < s.start)
        .flatMap((o) => o.sets.filter((x) => x.exId === exId && x.done).map(loadOf));
      const now = Math.max(...s.sets.filter((x) => x.exId === exId && x.done).map(loadOf));
      if (before.length && now > Math.max(...before)) out.push({ exId, kg: now, prev: Math.max(...before) });
    });
    return out;
  }

  function weeksBack(n) {
    const cur = weekRange();
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(weekRange(addDays(cur.start, -7 * i)));
    return out;
  }

  // ---------- importar / exportar ----------
  const DAY_WORDS = { dom: 0, domingo: 0, seg: 1, segunda: 1, ter: 2, terca: 2, qua: 3, quarta: 3, qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6 };
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/)[0] || '';
    const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  // Colunas: plano,semanas,treino,dia,exercicio,series,repeticoes,carga_kg,descanso_s,observacao
  function importPlanCSV(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('A planilha está vazia.');
    const head = rows[0].map(norm);
    const col = (names) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
    const C = {
      plano: col(['plano']), semanas: col(['semanas']), treino: col(['treino']), dia: col(['dia']),
      ex: col(['exercicio']), series: col(['series']), reps: col(['repeticoes', 'reps']), kg: col(['carga']),
      rest: col(['descanso']), obs: col(['observacao', 'obs']), tec: col(['tecnica']), grp: col(['grupo']),
    };
    if (C.treino < 0 || C.ex < 0) throw new Error('Faltam as colunas "treino" e "exercicio".');
    const get = (r, i) => (i >= 0 && r[i] != null ? String(r[i]).trim() : '');
    const plans = {};
    let created = 0;
    rows.slice(1).forEach((r) => {
      const pname = get(r, C.plano) || 'Plano importado';
      const p = plans[pname] || (plans[pname] = { id: uid('p'), name: pname, goal: 'Importado', weeks: Number(get(r, C.semanas)) || 4, startDate: iso(weekStartOf(today(), S.settings.weekStart)), workouts: [] });
      const tname = get(r, C.treino) || 'A';
      let w = p.workouts.find((x) => x._key === tname);
      if (!w) {
        const m = tname.match(/^([A-Za-z0-9]{1,2})\s*[-–:.]\s*(.+)$/);
        w = { id: uid('w'), _key: tname, letter: m ? m[1].toUpperCase() : String.fromCharCode(65 + p.workouts.length), name: m ? m[2] : tname, days: [], items: [] };
        p.workouts.push(w);
      }
      get(r, C.dia).split(/[\/,;|e ]+/).map(norm).forEach((d) => { if (d in DAY_WORDS && !w.days.includes(DAY_WORDS[d])) w.days.push(DAY_WORDS[d]); });
      const exName = get(r, C.ex);
      if (!exName) return;
      let ex = findExerciseByName(exName);
      if (!ex) { ex = { id: uid('c'), nome: exName, grupo: 'Outro', equip: '', musculos: [], secundarios: [], dicas: [], img: [], custom: true }; S.customExercises.push(ex); created++; }
      const item = { id: uid('i'), exId: ex.id, sets: Number(get(r, C.series)) || 3, reps: get(r, C.reps) || '10', kg: Number(get(r, C.kg).replace(',', '.')) || 0, rest: Number(get(r, C.rest)) || S.settings.restDefault, note: get(r, C.obs), tech: null, group: null };
      const tec = TECH.findByName(get(r, C.tec));
      if (tec && tec.mode === 'group') item._grpType = tec.id;
      else if (tec) item.tech = { id: tec.id };
      const gname = get(r, C.grp);
      if (gname) {
        w._groups = w._groups || {};
        const prevItem = w.items[w.items.length - 1];
        const gid = w._groups[gname] && prevItem && prevItem.group && prevItem.group.id === w._groups[gname].id ? w._groups[gname].id : uid('g');
        w._groups[gname] = { id: gid };
        item.group = { id: gid, type: item._grpType || (prevItem && prevItem.group && prevItem.group.id === gid ? prevItem.group.type : 'biset') };
      }
      delete item._grpType;
      w.items.push(item);
    });
    const list = Object.values(plans);
    list.forEach((p) => { p.workouts.forEach((w) => { delete w._key; delete w._groups; w.days.sort(); }); S.plans.push(p); });
    save(true);
    return { plans: list, created };
  }

  function exportPlanCSV(p) {
    const q = (v) => (/[",;\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
    const lines = ['plano,semanas,treino,dia,exercicio,series,repeticoes,carga_kg,descanso_s,observacao,tecnica,grupo'];
    p.workouts.forEach((w) => {
      const gnames = {};
      w.items.forEach((it) => {
        const tec = it.group ? TECH.get(it.group.type) : it.tech ? TECH.get(it.tech.id) : null;
        const g = it.group ? (gnames[it.group.id] || (gnames[it.group.id] = 'G' + (Object.keys(gnames).length + 1))) : '';
        lines.push([p.name, p.weeks, w.letter + ' - ' + w.name, w.days.map((d) => WEEKDAYS_LONG[d]).join('/'), exercise(it.exId).nome, it.sets, it.reps, it.kg, it.rest, it.note || '', tec ? tec.nome : '', g].map(q).join(','));
      });
    });
    return lines.join('\n');
  }

  function exportBackup() { return JSON.stringify(S); }
  // Backup semanal. Android: grava sozinho em Downloads/Gravity. Navegador (iPhone): só avisa
  // (backupDue) para a tela inicial lembrar. Fotos de progresso não entram no backup.
  const WEEK = 7 * 864e5;
  const hasData = () => S.sessions.some((s) => !s.demo) || S.plans.length > 0;
  function backupDue() {
    const st = S.settings;
    if (st.autoBackup === false || !hasData()) return false;
    if (st.backupSnooze && Date.now() < st.backupSnooze) return false;
    return Date.now() - (st.lastBackup || 0) >= WEEK;
  }
  function autoBackup() {
    const A = window.Android;
    if (!A || !A.saveBackup || !backupDue()) return '';
    let where = '';
    try { where = A.saveBackup('gravity-backup-' + iso(today()) + '.json', exportBackup()); } catch (e) { /* tenta na próxima */ }
    if (where) { S.settings.lastBackup = Date.now(); S.settings.lastBackupWhere = where; save(true); }
    return where;
  }
  function backupDone() { S.settings.lastBackup = Date.now(); S.settings.backupSnooze = null; save(true); }
  function snoozeBackup() { S.settings.backupSnooze = Date.now() + 2 * 864e5; save(true); }
  function importBackup(text) {
    const data = JSON.parse(text);
    if (!data || data.v !== 1 || !Array.isArray(data.plans)) throw new Error('Arquivo de backup inválido.');
    S = data; save(true);
  }
  function reset() { S = fresh(); save(true); photoCache = []; savePhotos(); }

  // Gera 3 semanas de treinos fictícios para visualizar a dashboard.
  function seedDemo() {
    const p = activePlan(); if (!p) return;
    const cur = weekRange();
    for (let wk = 3; wk >= 1; wk--) {
      const ws = addDays(cur.start, -7 * wk);
      p.workouts.forEach((w, wi) => {
        if (wk === 1 && wi === p.workouts.length - 1) return;
        const day = addDays(ws, ((w.days[0] != null ? w.days[0] : wi + 1) - S.settings.weekStart + 7) % 7);
        const start = day.getTime() + 18 * 3600000;
        const s = { id: uid('s'), planId: p.id, workoutId: w.id, date: iso(day), start, end: start + (50 + wi * 4) * 60000, sets: [], completed: [], skipped: [], notes: {}, note: '', feel: 3 + (wi % 2), finished: true, demo: true };
        let t = start;
        w.items.forEach((it) => {
          for (let n = 0; n < it.sets; n++) {
            t += (it.rest + 40) * 1000;
            const kg = Math.max(0, Number(it.kg) + (3 - wk) * (S.settings.incKg || 2) * (n < 2 ? 1 : 0.5));
            s.sets.push({ id: uid('x'), itemId: it.id, exId: it.exId, n: n + 1, kg: Math.round(kg * 2) / 2, reps: repsTarget(it.reps) - (n === it.sets - 1 && wk === 3 ? 2 : 0), done: true, at: t, rest: it.rest + Math.round(Math.random() * 30 - 10) });
          }
        });
        S.sessions.push(s);
      });
    }
    save(true);
  }
  function clearDemo() { S.sessions = S.sessions.filter((s) => !s.demo); save(true); }

  window.Store = {
    load, save, get state() { return S; }, uid, PAIN_SPOTS, PAIN_LEVELS, addPain, painsFor, painAlert, snoozePain, sessionNeed, quickPlan, applyQuick, restFor, isUni, sideR, sideL, setSides, checkinLevel, applyCheckin, lightSession, isCardio, isBodyweight, bodyWeight, loadOf, repRange, rangeMode, applyRange, deloadActive, deloadProposal, startDeload, endDeload, snoozeDeload, stallOf, snoozeStall, stalledExercises, DELOAD,
    WEEKDAYS, WEEKDAYS_LONG, GROUPS, TEMPLATES, DAY,
    iso, parseISO, today, addDays, weekStartOf, weekRange, weeksBack,
    allExercises, exercise, findExerciseByName, videoUrl,
    activePlan, plan, findWorkout, planWeek, planFromTemplate,
    itemProgress, sessionProgress, workoutStatus,
    startSession, session, toggleSet, addSet, finishSession, swapExercise, exOf, addWarmups, MEASURES, addBody, photos, addPhoto, deletePhoto, deleteSession, lastSetsFor, repsTarget,
    e1rm, sessionVolume, sessionDuration, exerciseHistory, loadSuggestion, sessionRecords,
    importPlanCSV, exportPlanCSV, exportBackup, backupDue, autoBackup, backupDone, snoozeBackup, importBackup, reset, seedDemo, clearDemo,
  };
})();
