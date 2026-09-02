export interface Consequence {
  type: 'HEALTH' | 'SANITY' | 'ITEM' | 'ATTRIBUTE_CHECK' | 'FLAG';
  value?: number;
  flagId?: string; // Para eventos chave (conceder flag)
  attribute?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  targetValue?: number;
  successEventId?: string; // Ramificação de sucesso
  failEventId?: string;    // Ramificação de falha
}

export interface Choice {
  id: string;
  text: string;
  requiredFlag?: string; // Para eventos porta (exige flag)
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