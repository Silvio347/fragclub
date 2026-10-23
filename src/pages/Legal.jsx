import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TERMS, PRIVACY, LEGAL_UPDATED, CONTACT } from '../data/legal';
import PublicShell from '../components/PublicShell';

function LegalPage({ title, intro, sections, other }) {
  useEffect(() => {
    document.title = `${title} · FragClub`;
    return () => {
      document.title = 'FragClub · CS2';
    };
  }, [title]);

  return (
    <PublicShell>
      <div className="legal">
        <aside className="legal-toc" aria-label="Sumário">
          <strong className="small">Nesta página</strong>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s*/, '')}</a>
              </li>
            ))}
          </ol>
          <Link to={other.to} className="link-muted small">
            {other.label}
          </Link>
        </aside>

        <article className="legal-body">
          <header>
            <span className="eyebrow">Documentos</span>
            <h1>{title}</h1>
            <p className="muted small">Última atualização: {LEGAL_UPDATED}</p>
            <p>{intro}</p>
          </header>
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`}>
              <h2 id={`${s.id}-t`}>{s.title}</h2>
              {s.body.map((b, i) =>
                typeof b === 'string' ? (
                  <p key={i}>{b}</p>
                ) : (
                  <ul key={i}>
                    {b.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
          <p className="muted small legal-contact">
            Dúvidas: <a href={`mailto:${CONTACT.supportEmail}`}>{CONTACT.supportEmail}</a> · Dados pessoais:{' '}
            <a href={`mailto:${CONTACT.privacyEmail}`}>{CONTACT.privacyEmail}</a>
          </p>
        </article>
      </div>
    </PublicShell>
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="Regras para usar o FragClub: conta, conduta, anti-cheat, Premium, FragPoints e campeonatos."
      sections={TERMS}
      other={{ to: '/privacidade', label: 'Ver também: Política de Privacidade' }}
    />
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Quais dados coletamos, para quê, com quem compartilhamos e como exercer seus direitos pela LGPD."
      sections={PRIVACY}
      other={{ to: '/termos', label: 'Ver também: Termos de Uso' }}
    />
  );
}
