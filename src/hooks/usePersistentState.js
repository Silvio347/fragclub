import { useEffect, useState } from 'react';

// useState que persiste em localStorage (mock de backend)
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      /* storage indisponível ou JSON inválido: usa o inicial */
    }
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignora quota/privado */
    }
  }, [key, value]);

  return [value, setValue];
}
