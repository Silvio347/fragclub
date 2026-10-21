import { Link } from 'react-router-dom';
import { MapThumb } from './ui';
import { ratingClass } from '../utils/levels';

function when(daysAgo) {
  if (daysAgo === 0) return 'Hoje';
  if (daysAgo === 1) return 'Ontem';
  return `${daysAgo} dias atrás`;
}

// Cada linha leva para o placar completo da partida (/partidas/:id)
export default function MatchList({ matches }) {
  return (
    <ul className="match-list">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            to={`/partidas/${m.id}`}
            className={`match-row ${m.won ? 'win' : 'loss'}`}
            aria-label={`${m.won ? 'Vitória' : 'Derrota'} ${m.scoreUs} a ${m.scoreThem} na ${m.map.name}, ${when(m.daysAgo)}. Ver detalhes`}
          >
            <MapThumb map={m.map} height={48} className="match-row-map" showName={false} />
            <div className="match-row-info">
              <strong>{m.map.name}</strong>
              <span className="muted small">Ranqueada · {when(m.daysAgo)}</span>
            </div>
            <div className="match-row-score">
              <span className={m.won ? 'text-win' : 'text-loss'}>{m.scoreUs}</span>
              <span className="muted"> : </span>
              <span>{m.scoreThem}</span>
            </div>
            <div className="match-row-stat">
              <span className="muted small">K / D / A</span>
              <span>
                {m.kills} / {m.deaths} / {m.assists}
              </span>
            </div>
            <div className="match-row-stat">
              <span className="muted small">Rating</span>
              <strong className={ratingClass(m.rating)}>{m.rating.toFixed(2)}</strong>
            </div>
            <div className="match-row-stat hide-sm">
              <span className="muted small">KAST</span>
              <span>{m.kast}%</span>
            </div>
            <div className="match-row-stat hide-sm">
              <span className="muted small">ADR</span>
              <span>{m.adr}</span>
            </div>
            <div className={`elo-delta ${m.eloDelta > 0 ? 'up' : 'down'}`}>
              {m.eloDelta > 0 ? '+' : ''}
              {m.eloDelta}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
