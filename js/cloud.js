// Login 1ª parte (decidido em 17/11): conta Gravity com e-mail/senha ou Google, sincronização dos dados
// na nuvem (Firebase, projeto gravity-app-241d8) com consentimento, e exclusão da conta.
// - O Firebase só é carregado quando a pessoa usa a conta (o app continua 100% offline sem conta).
// - Tudo continua salvo no celular; a nuvem é uma cópia. Fotos de progresso NUNCA sobem.
// - Dados na nuvem: users/{uid} (resumo) + users/{uid}/parts/{n} (o estado do app em pedaços de até 900 mil caracteres).
(function () {
  'use strict';
  const CFG = {
    apiKey: 'AIzaSyCQ9vXmqoswdzpHjUy32XlH1rhjzhdo5Ww',
    authDomain: 'gravity-app-241d8.firebaseapp.com',
    projectId: 'gravity-app-241d8',
    storageBucket: 'gravity-app-241d8.firebasestorage.app',
    messagingSenderId: '966186252453',
    appId: '1:966186252453:web:ba6b476625f56a13f8f54c',
  };
  // Página que faz o login com Google no navegador (o Google bloqueia login dentro do app Android).
  const GOOGLE_PAGE = 'https://mercadodequintal-droid.github.io/gravity/entrar-google.html';
  const LS = 'gravity-cloud';
  const CHUNK = 900000;

  let loading = null, auth = null, db = null, user = null, ready = false;
  const subs = [];
  const st = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } };
  const put = (o) => { const n = Object.assign(st(), o); try { localStorage.setItem(LS, JSON.stringify(n)); } catch (e) { /* sem espaço */ } return n; };
  const emit = () => subs.forEach((f) => { try { f(); } catch (e) { /* tela já fechada */ } });

  function script(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
  }
  // Carrega o Firebase (arquivos dentro do app) e espera saber se há alguém logado.
  function load() {
    if (loading) return loading;
    loading = (async () => {
      for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js']) await script('js/vendor/firebase/' + f);
      const fb = window.firebase;
      if (!fb.apps.length) fb.initializeApp(CFG);
      auth = fb.auth(); db = fb.firestore();
      try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) { /* já configurado */ }
      try { auth.languageCode = 'pt'; } catch (e) { /* opcional */ }
      await new Promise((res) => { const off = auth.onAuthStateChanged((u) => { user = u; ready = true; put({ email: u ? u.email : null, uid: u ? u.uid : null }); emit(); res(); }); void off; });
      auth.onAuthStateChanged((u) => { user = u; put({ email: u ? u.email : null, uid: u ? u.uid : null }); emit(); });
    })().catch((e) => { loading = null; throw e; });
    return loading;
  }

  // Mensagens do Firebase em português.
  const ERR = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/missing-password': 'Digite a senha.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Toque em Entrar.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
    'auth/too-many-requests': 'Muitas tentativas. Espere alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.',
    'auth/cancelled-popup-request': 'Login com Google cancelado.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Tente de novo.',
    'auth/requires-recent-login': 'Por segurança, entre de novo na conta e repita.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'permission-denied': 'Sem permissão para acessar os dados da nuvem.',
    'unavailable': 'Sem conexão com a nuvem agora. Tente de novo.',
  };
  const msg = (e) => ERR[(e && e.code) || ''] || (e && e.message === 'load' ? 'Não foi possível carregar o login.' : 'Algo deu errado. Tente de novo.');
  const offline = () => navigator.onLine === false;

  async function signUp(email, pass) { await load(); const r = await auth.createUserWithEmailAndPassword(email.trim(), pass); return r.user; }
  async function signIn(email, pass) { await load(); const r = await auth.signInWithEmailAndPassword(email.trim(), pass); return r.user; }
  async function reset(email) { await load(); await auth.sendPasswordResetEmail(email.trim()); }
  async function signOut() { await load(); await auth.signOut(); put({ on: false, lastSync: 0, lastHash: '' }); emit(); }

  // Google: no Android, abre a página no navegador e volta pelo link gravity://auth (onGoogleToken).
  // No iPhone e no navegador, abre a janela do Google direto.
  async function google() {
    if (window.Android) { put({ waitingGoogle: Date.now() }); UI.Native.open(GOOGLE_PAGE); return null; }
    await load();
    const p = new window.firebase.auth.GoogleAuthProvider();
    try { const r = await auth.signInWithPopup(p); return r.user; }
    catch (e) { if (e && e.code === 'auth/popup-blocked') { await auth.signInWithRedirect(p); return null; } throw e; }
  }
  async function onGoogleToken(idToken) {
    try {
      await load();
      const cred = window.firebase.auth.GoogleAuthProvider.credential(idToken);
      await auth.signInWithCredential(cred);
      put({ waitingGoogle: 0 });
      UI.toast('Conta conectada');
      if (window.Cloud && Cloud.afterLogin) Cloud.afterLogin();
    } catch (e) { UI.toast(msg(e)); }
  }

  // ---------- sincronização ----------
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; };
  const uref = () => db.collection('users').doc(user.uid);

  async function cloudInfo() {
    await load(); if (!user) return null;
    const d = await uref().get();
    return d.exists ? d.data() : null;
  }
  // Resumo de uso (aprovado em 17/11) para o painel do dono: calculado do que já é sincronizado,
  // sem perguntar nada novo. Fica em stats/{uid}; só a própria pessoa e a conta do dono podem ler.
  function summary() {
    const S = Store.state, st = S.settings, pf = st.profile || {}, now = Date.now(), D = 864e5;
    const done = S.sessions.filter((x) => !x.demo && x.sets.some((y) => y.done)).sort((a, b) => a.start - b.start);
    const last = done.length ? done[done.length - 1].start : null, first = done.length ? done[0].start : null;
    const since = (d) => done.filter((x) => x.start >= now - d * D).length;
    const weeks = first ? Math.max(1, (now - first) / (7 * D)) : 0;
    const h = { manha: 0, tarde: 0, noite: 0 };
    done.slice(-60).forEach((x) => { const hr = new Date(x.start).getHours(); h[hr < 12 ? 'manha' : hr < 18 ? 'tarde' : 'noite']++; });
    const p = Store.activePlan(), wk = p ? Store.planWeek(p) : null;
    const age = pf.birth ? Math.floor((now - new Date(pf.birth).getTime()) / (365.25 * D)) : null;
    const recs = (() => { try { return Analytics.recordCount(); } catch (e) { return 0; } })();
    const u = user;
    return {
      name: st.name || (u && u.displayName) || '', email: (u && u.email) || '',
      provider: u && u.providerData && u.providerData[0] ? (u.providerData[0].providerId === 'google.com' ? 'google' : 'email') : '',
      createdAt: u && u.metadata ? Date.parse(u.metadata.creationTime) || null : null,
      updatedAt: now, app: News.VERSION, device: (window.Feedback && Feedback.device()) || '',
      workouts: done.length, w7: since(7), w30: since(30), perWeek: weeks ? Math.round((done.length / weeks) * 10) / 10 : 0,
      lastWorkout: last, hours: h,
      plan: p ? p.name : '', planWeek: wk ? Math.max(0, Math.min(wk.n, wk.total)) : 0, planWeeks: wk ? wk.total : 0,
      features: { recordes: recs > 0, checkin: st.checkin !== false, voz: !!(window.Voice && Voice.cfg().on), fotos: (Store.photos ? Store.photos().length : 0) > 0, lembrete: !!st.reminder, tecnicas: done.some((x) => x.sets.some((y) => y.sub && y.done)) },
      profile: { age: age != null && age > 5 && age < 110 ? age : null, sex: st.bodyType || '', goal: pf.goal || (p && p.goal) || '', exp: pf.exp || '' },
      theme: st.theme || 'dourado',
    };
  }
  async function push(force) {
    await load(); if (!user) throw new Error('nologin');
    const text = Store.exportBackup(), h = hash(text);
    if (!force && st().lastHash === h) return false;
    const parts = []; for (let i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
    const batch = db.batch(), ref = uref();
    parts.forEach((t, i) => batch.set(ref.collection('parts').doc(String(i)), { t }));
    const old = (await ref.get()).data();
    for (let i = parts.length; old && i < (old.parts || 0); i++) batch.delete(ref.collection('parts').doc(String(i)));
    batch.set(ref, { v: 1, parts: parts.length, size: text.length, updatedAt: Date.now(), app: News.VERSION, device: (window.Feedback && Feedback.device()) || '' });
    await batch.commit();
    // Resumo separado: se a regra do painel ainda não existir, não atrapalha a sincronização.
    db.collection('stats').doc(user.uid).set(summary()).catch(() => {});
    put({ lastSync: Date.now(), lastHash: h });
    emit();
    return true;
  }
  async function pull() {
    await load(); if (!user) throw new Error('nologin');
    const ref = uref(), info = (await ref.get()).data();
    if (!info || !info.parts) throw new Error('vazio');
    let text = '';
    for (let i = 0; i < info.parts; i++) { const d = await ref.collection('parts').doc(String(i)).get(); text += (d.data() || {}).t || ''; }
    Store.importBackup(text);
    put({ lastSync: Date.now(), lastHash: hash(Store.exportBackup()) });
    emit();
  }
  async function wipeCloud() {
    const ref = uref(), info = (await ref.get()).data();
    const batch = db.batch();
    for (let i = 0; i < Math.max(1, (info && info.parts) || 0) + 2; i++) batch.delete(ref.collection('parts').doc(String(i)));
    batch.delete(ref);
    await batch.commit();
    await db.collection('stats').doc(user.uid).delete().catch(() => {});
  }
  // Excluir conta: apaga os dados da nuvem e a conta. Os dados no celular continuam.
  async function deleteAccount() {
    await load(); if (!user) return;
    await wipeCloud();
    await user.delete();
    put({ on: false, lastSync: 0, lastHash: '', email: null, uid: null });
    emit();
  }

  // Sincronização automática: depois de salvar, espera 1 min sem mudanças; ao sair do app, envia na hora.
  let timer = null;
  function schedule() {
    const s = st(); if (!s.on || !s.uid) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (!offline()) push().catch(() => { /* tenta de novo depois */ }); }, 60000);
  }
  function flush() { const s = st(); if (s.on && s.uid && !offline() && user) { clearTimeout(timer); timer = null; push().catch(() => {}); } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('online', () => { if (st().on && st().uid) schedule(); });
  // Liga no Store.save sem mexer no resto do app.
  function hook() {
    if (!window.Store || Store.__cloudHooked) return;
    const save0 = Store.save;
    Store.save = function () { const r = save0.apply(this, arguments); schedule(); return r; };
    Store.__cloudHooked = true;
  }
  hook();
  // Android: o login com Google pode ter aberto o app pelo link gravity://auth (app estava fechado).
  setTimeout(() => { try { const t = window.Android && Android.takeAuthToken && Android.takeAuthToken(); if (t) onGoogleToken(t); } catch (e) { /* versão antiga do app */ } }, 1500);
  // Quem já tem conta e sincronização ligada: carrega o Firebase em segundo plano ao abrir o app.
  setTimeout(() => { const s = st(); if (s.uid && !offline()) load().then(() => { if (s.on && user) push().catch(() => {}); }).catch(() => {}); }, 4000);

  window.Cloud = {
    load, summary, signUp, signIn, reset, signOut, google, onGoogleToken, push, pull, cloudInfo, deleteAccount, msg,
    state: st, set: put, user: () => user, ready: () => ready, email: () => (user ? user.email : st().email),
    on: (f) => { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; },
    afterLogin: null,
  };
})();
