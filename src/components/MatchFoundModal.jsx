import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { useQueue } from '../context/QueueContext';

export default function MatchFoundModal() {
  const { status, mode, acceptLeft, acceptTime, acceptedCount, accept, cancel } = useQueue();
  const acceptRef = useRef(null);
  const open = status === 'found' || status === 'accepted';

  useEffect(() => {
    if (status === 'found') acceptRef.current?.focus();
  }, [status]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal match-found" role="dialog" aria-modal="true" aria-labelledby="mf-title">
        <span className="eyebrow">{mode?.name ?? '5v5 Competitivo'}</span>
        <h2 id="mf-title">Partida encontrada</h2>

        <div className="accept-dots" aria-label={`${acceptedCount} de 10 jogadores aceitaram`}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < acceptedCount ? 'on' : ''} />
          ))}
        </div>

        <div className="accept-timer">
          <div style={{ width: `${(acceptLeft / acceptTime) * 100}%` }} />
        </div>
        <span className="muted small">{acceptLeft}s para aceitar</span>

        {status === 'found' ? (
          <div className="modal-actions">
            <button ref={acceptRef} type="button" className="btn btn-primary btn-lg btn-block" onClick={accept}>
              Aceitar
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={cancel}>
              Recusar
            </button>
          </div>
        ) : (
          <p className="accepted-msg" role="status">
            <Check size={16} aria-hidden="true" /> Você aceitou. Aguardando os outros jogadores ({acceptedCount}/10)
          </p>
        )}
      </div>
    </div>
  );
}
