import React, { useState, useEffect } from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import { useEventEngine } from '../../game/systems/useEventEngine';
import StatusScreen from './StatusScreen';
import '../../styles/global.css';

const App: React.FC = () => {
  const { state, setState } = useGameState();
  const { currentEvent, availableChoices, makeChoice } = useEventEngine();
  const [showStatus, setShowStatus] = useState(false);

  // Inicializa o primeiro evento caso a run acabe de começar
  useEffect(() => {
    if (state.runState === 'IDLE') {
      setState(prev => ({ ...prev, runState: 'EVENT', currentEventId: 'EVT_CORREDOR_01' }));
    }
  }, [state.runState, setState]);

  return (
    <div className="game-container">
      <header className="hud">
        <span>HP {state.player.health.current}</span>
        <span>SAN {state.player.sanity.current}</span>
        <button className="hud-btn" onClick={() => setShowStatus(!showStatus)}>
          {showStatus ? 'Fechar Status' : 'Status'}
        </button>
      </header>

      {showStatus ? (
        <StatusScreen onClose={() => setShowStatus(false)} />
      ) : (
        <>
          <section className="event-image-container">
            {currentEvent.imageUrl ? (
              <img src={`/src/assets/images/${currentEvent.imageUrl}`} alt={currentEvent.title} />
            ) : (
              <div style={{ color: '#555' }}>[ IMAGEM NÃO ENCONTRADA ]</div>
            )}
          </section>

          <section className="narrative-section">
            <h2 style={{ margin: 0, textTransform: 'uppercase', borderBottom: '1px solid #333' }}>
              {currentEvent.title}
            </h2>
            <div className="narrative-text">
              {currentEvent.description}
            </div>

            <div className="choices-container">
              {availableChoices.map(choice => (
                <button 
                  key={choice.id} 
                  className="choice-btn"
                  onClick={() => makeChoice(choice)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default App;