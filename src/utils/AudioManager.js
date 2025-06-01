/**
 * Audio Manager for timer sounds
 * Handles initialization, playback, and error handling for all timer audio
 */

export class AudioManager {
  constructor() {
    this.sounds = {
      start: null,
      soon: null,
      ready: null,
      finish: null
    };
    this.initialized = false;
    this.enabled = true;
  }

  /**
   * Initialize all audio files
   */
  initialize() {
    if (this.initialized) return;

    try {
      this.sounds.start = new Audio('go.mp3');
      this.sounds.soon = new Audio('soon.mp3');
      this.sounds.ready = new Audio('ready.mp3');
      this.sounds.finish = new Audio('finish.mp3');

      Object.values(this.sounds).forEach(sound => {
        if (sound) sound.load();
      });

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing audio:", error);
      this.createFallbackSounds();
      this.enabled = false;
    }
  }

  createFallbackSounds() {
    const fallback = { play: () => Promise.resolve(), load: () => {} };
    this.sounds = {
      start: fallback,
      soon: fallback,
      ready: fallback,
      finish: fallback
    };
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