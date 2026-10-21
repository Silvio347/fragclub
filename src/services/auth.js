import { db, request, ApiError } from './client';
import { NICKS, ME } from '../data/mock';

const KEY = 'fc_session';
const NICK_TAKEN = () => new ApiError('Esse nick já está em uso.', 409, 'nick_taken');

/**
 * @typedef {Object} Session
 * @property {string} nick
 * @property {string} email
 * @property {{ plan: string, since: string }|null} [premium]
 * @property {Object} [profile]
 */

const save = (s) => db.set(KEY, s);
const current = () => {
  const s = db.get(KEY, null);
  if (!s) throw new ApiError('Sessão expirada. Entre de novo.', 401, 'unauthorized');
  return s;
};

export const auth = {
  /** Leitura síncrona do "token" salvo, usada no boot do app. @returns {Session|null} */
  storedSession: () => db.get(KEY, null),

  /** Mock: aceita qualquer e-mail válido com senha de 6+ caracteres. @returns {Promise<Session>} */
  login: ({ email, password }) =>
    request(
      () => {
        if (!email?.includes('@') || (password ?? '').length < 6) {
          throw new ApiError('E-mail ou senha inválidos.', 401, 'invalid_credentials');
        }
        return save({ nick: ME.nick, email });
      },
      { min: 500, max: 800 },
    ),

  loginWithSteam: () => request(() => save({ nick: ME.nick, email: 'steam@fragclub.gg' }), { min: 700, max: 1000 }),

  register: ({ nick, email }) =>
    request(
      () => {
        if (NICKS.includes(nick.toLowerCase())) throw NICK_TAKEN();
        return save({ nick, email });
      },
      { min: 700, max: 1000 },
    ),

  logout: () => request(() => (localStorage.removeItem(KEY), null), { min: 0, max: 0 }),

  updateProfile: ({ nick, ...profile }) =>
    request(() => {
      const s = current();
      if (nick && nick !== s.nick && NICKS.includes(nick.toLowerCase())) throw NICK_TAKEN();
      return save({ ...s, nick: nick || s.nick, profile: { ...s.profile, ...profile } });
    }),

  /** Assinatura mock: nenhum pagamento real é processado. */
  subscribe: (planId) =>
    request(() => save({ ...current(), premium: { plan: planId, since: new Date().toISOString() } }), {
      min: 1100,
      max: 1500,
    }),

  cancelSubscription: () => request(() => save({ ...current(), premium: null })),

  /** Premium comprado com FragPoints (chamado após ativar o item na loja). */
  grantPremiumDays: (days) =>
    request(() => save({ ...current(), premium: { plan: `pontos-${days}d`, since: new Date().toISOString() } }), {
      min: 0,
      max: 0,
    }),
};
