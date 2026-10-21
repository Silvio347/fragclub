import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Crown, Server, Copy, Check, Send, Ban, Play, LogIn } from 'lucide-react';
import { MAPS, ME } from '../data/mock';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { Async, PageSkeleton } from '../components/Async';
import { Avatar, LevelBadge, MapThumb } from '../components/ui';
import LiveMatch from '../components/LiveMatch';
import { useToast } from '../context/ToastContext';

const TURN_TIME = 15;
// Nos testes o adversário e o servidor respondem na hora
const FAST = import.meta.env?.MODE === 'test';

function Team({ team, side, turn }) {
  return (
    <section className={`card team team-${side} ${turn ? 'is-turn' : ''}`} aria-label={team.name}>
      <header className="team-head">
        <div>
          <span className="eyebrow">{side === 'a' ? 'Time A' : 'Time B'}</span>
          <h2>{team.name}</h2>
        </div>
        <div className="team-elo">
          <span className="muted small">ELO médio</span>
          <strong>{team.avgElo}</strong>
        </div>
      </header>
      <ul className="team-list">
        {team.players.map((p, i) => (
          <li key={p.nick}>
            <Link to={`/perfil/${p.nick}`} className={`team-player ${p.nick === ME.nick ? 'me' : ''}`}>
              <Avatar nick={p.nick} size={36} />
              <div className="friend-info">
                <strong>
                  {p.nick} {i === 0 && <Crown size={13} className="accent" aria-label="Capitão" />}
                </strong>
                <span className="muted small">
                  Rating {p.rating.toFixed(2)} · KAST {p.kast}%
                </span>
              </div>
              <LevelBadge level={p.level} size={28} />
              <span className="team-player-elo">{p.elo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MatchRoom() {
  const { id } = useParams();
  const location = useLocation();
  // state vem da fila (partyA) ou do desafio de lobby (partyA + partyB)
  const q = useQuery(() => api.matches.room(id, location.state ?? {}), [id]);
  return (
    <Async query={q} skeleton={<PageSkeleton variant="cards" rows={3} />}>
      {(match) => <MatchRoomView match={match} />}
    </Async>
  );
}

function MatchRoomView({ match }) {
  const [bans, setBans] = useState([]);
  const [turnLeft, setTurnLeft] = useState(TURN_TIME);
  const [serverReady, setServerReady] = useState(false);
  const [live, setLive] = useState(false);
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'Sistema', text: 'Partida criada. O capitão de cada time faz o veto de mapas.', system: true },
    { from: match.teamB.players[0].nick, text: 'glhf' },
  ]);
  const [draft, setDraft] = useState('');
  const chatEnd = useRef(null);

  const remaining = MAPS.filter((m) => !bans.some((b) => b.mapId === m.id));
  const vetoDone = remaining.length === 1;
  const turn = bans.length % 2 === 0 ? 'A' : 'B';
  const pickedMap = vetoDone ? remaining[0] : null;

  const ban = useCallback((team, mapId) => {
    setBans((prev) => {
      const rem = MAPS.filter((m) => !prev.some((b) => b.mapId === m.id));
      if (rem.length <= 1) return prev;
      const target = mapId ? rem.find((m) => m.id === mapId) : rem[Math.floor(Math.random() * rem.length)];
      if (!target) return prev;
      return [...prev, { mapId: target.id, team }];
    });
  }, []);

  // Reseta o timer a cada novo turno
  useEffect(() => {
    setTurnLeft(TURN_TIME);
    if (vetoDone) return undefined;
    const t = setInterval(() => setTurnLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [bans.length, vetoDone]);

  // Capitão adversário bane automaticamente
  useEffect(() => {
    if (vetoDone || turn !== 'B') return undefined;
    const t = setTimeout(() => ban('B'), FAST ? 10 : 1200 + Math.random() * 1500);
    return () => clearTimeout(t);
  }, [turn, vetoDone, bans.length, ban]);

  // Tempo esgotado no seu turno: ban aleatório
  useEffect(() => {
    if (!vetoDone && turn === 'A' && turnLeft === 0) ban('A');
  }, [turnLeft, turn, vetoDone, ban]);

  // Mensagens de sistema do veto
  useEffect(() => {
    const last = bans[bans.length - 1];
    if (!last) return;
    const team = last.team === 'A' ? match.teamA.name : match.teamB.name;
    const mapName = MAPS.find((m) => m.id === last.mapId).name;
    setMessages((m) => [...m, { from: 'Sistema', text: `${team} baniu ${mapName}`, system: true }]);
  }, [bans, match]);

  // Sobe o servidor depois do veto
  useEffect(() => {
    if (!vetoDone) return undefined;
    setMessages((m) => [
      ...m,
      { from: 'Sistema', text: `Mapa definido: ${pickedMap.name}. Configurando servidor...`, system: true },
    ]);
    const t = setTimeout(() => setServerReady(true), FAST ? 10 : 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vetoDone]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const connectCmd = `connect ${match.ip}; password ${match.password}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(connectCmd);
      setCopied(true);
      toast.success('Comando copiado', 'Cole no console do CS2 (tecla ~).');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      toast.error('Não foi possível copiar', 'Selecione o comando e copie manualmente.');
    }
  };

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: ME.nick, text }]);
    setDraft('');
  };

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">
            {match.mode} · Partida #{match.id}
          </span>
          <h1>
            {match.teamA.name} <span className="muted">vs</span> {match.teamB.name}
          </h1>
        </div>
        <span className={`status-chip ${live ? 'playing' : serverReady ? 'ready' : ''}`}>
          {live
            ? 'Em andamento'
            : serverReady
              ? 'Servidor pronto'
              : vetoDone
                ? 'Configurando servidor'
                : 'Veto de mapas'}
        </span>
      </header>

      {live ? (
        <LiveMatch match={match} map={pickedMap} />
      ) : (
        <div className="match-grid">
          <Team team={match.teamA} side="a" turn={!vetoDone && turn === 'A'} />

          <section className="card veto" aria-labelledby="veto-title">
            {!vetoDone ? (
              <>
                <header className="veto-head">
                  <h2 id="veto-title">Veto de mapas</h2>
                  <p className={turn === 'A' ? 'accent' : 'muted'} role="status">
                    {turn === 'A' ? 'Sua vez de banir' : `${match.teamB.players[0].nick} está banindo...`}
                    <span className="veto-timer">{turnLeft}s</span>
                  </p>
                </header>
                <div className="veto-grid">
                  {MAPS.map((m) => {
                    const banned = bans.find((b) => b.mapId === m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`veto-map ${banned ? 'banned' : ''}`}
                        disabled={!!banned || turn !== 'A'}
                        onClick={() => ban('A', m.id)}
                        aria-label={banned ? `${m.name} banido` : `Banir ${m.name}`}
                      >
                        <MapThumb map={m} height={74}>
                          {banned && (
                            <span className="veto-banned">
                              <Ban size={16} aria-hidden="true" /> {banned.team === 'A' ? 'Time A' : 'Time B'}
                            </span>
                          )}
                        </MapThumb>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="server">
                <MapThumb map={pickedMap} height={150} className="server-map" />
                <h2 id="veto-title">{pickedMap.name}</h2>
                <p className="muted row gap-xs center">
                  <Server size={14} aria-hidden="true" /> {match.server}
                </p>
                {serverReady ? (
                  <>
                    <div className="connect-box">
                      <code>{connectCmd}</code>
                      <button type="button" className="icon-btn" onClick={copy} aria-label="Copiar comando de conexão">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <a
                      className="btn btn-primary btn-lg btn-block"
                      href={`steam://connect/${match.ip}/${match.password}`}
                    >
                      <Play size={18} aria-hidden="true" /> Conectar no CS2
                    </a>
                    <button type="button" className="btn btn-ghost btn-block" onClick={() => setLive(true)}>
                      <LogIn size={16} aria-hidden="true" /> Já entrei no servidor
                    </button>
                    <p className="muted small">Você tem 5 minutos para entrar no servidor.</p>
                  </>
                ) : (
                  <div className="searching">
                    <span className="spinner" aria-hidden="true" />
                    <span>Configurando servidor...</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <Team team={match.teamB} side="b" turn={!vetoDone && turn === 'B'} />
        </div>
      )}

      <section className="card chat" aria-labelledby="chat-title">
        <h2 id="chat-title" className="card-head">
          Chat da partida
        </h2>
        <ul className="chat-log" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i} className={m.system ? 'system' : ''}>
              {!m.system && <strong className={m.from === ME.nick ? 'accent' : ''}>{m.from}: </strong>}
              {m.text}
            </li>
          ))}
          <li ref={chatEnd} aria-hidden="true" />
        </ul>
        <form className="chat-form" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Digite uma mensagem..."
            aria-label="Mensagem"
            maxLength={200}
          />
          <button type="submit" className="btn btn-primary" aria-label="Enviar">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
