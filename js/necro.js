// Necrotério Muscular (aprovado em 23/11; prévia em docs/referencias/necroterio-previa-2026-11-22.*).
// O boneco simples (Anatomy) "afina" e perde a cor nos músculos esquecidos, pelos dias desde o último treino de
// cada região (série de trabalho em que a região é principal): Vivo 0–7, Fraco 8–13, Atrofiando 14–20, Óbito 21+.
// Sem histórico da região, conta a partir do primeiro treino registrado no app. Aba "Necrotério" em Músculos,
// "etiqueta do dedão" com sugestão que entra no próximo treino, cartão na tela inicial (14+ dias, 1×/semana) e
// comemoração "ressuscitado" no fim do treino que treinou um músculo em óbito.
(function () {
  'use strict';
  const { icon, esc, toast, sheet, closeSheet, Native } = UI;
  const S = () => Store.state;
  const DAY = 864e5, WEEK = 7 * DAY;
  const STG = {
    vivo: { nome: 'Vivo', c: 'var(--map-ideal, #e2b95b)', s: 1 },
    fraco: { nome: 'Fraco', c: '#9b8f74', s: 0.88 },
    atrof: { nome: 'Atrofiando', c: '#5a5751', s: 0.72 },
    morto: { nome: 'Óbito', c: '#2c2b29', s: 0.5 },
  };
  const stageOf = (d) => (d >= 21 ? 'morto' : d >= 14 ? 'atrof' : d >= 8 ? 'fraco' : 'vivo');
  const EMO = { morto: '🪦', atrof: '🕸', fraco: '🥀' };
  const st = () => { const s = S(); if (!s.necro) s.necro = { seen: 0 }; return s.necro; };
  const workSet = (x) => x.done && !x.sub && !x.warm;
  // Concordância: plural (os/as) e feminino de cada região.
  const PL = { ombros: 1, biceps: 1, triceps: 1, antebracos: 1, dorsais: 1, gluteos: 1, posteriores: 1, panturrilhas: 1 };
  const FEM = { lombar: 1, panturrilhas: 1 };
  const rezWord = (id) => 'ressuscitad' + (FEM[id] ? 'a' : 'o') + (PL[id] ? 's' : '');
  const ve = (id) => (PL[id] ? 'veem' : 'vê');
  const ddmm = (d) => d.split('-').reverse().slice(0, 2).join('/');

  // Dias sem treino de cada região. exclude = id de sessão a ignorar (para saber o estado "antes" de um treino).
  function status(exclude) {
    const ss = S().sessions.filter((s) => s.id !== exclude && s.sets.some(workSet));
    if (!ss.length) return null;
    const first = ss.reduce((a, s) => (s.date < a ? s.date : a), ss[0].date);
    const last = {}, lastW = {};
    ss.forEach((s) => s.sets.filter(workSet).forEach((x) => {
      const m = Analytics.musclesOf(Store.exercise(x.exId));
      Object.keys(m).forEach((k) => { if (m[k] >= 1 && (!last[k] || s.date > last[k])) { last[k] = s.date; lastW[k] = s.workoutId; } });
    }));
    const t = Store.today();
    return Analytics.REGIONS.map((g) => {
      const since = last[g.id] || first;
      const days = Math.max(0, Math.round((t - Store.parseISO(since)) / DAY));
      return { id: g.id, nome: g.nome, days, last: last[g.id] || null, w: lastW[g.id] || null, st: stageOf(days) };
    }).sort((a, b) => b.days - a.days);
  }

  // Boneco com o efeito: cada músculo encolhe no próprio centro, perde a cor e ganha o contorno do "antes".
  const REG = () => Analytics.REGIONS.map((g) => g.id);
  const code = (k) => '#0102' + String(REG().indexOf(k) + 10).padStart(2, '0');
  function bodyHTML(h, map, opt) {
    opt = opt || {};
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
    box.innerHTML = Anatomy.bodySVG(code, h);
    document.body.appendChild(box);
    const svg = box.querySelector('svg');
    if (opt.cls) svg.classList.add(opt.cls);
    REG().forEach((k) => {
      const sk = (map && map[k]) || 'vivo', S2 = STG[sk];
      svg.querySelectorAll(`path[fill="${code(k)}"]`).forEach((p) => {
        p.setAttribute('data-r', k);
        const b = p.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2, sh = p.nextElementSibling;
        if (S2.s < 1) {
          const g = p.cloneNode(); g.removeAttribute('data-r');
          g.setAttribute('fill', 'none'); g.setAttribute('stroke', sk === 'morto' ? '#e0574a' : 'rgba(200,190,170,.45)');
          g.setAttribute('stroke-dasharray', '1.6 1.4'); g.setAttribute('stroke-width', '.7');
          p.parentNode.insertBefore(g, p);
        }
        const tf = S2.s < 1 ? `translate(${cx} ${cy}) scale(${S2.s} ${sk === 'morto' ? 0.92 : 0.97}) translate(${-cx} ${-cy})` : '';
        p.setAttribute('fill', opt.gold ? 'var(--gold)' : S2.c);
        if (tf) { p.setAttribute('transform', tf); if (sh) sh.setAttribute('transform', tf); }
      });
    });
    const html = svg.outerHTML; box.remove();
    return html;
  }
  const mapOf = (list) => Object.fromEntries((list || []).map((x) => [x.id, x.st]));
  const legend = () => `<div class="legend nc-leg">${['vivo', 'fraco', 'atrof', 'morto'].map((k) => `<span><i class="${k}" style="background:${STG[k].c}"></i>${STG[k].nome}${k === 'fraco' ? ' 8+' : k === 'atrof' ? ' 14+' : k === 'morto' ? ' 21+' : ''}</span>`).join('')}</div>`;

  // Aba "Necrotério" da tela Músculos.
  function tabHTML() {
    const L = status();
    if (!L) return `<div class="card small muted" style="margin-top:12px">Registre alguns treinos para o necrotério começar a funcionar.</div>`;
    const bad = L.filter((x) => x.st !== 'vivo');
    return `<div class="card nc-card" style="margin-top:12px;text-align:center">${bodyHTML(270, mapOf(L))}${legend()}</div>
      <div class="small muted" style="margin:10px 2px 0">${bad.length ? 'Toque num músculo da ficha para ver a etiqueta e ressuscitar.' : 'Ninguém no necrotério. Todos os músculos treinados nos últimos 7 dias.'}</div>
      ${bad.length ? `<div class="section-title"><h2>Ficha do necrotério</h2></div><div class="card nc-list">${bad.map((x) => `<button class="nc-row press" data-a="nc" data-r="${x.id}"><span class="e">${EMO[x.st]}</span><span class="grow">${esc(x.nome)}</span><span class="d">${x.days} dias</span><span class="nc-st ${x.st}">${STG[x.st].nome}</span></button>`).join('')}</div>` : ''}
      <div class="tiny faint" style="margin-top:14px">Conta os dias desde o último treino em que o músculo foi o principal do exercício. Brincadeira para lembrar de não abandonar ninguém.</div>`;
  }

  // Sugestão para ressuscitar: exercício da região (os que a pessoa já fez primeiro) e o treino onde entra.
  function suggestion(r) {
    const p = Store.activePlan(); if (!p || !p.workouts.length) return null;
    let ids = window.Weak && Weak.candidates ? Weak.candidates(r, p) : [];
    if (!ids.length) ids = Store.allExercises().filter((e) => e.tipo !== 'tempo' && (Analytics.musclesOf(e)[r] || 0) >= 1 && (!Store.available || Store.available(e.id))).map((e) => e.id);
    if (!ids.length) return null;
    const regs = (w) => w.items.reduce((a, it) => Object.assign(a, Analytics.musclesOf(Store.exercise(it.exId))), {});
    const dow = new Date().getDay(), dist = (w) => Math.min(...((w.days || []).length ? w.days : [9]).map((d) => (d - dow + 7) % 7));
    const ws = p.workouts.slice().sort((a, b) => ((regs(b)[r] ? 1 : 0) - (regs(a)[r] ? 1 : 0)) || dist(a) - dist(b) || a.items.length - b.items.length);
    return { exId: ids[0], w: ws[0], plan: p };
  }
  function tagSheet(r) {
    const x = (status() || []).find((y) => y.id === r); if (!x) return;
    const sg = suggestion(r), ex = sg && Store.exercise(sg.exId);
    const wl = x.w && Store.findWorkout(x.w), wname = wl && wl.workout ? 'Treino ' + wl.workout.letter : '';
    sheet({
      render: () => `<div class="nc-tag ${x.st}"><b>${esc(x.nome.toUpperCase())}</b><br>${x.st === 'morto' ? 'Óbito confirmado.' : x.st === 'atrof' ? 'Estado grave.' : 'Enfraquecendo.'} <span class="red">${x.days} dias</span> sem treino.<br>${x.last ? 'Último treino: ' + ddmm(x.last) + (wname ? ' (' + esc(wname) + ')' : '') + '.' : 'Nunca treinado no app.'}<br>Causa ${x.st === 'morto' ? 'da morte' : 'provável'}: abandono.</div>
        ${sg ? `<div class="small muted" style="margin:0 2px 10px">Dá para ressuscitar: 2 séries já tiram do necrotério. Sugestão para o próximo treino:</div>
          <div class="card nc-ex">${UI.thumb(ex)}<div class="grow"><b>${esc(ex.nome)}</b><div class="small muted">3 × 10–12 · 60 s · entra no Treino ${esc(sg.w.letter)}</div></div></div>
          <div class="fs-btns"><button class="btn ghost" data-a="no">Fechar</button><button class="btn lime" data-a="add">Ressuscitar</button></div>`
        : `<div class="small muted" style="margin:0 2px 10px">Inclua um exercício de ${esc(x.nome.toLowerCase())} no próximo treino para tirar do necrotério.</div><button class="btn lime block" data-a="no">Ok</button>`}`,
      actions: {
        no: closeSheet,
        add: () => {
          const w = sg.w;
          if (!w.items.some((it) => it.exId === sg.exId)) {
            const it = { id: Store.uid('i'), exId: sg.exId, sets: 3, reps: '10-12', kg: 0, rest: 60, note: '', tech: null, group: null, necro: true };
            const firstReal = w.items.findIndex((y) => !y.blk);
            w.items.splice(firstReal < 0 ? w.items.length : firstReal, 0, it);
            Store.save();
          }
          closeSheet(); Native.vibrate(15);
          toast(ex.nome + ' entrou no Treino ' + w.letter + '. Bora ressuscitar!');
        },
      },
    });
  }

  // Cartão da tela inicial: algum músculo com 14+ dias; no máximo 1 vez por semana.
  function homeCard() {
    if (S().settings.necro === false) return '';
    if (Date.now() - (st().seen || 0) < WEEK) return '';
    const L = status(); if (!L) return '';
    const dead = L.filter((x) => x.st === 'morto'), grave = L.filter((x) => x.st === 'atrof');
    if (!dead.length && !grave.length) return '';
    const t = [dead.length ? dead.length + (dead.length === 1 ? ' óbito' : ' óbitos') : '', grave.length ? grave.length + ' em estado grave' : ''].filter(Boolean).join(', ');
    const w = L[0];
    return `<div class="card nc-home appear"><button class="exc-x" data-a="ncX" aria-label="Fechar">${icon('x', 'sm')}</button><div class="row" style="align-items:center;gap:10px">
      <div class="nc-mini">${bodyHTML(110, mapOf(L))}</div><div class="grow"><span class="k">Necrotério muscular</span><b>${t}</b><small>${esc(w.nome)} não ${ve(w.id)} treino há ${w.days} dias.</small>
      <button class="link gold" data-a="ncOpen">Ver necrotério ›</button></div></div></div>`;
  }
  function seen() { st().seen = Date.now(); Store.save(); }

  // Fim do treino: regiões em óbito ANTES deste treino que ele treinou.
  function revived(s) {
    const before = status(s.id); if (!before) return [];
    const dead = before.filter((x) => x.st === 'morto');
    if (!dead.length) return [];
    const hit = {}; s.sets.filter(workSet).forEach((x) => { const m = Analytics.musclesOf(Store.exercise(x.exId)); Object.keys(m).forEach((k) => { if (m[k] >= 1) hit[k] = true; }); });
    return dead.filter((x) => hit[x.id]);
  }
  function celebrate(list) {
    if (!list.length) return;
    if (window.Insights) { Insights.count('revived', null, list.length); Store.save(); }
    const names = list.map((x) => x.nome), days = Math.max(...list.map((x) => x.days));
    const title = names.length === 1 ? names[0] + ' ' + rezWord(list[0].id) + '!' : names.length + ' músculos ressuscitados!';
    const el = document.createElement('div');
    el.className = 'fm-full nc-rez';
    el.innerHTML = `<div class="fm-in"><div class="nc-glow">${bodyHTML(240, {}, { gold: true })}</div><div class="k">Milagre na academia</div><div class="fm-h">${esc(title.toUpperCase())}</div>
      <div class="fm-sub">${names.length > 1 ? esc(names.join(', ')) + '. ' : ''}Saíram do necrotério depois de ${days} dias. Não deixa morrer de novo.</div></div>
      <div class="fm-btns"><button class="btn ghost" data-nc="ok">Fechar</button><button class="btn lime" data-nc="share">${icon('share', 'sm')}Compartilhar</button></div>`;
    document.body.appendChild(el);
    Native.pattern && Native.pattern([0, 60, 80, 60, 80, 120]);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    const close = () => { if (!el.parentNode) return false; el.classList.remove('show'); setTimeout(() => el.remove(), 320); UI.overlayBack = null; return true; };
    UI.overlayBack = close;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nc]'); if (!b) return;
      if (b.dataset.nc === 'share') shareRez(title, days); else close();
    });
  }
  // Imagem simples para compartilhar a ressurreição (1080x1350).
  function shareRez(title, days) {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const cs = getComputedStyle(document.documentElement), GOLD = cs.getPropertyValue('--gold').trim() || '#d9b25f', GOLD2 = cs.getPropertyValue('--gold-2').trim() || '#f3d48c';
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    const gl = g.createRadialGradient(W / 2, 520, 40, W / 2, 520, 600); gl.addColorStop(0, 'rgba(243,212,140,.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = GOLD; g.font = '500 40px Oswald, sans-serif'; g.fillText('G R A V I T Y', W / 2, 110);
    g.font = '600 30px Montserrat, sans-serif'; g.fillText('MILAGRE NA ACADEMIA', W / 2, 820);
    g.fillStyle = GOLD2; g.font = '700 84px Oswald, sans-serif';
    const words = title.toUpperCase().split(' '); let line = '', y = 930; words.forEach((w) => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 160 && line) { g.fillText(line, W / 2, y); line = w; y += 96; } else line = t; }); g.fillText(line, W / 2, y);
    g.fillStyle = '#bdb6a8'; g.font = '500 38px Montserrat, sans-serif'; g.fillText('Fora do necrotério depois de ' + days + ' dias.', W / 2, y + 90);
    g.fillStyle = '#8d877b'; g.font = '500 26px Montserrat, sans-serif'; g.fillText('gravityapp.com.br', W / 2, H - 40);
    const img = new Image();
    img.onload = () => { g.drawImage(img, W / 2 - 300, 170, 600, 600); Native.shareImage(c.toDataURL('image/png'), 'gravity-ressuscitado.png'); };
    img.onerror = () => Native.shareImage(c.toDataURL('image/png'), 'gravity-ressuscitado.png');
    const svg = bodyHTML(600, {}, { gold: true }).replace(/var\(--gold\)/g, GOLD).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  window.Necro = { status, stageOf, bodyHTML, tabHTML, tagSheet, homeCard, seen, revived, celebrate, STG };
})();
