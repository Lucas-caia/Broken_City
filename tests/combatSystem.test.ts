import { describe, it, expect } from 'vitest';
import {
  generateDeck,
  rollRoundPoints,
  startCombat,
  playCard,
  endTurn,
  TOTAL_DECK_SIZE,
  HAND_SIZE,
} from '../src/game/systems/combatSystem';
import { createRNG } from '../src/game/core/rng';
import { PlayerData } from '../src/game/types/gameState';
import { BaseItem } from '../src/game/types/item';
import { Enemy } from '../src/game/types/enemy';
import { resolveChoice } from '../src/game/core/eventEngine';
import { GameEvent, Choice } from '../src/game/types/event';
import rawEnemies from '../src/data/enemies/enemies.json';

// Fixtures
const mockItemsMap = new Map<string, BaseItem>([
  [
    'martelo',
    {
      id: 'martelo',
      name: 'Martelo Pesado',
      description: 'Arma pesada de impacto.',
      type: 'EQUIPMENT',
      effects: [
        { type: 'ATTRIBUTE_BONUS', target: 'STRENGTH', value: 3 },
        { type: 'ATTRIBUTE_BONUS', target: 'DEXTERITY', value: -1 },
      ],
    },
  ],
  [
    'faca_trincheira',
    {
      id: 'faca_trincheira',
      name: 'Faca de Trincheira',
      description: 'Lâmina afiada rápida.',
      type: 'EQUIPMENT',
      effects: [
        { type: 'ATTRIBUTE_BONUS', target: 'STRENGTH', value: 1 },
        { type: 'ATTRIBUTE_BONUS', target: 'DEXTERITY', value: 2 },
      ],
    },
  ],
  [
    'capa_encantada',
    {
      id: 'capa_encantada',
      name: 'Capa Encantada',
      description: 'Capa que não é arma.',
      type: 'EQUIPMENT',
      effects: [
        { type: 'ATTRIBUTE_BONUS', target: 'DEXTERITY', value: 3 },
      ],
    },
  ],
]);

const mockEnemy: Enemy = {
  id: 'a_sombra',
  name: 'A Sombra',
  health: 35,
  maxHealth: 35,
  attack: 10,
  defense: 3,
  description: 'Criatura das trevas.',
};

const createMockPlayer = (overrides?: Partial<PlayerData>): PlayerData => ({
  attributes: {
    strength: 4,
    dexterity: 3,
    constitution: 4,
    intelligence: 2,
    perception: 3,
  },
  health: { current: 100, max: 100 },
  sanity: { current: 80, max: 100 },
  level: 1,
  inventory: [],
  equippedItemIds: [],
  flags: [],
  ...overrides,
});

describe('Combat System - Deck Generation (Issue #12)', () => {
  it('gera exatamente 40 cartas de "Soco" quando nenhuma arma está equipada', () => {
    const player = createMockPlayer({ equippedItemIds: [] });
    const deck = generateDeck(player.equippedItemIds, player, mockItemsMap);

    expect(deck.length).toBe(TOTAL_DECK_SIZE);
    expect(deck.length).toBe(40);
    expect(deck.every(card => card.name === 'Soco')).toBe(true);

    // Dano do Soco = FOR (4) + Nível (1) = 5
    expect(deck[0].damage).toBe(5);
  });

  it('calcula o dano do Soco corretamente com atributos modificados e níveis superiores', () => {
    const player = createMockPlayer({
      attributes: { strength: 6, dexterity: 2, constitution: 3, intelligence: 1, perception: 2 },
      level: 3,
      equippedItemIds: [],
    });
    const deck = generateDeck(player.equippedItemIds, player, mockItemsMap);

    // FOR 6 + Nível 3 = 9
    expect(deck[0].damage).toBe(9);
  });

  it('gera 100% (40 cartas) da arma equipada quando há apenas 1 arma (ex: Martelo)', () => {
    const player = createMockPlayer({ equippedItemIds: ['martelo'] });
    const deck = generateDeck(player.equippedItemIds, player, mockItemsMap);

    expect(deck.length).toBe(40);
    expect(deck.every(card => card.name === 'Martelada')).toBe(true);
    expect(deck[0].cost).toBe(3);
    // FOR base 4 + Martelo (+3) = FOR efetiva 7.
    // Dano: round(7 * 1.5 + 1) = round(10.5 + 1) = 12
    expect(deck[0].damage).toBe(12);
  });

  it('ignora itens equipados que não são armas ao gerar o baralho', () => {
    // A Capa Encantada dá destreza mas não força/ataque
    const player = createMockPlayer({ equippedItemIds: ['capa_encantada'] });
    const deck = generateDeck(player.equippedItemIds, player, mockItemsMap);

    expect(deck.length).toBe(40);
    // Como não há arma, volta para socos
    expect(deck.every(card => card.name === 'Soco')).toBe(true);
  });

  it('divide exatamente 50%/50% (20 e 20) quando 2 armas estão equipadas', () => {
    const player = createMockPlayer({
      equippedItemIds: ['martelo', 'faca_trincheira'],
    });
    const deck = generateDeck(player.equippedItemIds, player, mockItemsMap);

    expect(deck.length).toBe(40);
    const marteladas = deck.filter(c => c.name === 'Martelada');
    const facas = deck.filter(c => c.name === 'Golpe de Faca');

    expect(marteladas.length).toBe(20);
    expect(facas.length).toBe(20);
  });
});

