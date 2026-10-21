import { seeded, pick, randInt, shuffle } from '../utils/random';
import { levelFromElo } from '../utils/levels';

// Pool competitivo (veto). Imagens em /public/maps
export const MAPS = [
  { id: 'mirage', name: 'Mirage', colors: ['#b8925a', '#3a2a17'] },
  { id: 'inferno', name: 'Inferno', colors: ['#c2683a', '#3a1a0d'] },
  { id: 'nuke', name: 'Nuke', colors: ['#4f8fb8', '#14273a'] },
  { id: 'ancient', name: 'Ancient', colors: ['#4f8a5d', '#14291a'] },
  { id: 'anubis', name: 'Anubis', colors: ['#b8a05a', '#332b14'] },
  { id: 'dust2', name: 'Dust II', colors: ['#c9a66e', '#47331a'] },
  { id: 'train', name: 'Train', colors: ['#7d838f', '#1f2228'] },
];

// Mapas extras usados nos servidores de Retake/DM
export const EXTRA_MAPS = [
  { id: 'overpass', name: 'Overpass', colors: ['#6f8f6a', '#1d2a1b'] },
  { id: 'vertigo', name: 'Vertigo', colors: ['#8aa0b8', '#1e2733'] },
];

export const ALL_MAPS = [...MAPS, ...EXTRA_MAPS];
export const MAPS_BY_ID = Object.fromEntries(ALL_MAPS.map((m) => [m.id, m]));

export const NICKS = [
  'kzinho',
  'zeroping',
  'brabo',
  'tchuco',
  'flashzin',
  'nadeking',
  'spraydown',
  'awpzera',
  'clutchz',
  'baianox',
  'r3dline',
  'xandao',
  'vrau',
  'pistolinha',
  'n1ghtz',
  'luk4s',
  'dedinho',
  'ecozera',
  'hsmachine',
  'smokey',
  'molotov',
  'rushb',
  'p4ulo',
  'tiltado',
  'gomesz',
  'fragzin',
  'deaglezin',
  'caiofps',
  'kngz',
  'ninjazin',
  'lurk3r',
  'entryfrag',
  'ratinho',
  'zezin',
  'k1ller',
  'b1tz',
  'mibr4ever',
  'tapzera',
  'onetap',
  'prefire',
  'sprayctrl',
  'boostado',
  'wallbang',
  'peekzera',
  'ninjadefuse',
  'ak47lover',
  'mid2b',
  'bananaboy',
];

const COUNTRIES = ['BR', 'BR', 'BR', 'BR', 'BR', 'AR', 'PT', 'CL'];
export const FLAGS = { BR: '🇧🇷', AR: '🇦🇷', PT: '🇵🇹', CL: '🇨🇱' };
export const REGIONS = ['São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Santiago'];

const round2 = (n) => Math.round(n * 100) / 100;

export function makePlayer(nick) {
  const rng = seeded(`player:${nick}`);
  const elo = randInt(rng, 850, 2750);
  // Jogadores com ELO maior tendem a ter métricas melhores
  const skill = (elo - 850) / 1900;
  const rating = round2(0.82 + skill * 0.38 + rng() * 0.16);
  return {
    nick,
    elo,
    level: levelFromElo(elo),
    rating,
    kd: round2(0.8 + skill * 0.45 + rng() * 0.2),
    kast: randInt(rng, 62, 70) + Math.round(skill * 8),
    adr: randInt(rng, 64, 76) + Math.round(skill * 16),
    roundSwing: round2((rating - 1) * 6 + (rng() - 0.5)),
    hs: randInt(rng, 32, 62),
    winRate: randInt(rng, 44, 52) + Math.round(skill * 9),
    matches: randInt(rng, 120, 2400),
    openingSuccess: randInt(rng, 42, 60),
    clutches: randInt(rng, 12, 140),
    multiKills: randInt(rng, 80, 900),
    utilityDmg: randInt(rng, 4, 14),
    flashAssists: round2(0.04 + rng() * 0.12),
    tradeKills: randInt(rng, 9, 22),
    country: pick(rng, COUNTRIES),
    memberSince: 2016 + randInt(rng, 0, 9),
    weeklyGain: randInt(rng, -120, 260),
    premium: rng() > 0.6,
  };
}

