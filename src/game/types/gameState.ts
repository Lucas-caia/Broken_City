export type RunState = 'IDLE' | 'PLAYING' | 'EVENT' | 'GAME_OVER';

export interface Attributes {
  strength: number;
  dexterity: number;
  constitution: number; 
  intelligence: number;
  wisdom: number;      
  charisma: number;      
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
  flags: string[];
}

export interface GameState {
  runState: RunState;
  player: PlayerData;
  currentEventId: string | null;
}