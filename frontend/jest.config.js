const nextJest = require("next/jest");

const customJestConfig = {
  /* With custom configuration */
};

const createJestConfig = nextJest({
  dir: "./",
})(customJestConfig);

module.exports = async () => {
  // Create Next.js jest configuration presets
  const jestConfig = await createJestConfig();

  // Custom `moduleNameMapper` configuration
  const moduleNameMapper = {
    ...jestConfig.moduleNameMapper,
    "^@/(.*)$": "<rootDir>/src/$1",
  };

  return { ...jestConfig, moduleNameMapper };
};
