import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Check,
  Minus,
  Zap,
  BarChart3,
  Server,
  Film,
  Trophy,
  Palette,
  Headphones,
  Target,
  ShieldCheck,
  Loader2,
  QrCode,
  CreditCard,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui';

const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const PLANS = [
  { id: 'mensal', name: 'Mensal', monthly: 25, months: 1, note: 'Cancele quando quiser' },
  { id: 'trimestral', name: 'Trimestral', monthly: 22, months: 3, note: 'Economize 12%' },
  { id: 'anual', name: 'Anual', monthly: 19.9, months: 12, note: 'Economize 20%', best: true },
];

const HIGHLIGHTS = [
  { icon: Zap, title: 'Fila prioritária', text: 'Encontre partida mais rápido na ranqueada.' },
  {
    icon: BarChart3,
    title: 'Stats avançadas',
    text: 'Rating e Round Swing por mapa e por lado, histórico da carreira inteira.',
  },
  { icon: Server, title: 'Servidores exclusivos', text: 'Retake e DM só para Premium, sempre com vaga.' },
  { icon: Film, title: 'Demos das partidas', text: 'Baixe a demo de qualquer partida para revisar.' },
];

// [benefício, grátis, premium] — true/false ou texto
const COMPARE = [
  { group: 'Jogar' },
  ['Ranqueada 5v5', true, true],
  ['Lobbies e desafios', true, true],
  ['Servidores de Retake e DM', 'Públicos', 'Públicos + exclusivos'],
  ['Fila prioritária', false, true],
  ['Anti-cheat', true, true],
  { group: 'Estatísticas' },
  ['Rating 3.0, KAST, ADR', 'Últimas 20 partidas', 'Carreira completa'],
  ['Round Swing e stats por lado (CT/TR)', false, true],
  ['Comparar com outros jogadores', false, true],
  ['Download de demos', false, true],
  { group: 'Competitivo' },
  ['Campeonatos abertos', true, true],
  ['Campeonatos exclusivos Premium', false, true],
  ['Missões diárias', '3 por dia', '6 por dia + XP em dobro'],
  { group: 'Perfil' },
  ['Selo Premium e banner personalizado', false, true],
  ['Suporte', 'Padrão', 'Prioritário'],
];

const FAQ = [
  [
    'Premium dá vantagem dentro do jogo?',
    'Não. ELO, matchmaking e anti-cheat são iguais para todo mundo. O Premium é sobre conveniência, estatísticas e conteúdo extra.',
  ],
  ['Posso cancelar quando quiser?', 'Sim. Você continua com os benefícios até o fim do período que já pagou.'],
  ['Quais formas de pagamento?', 'Pix e cartão de crédito. No plano anual também dá para parcelar no cartão.'],
];

function Cell({ value }) {
  if (value === true) return <Check size={18} className="text-win" aria-label="Incluso" />;
  if (value === false) return <Minus size={18} className="muted" aria-label="Não incluso" />;
  return <span>{value}</span>;
}

function Checkout({ plan, onClose }) {
  const { subscribe } = useAuth();
  const [method, setMethod] = useState('pix');
  const [step, setStep] = useState('form'); // form | loading | done
  const total = plan.monthly * plan.months;

  const confirm = async () => {
    setStep('loading');
    await subscribe(plan.id);
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Modal title="Assinatura ativa" onClose={onClose}>
        <div className="checkout-done">
          <PartyPopper size={40} className="accent" aria-hidden="true" />
          <h3>Bem-vindo ao Premium!</h3>
          <p className="muted">Seus benefícios já estão liberados. Bom jogo.</p>
          <Link to="/jogar" className="btn btn-primary btn-lg btn-block" onClick={onClose}>
            Jogar agora
          </Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Finalizar assinatura" onClose={step === 'loading' ? undefined : onClose}>
      <div className="checkout">
        <div className="checkout-summary">
          <div>
            <strong>Premium {plan.name}</strong>
            <span className="muted small">{plan.months > 1 ? `${brl(plan.monthly)}/mês` : 'Renovação mensal'}</span>
          </div>
          <strong className="checkout-total">{brl(total)}</strong>
        </div>

        <fieldset className="pay-methods">
          <legend className="small muted">Forma de pagamento</legend>
          <label className={`pay-method ${method === 'pix' ? 'active' : ''}`}>
            <input type="radio" name="pay" value="pix" checked={method === 'pix'} onChange={() => setMethod('pix')} />
            <QrCode size={18} aria-hidden="true" /> Pix <span className="tag tag-accent">Aprovação na hora</span>
          </label>
          <label className={`pay-method ${method === 'card' ? 'active' : ''}`}>
            <input
              type="radio"
              name="pay"
              value="card"
              checked={method === 'card'}
              onChange={() => setMethod('card')}
            />
            <CreditCard size={18} aria-hidden="true" /> Cartão de crédito
          </label>
        </fieldset>

        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={confirm}
          disabled={step === 'loading'}
        >
          {step === 'loading' ? (
            <>
              <Loader2 size={18} className="spin" aria-hidden="true" /> Processando...
            </>
          ) : (
            `Confirmar · ${brl(total)}`
          )}
        </button>
        <p className="muted small center-text">Ambiente de demonstração: nenhum pagamento é cobrado.</p>
      </div>
    </Modal>
  );
}

