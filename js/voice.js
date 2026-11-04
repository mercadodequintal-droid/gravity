// Voz no treino: fala do próprio Android (offline). Desde a v0.29 cada aviso falado tem a sua chave
// (settings.voice.opts); os antigos níveis viraram atalhos que marcam um conjunto pronto.
(function () {
  'use strict';
  const A = window.Android;
  const DEF = { on: true, opts: null, level: 2, name: '', rate: 1, pitch: 1 };
  // Avisos falados: [chave, nome, descrição, nível antigo em que entrava].
  const OPTS = [
    ['conta', 'Fim do descanso', '"3, 2, 1… Bora!" e "Acabou!" no fim do exercício por tempo', 1],
    ['proxima', 'Próxima série', 'Depois do "Bora!": exercício, série, carga e repetições', 2],
    ['tecnicas', 'Técnicas e sem descanso', 'Drop set, bi-set, rest-pause: o que fazer em seguida', 2],
    ['inicio', 'Início do descanso', '"Descanso de 1 minuto e 30 segundos"', 3],
    ['dez', '10 segundos finais', '"Faltam 10 segundos" e "Metade" no exercício por tempo', 3],
    ['recordes', 'Recordes', '"Novo recorde no supino!"', 3],
    ['resumo', 'Fim do treino e resumo', '"Treino completo", duração, séries e recordes', 2],
  ];
  // Atalhos (os antigos níveis).
  const LEVELS = [
    [0, 'Desligada', 'Só os bipes'],
    [1, 'Básica', 'Só o fim do descanso'],
    [2, 'Treino', 'Também a próxima série, técnicas e resumo'],
    [3, 'Completa', 'Todos os avisos'],
  ];
  const fromLevel = (lv) => { const o = {}; OPTS.forEach(([k, , , min]) => { o[k] = lv >= min; }); return o; };
  const log = [];

  // Configuração: quem vinha dos níveis ganha as chaves equivalentes.
  function cfg() {
    const c = Object.assign({}, DEF, Store.state.settings.voice || {});
    if (!c.opts) { c.opts = fromLevel(c.level || 0); c.on = (c.level || 0) > 0; }
    return c;
  }
  const isOn = (k) => { const c = cfg(); return !!(c.on && c.opts[k]); };
  const count = () => { const c = cfg(); return c.on ? OPTS.filter(([k]) => c.opts[k]).length : 0; };
  // Atalho que corresponde às chaves marcadas (ou -1 = personalizado).
  function preset() {
    const c = cfg(); if (!c.on) return 0;
    for (let lv = 1; lv <= 3; lv++) { const o = fromLevel(lv); if (OPTS.every(([k]) => !!o[k] === !!c.opts[k])) return lv; }
    return -1;
  }
  function set(patch) {
    Store.state.settings.voice = Object.assign(cfg(), patch);
    Store.save(); push();
  }
  function push() {
    const c = cfg();
    // level fica para versões antigas do lado nativo; as chaves que o Android usa vão em o_*.
    try { A && A.ttsConfig && A.ttsConfig(JSON.stringify({ level: c.on ? 3 : 0, o_conta: isOn('conta'), o_proxima: isOn('proxima'), o_dez: isOn('dez'), voice: c.name, rate: c.rate, pitch: c.pitch })); } catch (e) { /* ignora */ }
  }

  function speak(text, flush) {
    log.push(text);
    if (A && A.ttsSay) { try { A.ttsSay(text, flush !== false); } catch (e) { /* ignora */ } return; }
    const ss = window.speechSynthesis; if (!ss) return;
    const c = cfg();
    if (flush !== false) ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = c.rate; u.pitch = c.pitch;
    const v = ss.getVoices().find((x) => x.name === c.name); if (v) u.voice = v;
    ss.speak(u);
  }
  // Fala se o aviso `key` estiver ligado. queue = espera a frase anterior terminar.
  function say(text, key, delay, queue) {
    if (!text || !isOn(key)) return;
    if (delay) setTimeout(() => speak(text, !queue), delay); else speak(text, !queue);
  }

  // ---------- números falados ----------
  function secs(s) {
    s = Math.round(Number(s) || 0);
    const m = Math.floor(s / 60), r = s % 60;
    if (!m) return r + ' segundos';
    return (m === 1 ? '1 minuto' : m + ' minutos') + (r ? ' e ' + r + ' segundos' : '');
  }
  const kg = (n) => UI.nf(n, 2) + ' quilos';

  // Lista de vozes em português. cb([{name, label}]) — no Android espera o motor de voz carregar.
  function voices(cb) {
    let tries = 0;
    // Sempre assíncrono: a tela que pediu já precisa estar no topo da pilha quando a resposta chegar.
    const done = (list) => setTimeout(() => cb(list.map((v, i) => ({ name: v.name, label: 'Voz ' + (i + 1) + (v.country === 'PT' ? ' · Portugal' : '') }))), 0);
    (function poll() {
      if (A && A.ttsVoices) {
        let raw = '';
        try { raw = A.ttsVoices(); } catch (e) { /* ignora */ }
        if (raw) { try { done(JSON.parse(raw)); } catch (e) { done([]); } return; }
        if (++tries < 25) setTimeout(poll, 200); else done([]);
        return;
      }
      const ss = window.speechSynthesis;
      const list = ss ? ss.getVoices().filter((v) => /^pt/i.test(v.lang)).map((v) => ({ name: v.name, country: /PT$/i.test(v.lang) ? 'PT' : 'BR' })) : [];
      if (!list.length && ss && ++tries < 10) { setTimeout(poll, 200); return; }
      done(list);
    })();
  }

  const SAMPLE = '3, 2, 1… Bora! Supino reto, série 2 de 4, 40 quilos por 10 repetições.';

  // ====================== TELA: VOZ NO TREINO ======================
  const RATES = [[0.8, 'Devagar'], [0.9, 'Calma'], [1, 'Normal'], [1.15, 'Rápida'], [1.3, 'Muito rápida']];
  const PITCHES = [[0.8, 'Grave'], [1, 'Normal'], [1.2, 'Aguda']];
  function VoiceSettings() {
    const { icon, esc, pop, refresh, toast } = UI;
    let list = null;
    const test = () => speak(SAMPLE);
    return {
      hideNav: true,
      render() {
        const c = cfg();
        const pr = preset();
        const lv = LEVELS.map(([v, nome]) => `<button class="${pr === v ? 'on' : ''}" data-a="lvl" data-v="${v}">${nome}</button>`).join('');
        const opts = OPTS.map(([k, nome, desc]) => `<div class="switch-row" data-a="opt" data-k="${k}"><div class="grow"><div>${nome}</div><div class="small muted">${desc}</div></div><div class="switch ${c.opts[k] ? 'on' : ''}"></div></div>`).join('');
        let voicesHTML;
        if (list === null) voicesHTML = '<div class="small muted" style="padding:12px 2px">Carregando as vozes do celular…</div>';
        else if (!list.length) voicesHTML = `<div class="card small muted">Nenhuma voz em português instalada para uso sem internet. Instale nas configurações do Android: <b>Idioma → Saída de texto para fala → Mecanismo do Google → Instalar dados de voz → Português (Brasil)</b>.<button class="btn ghost sm block" style="margin-top:10px" data-a="install">Abrir configurações de voz</button></div>`;
        else voicesHTML = `<div class="list">${[{ name: '', label: 'Padrão do celular' }].concat(list).map((v) => `<div class="card voice-row press ${c.name === v.name ? 'on' : ''}" data-a="voice" data-n="${esc(v.name)}"><span class="vr-dot"></span><span class="grow">${esc(v.label)}</span><button class="icon-btn" data-a="hear" data-n="${esc(v.name)}">${icon('play', 'sm')}</button></div>`).join('')}</div>
          <div class="tiny muted" style="margin:8px 2px 0">Toque em ▶ para ouvir. Para mais vozes: <button class="link" data-a="install">configurações de voz do Android</button>.</div>`;
        return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>Voz no treino</h1></div><div class="content">
          <div class="small muted" style="margin:0 2px 12px">O celular fala o que vem a seguir, para você treinar sem olhar a tela. Funciona sem internet e com a tela bloqueada, e abaixa a música enquanto fala.</div>
          <div class="switch-row" data-a="master"><div class="grow"><div><b>Voz ligada</b></div><div class="small muted">${c.on ? count() + ' de ' + OPTS.length + ' avisos ligados' : 'Desligada: só os bipes'}</div></div><div class="switch ${c.on ? 'on' : ''}"></div></div>
          ${c.on ? `<div class="section-title"><h2>O que falar</h2></div><div class="card voice-opts">${opts}</div>
          <div class="section-title"><h2>Atalhos</h2>${pr === -1 ? '<span class="small muted">personalizado</span>' : ''}</div><div class="seg voice-presets">${lv}</div>
          <div class="section-title"><h2>Voz</h2></div>${voicesHTML}
          <div class="section-title"><h2>Velocidade</h2></div><div class="seg">${RATES.map(([v, l]) => `<button class="${c.rate === v ? 'on' : ''}" data-a="rate" data-v="${v}">${l}</button>`).join('')}</div>
          <div class="section-title"><h2>Tom</h2></div><div class="seg">${PITCHES.map(([v, l]) => `<button class="${c.pitch === v ? 'on' : ''}" data-a="pitch" data-v="${v}">${l}</button>`).join('')}</div>
          <button class="btn lime block" style="margin-top:18px" data-a="test">${icon('play', 'sm')}Ouvir exemplo</button>
          <div class="card small muted" style="margin-top:14px">${icon('info', 'sm')} Exemplo do que é falado: <i>“${esc(SAMPLE)}”</i></div>` : ''}</div>`;
      },
      after() { if (list === null) voices((l) => { list = l; refresh(); }); },
      actions: {
        back: pop,
        lvl: (ds) => { const v = Number(ds.v); set(v ? { on: true, opts: fromLevel(v), level: v } : { on: false }); refresh(); if (v) setTimeout(test, 150); },
        master: () => { const c = cfg(); set({ on: !c.on, opts: c.opts }); refresh(); if (!c.on) setTimeout(test, 150); },
        opt: (ds) => { const c = cfg(); c.opts[ds.k] = !c.opts[ds.k]; set({ opts: c.opts }); refresh(); },
        voice: (ds, el, e) => { if (e.target.closest('[data-a="hear"]')) return; set({ name: ds.n }); refresh(); test(); },
        hear: (ds) => { set({ name: ds.n }); refresh(); test(); },
        rate: (ds) => { set({ rate: Number(ds.v) }); refresh(); test(); },
        pitch: (ds) => { set({ pitch: Number(ds.v) }); refresh(); test(); },
        test,
        install: () => { try { A && A.ttsSettings ? A.ttsSettings() : toast('Disponível no app Android'); } catch (e) { /* ignora */ } },
      },
    };
  }
  Object.assign(window.Screens, { VoiceSettings });

  // ====================== "SÉRIE FEITA" POR VOZ ======================
  // Com settings.voiceDone ligado, a tela do treino escuta o microfone e, ao ouvir "feito" (ou "pronto"),
  // chama window.onVoiceCmd('feito'). No Android usa o reconhecimento do celular (sem internet quando dá);
  // no navegador (iPhone) usa o reconhecimento do Safari, que pode falhar ou pedir permissão de novo.
  let wanted = false, active = false, rec = null, lastHit = 0;
  const HIT = /(^|[^a-zà-ú])(feito|feita|pronto|pronta)([^a-zà-ú]|$)/i;
  function webStart() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (HIT.test(e.results[i][0].transcript) && Date.now() - lastHit > 2500) { lastHit = Date.now(); if (window.onVoiceCmd) window.onVoiceCmd('feito'); }
      }
    };
    rec.onend = () => { if (active && rec) setTimeout(() => { try { rec && rec.start(); } catch (e) { /* já ligado */ } }, 300); };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { active = false; wanted = false; rec = null; UI.toast('Sem acesso ao microfone para o "feito" por voz'); } };
    try { rec.start(); } catch (e) { /* ignora */ }
  }
  function apply(on) {
    if (on === active) return;
    active = on;
    if (A && A.voiceListen) { try { A.voiceListen(on); } catch (e) { /* ignora */ } return; }
    if (on) webStart(); else if (rec) { const r = rec; rec = null; r.onend = null; try { r.abort(); } catch (e) { /* ignora */ } }
  }
  function listen(on) { wanted = !!on && !!Store.state.settings.voiceDone; apply(wanted); }
  document.addEventListener('visibilitychange', () => apply(wanted && !document.hidden));

  window.Voice = { OPTS, isOn, count, preset, listen, LEVELS, cfg, set, push, say, speak, secs, kg, voices, SAMPLE, log };
})();
