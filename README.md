# ts-find-unused

CLI tool to find unused code in TypeScript projects

---

### TODOs

- Add `prettier` dependency for formatting markdown,json output

- Add remaining CLI options

- Add a few tests

- Add error handling when `tsconfig.json` can't be found

- Add some color to `printToStdout` function

- Documentation

  - Add proper header to `README.md`
  - Add `Installation Instructions` to `README.md` (just use `npx`?)
  - Add `CONTRIBUTING.md`
  - Add `CODE_OF_CONDUCT.md`
  - Add `License` section to `README.md`
  - Add `Built by @aeksco` to `README.md`
  - Add remaining GitHub community files
  - Link issue requesting feedback to VSCode Extension
  - Finalize name of project (maybe rename to `ts-tidy` / `ts-tidy-up` / `tidy-up-ts` / `typescript-tidy` / `tidy-typescript` / `@ts-tidy/cli`)
  - Layout release plan

### TODOs - Stretch Goals

- Update to function as monorepo - add `core`, `cli`, `vscode-extension` packages

---

### Example Usage

**Basic / default:**

- `ts-find-unused /path/to/project`

**Debug flag:**

- `ts-find-unused /path/to/project --debug`

- `ts-find-unused /path/to/project -d`

**tsconfig.json path:** (todo - make this the default?)

- `ts-find-unused /path/to/project --tsconfigPath=/path/to/project/tsconfig-test.json`

**Ignore Patterns** (comma separated)

- `ts-find-unused /path/to/project --ignorePatterns=__tests__,stories`

**Output Format**

- `ts-find-unused /path/to/project --outputFormat=txt` (default)

- `ts-find-unused /path/to/project --outputFormat=markdown`

- `ts-find-unused /path/to/project --outputFormat=json`

**Output Destination**

- `ts-find-unused /path/to/project --outputDestination=./unused.txt`

- `ts-find-unused /path/to/project --outputFormat=markdown --outputDestination=./unused.md`

- `ts-find-unused /path/to/project --outputFormat=json --outputDestination=./unused.json`

### Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Commander.js](https://github.com/tj/commander.js/)
- [Chalk](https://github.com/chalk/chalk)
- [Jest](https://jestjs.io/)
- [Prettier](http://prettier.io/)
- [ts-morph](https://github.com/dsherret/ts-morph)
