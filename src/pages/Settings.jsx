import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, ShieldCheck, Bell, Lock, Trash2, Monitor, Smartphone, Pencil, Check } from 'lucide-react';
import { ME } from '../data/mock';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { useAuth } from '../context/AuthContext';
import { Async, PageSkeleton } from '../components/Async';
import { Modal } from '../components/ui';

const SECTIONS = [
  { id: 'conta', label: 'Conta', icon: Mail },
  { id: 'seguranca', label: 'Segurança', icon: ShieldCheck },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'privacidade', label: 'Privacidade', icon: Lock },
  { id: 'excluir', label: 'Excluir conta', icon: Trash2 },
];

const NOTIF_PREFS = [
  ['team', 'Times', 'Convites, pedidos aceitos e novos membros'],
  ['friends', 'Amigos', 'Pedidos de amizade e respostas'],
  ['challenges', 'Desafios', 'Desafios de lobby recebidos'],
  ['tournaments', 'Campeonatos', 'Inscrições, check-in e resultados'],
  ['shop', 'Loja e pontos', 'Compras, resgates e FragPoints'],
  ['email', 'Resumo por e-mail', 'Um e-mail semanal com suas estatísticas'],
];

// Envio de formulário com estado de loading/erro/sucesso padronizado
function useSubmit() {
  const [state, setState] = useState({ busy: false, error: '', ok: '' });
  const run = async (fn, okMsg) => {
    setState({ busy: true, error: '', ok: '' });
    try {
      const r = await fn();
      setState({ busy: false, error: '', ok: okMsg });
      return r;
    } catch (e) {
      setState({ busy: false, error: e.message, ok: '' });
      return undefined;
    }
  };
  return [state, run];
}

function Feedback({ state }) {
  if (state.error)
    return (
      <p className="form-error" role="alert">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="form-ok" role="status">
        <Check size={14} aria-hidden="true" /> {state.ok}
      </p>
    );
  return null;
}

