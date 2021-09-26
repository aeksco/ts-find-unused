# ts-find-unused

CLI tool to find unused code in TypeScript projects

---

### TODOs

- Add prettier dependency for formatting markdown,json

---

### Example Usage

**Basic / default:**

- `ts-find-unused /path/to/project`

**Debug flag:**

- `ts-find-unused /path/to/project --debug`

- `ts-find-unused /path/to/project -d`

**tsconfig.json path:**

- `ts-find-unused /path/to/project --tsconfigPath=/path/to/project/tsconfig-test.json`

**Ignore Patterns**

- `ts-find-unused /path/to/project --ignorePatterns=__tests__,stories`

**Output Format**

- `ts-find-unused /path/to/project --outputFormat=txt` (default)

- `ts-find-unused /path/to/project --outputFormat=markdown`

- `ts-find-unused /path/to/project --outputFormat=json`

**Output Destination**

- `ts-find-unused /path/to/project --outputDestination=./unused.txt`

- `ts-find-unused /path/to/project --outputFormat=markdown --outputDestination=./unused.md`

- `ts-find-unused /path/to/project --outputFormat=json --outputDestination=./unused.json`
