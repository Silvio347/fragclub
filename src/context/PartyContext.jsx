import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ME } from '../data/mock';

export const PARTY_MAX = 5;
const PartyCtx = createContext(null);

// Party compartilhada entre Ranqueada e Lobbies (até 5 jogadores, você incluso)
export function PartyProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const total = 1 + members.length + pending.length;

  const invite = useCallback(
    (friend) => {
      if (total >= PARTY_MAX) return;
      if (members.some((m) => m.nick === friend.nick) || pending.some((p) => p.nick === friend.nick)) return;
      setPending((p) => [...p, friend]);
      // Simula o amigo aceitando o convite
      const t = setTimeout(
        () => {
          setPending((p) => p.filter((x) => x.nick !== friend.nick));
          setMembers((m) => (m.length + 1 < PARTY_MAX ? [...m, friend] : m));
        },
        900 + Math.random() * 1400,
      );
      timers.current.push(t);
    },
    [members, pending, total],
  );

  const kick = useCallback((nick) => {
    setMembers((m) => m.filter((x) => x.nick !== nick));
    setPending((p) => p.filter((x) => x.nick !== nick));
  }, []);

  const disband = useCallback(() => {
    setMembers([]);
    setPending([]);
  }, []);

  const value = {
    party: [ME, ...members],
    members,
    pending,
    total,
    isFull: total >= PARTY_MAX,
    invite,
    kick,
    disband,
  };

  return <PartyCtx.Provider value={value}>{children}</PartyCtx.Provider>;
}

export function useParty() {
  const ctx = useContext(PartyCtx);
  if (!ctx) throw new Error('useParty precisa estar dentro de <PartyProvider>');
  return ctx;
}
