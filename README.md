# ts-find-unused

CLI tool to find unused code in TypeScript projects

---

### TODOs

- Add remaining CLI options

- Add a few tests

- Add error handling when `tsconfig.json` can't be found

- Add loading spinner? https://blog.bitsrc.io/build-command-line-spinners-in-node-js-3e432d926d56

- Add some color to `printToStdout` function?

- Documentation

  - [IN_PROGRESS] Add proper header to `README.md`
  - [IN_PROGRESS] Add `Installation Instructions` to `README.md` (just use `npx`?)
  - [READY] Add `CONTRIBUTING.md`
  - [READY] Add `CODE_OF_CONDUCT.md`
  - Add `License` section to `README.md`
  - Add `Built by @aeksco` to `README.md`

  - Add remaining GitHub community files

  - Link issue requesting feedback to VSCode Extension

  - Finalize name of project?

    - `ts-find-unused`
    - `ts-tidy`
    - `ts-tidy-up`
    - `tidy-up-ts`
    - `typescript-tidy`
    - `tidy-typescript`
    - `@ts-tidy/cli`

  - Layout release plan

### TODOs - Stretch Goals

- Update repo to scan for `.ts-find-unused.js` config
- Update to function as monorepo - add `core`, `cli`, `vscode-extension` packages

---

### Installation & Usage

You can run the CLI app locally using [npx]():

```
npx ts-find-unused
```

You can also install `ts-find-unused` as a development dependency in your TypeScript project and run it using an NPM script defined in your `package.json` file:

```json
{
  "scripts": {
    "find-unused": "ts-find-unused"
  }
}
```

You can then run the `yarn find-unused` command to run `ts-find-unused` against your project.

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

### Developing

Run `yarn build` to build the CLI app locally:

```
yarn build
```

You can run the CLI app locally like so:

```
node ./bin/ts-find-unused.js
```

### Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Commander.js](https://github.com/tj/commander.js/)
- [Chalk](https://github.com/chalk/chalk)
- [Jest](https://jestjs.io/)
- [Prettier](http://prettier.io/)
- [ts-morph](https://github.com/dsherret/ts-morph)

### License

Released and distributed under the [MIT License](https://github.com/aeksco/ts-find-unused/blob/main/LICENSE). Build with :heart: by [@aeksco](https://twitter.com/aeksco).
