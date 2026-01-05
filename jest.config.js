module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/src/example/"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  }
};
