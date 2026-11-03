module.exports = {
  testEnvironment: 'jsdom',
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
    'src/js/**/*.js',
    'lib/**/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
