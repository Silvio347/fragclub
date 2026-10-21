import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Shield, Target, ShieldCheck, BarChart3, Trophy, ArrowRight, Swords, Check } from 'lucide-react';
import { ALL_MAPS } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { LevelBadge, MapThumb } from '../components/ui';
import { Reveal, CountUp } from '../components/motion';

const MODES = [
  {
    icon: Crosshair,
    title: 'Ranqueada',
    text: 'Fila 5v5 com veto de mapas, sozinho ou com até 4 amigos. Cada vitória vale ELO.',
  },
  {
    icon: Swords,
    title: 'Lobbies & Desafios',
    text: 'Monte seu lobby, veja quem está online e escolha contra quem jogar.',
  },
  { icon: Shield, title: 'Retake', text: 'Servidores dedicados para treinar retomada e pós-plant.' },
  { icon: Target, title: 'Deathmatch', text: 'Aquecimento com filtros: só HS, pistolas, rifles ou AWP.' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Anti-cheat próprio', text: 'Cliente leve rodando em todas as partidas ranqueadas.' },
  { icon: BarChart3, title: 'Stats de verdade', text: 'Rating 3.0, KAST, ADR, Round Swing e histórico completo.' },
  { icon: Trophy, title: 'Campeonatos semanais', text: 'Do iniciante ao level 10, com premiação em dinheiro.' },
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="FragClub, página inicial">
      <span className="brand-mark">F</span>
      <span className="brand-name">
        FRAG<span className="accent">CLUB</span>
      </span>
    </Link>
  );
}

const SECTIONS = [
  { id: 'modos', label: 'Modos' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'levels', label: 'Levels' },
];

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Destaca no menu a seção visível (scrollspy)
function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    const onTop = () => window.scrollY < 200 && setActive(null);
    window.addEventListener('scroll', onTop, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onTop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return active;
}

