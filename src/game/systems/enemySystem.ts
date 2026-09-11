import { Enemy, EnemyCategory, EnemyInstance } from '../types/enemy';

/**
 * Cria um mapa O(1) indexado pelo ID do inimigo para consultas rápidas.
 */
export function createEnemiesMap(enemies: Enemy[]): Map<string, Enemy> {
  const map = new Map<string, Enemy>();
  for (const enemy of enemies) {
    map.set(enemy.id, enemy);
  }
  return map;
}

/**
 * Retorna os dados base de um inimigo pelo seu ID.
 */
export function getEnemy(enemiesMap: Map<string, Enemy>, id: string): Enemy | undefined {
  return enemiesMap.get(id);
}

/**
 * Filtra inimigos por categoria (ex: 'MUNDANE', 'PARANORMAL', etc.).
 */
export function getEnemiesByCategory(enemies: Enemy[], category: EnemyCategory): Enemy[] {
  return enemies.filter(enemy => enemy.category === category);
}

/**
 * Filtra inimigos por nível de perigo / tier (ex: tier 1 para monstros de baixo nível).
 */
export function getEnemiesByTier(enemies: Enemy[], tier: number): Enemy[] {
  return enemies.filter(enemy => enemy.tier === tier);
}

/**
 * Retorna todos os monstros de baixo nível não paranormais (Tier 1 & MUNDANE/BEAST).
 */
export function getLowLevelMundaneEnemies(enemies: Enemy[]): Enemy[] {
  return enemies.filter(
    enemy => (enemy.category === 'MUNDANE' || enemy.category === 'BEAST') && (enemy.tier === 1 || !enemy.tier)
  );
}

/**
 * Instancia um inimigo para combate futuro, inicializando a vida atual e máxima.
 */
export function createEnemyInstance(enemy: Enemy): EnemyInstance {
  const maxHealth = enemy.maxHealth ?? enemy.health;
  return {
    ...enemy,
    health: enemy.health,
    maxHealth,
    currentHealth: enemy.health,
  };
}

/**
 * Checa se a instância do inimigo ainda está viva.
 */
export function isEnemyAlive(enemyInstance: EnemyInstance): boolean {
  return enemyInstance.currentHealth > 0;
}
