// Telas de gestão: biblioteca, ficha do exercício, planos, editores, progresso e configurações.
(function () {
  'use strict';
  const { icon, esc, nf, kg, restLabel, volume, shortDate, imgHTML, thumb, Native, toast, push, pop, refresh, sheet, closeSheet, sheetRefresh, confirmSheet, numberSheet } = UI;
  const S = () => Store.state;
  const topbar = (title, right, noBack) => `<div class="topbar">${noBack ? '' : `<button class="icon-btn" data-a="back">${icon('back')}</button>`}<h1>${title}</h1>${right || ''}</div>`;

  // Lê um arquivo escolhido pelo usuário (CSV, backup ou foto).
  function pickFile(accept, asDataURL, cb) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.style.display = 'none';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => cb(r.result, f);
      r.onerror = () => toast('Não foi possível ler o arquivo');
      asDataURL ? r.readAsDataURL(f) : r.readAsText(f, 'utf-8');
      inp.remove();
    };
    document.body.appendChild(inp); inp.click();
  }
  // Reduz a foto para caber no armazenamento local.
  function shrinkImage(dataURL, cb) {
    const img = new Image();
    img.onload = () => {
      const m = 520, sc = Math.min(1, m / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => toast('Imagem inválida');
    img.src = dataURL;
  }

  // ---------- gráficos SVG ----------
  let gid = 0;
  function barChart(data, opts) {
    const W = 340, H = opts.h || 150, pl = 28, pb = 22, pt = 10;
    const max = Math.max(1, ...data.map((d) => Math.max(d.a || 0, d.b || 0)));
    const step = (W - pl) / data.length, bw = Math.min(22, step * 0.55);
    const y = (v) => pt + (H - pt - pb) * (1 - v / max);
    const ticks = [0, max / 2, max];
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}">`;
    ticks.forEach((t) => { s += `<line class="grid" x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${opts.fmt ? opts.fmt(t) : nf(t, 0)}</text>`; });
    data.forEach((d, i) => {
      const x = pl + step * i + (step - bw) / 2;
      if (d.b != null) s += `<rect x="${x}" y="${y(d.b)}" width="${bw}" height="${Math.max(0, H - pb - y(d.b))}" rx="5" fill="rgba(var(--fg-rgb),.1)"/>`;
      if (d.a) s += `<rect x="${x}" y="${y(d.a)}" width="${bw}" height="${Math.max(2, H - pb - y(d.a))}" rx="5" fill="${opts.color || 'var(--blue)'}"/>`;
      if (data.length <= 12 || i % Math.ceil(data.length / 8) === 0) s += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${d.label}</text>`;
    });
    return s + '</svg>';
  }
  function lineChart(pts, opts) {
    const W = 340, H = opts.h || 160, pl = 30, pb = 22, pt = 14, pr = 10;
    if (pts.length < 2) return '<div class="small muted" style="padding:20px 0;text-align:center">Faça este exercício mais vezes para ver a evolução.</div>';
    const vs = pts.map((p) => p.v), min = Math.min(...vs), max = Math.max(...vs);
    const lo = Math.max(0, min - (max - min || max * 0.1 || 1) * 0.3), hi = max + (max - min || max * 0.1 || 1) * 0.2;
    const x = (i) => pl + (W - pl - pr) * (i / (pts.length - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo || 1));
    const id = 'g' + ++gid;
    const line = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join('');
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${opts.color}" stop-opacity=".35"/><stop offset="1" stop-color="${opts.color}" stop-opacity="0"/></linearGradient></defs>`;
    [lo, (lo + hi) / 2, hi].forEach((t) => { s += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${nf(t, 0)}</text>`; });
    s += `<path d="${line}L${x(pts.length - 1)} ${H - pb}L${x(0)} ${H - pb}Z" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${opts.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const best = Math.max(...vs);
    pts.forEach((p, i) => {
      const isBest = p.v === best && i === vs.lastIndexOf(best);
      s += `<circle cx="${x(i)}" cy="${y(p.v)}" r="${isBest ? 5.5 : 3}" fill="${isBest ? 'var(--gold-2)' : opts.color}" stroke="${isBest ? 'var(--gold)' : 'var(--bg)'}" stroke-width="2"${isBest ? ' style="filter:drop-shadow(0 0 6px rgba(243, 212, 140,.9))"' : ''}/>`;
      if (pts.length <= 8 || i === 0 || i === pts.length - 1) s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${p.label}</text>`;
    });
    return s + '</svg>';
  }

  // ====================== BIBLIOTECA ======================
  function Library(opts) {
    opts = opts || {};
    let q = '', group = 'Todos';
    const picked = new Set();
    const def = {
      hideNav: !!opts.pick,
      render() {
        def.footer = !!opts.pick;
        const groups = ['Todos'].concat(Store.GROUPS.filter((g) => Store.allExercises().some((e) => e.grupo === g)));
        const right = `<button class="icon-btn" data-a="new">${icon('plus')}</button>`;
        return topbar(opts.pick ? 'Adicionar exercícios' : 'Exercícios', right, !opts.pick) +
          `<div class="content"><div class="search">${icon('search', 'sm')}<input type="search" placeholder="Buscar exercício" value="${esc(q)}" data-in="q"></div>
          <div class="filters">${groups.map((g) => `<button class="filter ${g === group ? 'on' : ''}" data-a="group" data-g="${g}">${g}</button>`).join('')}</div>
          <div class="ex-grid" style="margin-top:14px" data-grid>${gridHTML()}</div></div>` +
          (opts.pick ? `<div class="footer"><button class="btn ghost" style="flex:0 0 auto" data-a="back">Cancelar</button><button class="btn lime" data-a="done">Adicionar${picked.size ? ' (' + picked.size + ')' : ''}</button></div>` : '');
      },
      actions: {
        back: pop,
        q: (ds, el) => { q = el.value; def.el.querySelector('[data-grid]').innerHTML = gridHTML(); },
        group: (ds) => { group = ds.g; def.el.querySelectorAll('.filter').forEach((b) => b.classList.toggle('on', b.dataset.g === group)); def.el.querySelector('[data-grid]').innerHTML = gridHTML(); },
        ex: (ds, el) => {
          if (opts.pick) {
            picked.has(ds.id) ? picked.delete(ds.id) : picked.add(ds.id);
            el.classList.toggle('sel', picked.has(ds.id)); Native.vibrate(8);
            def.el.querySelector('[data-a="done"]').textContent = 'Adicionar' + (picked.size ? ' (' + picked.size + ')' : '');
          } else push(ExerciseDetail(ds.id));
        },
        new: () => push(ExerciseForm(null, (ex) => { if (opts.pick) picked.add(ex.id); })),
        done: () => { if (!picked.size) { toast('Selecione ao menos um exercício'); return; } opts.pick([...picked]); pop(); },
      },
    };
    function gridHTML() {
      // Busca por palavras (em qualquer ordem), sem acento, incluindo os nomes usados na academia.
      const n = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/puley/g, 'pulley').replace(/cros+ ?over/g, 'crossover').replace(/scot\b/g, 'scott');
      const words = n(q || '').split(/\s+/).filter(Boolean);
      const list = Store.allExercises().filter((e) => {
        if (group !== 'Todos' && e.grupo !== group) return false;
        const hay = n(e.nome + ' ' + e.grupo + ' ' + (e.equip || '') + ' ' + (e.alias || ''));
        return words.every((w) => hay.includes(w));
      });
      if (!list.length) return `<div class="empty" style="grid-column:1/-1">Nenhum exercício encontrado.<br><button class="btn ghost sm" style="margin-top:12px" data-a="new">Criar “${esc(q || 'novo')}”</button></div>`;
      return list.map((e) => `<div class="card ex-card press ${picked.has(e.id) ? 'sel' : ''}" data-a="ex" data-id="${e.id}"><span class="selmark">${icon('check', 'sm')}</span>${imgHTML(e, '', false)}<div class="t"><h4>${esc(e.nome)}</h4><div class="g">${esc(e.grupo)}${e.equip ? ' · ' + esc(e.equip) : ''}</div></div></div>`).join('');
    }
    return def;
  }

  // ====================== FICHA DO EXERCÍCIO ======================
  function ExerciseDetail(exId) {
    let metric = 'maxKg';
    const def = {
      hideNav: true,
      render() {
        const ex = Store.exercise(exId);
        const hist = Store.exerciseHistory(exId);
        const best = hist.length ? Math.max(...hist.map((h) => h.maxKg)) : 0;
        const best1 = hist.length ? Math.max(...hist.map((h) => h.e1rm)) : 0;
        const last = hist[hist.length - 1];
        const pts = hist.slice(-12).map((h) => ({ label: shortDate(h.date), v: h[metric] }));
        return `<div class="topbar" style="position:absolute;left:0;right:0;z-index:3"><button class="icon-btn" data-a="back">${icon('back')}</button><div class="grow"></div>${ex.custom ? `<button class="icon-btn" data-a="edit">${icon('edit', 'sm')}</button>` : ''}</div>
          <div class="content" style="padding-top:0"><div class="detail-hero">${imgHTML(ex, 'slow', true)}<div class="fade"></div></div>
          <div class="detail-title">${esc(ex.nome)}</div>
          <div class="chip-row" style="margin-top:0"><span class="chip blue">${esc(ex.grupo)}</span>${ex.equip ? `<span class="chip">${esc(ex.equip)}</span>` : ''}</div>
          ${ex.musculos && ex.musculos.length ? `<div class="small muted" style="margin-top:12px"><b style="color:var(--text)">Músculos:</b> ${esc(ex.musculos.join(', '))}${ex.secundarios && ex.secundarios.length ? ' · <span class="faint">auxiliares: ' + esc(ex.secundarios.join(', ')) + '</span>' : ''}</div>` : ''}
          <button class="pin-note" style="margin-top:12px" data-a="pin">${icon('note', 'sm')}<span>${Tools.pinOf(exId) ? esc(Tools.pinOf(exId)) : 'Adicionar nota fixa (ajuste do banco, assento, pegada…)'}</span></button>
          <div class="btn-row" style="margin-top:16px"><button class="btn blue" data-a="video">${icon('video', 'sm')}Ver vídeo</button><button class="btn ghost" data-a="setVideo">${icon('edit', 'sm')}Link próprio</button></div>
          ${ex.dicas && ex.dicas.length ? `<div class="section-title"><h2>Como executar</h2></div><div class="card"><ol class="tips">${ex.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ol></div>` : ''}
          <div class="section-title"><h2>Sua evolução</h2></div>
          ${hist.length ? `<div class="tiles"><div class="card tile"><div class="v num pr">${nf(best)}<small>kg</small></div><div class="l">Recorde</div></div><div class="card tile"><div class="v num">${nf(best1, 0)}<small>kg</small></div><div class="l">1RM estimado</div></div><div class="card tile"><div class="v num">${hist.length}</div><div class="l">Sessões</div></div></div>
          <div class="card" style="margin-top:12px"><div class="seg" style="margin-bottom:12px"><button class="${metric === 'maxKg' ? 'on' : ''}" data-a="metric" data-m="maxKg">Carga máx.</button><button class="${metric === 'e1rm' ? 'on' : ''}" data-a="metric" data-m="e1rm">1RM est.</button><button class="${metric === 'volume' ? 'on' : ''}" data-a="metric" data-m="volume">Volume</button></div>${lineChart(pts, { color: 'var(--lime)' })}</div>
          <div class="card" style="margin-top:12px"><div class="caps" style="margin-bottom:8px">Recordes</div>${Screens.recordsTable(Analytics.bestOf(exId))}</div>
          <div class="card" style="margin-top:12px"><div class="small muted">Última vez · ${shortDate(last.date)}</div><div style="margin-top:6px;font-weight:600" class="num">${last.sets.map((x) => nf(x.kg) + ' kg × ' + x.reps).join('  ·  ')}</div></div>`
          : '<div class="card small muted">Você ainda não registrou este exercício. Os gráficos aparecem depois do primeiro treino.</div>'}
          ${ex.img && ex.img.length && !ex.custom ? '<div class="tiny faint" style="margin-top:18px">Imagens: Free Exercise DB (domínio público).</div>' : ''}</div>`;
      },
      actions: {
        back: pop,
        metric: (ds) => { metric = ds.m; refresh(); },
        pin: () => Tools.pinSheet(exId, refresh),
        video: () => Native.open(Store.videoUrl(Store.exercise(exId))),
        setVideo: () => {
          const meta = S().exMeta[exId] || {};
          sheet({
            render: () => `<h3>Link do vídeo</h3><div class="desc">Cole um link do YouTube (ou outro) para este exercício. Em branco, o app busca no YouTube.</div><input class="input" id="vurl" type="url" placeholder="https://youtube.com/…" value="${esc(meta.video || '')}"><div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
            actions: { no: closeSheet, ok: () => { const v = document.getElementById('vurl').value.trim(); S().exMeta[exId] = Object.assign(meta, { video: v }); Store.save(); closeSheet(); toast(v ? 'Link salvo' : 'Link removido'); } },
          });
        },
        edit: () => push(ExerciseForm(exId)),
      },
    };
    return def;
  }

  // ====================== NOVO / EDITAR EXERCÍCIO ======================
  function ExerciseForm(exId, onCreate) {
    const existing = exId && S().customExercises.find((e) => e.id === exId);
    const f = existing ? JSON.parse(JSON.stringify(existing)) : { nome: '', grupo: 'Peito', equip: '', dicas: [], img: [], musculos: [], secundarios: [], video: '' };
    const def = {
      hideNav: true, footer: true,
      render: () => topbar(existing ? 'Editar exercício' : 'Novo exercício') +
        `<div class="content"><div class="row" style="gap:12px">
          <div class="card" style="padding:0;flex:1;height:120px;overflow:hidden;display:grid;place-items:center" data-a="photo" data-k="0">${f.img[0] ? `<img src="${f.img[0]}" style="width:100%;height:100%;object-fit:cover">` : `<div class="muted small" style="text-align:center">${icon('camera')}<br>Foto início</div>`}</div>
          <div class="card" style="padding:0;flex:1;height:120px;overflow:hidden;display:grid;place-items:center" data-a="photo" data-k="1">${f.img[1] ? `<img src="${f.img[1]}" style="width:100%;height:100%;object-fit:cover">` : `<div class="muted small" style="text-align:center">${icon('camera')}<br>Foto fim</div>`}</div></div>
        <div class="field"><label>Nome</label><input class="input" data-in="f" data-k="nome" value="${esc(f.nome)}" placeholder="Ex.: Supino na máquina"></div>
        <div class="form-row"><div class="field"><label>Grupo muscular</label><select class="input" data-ch="f" data-k="grupo">${Store.GROUPS.map((g) => `<option ${g === f.grupo ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        <div class="field"><label>Equipamento</label><input class="input" data-in="f" data-k="equip" value="${esc(f.equip)}" placeholder="Máquina, halteres…"></div></div>
        <div class="field"><label>Dicas de execução (uma por linha)</label><textarea class="note-field" data-in="tips" style="min-height:110px">${esc(f.dicas.join('\n'))}</textarea></div>
        <div class="field"><label>Link de vídeo (opcional)</label><input class="input" type="url" data-in="f" data-k="video" value="${esc(f.video || '')}" placeholder="https://youtube.com/…"></div>
        ${existing ? '<button class="btn danger block" style="margin-top:20px" data-a="del">Excluir exercício</button>' : ''}</div>
        <div class="footer"><button class="btn lime" data-a="save">Salvar exercício</button></div>`,
      actions: {
        back: pop,
        f: (ds, el) => { f[ds.k] = el.value; },
        tips: (ds, el) => { f.dicas = el.value.split('\n').map((s) => s.trim()).filter(Boolean); },
        photo: (ds) => pickFile('image/*', true, (data) => shrinkImage(data, (small) => { f.img[Number(ds.k)] = small; if (!f.img[0]) f.img[0] = small; f.img = f.img.filter(Boolean); refresh(); })),
        save: () => {
          if (!f.nome.trim()) { toast('Dê um nome ao exercício'); return; }
          if (existing) Object.assign(existing, f);
          else { const ex = Object.assign({ id: Store.uid('c'), custom: true }, f); S().customExercises.push(ex); onCreate && onCreate(ex); }
          Store.save(); pop(); toast('Exercício salvo');
        },
        del: () => confirmSheet('Excluir exercício?', 'Ele sai da biblioteca. Treinos que usam este exercício vão mostrá-lo como removido.', 'Excluir', () => {
          S().customExercises = S().customExercises.filter((e) => e.id !== exId); Store.save(); UI.popTo(1);
        }, true),
      },
    };
    const base = JSON.stringify(f);
    const dirty = () => JSON.stringify(f) !== base;
    const ask = () => sheet({
      render: () => `<h3>Salvar o exercício?</h3><div class="desc">Você mudou algo nesta tela e ainda não salvou.</div>
        <button class="btn lime block" data-a="s">Salvar</button><button class="btn ghost block" style="margin-top:8px" data-a="d">Descartar alterações</button><button class="btn ghost block" style="margin-top:8px" data-a="c">Continuar editando</button>`,
      actions: { s: () => { closeSheet(); def.actions.save(); }, d: () => { closeSheet(); pop(); }, c: closeSheet },
    });
    def.actions.back = () => { if (dirty()) ask(); else pop(); };
    def.guardBack = () => { if (!dirty()) return false; ask(); return true; };
    return def;
  }

  // ====================== PLANOS ======================
  function Plans() {
    return {
      render() {
        const act = Store.activePlan();
        const others = S().plans.filter((p) => p !== act);
        const planCard = (p, active) => {
          const wk = Store.planWeek(p);
          return `<div class="card press appear ${active ? 'hero' : ''}" data-a="edit" data-id="${p.id}"><div class="row"><div class="grow">
            ${active ? '<span class="chip done" style="margin-bottom:8px"><span class="dot"></span>Plano ativo</span>' : ''}
            <div style="font-size:18px;font-weight:700">${esc(p.name)}</div><div class="small muted">${esc(p.goal || '')}${p.goal ? ' · ' : ''}${p.workouts.length} treinos · ${p.weeks} semanas</div></div>${icon('next')}</div>
            ${active ? `<div class="bar"><i style="width:${Math.min(100, Math.max(0, (wk.n - 1) / wk.total) * 100)}%"></i></div><div class="tiny muted" style="margin-top:6px">${wk.n >= 1 && wk.n <= wk.total ? 'Semana ' + wk.n + ' de ' + wk.total : wk.n > wk.total ? 'Duração concluída — repita ou troque de plano' : 'Começa em breve'}</div>` : ''}
            <div class="chip-row">${p.workouts.map((w) => `<span class="chip">${esc(w.letter)} · ${esc(w.name)}</span>`).join('')}</div>
            ${!active ? `<button class="btn ghost sm" style="margin-top:12px" data-a="activate" data-id="${p.id}">Usar este plano</button>` : ''}</div>`;
        };
        return `<div class="hello"><div class="t"><h1>Planos<span>de treino</span></h1></div><button class="icon-btn" data-a="new">${icon('plus')}</button></div>
          <div class="content"><button class="card tech-banner goal-banner press" style="margin:0 0 12px" data-a="goal"><span class="tb-ic">${icon('target', 'sm')}</span><span class="grow"><b>Montar por objetivo</b><small>Hipertrofia, força, salto, sprint, corrida, soco, prevenção, emagrecimento, saúde ou TAF</small></span>${icon('next', 'sm')}</button>
          ${act ? planCard(act, true) : ''}
          <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="new">${icon('plus', 'sm')}Novo plano</button><button class="btn ghost sm" data-a="import">${icon('upload', 'sm')}Importar planilha</button></div>
          ${others.length ? `<div class="section-title"><h2>Meus outros planos</h2></div><div class="list">${others.map((p) => planCard(p, false)).join('')}</div>` : ''}
          <button class="card tech-banner press" style="margin-top:12px;width:100%" data-a="guide"><span class="tb-ic">${icon('flame', 'sm')}</span><span class="grow"><b>Técnicas avançadas</b><small>Drop set, rest-pause, FST-7, bi-set, pirâmide e mais ${TECH.LIST.length - 5}: como fazer e como usar no app</small></span>${icon('next', 'sm')}</button>
          <div class="section-title"><h2>Modelos prontos</h2></div><div class="list">${Store.TEMPLATES.map((t) => `<div class="card wo press appear" data-a="tpl" data-k="${t.key}"><div class="letter">${t.workouts.length}</div><div class="grow"><h4>${esc(t.name)}</h4><div class="meta">${esc(t.goal)} · ${t.weeks} semanas</div></div>${icon('plus')}</div>`).join('')}</div>
          <div class="card small muted" style="margin-top:16px">${icon('info', 'sm')} Planilha: colunas <b>plano, semanas, treino, dia, exercicio, series, repeticoes, carga_kg, descanso_s, observacao</b> e, opcionais, <b>tecnica</b> e <b>grupo</b>. Salve como CSV no Excel ou Google Planilhas.</div></div>`;
      },
      actions: {
        edit: (ds, el, e) => { if (e.target.closest('[data-a="activate"]')) return; push(PlanEditor(ds.id)); },
        activate: (ds) => { S().activePlanId = ds.id; Store.save(); toast('Plano ativado'); refresh(); },
        guide: () => push(TechGuide()),
        goal: () => push(Screens.GoalWizard()),
        new: () => {
          const p = { id: Store.uid('p'), name: 'Meu plano', goal: '', weeks: 4, startDate: Store.iso(Store.weekStartOf(Store.today(), S().settings.weekStart)), workouts: [{ id: Store.uid('w'), letter: 'A', name: 'Treino A', days: [1], items: [] }] };
          S().plans.push(p); if (!Store.activePlan()) S().activePlanId = p.id; Store.save(); push(PlanEditor(p.id));
        },
        tpl: (ds) => {
          const t = Store.TEMPLATES.find((x) => x.key === ds.k);
          confirmSheet('Usar “' + t.name + '”?', 'Uma cópia editável é criada e vira o seu plano ativo. Seu histórico continua salvo.', 'Usar modelo', () => {
            const p = Store.planFromTemplate(t, S().settings.weekStart); S().plans.push(p); S().activePlanId = p.id; Store.save(); refresh(); toast('Plano criado e ativado');
          });
        },
        import: () => pickFile('.csv,text/csv,text/plain,text/comma-separated-values', false, (text) => {
          try {
            const r = Store.importPlanCSV(text);
            const p = r.plans[0];
            confirmSheet('Planilha importada', `${r.plans.length} plano(s), ${p.workouts.length} treino(s)${r.created ? ', ' + r.created + ' exercício(s) novo(s) criado(s) sem foto' : ''}. Ativar “${esc(p.name)}” agora?`, 'Ativar', () => { S().activePlanId = p.id; Store.save(); refresh(); });
            refresh();
          } catch (err) { toast(err.message || 'Planilha inválida'); }
        }),
      },
    };
  }

  // ====================== SEÇÕES DO PROGRESSO (deslizar entre elas) ======================
  // Músculos, Recordes, Corpo, Testes e Conquistas ganham uma barra de abas e trocam com o deslizar do dedo.
  // Antes de Músculos fica o Resumo (a própria tela de Progresso).
  const PSEC = [['Músculos', () => Screens.MuscleMap()], ['Recordes', () => Screens.Records()], ['Corpo', () => Screens.Body()], ['Testes', () => Screens.Tests()], ['Conquistas', () => Screens.Medals()]];
  function progSection(i) {
    const def = PSEC[i][1]();
    const render = def.render.bind(def), after = def.after;
    def.render = () => {
      const html = render();
      const tabs = [['Resumo']].concat(PSEC).map(([l], j) => `<button class="${j - 1 === i ? 'on' : ''}" data-a="ptab" data-i="${j - 1}">${l}</button>`).join('');
      const k = html.indexOf('<div class="content">');
      return k < 0 ? html : html.slice(0, k) + `<div class="ptabs">${tabs}</div>` + html.slice(k);
    };
    def.actions = Object.assign({}, def.actions, { ptab: (ds) => goSection(i, Number(ds.i)) });
    def.after = (el, re) => {
      if (after) after.call(def, el, re);
      const on = el.querySelector('.ptabs .on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
      if (!re) UI.onSwipe(el, (d) => goSection(i, i + d));
    };
    return def;
  }
  function goSection(from, to) {
    if (to === from || to >= PSEC.length) return;
    if (to < 0) { pop(); return; }
    Native.vibrate(8);
    UI.replace(progSection(to), to > from ? 1 : -1);
  }

  // ====================== EDITOR DE PLANO ======================
  function PlanEditor(pid) {
    const def = {
      hideNav: true,
      render() {
        const p = Store.plan(pid);
        if (!p) return topbar('Plano') + '<div class="content"></div>';
        const active = S().activePlanId === p.id;
        return topbar('Editar plano', `<button class="icon-btn" data-a="menu">${icon('share', 'sm')}</button>`) +
          `<div class="content"><div class="field" style="margin-top:0"><label>Nome do plano</label><input class="input" data-in="f" data-k="name" value="${esc(p.name)}"></div>
          <div class="field"><label>Objetivo</label><input class="input" data-in="f" data-k="goal" value="${esc(p.goal || '')}" placeholder="Ex.: Hipertrofia · 5 dias"></div>
          <div class="form-row"><div class="field"><label>Duração (semanas)</label><div class="stepper big"><button data-a="wk" data-d="-1">${icon('minus')}</button><div class="val"><b class="num">${p.weeks}</b></div><button data-a="wk" data-d="1">${icon('plus')}</button></div></div>
          <div class="field"><label>Início</label><input class="input" type="date" data-ch="date" value="${p.startDate}"></div></div>
          <div class="section-title"><h2>Treinos</h2><span class="small muted">${p.workouts.length}</span></div>
          <div class="list">${p.workouts.map((w, i) => `<div class="card wo press" data-a="w" data-id="${w.id}"><div class="letter">${esc(w.letter)}</div><div class="grow"><h4 class="ellipsis">${esc(w.name)}</h4><div class="meta">${Screens.daysText(w.days)} · ${w.items.length} exercícios</div></div>
            <div class="ord" style="display:flex;flex-direction:column"><button class="icon-btn" style="width:32px;height:28px;border-radius:9px" data-a="mv" data-i="${i}" data-d="-1">${icon('up', 'sm')}</button><button class="icon-btn" style="width:32px;height:28px;border-radius:9px;margin-top:4px" data-a="mv" data-i="${i}" data-d="1">${icon('down', 'sm')}</button></div></div>`).join('')}</div>
          <button class="add-set" style="margin-top:12px;height:52px" data-a="addW">${icon('plus', 'sm')}Adicionar treino</button>
          <div class="divider" style="margin-top:22px"></div>
          ${!active ? `<button class="btn lime block" data-a="activate">Usar este plano</button>` : '<div class="small muted" style="text-align:center;margin-bottom:6px">Este é o seu plano ativo.</div>'}
          <div class="btn-row" style="margin-top:10px"><button class="btn ghost sm" data-a="dup">${icon('copy', 'sm')}Duplicar</button><button class="btn danger sm" data-a="del">${icon('trash', 'sm')}Excluir</button></div></div>`;
      },
      actions: {
        back: pop,
        f: (ds, el) => { Store.plan(pid)[ds.k] = el.value; Store.save(); },
        date: (ds, el) => { if (el.value) { Store.plan(pid).startDate = el.value; Store.save(); } },
        wk: (ds) => { const p = Store.plan(pid); p.weeks = Math.max(1, Math.min(52, p.weeks + Number(ds.d))); Store.save(); refresh(); },
        w: (ds, el, e) => { if (e.target.closest('[data-a="mv"]')) return; push(WorkoutEditor(pid, ds.id)); },
        mv: (ds) => { const p = Store.plan(pid), i = Number(ds.i), j = i + Number(ds.d); if (j < 0 || j >= p.workouts.length) return; [p.workouts[i], p.workouts[j]] = [p.workouts[j], p.workouts[i]]; Store.save(); refresh(); },
        addW: () => {
          const p = Store.plan(pid);
          const letter = String.fromCharCode(65 + p.workouts.length);
          const w = { id: Store.uid('w'), letter, name: 'Treino ' + letter, days: [], items: [] };
          p.workouts.push(w); Store.save(); push(WorkoutEditor(pid, w.id));
        },
        activate: () => { S().activePlanId = pid; Store.save(); toast('Plano ativado'); refresh(); },
        dup: () => {
          const p = JSON.parse(JSON.stringify(Store.plan(pid)));
          p.id = Store.uid('p'); p.name += ' (cópia)'; p.workouts.forEach((w) => { w.id = Store.uid('w'); w.items.forEach((it) => { it.id = Store.uid('i'); }); });
          S().plans.push(p); Store.save(); pop(); toast('Plano duplicado');
        },
        del: () => confirmSheet('Excluir plano?', 'Os treinos já registrados continuam no histórico, mas o plano some.', 'Excluir', () => {
          S().plans = S().plans.filter((p) => p.id !== pid);
          if (S().activePlanId === pid) S().activePlanId = S().plans[0] ? S().plans[0].id : null;
          Store.save(); pop();
        }, true),
        menu: () => {
          const p = Store.plan(pid);
          Native.share('Plano ' + p.name, Store.exportPlanCSV(p), p.name.replace(/[^\w\- ]+/g, '') + '.csv');
        },
      },
    };
    // Botão Salvar + pergunta ao sair. Compara os dados do plano e a ordem dos treinos.
    return UI.editable(def, {
      snap: () => { const p = Store.plan(pid); return p && { name: p.name, goal: p.goal, weeks: p.weeks, startDate: p.startDate, order: p.workouts.map((w) => w.id) }; },
      restore: (o) => {
        const p = Store.plan(pid); if (!p) return;
        Object.assign(p, { name: o.name, goal: o.goal, weeks: o.weeks, startDate: o.startDate });
        p.workouts = o.order.map((id) => p.workouts.find((w) => w.id === id)).filter(Boolean);
      },
    });
  }

  // ====================== EDITOR DE TREINO ======================
  function WorkoutEditor(pid, wid) {
    const W = () => Store.plan(pid).workouts.find((w) => w.id === wid);
    const def = {
      hideNav: true,
      render() {
        const w = W(); if (!w) return topbar('Treino') + '<div class="content"></div>';
        return topbar('Editar treino') +
          `<div class="content"><div class="form-row" style="grid-template-columns:90px 1fr"><div class="field" style="margin-top:0"><label>Letra</label><input class="input" style="text-align:center;font-weight:800;font-size:20px" maxlength="2" data-in="f" data-k="letter" value="${esc(w.letter)}"></div>
          <div class="field" style="margin-top:0"><label>Nome</label><input class="input" data-in="f" data-k="name" value="${esc(w.name)}" placeholder="Ex.: Peito e Tríceps"></div></div>
          <div class="field"><label>Dias da semana</label><div class="days-pick">${[0, 1, 2, 3, 4, 5, 6].map((d) => `<button class="${w.days.includes(d) ? 'on' : ''}" data-a="day" data-d="${d}">${Store.WEEKDAYS[d]}</button>`).join('')}</div></div>
          <div class="section-title"><h2>Exercícios</h2><span class="small muted">${w.items.length} · ~${Screens.estMinutes(w)} min</span></div>
          <div class="list">${w.items.map((it, i) => { const ex = Store.exercise(it.exId); const g = TECH.groupOf(w.items, i); return `${g && g.pos === 1 ? `<div class="group-label">${icon('repeat', 'sm')}${esc(g.tech.nome)} · ${g.size} exercícios sem descanso entre eles</div>` : ''}<div class="card edit-item press ${g ? 'grouped' : ''}" data-a="item" data-i="${i}">${thumb(ex)}<div class="grow"><h4 class="ellipsis">${esc(ex.nome)}</h4><div class="meta num">${ex.tipo === 'tempo' ? Tools.repsText(it, ex) : it.sets + ' × ' + esc(it.reps)}${Tools.loadText(it.kg, ex) ? ' · ' + Tools.loadText(it.kg, ex) : ''}${Store.isCardio(ex) ? ' · sem descanso' : ' · ' + restLabel(it.rest)}</div>${it.tech && TECH.get(it.tech.id) ? `<div class="chip-row" style="margin-top:6px"><span class="chip blue tchip">${icon('flame', 'sm')}${esc(TECH.chip(it))}</span></div>` : ''}</div>
            <div class="ord"><button data-a="mv" data-i="${i}" data-d="-1">${icon('up', 'sm')}</button><button data-a="mv" data-i="${i}" data-d="1">${icon('down', 'sm')}</button></div></div>`; }).join('') || '<div class="card small muted">Nenhum exercício ainda.</div>'}</div>
          <button class="btn blue block" style="margin-top:14px" data-a="add">${icon('plus', 'sm')}Adicionar exercícios</button>
          <button class="btn danger block sm" style="margin-top:24px" data-a="del">${icon('trash', 'sm')}Excluir treino</button></div>`;
      },
      actions: {
        back: pop,
        f: (ds, el) => { W()[ds.k] = ds.k === 'letter' ? el.value.toUpperCase() : el.value; Store.save(); },
        day: (ds) => { const w = W(), d = Number(ds.d); w.days = w.days.includes(d) ? w.days.filter((x) => x !== d) : w.days.concat(d).sort(); Store.save(); Native.vibrate(8); refresh(); },
        mv: (ds) => { const w = W(), i = Number(ds.i), j = i + Number(ds.d); if (j < 0 || j >= w.items.length) return; [w.items[i], w.items[j]] = [w.items[j], w.items[i]]; Store.save(); refresh(); },
        item: (ds, el, e) => { if (e.target.closest('[data-a="mv"]')) return; itemSheet(W(), Number(ds.i)); },
        add: () => push(Library({ pick: (ids) => {
          const w = W();
          ids.forEach((id) => {
            const ex = Store.exercise(id), cardio = Store.isCardio(ex);
            // Cardio: 1 × 20 min, sem descanso. Outros por tempo: 3 × 30 s.
            w.items.push({ id: Store.uid('i'), exId: id, sets: cardio ? 1 : 3, reps: cardio ? '1200' : ex.tipo === 'tempo' ? '30' : '10', kg: 0, rest: cardio ? 0 : S().settings.restDefault, note: '' });
          });
          Store.save(); toast(ids.length + ' exercício(s) adicionado(s)');
        } })),
        del: () => confirmSheet('Excluir treino?', 'O histórico de treinos já feitos continua salvo.', 'Excluir', () => {
          const p = Store.plan(pid); p.workouts = p.workouts.filter((w) => w.id !== wid); Store.save(); pop();
        }, true),
      },
    };
    // Botão Salvar + pergunta ao sair. Compara o treino inteiro (nome, dias, exercícios e ajustes).
    return UI.editable(def, {
      snap: () => W() || null,
      restore: (o) => { const p = Store.plan(pid); const k = p ? p.workouts.findIndex((w) => w.id === wid) : -1; if (k >= 0) p.workouts[k] = o; },
    });
  }

  // Folha para ajustar séries, repetições, carga, descanso e observação de um exercício do treino.
  function itemSheet(w, i) {
    const it = w.items[i], ex = Store.exercise(it.exId), cardio = Store.isCardio(ex);
    const step = (label, key, d, fmt) => `<div class="field"><label>${label}</label><div class="stepper big"><button data-a="st" data-k="${key}" data-d="${-d}">${icon('minus')}</button><div class="val" data-a="ed" data-k="${key}"><b class="num">${fmt ? fmt(it[key]) : nf(it[key])}</b></div><button data-a="st" data-k="${key}" data-d="${d}">${icon('plus')}</button></div></div>`;
    // Peso do corpo: só o corpo, com peso extra (lastro, kg positivo) ou com ajuda (graviton/elástico, kg negativo).
    const bwMode = () => (Number(it.kg) > 0 ? 'mais' : Number(it.kg) < 0 ? 'menos' : 'corpo');
    const bwHTML = () => {
      const bw = Store.bodyWeight();
      return `<div class="field"><label>Carga</label><div class="seg">${[['corpo', 'Só o corpo'], ['mais', '+ Peso extra'], ['menos', '− Ajuda']].map(([v, l]) => `<button class="${bwMode() === v ? 'on' : ''}" data-a="bw" data-v="${v}">${l}</button>`).join('')}</div>
        <div class="small muted" style="margin:6px 2px 0">${bwMode() === 'menos' ? 'Ajuda do graviton ou do elástico: o quanto ele tira do seu peso.' : bwMode() === 'mais' ? 'Lastro: cinto com anilha, colete ou halter entre as pernas.' : 'Só o peso do corpo.'} ${bw ? `Conta como <b>${nf(Math.max(0, bw + (Number(it.kg) || 0)))} kg</b> no volume e nos recordes (seu peso: ${nf(bw)} kg).` : 'Registre seu peso em Progresso → Corpo para ele contar no volume.'}</div></div>`;
    };
    const bwStep = () => `<div class="field"><label>${bwMode() === 'menos' ? 'Ajuda (kg)' : 'Peso extra (kg)'}</label><div class="stepper big"><button data-a="bwst" data-d="-1">${icon('minus')}</button><div class="val" data-a="bwed"><b class="num">${nf(Math.abs(Number(it.kg) || 0))}</b></div><button data-a="bwst" data-d="1">${icon('plus')}</button></div></div>`;
    // Parâmetros ajustáveis de cada técnica
    const PL = { qtd: ['Quantas vezes', 1, 1], pct: ['Redução de carga (%)', 5, 0], pausa: ['Pausa (s)', 5, 3], reps: ['Repetições', 1, 1], seg: ['Segundos', 1, 1], extra: ['Repetições a mais', 1, 0] };
    const techHTML = () => {
      const g = TECH.groupOf(w.items, i);
      const t = it.tech && TECH.get(it.tech.id);
      const p = TECH.params(it.tech);
      let h = `<div class="field"><label>Técnica avançada</label><button class="tech-banner" style="margin-top:0" data-a="pick"><span class="tb-ic">${icon(t ? 'flame' : 'plus', 'sm')}</span><span class="grow"><b>${t ? esc(t.nome) : 'Nenhuma'}</b><small>${t ? esc(t.cue(p)) : 'Drop set, rest-pause, FST-7, pirâmide…'}</small></span>${icon('next', 'sm')}</button></div>`;
      if (t) {
        const keys = Object.keys(t.params).filter((k) => PL[k] && !(k === 'pct' && t.id !== 'drop' && t.id !== 'backoff'));
        if (keys.length) h += `<div class="form-row">${keys.map((k) => `<div class="field"><label>${PL[k][0]}</label><div class="stepper"><button data-a="tp" data-k="${k}" data-d="${-PL[k][1]}">${icon('minus', 'sm')}</button><div class="val"><b class="num">${p[k]}</b></div><button data-a="tp" data-k="${k}" data-d="${PL[k][1]}">${icon('plus', 'sm')}</button></div></div>`).join('')}</div>`;
        if ('todas' in t.params) h += `<div class="switch-row" data-a="todas" style="margin-top:8px"><div class="grow">Em todas as séries<div class="small muted">Desligado: só na última série</div></div><div class="switch ${p.todas ? 'on' : ''}"></div></div>`;
        if ('tempo' in t.params) h += `<div class="field"><label>Cadência (desce-pausa-sobe)</label><input class="input" data-in="tempo" value="${esc(p.tempo)}" placeholder="3-1-1"></div>`;
      }
      if (g) h += `<div class="small muted" style="margin-top:10px">${icon('repeat', 'sm')} Faz parte de um <b style="color:var(--gold)">${esc(g.tech.nome)}</b> (${g.pos} de ${g.size}). <button class="link" style="color:var(--gold);text-decoration:underline" data-a="ungroup">Desfazer grupo</button></div>`;
      return h;
    };
    sheet({
      render: () => `<div class="row" style="margin-bottom:6px">${thumb(ex)}<div class="grow"><h3 class="ellipsis">${esc(ex.nome)}</h3><div class="small muted">${esc(ex.grupo)}</div></div></div>
        ${cardio
          ? `<div class="form-row">${step('Séries', 'sets', 1)}<div class="field"><label>Tempo (minutos)</label><div class="stepper big"><button data-a="mins" data-d="-5">${icon('minus')}</button><div class="val" data-a="minsEd"><b class="num">${Tools.minText(Number(it.reps) || 1200)}</b></div><button data-a="mins" data-d="5">${icon('plus')}</button></div></div></div>
            <div class="small muted" style="margin:-2px 2px 4px">Cardio não tem descanso: o treino segue direto para o próximo exercício.</div>`
          : `<div class="form-row">${step('Séries', 'sets', 1)}<div class="field"><label>${ex.tipo === 'tempo' ? 'Tempo (segundos)' : 'Repetições'}</label><input class="input num" style="height:54px;text-align:center;font-size:19px;font-weight:700" data-in="reps" value="${esc(it.reps)}" placeholder="10 ou 8-12"></div></div>
        ${Store.isBodyweight(ex) ? bwHTML() : ''}<div class="form-row">${Store.isBodyweight(ex) ? (Number(it.kg) ? bwStep() : '') : step('Carga sugerida (kg)', 'kg', S().settings.incKg || 1)}${step('Descanso', 'rest', 15, restLabel)}</div>`}
        ${techHTML()}
        <div class="field"><label>Observação</label><input class="input" data-in="note" value="${esc(it.note || '')}" placeholder="Ex.: pegada fechada"></div>
        <div class="btn-row" style="margin-top:18px"><button class="btn danger" style="flex:0 0 56px;padding:0" data-a="rm">${icon('trash')}</button><button class="btn ghost" style="flex:0 0 auto" data-a="info">${icon('info', 'sm')}</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
      actions: {
        st: (ds) => { const min = ds.k === 'sets' ? 1 : ds.k === 'rest' ? 5 : 0; it[ds.k] = Math.max(min, Math.round((Number(it[ds.k]) + Number(ds.d)) * 100) / 100); Store.save(); Native.vibrate(6); sheetRefresh(); },
        ed: (ds) => numberSheet(ds.k === 'kg' ? 'Carga (kg)' : ds.k === 'rest' ? 'Descanso (segundos)' : 'Séries', it[ds.k], 1, (v) => { it[ds.k] = Math.max(0, v); Store.save(); refresh(); setTimeout(() => itemSheet(w, i), 380); }),
        reps: (ds, el) => { it.reps = el.value.trim() || '10'; Store.save(); },
        bw: (ds) => { const m = Math.abs(Number(it.kg) || 0) || 5; it.kg = ds.v === 'corpo' ? 0 : ds.v === 'mais' ? m : -m; Store.save(); Native.vibrate(6); sheetRefresh(); },
        bwst: (ds) => {
          const sign = Number(it.kg) < 0 ? -1 : 1, inc = S().settings.incKg || 1;
          const m = Math.max(inc, Math.round((Math.abs(Number(it.kg) || 0) + Number(ds.d) * inc) * 100) / 100);
          it.kg = sign * m; Store.save(); Native.vibrate(6); sheetRefresh();
        },
        bwed: () => { const sign = Number(it.kg) < 0 ? -1 : 1; numberSheet(sign < 0 ? 'Ajuda (kg)' : 'Peso extra (kg)', Math.abs(Number(it.kg) || 0), 0.5, (v) => { it.kg = sign * Math.max(0, v); Store.save(); refresh(); setTimeout(() => itemSheet(w, i), 380); }); },
        mins: (ds) => { it.reps = String(Math.max(60, Math.round((Number(it.reps) || 1200) / 60 + Number(ds.d)) * 60)); it.rest = 0; Store.save(); Native.vibrate(6); sheetRefresh(); },
        minsEd: () => numberSheet('Tempo (minutos)', Math.round((Number(it.reps) || 1200) / 60), 1, (v) => { it.reps = String(Math.max(1, Math.round(v)) * 60); it.rest = 0; Store.save(); refresh(); setTimeout(() => itemSheet(w, i), 380); }, 'min'),
        note: (ds, el) => { it.note = el.value; Store.save(); },
        pick: () => techPicker(w, i),
        tp: (ds) => { const p = TECH.params(it.tech); it.tech[ds.k] = Math.max(PL[ds.k][2], Number(p[ds.k]) + Number(ds.d)); Store.save(); Native.vibrate(6); sheetRefresh(); },
        todas: () => { const p = TECH.params(it.tech); it.tech.todas = !p.todas; Store.save(); sheetRefresh(); },
        tempo: (ds, el) => { it.tech.tempo = el.value.trim() || '3-1-1'; Store.save(); },
        ungroup: () => { const g = TECH.groupOf(w.items, i); for (let k = g.start; k <= g.end; k++) w.items[k].group = null; Store.save(); refresh(); sheetRefresh(); },
        info: () => { closeSheet(); push(ExerciseDetail(it.exId)); },
        rm: () => { w.items.splice(i, 1); Store.save(); closeSheet(); refresh(); },
        ok: () => { closeSheet(); refresh(); const t = UI.R.stack[UI.R.stack.length - 1]; if (t && t.commit) t.commit('✓ Exercício salvo'); else toast('✓ Exercício salvo'); },
      },
    });
  }

  // Escolha da técnica: por categoria, com resumo de cada uma.
  function techPicker(w, i) {
    const it = w.items[i];
    sheet({
      render: () => `<h3>Técnica avançada</h3><div class="desc">${esc(Store.exercise(it.exId).nome)} · toque para aplicar</div>
        ${TECH.CATS.map((c) => `<div class="section-title" style="margin-top:16px"><h2>${esc(c.nome)}</h2></div><div class="small muted" style="margin:-4px 2px 8px">${esc(c.desc)}</div>
          <div class="list">${TECH.LIST.filter((t) => t.cat === c.id).map((t) => {
            const on = (it.tech && it.tech.id === t.id) || (it.group && it.group.type === t.id && TECH.groupOf(w.items, i));
            return `<button class="card tech-opt press ${on ? 'on' : ''}" data-a="use" data-t="${t.id}"><b>${esc(t.nome)}</b>${t.mode === 'group' ? `<span class="chip blue" style="margin-left:6px;height:20px;font-size:10px">${t.size}${t.size === 4 ? '+' : ''} exercícios</span>` : ''}<small>${esc(t.resumo)}</small></button>`;
          }).join('')}</div>`).join('')}
        <div class="btn-row" style="margin-top:18px"><button class="btn ghost" data-a="none">Sem técnica</button><button class="btn ghost" data-a="guide">Ver guia</button></div>`,
      actions: {
        use: (ds) => {
          const t = TECH.get(ds.t);
          if (t.mode === 'group') {
            if (i + t.size > w.items.length) { toast(`${t.nome} precisa de ${t.size} exercícios a partir deste. Adicione ou reordene.`); return; }
            const gid = Store.uid('g');
            // tira os itens de grupos antigos que seriam quebrados
            for (let k = i; k < i + t.size; k++) { const old = TECH.groupOf(w.items, k); if (old) for (let m = old.start; m <= old.end; m++) w.items[m].group = null; }
            for (let k = i; k < i + t.size; k++) w.items[k].group = { id: gid, type: t.id };
            toast(`${t.nome}: ${t.size} exercícios agrupados`);
          } else {
            it.tech = { id: t.id };
            if (TECH.applyScheme(it, t.id)) toast('Séries, repetições e descanso ajustados para ' + t.nome);
          }
          Store.save(); closeSheet(); refresh(); setTimeout(() => itemSheet(w, i), 380);
        },
        none: () => { it.tech = null; Store.save(); closeSheet(); refresh(); setTimeout(() => itemSheet(w, i), 380); },
        guide: () => { closeSheet(); push(TechGuide()); },
      },
    });
  }

  // ====================== GUIA DE TÉCNICAS ======================
  function TechGuide() {
    const open = new Set();
    return {
      hideNav: true,
      render: () => topbar('Técnicas avançadas') + `<div class="content">
        <div class="small muted" style="margin:0 2px 6px">Toque numa técnica para ver como fazer. Para usar, abra um treino em <b>Editar treino</b>, toque no exercício e escolha a técnica.</div>
        ${TECH.CATS.map((c) => `<div class="section-title"><h2>${esc(c.nome)}</h2></div><div class="list">${TECH.LIST.filter((t) => t.cat === c.id).map((t) => `<div class="card press" data-a="tg" data-t="${t.id}">
          <div class="row"><div class="grow"><b style="font-weight:500">${esc(t.nome)}</b><div class="small muted" style="margin-top:2px">${esc(t.resumo)}</div></div>${icon(open.has(t.id) ? 'up' : 'down', 'sm')}</div>
          ${open.has(t.id) ? `<ol class="tips" style="margin-top:10px">${t.passos.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>`).join('')}</div>`).join('')}
        <div class="tiny faint" style="margin-top:18px">Estudos mostram que essas técnicas dão ganhos de massa parecidos com séries tradicionais de mesmo volume; a vantagem principal é economizar tempo e variar o estímulo. Use com moderação, de preferência no último exercício de cada músculo.</div></div>`,
      actions: {
        back: pop,
        tg: (ds) => { open.has(ds.t) ? open.delete(ds.t) : open.add(ds.t); refresh(); },
      },
    };
  }

  // ====================== PROGRESSO ======================
  function Progress() {
    let period = 8, exSel = null;
    return {
      render() {
        const weeks = Store.weeksBack(period);
        const from = weeks[0].startISO;
        const ss = S().sessions.filter((s) => s.date >= from && s.sets.some((x) => x.done));
        const head = `<div class="hello"><div class="t"><h1>Progresso<span>e evolução</span></h1></div></div>`;
        if (!S().sessions.some((s) => s.sets.some((x) => x.done))) {
          return head + `<div class="content"><div class="card empty appear"><div class="ic">${icon('chart', 'lg')}</div><h3>Seus gráficos aparecem aqui</h3><p>Registre o primeiro treino para acompanhar constância, cargas e volume.</p><button class="btn ghost sm" data-a="demo">Ver com dados de exemplo</button></div></div>`;
        }
        const p = Store.activePlan();
        const planned = p ? p.workouts.length : 0;
        const perWeek = weeks.map((w) => {
          const inW = S().sessions.filter((s) => s.date >= w.startISO && s.date <= w.endISO && s.sets.some((x) => x.done));
          const doneWorkouts = new Set(inW.filter((s) => { const pr = Store.sessionProgress(s); return pr.total && pr.complete >= pr.total; }).map((s) => s.workoutId)).size;
          return { label: w.start.getDate() + '/' + (w.start.getMonth() + 1), a: doneWorkouts, b: planned, vol: inW.reduce((a, s) => a + Store.sessionVolume(s), 0) };
        });
        const totalVol = ss.reduce((a, s) => a + Store.sessionVolume(s), 0);
        const totalSets = ss.reduce((a, s) => a + s.sets.filter((x) => x.done).length, 0);
        const fin = ss.filter((s) => s.end);
        const avgMin = fin.length ? Math.round(fin.reduce((a, s) => a + Store.sessionDuration(s), 0) / fin.length) : 0;
        let streak = 0; for (let i = perWeek.length - 2; i >= 0 && planned && perWeek[i].a >= planned; i--) streak++;
        if (planned && perWeek[perWeek.length - 1].a >= planned) streak++;

        // Exercícios com histórico, do mais feito para o menos
        const freq = {};
        ss.forEach((s) => new Set(s.sets.filter((x) => x.done).map((x) => x.exId)).forEach((id) => { freq[id] = (freq[id] || 0) + 1; }));
        const exIds = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
        if (!exSel || !freq[exSel]) exSel = exIds[0];
        const hist = exSel ? Store.exerciseHistory(exSel).filter((h) => h.date >= from) : [];
        const pts = hist.map((h) => ({ label: shortDate(h.date), v: h.e1rm }));
        const first = hist[0], lastH = hist[hist.length - 1];
        const gain = first && lastH && first.e1rm ? Math.round((lastH.e1rm / first.e1rm - 1) * 100) : 0;

        // Séries por grupo muscular
        const byGroup = {};
        ss.forEach((s) => s.sets.filter((x) => x.done).forEach((x) => { const g = Store.exercise(x.exId).grupo; byGroup[g] = (byGroup[g] || 0) + 1; }));
        const groups = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
        const gmax = groups.length ? groups[0][1] : 1;

        const recent = S().sessions.filter((s) => s.sets.some((x) => x.done)).sort((a, b) => b.start - a.start).slice(0, 12);
        return head + `<div class="content">
          <div class="quick-nav">${[['muscles', 'chart', 'Músculos'], ['records', 'trophy', 'Recordes'], ['body', 'weight', 'Corpo'], ['tests', 'target', 'Testes'], ['medals', 'star', 'Conquistas']].map(([a, ic, l]) => `<button class="card press" data-a="${a}">${icon(ic, 'sm')}<span>${l}</span></button>`).join('')}</div>
          <div class="seg" style="margin-top:12px">${[[4, '4 sem'], [8, '8 sem'], [12, '3 meses'], [52, '1 ano']].map(([n, l]) => `<button class="${period === n ? 'on' : ''}" data-a="period" data-n="${n}">${l}</button>`).join('')}</div>
          <div class="tiles two" style="margin-top:12px">
            <div class="card tile"><div class="ic" style="color:var(--lime)">${icon('check', 'sm')}</div><div class="v num">${ss.length}</div><div class="l">Treinos registrados</div></div>
            <div class="card tile"><div class="ic" style="color:var(--amber)">${icon('flame', 'sm')}</div><div class="v num">${streak}<small>sem</small></div><div class="l">Semanas completas seguidas</div></div>
            <div class="card tile"><div class="ic" style="color:var(--blue)">${icon('weight', 'sm')}</div><div class="v num">${volume(totalVol)}</div><div class="l">Volume levantado</div></div>
            <div class="card tile"><div class="ic" style="color:var(--violet)">${icon('clock', 'sm')}</div><div class="v num">${avgMin}<small>min</small></div><div class="l">Duração média · ${totalSets} séries</div></div></div>
          <div class="section-title"><h2>Constância</h2><span class="small muted">treinos completos por semana</span></div>
          <div class="card">${barChart(perWeek, { color: 'var(--lime)' })}<div class="legend"><span><i style="background:var(--lime)"></i>Completos</span><span><i style="background:rgba(var(--fg-rgb),.1)"></i>Planejados</span></div></div>
          <div class="section-title"><h2>Evolução de força</h2>${gain ? `<span class="chip ${gain > 0 ? 'done' : 'late'}">${gain > 0 ? '+' : ''}${gain}%</span>` : ''}</div>
          <div class="card"><div class="filters" style="margin:0 -16px 12px;padding:0 16px">${exIds.slice(0, 15).map((id) => `<button class="filter ${id === exSel ? 'on' : ''}" data-a="ex" data-id="${id}">${esc(Store.exercise(id).nome)}</button>`).join('')}</div>
          ${lineChart(pts, { color: 'var(--blue)' })}<div class="legend"><span><i style="background:var(--blue)"></i>1RM estimado (kg)</span><span><i style="background:var(--gold-2);border-radius:50%;box-shadow:0 0 6px rgba(243, 212, 140,.9)"></i>Recorde</span></div></div>
          <div class="section-title"><h2>Volume semanal</h2></div>
          <div class="card">${barChart(perWeek.map((w) => ({ label: w.label, a: w.vol })), { color: 'var(--blue)', fmt: (v) => (v >= 1000 ? nf(v / 1000, 0) + 't' : nf(v, 0)) })}</div>
          <div class="section-title"><h2>Músculos da semana</h2><button class="link" data-a="muscles">Ver mapa</button></div>
          ${Screens.muscleCard()}
          <div class="section-title"><h2>Frequência</h2></div>
          ${Screens.calendarCard()}
          <div class="section-title"><h2>Séries por grupo</h2><span class="small muted">no período</span></div>
          <div class="card">${groups.map(([g, n]) => `<div class="hbar"><span class="ellipsis">${esc(g)}</span><div class="track"><i style="width:${(n / gmax) * 100}%"></i></div><span class="v num">${n}</span></div>`).join('')}</div>
          <div class="section-title"><h2>Histórico</h2></div>
          <div class="list">${recent.map((s) => { const fw = Store.findWorkout(s.workoutId); const pr = Store.sessionProgress(s); const d = Store.parseISO(s.date); const ok = pr.total && pr.complete >= pr.total;
            return `<div class="card hist press" data-a="sess" data-id="${s.id}"><div class="d"><b class="num">${d.getDate()}</b><span>${UI.MONTHS[d.getMonth()]}</span></div><div class="grow"><div style="font-weight:600" class="ellipsis">${fw ? 'Treino ' + esc(fw.workout.letter) + ' · ' + esc(fw.workout.name) : 'Treino removido'}</div><div class="small muted num">${s.end ? Store.sessionDuration(s) + ' min · ' : ''}${volume(Store.sessionVolume(s))} · ${pr.setsDone} séries</div></div><span class="chip ${ok ? 'done' : 'partial'}">${ok ? 'Feito' : pr.complete + '/' + pr.total}</span></div>`; }).join('')}</div>
          </div>`;
      },
      actions: {
        period: (ds) => { period = Number(ds.n); refresh(); },
        ex: (ds) => { exSel = ds.id; refresh(); },
        sess: (ds) => push(SessionDetail(ds.id)),
        demo: () => { if (!Store.activePlan()) { toast('Escolha um plano primeiro, em Planos'); return; } Store.seedDemo(); refresh(); toast('Dados de exemplo criados. Remova em Configurações.'); },
        muscles: () => push(progSection(0)),
        records: () => push(progSection(1)),
        body: () => push(progSection(2)),
        tests: () => push(progSection(3)),
        medals: () => push(progSection(4)),
      },
      after: (el, re) => {
        const c = el.querySelector('[data-cal]'); if (c) c.scrollLeft = c.scrollWidth;
        // Deslizar para a esquerda no Progresso abre a primeira seção (Músculos).
        if (!re) UI.onSwipe(el, (d) => { if (d > 0 && UI.R.stack[UI.R.stack.length - 1] === UI.R.stack[0] && UI.R.tab === 'progress') push(progSection(0)); });
      },
    };
  }

  // ====================== DETALHE DA SESSÃO ======================
  function SessionDetail(sid) {
    return {
      hideNav: true,
      render() {
        const s = Store.session(sid); if (!s) return topbar('Treino') + '<div class="content"></div>';
        const fw = Store.findWorkout(s.workoutId), pr = Store.sessionProgress(s);
        const d = Store.parseISO(s.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        const byItem = [];
        s.sets.forEach((x) => { let g = byItem.find((b) => b.itemId === x.itemId); if (!g) byItem.push(g = { itemId: x.itemId, exId: x.exId, sets: [] }); g.sets.push(x); });
        const recs = Store.sessionRecords(s).map((r) => r.exId);
        const FEEL = ['', 'Muito leve', 'Leve', 'Moderado', 'Pesado', 'Exaustivo'];
        return topbar(fw ? 'Treino ' + esc(fw.workout.letter) : 'Treino', `<button class="icon-btn" data-a="share">${icon('share', 'sm')}</button><button class="icon-btn" data-a="del">${icon('trash', 'sm')}</button>`) +
          `<div class="content"><div style="font-size:22px;font-weight:700">${fw ? esc(fw.workout.name) : ''}</div><div class="small muted" style="text-transform:capitalize">${d}</div>
          <div class="tiles" style="margin-top:14px"><div class="card tile"><div class="v num">${s.end ? Store.sessionDuration(s) : '–'}<small>min</small></div><div class="l">Duração</div></div><div class="card tile"><div class="v num">${pr.setsDone}</div><div class="l">Séries</div></div><div class="card tile"><div class="v num">${volume(Store.sessionVolume(s))}</div><div class="l">Volume</div></div></div>
          ${s.feel ? `<div class="kv" style="margin-top:8px"><span>Sensação</span><b>${FEEL[s.feel]}</b></div>` : ''}${s.note ? `<div class="card small" style="margin-top:8px">${icon('note', 'sm')} ${esc(s.note)}</div>` : ''}
          ${byItem.map((g) => { const ex = Store.exercise(g.exId); const note = (s.notes || {})[g.itemId];
            return `<div class="card" style="margin-top:12px"><div class="row">${thumb(ex)}<div class="grow"><b class="ellipsis" style="display:block">${esc(ex.nome)}</b>${recs.includes(g.exId) ? `<span class="small pr">${icon('trophy', 'sm')} Recorde</span>` : ''}</div></div>
              <div style="margin-top:10px">${g.sets.map((x) => `<div class="kv num"><span>Série ${x.n}</span><span style="color:${x.done ? 'var(--text)' : 'var(--text-3)'}">${x.done ? nf(x.kg) + ' kg × ' + x.reps + (x.rest ? ' · descanso ' + UI.secs(x.rest) : '') : 'não feita'}</span></div>`).join('')}</div>${note ? `<div class="small muted" style="margin-top:6px">${icon('note', 'sm')} ${esc(note)}</div>` : ''}</div>`; }).join('')}</div>`;
      },
      actions: {
        back: pop,
        share: () => { toast('Gerando imagem…'); Screens.shareSession(sid); },
        del: () => confirmSheet('Apagar este registro?', 'As séries e cargas deste treino saem do histórico e das estatísticas.', 'Apagar', () => { Store.deleteSession(sid); pop(); }, true),
      },
    };
  }

  // ====================== CONFIGURAÇÕES ======================
  function Settings() {
    const st = () => S().settings;
    const stepRow = (label, sub, key, d, fmt, min) => `<div class="switch-row"><div class="grow"><div>${label}</div><div class="small muted">${sub}</div></div><div class="stepper" style="width:150px"><button data-a="st" data-k="${key}" data-d="${-d}" data-min="${min}">${icon('minus', 'sm')}</button><div class="val"><b class="num" style="font-size:15px">${fmt(st()[key])}</b></div><button data-a="st" data-k="${key}" data-d="${d}" data-min="${min}">${icon('plus', 'sm')}</button></div></div>`;
    const sw = (label, sub, key) => `<div class="switch-row" data-a="sw" data-k="${key}"><div class="grow"><div>${label}</div><div class="small muted">${sub}</div></div><div class="switch ${st()[key] ? 'on' : ''}"></div></div>`;
    return {
      hideNav: true,
      render: () => topbar('Configurações') + `<div class="content">
        <div class="row" style="gap:14px;align-items:flex-end"><button class="emblem-ring avatar press" style="width:58px;height:58px;margin:0 0 4px;flex:none" data-a="avatar" aria-label="Foto do perfil">${Profile.avatarHTML(34)}</button>
          <div class="field grow" style="margin-top:0"><label>Seu nome</label><input class="input" data-in="name" value="${esc(st().name)}" placeholder="Como quer ser chamado?"></div></div>
        <button class="link" style="margin:6px 2px 0" data-a="avatar">${Profile.photo() ? 'Trocar a foto do perfil' : 'Colocar foto no perfil'}</button>
        <div class="section-title"><h2>Aparência</h2></div>
        <div class="theme-grid">${Theme.LIST.map((t) => `<button class="theme-opt press ${Theme.current().id === t.id ? 'on' : ''}" data-a="theme" data-v="${t.id}">
          <span class="th-prev" style="background:${t.sw[0]}"><i style="background:${t.sw[1]};border-color:${t.sw[2]}55"><b style="background:${t.sw[2]}"></b><b style="background:${t.sw[3]};width:60%"></b></i><em style="background:${t.sw[2]}"></em></span>
          <span class="th-name">${t.nome}${Theme.current().id === t.id ? icon('check', 'sm') : ''}</span><small>${t.desc}</small></button>`).join('')}</div>
        <div class="section-title"><h2>Treino</h2></div><div class="card" style="padding:4px 16px">
          ${stepRow('Descanso padrão', 'Para exercícios novos', 'restDefault', 15, restLabel, 15)}
          ${stepRow('Ajuste do timer', 'Botões +/− do descanso', 'restStep', 5, (v) => v + ' s', 5)}
          ${stepRow('Incremento de carga', 'Botões +/− e sugestões', 'incKg', 0.5, (v) => nf(v) + ' kg', 0.5)}
          ${stepRow('Peso da barra', 'Para a calculadora de anilhas', 'bar', 2.5, (v) => nf(v) + ' kg', 5)}
          <div class="switch-row"><div class="grow"><div>Semana começa</div></div><div class="seg" style="width:170px"><button class="${st().weekStart === 1 ? 'on' : ''}" data-a="ws" data-v="1">Segunda</button><button class="${st().weekStart === 0 ? 'on' : ''}" data-a="ws" data-v="0">Domingo</button></div></div>
          ${sw('Sugerir aumento de carga', 'Pelas repetições e pelo esforço (RIR)', 'suggest')}
          <div class="switch-row" style="flex-wrap:wrap"><div class="grow"><div>Progressão pela faixa de repetições</div><div class="small muted">Exercícios com faixa (ex.: 8–12): bateu o topo em todas as séries, a carga sobe e volta para o início</div></div>
            <div class="seg" style="width:100%;margin-top:8px">${[['ask', 'Perguntar'], ['auto', 'Automática'], ['off', 'Desligada']].map(([v, l]) => `<button class="${(st().rangeMode || 'ask') === v ? 'on' : ''}" data-a="rangeMode" data-v="${v}">${l}</button>`).join('')}</div></div>
          ${sw('Perguntar como foi a série', 'No limite, pesado ou tranquilo · ajuda a sugerir a carga', 'askRir')}
          ${sw('Som no fim do descanso', 'Bipes 3, 2, 1 e sinal de largada', 'sound')}
          <button class="menu-item" data-a="voice"><span class="ic">${icon('play', 'sm')}</span><span class="grow">Voz no treino<div class="small muted">${Voice.LEVELS[Voice.cfg().level][1]}${Voice.cfg().level ? ' · fala a próxima série e o fim do descanso' : ''}</div></span>${icon('next', 'sm')}</button>
          ${sw('Vibração', 'Ao concluir séries e no fim do descanso', 'vibrate')}
          ${sw('Abertura animada', 'Scouter ao abrir o app (toque para pular)', 'splash')}
          ${sw('Fotos coloridas', 'Desligado: fotos no tom do tema', 'colorPhotos')}</div>
        <div class="section-title"><h2>Lembrete de treino</h2></div><div class="card" style="padding:4px 16px">
          ${sw('Lembrar de treinar', 'Notificação nos dias do plano', 'reminder')}
          ${st().reminder ? `<div class="switch-row"><div class="grow">Horário</div><input class="input" type="time" style="width:130px;height:44px" data-ch="rtime" value="${esc(st().reminderTime)}"></div>` : ''}</div>
        <div class="section-title"><h2>Seus dados</h2></div><div class="card" style="padding:4px 16px">
          <button class="menu-item" data-a="export"><span class="ic">${icon('download', 'sm')}</span><span class="grow">Fazer backup<div class="small muted">Envie para o Drive, WhatsApp ou e-mail</div></span></button>
          <button class="menu-item" data-a="import"><span class="ic">${icon('upload', 'sm')}</span><span class="grow">Restaurar backup<div class="small muted">Substitui os dados atuais</div></span></button>
          <button class="menu-item" data-a="demo"><span class="ic">${icon('sparkle', 'sm')}</span><span class="grow">${S().sessions.some((s) => s.demo) ? 'Remover dados de exemplo' : 'Criar dados de exemplo'}<div class="small muted">Para ver os gráficos funcionando</div></span></button>
          <button class="menu-item danger" data-a="reset"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Apagar tudo</span></button></div>
        <div class="tiny faint" style="text-align:center;margin-top:20px">Gravity · versão de teste<br>Fotos dos exercícios: Free Exercise DB (domínio público)</div></div>`,
      actions: {
        back: pop,
        name: (ds, el) => { st().name = el.value.trim(); Store.save(); UI.savedFlash(); },
        st: (ds) => { st()[ds.k] = Math.max(Number(ds.min), Math.round((Number(st()[ds.k]) + Number(ds.d)) * 10) / 10); Store.save(); Native.vibrate(6); refresh(); UI.savedFlash(); },
        rangeMode: (ds) => { st().rangeMode = ds.v; Store.save(); UI.savedFlash(); refresh(); },
        theme: (ds) => { Theme.apply(ds.v); Store.save(); Native.vibrate(8); UI.savedFlash(); refresh(); },
        sw: (ds) => { st()[ds.k] = !st()[ds.k]; Store.save(); document.body.classList.toggle('color-photos', !!st().colorPhotos); if (ds.k === 'reminder') { Screens.syncNative(); if (st().reminder) toast('Lembrete às ' + st().reminderTime + ' nos dias do plano'); else UI.savedFlash(); } else UI.savedFlash(); refresh(); },
        voice: () => push(Screens.VoiceSettings()),
        avatar: () => Profile.sheet(UI.refresh),
        ws: (ds) => { st().weekStart = Number(ds.v); Store.save(); refresh(); UI.savedFlash(); },
        rtime: (ds, el) => { if (el.value) { st().reminderTime = el.value; Store.save(); Screens.syncNative(); toast('Lembrete às ' + el.value); } },
        export: () => Native.share('Backup Gravity', Store.exportBackup(), 'gravity-backup.json'),
        import: () => pickFile('.json,application/json,text/plain', false, (text) => {
          confirmSheet('Restaurar backup?', 'Todos os dados atuais serão substituídos pelos do arquivo.', 'Restaurar', () => {
            try { Store.importBackup(text); toast('Backup restaurado'); UI.switchTab('home', true); } catch (err) { toast(err.message || 'Arquivo inválido'); }
          }, true);
        }),
        demo: () => { if (S().sessions.some((s) => s.demo)) { Store.clearDemo(); toast('Dados de exemplo removidos'); } else if (!Store.activePlan()) { toast('Escolha um plano primeiro, em Planos'); return; } else { Store.seedDemo(); toast('Dados de exemplo criados'); } refresh(); },
        reset: () => confirmSheet('Apagar tudo?', 'Planos, histórico e exercícios criados serão apagados. Faça um backup antes, se quiser guardar.', 'Apagar tudo', () => { Store.reset(); UI.switchTab('home', true); toast('Dados apagados'); }, true),
      },
    };
  }

  Object.assign(window.Screens, { lineChart, TechGuide, Library, ExerciseDetail, ExerciseForm, Plans, PlanEditor, WorkoutEditor, Progress, SessionDetail, Settings });
})();
