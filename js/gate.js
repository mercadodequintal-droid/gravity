// Login obrigatório (aprovado em 17/11): depois da abertura, quem não tem conta vê a tela de entrada.
// "Continuar com Google" é o principal; "Entrar com e-mail" cria conta ou entra. O aceite dos Termos e da
// Política de Privacidade já liga a sincronização (consentimento da LGPD para os dados de treino e do corpo).
// Quem já usava o app: ao criar a conta, os dados do celular sobem sozinhos e ele continua de onde parou.
(function () {
  'use strict';
  const { icon, esc, toast } = UI;
  let el = null, view = 'home', tab = 'up', ok = false, busy = false, name = '', email = '', pass = '', doc = null, off = null;

  // Testes automáticos (Playwright) seguem sem a tela; a proteção de verdade é a regra do banco.
  const needed = () => !navigator.webdriver && !(window.Cloud && Cloud.state().uid);

  const check = (v) => `<button class="gt-ck" data-g="ok"><i class="${v ? '' : 'off'}">${v ? icon('check', 'sm') : ''}</i><span>Li e aceito os <b data-g="doc" data-d="termos">Termos de Uso</b> e a <b data-g="doc" data-d="privacidade">Política de Privacidade</b>, incluindo o uso dos meus dados de treino e do corpo para guardar minha conta.</span></button>`;

  function html() {
    if (doc) return `<div class="gt-bar"><button class="icon-btn" data-g="close">${icon('back')}</button><h2>${doc === 'termos' ? 'Termos de uso' : 'Privacidade'}</h2></div><div class="gt-doc">${(window.LEGAL || {})[doc] || ''}</div>`;
    if (view === 'email') return `<div class="gt-bar"><button class="icon-btn" data-g="home">${icon('back')}</button><h2>Entrar com e-mail</h2></div>
      <div class="gt-tabs"><span class="${tab === 'up' ? 'on' : ''}" data-g="tab" data-t="up">Criar conta</span><span class="${tab === 'in' ? 'on' : ''}" data-g="tab" data-t="in">Já tenho conta</span></div>
      ${tab === 'up' ? `<label class="gt-f"><span>Nome</span><input class="input" data-gi="name" value="${esc(name)}" placeholder="Como quer ser chamado?" autocomplete="name"></label>` : ''}
      <label class="gt-f"><span>E-mail</span><input class="input" type="email" inputmode="email" autocomplete="email" data-gi="email" value="${esc(email)}" placeholder="seu@email.com"></label>
      <label class="gt-f"><span>Senha</span><input class="input" type="password" autocomplete="${tab === 'up' ? 'new-password' : 'current-password'}" data-gi="pass" value="${esc(pass)}" placeholder="Mínimo 6 caracteres"></label>
      ${tab === 'up' ? check(ok) : ''}
      <button class="btn lime block" data-g="${tab}" ${busy ? 'disabled' : ''}>${busy ? 'Aguarde…' : tab === 'up' ? 'Criar conta' : 'Entrar'}</button>
      <button class="gt-lk" data-g="forgot">Esqueci minha senha</button>`;
    const ph = Screens.homePhoto ? Screens.homePhoto(Date.now()) : '';
    return `<div class="gt-ph" style="background-image:url('${ph}')"></div><div class="gt-top">${Screens.emblem(46)}<h1>GRAVITY</h1><div class="gt-sub">Seu treino, sua evolução e seu histórico<br>em um só lugar.</div>
      ${check(ok)}
      <button class="btn gt-gg" data-g="google" ${busy ? 'disabled' : ''}><span class="g">G</span>${busy ? 'Aguarde…' : 'Continuar com Google'}</button>
      <button class="btn ghost block" data-g="email">Entrar com e-mail</button>
      <div class="gt-lk small">Fotos de progresso nunca saem do seu celular.</div></div>`;
  }
  function paint() { if (!el) return; const st = el.scrollTop; el.innerHTML = html(); el.scrollTop = doc ? 0 : st; }

  const need = () => { if (!ok) { toast('Marque que aceita os Termos e a Política de Privacidade'); return false; } return true; };
  const online = () => { if (navigator.onLine === false) { toast('Conecte-se à internet para entrar'); return false; } return true; };
  // Aceite = sincronização ligada (decidido em 17/11).
  const consent = () => Cloud.set({ on: true, consentAt: Date.now(), termsV: (window.LEGAL && LEGAL.version) || '1.0' });
  async function run(fn) { if (busy) return; busy = true; paint(); try { await fn(); } catch (e) { toast(Cloud.msg(e)); } busy = false; paint(); }

  const act = {
    ok: () => { ok = !ok; paint(); },
    doc: (d) => { doc = d.d; paint(); },
    close: () => { doc = null; paint(); },
    email: () => { view = 'email'; paint(); },
    home: () => { view = 'home'; paint(); },
    tab: (d) => { tab = d.t; paint(); },
    google: () => { if (!need() || !online()) return; consent(); run(async () => { const u = await Cloud.google(); if (!u && window.Android) toast('Termine o login no navegador e volte ao app'); }); },
    up: () => { if (!need() || !online()) return; run(async () => { consent(); await Cloud.signUp(email, pass); if (name.trim()) { Store.state.settings.name = name.trim(); Store.save(); } pass = ''; }); },
    in: () => { if (!online()) return; run(async () => { if (!Cloud.state().consentAt) consent(); await Cloud.signIn(email, pass); pass = ''; }); },
    forgot: () => { if (!email.trim()) { toast('Digite seu e-mail acima'); return; } if (!online()) return; run(async () => { await Cloud.reset(email); toast('Enviamos um e-mail para redefinir a senha'); }); },
  };

  function show() {
    if (el) return;
    el = document.createElement('div'); el.className = 'gt'; el.id = 'gate';
    document.body.appendChild(el); paint();
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; e.preventDefault(); const f = act[b.dataset.g]; if (f) f(b.dataset); });
    el.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.gi; if (k === 'name') name = e.target.value; if (k === 'email') email = e.target.value; if (k === 'pass') pass = e.target.value; });
    if (!off) off = Cloud.on(() => { if (Cloud.user()) hide(true); });
    UI.overlayBack = () => { if (doc) { doc = null; paint(); return true; } if (view !== 'home') { view = 'home'; paint(); return true; } return true; };
  }
  function hide(loggedIn) {
    if (!el) return;
    const g = el; el = null; g.classList.add('out'); setTimeout(() => g.remove(), 380);
    UI.overlayBack = null;
    if (loggedIn && Cloud.afterLogin) setTimeout(() => Cloud.afterLogin(), 300);
  }
  // Ao abrir: quem não tem conta vê a tela (a abertura fica por cima até terminar).
  function start() {
    if (!window.Cloud) return;
    if (needed()) { show(); Cloud.load().catch(() => {}); return; }
    // Tinha conta neste celular: se o Firebase disser que a sessão acabou, mostra a tela de novo.
    if (!navigator.webdriver) setTimeout(() => Cloud.load().then(() => { if (!Cloud.user() && navigator.onLine !== false) { Cloud.set({ uid: null, email: null }); show(); } }).catch(() => {}), 2500);
  }
  window.Gate = { start, show, hide, needed };
})();
