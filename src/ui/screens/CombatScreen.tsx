import React, { useEffect, useState, useRef } from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import { useAudio } from '../context/AudioContext';
import { getEventImageUrl } from '../utils/assetHelper';
import '../../styles/global.css';

const DICE_ICONS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const CombatScreen: React.FC = () => {
  const { state, playCombatCard, endCombatTurn } = useGameState();
  const { playHover, playCardPlay, playDiceRoll, playDamage, playBGM } = useAudio();
  const combat = state.combat;

  // Estados de animação e impacto (Issue #20)
  const [playedCardId, setPlayedCardId] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState<'light' | 'heavy' | null>(null);
  const [isEnemyHit, setIsEnemyHit] = useState<boolean>(false);
  const [isHpBarGlowing, setIsHpBarGlowing] = useState<boolean>(false);
  const [floatingDamage, setFloatingDamage] = useState<{ amount: number; id: number } | null>(null);
  const [playerDamageFlash, setPlayerDamageFlash] = useState<boolean>(false);
  const [playerDamageAmount, setPlayerDamageAmount] = useState<number | null>(null);
  const [isEndingTurn, setIsEndingTurn] = useState<boolean>(false);

  // Rastreamento de vida para disparar reações dinâmicas
  const prevEnemyHpRef = useRef<number>(combat?.enemy.currentHealth ?? 0);
  const prevPlayerHpRef = useRef<number>(state.player.health.current);

  // Música de combate
  useEffect(() => {
    playBGM('combat');
  }, [playBGM]);

  // Efeito ao receber dano no inimigo
  useEffect(() => {
    if (!combat) return;

    const currentEnemyHp = combat.enemy.currentHealth;
    if (currentEnemyHp < prevEnemyHpRef.current) {
      const dmg = prevEnemyHpRef.current - currentEnemyHp;
      setIsEnemyHit(true);
      setIsHpBarGlowing(true);
      setFloatingDamage({ amount: dmg, id: Date.now() });
      setScreenShake('light');

      const t1 = setTimeout(() => setIsEnemyHit(false), 360);
      const t2 = setTimeout(() => setIsHpBarGlowing(false), 460);
      const t3 = setTimeout(() => setFloatingDamage(null), 760);
      const t4 = setTimeout(() => setScreenShake(null), 360);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
    prevEnemyHpRef.current = currentEnemyHp;
  }, [combat?.enemy.currentHealth]);

  // Efeito ao jogador receber dano (contra-ataque inimigo no encerramento de turno)
  useEffect(() => {
    const currentPlayerHp = state.player.health.current;
    if (currentPlayerHp < prevPlayerHpRef.current) {
      const dmg = prevPlayerHpRef.current - currentPlayerHp;
      setPlayerDamageFlash(true);
      setPlayerDamageAmount(dmg);
      setScreenShake('heavy');

      const t1 = setTimeout(() => setPlayerDamageFlash(false), 460);
      const t2 = setTimeout(() => setPlayerDamageAmount(null), 760);
      const t3 = setTimeout(() => setScreenShake(null), 460);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    prevPlayerHpRef.current = currentPlayerHp;
  }, [state.player.health.current]);

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

  // Disparo com animação de carta
  const handleCardClick = (cardId: string) => {
    if (playedCardId) return;
    setPlayedCardId(cardId);
    playCardPlay();

    setTimeout(() => {
      playCombatCard(cardId);
      setPlayedCardId(null);
    }, 220);
  };

  // Encerramento de turno com feedback
  const handleEndTurn = () => {
    if (isEndingTurn || playedCardId) return;
    setIsEndingTurn(true);
    playDamage();
    playDiceRoll();
    endCombatTurn();
    setTimeout(() => setIsEndingTurn(false), 450);
  };

  return (
    <div
      className={`game-container combat-screen-container ${
        screenShake ? `shake-${screenShake}` : ''
      }`}
    >
      {/* Vinheta de dano vermelho ao sofrer golpe */}
      {playerDamageFlash && <div className="combat-damage-vignette" />}

      {/* HUD Superior */}
      <header className="hud">
        <span>
          HP: {state.player.health.current}/{state.player.health.max}
          {playerDamageAmount !== null && (
            <span style={{ color: '#ef5350', fontSize: '0.9rem', marginLeft: '6px' }}>
              (-{playerDamageAmount})
            </span>
          )}
        </span>
        <span style={{ color: '#ffb74d' }}>RODADA {combat.round}</span>
        <span style={{ color: '#64b5f6' }}>PONTOS: {combat.availablePoints}</span>
      </header>

      {/* Seção do Inimigo */}
      <section className="combat-enemy-panel">
        {/* Indicador de dano numérico flutuante sobre o inimigo */}
        {floatingDamage && (
          <div key={floatingDamage.id} className="floating-damage-number">
            -{floatingDamage.amount}
          </div>
        )}

        {enemyImageUrl && (
          <div className={`combat-enemy-image ${isEnemyHit ? 'hit' : ''}`}>
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

          <div className={`combat-hp-bar-container ${isHpBarGlowing ? 'damage-glow' : ''}`}>
            <div className="combat-hp-bar-ghost" style={{ width: `${hpPercent}%` }} />
            <div className="combat-hp-bar-fill" style={{ width: `${hpPercent}%` }} />
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
              const isPlaying = playedCardId === card.id;
              const canPlay = !playedCardId && combat.availablePoints >= card.cost;

              return (
                <div
                  key={card.id}
                  className={`combat-card ${canPlay ? 'playable' : 'disabled'} ${
                    isPlaying ? 'card-playing' : ''
                  }`}
                  onMouseEnter={canPlay ? playHover : undefined}
                  onClick={() => {
                    if (canPlay) {
                      handleCardClick(card.id);
                    }
                  }}
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
                    onMouseEnter={canPlay ? playHover : undefined}
                    onClick={e => {
                      e.stopPropagation();
                      if (canPlay) {
                        handleCardClick(card.id);
                      }
                    }}
                  >
                    {isPlaying ? 'LANÇANDO...' : canPlay ? 'JOGAR' : 'SEM PONTOS'}
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
          className={`choice-btn combat-end-turn-btn ${isEndingTurn ? 'disabled' : ''}`}
          disabled={isEndingTurn}
          onMouseEnter={!isEndingTurn ? playHover : undefined}
          onClick={handleEndTurn}
        >
          {isEndingTurn ? '[ CONTRA-ATAQUE INIMIGO... ]' : '[ ENCERRAR TURNO ]'}
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
