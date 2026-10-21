import { db, request, schedule, ApiError, notFound, forbidden } from './client';
import { realtime } from './realtime';
import { pushNotification } from './notifications';
import { PUBLIC_TEAMS, TEAM_MAX } from '../data/teams';
import { ME } from '../data/mock';

const KEY = 'fc_teams';
const INITIAL = { mine: [], joined: [], requests: [] };
export const MY_TEAMS_LIMIT = 3;

const load = () => db.get(KEY, INITIAL);

/** @returns {import('../types').TeamsState} */
function view(s) {
  const joined = new Set(s.joined.map((t) => t.id));
  return {
    myTeams: [...s.mine, ...s.joined],
    publicTeams: PUBLIC_TEAMS.filter((t) => !joined.has(t.id)),
    requests: s.requests,
  };
}

function save(s) {
  db.set(KEY, s);
  const v = view(s);
  realtime.emit('teams:changed', v);
  return v;
}

const memberNick = (m) => (m.me ? ME.nick : m.nick);
const myRole = (team) => team.members.find((m) => m.me)?.role ?? null;

function findMine(s, id) {
  const team = [...s.mine, ...s.joined].find((t) => t.id === id);
  if (!team) throw notFound('Time');
  return team;
}

function requireCaptain(team) {
  if (myRole(team) !== 'Capitão') throw forbidden('Só o capitão pode fazer isso.');
}

function patch(s, id, fn) {
  return {
    ...s,
    mine: s.mine.map((t) => (t.id === id ? fn(t) : t)),
    joined: s.joined.map((t) => (t.id === id ? fn(t) : t)),
  };
}

function assertLimit(s) {
  if (s.mine.length + s.joined.length >= MY_TEAMS_LIMIT) {
    throw new ApiError(`Você pode participar de até ${MY_TEAMS_LIMIT} times.`, 409, 'team_limit');
  }
}

function joinPublic(s, teamId, role = 'Jogador') {
  const base = PUBLIC_TEAMS.find((t) => t.id === teamId);
  if (!base) throw notFound('Time');
  if (s.joined.some((t) => t.id === teamId)) return s;
  assertLimit(s);
  return {
    ...s,
    requests: s.requests.filter((r) => r !== teamId),
    joined: [{ ...base, members: [...base.members, { me: true, role }], invites: [] }, ...s.joined],
  };
}

export const teams = {
  /** @returns {Promise<import('../types').TeamsState>} */
  state: () => request(() => view(load()), { min: 80, max: 200 }),

  /** @returns {Promise<{ state: import('../types').TeamsState, id: string }>} */
  create: (data) =>
    request(() => {
      const s = load();
      assertLimit(s);
      if (!data?.name?.trim() || !/^[A-Z0-9]{2,5}$/.test(data.tag ?? ''))
        throw new ApiError('Nome ou tag inválidos.', 422, 'invalid');
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
      return { state: save({ ...s, mine: [team, ...s.mine] }), id: team.id };
    }),

  /** Aceitar convite de um time existente. */
  join: (teamId) => request(() => save(joinPublic(load(), teamId))),

  /** Pedido para entrar: o capitão (mock) aceita depois de alguns segundos. */
  requestJoin: (teamId) =>
    request(() => {
      const s = load();
      const team = PUBLIC_TEAMS.find((t) => t.id === teamId);
      if (!team) throw notFound('Time');
      if (!team.recruiting) throw new ApiError('Esse time não está recrutando.', 409, 'not_recruiting');
      if (ME.level < team.minLevel) throw new ApiError(`Esse time exige level ${team.minLevel}.`, 403, 'level');
      if (s.requests.includes(teamId)) return view(s);
      schedule(() => {
        const cur = load();
        if (!cur.requests.includes(teamId)) return; // cancelado nesse meio-tempo
        try {
          save(joinPublic(cur, teamId));
          pushNotification({
            type: 'team',
            title: 'Solicitação aceita',
            body: `Você agora faz parte do ${team.name}.`,
            link: `/times/${teamId}`,
          });
        } catch (e) {
          save({ ...cur, requests: cur.requests.filter((r) => r !== teamId) });
          pushNotification({ type: 'team', title: 'Não foi possível entrar', body: e.message, link: '/times' });
        }
      }, 3500);
      return save({ ...s, requests: [...s.requests, teamId] });
    }),

  cancelRequest: (teamId) =>
    request(() => {
      const s = load();
      return save({ ...s, requests: s.requests.filter((r) => r !== teamId) });
    }),

  /** Convida um amigo; ele aceita sozinho depois de alguns segundos (mock). */
  invite: (teamId, nick) =>
    request(() => {
      const s = load();
      const team = findMine(s, teamId);
      requireCaptain(team);
      if (team.members.some((m) => memberNick(m) === nick) || (team.invites ?? []).includes(nick)) return view(s);
      if (team.members.length + (team.invites?.length ?? 0) >= TEAM_MAX)
        throw new ApiError('O time está cheio.', 409, 'team_full');
      schedule(
        () => {
          const cur = load();
          const t = [...cur.mine, ...cur.joined].find((x) => x.id === teamId);
          if (!t || !(t.invites ?? []).includes(nick)) return;
          save(
            patch(cur, teamId, (x) => ({
              ...x,
              invites: x.invites.filter((n) => n !== nick),
              members: x.members.length < TEAM_MAX ? [...x.members, { nick, role: 'Jogador' }] : x.members,
            })),
          );
          pushNotification({
            type: 'team',
            title: 'Novo membro',
            body: `${nick} aceitou o convite e entrou no ${t.name}.`,
            link: `/times/${teamId}`,
          });
        },
        1800 + Math.random() * 1500,
      );
      return save(patch(s, teamId, (t) => ({ ...t, invites: [...(t.invites ?? []), nick] })));
    }),

  /** Trocar função. Passar a capitania rebaixa o capitão atual para Jogador. */
  setRole: (teamId, nick, role) =>
    request(() => {
      const s = load();
      requireCaptain(findMine(s, teamId));
      return save(
        patch(s, teamId, (t) => ({
          ...t,
          members: t.members.map((m) => {
            if (role === 'Capitão' && m.role === 'Capitão') return { ...m, role: 'Jogador' };
            return memberNick(m) === nick ? { ...m, role } : m;
          }),
        })),
      );
    }),

  removeMember: (teamId, nick) =>
    request(() => {
      const s = load();
      requireCaptain(findMine(s, teamId));
      return save(patch(s, teamId, (t) => ({ ...t, members: t.members.filter((m) => memberNick(m) !== nick) })));
    }),

  update: (teamId, data) =>
    request(() => {
      const s = load();
      requireCaptain(findMine(s, teamId));
      return save(patch(s, teamId, (t) => ({ ...t, ...data })));
    }),

  /** Sair do time (ou desfazer, se for um time criado por você). */
  leave: (teamId) =>
    request(() => {
      const s = load();
      findMine(s, teamId);
      return save({
        ...s,
        mine: s.mine.filter((t) => t.id !== teamId),
        joined: s.joined.filter((t) => t.id !== teamId),
      });
    }),
};
