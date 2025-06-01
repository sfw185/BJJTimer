# BJJTimer Tests - Jest Migration

This directory contains the migrated Jest test suite for the BJJTimer project, refactored for Node v20.3.0 and Jest.

## Migration Summary

### What Changed:
- **Test Framework**: Migrated from custom test harness to Jest
- **Assertions**: Converted custom assertions to Jest expect() API
- **Structure**: Reorganized tests into proper Jest describe/test blocks
- **Configuration**: Added Jest configuration with jsdom environment
- **Dependencies**: Added Jest and testing library dependencies

### New Test Files:
- `unit.test.js` - Unit tests for individual modules
- `integration.test.js` - Integration tests for component interaction
- `functional.test.js` - File structure and module import tests
- `setup.js` - Jest setup and mocks

### Running Tests:

From the project root directory:

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
```

### Test Configuration:

Jest is configured with:
- **Environment**: jsdom for DOM APIs
- **Babel**: Transforms JSX and modern JavaScript
- **Mocks**: Audio APIs mocked for testing
- **Coverage**: Configured to report on src/ files
- **Timeout**: 10 seconds for async operations

### Legacy Tests:

The original custom test harness files are preserved but marked as legacy:
- `master-test-runner.js` (legacy)
- `unit-tests.js` (legacy)
- `integration-tests.js` (legacy)
- `test-harness.js` (legacy)

To run legacy tests: `npm run legacy:test`

## Key Features of New Jest Tests:

1. **Modular Structure**: Each test file focuses on specific functionality
2. **Better Async Handling**: Proper async/await and Promise handling
3. **Mocking**: Built-in Jest mocking for external dependencies
4. **Coverage Reports**: Automatic code coverage tracking
5. **Watch Mode**: Automatic re-running on file changes
6. **Parallel Execution**: Tests run in parallel for faster execution

## Node v20.3.0 Compatibility:

- ES modules properly configured
- Modern JavaScript features supported
- Babel transforms ensure compatibility
- Jest configured for Node 20.3.0 target environment
