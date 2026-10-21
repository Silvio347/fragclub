import { request, notFound } from './client';
import { TOURNAMENTS } from '../data/mock';

export const tournaments = {
  /** @returns {Promise<import('../types').Tournament[]>} */
  list: () => request(() => TOURNAMENTS),

  /** @returns {Promise<import('../types').Tournament>} */
  get: (id) =>
    request(() => {
      const t = TOURNAMENTS.find((x) => x.id === id);
      if (!t) throw notFound('Campeonato');
      return t;
    }),
};
