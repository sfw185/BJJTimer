/**
 * BJJTimer Unit Tests - Jest Version
 * Tests individual modules in isolation
 */

import { 
  TIMER_PHASES, 
  TIMER_CONSTANTS, 
  createInitialState, 
  validateSettings,
  getCurrentPhase,
  shouldTransitionPhase,
  getNextPhase
} from '../src/utils/TimerState.js';

import { AudioManager } from '../src/utils/AudioManager.js';
import { calculateFinishTime } from '../src/utils/FinishTimeCalculator.js';
import { TimerLogic } from '../src/utils/TimerLogic.js';

describe('TimerState Module', () => {
  describe('Constants', () => {
    test('TIMER_PHASES should be defined', () => {
      expect(TIMER_PHASES.IDLE).toBeDefined();
      expect(TIMER_PHASES.READY).toBeDefined();
      expect(TIMER_PHASES.WORK).toBeDefined();
      expect(TIMER_PHASES.REST).toBeDefined();
    });

    test('TIMER_CONSTANTS should be defined', () => {
      expect(TIMER_CONSTANTS.MIN_ROUND_TIME).toBeDefined();
      expect(TIMER_CONSTANTS.MIN_REST_TIME).toBeDefined();
      expect(typeof TIMER_CONSTANTS.MIN_ROUND_TIME).toBe('number');
      expect(typeof TIMER_CONSTANTS.MIN_REST_TIME).toBe('number');
    });
  });

  describe('createInitialState', () => {
    test('should create valid initial state', () => {
      const initialState = createInitialState(300000, 20000, 5);
      
      expect(initialState.currentRound).toBe(0);
      expect(initialState.isRunning).toBe(false);
      expect(initialState.phase).toBe(TIMER_PHASES.IDLE);
      expect(initialState.roundTime).toBe(300000);
      expect(initialState.restTime).toBe(20000);
      expect(initialState.totalRounds).toBe(5);
      expect(initialState.timeLeft).toBe(300000);
    });
  });

  describe('validateSettings', () => {
    test('should clamp values to minimums', () => {
      const validated = validateSettings(10000, 5000, -1);
      
      expect(validated.roundTime).toBeGreaterThanOrEqual(TIMER_CONSTANTS.MIN_ROUND_TIME);
      expect(validated.restTime).toBeGreaterThanOrEqual(TIMER_CONSTANTS.MIN_REST_TIME);
      expect(validated.totalRounds).toBeGreaterThanOrEqual(0);
    });

    test('should preserve valid values', () => {
      const validated = validateSettings(300000, 30000, 5);
      
      expect(validated.roundTime).toBe(300000);
      expect(validated.restTime).toBe(30000);
      expect(validated.totalRounds).toBe(5);
    });
  });

  describe('Phase Logic', () => {
    test('getCurrentPhase should return current phase', () => {
      const state = { phase: TIMER_PHASES.WORK };
      expect(getCurrentPhase(state)).toBe(TIMER_PHASES.WORK);
    });

    test('shouldTransitionPhase should detect when time is up', () => {
      const workingState = { 
        phase: TIMER_PHASES.WORK, 
        timeLeft: 0,
        isRunning: true 
      };
      expect(shouldTransitionPhase(workingState)).toBe(true);

      const runningState = { 
        phase: TIMER_PHASES.WORK, 
        timeLeft: 1000,
        isRunning: true 
      };
      expect(shouldTransitionPhase(runningState)).toBe(false);
    });

    test('getNextPhase should return correct transitions', () => {
      const workState = { phase: TIMER_PHASES.WORK, currentRound: 1, totalRounds: 3 };
      expect(getNextPhase(workState)).toBe(TIMER_PHASES.REST);

      const restState = { phase: TIMER_PHASES.REST, currentRound: 1, totalRounds: 3 };
      expect(getNextPhase(restState)).toBe(TIMER_PHASES.WORK);

      const readyState = { phase: TIMER_PHASES.READY };
      expect(getNextPhase(readyState)).toBe(TIMER_PHASES.WORK);
    });
  });
});

