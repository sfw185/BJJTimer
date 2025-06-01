import { useState, useEffect, useRef } from 'react';
import { TimerLogic } from '../utils/TimerLogic';
import { TIMER_PHASES, TIMER_CONSTANTS } from '../utils/TimerState';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

/**
 * Custom hook that provides timer functionality to React components
 */
export const useTimer = () => {
  // Load initial settings from localStorage
  const initialRoundTime = loadFromLocalStorage('roundTime', 5 * 60 * TIMER_CONSTANTS.SECOND);
  const initialRestTime = loadFromLocalStorage('restTime', 20 * TIMER_CONSTANTS.SECOND);
  const initialTotalRounds = loadFromLocalStorage('totalRounds', 0);

  // Create timer logic instance
  const timerLogic = useRef(null);
  
  // Initialize timer logic
  if (!timerLogic.current) {
    timerLogic.current = new TimerLogic({
      roundTime: initialRoundTime,
      restTime: initialRestTime,
      totalRounds: initialTotalRounds
    });
  }

  // Timer state
  const [timerState, setTimerState] = useState(() => timerLogic.current.getState());
  
  // Current time for display and ETA calculations
  const [currentTime, setCurrentTime] = useState(new Date());

  // Subscribe to timer updates
  useEffect(() => {
    const unsubscribe = timerLogic.current.subscribe((newState) => {
      setTimerState(newState);
    });

    return unsubscribe;
  }, []);

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    setCurrentTime(new Date());

    return () => clearInterval(interval);
  }, []);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
  // Formatters
  const formatters = {
    formatTime: (time) => {
      const minutes = Math.floor(time / (TIMER_CONSTANTS.SECOND * 60));
      const seconds = Math.floor((time % (TIMER_CONSTANTS.SECOND * 60)) / TIMER_CONSTANTS.SECOND);
      return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },

    formatCurrentTime: (date) => {
      if (!date) return '';
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      minutes = minutes < 10 ? '0' + minutes : minutes.toString();
      return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
    }
  };

  // Computed state
  const computed = {
    // UI state helpers
    isIdle: timerState.phase === TIMER_PHASES.IDLE && timerState.currentRound === 0,
    isRestPhase: timerState.phase === TIMER_PHASES.REST || timerState.phase === TIMER_PHASES.READY,
    isEndingSoon: timerState.phase === TIMER_PHASES.WORK && timerState.timeLeft <= TIMER_CONSTANTS.SOON_TIME,
    
    // Status text
    getStatusText: () => {
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
        if (computed.isIdle) {
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
    }
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