export default function Premium() {
  const { user, cancelSubscription } = useAuth();
  const [checkout, setCheckout] = useState(null);
  // Premium também pode vir da loja (FragPoints), com plano "pontos-Xd"
  const activePlan =
    PLANS.find((p) => p.id === user?.premium?.plan) ??
    (user?.premium
      ? { id: user.premium.plan, name: `${user.premium.plan.replace(/\D/g, '')} dias (FragPoints)` }
      : null);

  return (
    <div className="page stack premium-page">
      <section className="card premium-hero">
        <div className="premium-hero-glow" aria-hidden="true" />
        <span className="premium-crown" aria-hidden="true">
          <Crown size={30} />
        </span>
        <h1>
          FragClub <span className="lp-gradient">Premium</span>
        </h1>
        <p className="muted">Mais rápido na fila, mais dados para evoluir e servidores só seus. Sem pay-to-win.</p>
        {activePlan && (
          <div className="premium-active" role="status">
            <ShieldCheck size={16} aria-hidden="true" /> Você é Premium · plano {activePlan.name}
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelSubscription}>
              Cancelar assinatura
            </button>
          </div>
        )}
      </section>

      <section className="plan-grid" aria-label="Planos">
        {PLANS.map((p, i) => {
          const current = activePlan?.id === p.id;
          return (
            <article
              key={p.id}
              className={`card plan ${p.best ? 'plan-best' : ''}`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {p.best && <span className="plan-badge">Mais popular</span>}
              <h2>{p.name}</h2>
              <div className="plan-price">
                <span className="plan-currency">R$</span>
                <strong>{p.monthly.toFixed(2).replace('.', ',').replace(',00', '')}</strong>
                <span className="muted">/mês</span>
              </div>
              <p className="muted small">
                {p.months === 1 ? 'Cobrado todo mês' : `${brl(p.monthly * p.months)} a cada ${p.months} meses`}
              </p>
              <span className={`plan-note ${p.months > 1 ? 'accent' : 'muted'}`}>{p.note}</span>
              <button
                type="button"
                className={`btn btn-lg btn-block ${p.best ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCheckout(p)}
                disabled={current}
              >
                {current ? 'Plano atual' : activePlan ? 'Trocar para este' : 'Assinar'}
              </button>
            </article>
          );
        })}
      </section>

      <section className="highlight-grid" aria-label="Principais benefícios">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card highlight">
            <span className="stat-icon">
              <Icon size={18} aria-hidden="true" />
            </span>
            <strong>{title}</strong>
            <p className="muted small">{text}</p>
          </div>
        ))}
      </section>

      <section className="card table-wrap" aria-labelledby="compare-title">
        <h2 id="compare-title" className="compare-title">
          Grátis vs Premium
        </h2>
        <table className="table compare-table">
          <thead>
            <tr>
              <th scope="col">Benefício</th>
              <th scope="col">Grátis</th>
              <th scope="col" className="compare-premium-col">
                <Crown size={13} aria-hidden="true" /> Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((row) =>
              row.group ? (
                <tr key={row.group} className="compare-group">
                  <th scope="rowgroup" colSpan={3}>
                    {row.group === 'Jogar' && <Target size={14} aria-hidden="true" />}
                    {row.group === 'Estatísticas' && <BarChart3 size={14} aria-hidden="true" />}
                    {row.group === 'Competitivo' && <Trophy size={14} aria-hidden="true" />}
                    {row.group === 'Perfil' && <Palette size={14} aria-hidden="true" />}
                    {row.group}
                  </th>
                </tr>
              ) : (
                <tr key={row[0]}>
                  <th scope="row">{row[0]}</th>
                  <td>
                    <Cell value={row[1]} />
                  </td>
                  <td className="compare-premium-col">
                    <Cell value={row[2]} />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      <section className="card" aria-labelledby="faq-title">
        <h2 id="faq-title" className="card-head">
          <Headphones size={16} aria-hidden="true" /> Perguntas frequentes
        </h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {checkout && <Checkout plan={checkout} onClose={() => setCheckout(null)} />}
    </div>
  );
}
