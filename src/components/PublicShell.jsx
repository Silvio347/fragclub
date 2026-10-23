import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="FragClub, página inicial">
      <span className="brand-mark">F</span>
      <span className="brand-name">
        FRAG<span className="accent">CLUB</span>
      </span>
    </Link>
  );
}

export function PublicFooter() {
  return (
    <footer className="lp-footer">
      <Brand />
      <nav className="pub-footer-links" aria-label="Links institucionais">
        <Link to="/faq">FAQ</Link>
        <Link to="/termos">Termos de Uso</Link>
        <Link to="/privacidade">Privacidade</Link>
      </nav>
      <p className="muted small">
        Projeto de estudo. Não afiliado à Valve Corporation. Counter-Strike é marca da Valve Corporation.
      </p>
    </footer>
  );
}

// Moldura das páginas públicas (FAQ, Termos, Privacidade): topo simples + rodapé
export default function PublicShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="pub">
      <header className="pub-nav">
        <Brand />
        <nav className="pub-links" aria-label="Páginas">
          <Link to="/faq">FAQ</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
        </nav>
        <div className="lp-nav-actions">
          {user ? (
            <Link to="/inicio" className="btn btn-primary btn-sm">
              Abrir o app <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn btn-primary btn-sm">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="pub-main">{children}</main>
      <PublicFooter />
    </div>
  );
}
