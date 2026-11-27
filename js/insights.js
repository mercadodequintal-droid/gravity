// Painel v2 (aprovado em 27/11, item 29): dados que o app manda para o painel do dono, calculados no celular.
// - train(): uso e treino (vai em stats/{uid} se "Compartilhar dados de treino" estiver ligado).
// - health(): saúde, corpo e pagamento (vai em health/{uid} só se a pessoa ligar "Compartilhar dados de saúde").
// Nunca vão: fotos, observações e textos escritos pela pessoa (desculpas próprias, notas).
// Os cruzamentos são feitos no painel, juntando estes resumos de todas as contas.
(function () {
  'use strict';
  const S = () => Store.state, D = 864e5;
  const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
  const r1 = (v) => Math.round(v * 10) / 10;
  const work = (x) => x.done && !x.sub && !x.warm;
  const doneSessions = () => S().sessions.filter((x) => !x.demo && x.sets.some((y) => y.done)).sort((a, b) => a.start - b.start);
  const exName = (id) => safe(() => Store.exercise(id).nome, id);
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n || 5);

  // Contadores que o app passou a guardar na v0.55 (cancelados, séries +/−, trocas, pulos, ressuscitados).
  function count(k, exId, n) {
    const s = S(); s.counters = s.counters || {};
    s.counters[k] = (s.counters[k] || 0) + (n || 1);
    if (exId) { const m = (s.counters[k + 'Ex'] = s.counters[k + 'Ex'] || {}); m[exId] = (m[exId] || 0) + 1; }
  }

  function train() {
    const s = S(), st = s.settings, ss = doneSessions(), now = Date.now();
    const c = s.counters || {};
    // semanas (12), dias da semana, horas
    const weeks = Store.weeksBack(12).map((w) => ss.filter((x) => x.date >= w.startISO && x.date <= w.endISO).length);
    const dow = [0, 0, 0, 0, 0, 0, 0], hours = new Array(24).fill(0);
    ss.slice(-150).forEach((x) => { dow[new Date(x.start).getDay()]++; hours[new Date(x.start).getHours()]++; });
    const fin = ss.filter((x) => x.end);
    const avgMin = fin.length ? Math.round(fin.reduce((a, x) => a + Store.sessionDuration(x), 0) / fin.length) : 0;
    const setsOf = (x) => x.sets.filter(work).length;
    const avgSets = ss.length ? r1(ss.reduce((a, x) => a + setsOf(x), 0) / ss.length) : 0;
    const avgVol = ss.length ? Math.round(ss.reduce((a, x) => a + Store.sessionVolume(x), 0) / ss.length) : 0;
    // exercícios mais feitos (sessões)
    const exc = {}; ss.forEach((x) => [...new Set(x.sets.filter(work).map((y) => y.exId))].forEach((id) => { exc[id] = (exc[id] || 0) + 1; }));
    // esforço (RIR): parte das séries com resposta que foram "no limite" (0–1 rep sobrando)
    const rirs = []; ss.slice(-40).forEach((x) => x.sets.forEach((y) => { if (work(y) && y.rir != null) rirs.push(y.rir); }));
    const limit = rirs.length ? r1(rirs.filter((v) => v <= 1).length / rirs.length * 100) : null;
    // progressão de carga em 4 semanas nos 3 exercícios mais feitos no período
    const from = Store.iso(Store.addDays(Store.today(), -28)), mid = Store.iso(Store.addDays(Store.today(), -14));
    const recent = ss.filter((x) => x.date >= from), rc = {};
    recent.forEach((x) => x.sets.filter(work).forEach((y) => { rc[y.exId] = (rc[y.exId] || 0) + 1; }));
    const prog = top(rc, 3).map(([id]) => {
      const kg = (a, b) => Math.max(0, ...recent.filter((x) => x.date >= a && x.date < b).flatMap((x) => x.sets.filter((y) => work(y) && y.exId === id).map((y) => Number(y.kg) || 0)));
      const a = kg(from, mid), b = kg(mid, '9999');
      return a > 0 && b > 0 ? (b - a) / a * 100 : null;
    }).filter((v) => v != null);
    const progression = prog.length ? r1(prog.reduce((a, b) => a + b, 0) / prog.length) : null;
    // recordes
    let lastRec = null;
    for (let i = ss.length - 1; i >= 0 && !lastRec; i--) { const r = safe(() => Store.sessionRecords(ss[i]), []); if (r.length) lastRec = { ex: exName(r[0].exId), kg: r[0].kg, date: ss[i].date }; }
    const str = safe(() => Analytics.strength(), {});
    const lifts = (str.lifts || []).filter((l) => l.e1rm).map((l) => ({ nome: l.nome || l.id, e1rm: Math.round(l.e1rm) }));
    const sk = safe(() => Store.weekStreak(), { cur: 0, best: 0 });
    const medals = safe(() => Analytics.earned().size, 0), medalsTotal = safe(() => Analytics.MEDALS.length, 0);
    // plano
    const p = Store.activePlan(), wk = p ? Store.planWeek(p) : null;
    const days = p ? new Set(p.workouts.flatMap((w) => w.days || [])).size : 0;
    // Extrato de desculpas (só categorias; texto escrito pela pessoa vira "Outra")
    const ex = s.excuse || { list: {} }, why = {}, byDow = {};
    Object.entries(ex.list || {}).forEach(([d, r]) => {
      if (!r || r.t !== 'exc') return;
      const k = r.c ? 'outra' : r.r || 'skip'; why[k] = (why[k] || 0) + 1;
      const w = new Date(d + 'T12:00:00').getDay(); byDow[w] = byDow[w] || {}; byDow[w][k] = (byDow[w][k] || 0) + 1;
    });
    const now0 = new Date(), mth = safe(() => Excuse.month(now0.getFullYear(), now0.getMonth()), null);
    const nec = safe(() => Necro.status(), null) || [];
    const weak = safe(() => Weak.analyze().slice(0, 3).map((w) => w.titulo), []);
    const hb = (h) => (h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite');
    const bucket = { manha: 0, tarde: 0, noite: 0 }; hours.forEach((n, h) => { bucket[hb(h)] += n; });
    return {
      v: 2, weeks, dow, hours, avgMin, avgSets, avgVol,
      streak: sk.cur, streakBest: sk.best, level: 1 + Math.floor(ss.length / 10), medals, medalsTotal,
      records: safe(() => Analytics.recordCount(), 0), lastRecord: lastRec,
      power: str.power != null ? str.power : null, strength: str.level || null, lifts,
      topEx: top(exc, 8).map(([id, n]) => [exName(id), n]),
      counters: { cancel: c.cancel || 0, setAdd: c.setAdd || 0, setDel: c.setDel || 0, swap: c.swap || 0, skip: c.skip || 0, revived: c.revived || 0 },
      topSwap: top(c.swapEx || {}, 5).map(([id, n]) => [exName(id), n]), topSkip: top(c.skipEx || {}, 5).map(([id, n]) => [exName(id), n]),
      effortLimit: limit, effortN: rirs.length, progression,
      planGoal: p ? p.goal || '' : '', planDays: days, planWorkouts: p ? p.workouts.length : 0, planStart: p ? p.startDate : null,
      sport: p && p.objetivo && p.objetivo.sport ? p.objetivo.sport : '',
      excuses: { why, byDow, faltas: Object.values(why).reduce((a, b) => a + b, 0), presence: mth && mth.total ? mth.pres : null },
      necro: { dead: nec.filter((x) => x.st === 'morto').length, grave: nec.filter((x) => x.st === 'atrof').length, weak: nec.filter((x) => x.st === 'fraco').length, revived: c.revived || 0 },
      weakPoints: weak,
      settings: { theme: st.theme || 'dourado', voice: safe(() => Voice.cfg().on, false), reminder: st.reminder ? st.reminderTime : '', splash: st.splash !== false, checkin: st.checkin !== false, askRir: st.askRir !== false, rangeMode: st.rangeMode || 'ask', weekStart: st.weekStart, rest: st.restDefault, inc: st.incKg, bar: st.bar, extrato: st.excAsk !== false, necro: st.necro !== false, askSets: st.askSets !== false, backupPhotos: !!st.backupPhotos },
      featuresX: {
        extrato: Object.keys(ex.list || {}).length > 0, necroAba: false, fotos: safe(() => Store.photos().length, 0),
        excluirSerie: (c.setDel || 0) > 0, adicionarSerie: (c.setAdd || 0) > 0, trocar: (c.swap || 0) > 0, pular: (c.skip || 0) > 0,
        testes: (s.tests || []).length, esporte: !!(p && p.objetivo && p.objetivo.sport), pagamentoInformado: !!(ex.pay),
      },
      hourBucket: Object.entries(bucket).sort((a, b) => b[1] - a[1])[0][1] ? Object.entries(bucket).sort((a, b) => b[1] - a[1])[0][0] : '',
      shareHealth: !!st.shareHealth, sinceFirst: ss.length ? Math.round((now - ss[0].start) / D) : 0,
    };
  }

  function health() {
    const s = S(), b = s.body || { entries: [] }, now = Date.now();
    const E = b.entries.slice().sort((x, y) => (x.date < y.date ? -1 : 1));
    const weight = E.filter((e) => e.peso != null).slice(-20).map((e) => [e.date, e.peso]);
    const meas = {};
    (Store.MEASURES || []).forEach(([k]) => { if (k === 'peso') return; const l = E.filter((e) => e[k] != null); if (l.length) meas[k] = [l[0][k], l[l.length - 1][k], l[0].date, l[l.length - 1].date]; });
    const since = Store.iso(Store.addDays(Store.today(), -90));
    const pains = {}; (s.pain || []).filter((p) => p.date >= since).forEach((p) => { const k = (p.where || 'Outro') + ' · ' + (p.exId ? exName(p.exId) : '—'); pains[k] = (pains[k] || 0) + 1; });
    const rehab = {}; Object.entries((s.rehab || {}).regions || {}).forEach(([r, v]) => { const sc = v.scores || []; rehab[r] = { phase: v.phase || 1, mode: v.mode, start: v.start, first: sc.length ? sc[0].v : null, last: sc.length ? sc[sc.length - 1].v : null }; });
    const ss = doneSessions().filter((x) => x.checkin);
    const avg = (k) => (ss.length ? r1(ss.reduce((a, x) => a + (Number(x.checkin[k]) || 0), 0) / ss.length) : null);
    const recs = (x) => safe(() => Store.sessionRecords(x).length, 0);
    const good = ss.filter((x) => x.checkin.sono === 2), bad = ss.filter((x) => x.checkin.sono === 0);
    const ex = s.excuse || {}, pay = ex.pay || null;
    const mth = safe(() => { const n = new Date(); return Excuse.month(n.getFullYear(), n.getMonth()); }, null);
    return {
      v: 2, updatedAt: now, weight, goal: b.goal || null, goalDate: b.goalDate || null, meas,
      pains: top(pains, 10), painTotal: Object.values(pains).reduce((a, x) => a + x, 0), rehab,
      checkin: { n: ss.length, sono: avg('sono'), energia: avg('energia'), dor: avg('dor'), badDays: ss.filter((x) => x.checkin.adj).length,
        good: [good.length, good.reduce((a, x) => a + recs(x), 0)], bad: [bad.length, bad.reduce((a, x) => a + recs(x), 0)] },
      pay: pay ? { v: pay.v, kind: pay.kind, cpt: mth && mth.feitos ? Math.round(pay.v / mth.feitos * 100) / 100 : null } : ex.noPay ? { none: true } : null,
    };
  }

  // Pedido de consentimento (uma vez, para quem tem conta). Saúde vem desligada.
  function consentSheet(done) {
    const st = S().settings;
    let train = st.shareTrain !== false, hl = !!st.shareHealth;
    UI.sheet({
      render: () => `<h3>Ajude a melhorar o Gravity</h3><div class="desc">Para entender o que funciona, o responsável pelo app pode ver os seus dados, ligados à sua conta. Escolha o que compartilhar:</div>
        <div class="switch-row" data-a="t"><div class="grow"><div>Compartilhar dados de treino</div><div class="small muted">Treinos, exercícios, recordes, funções que você usa, horários</div></div><div class="switch ${train ? 'on' : ''}"></div></div>
        <div class="switch-row" data-a="h"><div class="grow"><div>Compartilhar dados de saúde</div><div class="small muted">Peso, medidas e meta · dores e fisioterapia · sono e energia do check-in · quanto paga para treinar</div></div><div class="switch ${hl ? 'on' : ''}"></div></div>
        <div class="small muted" style="margin:10px 2px 0">Fotos e textos que você escreve nunca são enviados. Dá para mudar quando quiser em Configurações › Seus dados; ao desligar a saúde, o que já foi enviado é apagado.</div>
        <div class="fs-btns"><button class="btn ghost" data-a="pol">Ler política</button><button class="btn lime" data-a="ok">Salvar escolha</button></div>`,
      actions: {
        t: () => { train = !train; UI.sheetRefresh(); },
        h: () => { hl = !hl; UI.sheetRefresh(); },
        pol: () => { UI.closeSheet(); setTimeout(() => { try { UI.push(Screens.LegalDoc('privacidade')); } catch (e) { UI.toast('Abra em Configurações › App › Informações'); } }, 300); },
        ok: () => { setShare(train, hl); st.consentAt = Date.now(); Store.save(); UI.closeSheet(); UI.toast('Escolha salva'); done && done(); },
      },
    });
  }
  function setShare(train, hl) {
    const st = S().settings, wasH = !!st.shareHealth, wasT = st.shareTrain !== false;
    st.shareTrain = !!train; st.shareHealth = !!hl; Store.save();
    if (window.Cloud && Cloud.consentChanged && (wasH !== !!hl || wasT !== !!train)) Cloud.consentChanged();
  }
  // Mostra o pedido uma vez para quem tem conta (chamado na tela inicial).
  function maybeAsk() {
    const st = S().settings;
    if (st.consentAt || !window.Cloud || !Cloud.state().uid) return;
    setTimeout(() => { if (!document.querySelector('.sheet-wrap.open')) consentSheet(); }, 1200);
  }

  window.Insights = { train, health, count, consentSheet, setShare, maybeAsk };
})();
