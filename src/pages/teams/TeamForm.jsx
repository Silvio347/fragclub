import { useState } from 'react';
import { REGIONS } from '../../data/mock';
import { TEAM_COLORS } from '../../data/teams';
import { TeamLogo } from '../../components/ui';

const TAG_RE = /^[A-Z0-9]{2,5}$/;

export const EMPTY_TEAM = {
  name: '',
  tag: '',
  color: TEAM_COLORS[0],
  region: REGIONS[0],
  description: '',
  recruiting: true,
  minLevel: 1,
};

export function validateTeam(t) {
  const e = {};
  if (t.name.trim().length < 3 || t.name.trim().length > 24) e.name = 'O nome precisa ter entre 3 e 24 caracteres.';
  if (!TAG_RE.test(t.tag)) e.tag = 'A tag precisa ter de 2 a 5 letras ou números.';
  if (t.description.length > 160) e.description = 'Máximo de 160 caracteres.';
  return e;
}

// Formulário compartilhado entre "Criar time" e "Configurações"
export default function TeamForm({ initial = EMPTY_TEAM, submitLabel, onSubmit, onCancel, busy }) {
  const [t, setT] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setT({ ...t, [k]: k === 'tag' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : k === 'minLevel' ? Number(v) : v });
  };

  const [sending, setSending] = useState(false);

  // onSubmit pode ser assíncrono (serviço); erros do servidor aparecem no formulário
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validateTeam(t);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    try {
      await onSubmit({ ...t, name: t.name.trim() });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSending(false);
    }
  };

  const err = (k) =>
    errors[k] && (
      <span className="field-error" id={`team-${k}-err`} role="alert">
        {errors[k]}
      </span>
    );

  return (
    <form className="team-form" onSubmit={submit} noValidate>
      <div className="team-form-preview">
        <TeamLogo tag={t.tag || 'TAG'} color={t.color} size={64} />
        <div>
          <strong>{t.name || 'Nome do time'}</strong>
          <span className="muted small">
            [{t.tag || 'TAG'}] · {t.region}
          </span>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="team-name">Nome</label>
          <input
            id="team-name"
            className="input"
            value={t.name}
            onChange={set('name')}
            maxLength={24}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? 'team-name-err' : undefined}
          />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="team-tag">Tag</label>
          <input
            id="team-tag"
            className="input"
            value={t.tag}
            onChange={set('tag')}
            maxLength={5}
            placeholder="EX: BRB"
            aria-invalid={!!errors.tag || undefined}
            aria-describedby={errors.tag ? 'team-tag-err' : undefined}
          />
          {err('tag')}
        </div>
      </div>

      <fieldset className="field color-field">
        <legend>Cor do time</legend>
        <div className="swatches">
          {TEAM_COLORS.map((c) => (
            <label key={c} className={`swatch ${t.color === c ? 'active' : ''}`} style={{ background: c }}>
              <input
                type="radio"
                name="team-color"
                value={c}
                checked={t.color === c}
                onChange={set('color')}
                aria-label={`Cor ${c}`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label htmlFor="team-region">Região</label>
          <select id="team-region" value={t.region} onChange={set('region')}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="team-level">Level mínimo para entrar</label>
          <select id="team-level" value={t.minLevel} onChange={set('minLevel')}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i + 1}>
                Level {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="team-desc">
          Descrição <span className="muted small">({t.description.length}/160)</span>
        </label>
        <textarea
          id="team-desc"
          className="input textarea"
          value={t.description}
          onChange={set('description')}
          maxLength={160}
          rows={3}
          placeholder="Horário de treino, mapas, o que procuram..."
        />
        {err('description')}
      </div>

      <label className="check">
        <input type="checkbox" checked={t.recruiting} onChange={set('recruiting')} /> Aberto para novos membros
        (recrutando)
      </label>

      {errors.form && (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      )}

      <div className="row gap-sm form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy || sending}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
