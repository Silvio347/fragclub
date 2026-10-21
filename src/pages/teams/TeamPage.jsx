import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, UserPlus, LogOut, Trash2, Users, Trophy, Calendar, MapPin, Search, X } from 'lucide-react';
import { ME } from '../../data/mock';
import { api } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { Skeleton } from '../../components/Async';
import { TEAM_MAX, TEAM_ROLES, teamStats } from '../../data/teams';
import { useTeams, memberNick, resolveMember } from '../../context/TeamsContext';
import { ratingClass } from '../../utils/levels';
import { Avatar, LevelBadge, MapThumb, Modal, TeamLogo, Nick } from '../../components/ui';
import TeamForm from './TeamForm';
import { useToast } from '../../context/ToastContext';

function InviteToTeamModal({ team, onClose }) {
  const { inviteToTeam } = useTeams();
  const friendsQ = useQuery(() => api.friends.list(), []);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const inTeam = new Set(team.members.map(memberNick));
  const invited = new Set(team.invites ?? []);
  const full = team.members.length + invited.size >= TEAM_MAX;
  const list = (friendsQ.data ?? []).filter((f) => f.nick.includes(q.trim().toLowerCase()));
  const invite = (f) => inviteToTeam(team.id, f).catch((e) => setError(e.message));

  return (
    <Modal title={`Convidar para ${team.name}`} onClose={onClose}>
      <p className="muted small modal-sub">
        {team.members.length + invited.size}/{TEAM_MAX} vagas ocupadas. Amigos offline recebem o convite quando
        entrarem.
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {friendsQ.loading && <Skeleton h={180} />}
      <ul className="invite-list">
        {list.map((f) => {
          const label = inTeam.has(f.nick) ? 'No time' : invited.has(f.nick) ? 'Convidado' : 'Convidar';
          const disabled = label !== 'Convidar' || full;
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

function Confirm({ title, text, confirmLabel, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted modal-sub">{text}</p>
      <div className="row gap-sm form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default function TeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    getTeam,
    isMember,
    myRole,
    requests,
    requestJoin,
    cancelRequest,
    setRole,
    removeMember,
    editTeam,
    leaveTeam,
  } = useTeams();
  const team = getTeam(id);
  const [tab, setTab] = useState('elenco');
  const [modal, setModal] = useState(null); // invite | leave | disband | { remove: nick }
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!team) {
    return (
      <div className="page stack">
        <div className="card empty-team">
          <strong>Time não encontrado</strong>
          <p className="muted small">Ele pode ter sido desfeito.</p>
          <Link to="/times" className="btn btn-primary">
            Ver times
          </Link>
        </div>
      </div>
    );
  }

  const member = isMember(team);
  const role = myRole(team);
  const captain = role === 'Capitão';
  const ownTeam = team.id.startsWith('my-');
  const requested = requests.includes(team.id);
  const { players, avgElo, winRate, total } = teamStats(team, resolveMember);
  const levelOk = ME.level >= team.minLevel;

  const roster = team.members
    .map((m, i) => ({ ...m, player: players[i], nick: memberNick(m) }))
    .sort((a, b) => TEAM_ROLES.indexOf(a.role) - TEAM_ROLES.indexOf(b.role));

  const tabs = [
    { id: 'elenco', label: `Elenco (${team.members.length})` },
    { id: 'partidas', label: 'Partidas' },
    ...(captain ? [{ id: 'config', label: 'Configurações' }] : []),
  ];

  // Ações vão para o serviço; erros (ex.: sem permissão) aparecem no topo da página
  const act = (promise) => {
    setError('');
    return promise.catch((e) => {
      setError(e.message);
      throw e;
    });
  };

  const doLeave = () =>
    act(leaveTeam(team.id))
      .then(() => navigate('/times'))
      .catch(() => setModal(null));

  return (
    <div className="page stack">
      <Link to="/times" className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Times
      </Link>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section className="card team-hero" style={{ '--team': team.color }}>
        <div className="team-hero-banner" aria-hidden="true" />
        <div className="team-hero-info">
          <TeamLogo tag={team.tag} color={team.color} size={96} />
          <div className="team-hero-name">
            <h1>
              {team.name} <span className="muted">[{team.tag}]</span>
            </h1>
            <p className="muted row gap-sm wrap small">
              <span className="row gap-xs">
                <MapPin size={13} aria-hidden="true" /> {team.region}
              </span>
              <span className="row gap-xs">
                <Calendar size={13} aria-hidden="true" /> Desde {team.founded}
              </span>
              <span>Level mínimo {team.minLevel}</span>
              {team.recruiting ? <span className="tag tag-win">Recrutando</span> : <span className="tag">Fechado</span>}
            </p>
            {team.description && <p className="team-desc">{team.description}</p>}
          </div>
          <div className="team-hero-actions">
            {member ? (
              <>
                {captain && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setModal('invite')}
                    disabled={team.members.length >= TEAM_MAX}
                  >
                    <UserPlus size={16} aria-hidden="true" /> Convidar
                  </button>
                )}
                {captain && ownTeam ? (
                  <button type="button" className="btn btn-danger" onClick={() => setModal('disband')}>
                    <Trash2 size={16} aria-hidden="true" /> Desfazer time
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => setModal('leave')}>
                    <LogOut size={16} aria-hidden="true" /> Sair do time
                  </button>
                )}
              </>
            ) : requested ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => act(cancelRequest(team.id)).catch(() => {})}
              >
                <span className="spinner spinner-sm" aria-hidden="true" /> Solicitação enviada · cancelar
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => act(requestJoin(team.id)).catch(() => {})}
                disabled={!team.recruiting || !levelOk || team.members.length >= TEAM_MAX}
              >
                <UserPlus size={16} aria-hidden="true" />
                {!team.recruiting
                  ? 'Não está recrutando'
                  : !levelOk
                    ? `Requer level ${team.minLevel}`
                    : team.members.length >= TEAM_MAX
                      ? 'Time cheio'
                      : 'Solicitar entrada'}
              </button>
            )}
          </div>
        </div>

        <dl className="team-stats">
          <div>
            <dt>ELO médio</dt>
            <dd>{avgElo}</dd>
          </div>
          <div>
            <dt>Vitórias / Derrotas</dt>
            <dd>
              {team.wins} / {team.losses}
            </dd>
          </div>
          <div>
            <dt>Taxa de vitória</dt>
            <dd className={total ? (winRate >= 50 ? 'text-win' : 'text-loss') : ''}>{total ? `${winRate}%` : '—'}</dd>
          </div>
          <div>
            <dt>Troféus</dt>
            <dd className="row gap-xs">
              <Trophy size={16} aria-hidden="true" className="accent" /> {team.trophies}
            </dd>
          </div>
          <div>
            <dt>Membros</dt>
            <dd className="row gap-xs">
              <Users size={16} aria-hidden="true" /> {team.members.length}/{TEAM_MAX}
            </dd>
          </div>
        </dl>
      </section>

      <div className="tabs" role="tablist" aria-label="Seções do time">
        {tabs.map((t) => (
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

      {tab === 'elenco' && (
        <section className="card table-wrap" aria-label="Elenco">
          <table className="table roster-table">
            <thead>
              <tr>
                <th scope="col">Jogador</th>
                <th scope="col">Função</th>
                <th scope="col">Level</th>
                <th scope="col">ELO</th>
                <th scope="col" className="hide-sm">
                  Rating
                </th>
                <th scope="col" className="hide-sm">
                  KAST
                </th>
                {captain && (
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {roster.map((m) => (
                <tr key={m.nick} className={m.me ? 'me' : ''}>
                  <td>
                    <Link to={`/perfil/${m.nick}`} className="player-cell">
                      <span className="leader-avatar">
                        {m.role === 'Capitão' && <Crown size={14} className="leader-crown" aria-label="Capitão" />}
                        <Avatar nick={m.nick} size={32} />
                      </span>
                      <Nick nick={m.nick} />
                    </Link>
                  </td>
                  <td>
                    {captain && !m.me ? (
                      <select
                        value={m.role}
                        onChange={(e) => act(setRole(team.id, m.nick, e.target.value)).catch(() => {})}
                        aria-label={`Função de ${m.nick}`}
                        className="select-sm"
                      >
                        {TEAM_ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`tag ${m.role === 'Capitão' ? 'tag-accent' : ''}`}>{m.role}</span>
                    )}
                  </td>
                  <td>
                    <LevelBadge level={m.player.level} size={26} />
                  </td>
                  <td className="strong">{m.player.elo}</td>
                  <td className={`hide-sm strong ${ratingClass(m.player.rating)}`}>{m.player.rating.toFixed(2)}</td>
                  <td className="hide-sm">{m.player.kast}%</td>
                  {captain && (
                    <td className="td-action">
                      {!m.me && (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setModal({ remove: m.nick })}
                          aria-label={`Remover ${m.nick} do time`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {(team.invites ?? []).map((nick) => (
                <tr key={`inv-${nick}`} className="pending-row">
                  <td>
                    <span className="player-cell">
                      <Avatar nick={nick} size={32} /> {nick}
                    </span>
                  </td>
                  <td colSpan={captain ? 6 : 5} className="muted small">
                    <span className="spinner spinner-sm" aria-hidden="true" /> Convite enviado
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {captain && (
            <p className="muted small roster-hint">
              Mudar alguém para Capitão transfere a capitania: você passa a ser Jogador.
            </p>
          )}
        </section>
      )}

      {tab === 'partidas' && (
        <section className="card">
          {team.matches.length ? (
            <ul className="team-matches">
              {team.matches.map((m) => (
                <li key={m.id} className={`team-match ${m.won ? 'win' : 'loss'}`}>
                  <MapThumb map={m.map} height={44} showName={false} className="team-match-map" />
                  <div className="match-row-info">
                    <strong>vs {m.opponent}</strong>
                    <span className="muted small">
                      {m.event} · {m.map.name} · {m.daysAgo === 0 ? 'Hoje' : `${m.daysAgo} dias atrás`}
                    </span>
                  </div>
                  <div className="match-row-score">
                    <span className={m.won ? 'text-win' : 'text-loss'}>{m.scoreUs}</span>
                    <span className="muted"> : </span>
                    <span>{m.scoreThem}</span>
                  </div>
                  <span className={`result-tag ${m.won ? 'win' : 'loss'}`}>{m.won ? 'Vitória' : 'Derrota'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-team">
              <strong>Nenhuma partida ainda</strong>
              <p className="muted small">Desafie outro time nos lobbies ou inscreva o time em um campeonato.</p>
              <div className="row gap-sm">
                <Link to="/jogar/lobbies" className="btn btn-primary btn-sm">
                  Ir para lobbies
                </Link>
                <Link to="/campeonatos" className="btn btn-ghost btn-sm">
                  Campeonatos
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'config' && captain && (
        <section className="card">
          <h2 className="card-head">Configurações do time</h2>
          <TeamForm
            key={team.id}
            initial={{
              name: team.name,
              tag: team.tag,
              color: team.color,
              region: team.region,
              description: team.description ?? '',
              recruiting: team.recruiting,
              minLevel: team.minLevel,
            }}
            submitLabel={saved ? 'Salvo ✓' : 'Salvar alterações'}
            onSubmit={async (data) => {
              await editTeam(team.id, data);
              toast.success('Time atualizado');
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
          />
        </section>
      )}

      {modal === 'invite' && <InviteToTeamModal team={team} onClose={() => setModal(null)} />}
      {modal === 'leave' && (
        <Confirm
          title="Sair do time"
          text={`Tem certeza que quer sair do ${team.name}?`}
          confirmLabel="Sair do time"
          onConfirm={doLeave}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'disband' && (
        <Confirm
          title="Desfazer time"
          text={`Isso remove o ${team.name} para todos os membros. Não dá para desfazer.`}
          confirmLabel="Desfazer time"
          onConfirm={doLeave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.remove && (
        <Confirm
          title="Remover jogador"
          text={`Remover ${modal.remove} do ${team.name}?`}
          confirmLabel="Remover"
          onConfirm={() => {
            act(removeMember(team.id, modal.remove)).catch(() => {});
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
