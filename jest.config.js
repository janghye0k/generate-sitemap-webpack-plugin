/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
  testPathIgnorePatterns: ['<rootDir>/test/dist/', '<rootDir>/test/fixtures/'],
};
