import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Clock, Server, Download, Lock, Skull, Bomb, ShieldCheck, Timer, Star, Crosshair, Flame, Target,
} from 'lucide-react';
import { getMatchDetails, ME } from '../data/mock';
import { ratingClass } from '../utils/levels';
import { Avatar, LevelBadge } from '../components/ui';
import '../styles/match-details.css';

const END_ICON = { elim: Skull, bomb: Bomb, defuse: ShieldCheck, time: Timer };
const END_LABEL = { elim: 'Eliminação', bomb: 'Bomba explodiu', defuse: 'Bomba desarmada', time: 'Tempo esgotado' };

const COLUMNS = {
  placar: [
    { key: 'kills', label: 'K', title: 'Kills' },
    { key: 'deaths', label: 'D', title: 'Mortes' },
    { key: 'assists', label: 'A', title: 'Assistências' },
    { key: 'diff', label: '+/-', title: 'Saldo de kills', get: (p) => p.kills - p.deaths, fmt: (v) => (v > 0 ? `+${v}` : v), cls: (v) => (v > 0 ? 'text-win' : v < 0 ? 'text-loss' : '') },
    { key: 'kd', label: 'K/D', get: (p) => p.kills / Math.max(1, p.deaths), fmt: (v) => v.toFixed(2), hideSm: true },
    { key: 'adr', label: 'ADR', title: 'Dano médio por round' },
    { key: 'kast', label: 'KAST', fmt: (v) => `${v}%`, hideSm: true },
    { key: 'hs', label: 'HS%', fmt: (v) => `${v}%`, hideSm: true },
    { key: 'rating', label: 'Rating', fmt: (v) => v.toFixed(2), cls: ratingClass, strong: true },
  ],
  avancado: [
    { key: 'openingKills', label: 'FK', title: 'First kills (opening duels vencidos)' },
    { key: 'openingDeaths', label: 'FD', title: 'First deaths' },
    { key: 'k2', label: '2K' },
    { key: 'k3', label: '3K' },
    { key: 'k4', label: '4K' },
    { key: 'k5', label: 'ACE' },
    { key: 'clutches', label: '1vX', title: 'Clutches vencidos' },
    { key: 'tradeKills', label: 'Trades', hideSm: true },
    { key: 'utilDmg', label: 'Dano util.', title: 'Dano com granadas', hideSm: true },
    { key: 'enemiesFlashed', label: 'Cegou', title: 'Inimigos cegos', hideSm: true },
    { key: 'flashAssists', label: 'Flash A.', title: 'Assistências de flash', hideSm: true },
  ],
};

const valueOf = (col, p) => (col.get ? col.get(p) : p[col.key]);

