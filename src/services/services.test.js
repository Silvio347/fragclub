import { describe, it, expect, beforeEach } from 'vitest';
import { api, ApiError, realtime } from './index';

const NEW_TEAM = {
  name: 'Time Teste',
  tag: 'TST',
  color: '#8b5cf6',
  region: 'São Paulo',
  description: '',
  recruiting: true,
  minLevel: 1,
};

beforeEach(() => {
  localStorage.setItem('fc_session', JSON.stringify({ nick: 'silvio', email: 'a@b.com' }));
});

describe('api.shop', () => {
  it('compra desconta pontos, vai para o inventário e gera notificação', async () => {
    const before = await api.shop.state();
    const after = await api.shop.buy('ak-slate');
    expect(after.points).toBe(before.points - 1800);
    expect(after.inventory[0]).toMatchObject({
      itemId: 'ak-slate',
      status: 'available',
      item: { name: 'AK-47 | Slate' },
    });
    const notifs = await api.notifications.list();
    expect(notifs[0].title).toBe('Compra concluída');
  });

  it('recusa compra sem saldo com erro 402', async () => {
    await expect(api.shop.buy('karambit-doppler')).rejects.toMatchObject({ status: 402 });
  });

  it('cosmético é único e só pode ser equipado se for seu', async () => {
    await expect(api.shop.toggleEquip('frame-neon')).rejects.toBeInstanceOf(ApiError);
    await api.shop.buy('frame-neon');
    await expect(api.shop.buy('frame-neon')).rejects.toMatchObject({ code: 'owned' });
    const s = await api.shop.toggleEquip('frame-neon');
    expect(s.equipped.frame).toBe('frame-neon');
  });

  it('resgate de skin exige link de troca', async () => {
    const s = await api.shop.buy('ak-slate');
    await expect(api.shop.redeem(s.inventory[0].uid, '')).rejects.toMatchObject({ code: 'trade_url_missing' });
    const ok = await api.shop.redeem(
      s.inventory[0].uid,
      'https://steamcommunity.com/tradeoffer/new/?partner=1&token=x',
    );
    expect(ok.inventory[0].status).toBe('redeeming');
  });

  it('recompensa diária só uma vez por dia', async () => {
    const s = await api.shop.claimDaily();
    expect(s.dailyAvailable).toBe(false);
    await expect(api.shop.claimDaily()).rejects.toMatchObject({ code: 'already_claimed' });
  });
});

describe('api.teams', () => {
  it('cria time com você como capitão e emite evento realtime', async () => {
    const events = [];
    const off = realtime.on('teams:changed', (s) => events.push(s));
    const { state, id } = await api.teams.create(NEW_TEAM);
    off();
    const team = state.myTeams.find((t) => t.id === id);
    expect(team.members).toEqual([{ me: true, role: 'Capitão' }]);
    expect(events).toHaveLength(1);
  });

  it('respeita o limite de 3 times', async () => {
    for (let i = 0; i < 3; i++) await api.teams.create({ ...NEW_TEAM, tag: `T${i}X` });
    await expect(api.teams.create(NEW_TEAM)).rejects.toMatchObject({ code: 'team_limit' });
  });

  it('só o capitão gerencia o time', async () => {
    const s = await api.teams.join('team-0'); // entra como Jogador
    expect(s.myTeams[0].members.find((m) => m.me).role).toBe('Jogador');
    await expect(api.teams.update('team-0', { name: 'Hack' })).rejects.toMatchObject({ status: 403 });
  });

  it('passar a capitania rebaixa o capitão atual', async () => {
    const { id } = await api.teams.create(NEW_TEAM);
    await api.teams.invite(id, 'kzinho');
    await new Promise((r) => setTimeout(r, 10)); // convite aceito pelo "servidor"
    const s = await api.teams.setRole(id, 'kzinho', 'Capitão');
    const t = s.myTeams.find((x) => x.id === id);
    expect(t.members.find((m) => m.me).role).toBe('Jogador');
    expect(t.members.find((m) => m.nick === 'kzinho').role).toBe('Capitão');
  });
});

describe('api.notifications', () => {
  it('marca todas como lidas', async () => {
    const list = await api.notifications.markAllRead();
    expect(list.every((n) => n.read)).toBe(true);
  });
});

describe('api.auth', () => {
  it('rejeita credenciais inválidas', async () => {
    await expect(api.auth.login({ email: 'x', password: '1' })).rejects.toMatchObject({ status: 401 });
  });

  it('não deixa trocar para um nick em uso', async () => {
    await expect(api.auth.updateProfile({ nick: 'kzinho' })).rejects.toMatchObject({ code: 'nick_taken' });
  });
});

describe('api.matches', () => {
  it('404 para partida inexistente', async () => {
    await expect(api.matches.details('nada')).rejects.toMatchObject({ status: 404 });
  });
});