describe('Combat System - 2d6 Dice Roll (Issue #12)', () => {
  it('rola 2 dados cada um entre 1 e 6, com soma entre 2 e 12', () => {
    const rng = createRNG(12345);
    for (let i = 0; i < 50; i++) {
      const roll = rollRoundPoints(rng);
      expect(roll.die1).toBeGreaterThanOrEqual(1);
      expect(roll.die1).toBeLessThanOrEqual(6);
      expect(roll.die2).toBeGreaterThanOrEqual(1);
      expect(roll.die2).toBeLessThanOrEqual(6);
      expect(roll.total).toBe(roll.die1 + roll.die2);
      expect(roll.total).toBeGreaterThanOrEqual(2);
      expect(roll.total).toBeLessThanOrEqual(12);
    }
  });
});

describe('Combat System - Combat Initialization & Card Play', () => {
  it('inicia o combate com 7 cartas na mão, 33 no baralho e pontos iguais à soma dos 2d6', () => {
    const rng = createRNG(42);
    const player = createMockPlayer();
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    expect(combat.hand.length).toBe(HAND_SIZE);
    expect(combat.hand.length).toBe(7);
    expect(combat.deck.length).toBe(TOTAL_DECK_SIZE - HAND_SIZE);
    expect(combat.deck.length).toBe(33);
    expect(combat.discardPile.length).toBe(0);
    expect(combat.round).toBe(1);
    expect(combat.availablePoints).toBe(combat.lastDiceRoll.total);
    expect(combat.enemy.currentHealth).toBe(mockEnemy.health);
  });

  it('joga uma carta com pontos suficientes, deduzindo pontos e aplicando dano com base na defesa', () => {
    const rng = createRNG(100);
    const player = createMockPlayer();
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    // Garantir pontos suficientes para teste
    combat.availablePoints = 8;
    const cardToPlay = combat.hand[0];
    const initialEnemyHp = combat.enemy.currentHealth;

    const result = playCard(combat, cardToPlay.id);

    expect(result.error).toBeUndefined();
    expect(result.nextCombat.availablePoints).toBe(8 - cardToPlay.cost);
    expect(result.nextCombat.hand.length).toBe(6);
    expect(result.nextCombat.discardPile.length).toBe(1);
    expect(result.nextCombat.discardPile[0].id).toBe(cardToPlay.id);

    // Dano efetivo = max(1, card.damage - enemy.defense)
    const expectedDmg = Math.max(1, cardToPlay.damage - mockEnemy.defense);
    expect(result.nextCombat.enemy.currentHealth).toBe(initialEnemyHp - expectedDmg);
  });

  it('impede a jogada de carta quando os pontos de ação forem insuficientes', () => {
    const rng = createRNG(100);
    const player = createMockPlayer();
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    // Forçar 0 pontos
    combat.availablePoints = 0;
    const cardToPlay = combat.hand[0];

    const result = playCard(combat, cardToPlay.id);

    expect(result.error).toBeDefined();
    expect(result.error).toContain('Pontos insuficientes');
    expect(result.nextCombat.hand.length).toBe(7);
  });

  it('detecta vitória do jogador quando o HP do inimigo chega a zero', () => {
    const rng = createRNG(100);
    const player = createMockPlayer();
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    // Inimigo com 2 de vida e 0 de defesa para teste de finalização
    combat.enemy.currentHealth = 2;
    combat.enemy.defense = 0;
    combat.availablePoints = 10;

    const cardToPlay = combat.hand[0]; // dano = 5
    const result = playCard(combat, cardToPlay.id);

    expect(result.playerWon).toBe(true);
    expect(result.nextCombat.enemy.currentHealth).toBe(0);
  });
});

