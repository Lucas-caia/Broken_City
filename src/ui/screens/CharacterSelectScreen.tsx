import React, { useState } from 'react';
import { CharacterDefinition } from '../../game/types/character';
import { getEventImageUrl } from '../utils/assetHelper';
import '../../styles/global.css';

interface CharacterSelectScreenProps {
  characters: CharacterDefinition[];
  onSelectCharacter: (character: CharacterDefinition) => void;
  onBack: () => void;
}

const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  characters,
  onSelectCharacter,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedChar = characters[selectedIndex] || characters[0];
  const portraitUrl = getEventImageUrl(selectedChar?.portraitUrl);

  if (!selectedChar) {
    return (
      <div className="game-container">
        <div className="narrative-section" style={{ justifyContent: 'center' }}>
          <h2>NENHUM PERSONAGEM DISPONÍVEL</h2>
          <button className="choice-btn" onClick={onBack}>
            [ VOLTAR ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container character-select-container">
      <header className="hud">
        <span>SELEÇÃO DE SOBREVIVENTE</span>
        <button className="hud-btn" onClick={onBack}>
          [ VOLTAR AO MENU ]
        </button>
      </header>

      <div className="char-select-main">
        {/* Painel lateral de seleção de personagens */}
        <aside className="char-list-sidebar">
          <div className="char-list-header">ARQUIVO DE SOBREVIVENTES</div>
          <div className="char-list-items">
            {characters.map((char, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={char.id}
                  className={`char-list-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="char-list-card-name">
                    {isSelected ? '▶ ' : '  '}{char.name}
                  </div>
                  <div className="char-list-card-title">{char.title}</div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Dossiê detalhado do personagem selecionado */}
        <section className="char-dossier-panel">
          <div className="char-dossier-top">
            {/* Foto / Retrato do personagem com suporte a imagem e fallback gracioso */}
            <div className="char-portrait-frame">
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt={selectedChar.name}
                  className="char-portrait-img"
                />
              ) : (
                <div className="char-portrait-placeholder">
                  <div className="char-portrait-silhouette">👤</div>
                  <span className="char-portrait-label">
                    [ FOTOGRAFIA PENDENTE ]
                  </span>
                </div>
              )}
            </div>

            <div className="char-header-info">
              <h2 className="char-dossier-name">{selectedChar.name}</h2>
              <div className="char-dossier-title">{selectedChar.title}</div>

              <div className="char-vitals-row">
                <div className="char-vital-item">
                  <span className="vital-label">HP MÁX:</span>
                  <span className="vital-value hp">{selectedChar.health.max}</span>
                </div>
                <div className="char-vital-item">
                  <span className="vital-label">SAN MÁX:</span>
                  <span className="vital-value san">{selectedChar.sanity.max}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="char-description-box">
            <p className="char-description-text">{selectedChar.description}</p>
          </div>

          {/* Atributos */}
          <div className="char-attributes-section">
            <div className="section-subtitle">ATRIBUTOS BASE</div>
            <div className="char-attrs-grid">
              <div className="char-attr-badge">
                <span className="attr-name">FOR</span>
                <span className="attr-num">{selectedChar.attributes.strength}</span>
              </div>
              <div className="char-attr-badge">
                <span className="attr-name">DES</span>
                <span className="attr-num">{selectedChar.attributes.dexterity}</span>
              </div>
              <div className="char-attr-badge">
                <span className="attr-name">CON</span>
                <span className="attr-num">{selectedChar.attributes.constitution}</span>
              </div>
              <div className="char-attr-badge">
                <span className="attr-name">INT</span>
                <span className="attr-num">{selectedChar.attributes.intelligence}</span>
              </div>
              <div className="char-attr-badge">
                <span className="attr-name">SAB</span>
                <span className="attr-num">{selectedChar.attributes.wisdom}</span>
              </div>
              <div className="char-attr-badge">
                <span className="attr-name">CAR</span>
                <span className="attr-num">{selectedChar.attributes.charisma}</span>
              </div>
            </div>
          </div>

          {/* Equipamento Inicial & Características */}
          <div className="char-inventory-preview">
            <div className="section-subtitle">EQUIPAMENTO INICIAL</div>
            <div className="char-items-list">
              {selectedChar.startingInventory && selectedChar.startingInventory.length > 0 ? (
                selectedChar.startingInventory.map((item, idx) => {
                  const isEquipped = selectedChar.startingEquippedItemIds?.includes(item.itemId);
                  return (
                    <span key={idx} className="char-item-chip">
                      {item.name || item.itemId} {item.quantity > 1 ? `x${item.quantity}` : ''}
                      {isEquipped && <span className="equipped-tag"> [EQUIPADO]</span>}
                    </span>
                  );
                })
              ) : (
                <span className="no-items">[ Nenhum item inicial ]</span>
              )}
            </div>
          </div>

          {/* Botão de confirmação */}
          <div className="char-confirm-footer">
            <button
              className="choice-btn char-start-btn"
              onClick={() => onSelectCharacter(selectedChar)}
            >
              [ INICIAR JORNADA COM {selectedChar.name.toUpperCase()} ]
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CharacterSelectScreen;

