export type EnemyCategory = 'MUNDANE' | 'PARANORMAL' | 'ABERRATION' | 'BEAST';

export interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth?: number;
  attack: number;
  defense: number;
  description: string;
  imageUrl?: string;
  category?: EnemyCategory;
  tier?: number; // 1 = Baixo nível (mundanos/animais), 2 = Médio, 3 = Chefe / Elite
}

export interface EnemyInstance extends Enemy {
  currentHealth: number;
}

