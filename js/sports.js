// Treinos para melhorar a performance em esportes (v0.27): 20 esportes mais praticados no Brasil.
// Cada esporte tem 3 sessões (A, B, C) descritas por padrões de movimento (os mesmos do goals.js).
// O mesmo modelo serve para academia e para "sem equipamento": nesse caso cada padrão é trocado
// por um equivalente com o peso do corpo (BW_ALT). Questionário: posição, local, nível, dias,
// tempo por treino, fase da temporada e lesões.
(function () {
  'use strict';
  const S = (p, s, r, rest, n, t, v, g) => ({ p, s, r, rest, n, t, v, g });

  // ---------- modelos por tipo de esporte ----------
  const ARCH = {
    campo: [
      { nome: 'Força e aceleração', slots: [S('sprint', 5, '1', 120, 'Tiros de 10–20 m em velocidade máxima'), S('lateral', 3, '6', 60, 'Cada lado'), S('squat', 4, '5', 150), S('hipthrust', 3, '8', 90), S('nordic', 3, '5', 90, 'Desça o mais devagar possível'), S('adductor', 2, '', 60, 'Cada lado', 20), S('core', 3, '', 45, '', 40)] },
      { nome: 'Potência e agilidade', slots: [S('plyoH', 4, '5', 90), S('agility', 4, '', 60, 'Trocas de direção curtas', 20), S('singleLeg', 3, '6', 120, 'Cada perna'), S('hinge', 3, '6', 120), S('pullH', 3, '8', 90), S('pushH', 3, '8', 90), S('calves', 3, '12', 60)] },
      { nome: 'Unilateral e prevenção', slots: [S('plyoV', 3, '5', 90), S('lunge', 3, '8', 90), S('rowPull', 3, '10', 75), S('pushV', 3, '8', 90), S('nordic', 2, '6', 90), S('sidePlank', 3, '', 45, 'Cada lado', 30), S('balance', 2, '', 30, 'Cada perna', 30)] },
    ],
    quadra: [
      { nome: 'Salto e força', slots: [S('plyoV', 5, '4', 120, 'Máxima altura; descanse até estar 100%'), S('squat', 4, '5', 150), S('hipthrust', 3, '8', 90), S('calves', 4, '10', 60), S('shoulderPre', 3, '12', 45), S('core', 3, '', 45, '', 40)] },
      { nome: 'Potência e deslocamento', slots: [S('plyoH', 3, '5', 90), S('lateral', 3, '6', 60, 'Cada lado'), S('singleLeg', 3, '6', 120, 'Cada perna'), S('hinge', 3, '6', 120), S('pullV', 3, '8', 90), S('pushH', 3, '8', 90), S('balance', 2, '', 30, 'Cada perna', 30)] },
      { nome: 'Aterrissagem e prevenção', slots: [S('jumpBW', 3, '6', 90, 'Aterrissagem macia e silenciosa'), S('lunge', 3, '8', 90), S('nordic', 3, '5', 90), S('rowPull', 3, '10', 75), S('shoulderPre', 3, '12', 45), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
    ],
    raquete: [
      { nome: 'Rotação e potência', slots: [S('rotMB', 4, '6', 75, 'Cada lado, máxima velocidade'), S('lateral', 3, '6', 60, 'Cada lado'), S('squat', 3, '6', 150), S('pullH', 3, '8', 90), S('shoulderPre', 3, '12', 45), S('coreRot', 3, '8', 60)] },
      { nome: 'Deslocamento e força unilateral', slots: [S('agility', 4, '', 60, 'Deslocamento lateral curto', 20), S('lunge', 3, '8', 90, 'Em várias direções'), S('singleLeg', 3, '6', 120, 'Cada perna'), S('pushH', 3, '8', 90), S('pullV', 3, '8', 90), S('calves', 3, '12', 60), S('balance', 2, '', 30, 'Cada perna', 30)] },
      { nome: 'Prevenção de ombro e cotovelo', slots: [S('plyoH', 3, '5', 90), S('hinge', 3, '6', 120), S('rowPull', 3, '10', 75), S('shoulderPre', 3, '15', 45), S('grip', 3, '', 60, 'Pegada e antebraço', 30), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
    ],
    agarre: [
      { nome: 'Puxada e pegada', slots: [S('hinge', 4, '5', 150), S('pullV', 4, '6', 120), S('rowPull', 3, '8', 90), S('grip', 3, '', 60, 'Toalha ou kimono, se der', 30), S('carry', 3, '', 60, 'Pesado, ~30 m', 40), S('core', 3, '', 45, '', 40)] },
      { nome: 'Potência de quadril', slots: [S('olympic', 4, '3', 150, 'Explosivo'), S('hipthrust', 4, '6', 120), S('squat', 3, '6', 150), S('pushH', 3, '8', 90), S('coreRot', 3, '8', 60), S('grip', 2, '', 60, '', 30)] },
      { nome: 'Resistência de luta', slots: [S('burpee', 4, '10', 60, 'Ritmo de luta'), S('pullup', 3, '8', 60, 'Máximo com técnica'), S('lungeBW', 3, '12', 45), S('pushup', 3, '15', 45), S('sidePlank', 3, '', 45, 'Cada lado', 30), S('conditioning', 1, '', 60, '3 rounds: 2 min forte, 1 min leve', 540)] },
    ],
    golpe: [
      { nome: 'Potência de golpe A', slots: [S('plyoV', 4, '5', 120), S('olympic', 4, '3', 150, 'Explosivo'), S('punch', 4, '5', 90, 'Cada lado; gire o quadril como no golpe'), S('throwMB', 3, '6', 90), S('squat', 4, '5', 150), S('pullH', 3, '8', 90), S('coreRot', 3, '8', 60)] },
      { nome: 'Potência de golpe B', slots: [S('olympic', 4, '3', 150, '', 0, 1), S('punch', 3, '6', 90, '', 0, 1), S('rotMB', 4, '6', 75, 'Cada lado, máxima velocidade'), S('hipthrust', 4, '6', 120), S('pushH', 3, '6', 120), S('pullV', 3, '8', 90), S('calves', 3, '12', 60)] },
      { nome: 'Rounds e condicionamento', slots: [S('plyoH', 3, '5', 90), S('pushPower', 3, '5', 120), S('lunge', 3, '6', 120), S('carry', 3, '', 75, '', 40), S('coreRot', 3, '8', 60), S('conditioning', 1, '', 60, 'Rounds: 3 min forte, 1 min leve', 720)] },
    ],
    corrida: [
      { nome: 'Força para corrida A', slots: [S('squat', 4, '4', 180, 'Pesado, sem chegar à falha'), S('hinge', 3, '5', 150), S('calves', 3, '10', 75, 'Carga pesada'), S('plyoH', 3, '10', 75, 'Saltos curtos e rápidos'), S('core', 2, '', 45, '', 40)] },
      { nome: 'Força para corrida B', slots: [S('lunge', 3, '6', 120, 'Cada perna'), S('hipthrust', 3, '6', 120), S('nordic', 3, '5', 90), S('plyoV', 3, '5', 90), S('balance', 2, '', 30, 'Cada perna', 30), S('core', 2, '', 45, '', 40)] },
      { nome: 'Força para corrida C', slots: [S('squat', 3, '5', 180, '', 0, 1), S('singleLeg', 3, '6', 120, 'Cada perna'), S('calves', 3, '12', 60, '', 0, 1), S('plyoH', 3, '8', 75, '', 0, 1), S('adductor', 2, '', 45, '', 20), S('sidePlank', 2, '', 45, 'Cada lado', 30)] },
    ],
    caminhada: [
      { nome: 'Pernas e postura', slots: [S('squatEasy', 3, '10', 90, 'Sobrar 2–3 reps'), S('hipthrust', 3, '12', 90), S('pullH', 3, '10', 90), S('calves', 3, '15', 60), S('balance', 2, '', 30, 'Cada perna', 30), S('core', 2, '', 45, '', 30)] },
      { nome: 'Força geral', slots: [S('lunge', 2, '10', 90), S('pushH', 3, '10', 90), S('rowPull', 3, '10', 90), S('hingeBW', 2, '12', 90), S('sidePlank', 2, '', 45, 'Cada lado', 20), S('carry', 2, '', 60, '', 30)] },
      { nome: 'Equilíbrio e resistência', slots: [S('singleLeg', 2, '8', 90, 'Cada perna'), S('squatEasy', 3, '12', 90, '', 0, 1), S('pushV', 2, '10', 90), S('calves', 3, '15', 60, '', 0, 1), S('balance', 2, '', 30, 'Olhos fechados, se der', 30), S('cardio', 1, '', 60, 'Caminhada em ritmo forte', 1200)] },
    ],
    pedal: [
      { nome: 'Força de pedalada', slots: [S('squat', 4, '6', 150), S('singleLeg', 3, '8', 120, 'Cada perna'), S('hipthrust', 3, '8', 90), S('pullH', 3, '10', 75, 'Postura na bike'), S('core', 3, '', 45, '', 40)] },
      { nome: 'Posterior e estabilidade', slots: [S('hinge', 3, '6', 150), S('lunge', 3, '8', 90), S('calves', 3, '15', 60), S('coreRot', 3, '8', 60), S('pushH', 2, '10', 90), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
      { nome: 'Potência de sprint', slots: [S('plyoV', 3, '5', 120, 'Explosão como no sprint da bike'), S('squat', 3, '5', 150, '', 0, 1), S('nordic', 3, '5', 90), S('rowPull', 3, '10', 75), S('core', 3, '', 45, '', 40)] },
    ],
    nado: [
      { nome: 'Puxada e ombro', slots: [S('plyoV', 3, '5', 90, 'Explosão da saída e das viradas'), S('pullV', 4, '6', 120), S('pushH', 3, '8', 90), S('rowPull', 3, '10', 75), S('shoulderPre', 3, '15', 45), S('core', 3, '', 45, '', 40)] },
      { nome: 'Pernas e core', slots: [S('squat', 3, '6', 150), S('hipthrust', 3, '8', 90), S('pushV', 3, '8', 90), S('pullH', 3, '8', 90), S('coreRot', 3, '8', 60), S('shoulderPre', 2, '15', 45)] },
      { nome: 'Resistência de braçada', slots: [S('pullup', 3, '8', 75, 'Máximo com técnica'), S('pushup', 3, '15', 45), S('lunge', 3, '8', 90), S('delts', 3, '15', 45), S('sidePlank', 3, '', 45, 'Cada lado', 30), S('core', 2, '', 45, '', 40)] },
    ],
    prancha: [
      { nome: 'Equilíbrio e explosão', slots: [S('plyoV', 3, '5', 90), S('balance', 3, '', 30, 'Cada perna', 30), S('singleLeg', 3, '8', 120, 'Cada perna'), S('lateral', 3, '6', 60, 'Cada lado'), S('hipthrust', 3, '8', 90), S('coreRot', 3, '8', 60), S('calves', 3, '12', 60)] },
      { nome: 'Força e aterrissagem', slots: [S('jumpBW', 3, '6', 90, 'Aterrissagem macia'), S('squat', 3, '6', 150), S('lunge', 3, '8', 90), S('pushH', 3, '8', 90), S('pullH', 3, '8', 90), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
      { nome: 'Tornozelo, joelho e core', slots: [S('lateral', 3, '6', 60, '', 0, 0), S('nordic', 3, '5', 90), S('calves', 3, '15', 60, 'Devagar na descida'), S('balance', 3, '', 30, 'Olhos fechados, se der', 30), S('core', 3, '', 45, '', 40), S('rowPull', 3, '10', 75)] },
    ],
    surf: [
      { nome: 'Remada e ombro', slots: [S('pullV', 4, '6', 120, 'Força da remada na prancha'), S('pushup', 3, '12', 60, 'Rápido, como no "pop-up"'), S('shoulderPre', 3, '15', 45), S('coreRot', 3, '8', 60), S('balance', 3, '', 30, 'Cada perna', 30), S('squat', 3, '8', 120)] },
      { nome: 'Pop-up e pernas', slots: [S('burpee', 4, '8', 60, 'Suba para a prancha o mais rápido possível'), S('singleLeg', 3, '8', 120, 'Cada perna'), S('rowPull', 3, '10', 75), S('hipthrust', 3, '8', 90), S('sidePlank', 3, '', 45, 'Cada lado', 30)] },
      { nome: 'Potência e resistência', slots: [S('plyoV', 3, '5', 90), S('lunge', 3, '8', 90), S('pullV', 3, '8', 90, '', 0, 1), S('delts', 3, '15', 45), S('core', 3, '', 45, '', 40), S('conditioning', 1, '', 60, 'Intervalos: 30 s forte, 30 s leve', 480)] },
    ],
    atletismo: [
      { nome: 'Aceleração', slots: [S('sprint', 6, '1', 150, 'Tiros de 10–20 m em velocidade máxima'), S('sled', 4, '1', 150, '15–20 m com carga leve'), S('plyoH', 3, '6', 90), S('hipthrust', 4, '6', 120), S('squat', 3, '5', 180), S('nordic', 3, '5', 90)] },
      { nome: 'Velocidade e saltos', slots: [S('sprint', 5, '1', 180, 'Tiros de 30 m'), S('plyoV', 4, '5', 120), S('olympic', 4, '3', 150), S('hinge', 4, '5', 180), S('calves', 3, '10', 60), S('core', 3, '', 45, '', 40)] },
      { nome: 'Força e prevenção', slots: [S('plyoH', 4, '5', 120, '', 0, 1), S('squat', 4, '4', 180, '', 0, 1), S('lunge', 3, '6', 90), S('nordic', 3, '5', 90), S('adductor', 2, '', 60, 'Cada lado', 20), S('sidePlank', 2, '', 45, 'Cada lado', 30)] },
    ],
    funcional: [
      { nome: 'Força e levantamentos', slots: [S('olympic', 4, '3', 150, 'Técnica antes da carga'), S('squat', 4, '5', 150), S('pullup', 4, '6', 90), S('pushV', 3, '6', 120), S('burpee', 3, '10', 60, 'Finalizador')] },
      { nome: 'Corpo inteiro', slots: [S('hinge', 4, '5', 150), S('pushH', 4, '6', 120), S('rowPull', 3, '8', 90), S('lunge', 3, '10', 90), S('carry', 3, '', 60, '', 40), S('core', 3, '', 45, '', 40)] },
      { nome: 'Condicionamento (metcon)', slots: [S('burpee', 4, '10', 45, 'Circuito sem parar', 0, 0, 'g1'), S('pushup', 4, '15', 45, '', 0, 0, 'g1'), S('lungeBW', 4, '20', 45, '', 0, 0, 'g1'), S('situp', 4, '20', 60, '', 0, 0, 'g1'), S('conditioning', 1, '', 60, 'Pular corda ou tiros: 10 min', 600)] },
    ],
  };

  // ---------- esportes ----------
  // arch = modelo base; add = slot extra em cada sessão (por índice); goal = objetivo do goals.js (testes);
  // pos = posições (cada uma acrescenta um padrão na sessão A).
  const SPORTS = [
    { id: 'futebol', nome: 'Futebol', icon: 'bolt', arch: 'campo', goal: 'velocidade', foco: 'Aceleração, troca de direção, chute e prevenção de posterior e virilha.', lesoes: 'Posterior de coxa, virilha, tornozelo e joelho',
      pos: [['goleiro', 'Goleiro', S('lateral', 3, '6', 60, 'Saltos laterais de goleiro')], ['defensor', 'Defensor', S('plyoV', 3, '5', 90, 'Salto de cabeceio')], ['meio', 'Meio-campo', S('conditioning', 1, '', 60, 'Intervalos: 30 s forte, 30 s leve', 480)], ['atacante', 'Atacante', S('sprint', 3, '1', 120, 'Tiros com troca de direção')]] },
    { id: 'caminhada', nome: 'Caminhada', icon: 'timer', arch: 'caminhada', goal: 'saude', foco: 'Pernas fortes, postura, equilíbrio e resistência para caminhar mais e melhor.', lesoes: 'Joelho, quadril e tornozelo; quedas' },
    { id: 'musculacao', nome: 'Musculação', icon: 'dumbbell', goalPlan: 'hipertrofia', goal: 'hipertrofia', foco: 'Ganho de massa e força com divisão por grupos (usa o "Montar por objetivo").', lesoes: 'Ombro, lombar e cotovelo' },
    { id: 'corrida', nome: 'Corrida de rua', icon: 'timer', arch: 'corrida', goal: 'corrida', foco: 'Força pesada e saltos curtos para economia de corrida e menos lesões.', lesoes: 'Joelho (canelite, trato iliotibial), panturrilha e Aquiles' },
    { id: 'ciclismo', nome: 'Ciclismo', icon: 'repeat', arch: 'pedal', goal: 'saude', foco: 'Força de pernas, potência de sprint e postura na bike.', lesoes: 'Joelho, lombar e pescoço' },
    { id: 'volei', nome: 'Vôlei (quadra e praia)', icon: 'bolt', arch: 'quadra', goal: 'potencia', foco: 'Salto vertical, aterrissagem segura e ombro forte para atacar e sacar.', lesoes: 'Ombro, joelho (tendão patelar) e tornozelo',
      pos: [['levantador', 'Levantador', S('shoulderPre', 2, '15', 45)], ['ataque', 'Ponteiro / oposto', S('plyoV', 3, '4', 120, 'Salto de ataque')], ['central', 'Central', S('plyoV', 3, '4', 120, 'Salto de bloqueio')], ['libero', 'Líbero', S('lateral', 3, '6', 60, 'Deslocamento de defesa')]] },
    { id: 'natacao', nome: 'Natação', icon: 'repeat', arch: 'nado', goal: 'resistencia', foco: 'Puxada forte, ombros protegidos, core e explosão nas saídas e viradas.', lesoes: 'Ombro do nadador e lombar' },
    { id: 'futsal', nome: 'Futsal', icon: 'bolt', arch: 'campo', goal: 'velocidade', add: { 1: S('agility', 3, '', 60, 'Trocas de direção curtas', 20) }, foco: 'Arrancadas curtas, troca de direção em quadra e prevenção.', lesoes: 'Tornozelo, joelho, posterior e virilha',
      pos: [['goleiro', 'Goleiro', S('lateral', 3, '6', 60, 'Saltos laterais de goleiro')], ['linha', 'Linha', S('agility', 3, '', 60, '', 20)]] },
    { id: 'funcional', nome: 'Funcional / CrossFit', icon: 'flame', arch: 'funcional', goal: 'resistencia', foco: 'Força, levantamentos, ginástica e condicionamento.', lesoes: 'Ombro, lombar e punho' },
    { id: 'basquete', nome: 'Basquete', icon: 'bolt', arch: 'quadra', goal: 'potencia', add: { 1: S('agility', 3, '', 60, '', 20) }, foco: 'Salto, aceleração, troca de direção e contato.', lesoes: 'Tornozelo, joelho e dedos',
      pos: [['armador', 'Armador', S('agility', 3, '', 60, 'Mudanças de direção com drible', 20)], ['ala', 'Ala', S('plyoV', 3, '4', 120)], ['pivo', 'Pivô', S('pushH', 3, '6', 120, 'Força para o contato')]] },
    { id: 'jiujitsu', nome: 'Jiu-jitsu', icon: 'layers', arch: 'agarre', goal: 'resistencia', foco: 'Força de puxada, pegada, quadril e resistência para lutar até o fim.', lesoes: 'Joelho, ombro, pescoço, dedos e lombar' },
    { id: 'muaythai', nome: 'Muay thai e boxe', icon: 'target', arch: 'golpe', goal: 'soco', foco: 'Potência de golpe (pernas e quadril), rotação e condicionamento por rounds.', lesoes: 'Punho, ombro, canela e tornozelo' },
    { id: 'beachtennis', nome: 'Beach tennis', icon: 'target', arch: 'raquete', goal: 'potencia', add: { 0: S('lateral', 2, '6', 60, 'Na areia, se der') }, foco: 'Rotação, deslocamento na areia e ombro e cotovelo protegidos.', lesoes: 'Ombro, cotovelo (epicondilite) e panturrilha' },
    { id: 'futevolei', nome: 'Futevôlei', icon: 'bolt', arch: 'quadra', goal: 'potencia', add: { 0: S('lateral', 3, '6', 60, 'Cada lado'), 2: S('adductor', 2, '', 60, 'Cada lado', 20) }, foco: 'Salto, equilíbrio, mobilidade de quadril para o "shark" e o chute.', lesoes: 'Virilha, tornozelo, joelho e lombar' },
    { id: 'handebol', nome: 'Handebol', icon: 'bolt', arch: 'campo', goal: 'potencia', add: { 0: S('pushPower', 3, '5', 90, 'Arremesso explosivo'), 2: S('shoulderPre', 3, '12', 45) }, foco: 'Arremesso, salto, contato e mudanças de direção.', lesoes: 'Ombro, joelho e tornozelo',
      pos: [['goleiro', 'Goleiro', S('lateral', 3, '6', 60, 'Saltos laterais')], ['linha', 'Linha', S('throwMB', 3, '6', 90, 'Arremesso explosivo')]] },
    { id: 'skate', nome: 'Skate', icon: 'bolt', arch: 'prancha', goal: 'potencia', foco: 'Equilíbrio, explosão no ollie, aterrissagem e tornozelos fortes.', lesoes: 'Tornozelo, punho e joelho' },
    { id: 'surfe', nome: 'Surfe', icon: 'repeat', arch: 'surf', goal: 'resistencia', foco: 'Remada, "pop-up" rápido, equilíbrio e ombros protegidos.', lesoes: 'Ombro, lombar e joelho' },
    { id: 'tenis', nome: 'Tênis', icon: 'target', arch: 'raquete', goal: 'potencia', foco: 'Rotação, primeiro passo rápido, ombro e cotovelo protegidos.', lesoes: 'Ombro, cotovelo (epicondilite), punho e lombar' },
    { id: 'judo', nome: 'Judô', icon: 'layers', arch: 'agarre', goal: 'potencia', add: { 1: S('pullH', 3, '6', 90, 'Puxada de pegada') }, foco: 'Pegada, puxada, potência de quadril para as projeções e resistência.', lesoes: 'Ombro, joelho, dedos e lombar' },
    { id: 'atletismo', nome: 'Atletismo', icon: 'timer', arch: 'atletismo', goal: 'velocidade', foco: 'Velocidade, saltos e força (provas de velocidade e saltos).', lesoes: 'Posterior de coxa, Aquiles e virilha' },
  ];
  const sport = (id) => SPORTS.find((x) => x.id === id);

  const EQUIPS = [['academia', 'Academia'], ['nada', 'Sem equipamento']];
  const PHASES = [['fora', 'Fora de temporada', 'Base de força: um pouco mais de volume'], ['pre', 'Pré-temporada', 'Força e potência no máximo'], ['temporada', 'Em temporada', 'Manutenção: menos volume para chegar descansado aos jogos']];
  const TIMES = [[30, '30 min', 5], [45, '45 min', 6], [60, '60 min', 8], [75, '75 min', 9]];
  const INJ = [['ombro', 'Ombro'], ['joelho', 'Joelho'], ['lombar', 'Lombar'], ['tornozelo', 'Tornozelo']];

  // Sem equipamento: padrão equivalente com o peso do corpo.
  const BW_ALT = { olympic: 'jumpBW', throwMB: 'pushPower', rotMB: 'coreRot', sled: 'sprint', punch: 'pushPower', carry: 'grip', hinge: 'hingeBW', quadIso: 'squatEasy', hamIso: 'nordic', squatEasy: 'squat', cardio: 'conditioning', pullH: 'rowPull' };
  // Lesões: padrões a evitar e o que acrescentar.
  const INJ_RULE = {
    ombro: { drop: ['pushV', 'pushPower', 'punch', 'olympic'], add: S('shoulderPre', 2, '15', 45, 'Leve, sem dor') },
    joelho: { drop: ['plyoV', 'plyoH', 'lateral', 'jumpBW', 'agility'], add: S('balance', 2, '', 30, 'Cada perna', 30) },
    lombar: { drop: ['olympic'], swap: { hinge: 'hipthrust', hingeBW: 'hipthrust' }, add: S('sidePlank', 2, '', 45, 'Cada lado', 25) },
    tornozelo: { drop: ['lateral', 'agility', 'plyoH'], add: S('calves', 2, '15', 45, 'Devagar na descida') },
  };

  // Monta o plano. o = { sport, pos, equip: 'academia'|'nada', level, days, time, phase, injuries: [] }
  function buildPlan(o) {
    const sp = sport(o.sport);
    const equip = o.equip === 'nada' ? 'nada' : 'academia';
    const level = o.level || 'intermediario', days = Math.max(2, Math.min(5, Number(o.days) || 3));
    const phase = o.phase || 'fora', time = Number(o.time) || 60, inj = o.injuries || [];
    const label = (list, k) => (list.find((x) => x[0] === k) || [])[1];
    // Musculação: usa o "Montar por objetivo" (hipertrofia).
    if (sp.goalPlan) {
      const p = Goals.buildPlan({ primary: sp.goalPlan, days, level, equip: equip === 'nada' ? 'corpo' : 'academia' });
      p.name = sp.nome + ' · ' + label(EQUIPS, equip);
      p.objetivo = Object.assign(p.objetivo, { sport: sp.id });
      return p;
    }
    const base = ARCH[sp.arch];
    const maxEx = (TIMES.find((t) => t[0] === time) || TIMES[2])[2];
    const ctx = { equip, level };
    const plan = { id: Store.uid('p'), name: sp.nome + ' · ' + label(EQUIPS, equip), goal: days + ' dias · ' + label(Goals.LEVELS, level) + ' · ' + label(PHASES, phase) + ' · ' + time + ' min',
      weeks: phase === 'temporada' ? 8 : 6, startDate: Store.iso(Store.weekStartOf(Store.today(), Store.state.settings.weekStart)),
      objetivo: { sport: sp.id, primary: sp.goal, secondary: null, days, level, equip: equip === 'nada' ? 'corpo' : 'academia', phase, time, injuries: inj, pos: o.pos || null }, workouts: [] };
    const DAY = Goals.DAYS[days];
    const posSlot = sp.pos && o.pos ? (sp.pos.find((x) => x[0] === o.pos) || [])[2] : null;
    for (let i = 0; i < days; i++) {
      const t = base[i % base.length], round = Math.floor(i / base.length), k = i % base.length;
      let slots = t.slots.map((x) => Object.assign({}, x, { v: (x.v || 0) + round }));
      if (sp.add && sp.add[k]) slots.push(Object.assign({}, sp.add[k]));
      if (posSlot && k === 0) slots.unshift(Object.assign({}, posSlot));
      // Lesões: tira o que agrava, troca o que dá para trocar e acrescenta o cuidado.
      inj.forEach((key) => {
        const r = INJ_RULE[key]; if (!r) return;
        slots = slots.filter((x) => !r.drop.includes(x.p)).map((x) => (r.swap && r.swap[x.p] ? Object.assign({}, x, { p: r.swap[x.p] }) : x));
        if (!slots.some((x) => x.p === r.add.p)) slots.push(Object.assign({}, r.add));
      });
      // Fase da temporada: mais volume fora, menos durante.
      slots = slots.map((x) => {
        const b = Goals.BLOCK[x.p];
        if (phase === 'fora' && b === 1) return Object.assign({}, x, { s: x.s + 1 });
        if (phase === 'temporada' && b <= 2 && x.s > 2) return Object.assign({}, x, { s: x.s - 1 });
        return x;
      });
      // Tempo por treino: corta primeiro os acessórios, depois o condicionamento, depois o core.
      const prio = { 0: 0, 1: 1, 3: 2, 4: 3, 2: 4 };
      if (slots.length > maxEx) {
        const keep = slots.map((x, j) => ({ x, j })).sort((a, b) => (prio[Goals.BLOCK[a.x.p]] - prio[Goals.BLOCK[b.x.p]]) || (a.j - b.j)).slice(0, maxEx).map((o2) => o2.j);
        slots = slots.filter((x, j) => keep.includes(j));
      }
      slots = slots.map((x, j) => ({ x, j })).sort((a, b) => (Goals.BLOCK[a.x.p] - Goals.BLOCK[b.x.p]) || (a.j - b.j)).map((o2) => o2.x);
      const used = new Set(), gids = {}, items = [];
      slots.forEach((x) => {
        let pat = x.p, id = null;
        for (let tries = 0; tries < 3 && !id; tries++) {
          id = Goals.pick(pat, x.v || 0, ctx, used);
          if (!id && equip === 'nada' && BW_ALT[pat]) pat = BW_ALT[pat]; else if (!id) break;
        }
        if (!id) return;
        used.add(id);
        const ex = Store.exercise(id);
        let sets = x.s;
        if (level === 'iniciante' && Goals.BLOCK[pat] <= 2 && x.t == null) sets = Math.max(2, sets - 1);
        if (level === 'avancado' && Goals.BLOCK[pat] === 1) sets += 1;
        const reps = ex.tipo === 'tempo' ? String(x.t || 30) : (x.r || '10');
        const it = { id: Store.uid('i'), exId: id, sets, reps, kg: 0, rest: x.rest || 90, note: x.n || '', tech: null, group: null };
        if (x.g) it.group = { id: gids[x.g] || (gids[x.g] = Store.uid('g')), type: 'biset' };
        items.push(it);
      });
      Object.values(gids).forEach((gid) => {
        const mem = items.filter((it) => it.group && it.group.id === gid);
        const type = mem.length >= 4 ? 'gigante' : mem.length === 3 ? 'triset' : 'biset';
        mem.forEach((it) => { if (mem.length < 2) it.group = null; else it.group.type = type; });
      });
      plan.workouts.push({ id: Store.uid('w'), letter: String.fromCharCode(65 + i), name: t.nome + (round ? ' · variação' : ''), days: [DAY[i % DAY.length]], items });
    }
    return plan;
  }
  // Treino pronto: 3 dias, intermediário, fora de temporada, 60 min.
  const ready = (sportId, equip) => buildPlan({ sport: sportId, equip, level: 'intermediario', days: 3, time: 60, phase: 'fora', injuries: [] });

  // ====================== TELAS ======================
  function screens() {
    const { icon, esc, toast, push, pop, refresh, sheet, closeSheet } = UI;
    const St = () => Store.state;
    const topbar = (title) => `<div class="topbar"><button class="icon-btn" data-a="back">${icon('back')}</button><h1>${title}</h1></div>`;
    const preview = (plan) => `<div class="list">${plan.workouts.map((w) => `<div class="card goal-wo"><div class="row"><div class="letter">${esc(w.letter)}</div><div class="grow"><h4>${esc(w.name)}</h4><div class="meta">${Screens.daysText(w.days)} · ${w.items.length} exercícios · ~${Screens.estMinutes(w)} min</div></div></div>
      <ol>${w.items.map((it) => { const ex = Store.exercise(it.exId); return `<li><span class="grow ellipsis">${it.group ? '<i class="gdot"></i>' : ''}${esc(ex.nome)}</span><span class="num muted">${Tools.repsText(it, ex)}</span></li>`; }).join('')}</ol></div>`).join('')}</div>`;
    const use = (p) => { St().plans.push(p); St().activePlanId = p.id; Store.save(); toast('Plano criado e ativado'); };

    // Lista dos esportes + treinos prontos.
    function SportList() {
      return {
        hideNav: true,
        render: () => topbar('Treinos por esporte') + `<div class="content">
          <div class="small muted" style="margin:0 2px 12px">Treino de força, potência e prevenção para render mais no seu esporte. Escolha o esporte e responda o questionário, ou pegue um treino pronto (academia ou sem equipamento).</div>
          <div class="list">${SPORTS.map((x) => `<div class="card sport-card press" data-a="open" data-id="${x.id}"><div class="row"><span class="tb-ic">${icon(x.icon, 'sm')}</span><div class="grow"><b>${esc(x.nome)}</b><div class="small muted">${esc(x.foco)}</div></div>${icon('next', 'sm')}</div></div>`).join('')}</div>
          <div class="card small muted" style="margin-top:12px">${icon('info', 'sm')} O treino de academia complementa o treino do esporte (técnica, tática e jogo). Em semanas de jogo, use a fase "Em temporada".</div></div>`,
        actions: { back: pop, open: (ds) => push(SportWizard(ds.id)) },
      };
    }

    // Questionário de um esporte, com prévia ao vivo.
    function SportWizard(id) {
      const sp = sport(id);
      const o = { sport: id, pos: sp.pos ? sp.pos[0][0] : null, equip: 'academia', level: 'intermediario', days: 3, time: 60, phase: 'fora', injuries: [] };
      const seg = (a, list, cur) => `<div class="seg">${list.map(([k, l]) => `<button class="${String(cur) === String(k) ? 'on' : ''}" data-a="${a}" data-v="${k}">${l}</button>`).join('')}</div>`;
      let n = 0; const h = (t, extra) => `<div class="section-title"><h2>${++n}. ${t}</h2>${extra ? `<span class="small muted">${extra}</span>` : ''}</div>`;
      return {
        hideNav: true,
        render() {
          n = 0;
          const plan = buildPlan(o), ph = PHASES.find((x) => x[0] === o.phase);
          return topbar(esc(sp.nome)) + `<div class="content">
            <div class="card goal-info"><div class="small" style="color:var(--gold-2)">${esc(sp.foco)}</div><div class="tiny muted" style="margin-top:6px">Lesões mais comuns: ${esc(sp.lesoes)}.</div></div>
            <div class="section-title"><h2>Treino pronto</h2><span class="small muted">3 dias · 60 min</span></div>
            <div class="btn-row"><button class="btn ghost sm" data-a="ready" data-v="academia">${icon('dumbbell', 'sm')}Academia</button><button class="btn ghost sm" data-a="ready" data-v="nada">${icon('flame', 'sm')}Sem equipamento</button></div>
            <div class="tiny muted" style="margin:14px 2px 0">Ou responda para personalizar:</div>
            ${sp.pos ? h('Posição') + `<div class="filters wrap">${sp.pos.map(([k, l]) => `<button class="filter ${o.pos === k ? 'on' : ''}" data-a="pos" data-v="${k}">${esc(l)}</button>`).join('')}</div>` : ''}
            ${h('Onde vai treinar')}${seg('eq', EQUIPS, o.equip)}
            ${h('Nível')}${seg('lvl', Goals.LEVELS, o.level)}
            ${h('Dias por semana', 'além do esporte')}${seg('days', [[2, '2'], [3, '3'], [4, '4'], [5, '5']], o.days)}
            ${h('Tempo por treino')}${seg('time', TIMES, o.time)}
            ${sp.goalPlan ? '' : h('Fase da temporada') + seg('phase', PHASES.map((x) => [x[0], x[1].replace(' de temporada', '').replace('Em temporada', 'Temporada')]), o.phase) + `<div class="tiny muted" style="margin:6px 2px 0">${esc(ph[2])}</div>`}
            ${sp.goalPlan ? '' : h('Dor ou lesão', 'opcional') + `<div class="filters wrap">${INJ.map(([k, l]) => `<button class="filter ${o.injuries.includes(k) ? 'on' : ''}" data-a="inj" data-v="${k}">${l}</button>`).join('')}</div>${o.injuries.length ? '<div class="tiny muted" style="margin:6px 2px 0">Tiramos os exercícios que costumam piorar e acrescentamos um de cuidado. Dor forte ou que não passa: procure um médico ou fisioterapeuta.</div>' : ''}`}
            <div class="section-title"><h2>Seu plano</h2><span class="small muted">${plan.workouts.length} treinos · ${plan.weeks} semanas</span></div>
            ${preview(plan)}
            <button class="btn lime block" style="margin-top:16px" data-a="create">Criar e usar este plano</button></div>`;
        },
        actions: {
          back: pop,
          pos: (ds) => { o.pos = ds.v; refresh(); },
          eq: (ds) => { o.equip = ds.v; refresh(); },
          lvl: (ds) => { o.level = ds.v; refresh(); },
          days: (ds) => { o.days = Number(ds.v); refresh(); },
          time: (ds) => { o.time = Number(ds.v); refresh(); },
          phase: (ds) => { o.phase = ds.v; refresh(); },
          inj: (ds) => { const i = o.injuries.indexOf(ds.v); if (i >= 0) o.injuries.splice(i, 1); else o.injuries.push(ds.v); refresh(); },
          ready: (ds) => {
            const p = ready(id, ds.v);
            sheet({
              render: () => `<h3>${esc(p.name)}</h3><div class="desc">${esc(p.goal)}</div><div style="max-height:52vh;overflow:auto">${preview(p)}</div>
                <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Voltar</button><button class="btn lime" data-a="ok">Usar este plano</button></div>`,
              actions: { no: closeSheet, ok: () => { use(p); closeSheet(); pop(); pop(); } },
            });
          },
          create: () => { use(buildPlan(o)); pop(); pop(); },
        },
      };
    }
    Object.assign(window.Screens, { SportList, SportWizard });
  }
  if (window.Screens) screens(); else document.addEventListener('DOMContentLoaded', screens);

  window.Sports = { SPORTS, sport, EQUIPS, PHASES, TIMES, INJ, buildPlan, ready };
})();
