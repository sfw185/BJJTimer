/**
 * Integration Tests for BJJTimer - Jest Version
 * Tests how components work together
 */

import { TIMER_PHASES } from '../src/utils/TimerState.js';
import { TimerLogic } from '../src/utils/TimerLogic.js';

describe('Timer Integration Tests', () => {
  let timer;

  beforeEach(() => {
    timer = new TimerLogic({
      roundTime: 1000,  // 1 second for fast testing
      restTime: 500,    // 0.5 seconds
      totalRounds: 2
    });
  });

  afterEach(() => {
    if (timer) {
      timer.reset();
    }
  });

  describe('State Transitions', () => {
    test('should transition through phases correctly', (done) => {
      const stateHistory = [];
      
      timer.subscribe((state) => {
        stateHistory.push({
          phase: state.phase,
          round: state.currentRound,
          isRunning: state.isRunning,
          timeLeft: state.timeLeft
        });
      });

      timer.start();
      
      setTimeout(() => {
        expect(stateHistory.length).toBeGreaterThan(0);
        const readyState = timer.getState();
        expect(readyState.phase).toBe(TIMER_PHASES.READY);
        expect(readyState.isRunning).toBe(true);
        done();
      }, 100);
    });

    test('should handle pause and resume correctly', () => {
      timer.start();
      const readyState = timer.getState();
      expect(readyState.phase).toBe(TIMER_PHASES.READY);
      expect(readyState.isRunning).toBe(true);

      timer.pause();
      const pausedState = timer.getState();
      expect(pausedState.isRunning).toBe(false);
      expect(pausedState.phase).toBe(TIMER_PHASES.READY);
      
      timer.start();
      const resumedState = timer.getState();
      expect(resumedState.isRunning).toBe(true);
      expect(resumedState.phase).toBe(TIMER_PHASES.READY);
    });

    test('should reset to initial state', () => {
      timer.start();
      expect(timer.getState().isRunning).toBe(true);
      
      timer.reset();
      const resetState = timer.getState();
      
      expect(resetState.phase).toBe(TIMER_PHASES.IDLE);
      expect(resetState.currentRound).toBe(0);
      expect(resetState.isRunning).toBe(false);
      expect(resetState.timeLeft).toBe(resetState.roundTime);
    });
  });

  describe('Settings Integration', () => {
    test('should update finish time with settings changes', () => {
      const initialState = timer.getState();
      expect(initialState.finishTime).toBeDefined();

      timer.updateSettings({ totalRounds: 0 });
      const infiniteState = timer.getState();
      expect(infiniteState.finishTime).toBeNull();

      timer.updateSettings({ totalRounds: 3, roundTime: 120000 });
      const updatedState = timer.getState();
      expect(updatedState.totalRounds).toBe(3);
      expect(updatedState.roundTime).toBe(120000);
      expect(updatedState.finishTime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid settings gracefully', () => {
      timer.updateSettings({
        roundTime: -1000,
        restTime: 1000,
        totalRounds: -5
      });

      const state = timer.getState();
      expect(state.roundTime).toBeGreaterThan(0);
      expect(state.restTime).toBeGreaterThan(0);
      expect(state.totalRounds).toBeGreaterThanOrEqual(0);
    });

    test('should handle rapid operations without errors', () => {
      expect(() => {
        timer.start();
        timer.pause();
        timer.start();
        timer.reset();
        timer.updateSettings({ roundTime: 50000 });
        timer.start();
      }).not.toThrow();
    });
  });
});
