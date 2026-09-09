import React from 'react';
import '../../styles/global.css';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  return (
    <div className="game-container settings-screen-container">
      <header className="hud">
        <span>CONFIGURAÇÕES DO SISTEMA</span>
        <button className="hud-btn" onClick={onBack}>
          [ VOLTAR ]
        </button>
      </header>

      <section className="narrative-section settings-body">
        <h2 className="section-title">OPÇÕES E PARÂMETROS</h2>

        <div className="settings-notice-box">
          <p>
            <strong>ESTADO DO MÓDULO:</strong> Em desenvolvimento.
          </p>
          <p>
            Os parâmetros de áudio, sensibilidade, resolução de tela e preferências de controles
            serão disponibilizados em atualizações subsequentes do projeto.
          </p>
          <div style={{ marginTop: '15px', color: '#888', fontSize: '0.85rem' }}>
            Versão instalada: <strong>0.1.0-alpha</strong>
          </div>
        </div>

        <div className="choices-container" style={{ marginTop: '30px' }}>
          <button className="choice-btn" onClick={onBack}>
            [ VOLTAR AO MENU PRINCIPAL ]
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsScreen;

