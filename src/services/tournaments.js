import { db, request, ApiError, notFound, forbidden } from './client';
import { pushNotification } from './notifications';
import { myTeamsSync, myRoleIn } from './teams';
import { TOURNAMENTS, MAPS, ME } from '../data/mock';
import { PUBLIC_TEAMS } from '../data/teams';
import { seeded, pick, randInt, shuffle } from '../utils/random';

const KEY = 'fc_tournaments';
const load = () => db.get(KEY, { registrations: {} });
const save = (s) => db.set(KEY, s);

const EXTRA_NAMES = [
  'Headshot Hunters',
  'Pixel Perfect',
  'Zona de Fumaça',
  'Retake Masters',
  'Five Stack BR',
  'Molotov Gang',
  'Spray Control',
  'Bomb Planters',
  'Os Ecos',
  'Flash Bang Squad',
  'Nada a Perder',
  'Ninja Defusers',
  'Time do Bairro',
  'Peek Brothers',
  'AWP Kings',
  'Força Tática',
  'Round Zero',
  'Last Stand',
  'Mid Lords',
  'Clutch City',
];

function registeredNames(t, extraTeam) {
  const rng = seeded(`t-teams:${t.id}`);
  const pool = shuffle(rng, [...PUBLIC_TEAMS.map((x) => x.name), ...EXTRA_NAMES]);
  const names = Array.from(
    { length: t.teams },
    (_, i) => pool[i % pool.length] + (i >= pool.length ? ` ${Math.floor(i / pool.length) + 1}` : ''),
  );
  return extraTeam ? [extraTeam, ...names] : names;
}

const ROUND_NAMES = {
  16: ['Oitavas', 'Quartas', 'Semifinal', 'Final'],
  8: ['Quartas', 'Semifinal', 'Final'],
  4: ['Semifinal', 'Final'],
};

/** Chaveamento de eliminação simples (até 16 times exibidos). */
function buildBracket(t, teams) {
  const size = teams.length >= 16 ? 16 : teams.length >= 8 ? 8 : 4;
  const rng = seeded(`bracket:${t.id}`);
  const seededTeams = shuffle(rng, teams).slice(0, size);
  if (t.winner && !seededTeams.includes(t.winner)) seededTeams[0] = t.winner;
  const names = ROUND_NAMES[size];
  const rounds = [];
  let current = seededTeams.map((name) => ({ name }));
  // open: ninguém jogou; live: 1ª fase completa e 2ª em andamento; finished: tudo jogado
  const played = t.status === 'finished' ? names.length : t.status === 'live' ? 1 : 0;

  names.forEach((roundName, r) => {
    const matches = [];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      const isFinal = r === names.length - 1;
      let status = 'pending';
      if (r < played) status = 'done';
      else if (r === played && t.status === 'live' && i === 0) status = 'live';
      const known = a?.name && b?.name;
      let winner = null;
      let scoreA = null;
      let scoreB = null;
      if (status === 'done' && known) {
        // O campeão registrado no evento vence todas as partidas que joga
        if (t.winner && a.name === t.winner) winner = 'a';
        else if (t.winner && b.name === t.winner) winner = 'b';
        else winner = rng() > 0.5 ? 'a' : 'b';
        const lose = isFinal ? randInt(rng, 0, 1) : randInt(rng, 3, 11);
        const win = isFinal ? 2 : 13;
        [scoreA, scoreB] = winner === 'a' ? [win, lose] : [lose, win];
      } else if (status === 'live' && known) {
        scoreA = randInt(rng, 4, 11);
        scoreB = randInt(rng, 4, 11);
      }
      matches.push({
        id: `${t.id}-r${r}-m${i / 2}`,
        a: { name: a?.name ?? null, score: scoreA },
        b: { name: b?.name ?? null, score: scoreB },
        status: known ? status : 'pending',
        winner,
        bestOf: isFinal ? 3 : 1,
        map: pick(rng, MAPS).name,
      });
      next.push(winner ? (winner === 'a' ? a : b) : { name: null });
    }
    rounds.push({ name: roundName, matches });
    current = next;
  });
  const final = rounds.at(-1).matches[0];
  const champion = final.winner ? final[final.winner].name : null;
  return { size, rounds, champion };
}

