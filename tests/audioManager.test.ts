import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager } from '../src/game/systems/audioManager';

describe('Gerenciador de Efeitos Sonoros & Áudio (AudioManager)', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }

    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      key: () => null,
      length: Object.keys(store).length,
    } as any;
  });

  it('deve obter a instância singleton do AudioManager', () => {
    const instance1 = AudioManager.getInstance();
    const instance2 = AudioManager.getInstance();
    expect(instance1).toBeDefined();
    expect(instance1).toBe(instance2);
  });

  it('deve possuir valores padrão de volume e mute', () => {
    const manager = AudioManager.getInstance();
    const settings = manager.getSettings();

    expect(settings.masterVolume).toBeGreaterThan(0);
    expect(settings.masterVolume).toBeLessThanOrEqual(1);
    expect(settings.sfxVolume).toBeGreaterThan(0);
    expect(settings.sfxVolume).toBeLessThanOrEqual(1);
    expect(settings.bgmVolume).toBeGreaterThan(0);
    expect(settings.bgmVolume).toBeLessThanOrEqual(1);
    expect(settings.isMuted).toBe(false);
  });

  it('deve ajustar o volume Master com clamping entre 0 e 1', () => {
    const manager = AudioManager.getInstance();

    manager.setMasterVolume(0.4);
    expect(manager.getSettings().masterVolume).toBe(0.4);

    manager.setMasterVolume(-0.5);
    expect(manager.getSettings().masterVolume).toBe(0);

    manager.setMasterVolume(1.8);
    expect(manager.getSettings().masterVolume).toBe(1);
  });

  it('deve ajustar os volumes de SFX e BGM com clamping', () => {
    const manager = AudioManager.getInstance();

    manager.setSfxVolume(0.65);
    expect(manager.getSettings().sfxVolume).toBe(0.65);

    manager.setBgmVolume(0.3);
    expect(manager.getSettings().bgmVolume).toBe(0.3);

    manager.setSfxVolume(-1);
    expect(manager.getSettings().sfxVolume).toBe(0);

    manager.setBgmVolume(2);
    expect(manager.getSettings().bgmVolume).toBe(1);
  });

  it('deve alternar o estado de mudo corretamente', () => {
    const manager = AudioManager.getInstance();
    const initialMuted = manager.getSettings().isMuted;

    const firstToggle = manager.toggleMute();
    expect(firstToggle).toBe(!initialMuted);
    expect(manager.getSettings().isMuted).toBe(!initialMuted);

    const secondToggle = manager.toggleMute();
    expect(secondToggle).toBe(initialMuted);
    expect(manager.getSettings().isMuted).toBe(initialMuted);
  });

  it('deve persistir as configurações no localStorage', () => {
    const manager = AudioManager.getInstance();
    manager.setMasterVolume(0.72);
    manager.setSfxVolume(0.55);

    const savedRaw = store['broken_city_audio_settings_v1'];
    expect(savedRaw).toBeDefined();

    const parsed = JSON.parse(savedRaw);
    expect(parsed.masterVolume).toBe(0.72);
    expect(parsed.sfxVolume).toBe(0.55);
  });

  it('deve executar métodos de disparo de efeitos e música sem lançar exceções mesmo sem DOM de áudio', () => {
    const manager = AudioManager.getInstance();

    expect(() => manager.playHover()).not.toThrow();
    expect(() => manager.playClick()).not.toThrow();
    expect(() => manager.playDiceRoll()).not.toThrow();
    expect(() => manager.playCardPlay()).not.toThrow();
    expect(() => manager.playDamage()).not.toThrow();
    expect(() => manager.playHeal()).not.toThrow();
    expect(() => manager.playVictory()).not.toThrow();
    expect(() => manager.playGameOver()).not.toThrow();
    expect(() => manager.playBGM('menu')).not.toThrow();
    expect(() => manager.stopBGM()).not.toThrow();
  });
});

