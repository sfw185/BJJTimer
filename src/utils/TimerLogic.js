import { 
  createInitialState, 
  TIMER_PHASES, 
  TIMER_CONSTANTS,
  TIMER_CONSTANTS_DERIVED,
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
    this.audioManager = new AudioManager();
    this.subscribers = new Set();
    this.intervalId = null;    
    // Initialize audio
    this.audioManager.initialize();
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
    this.audioManager.initialize(); // Ensure audio is ready

    if (this.state.phase === TIMER_PHASES.IDLE && this.state.currentRound === 0) {
      // Starting fresh - begin with ready phase
      this.transitionToPhase(TIMER_PHASES.READY);
      this.audioManager.playReady();
    } else {
      // Resuming - recalculate start time based on current timeLeft
      const currentPhaseDuration = getCurrentPhaseDuration(this.state);
      this.state.startTime = Date.now() - (currentPhaseDuration - this.state.timeLeft);
    }

    this.state.isRunning = true;
    if (!this.state.sessionStartTime) {
      this.state.sessionStartTime = Date.now();
    }

    this.startTicking();
    this.notifySubscribers();
  }

  /**
   * Pause the timer
   */
  pause() {
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
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, TIMER_CONSTANTS_DERIVED.RENDER_RATE);
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
    if (!this.state.isRunning || !this.state.startTime) return;

    const now = Date.now();
    const currentPhaseDuration = getCurrentPhaseDuration(this.state);
    const elapsedTimeInPhase = now - this.state.startTime;
    const newTimeLeft = currentPhaseDuration - elapsedTimeInPhase;

    this.state.timeLeft = Math.max(0, newTimeLeft);

    // Check for audio cues
    this.checkAudioCues();

    // Check for phase transition
    if (shouldTransitionPhase(this.state)) {
      this.handlePhaseTransition();
    }

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
        timeLeft > (TIMER_CONSTANTS.READY_TIME - TIMER_CONSTANTS_DERIVED.RENDER_RATE) && 
        !readySoundPlayed) {
      this.audioManager.playReady();
      this.state.readySoundPlayed = true;
    }

    // Play "soon" sound towards end of work round
    if (phase === TIMER_PHASES.WORK && 
        timeLeft <= TIMER_CONSTANTS.SOON_TIME && 
        timeLeft > (TIMER_CONSTANTS.SOON_TIME - TIMER_CONSTANTS_DERIVED.RENDER_RATE) && 
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