/**
 * BJJTimer Unit Tests - Jest Version
 * Tests individual modules in isolation
 */

import {
  TIMER_PHASES,
  TIMER_CONSTANTS,
  createInitialState,
  validateSettings,
  shouldTransitionPhase,
  getNextPhase,
  getCurrentPhaseDuration,
  createPhaseTransition
} from '../src/utils/TimerState.js';

import { AudioManager } from '../src/utils/AudioManager.js';
import { calculateFinishTime } from '../src/utils/FinishTimeCalculator.js';
import { TimerLogic } from '../src/utils/TimerLogic.js';
import { loadFromLocalStorage, saveToLocalStorage } from '../src/utils/storage.js';

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

    test('getNextPhase should return IDLE after final round', () => {
      const finalRoundState = { phase: TIMER_PHASES.WORK, currentRound: 3, totalRounds: 3 };
      expect(getNextPhase(finalRoundState)).toBe(TIMER_PHASES.IDLE);
    });

    test('getCurrentPhaseDuration should return correct durations', () => {
      const readyState = { phase: TIMER_PHASES.READY, roundTime: 60000, restTime: 20000 };
      expect(getCurrentPhaseDuration(readyState)).toBe(TIMER_CONSTANTS.READY_TIME);

      const workState = { phase: TIMER_PHASES.WORK, roundTime: 60000, restTime: 20000 };
      expect(getCurrentPhaseDuration(workState)).toBe(60000);

      const restState = { phase: TIMER_PHASES.REST, roundTime: 60000, restTime: 20000 };
      expect(getCurrentPhaseDuration(restState)).toBe(20000);

      const idleState = { phase: TIMER_PHASES.IDLE, roundTime: 60000, restTime: 20000 };
      expect(getCurrentPhaseDuration(idleState)).toBe(60000);
    });

    test('createPhaseTransition should create correct state for READY phase', () => {
      const state = createInitialState(60000, 20000, 3);
      const newState = createPhaseTransition(state, TIMER_PHASES.READY);

      expect(newState.phase).toBe(TIMER_PHASES.READY);
      expect(newState.timeLeft).toBe(TIMER_CONSTANTS.READY_TIME);
      expect(newState.currentRound).toBe(0);
      expect(newState.readySoundPlayed).toBe(true);
      expect(newState.soonSoundPlayed).toBe(false);
    });

    test('createPhaseTransition should create correct state for WORK phase', () => {
      const state = { ...createInitialState(60000, 20000, 3), currentRound: 0 };
      const newState = createPhaseTransition(state, TIMER_PHASES.WORK);

      expect(newState.phase).toBe(TIMER_PHASES.WORK);
      expect(newState.timeLeft).toBe(60000);
      expect(newState.currentRound).toBe(1);
      expect(newState.soonSoundPlayed).toBe(false);
    });

    test('createPhaseTransition should create correct state for REST phase', () => {
      const state = { ...createInitialState(60000, 20000, 3), currentRound: 1 };
      const newState = createPhaseTransition(state, TIMER_PHASES.REST);

      expect(newState.phase).toBe(TIMER_PHASES.REST);
      expect(newState.timeLeft).toBe(20000);
      expect(newState.currentRound).toBe(1);
    });

    test('createPhaseTransition should create correct state for IDLE phase', () => {
      const state = { ...createInitialState(60000, 20000, 3), currentRound: 3, isRunning: true };
      const newState = createPhaseTransition(state, TIMER_PHASES.IDLE);

      expect(newState.phase).toBe(TIMER_PHASES.IDLE);
      expect(newState.timeLeft).toBe(60000);
      expect(newState.currentRound).toBe(0);
      expect(newState.isRunning).toBe(false);
      expect(newState.startTime).toBeNull();
      expect(newState.sessionStartTime).toBeNull();
    });
  });
});

