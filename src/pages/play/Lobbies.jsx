import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Swords, Lock, Globe, Check, X, Bell, Crown } from 'lucide-react';
import { ME, REGIONS } from '../../data/mock';
import { api } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { Skeleton } from '../../components/Async';
import { useParty, PARTY_MAX } from '../../context/PartyContext';
import { useQueue } from '../../context/QueueContext';
import { Avatar, LevelBadge } from '../../components/ui';
import PartyPanel from '../../components/PartyPanel';

const NO_LOBBIES = []; // referência estável enquanto a lista carrega
const newMatchId = () => Math.random().toString(36).slice(2, 10);

function LobbyCard({ lobby, challenge, onChallenge, disabled }) {
  const full = lobby.players.length >= PARTY_MAX;
  const playing = lobby.status === 'playing';
  const state = challenge?.lobbyId === lobby.id ? challenge.status : null;

  return (
    <article className={`card lobby-card ${state ? `is-${state}` : ''}`}>
      <header className="lobby-head">
        <div>
          <h3>{lobby.name}</h3>
          <span className="muted small">
            {lobby.region} · aberto há {lobby.createdMin} min
          </span>
        </div>
        <span className={`status-chip ${playing ? 'playing' : 'ready'}`}>{playing ? 'Em partida' : 'Disponível'}</span>
      </header>

      <div className="lobby-players">
        <div className="avatar-stack">
          {lobby.players.map((p, i) => (
            <span
              key={p.nick}
              title={`${p.nick} · level ${p.level}${i === 0 ? ' · líder' : ''}`}
              className={i === 0 ? 'leader-avatar' : ''}
            >
              {i === 0 && <Crown size={15} className="leader-crown" aria-label="Líder do lobby" />}
              <Avatar nick={p.nick} size={34} />
            </span>
          ))}
          {Array.from({ length: PARTY_MAX - lobby.players.length }, (_, i) => (
            <span key={i} className="avatar-empty" aria-hidden="true" />
          ))}
        </div>
        <span className={`small ${full ? 'text-win' : 'muted'}`}>
          {lobby.players.length}/{PARTY_MAX}
        </span>
      </div>

      <div className="lobby-meta">
        <div>
          <span className="muted small">ELO médio</span>
          <strong>{lobby.avgElo}</strong>
        </div>
        <div>
          <span className="muted small">Levels</span>
          <span className="row gap-xs">
            <LevelBadge level={lobby.minLevel} size={22} />
            <span className="muted">–</span>
            <LevelBadge level={lobby.maxLevel} size={22} />
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`btn btn-block ${state === 'declined' ? 'btn-danger' : 'btn-primary'}`}
        disabled={playing || disabled || !!state}
        onClick={() => onChallenge(lobby)}
      >
        {state === 'pending' && (
          <>
            <span className="spinner spinner-sm" aria-hidden="true" /> Aguardando resposta...
          </>
        )}
        {state === 'accepted' && (
          <>
            <Check size={16} aria-hidden="true" /> Desafio aceito!
          </>
        )}
        {state === 'declined' && 'Desafio recusado'}
        {!state && (
          <>
            <Swords size={16} aria-hidden="true" /> Desafiar
          </>
        )}
      </button>
    </article>
  );
}

