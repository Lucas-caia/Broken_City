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
import rawEvents from '../../data/events/events.json';
import { createEventsMap, resolveChoice } from './eventEngine';
import { createRNG, Mulberry32RNG } from './rng';
import { EventsListSchema, validateEventsGraph } from '../validation/schemas';

const SAVE_KEY = 'broken_city_save_v1';
const STARTING_EVENT_ID = 'EVT_CORREDOR_01';

// Tipagem e validação dos dados de eventos no carregamento
const eventsData: GameEvent[] = EventsListSchema.parse(rawEvents);
const eventsValidation = validateEventsGraph(eventsData);
if (!eventsValidation.valid) {
  console.error('Erros no grafo de eventos:', eventsValidation.errors);
}
const eventsMap = createEventsMap(eventsData);

function createNewRunState(seed?: number): GameState {
  const actualSeed =
    seed !== undefined && seed !== null
      ? seed >>> 0
      : (Date.now() ^ (Math.random() * 0x100000000)) >>> 0;

  return {
    runState: 'EVENT',
    seed: actualSeed,
    player: {
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
    },
    currentEventId: STARTING_EVENT_ID,
    logHistory: [`[INÍCIO DA RUN]: Seed da partida: ${actualSeed}`],
  };
}

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed && parsed.player && parsed.runState) {
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
  | { type: 'RESOLVE_CHOICE'; choice: Choice };

interface GameStateContextProps {
  state: GameState;
  eventsData: GameEvent[];
  eventsMap: Map<string, GameEvent>;
  makeChoice: (choice: Choice) => void;
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
            rngRef.current
          );
          return nextState;
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

  // Auto-save: persiste sempre que o estado da run sofrer alteração
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
      makeChoice,
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