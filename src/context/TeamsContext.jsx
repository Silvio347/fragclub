import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { PUBLIC_TEAMS, TEAM_MAX } from '../data/teams';
import { ME, getPlayer } from '../data/mock';
import { useNotifications } from './NotificationsContext';

const TeamsCtx = createContext(null);
export const MY_TEAMS_LIMIT = 3;

// Membros com `me: true` representam o usuário logado (sobrevive à troca de nick)
export const memberNick = (m) => (m.me ? ME.nick : m.nick);
export const resolveMember = (m) => getPlayer(memberNick(m));

const INITIAL = { mine: [], joined: [], requests: [] };

export function TeamsProvider({ children }) {
  const [state, setState] = usePersistentState('fc_teams', INITIAL);
  const { notify } = useNotifications();
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  // Times públicos onde eu entrei viram cópias editáveis com "me" no elenco
  const allTeams = useMemo(() => {
    const joined = new Set(state.joined.map((t) => t.id));
    return [...state.mine, ...state.joined, ...PUBLIC_TEAMS.filter((t) => !joined.has(t.id))];
  }, [state]);

  const myTeams = useMemo(() => [...state.mine, ...state.joined], [state]);
  const getTeam = useCallback((id) => allTeams.find((t) => t.id === id) ?? null, [allTeams]);
  const isMember = useCallback((team) => team.members.some((m) => m.me), []);
  const myRole = useCallback((team) => team.members.find((m) => m.me)?.role ?? null, []);

  const update = useCallback(
    (id, fn) =>
      setState((s) => ({
        ...s,
        mine: s.mine.map((t) => (t.id === id ? fn(t) : t)),
        joined: s.joined.map((t) => (t.id === id ? fn(t) : t)),
      })),
    [setState],
  );

  const createTeam = useCallback(
    (data) => {
      if (myTeams.length >= MY_TEAMS_LIMIT) throw new Error(`Você pode participar de até ${MY_TEAMS_LIMIT} times.`);
      const team = {
        id: `my-${Date.now().toString(36)}`,
        ...data,
        founded: new Date().getFullYear(),
        wins: 0,
        losses: 0,
        trophies: 0,
        matches: [],
        members: [{ me: true, role: 'Capitão' }],
        invites: [],
      };
      setState((s) => ({ ...s, mine: [team, ...s.mine] }));
      return team.id;
    },
    [myTeams.length, setState],
  );

  const joinPublicTeam = useCallback(
    (teamId, role = 'Jogador') => {
      const base = PUBLIC_TEAMS.find((t) => t.id === teamId);
      if (!base || state.joined.some((t) => t.id === teamId)) return;
      if (myTeams.length >= MY_TEAMS_LIMIT) throw new Error(`Você pode participar de até ${MY_TEAMS_LIMIT} times.`);
      setState((s) => ({
        ...s,
        requests: s.requests.filter((r) => r !== teamId),
        joined: [{ ...base, members: [...base.members, { me: true, role }], invites: [] }, ...s.joined],
      }));
    },
    [state.joined, myTeams.length, setState],
  );

  // Pedido para entrar: o capitão (mock) aceita depois de alguns segundos
  const requestJoin = useCallback(
    (teamId) => {
      if (state.requests.includes(teamId)) return;
      setState((s) => ({ ...s, requests: [...s.requests, teamId] }));
      const team = PUBLIC_TEAMS.find((t) => t.id === teamId);
      later(() => {
        try {
          joinPublicTeam(teamId);
          notify({
            type: 'team',
            title: 'Solicitação aceita',
            body: `Você agora faz parte do ${team.name}.`,
            link: `/times/${teamId}`,
          });
        } catch (e) {
          notify({ type: 'team', title: 'Não foi possível entrar', body: e.message, link: '/times' });
        }
      }, 3500);
    },

    [state.requests, setState, joinPublicTeam, notify],
  );

  const cancelRequest = useCallback(
    (teamId) => setState((s) => ({ ...s, requests: s.requests.filter((r) => r !== teamId) })),
    [setState],
  );

  // Convite para amigo: aceita automaticamente (mock)
  const inviteToTeam = useCallback(
    (teamId, friend) => {
      const team = getTeam(teamId);
      if (!team || team.members.length + (team.invites?.length ?? 0) >= TEAM_MAX) return;
      update(teamId, (t) => ({ ...t, invites: [...(t.invites ?? []), friend.nick] }));
      later(
        () => {
          update(teamId, (t) => ({
            ...t,
            invites: (t.invites ?? []).filter((n) => n !== friend.nick),
            members: t.members.length < TEAM_MAX ? [...t.members, { nick: friend.nick, role: 'Jogador' }] : t.members,
          }));
          notify({
            type: 'team',
            title: 'Novo membro',
            body: `${friend.nick} aceitou o convite e entrou no ${team.name}.`,
            link: `/times/${teamId}`,
          });
        },
        1800 + Math.random() * 1500,
      );
    },

    [getTeam, update, notify],
  );

  const setRole = useCallback(
    (teamId, nick, role) =>
      update(teamId, (t) => ({
        ...t,
        members: t.members.map((m) => {
          // Passar a capitania: o capitão atual vira Jogador
          if (role === 'Capitão' && m.role === 'Capitão') return { ...m, role: 'Jogador' };
          return memberNick(m) === nick ? { ...m, role } : m;
        }),
      })),
    [update],
  );

  const removeMember = useCallback(
    (teamId, nick) => update(teamId, (t) => ({ ...t, members: t.members.filter((m) => memberNick(m) !== nick) })),
    [update],
  );

  const editTeam = useCallback((teamId, data) => update(teamId, (t) => ({ ...t, ...data })), [update]);

  const leaveTeam = useCallback(
    (teamId) =>
      setState((s) => ({
        ...s,
        mine: s.mine.filter((t) => t.id !== teamId),
        joined: s.joined.filter((t) => t.id !== teamId),
      })),
    [setState],
  );

  const value = useMemo(
    () => ({
      myTeams,
      allTeams,
      requests: state.requests,
      getTeam,
      isMember,
      myRole,
      createTeam,
      joinPublicTeam,
      requestJoin,
      cancelRequest,
      inviteToTeam,
      setRole,
      removeMember,
      editTeam,
      leaveTeam,
      disbandTeam: leaveTeam,
    }),
    [
      myTeams,
      allTeams,
      state.requests,
      getTeam,
      isMember,
      myRole,
      createTeam,
      joinPublicTeam,
      requestJoin,
      cancelRequest,
      inviteToTeam,
      setRole,
      removeMember,
      editTeam,
      leaveTeam,
    ],
  );

  return <TeamsCtx.Provider value={value}>{children}</TeamsCtx.Provider>;
}

export function useTeams() {
  const ctx = useContext(TeamsCtx);
  if (!ctx) throw new Error('useTeams precisa estar dentro de <TeamsProvider>');
  return ctx;
}
