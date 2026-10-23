import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, CheckCircle2, Trash2, Lock, Pin, Eye, ShieldCheck } from 'lucide-react';
import { api, realtime, FORUM_CATEGORIES, FORUM_LIMITS } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import { timeAgo } from '../../context/NotificationsContext';
import { useToast } from '../../context/ToastContext';
import { Async, PageSkeleton } from '../../components/Async';
import { Avatar, LevelBadge, Modal } from '../../components/ui';

const CAT_NAME = Object.fromEntries(FORUM_CATEGORIES.map((c) => [c.id, c.name]));

function Author({ a, createdAt }) {
  const name = a.staff ? (
    <strong className="accent">{a.nick}</strong>
  ) : (
    <Link to={`/perfil/${a.nick}`} className="strong">
      {a.nick}
    </Link>
  );
  return (
    <div className="fo-author">
      <Avatar nick={a.nick} size={40} />
      <div>
        <span className="row gap-xs">
          {name}
          {a.staff ? (
            <span className="tag tag-accent">
              <ShieldCheck size={11} aria-hidden="true" /> Equipe
            </span>
          ) : (
            <LevelBadge level={a.level} size={20} />
          )}
        </span>
        <span className="muted small">{timeAgo(createdAt)}</span>
      </div>
    </div>
  );
}

function Post({ p, children, solved }) {
  return (
    <article className={`card fo-post ${solved ? 'solved' : ''}`}>
      {solved && (
        <span className="fo-solved-flag">
          <CheckCircle2 size={14} aria-hidden="true" /> Resposta que resolveu
        </span>
      )}
      <Author a={p.author} createdAt={p.createdAt} />
      {/* Texto puro com quebras de linha; o React escapa o conteúdo (sem HTML de usuário) */}
      <p className="fo-body">{p.body}</p>
      <div className="fo-actions">{children}</div>
    </article>
  );
}

function ThreadView({ t, setData }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'thread' | replyId

  const act = (promise, ok) =>
    promise.then(
      (next) => {
        if (next?.id) setData(next);
        if (ok) toast.success(ok);
        return next;
      },
      (e) => toast.error('Não foi possível concluir', e.message),
    );

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await act(api.forum.reply(t.id, reply), 'Resposta publicada');
    if (r) setReply('');
    setBusy(false);
  };

  const like = (replyId) => act(api.forum.like(t.id, replyId));
  const [rMin, rMax] = FORUM_LIMITS.reply;
  const solvedFirst = t.solvedReply
    ? [...t.replies].sort((a, b) => (b.id === t.solvedReply) - (a.id === t.solvedReply))
    : t.replies;

  return (
    <div className="page stack fo-thread">
      <Link to={`/forum?categoria=${t.category}`} className="link-muted back-link">
        <ArrowLeft size={14} aria-hidden="true" /> {CAT_NAME[t.category]}
      </Link>

      <header className="stack" style={{ gap: 8 }}>
        <div className="row gap-xs wrap">
          <span className="tag">{CAT_NAME[t.category]}</span>
          {t.pinned && (
            <span className="tag tag-accent">
              <Pin size={11} aria-hidden="true" /> Fixado
            </span>
          )}
          {t.solved && (
            <span className="tag tag-win">
              <CheckCircle2 size={11} aria-hidden="true" /> Resolvido
            </span>
          )}
          <span className="muted small row gap-xs">
            <Eye size={13} aria-hidden="true" /> {t.views} visualizações
          </span>
        </div>
        <h1>{t.title}</h1>
      </header>

      <Post p={t}>
        <button
          type="button"
          className={`fo-like ${t.liked ? 'on' : ''}`}
          onClick={() => like(null)}
          aria-pressed={t.liked}
        >
          <Heart size={14} aria-hidden="true" /> {t.likes}
          <span className="sr-only">curtidas, curtir tópico</span>
        </button>
        {t.mine && (
          <button type="button" className="link-btn danger" onClick={() => setConfirm('thread')}>
            <Trash2 size={13} aria-hidden="true" /> Excluir tópico
          </button>
        )}
      </Post>

      <h2 className="fo-replies-title">
        {t.replies.length} {t.replies.length === 1 ? 'resposta' : 'respostas'}
      </h2>
      {t.solvable && t.mine && !t.solved && t.replies.length > 0 && (
        <p className="muted small">
          Alguma resposta resolveu? Marque como solução para ajudar quem tiver a mesma dúvida.
        </p>
      )}

      {solvedFirst.map((r) => (
        <Post key={r.id} p={r} solved={r.id === t.solvedReply}>
          <button
            type="button"
            className={`fo-like ${r.liked ? 'on' : ''}`}
            onClick={() => like(r.id)}
            aria-pressed={r.liked}
          >
            <Heart size={14} aria-hidden="true" /> {r.likes}
            <span className="sr-only">curtidas, curtir resposta de {r.author.nick}</span>
          </button>
          {t.solvable && t.mine && !r.mine && (
            <button type="button" className="link-btn" onClick={() => act(api.forum.markSolved(t.id, r.id))}>
              <CheckCircle2 size={13} aria-hidden="true" />{' '}
              {r.id === t.solvedReply ? 'Desmarcar solução' : 'Marcar como solução'}
            </button>
          )}
          {r.mine && (
            <button type="button" className="link-btn danger" onClick={() => setConfirm(r.id)}>
              <Trash2 size={13} aria-hidden="true" /> Excluir
            </button>
          )}
        </Post>
      ))}

      {t.locked ? (
        <p className="card muted row gap-xs">
          <Lock size={14} aria-hidden="true" /> Este tópico está fechado para respostas.
        </p>
      ) : (
        <form className="card fo-reply" onSubmit={send}>
          <label htmlFor="fo-reply" className="strong">
            Responder
          </label>
          <textarea
            id="fo-reply"
            className="input textarea"
            rows={4}
            maxLength={rMax}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva sua resposta. Seja gentil e objetivo."
          />
          <div className="row between">
            <span className="muted small">
              {reply.trim().length}/{rMax}
            </span>
            <button type="submit" className="btn btn-primary" disabled={busy || reply.trim().length < rMin}>
              Publicar resposta
            </button>
          </div>
        </form>
      )}

      {confirm && (
        <Modal title={confirm === 'thread' ? 'Excluir tópico' : 'Excluir resposta'} onClose={() => setConfirm(null)}>
          <p className="muted modal-sub">
            {confirm === 'thread' ? 'O tópico e todas as respostas serão apagados.' : 'Sua resposta será apagada.'}
          </p>
          <div className="row gap-sm form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                if (confirm === 'thread') {
                  const ok = await act(api.forum.removeThread(t.id), 'Tópico excluído');
                  if (ok) navigate(`/forum?categoria=${t.category}`);
                } else {
                  await act(api.forum.removeReply(t.id, confirm), 'Resposta excluída');
                }
                setConfirm(null);
              }}
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Thread() {
  const { id } = useParams();
  const query = useQuery(() => api.forum.get(id), [id]);
  const { setData } = query;
  // Respostas que chegam (ex.: equipe respondendo) aparecem sem recarregar
  useEffect(
    () => realtime.on('forum:changed', () => api.forum.get(id, { view: false }).then(setData, () => {})),
    [id, setData],
  );
  return (
    <Async query={query} skeleton={<PageSkeleton rows={5} />}>
      {(t) => <ThreadView t={t} setData={query.setData} />}
    </Async>
  );
}
