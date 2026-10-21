// Pub/sub que simula eventos empurrados pelo servidor (no futuro: WebSocket/SSE).
const listeners = new Map();

export const realtime = {
  /**
   * @param {string} event
   * @param {(payload: any) => void} cb
   * @returns {() => void} unsubscribe
   */
  on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => listeners.get(event)?.delete(cb);
  },
  emit(event, payload) {
    listeners.get(event)?.forEach((cb) => cb(payload));
  },
};
