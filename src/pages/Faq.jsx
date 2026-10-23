import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessagesSquare } from 'lucide-react';
import { FAQ } from '../data/faq';
import { useAuth } from '../context/AuthContext';
import PublicShell from '../components/PublicShell';

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function Faq() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const groups = useMemo(() => {
    const term = norm(q.trim());
    return FAQ.filter((g) => cat === 'all' || g.id === cat)
      .map((g) => ({ ...g, items: g.items.filter(([qq, a]) => !term || norm(`${qq} ${a}`).includes(term)) }))
      .filter((g) => g.items.length);
  }, [q, cat]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const forumLink = user ? '/forum?categoria=ajuda' : '/login';

  return (
    <PublicShell>
      <div className="faq-page">
        <header className="faq-hero">
          <span className="eyebrow">Central de ajuda</span>
          <h1>Perguntas frequentes</h1>
          <label className="search faq-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Busque por ELO, skins, Premium, times..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar nas perguntas"
            />
          </label>
          <div className="chips faq-chips" role="radiogroup" aria-label="Categoria">
            {[{ id: 'all', title: 'Todas' }, ...FAQ].map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={cat === g.id}
                className={`chip ${cat === g.id ? 'active' : ''}`}
                onClick={() => setCat(g.id)}
              >
                {g.title}
              </button>
            ))}
          </div>
        </header>

        <p className="muted small" role="status">
          {total} {total === 1 ? 'pergunta' : 'perguntas'}
        </p>

        {groups.map((g) => (
          <section key={g.id} className="faq-group" aria-labelledby={`faq-${g.id}`}>
            <h2 id={`faq-${g.id}`}>{g.title}</h2>
            <div className="faq">
              {g.items.map(([question, answer]) => (
                <details key={question} open={!!q.trim()}>
                  <summary>{question}</summary>
                  <p className="muted">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {total === 0 && <p className="muted empty-state">Nada encontrado para “{q.trim()}”.</p>}

        <section className="card faq-cta">
          <MessagesSquare size={26} aria-hidden="true" className="accent" />
          <div>
            <strong>Não achou sua resposta?</strong>
            <p className="muted small">Pergunte no fórum. A comunidade e a equipe respondem na categoria Ajuda.</p>
          </div>
          <Link to={forumLink} className="btn btn-primary">
            Ir para o fórum
          </Link>
        </section>
      </div>
    </PublicShell>
  );
}
