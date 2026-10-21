import { describe, it, expect } from 'vitest';
import { levelFromElo, levelProgress, levelColor, ratingClass, LEVELS } from './levels';

describe('levels', () => {
  it('mapeia ELO para o level certo nas bordas das faixas', () => {
    expect(levelFromElo(0)).toBe(1);
    expect(levelFromElo(500)).toBe(1);
    expect(levelFromElo(501)).toBe(2);
    expect(levelFromElo(1750)).toBe(8);
    expect(levelFromElo(1751)).toBe(9);
    expect(levelFromElo(2001)).toBe(10);
    expect(levelFromElo(4000)).toBe(10);
  });

  it('as faixas são contínuas, sem buracos', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].min).toBe(LEVELS[i - 1].max + 1);
  });

  it('calcula o progresso para o próximo level', () => {
    expect(levelProgress(1824)).toMatchObject({ next: 10, toNext: 177 });
    expect(levelProgress(2500)).toEqual({ pct: 100, toNext: 0, next: null });
  });

  it('todos os levels têm cor em tons próprios', () => {
    for (let l = 1; l <= 10; l++) expect(levelColor(l)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('classifica o rating', () => {
    expect(ratingClass(1.25)).toBe('text-win');
    expect(ratingClass(1.0)).toBe('');
    expect(ratingClass(0.8)).toBe('text-loss');
  });
});