function Scoreboard({ team, won, columns, sort, onSort, ownerNick }) {
  const players = [...team.players].sort((a, b) => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return b.rating - a.rating;
    const d = valueOf(col, a) - valueOf(col, b);
    return sort.dir === 'desc' ? -d : d;
  });

  return (
    <section className={`card scoreboard ${won ? 'won' : 'lost'}`} aria-label={`Placar de ${team.name}`}>
      <header className="scoreboard-head">
        <h2>{team.name}</h2>
        <span className={`result-tag ${won ? 'win' : 'loss'}`}>{won ? 'Vitória' : 'Derrota'}</span>
      </header>
      <div className="table-wrap">
        <table className="table score-table">
          <thead>
            <tr>
              <th scope="col">Jogador</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  title={c.title}
                  className={`num ${c.hideSm ? 'hide-sm' : ''}`}
                  aria-sort={sort.key === c.key ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
                >
                  <button type="button" className={`sort-btn ${sort.key === c.key ? 'active' : ''}`} onClick={() => onSort(c.key)}>
                    {c.label}
                    {sort.key === c.key && <span aria-hidden="true">{sort.dir === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                </th>
              ))}
              <th scope="col" className="num">
                ELO
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.nick} className={p.nick === ownerNick ? 'me' : ''}>
                <td>
                  <Link to={`/perfil/${p.nick}`} className="player-cell">
                    <Avatar nick={p.nick} size={30} />
                    <LevelBadge level={p.level} size={24} />
                    <span>{p.nick}</span>
                  </Link>
                </td>
                {columns.map((c) => {
                  const v = valueOf(c, p);
                  return (
                    <td key={c.key} className={`num ${c.hideSm ? 'hide-sm' : ''} ${c.strong ? 'strong' : ''} ${c.cls ? c.cls(v) : ''}`}>
                      {c.fmt ? c.fmt(v) : v}
                    </td>
                  );
                })}
                <td className={`num strong ${p.eloDelta > 0 ? 'text-win' : 'text-loss'}`}>
                  {p.eloDelta > 0 ? '+' : ''}
                  {p.eloDelta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoundTimeline({ rounds, teamA, teamB }) {
  const [hover, setHover] = useState(null);
  const halves = [rounds.slice(0, 12), rounds.slice(12, 24), rounds.slice(24)].filter((h) => h.length);
  const labels = ['1º tempo', '2º tempo', 'Prorrogação'];
  const cur = hover !== null ? rounds[hover] : null;

  return (
    <section className="card" aria-labelledby="rounds-title">
      <header className="card-head">
        <h2 id="rounds-title">Rounds</h2>
        <span className="muted small" aria-live="polite">
          {cur
            ? `Round ${cur.n}: ${cur.winner === 'A' ? teamA : teamB} (${cur.winnerSide}) · ${END_LABEL[cur.end]}`
            : 'Passe o mouse em um round'}
        </span>
      </header>
      <div className="timeline">
        <div className="timeline-labels" aria-hidden="true">
          <span>{teamA}</span>
          <span>{teamB}</span>
        </div>
        {halves.map((half, hi) => (
          <div key={hi} className="timeline-half">
            <span className="timeline-half-label">{labels[hi]}</span>
            <div className="timeline-rows">
              {['A', 'B'].map((team) => (
                <div key={team} className="timeline-row">
                  {half.map((r) => {
                    const Icon = END_ICON[r.end];
                    const win = r.winner === team;
                    const side = team === 'A' ? r.sideA : r.sideA === 'CT' ? 'T' : 'CT';
                    return (
                      <span
                        key={r.n}
                        className={`round ${win ? `win side-${side.toLowerCase()}` : ''} ${hover === r.n - 1 ? 'hover' : ''}`}
                        onMouseEnter={() => setHover(r.n - 1)}
                        onMouseLeave={() => setHover(null)}
                        title={win ? `Round ${r.n} · ${END_LABEL[r.end]}` : undefined}
                      >
                        {win && <Icon size={13} aria-hidden="true" />}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="timeline-legend">
        <li>
          <span className="round win side-ct" aria-hidden="true" /> CT
        </li>
        <li>
          <span className="round win side-t" aria-hidden="true" /> TR
        </li>
        {Object.entries(END_LABEL).map(([k, v]) => {
          const Icon = END_ICON[k];
          return (
            <li key={k}>
              <Icon size={13} aria-hidden="true" /> {v}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function when(daysAgo) {
  if (daysAgo === 0) return 'Hoje';
  if (daysAgo === 1) return 'Ontem';
  return `${daysAgo} dias atrás`;
}

export default function MatchDetails() {
  const { matchId } = useParams();
  const match = useMemo(() => getMatchDetails(matchId), [matchId]);
  const [tab, setTab] = useState('placar');
  const [sort, setSort] = useState({ key: 'rating', dir: 'desc' });

  if (!match) return <Navigate to="/inicio" replace />;

  const all = [...match.teamA.players, ...match.teamB.players];
  const top = (fn) => all.reduce((best, p) => (fn(p) > fn(best) ? p : best), all[0]);
  const highlights = [
    { icon: Star, label: 'MVP', p: top((p) => p.rating), value: (p) => `${p.rating.toFixed(2)} rating` },
    { icon: Crosshair, label: 'Mais kills', p: top((p) => p.kills), value: (p) => `${p.kills} kills` },
    { icon: Flame, label: 'Maior ADR', p: top((p) => p.adr), value: (p) => `${p.adr} ADR` },
    { icon: Target, label: 'Mais headshots', p: top((p) => p.hs * p.kills), value: (p) => `${Math.round((p.hs * p.kills) / 100)} HS` },
  ];

  const columns = COLUMNS[tab];
  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  const changeTab = (t) => {
    setTab(t);
    setSort(t === 'placar' ? { key: 'rating', dir: 'desc' } : { key: 'openingKills', dir: 'desc' });
  };

  return (
    <div className="page stack">
      <Link to={`/historico/${match.owner}`} className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Histórico de {match.owner}
      </Link>

      <section className="card md-hero" style={{ backgroundImage: `url(/maps/${match.map.id}.jpg)` }}>
        <div className="md-hero-overlay" aria-hidden="true" />
        <div className="md-hero-top">
          <span className="eyebrow light">
            {match.mode} · {match.map.name}
          </span>
          <span className="md-meta">
            <span>
              <Clock size={13} aria-hidden="true" /> {when(match.daysAgo)} · {match.durationMin} min
            </span>
            <span>
              <Server size={13} aria-hidden="true" /> {match.server}
            </span>
          </span>
        </div>
        <div className="md-score">
          <div className="md-team">
            <strong>{match.teamA.name}</strong>
            <span className="muted small">{match.won ? 'Vencedor' : 'Perdedor'}</span>
          </div>
          <div className="md-score-num" aria-label={`Placar ${match.scoreUs} a ${match.scoreThem}`}>
            <span className={match.won ? 'text-win' : 'text-loss'}>{match.scoreUs}</span>
            <span className="muted">:</span>
            <span className={match.won ? 'text-loss' : 'text-win'}>{match.scoreThem}</span>
          </div>
          <div className="md-team right">
            <strong>{match.teamB.name}</strong>
            <span className="muted small">{match.won ? 'Perdedor' : 'Vencedor'}</span>
          </div>
        </div>
        <div className="md-actions">
          {ME.premium ? (
            <button type="button" className="btn btn-ghost btn-sm">
              <Download size={14} aria-hidden="true" /> Baixar demo
            </button>
          ) : (
            <Link to="/premium" className="btn btn-ghost btn-sm">
              <Lock size={14} aria-hidden="true" /> Demo (Premium)
            </Link>
          )}
        </div>
      </section>

      <section className="md-highlights" aria-label="Destaques da partida">
        {highlights.map(({ icon: Icon, label, p, value }) => (
          <Link key={label} to={`/perfil/${p.nick}`} className="card md-highlight">
            <span className="stat-icon">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div>
              <span className="muted small">{label}</span>
              <strong>{p.nick}</strong>
              <span className="small accent">{value(p)}</span>
            </div>
          </Link>
        ))}
      </section>

      <RoundTimeline rounds={match.rounds} teamA={match.teamA.name} teamB={match.teamB.name} />

      <div className="tabs" role="tablist" aria-label="Tipo de estatística">
        <button type="button" role="tab" aria-selected={tab === 'placar'} className={`tab ${tab === 'placar' ? 'active' : ''}`} onClick={() => changeTab('placar')}>
          Placar
        </button>
        <button type="button" role="tab" aria-selected={tab === 'avancado'} className={`tab ${tab === 'avancado' ? 'active' : ''}`} onClick={() => changeTab('avancado')}>
          Avançado
        </button>
      </div>

      <Scoreboard team={match.teamA} won={match.won} columns={columns} sort={sort} onSort={onSort} ownerNick={match.owner} />
      <Scoreboard team={match.teamB} won={!match.won} columns={columns} sort={sort} onSort={onSort} ownerNick={match.owner} />
    </div>
  );
}
