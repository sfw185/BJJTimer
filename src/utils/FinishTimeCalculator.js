import { TIMER_PHASES, TIMER_CONSTANTS } from './TimerState';

/**
 * Calculates the estimated finish time for the timer session
 */
export const calculateFinishTime = (state) => {
  if (state.totalRounds <= 0) {
    return null; // Infinite rounds - no finish time
  }

  const now = new Date();
  let futureMillis = 0;

  // Case 1: Timer is idle (reset, or before first start)
  if (state.currentRound === 0 && state.phase === TIMER_PHASES.IDLE) {
    futureMillis = TIMER_CONSTANTS.READY_TIME;
    futureMillis += state.totalRounds * state.roundTime;
    if (state.totalRounds > 1) {
      futureMillis += (state.totalRounds - 1) * state.restTime;
    }
  }
  // Case 2: Timer is in the 'Get Ready' stage
  else if (state.phase === TIMER_PHASES.READY) {
    futureMillis = state.timeLeft;
    futureMillis += state.totalRounds * state.roundTime;
    if (state.totalRounds > 1) {
      futureMillis += (state.totalRounds - 1) * state.restTime;
    }
  }
  // Case 3: Timer is in a Rest period
  else if (state.phase === TIMER_PHASES.REST) {
    futureMillis = state.timeLeft;
    const roundsYetToStartAfterThisRest = state.totalRounds - state.currentRound;
    if (roundsYetToStartAfterThisRest > 0) {
      futureMillis += roundsYetToStartAfterThisRest * state.roundTime;
      if (roundsYetToStartAfterThisRest > 1) {
        futureMillis += (roundsYetToStartAfterThisRest - 1) * state.restTime;
      }
    }
  }  // Case 4: Timer is in an active Work round
  else if (state.phase === TIMER_PHASES.WORK) {
    futureMillis = state.timeLeft;
    const fullWorkRoundsRemainingAfterCurrent = state.totalRounds - state.currentRound;

    if (fullWorkRoundsRemainingAfterCurrent > 0) {
      futureMillis += fullWorkRoundsRemainingAfterCurrent * state.roundTime;
      futureMillis += fullWorkRoundsRemainingAfterCurrent * state.restTime;
    }
  }

  if (futureMillis < 0) futureMillis = 0;

  return new Date(now.getTime() + futureMillis);
};