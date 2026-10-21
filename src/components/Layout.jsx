import { Suspense } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import PageLoader from './PageLoader';
import {
  Home,
  Crosshair,
  Trophy,
  Medal,
  User,
  Search,
  Crown,
  X,
  LogOut,
  Users,
  History,
  Shield,
  ShoppingBag,
  Coins,
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

function Sidebar() {
  const { user } = useAuth();
  // Montado no render para refletir o nick da sessão
  const nav = [
    { to: '/inicio', label: 'Início', icon: Home },
    { to: '/jogar', label: 'Jogar', icon: Crosshair },
    { to: '/times', label: 'Times', icon: Shield },
    { to: '/ranking', label: 'Ranking', icon: Trophy },
    { to: '/campeonatos', label: 'Campeonatos', icon: Medal },
    { to: `/historico/${ME.nick}`, label: 'Partidas', icon: History },
    { to: '/loja', label: 'Loja', icon: ShoppingBag },
    { to: `/perfil/${ME.nick}`, label: 'Perfil', icon: User },
    { to: '/premium', label: 'Premium', icon: Crown },
  ];

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

function Topbar() {
  const { status, elapsed, cancel, mode } = useQueue();
  const { party } = useParty();
  const { logout } = useAuth();
  const { points } = useShop();
  const navigate = useNavigate();

  const handleLogout = () => {
    cancel();
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="topbar">
      <label className="search">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder="Buscar jogadores, times, campeonatos..." aria-label="Buscar" />
      </label>

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
        <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Sair">
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
      <MatchFoundModal />
    </div>
  );
}
