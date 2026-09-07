import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/game/core/rng';

describe('Mulberry32 PRNG', () => {
  it('deve gerar números determinísticos a partir da mesma seed', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(12345);

    const sequence1 = [rng1.next(), rng1.next(), rng1.next()];
    const sequence2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(sequence1).toEqual(sequence2);
  });

  it('deve gerar sequências distintas a partir de seeds diferentes', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(99999);

    expect(rng1.next()).not.toEqual(rng2.next());
  });

  it('deve respeitar os limites de nextInt(min, max)', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('deve calcular rollCheck corretamente com atributo e dificuldade', () => {
    const rng = createRNG(100);
    const check = rng.rollCheck(5, 8);

    expect(check.total).toBe(check.roll + 5);
    expect(check.target).toBe(8);
    expect(check.isSuccess).toBe(check.total >= 8);
  });
});

