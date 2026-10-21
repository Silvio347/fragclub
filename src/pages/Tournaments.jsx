import { useState } from 'react';
import { Calendar, Users, Trophy, Lock } from 'lucide-react';
import { TOURNAMENTS, ME } from '../data/mock';
import { Progress } from '../components/ui';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Inscrições abertas' },
  { id: 'live', label: 'Ao vivo' },
  { id: 'finished', label: 'Finalizados' },
];

const STATUS_LABEL = { open: 'Inscrições abertas', live: 'Ao vivo', finished: 'Finalizado' };

export default function Tournaments() {
  const [filter, setFilter] = useState('all');
  const [joined, setJoined] = useState([]);
  const list = filter === 'all' ? TOURNAMENTS : TOURNAMENTS.filter((t) => t.status === filter);

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Competitivo</span>
          <h1>Campeonatos</h1>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Filtrar campeonatos">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="tournament-grid">
        {list.map((t) => {
          const full = t.teams >= t.slots;
          const locked = ME.level < t.minLevel;
          const isJoined = joined.includes(t.id);
          return (
            <article key={t.id} className="card tournament">
              <div
                className="tournament-banner"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${t.colors[0]}d9, ${t.colors[1]}b3), url(/maps/${t.map}.jpg)`,
                }}
              >
                <span className={`status-chip ${t.status}`}>{STATUS_LABEL[t.status]}</span>
                <Trophy size={40} aria-hidden="true" className="tournament-trophy" />
              </div>
              <div className="tournament-body">
                <h2>{t.name}</h2>
                <p className="muted small">{t.format}</p>
                <div className="tournament-prize">{t.prize}</div>
                <ul className="tournament-meta">
                  <li>
                    <Calendar size={14} aria-hidden="true" /> {t.date}
                  </li>
                  <li>
                    <Users size={14} aria-hidden="true" /> {t.teams}/{t.slots} times
                  </li>
                  <li>Level mínimo: {t.minLevel}</li>
                </ul>
                <Progress value={t.teams} max={t.slots} label="Vagas preenchidas" />
                {t.status === 'finished' ? (
                  <p className="small">
                    Campeão: <strong className="accent">{t.winner}</strong>
                  </p>
                ) : t.status === 'live' ? (
                  <button type="button" className="btn btn-ghost btn-block">
                    Assistir chaveamento
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn btn-block ${isJoined ? 'btn-ghost' : 'btn-primary'}`}
                    disabled={(full || locked) && !isJoined}
                    onClick={() => setJoined((j) => (isJoined ? j.filter((x) => x !== t.id) : [...j, t.id]))}
                  >
                    {locked ? (
                      <>
                        <Lock size={14} aria-hidden="true" /> Requer level {t.minLevel}
                      </>
                    ) : isJoined ? (
                      'Inscrito · Cancelar'
                    ) : full ? (
                      'Lotado'
                    ) : (
                      'Inscrever time'
                    )}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
