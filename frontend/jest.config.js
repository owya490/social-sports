/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@components/(.*)$": "<rootDir>/components/$1",
    "^@svgs/(.*)$": "<rootDir>/svgs/$1",
  },
};
