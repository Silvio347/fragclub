import { request } from './client';
import { RANKING, TOURNAMENTS } from '../data/mock';
import { PUBLIC_TEAMS } from '../data/teams';
import { myTeamsSync } from './teams';

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Começar com o termo vale mais que só conter
const score = (text, q) => {
  const t = norm(text);
  if (t.startsWith(q)) return 2;
  return t.includes(q) ? 1 : 0;
};

const top = (list, fn, q, n) =>
  list
    .map((x) => ({ x, s: fn(x, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.x);

export const search = {
  /**
   * Busca global (jogadores, times e campeonatos).
   * @returns {Promise<{ players: Object[], teams: Object[], tournaments: Object[] }>}
   */
  query: (raw) =>
    request(
      () => {
        const q = norm(raw.trim());
        if (q.length < 2) return { players: [], teams: [], tournaments: [] };
        const teamsById = new Map([...PUBLIC_TEAMS, ...myTeamsSync()].map((t) => [t.id, t]));
        return {
          players: top(RANKING, (p, x) => score(p.nick, x), q, 5).map((p) => ({
            nick: p.nick,
            level: p.level,
            elo: p.elo,
          })),
          teams: top([...teamsById.values()], (t, x) => Math.max(score(t.name, x), score(t.tag, x)), q, 4).map((t) => ({
            id: t.id,
            name: t.name,
            tag: t.tag,
            color: t.color,
            members: t.members.length,
          })),
          tournaments: top(TOURNAMENTS, (t, x) => score(t.name, x), q, 3).map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            prize: t.prize,
          })),
        };
      },
      { min: 60, max: 180 },
    ),
};
