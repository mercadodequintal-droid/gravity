// Cálculos derivados do histórico: músculos e volume ideal, recuperação, recordes,
// conquistas, calendário, anilhas e aquecimento. Nada aqui pede dados ao usuário.
(function () {
  'use strict';
  const S = () => Store.state;
  const HOUR = 3600000;

  // ---------- músculos ----------
  // Regiões do mapa muscular, com a faixa de séries semanais recomendada.
  const REGIONS = [
    { id: 'peitoral', nome: 'Peitoral', alvo: [10, 20] },
    { id: 'ombros', nome: 'Ombros', alvo: [10, 20] },
    { id: 'biceps', nome: 'Bíceps', alvo: [8, 16] },
    { id: 'triceps', nome: 'Tríceps', alvo: [8, 16] },
    { id: 'antebracos', nome: 'Antebraços', alvo: [4, 12] },
    { id: 'abdomen', nome: 'Abdômen', alvo: [6, 16] },
    { id: 'trapezio', nome: 'Trapézio', alvo: [6, 16] },
    { id: 'dorsais', nome: 'Dorsais', alvo: [10, 20] },
    { id: 'meio', nome: 'Meio das costas', alvo: [8, 16] },
    { id: 'lombar', nome: 'Lombar', alvo: [3, 10] },
    { id: 'gluteos', nome: 'Glúteos', alvo: [8, 16] },
    { id: 'quadriceps', nome: 'Quadríceps', alvo: [10, 20] },
    { id: 'posteriores', nome: 'Posteriores', alvo: [8, 16] },
    { id: 'panturrilhas', nome: 'Panturrilhas', alvo: [8, 16] },
  ];
  const BY_NAME = { 'peitoral': 'peitoral', 'ombros': 'ombros', 'bíceps': 'biceps', 'tríceps': 'triceps', 'antebraços': 'antebracos', 'abdômen': 'abdomen', 'trapézio': 'trapezio',
    'dorsais': 'dorsais', 'meio das costas': 'meio', 'lombar': 'lombar', 'glúteos': 'gluteos', 'quadríceps': 'quadriceps', 'posteriores de coxa': 'posteriores', 'panturrilhas': 'panturrilhas',
    'adutores': 'quadriceps', 'abdutores': 'gluteos', 'pescoço': 'trapezio' };
  const BY_GROUP = { 'Peito': 'peitoral', 'Costas': 'dorsais', 'Ombros': 'ombros', 'Bíceps': 'biceps', 'Tríceps': 'triceps', 'Pernas': 'quadriceps', 'Posterior': 'posteriores',
    'Glúteos': 'gluteos', 'Panturrilha': 'panturrilhas', 'Trapézio': 'trapezio', 'Abdômen': 'abdomen', 'Cardio': null, 'Outro': null };

  // Peso de cada região para um exercício: principal = 1 série, auxiliar = 0,5.
  function musclesOf(ex) {
    const out = {};
    (ex.musculos || []).forEach((m) => { const r = BY_NAME[m]; if (r) out[r] = 1; });
    (ex.secundarios || []).forEach((m) => { const r = BY_NAME[m]; if (r && !out[r]) out[r] = 0.5; });
    if (!Object.keys(out).length && BY_GROUP[ex.grupo]) out[BY_GROUP[ex.grupo]] = 1;
    return out;
  }
  const workSet = (x) => x.done && !x.sub && !x.warm;

  // Séries por região num período (padrão: semana atual).
  function setsByRegion(fromISO, toISO) {
    const r = Store.weekRange();
    fromISO = fromISO || r.startISO; toISO = toISO || r.endISO;
    const out = {}; REGIONS.forEach((g) => { out[g.id] = 0; });
    S().sessions.filter((s) => s.date >= fromISO && s.date <= toISO).forEach((s) => s.sets.filter(workSet).forEach((x) => {
      const m = musclesOf(Store.exercise(x.exId));
      Object.keys(m).forEach((k) => { out[k] += m[k]; });
    }));
    return out;
  }
  // Situação de cada região em relação à faixa ideal.
  function volumeStatus(sets) {
    return REGIONS.map((g) => {
      const n = Math.round(sets[g.id] * 2) / 2;
      const st = n === 0 ? 'zero' : n < g.alvo[0] ? 'pouco' : n > g.alvo[1] ? 'alto' : 'ideal';
      return { id: g.id, nome: g.nome, n, alvo: g.alvo, st };
    });
  }

  // Recuperação estimada de cada região (0 = acabou de treinar, 1 = recuperado).
  // Precisa de 48 h + 4 h por série feita, até 96 h.
  function recovery() {
    const now = Date.now(), out = {};
    REGIONS.forEach((g) => { out[g.id] = 1; });
    const recent = S().sessions.filter((s) => now - (s.end || s.start) < 5 * 24 * HOUR);
    REGIONS.forEach((g) => {
      let worst = 1;
      recent.forEach((s) => {
        let sets = 0;
        s.sets.filter(workSet).forEach((x) => { sets += musclesOf(Store.exercise(x.exId))[g.id] || 0; });
        if (!sets) return;
        const need = Math.min(96, 48 + 4 * sets) * HOUR;
        worst = Math.min(worst, Math.min(1, (now - (s.end || s.start)) / need));
      });
      out[g.id] = worst;
    });
    return out;
  }

  // ---------- recordes ----------
  const REPS = [1, 3, 5, 10];
  const e1rm = (kg, reps) => (reps > 0 ? kg * (1 + reps / 30) : 0);
  // Melhores marcas de um exercício, ignorando uma série específica (para comparar a nova).
  function bestOf(exId, ignoreSetId) {
    const b = { rm: {}, e1rm: 0, setVol: 0, secs: 0, sessions: 0 };
    REPS.forEach((n) => { b.rm[n] = 0; });
    S().sessions.forEach((s) => {
      let any = false;
      s.sets.forEach((x) => {
        if (x.exId !== exId || !x.done || x.warm || x.id === ignoreSetId) return;
        any = true;
        const kg = Store.loadOf(x), reps = Number(x.reps) || 0;
        if (x.time) { b.secs = Math.max(b.secs, reps); return; }
        REPS.forEach((n) => { if (reps >= n) b.rm[n] = Math.max(b.rm[n], kg); });
        b.e1rm = Math.max(b.e1rm, e1rm(kg, reps));
        b.setVol = Math.max(b.setVol, kg * reps);
      });
      if (any) b.sessions++;
    });
    return b;
  }
  // A série acabou de bater algum recorde? Só conta se já havia histórico do exercício.
  function newRecord(x) {
    if (!x.done || x.warm) return null;
    const b = bestOf(x.exId, x.id);
    if (!b.sessions) return null;
    const kg = Store.loadOf(x), reps = Number(x.reps) || 0;
    if (x.time) return reps > b.secs && b.secs > 0 ? { tipo: 'Tempo', txt: reps + ' s' } : null;
    if (!kg) return null;
    for (let i = REPS.length - 1; i >= 0; i--) {
      const n = REPS[i];
      if (reps >= n && kg > b.rm[n] && b.rm[n] > 0) return { tipo: n === 1 ? 'Carga máxima' : 'Melhor ' + n + ' reps', txt: kg + ' kg × ' + reps };
    }
    if (e1rm(kg, reps) > b.e1rm + 0.5 && b.e1rm > 0) return { tipo: '1RM estimado', txt: Math.round(e1rm(kg, reps)) + ' kg' };
    return null;
  }
  // Tabela de recordes de todos os exercícios já feitos.
  function allRecords() {
    const ids = [...new Set(S().sessions.flatMap((s) => s.sets.filter((x) => x.done && !x.warm).map((x) => x.exId)))];
    return ids.map((id) => ({ exId: id, ex: Store.exercise(id), b: bestOf(id) })).sort((a, b) => b.b.e1rm - a.b.e1rm);
  }
  // Quantas vezes a carga máxima de algum exercício subiu (para conquistas).
  function recordCount() {
    const best = {}; let n = 0;
    S().sessions.slice().sort((a, b) => a.start - b.start).forEach((s) => {
      const m = {};
      s.sets.filter((x) => x.done && !x.warm && !x.time).forEach((x) => { m[x.exId] = Math.max(m[x.exId] || 0, Store.loadOf(x)); });
      Object.keys(m).forEach((id) => { if (best[id] != null && m[id] > best[id]) n++; best[id] = Math.max(best[id] || 0, m[id]); });
    });
    return n;
  }

  // ---------- conquistas ----------
  const MEDALS = [
    { id: 'primeiro', nome: 'Primeiro passo', desc: 'Concluir o primeiro treino' },
    { id: 't10', nome: 'Dez treinos', desc: 'Concluir 10 treinos' },
    { id: 't50', nome: 'Cinquenta', desc: 'Concluir 50 treinos' },
    { id: 't100', nome: 'Centenário', desc: 'Concluir 100 treinos' },
    { id: 'semana', nome: 'Semana fechada', desc: 'Fazer todos os treinos de uma semana' },
    { id: 'seq4', nome: 'Um mês sem falhar', desc: '4 semanas completas seguidas' },
    { id: 'tres', nome: 'Três seguidos', desc: 'Treinar 3 dias seguidos' },
    { id: 'pr1', nome: 'Primeiro recorde', desc: 'Bater uma marca pessoal' },
    { id: 'pr25', nome: 'Colecionador', desc: 'Bater 25 recordes' },
    { id: 'oitomil', nome: 'É mais de 8 mil!', desc: 'Levantar mais de 8.000 kg num só treino' },
    { id: 'ton10', nome: '10 toneladas', desc: 'Somar 10.000 kg levantados' },
    { id: 'ton100', nome: '100 toneladas', desc: 'Somar 100.000 kg levantados' },
    { id: 'cedo', nome: 'Madrugador', desc: 'Começar um treino antes das 7h' },
    { id: 'noite', nome: 'Coruja', desc: 'Começar um treino depois das 21h' },
    { id: 'tecnicas', nome: 'Arsenal', desc: 'Usar 5 técnicas avançadas diferentes' },
    { id: 'fst7', nome: 'Sete de sete', desc: 'Completar as 7 séries de um FST-7' },
    { id: 'corpo', nome: 'No espelho', desc: 'Registrar peso ou medidas' },
    { id: 'foto', nome: 'Antes e depois', desc: 'Salvar a primeira foto de progresso' },
    { id: 'teste', nome: 'Ponto de partida', desc: 'Registrar o primeiro teste de desempenho' },
    { id: 'melhorou', nome: 'Evoluiu', desc: 'Melhorar o resultado de um teste' },
  ];
  function earned() {
    const st = S(), out = new Set();
    const done = st.sessions.filter((s) => { const p = Store.sessionProgress(s); return p.total && p.complete >= p.total; });
    const withSets = st.sessions.filter((s) => s.sets.some((x) => x.done));
    if (done.length >= 1) out.add('primeiro');
    if (done.length >= 10) out.add('t10');
    if (done.length >= 50) out.add('t50');
    if (done.length >= 100) out.add('t100');
    const p = Store.activePlan();
    if (p && p.workouts.length) {
      const weeks = Store.weeksBack(52).map((w) => p.workouts.every((wo) => Store.workoutStatus(wo, w).status === 'done'));
      if (weeks.some(Boolean)) out.add('semana');
      let run = 0; weeks.forEach((f) => { run = f ? run + 1 : 0; if (run >= 4) out.add('seq4'); });
    }
    const days = [...new Set(withSets.map((s) => s.date))].sort();
    for (let i = 2; i < days.length; i++) {
      const a = Store.parseISO(days[i - 2]), c = Store.parseISO(days[i]);
      if ((c - a) / 864e5 === 2 && days[i - 1] === Store.iso(Store.addDays(a, 1))) { out.add('tres'); break; }
    }
    const prs = recordCount();
    if (prs >= 1) out.add('pr1');
    if (prs >= 25) out.add('pr25');
    const vols = withSets.map((s) => Store.sessionVolume(s));
    if (vols.some((v) => v > 8000)) out.add('oitomil');
    const total = vols.reduce((a, v) => a + v, 0);
    if (total >= 10000) out.add('ton10');
    if (total >= 100000) out.add('ton100');
    withSets.forEach((s) => { const h = new Date(s.start).getHours(); if (h < 7) out.add('cedo'); if (h >= 21) out.add('noite'); });
    const techs = new Set();
    withSets.forEach((s) => {
      const fw = Store.findWorkout(s.workoutId); if (!fw) return;
      fw.workout.items.forEach((it) => {
        if (!s.sets.some((x) => x.itemId === it.id && x.done)) return;
        if (it.tech) techs.add(it.tech.id);
        if (it.group) techs.add(it.group.type);
        if (it.tech && it.tech.id === 'fst7' && s.sets.filter((x) => x.itemId === it.id && x.done && !x.sub).length >= 7) out.add('fst7');
      });
    });
    if (techs.size >= 5) out.add('tecnicas');
    if ((st.body && st.body.entries || []).length) out.add('corpo');
    if (Store.photos().length) out.add('foto');
    if ((st.tests || []).length) out.add('teste');
    if (window.Goals && Goals.TESTS.some((t) => { const r = Goals.results(t.id); return r.length >= 2 && (t.up ? Math.max(...r.slice(1).map((x) => x.v)) > r[0].v : Math.min(...r.slice(1).map((x) => x.v)) < r[0].v); })) out.add('melhorou');
    return out;
  }
  // Conquistas novas desde a última verificação (para avisar ao terminar o treino).
  function newMedals() {
    const st = S(); st.medals = st.medals || [];
    const now = earned();
    const fresh = MEDALS.filter((m) => now.has(m.id) && !st.medals.includes(m.id));
    if (fresh.length) { st.medals = [...now]; Store.save(); }
    return fresh;
  }

  // ---------- calendário ----------
  // Volume por dia nos últimos ~12 meses.
  function calendar() {
    const out = {};
    S().sessions.forEach((s) => { const v = Store.sessionVolume(s); if (s.sets.some((x) => x.done)) out[s.date] = (out[s.date] || 0) + Math.max(1, v); });
    return out;
  }

  // ---------- anilhas e aquecimento ----------
  const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  // Anilhas por lado para chegar no total, com a barra informada.
  function plates(total, bar) {
    bar = bar == null ? 20 : bar;
    let side = (total - bar) / 2;
    if (side <= 0) return { side: [], resto: 0, bar };
    const out = [];
    PLATES.forEach((p) => { while (side >= p - 1e-9) { out.push(p); side -= p; } });
    return { side: out, resto: Math.round(side * 2 * 100) / 100, bar };
  }
  const r25 = (v) => Math.max(0, Math.round(v / 2.5) * 2.5);
  // Séries de aquecimento sugeridas para a carga de trabalho.
  function warmup(kg, equip, bar) {
    const isBar = /barra/i.test(equip || '');
    bar = bar == null ? 20 : bar;
    if (!kg || kg <= (isBar ? bar : 5)) return [];
    const steps = kg >= 60 ? [[0.4, 8], [0.6, 5], [0.8, 3]] : [[0.5, 10], [0.75, 5]];
    const out = [];
    if (isBar) out.push({ kg: bar, reps: 10 });
    steps.forEach(([p, r]) => {
      const k = r25(kg * p);
      if (k >= (out.length ? out[out.length - 1].kg + 5 : 0) && k <= kg - 5) out.push({ kg: k, reps: r });
    });
    return out;
  }

  window.Analytics = { REGIONS, musclesOf, setsByRegion, volumeStatus, recovery, bestOf, newRecord, allRecords, recordCount, MEDALS, earned, newMedals, calendar, plates, warmup, REPS };
})();
