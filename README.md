# ts-find-unused

<p align="center">
  <strong>Find unused code in your TypeScript projects</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ts-find-unused"><img src="https://img.shields.io/npm/v/ts-find-unused.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/ts-find-unused"><img src="https://img.shields.io/npm/dm/ts-find-unused.svg" alt="npm downloads"></a>
  <a href="https://github.com/aeksco/ts-find-unused/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
</p>

A powerful CLI tool that analyzes your TypeScript codebase to find unused:
- 🔍 Interfaces, Classes, Enums, Functions, Type Aliases, Variables
- 📦 Individual enum members
- 🎯 Cross-file references
- 🔧 Smart filtering with patterns and regex

---

## 📦 Installation

### Quick Start (no installation needed)

Run directly with npx:

```bash
npx ts-find-unused
```

### Install as Dev Dependency

```bash
npm install --save-dev ts-find-unused
# or
yarn add -D ts-find-unused
```

Then add to your `package.json` scripts:

```json
{
  "scripts": {
    "find-unused": "ts-find-unused"
  }
}
```

---

## 🚀 Usage

### Basic Usage

```bash
# Scan current directory
npx ts-find-unused

# Scan specific project
npx ts-find-unused --project-path ./my-project

# Use custom tsconfig
npx ts-find-unused --tsconfig-path ./tsconfig.build.json
```

### Common Examples

```bash
# Output to markdown file
npx ts-find-unused --output markdown --destination ./unused.md

# Exclude files from scanning
npx ts-find-unused --exclude-files "/dist/,/__tests__/"

# Ignore usages in test files (mark as unused even if used in tests)
npx ts-find-unused --ignore-usages-in "__tests__" --ignore-usages-in-regex "\\.test\\.tsx?$"

# Fail in CI if unused code found
npx ts-find-unused --fail-on-found

# Debug mode
npx ts-find-unused --debug --log-level verbose
```

---

## ⚙️ Configuration

Create a `.ts-find-unused.config.js` file in your project root:

```javascript
module.exports = {
  // Output format: "txt", "markdown", or "json"
  output: "markdown",

  // Write output to file
  destination: "./unused.md",

  // Exclude files from scanning (won't be checked for unused code)
  excludeFiles: [
    "/dist/",
    "/build/",
    "/__tests__/",
    ".test.",
    ".spec.",
  ],

  // Ignore usages in these files (code used only here will be marked unused)
  ignoreUsagesIn: [
    "/dist/",
    "/__tests__/",
  ],

  // Ignore usages matching regex patterns
  ignoreUsagesInRegex: [
    "\\.test\\.(tsx?|jsx?)$",
    "\\.stories\\.(tsx?|jsx?)$",
  ],

  // Check individual enum members (can be slow on large projects)
  checkEnumMembers: true,

  // Exit with code 1 if unused code found (useful for CI/CD)
  failOnFound: false,
};
```

### Configuration for Next.js Projects

See [`config.example.js`](./config.example.js) for a complete Next.js configuration example.

---

## 📚 CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--exclude-files` | `-e` | Files to exclude from scanning | `[]` |
| `--ignore-usages-in` | `-u` | Ignore usages in these files | `[]` |
| `--ignore-usages-in-regex` | `-ur` | Ignore usages matching regex | `[]` |
| `--output` | `-o` | Output format: txt\|markdown\|json | `txt` |
| `--destination` | `-d` | Write output to file | stdout |
| `--project-path` | `-p` | Project directory path | `.` |
| `--tsconfig-path` | `-t` | Path to tsconfig.json | `./tsconfig.json` |
| `--log-level` | `-l` | Log level: none\|info\|verbose | `none` |
| `--fail-on-found` | | Exit with code 1 if unused found | `false` |
| `--check-enum-members` | | Check for unused enum members | `true` |
| `--no-check-enum-members` | | Skip enum member checking | |
| `--debug` | | Enable debug mode | `false` |
| `--config` | `-c` | Config file path | `./.ts-find-unused.config.js` |

---

## 🔄 Migration Guide (v1.x → v2.0)

In v2.0, configuration parameters were renamed for clarity:

| Old Name (v1.x) | New Name (v2.0+) |
|-----------------|------------------|
| `ignorePatterns` | `excludeFiles` |
| `referenceIgnorePatterns` | `ignoreUsagesIn` |
| `referenceIgnoreRegex` | `ignoreUsagesInRegex` |

