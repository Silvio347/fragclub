import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { login, renderApp } from './test/utils';

describe('rotas (smoke)', () => {
  it('landing abre sem login', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: /CS2 competitivo/i })).toBeInTheDocument();
  });

  it('rota protegida sem sessão manda para o login (carregado sob demanda)', async () => {
    renderApp('/inicio');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it.each([
    ['/inicio', /Bem-vindo de volta/i],
    ['/jogar', /Sua party/i],
    ['/times', /Explorar times/i],
    ['/loja', /Seu saldo/i],
    ['/ranking', /Ranking CS2/i],
    ['/perfil/silvio', /Evolução de ELO/i],
    ['/partidas/silvio-0', /Rounds/i],
    ['/amigos', /Em partida/i],
    ['/campeonatos/t2', /Copa Noturna #142/i],
    ['/configuracoes', /Novo e-mail/i],
  ])('logado, %s renderiza', async (url, text) => {
    login();
    renderApp(url);
    expect((await screen.findAllByText(text))[0]).toBeInTheDocument();
  });
});
