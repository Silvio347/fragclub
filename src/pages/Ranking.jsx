import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { RANKING, ME, FLAGS } from '../data/mock';
import { Avatar, LevelBadge } from '../components/ui';
import { ratingClass } from '../utils/levels';

const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'br', label: 'Brasil' },
  { id: 'weekly', label: 'Semanal' },
];

export default function Ranking() {
  const [tab, setTab] = useState('global');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    let list = RANKING;
    if (tab === 'br') list = list.filter((p) => p.country === 'BR');
    if (tab === 'weekly') list = [...list].sort((a, b) => b.weeklyGain - a.weeklyGain);
    const ranked = list.map((p, i) => ({ ...p, pos: i + 1 }));
    const q = query.trim().toLowerCase();
    return q ? ranked.filter((p) => p.nick.toLowerCase().includes(q)) : ranked;
  }, [tab, query]);

  const podium = rows.slice(0, 3);

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Temporada 4</span>
          <h1>Ranking CS2</h1>
        </div>
        <label className="search search-inline">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar jogador"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar jogador no ranking"
          />
        </label>
      </header>

      <div className="tabs" role="tablist" aria-label="Tipo de ranking">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!query && podium.length === 3 && (
        <section className="podium" aria-label="Top 3">
          {[podium[1], podium[0], podium[2]].map((p) => (
            <Link key={p.nick} to={`/perfil/${p.nick}`} className={`card podium-card pos-${p.pos}`}>
              <span className="podium-pos">#{p.pos}</span>
              <Avatar nick={p.nick} size={p.pos === 1 ? 72 : 58} />
              <strong>{p.nick}</strong>
              <div className="row gap-xs">
                <LevelBadge level={p.level} size={26} />
                <span>{tab === 'weekly' ? `+${p.weeklyGain}` : p.elo}</span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Jogador</th>
              <th scope="col">Level</th>
              <th scope="col">{tab === 'weekly' ? 'Ganho' : 'ELO'}</th>
              <th scope="col">Rating 3.0</th>
              <th scope="col" className="hide-sm">
                KAST
              </th>
              <th scope="col" className="hide-sm">
                ADR
              </th>
              <th scope="col" className="hide-sm">
                K/D
              </th>
              <th scope="col" className="hide-sm">
                Vitórias
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.nick} className={p.nick === ME.nick ? 'me' : ''}>
                <td className="pos">{p.pos}</td>
                <td>
                  <Link to={`/perfil/${p.nick}`} className="player-cell">
                    <Avatar nick={p.nick} size={30} />
                    <span>
                      {FLAGS[p.country]} {p.nick}
                    </span>
                  </Link>
                </td>
                <td>
                  <LevelBadge level={p.level} size={26} />
                </td>
                <td className="strong">
                  {tab === 'weekly' ? (
                    <span className={p.weeklyGain >= 0 ? 'text-win' : 'text-loss'}>
                      {p.weeklyGain >= 0 ? '+' : ''}
                      {p.weeklyGain}
                    </span>
                  ) : (
                    p.elo
                  )}
                </td>
                <td className={`strong ${ratingClass(p.rating)}`}>{p.rating.toFixed(2)}</td>
                <td className="hide-sm">{p.kast}%</td>
                <td className="hide-sm">{p.adr}</td>
                <td className="hide-sm">{p.kd.toFixed(2)}</td>
                <td className="hide-sm">{p.winRate}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="muted empty">
                  Nenhum jogador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
