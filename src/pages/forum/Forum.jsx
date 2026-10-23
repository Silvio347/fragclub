import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Pin, CheckCircle2, MessageSquare, Heart, Eye, Lock, HelpCircle } from 'lucide-react';
import { api, realtime, FORUM_CATEGORIES } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { timeAgo } from '../../context/NotificationsContext';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/Async';
import { Avatar } from '../../components/ui';
import NewThreadModal from './NewThreadModal';

const PAGE = 15;
const SORTS = [
  { id: 'recent', label: 'Recentes' },
  { id: 'popular', label: 'Populares' },
  { id: 'unanswered', label: 'Sem resposta' },
];
const CAT_NAME = Object.fromEntries(FORUM_CATEGORIES.map((c) => [c.id, c.name]));

export default function Forum() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const category = params.get('categoria') ?? 'all';
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [sort, setSort] = useState('recent');
  const [shown, setShown] = useState(PAGE);
  const [creating, setCreating] = useState(false);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const cats = useQuery(() => api.forum.categories(), []);
  const threads = useQuery(() => api.forum.list({ category, q: term, sort }), [category, term, sort]);
  const { refetch: refetchThreads } = threads;
  const { refetch: refetchCats } = cats;

  useEffect(
    () =>
      realtime.on('forum:changed', () => {
        refetchThreads();
        refetchCats();
      }),
    [refetchThreads, refetchCats],
  );
  useEffect(() => setShown(PAGE), [category, term, sort]);

  const setCategory = (id) => setParams(id === 'all' ? {} : { categoria: id }, { replace: true });
  const list = threads.data ?? [];
  const total = cats.data?.reduce((n, c) => n + c.threads, 0);

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Comunidade</span>
          <h1>Fórum</h1>
        </div>
        <div className="row gap-sm">
          <Link to="/faq" className="btn btn-ghost">
            <HelpCircle size={16} aria-hidden="true" /> FAQ
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> Novo tópico
          </button>
        </div>
      </header>

      <div className="fo-grid">
        <nav className="card fo-cats" aria-label="Categorias">
          <button
            type="button"
            className={`fo-cat ${category === 'all' ? 'active' : ''}`}
            aria-current={category === 'all' ? 'page' : undefined}
            onClick={() => setCategory('all')}
          >
            <span>Todas</span>
            <span className="muted small">{total ?? ''}</span>
          </button>
          {(cats.data ?? FORUM_CATEGORIES).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`fo-cat ${category === c.id ? 'active' : ''}`}
              aria-current={category === c.id ? 'page' : undefined}
              onClick={() => setCategory(c.id)}
              title={c.desc}
            >
              <span>{c.name}</span>
              <span className="muted small">{c.threads ?? ''}</span>
            </button>
          ))}
        </nav>

        <section className="stack" aria-label="Tópicos">
          <div className="toolbar">
            <label className="search fo-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar tópicos"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar tópicos"
              />
            </label>
            <div className="segmented fo-sort" role="radiogroup" aria-label="Ordenar">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sort === s.id}
                  className={sort === s.id ? 'active' : ''}
                  onClick={() => setSort(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="card fo-list">
            {!threads.data && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={64} r={8} />)}
            {list.slice(0, shown).map((t) => (
              <li key={t.id} className={`fo-row ${t.pinned ? 'pinned' : ''}`}>
                <Avatar nick={t.author.nick} size={38} />
                <div className="fo-row-main">
                  <Link to={`/forum/${t.id}`} className="fo-title">
                    {t.pinned && <Pin size={14} aria-label="Fixado" className="accent" />}
                    {t.locked && <Lock size={13} aria-label="Fechado" className="muted" />}
                    {t.title}
                  </Link>
                  <span className="muted small fo-meta">
                    <span className="tag">{CAT_NAME[t.category]}</span>
                    {t.solved && (
                      <span className="tag tag-win">
                        <CheckCircle2 size={12} aria-hidden="true" /> Resolvido
                      </span>
                    )}
                    por <strong className={t.author.staff ? 'accent' : ''}>{t.author.nick}</strong> ·{' '}
                    {timeAgo(t.createdAt)}
                  </span>
                </div>
                <dl className="fo-stats">
                  <div title="Respostas">
                    <dt className="sr-only">Respostas</dt>
                    <dd>
                      <MessageSquare size={14} aria-hidden="true" /> {t.replies}
                    </dd>
                  </div>
                  <div title="Curtidas" className="hide-sm">
                    <dt className="sr-only">Curtidas</dt>
                    <dd>
                      <Heart size={14} aria-hidden="true" /> {t.likes}
                    </dd>
                  </div>
                  <div title="Visualizações" className="hide-sm">
                    <dt className="sr-only">Visualizações</dt>
                    <dd>
                      <Eye size={14} aria-hidden="true" /> {t.views}
                    </dd>
                  </div>
                </dl>
                <span className="fo-last muted small hide-sm">
                  {timeAgo(t.lastActivity)}
                  <br />
                  {t.lastAuthor}
                </span>
              </li>
            ))}
            {threads.data && list.length === 0 && (
              <li className="empty-state muted">
                {term ? `Nenhum tópico com “${term}”.` : 'Nenhum tópico aqui ainda. Que tal abrir o primeiro?'}
              </li>
            )}
          </ul>
          {shown < list.length && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setShown((n) => n + PAGE)}>
              Carregar mais ({list.length - shown} restantes)
            </button>
          )}
        </section>
      </div>

      {creating && (
        <NewThreadModal
          initialCategory={category}
          onClose={() => setCreating(false)}
          onCreated={(t) => {
            setCreating(false);
            toast.success('Tópico publicado');
            navigate(`/forum/${t.id}`);
          }}
        />
      )}
    </div>
  );
}
