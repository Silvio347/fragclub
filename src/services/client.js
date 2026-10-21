// Infra do "backend" mock: latência, erros HTTP-like e persistência em localStorage.
// Ao ligar a API real, só os módulos de serviço trocam `request(() => ...)` por fetch.

const IS_TEST = import.meta.env?.MODE === 'test';

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {string} [code]
   */
  constructor(message, status = 400, code = 'bad_request') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const notFound = (what = 'Recurso') => new ApiError(`${what} não encontrado.`, 404, 'not_found');
export const forbidden = (msg = 'Você não tem permissão para isso.') => new ApiError(msg, 403, 'forbidden');

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

function latency(min, max) {
  if (IS_TEST) return 0;
  return min + Math.random() * (max - min);
}

/**
 * Executa um handler como se fosse uma chamada de rede.
 * Sempre devolve uma cópia (a UI nunca muta o "banco").
 * @template T
 * @param {() => T} handler
 * @param {{ min?: number, max?: number }} [opts]
 * @returns {Promise<T>}
 */
export function request(handler, { min = 120, max = 420 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(
      () => {
        try {
          resolve(clone(handler()));
        } catch (e) {
          reject(e instanceof ApiError ? e : new ApiError(e?.message ?? 'Erro inesperado.', 500, 'internal'));
        }
      },
      latency(min, max),
    );
  });
}

/** Agenda um evento "do servidor" (ex.: capitão aceitando um pedido). */
export function schedule(fn, ms) {
  return setTimeout(fn, IS_TEST ? 0 : ms);
}

/** Persistência simples em localStorage. */
export const db = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      /* JSON inválido ou storage indisponível */
    }
    return typeof fallback === 'function' ? fallback() : clone(fallback);
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota/privado */
    }
    return value;
  },
  update(key, fallback, fn) {
    return db.set(key, fn(db.get(key, fallback)));
  },
};