function prizes(t) {
  const total = Number(String(t.prize).replace(/\D/g, ''));
  if (!total)
    return [
      { place: '1º lugar', value: t.prize },
      { place: '2º lugar', value: 'Premium 30 dias' },
      { place: '3º–4º', value: '5.000 FragPoints' },
    ];
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return [
    { place: '1º lugar', value: fmt(total * 0.5) },
    { place: '2º lugar', value: fmt(total * 0.25) },
    { place: '3º–4º', value: `${fmt(total * 0.125)} cada` },
  ];
}

function rules(t) {
  const two = t.format.startsWith('2v2');
  return [
    `Times de ${two ? '2' : '5'} jogadores titulares${two ? '' : ' + até 2 reservas'}.`,
    `Level mínimo ${t.minLevel} para todos os jogadores inscritos.`,
    'Partidas MR12 em melhor de 1; final em melhor de 3.',
    'Veto de mapas na sala da partida, pool competitivo atual.',
    'Check-in obrigatório 30 minutos antes do início.',
    'Anti-cheat FragClub obrigatório. W.O. após 15 minutos de atraso.',
  ];
}

function details(t) {
  const reg = load().registrations[t.id];
  const myTeam = reg ? myTeamsSync().find((x) => x.id === reg) : null;
  const teams = registeredNames(t, myTeam?.name);
  return {
    ...t,
    teams: teams.length,
    registered: teams,
    myRegistration: myTeam ? { teamId: myTeam.id, teamName: myTeam.name } : null,
    bracket: buildBracket(t, teams),
    prizes: prizes(t),
    rules: rules(t),
    schedule: [
      { label: 'Fim das inscrições', when: `${t.date.split('·')[0].trim()} · 1h antes` },
      { label: 'Check-in', when: `${t.date.split('·')[0].trim()} · 30 min antes` },
      { label: 'Início', when: t.date },
    ],
  };
}

export const tournaments = {
  /** @returns {Promise<import('../types').Tournament[]>} */
  list: () =>
    request(() => {
      const regs = load().registrations;
      return TOURNAMENTS.map((t) => ({ ...t, teams: t.teams + (regs[t.id] ? 1 : 0), registered: !!regs[t.id] }));
    }),

  /** Campeonato com chaveamento, times inscritos, regras e premiação. */
  get: (id) =>
    request(() => {
      const t = TOURNAMENTS.find((x) => x.id === id);
      if (!t) throw notFound('Campeonato');
      return details(t);
    }),

  /** Inscreve um time seu (você precisa ser o capitão). */
  register: (id, teamId) =>
    request(() => {
      const t = TOURNAMENTS.find((x) => x.id === id);
      if (!t) throw notFound('Campeonato');
      if (t.status !== 'open') throw new ApiError('As inscrições estão fechadas.', 409, 'closed');
      const s = load();
      if (s.registrations[id])
        throw new ApiError('Você já inscreveu um time neste campeonato.', 409, 'already_registered');
      if (t.teams >= t.slots) throw new ApiError('Não há mais vagas.', 409, 'full');
      if (ME.level < t.minLevel) throw new ApiError(`Este campeonato exige level ${t.minLevel}.`, 403, 'level');
      const team = myTeamsSync().find((x) => x.id === teamId);
      if (!team) throw notFound('Time');
      if (myRoleIn(team) !== 'Capitão') throw forbidden('Só o capitão pode inscrever o time.');
      const needed = t.format.startsWith('2v2') ? 2 : 5;
      if (team.members.length < needed) {
        throw new ApiError(
          `O time precisa de pelo menos ${needed} jogadores (tem ${team.members.length}).`,
          422,
          'roster',
        );
      }
      save({ ...s, registrations: { ...s.registrations, [id]: teamId } });
      pushNotification({
        type: 'tournament',
        title: 'Inscrição confirmada',
        body: `${team.name} está inscrito no ${t.name}.`,
        link: `/campeonatos/${id}`,
      });
      return details(t);
    }),

  unregister: (id) =>
    request(() => {
      const t = TOURNAMENTS.find((x) => x.id === id);
      if (!t) throw notFound('Campeonato');
      const s = load();
      const { [id]: _removed, ...rest } = s.registrations;
      save({ ...s, registrations: rest });
      return details(t);
    }),
};
