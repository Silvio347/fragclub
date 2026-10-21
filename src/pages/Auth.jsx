import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MAPS } from '../data/mock';
import '../styles/auth.css';

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-9.96 9.2l5.36 2.2a2.8 2.8 0 0 1 1.6-.5h.15l2.38-3.46v-.05a3.77 3.77 0 1 1 3.77 3.77h-.09l-3.4 2.43v.13a2.83 2.83 0 0 1-5.6.57L2.38 15A10 10 0 1 0 12 2Zm-4.3 15.2-1.23-.5a2.12 2.12 0 1 0 1.16-2.9l1.27.53a1.56 1.56 0 1 1-1.2 2.87Zm9.62-7.56a2.51 2.51 0 1 0-2.51 2.51 2.51 2.51 0 0 0 2.51-2.5Zm-4.4 0a1.89 1.89 0 1 1 1.89 1.89 1.89 1.89 0 0 1-1.89-1.9Z" />
    </svg>
  );
}

function AuthLayout({ title, subtitle, children, mapIndex = 0 }) {
  const map = MAPS[mapIndex];
  return (
    <div className="auth">
      <aside className="auth-visual" style={{ backgroundImage: `url(/maps/${map.id}.jpg)` }}>
        <div className="auth-visual-overlay" />
        <Link to="/" className="brand" aria-label="FragClub, página inicial">
          <span className="brand-mark">F</span>
          <span className="brand-name">
            FRAG<span className="accent">CLUB</span>
          </span>
        </Link>
        <div className="auth-quote">
          <h2>Cada round conta.</h2>
          <p>Ranqueadas, lobbies, retake, DM e campeonatos de CS2 em um lugar só.</p>
        </div>
        <span className="auth-map-tag">{map.name}</span>
      </aside>

      <main className="auth-main">
        <div className="auth-box">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        required
        minLength={6}
      />
      <button type="button" className="input-icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Login() {
  const { user, login, loginWithSteam } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(null);
  const redirectTo = location.state?.from ?? '/inicio';

  if (user) return <Navigate to={redirectTo} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading('email');
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  const steam = async () => {
    setLoading('steam');
    await loginWithSteam();
    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthLayout title="Entrar" subtitle="Bem-vindo de volta. Bora subir esse ELO." mapIndex={0}>
      <button type="button" className="btn btn-steam btn-lg btn-block" onClick={steam} disabled={!!loading}>
        {loading === 'steam' ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <SteamIcon />} Entrar com Steam
      </button>
      <div className="divider">
        <span>ou</span>
      </div>
      <form onSubmit={submit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            aria-invalid={!!error || undefined}
            required
          />
        </div>
        <div className="field">
          <div className="row between">
            <label htmlFor="password">Senha</label>
            <a href="#" className="link-muted small" onClick={(e) => e.preventDefault()}>
              Esqueci minha senha
            </a>
          </div>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            invalid={!!error}
          />
        </div>
        <label className="check">
          <input type="checkbox" defaultChecked /> Manter conectado
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!!loading}>
          {loading === 'email' && <Loader2 size={18} className="spin" aria-hidden="true" />} Entrar
        </button>
        <p className="muted small center-text">Mock: qualquer e-mail válido e senha com 6+ caracteres.</p>
      </form>
      <p className="auth-switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}

const NICK_RE = /^[a-zA-Z0-9_.-]{3,16}$/;

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nick: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/inicio" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const validate = () => {
    const e = {};
    if (!NICK_RE.test(form.nick)) e.nick = 'Use 3 a 16 caracteres: letras, números, _ . -';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Informe um e-mail válido.';
    if (form.password.length < 8) e.password = 'A senha precisa ter pelo menos 8 caracteres.';
    if (form.confirm !== form.password) e.confirm = 'As senhas não conferem.';
    if (!form.terms) e.terms = 'Você precisa aceitar os termos.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await register(form);
      navigate('/inicio', { replace: true });
    } catch (err) {
      setErrors({ nick: err.message });
      setLoading(false);
    }
  };

  const strength = Math.min(
    4,
    [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length,
  );

  const fieldError = (k) =>
    errors[k] && (
      <span id={`${k}-err`} className="field-error" role="alert">
        {errors[k]}
      </span>
    );

  return (
    <AuthLayout title="Criar conta" subtitle="Grátis. Leva menos de um minuto." mapIndex={3}>
      <form onSubmit={submit} className="auth-form" noValidate>
        <div className="field">
          <label htmlFor="nick">Nick</label>
          <input id="nick" value={form.nick} onChange={set('nick')} autoComplete="username" aria-invalid={!!errors.nick || undefined} aria-describedby={errors.nick ? 'nick-err' : undefined} />
          {fieldError('nick')}
        </div>
        <div className="field">
          <label htmlFor="r-email">E-mail</label>
          <input id="r-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email || undefined} aria-describedby={errors.email ? 'email-err' : undefined} />
          {fieldError('email')}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="r-pass">Senha</label>
            <PasswordInput id="r-pass" value={form.password} onChange={set('password')} autoComplete="new-password" invalid={!!errors.password} />
            {fieldError('password')}
          </div>
          <div className="field">
            <label htmlFor="r-confirm">Confirmar senha</label>
            <PasswordInput id="r-confirm" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" invalid={!!errors.confirm} />
            {fieldError('confirm')}
          </div>
        </div>
        <div className="strength" aria-label={`Força da senha: ${strength} de 4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < strength ? `on s${strength}` : ''} />
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={form.terms} onChange={set('terms')} aria-invalid={!!errors.terms || undefined} />
          Li e aceito os termos de uso e a política de privacidade
        </label>
        {fieldError('terms')}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading && <Loader2 size={18} className="spin" aria-hidden="true" />} Criar conta
        </button>
      </form>
      <p className="auth-switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
