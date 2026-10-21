import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

const NotifCtx = createContext(null);
const MIN = 60 * 1000;

// Notificações iniciais (mock)
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

export function NotificationsProvider({ children }) {
  const [items, setItems] = usePersistentState('fc_notifs', seed);

  const notify = useCallback(
    (n) =>
      setItems((list) =>
        [
          { id: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`, createdAt: Date.now(), read: false, ...n },
          ...list,
        ].slice(0, 40),
      ),
    [setItems],
  );
  const markRead = useCallback(
    (id) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [setItems],
  );
  const markAllRead = useCallback(() => setItems((list) => list.map((n) => ({ ...n, read: true }))), [setItems]);
  const remove = useCallback((id) => setItems((list) => list.filter((n) => n.id !== id)), [setItems]);
  const clearRead = useCallback(() => setItems((list) => list.filter((n) => !n.read)), [setItems]);
  // Marca convites/pedidos como respondidos
  const resolve = useCallback(
    (id, status) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true, resolved: status } : n))),
    [setItems],
  );

  const value = useMemo(
    () => ({
      items,
      unread: items.filter((n) => !n.read).length,
      notify,
      markRead,
      markAllRead,
      remove,
      clearRead,
      resolve,
    }),
    [items, notify, markRead, markAllRead, remove, clearRead, resolve],
  );

  return <NotifCtx.Provider value={value}>{children}</NotifCtx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotifCtx);
  if (!ctx) throw new Error('useNotifications precisa estar dentro de <NotificationsProvider>');
  return ctx;
}

export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / MIN);
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}
