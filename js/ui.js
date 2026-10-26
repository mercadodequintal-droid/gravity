// Base da interface: ícones, formatação, ponte nativa, navegação em pilha, folhas inferiores e timer de descanso.
(function () {
  'use strict';

  // ---------- ícones (traço, estilo Lucide) ----------
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    plans: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3.5v11L16 14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 10h18M8 2v4M16 2v4"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-9.5-.5 2-1.6 3.4-3 4-.3-2.6-1.4-5.2-4-7.5.4 3.5-3 6.6-3 11 0 4.4 3 9 7 9z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
    note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/>',
    skip: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    weight: '<path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  };
  const icon = (n, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24">${P[n] || ''}</svg>`;

  // ---------- formatação ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = (n, d) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d });
  const kg = (n) => nf(n) + ' kg';
  const secs = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m ? m + ':' + String(s % 60).padStart(2, '0') : s + 's'; };
  const restLabel = (s) => (s >= 60 && s % 60 === 0 ? s / 60 + ' min' : s >= 60 ? secs(s) + ' min' : s + ' s');
  const clock = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const volume = (v) => (v >= 1000 ? nf(v / 1000, 1) + ' t' : nf(v, 0) + ' kg');
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const shortDate = (isoStr) => { const d = Store.parseISO(isoStr); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };

  function imgHTML(ex, cls, animate) {
    if (!ex.img || !ex.img.length) return `<div class="${cls || ''} noimg">${icon('dumbbell', 'lg')}</div>`;
    const b = ex.img[1] && animate !== false ? `<img class="b" src="${ex.img[1]}" alt="" loading="lazy">` : '';
    return `<div class="anim ${cls || ''}"><img src="${ex.img[0]}" alt="" loading="lazy">${b}</div>`;
  }
  function thumb(ex) {
    if (!ex.img || !ex.img.length) return `<div class="thumb noimg">${icon('dumbbell')}</div>`;
    return `<div class="thumb"><img src="${ex.img[0]}" alt="" loading="lazy"></div>`;
  }
  // Anel de progresso; cor "gold" (ou var(--lime)) usa gradiente dourado com brilho.
  let ringId = 0;
  function ring(size, stroke, ratio, color, inner) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(1, ratio)));
    const gold = !color || /gold|lime/.test(color);
    const id = 'rg' + ++ringId;
    const defs = gold ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--gold-2)"/><stop offset=".5" style="stop-color:var(--gold)"/><stop offset="1" style="stop-color:var(--gold-3)"/></linearGradient></defs>` : '';
    const glow = gold ? ' style="filter:drop-shadow(0 0 5px rgba(217, 178, 95,.55))"' : '';
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}">${defs}<circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="bar" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke="${gold ? 'url(#' + id + ')' : color}" stroke-dasharray="${c}" stroke-dashoffset="${off}"${glow}/></svg><div class="label">${inner || ''}</div></div>`;
  }

  // ---------- ponte nativa (com alternativa para navegador) ----------
  const A = window.Android;
  // Versão web (iPhone): tela acesa durante o treino (Screen Wake Lock), pedida de novo ao voltar para o app.
  const WebKeep = {
    want: false, lock: null,
    async set(on) {
      this.want = on;
      try {
        if (on && !this.lock && navigator.wakeLock) { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => { this.lock = null; }); }
        if (!on && this.lock) { await this.lock.release(); this.lock = null; }
      } catch (e) { /* sem suporte */ }
    },
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && WebKeep.want) WebKeep.set(true); });
  // iPhone: som e voz só funcionam depois de um toque. No primeiro toque, "acorda" o áudio e a fala.
  if (!A) {
    const unlock = () => {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); const b = audio.createBuffer(1, 1, 22050), s = audio.createBufferSource(); s.buffer = b; s.connect(audio.destination); s.start(0); } catch (e) { /* ignora */ }
      try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) { /* ignora */ }
      document.removeEventListener('touchend', unlock, true); document.removeEventListener('click', unlock, true);
    };
    document.addEventListener('touchend', unlock, true); document.addEventListener('click', unlock, true);
  }

  const Native = {
    vibrate(ms) { if (!Store.state.settings.vibrate) return; try { A ? A.vibrate(ms) : navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* sem vibração */ } },
    pattern(arr) { if (!Store.state.settings.vibrate) return; try { A ? A.vibratePattern(arr.join(',')) : navigator.vibrate && navigator.vibrate(arr); } catch (e) { /* sem vibração */ } },
    keepOn(on) {
      if (A) { try { A.keepScreenOn(!!on); } catch (e) { /* ignora */ } return; }
      WebKeep.set(!!on);
    },
    share(subject, text, filename) {
      if (A) { A.share(subject, text); return; }
      const name = filename || 'gravity.txt';
      // iPhone e Android no navegador: abre o compartilhar com o arquivo (salvar em Arquivos, WhatsApp, e-mail…).
      try {
        const f = new File([text], name, { type: /\.json$/.test(name) ? 'application/json' : 'text/plain' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: subject }).catch(() => {}); return; }
      } catch (e) { /* cai no download */ }
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    },
    open(url) { if (A) A.openUrl(url); else window.open(url, '_blank'); },
    // Imagem (data URL) → no Android salva em Imagens/Gravity e abre o compartilhar; no navegador baixa o arquivo.
    shareImage(dataURL, name) {
      if (A && A.shareImage) { try { A.shareImage(dataURL.split(',')[1], name); return; } catch (e) { /* cai no download */ } }
      try {
        const bin = atob(dataURL.split(',')[1]), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const f = new File([u8], name || 'gravity.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f] }).catch(() => {}); return; }
      } catch (e) { /* cai no download */ }
      const a = document.createElement('a'); a.href = dataURL; a.download = name || 'gravity.png'; a.click();
    },
    // Lembrete diário e widget (só no app Android).
    schedule(json) { try { A && A.setReminder && A.setReminder(json); } catch (e) { /* ignora */ } },
    widget(json) { try { A && A.updateWidget && A.updateWidget(json); } catch (e) { /* ignora */ } },
  };

  let audio = null;
  // Sinais de largada: 'tick' = bipe curto (3, 2, 1); 'go' = sinal longo e mais agudo no zero.
  // beep() sem argumento = 'go' (fim de descanso ou de exercício por tempo).
  function beep(kind) {
    if (!Store.state.settings.sound) return;
    const go = kind !== 'tick', dur = go ? 0.8 : 0.15;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime + 0.01;
      [[go ? 1320 : 880, 0.8], [go ? 2640 : 1760, 0.2]].forEach(([f, v]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.01);
        g.gain.setValueAtTime(v, t + dur - 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
      });
    } catch (e) { /* sem áudio */ }
  }
  // Contagem 3, 2, 1: chame a cada quadro com os segundos restantes; toca o bipe quando o segundo muda.
  function countdown(state, left) {
    const s = Math.ceil(left);
    if (s >= 1 && s <= 3 && state.last !== s) { state.last = s; beep('tick'); Native.vibrate(60); if (window.Voice) Voice.say(String(s), 1); }
  }

  // ---------- comemoração de recorde ----------
  function prBurst(tipo, txt) {
    const el = document.createElement('div');
    el.className = 'pr-burst';
    el.innerHTML = `<div class="pr-rays"></div><div class="pr-card"><div class="pr-ic">${icon('trophy', 'lg')}</div><div class="pr-k">Novo recorde</div><div class="pr-t">${esc(tipo)}</div><div class="pr-s">${esc(txt)}</div></div>`;
    document.body.appendChild(el);
    Native.pattern([0, 80, 60, 80, 60, 200]);
    try { if (Store.state.settings.sound) { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); [523, 659, 784, 1047].forEach((f, i) => { const o = audio.createOscillator(), g = audio.createGain(); const t = audio.currentTime + i * 0.09; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.4); }); } } catch (e) { /* sem áudio */ }
    el.addEventListener('click', () => el.remove());
    setTimeout(() => el.classList.add('out'), 2300);
    setTimeout(() => el.remove(), 2800);
  }

  // ---------- toast ----------
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ---------- navegação ----------
  // Cada tela é um objeto { render(): html, actions: {...}, after(el), leave(), hideNav, footer }.
  const app = () => document.getElementById('app');
  const R = { tab: 'home', stack: [], roots: {} };

  function build(def, cls) {
    const el = document.createElement('div');
    el.className = 'screen ' + (cls || '') + (def.footer ? ' has-footer' : '');
    el._def = def; def.el = el;
    el.innerHTML = def.render();
    return el;
  }
  function rerender(def) {
    if (!def || !def.el) return;
    const c = def.el.querySelector('.content'), top = c ? c.scrollTop : 0;
    def.el.classList.toggle('has-footer', !!def.footer);
    def.el.innerHTML = def.render();
    const c2 = def.el.querySelector('.content'); if (c2) c2.scrollTop = top;
    def.after && def.after(def.el, true);
  }
  const top = () => R.stack[R.stack.length - 1];
  function refresh() { rerender(top()); }
  function setNav() {
    const t = top();
    document.querySelector('.nav').classList.toggle('hidden', !!(t && t.hideNav));
    document.querySelectorAll('.nav button[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === R.tab));
  }

  function push(def) {
    const prev = top();
    const el = build(def, 'pushed enter-right');
    app().appendChild(el);
    def.after && def.after(el, false);
    R.stack.push(def);
    setNav();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.remove('enter-right');
      if (prev) prev.el.classList.add('behind');
    }));
    if (prev) setTimeout(() => { if (R.stack.includes(prev) && top() !== prev) prev.el.style.visibility = 'hidden'; }, 360);
  }
  function pop() {
    if (R.stack.length < 2) return false;
    const cur = R.stack.pop();
    const prev = top();
    prev.el.style.visibility = '';
    rerender(prev);
    requestAnimationFrame(() => {
      prev.el.classList.remove('behind');
      cur.el.classList.add('enter-right');
    });
    cur.leave && cur.leave();
    setTimeout(() => cur.el.remove(), 360);
    setNav();
    return true;
  }
  // Troca a tela do topo por outra, deslizando para o lado (dir 1 = vem da direita, -1 = da esquerda).
  function replace(def, dir) {
    const cur = R.stack.pop();
    cur.leave && cur.leave();
    const el = build(def, 'pushed');
    el.style.transition = 'none'; el.style.transform = `translate3d(${dir > 0 ? 100 : -100}%, 0, 0)`;
    app().appendChild(el);
    def.after && def.after(el, false);
    R.stack.push(def);
    setNav();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = ''; el.style.transform = '';
      cur.el.style.transform = `translate3d(${dir > 0 ? -35 : 35}%, 0, 0)`; cur.el.style.opacity = '0';
    }));
    setTimeout(() => cur.el.remove(), 360);
  }
  // Deslizar o dedo para o lado na tela: cb(1) = foi para a esquerda (próximo), cb(-1) = para a direita (anterior).
  // Ignora gestos que começam em áreas que já rolam para o lado.
  function onSwipe(el, cb) {
    let x0 = null, y0 = 0, t0 = 0, skip = false;
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
      skip = e.touches.length > 1 || !!e.target.closest('.filters, .ptabs, .seg, input, textarea, [data-cal], .photo-grid, .chip-row, .pager');
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null || skip) { x0 = null; return; }
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - t0 < 800) cb(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
  function popTo(n) { while (R.stack.length > n) { const cur = R.stack.pop(); cur.leave && cur.leave(); cur.el.remove(); } const t = top(); t.el.style.visibility = ''; t.el.classList.remove('behind'); rerender(t); setNav(); }
  function switchTab(tab, force) {
    if (tab === R.tab && R.stack.length === 1 && !force) { const c = top().el.querySelector('.content'); if (c) c.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    R.stack.forEach((d) => { d.leave && d.leave(); d.el.remove(); });
    R.tab = tab;
    const def = R.roots[tab]();
    const el = build(def, 'fade-in');
    app().appendChild(el);
    def.after && def.after(el, false);
    R.stack = [def];
    setNav();
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fade-in')));
  }

  // ---------- folha inferior ----------
  let sheetDef = null;
  function sheet(def) {
    const wrap = document.querySelector('.sheet-wrap');
    sheetDef = def;
    wrap.querySelector('.sheet').innerHTML = '<div class="grab"></div>' + def.render();
    wrap.querySelector('.sheet').scrollTop = 0;
    def.el = wrap.querySelector('.sheet');
    def.after && def.after(def.el);
    requestAnimationFrame(() => wrap.classList.add('open'));
  }
  function sheetRefresh() { if (sheetDef) { sheetDef.el.innerHTML = '<div class="grab"></div>' + sheetDef.render(); sheetDef.after && sheetDef.after(sheetDef.el); } }
  function closeSheet() {
    const wrap = document.querySelector('.sheet-wrap');
    if (!wrap.classList.contains('open')) return false;
    wrap.classList.remove('open');
    const d = sheetDef; sheetDef = null;
    d && d.onClose && d.onClose();
    return true;
  }
  function confirmSheet(title, desc, okLabel, onOk, danger) {
    sheet({
      render: () => `<h3>${esc(title)}</h3><div class="desc">${desc}</div><div class="btn-row"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn ${danger ? 'danger' : 'lime'}" data-a="ok">${esc(okLabel)}</button></div>`,
      actions: { no: closeSheet, ok: () => { closeSheet(); onOk(); } },
    });
  }
  // Pede um número exato (toque no valor de carga/repetições).
  // extra(valor) → html mostrado abaixo do campo e atualizado ao digitar (ex.: anilhas).
  function numberSheet(title, value, step, onOk, unit, extra) {
    sheet({
      render: () => `<h3>${esc(title)}</h3><div class="desc">Digite o valor exato${unit ? ' em ' + unit : ''}.</div>
        <input class="input num" id="numIn" type="number" inputmode="decimal" step="${step || 1}" value="${value}" data-in="numIn" style="font-size:26px;height:64px;text-align:center;font-weight:700">
        ${extra ? `<div id="numExtra">${extra(Number(value))}</div>` : ''}
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Salvar</button></div>`,
      after: (el) => { const i = el.querySelector('#numIn'); setTimeout(() => { i.focus(); i.select(); }, 350); },
      actions: {
        no: closeSheet,
        numIn: (ds, el) => { const box = document.getElementById('numExtra'); if (box && extra) box.innerHTML = extra(parseFloat(String(el.value).replace(',', '.'))); },
        ok: (ds, el) => { const v = parseFloat(String(document.getElementById('numIn').value).replace(',', '.')); closeSheet(); if (!isNaN(v)) onOk(v); },
      },
    });
  }

  // ---------- timer de descanso ----------
  const Rest = {
    end: 0, dur: 0, label: '', tick: null, el: null, hideT: null,
    start(seconds, label) {
      this.dur = seconds; this.end = Date.now() + seconds * 1000; this.label = label || '';
      this.over = false; this.cd = {}; this.said10 = false;
      if (seconds >= 20 && !/^Pausa/.test(this.label)) Voice.say('Descanso de ' + Voice.secs(seconds), 3, 0, true);
      // Descansos de 20 s ou mais também vão para a notificação do Android, com alarme alto no fim.
      this.native = !!(A && A.restStart) && seconds >= 20;
      if (this.native) { try { A.restStart(this.end, this.label, !!Store.state.settings.sound, !!Store.state.settings.vibrate); } catch (e) { this.native = false; } }
      else if (A && A.restStop) { try { A.restStop(); } catch (e) { /* ignora */ } }
      clearTimeout(this.hideT);
      this.el.classList.remove('over'); this.el.classList.add('show');
      this.loop();
    },
    add(d) { if (!this.end) return; if (this.native && !this.over) { try { A.restAdd(d * 1000); } catch (e) { /* ignora */ } } this.end += d * 1000; this.dur = Math.max(5, this.dur + d); if (this.over && this.end > Date.now()) { this.over = false; this.el.classList.remove('over'); } this.paint(); sheetDef && sheetDef.rest && sheetRefresh(); },
    stop() { if (this.native && A) { try { A.restStop(); } catch (e) { /* ignora */ } } this.native = false; this.end = 0; clearInterval(this.tick); this.tick = null; this.el.classList.remove('show', 'over'); if (sheetDef && sheetDef.rest) closeSheet(); },
    left() { return Math.max(0, (this.end - Date.now()) / 1000); },
    // Ao voltar para o app: aplica +15s/Pular que tenham sido tocados na notificação.
    sync() {
      if (!A || !A.restEnd) return;
      let e = 0;
      try { e = Number(A.restEnd()); } catch (err) { return; }
      // Descanso começado pelo botão "Série feita" da notificação: mostra aqui também.
      if (e > Date.now() + 500 && (!this.end || this.over || !this.native)) {
        clearTimeout(this.hideT);
        this.native = true; this.over = false; this.cd = {}; this.end = e; this.label = this.label || 'próxima série'; this.dur = Math.max(5, Math.round((e - Date.now()) / 1000));
        this.el.classList.remove('over'); this.el.classList.add('show'); this.loop();
        return;
      }
      if (!this.native || !this.end || this.over) return;
      if (e === 0) { if (Date.now() < this.end - 1500) { this.native = false; this.stop(); } return; }
      if (Math.abs(e - this.end) > 500) { this.dur += (e - this.end) / 1000; this.end = e; this.paint(); }
    },
    loop() {
      clearInterval(this.tick);
      this.paint();
      this.tick = setInterval(() => {
        this.paint();
        // Com a notificação ativa, o próprio Android toca a contagem e o sinal final (mesmo com a tela bloqueada).
        if (!this.over && !this.native && this.dur >= 4) countdown(this.cd, this.left());
        // Sem a notificação (descansos curtos ou no navegador), a voz sai daqui; com ela, o Android fala.
        if (!this.over && !this.native && this.dur >= 30 && !this.said10 && this.left() <= 10) { this.said10 = true; Voice.say('Faltam 10 segundos', 3); }
        if (!this.over && Date.now() >= this.end) {
          this.over = true; this.el.classList.add('over');
          if (!this.native) {
            Native.pattern([0, 700]); beep('go');
            const next = Voice.cfg().level >= 2 && window.Live ? Live.phrase() : '';
            Voice.say('Bora!' + (next ? ' ' + next : ''), 1, Store.state.settings.sound ? 850 : 0);
          }
          this.hideT = setTimeout(() => this.stop(), 6000);
        }
      }, 250);
    },
    paint() {
      const left = this.left();
      const b = this.el.querySelector('b'), sm = this.el.querySelector('small');
      b.textContent = this.over ? 'Bora!' : clock(left * 1000 + 999);
      sm.textContent = this.over ? 'Descanso acabou' : 'Descanso · ' + this.label;
      const ringEl = this.el.querySelector('.ring .bar');
      if (ringEl) { const c = parseFloat(ringEl.getAttribute('stroke-dasharray')); ringEl.setAttribute('stroke-dashoffset', c * (1 - left / this.dur)); }
      const big = document.querySelector('[data-bigrest]');
      if (big) {
        big.querySelector('b').textContent = this.over ? '0:00' : clock(left * 1000 + 999);
        const br = big.querySelector('.bar'); const c2 = parseFloat(br.getAttribute('stroke-dasharray')); br.setAttribute('stroke-dashoffset', c2 * (1 - left / this.dur));
      }
    },
    openSheet() {
      sheet({
        rest: true,
        render: () => `<h3 style="text-align:center">Descanso</h3><div class="desc" style="text-align:center">${esc(this.label)}</div>
          <div class="big-ring" data-bigrest>${ring(230, 14, this.left() / this.dur, 'var(--lime)', '<b class="num">' + clock(this.left() * 1000 + 999) + '</b><span>de ' + secs(this.dur) + '</span>')}</div>
          <div class="btn-row"><button class="btn ghost" data-a="m">−${Store.state.settings.restStep}s</button><button class="btn ghost" data-a="p">+${Store.state.settings.restStep}s</button></div>
          <button class="btn lime block" style="margin-top:10px" data-a="skip">Pular descanso</button>`,
        actions: { m: () => this.add(-Store.state.settings.restStep), p: () => this.add(Store.state.settings.restStep), skip: () => { this.stop(); } },
      });
    },
    init() {
      const el = document.createElement('div');
      el.className = 'rest-pill';
      el.innerHTML = `${ring(42, 4, 1, 'var(--lime)', icon('timer', 'sm'))}<div class="t" data-a="restOpen"><b class="num">0:00</b><small></small></div><button class="mini" data-a="restPlus">+${Store.state.settings.restStep}</button><button class="mini" data-a="restStop">${icon('x', 'sm')}</button>`;
      document.body.appendChild(el);
      this.el = el;
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]'); if (!a) { this.openSheet(); return; }
        if (a.dataset.a === 'restPlus') this.add(Store.state.settings.restStep);
        else if (a.dataset.a === 'restStop') this.stop();
        else this.openSheet();
      });
    },
  };

  // ---------- telas de edição: botão Salvar, aviso e pergunta ao sair ----------
  // o.snap() devolve o que está sendo editado (para comparar); o.restore(copia) desfaz ao descartar.
  // As alterações continuam sendo gravadas na hora (nada se perde se o app fechar); o botão confirma
  // e o "Descartar" volta ao estado de quando a tela foi aberta ou do último "Salvar".
  function editable(def, o) {
    const json = () => { try { const v = o.snap(); return v == null ? null : JSON.stringify(v); } catch (e) { return null; } };
    let base = json();
    const dirty = () => { const j = json(); return j !== null && j !== base; };
    const paint = () => {
      const b = def.el && def.el.querySelector('[data-save]'); if (!b) return;
      const d = dirty(); b.classList.toggle('dirty', d); b.disabled = !d;
      b.innerHTML = d ? 'Salvar alterações' : icon('check', 'sm') + 'Tudo salvo';
    };
    const commit = (msg) => { Store.save(true); base = json(); Native.vibrate(15); toast(msg || '✓ Alterações salvas'); paint(); };
    const render = def.render.bind(def), after = def.after;
    def.footer = true;
    def.render = () => render() + '<div class="footer"><button class="btn lime save-btn" data-a="__save" data-save></button></div>';
    def.after = (el, re) => { if (after) after.call(def, el, re); paint(); };
    const acts = def.actions = def.actions || {};
    acts.__save = () => { if (!dirty()) return; commit(); };
    const ask = () => sheet({
      render: () => `<h3>Salvar as alterações?</h3><div class="desc">Você mudou algo nesta tela e ainda não salvou.</div>
        <button class="btn lime block" data-a="s">Salvar</button><button class="btn ghost block" style="margin-top:8px" data-a="d">Descartar alterações</button><button class="btn ghost block" style="margin-top:8px" data-a="c">Continuar editando</button>`,
      actions: {
        s: () => { closeSheet(); commit(); pop(); },
        d: () => { const b = base; closeSheet(); if (b) o.restore(JSON.parse(b)); Store.save(true); toast('Alterações descartadas'); pop(); },
        c: closeSheet,
      },
    });
    acts.back = () => { if (dirty()) ask(); else pop(); };
    def.guardBack = () => { if (!dirty()) return false; ask(); return true; };
    def.repaint = paint; def.commit = commit;
    return def;
  }
  // Aviso curto de salvo para telas que salvam na hora (Configurações).
  let savedT = null;
  function savedFlash() { clearTimeout(savedT); savedT = setTimeout(() => toast('✓ Salvo'), 500); }

  // ---------- eventos delegados ----------
  function handler(target, type) {
    const sheetEl = target.closest('.sheet');
    const scr = target.closest('.screen');
    const def = sheetEl ? sheetDef : scr && scr._def;
    return def;
  }
  function bind() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]');
      if (!a || a.closest('.rest-pill')) return;
      const def = handler(a);
      const fn = def && def.actions && def.actions[a.dataset.a];
      if (fn) { e.preventDefault(); fn(a.dataset, a, e); }
      const t = top(); if (t && t.repaint) setTimeout(t.repaint, 0);
    });
    ['input', 'change'].forEach((type) => document.addEventListener(type, (e) => {
      const t = e.target; const key = t.dataset && (type === 'input' ? t.dataset.in : t.dataset.ch);
      if (!key) return;
      const def = handler(t);
      const fn = def && def.actions && def.actions[key];
      if (fn) fn(t.dataset, t, e);
      const tp = top(); if (tp && tp.repaint) setTimeout(tp.repaint, 0);
    }));
    document.querySelector('.sheet-bg').addEventListener('click', closeSheet);
    document.querySelectorAll('.nav button[data-tab]').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    document.querySelector('.nav [data-train]').addEventListener('click', () => { Native.vibrate(15); Screens.trainNow(); });
    document.querySelector('.nav [data-train] .core').innerHTML = Screens.emblem(36);
  }

  window.appBack = function () {
    if (window.Splash && Splash.back()) return true;
    if (closeSheet()) return true;
    const t = top(); if (t && t.guardBack && t.guardBack()) return true;
    if (pop()) return true;
    if (R.tab !== 'home') { switchTab('home'); return true; }
    return false;
  };
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.appBack(); });

    // iPhone no Safari (fora da tela de início): como instalar.
  function installHint() {
    if (document.getElementById('splash')) { setTimeout(installHint, 1500); return; }
    sheet({
      render: () => `<h3>Instale o Gravity</h3><div class="desc">Para usar como app (tela cheia, sem internet e com ícone), adicione à tela de início:</div>
        <div class="list">
          <div class="menu-item"><span class="ic">1</span><span class="grow">Toque em <b>Compartilhar</b> (o quadrado com a seta, na barra do Safari)</span></div>
          <div class="menu-item"><span class="ic">2</span><span class="grow">Escolha <b>Adicionar à Tela de Início</b></span></div>
          <div class="menu-item"><span class="ic">3</span><span class="grow">Abra o Gravity pelo ícone novo</span></div>
        </div><div class="tiny muted" style="margin-top:12px">Precisa ser o Safari. Seus treinos ficam salvos só neste iPhone; use o backup em Configurações.</div>
        <button class="btn lime block" style="margin-top:16px" data-a="ok">Entendi</button>`,
      actions: { ok: closeSheet },
    });
  }
  window.UI = { installHint, editable, savedFlash, replace, onSwipe, countdown, prBurst, icon, esc, nf, kg, secs, restLabel, clock, volume, shortDate, MONTHS, imgHTML, thumb, ring, Native, beep, toast, R, push, pop, popTo, switchTab, refresh, rerender, top, sheet, sheetRefresh, closeSheet, confirmSheet, numberSheet, Rest, bind, setNav };
})();