describe('Combat System - Turn Ending, Counter-Attack & Exhaustion', () => {
  it('encerra o turno, o inimigo contra-ataca, descarta a mão restante, compra até 7 cartas e rerola 2d6', () => {
    const rng = createRNG(777);
    const player = createMockPlayer({ health: { current: 80, max: 100 } });
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    const initialDeckCount = combat.deck.length; // 33
    const result = endTurn(combat, player, rng, mockItemsMap);

    expect(result.playerDied).toBe(false);
    expect(result.deckExhausted).toBe(false);

    // O jogador sofreu dano do contra-ataque
    expect(result.updatedPlayer.health.current).toBeLessThan(80);

    // Mão foi renovada com 7 novas cartas do deck
    expect(result.nextCombat.hand.length).toBe(7);
    expect(result.nextCombat.deck.length).toBe(initialDeckCount - 7);
    expect(result.nextCombat.discardPile.length).toBe(7); // mão anterior foi descartada

    // Rodada avançou e novos dados foram rolados
    expect(result.nextCombat.round).toBe(2);
    expect(result.nextCombat.availablePoints).toBe(result.nextCombat.lastDiceRoll.total);
  });

  it('detecta morte do jogador se o dano do contra-ataque zerar a vida', () => {
    const rng = createRNG(777);
    const player = createMockPlayer({ health: { current: 2, max: 100 } });
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    const result = endTurn(combat, player, rng, mockItemsMap);

    expect(result.playerDied).toBe(true);
    expect(result.updatedPlayer.health.current).toBe(0);
  });

  it('detecta exaustão quando o baralho de 40 cartas zera totalmente', () => {
    const rng = createRNG(1);
    const player = createMockPlayer({ health: { current: 100, max: 100 } });
    const combat = startCombat(player, mockEnemy, mockItemsMap, rng);

    // Esvazia o baralho simulando várias rodadas
    combat.deck = [];

    const result = endTurn(combat, player, rng, mockItemsMap);

    expect(result.deckExhausted).toBe(true);
  });
});

