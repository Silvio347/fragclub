import { request } from './client';
import { FRIENDS } from '../data/mock';

export const friends = {
  /** @returns {Promise<(import('../types').Player & import('../types').Friend)[]>} */
  list: () => request(() => FRIENDS, { min: 80, max: 200 }),
};
