import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Busca dados assíncronos com estados de loading/erro e refetch.
 * Ignora respostas que chegam depois de o componente desmontar ou das deps mudarem.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {any[]} deps
 * @returns {{ data: T|undefined, error: Error|null, loading: boolean, refetch: () => void, setData: (d: T) => void }}
 */
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current().then(
      (data) => alive && setState({ data, error: null, loading: false }),
      (error) => alive && setState({ data: undefined, error, loading: false }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, refetch, setData };
}
