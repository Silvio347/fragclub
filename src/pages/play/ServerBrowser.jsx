import { useMemo, useState } from 'react';
import { Search, RefreshCw, Copy, Check, Play, Crown, Signal } from 'lucide-react';
import { ALL_MAPS, REGIONS, SERVER_VARIANTS, genServers } from '../../data/mock';
import { MapThumb, Modal } from '../../components/ui';

const SORTS = {
  ping: (a, b) => a.ping - b.ping,
  players: (a, b) => b.players - a.players,
  name: (a, b) => a.name.localeCompare(b.name),
};

function pingClass(ping) {
  if (ping <= 25) return 'text-win';
  if (ping <= 50) return 'text-warn';
  return 'text-loss';
}

function ConnectModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);
  const cmd = `connect ${server.ip}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal title="Entrar no servidor" onClose={onClose}>
      <div className="server">
        <MapThumb map={server.map} height={130} className="server-map" />
        <strong>{server.name}</strong>
        <p className="muted small">
          {server.region} · {server.players}/{server.max} jogadores · {server.ping} ms
        </p>
        <div className="connect-box">
          <code>{cmd}</code>
          <button type="button" className="icon-btn" onClick={copy} aria-label="Copiar comando de conexão">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <a className="btn btn-primary btn-lg btn-block" href={`steam://connect/${server.ip}`}>
          <Play size={18} aria-hidden="true" /> Abrir no CS2
        </a>
      </div>
    </Modal>
  );
}

export default function ServerBrowser({ type }) {
  const [seed, setSeed] = useState(0);
  const base = useMemo(() => genServers(type), [type]);
  // "Atualizar" varia a lotação para simular o refresh
  const servers = useMemo(
    () =>
      base.map((s, i) => ({
        ...s,
        players: seed ? Math.max(0, Math.min(s.max, s.players + (((i * 7 + seed * 3) % 5) - 2))) : s.players,
      })),
    [base, seed],
  );
  const [f, setF] = useState({ q: '', map: 'all', variant: 'all', region: 'all', hideFull: false, hideEmpty: false, sort: 'ping' });
  const [connecting, setConnecting] = useState(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const list = servers
    .filter((s) => {
      if (f.q && !s.name.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.map !== 'all' && s.map.id !== f.map) return false;
      if (f.variant !== 'all' && s.variant !== f.variant) return false;
      if (f.region !== 'all' && s.region !== f.region) return false;
      if (f.hideFull && s.players >= s.max) return false;
      if (f.hideEmpty && s.players === 0) return false;
      return true;
    })
    .sort(SORTS[f.sort]);

  const totalPlayers = servers.reduce((sum, s) => sum + s.players, 0);
  const label = type === 'dm' ? 'Deathmatch' : 'Retake';

  return (
    <section className="card stack" aria-labelledby="servers-title">
      <div className="toolbar">
        <div>
          <h2 id="servers-title">Servidores de {label}</h2>
          <span className="muted small">
            {servers.length} servidores · {totalPlayers} jogando agora
          </span>
        </div>
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Buscar servidor" value={f.q} onChange={set('q')} aria-label="Buscar servidor" />
        </label>
        <select value={f.map} onChange={set('map')} aria-label="Mapa">
          <option value="all">Todos os mapas</option>
          {ALL_MAPS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={f.variant} onChange={set('variant')} aria-label="Modo">
          <option value="all">Todos os modos</option>
          {SERVER_VARIANTS[type].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select value={f.region} onChange={set('region')} aria-label="Região">
          <option value="all">Todas as regiões</option>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select value={f.sort} onChange={set('sort')} aria-label="Ordenar por">
          <option value="ping">Menor ping</option>
          <option value="players">Mais jogadores</option>
          <option value="name">Nome</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={f.hideFull} onChange={set('hideFull')} /> Ocultar cheios
        </label>
        <label className="check">
          <input type="checkbox" checked={f.hideEmpty} onChange={set('hideEmpty')} /> Ocultar vazios
        </label>
        <button type="button" className="icon-btn" onClick={() => setSeed((s) => s + 1)} aria-label="Atualizar servidores">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="table-wrap">
        <table className="table server-table">
          <thead>
            <tr>
              <th scope="col">Mapa</th>
              <th scope="col">Servidor</th>
              <th scope="col">Jogadores</th>
              <th scope="col" className="hide-sm">Região</th>
              <th scope="col">Ping</th>
              <th scope="col">
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const full = s.players >= s.max;
              return (
                <tr key={s.id}>
                  <td>
                    <MapThumb map={s.map} height={40} className="server-thumb" />
                  </td>
                  <td>
                    <div className="server-name">
                      <strong>
                        {s.name} {s.premium && <Crown size={13} className="accent" aria-label="Premium" />}
                      </strong>
                      <span className="tag">{s.variant}</span>
                    </div>
                  </td>
                  <td>
                    <div className="players-bar">
                      <span>
                        {s.players}/{s.max}
                      </span>
                      <div className="progress">
                        <div style={{ width: `${(s.players / s.max) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="hide-sm">{s.region}</td>
                  <td>
                    <span className={`row gap-xs ${pingClass(s.ping)}`}>
                      <Signal size={14} aria-hidden="true" /> {s.ping} ms
                    </span>
                  </td>
                  <td className="td-action">
                    <button type="button" className="btn btn-primary btn-sm" disabled={full} onClick={() => setConnecting(s)}>
                      {full ? 'Cheio' : 'Entrar'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="muted empty">
                  Nenhum servidor com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {connecting && <ConnectModal server={connecting} onClose={() => setConnecting(null)} />}
    </section>
  );
}
