// Versão nova: no Android consulta o version.json publicado com a versão web (GitHub) e baixa o APK
// quando a pessoa toca em Atualizar (o instalador do Android sempre pede confirmação). No iPhone a
// versão nova já chega pelo service worker; aqui só avisa e recarrega. Sem internet, nada acontece.
(function () {
  'use strict';
  const BASE = 'https://mercadodequintal-droid.github.io/gravity/';
  const A = window.Android;
  let avail = null;       // { versionCode, versionName, apk, notes } da versão publicada mais nova
  let progress = null;    // Android: 0–100 durante o download
  let webReady = false;   // iPhone: versão nova já baixada, falta recarregar
  const on = () => Store.state.settings.updateCheck !== false;

  function homeRefresh() { if (UI.R.tab === 'home' && UI.R.stack.length === 1) UI.refresh(); }

  // force = verificação pedida em Configurações (mostra o resultado).
  function check(force) {
    if (!force && !on()) return;
    if (A && A.appVersion) {
      if (!navigator.onLine) { if (force) UI.toast('Sem internet para verificar'); return; }
      fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()).then((v) => {
        const cur = Number(A.appVersion()) || 0;
        avail = v && v.versionCode > cur ? v : null;
        if (force) UI.toast(avail ? 'Versão ' + avail.versionName + ' disponível' : 'Você já está na versão mais nova');
        if (avail && force) { const st = Store.state.settings; st.updateSnooze = null; Store.save(); }
        homeRefresh(); if (force) UI.refresh();
      }).catch(() => { if (force) UI.toast('Não foi possível verificar agora'); });
      return;
    }
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.getRegistration().then((r) => { if (r) r.update(); if (force) setTimeout(() => UI.toast(webReady ? 'Versão nova pronta' : 'Você já está na versão mais nova'), 1500); });
    } else if (force) UI.toast('Disponível no app instalado');
  }

  // iPhone: quando o service worker novo assume, a versão nova está baixada.
  if (!A && 'serviceWorker' in navigator && location.protocol === 'https:') {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had) return;
      webReady = true;
      fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()).then((v) => { avail = v; homeRefresh(); }).catch(() => homeRefresh());
    });
  }

  const snoozed = () => { const z = Store.state.settings.updateSnooze; return z && avail && z.code === avail.versionCode && Date.now() < z.until; };
  // Cartão da tela inicial.
  function card() {
    const show = A ? avail && on() && !snoozed() : webReady;
    if (!show) return '';
    const name = avail ? avail.versionName : '';
    const notes = avail && Array.isArray(avail.notes) ? avail.notes.filter((n) => !n.plat || (n.plat === 'android') === !!A).slice(0, 3) : [];
    const busy = progress != null;
    return `<div class="card update-card appear"><div class="row" style="align-items:flex-start"><span class="dl-ic">${UI.icon('download', 'sm')}</span><div class="grow">
      <b>Nova versão${name ? ' ' + UI.esc(name) : ''} disponível</b>${notes.length ? `<ul>${notes.map((n) => `<li>${UI.esc(n.t)}</li>`).join('')}</ul>` : '<small>Toque em atualizar para ter as novidades.</small>'}</div></div>
      ${busy ? `<div class="upd-bar"><i data-upd-prog style="width:${progress}%"></i></div><div class="tiny muted" data-upd-txt style="margin-top:6px">${progress >= 100 ? 'Abrindo o instalador…' : 'Baixando… ' + progress + '%'}</div>`
      : `<div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="updLater">Depois</button><button class="btn lime sm" data-a="updNow">${A ? 'Atualizar' : 'Atualizar agora'}</button></div>`}</div>`;
  }
  function install() {
    if (!A) { location.reload(); return; }
    if (!avail || !A.updateDownload) return;
    progress = 0; homeRefresh();
    A.updateDownload(BASE + avail.apk, 'gravity-' + avail.versionName + '.apk');
  }
  function later() { Store.state.settings.updateSnooze = { code: avail ? avail.versionCode : 0, until: Date.now() + 864e5 }; Store.save(); webReady = false; homeRefresh(); UI.toast('Aviso de novo amanhã'); }
  window.onUpdateProgress = (p) => {
    if (p < 0) { progress = null; homeRefresh(); UI.toast('Não foi possível baixar. Tente de novo.'); return; }
    progress = p;
    const bar = document.querySelector('[data-upd-prog]'), txt = document.querySelector('[data-upd-txt]');
    if (bar) { bar.style.width = p + '%'; if (txt) txt.textContent = p >= 100 ? 'Abrindo o instalador…' : 'Baixando… ' + p + '%'; } else homeRefresh();
    if (p >= 100) setTimeout(() => { progress = null; homeRefresh(); }, 4000);
  };

  window.Updater = { check, card, install, later, get available() { return avail; }, get webReady() { return webReady; } };
})();
