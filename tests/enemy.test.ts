import { describe, it, expect } from 'vitest';
import { Enemy } from '../src/game/types/enemy';
import rawEnemies from '../src/data/enemies/enemies.json';
import {
  createEnemiesMap,
  getEnemy,
  createEnemyInstance,
  isEnemyAlive,
  getEnemiesByCategory,
  getEnemiesByTier,
  getLowLevelMundaneEnemies,
} from '../src/game/systems/enemySystem';

describe('Estrutura de Inimigos (Issue #11)', () => {
  const dummyEnemies: Enemy[] = [
    {
      id: 'a_sombra',
      name: 'A Sombra',
      health: 35,
      maxHealth: 35,
      attack: 12,
      defense: 4,
      description: 'Uma entidade espectral faminta que vaga nas trevas.',
      imageUrl: 'correntes.jpg',
      category: 'PARANORMAL',
      tier: 2,
    },
    {
      id: 'rato_pestilento',
      name: 'Rato Pestilento',
      health: 15,
      attack: 5,
      defense: 1,
      description: 'Um roedor contaminado com mordida infecciosa.',
      category: 'MUNDANE',
      tier: 1,
    },
  ];

  const enemiesMap = createEnemiesMap(dummyEnemies);

  it('deve indexar e consultar inimigos por ID', () => {
    const sombra = getEnemy(enemiesMap, 'a_sombra');
    expect(sombra).toBeDefined();
    expect(sombra?.name).toBe('A Sombra');
    expect(sombra?.attack).toBe(12);
    expect(sombra?.defense).toBe(4);
    expect(sombra?.health).toBe(35);
    expect(sombra?.description).toContain('espectral');
    expect(sombra?.imageUrl).toBe('correntes.jpg');

    const inexistente = getEnemy(enemiesMap, 'dragao');
    expect(inexistente).toBeUndefined();
  });

  it('deve criar instâncias ativas de inimigos com vida atual inicializada', () => {
    const sombra = dummyEnemies[0];
    const instance = createEnemyInstance(sombra);

    expect(instance.currentHealth).toBe(35);
    expect(instance.maxHealth).toBe(35);
    expect(instance.attack).toBe(12);
    expect(instance.defense).toBe(4);
    expect(isEnemyAlive(instance)).toBe(true);

    // Dano sofrido
    instance.currentHealth -= 20;
    expect(instance.currentHealth).toBe(15);
    expect(isEnemyAlive(instance)).toBe(true);

    // Morte do inimigo
    instance.currentHealth = 0;
    expect(isEnemyAlive(instance)).toBe(false);
  });

  it('deve suportar imagem opcional (permitir undefined)', () => {
    const rato = dummyEnemies[1];
    expect(rato.imageUrl).toBeUndefined();
    const instance = createEnemyInstance(rato);
    expect(instance.imageUrl).toBeUndefined();
  });
});

describe('Expansão do Catálogo de Monstros e Categorização (Issue #19)', () => {
  const enemies = rawEnemies as Enemy[];
  const enemiesMap = createEnemiesMap(enemies);

  it('deve conter os 4 novos monstros de baixo nível não paranormais solicitados', () => {
    const porco = getEnemy(enemiesMap, 'porco');
    expect(porco).toBeDefined();
    expect(porco?.name).toContain('Porco');
    expect(porco?.category).toBe('MUNDANE');
    expect(porco?.tier).toBe(1);
    expect(porco?.health).toBeGreaterThan(0);

    const cobra = getEnemy(enemiesMap, 'cobra');
    expect(cobra).toBeDefined();
    expect(cobra?.name).toContain('Cobra');
    expect(cobra?.category).toBe('MUNDANE');
    expect(cobra?.tier).toBe(1);
    expect(cobra?.attack).toBeGreaterThan(0);

    const muitosRatos = getEnemy(enemiesMap, 'muitos_ratos');
    expect(muitosRatos).toBeDefined();
    expect(muitosRatos?.name).toBe('Muitos Ratos');
    expect(muitosRatos?.category).toBe('MUNDANE');
    expect(muitosRatos?.tier).toBe(1);

    const marimbondos = getEnemy(enemiesMap, 'enxame_de_marimbondos');
    expect(marimbondos).toBeDefined();
    expect(marimbondos?.name).toContain('Marimbondos');
    expect(marimbondos?.category).toBe('MUNDANE');
    expect(marimbondos?.tier).toBe(1);
  });

  it('deve filtrar inimigos por categoria', () => {
    const mundanos = getEnemiesByCategory(enemies, 'MUNDANE');
    expect(mundanos.length).toBeGreaterThanOrEqual(4);
    expect(mundanos.some(e => e.id === 'porco')).toBe(true);
    expect(mundanos.some(e => e.id === 'cobra')).toBe(true);
    expect(mundanos.some(e => e.id === 'muitos_ratos')).toBe(true);
    expect(mundanos.some(e => e.id === 'enxame_de_marimbondos')).toBe(true);

    const paranormais = getEnemiesByCategory(enemies, 'PARANORMAL');
    expect(paranormais.some(e => e.id === 'a_sombra')).toBe(true);
  });

  it('deve filtrar inimigos por tier (perigo)', () => {
    const tier1 = getEnemiesByTier(enemies, 1);
    expect(tier1.length).toBeGreaterThanOrEqual(4);
    for (const e of tier1) {
      expect(e.tier).toBe(1);
    }

    const tier2 = getEnemiesByTier(enemies, 2);
    expect(tier2.some(e => e.id === 'a_sombra')).toBe(true);
  });

  it('deve retornar monstros de baixo nível não paranormais com getLowLevelMundaneEnemies', () => {
    const lowLevelMundane = getLowLevelMundaneEnemies(enemies);
    expect(lowLevelMundane.length).toBeGreaterThanOrEqual(4);
    expect(lowLevelMundane.every(e => e.category === 'MUNDANE' || e.category === 'BEAST')).toBe(true);
    expect(lowLevelMundane.every(e => e.tier === 1)).toBe(true);
  });
});
