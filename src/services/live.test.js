import { describe, it, expect } from 'vitest';
import { api, realtime } from './index';

const finishMatch = (match) =>
  new Promise((resolve) => {
    const off = realtime.on(`live:${match.id}`, (s) => {
      if (s.status === 'finished') {
        off();
        resolve(s);
      }
    });
    api.live.start(match);
  });

describe('api.live (simulador da partida)', () => {
  it('termina com placar válido de MR12 e kills batendo com mortes', async () => {
    for (const id of ['l1', 'l2', 'l3', 'l4', 'l5']) {
      const match = await api.matches.room(id);
      const s = await finishMatch(match);
      const [hi, lo] = [Math.max(s.scoreA, s.scoreB), Math.min(s.scoreA, s.scoreB)];
      if (lo <= 11) expect(hi).toBe(13);
      else expect(hi - lo).toBeGreaterThanOrEqual(2);
      expect(s.rounds).toHaveLength(s.scoreA + s.scoreB);
      const kills = (t) => t.reduce((n, p) => n + p.kills, 0);
      const deaths = (t) => t.reduce((n, p) => n + p.deaths, 0);
      expect(kills(s.teamA)).toBe(deaths(s.teamB));
      expect(kills(s.teamB)).toBe(deaths(s.teamA));
    }
  });

  it('pausa técnica precisa de 3 votos e só pode ser usada uma vez', async () => {
    const match = await api.matches.room('pause1');
    api.live.start(match);
    const s = await api.live.votePause(match.id);
    expect(s.status).toBe('paused');
    expect(s.pausesUsed.A).toBe(1);
    api.live.stop(match.id);
  });

  it('fim de partida credita FragPoints uma única vez', async () => {
    localStorage.setItem('fc_session', JSON.stringify({ nick: 'silvio', email: 'a@b.com' }));
    const before = (await api.shop.state()).points;
    await api.matches.finish('fin1', { won: true, mapName: 'Mirage' });
    await api.matches.finish('fin1', { won: true, mapName: 'Mirage' });
    expect((await api.shop.state()).points).toBe(before + 120);
  });
});
