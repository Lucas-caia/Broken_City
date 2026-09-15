import React from 'react';
import { useAudio } from '../context/AudioContext';
import '../../styles/global.css';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const {
    settings,
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
    toggleMute,
    playHover,
    playClick,
    playDiceRoll,
  } = useAudio();

  return (
    <div className="game-container settings-screen-container">
      <header className="hud">
        <span>CONFIGURAÇÕES DO SISTEMA</span>
        <button
          className="hud-btn"
          onMouseEnter={playHover}
          onClick={() => {
            playClick();
            onBack();
          }}
        >
          [ VOLTAR ]
        </button>
      </header>

      <section className="narrative-section settings-body">
        <h2 className="section-title">PARÂMETROS DE ÁUDIO & SOM</h2>

        <div className="settings-audio-panel">
          {/* Mute toggle */}
          <div className="settings-row">
            <span className="settings-label">ESTADO DO ÁUDIO:</span>
            <button
              className="choice-btn"
              style={{
                fontSize: '0.85rem',
                padding: '4px 14px',
                border: '1px solid',
                borderColor: settings.isMuted ? '#ef5350' : '#81c784',
                color: settings.isMuted ? '#ef5350' : '#81c784',
              }}
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                toggleMute();
              }}
            >
              {settings.isMuted ? '🔇 MUDO (DESATIVADO)' : '🔊 ATIVO (LIGADO)'}
            </button>
          </div>

          {/* Master Volume */}
          <div className="settings-row">
            <span className="settings-label">VOLUME PRINCIPAL (MASTER):</span>
            <div className="settings-slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.masterVolume * 100)}
                onChange={e => setMasterVolume(Number(e.target.value) / 100)}
                className="settings-slider"
              />
              <span className="settings-value">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
          </div>

          {/* BGM Volume */}
          <div className="settings-row">
            <span className="settings-label">MÚSICA DE FUNDO (BGM):</span>
            <div className="settings-slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.bgmVolume * 100)}
                onChange={e => setBgmVolume(Number(e.target.value) / 100)}
                className="settings-slider"
              />
              <span className="settings-value">
                {Math.round(settings.bgmVolume * 100)}%
              </span>
            </div>
          </div>

          {/* SFX Volume */}
          <div className="settings-row">
            <span className="settings-label">EFEITOS SONOROS (SFX):</span>
            <div className="settings-slider-wrapper">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(settings.sfxVolume * 100)}
                onChange={e => setSfxVolume(Number(e.target.value) / 100)}
                className="settings-slider"
              />
              <span className="settings-value">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Botão de Teste de Efeitos */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              className="choice-btn"
              style={{ fontSize: '0.8rem', color: '#ffb74d', border: '1px solid #ffb74d', padding: '5px 12px' }}
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                playDiceRoll();
              }}
            >
              [ 🎲 TESTAR EFEITOS SONOROS ]
            </button>
          </div>
        </div>

        <div className="choices-container" style={{ marginTop: '30px' }}>
          <button
            className="choice-btn"
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              onBack();
            }}
          >
            [ VOLTAR AO MENU PRINCIPAL ]
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsScreen;
