import { loadFromLocalStorage, saveToLocalStorage } from './storage';

const DEFAULT_VOLUME = 100;

/**
 * Audio Manager for timer sounds
 * Handles initialization, playback, and error handling for all timer audio
 * Singleton pattern ensures only one instance exists
 */

export class AudioManager {
  static instance = null;

  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }

    this.sounds = {
      start: null,
      soon: null,
      ready: null,
      finish: null
    };
    this.initialized = false;
    this.enabled = true;
    this.volume = loadFromLocalStorage('volume', DEFAULT_VOLUME);

    AudioManager.instance = this;
    return this;
  }

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize all audio files
   */
  initialize() {
    if (!this.sounds.start) {
      try {
        this.sounds.start = new Audio('go.mp3');
        this.sounds.soon = new Audio('soon.mp3');
        this.sounds.ready = new Audio('ready.mp3');
        this.sounds.finish = new Audio('finish.mp3');

        // Set volume from saved settings
        this.applyVolume();

        // Preload audio
        this.sounds.start.load();
        this.sounds.soon.load();
        this.sounds.ready.load();
        this.sounds.finish.load();

        this.initialized = true;
      } catch (error) {
        console.error("Error initializing audio:", error);
        // Fallback: disable audio in environments without Audio support
        const mockAudio = { play: () => Promise.resolve(), load: () => {}, volume: 1 };
        this.sounds = { start: mockAudio, soon: mockAudio, ready: mockAudio, finish: mockAudio };
        this.enabled = false;
      }
    }
  }

  /**
   * Apply volume to all sounds
   */
  applyVolume() {
    const vol = this.volume / 100;
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.volume !== undefined) {
        sound.volume = vol;
      }
    });
  }

  /**
   * Set volume (0-100) and persist to storage
   */
  setVolume(volume) {
    this.volume = volume;
    saveToLocalStorage('volume', volume);
    this.applyVolume();
  }

  /**
   * Get current volume (0-100)
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Play a specific sound with error handling
   */
  async playSound(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;

    try {
      await this.sounds[soundName].play();
    } catch (error) {
      console.error(`Error playing ${soundName} sound:`, error);
    }
  }

  // Convenient methods for each sound type
  playStart() { return this.playSound('start'); }
  playSoon() { return this.playSound('soon'); }
  playReady() { return this.playSound('ready'); }
  playFinish() { return this.playSound('finish'); }
}