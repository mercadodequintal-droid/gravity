// Temas do app. As cores ficam em variáveis CSS (css/app.css, bloco "Temas"); aqui só se escolhe qual vale.
// A escolha fica em settings.theme. A abertura é sempre escura.
(function () {
  'use strict';
  const LIST = [
    { id: 'dourado', nome: 'Dourado', desc: 'Grafite e amarelo ouro', bar: '#121214', light: false, sw: ['#121214', '#202024', '#f5c518', '#ffd95a'] },
    { id: 'sangue', nome: 'Sangue do inimigo', desc: 'Carbono e vermelho sangue', bar: '#121214', light: false, sw: ['#121214', '#202024', '#d0021b', '#ff6b7a'] },
    { id: 'planta', nome: 'Pai de planta', desc: 'Carbono e verde', bar: '#121214', light: false, sw: ['#121214', '#202024', '#16a34a', '#6ee39a'] },
    { id: 'azul', nome: 'Azul', desc: 'Azul-marinho e azul elétrico', bar: '#0B1733', light: false, sw: ['#0B1733', '#172548', '#2F7BFF', '#7FB2FF'] },
    { id: 'luana', nome: 'Luana', desc: 'Rosa e branco', bar: '#FBE4EA', light: true, sw: ['#FBE4EA', '#FFF7F9', '#F27A9E', '#221A1E'] },
    { id: 'atelier', nome: 'Atelier', desc: 'Creme e ameixa', bar: '#F5EDE7', light: true, sw: ['#F5EDE7', '#FBF6F2', '#6B3D50', '#3A1F26'] },
  ];
  // Temas que saíram: Branco (v0.31) → Azul; Galáxia e Titânio (v0.52) → Sangue do inimigo e Pai de planta.
  const OLD = { branco: 'azul', galaxia: 'sangue', titanio: 'planta' };
  const get = (id) => LIST.find((t) => t.id === (OLD[id] || id)) || LIST[0];
  const current = () => get((Store.state.settings || {}).theme);

  // Barras do Android (status e navegação). dark = força escuro (durante a abertura).
  function bars(dark) {
    const t = current();
    try { window.Android && Android.systemBars && Android.systemBars(dark ? '#08080a' : t.bar, dark ? false : t.light); } catch (e) { /* ignora */ }
  }
  function apply(id) {
    if (id) Store.state.settings.theme = get(id).id;
    const t = current();
    if (Store.state.settings && Store.state.settings.theme && Store.state.settings.theme !== t.id) Store.state.settings.theme = t.id; // tema antigo → novo
    document.documentElement.dataset.theme = t.id;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.bar;
    bars(!!document.getElementById('splash'));
    // O logo do botão Treinar muda com o tema (no Azul é o G na pedra).
    const core = document.querySelector('.nav [data-train] .core');
    if (core && window.Screens && Screens.emblem) core.innerHTML = Screens.emblem(36, 'nav');
  }

  window.Theme = { LIST, get, current, apply, bars };
})();
