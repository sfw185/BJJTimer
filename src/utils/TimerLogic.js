import {
  createInitialState,
  TIMER_PHASES,
  TIMER_CONSTANTS,
  getCurrentPhaseDuration,
  shouldTransitionPhase,
  getNextPhase,
  createPhaseTransition,
  validateSettings
} from './TimerState';
import { AudioManager } from './AudioManager';
import { calculateFinishTime } from './FinishTimeCalculator';

/**
 * Core timer logic class
 * Manages all timer state, transitions, and business logic
 */
export class TimerLogic {
  constructor(initialSettings = {}) {
    const { roundTime, restTime, totalRounds } = validateSettings(
      initialSettings.roundTime || 5 * 60 * 1000,
      initialSettings.restTime || 20 * 1000,
      initialSettings.totalRounds || 0
    );

    this.state = createInitialState(roundTime, restTime, totalRounds);
    this.audioManager = AudioManager.getInstance();
    this.subscribers = new Set();
    this.intervalId = null;
    this.lastActionTime = 0; // For debouncing rapid actions
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of state change
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  /**
   * Get current state with calculated finish time
   */
  getState() {
    return {
      ...this.state,
      finishTime: calculateFinishTime(this.state)
    };
  }

  /**
   * Update timer settings
   */
  updateSettings(newSettings) {
    const validated = validateSettings(
      newSettings.roundTime ?? this.state.roundTime,
      newSettings.restTime ?? this.state.restTime,
      newSettings.totalRounds ?? this.state.totalRounds
    );

    this.state = {
      ...this.state,
      ...validated
    };

    // Update timeLeft if idle and roundTime changed
    if (this.state.phase === TIMER_PHASES.IDLE && this.state.currentRound === 0) {
      this.state.timeLeft = validated.roundTime;
    }

    this.notifySubscribers();
  }
  /**
   * Start or resume the timer
   */
  start() {
    // Prevent double-start race condition
    if (this.state.isRunning) return;

    // Initialize and ensure audio is loaded on user interaction (required for iOS)
    this.audioManager.initialize();

    // Capture precise start time immediately
    const now = Date.now();

    if (this.state.phase === TIMER_PHASES.IDLE && this.state.currentRound === 0) {
      // Starting fresh - begin with ready phase
      this.transitionToPhase(TIMER_PHASES.READY);
      // Override the startTime from transitionToPhase with our precise timestamp
      this.state.startTime = now;
      this.audioManager.playReady();
    } else {
      // Resuming - recalculate start time based on current timeLeft with precise timing
      const currentPhaseDuration = getCurrentPhaseDuration(this.state);
      this.state.startTime = now - (currentPhaseDuration - this.state.timeLeft);
    }

    this.state.isRunning = true;
    if (!this.state.sessionStartTime) {
      this.state.sessionStartTime = now;
    }

    this.startTicking();
    this.notifySubscribers();
  }

  /**
   * Pause the timer
   */
  pause() {
    // Prevent double-pause race condition
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    this.stopTicking();
    this.notifySubscribers();
  }

  /**
   * Reset the timer to initial state
   */
  reset() {
    this.stopTicking();
    this.state = createInitialState(
      this.state.roundTime,
      this.state.restTime,
      this.state.totalRounds
    );
    this.notifySubscribers();
  }
  /**
   * Toggle between start and pause
   */
  toggle() {
    // Debounce rapid toggle attempts (prevent double-clicks)
    const now = Date.now();
    if (now - this.lastActionTime < 100) return; // 100ms debounce
    this.lastActionTime = now;

    if (this.state.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Start the ticking interval
   */
  startTicking() {
    // Enhanced protection against multiple intervals
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, TIMER_CONSTANTS.RENDER_RATE);
  }

  /**
   * Stop the ticking interval
   */
  stopTicking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Main tick function - updates timer state
   */
  tick() {
    // Additional safety checks to prevent inconsistent state
    if (!this.state.isRunning || !this.state.startTime || this.intervalId === null) return;

    const now = Date.now();
    const currentPhaseDuration = getCurrentPhaseDuration(this.state);
    const elapsedTimeInPhase = now - this.state.startTime;
    const newTimeLeft = currentPhaseDuration - elapsedTimeInPhase;

    // Update timeLeft first
    this.state.timeLeft = newTimeLeft;

    // Check for phase transition using the utility function
    if (shouldTransitionPhase(this.state)) {
      this.handlePhaseTransition();
      return; // handlePhaseTransition will handle the rest
    }

    // Check for audio cues
    this.checkAudioCues();

    this.notifySubscribers();
  }
  /**
   * Check and play audio cues based on current state
   */
  checkAudioCues() {
    const { timeLeft, phase, readySoundPlayed, soonSoundPlayed } = this.state;

    // Play "ready" sound towards end of rest period
    if (phase === TIMER_PHASES.REST &&
        timeLeft <= TIMER_CONSTANTS.READY_TIME &&
        !readySoundPlayed) {
      this.audioManager.playReady();
      this.state.readySoundPlayed = true;
    }

    // Play "soon" sound towards end of work round
    // Use a time window to ensure we don't miss the exact moment
    if (phase === TIMER_PHASES.WORK &&
        timeLeft <= TIMER_CONSTANTS.SOON_TIME &&
        timeLeft > (TIMER_CONSTANTS.SOON_TIME - TIMER_CONSTANTS.RENDER_RATE * 2) &&
        !soonSoundPlayed) {
      this.audioManager.playSoon();
      this.state.soonSoundPlayed = true;
    }
  }

  /**
   * Handle transition to next phase when current phase ends
   */
  handlePhaseTransition() {
    const nextPhase = getNextPhase(this.state);

    // Set timeLeft to 0 for current phase
    this.state.timeLeft = 0;

    // Play transition sounds immediately
    switch (this.state.phase) {
      case TIMER_PHASES.READY:
        this.audioManager.playStart();
        break;
      case TIMER_PHASES.WORK:
        if (nextPhase === TIMER_PHASES.IDLE) {
          // Session complete
          this.audioManager.playFinish();
          this.reset();
          return;
        } else {
          this.audioManager.playFinish();
        }
        break;
      case TIMER_PHASES.REST:
        this.audioManager.playStart();
        break;
    }

    this.transitionToPhase(nextPhase);
    this.notifySubscribers();
  }
  /**
   * Transition to a new phase
   */
  transitionToPhase(newPhase) {
    this.state = createPhaseTransition(this.state, newPhase);
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.stopTicking();
    this.subscribers.clear();
  }
}