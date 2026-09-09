import React from 'react';
import '../../styles/global.css';

interface MainMenuScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
  onSettings: () => void;
  canContinue: boolean;
}

const GAME_VERSION = 'v0.1';

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onNewGame,
  onContinue,
  onSettings,
  canContinue,
}) => {
  const handleExit = () => {
    if (window.confirm('Deseja realmente fechar o jogo?')) {
      window.close();
    }
  };

  return (
    <div className="game-container main-menu-container">
      <header className="main-menu-header">
        <span className="terminal-badge">TERMINAL DE CONTENÇÃO</span>
        <span className="version-badge">{GAME_VERSION}</span>
      </header>

      <section className="main-menu-body">
        <div className="main-menu-title-block">
          <h1 className="main-menu-title">BROKEN CITY</h1>
          <p className="main-menu-subtitle">
            SURVIVAL HORROR &bull; ROGUELIKE NARRATIVO
          </p>
          <div className="main-menu-ascii-divider">
            ════════════════════════════════════════
          </div>
        </div>

        <div className="main-menu-options">
          <button className="menu-btn" onClick={onNewGame}>
            [ NOVO JOGO ]
          </button>

          <button
            className={`menu-btn ${!canContinue ? 'disabled' : ''}`}
            onClick={onContinue}
            disabled={!canContinue}
            title={canContinue ? 'Continuar expedição anterior' : 'Nenhum registro de expedição salvo'}
          >
            [ CONTINUAR ]
          </button>

          <button className="menu-btn" onClick={onSettings}>
            [ CONFIGURAÇÕES ]
          </button>

          <button className="menu-btn menu-btn-exit" onClick={handleExit}>
            [ SAIR ]
          </button>
        </div>

        <div className="main-menu-footer-notice">
          <span className="blink-cursor">&gt;</span> SISTEMA DE SOBREVIVÊNCIA ESTÁVEL &bull; MILESTONE 0.1
        </div>
      </section>
    </div>
  );
};

export default MainMenuScreen;

