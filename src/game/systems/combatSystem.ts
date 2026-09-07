import { CombatCard, CombatState, DiceRoll } from '../types/combat';
import { Enemy, EnemyInstance } from '../types/enemy';
import { PlayerData } from '../types/gameState';
import { BaseItem } from '../types/item';
import { Mulberry32RNG } from '../core/rng';
import { createEnemyInstance } from './enemySystem';
import { getEffectiveAttributes } from './inventorySystem';

export const TOTAL_DECK_SIZE = 40;
export const HAND_SIZE = 7;

export interface WeaponDefinition {
  weaponId: string;
  cardName: string;
  cost: number;
  calculateDamage: (strength: number, dexterity: number, level: number) => number;
  description: string;
}

/**
 * Mapeamento de armas para os tipos de cartas gerados.
 */
function getWeaponDefinitions(
  equippedItemIds: string[],
  itemsRegistry: Map<string, BaseItem>
): WeaponDefinition[] {
  const weapons: WeaponDefinition[] = [];

  for (const itemId of equippedItemIds) {
    const item = itemsRegistry.get(itemId);
    if (!item) continue;

    if (itemId === 'martelo') {
      weapons.push({
        weaponId: 'martelo',
        cardName: 'Martelada',
        cost: 3,
        calculateDamage: (str, _, lvl) => Math.max(1, Math.round(str * 1.5 + lvl)),
        description: 'Impacto esmagador que golpeia o adversário.',
      });
    } else if (itemId === 'faca_trincheira') {
      weapons.push({
        weaponId: 'faca_trincheira',
        cardName: 'Golpe de Faca',
        cost: 2,
        calculateDamage: (str, dex, lvl) => Math.max(1, str + dex + lvl),
        description: 'Ataque cortante rápido e preciso.',
      });
    } else if (item.type === 'EQUIPMENT' && item.effects.some(e => e.target === 'STRENGTH' && e.value > 0)) {
      weapons.push({
        weaponId: itemId,
        cardName: `Ataque com ${item.name}`,
        cost: 3,
        calculateDamage: (str, _, lvl) => Math.max(1, str + lvl + 2),
        description: `Golpe desferido com ${item.name}.`,
      });
    }
  }

  return weapons;
}

/**
 * Embaralha um array de cartas utilizando o PRNG Mulberry32 (Fisher-Yates).
 */
