import React from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import { getEventImageUrl } from '../utils/assetHelper';
import '../../styles/global.css';

const DICE_ICONS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const CombatScreen: React.FC = () => {
  const { state, playCombatCard, endCombatTurn } = useGameState();
  const combat = state.combat;

  if (!combat) {
    return (
      <div className="game-container">
        <div className="narrative-section" style={{ justifyContent: 'center' }}>
          <h2>NENHUM COMBATE ATIVO</h2>
        </div>
      </div>
    );
  }

  const enemyImageUrl = getEventImageUrl(combat.enemy.imageUrl);
  const maxHp = combat.enemy.maxHealth || combat.enemy.health || 1;
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((combat.enemy.currentHealth / maxHp) * 100))
  );

  const lastRoll = combat.lastDiceRoll || { die1: 0, die2: 0, total: combat.availablePoints };
  const die1Icon = DICE_ICONS[lastRoll.die1] || (lastRoll.die1 > 0 ? String(lastRoll.die1) : '-');
  const die2Icon = DICE_ICONS[lastRoll.die2] || (lastRoll.die2 > 0 ? String(lastRoll.die2) : '-');

  return (
    <div className="game-container combat-screen-container">
      {/* HUD Superior */}
      <header className="hud">
        <span>HP: {state.player.health.current}/{state.player.health.max}</span>
        <span style={{ color: '#ffb74d' }}>RODADA {combat.round}</span>
        <span style={{ color: '#64b5f6' }}>
          PONTOS: {combat.availablePoints}
        </span>
      </header>

      {/* Seção do Inimigo */}
      <section className="combat-enemy-panel">
        {enemyImageUrl && (
          <div className="combat-enemy-image">
            <img src={enemyImageUrl} alt={combat.enemy.name} />
          </div>
        )}

        <div className="combat-enemy-details">
          <div className="combat-enemy-header">
            <h2 className="combat-enemy-name">{combat.enemy.name}</h2>
            <div className="combat-enemy-stats">
              <span>ATK: {combat.enemy.attack}</span>
              <span>DEF: {combat.enemy.defense}</span>
            </div>
          </div>

          <div className="combat-hp-bar-container">
            <div
              className="combat-hp-bar-fill"
              style={{ width: `${hpPercent}%` }}
            />
            <span className="combat-hp-bar-text">
              HP {combat.enemy.currentHealth} / {maxHp} ({hpPercent}%)
            </span>
          </div>

          <p className="combat-enemy-desc">{combat.enemy.description}</p>
        </div>
      </section>

      {/* Faixa de Dados e Recursos */}
      <div className="combat-resource-bar">
        <div className="combat-dice-info">
          <span className="combat-dice-badge">
            DADOS: {die1Icon} ({lastRoll.die1}) + {die2Icon} ({lastRoll.die2}) = {lastRoll.total} pts
          </span>
          <span className="combat-points-badge">
            DISPONÍVEL: <strong>{combat.availablePoints}</strong> PTS
          </span>
        </div>

        <div className="combat-deck-info">
          <span>BARALHO: {combat.deck.length}/40</span>
          <span>DESCARTE: {combat.discardPile.length}</span>
          <span>MÃO: {combat.hand.length}/7</span>
        </div>
      </div>

      {/* Mão de Cartas */}
      <section className="combat-hand-section">
        <div className="combat-cards-container">
          {combat.hand.length === 0 ? (
            <div className="combat-empty-hand">Mão vazia. Encerre o turno para comprar cartas.</div>
          ) : (
            combat.hand.map(card => {
              const canPlay = combat.availablePoints >= card.cost;
              return (
                <div
                  key={card.id}
                  className={`combat-card ${canPlay ? 'playable' : 'disabled'}`}
                  onClick={() => canPlay && playCombatCard(card.id)}
                >
                  <div className="combat-card-top">
                    <span className="combat-card-cost">{card.cost} PT</span>
                    <span className="combat-card-dmg">🗡 {card.damage}</span>
                  </div>
                  <div className="combat-card-title">{card.name}</div>
                  <div className="combat-card-desc">{card.description}</div>
                  <button
                    className="combat-card-btn"
                    disabled={!canPlay}
                    onClick={e => {
                      e.stopPropagation();
                      if (canPlay) playCombatCard(card.id);
                    }}
                  >
                    {canPlay ? 'JOGAR' : 'SEM PONTOS'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Ações e Log do Combate */}
      <footer className="combat-bottom-bar">
        <button
          className="choice-btn combat-end-turn-btn"
          onClick={() => endCombatTurn()}
        >
          [ ENCERRAR TURNO ]
        </button>

        <div className="combat-log-box">
          {combat.combatLog.slice(-3).map((log, index) => (
            <div key={index} className="combat-log-line">
              {log}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default CombatScreen;
