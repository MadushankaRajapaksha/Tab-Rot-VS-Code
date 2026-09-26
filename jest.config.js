module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^vscode$': '<rootDir>/tests/mocks/vscode.ts'
  }
};
