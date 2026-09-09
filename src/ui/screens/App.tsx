import React, { useState } from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import { useEventEngine } from '../../game/systems/useEventEngine';
import StatusScreen from './StatusScreen';
import CombatScreen from './CombatScreen';
import MainMenuScreen from './MainMenuScreen';
import CharacterSelectScreen from './CharacterSelectScreen';
import SettingsScreen from './SettingsScreen';
import { getEventImageUrl } from '../utils/assetHelper';
import '../../styles/global.css';

type AppScreen = 'MAIN_MENU' | 'CHARACTER_SELECT' | 'SETTINGS' | 'GAME';

const App: React.FC = () => {
  const {
    state,
    charactersData,
    startRunFromCharacter,
    hasSavedRun,
    loadSavedRun,
    restartRun,
  } = useGameState();

  const { currentEvent, availableChoices, makeChoice } = useEventEngine();
  const [screen, setScreen] = useState<AppScreen>('MAIN_MENU');
  const [showStatus, setShowStatus] = useState(false);

  // 1. Tela Inicial / Menu Principal
  if (screen === 'MAIN_MENU') {
    return (
      <MainMenuScreen
        onNewGame={() => setScreen('CHARACTER_SELECT')}
        onContinue={() => {
          if (loadSavedRun()) {
            setScreen('GAME');
          }
        }}
        onSettings={() => setScreen('SETTINGS')}
        canContinue={hasSavedRun()}
      />
    );
  }

  // 2. Tela de Configurações
  if (screen === 'SETTINGS') {
    return <SettingsScreen onBack={() => setScreen('MAIN_MENU')} />;
  }

  // 3. Tela de Seleção de Personagens
  if (screen === 'CHARACTER_SELECT') {
    return (
      <CharacterSelectScreen
        characters={charactersData}
        onSelectCharacter={character => {
          startRunFromCharacter(character);
          setScreen('GAME');
        }}
        onBack={() => setScreen('MAIN_MENU')}
      />
    );
  }

  // 4. Tela de Jogo (GAME)
  // Combate Narrativo com Cartas
  if (state.runState === 'COMBAT') {
    return <CombatScreen />;
  }

  const eventImageUrl = getEventImageUrl(currentEvent?.imageUrl);
  const latestLog =
    state.logHistory.length > 0
      ? state.logHistory[state.logHistory.length - 1]
      : null;

  // Tela de Fim de Jogo (Morte ou Vitória)
  if (state.runState === 'GAME_OVER' || state.runState === 'VICTORY') {
    const isVictory = state.runState === 'VICTORY';
    const isPhysicalDeath = state.player.health.current <= 0;

    return (
      <div className="game-container">
        <header className="hud">
          <span>SEED: {state.seed}</span>
          <span style={{ color: isVictory ? '#4caf50' : '#f44336' }}>
            {isVictory ? 'SOBREVIVÊNCIA' : 'RUN ENCERRADA'}
          </span>
          <button className="hud-btn" onClick={() => setScreen('MAIN_MENU')}>
            Menu
          </button>
        </header>

        <section className="narrative-section" style={{ justifyContent: 'center' }}>
          <h1
            style={{
              color: isVictory ? '#81c784' : '#e57373',
              letterSpacing: '4px',
            }}
          >
            {isVictory
              ? 'VOCÊ SOBREVIVEU'
              : isPhysicalDeath
              ? 'COLAPSO FÍSICO'
              : 'COLAPSO MENTAL'}
          </h1>

          <div className="narrative-text" style={{ maxWidth: '90%' }}>
            {isVictory
              ? 'Contra todas as probabilidades, você encontrou uma rota de fuga e sobreviveu aos horrores da cidade.'
              : isPhysicalDeath
              ? 'Seus ferimentos foram fatais. Seu corpo permanece abandonado na escuridão de Broken City.'
              : 'Sua mente não suportou o peso do horror indescritível. Você se perdeu para sempre na loucura.'}
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: '#888',
              fontStyle: 'italic',
              margin: '15px 0',
            }}
          >
            {latestLog}
          </div>

          <div className="choices-container">
            <button
              className="choice-btn"
              onClick={() => setScreen('CHARACTER_SELECT')}
            >
              [ SELECIONAR NOVO PERSONAGEM ]
            </button>
            <button className="choice-btn" onClick={() => restartRun()}>
              [ REPETIR RUN (MESMO PERSONAGEM) ]
            </button>
            <button
              className="choice-btn"
              onClick={() => setScreen('MAIN_MENU')}
            >
              [ MENU PRINCIPAL ]
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Tela de Evento Normal
  return (
    <div className="game-container">
      <header className="hud">
        <span>
          HP {state.player.health.current}/{state.player.health.max}
        </span>
        <span>
          SAN {state.player.sanity.current}/{state.player.sanity.max}
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="hud-btn"
            onClick={() => setShowStatus(!showStatus)}
          >
            {showStatus ? 'Voltar' : 'Status'}
          </button>
          <button
            className="hud-btn"
            onClick={() => setScreen('MAIN_MENU')}
            title="Voltar ao Menu Principal (progresso é salvo automaticamente)"
          >
            Menu
          </button>
        </div>
      </header>

      {showStatus ? (
        <StatusScreen onClose={() => setShowStatus(false)} />
      ) : (
        <>
          <section className="event-image-container">
            {eventImageUrl ? (
              <img src={eventImageUrl} alt={currentEvent.title} />
            ) : (
              <div style={{ color: '#555' }}>[ IMAGEM NÃO ENCONTRADA ]</div>
            )}
          </section>

          <section className="narrative-section">
            <h2
              style={{
                margin: 0,
                textTransform: 'uppercase',
                borderBottom: '1px solid #333',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {currentEvent.title}
            </h2>

            {latestLog && latestLog.startsWith('[TESTE') && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#ffb74d',
                  background: '#1c1708',
                  padding: '4px 10px',
                  border: '1px dashed #ffb74d',
                }}
              >
                {latestLog}
              </div>
            )}

            <div className="narrative-text">{currentEvent.description}</div>

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