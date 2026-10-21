import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag, Check } from 'lucide-react';
import { ME, FLAGS, MAPS_BY_ID } from '../data/mock';
import { COSMETICS, FREE_BANNERS } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Nick } from '../components/ui';
import { hashString } from '../utils/random';
import { SOCIALS } from './Profile';

const NICK_RE = /^[a-zA-Z0-9_.-]{3,16}$/;
const TRADE_RE = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[\w-]+$/;
const CROSSHAIR_RE = /^CSGO(-[A-Za-z0-9]{5}){5}$/;
const HUES = [null, 0, 25, 45, 140, 175, 200, 225, 260, 285, 315];
const COUNTRIES = Object.keys(FLAGS);

const SOCIAL_HINT = {
  steam: 'https://steamcommunity.com/id/seu-perfil',
  twitch: 'https://twitch.tv/seu-canal',
  instagram: 'https://instagram.com/seu-perfil',
  youtube: 'https://youtube.com/@seu-canal',
};

function bannerStyle(id) {
  if (MAPS_BY_ID[id]) return { backgroundImage: `url(/maps/${id}.jpg)` };
  return undefined;
}

export default function EditProfile() {
  const { user, profile, updateProfile } = useAuth();
  const { owns, equipped, toggleEquip } = useShop();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nick: user.nick, ...profile, socials: { ...profile.socials } });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setSocial = (k) => (e) => setForm({ ...form, socials: { ...form.socials, [k]: e.target.value.trim() } });

  const specialBanners = COSMETICS.filter((c) => c.kind === 'banner' && owns(c.id)).map((c) => c.id);
  const banners = [...FREE_BANNERS, ...specialBanners];
  const ownedCosmetics = COSMETICS.filter((c) => c.kind !== 'banner' && owns(c.id));

  const validate = () => {
    const e = {};
    if (!NICK_RE.test(form.nick)) e.nick = 'Use 3 a 16 caracteres: letras, números, _ . -';
    if (form.bio.length > 160) e.bio = 'Máximo de 160 caracteres.';
    SOCIALS.forEach(({ key }) => {
      const v = form.socials[key];
      if (v && !/^https:\/\/[^\s]+\.[^\s]+/.test(v)) e[`social-${key}`] = 'Use um link completo começando com https://';
    });
    if (form.socials.steam && !form.socials.steam.startsWith('https://steamcommunity.com/'))
      e['social-steam'] = 'O link precisa ser do steamcommunity.com.';
    if (form.tradeUrl && !TRADE_RE.test(form.tradeUrl))
      e.tradeUrl =
        'Link de troca inválido. Copie em Steam > Inventário > Ofertas de troca > Quem pode me enviar ofertas.';
    if (form.crosshair && !CROSSHAIR_RE.test(form.crosshair))
      e.crosshair = 'Código de mira inválido (formato CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX).';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`ep-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await updateProfile(form);
      navigate(`/perfil/${ME.nick}`);
    } catch (err) {
      setErrors({ nick: err.message });
      setSaving(false);
    }
  };

  const fieldErr = (k) =>
    errors[k] && (
      <span className="field-error" id={`ep-${k}-err`} role="alert">
        {errors[k]}
      </span>
    );
  const aria = (k) => ({
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': errors[k] ? `ep-${k}-err` : undefined,
  });

  return (
    <div className="page stack edit-profile">
      <Link to={`/perfil/${ME.nick}`} className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar ao perfil
      </Link>
      <header className="page-head">
        <div>
          <span className="eyebrow">Conta</span>
          <h1>Editar perfil</h1>
        </div>
      </header>

      <form onSubmit={submit} noValidate className="ep-grid">
        <div className="stack">
          <section className="card ep-section">
            <h2>Identidade</h2>
            <div className="field">
              <label htmlFor="ep-nick">Nick</label>
              <input
                id="ep-nick"
                className="input"
                value={form.nick}
                onChange={set('nick')}
                maxLength={16}
                {...aria('nick')}
              />
              {fieldErr('nick')}
            </div>
            <div className="field">
              <label htmlFor="ep-bio">
                Bio <span className="muted small">({form.bio.length}/160)</span>
              </label>
              <textarea
                id="ep-bio"
                className="input textarea"
                rows={3}
                maxLength={160}
                value={form.bio}
                onChange={set('bio')}
                placeholder="Função, mapas favoritos, horário que joga..."
                {...aria('bio')}
              />
              {fieldErr('bio')}
            </div>
            <div className="field">
              <label htmlFor="ep-country">País</label>
              <select id="ep-country" value={form.country} onChange={set('country')}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {FLAGS[c]} {c}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="card ep-section">
            <h2>Aparência</h2>
            <fieldset className="field">
              <legend>Cor do avatar</legend>
              <div className="hue-swatches">
                {HUES.map((h) => (
                  <label
                    key={String(h)}
                    className={`hue-swatch ${form.avatarHue === h ? 'active' : ''}`}
                    style={
                      h === null
                        ? undefined
                        : { background: `linear-gradient(135deg, hsl(${h} 40% 40%), hsl(${(h + 40) % 360} 40% 20%))` }
                    }
                  >
                    <input
                      type="radio"
                      name="hue"
                      checked={form.avatarHue === h}
                      onChange={() => setForm({ ...form, avatarHue: h })}
                      aria-label={h === null ? 'Automática' : `Tom ${h}`}
                    />
                    {h === null && <span className="small">Auto</span>}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Banner do perfil</legend>
              <div className="banner-options">
                {banners.map((b) => (
                  <label
                    key={b}
                    className={`banner-option ${b.startsWith('banner-') ? b : ''} ${b === 'default' ? 'banner-default' : ''} ${form.banner === b ? 'active' : ''}`}
                    style={bannerStyle(b)}
                  >
                    <input
                      type="radio"
                      name="banner"
                      checked={form.banner === b}
                      onChange={() => setForm({ ...form, banner: b })}
                    />
                    <span>
                      {b === 'default' ? 'Padrão' : (MAPS_BY_ID[b]?.name ?? COSMETICS.find((c) => c.id === b)?.name)}
                    </span>
                  </label>
                ))}
              </div>
              <Link to="/loja?aba=cosmeticos" className="link-muted small">
                <ShoppingBag size={13} aria-hidden="true" /> Banners animados na loja
              </Link>
            </fieldset>

            <div className="field">
              <span className="field-label">Cosméticos</span>
              {ownedCosmetics.length ? (
                <div className="ep-cosmetics">
                  {ownedCosmetics.map((c) => {
                    const on = equipped[c.kind] === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`btn btn-sm ${on ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => toggleEquip(c.id)}
                        aria-pressed={on}
                      >
                        {on && <Check size={14} aria-hidden="true" />} {c.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted small">
                  Você ainda não tem molduras ou estilos de nick. <Link to="/loja?aba=cosmeticos">Ver na loja</Link>
                </p>
              )}
            </div>
          </section>

          <section className="card ep-section">
            <h2>Redes sociais</h2>
            {SOCIALS.map(({ key, label, icon: Icon }) => (
              <div className="field" key={key}>
                <label htmlFor={`ep-social-${key}`} className="row gap-xs">
                  <Icon size={14} aria-hidden="true" /> {label}
                </label>
                <input
                  id={`ep-social-${key}`}
                  className="input"
                  type="url"
                  inputMode="url"
                  value={form.socials[key]}
                  onChange={setSocial(key)}
                  placeholder={SOCIAL_HINT[key]}
                  {...aria(`social-${key}`)}
                />
                {fieldErr(`social-${key}`)}
              </div>
            ))}
          </section>

          <section className="card ep-section">
            <h2>CS2</h2>
            <div className="field">
              <label htmlFor="ep-crosshair">Código da mira</label>
              <input
                id="ep-crosshair"
                className="input mono"
                value={form.crosshair}
                onChange={(e) => setForm({ ...form, crosshair: e.target.value.trim() })}
                placeholder="CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                {...aria('crosshair')}
              />
              {fieldErr('crosshair')}
            </div>
            <div className="field">
              <label htmlFor="ep-tradeUrl">Link de troca da Steam</label>
              <input
                id="ep-tradeUrl"
                className="input mono"
                type="url"
                value={form.tradeUrl}
                onChange={(e) => setForm({ ...form, tradeUrl: e.target.value.trim() })}
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
                {...aria('tradeUrl')}
              />
              <span className="muted small">Necessário para resgatar skins da loja.</span>
              {fieldErr('tradeUrl')}
            </div>
            <label className="check">
              <input type="checkbox" checked={form.publicHistory} onChange={set('publicHistory')} /> Histórico de
              partidas público
            </label>
          </section>
        </div>

        <aside className="ep-preview-col">
          <section className="card ep-preview" aria-label="Pré-visualização">
            <div
              className={`ep-preview-banner ${form.banner.startsWith('banner-') ? form.banner : ''} ${form.banner === 'default' ? 'banner-default' : ''}`}
              style={bannerStyle(form.banner)}
            />
            <div className="ep-preview-body">
              <PreviewAvatar hue={form.avatarHue} nick={form.nick || ME.nick} />
              <strong>
                <Nick nick={ME.nick} className="ep-preview-nick-style">
                  {form.nick}
                </Nick>
              </strong>
              <span className="muted small">
                {FLAGS[form.country]} {form.country}
              </span>
              {form.bio && <p className="small ep-preview-bio">{form.bio}</p>}
            </div>
          </section>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
            {saving && <Loader2 size={18} className="spin" aria-hidden="true" />} Salvar alterações
          </button>
          <Link to={`/perfil/${ME.nick}`} className="btn btn-ghost btn-block">
            Cancelar
          </Link>
        </aside>
      </form>
    </div>
  );
}

// Avatar com o tom ainda não salvo (o Avatar padrão usa o tom salvo)
function PreviewAvatar({ hue, nick }) {
  const { equipped } = useShop();
  const h = hue ?? hashString(ME.nick) % 360;
  return (
    <span
      className={`avatar ${equipped.frame ?? ''}`}
      aria-hidden="true"
      style={{
        width: 84,
        height: 84,
        fontSize: 32,
        background: `linear-gradient(135deg, hsl(${h} 40% 40%), hsl(${(h + 40) % 360} 40% 20%))`,
      }}
    >
      {nick.slice(0, 2).toUpperCase()}
    </span>
  );
}
