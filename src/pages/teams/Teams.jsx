import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Trophy, Shield } from 'lucide-react';
import { ME, REGIONS } from '../../data/mock';
import { PUBLIC_TEAMS, TEAM_MAX, teamStats } from '../../data/teams';
import { useTeams, resolveMember, MY_TEAMS_LIMIT } from '../../context/TeamsContext';
import { Modal, TeamLogo } from '../../components/ui';
import TeamForm from './TeamForm';
import '../../styles/teams.css';

function TeamCard({ team, role, requested }) {
  const { avgElo, winRate } = teamStats(team, resolveMember);
  return (
    <Link to={`/times/${team.id}`} className="card team-card" style={{ '--team': team.color }}>
      <div className="team-card-top">
        <TeamLogo tag={team.tag} color={team.color} size={52} />
        <div className="team-card-name">
          <strong>{team.name}</strong>
          <span className="muted small">
            [{team.tag}] · {team.region}
          </span>
        </div>
        {role && <span className={`tag ${role === 'Capitão' ? 'tag-accent' : ''}`}>{role}</span>}
        {!role && requested && <span className="tag">Solicitado</span>}
        {!role && !requested && team.recruiting && <span className="tag tag-win">Recrutando</span>}
      </div>
      <div className="team-card-stats">
        <span>
          <Users size={13} aria-hidden="true" /> {team.members.length}/{TEAM_MAX}
        </span>
        <span>ELO {avgElo || '—'}</span>
        <span>{team.wins + team.losses ? `${winRate}% vit.` : 'Sem partidas'}</span>
        <span>
          <Trophy size={13} aria-hidden="true" /> {team.trophies}
        </span>
      </div>
    </Link>
  );
}

export default function Teams() {
  const navigate = useNavigate();
  const { myTeams, requests, myRole, createTeam } = useTeams();
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('all');
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);

  const myIds = new Set(myTeams.map((t) => t.id));
  const explore = useMemo(
    () =>
      PUBLIC_TEAMS.filter((t) => !myIds.has(t.id))
        .filter((t) => !q || `${t.name} ${t.tag}`.toLowerCase().includes(q.toLowerCase()))
        .filter((t) => region === 'all' || t.region === region)
        .filter((t) => !onlyRecruiting || t.recruiting),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, region, onlyRecruiting, myTeams],
  );

  const create = (data) => {
    const id = createTeam(data);
    setCreating(false);
    navigate(`/times/${id}`);
  };

  const limitReached = myTeams.length >= MY_TEAMS_LIMIT;

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Comunidade</span>
          <h1>Times</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)} disabled={limitReached} title={limitReached ? `Limite de ${MY_TEAMS_LIMIT} times` : undefined}>
          <Plus size={16} aria-hidden="true" /> Criar time
        </button>
      </header>

      <section aria-labelledby="my-teams-title" className="stack">
        <h2 id="my-teams-title" className="section-title">
          Meus times <span className="muted">({myTeams.length}/{MY_TEAMS_LIMIT})</span>
        </h2>
        {myTeams.length ? (
          <div className="team-grid">
            {myTeams.map((t) => (
              <TeamCard key={t.id} team={t} role={myRole(t)} />
            ))}
          </div>
        ) : (
          <div className="card empty-team">
            <Shield size={32} aria-hidden="true" className="accent" />
            <div>
              <strong>Você ainda não tem time</strong>
              <p className="muted small">Crie o seu, chame os amigos e dispute campeonatos juntos. Ou peça para entrar em um time abaixo.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" /> Criar meu time
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="explore-title" className="stack">
        <div className="toolbar">
          <h2 id="explore-title">Explorar times</h2>
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Nome ou tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar time" />
          </label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Região">
            <option value="all">Todas as regiões</option>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" checked={onlyRecruiting} onChange={(e) => setOnlyRecruiting(e.target.checked)} /> Só recrutando
          </label>
        </div>
        <div className="team-grid">
          {explore.map((t) => (
            <TeamCard key={t.id} team={t} requested={requests.includes(t.id)} />
          ))}
          {explore.length === 0 && <p className="muted empty-state">Nenhum time encontrado.</p>}
        </div>
      </section>

      {creating && (
        <Modal title="Criar time" onClose={() => setCreating(false)} wide>
          <p className="muted small modal-sub">Você será o capitão. Dá para mudar tudo depois nas configurações do time, {ME.nick}.</p>
          <TeamForm submitLabel="Criar time" onSubmit={create} onCancel={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