export default function Lobbies() {
  const navigate = useNavigate();
  const { party, pending } = useParty();
  const { status: queueStatus } = useQueue();
  const [seed, setSeed] = useState(0);
  const lobbiesQ = useQuery(() => api.play.lobbies(seed), [seed]);
  const lobbies = lobbiesQ.data ?? NO_LOBBIES;
  const [open, setOpen] = useState(false);
  const [lobbyName, setLobbyName] = useState(`Lobby do ${ME.nick}`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    region: 'all',
    nearLevel: false,
    onlyFull: false,
    hidePlaying: true,
  });
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const goToMatch = (opp) =>
    navigate(`/partida/${newMatchId()}`, {
      state: {
        partyA: party.map((p) => ({ nick: p.nick })),
        partyB: opp.players.map((p) => ({ nick: p.nick })),
        teamBName: opp.name,
        mode: 'Lobby 5v5 · Desafio',
      },
    });

  // Com o lobby aberto, outro lobby te desafia depois de alguns segundos
  useEffect(() => {
    if (!open || incoming || challenge) return undefined;
    const t = setTimeout(() => {
      const candidates = lobbies.filter((l) => l.status === 'waiting');
      setIncoming(candidates[Math.floor(Math.random() * candidates.length)]);
    }, 9000);
    return () => clearTimeout(t);
  }, [open, incoming, challenge, lobbies]);

  const sendChallenge = (lobby) => {
    setOpen(true); // desafiar abre seu lobby automaticamente
    setChallenge({ lobbyId: lobby.id, status: 'pending' });
    const accepted = Math.random() < 0.75;
    later(
      () => {
        setChallenge({ lobbyId: lobby.id, status: accepted ? 'accepted' : 'declined' });
        if (accepted) later(() => goToMatch(lobby), 1100);
        else later(() => setChallenge(null), 2500);
      },
      1800 + Math.random() * 2200,
    );
  };

  const myLevel = ME.level;
  const list = lobbies.filter((l) => {
    if (filters.q && !l.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.region !== 'all' && l.region !== filters.region) return false;
    if (filters.nearLevel && (l.maxLevel < myLevel - 2 || l.minLevel > myLevel + 2)) return false;
    if (filters.onlyFull && l.players.length < PARTY_MAX) return false;
    if (filters.hidePlaying && l.status === 'playing') return false;
    return true;
  });

  const setF = (k) => (e) =>
    setFilters({ ...filters, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const busy = !!challenge || queueStatus !== 'idle' || pending.length > 0;

  return (
    <div className="stack">
      {incoming && (
        <div className="incoming" role="alertdialog" aria-labelledby="incoming-title">
          <Bell size={20} aria-hidden="true" className="accent" />
          <div className="incoming-text">
            <strong id="incoming-title">{incoming.name} desafiou seu lobby</strong>
            <span className="muted small">
              {incoming.players.length}/{PARTY_MAX} jogadores · ELO médio {incoming.avgElo} · {incoming.region}
            </span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => goToMatch(incoming)}>
            <Check size={14} aria-hidden="true" /> Aceitar
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIncoming(null)}>
            <X size={14} aria-hidden="true" /> Recusar
          </button>
        </div>
      )}

      <div className="grid-main-side">
        <section className="card">
          <PartyPanel locked={!!challenge} compact />
        </section>

        <section className="card my-lobby">
          <h2 className="card-head">Seu lobby</h2>
          <div className="field">
            <label htmlFor="lobby-name" className="small muted">
              Nome do lobby
            </label>
            <input
              id="lobby-name"
              className="input"
              value={lobbyName}
              maxLength={24}
              onChange={(e) => setLobbyName(e.target.value)}
              disabled={open}
            />
          </div>
          <div className="segmented" role="radiogroup" aria-label="Visibilidade do lobby">
            <button
              type="button"
              role="radio"
              aria-checked={!isPrivate}
              className={!isPrivate ? 'active' : ''}
              onClick={() => setIsPrivate(false)}
              disabled={open}
            >
              <Globe size={14} aria-hidden="true" /> Público
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isPrivate}
              className={isPrivate ? 'active' : ''}
              onClick={() => setIsPrivate(true)}
              disabled={open}
            >
              <Lock size={14} aria-hidden="true" /> Privado
            </button>
          </div>
          {open ? (
            <>
              <p className="lobby-open-msg" role="status">
                <span className="pulse-dot" aria-hidden="true" />
                {isPrivate ? 'Lobby privado aberto. Só você pode desafiar.' : 'Lobby aberto e visível para desafios.'}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setOpen(false)}
                disabled={!!challenge}
              >
                Fechar lobby
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setOpen(true)}
              disabled={pending.length > 0}
            >
              Abrir lobby
            </button>
          )}
          <p className="muted small">
            Desafie com a party que tiver. Se faltar gente, as vagas são completadas com jogadores avulsos.
          </p>
        </section>
      </div>

      <section aria-labelledby="lobbies-title" className="stack">
        <div className="toolbar">
          <h2 id="lobbies-title">
            Lobbies abertos <span className="muted">({list.length})</span>
          </h2>
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar lobby"
              value={filters.q}
              onChange={setF('q')}
              aria-label="Buscar lobby"
            />
          </label>
          <select value={filters.region} onChange={setF('region')} aria-label="Região">
            <option value="all">Todas as regiões</option>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" checked={filters.nearLevel} onChange={setF('nearLevel')} /> Perto do meu level
          </label>
          <label className="check">
            <input type="checkbox" checked={filters.onlyFull} onChange={setF('onlyFull')} /> Só completos
          </label>
          <label className="check">
            <input type="checkbox" checked={filters.hidePlaying} onChange={setF('hidePlaying')} /> Ocultar em partida
          </label>
          <button type="button" className="icon-btn" onClick={() => setSeed((s) => s + 1)} aria-label="Atualizar lista">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="lobby-grid">
          {list.map((l) => (
            <LobbyCard key={l.id} lobby={l} challenge={challenge} onChallenge={sendChallenge} disabled={busy} />
          ))}
          {!lobbiesQ.data && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={230} r={12} />)}
          {lobbiesQ.data && list.length === 0 && <p className="muted empty-state">Nenhum lobby com esses filtros.</p>}
        </div>
      </section>
    </div>
  );
}
