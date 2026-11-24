module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: [
    '**/test/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_site/'
  ],
  collectCoverageFrom: [
    'lib/**/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
