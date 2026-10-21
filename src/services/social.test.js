import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './index';

const NEW_TEAM = {
  name: 'Time Teste',
  tag: 'TST',
  color: '#8b5cf6',
  region: 'São Paulo',
  description: '',
  recruiting: true,
  minLevel: 1,
};
const wait = (ms = 10) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  localStorage.setItem('fc_session', JSON.stringify({ nick: 'silvio', email: 'a@b.com' }));
});

describe('api.friends', () => {
  it('pedido enviado é aceito pelo outro jogador (evento do servidor)', async () => {
    const s = await api.friends.add('onetap');
    expect(s.outgoing.map((p) => p.nick)).toContain('onetap');
    await wait();
    const after = await api.friends.overview();
    expect(after.friends.map((p) => p.nick)).toContain('onetap');
    expect(after.outgoing).toHaveLength(0);
    expect(await api.friends.relation('onetap')).toBe('friend');
  });

  it('aceitar pedido recebido move para amigos', async () => {
    expect(await api.friends.relation('hsmachine')).toBe('incoming');
    const s = await api.friends.accept('hsmachine');
    expect(s.incoming).toHaveLength(0);
    expect(s.friends[0].nick).toBe('hsmachine');
  });

  it('sugestões não incluem amigos nem você', async () => {
    const list = await api.friends.suggestions();
    const friends = new Set((await api.friends.list()).map((f) => f.nick));
    expect(list.length).toBeGreaterThan(0);
    list.forEach((p) => {
      expect(friends.has(p.nick)).toBe(false);
      expect(p.nick).not.toBe('silvio');
    });
  });
});

describe('api.tournaments', () => {
  it('chaveamento do campeonato encerrado termina com o campeão registrado', async () => {
    const t = await api.tournaments.get('t5');
    expect(t.bracket.champion).toBe(t.winner);
    t.bracket.rounds.forEach((r, i) => expect(r.matches).toHaveLength(t.bracket.size / 2 ** (i + 1)));
  });

  it('campeonato ao vivo tem uma partida ao vivo e a 1ª fase completa', async () => {
    const t = await api.tournaments.get('t2');
    expect(t.bracket.rounds[0].matches.every((m) => m.status === 'done')).toBe(true);
    expect(t.bracket.rounds.flatMap((r) => r.matches).filter((m) => m.status === 'live')).toHaveLength(1);
  });

  it('inscrição exige capitão e elenco mínimo', async () => {
    const { id } = await api.teams.create(NEW_TEAM);
    await expect(api.tournaments.register('t6', id)).rejects.toMatchObject({ code: 'roster' });
    for (const nick of ['kzinho', 'zeroping', 'brabo', 'tchuco']) await api.teams.invite(id, nick);
    await wait();
    const t = await api.tournaments.register('t6', id);
    expect(t.myRegistration.teamName).toBe('Time Teste');
    expect(t.registered[0]).toBe('Time Teste');
    await expect(api.tournaments.register('t6', id)).rejects.toMatchObject({ code: 'already_registered' });
    const list = await api.tournaments.list();
    expect(list.find((x) => x.id === 't6').registered).toBe(true);
  });

  it('não permite inscrição em campeonato fechado', async () => {
    const { id } = await api.teams.create(NEW_TEAM);
    await expect(api.tournaments.register('t5', id)).rejects.toMatchObject({ code: 'closed' });
  });
});

describe('api.search', () => {
  it('encontra jogadores, times e campeonatos (sem acento e por prefixo)', async () => {
    const r = await api.search.query('copa');
    expect(r.tournaments.map((t) => t.name)).toEqual(expect.arrayContaining(['Copa Noturna #142', 'Copa Iniciante']));
    expect((await api.search.query('brab')).players[0].nick).toBe('brabo');
    expect((await api.search.query('liga universitaria')).tournaments).toHaveLength(1);
    expect(await api.search.query('a')).toEqual({ players: [], teams: [], tournaments: [] });
  });
});

describe('api.account', () => {
  it('preferência desligada impede a notificação', async () => {
    await api.account.update('notifications', { shop: false });
    const before = (await api.notifications.list()).length;
    await api.shop.claimDaily();
    expect((await api.notifications.list()).length).toBe(before);
  });

  it('2FA só ativa com o código certo', async () => {
    await expect(api.account.confirm2fa('000000')).rejects.toMatchObject({ code: 'invalid_code' });
    expect((await api.account.confirm2fa('123456')).security.twoFactor).toBe(true);
  });

  it('não encerra a sessão atual pela lista', async () => {
    await expect(api.account.revokeSession('s1')).rejects.toMatchObject({ code: 'current_session' });
    const s = await api.account.revokeSession('s2');
    expect(s.sessions.map((x) => x.id)).toEqual(['s1', 's3']);
  });

  it('excluir conta exige o nick e apaga os dados locais', async () => {
    await api.shop.buy('ak-slate');
    await expect(api.account.deleteAccount({ confirmNick: 'outro' })).rejects.toMatchObject({
      code: 'confirm_mismatch',
    });
    await api.account.deleteAccount({ confirmNick: 'silvio' });
    expect(Object.keys(localStorage).filter((k) => k.startsWith('fc_'))).toHaveLength(0);
  });
});
