import { request } from './client';
import { genLobbies, genServers } from '../data/mock';

export const play = {
  /** Lista de lobbies abertos. `seed` muda a cada "Atualizar". */
  lobbies: (seed = 0) => request(() => genLobbies(`lobbies-${seed}`)),

  /** Servidores de Retake/DM. `refresh` simula a lotação mudando. */
  servers: (type, refresh = 0) =>
    request(() =>
      genServers(type).map((s, i) => ({
        ...s,
        players: refresh ? Math.max(0, Math.min(s.max, s.players + (((i * 7 + refresh * 3) % 5) - 2))) : s.players,
      })),
    ),
};
