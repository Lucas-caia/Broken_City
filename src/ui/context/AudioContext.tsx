import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioManager, AudioSettings } from '../../game/systems/audioManager';

interface AudioContextValue {
  settings: AudioSettings;
  playHover: () => void;
  playClick: () => void;
  playDiceRoll: () => void;
  playCardPlay: () => void;
  playDamage: () => void;
  playHeal: () => void;
  playVictory: () => void;
  playGameOver: () => void;
  playBGM: (type: 'menu' | 'combat' | 'exploration') => void;
  stopBGM: () => void;
  setMasterVolume: (val: number) => void;
  setSfxVolume: (val: number) => void;
  setBgmVolume: (val: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => audioManager.getSettings());

  const updateSettings = () => {
    setSettings(audioManager.getSettings());
  };

  const playHover = () => audioManager.playHover();
  const playClick = () => audioManager.playClick();
  const playDiceRoll = () => audioManager.playDiceRoll();
  const playCardPlay = () => audioManager.playCardPlay();
  const playDamage = () => audioManager.playDamage();
  const playHeal = () => audioManager.playHeal();
  const playVictory = () => audioManager.playVictory();
  const playGameOver = () => audioManager.playGameOver();
  const playBGM = (type: 'menu' | 'combat' | 'exploration') => audioManager.playBGM(type);
  const stopBGM = () => audioManager.stopBGM();

  const setMasterVolume = (val: number) => {
    audioManager.setMasterVolume(val);
    updateSettings();
  };

  const setSfxVolume = (val: number) => {
    audioManager.setSfxVolume(val);
    updateSettings();
  };

  const setBgmVolume = (val: number) => {
    audioManager.setBgmVolume(val);
    updateSettings();
  };

  const toggleMute = () => {
    audioManager.toggleMute();
    updateSettings();
  };

  // Inicializa o desbloqueio do áudio na primeira interação do usuário com a página
  useEffect(() => {
    const handleFirstInteraction = () => {
      audioManager.playHover(); // Dispara inicialização leve do AudioContext
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        settings,
        playHover,
        playClick,
        playDiceRoll,
        playCardPlay,
        playDamage,
        playHeal,
        playVictory,
        playGameOver,
        playBGM,
        stopBGM,
        setMasterVolume,
        setSfxVolume,
        setBgmVolume,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio deve ser utilizado dentro de um AudioProvider');
  }
  return context;
};

