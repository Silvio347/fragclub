// Faixas de ELO (levels 1 a 10)
export const LEVELS = [
  { level: 1, min: 0, max: 500 },
  { level: 2, min: 501, max: 750 },
  { level: 3, min: 751, max: 900 },
  { level: 4, min: 901, max: 1050 },
  { level: 5, min: 1051, max: 1200 },
  { level: 6, min: 1201, max: 1350 },
  { level: 7, min: 1351, max: 1530 },
  { level: 8, min: 1531, max: 1750 },
  { level: 9, min: 1751, max: 2000 },
  { level: 10, min: 2001, max: Infinity },
];

export function levelFromElo(elo) {
  return LEVELS.find((l) => elo >= l.min && elo <= l.max)?.level ?? 1;
}

// Escala própria em tons de roxo: fica mais intensa conforme o level sobe
const LEVEL_COLORS = [
  '#8e8a9e', // 1
  '#9a92b6', // 2
  '#a69bcd', // 3
  '#b3a1e3', // 4
  '#b794f6', // 5
  '#a97cf8', // 6
  '#9d66f8', // 7
  '#9150f7', // 8
  '#8a3ffb', // 9
  '#c084fc', // 10 (usa gradiente + brilho no badge)
];

export function levelColor(level) {
  return LEVEL_COLORS[Math.min(Math.max(level, 1), 10) - 1];
}

export function ratingClass(rating) {
  if (rating >= 1.1) return 'text-win';
  if (rating < 0.95) return 'text-loss';
  return '';
}

export function levelProgress(elo) {
  const l = LEVELS.find((x) => elo >= x.min && elo <= x.max) ?? LEVELS[0];
  if (l.level === 10) return { pct: 100, toNext: 0, next: null };
  return {
    pct: Math.round(((elo - l.min) / (l.max - l.min)) * 100),
    toNext: l.max + 1 - elo,
    next: l.level + 1,
  };
}
