import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import { GameState } from '../types/gameState';
import { Choice, GameEvent } from '../types/event';
import { BaseItem } from '../types/item';
import { Enemy } from '../types/enemy';
import rawEvents from '../../data/events/events.json';
import rawItems from '../../data/items/items.json';
import rawEnemies from '../../data/enemies/enemies.json';
import { createEventsMap, resolveChoice } from './eventEngine';
import { createRNG, Mulberry32RNG } from './rng';
import {
  EventsListSchema,
  validateEventsGraph,
  ItemsListSchema,
  validateItemsCatalog,
  EnemiesListSchema,
  validateEnemiesCatalog,
} from '../validation/schemas';
import {
  equipItem as equipItemHelper,
  unequipItem as unequipItemHelper,
  consumeItem as consumeItemHelper,
} from '../systems/inventorySystem';
import {
  playCard as playCombatCardHelper,
  endTurn as endCombatTurnHelper,
} from '../systems/combatSystem';

const SAVE_KEY = 'broken_city_save_v1';
const STARTING_EVENT_ID = 'EVT_CORREDOR_01';

// Tipagem e validação dos dados de eventos
const eventsData: GameEvent[] = EventsListSchema.parse(rawEvents);
const eventsValidation = validateEventsGraph(eventsData);
if (!eventsValidation.valid) {
  console.error('Erros no grafo de eventos:', eventsValidation.errors);
}
const eventsMap = createEventsMap(eventsData);

// Tipagem e validação do catálogo de itens
const itemsData: BaseItem[] = ItemsListSchema.parse(rawItems);
const itemsValidation = validateItemsCatalog(itemsData);
if (!itemsValidation.valid) {
  console.error('Erros no catálogo de itens:', itemsValidation.errors);
}
const itemsMap = new Map<string, BaseItem>();
for (const item of itemsData) {
  itemsMap.set(item.id, item);
}

// Tipagem e validação do catálogo de inimigos
const enemiesData: Enemy[] = EnemiesListSchema.parse(rawEnemies);
const enemiesValidation = validateEnemiesCatalog(enemiesData);
if (!enemiesValidation.valid) {
  console.error('Erros no catálogo de inimigos:', enemiesValidation.errors);
}
const enemiesMap = new Map<string, Enemy>();
for (const enemy of enemiesData) {
  enemiesMap.set(enemy.id, enemy);
}

function createNewRunState(seed?: number): GameState {
  const actualSeed =
    seed !== undefined && seed !== null
      ? seed >>> 0
      : (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;

  return {
    runState: 'EVENT',
    seed: actualSeed,
    player: {
      level: 1,
      health: { current: 100, max: 100 },
      sanity: { current: 100, max: 100 },
      attributes: {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
      },
      flags: [],
      inventory: [],
      equippedItemIds: [],
    },
    currentEventId: STARTING_EVENT_ID,
    combat: null,
    logHistory: [`[INÍCIO DA RUN]: Seed da partida: ${actualSeed}`],
  };
}

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed && parsed.player && parsed.runState) {
      if (!parsed.player.equippedItemIds) {
        parsed.player.equippedItemIds = [];
      }
      if (!parsed.player.level) {
        parsed.player.level = 1;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Falha ao carregar save local:', err);
  }
  return null;
}

type GameAction =
  | { type: 'SET_STATE'; payload: GameState }
  | { type: 'START_RUN'; seed?: number }
  | { type: 'RESTART_RUN'; seed?: number }
  | { type: 'RESOLVE_CHOICE'; choice: Choice }
  | { type: 'EQUIP_ITEM'; itemId: string }
  | { type: 'UNEQUIP_ITEM'; itemId: string }
  | { type: 'CONSUME_ITEM'; itemId: string }
  | { type: 'PLAY_COMBAT_CARD'; cardId: string }
  | { type: 'END_COMBAT_TURN' };

interface GameStateContextProps {
  state: GameState;
  eventsData: GameEvent[];
  eventsMap: Map<string, GameEvent>;
  itemsData: BaseItem[];
  itemsMap: Map<string, BaseItem>;
  enemiesData: Enemy[];
  enemiesMap: Map<string, Enemy>;
  makeChoice: (choice: Choice) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  consumeItem: (itemId: string) => void;
  playCombatCard: (cardId: string) => void;
  endCombatTurn: () => void;
  startRun: (seed?: number) => void;
  restartRun: (seed?: number) => void;
  clearSave: () => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const rngRef = useRef<Mulberry32RNG>(createRNG());

