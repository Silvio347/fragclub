import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Trophy, Loader2 } from 'lucide-react';
import { api } from '../services';
import { Avatar, LevelBadge, TeamLogo } from './ui';

const STATUS = { open: 'Inscrições abertas', live: 'Ao vivo', finished: 'Finalizado' };

// Busca do topo: combobox acessível com resultados agrupados e navegação por teclado
export default function GlobalSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ players: [], teams: [], tournaments: [] });
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);

  // Debounce de 200ms; respostas atrasadas de buscas antigas são descartadas
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ players: [], teams: [], tournaments: [] });
      setLoading(false);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api.search.query(q).then((r) => {
        if (!alive) return;
        setResults(r);
        setActive(-1);
        setLoading(false);
      });
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const items = [
    ...results.players.map((p) => ({ key: `p-${p.nick}`, to: `/perfil/${p.nick}`, kind: 'player', data: p })),
    ...results.teams.map((t) => ({ key: `t-${t.id}`, to: `/times/${t.id}`, kind: 'team', data: t })),
    ...results.tournaments.map((t) => ({ key: `c-${t.id}`, to: `/campeonatos/${t.id}`, kind: 'tournament', data: t })),
  ];

  const go = (item) => {
    navigate(item.to);
    setOpen(false);
    setQ('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPanel = open && q.trim().length >= 2;
  const section = (kind, title) => {
    const list = items.filter((i) => i.kind === kind);
    if (!list.length) return null;
    return (
      <li role="presentation" className="gs-group">
        <span className="gs-group-title">{title}</span>
        <ul role="group" aria-label={title}>
          {list.map((item) => {
            const idx = items.indexOf(item);
            const { data } = item;
            return (
              <li
                key={item.key}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={idx === active}
                className={`gs-item ${idx === active ? 'active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(item)}
                onMouseEnter={() => setActive(idx)}
              >
                {kind === 'player' && (
                  <>
                    <Avatar nick={data.nick} size={28} />
                    <span className="gs-main">{data.nick}</span>
                    <LevelBadge level={data.level} size={22} />
                    <span className="muted small">{data.elo}</span>
                  </>
                )}
                {kind === 'team' && (
                  <>
                    <TeamLogo tag={data.tag} color={data.color} size={28} />
                    <span className="gs-main">{data.name}</span>
                    <span className="muted small">
                      <Shield size={12} aria-hidden="true" /> {data.members} membros
                    </span>
                  </>
                )}
                {kind === 'tournament' && (
                  <>
                    <span className="gs-icon">
                      <Trophy size={14} aria-hidden="true" />
                    </span>
                    <span className="gs-main">{data.name}</span>
                    <span className="muted small">{STATUS[data.status]}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  return (
    <div className="gs" ref={wrapRef}>
      <label className="search">
        {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Buscar jogadores, times, campeonatos..."
          aria-label="Buscar"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>
      {showPanel && (
        <ul id={listId} role="listbox" aria-label="Resultados da busca" className="gs-panel">
          {section('player', 'Jogadores')}
          {section('team', 'Times')}
          {section('tournament', 'Campeonatos')}
          {!loading && items.length === 0 && (
            <li role="presentation" className="gs-empty muted">
              Nada encontrado para “{q.trim()}”.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
