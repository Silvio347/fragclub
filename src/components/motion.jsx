import { useEffect, useRef, useState } from 'react';

const REVEAL_MS = 700;

function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return [ref, inView];
}

// Revela o conteúdo com fade/slide quando entra na tela.
// O atraso só vale para a entrada: depois disso é removido para não atrasar hovers.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!inView || !delay) return undefined;
    const t = setTimeout(() => setSettled(true), delay + REVEAL_MS);
    return () => clearTimeout(t);
  }, [inView, delay]);
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={delay && !settled ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const fmt = (n, suffix) => `${n.toLocaleString('pt-BR')}${suffix}`;

// Número que conta de 0 até o valor quando aparece.
// O valor final fica reservado (invisível) por baixo, então a largura não muda durante a contagem.
export function CountUp({ to, duration = 1600, suffix = '' }) {
  const [ref, inView] = useInView();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className="countup">
      <span className="countup-ghost" aria-hidden="true">
        {fmt(to, suffix)}
      </span>
      <span className="countup-value" aria-hidden="true">
        {fmt(value, suffix)}
      </span>
      <span className="sr-only">{fmt(to, suffix)}</span>
    </span>
  );
}
