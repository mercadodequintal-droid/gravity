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
  // v0.46 (aprovado em 13/11): aba Exercícios = L2 "Escolha o músculo" → página do músculo G1 (grade com filtros);
  // Adicionar exercícios (pick) = A2 "Grade numerada" com a folha Filtros e a bandeja dos escolhidos.
  const LIB_KINDS = [['all', 'Todos'], ['novo', 'Novos'], ['maquina', 'Máquinas'], ['moda', 'Em alta'], ['hyrox', 'HYROX'], ['cal', 'Calistenia']];
  const libNorm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/puley/g, 'pulley').replace(/cros+ ?over/g, 'crossover').replace(/scot\b/g, 'scott');
  const FILT_IC = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
  const planExIds = () => { const p = Store.activePlan(); return new Set(p ? p.workouts.flatMap((w) => w.items.map((it) => it.exId)) : []); };
  function libGroups() { return Store.GROUPS.filter((g) => Store.allExercises().some((e) => e.grupo === g && g !== 'Cardio')).concat(Store.allExercises().some((e) => e.grupo === 'Cardio') ? ['Cardio'] : []); }
  function Library(opts) {
    opts = opts || {};
    const pick = !!opts.pick;
    let q = '', group = opts.group || (pick ? 'Todos' : null), kind = opts.kind || 'all';
    const eqSel = new Set(opts.eq || []);
    const picked = [];
    const inPlan = planExIds();
    const nF = () => (kind !== 'all' ? 1 : 0) + eqSel.size + (S().settings.gymOnly ? 1 : 0);
    const match = (e, o) => {
      o = o || {};
      const g = o.group !== undefined ? o.group : group, k = o.kind || kind, eqs = o.eq || eqSel;
      if (g && g !== 'Todos' && e.grupo !== g) return false;
      if (k === 'novo' ? !e.novo : k !== 'all' && e.tag !== k) return false;
      if (eqs.size && !eqs.has(e.equip || 'Outro')) return false;
      if (S().settings.gymOnly && !Store.available(e)) return false;
      if (o.q !== false && q) { const hay = libNorm(e.nome + ' ' + e.grupo + ' ' + (e.equip || '') + ' ' + (e.alias || '')); if (!libNorm(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false; }
      return true;
    };
    const list = () => Store.allExercises().filter((e) => match(e));
    const card = (e) => {
      const k = picked.indexOf(e.id) + 1;
      return `<button class="lb-card press ${k ? 'on' : ''}" data-a="ex" data-id="${e.id}">${(e.img && e.img[0]) ? `<span class="im" style="background-image:url('${e.img[0]}')"></span>` : `<span class="im noimg">${icon('dumbbell')}</span>`}
        ${pick ? (k ? `<span class="num">${k}</span>` : '<span class="plus">+</span>') : inPlan.has(e.id) ? '<span class="tag">No plano</span>' : e.novo && window.LIB_TAGS && LIB_TAGS[e.tag] ? `<span class="tag">${LIB_TAGS[e.tag]}</span>` : ''}
        <b>${esc(e.nome)}</b><small>${esc(e.equip || e.grupo)}</small></button>`;
    };
    const gridHTML = () => { const L = list(); return L.length ? `<div class="lb-grid">${L.map(card).join('')}</div>` : `<div class="empty">Nenhum exercício encontrado.<br><button class="btn ghost sm" style="margin-top:12px" data-a="new">Criar “${esc(q || 'novo')}”</button></div>`; };
    const activeChips = () => (nF() ? `<div class="lb-act">${kind !== 'all' ? `<button data-a="rmKind">${esc(LIB_KINDS.find((x) => x[0] === kind)[1])} ×</button>` : ''}${[...eqSel].map((x) => `<button data-a="rmEq" data-v="${esc(x)}">${esc(x)} ×</button>`).join('')}${S().settings.gymOnly ? '<button data-a="gymOnly">Minha academia ×</button>' : ''}<a data-a="clear">Limpar</a></div>` : '');
    const filtBtn = () => `<button class="f ${nF() ? 'act' : ''}" data-a="filters">${FILT_IC}Filtros${nF() ? ' · ' + nF() : ''}</button>`;
    const search = (ph) => `<label class="lb-search">${icon('search', 'sm')}<input type="search" placeholder="${ph}" value="${esc(q)}" data-in="q"></label>`;
    const trayHTML = () => (picked.length ? `<div class="lb-tray"><div class="th">${picked.slice(0, 7).map((id) => { const e = Store.exercise(id); return `<button data-a="unpick" data-id="${id}" style="background-image:url('${(e.img || [])[0] || ''}')"></button>`; }).join('')}<span>${picked.length} ${picked.length === 1 ? 'escolhido' : 'escolhidos'} · toque para tirar</span></div>
      <button class="btn lime block lb-add" data-a="done">${icon('plus', 'sm')}Adicionar ${picked.length} ${picked.length === 1 ? 'exercício' : 'exercícios'}</button></div>` : '');
    const paintList = () => { const g = def.el && def.el.querySelector('[data-grid]'); if (g) g.innerHTML = body(); const t = def.el && def.el.querySelector('[data-tray]'); if (t) t.innerHTML = trayHTML(); const c = def.el && def.el.querySelector('[data-cnt]'); if (c) c.textContent = cntLabel(); };
    const cntLabel = () => (group && group !== 'Todos' ? group + ' · ' : '') + list().length + ' exercícios';
    // Busca na tela dos músculos: lista com o trecho em dourado e chips por músculo.
    function searchResults() {
      const L = Store.allExercises().filter((e) => match(e, { group: null }));
      const words = libNorm(q).split(/\s+/).filter(Boolean);
      const hl = (t) => { let out = esc(t); const w = words[0]; if (!w) return out; const i = libNorm(t).indexOf(w); return i < 0 ? out : esc(t.slice(0, i)) + '<em>' + esc(t.slice(i, i + w.length)) + '</em>' + esc(t.slice(i + w.length)); };
      if (!L.length) return `<div class="empty">Nada encontrado para “${esc(q)}”.<br><button class="btn ghost sm" style="margin-top:12px" data-a="new">Criar “${esc(q)}”</button></div>`;
      return `<div class="lb-cnt">${L.length} ${L.length === 1 ? 'resultado' : 'resultados'}</div>` + L.slice(0, 60).map((e) => `<button class="lb-row press" data-a="ex" data-id="${e.id}">${thumb(e)}<span class="g"><b>${hl(e.nome)}</b><small>${esc(e.grupo)}${e.equip ? ' · ' + esc(e.equip) : ''}</small></span>${icon('next', 'sm')}</button>`).join('');
    }
    function body() {
      if (!pick && !group) return q ? searchResults() : `<div class="lb-cap">Escolha o músculo</div><div class="lb-tiles">${libGroups().map((g) => { const L = Store.allExercises().filter((e) => e.grupo === g); const ph = L.filter((e) => e.img && e.img.length); const im = ph[Math.min(2, ph.length - 1)]; return `<button class="lb-tile press" data-a="grp" data-g="${esc(g)}">${im ? `<span class="ph" style="background-image:url('${im.img[0]}')"></span>` : ''}<span class="in"><b>${esc(g)}</b><small>${L.length} exercícios</small></span></button>`; }).join('')}</div>`;
      return gridHTML();
    }
    function heroHTML() {
      const L = Store.allExercises().filter((e) => group === 'Todos' || e.grupo === group), ph = L.filter((e) => e.img && e.img.length && (kind === 'all' || match(e, { q: false }))), im = ph[Math.min(2, ph.length - 1)];
      const reg = {}; L.forEach((e) => { const m = Analytics.musclesOf(e); Object.keys(m).forEach((k) => { if (m[k] === 1) reg[k] = (reg[k] || 0) + 1; }); });
      const top = Math.max(1, ...Object.values(reg));
      const bd = Screens.bodySVG((k) => (reg[k] && reg[k] >= top * 0.25 ? 'var(--gold)' : ''), 120);
      const np = L.filter((e) => inPlan.has(e.id)).length;
      return `<div class="lb-hero">${im ? `<span class="ph" style="background-image:url('${im.img[0]}')"></span>` : ''}<button class="icon-btn bk" data-a="back">${icon('back')}</button><span class="bd">${bd}</span>
        <div class="in"><h2>${esc(opts.title || group)}</h2><small>${L.length} exercícios${np ? ' · ' + np + ' no seu plano' : ''}</small></div></div>`;
    }
    const EQS = () => { const c = {}; Store.allExercises().filter((e) => match(e, { eq: new Set(), q: false })).forEach((e) => { const k = e.equip || 'Outro'; c[k] = (c[k] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
    const filtersSheet = () => {
      let tKind = kind, tEq = new Set(eqSel), tGym = !!S().settings.gymOnly;
      const cnt = () => Store.allExercises().filter((e) => { const prev = S().settings.gymOnly; S().settings.gymOnly = tGym; const r = match(e, { kind: tKind, eq: tEq }); S().settings.gymOnly = prev; return r; }).length;
      const off = Object.keys(S().settings.gymOff || {}).length;
      sheet({
        render: () => `<h3>Filtros</h3><div class="desc">Combinam com a busca${group && group !== 'Todos' ? ' e com ' + esc(group) : ' e o músculo escolhido'}.</div>
          <div class="fs-cap">Tipo</div><div class="lb-fch">${LIB_KINDS.map(([k, l]) => `<button class="${k === tKind ? 'on' : ''}" data-a="k" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="fs-cap" style="display:flex;justify-content:space-between">Aparelho<span style="letter-spacing:.3px;text-transform:none;color:var(--gold-2)">pode marcar mais de um</span></div>
          <div class="lb-fch">${EQS().map(([k, n]) => `<button class="${tEq.has(k) ? 'on' : ''}" data-a="e" data-v="${esc(k)}">${esc(k)} <i>${n}</i></button>`).join('')}</div>
          <div class="fs-cap">Minha academia</div>
          <div class="fs-opt" data-a="g" style="border:0"><span class="g"><b>Só o que tem na minha academia</b><small>${off ? off + (off === 1 ? ' aparelho marcado' : ' aparelhos marcados') + ' como "não tem"' : 'Marque os aparelhos que sua academia não tem'}</small></span><span class="switch ${tGym ? 'on' : ''}"></span></div>
          <button class="fs-link" style="justify-content:flex-start" data-a="gym">${icon('edit', 'sm')} Ajustar aparelhos da academia</button>
          <div class="fs-btns"><button class="btn ghost" data-a="clr">Limpar</button><button class="btn lime" data-a="ok">Ver ${cnt()} exercícios</button></div>`,
        actions: {
          k: (ds) => { tKind = ds.v; sheetRefresh(); },
          e: (ds) => { tEq.has(ds.v) ? tEq.delete(ds.v) : tEq.add(ds.v); Native.vibrate(6); sheetRefresh(); },
          g: () => { tGym = !tGym; sheetRefresh(); },
          gym: () => { closeSheet(); push(GymSetup()); },
          clr: () => { tKind = 'all'; tEq = new Set(); tGym = false; sheetRefresh(); },
          ok: () => { kind = tKind; eqSel.clear(); tEq.forEach((x) => eqSel.add(x)); S().settings.gymOnly = tGym; Store.save(); closeSheet(); refresh(); },
        },
      });
    };
    const def = {
      hideNav: pick || !!opts.group,
      render() {
        def.footer = pick;
        if (!pick && group) {
          const eqTop = EQS().slice(0, 6).map((x) => x[0]);
          return `<div class="content lb-c" style="padding-top:0">${heroHTML()}${search('Buscar em ' + esc(group))}
            <div class="lb-chips">${filtBtn()}<button class="${eqSel.size ? '' : 'on'}" data-a="eqAll">Todos</button>${eqTop.map((x) => `<button class="${eqSel.size === 1 && eqSel.has(x) ? 'on' : ''}" data-a="eqOne" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
            ${activeChips()}<div class="lb-cap" data-cnt>${cntLabel()}</div><div data-grid>${body()}</div></div>`;
        }
        const right = `<button class="icon-btn" data-a="new" aria-label="Novo exercício">${icon('plus')}</button>`;
        if (pick) {
          return topbar('Adicionar exercícios', right) + `<div class="content lb-c">${search('Buscar exercício')}
            <div class="lb-chips">${filtBtn()}${['Todos'].concat(libGroups()).map((g) => `<button class="${g === group ? 'on' : ''}" data-a="grpChip" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
            ${activeChips()}<div class="lb-cap" data-cnt>${cntLabel()}</div><div data-grid>${body()}</div></div><div class="lb-foot" data-tray>${trayHTML()}</div>`;
        }
        return topbar('Exercícios', right, true) + `<div class="content lb-c">${search('Buscar exercício')}<div data-grid>${body()}</div></div>`;
      },
      after(el) { const c = el.querySelector('.lb-chips .on'); if (c && pick) c.scrollIntoView({ inline: 'center', block: 'nearest' }); },
      actions: {
        back: pop,
        q: (ds, el) => { q = el.value; paintList(); },
        grp: (ds) => push(Library({ group: ds.g })),
        grpChip: (ds) => { group = ds.g; refresh(); },
        eqAll: () => { eqSel.clear(); refresh(); },
        eqOne: (ds) => { eqSel.clear(); eqSel.add(ds.v); refresh(); },
        filters: filtersSheet,
        rmKind: () => { kind = 'all'; refresh(); },
        rmEq: (ds) => { eqSel.delete(ds.v); refresh(); },
        gymOnly: () => { S().settings.gymOnly = !S().settings.gymOnly; Store.save(); refresh(); },
        clear: () => { kind = 'all'; eqSel.clear(); S().settings.gymOnly = false; Store.save(); refresh(); },
        ex: (ds) => {
          if (!pick) { push(ExerciseDetail(ds.id)); return; }
          const k = picked.indexOf(ds.id); if (k >= 0) picked.splice(k, 1); else picked.push(ds.id);
          Native.vibrate(8); paintList();
        },
        unpick: (ds) => { const k = picked.indexOf(ds.id); if (k >= 0) picked.splice(k, 1); paintList(); },
        new: () => push(ExerciseForm(null, (ex) => { if (pick && !picked.includes(ex.id)) picked.push(ex.id); })),
        done: () => { if (!picked.length) { toast('Selecione ao menos um exercício'); return; } opts.pick(picked.slice()); pop(); },
      },
    };
    return def;
  }

  // ====================== MINHA ACADEMIA ======================
  // Marca os aparelhos que a academia tem. O que estiver desligado some da biblioteca (com o filtro ligado),
  // das trocas sugeridas e dos planos que o app monta.
  function GymSetup() {
    let open = null;
    return {
      hideNav: true,
      render() {
        const all = Store.allExercises().filter((e) => Store.gymDependent(e) && !e.custom);
        const groups = Store.GROUPS.filter((g) => all.some((e) => e.grupo === g));
        const off = all.filter((e) => !Store.available(e)).length;
        return topbar('Minha academia') + `<div class="content">
          <div class="small muted" style="margin:0 2px 12px">Desligue os aparelhos que a sua academia não tem. Eles deixam de aparecer nas trocas sugeridas e nos planos que o app monta, e somem da biblioteca com o filtro “Só o que tem na minha academia”.</div>
          <div class="card small" style="margin-bottom:12px">${icon('info', 'sm')} ${all.length - off} de ${all.length} aparelhos disponíveis.</div>
          <div class="list">${groups.map((g) => { const ex = all.filter((e) => e.grupo === g), n = ex.filter((e) => Store.available(e)).length;
            return `<div class="card gym-group"><div class="row press" data-a="open" data-g="${g}"><b class="grow">${esc(g)}</b><span class="small muted">${n}/${ex.length}</span>${icon(open === g ? 'up' : 'down', 'sm')}</div>
              ${open === g ? `<div class="btn-row" style="margin:10px 0 4px"><button class="btn ghost sm" data-a="allOn" data-g="${g}">Tem todos</button><button class="btn ghost sm" data-a="allOff" data-g="${g}">Não tem nenhum</button></div>
              ${ex.map((e) => `<div class="switch-row" data-a="tog" data-id="${e.id}">${UI.thumb(e)}<div class="grow"><div>${esc(e.nome)}</div><div class="small muted">${esc(e.equip)}</div></div><div class="switch ${Store.available(e) ? 'on' : ''}"></div></div>`).join('')}` : ''}</div>`; }).join('')}</div></div>`;
      },
      actions: {
        back: pop,
        open: (ds) => { open = open === ds.g ? null : ds.g; refresh(); },
        tog: (ds) => { Store.setAvailable(ds.id, !Store.available(ds.id)); Native.vibrate(6); refresh(); },
        allOn: (ds) => { Store.allExercises().filter((e) => e.grupo === ds.g && Store.gymDependent(e)).forEach((e) => Store.setAvailable(e.id, true)); refresh(); },
        allOff: (ds) => { Store.allExercises().filter((e) => e.grupo === ds.g && Store.gymDependent(e)).forEach((e) => Store.setAvailable(e.id, false)); refresh(); },
      },
    };
  }

  // ====================== FICHA DO EXERCÍCIO ======================
  // v0.46 · Ficha do exercício "FA imersiva" (aprovada em 13/11): foto grande, botões em vidro escuro (cantos
  // quadrados, sem brilho), nome e 3 números por cima da foto e uma folha com 4 abas.
  const STAR = (on) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`;
  function ExerciseDetail(exId, startTab) {
    let tab = startTab || 'como';
    const meta = () => S().exMeta[exId] || {};
    const def = {
      hideNav: true,
      render() {
        const ex = Store.exercise(exId);
        const hist = Store.exerciseHistory(exId);
        const best = hist.length ? Math.max(...hist.map((h) => h.maxKg)) : 0;
        const best1 = hist.length ? Math.max(...hist.map((h) => h.e1rm)) : 0;
        const last = hist[hist.length - 1];
        // Evolução das últimas 4 semanas (1RM estimado).
        const since = Store.iso(Store.addDays(Store.today(), -28));
        const old = hist.filter((h) => h.date < since).pop() || hist.find((h) => h.date >= since);
        const gain = old && last && old !== last && old.e1rm ? Math.round((last.e1rm / old.e1rm - 1) * 100) : null;
        const fav = !!meta().fav;
        const stats = `<div class="fa-st"><div><b class="num">${hist.length ? nf(best) : '—'}</b><small>recorde kg</small></div><div><b class="num">${hist.length ? nf(best1, 0) : '—'}</b><small>1RM kg</small></div><div><b class="num">${gain == null ? (hist.length ? hist.length : '—') : (gain > 0 ? '+' : '') + gain + '%'}</b><small>${gain == null ? (hist.length === 1 ? 'sessão' : 'sessões') : '4 semanas'}</small></div></div>`;
        let pane = '';
        if (tab === 'como') {
          pane = (ex.dicas && ex.dicas.length ? ex.dicas.map((d, i) => `<div class="fa-step"><i>${String(i + 1).padStart(2, '0')}</i><span>${esc(d)}</span></div>`).join('') : '<div class="small muted" style="padding:10px 2px">Sem passo a passo para este exercício.</div>')
            + (ex.erro ? `<div class="fa-err"><b>Erro comum:</b> ${esc(ex.erro)}</div>` : '')
            + (ex.musculos && ex.musculos.length ? `<div class="small muted" style="margin-top:12px"><b style="color:var(--text);font-weight:500">Músculos:</b> ${esc(ex.musculos.join(', '))}${ex.secundarios && ex.secundarios.length ? ' · auxiliares: ' + esc(ex.secundarios.join(', ')) : ''}</div>` : '')
            + `<button class="pin-note" style="margin-top:12px" data-a="pin">${icon('note', 'sm')}<span>${Tools.pinOf(exId) ? esc(Tools.pinOf(exId)) : 'Adicionar nota fixa (ajuste do banco, assento, pegada…)'}</span></button>`
            + (Store.gymDependent(ex) && !ex.custom ? `<div class="switch-row" data-a="avail" style="margin-top:6px"><div class="grow"><div>Tem na minha academia</div><div class="small muted">Desligado: o app não sugere este aparelho nas trocas e nos planos</div></div><div class="switch ${Store.available(ex) ? 'on' : ''}"></div></div>` : '');
        } else if (tab === 'evo') {
          const pts = hist.slice(-12).map((h) => ({ label: shortDate(h.date), v: h.e1rm }));
          const pains = Store.painsFor(exId).slice(-4).reverse();
          pane = hist.length ? `<div class="fa-evh"><span>1RM estimado</span>${gain != null ? `<span class="${gain >= 0 ? 'up' : ''}">${gain >= 0 ? '↑' : '↓'} ${Math.abs(gain)}% em 4 semanas</span>` : ''}</div>${lineChart(pts, { color: 'var(--gold)', h: 150 })}
            ${hist.slice(-5).reverse().map((h) => `<div class="fa-row"><span>${shortDate(h.date)}</span><b class="num">${nf(h.maxKg)} kg · 1RM ${nf(h.e1rm, 0)} kg</b></div>`).join('')}
            ${pains.length ? `<div class="fs-cap">Dores registradas</div>${pains.map((p) => `<div class="fa-row"><span>${shortDate(p.date)} · ${esc(p.where)}</span><b>${Store.PAIN_LEVELS[p.lvl]}${p.note ? ' · ' + esc(p.note) : ''}</b></div>`).join('')}` : ''}`
            : '<div class="small muted" style="padding:14px 2px">Você ainda não registrou este exercício. O gráfico aparece depois do primeiro treino.</div>';
        } else if (tab === 'rec') {
          const b = Analytics.bestOf(exId) || { rm: {} };
          const cells = [[1, '1 rep'], [3, '3 reps'], [5, '5 reps'], [10, '10 reps']].map(([n, l]) => [l, b.rm && b.rm[n] ? b.rm[n] : null]);
          pane = hist.length ? `<div class="fs-cap">Maior carga por repetições</div><div class="fa-rec">${cells.map(([l, v]) => `<div><b class="num">${v == null ? '—' : nf(v)}</b><small>${l}</small></div>`).join('')}<div><b class="num">${nf(best1, 0)}</b><small>1RM</small></div></div>
            <div style="margin-top:14px">${Tools.pctTable(exId)}</div>`
            : '<div class="small muted" style="padding:14px 2px">Os recordes aparecem depois do primeiro treino com este exercício.</div>';
        } else {
          const own = meta().video || ex.video;
          pane = `<button class="fa-vid" data-a="video" style="background-image:url('${(ex.img || [])[1] || (ex.img || [])[0] || ''}')"><span>${icon('play')}</span></button>
            ${own ? `<button class="fa-row press" data-a="video"><span>${icon('video', 'sm')} Vídeo cadastrado</span><b>Assistir</b></button>` : ''}
            <button class="fa-row press" data-a="yt"><span>${icon('search', 'sm')} Buscar no YouTube</span><b>Abrir</b></button>
            <button class="fa-row press" data-a="setVideo"><span>${icon('edit', 'sm')} ${meta().video ? 'Trocar o meu link' : 'Usar meu próprio link'}</span><b>${meta().video ? 'Trocar' : 'Adicionar'}</b></button>`;
        }
        const tabs = [['como', 'Como fazer'], ['evo', 'Evolução'], ['rec', 'Recordes'], ['vid', 'Vídeo']];
        return `<div class="content fa-c" style="padding:0">
          <div class="fa-hero">${(ex.img && ex.img[0]) ? `<span class="ph" style="background-image:url('${ex.img[0]}')"></span>` : '<span class="ph noimg"></span>'}
            <div class="fa-top"><button class="fa-ib" data-a="back" aria-label="Voltar">${icon('back')}</button><span class="grow"></span>${ex.custom ? `<button class="fa-ib" data-a="edit">${icon('edit', 'sm')}</button>` : ''}<button class="fa-ib ${fav ? 'on' : ''}" data-a="fav" aria-label="Favorito">${STAR(fav)}</button><button class="fa-ib" data-a="share" aria-label="Compartilhar">${icon('share', 'sm')}</button></div>
            <div class="fa-name"><small>${esc(ex.grupo)}${ex.equip ? ' · ' + esc(ex.equip) : ''}</small><h2>${esc(ex.nome)}</h2></div>${stats}</div>
          <div class="fa-sheet"><div class="fa-tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-a="tab" data-t="${k}">${l}</button>`).join('')}</div>${pane}
          ${ex.img && ex.img.length && (/^ex/.test(ex.id) || ex.foto === 'fedb') ? '<div class="tiny faint" style="margin-top:18px">Imagens: Free Exercise DB (domínio público).</div>' : ''}</div></div>`;
      },
      actions: {
        back: pop,
        tab: (ds) => { tab = ds.t; refresh(); },
        fav: () => { S().exMeta[exId] = Object.assign(meta(), { fav: !meta().fav }); Store.save(); Native.vibrate(8); refresh(); },
        share: () => { const ex = Store.exercise(exId); Native.share(ex.nome, ex.nome + (ex.dicas && ex.dicas.length ? '\n\n' + ex.dicas.map((d, i) => (i + 1) + '. ' + d).join('\n') : '') + (ex.erro ? '\n\nErro comum: ' + ex.erro : '') + '\n\nGravity'); },
        avail: () => { Store.setAvailable(exId, !Store.available(exId)); refresh(); },
        pin: () => Tools.pinSheet(exId, refresh),
        video: () => Native.open(Store.videoUrl(Store.exercise(exId))),
        yt: () => Native.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(Store.exercise(exId).nome + ' execução correta')),
        setVideo: () => {
          const m = meta();
          sheet({
            render: () => `<h3>Link do vídeo</h3><div class="desc">Cole um link do YouTube (ou outro) para este exercício. Em branco, o app busca no YouTube.</div><input class="input" id="vurl" type="url" placeholder="https://youtube.com/…" value="${esc(m.video || '')}"><div class="fs-btns"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
            actions: { no: closeSheet, ok: () => { const v = document.getElementById('vurl').value.trim(); S().exMeta[exId] = Object.assign(m, { video: v }); Store.save(); closeSheet(); toast(v ? 'Link salvo' : 'Link removido'); refresh(); } },
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
    // v0.44 (decidido em 12/11): "Plano em foco" (1) + folha "Criar novo plano" (2) + "Sem plano" (7).
    const DS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const days = (w) => (w.days.length ? w.days.slice().sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7)).map((d) => DS[d]).join(', ') : 'Sem dia');
    const OPTS = [
      ['goal', 'target', 'Pelo meu objetivo', 'Responda 5 perguntas e o app monta', true],
      ['sports', 'bolt', 'Para meu esporte', '20 esportes, academia ou sem equipamento'],
      ['models', 'layers', 'Modelo pronto', Store.TEMPLATES.length + ' planos: ABC, PPL, Upper/Lower, 5/3/1…'],
      ['new', 'edit', 'Do zero', 'Você escolhe cada exercício'],
    ];
    const createSheet = () => sheet({
      render: () => `<h3>Criar novo plano</h3><div class="desc">Como você quer começar? Você pode editar tudo depois.</div>
        <div class="pl-g2">${OPTS.map(([a, ic, t, d, rec]) => `<button class="pl-tile press" data-a="${a}">${rec ? '<span class="pl-tag fill pl-rec">Recomendado</span>' : ''}<span class="ic">${icon(ic, 'sm')}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
        <button class="pl-mini press" style="margin-top:10px" data-a="import">${icon('upload', 'sm')}<span class="grow"><b>Importar planilha</b> · Excel ou Google Planilhas (CSV)</span>${icon('next', 'sm')}</button>`,
      actions: {
        goal: () => { closeSheet(); push(Screens.GoalWizard()); },
        sports: () => { closeSheet(); push(Screens.SportList()); },
        models: () => { closeSheet(); setTimeout(modelsSheet, 380); },
        new: () => { closeSheet(); newPlan(); },
        import: () => { closeSheet(); setTimeout(importSheet, 380); },
      },
    });
    const modelsSheet = () => sheet({
      render: () => `<h3>Modelo pronto</h3><div class="desc">Uma cópia editável é criada e vira o seu plano ativo. Seu histórico continua salvo.</div>
        <div class="list" style="max-height:58vh;overflow:auto">${Store.TEMPLATES.map((t) => `<button class="pl-row press" data-a="tpl" data-k="${t.key}"><span class="lt">${t.workouts.length}</span><span class="grow"><b>${esc(t.name)}</b><small>${esc(t.goal)} · ${t.weeks} semanas</small></span>${icon('plus', 'sm')}</button>`).join('')}</div>`,
      actions: {
        tpl: (ds) => {
          const t = Store.TEMPLATES.find((x) => x.key === ds.k);
          closeSheet();
          setTimeout(() => confirmSheet('Usar “' + t.name + '”?', 'Uma cópia editável é criada e vira o seu plano ativo. Seu histórico continua salvo.', 'Usar modelo', () => {
            const p = Store.planFromTemplate(t, S().settings.weekStart); S().plans.push(p); S().activePlanId = p.id; Store.save(); refresh(); toast('Plano criado e ativado');
          }), 380);
        },
      },
    });
    const importSheet = () => sheet({
      render: () => `<h3>Importar planilha</h3><div class="desc">Monte o treino no Excel ou no Google Planilhas e salve como <b>CSV</b>.</div>
        <div class="card small muted">Colunas: <b>plano, semanas, treino, dia, exercicio, series, repeticoes, carga_kg, descanso_s, observacao</b> e, opcionais, <b>tecnica</b> e <b>grupo</b>. Exercícios que o app não conhece são criados sem foto.</div>
        <button class="btn lime block" style="margin-top:14px" data-a="pick">${icon('upload', 'sm')}Escolher arquivo</button>`,
      actions: { pick: () => { closeSheet(); doImport(); } },
    });
    const plansSheet = () => sheet({
      render: () => `<h3>Meus planos</h3><div class="desc">Só um plano fica ativo por vez. O histórico de treinos nunca é apagado.</div>
        <div class="list" style="max-height:52vh;overflow:auto">${S().plans.map((p) => { const on = S().activePlanId === p.id; return `<div class="pl-row ${on ? 'on' : ''}"><span class="grow press" data-a="open" data-id="${p.id}"><b>${esc(p.name)}</b><small>${esc(p.goal || '')}${p.goal ? ' · ' : ''}${p.workouts.length} treinos · ${p.weeks} semanas</small></span>${on ? '<span class="pl-tag fill">Ativo</span>' : `<button class="pl-tag press" data-a="use" data-id="${p.id}">Usar</button>`}</div>`; }).join('')}</div>
        <button class="btn ghost block" style="margin-top:12px" data-a="create">${icon('plus', 'sm')}Criar novo plano</button>`,
      actions: {
        open: (ds) => { closeSheet(); push(PlanEditor(ds.id)); },
        use: (ds) => { S().activePlanId = ds.id; Store.save(); toast('Plano ativado'); closeSheet(); refresh(); },
        create: () => { closeSheet(); setTimeout(createSheet, 380); },
      },
    });
    function newPlan() {
      const p = { id: Store.uid('p'), name: 'Meu plano', goal: '', weeks: 4, startDate: Store.iso(Store.weekStartOf(Store.today(), S().settings.weekStart)), workouts: [{ id: Store.uid('w'), letter: 'A', name: 'Treino A', days: [1], items: [] }] };
      S().plans.push(p); if (!Store.activePlan()) S().activePlanId = p.id; Store.save(); push(PlanEditor(p.id));
    }
    function doImport() {
      pickFile('.csv,text/csv,text/plain,text/comma-separated-values', false, (text) => {
        try {
          const r = Store.importPlanCSV(text);
          const p = r.plans[0];
          confirmSheet('Planilha importada', `${r.plans.length} plano(s), ${p.workouts.length} treino(s)${r.created ? ', ' + r.created + ' exercício(s) novo(s) criado(s) sem foto' : ''}. Ativar “${esc(p.name)}” agora?`, 'Ativar', () => { S().activePlanId = p.id; Store.save(); refresh(); });
          refresh();
        } catch (err) { toast(err.message || 'Planilha inválida'); }
      });
    }
    return {
      render() {
        const act = Store.activePlan(), n = S().plans.length;
        const head = `<div class="hello"><div class="t"><h1>Planos</h1></div>${n ? `<button class="icon-btn" data-a="plans" aria-label="Meus planos">${icon('layers', 'sm')}</button>` : ''}</div>`;
        // 7 · Sem plano: convite para começar.
        if (!act) {
          return head + `<div class="content"><div class="pl-empty"><div class="ic">${icon('plans', 'lg')}</div><h2>Vamos montar seu treino</h2><p>Leva menos de 1 minuto. Você pode mudar tudo depois.</p></div>
            ${OPTS.map(([a, ic, t, d, rec]) => `<button class="pl-row press ${rec ? 'rec' : ''}" data-a="${a}"><span class="lt ${rec ? 'on' : ''}">${icon(ic, 'sm')}</span><span class="grow"><b>${t}</b><small>${rec ? 'O app monta para você · recomendado' : d}</small></span>${icon('next', 'sm')}</button>`).join('')}
            <button class="pl-mini press" style="margin-top:4px" data-a="import">${icon('upload', 'sm')}<span class="grow"><b>Importar planilha</b> · Excel ou Google Planilhas</span>${icon('next', 'sm')}</button>
            ${n ? `<button class="pl-mini press" style="margin-top:8px" data-a="plans">${icon('layers', 'sm')}<span class="grow"><b>Meus planos</b> · ${n} salvo${n > 1 ? 's' : ''}, nenhum ativo</span>${icon('next', 'sm')}</button>` : ''}</div>`;
        }
        // 1 · Plano em foco
        const wk = Store.planWeek(act), dow = Store.today().getDay();
        const left = wk.total - wk.n;
        const pct = Math.min(100, Math.max(0, wk.n / wk.total * 100));
        const weekTxt = wk.n >= 1 && wk.n <= wk.total ? `<span>Semana ${wk.n} de ${wk.total}</span><span>${left ? left + (left === 1 ? ' semana restante' : ' semanas restantes') : 'Última semana'}</span>`
          : wk.n > wk.total ? '<span>Duração concluída</span><span>Repita ou crie outro plano</span>' : '<span>Começa em breve</span><span></span>';
        const rows = act.workouts.map((w) => {
          const st = Store.workoutStatus(w).status, today = w.days.includes(dow);
          const tag = st === 'done' ? '<span class="pl-tag ok">Feito</span>' : today ? '<span class="pl-tag fill">Hoje</span>' : st === 'partial' ? '<span class="pl-tag">Em andamento</span>' : icon('next', 'sm');
          return `<button class="pl-row press" data-a="w" data-id="${w.id}"><span class="lt ${st === 'done' ? 'ok' : today ? 'on' : ''}">${esc(w.letter)}</span><span class="grow"><b class="ellipsis">${esc(w.name)}</b><small>${days(w)} · ${w.items.length} exercício${w.items.length === 1 ? '' : 's'} · ~${Screens.estMinutes(w)} min</small></span>${tag}</button>`;
        }).join('');
        const others = n - 1;
        return head + `<div class="content">
          <div class="pl-hero"><span class="pl-tag fill">Plano ativo</span><div class="nm">${esc(act.name)}</div><div class="sb">${esc(act.goal || '')}${act.goal ? ' · ' : ''}${act.workouts.length} treino${act.workouts.length === 1 ? '' : 's'}</div>
            <div class="pl-prog"><i style="width:${pct}%"></i></div><div class="sb pl-wk">${weekTxt}</div>
            <div class="pl-acts"><button class="btn ghost sm press" data-a="edit" data-id="${act.id}">${icon('edit', 'sm')}Editar plano</button><button class="btn ghost sm press pl-share" data-a="share" aria-label="Compartilhar plano">${icon('share', 'sm')}</button></div></div>
          <div class="pl-cap"><span>Treinos do plano</span>${act.workouts.length > 1 ? '<button class="link" data-a="edit" data-id="' + act.id + '">Reordenar</button>' : ''}</div>
          ${rows || '<div class="card small muted">Nenhum treino ainda. Toque em Editar plano para adicionar.</div>'}
          ${Screens.balanceWarnHTML(act) ? `<div style="margin-top:4px">${Screens.balanceWarnHTML(act)}</div>` : ''}
          <button class="btn lime block pl-create" data-a="create">${icon('plus', 'sm')}Criar novo plano</button>
          ${others ? `<button class="pl-mini press" style="margin-top:10px" data-a="plans">${icon('layers', 'sm')}<span class="grow"><b>Meus planos</b> · mais ${others} salvo${others > 1 ? 's' : ''}</span>${icon('next', 'sm')}</button>` : ''}</div>`;
      },
      actions: {
        edit: (ds) => push(PlanEditor(ds.id)),
        w: (ds) => push(WorkoutEditor(Store.activePlan().id, ds.id)),
        share: () => { const p = Store.activePlan(); Native.share('Plano ' + p.name, Store.exportPlanCSV(p), p.name.replace(/[^\w\- ]+/g, '') + '.csv'); },
        create: () => createSheet(),
        plans: () => plansSheet(),
        goal: () => push(Screens.GoalWizard()),
        sports: () => push(Screens.SportList()),
        models: () => modelsSheet(),
        new: () => newPlan(),
        import: () => importSheet(),
        guide: () => push(TechGuide()),
      },
    };
  }

  // ====================== SEÇÕES DO PROGRESSO (deslizar entre elas) ======================
  // Músculos, Recordes, Corpo, Testes e Conquistas ganham uma barra de abas e trocam com o deslizar do dedo.
  // Antes de Músculos fica o Resumo (a própria tela de Progresso).
  // ====================== EDITOR DE PLANO ======================
  // v0.46 (P3 "Resumo e equilíbrio", aprovado em 13/11): capa com o nome, 3 números, Duração com a barra
  // das semanas, treinos com os dias e a alça para arrastar, equilíbrio por músculo depois da lista e menu ⋯.
  const GRIP = '<span class="ed-grip" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>';
  const MORE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0];
  // Séries por semana de cada grupo muscular (cada treino feito uma vez por semana).
  function planSetsByGroup(p) {
    const g = {};
    p.workouts.forEach((w) => w.items.forEach((it) => { const ex = Store.exercise(it.exId); if (!ex || Store.isCardio(ex)) return; g[ex.grupo] = (g[ex.grupo] || 0) + (Number(it.sets) || 0); }));
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }
  function PlanEditor(pid) {
    const nameSheet = () => {
      const p = Store.plan(pid);
      sheet({
        render: () => `<h3>Nome do plano</h3><div class="field"><label>Nome</label><input class="input" id="pnName" value="${esc(p.name)}"></div>
          <div class="field"><label>Objetivo</label><input class="input" id="pnGoal" value="${esc(p.goal || '')}" placeholder="Ex.: Hipertrofia · 5 dias"></div>
          <button class="btn lime block" style="margin-top:16px" data-a="ok">Pronto</button>`,
        actions: { ok: () => { p.name = document.getElementById('pnName').value.trim() || p.name; p.goal = document.getElementById('pnGoal').value.trim(); closeSheet(); refresh(); } },
      });
    };
    const menuSheet = () => {
      const p = Store.plan(pid), active = S().activePlanId === p.id;
      sheet({
        render: () => `<h3>${esc(p.name)}</h3><div class="list">
          <button class="menu-item" data-a="share"><span class="ic">${icon('share', 'sm')}</span><span class="grow">Compartilhar plano<div class="small muted">Planilha CSV para Excel ou Google Planilhas</div></span></button>
          <button class="menu-item" data-a="dup"><span class="ic">${icon('copy', 'sm')}</span><span class="grow">Duplicar plano</span></button>
          ${active ? `<button class="menu-item" data-a="other"><span class="ic">${icon('repeat', 'sm')}</span><span class="grow">Usar outro plano</span></button>` : `<button class="menu-item" data-a="activate"><span class="ic">${icon('check', 'sm')}</span><span class="grow">Usar este plano</span></button>`}
          <button class="menu-item" data-a="del" style="color:var(--red)"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Excluir plano</span></button></div>`,
        actions: {
          share: () => { closeSheet(); Native.share('Plano ' + p.name, Store.exportPlanCSV(p), p.name.replace(/[^\w\- ]+/g, '') + '.csv'); },
          dup: () => {
            closeSheet();
            const c = JSON.parse(JSON.stringify(p)); c.id = Store.uid('p'); c.name += ' (cópia)';
            c.workouts.forEach((w) => { w.id = Store.uid('w'); w.items.forEach((it) => { it.id = Store.uid('i'); }); });
            S().plans.push(c); Store.save(); pop(); toast('Plano duplicado');
          },
          other: () => { closeSheet(); pop(); setTimeout(() => { if (Screens.PlansList) Screens.PlansList(); }, 380); },
          activate: () => { S().activePlanId = pid; Store.save(); closeSheet(); toast('Plano ativado'); refresh(); },
          del: () => { closeSheet(); setTimeout(() => confirmSheet('Excluir plano?', 'Os treinos já registrados continuam no histórico, mas o plano some.', 'Excluir', () => {
            S().plans = S().plans.filter((x) => x.id !== pid);
            if (S().activePlanId === pid) S().activePlanId = S().plans[0] ? S().plans[0].id : null;
            Store.save(); pop();
          }, true), 380); },
        },
      });
    };
    const def = {
      hideNav: true,
      render() {
        const p = Store.plan(pid);
        if (!p) return topbar('Plano') + '<div class="content"></div>';
        const active = S().activePlanId === p.id;
        const ws = p.workouts, perWeek = ws.filter((w) => w.days.length).reduce((a, w) => a + w.days.length, 0) || ws.length;
        const sets = ws.reduce((a, w) => a + w.items.reduce((b, it) => b + (Number(it.sets) || 0), 0), 0);
        const mins = ws.reduce((a, w) => a + Screens.estMinutes(w), 0);
        const pw = Store.planWeek(p), cur = Math.max(0, Math.min(p.weeks, pw.n));
        const end = Store.addDays(Store.parseISO(p.startDate), p.weeks * 7 - 1);
        const bal = planSetsByGroup(p);
        return topbar('Editar plano', `<button class="icon-btn" data-a="menu" aria-label="Mais opções">${MORE}</button>`) +
          `<div class="content ed-c">
          <div class="ed-hero"><div class="ph" style="background-image:url('${Screens.homePhoto(Store.today().getTime() + 4 * Store.DAY)}')"></div><div class="in">${active ? '<span class="ed-badge">Plano ativo</span>' : ''}
            <button class="ed-name" data-a="name"><b>${esc(p.name)}</b>${icon('edit', 'sm')}</button><small>${esc(p.goal || 'Sem objetivo')} · ${ws.length} ${ws.length === 1 ? 'treino' : 'treinos'} por semana</small></div></div>
          <div class="ed-n3"><div><b class="num">${perWeek}</b><small>treinos/sem.</small></div><div><b class="num">${sets}</b><small>séries/sem.</small></div><div><b class="num">${nf(mins / 60, 1)} h</b><small>por semana</small></div></div>
          <div class="ed-box"><div class="l">Duração</div>
            <div class="ed-dur"><div class="stp"><button data-a="wk" data-d="-1">${icon('minus', 'sm')}</button><b class="num">${p.weeks} sem</b><button data-a="wk" data-d="1">${icon('plus', 'sm')}</button></div>
            <label class="dt">${icon('calendar', 'sm')}<span>Início ${shortDate(p.startDate)}</span><input type="date" data-ch="date" value="${p.startDate}"></label></div>
            <div class="ed-weeks">${Array.from({ length: Math.min(p.weeks, 26) }, (_, i) => `<i class="${i + 1 < cur ? 'ok' : i + 1 === cur ? 'cur' : ''}"></i>`).join('')}</div>
            <div class="ed-wl"><span>${cur > 0 && cur <= p.weeks ? 'Semana ' + cur + ' de ' + p.weeks : cur > p.weeks ? 'Plano concluído' : 'Começa em ' + shortDate(p.startDate)}</span><span>termina em ${shortDate(Store.iso(end))}</span></div></div>
          <div class="ed-cap">Treinos${ws.length > 1 ? '<span>Segure ⋮⋮ para mudar a ordem</span>' : ''}</div>
          <div data-sort>${ws.map((w, i) => `<div class="ed-w press" data-a="w" data-id="${w.id}" data-i="${i}"><span class="lt">${esc(w.letter)}</span><div class="g"><b class="ellipsis">${esc(w.name)}</b><small>${w.items.length} exercícios · ~${Screens.estMinutes(w)} min</small>
            <div class="ed-wd">${DAYS_ORDER.map((d) => `<span class="${w.days.includes(d) ? 'on' : ''}">${Store.WEEKDAYS[d]}</span>`).join('')}</div></div>${GRIP}</div>`).join('')}</div>
          <button class="ed-add press" data-a="addW">${icon('plus', 'sm')}Adicionar treino</button>
          ${bal.length ? `<div class="ed-cap">Equilíbrio do plano</div><div class="ed-box"><div class="l">Séries por semana<span>faixa ideal 10–20</span></div>
            <div class="ed-bal">${bal.map(([g, n]) => `<div><span>${esc(g)}</span><i><span class="zone"></span><em class="${n < 10 ? 'lo' : ''}" style="width:${Math.min(100, n / 30 * 100)}%"></em></i><b class="num">${n}</b></div>`).join('')}</div></div>
            ${Screens.balanceWarnHTML(p) ? `<div style="margin-top:10px">${Screens.balanceWarnHTML(p)}</div>` : ''}` : ''}
          </div>`;
      },
      after(el) { UI.sortable(el.querySelector('[data-sort]'), '.ed-w', (a, b) => { UI.moveIn(Store.plan(pid).workouts, a, b); Store.save(); refresh(); }); },
      actions: {
        back: pop,
        menu: menuSheet,
        name: nameSheet,
        date: (ds, el) => { if (el.value) { Store.plan(pid).startDate = el.value; Store.save(); refresh(); } },
        wk: (ds) => { const p = Store.plan(pid); p.weeks = Math.max(1, Math.min(52, p.weeks + Number(ds.d))); Store.save(); Native.vibrate(6); refresh(); },
        w: (ds) => push(WorkoutEditor(pid, ds.id)),
        addW: () => {
          const p = Store.plan(pid);
          const letter = String.fromCharCode(65 + p.workouts.length);
          const w = { id: Store.uid('w'), letter, name: 'Treino ' + letter, days: [], items: [] };
          p.workouts.push(w); Store.save(); push(WorkoutEditor(pid, w.id));
        },
      },
    };
    // Botão Salvar + pergunta ao sair. Compara os dados do plano e a ordem dos treinos.
    return UI.editable(def, {
      label: 'plano',
      snap: () => { const p = Store.plan(pid); return p && { name: p.name, goal: p.goal, weeks: p.weeks, startDate: p.startDate, order: p.workouts.map((w) => w.id) }; },
      restore: (o) => { const p = Store.plan(pid); if (!p) return; Object.assign(p, { name: o.name, goal: o.goal, weeks: o.weeks, startDate: o.startDate }); p.workouts.sort((a, b) => o.order.indexOf(a.id) - o.order.indexOf(b.id)); },
    });
  }

  // ====================== EDITOR DE TREINO ======================
  // " · troca 2:30" (v0.41): descanso maior depois da última série; não no último exercício nem no meio de um bi-set.
  function swapTxt(items, i) {
    if (i === items.length - 1) return '';
    const g = TECH.groupOf(items, i); if (g && i < g.end) return '';
    const b = Store.swapBase(items[i]); return b ? ` <span class="swap-txt">· troca ${restLabel(b)}</span>` : '';
  }
  // v0.46 (E1 "Capa e lista" + T4 "Selo na foto", aprovados em 13/11).
  function WorkoutEditor(pid, wid) {
    const W = () => Store.plan(pid).workouts.find((w) => w.id === wid);
    const nameSheet = () => {
      const w = W();
      sheet({
        render: () => `<h3>Nome do treino</h3><div class="form-row" style="grid-template-columns:90px 1fr"><div class="field"><label>Letra</label><input class="input" id="wnL" maxlength="2" style="text-align:center;font-weight:800;font-size:20px" value="${esc(w.letter)}"></div>
          <div class="field"><label>Nome</label><input class="input" id="wnN" value="${esc(w.name)}" placeholder="Ex.: Peito e Tríceps"></div></div>
          <button class="btn lime block" style="margin-top:16px" data-a="ok">Pronto</button>`,
        actions: { ok: () => { const l = document.getElementById('wnL').value.trim().toUpperCase(); w.letter = l || w.letter; w.name = document.getElementById('wnN').value.trim() || w.name; closeSheet(); refresh(); } },
      });
    };
    const menuSheet = () => sheet({
      render: () => `<h3>${esc(W().name)}</h3><div class="list"><button class="menu-item" data-a="del" style="color:var(--red)"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Excluir treino<div class="small muted">O histórico de treinos já feitos continua salvo.</div></span></button></div>`,
      actions: { del: () => { closeSheet(); setTimeout(() => confirmSheet('Excluir treino?', 'O histórico de treinos já feitos continua salvo.', 'Excluir', () => {
        const p = Store.plan(pid); p.workouts = p.workouts.filter((w) => w.id !== wid); Store.save(); pop();
      }, true), 380); } },
    });
    // Linha de um exercício: selo na foto (chama = técnica, setas = grupo) e texto dourado embaixo.
    function rowHTML(w, it, i) {
      const ex = Store.exercise(it.exId), g = TECH.groupOf(w.items, i), t = it.tech && TECH.get(it.tech.id);
      const det = (ex.tipo === 'tempo' || Store.isCardio(ex) ? Tools.repsText(it, ex) : it.sets + ' × ' + esc(it.reps)) + (Tools.loadText(it.kg, ex) ? ' · ' + Tools.loadText(it.kg, ex) : '') + (Store.isCardio(ex) ? ' · sem descanso' : ' · ' + restLabel(it.rest)) + swapTxt(w.items, i);
      const under = [];
      if (t) under.push(esc(TECH.chip(it)));
      if (g) under.push(g.size === 2 ? esc(g.tech.nome) + (g.pos === 1 ? ' com o próximo' : ' com o anterior') : esc(g.tech.nome) + ' · ' + g.pos + ' de ' + g.size);
      const badge = g ? icon('repeat', 'sm') : t ? icon('flame', 'sm') : '';
      return `<div class="ed-x press ${g ? 'grp' : ''}" data-a="item" data-i="${i}"><span class="n num">${i + 1}</span><div class="ph">${thumb(ex)}${badge ? `<span class="bd">${badge}</span>` : ''}</div>
        <div class="g"><b class="ellipsis">${esc(ex.nome)}</b><small class="num">${det}</small>${under.length ? `<small class="tc">${under.join(' · ')}</small>` : ''}</div>${GRIP}</div>`;
    }
    const def = {
      hideNav: true,
      render() {
        const w = W(); if (!w) return topbar('Treino') + '<div class="content"></div>';
        const sets = w.items.reduce((a, it) => a + (Number(it.sets) || 0), 0);
        return topbar('Editar treino', `<button class="icon-btn" data-a="menu" aria-label="Mais opções">${MORE}</button>`) +
          `<div class="content ed-c">
          <div class="ed-hero"><div class="ph" style="background-image:url('${Screens.homePhoto(Store.today().getTime())}')"></div><div class="in row-in"><span class="ed-lt">${esc(w.letter)}</span>
            <div class="grow" style="min-width:0"><button class="ed-name" data-a="name"><b class="ellipsis">${esc(w.name)}</b>${icon('edit', 'sm')}</button><small>${w.items.length} exercícios · ~${Screens.estMinutes(w)} min · ${sets} séries</small></div></div></div>
          <div class="ed-days">${DAYS_ORDER.map((d) => `<button class="${w.days.includes(d) ? 'on' : ''}" data-a="day" data-d="${d}">${Store.WEEKDAYS[d]}</button>`).join('')}</div>
          <div class="ed-cap">Exercícios${w.items.length > 1 ? '<span>Segure ⋮⋮ para mudar a ordem</span>' : ''}</div>
          <div data-sort>${w.items.map((it, i) => rowHTML(w, it, i)).join('') || '<div class="small muted" style="padding:10px 2px">Nenhum exercício ainda.</div>'}</div>
          <button class="ed-add press" data-a="add">${icon('plus', 'sm')}Adicionar exercício</button></div>`;
      },
      after(el) { UI.sortable(el.querySelector('[data-sort]'), '.ed-x', (a, b) => { UI.moveIn(W().items, a, b); Store.save(); refresh(); }); },
      actions: {
        back: pop,
        menu: menuSheet,
        name: nameSheet,
        day: (ds) => { const w = W(), d = Number(ds.d); w.days = w.days.includes(d) ? w.days.filter((x) => x !== d) : w.days.concat(d).sort(); Store.save(); Native.vibrate(8); refresh(); },
        item: (ds) => itemSheet(W(), Number(ds.i)),
        add: () => push(Library({ pick: (ids) => {
          const w = W();
          ids.forEach((id) => {
            const ex = Store.exercise(id), cardio = Store.isCardio(ex);
            // Cardio: 1 × 20 min, sem descanso. Outros por tempo: 3 × 30 s.
            w.items.push({ id: Store.uid('i'), exId: id, sets: cardio ? 1 : 3, reps: cardio ? '1200' : ex.tipo === 'tempo' ? '30' : '10', kg: 0, rest: cardio ? 0 : S().settings.restDefault, note: '' });
          });
          Store.save(); toast(ids.length + (ids.length === 1 ? ' exercício adicionado' : ' exercícios adicionados'));
        } })),
      },
    };
    // Botão Salvar + pergunta ao sair. Compara o treino inteiro (nome, dias, exercícios e ajustes).
    return UI.editable(def, {
      label: 'treino',
      snap: () => W() || null,
      restore: (o) => { const p = Store.plan(pid); const k = p ? p.workouts.findIndex((w) => w.id === wid) : -1; if (k >= 0) p.workouts[k] = o; },
    });
  }

  // v0.46 · Folha do exercício (aprovada em 13/11): foto grande, 4 quadros com − / + e a lista de Opções.
  function itemSheet(w, i) {
    const it = w.items[i], ex = Store.exercise(it.exId), cardio = Store.isCardio(ex), timed = ex.tipo === 'tempo';
    const bwEx = Store.isBodyweight(ex);
    const bwMode = () => (Number(it.kg) > 0 ? 'mais' : Number(it.kg) < 0 ? 'menos' : 'corpo');
    const box = (label, val, minus, plus, ed) => `<div class="fs-box"><div class="l">${label}</div><div class="r"><button data-a="${minus[0]}" ${minus[1] || ''}>${icon('minus', 'sm')}</button><b class="num" data-a="${ed}">${val}</b><button data-a="${plus[0]}" ${plus[1] || ''}>${icon('plus', 'sm')}</button></div></div>`;
    const repsVal = () => (timed ? restLabel(Number(it.reps) || 30) : esc(it.reps));
    const boxes = () => {
      if (cardio) return `<div class="fs-g">${box('Séries', it.sets, ['st', 'data-k="sets" data-d="-1"'], ['st', 'data-k="sets" data-d="1"'], 'edSets')}${box('Minutos', Tools.minText(Number(it.reps) || 1200).replace(' min', ''), ['mins', 'data-d="-5"'], ['mins', 'data-d="5"'], 'minsEd')}</div>
        <div class="small muted" style="margin:8px 2px 0">Cardio não tem descanso: o treino segue direto para o próximo exercício.</div>`;
      const load = bwEx ? (bwMode() === 'corpo' ? 'Corpo' : (bwMode() === 'mais' ? '+' : '−') + nf(Math.abs(Number(it.kg)))) : nf(it.kg);
      return `<div class="fs-g">${box('Séries', it.sets, ['st', 'data-k="sets" data-d="-1"'], ['st', 'data-k="sets" data-d="1"'], 'edSets')}
        ${box(timed ? 'Tempo' : 'Repetições', repsVal(), ['rp', 'data-d="-1"'], ['rp', 'data-d="1"'], 'edReps')}
        ${box(bwEx ? 'Carga (corpo)' : 'Carga (kg)', load, [bwEx ? 'bwst' : 'st', bwEx ? 'data-d="-1"' : `data-k="kg" data-d="${-(S().settings.incKg || 1)}"`], [bwEx ? 'bwst' : 'st', bwEx ? 'data-d="1"' : `data-k="kg" data-d="${S().settings.incKg || 1}"`], bwEx ? 'bwed' : 'edKg')}
        ${box('Descanso', restLabel(it.rest).replace(' min', ''), ['st', 'data-k="rest" data-d="-15"'], ['st', 'data-k="rest" data-d="15"'], 'edRest')}</div>
        ${bwEx ? `<div class="seg" style="margin-top:10px">${[['corpo', 'Só o corpo'], ['mais', '+ Peso extra'], ['menos', '− Ajuda']].map(([v, l]) => `<button class="${bwMode() === v ? 'on' : ''}" data-a="bw" data-v="${v}">${l}</button>`).join('')}</div>` : ''}`;
    };
    const opts = () => {
      const t = it.tech && TECH.get(it.tech.id), g = TECH.groupOf(w.items, i);
      const swapOn = Number(it.restLast) > 0;
      return `<div class="fs-cap">Opções</div>
        <button class="fs-opt" data-a="pick"><span class="ic">${icon('flame', 'sm')}</span><span class="g"><b>Técnica avançada</b><small>${g ? esc(g.tech.nome) + ' · ' + g.pos + ' de ' + g.size : t ? esc(t.cue(TECH.params(it.tech))) : 'Drop set, rest-pause, pirâmide…'}</small></span><span class="v">${g ? esc(g.tech.nome) : t ? esc(t.nome) : 'Nenhuma'}</span>${icon('next', 'sm')}</button>
        ${cardio ? '' : `<div class="fs-opt" data-a="swapOn"><span class="ic">${icon('timer', 'sm')}</span><span class="g"><b>Troca de exercício</b><small>Descanso maior depois da última série${swapOn ? ': ' + restLabel(Number(it.restLast)) : ''}</small></span><span class="switch ${swapOn ? 'on' : ''}"></span></div>
          ${swapOn ? `<div class="filters fs-swap">${[120, 150, 180, 240].map((o) => `<button class="filter ${Number(it.restLast) === o ? 'on' : ''}" data-a="swapSet" data-v="${o}">${restLabel(o)}</button>`).join('')}</div>` : ''}`}
        ${timed || cardio ? '' : `<div class="fs-opt" data-a="uni"><span class="ic">${icon('repeat', 'sm')}</span><span class="g"><b>Unilateral</b><small>Direito e esquerdo separados</small></span><span class="switch ${Store.isUni(it, ex) ? 'on' : ''}"></span></div>`}
        <button class="fs-opt" data-a="noteEd" style="border:0"><span class="ic">${icon('note', 'sm')}</span><span class="g"><b>Observação</b><small class="ellipsis">${esc(it.note || 'Ex.: pegada fechada')}</small></span>${icon('next', 'sm')}</button>`;
    };
    const again = () => setTimeout(() => itemSheet(w, i), 380);
    sheet({
      render: () => `<div class="fs-hero"><div class="ph" style="background-image:url('${(ex.img || [])[0] || ''}')"></div><div class="in"><h3>${esc(ex.nome)}</h3><small>${esc(ex.grupo)}${ex.equip ? ' · ' + esc(ex.equip) : ''}</small></div></div>
        ${boxes()}${opts()}
        <div class="fs-btns"><button class="btn ghost fs-rm" data-a="rm">${icon('trash', 'sm')}Remover</button><button class="btn lime" data-a="ok">Salvar</button></div>
        <button class="fs-link" data-a="info">${icon('info', 'sm')} Ver como fazer</button>`,
      actions: {
        st: (ds) => { const min = ds.k === 'sets' ? 1 : ds.k === 'rest' ? 5 : 0; it[ds.k] = Math.max(min, Math.round((Number(it[ds.k]) + Number(ds.d)) * 100) / 100); Store.save(); Native.vibrate(6); sheetRefresh(); },
        rp: (ds) => {
          const d = Number(ds.d);
          if (timed) it.reps = String(Math.max(5, (Number(it.reps) || 30) + d * 5));
          else { const n = String(it.reps).match(/\d+/g); if (!n) it.reps = '10'; else it.reps = String(it.reps).replace(/\d+/g, (x) => String(Math.max(1, Number(x) + d))); }
          Store.save(); Native.vibrate(6); sheetRefresh();
        },
        edSets: () => numberSheet('Séries', it.sets, 1, (v) => { it.sets = Math.max(1, Math.round(v)); Store.save(); refresh(); again(); }),
        edKg: () => numberSheet('Carga (kg)', it.kg, 0.5, (v) => { it.kg = Math.max(0, v); Store.save(); refresh(); again(); }),
        edRest: () => numberSheet('Descanso (segundos)', it.rest, 5, (v) => { it.rest = Math.max(5, Math.round(v)); Store.save(); refresh(); again(); }),
        edReps: () => {
          if (timed) { numberSheet('Tempo (segundos)', Number(it.reps) || 30, 5, (v) => { it.reps = String(Math.max(5, Math.round(v))); Store.save(); refresh(); again(); }); return; }
          sheet({
            render: () => `<h3>Repetições</h3><div class="desc">Um número (10) ou uma faixa (8-12).</div><input class="input num" id="repsIn" value="${esc(it.reps)}" style="font-size:24px;height:60px;text-align:center;font-weight:700">
              <div class="filters" style="flex-wrap:wrap;margin:12px 0 0">${['6-8', '8-10', '8-12', '10-12', '12-15', '5', '10', '15'].map((r) => `<button class="filter" data-a="set" data-v="${r}">${r}</button>`).join('')}</div>
              <button class="btn lime block" style="margin-top:16px" data-a="ok">Pronto</button>`,
            after: (el) => setTimeout(() => el.querySelector('#repsIn').focus(), 300),
            actions: { set: (ds) => { document.getElementById('repsIn').value = ds.v; }, ok: () => { it.reps = document.getElementById('repsIn').value.trim() || '10'; Store.save(); closeSheet(); refresh(); again(); } },
          });
        },
        swapOn: () => { if (Number(it.restLast) > 0) delete it.restLast; else it.restLast = Math.max(120, Math.ceil(((Number(it.rest) || S().settings.restDefault) + 60) / 30) * 30); Store.save(); Native.vibrate(6); sheetRefresh(); },
        swapSet: (ds) => { it.restLast = Number(ds.v); Store.save(); Native.vibrate(6); sheetRefresh(); },
        uni: () => { it.uni = !Store.isUni(it, ex); Store.save(); Native.vibrate(6); sheetRefresh(); },
        bw: (ds) => { const m = Math.abs(Number(it.kg) || 0) || 5; it.kg = ds.v === 'corpo' ? 0 : ds.v === 'mais' ? m : -m; Store.save(); Native.vibrate(6); sheetRefresh(); },
        bwst: (ds) => {
          if (bwMode() === 'corpo') { it.kg = Number(ds.d) > 0 ? (S().settings.incKg || 1) : 0; Store.save(); sheetRefresh(); return; }
          const sign = Number(it.kg) < 0 ? -1 : 1, inc = S().settings.incKg || 1;
          const m = Math.round((Math.abs(Number(it.kg) || 0) + Number(ds.d) * inc) * 100) / 100;
          it.kg = m <= 0 ? 0 : sign * m; Store.save(); Native.vibrate(6); sheetRefresh();
        },
        bwed: () => { const sign = Number(it.kg) < 0 ? -1 : 1; numberSheet(sign < 0 ? 'Ajuda (kg)' : 'Peso extra (kg)', Math.abs(Number(it.kg) || 0), 0.5, (v) => { it.kg = sign * Math.max(0, v); Store.save(); refresh(); again(); }); },
        mins: (ds) => { it.reps = String(Math.max(60, Math.round((Number(it.reps) || 1200) / 60 + Number(ds.d)) * 60)); it.rest = 0; Store.save(); Native.vibrate(6); sheetRefresh(); },
        minsEd: () => numberSheet('Tempo (minutos)', Math.round((Number(it.reps) || 1200) / 60), 1, (v) => { it.reps = String(Math.max(1, Math.round(v)) * 60); it.rest = 0; Store.save(); refresh(); again(); }, 'min'),
        noteEd: () => sheet({
          render: () => `<h3>Observação</h3><div class="desc">${esc(ex.nome)} · aparece neste treino.</div><input class="input" id="noteIn" value="${esc(it.note || '')}" placeholder="Ex.: pegada fechada"><button class="btn lime block" style="margin-top:16px" data-a="ok">Pronto</button>`,
          after: (el) => setTimeout(() => el.querySelector('#noteIn').focus(), 300),
          actions: { ok: () => { it.note = document.getElementById('noteIn').value; Store.save(); closeSheet(); again(); } },
        }),
        pick: () => techPicker(w, i),
        info: () => { closeSheet(); push(ExerciseDetail(it.exId)); },
        rm: () => { w.items.splice(i, 1); Store.save(); closeSheet(); refresh(); },
        ok: () => { closeSheet(); refresh(); const t = UI.R.stack[UI.R.stack.length - 1]; if (t && t.commit) t.commit('✓ Exercício salvo'); else toast('✓ Exercício salvo'); },
      },
    });
  }

  // v0.46 · Técnica avançada: TA "Abas e desenho" para escolher + TC "Prévia antes de aplicar" (aprovadas em 13/11).
  // Desenho de cada técnica: barras (altura em %); 's' = mini-série, 'p' = pausa.
  const TDIAG = {
    drop: [100, 70, 45], mecanico: [100, 's80'], restpause: [100, 's35', 's30'], myoreps: [90, 's30', 's30', 's30'], parciais: [100, 's40'], forcadas: [100, 's50'], backoff: [100, 'p20', 's65'],
    fst7: [60, 60, 60, 60, 60, 60, 60], gvt: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50], pircresc: [40, 55, 70, 85, 100], pirdecr: [100, 85, 70, 55, 40], w531: [70, 80, 95], cluster: [60, 'p15', 60, 'p15', 60], r21: [45, 45, 90],
    biset: [80, 80], superset: [80, 's80'], preexaustao: ['s60', 90], posexaustao: [90, 's60'], triset: [70, 70, 70], gigante: [60, 60, 60, 60],
    negativa: [30, 60, 90], isometria: [70, 70, 70], cadencia: [40, 80, 40], umaemeia: [60, 100, 60],
  };
  const diag = (id) => `<span class="tp-dia">${(TDIAG[id] || [70, 70, 70]).map((v) => { const s = String(v), k = s[0] === 's' ? 's' : s[0] === 'p' ? 'p' : '', h = parseFloat(s.replace(/[sp]/, '')); return `<i class="${k}" style="height:${h}%"></i>`; }).join('')}</span>`;
  const PL = { qtd: ['Quantas vezes', 1, 1], pct: ['Tira da carga (%)', 5, 0], pausa: ['Pausa (s)', 5, 3], reps: ['Repetições', 1, 1], seg: ['Segundos', 1, 1], extra: ['Repetições a mais', 1, 0] };
  function techPicker(w, i) {
    const it = w.items[i];
    let cat = (it.tech && TECH.get(it.tech.id) && TECH.get(it.tech.id).cat) || (it.group && it.group.type && TECH.get(it.group.type) && 'combinar') || TECH.CATS[0].id;
    const back = () => setTimeout(() => itemSheet(w, i), 380);
    const chosenG = () => TECH.groupOf(w.items, i), chosenT = () => it.tech && TECH.get(it.tech.id);
    sheet({
      render: () => {
        const g = chosenG(), t = chosenT();
        const cur = g ? g.tech.nome + ' · ' + g.pos + ' de ' + g.size : t ? t.nome + ' · ' + TECH.chip(it).replace(t.nome, '').replace(/^\s*·?\s*/, '') : '';
        return `<h3>Técnica avançada</h3><div class="desc">${esc(Store.exercise(it.exId).nome)} · toque para ver e aplicar</div>
          ${cur ? `<div class="tp-cur">${icon(g ? 'repeat' : 'flame', 'sm')}<span>Escolhida: <b>${esc(cur.replace(/ · $/, ''))}</b></span><button data-a="none">Tirar</button></div>` : ''}
          <div class="tp-tabs">${TECH.CATS.map((c) => `<button class="${c.id === cat ? 'on' : ''}" data-a="cat" data-c="${c.id}">${esc(c.nome)}</button>`).join('')}</div>
          <div class="small muted" style="margin:8px 2px 2px">${esc(TECH.CATS.find((c) => c.id === cat).desc)}</div>
          ${TECH.LIST.filter((x) => x.cat === cat).map((x) => { const on = (t && t.id === x.id) || (g && g.tech.id === x.id); return `<button class="tp-card ${on ? 'on' : ''}" data-a="see" data-t="${x.id}">${diag(x.id)}<span class="g"><b>${esc(x.nome)}${x.mode === 'group' ? ` <small class="tp-n">${x.size}${x.size === 4 ? '+' : ''} exercícios</small>` : ''}</b><small>${esc(x.resumo)}</small></span>${on ? `<span class="tp-ok">${icon('check', 'sm')}</span>` : ''}</button>`; }).join('')}
          <button class="fs-link" data-a="guide">${icon('info', 'sm')} Ver guia das técnicas</button>`;
      },
      actions: {
        cat: (ds) => { cat = ds.c; sheetRefresh(); },
        see: (ds) => { closeSheet(); setTimeout(() => techPreview(w, i, ds.t), 300); },
        none: () => { const g = chosenG(); if (g) for (let k = g.start; k <= g.end; k++) w.items[k].group = null; it.tech = null; Store.save(); closeSheet(); refresh(); back(); },
        guide: () => { closeSheet(); push(TechGuide()); },
      },
    });
  }
  const repsOf = (r) => { const m = String(r).match(/\d+/g); return m ? Number(m[m.length - 1]) : 10; };
  function techPreview(w, i, tid) {
    const it = w.items[i], t = TECH.get(tid), ex = Store.exercise(it.exId);
    const draft = JSON.parse(JSON.stringify(it));
    if (t.mode !== 'group') { draft.tech = Object.assign({ id: tid }, (it.tech && it.tech.id === tid) ? it.tech : {}); TECH.applyScheme(draft, tid); }
    const p = () => TECH.params(draft.tech);
    const preview = () => {
      if (t.mode === 'group') {
        if (i + t.size > w.items.length) return `<div class="tp-prev"><div class="warn">${esc(t.nome)} precisa de ${t.size} exercícios a partir deste. Adicione ou reordene antes.</div></div>`;
        return `<div class="tp-prev">${w.items.slice(i, i + t.size).map((x, k) => `<div><span>${k + 1}. ${esc(Store.exercise(x.exId).nome)}</span><b>${x.sets} × ${esc(x.reps)}</b></div>${k < t.size - 1 ? '<div class="d"><span>↳ sem descanso</span><b></b></div>' : ''}`).join('')}<div class="d"><span>↳ descanso depois do grupo</span><b>${restLabel(w.items[i + t.size - 1].rest)}</b></div></div>`;
      }
      let rows = [];
      try { rows = TECH.buildSets(draft, null, S().settings.incKg || 2, repsOf, 1); } catch (e) { rows = []; }
      const kgT = (k) => (Number(k) ? nf(k) + ' kg' : Store.isBodyweight(ex) ? 'corpo' : '—');
      const mains = rows.filter((r) => !r.sub), firstSub = rows.findIndex((r) => r.sub);
      const out = [];
      if (firstSub > 1 && rows.slice(0, firstSub).every((r) => !r.sub && r.kg === rows[0].kg && String(r.reps) === String(rows[0].reps))) out.push([`Séries 1 a ${firstSub}`, kgT(rows[0].kg) + ' × ' + rows[0].reps, '']);
      rows.forEach((r, k) => { if (firstSub > 1 && k < firstSub && out.length) return; out.push([r.sub ? '↳ ' + (r.label || 'extra') : 'Série ' + r.n, kgT(r.kg) + ' × ' + (r.sub && !r.target ? 'até a falha' : (r.target || r.reps)), r.sub ? 'd' : '']); });
      return `<div class="tp-prev">${out.slice(0, 9).map(([a, b, c]) => `<div class="${c}"><span>${esc(a)}</span><b>${esc(String(b))}</b></div>`).join('')}${out.length > 9 ? `<div><span>… mais ${out.length - 9}</span><b></b></div>` : ''}${!mains.length ? '' : ''}</div>`;
    };
    const keys = () => (t.mode === 'group' ? [] : Object.keys(t.params || {}).filter((k) => PL[k] && !(k === 'pct' && tid !== 'drop' && tid !== 'backoff')));
    sheet({
      render: () => `<button class="tp-back" data-a="back">${icon('back', 'sm')}${esc(TECH.CATS.find((c) => c.id === t.cat).nome)}</button>
        <h3>${esc(t.nome)}</h3><div class="desc">${esc(t.resumo)}</div>
        ${keys().length || (t.params && ('todas' in t.params || 'tempo' in t.params)) ? `<div class="fs-cap">Ajuste</div><div class="fs-g">${keys().map((k) => `<div class="fs-box"><div class="l">${PL[k][0]}</div><div class="r"><button data-a="tp" data-k="${k}" data-d="${-PL[k][1]}">${icon('minus', 'sm')}</button><b class="num">${p()[k]}${k === 'pct' ? '%' : ''}</b><button data-a="tp" data-k="${k}" data-d="${PL[k][1]}">${icon('plus', 'sm')}</button></div></div>`).join('')}</div>
          ${t.params && 'todas' in t.params ? `<div class="fs-opt" data-a="todas" style="border:0"><span class="g"><b>Em todas as séries</b><small>Desligado: só na última</small></span><span class="switch ${p().todas ? 'on' : ''}"></span></div>` : ''}
          ${t.params && 'tempo' in t.params ? `<div class="field"><label>Cadência (desce-pausa-sobe)</label><input class="input" data-in="tempo" value="${esc(p().tempo)}" placeholder="3-1-1"></div>` : ''}` : ''}
        <div class="fs-cap">Como fica no treino</div>${preview()}
        <div class="fs-btns"><button class="btn ghost" data-a="back">Voltar</button><button class="btn lime" data-a="apply" ${t.mode === 'group' && i + t.size > w.items.length ? 'disabled' : ''}>Aplicar ${esc(t.nome.toLowerCase())}</button></div>`,
      actions: {
        back: () => { closeSheet(); setTimeout(() => techPicker(w, i), 300); },
        tp: (ds) => { draft.tech[ds.k] = Math.max(PL[ds.k][2], Number(p()[ds.k]) + Number(ds.d)); Native.vibrate(6); sheetRefresh(); },
        todas: () => { draft.tech.todas = !p().todas; sheetRefresh(); },
        tempo: (ds, el) => { draft.tech.tempo = el.value.trim() || '3-1-1'; },
        apply: () => {
          if (t.mode === 'group') {
            const gid = Store.uid('g');
            for (let k = i; k < i + t.size; k++) { const old = TECH.groupOf(w.items, k); if (old) for (let m = old.start; m <= old.end; m++) w.items[m].group = null; }
            for (let k = i; k < i + t.size; k++) w.items[k].group = { id: gid, type: t.id };
            toast(`${t.nome}: ${t.size} exercícios agrupados`);
          } else {
            Object.assign(it, { tech: draft.tech, sets: draft.sets, reps: draft.reps, rest: draft.rest });
            toast(t.nome + ' aplicado');
          }
          Store.save(); closeSheet(); refresh(); setTimeout(() => itemSheet(w, i), 380);
        },
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
  // v0.46 · Progresso P1 com os Destaques D4 (aprovado em 13/11): período, 4 números, dois blocos de destaque
  // (Recordes no período e Sequência) e Explorar com 6 atalhos. As subpáginas abrem sem a fileira de abas.
  function Progress() {
    let period = 8;
    return {
      render() {
        const head = `<div class="hello"><div class="t"><h1>Progresso<span>e evolução</span></h1></div></div>`;
        const done = (s) => s.sets.some((x) => x.done);
        if (!S().sessions.some(done)) {
          return head + `<div class="content"><div class="card empty appear"><div class="ic">${icon('chart', 'lg')}</div><h3>Seus gráficos aparecem aqui</h3><p>Registre o primeiro treino para acompanhar constância, cargas e volume.</p><button class="btn ghost sm" style="margin-top:14px" data-a="demo">Ver com dados de exemplo</button></div>
            <div class="pg-cap">Explorar</div>${explore(0, 0)}</div>`;
        }
        const weeks = Store.weeksBack(period), from = weeks[0].startISO;
        const prevFrom = Store.iso(Store.addDays(Store.parseISO(from), -7 * period));
        const ss = S().sessions.filter((s) => s.date >= from && done(s));
        const prev = S().sessions.filter((s) => s.date >= prevFrom && s.date < from && done(s));
        const vol = ss.reduce((a, s) => a + Store.sessionVolume(s), 0);
        const fin = ss.filter((s) => s.end), avg = fin.length ? Math.round(fin.reduce((a, s) => a + Store.sessionDuration(s), 0) / fin.length) : 0;
        // Semanas seguidas com pelo menos um treino (contando a atual só se já tiver treino).
        const wk = Store.weeksBack(52).reverse();
        let streak = 0;
        for (let i = 0; i < wk.length; i++) { const has = S().sessions.some((s) => done(s) && s.date >= wk[i].startISO && s.date <= wk[i].endISO); if (has) streak++; else if (i > 0) break; }
        const last6 = Store.weeksBack(6).map((w) => S().sessions.some((s) => done(s) && s.date >= w.startISO && s.date <= w.endISO));
        // Recordes no período: quantos e o maior salto.
        const recs = [];
        ss.slice().sort((a, b) => a.start - b.start).forEach((s) => Store.sessionRecords(s).forEach((r) => recs.push(r)));
        const big = recs.slice().sort((a, b) => (b.kg - b.prev) - (a.kg - a.prev))[0];
        const diff = ss.length - prev.length;
        return head + `<div class="content pg-c">
          <div class="pg-seg">${[[4, '4 sem'], [8, '8 sem'], [12, '3 meses'], [52, '1 ano']].map(([n, l]) => `<button class="${period === n ? 'on' : ''}" data-a="period" data-n="${n}">${l}</button>`).join('')}</div>
          <div class="pg-n2"><div><b class="num">${ss.length}</b><small>treinos${prev.length || diff ? ' · ' + (diff >= 0 ? '↑ ' : '↓ ') + Math.abs(diff) + ' vs. antes' : ''}</small></div><div><b class="num">${volume(vol)}</b><small>volume levantado</small></div>
            <div><b class="num">${streak}<small> sem</small></b><small>seguidas treinando</small></div><div><b class="num">${avg}<small> min</small></b><small>duração média</small></div></div>
          <div class="pg-cap">Destaques</div>
          <div class="pg-d2"><button class="pg-gold press" data-a="records"><span class="k">Recordes no período</span><b class="num">${recs.length}</b><small>${big ? 'o maior: ' + esc(Store.exercise(big.exId).nome) + '<br>' + kg(big.prev) + ' → ' + kg(big.kg) : 'Bata uma marca para ver aqui'}</small><span class="big">${icon('trophy')}</span></button>
            <button class="pg-card press" data-a="hist"><span class="k">Sequência</span><b class="num">${streak} ${streak === 1 ? 'semana' : 'semanas'}</b><small>treinando sem falhar</small><span class="bars">${last6.map((x) => `<i class="${x ? 'on' : ''}"></i>`).join('')}</span></button></div>
          <div class="pg-cap">Explorar</div>${explore(recs.length, ss.length)}</div>`;
      },
      actions: {
        period: (ds) => { period = Number(ds.n); refresh(); },
        demo: () => { if (!Store.activePlan()) { toast('Escolha um plano primeiro, em Planos'); return; } Store.seedDemo(); refresh(); toast('Dados de exemplo criados. Remova em Configurações.'); },
        muscles: () => push(Screens.MuscleMap()),
        records: () => push(Screens.Records()),
        body: () => push(Screens.Body()),
        tests: () => push(Screens.Tests()),
        medals: () => push(Screens.Medals()),
        hist: () => push(Screens.History()),
      },
    };
    function explore(nRec, nSess) {
      const got = Analytics.earned().size;
      const T = [['muscles', 'chart', 'Músculos', 'mapa e equilíbrio'], ['records', 'trophy', 'Recordes', nRec ? nRec + (nRec === 1 ? ' novo' : ' novos') : 'suas marcas'], ['body', 'weight', 'Corpo', 'peso e fotos'],
        ['tests', 'target', 'Testes', 'salto, sprint…'], ['medals', 'star', 'Conquistas', got + ' de ' + Analytics.MEDALS.length], ['hist', 'calendar', 'Histórico', nSess ? nSess + ' treinos' : 'seus treinos']];
      return `<div class="pg-ex">${T.map(([a, ic, l, d]) => `<button class="press" data-a="${a}">${icon(ic, 'sm')}<b>${l}</b><small>${d}</small></button>`).join('')}</div>`;
    }
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
    const stepRow = (label, sub, key, d, fmt, min) => `<div class="switch-row ${key === 'restSwap' ? 'swap-row' : ''}"><div class="grow"><div>${label}</div><div class="small muted">${sub}</div></div><div class="stepper" style="width:150px"><button data-a="st" data-k="${key}" data-d="${-d}" data-min="${min}">${icon('minus', 'sm')}</button><div class="val"><b class="num" style="font-size:15px">${fmt(st()[key])}</b></div><button data-a="st" data-k="${key}" data-d="${d}" data-min="${min}">${icon('plus', 'sm')}</button></div></div>`;
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
          ${stepRow('Troca de exercício', 'A mais no descanso depois da última série de cada exercício', 'restSwap', 30, (v) => (Number(v) ? '+' + restLabel(Number(v)) : 'Igual'), 0)}
          ${stepRow('Incremento de carga', 'Botões +/− e sugestões', 'incKg', 0.5, (v) => nf(v) + ' kg', 0.5)}
          ${stepRow('Peso da barra', 'Para a calculadora de anilhas', 'bar', 2.5, (v) => nf(v) + ' kg', 5)}
          <div class="switch-row"><div class="grow"><div>Semana começa</div></div><div class="seg" style="width:170px"><button class="${st().weekStart === 1 ? 'on' : ''}" data-a="ws" data-v="1">Segunda</button><button class="${st().weekStart === 0 ? 'on' : ''}" data-a="ws" data-v="0">Domingo</button></div></div>
          ${sw('Sugerir aumento de carga', 'Pelas repetições e pelo esforço (RIR)', 'suggest')}
          <div class="switch-row" style="flex-wrap:wrap"><div class="grow"><div>Progressão pela faixa de repetições</div><div class="small muted">Exercícios com faixa (ex.: 8–12): bateu o topo em todas as séries, a carga sobe e volta para o início</div></div>
            <div class="seg" style="width:100%;margin-top:8px">${[['ask', 'Perguntar'], ['auto', 'Automática'], ['off', 'Desligada']].map(([v, l]) => `<button class="${(st().rangeMode || 'ask') === v ? 'on' : ''}" data-a="rangeMode" data-v="${v}">${l}</button>`).join('')}</div></div>
          ${sw('Perguntar como você está hoje', 'Sono, energia e dor antes do treino · dia ruim alivia o treino', 'checkin')}
          ${sw('Perguntar como foi a série', 'No limite, pesado ou tranquilo · ajuda a sugerir a carga', 'askRir')}
          ${sw('Som no fim do descanso', 'Bipes 3, 2, 1 e sinal de largada', 'sound')}
          <button class="menu-item" data-a="voice"><span class="ic">${icon('play', 'sm')}</span><span class="grow">Voz no treino<div class="small muted">${Voice.cfg().on ? 'Ligada · ' + Voice.count() + ' de ' + Voice.OPTS.length + ' avisos' : 'Desligada · só os bipes'}</div></span>${icon('next', 'sm')}</button>
          <button class="menu-item" data-a="gym"><span class="ic">${icon('dumbbell', 'sm')}</span><span class="grow">Minha academia<div class="small muted">Aparelhos que a sua academia tem · o app só sugere esses</div></span>${icon('next', 'sm')}</button>
          ${window.Android ? `<button class="menu-item" data-a="band"><span class="ic">${icon('timer', 'sm')}</span><span class="grow">Aviso na pulseira ou relógio<div class="small muted">Galaxy Fit, Galaxy Watch e outros: vibra no pulso quando o descanso acaba</div></span>${icon('next', 'sm')}</button>` : ''}
          ${sw('Vibração', 'Ao concluir séries e no fim do descanso', 'vibrate')}
          ${sw('Abertura animada', 'Scouter ao abrir o app (toque para pular)', 'splash')}
</div>
        <div class="section-title"><h2>Lembrete de treino</h2></div><div class="card" style="padding:4px 16px">
          ${sw('Lembrar de treinar', 'Notificação nos dias do plano', 'reminder')}
          ${st().reminder ? `<div class="switch-row"><div class="grow">Horário</div><input class="input" type="time" style="width:130px;height:44px" data-ch="rtime" value="${esc(st().reminderTime)}"></div>` : ''}</div>
        <div class="section-title"><h2>App</h2></div><div class="card" style="padding:4px 16px">
          <button class="menu-item" data-a="checkUpdate"><span class="ic">${icon('download', 'sm')}</span><span class="grow">Verificar atualizações<div class="small muted">Versão instalada: ${News.VERSION}${Updater.available ? ' · nova: ' + esc(Updater.available.versionName) : ''}</div></span></button>
          ${sw('Avisar quando sair versão nova', window.Android ? 'Consulta ao abrir o app, se houver internet' : 'Mostra o aviso para recarregar na hora', 'updateCheck')}
          <button class="menu-item" data-a="news"><span class="ic">${icon('sparkle', 'sm')}</span><span class="grow">Novidades<div class="small muted">O que mudou em cada versão</div></span>${icon('next', 'sm')}</button>
          <button class="menu-item" data-a="tips"><span class="ic">${icon('info', 'sm')}</span><span class="grow">Você sabia?<div class="small muted">${window.TipsFx ? TipsFx.discovered() + ' de ' + TipsFx.TIPS.length + ' funções descobertas' : 'Funções do app'}</div></span>${icon('next', 'sm')}</button></div>
        <div class="section-title"><h2>Seus dados</h2></div><div class="card" style="padding:4px 16px">
          ${sw('Backup automático semanal', window.Android ? 'Salva toda semana em Downloads/Gravity (guarda os 4 últimos)' + (st().lastBackup ? ' · último: ' + new Date(st().lastBackup).toLocaleDateString('pt-BR') : '') : 'Lembra toda semana de salvar o backup' + (st().lastBackup ? ' · último: ' + new Date(st().lastBackup).toLocaleDateString('pt-BR') : ''), 'autoBackup')}
          <button class="menu-item" data-a="export"><span class="ic">${icon('download', 'sm')}</span><span class="grow">Fazer backup<div class="small muted">Envie para o Drive, WhatsApp ou e-mail</div></span></button>
          <button class="menu-item" data-a="import"><span class="ic">${icon('upload', 'sm')}</span><span class="grow">Restaurar backup<div class="small muted">Substitui os dados atuais</div></span></button>
          <button class="menu-item" data-a="demo"><span class="ic">${icon('sparkle', 'sm')}</span><span class="grow">${S().sessions.some((s) => s.demo) ? 'Remover dados de exemplo' : 'Criar dados de exemplo'}<div class="small muted">Para ver os gráficos funcionando</div></span></button>
          <button class="menu-item danger" data-a="reset"><span class="ic">${icon('trash', 'sm')}</span><span class="grow">Apagar tudo</span></button></div>
        <div class="tiny faint" style="text-align:center;margin-top:20px">Gravity · versão de teste<br>Fotos dos exercícios: Free Exercise DB (domínio público)</div></div>`,
      actions: {
        back: pop,
        name: (ds, el) => { st().name = el.value.trim(); Store.save(); UI.savedFlash(); },
        st: (ds) => { st()[ds.k] = Math.max(Number(ds.min), Math.round((Number(st()[ds.k]) + Number(ds.d)) * 10) / 10); Store.save(); Native.vibrate(6); refresh(); UI.savedFlash(); },
        band: () => sheet({
          render: () => `<h3>Aviso na pulseira</h3><div class="desc">Quando o descanso acaba, o Gravity mostra a notificação <b>“Bora! Descanso acabou”</b> com a próxima série. Pulseiras e relógios recebem essa notificação e vibram no pulso. Para ligar numa Galaxy Fit (ou Galaxy Watch):</div>
            <div class="list">
              <div class="menu-item"><span class="ic">1</span><span class="grow">Abra o app <b>Galaxy Wearable</b> no celular</span></div>
              <div class="menu-item"><span class="ic">2</span><span class="grow">Toque em <b>Notificações</b> e ligue o <b>Gravity</b> na lista de apps</span></div>
              <div class="menu-item"><span class="ic">3</span><span class="grow">Ainda em Notificações, ligue <b>Mostrar com o celular em uso</b> (ou desligue “Só quando o celular não estiver em uso”). Sem isso, a pulseira não vibra enquanto o Gravity está aberto na tela</span></div>
            </div><div class="tiny muted" style="margin-top:12px">Os nomes das opções podem mudar um pouco conforme a versão. Em outras marcas, o caminho é parecido: app da pulseira → Notificações → Gravity.</div>
            <button class="btn lime block" style="margin-top:16px" data-a="ok">Entendi</button>`,
          actions: { ok: closeSheet },
        }),
        checkUpdate: () => Updater.check(true),
        news: () => push(News.History()),
        tips: () => push(TipsFx.Collection()),
        rangeMode: (ds) => { st().rangeMode = ds.v; Store.save(); UI.savedFlash(); refresh(); },
        theme: (ds) => { Theme.apply(ds.v); Store.save(); Native.vibrate(8); UI.savedFlash(); refresh(); },
        sw: (ds) => { st()[ds.k] = !st()[ds.k]; Store.save(); if (ds.k === 'reminder') { Screens.syncNative(); if (st().reminder) toast('Lembrete às ' + st().reminderTime + ' nos dias do plano'); else UI.savedFlash(); } else UI.savedFlash(); refresh(); },
        voice: () => push(Screens.VoiceSettings()),
        gym: () => push(GymSetup()),
        avatar: () => Profile.sheet(UI.refresh),
        ws: (ds) => { st().weekStart = Number(ds.v); Store.save(); refresh(); UI.savedFlash(); },
        rtime: (ds, el) => { if (el.value) { st().reminderTime = el.value; Store.save(); Screens.syncNative(); toast('Lembrete às ' + el.value); } },
        export: () => { Native.share('Backup Gravity', Store.exportBackup(), 'gravity-backup-' + Store.iso(Store.today()) + '.json'); Store.backupDone(); refresh(); },
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

  Object.assign(window.Screens, { PlansCreate: () => Plans().actions.create(), PlansList: () => Plans().actions.plans(), GymSetup, lineChart, TechGuide, Library, ExerciseDetail, ExerciseForm, Plans, PlanEditor, WorkoutEditor, Progress, SessionDetail, Settings });
})();
