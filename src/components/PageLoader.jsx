// Fallback do Suspense enquanto o chunk da página é baixado
export default function PageLoader({ fullscreen = false }) {
  return (
    <div className={`page-loader ${fullscreen ? 'fullscreen' : ''}`} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
