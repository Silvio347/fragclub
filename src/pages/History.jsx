import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MAPS, getMatchHistory, getPlayer } from '../data/mock';
import { ratingClass } from '../utils/levels';
import { Avatar, LevelBadge } from '../components/ui';
import MatchList from '../components/MatchList';

const TOTAL = 60;
const PAGE = 15;

export default function History() {
  const { nick } = useParams();
  const player = useMemo(() => getPlayer(nick), [nick]);
  const all = useMemo(() => getMatchHistory(player.nick, TOTAL), [player]);
  const [map, setMap] = useState('all');
  const [result, setResult] = useState('all');
  const [shown, setShown] = useState(PAGE);

  const filtered = all.filter(
    (m) => (map === 'all' || m.map.id === map) && (result === 'all' || (result === 'win' ? m.won : !m.won)),
  );
  const visible = filtered.slice(0, shown);

  const avg = (k) => (filtered.length ? filtered.reduce((s, m) => s + m[k], 0) / filtered.length : 0);
  const wins = filtered.filter((m) => m.won).length;
  const eloSum = filtered.reduce((s, m) => s + m.eloDelta, 0);
  const summary = [
    ['Partidas', filtered.length],
    ['V / D', `${wins} / ${filtered.length - wins}`],
    ['Rating médio', avg('rating').toFixed(2), ratingClass(avg('rating'))],
    ['KAST médio', `${Math.round(avg('kast'))}%`],
    ['ADR médio', Math.round(avg('adr'))],
    ['Saldo de ELO', `${eloSum > 0 ? '+' : ''}${eloSum}`, eloSum >= 0 ? 'text-win' : 'text-loss'],
  ];

  const resetPage = (fn) => (e) => {
    fn(e.target.value);
    setShown(PAGE);
  };

  return (
    <div className="page stack">
      <Link to={`/perfil/${player.nick}`} className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Perfil de {player.nick}
      </Link>
      <header className="page-head">
        <div className="row gap-sm">
          <Avatar nick={player.nick} size={52} />
          <div>
            <span className="eyebrow">Histórico</span>
            <h1 className="row gap-sm">
              {player.nick} <LevelBadge level={player.level} size={30} />
            </h1>
          </div>
        </div>
        <div className="row gap-sm wrap">
          <select value={map} onChange={resetPage(setMap)} aria-label="Filtrar por mapa">
            <option value="all">Todos os mapas</option>
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select value={result} onChange={resetPage(setResult)} aria-label="Filtrar por resultado">
            <option value="all">Todos os resultados</option>
            <option value="win">Vitórias</option>
            <option value="loss">Derrotas</option>
          </select>
        </div>
      </header>

      <section className="history-summary" aria-label="Resumo do período filtrado">
        {summary.map(([k, v, cls]) => (
          <div key={k} className="card">
            <span className="muted small">{k}</span>
            <strong className={cls}>{v}</strong>
          </div>
        ))}
      </section>

      <section className="card">
        <header className="card-head">
          <h2>Partidas</h2>
          <span className="muted small">Clique em uma partida para ver o placar completo</span>
        </header>
        {visible.length ? <MatchList matches={visible} /> : <p className="muted empty-state">Nenhuma partida com esses filtros.</p>}
        {shown < filtered.length && (
          <button type="button" className="btn btn-ghost btn-block load-more" onClick={() => setShown((s) => s + PAGE)}>
            Carregar mais ({filtered.length - shown} restantes)
          </button>
        )}
      </section>
    </div>
  );
}
