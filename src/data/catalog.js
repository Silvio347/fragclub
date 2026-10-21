// Catálogo da loja de FragPoints (FP). Imagens das skins em /public/skins
export const RARITIES = {
  restricted: { name: 'Restrita', color: '#8847ff' },
  classified: { name: 'Secreta', color: '#d32ce6' },
  covert: { name: 'Oculta', color: '#eb4b4b' },
  rare: { name: 'Extraordinária', color: '#e4ae39' },
};

export const WEAR = { fn: 'Nova de Fábrica', mw: 'Pouco Usada', ft: 'Testada em Campo' };

export const WEAPON_TYPES = [
  { id: 'all', label: 'Todas' },
  { id: 'rifle', label: 'Rifles' },
  { id: 'sniper', label: 'Snipers' },
  { id: 'pistol', label: 'Pistolas' },
  { id: 'smg', label: 'SMGs' },
  { id: 'knife', label: 'Facas' },
];

const skin = (id, name, type, rarity, wear, price, stock) => ({
  id,
  kind: 'skin',
  name,
  type,
  rarity,
  wear,
  price,
  stock,
  image: `/skins/${id}.png`,
});

export const SKINS = [
  skin('ak-slate', 'AK-47 | Slate', 'rifle', 'restricted', 'ft', 1800, 40),
  skin('glock-fade', 'Glock-18 | Fade', 'pistol', 'restricted', 'fn', 2400, 12),
  skin('deagle-blaze', 'Desert Eagle | Blaze', 'pistol', 'restricted', 'fn', 3200, 8),
  skin('ak-redline', 'AK-47 | Redline', 'rifle', 'classified', 'ft', 4200, 25),
  skin('p250-seeyalater', 'P250 | See Ya Later', 'pistol', 'covert', 'ft', 5200, 30),
  skin('fiveseven-angrymob', 'Five-SeveN | Angry Mob', 'pistol', 'covert', 'ft', 5600, 20),
  skin('mp9-starlight', 'MP9 | Starlight Protector', 'smg', 'covert', 'ft', 6400, 18),
  skin('usp-killconfirmed', 'USP-S | Kill Confirmed', 'pistol', 'covert', 'mw', 9800, 10),
  skin('m4a4-neonoir', 'M4A4 | Neo-Noir', 'rifle', 'covert', 'ft', 7600, 15),
  skin('m4a1s-hyperbeast', 'M4A1-S | Hyper Beast', 'rifle', 'covert', 'ft', 8200, 15),
  skin('awp-neonoir', 'AWP | Neo-Noir', 'sniper', 'covert', 'ft', 8800, 12),
  skin('ak-vulcan', 'AK-47 | Vulcan', 'rifle', 'covert', 'ft', 14500, 6),
  skin('awp-asiimov', 'AWP | Asiimov', 'sniper', 'covert', 'ft', 16000, 6),
  skin('m4a1s-printstream', 'M4A1-S | Printstream', 'rifle', 'covert', 'ft', 18500, 4),
  skin('karambit-doppler', '★ Karambit | Doppler', 'knife', 'rare', 'fn', 95000, 1),
];

// Cosméticos da plataforma (aplicados no perfil/avatar)
export const COSMETICS = [
  {
    id: 'frame-neon',
    kind: 'frame',
    name: 'Moldura Neon Roxa',
    desc: 'Anel roxo com brilho pulsando no seu avatar.',
    price: 1200,
  },
  { id: 'frame-gold', kind: 'frame', name: 'Moldura Dourada', desc: 'Para quem fecha round no clutch.', price: 1800 },
  { id: 'frame-fire', kind: 'frame', name: 'Moldura Chamas', desc: 'Anel animado em tons de fogo.', price: 2600 },
  {
    id: 'nick-purple',
    kind: 'nick',
    name: 'Nick Gradiente Roxo',
    desc: 'Seu nick com gradiente roxo animado.',
    price: 900,
  },
  { id: 'nick-ice', kind: 'nick', name: 'Nick Gelo', desc: 'Gradiente azul gelo no seu nick.', price: 900 },
  {
    id: 'banner-galaxy',
    kind: 'banner',
    name: 'Banner Galáxia',
    desc: 'Banner animado para o seu perfil.',
    price: 1500,
  },
  {
    id: 'banner-grid',
    kind: 'banner',
    name: 'Banner Grid Neon',
    desc: 'O grid roxo da landing no seu perfil.',
    price: 1500,
  },
];

export const PREMIUM_ITEMS = [
  {
    id: 'prem-7d',
    kind: 'premium',
    name: 'Premium 7 dias',
    desc: 'Todos os benefícios Premium por uma semana.',
    price: 2500,
    days: 7,
  },
  {
    id: 'prem-30d',
    kind: 'premium',
    name: 'Premium 30 dias',
    desc: 'Um mês inteiro de Premium.',
    price: 8000,
    days: 30,
  },
];

export const ALL_ITEMS = [...SKINS, ...COSMETICS, ...PREMIUM_ITEMS];
export const ITEMS_BY_ID = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));

// Banners de perfil gratuitos (mapas) + especiais da loja
export const FREE_BANNERS = [
  'default',
  'mirage',
  'inferno',
  'nuke',
  'ancient',
  'anubis',
  'dust2',
  'train',
  'overpass',
  'vertigo',
];

export const EARN_RULES = [
  ['Vitória na ranqueada', 120],
  ['Derrota na ranqueada', 40],
  ['Missão diária', '50–200'],
  ['Partida de campeonato', 250],
  ['Recompensa diária', 100],
];

export const SEASON = { name: 'Temporada 4', endsInDays: 23, tiers: 50, xpPerTier: 500 };
