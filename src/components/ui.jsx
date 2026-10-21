import { useId } from 'react';
import { hashString } from '../utils/random';
import { levelColor } from '../utils/levels';

export function Avatar({ nick, size = 36, status }) {
  const hue = hashString(nick) % 360;
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, hsl(${hue} 40% 40%), hsl(${(hue + 40) % 360} 40% 20%))`,
      }}
    >
      {nick.slice(0, 2).toUpperCase()}
      {status && <span className={`avatar-status ${status}`} />}
    </span>
  );
}

// Badge de level em tons de roxo; level 10 ganha gradiente e brilho
export function LevelBadge({ level, size = 30 }) {
  const gradId = useId();
  const color = levelColor(level);
  const max = level >= 10;
  const c = size / 2;
  const r = c - 3;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className={`level-badge ${max ? 'level-max' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Level ${level}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {max && (
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        )}
        <circle cx={c} cy={c} r={r} fill="#14111c" stroke="#2a2537" strokeWidth="3" />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={max ? `url(#${gradId})` : color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(circ * level) / 10} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <span className="level-num" style={{ color, fontSize: Math.round(size * 0.42) }}>
        {level}
      </span>
    </span>
  );
}

export function MapThumb({ map, height = 90, children, className = '', showName = true }) {
  return (
    <div
      className={`map-thumb ${className}`}
      style={{
        height,
        backgroundColor: map.colors[1],
        backgroundImage: `url(/maps/${map.id}.jpg), linear-gradient(135deg, ${map.colors[0]}, ${map.colors[1]})`,
      }}
    >
      {showName && <span className="map-thumb-name">{map.name}</span>}
      {children}
    </div>
  );
}

export function Progress({ value, max = 100, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, highlight, valueClass = '' }) {
  return (
    <div className={`card stat-card ${highlight ? 'stat-highlight' : ''}`}>
      {Icon && (
        <span className="stat-icon">
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      <div>
        <div className={`stat-value ${valueClass}`}>{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

// Modal genérico acessível (fecha com Esc e clique fora)
export function Modal({ title, onClose, children, wide }) {
  const titleId = useId();
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
    >
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar" autoFocus>
              ✕
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
