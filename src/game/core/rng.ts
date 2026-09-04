/**
 * Gerador de Números Pseudoaleatórios (PRNG) usando Mulberry32.
 * - Suporta seeds determinísticas para reprodutibilidade e testes.
 * - Por padrão gera uma seed imprevisível caso nenhuma seja fornecida.
 */
export class Mulberry32RNG {
  private state: number;
  public readonly initialSeed: number;

  constructor(seed?: number) {
    const actualSeed =
      seed !== undefined && seed !== null
        ? seed >>> 0
        : (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;
    this.initialSeed = actualSeed;
    this.state = actualSeed;
  }

  /**
   * Retorna um número float pseudoaleatório no intervalo [0, 1)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retorna um número inteiro entre min e max inclusive [min, max]
   */
  public nextInt(min: number, max: number): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.next() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
   * Executa um teste de atributo: dado (0 a 10) + bônus de atributo vs dificuldade
   */
  public rollCheck(attributeValue: number, targetValue: number): {
    roll: number;
    total: number;
    target: number;
    isSuccess: boolean;
  } {
    const roll = this.nextInt(0, 10);
    const total = roll + attributeValue;
    return {
      roll,
      total,
      target: targetValue,
      isSuccess: total >= targetValue,
    };
  }
}

export function createRNG(seed?: number): Mulberry32RNG {
  return new Mulberry32RNG(seed);
}

