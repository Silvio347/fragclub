import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Bloco cinza animado usado nos esqueletos de carregamento. */
export function Skeleton({ w = '100%', h = 16, r = 8, className = '' }) {
  return (
    <span className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
  );
}

/** Esqueletos de página prontos para os layouts mais comuns. */
export function PageSkeleton({ variant = 'list', rows = 6 }) {
  return (
    <div className="page stack skeleton-page" role="status" aria-label="Carregando">
      {variant === 'profile' && (
        <div className="card skeleton-hero">
          <Skeleton h={120} r={10} />
          <div className="row gap-sm" style={{ padding: '0 18px 18px' }}>
            <Skeleton w={96} h={96} r={48} />
            <div className="stack" style={{ flex: 1, gap: 8 }}>
              <Skeleton w="40%" h={24} />
              <Skeleton w="60%" />
            </div>
          </div>
        </div>
      )}
      {variant !== 'profile' && <Skeleton w={220} h={30} />}
      {variant === 'cards' ? (
        <div className="skeleton-cards">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="card stack" style={{ gap: 10 }}>
              <Skeleton h={110} r={10} />
              <Skeleton w="70%" />
              <Skeleton w="40%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="card stack" style={{ gap: 10 }}>
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} h={48} r={8} />
          ))}
        </div>
      )}
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const notFound = error?.status === 404;
  return (
    <div className="card error-state" role="alert">
      <AlertTriangle size={28} aria-hidden="true" />
      <strong>{notFound ? 'Não encontrado' : 'Algo deu errado'}</strong>
      <p className="muted small">{error?.message ?? 'Tente novamente em instantes.'}</p>
      {onRetry && !notFound && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" /> Tentar de novo
        </button>
      )}
    </div>
  );
}

/**
 * Renderiza loading/erro/sucesso de um `useQuery`.
 * @param {{ query: ReturnType<typeof import('../hooks/useQuery').useQuery>, skeleton?: import('react').ReactNode, children: (data: any) => import('react').ReactNode }} props
 */
export function Async({ query, skeleton, children }) {
  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (query.data === undefined) return skeleton ?? <PageSkeleton />;
  return children(query.data);
}
