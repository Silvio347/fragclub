import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Users, UserPlus, Swords, Coins, Trophy, Info, ShoppingBag, Check, X, Trash2 } from 'lucide-react';
import { useNotifications, timeAgo } from '../context/NotificationsContext';
import { useTeams } from '../context/TeamsContext';

const ICONS = {
  team_invite: Users,
  team: Users,
  friend_request: UserPlus,
  challenge: Swords,
  points: Coins,
  tournament: Trophy,
  shop: ShoppingBag,
  system: Info,
};

export default function NotificationsMenu() {
  const { items, unread, markRead, markAllRead, remove, clearRead, resolve, notify } = useNotifications();
  const { joinPublicTeam } = useTeams();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = (n) => {
    markRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const respond = (n, accepted) => {
    if (n.type === 'team_invite' && accepted) {
      try {
        joinPublicTeam(n.teamId);
        resolve(n.id, 'accepted');
        setOpen(false);
        navigate(`/times/${n.teamId}`);
      } catch (e) {
        notify({ type: 'system', title: 'Não foi possível entrar no time', body: e.message, link: '/times' });
        resolve(n.id, 'declined');
      }
      return;
    }
    resolve(n.id, accepted ? 'accepted' : 'declined');
  };

  const hasActions = (n) => (n.type === 'team_invite' || n.type === 'friend_request') && !n.resolved;

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className={`icon-btn ${unread ? 'has-dot' : ''}`}
        aria-label={unread ? `Notificações (${unread} novas)` : 'Notificações'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="region" aria-label="Notificações">
          <header className="notif-head">
            <strong>Notificações</strong>
            <button type="button" className="link-btn" onClick={markAllRead} disabled={!unread}>
              Marcar todas como lidas
            </button>
          </header>

          <ul className="notif-list">
            {items.length === 0 && <li className="notif-empty muted">Tudo em dia por aqui.</li>}
            {items.map((n) => {
              const Icon = ICONS[n.type] ?? Info;
              return (
                <li key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                  <span className={`notif-icon type-${n.type}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="notif-body">
                    <button type="button" className="notif-main" onClick={() => openItem(n)}>
                      <strong>{n.title}</strong>
                      <span>{n.body}</span>
                    </button>
                    {hasActions(n) && (
                      <div className="notif-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => respond(n, true)}>
                          <Check size={14} aria-hidden="true" /> Aceitar
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => respond(n, false)}>
                          <X size={14} aria-hidden="true" /> Recusar
                        </button>
                      </div>
                    )}
                    {n.resolved && (
                      <span className={`small ${n.resolved === 'accepted' ? 'text-win' : 'muted'}`}>
                        {n.resolved === 'accepted' ? 'Aceito' : 'Recusado'}
                      </span>
                    )}
                  </div>
                  <div className="notif-side">
                    <span className="muted small">{timeAgo(n.createdAt)}</span>
                    <button
                      type="button"
                      className="notif-remove"
                      onClick={() => remove(n.id)}
                      aria-label={`Remover notificação: ${n.title}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <footer className="notif-foot">
            <button type="button" className="link-btn" onClick={clearRead}>
              <Trash2 size={13} aria-hidden="true" /> Limpar lidas
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
