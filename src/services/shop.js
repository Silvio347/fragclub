import { db, request, ApiError, notFound } from './client';
import { pushNotification } from './notifications';
import { realtime } from './realtime';
import { SKINS, COSMETICS, PREMIUM_ITEMS, ITEMS_BY_ID } from '../data/catalog';

const KEY = 'fc_shop';
const INITIAL = {
  points: 4850,
  seasonXp: 7350,
  inventory: [], // [{ uid, itemId, boughtAt, status }]
  equipped: { frame: null, nick: null },
  stock: {},
  lastDaily: null,
};

const today = () => new Date().toISOString().slice(0, 10);
const load = () => db.get(KEY, INITIAL);
const save = (s) => {
  db.set(KEY, s);
  realtime.emit('shop:changed', view(s));
  return s;
};

/** Visão pública do estado (inventário já com os dados do item). */
function view(s) {
  return {
    ...s,
    dailyAvailable: s.lastDaily !== today(),
    inventory: s.inventory.filter((i) => ITEMS_BY_ID[i.itemId]).map((i) => ({ ...i, item: ITEMS_BY_ID[i.itemId] })),
  };
}

function setStatus(s, uid, status) {
  return { ...s, inventory: s.inventory.map((i) => (i.uid === uid ? { ...i, status } : i)) };
}

function findOwned(s, uid) {
  const inv = s.inventory.find((i) => i.uid === uid);
  if (!inv) throw notFound('Item do inventário');
  return inv;
}

/**
 * Crédito de FragPoints + XP de temporada feito pelo "servidor" (ex.: fim de partida).
 * @returns {import('../types').ShopState}
 */
export function grantPoints(amount, reason) {
  const s = load();
  const next = save({ ...s, points: s.points + amount, seasonXp: s.seasonXp + amount });
  pushNotification({ type: 'points', title: `+${amount} FragPoints`, body: reason, link: '/loja' });
  return view(next);
}

export const shop = {
  /** @returns {Promise<import('../types').ShopState>} */
  state: () => request(() => view(load()), { min: 80, max: 200 }),

  /** @returns {Promise<{ skins: import('../types').ShopItem[], cosmetics: import('../types').ShopItem[], premium: import('../types').ShopItem[] }>} */
  catalog: () => request(() => ({ skins: SKINS, cosmetics: COSMETICS, premium: PREMIUM_ITEMS })),

  /** @param {string} itemId @returns {Promise<import('../types').ShopState>} */
  buy: (itemId) =>
    request(
      () => {
        const s = load();
        const item = ITEMS_BY_ID[itemId];
        if (!item) throw notFound('Item');
        if (s.points < item.price) throw new ApiError('FragPoints insuficientes.', 402, 'insufficient_points');
        if (item.stock && (s.stock[itemId] ?? 0) >= item.stock) throw new ApiError('Item esgotado.', 409, 'sold_out');
        const unique = item.kind !== 'skin' && item.kind !== 'premium';
        if (unique && s.inventory.some((i) => i.itemId === itemId))
          throw new ApiError('Você já tem esse item.', 409, 'owned');
        const next = save({
          ...s,
          points: s.points - item.price,
          stock: { ...s.stock, [itemId]: (s.stock[itemId] ?? 0) + 1 },
          inventory: [
            { uid: `${itemId}-${Date.now()}`, itemId, boughtAt: Date.now(), status: 'available' },
            ...s.inventory,
          ],
        });
        pushNotification({
          type: 'shop',
          title: 'Compra concluída',
          body: `${item.name} foi para o seu inventário.`,
          link: '/loja?aba=inventario',
        });
        return view(next);
      },
      { min: 500, max: 900 },
    ),

  /** Pede o envio da skin por trade da Steam. */
  redeem: (uid, tradeUrl) =>
    request(() => {
      if (!tradeUrl) throw new ApiError('Cadastre seu link de troca da Steam no perfil.', 422, 'trade_url_missing');
      const s = load();
      const inv = findOwned(s, uid);
      if (inv.status !== 'available') throw new ApiError('Esse item já foi resgatado.', 409, 'already_redeemed');
      const next = save(setStatus(s, uid, 'redeeming'));
      pushNotification({
        type: 'shop',
        title: 'Resgate solicitado',
        body: `${ITEMS_BY_ID[inv.itemId].name} será enviada por trade em até 48h.`,
        link: '/loja?aba=inventario',
      });
      return view(next);
    }),

  /** @returns {Promise<{ state: import('../types').ShopState, days: number }>} */
  activatePremium: (uid) =>
    request(() => {
      const s = load();
      const inv = findOwned(s, uid);
      const item = ITEMS_BY_ID[inv.itemId];
      if (item.kind !== 'premium') throw new ApiError('Esse item não é Premium.');
      if (inv.status !== 'available') throw new ApiError('Esse Premium já foi ativado.', 409, 'used');
      const next = save(setStatus(s, uid, 'used'));
      pushNotification({
        type: 'system',
        title: 'Premium ativado',
        body: `${item.name} ativado na sua conta.`,
        link: '/premium',
      });
      return { state: view(next), days: item.days };
    }),

  /** Equipa/desequipa cosmético por slot (frame ou nick). */
  toggleEquip: (itemId) =>
    request(
      () => {
        const s = load();
        const item = ITEMS_BY_ID[itemId];
        if (!item || (item.kind !== 'frame' && item.kind !== 'nick')) throw new ApiError('Item não pode ser equipado.');
        if (!s.inventory.some((i) => i.itemId === itemId))
          throw new ApiError('Você não tem esse item.', 403, 'not_owned');
        return view(
          save({ ...s, equipped: { ...s.equipped, [item.kind]: s.equipped[item.kind] === itemId ? null : itemId } }),
        );
      },
      { min: 60, max: 160 },
    ),

  claimDaily: () =>
    request(() => {
      const s = load();
      if (s.lastDaily === today()) throw new ApiError('Recompensa diária já coletada hoje.', 409, 'already_claimed');
      const next = save({ ...s, points: s.points + 100, seasonXp: s.seasonXp + 100, lastDaily: today() });
      pushNotification({
        type: 'points',
        title: '+100 FragPoints',
        body: 'Recompensa diária coletada. Volte amanhã!',
        link: '/loja',
      });
      return view(next);
    }),
};
