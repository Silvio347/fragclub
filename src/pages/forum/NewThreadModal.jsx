import { useState } from 'react';
import { api, FORUM_CATEGORIES, FORUM_LIMITS } from '../../services';
import { Modal } from '../../components/ui';

export default function NewThreadModal({ initialCategory, onClose, onCreated }) {
  const [form, setForm] = useState({
    category: FORUM_CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : 'geral',
    title: '',
    body: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tMin, tMax] = FORUM_LIMITS.title;
  const [bMin, bMax] = FORUM_LIMITS.body;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onCreated(await api.forum.create(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const titleLen = form.title.trim().length;
  const bodyLen = form.body.trim().length;
  const cat = FORUM_CATEGORIES.find((c) => c.id === form.category);

  return (
    <Modal title="Novo tópico" onClose={onClose} wide>
      <form className="fo-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="nt-cat">Categoria</label>
          <select id="nt-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {FORUM_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="muted small">{cat.desc}</span>
        </div>
        <div className="field">
          <label htmlFor="nt-title">
            Título{' '}
            <span className="muted small">
              ({titleLen}/{tMax})
            </span>
          </label>
          <input
            id="nt-title"
            className="input"
            maxLength={tMax}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Resuma sua dúvida ou assunto em uma frase"
          />
        </div>
        <div className="field">
          <label htmlFor="nt-body">
            Texto{' '}
            <span className="muted small">
              ({bodyLen}/{bMax})
            </span>
          </label>
          <textarea
            id="nt-body"
            className="input textarea"
            rows={8}
            maxLength={bMax}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Dê detalhes: o que aconteceu, o que você já tentou, prints ou ID da partida..."
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="row gap-sm form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || titleLen < tMin || bodyLen < bMin}>
            Publicar
          </button>
        </div>
      </form>
    </Modal>
  );
}