export const ME = {
  ...makePlayer('silvio'),
  nick: 'silvio',
  elo: 1824,
  level: levelFromElo(1824),
  rating: 1.12,
  kd: 1.18,
  kast: 73,
  adr: 81,
  roundSwing: 0.9,
  hs: 48,
  winRate: 54,
  matches: 732,
  openingSuccess: 53,
  clutches: 61,
  country: 'BR',
  memberSince: 2019,
  premium: true,
};

export function getPlayer(nick) {
  return nick === ME.nick ? ME : makePlayer(nick);
}

export const RANKING = [...NICKS.map(makePlayer), ME].sort((a, b) => b.elo - a.elo);

const STATUSES = [
  'online',
  'in-game',
  'online',
  'online',
  'in-game',
  'online',
  'offline',
  'online',
  'offline',
  'online',
  'offline',
  'online',
];
export const FRIENDS = NICKS.slice(0, STATUSES.length).map((nick, i) => ({
  ...makePlayer(nick),
  status: STATUSES[i],
  activity:
    STATUSES[i] === 'in-game'
      ? `Em partida · ${MAPS[i % MAPS.length].name}`
      : STATUSES[i] === 'online'
        ? 'Online'
        : 'Offline',
}));

export function getMatchHistory(nick, n = 15) {
  const rng = seeded(`history:${nick}`);
  return Array.from({ length: n }, (_, i) => {
    const won = rng() > 0.46;
    const overtime = rng() > 0.88;
    // MR12: 13 vence; prorrogação MR3 a partir de 12:12 termina 16:12, 16:13 ou 16:14
    const loserScore = overtime ? 12 + randInt(rng, 0, 2) : randInt(rng, 3, 11);
    const winnerScore = overtime ? 16 : 13;
    const rounds = winnerScore + loserScore;
    const kills = randInt(rng, Math.round(rounds * 0.45), Math.round(rounds * 1.25));
    const deaths = randInt(rng, Math.round(rounds * 0.5), Math.round(rounds * 0.95));
    const adr = randInt(rng, 55, 120);
    const kast = randInt(rng, 52, 90);
    const rating = Math.max(
      0.35,
      round2(1 + ((kills - deaths) / rounds) * 1.1 + (adr - 80) * 0.006 + (kast - 70) * 0.006 + (won ? 0.05 : -0.05)),
    );
    return {
      id: `${nick}-${i}`,
      map: pick(rng, MAPS),
      won,
      scoreUs: won ? winnerScore : loserScore,
      scoreThem: won ? loserScore : winnerScore,
      kills,
      deaths,
      assists: randInt(rng, 1, 9),
      hs: randInt(rng, 25, 70),
      adr,
      kast,
      rating,
      roundSwing: round2((rating - 1) * 7 + (rng() - 0.5)),
      eloDelta: won ? randInt(rng, 18, 32) : -randInt(rng, 16, 30),
      daysAgo: Math.floor(i * 0.7),
    };
  });
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function calcRating({ kills, deaths, adr, kast }, rounds, won) {
  return Math.max(
    0.35,
    round2(1 + ((kills - deaths) / rounds) * 1.1 + (adr - 80) * 0.006 + (kast - 70) * 0.006 + (won ? 0.05 : -0.05)),
  );
}

// Distribui um total entre n jogadores com pesos aleatórios
function distribute(rng, total, n, min, max) {
  const w = Array.from({ length: n }, () => 0.6 + rng() * 0.8);
  const sum = w.reduce((s, x) => s + x, 0);
  return w.map((x) => clamp(Math.round((total * x) / sum), min, max));
}

// Sequência de rounds válida (ninguém fecha antes do último round)
function buildRounds(rng, m) {
  const W = m.won ? 'A' : 'B';
  const L = m.won ? 'B' : 'A';
  const loserScore = Math.min(m.scoreUs, m.scoreThem);
  let seq;
  if (m.scoreUs + m.scoreThem <= 24 && Math.max(m.scoreUs, m.scoreThem) === 13) {
    seq = [...shuffle(rng, [...Array(12).fill(W), ...Array(loserScore).fill(L)]), W];
  } else {
    const ot = [...shuffle(rng, [...Array(3).fill(W), ...Array(loserScore - 12).fill(L)]), W];
    seq = [...shuffle(rng, [...Array(12).fill('A'), ...Array(12).fill('B')]), ...ot];
  }
  const firstSideA = rng() < 0.5 ? 'CT' : 'T';
  const other = firstSideA === 'CT' ? 'T' : 'CT';
  return seq.map((winner, i) => {
    const n = i + 1;
    let sideA;
    if (n <= 12) sideA = firstSideA;
    else if (n <= 24) sideA = other;
    else sideA = Math.floor((n - 25) / 3) % 2 === 0 ? firstSideA : other;
    const winnerSide = winner === 'A' ? sideA : sideA === 'CT' ? 'T' : 'CT';
    const r = rng();
    const end = winnerSide === 'T' ? (r < 0.62 ? 'elim' : 'bomb') : r < 0.6 ? 'elim' : r < 0.85 ? 'defuse' : 'time';
    return { n, winner, sideA, winnerSide, end };
  });
}

// Detalhes completos de uma partida do histórico. matchId = `${nick}-${indice}`
export function getMatchDetails(matchId) {
  const cut = matchId.lastIndexOf('-');
  const nick = matchId.slice(0, cut);
  const index = Number(matchId.slice(cut + 1));
  if (!nick || !Number.isInteger(index) || index < 0 || index > 300) return null;

  const m = getMatchHistory(nick, index + 1)[index];
  const rng = seeded(`details:${matchId}`);
  const rounds = m.scoreUs + m.scoreThem;
  const pool = shuffle(
    rng,
    NICKS.filter((n) => n !== nick),
  );
  const teamA = [getPlayer(nick), ...pool.slice(0, 4).map(makePlayer)];
  const teamB = pool.slice(4, 9).map(makePlayer);

  const base = (p, won) => {
    const kills = clamp(Math.round(rounds * (0.5 + (p.rating - 1) * 0.7 + rng() * 0.45)), 2, Math.round(rounds * 1.6));
    return {
      kills,
      assists: randInt(rng, 1, 9),
      adr: clamp(Math.round(48 + (kills / rounds) * 58 + rng() * 14), 25, 150),
      kast: clamp(randInt(rng, 56, 82) + (won ? 4 : -4), 35, 95),
      hs: randInt(rng, 25, 66),
    };
  };

  const linesA = teamA.map((p, i) =>
    i === 0 ? { kills: m.kills, assists: m.assists, adr: m.adr, kast: m.kast, hs: m.hs } : base(p, m.won),
  );
  const linesB = teamB.map((p) => base(p, !m.won));
  const killsA = linesA.reduce((s, l) => s + l.kills, 0);
  const killsB = linesB.reduce((s, l) => s + l.kills, 0);
  // Mortes de um time ≈ kills do outro (dono da partida mantém as mortes do histórico)
  const deathsB = distribute(rng, killsA, 5, 4, rounds);
  const deathsA = [m.deaths, ...distribute(rng, Math.max(16, killsB - m.deaths), 4, 4, rounds)];

  const finish = (players, lines, deaths, won) =>
    players
      .map((p, i) => {
        const l = { ...lines[i], deaths: deaths[i] };
        const isOwner = won === m.won && i === 0;
        const rating = isOwner ? m.rating : calcRating(l, rounds, won);
        return {
          nick: p.nick,
          level: p.level,
          elo: p.elo,
          ...l,
          rating,
          k2: Math.floor(l.kills / 6) + randInt(rng, 0, 2),
          k3: randInt(rng, 0, Math.floor(l.kills / 9)),
          k4: rng() < l.kills / 70 ? 1 : 0,
          k5: rng() < 0.025 ? 1 : 0,
          openingKills: randInt(rng, 0, Math.ceil(l.kills / 5)),
          openingDeaths: randInt(rng, 0, 4),
          clutches: rng() < rating - 0.75 ? randInt(rng, 1, 2) : 0,
          tradeKills: randInt(rng, 0, Math.ceil(l.kills / 4)),
          utilDmg: randInt(rng, 15, 60 + rounds * 8),
          enemiesFlashed: randInt(rng, 2, 26),
          flashAssists: randInt(rng, 0, 6),
          eloDelta: isOwner ? m.eloDelta : won ? randInt(rng, 18, 32) : -randInt(rng, 16, 30),
        };
      })
      .sort((a, b) => b.rating - a.rating);

  return {
    id: matchId,
    owner: nick,
    map: m.map,
    mode: 'Ranqueada 5v5',
    won: m.won,
    scoreUs: m.scoreUs,
    scoreThem: m.scoreThem,
    daysAgo: m.daysAgo,
    durationMin: Math.round(rounds * 1.7 + rng() * 6),
    server: pick(rng, MATCH_SERVERS),
    rounds: buildRounds(rng, m),
    teamA: { name: `time_${nick}`, players: finish(teamA, linesA, deathsA, m.won) },
    teamB: { name: `time_${teamB[0].nick}`, players: finish(teamB, linesB, deathsB, !m.won) },
  };
}

// Pontos do gráfico: [{ elo, match }] do mais antigo para o mais recente
export function getEloHistory(player, n = 20) {
  const history = getMatchHistory(player.nick, n);
  const points = [];
  let elo = player.elo;
  for (const m of history) {
    points.unshift({ elo, match: m });
    elo -= m.eloDelta;
  }
  points.unshift({ elo, match: null });
  return points;
}

export function getMapStats(nick) {
  const rng = seeded(`maps:${nick}`);
  return MAPS.map((map) => ({
    map,
    matches: randInt(rng, 8, 160),
    winRate: randInt(rng, 35, 72),
    rating: round2(0.85 + rng() * 0.45),
  })).sort((a, b) => b.matches - a.matches);
}

const MATCH_SERVERS = ['São Paulo #04', 'São Paulo #11', 'Rio de Janeiro #02', 'Buenos Aires #03'];

// Monta a partida. partyA/partyB vêm da fila ou do desafio de lobby; vagas faltando são completadas com randoms
export function genMatch(id, { partyA, partyB, teamBName, mode } = {}) {
  const rng = seeded(`match:${id}`);
  const a = partyA?.length ? partyA.map((p) => getPlayer(p.nick)) : [ME];
  const b = partyB?.length ? partyB.map((p) => getPlayer(p.nick)) : [];
  const used = new Set([...a, ...b].map((p) => p.nick));
  const fill = shuffle(
    rng,
    NICKS.filter((n) => !used.has(n)),
  ).map(makePlayer);
  while (a.length < 5) a.push(fill.shift());
  while (b.length < 5) b.push(fill.shift());
  const avg = (t) => Math.round(t.reduce((s, p) => s + p.elo, 0) / t.length);
  return {
    id,
    mode: mode ?? 'Ranqueada 5v5',
    server: pick(rng, MATCH_SERVERS),
    ip: `177.54.${randInt(rng, 140, 159)}.${randInt(rng, 2, 250)}:${pick(rng, [27015, 27016, 27025, 27035])}`,
    password: `fc${randInt(rng, 1000, 9999)}`,
    teamA: { name: `time_${a[0].nick}`, players: a, avgElo: avg(a) },
    teamB: { name: teamBName ?? `time_${b[0].nick}`, players: b, avgElo: avg(b) },
  };
}

const LOBBY_NAMES = [
  'Os Brabos',
  'Rush B Sem Medo',
  'Tryhard SP',
  'Só Tapa',
  'Mix 9+',
  'Bonde do AWP',
  'Eco Forte',
  'Jogando Sério',
  'Clutch ou Nada',
  'Smoke Criminal',
  'Galera do Mid',
  'Sem Tilt',
];

export function genLobbies(seed = 'lobbies') {
  const rng = seeded(seed);
  const pool = shuffle(rng, NICKS.slice(12));
  return LOBBY_NAMES.map((name, i) => {
    const size = randInt(rng, 2, 5);
    const players = pool.splice(0, size).map(makePlayer);
    while (players.length < size) players.push(makePlayer(pick(rng, NICKS)));
    const elos = players.map((p) => p.elo);
    const avgElo = Math.round(elos.reduce((s, e) => s + e, 0) / elos.length);
    return {
      id: `lobby-${i}`,
      name,
      players,
      avgElo,
      minLevel: Math.min(...players.map((p) => p.level)),
      maxLevel: Math.max(...players.map((p) => p.level)),
      region: pick(rng, REGIONS.slice(0, 3)),
      status: rng() > 0.8 ? 'playing' : 'waiting',
      createdMin: randInt(rng, 1, 25),
    };
  });
}

const SERVER_TAGS = {
  retake: ['Clássico', 'Pistolas', 'Full buy', 'Executes'],
  dm: ['Livre', 'Só HS', 'Pistolas', 'Rifles', 'AWP'],
};

export function genServers(type) {
  const rng = seeded(`servers:${type}`);
  const maps = type === 'dm' ? ALL_MAPS : [...MAPS, EXTRA_MAPS[0]];
  return Array.from({ length: 16 }, (_, i) => {
    const max = type === 'dm' ? pick(rng, [16, 20]) : pick(rng, [8, 10]);
    const region = pick(rng, REGIONS);
    const variant = pick(rng, SERVER_TAGS[type]);
    return {
      id: `${type}-${i}`,
      name: `FragClub ${type === 'dm' ? 'DM' : 'Retake'} #${String(i + 1).padStart(2, '0')} · ${variant}`,
      map: pick(rng, maps),
      variant,
      players: randInt(rng, 0, max),
      max,
      region,
      ping:
        region === 'São Paulo'
          ? randInt(rng, 6, 18)
          : region === 'Rio de Janeiro'
            ? randInt(rng, 12, 26)
            : randInt(rng, 38, 70),
      premium: rng() > 0.8,
      ip: `177.54.${randInt(rng, 160, 179)}.${randInt(rng, 2, 250)}:${27015 + i}`,
    };
  });
}

export const SERVER_VARIANTS = SERVER_TAGS;

export const TOURNAMENTS = [
  {
    id: 't1',
    name: 'FragClub Masters · Outubro',
    prize: 'R$ 10.000',
    format: '5v5 · Eliminação dupla',
    teams: 28,
    slots: 32,
    date: '26 out · 14h',
    status: 'open',
    minLevel: 8,
    colors: ['#7c3aed', '#1e1b4b'],
    map: 'mirage',
  },
  {
    id: 't2',
    name: 'Copa Noturna #142',
    prize: 'R$ 1.500',
    format: '5v5 · Eliminação simples',
    teams: 16,
    slots: 16,
    date: 'Hoje · 22h',
    status: 'live',
    minLevel: 4,
    colors: ['#be185d', '#3b0a24'],
    map: 'inferno',
  },
  {
    id: 't3',
    name: 'Wingman Cup',
    prize: 'R$ 800',
    format: '2v2 · Eliminação simples',
    teams: 41,
    slots: 64,
    date: '24 out · 19h',
    status: 'open',
    minLevel: 1,
    colors: ['#0e7490', '#082f49'],
    map: 'vertigo',
  },
  {
    id: 't4',
    name: 'Liga Universitária CS2',
    prize: 'R$ 5.000',
    format: '5v5 · Grupos + playoffs',
    teams: 12,
    slots: 24,
    date: '02 nov · 15h',
    status: 'open',
    minLevel: 1,
    colors: ['#4d7c0f', '#1a2e05'],
    map: 'ancient',
  },
  {
    id: 't5',
    name: 'Desafio Level 10',
    prize: 'R$ 3.000',
    format: '5v5 · Suíço',
    teams: 32,
    slots: 32,
    date: '19 out · 16h',
    status: 'finished',
    minLevel: 10,
    winner: 'time_onetap',
    colors: ['#a16207', '#2c1a03'],
    map: 'dust2',
  },
  {
    id: 't6',
    name: 'Copa Iniciante',
    prize: 'Skins + Premium',
    format: '5v5 · Eliminação simples',
    teams: 20,
    slots: 32,
    date: '25 out · 13h',
    status: 'open',
    minLevel: 1,
    colors: ['#6d28d9', '#170f2e'],
    map: 'anubis',
  },
];

export const MISSIONS = [
  { id: 'm1', title: 'Vença 3 partidas', progress: 2, goal: 3, reward: '+150 XP' },
  { id: 'm2', title: 'Faça 40 kills com AK-47', progress: 27, goal: 40, reward: '+100 XP' },
  { id: 'm3', title: 'Consiga 2 clutches 1vX', progress: 0, goal: 2, reward: '+200 XP' },
];
