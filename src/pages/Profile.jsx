import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star, Target, Activity, Flame, Swords, TrendingUp, UserPlus, Crown, Calendar, ChevronRight, Pencil, Check, Crosshair, Gamepad2, Twitch, Instagram, Youtube,
} from 'lucide-react';
import { getPlayer, getMatchHistory, getEloHistory, getMapStats, ME, FLAGS, MAPS_BY_ID } from '../data/mock';
import { PUBLIC_TEAMS } from '../data/teams';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamsContext';
import { levelProgress, ratingClass } from '../utils/levels';
import { Avatar, LevelBadge, MapThumb, Nick, Progress, StatCard, TeamLogo } from '../components/ui';
import MatchList from '../components/MatchList';

export const SOCIALS = [
  { key: 'steam', label: 'Steam', icon: Gamepad2 },
  { key: 'twitch', label: 'Twitch', icon: Twitch },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
];

// Gráfico de ELO: linha em SVG + pontos em HTML (focáveis) com tooltip da partida
function EloChart({ points }) {
  const [active, setActive] = useState(null);
  const w = 600;
  const h = 200;
  const padX = 14;
  const padY = 18;
  const elos = points.map((p) => p.elo);
  const min = Math.min(...elos) - 20;
  const max = Math.max(...elos) + 20;
  const x = (i) => padX + (i / (points.length - 1)) * (w - padX * 2);
  const y = (v) => h - padY - ((v - min) / (max - min)) * (h - padY * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.elo).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${h} L${x(0)},${h} Z`;
  const delta = elos[elos.length - 1] - elos[0];
  const cur = active !== null ? points[active] : null;

  return (
    <figure className="elo-chart">
      <figcaption className="row between">
        <span className="muted small">Últimas {points.length - 1} partidas · passe o mouse nos pontos</span>
        <span className={delta >= 0 ? 'text-win' : 'text-loss'}>
          {delta >= 0 ? '+' : ''}
          {delta} ELO
        </span>
      </figcaption>
      <div className="elo-plot" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="eloFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#26262e" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill="url(#eloFill)" />
          <path d={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {cur && <line x1={x(active)} x2={x(active)} y1="0" y2={h} stroke="#8b5cf6" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />}
        </svg>

        {points.map((p, i) => {
          const label = p.match
            ? `${p.elo} ELO, ${p.match.won ? 'vitória' : 'derrota'} ${p.match.scoreUs} a ${p.match.scoreThem} na ${p.match.map.name}, rating ${p.match.rating.toFixed(2)}`
            : `${p.elo} ELO, início do período`;
          return (
            <button
              key={i}
              type="button"
              className={`elo-dot ${p.match ? (p.match.won ? 'win' : 'loss') : ''} ${active === i ? 'active' : ''}`}
              style={{ left: `${(x(i) / w) * 100}%`, top: `${(y(p.elo) / h) * 100}%` }}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={label}
            />
          );
        })}

        {cur && (
          <div
            className={`elo-tooltip ${active > points.length * 0.7 ? 'left' : ''}`}
            style={{ left: `${(x(active) / w) * 100}%`, top: `${(y(cur.elo) / h) * 100}%` }}
            role="tooltip"
          >
            <div className="row between gap-sm">
              <strong>{cur.elo} ELO</strong>
              {cur.match && (
                <span className={`elo-delta ${cur.match.eloDelta > 0 ? 'up' : 'down'}`}>
                  {cur.match.eloDelta > 0 ? '+' : ''}
                  {cur.match.eloDelta}
                </span>
              )}
            </div>
            {cur.match ? (
              <>
                <span className="muted small">
                  {cur.match.map.name} ·{' '}
                  <span className={cur.match.won ? 'text-win' : 'text-loss'}>
                    {cur.match.scoreUs}:{cur.match.scoreThem}
                  </span>
                </span>
                <dl className="tooltip-stats">
                  <div>
                    <dt>Rating</dt>
                    <dd className={ratingClass(cur.match.rating)}>{cur.match.rating.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt>K/D/A</dt>
                    <dd>
                      {cur.match.kills}/{cur.match.deaths}/{cur.match.assists}
                    </dd>
                  </div>
                  <div>
                    <dt>KAST</dt>
                    <dd>{cur.match.kast}%</dd>
                  </div>
                  <div>
                    <dt>ADR</dt>
                    <dd>{cur.match.adr}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <span className="muted small">Início do período</span>
            )}
          </div>
        )}
      </div>
    </figure>
  );
}

const fmtSigned = (n, suffix = '') => `${n > 0 ? '+' : ''}${n}${suffix}`;

export default function Profile() {
  const { nick } = useParams();
  const player = useMemo(() => getPlayer(nick), [nick]);
  const history = useMemo(() => getMatchHistory(player.nick, 12), [player]);
  const eloPoints = useMemo(() => getEloHistory(player, 20), [player]);
  const mapStats = useMemo(() => getMapStats(player.nick), [player]);
  const prog = levelProgress(player.elo);
  const isMe = player.nick === ME.nick;
  const { user, profile } = useAuth();
  const { myTeams } = useTeams();
  const [requested, setRequested] = useState(false);
  const [copied, setCopied] = useState(false);

  const details = [
    ['Opening duels vencidos', `${player.openingSuccess}%`],
    ['Clutches vencidos', player.clutches],
    ['Multi-kills', player.multiKills],
    ['Trade kills', `${player.tradeKills}%`],
    ['Dano de utilitária / round', player.utilityDmg],
    ['Flash assists / round', player.flashAssists.toFixed(2)],
    ['Headshot', `${player.hs}%`],
    ['Partidas', player.matches],
  ];

  const p = isMe ? profile : null;
  const banner = p?.banner ?? 'default';
  const bannerProps = MAPS_BY_ID[banner]
    ? { className: 'profile-banner banner-map', style: { backgroundImage: `linear-gradient(180deg, rgba(13,13,16,0.1), rgba(13,13,16,0.75)), url(/maps/${banner}.jpg)` } }
    : { className: `profile-banner ${banner.startsWith('banner-') ? banner : ''}` };
  const socials = p ? SOCIALS.filter((s) => p.socials[s.key]) : [];
  const playerTeams = isMe ? myTeams : PUBLIC_TEAMS.filter((t) => t.members.some((m) => m.nick === player.nick));

  const copyCrosshair = async () => {
    try {
      await navigator.clipboard.writeText(p.crosshair);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="page stack">
      <section className="card profile-head">
        <div {...bannerProps} aria-hidden="true" />
        <div className="profile-info">
          <Avatar nick={player.nick} size={104} />
          <div className="profile-name">
            <h1>
              <Nick nick={player.nick} />{' '}
              {(isMe ? !!user?.premium : player.premium) && (
                <span className="tag tag-accent">
                  <Crown size={12} aria-hidden="true" /> Premium
                </span>
              )}
            </h1>
            {p?.bio && <p className="profile-bio">{p.bio}</p>}
            <p className="muted row gap-sm wrap">
              <span>
                {FLAGS[isMe ? p.country : player.country]} {isMe ? p.country : player.country}
              </span>
              <span className="row gap-xs">
                <Calendar size={14} aria-hidden="true" /> Membro desde {player.memberSince}
              </span>
              <span>{player.matches} partidas</span>
            </p>
          </div>
          <div className="profile-level">
            <LevelBadge level={player.level} size={64} />
            <div>
              <div className="elo-big">
                {player.elo} <small>ELO</small>
              </div>
              <Progress value={prog.pct} label="Progresso para o próximo level" />
              <span className="muted small">{prog.next ? `${prog.toNext} para o level ${prog.next}` : 'Level máximo'}</span>
            </div>
          </div>
          {isMe ? (
            <Link to="/perfil/editar" className="btn btn-ghost">
              <Pencil size={16} aria-hidden="true" /> Editar perfil
            </Link>
          ) : (
            <button type="button" className={`btn ${requested ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setRequested((r) => !r)}>
              {requested ? (
                <>
                  <Check size={16} aria-hidden="true" /> Pedido enviado
                </>
              ) : (
                <>
                  <UserPlus size={16} aria-hidden="true" /> Adicionar
                </>
              )}
            </button>
          )}
        </div>

        {(socials.length > 0 || p?.crosshair || playerTeams.length > 0) && (
          <div className="profile-extra">
            {playerTeams.map((t) => (
              <Link key={t.id} to={`/times/${t.id}`} className="profile-team">
                <TeamLogo tag={t.tag} color={t.color} size={26} /> {t.name}
              </Link>
            ))}
            {socials.map(({ key, label, icon: Icon }) => (
              <a key={key} href={p.socials[key]} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={`${label} de ${player.nick}`}>
                <Icon size={15} aria-hidden="true" /> {label}
              </a>
            ))}
            {p?.crosshair && (
              <button type="button" className="social-link" onClick={copyCrosshair} title={p.crosshair}>
                <Crosshair size={15} aria-hidden="true" /> {copied ? 'Mira copiada!' : 'Copiar mira'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="stats-grid stats-grid-6" aria-label="Estatísticas principais (últimas 20 partidas)">
        <StatCard icon={Star} label="Rating 3.0" value={player.rating.toFixed(2)} valueClass={ratingClass(player.rating)} highlight />
        <StatCard icon={Activity} label="KAST" value={`${player.kast}%`} />
        <StatCard icon={Flame} label="ADR" value={player.adr} />
        <StatCard icon={Swords} label="K/D" value={player.kd.toFixed(2)} />
        <StatCard
          icon={TrendingUp}
          label="Round Swing"
          value={fmtSigned(player.roundSwing.toFixed(1), '%')}
          valueClass={player.roundSwing >= 0 ? 'text-win' : 'text-loss'}
        />
        <StatCard icon={Target} label="Vitórias" value={`${player.winRate}%`} />
      </section>

      <div className="grid-main-side">
        <section className="card">
          <header className="card-head">
            <h2>Evolução de ELO</h2>
          </header>
          <EloChart points={eloPoints} />
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Detalhes</h2>
            <span className="muted small">Carreira</span>
          </header>
          <dl className="detail-list">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="card">
        <header className="card-head">
          <h2>Desempenho por mapa</h2>
        </header>
        <ul className="map-cards">
          {mapStats.map(({ map, matches, winRate, rating }) => (
            <li key={map.id}>
              <MapThumb map={map} height={86} className="map-card-thumb">
                <span className={`map-card-wr ${winRate >= 50 ? 'text-win' : 'text-loss'}`}>{winRate}%</span>
              </MapThumb>
              <div className="map-card-stats">
                <span className="muted small">{matches} partidas</span>
                <span className="small">
                  Rating <strong className={ratingClass(rating)}>{rating.toFixed(2)}</strong>
                </span>
              </div>
              <Progress value={winRate} label={`Taxa de vitória em ${map.name}`} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <header className="card-head">
          <h2>Histórico de partidas</h2>
          <Link to={`/historico/${player.nick}`} className="link-muted">
            Ver todas <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </header>
        <MatchList matches={history} />
      </section>
    </div>
  );
}
