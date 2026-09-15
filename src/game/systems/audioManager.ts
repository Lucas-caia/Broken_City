import { getAudioFileUrl } from '../../ui/utils/audioHelper';

export interface AudioSettings {
  masterVolume: number; // 0.0 a 1.0
  sfxVolume: number;    // 0.0 a 1.0
  bgmVolume: number;    // 0.0 a 1.0
  isMuted: boolean;
}

const SETTINGS_KEY = 'broken_city_audio_settings_v1';

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  isMuted: false,
};

export class AudioManager {
  private static instance: AudioManager | null = null;
  private settings: AudioSettings;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  // Controle de BGM
  private currentBgmAudio: HTMLAudioElement | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private currentBgmType: string | null = null;

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // --- Gerenciamento de Configurações e Persistência ---

  private loadSettings(): AudioSettings {
    try {
      if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return {
        masterVolume: typeof parsed.masterVolume === 'number' ? parsed.masterVolume : DEFAULT_SETTINGS.masterVolume,
        sfxVolume: typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : DEFAULT_SETTINGS.sfxVolume,
        bgmVolume: typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : DEFAULT_SETTINGS.bgmVolume,
        isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : DEFAULT_SETTINGS.isMuted,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (err) {
      console.warn('Erro ao salvar preferências de áudio:', err);
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    this.updateGainNodes();
  }

  public setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    this.updateGainNodes();
  }

  public setBgmVolume(volume: number): void {
    this.settings.bgmVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    this.updateGainNodes();
    if (this.currentBgmAudio) {
      this.currentBgmAudio.volume = this.getEffectiveBgmVolume();
    }
  }

  public toggleMute(): boolean {
    this.settings.isMuted = !this.settings.isMuted;
    this.saveSettings();
    this.updateGainNodes();
    if (this.currentBgmAudio) {
      this.currentBgmAudio.volume = this.getEffectiveBgmVolume();
    }
    return this.settings.isMuted;
  }

  private getEffectiveMasterVolume(): number {
    return this.settings.isMuted ? 0 : this.settings.masterVolume;
  }

  private getEffectiveSfxVolume(): number {
    return this.getEffectiveMasterVolume() * this.settings.sfxVolume;
  }

  private getEffectiveBgmVolume(): number {
    return this.getEffectiveMasterVolume() * this.settings.bgmVolume;
  }

  // --- Inicialização do Web Audio Context ---

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.audioCtx = new AudioCtxClass();

      // Grafo de áudio: SFX/BGM -> Master -> Destination
      this.masterGain = this.audioCtx.createGain();
      this.sfxGain = this.audioCtx.createGain();
      this.bgmGain = this.audioCtx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      this.updateGainNodes();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private updateGainNodes(): void {
    if (!this.audioCtx || !this.masterGain || !this.sfxGain || !this.bgmGain) return;
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.setValueAtTime(this.getEffectiveMasterVolume(), now);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, now);
    this.bgmGain.gain.setValueAtTime(this.settings.bgmVolume, now);
  }

  // --- Efeitos Sonoros (SFX) com Fallback Procedural ---

  private playAudioFile(filename: string, channelVolume: number): boolean {
    const url = getAudioFileUrl(filename);
    if (!url) return false;

    try {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, channelVolume));
      audio.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  public playHover(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    // 1. Tentar arquivo customizado em src/assets/audio/sfx/hover.mp3
    if (this.playAudioFile('hover.mp3', this.getEffectiveSfxVolume())) return;

    // 2. Fallback: Sintetizador Web Audio (chirp de alta frequência suave)
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.02);

    gain.gain.setValueAtTime(0.04 * this.getEffectiveSfxVolume(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playClick(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('click.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    gain.gain.setValueAtTime(0.12 * this.getEffectiveSfxVolume(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDiceRoll(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('dice_roll.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    // Simulação de chocalho de dados com múltiplos impulsos
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const burstTime = now + i * 0.05 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, burstTime);

      gain.gain.setValueAtTime(0.08 * this.getEffectiveSfxVolume(), burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(burstTime);
      osc.stop(burstTime + 0.045);
    }
  }

  public playCardPlay(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('card_play.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.15 * this.getEffectiveSfxVolume(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playDamage(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('player_damage.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    gain.gain.setValueAtTime(0.2 * this.getEffectiveSfxVolume(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playHeal(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('heal.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.08 * this.getEffectiveSfxVolume(), noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  }

  public playVictory(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('victory.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [293.66, 349.23, 440.0, 587.33]; // D4, F4, A4, D5

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15 * this.getEffectiveSfxVolume(), noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  public playGameOver(): void {
    if (this.settings.isMuted || this.getEffectiveSfxVolume() <= 0) return;

    if (this.playAudioFile('game_over.mp3', this.getEffectiveSfxVolume())) return;

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.sfxGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.2 * this.getEffectiveSfxVolume(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // --- Música de Fundo (BGM) & Drone Atmosférico ---

  public playBGM(type: 'menu' | 'combat' | 'exploration'): void {
    if (this.currentBgmType === type) return;

    this.stopBGM();
    this.currentBgmType = type;

    // 1. Verificar se existe arquivo de áudio dedicado
    const filename = `${type}_theme.mp3`;
    const url = getAudioFileUrl(filename);

    if (url) {
      try {
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = this.getEffectiveBgmVolume();
        audio.play().catch(() => {});
        this.currentBgmAudio = audio;
        return;
      } catch (err) {
        console.warn(`Falha ao tocar BGM ${filename}:`, err);
      }
    }

    // 2. Fallback: Drone Cósmico Procedural (Web Audio API)
    this.startDarkAmbientDrone(type);
  }

  private startDarkAmbientDrone(type: 'menu' | 'combat' | 'exploration'): void {
    const ctx = this.ensureAudioContext();
    if (!ctx || !this.bgmGain) return;

    const now = ctx.currentTime;
    const baseFreq = type === 'combat' ? 65 : type === 'menu' ? 55 : 45; // Hz

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const droneGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(baseFreq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq + 1.8, now); // Leve dissonância binaural

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'combat' ? 240 : 160, now);
    filter.Q.setValueAtTime(3, now);

    droneGain.gain.setValueAtTime(0.08, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.bgmGain);

    osc1.start(now);
    osc2.start(now);

    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
    this.droneGain = droneGain;
  }

  public stopBGM(): void {
    if (this.currentBgmAudio) {
      try {
        this.currentBgmAudio.pause();
        this.currentBgmAudio.currentTime = 0;
      } catch {}
      this.currentBgmAudio = null;
    }

    if (this.droneOsc1 && this.droneOsc2) {
      try {
        this.droneOsc1.stop();
        this.droneOsc2.stop();
        this.droneOsc1.disconnect();
        this.droneOsc2.disconnect();
      } catch {}
      this.droneOsc1 = null;
      this.droneOsc2 = null;
    }

    if (this.droneGain) {
      try {
        this.droneGain.disconnect();
      } catch {}
      this.droneGain = null;
    }

    this.currentBgmType = null;
  }
}

export const audioManager = AudioManager.getInstance();
