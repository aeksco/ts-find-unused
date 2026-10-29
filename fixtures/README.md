# Test fixtures

Each directory is a tiny standalone TypeScript project with a known answer, scanned by
`src/__tests__/transitive.test.ts`. They live outside `src/` so that neither the build
nor the self-scan test picks them up.

| Fixture     | Exercises                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `chain`     | A three-deep chain of dead code, same-file helpers, types and enum members |
| `cycle`     | Two dead functions that call each other, plus a live mutual recursion      |
| `barrel`    | `export { x } from` re-exports, with and without `reexportsAreUsages`      |
| `direct`    | Import-only references, self recursion, local `export { x }`               |
| `destructure` | `const { a, b } = obj` checked per binding, with one-line labels          |
| `excluded`  | A declaration in an excluded file keeping its dependencies alive           |
| `removable` | Which files qualify as removable and which do not                          |
