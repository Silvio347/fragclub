import { createContext, useCallback, useContext, useState } from 'react';
import { ME, NICKS } from '../data/mock';

const STORAGE_KEY = 'fc_session';
const AuthCtx = createContext(null);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock: o nick logado é aplicado no perfil "ME" para o resto do app refletir
function applySession(session) {
  if (!session) return;
  if (session.nick) ME.nick = session.nick;
  ME.premium = !!session.premium;
}

function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    applySession(s);
    return s;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const persist = (session) => {
    applySession(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  };

  // Aceita qualquer e-mail/senha válidos (front-only)
  const login = useCallback(async ({ email, password }) => {
    await wait(700);
    if (!email.includes('@') || password.length < 6) throw new Error('E-mail ou senha inválidos.');
    persist({ nick: ME.nick, email });
  }, []);

  const loginWithSteam = useCallback(async () => {
    await wait(900);
    persist({ nick: ME.nick, email: 'steam@fragclub.gg' });
  }, []);

  const register = useCallback(async ({ nick, email }) => {
    await wait(900);
    if (NICKS.includes(nick.toLowerCase())) throw new Error('Esse nick já está em uso.');
    persist({ nick, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Assinatura mock: nenhum pagamento real é processado
  const subscribe = useCallback(
    async (planId) => {
      await wait(1400);
      persist({ ...user, premium: { plan: planId, since: new Date().toISOString() } });
    },
    [user],
  );

  const cancelSubscription = useCallback(() => {
    persist({ ...user, premium: null });
  }, [user]);

  return (
    <AuthCtx.Provider value={{ user, login, loginWithSteam, register, logout, subscribe, cancelSubscription }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