describe('Combat System - Event Engine Integration', () => {
  it('inicia o combate ao escolher uma opção com consequência START_COMBAT', () => {
    const rng = createRNG(999);
    const player = createMockPlayer();
    const enemiesMap = new Map<string, Enemy>([[mockEnemy.id, mockEnemy]]);

    const combatChoice: Choice = {
      id: 'CHOICE_ENFRENTAR_SOMBRA',
      text: '[ Enfrentar A Sombra ]',
      consequences: [
        { type: 'START_COMBAT', enemyId: 'a_sombra' },
      ],
      nextEventId: 'EVT_REFUGIO_ALCANCADO',
    };

    const event: GameEvent = {
      id: 'EVT_TESTE',
      title: 'Teste de Combate',
      description: 'Encontro com o perigo.',
      choices: [combatChoice],
    };

    const eventsMap = new Map<string, GameEvent>([[event.id, event]]);

    const initialState = {
      runState: 'EVENT' as const,
      currentEventId: 'EVT_TESTE',
      player,
      logHistory: [],
      seed: 999,
      history: ['EVT_TESTE'],
      combat: null,
    };

    const { nextState } = resolveChoice(
      initialState,
      combatChoice,
      eventsMap,
      rng,
      mockItemsMap,
      enemiesMap
    );

    expect(nextState.runState).toBe('COMBAT');
    expect(nextState.combat).toBeDefined();
    expect(nextState.combat?.enemy.name).toBe('A Sombra');
    expect(nextState.combat?.hand.length).toBe(7);
    expect(nextState.combat?.deck.length).toBe(33);
  });

  describe('Calibragem de Força dos Inimigos da Run (Milestone 0.2)', () => {
    const runEnemyIds = ['a_sombra', 'carnical_dos_tuneis'];

    it('ambos os inimigos da run devem possuir attack configurado para 28', () => {
      const enemies = rawEnemies as Enemy[];
      for (const id of runEnemyIds) {
        const enemy = enemies.find(e => e.id === id);
        expect(enemy).toBeDefined();
        expect(enemy?.attack).toBe(28);
      }
    });

    it('ambos os inimigos da run devem causar exatamente ou mais de 100 de dano em 4 turnos de combate', () => {
      const enemies = rawEnemies as Enemy[];
      const rng = createRNG(42);

      for (const id of runEnemyIds) {
        const enemy = enemies.find(e => e.id === id)!;
        expect(enemy).toBeDefined();

        // 1. Teste com Arthur Vance (Constituição 6 -> Defesa 3)
        const arthurPlayer: PlayerData = {
          attributes: { strength: 6, dexterity: 4, constitution: 6, intelligence: 3, perception: 4 },
          health: { current: 200, max: 200 },
          sanity: { current: 80, max: 80 },
          level: 1,
          equippedItemIds: [],
        };

        const initialCombatState = startCombat(arthurPlayer, enemy, mockItemsMap, rng);
        let currentCombat = initialCombatState;
        let currentPlayer = arthurPlayer;

        // Turno 1
        const r1 = endTurn(currentCombat, currentPlayer, rng, mockItemsMap);
        currentCombat = r1.nextCombat;
        currentPlayer = r1.updatedPlayer;
        const dmg1 = 200 - currentPlayer.health.current;
        expect(dmg1).toBe(25);

        // Turno 2
        const r2 = endTurn(currentCombat, currentPlayer, rng, mockItemsMap);
        currentCombat = r2.nextCombat;
        currentPlayer = r2.updatedPlayer;
        const dmg2 = 200 - currentPlayer.health.current;
        expect(dmg2).toBe(50);

        // Turno 3 - Ainda não atingiu 100 (precisa de pelo menos 4 turnos)
        const r3 = endTurn(currentCombat, currentPlayer, rng, mockItemsMap);
        currentCombat = r3.nextCombat;
        currentPlayer = r3.updatedPlayer;
        const dmg3 = 200 - currentPlayer.health.current;
        expect(dmg3).toBe(75);
        expect(dmg3).toBeLessThan(100);

        // Turno 4 - Atinge exatamente 100 de dano
        const r4 = endTurn(currentCombat, currentPlayer, rng, mockItemsMap);
        currentCombat = r4.nextCombat;
        currentPlayer = r4.updatedPlayer;
        const dmg4 = 200 - currentPlayer.health.current;
        expect(dmg4).toBe(100);
        expect(dmg4).toBeGreaterThanOrEqual(100);

        // 2. Teste com Silas Cole / Dra. Evelyn Reed (Constituição 4 -> Defesa 2)
        const silasPlayer: PlayerData = {
          attributes: { strength: 4, dexterity: 7, constitution: 4, intelligence: 5, perception: 5 },
          health: { current: 200, max: 200 },
          sanity: { current: 95, max: 95 },
          level: 1,
          equippedItemIds: [],
        };

        let combatSilas = startCombat(silasPlayer, enemy, mockItemsMap, rng);
        let playerSilas = silasPlayer;

        for (let t = 1; t <= 3; t++) {
          const res = endTurn(combatSilas, playerSilas, rng, mockItemsMap);
          combatSilas = res.nextCombat;
          playerSilas = res.updatedPlayer;
        }
        const silasDmgTurn3 = 200 - playerSilas.health.current;
        expect(silasDmgTurn3).toBe(78); // 3 * 26 = 78 (< 100)
        expect(silasDmgTurn3).toBeLessThan(100);

        const resTurn4 = endTurn(combatSilas, playerSilas, rng, mockItemsMap);
        playerSilas = resTurn4.updatedPlayer;
        const silasDmgTurn4 = 200 - playerSilas.health.current;
        expect(silasDmgTurn4).toBe(104); // 4 * 26 = 104 (>= 100)
        expect(silasDmgTurn4).toBeGreaterThanOrEqual(100);
      }
    });
  });
});
