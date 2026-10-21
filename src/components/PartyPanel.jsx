import { useState } from 'react';
import { Plus, X, UserPlus, LogOut, Crown } from 'lucide-react';
import { useParty, PARTY_MAX } from '../context/PartyContext';
import { Avatar, LevelBadge } from './ui';
import InviteModal from './InviteModal';

export default function PartyPanel({ locked = false, compact = false }) {
  const { party, pending, total, kick, disband } = useParty();
  const [inviting, setInviting] = useState(false);
  const avgElo = Math.round(party.reduce((s, p) => s + p.elo, 0) / party.length);
  const slots = [...party.map((p) => ({ ...p, kind: 'member' })), ...pending.map((p) => ({ ...p, kind: 'pending' }))];

  return (
    <div className={`party-panel ${compact ? 'compact' : ''}`}>
      <header className="card-head">
        <div>
          <h2>Sua party</h2>
          <span className="muted small">
            {total}/{PARTY_MAX} · ELO médio {avgElo}
          </span>
        </div>
        <div className="row gap-xs">
          {party.length > 1 && !locked && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={disband}>
              <LogOut size={14} aria-hidden="true" /> Desfazer
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setInviting(true)}
            disabled={locked || total >= PARTY_MAX}
          >
            <UserPlus size={14} aria-hidden="true" /> Convidar
          </button>
        </div>
      </header>

      <div className="party">
        {Array.from({ length: PARTY_MAX }, (_, i) => {
          const p = slots[i];
          if (!p) {
            return (
              <button
                key={`empty-${i}`}
                type="button"
                className="party-slot empty"
                onClick={() => setInviting(true)}
                disabled={locked}
              >
                <Plus size={22} aria-hidden="true" />
                <span>Convidar</span>
              </button>
            );
          }
          const leader = i === 0;
          return (
            <div
              key={p.nick}
              className={`party-slot ${leader ? 'leader' : ''} ${p.kind === 'pending' ? 'pending' : ''}`}
            >
              {!leader && !locked && (
                <button
                  type="button"
                  className="icon-btn party-kick"
                  onClick={() => kick(p.nick)}
                  aria-label={`Remover ${p.nick}`}
                >
                  <X size={14} />
                </button>
              )}
              <span className="leader-avatar">
                {leader && <Crown size={compact ? 20 : 24} className="leader-crown" aria-label="Líder da party" />}
                <Avatar nick={p.nick} size={compact ? 48 : 60} />
              </span>
              <strong>{p.nick}</strong>
              {p.kind === 'pending' ? (
                <span className="muted small row gap-xs">
                  <span className="spinner spinner-sm" aria-hidden="true" /> Convite enviado
                </span>
              ) : (
                <div className="row gap-xs">
                  <LevelBadge level={p.level} size={24} />
                  <span className="muted small">{p.elo}</span>
                </div>
              )}
              {leader && <span className="tag tag-accent">Líder</span>}
            </div>
          );
        })}
      </div>

      {inviting && <InviteModal onClose={() => setInviting(false)} />}
    </div>
  );
}
