// Telas de acompanhamento: mapa muscular, recordes, corpo (peso, medidas, fotos), conquistas,
// calendário anual e imagem do resumo para compartilhar.
(function () {
  'use strict';
  const { icon, esc, nf, kg, volume, shortDate, Native, toast, push, pop, refresh, sheet, closeSheet, sheetRefresh, confirmSheet, numberSheet } = UI;
  const S = () => Store.state;
  const topbar = (title, right) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${title}</h1>${right || ''}</div>`;

  // ====================== BONECO ANATÔMICO ======================
  // Imagem realista (homem ou mulher) com os músculos pintados por cima: js/anatomy-real.js.
  // color(regiao) devolve a cor, ou '' para o músculo sem destaque.
  const bodySVG = (color, height) => AnatomyReal.bodySVG(color, height);
  // Cores: volume (abaixo / ideal / acima) e recuperação (cansado → recuperado).
  const cssv = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d);
  const VCOL = { zero: '', get pouco() { return cssv('--map-low', 'rgba(245,197,24,.38)'); }, get ideal() { return cssv('--map-ideal', '#f5c518'); }, alto: '#d0803e' };
  function recColor(v) { return v >= 0.95 ? VCOL.ideal : v >= 0.6 ? '#d0a04e' : v >= 0.3 ? '#d0803e' : '#c8574b'; }

  function volumeData() {
    const st = Analytics.volumeStatus(Analytics.setsByRegion());
    const map = {}; st.forEach((r) => { map[r.id] = r; });
    return { st, map };
  }
  // Resumo em uma frase para a tela inicial.
  function volumeSummary(st) {
    const low = st.filter((r) => r.st === 'pouco' || r.st === 'zero').map((r) => r.nome);
    const high = st.filter((r) => r.st === 'alto').map((r) => r.nome);
    if (!st.some((r) => r.n > 0)) return 'Ainda sem séries nesta semana.';
    const parts = [];
    if (high.length) parts.push(`acima do ideal: ${high.join(', ')}`);
    if (low.length) parts.push(`abaixo: ${low.slice(0, 3).join(', ')}${low.length > 3 ? ' e +' + (low.length - 3) : ''}`);
    return parts.length ? parts.join(' · ') : 'Todos os músculos na faixa ideal.';
  }

  // Alertas diretos para a tela inicial ("Posterior: 4 de 10 séries").
  function volumeAlertsHTML(max) {
    const al = Analytics.volumeAlerts().slice(0, max || 3);
    if (!al.length) return '';
    return `<div class="mv-alerts">${al.map((r) => `<div class="${r.low ? 'low' : 'high'}"><b>${esc(r.nome)}:</b> ${nf(r.n)} de ${r.low ? r.alvo[0] : r.alvo[1]} séries${r.low ? '' : ' (acima da meta)'}</div>`).join('')}</div>`;
  }
  // Equilíbrio empurrar × puxar e quadríceps × posterior.
  const balLine = (x) => `<div class="low"><b>${x.a} ${nf(x.A)} × ${x.b} ${nf(x.B)}:</b> ${esc(x.fix)}</div>`;
  function balanceAlertsHTML() {
    const off = Analytics.balanceNow().list.filter((x) => x.off);
    return off.map(balLine).join('');
  }
  function balanceCard() {
    const bn = Analytics.balanceNow();
    return `<div class="card bal-card">${bn.list.map((x) => {
      const tot = x.A + x.B, pa = tot ? x.A / tot * 100 : 50;
      return `<div class="bal-row ${x.off ? 'off' : ''}"><div class="row"><span class="grow">${x.a} <b class="num">${nf(x.A)}</b></span><span>${x.b} <b class="num">${nf(x.B)}</b></span></div>
        <div class="bal-bar"><i style="width:${pa}%"></i><span class="mid"></span></div>
        <div class="small ${x.off ? '' : 'muted'}" style="margin-top:6px">${tot ? (x.off ? icon('alert', 'sm') + ' ' + esc(x.fix[0].toUpperCase() + x.fix.slice(1)) + '. ' + esc(x.why) : 'Equilibrado.') : 'Sem séries ainda.'}</div></div>`;
    }).join('')}<div class="tiny faint" style="margin-top:4px">${bn.src === 'semana' ? 'Séries feitas nesta semana.' : 'Pelo plano ativo (a semana ainda tem poucas séries).'} Saltos, tiros e arremessos não entram na conta.</div></div>`;
  }
  function balanceWarnHTML(plan) {
    const off = Analytics.balancePlan(plan).filter((x) => x.off);
    if (!off.length) return '';
    return `<div class="card bal-warn small">${icon('alert', 'sm')} <span>Plano desequilibrado: ${off.map((x) => `${x.a.toLowerCase()} ${nf(x.A)} × ${x.b.toLowerCase()} ${nf(x.B)} séries por semana, ${esc(x.fix)}`).join('; ')}.</span></div>`;
  }
  // Meta de séries por semana de um músculo (mínimo e máximo).
  function metaSheet(id, done) {
    const g = Analytics.REGIONS.find((x) => x.id === id);
    let [lo, hi] = Analytics.target(id);
    const box = (k, lb, v) => `<div class="field"><label>${lb}</label><div class="stepper big"><button data-a="st" data-k="${k}" data-d="-1">${icon('minus')}</button><div class="val"><b class="num">${v}</b></div><button data-a="st" data-k="${k}" data-d="1">${icon('plus')}</button></div></div>`;
    sheet({
      render: () => `<h3>Meta · ${esc(g.nome)}</h3><div class="desc">Séries por semana (exercícios auxiliares contam meia série). Padrão: ${g.alvo[0]} a ${g.alvo[1]}.</div>
        <div class="form-row">${box('lo', 'Mínimo', lo)}${box('hi', 'Máximo', hi)}</div>
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="def">Usar o padrão</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
      actions: {
        st: (ds) => { if (ds.k === 'lo') lo = Math.max(0, Math.min(hi, lo + Number(ds.d))); else hi = Math.max(lo, Math.min(40, hi + Number(ds.d))); Native.vibrate(6); sheetRefresh(); },
        def: () => { const t = Object.assign({}, S().settings.muscleTargets); delete t[id]; S().settings.muscleTargets = t; Store.save(); closeSheet(); toast('Meta padrão'); done && done(); },
        ok: () => { S().settings.muscleTargets = Object.assign({}, S().settings.muscleTargets, { [id]: [lo, hi] }); Store.save(); closeSheet(); toast('Meta salva: ' + lo + ' a ' + hi + ' séries'); done && done(); },
      },
    });
  }

  // Cartão pequeno para a tela inicial.
  // ---------- Nível de poder (força real) ----------
  // full = versão do Progresso (com cada levantamento); senão, cartão compacto da tela inicial.
  function strengthCard(full) {
    const st = Analytics.strength();
    const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
    const head = `<div class="row" style="align-items:flex-end"><div class="grow"><div class="caps">Nível de poder</div>
      ${st.power != null ? `<div class="pw-num num">${fmt(st.power)}</div><div class="small muted">${esc(st.level)} · média de ${st.count} ${st.count === 1 ? 'levantamento' : 'levantamentos'}</div>` : ''}</div>
      ${st.power != null ? `<div class="pw-max small faint">de 9.001</div>` : ''}</div>`;
    if (!st.bw) return `<div class="card pw-card appear">${head}<div class="small muted" style="margin-top:6px">Calculado pela sua força em relação ao peso do corpo. Registre seu peso para ver o seu.</div><button class="btn ghost sm" style="margin-top:12px" data-a="pwWeight">${icon('weight', 'sm')}Registrar peso</button></div>`;
    if (st.power == null) return `<div class="card pw-card appear">${head}<div class="small muted" style="margin-top:6px">Aparece quando você registrar supino, agachamento, terra, desenvolvimento ou barra fixa.</div></div>`;
    const bar = (l) => `<div class="pw-bar"><i style="width:${Math.min(100, l.idx / 5 * 100)}%"></i>${[1, 2, 3, 4].map((k) => `<b style="left:${k * 20}%"></b>`).join('')}</div>`;
    if (!full) {
      return `<div class="card pw-card press appear" data-a="pwOpen">${head}<div class="pw-mini">${st.lifts.map((l) => `<div><span>${esc(l.nome)}</span>${l.idx != null ? bar(l) : '<div class="pw-bar off"></div>'}</div>`).join('')}</div></div>`;
    }
    const rows = st.lifts.map((l) => l.idx == null
      ? `<div class="pw-row off"><div class="row"><b class="grow">${esc(l.nome)}</b><span class="small faint">sem registro</span></div></div>`
      : `<div class="pw-row"><div class="row"><b class="grow">${esc(l.nome)}</b><span class="small gold">${esc(l.level)}</span></div>${bar(l)}
        <div class="tiny muted">${UI.nf(Math.round(l.e1rm))} kg · ${UI.nf(Math.round(l.ratio * 100) / 100)}× seu peso${l.next ? ` · ${esc(l.next)}: ${l.nextKg} kg` : ' · topo da tabela!'}</div></div>`).join('');
    return `<div class="card pw-card appear">${head}<div class="pw-scale tiny faint">${Analytics.STR_LEVELS.map((n) => `<span>${n}</span>`).join('')}</div>${rows}
      <div class="tiny faint" style="margin-top:10px">1RM estimado pelas suas melhores séries, comparado com o seu peso (${UI.nf(st.bw)} kg) e com faixas de referência ${st.sex === 'f' ? 'femininas' : 'masculinas'} (troque em Músculos → Homem/Mulher).</div></div>`;
  }

  // ---------- resumo do mês ----------
  function MonthSummary(y0, m0) {
    const now = new Date();
    let y = y0 != null ? y0 : now.getFullYear(), m = m0 != null ? m0 : now.getMonth();
    const delta = (a, b, fmt) => (b ? `<span class="chip ${a >= b ? 'done' : 'late'}" style="margin-left:6px">${a >= b ? '+' : ''}${fmt ? fmt(a - b) : a - b}</span>` : '');
    return {
      hideNav: true,
      render() {
        const M = Analytics.month(y, m), P = Analytics.month(m ? y : y - 1, m ? m - 1 : 11);
        const future = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
        const first = new Date(y, m, 1).getDay(), ws = S().settings.weekStart || 0;
        const blanks = (first - ws + 7) % 7;
        const cal = `<div class="mcal">${Array.from({ length: 7 }, (_, k) => `<span class="h">${Store.WEEKDAYS[(k + ws) % 7].slice(0, 1)}</span>`).join('')}${'<span></span>'.repeat(blanks)}${Array.from({ length: M.last }, (_, d) => `<span class="${M.days.includes(d + 1) ? 'on' : ''}">${d + 1}</span>`).join('')}</div>`;
        const top = M.muscles.filter((x) => x.sets > 0);
        return topbar('Resumo do mês', M.count ? `<button class="icon-btn" data-a="share">${icon('share', 'sm')}</button>` : '') + `<div class="content">
          <div class="month-nav"><button class="icon-btn" data-a="prev">${icon('back', 'sm')}</button><b>${M.nome} ${y}</b><button class="icon-btn" data-a="next" ${future ? 'disabled style="opacity:.3"' : ''}>${icon('next', 'sm')}</button></div>
          ${!M.count ? '<div class="card small muted" style="margin-top:12px">Nenhum treino registrado neste mês.</div>' : `
          <div class="tiles two" style="margin-top:12px">
            <div class="card tile"><div class="v num">${M.count}${delta(M.count, P.count)}</div><div class="l">Treinos</div></div>
            <div class="card tile"><div class="v num">${volume(M.vol)}</div><div class="l">Volume${P.vol ? ' · ' + (M.vol >= P.vol ? '+' : '') + Math.round((M.vol - P.vol) / P.vol * 100) + '% vs ' + P.nome.toLowerCase() : ''}</div></div>
            <div class="card tile"><div class="v num">${nf(Math.round(M.mins / 60 * 10) / 10)}<small>h</small></div><div class="l">Tempo treinando · ${M.sets} séries</div></div>
            <div class="card tile"><div class="v num">${M.weeks}<small>/${M.totalWeeks}</small></div><div class="l">Semanas com treino</div></div>
          </div>
          <div class="section-title"><h2>Dias treinados</h2><span class="small muted">${M.days.length} dias</span></div><div class="card">${cal}</div>
          <div class="section-title"><h2>Recordes</h2><span class="small muted">${M.records.length}</span></div>
          <div class="card">${M.records.length ? M.records.slice(0, 6).map((r) => `<div class="kv"><span class="ellipsis">${esc(Store.exercise(r.exId).nome)}</span><b class="pr num">${nf(r.kg)} kg <span class="faint small">(antes ${nf(r.prev)})</span></b></div>`).join('') : '<div class="small muted">Nenhum recorde de carga neste mês.</div>'}</div>
          <div class="section-title"><h2>Músculos</h2><span class="small muted">séries no mês</span></div>
          <div class="card">${top.slice(0, 4).map((x) => `<div class="kv"><span>${esc(x.nome)}</span><b class="num">${nf(x.sets)}</b></div>`).join('')}
            ${M.muscles.length > 4 ? `<div class="small muted" style="margin-top:8px">Menos treinados: ${esc(M.muscles.slice(-3).reverse().map((x) => x.nome + ' (' + nf(x.sets) + ')').join(', '))}</div>` : ''}</div>
          <button class="btn lime block" style="margin-top:18px" data-a="share">${icon('share', 'sm')}Compartilhar imagem do mês</button>`}</div>`;
      },
      actions: {
        back: pop,
        prev: () => { m--; if (m < 0) { m = 11; y--; } refresh(); },
        next: () => { if (y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth())) return; m++; if (m > 11) { m = 0; y++; } refresh(); },
        share: () => shareMonth(y, m),
      },
    };
  }
  async function shareMonth(y, m) {
    const M = Analytics.month(y, m);
    try { await document.fonts.ready; } catch (e) { /* segue */ }
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const GOLD = '#f5c518', GOLD2 = '#ffd95a', TXT = '#eee8da', MUTED = '#9a9385';
    g.fillStyle = '#08080a'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); glow.addColorStop(0, 'rgba(245,197,24,.28)'); glow.addColorStop(1, 'rgba(245,197,24,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(243,212,140,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(W - 120, 160, 260, 0, Math.PI * 2); g.stroke();
    const logo = await Logo.image();
    if (logo) { g.save(); g.beginPath(); g.roundRect ? g.roundRect(80, 52, 130, 130, 26) : g.rect(80, 52, 130, 130); g.clip(); g.drawImage(logo, 80, 52, 130, 130); g.restore(); }
    g.fillStyle = GOLD2; g.font = '400 44px Oswald, sans-serif'; g.fillText('G R A V I T Y', 250, 135);
    g.textAlign = 'right'; g.fillStyle = TXT; g.font = '400 34px Oswald, sans-serif'; g.fillText((S().settings.name || 'Atleta').toUpperCase().slice(0, 18), W - 80, 135); g.textAlign = 'left';
    g.fillStyle = MUTED; g.font = '500 30px Montserrat, sans-serif'; g.fillText('RESUMO DO MÊS', 80, 270);
    g.fillStyle = TXT; g.font = '400 96px Oswald, sans-serif'; g.fillText(M.nome.toUpperCase(), 80, 380);
    g.fillStyle = GOLD; g.font = 'italic 400 56px Oswald, sans-serif'; g.fillText(String(y), 80, 450);
    const stats = [[String(M.count), 'TREINOS'], [volume(M.vol).replace(' ', ''), 'VOLUME'], [String(M.records.length), 'RECORDES']];
    stats.forEach(([v, l], i) => {
      const x = 80 + i * 320;
      g.strokeStyle = 'rgba(245,197,24,.3)'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(x, 510, 290, 170, 28) : g.rect(x, 510, 290, 170); g.stroke();
      g.fillStyle = GOLD2; g.font = '400 76px Oswald, sans-serif'; g.fillText(v, x + 30, 610);
      g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(l, x + 32, 655);
    });
    // Dias do mês: bolinhas
    g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(M.days.length + ' DIAS TREINADOS', 80, 760);
    for (let d = 1; d <= M.last; d++) {
      const k = d - 1, cx = 80 + 22 + (k % 16) * 58, cy = 810 + Math.floor(k / 16) * 58;
      g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2);
      if (M.days.includes(d)) { g.fillStyle = GOLD; g.fill(); } else { g.strokeStyle = 'rgba(245,197,24,.25)'; g.lineWidth = 2; g.stroke(); }
    }
    let yy = 960;
    g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(M.records.length ? 'RECORDES DO MÊS' : 'MÚSCULOS MAIS TREINADOS', 80, yy); yy += 54;
    const rows = M.records.length ? M.records.slice(0, 4).map((r) => [Store.exercise(r.exId).nome, nf(r.kg) + ' kg  ★']) : M.muscles.filter((x) => x.sets > 0).slice(0, 4).map((x) => [x.nome, nf(x.sets) + ' séries']);
    rows.forEach(([n, v]) => {
      g.fillStyle = TXT; g.font = '500 34px Montserrat, sans-serif'; g.fillText(n.length > 30 ? n.slice(0, 29) + '…' : n, 80, yy);
      g.fillStyle = GOLD2; g.font = '400 38px Oswald, sans-serif'; g.fillText(v, W - 80 - g.measureText(v).width, yy);
      yy += 60;
    });
    g.fillStyle = 'rgba(245,197,24,.35)'; g.fillRect(80, H - 140, W - 160, 2);
    g.fillStyle = GOLD; g.font = '500 26px Montserrat, sans-serif'; g.fillText('FOCO · DISCIPLINA · MUITO CAFÉ', 80, H - 80);
    Native.shareImage(c.toDataURL('image/png'), `gravity-${y}-${String(m + 1).padStart(2, '0')}.png`);
  }

  // ---------- comparar fotos de progresso ----------
  // Duas datas da mesma posição, uma sobre a outra; arrastar a linha revela o antes e o depois.
  function PhotoCompare() {
    const all = () => Store.photos().slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const poses = () => ['Frente', 'Lado', 'Costas'].filter((p) => all().filter((f) => f.pose === p).length >= 2);
    let pose = poses()[0] || 'Frente', A = null, B = null, pct = 50, mode = 'slide';
    const list = () => all().filter((f) => f.pose === pose);
    const pick = () => { const l = list(); if (!l.find((f) => f.id === A)) A = l[0] && l[0].id; if (!l.find((f) => f.id === B)) B = l[l.length - 1] && l[l.length - 1].id; };
    const get = (id) => all().find((f) => f.id === id);
    const dt = (f) => (f ? f.date.split('-').reverse().join('/') : '');
    const days = () => { const a = get(A), b = get(B); return a && b ? Math.round((new Date(b.date) - new Date(a.date)) / 864e5) : 0; };
    return {
      hideNav: true,
      render() {
        pick();
        const a = get(A), b = get(B), ps = poses();
        if (!a || !b) return topbar('Comparar fotos') + `<div class="content"><div class="card small muted">Tire pelo menos duas fotos na mesma posição (frente, lado ou costas) para comparar.</div></div>`;
        const chips = (sel, k) => `<div class="filters" style="margin:0 -16px;padding:0 16px">${list().map((f) => `<button class="filter ${sel === f.id ? 'on' : ''}" data-a="pick" data-k="${k}" data-id="${f.id}">${dt(f).slice(0, 5)}${f.date.slice(2, 4) !== new Date().toISOString().slice(2, 4) ? '/' + f.date.slice(2, 4) : ''}</button>`).join('')}</div>`;
        const view = mode === 'slide'
          ? `<div class="cmp" data-cmp><img src="${b.data}" alt=""><img class="top" src="${a.data}" alt="" style="clip-path:inset(0 ${100 - pct}% 0 0)"><div class="cmp-line" style="left:${pct}%"><span>${icon('back', 'sm')}${icon('next', 'sm')}</span></div><em class="l">Antes · ${dt(a)}</em><em class="r">Depois · ${dt(b)}</em></div>`
          : `<div class="ba"><div><img src="${a.data}" alt=""><span>Antes · ${dt(a)}</span></div><div><img src="${b.data}" alt=""><span>Depois · ${dt(b)}</span></div></div>`;
        return topbar('Comparar fotos') + `<div class="content">
          ${ps.length > 1 ? `<div class="seg" style="margin-bottom:12px">${ps.map((p) => `<button class="${pose === p ? 'on' : ''}" data-a="pose" data-p="${p}">${p}</button>`).join('')}</div>` : ''}
          <div class="seg" style="margin-bottom:12px"><button class="${mode === 'slide' ? 'on' : ''}" data-a="mode" data-m="slide">Deslizar</button><button class="${mode === 'side' ? 'on' : ''}" data-a="mode" data-m="side">Lado a lado</button></div>
          ${view}
          <div class="small muted" style="text-align:center;margin:8px 0 4px">${days()} dias entre as fotos${mode === 'slide' ? ' · arraste a linha' : ''}</div>
          <div class="caps" style="margin:14px 2px 6px">Antes</div>${chips(A, 'A')}
          <div class="caps" style="margin:14px 2px 6px">Depois</div>${chips(B, 'B')}</div>`;
      },
      after(el) {
        const box = el.querySelector('[data-cmp]'); if (!box) return;
        const top = box.querySelector('.top'), line = box.querySelector('.cmp-line');
        const set = (x) => { const r = box.getBoundingClientRect(); pct = Math.max(0, Math.min(100, (x - r.left) / r.width * 100)); top.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; line.style.left = pct + '%'; };
        let on = false;
        box.addEventListener('pointerdown', (e) => { on = true; box.setPointerCapture(e.pointerId); set(e.clientX); });
        box.addEventListener('pointermove', (e) => { if (on) set(e.clientX); });
        box.addEventListener('pointerup', () => { on = false; }); box.addEventListener('pointercancel', () => { on = false; });
      },
      actions: {
        back: pop,
        pose: (ds) => { pose = ds.p; A = B = null; refresh(); },
        mode: (ds) => { mode = ds.m; refresh(); },
        pick: (ds) => { if (ds.k === 'A') A = ds.id; else B = ds.id; refresh(); },
      },
    };
  }

  function muscleCard() {
    const { st, map } = volumeData();
    return `<div class="card muscle-card press appear" data-a="muscles"><div class="row" style="align-items:flex-start">
      <div style="flex:0 0 156px">${bodySVG((k) => VCOL[(map[k] || {}).st || 'zero'], 122)}</div>
      <div class="grow"><div class="caps">Músculos da semana</div>${(() => { const bal = balanceAlertsHTML(), vol = volumeAlertsHTML(bal ? 2 : 3); return bal || vol ? (bal ? `<div class="mv-alerts">${bal}</div>` : '') + vol : `<div class="small" style="margin-top:8px">${esc(volumeSummary(st))}</div>`; })()}
      <div class="legend" style="margin-top:10px"><span><i style="background:${VCOL.pouco}"></i>Pouco</span><span><i style="background:${VCOL.ideal}"></i>Ideal</span><span><i style="background:${VCOL.alto}"></i>Alto</span></div></div></div></div>`;
  }

  function MuscleMap() {
    let mode = 'volume';
    return {
      hideNav: true,
      render() {
        const { st, map } = volumeData();
        const rec = Analytics.recovery();
        const color = mode === 'volume' ? (k) => VCOL[(map[k] || {}).st || 'zero'] : (k) => recColor(rec[k]);
        const rows = mode === 'volume'
          ? st.map((r) => `<div class="hbar mrow press" data-a="meta" data-id="${r.id}"><span class="ellipsis">${esc(r.nome)}${r.custom ? ' <i class="meta-dot"></i>' : ''}</span><div class="track band"><span class="zone" style="left:${r.alvo[0] / 24 * 100}%;width:${(r.alvo[1] - r.alvo[0]) / 24 * 100}%"></span><i style="width:${Math.min(100, r.n / 24 * 100)}%;background:${VCOL[r.st]}"></i></div><span class="v num">${nf(r.n)}<small>/${r.alvo[0]}</small></span></div>`).join('')
          : Analytics.REGIONS.map((g) => { const v = rec[g.id]; return `<div class="hbar mrow"><span class="ellipsis">${esc(g.nome)}</span><div class="track"><i style="width:${Math.round(v * 100)}%;background:${recColor(v)}"></i></div><span class="v num">${Math.round(v * 100)}%</span></div>`; }).join('');
        const tired = Analytics.REGIONS.filter((g) => rec[g.id] < 0.6).map((g) => g.nome);
        return topbar('Músculos') + `<div class="content">
          <div class="seg"><button class="${mode === 'volume' ? 'on' : ''}" data-a="mode" data-m="volume">Volume da semana</button><button class="${mode === 'rec' ? 'on' : ''}" data-a="mode" data-m="rec">Recuperação</button></div>
          <div class="card" style="margin-top:12px;text-align:center"><div class="seg body-switch mb-switch"><button class="${MyBody.active() ? '' : 'on'}" data-a="bodyView" data-v="boneco">Boneco</button><button class="${MyBody.active() ? 'on' : ''}" data-a="bodyView" data-v="foto">Minha foto</button></div>${MyBody.active() ? '' : AnatomyReal.genderSwitch()}${bodySVG(color, 300)}${MyBody.active() ? `<button class="link small gold" style="margin:4px 0 8px" data-a="myBody">Trocar ou ajustar a foto</button>` : ''}
            <div class="legend" style="justify-content:center">${mode === 'volume'
              ? `<span><i style="background:#5c6067"></i>Nada</span><span><i style="background:${VCOL.pouco}"></i>Abaixo</span><span><i style="background:${VCOL.ideal}"></i>Ideal</span><span><i style="background:${VCOL.alto}"></i>Acima</span>`
              : `<span><i style="background:#c8574b"></i>Cansado</span><span><i style="background:#d0803e"></i>Recuperando</span><span><i style="background:var(--map-ideal, #e2b95b)"></i>Pronto</span>`}</div></div>
          <div class="small muted" style="margin:12px 2px 0">${mode === 'volume' ? esc(volumeSummary(st).replace(/\.$/, '')) + '. Faixa ideal: a área marcada em cada barra (séries por semana; auxiliares contam meia série).' : tired.length ? 'Ainda se recuperando: ' + esc(tired.join(', ')) + '. Prefira treinar outros grupos hoje.' : 'Todos os músculos recuperados. Pode treinar pesado.'}</div>
          <div class="section-title"><h2>${mode === 'volume' ? 'Séries por músculo' : 'Recuperação estimada'}</h2></div>
          <div class="card">${rows}</div>
          ${mode === 'volume' ? `<div class="section-title"><h2>Equilíbrio</h2></div>${balanceCard()}` : ''}
          <div class="tiny faint" style="margin-top:14px">${mode === 'volume' ? 'Faixas baseadas em recomendações comuns de hipertrofia (cerca de 10 a 20 séries semanais para músculos grandes).' : 'Estimativa: cada músculo precisa de 48 h + 4 h por série feita, até 96 h.'}</div></div>`;
      },
      actions: { bodyView: (ds) => { if (ds.v === 'foto') { if (MyBody.has()) { MyBody.setView('foto'); refresh(); } else MyBody.setup(refresh); } else { MyBody.setView('boneco'); refresh(); } }, myBody: () => MyBody.setup(refresh), back: pop, meta: (ds) => metaSheet(ds.id, refresh), mode: (ds) => { mode = ds.m; refresh(); }, bodyType: (ds) => { AnatomyReal.setGender(ds.v); Native.vibrate(8); refresh(); } },
    };
  }

  // ====================== RECORDES ======================
  function recordsTable(b) {
    return `<div class="rm-grid">${Analytics.REPS.map((n) => `<div><b class="num">${b.rm[n] ? nf(b.rm[n]) : '–'}</b><span>${n === 1 ? '1 rep' : n + ' reps'}</span></div>`).join('')}<div><b class="num">${b.e1rm ? nf(b.e1rm, 0) : '–'}</b><span>1RM est.</span></div></div>`;
  }
  // ====================== CORPO: PESO, MEDIDAS E FOTOS ======================
  function shrink(dataURL, max, cb) {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => toast('Imagem inválida');
    img.src = dataURL;
  }
  function pickImage(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(f); inp.remove(); };
    document.body.appendChild(inp); inp.click();
  }
  // v0.46: registrar peso e medidas usa a folha nova do Corpo.
  function measureSheet(done) { weightSheet(false, done); }
  // ====================== v0.46 · CORPO (aprovado em 13/11) ======================
  // Primeira vez: convite "Comece pelo peso". Preenchida: peso com gráfico e meta, medidas com a variação do mês
  // e fotos (primeira e última). Botões "+ Registrar" e "Nova foto" com contorno (B1). Câmera com guia.
  const MEAS_NO_W = () => Store.MEASURES.filter(([k]) => k !== 'peso');
  const lastOf = (k) => { const e = S().body.entries.filter((x) => x[k] != null); return e[e.length - 1]; };
  // Variação do mês: último valor menos o primeiro dos últimos ~30 dias (ou o anterior).
  function monthDelta(k) {
    const e = S().body.entries.filter((x) => x[k] != null); if (e.length < 2) return null;
    const since = Store.iso(Store.addDays(Store.today(), -30));
    const base = e.filter((x) => x.date < since).pop() || e[0];
    const last = e[e.length - 1]; if (base === last) return null;
    return Math.round((last[k] - base[k]) * 10) / 10;
  }
  // Para cada medida, qual direção é "boa" (verde): cintura, quadril e gordura caindo; braço, peito, coxa e panturrilha subindo.
  const GOOD_DOWN = { cintura: 1, gordura: 1, quadril: 1 };
  function weightSheet(openMeas, done) {
    const st = S().settings, lw = lastOf('peso'), last = S().body.entries[S().body.entries.length - 1] || {};
    let w = lw ? lw.peso : (Store.bodyWeight() || 75), showM = !!openMeas;
    const vals = {};
    MEAS_NO_W().forEach(([k]) => { if (last[k] != null) vals[k] = last[k]; });
    const DOW = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    sheet({
      render: () => {
        const d = lw ? Math.round((w - lw.peso) * 10) / 10 : null;
        const filled = MEAS_NO_W().filter(([k]) => vals[k] != null && vals[k] !== '').length;
        return `<h3>Registrar peso</h3><div class="desc">Hoje · de manhã, em jejum, é o mais confiável.</div>
          <div class="cp-big"><button data-a="wd" data-d="-0.1">${icon('minus')}</button><b class="num" data-a="wed">${nf(w, 1)}<small> kg</small></b><button data-a="wd" data-d="0.1">${icon('plus')}</button></div>
          ${lw ? `<div class="cp-diff ${d < 0 ? 'dn' : ''}">${d === 0 ? 'Igual à última vez' : (d > 0 ? '+' : '−') + nf(Math.abs(d), 1) + ' kg desde a última vez (' + shortDate(lw.date) + ')'}</div>` : ''}
          <button class="fs-opt" data-a="tm" style="margin-top:8px"><span class="g"><b>Medidas <small style="display:inline;color:var(--text-2)">opcional · ${showM ? 'toque para preencher' : filled + ' de ' + MEAS_NO_W().length}</small></b></span>${icon(showM ? 'up' : 'down', 'sm')}</button>
          ${showM ? `<div class="cp-f">${MEAS_NO_W().map(([k, nome, un]) => `<label><span>${nome} (${un})</span><input class="input num" type="number" inputmode="decimal" step="0.1" data-in="m" data-k="${k}" value="${vals[k] != null ? vals[k] : ''}" placeholder="vazio"></label>`).join('')}</div>
            <div class="small muted" style="margin:8px 2px 0">${icon('info', 'sm')} Meça sempre no mesmo lugar, com a fita sem apertar. Os campos vêm com a última medida.</div>` : ''}
          <div class="fs-opt" data-a="rem" style="border:0"><span class="g"><b>Lembrar toda <span style="color:var(--gold-2)">${DOW[st.weighDow == null ? 1 : st.weighDow]}, ${(st.weighTime || '07:00').replace(':00', 'h')}</span></b><small>Aviso no celular para se pesar</small></span><span class="switch ${st.weighOn ? 'on' : ''}"></span></div>
          <button class="btn lime block cp-save" data-a="ok">Salvar</button>`;
      },
      actions: {
        wd: (ds) => { w = Math.max(20, Math.round((w + Number(ds.d)) * 10) / 10); Native.vibrate(5); sheetRefresh(); },
        wed: () => numberSheet('Peso (kg)', w, 0.1, (v) => { w = v; setTimeout(() => weightSheet(showM, done), 380); }),
        tm: () => { showM = !showM; sheetRefresh(); },
        m: (ds, el) => { vals[ds.k] = el.value; },
        rem: () => { st.weighOn = !st.weighOn; Store.save(); Screens.syncNative(); if (st.weighOn) toast('Lembrete toda ' + DOW[st.weighDow == null ? 1 : st.weighDow] + ' às ' + (st.weighTime || '07:00')); sheetRefresh(); },
        ok: () => {
          const e = { peso: w };
          MEAS_NO_W().forEach(([k]) => { const v = parseFloat(String(vals[k] == null ? '' : vals[k]).replace(',', '.')); if (!isNaN(v)) e[k] = v; });
          Store.addBody(e); closeSheet(); toast('Salvo'); done && done();
        },
      },
    });
  }
  function goalSheet(done) {
    const b = S().body, cur = (lastOf('peso') || {}).peso;
    let g = b.goal || (cur ? Math.round(cur - 3) : 75), dl = b.goalDate || '';
    sheet({
      render: () => {
        const weeks = dl ? Math.max(1, (Store.parseISO(dl) - Store.today()) / (7 * Store.DAY)) : null;
        const left = cur != null ? Math.round((cur - g) * 10) / 10 : null;
        return `<h3>Meta de peso</h3><div class="desc">Aparece no gráfico como uma linha tracejada.</div>
          <div class="cp-big"><button data-a="gd" data-d="-0.5">${icon('minus')}</button><b class="num" data-a="ged">${nf(g, 1)}<small> kg</small></b><button data-a="gd" data-d="0.5">${icon('plus')}</button></div>
          <label class="fs-opt" style="position:relative"><span class="g"><b>Prazo <small style="display:inline;color:var(--text-2)">opcional</small></b></span><span class="v">${dl ? shortDate(dl) : 'sem prazo'}</span><input type="date" data-ch="dl" value="${dl}" style="position:absolute;inset:0;opacity:0"></label>
          ${left != null && left !== 0 ? `<div class="small muted" style="margin:8px 2px 0">${left > 0 ? 'Faltam ' + nf(left, 1) + ' kg' : 'Faltam +' + nf(-left, 1) + ' kg'}${weeks ? ' · cerca de ' + nf(Math.abs(left) / weeks, 1) + ' kg por semana' + (Math.abs(left) / weeks > 1 ? ', um ritmo puxado' : ', um ritmo saudável') : ''}.</div>` : ''}
          <div class="fs-btns">${b.goal ? '<button class="btn ghost" data-a="rm">Tirar meta</button>' : '<button class="btn ghost" data-a="no">Cancelar</button>'}<button class="btn lime" data-a="ok">Salvar meta</button></div>`;
      },
      actions: {
        gd: (ds) => { g = Math.max(30, Math.round((g + Number(ds.d)) * 10) / 10); sheetRefresh(); },
        ged: () => numberSheet('Meta (kg)', g, 0.5, (v) => { g = v; b.goal = g; Store.save(); setTimeout(() => goalSheet(done), 380); }),
        dl: (ds, el) => { dl = el.value; sheetRefresh(); },
        no: closeSheet,
        rm: () => { delete b.goal; delete b.goalDate; Store.save(); closeSheet(); done && done(); },
        ok: () => { b.goal = g; b.goalDate = dl || null; Store.save(); closeSheet(); toast('Meta salva'); done && done(); },
      },
    });
  }
  // Silhueta de referência (primeira foto da posição).
  const SIL = { Frente: '<svg viewBox="0 0 100 220" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6" stroke-dasharray="4 4"><circle cx="50" cy="20" r="14"/><path d="M30 44h40l10 54-8 2-6-36-2 58 6 90h-12l-8-80-8 80h-12l6-90-2-58-6 36-8-2z"/></svg>',
    Lado: '<svg viewBox="0 0 100 220" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6" stroke-dasharray="4 4"><circle cx="50" cy="20" r="14"/><path d="M42 44h18l6 60-6 2-2 30 4 80h-12l-4-80-4 80h-12l6-80-2-30-4-2z"/></svg>' };
  SIL.Costas = SIL.Frente;
  // Câmera com guia: a última foto da mesma posição aparece apagada por cima, para repetir o enquadramento.
  function cameraGuide(pose, done) {
    const prev = Store.photos().filter((f) => f.pose === pose).sort((a, b) => (a.date < b.date ? -1 : 1)).pop();
    const el = document.createElement('div');
    el.className = 'cam-full';
    el.innerHTML = `<video playsinline autoplay muted></video>${prev ? `<img class="ghost" src="${prev.data}" alt="">` : `<div class="sil">${SIL[pose] || SIL.Frente}</div>`}
      <div class="cam-top"><button class="fa-ib" data-c="x">${icon('x')}</button><span>${esc(pose)}${prev ? ' · guia: foto de ' + shortDate(prev.date) : ' · centralize o corpo'}</span><button class="fa-ib" data-c="flip">${icon('repeat', 'sm')}</button></div>
      <div class="cam-tip">${prev ? 'Encaixe o corpo no contorno da foto anterior e toque no botão.' : 'Corpo inteiro na tela, braços um pouco afastados.'}</div>
      <div class="cam-bot"><input type="range" min="0" max="70" value="${prev ? 35 : 0}" class="cam-op" ${prev ? '' : 'hidden'} aria-label="Transparência do guia"><button class="cam-shot" data-c="shot" aria-label="Tirar foto"></button></div>`;
    document.body.appendChild(el);
    let stream = null, facing = 'user';
    const video = el.querySelector('video'), ghost = el.querySelector('.ghost'), op = el.querySelector('.cam-op');
    if (ghost) ghost.style.opacity = 0.35;
    if (op) op.addEventListener('input', () => { ghost.style.opacity = op.value / 100; });
    const stop = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; };
    const close = () => { stop(); el.remove(); UI.overlayBack = null; return true; };
    UI.overlayBack = close;
    const start = () => {
      stop();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { close(); toast('Câmera indisponível. Use a Galeria.'); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1920 } }, audio: false })
        .then((s) => { stream = s; video.srcObject = s; video.classList.toggle('mirror', facing === 'user'); })
        .catch(() => { close(); toast('Sem acesso à câmera. Libere a permissão ou use a Galeria.'); });
    };
    start();
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      if (b.dataset.c === 'x') close();
      else if (b.dataset.c === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; start(); }
      else if (b.dataset.c === 'shot' && video.videoWidth) {
        const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight;
        const g = c.getContext('2d');
        if (facing === 'user') { g.translate(c.width, 0); g.scale(-1, 1); }
        g.drawImage(video, 0, 0); Native.vibrate(20);
        const data = c.toDataURL('image/jpeg', 0.85);
        close();
        shrink(data, 900, (small) => { if (Store.addPhoto(small, pose)) { toast('Foto salva'); done && done(); } else toast('Sem espaço para mais fotos. Apague algumas antigas.'); });
      }
    });
  }
  function photoSheet(done) {
    let pose = 'Frente';
    const sil = (p) => `<span class="cp-sil">${SIL[p]}</span>`;
    sheet({
      render: () => `<h3>Foto de progresso</h3><div class="desc">Escolha a posição. Na câmera, a foto anterior aparece de leve para você repetir o mesmo enquadramento.</div>
        <div class="cp-pose">${['Frente', 'Lado', 'Costas'].map((p) => `<button class="${p === pose ? 'on' : ''}" data-a="p" data-v="${p}">${sil(p)}${p}</button>`).join('')}</div>
        <div class="small muted" style="margin:10px 2px 0">${icon('sparkle', 'sm')} Mesmo lugar, mesma luz, mesma hora. As fotos ficam só no celular e não vão para o backup.</div>
        <div class="fs-btns"><button class="btn ghost" data-a="gal">${icon('upload', 'sm')}Galeria</button><button class="btn lime" data-a="cam">${icon('camera', 'sm')}Câmera</button></div>`,
      actions: {
        p: (ds) => { pose = ds.v; sheetRefresh(); },
        cam: () => { closeSheet(); setTimeout(() => cameraGuide(pose, done), 300); },
        gal: () => { closeSheet(); pickImage((data) => shrink(data, 900, (small) => { if (Store.addPhoto(small, pose)) { toast('Foto salva'); done && done(); } else toast('Sem espaço para mais fotos. Apague algumas antigas.'); })); },
      },
    });
  }
  // Página de uma medida: valor grande, chips para trocar de medida, gráfico e registros.
  function BodyMetric(k0) {
    let k = k0;
    return {
      hideNav: true,
      render() {
        const M = Store.MEASURES.find((m) => m[0] === k), e = S().body.entries.filter((x) => x[k] != null);
        const last = e[e.length - 1], first = e[0], d = monthDelta(k);
        const goal = k === 'peso' && S().body.goal;
        const pts = e.slice(-16).map((x) => ({ label: shortDate(x.date), v: x[k] }));
        return topbar(esc(M[1])) + `<div class="content pg-c">
          <div class="cp-head"><b class="num">${last ? nf(last[k], 1) : '—'}</b><span>${M[2]}${goal ? ' · meta ' + nf(goal, 1) + ' kg' : ''}${d != null ? ' · ' + (d > 0 ? '+' : '−') + nf(Math.abs(d), 1) + ' no mês' : ''}${first && last && first !== last ? ' · ' + (last[k] - first[k] > 0 ? '+' : '−') + nf(Math.abs(last[k] - first[k]), 1) + ' desde ' + shortDate(first.date) : ''}</span></div>
          <div class="lb-chips">${Store.MEASURES.filter(([x]) => S().body.entries.some((y) => y[x] != null)).map(([x, n]) => `<button class="${x === k ? 'on' : ''}" data-a="m" data-k="${x}">${n}</button>`).join('')}</div>
          <div class="ed-box">${Screens.lineChart(pts, { color: 'var(--gold)', h: 170 })}</div>
          <div class="pg-cap">Registros</div>${e.slice().reverse().slice(0, 20).map((x) => `<div class="fa-row"><span>${shortDate(x.date)}</span><b class="num">${nf(x[k], 1)} ${M[2]}</b></div>`).join('')}</div>`;
      },
      actions: { back: pop, m: (ds) => { k = ds.k; UI.refresh(); } },
    };
  }
  function Body() {
    const again = () => UI.refresh();
    return {
      hideNav: true,
      render() {
        const entries = S().body.entries, photos = Store.photos().slice().sort((a, b) => (a.date < b.date ? -1 : 1));
        const plus = `<button class="icon-btn" data-a="add" aria-label="Registrar">${icon('plus')}</button>`;
        if (!entries.length && !photos.length) {
          return topbar('Corpo', plus) + `<div class="content pg-c"><div class="cp-first"><span class="ic">${icon('weight')}</span><h2>Comece pelo peso</h2><p>Leva 5 segundos. Uma vez por semana basta; o app monta o gráfico sozinho.</p><button class="btn lime block cp-save" data-a="add">${icon('plus', 'sm')}Registrar peso</button></div>
            <div class="pg-cap">Depois, se quiser</div>
            <button class="fa-row press" data-a="meas"><span>${icon('target', 'sm')} Medidas <small style="color:var(--text-3)">(cintura, braço…)</small></span>${icon('next', 'sm')}</button>
            <button class="fa-row press" data-a="photo"><span>${icon('camera', 'sm')} Fotos de progresso</span>${icon('next', 'sm')}</button>
            <button class="fa-row press" data-a="goal"><span>${icon('flame', 'sm')} Meta de peso</span>${icon('next', 'sm')}</button></div>`;
        }
        const pw = entries.filter((x) => x.peso != null), lw = pw[pw.length - 1], fw = pw[0], goal = S().body.goal;
        const pts = pw.slice(-16).map((x) => ({ label: shortDate(x.date), v: x.peso }));
        const meas = MEAS_NO_W().filter(([k]) => lastOf(k));
        const ba = photos.length >= 2 ? [photos[0], photos[photos.length - 1]] : photos.length ? [photos[0]] : [];
        return topbar('Corpo', plus) + `<div class="content pg-c">
          ${lw ? `<button class="ed-box cp-w press" data-a="metric" data-k="peso"><div class="l">Peso${fw !== lw ? `<span class="${lw.peso <= fw.peso ? 'gd' : ''}">${lw.peso - fw.peso > 0 ? '+' : '−'}${nf(Math.abs(lw.peso - fw.peso), 1)} kg desde ${shortDate(fw.date)}</span>` : ''}</div>
            <div class="cp-wv"><b class="num">${nf(lw.peso, 1)}</b><small>kg · <u data-a="goal">${goal ? 'meta ' + nf(goal, 1) + ' kg' : 'definir meta'}</u></small></div>${pts.length >= 2 ? Screens.lineChart(pts, { color: 'var(--gold)', h: 120 }) : '<div class="small muted" style="padding:8px 0">Registre de novo na próxima semana para ver o gráfico.</div>'}</button>`
            : `<button class="ed-box cp-w press" data-a="add"><div class="l">Peso</div><div class="small muted" style="padding:10px 0">Toque para registrar o peso.</div></button>`}
          <div class="pg-cap">Medidas · variação do mês<button class="cp-ob" data-a="meas">${icon('plus', 'sm')}Registrar</button></div>
          ${meas.length ? `<div class="cp-g">${meas.map(([k, n, un]) => { const d = monthDelta(k), good = d == null ? null : GOOD_DOWN[k] ? d < 0 : d > 0; return `<button class="press" data-a="metric" data-k="${k}"><span class="l">${n}</span><b class="num">${nf(lastOf(k)[k], 1)} ${un}</b>${d != null && d !== 0 ? `<small class="${good ? 'gd' : 'bd'}">${d > 0 ? '+' : '−'}${nf(Math.abs(d), 1)}</small>` : '<small>&nbsp;</small>'}</button>`; }).join('')}</div>` : '<div class="small muted" style="padding:4px 2px">Nenhuma medida ainda. Registre junto com o peso.</div>'}
          <div class="pg-cap">Fotos<button class="cp-ob" data-a="photo">${icon('camera', 'sm')}Nova foto</button></div>
          ${ba.length ? `<button class="cp-ph press" data-a="${ba.length >= 2 ? 'compare' : 'view'}" data-id="${ba[0].id}">${ba.map((f) => `<span style="background-image:url('${f.data}')"><em>${shortDate(f.date)} · ${esc(f.pose)}</em></span>`).join('')}</button>
            ${photos.length > 2 ? `<div class="photo-grid" style="margin-top:10px">${photos.slice().reverse().map((f) => `<button data-a="view" data-id="${f.id}"><img src="${f.data}" alt=""><span>${shortDate(f.date)} · ${esc(f.pose)}</span></button>`).join('')}</div>` : ''}`
            : '<div class="small muted" style="padding:4px 2px">Tire uma foto de frente, de lado e de costas, sempre no mesmo lugar e luz. A primeira e a última aparecem lado a lado aqui.</div>'}</div>`;
      },
      actions: {
        back: pop,
        add: () => weightSheet(false, again),
        meas: () => weightSheet(true, again),
        goal: (ds, el, e) => { if (e) e.stopPropagation(); goalSheet(again); },
        metric: (ds, el, e) => { if (e && e.target.closest('[data-a="goal"]')) return; push(BodyMetric(ds.k)); },
        photo: () => photoSheet(again),
        compare: () => push(PhotoCompare()),
        view: (ds) => {
          const f = Store.photos().find((x) => x.id === ds.id); if (!f) return;
          sheet({
            render: () => `<img src="${f.data}" alt="" style="width:100%;border-radius:12px"><div class="small muted" style="margin:8px 2px">${shortDate(f.date)} · ${esc(f.pose)}</div><div class="fs-btns"><button class="btn ghost fs-rm" data-a="del">${icon('trash', 'sm')}Apagar</button><button class="btn lime" data-a="no">Fechar</button></div>`,
            actions: { no: closeSheet, del: () => { Store.deletePhoto(f.id); closeSheet(); again(); } },
          });
        },
      },
    };
  }

  // ====================== v0.46 · RECORDES ======================
  // Força (nível de poder) no topo, "Novos este mês" em blocos com foto, busca, ordem e a lista.
  function Records() {
    let q = '', order = 'rec';
    const since = Store.iso(Store.addDays(Store.today(), -30));
    const fresh = () => {
      const out = [];
      S().sessions.filter((s) => s.date >= since && s.sets.some((x) => x.done)).sort((a, b) => b.start - a.start)
        .forEach((s) => Store.sessionRecords(s).forEach((r) => { if (!out.find((x) => x.exId === r.exId)) out.push(Object.assign({ date: s.date }, r)); }));
      return out;
    };
    const lastDate = (id) => { const h = Store.exerciseHistory(id); return h.length ? h[h.length - 1].date : ''; };
    const listHTML = () => {
      let all = Analytics.allRecords().filter((r) => r.ex && (!q || r.ex.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))));
      const top = (r) => Math.max(...Object.values(r.b.rm));
      if (order === 'kg') all.sort((a, b) => top(b) - top(a));
      else if (order === 'az') all.sort((a, b) => a.ex.nome.localeCompare(b.ex.nome));
      else all.sort((a, b) => (lastDate(b.exId) < lastDate(a.exId) ? -1 : 1));
      if (!all.length) return '<div class="card empty"><div class="ic">' + icon('trophy', 'lg') + '</div><h3>Sem recordes ainda</h3><p>Registre treinos para ver suas marcas aqui.</p></div>';
      return all.map((r) => `<button class="pr-row press" data-a="ex" data-id="${r.exId}">${UI.thumb(r.ex)}<span class="g"><b class="ellipsis">${esc(r.ex.nome)}</b><small>${[1, 5, 10].map((n) => (r.b.rm[n] ? n + (n === 1 ? ' rep ' : ' reps ') + nf(r.b.rm[n]) : '')).filter(Boolean).join(' · ') || 'por tempo'}</small></span><span class="r"><b class="num">${top(r) ? nf(top(r)) + ' kg' : '—'}</b><small>recorde</small></span></button>`).join('');
    };
    const def = {
      hideNav: true,
      render: () => {
        const F = fresh();
        return topbar('Recordes') + `<div class="content pg-c">
          ${F.length ? `<div class="pg-cap">Novos este mês<span>${F.length}</span></div><div class="pg-d2">${F.slice(0, 4).map((r) => { const ex = Store.exercise(r.exId); return `<button class="pg-ph press" data-a="ex" data-id="${r.exId}"><span class="ph" style="background-image:url('${(ex.img || [])[0] || ''}')"></span><span class="bd">${icon('trophy', 'sm')}</span><span class="in"><span class="k">Novo · ${shortDate(r.date)}</span><b class="num">${kg(r.kg)}</b><small>${esc(ex.nome)} · antes ${kg(r.prev)}</small></span></button>`; }).join('')}</div>` : ''}
          <div class="pg-cap">Força<span>o nível de poder de verdade</span></div>${strengthCard(true)}
          <div class="pg-cap">Todos os recordes</div>
          <label class="lb-search">${icon('search', 'sm')}<input type="search" placeholder="Buscar exercício" value="${esc(q)}" data-in="q"></label>
          <div class="lb-chips" style="margin-bottom:6px">${[['rec', 'Recentes'], ['kg', 'Maior carga'], ['az', 'A–Z']].map(([k, l]) => `<button class="${order === k ? 'on' : ''}" data-a="ord" data-k="${k}">${l}</button>`).join('')}</div>
          <div data-list>${listHTML()}</div></div>`;
      },
      actions: {
        back: pop,
        q: (ds, el) => { q = el.value; def.el.querySelector('[data-list]').innerHTML = listHTML(); },
        ord: (ds) => { order = ds.k; UI.refresh(); },
        ex: (ds) => push(Screens.ExerciseDetail(ds.id, 'rec')),
        pwWeight: () => measureSheet(() => UI.refresh()),
      },
    };
    return def;
  }

  // ====================== v0.46 · HISTÓRICO (nova) ======================
  function History() {
    let wid = null;
    const MN = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return {
      hideNav: true,
      render() {
        const p = Store.activePlan();
        const all = S().sessions.filter((s) => s.sets.some((x) => x.done) && (!wid || s.workoutId === wid)).sort((a, b) => b.start - a.start);
        const weeks = Store.weeksBack(8).map((w) => S().sessions.filter((s) => s.date >= w.startISO && s.date <= w.endISO && s.sets.some((x) => x.done)).length);
        const mx = Math.max(1, ...weeks);
        const byM = {}; all.forEach((s) => { const k = s.date.slice(0, 7); (byM[k] = byM[k] || []).push(s); });
        const row = (s) => { const fw = Store.findWorkout(s.workoutId), d = Store.parseISO(s.date), r = Store.sessionRecords(s).length, pr = Store.sessionProgress(s), ok = pr.total && pr.complete >= pr.total;
          return `<button class="hs-row press" data-a="sess" data-id="${s.id}"><span class="d"><b class="num">${d.getDate()}</b><small>${UI.MONTHS[d.getMonth()]}</small></span><span class="lt">${fw ? esc(fw.workout.letter) : '?'}</span><span class="g"><b class="ellipsis">${fw ? esc(fw.workout.name) : 'Treino'}</b><small>${Store.sessionDuration(s)} min · ${volume(Store.sessionVolume(s))}${r ? ' · ' + r + (r > 1 ? ' recordes' : ' recorde') : ''}${ok ? '' : ' · incompleto'}</small></span>${icon('next', 'sm')}</button>`; };
        return topbar('Histórico') + `<div class="content pg-c">
          <div class="ed-box" style="margin-top:4px"><div class="l">Constância<span>treinos por semana · 8 semanas</span></div><div class="hs-bars">${weeks.map((n) => `<i class="${n ? '' : 'o'}" style="height:${Math.max(6, n / mx * 100)}%"><em>${n || ''}</em></i>`).join('')}</div></div>
          ${p && p.workouts.length > 1 ? `<div class="lb-chips">${[['', 'Todos']].concat(p.workouts.map((w) => [w.id, w.letter])).map(([id, l]) => `<button class="${(wid || '') === id ? 'on' : ''}" data-a="w" data-id="${id}">${esc(l)}</button>`).join('')}</div>` : ''}
          ${Object.keys(byM).length ? Object.entries(byM).map(([k, L]) => `<div class="pg-cap">${MN[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}<span>${L.length} ${L.length === 1 ? 'treino' : 'treinos'} · ${volume(L.reduce((a, s) => a + Store.sessionVolume(s), 0))}</span></div>${L.map(row).join('')}`).join('') : '<div class="small muted" style="padding:16px 2px">Nenhum treino registrado ainda.</div>'}
          <div class="pg-cap">Frequência</div>${calendarCard()}</div>`;
      },
      after: (el) => { const c = el.querySelector('[data-cal]'); if (c) c.scrollLeft = c.scrollWidth; },
      actions: { back: pop, w: (ds) => { wid = ds.id || null; UI.refresh(); }, sess: (ds) => push(Screens.SessionDetail(ds.id)) },
    };
  }

  // ====================== v0.46 · CONQUISTAS ======================
  function Medals() {
    return {
      hideNav: true,
      render() {
        const got = Analytics.earned();
        const done = S().sessions.filter((s) => { const p = Store.sessionProgress(s); return p.total && p.complete >= p.total; }).length;
        const tons = S().sessions.reduce((a, s) => a + Store.sessionVolume(s), 0) / 1000;
        const recs = Analytics.recordCount();
        const lvl = 1 + Math.floor(done / 10), toNext = 10 - (done % 10);
        const PROG = { t10: [done, 10], t50: [done, 50], t100: [done, 100], pr25: [recs, 25], ton10: [tons, 10], ton100: [tons, 100] };
        const near = Object.entries(PROG).filter(([id]) => !got.has(id)).map(([id, [a, t]]) => ({ m: Analytics.MEDALS.find((x) => x.id === id), a, t, r: a / t })).filter((x) => x.m).sort((a, b) => b.r - a.r).slice(0, 3);
        return topbar('Conquistas') + `<div class="content pg-c">
          <div class="md-head"><b class="num">${got.size}<small>/${Analytics.MEDALS.length}</small></b><span>conquistas · Nível ${lvl}<br>faltam ${toNext} ${toNext === 1 ? 'treino' : 'treinos'} para o Nível ${lvl + 1}</span></div>
          ${near.length ? `<div class="pg-cap">Quase lá</div>${near.map((x) => `<div class="md-nx"><span class="m">${icon('star', 'sm')}</span><span class="g"><b>${esc(x.m.nome)}</b><small>${esc(x.m.desc)} · ${nf(Math.min(x.a, x.t), x.t >= 10 && x.a % 1 ? 1 : 0)} de ${x.t}</small><i><em style="width:${Math.min(100, x.r * 100)}%"></em></i></span></div>`).join('')}` : ''}
          <div class="pg-cap">Todas</div>
          <div class="md-g">${Analytics.MEDALS.map((m) => `<div class="${got.has(m.id) ? '' : 'off'}"><span class="m">${icon(got.has(m.id) ? 'trophy' : 'star', 'sm')}</span><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small></div>`).join('')}</div></div>`;
      },
      actions: { back: pop },
    };
  }

  // ====================== CALENDÁRIO ANUAL ======================
  function calendarCard() {
    const data = Analytics.calendar();
    const ws = S().settings.weekStart;
    const end = Store.today(), start = Store.addDays(Store.weekStartOf(end, ws), -7 * 51);
    const vals = Object.values(data).sort((a, b) => a - b);
    const q = (p) => vals.length ? vals[Math.min(vals.length - 1, Math.floor(vals.length * p))] : 0;
    const lv = (v) => (!v ? 0 : v <= q(0.33) ? 1 : v <= q(0.66) ? 2 : 3);
    let cols = '', days = 0;
    for (let w = 0; w < 52; w++) {
      let col = '';
      for (let d = 0; d < 7; d++) {
        const dt = Store.addDays(start, w * 7 + d), key = Store.iso(dt);
        if (dt > end) { col += '<i class="fut"></i>'; continue; }
        const v = data[key]; if (v) days++;
        col += `<i class="l${lv(v)}"></i>`;
      }
      const m = Store.addDays(start, w * 7);
      cols += `<div class="cc">${m.getDate() <= 7 ? `<em>${UI.MONTHS[m.getMonth()]}</em>` : '<em></em>'}${col}</div>`;
    }
    return `<div class="card"><div class="row" style="margin-bottom:10px"><div class="caps grow">Últimos 12 meses</div><span class="small muted num">${days} dias treinados</span></div>
      <div class="cal" data-cal>${cols}</div>
      <div class="legend"><span><i class="cl l0"></i>Sem treino</span><span><i class="cl l1"></i>Leve</span><span><i class="cl l3"></i>Pesado</span></div></div>`;
  }

  // ====================== IMAGEM DO RESUMO ======================
  // Desenha o resumo do treino (1080×1350) no visual do Gravity e envia para compartilhar.
  async function shareSession(sid) {
    const s = Store.session(sid); if (!s) return;
    try { await document.fonts.ready; } catch (e) { /* segue com as fontes do sistema */ }
    const fw = Store.findWorkout(s.workoutId), pr = Store.sessionProgress(s);
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const GOLD = '#f5c518', GOLD2 = '#ffd95a', TXT = '#eee8da', MUTED = '#9a9385';
    g.fillStyle = '#08080a'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); glow.addColorStop(0, 'rgba(245,197,24,.28)'); glow.addColorStop(1, 'rgba(245,197,24,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(243,212,140,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(W - 120, 160, 260, 0, Math.PI * 2); g.stroke();
    // logo
    const logo = await Logo.image();
    if (logo) { g.save(); g.beginPath(); g.roundRect ? g.roundRect(80, 52, 130, 130, 26) : g.rect(80, 52, 130, 130); g.clip(); g.drawImage(logo, 80, 52, 130, 130); g.restore(); }
    g.fillStyle = GOLD2; g.font = '400 44px Oswald, sans-serif'; g.fillText('G R A V I T Y', 250, 135);
    // foto e nome no canto superior direito
    const name = (S().settings.name || 'Atleta').toUpperCase(), ph = Profile.photo();
    g.textAlign = 'right';
    if (ph) {
      const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = ph; });
      if (im) {
        const cx = W - 80 - 65, cy = 140, R = 65;
        g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip(); g.drawImage(im, cx - R, cy - R, R * 2, R * 2); g.restore();
        g.strokeStyle = GOLD; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R + 4, 0, Math.PI * 2); g.stroke();
      }
      g.fillStyle = TXT; g.font = '400 34px Oswald, sans-serif'; g.fillText(name.slice(0, 18), W - 80, 260);
    } else {
      g.fillStyle = TXT; g.font = '400 34px Oswald, sans-serif'; g.fillText(name.slice(0, 18), W - 80, 135);
    }
    g.textAlign = 'left';
    const d = Store.parseISO(s.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    g.fillStyle = MUTED; g.font = '500 30px Montserrat, sans-serif'; g.fillText(d.charAt(0).toUpperCase() + d.slice(1), 80, 270);
    g.fillStyle = TXT; g.font = '400 92px Oswald, sans-serif';
    const title = fw ? ('TREINO ' + fw.workout.letter) : 'TREINO'; g.fillText(title, 80, 380);
    g.fillStyle = GOLD; g.font = 'italic 400 56px Oswald, sans-serif'; g.fillText(fw ? fw.workout.name.toUpperCase().slice(0, 28) : '', 80, 450);
    // números
    const stats = [[String(Store.sessionDuration(s)), 'MIN'], [volume(Store.sessionVolume(s)).replace(' ', ''), 'VOLUME'], [String(pr.setsDone), 'SÉRIES']];
    stats.forEach(([v, l], i) => {
      const x = 80 + i * 320;
      g.strokeStyle = 'rgba(245,197,24,.3)'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(x, 510, 290, 170, 28) : g.rect(x, 510, 290, 170); g.stroke();
      g.fillStyle = GOLD2; g.font = '400 76px Oswald, sans-serif'; g.fillText(v, x + 30, 610);
      g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(l, x + 32, 655);
    });
    // exercícios: melhor série de cada
    const byEx = {};
    s.sets.filter((x) => x.done && !x.warm).forEach((x) => { const b = byEx[x.exId]; if (!b || (x.kg * Math.max(1, x.reps)) > (b.kg * Math.max(1, b.reps))) byEx[x.exId] = x; });
    const recs = new Set(Store.sessionRecords(s).map((r) => r.exId));
    let y = 770;
    g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText('MELHOR SÉRIE DE CADA EXERCÍCIO', 80, y); y += 54;
    Object.keys(byEx).slice(0, 7).forEach((id) => {
      const x = byEx[id], nome = Store.exercise(id).nome;
      g.fillStyle = TXT; g.font = '500 34px Montserrat, sans-serif'; g.fillText(nome.length > 30 ? nome.slice(0, 29) + '…' : nome, 80, y);
      g.fillStyle = recs.has(id) ? GOLD2 : GOLD; g.font = '400 38px Oswald, sans-serif';
      const t = (x.time ? UI.secs(x.reps) : nf(x.kg) + ' kg × ' + x.reps) + (recs.has(id) ? '  ★' : '');
      g.fillText(t, W - 80 - g.measureText(t).width, y);
      y += 64;
    });
    g.fillStyle = 'rgba(245,197,24,.35)'; g.fillRect(80, H - 140, W - 160, 2);
    g.fillStyle = GOLD; g.font = '500 26px Montserrat, sans-serif'; g.fillText('FOCO · DISCIPLINA · MUITO CAFÉ', 80, H - 80);
    const url = c.toDataURL('image/png');
    Native.shareImage(url, 'gravity-treino-' + s.date + '.png');
  }

  // ====================== LEMBRETE E WIDGET ======================
  // Envia ao Android os horários do lembrete e o resumo mostrado no widget da tela inicial.
  function syncNative() {
    const st = S().settings, p = Store.activePlan();
    const days = {};
    if (p) p.workouts.forEach((w) => w.days.forEach((d) => { (days[d] = days[d] || []).push('Treino ' + w.letter + ' · ' + w.name); }));
    Native.schedule(JSON.stringify({ on: !!st.reminder, time: st.reminderTime || '18:00', days, weigh: { on: !!st.weighOn, dow: st.weighDow == null ? 1 : st.weighDow, time: st.weighTime || '07:00' } }));
    let line1 = 'Nenhum plano ativo', line2 = 'Abra o app para escolher um plano', done = 0, total = 0;
    if (p) {
      const list = p.workouts.map((w) => ({ w, st: Store.workoutStatus(w) }));
      done = list.filter((x) => x.st.status === 'done').length; total = list.length;
      const dow = Store.today().getDay();
      const today = list.find((x) => x.w.days.includes(dow) && x.st.status !== 'done');
      const next = today || list.find((x) => x.st.status !== 'done');
      line1 = today ? 'Hoje: Treino ' + today.w.letter + ' · ' + today.w.name : next ? 'Próximo: Treino ' + next.w.letter + ' · ' + next.w.name : 'Semana completa!';
      line2 = done + ' de ' + total + ' treinos na semana';
    }
    Native.widget(JSON.stringify({ line1, line2, done, total }));
  }

  Object.assign(window.Screens, { volumeData, VCOL, balanceCard, balanceWarnHTML, balanceAlertsHTML, volumeAlertsHTML, metaSheet, MonthSummary, shareMonth, PhotoCompare, strengthCard, syncNative, MuscleMap, muscleCard, bodySVG, Records, History, recordsTable, Body, Medals, calendarCard, shareSession, measureSheet });
})();
