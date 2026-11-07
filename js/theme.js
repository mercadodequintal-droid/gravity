// Temas do app. As cores ficam em variáveis CSS (css/app.css, bloco "Temas"); aqui só se escolhe qual vale.
// A escolha fica em settings.theme. A abertura é sempre escura.
(function () {
  'use strict';
  const LIST = [
    { id: 'dourado', nome: 'Dourado', desc: 'Preto e dourado', bar: '#08080a', light: false, sw: ['#08080a', '#161618', '#d9b25f', '#f3d48c'] },
    { id: 'galaxia', nome: 'Galáxia', desc: 'Preto com o roxo do logo', bar: '#07060b', light: false, sw: ['#07060b', '#16131f', '#a875ff', '#d6bfff'] },
    { id: 'titanio', nome: 'Titânio', desc: 'Grafite e prata', bar: '#0b0c0e', light: false, sw: ['#0b0c0e', '#191b1e', '#cdd3db', '#f1f4f7'] },
    { id: 'azul', nome: 'Azul', desc: 'Azul-marinho e azul elétrico', bar: '#0B1733', light: false, sw: ['#0B1733', '#172548', '#2F7BFF', '#7FB2FF'] },
    { id: 'luana', nome: 'Luana', desc: 'Rosa e branco', bar: '#FBE4EA', light: true, sw: ['#FBE4EA', '#FFF7F9', '#F27A9E', '#221A1E'] },
    { id: 'atelier', nome: 'Atelier', desc: 'Creme e ameixa', bar: '#F5EDE7', light: true, sw: ['#F5EDE7', '#FBF6F2', '#6B3D50', '#3A1F26'] },
  ];
  // O tema Branco saiu na v0.31; quem usava passa para o Azul.
  const get = (id) => LIST.find((t) => t.id === (id === 'branco' ? 'azul' : id)) || LIST[0];
  const current = () => get((Store.state.settings || {}).theme);

  // Barras do Android (status e navegação). dark = força escuro (durante a abertura).
  function bars(dark) {
    const t = current();
    try { window.Android && Android.systemBars && Android.systemBars(dark ? '#08080a' : t.bar, dark ? false : t.light); } catch (e) { /* ignora */ }
  }
  function apply(id) {
    if (id) Store.state.settings.theme = get(id).id;
    const t = current();
    document.documentElement.dataset.theme = t.id;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.bar;
    bars(!!document.getElementById('splash'));
    // O logo do botão Treinar muda com o tema (no Azul é o G na pedra).
    const core = document.querySelector('.nav [data-train] .core');
    if (core && window.Screens && Screens.emblem) core.innerHTML = Screens.emblem(36, 'nav');
  }

  window.Theme = { LIST, get, current, apply, bars };
})();
