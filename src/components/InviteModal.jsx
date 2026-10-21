import { useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { Skeleton } from './Async';
import { useParty, PARTY_MAX } from '../context/PartyContext';
import { Avatar, LevelBadge, Modal } from './ui';

const STATUS_ORDER = { online: 0, 'in-game': 1, offline: 2 };

export default function InviteModal({ onClose }) {
  const { members, pending, total, isFull, invite } = useParty();
  const [q, setQ] = useState('');

  const friendsQ = useQuery(() => api.friends.list(), []);
  const list = (friendsQ.data ?? [])
    .filter((f) => f.nick.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <Modal title="Convidar amigos" onClose={onClose}>
      <p className="muted small modal-sub">
        Party: {total}/{PARTY_MAX} jogadores. As vagas que sobrarem são completadas com jogadores da fila.
      </p>
      <label className="search search-block">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar amigo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar amigo"
        />
      </label>
      {friendsQ.loading && <Skeleton h={180} />}
      <ul className="invite-list">
        {list.map((f) => {
          const inParty = members.some((m) => m.nick === f.nick);
          const isPending = pending.some((p) => p.nick === f.nick);
          let label = 'Convidar';
          if (inParty) label = 'Na party';
          else if (isPending) label = 'Aguardando...';
          else if (f.status === 'in-game') label = 'Em partida';
          else if (f.status === 'offline') label = 'Offline';
          const disabled = inParty || isPending || f.status !== 'online' || isFull;
          return (
            <li key={f.nick} className="invite-row">
              <Avatar nick={f.nick} size={38} status={f.status} />
              <div className="friend-info">
                <strong>{f.nick}</strong>
                <span className="muted small">
                  {f.elo} ELO · Rating {f.rating.toFixed(2)}
                </span>
              </div>
              <LevelBadge level={f.level} size={28} />
              <button
                type="button"
                className={`btn btn-sm ${disabled ? 'btn-ghost' : 'btn-primary'}`}
                disabled={disabled}
                onClick={() => invite(f)}
                aria-label={`${label} ${f.nick}`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
