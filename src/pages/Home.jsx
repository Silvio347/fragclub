import { Link } from 'react-router-dom';
import { Crosshair, Star, Activity, Flame, Swords, ChevronRight, Calendar, Users } from 'lucide-react';
import { ME } from '../data/mock';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { Async, PageSkeleton } from '../components/Async';
import { levelProgress, ratingClass } from '../utils/levels';
import { Avatar, LevelBadge, Progress, StatCard } from '../components/ui';
import MatchList from '../components/MatchList';

// Painel inicial: busca em paralelo tudo o que a página mostra
const loadHome = () =>
  Promise.all([
    api.players.history(ME.nick, 6),
    api.friends.list(),
    api.players.missions(),
    api.tournaments.list(),
  ]).then(([h, friends, missions, tournaments]) => ({ history: h.matches, friends, missions, tournaments }));

export default function Home() {
  const query = useQuery(loadHome, []);
  return (
    <Async query={query} skeleton={<PageSkeleton rows={7} />}>
      {(data) => <HomeView {...data} />}
    </Async>
  );
}

function HomeView({ history, friends, missions, tournaments }) {
  const prog = levelProgress(ME.elo);
  const nextTournament = tournaments.find((t) => t.status === 'open');
  const onlineFriends = friends.filter((f) => f.status !== 'offline');

  return (
    <div className="page grid-main-side">
      <div className="stack">
        <section className="card hero">
          <div className="hero-content">
            <span className="eyebrow">Counter-Strike 2 · Temporada 4</span>
            <h1>
              Bem-vindo de volta, <span className="accent">{ME.nick}</span>
            </h1>
            <p className="muted">Entre na fila, suba de level e dispute campeonatos toda semana.</p>
            <div className="row gap-sm wrap">
              <Link to="/jogar" className="btn btn-primary btn-lg">
                <Crosshair size={18} aria-hidden="true" /> Jogar agora
              </Link>
              <Link to="/jogar/lobbies" className="btn btn-ghost btn-lg">
                <Swords size={18} aria-hidden="true" /> Lobbies
              </Link>
            </div>
          </div>
          <div className="hero-level">
            <LevelBadge level={ME.level} size={84} />
            <div className="elo-big">
              {ME.elo} <small>ELO</small>
            </div>
            <Progress value={prog.pct} label="Progresso para o próximo level" />
            <span className="muted small">
              {prog.next ? `${prog.toNext} pontos para o level ${prog.next}` : 'Level máximo'}
            </span>
          </div>
        </section>

        <section className="stats-grid" aria-label="Estatísticas das últimas 20 partidas">
          <StatCard
            icon={Star}
            label="Rating 3.0"
            value={ME.rating.toFixed(2)}
            valueClass={ratingClass(ME.rating)}
            hint="Últimas 20"
            highlight
          />
          <StatCard icon={Activity} label="KAST" value={`${ME.kast}%`} hint="Rounds com impacto" />
          <StatCard icon={Flame} label="ADR" value={ME.adr} hint="Dano médio/round" />
          <StatCard icon={Swords} label="K/D" value={ME.kd.toFixed(2)} hint={`${ME.winRate}% de vitórias`} />
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Partidas recentes</h2>
            <Link to={`/historico/${ME.nick}`} className="link-muted">
              Ver todas <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </header>
          <MatchList matches={history} />
        </section>
      </div>

      <aside className="stack">
        <section className="card">
          <header className="card-head">
            <h2>
              <Users size={16} aria-hidden="true" /> Amigos
            </h2>
            <span className="muted small">{onlineFriends.length} online</span>
          </header>
          <ul className="friend-list">
            {friends.map((f) => (
              <li key={f.nick}>
                <Link to={`/perfil/${f.nick}`} className="friend">
                  <Avatar nick={f.nick} size={34} status={f.status} />
                  <div className="friend-info">
                    <strong>{f.nick}</strong>
                    <span className={`small ${f.status === 'in-game' ? 'accent' : 'muted'}`}>{f.activity}</span>
                  </div>
                  <LevelBadge level={f.level} size={26} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Missões diárias</h2>
            <span className="muted small">Renova em 6h</span>
          </header>
          <ul className="mission-list">
            {missions.map((m) => (
              <li key={m.id}>
                <div className="row between">
                  <span>{m.title}</span>
                  <span className="accent small">{m.reward}</span>
                </div>
                <Progress value={m.progress} max={m.goal} label={m.title} />
                <span className="muted small">
                  {m.progress}/{m.goal}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {nextTournament && (
          <section
            className="card tournament-mini"
            style={{
              backgroundImage: `linear-gradient(135deg, ${nextTournament.colors[0]}e6, ${nextTournament.colors[1]}cc), url(/maps/${nextTournament.map}.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <span className="eyebrow light">Próximo campeonato</span>
            <h3>{nextTournament.name}</h3>
            <p className="row gap-sm small">
              <Calendar size={14} aria-hidden="true" /> {nextTournament.date} · {nextTournament.prize}
            </p>
            <Link to="/campeonatos" className="btn btn-light btn-sm">
              Inscrever time
            </Link>
          </section>
        )}
      </aside>
    </div>
  );
}
