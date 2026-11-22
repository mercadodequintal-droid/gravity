// Extrato de Desculpas (aprovado em 22/11; prévia em docs/referencias/extrato-desculpas-previa-2026-11-22.*).
// No dia seguinte a um treino perdido, um cartão na tela inicial pergunta o motivo (um toque). No começo de cada
// mês, o "extrato" do mês anterior vira 4 stories (9:16) para compartilhar: extrato, desculpa favorita, custo por
// treino (só com o valor pago informado) e veredito. O valor pago por mês (mensalidade, Wellhub/Gympass,
// TotalPass ou outro) é pedido em 4 lugares até a pessoa preencher ou dizer que não paga (máx. 1 lembrete/semana).
// Tudo fica no celular; só sai do app se a pessoa tocar em Compartilhar.
(function () {
  'use strict';
  const { icon, esc, nf, toast, push, pop, refresh, sheet, closeSheet, Native } = UI;
  const S = () => Store.state;
  const WEEK = 7 * 86400000;

  const REASONS = [
    ['cansaco', '😴', 'Cansaço'], ['trabalho', '💼', 'Trabalho'], ['chuva', '🌧', 'Chuva'], ['dor', '🤕', 'Dor'],
    ['compromisso', '🎉', 'Compromisso'], ['doente', '🤒', 'Doente'], ['preguica', '🛋', 'Preguiça mesmo'], ['cachorro', '🐶', 'O cachorro comeu meu treino'],
  ];
  const RNAME = Object.fromEntries(REASONS.map(([k, , n]) => [k, n]));
  const KINDS = [['mensal', 'Mensalidade', 'de academia'], ['wellhub', 'Wellhub (Gympass)', 'de Wellhub'], ['totalpass', 'TotalPass', 'de TotalPass'], ['outro', 'Outro', 'para treinar']];
  const KDE = Object.fromEntries(KINDS.map(([k, , d]) => [k, d]));
  const FRASE = {
    cobranca: { cansaco: 'Cansado de quê, campeão?', trabalho: 'O chefe agradece. O shape, não.', chuva: 'Você não é de açúcar… ou é?', dor: 'Dor é sinal. Mas tantas vezes?', compromisso: 'Agenda cheia, treino vazio.', doente: 'Melhoras! Mas o extrato não perdoa.', preguica: 'Pelo menos é honesto.', cachorro: 'Clássico. Pelo menos o cachorro está forte.', skip: 'Nem desculpa você deu.', custom: 'Criatividade nota 10. Presença, nem tanto.' },
    gentil: { cansaco: 'Descansar também faz parte. Só não vira hábito.', trabalho: 'Semana puxada. Mês que vem a gente encaixa.', chuva: 'Dia de chuva acontece.', dor: 'Cuidar da dor é importante.', compromisso: 'A vida acontece. Bora retomar.', doente: 'Saúde primeiro. Melhoras!', preguica: 'Honestidade conta pontos.', cachorro: 'Dá um petisco pra ele e bora treinar!', skip: 'Sem problema. Mês que vem tem mais.', custom: 'Acontece com todo mundo.' },
  };

  // ---------- estado ----------
  function st() {
    const s = S();
    if (!s.excuse) {
      const d = Store.addDays(Store.today(), -3);
      s.excuse = { since: Store.iso(d), list: {}, custom: [], pay: null, noPay: false, payNag: 0, seen: {}, tone: 'cobranca' };
      Store.save();
    }
    const set = s.settings;
    if (set.excAsk === undefined) set.excAsk = true;
    if (set.excMonthly === undefined) set.excMonthly = true;
    return s.excuse;
  }
  const iso = (d) => Store.iso(d);
  const pDate = (s) => Store.parseISO(s);
  const planDays = () => { const p = Store.activePlan(); const set = new Set(); if (p) p.workouts.forEach((w) => (w.days || []).forEach((d) => set.add(d))); return set; };
  const sessionDays = () => new Set(S().sessions.filter((s) => s.sets.some((x) => x.done) || s.finished).map((s) => s.date));
  const Cap = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);
  const brDate = (s) => s.slice(8) + '/' + s.slice(5, 7);
  const money = (v) => 'R$ ' + (Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
  const reasonName = (r) => (r && r.c ? r.c : RNAME[r && r.r] || 'Sem desculpa');
  const reasonKey = (r) => (r && r.c ? 'c:' + r.c.toLowerCase() : (r && r.r) || 'skip');

  // Dias do plano que passaram sem treino e sem registro (do mais recente ao mais antigo, até 3 dias atrás).
  function pending() {
    const e = st(); if (!S().settings.excAsk) return null;
    const days = planDays(); if (!days.size) return null;
    const done = sessionDays(), t = Store.today();
    for (let i = 1; i <= 3; i++) {
      const d = Store.addDays(t, -i), k = iso(d);
      if (k < e.since) break;
      if (days.has(d.getDay()) && !done.has(k) && !e.list[k]) return k;
    }
    return null;
  }
  function workoutOf(k) { const p = Store.activePlan(), dow = pDate(k).getDay(); const w = p && p.workouts.find((x) => (x.days || []).includes(dow)); return w ? w.letter + ' · ' + w.name : 'O treino'; }

  // ---------- mês ----------
  function month(y, m) {
    const e = st(), days = planDays(), done = sessionDays();
    const last = new Date(y, m + 1, 0).getDate(), t = iso(Store.today());
    const rows = [], cal = [];
    let feitos = 0, faltas = 0;
    for (let d = 1; d <= last; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const r = e.list[k], dow = new Date(y, m, d).getDay();
      let s = '';
      if (done.has(k) || (r && r.t === 'fora')) { feitos++; s = 'ok'; }
      else if (k < t && k >= e.since && days.has(dow) && !(r && r.t === 'descanso')) { faltas++; s = 'x'; rows.push({ k, r, dow }); }
      cal.push({ d, s, dow });
    }
    const total = feitos + faltas, pres = total ? Math.round(feitos / total * 100) : 0;
    const cnt = {}; rows.forEach((x) => { const key = reasonKey(x.r); cnt[key] = cnt[key] || { n: 0, nome: reasonName(x.r), r: x.r && x.r.c ? 'custom' : (x.r && x.r.r) || 'skip' }; cnt[key].n++; });
    const rank = Object.values(cnt).sort((a, b) => b.n - a.n);
    const wd = {}; rows.forEach((x) => { wd[x.dow] = (wd[x.dow] || 0) + 1; });
    const worst = Object.entries(wd).sort((a, b) => b[1] - a[1])[0];
    return { y, m, nome: Analytics.month(y, m).nome, rows, cal, feitos, faltas, total, pres, rank, worst: worst && worst[1] > 1 ? { dow: Number(worst[0]), n: worst[1] } : null };
  }
  const prevMonth = () => { const n = new Date(); return n.getMonth() ? [n.getFullYear(), n.getMonth() - 1] : [n.getFullYear() - 1, 11]; };

  // ---------- valor pago ----------
  let kind = 'mensal', payVal = '';
  const needPay = () => { const e = st(); return !e.pay && !e.noPay; };
  const canNag = () => needPay() && Date.now() - (st().payNag || 0) > WEEK;
  function savePay(v) {
    v = parseFloat(String(v || '').replace(/[^\d,.]/g, '').replace(',', '.'));
    if (!(v > 0)) { toast('Digite o valor por mês'); return false; }
    st().pay = { v, kind }; payVal = ''; Store.save(); Native.vibrate(8); toast('Valor salvo: ' + money(v) + ' por mês'); return true;
  }
  const kindChips = () => `<div class="chips exc-kinds">${KINDS.map(([k, n]) => `<button class="chip ${kind === k ? 'on' : ''}" data-a="ex" data-op="kind" data-v="${k}">${n}</button>`).join('')}</div>`;
  const payForm = (btn) => `<div class="exc-pay"><input class="input num" type="text" inputmode="decimal" placeholder="R$ por mês" value="${esc(payVal)}" data-in="ex" data-op="payIn"><button class="btn lime sm" data-a="ex" data-op="pay">${btn || 'OK'}</button></div>`;

  // ---------- cartões da tela inicial ----------
  let just = null; // desculpa registrada agora (para o cartão de confirmação com o campo do valor)
  function homeCard() {
    const e = st();
    if (just) {
      const showPay = canNag();
      return `<div class="card exc-card appear"><span class="k">Desculpa registrada ✓</span><b>“${esc(just)}” anotado.</b>
        ${showPay ? `<small>Quer saber quanto essa falta custou? Quanto você paga por mês para treinar?</small>${kindChips()}${payForm()}
          <div class="chips"><button class="chip" data-a="ex" data-op="noPay">Não pago para treinar</button><button class="chip" data-a="ex" data-op="later">Depois</button></div>`
          : `<small>Vai para o seu Extrato de ${esc(Analytics.month(new Date().getFullYear(), new Date().getMonth()).nome.toLowerCase())}.</small><div class="btn-row" style="margin-top:10px"><button class="btn ghost sm" data-a="ex" data-op="ok">Fechar</button></div>`}</div>`;
    }
    const k = pending();
    if (k) {
      const ontem = k === iso(Store.addDays(Store.today(), -1));
      return `<div class="card exc-card appear"><button class="exc-x" data-a="ex" data-op="skip" data-k="${k}" aria-label="Fechar">${icon('x', 'sm')}</button>
        <span class="k">${ontem ? 'Ontem era dia de treino' : esc(Store.WEEKDAYS_LONG[pDate(k).getDay()]) + ' (' + brDate(k) + ') era dia de treino'}</span><b>${esc(workoutOf(k))} ficou para trás</b>
        <small>${e.tone === 'gentil' ? 'Acontece. O que rolou? Isso vai para o seu Extrato do mês.' : 'Sem julgamento (ainda). O que rolou? Isso vai para o seu Extrato do mês.'}</small>
        <div class="chips">${REASONS.map(([r, em, n]) => `<button class="chip" data-a="ex" data-op="r" data-k="${k}" data-v="${r}">${em} ${n}</button>`).join('')}<button class="chip" data-a="ex" data-op="other" data-k="${k}">✏️ Outra</button></div>
        <div class="btn-row" style="margin-top:10px"><button class="btn ghost sm" data-a="ex" data-op="fora" data-k="${k}">Treinei fora</button><button class="btn ghost sm" data-a="ex" data-op="descanso" data-k="${k}">Era descanso</button></div></div>`;
    }
    // Extrato do mês anterior chegou (dias 1 a 7).
    const n = new Date(), [py, pm] = prevMonth(), key = py + '-' + pm;
    if (S().settings.excMonthly && n.getDate() <= 7 && !e.seen[key]) {
      const M = month(py, pm);
      if (M.faltas || M.feitos) return `<button class="card exc-card exc-arrive press appear" data-a="ex" data-op="open" data-y="${py}" data-m="${pm}"><span class="k">Gravity Bank · extrato mensal</span><b>Seu Extrato de Desculpas de ${esc(M.nome.toLowerCase())} chegou</b><small>${M.faltas} ${M.faltas === 1 ? 'desculpa' : 'desculpas'} · ${M.pres}% de presença. Toque para ver.</small></button>`;
    }
    // A partir do dia 25: falta o valor pago para a conta do extrato fechar.
    if (S().settings.excMonthly && n.getDate() >= 25 && canNag()) {
      const left = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate() + 1;
      return `<div class="card exc-card exc-gold appear"><span class="k">Seu extrato chega em ${left} ${left === 1 ? 'dia' : 'dias'}</span><b>Falta um dado para a conta fechar</b>
        <small>Com o valor da mensalidade, Wellhub (Gympass) ou TotalPass, o extrato mostra quanto custou cada treino (e cada desculpa).</small>${kindChips()}${payForm('Salvar')}
        <div class="chips"><button class="chip" data-a="ex" data-op="noPay">Não pago para treinar</button><button class="chip" data-a="ex" data-op="later">Depois</button></div></div>`;
    }
    return '';
  }

  // Ações (cartões, Resumo do mês, story): data-a="ex" data-op="...".
  function act(ds, el) {
    const e = st();
    const rec = (k, v) => { e.list[k] = v; Store.save(); Native.vibrate(8); };
    switch (ds.op) {
      case 'r': rec(ds.k, { t: 'exc', r: ds.v }); just = RNAME[ds.v]; break;
      case 'skip': rec(ds.k, { t: 'exc', r: 'skip' }); break;
      case 'fora': rec(ds.k, { t: 'fora' }); toast('Boa! Conta como treino feito.'); break;
      case 'descanso': rec(ds.k, { t: 'descanso' }); toast('Ok, não conta como falta.'); break;
      case 'other': otherSheet(ds.k); return;
      case 'ok': just = null; break;
      case 'kind': kind = ds.v; break;
      case 'payIn': payVal = el.value; return;
      case 'pay': { const inp = el.closest('.exc-pay').querySelector('input'); if (!savePay(inp.value)) return; just = null; break; }
      case 'noPay': e.noPay = true; Store.save(); just = null; toast('Ok, não pergunto mais.'); break;
      case 'later': e.payNag = Date.now(); Store.save(); just = null; break;
      case 'open': push(Story(Number(ds.y), Number(ds.m))); return;
      default: return;
    }
    refresh();
  }

  function otherSheet(k) {
    let txt = '';
    sheet({
      render: () => `<h3>Outra desculpa</h3><div class="desc">${st().tone === 'gentil' ? 'Conta pra gente o que aconteceu.' : 'Capricha. Ela vai aparecer no seu extrato.'}</div>
        <input class="input" id="excTxt" maxlength="40" placeholder="Ex.: aniversário do primo" data-in="t" value="${esc(txt)}">
        ${st().custom.length ? `<div class="small muted" style="margin:14px 2px 6px">Suas desculpas já usadas:</div><div class="chips">${st().custom.slice(0, 8).map((c) => `<button class="chip" data-a="use" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="no">Cancelar</button><button class="btn lime" data-a="ok">Registrar</button></div>`,
      after: (el) => setTimeout(() => { const i = el.querySelector('#excTxt'); if (i) i.focus(); }, 350),
      actions: {
        t: (ds, el) => { txt = el.value; },
        use: (ds) => { txt = ds.v; document.getElementById('excTxt').value = txt; },
        no: closeSheet,
        ok: () => {
          const c = String(document.getElementById('excTxt').value || '').trim().slice(0, 40); if (!c) { toast('Escreva a desculpa'); return; }
          const e = st(); e.list[k] = { t: 'exc', c }; e.custom = [c].concat(e.custom.filter((x) => x.toLowerCase() !== c.toLowerCase())).slice(0, 12); Store.save();
          just = c; closeSheet(); setTimeout(refresh, 300);
        },
      },
    });
  }

  // ---------- stories ----------
  const frase = (r) => (FRASE[st().tone] || FRASE.cobranca)[r] || FRASE.cobranca.custom;
  function verdict(p) {
    const g = st().tone === 'gentil';
    if (p >= 90) return g ? 'Mês excelente. Parabéns!' : 'O banco aprova sem ressalvas.';
    if (p >= 70) return g ? 'Bom mês. Dá para ir ainda melhor.' : 'O banco aprova… com ressalvas.';
    if (p >= 50) return g ? 'Metade do caminho. Bora subir!' : 'Conta no vermelho, mas tem salvação.';
    return g ? 'Mês difícil. O próximo é uma nova chance.' : 'Nome sujo na praça do shape.';
  }
  function slides(M) {
    const e = st(), P = month(...(M.m ? [M.y, M.m - 1] : [M.y - 1, 11]));
    const list = [];
    list.push('extrato');
    if (M.rank.length) list.push('favorita');
    list.push('custo');
    list.push('veredito');
    return { list, P, e };
  }
  function slideHTML(kind, M, ctx) {
    const e = ctx.e;
    if (kind === 'extrato') {
      const rows = M.rows.slice(0, 9).map((x) => `<div class="l"><span>${brDate(x.k)} ${esc(reasonName(x.r).slice(0, 22))}</span><span class="neg">-1</span></div>`).join('') + (M.rows.length > 9 ? `<div class="l"><span>+ ${M.rows.length - 9} outras</span><span class="neg">-${M.rows.length - 9}</span></div>` : '');
      return `<span class="k">Gravity Bank · extrato mensal</span><div class="lead xl">${esc(M.nome.toUpperCase())}<br>CHEGOU A CONTA.</div>
        <div class="stmt"><div class="hd"><span>DATA  HISTÓRICO</span><span>TREINO</span></div>${rows || '<div class="l"><span>Nenhuma falta</span><span></span></div>'}
          <div class="l"><span>Treinos feitos</span><span class="pos">+${M.feitos}</span></div><div class="l tot"><span>SALDO DO MÊS</span><span>${M.feitos} / ${M.total}</span></div></div>
        ${M.faltas ? `<div class="stamp">${M.faltas} ${M.faltas === 1 ? 'DESCULPA' : 'DESCULPAS'}</div>` : '<div class="stamp ok">ZERO DESCULPAS</div>'}`;
    }
    if (kind === 'favorita') {
      const f = M.rank[0], max = f.n;
      return `<span class="k">Sua desculpa favorita</span><div class="big">“${esc(f.nome)}”</div><div class="lead">usada <em>${f.n} ${f.n === 1 ? 'vez' : 'vezes'}</em>.<br>${esc(frase(f.r))}</div>
        <div class="rank">${M.rank.slice(0, 5).map((x, i) => `<div class="r"><span class="n">${i + 1}</span><span class="lb">${esc(x.nome)}</span><span class="b" style="width:${Math.max(14, x.n / max * 110)}px"></span></div>`).join('')}</div>
        ${M.worst ? `<div class="s">Dia mais perigoso: <b>${esc(Store.WEEKDAYS_LONG[M.worst.dow].toLowerCase())}</b> (${M.worst.n} de ${M.faltas} faltas).</div>` : ''}`;
    }
    if (kind === 'custo') {
      if (!e.pay) return `<span class="k">Custo por treino</span><div class="lead xl">Quanto custou<br>cada treino?</div><div class="big dim">R$ ?</div>
        ${e.noPay ? '<div class="s">Você disse que não paga para treinar. Treino de graça, desculpa nenhuma!</div>' : `<div class="s">Informe quanto paga por mês (mensalidade, Wellhub/Gympass, TotalPass…) e este story aparece com a conta.</div>${kindChips()}${payForm('Ver')}<div class="s tiny">Este story não entra no compartilhamento enquanto estiver vazio.</div>`}`;
      const cpt = M.feitos ? e.pay.v / M.feitos : e.pay.v;
      return `<span class="k">Custo por treino</span><div class="lead">Você pagou</div><div class="big">${money(e.pay.v)}</div><div class="lead">${esc(KDE[e.pay.kind] || 'para treinar')} e foi <em>${M.feitos} ${M.feitos === 1 ? 'vez' : 'vezes'}</em>.</div>
        <div class="card exc-in"><div class="s">Cada treino saiu por</div><div class="money">${money(cpt)}</div>${M.faltas ? `<div class="s">As ${M.faltas} faltas jogaram fora <b class="red">${money(cpt * M.faltas)}</b>.${e.tone === 'gentil' ? '' : ' Dava um açaí grande… por semana.'}</div>` : '<div class="s">Nenhum centavo jogado fora. Respeito.</div>'}</div>`;
    }
    const ws = S().settings.weekStart || 0, first = (new Date(M.y, M.m, 1).getDay() - ws + 7) % 7;
    const P = ctx.P, cmp = P.total ? ` ${M.pres >= P.pres ? 'Melhor' : 'Pior'} que ${esc(P.nome.toLowerCase())} (${P.pres}%).` : '';
    const meta = Math.max(0, M.faltas - 2);
    return `<span class="k">Veredito do mês</span><div class="lead xl">${M.pres}% DE<br>PRESENÇA</div><div class="s">${esc(verdict(M.pres))}${cmp}</div>
      <div class="ecal">${Array.from({ length: 7 }, (_, k) => `<span class="h">${Store.WEEKDAYS[(k + ws) % 7].slice(0, 1)}</span>`).join('')}${'<span></span>'.repeat(first)}${M.cal.map((c) => `<span class="${c.s}">${c.d}</span>`).join('')}</div>
      <div class="card exc-in"><span class="k">Meta de ${esc(Analytics.month(M.m === 11 ? M.y + 1 : M.y, (M.m + 1) % 12).nome.toLowerCase())}</span><div class="s fg">${meta ? 'No máximo ' + meta + (meta === 1 ? ' desculpa.' : ' desculpas.') : 'Zero desculpas.'}${M.worst ? ' ' + esc(Cap(Store.WEEKDAYS_LONG[M.worst.dow])) + ' é o seu ponto fraco.' : ''}</div></div>`;
  }

  function Story(y, m) {
    const M0 = () => month(y, m);
    let i = 0;
    st().seen[y + '-' + m] = true; Store.save();
    const def = {
      hideNav: true,
      render() {
        const M = M0(), ctx = slides(M), k = ctx.list[Math.min(i, ctx.list.length - 1)];
        const blank = k === 'custo' && !ctx.e.pay;
        return `<div class="exc-story"><div class="bars">${ctx.list.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>
          <button class="icon-btn exc-close" data-a="back">${icon('x', 'sm')}</button>
          <div class="sti" data-a="next">${slideHTML(k, M, ctx)}</div>
          <div class="foot"><button class="icon-btn" data-a="prev" ${i ? '' : 'disabled style="opacity:.3"'} aria-label="Anterior">${icon('back', 'sm')}</button><span>${i + 1} de ${ctx.list.length}</span><button class="share" data-a="share" ${blank ? 'disabled' : ''}>${icon('share', 'sm')} Compartilhar</button></div></div>`;
      },
      actions: {
        back: pop,
        next: (ds, el, ev) => { if (ev && ev.target.closest('input,button.chip,.exc-pay')) return; const n = slides(M0()).list.length; if (i < n - 1) { i++; refresh(); } else pop(); },
        prev: () => { if (i > 0) { i--; refresh(); } },
        ex: (ds, el) => { if (ds.op === 'kind') { kind = ds.v; refresh(); } else if (ds.op === 'payIn') payVal = el.value; else if (ds.op === 'pay') { if (savePay(el.closest('.exc-pay').querySelector('input').value)) refresh(); } },
        share: () => { const M = M0(), ctx = slides(M); shareSlide(ctx.list[i], M, ctx); },
      },
    };
    return def;
  }

  // ---------- imagem do story (1080x1920) ----------
  async function shareSlide(kind, M, ctx) {
    try { await document.fonts.ready; } catch (e) { /* segue */ }
    const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), cs = getComputedStyle(document.documentElement);
    const v = (n, d) => (cs.getPropertyValue(n).trim() || d);
    const GOLD = v('--gold', '#d9b25f'), GOLD2 = v('--gold-2', '#f3d48c'), TXT = '#eee9dc', MUTED = '#9a9385', RED = '#e0574a', GREEN = '#5fc28a';
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, 0, 40, W / 2, 0, 1100); glow.addColorStop(0, 'rgba(120,90,30,.55)'); glow.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const font = (w, s, f) => { g.font = `${w} ${s}px ${f || 'Montserrat'}, sans-serif`; };
    const txt = (t, x, y, col, w, s, f, al) => { g.fillStyle = col; font(w, s, f); g.textAlign = al || 'left'; g.fillText(t, x, y); g.textAlign = 'left'; };
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
    const wrap = (t, x, y, maxW, lh, col, w, s, f) => { font(w, s, f); g.fillStyle = col; let line = '', yy = y; String(t).split(' ').forEach((word) => { const test = line ? line + ' ' + word : word; if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = word; yy += lh; } else line = test; }); if (line) g.fillText(line, x, yy); return yy + lh; };
    const X = 90;
    txt('G R A V I T Y', W / 2, 150, GOLD, 500, 40, 'Oswald', 'center');
    if (kind === 'extrato') {
      txt('GRAVITY BANK · EXTRATO MENSAL', X, 300, GOLD, 600, 28);
      txt(M.nome.toUpperCase(), X, 420, TXT, 600, 96, 'Oswald'); txt('CHEGOU A CONTA.', X, 520, TXT, 600, 96, 'Oswald');
      const rows = M.rows.slice(0, 12), top = 600, h = 270 + rows.length * 62;
      g.fillStyle = '#f1ead8'; rr(X, top, W - 2 * X, h, 14); g.fill();
      const mono = '"JetBrains Mono", monospace';
      txt('DATA  HISTÓRICO', X + 40, top + 70, '#1d1a14', 700, 30, mono); txt('TREINO', W - X - 40, top + 70, '#1d1a14', 700, 30, mono, 'right');
      rows.forEach((x, j) => { const yy = top + 140 + j * 62; txt(brDate(x.k) + ' ' + reasonName(x.r).slice(0, 18), X + 40, yy, '#1d1a14', 500, 32, mono); txt('-1', W - X - 40, yy, '#b3261e', 700, 32, mono, 'right'); });
      const yb = top + 140 + rows.length * 62;
      txt('Treinos feitos', X + 40, yb, '#1d1a14', 500, 32, mono); txt('+' + M.feitos, W - X - 40, yb, '#1d7a46', 700, 32, mono, 'right');
      g.fillStyle = '#8a826f'; g.fillRect(X + 40, yb + 22, W - 2 * X - 80, 2);
      txt('SALDO DO MÊS', X + 40, yb + 60, '#1d1a14', 700, 32, mono); txt(M.feitos + ' / ' + M.total, W - X - 40, yb + 60, '#1d1a14', 700, 32, mono, 'right');
      g.save(); g.translate(W - 330, top + h + 150); g.rotate(-0.24); g.strokeStyle = M.faltas ? RED : GREEN; g.lineWidth = 8; rr(-190, -60, 380, 110, 14); g.stroke();
      txt(M.faltas ? M.faltas + (M.faltas === 1 ? ' DESCULPA' : ' DESCULPAS') : 'ZERO DESCULPAS', 0, 22, M.faltas ? RED : GREEN, 700, 54, 'Oswald', 'center'); g.restore();
    } else if (kind === 'favorita') {
      const f = M.rank[0], max = f.n;
      txt('SUA DESCULPA FAVORITA', X, 320, GOLD, 600, 28);
      let y = wrap('“' + f.nome + '”', X, 480, W - 2 * X, 140, GOLD2, 700, 140, 'Oswald');
      txt('usada ' + f.n + (f.n === 1 ? ' vez.' : ' vezes.'), X, y + 10, TXT, 600, 60, 'Oswald');
      y = wrap(frase(f.r), X, y + 90, W - 2 * X, 70, TXT, 600, 60, 'Oswald');
      M.rank.slice(0, 5).forEach((x, j) => { const yy = y + 80 + j * 90; txt(String(j + 1), X, yy, GOLD, 700, 54, 'Oswald'); txt(x.nome.slice(0, 18), X + 70, yy - 6, TXT, 500, 38); const gr = g.createLinearGradient(560, 0, 900, 0); gr.addColorStop(0, GOLD2); gr.addColorStop(1, '#8c6b2e'); g.fillStyle = gr; rr(560, yy - 34, Math.max(30, x.n / max * 330), 26, 13); g.fill(); });
      if (M.worst) wrap('Dia mais perigoso: ' + Store.WEEKDAYS_LONG[M.worst.dow].toLowerCase() + ' (' + M.worst.n + ' de ' + M.faltas + ' faltas).', X, y + 80 + Math.min(5, M.rank.length) * 90 + 40, W - 2 * X, 50, MUTED, 500, 36);
    } else if (kind === 'custo') {
      const e = ctx.e, cpt = M.feitos ? e.pay.v / M.feitos : e.pay.v;
      txt('CUSTO POR TREINO', X, 320, GOLD, 600, 28);
      txt('Você pagou', X, 440, TXT, 600, 70, 'Oswald'); txt(money(e.pay.v), X, 640, GOLD2, 700, 180, 'Oswald');
      wrap((KDE[e.pay.kind] || 'para treinar') + ' e foi ' + M.feitos + (M.feitos === 1 ? ' vez.' : ' vezes.'), X, 760, W - 2 * X, 80, TXT, 600, 70, 'Oswald');
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(X, 870, W - 2 * X, 430, 34); g.fill(); g.strokeStyle = 'rgba(217,178,95,.3)'; g.lineWidth = 2; g.stroke();
      txt('Cada treino saiu por', X + 50, 960, MUTED, 500, 36); txt(money(cpt), X + 50, 1080, GOLD2, 700, 96, '"JetBrains Mono", monospace');
      if (M.faltas) { txt('As ' + M.faltas + ' faltas jogaram fora', X + 50, 1170, MUTED, 500, 36); txt(money(cpt * M.faltas), X + 50, 1240, RED, 700, 52); }
    } else {
      const P = ctx.P, ws = S().settings.weekStart || 0, first = (new Date(M.y, M.m, 1).getDay() - ws + 7) % 7;
      txt('VEREDITO DO MÊS', X, 320, GOLD, 600, 28);
      txt(M.pres + '% DE', X, 470, TXT, 700, 120, 'Oswald'); txt('PRESENÇA', X, 600, TXT, 700, 120, 'Oswald');
      let y = wrap(verdict(M.pres) + (P.total ? ` ${M.pres >= P.pres ? 'Melhor' : 'Pior'} que ${P.nome.toLowerCase()} (${P.pres}%).` : ''), X, 690, W - 2 * X, 54, MUTED, 500, 38);
      const cw = (W - 2 * X - 6 * 16) / 7;
      for (let k = 0; k < 7; k++) txt(Store.WEEKDAYS[(k + ws) % 7].slice(0, 1), X + k * (cw + 16) + cw / 2, y + 40, MUTED, 600, 30, 'Montserrat', 'center');
      M.cal.forEach((cl, j) => { const p = j + first, cx = X + (p % 7) * (cw + 16), cy = y + 70 + Math.floor(p / 7) * (cw * 0.72 + 16);
        g.fillStyle = cl.s === 'ok' ? 'rgba(95,194,138,.28)' : cl.s === 'x' ? 'rgba(224,87,74,.3)' : '#1b1b1e'; rr(cx, cy, cw, cw * 0.72, 14); g.fill();
        txt(String(cl.d), cx + cw / 2, cy + cw * 0.36 + 12, cl.s === 'ok' ? GREEN : cl.s === 'x' ? RED : MUTED, 600, 32, 'Montserrat', 'center'); });
      y += 70 + Math.ceil((M.cal.length + first) / 7) * (cw * 0.72 + 16) + 40;
      const meta = Math.max(0, M.faltas - 2);
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(X, y, W - 2 * X, 200, 30); g.fill();
      txt('META DO PRÓXIMO MÊS', X + 44, y + 70, GOLD, 600, 28);
      wrap((meta ? 'No máximo ' + meta + (meta === 1 ? ' desculpa.' : ' desculpas.') : 'Zero desculpas.') + (M.worst ? ' ' + Cap(Store.WEEKDAYS_LONG[M.worst.dow]) + ' é o seu ponto fraco.' : ''), X + 44, y + 130, W - 2 * X - 88, 48, TXT, 500, 36);
    }
    txt('gravityapp.com.br', W / 2, H - 110, MUTED, 500, 30, 'Montserrat', 'center');
    Native.shareImage(c.toDataURL('image/png'), `gravity-extrato-${M.y}-${String(M.m + 1).padStart(2, '0')}-${kind}.png`);
  }

  // ---------- Resumo do mês (M4) e Configurações ----------
  function monthCard(y, m) {
    const e = st(), M = month(y, m);
    const open = (M.faltas || M.feitos) ? `<button class="btn ghost block" style="margin-top:10px" data-a="ex" data-op="open" data-y="${y}" data-m="${m}">${icon('trophy', 'sm')}Ver Extrato de Desculpas</button>` : '';
    if (e.pay) { const cpt = M.feitos ? e.pay.v / M.feitos : 0; return `<div class="section-title"><h2>Custo por treino</h2><span class="small muted">${money(e.pay.v)}/mês</span></div><div class="card"><div class="kv"><span>Cada treino saiu por</span><b class="num">${M.feitos ? money(cpt) : '—'}</b></div>${M.faltas && M.feitos ? `<div class="kv"><span>${M.faltas} ${M.faltas === 1 ? 'falta' : 'faltas'}</span><b class="num" style="color:var(--red)">${money(cpt * M.faltas)}</b></div>` : ''}${open}</div>`; }
    if (e.noPay) return open ? `<div class="card" style="margin-top:12px">${open}</div>` : '';
    return `<div class="section-title"><h2>Custo por treino</h2></div><div class="card exc-card"><small>Você treinou ${M.feitos} ${M.feitos === 1 ? 'vez' : 'vezes'} neste mês. Informe quanto paga por mês (mensalidade ou app de academias) para ver quanto saiu cada treino.</small>${kindChips()}${payForm()}${open}</div>`;
  }
  function paySheet() {
    const e = st(); if (e.pay) kind = e.pay.kind; payVal = e.pay ? String(e.pay.v).replace('.', ',') : '';
    sheet({
      render: () => `<h3>Quanto pago para treinar</h3><div class="desc">Mensalidade, Wellhub (Gympass), TotalPass ou outro. Só para o custo por treino do Extrato.</div>${kindChips()}${payForm('Salvar')}
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-a="none">Não pago para treinar</button>${e.pay ? '<button class="btn ghost" data-a="clear">Apagar valor</button>' : ''}</div>`,
      actions: {
        ex: (ds, el) => { if (ds.op === 'kind') { kind = ds.v; UI.sheetRefresh(); } else if (ds.op === 'payIn') payVal = el.value; else if (ds.op === 'pay') { if (savePay(el.closest('.exc-pay').querySelector('input').value)) { closeSheet(); setTimeout(refresh, 300); } } },
        none: () => { e.pay = null; e.noPay = true; Store.save(); closeSheet(); setTimeout(refresh, 300); },
        clear: () => { e.pay = null; e.noPay = false; Store.save(); closeSheet(); setTimeout(refresh, 300); },
      },
    });
  }
  const paySum = () => { const e = st(); return e.pay ? money(e.pay.v) + ' · ' + KINDS.find((k) => k[0] === e.pay.kind)[1] : e.noPay ? 'Não pago para treinar' : 'Não informado'; };
  function setTone(v) { st().tone = v; Store.save(); }

  window.Excuse = { st, pending, month, homeCard, act, Story, monthCard, paySheet, paySum, setTone, REASONS };
})();
