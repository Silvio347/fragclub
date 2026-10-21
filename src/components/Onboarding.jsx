import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  MapPin,
  ShieldCheck,
  Rocket,
  Check,
  Download,
  Loader2,
  Crosshair,
  Target,
  Shield,
  Eye,
  Megaphone,
} from 'lucide-react';
import { ME, REGIONS } from '../data/mock';
import { api } from '../services';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../context/ToastContext';

const STEPS = [
  { id: 'steam', label: 'Steam', icon: Gamepad2 },
  { id: 'perfil', label: 'Estilo', icon: MapPin },
  { id: 'ac', label: 'Anti-cheat', icon: ShieldCheck },
  { id: 'pronto', label: 'Pronto', icon: Rocket },
];

const ROLES = [
  { id: 'entry', label: 'Entry', icon: Crosshair },
  { id: 'awp', label: 'AWPer', icon: Target },
  { id: 'support', label: 'Suporte', icon: Shield },
  { id: 'lurker', label: 'Lurker', icon: Eye },
  { id: 'igl', label: 'IGL', icon: Megaphone },
];

// Tutorial do primeiro acesso. Fica salvo em Configurações (onboarded) para não aparecer de novo.
export default function Onboarding() {
  const settings = useQuery(() => api.account.settings(), []);
  const [done, setDone] = useState(false);
  if (done || !settings.data || settings.data.onboarded) return null;
  return <Wizard onClose={() => setDone(true)} />;
}

function Wizard({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [steam, setSteam] = useState({ state: 'idle' }); // idle | linking | linked
  const [region, setRegion] = useState(REGIONS[0]);
  const [role, setRole] = useState('entry');
  const [ac, setAc] = useState({ downloaded: false, installed: false });
  const [saving, setSaving] = useState(false);

  const finish = async (goPlay) => {
    setSaving(true);
    await api.account.completeOnboarding({
      steamLinked: steam.state === 'linked',
      region,
      role,
      anticheat: ac.installed,
    });
    toast.success('Tudo pronto!', 'Boa sorte nas ranqueadas.');
    onClose();
    if (goPlay) navigate('/jogar');
  };

  const linkSteam = () => {
    setSteam({ state: 'linking' });
    setTimeout(() => setSteam({ state: 'linked' }), 900);
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide onboarding" role="dialog" aria-modal="true" aria-labelledby="ob-title">
        <ol className="ob-steps" aria-label="Etapas">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className={`${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
                aria-current={i === step ? 'step' : undefined}
              >
                <span className="ob-dot">
                  {i < step ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}
                </span>
                <span className="ob-label">{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="ob-body" key={step}>
          {step === 0 && (
            <>
              <h2 id="ob-title">Bem-vindo ao FragClub, {ME.nick}!</h2>
              <p className="muted">
                Vincule sua conta Steam para entrarmos com você nos servidores e puxar suas horas de CS2.
              </p>
              {steam.state === 'linked' ? (
                <p className="ob-ok">
                  <Check size={16} aria-hidden="true" /> Steam vinculada como <strong>{ME.nick}</strong>
                </p>
              ) : (
                <button
                  type="button"
                  className="btn btn-steam btn-lg"
                  onClick={linkSteam}
                  disabled={steam.state === 'linking'}
                >
                  {steam.state === 'linking' ? (
                    <Loader2 size={18} className="spin" aria-hidden="true" />
                  ) : (
                    <Gamepad2 size={18} aria-hidden="true" />
                  )}
                  Vincular Steam
                </button>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h2 id="ob-title">Como você joga?</h2>
              <p className="muted">Usamos isso para achar partidas com ping baixo e sugerir times.</p>
              <div className="field">
                <label htmlFor="ob-region">Região preferida</label>
                <select id="ob-region" value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <fieldset className="field">
                <legend>Função principal</legend>
                <div className="ob-roles" role="radiogroup">
                  {ROLES.map(({ id, label, icon: Icon }) => (
                    <label key={id} className={`ob-role ${role === id ? 'active' : ''}`}>
                      <input type="radio" name="role" value={id} checked={role === id} onChange={() => setRole(id)} />
                      <Icon size={20} aria-hidden="true" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <h2 id="ob-title">Instale o anti-cheat</h2>
              <p className="muted">
                Obrigatório nas ranqueadas e campeonatos. Leve, roda só enquanto você joga pelo FragClub.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setAc({ ...ac, downloaded: true })}>
                <Download size={16} aria-hidden="true" />{' '}
                {ac.downloaded ? 'Download iniciado' : 'Baixar FragClub AC (Windows · 18 MB)'}
              </button>
              <label className="check">
                <input
                  type="checkbox"
                  checked={ac.installed}
                  onChange={(e) => setAc({ ...ac, installed: e.target.checked })}
                />{' '}
                Já instalei o anti-cheat
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <h2 id="ob-title">Tudo certo!</h2>
              <ul className="ob-summary">
                <li>
                  <Gamepad2 size={16} aria-hidden="true" /> Steam:{' '}
                  {steam.state === 'linked' ? 'vinculada' : 'não vinculada (dá para fazer depois)'}
                </li>
                <li>
                  <MapPin size={16} aria-hidden="true" /> {region} · {ROLES.find((r) => r.id === role).label}
                </li>
                <li>
                  <ShieldCheck size={16} aria-hidden="true" /> Anti-cheat: {ac.installed ? 'instalado' : 'pendente'}
                </li>
              </ul>
              <p className="muted small">Você ganhou 4.850 FragPoints de boas-vindas para usar na loja.</p>
            </>
          )}
        </div>

        <div className="ob-actions">
          <button type="button" className="link-btn" onClick={() => finish(false)} disabled={saving}>
            Pular tutorial
          </button>
          <div className="row gap-sm">
            {step > 0 && (
              <button type="button" className="btn btn-ghost" onClick={back}>
                Voltar
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={next}>
                Continuar
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => finish(false)} disabled={saving}>
                  Explorar o app
                </button>
                <button type="button" className="btn btn-primary" onClick={() => finish(true)} disabled={saving}>
                  <Crosshair size={16} aria-hidden="true" /> Começar a jogar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
