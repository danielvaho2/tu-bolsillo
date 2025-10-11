export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.teardown.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};

