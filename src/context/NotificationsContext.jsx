import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, realtime } from '../services';
import { useToast } from './ToastContext';

const NotifCtx = createContext(null);
const MIN = 60 * 1000;

export function NotificationsProvider({ children }) {
  /** @type {[import('../types').AppNotification[], Function]} */
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const toast = useToast();
  const known = useRef(new Set());

  useEffect(() => {
    let alive = true;
    api.notifications.list().then((list) => {
      if (!alive) return;
      list.forEach((n) => known.current.add(n.id));
      setItems(list);
      setReady(true);
    });
    // Notificações novas chegam "do servidor" (outros serviços) e viram um toast
    const off = realtime.on('notifications:changed', (list) => {
      list
        .filter((n) => !known.current.has(n.id) && !n.read)
        .forEach((n) => toast.show({ type: n.type === 'system' ? 'info' : 'success', title: n.title, body: n.body }));
      list.forEach((n) => known.current.add(n.id));
      setItems(list);
    });
    return () => {
      alive = false;
      off();
    };
  }, [toast]);

  // Atualização otimista: a UI reage na hora, o serviço confirma depois
  const optimistic = useCallback((fn, call) => {
    setItems(fn);
    return call().then(setItems);
  }, []);

  const notify = useCallback((n) => api.notifications.create(n).then(setItems), []);
  const markRead = useCallback(
    (id) =>
      optimistic(
        (l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)),
        () => api.notifications.markRead(id),
      ),
    [optimistic],
  );
  const markAllRead = useCallback(
    () => optimistic((l) => l.map((n) => ({ ...n, read: true })), api.notifications.markAllRead),
    [optimistic],
  );
  const remove = useCallback(
    (id) =>
      optimistic(
        (l) => l.filter((n) => n.id !== id),
        () => api.notifications.remove(id),
      ),
    [optimistic],
  );
  const clearRead = useCallback(
    () => optimistic((l) => l.filter((n) => !n.read), api.notifications.clearRead),
    [optimistic],
  );
  const resolve = useCallback(
    (id, status) =>
      optimistic(
        (l) => l.map((n) => (n.id === id ? { ...n, read: true, resolved: status } : n)),
        () => api.notifications.resolve(id, status),
      ),
    [optimistic],
  );

  const value = useMemo(
    () => ({
      items,
      ready,
      unread: items.filter((n) => !n.read).length,
      notify,
      markRead,
      markAllRead,
      remove,
      clearRead,
      resolve,
    }),
    [items, ready, notify, markRead, markAllRead, remove, clearRead, resolve],
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