export function shuffleDeck(cards: CombatCard[], rng: Mulberry32RNG): CombatCard[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Gera as 40 cartas do baralho com base nas armas equipadas e atributos do jogador:
 * - Se desarmado: 40 cartas de "Soco" (dano = FOR + Nível).
 * - Se 1 arma: 40 cartas da arma (ex: "Martelada").
 * - Se 2 armas: 20 cartas de uma e 20 da outra.
 * - Se 3 armas: dividido proporcionalmente somando 40.
 */
export function generateDeck(
  equippedItemIds: string[],
  player: PlayerData,
  itemsRegistry: Map<string, BaseItem>
): CombatCard[] {
  const effectiveAttrs = getEffectiveAttributes(
    player.attributes,
    equippedItemIds,
    itemsRegistry
  );
  const level = player.level || 1;
  const weapons = getWeaponDefinitions(equippedItemIds, itemsRegistry);
  const cards: CombatCard[] = [];

  if (weapons.length === 0) {
    // 100% Socos (40 cartas)
    const punchDamage = Math.max(1, effectiveAttrs.strength + level);
    for (let i = 1; i <= TOTAL_DECK_SIZE; i++) {
      cards.push({
        id: `card_soco_${i}`,
        name: 'Soco',
        cost: 2,
        damage: punchDamage,
        description: `Golpe desarmado causando ${punchDamage} de dano (FOR ${effectiveAttrs.strength} + Nível ${level}).`,
      });
    }
  } else if (weapons.length === 1) {
    // 100% da arma única equipada
    const weapon = weapons[0];
    const dmg = weapon.calculateDamage(effectiveAttrs.strength, effectiveAttrs.dexterity, level);
    for (let i = 1; i <= TOTAL_DECK_SIZE; i++) {
      cards.push({
        id: `card_${weapon.weaponId}_${i}`,
        name: weapon.cardName,
        cost: weapon.cost,
        damage: dmg,
        description: `${weapon.description} (Causa ${dmg} de dano).`,
        weaponId: weapon.weaponId,
      });
    }
  } else {
    // Múltiplas armas: divisão proporcional
    const baseCount = Math.floor(TOTAL_DECK_SIZE / weapons.length);
    let remainder = TOTAL_DECK_SIZE % weapons.length;

    let cardCounter = 1;
    for (const weapon of weapons) {
      const count = baseCount + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const dmg = weapon.calculateDamage(effectiveAttrs.strength, effectiveAttrs.dexterity, level);
      for (let i = 1; i <= count; i++) {
        cards.push({
          id: `card_${weapon.weaponId}_${cardCounter++}`,
          name: weapon.cardName,
          cost: weapon.cost,
          damage: dmg,
          description: `${weapon.description} (Causa ${dmg} de dano).`,
          weaponId: weapon.weaponId,
        });
      }
    }
  }

  return cards;
}

/**
 * Rola 2 dados de 6 lados (2d6) para definir os pontos de ação da rodada.
 */
export function rollRoundPoints(rng: Mulberry32RNG): DiceRoll {
  const die1 = rng.nextInt(1, 6);
  const die2 = rng.nextInt(1, 6);
  return {
    die1,
    die2,
    total: die1 + die2,
  };
}

/**
 * Inicializa uma nova batalha contra um inimigo.
 */
export function startCombat(
  player: PlayerData,
  enemy: Enemy,
  itemsRegistry: Map<string, BaseItem>,
  rng: Mulberry32RNG,
  victoryEventId?: string,
  defeatEventId?: string
): CombatState {
  const enemyInstance: EnemyInstance = createEnemyInstance(enemy);
  const rawDeck = generateDeck(player.equippedItemIds || [], player, itemsRegistry);
  const shuffled = shuffleDeck(rawDeck, rng);

  // Compra inicial de 7 cartas
  const hand = shuffled.slice(0, HAND_SIZE);
  const deck = shuffled.slice(HAND_SIZE);

  // Rola 2d6 para os pontos da rodada 1
  const dice = rollRoundPoints(rng);

  return {
    enemy: enemyInstance,
    deck,
    hand,
    discardPile: [],
    availablePoints: dice.total,
    lastDiceRoll: dice,
    round: 1,
    combatLog: [
      `[COMBATE]: Um confronto mortal contra "${enemy.name}" se iniciou!`,
      `[RODADA 1]: Dados rolados: ⚄ ${dice.die1} + ⚂ ${dice.die2} = ${dice.total} Pontos de Ação disponíveis.`,
    ],
    victoryEventId,
    defeatEventId,
  };
}

export interface PlayCardResult {
  nextCombat: CombatState;
  playerWon: boolean;
  error?: string;
}

/**
 * Joga uma carta da mão gastando seus pontos de custo e causando dano ao inimigo.
 */
export function playCard(
  combatState: CombatState,
  cardId: string
): PlayCardResult {
  const cardIndex = combatState.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return {
      nextCombat: combatState,
      playerWon: false,
      error: 'Carta não encontrada na mão.',
    };
  }

  const card = combatState.hand[cardIndex];

  if (combatState.availablePoints < card.cost) {
    return {
      nextCombat: combatState,
      playerWon: false,
      error: `Pontos insuficientes! Custo: ${card.cost}, Disponíveis: ${combatState.availablePoints}.`,
    };
  }

  // Cálculo de dano considerando a defesa do inimigo
  const rawDamage = card.damage;
  const enemyDefense = combatState.enemy.defense || 0;
  const effectiveDamage = Math.max(1, rawDamage - enemyDefense);

  const updatedEnemyHealth = Math.max(
    0,
    combatState.enemy.currentHealth - effectiveDamage
  );
  const playerWon = updatedEnemyHealth <= 0;

  const nextHand = combatState.hand.filter((_, idx) => idx !== cardIndex);
  const nextDiscard = [...combatState.discardPile, card];
  const nextPoints = combatState.availablePoints - card.cost;

  const logs = [...combatState.combatLog];
  logs.push(
    `[JOGADOR]: Jogou "${card.name}" gastando ${card.cost} pts -> Causou ${effectiveDamage} de dano em "${combatState.enemy.name}" (Defesa: ${enemyDefense}). Restam ${nextPoints} pts.`
  );

  if (playerWon) {
    logs.push(`[VITÓRIA]: "${combatState.enemy.name}" foi derrotado!`);
  }

  const nextCombat: CombatState = {
    ...combatState,
    enemy: {
      ...combatState.enemy,
      currentHealth: updatedEnemyHealth,
    },
    hand: nextHand,
    discardPile: nextDiscard,
    availablePoints: nextPoints,
    combatLog: logs.slice(-15),
  };

  return {
    nextCombat,
    playerWon,
  };
}