export default function Landing() {
  const { user } = useAuth();
  const marquee = [...ALL_MAPS, ...ALL_MAPS];
  const active = useActiveSection(SECTIONS.map((s) => s.id));
  const arriveTimer = useRef(null);
  const arriveCleanup = useRef(null);

  // Rolagem suave até a seção + animação de "chegada" quando ela já foi revelada
  const goTo = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = prefersReducedMotion();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    if (reduce) return;
    el.classList.remove('lp-arrive');
    clearTimeout(arriveTimer.current);
    arriveCleanup.current?.();

    // A classe fica até o próximo clique (remover reiniciaria as animações de reveal)
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      arriveCleanup.current?.();
      void el.offsetWidth; // força reflow para a animação recomeçar
      el.classList.add('lp-arrive');
    };

    // Anima quando a rolagem termina (scrollend) ou após um tempo máximo
    const alreadyThere = Math.abs(el.getBoundingClientRect().top - 40) < 8;
    if (alreadyThere) return start();
    window.addEventListener('scrollend', start, { once: true });
    arriveTimer.current = setTimeout(start, 1200);
    arriveCleanup.current = () => {
      window.removeEventListener('scrollend', start);
      clearTimeout(arriveTimer.current);
      arriveCleanup.current = null;
    };
  };

  useEffect(() => () => arriveCleanup.current?.(), []);

  return (
    <div className="landing">
      <header className="lp-nav">
        <Brand />
        <nav aria-label="Seções" className="lp-links">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? 'active' : ''}
              aria-current={active === s.id ? 'true' : undefined}
              onClick={(e) => goTo(e, s.id)}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="lp-nav-actions">
          {user ? (
            <Link to="/inicio" className="btn btn-primary">
              Abrir o app <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-bg" aria-hidden="true">
          <div className="lp-grid" />
          <div className="lp-orb orb-1" />
          <div className="lp-orb orb-2" />
          <div className="lp-orb orb-3" />
        </div>

        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <span className="lp-pill">
              <span className="pulse-dot" aria-hidden="true" /> Counter-Strike 2 · Temporada 4 no ar
            </span>
            <h1>
              O CS2 competitivo <span className="lp-gradient">do jeito certo.</span>
            </h1>
            <p>
              Fila ranqueada, lobbies para desafiar quem você quiser, servidores de retake e DM, e campeonatos toda
              semana. Tudo num lugar só.
            </p>
            <div className="lp-cta">
              <Link to={user ? '/jogar' : '/cadastro'} className="btn btn-primary btn-xl lp-glow">
                <Crosshair size={20} aria-hidden="true" /> {user ? 'Jogar agora' : 'Começar grátis'}
              </Link>
              <a href="#modos" className="btn btn-ghost btn-lg" onClick={(e) => goTo(e, 'modos')}>
                Ver modos
              </a>
            </div>
            <dl className="lp-counters">
              <div>
                <dt>Jogadores online</dt>
                <dd>
                  <CountUp to={48213} />
                </dd>
              </div>
              <div>
                <dt>Partidas hoje</dt>
                <dd>
                  <CountUp to={132540} />
                </dd>
              </div>
              <div>
                <dt>Em prêmios/mês</dt>
                <dd>
                  R$ <CountUp to={85} suffix="k" />
                </dd>
              </div>
            </dl>
          </div>

          <div className="lp-hero-visual" aria-hidden="true">
            <div className="lp-crosshair">
              <span />
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="lp-float card-a">
              <span className="eyebrow">Ranqueada 5v5</span>
              <strong className="lp-found">Partida encontrada</strong>
              <div className="lp-dots">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 0.25}s` }} />
                ))}
              </div>
              <span className="btn btn-primary btn-sm">Aceitar</span>
            </div>
            <div className="lp-float card-b">
              <MapThumb map={ALL_MAPS[0]} height={86} />
              <div className="lp-player">
                <LevelBadge level={10} size={44} />
                <div>
                  <strong>2.341 ELO</strong>
                  <span className="muted small">Rating 1.34 · KAST 79%</span>
                </div>
              </div>
            </div>
            <div className="lp-float card-c">
              <span className="text-win strong">+27</span>
              <span className="muted small">Vitória 13:9 · Ancient</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-marquee" aria-label="Mapas disponíveis">
        <div className="lp-marquee-track">
          {marquee.map((m, i) => (
            <MapThumb key={`${m.id}-${i}`} map={m} height={120} className="lp-marquee-item" />
          ))}
        </div>
      </section>

      <section id="modos" className="lp-section">
        <Reveal className="lp-section-head">
          <span className="eyebrow">Modos de jogo</span>
          <h2>Fila ranqueada ou lobby aberto. Você escolhe.</h2>
          <p className="muted">
            Puxe fila com a sua party ou entre na lista de lobbies e desafie quem estiver disponível.
          </p>
        </Reveal>
        <div className="lp-cards">
          {MODES.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.title} delay={i * 90} className="lp-card">
                <span className="lp-card-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{m.title}</h3>
                <p className="muted">{m.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="stats" className="lp-section lp-split">
        <Reveal className="lp-split-text">
          <span className="eyebrow">Estatísticas</span>
          <h2>Saiba exatamente onde você está evoluindo.</h2>
          <ul className="lp-checks">
            <li>
              <Check size={16} aria-hidden="true" /> Rating 3.0, KAST, ADR e Round Swing por partida
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> Gráfico de ELO com detalhe de cada jogo
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> Desempenho por mapa, clutches e opening duels
            </li>
          </ul>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="lp-feature">
                <Icon size={18} aria-hidden="true" />
                <div>
                  <strong>{f.title}</strong>
                  <p className="muted small">{f.text}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
        <Reveal delay={120} className="lp-stats-panel">
          <div className="lp-stat-grid">
            {[
              ['Rating 3.0', '1.21'],
              ['KAST', '76%'],
              ['ADR', '88.4'],
              ['Round Swing', '+2.3%'],
            ].map(([k, v]) => (
              <div key={k} className="lp-stat">
                <span className="muted small">{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 400 140" className="lp-chart" aria-hidden="true">
            <defs>
              <linearGradient id="lpFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,110 L40,96 L80,102 L120,80 L160,86 L200,62 L240,70 L280,46 L320,52 L360,30 L400,22 L400,140 L0,140 Z"
              fill="url(#lpFill)"
            />
            <path
              className="lp-chart-line"
              d="M0,110 L40,96 L80,102 L120,80 L160,86 L200,62 L240,70 L280,46 L320,52 L360,30 L400,22"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="3"
            />
          </svg>
        </Reveal>
      </section>

      <section id="levels" className="lp-section">
        <Reveal className="lp-section-head">
          <span className="eyebrow">Progressão</span>
          <h2>10 levels. Um só objetivo.</h2>
          <p className="muted">Suba de level ganhando ELO nas ranqueadas. Level 10 é para poucos.</p>
        </Reveal>
        <Reveal className="lp-levels">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="lp-level" style={{ transitionDelay: `${i * 60}ms` }}>
              <LevelBadge level={i + 1} size={i === 9 ? 68 : 52} />
            </div>
          ))}
        </Reveal>
      </section>

      <section className="lp-section">
        <Reveal className="lp-final">
          <h2>Bora pro servidor?</h2>
          <p className="muted">Crie sua conta em menos de um minuto e entre na fila hoje.</p>
          <Link to={user ? '/jogar' : '/cadastro'} className="btn btn-primary btn-xl lp-glow">
            {user ? 'Jogar agora' : 'Criar conta grátis'} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      <footer className="lp-footer">
        <Brand />
        <p className="muted small">
          Projeto de estudo. Não afiliado à Valve Corporation. Counter-Strike é marca da Valve Corporation.
        </p>
      </footer>
    </div>
  );
}
