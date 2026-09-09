import { Attributes } from './gameState';

export interface StartingItemConfig {
  itemId: string;
  name?: string;
  quantity: number;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  portraitUrl?: string; // Caminho ou chave da imagem (opcional, preparado para fotos futuras)
  health: {
    current: number;
    max: number;
  };
  sanity: {
    current: number;
    max: number;
  };
  attributes: Attributes;
  startingInventory?: StartingItemConfig[];
  startingEquippedItemIds?: string[];
  traits?: string[]; // Para escalabilidade futura
}

