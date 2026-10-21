import { request, notFound } from './client';
import { getMatchDetails, genMatch } from '../data/mock';

export const matches = {
  /** @returns {Promise<import('../types').MatchDetails>} */
  details: (id) =>
    request(() => {
      const d = getMatchDetails(id);
      if (!d) throw notFound('Partida');
      return d;
    }),

  /** Sala da partida (pré-jogo). `opts` vem da fila ou do desafio de lobby. */
  room: (id, opts = {}) => request(() => genMatch(id, opts), { min: 200, max: 500 }),
};
