// Exercícios por tempo (isometria e cardio). Complementa js/library.js, que é gerado por script.
(function () {
  'use strict';
  const L = window.LIBRARY = window.LIBRARY || [];
  const plank = L.find((e) => e.id === 'ex55');
  if (plank) plank.tipo = 'tempo';
  const farmer = L.find((e) => e.id === 'ex78');
  if (farmer) farmer.tipo = 'tempo';
  L.push(
    { id: 'tx01', nome: 'Prancha lateral', grupo: 'Abdômen', equip: 'Peso corporal', tipo: 'tempo', musculos: ['abdômen'], secundarios: ['ombros'], img: [],
      dicas: ['Apoie o antebraço sob o ombro', 'Quadril alto, corpo reto', 'Troque de lado na metade do tempo'] },
    { id: 'tx02', nome: 'Cadeira isométrica (parede)', grupo: 'Pernas', equip: 'Peso corporal', tipo: 'tempo', musculos: ['quadríceps'], secundarios: ['glúteos'], img: [],
      dicas: ['Costas apoiadas na parede', 'Joelhos a 90°', 'Peso nos calcanhares'] },
    { id: 'tx03', nome: 'Esteira', grupo: 'Cardio', equip: 'Máquina', tipo: 'tempo', musculos: [], secundarios: [], img: ['img/Cardio_Esteira_0.jpg'],
      dicas: ['Aqueça 3 min em ritmo leve', 'Mantenha um ritmo em que consiga falar frases curtas', 'Use a inclinação para aumentar a intensidade'] },
    { id: 'tx04', nome: 'Bicicleta ergométrica', grupo: 'Cardio', equip: 'Máquina', tipo: 'tempo', musculos: [], secundarios: [], img: ['img/Cardio_Bicicleta_0.jpg'],
      dicas: ['Ajuste o banco na altura do quadril', 'Joelho quase estendido embaixo', 'Cadência constante'] },
    { id: 'tx05', nome: 'Elíptico', grupo: 'Cardio', equip: 'Máquina', tipo: 'tempo', musculos: [], secundarios: [], img: ['img/Cardio_Eliptico_0.jpg'],
      dicas: ['Postura ereta', 'Use os braços junto', 'Ritmo constante'] },
    { id: 'tx06', nome: 'Pular corda', grupo: 'Cardio', equip: 'Corda', tipo: 'tempo', musculos: ['panturrilhas'], secundarios: [], img: ['img/Cardio_Pular_Corda_0.jpg'],
      dicas: ['Saltos baixos', 'Gire a corda com os punhos', 'Aterrisse na ponta dos pés'] },
    { id: 'tx07', nome: 'Escada (stair climber)', grupo: 'Cardio', equip: 'Máquina', tipo: 'tempo', musculos: ['glúteos'], secundarios: ['quadríceps'], img: ['img/Cardio_Escada_0.jpg'],
      dicas: ['Não se apoie nos corrimãos', 'Passos completos', 'Tronco levemente inclinado'] },
  );
})();

