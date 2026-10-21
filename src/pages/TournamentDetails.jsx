import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Trophy, Lock, Check, Radio, Medal, ScrollText, Clock } from 'lucide-react';
import { ME } from '../data/mock';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { useTeams } from '../context/TeamsContext';
import { Async, PageSkeleton } from '../components/Async';
import { Modal, Progress, TeamLogo } from '../components/ui';

const STATUS_LABEL = { open: 'Inscrições abertas', live: 'Ao vivo', finished: 'Finalizado' };
const TABS = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'chave', label: 'Chaveamento' },
  { id: 'times', label: 'Times inscritos' },
];

function BracketMatch({ m, highlight }) {
  const side = (key) => {
    const s = m[key];
    const won = m.winner === key;
    const lost = m.winner && !won;
    return (
      <div
        className={`bk-team ${won ? 'won' : ''} ${lost ? 'lost' : ''} ${s.name && s.name === highlight ? 'mine' : ''}`}
      >
        <span className="bk-name">{s.name ?? 'A definir'}</span>
        <span className="bk-score">{s.score ?? '–'}</span>
      </div>
    );
  };
  return (
    <div className={`bk-match status-${m.status}`}>
      {m.status === 'live' && (
        <span className="bk-live">
          <Radio size={11} aria-hidden="true" /> Ao vivo
        </span>
      )}
      {side('a')}
      {side('b')}
      <span className="bk-meta">{m.bestOf === 3 ? 'MD3' : `MD1 · ${m.map}`}</span>
    </div>
  );
}

