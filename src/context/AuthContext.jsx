import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ME } from '../data/mock';
import { api } from '../services';

const AuthCtx = createContext(null);

export const DEFAULT_PROFILE = {
  bio: '',
  country: 'BR',
  avatarHue: null,
  banner: 'default',
  socials: { steam: '', twitch: '', instagram: '', youtube: '' },
  tradeUrl: '',
  crosshair: '',
  publicHistory: true,
};

// Mock: dados da sessão são aplicados no perfil "ME" para o resto do app refletir
function applySession(session) {
  if (!session) return session;
  if (session.nick) ME.nick = session.nick;
  ME.premium = !!session.premium;
  ME.profile = {
    ...DEFAULT_PROFILE,
    ...session.profile,
    socials: { ...DEFAULT_PROFILE.socials, ...session.profile?.socials },
  };
  ME.country = ME.profile.country;
  return session;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => applySession(api.auth.storedSession()));

  // Toda ação devolve a sessão atualizada pelo serviço
  const apply = useCallback((session) => {
    setUser(applySession(session));
    return session;
  }, []);

  const login = useCallback((creds) => api.auth.login(creds).then(apply), [apply]);
  const loginWithSteam = useCallback(() => api.auth.loginWithSteam().then(apply), [apply]);
  const register = useCallback((data) => api.auth.register(data).then(apply), [apply]);
  const logout = useCallback(() => {
    setUser(null);
    return api.auth.logout();
  }, []);
  const subscribe = useCallback((planId) => api.auth.subscribe(planId).then(apply), [apply]);
  const cancelSubscription = useCallback(() => api.auth.cancelSubscription().then(apply), [apply]);
  const grantPremiumDays = useCallback((days) => api.auth.grantPremiumDays(days).then(apply), [apply]);
  const updateProfile = useCallback((data) => api.auth.updateProfile(data).then(apply), [apply]);

  const profile = user ? (ME.profile ?? DEFAULT_PROFILE) : DEFAULT_PROFILE;

  const value = useMemo(
    () => ({
      user,
      profile,
      login,
      loginWithSteam,
      register,
      logout,
      subscribe,
      cancelSubscription,
      grantPremiumDays,
      updateProfile,
    }),
    [
      user,
      profile,
      login,
      loginWithSteam,
      register,
      logout,
      subscribe,
      cancelSubscription,
      grantPremiumDays,
      updateProfile,
    ],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthOptional() {
  return useContext(AuthCtx);
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
