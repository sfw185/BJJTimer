/**
 * Timer state management utility
 * Defines the core timer state structure and handles state transitions
 */

export const TIMER_PHASES = {
  IDLE: 'idle',
  READY: 'ready',
  WORK: 'work',
  REST: 'rest'
};

export const TIMER_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  RENDER_RATE: 1000 / 30,
  READY_TIME: 3 * 1000,
  SOON_TIME: 10 * 1000,
  MIN_ROUND_TIME: 30 * 1000,
  MIN_REST_TIME: 10 * 1000
};

/**
 * Creates initial timer state
 */
export const createInitialState = (roundTime, restTime, totalRounds) => ({
  currentRound: 0,
  totalRounds,
  isRunning: false,
  timeLeft: roundTime,
  phase: TIMER_PHASES.IDLE,
  startTime: null,
  sessionStartTime: null,
  roundTime,
  restTime,
  soonSoundPlayed: false,
  readySoundPlayed: false,
  finishTime: null
});
/**
 * Validates and clamps timer settings
 */
export const validateSettings = (roundTime, restTime, totalRounds) => ({
  roundTime: Math.max(TIMER_CONSTANTS.MIN_ROUND_TIME, roundTime),
  restTime: Math.max(TIMER_CONSTANTS.MIN_REST_TIME, restTime),
  totalRounds: Math.max(0, totalRounds)
});

/**
 * Gets the duration for the current phase
 */
export const getCurrentPhaseDuration = (state) => {
  switch (state.phase) {
    case TIMER_PHASES.READY:
      return TIMER_CONSTANTS.READY_TIME;
    case TIMER_PHASES.REST:
      return state.restTime;
    case TIMER_PHASES.WORK:
      return state.roundTime;
    default:
      return state.roundTime;
  }
};

/**
 * Checks if the current phase should transition to the next one
 */
export const shouldTransitionPhase = (state) => {
  return state.timeLeft <= 0;
};
/**
 * Determines the next phase after current one ends
 */
export const getNextPhase = (state) => {
  switch (state.phase) {
    case TIMER_PHASES.READY:
      return TIMER_PHASES.WORK;
    case TIMER_PHASES.WORK:
      if (state.totalRounds > 0 && state.currentRound >= state.totalRounds) {
        return TIMER_PHASES.IDLE;
      }
      return TIMER_PHASES.REST;
    case TIMER_PHASES.REST:
      return TIMER_PHASES.WORK;
    default:
      return TIMER_PHASES.READY;
  }
};

/**
 * Creates state for transitioning to a new phase
 */
export const createPhaseTransition = (state, newPhase) => {
  const now = Date.now();
  let updates = {
    phase: newPhase,
    startTime: now,
    soonSoundPlayed: false,
    readySoundPlayed: false
  };

  switch (newPhase) {
    case TIMER_PHASES.READY:
      updates = {
        ...updates,
        timeLeft: TIMER_CONSTANTS.READY_TIME,
        currentRound: 0,
        readySoundPlayed: true
      };
      break;

    case TIMER_PHASES.WORK:
      updates = {
        ...updates,
        timeLeft: state.roundTime,
        currentRound: state.currentRound + 1
      };
      break;
    case TIMER_PHASES.REST:
      updates = {
        ...updates,
        timeLeft: state.restTime
      };
      break;

    case TIMER_PHASES.IDLE:
      updates = {
        ...updates,
        timeLeft: state.roundTime,
        currentRound: 0,
        isRunning: false,
        startTime: null,
        sessionStartTime: null,
        finishTime: null
      };
      break;
  }

  return { ...state, ...updates };
};