describe('Storage Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveToLocalStorage', () => {
    test('should save primitive values', () => {
      saveToLocalStorage('testNumber', 42);
      expect(localStorage.getItem('testNumber')).toBe('42');

      saveToLocalStorage('testString', 'hello');
      expect(localStorage.getItem('testString')).toBe('"hello"');

      saveToLocalStorage('testBool', true);
      expect(localStorage.getItem('testBool')).toBe('true');
    });

    test('should save objects', () => {
      const obj = { name: 'test', value: 123 };
      saveToLocalStorage('testObject', obj);
      expect(JSON.parse(localStorage.getItem('testObject'))).toEqual(obj);
    });

    test('should save arrays', () => {
      const arr = [1, 2, 3];
      saveToLocalStorage('testArray', arr);
      expect(JSON.parse(localStorage.getItem('testArray'))).toEqual(arr);
    });
  });

  describe('loadFromLocalStorage', () => {
    test('should load saved values', () => {
      saveToLocalStorage('testValue', 42);
      expect(loadFromLocalStorage('testValue', 0)).toBe(42);
    });

    test('should return default for missing keys', () => {
      expect(loadFromLocalStorage('nonexistent', 'default')).toBe('default');
    });

    test('should return default for null values', () => {
      localStorage.setItem('nullKey', 'null');
      expect(loadFromLocalStorage('nullKey', 'default')).toBeNull();
    });

    test('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('corrupted', '{invalid json}');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(loadFromLocalStorage('corrupted', 'fallback')).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should load complex objects', () => {
      const complexObj = {
        colors: { bg: '#000', fg: '#fff' },
        settings: [1, 2, 3],
        nested: { deep: { value: true } }
      };
      saveToLocalStorage('complex', complexObj);
      expect(loadFromLocalStorage('complex', {})).toEqual(complexObj);
    });
  });
});

