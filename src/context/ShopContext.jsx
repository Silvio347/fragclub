import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { ITEMS_BY_ID } from '../data/catalog';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

const ShopCtx = createContext(null);

const INITIAL = {
  points: 4850, // saldo atual de FragPoints
  seasonXp: 7350, // XP acumulado na temporada (define o nível de temporada)
  inventory: [], // [{ uid, itemId, boughtAt, status }]
  equipped: { frame: null, nick: null },
  stock: {}, // itemId -> quantas já saíram (mock)
  lastDaily: null,
};

const today = () => new Date().toISOString().slice(0, 10);

export function ShopProvider({ children }) {
  const [state, setState] = usePersistentState('fc_shop', INITIAL);
  const { notify } = useNotifications();
  const { grantPremiumDays } = useAuth();

  const buy = useCallback(
    (itemId) => {
      const item = ITEMS_BY_ID[itemId];
      if (!item) throw new Error('Item não encontrado.');
      if (state.points < item.price) throw new Error('FragPoints insuficientes.');
      if (item.stock && (state.stock[itemId] ?? 0) >= item.stock) throw new Error('Item esgotado.');
      if (item.kind !== 'skin' && item.kind !== 'premium' && state.inventory.some((i) => i.itemId === itemId)) {
        throw new Error('Você já tem esse item.');
      }
      setState((s) => ({
        ...s,
        points: s.points - item.price,
        stock: { ...s.stock, [itemId]: (s.stock[itemId] ?? 0) + 1 },
        inventory: [{ uid: `${itemId}-${Date.now()}`, itemId, boughtAt: Date.now(), status: 'available' }, ...s.inventory],
      }));
      notify({ type: 'shop', title: 'Compra concluída', body: `${item.name} foi para o seu inventário.`, link: '/loja?aba=inventario' });
    },
    [state, setState, notify],
  );

  const setStatus = (uid, status) =>
    setState((s) => ({ ...s, inventory: s.inventory.map((i) => (i.uid === uid ? { ...i, status } : i)) }));

  // Skins: pedido de envio via trade da Steam (mock)
  const redeem = useCallback(
    (uid) => {
      const inv = state.inventory.find((i) => i.uid === uid);
      if (!inv) return;
      setStatus(uid, 'redeeming');
      notify({ type: 'shop', title: 'Resgate solicitado', body: `${ITEMS_BY_ID[inv.itemId].name} será enviada por trade em até 48h.`, link: '/loja?aba=inventario' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.inventory, notify],
  );

  const activatePremium = useCallback(
    (uid) => {
      const inv = state.inventory.find((i) => i.uid === uid);
      if (!inv) return;
      grantPremiumDays(ITEMS_BY_ID[inv.itemId].days);
      setStatus(uid, 'used');
      notify({ type: 'system', title: 'Premium ativado', body: `${ITEMS_BY_ID[inv.itemId].name} ativado na sua conta.`, link: '/premium' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.inventory, grantPremiumDays, notify],
  );

  // Cosméticos: equipa/desequipa por slot (frame ou nick)
  const toggleEquip = useCallback(
    (itemId) => {
      const item = ITEMS_BY_ID[itemId];
      if (!item || (item.kind !== 'frame' && item.kind !== 'nick')) return;
      setState((s) => ({ ...s, equipped: { ...s.equipped, [item.kind]: s.equipped[item.kind] === itemId ? null : itemId } }));
    },
    [setState],
  );

  const claimDaily = useCallback(() => {
    if (state.lastDaily === today()) return false;
    setState((s) => ({ ...s, points: s.points + 100, seasonXp: s.seasonXp + 100, lastDaily: today() }));
    notify({ type: 'points', title: '+100 FragPoints', body: 'Recompensa diária coletada. Volte amanhã!', link: '/loja' });
    return true;
  }, [state.lastDaily, setState, notify]);

  const owns = useCallback((itemId) => state.inventory.some((i) => i.itemId === itemId), [state.inventory]);

  const value = useMemo(
    () => ({
      ...state,
      dailyAvailable: state.lastDaily !== today(),
      buy,
      redeem,
      activatePremium,
      toggleEquip,
      claimDaily,
      owns,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, buy, redeem, activatePremium, toggleEquip, claimDaily, owns],
  );

  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopCtx);
  if (!ctx) throw new Error('useShop precisa estar dentro de <ShopProvider>');
  return ctx;
}

// Versão opcional (não lança erro) para componentes genéricos como o Avatar
export function useShopOptional() {
  return useContext(ShopCtx);
}
