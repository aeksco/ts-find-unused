# ts-find-unused

CLI tool to find unused code in TypeScript projects

---

### TODOs

- Add remaining CLI options - what else here????

- Add error handling when `tsconfig.json` can't be found

- Add loading spinner? https://blog.bitsrc.io/build-command-line-spinners-in-node-js-3e432d926d56

- Add some color to `printToStdout` function?

- Documentation

  - [IN_PROGRESS] Add proper header to `README.md`
  - [IN_PROGRESS] Add `Installation Instructions` to `README.md` (just use `npx`?)
  - [READY] Add `CONTRIBUTING.md`
  - [IN_PROGRESS] Add PR template
  - [READY] Add issue template
  - [READY] Add .vscode directory w/ recommended extensions
  - [READY] Add .github/DONATE configuration
  - [READY] Update repo to scan for `.ts-find-unused.js` config
  - [READY] Add option to fail when unused code is detected?
  - [READY] Add note -> you will need `noUnusedLocals` turned on in your `tsconfig.json` to find unused locals.

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

---

### Installation & Usage

You can run the CLI app locally using [npx](https://www.npmjs.com/package/npx):

```console
[aeksco@local][my-project]$ npx ts-find-unused [...options]
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

**Ignore Patterns** (comma separated)

- `ts-find-unused /path/to/project --ignorePatterns=__tests__,stories`

**Reference Ignore Patterns** (comma separated)

- `ts-find-unused /path/to/project --reference-ignore-patterns=index.ts`

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