  // Inicialização preguiçosa buscando save local ou gerando nova run
  const [state, dispatch] = useReducer(
    (currentState: GameState, action: GameAction): GameState => {
      switch (action.type) {
        case 'SET_STATE':
          return action.payload;

        case 'START_RUN':
        case 'RESTART_RUN': {
          const fresh = createNewRunState(action.seed);
          rngRef.current = createRNG(fresh.seed);
          return fresh;
        }

        case 'RESOLVE_CHOICE': {
          const { nextState } = resolveChoice(
            currentState,
            action.choice,
            eventsMap,
            rngRef.current,
            itemsMap,
            enemiesMap
          );
          return nextState;
        }

        case 'EQUIP_ITEM': {
          const result = equipItemHelper(
            currentState.player.equippedItemIds || [],
            action.itemId,
            currentState.player.inventory,
            itemsMap
          );

          if (!result.success) {
            return {
              ...currentState,
              logHistory: [
                ...currentState.logHistory,
                `[EQUIPAMENTO]: ${result.error}`,
              ].slice(-10),
            };
          }

          const itemDef = itemsMap.get(action.itemId);
          const name = itemDef?.name || action.itemId;

          return {
            ...currentState,
            player: {
              ...currentState.player,
              equippedItemIds: result.newEquipped,
            },
            logHistory: [
              ...currentState.logHistory,
              `[EQUIPAMENTO]: Equipou "${name}". (${result.newEquipped.length}/3)`,
            ].slice(-10),
          };
        }

        case 'UNEQUIP_ITEM': {
          const newEquipped = unequipItemHelper(
            currentState.player.equippedItemIds || [],
            action.itemId
          );
          const itemDef = itemsMap.get(action.itemId);
          const name = itemDef?.name || action.itemId;

          return {
            ...currentState,
            player: {
              ...currentState.player,
              equippedItemIds: newEquipped,
            },
            logHistory: [
              ...currentState.logHistory,
              `[EQUIPAMENTO]: Desequipou "${name}". (${newEquipped.length}/3)`,
            ].slice(-10),
          };
        }

        case 'CONSUME_ITEM': {
          const result = consumeItemHelper(currentState.player, action.itemId, itemsMap);

          if (!result.success) {
            return {
              ...currentState,
              logHistory: [
                ...currentState.logHistory,
                `[CONSUMÍVEL]: ${result.error}`,
              ].slice(-10),
            };
          }

          return {
            ...currentState,
            player: result.updatedPlayer,
            logHistory: [
              ...currentState.logHistory,
              result.log || '',
            ].slice(-10),
          };
        }

        case 'PLAY_COMBAT_CARD': {
          if (!currentState.combat) return currentState;

          const result = playCombatCardHelper(currentState.combat, action.cardId);

          if (result.error) {
            return {
              ...currentState,
              combat: {
                ...currentState.combat,
                combatLog: [
                  ...currentState.combat.combatLog,
                  `[AVISO]: ${result.error}`,
                ].slice(-15),
              },
            };
          }

          if (result.playerWon) {
            const nextEvent =
              result.nextCombat.victoryEventId || 'EVT_REFUGIO_ALCANCADO';
            return {
              ...currentState,
              runState: 'EVENT',
              currentEventId: nextEvent,
              combat: null,
              logHistory: [
                ...currentState.logHistory,
                `[VITÓRIA EM COMBATE]: Inimigo derrotado!`,
              ].slice(-10),
            };
          }

          return {
            ...currentState,
            combat: result.nextCombat,
          };
        }

        case 'END_COMBAT_TURN': {
          if (!currentState.combat) return currentState;

          const result = endCombatTurnHelper(
            currentState.combat,
            currentState.player,
            rngRef.current,
            itemsMap
          );

          if (result.playerDied) {
            return {
              ...currentState,
              runState: 'GAME_OVER',
              player: result.updatedPlayer,
              combat: null,
              logHistory: [
                ...currentState.logHistory,
                '[FIM DA RUN]: Você foi derrotado em combate.',
              ].slice(-10),
            };
          }

          if (result.deckExhausted) {
            return {
              ...currentState,
              runState: 'GAME_OVER',
              player: result.updatedPlayer,
              combat: null,
              logHistory: [
                ...currentState.logHistory,
                '[EXAUSTÃO]: As 40 cartas do seu baralho acabaram! A partida terminou.',
              ].slice(-10),
            };
          }

          return {
            ...currentState,
            player: result.updatedPlayer,
            combat: result.nextCombat,
          };
        }

        default:
          return currentState;
      }
    },
    null,
    () => {
      const saved = loadSavedState();
      if (saved) {
        rngRef.current = createRNG(saved.seed);
        return saved;
      }
      const initial = createNewRunState();
      rngRef.current = createRNG(initial.seed);
      return initial;
    }
  );

  // Auto-save
  useEffect(() => {
    try {
      if (state.runState === 'GAME_OVER' || state.runState === 'VICTORY') {
        localStorage.removeItem(SAVE_KEY);
      } else {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      }
    } catch (err) {
      console.warn('Erro ao salvar estado:', err);
    }
  }, [state]);

  const makeChoice = (choice: Choice) => {
    dispatch({ type: 'RESOLVE_CHOICE', choice });
  };

  const equipItem = (itemId: string) => {
    dispatch({ type: 'EQUIP_ITEM', itemId });
  };

  const unequipItem = (itemId: string) => {
    dispatch({ type: 'UNEQUIP_ITEM', itemId });
  };

  const consumeItem = (itemId: string) => {
    dispatch({ type: 'CONSUME_ITEM', itemId });
  };

  const playCombatCard = (cardId: string) => {
    dispatch({ type: 'PLAY_COMBAT_CARD', cardId });
  };

  const endCombatTurn = () => {
    dispatch({ type: 'END_COMBAT_TURN' });
  };

  const startRun = (seed?: number) => {
    dispatch({ type: 'START_RUN', seed });
  };

  const restartRun = (seed?: number) => {
    localStorage.removeItem(SAVE_KEY);
    dispatch({ type: 'RESTART_RUN', seed });
  };

  const clearSave = () => {
    localStorage.removeItem(SAVE_KEY);
  };

  const contextValue = useMemo(
    () => ({
      state,
      eventsData,
      eventsMap,
      itemsData,
      itemsMap,
      enemiesData,
      enemiesMap,
      makeChoice,
      equipItem,
      unequipItem,
      consumeItem,
      playCombatCard,
      endCombatTurn,
      startRun,
      restartRun,
      clearSave,
    }),
    [state]
  );

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextProps => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState deve ser usado dentro de um GameStateProvider');
  }
  return context;
};