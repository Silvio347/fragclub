import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, UserMinus, Check, X, Users, Clock } from 'lucide-react';
import { api, realtime } from '../services';
import { useQuery } from '../hooks/useQuery';
import { useParty } from '../context/PartyContext';
import { Async, PageSkeleton } from '../components/Async';
import { Avatar, LevelBadge, Modal } from '../components/ui';

const TABS = [
  { id: 'amigos', label: 'Amigos' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'adicionar', label: 'Adicionar' },
];

const GROUPS = [
  { status: 'in-game', label: 'Em partida' },
  { status: 'online', label: 'Online' },
  { status: 'offline', label: 'Offline' },
];

function PlayerRow({ p, children }) {
  return (
    <li className="fr-row">
      <Link to={`/perfil/${p.nick}`} className="fr-player">
        <Avatar nick={p.nick} size={40} status={p.status} />
        <div className="friend-info">
          <strong>{p.nick}</strong>
          <span className={`small ${p.status === 'in-game' ? 'accent' : 'muted'}`}>{p.activity}</span>
        </div>
      </Link>
      <LevelBadge level={p.level} size={28} />
      <span className="fr-elo hide-sm">{p.elo} ELO</span>
      <div className="fr-actions">{children}</div>
    </li>
  );
}

function FriendsTab({ data, act }) {
  const { invite, party, isFull } = useParty();
  const [q, setQ] = useState('');
  const [removing, setRemoving] = useState(null);
  const list = data.friends.filter((f) => f.nick.includes(q.trim().toLowerCase()));

  return (
    <section className="card stack">
      <label className="search search-block">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Filtrar amigos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filtrar amigos"
        />
      </label>
      {GROUPS.map(({ status, label }) => {
        const group = list.filter((f) => f.status === status);
        if (!group.length) return null;
        return (
          <div key={status}>
            <h2 className="fr-group-title">
              {label} <span className="muted">({group.length})</span>
            </h2>
            <ul className="fr-list">
              {group.map((f) => {
                const inParty = party.some((p) => p.nick === f.nick);
                return (
                  <PlayerRow key={f.nick} p={f}>
                    {f.status === 'online' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={inParty || isFull}
                        onClick={() => invite(f)}
                      >
                        <Users size={14} aria-hidden="true" /> {inParty ? 'Na party' : 'Chamar p/ party'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setRemoving(f.nick)}
                      aria-label={`Desfazer amizade com ${f.nick}`}
                    >
                      <UserMinus size={15} />
                    </button>
                  </PlayerRow>
                );
              })}
            </ul>
          </div>
        );
      })}
      {list.length === 0 && <p className="muted empty-state">Nenhum amigo encontrado.</p>}

      {removing && (
        <Modal title="Desfazer amizade" onClose={() => setRemoving(null)}>
          <p className="muted modal-sub">Remover {removing} da sua lista de amigos?</p>
          <div className="row gap-sm form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setRemoving(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                act(api.friends.remove(removing));
                setRemoving(null);
              }}
            >
              Remover
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function RequestsTab({ data, act }) {
  return (
    <div className="stack">
      <section className="card">
        <h2 className="card-head">Recebidos ({data.incoming.length})</h2>
        {data.incoming.length ? (
          <ul className="fr-list">
            {data.incoming.map((p) => (
              <PlayerRow key={p.nick} p={p}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => act(api.friends.accept(p.nick))}
                >
                  <Check size={14} aria-hidden="true" /> Aceitar
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(api.friends.decline(p.nick))}>
                  <X size={14} aria-hidden="true" /> Recusar
                </button>
              </PlayerRow>
            ))}
          </ul>
        ) : (
          <p className="muted small">Nenhum pedido pendente.</p>
        )}
      </section>
      <section className="card">
        <h2 className="card-head">Enviados ({data.outgoing.length})</h2>
        {data.outgoing.length ? (
          <ul className="fr-list">
            {data.outgoing.map((p) => (
              <PlayerRow key={p.nick} p={p}>
                <span className="muted small row gap-xs">
                  <Clock size={13} aria-hidden="true" /> Aguardando
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(api.friends.cancel(p.nick))}>
                  Cancelar
                </button>
              </PlayerRow>
            ))}
          </ul>
        ) : (
          <p className="muted small">Você não tem pedidos aguardando resposta.</p>
        )}
      </section>
    </div>
  );
}

function AddTab({ data, act }) {
  const [q, setQ] = useState('');
  const suggestions = useQuery(() => api.friends.suggestions(), [data.friends.length, data.outgoing.length]);
  const results = useQuery(() => (q.trim().length >= 2 ? api.search.query(q) : Promise.resolve(null)), [q]);
  const known = new Set([...data.friends, ...data.outgoing, ...data.incoming].map((p) => p.nick));

  const addButton = (nick) =>
    known.has(nick) ? (
      <span className="tag">{data.friends.some((f) => f.nick === nick) ? 'Amigo' : 'Pendente'}</span>
    ) : (
      <button type="button" className="btn btn-primary btn-sm" onClick={() => act(api.friends.add(nick))}>
        <UserPlus size={14} aria-hidden="true" /> Adicionar
      </button>
    );

  return (
    <div className="stack">
      <section className="card stack">
        <label className="search search-block">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar jogador pelo nick"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar jogador pelo nick"
          />
        </label>
        {results.data?.players?.length > 0 && (
          <ul className="fr-list">
            {results.data.players.map((p) => (
              <li key={p.nick} className="fr-row">
                <Link to={`/perfil/${p.nick}`} className="fr-player">
                  <Avatar nick={p.nick} size={40} />
                  <strong>{p.nick}</strong>
                </Link>
                <LevelBadge level={p.level} size={28} />
                <span className="fr-elo hide-sm">{p.elo} ELO</span>
                <div className="fr-actions">{addButton(p.nick)}</div>
              </li>
            ))}
          </ul>
        )}
        {results.data && !results.data.players.length && <p className="muted small">Nenhum jogador com esse nick.</p>}
      </section>
      <section className="card">
        <h2 className="card-head">Sugestões com ELO parecido</h2>
        <ul className="fr-list">
          {(suggestions.data ?? []).map((p) => (
            <PlayerRow key={p.nick} p={p}>
              {addButton(p.nick)}
            </PlayerRow>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Friends() {
  const query = useQuery(() => api.friends.overview(), []);
  const [tab, setTab] = useState('amigos');
  const [error, setError] = useState('');
  const { setData } = query;

  // Pedidos aceitos pelo "servidor" atualizam a tela sozinhos
  useEffect(() => realtime.on('friends:changed', setData), [setData]);

  const act = (promise) => {
    setError('');
    promise.then(setData).catch((e) => setError(e.message));
  };

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Social</span>
          <h1>Amigos</h1>
        </div>
      </header>
      <Async query={query} skeleton={<PageSkeleton rows={8} />}>
        {(data) => (
          <>
            <div className="tabs" role="tablist" aria-label="Seções de amigos">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === 'amigos' && ` (${data.friends.length})`}
                  {t.id === 'pedidos' && data.incoming.length > 0 && (
                    <span className="tab-badge">{data.incoming.length}</span>
                  )}
                </button>
              ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {tab === 'amigos' && <FriendsTab data={data} act={act} />}
            {tab === 'pedidos' && <RequestsTab data={data} act={act} />}
            {tab === 'adicionar' && <AddTab data={data} act={act} />}
          </>
        )}
      </Async>
    </div>
  );
}