function Toggle({ checked, onChange, label, hint, id }) {
  return (
    <div className="toggle-row">
      <div>
        <label htmlFor={id}>
          <strong>{label}</strong>
        </label>
        {hint && <p className="muted small">{hint}</p>}
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

function AccountSection({ user }) {
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [emailState, runEmail] = useSubmit();
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdState, runPwd] = useSubmit();

  const changePassword = (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return runPwd(() => Promise.reject(new Error('As senhas não conferem.')));
    runPwd(() => api.account.changePassword(pwd), 'Senha alterada.').then(
      (r) => r && setPwd({ current: '', next: '', confirm: '' }),
    );
  };

  return (
    <>
      <section className="card st-section">
        <h2>
          <Mail size={16} aria-hidden="true" /> E-mail
        </h2>
        <form
          className="st-form"
          onSubmit={(e) => {
            e.preventDefault();
            runEmail(() => api.account.changeEmail({ email, password }), 'E-mail atualizado.').then((r) => {
              setPassword('');
              if (r) refreshSession();
            });
          }}
          noValidate
        >
          <div className="field-row">
            <div className="field">
              <label htmlFor="st-email">Novo e-mail</label>
              <input
                id="st-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="st-email-pwd">Senha atual</label>
              <input
                id="st-email-pwd"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <Feedback state={emailState} />
          <div className="row form-actions">
            <button type="submit" className="btn btn-primary" disabled={emailState.busy || email === user.email}>
              Salvar e-mail
            </button>
          </div>
        </form>
      </section>

      <section className="card st-section">
        <h2>
          <KeyRound size={16} aria-hidden="true" /> Senha
        </h2>
        <form className="st-form" onSubmit={changePassword} noValidate>
          <div className="field">
            <label htmlFor="st-cur">Senha atual</label>
            <input
              id="st-cur"
              className="input"
              type="password"
              autoComplete="current-password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="st-new">Nova senha</label>
              <input
                id="st-new"
                className="input"
                type="password"
                autoComplete="new-password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="st-confirm">Confirmar nova senha</label>
              <input
                id="st-confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </div>
          </div>
          <Feedback state={pwdState} />
          <div className="row form-actions">
            <button type="submit" className="btn btn-primary" disabled={pwdState.busy || !pwd.current || !pwd.next}>
              Alterar senha
            </button>
          </div>
        </form>
      </section>

      <section className="card st-section">
        <h2>
          <Pencil size={16} aria-hidden="true" /> Perfil público
        </h2>
        <p className="muted small">
          Nick, bio, avatar, banner, redes sociais, mira e link de troca ficam na edição de perfil.
        </p>
        <Link to="/perfil/editar" className="btn btn-ghost btn-sm">
          Editar perfil
        </Link>
      </section>
    </>
  );
}

function SecuritySection({ settings, setSettings }) {
  const [setup, setSetup] = useState(null); // { secret, hint }
  const [code, setCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [state, run] = useSubmit();
  const enabled = settings.security.twoFactor;

  return (
    <>
      <section className="card st-section">
        <h2>
          <ShieldCheck size={16} aria-hidden="true" /> Verificação em duas etapas
        </h2>
        <p className="muted small">
          {enabled
            ? 'Ativada. Pedimos um código do app autenticador ao entrar em um dispositivo novo.'
            : 'Proteja sua conta e seus itens com um código do app autenticador.'}
        </p>
        {!enabled && !setup && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => run(() => api.account.start2fa()).then((r) => r && setSetup(r))}
          >
            Ativar 2FA
          </button>
        )}
        {!enabled && setup && (
          <form
            className="st-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api.account.confirm2fa(code), '2FA ativado.').then(
                (s) => s && (setSettings(s), setSetup(null)),
              );
            }}
          >
            <div className="twofa-secret">
              <span className="muted small">Adicione no app autenticador:</span>
              <code>{setup.secret}</code>
              <span className="muted small">{setup.hint}</span>
            </div>
            <div className="field">
              <label htmlFor="st-code">Código de 6 dígitos</label>
              <input
                id="st-code"
                className="input mono"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="row gap-sm form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSetup(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={code.length !== 6 || state.busy}>
                Confirmar
              </button>
            </div>
          </form>
        )}
        {enabled && (
          <form
            className="st-form row gap-sm wrap"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => api.account.disable2fa(disablePwd), '2FA desativado.').then(
                (s) => s && (setSettings(s), setDisablePwd('')),
              );
            }}
          >
            <input
              className="input"
              type="password"
              placeholder="Senha atual"
              aria-label="Senha atual"
              value={disablePwd}
              onChange={(e) => setDisablePwd(e.target.value)}
            />
            <button type="submit" className="btn btn-danger btn-sm" disabled={!disablePwd}>
              Desativar 2FA
            </button>
          </form>
        )}
        <Feedback state={state} />
      </section>

      <section className="card st-section">
        <h2>
          <Monitor size={16} aria-hidden="true" /> Sessões ativas
        </h2>
        <ul className="sessions">
          {settings.sessions.map((s) => (
            <li key={s.id}>
              {s.device.includes('Android') ? (
                <Smartphone size={18} aria-hidden="true" />
              ) : (
                <Monitor size={18} aria-hidden="true" />
              )}
              <div>
                <strong>{s.device}</strong>
                <span className="muted small">
                  {s.location} · {s.lastActive}
                </span>
              </div>
              {s.current ? (
                <span className="tag tag-win">Este dispositivo</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    run(() => api.account.revokeSession(s.id), 'Sessão encerrada.').then((r) => r && setSettings(r))
                  }
                >
                  Encerrar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function PrefsSection({ section, settings, setSettings }) {
  const [state, run] = useSubmit();
  const update = (patch) =>
    run(() => api.account.update(section, patch), 'Preferência salva.').then((s) => s && setSettings(s));

  if (section === 'notifications') {
    return (
      <section className="card st-section">
        <h2>
          <Bell size={16} aria-hidden="true" /> Notificações
        </h2>
        <p className="muted small">Escolha o que aparece no sino. Avisos do sistema sempre chegam.</p>
        {NOTIF_PREFS.map(([key, label, hint]) => (
          <Toggle
            key={key}
            id={`np-${key}`}
            label={label}
            hint={hint}
            checked={settings.notifications[key]}
            onChange={(v) => update({ [key]: v })}
          />
        ))}
        <Feedback state={state} />
      </section>
    );
  }

  return (
    <section className="card st-section">
      <h2>
        <Lock size={16} aria-hidden="true" /> Privacidade
      </h2>
      <Toggle
        id="pv-public"
        label="Perfil público"
        hint="Qualquer pessoa vê suas estatísticas e histórico"
        checked={settings.privacy.publicProfile}
        onChange={(v) => update({ publicProfile: v })}
      />
      <Toggle
        id="pv-online"
        label="Mostrar quando estou online"
        hint="Amigos veem seu status e em qual partida você está"
        checked={settings.privacy.showOnline}
        onChange={(v) => update({ showOnline: v })}
      />
      <div className="toggle-row">
        <div>
          <label htmlFor="pv-invites">
            <strong>Quem pode me convidar</strong>
          </label>
          <p className="muted small">Para party, times e lobbies</p>
        </div>
        <select id="pv-invites" value={settings.privacy.invites} onChange={(e) => update({ invites: e.target.value })}>
          <option value="everyone">Qualquer pessoa</option>
          <option value="friends">Só amigos</option>
        </select>
      </div>
      <Feedback state={state} />
    </section>
  );
}

function DeleteSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [state, run] = useSubmit();

  const doDelete = async () => {
    const r = await run(() => api.account.deleteAccount({ confirmNick: confirm }));
    if (r) {
      await logout();
      navigate('/', { replace: true });
    }
  };

  return (
    <section className="card st-section st-danger">
      <h2>
        <Trash2 size={16} aria-hidden="true" /> Excluir conta
      </h2>
      <p className="muted small">
        Apaga perfil, times criados, inventário, FragPoints e histórico. Não dá para desfazer.
      </p>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}>
        Excluir minha conta
      </button>
      {open && (
        <Modal title="Excluir conta" onClose={() => setOpen(false)}>
          <div className="stack" style={{ gap: 12, textAlign: 'left' }}>
            <p className="muted small">
              Para confirmar, digite seu nick: <strong>{ME.nick}</strong>
            </p>
            <input
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-label="Digite seu nick para confirmar"
            />
            <Feedback state={state} />
            <div className="row gap-sm form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={confirm !== ME.nick || state.busy}
                onClick={doDelete}
              >
                Excluir definitivamente
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const query = useQuery(() => api.account.settings(), []);
  const [section, setSection] = useState('conta');

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">Conta</span>
          <h1>Configurações</h1>
        </div>
      </header>
      <Async query={query} skeleton={<PageSkeleton rows={6} />}>
        {(settings) => (
          <div className="st-grid">
            <nav className="st-nav" aria-label="Seções das configurações">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`st-nav-item ${section === id ? 'active' : ''}`}
                  aria-current={section === id ? 'page' : undefined}
                  onClick={() => setSection(id)}
                >
                  <Icon size={16} aria-hidden="true" /> {label}
                </button>
              ))}
            </nav>
            <div className="stack">
              {section === 'conta' && <AccountSection user={user} />}
              {section === 'seguranca' && <SecuritySection settings={settings} setSettings={query.setData} />}
              {section === 'notificacoes' && (
                <PrefsSection section="notifications" settings={settings} setSettings={query.setData} />
              )}
              {section === 'privacidade' && (
                <PrefsSection section="privacy" settings={settings} setSettings={query.setData} />
              )}
              {section === 'excluir' && <DeleteSection />}
            </div>
          </div>
        )}
      </Async>
    </div>
  );
}
