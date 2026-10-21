import { db, request, ApiError, notFound } from './client';
import { grantPoints } from './shop';
import { getMatchDetails, genMatch, ME } from '../data/mock';

const REPORTS_KEY = 'fc_reports';
const FINISHED_KEY = 'fc_finished';

export const REPORT_REASONS = [
  { id: 'cheat', label: 'Trapaça (wallhack, aimbot)' },
  { id: 'toxic', label: 'Comportamento tóxico / ofensas' },
  { id: 'grief', label: 'Atrapalhando o time (griefing)' },
  { id: 'afk', label: 'AFK / abandonou a partida' },
  { id: 'smurf', label: 'Smurf / conta de outra pessoa' },
];

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

  /** Denúncia de jogador; uma por jogador por partida. */
  report: (matchId, { nick, reasons, comment = '' }) =>
    request(() => {
      if (!nick || nick === ME.nick) throw new ApiError('Escolha um jogador para denunciar.', 422, 'invalid_target');
      if (!reasons?.length) throw new ApiError('Marque pelo menos um motivo.', 422, 'no_reason');
      const all = db.get(REPORTS_KEY, []);
      if (all.some((r) => r.matchId === matchId && r.nick === nick)) {
        throw new ApiError(`Você já denunciou ${nick} nesta partida.`, 409, 'already_reported');
      }
      const report = {
        id: `r${Date.now()}`,
        matchId,
        nick,
        reasons,
        comment: comment.slice(0, 300),
        createdAt: Date.now(),
      };
      db.set(REPORTS_KEY, [report, ...all]);
      return report;
    }),

  /**
   * Fim de partida: credita FragPoints (vitória 120, derrota 40) e devolve o resumo.
   * Idempotente por partida.
   */
  finish: (matchId, { won, mapName }) =>
    request(() => {
      const done = db.get(FINISHED_KEY, {});
      if (done[matchId]) return done[matchId];
      const points = won ? 120 : 40;
      const eloDelta = won ? 25 : -22;
      grantPoints(points, `${won ? 'Vitória' : 'Derrota'} na ${mapName}. Pontos já disponíveis na loja.`);
      const summary = { matchId, won, points, eloDelta };
      db.set(FINISHED_KEY, { ...done, [matchId]: summary });
      return summary;
    }),
};
