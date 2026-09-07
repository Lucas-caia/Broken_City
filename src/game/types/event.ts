export type ConsequenceType =
  | 'HEALTH'
  | 'SANITY'
  | 'ITEM'
  | 'ATTRIBUTE_CHECK'
  | 'ATTRIBUTE_CHANGE'
  | 'FLAG'
  | 'START_COMBAT';

export type AttributeName =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export interface Consequence {
  type: ConsequenceType;
  value?: number;
  flagId?: string; // Para eventos chave (conceder flag)
  itemAction?: 'ADD' | 'REMOVE';
  itemId?: string;
  itemName?: string;
  enemyId?: string; // ID do inimigo para iniciar combate
  attribute?: AttributeName;
  targetValue?: number;
  successEventId?: string; // Ramificação de sucesso / vitória
  failEventId?: string;    // Ramificação de falha / derrota
}

export interface Choice {
  id: string;
  text: string;
  requiredFlag?: string; // Para eventos porta (exige flag)
  requiredItem?: string; // Para escolhas que exigem posse de um item
  consequences: Consequence[];
  nextEventId?: string | null;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  choices: Choice[];
}