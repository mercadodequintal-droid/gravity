// Voz no treino: fala do próprio Android (offline). Níveis:
// 1 Básica  = "3, 2, 1… Bora!" no fim do descanso e "Acabou!" no fim do exercício por tempo
// 2 Treino  = + próxima série, técnicas (drop, bi-set, pausa) e fim do treino
// 3 Completa = + início do descanso, "faltam 10 segundos", metade do tempo, recordes e resumo
(function () {
  'use strict';
  const A = window.Android;
  const DEF = { level: 2, name: '', rate: 1, pitch: 1 };
  const LEVELS = [
    [0, 'Desligada', 'Só os bipes'],
    [1, 'Básica', '"3, 2, 1… Bora!" no fim do descanso'],
    [2, 'Treino', 'Também fala a próxima série e as técnicas'],
    [3, 'Completa', 'Também avisa os 10 segundos finais, recordes e o resumo'],
  ];
  const log = [];

  const cfg = () => Object.assign({}, DEF, Store.state.settings.voice || {});
  function set(patch) {
    Store.state.settings.voice = Object.assign(cfg(), patch);
    Store.save(); push();
  }
  function push() {
    const c = cfg();
    try { A && A.ttsConfig && A.ttsConfig(JSON.stringify({ level: c.level, voice: c.name, rate: c.rate, pitch: c.pitch })); } catch (e) { /* ignora */ }
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
  // Fala se o nível escolhido for pelo menos `min`. queue = espera a frase anterior terminar.
  function say(text, min, delay, queue) {
    if (!text || cfg().level < (min || 1)) return;
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
        const lv = LEVELS.map(([v, nome, desc]) => `<button class="card voice-opt press ${c.level === v ? 'on' : ''}" data-a="lvl" data-v="${v}"><b>${nome}</b><span>${desc}</span></button>`).join('');
        let voicesHTML;
        if (list === null) voicesHTML = '<div class="small muted" style="padding:12px 2px">Carregando as vozes do celular…</div>';
        else if (!list.length) voicesHTML = `<div class="card small muted">Nenhuma voz em português instalada para uso sem internet. Instale nas configurações do Android: <b>Idioma → Saída de texto para fala → Mecanismo do Google → Instalar dados de voz → Português (Brasil)</b>.<button class="btn ghost sm block" style="margin-top:10px" data-a="install">Abrir configurações de voz</button></div>`;
        else voicesHTML = `<div class="list">${[{ name: '', label: 'Padrão do celular' }].concat(list).map((v) => `<div class="card voice-row press ${c.name === v.name ? 'on' : ''}" data-a="voice" data-n="${esc(v.name)}"><span class="vr-dot"></span><span class="grow">${esc(v.label)}</span><button class="icon-btn" data-a="hear" data-n="${esc(v.name)}">${icon('play', 'sm')}</button></div>`).join('')}</div>
          <div class="tiny muted" style="margin:8px 2px 0">Toque em ▶ para ouvir. Para mais vozes: <button class="link" data-a="install">configurações de voz do Android</button>.</div>`;
        return `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>Voz no treino</h1></div><div class="content">
          <div class="small muted" style="margin:0 2px 12px">O celular fala o que vem a seguir, para você treinar sem olhar a tela. Funciona sem internet e com a tela bloqueada, e abaixa a música enquanto fala.</div>
          <div class="section-title" style="margin-top:4px"><h2>Quanto falar</h2></div><div class="voice-grid">${lv}</div>
          ${c.level ? `<div class="section-title"><h2>Voz</h2></div>${voicesHTML}
          <div class="section-title"><h2>Velocidade</h2></div><div class="seg">${RATES.map(([v, l]) => `<button class="${c.rate === v ? 'on' : ''}" data-a="rate" data-v="${v}">${l}</button>`).join('')}</div>
          <div class="section-title"><h2>Tom</h2></div><div class="seg">${PITCHES.map(([v, l]) => `<button class="${c.pitch === v ? 'on' : ''}" data-a="pitch" data-v="${v}">${l}</button>`).join('')}</div>
          <button class="btn lime block" style="margin-top:18px" data-a="test">${icon('play', 'sm')}Ouvir exemplo</button>
          <div class="card small muted" style="margin-top:14px">${icon('info', 'sm')} Exemplo do que é falado: <i>“${esc(SAMPLE)}”</i></div>` : ''}</div>`;
      },
      after() { if (list === null) voices((l) => { list = l; refresh(); }); },
      actions: {
        back: pop,
        lvl: (ds) => { set({ level: Number(ds.v) }); refresh(); if (Number(ds.v)) setTimeout(test, 150); },
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

  window.Voice = { LEVELS, cfg, set, push, say, speak, secs, kg, voices, SAMPLE, log };
})();
