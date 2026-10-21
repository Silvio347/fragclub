import { describe, it, expect } from 'vitest';
import { seeded, shuffle, formatTime, hashString } from './random';

describe('random', () => {
  it('seeded é determinístico para a mesma seed', () => {
    const a = seeded('fragclub');
    const b = seeded('fragclub');
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    for (const n of seqA) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('shuffle não perde nem duplica itens', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const out = shuffle(seeded('x'), arr);
    expect([...out].sort()).toEqual(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5, 6]); // não muta a entrada
  });

  it('formata o tempo de fila', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
  });

  it('hashString é estável', () => {
    expect(hashString('silvio')).toBe(hashString('silvio'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});
