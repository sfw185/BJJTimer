/**
 * Functional Tests for BJJTimer - Jest Version
 * Tests file structure and module imports
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.dirname(__dirname);

describe('File Structure Tests', () => {
  const requiredFiles = [
    'src/utils/TimerState.js',
    'src/utils/AudioManager.js', 
    'src/utils/FinishTimeCalculator.js',
    'src/utils/TimerLogic.js',
    'src/hooks/useTimer.js',
    'src/Timer.jsx'
  ];

  test.each(requiredFiles)('should have required file: %s', (file) => {
    const filePath = path.join(projectRoot, file);
    expect(fs.existsSync(filePath)).toBe(true);
    
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });
});

describe('Module Import Tests', () => {
  test('should import TimerState module successfully', async () => {
    const module = await import('../src/utils/TimerState.js');
    expect(module).toBeDefined();
    expect(Object.keys(module).length).toBeGreaterThan(0);
    expect(module.TIMER_PHASES).toBeDefined();
    expect(module.createInitialState).toBeDefined();
  });

  test('should import AudioManager module successfully', async () => {
    const module = await import('../src/utils/AudioManager.js');
    expect(module).toBeDefined();
    expect(module.AudioManager).toBeDefined();
    expect(typeof module.AudioManager).toBe('function');
  });

  test('should import FinishTimeCalculator module successfully', async () => {
    const module = await import('../src/utils/FinishTimeCalculator.js');
    expect(module).toBeDefined();
    expect(module.calculateFinishTime).toBeDefined();
    expect(typeof module.calculateFinishTime).toBe('function');
  });

  test('should import TimerLogic module successfully', async () => {
    const module = await import('../src/utils/TimerLogic.js');
    expect(module).toBeDefined();
    expect(module.TimerLogic).toBeDefined();
    expect(typeof module.TimerLogic).toBe('function');
  });
});
