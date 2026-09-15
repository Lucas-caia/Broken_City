import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/screens/App';
import { GameStateProvider } from './game/core/GameStateContext';
import { AudioProvider } from './ui/context/AudioContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GameStateProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </GameStateProvider>
  </React.StrictMode>
);