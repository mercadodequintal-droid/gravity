// Telas de acompanhamento: mapa muscular, recordes, corpo (peso, medidas, fotos), conquistas,
// calendário anual e imagem do resumo para compartilhar.
(function () {
  'use strict';
  const { icon, esc, nf, kg, volume, shortDate, Native, toast, push, pop, refresh, sheet, closeSheet, sheetRefresh, confirmSheet } = UI;
  const S = () => Store.state;
  const topbar = (title, right) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${title}</h1>${right || ''}</div>`;

  // ====================== BONECO ANATÔMICO ======================
  // Imagem realista (homem ou mulher) com os músculos pintados por cima: js/anatomy-real.js.
  // color(regiao) devolve a cor, ou '' para o músculo sem destaque.
  const bodySVG = (color, height) => AnatomyReal.bodySVG(color, height);
  // Cores: volume (abaixo / ideal / acima) e recuperação (cansado → recuperado).
  const cssv = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d);
  const VCOL = { zero: '', get pouco() { return cssv('--map-low', 'rgba(217,178,95,.38)'); }, get ideal() { return cssv('--map-ideal', '#e2b95b'); }, alto: '#d0803e' };
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
    const GOLD = '#d9b25f', GOLD2 = '#f3d48c', TXT = '#eee8da', MUTED = '#9a9385';
    g.fillStyle = '#08080a'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); glow.addColorStop(0, 'rgba(217,178,95,.28)'); glow.addColorStop(1, 'rgba(217,178,95,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(243,212,140,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(W - 120, 160, 260, 0, Math.PI * 2); g.stroke();
    const logo = await Logo.image();
    if (logo) g.drawImage(logo, 64, 66, 170, 107);
    g.fillStyle = GOLD2; g.font = '400 44px Oswald, sans-serif'; g.fillText('G R A V I T Y', 250, 135);
    g.textAlign = 'right'; g.fillStyle = TXT; g.font = '400 34px Oswald, sans-serif'; g.fillText((S().settings.name || 'Atleta').toUpperCase().slice(0, 18), W - 80, 135); g.textAlign = 'left';
    g.fillStyle = MUTED; g.font = '500 30px Montserrat, sans-serif'; g.fillText('RESUMO DO MÊS', 80, 270);
    g.fillStyle = TXT; g.font = '400 96px Oswald, sans-serif'; g.fillText(M.nome.toUpperCase(), 80, 380);
    g.fillStyle = GOLD; g.font = 'italic 400 56px Oswald, sans-serif'; g.fillText(String(y), 80, 450);
    const stats = [[String(M.count), 'TREINOS'], [volume(M.vol).replace(' ', ''), 'VOLUME'], [String(M.records.length), 'RECORDES']];
    stats.forEach(([v, l], i) => {
      const x = 80 + i * 320;
      g.strokeStyle = 'rgba(217,178,95,.3)'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(x, 510, 290, 170, 28) : g.rect(x, 510, 290, 170); g.stroke();
      g.fillStyle = GOLD2; g.font = '400 76px Oswald, sans-serif'; g.fillText(v, x + 30, 610);
      g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(l, x + 32, 655);
    });
    // Dias do mês: bolinhas
    g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(M.days.length + ' DIAS TREINADOS', 80, 760);
    for (let d = 1; d <= M.last; d++) {
      const k = d - 1, cx = 80 + 22 + (k % 16) * 58, cy = 810 + Math.floor(k / 16) * 58;
      g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2);
      if (M.days.includes(d)) { g.fillStyle = GOLD; g.fill(); } else { g.strokeStyle = 'rgba(217,178,95,.25)'; g.lineWidth = 2; g.stroke(); }
    }
    let yy = 960;
    g.fillStyle = MUTED; g.font = '500 24px Montserrat, sans-serif'; g.fillText(M.records.length ? 'RECORDES DO MÊS' : 'MÚSCULOS MAIS TREINADOS', 80, yy); yy += 54;
    const rows = M.records.length ? M.records.slice(0, 4).map((r) => [Store.exercise(r.exId).nome, nf(r.kg) + ' kg  ★']) : M.muscles.filter((x) => x.sets > 0).slice(0, 4).map((x) => [x.nome, nf(x.sets) + ' séries']);
    rows.forEach(([n, v]) => {
      g.fillStyle = TXT; g.font = '500 34px Montserrat, sans-serif'; g.fillText(n.length > 30 ? n.slice(0, 29) + '…' : n, 80, yy);
      g.fillStyle = GOLD2; g.font = '400 38px Oswald, sans-serif'; g.fillText(v, W - 80 - g.measureText(v).width, yy);
      yy += 60;
    });
    g.fillStyle = 'rgba(217,178,95,.35)'; g.fillRect(80, H - 140, W - 160, 2);
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
      <div class="grow"><div class="caps">Músculos da semana</div><div class="small" style="margin-top:8px">${esc(volumeSummary(st))}</div>
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
          ? st.map((r) => `<div class="hbar mrow"><span class="ellipsis">${esc(r.nome)}</span><div class="track band"><span class="zone" style="left:${r.alvo[0] / 24 * 100}%;width:${(r.alvo[1] - r.alvo[0]) / 24 * 100}%"></span><i style="width:${Math.min(100, r.n / 24 * 100)}%;background:${VCOL[r.st]}"></i></div><span class="v num">${nf(r.n)}</span></div>`).join('')
          : Analytics.REGIONS.map((g) => { const v = rec[g.id]; return `<div class="hbar mrow"><span class="ellipsis">${esc(g.nome)}</span><div class="track"><i style="width:${Math.round(v * 100)}%;background:${recColor(v)}"></i></div><span class="v num">${Math.round(v * 100)}%</span></div>`; }).join('');
        const tired = Analytics.REGIONS.filter((g) => rec[g.id] < 0.6).map((g) => g.nome);
        return topbar('Músculos') + `<div class="content">
          <div class="seg"><button class="${mode === 'volume' ? 'on' : ''}" data-a="mode" data-m="volume">Volume da semana</button><button class="${mode === 'rec' ? 'on' : ''}" data-a="mode" data-m="rec">Recuperação</button></div>
          <div class="card" style="margin-top:12px;text-align:center">${AnatomyReal.genderSwitch()}${bodySVG(color, 300)}
            <div class="legend" style="justify-content:center">${mode === 'volume'
              ? `<span><i style="background:#5c6067"></i>Nada</span><span><i style="background:${VCOL.pouco}"></i>Abaixo</span><span><i style="background:${VCOL.ideal}"></i>Ideal</span><span><i style="background:${VCOL.alto}"></i>Acima</span>`
              : `<span><i style="background:#c8574b"></i>Cansado</span><span><i style="background:#d0803e"></i>Recuperando</span><span><i style="background:var(--map-ideal, #e2b95b)"></i>Pronto</span>`}</div></div>
          <div class="small muted" style="margin:12px 2px 0">${mode === 'volume' ? esc(volumeSummary(st).replace(/\.$/, '')) + '. Faixa ideal: a área marcada em cada barra (séries por semana; auxiliares contam meia série).' : tired.length ? 'Ainda se recuperando: ' + esc(tired.join(', ')) + '. Prefira treinar outros grupos hoje.' : 'Todos os músculos recuperados. Pode treinar pesado.'}</div>
          <div class="section-title"><h2>${mode === 'volume' ? 'Séries por músculo' : 'Recuperação estimada'}</h2></div>
          <div class="card">${rows}</div>
          <div class="tiny faint" style="margin-top:14px">${mode === 'volume' ? 'Faixas baseadas em recomendações comuns de hipertrofia (cerca de 10 a 20 séries semanais para músculos grandes).' : 'Estimativa: cada músculo precisa de 48 h + 4 h por série feita, até 96 h.'}</div></div>`;
      },
      actions: { back: pop, mode: (ds) => { mode = ds.m; refresh(); }, bodyType: (ds) => { AnatomyReal.setGender(ds.v); Native.vibrate(8); refresh(); } },
    };
  }

  // ====================== RECORDES ======================
  function recordsTable(b) {
    return `<div class="rm-grid">${Analytics.REPS.map((n) => `<div><b class="num">${b.rm[n] ? nf(b.rm[n]) : '–'}</b><span>${n === 1 ? '1 rep' : n + ' reps'}</span></div>`).join('')}<div><b class="num">${b.e1rm ? nf(b.e1rm, 0) : '–'}</b><span>1RM est.</span></div></div>`;
  }
  function Records() {
    let q = '';
    const listHTML = () => {
      const all = Analytics.allRecords().filter((r) => !q || r.ex.nome.toLowerCase().includes(q.toLowerCase()));
      return all.map((r) => `<div class="card press" data-a="ex" data-id="${r.exId}"><div class="row">${UI.thumb(r.ex)}<div class="grow"><b class="ellipsis" style="display:block;font-weight:500">${esc(r.ex.nome)}</b><div class="small muted">${r.b.sessions} treino(s)${r.b.secs ? ' · melhor tempo ' + UI.secs(r.b.secs) : ''}</div></div></div>${r.b.secs ? '' : recordsTable(r.b)}</div>`).join('')
        || '<div class="card empty"><div class="ic">' + icon('trophy', 'lg') + '</div><h3>Sem recordes ainda</h3><p>Registre treinos para ver suas marcas aqui.</p></div>';
    };
    const def = {
      hideNav: true,
      render: () => topbar('Recordes') + `<div class="content"><div class="search">${icon('search', 'sm')}<input type="search" placeholder="Buscar exercício" value="${esc(q)}" data-in="q"></div>
          <div class="small muted" style="margin:0 2px 10px">Maior carga feita com pelo menos 1, 3, 5 e 10 repetições. O app comemora na hora quando você bate uma delas.</div>
          <div class="list" data-list>${listHTML()}</div></div>`,
      actions: {
        back: pop,
        q: (ds, el) => { q = el.value; def.el.querySelector('[data-list]').innerHTML = listHTML(); },
        ex: (ds) => push(Screens.ExerciseDetail(ds.id)),
      },
    };
    return def;
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
  function measureSheet(done) {
    const entries = S().body.entries, last = entries[entries.length - 1] || {};
    const vals = {};
    sheet({
      render: () => `<h3>Registrar medidas</h3><div class="desc">Preencha só o que quiser. Os campos já vêm com a última medida.</div>
        <div class="form-row">${Store.MEASURES.map(([k, nome, un]) => `<div class="field"><label>${nome} (${un})</label><input class="input num" type="number" inputmode="decimal" step="0.1" data-in="m" data-k="${k}" value="${last[k] != null ? last[k] : ''}" placeholder="–"></div>`).join('')}</div>
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
      actions: {
        no: closeSheet,
        m: (ds, el) => { vals[ds.k] = el.value; },
        ok: () => {
          const e = {};
          Store.MEASURES.forEach(([k]) => { const raw = vals[k] != null ? vals[k] : last[k]; const v = parseFloat(String(raw == null ? '' : raw).replace(',', '.')); if (!isNaN(v)) e[k] = v; });
          if (!Object.keys(e).length) { toast('Preencha ao menos uma medida'); return; }
          Store.addBody(e); closeSheet(); toast('Medidas salvas'); done && done();
        },
      },
    });
  }
  function Body() {
    let metric = 'peso';
    return {
      hideNav: true,
      render() {
        const entries = S().body.entries, last = entries[entries.length - 1], first = entries.find((e) => e[metric] != null);
        const pts = entries.filter((e) => e[metric] != null).slice(-16).map((e) => ({ label: shortDate(e.date), v: e[metric] }));
        const M = Store.MEASURES.find((m) => m[0] === metric);
        const diff = last && first && last[metric] != null ? last[metric] - first[metric] : null;
        const photos = Store.photos();
        const ba = photos.length >= 2 ? [photos[0], photos[photos.length - 1]] : null;
        return topbar('Corpo', `<button class="icon-btn" data-a="add">${icon('plus')}</button>`) + `<div class="content">
          ${last ? `<div class="tiles">${Store.MEASURES.filter(([k]) => last[k] != null).slice(0, 3).map(([k, nome, un]) => `<div class="card tile"><div class="v num">${nf(last[k])}<small>${un}</small></div><div class="l">${nome}</div></div>`).join('')}</div>` : `<div class="card empty"><div class="ic">${icon('weight', 'lg')}</div><h3>Comece pelo peso</h3><p>Registre peso e, se quiser, medidas. Uma vez por semana é o suficiente.</p><button class="btn lime" data-a="add">Registrar agora</button></div>`}
          ${entries.length ? `<div class="section-title"><h2>Evolução</h2>${diff != null && diff !== 0 ? `<span class="chip ${diff < 0 ? 'done' : 'blue'}">${diff > 0 ? '+' : ''}${nf(diff)} ${M[2]}</span>` : ''}</div>
          <div class="card"><div class="filters" style="margin:0 -16px 12px;padding:0 16px">${Store.MEASURES.filter(([k]) => entries.some((e) => e[k] != null)).map(([k, nome]) => `<button class="filter ${k === metric ? 'on' : ''}" data-a="metric" data-k="${k}">${nome}</button>`).join('')}</div>
          ${Screens.lineChart(pts, { color: 'var(--blue)' })}</div>
          <div class="section-title"><h2>Histórico</h2></div><div class="card" style="padding:4px 16px">${entries.slice().reverse().slice(0, 8).map((e) => `<div class="kv"><span>${shortDate(e.date)}</span><span class="num">${Store.MEASURES.filter(([k]) => e[k] != null).map(([k, , un]) => nf(e[k]) + ' ' + un).join(' · ')}</span></div>`).join('')}</div>` : ''}
          <div class="section-title"><h2>Fotos de progresso</h2><button class="link" data-a="photo">${icon('camera', 'sm')} Adicionar</button></div>
          ${ba ? `<div class="ba"><div><img src="${ba[0].data}" alt=""><span>Antes · ${shortDate(ba[0].date)}</span></div><div><img src="${ba[1].data}" alt=""><span>Agora · ${shortDate(ba[1].date)}</span></div></div>` : ''}
          ${ba ? `<button class="btn lime block sm" style="margin:10px 0 4px" data-a="compare">${icon('layers', 'sm')}Comparar fotos com o controle deslizante</button>` : ''}
          ${photos.length ? `<div class="photo-grid">${photos.slice().reverse().map((f) => `<button data-a="viewPhoto" data-id="${f.id}"><img src="${f.data}" alt=""><span>${shortDate(f.date)} · ${esc(f.pose)}</span></button>`).join('')}</div>`
            : `<div class="card small muted">Tire uma foto de frente, de lado e de costas, sempre no mesmo lugar e luz. A primeira e a última aparecem lado a lado aqui. As fotos ficam só no celular e não vão no backup.</div>`}</div>`;
      },
      actions: {
        back: pop,
        add: () => measureSheet(refresh),
        compare: () => push(PhotoCompare()),
        metric: (ds) => { metric = ds.k; refresh(); },
        photo: () => pickImage((data) => shrink(data, 900, (small) => {
          sheet({
            render: () => `<h3>Qual posição?</h3><div class="btn-row" style="margin-top:12px">${['Frente', 'Lado', 'Costas'].map((p) => `<button class="btn ghost" data-a="pose" data-p="${p}">${p}</button>`).join('')}</div>`,
            actions: { pose: (ds) => { closeSheet(); if (Store.addPhoto(small, ds.p)) { toast('Foto salva'); refresh(); } else toast('Sem espaço para mais fotos. Apague algumas antigas.'); } },
          });
        })),
        viewPhoto: (ds) => {
          const f = Store.photos().find((x) => x.id === ds.id);
          sheet({
            render: () => `<img src="${f.data}" alt="" style="width:100%;border-radius:16px"><div class="small muted" style="margin:8px 2px">${shortDate(f.date)} · ${esc(f.pose)}</div><div class="btn-row"><button class="btn danger" data-a="del">Apagar</button><button class="btn ghost" data-a="no">Fechar</button></div>`,
            actions: { no: closeSheet, del: () => { Store.deletePhoto(f.id); closeSheet(); refresh(); } },
          });
        },
      },
    };
  }

  // ====================== CONQUISTAS ======================
  function Medals() {
    return {
      hideNav: true,
      render() {
        const got = Analytics.earned();
        return topbar('Conquistas') + `<div class="content"><div class="small muted" style="margin:0 2px 12px">${got.size} de ${Analytics.MEDALS.length} conquistadas. Elas aparecem sozinhas conforme você treina.</div>
          <div class="medal-grid">${Analytics.MEDALS.map((m) => `<div class="medal ${got.has(m.id) ? 'on' : ''}"><div class="mi">${icon(got.has(m.id) ? 'trophy' : 'star', 'lg')}</div><b>${esc(m.nome)}</b><span>${esc(m.desc)}</span></div>`).join('')}</div></div>`;
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
    const GOLD = '#d9b25f', GOLD2 = '#f3d48c', TXT = '#eee8da', MUTED = '#9a9385';
    g.fillStyle = '#08080a'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 900); glow.addColorStop(0, 'rgba(217,178,95,.28)'); glow.addColorStop(1, 'rgba(217,178,95,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(243,212,140,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(W - 120, 160, 260, 0, Math.PI * 2); g.stroke();
    // logo
    const logo = await Logo.image();
    if (logo) g.drawImage(logo, 64, 66, 170, 107);
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
      g.strokeStyle = 'rgba(217,178,95,.3)'; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(x, 510, 290, 170, 28) : g.rect(x, 510, 290, 170); g.stroke();
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
    g.fillStyle = 'rgba(217,178,95,.35)'; g.fillRect(80, H - 140, W - 160, 2);
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
    Native.schedule(JSON.stringify({ on: !!st.reminder, time: st.reminderTime || '18:00', days }));
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

  Object.assign(window.Screens, { MonthSummary, shareMonth, PhotoCompare, strengthCard, syncNative, MuscleMap, muscleCard, bodySVG, Records, recordsTable, Body, Medals, calendarCard, shareSession, measureSheet });
})();
