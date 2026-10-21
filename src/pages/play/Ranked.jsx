import { useEffect, useState } from 'react';
import { Crosshair, Activity, Clock, Info } from 'lucide-react';
import { REGIONS } from '../../data/mock';
import { useQueue } from '../../context/QueueContext';
import { useParty } from '../../context/PartyContext';
import { formatTime } from '../../utils/random';
import PartyPanel from '../../components/PartyPanel';

export default function Ranked() {
  const { status, elapsed, start, cancel } = useQueue();
  const { party, pending } = useParty();
  const [region, setRegion] = useState(REGIONS[0]);
  const [inQueue, setInQueue] = useState(4821);
  const searching = status !== 'idle';

  useEffect(() => {
    const id = setInterval(() => setInQueue((n) => n + Math.floor(Math.random() * 60 - 28)), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid-main-side">
      <section className="card">
        <PartyPanel locked={searching} />

        <div className="play-action">
          {searching ? (
            <>
              <div className="searching" role="status">
                <span className="spinner" aria-hidden="true" />
                <div>
                  <strong>Procurando partida...</strong>
                  <span className="muted small">
                    Ranqueada 5v5 · {region} · party de {party.length}
                  </span>
                </div>
                <span className="timer">{formatTime(elapsed)}</span>
              </div>
              <button type="button" className="btn btn-danger btn-lg" onClick={cancel}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-xl"
              onClick={() => start({ name: 'Ranqueada 5v5' }, party)}
              disabled={pending.length > 0}
            >
              <Crosshair size={20} aria-hidden="true" /> Procurar partida
            </button>
          )}
        </div>
        {pending.length > 0 && !searching && (
          <p className="muted small center-text">Aguardando os convites pendentes para entrar na fila.</p>
        )}
      </section>

      <aside className="stack">
        <section className="card">
          <h2 className="card-head">Configurações da fila</h2>
          <label className="field-inline">
            <span>Região</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={searching}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <ul className="queue-info">
            <li>
              <Activity size={14} aria-hidden="true" /> <strong>{inQueue.toLocaleString('pt-BR')}</strong> jogadores na fila
            </li>
            <li>
              <Clock size={14} aria-hidden="true" /> Tempo médio <strong>00:48</strong>
            </li>
          </ul>
        </section>
        <section className="card info-card">
          <Info size={16} aria-hidden="true" />
          <p className="small muted">
            Você pode entrar sozinho ou com até 4 amigos. As vagas restantes são completadas pelo matchmaking com
            jogadores de ELO parecido. O veto de mapas acontece na sala da partida.
          </p>
        </section>
      </aside>
    </div>
  );
}
