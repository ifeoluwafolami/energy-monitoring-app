module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'], // Only test files inside `tests/` folder
  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/server.ts' // Exclude server entry point
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Setup files (if you need global test setup)
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Verbose output
  verbose: true
};