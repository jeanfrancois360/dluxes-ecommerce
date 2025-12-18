/**
 * Jest Test Setup
 *
 * Global test configuration and setup for all test suites
 */

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests but keep error and warn
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};
