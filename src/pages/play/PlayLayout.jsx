import { NavLink, Outlet } from 'react-router-dom';
import { Crosshair, Swords, Shield, Target } from 'lucide-react';
import '../../styles/play.css';

const TABS = [
  { to: '/jogar', label: 'Ranqueada', hint: 'Fila 5v5', icon: Crosshair, end: true },
  { to: '/jogar/lobbies', label: 'Lobbies', hint: 'Desafie quem quiser', icon: Swords },
  { to: '/jogar/retake', label: 'Retake', hint: 'Servidores', icon: Shield },
  { to: '/jogar/dm', label: 'Deathmatch', hint: 'Servidores', icon: Target },
];

export default function PlayLayout() {
  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Counter-Strike 2</span>
          <h1>Jogar</h1>
        </div>
      </header>
      <nav className="mode-tabs" aria-label="Modos de jogo">
        {TABS.map(({ to, label, hint, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="mode-tab">
            <Icon size={22} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <span className="muted small">{hint}</span>
            </span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
