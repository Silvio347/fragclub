import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { login, renderApp } from './test/utils';

// Fluxos principais de ponta a ponta (UI + contextos + serviços mock)
describe('fluxos', () => {
  it('compra na loja: confirma, desconta o saldo e avisa com toast', async () => {
    login();
    const { user } = renderApp('/loja');
    const card = (await screen.findByRole('heading', { name: 'AK-47 | Slate' })).closest('article');
    await user.click(within(card).getByRole('button', { name: 'Comprar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar compra' });
    await user.click(within(dialog).getByRole('button', { name: /Confirmar compra/ }));
    expect(await screen.findByRole('dialog', { name: 'Compra concluída' })).toBeInTheDocument();
    // 4.850 - 1.800
    expect(screen.getAllByText(/3\.050/).length).toBeGreaterThan(0);
    expect(await screen.findByText('AK-47 | Slate foi para o seu inventário.')).toBeInTheDocument();
  });

  it('criação de time leva para a página do time com você como capitão', async () => {
    login();
    const { user } = renderApp('/times');
    await user.click(await screen.findByRole('button', { name: /Criar time/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Criar time' });
    await user.type(within(dialog).getByLabelText('Nome'), 'Os Testadores');
    await user.type(within(dialog).getByLabelText('Tag'), 'tst');
    await user.click(within(dialog).getByRole('button', { name: 'Criar time' }));
    expect(await screen.findByRole('heading', { level: 1, name: /Os Testadores/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desfazer time/ })).toBeInTheDocument();
    expect(screen.getByText('Time criado')).toBeInTheDocument();
  });

  it('formulário de time valida nome e tag', async () => {
    login();
    const { user } = renderApp('/times');
    await user.click(await screen.findByRole('button', { name: /Criar time/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Criar time' });
    await user.click(within(dialog).getByRole('button', { name: 'Criar time' }));
    expect(within(dialog).getByText(/entre 3 e 24 caracteres/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2 a 5 letras/)).toBeInTheDocument();
  });

  it('veto de mapas: você bane um mapa no seu turno', async () => {
    login();
    const { user } = renderApp('/partida/teste123');
    await user.click(await screen.findByRole('button', { name: 'Banir Mirage' }));
    expect(screen.getByRole('button', { name: 'Mirage banido' })).toBeDisabled();
    // o capitão adversário responde com o próximo ban e a vez volta para você
    await waitFor(() => expect(screen.getAllByRole('button', { name: / banido$/ })).toHaveLength(2));
    expect(screen.getByText('Sua vez de banir')).toBeInTheDocument();
  });

  it('notificações: abrir o sino e marcar todas como lidas zera o contador', async () => {
    login();
    const { user } = renderApp('/inicio');
    await user.click(await screen.findByRole('button', { name: /Notificações \(3 novas\)/ }));
    await user.click(screen.getByRole('button', { name: 'Marcar todas como lidas' }));
    expect(await screen.findByRole('button', { name: 'Notificações' })).toBeInTheDocument();
  });

  it('busca global: digitar, navegar com teclado e abrir o resultado', async () => {
    login();
    const { user } = renderApp('/inicio');
    const input = await screen.findByRole('combobox', { name: 'Buscar' });
    await user.type(input, 'copa noturna');
    expect(await screen.findByRole('option', { name: /Copa Noturna #142/ })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Copa Noturna #142' })).toBeInTheDocument();
  });

  it('onboarding aparece no primeiro acesso e some depois de concluído', async () => {
    login({ onboarded: false });
    const { user } = renderApp('/inicio');
    const dialog = await screen.findByRole('dialog', { name: /Bem-vindo ao FragClub/ });
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }));
    await user.click(within(dialog).getByRole('radio', { name: 'AWPer' }));
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Explorar o app' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem('fc_settings'))).toMatchObject({
      onboarded: true,
      onboarding: { role: 'awp' },
    });
  });

  it('navegação mobile: "Mais" abre a gaveta com o resto das páginas', async () => {
    login();
    const { user } = renderApp('/inicio');
    await user.click(await screen.findByRole('button', { name: 'Mais' }));
    const sheet = screen.getByRole('dialog', { name: 'Mais opções' });
    await user.click(within(sheet).getByRole('link', { name: 'Configurações' }));
    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Mais opções' })).not.toBeInTheDocument();
  });

  it('partida ao vivo: termina, credita FragPoints e permite denunciar', async () => {
    login();
    const { user } = renderApp('/partida/live1');
    // veto completo: você bane nos seus turnos, o adversário bane sozinho
    await screen.findByRole('button', { name: 'Banir Mirage' });
    for (let i = 0; i < 3; i++) {
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /^Banir / }).some((b) => !b.disabled)).toBe(true),
      );
      await user.click(screen.getAllByRole('button', { name: /^Banir / }).find((b) => !b.disabled));
    }
    await user.click(await screen.findByRole('button', { name: /Já entrei no servidor/ }, { timeout: 3000 }));
    expect(await screen.findByText(/Vitória!|Derrota/, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(await screen.findByText(/\+(120|40) FP/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Denunciar/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Denunciar jogador' });
    const select = within(dialog).getByLabelText('Jogador');
    await user.selectOptions(select, select.querySelectorAll('option')[1]);
    await user.click(within(dialog).getByRole('checkbox', { name: /Trapaça/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Enviar denúncia' }));
    expect(await screen.findByText('Denúncia enviada')).toBeInTheDocument();
  }, 30000);
});
