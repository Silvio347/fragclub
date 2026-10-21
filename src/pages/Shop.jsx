import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Gift, Search, Crown, Check, Lock, Package, Sparkles, Truck, Loader2 } from 'lucide-react';
import { SKINS, COSMETICS, PREMIUM_ITEMS, RARITIES, WEAR, WEAPON_TYPES, EARN_RULES, SEASON, ITEMS_BY_ID } from '../data/catalog';
import { ME } from '../data/mock';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Progress } from '../components/ui';
import '../styles/shop.css';

const TABS = [
  { id: 'skins', label: 'Skins' },
  { id: 'cosmeticos', label: 'Cosméticos' },
  { id: 'premium', label: 'Premium' },
  { id: 'inventario', label: 'Inventário' },
];

const fp = (n) => n.toLocaleString('pt-BR');

// Prévia visual dos cosméticos (usa as mesmas classes aplicadas no perfil)
function CosmeticPreview({ item }) {
  if (item.kind === 'frame') {
    return (
      <span className={`avatar ${item.id}`} style={{ width: 64, height: 64, fontSize: 24, background: 'linear-gradient(135deg, hsl(265 40% 40%), hsl(305 40% 20%))' }} aria-hidden="true">
        {ME.nick.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  if (item.kind === 'nick') return <strong className={`cosmetic-nick ${item.id}`}>{ME.nick}</strong>;
  if (item.kind === 'banner') return <span className={`cosmetic-banner ${item.id}`} aria-hidden="true" />;
  return <Crown size={44} className="accent" aria-hidden="true" />;
}

function ItemCard({ item, onBuy }) {
  const { points, stock, owns } = useShop();
  const sold = stock[item.id] ?? 0;
  const left = item.stock ? item.stock - sold : null;
  const ownedUnique = item.kind !== 'skin' && item.kind !== 'premium' && owns(item.id);
  const missing = item.price - points;
  const rarity = item.kind === 'skin' ? RARITIES[item.rarity] : null;

  return (
    <article className={`card shop-item kind-${item.kind}`} style={rarity ? { '--rarity': rarity.color } : undefined}>
      <div className="shop-item-media">
        {item.kind === 'skin' ? <img src={item.image} alt="" loading="lazy" width="180" height="135" /> : <CosmeticPreview item={item} />}
        {left !== null && left <= 5 && left > 0 && <span className="stock-tag">Restam {left}</span>}
      </div>
      <div className="shop-item-body">
        {rarity && (
          <span className="rarity" style={{ color: rarity.color }}>
            {rarity.name} · {WEAR[item.wear]}
          </span>
        )}
        <h3>{item.name}</h3>
        {item.desc && <p className="muted small">{item.desc}</p>}
        <div className="shop-item-foot">
          <span className="price">
            <Coins size={15} aria-hidden="true" /> {fp(item.price)}
          </span>
          {ownedUnique ? (
            <span className="tag tag-win">
              <Check size={12} aria-hidden="true" /> Seu
            </span>
          ) : left === 0 ? (
            <span className="tag">Esgotado</span>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={missing > 0} onClick={() => onBuy(item)} title={missing > 0 ? `Faltam ${fp(missing)} FP` : undefined}>
              {missing > 0 ? (
                <>
                  <Lock size={13} aria-hidden="true" /> {fp(missing)} FP
                </>
              ) : (
                'Comprar'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function BuyModal({ item, onClose }) {
  const { buy, points } = useShop();
  const [state, setState] = useState('confirm'); // confirm | loading | done
  const [error, setError] = useState('');

  const confirm = () => {
    setState('loading');
    setTimeout(() => {
      try {
        buy(item.id);
        setState('done');
      } catch (e) {
        setError(e.message);
        setState('confirm');
      }
    }, 700);
  };

  return (
    <Modal title={state === 'done' ? 'Compra concluída' : 'Confirmar compra'} onClose={state === 'loading' ? undefined : onClose}>
      <div className="buy-modal">
        <div className="buy-item">
          {item.kind === 'skin' ? <img src={item.image} alt="" width="120" height="90" /> : <CosmeticPreview item={item} />}
          <div>
            <strong>{item.name}</strong>
            <span className="price">
              <Coins size={14} aria-hidden="true" /> {fp(item.price)} FP
            </span>
          </div>
        </div>
        {state === 'done' ? (
          <>
            <p className="text-win row gap-xs">
              <Check size={16} aria-hidden="true" /> Item adicionado ao seu inventário.
            </p>
            <div className="row gap-sm form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Continuar comprando
              </button>
              <Link to="/loja?aba=inventario" className="btn btn-primary" onClick={onClose}>
                Ver inventário
              </Link>
            </div>
          </>
        ) : (
          <>
            <dl className="buy-summary">
              <div>
                <dt>Saldo atual</dt>
                <dd>{fp(points)} FP</dd>
              </div>
              <div>
                <dt>Depois da compra</dt>
                <dd>{fp(points - item.price)} FP</dd>
              </div>
            </dl>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="row gap-sm form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={state === 'loading'}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={confirm} disabled={state === 'loading'}>
                {state === 'loading' && <Loader2 size={16} className="spin" aria-hidden="true" />} Confirmar compra
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

const STATUS = {
  available: { label: 'Disponível', cls: 'tag-win' },
  redeeming: { label: 'Envio em até 48h', cls: 'tag-accent' },
  used: { label: 'Ativado', cls: '' },
};

function Inventory() {
  const { inventory, equipped, redeem, activatePremium, toggleEquip } = useShop();
  const { profile } = useAuth();

  if (!inventory.length) {
    return (
      <div className="card empty-team">
        <Package size={32} aria-hidden="true" className="accent" />
        <strong>Inventário vazio</strong>
        <p className="muted small">Jogue partidas para ganhar FragPoints e troque por skins e cosméticos.</p>
      </div>
    );
  }

  return (
    <ul className="inventory">
      {inventory.map((inv) => {
        const item = ITEMS_BY_ID[inv.itemId];
        const status = STATUS[inv.status];
        const isCosmetic = item.kind === 'frame' || item.kind === 'nick';
        const equippedNow = isCosmetic && equipped[item.kind] === item.id;
        return (
          <li key={inv.uid} className="card inv-row" style={item.rarity ? { '--rarity': RARITIES[item.rarity].color } : undefined}>
            <div className="inv-media">{item.kind === 'skin' ? <img src={item.image} alt="" width="96" height="72" /> : <CosmeticPreview item={item} />}</div>
            <div className="inv-info">
              <strong>{item.name}</strong>
              <span className="muted small">Comprado em {new Date(inv.boughtAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {item.kind === 'skin' && <span className={`tag ${status.cls}`}>{status.label}</span>}
            <div className="inv-actions">
              {item.kind === 'skin' &&
                inv.status === 'available' &&
                (profile.tradeUrl ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => redeem(inv.uid)}>
                    <Truck size={14} aria-hidden="true" /> Resgatar na Steam
                  </button>
                ) : (
                  <Link to="/perfil/editar" className="btn btn-ghost btn-sm" title="Cadastre seu link de troca para resgatar">
                    <Lock size={14} aria-hidden="true" /> Cadastrar link de troca
                  </Link>
                ))}
              {item.kind === 'premium' &&
                (inv.status === 'available' ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => activatePremium(inv.uid)}>
                    <Crown size={14} aria-hidden="true" /> Ativar
                  </button>
                ) : (
                  <span className="tag">Ativado</span>
                ))}
              {isCosmetic && (
                <button type="button" className={`btn btn-sm ${equippedNow ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleEquip(item.id)} aria-pressed={equippedNow}>
                  {equippedNow ? (
                    <>
                      <Check size={14} aria-hidden="true" /> Equipado
                    </>
                  ) : (
                    'Equipar'
                  )}
                </button>
              )}
              {item.kind === 'banner' && (
                <Link to="/perfil/editar" className="btn btn-ghost btn-sm">
                  Usar no perfil
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('aba')) ? params.get('aba') : 'skins';
  const { points, seasonXp, inventory, dailyAvailable, claimDaily } = useShop();
  const [buying, setBuying] = useState(null);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('price-asc');
  const [affordable, setAffordable] = useState(false);

  const tier = Math.min(SEASON.tiers, Math.floor(seasonXp / SEASON.xpPerTier) + 1);
  const tierXp = seasonXp % SEASON.xpPerTier;

  const skins = useMemo(() => {
    const list = SKINS.filter((s) => (type === 'all' || s.type === type) && s.name.toLowerCase().includes(q.toLowerCase()) && (!affordable || s.price <= points));
    return [...list].sort((a, b) => (sort === 'price-asc' ? a.price - b.price : b.price - a.price));
  }, [type, q, sort, affordable, points]);

  const setTab = (id) => setParams(id === 'skins' ? {} : { aba: id }, { replace: true });

  return (
    <div className="page stack">
      <header className="page-head">
        <div>
          <span className="eyebrow">{SEASON.name}</span>
          <h1>Loja</h1>
        </div>
      </header>

      <section className="shop-hero">
        <div className="card shop-balance">
          <span className="muted small">Seu saldo</span>
          <strong className="balance">
            <Coins size={26} aria-hidden="true" /> {fp(points)} <small>FP</small>
          </strong>
          <button type="button" className="btn btn-primary btn-sm" onClick={claimDaily} disabled={!dailyAvailable}>
            <Gift size={14} aria-hidden="true" /> {dailyAvailable ? 'Coletar +100 FP diários' : 'Diária coletada · volte amanhã'}
          </button>
        </div>
        <div className="card shop-season">
          <div className="row between">
            <span className="row gap-xs">
              <Sparkles size={16} aria-hidden="true" className="accent" /> <strong>Nível de temporada {tier}</strong>
            </span>
            <span className="muted small">Termina em {SEASON.endsInDays} dias</span>
          </div>
          <Progress value={tierXp} max={SEASON.xpPerTier} label="XP para o próximo nível de temporada" />
          <span className="muted small">
            {fp(tierXp)}/{fp(SEASON.xpPerTier)} XP · {fp(seasonXp)} XP na temporada
          </span>
        </div>
        <div className="card shop-earn">
          <strong className="small">Como ganhar FragPoints</strong>
          <ul>
            {EARN_RULES.map(([k, v]) => (
              <li key={k}>
                <span className="muted">{k}</span>
                <span className="accent strong">+{typeof v === 'number' ? fp(v) : v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="tabs" role="tablist" aria-label="Seções da loja">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'inventario' && inventory.length > 0 && ` (${inventory.length})`}
          </button>
        ))}
      </div>

      {tab === 'skins' && (
        <>
          <div className="toolbar">
            <div className="chips" role="radiogroup" aria-label="Tipo de arma">
              {WEAPON_TYPES.map((w) => (
                <button key={w.id} type="button" role="radio" aria-checked={type === w.id} className={`chip ${type === w.id ? 'active' : ''}`} onClick={() => setType(w.id)}>
                  {w.label}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={16} aria-hidden="true" />
              <input type="search" placeholder="Buscar skin" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar skin" />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
            <label className="check">
              <input type="checkbox" checked={affordable} onChange={(e) => setAffordable(e.target.checked)} /> Só o que posso comprar
            </label>
          </div>
          <div className="shop-grid">
            {skins.map((s) => (
              <ItemCard key={s.id} item={s} onBuy={setBuying} />
            ))}
            {skins.length === 0 && <p className="muted empty-state">Nenhuma skin com esses filtros.</p>}
          </div>
          <p className="muted small">Skins são enviadas por oferta de troca da Steam para o link cadastrado no seu perfil.</p>
        </>
      )}

      {tab === 'cosmeticos' && (
        <div className="shop-grid">
          {COSMETICS.map((c) => (
            <ItemCard key={c.id} item={c} onBuy={setBuying} />
          ))}
        </div>
      )}

      {tab === 'premium' && (
        <div className="shop-grid">
          {PREMIUM_ITEMS.map((c) => (
            <ItemCard key={c.id} item={c} onBuy={setBuying} />
          ))}
        </div>
      )}

      {tab === 'inventario' && <Inventory />}

      {buying && <BuyModal item={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}
