import React from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import '../../styles/global.css';

import eventImage from '../../assets/images/correntes.jpg';

const App: React.FC = () => {
  const { state } = useGameState();

  return (
    <div className="game-container">
      {/* Cabeçalho / HUD */}
      <header className="hud">
        <span>HP {state.player.health.current}</span>
        <span>SAN {state.player.sanity.current}</span>
        <span>Inventory</span>
      </header>

      {/* Área da Imagem */}
      <section className="event-image-container">
        <img src={eventImage} alt="Corredor escuro com correntes enferrujadas" />
      </section>

      {/* Texto e Decisões */}
      <section className="narrative-section">
        <div className="narrative-text">
          O som de metal arrastando ecoa pelo corredor estreito. As correntes pendem do teto como trepadeiras mortas, bloqueando o caminho. O cheiro de ferrugem é sufocante.
        </div>

        <div className="choices-container">
          <button className="choice-btn">[ Tentar afastar as correntes em silêncio ]</button>
          <button className="choice-btn">[ Procurar outra rota no escuro ]</button>
          <button className="choice-btn">[ Puxar uma corrente para testar a armadilha ]</button>
        </div>
      </section>
    </div>
  );
};

export default App;