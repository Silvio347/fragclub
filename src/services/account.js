import { db, request, ApiError } from './client';

const KEY = 'fc_settings';
const SESSION_KEY = 'fc_session';

/**
 * @typedef {Object} AccountSettings
 * @property {{ team: boolean, friends: boolean, challenges: boolean, tournaments: boolean, shop: boolean, email: boolean }} notifications
 * @property {{ publicProfile: boolean, showOnline: boolean, invites: 'everyone'|'friends' }} privacy
 * @property {{ twoFactor: boolean }} security
 * @property {{ id: string, device: string, location: string, lastActive: string, current?: boolean }[]} sessions
 * @property {boolean} onboarded
 */

/** @returns {AccountSettings} */
const INITIAL = () => ({
  notifications: { team: true, friends: true, challenges: true, tournaments: true, shop: true, email: false },
  privacy: { publicProfile: true, showOnline: true, invites: 'everyone' },
  security: { twoFactor: false },
  sessions: [
    { id: 's1', device: 'Chrome · Linux', location: 'São Paulo, BR', lastActive: 'Agora', current: true },
    { id: 's2', device: 'App FragClub · Android', location: 'São Paulo, BR', lastActive: 'Há 2 dias' },
    { id: 's3', device: 'Firefox · Windows', location: 'Campinas, BR', lastActive: 'Há 9 dias' },
  ],
  onboarded: false,
});

const load = () => {
  const s = db.get(KEY, INITIAL);
  const base = INITIAL();
  return {
    ...base,
    ...s,
    notifications: { ...base.notifications, ...s.notifications },
    privacy: { ...base.privacy, ...s.privacy },
  };
};
const save = (s) => db.set(KEY, s);

// Qual preferência controla cada tipo de notificação (system sempre chega)
const PREF_BY_TYPE = {
  team_invite: 'team',
  team: 'team',
  friend_request: 'friends',
  friend: 'friends',
  challenge: 'challenges',
  tournament: 'tournaments',
  shop: 'shop',
  points: 'shop',
};

/** Usado pelo serviço de notificações para respeitar as preferências do usuário. */
export function allowsNotification(type) {
  const pref = PREF_BY_TYPE[type];
  return !pref || load().notifications[pref] !== false;
}

/** Usado pelo onboarding para saber se mostra o tutorial. */
export const isOnboarded = () => load().onboarded;

const session = () => {
  const s = db.get(SESSION_KEY, null);
  if (!s) throw new ApiError('Sessão expirada. Entre de novo.', 401, 'unauthorized');
  return s;
};

// Mock: qualquer senha com 6+ caracteres é "a senha atual"
const checkPassword = (pwd) => {
  if (!pwd || pwd.length < 6) throw new ApiError('Senha atual incorreta.', 403, 'wrong_password');
};

export const account = {
  /** @returns {Promise<AccountSettings>} */
  settings: () => request(load, { min: 80, max: 200 }),

  /** Atualiza um bloco de preferências (notifications | privacy). */
  update: (section, patch) =>
    request(
      () => {
        const s = load();
        if (!['notifications', 'privacy'].includes(section)) throw new ApiError('Seção inválida.');
        return save({ ...s, [section]: { ...s[section], ...patch } });
      },
      { min: 80, max: 200 },
    ),

  /** @returns {Promise<{ email: string }>} */
  changeEmail: ({ email, password }) =>
    request(() => {
      if (!/^\S+@\S+\.\S+$/.test(email ?? '')) throw new ApiError('Informe um e-mail válido.', 422, 'invalid_email');
      checkPassword(password);
      const s = session();
      db.set(SESSION_KEY, { ...s, email });
      return { email };
    }),

  changePassword: ({ current, next }) =>
    request(() => {
      checkPassword(current);
      if ((next ?? '').length < 8)
        throw new ApiError('A nova senha precisa ter pelo menos 8 caracteres.', 422, 'weak_password');
      if (next === current) throw new ApiError('A nova senha precisa ser diferente da atual.', 422, 'same_password');
      return { ok: true };
    }),

  /** Etapa 1 do 2FA: devolve o segredo para o app autenticador (mock). */
  start2fa: () => request(() => ({ secret: 'FRAG CLUB 4X7Q 9KLM', hint: 'Mock: use o código 123456' })),

  /** Etapa 2: confirma com o código de 6 dígitos. */
  confirm2fa: (code) =>
    request(() => {
      if (code !== '123456') throw new ApiError('Código inválido. Tente de novo.', 422, 'invalid_code');
      const s = load();
      return save({ ...s, security: { twoFactor: true } });
    }),

  disable2fa: (password) =>
    request(() => {
      checkPassword(password);
      const s = load();
      return save({ ...s, security: { twoFactor: false } });
    }),

  revokeSession: (id) =>
    request(() => {
      const s = load();
      const target = s.sessions.find((x) => x.id === id);
      if (target?.current) throw new ApiError('Use "Sair" para encerrar a sessão atual.', 409, 'current_session');
      return save({ ...s, sessions: s.sessions.filter((x) => x.id !== id) });
    }),

  completeOnboarding: (data = {}) =>
    request(() => save({ ...load(), onboarded: true, onboarding: data }), { min: 0, max: 100 }),

  /** Exclui a conta: apaga todos os dados locais do usuário. */
  deleteAccount: ({ confirmNick }) =>
    request(
      () => {
        const s = session();
        if (confirmNick !== s.nick)
          throw new ApiError('Digite seu nick exatamente para confirmar.', 422, 'confirm_mismatch');
        Object.keys(localStorage)
          .filter((k) => k.startsWith('fc_'))
          .forEach((k) => localStorage.removeItem(k));
        return { ok: true };
      },
      { min: 600, max: 900 },
    ),
};
