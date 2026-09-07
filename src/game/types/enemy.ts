export interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth?: number;
  attack: number;
  defense: number;
  description: string;
  imageUrl?: string;
}

export interface EnemyInstance extends Enemy {
  currentHealth: number;
}

