// Feed "ao vivo" da partida. No produto real isso viria do servidor de jogo
// (GOTV/plugin) via WebSocket; aqui um simulador emite um round a cada intervalo.
import { realtime } from './realtime';
import { ME } from '../data/mock';

const IS_TEST = import.meta.env?.MODE === 'test';
const ROUND_MS = IS_TEST ? 5 : 2600;
const PAUSE_SECONDS = 30;
const VOTES_NEEDED = 3;

const sessions = new Map();

const pickWeighted = (players, weight) => {
  const total = players.reduce((s, p) => s + weight(p), 0);
  let r = Math.random() * total;
  for (const p of players) {
    r -= weight(p);
    if (r <= 0) return p;
  }
  return players[players.length - 1];
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function initial(match) {
  const line = (p) => ({ nick: p.nick, level: p.level, kills: 0, deaths: 0, assists: 0, damage: 0 });
  return {
    id: match.id,
    round: 0,
    scoreA: 0,
    scoreB: 0,
    half: 1,
    rounds: [],
    teamA: match.teamA.players.map(line),
    teamB: match.teamB.players.map(line),
    status: 'live', // live | paused | finished
    pause: null, // { left, by }
    pauseVote: null, // { votes, needed }
    pausesUsed: { A: 0, B: 0 },
    winner: null,
    feed: [],
  };
}

// Um round: o time vencedor faz de 3 a 5 kills; ELO médio dá uma leve vantagem
function playRound(state, match) {
  const eloDiff = match.teamA.avgElo - match.teamB.avgElo;
  const pA = Math.min(0.7, Math.max(0.3, 0.5 + eloDiff / 4000));
  const winner = Math.random() < pA ? 'A' : 'B';
  const [W, L] = winner === 'A' ? [state.teamA, state.teamB] : [state.teamB, state.teamA];
  const ratingOf = (team) => (p) => (match[team].players.find((x) => x.nick === p.nick)?.rating ?? 1) ** 2;
  const wTeam = winner === 'A' ? 'teamA' : 'teamB';
  const lTeam = winner === 'A' ? 'teamB' : 'teamA';

  const winKills = randInt(3, 5);
  const loseKills = randInt(0, Math.min(4, winKills));
  const aliveL = [...L];
  const aliveW = [...W];
  const feed = [];

  for (let i = 0; i < winKills && aliveL.length; i++) {
    const killer = pickWeighted(W, ratingOf(wTeam));
    const victim = aliveL.splice(randInt(0, aliveL.length - 1), 1)[0];
    killer.kills += 1;
    killer.damage += randInt(90, 140);
    victim.deaths += 1;
    if (Math.random() < 0.35) W[randInt(0, W.length - 1)].assists += 1;
    feed.push({ killer: killer.nick, victim: victim.nick });
  }
  for (let i = 0; i < loseKills && aliveW.length > 1; i++) {
    const killer = pickWeighted(L, ratingOf(lTeam));
    const victim = aliveW.splice(randInt(0, aliveW.length - 1), 1)[0];
    killer.kills += 1;
    killer.damage += randInt(90, 140);
    victim.deaths += 1;
    feed.push({ killer: killer.nick, victim: victim.nick });
  }
  // Dano sem kill
  [...W, ...L].forEach((p) => (p.damage += randInt(0, 40)));

  state.round += 1;
  if (winner === 'A') state.scoreA += 1;
  else state.scoreB += 1;
  state.half = state.round < 12 ? 1 : state.round < 24 ? 2 : 3;
  state.rounds.push({ n: state.round, winner });
  state.feed = feed.slice(-5);

  // MR12: 13 vence; de 12:12 em diante, prorrogação até 16 (ou 4 de vantagem em blocos de 6)
  const { scoreA: a, scoreB: b } = state;
  const ot = a >= 12 && b >= 12;
  const target = ot ? 16 + Math.floor((Math.min(a, b) - 12) / 3) * 3 : 13;
  if ((a >= target || b >= target) && Math.abs(a - b) >= (ot ? 2 : 1)) {
    state.status = 'finished';
    state.winner = a > b ? 'A' : 'B';
  }
}

function emit(s) {
  realtime.emit(`live:${s.state.id}`, structuredClone(s.state));
}

function tick(s) {
  if (s.state.status === 'finished') return stop(s.state.id);
  if (s.state.status === 'paused') {
    s.state.pause.left -= ROUND_MS / 1000;
    if (s.state.pause.left <= 0) {
      s.state.status = 'live';
      s.state.pause = null;
    }
  } else {
    playRound(s.state, s.match);
  }
  emit(s);
  if (s.state.status === 'finished') stop(s.state.id);
}

function stop(id) {
  const s = sessions.get(id);
  if (s) clearInterval(s.timer);
}

export const live = {
  /**
   * Começa (ou retoma) o feed da partida e devolve o estado atual.
   * Eventos chegam por realtime.on(`live:${id}`).
   */
  start(match) {
    let s = sessions.get(match.id);
    if (!s) {
      s = { match, state: initial(match), timer: null };
      sessions.set(match.id, s);
    }
    if (s.state.status !== 'finished') {
      clearInterval(s.timer);
      s.timer = setInterval(() => tick(s), ROUND_MS);
    }
    return structuredClone(s.state);
  },

  stop,

  /** Votação de pausa técnica do seu time (precisa de 3 votos de 5). */
  votePause(id) {
    const s = sessions.get(id);
    if (!s || s.state.status !== 'live') return Promise.reject(new Error('A partida não está em andamento.'));
    if (s.state.pausesUsed.A >= 1) return Promise.reject(new Error('Seu time já usou a pausa técnica.'));
    if (s.state.pauseVote) return Promise.resolve(structuredClone(s.state));
    s.state.pauseVote = { votes: 1, needed: VOTES_NEEDED };
    emit(s);
    // Companheiros votam em sequência (mock: sempre aprovam)
    return new Promise((resolve) => {
      let n = 1;
      const step = () => {
        n += 1;
        s.state.pauseVote = { votes: n, needed: VOTES_NEEDED };
        if (n >= VOTES_NEEDED) {
          s.state.pauseVote = null;
          s.state.pausesUsed.A += 1;
          s.state.status = 'paused';
          s.state.pause = { left: PAUSE_SECONDS, by: ME.nick };
          emit(s);
          resolve(structuredClone(s.state));
          return;
        }
        emit(s);
        setTimeout(step, IS_TEST ? 0 : 700);
      };
      setTimeout(step, IS_TEST ? 0 : 700);
    });
  },
};
