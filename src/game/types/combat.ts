import { EnemyInstance } from './enemy';

export interface CombatCard {
  id: string; // Identificador único da instância da carta
  name: string; // Ex: "Soco", "Martelada", "Golpe de Faca"
  cost: number; // Pontuação necessária para jogar (1 a 10)
  damage: number; // Dano calculado com base nos atributos do jogador
  description: string;
  weaponId?: string; // ID do item/arma de origem, se houver
}

export interface DiceRoll {
  die1: number; // Dado 1 (1 a 6)
  die2: number; // Dado 2 (1 a 6)
  total: number; // Soma (2 a 12)
}

export interface CombatState {
  enemy: EnemyInstance;
  deck: CombatCard[]; // Baralho de compra (40 cartas inicialmente)
  hand: CombatCard[]; // Mão atual do jogador (até 7 cartas)
  discardPile: CombatCard[]; // Pilha de descarte
  availablePoints: number; // Pontos de ação restantes no turno atual
  lastDiceRoll?: DiceRoll; // Último sorteio de 2d6
  round: number; // Número da rodada
  combatLog: string[]; // Histórico de ações e rolagens do combate
  victoryEventId?: string; // Evento de destino em caso de vitória
  defeatEventId?: string; // Evento de destino em caso de derrota
}

