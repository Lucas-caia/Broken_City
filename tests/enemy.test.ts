import { describe, it, expect } from 'vitest';
import { Enemy } from '../src/game/types/enemy';
import {
  createEnemiesMap,
  getEnemy,
  createEnemyInstance,
  isEnemyAlive,
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
    },
    {
      id: 'rato_pestilento',
      name: 'Rato Pestilento',
      health: 15,
      attack: 5,
      defense: 1,
      description: 'Um roedor contaminado com mordida infecciosa.',
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

