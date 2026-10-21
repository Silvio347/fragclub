import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App, { ROUTER_FUTURE } from '../App';

/** Simula usuário logado. `onboarded: false` mostra o tutorial de primeiro acesso. */
export function login({ onboarded = true } = {}) {
  localStorage.setItem('fc_session', JSON.stringify({ nick: 'silvio', email: 'a@b.com' }));
  if (onboarded) localStorage.setItem('fc_settings', JSON.stringify({ onboarded: true }));
}

export function renderApp(url) {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[url]} future={ROUTER_FUTURE}>
      <App />
    </MemoryRouter>,
  );
  return { user, ...utils };
}
