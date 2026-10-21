import { db, request } from './client';
import { realtime } from './realtime';

const KEY = 'fc_notifs';
const MIN = 60 * 1000;
const MAX_ITEMS = 40;

function seed() {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'team_invite',
      title: 'Convite de time',
      body: 'Os Brabos te convidou para entrar no time como Jogador.',
      teamId: 'team-0',
      createdAt: now - 4 * MIN,
      read: false,
    },
    {
      id: 'n2',
      type: 'friend_request',
      title: 'Pedido de amizade',
      body: 'awpzera quer ser seu amigo.',
      from: 'awpzera',
      createdAt: now - 18 * MIN,
      read: false,
    },
    {
      id: 'n3',
      type: 'challenge',
      title: 'Desafio recebido',
      body: 'Tryhard SP desafiou seu lobby ontem. Abra um lobby para receber novos desafios.',
      link: '/jogar/lobbies',
      createdAt: now - 70 * MIN,
      read: false,
    },
    {
      id: 'n4',
      type: 'points',
      title: '+120 FragPoints',
      body: 'Vitória na Ancient. Seus pontos já estão na loja.',
      link: '/loja',
      createdAt: now - 3 * 60 * MIN,
      read: true,
    },
    {
      id: 'n5',
      type: 'tournament',
      title: 'Copa Noturna #142',
      body: 'O campeonato começa hoje às 22h. Inscrições fecham às 21h30.',
      link: '/campeonatos',
      createdAt: now - 6 * 60 * MIN,
      read: true,
    },
    {
      id: 'n6',
      type: 'system',
      title: 'Temporada 4 começou',
      body: 'Novos itens na loja e ranking zerado. Boa sorte!',
      link: '/loja',
      createdAt: now - 3 * 24 * 60 * MIN,
      read: true,
    },
  ];
}

const read = () => db.get(KEY, seed);
const write = (list) => {
  db.set(KEY, list);
  realtime.emit('notifications:changed', list);
  return list;
};
const edit = (fn) => write(fn(read()));

/**
 * Uso interno dos outros serviços: o "servidor" cria uma notificação e empurra para o cliente.
 * @param {Partial<import('../types').AppNotification>} n
 */
export function pushNotification(n) {
  const item = {
    id: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    read: false,
    ...n,
  };
  edit((list) => [item, ...list].slice(0, MAX_ITEMS));
  return item;
}

export const notifications = {
  /** @returns {Promise<import('../types').AppNotification[]>} */
  list: () => request(read, { min: 80, max: 200 }),
  /** Notificação gerada pelo próprio cliente (ex.: erro de ação). */
  create: (n) => request(() => (pushNotification(n), read()), { min: 0, max: 0 }),
  markRead: (id) =>
    request(() => edit((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))), { min: 40, max: 120 }),
  markAllRead: () => request(() => edit((l) => l.map((n) => ({ ...n, read: true }))), { min: 40, max: 120 }),
  remove: (id) => request(() => edit((l) => l.filter((n) => n.id !== id)), { min: 40, max: 120 }),
  clearRead: () => request(() => edit((l) => l.filter((n) => !n.read)), { min: 40, max: 120 }),
  /** Marca convite/pedido como respondido. */
  resolve: (id, status) =>
    request(() => edit((l) => l.map((n) => (n.id === id ? { ...n, read: true, resolved: status } : n))), {
      min: 40,
      max: 120,
    }),
};
