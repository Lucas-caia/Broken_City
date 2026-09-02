export interface Consequence {
  type: 'HEALTH' | 'SANITY' | 'ITEM' | 'ATTRIBUTE_CHECK';
  value?: number;
  itemId?: string;
  attribute?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  targetValue?: number;
}

export interface Choice {
  id: string;
  text: string;
  consequences: Consequence[];
  nextEventId: string | null;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  choices: Choice[];
}