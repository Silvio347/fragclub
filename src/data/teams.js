import { seeded, pick, randInt, shuffle } from '../utils/random';
import { NICKS, MAPS, REGIONS, makePlayer } from './mock';

export const TEAM_ROLES = ['Capitão', 'Jogador', 'Reserva', 'Coach'];
export const TEAM_MAX = 7; // 5 titulares + reservas/coach
export const TEAM_COLORS = [
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#eab308',
  '#22c55e',
  '#a855f7',
];

const DEFS = [
  ['Os Brabos', 'BRB', 'Time focado em campeonatos de fim de semana. Treinos ter/qui à noite.'],
  ['Rush B Gaming', 'RBG', 'Agressivo, sem medo. Procurando AWPer fixo.'],
  ['Tryhard SP', 'THSP', 'Só level 8+. Comunicação em call obrigatória.'],
  ['Smoke Criminal', 'SMK', 'Utilitária primeiro, frag depois.'],
  ['Bonde do AWP', 'AWP', 'Dois AWPs, zero arrependimentos.'],
  ['Eco Forte', 'ECO', 'Time casual para jogar lobbies à noite.'],
  ['Clutch Kings', 'CLK', 'Vice da Copa Noturna #139. Buscando reserva.'],
  ['Mid Control', 'MID', 'Mapa preferido: Mirage. Jogamos todo dia.'],
  ['Sem Tilt eSports', 'STE', 'Ambiente tranquilo, foco em evoluir junto.'],
  ['Prefire Squad', 'PFS', 'Campeões da Liga Universitária 2025.'],
  ['Nuke Lovers', 'NUKE', 'Se não é Nuke, a gente veta.'],
  ['Last Round', 'LR', 'Time misto BR/AR, treinos em espanhol e português.'],
];

function teamMatches(rng, tag, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const won = rng() > 0.42;
    const lose = randInt(rng, 4, 11);
    return {
      id: `${tag}-${i}`,
      opponent: pick(rng, DEFS)[0],
      map: pick(rng, MAPS),
      won,
      scoreUs: won ? 13 : lose,
      scoreThem: won ? lose : 13,
      event: pick(rng, ['Lobby', 'Lobby', 'Copa Noturna', 'Masters']),
      daysAgo: i * 2 + randInt(rng, 0, 1),
    };
  });
}

// Times "de outras pessoas" para explorar (determinísticos)
export const PUBLIC_TEAMS = (() => {
  const rng = seeded('teams');
  const pool = shuffle(rng, NICKS.slice(9)); // evita conflito com a lista de amigos
  return DEFS.map(([name, tag, description], i) => {
    const size = randInt(rng, 4, 6);
    const nicks = pool.splice(0, size);
    while (nicks.length < size) nicks.push(pick(rng, NICKS));
    const members = nicks.map((nick, j) => ({
      nick,
      role: j === 0 ? 'Capitão' : j === 5 ? 'Reserva' : j === 4 && rng() > 0.6 ? 'Coach' : 'Jogador',
    }));
    const wins = randInt(rng, 8, 140);
    return {
      id: `team-${i}`,
      name,
      tag,
      description,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      region: pick(rng, REGIONS.slice(0, 3)),
      founded: 2019 + randInt(rng, 0, 6),
      recruiting: rng() > 0.35,
      minLevel: pick(rng, [1, 4, 6, 8]),
      wins,
      losses: randInt(rng, Math.round(wins * 0.5), Math.round(wins * 1.1)),
      trophies: randInt(rng, 0, 6),
      members,
      matches: teamMatches(rng, tag),
    };
  });
})();

export function teamStats(team, resolve = makePlayer) {
  const players = team.members.map((m) => resolve(m));
  const avgElo = players.length ? Math.round(players.reduce((s, p) => s + p.elo, 0) / players.length) : 0;
  const total = team.wins + team.losses;
  return { players, avgElo, winRate: total ? Math.round((team.wins / total) * 100) : 0, total };
}
