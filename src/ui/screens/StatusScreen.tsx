import React from 'react';
import { useGameState } from '../../game/core/GameStateContext';

interface StatusScreenProps {
  onClose: () => void;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ onClose }) => {
  const { state } = useGameState();
  const { player } = state;

  return (
    <div className="status-container">
      <div className="status-left">
        <button className="choice-btn" style={{ alignSelf: 'flex-start' }} onClick={onClose}>
          [ Voltar ao Evento ]
        </button>
        
        <div className="portrait-placeholder">
          [ RETRATO INDISPONÍVEL ]
        </div>
        
        <div>
          <h3 className="section-title">VITAIS</h3>
          <div className="stat-item">
            <span>Vida (HP)</span>
            <span>{player.health.current} / {player.health.max}</span>
          </div>
          <div className="stat-item">
            <span>Sanidade (SAN)</span>
            <span>{player.sanity.current} / {player.sanity.max}</span>
          </div>
        </div>
      </div>

      <div className="status-right">
        <h3 className="section-title">ATRIBUTOS</h3>
        <div className="stats-grid">
          <div className="stat-item"><span>Força</span><span>{player.attributes.strength}</span></div>
          <div className="stat-item"><span>Destreza</span><span>{player.attributes.dexterity}</span></div>
          <div className="stat-item"><span>Constituição</span><span>{player.attributes.constitution}</span></div>
          <div className="stat-item"><span>Inteligência</span><span>{player.attributes.intelligence}</span></div>
          <div className="stat-item"><span>Sabedoria</span><span>{player.attributes.wisdom}</span></div>
          <div className="stat-item"><span>Carisma</span><span>{player.attributes.charisma}</span></div>
        </div>

        <h3 className="section-title">INVENTÁRIO</h3>
        <div className="inventory-list">
          {player.inventory.length === 0 ? (
            <span style={{ color: '#555' }}>A mochila está vazia.</span>
          ) : (
            player.inventory.map(item => (
              <div key={item.id} className="stat-item">
                <span>{item.name}</span>
                <span>x{item.quantity}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusScreen;