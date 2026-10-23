import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './index';

const wait = (ms = 10) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  localStorage.setItem('fc_session', JSON.stringify({ nick: 'silvio', email: 'a@b.com' }));
});

describe('api.forum', () => {
  it('lista com fixados no topo e filtra por categoria e busca sem acento', async () => {
    const all = await api.forum.list();
    expect(all[0].pinned).toBe(true);
    const ajuda = await api.forum.list({ category: 'ajuda' });
    expect(ajuda.every((t) => t.category === 'ajuda')).toBe(true);
    const found = await api.forum.list({ q: 'calculo do elo' });
    expect(found.map((t) => t.title)).toContain('Como funciona o cálculo do ELO?');
    const unanswered = await api.forum.list({ sort: 'unanswered' });
    expect(unanswered.every((t) => t.replies === 0)).toBe(true);
  });

  it('valida título e texto', async () => {
    await expect(
      api.forum.create({ category: 'geral', title: 'curto', body: 'texto suficiente aqui' }),
    ).rejects.toMatchObject({ code: 'too_short' });
    await expect(
      api.forum.create({ category: 'xxx', title: 'Um título válido', body: 'texto suficiente aqui' }),
    ).rejects.toMatchObject({ code: 'invalid_category' });
  });

  it('cria tópico de ajuda, a equipe responde e o autor marca a solução', async () => {
    const t = await api.forum.create({
      category: 'ajuda',
      title: 'Não consigo resgatar skin',
      body: 'O botão de resgatar fica desabilitado.',
    });
    expect(t.mine).toBe(true);
    expect(t.author.nick).toBe('silvio');
    await wait();
    const withReply = await api.forum.get(t.id);
    expect(withReply.replies).toHaveLength(1);
    expect(withReply.replies[0].author.staff).toBe(true);
    const solved = await api.forum.markSolved(t.id, withReply.replies[0].id);
    expect(solved.solved).toBe(true);
    expect((await api.forum.list({ category: 'ajuda' })).find((x) => x.id === t.id).solved).toBe(true);
  });

  it('só o autor marca solução ou exclui o tópico', async () => {
    await expect(api.forum.markSolved('t2', 'r1-0')).rejects.toMatchObject({ status: 403 });
    await expect(api.forum.removeThread('t2')).rejects.toMatchObject({ status: 403 });
  });

  it('responder, curtir e excluir a própria resposta', async () => {
    let t = await api.forum.reply('t7', 'Train é o melhor mapa!');
    const mine = t.replies.at(-1);
    expect(mine.mine).toBe(true);
    t = await api.forum.like('t7', mine.id);
    expect(t.replies.at(-1)).toMatchObject({ liked: true, likes: 1 });
    t = await api.forum.like('t7');
    expect(t.liked).toBe(true);
    t = await api.forum.removeReply('t7', mine.id);
    expect(t.replies.some((r) => r.id === mine.id)).toBe(false);
  });

  it('tópico fechado não aceita resposta', async () => {
    await expect(api.forum.reply('t1', 'Opa, beleza?')).rejects.toMatchObject({ code: 'locked' });
  });

  it('get com view: false não conta visualização', async () => {
    const a = await api.forum.get('t3');
    const b = await api.forum.get('t3', { view: false });
    expect(b.views).toBe(a.views);
    expect((await api.forum.get('t3')).views).toBe(a.views + 1);
  });
});
