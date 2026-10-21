import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
const DURATION = 4000;
const MAX = 4;

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  /** @param {{ type?: 'success'|'error'|'info', title: string, body?: string }} t */
  const show = useCallback(
    (t) => {
      const id = `t${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
      setToasts((list) => [...list, { type: 'info', ...t, id }].slice(-MAX));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), t.type === 'error' ? DURATION + 2000 : DURATION),
      );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (title, body) => show({ type: 'success', title, body }),
      error: (title, body) => show({ type: 'error', title, body }),
      info: (title, body) => show({ type: 'info', title, body }),
    }),
    [show, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* Região viva: leitores de tela anunciam cada toast */}
      <div className="toasts" role="region" aria-label="Avisos" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] ?? Info;
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon size={18} aria-hidden="true" />
              <div className="toast-text">
                <strong>{t.title}</strong>
                {t.body && <span>{t.body}</span>}
              </div>
              <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}
