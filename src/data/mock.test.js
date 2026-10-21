import { describe, it, expect } from 'vitest';
import { getMatchHistory, getMatchDetails, getEloHistory, genMatch, ME, NICKS } from './mock';

describe('dados mock de partidas', () => {
  const history = getMatchHistory('silvio', 60);

  it('placares seguem o MR12 (13 no tempo normal, 16 na prorrogação)', () => {
    for (const m of history) {
      const [hi, lo] = [Math.max(m.scoreUs, m.scoreThem), Math.min(m.scoreUs, m.scoreThem)];
      if (hi === 13) expect(lo).toBeLessThanOrEqual(11);
      else {
        expect(hi).toBe(16);
        expect(lo).toBeGreaterThanOrEqual(12);
        expect(lo).toBeLessThanOrEqual(14);
      }
      expect(m.won).toBe(m.scoreUs > m.scoreThem);
    }
  });

  it('detalhes batem com o histórico (rounds, vencedor e linha do jogador)', () => {
    for (const h of history) {
      const d = getMatchDetails(h.id);
      const winsA = d.rounds.filter((r) => r.winner === 'A').length;
      expect(winsA).toBe(h.scoreUs);
      expect(d.rounds.length - winsA).toBe(h.scoreThem);
      expect(d.rounds.at(-1).winner).toBe(h.won ? 'A' : 'B');
      const me = d.teamA.players.find((p) => p.nick === 'silvio');
      expect(me).toMatchObject({ kills: h.kills, deaths: h.deaths, rating: h.rating });
      expect(d.teamA.players).toHaveLength(5);
      expect(d.teamB.players).toHaveLength(5);
    }
  });

  it('id inválido retorna null', () => {
    expect(getMatchDetails('lixo')).toBeNull();
  });

  it('gráfico de ELO termina no ELO atual', () => {
    const points = getEloHistory(ME, 20);
    expect(points).toHaveLength(21);
    expect(points.at(-1).elo).toBe(ME.elo);
  });

  it('sala da partida mantém a party no mesmo time e completa com 5x5 sem repetir jogador', () => {
    const match = genMatch('abc', { partyA: [{ nick: ME.nick }, { nick: NICKS[0] }] });
    const all = [...match.teamA.players, ...match.teamB.players].map((p) => p.nick);
    expect(match.teamA.players.map((p) => p.nick).slice(0, 2)).toEqual([ME.nick, NICKS[0]]);
    expect(new Set(all).size).toBe(10);
  });
});
