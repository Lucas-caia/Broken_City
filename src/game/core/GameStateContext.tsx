import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameState } from '../types/gameState';

const initialState: GameState = {
  runState: 'IDLE',
  player: {
    health: { current: 100, max: 100 },
    sanity: { current: 100, max: 100 },
    attributes: { 
      strength: 5, 
      dexterity: 5, 
      constitution: 5, 
      intelligence: 5, 
      wisdom: 5, 
      charisma: 5 
    },
    inventory: [],
  },
  currentEventId: null,
};

interface GameStateContextProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialState);

  return (
    <GameStateContext.Provider value={{ state, setState }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState deve ser usado dentro de um GameStateProvider');
  }
  return context;
};