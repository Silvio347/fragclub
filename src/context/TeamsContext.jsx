import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, realtime } from '../services';
import { MY_TEAMS_LIMIT } from '../services/teams';
import { ME, getPlayer } from '../data/mock';

const TeamsCtx = createContext(null);
export { MY_TEAMS_LIMIT };

// Membros com `me: true` representam o usuário logado (sobrevive à troca de nick)
export const memberNick = (m) => (m.me ? ME.nick : m.nick);
export const resolveMember = (m) => getPlayer(memberNick(m));

/** @type {import('../types').TeamsState} */
const EMPTY = { myTeams: [], publicTeams: [], requests: [] };

export function TeamsProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api.teams.state().then((s) => {
      if (!alive) return;
      setState(s);
      setReady(true);
    });
    // Pedidos aceitos e convites respondidos chegam como eventos do servidor
    const off = realtime.on('teams:changed', setState);
    return () => {
      alive = false;
      off();
    };
  }, []);

  const run = useCallback((call) => call().then((s) => (setState(s), s)), []);

  const allTeams = useMemo(() => [...state.myTeams, ...state.publicTeams], [state]);
  const getTeam = useCallback((id) => allTeams.find((t) => t.id === id) ?? null, [allTeams]);
  const isMember = useCallback((team) => team.members.some((m) => m.me), []);
  const myRole = useCallback((team) => team.members.find((m) => m.me)?.role ?? null, []);

  /** @returns {Promise<string>} id do time criado */
  const createTeam = useCallback(
    (data) =>
      api.teams.create(data).then(({ state: s, id }) => {
        setState(s);
        return id;
      }),
    [],
  );
  const joinPublicTeam = useCallback((teamId) => run(() => api.teams.join(teamId)), [run]);
  const requestJoin = useCallback((teamId) => run(() => api.teams.requestJoin(teamId)), [run]);
  const cancelRequest = useCallback((teamId) => run(() => api.teams.cancelRequest(teamId)), [run]);
  const inviteToTeam = useCallback((teamId, friend) => run(() => api.teams.invite(teamId, friend.nick)), [run]);
  const setRole = useCallback((teamId, nick, role) => run(() => api.teams.setRole(teamId, nick, role)), [run]);
  const removeMember = useCallback((teamId, nick) => run(() => api.teams.removeMember(teamId, nick)), [run]);
  const editTeam = useCallback((teamId, data) => run(() => api.teams.update(teamId, data)), [run]);
  const leaveTeam = useCallback((teamId) => run(() => api.teams.leave(teamId)), [run]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      allTeams,
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
      state,
      ready,
      allTeams,
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
