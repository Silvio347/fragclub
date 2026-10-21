import { db, request, schedule, ApiError, notFound } from './client';
import { realtime } from './realtime';
import { pushNotification } from './notifications';
import { FRIENDS, NICKS, MAPS, ME, makePlayer } from '../data/mock';
import { seeded, pick } from '../utils/random';

const KEY = 'fc_friends';
const INITIAL = () => ({ friends: FRIENDS.map((f) => f.nick), incoming: ['hsmachine'], outgoing: [] });
const load = () => db.get(KEY, INITIAL);

// Status "ao vivo" de cada jogador (determinístico para o mock)
function withStatus(nick) {
  const known = FRIENDS.find((f) => f.nick === nick);
  if (known) return known;
  const rng = seeded(`status:${nick}`);
  const status = pick(rng, ['online', 'online', 'in-game', 'offline', 'offline']);
  return {
    ...makePlayer(nick),
    status,
    activity:
      status === 'in-game' ? `Em partida · ${pick(rng, MAPS).name}` : status === 'online' ? 'Online' : 'Offline',
  };
}

/** @typedef {'friend'|'incoming'|'outgoing'|'none'|'self'} Relation */

function view(s) {
  return {
    friends: s.friends.map(withStatus),
    incoming: s.incoming.map(withStatus),
    outgoing: s.outgoing.map(withStatus),
  };
}

function save(s) {
  db.set(KEY, s);
  const v = view(s);
  realtime.emit('friends:changed', v);
  return v;
}

const exists = (nick) => NICKS.includes(nick);

export const friends = {
  /** Só amizades aceitas (usado em convites de party/time e na home). */
  list: () => request(() => view(load()).friends, { min: 80, max: 200 }),

  /** Amigos + pedidos recebidos e enviados. */
  overview: () => request(() => view(load()), { min: 80, max: 200 }),

  /** @returns {Promise<Relation>} */
  relation: (nick) =>
    request(
      () => {
        if (nick === ME.nick) return 'self';
        const s = load();
        if (s.friends.includes(nick)) return 'friend';
        if (s.incoming.includes(nick)) return 'incoming';
        if (s.outgoing.includes(nick)) return 'outgoing';
        return 'none';
      },
      { min: 40, max: 120 },
    ),

  /** Jogadores com ELO parecido que ainda não são amigos. */
  suggestions: () =>
    request(() => {
      const s = load();
      const taken = new Set([...s.friends, ...s.incoming, ...s.outgoing, ME.nick]);
      return NICKS.filter((n) => !taken.has(n))
        .map(withStatus)
        .sort((a, b) => Math.abs(a.elo - ME.elo) - Math.abs(b.elo - ME.elo))
        .slice(0, 8);
    }),

  /** Envia pedido; o outro jogador aceita sozinho depois de alguns segundos (mock). */
  add: (nick) =>
    request(() => {
      if (nick === ME.nick) throw new ApiError('Você não pode se adicionar.', 422, 'self');
      if (!exists(nick)) throw notFound('Jogador');
      const s = load();
      if (s.friends.includes(nick)) return view(s);
      if (s.incoming.includes(nick))
        return save({ ...s, incoming: s.incoming.filter((n) => n !== nick), friends: [nick, ...s.friends] });
      if (s.outgoing.includes(nick)) return view(s);
      schedule(() => {
        const cur = load();
        if (!cur.outgoing.includes(nick)) return; // cancelado
        save({ ...cur, outgoing: cur.outgoing.filter((n) => n !== nick), friends: [nick, ...cur.friends] });
        pushNotification({
          type: 'friend',
          title: 'Pedido aceito',
          body: `${nick} aceitou seu pedido de amizade.`,
          link: '/amigos',
        });
      }, 2500);
      return save({ ...s, outgoing: [nick, ...s.outgoing] });
    }),

  accept: (nick) =>
    request(() => {
      const s = load();
      if (!s.incoming.includes(nick)) throw notFound('Pedido de amizade');
      return save({ ...s, incoming: s.incoming.filter((n) => n !== nick), friends: [nick, ...s.friends] });
    }),

  decline: (nick) =>
    request(() => {
      const s = load();
      return save({ ...s, incoming: s.incoming.filter((n) => n !== nick) });
    }),

  cancel: (nick) =>
    request(() => {
      const s = load();
      return save({ ...s, outgoing: s.outgoing.filter((n) => n !== nick) });
    }),

  remove: (nick) =>
    request(() => {
      const s = load();
      return save({ ...s, friends: s.friends.filter((n) => n !== nick) });
    }),
};
