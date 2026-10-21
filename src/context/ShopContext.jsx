import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, realtime } from '../services';
import { useAuth } from './AuthContext';

const ShopCtx = createContext(null);

/** @type {import('../types').ShopState} */
const EMPTY = {
  points: 0,
  seasonXp: 0,
  inventory: [],
  equipped: { frame: null, nick: null },
  stock: {},
  dailyAvailable: false,
};

export function ShopProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const { grantPremiumDays, profile } = useAuth();

  useEffect(() => {
    let alive = true;
    api.shop.state().then((s) => {
      if (!alive) return;
      setState(s);
      setReady(true);
    });
    // Pontos creditados pelo servidor (ex.: fim de partida) atualizam saldo e topo na hora
    const off = realtime.on('shop:changed', setState);
    return () => {
      alive = false;
      off();
    };
  }, []);

  // Todas as ações: chama o serviço, aplica o estado retornado e repassa erros para a UI
  const run = useCallback((call) => call().then((s) => (setState(s), s)), []);

  const buy = useCallback((itemId) => run(() => api.shop.buy(itemId)), [run]);
  const redeem = useCallback((uid) => run(() => api.shop.redeem(uid, profile.tradeUrl)), [run, profile.tradeUrl]);
  const toggleEquip = useCallback((itemId) => run(() => api.shop.toggleEquip(itemId)), [run]);
  const claimDaily = useCallback(() => run(api.shop.claimDaily), [run]);
  const activatePremium = useCallback(
    (uid) =>
      api.shop.activatePremium(uid).then(({ state: s, days }) => {
        setState(s);
        grantPremiumDays(days);
        return s;
      }),
    [grantPremiumDays],
  );

  const owns = useCallback((itemId) => state.inventory.some((i) => i.itemId === itemId), [state.inventory]);

  const value = useMemo(
    () => ({ ...state, ready, buy, redeem, activatePremium, toggleEquip, claimDaily, owns }),
    [state, ready, buy, redeem, activatePremium, toggleEquip, claimDaily, owns],
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