describe('AudioManager Module', () => {
  let audioManager;

  beforeEach(() => {
    // Reset singleton for clean tests
    AudioManager.instance = null;
    localStorage.clear();
    audioManager = new AudioManager();
  });

  afterEach(() => {
    AudioManager.instance = null;
  });

  test('should be instantiable', () => {
    expect(audioManager).toBeDefined();
    expect(audioManager).toBeInstanceOf(AudioManager);
  });

  test('should implement singleton pattern', () => {
    const instance1 = new AudioManager();
    const instance2 = new AudioManager();
    expect(instance1).toBe(instance2);

    const instance3 = AudioManager.getInstance();
    expect(instance3).toBe(instance1);
  });

  test('should have required methods', () => {
    expect(typeof audioManager.initialize).toBe('function');
    expect(typeof audioManager.playStart).toBe('function');
    expect(typeof audioManager.playSoon).toBe('function');
    expect(typeof audioManager.playReady).toBe('function');
    expect(typeof audioManager.playFinish).toBe('function');
    expect(typeof audioManager.setVolume).toBe('function');
    expect(typeof audioManager.getVolume).toBe('function');
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

  describe('Volume Control', () => {
    test('should default to 100% volume', () => {
      expect(audioManager.getVolume()).toBe(100);
    });

    test('should load volume from localStorage', () => {
      AudioManager.instance = null;
      saveToLocalStorage('volume', 75);

      const newManager = new AudioManager();
      expect(newManager.getVolume()).toBe(75);
    });

    test('setVolume should update volume', () => {
      audioManager.setVolume(50);
      expect(audioManager.getVolume()).toBe(50);
    });

    test('setVolume should persist to localStorage', () => {
      audioManager.setVolume(25);
      expect(loadFromLocalStorage('volume', 100)).toBe(25);
    });

    test('setVolume should apply to all sounds after initialization', () => {
      audioManager.initialize();
      audioManager.setVolume(50);

      // Check that volume property is set (mocked Audio objects)
      Object.values(audioManager.sounds).forEach(sound => {
        if (sound && sound.volume !== undefined) {
          expect(sound.volume).toBe(0.5);
        }
      });
    });

    test('should handle volume at boundaries', () => {
      audioManager.setVolume(0);
      expect(audioManager.getVolume()).toBe(0);

      audioManager.setVolume(100);
      expect(audioManager.getVolume()).toBe(100);
    });
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

  test('should calculate correctly during READY phase', () => {
    const now = Date.now();
    const state = {
      totalRounds: 2,
      currentRound: 0,
      phase: TIMER_PHASES.READY,
      timeLeft: 3000, // 3 seconds left in ready
      roundTime: 60000,
      restTime: 30000
    };

    const result = calculateFinishTime(state);
    // Ready(3s) + Work(60s) + Rest(30s) + Work(60s) = 153s
    const expectedDuration = 3000 + (60000 * 2) + 30000;
    const expectedFinish = now + expectedDuration;

    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });

  test('should calculate correctly during WORK phase', () => {
    const now = Date.now();
    const state = {
      totalRounds: 3,
      currentRound: 2,
      phase: TIMER_PHASES.WORK,
      timeLeft: 30000, // 30 seconds left in current round
      roundTime: 60000,
      restTime: 20000
    };

    const result = calculateFinishTime(state);
    // Current work(30s) + Rest(20s) + Work(60s) = 110s
    const expectedDuration = 30000 + 20000 + 60000;
    const expectedFinish = now + expectedDuration;

    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });

  test('should calculate correctly during REST phase', () => {
    const now = Date.now();
    const state = {
      totalRounds: 3,
      currentRound: 1,
      phase: TIMER_PHASES.REST,
      timeLeft: 10000, // 10 seconds left in rest
      roundTime: 60000,
      restTime: 20000
    };

    const result = calculateFinishTime(state);
    // Current rest(10s) + Work(60s) + Rest(20s) + Work(60s) = 150s
    const expectedDuration = 10000 + 60000 + 20000 + 60000;
    const expectedFinish = now + expectedDuration;

    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });

  test('should calculate correctly for final round in progress', () => {
    const now = Date.now();
    const state = {
      totalRounds: 3,
      currentRound: 3,
      phase: TIMER_PHASES.WORK,
      timeLeft: 15000, // 15 seconds left in final round
      roundTime: 60000,
      restTime: 20000
    };

    const result = calculateFinishTime(state);
    // Just the remaining time in final round
    const expectedFinish = now + 15000;

    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });

  test('should handle single round', () => {
    const now = Date.now();
    const state = {
      totalRounds: 1,
      currentRound: 0,
      phase: TIMER_PHASES.IDLE,
      timeLeft: 60000,
      roundTime: 60000,
      restTime: 20000
    };

    const result = calculateFinishTime(state);
    // Just one round, no rest needed
    const expectedFinish = now + 60000;

    expect(Math.abs(result.getTime() - expectedFinish)).toBeLessThan(5000);
  });
});

describe('TimerLogic Module', () => {
  let timer;
  let mockAudioManager;

  beforeEach(() => {
    // Mock the audio manager to prevent actual audio playing
    mockAudioManager = {
      initialize: jest.fn(),
      playStart: jest.fn(),
      playSoon: jest.fn(),
      playReady: jest.fn(),
      playFinish: jest.fn()
    };
    
    // Mock the getInstance method
    AudioManager.getInstance = jest.fn(() => mockAudioManager);
    
    timer = new TimerLogic({
      roundTime: 60000, // 1 minute
      restTime: 10000,  // 10 seconds
      totalRounds: 3
    });
    
    // Use fake timers for controlled time progression
    jest.useFakeTimers();
    
    // Mock Date.now() to work with fake timers
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    Date.now = jest.fn(() => currentTime);
    
    // Helper to advance time consistently
    global.advanceTime = (ms) => {
      currentTime += ms;
      jest.advanceTimersByTime(ms);
    };
  });

  afterEach(() => {
    if (timer) {
      timer.destroy();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initialization and Basic Operations', () => {
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
      expect(state.timeLeft).toBe(60000);
    });

    test('should handle subscription system', () => {
      const callback = jest.fn();
      
      const unsubscribe = timer.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');
      
      timer.start();
      expect(callback).toHaveBeenCalled();
      
      callback.mockClear();
      unsubscribe();
      
      timer.pause();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Timer Controls', () => {
    test('should start timer correctly', () => {
      timer.start();
      const state = timer.getState();
      
      expect(state.isRunning).toBe(true);
      expect(state.phase).toBe(TIMER_PHASES.READY);
      expect(mockAudioManager.initialize).toHaveBeenCalled();
      expect(mockAudioManager.playReady).toHaveBeenCalled();
    });

    test('should pause and resume', () => {
      timer.start();
      expect(timer.getState().isRunning).toBe(true);
      
      const timeLeftBeforePause = timer.getState().timeLeft;
      timer.pause();
      expect(timer.getState().isRunning).toBe(false);
      
      // Time shouldn't advance while paused
      advanceTime(1000);
      expect(timer.getState().timeLeft).toBe(timeLeftBeforePause);
      
      timer.start(); // Resume
      expect(timer.getState().isRunning).toBe(true);
    });

    test('should reset correctly', () => {
      timer.start();
      advanceTime(5000);
      timer.reset();
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.IDLE);
      expect(state.currentRound).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.timeLeft).toBe(60000);
    });

    test('should toggle between start and pause', () => {
      expect(timer.getState().isRunning).toBe(false);
      
      timer.toggle();
      expect(timer.getState().isRunning).toBe(true);
      
      // Need to advance time to bypass debounce
      advanceTime(100);
      timer.toggle();
      expect(timer.getState().isRunning).toBe(false);
    });

    test('should debounce rapid toggle attempts', () => {
      timer.toggle(); // First toggle - should start
      expect(timer.getState().isRunning).toBe(true);
      
      // Rapid toggles within 100ms should be ignored
      timer.toggle();
      timer.toggle();
      timer.toggle();
      expect(timer.getState().isRunning).toBe(true);
      
      // After 100ms, toggle should work
      advanceTime(100);
      timer.toggle();
      expect(timer.getState().isRunning).toBe(false);
    });
  });

  describe('Phase Transitions', () => {
    test('should transition from READY to WORK', () => {
      timer.start();
      expect(timer.getState().phase).toBe(TIMER_PHASES.READY);
      
      // Advance through ready phase (3 seconds)
      advanceTime(3100); // Add buffer for timing
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.WORK);
      expect(state.currentRound).toBe(1);
      expect(mockAudioManager.playStart).toHaveBeenCalled();
    });

    test('should transition from WORK to REST', () => {
      timer.start();
      
      // Skip ready phase
      advanceTime(3100);
      expect(timer.getState().phase).toBe(TIMER_PHASES.WORK);
      
      // Complete work phase
      advanceTime(60100);
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.REST);
      expect(mockAudioManager.playFinish).toHaveBeenCalled();
    });

    test('should transition from REST to WORK', () => {
      timer.start();
      
      // Skip through ready and first work phase
      advanceTime(3100); // Ready phase
      advanceTime(60100); // Work phase - should now be in REST
      expect(timer.getState().phase).toBe(TIMER_PHASES.REST);
      
      // Complete rest phase
      advanceTime(10100);
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.WORK);
      expect(state.currentRound).toBe(2);
      expect(mockAudioManager.playStart).toHaveBeenCalledTimes(2);
    });

    test('should complete session after final round', () => {
      timer.start();
      
      // Complete all rounds with buffer for timing
      advanceTime(3100); // Ready
      advanceTime(60100); // Round 1
      advanceTime(10100); // Rest
      advanceTime(60100); // Round 2
      advanceTime(10100); // Rest
      advanceTime(60100); // Round 3 complete
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.IDLE);
      expect(state.currentRound).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(mockAudioManager.playFinish).toHaveBeenCalledTimes(3);
    });
  });

  describe('Audio Cue Timing', () => {
    test('should play soon sound 10 seconds before end of work phase', () => {
      timer.start();
      
      // Skip to work phase
      advanceTime(3100);
      mockAudioManager.playSoon.mockClear();
      
      // Advance to 10 seconds before end (50 seconds into 60 second round)
      advanceTime(50000);
      
      expect(mockAudioManager.playSoon).toHaveBeenCalledTimes(1);
    });

    test('should play ready sound 3 seconds before end of rest phase', () => {
      timer.start();
      
      // Skip to rest phase
      advanceTime(3100); // Ready phase
      advanceTime(60100); // Work phase - now in REST
      mockAudioManager.playReady.mockClear();
      
      // Advance to 3 seconds before end (7 seconds into 10 second rest)
      advanceTime(7100);
      
      expect(mockAudioManager.playReady).toHaveBeenCalledTimes(1);
    });

    test('should not play sounds multiple times in same phase', () => {
      timer.start();
      
      // Skip to work phase
      advanceTime(3100);
      mockAudioManager.playSoon.mockClear();
      
      // Advance past soon threshold multiple times
      advanceTime(50000);
      advanceTime(1000);
      advanceTime(1000);
      
      expect(mockAudioManager.playSoon).toHaveBeenCalledTimes(1);
    });

    test('should handle the 10-second warning timing window correctly', () => {
      timer.start();
      
      // Skip to work phase
      advanceTime(3100);
      mockAudioManager.playSoon.mockClear();
      
      // Advance to just before the window (49.9 seconds)
      advanceTime(49900);
      expect(mockAudioManager.playSoon).not.toHaveBeenCalled();
      
      // Enter the timing window
      advanceTime(100);
      expect(mockAudioManager.playSoon).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings Management', () => {
    test('should update settings', () => {
      timer.updateSettings({ roundTime: 120000 });
      const state = timer.getState();
      
      expect(state.roundTime).toBe(120000);
      expect(state.timeLeft).toBe(120000); // Should update timeLeft when idle
    });

    test('should update settings during active session', () => {
      timer.start();
      advanceTime(3100); // Enter work phase
      
      const timeLeftBefore = timer.getState().timeLeft;
      timer.updateSettings({ roundTime: 120000 });
      
      const state = timer.getState();
      expect(state.roundTime).toBe(120000);
      expect(state.timeLeft).toBe(timeLeftBefore); // Should not affect current phase
    });

    test('should handle invalid settings gracefully', () => {
      timer.updateSettings({ 
        roundTime: -1000,    // Invalid negative
        restTime: 1000,      // Too small (will be clamped)
        totalRounds: -5      // Invalid negative
      });
      
      const state = timer.getState();
      expect(state.roundTime).toBe(TIMER_CONSTANTS.MIN_ROUND_TIME);
      expect(state.restTime).toBe(TIMER_CONSTANTS.MIN_REST_TIME);
      expect(state.totalRounds).toBe(0);
    });

    test('should handle partial settings updates', () => {
      const originalState = timer.getState();
      
      timer.updateSettings({ roundTime: 90000 });
      
      const newState = timer.getState();
      expect(newState.roundTime).toBe(90000);
      expect(newState.restTime).toBe(originalState.restTime);
      expect(newState.totalRounds).toBe(originalState.totalRounds);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle infinite rounds (totalRounds = 0)', () => {
      timer.updateSettings({ totalRounds: 0 });
      timer.start();
      
      // Complete several rounds
      for (let i = 0; i < 5; i++) {
        if (i === 0) {
          advanceTime(3100); // Initial ready phase
        }
        advanceTime(60100); // Work
        advanceTime(10100); // Rest
      }
      
      // Should still be running
      expect(timer.getState().isRunning).toBe(true);
      expect(timer.getState().currentRound).toBeGreaterThan(5);
    });

    test('should prevent double-start', () => {
      timer.start();
      const firstStartTime = timer.getState().startTime;
      
      timer.start(); // Try to start again
      expect(timer.getState().startTime).toBe(firstStartTime);
    });

    test('should prevent double-pause', () => {
      timer.start();
      timer.pause();
      const stateAfterPause = { ...timer.getState() };
      
      timer.pause(); // Try to pause again
      expect(timer.getState()).toEqual(stateAfterPause);
    });

    test('should handle destroy method', () => {
      const callback = jest.fn();
      timer.subscribe(callback);
      
      timer.destroy();
      
      // Should not receive notifications after destroy
      timer.start();
      expect(callback).not.toHaveBeenCalled();
    });

    test('should calculate finish time correctly', () => {
      const state = timer.getState();
      expect(state.finishTime).toBeDefined();
      
      // For 3 rounds: Ready(3s) + Work(60s) + Rest(10s) + Work(60s) + Rest(10s) + Work(60s)
      const expectedDuration = 3000 + (60000 * 3) + (10000 * 2);
      const expectedFinishTime = Date.now() + expectedDuration;
      
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(state.finishTime.getTime() - expectedFinishTime)).toBeLessThan(1000);
    });

    test('should handle minimum time constraints', () => {
      const minTimer = new TimerLogic({
        roundTime: 1000,  // Will be clamped
        restTime: 1000,   // Will be clamped
        totalRounds: 1
      });
      
      const state = minTimer.getState();
      expect(state.roundTime).toBe(TIMER_CONSTANTS.MIN_ROUND_TIME);
      expect(state.restTime).toBe(TIMER_CONSTANTS.MIN_REST_TIME);
      
      minTimer.destroy();
    });
  });

  describe('Time Precision', () => {
    test('should maintain accurate time during phase transitions', () => {
      timer.start();
      
      // Track exact timing through ready phase
      advanceTime(3100);
      
      const state = timer.getState();
      expect(state.phase).toBe(TIMER_PHASES.WORK);
      expect(state.timeLeft).toBeCloseTo(60000, -2); // Within 100ms
    });

    test('should handle pause/resume without time loss', () => {
      timer.start();
      advanceTime(3100); // Enter work phase
      
      advanceTime(30000); // 30 seconds into work
      const timeBeforePause = timer.getState().timeLeft;
      
      timer.pause();
      advanceTime(5000); // Wait 5 seconds
      timer.start(); // Resume
      
      const timeAfterResume = timer.getState().timeLeft;
      expect(Math.abs(timeAfterResume - timeBeforePause)).toBeLessThan(100);
    });
  });
});
