import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ACCEPT_TIME = 15;
const QueueCtx = createContext(null);

// Simula o fluxo de matchmaking: idle -> searching -> found -> accepted -> sala da partida
export function QueueProvider({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [mode, setMode] = useState(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [acceptLeft, setAcceptLeft] = useState(ACCEPT_TIME);
  const [othersAccepted, setOthersAccepted] = useState(0);

  const [party, setParty] = useState([]);

  // m = { name }, p = jogadores da party (vão juntos para o mesmo time)
  const start = useCallback((m, p = []) => {
    setMode(m);
    setParty(p);
    setStartedAt(Date.now());
    setElapsed(0);
    setStatus('searching');
  }, []);

  const cancel = useCallback(() => {
    setStatus('idle');
    setElapsed(0);
  }, []);

  const accept = useCallback(() => setStatus((s) => (s === 'found' ? 'accepted' : s)), []);

  // Tempo na fila + partida encontrada após alguns segundos
  useEffect(() => {
    if (status !== 'searching') return undefined;
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    const found = setTimeout(
      () => {
        setAcceptLeft(ACCEPT_TIME);
        setOthersAccepted(0);
        setStatus('found');
      },
      5000 + Math.random() * 6000,
    );
    return () => {
      clearInterval(tick);
      clearTimeout(found);
    };
  }, [status, startedAt]);

  const isReadyCheck = status === 'found' || status === 'accepted';

  // Contagem regressiva para aceitar + outros jogadores aceitando
  useEffect(() => {
    if (!isReadyCheck) return undefined;
    const tick = setInterval(() => setAcceptLeft((s) => Math.max(0, s - 1)), 1000);
    const others = setInterval(() => {
      if (Math.random() < 0.75) setOthersAccepted((c) => Math.min(9, c + 1));
    }, 650);
    return () => {
      clearInterval(tick);
      clearInterval(others);
    };
  }, [isReadyCheck]);

  // Não aceitou a tempo
  useEffect(() => {
    if (status === 'found' && acceptLeft === 0) cancel();
  }, [status, acceptLeft, cancel]);

  // Todos aceitaram -> vai para a sala da partida
  useEffect(() => {
    if (status !== 'accepted' || (othersAccepted < 9 && acceptLeft > 0)) return undefined;
    const t = setTimeout(() => {
      const id = Math.random().toString(36).slice(2, 10);
      setStatus('idle');
      navigate(`/partida/${id}`, {
        state: { partyA: party.map((p) => ({ nick: p.nick })), mode: mode?.name ?? 'Ranqueada 5v5' },
      });
    }, 900);
    return () => clearTimeout(t);
  }, [status, othersAccepted, acceptLeft, navigate, party, mode]);

  const value = {
    status,
    mode,
    party,
    elapsed,
    acceptLeft,
    acceptTime: ACCEPT_TIME,
    acceptedCount: othersAccepted + (status === 'accepted' ? 1 : 0),
    start,
    cancel,
    accept,
  };

  return <QueueCtx.Provider value={value}>{children}</QueueCtx.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueCtx);
  if (!ctx) throw new Error('useQueue precisa estar dentro de <QueueProvider>');
  return ctx;
}