**Old names still work** but will show deprecation warnings. Update your configuration:

```javascript
// ❌ Old (deprecated)
module.exports = {
  ignorePatterns: ["/dist/"],
  referenceIgnorePatterns: ["__tests__"],
  referenceIgnoreRegex: ["\\.test\\.tsx?$"],
};

// ✅ New (v2.0+)
module.exports = {
  excludeFiles: ["/dist/"],
  ignoreUsagesIn: ["__tests__"],
  ignoreUsagesInRegex: ["\\.test\\.tsx?$"],
};
```

---

## 💡 Understanding the Parameters

### `excludeFiles` (formerly `ignorePatterns`)

**What it does:** Files matching these patterns will **not be scanned** for unused code at all.

**Use when:** You want to completely skip certain files (e.g., build output, test files, generated code).

**Example:**
```javascript
excludeFiles: [
  "/dist/",      // Build output
  "/__tests__/", // Test files
  ".stories.",   // Storybook files
]
```

### `ignoreUsagesIn` (formerly `referenceIgnorePatterns`)

**What it does:** If a symbol is **only used** in files matching these patterns, it will be marked as unused.

**Use when:** You want to find code that's only used in tests, stories, or example files.

**Example:**
```javascript
ignoreUsagesIn: [
  "__tests__",     // If only used in tests, mark as unused
  "/examples/",    // If only used in examples, mark as unused
]
```

### `ignoreUsagesInRegex` (formerly `referenceIgnoreRegex`)

Same as `ignoreUsagesIn` but uses regex patterns for more precise matching.

**Example:**
```javascript
ignoreUsagesInRegex: [
  "\\.test\\.(tsx?|jsx?)$",    // *.test.ts, *.test.tsx
  "\\.stories\\.(tsx?|jsx?)$", // *.stories.ts, *.stories.tsx
  "/api/.*\\.(tsx?|jsx?)$",    // Next.js API routes
]
```

---

## 🎯 CI/CD Integration

Use `--fail-on-found` to fail your CI pipeline if unused code is detected:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  check-unused-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx ts-find-unused --fail-on-found
```

---

## ⚠️ Important Notes

### TypeScript Configuration

**Note:** `ts-find-unused` finds unused **exports** across files, but does **not** find unused **local variables** within functions.

For unused local variables, enable TypeScript's built-in checking:

```json
// tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Pattern Matching

- `excludeFiles` and `ignoreUsagesIn` use **simple string matching** (`.includes()`), not glob patterns
- Use `ignoreUsagesInRegex` for more complex pattern matching with regular expressions

---

## 🛠️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/aeksco/ts-find-unused.git
cd ts-find-unused

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
node bin/ts-find-unused.js
```

### Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting PRs.

---

## 📖 How It Works

1. **Loads TypeScript Project:** Uses [ts-morph](https://github.com/dsherret/ts-morph) to parse your TypeScript project via `tsconfig.json`

2. **Extracts Symbols:** Identifies all interfaces, classes, enums, functions, type aliases, and variables

3. **Finds References:** Uses TypeScript's language service to find all references to each symbol

4. **Applies Filters:** Filters out references based on your ignore patterns

5. **Reports Unused:** Symbols with no valid references are reported as unused

---

## 🏗️ Built With

- [TypeScript](https://www.typescriptlang.org/) - Language & type checking
- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript compiler API wrapper
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Ora](https://github.com/sindresorhus/ora) - Loading spinner
- [Prettier](https://prettier.io/) - Code formatting
- [Jest](https://jestjs.io/) - Testing

---

## 📝 License

Released and distributed under the [MIT License](./LICENSE).

Built with ❤️ by [@aeksco](https://twitter.com/aeksco)

---

## 🙏 Acknowledgments

Special thanks to all [contributors](https://github.com/aeksco/ts-find-unused/graphs/contributors) who have helped improve this tool!

---

## 📮 Support

- 🐛 [Report a Bug](https://github.com/aeksco/ts-find-unused/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/aeksco/ts-find-unused/issues/new?template=feature_request.md)
- 💬 [Ask a Question](https://github.com/aeksco/ts-find-unused/discussions)

---

<p align="center">
  <sub>If this tool helped you, please consider <a href="https://github.com/sponsors/aeksco">sponsoring</a> or giving it a ⭐️!</sub>
</p>
