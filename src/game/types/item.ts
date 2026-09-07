export type ItemType = 'CONSUMABLE' | 'EQUIPMENT' | 'KEY' | 'MISC';

export type ItemEffectTarget =
  | 'HEALTH'
  | 'SANITY'
  | 'STRENGTH'
  | 'DEXTERITY'
  | 'CONSTITUTION'
  | 'INTELLIGENCE'
  | 'WISDOM'
  | 'CHARISMA';

export interface ItemEffect {
  target: ItemEffectTarget;
  value: number; // Positivo (bônus/cura) ou Negativo (penalidade/dano)
  description?: string;
}

export interface BaseItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  effects: ItemEffect[]; // Pode ser vazio ([]) para chaves ou itens de eventos/NPCs
  equippable?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