function Bracket({ bracket, highlight }) {
  return (
    <div className="bracket" role="region" aria-label="Chaveamento">
      {bracket.rounds.map((r) => (
        <div key={r.name} className="bk-round">
          <h3 className="bk-round-title">{r.name}</h3>
          <div className="bk-round-matches">
            {r.matches.map((m) => (
              <BracketMatch key={m.id} m={m} highlight={highlight} />
            ))}
          </div>
        </div>
      ))}
      <div className="bk-round bk-champion-col">
        <h3 className="bk-round-title">Campeão</h3>
        <div className="bk-round-matches">
          <div className={`bk-champion ${bracket.champion ? 'set' : ''}`}>
            <Trophy size={22} aria-hidden="true" />
            <strong>{bracket.champion ?? 'A definir'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ t, onClose, onDone }) {
  const { myTeams, myRole } = useTeams();
  const captainTeams = myTeams.filter((x) => myRole(x) === 'Capitão');
  const [teamId, setTeamId] = useState(captainTeams[0]?.id ?? '');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      onDone(await api.tournaments.register(t.id, teamId));
      onClose();
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <Modal title={`Inscrever time · ${t.name}`} onClose={onClose}>
      {captainTeams.length === 0 ? (
        <div className="stack" style={{ gap: 12 }}>
          <p className="muted modal-sub">
            Você precisa ser capitão de um time para inscrever. Crie um time ou peça a capitania.
          </p>
          <Link to="/times" className="btn btn-primary" onClick={onClose}>
            Ir para Times
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="stack" style={{ gap: 12 }}>
          <fieldset className="field">
            <legend>Escolha o time</legend>
            <div className="reg-teams">
              {captainTeams.map((x) => (
                <label key={x.id} className={`reg-team ${teamId === x.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="team"
                    value={x.id}
                    checked={teamId === x.id}
                    onChange={() => setTeamId(x.id)}
                  />
                  <TeamLogo tag={x.tag} color={x.color} size={34} />
                  <span>
                    <strong>{x.name}</strong>
                    <span className="muted small"> · {x.members.length} jogadores</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="row gap-sm form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending || !teamId}>
              Confirmar inscrição
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function TournamentView({ t, setData }) {
  const [tab, setTab] = useState(t.status === 'open' ? 'geral' : 'chave');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const full = t.teams >= t.slots;
  const locked = ME.level < t.minLevel;
  const mine = t.myRegistration?.teamName;

  const unregister = () => {
    setError('');
    api.tournaments.unregister(t.id).then(setData, (e) => setError(e.message));
  };

  return (
    <div className="page stack">
      <Link to="/campeonatos" className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Campeonatos
      </Link>

      <section
        className="card td-hero"
        style={{
          backgroundImage: `linear-gradient(120deg, ${t.colors[0]}f0, ${t.colors[1]}cc 60%, #0d0d10ee), url(/maps/${t.map}.jpg)`,
        }}
      >
        <div className="td-hero-main">
          <span className={`status-chip ${t.status}`}>{STATUS_LABEL[t.status]}</span>
          <h1>{t.name}</h1>
          <p className="td-meta">
            <span>
              <Calendar size={14} aria-hidden="true" /> {t.date}
            </span>
            <span>{t.format}</span>
            <span>Level mínimo {t.minLevel}</span>
          </p>
        </div>
        <div className="td-hero-side">
          <span className="small td-light">Premiação</span>
          <strong className="td-prize">{t.prize}</strong>
          <span className="small td-light">
            <Users size={13} aria-hidden="true" /> {t.teams}/{t.slots} times
          </span>
          <Progress value={t.teams} max={t.slots} label="Vagas preenchidas" />
          {t.status === 'open' &&
            (mine ? (
              <div className="td-registered">
                <span className="tag tag-win">
                  <Check size={12} aria-hidden="true" /> {mine} inscrito
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={unregister}>
                  Cancelar inscrição
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={full || locked}
                onClick={() => setRegistering(true)}
              >
                {locked ? (
                  <>
                    <Lock size={14} aria-hidden="true" /> Requer level {t.minLevel}
                  </>
                ) : full ? (
                  'Lotado'
                ) : (
                  'Inscrever time'
                )}
              </button>
            ))}
        </div>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Seções do campeonato">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            className={`tab ${tab === x.id ? 'active' : ''}`}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <div className="grid-main-side">
          <section className="card">
            <h2 className="card-head">
              <ScrollText size={16} aria-hidden="true" /> Regras
            </h2>
            <ul className="td-rules">
              {t.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
          <aside className="stack">
            <section className="card">
              <h2 className="card-head">
                <Medal size={16} aria-hidden="true" /> Premiação
              </h2>
              <ul className="td-prizes">
                {t.prizes.map((p, i) => (
                  <li key={p.place} className={`place-${i + 1}`}>
                    <span>{p.place}</span>
                    <strong>{p.value}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section className="card">
              <h2 className="card-head">
                <Clock size={16} aria-hidden="true" /> Cronograma
              </h2>
              <ul className="td-schedule">
                {t.schedule.map((s) => (
                  <li key={s.label}>
                    <span className="muted">{s.label}</span>
                    <strong>{s.when}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}

      {tab === 'chave' && (
        <section className="card">
          {t.status === 'open' && (
            <p className="muted small td-note">
              Prévia: o chaveamento oficial é sorteado quando as inscrições fecham.
              {t.bracket.size < t.slots && ` Exibindo os ${t.bracket.size} melhores colocados após a fase inicial.`}
            </p>
          )}
          <Bracket bracket={t.bracket} highlight={mine} />
        </section>
      )}

      {tab === 'times' && (
        <section className="card">
          <h2 className="card-head">{t.registered.length} times inscritos</h2>
          <ol className="td-teams">
            {t.registered.map((name, i) => (
              <li key={`${name}-${i}`} className={name === mine ? 'mine' : ''}>
                <span className="muted">{i + 1}.</span> {name}
                {name === mine && <span className="tag tag-accent">Seu time</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {registering && <RegisterModal t={t} onClose={() => setRegistering(false)} onDone={setData} />}
    </div>
  );
}

export default function TournamentDetails() {
  const { id } = useParams();
  const query = useQuery(() => api.tournaments.get(id), [id]);
  return (
    <Async query={query} skeleton={<PageSkeleton variant="profile" rows={6} />}>
      {(t) => <TournamentView t={t} setData={query.setData} />}
    </Async>
  );
}
