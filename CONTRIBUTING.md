# Contributing to ts-find-unused

First off, thank you for considering contributing to ts-find-unused! 🎉

It's people like you that make ts-find-unused such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Use the bug report template** when creating an issue.

Include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Node version, TypeScript version)
- Any relevant code samples or error messages

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Explain why this enhancement would be useful
- List any alternative solutions you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** and add tests if applicable
3. **Ensure the test suite passes** (`npm test`)
4. **Ensure code builds** (`npm run build`)
5. **Update documentation** if needed
6. **Create a Pull Request** using the PR template

#### Pull Request Guidelines

- Keep PRs focused on a single concern
- Add tests for new features
- Update documentation for user-facing changes
- Follow the existing code style
- Write clear, descriptive commit messages

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- TypeScript knowledge
- Git

### Setup Steps

```bash
# 1. Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/ts-find-unused.git
cd ts-find-unused

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Run tests
npm test

# 5. Run locally
node bin/ts-find-unused.js --help
```

### Project Structure

```
ts-find-unused/
├── src/
│   ├── bin/            # CLI entry point
│   ├── commands/       # Command implementations
│   ├── __tests__/      # Test files
│   ├── scanProject.ts  # Project scanning logic
│   ├── scanFile.ts     # File scanning logic
│   ├── findUnusedIdentifiers.ts  # Core detection logic
│   ├── getOutput.ts    # Output formatting
│   └── types.ts        # TypeScript types
├── bin/                # Executable entry point
├── config.example.js   # Example configuration
└── README.md
```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add support for monorepo detection
Fix crash when tsconfig.json is missing
Update documentation for v2.0 migration
```

### TypeScript Style Guide

- Use TypeScript strict mode (`"strict": true`)
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Use TypeScript types, avoid `any` when possible
- Follow existing formatting (we use Prettier)

**Formatting:**

We use Prettier for code formatting. Before committing:

```bash
npm run build  # This runs prettier automatically
```

**Type Safety:**

```typescript
// ✅ Good
function processSymbol(symbol: Symbol): UnreferencedSymbol | null {
  // ...
}

// ❌ Avoid
function processSymbol(symbol: any): any {
  // ...
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing features
- Aim for meaningful test coverage
- Use descriptive test names

Example:

```typescript
describe("scanProject", () => {
  test("returns array of unused symbols", () => {
    const results = scanProject({
      projectRoot,
      tsConfigFilePath,
      excludeFiles: [],
      ignoreUsagesIn: [],
      ignoreUsagesInRegex: [],
      logLevel: LogLevels.none,
      checkEnumMembers: true,
    });

    expect(Array.isArray(results)).toBe(true);
  });
});
```

## Development Workflow

### Before Starting Work

1. Check existing issues and PRs to avoid duplicates
2. Create or comment on an issue to discuss your approach
3. Wait for maintainer feedback on larger changes

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes with clear, atomic commits
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Build successfully: `npm run build`
6. Update documentation if needed

### Submitting Changes

1. Push to your fork: `git push origin feature/my-feature`
2. Open a Pull Request with a clear title and description
3. Link any related issues
4. Respond to review feedback promptly
5. Squash commits if requested

## Questions?

Feel free to:
- Open a [Discussion](https://github.com/aeksco/ts-find-unused/discussions) for questions
- Reach out to maintainers on Twitter: [@aeksco](https://twitter.com/aeksco)
- Check existing [Issues](https://github.com/aeksco/ts-find-unused/issues) for similar questions

## Recognition

Contributors will be:
- Listed in our [Contributors](https://github.com/aeksco/ts-find-unused/graphs/contributors) page
- Mentioned in release notes for significant contributions
- Credited in commit messages

Thank you for contributing! 🙏
