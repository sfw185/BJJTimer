import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TimerLogic } from '../utils/TimerLogic';
import { TIMER_PHASES, TIMER_CONSTANTS } from '../utils/TimerState';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

/**
 * Custom hook that provides timer functionality to React components
 */
export const useTimer = () => {
  // Load initial settings from localStorage
  const initialRoundTime = loadFromLocalStorage('roundTime', 5 * TIMER_CONSTANTS.MINUTE);
  const initialRestTime = loadFromLocalStorage('restTime', 20 * TIMER_CONSTANTS.SECOND);
  const initialTotalRounds = loadFromLocalStorage('totalRounds', 0);

  // Create timer logic instance
  const timerLogic = useRef(new TimerLogic({
    roundTime: initialRoundTime,
    restTime: initialRestTime,
    totalRounds: initialTotalRounds
  }));

  // Timer state
  const [timerState, setTimerState] = useState(timerLogic.current.getState());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Subscribe to timer updates and update current time periodically
  useEffect(() => {
    const unsubscribe = timerLogic.current.subscribe(setTimerState);
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (timerLogic.current) {
        timerLogic.current.destroy();
      }
    };
  }, []);

  // Actions
  const actions = {
    start: () => timerLogic.current.start(),
    pause: () => timerLogic.current.pause(),
    reset: () => timerLogic.current.reset(),
    toggle: () => timerLogic.current.toggle(),

    updateRoundTime: (newTime) => {
      const validated = Math.max(30 * TIMER_CONSTANTS.SECOND, newTime);
      timerLogic.current.updateSettings({ roundTime: validated });
      saveToLocalStorage('roundTime', validated);
    },

    updateRestTime: (newTime) => {
      const validated = Math.max(10 * TIMER_CONSTANTS.SECOND, newTime);
      timerLogic.current.updateSettings({ restTime: validated });
      saveToLocalStorage('restTime', validated);
    },

    updateTotalRounds: (newRounds) => {
      const validated = Math.max(0, newRounds);
      timerLogic.current.updateSettings({ totalRounds: validated });
      saveToLocalStorage('totalRounds', validated);
    },

    changeRoundTime: (deltaSeconds) => {
      const newTime = timerState.roundTime + (deltaSeconds * TIMER_CONSTANTS.SECOND);
      actions.updateRoundTime(newTime);
    },

    changeRestTime: (deltaSeconds) => {
      const newTime = timerState.restTime + (deltaSeconds * TIMER_CONSTANTS.SECOND);
      actions.updateRestTime(newTime);
    },

    changeTotalRounds: (delta) => {
      const newRounds = timerState.totalRounds + delta;
      actions.updateTotalRounds(newRounds);
    }
  };

  // Memoized formatters to prevent recreation on every render
  const formatters = useMemo(() => ({
    formatTime: (time) => {
      // Using Math.ceil for countdowns makes the display show the current second
      // until it has fully elapsed. E.g., 2999ms remaining is displayed as "3 seconds left".
      const totalSeconds = Math.max(0, Math.ceil(time / 1000));
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    },

    formatCurrentTime: (date) => {
      if (!date) return '';
      const d = new Date(date);
      let hours = d.getHours();
      let minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      minutes = minutes < 10 ? '0' + minutes : minutes.toString();
      return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
    }
  }), []);

  // Computed state
  const isIdle = timerState.phase === TIMER_PHASES.IDLE && timerState.currentRound === 0;

  const getStatusText = useCallback(() => {
    if (timerState.isRunning) {
      switch (timerState.phase) {
        case TIMER_PHASES.READY:
          return 'Get Ready';
        case TIMER_PHASES.REST:
          return `Rest ${timerState.currentRound > 0 ? timerState.currentRound : ''}`.trim();
        case TIMER_PHASES.WORK:
          return `Round ${timerState.currentRound}`;
        default:
          return 'Running';
      }
    } else {
      if (isIdle) {
        return 'Stopped';
      } else {
        switch (timerState.phase) {
          case TIMER_PHASES.READY:
            return 'Paused - Get Ready';
          case TIMER_PHASES.REST:
            return `Paused - Rest ${timerState.currentRound > 0 ? timerState.currentRound : ''}`.trim();
          case TIMER_PHASES.WORK:
            return `Paused - Round ${timerState.currentRound}`;
          default:
            return 'Paused';
        }
      }
    }
  }, [timerState.isRunning, timerState.phase, timerState.currentRound, isIdle]);

  const computed = {
    isIdle,
    isRestPhase: timerState.phase === TIMER_PHASES.REST || timerState.phase === TIMER_PHASES.READY,
    isEndingSoon: timerState.phase === TIMER_PHASES.WORK && timerState.timeLeft <= TIMER_CONSTANTS.SOON_TIME,
    getStatusText
  };

  return {
    // State
    state: {
      ...timerState,
      currentTime
    },
    // Actions
    actions,
    // Formatters
    formatters,
    // Computed properties
    computed
  };
};