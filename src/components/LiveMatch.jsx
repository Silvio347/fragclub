import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, PauseCircle, Radio, Skull, Trophy, Coins, Crosshair } from 'lucide-react';
import { ME } from '../data/mock';
import { api, realtime, REPORT_REASONS } from '../services';
import { useToast } from '../context/ToastContext';
import { Avatar, LevelBadge, Modal } from './ui';

/** Assina o feed ao vivo da partida. */
function useLiveMatch(match) {
  const [state, setState] = useState(() => api.live.start(match));
  useEffect(() => {
    setState(api.live.start(match));
    const off = realtime.on(`live:${match.id}`, setState);
    return () => {
      off();
      api.live.stop(match.id);
    };
  }, [match]);
  return state;
}

function ReportModal({ match, onClose }) {
  const toast = useToast();
  const players = [...match.teamA.players, ...match.teamB.players].filter((p) => p.nick !== ME.nick);
  const [nick, setNick] = useState('');
  const [reasons, setReasons] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.matches.report(match.id, { nick, reasons, comment });
      toast.success('Denúncia enviada', `A equipe anti-cheat vai analisar a demo de ${nick}.`);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Denunciar jogador" onClose={onClose}>
      <form className="report-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="rp-player">Jogador</label>
          <select id="rp-player" value={nick} onChange={(e) => setNick(e.target.value)}>
            <option value="">Selecione...</option>
            <optgroup label={match.teamA.name}>
              {players
                .filter((p) => match.teamA.players.includes(p))
                .map((p) => (
                  <option key={p.nick}>{p.nick}</option>
                ))}
            </optgroup>
            <optgroup label={match.teamB.name}>
              {players
                .filter((p) => match.teamB.players.includes(p))
                .map((p) => (
                  <option key={p.nick}>{p.nick}</option>
                ))}
            </optgroup>
          </select>
        </div>
        <fieldset className="field">
          <legend>Motivo</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className="check">
              <input type="checkbox" checked={reasons.includes(r.id)} onChange={() => toggle(r.id)} /> {r.label}
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="rp-comment">
            Detalhes <span className="muted small">(opcional)</span>
          </label>
          <textarea
            id="rp-comment"
            className="input textarea"
            rows={3}
            maxLength={300}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Round, situação, o que aconteceu..."
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="row gap-sm form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-danger" disabled={busy || !nick || !reasons.length}>
            Enviar denúncia
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LiveTable({ team, lines, won, rounds }) {
  const sorted = [...lines].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  return (
    <section
      className={`card live-table ${won === true ? 'won' : won === false ? 'lost' : ''}`}
      aria-label={`Placar ao vivo de ${team.name}`}
    >
      <h3>{team.name}</h3>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Jogador</th>
            <th scope="col" className="num">
              K
            </th>
            <th scope="col" className="num">
              D
            </th>
            <th scope="col" className="num">
              A
            </th>
            <th scope="col" className="num hide-sm">
              ADR
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.nick} className={p.nick === ME.nick ? 'me' : ''}>
              <td>
                <span className="player-cell">
                  <Avatar nick={p.nick} size={26} />
                  <LevelBadge level={p.level} size={20} />
                  {p.nick}
                </span>
              </td>
              <td className="num strong">{p.kills}</td>
              <td className="num">{p.deaths}</td>
              <td className="num">{p.assists}</td>
              <td className="num hide-sm">{Math.round(p.damage / Math.max(1, rounds))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function LiveMatch({ match, map }) {
  const toast = useToast();
  const state = useLiveMatch(match);
  const [reporting, setReporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const finished = state.status === 'finished';
  const won = finished ? state.winner === 'A' : null;

  // Fim de jogo: credita os pontos uma única vez
  useEffect(() => {
    if (!finished) return;
    api.matches.finish(match.id, { won: state.winner === 'A', mapName: map.name }).then(setSummary);
  }, [finished, match.id, state.winner, map.name]);

  const votePause = () =>
    api.live.votePause(match.id).then(
      () => toast.info('Pausa técnica', 'Seu time aprovou a pausa de 30 segundos.'),
      (e) => toast.error('Não foi possível pausar', e.message),
    );

  return (
    <div className="stack live">
      <section className="card live-hero" style={{ backgroundImage: `url(/maps/${map.id}.jpg)` }}>
        <div className="live-overlay" aria-hidden="true" />
        <div className="live-top">
          <span className={`status-chip ${finished ? 'ready' : 'playing'}`}>
            {finished ? (
              'Partida encerrada'
            ) : state.status === 'paused' ? (
              'Pausa técnica'
            ) : (
              <>
                <Radio size={12} aria-hidden="true" /> Ao vivo · Round {state.round + 1}
              </>
            )}
          </span>
          <span className="muted small">
            {map.name} · {state.half === 3 ? 'Prorrogação' : `${state.half}º tempo`}
          </span>
        </div>
        <div className="live-score" aria-live="polite" aria-label={`Placar ${state.scoreA} a ${state.scoreB}`}>
          <strong className="live-team">{match.teamA.name}</strong>
          <span className={state.scoreA >= state.scoreB ? 'text-win' : ''}>{state.scoreA}</span>
          <span className="muted">:</span>
          <span className={state.scoreB > state.scoreA ? 'text-loss' : ''}>{state.scoreB}</span>
          <strong className="live-team right">{match.teamB.name}</strong>
        </div>
        <div className="live-rounds" aria-hidden="true">
          {state.rounds.map((r) => (
            <span key={r.n} className={`live-round ${r.winner === 'A' ? 'a' : 'b'}`} />
          ))}
        </div>
        {state.status === 'paused' && (
          <p className="live-pause" role="status">
            <PauseCircle size={16} aria-hidden="true" /> Pausa técnica pedida por {state.pause.by} ·{' '}
            {Math.max(0, Math.round(state.pause.left))}s
          </p>
        )}
        {state.pauseVote && (
          <p className="live-pause" role="status">
            Votação de pausa: {state.pauseVote.votes}/{state.pauseVote.needed} votos
          </p>
        )}
        {!finished && (
          <div className="live-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={votePause}
              disabled={state.status !== 'live' || !!state.pauseVote || state.pausesUsed.A >= 1}
            >
              <PauseCircle size={14} aria-hidden="true" />{' '}
              {state.pausesUsed.A >= 1 ? 'Pausa usada' : 'Pedir pausa técnica'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReporting(true)}>
              <Flag size={14} aria-hidden="true" /> Denunciar jogador
            </button>
          </div>
        )}
      </section>

      {finished && (
        <section className={`card live-summary ${won ? 'won' : 'lost'}`} role="status">
          <Trophy size={30} aria-hidden="true" />
          <div>
            <h2>{won ? 'Vitória!' : 'Derrota'}</h2>
            <p className="muted">
              {state.scoreA}:{state.scoreB} na {map.name}
            </p>
          </div>
          {summary && (
            <div className="live-rewards">
              <span className={summary.eloDelta > 0 ? 'text-win strong' : 'text-loss strong'}>
                {summary.eloDelta > 0 ? '+' : ''}
                {summary.eloDelta} ELO
              </span>
              <span className="price">
                <Coins size={14} aria-hidden="true" /> +{summary.points} FP
              </span>
            </div>
          )}
          <div className="row gap-sm wrap">
            <Link to="/jogar" className="btn btn-primary">
              <Crosshair size={16} aria-hidden="true" /> Jogar de novo
            </Link>
            <Link to="/loja" className="btn btn-ghost">
              Ir para a loja
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setReporting(true)}>
              <Flag size={14} aria-hidden="true" /> Denunciar
            </button>
          </div>
        </section>
      )}

      {state.feed.length > 0 && !finished && (
        <ul className="kill-feed" aria-label="Últimas kills">
          {state.feed.map((k, i) => (
            <li key={`${state.round}-${i}`}>
              <strong>{k.killer}</strong> <Skull size={12} aria-hidden="true" /> {k.victim}
            </li>
          ))}
        </ul>
      )}

      <div className="live-tables">
        <LiveTable team={match.teamA} lines={state.teamA} rounds={state.round} won={won} />
        <LiveTable team={match.teamB} lines={state.teamB} rounds={state.round} won={finished ? !won : null} />
      </div>

      {reporting && <ReportModal match={match} onClose={() => setReporting(false)} />}
    </div>
  );
}