describe('AudioManager Module', () => {
  let audioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  test('should be instantiable', () => {
    expect(audioManager).toBeDefined();
    expect(audioManager).toBeInstanceOf(AudioManager);
  });

  test('should have required methods', () => {
    expect(typeof audioManager.initialize).toBe('function');
    expect(typeof audioManager.playStart).toBe('function');
    expect(typeof audioManager.playSoon).toBe('function');
    expect(typeof audioManager.playReady).toBe('function');
    expect(typeof audioManager.playFinish).toBe('function');
  });

  test('initialize should not throw', () => {
    expect(() => audioManager.initialize()).not.toThrow();
  });

  test('play methods should not throw', async () => {
    await expect(audioManager.playStart()).resolves.not.toThrow();
    await expect(audioManager.playSoon()).resolves.not.toThrow();
    await expect(audioManager.playReady()).resolves.not.toThrow();
    await expect(audioManager.playFinish()).resolves.not.toThrow();
  });
});

describe('FinishTimeCalculator Module', () => {
  test('should return null for infinite rounds', () => {
    const infiniteState = {
      totalRounds: 0,
      currentRound: 1,
      phase: TIMER_PHASES.WORK,
      timeLeft: 60000,
      roundTime: 300000,
      restTime: 20000
    };
    
    const result = calculateFinishTime(infiniteState);
    expect(result).toBeNull();
  });

  test('should return Date for finite rounds', () => {
    const finiteState = {
      totalRounds: 3,
      currentRound: 0,
      phase: TIMER_PHASES.IDLE,
      timeLeft: 300000,
      roundTime: 300000,
      restTime: 20000
    };
    
    const result = calculateFinishTime(finiteState);
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  test('should calculate finish time correctly', () => {
    const now = Date.now();
    const state = {
      totalRounds: 2,
      currentRound: 0,
      phase: TIMER_PHASES.IDLE,
      timeLeft: 60000, // 1 minute
      roundTime: 60000, // 1 minute
      restTime: 30000   // 30 seconds
    };
    
    const result = calculateFinishTime(state);
    const expectedDuration = (60000 * 2) + (30000 * 1); // 2 rounds + 1 rest
    const expectedFinish = now + expectedDuration;
    
    // Allow for some timing tolerance (within 5 seconds)
    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });
});

describe('TimerLogic Module', () => {
  let timer;

  beforeEach(() => {
    timer = new TimerLogic({
      roundTime: 60000, // 1 minute
      restTime: 10000,  // 10 seconds
      totalRounds: 3
    });
  });

  afterEach(() => {
    if (timer) {
      timer.reset();
    }
  });

  test('should be instantiable', () => {
    expect(timer).toBeDefined();
    expect(timer).toBeInstanceOf(TimerLogic);
  });

  test('should have correct initial state', () => {
    const state = timer.getState();
    
    expect(state.currentRound).toBe(0);
    expect(state.isRunning).toBe(false);
    expect(state.phase).toBe(TIMER_PHASES.IDLE);
    expect(state.roundTime).toBe(60000);
    expect(state.restTime).toBe(10000);
    expect(state.totalRounds).toBe(3);
  });

  test('should handle subscription system', () => {
    let notificationReceived = false;
    let receivedState = null;
    
    const unsubscribe = timer.subscribe((state) => {
      notificationReceived = true;
      receivedState = state;
    });
    
    expect(typeof unsubscribe).toBe('function');
    
    // Trigger a state change
    timer.start();
    
    expect(timer.getState().isRunning).toBe(true);
    
    unsubscribe();
  });

  test('should start timer correctly', () => {
    timer.start();
    const state = timer.getState();
    
    expect(state.isRunning).toBe(true);
    expect(state.phase).toBe(TIMER_PHASES.READY);
  });

  test('should pause and resume', () => {
    timer.start();
    expect(timer.getState().isRunning).toBe(true);
    
    timer.pause();
    expect(timer.getState().isRunning).toBe(false);
    
    timer.start(); // Resume
    expect(timer.getState().isRunning).toBe(true);
  });

  test('should reset correctly', () => {
    timer.start();
    timer.reset();
    
    const state = timer.getState();
    expect(state.phase).toBe(TIMER_PHASES.IDLE);
    expect(state.currentRound).toBe(0);
    expect(state.isRunning).toBe(false);
  });

  test('should update settings', () => {
    timer.updateSettings({ roundTime: 120000 });
    const state = timer.getState();
    
    expect(state.roundTime).toBe(120000);
  });

  test('should handle invalid settings gracefully', () => {
    timer.updateSettings({ 
      roundTime: -1000,    // Invalid negative
      restTime: 1000,      // Too small (will be clamped)
      totalRounds: -5      // Invalid negative
    });
    
    const state = timer.getState();
    expect(state.roundTime).toBeGreaterThan(0);
    expect(state.restTime).toBeGreaterThan(0);
    expect(state.totalRounds).toBeGreaterThanOrEqual(0);
  });
});
