// Temas do app. As cores ficam em variáveis CSS (css/app.css, bloco "Temas"); aqui só se escolhe qual vale.
// A escolha fica em settings.theme. A abertura é sempre escura.
(function () {
  'use strict';
  const LIST = [
    { id: 'dourado', nome: 'Dourado', desc: 'Preto e dourado', bar: '#08080a', light: false, sw: ['#08080a', '#161618', '#d9b25f', '#f3d48c'] },
    { id: 'galaxia', nome: 'Galáxia', desc: 'Preto com o roxo do logo', bar: '#07060b', light: false, sw: ['#07060b', '#16131f', '#a875ff', '#d6bfff'] },
    { id: 'titanio', nome: 'Titânio', desc: 'Grafite e prata', bar: '#0b0c0e', light: false, sw: ['#0b0c0e', '#191b1e', '#cdd3db', '#f1f4f7'] },
    { id: 'branco', nome: 'Branco', desc: 'Branco com o roxo do logo', bar: '#f6f5fa', light: true, sw: ['#f6f5fa', '#ffffff', '#9640fc', '#18141f'] },
  ];
  const get = (id) => LIST.find((t) => t.id === id) || LIST[0];
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
  }

  window.Theme = { LIST, get, current, apply, bars };
})();