// Prevenção de lesões e testes (v0.10).
(function () {
  'use strict';
  window.LIBRARY.push(
    { id: 'tx08', nome: 'Prancha de Copenhagen (adutor)', grupo: 'Pernas', equip: 'Banco', tipo: 'tempo', musculos: ['adutores'], secundarios: ['abdômen'], img: [],
      dicas: ['Deitado de lado, perna de cima apoiada no banco', 'Suba o quadril e segure', 'Comece com o joelho apoiado (versão fácil)'] },
    // Para os treinos por esporte (v0.27), principalmente os sem equipamento. Ainda sem foto.
    { id: 'sx01', nome: 'Salto lateral (patinador)', grupo: 'Pernas', equip: 'Peso corporal', musculos: ['glúteos', 'quadríceps'], secundarios: ['panturrilhas', 'adutores'], img: ['img/SX_Salto_Patinador_0.jpg'],
      dicas: ['Salte de lado, de uma perna para a outra', 'Aterrisse macio, joelho alinhado com o pé', 'Segure 1 segundo antes do próximo salto'] },
    { id: 'sx02', nome: 'Rotação externa de ombro', grupo: 'Ombros', equip: 'Halteres', musculos: ['ombros'], secundarios: [], img: ['img/SX_Rotacao_Externa_Ombro_0.jpg'],
      dicas: ['Cotovelo colado ao corpo, a 90°', 'Gire o antebraço para fora devagar', 'Carga leve; também dá com elástico'] },
    { id: 'sx03', nome: 'Y-T-W deitado', grupo: 'Ombros', equip: 'Peso corporal', musculos: ['ombros', 'trapézio'], secundarios: ['meio das costas'], img: ['img/SX_YTW_Deitado_0.jpg'],
      dicas: ['Deitado de bruços, testa no chão', 'Eleve os braços formando Y, depois T, depois W', 'Polegares para cima, aperte as escápulas'] },
    { id: 'sx04', nome: 'Equilíbrio em uma perna', grupo: 'Pernas', equip: 'Peso corporal', tipo: 'tempo', musculos: ['panturrilhas'], secundarios: ['glúteos'], img: ['img/SX_Equilibrio_Uma_Perna_0.jpg'],
      dicas: ['Joelho levemente dobrado', 'Olhar fixo à frente; depois tente de olhos fechados', 'Troque de perna na metade do tempo'] },
    { id: 'sx05', nome: 'Suspensão na barra (pegada)', grupo: 'Costas', equip: 'Peso corporal', tipo: 'tempo', musculos: ['antebraços'], secundarios: ['dorsais'], img: ['img/SX_Suspensao_Barra_0.jpg'],
      dicas: ['Pendure com os braços estendidos', 'Ombros ativos (longe das orelhas)', 'Para jiu-jitsu e judô: use uma toalha ou o kimono'] },
    { id: 'sx06', nome: 'Burpee', grupo: 'Pernas', equip: 'Peso corporal', musculos: ['quadríceps', 'peitoral'], secundarios: ['ombros', 'abdômen'], img: ['img/SX_Burpee_0.jpg'],
      dicas: ['Agache, mãos no chão, pés para trás', 'Flexão (opcional), volte e salte', 'Ritmo constante, sem perder a técnica'] },
    { id: 'sx07', nome: 'Flexão pike (ombros)', grupo: 'Ombros', equip: 'Peso corporal', musculos: ['ombros'], secundarios: ['tríceps'], img: ['img/SX_Flexao_Pike_0.jpg'],
      dicas: ['Quadril alto, corpo em V invertido', 'Desça a cabeça em direção às mãos', 'Mais difícil: pés elevados'] },
    { id: 'sx08', nome: 'Panturrilha unilateral no degrau', grupo: 'Panturrilha', equip: 'Peso corporal', musculos: ['panturrilhas'], secundarios: [], img: ['img/SX_Panturrilha_Unilateral_Degrau_0.jpg'],
      dicas: ['Ponta do pé no degrau, calcanhar para fora', 'Desça devagar e suba o máximo', 'Apoie a mão na parede para equilíbrio'] },
    { id: 'sx09', nome: 'Deslocamento lateral (agilidade)', grupo: 'Cardio', equip: 'Peso corporal', tipo: 'tempo', musculos: ['quadríceps'], secundarios: ['glúteos', 'adutores'], img: ['img/SX_Deslocamento_Lateral_0.jpg'],
      dicas: ['Base baixa, sem cruzar os pés', 'Toque o chão nas trocas de direção', 'Máxima velocidade, com controle'] },
  );
})();

// Ajustes de músculos onde o banco de origem classifica de forma pouco útil para o mapa muscular.
(function () {
  'use strict';
  const fix = {
    ex80: [['quadríceps', 'posteriores de coxa', 'glúteos'], ['panturrilhas']],
    ex88: [['abdômen'], ['ombros', 'quadríceps']],
    ex67: [['glúteos', 'quadríceps'], ['ombros']],
    ex70: [['glúteos', 'posteriores de coxa'], ['ombros', 'lombar']],
    ex56: [['quadríceps', 'glúteos'], ['panturrilhas']],
    ex61: [['quadríceps'], ['panturrilhas', 'abdômen']],
    ex63: [['quadríceps', 'glúteos', 'posteriores de coxa'], ['trapézio', 'lombar']],
    ex74: [['ombros', 'tríceps'], ['peitoral', 'abdômen']],
  };
  window.LIBRARY.forEach((e) => { if (fix[e.id]) { e.musculos = fix[e.id][0]; e.secundarios = fix[e.id][1]; } });
})();

// Nomes usados na academia e nas fichas de treino, para a busca achar o exercício.
(function () {
  'use strict';
  const alias = {
    ex01: 'supino barra', ex03: 'supino declinado', ex05: 'crucifixo 35 inclinado halter', ex06: 'cros over crosover cross over', ex07: 'voador aberto peck deck',
    ex09: 'paralela', ex10: 'triceps puley pulley', ex11: 'triceps corda', ex13: 'triceps frances cabo', ex14: 'paralela', ex17: 'puley frente pulley frente puxada',
    ex18: 'remada baixa polia triangulo', ex19: 'remada curvada barra livre', ex21: 'remada cavalo barra t', ex22: 'barra livre barra fixa', ex23: 'pulldown corda pullover polia',
    ex24: 'terra dead lift deadlift', ex26: 'rosca alternada halter', ex28: 'rosca scot', ex31: 'leg 45 leg press', ex32: 'hack linear', ex34: 'extensora', ex35: 'flexora mesa',
    ex36: 'flexora cadeira', ex37: 'stiff barra', ex38: 'passada avanco halteres', ex39: 'elevacao pelvica hip thrust', ex41: 'panturrilha banco soleo', ex42: 'panturrilha livre',
    ex43: 'desenvolvimento militar halteres', ex44: 'desenvolvimento militar barra', ex45: 'arnold class', ex48: 'crucifixo inverso invertido', ex49: 'puxada alta corda face pull',
    ex50: 'remada alta barra', ex51: 'encolhimento halter', ex54: 'abd pendurado na barra', ex55: 'prancha isometrica', ex76: 'flexao nordica', ex81: 'agachamento frontal',
  };
  window.LIBRARY.forEach((e) => { if (alias[e.id]) e.alias = ((e.alias || '') + ' ' + alias[e.id]).trim(); });
})();
