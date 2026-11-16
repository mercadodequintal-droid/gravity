// v0.49 · Sugestões e problemas (aprovado em 14/11): três entradas abrem o mesmo Google Forms externo.
// O app só monta o link com a área, a versão e o aparelho (sem nada pessoal); a pessoa preenche e envia no navegador.
(function () {
  'use strict';
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdExTjlYNFQsohV_8pxW_SBSgyxxCZULL9Vx7dRC1kRlvChhw/viewform';
  const F = { area: 'entry.757315776', versao: 'entry.151950594', aparelho: 'entry.1867966027' };
  const AREAS = ['Treino', 'Planos', 'Exercícios', 'Progresso', 'Configurações', 'Perfil', 'Novidades e atualizações', 'Outro'];
  const st = () => Store.state.settings;

  // Só a plataforma e a versão do sistema, tiradas do navegador. Nada de identificador do aparelho.
  function device() {
    const ua = navigator.userAgent || '';
    const and = ua.match(/Android\s([\d.]+)/), ios = ua.match(/OS (\d+)[_.](\d+)/);
    if (window.Android || and) return 'Android' + (and ? ' ' + and[1] : '');
    if (/iPhone|iPad|iPod/.test(ua)) return (/iPad/.test(ua) ? 'iPad' : 'iPhone') + (ios ? ' · iOS ' + ios[1] + '.' + ios[2] : '');
    return 'Navegador';
  }

  function url(area, version) {
    const u = new URL(FORM);
    u.searchParams.set('usp', 'pp_url');
    if (area && AREAS.includes(area)) u.searchParams.set(F.area, area);
    u.searchParams.set(F.versao, version || News.VERSION);
    u.searchParams.set(F.aparelho, device());
    return u.toString();
  }

  function open(area, version) {
    if (navigator.onLine === false) { UI.toast('Você precisa de internet para enviar sua mensagem'); return false; }
    UI.Native.open(url(area, version));
    return true;
  }

  // Convite depois do treino: a partir do 3º treino concluído, no máximo 1 vez a cada 30 dias;
  // depois de 3 "Agora não" seguidos, não oferece mais (o acesso em Configurações › App continua).
  function inviteDue() {
    const s = st(), done = Store.state.sessions.filter((x) => x.finished && x.sets.some((y) => y.done)).length;
    if (done < 3 || (s.fbNo || 0) >= 3) return false;
    return !s.fbAt || Date.now() - s.fbAt > 30 * 86400000;
  }
  function inviteShown() { st().fbAt = Date.now(); Store.save(); }
  function inviteNo() { st().fbNo = (st().fbNo || 0) + 1; Store.save(); }
  function inviteYes() { st().fbNo = 0; Store.save(); open('Treino'); }

  window.Feedback = { url, open, device, AREAS, inviteDue, inviteShown, inviteNo, inviteYes };
})();
