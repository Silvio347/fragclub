import { request } from './client';
import { getPlayer, getMatchHistory, getEloHistory, getMapStats, RANKING, ME, MISSIONS } from '../data/mock';
import { PUBLIC_TEAMS } from '../data/teams';

export const players = {
  /** @returns {Promise<import('../types').Player>} */
  get: (nick) => request(() => getPlayer(nick)),

  /**
   * Tudo que a página de perfil precisa numa chamada só.
   * @returns {Promise<{ player: import('../types').Player, history: import('../types').MatchSummary[], elo: { elo: number, match: import('../types').MatchSummary|null }[], maps: Object[], teams: import('../types').Team[] }>}
   */
  profile: (nick) =>
    request(() => {
      const player = getPlayer(nick);
      return {
        player,
        history: getMatchHistory(player.nick, 12),
        elo: getEloHistory(player, 20),
        maps: getMapStats(player.nick),
        teams: player.nick === ME.nick ? [] : PUBLIC_TEAMS.filter((t) => t.members.some((m) => m.nick === player.nick)),
      };
    }),

  /** @returns {Promise<{ player: import('../types').Player, matches: import('../types').MatchSummary[] }>} */
  history: (nick, limit = 60) => request(() => ({ player: getPlayer(nick), matches: getMatchHistory(nick, limit) })),

  /** @returns {Promise<import('../types').Player[]>} */
  ranking: () => request(() => RANKING),

  missions: () => request(() => MISSIONS, { min: 60, max: 160 }),
};
