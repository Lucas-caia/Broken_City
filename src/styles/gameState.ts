export type RunState = 'IDLE' | 'PLAYING' | 'EVENT' | 'GAME_OVER';

export interface Attributes {
  strength: number;      // Força
  dexterity: number;     // Destreza
  constitution: number;  // Constituição
  intelligence: number;  // Inteligência
  wisdom: number;        // Sabedoria
  charisma: number;      // Carisma
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
}

export interface PlayerData {
  health: { current: number; max: number };
  sanity: { current: number; max: number };
  attributes: Attributes;
  inventory: Item[];
}

export interface GameState {
  runState: RunState;
  player: PlayerData;
  currentEventId: string | null;
}