export interface EndTurnResult {
  nextCombat: CombatState;
  updatedPlayer: PlayerData;
  playerDied: boolean;
  deckExhausted: boolean;
}

/**
 * Encerra a rodada atual do jogador:
 * 1. O inimigo contra-ataca causando dano ao jogador.
 * 2. Descarta a mão restante.
 * 3. Compra até 7 cartas do deck. Se o deck zerar, aciona exaustão.
 * 4. Rola 2d6 para os pontos da nova rodada.
 */
export function endTurn(
  combatState: CombatState,
  player: PlayerData,
  rng: Mulberry32RNG,
  itemsRegistry?: Map<string, BaseItem>
): EndTurnResult {
  const logs = [...combatState.combatLog];

  // 1. Contra-ataque do Inimigo
  const effectiveAttrs = getEffectiveAttributes(
    player.attributes,
    player.equippedItemIds || [],
    itemsRegistry
  );
  const playerDefense = Math.floor(effectiveAttrs.constitution / 2);
  const enemyAtk = combatState.enemy.attack || 0;
  const enemyDamage = Math.max(1, enemyAtk - playerDefense);

  const updatedHp = Math.max(0, player.health.current - enemyDamage);
  const playerDied = updatedHp <= 0;

  logs.push(
    `[INIMIGO]: "${combatState.enemy.name}" atacou! Dano: ${enemyDamage} (Ataque ${enemyAtk} - Defesa ${playerDefense}). Vida restante: ${updatedHp}/${player.health.max}.`
  );

  const updatedPlayer: PlayerData = {
    ...player,
    health: {
      ...player.health,
      current: updatedHp,
    },
  };

  if (playerDied) {
    logs.push('[DERROTA]: Você sucumbiu aos ataques da criatura.');
    return {
      nextCombat: {
        ...combatState,
        combatLog: logs.slice(-15),
      },
      updatedPlayer,
      playerDied: true,
      deckExhausted: false,
    };
  }

  // 2. Descarte da mão restante
  const nextDiscard = [...combatState.discardPile, ...combatState.hand];

  // 3. Compra de até 7 cartas do deck
  if (combatState.deck.length === 0) {
    logs.push('[EXAUSTÃO]: O baralho se esgotou completamente! A run chegou ao fim por fadiga.');
    return {
      nextCombat: {
        ...combatState,
        hand: [],
        discardPile: nextDiscard,
        combatLog: logs.slice(-15),
      },
      updatedPlayer,
      playerDied: false,
      deckExhausted: true,
    };
  }

  const drawCount = Math.min(HAND_SIZE, combatState.deck.length);
  const nextHand = combatState.deck.slice(0, drawCount);
  const nextDeck = combatState.deck.slice(drawCount);

  // 4. Nova rodada e rolagem de 2d6
  const nextDice = rollRoundPoints(rng);
  const nextRound = combatState.round + 1;

  logs.push(
    `[RODADA ${nextRound}]: Comprou ${drawCount} cartas (${nextDeck.length} restantes no deck). Dados: ⚄ ${nextDice.die1} + ⚂ ${nextDice.die2} = ${nextDice.total} Pontos.`
  );

  const nextCombat: CombatState = {
    ...combatState,
    deck: nextDeck,
    hand: nextHand,
    discardPile: nextDiscard,
    availablePoints: nextDice.total,
    lastDiceRoll: nextDice,
    round: nextRound,
    combatLog: logs.slice(-15),
  };

  return {
    nextCombat,
    updatedPlayer,
    playerDied: false,
    deckExhausted: false,
  };
}

