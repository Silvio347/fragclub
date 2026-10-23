import { Suspense, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import PageLoader from './PageLoader';
import {
  Home,
  Crosshair,
  Trophy,
  Medal,
  User,
  Settings,
  UserRound,
  Crown,
  X,
  LogOut,
  Users,
  History,
  Shield,
  ShoppingBag,
  Coins,
  Menu,
  MessagesSquare,
  Search,
} from 'lucide-react';
import { ME } from '../data/mock';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';
import { useShop } from '../context/ShopContext';
import { useTeams } from '../context/TeamsContext';
import { useNotifications } from '../context/NotificationsContext';
import { formatTime } from '../utils/random';
import { Avatar, LevelBadge, Nick } from './ui';
import MatchFoundModal from './MatchFoundModal';
import NotificationsMenu from './NotificationsMenu';
import GlobalSearch from './GlobalSearch';
import Onboarding from './Onboarding';

// Montado no render para refletir o nick da sessão
function navItems() {
  return [
    { to: '/inicio', label: 'Início', icon: Home },
    { to: '/jogar', label: 'Jogar', icon: Crosshair },
    { to: '/times', label: 'Times', icon: Shield },
    { to: '/amigos', label: 'Amigos', icon: UserRound },
    { to: '/forum', label: 'Fórum', icon: MessagesSquare },
    { to: '/ranking', label: 'Ranking', icon: Trophy },
    { to: '/campeonatos', label: 'Campeonatos', icon: Medal },
    { to: `/historico/${ME.nick}`, label: 'Partidas', icon: History },
    { to: '/loja', label: 'Loja', icon: ShoppingBag },
    { to: `/perfil/${ME.nick}`, label: 'Perfil', icon: User },
    { to: '/premium', label: 'Premium', icon: Crown },
  ];
}

// No celular: barra fixa embaixo com os atalhos principais + gaveta "Mais"
const MOBILE_MAIN = ['/inicio', '/jogar', '/times', '/loja'];

function MobileNav({ onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = navItems();
  const main = items.filter((i) => MOBILE_MAIN.includes(i.to));
  const more = items.filter((i) => !MOBILE_MAIN.includes(i.to));

  // Fecha a gaveta ao trocar de página ou apertar Esc
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="mobile-nav" aria-label="Navegação principal (celular)">
        {main.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="mobile-nav-link">
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-link ${open ? 'active' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-more"
        >
          <Menu size={20} aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>
      {open && (
        <div className="mobile-sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            id="mobile-more"
            className="mobile-sheet"
            role="dialog"
            aria-label="Mais opções"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mobile-sheet-handle" aria-hidden="true" />
            <div className="mobile-sheet-grid">
              {[...more, { to: '/configuracoes', label: 'Configurações', icon: Settings }].map(
                ({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className="mobile-sheet-item">
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ),
              )}
              <button type="button" className="mobile-sheet-item" onClick={onLogout}>
                <LogOut size={20} aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const nav = navItems();

  return (
    <aside className="sidebar">
      <Link to="/inicio" className="brand" aria-label="FragClub, início">
        <span className="brand-mark">F</span>
        <span className="brand-name">
          FRAG<span className="accent">CLUB</span>
        </span>
      </Link>

      <nav className="nav" aria-label="Navegação principal">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="nav-link">
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {user?.premium ? (
        <Link to="/premium" className="premium-card premium-card-active">
          <Crown size={20} aria-hidden="true" />
          <strong>Premium ativo</strong>
          <p>Ver benefícios e gerenciar assinatura.</p>
        </Link>
      ) : (
        <div className="premium-card">
          <Crown size={20} aria-hidden="true" />
          <strong>FragClub Premium</strong>
          <p>Fila prioritária, servidores exclusivos de DM/Retake e stats avançadas. A partir de R$ 19,90/mês.</p>
          <Link to="/premium" className="btn btn-primary btn-sm">
            Assinar
          </Link>
        </div>
      )}
    </aside>
  );
}

function useLogout() {
  const { cancel } = useQueue();
  const { logout } = useAuth();
  const navigate = useNavigate();
  return () => {
    cancel();
    logout();
    navigate('/', { replace: true });
  };
}

function Topbar() {
  const { status, elapsed, cancel, mode } = useQueue();
  const { party } = useParty();
  const { points } = useShop();
  const handleLogout = useLogout();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className={`topbar ${searchOpen ? 'search-open' : ''}`}>
      <GlobalSearch />
      <button
        type="button"
        className="icon-btn show-mobile"
        onClick={() => setSearchOpen((o) => !o)}
        aria-label={searchOpen ? 'Fechar busca' : 'Buscar'}
        aria-expanded={searchOpen}
      >
        {searchOpen ? <X size={16} /> : <Search size={16} />}
      </button>

      {status === 'searching' && (
        <div className="queue-pill" role="status">
          <span className="pulse-dot" aria-hidden="true" />
          <span>
            Procurando {mode?.name ?? 'partida'} <strong>{formatTime(elapsed)}</strong>
          </span>
          <button type="button" className="icon-btn" onClick={cancel} aria-label="Cancelar fila">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="topbar-right">
        {party.length > 1 && (
          <Link to="/jogar" className="party-pill" aria-label={`Party com ${party.length} jogadores`}>
            <Users size={14} aria-hidden="true" /> {party.length}/5
          </Link>
        )}
        <div className="topbar-elo">
          <LevelBadge level={ME.level} size={30} />
          <div>
            <strong>{ME.elo}</strong>
            <span className="muted small">ELO</span>
          </div>
        </div>
        <Link to="/loja" className="points-pill" aria-label={`${points} FragPoints, abrir loja`}>
          <Coins size={14} aria-hidden="true" /> {points.toLocaleString('pt-BR')} <span className="hide-sm">FP</span>
        </Link>
        <NotificationsMenu />
        <Link to={`/perfil/${ME.nick}`} className="topbar-user">
          <Avatar nick={ME.nick} size={34} status="online" />
          <Nick nick={ME.nick} className="hide-sm" />
        </Link>
        <Link to="/configuracoes" className="icon-btn hide-mobile" aria-label="Configurações da conta">
          <Settings size={16} />
        </Link>
        <button type="button" className="icon-btn hide-mobile" onClick={handleLogout} aria-label="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default function Layout() {
  // Dados da sessão (loja, times, notificações) carregados antes de abrir as páginas
  const shop = useShop();
  const teams = useTeams();
  const notifs = useNotifications();
  const booted = shop.ready && teams.ready && notifs.ready;
  const handleLogout = useLogout();
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <main className="content">
          {/* Suspense aqui mantém sidebar/topo visíveis enquanto a página carrega */}
          {booted ? (
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          ) : (
            <PageLoader />
          )}
        </main>
      </div>
      <MobileNav onLogout={handleLogout} />
      <MatchFoundModal />
      {booted && <Onboarding />}
    </div>
  );
}
